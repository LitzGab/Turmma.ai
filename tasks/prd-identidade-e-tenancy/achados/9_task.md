# Achados das revisões — `tasks/prd-identidade-e-tenancy/9_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-18 10:38:50 · `tasks/prd-identidade-e-tenancy/9_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- Caminho feliz: um professor com Química e Física no 2ºB confirma uma e contesta a outra.
- Com vínculo pendente ou contestado, a turma e `/alunos` dão 404 igual ao inexistente. Com vínculo confirmado, respondem com o dado.
- Vínculo encerrado com a sessão aberta.
- Clique duplo em confirmar, com as duas chamadas em paralelo.
- O mesmo vínculo criado duas vezes em paralelo.
- Permissões: turma sem professor, professor de outra turma, professor criando vínculo, professor confirmando o vínculo de um colega.
- Privacidade: `finalidade` obrigatória com auditoria e paginação, e o `complemento` fora de `meus-vinculos`, da auditoria e do log.
- Isolamento: ids de B na criação, em `vinculos/:id/*` e em `turmas/:id`, e as listagens sem nada de B.
- Professor que sai em março da escola A.
- Casos de borda do domínio que valem aqui: professor com duas disciplinas na mesma turma, turma sem professor, aluno transferido no meio do bimestre (vínculo de aluno encerrado não aparece mais na turma).

**Cobertos** (rodei os dois arquivos: 23/23 verdes):
- Caminho feliz, com estado, autor, data e auditoria de cada vínculo: `vinculo.int.test.ts:76`.
- Pendente e contestado dão o mesmo 404 do inexistente, e o confirmado responde: `turma-acesso.int.test.ts:59`. O teste quebraria sem o `exists` e sem o filtro de estado. O filtro de papel é provado em `:107`.
- Corte na requisição seguinte com o mesmo token: `turma-acesso.int.test.ts:90`.
- Clique duplo em confirmar com `Promise.all`: `vinculo.int.test.ts:196`. Sem o `FOR UPDATE`, o segundo pedido daria 409, e sem o `update` condicional haveria duas auditorias. Nos dois casos o teste fica vermelho.
- Clique duplo em encerrar, em paralelo: `vinculo.int.test.ts:257`.
- Criação em paralelo, com e sem disciplina (o `coalesce` do índice): `vinculo.int.test.ts:210`.
- Permissões: `vinculo.int.test.ts:318` e `:343`, e `turma-acesso.int.test.ts:121`.
- Privacidade:
  - `finalidade` com auditoria e paginação: `turma-acesso.int.test.ts:141`.
  - `complemento` fora de `meus-vinculos`: `vinculo.int.test.ts:165`.
  - `complemento` fora do log real e da auditoria: `vinculo.int.test.ts:360`. O log passa pelo `LoggerDoNest`, então a captura é real.
- Isolamento:
  - Pela API: `turma-acesso.int.test.ts:205`, `:231` e `:255`.
  - Repository com contexto forjado e um controle positivo: `turma-acesso.int.test.ts:264`.
  - FKs compostas no banco: `turma-acesso.int.test.ts:320`.
- Saída em março: `turma-acesso.int.test.ts:352`.
- Sem ano em curso, em criar, listar e `meus-vinculos`: `vinculo.int.test.ts:305`.
- Não há `.skip`, `.only`, teste comentado nem mock de código nosso. A tarefa não chama IA.

**Bloqueantes:**

1. **O filtro de turma na lista de alunos não tem teste. É vazamento de aluno para professor de outra turma** (regra 20, item 5; regra 10, item 5).
   - `apps/api/src/estrutura/turma.repository.ts:124` (`eq(vinculo.turmaId, turmaId)`): se essa cláusula for apagada, todos os testes continuam verdes.
   - Em nenhum teste existem alunos em duas turmas da mesma escola ao mesmo tempo:
     - `turma-acesso.int.test.ts:61`, `:143` e `:185` põem alunos só no 2ºB.
     - `:123` põe alunos só no 2ºC.
   - Sem essa cláusula, o professor confirmado no 2ºB receberia os alunos do 2ºC, e o teste não perceberia.
   - Correção exigida: num teste de `/alunos`, pôr alunos no 2ºB e no 2ºC. Depois, afirmar a lista exata em dois casos:
     - para o professor confirmado no 2ºB;
     - para a coordenação lendo o 2ºC.
   - Nenhum aluno da outra turma pode aparecer.

