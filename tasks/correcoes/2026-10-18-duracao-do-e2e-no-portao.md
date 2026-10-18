# Correção — o portão da tarefa não mede a duração do e2e que roda

**Origem:** `tasks/prd-pele-e-casca/retro.md`, M1, e `tasks/prd-telas-da-coordenacao/retro.md`, M1 (`TODO.md`, "(X1, retrospectiva) Código de processo", letra (a)).
**Subagentes obrigatórios:** `infra-guardian`, `revisor-geral`
<!-- Os dois vieram no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção toca `tools/ci/` e `tools/processo/`. -->

## Sintoma

O portão da tarefa roda os e2e que a tarefa alterou e só olha se passam. O prazo de um caso é 30 s no runner da esteira, que leva
perto do dobro da máquina de quem implementa; um caso que passa de 15 s aqui estoura lá, e ninguém vê antes da esteira. Na X1, os
casos que caíram levavam de 19 a 29 s aqui: duas correções e duas rodadas de validação depois da validação aprovada. Na X2, quatro
dos sete casos de prazo já passavam de 15 s na máquina (`material:180` a 18 s, `areas:316` a 22, `agentes:164` a 22 e `agentes:186` a 21).

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa. As letras (b), (d), (e) e (g) do mesmo item do `TODO.md`
e as outras duas frases da (c) são correções seguintes. A duração dos casos do **portão completo** (`--e2e --infra`, uma vez por spec)
também fica de fora: lá o arquivo inteiro roda, e os casos lentos que já existem não são de ninguém.

## Causa

O `portao-local.ts` roda `node tools/ci/e2e.ts --manter-ambiente <arquivos alterados>` e lê só o código de saída. O repórter do
Playwright é o `list`, que escreve a duração na tela e não a guarda; nada compara essa duração com o prazo. O aviso de prazo que
existe (`prazo-do-e2e.ts`, `avisoDePrazoDoE2e`) mede a **etapa inteira** em minutos, para o teto do job da esteira, e não o caso.

## Teste que reproduz

`tools/ci/duracao-do-e2e.test.ts` (unidade, ficheiro novo): o relatório do repórter `json` é lido caso a caso e projeto a projeto; o
que passa de 15 s e foi tocado pelo diff do git reprova, e o que passou de 15 s num caso que o diff não tocou não reprova; arquivo de
e2e novo tem todos os casos alterados; sem relatório o portão reprova; e a configuração do Playwright e o `portao-local.ts` ligam a
medição (as duas ligações, que nenhuma função sozinha prova, por leitura do fonte, como os demais guardas de arquitetura).

Vermelho antes: o módulo `tools/ci/duracao-do-e2e.ts` não existia (o arquivo de teste não importava) e o `playwright.config.ts` tinha
`reporter: … 'list'`, sem o `json`. O formato do relatório foi conferido contra o Playwright instalado, com um spec de brinquedo de dois
projetos: `file` vem relativo ao `testDir`, `line` é a linha do `test(`, o caso pulado vem com `status: skipped`, o `describe` é uma
suíte filha e o `outputFile` cria a pasta que falta.

## Correção

- `tools/ci/duracao-do-e2e.ts`: `relatoriosDoPlaywright` (o `json` entra só com `EDUCA_RELATORIO_DO_E2E`), `casosMedidos`,
  `linhasDoDiff`, `alteracoesDoArquivo` (diff do git contra o HEAD; arquivo fora do git é `tudo`), `casosAlterados` (o caso vai do
  `test(` até a linha antes do `test(` seguinte; linha alterada antes do primeiro caso não é de caso nenhum), `casosLentos` (acima de
  15 s, exatamente 15 ainda cabe) e `motivoDaDuracaoDoE2e` (relatório ausente ou ilegível também reprova).
