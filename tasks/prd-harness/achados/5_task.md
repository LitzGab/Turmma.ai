# Achados das revisões — `tasks/prd-harness/5_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · REPROVADO · 2026-10-23 14:37:55 · `tasks/prd-harness/5_task.md`

VEREDITO: REPROVADO

Caminho quente tocado: nenhum do produto. A tarefa mexe na concorrência do quadro do processo (`flock`).
Rate limit: não se aplica
Fila e prioridade: não se aplica
Concorrência: há uma corrida em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.ts:407`
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: não se aplica

Bloqueantes:

1. **`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.ts:407` (com as linhas 393 e 469): a volta do `abrir` não sabe se a abertura no quadro é a dela.**
   - **O problema:** o `concluirAbertura` só confere `atual?.abrindo === true`. Nada diz qual `abrir` gravou aquela marca.
   - **A sequência que quebra:**
     1. O `abrir 1` (A) entra no `npm ci`.
     2. `abandonar 1` tira a linha do quadro (linha 469) e manda abrir de novo.
     3. O operador obedece e roda `abrir 1` (B) enquanto o `npm ci` de A ainda roda. B é aceito: não há linha 1 no quadro, e `node_modules` e `.processo/` são ignorados pelo git, então a árvore não aparece suja. B grava `abrindo: true` e começa um segundo `npm ci` no mesmo checkout.
     4. A termina, pega a trava, vê a marca de B e grava a linha livre. Sai com 0 e "Linha 1 aberta".
     5. A partir daí, `partida 1` é aceita enquanto o `npm ci` de B ainda apaga e reinstala `node_modules`.
     6. Quando B volta, vê `abrindo: false` e devolve "foi abandonada enquanto o npm ci rodava. Abra de novo", que é falso. Se a `partida` já entrou, a linha fica com tarefa num checkout em reinstalação.
   - **Por que reprova:** é o caso de "job repetido" da regra 80, item 7. A marca do quadro é verificada sem saber de quem ela é.
   - **Correção exigida:**
     - O `prepararAbertura` grava na linha um identificador da abertura, único por execução (por exemplo `randomUUID()`), e não `desde`, que o teste injeta igual.
     - O `concluirAbertura` só libera ou tira a linha se o identificador do quadro for o dele. Senão, recusa sem tocar na linha.
     - Um teste de processo cobre a sequência: A preso no `npm ci`, `abandonar 1`, B preso no `npm ci`, A solto. A sai ≠ 0 com "abandonada", e a linha 1 continua em abertura. Depois B é solto, sai 0, e a linha fica livre.
     - Uma mutação que troca a comparação do identificador por `true` fica vermelha nesse teste.

Recomendações:
- **Recusa sem saída (`linhas.ts:281`):** se o processo do `abrir` morrer durante o `npm ci` (SIGKILL, terminal fechado), a linha fica `abrindo: true` para sempre. A recusa diz "a abertura dela ainda roda" e não aponta para `abandonar <n>`. Incluir o comando na mensagem.
- **Variáveis de injeção no CLI de verdade:** `opcoesDoAmbiente` lê `EDUCA_ENCONTRO_SOB_A_TRAVA` e `EDUCA_COMANDO_DE_INSTALACAO` de `process.env`. Uma variável esquecida no shell troca o `npm ci` ou injeta comando no encontro sem aviso. Vale escrever na saída quando uma delas estiver ligada, ou restringir às execuções de teste.
- **Rede e verificação sob a trava:** o `encontro` faz o `git push` e roda o comando de verificação com a trava na mão, e quem espera tem 7 min. Isso fica com a 6.0 (prazo do encontro), mas o push sob a trava deve ser medido lá.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-23 14:38:31 · `tasks/prd-harness/5_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência no `cenarios.md`. A `techspec.md` §5(f) foi atualizada, mas três das quatro divergências do `5_task.md` citam o `cenarios.md`, e ele não foi alterado.
Portão local: carimbo válido
Bloqueantes:

