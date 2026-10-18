import { etapasDeEncerramento } from './compose.ts'
import { encerrarCom, executarEtapas } from './executar.ts'
import { garantirFilaDeCarga } from './fila-de-carga.ts'
import { etapasDoE2e, tetoDoE2e } from './prazo-do-e2e.ts'

// A máquina é uma só: o e2e de duas linhas ao mesmo tempo estoura os 30 s. Sem o lugar na fila, este comando espera a vez
// (`tools/ci/fila-de-carga.ts`); na esteira não há fila.
await garantirFilaDeCarga()

// `npm run test:e2e` mantém o ambiente de pé para o desenvolvedor; a esteira sempre derruba.
const manterAmbiente = process.argv.includes('--manter-ambiente')
const naEsteira = process.env['CI'] === 'true'

// As etapas, com a fatia e o aviso de prazo da etapa dos testes, vêm de `tools/ci/prazo-do-e2e.ts`.
await encerrarCom(
  executarEtapas(etapasDoE2e(process.argv.slice(2), tetoDoE2e(), naEsteira), (codigo) =>
    etapasDeEncerramento(codigo, !manterAmbiente),
  ),
)
