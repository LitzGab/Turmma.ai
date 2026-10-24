# Achados das revisões — `tasks/correcoes/2026-10-24-sinal-do-encontro-antes-do-ouvinte.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-24 15:04:37 · `tasks/correcoes/2026-10-24-sinal-do-encontro-antes-do-ouvinte.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. Esta correção mexe só na ferramenta do processo, sem seção da Tech Spec envolvida. O que o documento promete bate com o diff: o código que liga a escuta dos sinais e o relógio do prazo agora roda antes do `spawn`, `rodarEmGrupo` passou a ser exportada e há um caso de teste novo.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

Recomendações:
- **Ouvintes presos se o `spawn` lançar erro na hora.** Fica em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tools/processo/linhas.ts:452`. Antes, se o `spawn` lançasse, nada estava ligado ainda. Agora o relógio e os três ouvintes de SIGINT, SIGTERM e SIGHUP já estão de pé e só se desligam depois do `await`. Se o `spawn` lançasse ali, o processo ficaria com um ouvinte de Ctrl-C que não faz nada e com o relógio segurando o processo vivo até o fim do prazo. Com `sh` e argumentos fixos isso é improvável: as falhas comuns, como diretório inexistente, chegam como evento `error` e já são tratadas. Mesmo assim, um `try/catch` que rode o `desligar` antes de relançar fecha a porta.
- **Números que não batem.** O comentário em `linhas.ts:440` fala em "3 de 36 execuções", e o em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tools/processo/linhas-sinal.test.ts` (no caso novo) diz "na esteira, 3 de 36 execuções sob carga". O documento da correção registra 4 falhas em 48, todas na máquina local; na esteira houve uma falha só. Alinhe o texto ao documento, ou tire a contagem do comentário e deixe só a causa.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-24 15:04:41 · `tasks/correcoes/2026-10-24-sinal-do-encontro-antes-do-ouvinte.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: não se aplica
Fila e prioridade: não se aplica
Concorrência: protegida
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: não se aplica
Bloqueantes: nenhum

A correção só mexe na ferramenta de processo local (`tools/processo/`). Não toca API, worker, fila, banco, IA nem deploy. Antes, os ouvintes de sinal subiam depois do `spawn`, e um SIGINT, SIGTERM ou SIGHUP que chegasse nesse intervalo matava o encontro e deixava a verificação viva. Com os ouvintes subindo antes do `spawn`, essa corrida acaba. O teste novo prova a ordem de forma determinística. Rodei o caso novo junto com os três casos de sinal do `linhas.test.ts`: 4 de 4 verdes, em 2 s.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tools/processo/linhas.ts:452`: os ouvintes e o relógio agora sobem antes do `spawn`. Por isso, se o `spawn` lançar exceção na hora (argumento inválido, como um byte nulo no comando, ou um errno que o Node não entrega pelo evento `error`), o `desligar` nunca roda. Os três ouvintes ficam presos e passam a engolir o Ctrl-C, e o `setTimeout` segura o processo até o fim do prazo. Antes da correção isso não acontecia. O caso é raro, porque o comando vem da configuração, mas a saída é simples: envolver o `spawn` e o `await Promise.race` num `try/finally` que chama os `desligar`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tools/processo/linhas.ts:439`: o comentário diz "3 de 36 execuções", e a tarefa registra 4 de 48. Vale alinhar um ao outro.

## test-engineer · 1ª rodada · APROVADO · 2026-10-24 15:04:58 · `tasks/correcoes/2026-10-24-sinal-do-encontro-antes-do-ouvinte.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** `rodarEmGrupo` roda um comando que passa e devolve `'passou'`.
- **Borda principal:** o sinal de fim chega logo depois de o filho nascer. Os ouvintes de SIGINT, SIGTERM e SIGHUP precisam já estar de pé no `spawn`.
- **Borda:** nenhum ouvinte sobra depois que o filho acaba. Ouvinte que sobra se acumula a cada verificação.
- **Borda (efeito):** o encontro interrompido mata o grupo, volta a linha e sai com o código da verificação. Isso já é coberto pelos três casos de sinal de `linhas.test.ts`.
- **Permissão e isolamento:** não se aplicam. A correção é do processo de construção (`tools/processo/`) e não toca dado de escola, endpoint nem pessoa.
- **Concorrência:** a corrida entre o `spawn` e o `process.on`. A janela é do agendador do sistema operacional, então dá para provar a ordem de forma determinística, e o efeito fica com o teste de estabilidade.

