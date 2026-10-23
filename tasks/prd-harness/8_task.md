# Tarefa 8.0 — O portão derruba os workers e chama as guardas pelas etapas da esteira

**Funcionalidade:** harness (X7) · **Depende de:** nenhuma
**Subagentes obrigatórios:** `infra-guardian`
**Porte:** pequeno

## Objetivo

Antes da integração, o portão derruba o despachante e os workers do compose de teste, que hoje consomem o job que o
teste enfileirou; e o portão e o `ci:verificar` chamam as guardas pela mesma lista de etapas, para uma guarda nova não
entrar só num dos dois.

## Contexto necessário

- `techspec.md` §2 (linha do `portao-local.ts`)
- `prd.md` RF7, RF8
- `cenarios.md` seção A, **RF7** e **RF8**
- `.claude/rules/40-testes.md`, seção "O portão"
- Código: `tools/processo/portao-local.ts` (`comandoDaSuite`, `ambienteDoComando`, `SUITES_DO_PORTAO_DA_TAREFA`: o
  arquivo roda no topo, sem função testável); `tools/ci/verificar.ts` e `tools/ci/etapas-de-guarda.ts`
  (`etapaSegredos`, `etapaAuditoriaDeDependencias`, `etapaDependenciasDeclaradas`); `package.json`
  (`guarda:segredo`, `guarda:dependencias`); `tools/ci/compose.ts` (nomes dos serviços e o projeto de teste)

## Subtarefas

- [ ] 8.1 — Extrair de `portao-local.ts` uma função pura que monta a sequência de comandos (suítes, alvos, ambiente);
  o script passa a chamá-la
- [ ] 8.2 — Com integração nos alvos, a sequência derruba `despachante` e os `worker*` do compose de teste antes dela; o
  e2e sobe os workers de novo depois
- [ ] 8.3 — `etapas-de-guarda.ts` exporta a lista das guardas; `verificar.ts` e o portão usam a mesma lista
- [ ] 8.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/portao-local.ts` | alterado |
| `tools/processo/sequencia-do-portao.ts` | novo (a função pura) |
| `tools/processo/portao-local.test.ts` | novo |
| `tools/ci/etapas-de-guarda.ts` | alterado |
| `tools/ci/verificar.ts` | alterado |
| `tools/ci/scripts.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| RF7: com integração alterada, a sequência derruba os workers antes da integração | unidade | a ordem: derrubar vem antes do `vitest --project integracao` |
| RF7: sem integração alterada | unidade | nada é derrubado |
| RF7: depois da integração, com e2e nos alvos | unidade | o e2e sobe os workers de novo |
| RF8: uma guarda a mais no `ci:verificar` e não no portão | unidade | vermelho |
| RF8: as duas listas | unidade | iguais, lidas de `etapas-de-guarda.ts` |

## Como testar

- RF8: copiar `tools/ci/scripts.test.ts › scripts ci:* reais › ci:verificar roda tipos, lint com guardas, gitleaks, npm audit, knip e unidade, e sai verde só se todos passarem`; a lista vem da exportação, nunca redigitada.
- RF7: a função pura recebe os alvos (como `alvosDoPortao` devolve) e devolve a lista de comandos; o teste afirma a posição relativa do `docker compose … stop despachante worker…` e do `vitest --project integracao`.
- Rodar: `npx vitest run --project unidade tools/processo/portao-local.test.ts tools/ci/scripts.test.ts`.
- Armadilha: o `portao-local.ts` executa ao ser importado; o teste importa só o módulo novo.

## Fora do escopo desta tarefa

O RF17 no portão e o `--faltando` (9.0); a impressão dos guardiões (13.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
