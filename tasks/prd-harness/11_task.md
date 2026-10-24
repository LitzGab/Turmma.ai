# Tarefa 11.0 — O git hook nativo barra o commit e o push de papel por qualquer caminho

**Funcionalidade:** harness (X7) · **Depende de:** 10.0
**Subagentes obrigatórios:** `infra-guardian`
**Porte:** grande

## Objetivo

Em sessão de papel, commit por `/usr/bin/git`, `env`, `command`, `sh -c`, script, outro checkout ou worktree tem as
exigências de hoje, pelo `commit-msg` nativo; push de papel para `develop`, `release` ou `main` é recusado pelo
`pre-push`; todo andar e linha nasce com isso pelo `prepare`; e o início de sessão avisa quando o `core.hooksPath` falta.

## Contexto necessário

- `techspec.md` §5(a) (o `commit-msg` e o `hook-git.ts`) e **Limites declarados**; §7c (as duas primeiras linhas); §10
  (o `hook-git.int.test.ts` sem o `globalSetup` do compose)
- `prd.md` RF14
- `cenarios.md` seção B: **RF14, formas contra um git real**, **Instalação**, **Início de sessão**
- `1_task.md`, seção "Prova da premissa": `CLAUDE_CODE_AGENT` chega ao Bash. Se não chegou, não comece
- Código: `tools/processo/portao.ts` (`decidirCommit`, da 10.0); `tools/processo/comando-git.ts` (`pushDoTime`,
  `destinoProtegidoDoPush`); `.claude/hooks/contexto-inicial.sh`; `package.json`; `vitest.config.ts` (os projetos e o
  `globalSetup` da integração); `tools/processo/portao-local.ts` (`alvosDoPortao`)

## Subtarefas

- [x] 11.1 — `tools/processo/git-hooks/commit-msg` (o script da §5a) e `pre-push`, executáveis
- [x] 11.2 — `tools/processo/hook-git.ts commit-msg <arquivo>`: papel fora de `PAPEIS_DO_TIME` e `Fora do processo:`
  recusados; mensagem do arquivo; arquivos de `git diff --cached --name-only --no-renames` (com merge em curso, o que
  diverge dos dois lados); conteúdo do índice (`git show :<arquivo>`); chama `decidirCommit`; erro de carga recusa
