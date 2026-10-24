# Tarefa 14.0 — Código de processo exige revisão, e o `(mvp:)` sai

**Funcionalidade:** harness (X7) · **Depende de:** 13.0
**Subagentes obrigatórios:** `infra-guardian`, `privacy-guardian`, `conformidade-reviewer`
**Porte:** grande

## Objetivo

Em sessão de papel, commit em `tools/`, `.github/`, `.claude/settings*.json`, `.claude/hooks/`, `docs/aia/ouro*/`,
`package.json`, `compose.yaml`, `.env.example` ou numa configuração do portão passa a exigir tarefa ou correção, com
`revisor-geral`, `test-engineer` e os guardiões da tabela; e o caminho `(mvp:)` sai do hook.

## Contexto necessário

- `techspec.md` §5(e)
- `prd.md` RF16, RF18
- `tabela-de-guardioes.md`, seção **Fora do código de produto (RF16, só em sessão de papel)**
- `cenarios.md` seção B, **RF16** e **RF18**
- Código: `tools/processo/portao.ts` (`PASTAS_DE_CODIGO`, `decidirCommit`, `papel`; e a lista do §5(e), que a 12.0 já
  escreveu: `PASTAS_DE_PROCESSO`, `ARQUIVOS_DE_PROCESSO`, `PADROES_DE_PROCESSO` e `ehCodigoParaAEsteira`); `tools/processo/guardioes-por-caminho.ts`
  (13.0); `tools/processo/comando-git.ts` (`marcadorDoMvp`, `avaliarCommitDoMvp`); `docs/aia/ouro/README.md` (manda
  commitar com `(ouro: <política>)`); `tools/ci/conferir-entregas.ts` (12.0, que classifica pela `decidirCommit`)

## Subtarefas

- [ ] 14.1 — A `decidirCommit`, só em sessão de papel, conta como código o que `ehCodigoParaAEsteira` conta: a lista do
  §5(e) já está em `portao.ts` desde a 12.0 e é importada, sem segunda lista nem cópia (`techspec.md` §5(a), 12.0);
  `infra/` continua código em toda sessão
- [ ] 14.2 — A tabela do RF16 em `guardioes-por-caminho.ts`, com as mesmas regras de casamento do código
- [ ] 14.3 — Sai `marcadorDoMvp`, `avaliarCommitDoMvp` e o ramo `(mvp:)` da decisão
- [ ] 14.4 — `docs/aia/ouro/README.md`: o commit do corpus é `(correção <slug>)` com o `conformidade-reviewer`
- [ ] 14.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/portao.ts` | alterado |
| `tools/processo/guardioes-por-caminho.ts` | alterado |
| `tools/processo/comando-git.ts` | alterado |
| `tools/processo/harness/guardioes.test.ts` | alterado |
| `tools/processo/revisoes.test.ts` | alterado |
| `docs/aia/ouro/README.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| papel, sem tarefa, um arquivo de cada caminho do §5(e) (`tsconfig.base.json`, `.claude/settings.local.json`, `compose.yaml`, `.env.example` inclusive) | unidade | recusado |
| `.claude/skills/x/SKILL.md`, `.claude/rules/40-testes.md`, `docs/aia/tutor.md`, `tasks/` | unidade | passam |
| correção marcada sem `revisor-geral` | unidade | recusado |
| `guardioes.test.ts`: `it.each` por caminho de cada linha da tabela do RF16 | unidade | o conjunto exato |
| `revisoes.test.ts`: `it.each` por caminho da tabela, pela `decidirCommit` | unidade | sem o guardião, recusado; com ele, aceito |
| entre eles: `eslint.config.mjs` sem `tenancy-guardian`; `docs/aia/ouro/x.json` sem `conformidade-reviewer`; `hook-git.ts` sem os quatro; `tools/ci/borda.test.ts` sem `privacy-guardian` | unidade | recusado |
| `infra/Caddyfile` sem `privacy-guardian` | unidade | recusado, com e sem papel |
| `infra/k6/x.js` com `infra-guardian` e `privacy-guardian` | unidade | passa |
| `tools/processo/linhas.ts` | unidade | sem guardião com veto |
| `tools/guardas/index.mjs` sem `privacy-guardian` | unidade | recusado (padrão) |
| sem papel, os do §5(e) | unidade | passam |
| uma lista só: em papel e sem tarefa, cada caminho do `it.each` "código para a esteira" de `conferir-entregas.test.ts`; cada um do "documento para a esteira" | unidade | recusados; passam |
| RF18: em `mvp/x`, `(mvp: algo)`, código e carimbo válido | unidade | recusado com a mensagem de código sem tarefa |

O `describe('o marcador da fatia do MVP (D77)')` do `revisoes.test.ts` é o único teste existente que muda: os casos que
aceitavam o `(mvp:)` viram o caso do RF18. Escreva isso em "Divergências".

## Como testar

- Copiar `tools/processo/revisoes.test.ts › hooks sobre um repositório de verdade › bloqueia commit que leva código sem tarefa nem correção, e deixa passar o que não é código`, com o papel em `CLAUDE_CODE_AGENT`.
- O papel: `› a árvore em que o commit acontece › sem papel passado, portao lê o papel de CLAUDE_CODE_AGENT, que é o caminho do hook`.
- Os caminhos do §5(e): `tools/ci/conferir-entregas.test.ts › código para a esteira: %s` e `› documento para a esteira: %s`; reuse as duas listas.
- Rodar: `npx vitest run --project unidade tools/processo/revisoes.test.ts tools/processo/harness/guardioes.test.ts tools/ci/conferir-entregas.test.ts`.
- Depois desta tarefa, o próprio commit dela já pede a tabela: confira a lista impressa pelo portão.

## Fora do escopo desta tarefa

O texto das regras e das skills (15.0 a 19.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
