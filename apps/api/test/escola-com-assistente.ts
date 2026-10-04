import { executarNoContexto, type ContextoDaRequisicao, type ExecutorNoProcesso } from '@educa/nucleo'
import type { PapelDeUsuario } from '@educa/shared'
import type { Redis } from 'ioredis'
import { randomUUID } from 'node:crypto'
import { MATERIAL_DE_DEMONSTRACAO } from '../../../tools/demonstracao/conteudo-estequiometria.ts'
import { EXECUTOR_DE_AGENTE } from '../src/ia/ia.module.js'
import { CLIENTE_REDIS_LOGIN } from '../src/sessao/sessao.module.js'
import { chamar, type ApiDeTeste, type RespostaHttp } from './api-com-sessao.js'
import { montarEscolaComTurma, type EscolaComTurma } from './escola-com-turma.js'
import { enviarMaterial, esperarExtracao, PDF_DE_DEMONSTRACAO } from './material-de-teste.js'
import type { BancadaDeSessoes, SessaoDeTeste } from './sessao-de-teste.js'

/**
 * Uma escola pronta para o Assistente de ensino (MVP, A2): a de `montarEscolaComTurma`, mais a professora com vínculo
 * confirmado em Química no 2ºB, a colega com vínculo confirmado em Química no 2ºC (mesma escola, outra turma), a
 * professora de Física do 2ºB (mesma turma, outra disciplina), um aluno
 * do 2ºB e o material de demonstração de Química, enviado pela coordenação e já extraído. Tudo sintético.
 */
export interface EscolaComAssistente extends EscolaComTurma {
  readonly escolaId: string
  readonly professora: SessaoDeTeste
  readonly colega: SessaoDeTeste
  /** A professora de Física do 2ºB: a mesma turma da professora, outra disciplina. */
  readonly deFisica: SessaoDeTeste
  readonly aluno: SessaoDeTeste
  readonly materialId: string
}

/** Os nomes que o teste procura onde eles nunca podem aparecer (PDF, log, auditoria). */
export const NOME_DA_PROFESSORA_DE_TESTE = 'Professora Sintética Helena Prado'
export const NOME_DO_ALUNO_DE_TESTE = 'Aluno Sintético Caio Moreira'

/** Vínculo de professor `confirmado`, como a coordenação cria e o professor confirma (9.0), gravado direto. */
export async function vincularProfessor(bancada: BancadaDeSessoes, escola: EscolaComTurma, usuarioId: string, turmaId: string, disciplinaId: string, estado: 'confirmado' | 'pendente' = 'confirmado'): Promise<void> {
  await bancada.pool.query(
    `insert into vinculo (escola_id, ano_letivo_id, usuario_id, turma_id, disciplina_id, papel, estado, criado_por, decidido_em) values ($1, $2, $3, $4, $5, 'professor', $6, $7, case when $6 = 'confirmado' then now() end)`,
    [escola.coordenacao.escolaId, escola.anoLetivoId, usuarioId, turmaId, disciplinaId, estado, escola.coordenacao.usuarioId],
  )
}

/**
 * O PDF de demonstração enviado pela coordenação, pela rota `POST /v1/materiais`, com titularidade da escola e a
 * licença declarada, e já extraído: `pronto`, com um trecho por página. Devolve o id do material. `arquivo` troca o
 * PDF quando a mesma escola precisa de um segundo material (o mesmo arquivo duas vezes é `CONFLITO`).
 */
export async function enviarMaterialDeDemonstracao(api: ApiDeTeste, escola: EscolaComTurma, disciplinaId: string, titulo: string = MATERIAL_DE_DEMONSTRACAO.titulo, arquivo: Buffer = PDF_DE_DEMONSTRACAO): Promise<string> {
  const resposta = await enviarMaterial(api, { token: await escola.coordenacao.tokenNovo() }, { titulo, disciplinaId }, { arquivo })
  if (resposta.status !== 201) throw new Error(`material de teste não enviado: ${String(resposta.status)} ${resposta.corpo.erro?.codigo ?? ''}`)
  await esperarExtracao(api)
  return resposta.corpo['id'] as string
}

