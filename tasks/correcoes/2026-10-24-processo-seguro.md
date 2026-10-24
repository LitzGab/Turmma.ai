# Correção — processo seguro: seis furos do processo que a retro da X7 deixou (M5)

**Origem:** retro da X7, item M5 (`TODO.md`, "(X7, retro, M5) Correção "processo seguro""): sobras de revisão da 20.0, da 7.0, da 5.0 e da 11.0 (m1 da validação) que cada tarefa mandou para o `/retro`, mais a corrida do teste do SIGINT que deixou vermelho o `d76ef01` (esperava 124, veio 255).
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`, `infra-guardian`, `privacy-guardian`, `tenancy-guardian`, `conformidade-reviewer`
<!-- Os seis vieram no PEDIDO do Orquestrador. O `revisor-geral` entra também pelo passo 5 de `corrigir`: a correção toca `tools/processo/` e `.claude/`. -->

## Sintoma

Seis defeitos, cada um já lido e aceito pelo revisor que o achou, e adiado para esta correção:

1. **A limpeza do Orquestrador se perde calada.** O comando dos passos 6 e 9 grava `pedida` em `.processo/limpeza.json` **relativo à pasta do Bash**: de um andar, a `pedida` cai no andar, a vigia (que lê o do térreo) nunca a vê, e a limpeza perdida não acorda ninguém. E a vigia, com o arquivo sendo JSON válido que não é objeto (`null`, `[]`, texto, número), ou dá TypeError (`null`, que o `catch` converte num motivo que mente: "não consegui ler o time") ou fica calada (`[]`, texto, número).
2. **O Ctrl-C no portão deixa o arquivo mutado no disco**, e o teste que sai e deixa um neto vivo deixa o neto segurando o `flock` da fila de carga.
3. **O ramo `if ('vermelho' in conferencia)` do `portao-local.ts` não tem prova.** Tirar o `process.exit(1)` dele deixava o portão carimbar com as mutações reprovadas, e nenhum teste caía.
4. **O `git config --get core.hooksPath` é barrado em sessão de papel**, e é o que o `contexto-inicial.sh` e quem confere o checkout rodam (m1 da validação da 11.0).
5. **O CLI do `linhas.ts` não diz nada** quando `EDUCA_ENCONTRO_SOB_A_TRAVA` ou `EDUCA_COMANDO_DE_INSTALACAO` está ligada no ambiente de quem opera: o encontro rodaria um comando de teste no lugar da verificação, calado. E a marca `abertura` fica no quadro depois que a linha fica livre.
6. **O teste "o SIGINT no supervisor leva o grupo do teste junto" é intermitente** (`mutacoes.test.ts`): em `d76ef01` esperava 124 e veio 255.

## Fora desta correção

Nada: a árvore estava limpa (o pedido não trouxe arquivos de tarefa em curso).

## Causa

1. **Âncora.** Os passos 6 e 9 dizem "no térreo", mas o comando não o garante: `.processo/limpeza.json` é relativo ao `cwd`. O `contexto-inicial.sh` já estava ancorado (o `cd "${CLAUDE_PROJECT_DIR:-…}"` do começo leva o hook ao térreo antes de gravar a `feita`); o teste novo prova isso, e só o comentário do hook mudou. Na vigia, `JSON.parse(...) as Limpeza` confia no formato: `null` quebra `limpezaPerdida`, e lista, texto e número têm `pedida` `undefined` e "não há o que acusar".
2. **Ctrl-C.** O `conferirMutacoes` fica preso no `spawnSync` do supervisor; o Node morre no sinal sem rodar JavaScript, e o `finally` que devolve a fonte não roda. O supervisor, que está no mesmo grupo do terminal e recebe o mesmo sinal, já mata o grupo do teste, mas não sabia o que restaurar. No `close` do filho o supervisor só resolvia o código: o grupo (que o `detached` criou) podia ficar com um neto vivo.
3. **Ramo sem prova.** O `portao-local.ts` executa ao ser importado e nenhum teste o rodava com mutação reprovada; só o hook (`avaliarMutacoes`) cobria o carimbo, depois.
4. **`desvioDoGit`** trata qualquer `git config` que cite `core.hooksPath` como escrita.
5. **`opcoesDoAmbiente`** lê as duas variáveis de `process.env` de verdade sem dizer; e o `concluirAbertura` espalha `...atual` (com a `abertura`) na linha que fica livre.
6. **A janela entre o `spawn` e o `process.on`.** O supervisor registrava os tratadores **depois** de abrir o filho. O teste manda o SIGINT quando o `sh` grava o `neto.pid`, que prova que o filho existe e não que o tratador existe: numa máquina carregada o supervisor era preemptado entre as duas linhas, o filho corria, e o sinal chegava sem tratador (o Node morre por sinal: 255). Reproduzido sob carga (36 laços de CPU em 12 núcleos, o SIGINT mandado como o teste manda): supervisor antigo, **2 saídas 255 em 450**; supervisor novo, **0 em 450**.

## Teste que reproduz

| Item | Teste | Antes |
|---|---|---|
| 1a | `tools/processo/vigia.test.ts › o comando da limpeza grava a pedida que a vigia lê › <passo>: de dentro de um andar (worktree)…` e `<passo>: fora de um repositório…` (para os dois passos) | vermelho (4): a pedida caía no andar; fora do git, o comando escreveria `/.processo` |
| 1b | `vigia.test.ts › o limpeza.json que não é um objeto acorda…` e `limpeza.json que é JSON mas não é um objeto (%s)` | vermelho (12): `comLimpezaDoArquivo` não existia, e a vigia calava com `[]`, texto e número |
| 1c | `vigia.test.ts › a feita vai para o .processo do térreo (CLAUDE_PROJECT_DIR)…` | **verde ao nascer**: o hook já estava ancorado pelo `cd`. O teste fixa o que o item pedia, e o bloco de mutação (tirar o `cd`) o prova |
| 2a | `tools/processo/mutacoes.test.ts › o Ctrl-C no portão devolve o arquivo mutado › o %s no grupo do portão…` (SIGINT e SIGHUP), com um processo que faz o papel do portão (`conferirMutacoes` e `rodarCalado` do arquivo vivo) em grupo próprio, e `› o caminho normal do rodarCalado com a restauração…`; a fonte é 0755 e volta 0755 | vermelho (2): a fonte ficava mutada. Na 1ª rodada, vermelho (3) de novo com a fonte 0755: o `copyFileSync` do supervisor devolvia o 0644 da cópia |
| 2b | `mutacoes.test.ts › o supervisor da corrida, como processo de verdade › o teste que sai e deixa um neto vivo…` e `…que ignora o SIGTERM no fim do teste…` | vermelho (2): o neto sobrevivia |
| 3 | `tools/processo/revisoes.test.ts › … o portão da tarefa, rodado como processo, fica vermelho quando as mutações do documento não passam…` | **verde ao nascer** (o ramo existia, sem prova). Provado à mão, antes dos blocos: sem o `process.exit(1)` do ramo, o teste cai |
| 4 | `revisoes.test.ts › o desvio do hook do git… › passa: leitura do hooksPath …` (4 casos) e, no hook de verdade, `hook-portao.test.ts › com papel, passa calado: leitura do hooksPath` | vermelho (4); os `negado: hookspath: …` (6) seguram a escrita e passaram antes e depois |
| 5 | `tools/processo/linhas.test.ts › avisoDoAmbiente…`, `o CLI diz na saída quando um ponto de injeção está ligado…` e `a abertura que termina deixa a linha livre sem a marca…` | vermelho (3) |
| 6 | `mutacoes.test.ts › … o sinal que chega no primeiro instante…` (o `sh` manda o SIGINT ao supervisor antes de qualquer outra coisa) | **verde ao nascer**: o intermitente não se reproduz de forma determinística, porque a janela é do escalonador do SO (JavaScript é de uma linha só: o tratador não corre entre o `spawn` e o `process.on`, é o **sinal** que corre). No lugar do vermelho, a evidência do estresse da Causa 6 (2 em 450 antes, 0 em 450 depois) e o bloco de mutação, que adia o registro dos tratadores em 400 ms e deixa o teste vermelho de forma determinística |

## Correção

**1.** Os passos `6-tarefa.md` e `9-vigia-e-contexto.md`: o comando passa a `d="$(git rev-parse --git-common-dir)/../.processo" && mkdir -p "$d" && date … >"$d/limpeza.json"; nohup …`. O `git` acha o térreo de qualquer andar ou pasta; fora de um repositório o `&&` não deixa criar `/.processo`, e a rotina segue (o `/clear` não depende da `pedida`). O `6-tarefa.md` perdeu a explicação do comando e o "no térreo" (a âncora os dispensa) para caber no teto de 24.000 B do `seguir.test.ts` (23.979 antes, 23.951 agora). `vigia.ts`: `comLimpezaDoArquivo` lê o conteúdo e acorda, com o motivo dito (`.processo/limpeza.json não é JSON`, `não é um objeto`), para o que não é objeto; o CLI da vigia passa o conteúdo a ela. `contexto-inicial.sh`: só um comentário (a âncora já valia). Os seis blocos de "Mutações" de `tasks/prd-harness/20_task.md` que citavam o comando antigo e a leitura antiga foram reescritos para o código novo.

**2.** `mutacoes.ts`: o `Rodar` ganha o terceiro argumento `Restauracao` (`{ arquivo, original }`); o `conferirMutacoes` o passa na corrida mutada, o `rodarCalado` grava a original na pasta da corrida e passa `--restaurar <arquivo> <cópia>` ao supervisor, e o supervisor, **depois** de acabar o grupo do teste e por qualquer caminho (fim, prazo, sinal), escreve a original de volta **sobre o arquivo que já existe** (`writeFileSync`, que mantém o modo; o `copyFileSync` aplicava o 0644 da cópia e tirava o bit de execução do hook de shell mutado) e apaga a cópia. O `finally` do portão continua, e agora é redundante no caminho normal. No `close` do filho, o supervisor faz o mesmo fim de grupo do prazo (SIGTERM, a espera, SIGKILL): o neto não sobrevive ao teste, e o código de saída continua o do teste.

**3.** Teste do ramo vermelho (acima) e os blocos de mutação. Nenhuma linha de produção mudou.

**4.** `comando-git.ts`: `leSoOCaminhoDosHooks` libera o `git config` que é a ação `--get` ou `--get-all` **primeiro** e a chave `core.hooksPath` (exata, sem valor) **por último**, com as opções de escopo só antes da chave: o `git config` para de ler opções na primeira palavra que não é opção, e `core.hooksPath --get` GRAVA o valor `--get`. Qualquer outra palavra (um valor, `--unset`, `--add`) continua sendo a escrita, e o `-c core.hooksPath=…` antes do subcomando também.

**5.** `linhas.ts`: `avisoDoAmbiente` (uma linha por variável ligada, em `stderr`, antes do comando); `concluirAbertura` tira a `abertura` da linha que fica livre.

**6.** `mutacoes.ts`: os tratadores de `SIGINT`, `SIGTERM` e `SIGHUP` são registrados **antes** do `spawn`; o pgid do grupo fica num objeto que o tratador lê quando corre (só depois do `spawn`).

**Ordem da 1ª rodada (`.processo/ordens/2026-10-24-processo-seguro-r1.md`).** (1) O supervisor devolve a fonte sem mudar o modo, com os casos 0755 do Ctrl-C e do caminho normal, e `.claude/hooks/contexto-inicial.sh` voltou a 100755 (o portão da 1ª rodada o deixou 0644 pelo defeito do item 1; `git diff --summary` sem mudança de modo). (2) A ordem do `leSoOCaminhoDosHooks`, com os quatro negados novos (`core.hooksPath --get`, `--local core.hooksPath --get`, `--show-origin core.hooksPath --get-all`, `--get core.hooksPath --local`) no lugar do caso que afirmava a passagem de uma escrita; o caso do escopo entre a ação e a chave passa a ser o que passa. (3) \`vigia.test.ts\`: o comando da limpeza roda sem `GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE`, `GIT_COMMON_DIR` e `GIT_OBJECT_DIRECTORY` do ambiente de quem roda, com um caso que os põe apontando outro repositório (cai sem a limpeza, passa com ela). (4) O teste do primeiro instante abre o neto antes do sinal e confere que ele morre.

## Mutações

Código de `tools/processo/` e `.claude/`, fora do RF17 (que olha `apps/*/src` e `packages/*/src`): os blocos cobrem mesmo assim as cláusulas novas, uma a uma. Ficam sem bloco, por serem de um tipo que nenhum teste distingue: o `^…$` da chave exata em `leSoOCaminhoDosHooks` (o caso que ele separa, `core.hooksPath.x`, é uma chave que não existe); o `|| !sinalAoGrupo(dono, 0)` e o `dono === undefined` de `acabarOGrupo` (o primeiro só poupa 25 ms; o segundo é o `spawn` que falhou, já provado pelo bloco do 127).

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › passa: leitura do hooksPath
-  if (chamada.subcomando === 'config' && chamada.resto.some((argumento) => CAMINHO_DOS_HOOKS.test(argumento)) && !leSoOCaminhoDosHooks(chamada.resto)) {
+  if (chamada.subcomando === 'config' && chamada.resto.some((argumento) => CAMINHO_DOS_HOOKS.test(argumento))) {
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › passa: leitura do hooksPath com escopo
-  const palavras = resto.filter((palavra) => !ESCOPO_DE_LEITURA.has(palavra))
+  const palavras = [...resto]
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/hook-portao.test.ts › com papel, passa calado: leitura do hooksPath
-  if (chamada.subcomando === 'config' && chamada.resto.some((argumento) => CAMINHO_DOS_HOOKS.test(argumento)) && !leSoOCaminhoDosHooks(chamada.resto)) {
+  if (chamada.subcomando === 'config' && chamada.resto.some((argumento) => CAMINHO_DOS_HOOKS.test(argumento))) {
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › a abertura que termina deixa a linha livre sem a marca
       const livre: Linha = { ...atual, abrindo: false, desde: null }
-      delete livre.abertura
       return livre
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o npm ci que falha tira a linha do quadro
-      if (!instalou || atual === undefined) return null
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › avisoDoAmbiente
-    ambiente['EDUCA_ENCONTRO_SOB_A_TRAVA'] === undefined ? null : 'aviso: EDUCA_ENCONTRO_SOB_A_TRAVA está ligada neste ambiente: o encontro roda esse comando no lugar da verificação de verdade. Fora de teste, desligue-a (unset).',
+    ambiente['EDUCA_ENCONTRO_SOB_A_TRAVA'] !== undefined ? null : 'aviso: EDUCA_ENCONTRO_SOB_A_TRAVA está ligada neste ambiente: o encontro roda esse comando no lugar da verificação de verdade. Fora de teste, desligue-a (unset).',
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › avisoDoAmbiente
-    ambiente['EDUCA_COMANDO_DE_INSTALACAO'] === undefined ? null : 'aviso: EDUCA_COMANDO_DE_INSTALACAO está ligada neste ambiente: o abrir roda esse comando no lugar do npm ci. Fora de teste, desligue-a (unset).',
+    ambiente['EDUCA_COMANDO_DE_INSTALACAO'] !== undefined ? null : 'aviso: EDUCA_COMANDO_DE_INSTALACAO está ligada neste ambiente: o abrir roda esse comando no lugar do npm ci. Fora de teste, desligue-a (unset).',
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › avisoDoAmbiente
-  return avisos.length === 0 ? null : avisos.join('\n')
+  return avisos.join('\n')
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › avisoDoAmbiente
-  return avisos.length === 0 ? null : avisos.join('\n')
+  return avisos.length === 0 ? null : avisos.join(' ')
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o CLI diz na saída
-  if (aviso !== null) process.stderr.write(`${aviso}\n`)
```