2. **O filtro de estado do vínculo de aluno não tem teste. É o caso do aluno transferido no meio do bimestre** (caso de borda do domínio; regra 20, item 18).
   - `apps/api/src/estrutura/turma.repository.ts:126` (`eq(vinculo.estado, 'confirmado')`): se essa cláusula for apagada, todos os testes continuam verdes.
   - O helper `escola-com-turma.ts:46` só cria vínculo de aluno `confirmado`.
   - O teste de `turma-acesso.int.test.ts:144` cobre só o usuário desativado. Ele não cobre o vínculo encerrado com o usuário ativo, que é a transferência de turma dentro da mesma escola.
   - Correção exigida: acrescentar um aluno ativo com vínculo `encerrado` (motivo `realocacao`) e outro com vínculo `pendente` na turma. Afirmar que nenhum dos dois aparece em `/alunos`, nem para a coordenação nem para o professor confirmado.

**Recomendações** (não bloqueiam):
- Sem ano em curso, as rotas de ler a turma, `/alunos`, confirmar, contestar e encerrar não têm teste. As notas da implementação dizem que todas falham fechadas, mas o teste de `vinculo.int.test.ts:305` cobre só criar, listar e `meus-vinculos`.
- Esse mesmo teste afirma só o status. Vale conferir também o código `NAO_ENCONTRADO`, como os outros testes fazem.
- Clique duplo em contestar gera duas escritas e duas auditorias, porque contestar de novo um contestado é permitido. Vale decidir se isso é o esperado e cobrir com duas chamadas em paralelo.
- A paginação de `GET /v1/vinculos` da coordenação não tem teste. Só a de `meus-vinculos` e a de `/alunos` têm.
- Falta um caso explícito de professor com duas disciplinas em que uma é encerrada e a outra continua confirmada. O esperado é que ele continue lendo a turma.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/vinculo.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/turma-acesso.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-com-turma.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0010_vinculo.sql`

## revisor-geral · 1ª rodada · APROVADO · 2026-09-18 10:49:30 · `tasks/prd-identidade-e-tenancy/9_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, test)")
Bloqueantes: nenhum

Nada bloqueia. As subtarefas 9.1 a 9.3 estão feitas e cada cenário da tabela de testes tem um teste. Não há `.skip`, `TODO` nem `any` para calar o compilador. O que a tarefa manda para depois ficou de fora: `fim_do_ano` e `?anoLetivoId` são da 10.0, a tela é da 20.0.

A Tech Spec diverge da seção 4 em dois pontos, e nenhum foi decidido em silêncio. A seção foi alterada na mesma árvore e a mudança está justificada em "Notas da implementação":
- a coordenação recebe também `usuarioId`, `papel`, `complemento?` e `motivoEncerramento?`;
- `papel` aceita só `professor` no F1;
- a `finalidade` da leitura de alunos vira uma lista fixa de códigos.

