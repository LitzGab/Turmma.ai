import { encerrarCom, executarEtapas } from './executar.ts'

await encerrarCom(
  executarEtapas([
    { nome: 'tipos', comando: 'npm', argumentos: ['run', 'typecheck'] },
    { nome: 'lint', comando: 'npm', argumentos: ['run', 'lint'] },
    { nome: 'testes de unidade', comando: 'npm', argumentos: ['run', 'test:unidade'] },
  ]),
)
