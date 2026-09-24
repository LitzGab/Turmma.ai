# Tarefa 6.0 — Web: Escolas, Nova rede e Nova escola

**Funcionalidade:** apresentacao-painel · **Depende de:** 1.0, 5.0 · **Paralelo com:** nenhuma
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O operador vê as escolas lado a lado, com estado e contagens, e cria rede e escola por diálogo, com
revisão do endereço, no computador da escola e no celular.

## Contexto necessário

- `docs/visao-produto.md`, `docs/interface.md` seções 5a e 6
- `techspec.md` seções 4 e 9
- `cenarios.md`: W6, W7, W8, W10
- `.claude/rules/50-frontend.md` (itens 1, 2, 5, 8, 11, 12)
- `tasks/prd-apresentacao-operacao/techspec.md` seção 9 e o código da área:
  - `apps/web/src/operacao/rotas.tsx` — o `Inicio` com a casca vazia, que dá lugar a Escolas; o cliente
    de consultas próprio da operação
  - `apps/web/src/operacao/componentes/CascaDaOperacao.tsx`, `textos.ts`, `titulo.ts`, `caminhos.ts`
  - `apps/web/src/operacao/api/sessao.ts` — `chamarComSessaoDeOperador`
  - `apps/web/src/componentes/` — `Botao`, estados, e o padrão dos diálogos do F1
- `.size-limit.json` — o teto de 60 kB do chunk `operacao-*` (B1) e o `nome-dos-chunks.test.ts` (B2)

## Subtarefas

- [ ] 6.1 — Navegação da casca (Escolas, Uso) e a rota `/operacao` com a tela Escolas: tabela no
  Chromebook, um cartão por escola abaixo de 640 px; estado com o texto da W10 e a cor só de reforço;
  `pagina` e `ordem` na query string; `placeholderData` na troca; os quatro estados, com os vazios da W7
- [ ] 6.2 — Diálogo Nova rede e diálogo Nova escola: o UUID do pedido nasce ao abrir e morre ao fechar;
  "Endereço da escola" com a prévia `/e/<slug>` e a regra de formato visível; passo de revisão (rede,
  nome, endereço, "o endereço não muda depois"); sem rede, "Crie a rede primeiro". `CONFLITO` do slug no
  campo, com o texto da W10. Foco preso no diálogo e devolvido ao botão que o abriu
- [ ] 6.3 — Se o chunk passar de 60 kB brotli, as páginas vão para chunks `operacao-*`
- [ ] 6.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/operacao/rotas.tsx`, `caminhos.ts`, `textos.ts` | alterado |
| `apps/web/src/operacao/componentes/CascaDaOperacao.tsx` | alterado |
| `apps/web/src/operacao/paginas/Escolas.tsx`, `NovaRede.tsx`, `NovaEscola.tsx` | novo |
| `apps/web/src/operacao/api/painel.ts` | novo |
| `apps/web/src/operacao/estados-da-escola.ts` e o teste | novo |
| `e2e/operacao-escolas.spec.ts` e fixture | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| W6 (Escolas) | e2e | 30 escolas (uma com nome longo e slug no limite), página e ordem, em `chromebook` e `celular`: sem rolagem horizontal a 360 px, também no diálogo com a prévia; o texto de cada estado aparece na tela |
| W7 (Escolas, Nova escola) | e2e | carregando, vazio com a ação, erro com "Tentar de novo" no 503, com dado; "Crie a rede primeiro"; axe em todos, nos dois projetos |
| W8 (criar escola) | e2e | criar rede e escola só com Tab e Enter; foco preso e devolvido |
| W10 (estados, rede e escola) | unidade e e2e | o texto de cada estado, sem identificador; `CONFLITO` do slug no campo; 429 com o N do `Retry-After`; 401 leva à entrada; 503 `TEMPO_ESGOTADO`. Na tela, pela W6 e pela W7 |
| clique duplo | e2e | dois cliques em "Criar" enviam o mesmo `id` e a lista mostra uma escola |
| recomeço da tela | e2e | reabrir o diálogo sorteia outro `id`; sair e entrar outro operador na aba não mostra a lista do primeiro |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada válida
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

As ações de convite na linha (7.0) e a tela Uso (8.0).
