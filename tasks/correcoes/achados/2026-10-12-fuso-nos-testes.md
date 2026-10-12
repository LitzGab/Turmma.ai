# Achados das revisões — `tasks/correcoes/2026-10-12-fuso-nos-testes.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-12 00:42:42 · `tasks/correcoes/2026-10-12-fuso-nos-testes.md`

VEREDITO: APROVADO
Tela vista: não. A tarefa não cria nem altera tela. O único arquivo de `apps/web` é `apps/web/src/areas/coordenacao/privacidade/textos-do-pedido.test.ts`, e o diff não toca `periodoDaLinha` nem `formatarDiaDoInstante`. Não há foto a ler, e fotografar a tela não acrescentaria nada.
Estados: não se aplica. Nenhum componente muda.
Acessibilidade: não se aplica.
Chromebook fraco: não se aplica. A mudança de `vitest.config.ts` (`TZ: 'Asia/Tokyo'` só no projeto de unidade) e a de `infra/compose.yml` (`timezone` do Postgres) são de infraestrutura de teste e desenvolvimento, sem efeito em bundle ou em tela.
Celular: não se aplica. Nenhuma tela nova ou alterada.
Ação oficial protegida: sim, não se aplica. Nada oficial é tocado.
Bloqueantes: nenhum.
Recomendações:
- No teste do período, os valores esperados ("Em 10/09/2026", "De 10/09/2026 até 20/09/2026") já provam o formato local brasileiro dd/mm/aaaa. Ele passa a ficar fixado em um fuso extremo (Tóquio), o que é bom para a regra 50 item 7.
- A leitura do dia pelo fuso do computador continua sendo comportamento da tela e não é alterada aqui. A tela do coordenador mostra o dia pelo relógio do navegador, e não o de São Paulo. Isso já existia antes da tarefa e fica registrado para o `/validar`, não para esta correção.

Arquivo relevante: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/apps/web/src/areas/coordenacao/privacidade/textos-do-pedido.test.ts`

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-12 00:43:04 · `tasks/correcoes/2026-10-12-fuso-nos-testes.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A correção mexe só na configuração de teste (`vitest.config.ts`), no `command` do Postgres do compose, numa variável nova do `.env.example`, num teste da web e em dois testes novos de infraestrutura. Não há migration, DTO, repository nem código de produção no diff (`git diff --stat HEAD -- apps packages` mostra só `textos-do-pedido.test.ts`).

Fora da tabela de dados do docs/lgpd.md: nada. Nenhum campo novo.

Autorização por objeto: não se aplica, porque não há rota nem consulta nova. As consultas de `fuso.int.test.ts` leem só `current_setting('TimeZone')`, `current_date` e instantes literais, e não tocam tabela de domínio.

Logs: limpos. Nenhum log foi adicionado.

Auditoria: não se aplica. Não há leitura de dado de aluno, exportação, nota, permissão nem aprovação de IA.

Envio externo: nenhum.

Seed/fixture: sintético. Os testes usam só instantes fixos (`2026-09-10T12:00Z`, `2026-10-10T01:00Z`) e nenhum dado de pessoa. A senha `educa_local_sintetica` do `.env.example` já existia e é sintética.

Efeito no ciclo de vida, conferido porque o fuso da sessão do banco poderia mexer na retenção:
- O expurgo (`packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:124`, `:545`, `:558`) declara o fuso na consulta (`at time zone ${fuso}`). Não depende do `TimeZone` da sessão, e a retenção por escola continua igual.
- O compartilhamento do titular (`packages/nucleo/src/titular/compartilhamento.repository.ts:61`), o orçamento (`apps/api/src/ia/orcamento.repository.ts:76`), a supervisão do tutor (`apps/api/src/tutor/supervisao.repository.ts:267`) e a governança (`apps/api/src/governanca/governanca.repository.ts:162`) partem de uma data literal e convertem com `FUSO_DO_USO` explícito. O resultado não depende do fuso da sessão.
- O único `current_date` de produção é o `check` `pedido_titular_chegou_em_nao_futura` (`packages/nucleo/drizzle/0032_pedido_titular.sql:43`). No ambiente local e de teste ele passa a ler o dia de São Paulo, o mesmo que a API já usa (`diaDeUso`). Fica mais estrito e alinhado, nunca mais frouxo.

