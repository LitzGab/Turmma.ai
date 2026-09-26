# Tarefa 5.0 — Aluno abre a turma pelo link ou pelo código

**Funcionalidade:** apresentacao-escola · **Depende de:** 4.0 · **Paralelo com:** 3.0, 11.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Sem login, com o slug da escola e o token do link ou o código, o aluno vê o nome da turma e os nomes livres dela, sem
matrícula; tudo que não é um acesso vigente da escola do slug, no ano em curso, responde o mesmo `NAO_ENCONTRADO`.

## Contexto necessário

- `docs/visao-produto.md`; `docs/lgpd.md`, linhas "Lista de nomes da turma" e a do IP (`salas/*` no `rl:ip`)
- `techspec.md` seções 4 (`salas/abrir` e "Uma resposta só"), 6 (o `AcessoDaSala`), 7 ("Registro de acesso",
  DTO) e 7c (`rl:ip`)
- `cenarios.md`: I1, I2, E17, E26, E28, V2, e a parte de `salas/abrir` de I4, R1, P5, L10, A6, A7
- Regras 10 (item 9), 20 (itens 4, 6), 40, 80 (item 1)
- Código:
  - `apps/api/src/sessao/resolucao-de-tenant.repository.ts` e o teste da lista fechada
    (`resolucao-de-tenant.repository.test.ts`) — o formato do `@SemEscopo` com a justificativa
  - `apps/api/test/arquitetura.test.ts` — o I1 passa **sem mudar uma linha**
  - `apps/api/src/sessao/acesso-publico.repository.ts` e `acesso-da-escola.controller.ts` — a rota pública de
    `/e/:slug`, que já abre o contexto pelo slug
  - `packages/nucleo/src/limite/rota-anonima.decorator.ts` e `apps/api/test/limite.int.test.ts`
    (`LIMITE_REQ_IP_ANONIMO_MIN`)
  - `apps/api/src/sessao/registro-de-acesso.repository.ts` — que o `sala` não chama (A6)

## Subtarefas

- [ ] 5.1 — `acessoDaSalaPorToken` e `acessoDaSalaPorCodigo` na `ResolucaoDeTenantRepository`, com `@SemEscopo` ("o
  link e o código da sala não dizem a escola"): só acesso não revogado, com `expira_em > now()`, ano `em_curso`, e
  a escola igual à do slug (o código é buscado já com a escola do slug; o token, conferido contra ela)
- [ ] 5.2 — `AcessoDaSala` em `apps/api/src/sessao`, exportado para o `sala`, devolvendo só escola, ano e turma
- [ ] 5.3 — `POST salas/abrir` com `@RotaAnonima`: contrato `.strict()` `{ slug, token | codigo }`,
  `Cache-Control: no-store`, nenhum cookie lido, nenhum `registro_acesso`; responde o nome da turma e os nomes
  livres com `id` e `nome`, lidos a cada abertura
- [ ] 5.4 — Documento: a tabela de `@SemEscopo` de `docs/modelo-de-dados.md` ganha os dois métodos, com a
  justificativa e o motivo de ficarem em `sessao`
- [ ] 5.5 — Testes; a rota entra na varredura do A3 e do A4 em `escola-montada.int.test.ts`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sessao/resolucao-de-tenant.repository.ts`, `resolucao-de-tenant.repository.test.ts` | alterado |
| `apps/api/src/sessao/acesso-da-sala.ts`, `sessao.module.ts` | novo, alterado |
| `apps/api/src/sala/salas.controller.ts`, `salas.service.ts`, `lista-livre.repository.ts`, `sala.module.ts` | novo, alterado |
| `packages/shared/src/sala/salas.ts` | novo |
| `apps/api/test/salas-abrir.int.test.ts`, `escola-montada.int.test.ts` | novo, alterado |
| `docs/modelo-de-dados.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| I1 | arquitetura | o teste do F1 passa sem mudar: só `sessao` importa a resolução, e o `sala` só o `AcessoDaSala` |
| I2 | unidade | a lista fechada ganha exatamente os dois métodos, com a justificativa |
| I4, R1 (abrir) | integração | código e token de B com o slug de A; inexistente, vencido, revogado, de ano encerrado, de turma excluída, de outra escola, slug inexistente: corpo byte a byte igual |
| E17, E26 | integração | só nomes livres, `id` e `nome`, sem matrícula; o avulso aparece no link vigente |
| E28, V2 | integração | relógio além do `expira_em`; ano posto em `encerrado` sem revogar: `NAO_ENCONTRADO` |
| P5 (abrir) | integração | `escolaId`, `turmaId` ou campo a mais: 400, sem gravar |
| L10 (abrir) | integração | acima do `rl:ip` anônimo, 429 `LIMITE_EXCEDIDO` com `Retry-After` |
| A6, A7 (abrir) | integração | nenhum `registro_acesso`; `Cache-Control: no-store` |
| concorrência | — | não se aplica: a rota só lê |
| log novo | integração | só ids: nada de slug, token, código nem nome (A4) |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Reivindicar (6.0); o contador de código errado por escola e a espera de 1 s (7.0); a página pública (17.0); o
`rl:ip:sala` próprio, que fica para o F2 (Tech Spec, 7c).

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
