# Achados das revisões — `tasks/correcoes/2026-10-18-fila-de-carga-no-codigo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-18 10:15:06 · `tasks/correcoes/2026-10-18-fila-de-carga-no-codigo.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A mudança só mexe nas ferramentas de processo da máquina local (`tools/ci/`, `tools/processo/`, skills). Nada disso vai para a API, o realtime ou o worker.
Rate limit: não se aplica
Fila e prioridade: ok. A esteira (`CI=true`) fica fora da fila de propósito. `conferir` e `revisores` só leem e também ficam fora. O `npm run test:e2e` que o portão inicia por dentro herda o lugar do pai e não espera de novo, então não trava.
Concorrência: protegida. A trava é um `flock` do sistema, e nada na fila decide no esquema "busca, verifica, grava". O teste "dois portões ao mesmo tempo" prova a exclusão: rodei `tools/ci/fila-de-carga.test.ts` aqui e passaram os 14 testes, em 8 s.
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: não se aplica. O aviso de espera e o aviso de "sem flock" aparecem na saída do comando.
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/fila-de-carga.test.ts:23`: o `afterEach` mata os grupos na ordem em que foram criados, então primeiro quem segura a trava e depois quem espera. Nesse intervalo curto, o `portao-local.ts --tarefa` ou o `tools/ci/e2e.ts --manter-ambiente` do teste podem pegar a trava e começar uma etapa de verdade, como subir o compose. Matar na ordem inversa (`encerrar.splice(0).reverse()`) fecha essa janela.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/fila-de-carga.ts:96`: o aviso de espera não diz quem segura a fila. O pid do dono já sai de `donosDoTravamento`; mostrá-lo ajuda a achar uma linha travada sem precisar do `pgrep`, que a skill proíbe.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/fila-de-carga.ts:100`: se o processo de fora receber `SIGKILL`, o relançado continua segurando a fila. Não há como tratar isso no código, mas vale uma linha no comentário do módulo ou no `executar-task`, para quem for depurar uma fila presa.
- O comentário e o documento da correção dizem que "o fd da trava não chega ao Node", mas com `--no-fork` a trava continua valendo depois do exec, e o teste de exclusão confirma isso. Convém reescrever a frase: a medição com `ls /proc/self/fd` mostra os fds do próprio `ls`, não os do Node.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-18 10:16:04 · `tasks/correcoes/2026-10-18-fila-de-carga-no-codigo.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. É uma correção de processo, sem seção de Tech Spec. O que foi feito é a letra (f) do item do `TODO.md`; as letras (a) a (e) ficaram abertas.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

Recomendações:

1. **Comentário e documento afirmam algo falso.**
   - Onde: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/fila-de-carga.ts:8` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tasks/correcoes/2026-10-18-fila-de-carga-no-codigo.md:45`.
   - O texto diz que "o fd da trava não chega ao Node". Medi o contrário: com `flock --no-fork <trava> node -e …`, o fd 3 do Node aponta para a trava. O que não chega são os processos que o Node inicia, porque o libuv não os deixa herdar o fd. É por isso que um filho detached não segura a fila depois que o pai sai.
   - O desenho continua certo: o `npm run test:e2e` que o portão inicia por dentro não tem o fd, e por isso precisa da cadeia de pais. Só a justificativa escrita está errada.
   - Correção: reescrever as duas frases para "o fd não passa aos filhos que o Node inicia". Do jeito que está, quem mexer depois parte de um fato falso.

2. **As mutações de `portao-local.ts` e `e2e.ts` rodam o comando de verdade na raiz do checkout.**
   - Onde: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/fila-de-carga.test.ts:164-179`.
   - Com a mutação aplicada, o portão ou o e2e iniciado pelo teste começa as etapas reais por cerca de 1,5 s antes do `SIGKILL`. Pode ser o `npm ci`, se o `node_modules` estiver velho, a construção da web ou um `docker compose` que o daemon termina sozinho.
   - O teste pega a mutação, mas pode deixar `node_modules` ou `dist` pela metade, e às vezes um container no ambiente da linha.
   - Sugestão: no teste, matar o filho assim que o primeiro `▶` aparecer, sem esperar o tempo fixo, ou rodar com um `cwd` descartável.

3. **O inode é comparado sem o dispositivo.**
   - Onde: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/fila-de-carga.ts:24`.
   - `donosDoTravamento` compara só o inode e ignora o `maj:min` do dispositivo. Um antepassado que segure um `flock` em outro sistema de arquivos com o mesmo número de inode seria lido como "já está na fila".
   - A chance é remota. Ainda assim, comparar também o `dev` do `statSync` fecha o caso.

