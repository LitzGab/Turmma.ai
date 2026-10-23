# Tarefa 5.0 — O quadro das linhas sob uma trava só, com a linha solta por comando e a base gravada

**Funcionalidade:** harness (X7) · **Depende de:** nenhuma
**Subagentes obrigatórios:** `infra-guardian`
**Porte:** grande

## Objetivo

O quadro só muda sob um `flock`, cada comando gravando a própria linha, sem a trava presa no `npm ci`; `abandonar <n>`
solta uma linha; e o `conferir` compara com a base gravada na abertura.

## Contexto necessário

- `techspec.md` §4 e §5(f), **Quadro**
- `prd.md` RF6, RF10, e o RF3 no que é quadro
- `cenarios.md` A: **RF3** (corridas do quadro e do `abrir`), **RF6**, **RF10**
- `.claude/rules/80-infra-e-carga.md` item 7
- Código: `tools/processo/linhas.ts` — `gravarQuadro`, `ocupada`, `abrir` (o `npm ci`), `partida`, `encontro`, `conferir`

## Subtarefas

- [x] 5.1 — Trava (`flock` em `.processo/` da raiz do andar) que relê o quadro, muda uma linha e grava; quem espera tem
  prazo (7 min, injetável) e sai com "encontro em curso"; o encontro ganha um ponto de injeção sob a trava, que a 6.0
  usa para a verificação
- [x] 5.2 — `abrir`: grava a linha ocupada e a base (a branch de onde a linha parte), solta a trava, roda o `npm ci`,
  pega a trava de novo e grava livre; falha do `npm ci` tira a linha e manda abrir de novo; prazo estourado na volta
  deixa ocupada e manda `abandonar <n>`
