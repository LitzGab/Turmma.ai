# Tarefa 7.0 — A mutação que trava sai no prazo e solta o ambiente

**Funcionalidade:** harness (X7) · **Depende de:** nenhuma
**Subagentes obrigatórios:** `infra-guardian`
**Porte:** grande

## Objetivo

Uma mutação cujo teste passa do prazo é `recusada`, mata o grupo de processo inteiro (o neto inclusive), devolve o
arquivo e solta o `flock`; o prazo é medido pela corrida limpa, e não um número fixo.

## Contexto necessário

- `techspec.md` §7c, linha **Mutação travada**
- `prd.md` RF4
- `cenarios.md` seção A, **RF4**; o vocabulário (`vermelho`, `verde`, `recusada`) no topo do `cenarios.md`
- Código: `tools/processo/mutacoes.ts` — `conferirMutacoes`, `rodarCalado`, `comandoDoTeste`; o `testTimeout` do
  projeto vem do `vitest.config.ts`, e o do caso do próprio teste citado

## Subtarefas

- [x] 7.1 — Corrida limpa medida; acima do teto de 10 min, falha dizendo isso, sem mutar
- [x] 7.2 — Prazo da mutada: o maior entre 3 × a limpa, o `testTimeout` do projeto (ou o do caso) e 60 s, até 10 min;
  relógio e prazo injetáveis
- [x] 7.3 — A corrida em grupo de processo próprio; no prazo, SIGTERM no grupo e, 5 s depois, SIGKILL; o bloco fica
  `recusada`; o arquivo volta; o `flock` é solto
- [x] 7.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/mutacoes.ts` | alterado |
| `tools/processo/mutacoes.test.ts` | alterado |
| `tools/processo/portao-local.ts` | alterado (a conferência das mutações do documento passa a `conferirMutacoesDoDocumento`, para a reconstrução da web que estoura deixar o portão vermelho) |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| (a) mutado que dorme além do prazo injetado de 2 s | integração de processo | sai no prazo, `recusada` |
| (b) o neto que o teste abriu | idem | morto (pid conferido) |
| (c) o arquivo mutado | idem | volta ao conteúdo de antes |
| (d) corrida limpa acima do teto | unidade | falha dizendo isso, sem mutar |
| (e) relógio injetado: limpa 1 s, mutado 61 s | unidade | `recusada` |
| (f) limpa 4 min: prazo 10 min, não 12; mutado de 11 min | unidade | `recusada` |
| mutado que falha rápido | unidade | `vermelho` |
| mutado que passa | unidade | `verde` |
| limpa 1 s, `testTimeout` 2 s, mutado falha em 5 s | unidade | `vermelho` (piso de 60 s) |
| limpa 1 s, projeto 5 s, caso declara 120 s, mutado falha em 90 s | unidade | `vermelho` (vale o do caso) |
| limpa 30 s, mutado falha em 80 s | unidade | `vermelho` (3 ×) |
| limpa 1 s, `testTimeout` 120 s, mutado falha em 90 s | unidade | `vermelho` |
| depois do prazo, segunda corrida | integração de processo | pega o `flock` |

## Como testar

- Copiar `tools/processo/mutacoes.test.ts › conferir as mutações: o teste tem de cair sem a cláusula, e o arquivo volta ao que era › restaura o arquivo mesmo quando a corrida do teste estoura` para (a) e (c), e `› vermelho com a cláusula fora é o que passa, e o teste vê o arquivo mutado` para o lado verde.
- O prazo vem de uma função pura (limpa, `testTimeout` do projeto, do caso) → ms: (e), (f) e os de `vermelho` testam essa função com relógio injetado, sem esperar de verdade.
- O neto: `sh -c 'sleep 600 & echo $! > pid; wait'`; confira com `process.kill(pid, 0)` lançando `ESRCH`.
- Rodar: `npx vitest run --project unidade tools/processo/mutacoes.test.ts`.

## Fora do escopo desta tarefa

`--faltando` e a exigência do RF17 (9.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Cada cláusula do diff de `tools/processo/mutacoes.ts`: o prazo (os quatro termos), os três leitores de `testTimeout`, a conferência (a limpa, o prazo, o relógio, os dois ramos de `estourou`) e o supervisor (o grupo, o SIGTERM, a espera, o SIGKILL, os três sinais e a saída).

Mutação — o teto de 10 min do prazo.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › é o maior entre 3 × a limpa
-  return Math.min(TETO_DA_CORRIDA_MS, Math.max(3 * limpaMs, testTimeoutMs, PISO_DO_PRAZO_MS))
+  return Math.max(3 * limpaMs, testTimeoutMs, PISO_DO_PRAZO_MS)
```

