import { CAMPOS_PROIBIDOS_NA_AUDITORIA } from '@educa/nucleo'
import { CodigoDeErro, esquemaRespostaDisciplina, esquemaRespostaTurma, MENSAGENS_DE_ERRO } from '@educa/shared'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { z } from 'zod'
import { MedidorDeTeste } from '../../../tools/testes/metricas.ts'
import { chamar, subirApi, type ApiDeTeste, type RespostaHttp } from './api-com-sessao.js'
import { BancadaDeSessoes, type SessaoDeTeste } from './sessao-de-teste.js'

/**
 * Os cenários transversais da A1 (`tasks/prd-apresentacao-escola/cenarios.md`): I3, P1, A1, A3 e A4, cada um uma
 * varredura sobre `ROTAS_DA_A1`, as rotas autenticadas novas da funcionalidade. A tarefa 1.0 criou o arquivo com as
 * rotas dela; cada tarefa seguinte acrescenta as suas à lista, e o que elas precisam à escola montada, a `estadoDe` e
 * às sentinelas, e as cinco varreduras passam a cobri-las sem mudar.
 *
 * Toda varredura termina chamando a rota com o recurso da própria escola e conferindo o sucesso: sem isso, uma rota
 * que não existe (ou um caminho escrito errado aqui) responderia o mesmo 404 e passaria calada.
 */

/** Uma escola da A1 montada pela API, como a coordenação faria, com as pessoas e os recursos que as rotas pedem. */
interface EscolaMontada {
  readonly escolaId: string
  readonly slug: string
  readonly coordenacao: SessaoDeTeste
  readonly professor: SessaoDeTeste
  readonly aluno: SessaoDeTeste
  /** Sem vínculo: renomear e excluir dão certo. */
  readonly disciplina: string
  readonly turma: string
  /** Com o vínculo confirmado do professor: excluir dá `CONFLITO`. */
  readonly disciplinaComVinculo: string
  readonly turmaComVinculo: string
  /** Os nomes gravados, únicos por escola, que o log nunca pode ter (A4). */
  readonly nomes: { readonly disciplina: string; readonly turma: string; readonly disciplinaComVinculo: string; readonly turmaComVinculo: string }
  /** Matrícula e hash de senha de um aluno da escola, que nenhuma resposta nem log pode ter (A3, A4). */
  readonly matricula: string
  readonly senhaHash: string
}

/** Uma rota nova da A1, com o que as varreduras precisam para chamá-la na escola montada. */
interface RotaDaA1 {
  /** Como a spec a escreve: verbo e caminho, com um parâmetro de id (`PATCH /v1/turmas/:id`). */
  readonly rota: string
  /** O id que vai no caminho: o recurso da escola montada que a chamada de sucesso alcança. */
  readonly alvo: (escola: EscolaMontada) => string
  /**
   * O recurso da escola montada em que o professor tem vínculo confirmado, se a rota o alcança por um: o P1 pede com ele
   * também, porque o professor dono é quem mais pode passar por uma célula aberta com filtro de vínculo.
   */
  readonly alvoDoProfessor?: (escola: EscolaMontada) => string
  /** O corpo válido, se a rota lê corpo. */
  readonly corpo?: (escola: EscolaMontada) => Record<string, unknown>
  /** O status do sucesso, pela coordenação, com o `alvo` e o `corpo`. */
  readonly sucesso: 200 | 201 | 204
  /** O contrato estrito da resposta de sucesso; sem ele, o corpo é vazio (204). */
  readonly resposta?: z.ZodType
  /** O pedido da mesma rota que dá `CONFLITO` na escola montada, se a rota tem um. */
  readonly conflito?: (escola: EscolaMontada) => { readonly alvo: string; readonly corpo?: Record<string, unknown> }
  /** As ações de auditoria que o sucesso grava, em ordem (A1). Vazia quando a spec não pede auditoria da rota. */
  readonly auditoria: readonly string[]
}