export async function montarEscolaComAssistente(api: ApiDeTeste, bancada: BancadaDeSessoes): Promise<EscolaComAssistente> {
  const escola = await montarEscolaComTurma(api, bancada)
  const { escolaId } = escola.coordenacao
  const [professora, colega, deFisica] = await bancada.sessoes(escolaId, { papel: 'professor', quantidade: 3 })
  const aluno = await bancada.sessao(escolaId, 'aluno')
  if (professora === undefined || colega === undefined || deFisica === undefined) throw new Error('sessões de teste não criadas')
  await bancada.pool.query('update usuario set nome = $1 where id = $2', [NOME_DA_PROFESSORA_DE_TESTE, professora.usuarioId])
  await bancada.pool.query('update usuario set nome = $1 where id = $2', [NOME_DO_ALUNO_DE_TESTE, aluno.usuarioId])
  await vincularProfessor(bancada, escola, professora.usuarioId, escola.turma, escola.quimica)
  await vincularProfessor(bancada, escola, colega.usuarioId, escola.outraTurma, escola.quimica)
  await vincularProfessor(bancada, escola, deFisica.usuarioId, escola.turma, escola.fisica)
  await bancada.pool.query(
    `insert into vinculo (escola_id, ano_letivo_id, usuario_id, turma_id, papel, estado, criado_por, decidido_em) values ($1, $2, $3, $4, 'aluno', 'confirmado', $5, now())`,
    [escolaId, escola.anoLetivoId, aluno.usuarioId, escola.turma, escola.coordenacao.usuarioId],
  )
  const materialId = await enviarMaterialDeDemonstracao(api, escola, escola.quimica)
  return { ...escola, escolaId, professora, colega, deFisica, aluno, materialId }
}

/** O contexto que a `GuardaDeSessao` gravaria para esta pessoa: é nele que um service chamado direto roda, como numa rota. */
export function comoPessoa<T>(escola: EscolaComAssistente, sessao: SessaoDeTeste, papel: PapelDeUsuario, funcao: () => T): T {
  const contexto: ContextoDaRequisicao = { requisicaoId: randomUUID(), escolaId: escola.escolaId, usuarioId: sessao.usuarioId, papel, sessaoId: sessao.sessaoId, anoLetivoId: escola.anoLetivoId }
  return executarNoContexto(contexto, funcao)
}

export interface ExecucaoLida {
  readonly estado: string
  readonly erro: string | null
  readonly resultado: (Record<string, unknown> & { tipo: string; artefatoId?: string; entregaId?: string | null; mensagem?: Record<string, unknown> }) | null
}

/** Espera o executor terminar o que tem e lê a execução como a tela lê, em `GET /v1/execucoes/:id`. */
export async function execucaoTerminada(api: ApiDeTeste, sessao: SessaoDeTeste, execucaoId: string): Promise<ExecucaoLida> {
  await api.app.get<ExecutorNoProcesso>(EXECUTOR_DE_AGENTE).ociosa()
  const resposta = await chamar(api.url, 'GET', `/v1/execucoes/${execucaoId}`, await sessao.tokenNovo())
  if (resposta.status !== 200) throw new Error(`a execução não foi lida: ${String(resposta.status)}`)
  return resposta.corpo as unknown as ExecucaoLida
}

/** O `POST` que dispara IA, e o id da execução que o `202` devolveu. */
export async function dispararExecucao(api: ApiDeTeste, sessao: SessaoDeTeste, caminho: string, corpo: Record<string, unknown>): Promise<string> {
  const resposta: RespostaHttp = await chamar(api.url, 'POST', caminho, await sessao.tokenNovo(), { chaveEnvio: randomUUID(), ...corpo })
  if (resposta.status !== 202) throw new Error(`o pedido não foi aceito: ${String(resposta.status)} ${resposta.corpo.erro?.codigo ?? ''}`)
  return resposta.corpo['execucaoId'] as string
}

/** Zera os contadores do limite de pedidos de IA, para um teste não gastar o minuto do outro. */
export async function zerarLimiteDePedidosDeIa(api: ApiDeTeste): Promise<void> {
  const redis = api.app.get<Redis>(CLIENTE_REDIS_LOGIN)
  const chaves = await redis.keys('ia:pedidos-*')
  if (chaves.length > 0) await redis.del(...chaves)
}

/** Quantas linhas da escola há na tabela, com o filtro dado. */
export async function contarNaEscola(bancada: BancadaDeSessoes, tabela: string, escolaId: string, filtro = 'true'): Promise<number> {
  const { rows } = await bancada.pool.query<{ total: string }>(`select count(*) as total from ${tabela} where escola_id = $1 and ${filtro}`, [escolaId])
  return Number(rows[0]?.total)
}
