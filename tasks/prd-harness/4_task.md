# Tarefa 4.0 — O censo do prazo do e2e e o caso retitulado

**Funcionalidade:** harness (X7) · **Depende de:** 3.0
**Subagentes obrigatórios:** `infra-guardian`, `privacy-guardian`
**Porte:** pequeno

## Objetivo

`node tools/processo/esteira.ts --censo [branch]` lista os casos de e2e acima de dois terços do prazo na última execução
verde da branch, a partir do relatório JSON que cada fatia passa a publicar; e a régua de duração acha o prazo de um
caso cujo título mudou e o corpo não.

## Contexto necessário

- `techspec.md` §4 (o comando) e §5(f), itens **Censo (RF9)** e **Retitulado (RF11)**
- `prd.md` RF9, RF11
- `cenarios.md` seção A, **RF9** e **RF11**
- `.claude/rules/20-lgpd-menores.md` item 17 (o dado do e2e é sintético) e `.claude/rules/80-infra-e-carga.md`
- Código: `.github/workflows/ci.yml`, job `e2e` (o passo de `upload-artifact` do traço, que é só na falha);
  `tools/ci/duracao-do-e2e.ts` (`casosMedidos`, `prazosDosCasos`, `prazosDoHead`, `prazoContado`,
  `relatoriosDoPlaywright`); `tools/ci/e2e.ts` (como a fatia chega ao Playwright)

## Subtarefas

- [ ] 4.1 — `ci.yml`: cada fatia grava o reporter JSON e o sobe como artefato `censo-do-e2e-<fatia>`, também no verde,
  com `retention-days: 7`, só o arquivo JSON (sem `test-results/`, trace nem anexo)
- [ ] 4.2 — `esteira.ts --censo [branch]`: acha a última execução verde da branch, baixa as fatias (`gh run download`),
  lê com `casosMedidos` e lista o caso acima de 2/3 do prazo, com fatia e prazo; fatia faltando ou artefato expirado
  sai 2 dizendo qual
- [ ] 4.3 — `duracao-do-e2e.ts`: sem o título no HEAD, `prazosDoHead` dá ao caso o prazo do caso cujo corpo sem o
  título é idêntico; corpo mudado, ou dois corpos iguais, não herdam
- [ ] 4.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `.github/workflows/ci.yml` | alterado (job `e2e`) |
| `tools/processo/esteira.ts` | alterado |
| `tools/processo/esteira.test.ts` | alterado |
| `tools/processo/__fixtures__/esteira/` | alterado (relatórios de fatia) |
| `tools/ci/esteira.test.ts` | alterado |
| `tools/ci/duracao-do-e2e.ts` | alterado |
| `tools/ci/duracao-do-e2e.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| RF9: caso a 70% do prazo numa fatia | unidade | listado, com fatia e prazo |
| RF9: caso a 60% | unidade | não listado |
| RF9: fatia faltando | unidade | sai 2, dizendo qual |
| RF9: artefato expirado | unidade | sai 2, dizendo qual |
| RF9: vermelha mais nova que a verde | unidade | o censo lê a verde |
| RF9: o `ci.yml` sobe só o JSON, também no verde, por 7 dias, sem `test-results/` | unidade | nada além do relatório vai para o artefato público |
| RF11: título novo, corpo idêntico ao do HEAD com `test.slow()` | unidade | herda 90 s |
| RF11: título novo, corpo mudado | unidade | sem prazo herdado |
| RF11: dois corpos iguais no HEAD | unidade | nenhum herda |

## Como testar

- RF9 no YAML: copiar `tools/ci/esteira.test.ts › esteira do GitHub (.github/workflows/ci.yml) › o e2e publica o traço da falha, só quando falha e por prazo curto: sem isso o vermelho fica indiagnosticável`, e ajustar `nenhum outro job publica artefato…` para aceitar o artefato novo.
- RF9 no `esteira.ts`: o download do `gh` é injetado; o relatório de exemplo segue o formato que `casosMedidos` já lê em `duracao-do-e2e.test.ts › casosMedidos: lê o relatório do repórter json do Playwright`.
- RF11: copiar `tools/ci/duracao-do-e2e.test.ts › no repositório: o diff do git decide qual caso é alterado › o caso movido para um spec novo leva o prazo que tinha no HEAD, e o test.slow() posto agora num caso que o HEAD não tinha não conta`.
- Rodar: `npx vitest run --project unidade tools/processo/esteira.test.ts tools/ci/esteira.test.ts tools/ci/duracao-do-e2e.test.ts`.

## Fora do escopo desta tarefa

Quando o Orquestrador roda o censo e abre correção (texto do `/seguir`, 17.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
