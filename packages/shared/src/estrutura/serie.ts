import { z } from 'zod'
import { esquemaDePagina } from './paginacao.js'

/** As etapas do recorte (D43): anos finais do Ensino Fundamental e Ensino Médio. */
export const ETAPAS = ['ef_anos_finais', 'em'] as const
export type Etapa = (typeof ETAPAS)[number]

/** Os anos de cada etapa: 6º ao 9º nos anos finais, 1º ao 3º no Ensino Médio. O check `serie_no_recorte` repete isto no banco. */
export const ANOS_DA_ETAPA = {
  ef_anos_finais: { menor: 6, maior: 9 },
  em: { menor: 1, maior: 3 },
} as const satisfies Record<Etapa, { menor: number; maior: number }>

/**
 * Corpo de `POST /v1/series`: a etapa e o ano dentro dela. "5º ano" e "4º do Ensino Médio" são recusados aqui, e de novo
 * pelo check do banco. Estrito: nada de escola, que vem da sessão.
 */
export const esquemaPedidoCriarSerie = z.discriminatedUnion('etapa', [
  z
    .object({ etapa: z.literal('ef_anos_finais'), ano: z.number().int().min(ANOS_DA_ETAPA.ef_anos_finais.menor).max(ANOS_DA_ETAPA.ef_anos_finais.maior) })
    .strict(),
  z.object({ etapa: z.literal('em'), ano: z.number().int().min(ANOS_DA_ETAPA.em.menor).max(ANOS_DA_ETAPA.em.maior) }).strict(),
])

export type PedidoCriarSerie = z.infer<typeof esquemaPedidoCriarSerie>

export const esquemaSerie = z
  .object({
    id: z.uuid(),
    etapa: z.enum(ETAPAS),
    ano: z.number().int(),
  })
  .strict()

export type Serie = z.infer<typeof esquemaSerie>

/** Resposta de `POST /v1/series`. */
export const esquemaRespostaSerie = esquemaSerie
export type RespostaSerie = Serie

/** Resposta de `GET /v1/series`. */
export const esquemaRespostaListaDeSeries = esquemaDePagina(esquemaSerie)
export type RespostaListaDeSeries = z.infer<typeof esquemaRespostaListaDeSeries>
