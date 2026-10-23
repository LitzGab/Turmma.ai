# Achados das revisões — `tasks/prd-harness/6_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-23 16:53:12 · `tasks/prd-harness/6_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

**Escopo.** As subtarefas 6.1 a 6.5 foram entregues e só os dois arquivos previstos de código mudaram. A 7.0 não foi invadida: `tools/processo/mutacoes.ts` continua intocado, e `linhas.ts` tem cópias próprias de `sinalAoGrupo` e `matarGrupo`. O motivo dessas cópias está registrado.

**Aderência.** As seis divergências da tabela do `6_task.md` estão registradas nos lugares certos. Estão no `techspec.md` §5(f), no trecho "No código (6.0)", e no `cenarios.md`, linha RF3. São elas:
- o ponto de injeção da 5.0 passou para depois do merge;
- o código de saída 5 é novo;
- `npm ci` e verificação correm sob um só prazo e um só grupo;
- o encontro que recebe um sinal de fim mata o grupo, volta a linha e sai com o código 5;
- prazo e espera até o SIGKILL podem ser injetados pelo ambiente;
- `PRAZO_DA_TRAVA_MS` não mudou.

A ordem pedida pela 6.2 está no código. Primeiro o grupo morre e o encontro espera ele sumir. Depois vem o `reset --hard antes`. Só então a trava se solta, no `finally` de `sobATrava`.

**Regras sem guardião.** Não há `.skip`, `any` nem `TODO` no diff. O `sleep` nos comandos injetados serve para manter o processo de pé ou para passar do prazo, e não para sincronizar o teste. O teste dos dois encontros em paralelo usa o arquivo-sinal.

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.ts:517`: o `abrir` ainda usa o literal `'npm ci'`, embora a tarefa tenha criado `COMANDO_DE_INSTALACAO`. Isso deixa dois jeitos de dizer a mesma coisa; vale trocar pela constante.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.ts:449` e `:758`: os ouvintes de sinal são removidos antes de `matarGrupo` e do `reset`. Um SIGTERM que chegue nesse intervalo mata o encontro com a linha ainda no merge. A janela é curta, mas o mesmo cuidado que vale durante a verificação poderia cobrir o fim dela; para o caso raro, a correção do encontro já manda refazer o merge.
3. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.ts:713`: a linha que reconstrói o slug `encontro-${linha.tarefa ?? linha.correcao}` agora aparece duas vezes, aqui e na saída de conflito (`:753`). Vale extrair numa função pequena.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-23 16:53:47 · `tasks/prd-harness/6_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A tarefa mexe só na ferramenta de processo (`tools/processo/linhas.ts`). Nada roda na API, no realtime ou no worker.
Rate limit: ok (não se aplica, não há entrada HTTP)
Fila e prioridade: ok (não se aplica)
Concorrência: protegida. A verificação roda com a trava do quadro na mão. A ordem é a pedida: o grupo morre, depois vem o `reset --hard <antes>`, e só então a trava se solta no `finally` do `sobATrava`. O teste de ordem prova isso lendo a ref direto do disco, sem abrir o `git`, e com um neto que ignora o SIGTERM. A espera de quem quer a trava, 7 min, passa dos 6 min de prazo mais os 5 s até o SIGKILL, e o teste afirma essa relação. Rodei `npx vitest run --project unidade tools/processo/linhas.test.ts`: 64 de 64 verdes.
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica; a saída diz sempre o comando que rodou e o prazo)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.ts:1102`: quando o lock mudou e a verificação fica vermelha, o `npm ci` já instalou o `node_modules` do lock da spec. O `reset --hard` não toca nesse diretório, que o git ignora, e a linha volta com um lock que não é o instalado. O conserto refaz o merge e devolve o lock, então não há perda. Mesmo assim, vale a saída avisar que o `node_modules` da linha ficou com o lock da spec até o conserto.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.ts:768`: o `push` sob a trava não tem prazo. No pior caso, quem segura a trava gasta 6 min de verificação, mais 5 s até o SIGKILL, mais 1 s de espera depois dele, e só então o git e o push. Sobram uns 53 s dos 7 min de quem espera. Se o push travar, quem espera desiste com "encontro em curso". Isso falha com segurança, mas um prazo no push, ou a folga escrita no techspec, deixaria a conta explícita.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.ts:1015`: se o grupo ainda existe depois de 1 s do SIGKILL (processo em estado D), o reset roda mesmo assim. Raro. Seria possível conferir o sinal 0 de novo e, se o grupo ainda existir, recusar com "grupo não morreu" em vez de mexer na árvore.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.ts:1044`: os ouvintes de sinal saem antes de `matarGrupo` e do reset. Um segundo SIGTERM nessa janela de até ~6 s mata o encontro com a linha ainda no merge. A próxima `partida` ou o próximo `encontro` acham a árvore com o merge e recusam, então não há corrupção silenciosa. Ainda assim, manter os ouvintes até o reset fecharia a janela.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-23 16:55:08 · `tasks/prd-harness/6_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** são as oito linhas da tabela da 6_task.md e os itens novos do RF3 no `cenarios.md`. As linhas da tabela são:
- duas linhas verdes que juntas quebram o lint;
- as duas verdes que juntas passam;
- lock alterado e lock igual;
- verificação acima do prazo;
- quem pega a trava lê a ref do disco;
- o neto morto (pid);
- o neto que ignora SIGTERM e o checkout limpo;
- o prazo padrão de quem espera.

Os itens novos do RF3 são:
- o comando padrão com um `npm` falso no PATH;
- o lock que é só da própria linha;
- o `npm ci` vermelho;
- o neto que fica de pé depois do verde;
- o encontro que recebe um sinal de fim (a divergência e a techspec declaram SIGINT, SIGTERM e SIGHUP);
- o reset que falha;
- o slug da linha de correção;
- a saída da verificação no erro do encontro.

Não há caso de permissão nem de isolamento: isto é ferramenta de processo e não toca dado de escola. A concorrência fica com "dois encontros ao mesmo tempo" da 5.0, que agora roda a verificação depois do merge e passa.

**Cobertos** (em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.test.ts`): todas as linhas da tabela têm teste citado pelo nome, com asserção sobre o resultado:
- a spec não anda e a origem não recebe push;
- a linha volta para `antes` e fica limpa;
- o quadro segue com a tarefa;
- o texto manda refazer o merge.