- [x] 11.3 — `hook-git.ts pre-push`: lê as refs da entrada padrão e recusa o push de papel para as três
- [x] 11.4 — `"prepare": "git config core.hooksPath tools/processo/git-hooks"` no `package.json`
- [x] 11.5 — `contexto-inicial.sh`: com `core.hooksPath` ausente ou diferente, o aviso
- [x] 11.6 — `hook-git.int.test.ts` roda sem o compose, e o portão o inclui quando `tools/processo/` muda
- [x] 11.7 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/hook-git.ts` | novo |
| `tools/processo/git-hooks/commit-msg` | novo |
| `tools/processo/git-hooks/pre-push` | novo |
| `tools/processo/hook-git.int.test.ts` | novo |
| `package.json` | alterado (`prepare`) |
| `.claude/hooks/contexto-inicial.sh` | alterado |
| `vitest.config.ts` | alterado |
| `tools/processo/portao-local.ts` | alterado |
| `tools/processo/harness/instalacao.test.ts` | novo |
| `package.json` | alterado também em `test` e `test:processo` (divergência abaixo) |
| `tools/ci/verificar.ts`, `tools/ci/scripts.test.ts` | alterados (a esteira roda o projeto `processo`) |
| `tools/processo/portao.ts`, `sequencia-do-portao.ts`, `mutacoes.ts` | alterados (`alvosDoPortao`, o passo do alvo, `tipoDoTeste`) |
| `tools/processo/portao-local.test.ts`, `revisoes.test.ts`, `mutacoes.test.ts` | alterados (os alvos e o tipo novos) |
| `docs/guia-do-desenvolvedor.md`, `tasks/prd-harness/techspec.md`, `tasks/prd-harness/cenarios.md` | alterados (a linha do projeto `processo`; a divergência) |

## Testes que provam a regra

A tabela inteira de `cenarios.md` B, "RF14, formas contra um git real", uma linha um caso, num repositório temporário
com `core.hooksPath` apontado para a pasta da árvore. Além dela:

| Cenário | Tipo | O que prova |
|---|---|---|
| `prepare` | unidade | aponta `tools/processo/git-hooks` |
| início de sessão sem `core.hooksPath` / com ele certo | unidade (processo) | o aviso sai / não sai |
| a guarda reprova quando o alvo dela não existe: `hook-git.ts` ausente | integração | o `commit-msg` de papel recusa (fecha na falha) |

## Como testar

- Repositório temporário: copiar o preparo de `tools/processo/revisoes.test.ts › hooks sobre um repositório de verdade` (o `beforeEach` monta um repo com carimbo e documento); aqui o commit é `git commit` de verdade, com `CLAUDE_CODE_AGENT` no `env` do `execFileSync`.
- Casos de commit: `› o revisor registra a própria rodada, e o commit só passa quando todos aprovaram depois da correção`.
- Push: `git init --bare` como remoto; o caso do `pre-push` copia `› agente do time não empurra develop, release nem main; a branch do andar ele empurra`.
- Início de sessão: `bash .claude/hooks/contexto-inicial.sh` com a entrada JSON no stdin, como o `settings.json` chama.
- Rodar: `npx vitest run --project <o projeto da 11.6> tools/processo/hook-git.int.test.ts`.

## Fora do escopo desta tarefa

A terceira camada (12.0); guardiões pelo caminho (13.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O `hook-git.int.test.ts` roda num projeto do Vitest próprio, o `processo`, e não no `integracao`. Isso leva também `package.json` (`test` e `test:processo`), `tools/ci/verificar.ts` (a esteira o roda ali, sem compose), `tools/processo/mutacoes.ts` (`tipoDoTeste`), `portao.ts` (`alvosDoPortao` ganha o grupo `processo`), `sequencia-do-portao.ts` e os testes que enumeram projetos e alvos (`scripts.test.ts`, `portao-local.test.ts`, `revisoes.test.ts`, `mutacoes.test.ts`) | O §10 pede o teste "sem o `globalSetup` do compose", e o `integracao` o tem: sem projeto próprio o teste subiria o compose, e a mutação que o cita (`--project integracao`) também. A tabela "Arquivos previstos" só listava `vitest.config.ts` e `portao-local.ts` | `techspec.md` §2 (linha nova) e §10; `cenarios.md` B, "Instalação" |
| O git hook não leva o caminho `(mvp: …)` do `PreToolUse` | O caminho sai na 14.0 (RF18) e a fatia que ele servia pousou em 05/10/2026; commit de papel com `(mvp: …)` e código passa a ser recusado pelo `commit-msg` antes da 14.0 | `techspec.md` §5a ("O caminho `(mvp: …)` (D77) continua no `portao`, antes da `decidirCommit`, e sai na 14.0 (RF18)") |
| "Código ruim no índice e bom no disco" (e o inverso) é provado com o documento da tarefa | O único conteúdo que a `decidirCommit` lê do índice é o documento; o código vai pelo caminho, e a caducidade lê o disco (§5a, "A `decidirCommit` não é pura") | `cenarios.md` B, RF14, parágrafo depois da tabela |
| O `contexto-inicial.sh` avisa em toda sessão (a do Orquestrador e a do Joaquim também), e não só na de papel | O `core.hooksPath` é do checkout, e o aviso diz o que fazer; filtrar por papel esconderia o checkout sem hook de quem o abre para consertar | `cenarios.md` B, "Início de sessão" ("em qualquer sessão", acrescentado nesta tarefa) |

## Mutações

Uma por cláusula do diff. O teste de integração citado é `tools/processo/hook-git.int.test.ts` (projeto `processo`); `…/instalacao.test.ts` é `tools/processo/harness/instalacao.test.ts`.

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › papel vazio não julga nada
- const ehSessaoDePapel = (papel: string | undefined): papel is string => papel !== undefined && papel !== ''
+ const ehSessaoDePapel = (papel: string | undefined): papel is string => papel !== undefined
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › sem papel não julga nada
- const ehSessaoDePapel = (papel: string | undefined): papel is string => papel !== undefined && papel !== ''
+ const ehSessaoDePapel = (papel: string | undefined): papel is string => papel !== ''
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › o commit só de documento
  function recusaDoPapel(papel: string, acao: 'Commit' | 'Push'): string | null {
-   if (ehPapelDoTime(papel)) return null
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › o merge limpo de outra linha
    git(raiz, ['rev-parse', '-q', '--verify', 'MERGE_HEAD'])
-   return true
+   return false
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › o commit só de documento
-   return false
+   return true
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › mover o código para um documento
- return nomes(git(raiz, ['diff', '--cached', '--name-only', '--no-renames', '-z', ...contra]))
+ return nomes(git(raiz, ['diff', '--cached', '--name-only', '-z', ...contra]))
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › o código com acento e espaço no nome
- return nomes(git(raiz, ['diff', '--cached', '--name-only', '--no-renames', '-z', ...contra]))
+ return nomes(git(raiz, ['diff', '--cached', '--name-only', '--no-renames', ...contra]))
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › git pelo caminho absoluto com código e sem marca
- return nomes(git(raiz, ['diff', '--cached', '--name-only', '--no-renames', '-z', ...contra]))
+ return nomes(git(raiz, ['diff', '--name-only', '--no-renames', '-z', ...contra]))
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › o commit só de documento
  const doCommit = diferencasDoIndice(raiz, [])
- if (!mergeEmCurso(raiz)) return doCommit
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › o merge limpo de outra linha
- const doOutroLado = new Set(diferencasDoIndice(raiz, ['MERGE_HEAD']))
+ const doOutroLado = new Set(diferencasDoIndice(raiz, []))
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › o merge limpo de outra linha
- return doCommit.filter((arquivo) => doOutroLado.has(arquivo))
+ return doCommit.filter((arquivo) => !doOutroLado.has(arquivo))
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › as revisões válidas e o carimbo passa
- return git(raiz, ['show', `:${arquivo}`])
+ return git(raiz, ['show', `HEAD:${arquivo}`])
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › a marca com o documento fora do índice é recusada
  } catch {
-   return null
+   return ''
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › o papel intruso no CLAUDE_CODE_AGENT é recusado
  const recusa = recusaDoPapel(papel, 'Commit')
- if (recusa !== null) return recusa
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › o push com papel intruso é recusado
  const recusa = recusaDoPapel(papel, 'Push')
- if (recusa !== null) return recusa
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › mensagem com a linha Fora do processo:
  const fora = bloqueioDoForaDoProcesso('', mensagem)
- if (fora !== null) return fora
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › produção sem bloco de mutação
- return decidirCommit({ mensagem, arquivos: arquivosDoIndice(raiz), conteudoDe: conteudoDoIndice(raiz), raiz, papel }, avaliarMutacoes)
+ return decidirCommit({ mensagem, arquivos: arquivosDoIndice(raiz), conteudoDe: conteudoDoIndice(raiz), raiz, papel })
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › é recusado pelo pre-push
- const destinos = refs.split('\n').map((linha) => linha.trim().split(/\s+/)[2])
+ const destinos = refs.split('\n').map((linha) => linha.trim().split(/\s+/)[3])
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › git push da branch do andar
- const protegidas = BRANCHES_PROTEGIDAS.filter((branch) => destinos.includes(`refs/heads/${branch}`))
+ const protegidas = BRANCHES_PROTEGIDAS.filter((branch) => !destinos.includes(`refs/heads/${branch}`))
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › é recusado pelo pre-push
- const protegidas = BRANCHES_PROTEGIDAS.filter((branch) => destinos.includes(`refs/heads/${branch}`))
+ const protegidas = BRANCHES_PROTEGIDAS.filter((branch) => destinos.includes(branch))
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › git push da branch do andar
- if (protegidas.length === 0) return null
+ if (protegidas.length > 0) return null
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › sem papel não julga nada
- if (!ehSessaoDePapel(papel)) return null
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › o modo desconhecido
- if (modo === 'commit-msg' && arquivoDaMensagem) return bloqueioDoCommitMsg(git(process.cwd(), ['rev-parse', '--show-toplevel']).trim(), arquivoDaMensagem, papel)
+ if (arquivoDaMensagem) return bloqueioDoCommitMsg(git(process.cwd(), ['rev-parse', '--show-toplevel']).trim(), arquivoDaMensagem, papel)
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › o modo desconhecido
- if (modo === 'commit-msg' && arquivoDaMensagem) return bloqueioDoCommitMsg(git(process.cwd(), ['rev-parse', '--show-toplevel']).trim(), arquivoDaMensagem, papel)
+ if (modo === 'commit-msg') return bloqueioDoCommitMsg(git(process.cwd(), ['rev-parse', '--show-toplevel']).trim(), arquivoDaMensagem as string, papel)
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › git push da branch do andar
- if (modo === 'pre-push') return bloqueioDoPrePush(lerEntradaPadrao(), papel)
+ if (modo === 'pre-pus') return bloqueioDoPrePush(lerEntradaPadrao(), papel)
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › git pelo caminho absoluto com código e sem marca
- if (basename(process.argv[1] ?? '') === 'hook-git.ts') {
+ if (basename(process.argv[1] ?? '') !== 'hook-git.ts') {
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › git pelo caminho absoluto com código e sem marca
- process.exit(1)
+ process.exit(0)
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › o erro de carga recusa
- motivo = `Git hook bloqueado: ele falhou ao carregar ou ao julgar (${(erro as Error).message}). Avise o Joaquim.`
+ motivo = null
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › as revisões válidas e o carimbo passa
- const nomes = (saida: string): string[] => saida.split('\0').filter((nome) => nome !== '')
+ const nomes = (saida: string): string[] => saida.split('\0')
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › o commit só de documento
- if (motivo !== null) {
+ if (true) {
```

