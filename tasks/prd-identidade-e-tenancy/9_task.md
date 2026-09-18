# Tarefa 9.0 — Vínculo confirmado é o que dá acesso à turma e aos alunos

**Funcionalidade:** identidade-e-tenancy · **Depende de:** 8.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `test-engineer`

## Objetivo

A coordenação cria o vínculo professor × turma × disciplina, que nasce pendente. O professor
confirma ou contesta cada um. Só o vínculo confirmado dá acesso à turma e à lista de alunos, e
o encerramento corta o acesso já na requisição seguinte.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF3 (vínculo nasce pendente, professor não cria), RF4 (confirmar ou contestar
  cada um), RF5 (pendente, contestado ou encerrado não dá acesso; corte na requisição
  seguinte), RF15, RF19 (vínculo registrado); casos de borda "Professor discorda de uma
  alocação", "Turma sem professor alocado", "Professor com duas disciplinas na mesma turma",
  "Professor sai em março de uma das duas escolas"
- `techspec.md`:
  - seção 3: `vinculo` (estados, `contestacao`, `complemento`, `motivo_encerramento`, índice
    único parcial, FK composta `(escola_id, ano_letivo_id, turma_id)`); esta tarefa cria a
    tabela
  - seção 4: `/v1/vinculos`, `/:id/encerrar`, `/v1/meus-vinculos`, `/:id/confirmar`,
    `/:id/contestar`, `/v1/turmas/:id` e `/:id/alunos` com o DTO de cada uma
  - seção 5: "Vínculo" e "Requisição" (sem ano em curso, vínculo falha fechado)
  - seção 6: testes com `turma_id`, `usuario_id` e `disciplina_id` de B, `vinculos/:id/*`,
    listagens e `meus-vinculos`
  - seção 7: `complemento` só para a coordenação e nunca em log nem em auditoria; auditoria
    da leitura de `/alunos` pela coordenação, com finalidade
- `docs/fluxos.md`, fluxo 1: o vínculo vem da escola, e o professor só confirma
- `.claude/rules/60-dominio.md`, item 8a: vínculo autodeclarado não dá acesso a aluno
- `.claude/rules/10-multitenancy.md`, itens 3 a 6: autorização por objeto, não só por rota
- `.claude/rules/20-lgpd-menores.md`, itens 4, 5, 9 e 10: DTO explícito, objeto a objeto,
  log só com id, leitura de dado de aluno pela coordenação vai para auditoria
- `.claude/rules/80-infra-e-carga.md`, itens 7 e 8: clique duplo resolvido no banco; índice
  que começa pela escola; listagem paginada
- `docs/lgpd.md`, seção 2: linhas "Vínculo, estado e datas" e "Motivo de contestação"
- Código existente:
  - `packages/nucleo/src/erro/mapear-erro-postgres.ts`
  - criado na 1.0: `RegistroDeAuditoria` com schema fechado por ação (acrescente as ações de
    vínculo e de leitura de alunos sem `complemento`)
  - criado na 2.0: `@Permite`, `MATRIZ`, contexto com `usuarioId`, `papel`, `anoLetivoId`;
    varredura de DTO
  - criado na 8.0: módulo `estrutura`, `turma`, `disciplina`
  - seed de teste com professores e alunos: criado na 2.0 e na 3.0 (`ops:sessao-sintetica`)

## Subtarefas

- [x] 9.1 — Migration de `vinculo` e rotas
  - `POST /v1/vinculos` (coordenador): `{ usuarioId, turmaId, disciplinaId?, papel }`, nasce
    `pendente` com `criado_por`; alunos continuam vindo do seed no F1
  - `GET /v1/vinculos?estado` (coordenador), inclusive `contestado`, com `complemento`
  - `POST /v1/vinculos/:id/encerrar` (coordenador): `{ motivo }` em `desligamento` ou
    `realocacao` (o `fim_do_ano` é só da virada, na 10.0)
  - `GET /v1/meus-vinculos` (professor): só os do usuário do contexto, sem `complemento`
  - `POST /:id/confirmar` e `/:id/contestar { contestacao, complemento? }` (professor dono):
    `update … where id = $1 and usuario_id = ctx and estado in ('pendente','contestado')`,
    com auditoria na mesma transação; `complemento` até 140 caracteres
