import { z } from 'zod'
import { esquemaDePagina } from './paginacao.js'
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