4. **Matar o comando de fora solta a fila antes de a carga acabar.**
   - O `kill <pid>` derruba o portão relançado, mas não os filhos que o `spawnSync` iniciou (vitest, docker). Esses seguem órfãos, a fila fica livre e a carga continua correndo.
   - Já era assim com o `flock` digitado. Fica como nota para o `infra-guardian`, sem exigência nesta correção.

5. **Uma referência de texto ficou de fora.**
   - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/docs/mvp-rapido.md:388` ainda mostra `flock "$TRAVA" node tools/processo/portao-local.ts`. É texto histórico do MVP e não causa deadlock (outra trava, outro inode), só fila dupla.
   - Se o documento ainda servir de receita, vale uma nota.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-18 10:16:39 · `tasks/correcoes/2026-10-18-fila-de-carga-no-codigo.md`

VEREDITO: REPROVADO

Cenários exigidos:
- Caminho feliz: duas linhas rodam o portão ao mesmo tempo, e a segunda espera a primeira sair.
- Herança: o `npm run test:e2e` que o portão inicia por dentro, e quem já veio por um `flock` digitado, não esperam um lugar que já têm (sem isso, deadlock).
- Esteira (`CI=true`): sem fila.
- Máquina sem `flock`: o comando segue e avisa.
- O código de saída do relançado chega ao shell.
- `kill` no comando de fora solta a fila.
- `/proc/locks`: só o dono do inode conta, nunca quem espera nem outro arquivo.
- Os comandos só de leitura (`conferir` e `revisores`) não entram na fila.
- `portao-local.ts --tarefa` e `tools/ci/e2e.ts`, com a trava segurada por outra linha, esperam sem começar etapa nenhuma.
- Teste que já roda o portão como processo não pode depender da trava de verdade da máquina.
- Concorrência de verdade: duas chamadas em paralelo.

Cobertos: todos os anteriores, menos `revisores` e a dependência da trava de verdade (bloqueantes 1 e 2). A concorrência é real: os dois "portões" sobem em paralelo e o diário prova que não se sobrepõem. Rodei `npx vitest run tools/ci/fila-de-carga.test.ts`: 14 de 14 verdes, em 8 s. Não há `.skip`, mock de coisa nossa nem provedor de IA. A trava do teste fica numa pasta temporária, por `EDUCA_FILA_DE_CARGA`.

Bloqueantes:
1. **Um teste já existente agora depende da trava de verdade da máquina.** Em `tools/processo/revisoes.test.ts:473`, o `spawnSync('node', [script, ...flags], { env: { ...process.env, CLAUDE_PROJECT_DIR: raiz, EDUCA_BANCO_NOVO: '1' } })` roda o `portao-local.ts` pelo caminho principal. Agora esse caminho passa por `garantirFilaDeCarga()` e usa `/tmp/educa-carga.lock`.
   - Dentro do portão ele passa, porque o portão é antepassado e dono da trava. Na esteira também passa, porque lá `CI=true`.
   - Mas quem roda `npx vitest run tools/processo/revisoes.test.ts` ou `npm run test:unidade` fora do portão, enquanto outra linha está no portão ou no e2e, fica com o worker preso no `spawnSync` até a outra linha acabar. O `spawnSync` é síncrono, então nenhum timeout do vitest o salva. A Mesa e o test-engineer rodam esse teste assim.
   - É o caso de "teste que só passa com a máquina folgada".
   - Correção: pôr `EDUCA_FILA_DE_CARGA` apontando para um arquivo na pasta temporária do teste no `env` desse `spawnSync`, ou tirar dali o processo da fila. Fazer o mesmo em qualquer outro teste que rode o `portao-local.ts` ou o `tools/ci/e2e.ts` como processo.
2. **`revisores` está no nome do teste, mas o teste não roda `revisores`.** Em `tools/ci/fila-de-carga.test.ts:181-187`, o teste se chama "o portão que confere o carimbo ou os revisores não entra na fila", mas só roda `conferir`. A mutação declarada (linhas 132-138 do documento) põe a chamada antes do `conferir`. Uma mutação que puser `await garantirFilaDeCarga()` entre o bloco do `conferir` e o do `revisores` (`tools/processo/portao-local.ts:69`) passa verde. Com ela, a Mesa fica parada esperando a outra linha testar, que é justamente o que a correção diz evitar ("depois dos subcomandos `conferir` e `revisores`, que só lêem").
   - Correção: no mesmo teste, rodar também `tools/processo/portao-local.ts revisores` sem documento (sai com 2, sem aviso de fila), e declarar esse bloco de mutação.
3. **Duas cláusulas novas em `tools/ci/fila-de-carga.ts` não têm bloco de mutação.**
   - `'--no-fork'` (linha 83). A seção "Correção" do documento a declara como regra ("para o sinal chegar ao próprio comando"), e o comentário da linha 84 explica o defeito que ela evita. Sem ela, o `flock` morre com o SIGTERM e o filho órfão continua com a trava, então o teste "matar o comando de fora" pegaria. Mas não há bloco. Correção: um bloco que tira `'--no-fork', ` do `spawn`, citando esse teste.
   - `!cadeia.includes(atual)` (linha 45), coberta pelo caso `ancestraisDe(5, () => 5)` (linha 97 do teste). Sem a guarda, o laço síncrono prende o worker e a mutação não termina. Correção: registrar em "Sem mutação", com esse motivo e o teste que a cobre.

Recomendações:
- O teste "matar o comando de fora" (`tools/ci/fila-de-carga.test.ts:139`) espera `travaOcupada()`. Essa condição também fica verdadeira no instante da sondagem `flock -n` (linha 75 de `fila-de-carga.ts`). Se o SIGTERM chegar ali, o processo de fora morre antes de relançar, e o teste passa verde mesmo com a mutação dos sinais. Esperar a marca `longo entrou` no diário fecha essa janela.
- As margens de tempo são de 4 s para o portão e o e2e mostrarem o aviso (linhas 167 e 176) e de 1500 ms de sobreposição no caso `CI=true` (linha 123). Essas margens dependem da folga da máquina durante a unidade inteira. O padrão de 8 s do `esperar` e mais tempo de sobreposição dão margem sem perder a prova.
- Nas mutações das linhas 128 e 143, o portão e o `e2e.ts` reais chegam a rodar por até 4 s antes do SIGKILL. No portão, isso pode pegar o `npm ci` pela metade, se o `node_modules` estiver velho. No e2e, pode deixar o `docker compose` subido. Vale registrar o risco no documento, ou fazer o teste olhar só a primeira linha de saída e matar na hora.
- `...process.execArgv` no relançamento não tem teste. Hoje ele é vazio na prática; vale uma linha em "Sem mutação".

## revisor-geral · 2ª rodada · APROVADO · 2026-10-18 10:24:06 · `tasks/correcoes/2026-10-18-fila-de-carga-no-codigo.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/fila-de-carga.ts:14-15`: o comentário "Fila presa" é um procedimento de operação: dizer como achar e matar o dono da trava. Fica melhor em `docs/runbook.md` (ou na skill), com o código apontando para lá. O texto também não diz que o inode de `/proc/locks` vem junto do `maj:min`, então quem só compara pelo inode pode pegar o pid de outra trava.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/fila-de-carga.test.ts:166-172`: o `veAvisoOuEtapa` agora espera até 8 s, contra os 4 s de antes. É mais tolerante a máquina carregada, mas a falha "não veio a tempo" demora o dobro para aparecer. Isso não atrapalha, e o próximo `expect(...).toContain('fila de carga')` já distingue o caso do `▶`.

