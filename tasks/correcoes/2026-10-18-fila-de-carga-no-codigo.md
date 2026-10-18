# Correção — a fila de carga entre as linhas vivia só no texto das skills; agora é do `portao-local.ts` e do `tools/ci/e2e.ts`

**Origem:** `tasks/prd-telas-da-coordenacao/retro.md`, M5 (`TODO.md`, "(X1, retrospectiva) Código de processo", letra (f)).
**Subagentes obrigatórios:** `infra-guardian`, `revisor-geral`
<!-- Os dois vieram no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção toca `tools/ci/` e `tools/processo/`. -->

## Sintoma

O `flock /tmp/educa-carga.lock` que põe o e2e e o portão de uma linha na fila atrás dos da outra só existia no texto do
`executar-task`, do `corrigir` e do `/seguir`. Quem digitava `node tools/processo/portao-local.ts` ou
`node tools/ci/e2e.ts` sem o prefixo rodava junto com a outra linha, e o e2e estourava os 30 s do runner (X2, carga de 9
a 24). A fila dependia de quem digita o comando.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa. As letras (a) a (e) do mesmo item do
`TODO.md` são correções seguintes, neste mesmo andar.

## Causa

O lock era convenção de texto, não código. Dois comandos que rodam suíte pesada (`portao-local.ts` fora de
`conferir`/`revisores`, e `tools/ci/e2e.ts`) não sabiam que a máquina é uma só.

## Teste que reproduz

`tools/ci/fila-de-carga.test.ts` (com a fixture `tools/ci/fixtures/usa-a-fila.ts`). O teste usa uma trava própria
(`EDUCA_FILA_DE_CARGA`, numa pasta temporária): a de verdade é a que o portão que roda os testes está segurando.

- dois portões ao mesmo tempo não se sobrepõem (o segundo entra depois de o primeiro sair);
- `portao-local.ts --tarefa` e `tools/ci/e2e.ts`, com a trava segurada por outra linha, avisam que esperam e **não** começam
  etapa nenhuma (nenhum `▶`); `portao-local.ts conferir` não espera;
- o processo que o portão inicia por dentro (`npm run test:e2e`) e quem já veio dentro de um `flock` digitado não esperam por
  um lugar que já têm (sem isso, deadlock);
- na esteira (`CI=true`) não há fila; sem `flock` na máquina o comando segue e avisa;
- o código de saída do relançado é o do shell, e `kill <pid>` no comando de fora derruba o relançado e solta a fila;
- a leitura de `/proc/locks` (só o dono do inode, nunca quem espera) e a cadeia de pais.

Vermelho antes: o módulo não existia (o arquivo de teste não carrega); sem as duas chamadas, o portão e o e2e começam na hora, e
cada cláusula abaixo tem a sua mutação.

## Correção

- `tools/ci/fila-de-carga.ts` (novo): `garantirFilaDeCarga()`. Quem já está na fila segue; os outros se relançam por dentro de
  `flock --no-fork /tmp/educa-carga.lock node <mesmo script> <mesmos argumentos>` e saem com o código do relançado. O fd da trava
  vive no processo que o `flock` executa, mas **não passa aos filhos que o Node inicia** (o libuv não o deixa herdar; medido com
  `npm exec -- node` sob `flock`), e o `npm run test:e2e` que o portão inicia por dentro é um deles. Por isso "já estou na fila" é:
  algum antepassado deste processo é dono da trava em `/proc/locks`. `--no-fork` para o sinal chegar ao próprio comando. Na esteira (`CI=true`) não há fila.
- `tools/processo/portao-local.ts`: chama a fila antes de rodar suíte, depois dos subcomandos `conferir` e `revisores`, que só lêem.
- `tools/ci/e2e.ts`: chama a fila antes das etapas.
- `.claude/skills/executar-task`, `corrigir` e `seguir`: o `flock` digitado sai do portão e do `tools/ci/e2e.ts`; fica no
  `npx playwright test` direto, que não passa por eles. O `flock` digitado na frente continua funcionando (teste acima).
- `TODO.md`: a letra (f) marcada como feita.

## Mutações

```mutacao
arquivo: tools/ci/fila-de-carga.ts
teste: tools/ci/fila-de-carga.test.ts › não há fila: cada job tem a máquina inteira
-  if (process.env['CI'] === 'true') return
   const caminho = process.env[VARIAVEL_DA_FILA] ?? FILA_DE_CARGA
```

