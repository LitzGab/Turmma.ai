# Tarefa 4.0 — Professor gera e revoga o acesso da turma, com link e código

**Funcionalidade:** apresentacao-escola · **Depende de:** 1.0 · **Paralelo com:** 2.0, 3.0, 11.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O professor com vínculo confirmado gera link e código da turma (1, 7 ou 30 dias), que aparecem uma vez; "Gerar
novo" derruba o anterior, também o de outro professor; a turma só sai sem acesso vigente.

## Contexto necessário

- `docs/visao-produto.md`; `docs/lgpd.md`, linha "Acesso da turma"
- `techspec.md` seções 3 (`acesso_turma`, o código, a trava da linha da turma), 4 (acesso), 6, 7 (auditoria, DTO)
  e 7c ("Corridas": o savepoint)
- `cenarios.md`: os ids da tabela abaixo; `revisao-spec.md`, rodada 5 (C11)
- Regras 10, 20 (itens 4, 8), 40, 80 (item 7)
- Código:
  - `TurmaRepository.aberta` — o `turma_vinculada` pelo `exists` do vínculo confirmado
  - `apps/api/src/sessao/hash-do-token.ts` (`hashDoToken`); `packages/nucleo/src/limite/chaves.ts` (a chave HMAC dos
    contadores, de que a do código difere)
  - `apps/api/src/config.ts`, `.env.example`, `infra/teste.env` — onde entra `SALA_CHAVE_CODIGO`
  - `apps/api/test/gatilho-de-parada.ts` — a pausa e a espera por quem está em `wait_event_type = 'Lock'`

## Subtarefas

- [ ] 4.1 — Migration 0020 e schema: FK composta à turma com `on delete cascade`; `criado_por` com `set null
  (criado_por)`; `token_hash` único; turma e `codigo_hmac` únicos por escola entre os não revogados; `validade_dias`
  em 1, 7 ou 30
- [ ] 4.2 — O código: 8 caracteres do alfabeto de 31, exibido em dois grupos de 4; normalização da entrada
  (espaço, hífen, minúscula) em `packages/shared`, porque a página pública (17.0) usa a mesma; HMAC com a chave
  própria; sorteio injetável para o C6
- [ ] 4.3 — Gerar, numa transação: `for share` da turma, revoga o vigente, grava; colisão do código sorteia de novo
  num savepoint, e três seguidas dão 503 `INDISPONIVEL_TENTE_DE_NOVO`; o 23505 do único por turma vira `CONFLITO`;
  a turma que sumiu, `NAO_ENCONTRADO`. Responde link e código uma vez, `no-store`. Auditoria
  `acesso_turma.gerado`, sem token nem código
- [ ] 4.4 — `POST turmas/:id/acesso/revogar` (`acesso_turma.revogado`) e `GET turmas/:id/acesso` (só `expiraEm`)
- [ ] 4.5 — Excluir turma: `select … for update` da turma como comando próprio, depois o `delete` com `not exists`
  de acesso vigente (`CONFLITO`); o revogado sai pela cascata
- [ ] 4.6 — Módulo `apps/api/src/sala`, contratos `.strict()`, células da `MATRIZ` (professor `turma_vinculada`)
- [ ] 4.7 — Documento: `AcessoTurma` real em `docs/modelo-de-dados.md`
- [ ] 4.8 — Testes; rotas em `escola-montada.int.test.ts` e `matriz.test.ts`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo`: `drizzle/0020_acesso_turma.sql`, `schema/acesso-turma.ts`, `auditoria/acoes.ts` | novo, alterado |
| `apps/api/src/sala/` (acesso, código, módulo); `packages/shared/src/sala/acesso.ts` | novo |
| `turma.repository.ts`, `config.ts`, `.env.example`, `infra/teste.env`, `matriz*.ts`, `docs/modelo-de-dados.md` | alterado |
| `apps/api/test/acesso-da-turma.int.test.ts`; `escola-montada.int.test.ts` | novo, alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| E13, E14 | integração | `expira_em` por validade; 0, 2 e 31 recusados; o anterior cai na hora, também o de outro professor |
| E15 | unidade | alfabeto, exibição, normalização, e o HMAC diferente do dos contadores |
| E12 (acesso), P2 | integração | vínculo pendente, contestado ou encerrado, coordenação, aluno, outra turma: 404; duas disciplinas, uma confirmada, alcança |
| E2 (esta parte) | integração | turma com acesso vigente: `CONFLITO`; com o acesso revogado, sai levando-o |
| A1, A5 | integração | `acesso_turma.gerado` e `.revogado`; token e código nunca em claro no banco nem na auditoria |
| I3, I9 (acesso) | integração, unidade | escola B; células |
| C5, C6 | integração, em paralelo | dois gerar com `Promise.all`: um vigente, o outro `CONFLITO`; colisão com savepoint, e 503 na terceira |
| C11 | integração, em paralelo | pausa no gerar depois do `insert`; e pausa no excluir, com o gerar recebendo `NAO_ENCONTRADO`, não 5xx. Cada pausa solta quando o `pg_stat_activity` mostra a outra esperando trava |
| log novo | integração | só ids: nada de token nem código (A4) |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

A rota pública (5.0); o contador por nome (7.0); o `ops:revogar-acessos-sala` (9.0); o `encerrar` e o expurgo
(10.0); a tela e o WhatsApp (15.0).

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