**Cobertos:**
- **Ordem e limpeza:** `tools/processo/linhas-sinal.test.ts:23`, caso "os ouvintes de SIGINT, SIGTERM e SIGHUP já estão de pé quando o filho nasce, e saem quando ele acaba".
  - A linha 32 confere a ordem: no nascimento do filho, cada sinal tem a contagem de antes mais um.
  - A linha 33 confere a limpeza: a contagem volta à de antes.
  - A linha 31 confere o veredito `'passou'`.
- **Asserções sobre o resultado:** são as três acima, e não só sobre o código ter rodado.
- **Vermelho antes:** com o código original, o `spawn` vem antes do `process.on`, a contagem no nascimento é igual à de antes e a linha 32 falha. É o vermelho que o documento registra.
- **A mutação declarada** (`setImmediate(() => process.on(...))`) chega à cláusula e fica vermelha pelo motivo certo: no `spawn` síncrono o `setImmediate` ainda não rodou, e a linha 32 falha por asserção, sem erro de carga.
- **O diff não traz condição nova:** só reordena e exporta a função. Um bloco basta.
- **O mock de `node:child_process` não esconde a regra:** é um espião que conta e repassa para o `spawn` de verdade. O processo `sh -c true` nasce de fato, e não há provedor nem IA envolvidos.
- **Rodei os testes:**
  - `npx vitest run tools/processo/linhas-sinal.test.ts`: 1 de 1 verde.
  - `npx vitest run tools/processo/linhas.test.ts -t "recebe SIG"`: 3 de 3 verdes, os casos de efeito seguem passando com a ordem nova.
- **Proibidos:** não há `.skip`, `.only`, teste comentado nem `any`.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Os números não batem entre os textos.**
   - `tools/processo/linhas.ts:441` diz "3 de 36 execuções do teste de sinal sob carga".
   - `tools/processo/linhas-sinal.test.ts:26` diz "na esteira, 3 de 36 execuções sob carga".
   - O documento registra 4 falhas em 48 execuções na máquina local, e na esteira houve uma falha só (run 40113432287).

   Vale alinhar os três e não atribuir à esteira o número medido localmente.
2. **Dá para provar o efeito de forma determinística, sem depender de carga.** No mesmo espião, logo depois do `original.spawn`, chamar `process.emit('SIGHUP')` e conferir que `rodarEmGrupo` devolve `'interrompida'`.
   - Com o ouvinte depois do `spawn`, nenhum ouvinte recebe o sinal e o veredito sai `'passou'`.
   - É bom usar `process.emit` e não `process.kill`: no código quebrado, um sinal real derrubaria o worker do vitest.

   Isso fecha a lacuna entre "a ordem está certa" e "o encontro sobrevive ao sinal na janela", que hoje fica só no lote de estabilidade.
3. **Duas mutações a considerar para um próximo bloco:**
   - tirar o `desligar.push(() => process.off(...))`, que a linha 33 já pegaria;
   - subir o `spawn` de volta para antes da promessa `interrompido`, que reproduz a regressão exata e não só uma variante dela.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tasks/correcoes/2026-10-24-sinal-do-encontro-antes-do-ouvinte.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tools/processo/linhas.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tools/processo/linhas-sinal.test.ts

## revisor-geral · 2ª rodada · APROVADO · 2026-10-24 15:15:44 · `tasks/correcoes/2026-10-24-sinal-do-encontro-antes-do-ouvinte.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. Esta correção mexe só no processo (`tools/processo/`) e não tem seção de Tech Spec. O documento registra cada ajuste desta rodada, item por item.

Portão local: carimbo válido. Ele cobre typecheck, lint, segredo, dependências, unidade e alvo para o código atual.

Bloqueantes: nenhum.

