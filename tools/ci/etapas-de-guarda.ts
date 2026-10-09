import { raizRepositorio, type Etapa } from './executar.ts'

/** gitleaks fixado por versão e digest: tag movida não troca a guarda sem passar por commit. */
export const IMAGEM_GITLEAKS =
  'ghcr.io/gitleaks/gitleaks:v8.30.1@sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f'

/**
 * Um andar do Maestri é uma árvore de trabalho do git (`git worktree`): o `.git` dela é um arquivo que aponta para
 * dentro do `.git` do repositório principal, que fica fora da pasta montada. Sem isto o gitleaks não lê commit
 * nenhum, diz "0 commits scanned" e sai verde: a guarda passaria sem ter olhado nada (visto em 09/10/2026).
 */
export interface ArvoreDeTrabalho {
  /** O `.git` do repositório principal (`git rev-parse --git-common-dir`). */
  gitComum: string
  /** O gitdir desta árvore, relativo ao comum: `worktrees/<nome>`. */
  gitDirRelativo: string
}

/**
 * Varre todo o histórico do repositório com as regras de `.gitleaks.toml`. O repositório entra
 * só para leitura e o contêiner sem rede. `--redact` tira o segredo encontrado do log da esteira,
 * que é público para quem vê o repositório. O `safe.directory` é porque o dono dos arquivos
 * montados não é o usuário do contêiner, e o git se recusaria a ler.
 */
export function argumentosGitleaks(repositorio: string, arvoreDeTrabalho?: ArvoreDeTrabalho): string[] {
  return [
    'run',
    '--rm',
    '--network',
    'none',
    '--volume',
    `${repositorio.replace(/\/+$/, '')}:/repo:ro`,
    ...(arvoreDeTrabalho
      ? ['--volume', `${arvoreDeTrabalho.gitComum.replace(/\/+$/, '')}:/gitcomum:ro`, '--env', `GIT_DIR=/gitcomum/${arvoreDeTrabalho.gitDirRelativo}`, '--env', 'GIT_WORK_TREE=/repo']
      : []),
    '--env',
    'GIT_CONFIG_COUNT=1',
    '--env',
    'GIT_CONFIG_KEY_0=safe.directory',
    '--env',
    `GIT_CONFIG_VALUE_0=${arvoreDeTrabalho ? '*' : '/repo'}`,
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

/**
 * O gitleaks sobre uma pasta de arquivos, e não sobre o histórico: é como o portão local olha o que ainda não tem
 * commit. `git` só vê commit; sem isto, o segredo escrito na tarefa passaria pelo portão dela e só seria visto depois
 * de commitado e enviado, quando já é incidente. A pasta entra como diretório de trabalho, para o caminho de cada
 * arquivo sair relativo e as exceções por caminho do `.gitleaks.toml` valerem.
 */
export function argumentosGitleaksDaPasta(pasta: string, configuracao: string): string[] {
  return [
    'run',
    '--rm',
    '--network',
    'none',
    '--volume',
    `${pasta.replace(/\/+$/, '')}:/alterados:ro`,
    '--volume',
    `${configuracao}:/gitleaks.toml:ro`,
    '--workdir',
    '/alterados',
    IMAGEM_GITLEAKS,
    'dir',
    '--no-banner',
    '--no-color',
    '--redact',
    '--exit-code',
    '1',
    '--config',
    '/gitleaks.toml',
    '.',
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
