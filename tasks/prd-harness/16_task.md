# Tarefa 16.0 — Cada regra aponta a checagem que a garante, e nada cita caminho que não existe

**Funcionalidade:** harness (X7) · **Depende de:** 14.0, 15.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer` (o caminho
`tools/guardas/` soma o `infra-guardian`)
**Porte:** grande

## Objetivo

Cada regra diz, item a item, a checagem que a garante (teste, guarda, revisor) ou que só a revisão garante; nenhum papel,
regra ou guarda cita caminho que não existe; e a guarda de SDK de IA olha a pasta onde os adaptadores estão hoje.

## Contexto necessário

- `techspec.md` §2 (linha do `regras-ia.mjs`) e §9
- `prd.md` RF24 (a parte dos caminhos), RF25
- `texto.md`: a linha "pasta de adaptadores" da tabela **As contradições**
- `cenarios.md` seção C, **RF24**, **RF24, guarda de IA** e **RF25**
- `.claude/rules/` inteiras (a 10, a 20 e a 70 ganham a checagem sem perder item: o teste da 15.0 conta)
- Código: `tools/guardas/regras-ia.mjs` (`PASTA_DOS_ADAPTADORES = 'apps/api/src/ia/adapters/**'`, que não existe mais);
  `tools/guardas/guardas.test.ts`, `describe('guarda de SDK de provedor de IA')` e o caso da lista de exceções

## Subtarefas

- [ ] 16.1 — Em cada regra, a checagem de cada item, pelo nome do teste, da guarda ou do revisor, ou "só a revisão garante"
- [ ] 16.2 — `tools/processo/harness/caminhos.test.ts`: os caminhos citados existem, na fronteira abaixo
- [ ] 16.3 — `tools/processo/harness/checagens.test.ts`: a checagem que cada regra cita existe
- [ ] 16.4 — `regras-ia.mjs`: a pasta isenta é `packages/nucleo/src/ia/adaptador-*.ts`; a regra 30 e o `llm-integrator`
  dizem a mesma pasta
- [ ] 16.5 — Testes

## A fronteira do que se confere

- **Onde:** `.claude/agents/*.md`, `.claude/rules/*.md` e `tools/guardas/` fora `*.test.ts` e `__fixtures__/` (amostras)
- **Extração:** token sem espaço entre crases, entre aspas ou começando por `./`, numa função exportada que devolve o token
  cru; a 21.0 a reaproveita com o filtro dela (§9)
- **É caminho** o que, sem o `./`, começa por uma das pastas da §9 (`apps/`, `packages/`, `tools/`, `e2e/`, `infra/`,
  `docs/`, `.claude/`). O resto não é conferido
- **Confere:** sem o sufixo `:<linha>` ou `#<âncora>`; com `<...>`, `…` ou `${...}`, a pasta antes dele existe; com `*`,
  casa ao menos um arquivo; o resto existe
- **Hoje:** 121 caminhos; só os quatro de `apps/api/src/ia/adapters` faltam (16.4). Mínimo: 100, e um em cada pasta

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `.claude/rules/*.md`, as nove (00 a 80) | alterados |
| `.claude/agents/llm-integrator.md` | alterado |
| `tools/guardas/regras-ia.mjs` | alterado |
| `tools/guardas/guardas.test.ts` | alterado |
| `tools/processo/harness/caminhos.test.ts` | novo |
| `tools/processo/harness/checagens.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| RF24: amostra que cita `apps/api/src/inexistente.ts` | unidade | vermelho |
| RF24: os caminhos de hoje | unidade | verde, com contagem mínima |
| fronteira: caminho inexistente num `x.test.ts` e em `__fixtures__/` de `tools/guardas/` da amostra | unidade | verde (fora da fronteira) |
| fronteira: `e2e/__fixtures__/…` e `apps/<x>/y.ts` com a pasta presente; `e2e/inexistente/…` | unidade | verde; vermelho |
| RF25: regra que cita checagem que não existe | unidade | vermelho |
| RF25: regra que diz "só a revisão garante" | unidade | verde |
| RF25: item sem checagem nem a frase | unidade | vermelho |
| guarda de IA: SDK em `packages/nucleo/src/ia/porta.ts` e em `adaptador.ts` | unidade | reprovado |
| guarda de IA: SDK no caminho antigo `apps/api/src/ia/adapters/x.ts` | unidade | reprovado |
| guarda de IA: SDK em `packages/nucleo/src/ia/adaptador-openai-compat.ts` | unidade | passa |
| guarda de IA: a lista de exceções do teste | unidade | atualizada |
| quem contorna é acusado: caminho citado com `./` ou entre aspas em vez de crase | unidade | vermelho, um caso por forma |
| a guarda reprova quando o alvo dela não existe: pasta de regras vazia na amostra | unidade | vermelho |

## Como testar

- Guarda de IA: copiar `tools/guardas/guardas.test.ts › guarda de SDK de provedor de IA › deixa o mesmo código passar dentro dos adaptadores: %s`, trocando os caminhos, e o `it.each` do reprova; ajustar `› as únicas exceções são o SDK nos adaptadores, …`.
- Caminhos: `fs.globSync` (Node 22) ou `git ls-files` com o padrão; a amostra quebrada em `mkdtempSync`.
- Rodar: `npx vitest run --project unidade tools/guardas/guardas.test.ts tools/processo/harness/`.
- Armadilha: os itens numerados da 10, da 20 e da 70 não podem sumir (teste da 15.0).

## Fora do escopo desta tarefa

Papéis do time e critério de saída (19.0); as outras contradições do `texto.md` (18.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
