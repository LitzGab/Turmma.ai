# Tarefa 7.0 — Web: o convite da coordenação

**Funcionalidade:** apresentacao-painel · **Depende de:** 3.0, 6.0 · **Paralelo com:** 8.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Da linha da escola, o operador gera o convite da coordenação, copia o link que aparece uma vez, e
refaz ou revoga com confirmação, até a coordenadora ativar a conta e a escola aparecer `ativa`.

## Contexto necessário

- `docs/visao-produto.md`, `docs/interface.md` seções 5a e 6
- `techspec.md` seções 4, 5 (a matriz) e 9 ("Convite", "Refazer e revogar")
- `cenarios.md`: W1, W2, W3, W4, W8, W9, W10
- `.claude/rules/50-frontend.md` (itens 3, 7, 8, 11, 12), `20-lgpd-menores.md` (item 8)
- `tasks/prd-apresentacao-operacao/retro.md`, "Propostas", 3: a linha de recomeço da tela
- Código: a tela Escolas e `api/painel.ts` (6.0); `apps/web/src/operacao/paginas/Convite.tsx` (A0), para
  o padrão de token fora da barra; a tela de convite da coordenação do F1 (`/convite#<token>`), que a
  coordenadora abre no W1

## Subtarefas

- [ ] 7.1 — Ações na linha pela matriz da seção 5 (convidar, refazer, revogar), sem inventar estado
  que a API não deu
- [ ] 7.2 — Diálogo do convite: nome e e-mail (`autocomplete="off"`, `inputmode="email"`); o resumo antes
  de enviar (escola, nome, e-mail, "vale 72 h", "o link aparece uma vez"); depois, o link montado com a
  própria origem num campo de leitura, com Copiar, "Link copiado" em `aria-live` e a reserva sem
  `navigator.clipboard`; fechar (botão, Esc ou fora) sem cópia confirmada pergunta antes. A mutation usa
  `gcTime: 0` e `reset()` ao fechar
- [ ] 7.3 — Refazer (avisa que o link anterior para) e revogar pedem confirmação; `CONFLITO` e
  `NAO_ENCONTRADO` com os textos da W10 recarregam a lista
- [ ] 7.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/operacao/paginas/Escolas.tsx` | alterado |
| `apps/web/src/operacao/componentes/DialogoDoConvite.tsx`, `ConfirmarConvite.tsx` | novo |
| `apps/web/src/operacao/api/painel.ts`, `textos.ts` | alterado |
| `e2e/operacao-convite-coordenacao.spec.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| W1 | e2e | criar rede e escola, gerar, copiar; a coordenadora abre o link e ativa; a lista mostra `ativa` com as contagens; em `chromebook` e `celular` |
| W2 | e2e | dois operadores; um refaz, o outro tenta refazer o mesmo: "o convite mudou" e a lista recarrega |
| W3 | e2e | fechar sem copiar pergunta; fechando, refaz, e o link anterior abre a tela de convite inválido |
| W4 | e2e | recarregar não mostra o link; outro operador na mesma aba não vê lista nem diálogo do primeiro |
| W8 (convite) | e2e | gerar convite só com Tab e Enter; Esc cai na pergunta de fechar sem copiar |
| W9 | e2e | sem `navigator.clipboard`, o Copiar seleciona o campo e pede para copiar; com ele, "Link copiado" anunciado |
| W10 (convite) | unidade e e2e | os textos de `CONFLITO` e `NAO_ENCONTRADO` por ação, sem código; na tela, o `CONFLITO` exato na W2 e "Ativa" na W1 |
| W6 (cartão com ações) | e2e | em `chromebook` e `celular`, a 360 px sem rolagem horizontal, e os botões convidar, refazer e revogar com pelo menos 44 × 44 px |
| token fora do cache | unidade | fechado o diálogo, nenhuma entrada do `MutationCache` guarda o token |
| clique duplo | e2e | dois cliques em "Gerar" mostram um só link, e a lista termina com um convite em aberto |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada válida
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Envio do link por e-mail (F2): o operador manda à mão.
