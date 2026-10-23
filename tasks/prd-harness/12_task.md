# Tarefa 12.0 — A esteira recusa o commit de código sem marca em spec e correção

**Funcionalidade:** harness (X7) · **Depende de:** 4.0, 10.0
**Subagentes obrigatórios:** `infra-guardian`, `privacy-guardian`
**Porte:** grande

## Objetivo

O que escapa do hook (papel sem `CLAUDE_CODE_AGENT`, `commit-tree`, `rebase`, `--no-verify` em script) aparece no push:
o job `verificar`, em `spec/**` e `correcao/**`, olha commit a commit de `origin/develop..HEAD` e sai 1 com o hash do
commit de código sem marca nem `Fora do processo:`.

## Contexto necessário

- `techspec.md` §5(a), **Limites declarados** (a terceira camada)
- `prd.md` RF14 (a última frase da regra)
- `cenarios.md` seção B, **RF14, terceira camada**
- Código: `tools/processo/portao.ts` (`decidirCommit` e a classificação de código, da 10.0); `tools/processo/linhas.ts`
  (`conferirEntrega`: já lê marca e `Revisões:` commit a commit, e trata o merge do encontro); `.github/workflows/ci.yml`,
  job `verificar` (já tem `fetch-depth: 0`); `package.json` (os `ci:*`)

## Subtarefas

- [ ] 12.1 — `tools/ci/conferir-entregas.ts`: para cada commit de `origin/develop..HEAD`, os arquivos (merge por
  `git show --remerge-diff`) classificados como a `decidirCommit` classifica (código de produto e a lista do §5e);
  passa com `(tarefa N.0)` ou `(correção <slug>)` e a linha `Revisões:`, ou com `Fora do processo: <motivo>` não vazio;
  senão, sai 1 citando o hash. Intervalo vazio sai 0
- [ ] 12.2 — `npm run ci:conferir-entregas`; o `ci.yml` o chama no `verificar` só em `spec/**` e `correcao/**`
- [ ] 12.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/ci/conferir-entregas.ts` | novo |
| `tools/ci/conferir-entregas.test.ts` | novo |
| `.github/workflows/ci.yml` | alterado (job `verificar`) |
| `package.json` | alterado (`ci:conferir-entregas`) |
| `tools/ci/esteira.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| histórico real de spec: vários `(tarefa N.0)` com `Revisões:`, o último com código | integração (repo temporário) | sai 0 |
| merge do encontro limpo com o `tasks.md` resolvido; merge da `develop`; commits de documento sem marca; só `skills-lock.json` | idem | sai 0, um caso cada |
| commit de código com `Fora do processo: ajuste` | idem | sai 0 |
| intervalo vazio | idem | sai 0 |
| `correcao/x` com `(correção x)` e `Revisões:` | idem | sai 0 |
| código sem marca | idem | sai 1 com o hash |
| marca sem `Revisões:` | idem | sai 1 |
| merge com conflito resolvido em código, sem marca (`--remerge-diff`) | idem | sai 1 |
| sem marca só em `tools/guardas/x.mjs`; e só em `.github/workflows/ci.yml` | idem | sai 1, um caso cada |
| `Fora do processo:` com motivo vazio | idem | sai 1 |
| limite conhecido: commit de papel com `env -u CLAUDE_CODE_AGENT` e `Fora do processo: x` | idem | sai 0, afirmado como limite |
| o `ci.yml` chama em `spec/**` e `correcao/**`, com `fetch-depth: 0`, e não na `develop` | unidade | |

## Como testar

- Copiar `tools/processo/linhas.test.ts › partida, encontro e fechamento, em repositórios de verdade › conferir na branch da spec › o merge do encontro não é cobrado pelo código que trouxe do outro lado, mas o que ele resolveu à mão é`, e `› commit com código sem marca, ou sem a linha Revisões, continua recusado na spec`: o mesmo repositório temporário, aqui chamando o script como processo.
- O `ci.yml`: copiar `tools/ci/esteira.test.ts › esteira do GitHub (.github/workflows/ci.yml) › o verificar baixa o histórico inteiro, para o gitleaks varrer todo commit e não só o último`.
- Rodar: `npx vitest run --project unidade tools/ci/conferir-entregas.test.ts tools/ci/esteira.test.ts`.

## Fora do escopo desta tarefa

O hook nativo (11.0); quem pode escrever a linha `Fora do processo:` (é o PreToolUse, 10.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
