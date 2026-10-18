# Correção — o portão da tarefa não roda o e2e que cita um texto que o diff tirou de `apps/web/src`

**Origem:** `tasks/prd-telas-da-coordenacao/retro.md` (`TODO.md`, "(X1, retrospectiva) Código de processo", letra (d)).
**Subagentes obrigatórios:** `revisor-geral`
<!-- Veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção toca `tools/ci/` e `tools/processo/`. -->

## Sintoma

O portão da tarefa roda só os e2e que a árvore **alterou**. Tarefa que troca um texto da tela (um título, um rótulo, um aviso) e não
mexe no `e2e/` que o cita passa no portão e quebra na esteira. Na X2: o W12 da casca (a 3.0 trocou "Governança"; `casca.spec.ts:673`,
vermelho em cinco execuções da esteira) e o sino da 6.0 ("Refazer o convite de"; `sino-da-coordenacao.spec.ts:86`) quebraram fora do
diff, cada um uma correção depois da tarefa.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa. As letras (b), (e) e (g) do mesmo item do `TODO.md` e
as duas últimas frases da (c) são correções seguintes.

## Causa

`alvosDoPortao` (`tools/processo/revisoes.ts`) só olha o **nome** dos arquivos alterados: `e2e/*.spec.ts` alterado vira alvo. Nada liga
o texto que saiu de `apps/web/src` ao `e2e/` que o procura na tela, e é essa a única ligação entre os dois que o teste de e2e tem
(`getByRole('link', { name: 'Governança' })`).

## Teste que reproduz

`tools/ci/e2e-que-cita-literal.test.ts` (unidade, arquivo novo): os literais que um diff de `apps/web/src` tira (entre aspas, de
template, texto de JSX na mesma linha e em linha própria), o que não conta (o que o diff recoloca, comentário, `import`, teste da
web, palavra solta em minúscula, caminho relativo), a busca no `e2e/` sem diferenciar maiúscula, e as duas ligações que nenhuma função
sozinha prova (o `portao-local.ts` soma os e2e achados aos alvos da tarefa, e só no portão da tarefa), por leitura do fonte.

Vermelho antes: o módulo `tools/ci/e2e-que-cita-literal.ts` não existia.

## Correção

- `tools/ci/e2e-que-cita-literal.ts`: `literaisDaLinha`, `literaisRemovidos` (do `git diff -U0 HEAD -- apps/web/src`; o que o diff
  recoloca, ou o arquivo ainda tem, não saiu), `e2eQueCitam` (lê `e2e/*.spec.ts`; sem diferenciar maiúscula, porque o e2e usa `/…/i`)
  e `e2eDosLiteraisRemovidos`.
- `tools/processo/portao-local.ts`: no portão da tarefa, soma esses e2e aos alvos (com a linha de log dizendo o arquivo e o literal).
- `.claude/skills/executar-task/SKILL.md`, `.claude/rules/40-testes.md` e `TODO.md`: o que o portão da tarefa passa a fazer, e a letra (d) feita.

**Limites conhecidos:** só os `e2e/*.spec.ts` que citam o literal; literal montado em tempo de execução (`` `${a} convite` ``) só vale
pelas partes fixas; e o que a busca não pega: (i) o spec que cita só um **pedaço** do texto removido (tirar "Governança da escola" não puxa o spec que
procura `/governança/i`; o literal inteiro é que se procura no spec); (ii) o texto de JSX que continua em linha de baixo começando em
minúscula, e o template que atravessa linhas, porque o texto é lido linha a linha; (iii) o literal citado só num ajudante de
`e2e/__fixtures__/`, que não puxa os specs que o importam; e (iv) a ordem de grandeza do que sobra: o literal curto e comum
("Professor", "Estrutura", "Governança") puxa todo spec que o cita, e num diff de 40 commits (`3be23c9`) foram 24 dos 59 specs, quase
metade da suíte, o que já não são "uns minutos". Num diff de uma tarefa costumam ser poucos.