1. **`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.ts:407`, com as linhas 393 e 468: a volta do `abrir` não sabe se a abertura que está no quadro é a dela.**
   - **O que está errado:** o `concluirAbertura` só olha `atual?.abrindo === true`.
   - **A sequência que quebra:**
     1. Um `abrir 1` (A) está no `npm ci`.
     2. Alguém roda `abandonar 1`, que tira a linha do quadro. A própria saída do `abandonar` manda "Abra de novo".
     3. Um novo `abrir 1` (B) é aceito e grava `abrindo: true`.
     4. A termina, vê a marca de B e grava a linha como livre, enquanto o `npm ci` de B ainda reinstala o `node_modules`. A partir daí uma `partida 1` é aceita.
     5. Quando B volta, diz "foi abandonada", o que é falso.
   - O fluxo é o que a própria tarefa assumiu: existe o teste "a linha abandonada durante o npm ci". Pela regra 80, item 7, a marca precisa dizer de quem é.
   - O `infra-guardian` acusou o mesmo furo na 1ª rodada, e a árvore atual ainda não tem a correção.
   - **Correção exigida:**
     - O `prepararAbertura` grava na linha um identificador da abertura, único por execução (`randomUUID()`, e não `desde`).
     - O `concluirAbertura` só libera a linha, ou a tira do quadro, se o identificador no quadro for o dele. Se não for, recusa sem tocar na linha.
     - Entra uma mutação no `5_task.md` que troca essa comparação por `true`.

2. **`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/5_task.md:77-79`: a tabela de divergências diz que três comportamentos estão no `cenarios.md`, mas eles estão só na `techspec.md`.** São comportamentos novos, cada um com teste na tarefa. Hoje o `cenarios.md` A não traz nenhum deles:
   - o `fechar` pega a trava e espera o encontro em curso (RF3 não fala do `fechar`);
   - o `abandonar` de uma linha em abertura tira a linha do quadro, e o `abrir` que volta depois disso recusa com "foi abandonada" (o RF6 só diz "fica livre");
   - o `comandoSobATrava` que sai diferente de 0 recusa o encontro sem mudar nada;
   - no RF10, o `conferir` compara com a `develop` quando roda no andar da própria spec ou quando não há quadro, e compara com a `spec` do quadro quando a linha não tem `base`.

   **Correção exigida:** acrescentar esses casos às linhas RF3, RF6 e RF10 do `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/cenarios.md`, ou corrigir a coluna "Onde está na spec" e registrar ali onde cada um está de fato.

Recomendações:
- Em `linhas.ts:408`, a linha concluída fica livre com o `desde` da abertura. Antes desta tarefa, linha livre tinha `desde: null`. Vale gravar `desde: null` ao concluir.
- Em `linhas.ts:281`, se o `abrir` morrer no meio do `npm ci`, a recusa "a abertura dela ainda roda" não aponta a saída. Vale citar `linhas.ts abandonar <n>` na mensagem, como o `infra-guardian` já recomendou.
- O CLI lê `EDUCA_COMANDO_DE_INSTALACAO` e `EDUCA_ENCONTRO_SOB_A_TRAVA` do ambiente sem avisar. Uma variável esquecida no shell troca o `npm ci` em silêncio. Vale escrever na saída quando uma delas estiver ligada.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-23 14:38:55 · `tasks/prd-harness/5_task.md`

VEREDITO: REPROVADO