- `playwright.config.ts`: `reporter: relatoriosDoPlaywright(CI, EDUCA_RELATORIO_DO_E2E)`. Sem a variável a lista é a de sempre (`list`,
  e `github` na esteira); a esteira e quem roda o e2e à mão não passam a gravar nada.
- `tools/processo/portao-local.ts`: no portão da tarefa, apaga o relatório da corrida anterior, passa a variável ao `node tools/ci/e2e.ts`
  e, com as suítes verdes e algum e2e alterado, reprova pela duração **antes** das mutações e sem gravar carimbo, listando arquivo, linha,
  projeto e segundos de cada caso.
- `.claude/skills/executar-task/SKILL.md`, `.claude/rules/40-testes.md` e `TODO.md`: o que o portão da tarefa passa a fazer, e a letra (a) feita.

## Mutações

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › o limite é 15 s
-export const LIMITE_DO_CASO_DE_E2E_MS = 15_000
+export const LIMITE_DO_CASO_DE_E2E_MS = 30_000
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › 15,001 s é lento e 15 s exatos ainda cabem; o mais lento vem primeiro
-  return casos.filter((caso) => caso.duracaoMs > limiteMs).sort((a, b) => b.duracaoMs - a.duracaoMs)
+  return casos.filter((caso) => caso.duracaoMs >= limiteMs).sort((a, b) => b.duracaoMs - a.duracaoMs)
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › a primeira e a última linha do intervalo contam; a linha do caso seguinte já é dele
-    return [...alteracao].some((linha) => linha >= caso.linha && linha < seguinte)
+    return [...alteracao].some((linha) => linha >= caso.linha && linha <= seguinte)
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › a linha de dentro do caso o altera, e só ele
-    return [...alteracao].some((linha) => linha >= caso.linha && linha < seguinte)
+    return alteracao.size > 0
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › arquivo novo tem todos os casos alterados
-    if (alteracao === 'tudo') return true
+    if (alteracao === 'tudo') return false
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › arquivo de e2e novo, ainda fora do git, tem todos os casos alterados
-  if (!versionado) return 'tudo'
+  if (!versionado) return new Set<number>()
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › lê o trecho de uma linha, o de várias e a remoção pura, que conta como a linha de cima
-    if (quantas === 0) linhas.add(Math.max(inicio, 1))
+    if (quantas === 0) linhas.add(0)
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › soma as tentativas do mesmo caso e deixa de fora o caso pulado
-        if (teste.status === 'skipped') continue
+        if (teste.status === 'never') continue
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › soma as tentativas do mesmo caso e deixa de fora o caso pulado
-        const duracaoMs = (teste.results ?? []).reduce((soma, resultado) => soma + (resultado.duration ?? 0), 0)
+        const duracaoMs = (teste.results ?? []).reduce((_soma, resultado) => resultado.duration ?? 0, 0)
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › sem o relatório, ou com ele ilegível, o portão reprova: não mediu nada
-  if (!existsSync(caminhoDoRelatorio)) {
+  if (!existsSync(caminhoDoRelatorio) && caminhoDoRelatorio === '') {
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › com o arquivo, acrescenta o json que grava nele, sem tirar os de sempre
-    ...(arquivoDoRelatorio ? [['json', { outputFile: arquivoDoRelatorio }] as ReporterDescription] : []),
+    ...(arquivoDoRelatorio ? [] : []),
```

```mutacao
arquivo: playwright.config.ts
teste: tools/ci/duracao-do-e2e.test.ts › o playwright.config.ts monta os repórteres por relatoriosDoPlaywright, com a variável do portão
-  reporter: relatoriosDoPlaywright(process.env['CI'] === 'true', process.env[VARIAVEL_DO_RELATORIO_DO_E2E]),
+  reporter: process.env['CI'] === 'true' ? [['list'], ['github']] : 'list',
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/ci/duracao-do-e2e.test.ts › o portão da tarefa passa a variável só ao e2e e reprova pela duração antes das mutações
-  return daTarefa && comando.includes('tools/ci/e2e.ts') ? { ...ambiente, [VARIAVEL_DO_RELATORIO_DO_E2E]: relatorioDoE2e } : ambiente
+  return ambiente
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/ci/duracao-do-e2e.test.ts › o portão da tarefa passa a variável só ao e2e e reprova pela duração antes das mutações
-const duracaoDoE2e = daTarefa && alvos.e2e.length > 0 ? motivoDaDuracaoDoE2e(raiz, relatorioDoE2e) : null
+const duracaoDoE2e = null
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/ci/duracao-do-e2e.test.ts › o portão da tarefa passa a variável só ao e2e e reprova pela duração antes das mutações
-  : suites.find((suite) => !comandoDaSuite(suite).every((comando) => rodar(comando, ambienteDoComando(comando, suite))))
+  : suites.find((suite) => !comandoDaSuite(suite).every((comando) => rodar(comando, ambienteDaSuite(suite))))
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/ci/duracao-do-e2e.test.ts › o portão da tarefa passa a variável só ao e2e e reprova pela duração antes das mutações
-  rmSync(relatorioDoE2e, { force: true })
+  void relatorioDoE2e
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › sem o relatório, ou com ele ilegível, o portão reprova: não mediu nada
-    return `o relatório de duração ${caminhoDoRelatorio} não é um JSON legível: o portão não mediu os casos de e2e.`
+    return null
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › sem o arquivo, a lista de sempre: list, e o github na esteira
-    ...(naEsteira ? [['github'] as ReporterDescription] : []),
+    ...[],
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › devolve cada caso em cada projeto, com o arquivo no caminho do repositório e o título com o describe
-  return arquivo.startsWith('e2e/') ? arquivo : `e2e/${arquivo}`
+  return arquivo
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral 1ª | "Caso pulado some das fronteiras" (`duracao-do-e2e.ts`, `casosMedidos`): as fronteiras deveriam vir de todos os casos | `TODO.md`, letra (a), limites conhecidos: muda comportamento, e `.skip` é proibido pela regra 40 |
| revisor-geral 1ª | Tratar a mudança fora de qualquer caso como mudança no arquivo inteiro | `TODO.md`, letra (a), limites conhecidos: muda comportamento e contrato do portão |
| infra-guardian 1ª | `timeout` no `execFileSync` de `alteracoesDoArquivo` | Recusada: o próprio revisor diz que é "desprezível no portão" |
| test-engineer 1ª | `daTarefa &&` e `alvos.e2e.length > 0` sem teste (`portao-local.ts`) | Recusada: o teste das ligações já afirma as duas condições; a ordem 1 acrescenta as outras duas ligações |
| test-engineer 2ª | Afirmar também, por `indexOf`, que o `rmSync` vem antes da corrida do e2e | Recusada: o erro aparece sozinho, o portão reprova na hora por "não deixou o relatório" (não bloqueante) |
| revisor-geral 2ª | `TODO.md`: a letra (a) virou uma frase longa; separar os limites numa frase própria, como na (f) | `TODO.md`, junto da próxima correção que tocar a letra (a) ou outra do mesmo item; é só leitura |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-18 10:47:11 | 2026-10-18 10:47:42 | `infra-guardian` | 1 | APROVADO | ab151459fea96a0a6 |
| 2026-10-18 10:47:09 | 2026-10-18 10:48:15 | `revisor-geral` | 1 | APROVADO | a6fb7f7582352d857 |
| 2026-10-18 10:47:08 | 2026-10-18 10:49:04 | `test-engineer` | 1 | REPROVADO | a4532feee67c16dde |
| 2026-10-18 10:54:11 | 2026-10-18 10:54:33 | `revisor-geral` | 2 | APROVADO | ac4120e794da9e68d |
| 2026-10-18 10:54:08 | 2026-10-18 10:54:39 | `test-engineer` | 2 | APROVADO | ac76e205475fa0188 |