```mutacao
arquivo: tools/processo/vigia.ts
teste: tools/processo/vigia.test.ts › sem arquivo, ou com o objeto em dia
-  if (conteudo === null) return decisao
```

```mutacao
arquivo: tools/processo/vigia.ts
teste: tools/processo/vigia.test.ts › JSON válido que é
-  if (typeof lido !== 'object' || lido === null || Array.isArray(lido)) return ilegivel('não é um objeto')
+  if (lido === null || Array.isArray(lido)) return ilegivel('não é um objeto')
```

```mutacao
arquivo: tools/processo/vigia.ts
teste: tools/processo/vigia.test.ts › JSON válido que é
-  if (typeof lido !== 'object' || lido === null || Array.isArray(lido)) return ilegivel('não é um objeto')
+  if (typeof lido !== 'object' || Array.isArray(lido)) return ilegivel('não é um objeto')
```

```mutacao
arquivo: tools/processo/vigia.ts
teste: tools/processo/vigia.test.ts › JSON válido que é
-  if (typeof lido !== 'object' || lido === null || Array.isArray(lido)) return ilegivel('não é um objeto')
+  if (typeof lido !== 'object' || lido === null) return ilegivel('não é um objeto')
```

```mutacao
arquivo: tools/processo/vigia.ts
teste: tools/processo/vigia.test.ts › o que não é JSON acorda
   } catch {
-    return ilegivel('não é JSON')
+    return decisao
   }
```

