import { readFileSync } from 'node:fs'
import { verificarGuardas } from './eslint-das-guardas.ts'

// Segunda passada do `npm run lint`: só as guardas, com todo comentário do ESLint ignorado.
// `--texto <caminho>` lê o código da entrada padrão como se estivesse naquele caminho (teste).
const indice = process.argv.indexOf('--texto')
const caminho = indice === -1 ? undefined : process.argv[indice + 1]
const { codigo, relatorio } = await verificarGuardas(
  caminho === undefined ? { arquivos: ['.'] } : { texto: readFileSync(0, 'utf8'), caminho },
)
process.stdout.write(relatorio)
process.exit(codigo)