O `--ff-only` aparece no HEAD da spec igual ao da linha, com o commit de merge. O `npm ci` antes da verificação é provado pela ordem gravada num arquivo de registro. A espia lê a ref pelo `gitdir:`, pelo `commondir` e pelo `packed-refs`, e o `/proc/<pid>/stat` sai `sumiu` ou `Z`. O SIGKILL vem depois de um neto que escreve no arquivo versionado, e o checkout termina limpo. A relação `PRAZO_DA_TRAVA_MS > 6 min + 5 s` está afirmada no teste.

Os blocos de mutação conferem com o `git diff` cláusula a cláusula. As duas exceções declaradas, o `filho.once('error')` e o segundo laço de `matarGrupo`, têm motivo escrito e são aceitáveis. Não há `.skip` nem mock de coisa nossa: o `npm` falso e o comando injetado substituem só o que é de fora. Rodei `npx vitest run --project unidade tools/processo/linhas.test.ts` e deu 64 de 64 verdes, em 42 s.

**Bloqueantes:**
1. **`linhas.ts:445`: o SIGINT e o SIGHUP não têm teste.**
   - **O que está errado:** a linha `for (const sinal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const)` é cláusula nova e não tem bloco de mutação próprio. O único teste de sinal (`linhas.test.ts:1305`, "o encontro que recebe SIGTERM") manda só SIGTERM. A asserção de `listenerCount` (`linhas.test.ts:1175` e `:1191`) só confere que os ouvintes foram devolvidos, não que foram instalados. Por isso, tirar `'SIGINT'` ou `'SIGHUP'` do array deixa tudo verde.
   - **Por que importa:** o Ctrl-C do terminal do Orquestrador é justamente o SIGINT. Sem esse ouvinte, o `tsc` fica solto e a linha fica no merge com a trava solta, que é o caso que a própria divergência diz evitar.
   - **Correção exigida:** parametrizar o teste de `:1305` sobre `SIGINT`, `SIGTERM` e `SIGHUP`, e declarar um bloco por sinal que tire esse sinal do array, citando o caso daquele sinal.

