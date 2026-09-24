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

- [ ] 8.1 — Formatadores em `apps/web/src/operacao/formatos.ts`: número por `Intl.NumberFormat('pt-BR')`;
  bytes em unidade ("1,2 GB"); dia "23/09/2026"; mês "setembro de 2026, até 23/09"; rótulos
  "requisições", "tarefas em segundo plano", "armazenamento"
- [ ] 8.2 — Tela `/operacao/uso`: tabela no Chromebook, cartão por escola abaixo de 640 px com dia e mês
  empilhados; a data de referência que a API devolveu; página e ordem na query string, com
  `placeholderData`; os quatro estados, com o vazio "Nenhuma escola ainda." e o link para Escolas
- [ ] 8.3 — Testes

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

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada válida
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Custo em reais (D42) e consumo de IA (A2).
