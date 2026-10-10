# Achados das revisões — `tasks/correcoes/2026-10-10-listas-fechadas-de-teste-do-f3.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-10 09:36:18 · `tasks/correcoes/2026-10-10-listas-fechadas-de-teste-do-f3.md`

VEREDITO: REPROVADO

Cenários exigidos:
- Caso 1: a lista fechada de rotas de `/v1/privacidade` tem a rota de cancelamento e falha se uma rota nova aparecer sem entrar na lista. A permissão do cancelamento precisa estar provada em outro teste.
- Caso 2: a sentinela do Assistente aceita `titulares.repository.ts`. Como esse arquivo é do módulo de privacidade, que a coordenação usa, ele não pode ler o conteúdo da conversa do professor (regra 70, item 8; D64), e o teste precisa falhar se passar a ler, de qualquer jeito.
- Caso 3: a lista fechada de métricas com `escola_id` tem as duas métricas novas, com os nomes do catálogo.

Cobertos:
- Caso 1. A rota entrou na ordem do controller (`privacidade.controller.ts:135`). O teste citado no comentário existe: `apps/api/test/eliminacao-agendada.int.test.ts:781`, "só a coordenação cancela". Rodei o caso isolado e ele passa.
- Caso 3. As duas chaves existem em `packages/nucleo/src/telemetria/metricas.ts:134,141`, estão em `METRICAS_COM_ESCOLA` (`:159-160`) e a unidade já as conhecia (`metricas.test.ts:149-150`). Não rodei o teste de infra: ele leva uns 114 s e precisa da observabilidade de pé. Pela leitura do diff, a mudança só acrescenta à lista.
- Caso 2, em parte. A lista está certa, e rodei o caso isolado: passa. As duas mutações do registro seriam pegas: tirar o arquivo da lista, e qualquer código que escreva `conteudo` (como `m.conteudo is not null`).
- Não há `.skip`, mock nem chamada a provedor de IA. Não há operação concorrente envolvida.

Bloqueantes:
- `apps/api/src/assistente/assistente.int.test.ts:327`. A guarda que entrou para compensar a liberação é `not.toMatch(/conteudo/i)` sobre o arquivo inteiro. Ela só pega leitura que escreve o nome da coluna. Um jeito comum de ler o conteúdo neste mesmo arquivo passaria verde:
  - `this.banco.select().from(mensagemAgente)` (drizzle, que o arquivo já usa para `usuario`);
  - `select m.* from mensagem_agente m`;
  - `select * from mensagem_agente`.

  Antes desta correção, qualquer leitura nova dessas tabelas no módulo de privacidade quebrava a sentinela. Agora o arquivo inteiro está liberado. A falha mais provável nele é o arquivo do titular (13.0) passar a levar as mensagens do professor. A coordenação veria a conversa (regra 70, item 8), e o teste não falharia. Ou seja, o título do caso ("a contagem nunca lê o conteúdo") não está provado.

  **Correção exigida:** prender o arquivo à forma de contagem, além de proibir `conteudo`. Por exemplo, no texto sem comentários de `titulares.repository.ts`:
  - (a) não aparecem `mensagemAgente` nem `threadAgente`, para impedir o select do drizzle;
  - (b) `mensagem_agente` aparece uma vez só, na forma `count(*)::int from mensagem_agente`, por exemplo com `toMatch(/count\(\*\)::int from mensagem_agente m\b/)` e o número de ocorrências igual a 1;
  - (c) não aparece `m.*` nem `select *`.

  Depois, registrar no arquivo da correção, na seção que lista as mutações, as duas que a guarda nova pega: trocar a contagem por `select().from(mensagemAgente)` e por `select m.* … from mensagem_agente m`, as duas com o caso vermelho.

