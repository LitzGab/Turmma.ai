# Tarefa 2.0 — Convite da coordenação pelo painel: estado, trava, gerar e revogar

**Funcionalidade:** apresentacao-painel · **Depende de:** 1.0 · **Paralelo com:** nenhuma
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O operador gera e revoga o convite da primeira coordenação pelo painel, pela matriz estado × ação da
seção 5, com uma trava por escola que deixa no máximo um convite em aberto, e os `ops:*` de convite
seguem a mesma regra.

## Contexto necessário

- `docs/visao-produto.md`
- `techspec.md` seções 3, 4, 5 ("Convite da coordenação", a matriz e o parágrafo seguinte), 6 e 7c
  (linhas "Convite da escola" e "Convite em aberto")
- `cenarios.md`: A4, E6, E7, E8, E10, E11, E13, I7, A2, A3
- Regras 10, 20 (itens 8, 9, 10), 40 e 80 (itens 7 e 9)
- Código:
  - `apps/api/src/sessao/convite.service.ts` — `criarConviteDeCoordenador` (por slug) e
    `revogarConvitePeloOperador`; o gerar por `escolaId` reaproveita o mesmo corpo, sem copiar
  - `apps/api/src/sessao/convite.repository.ts` — `usuarioConvidado`, `revogarConvitesDoUsuario`,
    `criarConvite`, `revogar`, todos no contexto da escola
  - `apps/api/src/sessao/resolucao-de-tenant.repository.ts` — `escolaDoConviteParaOperador` (ganha o
    filtro de tipo) e `contaParaConvite`
  - `packages/nucleo/src/auditoria/acoes.ts`, `db/schema/convite.ts` e `drizzle/` (o check de tipo)

## Subtarefas

- [x] 2.1 — `estadoDaCoordenacao` em `packages/nucleo` (função pura): os sete estados da seção 5
- [x] 2.2 — Migration do índice único parcial `convite_pendente_unico (escola_id, usuario_id) where
  usado_em is null and revogado_em is null`; 23505 dele vira `CONFLITO`
- [x] 2.3 — `ConviteRepository`: `travarEscola()` (`pg_advisory_xact_lock(7_000_003,
  hashtext(escola_id::text))`, a escola do contexto) e `dadosDaCoordenacao()` para o estado, só convite
  `tipo = 'coordenador'`
- [x] 2.4 — Caso de uso: gerar por `escolaId` e revogar, cada um numa transação que começa pelo autor
  (1.0), pega a trava e só então lê o estado; a matriz e o parágrafo seguinte da seção 5 decidem.
  `escolaDoConviteParaOperador` só acha convite de coordenador
- [x] 2.5 — Rotas `POST /escolas/:id/convite-coordenacao` (devolve `conviteId` e `token`, `no-store`) e
  `POST /convites/:id/revogar` (204). Log `operacao.convite.gerado` e `.revogado`, só com ids
- [x] 2.6 — `ops:convite-coordenador` (por slug) e `ops:revogar-convite` pelo mesmo caso de uso; o
  docblock do primeiro diz que com convite em aberto ele recusa
- [x] 2.7 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/.../estado-da-coordenacao.ts` e o teste | novo |
| `packages/nucleo/drizzle/0015_convite_pendente_unico.sql`, `schema/convite.ts` | novo, alterado |
| `apps/api/src/sessao/convite.service.ts`, `convite.repository.ts`, `resolucao-de-tenant.repository.ts` | alterado |
| `apps/api/src/operacao/painel.controller.ts`, `painel.service.ts` | alterado |
| `packages/shared/src/operacao/painel.ts` | alterado |
| `apps/api/src/ops/convite-coordenador.ts`, `revogar-convite.ts` e testes | alterado |
| `apps/api/test/painel-convite.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| A4 | unidade | os sete estados, com a borda das 72 h e o usuário desativado antes e depois do aceite |
| E6 (gerar, revogar) | integração | cada estado × gerar e revogar dá o da matriz; o que não é permitido não grava; gerar em `aceito`/`sem_coordenacao` grava `convite.revogado` do anterior. As partes de login da E6 (o aceite anterior não ativa; o usuário reusado reativa) ficam na 4.0 |
| E7 | integração | escola inexistente: `NAO_ENCONTRADO`, sem conta nem usuário |
| E8 (sem refazer) | integração | dois gerar (e-mails diferentes e o mesmo), gerar e revogar em `aceito`, dois revogar (um 204, um `NAO_ENCONTRADO`, uma auditoria). A ordem é forçada: o teste segura `pg_advisory_lock(7_000_003, hashtext(escola))`, confere as duas chamadas em `wait_event = 'advisory'` e só então solta; sem a trava, terminam antes e o teste falha. No fim, no máximo um convite em aberto |
| E10 | integração | o mesmo e-mail em duas escolas, em paralelo: cada convite na sua, nada da outra na resposta; vermelho se a trava ou o contexto ficarem globais (uma espera a outra, ou um convite cai na escola errada) |
| E11, E13 (convite) | integração | autor desativado no gerar e no revogar; o comando com convite em aberto recusa; o `ops:revogar-convite` passa pelo mesmo caso de uso do painel |
| I7 | integração | escola `ativa` não grava nada; o alarme: inserir `tipo = 'professor'` falha com 23514 |
| A2, A3 (gerar, revogar) | integração | o token não aparece em coluna nem auditoria, e o `token_hash` é o SHA-256; log só com ids |

