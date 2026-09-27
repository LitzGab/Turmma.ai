/**
 * O nome dos arquivos de JS do build (Tech Spec da A0, seção 9, "Orçamento"; Tech Spec da A1, seção 9, "Fronteira"). O
 * `.size-limit.json` mede cada grupo pelo nome: a entrada (`index-*.js`, 150 kB), a área do operador (`operacao-*.js`) e
 * a área de cada papel da escola (`coordenacao-*.js`, `professor-*.js`, `aluno-*.js`). Os nomes precisam ser garantidos
 * aqui, e não deixados ao acaso do nome do módulo:
 *
 * - o chunk carregado por `import()` leva o nome do módulo de onde saiu, e um `import()` de um `index.tsx` viraria
 *   `index-*.js` e contaria contra a entrada. Por isso todo chunk que não é entrada nem área ganha o prefixo `parte-`;
 * - o chunk que sai de `src/operacao/` é `operacao-*.js`, qualquer que seja o arquivo da fachada;
 * - o que sai de `src/areas/<pasta>/` é `<pasta>-*.js`: todas as rotas de uma área têm a mesma fachada, o `rotas.tsx`
 *   dela, e o teto mede a área inteira.
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

/** As pastas das áreas da escola, uma por papel, e o prefixo do chunk de cada uma, que é o nome da pasta. */
export const AREAS_DA_ESCOLA = ['coordenacao', 'professor', 'aluno'] as const

const PASTA_DAS_AREAS = '/apps/web/src/areas/'

export function nomeDoChunk(chunk: ChunkParaNomear): string {
  const fachada = chunk.facadeModuleId?.replaceAll('\\', '/')
  if (fachada === undefined) return 'assets/parte-[name]-[hash].js'
  if (fachada.includes(PASTA_DA_OPERACAO)) return 'assets/operacao-[hash].js'
  const area = AREAS_DA_ESCOLA.find((pasta) => fachada.includes(`${PASTA_DAS_AREAS}${pasta}/`))
  if (area !== undefined) return `assets/${area}-[hash].js`
  return 'assets/parte-[name]-[hash].js'
}
