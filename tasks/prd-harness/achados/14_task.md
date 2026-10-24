# Achados das revisões — `tasks/prd-harness/14_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-23 23:21:44 · `tasks/prd-harness/14_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok (não se aplica: a mudança é só no hook de commit e no portão, nada roda em request)
Fila e prioridade: ok (nenhum job novo)
Concorrência: protegida (não se aplica: nenhuma operação de runtime)
Índice e paginação: ok (nenhuma query nem tabela)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (nenhum código novo no caminho quente)
Bloqueantes: nenhum
Recomendações:
- Na tabela, `package.json` (em `RESTO_DO_PROCESSO`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/guardioes-por-caminho.ts`) não pede guardião nenhum. Uma dependência que muda o caminho quente entra sem o `infra-guardian`, a menos que o texto do arquivo cite uma regra. Exemplos: trocar ou atualizar o BullMQ, o driver do Postgres ou o cliente Redis, ou incluir o SDK de um provedor de IA. Vale pôr `package.json` com `[I]` na próxima revisão da tabela.
- O mesmo vale para `vitest.config.ts`, também sem guardião. Uma alteração nele pode tirar da suíte o teste de concorrência ou o de prova online sem passar pelo `infra-guardian`. Se a tabela ganhar mais uma linha, este arquivo merece `[I]`.

O que conferi: os três testes alterados passam (398 casos, 3 arquivos) e não sobrou referência a `marcadorDoMvp`, `avaliarCommitDoMvp`, `SUITES_DO_MVP` nem `PREFIXO_DAS_BRANCHES_DO_MVP` no repositório. As linhas da tabela que tocam infra cobram o `infra-guardian`: `compose.yaml`, `.env.example`, `tools/ci/`, `.github/` e `infra/`.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-23 23:21:58 · `tasks/prd-harness/14_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A tarefa só mexe em código de processo (o hook, o portão e a tabela de guardiões), no README e no selo do corpus `ouro`, e nos comentários de dois arquivos. Nada no diff toca `Nota`, `Correcao`, job, seed, importação ou webhook. Todos com autor humano? Não se aplica, porque nenhum caminho foi criado ou alterado.

Decisão autônoma sobre aluno: ausente

Aprovação registrada: ok. Nenhuma saída de IA nova chega ao aluno. A exceção do tutor (D47) não foi estendida a nenhum outro agente.

Supervisão do tutor: ok. Nada mudou.

Autonomia declarada e visível: sim. Nada mudou.

Bloqueantes: nenhum

**O que olhei pela regra 70**
- **O corpus `ouro` ficou mais protegido do que estava.** Esse corpus guarda os casos que provam a regra 70 (`julgamentoDeTextoDeAluno.json`, `assuntoDelicado.json`, `pedidoDeRespostaPronta.json`). O marcador antigo `(ouro: <política>)` não tinha nenhuma checagem. Agora, mudar o corpus exige o `conformidade-reviewer`. As duas pastas estão na tabela: `docs/aia/ouro/` e `docs/aia/ouro-retido/` pedem esse revisor (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/guardioes-por-caminho.ts`, em `REGRAS_DO_RF16`). As duas também contam como código de processo em sessão de papel (`PASTAS_DE_PROCESSO` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/portao.ts`).
- **Há teste que prova isso.** O commit desse corpus sem a rodada do `conformidade-reviewer` é recusado (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/revisoes.test.ts`, linhas 2247-2248 e 2281). O conjunto de revisores pedidos está escrito por extenso em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/guardioes.test.ts`, linhas 224-225 e 301-306.
- **O corpus em si não mudou.** O `SELO.json` só trocou o hash do `README.md`. O hash de cada arquivo de política continua igual, então nada mudou na nota, na discursiva ou na redação.
- **A tabela não abre brecha.** `tools/guardas/` continua pedindo os quatro guardiões. `tools/ia/` pede o `privacy-guardian` e o `conformidade-reviewer`. Citar a regra 70 dentro de um arquivo de processo continua somando o `conformidade-reviewer`.
- **O fim do marcador `(mvp:)` também fecha um atalho.** Era um caminho para commitar código sem nenhum revisor por commit. Commit com esse marcador agora é tratado como código sem tarefa.
- **Os testes passam.** Rodei os testes de unidade de `revisoes.test.ts`, `harness/guardioes.test.ts`, `conferir-entregas.test.ts` e `selo-do-ouro.test.ts`: 457 de 457.

Recomendações:
- **Uma frase do README promete mais do que o hook cumpre.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/docs/aia/ouro/README.md`, linha 4, está escrito que "o hook recusa o commit sem a rodada dele". Isso só vale para commit marcado como `(correção <slug>)`, ou feito em sessão de papel. Um commit sem marcador, fora de sessão de papel (do Orquestrador ou do Joaquim), passa pelo hook, e só a esteira o pega. Vale dizer isso no texto, ou deixar mais claro que só o Arquiteto altera o corpus.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-23 23:22:11 · `tasks/prd-harness/14_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A tarefa só mexe no código do processo (o portão do commit, a tabela de guardiões, os comentários e o README do corpus `ouro`). Não toca migration, entidade, DTO, rota nem log de aplicação.

Fora da tabela de dados do docs/lgpd.md: nada, porque não entra campo novo.

Autorização por objeto: não se aplica, porque não há rota nem consulta nova. O que muda vai no sentido de cobrar mais revisão:
- Em sessão de papel, os caminhos de processo (`tools/`, `.github/`, `.claude/settings*.json`, `.claude/hooks/`, `docs/aia/ouro*/`, `compose.yaml`, `.env.example`) passam a contar como código e pedem tarefa ou correção. Isso está em `tools/processo/portao.ts`, na `arquivosDeCodigo`, que lê a mesma `ehCodigoParaAEsteira` usada pela esteira.
- O `privacy-guardian` passa a ser exigido onde há risco de vazamento:
  - `tools/vitrine/`, que monta a escola cheia das fotos de tela;
  - `tools/ia/`;
  - `.github/`, que decide o que vai para o artefato num repositório público;
  - `tools/ci/borda.test.ts`;
  - `playwright.config.ts`, por causa de trace e captura;
  - `.claude/settings*.json`.
  
  Isso está em `tools/processo/guardioes-por-caminho.ts`, na `REGRAS_DO_RF16`.
- Nenhum caso que já era coberto perdeu cobertura:
  - `PADRAO` e `EXCECOES_DO_CODIGO` não mudaram.
  - Os padrões novos têm peso 1, então não passam por cima de nenhum prefixo.
  - A regra de sufixo (`.service.ts`, `.repository.ts` e afins) continua pedindo os quatro guardiões em `tools/vitrine/`.
  - `infra/` continua exigindo `privacy-guardian` com e sem papel, e há teste para isso em `revisoes.test.ts:2288`.

Logs: limpos. Não há log novo, e a mensagem de recusa do portão cita só caminhos de arquivo.

Auditoria: não se aplica. Nenhuma ação desta tarefa está entre as que a regra 20.10 manda auditar.

Envio externo: nenhum.

Seed/fixture: sintético. O teste não cria dado de pessoa, e `tools/demonstracao/` é material de química escrito do zero, sem nome de pessoa nem de escola.

Rodei os testes: `revisoes.test.ts`, `harness/guardioes.test.ts`, `conferir-entregas.test.ts` e `selo-do-ouro.test.ts` passaram, 457 de 457. O hash novo do README no `SELO.json` confere. O `git grep` não acha mais `marcadorDoMvp`, `avaliarCommitDoMvp`, `SUITES_DO_MVP` nem `PREFIXO_DAS_BRANCHES_DO_MVP` em código, só em documentos de tarefas anteriores.

Bloqueantes: nenhum.

Recomendações:
1. Pasta nova em `tools/` não pede o `privacy-guardian`. `RESTO_DO_PROCESSO` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/guardioes-por-caminho.ts` deixa `tools/` sem guardião, salvo se o arquivo citar a regra. Um script futuro de exportação, dump ou seed numa pasta nova de `tools/` passaria sem ele. Não é regressão, porque antes nem contava como código, mas vale avaliar no `/retro` se pasta nova de `tools/` deve nascer pedindo o `privacy-guardian`, como já acontece com pasta nova de produto.
2. `.claude/hooks/` também fica sem guardião. Um hook de sessão pode injetar contexto ou gravar arquivo. Vale considerar o `privacy-guardian` ali quando o hook passar a ler dado da árvore.
3. `tools/demonstracao/` alimenta a demonstração. Se um dia ganhar dado de pessoa (aluno ou professor fictício), deve ir para a mesma linha da `tools/vitrine/` (P C), pela regra 20.17.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/portao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/guardioes-por-caminho.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/comando-git.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/hook-git.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/revisoes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/guardioes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/docs/aia/ouro/README.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/docs/aia/ouro/SELO.json
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/packages/nucleo/src/ia/selo-do-ouro.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/tabela-de-guardioes.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/techspec.md

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-23 23:22:15 · `tasks/prd-harness/14_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma. A tarefa não cria migration nem tabela de domínio.

Queries verificadas: nenhuma query de produto. Nenhum repository ou endpoint mudou, e nada lê `escolaId` de corpo ou de query string. O que olhei foi a tabela de guardiões que decide se o `tenancy-guardian` é exigido:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/guardioes-por-caminho.ts`: estas linhas continuam pedindo os quatro guardiões:
  - `eslint.config.mjs` e `eslint-suppressions.json`
  - `tools/guardas/`, `tools/testes/`, `apps/`, `packages/` e `e2e/`
  - os sufixos `.repository.ts`, `.controller.ts`, `.gateway.ts` e `.service.ts`
  - qualquer arquivo com `@SemEscopo(`, no índice ou no HEAD
- O `tenancy-guardian` não deixou de ser exigido em nenhum caminho. As linhas novas do RF16 só acrescentam exigência a caminhos que antes não pediam guardião nenhum.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/portao.ts`: a nova `arquivosDeCodigo` reusa a `ehCodigoParaAEsteira`, sem uma segunda lista. A saída do `(mvp:)` tira um caminho que dispensava revisores.

Teste de isolamento: não se aplica como teste de módulo, porque não há módulo de domínio novo. A prova de que o `tenancy-guardian` é exigido existe e funciona:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/revisoes.test.ts`, `eslint.config.mjs` sem `tenancy-guardian` é recusado.
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/guardioes.test.ts`, cada linha tem o conjunto exato de guardiões, e o `@SemEscopo(` e os sufixos pedem os quatro em todas as linhas do RF16.
- Tirar o T da linha do eslint, ou a regra do `@SemEscopo(`, deixa esses testes vermelhos.
- Rodei as três suítes da tarefa e passaram os 451 testes.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/vitrine/escola.ts:211-227` grava SQL direto nas tabelas de domínio (`serie`, `disciplina`, `turma`, `usuario`, `credencial_matricula`) com `escola_id` passado à mão. A linha `tools/vitrine/` pede só P e C. Uma mudança ali que consulte mais de uma escola passaria sem o `tenancy-guardian`, a não ser que o arquivo cite a "regra 10" ou leve `@SemEscopo(`. Vale avaliar, no `/retro`, pôr o T nessa linha da tabela e da `REGRAS_DO_RF16`. Não bloqueia: é ferramenta de desenvolvimento, a tabela vem da Tech Spec, e antes desta tarefa a pasta não pedia guardião nenhum.
- `tools/demonstracao/` cai no resto de `tools/`, que não pede guardião salvo pela citação. Hoje a pasta não toca o banco. Se um dia tocar, precisa de linha própria.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-23 23:22:55 · `tasks/prd-harness/14_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

As cinco subtarefas foram feitas:

- **14.1:** a `decidirCommit`, em sessão de papel, conta como código o que a `ehCodigoParaAEsteira` conta, importada sem cópia (`arquivosDeCodigo`, `tools/processo/portao.ts`). `infra/` continua código em qualquer sessão.
- **14.2:** a tabela do RF16 está em `guardioes-por-caminho.ts`.
- **14.3:** saíram `marcadorDoMvp`, `avaliarCommitDoMvp`, `SUITES_DO_MVP`, `PREFIXO_DAS_BRANCHES_DO_MVP` e o ramo do `(mvp:)`. Nenhum import ficou órfão: `lerCarimbo`, `alteracoesDeCodigo`, `lerInstantaneos` e `CHAVE_DO_PORTAO` continuam em uso no `portao-local.ts`.
- **14.4:** o README do `ouro` foi alterado e o `SELO.json` regravado.
- **14.5:** os testes cobrem a tabela inteira de cenários, o RF18 inclusive.

Fora dos arquivos previstos, o diff só traz comentários e docblocks, e isso está declarado em "Divergências". As quatro divergências citam onde estão na spec: o `techspec.md` §5(a) foi reescrito, e a terceira aponta o `tabela-de-guardioes.md`, que é documento da seção 11 e foi atualizado.

Recomendações:
1. O título da seção em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/tabela-de-guardioes.md` ainda diz "Fora do código de produto (RF16, só em sessão de papel)". O parágrafo novo, no fim do arquivo, diz o contrário: a tabela vale para commit de tarefa ou de correção em qualquer sessão, e o papel só decide o que conta como código sem tarefa. Quem lê só o título vai entender errado. Vale ajustar o título, ou pôr a ressalva logo abaixo dele.
2. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/guardioes-por-caminho.ts:125`, o comentário da `entradaDe` ainda fala em "a entrada mais longa que casa", mas agora o critério é o maior `peso`.
3. Os nomes de arquivo da raiz no RF16 (`compose.yaml`, `.env.example`, `eslint.config.mjs`, `package.json`...) casam por `startsWith`, então `.env.example.local` pede o `infra-guardian`. A esteira compara pelo nome inteiro (`ARQUIVOS_DE_PROCESSO.includes`). O desvio é inofensivo, porque só pede mais e só em commit com tarefa, mas são duas regras de casamento para o mesmo nome.
4. `CODIGO_PARA_A_ESTEIRA` e `DOCUMENTO_PARA_A_ESTEIRA` foram reescritas por extenso em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/revisoes.test.ts:2118`, e o "Como testar" pedia reaproveitar as listas de `conferir-entregas.test.ts`. Hoje as duas cópias são idênticas, mas nada as obriga a continuar iguais. A decisão é do `test-engineer`.
5. Pela própria tabela nova, o commit desta tarefa leva `portao.ts`, `comando-git.ts`, `hook-git.ts`, `guardioes-por-caminho.ts` e `harness/guardioes.test.ts`, e todos pedem os quatro guardiões. Os "Subagentes obrigatórios" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/14_task.md` não listam o `tenancy-guardian`, e o hook vai cobrá-lo no commit. Convém marcá-lo antes de chegar lá.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-23 23:23:09 · `tasks/prd-harness/14_task.md`

VEREDITO: REPROVADO

Cenários exigidos: as treze linhas da tabela "Testes que provam a regra" da `14_task.md`.
- Papel, sem tarefa: cada caminho do §5(e) é recusado.
- Skill, regra, `docs/aia/tutor.md` e `tasks/` passam.
- Correção marcada sem `revisor-geral`: recusada.
- O conjunto exato de guardiões por caminho, no `guardioes.test.ts`.
- Os dois lados pela `decidirCommit`: sem o guardião recusado, com ele aceito.
- Os quatro casos "entre eles" (`eslint.config.mjs`, `docs/aia/ouro/x.json`, `hook-git.ts`, `borda.test.ts`).
- `infra/Caddyfile` com e sem papel; `infra/k6/x.js`; `linhas.ts`; `tools/guardas/index.mjs`.
- Sem papel, o §5(e) passa.
- Uma lista só, igual à da esteira.
- RF18: o `(mvp:)` sai.

Cobertos: todas as linhas têm teste citável, com uma exceção (o bloqueante abaixo). Em `revisoes.test.ts`, no describe `RF16: o código de processo exige revisão, só em sessão de papel` (linha 2109 em diante):
- `em papel, %s é código: recusado` e `em papel, %s é documento: passa`.
- `uma lista só: …`, que compara com `ehCodigoParaAEsteira` em quatro papéis.
- `sem papel, o §5(e) passa…`.
- O `it.each(TABELA)`, que recusa sem cada um dos guardiões e aceita com eles e só eles.
- `entre as linhas: …`, o caso `` `infra/Caddyfile` … com e sem papel ``, `o resto do §5(e) pede só os de toda tarefa`, e a citação no resto de `tools/`.

No mesmo arquivo, o RF18 está em `o marcador da fatia do MVP saiu (RF18)`, com it.each por branch, PreToolUse e `decidirCommit`, e confere que a mensagem não cita mais `mvp`/`D77`.

Em `harness/guardioes.test.ts`, o describe `o código de processo (RF16)` cobre:
- o it.each por linha, com o conjunto exato;
- `.claude/settings*.json` e os vizinhos que o padrão não alcança;
- prefixo mais longo, sufixo e `@SemEscopo(`;
- linha morta, e o conferir da cópia entre `REGRAS_DO_RF16`/`RESTO_DO_PROCESSO` e `PASTAS_DE_PROCESSO`/`ARQUIVOS_DE_PROCESSO`.

As 36 mutações do documento batem com as cláusulas do `git diff` de `guardioes-por-caminho.ts` e `portao.ts`. O `peso: 1` do `doPadrao` fica sem bloco, mas não dá para observar, porque nenhum prefixo casa `.claude/settings*` nem `tsconfig*`. O ramo `(mvp:)` que saiu é provado pelo caso do RF18, que ficaria vermelho com ele de volta. Não há `.skip`, `.only` nem mock. Não há IA. Concorrência não se aplica (decisão pura). Os quatro arquivos rodam verdes (457 testes).

Bloqueantes:
1. **O RF16 exige `revisor-geral` na correção, o código não exige, e o teste esconde isso marcando o revisor no documento.**
   - **A regra.** `prd.md:67` (RF16) e `tabela-de-guardioes.md:41` ("Além de `revisor-geral` e `test-engineer`") dizem que o commit de código de processo exige `revisor-geral`. O objetivo da `14_task.md:11` repete isso.
   - **O que o código faz.** `tools/processo/documento-de-revisao.ts:138` dá à correção só `['test-engineer']`, e a 14.0 não acrescenta nada em `obrigatoriosDoCommit` (`portao.ts:331`).
   - **O furo.** Uma correção cujo documento não marca `revisor-geral`, levando `tools/processo/portao.ts` com rodadas de `test-engineer` e dos quatro guardiões, é aceita hoje.
   - **O teste.** `tools/processo/revisoes.test.ts:2309-2310` (`correção marcada sem a rodada do revisor-geral`) põe `revisor-geral` em `marcados`. Com isso, o teste passa com ou sem o RF16 implementado: a marcação no documento sempre exigiu o revisor.
   - **Correção exigida.**
     - Na decisão, a correção que leva código de processo (em sessão de papel, ou pela tabela, conforme a Tech Spec) passa a exigir `revisor-geral`.
     - O teste usa um documento de correção **sem** `revisor-geral` na linha de subagentes: recusado sem a rodada dele, aceito com ela.
     - O documento ganha um bloco `mutacao` para a cláusula nova.
     - Se a intenção for outra (a correção dispensar o `revisor-geral`), isso é divergência com o PRD e precisa estar escrito em "Divergências" com o motivo, não resolvido em silêncio pelo teste.

Recomendações:
- `revisoes.test.ts:2118-2172`: `CODIGO_PARA_A_ESTEIRA` e `DOCUMENTO_PARA_A_ESTEIRA` são cópias literais das listas de `tools/ci/conferir-entregas.test.ts:292-335`, e a tarefa pedia reuso ("reuse as duas listas"). Hoje são idênticas. Se uma delas crescer, a outra fica para trás sem ninguém ver. Exportar as listas de um módulo de fixture compartilhado evita isso.
- O "Como testar" pede o caminho de verdade com o papel em `CLAUDE_CODE_AGENT`. O teste `pelo PreToolUse: …` (`revisoes.test.ts:2219`) passa o papel como argumento de `portao`. Vale um caso de `bloqueioDoCommitMsg` ou do hook com a variável de ambiente e um arquivo de `tools/`, para provar que o papel chega à `decidirCommit` pelo git hook nativo.
- `harness/guardioes.test.ts`, no teste de linha morta: o comentário diz que `.env.example` "pode não estar versionado", mas `podeNaoExistir` só tem `docs/aia/ouro-retido/`. Ajustar o texto.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/14_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/portao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/guardioes-por-caminho.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/documento-de-revisao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/revisoes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/guardioes.test.ts

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-23 23:31:46 · `tasks/prd-harness/14_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. Esta rodada mexe só em ferramenta de processo (`tools/processo/`, `tools/ci/`), em documentação de processo e no selo do `ouro`. Nenhuma migration, entidade, DTO, rota ou campo de pessoa.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: não se aplica (nenhum endpoint).

Logs: limpos. Na mudança de código, a recusa do portão cita só caminho de arquivo e nome de revisor (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/portao.ts:345-359`). Nenhum conteúdo da árvore vai para o stderr.

Auditoria: não se aplica. A mudança não toca leitura de dado de aluno, exportação, nota, permissão nem aprovação de saída de IA. O efeito dela no rastro do processo é a favor: a correção que leva código de processo passa a exigir o `revisor-geral` mesmo quando o documento não o marca. A regra só soma, porque `obrigatoriosDoCommit` faz a união com `Set`. O `privacy-guardian` continua obrigatório onde a tabela do RF16 o pede (`infra/`, `tools/ci/` e os outros caminhos). Os testes de `revisoes.test.ts:2280-2320` cobrem os dois lados.

Envio externo: nenhum.

Seed/fixture: sintético. As listas de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/caminhos-da-esteira.ts` são só caminhos de exemplo (`apps/api/src/x.ts` e parecidos). O caso novo de `hook-git.int.test.ts:187-198` grava `export const a = 1`. Nenhum nome, matrícula ou conteúdo de aluno.

Correções exigidas na rodada anterior: nenhuma, então não havia o que conferir.

Bloqueantes: nenhum.

Recomendações:
- O `README.md` do `ouro` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/docs/aia/ouro/README.md:5-6`) agora diz por escrito que o commit feito sem papel (o Orquestrador, o Joaquim) não passa pelo hook, e que só a esteira (`ci:conferir-entregas`) o pega. Para a regra 20, a pasta `ouro/` é corpus de política e tem que continuar sintético. Vale levar ao `/retro` da X7 a ideia de pôr na esteira uma checagem de que o arquivo novo em `docs/aia/ouro/` não traz dado real, já que fora do papel a revisão do commit não é obrigatória. Não bloqueia: o comportamento já existia, e o texto só passou a dizer o que acontece.
- As recomendações do `privacy-guardian` da 1ª rodada ficam onde estão em `14_task.md`, na tabela "Recomendações sem aplicar", com destino `/retro` da X7: pasta nova de `tools/` nascer pedindo `privacy-guardian`, `.claude/hooks/` pedir `privacy-guardian` quando o hook ler dado da árvore, e `tools/vitrine/` ganhar linha própria.

Pergunta de fechamento: esta tarefa não cria dado de aluno nem envio. O que o sistema responde sobre um aluno continua igual ao de antes da tarefa.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-23 23:31:51 · `tasks/prd-harness/14_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok (a mudança não tem endpoint nem rota)
Fila e prioridade: ok (a mudança não toca job nem fila)
Concorrência: protegida (sem escrita concorrente: `obrigatoriosDoCommit` é uma função pura sobre a lista de arquivos)
Índice e paginação: ok (não há query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (é ferramenta de processo, fora do caminho quente; não há alerta novo)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/portao.ts:328`: `ehCodigoDeProcesso` repete o `PASTAS_DE_CODIGO.some(...)`, que já aparece nas linhas 315 e 435. Um auxiliar `ehCodigoDeProduto` deixaria as três num lugar só e diminui a chance de a lista mudar num ponto e não nos outros. Fica para o `/retro`.
- O `docs/aia/ouro/README.md` agora diz que o commit sem papel só é pego pela esteira (`ci:conferir-entregas`). Convém confirmar no `/validar` que a esteira de fato cobra o `revisor-geral` na correção que leva código de processo. Este diff não traz teste da esteira para esse caso.

O diff desde a 1ª rodada não muda nada que o produto faça em horário de aula: as mudanças estão em `tools/processo/`, `tools/ci/`, nos documentos da tarefa e no selo do `ouro`. Os quatro arquivos de teste tocados passam: 466 testes em 4 arquivos (`revisoes.test.ts`, `conferir-entregas.test.ts`, `harness/guardioes.test.ts`, `selo-do-ouro.test.ts`). O `hook-git.int.test.ts` não rodou nesta auditoria, e o caso novo de `tools/` pelo commit-msg está nele. Nenhum teste chama provedor pago. A rodada anterior não exigiu correções, então não havia o que conferir.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-23 23:31:55 · `tasks/prd-harness/14_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma. Esta rodada não traz migration nem tabela de domínio. Os 13 arquivos do diff são de processo (hook, portão, testes do harness, documentos da spec e o `SELO.json` do ouro).

Queries verificadas: nenhuma query de banco, repository ou endpoint mudou. O que conferi pelo lado do isolamento:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/portao.ts:328` e `obrigatoriosDoCommit`: a mudança só acrescenta o `revisor-geral` na correção que leva código de processo. Os guardiões que o caminho pede (`guardioesDoCaminho`) e os marcados no documento continuam na lista. Nenhum caminho deixa de exigir o `tenancy-guardian`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/guardioes-por-caminho.ts`: só o docblock de `entradaDe` mudou. Nenhuma entrada da tabela foi tirada ou trocada.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/caminhos-da-esteira.ts` (novo): as listas de caminhos são as mesmas que estavam escritas dentro dos dois testes, sem diferença de conteúdo.

Teste de isolamento: não se aplica. Nenhum módulo de domínio é novo nesta rodada, e a cobrança do `tenancy-guardian` pelo caminho não mudou.

Bloqueantes: nenhum.

Recomendações:
- O README do ouro agora registra que o commit sem papel (Orquestrador, Joaquim) não passa pelo hook e só a esteira o pega. O mesmo vale para o código de produto que o `tenancy-guardian` cobra pelo caminho: sem papel, o commit não exige a rodada dele no momento do commit. Registrar isso no `/retro` da X7 junto com as recomendações da 1ª rodada sobre `tools/vitrine/`. A vitrine grava SQL com `escola_id` à mão e ainda não tem linha `T` na tabela.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-23 23:32:02 · `tasks/prd-harness/14_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A regra nova (a correção que leva código de processo passa a exigir `revisor-geral`, esteja ele marcado no documento ou não) está escrita em quatro lugares, e o código a cumpre:
- a Tech Spec, no `techspec.md` §5(a), linha 82;
- a seção do RF16 em `tabela-de-guardioes.md`;
- o `cenarios.md`, seção B, RF16;
- as "Divergências" do `14_task.md`.

O código está em `portao.ts:328-338`. O RF16 do `prd.md:67` já pedia isso, então a regra fecha um furo em relação ao PRD e não abre divergência nova. O arquivo novo `tools/ci/caminhos-da-esteira.ts` foi declarado em "Divergências" e em "Arquivos previstos".

Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes: nenhum

As seis correções da ordem da rodada 1 foram feitas:
- **Item 1 (`revisor-geral` na correção):** a cláusula está em `obrigatoriosDoCommit`. O teste usa agora um documento de correção sem `revisor-geral` e confere isso (`readFileSync(...).not.toContain('revisor-geral')`). Há casos com e sem papel, um caso de correção só de produto e um de correção só de documento. As cinco mutações foram declaradas.
- **Item 2.1:** as duas listas saíram de `revisoes.test.ts` e de `conferir-entregas.test.ts` e foram para um módulo só, que os dois importam.
- **Item 2.2:** há um teste com `vi.stubEnv('CLAUDE_CODE_AGENT', ...)` e outro pelo commit-msg do git de verdade, em `hook-git.int.test.ts:187`.
- **Itens 2.3, 2.4 e 2.5:** os comentários e o título da seção foram ajustados.
- **Item 2.6:** o README do `ouro` mudou e o hash no `SELO.json` foi regravado.

Recomendações:
- O `docs/aia/ouro/README.md`, linhas 4-5, ainda descreve o hook de forma imprecisa. Ele diz que "o hook só recusa o commit sem a rodada dele em sessão de papel" e que "o commit de quem não tem papel não passa por ele". Isso não bate com o código: com `(correção <slug>)` na mensagem, o hook confere as rodadas em qualquer sessão (`decidirCommit`, que chama `bloqueioDoDocumento` e `obrigatoriosDoCommit`, sem ler o papel). O que escapa ao hook é só o commit **sem a marca** feito fora de sessão de papel. O texto promete menos proteção do que existe, não mais, e por isso não bloqueia. Mas é o mesmo ponto que o `conformidade-reviewer` levantou, e merece uma frase exata, por exemplo: "sem a marca e sem papel, só a esteira pega".
- O `14_task.md:17` ainda cita a seção pelo título antigo, "Fora do código de produto (RF16, só em sessão de papel)", que mudou nesta rodada.
- A quarta linha de "Divergências" do `14_task.md` aponta para o `techspec.md` §5(b), mas só o §5(a) foi alterado, e o §5(b) não fala em `revisor-geral`. A referência pode ficar só no §5(a).

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/portao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/caminhos-da-esteira.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/revisoes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/docs/aia/ouro/README.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/14_task.md

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-23 23:32:12 · `tasks/prd-harness/14_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta rodada. O diff não toca `Nota`, nem a correção, nem job, seed, importação ou webhook do produto. Todos com autor humano? sim, porque nenhum caminho foi criado ou alterado.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. Nenhum fluxo de saída de IA mudou, e a exceção da D47 não aparece em outro agente.
Supervisão do tutor: ok. O tutor não foi tocado.
Autonomia declarada e visível: sim. Não foi tocada nesta rodada.
Bloqueantes: nenhum

O que auditei no diff da rodada (`4ad69af..1051a8c`, 13 arquivos):

- **A recomendação da 1ª rodada foi aplicada.** O README do `ouro` mudou nas linhas 4 a 6. Agora ele declara a lacuna em vez de prometer uma barreira que não existe: o hook só recusa sem a rodada do `conformidade-reviewer` em sessão de papel, e o commit de quem não tem papel só é pego pela esteira. O hash novo do `SELO.json` (`a8eae500…`) bate com o `sha256sum` do arquivo. O `selo-do-ouro.test.ts` e o `describe` do RF16 de `revisoes.test.ts` passam (91 testes).
- **A mudança de código em `tools/processo/portao.ts:345-358` só aumenta a proteção.** A correção que leva código de processo agora exige o `revisor-geral`, marcado ou não, em qualquer sessão. Isso inclui `docs/aia/ouro/`, o corpus que prova a política da D55 (`julgamentoDeTextoDeAluno.json`). A obrigação do `conformidade-reviewer` sobre o `ouro` continua na tabela (`guardioes-por-caminho.ts:82-83`). Os testes novos (`revisoes.test.ts:2280-2320`) incluem `docs/aia/ouro/x.json` e passam nas duas sessões. As cinco mutações declaradas no `14_task.md` cobrem as cláusulas novas.
- `tools/ci/caminhos-da-esteira.ts` e o caso novo de `hook-git.int.test.ts` não têm nada da regra 70. A lista mantém `docs/aia/ouro/x.json` e `docs/aia/ouro-retido/x.json` como código para a esteira.

Recomendações:
- **README do `ouro`, linhas 4 e 5, ainda inexato.** A frase "o commit de quem não tem papel (…) não passa por ele" diz menos do que o código faz. O commit sem papel que traz `(correção <slug>)` no assunto passa sim pela tabela do RF16 e é recusado sem a rodada do `conformidade-reviewer`: o teste "e a sessão não importa" prova isso com papel vazio. A lacuna real é só o commit sem papel e **sem** marca, e esse a esteira pega pela falta da marca. Sugestão de texto: "o commit sem papel e sem marca não passa por ele". O erro só esconde proteção que existe, não promete proteção que falta, por isso não bloqueia. Fica para o `/retro`. Se mudar, o hash do `SELO.json` tem de ser regravado na mesma correção.
- **A esteira não confere a rodada do revisor.** `tools/ci/conferir-entregas.ts:6-15` só olha a marca e a linha `Revisões:`, não a rodada do `conformidade-reviewer` no `ouro`. O README já trata isso como limite declarado. Se no futuro o corpus `ouro` virar prova da D55 no dossiê (D61), vale a esteira conferir a rodada pelo caminho. Fica para o `/retro` da X7.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/docs/aia/ouro/README.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/docs/aia/ouro/SELO.json
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/portao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/revisoes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/guardioes-por-caminho.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/conferir-entregas.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/caminhos-da-esteira.ts

## test-engineer · 2ª rodada · APROVADO · 2026-10-23 23:32:22 · `tasks/prd-harness/14_task.md`

VEREDITO: APROVADO

**Cenários exigidos (o que a rodada 1 pediu corrigir):**
- Uma correção que leva código de processo, com documento que não marca `revisor-geral`, é recusada sem a rodada dele e aceita com ela.
- Vale em qualquer sessão.
- A correção só de produto não ganha o `revisor-geral`.
- A correção só de documento também não ganha.
- A tarefa continua com ele sempre.
- Há um bloco `mutacao` para a cláusula nova.

**Cobertos:**
- **A correção exigida foi feita.** `tools/processo/portao.ts:345-358` passou a exigir o `revisor-geral` em `obrigatoriosDoCommit`, para a correção que leva código de processo. O teste novo, em `tools/processo/revisoes.test.ts:2280-2320`, monta o documento da correção marcando só os quatro guardiões, e confere que o texto não contém `revisor-geral` (linha 2287). Assim o furo da rodada 1, de o teste passar só por causa da marcação, não volta.
- **Recusa e aceite.** Sem a rodada do `revisor-geral`, o commit é recusado, e por esse único motivo (`toHaveLength(1)`). Com a rodada, é aceito.
- **Sessão.** O caso `it.each` (linhas 2295-2302) cobre seis caminhos de processo, com papel e sem papel.
- **O que não muda.** Os dois casos negativos cobrem a correção só de produto (`apps/api/src/x.ts`, `infra/Caddyfile`) e a correção só de documento (`docs/guia.md`). Há asserção direta sobre o resultado de `obrigatoriosDoCommit`, que prova também que a tarefa mantém o `revisor-geral` sempre.
- **Cinco blocos `mutacao` novos** (`14_task.md`, seção "Mutações"). Cada um chega à cláusula pelo motivo certo:
  - tirar a exclusão de `PASTAS_DE_CODIGO` quebra o caso de produto;
  - `true` no lugar de `ehCodigoParaAEsteira` quebra o caso de documento e a asserção direta;
  - trocar `===` por `!==` quebra a recusa;
  - trocar `some` por `every` quebra a recusa, porque os arquivos do commit incluem o próprio documento da correção, que não é código;
  - trocar a condição inteira por `true` quebra o caso de documento.
- **O desvio do PRD foi resolvido do lado do PRD, sem silêncio.** O RF16 e a tabela já pediam o `revisor-geral`, e a linha nova de "Divergências" registra a cláusula. `techspec.md`, `tabela-de-guardioes.md` e `cenarios.md` foram alinhados.
- **Testes extras, também sem mock que esconda a regra:**
  - `hook-git.int.test.ts:187` testa o `tools/` pelo commit-msg de um git real;
  - `revisoes.test.ts:2184` testa o papel lido de `CLAUDE_CODE_AGENT`, com `vi.stubEnv` e restauração no `finally`.
- **As duas listas "para a esteira"** agora moram num módulo só, `tools/ci/caminhos-da-esteira.ts`, importado pelos dois testes. Com isso o requisito "uma lista só" deixa de depender de duas cópias.
- Não há `.skip`, provedor de IA nem concorrência envolvidos.
- Rodei os cinco arquivos de teste da tarefa: 518 testes, todos verdes.

**Bloqueantes:** nenhum.

**Recomendações (não bloqueiam):**
1. A linha 59 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/14_task.md` ainda diz "correção marcada sem `revisor-geral`". O cenário provado agora é "correção que leva código de processo, marcada ou não", e vale citar o `describe` novo pelo nome.
2. O `describe` em `revisoes.test.ts:2110` ainda se chama "...só em sessão de papel", mas a cláusula nova vale em qualquer sessão. Se o nome mudar, os blocos `mutacao` que citam esse prefixo precisam mudar junto. Fica para o `/retro`.
3. O texto novo de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/docs/aia/ouro/README.md` diz que o commit de quem não tem papel "não passa" pelo hook. Isso vale para o git hook. O portão do `PreToolUse`, porém, roda também na sessão sem papel e cobra a correção marcada; o próprio caso `it.each` com papel `''` prova isso. Vale deixar isso claro para não sugerir que só a esteira pega esse commit.
