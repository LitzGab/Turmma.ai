import { spawnSync } from 'node:child_process'
import { REGRAS_DE_TAMANHO } from './index.mjs'

// A catraca do tamanho (X5, 13.0; RF11, R37): `eslint-suppressions.json` é a linha de base das funções que já passavam do
// limite em 22/10/2026, e só encolhe. Quem confere é `catraca.test.ts`, com o que está aqui. O ESLint recusa a supressão
// que sobrou sem violação (`eslint . --prune-suppressions` a tira); o que ele não recusa é supressão que aumenta, e é isso
// que estas funções barram.

export type Supressoes = Record<string, Record<string, { count: number }>>

/** Quantas supressões cada regra tem, somadas entre os arquivos. */
export function somaPorRegra(supressoes: Supressoes): Record<string, number> {
  const soma: Record<string, number> = {}
  for (const regras of Object.values(supressoes)) {
    for (const [regra, { count }] of Object.entries(regras)) soma[regra] = (soma[regra] ?? 0) + count
  }
  return soma
}

/** Regra que não é de tamanho: a linha de base não pode esconder outra coisa (`no-explicit-any` não se suprime). */
function regrasForaDoTamanho(atual: Supressoes): string[] {
  return Object.entries(atual).flatMap(([arquivo, regras]) =>
    Object.keys(regras)
      .filter((regra) => !REGRAS_DE_TAMANHO.includes(regra))
      .map((regra) => `${arquivo}: ${regra} não é regra de tamanho`),
  )
}

/** A soma por regra é o `TETO`: uma a mais é supressão nova, uma a menos é corte sem baixar o `TETO` (quem corta baixa os dois). */
function somasForaDoTeto(atual: Supressoes, teto: Record<string, number>): string[] {
  const soma = somaPorRegra(atual)
  return [...new Set([...Object.keys(teto), ...Object.keys(soma)])].sort().flatMap((regra) => {
    const tem = soma[regra] ?? 0
    const pode = teto[regra] ?? 0
    return tem === pode ? [] : [`${regra}: ${tem} supressões, o TETO é ${pode}`]
  })
}

/**
 * Nenhum arquivo ganha supressão em relação ao HEAD, regra a regra: trocar uma função longa por outra no mesmo commit mantém a
 * soma e é o que esta conferência pega. `renomeadosDe` leva o arquivo movido (`git mv`) à sua origem no HEAD; o que não está
 * no HEAD nem é renomeado não nasce com supressão. Sem `doHead` (o commit que cria a linha de base), não há o que comparar.
 */
function arquivosQueGanharam(atual: Supressoes, doHead: Supressoes, renomeadosDe: ReadonlyMap<string, string>): string[] {
  return Object.entries(atual).flatMap(([arquivo, regras]) => {
    const origem = renomeadosDe.get(arquivo) ?? arquivo
    const antes = doHead[origem]
    return Object.entries(regras).flatMap(([regra, { count }]) => {
      const tinha = antes?.[regra]?.count ?? 0
      if (count <= tinha) return []
      return [antes === undefined ? `${arquivo}: arquivo sem supressão no HEAD (${regra}: ${count})` : `${arquivo}: ${regra} subiu de ${tinha} para ${count}`]
    })
  })
}

export interface EntradaDaCatraca {
  atual: Supressoes
  teto: Record<string, number>
  /** A linha de base do HEAD; `undefined` quando o HEAD ainda não a tem. */
  doHead: Supressoes | undefined
  renomeadosDe?: ReadonlyMap<string, string>
}

/** Os motivos de a catraca reprovar; lista vazia é verde. */
export function conferirCatraca({ atual, teto, doHead, renomeadosDe = new Map() }: EntradaDaCatraca): string[] {
  return [
    ...regrasForaDoTamanho(atual),
    ...somasForaDoTeto(atual, teto),
    ...(doHead === undefined ? [] : arquivosQueGanharam(atual, doHead, renomeadosDe)),
  ]
}

/** A linha de base do `HEAD` (`git show HEAD:eslint-suppressions.json`), ou `undefined` se o HEAD ainda não a tem. */
export function suprimidasDoHead(raiz: string): Supressoes | undefined {
  const resultado = spawnSync('git', ['show', 'HEAD:eslint-suppressions.json'], { cwd: raiz, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return resultado.status === 0 ? (JSON.parse(resultado.stdout) as Supressoes) : undefined
}

/**
 * Arquivo movido com `git mv` desde o HEAD: o novo caminho leva ao antigo. Sem isso, a tarefa que só move a pasta teria o
 * arquivo "novo" no HEAD e a supressão dele reprovaria; o mover com `mv` simples (sem `git add`) continua reprovando.
 */
export function renomeadosDesdeOHead(raiz: string): Map<string, string> {
  const resultado = spawnSync('git', ['diff', '--name-status', '--find-renames', 'HEAD'], { cwd: raiz, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  const renomeados = new Map<string, string>()
  for (const linha of resultado.stdout.split('\n')) {
    // `R100<TAB>antigo<TAB>novo`: só o rename tem três colunas; o resto (`M`, `D`, `A`) tem duas.
    const [, antigo = '', novo = ''] = linha.split('\t')
    if (novo !== '') renomeados.set(novo, antigo)
  }
  return renomeados
}
