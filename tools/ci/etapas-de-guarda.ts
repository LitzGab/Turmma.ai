import { raizRepositorio, type Etapa } from './executar.ts'

/** gitleaks fixado por versão e digest: tag movida não troca a guarda sem passar por commit. */
export const IMAGEM_GITLEAKS =
  'ghcr.io/gitleaks/gitleaks:v8.30.1@sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f'

/**
 * Varre todo o histórico do repositório com as regras de `.gitleaks.toml`. O repositório entra
 * só para leitura e o contêiner sem rede. `--redact` tira o segredo encontrado do log da esteira,
 * que é público para quem vê o repositório. O `safe.directory` é porque o dono dos arquivos
 * montados não é o usuário do contêiner, e o git se recusaria a ler.
 */
export function argumentosGitleaks(repositorio: string): string[] {
  return [
    'run',
    '--rm',
    '--network',
    'none',
    '--volume',
    `${repositorio.replace(/\/+$/, '')}:/repo:ro`,
    '--env',
    'GIT_CONFIG_COUNT=1',
    '--env',
    'GIT_CONFIG_KEY_0=safe.directory',
    '--env',
    'GIT_CONFIG_VALUE_0=/repo',
    IMAGEM_GITLEAKS,
    'git',
    '--no-banner',
    '--no-color',
    '--redact',
    '--exit-code',
    '1',
    '--config',
    '/repo/.gitleaks.toml',
    '/repo',
  ]
}

export const etapaSegredos: Etapa = {
  nome: 'segredo commitado (gitleaks)',
  comando: 'docker',
  argumentos: argumentosGitleaks(raizRepositorio),
}

export const etapaAuditoriaDeDependencias: Etapa = {
  nome: 'dependência de produção com vulnerabilidade grave (npm audit)',
  comando: 'npm',
  argumentos: ['audit', '--audit-level=high', '--omit=dev'],
}