/** Em minúsculas, como o `detail` do índice único (`lower(nome)`) o escreveria: a sentinela pega o vazamento dos dois jeitos. */
const NOME_RENOMEADO = `renomeada ${randomUUID().slice(0, 8)}`

/**
 * As rotas autenticadas novas da A1. 1.0: renomear e excluir disciplina e turma. Renomear e excluir não gravam
 * auditoria: o RF16 não pede (1_task.md, "Fora do escopo").
 */
const ROTAS_DA_A1: readonly RotaDaA1[] = [
  {
    rota: 'PATCH /v1/disciplinas/:id',
    alvo: (escola) => escola.disciplina,
    alvoDoProfessor: (escola) => escola.disciplinaComVinculo,
    corpo: () => ({ nome: NOME_RENOMEADO }),
    sucesso: 200,
    resposta: esquemaRespostaDisciplina,
    conflito: (escola) => ({ alvo: escola.disciplina, corpo: { nome: escola.nomes.disciplinaComVinculo } }),
    auditoria: [],
  },
  {
    rota: 'DELETE /v1/disciplinas/:id',
    alvo: (escola) => escola.disciplina,
    alvoDoProfessor: (escola) => escola.disciplinaComVinculo,
    sucesso: 204,
    conflito: (escola) => ({ alvo: escola.disciplinaComVinculo }),
    auditoria: [],
  },
  {
    rota: 'PATCH /v1/turmas/:id',
    alvo: (escola) => escola.turma,
    alvoDoProfessor: (escola) => escola.turmaComVinculo,
    corpo: () => ({ nome: NOME_RENOMEADO }),
    sucesso: 200,
    resposta: esquemaRespostaTurma,
    conflito: (escola) => ({ alvo: escola.turma, corpo: { nome: escola.nomes.turmaComVinculo } }),
    auditoria: [],
  },
  {
    rota: 'DELETE /v1/turmas/:id',
    alvo: (escola) => escola.turma,
    alvoDoProfessor: (escola) => escola.turmaComVinculo,
    sucesso: 204,
    conflito: (escola) => ({ alvo: escola.turmaComVinculo }),
    auditoria: [],
  },
]

