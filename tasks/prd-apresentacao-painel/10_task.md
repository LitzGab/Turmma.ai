# Tarefa 10.0 — Acabamento da A0 na web e no e2e

**Funcionalidade:** apresentacao-painel · **Depende de:** nenhuma · **Paralelo com:** 1.0 a 5.0, 9.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

As recomendações dos revisores da A0 sobre a web da operação, o e2e e o teste de arquitetura da
correção de 24/09 saem do `retro.md` e viram código e teste, antes de as telas da A0b crescerem em
cima delas.

## Contexto necessário

- `docs/visao-produto.md`
- `tasks/prd-apresentacao-operacao/retro.md`, "Pendências para a A0b", e os blocos 10.0 e 11.0 em
  `tasks/prd-apresentacao-operacao/achados/`
- `tasks/correcoes/2026-09-24-modelo-de-dados-tabelas-da-operacao.md` e o bloco dela em
  `tasks/correcoes/achados/`
- `.claude/rules/50-frontend.md` (itens 3, 7, 11), `20-lgpd-menores.md` (item 8), `40-testes.md`
- Código:
  - `apps/web/src/rotas.tsx` — a `FronteiraDaOperacao`, sem `document.title`
  - `apps/web/src/operacao/paginas/Entrar.tsx` — a senha que fica no estado depois de falha
  - `apps/web/src/operacao/paginas/Convite.tsx` — o aceite em andamento durante um `hashchange`
  - `apps/web/src/operacao/api/sessao.ts` — `renovacaoEmAndamento ??=` e a trava de Web Locks
  - `apps/web/src/operacao/paginas/Mfa.tsx` e o "Sair" da casca
  - `e2e/__fixtures__/operacao.ts` — o seed por SQL que repete o hash do token
  - `e2e/casca.spec.ts:286` e `e2e/tokens.spec.ts:108` — o E5 da A0
  - `apps/api/test/arquitetura.test.ts` — `tabelasSemEscola`

## Subtarefas

- [ ] 10.1 — A fronteira de erro da operação define `document.title`; na entrada, a senha sai do estado
  depois de uma falha; no convite, a resposta de um aceite feito com o token anterior a um `hashchange`
  é descartada
- [ ] 10.2 — Duas chamadas em paralelo que recebem `ACESSO_VENCIDO` fazem um só `POST /renovar`; clique
  duplo em "Entrar" do segundo fator e em "Sair" envia uma vez só
- [ ] 10.3 — O seed do e2e usa `hashDoTokenDeConvite` em vez de repetir o hash; os testes do E5 da A0
  levam "E5" no título
- [ ] 10.4 — `tabelasSemEscola` reconhece `CREATE TABLE IF NOT EXISTS`, nome com `"public".`,
  `ALTER TABLE … RENAME TO` e `DROP COLUMN "escola_id"`; e falha quando acha um `CREATE TABLE` que não
  consegue ler, comparando a contagem com uma busca mais solta
- [ ] 10.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/rotas.tsx` | alterado |
| `apps/web/src/operacao/paginas/Entrar.tsx`, `Convite.tsx`, `Mfa.tsx` | alterado |
| `apps/web/src/operacao/api/sessao.ts`, `sessao.test.ts` | alterado |
| `apps/web/src/operacao/componentes/CascaDaOperacao.tsx` | alterado, se o "Sair" mora lá |
| `e2e/__fixtures__/operacao.ts`, `e2e/casca.spec.ts`, `e2e/tokens.spec.ts`, `e2e/operacao*.spec.ts` | alterado |
| `apps/api/test/arquitetura.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| título da fronteira | e2e | com o chunk falhando, a aba tem o título da fronteira |
| senha fora do estado | unidade | depois de uma falha, o campo de senha está vazio e nada a guarda |
| aceite antigo descartado | unidade | `hashchange` com o aceite no ar: a resposta dele não navega nem muda a tela |
| renovações em paralelo | unidade | `Promise.all` de duas chamadas com `ACESSO_VENCIDO`: um só `POST /renovar`, e as duas repetem com o token novo |
| clique duplo | e2e | dois cliques em "Entrar" do segundo fator e em "Sair": uma requisição cada |
| recomeço da tela | e2e | o segundo operador na mesma aba, depois do "Sair", não vê nada do primeiro (o W4 da A0 continua verde) |
| seed pelo hash do comando | e2e | trocar o hash do `hashDoTokenDeConvite` quebra o E1 da A0 |
| DDL escrito à mão | unidade | cada forma do 10.4 é lida certo, e um `CREATE TABLE` ilegível faz o teste falhar |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada válida
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

As telas novas da A0b (6.0 a 8.0).
