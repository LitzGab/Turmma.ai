# Tarefa 8.0 — Coordenação monta o ano letivo, as séries, as disciplinas e as turmas

**Funcionalidade:** identidade-e-tenancy · **Depende de:** 2.0
**Subagentes obrigatórios:** `tenancy-guardian`, `test-engineer`

## Objetivo

A coordenação cria e abre o ano letivo, cria as séries do recorte (6º ao 9º ano e 1º ao 3º do
Ensino Médio), as disciplinas e as turmas do ano, pela API. Tudo fica preso à escola e ao ano,
e nenhuma referência alcança objeto de outra escola ou de outro ano.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF2 (estrutura e série só do recorte), RF15 (escopo da escola ativa e do ano em
  curso), RF17 (matriz); caso de borda "Virada de ano letivo"
- `techspec.md`:
  - seção 3: `ano_letivo`, `serie`, `disciplina`, `turma`, a regra das FKs compostas e a
    tabela de migrations (esta tarefa cria `serie`, `disciplina` e `turma`; `ano_letivo`
    nasceu na 2.0)
  - seção 4: rotas `/v1/anos-letivos`, `/:id/abrir`, `/:id/encerrar`, `/v1/series`,
    `/v1/disciplinas`, `/v1/turmas`
  - seção 5: "Requisição" (sem ano em curso, turma falha fechada; criar e abrir ano não
    dependem dele)
  - seção 6: testes de `anos-letivos/:id/abrir` e `/encerrar` com id de B, listagens sem B,
    `serie_id` de B e turma de outro ano
- `CLAUDE.md`, D43: o recorte das séries
- `.claude/rules/10-multitenancy.md`: itens 1 a 5 (escopo no repository, teste de isolamento
  que quebra sem a cláusula) e 6 (404 igual)
- `.claude/rules/60-dominio.md`, item 5: turma pertence a um ano letivo; item 1: vocabulário
  (`serie`, `turma`, `disciplina`, `ano_letivo`)
- `.claude/rules/00-arquitetura.md`, itens 2, 3 e 9: controller fino, repository único acesso
  ao banco, erro tipado
- Código existente:
  - `packages/nucleo/src/db/schema/configuracao-operacional-escola.ts`: padrão de schema
    Drizzle com check
  - `packages/nucleo/src/erro/mapear-erro-postgres.ts`: violação de unicidade vira `CONFLITO`
    sem o valor
  - `apps/api/src/sistema/sistema.module.ts`: padrão de módulo Nest com `com(...)`
  - criado na 1.0: tabela `escola`
  - criado na 2.0: `ano_letivo`, `@Permite`, `MATRIZ`, contexto com `anoLetivoId`, varredura
    de DTO

## Subtarefas

- [x] 8.1 — Migration de `serie`, `disciplina` e `turma`
  - toda tabela com `unique (escola_id, id)`; `turma` também com `unique (escola_id,
    ano_letivo_id, id)` para o vínculo da 9.0 referenciar
  - `serie`: `etapa` (`ef_anos_finais` | `em`) e `ano`, com check 6 a 9 para anos finais e
    1 a 3 para o Ensino Médio, e `unique (escola_id, etapa, ano)`
  - `disciplina`: `unique (escola_id, lower(nome))`
  - `turma`: FK composta `(escola_id, serie_id)` e `(escola_id, ano_letivo_id)`, `unique
    (escola_id, ano_letivo_id, lower(nome))`
- [x] 8.2 — Módulo `estrutura`, só coordenador (`@Permite`), com contratos zod e DTO explícito
  - `POST/GET /v1/anos-letivos`; `POST /:id/abrir` passa de `planejado` a `em_curso` (o
    índice único parcial garante um ano em curso por escola); `POST /:id/encerrar` passa a
    `encerrado`, sem virada de vínculo nesta tarefa
  - `POST/GET /v1/series`, `/v1/disciplinas` e `/v1/turmas`; turma só nasce no ano em curso,
    e ano encerrado não aceita turma nova
  - repositories com escola e ano do contexto, nunca do corpo; id que não é da escola do
    contexto responde `NAO_ENCONTRADO`
  - listagens paginadas
