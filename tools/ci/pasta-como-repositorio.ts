import { execFileSync } from 'node:child_process'
import { chmodSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * O ambiente do git da pasta temporária: o do processo sem nenhuma variável `GIT_*` (dentro de um hook o git define `GIT_DIR`,
 * `GIT_INDEX_FILE` e `GIT_WORK_TREE`, e o `init`, o `add` e o `commit` cairiam no repositório de verdade) e sem a configuração
 * global nem a do sistema (`init.templateDir`, filtros como o do LFS, que gravariam o ponteiro no lugar do conteúdo): a varredura
 * não pode depender da máquina nem de quem a chamou.
 *
 * Provados por teste (`tools/guardas/gitleaks.int.test.ts`): o filtro das `GIT_*` e o `GIT_CONFIG_GLOBAL=/dev/null`. O
 * `GIT_CONFIG_NOSYSTEM` e o `core.attributesFile=/dev/null` de `gitNaPasta` são defesa extra, sem teste próprio: o primeiro
 * exigiria mexer em `/etc/gitconfig`, e o segundo só importa com um filtro definido, que a configuração global ignorada já não traz.
 */
function ambienteDoGit(): NodeJS.ProcessEnv {
  const ambiente = Object.fromEntries(Object.entries(process.env).filter(([nome]) => !nome.startsWith('GIT_')))
  return { ...ambiente, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' }
}

/** O `git` dentro de `pasta`, com identidade fixa, sem hook, sem assinatura, sem `.gitattributes` global e com o ambiente de `ambienteDoGit`. */
export function gitNaPasta(pasta: string, ...argumentos: string[]): void {
  execFileSync(
    'git',
    ['-c', 'user.name=Guardas', '-c', 'user.email=guardas@exemplo.test', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', '-c', 'core.attributesFile=/dev/null', ...argumentos],
    { cwd: pasta, stdio: 'pipe', env: ambienteDoGit() },
  )
}

/**
 * Faz de uma pasta de arquivos um repositório git de um commit só, com o `.gitleaks.toml` do projeto na raiz, para o gitleaks
 * varrê-la no modo `git`, o mesmo da guarda do histórico.
 *
 * Por que não o `gitleaks dir`: ele pula o arquivo cujo caminho casa com uma allowlist, sem olhar a condição `AND` nem a regex de
 * linha. As quatro exceções do `.gitleaks.toml` têm caminho e linha juntos; no `dir`, o documento de tarefa (exceção do plano do
 * Postgres), a Tech Spec do F0, a skill do Playwright e o teste do convite eram lidos como 0 bytes, e um segredo neles só aparecia
 * depois do commit (correção 2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa). No modo `git` caminho e linha valem juntos.
 */
export function pastaComoRepositorio(pasta: string, configuracao: string): void {
  // A configuração do projeto vence a cópia que a pasta já tenha: é a que a guarda do histórico usa.
  copyFileSync(configuracao, join(pasta, '.gitleaks.toml'))
  gitNaPasta(pasta, 'init', '--quiet')
  gitNaPasta(pasta, 'add', '--all', '--force')
  gitNaPasta(pasta, 'commit', '--quiet', '--message', 'arquivos alterados')
  // O usuário do contêiner não é o dono da pasta temporária.
  execFileSync('chmod', ['-R', 'a+rX', pasta])
  chmodSync(pasta, 0o755)
}
