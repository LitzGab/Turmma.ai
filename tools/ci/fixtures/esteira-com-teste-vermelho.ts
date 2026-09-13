import { encerrarCom, executarEtapas } from '../executar.ts'

// Mesmo caminho de saída dos scripts `ci:*`, com um teste vermelho no lugar dos testes reais.
await encerrarCom(
  executarEtapas(
    [
      {
        nome: 'teste de fixture vermelho',
        comando: 'npx',
        argumentos: ['vitest', 'run', '--config', 'tools/ci/fixtures/teste-vermelho/vitest.config.ts'],
      },
      { nome: 'etapa que não pode rodar', comando: 'node', argumentos: ['-e', 'console.log("ETAPA_SEGUINTE_RODOU")'] },
    ],
    () => [{ nome: 'finalização', comando: 'node', argumentos: ['-e', 'console.log("FINALIZACAO_RODOU")'] }],
  ),
)
