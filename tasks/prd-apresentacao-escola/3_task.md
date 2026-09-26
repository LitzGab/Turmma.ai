# Tarefa 3.0 — Professor cadastrado pela coordenação, com convite de cópia única de 7 dias e aceite sem segundo fator

**Funcionalidade:** apresentacao-escola · **Depende de:** nenhuma · **Paralelo com:** 1.0, 2.0, 4.0, 11.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A coordenação cadastra o professor e recebe, uma vez, o link do convite de 7 dias; refaz e revoga só convite de
professor; o professor aceita pelas rotas de convite que já existem, com a conta de outra escola ou criando a senha,
sem segundo fator.

## Contexto necessário

- `docs/visao-produto.md`; `docs/lgpd.md`, linha "Convite de professor"
- `techspec.md` seções 3 (a migration 0018 e o parágrafo do rollback), 4 (professores), 5 (passo 1), 7 (auditoria),
  11 (regra 10: a conta global, quarto afrouxamento da D71) e 13 (conta global)
- `cenarios.md`: E8 a E11, R4, C7, I7, A1, I3, P1, I9
- Regras 10, 20 (item 8), 40, 80 (item 7)
- `tasks/prd-apresentacao-painel/achados/indice.md`, 2.0 e 3.0: o nome reaproveitado, o filtro `tipo` no `where`
- Código:
  - `apps/api/src/sessao/convite.service.ts` — gerar, refazer e revogar da coordenação (A0b): o cadastro reaproveita
    o corpo, sem copiar
  - `apps/api/src/sessao/convite.repository.ts` (`usuarioConvidado`, `travarEscola`, `revogarParaRefazer`) e
    `resolucao-de-tenant.repository.ts` (`contaParaConvite`, `conviteValidoPorHash`, `escolaDoConviteParaOperador`)
  - `apps/api/src/sessao/login.service.ts:195` — onde o `coordenador` leva ao segundo fator
  - `VALIDADE_DO_CONVITE_HORAS` em `packages/shared/src/sessao/convite.ts`
  - `apps/api/test/painel-convite.int.test.ts` — o alarme da A0b (`tipo = 'professor'` dá 23514), que sai
  - `apps/api/test/trava-da-escola.ts` — forçar a ordem no C7

## Subtarefas

- [ ] 3.1 — Migration 0018: o check de `convite.tipo` aceita `professor`. A validade passa a depender do tipo (7 dias
  e 72 h), num lugar só em `packages/shared`
- [ ] 3.2 — `POST professores`: `contaParaConvite`, `usuarioConvidado(papel: professor)` e o convite sob
  `travarEscola`; devolve o link uma vez, `no-store`. `GET professores` sem link, token nem nada que diga se a conta
  era nova. Auditoria `professor.cadastrado` sem `contaNova`; `convite.criado` com o tipo
- [ ] 3.3 — `POST professores/:usuarioId/convite/{refazer,revogar}`: só convite `tipo = 'professor'`; os da operação
  continuam só `coordenador` (os dois lados com o filtro no `where`)
- [ ] 3.4 — O aceite do professor não pede segundo fator; o do coordenador continua pedindo
- [ ] 3.5 — Contratos `.strict()`, células da `MATRIZ`, módulo `apps/api/src/professores`
- [ ] 3.6 — Documento: em `docs/modelo-de-dados.md`, `Convite` com `tipo (coordenador | professor)` e o convite de
  professor reusando a conta global; a frase "os tipos `professor` e `sala` entram no F2" sai
- [ ] 3.7 — Testes; as rotas novas entram em `escola-montada.int.test.ts` e em `matriz.test.ts`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo`: `drizzle/0018_convite_professor.sql`, `schema/convite.ts`, `auditoria/acoes.ts` | novo, alterado |
| `apps/api/src/professores/*`; `packages/shared/src/professores/professores.ts` | novo |
| `apps/api/src/sessao/convite.*`, `resolucao-de-tenant.repository.ts`, `login.service.ts` | alterado |
| `apps/api/test/professores.int.test.ts`; `painel-convite.int.test.ts`, `escola-montada.int.test.ts`, `matriz*.ts`, `docs/modelo-de-dados.md` | novo, alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| E8, E9 | integração | link uma vez; refazer e revogar derrubam o anterior; 6º dia vale, depois de 7 cai; o de coordenador cai em 72 h |
| E10, E11 | integração | a conta de A aceita em B sem conta nova; a lista e a auditoria iguais para conta nova e existente |
| R4 | integração | usado, vencido, revogado, refeito e inexistente: a mesma resposta em `consultar` e `aceitar` |
| I7 | integração | refazer e revogar da operação com id de convite de professor, e os da coordenação com o de coordenador: `NAO_ENCONTRADO`, nada gravado |
| segundo fator | integração | o professor aceita e entra sem segundo fator; o coordenador, no mesmo fluxo, cai em `configurar_mfa` |
| A1, I3, P1, I9 (professores) | integração, unidade | auditoria com o tipo; escola B; professor e aluno recebem 404; células |
| C7 | integração, em paralelo | dois cadastros do mesmo e-mail e cadastrar × refazer, com `Promise.all`: um convite em aberto no fim |
| log novo | integração | só ids: nada de nome, e-mail nem token (A4) |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

E-mail; a alocação (F1); as telas (14.0); o expurgo (10.0); a prova de posse do e-mail ("Portão da primeira escola
real").

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
