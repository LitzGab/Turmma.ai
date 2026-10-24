// Quem é obrigatório num commit pelo caminho que ele altera (RF15, `techspec.md` §5(b)). A tabela legível, com o motivo de cada
// exceção, é `tasks/prd-harness/tabela-de-guardioes.md`; a fonte que vale é este arquivo, e o teste dele
// (`harness/guardioes.test.ts`) escreve os literais por extenso.
//
// O padrão são os quatro guardiões: todo arquivo de `apps/`, `packages/`, `e2e/`, `tools/guardas/` e `tools/testes/` pede
// `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer` e `infra-guardian`, testes e fixtures inclusive. Pasta nova
// nasce protegida. O que pede menos é exceção escrita abaixo, e a citação de uma regra no texto do arquivo soma o guardião dela.
//
// Este módulo não importa nenhum outro: o `portao.ts` o usa em `decidirCommit`, e o `portao-local.ts` para imprimir a lista.

export const OS_QUATRO = ['tenancy-guardian', 'privacy-guardian', 'conformidade-reviewer', 'infra-guardian'] as const
export type Guardiao = (typeof OS_QUATRO)[number]

/** De onde se lê um arquivo: do HEAD ou do índice (o que vai para o commit). */
export type OndeLer = 'head' | 'indice'
/** O conteúdo de um arquivo em `onde`, ou `null` quando ele não existe lá. */
export type ConteudoDe = (arquivo: string, onde: OndeLer) => string | null

interface Entrada {
  /** Prefixo de caminho, sem glob. Vale a entrada mais longa que casa. */
  prefixo: string
  guardioes: readonly Guardiao[]
}

const [T, P, C, I] = OS_QUATRO

/** As pastas em que todo arquivo pede os quatro. */
const PADRAO: readonly Entrada[] = ['apps/', 'packages/', 'e2e/', 'tools/guardas/', 'tools/testes/'].map((prefixo) => ({ prefixo, guardioes: OS_QUATRO }))

/** As exceções do código, com o motivo de cada uma em `tabela-de-guardioes.md`. Uma entrada que não casa nenhum arquivo versionado deixa a esteira vermelha. */
export const EXCECOES_DO_CODIGO: readonly { prefixo: string; guardioes: readonly Guardiao[] }[] = [
  { prefixo: 'apps/web/src/componentes/ui/', guardioes: [C, I] },
  { prefixo: 'apps/web/src/componentes/ui/ia/', guardioes: [P, C, I] },
  { prefixo: 'apps/web/src/estilos.css', guardioes: [C] },
  { prefixo: 'apps/web/src/tema.ts', guardioes: [] },
  { prefixo: 'apps/web/src/estilos.test.ts', guardioes: [] },
  { prefixo: 'apps/web/src/tema.test.ts', guardioes: [] },
  { prefixo: 'apps/web/src/contraste.test.ts', guardioes: [] },
  { prefixo: 'apps/web/src/galeria/', guardioes: [P, C] },
  { prefixo: 'apps/web/vite.config.ts', guardioes: [I] },
  { prefixo: 'apps/web/nome-dos-chunks.ts', guardioes: [I] },
  { prefixo: 'apps/web/nome-dos-chunks.test.ts', guardioes: [I] },
  { prefixo: 'apps/web/rebaixar-cor.ts', guardioes: [I] },
  { prefixo: 'apps/web/rebaixar-cor.test.ts', guardioes: [I] },
  { prefixo: 'apps/despachante/', guardioes: [T, P, I] },
  { prefixo: 'infra/', guardioes: [I, P] },
]

const ENTRADAS: readonly Entrada[] = [...PADRAO, ...EXCECOES_DO_CODIGO]

/** O sufixo de arquivo que toca dado de escola ou de pessoa: onde estiver, nunca cai em exceção e pede os quatro. */
const SUFIXOS_QUE_NUNCA_SAO_EXCECAO = ['.repository.ts', '.controller.ts', '.gateway.ts', '.service.ts']
const SEM_ESCOPO = '@SemEscopo('

/** A citação de uma regra soma o guardião dela. Sem diferença de maiúscula. */
const CITACOES: readonly { termo: RegExp; guardiao: Guardiao }[] = [
  { termo: /regra\s+10(?!\d)/i, guardiao: T },
  { termo: /regra\s+20(?!\d)/i, guardiao: P },
  { termo: /lgpd/i, guardiao: P },
  { termo: /regra\s+70(?!\d)/i, guardiao: C },
  { termo: /regra\s+80(?!\d)/i, guardiao: I },
]

/** A entrada mais longa que casa o caminho, ou `undefined` quando o arquivo não é código. */
function entradaDe(arquivo: string): Entrada | undefined {
  return ENTRADAS.filter((entrada) => arquivo.startsWith(entrada.prefixo)).sort((a, b) => b.prefixo.length - a.prefixo.length)[0]
}

function guardioesDoArquivo(arquivo: string, conteudoDe: ConteudoDe): Guardiao[] {
  const entrada = entradaDe(arquivo)
  if (!entrada) return []
  // O padrão pede os quatro e nada soma a mais: ler o arquivo não mudaria a resposta, e um commit grande de `apps/` não pagaria 2 leituras por arquivo.
  // Só a exceção chega abaixo, e é a ela que o sufixo e o `@SemEscopo(` se aplicam.
  if (entrada.guardioes.length === OS_QUATRO.length) return [...OS_QUATRO]
  // Os dois lados: tirar a garantia junto com o comentário que a citava não tira o guardião, porque o HEAD ainda a tem.
  const textos = [conteudoDe(arquivo, 'indice'), conteudoDe(arquivo, 'head')].filter((texto): texto is string => texto !== null)
  if (SUFIXOS_QUE_NUNCA_SAO_EXCECAO.some((sufixo) => arquivo.endsWith(sufixo)) || textos.some((texto) => texto.includes(SEM_ESCOPO))) return [...OS_QUATRO]
  const citados = CITACOES.filter((citacao) => textos.some((texto) => citacao.termo.test(texto))).map((citacao) => citacao.guardiao)
  return [...entrada.guardioes, ...citados]
}

/**
 * Os guardiões que os arquivos pedem, na ordem dos quatro. `conteudoDe` serve à citação e ao `@SemEscopo(`: lê o índice e o
 * HEAD, e o arquivo que não existe num dos dois lados vale pelo outro.
 */
export function guardioesDoCaminho(arquivos: readonly string[], conteudoDe: ConteudoDe): Guardiao[] {
  const pedidos = new Set(arquivos.flatMap((arquivo) => guardioesDoArquivo(arquivo, conteudoDe)))
  return OS_QUATRO.filter((guardiao) => pedidos.has(guardiao))
}
