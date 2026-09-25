// Fixture da regra `@typescript-eslint/consistent-type-assertions` nos processadores do worker (eslint.config.mjs). Cada
// linha marcada é uma afirmação de tipo que esconderia do compilador a chave que faltasse nos totais de um job.
// O que não tem marca é o jeito certo, e não pode ser acusado.

type Alvo = 'registro' | 'sessao'
type Totais = Record<Alvo, number>
const ALVOS = ['registro', 'sessao'] as const

export function comObjetoAfirmado(): Totais {
  const totais = {} as Totais /* reprova: @typescript-eslint/consistent-type-assertions */
  for (const alvo of ALVOS) totais[alvo] = 0
  return totais
}

export function comParcialAfirmadoNoFim(): Totais {
  const parcial: Partial<Totais> = {}
  for (const alvo of ALVOS) parcial[alvo] = 0
  return parcial as Totais /* reprova: @typescript-eslint/consistent-type-assertions */
}

export function comObjetoLiteralTipado(): Totais {
  const totais: Totais = { registro: 0, sessao: 0 }
  return totais
}