Recomendações:
- **Duas formas de ler a entrada.** A nova `lerEntrada` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/entrada.ts`) faz o mesmo que o `safeParse` escrito à mão em `turma.controller.ts` (`criar`) e que `lerConsultaPaginada`. Vale deixar um jeito só no módulo `estrutura`, fazendo `criar` e `lerConsultaPaginada` usarem `lerEntrada`.
- **`alcanceDe` chamado duas vezes.** Em `TurmaService.alunos` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.service.ts`), ele é chamado direto (`nominalAuditado`) e de novo dentro de `alcanceDaTurma`. Tirar as duas coisas de uma única leitura da célula deixa o critério mais fácil de ler.
- **Enum de auditoria largo demais.** Em `vinculo.encerrado` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/auditoria/acoes.ts`), `antes.estado` aceita `ESTADOS_DE_VINCULO` inteiro, mas `encerrado` nunca chega ali. Um enum sem esse valor fecha melhor o que a ação registra.
- **Contestar duas vezes grava duas auditorias.** Contestar de novo um vínculo já contestado grava outra auditoria `contestado → contestado`. É o comportamento descrito nas notas; só confirme que é o desejado para o histórico da coordenação.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-18 10:49:31 · `tasks/prd-identidade-e-tenancy/9_task.md`

VEREDITO: APROVADO

Tabelas verificadas:
- `vinculo`, em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0010_vinculo.sql` e `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/vinculo.ts`.
  - Tem `escola_id` e `ano_letivo_id`, os dois obrigatórios.
  - O id é UUID (`uuidv7()`).
  - Todas as FKs compostas levam a escola: turma por `(escola_id, ano_letivo_id, turma_id)`, e usuário, disciplina e `criado_por` por `(escola_id, …)`.
  - O índice único parcial e os dois índices começam por `escola_id, ano_letivo_id`.
  - A FK de disciplina é composta e anulável, e assim não é conferida quando a disciplina é nula. Não há buraco: a disciplina nula não aponta para outra escola.

Queries verificadas:
- `VinculoRepository`: `criar`, `pessoaAtivaComPapel`, `listar`, `listarDoUsuario`, `porId`, `porIdDoUsuario`, `travar`, `decidir`, `encerrar` e `#lerComReferencias`.
  - Escola e ano vêm de `exigirEscolaDoContexto()` e `exigirAnoEmCurso()`, e o usuário vem de `sessaoDaRequisicao()`. Nada vem de argumento.
  - Os joins de turma e disciplina são correlacionados pela escola do vínculo.
- `TurmaRepository.aberta`: escola e ano do contexto. No caso do professor, o `exists` exige vínculo `confirmado` de professor, correlacionado com escola, ano e turma, para o usuário do contexto.
- `TurmaRepository.alunos`: escola e ano do contexto, com o join de usuário pela escola.
- `DisciplinaRepository.porId`: escola do contexto.
- Nenhuma entrada aceita `escolaId`. Os corpos de `POST /v1/vinculos`, `contestar` e `encerrar` e a query de `/alunos` usam esquemas `.strict()`.
- Todo caminho sem acesso responde o mesmo `NAO_ENCONTRADO`: id de outra escola, de outro professor, inexistente, sem ano em curso, e vínculo pendente, contestado ou encerrado. A falta de `finalidade` é conferida antes de procurar a turma, então não revela se a turma existe.
- Camada rede: `turma.ler`, `aluno_da_turma.ler` e `vinculo.*` estão em `nunca` na `MATRIZ`. O `alcanceDaTurma` também falha fechado com 404 para qualquer alcance fora de `unidade`, `nominal_auditado` e `turma_vinculada`.
- `@SemEscopo()`: nenhum uso novo.

Teste de isolamento: presente e efetivo.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/turma-acesso.int.test.ts:318`, o teste monta um contexto forjado (escola A com o ano e o professor de B). Assim, só a cláusula de escola separa as duas escolas.
- Tirar essa cláusula de `aberta`, `alunos`, `#escopo`, `pessoaAtivaComPapel` ou `DisciplinaRepository.porId` faria o repository trazer a linha de B, e o teste quebraria.
- O controle com a escola de B (linha 366) prova que o vazio veio da escola, e não de dado ausente.
- Os testes pela API (linhas 259, 285, 309 e 406) e o teste das FKs compostas (linha 374) cobrem a tabela de isolamento da tarefa.

Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts`: `alunos()` não confere por conta própria quem pede e depende de o service chamar `aberta` antes, na mesma transação. Hoje está correto. Vale fazer `alunos` receber o `AlcanceDaTurma` e aplicar o mesmo `exists` do vínculo confirmado, para que um uso futuro do repository sem `aberta` não abra a lista a professor sem vínculo.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts`: o join de disciplina em `#lerComReferencias` correlaciona só pela escola. Está correto hoje, porque a disciplina não tem ano. Se a disciplina passar a variar por ano letivo, esse join precisa ganhar `ano_letivo_id`.