Recomendações:
- `/conteudo/i` vale para o arquivo inteiro. Se outra consulta dele precisar um dia da coluna `conteudo` de outra tabela (`mensagem_tutor`, por exemplo, para o titular aluno), a sentinela vai acusar à toa. Com a guarda presa à forma da contagem do bloqueante, dá para tirar ou estreitar essa expressão.
- `.processo/` e a nota do `/retro`: a causa (o portão da tarefa não roda lista fechada de arquivo que a tarefa não alterou) vai voltar a cada rota, métrica ou leitor novo. Vale registrar no `/retro` que a tarefa que acrescenta rota em `/v1/privacidade`, métrica em `METRICAS_COM_ESCOLA` ou leitor de `mensagem_agente`/`thread_agente` precisa tocar o teste da lista fechada correspondente.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-10 09:37:09 · `tasks/correcoes/2026-10-10-listas-fechadas-de-teste-do-f3.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A correção mexe só em três listas fechadas de teste e não toca código de produção, `Nota`, correção nem entrega. Todos com autor humano: sim (nenhum caminho novo).
Decisão autônoma sobre aluno: ausente.
Aprovação registrada: ok. Nenhum fluxo de saída de IA mudou.
Supervisão do tutor: ok. Nada no tutor mudou.
Autonomia declarada e visível: sim. Não mudou.

**Item 9: o único ponto que exigia olhar**

A sentinela do Assistente agora aceita um terceiro arquivo que lê as tabelas da conversa do professor: `apps/api/src/privacidade/titulares.repository.ts`. Conferi o que isso abre.

- **A consulta só conta.** `titulares.repository.ts:174-176` faz `count(*)` de `mensagem_agente` junto com `thread_agente`, filtrando pelo `usuario_id` dono da conversa. Não seleciona `conteudo` nem outra coluna.
- **A coordenação nunca vê a contagem de um professor.** `contagemPorCategoria` tem só duas chamadas:
  - `privacidade.service.ts:202-204` (a prévia que a coordenação abre): com `papel === 'professor'`, a função sai antes da contagem e devolve só as categorias de cadastro e vínculo (D64). Isso já está provado em `apps/api/test/pedido-titular.int.test.ts:577-578`, que compara a prévia de quem usou a IA com a de quem não usou.
  - `privacidade.service.ts:375` (`meusDados`): a pessoa vê a própria contagem, pelo id da sessão.
- **A nova verificação funciona.** A asserção `not.toMatch(/conteudo/i)` sobre o repository, com os comentários tirados, ficaria vermelha se a consulta passasse a citar o conteúdo. A correção registra que essa troca foi feita de propósito, deu vermelho e foi desfeita.

As outras duas listas não tocam a regra 70:
- **Rota `cancelar`:** a permissão está provada em `eliminacao-agendada.int.test.ts`.
- **Métricas `horas_em_preparacao` e `horas_vencida`:** são por escola, sem rótulo de usuário.

Bloqueantes: nenhum.

Recomendações:
- A verificação de `conteudo` só procura a palavra. Um `select m.*` ou outro nome para a coluna passaria sem ser pego. Se a contagem crescer, vale trocar por uma checagem que confira as colunas lidas da consulta, em vez de procurar texto.
- A sentinela só varre `apps/api/src`. `packages/nucleo/src/titular/leitura-do-titular.ts:209-215` lê `conteudo` de `mensagem_agente`. Isso já existia antes desta correção: o arquivo vem da tarefa 13.0, e na versão da coordenação o trecho fica de fora pelo `naVersao` (linhas 211 e 445). Mesmo assim, fica fora do alcance da sentinela. Vale estender a varredura a `packages/nucleo/src`, com esse arquivo na lista e a garantia da versão da coordenação apontada no comentário.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/assistente/assistente.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/retencao.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/test/metricas.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/titulares.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.service.ts`

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-10 09:37:30 · `tasks/correcoes/2026-10-10-listas-fechadas-de-teste-do-f3.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A correção só mexe em três listas fechadas de teste. Não há migration, DTO, rota nem log novo, e nenhum código de produção mudou.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok.
- A rota `POST /v1/privacidade/pedidos/:id/cancelar` entrou na lista fechada, na ordem do controller (`apps/api/src/privacidade/privacidade.controller.ts:135-141`, `@Permite('privacidade_pedidos', 'cancelar')`).
- A permissão do cancelamento está provada em `apps/api/test/eliminacao-agendada.int.test.ts:781`: o professor e o aluno são recusados e o pedido continua `agendado`.
- O caso logo acima, na linha 777, prova que o pedido da própria coordenação recebe `NAO_ENCONTRADO`, a mesma resposta de quem não existe.

Logs: limpos. A correção não toca log.

Auditoria: presente. A correção não muda auditoria. Conferi os dois lugares que chamam a contagem:
- `previaDoTitular` (`apps/api/src/privacidade/privacidade.service.ts:196-207`) continua auditada como `titular.previa_lida`.
- `meusDados` (`:369-385`) é a pessoa lendo os próprios dados, sem auditoria, como está declarado.

Envio externo: nenhum.

Seed/fixture: sintético. O teste insere só `'{"tipo":"texto","texto":"oi"}'` e ids gerados.

Conferências que interessam à regra 20:
- Liberar `apps/api/src/privacidade/titulares.repository.ts` na sentinela do Assistente não abre exposição hoje:
  - A única consulta que toca `mensagem_agente` e `thread_agente` é a contagem (`apps/api/src/privacidade/titulares.repository.ts:174-176`). Ela faz `count(*)` pelo dono da thread, com escopo de escola, e não lê `conteudo`.
  - A prévia de professor volta antes da contagem (`privacidade.service.ts:202-204`, D64), e isso tem prova de comportamento em `apps/api/test/pedido-titular.int.test.ts:585`.
  - As duas respostas passam por esquema de saída explícito (`esquemaRespostaPreviaDoTitular`, `esquemaRespostaMeusDados`), que só leva `{categoria, quantidade}`.
- As duas métricas que entraram na lista com `escola_id` são horas por escola, sem rótulo de usuário. O mesmo caso continua exigindo que nenhuma série tenha `usuario_id` nem rótulo de usuário (`infra/test/metricas.int.test.ts:219-222`).

Bloqueantes: nenhum.

Recomendações:
- Concordo com o bloqueante do `test-engineer` (1ª rodada) em `apps/api/src/assistente/assistente.int.test.ts:327`. A guarda `not.toMatch(/conteudo/i)` não pega `select().from(mensagemAgente)`, `select m.*` nem `select *` dentro de um arquivo que a rota da coordenação usa. Pelo lado da privacidade, o risco de hoje está contido pelo DTO e pelo teste de comportamento da D64. Mesmo assim, a sentinela estrutural ficou mais fraca para o módulo da coordenação, e a correção exigida por ele resolve isso: prender o arquivo à forma `count(*)::int from mensagem_agente m`, com uma ocorrência só, sem `mensagemAgente`/`threadAgente` e sem `*`. Não abro bloqueante em duplicidade. Na próxima rodada, confiro se essa guarda entrou.
- A sentinela só varre `apps/api/src`. A outra leitura de `mensagem_agente` que chega à coordenação, a versão `coordenacao` do arquivo do titular, fica em `packages/nucleo/src/titular/leitura-do-titular.ts`, fora da varredura. O documento dela diz que essa versão não leva a conversa do professor (linha 29), e `leitura-do-titular.test.ts` e `arquivo-do-titular.int.test.ts` tocam a tabela. Vale confirmar no `/validar` que um deles prova que a versão `coordenacao` sai sem `thread_agente`/`mensagem_agente` mesmo quando o professor tem conversa.
- Para o `/retro`, reforçando o que o `test-engineer` já disse: a tarefa que acrescenta rota em `/v1/privacidade`, métrica em `METRICAS_COM_ESCOLA` ou leitor de `mensagem_agente`/`thread_agente` precisa tocar o teste da lista fechada correspondente. O portão da tarefa não roda esses testes sozinho.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/assistente/assistente.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/retencao.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/infra/test/metricas.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/titulares.repository.ts (lido)
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.service.ts (lido)

## test-engineer · 2ª rodada · APROVADO · 2026-10-10 09:45:01 · `tasks/correcoes/2026-10-10-listas-fechadas-de-teste-do-f3.md`

VEREDITO: APROVADO

Cenários exigidos (rodada 2, sobre o diff r1→r2 e a correção que exigi na rodada 1):
- A guarda sobre `titulares.repository.ts` precisa pegar uma leitura que traz linhas de `mensagem_agente` sem escrever o nome `conteudo`. São três casos:
  - leitura pelo drizzle: `select().from(mensagemAgente)`;
  - `select m.* … from mensagem_agente m`;
  - `select * from mensagem_agente`.
- O arquivo da correção precisa registrar essas mutações, com o caso vermelho de cada uma.
- `retencao.int.test.ts` e `metricas.int.test.ts` não mudaram desde a rodada 1 e não foram reauditados.

Cobertos:
- **(a) Identificador do drizzle.** `apps/api/src/assistente/assistente.int.test.ts:330` proíbe `mensagemAgente` e `threadAgente`. Isso pega `select().from(mensagemAgente)`.
- **(b) Uma ocorrência só, na forma de contagem.** A linha 331 exige exatamente uma ocorrência de `mensagem_agente` no arquivo. A linha 332 exige a forma `count(*)::int from mensagem_agente m`. Uma segunda consulta à tabela, em qualquer forma, fica vermelha.
- **(c) Sem `*`.** A linha 333 proíbe `m.*` e `select *`.
- **Proibição de `conteudo`.** Continua na linha 329.
- **Contra o repository atual.** Linhas 174 a 176: a única ocorrência é a contagem, sem `*` e sem identificador do drizzle. `thread_agente` não tem coluna de conteúdo (só id, escola, ano, usuário, agente e `criadaEm`), então liberar o nome dela em SQL não abre leitura do texto.
- **Mutações no documento da correção.** `tasks/correcoes/2026-10-10-listas-fechadas-de-teste-do-f3.md:57-66` registra as três mutações da guarda de forma, mais a do `*` isolada, cada uma com a mensagem que acusa e o `git checkout` que a desfez.
- **O que rodei:**
  - O caso "fora de teste…" está verde na árvore.
  - Mutação: troquei `count(*)::int from mensagem_agente m` por `m.* from mensagem_agente m`. O caso ficou vermelho com `a leitura de mensagem_agente no repository do titular não é a contagem`.
  - Desfiz a mutação com `git checkout -- apps/api/src/privacidade/titulares.repository.ts`. O `git status` voltou ao estado de antes.
- **Sem pendência.** Nenhum `.skip` e nenhum mock: o teste lê o arquivo de produção. Não há operação concorrente envolvida.

Bloqueantes: nenhum.

Recomendações:
- **`assistente.int.test.ts:332-333`.** A guarda é textual. Ela não pega uma função que serializa a linha inteira sem citar coluna nem `*`, como `to_jsonb(m)`, `row_to_json(m)` ou `json_agg(m)`, ao lado de um `count(*)::int from mensagem_agente m` que continua igual. Hoje isso exigiria uma mutação deliberada e não há esse uso no repository. Ainda assim, vale proibir também `\b(to_jsonb|row_to_json|json_agg|jsonb_agg)\s*\(\s*m\b` ou, mais simples, qualquer `m.` que não seja `m.escola_id` ou `m.thread_id`. Fica para o `/retro`.
- **A cadeia de cinco asserções sobre o mesmo arquivo para na primeira que falha.** O documento já declara isso, e a asserção do `*` foi provada isolada. Dá para manter assim. Se a guarda crescer, uma lista de proibições num `it.each` faria cada mutação acusar pelo próprio nome.
