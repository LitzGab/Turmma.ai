# Correção — a régua de 15 s do portão mede o caso de e2e que declara prazo próprio contra um prazo que ele não tem

**Origem:** `.processo/ordens/divergencia-2-duracao-do-e2e.md` (divergência de `Motivo: desenho` da tarefa 2.0, 2.4 e 2.5, triada pelo Arquiteto em 18/10/2026), alternativa 1, **decidida pelo Joaquim**.
**Subagentes obrigatórios:** `revisor-geral`
<!-- O PEDIDO do Orquestrador dita só `test-engineer` e `revisor-geral`; `test-engineer` é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção toca `tools/ci/` e `tools/processo/`. -->

## Sintoma

Desde `4723044` (retro M1), o portão da tarefa reprova o caso de e2e **alterado** que passa de 15 s (`tools/ci/duracao-do-e2e.ts`). A 15 s é a
metade dos 30 s do `timeout` padrão do Playwright, mas nem todo caso tem esse prazo: os que declaram `test.slow()` (90 s) ou
`test.setTimeout(n)` (o roteiro da demonstração, 8 min; a A2, 300 s; a A3-A4, 420 s) sabem que são longos, e a esteira respeita o prazo deles.
A ferramenta não lia o prazo, e media todos contra 15 s. Na tarefa 2.0, que separa os specs `professor-assistente` e `professor-turma` **sem
mudar título nem asserção** (Tech Spec, §10) e troca o caminho "Seu time" pela fixture nos sete specs que o usam, isso reprovaria os casos
movidos (de 11,5 a 37,8 s, todos com `test.slow()`) e os editados (`roteiro` 71,7 s, `a3-a4` 63 s, `a2` 43,7 s): a única saída seria dividir
ou encurtar uns 35 casos, contra a §10.

## Fora desta correção

Os arquivos da tarefa 2.0, que estavam na árvore ao receber o pedido (a lista do PEDIDO, `git status --short` de então):

```
 M apps/web/src/api/assistente-e-entregas.test.ts
 M apps/web/src/api/ciclo-de-execucao.ts
 M apps/web/src/api/entregas.ts
 M apps/web/src/areas/navegacao.test.ts
 M apps/web/src/areas/navegacao.ts
 M apps/web/src/areas/professor/Aprovar.tsx
 M apps/web/src/areas/professor/Artefato.tsx
 M apps/web/src/areas/professor/Home.tsx
 M apps/web/src/areas/professor/ResultadoDaFerramenta.tsx
 M apps/web/src/areas/professor/SinoDoProfessor.test.tsx
 M apps/web/src/areas/professor/SinoDoProfessor.tsx
 M apps/web/src/areas/professor/Time.tsx
 M apps/web/src/areas/professor/Tutor.tsx
 M apps/web/src/areas/professor/aprovar.test.ts
 M apps/web/src/areas/professor/aprovar.ts
 M apps/web/src/areas/professor/entregas.test.ts
 M apps/web/src/areas/professor/entregas.ts
 M apps/web/src/areas/professor/rotas.tsx
 M apps/web/src/areas/titulo-das-telas.test.tsx
 M apps/web/src/caminhos.ts
 M apps/web/src/componentes/CascaDaEscola.test.tsx
 M apps/web/src/componentes/CascaDaEscola.tsx
 M apps/web/src/componentes/ia/Mensagem.tsx
 M apps/web/src/componentes/itens-da-lateral.test.tsx
 M apps/web/src/componentes/itens-da-lateral.tsx
 M apps/web/src/componentes/sino/Sino.test.tsx
 M apps/web/src/componentes/sino/Sino.tsx
 M docs/interface.md
 M e2e/__fixtures__/professor/sino.ts
 M e2e/a2-assistente.spec.ts
 M e2e/a3-a4-professor.spec.ts
 M e2e/areas.spec.ts
 M e2e/casca-no-celular.spec.ts
 M e2e/casca.spec.ts
 M e2e/meus-dados.spec.ts
 M e2e/professor-sino.spec.ts
 M e2e/roteiro-da-demonstracao.spec.ts
 M e2e/troca-de-escola.spec.ts
 M tasks/prd-telas-do-professor/2_task.md
?? e2e/__fixtures__/professor/cena.ts
?? e2e/__fixtures__/professor/criados.ts
?? e2e/__fixtures__/professor/entregas.ts
?? e2e/__fixtures__/professor/tutor.ts
```

