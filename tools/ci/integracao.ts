import { etapaCompose, SERVICOS_INFRA } from './compose.ts'
import { encerrarCom, executarEtapas } from './executar.ts'

await encerrarCom(
  executarEtapas(
    [
      etapaCompose('subir Postgres, Redis e storage', 'up', '--detach', '--wait', ...SERVICOS_INFRA),
      { nome: 'testes de integração', comando: 'npm', argumentos: ['run', 'test:integracao'] },
    ],
    (codigo) => [
      ...(codigo === 0 ? [] : [etapaCompose('logs dos serviços', 'logs', '--no-color', '--tail', '200')]),
      etapaCompose('derrubar o ambiente', 'down', '--volumes', '--remove-orphans'),
    ],
  ),
)