Mutação — o termo 3 × a limpa.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › é o maior entre 3 × a limpa
-  return Math.min(TETO_DA_CORRIDA_MS, Math.max(3 * limpaMs, testTimeoutMs, PISO_DO_PRAZO_MS))
+  return Math.min(TETO_DA_CORRIDA_MS, Math.max(testTimeoutMs, PISO_DO_PRAZO_MS))
```

Mutação — o termo testTimeout.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › é o maior entre 3 × a limpa
-  return Math.min(TETO_DA_CORRIDA_MS, Math.max(3 * limpaMs, testTimeoutMs, PISO_DO_PRAZO_MS))
+  return Math.min(TETO_DA_CORRIDA_MS, Math.max(3 * limpaMs, PISO_DO_PRAZO_MS))
```

Mutação — o piso de 60 s.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › é o maior entre 3 × a limpa
-  return Math.min(TETO_DA_CORRIDA_MS, Math.max(3 * limpaMs, testTimeoutMs, PISO_DO_PRAZO_MS))
+  return Math.min(TETO_DA_CORRIDA_MS, Math.max(3 * limpaMs, testTimeoutMs))
```

Mutação — tipo nulo no projeto.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o projeto: unidade fica no padrão
-  if (tipo === null || tipo === 'e2e') return TIMEOUT_PADRAO_DO_E2E_MS
+  if (tipo === 'e2e') return TIMEOUT_PADRAO_DO_E2E_MS
```

Mutação — e2e no projeto.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o projeto: unidade fica no padrão
-  if (tipo === null || tipo === 'e2e') return TIMEOUT_PADRAO_DO_E2E_MS
+  if (tipo === null) return TIMEOUT_PADRAO_DO_E2E_MS
```

Mutação — unidade no padrão.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o projeto: unidade fica no padrão
-  if (tipo === 'unidade') return TESTTIMEOUT_PADRAO_DO_VITEST_MS
```

Mutação — padrão sem declaração.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o projeto: unidade fica no padrão
-  return declarado ?? TESTTIMEOUT_PADRAO_DO_VITEST_MS
+  return declarado ?? 0
```

Mutação — caso nulo.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o caso: o último argumento do it
-  const trecho = caso === null ? undefined : trechoDoCaso(fonteDoTeste, caso)
+  const trecho = caso === null ? fonteDoTeste : trechoDoCaso(fonteDoTeste, caso)
```

Mutação — nome fora do arquivo.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o caso: o último argumento do it
-  if (trecho === undefined) return null
```

Mutação — test.setTimeout.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o caso: o último argumento do it
-  if (setTimeout) return numero(setTimeout[1] ?? '0')
```

Mutação — test.slow.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o caso: o último argumento do it
-  if (/\btest\.slow\(\s*\)/.test(trecho)) return 3 * TIMEOUT_PADRAO_DO_E2E_MS
```

Mutação — { timeout }.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o caso: o último argumento do it
-  const declarado = /\btimeout:\s*([\d_]+)/.exec(trecho) ?? /\}\s*,\s*([\d_]+)\s*\)\s*;?\s*$/.exec(trecho.trimEnd())
+  const declarado = /\}\s*,\s*([\d_]+)\s*\)\s*;?\s*$/.exec(trecho.trimEnd())
```

Mutação — último argumento.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o caso: o último argumento do it
-  const declarado = /\btimeout:\s*([\d_]+)/.exec(trecho) ?? /\}\s*,\s*([\d_]+)\s*\)\s*;?\s*$/.exec(trecho.trimEnd())
+  const declarado = /\btimeout:\s*([\d_]+)/.exec(trecho)
```

Mutação — caso sem declaração.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o caso: o último argumento do it
-  return declarado ? numero(declarado[1] ?? '0') : null
+  return numero(declarado?.[1] ?? '0')
```

Mutação — trecho: nome ausente.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o caso: o último argumento do it
-  return fonteDoTeste.split(caso)[1]?.split(PROXIMO_CASO)[0]
+  return fonteDoTeste.split(caso)[1].split(PROXIMO_CASO)[0]
```

Mutação — trecho acaba no próximo caso.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o caso: o último argumento do it
-  return fonteDoTeste.split(caso)[1]?.split(PROXIMO_CASO)[0]
+  return fonteDoTeste.split(caso)[1]
```