```mutacao
arquivo: tools/processo/git-hooks/commit-msg
teste: tools/processo/hook-git.int.test.ts › sem papel passa: o PATH sem node
- [ -n "$CLAUDE_CODE_AGENT" ] || exit 0
```

```mutacao
arquivo: tools/processo/git-hooks/commit-msg
teste: tools/processo/hook-git.int.test.ts › o commit só de documento
- exec node "$(git rev-parse --show-toplevel)/tools/processo/hook-git.ts" commit-msg "$1"
+ exec node "$(git rev-parse --show-toplevel)/tools/processo/hook-git.ts" commit-msg
```

```mutacao
arquivo: tools/processo/git-hooks/pre-push
teste: tools/processo/hook-git.int.test.ts › sem papel passa: git push origin HEAD:develop
- [ -n "$CLAUDE_CODE_AGENT" ] || exit 0
```

```mutacao
arquivo: tools/processo/git-hooks/pre-push
teste: tools/processo/hook-git.int.test.ts › git push da branch do andar
- exec node "$(git rev-parse --show-toplevel)/tools/processo/hook-git.ts" pre-push
+ exec node "$(git rev-parse --show-toplevel)/tools/processo/hook-git.ts" pre-pus
```

```mutacao
arquivo: .claude/hooks/contexto-inicial.sh
teste: tools/processo/harness/instalacao.test.ts › com o core.hooksPath em outro lugar
- if [ "$hooks" != "tools/processo/git-hooks" ]; then
+ if [ -z "$hooks" ]; then
```