**Recomendações:**
- `linhas.test.ts:1277`: logo depois de criar a espia, afirmar `expect(encontroDaLinha1.jaSaiu()).toBe(false)`. Assim, se a espia pegar a trava depois de o encontro já ter saído, o teste fica vermelho em vez de passar à toa.
- `linhas.test.ts:1183`: o limite de 4 s conta o encontro inteiro (as chamadas de `git` mais 0,7 s) e tem folga de cerca de 2x com a máquina carregada. A mutação que ele pega custa mais de 10 s, então dá para subir para uns 8 s sem perder a prova.
- `linhas.ts:445` e `:448`: com o primeiro sinal recebido, os ouvintes saem antes de `matarGrupo` (até 5 s mais 1 s). Um segundo Ctrl-C nesse intervalo mata o encontro antes do `reset`. Manter os ouvintes, ignorando o sinal, até o `reset` terminar.
- `linhas.ts:435`: o stderr da verificação indo para o fd 2 não tem prova, porque o "42" sai pelo stdout. Basta um `echo … >&2` no comando do teste.
- `linhas.ts:517`: o `abrir` ainda usa o literal `'npm ci'` e não o `COMANDO_DE_INSTALACAO`.
- O trecho "e fecha o conserto com o commit da correção. Depois, este comando de novo." não tem nenhuma asserção.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-23 17:09:49 · `tasks/prd-harness/6_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A tarefa só mexe em ferramenta de processo (`tools/processo/linhas.ts`), que não roda nos fluxos de login, tutor, sala, prova, fila, IA, migration ou deploy do produto.
Rate limit: não se aplica
Fila e prioridade: não se aplica
Concorrência: protegida. Nesta rodada nada mudou na trava (`flock`), no prazo, no SIGTERM/SIGKILL nem no `reset`. A nova asserção `jaSaiu()` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.test.ts:1279` não deve ficar instável. A checagem roda logo depois de `aguardarArquivo`, que consulta o arquivo a cada 20 ms, e o encontro ainda segura a trava por cerca de 400 ms (o tempo até o SIGKILL do neto que ignora TERM).
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: não se aplica
Bloqueantes: nenhum
Recomendações: nenhuma nova. Conferi o diff da rodada contra o código:
- `slugDoEncontro` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.ts:297` dá o mesmo texto de antes nas duas saídas, na `:715` e na `:755`.
- `COMANDO_DE_INSTALACAO` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.ts:46` continua `'npm ci'`.
- Os três sinais do teste (SIGINT, SIGTERM e SIGHUP) são os mesmos que o encontro trata em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.ts:447`.
- Nenhum teste chama provedor pago.

As recomendações da 1ª rodada continuam como estavam, em "Recomendações sem aplicar", com destino `TODO.md`.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-23 17:09:56 · `tasks/prd-harness/6_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

Correções exigidas na 1ª rodada:
- **`abrir` usa a constante.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.ts:519`, o `abrir` usa `COMANDO_DE_INSTALACAO` no lugar do literal `'npm ci'`, como já fazia a linha 688. Feito.
- **Slug numa função.** O slug `encontro-…` saiu para `slugDoEncontro` (linha 297), e as duas saídas usam a função: a verificação vermelha (linha 715) e o conflito (linha 755). O bloco de mutação foi trocado para mutar a função. Assim os dois caminhos ficam cobertos de uma vez, e não só um deles. Feito.

O diff desde a rodada aprovada:
- **Teste do sinal para os três sinais.** Ele roda para SIGINT, SIGTERM e SIGHUP. Cada um tem sua mutação em `linhas.ts:447` (o laço de `process.on` existe na produção). Sem o ouvinte do SIGINT, o padrão do node mata o processo com outro código, e o teste fica vermelho. A mutação tem efeito.
- **Asserção `jaSaiu()` em `linhas.test.ts:1279`.** Ela garante que o encontro ainda segura a trava quando a espia é lançada. Sem ela, uma espia que pegasse a trava livre passaria sem provar a ordem. Está correta.
- **Saída de erro da verificação.** O `echo … >&2` com a asserção `erro-da-verificacao-53` cobre a saída de erro, junto com a mutação do terceiro fd de `stdio` (`linhas.ts:437`).
- **Limite de 4 s para 8 s.** Isso só afrouxa o tempo do teste. A regra testada continua sendo o prazo injetado de 0,4 s.
- **Documentos.** O `cenarios.md` no RF3 cita os três sinais, como o teste. A tabela "Recomendações sem aplicar" dá destino a cada item.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.test.ts:1309`: o `it` dentro do `for (const sinal …)` não foi indentado, e o `}` de fechamento na linha 1326 fica alinhado com o `it`. Fica difícil ver onde o laço termina.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/6_task.md`: falta a linha em branco antes do primeiro bloco `mutacao` novo (o do SIGINT). Os blocos anteriores estão separados por uma.

## test-engineer · 2ª rodada · APROVADO · 2026-10-23 17:10:29 · `tasks/prd-harness/6_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- O encontro interrompido por cada um dos três sinais (SIGINT, SIGTERM, SIGHUP) mata o grupo, volta a linha e sai com o código da verificação.
- O que a verificação escreve no fd 1 e no fd 2 chega ao erro do encontro.
- Quem pega a trava vê a ref já de volta, o neto morto e o checkout limpo, nos casos vermelho e prazo.
- O slug do encontro numa linha de correção.
- Verificação acima do prazo, com SIGTERM antes do SIGKILL.