describe('escola montada (A1): as varreduras transversais sobre as rotas novas', () => {
  const bancada = new BancadaDeSessoes()
  const medidor = new MedidorDeTeste()
  const linhasDeLog: string[] = []
  let api: ApiDeTeste
  /** A escola B: só é alvo de pedidos da A, e nunca muda. */
  let b: EscolaMontada

  async function criado(resposta: Promise<RespostaHttp>, status = 201): Promise<string> {
    const lida = await resposta
    expect(lida.status).toBe(status)
    return lida.corpo['id'] as string
  }

  async function montar(): Promise<EscolaMontada> {
    const escolaId = await bancada.escola()
    const coordenacao = await bancada.sessao(escolaId, 'coordenador')
    const professor = await bancada.sessao(escolaId, 'professor')
    const aluno = await bancada.sessao(escolaId, 'aluno')
    const sufixo = randomUUID().slice(0, 8)
    const matricula = `sentinela-matricula-${sufixo}`
    const senhaHash = `sentinela-hash-${randomUUID()}`
    await bancada.alunosComMatricula(escolaId, [{ matricula, senhaHash }])
    const post = (caminho: string, corpo?: unknown) => chamar(api.url, 'POST', caminho, coordenacao.token, corpo)
    const ano = await criado(post('/v1/anos-letivos', { ano: 2026, inicio: '2026-02-01', fim: '2026-12-15' }))
    await criado(post(`/v1/anos-letivos/${ano}/abrir`), 200)
    const serie = await criado(post('/v1/series', { etapa: 'ef_anos_finais', ano: 8 }))
    // Em minúsculas, pelo mesmo motivo do `NOME_RENOMEADO`.
    const nomes = { disciplina: `disciplina ${sufixo}`, disciplinaComVinculo: `com vínculo ${sufixo}`, turma: `turma ${sufixo}`, turmaComVinculo: `turma vinc ${sufixo}` }
    const disciplina = await criado(post('/v1/disciplinas', { nome: nomes.disciplina }))
    const disciplinaComVinculo = await criado(post('/v1/disciplinas', { nome: nomes.disciplinaComVinculo }))
    const turma = await criado(post('/v1/turmas', { serieId: serie, nome: nomes.turma }))
    const turmaComVinculo = await criado(post('/v1/turmas', { serieId: serie, nome: nomes.turmaComVinculo }))
    const vinculo = await criado(post('/v1/vinculos', { usuarioId: professor.usuarioId, turmaId: turmaComVinculo, disciplinaId: disciplinaComVinculo, papel: 'professor' }))
    await criado(chamar(api.url, 'POST', `/v1/vinculos/${vinculo}/confirmar`, professor.token), 200)
    return { escolaId, slug: await bancada.slugDe(escolaId), coordenacao, professor, aluno, disciplina, turma, disciplinaComVinculo, turmaComVinculo, nomes, matricula, senhaHash }
  }

  /** O que a escola tem nas tabelas que as rotas da A1 escrevem, e a auditoria dela. As tarefas seguintes somam as tabelas delas. */
  async function estadoDe(escola: EscolaMontada): Promise<unknown> {
    const linhas = async (consulta: string) => (await bancada.pool.query(consulta, [escola.escolaId])).rows
    return {
      disciplinas: await linhas('select id, nome, area from disciplina where escola_id = $1 order by id'),
      turmas: await linhas('select id, ano_letivo_id, serie_id, nome, turno from turma where escola_id = $1 order by id'),
      vinculos: await linhas('select id, turma_id, disciplina_id, estado from vinculo where escola_id = $1 order by id'),
      auditoria: await linhas('select id from auditoria where escola_id = $1 order by id'),
    }
  }

  /** Chama a rota com o id no lugar do parâmetro do caminho. */
  function pedir(rota: RotaDaA1, sessao: SessaoDeTeste, alvo: string, corpo?: Record<string, unknown>): Promise<RespostaHttp> {
    const [verbo, caminho] = rota.rota.split(' ') as [string, string]
    return chamar(api.url, verbo, caminho.replace(/:[A-Za-z]+/, alvo), sessao.token, corpo)
  }

  /** O sucesso da rota pela coordenação da escola, com o recurso dela. */
  const comSucesso = (rota: RotaDaA1, escola: EscolaMontada) => pedir(rota, escola.coordenacao, rota.alvo(escola), rota.corpo?.(escola))

  /** A resposta de erro sem o id da requisição, que muda a cada chamada: o resto precisa ser idêntico. */
  function semRequisicao(resposta: RespostaHttp): unknown {
    const { requisicaoId: _requisicaoId, ...erro } = (resposta.corpo.erro ?? {}) as Record<string, unknown>
    return { status: resposta.status, corpo: { ...resposta.corpo, erro } }
  }

  const NAO_ENCONTRADO = { status: 404, corpo: { erro: { codigo: CodigoDeErro.NAO_ENCONTRADO, mensagem: MENSAGENS_DE_ERRO.NAO_ENCONTRADO } } }

  /**
   * Cada resposta que a rota dá na escola montada: o sucesso, o 404 do id sorteado, o 400 do campo a mais no corpo (se
   * a rota lê corpo) e o 409 do conflito (se tem). O status de cada uma é conferido, para a varredura saber que passou
   * por todas.
   */
  async function variantes(rota: RotaDaA1, escola: EscolaMontada): Promise<Array<{ readonly esperado: number; readonly resposta: RespostaHttp }>> {
    const todas: Array<{ esperado: number; resposta: RespostaHttp }> = []
    if (rota.conflito !== undefined) {
      const { alvo, corpo } = rota.conflito(escola)
      todas.push({ esperado: 409, resposta: await pedir(rota, escola.coordenacao, alvo, corpo) })
    }
    if (rota.corpo !== undefined) {
      todas.push({ esperado: 400, resposta: await pedir(rota, escola.coordenacao, rota.alvo(escola), { ...rota.corpo(escola), escolaId: escola.escolaId }) })
    }
    todas.push({ esperado: 404, resposta: await pedir(rota, escola.coordenacao, randomUUID(), rota.corpo?.(escola)) })
    todas.push({ esperado: rota.sucesso, resposta: await comSucesso(rota, escola) })
    for (const { esperado, resposta } of todas) expect(resposta.status, `${rota.rota} ${String(esperado)}`).toBe(esperado)
    return todas
  }

  beforeAll(async () => {
    api = await subirApi(medidor.medidor, {}, linhasDeLog)
    b = await montar()
  })

  afterAll(async () => {
    await api.app.close()
    await bancada.fechar()
    await medidor.encerrar()
  })

  it('a lista das rotas é a da spec, sem repetição, e cada uma tem um parâmetro de id no caminho', () => {
    const rotas = ROTAS_DA_A1.map((rota) => rota.rota)
    expect(new Set(rotas).size).toBe(rotas.length)
    for (const rota of rotas) expect(rota, rota).toMatch(/^(GET|POST|PATCH|DELETE) \/v1\/[^ ]*\/:[A-Za-z]+(\/[^ ]*)?$/)
  })

  describe('I3: o recurso da escola B pedido pela coordenação de A responde como o id sorteado, e B não muda', () => {
    for (const rota of ROTAS_DA_A1) {
      it(rota.rota, async () => {
        const a = await montar()
        const antesEmB = await estadoDe(b)

        const comIdDeB = await pedir(rota, a.coordenacao, rota.alvo(b), rota.corpo?.(a))
        const comSorteado = await pedir(rota, a.coordenacao, randomUUID(), rota.corpo?.(a))
        const foraDoFormato = await pedir(rota, a.coordenacao, 'nao-e-um-id', rota.corpo?.(a))
        expect(semRequisicao(comIdDeB)).toEqual(NAO_ENCONTRADO)
        expect(semRequisicao(comSorteado)).toEqual(semRequisicao(comIdDeB))
        expect(semRequisicao(foraDoFormato)).toEqual(semRequisicao(comIdDeB))
        expect(await estadoDe(b)).toEqual(antesEmB)

        expect((await comSucesso(rota, a)).status).toBe(rota.sucesso)
      })
    }
  })

  describe('P1: professor e aluno da escola recebem o 404 do inexistente, com o recurso da própria escola, e nada muda', () => {
    for (const rota of ROTAS_DA_A1) {
      it(rota.rota, async () => {
        const a = await montar()
        const antes = await estadoDe(a)

        const tentativas: Array<readonly [string, SessaoDeTeste, string]> = [
          ['professor', a.professor, rota.alvo(a)],
          ['aluno', a.aluno, rota.alvo(a)],
        ]
        if (rota.alvoDoProfessor !== undefined) tentativas.push(['professor com vínculo confirmado', a.professor, rota.alvoDoProfessor(a)])
        for (const [quem, sessao, alvo] of tentativas) {
          expect(semRequisicao(await pedir(rota, sessao, alvo, rota.corpo?.(a))), quem).toEqual(NAO_ENCONTRADO)
        }
        expect(await estadoDe(a)).toEqual(antes)

        expect((await comSucesso(rota, a)).status).toBe(rota.sucesso)
      })
    }
  })

  describe('A1: o sucesso grava exatamente a auditoria que a spec pede, com autor e escola, só com ids e contagens', () => {
    for (const rota of ROTAS_DA_A1) {
      it(`${rota.rota}: ${rota.auditoria.length === 0 ? 'nenhum registro' : rota.auditoria.join(', ')}`, async () => {
        const a = await montar()
        const { rows: marco } = await bancada.pool.query<{ agora: Date }>('select clock_timestamp() as agora')

        expect((await comSucesso(rota, a)).status).toBe(rota.sucesso)

        const { rows } = await bancada.pool.query<{ acao: string; autor_usuario_id: string | null; antes: Record<string, unknown> | null; depois: Record<string, unknown> | null }>(
          'select acao, autor_usuario_id, antes, depois from auditoria where escola_id = $1 and em >= $2 order by id',
          [a.escolaId, marco[0]?.agora],
        )
        expect(rows.map((linha) => linha.acao)).toEqual(rota.auditoria)
        for (const linha of rows) {
          expect(linha.autor_usuario_id, linha.acao).toBe(a.coordenacao.usuarioId)
          const campos = [...Object.keys(linha.antes ?? {}), ...Object.keys(linha.depois ?? {})].map((campo) => campo.toLowerCase())
          for (const proibido of CAMPOS_PROIBIDOS_NA_AUDITORIA) expect(campos.filter((campo) => campo.includes(proibido)), linha.acao).toEqual([])
        }
      })
    }
  })

  describe('A3: nenhuma resposta traz token, matrícula ou hash, nem campo fora do contrato', () => {
    for (const rota of ROTAS_DA_A1) {
      it(rota.rota, async () => {
        const a = await montar()
        const sentinelas = [a.coordenacao.token, a.professor.token, a.aluno.token, a.matricula, a.senhaHash]

        for (const { esperado, resposta } of await variantes(rota, a)) {
          const texto = JSON.stringify(resposta.corpo)
          for (const sentinela of sentinelas) expect(texto, `${rota.rota} ${String(esperado)}`).not.toContain(sentinela)
          if (esperado >= 400) {
            expect(Object.keys(resposta.corpo), `${rota.rota} ${String(esperado)}`).toEqual(['erro'])
            expect(Object.keys(resposta.corpo.erro ?? {}).sort(), `${rota.rota} ${String(esperado)}`).toEqual(['codigo', 'mensagem', 'requisicaoId'])
          } else if (rota.resposta === undefined) {
            expect(resposta.corpo, rota.rota).toEqual({})
          } else {
            // Estrito: campo a mais na resposta reprova, em vez de ser descartado.
            expect(rota.resposta.safeParse(resposta.corpo).success, rota.rota).toBe(true)
          }
        }
      })
    }
  })

  it('A4: o log das rotas novas, no sucesso e em cada erro, não tem nome, matrícula, hash, token nem o endereço da escola', async () => {
    const escolas = await Promise.all(ROTAS_DA_A1.map(() => montar()))
    linhasDeLog.length = 0
    let erros = 0
    for (const [posicao, rota] of ROTAS_DA_A1.entries()) {
      const escola = escolas[posicao]
      if (escola === undefined) throw new Error('escola não montada')
      erros += (await variantes(rota, escola)).filter(({ esperado }) => esperado >= 400).length
    }

    const linhas = linhasDeLog.map((linha) => JSON.parse(linha) as Record<string, unknown>)
    // O log capturou os erros: sem isso, a busca abaixo passaria num log mudo.
    expect(linhas.filter((linha) => linha['evento'] === 'http.erro')).toHaveLength(erros)
    const todoOLog = linhasDeLog.join('\n')
    for (const escola of escolas) {
      for (const sentinela of [...Object.values(escola.nomes), escola.matricula, escola.senhaHash, escola.slug, escola.coordenacao.token, escola.professor.token, escola.aluno.token]) {
        expect(todoOLog).not.toContain(sentinela)
      }
    }
    expect(todoOLog).not.toContain(NOME_RENOMEADO)
  })
})
