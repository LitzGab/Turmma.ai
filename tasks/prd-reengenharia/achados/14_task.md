# Achados das revisões — `tasks/prd-reengenharia/14_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-22 12:06:20 · `tasks/prd-reengenharia/14_task.md`

VEREDITO: APROVADO
Tabelas verificadas: nenhuma. A tarefa não cria nem altera migration, e nenhuma tabela de domínio foi tocada.
Queries verificadas: nenhuma query nem repository mudou. A mudança fica na entrada dos controllers.
- Nos cinco módulos (`sistema`, `ia`, `entrega`, `assistente`, `professores`), o `@Param('id', IdPipe)` só valida o formato e passa o id para minúsculas. O escopo continua no repository, a partir do token.
- Todos os esquemas ligados ao `ZodValidationPipe` são estritos: `esquemaPedidoJobSintetico`, `esquemaConsultaPaginada`, `esquemaConsultaEntregas`, `esquemaPedidoDecidirEntrega` (as duas variantes com `strictObject`), `esquemaPedidoMensagemAoAssistente`, `esquemaConsultaConversaDoAssistente`, `esquemaPedidoCadastrarProfessor` e `esquemaPedidoSemCorpoDoConviteDeProfessor`. Quando o corpo ou a query traz `escolaId`, a resposta é `ENTRADA_INVALIDA` e nada é lido. Os testes provam isso em `professores`, `assistente`, `entrega` e `jobs-sinteticos`.
- `npx eslint` nos cinco módulos passou sem achado. Nenhum `@Req()`, nenhum `requisicao.body/query/params` e nenhum `@Body()/@Query()/@Param()` sem pipe ficou nos controllers.

Teste de isolamento: presente e efetivo.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/ia/ia.int.test.ts:688` inclui `deB.id.toUpperCase()` entre as recusas e exige o mesmo 404 e o mesmo corpo do inexistente. Sem o `eq(…escolaId…)`, o id de B voltaria 200 e o teste quebraria.
- O mesmo vale para `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/test/jobs-sinteticos.int.test.ts:229` (`emMaiusculas` com o token de A), para `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/entrega/entrega.int.test.ts:590` (`deB.entregaId.toUpperCase()`) e para `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/test/professores.int.test.ts:840`.
- Os testes também mostram a guarda rodando antes do pipe: sem sessão a resposta é 401, e o papel errado recebe 404 sem auditoria.
- A mudança de ordem dos erros (id inválido com corpo inválido agora dá 400 em vez de 404) não revela se o registro existe: o pipe não consulta o banco, e qualquer id dá o mesmo 400. Os testes cobrem isso com o id de B e com um inexistente.

Bloqueantes: nenhum

Recomendações:
- Até a 17.0, existem duas cópias do mesmo comportamento: `idDoCaminho` e `lerEntrada` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/estrutura/entrada.ts`, e o `IdPipe` e o `ZodValidationPipe` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/packages/nucleo/src/entrada/`. Se uma mudar sem a outra, módulos migrados e não migrados passam a responder diferente ao id fora do formato. A remoção já está prevista na 17.0. Convém conferir lá que nenhum chamador ficou.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/eslint.config.mjs:62`: o bloco do lint barra `@Req()`, mas não barra outros decoradores próprios que leiam `request.body` por dentro (`createParamDecorator`). Vale um seletor ou uma nota antes da 17.0 estender o `files` para toda a API.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-22 12:07:29 · `tasks/prd-reengenharia/14_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência em `techspec.md` §1 (a caracterização entra num commit anterior)
Portão local: carimbo válido

Bloqueantes:

1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/14_task.md:94`. A linha de divergência diz que "a Tech Spec não diz como entra no git" e que "nenhum outro documento descreve isto". As duas afirmações estão erradas.
   - A Tech Spec diz isso: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/techspec.md:21` traz "Comportamento sem teste ganha caracterização num commit anterior". O mesmo vale para as tarefas 11, 16, 18, 22 e 35.
   - Juntar a caracterização ao commit da tarefa é divergir da Tech Spec, e essa divergência hoje está registrada só no `N_task.md`.
   - A linha também afirma que a caracterização "foi escrita e rodada, verde, contra o código antigo", e isso não se sustenta. Os casos de id inválido com corpo inválido dão 404 no código antigo, porque o `idDoCaminho` roda antes do `lerEntrada`. Os próprios testes reconhecem isso no comentário "antes era o do id, 404":
     - `apps/api/src/entrega/entrega.int.test.ts:167` exige 400 para `'nao-e-uuid'`;
     - `apps/api/test/professores.int.test.ts` (o laço `for (const id of ['nao-e-uuid', …])` dentro de `rota`) exige `ENTRADA_INVALIDA`.
   - Logo, ao menos essas asserções foram escritas contra o código novo. É exatamente o que o commit anterior existe para provar.
   - **Correção exigida**, uma das duas:
     - (a) separar a caracterização num commit anterior, como pede o `techspec.md` §1;
     - (b) registrar a exceção no `techspec.md` §1 (ou no `onda-1a.md` T1, citado pela Tech Spec), com o motivo, e corrigir a coluna "Onde está na spec" para apontar o lugar.
   - Nos dois casos, a linha precisa dizer com exatidão quais asserções não valiam no código antigo (as de id e corpo inválidos juntos, de 404 para 400) e que essa é a mudança de ordem que a T1 aceita ("caracterizada, não forçada").

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/professores/professores.controller.ts`: o `_corpo: Record<string, never>` foge da armadilha da tarefa ("o tipo vem de `@educa/shared`, `PedidoX`"). O `esquemaSemCorpo` com `.default({})` também mora no controller. Vale exportar de `packages/shared/src/professores/professores.ts` o tipo `PedidoSemCorpoDoConviteDeProfessor`, e o esquema com o default se fizer sentido para o contrato.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/packages/nucleo/src/entrada/id.pipe.ts`: o `IdPipe` passado como classe (`@Param('id', IdPipe)`) só é instanciado pelo Nest sem argumento porque não tem decorator e, por isso, não emite `design:paramtypes`. Se alguém puser `@Injectable()`, a injeção de dependência quebra no parâmetro `opcoes`. Um comentário de uma linha, ou o `@Optional()` no molde do `ParseUUIDPipe`, evita a armadilha.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/sistema/jobs-sinteticos.controller.ts:37`: o comentário repete o que o JSDoc do `IdPipe` já diz e pode sair.

