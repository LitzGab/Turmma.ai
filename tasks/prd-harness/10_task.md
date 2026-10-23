# Tarefa 10.0 — Uma decisão de commit para as duas entradas, e o `PreToolUse` nega o desvio

**Funcionalidade:** harness (X7) · **Depende de:** 2.0
**Subagentes obrigatórios:** `infra-guardian`
**Porte:** grande

## Objetivo

A decisão inteira do commit vira a função pura `decidirCommit({ mensagem, arquivos, conteudoDe, raiz, papel })`, que o
`PreToolUse` chama hoje e o git hook nativo chamará na 11.0; e o `PreToolUse` nega, em sessão de papel, as formas de
pular o hook, e em qualquer sessão do Claude Code a linha `Fora do processo:`.

## Contexto necessário

- `techspec.md` §5(a), até "O `commit-msg`" (o hook nativo é a 11.0), e §5(c)
- `prd.md` RF14
- `cenarios.md` seção B, **RF14, negação no `PreToolUse`**
- Código: `tools/processo/portao.ts` (`portao`, `avaliarPortao`, da 2.0); `tools/processo/comando-git.ts` (`ehCommit`,
  `arquivosDoCommit`, `documentoDoCommit`, `pastaDoCommit`, `pushDoTime`); `tools/processo/hook-revisoes.ts`;
  `.claude/settings.json` (o comando do `PreToolUse` do Bash, com o `exit 2`)

## Subtarefas

- [ ] 10.1 — `decidirCommit` em `portao.ts`: a marca, o documento, os obrigatórios, as pastas, o `avaliarPortao` e a
  conferência das mutações, sem ler disco nem git (o que precisa vem por `conteudoDe` e `raiz`); o `portao` de hoje passa
  a montar a entrada e chamá-la
- [ ] 10.2 — A mensagem vem de `-m`, ou do arquivo de `-F x`, `-Fx`, `--file=x`
- [ ] 10.3 — Negação em sessão de papel (`CLAUDE_CODE_AGENT` em `PAPEIS_DO_TIME`): `--no-verify` e abreviações; `-n` em
  `commit`, sozinho ou combinado; `core.hookspath` em qualquer caixa, em `-c` e em `git config`; `VAR=`, `unset` e
  `env -u` com `CLAUDE_CODE_AGENT` ou `GIT_CONFIG_`
- [ ] 10.4 — Em qualquer sessão: mensagem com `Fora do processo:`, no `-m` ou no arquivo, negada; o termo só dentro de
  `-m "..."` sugere `-F`
- [ ] 10.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/portao.ts` | alterado |
| `tools/processo/comando-git.ts` | alterado |
| `tools/processo/hook-revisoes.ts` | alterado |
| `tools/processo/hook-portao.test.ts` | alterado |
| `tools/processo/revisoes.test.ts` | alterado |

## Testes que provam a regra

Do `cenarios.md`, RF14, negação no `PreToolUse`, com o comando real do `settings.json`. Um caso por forma (`it.each`):

| Cenário | Tipo | O que prova |
|---|---|---|
| negados com papel: `--no-verify`, `--no-verif`, `--no-ver`; `commit -n`, `-nm "x"`, `-anm "x"`; `-c core.hooksPath=/dev/null`, `-c core.HOOKSPATH=x`, `config core.hookspath`; `CLAUDE_CODE_AGENT= git commit`, `unset CLAUDE_CODE_AGENT`, `env -u CLAUDE_CODE_AGENT`, `GIT_CONFIG_COUNT=1 git commit` | unidade (processo) | negados |
| passam com papel: `git log -n 3`, `git diff --no-ext-diff`, `git -c user.name=x commit`, `GIT_AUTHOR_DATE=x git commit`, `grep CLAUDE_CODE_AGENT`, `printenv CLAUDE_CODE_AGENT`, `git commit -F msg.txt` com `--no-verify` dentro do arquivo | idem | passam |
| sem papel: cada negado acima | idem | passa |
| `Fora do processo:` com e sem papel, no `-m`, em `-F msg.txt`, `-Fmsg.txt`, `--file=msg.txt` | idem | negado |
| termo só dentro de `-m "..."` | idem | negado com a dica de `-F` |
| `decidirCommit` e `portao` com a mesma entrada | unidade | mesma decisão, nos casos de `portão do commit` |

## Como testar

- Copiar `tools/processo/hook-portao.test.ts › o hook do portão que não carrega bloqueia o Bash › hook são, push do time para a develop: sai 0 e o deny da regra passa intacto no stdout`: roda o comando do `settings.json` como processo, com a entrada JSON do `PreToolUse` e `CLAUDE_CODE_AGENT` no ambiente.
- A paridade: os casos de `revisoes.test.ts › portão do commit` passam a chamar também `decidirCommit`.
- Rodar: `npx vitest run --project unidade tools/processo/hook-portao.test.ts tools/processo/revisoes.test.ts`.
- Armadilha: um `exit 2` errado trava todo Bash do time, este inclusive. Conserto pelo Edit; socorro em `techspec.md` §5(c).

## Fora do escopo desta tarefa

O `commit-msg`, o `pre-push` e o `prepare` (11.0); a esteira (12.0); a tabela de guardiões (13.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