**Cenários exigidos** (tabela de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/5_task.md`, §5(f) da techspec e regra 80, item 7):
- Dois encontros ao mesmo tempo.
- `partida 2` durante o encontro da linha 1.
- Quem espera além do prazo.
- `abrir 1` preso no `npm ci`: a trava fica solta, a linha fica em uso e o `npm ci` roda uma vez.
- O sinal é solto.
- `npm ci` falhando.
- A volta do `abrir` à trava, com o encontro da linha 2 preso, com o `npm ci` passando e falhando.
- A volta à trava com prazo menor.
- RF6: `abandonar 2`.
- RF6: `abandonar 3` durante o encontro da linha 1.
- RF10: correção que nasceu da spec e correção que nasceu da `develop`.
- Pela cláusula do §5(f): `abrir`, `partida`, `abandonar` e `encontro` pegam a mesma trava.

**Cobertos:** as 12 linhas da tabela têm teste citado pelo nome em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.test.ts`:
- linha 1 → :742
- linha 2 → :754
- linha 3 → :767
- linhas 4 e 5 → :788
- linha 6 → :813
- linha 7 → :827, passando e falhando
- linha 8 → :847
- linha 9 → :882
- linha 10 → :907
- linha 11 → :984
- linha 12 → :1004

Tem mais teste além da tabela:
- sem `flock` na máquina (:780)
- abandono durante o `npm ci` (:869)
- `fechar` sob a trava (:921)
- comando sob a trava que falha, rodando no checkout da linha (:935)
- prazo de 7 min e leitura do ambiente (:946)
- quadro antigo sem `base` (:994)
- andar da própria spec (:1013)

A concorrência é de verdade: cada comando roda em outro processo, com arquivo-sinal e sem `sleep` fixo. Não há mock: o git e o `flock` são reais. Não achei `.skip`, `.only` nem teste comentado. Rodei `npx vitest run --project unidade tools/processo/linhas.test.ts` e passaram os 48 testes.

**Bloqueantes:**

1. **O `abrir` pega a trava no começo, mas isso não tem bloco de mutação nem teste.**
   - **Onde:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.ts:420`, na linha `const aberta = await sobATrava(raiz, opcoes, () => prepararAbertura(raiz, numero, checkoutDado, opcoes))`.
   - **O que falta:** a techspec §5(f) diz que "`abrir`, `partida`, `abandonar` e `encontro` pegam o mesmo `flock`". O documento traz bloco para a trava de `partida`, `abandonar`, `encontro` e `fechar`, e para a volta do `abrir` à trava (`concluirAbertura`). Para a primeira trava do `abrir` não traz nenhum.
   - **Por que nada falha:** se trocar por `prepararAbertura(...)` direto, nenhum teste quebra, porque nenhum caso dispara um `abrir` enquanto outro comando segura a trava. O :788 só prova a marca `abrindo`, que é gravada depois e com a trava já solta. É o caso do clique duplo (regra 80, item 7): dois `abrir 1` passam juntos pela conferência de "em uso" e rodam o `npm ci` duas vezes.
   - **Correção exigida:**
     - Teste novo, por exemplo "o abrir da linha 1 durante o encontro da linha 2 espera". Com `encontroPreso(base, spec, 2)` segurando a trava, rodar `abrir 1` pelo CLI com o `npm ci` injetado por `preso()`. Depois de `JANELA_MS`, conferir que o `abrir` não saiu e que `npm.vezes()` é 0. Soltar o encontro e conferir que o `abrir` sai 0, que o `npm ci` rodou uma vez e que a linha 1 ficou livre.
     - Bloco de mutação: `-  const aberta = await sobATrava(raiz, opcoes, () => prepararAbertura(raiz, numero, checkoutDado, opcoes))` / `+  const aberta = prepararAbertura(raiz, numero, checkoutDado, opcoes)`, apontando para esse teste.
     - Linha nova na tabela de testes.

**Recomendações:**
- **:788, a volta do `abrir` lendo o quadro de novo.** Depois de `await abertura.terminou`, conferir também `expect(linhaDoQuadro(spec, 2)).toMatchObject({ tarefa: 3 })`. A `partida 2` feita durante o `npm ci` é o caso real em que a volta do `abrir` precisa reler o quadro em vez de gravar o que leu no começo. Hoje só o :813 confere a linha 2 intacta, e lá o `npm ci` falha.
- **Bloco do `LC_ALL` trocado por `pt_BR.UTF-8`.** Ele só fica vermelho se a máquina do portão tiver esse idioma instalado. Sem ele, o `flock` cai no C, "0.3" vira um prazo válido e a mutação sobrevive. Vale escrever isso no documento, ou trocar por um idioma de vírgula que o portão garanta que existe.
- **Comandos de shell lidos do ambiente.** `EDUCA_COMANDO_DE_INSTALACAO` e `EDUCA_ENCONTRO_SOB_A_TRAVA` são lidos pelo CLI de verdade (`linhas.ts:302-308`, :692), não só no teste. Fica para o `revisor-geral` e o `infra-guardian` avaliarem se isso deve ficar restrito ao teste.
- **A janela de 1500 ms.** Hoje ela só pode errar para o lado de deixar a mutação sobreviver numa máquina carregada, nunca para o lado de um vermelho falso. Está aceitável; deixo registrado para o `/retro`.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-23 14:49:28 · `tasks/prd-harness/5_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A tarefa só altera ferramenta do processo de construção (`tools/processo/linhas.ts`); nada roda em produção.
Rate limit: ok (não se aplica)
Fila e prioridade: ok (não se aplica)
Concorrência: protegida
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica)

Bloqueantes: nenhum.