- [x] 5.3 — `abandonar <n>` (RF6)
- [x] 5.4 — `conferir` compara com a base gravada no quadro (RF10)
- [x] 5.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/linhas.ts` | alterado |
| `tools/processo/linhas.test.ts` | alterado |

## Testes que provam a regra

O lint e o prazo do encontro ficam na 6.0.

| Cenário | Tipo | O que prova |
|---|---|---|
| dois encontros paralelos, o primeiro preso por arquivo-sinal | processo | o segundo espera; quadro final certo |
| `partida 2` durante o encontro da linha 1 | idem | 2 ocupada e 1 livre |
| quem espera além do prazo injetado | idem | sai com "encontro em curso" |
| linha 1 livre; `abrir 1` preso no `npm ci` | idem | `partida 2` termina; segundo `abrir 1` e `partida 1` recusados (linha em uso); `npm ci` roda uma vez |
| solto o sinal | idem | `abrir 1` sai 0; `partida 1` passa |
| `npm ci` falhando | idem | ≠ 0, manda abrir de novo; linha 1 fora; linha 2 intacta; novo `abrir 1` aceito |
| volta à trava com encontro da 2 preso | idem | `abrir 1` só termina depois do encontro: 0, ou ≠ 0 tirando a linha se o `npm ci` falhou |
| volta à trava com prazo injetado menor | idem | ≠ 0 mandando `abandonar 1`; linha ocupada; depois do `abandonar 1`, `abrir 1` aceito |
| `abrir 1` durante o encontro da 2 preso | idem | espera a trava: não sai e o `npm ci` não roda; solto o encontro, sai 0, `npm ci` uma vez, linha livre |
| `abrir 1` (A) preso, `abandonar 1`, `abrir 1` (B) preso, A solto | idem | A sai ≠ 0 "abandonada" e a linha segue em abertura (a de B); B solto sai 0 e a linha fica livre |
| `fechar` durante o encontro; `encontro` com comando sob a trava que sai ≠ 0 | idem | o `fechar` espera e depois fecha; o encontro recusa sem mudar nada |
| RF6: `abandonar 2` | idem | 2 livre; branch fica; outras iguais |
| RF6: `abandonar 3` durante o encontro da 1 | idem | 3 fica livre e não volta |
| RF10: correção aberta de `spec/x` | idem | compara com `spec/x` |
| RF10: correção aberta da `develop` | idem | compara com a `develop` |

## Como testar

- Copiar `tools/processo/linhas.test.ts › partida, encontro e fechamento, em repositórios de verdade › o quadro diz quem parte, e a partida recusa o que não corre junto`, com o `andares()`.
- Paralelo: `spawn` de `node tools/processo/linhas.ts …`, comando injetado por variável de ambiente, que espera um arquivo-sinal (nunca `sleep` fixo); contador fora do checkout.
- RF10: copiar `conferir na branch da spec › aceita a correção que vem depois das tarefas da spec, que a develop ainda não tem`.
- "Não termina enquanto o encontro segura a trava": o `npm ci` injetado grava um marcador; o teste o espera, dá uma
  janela ao `abrir 1`, confere que não saiu e que a linha segue ocupada, e só então solta o encontro. No caso do prazo,
  solte o encontro **antes** do `abandonar 1`, que também pega a trava.
- Rodar: `npx vitest run --project unidade tools/processo/linhas.test.ts`.

## Fora do escopo desta tarefa

Tipagem, lint, prazo e grupo de processo do encontro (6.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| `abrir`, `partida`, `abandonar`, `encontro` e `fechar` passam a devolver `Promise<Resultado>`: a trava é um processo `flock` que o comando segura | O Node não tem `flock`; a trava que morre com o comando e se solta fechando a entrada precisa de um processo filho, e esperar por ele não cabe em função síncrona. Os testes antigos ganharam `await` | `techspec.md` §5(f), "Quadro (RF3, RF6)", trecho "No código (5.0)"; `cenarios.md` A, RF3 |
| O `fechar` também pega a trava | Ele apaga `.processo/linhas.json`; fora da trava, apagaria o quadro no meio de um `abrir` | idem |
| O ponto de injeção do encontro é `EDUCA_ENCONTRO_SOB_A_TRAVA` (`Opcoes.comandoSobATrava`), antes do merge, e saída ≠ 0 recusa sem mudar nada; a linha em abertura é `abrindo: true`; `abandonar` tira do quadro a linha em abertura e deixa livre a que tem trabalho | A spec pede o ponto "que a 6.0 usa para a verificação" e a linha "ocupada" durante o `npm ci`, sem dizer onde nem como. A 6.0 o move para depois do merge | idem; `cenarios.md` A, RF3 e RF6 |
| O `conferir` compara com a `base` que o `abrir` grava na linha (sem ela, com a `spec` do quadro), e com a `develop` quando não há quadro ou o andar é o da própria spec | O quadro mora no andar da spec; o andar de uma correção que nasceu dela traz a cópia (o Maestri copia o que o git ignora) | idem; `cenarios.md` A, RF10 |

## Mutações

Ao menos um bloco por cláusula do §5(f): gravar a linha livre sem a trava, tirar a linha sem a trava, liberar a
linha quando o prazo da espera estoura, e gravar a linha ocupada só depois do `npm ci`.

Os dois primeiros são o mesmo trecho (a volta do `abrir` à trava), provado por dois testes: um com o `npm ci` que passa
e outro com o que falha. O `LC_ALL: 'C'` do `flock` é provado trocando-o por `pt_BR.UTF-8`, onde o prazo "0.3" é
inválido; o bloco só fica vermelho em máquina com esse idioma instalado (o portão local daqui o tem; sem ele, "0.3" vira
prazo válido e a mutação sobrevive, e o portão a reprovaria). Sem bloco, por não haver teste que as distinga: a gravação por renomeação do quadro (só muda o que um leitor sem
trava veria no meio de uma escrita), o `filho.stdin.end()` de `soltar` (sem ele a trava nunca se solta, e o teste não
falha: trava) e o `'npm ci'` padrão de `opcoes.comandoDeInstalacao ?? 'npm ci'` (alcançá-lo roda o `npm ci` de verdade).

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › a volta do abrir à trava espera o encontro que a segura, com o npm ci passando
 async function concluirAbertura(raiz: string, numero: number, aberta: Abertura, instalou: boolean, opcoes: Opcoes): Promise<Resultado> {
-  const trava = await pegarTrava(raiz, opcoes.prazoDaTravaMs ?? PRAZO_DA_TRAVA_MS)
+  const trava = { soltar: () => Promise.resolve() }
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › a volta do abrir à trava espera o encontro que a segura, com o npm ci falhando
 async function concluirAbertura(raiz: string, numero: number, aberta: Abertura, instalou: boolean, opcoes: Opcoes): Promise<Resultado> {
-  const trava = await pegarTrava(raiz, opcoes.prazoDaTravaMs ?? PRAZO_DA_TRAVA_MS)
+  const trava = { soltar: () => Promise.resolve() }
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › a volta do abrir à trava com prazo menor
-  if (typeof trava === 'string') {
-    const motivo = trava === 'prazo' ? ENCONTRO_EM_CURSO : SEM_FLOCK
+  if (typeof trava === 'string') {
+    gravarLinha(raiz, aberta.spec, numero, (atual) => (atual === undefined ? null : { ...atual, abrindo: false }))
+    const motivo = trava === 'prazo' ? ENCONTRO_EM_CURSO : SEM_FLOCK
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o abrir preso no npm ci não segura a trava
-  gravarLinha(raiz, spec, numero, () => ({ numero, checkout, tarefa: null, correcao: null, desde, base: spec, abrindo: true, abertura }))
+  gravarLinha(raiz, spec, numero, () => ({ numero, checkout, tarefa: null, correcao: null, desde, base: spec, abrindo: false, abertura }))
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › abrir dá à linha o ambiente de teste dela
-  gravarLinha(raiz, spec, numero, () => ({ numero, checkout, tarefa: null, correcao: null, desde, base: spec, abrindo: true, abertura }))
+  gravarLinha(raiz, spec, numero, () => ({ numero, checkout, tarefa: null, correcao: null, desde, abrindo: true, abertura }))
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o abrir preso no npm ci não segura a trava
 const comTrabalho = (linha: Linha) => linha.tarefa !== null || linha.correcao !== null
-const ocupada = (linha: Linha) => comTrabalho(linha) || linha.abrindo === true
+const ocupada = (linha: Linha) => comTrabalho(linha)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o abrir preso no npm ci não segura a trava
 const recusaPorUso = (linha: Linha, depois: string) =>
-  linha.abrindo === true
+  false
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o prazo da trava é o de 7 min
-export const PRAZO_DA_TRAVA_MS = 7 * 60 * 1000
+export const PRAZO_DA_TRAVA_MS = 60 * 1000
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › quem espera a trava além do prazo
-    void acabou.then((codigo) => resolver(codigo === SAIDA_DE_PRAZO_DO_FLOCK ? 'prazo' : 'falhou'))
+    void acabou.then(() => resolver('falhou'))
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › sem o flock na máquina
   filho.stdin.on('error', () => undefined)
   const acabou = new Promise<number | null>((fim) => filho.once('close', fim))
   return new Promise((resolver) => {
-    filho.once('error', () => resolver('falhou'))
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › dois encontros ao mesmo tempo
-  const filho = spawn('flock', ['-w', String(prazoMs / 1000), '-E', String(SAIDA_DE_PRAZO_DO_FLOCK), caminho, 'sh', '-c', 'echo travado; cat >/dev/null'], {
+  const filho = spawn('flock', ['-w', String(prazoMs / 1000), '-E', String(SAIDA_DE_PRAZO_DO_FLOCK), caminho, 'sh', '-c', 'echo travado'], {
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › quem espera a trava além do prazo
-    env: { ...process.env, LC_ALL: 'C' },
+    env: { ...process.env, LC_ALL: 'pt_BR.UTF-8' },
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › a partida da linha 2 durante o encontro da linha 1
 export async function partida(raiz: string, numero: number, alvo: string, opcoes: Opcoes = {}): Promise<Resultado> {
-  return sobATrava(raiz, opcoes, () => partidaSobATrava(raiz, numero, alvo, opcoes))
+  return partidaSobATrava(raiz, numero, alvo, opcoes)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › RF6: abandonar a linha 3 durante o encontro da linha 1
 export async function abandonar(raiz: string, numero: number, opcoes: Opcoes = {}): Promise<Resultado> {
-  return sobATrava(raiz, opcoes, () => abandonarSobATrava(raiz, numero))
+  return abandonarSobATrava(raiz, numero)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › dois encontros ao mesmo tempo
 export async function encontro(raiz: string, numero: number, opcoes: Opcoes = {}): Promise<Resultado> {
-  return sobATrava(raiz, opcoes, () => encontroSobATrava(raiz, numero, opcoes))
+  return encontroSobATrava(raiz, numero, opcoes)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o fechar durante o encontro espera
 export async function fechar(raiz: string, opcoes: Opcoes = {}): Promise<Resultado> {
-  return sobATrava(raiz, opcoes, () => fecharSobATrava(raiz, opcoes))
+  return fecharSobATrava(raiz, opcoes)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o npm ci que falha tira a linha do quadro
-  gravarQuadro(raiz, { spec, linhas: [...quadroDoDisco.linhas.filter((linha) => linha.numero !== numero), ...(nova === null ? [] : [nova])] })
+  gravarQuadro(raiz, { spec, linhas: [...quadroDoDisco.linhas, ...(nova === null ? [] : [nova])] })
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o npm ci que falha tira a linha do quadro
-  gravarQuadro(raiz, { spec, linhas: [...quadroDoDisco.linhas.filter((linha) => linha.numero !== numero), ...(nova === null ? [] : [nova])] })
+  gravarQuadro(raiz, { spec, linhas: [...quadroDoDisco.linhas.filter((linha) => linha.numero !== numero), nova as Linha] })
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › RF6: abandonar solta a linha
   const linha = quadro.linhas.find((candidata) => candidata.numero === numero)
-  if (!linha) return recusa(`a linha ${String(numero)} não está aberta (linhas.ts abrir)`)
   if (!ocupada(linha)) return recusa(`a linha ${String(numero)} já está livre`)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › RF6: abandonar solta a linha
-  if (!ocupada(linha)) return recusa(`a linha ${String(numero)} já está livre`)
   const naAbertura = linha.abrindo === true
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › a linha abandonada durante o npm ci
-  gravarLinha(raiz, spec, numero, (atual) => (atual === undefined || naAbertura ? null : { ...atual, tarefa: null, correcao: null, desde: null }))
+  gravarLinha(raiz, spec, numero, (atual) => (atual === undefined ? null : { ...atual, tarefa: null, correcao: null, desde: null }))
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › RF6: abandonar solta a linha
-  gravarLinha(raiz, spec, numero, (atual) => (atual === undefined || naAbertura ? null : { ...atual, tarefa: null, correcao: null, desde: null }))
+  gravarLinha(raiz, spec, numero, (atual) => (atual === undefined || naAbertura ? null : { ...atual, tarefa: null, desde: null }))
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › a linha abandonada durante o npm ci
-      aindaAbrindo = atual?.abertura === aberta.abertura
+      aindaAbrindo = true
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o abrir que volta depois de a linha ser abandonada e aberta de novo
-      aindaAbrindo = atual?.abertura === aberta.abertura
+      aindaAbrindo = true
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o abrir da linha 1 durante o encontro da linha 2 espera a trava
-  const aberta = await sobATrava(raiz, opcoes, () => prepararAbertura(raiz, numero, checkoutDado, opcoes))
+  const aberta = prepararAbertura(raiz, numero, checkoutDado, opcoes)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o abrir preso no npm ci não segura a trava
-      return instalou && atual !== undefined ? { ...atual, abrindo: false, desde: null } : null
+      return instalou && atual !== undefined ? { ...atual, abrindo: false } : null
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o abrir preso no npm ci não segura a trava
-      return instalou && atual !== undefined ? { ...atual, abrindo: false, desde: null } : null
+      return instalou && atual !== undefined ? { ...atual, abrindo: true, desde: null } : null
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o npm ci que falha tira a linha do quadro
-      return instalou && atual !== undefined ? { ...atual, abrindo: false, desde: null } : null
+      return atual !== undefined ? { ...atual, abrindo: false, desde: null } : null
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o npm ci que falha tira a linha do quadro
-  if (!instalou) return recusa(`o npm ci falhou em ${aberta.checkout}; a linha ${String(numero)} saiu do quadro. Abra de novo.`)
+  if (false) return recusa(`o npm ci falhou em ${aberta.checkout}; a linha ${String(numero)} saiu do quadro. Abra de novo.`)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o npm ci que falha tira a linha do quadro
-    filho.once('close', (codigo) => resolver(codigo === 0))
+    filho.once('close', () => resolver(true))
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o abrir preso no npm ci não segura a trava
-  const instalou = (opcoes.instalar ?? true) ? await rodarNoCheckout(aberta.checkout, opcoes.comandoDeInstalacao ?? 'npm ci') : true
+  const instalou = (opcoes.instalar ?? false) ? await rodarNoCheckout(aberta.checkout, opcoes.comandoDeInstalacao ?? 'npm ci') : true
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › abrir dá à linha o ambiente de teste dela
-  if ('codigo' in aberta) return aberta
   const instalou = (opcoes.instalar ?? true) ? await rodarNoCheckout(aberta.checkout, opcoes.comandoDeInstalacao ?? 'npm ci') : true
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › no andar da própria spec, com o quadro
-  if (quadro === null || quadro.spec === branch) return 'develop'
+  if (quadro === null) return 'develop'
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › a correção que nasceu da develop compara com a develop
-  if (quadro === null || quadro.spec === branch) return 'develop'
+  if (quadro.spec === branch) return 'develop'
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o quadro de antes da base gravada
-  return quadro.linhas.find((linha) => linha.base !== undefined)?.base ?? quadro.spec
+  return quadro.linhas.find((linha) => linha.base !== undefined)?.base ?? 'develop'
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › a correção que nasceu da spec compara com a spec
-  return quadro.linhas.find((linha) => linha.base !== undefined)?.base ?? quadro.spec
+  return 'develop'
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › a correção que nasceu da spec compara com a spec
-  const entrega = conferirEntrega(raiz, baseDoConferir(raiz, branch), null, { naSpec: branch.startsWith(PREFIXO_DA_BRANCH_DE_SPEC) })
+  const entrega = conferirEntrega(raiz, 'develop', null, { naSpec: branch.startsWith(PREFIXO_DA_BRANCH_DE_SPEC) })
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o prazo da trava é o de 7 min
-    ...(Number.isFinite(prazo) && prazo > 0 ? { prazoDaTravaMs: prazo } : {}),
+    ...(Number.isFinite(prazo) ? { prazoDaTravaMs: prazo } : {}),
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o prazo da trava é o de 7 min
-    ...(Number.isFinite(prazo) && prazo > 0 ? { prazoDaTravaMs: prazo } : {}),
+    ...(prazo > 0 ? { prazoDaTravaMs: prazo } : {}),
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o prazo da trava é o de 7 min
-    ...(ambiente['EDUCA_COMANDO_DE_INSTALACAO'] === undefined ? {} : { comandoDeInstalacao: ambiente['EDUCA_COMANDO_DE_INSTALACAO'] }),
+    ...(ambiente['EDUCA_COMANDO_DE_INSTALACAO'] !== undefined ? {} : { comandoDeInstalacao: ambiente['EDUCA_COMANDO_DE_INSTALACAO'] }),
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o prazo da trava é o de 7 min
-    ...(ambiente['EDUCA_ENCONTRO_SOB_A_TRAVA'] === undefined ? {} : { comandoSobATrava: ambiente['EDUCA_ENCONTRO_SOB_A_TRAVA'] }),
+    ...(ambiente['EDUCA_ENCONTRO_SOB_A_TRAVA'] !== undefined ? {} : { comandoSobATrava: ambiente['EDUCA_ENCONTRO_SOB_A_TRAVA'] }),
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o comando sob a trava do encontro que falha
-  if (opcoes.comandoSobATrava !== undefined && !(await rodarNoCheckout(checkout, opcoes.comandoSobATrava))) {
+  if (opcoes.comandoSobATrava !== undefined && (await rodarNoCheckout(checkout, opcoes.comandoSobATrava))) {
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o comando sob a trava do encontro que falha
-  const filho = spawn('sh', ['-c', comando], { cwd: checkout, stdio: ['ignore', 'ignore', 'inherit'] })
+  const filho = spawn('sh', ['-c', comando], { stdio: ['ignore', 'ignore', 'inherit'] })
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o abrir preso no npm ci não segura a trava
-  linha.tarefa !== null ? `tarefa ${String(linha.tarefa)}.0` : linha.correcao !== null ? `correção ${linha.correcao}` : linha.abrindo === true ? 'abertura em curso' : 'ociosa'
+  linha.tarefa !== null ? `tarefa ${String(linha.tarefa)}.0` : linha.correcao !== null ? `correção ${linha.correcao}` : 'ociosa'
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o abrir preso no npm ci não segura a trava
-  if (!linha || !comTrabalho(linha)) return recusa(`a linha ${String(numero)} não tem trabalho em curso`)
+  if (!linha || !ocupada(linha)) return recusa(`a linha ${String(numero)} não tem trabalho em curso`)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › RF6: abandonar a linha 3 durante o encontro da linha 1
-  if (comando === 'abandonar') return abandonar(raiz, numero, opcoes)
   if (comando === 'encontro') return encontro(raiz, numero, opcoes)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o fechar durante o encontro espera
-  if (comando === 'fechar') return fechar(raiz, opcoes)
   if (comando === 'conferir') return conferir(raiz, { emCurso: primeiro === '--em-curso' })
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª), revisor-geral (1ª), test-engineer (1ª) | `opcoesDoAmbiente` lê `EDUCA_ENCONTRO_SOB_A_TRAVA` e `EDUCA_COMANDO_DE_INSTALACAO` de `process.env` no CLI de verdade: escrever na saída quando uma estiver ligada, ou restringir às execuções de teste | Muda comportamento do CLI e o ponto de injeção é o que a 6.0 usa para a verificação; vai para `TODO.md` e a 6.0 decide ao mover o ponto |
| infra-guardian (1ª) | O `encontro` faz o `git push` e roda a verificação com a trava na mão, e quem espera tem 7 min: medir o push sob a trava | Tarefa 6.0 (prazo e grupo de processo do encontro) |
| test-engineer (1ª) | A janela de 1500 ms só erra para o lado de a mutação sobreviver numa máquina carregada | `/retro` da X7 |
| infra-guardian (2ª) | Se `abandonar` roda com o `abrir` original ainda vivo, os dois `npm ci` correm juntos no mesmo `node_modules`. Registrar o pid do `abrir` na linha e recusar o `abandonar` se ele estiver vivo, ou avisar na saída | Tarefa 6.0 (grupo de processo do encontro) ou `/retro` da X7; muda comportamento do `abandonar` |
| infra-guardian (2ª), test-engineer (2ª) | A marca `abertura` continua no quadro depois que a linha fica livre: apagá-la junto com `abrindo: false` | `TODO.md`; sem efeito hoje, porque cada marca é única e toda leitura olha `abrindo` |
| infra-guardian (2ª), revisor-geral (2ª) | O bloco do `LC_ALL` só fica vermelho com `pt_BR.UTF-8` instalado: o teste conferir o idioma antes, ou forçar um em que "0.3" é inválido de qualquer jeito | `/retro` da X7; a limitação já está escrita no documento |
| revisor-geral (2ª) | A marca `abertura` está no `cenarios.md`, mas não no trecho "No código (5.0)" do §5(f) da `techspec.md` | Tarefa 6.0, que mexe no formato do quadro e na mesma seção da `techspec.md` |
| test-engineer (2ª) | Os dois blocos de `aindaAbrindo` usam a mesma mutação (`aindaAbrindo = true`): o segundo não prova nada além do primeiro. Trocar por `aindaAbrindo = atual?.abrindo === true`, ou `randomUUID()` por constante | `TODO.md`; o teste já falha nos dois casos, falta só o bloco declarado |
| test-engineer (2ª) | Sem linha na tabela de testes: `a linha abandonada durante o npm ci não volta quando ele termina`, `sem o flock na máquina o comando recusa`, `o prazo da trava é o de 7 min`, `o quadro de antes da base gravada`, `no andar da própria spec, com o quadro` | `TODO.md`; os testes e os blocos existem, só a tabela está incompleta |
| test-engineer (2ª) | A janela de 1500 ms vale também para o teste novo do `abrir` sob a trava: numa máquina carregada a mutação pode sobreviver | `/retro` da X7, junto com a mesma observação da 1ª rodada |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 14:36:51 | 2026-10-23 14:37:55 | `infra-guardian` | 1 | REPROVADO | a4ed620b742d88d5a |
| 2026-10-23 14:36:53 | 2026-10-23 14:38:31 | `revisor-geral` | 1 | REPROVADO | a2cadfff9df3c1ca5 |
| 2026-10-23 14:36:52 | 2026-10-23 14:38:55 | `test-engineer` | 1 | REPROVADO | a04b900f51cb350b9 |
| 2026-10-23 14:48:46 | 2026-10-23 14:49:28 | `infra-guardian` | 2 | APROVADO | a84ccdbdaace04cce |
| 2026-10-23 14:48:57 | 2026-10-23 14:49:35 | `revisor-geral` | 2 | APROVADO | a4dbf880538ec44e4 |
| 2026-10-23 14:48:51 | 2026-10-23 14:50:25 | `test-engineer` | 2 | APROVADO | a6da4ecb0ae23516e |
