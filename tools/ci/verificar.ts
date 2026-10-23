import { encerrarCom, executarEtapas } from './executar.ts'
import { etapaAuditoriaDeDependencias, etapaDependenciasDeclaradas, etapaSegredos } from './etapas-de-guarda.ts'

await encerrarCom(
  executarEtapas([
    { nome: 'tipos', comando: 'npm', argumentos: ['run', 'typecheck'] },
    { nome: 'lint e guardas', comando: 'npm', argumentos: ['run', 'lint'] },
    etapaSegredos,
    etapaAuditoriaDeDependencias,
    etapaDependenciasDeclaradas,
    { nome: 'testes de unidade', comando: 'npm', argumentos: ['run', 'test:unidade'] },
  ]),
)