A correção da rodada 1 foi feita como pedida:
- **Marca única por execução.** `prepararAbertura` grava `abertura: randomUUID()` na linha (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.ts:398-399`) e não usa mais `desde`.
- **A volta só mexe na própria abertura.** `concluirAbertura` compara `atual?.abertura === aberta.abertura` (`linhas.ts:413`). Se a marca não é a dela, devolve `atual` sem tocar na linha e recusa com "foi abandonada".
- **Teste da sequência A/B.** `o abrir que volta depois de a linha ser abandonada e aberta de novo não toca na abertura do outro` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.test.ts`) cobre o caso inteiro: A sai 1 com "abandonada", a linha segue `abrindo: true` e a `partida 1` é recusada. Depois B sai 0 e a linha fica livre.
- **Mutação.** O bloco declarado em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/5_task.md` troca a comparação por `true`. Com isso A gravaria por cima da abertura de B e sairia 0, então o teste fica vermelho.
- Rodei os testes de `abrir` em `linhas.test.ts`: 8 de 8 passaram.

O que mais mudou no diff também está certo:
- O `abrir` durante um encontro espera a trava antes de preparar a linha, e há teste e mutação para isso.
- A volta do `abrir` agora grava `desde: null`.
- A mensagem de recusa ensina a usar o `abandonar`.

Recomendações:
1. Se alguém rodar `abandonar` enquanto o `abrir` original ainda vive, o `npm ci` de A e o de B rodam ao mesmo tempo no mesmo checkout. Os dois escrevem no mesmo `node_modules`, e B pode sair 0 com a instalação corrompida pelo de A. A mensagem diz "Se o abrir morreu", mas nada confere isso. Vale registrar o pid do `abrir` na linha e recusar o `abandonar` se ele ainda estiver vivo, ou ao menos avisar na saída. Fica para a 6.0 ou para a `/retro` da X7.
2. A marca `abertura` continua no quadro depois que a linha é liberada. Não causa erro, porque cada marca é única, mas pode ser apagada junto com `abrindo: false` para o quadro não guardar resto de execução antiga.
3. A mutação do `LC_ALL` só fica vermelha em máquina com `pt_BR.UTF-8` instalado, e a limitação já está escrita no documento. Para a esteira não depender do idioma da máquina, o teste pode conferir antes se o idioma existe e falhar com mensagem clara quando ele faltar.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-23 14:49:35 · `tasks/prd-harness/5_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

As duas correções da 1ª rodada foram feitas.

1. **A volta do `abrir` agora sabe se a abertura é a dela.** O `prepararAbertura` gera uma marca com `randomUUID()` e a grava na linha (`tools/processo/linhas.ts:398-400`). O `concluirAbertura` compara essa marca com a do quadro (`linhas.ts:413`). Se não for a dele, devolve a linha como está e recusa com "foi abandonada". Testei mentalmente os três casos:
   - A é abandonada e B abre: a marca no quadro é a de B, então A recusa e não toca na linha.
   - A é abandonada e ninguém abre: a linha não está no quadro, e A recusa.
   - A termina normalmente: libera a linha.

   A mutação pedida, que troca a comparação por `true`, está no `5_task.md` e é cobrada pelo teste novo "o abrir que volta depois de a linha ser abandonada e aberta de novo". Esse teste confere três coisas: A sai diferente de 0, a linha continua com `abrindo: true` (a abertura de B), e B sai 0. A tarefa também acrescentou `desde: null` na linha liberada, que fica igual à que o `abandonar` solta. Há mutação e asserção para isso.

2. **Os casos agora estão no `cenarios.md`.** Na linha RF3 entraram: o `fechar` espera o encontro, o comando sob a trava que sai diferente de 0 recusa sem mudar nada, o `abrir` espera a trava, e a corrida A/B com a marca de cada execução. Na RF6 entraram: o `abandonar` da linha em abertura e o "foi abandonada"; a correção em curso; e as recusas de linha livre ou fechada. Na RF10 entraram: o quadro sem `base` compara com a `spec` do quadro; no andar da própria spec, ou sem quadro, compara com a `develop`. A tabela de divergências do `5_task.md` agora bate com a spec.

O que entrou além das correções, auditei junto:
- Um teste novo do `abrir` durante um encontro preso, com mutação que tira o `sobATrava`.
- Mais uma asserção de que a partida da linha 2 continua no quadro depois da volta do `abrir`.
- A mensagem de linha em uso agora diz para rodar `abandonar`.
- A entrada nova no `TODO.md`.

Nada disso sai do escopo da 5.0.

