# Achados das revisões — `tasks/prd-lgpd-e-titular/7_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-09 09:44:05 · `tasks/prd-lgpd-e-titular/7_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Configuração.** A subida é recusada com `openai_compat` sem processamento local quando `IA_PROVEDOR_ID` falta, vem vazia ou está fora do formato. Com processamento local, a variável é dispensada, mas o formato continua valendo. O adaptador falso não exige a variável.
- **Provedor resolvido.** Fica nulo no adaptador falso, no modelo local, na `regra_fixa` com adaptador externo e na falha antes de qualquer chamada. Fica com o id no externo (servidor falso) e também na chamada que falhou depois de sair.
- **Tipo.** Os dois pares inválidos (externo sem provedor, provedor sem envio externo) são recusados na porta, na medição e no consumo.
- **Banco.** `provedor` com `envio_externo = false` é recusado. O insert no formato do código anterior (externo sem `provedor`, e local) continua aceito, porque o rollback não pode quebrar.
- **Gravação.** O `ConsumoRepository` grava o provedor, a soma da governança não muda e o registro nunca falha por causa da coluna.
- **Isolamento.** A coluna herda o escopo de `consumo_ia`, e o provedor não sai pelo DTO da governança da coordenação.
- **Concorrência.** Não se aplica: é um insert sem "verifica e depois grava" e sem unicidade nova.
- **Caso de borda (adaptador construído à mão).** O adaptador montado sem passar pela subida não nasce sem o id.

**Cobertos:**
- **Configuração:** `packages/nucleo/src/config/config-ia.test.ts` (`fora da nossa rede, o provedor precisa de id…`, com sete formatos inválidos e cinco válidos, incluindo os limites de 2 e 40; `com processamento local não há provedor a declarar…`) e `apps/api/src/config.test.ts` (`IA_PROVEDOR_ID` na lista de variáveis faltantes de `openai_compat`). O `return` antes da exigência, para adaptador diferente de `openai_compat`, é anterior a esta tarefa e já está coberto pelos testes com `ambienteValido`.
- **Provedor resolvido:** `packages/nucleo/src/ia/provedor.test.ts` cobre externo e local com `AdaptadorRoteirizado`, a falha depois de sair, a regra fixa defeituosa com zero tentativas (mata a mutação `!regraFixa`) e `assunto delicado…` com adaptador externo. `packages/nucleo/src/ia/adaptador-openai-compat.test.ts` cobre o servidor falso fora da rede, o local que ignora o id e o construtor que recusa a falta do id.
- **Tipo:** os quatro `@ts-expect-error` em `provedor.test.ts` são efetivos. O `packages/nucleo/tsconfig.json` inclui `src/**` com os testes, e o `tsc` roda no `typecheck`, então afrouxar a união deixaria as diretivas sem uso e o `tsc` reprovaria.
- **Banco:** `packages/nucleo/src/db/schema/mvp/tabelas-do-mvp.int.test.ts › o provedor só existe onde houve envio externo…` cobre o código 23514 e o nome da restrição, mais os dois formatos antigos.
- **Gravação:** `apps/api/src/ia/ia.int.test.ts › grava o provedor de quem recebeu o conteúdo…` usa quatro formas de chamada, com `resolves` em cada uma e a leitura das linhas no banco. Apagar `provedor: consumo.provedorId` deixa a linha nula e o teste fica vermelho. `apps/api/src/governanca/governanca.int.test.ts › a chamada com provedor entra na soma…` confere os totais +2/+2000/+1000/+1 e que nem o id nem a palavra "provedor" saem na resposta.
- **Tutor:** `apps/api/src/tutor/tutor.int.test.ts` confere `provedor: null` na regra fixa pelo caminho real da API.
- **Mutações:** conferi a tabela contra o diff. Todas as cláusulas novas têm linha e um teste plausível de ficar vermelho, inclusive o `SEM_ENVIO_EXTERNO` do falso e do fixture.
- **Execução e IA:** rodei os quatro arquivos de unidade tocados e o `tsc` do `packages/nucleo`: 198 testes verdes e o `tsc` limpo. Não há `.skip`, teste comentado nem mock de coisa nossa. Nenhum teste chama provedor pago: só o adaptador falso, o roteirizado e o servidor llama falso.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `tasks/prd-lgpd-e-titular/techspec.md:138` diz que o `compose.yml` passa `IA_PROVEDOR_ID` "vazio por padrão". Mas `infra/compose.yml:207` usa `${IA_PROVEDOR_ID:?…}`, que recusa a variável ausente ou vazia, e o `.env.example` traz `provedor-de-exemplo`. O texto deve ser ajustado ao que o código faz.
2. Não há teste de integração ponta a ponta: `ProvedorDeIa` com adaptador externo, gravando por `ConsumoRepository` no Postgres, e a linha saindo com `provedor` preenchido. Hoje a ligação está provada em duas metades (a unidade com `ConsumoEmMemoria`, a integração com o repository direto), e o tipo garante o elo entre elas. Vale um caso no `ia.int.test.ts`, com o roteirizado externo e o banco real.
3. `packages/nucleo/src/db/schema/mvp/tabelas-do-mvp.int.test.ts:1216-1217`: o cabeçalho do bloco fala em "presos por formato", mas `consumo_ia.provedor` não tem check de formato no banco. O formato só vale na subida. Cabe ajustar o comentário, ou discutir com o `privacy-guardian` um check `provedor ~ '^[a-z][a-z0-9_-]{1,39}$'`, que é o mesmo formato da `suboperador.chave`.

