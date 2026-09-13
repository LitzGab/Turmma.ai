import { etapaCompose } from './compose.ts'
import { encerrarCom, executarEtapas } from './executar.ts'

// `npm run test:e2e` mantém o ambiente de pé para o desenvolvedor; a esteira sempre derruba.
const manterAmbiente = process.argv.includes('--manter-ambiente')
const naEsteira = process.env['CI'] === 'true'

await encerrarCom(
  executarEtapas(
    [
      {
        nome: 'navegador do Playwright',
        comando: 'npx',
        argumentos: ['playwright', 'install', ...(naEsteira ? ['--with-deps'] : []), 'chromium'],
      },
      etapaCompose('subir o ambiente completo', 'up', '--detach', '--build', '--wait'),
      { nome: 'testes e2e', comando: 'npx', argumentos: ['playwright', 'test'] },
    ],
    (codigo) => [
      ...(codigo === 0 ? [] : [etapaCompose('logs dos serviços', 'logs', '--no-color', '--tail', '200')]),
      ...(manterAmbiente ? [] : [etapaCompose('derrubar o ambiente', 'down', '--volumes', '--remove-orphans')]),
    ],
  ),
)