**Cobertos:**
- **A correção exigida na 1ª rodada foi feita.** O teste agora roda uma vez por sinal, com o mesmo corpo, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.test.ts:1308-1326`. O `6_task.md` tem um bloco de mutação por sinal. Cada bloco tira só aquele sinal do array de `linhas.ts:447` e cita o caso daquele sinal pelo nome. O `-` de cada bloco bate literalmente com a linha 447, com o mesmo recuo.
  - O vermelho sai pelo motivo certo. Sem o ouvinte, o encontro (filho `node` direto, e o libuv devolve o padrão aos sinais no filho) morre pelo sinal com código `null`. Isso quebra `expect([saida.codigo, saida.texto]).toEqual([CODIGO_DA_VERIFICACAO, …'recebeu um sinal de fim'])`.
  - A instalação de cada ouvinte agora tem prova própria, e não só a devolução por `listenerCount`.
- **Os dois blocos novos de `stdio` (`linhas.ts:437`) chegam à cláusula.** O teste agora escreve `saida-da-verificacao-42` no fd 1 e `erro-da-verificacao-53` no fd 2, e confere os dois em `linhas.test.ts:1284-1285`. Trocar o fd 1 ou o fd 2 por `'ignore'` tira exatamente o texto conferido. Os dois blocos citam o caso `vermelho: quem pega a trava`, que existe.
- **O bloco do slug foi reescrito para a função nova `slugDoEncontro` (`linhas.ts:297`).** O texto bate. O caso `a linha de correção que não passa diz o slug dela` confere `slug encontro-fuso`, então tirar o `?? linha.correcao` o deixa vermelho. A função serve aos dois lugares (recusa da verificação e conflito), e o bloco cobre os dois.
- **Os ajustes recomendados na 1ª rodada foram aplicados:**
  - `abrir` agora usa `COMANDO_DE_INSTALACAO`. O bloco da constante (`6_task.md:121-126`) continua batendo.
  - O limite subiu de 4 s para 8 s (`linhas.test.ts:1183`). Ainda falha se o código esperasse os 10 s até o SIGKILL: seriam pelo menos 10,4 s contra 8 s.
  - A espia agora confere `jaSaiu()` false.
- **Rodei** `npx vitest run tools/processo/linhas.test.ts -t "encontro que recebe|quem pega a trava|linha de correção que não passa"`: 6 passaram, 0 falharam. São os três sinais, o vermelho e o prazo da trava, e o slug da correção.
- Não há `.skip`, teste comentado nem mock do que é nosso. O que se testa roda em repositório e processo de verdade.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `linhas.test.ts:1279`, o `expect(encontroDaLinha1.jaSaiu()).toBe(false)` só prova que o encontro ainda estava vivo na hora em que o `spawn` da espia foi chamado. O `spawn` é assíncrono, então ele não prova que o `flock` já esperava na trava antes de o encontro soltá-la. Se a espia chegasse depois, leria o estado final e passaria do mesmo jeito. Hoje o vermelho leva uns 500 ms depois do pid, o que deixa folga de sobra na prática. Para provar a ordem por construção, a espia pode registrar que esperou, por exemplo um `flock -n` que falha antes do `flock` que bloqueia, e o teste exigir esse registro.
2. O laço `for (const sinal of …)` em `linhas.test.ts:1308` deixou o `it` sem o recuo do bloco. É cosmético; o lint não reclamou.