As recomendações da 1ª rodada foram todas aplicadas:
- **`try/finally` no `spawn`:** em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-esteira-sem-branch-de-linha/tools/processo/linhas.ts`, por volta das linhas 453 a 466, o `spawn` e o `await Promise.race` ficaram dentro do `try`, e o `finally` desliga relógio e ouvintes. O `matarGrupo` continua depois do `finally` e só roda quando o filho nasceu, como antes.
- **Comentários sem contagem:** saíram tanto do código quanto do teste. Os números agora ficam só no documento da correção.
- **Caso com `process.emit` que prova o efeito:** o teste diferencia o código certo do quebrado. Com o ouvinte depois do `spawn`, o `emit` síncrono não encontra ouvinte, o `sleep 2` vai até o fim e o veredito sai `'passou'` em vez de `'interrompida'`. A escolha de `process.emit` em vez de `process.kill` tem motivo e está explicada no comentário.
- **Caso do `spawn` que lança:** o relógio falso entra antes da chamada, então `vi.getTimerCount()` igual a 0 prova mesmo que o `clearTimeout` rodou. O `afterEach` restaura o estado do espião, e o `finally` do teste restaura o relógio.
- **Blocos de mutação:** são três, cada um ligado a um caso. A terceira mutação (o desligar fora do `finally`) mantém o caminho normal verde e quebra só quando o `spawn` lança, que é exatamente o que o caso novo cobre.

Recomendações:
- **`const nascido = filho` em `linhas.ts`:** a variável existe só para o TypeScript entender o tipo dentro dos closures. Dá para tirar: atribuir direto a uma `const` dentro do `try` e guardar só o `pid` numa variável de fora. Isso também elimina o `let filho: ChildProcess` e o import de tipo.
- **Texto da terceira mutação no documento:** a frase "o desligar volta a rodar só depois do `await`" descreve bem o caminho normal. Valeria acrescentar "e não roda quando o `spawn` lança", que é o que o teste pega.

## test-engineer · 2ª rodada · APROVADO · 2026-10-24 15:15:54 · `tasks/correcoes/2026-10-24-sinal-do-encontro-antes-do-ouvinte.md`

VEREDITO: APROVADO

Cenários exigidos:
- Ordem: os ouvintes de SIGINT, SIGTERM e SIGHUP já existem quando o filho nasce, e saem quando ele acaba.
- Efeito: um sinal que chega logo depois de o `spawn` voltar dá `'interrompida'`, e não `'passou'`.
- Robustez: um `spawn` que lança não deixa ouvinte de sinal nem relógio para trás.
- Isolamento entre escolas e permissão não se aplicam: é ferramenta do processo, sem dado de escola nem papel.

Cobertos (`tools/processo/linhas-sinal.test.ts`, 3 de 3 verdes nesta rodada):
- Ordem, em `linhas-sinal.test.ts:40`. Afirma a contagem de ouvintes no nascimento (`antes + 1`) e a volta a `antes` no fim.
- Efeito, em `linhas-sinal.test.ts:48`. Usa `process.emit('SIGHUP')` dentro do `spawn` espiado, logo depois do `original.spawn`, que é a janela exata da corrida. Usa `'sleep 2'` com prazo de 60 s, então o único caminho para `'interrompida'` é o ouvinte. Também afirma que os ouvintes voltam a `antes`.
- Robustez, em `linhas-sinal.test.ts:56`. Usa relógio falso ligado antes da chamada, de modo que o `setTimeout` do prazo é contado por `vi.getTimerCount()`. O `try/finally` devolve o relógio de verdade. O `afterEach` limpa o estado do espião.

Mutações, conferidas contra o código atual sem aplicar nada:
- Os blocos 1 e 2 (`process.on` → `setImmediate(...)`) casam com `linhas.ts:449`, com o mesmo recuo. Os dois ficam vermelhos pelo motivo certo:
  - no caso 1, a contagem no nascimento seria `antes`, e não `antes + 1`;
  - no caso 2, o `emit` síncrono não encontra ouvinte, o `sleep 2` termina e o veredito vira `'passou'`.
- O bloco 3 (desligar fora do `finally`) casa com `linhas.ts:463-465`. Com o `spawn` lançando, a exceção pula o desligar e o caso 3 fica vermelho, porque o ouvinte e o relógio continuam lá.
- Não sobra cláusula nova sem bloco. O `git diff` em `tools/` mostra só a subida dos ouvintes antes do `spawn`, o `try/finally` e o `export`. Tudo isso tem bloco ou asserção.

Correções da rodada 1: não houve bloqueante. As recomendações aplicadas por ordem da Mesa estão no diff:
- o `try/finally` no `spawn`;
- os comentários sem contagem de execuções;
- o caso com `process.emit` que prova o efeito;
- o bloco de mutação novo.

Sem `.skip`, sem teste comentado e sem provedor de IA. O mock de `spawn` é um espião na frente do `spawn` de verdade, e não esconde a regra. Não há operação concorrente a provar com chamadas em paralelo: a corrida é entre um processo e um sinal, e o caso 2 a provoca de forma determinística, sem depender de carga na máquina.

Bloqueantes: nenhum.

Recomendações:
- O caso de efeito (`linhas-sinal.test.ts:48`) só emite SIGHUP. Para SIGINT e SIGTERM, só a ordem está provada, no caso 1. Um `it.each` com os três sinais custaria pouco.
- O caso 3 não prova que `matarGrupo` deixa de ser chamado quando o `spawn` lança. Isso decorre da exceção, mas não está afirmado. É baixo risco: não há filho para matar.
