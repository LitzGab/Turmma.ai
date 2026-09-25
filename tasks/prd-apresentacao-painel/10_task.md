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

- [x] 10.1 — A fronteira de erro da operação define `document.title`; na entrada, a senha sai do estado
  depois de uma falha; no convite, a resposta de um aceite feito com o token anterior a um `hashchange`
  é descartada
- [x] 10.2 — Duas chamadas em paralelo que recebem `ACESSO_VENCIDO` fazem um só `POST /renovar`; clique
  duplo em "Entrar" do segundo fator e em "Sair" envia uma vez só
- [x] 10.3 — O seed do e2e usa `hashDoTokenDeConvite` em vez de repetir o hash; os testes do E5 da A0
  levam "E5" no título
- [x] 10.4 — `tabelasSemEscola` reconhece `CREATE TABLE IF NOT EXISTS`, nome com `"public".`,
  `ALTER TABLE … RENAME TO` e `DROP COLUMN "escola_id"`; e falha quando acha um `CREATE TABLE` que não
  consegue ler, comparando a contagem com uma busca mais solta
- [x] 10.5 — Testes

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
| seed pelo hash do comando | e2e | o seed grava o hash pelo `hashDoTokenDeConvite` do comando; o seed com o hash de outro valor quebra o E1 da A0 (ver "Divergências") |
| DDL escrito à mão | unidade | cada forma do 10.4 é lida certo, e um `CREATE TABLE` ilegível faz o teste falhar |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada válida
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Divergências resolvidas nesta tarefa

- **Clique duplo: a trava mora na sessão, e não na tela.** O `if (entrando) return` do segundo fator e o `if (saindo)
  return` do "Sair" leem o estado da renderização: dois cliques no mesmo instante, antes de a tela se redesenhar com o botão
  desligado, passam os dois. `entrarComSegundoFatorDeOperador` e `sairComoOperador` (`api/sessao.ts`) passam a devolver o
  pedido que já está no ar (`??=`, como a renovação), e a vez seguinte sai de novo (`finally`). Prova: os dois testes de
  unidade do segundo fator e o do "Sair" em `sessao.test.ts` (com `Promise.all`, e a vez seguinte), e o e2e "clique duplo",
  que dispara os dois cliques no mesmo instante (`evaluate`), o caso que o botão desligado não segura. Nenhuma gravação nova:
  sai um pedido a menos.
- **"Senha fora do estado" é e2e, e não unidade.** O `apps/web` não tem DOM no Vitest, e a regra é da tela. O primeiro teste
  de `operacao.spec.ts` confere, depois da senha errada, o campo vazio e com o foco (o foco no campo é novo: a pessoa digita a
  senha de novo sem procurar), e o e-mail mantido.
- **"Aceite antigo descartado" tem as duas camadas.** A regra ficou em `aceitarConviteDeOperadorNaVez` (`api/convite.ts`),
  com teste de unidade (a resposta de sucesso e a de recusa descartadas, e o par sem outro link, que vale), e a tela a liga ao
  `hashchange` pela `vezDoLink`; o e2e prova a ligação: com o aceite anterior segurado e respondido 200, a tela fica no link
  novo, e o link novo segue até o configurar. O desafio do aceite descartado sai da memória: é da conta do link anterior.
- **Renovações em paralelo: a prova na aba já existia.** O teste com `Promise.all` e um só `POST /renovar` entrou na 2ª rodada
  da 10.0 da A0 (`sessao.test.ts`, "duas chamadas em paralelo que recebem ACESSO_VENCIDO"), e a mutação sem o `??=` o deixa
  vermelho. O que faltava era a trava entre abas: o teste novo, com as Web Locks em fila, prova que a renovação da segunda aba
  só sai depois de a primeira voltar; sem a trava, as duas saem juntas.