Arquivos auditados (principais):
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/7_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/config/config-ia.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/ia/provedor.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/ia/porta.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/ia/adaptador-openai-compat.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0028_consumo_ia_provedor.sql
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/ia/consumo.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/compose.yml

## infra-guardian · 1ª rodada · APROVADO · 2026-10-09 09:45:17 · `tasks/prd-lgpd-e-titular/7_task.md`

VEREDITO: APROVADO

Caminho quente tocado: IA, migration

Rate limit: ok (a tarefa não mexe em rate limit)

Fila e prioridade: ok (não mexe em fila; a execução de IA continua no processo da API, D77)

Concorrência: protegida (nenhum padrão novo de "busca, verifica, grava"; o par `envioExterno`/`provedorId` é garantido pelo tipo `EnvioDaChamada` e pelo check no banco)

Índice e paginação: ok (não há query nova; `consumo_ia.provedor` só é gravado e não é lido)

Degradação de IA: ok. A exigência de `IA_PROVEDOR_ID` falha na subida, em `esquemaAmbienteDeIa` e no construtor de `AdaptadorOpenAICompat`, chamado só em `criarProvedorDeIa` no boot. Nenhum request novo pode falhar por isso. O check do banco não alcança o caminho do aluno, porque o tipo da porta impede o par inválido. Se a gravação falhar mesmo assim, o erro continua saindo como `IA_INDISPONIVEL` tipado, nunca cru.

Migration: compatível. A coluna nova aceita nulo e entra sem reescrever a tabela. O check aceita o insert do código anterior, que nunca grava `provedor`. A exigência contrária ficou para um release posterior, e o teste "formato antigo aceito" está em `tabelas-do-mvp.int.test.ts`.

Métrica e alerta: ok (o caminho quente não ganhou lógica nova que precise de medição; não há alerta novo)

