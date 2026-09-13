import { ESLint } from 'eslint'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { REGRAS_DAS_GUARDAS } from './index.mjs'

export const raizDasGuardas = fileURLToPath(new URL('../..', import.meta.url))
const regrasDasGuardas = new Set<string>(REGRAS_DAS_GUARDAS)

/**
 * ESLint só com as guardas e sem nenhum comentário de configuração. O `no-restricted-disable`
 * reprova o `eslint-disable` de uma guarda, mas um comentário consegue desligar a ele mesmo, e
 * `/* eslint guardas/...: off *\/` nem passa por ele. Aqui nenhum dos dois tem efeito: a guarda
 * roda sobre o código como ele é. A configuração é sempre a da raiz: um `eslint.config.*` numa
 * subpasta substituiria a da raiz para os arquivos dali e levaria as guardas junto.
 */
export function criarEslintDasGuardas(): ESLint {
  return new ESLint({
    cwd: raizDasGuardas,
    overrideConfigFile: join(raizDasGuardas, 'eslint.config.mjs'),
    allowInlineConfig: false,
    ruleFilter: ({ ruleId }) => regrasDasGuardas.has(ruleId),
  })
}

/** Só o que é violação de guarda: o aviso de diretiva ignorada, sem regra, fica de fora. */
export function violacoesDasGuardas(resultados: readonly ESLint.LintResult[]): ESLint.LintResult[] {
  return resultados
    .map((resultado) => {
      const mensagens = resultado.messages.filter((mensagem) => mensagem.ruleId !== null && regrasDasGuardas.has(mensagem.ruleId))
      return { ...resultado, messages: mensagens, errorCount: mensagens.length, warningCount: 0, fatalErrorCount: 0 }
    })
    .filter((resultado) => resultado.messages.length > 0)
}

export type Entrada = { arquivos: string[] } | { texto: string; caminho: string }

/** Roda a passada das guardas e devolve o código de saída (1 com qualquer violação) e o relatório. */
export async function verificarGuardas(entrada: Entrada): Promise<{ codigo: number; relatorio: string }> {
  const eslint = criarEslintDasGuardas()
  const resultados =
    'arquivos' in entrada
      ? await eslint.lintFiles(entrada.arquivos)
      : await eslint.lintText(entrada.texto, { filePath: join(raizDasGuardas, entrada.caminho) })
  const violacoes = violacoesDasGuardas(resultados)
  if (violacoes.length === 0) return { codigo: 0, relatorio: '✔ guardas: nenhuma violação, com os comentários do ESLint ignorados\n' }
  const formatador = await eslint.loadFormatter('stylish')
  return { codigo: 1, relatorio: `${await formatador.format(violacoes)}\n✖ guardas: violação que nenhum comentário desliga\n` }
}
