import { z } from 'zod'
import { esquemaConsultaPaginada, esquemaDePagina } from './paginacao.js'
import { esquemaSerie } from './serie.js'

export const TURNOS = ['manha', 'tarde', 'noite', 'integral'] as const
export type Turno = (typeof TURNOS)[number]

export const TAMANHO_MAXIMO_NOME_TURMA = 40

/**
 * Corpo de `POST /v1/turmas`: a série, o nome ("2ºB") e o turno. A turma nasce no ano letivo em curso da escola, que
 * vem da sessão (regra 10, item 3; regra 60, item 5).
 *
 * `anoLetivoId` é opcional e só confere: a tela que mostra um ano manda o id dele, e um ano que não é o em curso da
 * escola (o planejado de 2027, o encerrado de 2025, o de outra escola) responde como inexistente, em vez de a turma
 * cair calada no ano em curso. Nunca escolhe o ano da turma.
 */
export const esquemaPedidoCriarTurma = z
  .object({
    serieId: z.uuid(),
    nome: z.string().trim().min(1).max(TAMANHO_MAXIMO_NOME_TURMA),
    turno: z.enum(TURNOS).optional(),
    anoLetivoId: z.uuid().optional(),
  })
  .strict()

export type PedidoCriarTurma = z.infer<typeof esquemaPedidoCriarTurma>

export const esquemaTurma = z
  .object({
    id: z.uuid(),
    anoLetivoId: z.uuid(),
    nome: z.string(),
    turno: z.enum(TURNOS).nullable(),
    serie: esquemaSerie,
  })
  .strict()

export type Turma = z.infer<typeof esquemaTurma>

/** Resposta de `POST /v1/turmas`. */
export const esquemaRespostaTurma = esquemaTurma
export type RespostaTurma = Turma

/** Resposta de `GET /v1/turmas`: as turmas do ano em curso. */
export const esquemaRespostaListaDeTurmas = esquemaDePagina(esquemaTurma)
export type RespostaListaDeTurmas = z.infer<typeof esquemaRespostaListaDeTurmas>

/** Resposta de `GET /v1/turmas/:id`: a turma aberta por quem tem acesso a ela (a coordenação, ou o professor com vínculo confirmado). */
export const esquemaRespostaTurmaAberta = z
  .object({
    id: z.uuid(),
    nome: z.string(),
    serie: esquemaSerie,
  })
  .strict()

export type RespostaTurmaAberta = z.infer<typeof esquemaRespostaTurmaAberta>

/**
 * Por que a coordenação abre a lista de alunos de uma turma (regra 20, item 10): código fixo, nunca texto livre, que
 * fica na auditoria da leitura. O professor com vínculo confirmado lê a própria turma sem finalidade.
 */
export const FINALIDADES_DA_LEITURA_DE_ALUNOS = ['acompanhamento_pedagogico', 'atendimento_a_familia', 'conferencia_de_cadastro'] as const
export type FinalidadeDaLeituraDeAlunos = (typeof FINALIDADES_DA_LEITURA_DE_ALUNOS)[number]

/**
 * `?anoLetivoId` de `GET /v1/turmas/:id` e `/alunos` (10.0, RF16): só filtro de leitura, e só de um ano `encerrado` da
 * escola da sessão. Sem ele, a leitura é do ano em curso. O ano de outra escola, o ainda em curso, o planejado e o
 * inexistente respondem como a turma inexistente (regra 10, itens 3 e 6). Nenhuma rota de escrita o aceita.
 */
const campoAnoDaLeitura = { anoLetivoId: z.uuid().optional() }

/** Consulta de `GET /v1/turmas/:id`: só o ano encerrado que se quer ler, se houver. */
export const esquemaConsultaTurma = z.object(campoAnoDaLeitura).strict()
export type ConsultaTurma = z.infer<typeof esquemaConsultaTurma>

/** Consulta de `GET /v1/turmas/:id/alunos`: a página, a finalidade, que a coordenação é obrigada a mandar, e o ano encerrado, se houver. */
export const esquemaConsultaAlunosDaTurma = esquemaConsultaPaginada
  .extend({ finalidade: z.enum(FINALIDADES_DA_LEITURA_DE_ALUNOS).optional(), ...campoAnoDaLeitura })
  .strict()
export type ConsultaAlunosDaTurma = z.infer<typeof esquemaConsultaAlunosDaTurma>

/** Um aluno da turma: o id e o nome, e nada mais (regra 20, item 4). */
export const esquemaAlunoDaTurma = z.object({ usuarioId: z.uuid(), nome: z.string() }).strict()
export type AlunoDaTurma = z.infer<typeof esquemaAlunoDaTurma>

/** Resposta de `GET /v1/turmas/:id/alunos`, em ordem de id, com `proxima` quando há mais. */
export const esquemaRespostaAlunosDaTurma = esquemaDePagina(esquemaAlunoDaTurma)
export type RespostaAlunosDaTurma = z.infer<typeof esquemaRespostaAlunosDaTurma>