Bloqueantes: nenhum.

Recomendações:
1. Hoje o fuso do Postgres só está declarado no compose. O banco de produção é gerenciado (D26) e costuma vir em UTC, então lá o `check` de `pedido_titular.chegou_em` (`packages/nucleo/drizzle/0032_pedido_titular.sql:43`) continua aceitando, entre 21 h e meia-noite, um dia de São Paulo à frente. O comentário em `apps/api/src/privacidade/privacidade.service.ts:220` já trata o check como segunda camada, mais frouxa, e a API valida antes. Mesmo assim vale um item no `TODO.md` (ou em `docs/infra.md`) para declarar `timezone` no banco gerenciado quando o staging for criado (D42), para que o banco que a escola usa siga o mesmo dia do banco em que o teste roda.
2. A troca da regex pelo texto inteiro em `apps/web/src/areas/coordenacao/privacidade/textos-do-pedido.test.ts` melhorou a prova. Não há nada a exigir aqui. Fica registrado para o `/retro`: os vizinhos que ainda conferem data com regex frouxa merecem o mesmo tratamento.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/tasks/correcoes/2026-10-12-fuso-nos-testes.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/vitest.config.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/infra/compose.yml
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/.env.example
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/TODO.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/apps/web/src/areas/coordenacao/privacidade/textos-do-pedido.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/tools/testes/fuso.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/tools/testes/fuso.int.test.ts

