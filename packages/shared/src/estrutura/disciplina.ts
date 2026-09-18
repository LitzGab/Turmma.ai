import { z } from 'zod'
import { esquemaDePagina } from './paginacao.js'

/** As áreas do conhecimento da BNCC, para agrupar a disciplina. Opcional: a escola pode não informar. */
export const AREAS_DO_CONHECIMENTO = ['linguagens', 'matematica', 'ciencias_da_natureza', 'ciencias_humanas', 'ensino_religioso'] as const
export type AreaDoConhecimento = (typeof AREAS_DO_CONHECIMENTO)[number]

export const TAMANHO_MAXIMO_NOME_DISCIPLINA = 80

/**
 * Corpo de `POST /v1/disciplinas`: o nome ("Química") e, se a escola quiser, a área. O nome é único na escola sem
 * diferenciar maiúscula ("Química" e "química" conflitam). Estrito: nada de escola, que vem da sessão.
 */
export const esquemaPedidoCriarDisciplina = z
  .object({
    nome: z.string().trim().min(1).max(TAMANHO_MAXIMO_NOME_DISCIPLINA),
    area: z.enum(AREAS_DO_CONHECIMENTO).optional(),
  })
  .strict()

export type PedidoCriarDisciplina = z.infer<typeof esquemaPedidoCriarDisciplina>

export const esquemaDisciplina = z
  .object({
    id: z.uuid(),
    nome: z.string(),
    area: z.enum(AREAS_DO_CONHECIMENTO).nullable(),
  })
  .strict()

export type Disciplina = z.infer<typeof esquemaDisciplina>

/** Resposta de `POST /v1/disciplinas`. */
export const esquemaRespostaDisciplina = esquemaDisciplina
export type RespostaDisciplina = Disciplina

/** Resposta de `GET /v1/disciplinas`. */
export const esquemaRespostaListaDeDisciplinas = esquemaDePagina(esquemaDisciplina)
export type RespostaListaDeDisciplinas = z.infer<typeof esquemaRespostaListaDeDisciplinas>
