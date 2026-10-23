# Tarefa 6.0 — O encontro roda tipagem e lint e recusa o vermelho sem avançar a spec

**Funcionalidade:** harness (X7) · **Depende de:** 5.0
**Subagentes obrigatórios:** `infra-guardian`
**Porte:** grande

## Objetivo

Duas linhas verdes que juntas quebram a tipagem ou o lint não chegam à spec: o encontro verifica no checkout da linha,
depois do merge e antes do `--ff-only`, com prazo e grupo de processo próprio, e no vermelho desfaz tudo na ordem
certa.

## Contexto necessário

- `techspec.md` §5(f), item **Encontro (RF3)**, e §7c (a linha "Mutação travada": o jeito de matar o grupo é o mesmo)
- `prd.md` RF3
- `cenarios.md` seção A, **RF3**: as frases do lint, da verificação acima do prazo e do `npm ci` com o lock
- `.claude/rules/80-infra-e-carga.md`
- Código: `tools/processo/linhas.ts`, `encontro` (o `merge --no-edit`, o `--ff-only`, o push) e a trava da 5.0

## Subtarefas

- [x] 6.1 — Depois do `merge --no-edit` da spec no checkout da linha: `npm ci` se o `package-lock.json` mudou, e
  `npm run typecheck` e `npm run lint`, com o comando injetável no teste
- [x] 6.2 — Prazo de 3 min (6 com `npm ci`), em grupo de processo próprio; no vermelho ou no prazo, nesta ordem: o
  grupo morre (SIGTERM e, 5 s depois, SIGKILL), a linha volta ao commit de antes do merge, a trava é solta
- [x] 6.3 — Saída: código próprio, spec parada, sem push, linha ocupada, e a frase de que a correção refaz o merge
- [x] 6.4 — O prazo padrão de quem espera a trava (5.0) passa de 6 min mais 5 s
- [x] 6.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/linhas.ts` | alterado |
| `tools/processo/linhas.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| duas linhas verdes que juntas quebram o lint | integração de processo | código de saída próprio; spec parada; linha no commit de antes do merge; sem push; linha ocupada; saída manda refazer o merge |
| as duas verdes que juntas passam | idem | a spec avança por `--ff-only` |
| lock alterado / lock igual | idem | `npm ci` roda antes / não roda |
| verificação acima do prazo injetado | idem | tratada como vermelha |
| quem pega a trava, logo que o `flock` retorna, lê a ref do HEAD direto do disco (worktree: `gitdir:`, diretório comum ou `packed-refs`) | idem | já é o commit de antes do merge: o reset veio antes de soltar |
| o neto que o comando injetado abriu | idem | morto (pid) quando a trava é pega |
| o neto ignora SIGTERM e escreve num arquivo versionado até o SIGKILL | idem | o checkout está limpo: matar veio antes do reset |
| o prazo padrão de quem espera | unidade | maior que 6 min + 5 s |

## Como testar

- Copiar `tools/processo/linhas.test.ts › partida, encontro e fechamento, em repositórios de verdade › duas linhas se encontram na spec: cada commit de tarefa chega inteiro, e a segunda traz a primeira`, e `› conflito de código para o encontro: nada muda, e o conserto custa só os arquivos em conflito` para o "nada muda".
- O comando de verificação é injetado (variável de ambiente): um script que sai 1 quando acha um marcador nos dois arquivos, e outro que abre um neto (`sh -c 'trap "" TERM; while :; do echo x >> versionado.txt; done' &`) e espera o arquivo-sinal.
- Rodar: `npx vitest run --project unidade tools/processo/linhas.test.ts`.
- Armadilha: ler o HEAD com `git` no teste de ordem dá corrida; leia o arquivo da ref.

## Fora do escopo desta tarefa

