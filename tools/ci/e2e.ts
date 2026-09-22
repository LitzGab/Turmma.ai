import { etapaCompose, etapasDeEncerramento } from './compose.ts'
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
      // O teto do bundle antes de subir o compose: é barato e reprova cedo (RF14).
      { nome: 'build da web', comando: 'npm', argumentos: ['run', 'build', '-w', '@educa/web'] },
      { nome: 'teto do bundle da web', comando: 'npx', argumentos: ['size-limit'] },
      etapaCompose('subir o ambiente completo', 'up', '--detach', '--build', '--wait'),
      { nome: 'testes e2e', comando: 'npx', argumentos: ['playwright', 'test'] },
    ],
    (codigo) => etapasDeEncerramento(codigo, !manterAmbiente),
  ),
)