## Mutações

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › não conta comentário, import, export from, palavra solta em minúscula, caminho relativo nem o que é curto demais
-const TAMANHO_MINIMO = 4
+const TAMANHO_MINIMO = 2
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › texto entre aspas simples, duplas e de template; o template vale pelas partes fixas
-  return texto.length >= TAMANHO_MINIMO && /\p{L}/u.test(texto)
+  return texto.length > TAMANHO_MINIMO && /\p{L}/u.test(texto)
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › não conta comentário, import, export from, palavra solta em minúscula, caminho relativo nem o que é curto demais
-  return texto.length >= TAMANHO_MINIMO && /\p{L}/u.test(texto) && !/^\p{Ll}+$/u.test(texto)
+  return texto.length >= TAMANHO_MINIMO && !/^\p{Ll}+$/u.test(texto)
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › não conta comentário, import, export from, palavra solta em minúscula, caminho relativo nem o que é curto demais
-  return texto.length >= TAMANHO_MINIMO && /\p{L}/u.test(texto) && !/^\p{Ll}+$/u.test(texto) && !/^\.{1,2}\//.test(texto)
+  return texto.length >= TAMANHO_MINIMO && /\p{L}/u.test(texto) && !/^\p{Ll}+$/u.test(texto) && !/^\.{2}\//.test(texto)
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › não conta comentário, import, export from, palavra solta em minúscula, caminho relativo nem o que é curto demais
-  return texto.length >= TAMANHO_MINIMO && /\p{L}/u.test(texto) && !/^\p{Ll}+$/u.test(texto)
+  return texto.length >= TAMANHO_MINIMO && /\p{L}/u.test(texto)
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › não conta comentário, import, export from, palavra solta em minúscula, caminho relativo nem o que é curto demais
-  return texto.length >= TAMANHO_MINIMO && /\p{L}/u.test(texto) && !/^\p{Ll}+$/u.test(texto) && !/^\.{1,2}\//.test(texto) && !/^\S+,$/.test(texto)
+  return texto.length >= TAMANHO_MINIMO && /\p{L}/u.test(texto) && !/^\p{Ll}+$/u.test(texto) && !/^\.{1,2}\//.test(texto)
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › texto entre aspas simples, duplas e de template; o template vale pelas partes fixas
-    .replace(/\\(['"`\\])/g, '$1')
+    .replace(/\\(['"`\\])/g, '\\$1')
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › texto entre aspas simples, duplas e de template; o template vale pelas partes fixas
-    .split(/\$\{[^}]*\}/)
+    .split(/\uE000/)
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › texto entre aspas simples, duplas e de template; o template vale pelas partes fixas
-    .map((trecho) => trecho.trim())
+    .map((trecho) => trecho)
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › não conta comentário, import, export from, palavra solta em minúscula, caminho relativo nem o que é curto demais
-  if (texto === '' || /^(\/\/|\/\*|\*)/.test(texto)) return []
+  if (texto === '' || /^(\/\*|\*)/.test(texto)) return []
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › não conta comentário, import, export from, palavra solta em minúscula, caminho relativo nem o que é curto demais
-  if (texto === '' || /^(\/\/|\/\*|\*)/.test(texto)) return []
+  if (texto === '' || /^(\/\/|\*)/.test(texto)) return []
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › não conta comentário, import, export from, palavra solta em minúscula, caminho relativo nem o que é curto demais
-  if (texto === '' || /^(\/\/|\/\*|\*)/.test(texto)) return []
+  if (texto === '' || /^(\/\/|\/\*)/.test(texto)) return []
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › não conta comentário, import, export from, palavra solta em minúscula, caminho relativo nem o que é curto demais
-  if (/^(import|export)\b[^'"`]*\bfrom\b/.test(texto) || /^import\s+['"`]/.test(texto)) return []
+  if (/^import\s+['"`]/.test(texto)) return []
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › não conta comentário, import, export from, palavra solta em minúscula, caminho relativo nem o que é curto demais
-  if (/^(import|export)\b[^'"`]*\bfrom\b/.test(texto) || /^import\s+['"`]/.test(texto)) return []
+  if (/^(import|export)\b[^'"`]*\bfrom\b/.test(texto)) return []
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › texto entre aspas simples, duplas e de template; o template vale pelas partes fixas
-    trechos.push(...trechosDe(achado[1] ?? achado[2] ?? achado[3] ?? ''))
+    trechos.push(...trechosDe(achado[1] ?? achado[3] ?? ''))
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › texto de JSX na mesma linha, e o de linha própria que começa em maiúscula; a expressão entre chaves divide o texto
-  for (const achado of texto.matchAll(/(?:^|>)([^<>{}=;]+)(?=<)/g)) trechos.push(...trechosDe(achado[1] ?? ''))
+  for (const achado of texto.matchAll(/(?:^|>)([^<>{}=;]+)(?=<)\uE000/g)) trechos.push(...trechosDe(achado[1] ?? ''))
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › texto de JSX na mesma linha, e o de linha própria que começa em maiúscula; a expressão entre chaves divide o texto
-  if (/^\p{Lu}/u.test(semExpressoes) && !/[=;()<>[\]"'`\\/*+&]|=>/.test(semExpressoes.replace(/\uE000/g, ''))) {
+  if (/^\p{Lu}/u.test('x') && !/[=;()<>[\]"'`\\/*+&]|=>/.test(semExpressoes.replace(/\uE000/g, ''))) {
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › não conta comentário, import, export from, palavra solta em minúscula, caminho relativo nem o que é curto demais
-  if (/^\p{Lu}/u.test(semExpressoes) && !/[=;()<>[\]"'`\\/*+&]|=>/.test(semExpressoes.replace(/\uE000/g, ''))) {
+  if (/^\p{L}/u.test(semExpressoes) && !/[=;()<>[\]"'`\\/*+&]|=>/.test(semExpressoes.replace(/\uE000/g, ''))) {
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › não conta comentário, import, export from, palavra solta em minúscula, caminho relativo nem o que é curto demais
-  if (/^\p{Lu}/u.test(semExpressoes) && !/[=;()<>[\]"'`\\/*+&]|=>/.test(semExpressoes.replace(/\uE000/g, ''))) {
+  if (/^\p{Lu}/u.test(semExpressoes)) {
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › texto de JSX na mesma linha, e o de linha própria que começa em maiúscula; a expressão entre chaves divide o texto
-    trechos.push(...semExpressoes.split('\uE000').flatMap(trechosDe))
+    trechos.push(...[semExpressoes].flatMap(trechosDe))
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › texto de JSX na mesma linha, e o de linha própria que começa em maiúscula; a expressão entre chaves divide o texto
-  return [...new Set(trechos.filter(ehLiteralUtil))]
+  return trechos.filter(ehLiteralUtil)
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › teste da web não conta: o e2e não o lê
-      arquivo = EH_TESTE_DA_WEB.test(cabecalho[1] ?? '') ? null : (cabecalho[1] ?? null)
+      arquivo = cabecalho[1] ?? null
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › o texto trocado por outro saiu
-      if (linha.startsWith('@@')) noCabecalho = false
+      if (linha.startsWith('@@')) noCabecalho = true
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › o texto trocado por outro saiu
-    if (linha.startsWith('-')) removidosPorArquivo
+    if (linha.startsWith('+')) removidosPorArquivo
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › o texto que o diff recoloca em outra linha não saiu; o que o arquivo ainda tem também não
-    for (const literal of removidos) if (!acrescentados.has(literal) && !ficaram.has(literal) && !saidos.includes(literal)) saidos.push(literal)
+    for (const literal of removidos) if (!ficaram.has(literal) && !saidos.includes(literal)) saidos.push(literal)
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › o texto que o diff recoloca em outra linha não saiu; o que o arquivo ainda tem também não
-    for (const literal of removidos) if (!acrescentados.has(literal) && !ficaram.has(literal) && !saidos.includes(literal)) saidos.push(literal)
+    for (const literal of removidos) if (!acrescentados.has(literal) && !saidos.includes(literal)) saidos.push(literal)
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › cada literal vem uma vez, de todos os arquivos
-    for (const literal of removidos) if (!acrescentados.has(literal) && !ficaram.has(literal) && !saidos.includes(literal)) saidos.push(literal)
+    for (const literal of removidos) if (!acrescentados.has(literal) && !ficaram.has(literal)) saidos.push(literal)
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › arquivo apagado tira tudo o que tinha
-    const ficaram = new Set(atual === null ? [] : atual.split('\n').flatMap(literaisDaLinha))
+    const ficaram = new Set(atual === null ? ['Painel antigo'] : atual.split('\n').flatMap(literaisDaLinha))
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › e2eQueCitam lista cada spec uma vez, com os literais que ele cita
-    .filter((caminho) => caminho.endsWith('.spec.ts'))
+    .filter((caminho) => caminho.endsWith('.ts'))
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › e2eQueCitam lista cada spec uma vez, com os literais que ele cita
-    const texto = readFileSync(join(raiz, arquivo), 'utf8').toLowerCase()
+    const texto = readFileSync(join(raiz, arquivo), 'utf8')
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › o spec que cita o texto trocado entra, sem diferenciar maiúscula; o que cita o texto que ficou, e o ajudante, não
-    const achados = literais.filter((literal) => texto.includes(literal.toLowerCase()))
+    const achados = literais.filter((literal) => texto.includes(literal))
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › e2eQueCitam lista cada spec uma vez, com os literais que ele cita
-    if (achados.length > 0) citados.push({ arquivo, literais: achados })
+    citados.push({ arquivo, literais: achados })
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › a mudança já preparada no índice também conta
-  const diff = execFileSync('git', ['diff', '-U0', 'HEAD', '--', 'apps/web/src'], { cwd: raiz, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
+  const diff = execFileSync('git', ['diff', '-U0', '--', 'apps/web/src'], { cwd: raiz, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › o texto que sai de fora de apps/web/src não conta
-  const diff = execFileSync('git', ['diff', '-U0', 'HEAD', '--', 'apps/web/src'], { cwd: raiz, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
+  const diff = execFileSync('git', ['diff', '-U0', 'HEAD', '--', '.'], { cwd: raiz, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › o arquivo da web apagado puxa os specs que citam o que ele tinha
-  const lerAtual = (arquivo: string) => (existsSync(join(raiz, arquivo)) ? readFileSync(join(raiz, arquivo), 'utf8') : null)
+  const lerAtual = (arquivo: string) => readFileSync(join(raiz, arquivo), 'utf8')
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › o portão da tarefa soma os specs achados aos alvos, e só ele
-const citados = daTarefa ? e2eDosLiteraisRemovidos(raiz) : []
+const citados = e2eDosLiteraisRemovidos(raiz)
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › o portão da tarefa soma os specs achados aos alvos, e só ele
-const alvos = alvosDoPortao([...arquivosAlterados(raiz), ...extras, ...citados.map((citado) => citado.arquivo)])
+const alvos = alvosDoPortao([...arquivosAlterados(raiz), ...extras])
```

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-18 11:06:36 | 2026-10-18 11:07:44 | `revisor-geral` | 1 | APROVADO | aab72b0a02b2f22fb |
| 2026-10-18 11:06:35 | 2026-10-18 11:08:40 | `test-engineer` | 1 | APROVADO | abf9a9a3729682e71 |

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › texto de JSX na mesma linha, e o de linha própria que começa em maiúscula; a expressão entre chaves divide o texto
-  const semExpressoes = texto.replace(/\{[^{}]*\}/g, '\uE000')
+  const semExpressoes = texto.replace(/\{[^{}]*\}/g, '')
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › texto entre aspas simples, duplas e de template; o template vale pelas partes fixas
-    trechos.push(...trechosDe(achado[1] ?? achado[2] ?? achado[3] ?? ''))
+    trechos.push(...trechosDe(achado[2] ?? achado[3] ?? ''))
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › texto entre aspas simples, duplas e de template; o template vale pelas partes fixas
-    trechos.push(...trechosDe(achado[1] ?? achado[2] ?? achado[3] ?? ''))
+    trechos.push(...trechosDe(achado[1] ?? achado[2] ?? ''))
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › texto entre aspas simples, duplas e de template; o template vale pelas partes fixas
-  for (const achado of texto.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) {
+  for (const achado of texto.matchAll(/'((?:[^'\\])*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) {
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | Classe do Tailwind conta como texto de tela: `ehLiteralUtil` aceita "sr-only" e "flex flex-col gap-3"; no `290b7cb` só o "sr-only" puxou quatro specs sem relação | Muda o comportamento do detector. `TODO.md`, correção seguinte do item "Código de processo" (descartar literal que vem de `className=`/`class=`) |
| test-engineer (1ª) | A linha de log `▶ <spec> entra nos alvos: cita "<texto>"` do portão não tem teste | Exige teste novo que roda o portão; não é barata. `TODO.md`, junto da correção acima |
| test-engineer (1ª) | `apps/web/src/__fixtures__/` não é excluído como o `.test.tsx`: texto tirado dali puxa spec à toa | Muda o comportamento do detector; só sobra spec para rodar. `TODO.md`, junto da correção acima |
| test-engineer (2ª) | O comentário de cabeçalho de `tools/ci/e2e-que-cita-literal.ts` ainda diz "o que só custa minutos" e só cita os limites antigos | Barata, mas uma rodada nova só para um comentário não se paga: `TODO.md`, junto da correção acima |
| 2026-10-18 11:14:07 | 2026-10-18 11:14:50 | `revisor-geral` | 2 | APROVADO | ad6fd106b7a6ba657 |
| 2026-10-18 11:14:02 | 2026-10-18 11:15:08 | `test-engineer` | 2 | APROVADO | a83cec8ecafa2524a |