Bloqueantes: nenhum

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0028_consumo_ia_provedor.sql:43`. O `ADD CONSTRAINT ... CHECK` sem `NOT VALID` trava `consumo_ia` com ACCESS EXCLUSIVE e lê a tabela inteira. Ela cresce a cada troca do Tutor. Hoje isso é aceito, porque ainda não há staging nem piloto (techspec §7c). Falta pôr este check na mesma lista pré-staging dos índices `concurrently` que a tarefa 5.0 deixou no `TODO.md`, com arquivo próprio e `NOT VALID` seguido de `VALIDATE`.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/compose.yml:207`. O `${IA_PROVEDOR_ID:?...}` obriga a definir a variável até com processamento local. Já o `.env.example:215` traz `provedor-de-exemplo`, que passa no formato. Quem trocar para `LLM_PROCESSAMENTO_LOCAL=false` e esquecer de mudar o id sobe sem erro e grava um provedor falso em todo consumo. Duas saídas: usar `${IA_PROVEDOR_ID:-}` no compose e deixar o valor vazio no `.env.example`, já que o esquema trata `''` como ausente; ou recusar `provedor-de-exemplo` quando houver envio externo. Com a primeira, a frase "vazio por padrão" de `techspec.md:138`, que o `test-engineer` já apontou, passa a ser verdade.
3. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/techspec.md:390`. A linha "Migration" da §7c ainda fala só da "0024". Falta citar a `0028_consumo_ia_provedor` como a migration que leva a coluna.

## privacy-guardian · 1ª rodada · REPROVADO · 2026-10-09 09:45:22 · `tasks/prd-lgpd-e-titular/7_task.md`

VEREDITO: REPROVADO

Campos pessoais tocados: `consumo_ia.provedor` (coluna nova). O valor sozinho não identifica ninguém. Ligado a `consumo_ia.aluno_id`, ele passa a dizer para qual provedor o dado daquele aluno foi, e é isso que alimenta a lista de compartilhamento do titular (LGPD, art. 18, VII).

Fora da tabela de dados do docs/lgpd.md: `consumo_ia.provedor`. A tarefa só citou a coluna no item 4 da seção de IA (`docs/lgpd.md:255`). O mapa de dados (seção 2) não a menciona, e a linha do consumo por aluno ainda lista só "o id do aluno com a tarefa, o modelo, os tokens, a duração e o resultado da chamada".

Autorização por objeto: ok. A tarefa não cria rota nova e a coluna herda o escopo de `consumo_ia`. O DTO da governança continua explícito e não devolve o provedor. Isso está provado em `apps/api/src/governanca/governanca.int.test.ts`, no teste "a chamada com provedor entra na soma…", que confere que nem o id nem a palavra "provedor" aparecem na resposta.

Logs: limpos. Nenhum log novo foi criado. O motivo `MOTIVO_SEM_PROVEDOR_ID` só aparece como erro na subida da aplicação e não carrega dado de pessoa.

Auditoria: não se aplica. A tarefa não tem leitura, exportação, nota, permissão nem aprovação.

Envio externo: a tarefa não cria envio novo. O que ela faz é registrar o envio que já existe: com envio externo, `consumo_ia.provedor` recebe o `IA_PROVEDOR_ID`. Com o adaptador falso, o modelo local, a regra fixa ou zero tentativas, o campo fica nulo. Três camadas garantem isso:
- o tipo `EnvioDaChamada`, que só aceita os dois pares válidos;
- o check `consumo_ia_provedor_so_no_envio_externo` no banco;
- a exigência de `IA_PROVEDOR_ID` na subida e no construtor do `AdaptadorOpenAICompat`.

Seed/fixture: sintético (`provedor-de-exemplo`, `provedor-roteirizado`, `provedor-<uuid>`).

Bloqueantes:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/docs/lgpd.md:84`
   - **O que está errado:** a coluna nova não entrou no mapa de dados (seção 2). Isso viola a regra 20, item 1 ("Atualizar a tabela faz parte da mesma tarefa"). Viola também a Tech Spec, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/techspec.md:361`, que lista `consumo_ia.provedor` como campo novo a entrar "no mapa **na tarefa da migration**". A migration é a `0028` e está nesta tarefa. A citação na seção de IA não substitui o mapa, porque é o mapa que dá finalidade e retenção a cada campo.
   - **Correção exigida:** incluir `provedor` (e `envio_externo`, que a linha também omite) na linha "Consumo de IA por aluno" do mapa. Precisa dizer:
     - **o que é:** o id do provedor que recebeu o conteúdo, só quando houve envio externo, e nulo no falso, no local e na regra fixa;
     - **finalidade:** responder à escola e ao titular para onde o dado foi (lista de compartilhamento, art. 18, VII; Tech Spec, seção "Compartilhamento");
     - **retenção:** a coluna fica com a linha; depois que o expurgo ou a eliminação anula `aluno_id`, ela deixa de se ligar à pessoa.

     Na linha "Entrada e saída das chamadas de IA" (`docs/lgpd.md:85`), basta remeter à mesma coluna, se ela valer ali.

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/techspec.md:138` diz que o compose passa `IA_PROVEDOR_ID` "vazio por padrão", mas `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/compose.yml:207` usa `:?` e recusa a variável vazia. O `test-engineer` já havia apontado. O texto deve dizer o que o código faz.
2. Cabe um check de formato no banco (`provedor ~ '^[a-z][a-z0-9_-]{1,39}$'`), igual ao da `suboperador.chave`. Hoje o formato só é conferido na subida, e o casamento com o suboperador na lista de compartilhamento depende dele.
3. Cabe um teste de integração de ponta a ponta: `ProvedorDeIa` com adaptador externo, gravando pelo `ConsumoRepository` no Postgres. Hoje a ligação está provada em duas metades.

Pergunta de fechamento: esta tarefa melhora a resposta sobre para onde o dado do aluno foi, porque grava o provedor por chamada. Só que o campo que sustenta essa resposta precisa estar no mapa de dados, e hoje não está. Esse é o único bloqueante.

