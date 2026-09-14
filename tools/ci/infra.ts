import { executarTestesComInfra } from './compose.ts'
import { encerrarCom } from './executar.ts'

// Borda, métricas, alertas e jobs contra o compose inteiro (D52): cada teste sobe o que precisa além da infra.
await encerrarCom(executarTestesComInfra('testes de integração da infra', 'test:infra'))
