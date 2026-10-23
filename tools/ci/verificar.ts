import { ETAPAS_DE_GUARDA } from './etapas-de-guarda.ts'
import { encerrarCom, executarEtapas } from './executar.ts'

await encerrarCom(
  executarEtapas([
    { nome: 'tipos', comando: 'npm', argumentos: ['run', 'typecheck'] },
    { nome: 'lint e guardas', comando: 'npm', argumentos: ['run', 'lint'] },
    ...ETAPAS_DE_GUARDA,
    { nome: 'testes de unidade', comando: 'npm', argumentos: ['run', 'test:unidade'] },
  ]),
)
