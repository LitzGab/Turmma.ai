# Tarefa 5.0 — Criados: o que a professora já gerou, por turma, com filtros

**Funcionalidade:** telas-do-professor · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `tenancy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A professora tem um quarto lugar, Criados, com tudo o que gerou, agrupado por turma e filtrado por tipo, turma e
estado. A lista sai de Ferramentas. Nenhum dado novo: é a leitura de `GET /v1/artefatos` de hoje.

## Contexto necessário

- `techspec.md` seções 2, 4, 6 e 9 (Criados: grade, filtros à direita do título, grupos por turma em `Linha`);
  `prd.md` RF1, RF2, RF12 e RF22; `mockup.md` 10.1
- Regra 10, itens 3 a 6: o filtro de turma vai ao servidor, e o id de outra escola responde como o inexistente
- Código: `Ferramentas.tsx` (linhas 80 a 113, a lista de hoje, e `SELO_DA_ENTREGA`); `api/artefatos.ts`
  (`consultaArtefatos`); `caminhos.ts`; `areas/navegacao.ts`; `componentes/itens-da-lateral.tsx`

## Subtarefas

- [ ] 5.1 — `/professor/criados`: `ROTAS_DO_PROFESSOR.criados`, a rota em `rotas.tsx` por `lazy()`, o quarto lugar na
  lateral e na barra de baixo, e o ícone (no arquivo de lugares da X1)
- [ ] 5.2 — `Criados.tsx` e `criados.ts`: um grupo por turma e disciplina, cada linha com tipo, data e, na versão
  adaptada, o estado da decisão; filtros `?tipo=`, `?turma=` e `?estado=` no endereço (trocar usa `replace`); "Ver
  mais". A turma vai ao servidor: `consultaArtefatos` ganha o parâmetro, com a chave começando por `artefatos`. Tipo e
  estado filtram o que já foi lido. A 360 px os filtros viram o botão "Filtrar", com diálogo
- [ ] 5.3 — "O que você já gerou" sai de Ferramentas; a fixture `professor/criados.ts` (`abrirOQueFoiGerado`) aponta
  para Criados
- [ ] 5.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/Criados.tsx`, `criados.ts`, `criados.test.ts`, `Criados.test.tsx` | novo |
| `apps/web/src/areas/professor/rotas.tsx`, `Ferramentas.tsx`, `apps/web/src/caminhos.ts` | alterado |
| `apps/web/src/api/artefatos.ts`, `apps/web/src/areas/navegacao.ts`, `apps/web/src/areas/navegacao.test.ts` | alterado |
| `apps/web/src/componentes/itens-da-lateral.tsx` | alterado (o ícone de Criados) |
| `e2e/professor-criados.spec.ts` | novo |
| `e2e/__fixtures__/professor/criados.ts`, `e2e/professor-ferramentas.spec.ts`, `e2e/areas.spec.ts` | alterado (`ITENS_DO_PROFESSOR`) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| os filtros | unidade | tipo, turma e estado juntos; a versão adaptada tem estado e o original não (com "Esperando você" ativo, o original não passa); valor desconhecido no endereço cai em "todos" |
| estados | componente | carregando; erro com "Tentar de novo"; vazio ("Nada gerado ainda", com o caminho para Ferramentas); com dado, agrupado por turma |
| filtro sem resultado | componente | com tipo ou estado sem resultado e mais páginas, a tela diz "até aqui" e mantém "Ver mais"; sem mais páginas, diz "Nada com estes filtros", com "Limpar filtros" |
| o filtro de turma vai ao servidor | componente | trocar a turma faz uma leitura com `turmaId`; trocar o tipo não faz nenhuma |
| o voltar devolve os filtros | e2e | filtrar, abrir um documento, voltar pelo histórico: os filtros e a lista voltam |
| os lugares | e2e | Início, Turmas, Ferramentas e Criados, nesta ordem, nas três larguras; a barra de baixo tem os quatro |
| isolamento | e2e | trocar de escola esvazia Criados; a turma de outra escola no endereço mostra o mesmo que um id inexistente (regra 10, itens 4 e 6) |
| recomeço | e2e | a segunda pessoa na mesma aba não vê a lista nem os filtros da primeira; resposta atrasada da lista anterior não entra. Concorrência e log não se aplicam: só leitura |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`), e o filtro por consulta de
  `Ferramentas`, hoje coberto em `e2e/professor-assistente.spec.ts › Ferramentas (D74)…` (lista com os quatro estados)
- e2e: esse caso se divide: o catálogo fica em `professor-ferramentas.spec.ts`, a lista passa a `professor-criados.spec.ts`
  sem mudar a asserção. A 5.0 e a 9.0 não correm juntas: as duas editam `e2e/areas.spec.ts`
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/Criados.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-criados.spec.ts e2e/areas.spec.ts`
- Telas: `professora`, `/professor/criados`, `--clicar 'role=link[name=/Criados/]'`. Mockup: `/professor/criados`

## Fora do escopo desta tarefa

Busca, renomear e apagar na lista; os selos "Do arquivo" e "Só você vê"; o filtro "Para aprovar" do original (o
original não passa por aprovação: só a versão adaptada e "Aplicar à turma" são atos); o documento aberto (6.0);
Ferramentas (7.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