Pergunta de fechamento: a correção não muda o que o sistema guarda sobre um aluno nem para onde isso é enviado. O que já respondia continua respondendo, e o expurgo e o compartilhamento seguem com o fuso declarado na própria consulta.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-12 00:43:14 · `tasks/correcoes/2026-10-12-fuso-nos-testes.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. É uma correção, sem seção de Tech Spec. O que o documento deixa de fora (o fuso da integração, o `compose.carga.yml` e o dia que a web mostra) está declarado nele e repetido no `TODO.md`.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

O que conferi:
- **Código de produção.** Procurei nele o que muda com o fuso da sessão do banco: `current_date`, `::date` sobre `timestamptz`, `to_char`, `date_trunc` e `extract`. Os casts de dia usam `(dia::date)::timestamp at time zone FUSO_DO_USO`, e os `extract(epoch …)` não dependem de fuso. O único `current_date` é o `check` de `pedido_titular` em `packages/nucleo/src/db/schema/pedido-titular.ts:93`, como o documento diz. Ligar `timezone=America/Sao_Paulo` não muda resultado em produção.
- **Compose de carga.** O `compose.carga.yml` troca o `command` do Postgres, mas lê o `.env.example`, que agora traz `POSTGRES_FUSO`. A interpolação `:?` do compose base não quebra o cenário de carga.
- **Novo teste de banco.** O `tools/testes/fuso.int.test.ts` entra no projeto `integracao` (`**/*.int.test.ts`, fora de `infra/**`) e lê o mesmo `urlDoBancoDeTeste()` dos outros testes de integração.
- **Teste de unidade da web.** Em `textos-do-pedido.test.ts`, os instantes de meio-dia de UTC caem no mesmo dia de -12 a +11, e o texto agora é conferido por inteiro, no lugar da expressão regular que aceitava qualquer data.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/tools/testes/fuso.test.ts`: o comentário sobre o `initdb` gravar o fuso no `postgresql.conf` repete quase igual o de `infra/compose.yml`. Basta apontar para o compose.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/tools/testes/fuso.int.test.ts`: a comparação entre `hoje` e `hojeEmSaoPaulo` no primeiro caso só falha entre 21 h e meia-noite em São Paulo. Fora dessa janela, quem prova o fuso é a asserção de `current_setting('TimeZone')`. O documento diz isso, e o código está certo; o comentário do teste poderia dizer também.
- Quem já tem um `.env` local sem `POSTGRES_FUSO` vai ver o `docker compose up` parar em "defina POSTGRES_FUSO". É o comportamento de toda variável `:?`, mas vale um aviso no fechamento da correção.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-12 00:43:34 · `tasks/correcoes/2026-10-12-fuso-nos-testes.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A correção mexe só na configuração de teste e no Postgres do compose local e de teste. Nenhum arquivo em `apps/*/src` ou `packages/*/src` mudou.
Rate limit: ok. A correção não toca nisso.
Fila e prioridade: ok. A correção não toca nisso.
Concorrência: protegida. A correção não toca nisso.
Índice e paginação: ok. A correção não toca nisso.
Degradação de IA: não se aplica
Migration: não se aplica. O `check` `pedido_titular_chegou_em_nao_futura` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/packages/nucleo/drizzle/0032_pedido_titular.sql:43`) continua aceitando o que a API grava, porque ela grava o dia de São Paulo (`diaDeUso`). Em sessão no fuso de São Paulo, o `current_date` é esse mesmo dia; em UTC, ele é igual ou maior.
Métrica e alerta: ok. Não há código novo no caminho quente.
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/infra/compose.carga.yml:34` diz que o resto do comando do Postgres é o de `infra/compose.yml`, e isso deixou de ser verdade: o cenário de carga continua em UTC e não leva o `timezone=`. Ficar em UTC foi decisão declarada da correção. Basta corrigir o comentário, ou repetir o `-c timezone=${POSTGRES_FUSO...}` no comando da carga, para os três ambientes lerem o mesmo dia.
- Agora o banco de teste fica no fuso de São Paulo, e o Postgres gerenciado do staging e da produção (D26) provavelmente nasce em UTC. Hoje nenhuma query de produção depende do fuso da sessão: o código declara o fuso nas consultas (`at time zone FUSO_DO_USO`, `diaDeUso`) e só dois tipos de query não o fazem. Uma converte texto em `::date` e não depende de fuso; a outra é o `check` acima, que funciona nos dois fusos. Mas um `current_date` ou um `::date` que entre depois sem fuso declarado passa no teste e muda de dia na produção entre 21 h e meia-noite. Vale registrar em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/docs/infra.md` (seção de staging) ou no `TODO.md` que o Postgres gerenciado declare `timezone=America/Sao_Paulo`, para o staging se comportar como o teste.

Rodei os testes de unidade alterados com `TZ=UTC` de fora (`tools/testes/fuso.test.ts` e `textos-do-pedido.test.ts`): 27 de 27 passaram, então a declaração do projeto vence o fuso do computador. Os testes de integração (`fuso.int.test.ts`) eu não rodei.

## test-engineer · 1ª rodada · APROVADO · 2026-10-12 00:44:35 · `tasks/correcoes/2026-10-12-fuso-nos-testes.md`

VEREDITO: APROVADO

**Cenários exigidos**
- **Caminho feliz:** a unidade roda num fuso longe de -03, e a sessão do Postgres de teste nasce em São Paulo.
- **Borda: computador fora de São Paulo.** O `TZ` de quem roda (UTC na esteira, Kiritimati, Tóquio) não vence a declaração do projeto.
- **Borda: a janela das 21 h à meia-noite.** O dia que o banco lê não pode ser o dia seguinte de UTC. Isso precisa valer também com um instante fixo, sem depender da hora em que o teste roda.
- **Borda: o teste da web que passava por acaso.** O vermelho medido em Tóquio passa a conferir o texto inteiro do período, num instante que é o mesmo dia de -12 a +11.
- **Regressão:** nenhum teste de unidade nem de integração depende do fuso antigo, e o código de produção não tem `date_trunc`, `::date` ou `current_date` sobre `timestamptz` que mude de sentido com o fuso da sessão.
- **Permissão, isolamento e concorrência:** não se aplicam, porque a correção é de ambiente de teste e não toca dado de escola nem operação concorrente.

**Cobertos**
- **As três mutações do documento** acertam as cláusulas novas do `git diff` (`env.TZ`, `timezone=` no `command`, `POSTGRES_FUSO` no `.env.example`), e cada uma derruba uma asserção específica de `tools/testes/fuso.test.ts`: as linhas 24 e 26 (tirar o `env`), a 39 (tirar o `timezone=`) e a 43 (trocar o `.env.example` para UTC).
- **O que rodei:**
  - `npx vitest run --project unidade` deu 222 arquivos e 3 099 testes verdes. Os logs saem na hora de Tóquio, o que mostra que o `env` chega ao worker.
  - `TZ=Pacific/Kiritimati npx vitest run --project unidade tools/testes/fuso.test.ts apps/web/src/areas/coordenacao/privacidade/` deu 67 testes verdes, então a declaração do projeto vence o computador.
  - `npx vitest run --project integracao tools/testes/fuso.int.test.ts` deu 2 testes verdes contra o Postgres vivo do ambiente de teste.
- **O teste do banco vivo** tem asserção sobre resultado. A segunda prova (`timestamptz '2026-10-10 01:00:00+00'` dando `2026-10-09`) não depende da hora em que roda. A primeira compara `current_date` com `now() at time zone 'America/Sao_Paulo'` na mesma instrução, então não oscila.
- **O teste da web** (`textos-do-pedido.test.ts:326-342`) trocou a expressão regular, que aceitava qualquer data, pelo texto inteiro (`Em 10/09/2026`, `De 10/09/2026 até 20/09/2026`), com meio-dia de UTC como os três vizinhos.
- **Regressão em produção:** conferi o código de produção. Todo `timestamp` do schema é `withTimezone: true`. Os `::date` de produção são de texto já resolvido (`diaDeUso`) ou vêm depois de `at time zone`, e o único `current_date` é o `check` de `pedido_titular`. O fuso da sessão não muda o sentido de nenhuma consulta de produção.
- **O ambiente de teste** lê `.env.example` e `infra/teste.env` (`tools/ci/compose.ts:18`), então o `POSTGRES_FUSO` chega à esteira e ao portão sem depender do `.env` local.
- **Proibidos:** não há `.skip`, teste comentado nem mock, e nenhum provedor de IA está envolvido.

Bloqueantes: nenhum

**Recomendações**
1. **Asserções que não provam nada.** Em `tools/testes/fuso.test.ts:28-29`, os dois `diaEm(..., fuso explícito)` passam em qualquer fuso do processo, porque o `Intl` recebe o `timeZone` na chamada. Só as linhas 24, 26 e 30 provam o fuso do processo. Ou o comentário diz que as duas linhas só ilustram, ou elas saem.
2. **Mutação do banco vivo.** `tools/testes/fuso.int.test.ts` não tem bloco de mutação próprio. Não bloqueia, porque a cláusula do `compose.yml` já é provada pela unidade. Ainda assim, um bloco sobre o `infra/compose.yml` apontando para `fuso.int.test.ts › a sessão nova nasce em America/Sao_Paulo` provaria que o servidor honra a declaração, e não só que ela está escrita.
3. **Cenário de carga em UTC.** O `infra/compose.carga.yml:35` troca o `command` inteiro e continua em UTC. Está declarado fora do escopo, mas nada fixa essa divergência: um caso em `infra/test/carga.test.ts` dizendo que ali o fuso não é declarado, e por quê, evita que alguém conte com São Paulo no cenário de carga.
4. **`.env` local antigo.** Quem tem um `.env` de desenvolvimento sem `POSTGRES_FUSO` vê o `docker compose up` falhar com "defina POSTGRES_FUSO". A mensagem é clara, mas vale uma linha no README ou no `docs/runbook.md`. Fica para o `infra-guardian` julgar.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/tasks/correcoes/2026-10-12-fuso-nos-testes.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/tools/testes/fuso.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/tools/testes/fuso.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/apps/web/src/areas/coordenacao/privacidade/textos-do-pedido.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/vitest.config.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/infra/compose.yml
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/.env.example

## test-engineer · 2ª rodada · APROVADO · 2026-10-12 00:49:29 · `tasks/correcoes/2026-10-12-fuso-nos-testes.md`

VEREDITO: APROVADO

**Cenários exigidos (os mesmos da 1ª rodada):**
- A unidade roda num fuso longe de -03, seja qual for o computador.
- O Postgres de teste declara o fuso da escola e o servidor vivo o honra.
- `current_date` e `::date` dão o dia de São Paulo entre 21 h e meia-noite.
- O caso do período em `textos-do-pedido.test.ts` deixa de depender do fuso, com o texto inteiro conferido.
- Borda: um `.env` sem `POSTGRES_FUSO` faz a subida parar com mensagem (`:?defina`).
- Não se aplicam: permissão, isolamento entre escolas e concorrência. A correção é só de ambiente de teste, não mexe em dado de escola e não tem operação que rode duas vezes.

**Cobertos:**
- **Correção (1):** as duas asserções de `diaEm` que passavam em qualquer fuso saíram de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/tools/testes/fuso.test.ts`. O caso continua vermelho sem a declaração por três asserções que dependem do fuso do processo: `resolvedOptions().timeZone` igual a `Asia/Tokyo`, `getTimezoneOffset()` igual a `-540` e `getDate()` igual a `10`. A 1ª mutação continua chegando à cláusula.
- **Correção (2):** o comentário da linha 32 aponta para o comentário do `postgres` em `infra/compose.yml`. O texto sobre o `initdb` está na linha 9 dele.
- **Correção (3):** o comentário de `fuso.int.test.ts` agora diz que o fuso é provado a qualquer hora pelo `current_setting`, e que o `current_date` só diverge das 21 h à meia-noite.
- **Correção (4):** o comentário de `infra/compose.carga.yml` diz que só o `max_connections` vem do compose principal e que o `timezone=` fica de fora, com o motivo.
- **Correção (5):** o item M2 do `TODO.md` registra que o Postgres gerenciado do staging precisa declarar `timezone=America/Sao_Paulo`, e o efeito sobre o `check` de `pedido_titular.chegou_em`.
- Os três blocos de "Mutações" continuam válidos depois das mudanças: vitest.config, compose e .env.example.
- Rodei os dois testes nesta árvore:
  - `fuso.test.ts`: 2 verdes.
  - `fuso.int.test.ts` contra o Postgres de teste vivo: 2 verdes.
- Nenhum `.skip`, nenhum mock e nenhuma chamada a provedor de IA.
- A recusa do bloco de mutação sobre o servidor vivo está bem justificada: o `mutacoes.ts` não recria o contêiner.

**Bloqueantes:** nenhum.

**Recomendações:**
- A seção "Teste que reproduz" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/tasks/correcoes/2026-10-12-fuso-nos-testes.md:53` ainda diz que o caso "confere ... que o dia das 01 h de UTC é o 10 em Tóquio e o 9 em São Paulo". Depois da correção (1), o teste não confere mais o dia de São Paulo. Trocar por "confere o fuso do processo, o deslocamento de Tóquio e que o dia do computador às 01 h de UTC é o 10".
- O comentário de `fuso.test.ts:24` ainda cita "22 h do dia 9 em São Paulo" sem asserção correspondente. Como explicação está certo, mas pode ler como se fosse conferido.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-12 00:50:24 · `tasks/correcoes/2026-10-12-fuso-nos-testes.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. Esta correção vem da retro do F3 (M2) e não cita seção de Tech Spec. O que ela deixa de fora está escrito no documento da correção e no `TODO.md`.
Portão local: carimbo válido (`node tools/processo/portao-local.ts conferir` aceitou typecheck, lint, segredo, dependências, unidade e alvo para o código atual)
Bloqueantes: nenhum

Conferi as cinco recomendações que a Mesa mandou aplicar. Todas foram feitas:
1. As duas asserções com `diaEm` e o helper saíram de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/tools/testes/fuso.test.ts`. Ficaram `resolvedOptions().timeZone`, `getTimezoneOffset()` e `getDate()`, que dependem do fuso do processo.
2. O comentário do `initdb` em `fuso.test.ts:32` agora aponta para `infra/compose.yml:9-11`, onde a explicação está.
3. O comentário do primeiro caso de `fuso.int.test.ts:29-30` diz que a prova vem da asserção do `TimeZone` e que a comparação de dias só diverge entre 21 h e meia-noite.
4. O comentário de `infra/compose.carga.yml:34-35` não diz mais que o resto do comando é o do compose. Agora ele diz que a opção `timezone=` não vem para a carga.
5. O `TODO.md:521-525` registra que o Postgres gerenciado do staging precisa declarar o fuso. O efeito descrito sobre o `check` de `0032_pedido_titular.sql:43` (`chegou_em <= current_date`) está certo.

A tabela "Recomendações sem aplicar" diz para onde vai cada item ou por que não foi aplicado. Recusar a mutação sobre `infra/compose.yml` faz sentido: `mutacoes.ts` não recria o contêiner, então o teste continuaria verde.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/infra/compose.carga.yml:35`: o novo comentário afirma "nenhuma consulta dele lê `current_date`", e isso é falso.
  - Contraexemplo: a fase do expurgo da própria carga insere `current_date` em `pedido_titular.chegou_em` (`infra/scripts/expurgo-da-carga.ts:211`), e o `check` `pedido_titular_chegou_em_nao_futura` (`packages/nucleo/drizzle/0032_pedido_titular.sql:43`) também lê `current_date`.
  - Hoje isso não quebra nada: a inserção e o `check` rodam na mesma sessão, os dois em UTC, e o `eliminar_em` usa `now()`, que não depende do fuso.
  - Mesmo assim, é exatamente esse o motivo dado para deixar a carga fora da declaração do fuso. Corrija o motivo, por exemplo: "o único `current_date` do cenário é o `chegou_em` da semente do expurgo, que só precisa ser coerente com o `check` na mesma sessão".
- Na mesma linha 34, o comentário passou de cerca de 150 colunas. O resto do arquivo quebra perto de 120.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-12 00:50:25 · `tasks/correcoes/2026-10-12-fuso-nos-testes.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum (só configuração do ambiente de teste e comentários, sem código de produção)
Rate limit: ok (não se aplica, nada mudou)
Fila e prioridade: ok (não se aplica)
Concorrência: protegida (não se aplica)
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica)
Bloqueantes: nenhum. Nenhum foi exigido na 1ª rodada. Conferi as duas recomendações minhas daquela rodada:
- O comentário de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/infra/compose.carga.yml:33-35` está certo. A carga continua em UTC, e o código não depende do fuso da sessão do banco. Os `::date` de `painel.repository.ts` só convertem um texto que chega pronto. Os de `governanca`, `supervisao`, `tutor` e `orcamento` declaram `at time zone ${FUSO_DO_USO}`. Nenhum caminho de produção lê `current_date`.
- O item M2 do `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/TODO.md` agora registra o fuso do Postgres gerenciado no staging (D26, D42). Ele cita o `check` de `pedido_titular.chegou_em` e a API, que recusa antes, como primeira camada (`privacidade.service.ts:220`).

As alterações em `fuso.test.ts` (tirar as duas asserções que passavam em qualquer fuso e apontar o comentário do `initdb` para o compose) e o novo comentário em `fuso.int.test.ts` não mudam o que é provado. Continuam valendo o deslocamento -540, o `getDate()` igual a 10, a declaração `timezone=${POSTGRES_FUSO}` na linha de comando e o `America/Sao_Paulo` da sessão viva.

Recomendações:
- A linha 34 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/infra/compose.carga.yml` passa da largura das outras linhas de comentário do arquivo. Quebrar a linha resolve.
- Mantenho a recomendação da rodada anterior, já anotada na tabela "Recomendações sem aplicar": um caso em `infra/test/carga.test.ts` que diga que a carga não declara o fuso, na próxima tarefa que tocar a carga.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-12 00:51:08 · `tasks/correcoes/2026-10-12-fuso-nos-testes.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. O diff desta rodada mexe só em comentários, em asserções sobre fuso horário, no `TODO.md` e na tabela de recomendações do documento da correção. Nenhum schema, DTO, rota, log ou envio novo.

Fora da tabela de dados do docs/lgpd.md: nada, porque não entra campo novo.

Autorização por objeto: ok. Nenhuma rota nem repository mudou.

Logs: limpos. Os testes leem só `current_setting('TimeZone')`, `current_date` e `now()`, e nenhum dado de pessoa.

Auditoria: presente. Esta correção não cria nenhuma ação que a exija.

Envio externo: nenhum.

Seed/fixture: sintético. Os únicos valores são instantes fixos (`2026-10-10T01:00:00Z`).

Conferi as recomendações da 1ª rodada:
- **Fuso do Postgres gerenciado:** o `TODO.md`, item M2, já registra que no staging (D42/D26) é preciso declarar `timezone=America/Sao_Paulo`. Conferi as citações do texto e elas batem com o código:
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/packages/nucleo/drizzle/0032_pedido_titular.sql:43` tem `CHECK ("pedido_titular"."chegou_em" <= current_date)`.
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/apps/api/src/privacidade/privacidade.service.ts:223` recusa antes do banco, com `diaDeUso(new Date())`.
  
  O registro é exato: entre 21 h e meia-noite o `check` em UTC deixaria passar um dia de São Paulo à frente, mas a API recusa antes.
- **Vizinhos com regex frouxa:** foram para o `/retro`, como recomendei, e estão na tabela "Recomendações sem aplicar".
- **Compose de carga:** o comentário novo de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-12-fuso-nos-testes/infra/compose.carga.yml:34-35` diz que o expurgo declara o fuso, e isso se confirma em `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:124` e `:545`, que usam `at time zone ${fuso}`. A retenção configurável por escola continua sem depender do UTC do contêiner.

Bloqueantes: nenhum.

Recomendações:
- Ao abrir o staging, o item M2 do `TODO.md` deveria virar teste de infra: um que confira que o banco de destino responde `America/Sao_Paulo` em `current_setting('TimeZone')`. Hoje o `check` de `pedido_titular.chegou_em` depende de uma configuração de ambiente que nenhum teste fora do compose local confere. Vale para o `/validar` ou para a tarefa do staging, e não bloqueia esta correção.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-12 00:51:18 · `tasks/correcoes/2026-10-12-fuso-nos-testes.md`

VEREDITO: APROVADO
Tela vista: não (a tarefa não cria nem altera tela; o único arquivo de `apps/web` é `apps/web/src/areas/coordenacao/privacidade/textos-do-pedido.test.ts`, um teste, e ele não mudou desde a rodada anterior. Não há foto, e nada foi fotografado porque não há tela a ver)
Estados: ok (não se aplica; nenhum componente alterado, `periodoDaLinha` e `formatarDiaDoInstante` não são tocados)
Acessibilidade: não se aplica, nenhuma marcação, foco, rótulo ou contraste muda
Chromebook fraco: sem efeito; o diff desta rodada é só comentário, remoção de duas asserções e texto de `TODO.md`. Nada entra no bundle da web
Celular: não se aplica, nenhuma tela nova ou alterada
Ação oficial protegida: sim (nenhuma ação oficial é tocada)

Bloqueantes: nenhum

Conferência das correções da rodada nova (diff `00dbc6c` → `b672788`):
- `tools/testes/fuso.test.ts`: as duas asserções com `diaEm` e o helper saíram. O caso passa a provar o fuso do processo (`resolvedOptions().timeZone` e `getTimezoneOffset() === -540`) e o dia do computador (`getDate() === 10`). Continua falhando se a declaração de `vitest.config.ts` sumir.
- O comentário do `initdb` agora aponta para `infra/compose.yml`. O trecho dele ficou fiel ao que o compose diz.
- `tools/testes/fuso.int.test.ts`: o comentário diz que a comparação só diverge das 21 h à meia-noite e que a asserção do fuso é a que prova a qualquer hora.
- `infra/compose.carga.yml`: o comentário deixa de dizer que o resto do comando é o do compose e diz que o `timezone=` não vem na carga.
- `TODO.md`: registra o Postgres gerenciado do staging (D42, D26) com dono e o motivo.

Recomendações:
- A observação favorável do `frontend-reviewer` e o dia que a tela mostra (o do navegador, `formatarDiaDoInstante`, que pode virar o de São Paulo) já estão na tabela "Recomendações sem aplicar" como decisão de produto. Para o `/validar` e o `/retro`: a coordenação pode ver um dia diferente do que a escola vive se o computador dela estiver em outro fuso, o que é raro, mas pesa na auditoria da privacidade.
