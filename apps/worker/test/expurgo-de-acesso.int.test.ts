import 'reflect-metadata'
import { executarNoContexto, ExpurgoDeAcessoRepository, instrucaoDoLoteDeAcesso, LOTE_DO_EXPURGO, type AlvoDoExpurgoDeAcesso } from '@educa/nucleo'
import { CodigoDeFalhaDeJob } from '@educa/shared'
import { Queue } from 'bullmq'
import { PgDialect } from 'drizzle-orm/pg-core'
import { randomBytes, randomUUID } from 'node:crypto'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { lerAmbienteDeTeste, valorObrigatorio } from '../../../tools/ci/compose.ts'
import { compose, PROCESSOS_DA_FILA } from '../../../tools/testes/compose.ts'
import { AGENDAMENTOS, FILA_DOS_AGENDAMENTOS } from '../src/agendamentos.js'
import type { ConfiguracaoStorage } from '../src/config.js'
import { montarWorker, type WorkerMontado } from '../src/montagem.js'
import { criarExpurgoDeAcesso, TIPO_EXPURGAR_ACESSO } from '../src/processadores/expurgar-acesso.js'
import { BancadaDeFila, configuracaoDoBanco, LogEmMemoria, urlRedisDeFila, vagasPadraoDoAmbiente } from './fila-de-teste.js'

// `registro_acesso`, `sessao` e `convite` do Postgres do compose de teste, com linhas de duas escolas (e a falha de
// login sem escola) dos dois lados de cada prazo. Só o relógio é injetado: 4h30 de amanhã em São Paulo, fora do horário
// letivo (o job não urgente passa pela janela) e de 4h30 a 29h depois do `now()` do banco. As linhas "1 hora além do
// prazo" só saem se o corte vier do relógio injetado, e não do banco.

const ambiente = lerAmbienteDeTeste()
const STORAGE: ConfiguracaoStorage = {
  url: `http://127.0.0.1:${valorObrigatorio(ambiente, 'STORAGE_PORTA_HOST')}`,
  regiao: valorObrigatorio(ambiente, 'STORAGE_REGIAO'),
  bucket: valorObrigatorio(ambiente, 'STORAGE_BUCKET'),
  chaveAcesso: valorObrigatorio(ambiente, 'STORAGE_CHAVE_ACESSO'),
  chaveSecreta: valorObrigatorio(ambiente, 'STORAGE_CHAVE_SECRETA'),
}

const AMANHA_EM_SAO_PAULO = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(Date.now() + 24 * 60 * 60 * 1000))
const AGORA = new Date(`${AMANHA_EM_SAO_PAULO}T04:30:00-03:00`)
const relogio = { agora: () => AGORA }

interface NoDoPlano {
  'Index Name'?: string
  'Node Type'?: string
  Plans?: NoDoPlano[]
}

function nosDoPlano(no: NoDoPlano | undefined): NoDoPlano[] {
  return no === undefined ? [] : [no, ...(no.Plans ?? []).flatMap(nosDoPlano)]
}

/** Cada passo da rotina: as três tabelas por prazo, e a limpeza das contas. */
type Passo = AlvoDoExpurgoDeAcesso | 'conta'

/** O que cada caso semeia: os ids que precisam sair e os que precisam ficar, por tabela. */
interface Semeado {
  sai: Record<AlvoDoExpurgoDeAcesso, string[]>
  fica: Record<AlvoDoExpurgoDeAcesso, string[]>
}

beforeAll(() => {
  // Worker do compose de pé poderia rodar um expurgo agendado no meio da contagem.
  compose('stop', ...PROCESSOS_DA_FILA)
})

