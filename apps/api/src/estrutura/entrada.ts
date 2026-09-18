import { ErroDeDominio } from '@educa/nucleo'
import { CodigoDeErro, esquemaConsultaPaginada, type ConsultaPaginada } from '@educa/shared'
import { z } from 'zod'

const esquemaId = z.uuid()

/** O id do caminho. Fora do formato, nenhum id existe assim: responde como o inexistente (regra 10, item 6). */
export function idDoCaminho(id: string): string {
  const lido = esquemaId.safeParse(id)
  if (!lido.success) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
  return lido.data.toLowerCase()
}

/** A consulta das listagens da estrutura, ou `ENTRADA_INVALIDA`: página fora do formato, limite acima de 100, campo a mais. */
export function lerConsultaPaginada(consulta: unknown): ConsultaPaginada {
  const lida = esquemaConsultaPaginada.safeParse(consulta)
  if (!lida.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
  return lida.data
}

/**
 * Corta a página: o repository busca `limite + 1` linhas em ordem de id, e a linha a mais só diz que há próxima
 * página, que começa depois do último id devolvido.
 */
export function paginar<Linha extends { readonly id: string }>(linhas: readonly Linha[], limite: number): { itens: Linha[]; proxima?: string } {
  return paginarPor(linhas, limite, (linha) => linha.id)
}

/** O mesmo corte, para a página ordenada por outra chave (os alunos da turma vão em ordem de `usuarioId`). */
export function paginarPor<Linha>(linhas: readonly Linha[], limite: number, chave: (linha: Linha) => string): { itens: Linha[]; proxima?: string } {
  const itens = linhas.slice(0, limite)
  const ultima = itens.at(-1)
  return linhas.length > limite && ultima !== undefined ? { itens, proxima: chave(ultima) } : { itens }
}

/** O corpo ou a consulta, ou `ENTRADA_INVALIDA` quando não passa no esquema (campo a mais, código fora da lista). */
export function lerEntrada<Esquema extends z.ZodType>(esquema: Esquema, corpo: unknown): z.infer<Esquema> {
  const lido = esquema.safeParse(corpo)
  if (!lido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
  return lido.data
}
