# Tarefa 6.0 — Aluno reivindica o nome, com idempotência e hash sempre no semáforo

**Funcionalidade:** apresentacao-escola · **Depende de:** 2.0, 5.0 · **Paralelo com:** 11.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O aluno escolhe um nome livre, digita a matrícula e cria a senha; o pedido fica pendente e o nome sai da lista;
matrícula errada, nome tomado e nome de outra turma dão a mesma recusa; o reenvio com a mesma chave responde
`enviado` sem pedido novo.

## Contexto necessário

- `docs/visao-produto.md`; `docs/fluxos.md`, fluxo 1; `docs/lgpd.md`, "Pedido de reivindicação"
- `techspec.md` seções 3, 4 ("Uma resposta só"), 5 (passos 3 e 4), 7 (`chaveEnvio`) e 7c
- `cenarios.md`: os ids da tabela abaixo; `revisao-spec.md`, rodada 5 (C2 e C4)
- Regras 10, 20 (itens 4, 6, 9), 40, 80 (itens 6, 7)
- Código:
  - `apps/api/src/sessao/senha/semaforo-de-hash.ts`, `conferencia-na-vez.ts` (o balde da escola, o 503 com
    `Retry-After`) e `hash-de-senha.ts` (argon2id)
  - `apps/api/src/sessao/matricula.service.ts` — o login do R5
  - `apps/api/test/gatilho-de-parada.ts`, `semaforo-de-login.int.test.ts` — pausa, trava, teto do semáforo

## Subtarefas

- [ ] 6.1 — Migration 0021 e schema, como na seção 3 (FKs com `set null (coluna)`, os dois únicos parciais, o
  check de pendente, o índice). `REIVINDICACAO_RECUSADA` em `packages/shared/src/erros/`
- [ ] 6.2 — Serviço, na ordem do passo 4: chave já gravada na escola e na turma do acesso → `enviado`, sem hash;
  argon2id no semáforo, balde da escola, **sempre**, fora da transação; o `insert` do pedido e **depois** o
  `update` condicional da `lista_nome` (com `trim` na matrícula). FK, 23505 ou `update` sem linha: volta atrás e
  relê a chave num comando novo, sem ler o nome da restrição. `teve_matricula_errada` grava `false` (a 7.0 o lê)
- [ ] 6.3 — `POST salas/reivindicar`, `@RotaAnonima`, `.strict()`, `chaveEnvio` UUID, `no-store`, sem cookie nem
  registro de acesso; responde `enviado`
- [ ] 6.4 — Documento: `Reivindicacao` real em `docs/modelo-de-dados.md`, sem `dispositivo`; o bloco "Ainda não
  existe — F2" fica só com o `Responsavel`
- [ ] 6.5 — Testes; a rota entra em `escola-montada.int.test.ts`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo`: `drizzle/0021_reivindicacao.sql`, `schema/reivindicacao.ts` | novo |
| `apps/api/src/sala/reivindicacao.*`; `salas.controller.ts`, `packages/shared/src/erros/*`, `sala/salas.ts` | novo, alterado |
| `apps/api/test/salas-reivindicar.int.test.ts`; `escola-montada.int.test.ts`, `docs/modelo-de-dados.md` | novo, alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| I4, R1, P5, L10, A6, A7 (reivindicar) | integração | como na 5.0, agora em `salas/reivindicar` |
| I5 | integração | acesso de T1 com o nome de T2 e de B, matrícula certa: recusa, nada alterado |
| R2 (sem "já aprovado") | integração | os sete casos, corpo igual, nada gravado |
| R3 | unidade | o hash falso chamado uma vez em cada caso, pelo semáforo, antes da transação |
| R5 | integração | login com a matrícula e a senha do pendente responde igual à senha errada |
| E23, E24 | integração | falha injetada entre as duas escritas: nada gravado; dois nomes iguais, cada um com a sua matrícula |
| E2, E7 (estas partes) | integração | turma com pedido: `CONFLITO` ao excluir; retirar reivindicado: `CONFLITO`, não apaga |
| E21 (sem contadores) | integração | reenvio: `enviado`, sem pedido nem hash; não UUID: 400; a chave pelo acesso de T2, com a matrícula certa de T2: recusa |
| L9 | integração | o login de B pega a vez no rodízio; nenhuma conexão presa; 503 com `Retry-After`, e o reenvio grava |
| C1 (sem contadores) | integração, em paralelo | dois no mesmo nome: um pendente, o outro recusado, nunca 5xx |
| C2 | integração, em paralelo | os três jeitos; no (c), o índice recriado pelo `indexdef` de `pg_indexes`, mesmo nome e predicado |
| C4 | integração, em paralelo | reivindicar × retirar: pausa depois do `update` da `lista_nome`, solta quando o `pg_stat_activity` mostra o `delete` esperando |
| log novo | integração | só ids: nada de matrícula, senha, chave nem nome (A4) |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Contadores e `teve_matricula_errada` real (7.0); a decisão (8.0); o `for share` no ano (10.0, C10); a página (17.0).

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