describe('sistema.expurgar-acesso', () => {
  let bancada: BancadaDeFila
  const log = new LogEmMemoria('worker-teste')
  const montados: WorkerMontado[] = []
  let semeado: Semeado

  async function inserir(texto: string, valores: unknown[]): Promise<string> {
    const { rows } = await bancada.pool.query<{ id: string }>(texto, valores)
    const id = rows[0]?.id
    if (id === undefined) throw new Error('linha de teste não criada')
    return id
  }

  const usuario = (escolaId: string) => inserir("insert into usuario (escola_id, papel, nome) values ($1, 'aluno', 'Aluno sintético do expurgo') returning id", [escolaId])

  const registro = (escolaId: string | null, usuarioId: string | null, evento: string, ha: string) =>
    inserir(`insert into registro_acesso (escola_id, usuario_id, evento, ip, em) values ($1, $2, $3, '203.0.113.7', $4::timestamptz - $5::interval) returning id`, [
      escolaId,
      usuarioId,
      evento,
      AGORA.toISOString(),
      ha,
    ])

  /** `encerradaHa` nulo é a sessão nunca encerrada; `expiraEm` é o intervalo antes do `AGORA` (negativo é futuro). */
  const sessao = (escolaId: string, usuarioId: string, encerradaHa: string | null, expiraHa: string) =>
    inserir(
      `insert into sessao (escola_id, usuario_id, metodo, familia, refresh_hash, ultimo_uso_em, expira_em, encerrada_em, motivo)
       values ($1, $2, 'matricula', uuidv7(), $3, $4::timestamptz - $6::interval - interval '12 hours', $4::timestamptz - $6::interval,
               case when $5::interval is null then null else $4::timestamptz - $5::interval end,
               case when $5::interval is null then null else 'saida' end)
       returning id`,
      [escolaId, usuarioId, randomBytes(32).toString('hex'), AGORA.toISOString(), encerradaHa, expiraHa],
    )

  const convite = (escolaId: string, usuarioId: string, datas: { usadoHa?: string; revogadoHa?: string; expiraHa: string }) =>
    inserir(
      `insert into convite (escola_id, token_hash, tipo, usuario_id, expira_em, usado_em, revogado_em)
       values ($1, $2, 'coordenador', $3, $4::timestamptz - $5::interval,
               case when $6::interval is null then null else $4::timestamptz - $6::interval end,
               case when $7::interval is null then null else $4::timestamptz - $7::interval end)
       returning id`,
      [escolaId, randomBytes(32).toString('hex'), usuarioId, AGORA.toISOString(), datas.expiraHa, datas.usadoHa ?? null, datas.revogadoHa ?? null],
    )

  /** Duas escolas, cada uma com as linhas dos dois lados de cada prazo, e a falha de login sem escola. */
  async function semear(): Promise<Semeado> {
    const resultado: Semeado = { sai: { registro_acesso: [], sessao: [], convite: [] }, fica: { registro_acesso: [], sessao: [], convite: [] } }
    for (const escolaId of [await bancada.escola(), await bancada.escola()]) {
      const aluno = await usuario(escolaId)
      const { sai, fica } = resultado
      // Registro de acesso: 6 meses do Marco Civil, contados do relógio injetado.
      fica.registro_acesso.push(await registro(escolaId, aluno, 'login', '6 months -1 day'), await registro(escolaId, aluno, 'saida', '1 day'))
      sai.registro_acesso.push(
        await registro(escolaId, aluno, 'login', '6 months 1 day'),
        await registro(escolaId, null, 'login_falho', '7 months'),
        await registro(escolaId, aluno, 'renovacao', '6 months 1 hour'),
      )
      // Sessão: 30 dias depois de encerrada ou, sem encerramento, de expirada.
      fica.sessao.push(
        await sessao(escolaId, aluno, '29 days', '29 days'),
        await sessao(escolaId, aluno, null, '29 days'),
        // Viva: nunca encerrada, expira daqui a 10 horas.
        await sessao(escolaId, aluno, null, '-10 hours'),
        // Encerrada há 29 dias, com a expiração de 12 h lá atrás: vale o encerramento, pelo `coalesce`.
        await sessao(escolaId, aluno, '29 days', '45 days'),
      )
      sai.sessao.push(
        await sessao(escolaId, aluno, '31 days', '31 days'),
        // Só expirada, sem `encerrada_em`.
        await sessao(escolaId, aluno, null, '31 days'),
        await sessao(escolaId, aluno, '30 days 1 hour', '30 days'),
      )
      // Convite: 30 dias depois de usado, revogado ou expirado, o que veio primeiro.
      fica.convite.push(
        await convite(escolaId, aluno, { usadoHa: '29 days', expiraHa: '27 days' }),
        await convite(escolaId, aluno, { revogadoHa: '29 days', expiraHa: '28 days' }),
        await convite(escolaId, aluno, { expiraHa: '29 days' }),
        // Ainda válido: expira daqui a 2 dias.
        await convite(escolaId, aluno, { expiraHa: '-2 days' }),
      )
      sai.convite.push(
        await convite(escolaId, aluno, { usadoHa: '31 days', expiraHa: '29 days' }),
        await convite(escolaId, aluno, { revogadoHa: '31 days', expiraHa: '29 days' }),
        await convite(escolaId, aluno, { expiraHa: '31 days' }),
      )
    }
    // A falha por e-mail, antes de haver escola: sem escola onde aplicar retenção própria, sai pelo mesmo prazo.
    resultado.sai.registro_acesso.push(await registro(null, null, 'login_falho', '6 months 1 day'))
    resultado.fica.registro_acesso.push(await registro(null, null, 'login_falho', '6 months -1 day'))
    return resultado
  }

  async function restantes(alvo: AlvoDoExpurgoDeAcesso, ids: readonly string[]): Promise<string[]> {
    const { rows } = await bancada.pool.query<{ id: string }>(`select id from ${alvo} where id = any($1::uuid[]) order by id`, [ids])
    return rows.map(({ id }) => id)
  }

  /** Confere, por tabela, que todo "sai" saiu e todo "fica" ficou. */
  async function conferir(): Promise<void> {
    for (const alvo of ['registro_acesso', 'sessao', 'convite'] as const) {
      expect(await restantes(alvo, semeado.sai[alvo]), `${alvo}: vencidos`).toEqual([])
      expect(await restantes(alvo, semeado.fica[alvo]), `${alvo}: no prazo`).toEqual([...semeado.fica[alvo]].sort())
    }
  }

  /** Roda como o worker roda um job `sistema.*`: no contexto da rotina do sistema. */
  const expurgar = (lotes: Array<[Passo, number]> = [], lote?: number) => {
    const repositorio = new ExpurgoDeAcessoRepository(bancada.banco)
    const processador = criarExpurgoDeAcesso({
      repositorio: {
        apagarLoteVencido: async (alvo, agora, limite) => {
          const apagadas = await repositorio.apagarLoteVencido(alvo, agora, limite)
          lotes.push([alvo, apagadas])
          return apagadas
        },
        limparLoteDeContasSemUso: async (agora, limite) => {
          const limpas = await repositorio.limparLoteDeContasSemUso(agora, limite)
          lotes.push(['conta', limpas])
          return limpas
        },
      },
      relogio,
      logger: log.logger,
      ...(lote === undefined ? {} : { lote }),
    })
    const jobId = randomUUID()
    return executarNoContexto({ requisicaoId: randomUUID(), rotinaDoSistema: true }, () => processador({}, { jobId, tentativa: 1, chaveIdempotencia: jobId }))
  }

  beforeEach(async () => {
    bancada = new BancadaDeFila()
    await bancada.limparRegistro()
    log.linhas.length = 0
    semeado = await semear()
  }, 60_000)

  afterEach(async () => {
    await Promise.all(montados.splice(0).map((montado) => montado.encerrar()))
    const todos = (alvo: AlvoDoExpurgoDeAcesso) => [...semeado.sai[alvo], ...semeado.fica[alvo]]
    await bancada.pool.query('delete from registro_acesso where id = any($1::uuid[])', [todos('registro_acesso')])
    await bancada.pool.query('delete from sessao where id = any($1::uuid[])', [todos('sessao')])
    await bancada.pool.query('delete from convite where id = any($1::uuid[])', [todos('convite')])
    await bancada.limparRegistro()
    await bancada.fechar()
  }, 60_000)

  it('borda: nos limites de cada prazo, contados do relógio injetado, o vencido de todas as escolas (e sem escola) sai, e o que está no prazo fica', async () => {
    await expurgar()
    await conferir()
    // Só as contagens vão ao log, nunca linha: nem id, nem IP.
    const eventos = log.doEvento('acesso.expurgado')
    expect(eventos).toHaveLength(1)
    const [linha] = eventos
    for (const chave of ['registrosDeAcessoTotal', 'sessoesTotal', 'convitesTotal']) expect(linha?.[chave], chave).toEqual(expect.any(Number))
    const texto = log.linhas.join('\n')
    for (const id of Object.values(semeado.sai).flat()) expect(texto.includes(id)).toBe(false)
    expect(texto.includes('203.0.113.7')).toBe(false)
  })

  it('idempotência (D49): rodar de novo depois do fim não apaga nada além do prazo', async () => {
    await expurgar()
    const segunda: Array<[Passo, number]> = []
    await expurgar(segunda)
    expect(segunda).toEqual([
      ['registro_acesso', 0],
      ['sessao', 0],
      ['convite', 0],
      ['conta', 0],
    ])
    await conferir()
  })

  it('concorrência: duas execuções ao mesmo tempo (a reentrega de D49) terminam sem erro e com o mesmo resultado de uma', async () => {
    const primeira: Array<[Passo, number]> = []
    const segunda: Array<[Passo, number]> = []
    await Promise.all([expurgar(primeira), expurgar(segunda)])
    await conferir()
    // Juntas, as duas apagaram pelo menos os vencidos semeados (o banco de teste pode ter outros), e nenhuma falhou.
    for (const alvo of ['registro_acesso', 'sessao', 'convite'] as const) {
      const soma = [...primeira, ...segunda].filter(([deQual]) => deQual === alvo).reduce((total, [, apagadas]) => total + apagadas, 0)
      expect(soma, alvo).toBeGreaterThanOrEqual(semeado.sai[alvo].length)
    }
  })

  it('lotes: cada instrução apaga no máximo um lote, e a rotina segue tabela por tabela até sobrar lote incompleto', async () => {
    const repositorio = new ExpurgoDeAcessoRepository(bancada.banco)
    expect(await repositorio.apagarLoteVencido('sessao', AGORA, 2)).toBe(2)
    expect(await restantes('sessao', semeado.sai.sessao)).toHaveLength(semeado.sai.sessao.length - 2)
    const lotes: Array<[Passo, number]> = []
    await expurgar(lotes, 2)
    // Toda instrução cheia é seguida de outra, e a última de cada tabela vem incompleta.
    for (const alvo of ['registro_acesso', 'sessao', 'convite', 'conta'] as const) {
      const daTabela = lotes.filter(([deQual]) => deQual === alvo).map(([, apagadas]) => apagadas)
      expect(daTabela.slice(0, -1).every((apagadas) => apagadas === 2), alvo).toBe(true)
      expect(daTabela.at(-1), alvo).toBeLessThan(2)
    }
    expect(lotes.map(([alvo]) => alvo).filter((alvo, posicao, todos) => todos.indexOf(alvo) === posicao)).toEqual(['registro_acesso', 'sessao', 'convite', 'conta'])
    await conferir()
  })

  it('borda: a conta que um convite segurava na desativação é limpa quando o convite vence ou é revogado; a com convite válido ou usuário ativo em outra escola fica', async () => {
    const [escolaA, escolaB] = [await bancada.escola(), await bancada.escola()]
    /** Uma conta da equipe com senha, segundo fator, um código de recuperação, o professor desativado em A e a sessão dele ainda aberta. */
    const conta = async () => {
      const contaId = await inserir(
        "insert into conta (email, senha_hash, mfa_segredo_cifrado, mfa_chave_versao, mfa_ativado_em) values ($1, 'hash-sintetico', '\\x00'::bytea, 1, now()) returning id",
        [`equipe-${randomUUID()}@escola.invalid`],
      )
      await bancada.pool.query('insert into codigo_recuperacao (conta_id, hmac) values ($1, $2)', [contaId, randomBytes(32).toString('base64url').slice(0, 43)])
      const professorEmA = await inserir("insert into usuario (escola_id, conta_id, papel, nome, desativado_em) values ($1, $2, 'professor', 'Pessoa sintética', now()) returning id", [escolaA, contaId])
      const sessaoId = await inserir(
        "insert into sessao (escola_id, conta_id, usuario_id, metodo, familia, refresh_hash, expira_em) values ($1, $2, $3, 'email', uuidv7(), $4, now() + interval '12 hours') returning id",
        [escolaA, contaId, professorEmA, randomBytes(32).toString('hex')],
      )
      return { contaId, sessaoId }
    }
    /** O coordenador convidado em B, inativo, com o convite: `expiraHa` é o intervalo antes do `AGORA` (negativo é futuro). */
    const convidada = async (contaId: string, expiraHa: string, revogado = false) => {
      const coordenadorEmB = await inserir("insert into usuario (escola_id, conta_id, papel, nome, desativado_em) values ($1, $2, 'coordenador', 'Pessoa sintética', now()) returning id", [escolaB, contaId])
      await convite(escolaB, coordenadorEmB, revogado ? { revogadoHa: '1 hour', expiraHa } : { expiraHa })
    }
    // Vence uma hora antes do relógio injetado, e depois do `now()` do banco: só sai com o corte do relógio.
    const vencida = await conta()
    await convidada(vencida.contaId, '1 hour')
    const revogada = await conta()
    await convidada(revogada.contaId, '-2 days', true)
    const semNada = await conta()
    const aindaValida = await conta()
    await convidada(aindaValida.contaId, '-2 days')
    const ativaEmB = await conta()
    await inserir("insert into usuario (escola_id, conta_id, papel, nome) values ($1, $2, 'professor', 'Pessoa sintética') returning id", [escolaB, ativaEmB.contaId])

    await expurgar()

    const situacao = async ({ contaId, sessaoId }: { contaId: string; sessaoId: string }) => {
      const { rows } = await bancada.pool.query<Record<string, unknown>>(
        `select c.email is not null as email, c.senha_hash is not null as senha, c.mfa_segredo_cifrado is not null as segredo, c.mfa_ativado_em is not null as mfa,
                (select count(*)::int from codigo_recuperacao r where r.conta_id = c.id) as codigos,
                (select s.motivo from sessao s where s.id = $2) as motivo
         from conta c where c.id = $1`,
        [contaId, sessaoId],
      )
      return rows[0]
    }
    const limpa = { email: false, senha: false, segredo: false, mfa: false, codigos: 0, motivo: 'conta_limpa' }
    const intacta = { email: true, senha: true, segredo: true, mfa: true, codigos: 1, motivo: null }
    for (const [nome, quem] of Object.entries({ vencida, revogada, semNada })) expect(await situacao(quem), nome).toEqual(limpa)
    for (const [nome, quem] of Object.entries({ aindaValida, ativaEmB })) expect(await situacao(quem), nome).toEqual(intacta)
    expect(log.doEvento('acesso.expurgado')[0]?.['contasLimpasTotal']).toEqual(expect.any(Number))
  })

  it('concorrência: o convite que faz commit entre a trava do lote e a limpeza segura a conta; a outra conta travada no mesmo lote é limpa', async () => {
    const escolaId = await bancada.escola()
    /** Conta com e-mail e senha e um coordenador inativo em B, com um convite que já venceu: candidata à limpeza. */
    const candidata = async () => {
      const contaId = await inserir("insert into conta (email, senha_hash) values ($1, 'hash-sintetico') returning id", [`equipe-${randomUUID()}@escola.invalid`])
      const usuarioId = await inserir("insert into usuario (escola_id, conta_id, papel, nome, desativado_em) values ($1, $2, 'coordenador', 'Pessoa sintética', now()) returning id", [escolaId, contaId])
      await convite(escolaId, usuarioId, { expiraHa: '1 day' })
      return { contaId, usuarioId }
    }
    const reconvidada = await candidata()
    const esquecida = await candidata()
    const emailDe = async (contaId: string) => (await bancada.pool.query<{ email: boolean }>('select email is not null as email from conta where id = $1', [contaId])).rows[0]?.email

    // A janela entre a trava e a reconferência: o reconvite (novo convite para o mesmo usuário inativo, que não muda a
    // conta) faz commit noutra conexão com as duas contas já travadas pelo lote.
    const limpas = await new ExpurgoDeAcessoRepository(bancada.banco).limparLoteDeContasSemUso(AGORA, LOTE_DO_EXPURGO, async () => {
      await convite(escolaId, reconvidada.usuarioId, { expiraHa: '-3 days' })
    })

    expect(await emailDe(reconvidada.contaId)).toBe(true)
    expect(await emailDe(esquecida.contaId)).toBe(false)
    expect(limpas).toBeGreaterThanOrEqual(1)
  })

  it('permissão: só a rotina do sistema expurga; um job de escola com esse tipo falha sem apagar nada', async () => {
    const escolaId = await bancada.escola()
    const processador = criarExpurgoDeAcesso({ repositorio: new ExpurgoDeAcessoRepository(bancada.banco), relogio, logger: log.logger })
    const jobId = randomUUID()
    await expect(executarNoContexto({ requisicaoId: randomUUID(), escolaId }, () => processador({}, { jobId, tentativa: 1, chaveIdempotencia: jobId }))).rejects.toMatchObject({
      name: 'FalhaDeJob',
      codigo: CodigoDeFalhaDeJob.DADOS_INVALIDOS,
      definitiva: true,
    })
    for (const alvo of ['registro_acesso', 'sessao', 'convite'] as const) expect(await restantes(alvo, semeado.sai[alvo]), alvo).toHaveLength(semeado.sai[alvo].length)
  })

  it('o lote do registro de acesso e o da sessão descem pelos índices de prazo, sem varrer a tabela', async () => {
    const cliente = await bancada.pool.connect()
    try {
      await cliente.query('begin')
      await cliente.query('analyze registro_acesso')
      await cliente.query('analyze sessao')
      // Com a varredura sequencial proibida, o plano só usa o índice se a expressão dele casar com a da instrução.
      await cliente.query('set local enable_seqscan = off')
      for (const [alvo, indice] of [
        ['registro_acesso', 'registro_acesso_em_idx'],
        ['sessao', 'sessao_fim_idx'],
      ] as const) {
        const { sql: texto, params } = new PgDialect({ casing: 'snake_case' }).sqlToQuery(instrucaoDoLoteDeAcesso(alvo, AGORA, LOTE_DO_EXPURGO))
        const { rows } = await cliente.query<{ 'QUERY PLAN': Array<{ Plan: NoDoPlano }> }>(`explain (format json) ${texto}`, params)
        const nos = nosDoPlano(rows[0]?.['QUERY PLAN'][0]?.Plan)
        expect(nos.map((no) => no['Index Name']).filter(Boolean), alvo).toContain(indice)
        expect(nos.map((no) => no['Node Type']), alvo).not.toContain('Seq Scan')
      }
    } finally {
      await cliente.query('rollback')
      cliente.release()
    }
  })

  it('trilha completa: o agendamento das 4h30 grava o job, o despachante o solta fora do horário letivo, e o worker de lote expurga', async () => {
    expect(AGENDAMENTOS).toContainEqual({ tipo: TIPO_EXPURGAR_ACESSO, padrao: '30 4 * * *' })
    const worker = montarWorker(
      { banco: configuracaoDoBanco(), redisFilaUrl: urlRedisDeFila(), pools: { lote: 2 }, vagasPadrao: vagasPadraoDoAmbiente(), threadsMaximo: 1, storage: STORAGE },
      log.logger,
      { prefixo: bancada.prefixo, relogio, agendamentos: AGENDAMENTOS },
    )
    montados.push(worker)
    bancada.despachante(log, { relogio }).iniciar()
    const fila = new Queue(FILA_DOS_AGENDAMENTOS, { connection: bancada.redis, prefix: bancada.prefixo })
    try {
      await fila.add(TIPO_EXPURGAR_ACESSO, {})
      await expect
        .poll(async () => (await bancada.pool.query<{ estado: string }>('select estado from job_registro where tipo = $1', [TIPO_EXPURGAR_ACESSO])).rows.map(({ estado }) => estado), {
          timeout: 20_000,
          interval: 100,
        })
        .toEqual(['concluido'])
      await conferir()
    } finally {
      await fila.obliterate({ force: true })
      await fila.close()
    }
  })
})