- [x] 8.3 — Testes (tabela abaixo)

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/db/schema/serie.ts`, `disciplina.ts`, `turma.ts`, migration em `packages/nucleo/drizzle/` | novo |
| `apps/api/src/estrutura/estrutura.module.ts` | novo |
| `apps/api/src/estrutura/ano-letivo.controller.ts`, `.service.ts`, `.repository.ts` | novo |
| `apps/api/src/estrutura/serie.*`, `disciplina.*`, `turma.*` (controller, service, repository) | novo |
| `apps/api/src/app.module.ts` | alterado |
| `packages/shared/src/estrutura/*.ts` (contratos zod) | novo |
| `packages/shared/src/permissao/matriz.ts` e arquivo de expectativa (células de estrutura) | alterado |
| `apps/api/test/estrutura.int.test.ts`, `apps/api/test/estrutura-isolamento.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: coordenação cria o ano, abre, cria "8º ano" e "1º EM", "Química" e a turma "2ºB", e as listagens trazem cada um | integração | RF2 |
| borda: "5º EF" e "4º EM" dão erro tipado; série duplicada dá `CONFLITO` sem o valor na resposta | integração | recorte da D43 garantido no banco |
| concorrência: dois `abrir` em paralelo, em anos diferentes da mesma escola, deixam um só em curso | integração (concorrência real) | índice único parcial, não "verifica e grava" |
| borda: "7ºA" em 2026 e em 2027 coexistem; "7ºA" e "7ºa" no mesmo ano conflitam | integração | turma pertence ao ano; virada de ano sem colisão |
| borda: turma nova em ano encerrado é recusada; escola sem ano em curso responde falha fechada em `/v1/turmas`, mas criar e abrir ano funcionam | integração | a escola começa do zero sem ficar travada |
| permissão: professor e aluno em POST `/v1/turmas`, `/v1/series` e `/v1/anos-letivos` são recusados | integração | `@Permite` só coordenador |
| isolamento: `serie_id` de B ao criar turma, turma apontando para ano de outro ano letivo, `abrir` e `encerrar` com id de B dão 404 igual ao inexistente e não mudam nada em B | integração | FK composta e escopo do repository; quebra sem a cláusula |
| isolamento: com linhas de B existentes, as listagens de anos, séries, disciplinas e turmas da coordenação de A não trazem nada de B | integração | escopo nas listagens |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [ ] Todos os revisores obrigatórios com rodada na seção "Revisões", iniciada depois da
  última alteração de código, e APROVADO nos que têm veto
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- Vínculo e acesso à turma pelo professor: 9.0
- Encerrar o ano levando vínculos a `fim_do_ano` e leitura de ano encerrado: 10.0
- Telas de estrutura: F2
- Grade horária e calendário: F2

## Notas da implementação

Leituras que tomei onde a tarefa deixava margem, escolhendo a que protege a escola e o aluno:

- **`turma.listar` na matriz.** A célula `turma.ler` do professor é `turma_vinculada` (para o `GET /v1/turmas/:id`
  da 9.0). Com `@Permite('turma', 'ler')` no `GET /v1/turmas`, o professor listaria todas as turmas da unidade. A
  listagem ganhou a ação `listar`, `unidade` só para a coordenação e `nunca` para os outros, na `MATRIZ` e no arquivo
  de expectativa. `turma.ler` fica como estava, para a 9.0.
- **`anoLetivoId` no corpo da turma só confere.** A turma nasce sempre no ano em curso do contexto (regra 10, item 3).
  Se o corpo traz um `anoLetivoId` que não é esse (planejado, encerrado, de outra escola, inexistente), a resposta é
  `NAO_ENCONTRADO` e nada nasce, em vez de a turma cair calada no ano em curso. É o caso "turma apontando para ano de
  outro ano letivo" da tabela de testes e da seção 6 da Tech Spec.
- **Ano encerrado na corrida.** A criação da turma trava o ano em curso em `FOR SHARE` na transação: o encerramento
  espera a turma, e a turma que chega depois do encerramento relê o ano já encerrado e é recusada.
- **`unique (escola_id, ano)` em `ano_letivo`.** Dois cliques em "criar 2027" fariam dois anos 2027 na escola; a
  restrição entrou na migration desta tarefa (regra 80, item 7). A Tech Spec, seção 3, foi atualizada.
- **Segundo clique.** `abrir` num ano já em curso e `encerrar` num já encerrado respondem o ano como está (200).
  Encerrado não reabre e planejado nunca aberto não se encerra: `CONFLITO`.
- **Campos opcionais.** `disciplina.area` (área da BNCC) e `turma.turno` (`manha`, `tarde`, `noite`, `integral`) são
  opcionais, com check no banco. Nenhum é dado de pessoa: `docs/lgpd.md` não muda.
- **Paginação.** Por chave: `?pagina=<id>&limite=` (padrão 50, máximo 100), resposta `{ itens, proxima? }`, ordem de
  id (UUIDv7, a de criação).
- **Escopo do repository.** `exigirEscolaDoContexto()` entrou em `@educa/nucleo` ao lado de `exigirAnoEmCurso()`; os
  repositories novos usam ele. As seis cópias locais de `escolaDoContexto` em outros módulos ficam como estão (fora do
  escopo).
- **Isolamento da listagem de turmas.** O filtro é escola e ano em curso do contexto. Como o id do ano é da escola,
  tirar só a cláusula de escola não traria turma de B; o teste que quebra é o de tirar a do ano (a listagem de 2027
  traria o "7ºA" de 2026).

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-18 10:01:58 | 2026-09-18 10:03:10 | `test-engineer` | 1 | REPROVADO | a090dcb2ce14044ba |
| 2026-09-18 10:09:02 | 2026-09-18 10:09:26 | `test-engineer` | 2 | APROVADO | a7bc05bc67f3edc9c |
| 2026-09-18 10:14:41 | 2026-09-18 10:15:28 | `tenancy-guardian` | 1 | APROVADO | a5e0a5dfb289f293f |
| 2026-09-18 10:14:34 | 2026-09-18 10:15:30 | `revisor-geral` | 1 | APROVADO | a1fb5bc84854b5b3e |