## llm-integrator · 1ª rodada · APROVADO · 2026-10-09 09:45:44 · `tasks/prd-lgpd-e-titular/7_task.md`

VEREDITO: APROVADO

Perfis usados: nenhum. A tarefa não acrescenta chamada de modelo. Ela só grava qual provedor atendeu a chamada que já existe, e os perfis das tarefas continuam como estavam.

Custo estimado por professor/mês: nenhuma chamada nova, então custo adicional zero. O acréscimo é uma coluna `text` nula por linha de `consumo_ia`, sem efeito mensurável.

Prompt versionado: não se aplica. Nenhum prompt foi tocado.

Validação de schema: sim.
- `IA_PROVEDOR_ID` é validada por regex na subida (`config-ia.ts`).
- O tipo `EnvioDaChamada` impede os dois pares inválidos em tempo de compilação.
- O check `consumo_ia_provedor_so_no_envio_externo` impede o par inválido no banco.
- O construtor do `AdaptadorOpenAICompat` repete a exigência do id para quem monta a configuração à mão.

Aprovação humana no caminho: não se aplica. A tarefa só registra o consumo e não cria entrega de agente.

Bloqueantes: nenhum.

O que conferi, sem encontrar problema:
- **Provedor fora da camada de adaptadores:** nenhum SDK foi tocado, e o id vem só da configuração.
- **Regra fixa e falha antes da chamada:** `provedor.ts › medir` usa `gasto.tentativas > 0 ? adaptador.envio : SEM_ENVIO_EXTERNO`. A regra fixa tem zero tentativas, então sai sem provedor, como antes.
- **Migration compatível com o código anterior (regra 80, item 9):** a migration `0028` só adiciona coluna nula e um check que o código antigo já cumpre. A exigência contrária, envio externo sempre com provedor, ficou fora de propósito, porque quebraria o rollback.
- **Gravação:** `consumo.repository.ts` grava `provedor: consumo.provedorId`. O teste de integração cobre o par externo, a falha depois de sair, o local e a regra fixa, e o `tutor.service.ts` passa `provedorId: null`.
- **Governança:** o teste prova que a soma não muda e que o provedor não aparece na resposta da governança.
- **Teste sem provedor pago:** os testes usam o adaptador falso, o roteirizado e o servidor Llama falso.
- **LGPD:** o id do provedor não é dado de pessoa. `docs/lgpd.md` e `docs/modelo-de-dados.md` foram atualizados na mesma tarefa.
- **Rodei:** `npm run typecheck` passou. Os testes de unidade de `packages/nucleo/src/ia`, `packages/nucleo/src/config` e `apps/api/src/config.test.ts` passaram, 548 testes.
- **Não rodei:** os testes de integração, que dependem de banco.

