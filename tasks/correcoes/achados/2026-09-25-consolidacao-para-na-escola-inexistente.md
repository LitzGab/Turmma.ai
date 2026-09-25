# Achados das revisões — `tasks/correcoes/2026-09-25-consolidacao-para-na-escola-inexistente.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-25 08:17:01 · `tasks/correcoes/2026-09-25-consolidacao-para-na-escola-inexistente.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- Caminho feliz: uma escola real é consolidada junto de uma escola que não existe no banco, com contador e pasta.
- Borda de domínio: escola eliminada (a pasta vazia volta toda noite); banco recriado com o storage antigo (o sintoma original); valor inválido no contador (texto, dia que não existe, número negativo); erro de storage numa pasta só; storage fora (várias pastas seguidas com erro); pastas com erro espalhadas, que não podem ser tratadas como storage fora.
- Controle: banco fora não pode virar "escola inexistente" (conexão recusada, 57P01).
- Idempotência (D49): a reexecução não muda nada, e o contador órfão fica no Redis até vencer.
- Privacidade: o log sai só com id, sem mensagem nem valor de linha.
- Isolamento: a escola seguinte à que foi recusada é consolidada. Esse é o núcleo da regra 80, item 3.
- Concorrência: duas consolidações em paralelo. Já existe teste (linha 155), e a correção não muda esse caminho.

**Cobertos:**
- A reprodução com 23503 real, com a métrica, o log restrito a ids, o TTL do contador órfão e a reexecução.
- Texto no contador (22P02) e dia inexistente.
- Banco fora e 57P01, que precisam falhar o job e não contar como pulados.
- Erro numa pasta de storage com as escolas antes e depois dela gravadas, com ordem controlada pelo storage falso e falha no fim.
- Desistência depois de 3 pastas seguidas com erro.
- Consolidação em paralelo (teste que já existia).

**Bloqueantes:**

1. **A ordem não é controlada, e trocar `continue` por `break` sobrevive em cerca de metade das execuções.**
   - Onde: `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/uso.int.test.ts:307-351` (reprodução) e `:353-368` (valor inválido).
   - Problema: a escola órfã e a real têm UUID aleatório. O `SCAN` do Redis e o `ListObjectsV2` devolvem as duas em ordem arbitrária. Se o laço de `consolidar-uso.ts:133` parasse na primeira recusa em vez de seguir, a escola real só seria consolidada quando viesse antes da órfã. O teste pega o defeito original, que lançava o erro, mas não prova de forma determinística que "a escola depois da recusada é consolidada".
   - Correção exigida: deixar a escola recusada antes da real nos dois laços.
     - Storage: dar à órfã um id lexicograficamente menor, como `00000000-0000-4000-8000-<aleatório>`.
     - Contador: envolver `contador.lerDiasFechados` para devolver a órfã primeiro, ou pôr a órfã entre duas escolas reais em ordem fixa.
     - Fazer o mesmo no teste de valor inválido.

2. **"Seguidas" não tem teste.**
   - Onde: `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/consolidar-uso.ts:149`.
   - Problema: apagar `falhasSeguidas = 0` não deixa nenhum teste vermelho. O teste de uma pasta tem só 1 falha, e o de storage fora tem 5 seguidas. Sem o reset, 3 pastas com erro espalhadas (por exemplo, AccessDenied em 3 escolas) param a medição de todas as outras, e esse é justamente o cenário da regra 80, item 3.
   - Correção exigida: um teste com o padrão erro, ok, erro, ok, erro. As 5 pastas precisam ser medidas, as 2 boas gravadas, e o job falhar no fim com o primeiro erro.

3. **O ramo 23514 não tem teste.**
   - Onde: `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/consolidar-uso.ts:54`.
   - Problema: tirar `doPostgres.code === SQLSTATE_CHECK ||` não deixa nenhum teste vermelho. O documento da correção declara esse ramo.
   - Correção exigida: no teste de valor inválido, gravar um contador `'-3'`. O `Number` do `lerDiasFechados` passa o valor, e a restrição `uso_infra_diario_valores_nao_negativos` recusa. Conferir `causa: 'valor_invalido'` e que a outra escola é gravada.