Não entram na revisão nem no commit, e esta correção não os altera. **Durante a correção eles ficaram fora da árvore**, guardados em
`tar` com a soma de cada arquivo conferida, e voltaram byte a byte ao fim: o portão da tarefa lê tudo o que a árvore alterou, e os e2e e
os testes da web da 2.0, ainda pela metade, entrariam nos alvos (e os casos `casca:468` e `areas:151`, que a 2.0 ainda tem de encurtar ou
dividir, o reprovariam por causa dela, e não da correção).

Também ficam de fora: a linha na §10 da Tech Spec e em "Divergências resolvidas nesta tarefa" da 2.0, que o Arquiteto e a 2.0 escrevem
(a decisão é a desta correção); retomar a 2.0; e o que o prazo de 8 minutos do roteiro, ou de qualquer caso, deveria ser.

## Causa

`casosLentos` comparava a duração de todo caso alterado com a constante `LIMITE_DO_CASO_DE_E2E_MS = 15_000`, que é a metade do prazo
**padrão**. O prazo efetivo do caso (com `test.slow()` e `test.setTimeout()` aplicados) o Playwright já grava no relatório `json`, no campo
`timeout` de cada teste (conferido no Playwright 1.63 instalado, com um spec de brinquedo: 30 000, 90 000, 420 000 e 100 000 para o caso
padrão, `slow()`, `setTimeout(420_000)` e `describe.configure({ timeout })`), mas `casosMedidos` não o lia.

Ler o prazo do relatório sozinho abriria a saída que a divergência apontou como risco: pôr `test.slow()` num caso que estourou a régua. Por
isso o prazo só vale se **já estava no HEAD**. O relatório traz o prazo da árvore; o do HEAD se acha lendo os specs do HEAD (`git show`),
por **título do caso** e em qualquer arquivo, porque o caso movido da 2.5 está num arquivo novo e leva o prazo que tinha no antigo.

## Teste que reproduz

`tools/ci/duracao-do-e2e.test.ts` (unidade). O caso central, no repositório temporário: um spec do HEAD com `test('lento')` e `test.slow()`,
alterado na árvore, com 40 s medidos e `timeout` 90 000 no relatório — `motivoDaDuracaoDoE2e` tem de devolver `null` (limite 45 s), e com 46 s
devolver `levou 46,0 s (limite 45,0 s)`; o caso movido para um spec novo leva o mesmo prazo; o `test.slow()` posto agora num caso que o HEAD
não tinha, ou tinha sem prazo, mede 15 s (`levou 20,0 s (limite 15,0 s)`).

**Vermelho antes:** o módulo do HEAD (`git show HEAD:tools/ci/duracao-do-e2e.ts`), rodado sobre esse mesmo cenário, reprova: `1 caso(s) de e2e
alterado(s) acima de 15,0 s … e2e/antigo.spec.ts:1 (chromebook) levou 40,0 s — lento`. O teste novo espera `null`. Os demais testes novos
dependem de exportações que o módulo antigo não tinha (`prazosDosCasos`, `prazosDoHead`, `prazoContado`, `limiteDoCaso`).

## Correção

Só ferramenta de processo (`tools/ci/`) e os textos que dizem o limite; o portão (`portao-local.ts`) não muda de comportamento.

- `tools/ci/duracao-do-e2e.ts`:
  - `PRAZO_PADRAO_DO_CASO_DE_E2E_MS = 30_000`; `LIMITE_DO_CASO_DE_E2E_MS` passa a ser a metade dele, os mesmos 15 s;
  - `CasoMedido.prazoMs`, lido do `timeout` do relatório (30 s se o relatório não o traz);
  - `prazosDosCasos(texto)`: o prazo que cada `test('título', …)` declara no corpo, `setTimeout(n)` troca e `slow()` triplica, na ordem em
    que o Playwright aplica; o corpo termina no próximo caso ou em `test.describe`, `beforeEach`, etc.; só `test.setTimeout(n)` e
    `test.slow()` sem argumento são lidos (o `n` é um número ou uma constante do arquivo feita só de números e `*`, na coluna 0, fora de função e sem `;`, como o `PRAZO_DO_ROTEIRO_MS = 8 * 60_000` do
    roteiro), comentário não conta (`semComentarios`), e título com `${}` fica de fora (conta 30 s: erra para o lado de cobrar mais);
  - `prazosDoHead(raiz)`: título → prazo, nos `e2e/*.spec.ts` do HEAD, o menor se o título se repete; sem HEAD, vazio;
  - `prazoContado` e `limiteDoCaso`: prazo da corrida, nunca acima do declarado no HEAD (piso de 30 s), e o limite é a metade;
  - `casosLentos` e `avisoDosCasosLentos` recebem o limite de cada caso; o aviso passa a dizer `(limite N s)` e que `test.slow()` posto agora
    não aumenta o limite; `motivoDaDuracaoDoE2e` só lê o HEAD quando algum caso alterado tem prazo acima de 30 s.