A trava e o quadro (5.0); a mutação com prazo (7.0), que só compartilha o jeito de matar o grupo.

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O ponto de injeção da 5.0 (`comandoSobATrava`, antes do merge) passa a ser **o comando da verificação**, depois do merge; o teste `o comando sob a trava do encontro que falha recusa sem mudar nada` da 5.0 foi trocado pelos do RF3 (a recusa agora desfaz o merge e sai com o código 5) | A 5.0 deixou o ponto "que a 6.0 usa para a verificação"; o comando de verificação do `cenarios.md` é injetado, e depois do merge | `techspec.md` §5(f), "Quadro" e "Encontro (RF3)", trecho "No código (6.0)"; `cenarios.md` A, RF3 |
| Código de saída **5** (`CODIGO_DA_VERIFICACAO`) para a verificação vermelha, acima do prazo ou interrompida; a saída começa por `VERIFICAÇÃO RECUSADA` (o `/seguir` lê `RECUSADO` e `CONFLITO`; o texto dele é das tarefas de texto) | A spec pede "código de saída próprio"; 1, 3 e 4 já têm dono | idem |
| `npm ci` e verificação sob **um só prazo e um só grupo** (`(npm ci) && (verificação)`), 3 min ou 6 com o lock mudado; o lock "mudou" é o `git diff` do `package-lock.json` entre o commit de antes do merge e o de agora, e o `npm ci` é o `comandoDeInstalacao` da 5.0 | O prazo da spec é um ("3 min, ou 6 com `npm ci`"); um grupo só garante que nada sobra | idem |
| O encontro que recebe SIGINT, SIGTERM ou SIGHUP **enquanto verifica** mata o grupo, volta a linha e sai com o código 5 | O grupo é de outra sessão e não recebe o sinal do encontro; sem isto, o `kill` do encontro deixava o `tsc` solto e a linha no merge. O `mutacoes.ts` faz o mesmo no supervisor | idem |
| `prazoDaVerificacaoMs` e `esperaAteSigkillMs` em `Opcoes`, com `EDUCA_ENCONTRO_PRAZO_DA_VERIFICACAO_MS` e `EDUCA_ENCONTRO_ESPERA_ATE_SIGKILL_MS` (só número positivo); a saída diz o comando que rodou, verde ou vermelho. Resolve a recomendação aberta da 5.0 sobre a injeção pelo ambiente "calada" | Os testes de processo rodam o `linhas.ts` como CLI e precisam encurtar o prazo e a espera | idem |
| `PRAZO_DA_TRAVA_MS` (6.4) **não muda**: 7 min já é maior que 6 min + 5 s; o teste passa a afirmar a relação | A subtarefa pede que passe de 6 min + 5 s, e passa | `techspec.md` §5(f), "Quadro" |
| O `linhas.ts` tem a sua `sinalAoGrupo` e a sua `matarGrupo`, e não importa as do `mutacoes.ts` | O `mutacoes.ts` roda copiado fora da pasta e só importa `node:`; a 7.0, em outra linha, ainda não está nesta | `techspec.md` §5(f), "Encontro (RF3)" |

## Mutações

Um bloco por cláusula do §5(f), "Encontro (RF3)": cada constante e prazo, o código de saída, o comando padrão e o do `npm ci`, o
`diff` do lock (o termo, o `antes`, o caminho), o `&&` que faz o `npm ci` vermelho valer sem rodar o resto, o prazo de
6 min só com o lock, o `cwd`, o `detached`, a saída para o erro, o relógio e o `clearTimeout` dele, os ouvintes de sinal e
a devolução deles, o SIGTERM, a espera, o SIGKILL, o `reset`, a saída do `reset` que falha e cada trecho do texto.

