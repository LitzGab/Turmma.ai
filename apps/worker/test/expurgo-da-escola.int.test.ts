import 'reflect-metadata'
import {
  CATEGORIAS_DO_EXPURGO,
  ConfiguracaoOperacional,
  contextoAtual,
  ConfiguracaoOperacionalRepository,
  EscolasDaRotinaRepository,
  executarNoContexto,
  ExpurgoDaEscolaRepository,
  instrucaoDoLoteDaEscola,
  LOTE_DO_EXPURGO,
  resolverJanela,
  RetencaoDaEscolaRepository,
  type AlvoDoExpurgoDaEscola,
  type CategoriaDoExpurgo,
  type JanelaLetiva,
  type Relogio,
} from '@educa/nucleo'
import { CATEGORIAS_DE_RETENCAO, CHAVES_DE_RETENCAO, CodigoDeFalhaDeJob } from '@educa/shared'
import { PgDialect } from 'drizzle-orm/pg-core'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, onTestFinished } from 'vitest'
import { lerAmbienteDeTeste, valorObrigatorio } from '../../../tools/ci/compose.ts'
import { compose, PROCESSOS_DA_FILA } from '../../../tools/testes/compose.ts'
import { MedidorDeTeste } from '../../../tools/testes/metricas.ts'
import { esperarNaTrava, GatilhoDeParada } from '../../api/test/gatilho-de-parada.js'
import type { ConfiguracaoStorage } from '../src/config.js'
import type { Processador } from '../src/executor.js'
import { MedicaoDoExpurgo } from '../src/medicao-do-expurgo.js'
import { montarWorker } from '../src/montagem.js'
import { chaveDaNoite, criarRotinaDeExpurgo } from '../src/processadores/expurgar-dado-pessoal.js'
import { criarExpurgoDaEscola, TIPO_EXPURGAR_ESCOLA } from '../src/processadores/expurgar-escola.js'
import { BancadaDeFila, configuracaoDoBanco, janelaPadraoDoAmbiente, LogEmMemoria, urlRedisDeFila, vagasPadraoDoAmbiente } from './fila-de-teste.js'

// O expurgo noturno da escola (F3, tarefa 3.0), contra o Postgres do compose de teste: a conversa do Tutor, os sinais e a
// conversa do professor de escolas sintéticas, dos dois lados de cada prazo, contados de um relógio injetado. A escola
// usa o horário letivo padrão (São Paulo, de segunda a sexta, das 7h às 18h): quarta, 7/10/2026, à 1h está fora da
// janela, e às 8h, dentro.

const ambiente = lerAmbienteDeTeste()
const STORAGE: ConfiguracaoStorage = {
  url: `http://127.0.0.1:${valorObrigatorio(ambiente, 'STORAGE_PORTA_HOST')}`,
  regiao: valorObrigatorio(ambiente, 'STORAGE_REGIAO'),
  bucket: valorObrigatorio(ambiente, 'STORAGE_BUCKET'),
  chaveAcesso: valorObrigatorio(ambiente, 'STORAGE_CHAVE_ACESSO'),
  chaveSecreta: valorObrigatorio(ambiente, 'STORAGE_CHAVE_SECRETA'),
}

const QUARTA_1H = new Date('2026-10-07T01:00:00-03:00')
const QUARTA_8H = new Date('2026-10-07T08:00:00-03:00')
const QUINTA_1H = new Date('2026-10-08T01:00:00-03:00')

/**
 * As categorias do catálogo que esta tarefa ainda não apaga, com a tarefa que as traz. A tarefa 5.0 esvazia a lista: aí
 * o catálogo inteiro passa pelo expurgo, e o `it.each` do prazo cobre cada uma.
 */
const PENDENTES_DA_TAREFA: Readonly<Record<string, '4.0' | '5.0'>> = {
  execucao_agente: '4.0',
  texto_do_modelo: '4.0',
  consumo_por_aluno: '4.0',
  autoria_de_artefato: '4.0',
  trabalho_do_aluno: '5.0',
  reivindicacao_decidida: '5.0',
  material_excluido: '5.0',
  vinculo_encerrado: '5.0',
  pessoa_desativada: '5.0',
}

/** Um relógio que o teste avança. */
function relogioEm(inicio: Date): Relogio & { atual: Date } {
  const relogio = { atual: inicio, agora: () => relogio.atual }
  return relogio
}

/** As chaves que uma linha de log desta tarefa pode ter: as do logger e as contagens. Nunca texto de pessoa. */
const CHAVES_DO_LOG = new Set([
  'level',
  'time',
  'servico',
  'requisicaoId',
  'escolaId',
  'evento',
  'tipo',
  'linhasDaCategoriaTotal',
  'linhasTotal',
  'categoriasTotal',
  'escolasTotal',
  'enfileiradosTotal',
  'jaEnfileiradosTotal',
  'falhasTotal',
  'erro',
])

beforeAll(() => {
  // Worker do compose de pé poderia executar o job de expurgo que o teste grava, e apagar no meio da contagem.
  compose('stop', ...PROCESSOS_DA_FILA)
})