```mutacao
arquivo: tools/processo/vigia.ts
teste: tools/processo/vigia.test.ts › o objeto com a pedida de 11 minutos
-  return comLimpeza(decisao, lido as Limpeza, agora)
+  return decisao
```

```mutacao
arquivo: tools/processo/vigia.ts
teste: tools/processo/vigia.test.ts › com o time trabalhando e a limpeza em dia, ou sem arquivo
-    const conteudoDaLimpeza = existsSync(arquivoDaLimpeza) ? readFileSync(arquivoDaLimpeza, 'utf8') : null
+    const conteudoDaLimpeza = readFileSync(arquivoDaLimpeza, 'utf8')
```

```mutacao
arquivo: tools/processo/vigia.ts
teste: tools/processo/vigia.test.ts › com o time trabalhando e a limpeza pedida há 11 minutos
-    decisao = comLimpezaDoArquivo(decidir(telas, visto, agora), conteudoDaLimpeza, agora)
+    decisao = decidir(telas, visto, agora)
```

```mutacao
arquivo: tools/processo/vigia.ts
teste: tools/processo/vigia.test.ts › limpeza.json que é JSON mas não é um objeto
-    decisao = comLimpezaDoArquivo(decidir(telas, visto, agora), conteudoDaLimpeza, agora)
+    decisao = comLimpeza(decidir(telas, visto, agora), (conteudoDaLimpeza === null ? {} : JSON.parse(conteudoDaLimpeza)) as Limpeza, agora)
```