Mutação — o próximo caso tem nome.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o caso: o último argumento do it
-const PROXIMO_CASO = /\n[ \t]*(?:it|test|describe)(?:\.\w+)*\(\s*['"`]/
+const PROXIMO_CASO = /\n[ \t]*(?:it|test|describe)(?:\.\w+)*\(/
```

Mutação — o do caso vale.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o da mutação: o do caso
-  if (doCaso !== null) return doCaso
```

Mutação — sem configuração na árvore.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o da mutação: o do caso
-  return testTimeoutDoProjeto(existsSync(configuracao) ? readFileSync(configuracao, 'utf8') : '', tipoDoTeste(mutacao.teste))
+  return testTimeoutDoProjeto(readFileSync(configuracao, 'utf8'), tipoDoTeste(mutacao.teste))
```

Mutação — relógio injetado.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › limpa de 1 s e mutada de 61 s
-  const agora = opcoes.agora ?? Date.now
+  const agora = Date.now
```

Mutação — prazo injetado.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › sai no prazo, recusada, com o neto morto
-  const calcularPrazo = opcoes.prazoDaMutada ?? prazoDaMutada
+  const calcularPrazo = prazoDaMutada
```

Mutação — corrida limpa guardada.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › teste que já não passa limpo
-    if (!limpa) {
+    if (true) {
```

Mutação — teto na limpa.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o prazo vai à corrida
-      const corrida = rodar(comando, TETO_DA_CORRIDA_MS)
+      const corrida = rodar(comando)
```

Mutação — passou da limpa.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › teste que já não passa limpo
-      limpa = { passou: corrida === true, estourou: corrida === 'estourou' || ms > TETO_DA_CORRIDA_MS, ms }
+      limpa = { passou: true, estourou: corrida === 'estourou' || ms > TETO_DA_CORRIDA_MS, ms }
```

Mutação — limpa morta.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a limpa que a corrida diz
-      limpa = { passou: corrida === true, estourou: corrida === 'estourou' || ms > TETO_DA_CORRIDA_MS, ms }
+      limpa = { passou: corrida === true, estourou: ms > TETO_DA_CORRIDA_MS, ms }
```

Mutação — limpa acima do teto.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a limpa acima do teto falha
-      limpa = { passou: corrida === true, estourou: corrida === 'estourou' || ms > TETO_DA_CORRIDA_MS, ms }
+      limpa = { passou: corrida === true, estourou: corrida === 'estourou', ms }
```

Mutação — ramo da limpa estourada.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a limpa acima do teto falha
-    if (limpa.estourou) {
+    if (false) {
```

Mutação — ramo da limpa vermelha.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › teste que já não passa limpo
-    if (!limpa.passou) {
+    if (false) {
```

Mutação — testTimeout no prazo.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › testTimeout do projeto de 120 s
-    const prazo = calcularPrazo(limpa.ms, testTimeout)
+    const prazo = calcularPrazo(limpa.ms, 0)
```

Mutação — limpa no prazo.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › limpa de 30 s e mutada
-    const prazo = calcularPrazo(limpa.ms, testTimeout)
+    const prazo = calcularPrazo(0, testTimeout)
```

Mutação — testTimeout injetado.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o testTimeout injetado vale mais
-    const testTimeout = (opcoes.testTimeoutMs ?? ((alvo: Mutacao) => testTimeoutDaMutacao(raiz, alvo)))(mutacao)
+    const testTimeout = testTimeoutDaMutacao(raiz, mutacao)
```

Mutação — prazo na mutada.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o prazo vai à corrida
-      corridaMutada = rodar(comando, prazo)
+      corridaMutada = rodar(comando)
```

Mutação — mutada morta.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a mutada que a corrida diz
-    if (corridaMutada === 'estourou' || mutadaMs > prazo) {
+    if (mutadaMs > prazo) {
```

Mutação — mutada acima do prazo.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › limpa de 1 s e mutada de 61 s
-    if (corridaMutada === 'estourou' || mutadaMs > prazo) {
+    if (corridaMutada === 'estourou') {
```

Mutação — verde e vermelho.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › mutada que falha rápido
-    } else if (corridaMutada) {
+    } else if (!corridaMutada) {
```

Mutação — sinal entregue.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o sinal ao grupo diz se ele existe
-    process.kill(-grupo, sinal)
-    return true
+    process.kill(-grupo, sinal)
+    return false
```

Mutação — sinal sem grupo.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o sinal ao grupo diz se ele existe
-  } catch {
-    return false
+  } catch {
+    return true
```

Mutação — programa que não abre.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o comando que passa sai 0
-      filho.on('error', () => resolver(127))
+      filho.on('error', () => resolver(0))
```

Mutação — marca de estouro.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o comando que passa sai 0
-    let estourou = false
+    let estourou = true
```

Mutação — SIGTERM no grupo.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o SIGTERM chega primeiro
-      sinalAoGrupo(grupo, 'SIGTERM')
```

Mutação — espera até o SIGKILL.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o SIGTERM chega primeiro
-      const limite = Date.now() + esperaMs
+      const limite = Date.now()
```

Mutação — grupo acabou.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o SIGTERM chega primeiro
-        if (vivo && Date.now() < limite) return
+        if (Date.now() < limite) return
```

Mutação — limite da espera.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o neto que ignora o SIGTERM morre pelo SIGKILL
-        if (vivo && Date.now() < limite) return
+        if (vivo) return
```

Mutação — SIGKILL no grupo.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o neto que ignora o SIGTERM morre pelo SIGKILL
-        sinalAoGrupo(grupo, 'SIGKILL')
```

Mutação — sinal SIGINT.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o SIGINT no supervisor
-    for (const sinal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) process.on(sinal, terminar)
+    for (const sinal of ['SIGTERM', 'SIGHUP'] as const) process.on(sinal, terminar)
```

Mutação — sinal SIGTERM.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o SIGTERM no supervisor
-    for (const sinal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) process.on(sinal, terminar)
+    for (const sinal of ['SIGINT', 'SIGHUP'] as const) process.on(sinal, terminar)
```

Mutação — sinal SIGHUP.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o SIGHUP no supervisor
-    for (const sinal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) process.on(sinal, terminar)
+    for (const sinal of ['SIGINT', 'SIGTERM'] as const) process.on(sinal, terminar)
```

Mutação — close depois do estouro.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › passado o prazo, mata o grupo
-      if (!estourou) resolver(codigo === 0 ? 0 : 1)
+      resolver(codigo === 0 ? 0 : 1)
```

Mutação — código de saída.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o comando que passa sai 0
-      if (!estourou) resolver(codigo === 0 ? 0 : 1)
+      if (!estourou) resolver(codigo === 0 ? 1 : 0)
```

Mutação — estourou.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o teste que passa dentro do prazo não é morto
-    if (resultado.status === SAIDA_DO_PRAZO) return 'estourou'
```

Mutação — status da corrida.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o teste que passa dentro do prazo não é morto
-    return resultado.status === 0
+    return resultado.status !== 0
```

Mutação — espera injetada.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a espera até o SIGKILL é a injetada
-      [...process.execArgv, supervisor, MARCA_DO_SUPERVISOR, String(prazoMs), String(opcoes.esperaAteSigkillMs ?? ESPERA_ATE_SIGKILL_MS), '--', ...comando],
+      [...process.execArgv, supervisor, MARCA_DO_SUPERVISOR, String(prazoMs), String(ESPERA_ATE_SIGKILL_MS), '--', ...comando],
```

Mutação — prazo padrão.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › sem o prazo, a corrida vale o teto
-  return (comando, prazoMs = TETO_DA_CORRIDA_MS) => {
+  return (comando, prazoMs = 1) => {
```

Mutação — cópia do supervisor.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o supervisor que roda é a cópia
-      [...process.execArgv, supervisor, MARCA_DO_SUPERVISOR, String(prazoMs), String(opcoes.esperaAteSigkillMs ?? ESPERA_ATE_SIGKILL_MS), '--', ...comando],
+      [...process.execArgv, fileURLToPath(import.meta.url), MARCA_DO_SUPERVISOR, String(prazoMs), String(opcoes.esperaAteSigkillMs ?? ESPERA_ATE_SIGKILL_MS), '--', ...comando],
```

Mutação — só como supervisor.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o arquivo chamado sem a marca
-if (process.argv[2] === MARCA_DO_SUPERVISOR) {
+if (true) {
```

Mutação — só `true` é reconstrução.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a reconstrução que passa do teto
-  if (corrida === true) return null
+  if (corrida) return null
```

Mutação — a mensagem diz o teto.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a reconstrução que passa do teto
-  return corrida === 'estourou' ? `a web não reconstruiu depois das mutações: a corrida passou do teto de ${TETO_EM_TEXTO}` : 'a web não reconstruiu depois das mutações'
+  return 'a web não reconstruiu depois das mutações'
```

Mutação — sem tela, nada a reconstruir.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › reconstruir: sem mutação de tela
-  if (comando === null) return null
```

Mutação — a última mutação de tela dá o comando.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › reconstruir: sem mutação de tela
-  const ultima = mutacoes.filter(pedeReconstrucao).at(-1)
+  const ultima = mutacoes.filter(pedeReconstrucao).at(0)
```

Mutação — bloco malformado é o vermelho.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › documento sem bloco não tem carimbo
-  if (erros.length > 0) return { vermelho: erros.join('; ') }
```

Mutação — documento sem bloco não tem carimbo.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › documento sem bloco não tem carimbo
-  if (mutacoes.length === 0) return {}
```

Mutação — mutação reprovada é o vermelho.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › mutação que reprovou é o vermelho
-  if (falhas.length > 0) return { vermelho: `${String(falhas.length)} de ${String(mutacoes.length)} mutações não deixaram o teste vermelho ou foram recusadas` }
```

Mutação — a reconstrução que cai é o vermelho.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a reconstrução que cai deixa o portão vermelho
-  if (reconstrucao !== null) return { vermelho: reconstrucao }
```

Mutação — a web é reconstruída mesmo com mutação reprovada.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › mutação que reprovou é o vermelho
-  const reconstrucao = reconstruirDepoisDasMutacoes(mutacoes, rodar)
+  const reconstrucao = null as string | null
```

Mutação — o total do carimbo.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › todas vermelhas e sem tela
-  return { carimbo: { documento, impressao: impressaoDasMutacoes(mutacoes), total: mutacoes.length } }
+  return { carimbo: { documento, impressao: impressaoDasMutacoes(mutacoes), total: 0 } }
```

Mutação — o aviso do começo.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › todas vermelhas e sem tela
-  avisar(`\n▶ mutações de ${documento} (${String(mutacoes.length)})\n`)
```

Mutação — o grupo de processo próprio (`detached`).

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › passado o prazo, mata o grupo
-    const filho = spawn(programa, argumentos, { stdio: 'ignore', detached: true })
+    const filho = spawn(programa, argumentos, { stdio: 'ignore' })
```

Mutação — o sinal ao grupo, e não só ao filho.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › passado o prazo, mata o grupo
-    process.kill(-grupo, sinal)
+    process.kill(grupo, sinal)
```

Mutação — o prazo dentro do supervisor.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › passado o prazo, mata o grupo
-    setTimeout(terminar, prazoMs)
```

Mutação — a marca de estouro dentro de `terminar`.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › passado o prazo, mata o grupo
-      estourou = true
```

Mutação — o código de saída do prazo.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › passado o prazo, mata o grupo
-        resolver(SAIDA_DO_PRAZO)
+        resolver(1)
```

Mutação — `terminar` roda uma vez.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o prazo e um sinal que chega depois
-      if (estourou) return
```

Mutação — o `_` dos números.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o caso: o último argumento do it
-  return Number(texto.replaceAll('_', ''))
+  return Number(texto)
```

Mutação — a leitura do `testTimeout:` da configuração.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o projeto: unidade fica no padrão
-  const [declarado] = [...configuracao.matchAll(/\btestTimeout:\s*([\d_]+)/g)].map((achado) => numero(achado[1] ?? '0'))
+  const [declarado] = [] as number[]
```

Mutação — a ordem dos argumentos do supervisor.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o SIGTERM chega primeiro
-  const [prazo = '0', espera = '0', , ...comando] = process.argv.slice(3)
+  const [espera = '0', prazo = '0', , ...comando] = process.argv.slice(3)
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | `mutacoes.ts` `mutadaMs > prazo`: o relógio de quem chama inclui a subida do Node do supervisor; confiar só no `'estourou'` ou somar folga fixa | Recusada. O cenário (e) da tabela de testes da tarefa (limpa 1 s, mutado 61 s, `recusada`) exige que o relógio injetado decida o prazo; tirar a comparação ou somar folga muda o contrato da conferência. O erro possível é para o lado seguro (`recusada` em vez de `vermelho`, nunca um `vermelho` falso) |
| infra-guardian (1ª) | Ctrl-C no portão mata o processo pai sem passar pelo `finally` que devolve o arquivo mutado | `TODO.md`, para o `/retro` da X7. O próprio revisor o diz fora do escopo e sem mudança em relação a antes |
| revisor-geral (1ª) | `testTimeoutDoProjeto` pega o primeiro `testTimeout:` do `vitest.config.ts` sem saber de que projeto é, e fixa 5 s e 30 s sem ler o `playwright.config.ts` | `TODO.md`. Hoje bate com a configuração; ler a configuração por projeto muda comportamento e passa de poucas linhas |
| revisor-geral (1ª), test-engineer (1ª) | O teste que sai normalmente e deixa um neto vivo não leva o grupo junto, e o neto pode continuar segurando o `flock` (SIGTERM ao grupo também no `close`) | `TODO.md`, para o `/retro` da X7. A spec (RF4) só exige o grupo derrubado no estouro do prazo; mexer no `close` muda comportamento |
| test-engineer (1ª) | Nenhum teste roda dois `rodarCalado` em paralelo, e nenhum bloco tira o `rename` de `copiaDoSupervisor` | `TODO.md`, para o `/retro` da X7. O revisor reconhece que o código está certo (arquivo provisório com o pid e `rename` atômico) |
| infra-guardian (2ª) | O teste do tratador lento afrouxou o limite de 3,5 s para 10 s, com espera de 20 s: a margem ficou larga; "se o caso ficar instável, vale apertar de novo" | Recusada. Não é defeito: o próprio revisor aprovou o limite, e a margem larga é a que a 1ª rodada pediu (test-engineer, recomendação 15). Se o caso ficar instável, vira `/corrigir` |
| revisor-geral (2ª) | O parágrafo do topo de "Mutações" do `7_task.md` não cita as cláusulas novas da reconstrução e de `conferirMutacoesDoDocumento` | `TODO.md`, para o `/retro` da X7. Os blocos existem e citam teste; falta só a linha de apresentação |
| revisor-geral (2ª) | Duas linhas em branco seguidas em `mutacoes.test.ts`, depois de `pasta` e de `scriptDoTeste` | Recusada. Cosmético, sem efeito no comportamento, e mexer em arquivo de teste caduca as aprovações desta rodada |
| revisor-geral (2ª) | O auxiliar `conferir` do teste de reconstrução procura no repositório um trecho exato com `\n` e indentação para saber que o fonte está mutado; mudar a formatação de `REPOSITORIO` faria todas as corridas virarem "mutadas" | `TODO.md`, para o `/retro` da X7 |
| test-engineer (2ª) | A tabela "Testes que provam a regra" do `7_task.md` não tem linha para a reconstrução da web que estoura, cai ou roda com mutação reprovada, nem para a guarda de `terminar` que roda uma vez; "o `/validar` confere a tabela" | `TODO.md`, para o `/retro` da X7 e para o Validador, que confere a tabela: os testes existem e são citados pelos blocos de mutação |
| test-engineer (2ª) | `portao-local.ts`, ramo `if ('vermelho' in conferencia) { … process.exit(1) }`: a ligação não tem bloco de mutação | `TODO.md`, para o `/retro` da X7. O revisor a diz só reorganização de saídas que já não tinham bloco, coberta pelo hook (`avaliarMutacoes`) |
| test-engineer (2ª) | `mutacoes.test.ts:633-646`: com a máquina muito carregada, se o laço de 25 ms só vir o marcador depois dos 1,5 s do SIGKILL, a mutação que tira a guarda passaria verde; uma `esperaMs` maior (por exemplo 5 s, com o `limiteMs` ajustado) tira a janela | `TODO.md`, para o `/retro` da X7. O código correto nunca fica vermelho por isso |
| test-engineer (2ª) | `mutacoes.test.ts:611` e `:654` ainda medem `durouMs < 5_000` com relógio real, contando a subida do Node; folga de cerca de 4 s | `TODO.md`, para o `/retro` da X7 |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 14:28:56 | 2026-10-23 14:30:11 | `infra-guardian` | 1 | REPROVADO | a67cd2c63f5c1b773 |
| 2026-10-23 14:28:58 | 2026-10-23 14:30:31 | `revisor-geral` | 1 | REPROVADO | a3575f3b7f60baf62 |
| 2026-10-23 14:28:57 | 2026-10-23 14:31:41 | `test-engineer` | 1 | REPROVADO | a365290bcc57dd990 |
| 2026-10-23 14:44:02 | 2026-10-23 14:44:45 | `infra-guardian` | 2 | APROVADO | a6aed0ca7116f2071 |
| 2026-10-23 14:44:18 | 2026-10-23 14:44:53 | `revisor-geral` | 2 | APROVADO | ab3d23384c753383c |
| 2026-10-23 14:44:12 | 2026-10-23 14:45:51 | `test-engineer` | 2 | APROVADO | af6045ce40329f388 |