- `tools/ci/duracao-do-e2e.test.ts`: os casos acima e as mutações abaixo.
- `.claude/rules/40-testes.md`, `.claude/skills/executar-task/SKILL.md` e os comentários de `tools/processo/portao-local.ts`: "15 s" vira "metade
  do prazo do caso (15 s sem prazo próprio)", com a regra do HEAD.

**Limites conhecidos** (o comentário do topo de `duracao-do-e2e.ts` diz o mesmo): o caso conta 30 s, e o portão cobra mais, nunca menos, quando o
HEAD declara o prazo de um jeito que a leitura não alcança: `test.slow(condição)`, `test.describe.configure({ timeout })` (que nenhum spec usa),
`test.setTimeout(ident)` com constante que não é feita só de números e `*` no mesmo arquivo, título com `${}`. `test.slow()` no nível do
`describe`, fora do corpo de qualquer caso, não é lido. A constante só é lida na coluna 0, fora de função, e terminada sem `;` (a de dentro
de uma função, ou com `;`, conta 30 s); e `test.setTimeout( n )`, com espaço dentro dos parênteses, não é lido (o prettier não o escreve), e o
caso conta 30 s. Dois casos de mesmo título em specs diferentes valem o de menor prazo, mas um caso novo que repete o título de um lento herda
o prazo dele. O leitor de comentários não entende expressão regular literal: nem a que tem aspa dentro, nem a que tem `\/` antes do fecho
(`e2e/operacao-convite.spec.ts:152`, `/^otpauth:\/\/totp\//`, onde o `\//` final é lido como comentário e some só um `/)`, sem dano). O texto
depois de uma regex com aspa dentro pode ser lido como se estivesse entre aspas, e um comentário ali contaria como declaração (o `Math.min`
com o prazo da corrida limita o dano).