## Onde cada cenário está

- **A4:** `packages/nucleo/src/convite/estado-da-coordenacao.test.ts`.
- **E6 (gerar e revogar), E7, E8 (sem refazer), E10, E11 (gerar e revogar pelo painel), E12 (as duas rotas), E13, I7,
  A2 e A3:** `apps/api/test/painel-convite.int.test.ts`. Os estados são montados pelos caminhos de verdade (o gerar e o
  revogar do painel, o aceite da rota do convite); a coordenação desativada, por `update` no banco; o `vencido`, pelo
  caso de uso com o relógio 73 h atrás. A E11 pelo comando (`ops:convite-coordenador` e `ops:revogar-convite` esperando o `for
  share` do `OPERADOR`) já está em `painel-escrita.int.test.ts` (1.0) e continua valendo sobre o caso de uso novo.
- **O nome se corrige revogando e gerando com o mesmo e-mail** (seção 5): `usuarioConvidado` grava o nome digitado no
  usuário inativo reaproveitado, e nunca no ativo; E6 "o nome se corrige…" em `painel-convite.int.test.ts` e o teste do
  coordenador convidado em `convite.repository.int.test.ts`.
- **Isolamento do repository** (`dadosDaCoordenacao`, `revogado`) **e o `convite_pendente_unico`** (2.2, o 23505 como
  `CONFLITO`, sem a trava): `apps/api/src/sessao/convite.repository.int.test.ts`.
- **I3 com as duas rotas novas:** C36 e C41 (`arquitetura.test.ts`), C46 (`operacao-isolamento.int.test.ts`).
- **Contratos:** `packages/shared/src/operacao/painel.test.ts`.

## Divergências resolvidas nesta tarefa

- **O gerar não chama mais `revogarConvitesDoUsuario`** (o método saiu do `ConviteRepository`). Ele revogava em
  silêncio, sem auditoria, os convites do usuário antes de criar outro. Com a matriz, o gerar só cria em `sem_convite`,
  `revogado`, `aceito` e `sem_coordenacao`, e nos dois últimos revoga o último convite **com** `convite.revogado`
  (seção 5). Um convite em aberto que sobrasse (só dado de antes da trava) cai no `convite_pendente_unico`, que sai como
  `CONFLITO`: é a rede de segurança da 7c, e o `revogarConvitesDoUsuario` a esconderia.
