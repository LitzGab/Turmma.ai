import { registerHooks } from 'node:module'

/**
 * Faz o `node` puro achar o `.ts` quando o fonte importa o vizinho com `.js`, que é como `apps/` e `packages/` escrevem
 * (é o que o `tsc` emite). Sem isto as peças de semente do e2e, que importam `packages/shared` pelo fonte, só carregam
 * pelo Playwright e pelo Vitest. Vale só para importação relativa que não existe como está escrita.
 */
export function resolverFonteComJs(): void {
  registerHooks({
    resolve(especificador, contexto, proximo) {
      try {
        return proximo(especificador, contexto)
      } catch (erro) {
        if (/^\.{1,2}\//.test(especificador) && especificador.endsWith('.js')) return proximo(`${especificador.slice(0, -3)}.ts`, contexto)
        throw erro
      }
    },
  })
}