Recomendações:
- A marca por execução (`abertura`) está no `cenarios.md`, mas não no trecho "No código (5.0)" do §5(f) da `techspec.md` (`techspec.md:120-121`, que só cita `abrindo: true` e `base`). Uma linha ali deixaria o formato do quadro completo para a 6.0.
- `5_task.md:90-92`: a mutação do `LC_ALL: 'C'` só fica vermelha em máquina com `pt_BR.UTF-8` instalado. Ela depende do ambiente de quem roda o portão. Vale levar para a `/retro` da X7, com a opção de o teste forçar um idioma em que "0.3" é inválido de qualquer jeito.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/linhas.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/5_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/cenarios.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/techspec.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-23 14:50:25 · `tasks/prd-harness/5_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os da rodada 1 para o RF3 (as corridas do quadro e do `abrir`), o RF6 e o RF10, mais o que a ordem de correção pediu: o `abrir 1` durante o encontro preso da linha 2 tem de esperar a trava antes de preparar a linha e de rodar o `npm ci`. Esta rodada acrescentou dois, junto com a marca de abertura por execução e o `desde: null` na linha que fica livre:
- o `abrir` A preso, depois `abandonar 1`, depois o `abrir` B preso, e A solto: A não pode mexer na abertura de B;
- a volta do `abrir` relê o quadro, e a partida da linha 2 feita durante o `npm ci` não se perde.

**Cobertos:**
- **Correção exigida 1, feita.** O teste `o abrir da linha 1 durante o encontro da linha 2 espera a trava, e só então prepara e instala` está em `tools/processo/linhas.test.ts:871`. A tabela ganhou a linha dele em `tasks/prd-harness/5_task.md:53`, e o bloco de mutação está em `5_task.md:278-283`.
  - O texto do bloco é igual a `linhas.ts:426`.
  - Com a mutação, o `prepararAbertura` roda sem esperar e o `npm ci` injetado conta a vez logo na primeira instrução. Então `npm.vezes()` dá 1 depois de `JANELA_MS`, e o teste falha na asserção certa (`linhas.test.ts:883`). É a cláusula sendo alcançada, não um motivo lateral.
- **Marca de abertura** (`linhas.ts:398`, `413`). O teste novo `o abrir que volta depois de a linha ser abandonada e aberta de novo não toca na abertura do outro` está em `linhas.test.ts:889`.
  - Ele confere o código de saída e a mensagem de A, que a linha 1 continua `abrindo: true` depois que A volta, que a `partida 1` é recusada e que B termina com 0.
  - Esse teste falharia tanto com `aindaAbrindo = true` (o bloco declarado) quanto com o código anterior (`atual?.abrindo === true`).
- **`desde: null` na volta** (`linhas.ts:415`). Está afirmado em `linhas.test.ts:806` e provado pelo bloco em `5_task.md:285-290`.
- **Linha 2 preservada pela volta.** Afirmado em `linhas.test.ts:808`.
- **A mensagem de linha em uso que agora manda abandonar.** A regex em `linhas.test.ts:797` foi apertada para o texto inteiro.
- **Tabela contra testes.** Cada linha da tabela de `5_task.md` tem o seu teste. Isso inclui a linha 55, que junta `fechar` e o comando sob a trava: os dois testes existem, em `:961` e `:975`.
- **Itens novos do `cenarios.md`.** Os itens novos de RF6 e RF10 têm testes que já existiam e blocos que apontam para eles (`5_task.md:235-262`, `334-360`).
- **Execução.** `npx vitest run --project unidade tools/processo/linhas.test.ts` passou: 50 de 50.
- **O que é proibido.** Não há `.skip`, `.only`, teste comentado nem mock de coisa nossa. Tudo roda como processo de verdade, com `flock`, `git` e comando injetado.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Mutação que mostra para que serve a marca.** Os dois blocos de `aindaAbrindo` (`5_task.md:264-276`) usam a mesma mutação, `aindaAbrindo = true`, e o segundo não prova nada além do primeiro. Para o teste de `:889`, o bloco que mostra a razão de ser da marca troca a linha de volta para o código de antes: `aindaAbrindo = atual?.abrindo === true`. Outra opção é trocar `randomUUID()` (`linhas.ts:398`) por uma constante. O teste já falha nos dois casos; falta o bloco declarado.
2. **Linhas que faltam na tabela de `5_task.md`.** Há testes que existem e cobrem itens do `cenarios.md`, mas não têm linha na tabela:
   - `a linha abandonada durante o npm ci não volta quando ele termina`;
   - `sem o flock na máquina o comando recusa`;
   - `o prazo da trava é o de 7 min`;
   - os dois casos do RF10 que vieram nesta rodada: `o quadro de antes da base gravada` e `no andar da própria spec, com o quadro`.
3. **A janela de 1500 ms vale também para o bloco novo de `abrir` sob a trava.** Numa máquina carregada a mutação pode sobreviver, e o teste falha na direção segura. Isso já está registrado para a `/retro`.
4. **A marca `abertura` continua na linha depois que ela fica livre** (o `{ ...atual }` de `linhas.ts:415` e `:457`). Hoje não faz mal, porque toda leitura também olha `abrindo`. Limpar a marca na volta deixaria o quadro sem dado morto.

Os arquivos auditados foram `tools/processo/linhas.ts`, `tools/processo/linhas.test.ts`, `tasks/prd-harness/5_task.md` e `tasks/prd-harness/cenarios.md`, todos em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/`.
