# Tarefa 13.0 — O commit exige o guardião que o caminho pede

**Funcionalidade:** harness (X7) · **Depende de:** 9.0, 10.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`
**Porte:** grande

## Objetivo

Os obrigatórios de um commit passam a ser a união dos marcados com os que o caminho alterado pede: código em `apps/`,
`packages/`, `e2e/`, `tools/guardas/` e `tools/testes/` pede os quatro guardiões, salvo as exceções escritas, e a citação
de uma regra soma o guardião dela; o portão imprime a lista unida.

## Contexto necessário

- `techspec.md` §5(b)
- `prd.md` RF15
- `tabela-de-guardioes.md` inteira, menos a seção "Fora do código de produto" (14.0)
- `cenarios.md` seção B, **RF15**
- Código: `tools/processo/documento-de-revisao.ts` (`revisoresObrigatorios`); `tools/processo/portao.ts`
  (`decidirCommit`, que recebe `conteudoDe`); `tools/processo/portao-local.ts` (o que ele imprime)

## Subtarefas

- [ ] 13.1 — `tools/processo/guardioes-por-caminho.ts`: `guardioesDoCaminho(arquivos, conteudoDe)` com a tabela "Exceções
  do código"; prefixo sem glob, o mais longo vence; `*.repository.ts`, `*.controller.ts`, `*.gateway.ts`, `*.service.ts`
  e arquivo com `@SemEscopo(` no HEAD ou no índice nunca caem em exceção; a citação ("regra 10" → T, "regra 20" ou
  "LGPD" → P, "regra 70" → C, "regra 80" → I, sem caixa, no HEAD ou no índice) soma
- [ ] 13.2 — `decidirCommit`: obrigatórios = união dos marcados com o caminho
- [ ] 13.3 — O portão imprime a lista unida
- [ ] 13.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/guardioes-por-caminho.ts` | novo |
| `tools/processo/harness/guardioes.test.ts` | novo |
| `tools/processo/portao.ts` | alterado |
| `tools/processo/portao-local.ts` | alterado |
| `tools/processo/revisoes.test.ts` | alterado |

## Testes que provam a regra

Todos os casos de `tabela-de-guardioes.md`, seção "O teste da tabela", menos os do RF16 (14.0), com os literais
escritos no teste. Em resumo:

| Cenário | Tipo | O que prova |
|---|---|---|
| todo arquivo versionado nas cinco pastas, exceto os que casam exceção | unidade | os quatro |
| cada exceção casa ao menos um arquivo | unidade | exceção morta é vermelha |
| um caso por exceção | unidade | o conjunto exato |
| `it.each` dos quatro sufixos em `componentes/ui/` e `galeria/` | unidade | os quatro |
| `@SemEscopo(` no índice / só no HEAD / em nenhum (`componentes/ui/`) | unidade | quatro / quatro / C I |
| citação, um caso por termo e arquivo da tabela; sem citação; citava no HEAD e não no índice | unidade | soma; não soma; soma P |
| `AvisoFila.tsx`; `DialogoDeConfirmacao.tsx` | unidade | P C I; C I |
| `leitura-do-titular.ts`, `estrutura-isolamento.int.test.ts`, `aluno-tutor.spec.ts`, pasta inventada | unidade | os quatro |
| repository alterado sem `tenancy-guardian` marcado e sem rodada dele (`decidirCommit`) | unidade | recusado; com a rodada APROVADO, passa |
| marcado e não pedido pelo caminho | unidade | continua obrigatório |
| o portão imprime a lista unida | unidade | |

Cada regra de casamento leva bloco de mutação (prefixo mais longo, sufixos, `@SemEscopo(` no HEAD e no índice, cada termo
da citação, a união).

## Como testar

- Lista de arquivos versionados: `git ls-files` no teste, filtrado pelas cinco pastas; a exceção morta sai da contagem
  de casamentos por exceção.
- `conteudoDe` injetado: `(arquivo, onde: 'head' | 'indice') => string`; o caso "só no HEAD" passa texto diferente para
  os dois.
- Recusa pelo commit: copiar `tools/processo/revisoes.test.ts › portão do commit › bloqueia revisor obrigatório que nunca rodou`, trocando a marcação pela do caminho.
- Rodar: `npx vitest run --project unidade tools/processo/harness/guardioes.test.ts tools/processo/revisoes.test.ts`.

## Fora do escopo desta tarefa

As linhas do RF16 e a lista do §5(e) (14.0); o texto das skills que falam de marcação (18.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
