# Tarefa 8.0 — Web: Uso

**Funcionalidade:** apresentacao-painel · **Depende de:** 5.0, 6.0 · **Paralelo com:** 7.0
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O operador lê o uso de infra de cada escola, no último dia fechado e no mês, lado a lado e em
português, sem `ops:uso`.

## Contexto necessário

- `docs/visao-produto.md`, `docs/interface.md` seções 5a ("Uso e custo") e 6
- `techspec.md` seções 4 (`GET /uso`), 5 ("Leitura", "Falhas") e 9
- `cenarios.md`: W5, W6, W7
- `.claude/rules/50-frontend.md` (itens 1, 2, 5, 12)
- Código: a casca e a navegação (6.0); `apps/web/src/operacao/api/painel.ts`; a tela Escolas como
  padrão de tabela e cartão

## Subtarefas

- [x] 8.1 — Formatadores em `apps/web/src/operacao/formatos.ts`: número por `Intl.NumberFormat('pt-BR')`;
  bytes em unidade ("1,2 GB"); dia "23/09/2026"; mês "setembro de 2026, até 23/09"; rótulos
  "requisições", "tarefas em segundo plano", "armazenamento"
- [x] 8.2 — Tela `/operacao/uso`: tabela no Chromebook, cartão por escola abaixo de 640 px com dia e mês
  empilhados; a data de referência que a API devolveu; página e ordem na query string, com
  `placeholderData`; os quatro estados, com o vazio "Nenhuma escola ainda." e o link para Escolas
- [x] 8.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/operacao/formatos.ts` e o teste | novo |
| `apps/web/src/operacao/paginas/Uso.tsx` | novo |
| `apps/web/src/operacao/rotas.tsx`, `caminhos.ts` | alterado |
| `e2e/operacao-uso.spec.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| W5 | unidade | cada formatador com os textos exatos, inclusive zero, 1 023 bytes, a virada de unidade e o mês na virada de ano |
| W6 (Uso) | e2e | 30 escolas, página e ordem, em `chromebook` e `celular`: sem rolagem horizontal a 360 px |
| W7 (Uso) | e2e | carregando, vazio com o link, erro com "Tentar de novo" no 503, com dado; axe nos dois projetos |
| referência | e2e | a data mostrada é a que a API devolveu, e não a de hoje no navegador |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada válida
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Custo em reais (D42) e consumo de IA (A2).

## Divergências resolvidas nesta tarefa

- **Bytes na base 1024, com KB, MB, GB, TB e PB e uma casa decimal.** O W5 dá "1,2 GB" sem dizer a base; a tela usa a conta
  que o Chromebook e o Windows mostram. O número nunca passa de 1.023,9 da unidade: o arredondamento que daria "1.024 KB"
  sobe para "1 MB". Prova: `formatos.test.ts` (1.023 bytes, 1 KB, 1.000.000 bytes = "976,6 KB", 1.048.575 bytes = "1 MB").
- **O número é o `formatarNumero` de `apps/web/src/formatar.ts`**, reexportado por `formatos.ts`, e não outro
  `Intl.NumberFormat` (recomendação da 1ª rodada do `revisor-geral` na 6.0). O dia e o "até 23/09" são lidos do texto
  `AAAA-MM-DD` que a API devolveu, sem `Date`; o nome do mês sai do `Intl` no dia 15 do mês, em UTC, e nenhum fuso o tira
  do lugar.
- **A ordem e as páginas saíram de `Escolas.tsx` para `componentes/NavegacaoDaLista.tsx`** (`SeletorDeOrdem`,
  `PaginasDaLista`, `VazioAlemDaUltima`), e as duas telas as usam, em vez de o Uso copiar os mesmos botões e textos. O
  `paginasDoTotal` foi para `api/painel.ts`, com teste. Escolas não muda: o W6 e o W7 dela seguem verdes, com os mesmos
  nomes acessíveis ("Ordenar as escolas por", "Páginas da lista"). No Uso, a navegação das páginas é "Páginas do uso".
- **Criar escola deixa velho também o cache do Uso** (`CHAVE_DO_USO`, em `NovaEscola.tsx`). Sem isso, o Uso aberto há menos
  de 30 s (o `staleTime` da operação) voltava sem a escola nova. Não é chamada nova: é o `GET` do Uso que já existe, uma vez,
  na próxima visita do operador à tela, contado no `rl:op`. Prova: o e2e "a escola criada pela tela entra no Uso com zero",
  com o relógio do navegador parado (`setFixedTime`) depois da primeira visita; tirar a invalidação deixa os dois projetos
  vermelhos (conferido).
- **O vazio do Uso** é "Nenhuma escola ainda." com "O uso de cada escola aparece aqui assim que ela é criada." e o link
  "Ir para Escolas" (um `Link`, com o tamanho da ação principal): o W7 pede o link, e a escola se cria em Escolas.
- **A ordem padrão do Uso é `nome`**, a mesma da lista e da API (`CONSULTA_PADRAO`); "Mais uso no mês" é um toque.
- **A referência aparece uma vez, acima da tabela** ("Último dia fechado: 23/09/2026. Mês: setembro de 2026, até 23/09."),
  e nos títulos dos dois grupos de colunas ("Dia 23/09/2026", "Mês: setembro de 2026, até 23/09") e dos dois blocos do
  cartão. A escola sem uso consolidado mostra zero ("0", "0 bytes"), como a API devolve.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-25 09:21:20 | 2026-09-25 09:23:16 | `test-engineer` | 1 | APROVADO | a485f67895f6c3ef4 |
| 2026-09-25 09:39:23 | 2026-09-25 09:39:52 | `test-engineer` | 2 | APROVADO | ad00e73ef3d056d8d |
| 2026-09-25 09:54:50 | 2026-09-25 09:55:08 | `test-engineer` | 3 | APROVADO | abfc39794313a7aba |
| 2026-09-25 09:55:16 | 2026-09-25 09:56:20 | `revisor-geral` | 1 | APROVADO | a03242590a7107a0a |
| 2026-09-25 09:55:21 | 2026-09-25 09:56:48 | `frontend-reviewer` | 1 | APROVADO | a868cca2e569bdce4 |