Sem bloco, por não haver teste que as distinga: o `filho.once('error', …)` de `rodarEmGrupo` (só dispara se o `sh` nem
abre, e o `git` do encontro, que roda antes e usa o mesmo `PATH`, falharia primeiro), e o segundo laço de `matarGrupo`
com a sua `ESPERA_DEPOIS_DO_SIGKILL_MS` (o SIGKILL já chegou quando o `kill` volta; o laço cobre o processo que morre um
instante depois, e nenhum teste o torna observável sem uma corrida).

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o prazo da verificação é de 3 min
-export const PRAZO_DA_VERIFICACAO_MS = 3 * 60 * 1000
+export const PRAZO_DA_VERIFICACAO_MS = 60 * 1000
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o prazo da verificação é de 3 min
-export const PRAZO_DA_VERIFICACAO_COM_NPM_CI_MS = 6 * 60 * 1000
+export const PRAZO_DA_VERIFICACAO_COM_NPM_CI_MS = 3 * 60 * 1000
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o prazo da verificação é de 3 min
-export const ESPERA_ATE_SIGKILL_MS = 5_000
+export const ESPERA_ATE_SIGKILL_MS = 1_000
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › duas linhas verdes que juntas quebram o lint
-export const CODIGO_DA_VERIFICACAO = 5
+export const CODIGO_DA_VERIFICACAO = 4
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › sem lock novo: npm run typecheck
-export const COMANDO_DA_VERIFICACAO = 'npm run typecheck && npm run lint'
+export const COMANDO_DA_VERIFICACAO = 'npm run typecheck; npm run lint'
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › com o lock novo da spec: npm ci antes
-export const COMANDO_DE_INSTALACAO = 'npm ci'
+export const COMANDO_DE_INSTALACAO = 'npm install'
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o prazo da trava é o de 7 min
-  return Number.isFinite(numero) && numero > 0 ? numero : null
+  return numero > 0 ? numero : null
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o prazo da trava é o de 7 min
-  return Number.isFinite(numero) && numero > 0 ? numero : null
+  return Number.isFinite(numero) ? numero : null
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o prazo da trava é o de 7 min
-    ...(prazoDaTrava === null ? {} : { prazoDaTravaMs: prazoDaTrava }),
+    ...(prazoDaTrava !== null ? {} : { prazoDaTravaMs: prazoDaTrava }),
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o prazo da trava é o de 7 min
-    ...(prazoDaVerificacao === null ? {} : { prazoDaVerificacaoMs: prazoDaVerificacao }),
+    ...(prazoDaVerificacao !== null ? {} : { prazoDaVerificacaoMs: prazoDaVerificacao }),
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o prazo da trava é o de 7 min
-    ...(esperaAteSigkill === null ? {} : { esperaAteSigkillMs: esperaAteSigkill }),
+    ...(esperaAteSigkill !== null ? {} : { esperaAteSigkillMs: esperaAteSigkill }),
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o prazo da verificação é de 3 min
-  return opcoes.prazoDaVerificacaoMs ?? (comNpmCi ? PRAZO_DA_VERIFICACAO_COM_NPM_CI_MS : PRAZO_DA_VERIFICACAO_MS)
+  return comNpmCi ? PRAZO_DA_VERIFICACAO_COM_NPM_CI_MS : PRAZO_DA_VERIFICACAO_MS
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o prazo da verificação é de 3 min
-  return opcoes.prazoDaVerificacaoMs ?? (comNpmCi ? PRAZO_DA_VERIFICACAO_COM_NPM_CI_MS : PRAZO_DA_VERIFICACAO_MS)
+  return opcoes.prazoDaVerificacaoMs ?? (comNpmCi ? PRAZO_DA_VERIFICACAO_MS : PRAZO_DA_VERIFICACAO_COM_NPM_CI_MS)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › vermelho: quem pega a trava
-    process.kill(-grupo, sinal)
+    process.kill(grupo, sinal)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › verificação acima do prazo injetado
-  if (!sinalAoGrupo(grupo, 'SIGTERM')) return
   const limite = Date.now() + esperaMs
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › verificação acima do prazo injetado
-  while (sinalAoGrupo(grupo, 0) && Date.now() < limite) await dormir(25)
+  while (sinalAoGrupo(grupo, 0) && Date.now() < limite && false) await dormir(25)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › verificação acima do prazo injetado
-  const limite = Date.now() + esperaMs
+  const limite = Date.now()
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › vermelho: quem pega a trava
-  sinalAoGrupo(grupo, 'SIGKILL')
   const fim = Date.now() + ESPERA_DEPOIS_DO_SIGKILL_MS
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › as duas verdes que juntas passam
-  const filho = spawn('sh', ['-c', comando], { cwd: checkout, detached: true, stdio: ['ignore', 2, 2] })
+  const filho = spawn('sh', ['-c', comando], { detached: true, stdio: ['ignore', 2, 2] })
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › vermelho: quem pega a trava
-  const filho = spawn('sh', ['-c', comando], { cwd: checkout, detached: true, stdio: ['ignore', 2, 2] })
+  const filho = spawn('sh', ['-c', comando], { cwd: checkout, detached: false, stdio: ['ignore', 2, 2] })
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › vermelho: quem pega a trava
-  const filho = spawn('sh', ['-c', comando], { cwd: checkout, detached: true, stdio: ['ignore', 2, 2] })
+  const filho = spawn('sh', ['-c', comando], { cwd: checkout, detached: true, stdio: 'ignore' })
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › duas linhas verdes que juntas quebram o lint
-    filho.once('exit', (codigo) => resolver(codigo === 0 ? 'passou' : 'vermelha'))
+    filho.once('exit', () => resolver('passou'))
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › verificação acima do prazo injetado
-    const relogio = setTimeout(() => resolver('prazo'), prazoMs)
+    const relogio = setTimeout(() => resolver('interrompida'), prazoMs)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › verificação acima do prazo injetado
-    const relogio = setTimeout(() => resolver('prazo'), prazoMs)
+    const relogio = setTimeout(() => resolver('prazo'), 60_000)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › dois encontros ao mesmo tempo
-    desligar.push(() => clearTimeout(relogio))
+    desligar.push(() => undefined)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o encontro que recebe SIGTERM
-      process.on(sinal, aoSinal)
       desligar.push(() => process.off(sinal, aoSinal))
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o encontro que recebe SIGTERM
-      const aoSinal = () => resolver('interrompida')
+      const aoSinal = () => resolver('prazo')
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › verificação acima do prazo injetado
-      desligar.push(() => process.off(sinal, aoSinal))
+      desligar.push(() => undefined)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › verificação acima do prazo injetado
-  for (const fechar of desligar) fechar()
   if (filho.pid !== undefined) await matarGrupo(filho.pid, esperaMs)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › a verificação que passa e deixa um neto de pé
