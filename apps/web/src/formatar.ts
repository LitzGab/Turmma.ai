// Data e número sempre pelo Intl em pt-BR (regra 50, item 12). Os formatadores são criados uma vez.

const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
// Data sem hora (`2026-09-13`) é lida em UTC e mostrada em UTC: senão o fuso a leva para o dia anterior.
const dataSemHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' })
const numero = new Intl.NumberFormat('pt-BR')

/** `2026-09-14T13:05:00.000Z` → `14/09/2026, 10:05`, no fuso do navegador. */
export function formatarDataHora(iso: string): string {
  return dataHora.format(new Date(iso))
}

/** `2026-09-13` → `13 de setembro de 2026`. */
export function formatarData(data: string): string {
  return dataSemHora.format(new Date(`${data}T00:00:00Z`))
}

/** `1234` com `aviso`/`avisos` → `1.234 avisos`. Singular só no 1: o CLDR de pt trata 0 como singular, e se escreve "0 avisos". */
export function formatarQuantidade(quantidade: number, singular: string, pluralizado: string): string {
  return `${numero.format(quantidade)} ${quantidade === 1 ? singular : pluralizado}`
}
