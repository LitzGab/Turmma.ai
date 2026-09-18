import { executarNoContexto } from '@educa/nucleo'
import { CodigoDeErro } from '@educa/shared'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MedidorDeTeste } from '../../../tools/testes/metricas.ts'
import { VinculoRepository } from '../src/estrutura/vinculo.repository.js'
import { chamar, subirApi, type ApiDeTeste, type RespostaHttp } from './api-com-sessao.js'
import { alunosNaTurma, montarEscolaComTurma, type EscolaComTurma } from './escola-com-turma.js'
import { BancadaDeSessoes, type SessaoDeTeste } from './sessao-de-teste.js'

/** O texto livre que o professor escreveu na contestação: o teste procura por ele no banco depois da virada. */
const TEXTO_DA_CONTESTACAO = `dou só a eletiva ${randomUUID()}`

const NAO_ENCONTRADO = { status: 404, codigo: CodigoDeErro.NAO_ENCONTRADO, mensagem: expect.any(String) }

const semRequisicao = (resposta: RespostaHttp) => ({ status: resposta.status, codigo: resposta.corpo.erro?.codigo, mensagem: (resposta.corpo.erro as { mensagem?: string } | undefined)?.mensagem })

interface LinhaDeVinculo {
  readonly id: string
  readonly papel: string
  readonly estado: string
  readonly contestacao: string | null
  readonly complemento: string | null
  readonly motivo_encerramento: string | null
  readonly decidido_em: Date | null
  readonly encerrado_em: Date | null
}

/**
 * Uma escola em 2026 com os vínculos de todo tipo no 2ºB e no 2ºC: confirmado, pendente, contestado com texto, o
 * contestado com texto e depois desligado em março, e dois alunos confirmados.
 */
interface EscolaNaVirada extends EscolaComTurma {
  readonly confirmado: string
  readonly pendente: string
  readonly contestado: string
  readonly desligado: string
  readonly professorConfirmado: SessaoDeTeste
}

