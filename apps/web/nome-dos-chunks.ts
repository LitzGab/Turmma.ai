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
 * - o que sai de `src/galeria/` é `galeria-*.js`: a galeria das peças está no build porque o e2e roda sobre ele, e só
 *   quem digita o endereço dela a baixa;
 * - o pedaço **sem fachada** que só tem peças do MVP de apresentação (`componentes/ia/` e as peças gerais listadas em
 *   `PECAS_FORA_DA_ENTRADA`) é `pecas-*.js`. É o pedaço que o Rolldown cria sozinho para o que duas áreas dividem. Como
 *   `parte-*`, ele contaria no teto do primeiro carregamento sem nunca ser baixado nele: as peças só chegam por
 *   `import()`, com a tela que as usa. O teste do build de verdade prova as duas metades — nenhuma peça na entrada nem
 *   no que ela baixa junto, e nada do que ela baixa junto com outro nome que não `parte-*`.
 *
 * Por nome, e não por `manualChunks`: no Rolldown do Vite 8 ele vira um grupo que, por padrão, puxa junto as
 * dependências dos módulos capturados (React, os componentes da entrada), e a entrada passaria a importar o chunk da
 * operação — o contrário do que se quer.
 */

/** O mínimo de um chunk que o nome precisa: o módulo de fachada, quando ele existe, e os módulos que ele leva. */
export interface ChunkParaNomear {
  readonly facadeModuleId: string | null
  readonly moduleIds?: readonly string[]
}

/** A pasta da área do operador, como aparece no id do módulo (sempre com `/`, também no Windows do Vite). */
const PASTA_DA_OPERACAO = '/apps/web/src/operacao/'

/** As pastas das áreas da escola, uma por papel, e o prefixo do chunk de cada uma, que é o nome da pasta. */
export const AREAS_DA_ESCOLA = ['coordenacao', 'professor', 'aluno'] as const

const PASTA_DAS_AREAS = '/apps/web/src/areas/'

/** A pasta da galeria das peças, que só existe para o e2e e para quem desenvolve. */
const PASTA_DA_GALERIA = '/apps/web/src/galeria/'

const PASTA_DA_WEB = '/apps/web/src/'
const PASTA_DOS_COMPONENTES = '/apps/web/src/componentes/'
const PASTA_DAS_PECAS_DE_IA = '/apps/web/src/componentes/ia/'

/**
 * As peças gerais do MVP de apresentação (`docs/mvp-rapido.md` 9.3) que **não** estão no primeiro carregamento: os
 * arquivos de `src/componentes/`, sem a extensão. As de IA são a pasta `componentes/ia/` inteira. O `Botao`, o `Dialogo`,
 * o `Campo` e os estados não entram na lista: a entrada os usa, e eles pesam no teto dela.
 *
 * A peça que uma tela da entrada passar a usar **sai daqui**: o teste do build reprova a peça da lista que aparecer no
 * primeiro carregamento, em vez de deixá-la passar sem ser medida.
 */
export const PECAS_FORA_DA_ENTRADA = [
  'Abas',
  'barra',
  'BarraRotulada',
  'Cartao',
  'DialogoDeConfirmacao',
  'Faixa',
  'flutuante',
  'Menu',
  'NumeroPainel',
  'Selecao',
  'SeloDeEstado',
  'teclado-das-abas',
  'teclado-do-menu',
  'Tela',
] as const

/** O módulo é uma peça que fica fora do primeiro carregamento? */
export function ehPecaForaDaEntrada(idDoModulo: string): boolean {
  const id = idDoModulo.replaceAll('\\', '/').replace(/[?#].*$/, '')
  if (id.includes(PASTA_DAS_PECAS_DE_IA)) return true
  const posicao = id.indexOf(PASTA_DOS_COMPONENTES)
  if (posicao === -1) return false
  const arquivo = id.slice(posicao + PASTA_DOS_COMPONENTES.length).replace(/\.tsx?$/, '')
  return (PECAS_FORA_DA_ENTRADA as readonly string[]).includes(arquivo)
}

/**
 * O pedaço só tem peças? Conta o código da web: os módulos de fora (`node_modules`, `packages/shared`) acompanham quem
 * os usa. Pedaço sem nenhum módulo da web não é de peças.
 */
function soTemPecas(idsDosModulos: readonly string[]): boolean {
  const daWeb = idsDosModulos.filter((id) => id.replaceAll('\\', '/').includes(PASTA_DA_WEB))
  return daWeb.length > 0 && daWeb.every(ehPecaForaDaEntrada)
}

export function nomeDoChunk(chunk: ChunkParaNomear): string {
  const fachada = chunk.facadeModuleId?.replaceAll('\\', '/')
  if (fachada === undefined) return soTemPecas(chunk.moduleIds ?? []) ? 'assets/pecas-[name]-[hash].js' : 'assets/parte-[name]-[hash].js'
  if (fachada.includes(PASTA_DA_OPERACAO)) return 'assets/operacao-[hash].js'
  if (fachada.includes(PASTA_DA_GALERIA)) return 'assets/galeria-[hash].js'
  const area = AREAS_DA_ESCOLA.find((pasta) => fachada.includes(`${PASTA_DAS_AREAS}${pasta}/`))
  if (area !== undefined) return `assets/${area}-[hash].js`
  return 'assets/parte-[name]-[hash].js'
}