## Mutações

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › traz o prazo que a corrida deu ao caso
-          prazoMs: teste.timeout ?? PRAZO_PADRAO_DO_CASO_DE_E2E_MS,
+          prazoMs: PRAZO_PADRAO_DO_CASO_DE_E2E_MS,
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › traz o prazo que a corrida deu ao caso
-          prazoMs: teste.timeout ?? PRAZO_PADRAO_DO_CASO_DE_E2E_MS,
+          prazoMs: teste.timeout ?? 0,
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › o limite é 15 s
-export const PRAZO_PADRAO_DO_CASO_DE_E2E_MS = 30_000
+export const PRAZO_PADRAO_DO_CASO_DE_E2E_MS = 60_000
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › o limite é 15 s
-export const LIMITE_DO_CASO_DE_E2E_MS = PRAZO_PADRAO_DO_CASO_DE_E2E_MS / 2
+export const LIMITE_DO_CASO_DE_E2E_MS = PRAZO_PADRAO_DO_CASO_DE_E2E_MS / 3
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › 15,001 s é lento e 15 s exatos
-  return casos.filter((caso) => caso.duracaoMs > limiteDe(caso)).sort((a, b) => b.duracaoMs - a.duracaoMs)
+  return casos.filter((caso) => caso.duracaoMs >= limiteDe(caso)).sort((a, b) => b.duracaoMs - a.duracaoMs)
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › cada caso tem o seu limite
-  return casos.filter((caso) => caso.duracaoMs > limiteDe(caso)).sort((a, b) => b.duracaoMs - a.duracaoMs)
+  return casos.filter((caso) => caso.duracaoMs > LIMITE_DO_CASO_DE_E2E_MS).sort((a, b) => b.duracaoMs - a.duracaoMs)
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › dá limite de metade dele
-  return prazoContado(caso, prazosDoHeadPorTitulo) / 2
+  return prazoContado(caso, prazosDoHeadPorTitulo)
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › dá limite de metade dele
-  const titulo = caso.titulo.split(' › ').at(-1) ?? caso.titulo
+  const titulo = caso.titulo
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › o prazo posto agora não conta
-  const doHead = prazosDoHeadPorTitulo.get(titulo) ?? PRAZO_PADRAO_DO_CASO_DE_E2E_MS
+  const doHead = prazosDoHeadPorTitulo.get(titulo) ?? caso.prazoMs
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › não aperta o caso que a tirou
-  return Math.min(caso.prazoMs, Math.max(PRAZO_PADRAO_DO_CASO_DE_E2E_MS, doHead))
+  return Math.min(caso.prazoMs, doHead)
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › o prazo maior de agora não passa o do HEAD
-  return Math.min(caso.prazoMs, Math.max(PRAZO_PADRAO_DO_CASO_DE_E2E_MS, doHead))
+  return Math.max(PRAZO_PADRAO_DO_CASO_DE_E2E_MS, doHead)
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › foi alterado mede contra 45 s
-  const limiteDe = (caso: CasoMedido) => limiteDoCaso(caso, doHead)
+  const limiteDe = (caso: CasoMedido) => limiteDoCaso(caso, new Map())
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › foi alterado mede contra 45 s
-  const doHead = alterados.some((caso) => caso.prazoMs > PRAZO_PADRAO_DO_CASO_DE_E2E_MS) ? prazosDoHead(raiz) : new Map<string, number>()
+  const doHead = alterados.some(() => false) ? prazosDoHead(raiz) : new Map<string, number>()
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › foi alterado mede contra 45 s
-  const lentos = casosLentos(alterados, limiteDe)
+  const lentos = casosLentos(alterados)
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › foi alterado mede contra 45 s
-  return lentos.length === 0 ? null : avisoDosCasosLentos(lentos, limiteDe)
+  return lentos.length === 0 ? null : avisoDosCasosLentos(lentos, () => LIMITE_DO_CASO_DE_E2E_MS)
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › o aviso diz o limite de cada caso
-    (caso) => `  ${caso.arquivo}:${String(caso.linha)} (${caso.projeto}) levou ${segundos(caso.duracaoMs)} s (limite ${segundos(limiteDe(caso))} s) — ${caso.titulo}`,
+    (caso) => `  ${caso.arquivo}:${String(caso.linha)} (${caso.projeto}) levou ${segundos(caso.duracaoMs)} s (limite ${segundos(LIMITE_DO_CASO_DE_E2E_MS)} s) — ${caso.titulo}`,
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › prazosDoHead lê o prazo de cada título
-      for (const { titulo, prazoMs } of prazosDosCasos(texto)) prazos.set(titulo, Math.min(prazos.get(titulo) ?? prazoMs, prazoMs))
+      for (const { titulo, prazoMs } of prazosDosCasos(texto)) prazos.set(titulo, prazoMs)
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › prazosDoHead lê o prazo de cada título
-      .filter((arquivo) => arquivo.endsWith('.spec.ts'))
+      .filter((arquivo) => arquivo.endsWith('.ts'))
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › prazosDoHead lê o prazo de cada título
-    return new Map()
+    throw new Error('sem HEAD')
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › segue a ordem do Playwright
-        prazoMs *= 3
+        prazoMs = 90_000
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › sem declaração é 30 s
-      const declarado = /^\d/.test(declaracao[1]) ? Number(declaracao[1].replaceAll('_', '')) : constantes.get(declaracao[1])
+      const declarado = /^\d/.test(declaracao[1]) ? Number(declaracao[1]) : constantes.get(declaracao[1])
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › não é do caso de cima
-const FIM_DE_CASO = /\btest\.(?:describe|beforeEach|afterEach|beforeAll|afterAll|use)\b/
+const FIM_DE_CASO = /\btest\.nunca\b/
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › não é do caso de cima
-    for (const declaracao of doCaso.matchAll(/\btest\.setTimeout\((\w+)\)|\btest\.slow\(\)/g)) {
+    for (const declaracao of doCaso.matchAll(/\btest\.setTimeout\((\w+)\)|\btest\.slow\(/g)) {
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › lê o título com aspas escapadas
-  return corpo.includes('${') ? null : corpo.replace(/\\(.)/g, '$1')
+  return corpo.replace(/\\(.)/g, '$1')
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › lê o título com aspas escapadas
-  return corpo.includes('${') ? null : corpo.replace(/\\(.)/g, '$1')
+  return corpo.includes('${') ? null : corpo
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › com a constante do arquivo feita de números
-      const declarado = /^\d/.test(declaracao[1]) ? Number(declaracao[1].replaceAll('_', '')) : constantes.get(declaracao[1])
+      const declarado = /^\d/.test(declaracao[1]) ? Number(declaracao[1].replaceAll('_', '')) : undefined
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › sem declaração é 30 s
-      const declarado = /^\d/.test(declaracao[1]) ? Number(declaracao[1].replaceAll('_', '')) : constantes.get(declaracao[1])
+      const declarado = false ? Number(declaracao[1].replaceAll('_', '')) : constantes.get(declaracao[1])
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › com a constante do arquivo feita de números
-      if (declarado !== undefined) prazoMs = declarado
+      prazoMs = declarado ?? 0
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › com a constante do arquivo feita de números
-    constantes.set(declaracao[1] ?? '', fatores.reduce((produto, fator) => produto * fator, 1))
+    constantes.set(declaracao[1] ?? '', fatores.reduce((produto, fator) => produto + fator, 1))
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › como está escrito no repositório
-    constantes.set(declaracao[1] ?? '', fatores.reduce((produto, fator) => produto * fator, 1))
+    constantes.set('', fatores.reduce((produto, fator) => produto * fator, 1))
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › com a constante do arquivo feita de números
-  for (const declaracao of texto.matchAll(/^(?:export\s+)?const\s+(\w+)\s*=\s*([\d_]+(?:\s*\*\s*[\d_]+)*)\s*$/gm)) {
+  for (const declaracao of texto.matchAll(/^const\s+(\w+)\s*=\s*([\d_]+(?:\s*\*\s*[\d_]+)*)\s*$/gm)) {
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › como está escrito no repositório
-  for (const declaracao of texto.matchAll(/^(?:export\s+)?const\s+(\w+)\s*=\s*([\d_]+(?:\s*\*\s*[\d_]+)*)\s*$/gm)) {
+  for (const declaracao of texto.matchAll(/^(?:export\s+)?const\s+(\w+)\s*=\s*([\d_]+)\s*$/gm)) {
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › comentário não é declaração
-    if (c === '/' && seguinte === '/') {
+    if (false) {
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › comentário não é declaração
-    if (c === '/' && seguinte === '*') {
+    if (false) {
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › comentário não é declaração
-    if (c === "'" || c === '"' || c === '`') aspa = c
+    if (false) aspa = c
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › comentário não é declaração
-      if (c === '\\') {
+      if (false) {
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › semComentarios tira
-      i = fim === -1 ? texto.length : fim + 2
+      i = fim === -1 ? texto.length : fim + 1
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › semComentarios tira
-      i = fim === -1 ? texto.length : fim + 2
+      i = fim === -1 ? texto.length - 1 : fim + 2
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › encerra o caso de cima
-const FIM_DE_CASO = /\btest\.(?:describe|beforeEach|afterEach|beforeAll|afterAll|use)\b/
+const FIM_DE_CASO = /\btest\.(?:beforeEach|afterEach|beforeAll|afterAll|use)\b/
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › encerra o caso de cima
-const FIM_DE_CASO = /\btest\.(?:describe|beforeEach|afterEach|beforeAll|afterAll|use)\b/
+const FIM_DE_CASO = /\btest\.(?:describe|afterEach|beforeAll|afterAll|use)\b/
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › encerra o caso de cima
-const FIM_DE_CASO = /\btest\.(?:describe|beforeEach|afterEach|beforeAll|afterAll|use)\b/
+const FIM_DE_CASO = /\btest\.(?:describe|beforeEach|beforeAll|afterAll|use)\b/
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › encerra o caso de cima
-const FIM_DE_CASO = /\btest\.(?:describe|beforeEach|afterEach|beforeAll|afterAll|use)\b/
+const FIM_DE_CASO = /\btest\.(?:describe|beforeEach|afterEach|afterAll|use)\b/
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › encerra o caso de cima
-const FIM_DE_CASO = /\btest\.(?:describe|beforeEach|afterEach|beforeAll|afterAll|use)\b/
+const FIM_DE_CASO = /\btest\.(?:describe|beforeEach|afterEach|beforeAll|use)\b/
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › encerra o caso de cima
-const FIM_DE_CASO = /\btest\.(?:describe|beforeEach|afterEach|beforeAll|afterAll|use)\b/
+const FIM_DE_CASO = /\btest\.(?:describe|beforeEach|afterEach|beforeAll|afterAll)\b/
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › também abrem caso
-const INICIO_DE_CASO = /\btest(?:\.(?:only|fixme))?\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
+const INICIO_DE_CASO = /\btest(?:\.(?:fixme))?\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › também abrem caso
-const INICIO_DE_CASO = /\btest(?:\.(?:only|fixme))?\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
+const INICIO_DE_CASO = /\btest(?:\.(?:only))?\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › lê o título com aspas escapadas
-const INICIO_DE_CASO = /\btest(?:\.(?:only|fixme))?\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
+const INICIO_DE_CASO = /\btest(?:\.(?:only|fixme))?\((['"`])((?:\\.|(?!\1)[^\\])*)\1/g
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › lê o título com aspas escapadas
-const INICIO_DE_CASO = /\btest(?:\.(?:only|fixme))?\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
+const INICIO_DE_CASO = /\btest(?:\.(?:only|fixme))?\(\s*(['"`])((?:(?!\1)[^\\])*)\1/g
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › com a constante do arquivo feita de números
-  for (const declaracao of texto.matchAll(/^(?:export\s+)?const\s+(\w+)\s*=\s*([\d_]+(?:\s*\*\s*[\d_]+)*)\s*$/gm)) {
+  for (const declaracao of texto.matchAll(/^(?:export\s+)?const\s+(\w+)\s*=\s*([\d_]+(?:\s*\*\s*[\d_]+)*)/gm)) {
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › com a constante do arquivo feita de números
-    const fatores = (declaracao[2] ?? '').split('*').map((fator) => Number(fator.replaceAll('_', '')))
+    const fatores = (declaracao[2] ?? '').split('*').map((fator) => Number(fator))
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › comentário não é declaração
-      if (c === aspa) aspa = null
+      if (false) aspa = null
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › semComentarios tira
-      const quebra = texto.indexOf('\n', i + 2)
+      const quebra = texto.indexOf('x', i + 2)
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › semComentarios tira
-      i = quebra === -1 ? texto.length : quebra
+      i = quebra === -1 ? texto.length - 1 : quebra
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › semComentarios tira
-      i = quebra === -1 ? texto.length : quebra
+      i = quebra === -1 ? texto.length : quebra + 1
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › semComentarios tira
-    if (aspa !== null) {
+    if (false) {
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › lê o título com aspas escapadas
-        saida += seguinte
+        saida += ''
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › lê o título com aspas escapadas
-        i += 2
+        i += 1
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › semComentarios tira
-    if (c === '/' && seguinte === '/') {
+    if (seguinte === '/') {
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › semComentarios tira
-    if (c === '/' && seguinte === '/') {
+    if (c === '/') {
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › com a constante do arquivo feita de números
-    if (c === '/' && seguinte === '*') {
+    if (seguinte === '*') {
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › semComentarios tira
-    if (c === '/' && seguinte === '*') {
+    if (c === '/') {
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › semComentarios tira
-      const fim = texto.indexOf('*/', i + 2)
+      const fim = texto.indexOf('*/', i)
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › semComentarios tira
-    if (c === "'" || c === '"' || c === '`') aspa = c
+    if (c === '"' || c === '`') aspa = c
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › semComentarios tira
-    if (c === "'" || c === '"' || c === '`') aspa = c
+    if (c === "'" || c === '`') aspa = c
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › semComentarios tira
-    if (c === "'" || c === '"' || c === '`') aspa = c
+    if (c === "'" || c === '"') aspa = c
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › com a constante do arquivo feita de números
-  for (const declaracao of texto.matchAll(/^(?:export\s+)?const\s+(\w+)\s*=\s*([\d_]+(?:\s*\*\s*[\d_]+)*)\s*$/gm)) {
+  for (const declaracao of texto.matchAll(/(?:export\s+)?const\s+(\w+)\s*=\s*([\d_]+(?:\s*\*\s*[\d_]+)*)\s*$/gm)) {
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › com a constante do arquivo feita de números
-      const declarado = /^\d/.test(declaracao[1]) ? Number(declaracao[1].replaceAll('_', '')) : constantes.get(declaracao[1])
+      const declarado = /\d/.test(declaracao[1]) ? Number(declaracao[1].replaceAll('_', '')) : constantes.get(declaracao[1])
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › nome que só termina em test
-    for (const declaracao of doCaso.matchAll(/\btest\.setTimeout\((\w+)\)|\btest\.slow\(\)/g)) {
+    for (const declaracao of doCaso.matchAll(/test\.setTimeout\((\w+)\)|\btest\.slow\(\)/g)) {
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › nome que só termina em test
-    for (const declaracao of doCaso.matchAll(/\btest\.setTimeout\((\w+)\)|\btest\.slow\(\)/g)) {
+    for (const declaracao of doCaso.matchAll(/\btest\.setTimeout\((\w+)\)|test\.slow\(\)/g)) {
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › nome que só termina em test
-const INICIO_DE_CASO = /\btest(?:\.(?:only|fixme))?\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
+const INICIO_DE_CASO = /test(?:\.(?:only|fixme))?\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › nome que só termina em test
-const INICIO_DE_CASO = /\btest(?:\.(?:only|fixme))?\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
+const INICIO_DE_CASO = /\btest(?:\.(?:only|fixme))?\(\s*(['`])((?:\\.|(?!\1)[^\\])*)\1/g
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › sem declaração é 30 s
-const INICIO_DE_CASO = /\btest(?:\.(?:only|fixme))?\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
+const INICIO_DE_CASO = /\btest(?:\.(?:only|fixme))?\(\s*(["`])((?:\\.|(?!\1)[^\\])*)\1/g
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › lê o título com aspas escapadas
-const INICIO_DE_CASO = /\btest(?:\.(?:only|fixme))?\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
+const INICIO_DE_CASO = /\btest(?:\.(?:only|fixme))?\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1/g
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › sem declaração é 30 s
-const INICIO_DE_CASO = /\btest(?:\.(?:only|fixme))?\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g
+const INICIO_DE_CASO = /\btest(?:\.(?:only|fixme))?\(\s*(['"`])((?:\\.|[^\\])*)\1/g
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › nome que só termina em test
-const FIM_DE_CASO = /\btest\.(?:describe|beforeEach|afterEach|beforeAll|afterAll|use)\b/
+const FIM_DE_CASO = /test\.(?:describe|beforeEach|afterEach|beforeAll|afterAll|use)\b/
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › nome que só termina em test
-const FIM_DE_CASO = /\btest\.(?:describe|beforeEach|afterEach|beforeAll|afterAll|use)\b/
+const FIM_DE_CASO = /\btest\.(?:describe|beforeEach|afterEach|beforeAll|afterAll|use)/
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › prazosDoHead lê o prazo de cada título
-    const arquivos = execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD', '--', 'e2e/'], { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
+    const arquivos = execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD', '--', '.'], { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › lê o título com aspas escapadas
-    if (titulo === null) continue
+    if (false) continue
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › não é do caso de cima
-    const doCaso = fim === -1 ? corpo : corpo.slice(0, fim)
+    const doCaso = corpo
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › sem declaração é 30 s
-    const proximo = inicios[indice + 1]?.index ?? texto.length
+    const proximo = texto.length
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › sem declaração é 30 s
-      if (declaracao[1] === undefined) {
+      if (false) {
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › comentário não é declaração
-  const texto = semComentarios(textoBruto)
+  const texto = textoBruto
```

```mutacao
arquivo: tools/ci/duracao-do-e2e.ts
teste: tools/ci/duracao-do-e2e.test.ts › prazosDoHead lê o prazo de cada título
-      for (const { titulo, prazoMs } of prazosDosCasos(texto)) prazos.set(titulo, Math.min(prazos.get(titulo) ?? prazoMs, prazoMs))
+      for (const { titulo, prazoMs } of prazosDosCasos(texto)) prazos.set(titulo, Math.min(prazos.get(titulo) ?? 0, prazoMs))
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | Prazo em duas etapas: a regra "já estava no HEAD" se contorna em dois commits da mesma spec; comparar com o `merge-base` da `develop` fecharia | `/retro` da X3, como o próprio revisor indicou ("Fica para o `/retro`"); muda a base da comparação, não é barata |
| test-engineer (1ª) | Falso início de caso: `INICIO_DE_CASO` casa com `.test('literal')` de um `RegExp`; vale um `(?<![.\w])` antes de `test` | `TODO.md`: muda o comportamento da regex e pede teste e bloco próprios; hoje só aperta a régua (cobra mais, nunca menos) |
| test-engineer (2ª) | `const` dentro de função: a regex das constantes usa `^\s*` com `m`, e uma constante indentada, ou uma sombra de mesmo nome, entra no mapa | Resolvida: a regex só lê a constante na coluna 0 (diagnóstico do Arquiteto, C3); o caso `constante de dentro de uma função` conta 30 s |
| revisor-geral (2ª) | `semComentarios` é um leitor feito à mão; o `ts.createScanner` (como `impressaoSemComentarios`, `tools/processo/revisoes.ts:221`) entenderia regex literal e acabaria com o limite | `TODO.md`, ao lado do falso início de caso; troca a implementação, não é barata, e o limite está declarado; pesado demais para a 3ª rodada de uma correção que só cobra a mais |
| revisor-geral (2ª) | Constante terminada em `;` não é lida (conta 30 s): uma palavra nos "Limites conhecidos" | Aplicada como texto, nos "Limites conhecidos" e no comentário do topo; não vai para o `TODO.md` |
| revisor-geral (3ª) | `duracao-do-e2e.test.ts:304`: com `limiteDoCaso` sem valor padrão, a linha com `new Map()` repete o que a 303 já prova com `noHead` | Recusada: inofensiva, e tirá-la caducaria as duas aprovações; sai quando uma tarefa futura tocar esse teste |
| revisor-geral (3ª) | "fora de função" (limites conhecidos, comentário do topo e JSDoc de `prazosDosCasos`) promete mais do que a regex entrega: lê qualquer `const` na coluna 0; dizer "na coluna 0 (o que, com o prettier, quer dizer fora de função)" | Tarefa futura que tocar `tools/ci/duracao-do-e2e.ts`; só texto, e o prettier nunca recua uma função para a coluna 0, então não há dano |
| test-engineer (3ª) | `/^\d/` trata como constante o identificador que começa por `_` (o código antigo lia `_1` como o número 1); nenhum caso prova isso | Tarefa futura que tocar `tools/ci/duracao-do-e2e.ts`, junto do falso início de caso que já está no `TODO.md`; ninguém escreve `test.setTimeout(_1)` e o erro é para o lado de cobrar mais (30 s) |
| test-engineer (3ª) | Trocar `\s*$` por só `$` (espaço no fim da linha) não tem bloco | Recusada: o prettier tira o espaço no fim da linha, então não pesa |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
| 2026-10-18 18:59:06 | 2026-10-18 19:00:15 | `revisor-geral` | 1 | APROVADO | a3e1da1060df15cf4 |
| 2026-10-18 18:59:05 | 2026-10-18 19:02:09 | `test-engineer` | 1 | REPROVADO | a54b5d14c65f0af8b |
| 2026-10-18 19:11:21 | 2026-10-18 19:12:38 | `revisor-geral` | 2 | APROVADO | a1a93f835a436e6c9 |
| 2026-10-18 19:11:15 | 2026-10-18 19:13:10 | `test-engineer` | 2 | REPROVADO | adc95f6da66c68a51 |
| 2026-10-18 19:31:08 | 2026-10-18 19:32:21 | `revisor-geral` | 3 | APROVADO | a2e3c873e0877f667 |
| 2026-10-18 19:31:02 | 2026-10-18 19:33:02 | `test-engineer` | 3 | REPROVADO | a674df7409e7215be |
| 2026-10-18 19:40:23 | 2026-10-18 19:40:58 | `test-engineer` | 4 | APROVADO | a5e41c039034a4d8e |
