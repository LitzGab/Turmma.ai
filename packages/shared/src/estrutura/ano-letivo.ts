import { z } from 'zod'
import { esquemaDePagina } from './paginacao.js'

export const SITUACOES_DO_ANO_LETIVO = ['planejado', 'em_curso', 'encerrado'] as const
export type SituacaoDoAnoLetivo = (typeof SITUACOES_DO_ANO_LETIVO)[number]

/** Os anos aceitos, os mesmos do check `ano_letivo_ano_valido`. */
export const MENOR_ANO_LETIVO = 2000
export const MAIOR_ANO_LETIVO = 2100

/**
 * Corpo de `POST /v1/anos-letivos`: o ano e o período. Nasce `planejado`; abrir é outra rota. Estrito: nada de escola
 * nem de situação, que não se escolhem pelo corpo.
 */
export const esquemaPedidoCriarAnoLetivo = z
  .object({
    ano: z.number().int().min(MENOR_ANO_LETIVO).max(MAIOR_ANO_LETIVO),
    inicio: z.iso.date(),
    fim: z.iso.date(),
  })
  .strict()
  .refine((pedido) => pedido.fim > pedido.inicio, { path: ['fim'] })

export type PedidoCriarAnoLetivo = z.infer<typeof esquemaPedidoCriarAnoLetivo>

export const esquemaAnoLetivo = z
  .object({
    id: z.uuid(),
    ano: z.number().int(),
    inicio: z.iso.date(),
    fim: z.iso.date(),
    situacao: z.enum(SITUACOES_DO_ANO_LETIVO),
  })
  .strict()

export type AnoLetivo = z.infer<typeof esquemaAnoLetivo>

/** Resposta de criar, abrir e encerrar um ano letivo. */
export const esquemaRespostaAnoLetivo = esquemaAnoLetivo
export type RespostaAnoLetivo = AnoLetivo

/** Resposta de `GET /v1/anos-letivos`. */
export const esquemaRespostaListaDeAnosLetivos = esquemaDePagina(esquemaAnoLetivo)
export type RespostaListaDeAnosLetivos = z.infer<typeof esquemaRespostaListaDeAnosLetivos>
