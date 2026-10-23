# Tarefa 15.0 — A base fixa curta, e as regras 00, 40, 60 e 80 por `paths:`

**Funcionalidade:** harness (X7) · **Depende de:** 2.0
**Subagentes obrigatórios:** `infra-guardian`, `conformidade-reviewer`
**Porte:** grande

## Objetivo

O que todo terminal lê antes de qualquer pedido (o `CLAUDE.md` mais as regras sem `paths:`) cai de 75 KB para até
40.000 B, sem perder item das regras 10, 20 e 70, que continuam sempre carregadas; as regras 00, 40, 60 e 80 passam a
carregar pelo caminho; e um teste prende o tamanho.

## Contexto necessário

- `techspec.md` §9 e §11; §12 (a segunda premissa: regra com `paths:` lida por subagente)
- `prd.md` RF20
- `texto.md`: **Para onde vai o `CLAUDE.md`** e **As regras ganham `paths:`**
- `cenarios.md` seção C, **RF20**
- Hoje: `CLAUDE.md` 36.351 B; regras sem `paths:` (00, 10, 20, 40, 60, 70, 80) 38.866 B. Modelo de `paths:` em
  `.claude/rules/50-frontend.md`
- Código: `tools/processo/estado.ts`, linha que conta "Decisões em aberto" no `CLAUDE.md` (passa a ler
  `docs/decisoes-em-aberto.md`)

## Subtarefas

- [ ] 15.1 — Antes de mexer: gravar a medida de hoje (bytes da base fixa e itens numerados da 10, da 20 e da 70) em
  `tools/processo/harness/__fixtures__/base-fixa-antes.json`
- [ ] 15.2 — `CLAUDE.md`: decisões em uma linha (número e título); "Conflitos já resolvidos" para o topo de
  `docs/decisoes.md`; "Decisões em aberto" para `docs/decisoes-em-aberto.md`; "Skills" para
  `.claude/skills/seguir/time.md`; os conflitos de skill para `docs/skills-de-terceiros.md`. Ficam o produto, as seis
  regras, o recorte, a stack e o mapa
- [ ] 15.3 — `estado.ts` conta as decisões em aberto no arquivo novo
- [ ] 15.4 — `paths:` nas regras 00, 40, 60 e 80, como o `texto.md` diz; a 40 ganha a frase do RF17 (§5d)
- [ ] 15.5 — `criar-prd`, `criar-techspec`, `revisar-spec`, `criar-tasks`, `validar` e `retro` mandam ler as quatro por
  extenso
- [ ] 15.6 — Prova da premissa: um subagente que lê um arquivo de `apps/` recebe a regra 00? Anotar em "Divergências";
  se não receber, os revisores também mandam ler (`texto.md`)
- [ ] 15.7 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `CLAUDE.md` | alterado |
| `docs/decisoes.md` | alterado (topo) |
| `docs/decisoes-em-aberto.md` | novo |
| `docs/skills-de-terceiros.md` | novo |
| `.claude/skills/seguir/time.md` | novo |
| `.claude/rules/00-arquitetura.md`, `.claude/rules/40-testes.md`, `.claude/rules/60-dominio.md`, `.claude/rules/80-infra-e-carga.md` | alterados |
| `.claude/skills/criar-prd/SKILL.md`, `.claude/skills/criar-techspec/SKILL.md`, `.claude/skills/revisar-spec/SKILL.md`, `.claude/skills/criar-tasks/SKILL.md`, `.claude/skills/validar/SKILL.md`, `.claude/skills/retro/SKILL.md` | alterados |
| `tools/processo/estado.ts`, `tools/processo/estado.test.ts` | alterados |
| `tools/processo/harness/base-fixa.test.ts` | novo |
| `tools/processo/harness/__fixtures__/base-fixa-antes.json` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| base fixa acima de 40.000 B (amostra) | unidade | vermelho |
| regra sempre carregada diferente de {10, 20, 70} | unidade | vermelho |
| menos itens numerados na 10, na 20 ou na 70 que no "antes" | unidade | vermelho, um caso por regra |
| o repositório depois da tarefa | unidade | verde, com a medida de antes gravada |
| `estado.ts` conta as decisões em aberto do arquivo novo | unidade | o resumo da sessão mostra o número |
| a guarda reprova quando o alvo dela não existe: `CLAUDE.md` ausente na amostra | unidade | vermelho |

## Como testar

- Contagem de decisões: copiar `tools/processo/estado.test.ts › lerEstado, do disco › o resumo da sessão aponta a funcionalidade da vez e conta as decisões em aberto`, apontando o arquivo novo.
- A base fixa é calculada lendo o frontmatter de cada regra (`paths:` presente ou não); a amostra quebrada é cópia em `mkdtempSync`.
- Rodar: `npx vitest run --project unidade tools/processo/harness/base-fixa.test.ts tools/processo/estado.test.ts`.
- Nada sai do `CLAUDE.md` sem destino: confira com `diff` que cada parágrafo removido está em algum dos arquivos novos.

## Fora do escopo desta tarefa

A checagem citada em cada regra (16.0); o `/seguir` partido (17.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
