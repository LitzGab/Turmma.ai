# Correção — a mutação que deixa o teste vermelho por erro de carga conta como provada

**Origem:** `tasks/prd-harness/retro.md` e `TODO.md`, item "(X7, retro, M2)": na X7, a 4.0 (bloco com erro de sintaxe) e a 18.0 (três mutações vermelhas por exceção) passaram pelo portão e só o `test-engineer` as pegou, à mão.
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`, `privacy-guardian`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. `revisor-geral`: a correção toca `tools/processo/`, que o passo 5 de `corrigir` obriga. -->

## Sintoma

`conferirMutacoes` (`tools/processo/mutacoes.ts`) lê a corrida só pelo código de saída: o teste que sai com 1 é
"vermelho", e o vermelho é "provado". Uma mutação que deixa o arquivo com erro de sintaxe, ou que faz o módulo deixar de
carregar, derruba o teste sem que **nenhum caso rode**: o código de saída é 1, o portão diz `✓ vermelho` e grava o
carimbo. A cláusula que o bloco dizia provar não foi provada por nada.

## Fora desta correção

Nada: a árvore estava limpa.

O que fica **fora**, de propósito:

- A mutação em que um caso roda e **lança** (`TypeError` no lugar do `toContain` que falharia): é a metade da M2 que a
  retro cita na 18.0 ("três mutações vermelhas por exceção"), mas a "Mudança" da M2 e o pedido falam só de erro de **carga**
  (sintaxe, módulo que não carrega, nenhum teste rodou). O revisor da 18.0 escreveu que essas três "não deixam passar verde
  falso, porque sem a guarda o teste quebra mesmo assim": o caso rodou e caiu. Separar exceção de asserção dentro de um caso
  é outro mecanismo (ler o nome do erro de cada caso, no Vitest e no Playwright), e fica para quem o quiser.
- O que cai como `'carga'` sem ser sintaxe: o `beforeAll` que lança (o Vitest pode deixar `numFailedTests` em 0, com os casos
  pulados), o erro solto com todos os casos verdes e, pelo `tools/ci/e2e.ts`, o compose que não subiu antes de o Playwright
  rodar (sem relatório). O portão fica vermelho, o que está certo, e o motivo diz "preparo do teste que lançou, ambiente que
  não subiu"; a mutação que só quebra o preparo de um teste de integração precisa de um trecho que ainda deixe um caso rodar e
  falhar. Não há caso real de `beforeAll` que lança: o limite está escrito aqui e no cabeçalho de `mutacoes.ts`.
- A herança do ambiente pelo `tools/ci/executar.ts` (`{ ...process.env, ...etapa.ambiente }`) até o Playwright do `e2e.ts`:
  conferida por leitura, e sem teste, porque prová-la pede subir o compose do e2e. Vai para o `TODO.md`.
- O teste que passa por não ter rodado caso nenhum (`-t` que não acha o nome: o Vitest sai 0 com tudo `skipped`): é verde,
  não vermelho; segue como era.

## Causa

`Rodar` devolve `boolean | 'estourou'`, e `rodarCalado` roda o teste com `stdio: 'ignore'`: do teste, o portão só sabe o
código de saída. O Vitest sai com 1 tanto quando um caso falha quanto quando o arquivo não carrega (provado em 24/10:
`numFailedTests` é 2 na asserção e 0 na sintaxe e no módulo que não existe, com `numFailedTestSuites` 1 nos dois), e o
Playwright também (`stats.unexpected` é 1 na asserção e 0 na sintaxe, com `errors` preenchido). Como a conferência não
olhava mais que o código, os dois eram o mesmo vermelho.

## Teste que reproduz

`tools/processo/mutacoes.test.ts`: o relatório do Vitest e o do Playwright lidos (`o relatório da corrida › casoFalhouNoRelatorio`),
`prepararRelatorio`, a corrida pelo supervisor (`rodarCalado lê o relatório de um teste que caiu › saiu 1 com um caso que falhou
no relatório: caiu (false); sem caso nenhum, ou sem relatório: carga`), a corrida com o Vitest e o Playwright de verdade
(`com o Vitest e o Playwright de verdade`) e `conferir as mutações: o teste tem de cair sem a cláusula, e o arquivo volta ao que era › vermelho por erro de carga (sintaxe, módulo que não carrega,
nenhum caso rodou) é recusado com o motivo, e o arquivo volta`. Vermelhos antes (as funções não existiam, e a conferência
contava o vermelho de carga como provado), verdes depois.

## Correção

`tools/processo/mutacoes.ts`:

- `Rodar` ganha um terceiro resultado, `'carga'`: o teste caiu e nenhum caso falhou. `conferirMutacoes` o recusa com o motivo
  ("erro de carga", com sintaxe, módulo, preparo que lançou, ambiente que não subiu ou nenhum caso rodou), como recusa o prazo estourado: o portão fica
  vermelho (`falhas`) e o arquivo volta ao que era. Na corrida limpa, `'carga'` é "o teste não passa", como o `false`.
- `rodarCalado` grava o relatório de cada corrida numa pasta temporária (`prepararRelatorio`): ao Vitest acrescenta
  `--reporter=json --outputFile=<arquivo>`; ao Playwright (direto ou por `tools/ci/e2e.ts`) dá o arquivo na variável
  `EDUCA_RELATORIO_DO_E2E`, que o `playwright.config.ts` já lê e que o portão já usa na duração do e2e. Se a corrida saiu com
  erro, `casoFalhouNoRelatorio` lê `numFailedTests` (Vitest) ou `stats.unexpected` (Playwright): zero, ou relatório ausente,
  é `'carga'`. Comando de outro programa não tem relatório, e vale o código de saída. A pasta é apagada no `finally`.
- A variável do Playwright é repetida como texto em `mutacoes.ts`, que só pode importar `node:` (`copiaDoSupervisor`); o teste
  prova que ela é a de `tools/ci/duracao-do-e2e.ts`.
- O cabeçalho do arquivo, `.claude/rules/40-testes.md` ("O portão") e `.claude/skills/executar-task/SKILL.md` (passo 2) dizem
  que o vermelho tem de vir de um caso que falhou.

Provado em corrida de verdade, no teste: Vitest 5.0.0 e Playwright 1.63.0 com um arquivo que passa, um que falha na
asserção, um com sintaxe quebrada, e (Vitest) um com módulo que não existe e um arquivo que não existe.

## Mutações

Sai: o ramo que recusa a mutação vermelha por erro de carga.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › recusado com o motivo, e o arquivo volta
-    } else if (corridaMutada === 'carga') {
+    } else if (false) {
```