-  if (filho.pid !== undefined) await matarGrupo(filho.pid, esperaMs)
+  if (filho.pid !== undefined && veredito !== 'passou') await matarGrupo(filho.pid, esperaMs)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › vermelho: quem pega a trava
-  if (filho.pid !== undefined) await matarGrupo(filho.pid, esperaMs)
+  if (filho.pid !== undefined && veredito !== 'vermelha') await matarGrupo(filho.pid, esperaMs)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › lock alterado pela spec
-  const lockMudou = git(checkout, 'diff', '--name-only', antes, 'HEAD', '--', 'package-lock.json') !== ''
+  const lockMudou = git(checkout, 'diff', '--name-only', antes, 'HEAD', '--', 'package-lock.json') === ''
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › lock alterado pela spec
-  const lockMudou = git(checkout, 'diff', '--name-only', antes, 'HEAD', '--', 'package-lock.json') !== ''
+  const lockMudou = git(checkout, 'diff', '--name-only', 'HEAD', 'HEAD', '--', 'package-lock.json') !== ''
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › lock da própria linha e código novo da spec
-  const lockMudou = git(checkout, 'diff', '--name-only', antes, 'HEAD', '--', 'package-lock.json') !== ''
+  const lockMudou = git(checkout, 'diff', '--name-only', antes, 'HEAD') !== ''
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › duas linhas verdes que juntas quebram o lint
-  const verificar = opcoes.comandoSobATrava ?? COMANDO_DA_VERIFICACAO
+  const verificar = COMANDO_DA_VERIFICACAO
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › lock alterado pela spec
-  const comando = lockMudou ? `(${opcoes.comandoDeInstalacao ?? COMANDO_DE_INSTALACAO}) && (${verificar})` : verificar
+  const comando = false ? `(${opcoes.comandoDeInstalacao ?? COMANDO_DE_INSTALACAO}) && (${verificar})` : verificar
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o npm ci que falha é vermelho
-  const comando = lockMudou ? `(${opcoes.comandoDeInstalacao ?? COMANDO_DE_INSTALACAO}) && (${verificar})` : verificar
+  const comando = lockMudou ? `(${opcoes.comandoDeInstalacao ?? COMANDO_DE_INSTALACAO}) ; (${verificar})` : verificar
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › lock alterado pela spec
-  const comando = lockMudou ? `(${opcoes.comandoDeInstalacao ?? COMANDO_DE_INSTALACAO}) && (${verificar})` : verificar
+  const comando = lockMudou ? `(${COMANDO_DE_INSTALACAO}) && (${verificar})` : verificar
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › lock alterado pela spec
-  const prazoMs = prazoDaVerificacao(lockMudou, opcoes)
+  const prazoMs = prazoDaVerificacao(false, opcoes)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › vermelho: quem pega a trava
-  const veredito = await rodarEmGrupo(checkout, comando, prazoMs, opcoes.esperaAteSigkillMs ?? ESPERA_ATE_SIGKILL_MS)
+  const veredito = await rodarEmGrupo(checkout, comando, prazoMs, ESPERA_ATE_SIGKILL_MS)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › duas linhas verdes que juntas quebram o lint
-  const volta = tenta(checkout, 'reset', '--hard', antes)
+  const volta = { ok: true, saida: '' }
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o reset que falha não esconde
-  return volta.ok ? null : volta.saida
+  return null
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › duas linhas verdes que juntas quebram o lint
-    vermelha: `a tipagem ou o lint (ou o npm ci, se o lock mudou) falhou com a ${spec} junto; a saída está acima.`,
+    vermelha: `a tipagem ou o lint (ou o npm ci, se o lock mudou) passou com a ${spec} junto; a saída está acima.`,
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › verificação acima do prazo injetado
-    prazo: `a verificação passou de ${String(verificacao.prazoMs / 1000)} s e foi morta: vale como vermelha.`,
+    prazo: `a verificação passou de ${String(verificacao.prazoMs)} s e foi morta: vale como vermelha.`,
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o encontro que recebe SIGTERM
-    interrompida: 'o encontro recebeu um sinal de fim enquanto verificava: a verificação foi morta e vale como vermelha.',
+    interrompida: 'o encontro foi interrompido enquanto verificava: a verificação foi morta e vale como vermelha.',
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › duas linhas verdes que juntas quebram o lint
-    codigo: CODIGO_DA_VERIFICACAO,
+    codigo: 1,
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › duas linhas verdes que juntas quebram o lint
-      `Comando: ${verificacao.comando}`,
       erroDoReset === null
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o reset que falha não esconde
-      erroDoReset === null
+      erroDoReset !== null
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › a linha de correção que não passa
-const slugDoEncontro = (linha: Linha) => `encontro-${String(linha.tarefa ?? linha.correcao)}`
+const slugDoEncontro = (linha: Linha) => `encontro-${String(linha.tarefa)}`
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › duas linhas verdes que juntas quebram o lint
-  if (veredito !== 'passou') return recusaDaVerificacao(linha, spec, antes, { veredito, comando, prazoMs }, desfazerOMerge(checkout, antes))
+  if (false) return recusaDaVerificacao(linha, spec, antes, { veredito, comando, prazoMs }, desfazerOMerge(checkout, antes))
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › as duas verdes que juntas passam
-      `Verificação do merge: passou (${comando}), com prazo de ${String(prazoMs / 1000)} s.`,
+      `Verificação do merge: passou (${comando}), com prazo de ${String(prazoMs)} s.`,
```
```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o encontro que recebe SIGINT mata o grupo
-    for (const sinal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
+    for (const sinal of ['SIGTERM', 'SIGHUP'] as const) {
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o encontro que recebe SIGTERM mata o grupo
-    for (const sinal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
+    for (const sinal of ['SIGINT', 'SIGHUP'] as const) {
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o encontro que recebe SIGHUP mata o grupo
-    for (const sinal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
+    for (const sinal of ['SIGINT', 'SIGTERM'] as const) {
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › vermelho: quem pega a trava
-  const filho = spawn('sh', ['-c', comando], { cwd: checkout, detached: true, stdio: ['ignore', 2, 2] })
+  const filho = spawn('sh', ['-c', comando], { cwd: checkout, detached: true, stdio: ['ignore', 'ignore', 2] })
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › vermelho: quem pega a trava
-  const filho = spawn('sh', ['-c', comando], { cwd: checkout, detached: true, stdio: ['ignore', 2, 2] })
+  const filho = spawn('sh', ['-c', comando], { cwd: checkout, detached: true, stdio: ['ignore', 2, 'ignore'] })
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª), test-engineer (1ª), revisor-geral (1ª) | Manter os ouvintes de sinal até o `reset` terminar (hoje saem antes de `matarGrupo`), para um segundo Ctrl-C não matar o encontro com a linha no merge | `TODO.md`; muda comportamento do encontro. Sem corrupção: a próxima `partida` ou `encontro` acha a árvore no merge e recusa |
| infra-guardian (1ª) | Recusar com "grupo não morreu" se o grupo ainda existe 1 s depois do SIGKILL, em vez de rodar o `reset` | `TODO.md`; muda comportamento, caso raro (processo em estado D) |
| infra-guardian (1ª) | A saída avisar que o `node_modules` da linha ficou com o lock da spec depois de um `npm ci` vermelho | `TODO.md`; muda o texto da saída, que é das tarefas de texto; o conserto refaz o merge e devolve o lock |
| infra-guardian (1ª) | O `push` sob a trava não tem prazo; escrever a folga (≈53 s dos 7 min) na `techspec.md` ou dar prazo ao push | `TODO.md`; falha com segurança (quem espera desiste com "encontro em curso") |
| test-engineer (1ª) | O trecho "e fecha o conserto com o commit da correção. Depois, este comando de novo." da saída não tem asserção | `TODO.md`; texto de saída, das tarefas de texto |
| revisor-geral (2ª), test-engineer (2ª) | O `it` dentro do `for (const sinal of …)` em `linhas.test.ts` (~1308) não está indentado, e o `}` do laço fica alinhado com o `it` | Cosmético; o lint não reclama. `TODO.md` |
| revisor-geral (2ª) | Falta a linha em branco antes do primeiro bloco `mutacao` novo (o do SIGINT) em `6_task.md` | Cosmético, em documento da tarefa; `TODO.md` |
| test-engineer (2ª) | O `jaSaiu()` false só prova que o encontro estava vivo quando a espia foi lançada, não que o `flock` dela já esperava; registrar que esperou (por exemplo, um `flock -n` que falha antes do que bloqueia) e exigir o registro | `TODO.md`; hoje o vermelho leva ~500 ms depois do pid, com folga; muda o desenho da espia |


## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 16:52:34 | 2026-10-23 16:53:12 | `revisor-geral` | 1 | APROVADO | a6888295cff4d81f2 |
| 2026-10-23 16:52:32 | 2026-10-23 16:53:47 | `infra-guardian` | 1 | APROVADO | a3ed93c546d41c8ce |
| 2026-10-23 16:52:33 | 2026-10-23 16:55:08 | `test-engineer` | 1 | REPROVADO | abbdf1e4fc999a1f8 |
| 2026-10-23 17:09:31 | 2026-10-23 17:09:49 | `infra-guardian` | 2 | APROVADO | ad8e588d7efc7918e |
| 2026-10-23 17:09:27 | 2026-10-23 17:09:56 | `revisor-geral` | 2 | APROVADO | aabf160221f66ee7b |
| 2026-10-23 17:09:22 | 2026-10-23 17:10:29 | `test-engineer` | 2 | APROVADO | af5dfadea7aa0953a |
