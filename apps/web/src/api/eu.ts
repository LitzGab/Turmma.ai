import { esquemaRespostaEu } from '@educa/shared'
import { queryOptions } from '@tanstack/react-query'
import { buscarComSessao } from './sessao'

/** Quem está na sessão, na escola dela (`GET /v1/eu`). É a consulta que prova que o token da sessão vale. */
export const consultaEu = queryOptions({
  queryKey: ['eu'],
  queryFn: ({ signal }) => buscarComSessao('/v1/eu', esquemaRespostaEu, signal),
})
