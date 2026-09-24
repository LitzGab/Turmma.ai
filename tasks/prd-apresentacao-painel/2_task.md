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

- [ ] 2.1 — `estadoDaCoordenacao` em `packages/nucleo` (função pura): os sete estados da seção 5
- [ ] 2.2 — Migration do índice único parcial `convite_pendente_unico (escola_id, usuario_id) where
  usado_em is null and revogado_em is null`; 23505 dele vira `CONFLITO`
- [ ] 2.3 — `ConviteRepository`: `travarEscola()` (`pg_advisory_xact_lock(7_000_003,
  hashtext(escola_id::text))`, a escola do contexto) e `dadosDaCoordenacao()` para o estado, só convite
  `tipo = 'coordenador'`
- [ ] 2.4 — Caso de uso: gerar por `escolaId` e revogar, cada um numa transação que começa pelo autor
  (1.0), pega a trava e só então lê o estado; a matriz e o parágrafo seguinte da seção 5 decidem.
  `escolaDoConviteParaOperador` só acha convite de coordenador
- [ ] 2.5 — Rotas `POST /escolas/:id/convite-coordenacao` (devolve `conviteId` e `token`, `no-store`) e
  `POST /convites/:id/revogar` (204). Log `operacao.convite.gerado` e `.revogado`, só com ids
- [ ] 2.6 — `ops:convite-coordenador` (por slug) e `ops:revogar-convite` pelo mesmo caso de uso; o
  docblock do primeiro diz que com convite em aberto ele recusa
- [ ] 2.7 — Testes

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

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --infra`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada válida
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Refazer (3.0); a trava na ativação e o login (4.0); a lista (5.0); telas.