- [x] 9.2 — Acesso à turma
  - `GET /v1/turmas/:id`: coordenação da escola, ou professor com vínculo `confirmado` naquela
    turma no ano em curso, juntando `vinculo` no repository
  - `GET /v1/turmas/:id/alunos?pagina`: mesmo critério; `finalidade` obrigatória para a
    coordenação, com auditoria da leitura; devolve `{ itens:[{usuarioId, nome}], proxima? }`
  - qualquer caso sem acesso responde `NAO_ENCONTRADO`
- [x] 9.3 — Testes (tabela abaixo)

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/db/schema/vinculo.ts`, migration em `packages/nucleo/drizzle/` | novo |
| `apps/api/src/estrutura/vinculo.controller.ts`, `vinculo.service.ts`, `vinculo.repository.ts` | novo |
| `apps/api/src/estrutura/turma.controller.ts`, `turma.repository.ts` (leitura com vínculo, alunos) | alterado |
| `packages/nucleo/src/auditoria/acoes.ts` (ações de vínculo e leitura de alunos) | alterado |
| `packages/shared/src/estrutura/vinculo.ts`, `turma.ts` | novo e alterado |
| `packages/shared/src/permissao/matriz.ts` e arquivo de expectativa | alterado |
| `apps/api/test/vinculo.int.test.ts`, `apps/api/test/turma-acesso.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: professor com Química e Física no 2ºB confirma uma e contesta a outra; cada vínculo fica no seu estado, com autor e data | integração | RF3 e RF4; estados independentes |
| borda: com vínculo `pendente` e com `contestado`, `/turmas/:id` e `/alunos` dão 404 igual a turma inexistente; confirmado, respondem com dado | integração | RF5; quebra se o repository não juntar o vínculo confirmado |
| borda: vínculo encerrado com a sessão aberta; a requisição seguinte a `/turmas/:id` já dá 404 | integração | corte sem esperar a sessão vencer |
| concorrência: clique duplo em confirmar (dois POST paralelos) faz um `update` e uma auditoria | integração (concorrência real) | `update` condicional |
| concorrência: o mesmo vínculo criado duas vezes em paralelo resulta em um só | integração | índice único parcial |
| permissão: turma sem professor; a coordenação lê, o professor de outra turma dá 404; professor em POST `/v1/vinculos` e confirmando vínculo de colega é recusado | integração | vínculo é da escola, e o professor só confirma o próprio |
| privacidade: `/alunos` da coordenação sem `finalidade` dá `ENTRADA_INVALIDA`; com ela, grava auditoria e pagina; o professor não recebe `complemento` em `meus-vinculos`; auditoria e log de contestação não contêm o `complemento` | integração | regra 20, itens 4, 9 e 10 |
| isolamento: criar vínculo com `turma_id`, `usuario_id` ou `disciplina_id` de B dá 404; `vinculos/:id/*` e `turmas/:id` com id de B dão 404; com linhas de B existentes, `GET /v1/vinculos` de A e `meus-vinculos` do professor com A ativa não trazem nada de B | integração | FK composta e escopo; quebra sem a cláusula |
| isolamento: professor que sai em março da escola A (vínculo `desligamento`) perde a turma de A e continua lendo a turma da escola B onde tem vínculo confirmado | integração | caso de borda do PRD |

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

- Encerrar o ano com vínculos em `fim_do_ano`, apagar `complemento` e leitura de ano
  encerrado (`?anoLetivoId`): 10.0
- Tela `/vinculos`: 20.0
- Aviso à coordenação sobre contestação por notificação: F13 (no F1 ela lista por estado)
- Criação de vínculo de aluno por lista ou reivindicação: F2
- Troca de escola do professor: 12.0

## Notas da implementação

Leituras que tomei onde a tarefa deixava margem, escolhendo a que protege a escola e o aluno:

- **`papel` no `POST /v1/vinculos` aceita só `professor` no F1.** A coluna aceita `professor` e `aluno`, mas o vínculo
  de aluno criado pela coordenação nasceria pendente sem ninguém que o confirme (o aluno não confirma vínculo), e a
  entrada do aluno é o fluxo do F2. `aluno` no corpo dá `ENTRADA_INVALIDA`. A pessoa precisa ser da escola, estar ativa
  e ter o papel do vínculo: o `usuario` de coordenador ou de aluno não recebe vínculo de professor (404).