```mutacao
arquivo: tools/ci/fila-de-carga.ts
teste: tools/ci/fila-de-carga.test.ts › herda o lugar, e não espera por ele
-  if (jaEstaNaFila(caminho)) return
+  if (jaEstaNaFila(caminho) && false) return
```

```mutacao
arquivo: tools/ci/fila-de-carga.ts
teste: tools/ci/fila-de-carga.test.ts › lê /proc/locks
-    if (achado && Number(achado[2]) === inode) donos.add(Number(achado[1]))
+    if (achado) donos.add(Number(achado[1]))
```

```mutacao
arquivo: tools/ci/fila-de-carga.ts
teste: tools/ci/fila-de-carga.test.ts › lê /proc/locks
-    const achado = /^\d+:\s+FLOCK\s+\S+\s+\S+\s+(\d+)\s+[0-9a-f]+:[0-9a-f]+:(\d+)\s/.exec(linha)
+    const achado = /^\d+:\s+(?:->\s+)?FLOCK\s+\S+\s+\S+\s+(\d+)\s+[0-9a-f]+:[0-9a-f]+:(\d+)\s/.exec(linha)
```

```mutacao
arquivo: tools/ci/fila-de-carga.ts
teste: tools/ci/fila-de-carga.test.ts › os ancestrais vêm do pai
-  while (atual !== null && atual > 0 && !cadeia.includes(atual)) {
+  while (atual !== null && !cadeia.includes(atual)) {
```

```mutacao
arquivo: tools/ci/fila-de-carga.ts
teste: tools/ci/fila-de-carga.test.ts › o aviso de espera diz
-  if (sondagem.status !== 0) {
+  if (sondagem.status !== 99) {
```

```mutacao
arquivo: tools/ci/fila-de-carga.ts
teste: tools/ci/fila-de-carga.test.ts › sem o flock na máquina
-  if (sondagem.error) {
+  if (sondagem.error && false) {
```

```mutacao
arquivo: tools/ci/fila-de-carga.ts
teste: tools/ci/fila-de-carga.test.ts › matar o comando de fora
-  const filho = spawn('flock', ['--no-fork', caminho, process.execPath, ...process.execArgv, ...process.argv.slice(1)], { stdio: 'inherit' })
+  const filho = spawn('flock', [caminho, process.execPath, ...process.execArgv, ...process.argv.slice(1)], { stdio: 'inherit' })
```

```mutacao
arquivo: tools/ci/fila-de-carga.ts
teste: tools/ci/fila-de-carga.test.ts › matar o comando de fora
-  for (const sinal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) process.on(sinal, () => filho.kill(sinal))
+  for (const sinal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) process.on(sinal, () => undefined)
```

```mutacao
arquivo: tools/ci/fila-de-carga.ts
teste: tools/ci/fila-de-carga.test.ts › quem falha lá dentro devolve o mesmo código
-  process.exit(codigo)
+  process.exit(0)
```

```mutacao
arquivo: tools/ci/fila-de-carga.ts
teste: tools/ci/fila-de-carga.test.ts › a trava é a mesma que as skills digitam
-export const FILA_DE_CARGA = '/tmp/educa-carga.lock'
+export const FILA_DE_CARGA = '/tmp/outra-carga.lock'
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/ci/fila-de-carga.test.ts › node tools/processo/portao-local.ts --tarefa espera
-await garantirFilaDeCarga()
+void garantirFilaDeCarga
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/ci/fila-de-carga.test.ts › o portão que confere o carimbo ou os revisores não entra na fila
-if (argumentos[0] === 'conferir') {
+await garantirFilaDeCarga()
+if (argumentos[0] === 'conferir') {
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/ci/fila-de-carga.test.ts › o portão que confere o carimbo ou os revisores não entra na fila
-if (argumentos[0] === 'revisores') {
+await garantirFilaDeCarga()
+if (argumentos[0] === 'revisores') {
```

```mutacao
arquivo: tools/ci/e2e.ts
teste: tools/ci/fila-de-carga.test.ts › node tools/ci/e2e.ts espera a outra linha
-await garantirFilaDeCarga()
+void garantirFilaDeCarga
```

## Sem mutação

- `process.env[VARIAVEL_DA_FILA] ?? FILA_DE_CARGA` (o caminho que o teste troca): trocá-lo faria o teste usar a trava de verdade, que
  o portão que o roda segura, e só a máquina de quem o rodasse sozinho veria a diferença. O caminho padrão é provado pelo teste da
  constante.