As recomendações da rodada 1 foram tratadas assim:
- **Texto sobre o fd da trava:** corrigido no documento e no cabeçalho de `fila-de-carga.ts`.
- **Mutações que rodavam o comando de verdade:** resolvidas. Os testes de chamada param no primeiro `▶` ou no aviso, e há duas mutações novas: a do `--no-fork` e a da fila antes de `revisores`. As duas batem com as linhas reais (`fila-de-carga.ts:84` e `portao-local.ts:70`).
- **Inode sem o dispositivo:** recusa registrada com o motivo.
- **Filho órfão:** virou limite conhecido em `TODO.md` e no comentário.
- **`docs/mvp-rapido.md:388`:** recusa registrada.

O teste de `revisoes.test.ts` passou a usar uma trava própria. A ordem inversa no `afterEach` e a espera pela marca `longo entrou` tiram a corrida que o teste tinha na rodada 1.

## test-engineer · 2ª rodada · APROVADO · 2026-10-18 10:24:47 · `tasks/correcoes/2026-10-18-fila-de-carga-no-codigo.md`

VEREDITO: APROVADO

Cenários exigidos:
- Duas linhas ao mesmo tempo: o segundo comando só entra depois que o primeiro sai.
- `portao-local.ts --tarefa` e `tools/ci/e2e.ts` com a trava ocupada: avisam e não começam etapa nenhuma.
- `conferir` e `revisores` não entram na fila.
- Quem já está na fila não espera de novo: o `npm run test:e2e` que o portão roda por dentro, e quem digitou `flock` na frente.
- Na esteira (`CI=true`) não há fila.
- Sem `flock` na máquina, o comando segue e avisa.
- O código de saída do comando relançado chega ao shell.
- `kill` no comando de fora derruba o relançado e solta a fila.
- A leitura de `/proc/locks` conta só o dono do inode, nunca quem espera.
- A cadeia de pais termina mesmo com laço.
- Nenhum teste existente fica preso à trava de verdade da máquina.