## test-engineer · 1ª rodada · APROVADO · 2026-10-22 12:08:44 · `tasks/prd-reengenharia/14_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- `ZodValidationPipe`:
  - o inválido responde `ENTRADA_INVALIDA`;
  - o válido devolve o valor do esquema, com o `default` aplicado;
  - com `errorCode: NAO_ENCONTRADO`, responde 404.
- `IdPipe`:
  - converte para minúsculas;
  - o id fora do formato responde 404, e não 400;
  - com `invalidAsUndefined`, devolve `undefined`.
- A resposta do inválido é só o código do catálogo.
- O valor-teste do corpo inválido não vai para o log.
- `escolaId` de B no corpo ou na consulta é recusado, e nada é gravado.
- O uuid de B em maiúsculas recebe o mesmo 404 do id inexistente.
- `ia`: execução de outra pessoa, de outra escola, inexistente e fora do formato recebem o mesmo 404, com o mesmo corpo.
- `assistente`: corpo inválido não cria execução nem consumo.
- `professores`: limite 101 reprova e 100 passa.
- `sistema` e `entrega` respondem ao inválido como antes da migração (a caracterização).
- A guarda responde antes do pipe: sem sessão é 401; papel errado é 404, sem auditoria.
- Lint:
  - cada seletor reprova no controller migrado;
  - o jeito certo passa;
  - o mesmo arquivo como service, ou num módulo ainda não migrado, passa;
  - o `eslint-disable` não fura a segunda passada.
- `permissao-no-boot` continua verde.

**Cobertos:** todas as linhas da tabela têm teste citado, e os testes estão verdes nas minhas rodadas:
- unidade: 88 testes em `packages/nucleo/src/entrada/entrada.test.ts` e `tools/guardas/guardas.test.ts`, mais 3 em `apps/api/test/permissao-no-boot.test.ts`;
- integração: 42 testes em entrega e assistente, e 72 em ia, professores e jobs-sinteticos.