describe('virada do ano: encerrar o ano letivo encerra os vínculos por `fim_do_ano` e apaga o `complemento`, numa transação (10.0)', () => {
  const bancada = new BancadaDeSessoes()
  const medidor = new MedidorDeTeste()
  let api: ApiDeTeste

  beforeAll(async () => {
    api = await subirApi(medidor.medidor)
  })

  afterAll(async () => {
    await api.app.close()
    await bancada.fechar()
    await medidor.encerrar()
  })

  const post = (sessao: SessaoDeTeste, caminho: string, corpo?: unknown): Promise<RespostaHttp> => chamar(api.url, 'POST', caminho, sessao.token, corpo)
  const get = (sessao: SessaoDeTeste, caminho: string): Promise<RespostaHttp> => chamar(api.url, 'GET', caminho, sessao.token)

  async function vincular(escola: EscolaComTurma, professor: SessaoDeTeste, turmaId: string): Promise<string> {
    const resposta = await post(escola.coordenacao, '/v1/vinculos', { usuarioId: professor.usuarioId, turmaId, disciplinaId: escola.quimica, papel: 'professor' })
    expect(resposta.status).toBe(201)
    return resposta.corpo['id'] as string
  }

  async function montar(): Promise<EscolaNaVirada> {
    const escola = await montarEscolaComTurma(api, bancada)
    await alunosNaTurma(bancada, escola, escola.turma, 2)
    const [professorConfirmado, professorPendente, professorContestando, professorDesligado] = await bancada.sessoes(escola.coordenacao.escolaId, { papel: 'professor', quantidade: 4 })
    if (professorConfirmado === undefined || professorPendente === undefined || professorContestando === undefined || professorDesligado === undefined) throw new Error('professores')
    const confirmado = await vincular(escola, professorConfirmado, escola.turma)
    expect((await post(professorConfirmado, `/v1/vinculos/${confirmado}/confirmar`)).status).toBe(200)
    const pendente = await vincular(escola, professorPendente, escola.turma)
    const contestado = await vincular(escola, professorContestando, escola.outraTurma)
    expect((await post(professorContestando, `/v1/vinculos/${contestado}/contestar`, { contestacao: 'outro', complemento: TEXTO_DA_CONTESTACAO })).status).toBe(200)
    const desligado = await vincular(escola, professorDesligado, escola.outraTurma)
    expect((await post(professorDesligado, `/v1/vinculos/${desligado}/contestar`, { contestacao: 'nao_leciono', complemento: TEXTO_DA_CONTESTACAO })).status).toBe(200)
    expect((await post(escola.coordenacao, `/v1/vinculos/${desligado}/encerrar`, { motivo: 'desligamento' })).status).toBe(200)
    return { ...escola, confirmado, pendente, contestado, desligado, professorConfirmado }
  }

  /** As linhas de `vinculo` do ano, lidas direto do banco: é a coluna que precisa estar vazia, não só a resposta da API. */
  async function vinculosDoAno(anoLetivoId: string): Promise<LinhaDeVinculo[]> {
    const { rows } = await bancada.pool.query<LinhaDeVinculo>(
      'select id, papel, estado, contestacao, complemento, motivo_encerramento, decidido_em, encerrado_em from vinculo where ano_letivo_id = $1 order by id',
      [anoLetivoId],
    )
    return rows
  }

  async function situacaoDoAno(anoLetivoId: string): Promise<string | undefined> {
    const { rows } = await bancada.pool.query<{ situacao: string }>('select situacao from ano_letivo where id = $1', [anoLetivoId])
    return rows[0]?.situacao
  }

  async function auditoriasDaVirada(escolaId: string): Promise<Array<{ entidade: string; entidade_id: string; autor_usuario_id: string; antes: unknown; depois: unknown; finalidade: string | null }>> {
    const { rows } = await bancada.pool.query<{ entidade: string; entidade_id: string; autor_usuario_id: string; antes: unknown; depois: unknown; finalidade: string | null }>(
      "select entidade, entidade_id, autor_usuario_id, antes, depois, finalidade from auditoria where escola_id = $1 and acao = 'ano_letivo.encerrado' order by em, id",
      [escolaId],
    )
    return rows
  }

  it('caminho feliz: confirmado, pendente, contestado e alunos vão a `encerrado` por `fim_do_ano`; o desligado mantém o motivo; nenhum `complemento` sobra no banco', async () => {
    const escola = await montar()
    const antes = await vinculosDoAno(escola.anoLetivoId)
    expect(antes.filter((linha) => linha.complemento !== null)).toHaveLength(2)
    const desligadoAntes = antes.find((linha) => linha.id === escola.desligado)

    const resposta = await post(escola.coordenacao, `/v1/anos-letivos/${escola.anoLetivoId}/encerrar`)
    expect(resposta.status).toBe(200)
    expect(resposta.corpo).toEqual({ id: escola.anoLetivoId, ano: 2026, inicio: '2026-02-01', fim: '2026-12-15', situacao: 'encerrado' })

    const depois = await vinculosDoAno(escola.anoLetivoId)
    expect(depois).toHaveLength(6)
    for (const linha of depois) {
      expect(linha.estado, linha.id).toBe('encerrado')
      expect(linha.complemento, linha.id).toBeNull()
      expect(linha.encerrado_em, linha.id).not.toBeNull()
      expect(linha.motivo_encerramento, linha.id).toBe(linha.id === escola.desligado ? 'desligamento' : 'fim_do_ano')
    }
    // O desligado em março não é reescrito: mantém a data em que saiu. Só o texto dele some.
    expect(depois.find((linha) => linha.id === escola.desligado)?.encerrado_em).toEqual(desligadoAntes?.encerrado_em)
    // O código da contestação fica: é enum, não texto livre, e é ele que diz que o vínculo nunca foi aceito.
    expect(depois.find((linha) => linha.id === escola.contestado)?.contestacao).toBe('outro')
    const { rows } = await bancada.pool.query<{ total: string }>('select count(*) as total from vinculo where ano_letivo_id = $1 and complemento is not null', [escola.anoLetivoId])
    expect(Number(rows[0]?.total)).toBe(0)

    expect(await auditoriasDaVirada(escola.coordenacao.escolaId)).toEqual([
      {
        entidade: 'ano_letivo',
        entidade_id: escola.anoLetivoId,
        autor_usuario_id: escola.coordenacao.usuarioId,
        antes: { situacao: 'em_curso' },
        depois: { situacao: 'encerrado', vinculosEncerrados: 5, textosDeContestacaoApagados: 2 },
        finalidade: null,
      },
    ])

    // O professor confirmado perde a turma do ano em curso, que não existe mais.
    expect(semRequisicao(await get(escola.professorConfirmado, `/v1/turmas/${escola.turma}`))).toEqual(NAO_ENCONTRADO)

    // O segundo clique responde o ano como está, sem outra virada nem outra auditoria.
    const segundo = await post(escola.coordenacao, `/v1/anos-letivos/${escola.anoLetivoId}/encerrar`)
    expect(segundo.status).toBe(200)
    expect(segundo.corpo).toEqual(resposta.corpo)
    expect(await vinculosDoAno(escola.anoLetivoId)).toEqual(depois)
    expect(await auditoriasDaVirada(escola.coordenacao.escolaId)).toHaveLength(1)
  })

  it('privacidade: a auditoria da virada guarda só contagens, sem o texto livre nem id de pessoa', async () => {
    const escola = await montar()
    expect((await post(escola.coordenacao, `/v1/anos-letivos/${escola.anoLetivoId}/encerrar`)).status).toBe(200)
    const [virada] = await auditoriasDaVirada(escola.coordenacao.escolaId)
    const texto = JSON.stringify(virada)
    expect(texto).not.toContain(TEXTO_DA_CONTESTACAO)
    const { rows } = await bancada.pool.query<{ usuario_id: string }>('select usuario_id from vinculo where ano_letivo_id = $1', [escola.anoLetivoId])
    for (const { usuario_id } of rows) expect(texto).not.toContain(usuario_id)
    // Nenhuma auditoria da escola tem o texto, nem a da contestação.
    const { rows: todas } = await bancada.pool.query<{ linha: string }>('select row_to_json(a)::text as linha from auditoria a where escola_id = $1', [escola.coordenacao.escolaId])
    for (const { linha } of todas) expect(linha).not.toContain(TEXTO_DA_CONTESTACAO)
  })

  it('borda: falha forçada na gravação da auditoria desfaz tudo; o ano continua `em_curso`, os vínculos intactos, e o professor lê a turma', async () => {
    const escola = await montar()
    const antes = await vinculosDoAno(escola.anoLetivoId)
    const gatilho = `falha_virada_${randomUUID().replaceAll('-', '')}`
    // A auditoria é o último passo da virada: se os vínculos fossem gravados fora da transação do ano, a falha dela os
    // deixaria encerrados e sem texto.
    await bancada.pool.query(`
      create function ${gatilho}() returns trigger language plpgsql as $$
      begin
        if new.acao = 'ano_letivo.encerrado' and new.escola_id = '${escola.coordenacao.escolaId}' then raise exception 'falha forçada da virada'; end if;
        return new;
      end $$`)
    await bancada.pool.query(`create trigger ${gatilho} before insert on auditoria for each row execute function ${gatilho}()`)
    try {
      const falha = await post(escola.coordenacao, `/v1/anos-letivos/${escola.anoLetivoId}/encerrar`)
      expect(falha.status).toBe(500)
      expect(falha.corpo.erro?.codigo).toBe(CodigoDeErro.ERRO_INTERNO)
    } finally {
      await bancada.pool.query(`drop trigger ${gatilho} on auditoria`)
      await bancada.pool.query(`drop function ${gatilho}()`)
    }

    expect(await situacaoDoAno(escola.anoLetivoId)).toBe('em_curso')
    expect(await vinculosDoAno(escola.anoLetivoId)).toEqual(antes)
    expect(await auditoriasDaVirada(escola.coordenacao.escolaId)).toEqual([])
    expect((await get(escola.professorConfirmado, `/v1/turmas/${escola.turma}`)).status).toBe(200)

    // O controle: sem a falha, a mesma virada acontece.
    expect((await post(escola.coordenacao, `/v1/anos-letivos/${escola.anoLetivoId}/encerrar`)).status).toBe(200)
    expect((await vinculosDoAno(escola.anoLetivoId)).every((linha) => linha.estado === 'encerrado' && linha.complemento === null)).toBe(true)
  })

  it('clique duplo: dois `encerrar` em paralelo fazem uma virada só, com uma auditoria, e os dois respondem o ano encerrado', async () => {
    const escola = await montar()
    const [primeiro, segundo] = await Promise.all([
      post(escola.coordenacao, `/v1/anos-letivos/${escola.anoLetivoId}/encerrar`),
      post(escola.coordenacao, `/v1/anos-letivos/${escola.anoLetivoId}/encerrar`),
    ])
    expect([primeiro?.status, segundo?.status]).toEqual([200, 200])
    expect(primeiro?.corpo['situacao']).toBe('encerrado')
    expect(segundo?.corpo['situacao']).toBe('encerrado')
    const auditorias = await auditoriasDaVirada(escola.coordenacao.escolaId)
    expect(auditorias).toHaveLength(1)
    expect(auditorias[0]?.depois).toEqual({ situacao: 'encerrado', vinculosEncerrados: 5, textosDeContestacaoApagados: 2 })
  })

  it('concorrência: o professor contesta com texto no mesmo instante em que o ano é encerrado; ganhe quem ganhar, nenhum `complemento` sobra', async () => {
    const escola = await montar()
    const [professor] = await bancada.sessoes(escola.coordenacao.escolaId, { papel: 'professor', quantidade: 1 })
    if (professor === undefined) throw new Error('professor')
    const pendente = await vincular(escola, professor, escola.outraTurma)
    const [encerrado, contestado] = await Promise.all([
      post(escola.coordenacao, `/v1/anos-letivos/${escola.anoLetivoId}/encerrar`),
      post(professor, `/v1/vinculos/${pendente}/contestar`, { contestacao: 'outro', complemento: TEXTO_DA_CONTESTACAO }),
    ])
    expect(encerrado.status).toBe(200)
    // Se a contestação chegou antes, ela vale até a virada; se chegou depois, o vínculo já não está em decisão.
    expect([200, 404, 409]).toContain(contestado.status)
    const depois = await vinculosDoAno(escola.anoLetivoId)
    expect(depois.every((linha) => linha.estado === 'encerrado' && linha.complemento === null)).toBe(true)
  })

  describe('isolamento entre escolas (regra 10)', () => {
    let a: EscolaNaVirada
    let b: EscolaNaVirada

    beforeAll(async () => {
      a = await montar()
      b = await montar()
    })

    it('a virada de A não toca vínculo nem ano de B, e encerrar o ano de B a partir de A dá o 404 do inexistente', async () => {
      const antesEmB = await vinculosDoAno(b.anoLetivoId)
      const comIdDeB = await post(a.coordenacao, `/v1/anos-letivos/${b.anoLetivoId}/encerrar`)
      expect(semRequisicao(comIdDeB)).toEqual(NAO_ENCONTRADO)
      expect(semRequisicao(comIdDeB)).toEqual(semRequisicao(await post(a.coordenacao, `/v1/anos-letivos/${randomUUID()}/encerrar`)))
      expect(await situacaoDoAno(b.anoLetivoId)).toBe('em_curso')

      expect((await post(a.coordenacao, `/v1/anos-letivos/${a.anoLetivoId}/encerrar`)).status).toBe(200)
      expect(await vinculosDoAno(b.anoLetivoId)).toEqual(antesEmB)
      expect(await situacaoDoAno(b.anoLetivoId)).toBe('em_curso')
      expect(await auditoriasDaVirada(b.coordenacao.escolaId)).toEqual([])
    })

    it('o escopo de escola vale sozinho na virada: num contexto de A, `virarAno` com o ano de B não muda nada em B', async () => {
      const antesEmB = await vinculosDoAno(b.anoLetivoId)
      const forjado = { requisicaoId: randomUUID(), escolaId: a.coordenacao.escolaId, usuarioId: a.coordenacao.usuarioId, papel: 'coordenador' as const, sessaoId: randomUUID(), anoLetivoId: b.anoLetivoId }
      const contagens = await executarNoContexto(forjado, () => new VinculoRepository(bancada.banco).virarAno(b.anoLetivoId))
      expect(contagens).toEqual({ vinculosEncerrados: 0, textosDeContestacaoApagados: 0 })
      expect(await vinculosDoAno(b.anoLetivoId)).toEqual(antesEmB)

      // O controle: com a escola de B no contexto, a mesma chamada alcança os vínculos de B. A transação é desfeita.
      const desfeita = new Error('desfazer o controle')
      const doControle = await executarNoContexto({ ...forjado, escolaId: b.coordenacao.escolaId }, () =>
        bancada.banco
          .transaction(async (tx) => {
            const alcancadas = await new VinculoRepository(tx).virarAno(b.anoLetivoId)
            throw Object.assign(desfeita, { alcancadas })
          })
          .catch((erro: unknown) => (erro === desfeita ? (desfeita as Error & { alcancadas?: unknown }).alcancadas : Promise.reject(erro))),
      )
      expect(doControle).toEqual({ vinculosEncerrados: 5, textosDeContestacaoApagados: 2 })
      expect(await vinculosDoAno(b.anoLetivoId)).toEqual(antesEmB)
    })
  })
})