Cobertos: todos. Conferi as três correções da 1ª rodada:

1. **Feita.** `tools/processo/revisoes.test.ts:475-476` agora passa `EDUCA_FILA_DE_CARGA` com uma trava numa pasta temporária no `env` do `spawnSync`. Procurei com `git grep` outros testes que rodem o `portao-local.ts` ou o `tools/ci/e2e.ts` como processo e não há: `mutacoes.test.ts:146` só monta o comando, e as outras ocorrências são texto de mensagem.
2. **Feita.** `tools/ci/fila-de-carga.test.ts:195-200` roda `conferir` e `revisores` sem documento, com a trava ocupada, e exige saída 2 sem aviso de fila. O bloco de mutação que põe `await garantirFilaDeCarga()` antes de `if (argumentos[0] === 'revisores') {` foi declarado e bate com `tools/processo/portao-local.ts:70`. A ordem ajuda: `conferir` sai na linha 59, antes de chegar à mutação, e só `revisores` ficaria esperando a trava (o `sleep 60`), o que estoura os 30 s do teste.
3. **Feita.**
   - **`--no-fork`:** o bloco foi declarado e bate exatamente com `tools/ci/fila-de-carga.ts:86`. Pelo raciocínio, sem `--no-fork` o `flock` em fork morre com o SIGTERM e o `node` filho herda o fd da trava, que continua ocupada. O teste fica vermelho em `esperar(() => !travaOcupada(), 5_000)`, ou seja, vermelho pelo motivo certo.
   - **`!cadeia.includes(atual)`:** foi registrado em "Sem mutação", com o motivo (a mutação vira laço síncrono e não termina) e o caso que o cobre, `ancestraisDe(5, () => 5)` (`fila-de-carga.test.ts:98`).

As recomendações da rodada anterior também entraram:
- O teste de matar o comando espera a marca `longo entrou` (`:141`).
- Os testes de chamada param no aviso ou no primeiro `▶`, o que vier antes (`:170-172`).
- O `afterEach` encerra os processos na ordem inversa (`:24`).
- A margem do teste de `CI=true` subiu para 2500 ms.

Rodei `npx vitest run tools/ci/fila-de-carga.test.ts`: 14 de 14 passaram, em 9,4 s.

Não há `.skip`, teste comentado nem mock de coisa nossa: os testes usam `flock` e `/proc/locks` de verdade, cada um com a própria trava. A concorrência é testada com dois processos ao mesmo tempo (`:101-108` e `:123-131`), não com chamadas em sequência. Nada aqui chama provedor de IA.

Bloqueantes: nenhum.

Recomendações:
- `tools/processo/revisoes.test.ts:475`: a pasta `fila-` criada com `mkdtempSync` nunca é apagada. Ela fica em `/tmp` a cada execução; vale apagar junto com a `raiz` ou criar a trava dentro de uma pasta que o teste já limpa.
- `tools/ci/fila-de-carga.test.ts:144`: o prazo de 5 s para a trava soltar depende de o relançado morrer a tempo. Hoje sobra margem, mas se ficar instável na esteira o certo é aumentar o prazo, e não pôr a máquina sob carga para testar.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/fila-de-carga.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/fila-de-carga.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/portao-local.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/revisoes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tasks/correcoes/2026-10-18-fila-de-carga-no-codigo.md