- **A prova do seed pelo hash do comando é a inversa da escrita na tabela.** Com o seed usando o `hashDoTokenDeConvite`,
  trocar o hash da função **não** quebra o E1: a API e o seed são construídos do mesmo fonte e mudam juntos, que é o objetivo
  (o seed repetido é que quebrava, com um falso vermelho, ou passava com um hash que o comando já não gravava). O que quebra o
  E1 é o seed gravar um hash diferente do que o aceite procura: conferido à mão, com o seed trocado para o hash de outro
  valor, o E1 fica vermelho nos dois projetos. Para o e2e importar a função sem arrastar o Nest e o banco, o hash e o tamanho
  do token saíram de `convite.service.ts` para `apps/api/src/sessao/hash-do-token.ts`, só com `node:crypto`; o
  `token-do-convite.ts` da operação e o `convite.service.ts` importam de lá.
- **O seed do convite de coordenador também** (`e2e/__fixtures__/sessao.ts`) repetia o hash, e passou a usar o mesmo
  `hashDoToken`: é o mesmo defeito, na mesma peça.
- **O título da fronteira** vem de `apps/web/src/titulo-da-operacao.ts`, fora de `src/operacao/`, porque a entrada da web
  não importa nada de lá (B2); o `useTituloDaPagina` da operação usa a mesma função.
- **`tabelasSemEscola` lê o SQL comando a comando**, sem o corpo de função, comentário e texto entre aspas, e também segue
  `RENAME COLUMN` do `escola_id` e `DROP TABLE` com `"public".`. A conferência contra a busca solta vale só para o `CREATE
  TABLE`, como a subtarefa pede; uma forma de `ALTER` que a leitura não conheça ainda passaria, e o docblock diz isso.

## Destino das pendências da A0 levadas a esta tarefa

As linhas da tabela "Pendências para a A0b" (`tasks/prd-apresentacao-operacao/retro.md`) que a 9.0 mandou para cá:

| Origem | Pendência | Destino |
|---|---|---|
| 10.0 | renovações em paralelo na web | já coberta desde a 2ª rodada da 10.0 da A0 (`sessao.test.ts`, `Promise.all` com um só `POST /renovar`); aqui ganha a prova da trava entre abas (10.2) |
| 10.0 | clique duplo em "Entrar" do segundo fator e em "Sair" | feita aqui (10.2): um pedido só na sessão; testes de unidade e o e2e "clique duplo" |
| 10.0 e 11.0 | fronteira de erro sem `document.title` | feita aqui (10.1): E4 confere o título |
| 10.0 e 11.0 | a senha no estado depois de falha | feita aqui (10.1): primeiro teste de `operacao.spec.ts` |
| 10.0 e 11.0 | aceite em andamento durante um `hashchange` | feita aqui (10.1): `aceitarConviteDeOperadorNaVez`, com unidade e e2e |
| `/validar` | o e2e semeia o convite por SQL e repete o hash | feita aqui (10.3): `sortearTokenDeConvite` e `hashDoTokenDeConvite` no seed |
| `/validar` | o E5 sem o identificador no nome do teste | feita aqui (10.3): `casca.spec.ts` e `tokens.spec.ts` |
| correção de 24/09 | `tabelasSemEscola` só reconhece o DDL do drizzle | feita aqui (10.4) |

## Fora do escopo desta tarefa

As telas novas da A0b (6.0 a 8.0).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-25 12:17:50 | 2026-09-25 12:19:35 | `test-engineer` | 1 | APROVADO | a8fd7f30f82ba8288 |
| 2026-09-25 12:20:01 | 2026-09-25 12:20:57 | `privacy-guardian` | 1 | APROVADO | a7e03f4157eab7db7 |
| 2026-09-25 12:19:56 | 2026-09-25 12:21:04 | `frontend-reviewer` | 1 | APROVADO | a10e86710afad36ad |
| 2026-09-25 12:19:51 | 2026-09-25 12:21:10 | `revisor-geral` | 1 | APROVADO | afc27a5349cb10973 |