Sai: o relatório passa a não decidir nada (o teste que cai é sempre `false`).

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › saiu 1 com um caso que falhou
-      return casoFalhouNoRelatorio(relatorio.leitor, existsSync(arquivo) ? readFileSync(arquivo, 'utf8') : null) ? false : 'carga'
+      return false
```

Sai: o relatório que não foi gravado deixa de ser tratado como ausente.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › saiu 1 com um caso que falhou
-      return casoFalhouNoRelatorio(relatorio.leitor, existsSync(arquivo) ? readFileSync(arquivo, 'utf8') : null) ? false : 'carga'
+      return casoFalhouNoRelatorio(relatorio.leitor, readFileSync(arquivo, 'utf8')) ? false : 'carga'
```

Troca: o comando sem relatório (`sh`, `tsc`) passa a cair como erro de carga.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › comando sem relatório: o código de saída decide
-      if (relatorio === null) return false
+      if (relatorio === null) return 'carga'
```

Sai: o teste que passa deixa de ser `true` sem olhar o relatório.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › é verdadeiro, qualquer que seja o relatório
-  if (status === 0) return true
```

Sai: a pasta do relatório deixa de ser apagada.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a pasta do relatório não sobra
-      rmSync(pasta, { recursive: true, force: true })
```

Sai: o Vitest deixa de receber o repórter `json`.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › vitest: o repórter json e o arquivo
-  if (programa === 'npx' && segundo === 'vitest') return { comando: [...comando, '--reporter=json', `--outputFile=${arquivo}`], env: {}, leitor: 'vitest' }
+  if (programa === 'npx' && segundo === 'vitest') return { comando: [...comando, `--outputFile=${arquivo}`], env: {}, leitor: 'vitest' }
```

Sai: o `tools/ci/e2e.ts` deixa de ser corrida com relatório de Playwright.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › playwright direto e e2e.ts
-  const playwright = (programa === 'npx' && segundo === 'playwright') || (programa === 'node' && segundo === 'tools/ci/e2e.ts')
+  const playwright = programa === 'npx' && segundo === 'playwright'
```

Troca: o relatório de Vitest passa a ser lido com a forma do Playwright.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › vitest: um caso que falhou
-  return (leitor === 'vitest' ? contagemNoJson(relatorio, 'numFailedTests') : contagemNoJson(relatorio, 'stats', 'unexpected')) > 0
+  return (leitor !== 'vitest' ? contagemNoJson(relatorio, 'numFailedTests') : contagemNoJson(relatorio, 'stats', 'unexpected')) > 0
```