```mutacao
arquivo: .claude/hooks/contexto-inicial.sh
teste: tools/processo/harness/instalacao.test.ts › com o core.hooksPath ausente
- if [ -z "$hooks" ]; then atual="não está definido"; else atual="é \"$hooks\""; fi
+ if [ -n "$hooks" ]; then atual="não está definido"; else atual="é \"$hooks\""; fi
```

```mutacao
arquivo: package.json
teste: tools/processo/harness/instalacao.test.ts › aponta a pasta dos scripts do git hook
- "prepare": "git config core.hooksPath tools/processo/git-hooks",
+ "prepare": "git config core.hooksPath tools/processo/git-hook",
```

```mutacao
arquivo: package.json
teste: tools/ci/scripts.test.ts › a esteira roda todo projeto do Vitest
- "test": "vitest run --project unidade --project integracao --project processo",
+ "test": "vitest run --project unidade --project integracao",
```

```mutacao
arquivo: package.json
teste: tools/ci/scripts.test.ts › a esteira roda todo projeto do Vitest
- "test:processo": "vitest run --project processo",
```

```mutacao
arquivo: vitest.config.ts
teste: tools/processo/harness/instalacao.test.ts › coleta o teste do git hook
- exclude: [...ignorados, integracaoDeInfra, integracaoDoProcesso],
+ exclude: [...ignorados, integracaoDeInfra],
```