- **DTO da coordenação.** Além do DTO da Tech Spec, a coordenação recebe `usuarioId` (sem nome), `papel`,
  `complemento?` e `motivoEncerramento?`: sem saber de quem é, a lista de contestados não serve para corrigir a
  alocação. O professor nunca recebe `complemento`. Tech Spec, seção 4, atualizada.
- **Confirmar depois de contestar** apaga o código e o `complemento`: a contestação deixou de valer, e o texto livre não
  fica guardado sem motivo. Contestar de novo um contestado troca o código (`estado in ('pendente','contestado')`).
- **Segundo clique.** Confirmar o que já está confirmado e encerrar o que já está encerrado respondem o vínculo como
  está, sem `update` nem auditoria: o `select … for update` faz o segundo esperar o primeiro e reler. Contestar um
  confirmado e decidir um encerrado dão `CONFLITO`. O repetido na criação dá `CONFLITO` pelo índice único parcial.
- **Índice único com disciplina ausente.** No índice comum dois nulos não colidem; a disciplina entra como
  `coalesce(disciplina_id, '0000…'::uuid)`, e o vínculo sem disciplina também não se repete.
- **Finalidade da leitura de alunos.** Códigos fixos em `FINALIDADES_DA_LEITURA_DE_ALUNOS`
  (`acompanhamento_pedagogico`, `atendimento_a_familia`, `conferencia_de_cadastro`), conferidos antes de procurar a
  turma: a falta dela responde igual para qualquer id. A auditoria `turma.alunos_lidos` leva a turma, a quantidade e a
  finalidade, na mesma transação da leitura; o professor com vínculo confirmado lê sem finalidade e sem registro.
- **Alcance pela `MATRIZ`.** `GET /v1/turmas/:id` e `/alunos` decidem o critério pela célula do papel: `unidade` e
  `nominal_auditado` (coordenação) leem a turma do ano em curso; `turma_vinculada` (professor) só com vínculo de
  professor `confirmado`, lido a cada requisição. A matriz e o arquivo de expectativa não mudaram: as células já
  existiam desde a 2.0.
- **Teste de isolamento que quebra sem a cláusula de escola.** Como na 8.0, o ano em curso do contexto é da escola, e
  tirar só a cláusula de escola das consultas não traria linha de B pela API. Por isso há um teste de repository com
  contexto forjado (escola A, ano e professor de B): só a cláusula de escola separa, e tirá-la de `aberta`, `alunos`,
  do escopo do `VinculoRepository` ou de `pessoaAtivaComPapel` deixa o teste vermelho (conferido à mão).
- **Sem ano em curso**, criar, listar, `meus-vinculos`, confirmar, contestar, encerrar e ler turma falham fechados com
  `NAO_ENCONTRADO`. A criação trava o ano em `FOR SHARE`, como a turma.
- **Log.** O serviço registra só o nome do evento (`vinculo.criado`, `.confirmado`, `.contestado`, `.encerrado`); escola,
  usuário e requisição vêm do contexto. O teste de privacidade lê o log real e a auditoria e não acha o complemento.
- **Arquivos fora da lista prevista:** `apps/api/test/escola-com-turma.ts` (a escola montada e os alunos do seed, usados
  pelos dois arquivos de teste), `api-com-sessao.ts` (captura de log opcional) e `sessao-de-teste.ts` (apaga o vínculo
  antes da turma). `docs/lgpd.md` já tinha as linhas de vínculo e contestação.

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-18 10:37:22 | 2026-09-18 10:38:50 | `test-engineer` | 1 | REPROVADO | abed04bf1317ce17e |
| 2026-09-18 10:47:57 | 2026-09-18 10:48:22 | `test-engineer` | 2 | APROVADO | a280c758c82896d11 |
| 2026-09-18 10:48:40 | 2026-09-18 10:49:30 | `revisor-geral` | 1 | APROVADO | a4f7024e9ca3eccdd |
| 2026-09-18 10:48:47 | 2026-09-18 10:49:31 | `tenancy-guardian` | 1 | APROVADO | add752ffd9647a972 |
| 2026-09-18 10:48:53 | 2026-09-18 10:50:06 | `privacy-guardian` | 1 | APROVADO | a83e861d15e7b663f |