Recomendações:
- **`infra/compose.yml` (linha da `IA_PROVEDOR_ID`):** a nota da Tech Spec diz "vazio por padrão", mas `${IA_PROVEDOR_ID:?defina IA_PROVEDOR_ID}` recusa variável vazia. Com modelo local o operador é obrigado a preencher um valor que o código ignora, e `tools/ci/ambiente.test.ts` também exige que a variável esteja preenchida em `.env.example`. Ou se corrige a nota, ou se troca por `${IA_PROVEDOR_ID:-}`, que também pede relaxar esse teste. Não bloqueia, porque `.env.example` já traz o valor de exemplo.
- **`apps/api/test/escola-com-tutor.ts:229`:** o ambiente de teste não declara `IA_PROVEDOR_ID`, o que é correto porque ali o processamento é local. Falta um teste de ponta a ponta com `openai_compat` externo e id passando pela API até `consumo_ia`. Hoje isso é coberto em partes, pelo `adaptador-openai-compat.test.ts` (medição e registro) e pelo `ia.int.test.ts` (repository).
- **Estado do processo:** `7_task.md` ainda mostra só o `test-engineer` na tabela de Revisões. Falta a rodada de `revisor-geral`, `llm-integrator`, `infra-guardian` e `privacy-guardian` antes do commit, e o portão local carimbado depois da última alteração.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-09 09:46:26 · `tasks/prd-lgpd-e-titular/7_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência em `techspec.md:138` (a nota «Tarefa 7.0, como ficou no código» descreve o compose de um jeito que o código não segue) e em §3 «Sem ela, a subida é recusada» (essa recusa nunca acontece no ambiente montado a partir do `.env.example`)
Portão local: carimbo válido

Bloqueantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/.env.example:215` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/techspec.md:138`
  - **O que a nota diz e o que o código faz.** A nota diz que o compose passa `IA_PROVEDOR_ID` "(vazio por padrão)". Não é verdade. O `infra/compose.yml:207` usa `${IA_PROVEDOR_ID:?…}`, que recusa valor vazio. O `tools/ci/ambiente.test.ts:30` proíbe o padrão `:-` no compose. E o `.env.example` traz `IA_PROVEDOR_ID=provedor-de-exemplo`.
  - **Por que isso é um furo.** `provedor-de-exemplo` passa no `FORMATO_DO_PROVEDOR_ID`. Um staging ou uma produção montados a partir do `.env.example`, com `IA_ADAPTADOR=openai_compat` e `LLM_PROCESSAMENTO_LOCAL=false`, sobem sem reclamar. A partir daí, cada linha de `consumo_ia.provedor` grava o id falso. A exigência da §3 vira letra morta, e o registro de para onde foi o dado do aluno passa a ser falso, que é justamente o que a tarefa existe para evitar (LGPD, art. 18, VII).
  - **Fora da lista do `TODO.md`.** O valor também não entrou na lista do `TODO.md:222`, «Valores que o staging e a produção não herdam do `.env.example`», na metade "o que o boot aceita". É esse o mecanismo que o projeto usa para placeholder sintético que sobe em produção.
  - **Correção exigida, em duas partes.**
    - (a) Corrigir a nota em `techspec.md:138` para dizer o que o compose faz: valor obrigatório, com placeholder no `.env.example`.
    - (b) Fechar o furo. O preferível é recusar na subida o valor de exemplo quando `AMBIENTE` não for `local`, com teste em `config-ia.test.ts`. Se a escolha for não recusar, o mínimo é registrar `IA_PROVEDOR_ID` no item do `TODO.md:222`, na metade dos valores sintéticos que a subida aceita, junto com a consequência: provedor falso no registro do titular.

Recomendações:
- `packages/nucleo/src/db/schema/consumo-ia.ts:94` e a migration `0028`: a coluna `provedor` não tem check de formato no banco. As colunas que ficam junto dela em `tabelas-do-mvp.int.test.ts:1216`, no grupo "presos por formato", têm. Duas saídas:
  - acrescentar `provedor is null or provedor ~ '^[a-z][a-z0-9_-]{1,39}$'`, o mesmo formato da `suboperador.chave` com que ela vai ser cruzada no F3;
  - ou tirar `provedor` desse grupo do comentário, que hoje afirma algo falso sobre ela.
- `packages/nucleo/src/ia/adaptador-openai-compat.ts:98`: lançar `new ConfiguracaoInvalida(['IA_PROVEDOR_ID'], [MOTIVO_SEM_PROVEDOR_ID])`, para quem monta a configuração à mão receber o mesmo motivo que a subida dá.
- `apps/api/src/ia/ia.int.test.ts:415`: o caso "o registro nunca falha por causa da coluna" só confere quatro combinações válidas. Vale dizer no nome do teste que a garantia vem do tipo `EnvioDaChamada` e do check, e não de um tratamento no repository.

## test-engineer · 2ª rodada · APROVADO · 2026-10-09 09:53:03 · `tasks/prd-lgpd-e-titular/7_task.md`

VEREDITO: APROVADO

**Cenários exigidos (para o que mudou nesta rodada):**
- Caminho feliz: com `AMBIENTE=local`, o valor de exemplo `IA_PROVEDOR_ID=provedor-de-exemplo` continua subindo e vai para o `provedorId`.
- Recusa: em `staging` e em `producao`, com envio externo, a subida recusa o valor de exemplo. O erro aponta a variável e traz o motivo `MOTIVO_PROVEDOR_ID_DE_EXEMPLO`.
- Borda: em produção com `LLM_PROCESSAMENTO_LOCAL=true`, o valor de exemplo não é recusado, porque não há provedor externo.
- Borda: o construtor do `AdaptadorOpenAICompat` montado à mão sem `provedorId` lança o erro com o motivo `MOTIVO_SEM_PROVEDOR_ID`, e não só com o nome da variável.
- Isolamento: esta rodada não toca dado de escola, e o isolamento do `consumo_ia` foi aprovado na 1ª rodada sem mudança. Concorrência também não se aplica: é validação de configuração na subida.

**Cobertos:**
- `packages/nucleo/src/config/config-ia.test.ts:108-114` cobre os três primeiros cenários. As três linhas novas da seção "Mutações" batem com a cláusula nova em `config-ia.ts:102`:
  - Sem o termo `AMBIENTE !== 'local'`, a asserção da linha 112 falha.
  - Trocando `=== PROVEDOR_ID_DE_EXEMPLO` por `false`, a da linha 110 falha.
  - Sem o termo `LLM_PROCESSAMENTO_LOCAL !== 'true'`, a da linha 113 falha.
- `packages/nucleo/src/ia/adaptador-openai-compat.test.ts:117` cobre o quarto cenário. Confirmei com um teste avulso na pasta temporária que o vitest 5 aceita `expect.objectContaining` dentro de `toThrow` e falha quando o erro vem sem o motivo. Se o 2º argumento de `ConfiguracaoInvalida` for apagado, o teste fica vermelho.
- O caso renomeado em `apps/api/src/ia/ia.int.test.ts:414` diz o que já é provado em outros lugares:
  - o check do banco, em `tabelas-do-mvp.int.test.ts:1414-1417`;
  - os quatro `@ts-expect-error` de `provedor.test.ts:112-118`.
- As recomendações da 1ª rodada foram tratadas:
  - a nota do compose na Tech Spec foi corrigida (`techspec.md:216`);
  - o teste de ponta a ponta foi recusado, com o motivo registrado em "Recomendações sem aplicar";
  - o comentário "presos por formato" foi ajustado em `tabelas-do-mvp.int.test.ts:1217`.
- Rodei `config-ia.test.ts`, `adaptador-openai-compat.test.ts` e `apps/api/src/config.test.ts`: 160 testes passaram. Não há `.skip` nem mock que esconda a regra, e nenhum teste chama provedor pago.

**Bloqueantes:** nenhum.

**Recomendações:**
- `config-ia.test.ts:108`: falta um caso com `IA_ADAPTADOR=falso` em staging e o valor de exemplo. Ele prenderia que a recusa só vale com `openai_compat`. Hoje, se alguém subir a linha da recusa para antes do `return` de `config-ia.ts:98`, o teste não pega, porque o `.env.example` traz `LLM_PROCESSAMENTO_LOCAL=true`. Cobertura extra, não bloqueia.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/config/config-ia.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/config/config-ia.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/ia/adaptador-openai-compat.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/ia/adaptador-openai-compat.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/ia/ia.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/7_task.md

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-09 09:53:41 · `tasks/prd-lgpd-e-titular/7_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum novo nesta rodada. A tarefa acrescenta `consumo_ia.provedor` e passa a gravar `envio_externo`. Os dois guardam o id do suboperador de IA, que não é dado de pessoa. Eles se ligam ao aluno pela linha, por meio de `aluno_id`, enquanto esse campo não é anulado.

