import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const raizRepositorio = fileURLToPath(new URL('../..', import.meta.url))

export interface Etapa {
  nome: string
  comando: string
  argumentos: readonly string[]
}

export function rodarEtapa(etapa: Etapa): Promise<number> {
  process.stdout.write(`\n▶ ${etapa.nome}\n`)
  return new Promise((resolver) => {
    const processo = spawn(etapa.comando, etapa.argumentos, { cwd: raizRepositorio, stdio: 'inherit' })
    processo.on('error', () => resolver(127))
    // Morto por sinal também é falha: `code` nulo não pode virar sucesso.
    processo.on('close', (codigo) => resolver(codigo ?? 1))
  })
}

/**
 * Roda as etapas em ordem e para na primeira que falhar. A finalização (derrubar o compose,
 * por exemplo) roda sempre, e nunca apaga a falha: o código devolvido é o da primeira etapa
 * que falhou, ou o da finalização se só ela falhou.
 */
export async function executarEtapas(
  etapas: readonly Etapa[],
  finalizacao: (codigo: number) => readonly Etapa[] = () => [],
): Promise<number> {
  let codigo = 0
  for (const etapa of etapas) {
    codigo = await rodarEtapa(etapa)
    if (codigo !== 0) break
  }
  for (const etapa of finalizacao(codigo)) {
    const codigoFinalizacao = await rodarEtapa(etapa)
    if (codigo === 0) codigo = codigoFinalizacao
  }
  return codigo
}

export async function encerrarCom(execucao: Promise<number>): Promise<never> {
  const codigo = await execucao
  process.stdout.write(codigo === 0 ? '\n✔ esteira: etapa verde\n' : `\n✖ esteira: falhou com código ${codigo}\n`)
  process.exit(codigo)
}
