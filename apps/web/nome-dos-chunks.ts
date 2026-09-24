/**
 * O nome dos arquivos de JS do build (Tech Spec da A0, seção 9, "Orçamento"). O `.size-limit.json` mede dois grupos
 * pelo nome: a entrada (`index-*.js`, 150 kB) e a área do operador (`operacao-*.js`, 60 kB). Os dois nomes precisam ser
 * garantidos aqui, e não deixados ao acaso do nome do módulo:
 *
 * - o chunk carregado por `import()` leva o nome do módulo de onde saiu, e um `import()` de um `index.tsx` viraria
 *   `index-*.js` e contaria contra a entrada. Por isso todo chunk que não é entrada ganha o prefixo `parte-`;
 * - o chunk que sai de `src/operacao/` é `operacao-*.js`, qualquer que seja o arquivo da fachada.
 *
 * Por nome, e não por `manualChunks`: no Rolldown do Vite 8 ele vira um grupo que, por padrão, puxa junto as
 * dependências dos módulos capturados (React, os componentes da entrada), e a entrada passaria a importar o chunk da
 * operação — o contrário do que se quer.
 */

/** O mínimo de um chunk que o nome precisa: o módulo de fachada, quando ele existe. */
export interface ChunkParaNomear {
  readonly facadeModuleId: string | null
}

/** A pasta da área do operador, como aparece no id do módulo (sempre com `/`, também no Windows do Vite). */
const PASTA_DA_OPERACAO = '/apps/web/src/operacao/'

export function nomeDoChunk(chunk: ChunkParaNomear): string {
  if (chunk.facadeModuleId?.replaceAll('\\', '/').includes(PASTA_DA_OPERACAO) === true) return 'assets/operacao-[hash].js'
  return 'assets/parte-[name]-[hash].js'
}
