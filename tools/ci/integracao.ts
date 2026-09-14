import { executarTestesComInfra } from './compose.ts'
import { encerrarCom } from './executar.ts'

await encerrarCom(executarTestesComInfra('testes de integração', 'test:integracao'))