```mutacao
arquivo: .claude/hooks/contexto-inicial.sh
teste: tools/processo/vigia.test.ts › a feita vai para o
-cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
+true
```

```mutacao
arquivo: .claude/skills/seguir/passos/6-tarefa.md
teste: tools/processo/vigia.test.ts › 6-tarefa.md: roda
-   d="$(git rev-parse --git-common-dir)/../.processo" && mkdir -p "$d" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
+   d="$(git rev-parse --git-common-dir)/../.processo" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
```

```mutacao
arquivo: .claude/skills/seguir/passos/6-tarefa.md
teste: tools/processo/vigia.test.ts › 6-tarefa.md: roda
-   d="$(git rev-parse --git-common-dir)/../.processo" && mkdir -p "$d" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
+   d="$(git rev-parse --git-common-dir)/../.processo" && mkdir -p "$d"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
```

```mutacao
arquivo: .claude/skills/seguir/passos/6-tarefa.md
teste: tools/processo/vigia.test.ts › 6-tarefa.md: de dentro de um andar
-   d="$(git rev-parse --git-common-dir)/../.processo" && mkdir -p "$d" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
+   d=.processo && mkdir -p "$d" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
```

```mutacao
arquivo: .claude/skills/seguir/passos/6-tarefa.md
teste: tools/processo/vigia.test.ts › 6-tarefa.md: fora de um repositório
-   d="$(git rev-parse --git-common-dir)/../.processo" && mkdir -p "$d" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
+   d="$(git rev-parse --git-common-dir)/../.processo"; mkdir -p "$d" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
```

