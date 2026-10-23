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

- [ ] 11.1 — `tools/processo/git-hooks/commit-msg` (o script da §5a) e `pre-push`, executáveis
- [ ] 11.2 — `tools/processo/hook-git.ts commit-msg <arquivo>`: papel fora de `PAPEIS_DO_TIME` e `Fora do processo:`
  recusados; mensagem do arquivo; arquivos de `git diff --cached --name-only --no-renames` (com merge em curso, o que
  diverge dos dois lados); conteúdo do índice (`git show :<arquivo>`); chama `decidirCommit`; erro de carga recusa
- [ ] 11.3 — `hook-git.ts pre-push`: lê as refs da entrada padrão e recusa o push de papel para as três
- [ ] 11.4 — `"prepare": "git config core.hooksPath tools/processo/git-hooks"` no `package.json`
- [ ] 11.5 — `contexto-inicial.sh`: com `core.hooksPath` ausente ou diferente, o aviso
- [ ] 11.6 — `hook-git.int.test.ts` roda sem o compose, e o portão o inclui quando `tools/processo/` muda
- [ ] 11.7 — Testes

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

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