Fora da tabela de dados do docs/lgpd.md: nenhum. A correção exigida na 1ª rodada foi feita. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/docs/lgpd.md:84` agora inclui `envio_externo` e `provedor` e diz:
- **O que é:** o id de quem recebeu o conteúdo, vindo de `IA_PROVEDOR_ID`. Fica nulo no adaptador falso, no modelo local, na regra fixa e na chamada que falhou antes de sair.
- **Finalidade:** a lista de compartilhamento do titular (LGPD, art. 18, VII).
- **Retenção:** o `provedor` acompanha a linha. Depois que o expurgo ou a eliminação anula `aluno_id`, ele deixa de se ligar a uma pessoa.

Autorização por objeto: ok. A rodada não cria nem altera rota.

Logs: limpos. O diff não acrescenta log. As mensagens novas de motivo (`MOTIVO_PROVEDOR_ID_DE_EXEMPLO`, `MOTIVO_SEM_PROVEDOR_ID` no construtor) só trazem nome de variável de configuração.

Auditoria: presente onde a regra exige. Esta rodada não tem ação sujeita a auditoria.

Envio externo: a rodada não muda o que sai nem o destino. O registro ficou mais confiável em dois pontos:
- Em `packages/nucleo/src/config/config-ia.ts:110`, a subida recusa o placeholder `provedor-de-exemplo` fora de `AMBIENTE=local` quando há envio externo. Assim, `consumo_ia.provedor` deixa de poder gravar um provedor que não recebeu o conteúdo. O teste em `config-ia.test.ts` cobre staging, produção, local e processamento local em produção.
- O construtor do `AdaptadorOpenAICompat` passa a lançar o erro com o motivo, e o teste confere isso.

O check `consumo_ia_provedor_so_no_envio_externo` da migration 0028 continua como estava.

Seed/fixture: sintético. Os valores usados são `provedor-de-teste`, `provedor-roteirizado` e `provedor-de-exemplo`.

Pergunta de fechamento: para a parte desta tarefa, o código responde. Cada chamada em `consumo_ia` diz se o conteúdo saiu e para qual provedor. Enquanto `aluno_id` existe, isso se liga ao aluno. Depois do expurgo, o dado deixa de ser pessoal.

Bloqueantes: nenhum.

Recomendações:
1. `docs/lgpd.md:84`: a linha se chama "Consumo de IA por aluno", com titular "aluno", mas `provedor` e `envio_externo` valem para toda chamada, inclusive as do professor (geração de atividade, adaptação, proposta de ferramenta). Vale citar o professor como titular indireto, ou remeter à linha de entrada e saída (linha 85), para a lista de compartilhamento do professor também apontar para cá.
2. O check de formato de `provedor` no banco foi adiado para a tarefa 8.0, e o motivo está registrado em `7_task.md`. Quando `suboperador.chave` nascer lá, é preciso confirmar que o cruzamento entre `provedor` e o cadastro de suboperadores existe. É esse cruzamento que transforma o id em "para onde foi" na resposta ao titular.
3. A recusa do teste de ponta a ponta tem motivo plausível: o elo entre as duas metades é o tipo, preso por `@ts-expect-error`. Fica para o `/validar` conferir que o portão completo cobre o caminho real, com `ProvedorDeIa` gravando pelo `ConsumoRepository`.

## llm-integrator · 2ª rodada · APROVADO · 2026-10-09 09:53:55 · `tasks/prd-lgpd-e-titular/7_task.md`

VEREDITO: APROVADO

Perfis usados: nenhum novo. A tarefa 7.0 não adiciona chamada de modelo. Ela só grava `consumo_ia.provedor` nas chamadas que já existem, e cada uma mantém o perfil que já declara.

Custo estimado por professor/mês: R$ 0 a mais. Não há chamada nova, só uma coluna de texto curto por linha de `consumo_ia`.

Prompt versionado: não se aplica (a tarefa não mexe em prompt).

Validação de schema: sim. A subida valida `IA_PROVEDOR_ID` por regex. O tipo da porta une `envioExterno` e `provedorId`. O banco tem o check `provedor is null or envio_externo`.

Aprovação humana no caminho: não se aplica. Nenhuma entrega de agente é criada ou alterada.

Bloqueantes: nenhum.

Conferi no código as três correções da rodada anterior.
- **Placeholder do `.env.example`:** `config-ia.ts:102` recusa `IA_PROVEDOR_ID=provedor-de-exemplo` quando há envio externo (`LLM_PROCESSAMENTO_LOCAL !== 'true'`) e `AMBIENTE !== 'local'`. `AMBIENTES_DO_SISTEMA` é `local`, `staging` e `producao`, então staging e produção ficam cobertos. O teste novo cobre os dois ambientes recusados, local aceito e processamento local em produção sem erro.
- **Motivo no construtor:** o `AdaptadorOpenAICompat` passa `MOTIVO_SEM_PROVEDOR_ID` como segundo argumento de `ConfiguracaoInvalida` (`adaptador-openai-compat.ts:98`). A assinatura aceita `motivos`, e o teste confere `motivos`.
- **Documentação e `compose.yml`:** a Tech Spec, `docs/lgpd.md`, o `TODO.md` e o `.env.example` estão coerentes com o código. A tabela de mutações e a de recomendações sem aplicar foram atualizadas. A recusa de trocar `:?` por `:-` no `compose.yml` tem motivo válido: `tools/ci/ambiente.test.ts` proíbe o `:-`, e o placeholder já não grava provedor falso fora de local.

Recomendações (não bloqueiam):
- A guarda barra só o valor literal `provedor-de-exemplo`. Outro placeholder copiado à mão passaria. O cruzamento com `suboperador.chave` na tarefa 8.0 resolve isso de vez.
- O check de formato de `provedor` no banco ficou para a 8.0, como a tarefa já registra.
- O teste de ponta a ponta de `ProvedorDeIa` até o Postgres foi recusado com motivo. Vale reavaliar quando o fixture roteirizado for exportado.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/config/config-ia.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/ia/adaptador-openai-compat.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/7_task.md`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-09 09:53:55 · `tasks/prd-lgpd-e-titular/7_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

As duas correções exigidas na 1ª rodada foram feitas:
- **(a) Nota da Tech Spec.** `tasks/prd-lgpd-e-titular/techspec.md:138` agora diz que o compose passa `IA_PROVEDOR_ID` como valor obrigatório (`${IA_PROVEDOR_ID:?…}`) e que o placeholder do `.env.example` é recusado na subida fora de `AMBIENTE=local`. O texto bate com `infra/compose.yml` e com `.env.example:214-216`. A linha de Migration da seção de infra também passou a citar a 0028.
- **(b) Furo do valor de exemplo.** `packages/nucleo/src/config/config-ia.ts:102` recusa `provedor-de-exemplo` quando três condições valem juntas: `AMBIENTE` diferente de `local`, adaptador `openai_compat` (a verificação fica depois do `return` da linha 96) e envio externo.
  - `AMBIENTE` é obrigatório no esquema e no compose, então ausência de valor não abre caminho.
  - `AMBIENTES` tem só `local`, `staging` e `producao`.
  - O teste em `config-ia.test.ts:108` cobre staging, produção, local e produção com processamento local.
  - A tabela de mutações de `7_task.md` ganhou as três linhas novas.
- **Recusas registradas.** As recomendações recusadas ou adiadas estão em "Recomendações sem aplicar" com motivo. O check de formato no banco foi para a 8.0. A troca de `:?` por `:-` no compose foi recusada porque `tools/ci/ambiente.test.ts` proíbe `:-`.

Recomendações:
- `packages/nucleo/src/config/config-ia.test.ts:108-111` escreve `'provedor-de-exemplo'` como texto fixo em vez de ler o valor do `.env.example`. O teste da linha 44 já faz o parse desse arquivo. Se alguém trocar o placeholder no `.env.example`, a recusa da linha 102 deixa de valer sem nenhum teste ficar vermelho. A correção é conferir que `exemplo.IA_PROVEDOR_ID === PROVEDOR_ID_DE_EXEMPLO`.
- `config-ia.ts:101-102`: as duas condições seguidas repetem `LLM_PROCESSAMENTO_LOCAL !== 'true'`. Colocar as duas dentro de um único `if` deixa a leitura mais fácil.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-09 09:54:05 · `tasks/prd-lgpd-e-titular/7_task.md`

VEREDITO: APROVADO
Caminho quente tocado: IA (somente a validação de configuração na subida; nada mudou no caminho da requisição)
Rate limit: ok (não foi alterado nesta rodada)
Fila e prioridade: ok (não foi alterada nesta rodada)
Concorrência: protegida (nenhuma operação nova de busca, verificação e gravação)
Índice e paginação: ok (nenhuma consulta nova)
Degradação de IA: ok (gateway, limitador, timeout e recuo continuam iguais; a mudança no construtor de `AdaptadorOpenAICompat` só põe o motivo no erro de configuração da subida)
Migration: compatível (a 0028 está igual à da 1ª rodada; a ressalva de `NOT VALID`/`VALIDATE` a partir do staging foi para o `TODO.md` e para a §7c da Tech Spec)
Métrica e alerta: ok (nenhum código novo mede latência ou erro, e nenhum alerta foi criado)
Bloqueantes: nenhum

Conferência das recomendações da 1ª rodada:
- **`NOT VALID` da 0028 na lista do que falta antes do staging, no `TODO.md`:** feita, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/TODO.md:101-103`.
- **Tech Spec §7c citar a 0028:** feita, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/techspec.md:390`.
- **`${IA_PROVEDOR_ID:?…}` no compose:** a recusa se sustenta.
  - `tools/ci/ambiente.test.ts` proíbe o padrão `:-`.
  - A nova regra em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/config/config-ia.ts:102` recusa `provedor-de-exemplo` fora de `AMBIENTE=local` quando há envio externo. O placeholder deixa de gravar um provedor falso em `consumo_ia.provedor` em staging e produção.
  - A regra vale só com `IA_ADAPTADOR=openai_compat` (há um `return` na linha 96), e os ambientes possíveis são só `local`, `staging` e `producao`. Por isso a esteira e o ambiente local não quebram.
  - O caso tem teste em `config-ia.test.ts`, com os três termos da condição na matriz de mutação de `7_task.md`.

Recomendações:
- A regra só pega o texto exato `provedor-de-exemplo`. Outro placeholder qualquer que siga o formato passa na subida. Quando a tarefa 8.0 criar `suboperador.chave`, vale conferir na subida, ou no cruzamento, que `IA_PROVEDOR_ID` corresponde a um suboperador cadastrado.