```mutacao
arquivo: .claude/skills/seguir/passos/9-vigia-e-contexto.md
teste: tools/processo/vigia.test.ts › 9-vigia-e-contexto.md: roda
-d="$(git rev-parse --git-common-dir)/../.processo" && mkdir -p "$d" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
+d="$(git rev-parse --git-common-dir)/../.processo" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
```

```mutacao
arquivo: .claude/skills/seguir/passos/9-vigia-e-contexto.md
teste: tools/processo/vigia.test.ts › 9-vigia-e-contexto.md: roda
-d="$(git rev-parse --git-common-dir)/../.processo" && mkdir -p "$d" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
+d="$(git rev-parse --git-common-dir)/../.processo" && mkdir -p "$d"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
```

```mutacao
arquivo: .claude/skills/seguir/passos/9-vigia-e-contexto.md
teste: tools/processo/vigia.test.ts › 9-vigia-e-contexto.md: de dentro de um andar
-d="$(git rev-parse --git-common-dir)/../.processo" && mkdir -p "$d" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
+d=.processo && mkdir -p "$d" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
```

```mutacao
arquivo: .claude/skills/seguir/passos/9-vigia-e-contexto.md
teste: tools/processo/vigia.test.ts › 9-vigia-e-contexto.md: fora de um repositório
-d="$(git rev-parse --git-common-dir)/../.processo" && mkdir -p "$d" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
+d="$(git rev-parse --git-common-dir)/../.processo"; mkdir -p "$d" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/processo/revisoes.test.ts › fica vermelho quando as mutações do documento
     process.stdout.write(`\n✗ portão local vermelho nas mutações de ${documento}: ${conferencia.vermelho}. Nenhum carimbo gravado.\n`)
-    process.exit(1)
   }
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/processo/revisoes.test.ts › fica vermelho quando as mutações do documento
-  if ('vermelho' in conferencia) {
+  if (!('vermelho' in conferencia)) {
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › no grupo do portão
-      corridaMutada = rodar(comando, prazo, { arquivo: caminho, original })
+      corridaMutada = rodar(comando, prazo)
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › no grupo do portão
-      const aRestaurar = restaurar ? ['--restaurar', restaurar.arquivo, copiaDaOriginal] : []
+      const aRestaurar: string[] = []
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › no grupo do portão
-  if (opcoes[0] === '--restaurar') restaurarOArquivo(opcoes[1] ?? '', opcoes[2] ?? '')
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o teste que sai e deixa um neto vivo
-      void acabarOGrupo().then(() => resolver(codigo === 0 ? 0 : 1))
+      resolver(codigo === 0 ? 0 : 1)
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o neto que ignora o SIGTERM no fim do teste
           clearInterval(espiar)
-          sinalAoGrupo(dono, 'SIGKILL')
           acabou()
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › passado o prazo, mata o grupo
     filho.on('close', (codigo) => {
-      if (estourou) return
       // O filho saiu, mas o grupo pode ter ficado com um neto: sem o fim dele, o neto segura o `flock` da fila de carga.
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o sinal que chega no primeiro instante
-    for (const sinal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) process.on(sinal, terminar)
+    setTimeout(() => { for (const sinal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) process.on(sinal, terminar) }, 400)
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o sinal que chega no primeiro instante
-    for (const sinal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) process.on(sinal, terminar)
+    for (const sinal of ['SIGTERM', 'SIGHUP'] as const) process.on(sinal, terminar)
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o SIGTERM chega primeiro, e o SIGKILL só depois da espera
-          if (vivo && Date.now() < limite) return
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o comando que passa sai 0
-    if (grupo.id === undefined) {
+    if (false) {
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › no grupo do portão
-      if (restaurar) writeFileSync(copiaDaOriginal, restaurar.original)
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a espera até o SIGKILL é a injetada
-        [...process.execArgv, supervisor, MARCA_DO_SUPERVISOR, String(prazoMs), String(opcoes.esperaAteSigkillMs ?? ESPERA_ATE_SIGKILL_MS), ...aRestaurar, '--', ...(relatorio?.comando ?? comando)],
+        [...process.execArgv, supervisor, MARCA_DO_SUPERVISOR, String(prazoMs), String(ESPERA_ATE_SIGKILL_MS), ...aRestaurar, '--', ...(relatorio?.comando ?? comando)],
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › negado: hookspath: o --get com a chave
-  return palavras.length === 2 && (acao === '--get' || acao === '--get-all') && /^core\.hookspath$/i.test(chave ?? '') && resto.at(-1) === chave
+  return (acao === '--get' || acao === '--get-all') && /^core\.hookspath$/i.test(chave ?? '') && resto.at(-1) === chave
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › negado: hookspath: desarmar o caminho
-  return palavras.length === 2 && (acao === '--get' || acao === '--get-all') && /^core\.hookspath$/i.test(chave ?? '') && resto.at(-1) === chave
+  return palavras.length === 2 && /^core\.hookspath$/i.test(chave ?? '') && resto.at(-1) === chave
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › passa: leitura do hooksPath por --get-all
-  return palavras.length === 2 && (acao === '--get' || acao === '--get-all') && /^core\.hookspath$/i.test(chave ?? '') && resto.at(-1) === chave
+  return palavras.length === 2 && (acao === '--get') && /^core\.hookspath$/i.test(chave ?? '') && resto.at(-1) === chave
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › negado: hookspath: o escopo depois da
-  return palavras.length === 2 && (acao === '--get' || acao === '--get-all') && /^core\.hookspath$/i.test(chave ?? '') && resto.at(-1) === chave
+  return palavras.length === 2 && (acao === '--get' || acao === '--get-all') && /^core\.hookspath$/i.test(chave ?? '')
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › passa: leitura do hooksPath por --get
-  const [acao, chave] = palavras
+  const [chave, acao] = palavras
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › no grupo do portão
   try {
-    writeFileSync(destino, readFileSync(origem))
   } finally {
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › no grupo do portão
-    writeFileSync(destino, readFileSync(origem))
+    rmSync(destino, { force: true })
+    writeFileSync(destino, readFileSync(origem))
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o caminho normal do rodarCalado
-    writeFileSync(destino, readFileSync(origem))
+    rmSync(destino, { force: true })
+    writeFileSync(destino, readFileSync(origem))
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| (escrito pelo Implementador, antes da 1ª rodada) | Os blocos de "Mutações" de `tasks/prd-harness/7_task.md` e `5_task.md` que citam as linhas do supervisor (`mutacoes.ts`) e do `concluirAbertura` (`linhas.ts`) que esta correção mexeu já não acham o trecho (13 e 8 blocos; boa parte já estava assim por tarefas posteriores), e o da `20_task.md` sobre o `aviso-de-sessao.sh` também | Não reescritos: o pedido cita só os da `20_task.md` que esta correção muda, e documento de tarefa já fechada não é conferido por ninguém depois do commit dela. Quem quiser os blocos vivos os refaz na tarefa que mexer de novo nesses trechos |
| (idem) | O `kill <portão>` (SIGTERM só ao portão, sem o supervisor) não devolve a fonte na hora: o supervisor segue até o teste acabar ou estourar o prazo (até 10 min) e então a devolve. O Ctrl-C e o fechamento do terminal, que mandam o sinal ao grupo todo, devolvem em segundos | Limite do desenho: o portão, preso no `spawnSync`, não corre JavaScript. Fechar o resto pede o portão assíncrono, que é outra tarefa. Um `kill -9` do portão tem o mesmo limite |
| (idem) | Pasta `educa-corrida-*` em `/tmp` com o `relatorio.json` do Vitest fica para trás quando o portão morre por sinal (só a cópia da original é apagada) | O relatório só tem nome de caso e mensagem de asserção, e dado sintético (regra 20, item 17). Apagar a pasta no supervisor quebraria a leitura do relatório no caminho normal |
| infra-guardian (1ª) | `restaurarOArquivo`: restaurar só se o conteúdo atual for o mutado (ou passar o hash do mutado em `--restaurar`), para a cópia não apagar edição feita no meio | `TODO.md`: muda o comportamento do supervisor e o contrato do `--restaurar`; o limite do `kill` só ao portão já está registrado nesta tabela |
| infra-guardian (1ª) | O parse dos argumentos do supervisor não trata a falta do `--` (`indexOf` -1) | Recusada: o único chamador é o `rodarCalado`, que sempre manda o `--`; checagem nova mudaria o código de saída do supervisor |
| privacy-guardian (1ª) | Criar a pasta `educa-corrida-*` com 0700 ou apagá-la no fim, para o caso de o supervisor morrer por SIGKILL | Recusada: a pasta nasce de `mkdtempSync`, que já a cria com 0700, e o conteúdo é só código do repositório |
| revisor-geral (1ª) | Usar `git rev-parse --path-format=absolute --git-common-dir` nos passos 6 e 9, para a âncora ficar explícita | Recusada: mexe nos dois passos, nos blocos de "Mutações" que citam o comando e nos da `20_task.md`, e o `6-tarefa.md` está a 49 B do teto de 24.000 B do `seguir.test.ts`; não muda o resultado |
| revisor-geral (1ª) | Renomear `opcoes` e `estourou` em `mutacoes.ts` | Recusada: só legibilidade, e os blocos de "Mutações" citam `if (estourou) return` e as linhas do supervisor pelo texto |
| test-engineer (1ª) | `git config get core.hooksPath` (git 2.46 ou mais) continua barrado | Nada a aplicar: conservador e aceitável; registrar se o `contexto-inicial.sh` ou o conferir do checkout passarem a usar essa forma |
| infra-guardian (2ª) | `restaurarOArquivo` usa `writeFileSync`, e um leitor que abra a fonte nesse instante pode pegá-la pela metade | `TODO.md`/`/retro`, para o dia em que o portão rodar em paralelo com outro leitor da fonte; hoje só o supervisor escreve, depois do fim do grupo do teste |
| infra-guardian (2ª) | Comentário no teste novo do `vigia.test.ts` dizendo que o `vi.stubEnv` só vale porque `ambienteSemOGitDeFora()` lê `process.env` na hora de rodar | Recusada: só comentário, e mexer em arquivo depois da aprovação caduca o `revisor-geral` sem mudar comportamento |
| revisor-geral (2ª) | O caso do `GIT_DIR` em `vigia.test.ts` prova o filtro do auxiliar do teste, não o comando de produção; dizer isso no nome do caso | Recusada: só nome de teste; o caso cumpre o que a r1 pediu (item 3) |
| revisor-geral (2ª) | `afterEach(vi.unstubAllEnvs)` no meio do `describe`; levar ao começo do bloco | Recusada: só organização do arquivo de teste |
| revisor-geral (2ª) | `--file` e `--blob` continuam negados por não estarem em `ESCOPO_DE_LEITURA` | Nada a aplicar: é o lado seguro; ampliar a lista só de propósito, se o `contexto-inicial.sh` vier a precisar |
| test-engineer (2ª) | A linha 4 da tabela "Teste que reproduz" ainda diz "(6)" para os `negado: hookspath`; agora são 11 | `/retro`: correção de contagem num documento já revisado; não muda código nem teste |
| test-engineer (2ª) | As cláusulas `[acao, chave]` e `resto.at(-1) === chave` se sobrepõem; uma linha de comentário em `comando-git.ts` diria que ficam de propósito | Recusada: só comentário em arquivo de código aprovado; cada cláusula já tem o seu bloco de mutação |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-24 16:37:57 | 2026-10-24 16:38:09 | `tenancy-guardian` | 1 | APROVADO | ac876a85b487df34f |
| 2026-10-24 16:37:53 | 2026-10-24 16:38:15 | `infra-guardian` | 1 | APROVADO | a9039a11df458455a |
| 2026-10-24 16:37:59 | 2026-10-24 16:38:20 | `conformidade-reviewer` | 1 | APROVADO | a480b373e2f91ac9f |
| 2026-10-24 16:37:55 | 2026-10-24 16:38:24 | `privacy-guardian` | 1 | APROVADO | ac854b031a9e66fbb |
| 2026-10-24 16:37:51 | 2026-10-24 16:39:05 | `revisor-geral` | 1 | REPROVADO | a5b20a31b53ae89f8 |
| 2026-10-24 16:37:50 | 2026-10-24 16:40:00 | `test-engineer` | 1 | REPROVADO | a0d77487ab4d1a4d5 |
| 2026-10-24 16:59:05 | 2026-10-24 16:59:32 | `infra-guardian` | 2 | APROVADO | a8fddf29a66080687 |
| 2026-10-24 16:59:09 | 2026-10-24 16:59:33 | `privacy-guardian` | 2 | APROVADO | a1df61ba1ae082b72 |
| 2026-10-24 16:59:13 | 2026-10-24 16:59:44 | `tenancy-guardian` | 2 | APROVADO | a52c1e1d76e0d4cb8 |
| 2026-10-24 16:59:16 | 2026-10-24 16:59:47 | `conformidade-reviewer` | 2 | APROVADO | a9cde4fe42dbac645 |
| 2026-10-24 16:59:01 | 2026-10-24 16:59:56 | `revisor-geral` | 2 | APROVADO | abb973a8f58a97c70 |
| 2026-10-24 16:58:54 | 2026-10-24 17:00:15 | `test-engineer` | 2 | APROVADO | a5242bf7b4fc1e48b |
