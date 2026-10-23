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
- [ ] 16.2 — `tools/processo/harness/caminhos.test.ts`: todo caminho entre crases em `.claude/agents/`, `.claude/rules/`
  e `tools/guardas/` existe (glob casa ao menos um arquivo)
- [ ] 16.3 — `tools/processo/harness/checagens.test.ts`: a checagem que cada regra cita existe
- [ ] 16.4 — `regras-ia.mjs`: a pasta isenta é `packages/nucleo/src/ia/adaptador-*.ts`; a regra 30 e o `llm-integrator`
  dizem a mesma pasta
- [ ] 16.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `.claude/rules/00-arquitetura.md`, `.claude/rules/10-multitenancy.md`, `.claude/rules/20-lgpd-menores.md`, `.claude/rules/30-camada-ia.md`, `.claude/rules/40-testes.md`, `.claude/rules/50-frontend.md`, `.claude/rules/60-dominio.md`, `.claude/rules/70-conformidade-cne.md`, `.claude/rules/80-infra-e-carga.md` | alterados |
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