describe('retencao.expurgar-escola e sistema.expurgar-dado-pessoal', () => {
  const bancada = new BancadaDeFila()
  const log = new LogEmMemoria('worker-teste')
  const escolas: string[] = []

  afterAll(async () => {
    await bancada.pool.query('delete from job_registro where escola_id = any($1::uuid[])', [escolas])
    await bancada.fechar()
  })

  /** Uma escola nova, com ano em curso, série, turma, aluno e o primeiro professor. */
  async function escolaNova(): Promise<{ escolaId: string; anoId: string; turmaId: string; alunoId: string }> {
    const escolaId = await bancada.escola()
    escolas.push(escolaId)
    const um = async (texto: string, valores: unknown[]): Promise<string> => {
      const { rows } = await bancada.pool.query<{ id: string }>(texto, valores)
      const id = rows[0]?.id
      if (id === undefined) throw new Error('linha de teste não criada')
      return id
    }
    const anoId = await um("insert into ano_letivo (escola_id, ano, inicio, fim, situacao) values ($1, 2026, '2026-02-01', '2026-12-15', 'em_curso') returning id", [escolaId])
    const serieId = await um("insert into serie (escola_id, etapa, ano) values ($1, 'em', 2) returning id", [escolaId])
    const turmaId = await um("insert into turma (escola_id, ano_letivo_id, serie_id, nome) values ($1, $2, $3, '2ºB sintética') returning id", [escolaId, anoId, serieId])
    const alunoId = await um("insert into usuario (escola_id, papel, nome) values ($1, 'aluno', 'Aluno sintético do expurgo') returning id", [escolaId])
    return { escolaId, anoId, turmaId, alunoId }
  }
  type Escola = Awaited<ReturnType<typeof escolaNova>>

  /** Uma execução pendente da escola, que a mensagem e o sinal apontam. */
  async function execucao(escola: Escola, tarefa: 'turno_do_tutor' | 'propor_ferramenta', solicitadaPor: string): Promise<string> {
    const funcao = tarefa === 'turno_do_tutor' ? 'tutor_com_o_aluno' : 'conversa_e_ferramentas'
    const { rows } = await bancada.pool.query<{ id: string }>(
      `insert into execucao_agente (escola_id, ano_letivo_id, funcao, tarefa, solicitada_por, chave_envio, entrada) values ($1, $2, $3, $4, $5, $6, $7) returning id`,
      [escola.escolaId, escola.anoId, funcao, tarefa, solicitadaPor, randomUUID(), JSON.stringify({ tarefa })],
    )
    return rows[0]?.id ?? ''
  }

  async function mensagemTutor(escola: Escola, agora: Date, ha: string): Promise<string> {
    const execucaoId = await execucao(escola, 'turno_do_tutor', escola.alunoId)
    const { rows } = await bancada.pool.query<{ id: string }>(
      `insert into mensagem_tutor (escola_id, ano_letivo_id, turma_id, aluno_id, execucao_id, autor, texto, criada_em)
       values ($1, $2, $3, $4, $5, 'aluno', 'Pergunta sintética do expurgo', $6::timestamptz - $7::interval) returning id`,
      [escola.escolaId, escola.anoId, escola.turmaId, escola.alunoId, execucaoId, agora.toISOString(), ha],
    )
    return rows[0]?.id ?? ''
  }

  async function sinal(escola: Escola, agora: Date, ha: string): Promise<string> {
    const { rows } = await bancada.pool.query<{ id: string }>(
      `insert into sinal_tutor (escola_id, ano_letivo_id, turma_id, aluno_id, tipo, criado_em) values ($1, $2, $3, $4, 'travou', $5::timestamptz - $6::interval) returning id`,
      [escola.escolaId, escola.anoId, escola.turmaId, escola.alunoId, agora.toISOString(), ha],
    )
    return rows[0]?.id ?? ''
  }

  /** A thread de um professor novo com o Assistente, criada `criadaHa` antes do `agora`. */
  async function thread(escola: Escola, agora: Date, criadaHa: string): Promise<{ threadId: string; professorId: string }> {
    const { rows: contas } = await bancada.pool.query<{ id: string }>('insert into conta (email) values ($1) returning id', [`professora-${randomUUID()}@expurgo.invalid`])
    const { rows: professores } = await bancada.pool.query<{ id: string }>(
      "insert into usuario (escola_id, papel, nome, conta_id) values ($1, 'professor', 'Professora sintética', $2) returning id",
      [escola.escolaId, contas[0]?.id],
    )
    const professorId = professores[0]?.id ?? ''
    const { rows } = await bancada.pool.query<{ id: string }>(
      `insert into thread_agente (escola_id, ano_letivo_id, usuario_id, agente, criada_em) values ($1, $2, $3, 'assistente_de_ensino', $4::timestamptz - $5::interval) returning id`,
      [escola.escolaId, escola.anoId, professorId, agora.toISOString(), criadaHa],
    )
    return { threadId: rows[0]?.id ?? '', professorId }
  }

  async function mensagemAgente(escola: Escola, alvo: { threadId: string; professorId: string }, agora: Date, ha: string): Promise<string> {
    const execucaoId = await execucao(escola, 'propor_ferramenta', alvo.professorId)
    const { rows } = await bancada.pool.query<{ id: string }>(
      `insert into mensagem_agente (escola_id, ano_letivo_id, thread_id, execucao_id, autor, conteudo, criada_em)
       values ($1, $2, $3, $4, 'agente', '{"tipo":"texto","texto":"Resposta sintética do expurgo"}', $5::timestamptz - $6::interval) returning id`,
      [escola.escolaId, escola.anoId, alvo.threadId, execucaoId, agora.toISOString(), ha],
    )
    return rows[0]?.id ?? ''
  }

  /**
   * Uma linha da categoria com a idade pedida, na tabela que o expurgo dela apaga. Objeto com o tipo declarado: categoria
   * nova sem semeadura é erro de compilação, e o `it.each` do prazo a cobre sozinho.
   */
  const SEMEAR: Record<CategoriaDoExpurgo, (escola: Escola, agora: Date, ha: string) => Promise<{ tabela: string; id: string }>> = {
    conversa_tutor: async (escola, agora, ha) => ({ tabela: 'mensagem_tutor', id: await mensagemTutor(escola, agora, ha) }),
    sinal_tutor: async (escola, agora, ha) => ({ tabela: 'sinal_tutor', id: await sinal(escola, agora, ha) }),
    // Uma thread velha por escola, com todas as mensagens: só a idade da mensagem decide, e a thread fica com a que fica.
    conversa_professor: async (escola, agora, ha) => {
      const daEscola = threadsSemeadas.get(escola.escolaId) ?? (await thread(escola, agora, '30 months'))
      threadsSemeadas.set(escola.escolaId, daEscola)
      return { tabela: 'mensagem_agente', id: await mensagemAgente(escola, daEscola, agora, ha) }
    },
  }
  const threadsSemeadas = new Map<string, { threadId: string; professorId: string }>()

  async function existe(tabela: string, id: string): Promise<boolean> {
    return ((await bancada.pool.query(`select 1 from ${tabela} where id = $1`, [id])).rowCount ?? 0) > 0
  }

  async function quantas(tabela: string, escolaId: string): Promise<number> {
    const { rows } = await bancada.pool.query<{ total: number }>(`select count(*)::int as total from ${tabela} where escola_id = $1`, [escolaId])
    return rows[0]?.total ?? 0
  }

  async function execucoes(escolaId: string): Promise<Array<{ categoria: string; linhas: number; concluida: boolean }>> {
    const { rows } = await bancada.pool.query<{ categoria: string; linhas: number; concluida: boolean }>(
      'select categoria, linhas, concluida from expurgo_execucao where escola_id = $1 order by em, id',
      [escolaId],
    )
    return rows
  }

  /** O horário letivo da escola do contexto, lido como o worker-lote lê. */
  const janelaDaEscola = () => new ConfiguracaoOperacional<JanelaLetiva>(new ConfiguracaoOperacionalRepository(bancada.banco), (linha) => resolverJanela(janelaPadraoDoAmbiente(), linha))

  function expurgo(relogio: Relogio, opcoes: { lote?: number; repositorio?: ExpurgoDaEscolaRepository } = {}): Processador {
    return criarExpurgoDaEscola({
      repositorio: opcoes.repositorio ?? new ExpurgoDaEscolaRepository(bancada.banco),
      retencao: new RetencaoDaEscolaRepository(bancada.banco),
      janelaDaEscola: janelaDaEscola(),
      relogio,
      logger: log.logger,
      ...(opcoes.lote === undefined ? {} : { lote: opcoes.lote }),
    })
  }

  function rodar(escolaId: string, processador: Processador): Promise<void> {
    const jobId = randomUUID()
    return executarNoContexto({ requisicaoId: randomUUID(), escolaId }, () => processador({}, { jobId, tentativa: 1, chaveIdempotencia: jobId }))
  }

  function rotina(relogio: Relogio, ids: readonly string[]): Processador {
    return criarRotinaDeExpurgo({
      escolas: { listarIds: () => Promise.resolve([...ids]) },
      banco: bancada.banco,
      enfileirador: bancada.enfileirador,
      janelaDaEscola: janelaDaEscola(),
      relogio,
      logger: log.logger,
    })
  }

  function rodarRotina(processador: Processador): Promise<void> {
    const jobId = randomUUID()
    return executarNoContexto({ requisicaoId: randomUUID(), rotinaDoSistema: true }, () => processador({}, { jobId, tentativa: 1, chaveIdempotencia: jobId }))
  }

  async function jobsDoExpurgo(escolaId: string): Promise<Array<{ id: string; chave: string; fila: string; prioridade: number; naoUrgente: boolean; estado: string }>> {
    const { rows } = await bancada.pool.query<{ id: string; chave: string; fila: string; prioridade: number; naoUrgente: boolean; estado: string }>(
      `select id, chave_idempotencia as chave, fila, prioridade, nao_urgente as "naoUrgente", estado from job_registro where escola_id = $1 and tipo = $2 order by criado_em, id`,
      [escolaId, TIPO_EXPURGAR_ESCOLA],
    )
    return rows
  }

  async function ajustar(escolaId: string, categoria: string, meses: number): Promise<void> {
    await bancada.pool.query(
      `insert into retencao_escola (escola_id, categoria, meses, referencia_contrato, alterada_por) values ($1, $2, $3, 1, 'teste-expurgo')
       on conflict (escola_id, categoria) do update set meses = excluded.meses`,
      [escolaId, categoria, meses],
    )
  }

  describe('catálogo', () => {
    it('toda categoria do catálogo passa pelo expurgo desta tarefa ou está pendente de uma tarefa nomeada, e nunca as duas', () => {
      const pendentes = Object.keys(PENDENTES_DA_TAREFA)
      expect(CATEGORIAS_DO_EXPURGO.filter((categoria) => pendentes.includes(categoria))).toEqual([])
      expect([...CATEGORIAS_DO_EXPURGO, ...pendentes].sort()).toEqual([...CHAVES_DE_RETENCAO].sort())
    })
  })

  describe('prazo por categoria', () => {
    it.each(CATEGORIAS_DO_EXPURGO)('%s: um dia antes do prazo a linha fica, um dia depois sai, a de outra escola com a mesma idade fica, e reexecutar não apaga mais nada', async (categoria) => {
      const a = await escolaNova()
      const b = await escolaNova()
      const meses = CATEGORIAS_DE_RETENCAO[categoria].padrao
      const fica = await SEMEAR[categoria](a, QUARTA_1H, `${String(meses)} months - 1 day`)
      const sai = await SEMEAR[categoria](a, QUARTA_1H, `${String(meses)} months 1 day`)
      const deB = await SEMEAR[categoria](b, QUARTA_1H, `${String(meses)} months 1 day`)

      await rodar(a.escolaId, expurgo(relogioEm(QUARTA_1H)))
      expect(await existe(sai.tabela, sai.id)).toBe(false)
      expect(await existe(fica.tabela, fica.id)).toBe(true)
      // O job de A nunca alcança B (regra 10), nem com a linha vencida.
      expect(await existe(deB.tabela, deB.id)).toBe(true)
      expect((await execucoes(a.escolaId)).find((linha) => linha.categoria === categoria)).toEqual({ categoria, linhas: 1, concluida: true })
      expect(await execucoes(b.escolaId)).toEqual([])

      await rodar(a.escolaId, expurgo(relogioEm(QUARTA_1H)))
      expect(await existe(fica.tabela, fica.id)).toBe(true)
      expect((await execucoes(a.escolaId)).filter((linha) => linha.categoria === categoria)).toEqual([
        { categoria, linhas: 1, concluida: true },
        { categoria, linhas: 0, concluida: true },
      ])
    })

    it('toda categoria percorrida grava a sua linha, mesmo com zero, na ordem do catálogo', async () => {
      const a = await escolaNova()
      await rodar(a.escolaId, expurgo(relogioEm(QUARTA_1H)))
      expect(await execucoes(a.escolaId)).toEqual(CATEGORIAS_DO_EXPURGO.map((categoria) => ({ categoria, linhas: 0, concluida: true })))
    })
  })

  describe('ajuste da escola', () => {
    it('encurtar o prazo em A tira a linha de A e mantém a de B, com a mesma idade; aumentar depois não devolve nada', async () => {
      const a = await escolaNova()
      const b = await escolaNova()
      await ajustar(a.escolaId, 'conversa_tutor', 6)
      const deA = await mensagemTutor(a, QUARTA_1H, '7 months')
      const deB = await mensagemTutor(b, QUARTA_1H, '7 months')
      await rodar(a.escolaId, expurgo(relogioEm(QUARTA_1H)))
      await rodar(b.escolaId, expurgo(relogioEm(QUARTA_1H)))
      expect(await existe('mensagem_tutor', deA)).toBe(false)
      expect(await existe('mensagem_tutor', deB)).toBe(true)

      await ajustar(a.escolaId, 'conversa_tutor', 24)
      await rodar(a.escolaId, expurgo(relogioEm(QUARTA_1H)))
      expect(await existe('mensagem_tutor', deA)).toBe(false)
      expect(await quantas('mensagem_tutor', a.escolaId)).toBe(0)
      expect(await existe('mensagem_tutor', deB)).toBe(true)
    })
  })

  describe('thread do professor', () => {
    it('a thread com mensagem no prazo fica; a vazia criada antes do corte sai; a vazia recém-aberta fica; a vazia antiga de outra escola fica', async () => {
      const a = await escolaNova()
      const b = await escolaNova()
      const vaziaAntigaDeB = await thread(b, QUARTA_1H, '13 months')
      const comMensagemNoPrazo = await thread(a, QUARTA_1H, '30 months')
      const velha = await mensagemAgente(a, comMensagemNoPrazo, QUARTA_1H, '13 months')
      const nova = await mensagemAgente(a, comMensagemNoPrazo, QUARTA_1H, '1 month')
      const soVencidas = await thread(a, QUARTA_1H, '30 months')
      await mensagemAgente(a, soVencidas, QUARTA_1H, '13 months')
      const vaziaAntiga = await thread(a, QUARTA_1H, '13 months')
      const vaziaRecente = await thread(a, QUARTA_1H, '1 day')

      await rodar(a.escolaId, expurgo(relogioEm(QUARTA_1H)))
      expect(await existe('mensagem_agente', velha)).toBe(false)
      expect(await existe('mensagem_agente', nova)).toBe(true)
      expect(await existe('thread_agente', comMensagemNoPrazo.threadId)).toBe(true)
      expect(await existe('thread_agente', soVencidas.threadId)).toBe(false)
      expect(await existe('thread_agente', vaziaAntiga.threadId)).toBe(false)
      expect(await existe('thread_agente', vaziaRecente.threadId)).toBe(true)
      expect(await existe('thread_agente', vaziaAntigaDeB.threadId)).toBe(true)
      // A linha da conversa do professor conta as duas mensagens e as duas threads que saíram.
      expect((await execucoes(a.escolaId)).find((linha) => linha.categoria === 'conversa_professor')).toEqual({ categoria: 'conversa_professor', linhas: 4, concluida: true })
    })

    it('a thread que ganhou mensagem entre a visão da escolha e a trava não sai: a segunda instrução confere de novo', async () => {
      const a = await escolaNova()
      const alvo = await thread(a, QUARTA_1H, '13 months')
      const execucaoId = await execucao(a, 'propor_ferramenta', alvo.professorId)
      const repositorio = new ExpurgoDaEscolaRepository(bancada.banco)
      // A corrida que a reconferência fecha: a mensagem confirmada depois de a primeira instrução tirar a visão dela e antes
      // de ela travar a thread. Com a trava tomada, toda mensagem nova espera o fim do lote pela FK; o teste reproduz o
      // estado da corrida gravando a mensagem na janela entre a trava e a reconferência, com a FK desligada só nessa
      // conexão (`session_replication_role`), que é o que a mensagem confirmada antes da trava deixa no banco.
      const gravarNaJanela = async () => {
        const cliente = await bancada.pool.connect()
        try {
          await cliente.query("set session_replication_role = 'replica'")
          await cliente.query(
            `insert into mensagem_agente (escola_id, ano_letivo_id, thread_id, execucao_id, autor, conteudo, criada_em)
             values ($1, $2, $3, $4, 'agente', '{"tipo":"texto","texto":"Resposta sintética na janela"}', $5)`,
            [a.escolaId, a.anoId, alvo.threadId, execucaoId, QUARTA_1H.toISOString()],
          )
        } finally {
          await cliente.query("set session_replication_role = 'origin'")
          cliente.release()
        }
      }
      const lote = await executarNoContexto({ requisicaoId: randomUUID(), escolaId: a.escolaId }, () => repositorio.apagarLote('thread_agente', QUARTA_1H, 12, LOTE_DO_EXPURGO, gravarNaJanela))
      expect(lote).toEqual({ linhas: 0, cheio: false })
      expect(await existe('thread_agente', alvo.threadId)).toBe(true)
      expect(await quantas('mensagem_agente', a.escolaId)).toBe(1)
    })
  })

  describe('janela letiva', () => {
    it('a janela abre no meio: a categoria interrompida grava `false` com a contagem parcial, as anteriores `true`, a seguinte nem começa; a noite seguinte começa pela pendente, dá a volta e grava `true`', async () => {
      const a = await escolaNova()
      for (let indice = 0; indice < 5; indice += 1) await sinal(a, QUARTA_1H, '13 months')
      await mensagemTutor(a, QUARTA_1H, '13 months')
      const relogio = relogioEm(QUARTA_1H)
      // A janela abre logo depois do primeiro lote de sinais: o lote seguinte já a vê aberta.
      const real = new ExpurgoDaEscolaRepository(bancada.banco)
      const abreDepoisDoPrimeiroSinal = Object.assign(Object.create(real) as ExpurgoDaEscolaRepository, {
        apagarLote: async (alvo: AlvoDoExpurgoDaEscola, agora: Date, meses: number, limite: number) => {
          const lote = await real.apagarLote(alvo, agora, meses, limite)
          if (alvo === 'sinal_tutor') relogio.atual = QUARTA_8H
          return lote
        },
      })
      await rodar(a.escolaId, expurgo(relogio, { lote: 2, repositorio: abreDepoisDoPrimeiroSinal }))
      expect(await execucoes(a.escolaId)).toEqual([
        { categoria: 'conversa_tutor', linhas: 1, concluida: true },
        { categoria: 'sinal_tutor', linhas: 2, concluida: false },
      ])
      expect(await quantas('sinal_tutor', a.escolaId)).toBe(3)

      // Na noite seguinte, uma mensagem nova vencida: se a noite começasse pelo catálogo, a conversa do Tutor viria antes.
      await mensagemTutor(a, QUINTA_1H, '13 months')
      await rodar(a.escolaId, expurgo(relogioEm(QUINTA_1H), { lote: 2 }))
      expect((await execucoes(a.escolaId)).slice(2)).toEqual([
        { categoria: 'sinal_tutor', linhas: 3, concluida: true },
        { categoria: 'conversa_professor', linhas: 0, concluida: true },
        { categoria: 'conversa_tutor', linhas: 1, concluida: true },
      ])
      expect(await quantas('sinal_tutor', a.escolaId)).toBe(0)
      expect(log.doEvento('retencao.expurgo_interrompido').some((linha) => linha['escolaId'] === a.escolaId && linha['tipo'] === 'sinal_tutor' && linha['linhasDaCategoriaTotal'] === 2 && linha['linhasTotal'] === 3)).toBe(true)
    })

    it('o lote que falha numa categoria do meio grava ela como não concluída e o erro sobe; a noite seguinte começa por ela', async () => {
      const a = await escolaNova()
      const real = new ExpurgoDaEscolaRepository(bancada.banco)
      const falhaNoSinal = Object.assign(Object.create(real) as ExpurgoDaEscolaRepository, {
        apagarLote: (alvo: AlvoDoExpurgoDaEscola, agora: Date, meses: number, limite: number) =>
          alvo === 'sinal_tutor' ? Promise.reject(new Error('canceling statement due to statement timeout')) : real.apagarLote(alvo, agora, meses, limite),
      })
      const segunda = new Date('2026-10-05T01:00:00-03:00')
      const terca = new Date('2026-10-06T01:00:00-03:00')
      await expect(rodar(a.escolaId, expurgo(relogioEm(segunda), { repositorio: falhaNoSinal }))).rejects.toThrow('statement timeout')
      expect(await execucoes(a.escolaId)).toEqual([
        { categoria: 'conversa_tutor', linhas: 0, concluida: true },
        { categoria: 'sinal_tutor', linhas: 0, concluida: false },
      ])
      // Na terça, a noite começa pela pendente e falha de novo nela.
      await expect(rodar(a.escolaId, expurgo(relogioEm(terca), { repositorio: falhaNoSinal }))).rejects.toThrow('statement timeout')
      expect((await execucoes(a.escolaId)).slice(2)).toEqual([{ categoria: 'sinal_tutor', linhas: 0, concluida: false }])
      const medidor = new MedidorDeTeste()
      onTestFinished(() => medidor.encerrar())
      await new MedicaoDoExpurgo({
        escolas: { listarIds: () => Promise.resolve([a.escolaId]) },
        repositorio: real,
        janelaDaEscola: janelaDaEscola(),
        relogio: relogioEm(new Date('2026-10-07T12:00:00-03:00')),
        logger: log.logger,
        medidor: medidor.medidor,
      }).medir()
      expect((await medidor.pontos('expurgo.noites_incompletas')).map(({ valor }) => valor)).toEqual([2])
    })

    it('a escola cujo expurgo falha no primeiro lote desde a primeira noite ganha a linha `false` em cada noite, e a série chega a 2', async () => {
      const a = await escolaNova()
      const real = new ExpurgoDaEscolaRepository(bancada.banco)
      const falhaSempre = Object.assign(Object.create(real) as ExpurgoDaEscolaRepository, {
        apagarLote: () => Promise.reject(new Error('erro de SQL')),
      })
      // Segunda e terça, as duas primeiras noites da escola: nenhuma categoria termina, e só a linha do `catch` fica.
      for (const noite of [new Date('2026-10-05T01:00:00-03:00'), new Date('2026-10-06T01:00:00-03:00')]) {
        await expect(rodar(a.escolaId, expurgo(relogioEm(noite), { repositorio: falhaSempre }))).rejects.toThrow('erro de SQL')
      }
      expect(await execucoes(a.escolaId)).toEqual([
        { categoria: 'conversa_tutor', linhas: 0, concluida: false },
        { categoria: 'conversa_tutor', linhas: 0, concluida: false },
      ])
      const medidor = new MedidorDeTeste()
      onTestFinished(() => medidor.encerrar())
      await new MedicaoDoExpurgo({
        escolas: { listarIds: () => Promise.resolve([a.escolaId]) },
        repositorio: real,
        janelaDaEscola: janelaDaEscola(),
        relogio: relogioEm(new Date('2026-10-07T12:00:00-03:00')),
        logger: log.logger,
        medidor: medidor.medidor,
      }).medir()
      expect((await medidor.pontos('expurgo.noites_incompletas')).map(({ valor }) => valor)).toEqual([2])
    })

    it('se nem a linha `false` grava, fica o aviso e sobe o erro do lote, e não o da gravação', async () => {
      const a = await escolaNova()
      const real = new ExpurgoDaEscolaRepository(bancada.banco)
      const tudoFalha = Object.assign(Object.create(real) as ExpurgoDaEscolaRepository, {
        apagarLote: () => Promise.reject(new Error('erro do lote')),
        registrar: () => Promise.reject(new Error('banco fora')),
      })
      await expect(rodar(a.escolaId, expurgo(relogioEm(QUARTA_1H), { repositorio: tudoFalha }))).rejects.toThrow('erro do lote')
      expect(log.doEvento('retencao.registro_nao_gravado').filter((linha) => linha['escolaId'] === a.escolaId)).toEqual([
        expect.objectContaining({ tipo: 'conversa_tutor', erro: expect.objectContaining({ tipo: 'Error' }) }),
      ])
      expect(await execucoes(a.escolaId)).toEqual([])
    })

    it('o corte é contado do `agora` do começo do job, mesmo com o relógio andando entre os lotes', async () => {
      const a = await escolaNova()
      // Meia hora antes de vencer, contado do começo: fica. Contado de qualquer leitura seguinte do relógio, venceria.
      const quaseVencida = await mensagemTutor(a, QUARTA_1H, '12 months - 30 minutes')
      let leituras = 0
      const andando: Relogio = { agora: () => new Date(QUARTA_1H.getTime() + leituras++ * 60 * 60_000) }
      await rodar(a.escolaId, expurgo(andando))
      expect(await existe('mensagem_tutor', quaseVencida)).toBe(true)
      expect(leituras).toBeGreaterThan(2)
    })

    it('com a janela aberta desde o começo, nada sai: a primeira categoria grava zero e `false`', async () => {
      const a = await escolaNova()
      const vencida = await mensagemTutor(a, QUARTA_8H, '13 months')
      await rodar(a.escolaId, expurgo(relogioEm(QUARTA_8H)))
      expect(await existe('mensagem_tutor', vencida)).toBe(true)
      expect(await execucoes(a.escolaId)).toEqual([{ categoria: 'conversa_tutor', linhas: 0, concluida: false }])
    })

    it('o horário letivo é o da escola: a escola que configurou o dia inteiro fora de aula expurga às 8h de quarta', async () => {
      const a = await escolaNova()
      await bancada.configurarEscola(a.escolaId, { diasLetivos: [6] })
      const vencida = await mensagemTutor(a, QUARTA_8H, '13 months')
      await rodar(a.escolaId, expurgo(relogioEm(QUARTA_8H)))
      expect(await existe('mensagem_tutor', vencida)).toBe(false)
      expect((await execucoes(a.escolaId))[0]).toEqual({ categoria: 'conversa_tutor', linhas: 1, concluida: true })
    })
  })

  describe('lotes', () => {
    it('5.001 linhas vencidas saem em dois lotes de até 5.000, com uma linha só de execução; a categoria vazia grava zero', async () => {
      const a = await escolaNova()
      // 2.501 execuções, cada uma com a pergunta e a resposta do Tutor, menos uma resposta: 5.001 mensagens vencidas.
      await bancada.semear(
        `with execucoes as (
           insert into execucao_agente (escola_id, ano_letivo_id, funcao, tarefa, solicitada_por, chave_envio, entrada)
           select $1, $2, 'tutor_com_o_aluno', 'turno_do_tutor', $3, gen_random_uuid(), '{"tarefa":"turno_do_tutor"}' from generate_series(1, 2501)
           returning id
         ), numeradas as (select id, row_number() over () as n from execucoes)
         insert into mensagem_tutor (escola_id, ano_letivo_id, turma_id, aluno_id, execucao_id, autor, texto, criada_em)
         select $1, $2, $4, $3, numeradas.id, autor, 'Mensagem sintética em volume', $5::timestamptz - interval '13 months'
         from numeradas cross join (values ('aluno'), ('tutor')) as autores(autor)
         where not (numeradas.n = 1 and autor = 'tutor')`,
        [a.escolaId, a.anoId, a.alunoId, a.turmaId, QUARTA_1H.toISOString()],
      )
      expect(await quantas('mensagem_tutor', a.escolaId)).toBe(5_001)
      const real = new ExpurgoDaEscolaRepository(bancada.banco)
      const lotes: Array<{ alvo: AlvoDoExpurgoDaEscola; linhas: number }> = []
      const contando = Object.assign(Object.create(real) as ExpurgoDaEscolaRepository, {
        apagarLote: async (alvo: AlvoDoExpurgoDaEscola, agora: Date, meses: number, limite: number) => {
          const lote = await real.apagarLote(alvo, agora, meses, limite)
          lotes.push({ alvo, linhas: lote.linhas })
          return lote
        },
      })
      await rodar(a.escolaId, expurgo(relogioEm(QUARTA_1H), { repositorio: contando }))
      expect(lotes.filter(({ alvo }) => alvo === 'mensagem_tutor').map(({ linhas }) => linhas)).toEqual([5_000, 1])
      expect(log.doEvento('retencao.expurgada').filter((linha) => linha['escolaId'] === a.escolaId)).toEqual([expect.objectContaining({ categoriasTotal: 3, linhasTotal: 5_001 })])
      expect(await quantas('mensagem_tutor', a.escolaId)).toBe(0)
      expect(await execucoes(a.escolaId)).toEqual([
        { categoria: 'conversa_tutor', linhas: 5_001, concluida: true },
        { categoria: 'sinal_tutor', linhas: 0, concluida: true },
        { categoria: 'conversa_professor', linhas: 0, concluida: true },
      ])
    })

    it('o lote de cada tabela desce pelo índice `(escola_id, <data>)`, sem varrer a tabela', async () => {
      const a = await escolaNova()
      const cliente = await bancada.pool.connect()
      try {
        await cliente.query('begin')
        for (const tabela of ['mensagem_tutor', 'sinal_tutor', 'mensagem_agente']) await cliente.query(`analyze ${tabela}`)
        // Com a varredura sequencial proibida, o plano só usa o índice se ele servir à instrução.
        await cliente.query('set local enable_seqscan = off')
        for (const [alvo, indice] of [
          ['mensagem_tutor', 'mensagem_tutor_criada_em_idx'],
          ['sinal_tutor', 'sinal_tutor_criado_em_idx'],
          ['mensagem_agente', 'mensagem_agente_criada_em_idx'],
        ] as const) {
          const { sql: texto, params } = new PgDialect({ casing: 'snake_case' }).sqlToQuery(instrucaoDoLoteDaEscola(alvo, a.escolaId, QUARTA_1H, 12, LOTE_DO_EXPURGO))
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
  })

  describe('concorrência', () => {
    it('[P] dois jobs da mesma escola ao mesmo tempo apagam linhas diferentes, e as contagens somam o que saiu', async () => {
      const a = await escolaNova()
      for (let indice = 0; indice < 30; indice += 1) await mensagemTutor(a, QUARTA_1H, '13 months')
      await Promise.all([rodar(a.escolaId, expurgo(relogioEm(QUARTA_1H), { lote: 5 })), rodar(a.escolaId, expurgo(relogioEm(QUARTA_1H), { lote: 5 }))])
      expect(await quantas('mensagem_tutor', a.escolaId)).toBe(0)
      const linhas = (await execucoes(a.escolaId)).filter((linha) => linha.categoria === 'conversa_tutor')
      expect(linhas).toHaveLength(2)
      expect(linhas.reduce((soma, linha) => soma + linha.linhas, 0)).toBe(30)
    })

    it('[P] a mesma chave ao mesmo tempo dá um job só, e as duas gravações devolvem o mesmo id', async () => {
      const a = await escolaNova()
      const chave = `chave-${randomUUID()}`
      const pedido = { tipo: TIPO_EXPURGAR_ESCOLA, fila: 'lote' as const, naoUrgente: true, dados: {} }
      const gravar = () => executarNoContexto({ requisicaoId: randomUUID(), escolaId: a.escolaId }, () => bancada.banco.transaction((tx) => bancada.enfileirador.enfileirarUmaVez(tx, pedido, chave)))
      // A primeira para depois de inserir, sem confirmar; a segunda chega e espera no índice único; só então a primeira segue.
      const gatilho = new GatilhoDeParada(bancada.pool, { tabela: 'job_registro', evento: 'insert', quando: `new.chave_idempotencia = '${chave}'` })
      await gatilho.armar()
      onTestFinished(() => gatilho.desarmar())
      const primeira = gravar()
      await gatilho.esperarParadas(1)
      const segunda = gravar()
      await esperarNaTrava(bancada.pool, '%insert into "job_registro"%', 2)
      await gatilho.soltar()
      const [um, dois] = await Promise.all([primeira, segunda])
      expect(um.situacao).toBe('enfileirado')
      expect(dois).toEqual({ situacao: 'ja_enfileirado', id: um.id })
      expect((await jobsDoExpurgo(a.escolaId)).map(({ id }) => id)).toEqual([um.id])
    })

    it('a colisão com um job que terminou entre a colisão e a leitura devolve nulo; e, terminado, a mesma chave grava outro job', async () => {
      const a = await escolaNova()
      const chave = `chave-${randomUUID()}`
      const linha = { tipo: TIPO_EXPURGAR_ESCOLA, fila: 'lote' as const, prioridade: 3, naoUrgente: true, dados: {} }
      const noContexto = <T>(funcao: () => Promise<T>) => executarNoContexto({ requisicaoId: randomUUID(), escolaId: a.escolaId }, funcao)
      // Três jobs pendentes que só diferem do da chave numa coisa: a chave, o tipo ou a escola. A leitura da colisão não
      // pode devolver nenhum deles.
      const b = await escolaNova()
      await noContexto(() => bancada.banco.transaction((tx) => bancada.registro.inserirUmaVez(tx, linha, `outra-${chave}`)))
      await noContexto(() => bancada.banco.transaction((tx) => bancada.registro.inserirUmaVez(tx, { ...linha, tipo: 'retencao.outro-tipo' }, chave)))
      await executarNoContexto({ requisicaoId: randomUUID(), escolaId: b.escolaId }, () => bancada.banco.transaction((tx) => bancada.registro.inserirUmaVez(tx, linha, chave)))
      const primeiro = await noContexto(() => bancada.banco.transaction((tx) => bancada.registro.inserirUmaVez(tx, linha, chave)))
      if (primeiro.situacao !== 'enfileirado') throw new Error('o primeiro job deveria ter entrado')
      const terminarOPrimeiro = async () => {
        await bancada.pool.query("update job_registro set estado = 'concluido', concluido_em = now() where id = $1", [primeiro.id])
      }
      const colisao = await noContexto(() => bancada.banco.transaction((tx) => bancada.registro.inserirUmaVez(tx, linha, chave, terminarOPrimeiro)))
      expect(colisao).toEqual({ situacao: 'ja_enfileirado', id: null })
      const depois = await noContexto(() => bancada.banco.transaction((tx) => bancada.registro.inserirUmaVez(tx, linha, chave)))
      expect(depois.situacao).toBe('enfileirado')
      expect((await jobsDoExpurgo(a.escolaId)).filter((job) => job.chave === chave)).toHaveLength(2)
      expect(await jobsDoExpurgo(b.escolaId)).toHaveLength(1)
    })

    it('o despachante é acordado quando o job da chave entra, e não na colisão', async () => {
      const a = await escolaNova()
      const chave = `chave-${randomUUID()}`
      const pedido = { tipo: TIPO_EXPURGAR_ESCOLA, fila: 'lote' as const, naoUrgente: true, dados: {} }
      const ouvinte = await bancada.pool.connect()
      let avisos = 0
      ouvinte.on('notification', ({ channel }) => {
        if (channel === 'job') avisos += 1
      })
      try {
        await ouvinte.query('listen job')
        const gravar = () => executarNoContexto({ requisicaoId: randomUUID(), escolaId: a.escolaId }, () => bancada.banco.transaction((tx) => bancada.enfileirador.enfileirarUmaVez(tx, pedido, chave)))
        await gravar()
        await expect.poll(() => avisos, { timeout: 5_000, interval: 20 }).toBe(1)
        expect((await gravar()).situacao).toBe('ja_enfileirado')
        // O aviso sai no commit: meio segundo depois do da colisão, nenhum chegou.
        await new Promise((resolver) => setTimeout(resolver, 500))
        expect(avisos).toBe(1)
      } finally {
        await ouvinte.query('unlisten job')
        ouvinte.release()
      }
    })

    it('a chave sem escola é recusada: pelo código, na rotina do sistema, e pelo banco, no insert direto', async () => {
      const linha = { tipo: 'sistema.qualquer-rotina', fila: 'lote' as const, prioridade: 3, naoUrgente: true, dados: {} }
      await expect(
        executarNoContexto({ requisicaoId: randomUUID(), rotinaDoSistema: true }, () => bancada.banco.transaction((tx) => bancada.registro.inserirUmaVez(tx, linha, 'sem-escola'))),
      ).rejects.toThrow('chave de idempotência só em job de escola')
      // O job de escola, pedido sem escola no contexto, também é recusado pelo código, antes do banco.
      await expect(
        executarNoContexto({ requisicaoId: randomUUID(), rotinaDoSistema: true }, () =>
          bancada.banco.transaction((tx) => bancada.registro.inserirUmaVez(tx, { ...linha, tipo: TIPO_EXPURGAR_ESCOLA }, 'sem-escola')),
        ),
      ).rejects.toThrow('chave de idempotência só em job de escola')
      const a = await escolaNova()
      await expect(
        executarNoContexto({ requisicaoId: randomUUID(), escolaId: a.escolaId }, () => bancada.banco.transaction((tx) => bancada.registro.inserirUmaVez(tx, linha, 'tipo-de-sistema'))),
      ).rejects.toThrow('chave de idempotência só em job de escola')
      await expect(
        bancada.pool.query("insert into job_registro (fila, prioridade, tipo, chave_idempotencia) values ('lote', 3, 'sistema.qualquer-rotina', 'sem-escola')"),
      ).rejects.toMatchObject({ code: '23514', constraint: 'job_registro_chave_so_com_escola' })
    })
  })

  describe('rotina sistema.expurgar-dado-pessoal', () => {
    it('grava um `retencao.expurgar-escola` por escola, na fila de lote, não urgente, com a data local da escola como chave; o log só tem contagens', async () => {
      const a = await escolaNova()
      const b = await escolaNova()
      await bancada.configurarEscola(b.escolaId, { fuso: 'America/Rio_Branco' })
      // Meia-noite e meia de quarta em São Paulo é 22h30 de terça em Rio Branco.
      await rodarRotina(rotina(relogioEm(new Date('2026-10-07T00:30:00-03:00')), [a.escolaId, b.escolaId]))
      expect((await jobsDoExpurgo(a.escolaId)).map(({ chave, fila, prioridade, naoUrgente, estado }) => ({ chave, fila, prioridade, naoUrgente, estado }))).toEqual([
        { chave: '2026-10-07', fila: 'lote', prioridade: 3, naoUrgente: true, estado: 'aguardando' },
      ])
      expect((await jobsDoExpurgo(b.escolaId)).map(({ chave }) => chave)).toEqual(['2026-10-06'])
      const disparos = log.doEvento('retencao.rotina_disparada')
      expect(disparos.at(-1)).toMatchObject({ escolasTotal: 2, enfileiradosTotal: 2, jaEnfileiradosTotal: 0, falhasTotal: 0 })
      const daRetencao = log.registros().filter((linha) => String(linha['evento']).startsWith('retencao.'))
      expect(daRetencao.length).toBeGreaterThan(0)
      for (const linha of daRetencao) for (const chave of Object.keys(linha)) expect(CHAVES_DO_LOG.has(chave), chave).toBe(true)
      expect(log.linhas.join('\n')).not.toContain('sintética')
    })

    it('às 23h59 e às 0h01 locais as chaves são diferentes; rodar de novo às 23h59 não cria outro job', async () => {
      const a = await escolaNova()
      await rodarRotina(rotina(relogioEm(new Date('2026-10-06T23:59:00-03:00')), [a.escolaId]))
      await rodarRotina(rotina(relogioEm(new Date('2026-10-06T23:59:00-03:00')), [a.escolaId]))
      expect((await jobsDoExpurgo(a.escolaId)).map(({ chave }) => chave)).toEqual(['2026-10-06'])
      await rodarRotina(rotina(relogioEm(new Date('2026-10-07T00:01:00-03:00')), [a.escolaId]))
      expect((await jobsDoExpurgo(a.escolaId)).map(({ chave }) => chave)).toEqual(['2026-10-06', '2026-10-07'])
      expect(chaveDaNoite('America/Sao_Paulo', new Date('2026-10-06T23:59:00-03:00'))).not.toBe(chaveDaNoite('America/Sao_Paulo', new Date('2026-10-07T00:01:00-03:00')))
    })

    it('[P] duas rotinas ao mesmo tempo criam um job por escola', async () => {
      const ids = [(await escolaNova()).escolaId, (await escolaNova()).escolaId, (await escolaNova()).escolaId]
      const relogio = relogioEm(QUARTA_1H)
      await Promise.all([rodarRotina(rotina(relogio, ids)), rodarRotina(rotina(relogio, ids))])
      for (const escolaId of ids) expect(await jobsDoExpurgo(escolaId), escolaId).toHaveLength(1)
      const disparos = log.doEvento('retencao.rotina_disparada').slice(-2)
      expect(disparos.reduce((soma, linha) => soma + Number(linha['enfileiradosTotal']), 0)).toBe(3)
      expect(disparos.reduce((soma, linha) => soma + Number(linha['jaEnfileiradosTotal']), 0)).toBe(3)
    })

    it('uma escola que falha não segura as outras, e o job falha no fim para a fila tentar de novo', async () => {
      const a = await escolaNova()
      // Uma escola que não existe no banco: a FK de `job_registro` recusa o job dela.
      const inexistente = randomUUID()
      await expect(rodarRotina(rotina(relogioEm(QUARTA_1H), [inexistente, a.escolaId]))).rejects.toThrow('expurgo não enfileirado em alguma escola')
      expect(await jobsDoExpurgo(a.escolaId)).toHaveLength(1)
      expect(log.doEvento('retencao.escola_nao_enfileirada').some((linha) => linha['escolaId'] === inexistente)).toBe(true)
    })

    it('permissão: a rotina só roda como rotina do sistema, e o job da escola só no contexto de uma escola', async () => {
      const a = await escolaNova()
      await expect(executarNoContexto({ requisicaoId: randomUUID(), escolaId: a.escolaId }, () => rotina(relogioEm(QUARTA_1H), [a.escolaId])({}, { jobId: 'x', tentativa: 1, chaveIdempotencia: 'x' }))).rejects.toMatchObject({
        name: 'FalhaDeJob',
        codigo: CodigoDeFalhaDeJob.DADOS_INVALIDOS,
      })
      expect(await jobsDoExpurgo(a.escolaId)).toEqual([])
      const vencida = await mensagemTutor(a, QUARTA_1H, '13 months')
      await expect(rodarRotina(expurgo(relogioEm(QUARTA_1H)))).rejects.toMatchObject({ name: 'FalhaDeJob', codigo: CodigoDeFalhaDeJob.DADOS_INVALIDOS })
      expect(await existe('mensagem_tutor', vencida)).toBe(true)
    })

    it('a lista de escolas da rotina traz as escolas do banco, só pelo id', async () => {
      const a = await escolaNova()
      const b = await escolaNova()
      const ids = await new EscolasDaRotinaRepository(bancada.banco).listarIds()
      expect(ids).toEqual(expect.arrayContaining([a.escolaId, b.escolaId]))
      expect(ids.every((id) => typeof id === 'string' && /^[0-9a-f-]{36}$/.test(id))).toBe(true)
    })
  })

  describe('lote por tabela', () => {
    it.each(['mensagem_tutor', 'sinal_tutor', 'mensagem_agente'] as const)('%s: o lote leva primeiro a mais antiga, e pula, sem esperar, a linha que outra transação travou', async (alvo) => {
      const a = await escolaNova()
      const semear = async (idade: string): Promise<string> => {
        if (alvo === 'mensagem_tutor') return mensagemTutor(a, QUARTA_1H, idade)
        if (alvo === 'sinal_tutor') return sinal(a, QUARTA_1H, idade)
        return mensagemAgente(a, await thread(a, QUARTA_1H, '1 day'), QUARTA_1H, idade)
      }
      // Gravadas fora da ordem da idade: entre as que não estão travadas, a mais antiga não é a primeira nem a última por id
      // (nem na ordem do heap). Sem o `order by` da data, ou com qualquer ordem por id, sairia uma das recentes.
      const recente = await semear('13 months')
      const antiga = await semear('20 months')
      const outraRecente = await semear('14 months')
      const travada = await semear('30 months')
      const repositorio = new ExpurgoDaEscolaRepository(bancada.banco)
      const lote = () => executarNoContexto({ requisicaoId: randomUUID(), escolaId: a.escolaId }, () => repositorio.apagarLote(alvo, QUARTA_1H, 12, 1))
      // Outra transação segura a mais antiga de todas: sem `skip locked`, o lote esperaria por ela até o prazo da instrução.
      const outra = await bancada.pool.connect()
      try {
        await outra.query('begin')
        await outra.query(`select 1 from ${alvo} where id = $1 for update`, [travada])
        expect(await lote()).toEqual({ linhas: 1, cheio: true })
        expect(await existe(alvo, antiga)).toBe(false)
        expect(await existe(alvo, recente)).toBe(true)
        expect(await existe(alvo, outraRecente)).toBe(true)
        expect(await existe(alvo, travada)).toBe(true)
      } finally {
        await outra.query('rollback')
        outra.release()
      }
    })

    it.each(['mensagem_tutor', 'sinal_tutor', 'mensagem_agente', 'thread_agente'] as const)('%s: o lote apaga no máximo o limite, diz que veio cheio, e o seguinte leva o resto', async (alvo) => {
      const a = await escolaNova()
      const b = await escolaNova()
      const semear = async (escola: Escola, idade: string) => {
        if (alvo === 'mensagem_tutor') await mensagemTutor(escola, QUARTA_1H, idade)
        if (alvo === 'sinal_tutor') await sinal(escola, QUARTA_1H, idade)
        if (alvo === 'mensagem_agente') await mensagemAgente(escola, await thread(escola, QUARTA_1H, '1 day'), QUARTA_1H, idade)
        if (alvo === 'thread_agente') await thread(escola, QUARTA_1H, idade)
      }
      for (let indice = 0; indice < 3; indice += 1) await semear(a, '13 months')
      // B tem linhas vencidas mais antigas que as de A: o lote de A, que desce pela idade, não pode escolhê-las.
      for (let indice = 0; indice < 3; indice += 1) await semear(b, '20 months')
      const repositorio = new ExpurgoDaEscolaRepository(bancada.banco)
      const lote = () => executarNoContexto({ requisicaoId: randomUUID(), escolaId: a.escolaId }, () => repositorio.apagarLote(alvo, QUARTA_1H, 12, 2))
      expect(await lote()).toEqual({ linhas: 2, cheio: true })
      expect(await lote()).toEqual({ linhas: 1, cheio: false })
      expect(await lote()).toEqual({ linhas: 0, cheio: false })
      expect(await quantas(alvo, b.escolaId)).toBe(3)
    })
  })

  describe('banco', () => {
    it('`expurgo_execucao` recusa categoria fora do catálogo e contagem negativa, e o check de categoria tem exatamente o catálogo', async () => {
      const a = await escolaNova()
      const inserir = (categoria: string, linhas: number) =>
        bancada.pool.query('insert into expurgo_execucao (escola_id, categoria, linhas, concluida, em) values ($1, $2, $3, true, now())', [a.escolaId, categoria, linhas])
      await expect(inserir('registro_acesso', 0)).rejects.toMatchObject({ code: '23514', constraint: 'expurgo_execucao_categoria_valida' })
      await expect(inserir('conversa_tutor', -1)).rejects.toMatchObject({ code: '23514', constraint: 'expurgo_execucao_linhas_nao_negativas' })
      await inserir('conversa_tutor', 0)
      const { rows } = await bancada.pool.query<{ definicao: string }>("select pg_get_constraintdef(oid) as definicao from pg_constraint where conname = 'expurgo_execucao_categoria_valida'")
      expect(rows).toHaveLength(1)
      expect([...(rows[0]?.definicao ?? '').matchAll(/'(\w+)'/g)].map((literal) => literal[1]).toSorted()).toEqual([...CHAVES_DE_RETENCAO].toSorted())
    })
  })

  describe('isolamento', () => {
    it('duas linhas no mesmo instante: a última gravada decide a categoria pendente', async () => {
      const a = await escolaNova()
      const inserir = (categoria: string, concluida: boolean) =>
        bancada.pool.query('insert into expurgo_execucao (escola_id, categoria, linhas, concluida, em) values ($1, $2, 0, $3, $4)', [a.escolaId, categoria, concluida, QUARTA_1H.toISOString()])
      await inserir('conversa_tutor', true)
      await inserir('sinal_tutor', false)
      const repositorio = new ExpurgoDaEscolaRepository(bancada.banco)
      const pendente = () => executarNoContexto({ requisicaoId: randomUUID(), escolaId: a.escolaId }, () => repositorio.categoriaPendente())
      expect(await pendente()).toBe('sinal_tutor')
      // A noite seguinte terminou a pendente: a última linha é `true`, e não há mais pendente.
      await bancada.pool.query("insert into expurgo_execucao (escola_id, categoria, linhas, concluida, em) values ($1, 'sinal_tutor', 0, true, $2)", [a.escolaId, QUINTA_1H.toISOString()])
      expect(await pendente()).toBeUndefined()
    })

    it('a categoria pendente e as noites de uma escola não leem as linhas de execução de outra', async () => {
      const a = await escolaNova()
      const b = await escolaNova()
      // B parou na conversa do professor; A nunca rodou.
      await bancada.pool.query("insert into expurgo_execucao (escola_id, categoria, linhas, concluida, em) values ($1, 'conversa_professor', 3, false, $2)", [b.escolaId, QUARTA_1H.toISOString()])
      const repositorio = new ExpurgoDaEscolaRepository(bancada.banco)
      const emA = <T>(funcao: () => Promise<T>) => executarNoContexto({ requisicaoId: randomUUID(), escolaId: a.escolaId }, funcao)
      expect(await emA(() => repositorio.categoriaPendente())).toBeUndefined()
      expect(await emA(() => repositorio.noitesDoAlerta('America/Sao_Paulo', QUINTA_1H, CATEGORIAS_DO_EXPURGO))).toBeUndefined()
      await rodar(a.escolaId, expurgo(relogioEm(QUINTA_1H)))
      expect((await execucoes(a.escolaId)).map(({ categoria }) => categoria)).toEqual([...CATEGORIAS_DO_EXPURGO])
    })
  })

  describe('medição do alerta de duas noites', () => {
    /** Uma linha de execução da escola, gravada direto, na data e hora locais de São Paulo. */
    async function noite(escolaId: string, em: string, linhas: ReadonlyArray<readonly [string, boolean]>): Promise<void> {
      for (const [categoria, concluida] of linhas) {
        await bancada.pool.query('insert into expurgo_execucao (escola_id, categoria, linhas, concluida, em) values ($1, $2, 0, $3, $4)', [escolaId, categoria, concluida, `${em}-03:00`])
      }
    }
    const completa = CATEGORIAS_DO_EXPURGO.map((categoria) => [categoria, true] as const)
    const parcial = [
      ['conversa_tutor', true],
      ['sinal_tutor', false],
    ] as const
    /** Quarta ao meio-dia: as noites contadas são terça (ontem) e segunda. */
    const QUARTA_12H = new Date('2026-10-07T12:00:00-03:00')

    function medicaoDe(ids: readonly string[], medidor: MedidorDeTeste, repositorio: Pick<ExpurgoDaEscolaRepository, 'noitesDoAlerta'> = new ExpurgoDaEscolaRepository(bancada.banco), listar?: () => Promise<string[]>): MedicaoDoExpurgo {
      return new MedicaoDoExpurgo({
        escolas: { listarIds: listar ?? (() => Promise.resolve([...ids])) },
        repositorio,
        janelaDaEscola: janelaDaEscola(),
        relogio: relogioEm(QUARTA_12H),
        logger: log.logger,
        medidor: medidor.medidor,
      })
    }

    async function porEscola(medidor: MedidorDeTeste): Promise<Record<string, unknown>> {
      return Object.fromEntries((await medidor.pontos('expurgo.noites_incompletas')).map(({ atributos, valor }) => [String(atributos['escola_id']), valor]))
    }

    it('duas noites parciais dão 2; parcial seguida de completa dá 0; categoria sem linha conta como não concluída; escola sem execução não tem série; a noite anterior à primeira não conta', async () => {
      const [a, b, c, d, e] = [await escolaNova(), await escolaNova(), await escolaNova(), await escolaNova(), await escolaNova()]
      await noite(a.escolaId, '2026-10-05T02:00:00', parcial)
      await noite(a.escolaId, '2026-10-06T02:00:00', parcial)
      await noite(b.escolaId, '2026-10-05T02:00:00', parcial)
      await noite(b.escolaId, '2026-10-06T02:00:00', completa)
      // C terminou as duas que percorreu na terça, mas não tem linha da conversa do professor.
      await noite(c.escolaId, '2026-10-05T02:00:00', parcial)
      await noite(c.escolaId, '2026-10-06T02:00:00', [
        ['conversa_tutor', true],
        ['sinal_tutor', true],
      ])
      // E rodou pela primeira vez na terça, e parou.
      await noite(e.escolaId, '2026-10-06T02:00:00', parcial)
      const medidor = new MedidorDeTeste()
      onTestFinished(() => medidor.encerrar())
      const medicao = new MedicaoDoExpurgo({
        escolas: { listarIds: () => Promise.resolve([a.escolaId, b.escolaId, c.escolaId, d.escolaId, e.escolaId]) },
        repositorio: new ExpurgoDaEscolaRepository(bancada.banco),
        janelaDaEscola: janelaDaEscola(),
        // Quarta ao meio-dia: as noites contadas são terça (ontem) e segunda.
        relogio: relogioEm(new Date('2026-10-07T12:00:00-03:00')),
        logger: log.logger,
        medidor: medidor.medidor,
      })
      const avisosAntes = log.doEvento('worker.medicao_do_expurgo_indisponivel').length
      await medicao.medir()
      // A escola sem execução não é falha: fica sem série, sem aviso.
      expect(log.doEvento('worker.medicao_do_expurgo_indisponivel')).toHaveLength(avisosAntes)
      const pontos = await medidor.pontos('expurgo.noites_incompletas')
      const porEscola = Object.fromEntries(pontos.map(({ atributos, valor }) => [String(atributos['escola_id']), valor]))
      expect(porEscola).toEqual({ [a.escolaId]: 2, [b.escolaId]: 0, [c.escolaId]: 2, [e.escolaId]: 1 })
      for (const { atributos } of pontos) expect(Object.keys(atributos)).toEqual(['escola_id'])
    })

    it('a noite só é completa com uma linha concluída de cada categoria do expurgo, naquele dia local e naquela escola', async () => {
      const [f, g, h, i, j] = [await escolaNova(), await escolaNova(), await escolaNova(), await escolaNova(), await escolaNova()]
      // F: as três categorias têm linha na terça, mas a última parou pela janela.
      await noite(f.escolaId, '2026-10-05T02:00:00', parcial)
      await noite(f.escolaId, '2026-10-06T02:00:00', [...CATEGORIAS_DO_EXPURGO.slice(0, -1).map((categoria) => [categoria, true] as const), ['conversa_professor', false]])
      // G: na terça, duas do expurgo e uma categoria que ele ainda não apaga: não completa a terceira.
      await noite(g.escolaId, '2026-10-05T02:00:00', parcial)
      await noite(g.escolaId, '2026-10-06T02:00:00', [
        ['conversa_tutor', true],
        ['sinal_tutor', true],
        ['execucao_agente', true],
      ])
      // H: na terça, a mesma categoria concluída duas vezes (dois jobs) conta uma vez só.
      await noite(h.escolaId, '2026-10-05T02:00:00', parcial)
      await noite(h.escolaId, '2026-10-06T02:00:00', [
        ['conversa_tutor', true],
        ['conversa_tutor', true],
        ['sinal_tutor', true],
      ])
      // I: nada na terça, e a noite de hoje (quarta) completa não vale por ela.
      await noite(i.escolaId, '2026-10-05T02:00:00', parcial)
      await noite(i.escolaId, '2026-10-07T02:00:00', completa)
      // J: nada na terça, segunda completa (e domingo parcial): a segunda não vale pela terça, e para a contagem.
      await noite(j.escolaId, '2026-10-04T02:00:00', parcial)
      await noite(j.escolaId, '2026-10-05T02:00:00', completa)
      // A escola B tem a terça completa: as linhas dela não completam a terça de nenhuma das outras.
      const b = await escolaNova()
      await noite(b.escolaId, '2026-10-06T02:00:00', completa)
      const medidor = new MedidorDeTeste()
      onTestFinished(() => medidor.encerrar())
      await medicaoDe([f.escolaId, g.escolaId, h.escolaId, i.escolaId, j.escolaId, b.escolaId], medidor).medir()
      expect(await porEscola(medidor)).toEqual({ [f.escolaId]: 2, [g.escolaId]: 2, [h.escolaId]: 2, [i.escolaId]: 2, [j.escolaId]: 1, [b.escolaId]: 0 })
    })

    it('a escola que falha fica sem série nesta volta, e as outras são medidas; a lista que falha tira toda a exportação', async () => {
      const [a, b] = [await escolaNova(), await escolaNova()]
      await noite(a.escolaId, '2026-10-05T02:00:00', parcial)
      await noite(a.escolaId, '2026-10-06T02:00:00', parcial)
      await noite(b.escolaId, '2026-10-06T02:00:00', completa)
      const real = new ExpurgoDaEscolaRepository(bancada.banco)
      // A leitura da escola B falha (o Postgres recusou a consulta dela); a de A segue.
      const falhaEmB: Pick<ExpurgoDaEscolaRepository, 'noitesDoAlerta'> = {
        noitesDoAlerta: (fuso, agora, categorias) => (contextoAtual()?.escolaId === b.escolaId ? Promise.reject(new Error('banco lento')) : real.noitesDoAlerta(fuso, agora, categorias)),
      }
      const medidor = new MedidorDeTeste()
      onTestFinished(() => medidor.encerrar())
      let listaFalha = false
      const medicao = medicaoDe([a.escolaId, b.escolaId], medidor, falhaEmB, () => (listaFalha ? Promise.reject(new Error('banco fora')) : Promise.resolve([a.escolaId, b.escolaId])))
      await medicao.medir()
      expect(await porEscola(medidor)).toEqual({ [a.escolaId]: 2 })
      listaFalha = true
      await medicao.medir()
      expect(await porEscola(medidor)).toEqual({})
    })

    it('o encerramento no meio de uma volta para na escola seguinte, sem trocar as séries', async () => {
      const [a, b] = [await escolaNova(), await escolaNova()]
      await noite(a.escolaId, '2026-10-06T02:00:00', parcial)
      await noite(b.escolaId, '2026-10-06T02:00:00', parcial)
      const real = new ExpurgoDaEscolaRepository(bancada.banco)
      const medidor = new MedidorDeTeste()
      onTestFinished(() => medidor.encerrar())
      const montada: { medicao?: MedicaoDoExpurgo } = {}
      const encerraNaPrimeira: Pick<ExpurgoDaEscolaRepository, 'noitesDoAlerta'> = {
        noitesDoAlerta: async (fuso, agora, categorias) => {
          await montada.medicao?.encerrar()
          return real.noitesDoAlerta(fuso, agora, categorias)
        },
      }
      montada.medicao = medicaoDe([a.escolaId, b.escolaId], medidor, encerraNaPrimeira)
      await montada.medicao.medir()
      expect(await porEscola(medidor)).toEqual({})
    })

    it('o "ontem" é o do fuso da escola: à 1h de quarta em São Paulo, Rio Branco ainda está na terça', async () => {
      const a = await escolaNova()
      await bancada.configurarEscola(a.escolaId, { fuso: 'America/Rio_Branco' })
      // Em Rio Branco: domingo parcial e segunda completa (23h30 de segunda lá é 1h30 de terça em São Paulo).
      await noite(a.escolaId, '2026-10-04T23:00:00', parcial)
      await noite(a.escolaId, '2026-10-06T01:30:00', completa)
      const medidor = new MedidorDeTeste()
      onTestFinished(() => medidor.encerrar())
      const medicao = new MedicaoDoExpurgo({
        escolas: { listarIds: () => Promise.resolve([a.escolaId]) },
        repositorio: new ExpurgoDaEscolaRepository(bancada.banco),
        janelaDaEscola: janelaDaEscola(),
        // 1h de quarta em São Paulo é 23h de terça em Rio Branco: ontem é segunda, completa. Com o dia de São Paulo, ontem
        // seria terça, sem linha, e o valor seria 1.
        relogio: relogioEm(new Date('2026-10-07T01:00:00-03:00')),
        logger: log.logger,
        medidor: medidor.medidor,
      })
      await medicao.medir()
      expect((await medidor.pontos('expurgo.noites_incompletas')).map(({ valor }) => valor)).toEqual([0])
    })

    it('a noite é contada no fuso da escola: 23h30 de terça em Rio Branco é 1h30 de quarta em São Paulo', async () => {
      const a = await escolaNova()
      await bancada.configurarEscola(a.escolaId, { fuso: 'America/Rio_Branco' })
      // Segunda parcial e terça completa no fuso de Rio Branco; a de terça foi gravada à 1h30 de quarta em São Paulo. Contada
      // no fuso de São Paulo, a terça ficaria sem linha e o valor seria 2.
      await noite(a.escolaId, '2026-10-05T23:30:00', parcial)
      await noite(a.escolaId, '2026-10-07T01:30:00', completa)
      const medidor = new MedidorDeTeste()
      onTestFinished(() => medidor.encerrar())
      const medicao = new MedicaoDoExpurgo({
        escolas: { listarIds: () => Promise.resolve([a.escolaId]) },
        repositorio: new ExpurgoDaEscolaRepository(bancada.banco),
        janelaDaEscola: janelaDaEscola(),
        relogio: relogioEm(new Date('2026-10-07T12:00:00-03:00')),
        logger: log.logger,
        medidor: medidor.medidor,
      })
      await medicao.medir()
      expect((await medidor.pontos('expurgo.noites_incompletas')).map(({ valor }) => valor)).toEqual([0])
    })
  })

  describe('log', () => {
    it('toda linha `retencao.*` que este arquivo produziu, de todos os testes acima, só tem as chaves permitidas: ids e contagens', () => {
      const daRetencao = log.registros().filter((linha) => String(linha['evento']).startsWith('retencao.'))
      const eventos = new Set(daRetencao.map((linha) => String(linha['evento'])))
      expect([...eventos].sort()).toEqual([
        'retencao.escola_nao_enfileirada',
        'retencao.expurgada',
        'retencao.expurgo_interrompido',
        'retencao.registro_nao_gravado',
        'retencao.rotina_disparada',
      ])
      for (const linha of daRetencao) for (const chave of Object.keys(linha)) expect(CHAVES_DO_LOG.has(chave), `${String(linha['evento'])}: ${chave}`).toBe(true)
      expect(log.linhas.join('\n')).not.toMatch(/sintétic|Pergunta|Resposta/)
    })
  })

  describe('trilha', () => {
    it('o job da escola sai pelo despachante fora do horário letivo e roda no worker de lote montado, que apaga o vencido e grava a execução', async () => {
      const a = await escolaNova()
      const vencida = await mensagemTutor(a, QUARTA_1H, '13 months')
      const relogio = relogioEm(QUARTA_1H)
      const worker = montarWorker(
        { banco: configuracaoDoBanco(), redisFilaUrl: urlRedisDeFila(), pools: { lote: 2 }, vagasPadrao: vagasPadraoDoAmbiente(), threadsMaximo: 1, storage: STORAGE, janelaPadrao: janelaPadraoDoAmbiente() },
        log.logger,
        { prefixo: bancada.prefixo, relogio, agendamentos: [] },
      )
      onTestFinished(() => worker.encerrar())
      bancada.despachante(log, { relogio }).iniciar()
      const enfileirado = await executarNoContexto({ requisicaoId: randomUUID(), escolaId: a.escolaId }, () =>
        bancada.banco.transaction((tx) => bancada.enfileirador.enfileirarUmaVez(tx, { tipo: TIPO_EXPURGAR_ESCOLA, fila: 'lote', naoUrgente: true, dados: {} }, chaveDaNoite('America/Sao_Paulo', QUARTA_1H))),
      )
      await expect.poll(async () => (await bancada.estado(enfileirado.id ?? ''))?.estado, { timeout: 20_000, interval: 100 }).toBe('concluido')
      expect(await existe('mensagem_tutor', vencida)).toBe(false)
      expect((await execucoes(a.escolaId)).map(({ categoria }) => categoria)).toEqual([...CATEGORIAS_DO_EXPURGO])
    })
  })
})

interface NoDoPlano {
  'Index Name'?: string
  'Node Type'?: string
  Plans?: NoDoPlano[]
}

function nosDoPlano(no: NoDoPlano | undefined): NoDoPlano[] {
  return no === undefined ? [] : [no, ...(no.Plans ?? []).flatMap(nosDoPlano)]
}