4. **As contagens exatas dependem do estado acumulado no bucket, a mesma classe de defeito da correção `l4-depende-do-tamanho-do-banco`.**
   - Onde: `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/uso.int.test.ts:322`, `:326-330`, `:338` (`ignoradasTotal: 2`), `:366` e `:367`.
   - Problema: as asserções comparam com igualdade exata o total da métrica e todos os avisos `uso.escola_ignorada`. Mas o arquivo continua deixando pastas vazias no bucket a cada execução: `escolas/<escolaReal>/`, `escolas/<escolaA>/`, `escolas/<escolaB>/` do teste de bytes e das linhas 310 e 394. Só a pasta órfã entra em `pastasDoTeste`.
     - Com o banco de teste recriado (o sintoma que abriu esta correção), essas pastas viram escolas inexistentes. A reprodução e o teste de valor inválido ficam vermelhos com entradas `storage/escola_inexistente` a mais.
     - O mesmo acontece depois de uma execução que caia antes do `afterEach`: a pasta órfã fica no bucket e a reprodução passa a contar 2.
   - Correção exigida:
     - `guardar` registra `escolas/<id>/` em `pastasDoTeste` para toda escola, não só para a órfã.
     - As asserções de log filtram pelos ids que o teste criou.
     - A métrica, que não tem `escola_id`, é conferida contra os avisos filtrados. Outra saída é a métrica ser lida como diferença antes e depois dentro do mesmo teste, com a origem `storage` restrita às pastas do teste.

