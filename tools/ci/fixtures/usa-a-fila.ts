// Fixture do teste `tools/ci/fila-de-carga.test.ts`: um "portão" de brinquedo que entra na fila de carga, anota quando
// entrou e saiu num diário, e segura o lugar por alguns milissegundos. Com `--filho`, roda uma segunda cópia de si
// mesmo por dentro, como o portão faz com `npm run test:e2e`.
//
//   node tools/ci/fixtures/usa-a-fila.ts <diário> <nome> <milissegundos> [--filho]
import { spawnSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { garantirFilaDeCarga } from '../fila-de-carga.ts'

await garantirFilaDeCarga()

const [diario, nome, milissegundos, modo] = process.argv.slice(2)
if (diario === undefined || nome === undefined || milissegundos === undefined) process.exit(2)

appendFileSync(diario, `${nome} entrou ${String(Date.now())}\n`)
if (modo === '--falha') process.exit(3)
if (modo === '--filho') {
  const resultado = spawnSync(process.execPath, [process.argv[1] ?? '', diario, `${nome}-filho`, milissegundos], { stdio: 'inherit' })
  if (resultado.status !== 0) process.exit(resultado.status ?? 1)
} else {
  await new Promise((resolver) => setTimeout(resolver, Number(milissegundos)))
}
appendFileSync(diario, `${nome} saiu ${String(Date.now())}\n`)