```mutacao
arquivo: vitest.config.ts
teste: tools/processo/harness/instalacao.test.ts › coleta o teste do git hook
  name: 'processo',
- include: [integracaoDoProcesso],
+ include: [],
```

```mutacao
arquivo: vitest.config.ts
teste: tools/processo/harness/instalacao.test.ts › não coleta o que os ignorados excluem
  include: [integracaoDoProcesso],
- exclude: ignorados,
+ exclude: [],
```

```mutacao
arquivo: vitest.config.ts
teste: tools/processo/harness/instalacao.test.ts › não tem globalSetup
  // passa dos 5 s do padrão.
- testTimeout: 60_000,
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › escolhe o projeto pelo caminho do teste
- if (/^tools\/processo\/.*\.int\.test\.ts$/.test(teste)) return 'processo'
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › o teste do git hook entra nos alvos
- integracao: validos.filter((arquivo) => /\.int\.test\.ts$/.test(arquivo) && !arquivo.startsWith('infra/') && !arquivo.startsWith('e2e/') && !ehDoProcesso(arquivo)),
+ integracao: validos.filter((arquivo) => /\.int\.test\.ts$/.test(arquivo) && !arquivo.startsWith('infra/') && !arquivo.startsWith('e2e/')),
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › o teste do git hook entra nos alvos
- const ehDoProcesso = (arquivo: string): boolean => arquivo.startsWith('tools/processo/')
+ const ehDoProcesso = (arquivo: string): boolean => arquivo.startsWith('tools/')
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › o teste do git hook entra nos alvos
- return [...new Set([...alterados, ...(doProcesso.length > 0 ? [TESTE_DO_GIT_HOOK] : [])])].sort()
+ return [...new Set([...alterados, ...(doProcesso.length >= 0 ? [TESTE_DO_GIT_HOOK] : [])])].sort()
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › o teste do git hook entra nos alvos
- const alterados = doProcesso.filter((arquivo) => /\.int\.test\.ts$/.test(arquivo))
+ const alterados = doProcesso.filter(() => false)
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › o teste do git hook entra nos alvos
- return [...new Set([...alterados, ...(doProcesso.length > 0 ? [TESTE_DO_GIT_HOOK] : [])])].sort()
+ return [...alterados, ...(doProcesso.length > 0 ? [TESTE_DO_GIT_HOOK] : [])].sort()
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › o teste do git hook entra nos alvos
- return [...new Set([...alterados, ...(doProcesso.length > 0 ? [TESTE_DO_GIT_HOOK] : [])])].sort()
+ return [...new Set([...alterados, ...(doProcesso.length > 0 ? [TESTE_DO_GIT_HOOK] : [])])]
```

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › vai no projeto `processo`
- ...(alvos.processo.length > 0 ? [passo(`npx vitest run --project processo ${alvos.processo.join(' ')}`)] : []),
+ ...(alvos.processo.length > 0 ? [passo(`npx vitest run --project integracao ${alvos.processo.join(' ')}`)] : []),
```

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › sem alvo do processo, o projeto não é chamado
- ...(alvos.processo.length > 0 ? [passo(`npx vitest run --project processo ${alvos.processo.join(' ')}`)] : []),
+ ...(alvos.processo.length >= 0 ? [passo(`npx vitest run --project processo ${alvos.processo.join(' ')}`)] : []),
```