Troca: "nenhum caso falhou" passa a ser "zero ou mais casos falharam".

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › vitest: um caso que falhou
-  return (leitor === 'vitest' ? contagemNoJson(relatorio, 'numFailedTests') : contagemNoJson(relatorio, 'stats', 'unexpected')) > 0
+  return (leitor === 'vitest' ? contagemNoJson(relatorio, 'numFailedTests') : contagemNoJson(relatorio, 'stats', 'unexpected')) >= 0
```

Troca: o relatório ilegível passa a provar um caso que falhou.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › relatório que não existe, vazio, ilegível ou de outra forma
   relatorio = JSON.parse(texto)
   } catch {
-    return false
+    return true
   }
```

Troca: o relatório `null` deixa de ser protegido (a leitura de uma chave de `null` lança).

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › relatório que não existe, vazio, ilegível ou de outra forma
-    if (typeof atual !== 'object' || atual === null) return 0
+    if (typeof atual !== 'object') return 0
```

Troca: a contagem que não é número (`"2"`) passa a valer.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › relatório que não existe, vazio, ilegível ou de outra forma
-  return typeof atual === 'number' ? atual : 0
+  return Number(atual) || 0
```

Troca: o comando de outro programa passa a ter relatório de Playwright.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › comando de outro programa não tem relatório
-  return playwright ? { comando, env: { [VARIAVEL_DO_RELATORIO_DO_PLAYWRIGHT]: arquivo }, leitor: 'playwright' } : null
+  return { comando, env: { [VARIAVEL_DO_RELATORIO_DO_PLAYWRIGHT]: arquivo }, leitor: 'playwright' }
```

Sai: o ambiente do relatório (a variável do Playwright) deixa de chegar ao teste.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › saiu 1 com um caso que falhou
-        { cwd: raiz, stdio: 'ignore', env: { ...process.env, ...relatorio?.env, EDUCA_BANCO_NOVO: undefined } },
+        { cwd: raiz, stdio: 'ignore', env: { ...process.env, EDUCA_BANCO_NOVO: undefined } },
```

Sai: o prazo estourado deixa de ser lido antes do relatório.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o prazo estourado segue sendo estourou
-  if (status === SAIDA_DO_PRAZO) return 'estourou'
```

Troca: a corrida deixa de usar o `preparar` injetado.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › saiu 1 com um caso que falhou
-      const relatorio = (opcoes.preparar ?? prepararRelatorio)(comando, arquivo)
+      const relatorio = prepararRelatorio(comando, arquivo)
```

Troca: o supervisor roda o comando sem o repórter e o arquivo do relatório.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › vitest: a asserção que falha cai
-        [...process.execArgv, supervisor, MARCA_DO_SUPERVISOR, String(prazoMs), String(opcoes.esperaAteSigkillMs ?? ESPERA_ATE_SIGKILL_MS), '--', ...(relatorio?.comando ?? comando)],
+        [...process.execArgv, supervisor, MARCA_DO_SUPERVISOR, String(prazoMs), String(opcoes.esperaAteSigkillMs ?? ESPERA_ATE_SIGKILL_MS), '--', ...comando],
```

**Sem bloco, de propósito:** `if (texto === null) return false` em `casoFalhouNoRelatorio` (`--faltando` a lista). É a guarda de tipo do
parâmetro `string | null`: sem ela o `JSON.parse(null)` do JavaScript lê o texto `"null"`, devolve `null` e a contagem é 0 do mesmo
jeito, então nenhuma mutação dela deixa teste algum vermelho (mutante equivalente). O caso `null` está em
`relatório que não existe, vazio, ilegível ou de outra forma`.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-24 11:40:46 | 2026-10-24 11:41:10 | `privacy-guardian` | 1 | APROVADO | a38571121a816dd85 |
| 2026-10-24 11:40:45 | 2026-10-24 11:42:19 | `revisor-geral` | 1 | APROVADO | ac48f8013daea99bd |
| 2026-10-24 11:40:44 | 2026-10-24 11:43:01 | `test-engineer` | 1 | REPROVADO | aa0e794004152fc8c |
| 2026-10-24 11:49:19 | 2026-10-24 11:49:40 | `privacy-guardian` | 2 | APROVADO | ac999953fea568d80 |
| 2026-10-24 11:49:11 | 2026-10-24 11:49:57 | `test-engineer` | 2 | APROVADO | afdcacccf1a36629a |
| 2026-10-24 11:49:15 | 2026-10-24 11:50:03 | `revisor-geral` | 2 | APROVADO | af3df77b46ea4dabc |