- **Revogar convite que não é o último da escola:** `CONFLITO`, como o refazer (seção 5 só o diz do refazer). Antes
  disso, convite já revogado (e a escola em `revogado`) responde `NAO_ENCONTRADO`, como no F1: é o que o revogar perdedor
  do par "gerar e revogar em `aceito`" (E8) recebe quando o gerar vem primeiro. `sem_convite` × revogar não tem convite
  a passar: o id é inexistente, e a resposta é `NAO_ENCONTRADO`. Provado na E6 ("o convite anterior que o gerar já
  revogou…").
- **O `ops:revogar-convite` imprime `CONFLITO`** (código 1) quando a matriz recusa; antes só havia `NAO_ENCONTRADO`.
  E o texto do `CONFLITO` do `ops:convite-coordenador` passou a ser o da matriz ("a escola já tem coordenação ativa ou
  convite em aberto; revogue o convite antes de gerar outro"), e não mais "esta pessoa já é coordenadora ativa".
- **`:id` fora do formato de UUID** nas duas rotas responde `NAO_ENCONTRADO`, pelo `idDoCaminho` que a estrutura já
  usa (`apps/api/src/estrutura/entrada.ts`), importado sem copiar. O corpo do revogar é o vazio estrito do A0
  (`esquemaPedidoSemCorpoDeOperador`): campo a mais é 400.
- **`vencido` compara com a hora do banco** (`now()`, lida junto com o estado), a mesma régua do `expira_em > now()` do
  aceite, e não com o relógio da API.
- **O revogar devolve a escola do convite** (`{ escolaId }`), para o log `operacao.convite.revogado` sair com ela; o
  logger só leva os ids do contexto.
- **Testes do F1 ajustados à matriz:** em `convite.int.test.ts`, os quatro convites da "borda: expirado…" vão cada um
  para a sua escola, e o "coordenador desativado…" revoga o convite em aberto antes de gerar outro (e confere a recusa
  com ele em aberto); a lista de rotas com convite passa a ter as duas do painel. Em `convite-operador.int.test.ts`, o
  convite vai para uma escola sem coordenação ativa. Em `apps/worker/test/expurgo-de-acesso.int.test.ts`, cada convite
  em aberto semeado ganha um usuário só dele, e o reconvite revoga o vencido antes, como o refazer. Em
  `ops-escola.int.test.ts`, o gerar entra na lista conferida das rotas de escrita com `escolas` no caminho: ele não cria
  escola.
- **Dado local do banco de teste:** o banco do compose de teste tinha 64 convites em aberto repetidos por usuário,
  semeados pelo expurgo antes desta tarefa, e a migration falharia nele (risco já escrito na seção 13). Foram revogados
  à mão, só no banco de teste local; a esteira sobe o banco do zero.
- **Os auxiliares do teste do painel** (`pedir`, `esperarErro`, a API montada, o `desativar` segurado) saíram de
  `painel-escrita.int.test.ts` para `apps/api/test/painel-de-teste.ts`, que os dois arquivos usam. A API do teste do
  painel passa a subir com `MONTAGEM_DE_TESTE`, como a do convite, porque o aceite usa o Redis do login.

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --infra`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada válida
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Refazer (3.0); a trava na ativação e o login (4.0); a lista (5.0); telas.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-24 17:43:52 | 2026-09-24 17:46:17 | `test-engineer` | 1 | REPROVADO | aaf842b9afa02d182 |
| 2026-09-24 17:47:34 | 2026-09-24 17:48:07 | `test-engineer` | 2 | APROVADO | abdc9888bf2581425 |
| 2026-09-24 18:16:48 | 2026-09-24 18:18:12 | `privacy-guardian` | 1 | APROVADO | a5bf069449024dac1 |
| 2026-09-24 18:16:56 | 2026-09-24 18:18:16 | `infra-guardian` | 1 | APROVADO | a6174bb7a46c3bd94 |
| 2026-09-24 18:16:42 | 2026-09-24 18:18:16 | `tenancy-guardian` | 1 | APROVADO | a342f7e28075d5b9e |
| 2026-09-24 18:16:38 | 2026-09-24 18:19:35 | `revisor-geral` | 1 | REPROVADO | a58d0a5a9eb783bb2 |
| 2026-09-24 18:21:10 | 2026-09-24 18:21:53 | `test-engineer` | 3 | APROVADO | af3facd404fefef42 |
| 2026-09-24 18:50:38 | 2026-09-24 18:50:57 | `infra-guardian` | 2 | APROVADO | a742658ef281990d5 |
| 2026-09-24 18:50:22 | 2026-09-24 18:51:05 | `revisor-geral` | 2 | APROVADO | a86324794b819ca6b |
| 2026-09-24 18:50:29 | 2026-09-24 18:51:11 | `tenancy-guardian` | 2 | APROVADO | a9a0536431a11f8aa |
| 2026-09-24 18:50:34 | 2026-09-24 18:51:14 | `privacy-guardian` | 2 | APROVADO | a32ee6dac2ddb3e47 |