```mutacao
arquivo: tools/ci/verificar.ts
teste: tools/ci/scripts.test.ts › ci:verificar roda tipos, lint, as guardas da lista, a unidade e o git hook
- { nome: 'testes do processo', comando: 'npm', argumentos: ['run', 'test:processo'] },
```

Sem bloco, por não haver teste que o prove: `...alvos.processo` em `todosOsAlvos` (`tools/processo/portao-local.ts`). O campo `alvos` do carimbo é gravado e nenhum código o lê (`grep -rn "alvos" tools/processo/*.ts` acha só a definição do tipo em `portao.ts` e a gravação em `portao-local.ts`), então tirar o `...alvos.processo` não deixa teste algum vermelho; os alvos que o portão roda vêm de `alvosDoPortao`, e esses têm bloco.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | `package.json:15`: `prepare` falha num `npm install` sem `--ignore-scripts` fora de um repositório git | Recusada: todo `npm ci` do `servico.Dockerfile` usa `--ignore-scripts` e o `.dockerignore` deixa o `.git` de fora; na esteira o checkout traz o `.git`. Mudar o `prepare` alteraria o bloco de mutação dele e o teste de instalação |
| infra-guardian (1ª) | `mutacoes.ts:236`: `testTimeoutDoProjeto` pega o primeiro `testTimeout` do `vitest.config.ts`; hoje os dois projetos declaram 60 000 | `TODO.md`, item "(X7, tarefa 7.0, rodada 1)" (2): vale quando a integração e o `processo` divergirem de prazo; muda código de produção do processo e caducaria os três revisores |
| revisor-geral (1ª) | `contexto-inicial.sh:27`: a frase "Checkout anterior à X7: traga a develop antes" nunca aparece onde se aplica | `TODO.md`, item "(X7, tarefa 11.0)" (1): tirar o texto muda o hook e caduca os três revisores, e o item 9 já corrige o que a spec promete |
| revisor-geral (1ª) | `hook-git.ts:106`: `rodar` repete o `git rev-parse --show-toplevel` que o `commit-msg` já calculou | Recusada: é um processo git a mais por commit, não é defeito; mudar `rodar` mexe nos blocos de mutação dele e caduca os três revisores |
| test-engineer (2ª) | `hook-git.int.test.ts:184`: a regex do caso dos módulos apagados aceita `ERR_MODULE_NOT_FOUND`, e a falta de qualquer outro módulo também passaria; exigir o nome do módulo | `TODO.md`, item "(X7, tarefa 11.0)" (2): mexer no teste caduca `test-engineer` e `revisor-geral` e pediria rodada nova só por isso; o `it.each` de hoje já prova o hook fechando |
| revisor-geral (2ª) | `hook-git.int.test.ts:184`: `modulo.replace('.', '\\.')` só escapa o primeiro ponto | `TODO.md`, item "(X7, tarefa 11.0)" (2): a lista tem três nomes com um ponto só; o motivo é o mesmo de cima |
| revisor-geral (2ª) | o destino `TODO.md` da recomendação do texto morto não existia | Resolvida: o item "(X7, tarefa 11.0)" (1) entrou no `TODO.md` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 21:30:53 | 2026-10-23 21:31:45 | `infra-guardian` | 1 | APROVADO | aa4e8524515ceb6f5 |
| 2026-10-23 21:30:57 | 2026-10-23 21:33:58 | `revisor-geral` | 1 | APROVADO | a34fb619307a10af5 |
| 2026-10-23 21:30:55 | 2026-10-23 21:34:15 | `test-engineer` | 1 | REPROVADO | ac20e53ba44f1477d |
| 2026-10-23 21:44:50 | 2026-10-23 21:45:48 | `test-engineer` | 2 | APROVADO | a378881af6944603e |
| 2026-10-23 21:44:57 | 2026-10-23 21:46:08 | `revisor-geral` | 2 | APROVADO | a5b3da88ecc0504a3 |