**Recomendações:**
- Nenhum teste prova que `montarWorker` passa o medidor à rotina (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/montagem.ts:114,216`). Tirar o `medidor` dali não deixa nada vermelho, e a métrica sumiria em produção sem aviso. A "trilha completa" podia conferir `uso.escola_ignorada` com uma pasta órfã.
- `causaNaEscola` confere a restrição `FK_DA_ESCOLA`, mas hoje a tabela só tem essa FK, então o ramo "23503 de outra FK sobe" não tem como ser provado. Vale um teste unitário com um erro falso de 23503 de outra restrição, para que o guarda não seja removido como código morto.
- O teste de storage fora podia conferir também que nenhuma linha de `uso_infra_diario` foi gravada para as 5 escolas, e que o log traz 3 avisos `erro_de_storage`.

## test-engineer · 2ª rodada · APROVADO · 2026-09-25 08:20:51 · `tasks/correcoes/2026-09-25-consolidacao-para-na-escola-inexistente.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Caminho feliz: a escola real é consolidada mesmo com uma órfã na frente.
- Escola que não existe mais no banco, com pasta no storage e contador no Redis vindos do `marcar`.
- Valor inválido num contador: texto (22P02), dia que não existe (22008) e número negativo (23514).
- Banco fora, ou recusa que não é da escola, precisa subir e não virar pulo: ECONNREFUSED, 57P01 e 23503 de outra restrição.
- Erro de storage numa pasta: as outras escolas são medidas e o job falha no fim.
- Três erros seguidos (storage fora): o job desiste na hora.
- Erros espalhados, que não são "seguidos".
- Reexecução idempotente (D49): o contador órfão fica no Redis com TTL e nada muda.
- Log só com id e erro resumido (regra 20, item 9).
- A métrica sai sem escola e bate com os avisos do log.
- A montagem liga o medidor à rotina.
- Isolamento: cada escola é gravada no contexto dela, e as regras antigas de A contra B continuam cobertas no mesmo arquivo.

**Cobertos:** todos. Conferi as quatro correções exigidas na rodada 1:

1. **A ordem agora é controlada.**
   - A órfã tem id `00000000-0000-4000-8000-…`, que passa no `FORMATO_UUID`. O `ListObjectsV2` com delimitador lista em ordem lexicográfica, então a órfã vem antes da escola real em `apps/worker/test/uso.int.test.ts:338-342`.
   - No contador, `contadorComPrimeiro` põe a recusada na frente com um sort estável (`:304-310`). Ele é usado na reprodução (`:353`) e no teste de valor inválido (`:400`), onde as três entradas da escola A vêm antes da B.
   - Um `break` em qualquer um dos dois laços deixa a escola real sem requisições ou sem bytes (`:358`), e a escola B sem as 2 requisições (`:402`).
2. **"Seguidas" agora tem teste** (`:451-471`).
   - Sem `falhasSeguidas = 0`, o terceiro erro chega no limite e o `throw erro` lança o erro da `escolas[4]`, não o da `escolas[0]`. A asserção `rejects.toBe(erros.get(escolas[0]))` na `:466` fica vermelha.
   - O teste confere as 5 medidas, as 2 escolas boas gravadas e a métrica = 3.
3. **O ramo 23514 agora tem teste.**
   - O contador '-3' fica na `:397`. O teste confere os três SQLSTATE (`:406-408`) e a escola B gravada.
   - Se o ramo 23514 ou o da classe 22 for removido, o erro sobe, o job falha e o teste fica vermelho.
4. **As contagens não dependem mais do bucket acumulado.**
   - `guardar` registra toda pasta do caminho, sem incluir a raiz `escolas/` (`:88-89`). O `afterEach` apaga da pasta mais funda para a mais rasa (`:109-111`).
   - A lista exata de avisos filtra pelos ids do teste (`avisosDas`).
   - A métrica é comparada com todos os avisos do log (`:365`, `:409`), e `ignoradasTotal` com o total de avisos (`:373`).
   - Os testes com storage falso (`:443-448`, `:485-488`) não dependem do bucket.

**Recomendações já aplicadas, e que funcionam:**
- `outraFk` com a restrição `outra_tabela_fk` (`:421`) fica vermelho se o código deixar de conferir `constraint === FK_DA_ESCOLA`.
- "Storage fora" confere as 3 medições, os 3 avisos e nenhuma linha gravada.
- A trilha completa confere `origem=storage, causa=escola_inexistente` ≥ 1 pelo medidor passado ao `montarWorker` (`:556-557`). Isso prova a mudança em `apps/worker/src/montagem.ts`, porque sem o medidor não há ponto nenhum.

O código de produção (`apps/worker/src/processadores/consolidar-uso.ts`, `montagem.ts`) não mudou desde a rodada 1. Não há `.skip`, nenhum provedor de IA envolvido, e nenhum mock esconde a regra: os mocks são só do storage, do banco fora e da ordem de leitura, e a gravação que prova a regra usa o Postgres real.

Não rodei o arquivo. Os containers de teste estavam sendo reiniciados por outra execução naquela hora, e o `beforeAll` dá `compose stop` na fila, o que atrapalharia essa execução. A análise acima é pela leitura do código. O "18/18 verdes" é o que foi informado, e bate com o número de testes do arquivo.

**Bloqueantes:** nenhum.

**Recomendações:**
- Hoje nenhum teste trava que `uso.escola_ignorada` sai sem `escola_id`. O helper `ignoradas()` (`apps/worker/test/uso.int.test.ts:316-317`) junta os pontos por `origem/causa`. Se alguém puser `escola_id` nos atributos, o `Object.fromEntries` esconde isso na maioria dos cenários. Vale uma asserção de que as chaves de `atributos` são exatamente `['causa', 'origem']`, como diz o comentário em `packages/nucleo/src/telemetria/metricas.ts` ("a escola eliminada não abre série").
- Na reprodução, o laço das `:367-371` exige 23503 em todo aviso do log, inclusive de pasta que sobrou de outra execução. Isso é correto hoje, porque qualquer pasta sobrando é de escola inexistente. Se um dia o bucket de teste tiver pasta com outro erro, filtrar esse laço por `avisosDas` deixa o teste imune a isso.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-25 08:21:30 · `tasks/correcoes/2026-09-25-consolidacao-para-na-escola-inexistente.md`

VEREDITO: APROVADO

Tabelas verificadas: `uso_infra_diario`. A tabela não mudou. Ela já tinha `escolaId` com FK para `escola`, e a correção só lê o nome dessa FK (`uso_infra_diario_escola_id_escola_id_fk`) para classificar o erro. Nenhuma migration.

Queries verificadas:
- `UsoRepository.gravarDia` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/uso/uso.repository.ts:41`) pega a escola de `escolaDoContexto()`, não de argumento. Continua sendo chamado só dentro de `naEscola(escolaId, ...)`, que abre um contexto novo com essa escola e sem `rotinaDoSistema`.
- A leitura dos bytes (`storage.bytesDaEscola`) agora também roda dentro de `naEscola`, como antes.
- `ContadorDeUso.apagarConsolidado` só apaga a chave da escola do contexto. Agora ele roda num segundo `naEscola`, separado da gravação, mas com o mesmo `escolaId` do laço. Não há como apagar o contador de uma escola depois de gravar outra.
- A descoberta das escolas continua a mesma, só pelos dois pontos que já têm `@SemEscopo` com justificativa (`lerDiasFechados` e `listarEscolas`). Nenhum `@SemEscopo` novo.
- A guarda que só deixa a rotina do sistema consolidar (`consolidar-uso.ts`, `rotinaDoSistema !== true` gera `FalhaDeJob`) continua antes de qualquer acesso.
- Nenhum endpoint, e nenhum `escolaId` vem de cliente.
- Id é UUID. A pasta órfã e as chaves do contador passam pelo filtro de formato (`FORMATO_UUID`, `FORMATO_CHAVE`).
- A métrica `uso.escola_ignorada` tem só os rótulos `origem` e `causa`, sem `escola_id`. Conferi o diff de `metricas.ts` e o do painel.
- O log leva só o id da escola e o erro resumido, e o teste confere que a mensagem do banco não aparece.
- A camada rede não é afetada.

Teste de isolamento: presente e efetivo. Os testes que já existiam cobrem o escopo e não perderam força:
- `uso.int.test.ts:149`, consulta de uma escola não enxerga a outra;
- `uso.int.test.ts:249`, os bytes de `escolas/{a}/` não somam os de `escolas/{a}x/`;
- `uso.int.test.ts:279`, um job de escola com esse tipo não alcança nada.

Os testes novos ainda provam que o contexto é por escola. O de erro de storage (`:431`) escolhe qual escola falha pelo `contextoAtual()?.escolaId`, então quebraria se a medição saísse do contexto da escola. O de valor inválido (`:389`) confirma que o dia recusado da escola A não vai parar em A nem em B.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/consolidar-uso.ts`: o laço dos contadores agora abre dois contextos por escola, um para gravar e outro para apagar. Isso está correto hoje. Um comentário curto dizendo que os dois precisam receber o mesmo `escolaId` evita que alguém separe os dois lados numa refatoração.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-25 08:21:49 · `tasks/correcoes/2026-09-25-consolidacao-para-na-escola-inexistente.md`

**VEREDITO: APROVADO**

A correção passa na regra 20. O log novo leva só ids e o erro resumido, sem a mensagem do banco. A métrica não leva escola. O contador que sobra no Redis guarda só o id da escola e um número, e continua com o prazo de 35 dias que já tinha. Não há bloqueante.

```
VEREDITO: APROVADO
Campos pessoais tocados: nenhum. `uso_infra_diario` e as chaves `uso:<dia>:<escolaId>:req|jobs` só têm id de escola, dia e contagens. A escola é pessoa jurídica: não é titular.
Fora da tabela de dados do docs/lgpd.md: nada. Não entrou campo pessoal novo.
Autorização por objeto: não se aplica. Não há rota nem endpoint novo. Cada gravação continua rodando no contexto da escola dela (`naEscola`), e o job segue exigindo `rotinaDoSistema`.
Logs: limpos. `uso.escola_ignorada` (apps/worker/src/processadores/consolidar-uso.ts:109) leva escolaId, origem, causa, requisicaoId e `resumirErro(erro)`:
  - no erro do Postgres, só tipo, SQLSTATE e restrição. A mensagem e o `detail` ficam de fora, e são eles que trariam o valor da linha, como o `"abc"` do 22P02;
  - no erro do storage, só o nome e a pilha sem a primeira linha, que é a que repete a mensagem.
  O teste confere a lista exata de campos e que o texto "is not present" não aparece. O erro que sobe para a fila é logado pelo executor, também com `resumirErro` (executor.ts:293).
Auditoria: não se aplica. Rotina interna, sem leitura de dado de aluno, exportação, nota ou permissão.
Envio externo: nenhum. A métrica `uso_escola_ignorada_total` vai só para o Prometheus nosso, com os rótulos `origem` (2 valores) e `causa` (3 valores). Sem escola_id: a escola eliminada não abre série.
Seed/fixture: sintético. Os ids são randomUUID ou `00000000-…`, e os valores são inventados. O `afterEach` apaga os objetos e as pastas vazias.
Bloqueantes: nenhum.
Recomendações:
  1. Quando a eliminação de escola existir, ela deve apagar a pasta vazia `escolas/<id>/`, que o SeaweedFS guarda depois que os objetos saem, e o contador `uso:*:<id>:*` no Redis. Hoje o uuid da escola eliminada fica no storage sem prazo e reaparece no log e na métrica toda noite. Não é dado de pessoa, mas é resto sem retenção definida. Registrar no `TODO.md` ou na spec da eliminação.
  2. `docs/runbook.md`, item `valor_invalido`: o `redis-cli --scan --pattern 'uso:*:<id>:*'` não leva o prefixo das chaves (`bancada.prefixo` no teste). Conferir se o padrão acha a chave no ambiente real, para ninguém ir ao Redis de fila com um padrão largo demais.
```

**Retenção.** O contador órfão fica no Redis até vencer pelo prazo do `marcar` (`VALIDADE_DO_CONTADOR_SEGUNDOS`, 35 dias). O teste confere que o prazo ainda existe depois da consolidação. Não guardar sem prazo e não apagar o que não foi gravado é a escolha certa aqui: não há dado de pessoa, e apagar num worker apontado para o banco errado perderia o uso de todas as escolas.

**Pergunta de fechamento.** Não se aplica: nada nesta correção guarda dado de aluno nem o envia para fora.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/consolidar-uso.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/montagem.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/erro/resumir-erro.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/telemetria/metricas.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/uso.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md
- /home/joaquimdp/Documentos/git/Educa.ia/infra/grafana/paineis/fundacao.json
- /home/joaquimdp/Documentos/git/Educa.ia/tools/testes/metricas.ts
- /home/joaquimdp/Documentos/git/Educa.ia/TODO.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-25-consolidacao-para-na-escola-inexistente.md

## infra-guardian · 1ª rodada · APROVADO · 2026-09-25 08:21:59 · `tasks/correcoes/2026-09-25-consolidacao-para-na-escola-inexistente.md`

VEREDITO: APROVADO
Caminho quente tocado: fila (rotina de lote `sistema.consolidar-uso`, às 2h; fora do horário letivo)
Rate limit: ok (não se aplica, a correção não toca rota)
Fila e prioridade: ok (a rotina continua na fila de lote e com o mesmo agendamento `0 2 * * *`)
Concorrência: protegida (`gravarDia` usa upsert com `greatest` e sobrescreve os bytes; `apagarConsolidado` só apaga se o valor ainda é o gravado; a reexecução não muda nada, e o teste de reprodução prova isso no Redis e no banco)
Índice e paginação: ok (nenhuma query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (a métrica nova, `uso_escola_ignorada_total`, não leva `escola_id` e é criada uma vez por processador; o painel 31 não sobrepõe outro; o parágrafo do runbook está em "Rotina do sistema sem rodar"; não há alerta, e a justificativa se apoia no item de `TODO.md:135`)
Bloqueantes: nenhum

Recomendações:
1. **Um contador inválido perde o outro contador válido do mesmo dia.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/consolidar-uso.ts:250-258`, `req` e `jobs` do mesmo dia da mesma escola saem numa só gravação. Se um dos dois é inválido (por exemplo, `jobs` com texto), o outro também não é gravado e some quando o prazo de 35 dias vence. O runbook (`/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md:612-614`) só diz que "o contador válido da mesma escola, em outro dia, foi gravado". Há duas saídas: gravar cada contador separado quando vier `valor_invalido`, ou avisar no runbook que o outro contador do mesmo dia também ficou no Redis e precisa ser gravado antes de apagar a chave errada. Nada no sistema escreve um contador assim, por isso não bloqueia.
2. **O painel pode mostrar zero na primeira noite depois que o worker reinicia.** Em `/home/joaquimdp/Documentos/git/Educa.ia/infra/grafana/paineis/fundacao.json`, no painel 31, `increase(...[1d])` não conta o primeiro valor de uma série que acabou de aparecer. Como a série só nasce na primeira escola pulada, a noite seguinte a cada reinício do worker (um deploy, por exemplo) aparece como zero. Os outros painéis de contador têm o mesmo problema, mas este não tem alerta, e o painel é o único sinal. Vale citar isso na descrição do painel ou somar ao valor do log `uso.consolidado` (`ignoradasTotal`).
3. **A pasta vazia de uma escola eliminada aparece toda noite, sem fim.** A spec da eliminação de escola deve apagar a pasta `escolas/<id>/` com um `DeleteObject` da própria pasta, como o `afterEach` do teste já faz. Assim o `escola_inexistente` vindo do storage fica restrito ao caso anômalo (banco errado ou restauração pela metade), que é o que o runbook manda investigar.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-25 08:22:05 · `tasks/correcoes/2026-09-25-consolidacao-para-na-escola-inexistente.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: `portão local: apps/worker/test/uso.int.test.ts mudou em 2026-09-25 08:18:16, depois do início do último (2026-09-25 07:49:26). Rode node tools/processo/portao-local.ts de novo.`

Bloqueantes:
- **Portão local (carimbo velho):** o arquivo em questão é `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/uso.int.test.ts`. O carimbo foi gravado antes das mudanças desta correção. Isso inclui a rodada que corrigiu o que o `test-engineer` pediu na 1ª rodada. Rode o portão de novo sobre a árvore final com `node tools/processo/portao-local.ts --infra`. O `--infra` é obrigatório aqui pela regra 40, porque a correção toca `tools/testes/metricas.ts`, `infra/grafana/paineis/fundacao.json` e o catálogo de métricas, e porque o `infra-guardian` é revisor obrigatório. Sem ele o carimbo fica sem a suíte exigida, e o `painel.test.ts` que justificou o painel novo nem roda.

Escopo e código, fora o carimbo, estão aceitáveis:
- O `TODO.md` pedia só pular a escola inexistente. A correção também trata `valor_invalido` e `erro_de_storage`, com o limite de falhas seguidas. Isso está declarado e justificado no documento, e é o mesmo defeito da regra 80, item 3. Não é invasão silenciosa.
- `causaNaEscola` separa bem o que é recusa da escola (FK nomeada, classe 22, 23514) do que é falha do banco, e o erro de banco sobe.
- O log usa `resumirErro`, sem mensagem nem valor de linha.
- O contador que não pôde ser gravado fica no Redis, o que respeita a D49.
- Não achei `.skip`, `any` nem `TODO` no teste.

Recomendações:
- **Falha que passa em silêncio:** em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/consolidar-uso.ts:161` o job termina com sucesso mesmo quando todas as escolas foram puladas. O caso é justamente o que o próprio documento descreve: worker apontado para o banco errado ou restauração pela metade. Sem alerta, ninguém percebe, e os contadores vencem em 35 dias. O runbook diz "nada foi perdido", mas isso só vale se alguém olhar o painel antes do prazo. Sugestão: falhar o job quando nenhuma gravação teve sucesso e houve pulo por `escola_inexistente`, ou levar a decisão ao `infra-guardian`.
- **Runbook incompleto:** em `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`, item 2 do parágrafo novo, `valor_invalido` cita texto e dia inexistente, mas não cita o valor negativo (23514), que o código e o teste cobrem.
- **Erro trocado ao desistir:** em `consolidar-uso.ts:152`, quando atinge `FALHAS_DE_STORAGE_SEGUIDAS_ATE_DESISTIR`, o job sobe o erro da 3ª pasta, enquanto o caminho do fim sobe o 1º (`falhaDeStorage`). Vale subir sempre o mesmo, para o registro da falha ser coerente.
- **Dia inteiro pulado:** um contador com texto em `jobs` derruba também o `req` válido do mesmo dia e da mesma escola, porque os dois vão na mesma gravação. Hoje isso é aceitável porque nada no sistema escreve assim. Vale registrar no comentário do laço.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-25 08:48:24 · `tasks/correcoes/2026-09-25-consolidacao-para-na-escola-inexistente.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, test, infra)`)
Bloqueantes: nenhum.
Recomendações: nenhuma nova. As quatro da 1ª rodada continuam valendo e estão registradas em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados/2026-09-25-consolidacao-para-na-escola-inexistente.md`:
- a consolidação falhar quando pular todas as escolas;
- o runbook trazer o caso negativo;
- a mensagem de erro que fala da 3ª pasta quando o problema é a 1ª;
- o dia inteiro pulado.

A única correção exigida na 1ª rodada foi feita. O carimbo em `/home/joaquimdp/Documentos/git/Educa.ia/.processo/portao.json` começou às 08:18:54 (horário local), com as suítes typecheck, lint, test e infra. O arquivo alterado mais tarde, `apps/worker/test/uso.int.test.ts`, foi salvo pela última vez às 08:18:16, antes do carimbo. Depois do carimbo, só o `TODO.md` mudou (08:22:15), e ele é documento sem suíte. O `conferir` aceita essa árvore. Nenhum arquivo de código mudou desde a rodada anterior, então a auditoria de conteúdo daquela rodada continua valendo.