Conferi os blocos de "Mutações" contra o `git diff`. Toda cláusula nova tem bloco, e cada bloco chega à sua cláusula:
- os dois pipes;
- os 4 seletores do ESLint, inclusive a alternativa `Request`;
- os 5 módulos do `files`;
- `REGRAS_DE_ENTRADA` e a entrada dela em `REGRAS_DAS_GUARDAS`;
- cada `@Body`, `@Query` e `@Param` dos controllers;
- o `.default({})` do `esquemaSemCorpo`.

O uuid em maiúsculas que acrescentaram em jobs, professores, entrega e ia é o que faz a mutação do `IdPipe` falhar onde o Postgres engoliria a caixa.

As asserções olham o resultado, não só se o código rodou:
- comparação do corpo inteiro com `toEqual`;
- `retrato` de A e de B, que inclui a auditoria;
- `auditoriasDa`;
- contagem de `execucao_agente` e `consumo_ia`;
- varredura da `CapturaDeDadoPessoal`, que exige `http.erro` no log, então não passa vazia.

Não há `.skip`, mock da regra nem provedor de IA. Não há operação nova sujeita a corrida; o duplo clique em decidir já tem teste paralelo.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `tasks/prd-reengenharia/14_task.md:332`: o bloco do `listar` de entrega cita o arquivo inteiro, então qualquer teste vermelho conta. O certo é citar `entrega.int.test.ts › lista da mais nova para a mais antiga, filtra por estado e por turma, e pagina` (linha 359), que é o que traz `?limite=101`, `?escolaId=` e `?estado=aberta`.
2. Houve mudança de comportamento: com id e corpo inválidos juntos, `decidir`, `refazer` e `revogar` respondiam 404 e agora respondem 400. Não revela existência, e o teste prova isso (`entrega.int.test.ts:296`, `professores.int.test.ts:392`). Mas a mudança está só no comentário do teste e não aparece em "Divergências", embora a linha "o inválido igual ao da caracterização" a afirme.
3. A tabela pede o teste com `eslint-disable-next-line`, e o teste (`guardas.test.ts:509`) usa o `/* eslint-disable */` do arquivo inteiro. Dá o mesmo resultado, porque `tools/guardas/eslint-das-guardas.ts:20` usa `allowInlineConfig: false`, mas a forma que a tabela cita não tem caso próprio.
4. `assistente.int.test.ts:80`: o teste da guarda antes do pipe não confere a auditoria, que a tabela pede. Professores e entrega conferem.
5. "Arquivos previstos" lista `contexto.int.test.ts` e `estado-avisos.int.test.ts` como alterados, e eles não mudaram. Os controllers deles não recebem entrada, então só falta corrigir a tabela.
6. A fixture do lint não cobre `@Query(\`termo\`)` com crase nem o import renomeado (`Req as R`). Os seletores atuais deixam os dois passar. É cobertura extra, não uma regra sem teste.