- `!cadeia.includes(atual)` em `ancestraisDe`: a guarda contra o laço no `/proc`. Sem ela o laço é síncrono e prende o worker, e a
  mutação não termina. O caso `ancestraisDe(5, () => 5)` ("os ancestrais vêm do pai") a cobre: ele só termina com a guarda.
- A mensagem de cada aviso: texto, não regra.
- Os testes de chamada (`portao-local.ts --tarefa` e `e2e.ts`) param no primeiro `▶` ou no aviso, o que vier antes: com a chamada
  fora, a primeira etapa real sai na hora e é morta em 50 ms (o `npm ci` do portão só roda com o lock velho; o e2e começa por
  `playwright install`), sem construir a web nem subir o compose.
- O teste de `revisoes.test.ts` que roda o `portao-local.ts` como processo agora usa uma trava própria (`EDUCA_FILA_DE_CARGA`), e não
  a da máquina.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | O aviso de espera não diz quem segura a fila (mostrar o pid do dono, que já sai de `donosDoTravamento`) | Recusada nesta correção: muda o comportamento do comando e pede teste e mutação novos. Fica em `TODO.md`, junto das letras (a) a (e) do item "Código de processo", se o Joaquim quiser |
| revisor-geral (1ª) | O inode é comparado sem o dispositivo (`maj:min`); comparar também o `dev` do `statSync` | Recusada: o próprio revisor chama a chance de remota, e a mudança em `donosDoTravamento` caducaria todos os revisores e pediria bloco de mutação novo. Motivo registrado no documento |
| revisor-geral (1ª) | Matar o comando de fora solta a fila antes de a carga acabar (os filhos do `spawnSync` seguem órfãos) | Sem exigência do revisor, e "já era assim com o `flock` digitado". Nota em `TODO.md`, na letra (f), como limite conhecido |
| revisor-geral (1ª) | `docs/mvp-rapido.md:388` ainda mostra `flock "$TRAVA" node tools/processo/portao-local.ts` | Recusada: texto histórico do MVP, fora dos arquivos desta correção, e o revisor diz que não causa deadlock (outra trava, outro inode) |
| revisor-geral (2ª) | O comentário "Fila presa" em `tools/ci/fila-de-carga.ts:14-15` é procedimento de operação: ficaria melhor em `docs/runbook.md` ou na skill, e o texto não diz que o inode de `/proc/locks` vem com o `maj:min` | Não aplicar: o comentário já diz como achar o dono e é o que o revisor da rodada 1 pediu ("uma linha no comentário do módulo ou no `executar-task`"). Mover para o runbook fica para a próxima correção que tocar o módulo |
| revisor-geral (2ª) | `veAvisoOuEtapa` espera até 8 s, contra os 4 s de antes; a falha demora o dobro para aparecer | Recusada: o próprio revisor diz que não atrapalha, e a espera maior é a margem que o `test-engineer` pediu na rodada 1 |
| test-engineer (2ª) | `tools/processo/revisoes.test.ts:475`: a pasta `fila-` criada com `mkdtempSync` nunca é apagada e fica em `/tmp` a cada execução | `TODO.md`, no item "Código de processo", letra (f): apagar junto com a `raiz` na próxima correção que tocar `revisoes.test.ts` |
| test-engineer (2ª) | `tools/ci/fila-de-carga.test.ts:144`: o prazo de 5 s para a trava soltar pode ficar instável na esteira; aumentar o prazo, e não pôr a máquina sob carga | Recusada: hoje sobra margem (9,4 s no arquivo inteiro). Se aparecer instável na esteira, sobe o prazo na correção do teste intermitente |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-18 10:13:50 | 2026-10-18 10:15:06 | `infra-guardian` | 1 | APROVADO | af9d05ae993faf43b |
| 2026-10-18 10:13:49 | 2026-10-18 10:16:04 | `revisor-geral` | 1 | APROVADO | aeaeb9800caa6280a |
| 2026-10-18 10:13:47 | 2026-10-18 10:16:39 | `test-engineer` | 1 | REPROVADO | a5b1acb3c81accfa7 |
| 2026-10-18 10:23:46 | 2026-10-18 10:24:06 | `revisor-geral` | 2 | APROVADO | a436f5de15df4fd40 |
| 2026-10-18 10:23:42 | 2026-10-18 10:24:47 | `test-engineer` | 2 | APROVADO | aa7ceab6b2d449cbd |