Arquivos lidos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/14_task.md`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/packages/nucleo/src/entrada/entrada.test.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/guardas.test.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/__fixtures__/entrada-sem-esquema.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/entrega/entrega.int.test.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/test/professores.int.test.ts`.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 12:16:31 · `tasks/prd-reengenharia/14_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A exceção ao `techspec.md` §1 ("caracterização num commit anterior") agora está registrada no `onda-1a.md` T1, que a Tech Spec cita. A linha do `14_task.md` aponta para esse lugar.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

Conferi a correção exigida na 1ª rodada. Ela foi feita pela opção (b).
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/onda-1a.md:130-138` traz a exceção como exceção ao `techspec.md` §1, com o motivo (o hook pede `(tarefa N.0)`, o carimbo e os revisores). Diz também com exatidão quais asserções não valiam no código antigo: o id e o corpo inválidos juntos, em `decidir`, `refazer` e `revogar`, que passam de 404 a 400. E liga essa mudança ao "caracterizada, não forçada" que a mesma seção já aceita.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/14_task.md:94` foi corrigida. Separa as duas divergências e a coluna "Onde está na spec" aponta para o item novo do `onda-1a.md` T1. As afirmações erradas da 1ª rodada saíram.
- O 400 descrito bate com os testes:
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/entrega/entrega.int.test.ts:296`
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/test/professores.int.test.ts:456-457`

Também conferi o resto do diff:
- O teste novo da consulta fora do esquema (`entrega.int.test.ts:379-384`) cobre o limite 100 e o 101. A mutação do `ZodValidationPipe` em `listar` agora aponta para ele.
- O teste novo da guarda (`tools/guardas/guardas.test.ts:91-104`) calcula certo a linha escondida (`escondida + 2`, por causa do comentário inserido).
- O comentário do `IdPipe` explica por que a classe não leva `@Injectable()`, que não se adivinha lendo o código.

Recomendações:
- A nota "escritos e rodados, verdes, contra o código antigo" (`onda-1a.md:133`) não dá para conferir a partir do git, porque não há commit separado. Agora que a exceção está declarada, não bloqueia. Nas próximas tarefas de caracterização (15.0, 16.0), vale guardar a saída da rodada contra o código antigo, por exemplo em `.processo/`, para que essa afirmação tenha prova.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 12:16:40 · `tasks/prd-reengenharia/14_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** são os mesmos da 1ª rodada. Nesta rodada conferi só as quatro recomendações que a Mesa mandou aplicar (1, 3, 4 e 5) e o que o diff mexe.

**Cobertos:**
- **Recomendação 1 (bloco de mutação do `listar` de entrega):** foi feita. O bloco agora cita um teste novo pelo nome, "a consulta fora do esquema responde ENTRADA_INVALIDA, e o limite 100 passa e o 101 não" (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/entrega/entrega.int.test.ts:379`).
  - O teste quebra pelo motivo certo. A mutação troca `@Query(new ZodValidationPipe(...))` por `@Query()`, e aí a consulta crua chega ao service: `?estado=aberta` e `?escolaId=...` deixam de dar 400. Já a primeira asserção do laço fica vermelha.
  - Ele cobre ainda as duas bordas do limite (0 e 101 reprovam, 100 passa) e um `turmaId` fora do formato. A mensagem de cada asserção diz qual consulta falhou.
- **Recomendação 3 (`eslint-disable-next-line`):** foi feita. O caso novo está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/guardas.test.ts:91`. Ele põe o comentário antes de `criar(@Body())` e confere duas coisas:
  - no ESLint comum, some exatamente a linha escondida e nenhuma outra (a conta da linha, `escondida + 2`, está certa);
  - a segunda passada, a do `npm run lint`, que ignora comentários (`eslintDasGuardas`), continua reprovando todas.
  
  O teste também falha se a fixture perder a linha de `criar(@Body())`, então ele não passa por acaso. Isso cobre a linha 62 da tabela de testes.
- **Recomendação 4 (auditoria no teste da guarda antes do pipe):** foi feita. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/assistente/assistente.int.test.ts:212` e `:219`, a contagem da tabela `auditoria` na escola agora é conferida antes e depois. Isso cobre o "sem auditoria" da linha 59 da tabela.
- **Recomendação 5 ("Arquivos previstos"):** foi feita. Saíram `contexto` e `estado-avisos`, os dois testes que não mudaram.
- **O resto do diff:** `id.pipe.ts` e `jobs-sinteticos.controller.ts` só mudam comentário. A divergência nova (`decidir`, `refazer` e `revogar` passam de 404 a 400 quando o id e o corpo são inválidos juntos) está escrita na tarefa e no `onda-1a.md`. Ela não revela se o id existe, porque com o corpo inválido qualquer id dá o mesmo 400.
- **Rodei e passou:** `tools/guardas/guardas.test.ts` (83 testes) e `entrega.int.test.ts` com `assistente.int.test.ts` (43 testes).

**Bloqueantes:** nenhum.

**Recomendações:**
1. O laço do teste anterior (`entrega.int.test.ts:374-376`) agora é um pedaço do teste novo da linha 379. Dá para tirá-lo, ou dizer num comentário que ele é a caracterização da 14.1 e fica para provar o comportamento antigo.
