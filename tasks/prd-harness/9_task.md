# Tarefa 9.0 — Tarefa de código sem mutação não recebe carimbo

**Funcionalidade:** harness (X7) · **Depende de:** 2.0, 7.0, 8.0
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

Com produção alterada, o portão fica vermelho sem bloco de mutação nem a linha `**Sem mutação:** <motivo>`, e o hook
recusa o commit no mesmo caso; e o `mutacoes.ts --faltando` lista as linhas novas com condição que nenhum bloco alcança.

## Contexto necessário

- `techspec.md` §5(d)
- `prd.md` RF5, RF17
- `cenarios.md` seção A, **RF5**; seção B, **RF17**
- `.claude/rules/40-testes.md` (o portão da tarefa) — a frase do RF17 entra no texto da regra na 15.0
- Código: `tools/processo/mutacoes.ts` (`lerMutacoes`, `avaliarMutacoes`); `tools/processo/portao-local.ts`
  (`documentoDasMutacoes`, o bloco "As mutações do documento"); `tools/processo/portao.ts` (`avaliarPortao`, da 2.0);
  `tools/processo/sequencia-do-portao.ts` (da 8.0)

## Subtarefas

- [x] 9.1 — Produção = arquivo de `apps/*/src/**` ou `packages/*/src/**` que não é teste nem `.d.ts`, pelo diff da árvore
  contra a base
- [x] 9.2 — Portão: com produção alterada, sem bloco e sem `**Sem mutação:**` com motivo, vermelho; o documento é achado
  pela marca da tarefa
- [x] 9.3 — `avaliarPortao`: a mesma exigência no commit; carimbo de outro documento não serve
- [x] 9.4 — `mutacoes.ts --faltando <documento>`: linhas acrescentadas fora de teste com `if`, `&&`, `||`, `??`, ternário
  de valor, `case`, `.where(` ou expressão regular, sem bloco do mesmo arquivo que cite o texto; só imprime, sai 0; o
  portão imprime a lista
- [x] 9.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/mutacoes.ts` | alterado |
| `tools/processo/mutacoes.test.ts` | alterado |
| `tools/processo/portao-local.ts` | alterado |
| `tools/processo/portao.ts` | alterado |
| `tools/processo/revisoes.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| RF17: produção alterada, documento sem bloco nem linha | unidade | portão vermelho (`exigenciaDeMutacao`) |
| RF17: `**Sem mutação:**` vazio, ou só com o `<motivo>` do modelo | unidade | vermelho |
| RF17: com motivo / com bloco | unidade | verde |
| RF17: só teste, `.d.ts` ou `apps/web/vite.config.ts` (um caso por forma de arquivo) | unidade | não exige |
| RF17: documento achado pela marca, não por ter bloco | unidade | o outro documento, com bloco e não alterado, não serve; com dois alterados e sem o `.md`, nenhum |
| RF17 pelo `portao()` do hook com `avaliarMutacoes`, carimbo válido, produção na árvore, sem bloco nem linha | unidade, repositório de verdade | recusado; com a linha, passa; a conferência recebe os arquivos alterados |
| RF17: carimbo do portão de outra tarefa, sem documento, ou ausente | unidade | recusado |
| RF17: o portão da tarefa rodado como processo | unidade, processo | vermelho antes de qualquer suíte e sem carimbo; com a linha, passa e o carimbo traz o `documento`; com dois documentos alterados e sem o `.md`, pede o documento; o portão completo não cobra |
| RF5: linha nova de produção com cada operador, sem bloco | unidade | listada, uma linha por operador (`it.each`) |
| RF5: a mesma linha citada por um bloco do arquivo, inclusive como contexto, e dois blocos do mesmo arquivo | unidade | não listada |
| RF5: linha nova em teste, em `.d.ts` ou fora de `src`; linha só de import; texto entre aspas; comentário | unidade | não listada |
| RF5: o diff lido, o arquivo novo, a ordem da lista | unidade | números de linha, `+++` dentro do conteúdo, arquivo apagado, ordem por arquivo e linha |
| RF17: `conferir` e `revisores` como processo, com produção na árvore e documento sem bloco nem linha | unidade, processo | saem 1 com "a árvore altera código de produto"; com a linha e o portão verde, `conferir` sai 0 |
| RF17: o `.md` pedido como `./tasks/…` ou caminho absoluto | unidade, processo | o carimbo guarda o caminho relativo, e o portão acha o documento com outro documento alterado |
| RF17: a regra citada no meio de uma frase; a linha dentro de bloco cercado | unidade | `ausente`; a linha cercada conta (aceito, escrito na Tech Spec) |
| RF5: nome de arquivo entre aspas no diff | unidade | não herda as linhas do arquivo anterior |
| RF5: `--faltando` como processo, em repositório de verdade (índice, arquivo novo, sem a variável do projeto) | unidade, processo | sai 0 nos dois casos (com lista, e sem nada a listar); sem o documento sai 2; importado por outro script ou rodado sem `--faltando`, não faz nada |

## Como testar

- RF17 no commit: copiar `tools/processo/revisoes.test.ts › portão do commit › bloqueia sem carimbo do portão local, com carimbo velho, e com carimbo sem a suíte que a tarefa exige`.
- Carimbo e documento: `tools/processo/mutacoes.test.ts › o carimbo vale para as mutações como estão escritas agora › portão que não conferiu este documento, ou não conferiu mutação nenhuma, bloqueia`.
- RF5: o diff vem de função pura sobre o texto do `git diff -U0`; copie a leitura de `tools/ci/duracao-do-e2e.test.ts › linhasDoDiff: as linhas do arquivo novo que o diff tocou`.
- Rodar: `npx vitest run --project unidade tools/processo/mutacoes.test.ts tools/processo/revisoes.test.ts`.

## Fora do escopo desta tarefa

A tabela de guardiões (13.0); o texto da regra 40 (15.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A exigência do RF17 chega ao commit pela conferência que o hook já injeta (`avaliarMutacoes`, que passa a receber os arquivos alterados da árvore, obrigatórios), e não dentro do `avaliarPortao` | `portao.ts` não importa `mutacoes.ts` (o tipo `ConferenciaDoDocumento` existe para isso), e o `avaliarPortao` não recebe o conteúdo do documento | `techspec.md` §5(d), "No código (9.0)"; `cenarios.md` RF17 |
| O carimbo ganha o campo `documento`: o documento que o portão da tarefa achou | Sem bloco, a linha `Sem mutação` não deixa rastro no carimbo, e "carimbo de outro portão não passa" não teria como ser provado | `techspec.md` §5(d); `cenarios.md` RF17 |
| O documento é achado pela alteração dele na árvore (o único documento de tarefa ou de correção alterado); com mais de um e sem o `.md` na linha de comando, nenhum | A marca da tarefa que a Tech Spec cita não existe antes do commit; achar por ter bloco deixava a tarefa de produção sem bloco fora da conferência | `techspec.md` §5(d); `cenarios.md` RF17 |
| A linha é alcançada quando algum bloco do mesmo arquivo a cita em qualquer linha do trecho, inclusive a de contexto | O `.where(and(` do exemplo do `executar-task` é contexto, e é ele que localiza a cláusula; só as linhas que saem deixariam a própria cláusula do exemplo como "não alcançada" | `techspec.md` §5(d) |

## Mutações

Cada cláusula que o diff acrescenta, com o teste que falha sem ela. O `ehArquivoDeProducao` (as quatro formas de não ser
produção), a linha `Sem mutação` (ausente, vazia, placeholder, as duas saídas), o `exigenciaDeMutacao` (cada
`return null`, o texto dos dois motivos, a lista de três), o `documentoDaTarefa`, o leitor do diff
(`linhasAcrescentadas`), os oito operadores de `condicoesDaLinha` (um bloco cada, além da cláusula do comentário), o
`linhasSemBloco` (cada termo do filtro, a ordenação, o mapa de blocos por arquivo), o `linhasNovasDaArvore` (o `HEAD`,
o `-U0`, o arquivo novo, a última linha vazia), o relatório, o `--faltando` como processo, o `avaliarMutacoes` e a
conferência sem bloco, a fiação do `portao()`, e as cláusulas do `portao-local.ts` (o `.md` pedido, o aviso sem
documento, a exigência só na tarefa, a lista do RF5, o `documento` no carimbo). Sem bloco, de propósito: o
`arquivo !== null` de `linhasAcrescentadas` (e o `?? null` do `if (novo)`, porque o arquivo apagado não tem linha `+`) e o `documento &&` do `portao-local.ts` são estreitamento de tipo, sem caminho
em que mudem o resultado; os `?? ''` e `?? null` de grupo de expressão regular são o fallback que o
`noUncheckedIndexedAccess` pede; e o pathspec `apps packages` do `git diff` só encurta a saída, porque o resultado é
filtrado por `ehArquivoDeProducao` depois.

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o arquivo configuração fora de src
- if (!/^(?:apps|packages)\/[^/]+\/src\//.test(arquivo)) return false
+ if (false) return false
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o arquivo declaração de tipos
- if (/\.d\.ts$/.test(arquivo)) return false
+ if (false) return false
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o arquivo teste de unidade em src
- if (/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(arquivo)) return false
+ if (false) return false
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o arquivo fixture em src
- return !/(?:^|\/)(?:test|tests|__tests__|__fixtures__)\//.test(arquivo)
+ return true
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a linha "Sem mutação" vale com motivo
- if (linhas.length === 0) return 'ausente'
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a linha "Sem mutação" vale com motivo
- return linhas.some((motivo) => motivo !== '' && !/^<[^>]*>$/.test(motivo)) ? 'motivo' : 'vazia'
+ return linhas.some((motivo) => !/^<[^>]*>$/.test(motivo)) ? 'motivo' : 'vazia'
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a linha "Sem mutação" vale com motivo
- return linhas.some((motivo) => motivo !== '' && !/^<[^>]*>$/.test(motivo)) ? 'motivo' : 'vazia'
+ return linhas.some((motivo) => motivo !== '') ? 'motivo' : 'vazia'
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a linha "Sem mutação" vale com motivo
- return linhas.some((motivo) => motivo !== '' && !/^<[^>]*>$/.test(motivo)) ? 'motivo' : 'vazia'
+ return linhas.some((motivo) => motivo !== '' && !/^<[^>]*>$/.test(motivo)) ? 'motivo' : 'motivo'
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a linha "Sem mutação" vale com motivo
- return linhas.some((motivo) => motivo !== '' && !/^<[^>]*>$/.test(motivo)) ? 'motivo' : 'vazia'
+ return linhas.some((motivo) => motivo !== '' && !/^<[^>]*>$/.test(motivo)) ? 'vazia' : 'vazia'
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › só teste, .d.ts, configuração fora de src ou documento
- if (producao.length === 0) return null
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a lista de arquivos cita os três primeiros
- const quais = `${producao.slice(0, 3).join(', ')}${producao.length > 3 ? ', …' : ''}`
+ const quais = `${producao.slice(0, 4).join(', ')}${producao.length > 3 ? ', …' : ''}`
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a lista de arquivos cita os três primeiros
- const quais = `${producao.slice(0, 3).join(', ')}${producao.length > 3 ? ', …' : ''}`
+ const quais = `${producao.slice(0, 3).join(', ')}${producao.length > 4 ? ', …' : ''}`
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a lista de arquivos cita os três primeiros
- const quais = `${producao.slice(0, 3).join(', ')}${producao.length > 3 ? ', …' : ''}`
+ const quais = `${producao.slice(0, 3).join(', ')}${producao.length > 2 ? ', …' : ''}`
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › sem o documento achado, a produção alterada fica vermelha
- if (conteudo === null) {
+ if (false) {
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › produção alterada: sem bloco nem linha, vermelho
- if (lerMutacoes(conteudo).mutacoes.length > 0) return null
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › produção alterada: sem bloco nem linha, vermelho
- if (declarada === 'motivo') return null
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › produção alterada: sem bloco nem linha, vermelho
- const falta = declarada === 'vazia' ? 'a linha "**Sem mutação:**" está sem motivo' : 'não há bloco de mutação nem a linha "**Sem mutação:** <motivo>"'
+ const falta = false ? 'a linha "**Sem mutação:**" está sem motivo' : 'não há bloco de mutação nem a linha "**Sem mutação:** <motivo>"'
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › produção alterada: sem bloco nem linha, vermelho
- const falta = declarada === 'vazia' ? 'a linha "**Sem mutação:**" está sem motivo' : 'não há bloco de mutação nem a linha "**Sem mutação:** <motivo>"'
+ const falta = true ? 'a linha "**Sem mutação:**" está sem motivo' : 'não há bloco de mutação nem a linha "**Sem mutação:** <motivo>"'
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o documento é achado pela alteração
- const candidatos = alterados.filter((arquivo) => /^tasks\/(?:prd-[^/]+\/\d+_task|correcoes\/[^/]+)\.md$/.test(arquivo))
+ const candidatos = alterados.filter((arquivo) => /^tasks\/(?:prd-[^/]+\/\d+_task)\.md$/.test(arquivo))
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o documento é achado pela alteração
- return candidatos.length === 1 ? (candidatos[0] ?? null) : null
+ return candidatos.length >= 1 ? (candidatos[0] ?? null) : null
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › lê do diff só as linhas acrescentadas
- if (linha.startsWith('diff --git ')) {
+ if (false) {
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › lê do diff só as linhas acrescentadas
- if (!noTrecho) {
+ if (true) {
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › lê do diff só as linhas acrescentadas
- if (noTrecho && arquivo !== null && linha.startsWith('+')) {
+ if (arquivo !== null && linha.startsWith('+')) {
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › lê do diff só as linhas acrescentadas
- if (noTrecho && arquivo !== null && linha.startsWith('+')) {
+ if (noTrecho && arquivo !== null) {
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › lê do diff só as linhas acrescentadas
 linhas.push({ arquivo, linha: numero, texto: linha.slice(1) })
- numero += 1
+ numero += 0
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › lê do diff só as linhas acrescentadas
- numero = Number(cabecalho[1])
+ numero = 0
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › texto entre aspas não é condição
- .replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, "''")
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › comentário no fim não é condição
 .replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, "''")
- .replace(/\s\/\/.*$/, '')
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o operador expressão regular é achado na linha
- const EXPRESSAO_REGULAR = /(?:^|[(,=:[!&|?{};]|\breturn\b)\s*\/(?![/*])(?:[^/\\\n[]|\\.|\[(?:[^\]\\\n]|\\.)*\])+\/[dgimsuvy]*|\bnew RegExp\(/
+ const EXPRESSAO_REGULAR = /(?:^|[(,=:[!&|?{};]|\breturn\b)\s*\/(?![/*])(?:[^/\\\n[]|\\.|\[(?:[^\]\\\n]|\\.)*\])+\/[dgimsuvy]*/
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o operador expressão regular é achado na linha
- const EXPRESSAO_REGULAR = /(?:^|[(,=:[!&|?{};]|\breturn\b)\s*\/(?![/*])(?:[^/\\\n[]|\\.|\[(?:[^\]\\\n]|\\.)*\])+\/[dgimsuvy]*|\bnew RegExp\(/
+ const EXPRESSAO_REGULAR = /(?:^|[(,=:[!&|?{};])\s*\/(?![/*])(?:[^/\\\n[]|\\.|\[(?:[^\]\\\n]|\\.)*\])+\/[dgimsuvy]*|\bnew RegExp\(/
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o operador if é achado na linha
- { nome: 'if', acha: (codigo) => /\bif\s*\(/.test(codigo) },
+ { nome: 'if', acha: () => false },
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o operador e lógico é achado na linha
- { nome: '&&', acha: (codigo) => codigo.includes('&&') },
+ { nome: '&&', acha: () => false },
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o operador ou lógico é achado na linha
- { nome: '||', acha: (codigo) => codigo.includes('||') },
+ { nome: '||', acha: () => false },
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o operador coalescência é achado na linha
- { nome: '??', acha: (codigo) => codigo.includes('??') },
+ { nome: '??', acha: () => false },
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o operador ternário é achado na linha
- { nome: '?:', acha: (codigo) => /(?:^|\s)\?(?=\s|$)/.test(codigo) },
+ { nome: '?:', acha: () => false },
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o operador case é achado na linha
- { nome: 'case', acha: (codigo) => /^case\b/.test(codigo) },
+ { nome: 'case', acha: () => false },
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o operador where é achado na linha
- { nome: '.where(', acha: (codigo) => codigo.includes('.where(') },
+ { nome: '.where(', acha: () => false },
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o operador expressão regular é achado na linha
- { nome: 'regex', acha: (_codigo, inteiro) => EXPRESSAO_REGULAR.test(inteiro) },
+ { nome: 'regex', acha: () => false },
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › comentário de linha inteira não é condição
- if (/^(?:\/\/|\/\*|\*)/.test(aparada)) return []
+ if (false) return []
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › dois blocos do mesmo arquivo alcançam
- const doArquivo = citadas.get(mutacao.arquivo) ?? new Set<string>()
+ const doArquivo = new Set<string>()
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › linha nova em teste, em .d.ts e fora de src não é listada
- .filter((nova) => ehArquivoDeProducao(nova.arquivo))
 .map((nova) => ({ ...nova, condicoes: condicoesDaLinha(nova.texto) }))
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › sem bloco, a linha com condição é listada
- .filter((nova) => nova.condicoes.length > 0 && !citadas.get(nova.arquivo)?.has(nova.texto.trim()))
+ .filter((nova) => nova.condicoes.length >= 0 && !citadas.get(nova.arquivo)?.has(nova.texto.trim()))
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a mesma linha citada por um bloco do mesmo arquivo
- .filter((nova) => nova.condicoes.length > 0 && !citadas.get(nova.arquivo)?.has(nova.texto.trim()))
+ .filter((nova) => nova.condicoes.length > 0)
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › sem bloco, a linha com condição é listada
- .filter((nova) => nova.condicoes.length > 0 && !citadas.get(nova.arquivo)?.has(nova.texto.trim()))
+ .filter((nova) => nova.condicoes.length > 0 && !citadas.get(nova.arquivo).has(nova.texto.trim()))
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a mesma linha citada por um bloco do mesmo arquivo
- .filter((nova) => nova.condicoes.length > 0 && !citadas.get(nova.arquivo)?.has(nova.texto.trim()))
+ .filter((nova) => nova.condicoes.length > 0 && !citadas.get(nova.arquivo)?.has(nova.texto))
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a lista sai por arquivo e por linha
- .sort((a, b) => (a.arquivo === b.arquivo ? a.linha - b.linha : a.arquivo < b.arquivo ? -1 : 1))
+ .sort((a, b) => (true ? a.linha - b.linha : a.arquivo < b.arquivo ? -1 : 1))
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a lista sai por arquivo e por linha
- .sort((a, b) => (a.arquivo === b.arquivo ? a.linha - b.linha : a.arquivo < b.arquivo ? -1 : 1))
+ .sort((a, b) => (a.arquivo === b.arquivo ? b.linha - a.linha : a.arquivo < b.arquivo ? -1 : 1))
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a lista sai por arquivo e por linha
- .sort((a, b) => (a.arquivo === b.arquivo ? a.linha - b.linha : a.arquivo < b.arquivo ? -1 : 1))
+ .sort((a, b) => (a.arquivo === b.arquivo ? a.linha - b.linha : a.arquivo < b.arquivo ? 1 : -1))
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › lê o diff dos versionados e as linhas dos arquivos novos
- const novas = linhasAcrescentadas(git('diff', '-U0', '--no-color', '--no-ext-diff', '--no-renames', 'HEAD', '--', 'apps', 'packages'))
+ const novas = linhasAcrescentadas(git('diff', '-U0', '--no-color', '--no-ext-diff', '--no-renames', '--', 'apps', 'packages'))
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › lê o diff dos versionados e as linhas dos arquivos novos
- const novas = linhasAcrescentadas(git('diff', '-U0', '--no-color', '--no-ext-diff', '--no-renames', 'HEAD', '--', 'apps', 'packages'))
+ const novas = linhasAcrescentadas(git('diff', '--no-color', '--no-ext-diff', '--no-renames', 'HEAD', '--', 'apps', 'packages'))
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › lê o diff dos versionados e as linhas dos arquivos novos
- if (arquivo === '') continue
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › lê o diff dos versionados e as linhas dos arquivos novos
- if (linhas.at(-1) === '') linhas.pop()
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › lê o diff dos versionados e as linhas dos arquivos novos
- return novas.filter((nova) => ehArquivoDeProducao(nova.arquivo))
+ return novas
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o relatório lista arquivo, linha, operador e texto
- if (faltando.length === 0) return `Nenhuma linha nova de produção com condição fica sem bloco em ${documento}.\n`
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o relatório lista arquivo, linha, operador e texto
- const linhas = faltando.map((nova) => `  ${nova.arquivo}:${String(nova.linha)}  [${nova.condicoes.join(' ')}]  ${nova.texto.trim()}`)
+ const linhas = faltando.map((nova) => `  ${nova.arquivo}:${String(nova.linha)}  [${nova.condicoes.join(',')}]  ${nova.texto.trim()}`)
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › importado por outro script, o módulo não roda o --faltando
- if (process.argv[2] === '--faltando' && resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
+ if (process.argv[2] === '--faltando') {
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › rodado sem --faltando, o módulo não faz nada
- if (process.argv[2] === '--faltando' && resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
+ if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › sem o documento, o uso sai 2
- if (!documento) {
+ if (false) {
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › lista o que nenhum bloco alcança e sai 0
- const raizDaArvore = process.env['CLAUDE_PROJECT_DIR'] ?? process.cwd()
+ const raizDaArvore = process.env['CLAUDE_PROJECT_DIR'] ?? '/'
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › sem o documento, o uso sai 2; documento que não existe
- process.stdout.write(`não foi possível listar as linhas sem bloco (${(erro as Error).message})\n`)
+ void erro
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › bloco malformado bloqueia mesmo com carimbo, e documento sem bloco não é cobrado
- if (mutacoes.length === 0) return avaliarSemBloco(carimbo?.documento, documento, conteudo, alterados, comando)
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o commit: produção sem bloco nem linha é recusada
- if (exigencia !== null) return `portão local: ${exigencia}`
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o commit sem produção não cobra bloco, linha nem carimbo do documento
- if (!alterados.some(ehArquivoDeProducao) || documentoDoCarimbo === documento) return null
+ if (documentoDoCarimbo === documento) return null
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o commit: produção sem bloco nem linha é recusada
- if (!alterados.some(ehArquivoDeProducao) || documentoDoCarimbo === documento) return null
+ if (!alterados.some(ehArquivoDeProducao) || false) return null
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o commit: produção sem bloco nem linha é recusada
- if (!alterados.some(ehArquivoDeProducao) || documentoDoCarimbo === documento) return null
+ if (!alterados.some(ehArquivoDeProducao) || true) return null
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › o commit com código de produto sem bloco de mutação nem a linha
- const aMais = conferencia(lerCarimbo(raiz), caminho, conteudo, arquivos)
+ const aMais = conferencia(lerCarimbo(raiz), caminho, conteudo, [])
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/processo/revisoes.test.ts › o portão da tarefa, rodado como processo, fica vermelho com produção sem bloco nem linha
- if (daTarefa && documento === null) process.stdout.write('\n▶ nenhum documento de tarefa achado (ou mais de um alterado): as mutações não serão conferidas. Passe o documento para conferi-las.\n')
+ if (documento === null) process.stdout.write('\n▶ nenhum documento de tarefa achado (ou mais de um alterado): as mutações não serão conferidas. Passe o documento para conferi-las.\n')
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/processo/revisoes.test.ts › o portão da tarefa, rodado como processo, fica vermelho com produção sem bloco nem linha
- if (daTarefa && documento === null) process.stdout.write('\n▶ nenhum documento de tarefa achado (ou mais de um alterado): as mutações não serão conferidas. Passe o documento para conferi-las.\n')
+ if (daTarefa && true) process.stdout.write('\n▶ nenhum documento de tarefa achado (ou mais de um alterado): as mutações não serão conferidas. Passe o documento para conferi-las.\n')
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/processo/revisoes.test.ts › o portão da tarefa, rodado como processo, fica vermelho com produção sem bloco nem linha
- const semMutacao = daTarefa ? exigenciaDeMutacao(arquivosAlterados(raiz), textoDoDocumento) : null
+ const semMutacao = exigenciaDeMutacao(arquivosAlterados(raiz), textoDoDocumento)
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/processo/revisoes.test.ts › o portão da tarefa, rodado como processo, fica vermelho com produção sem bloco nem linha
- if (semMutacao !== null) {
+ if (false) {
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/processo/revisoes.test.ts › o portão da tarefa, rodado como processo, fica vermelho com produção sem bloco nem linha
- if (documento && textoDoDocumento !== null) {
+ if (false) {
 process.stdout.write(`\n${relatorioDoFaltando(linhasSemBloco(linhasNovasDaArvore(raiz), lerMutacoes(textoDoDocumento).mutacoes), documento)}`)
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/processo/revisoes.test.ts › o portão da tarefa, rodado como processo, fica vermelho com produção sem bloco nem linha
- daTarefa ? { inicio, suites, alvos: todosOsAlvos, ...(documento ? { documento } : {}), ...(carimboDasMutacoes ? { mutacoes: carimboDasMutacoes } : {}) } : { inicio, suites },
+ daTarefa ? { inicio, suites, alvos: todosOsAlvos, ...(carimboDasMutacoes ? { mutacoes: carimboDasMutacoes } : {}) } : { inicio, suites },
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › a linha "Sem mutação" vale com motivo
- const linhas = [...conteudo.matchAll(/^\*\*Sem mutação:\*\*[ \t]*(.*?)[ \t]*$/gm)].map((achado) => achado[1] ?? '')
+ const linhas = [...conteudo.matchAll(/\*\*Sem mutação:\*\*[ \t]*(.*?)[ \t]*$/gm)].map((achado) => achado[1] ?? '')
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/processo/revisoes.test.ts › o conferir e o revisores veem a produção sem bloco como o hook vê
- (documento === '--completo' ? null : avaliarMutacoes(lerCarimbo(raiz), documento, readFileSync(join(raiz, documento), 'utf8'), arquivosAlterados(raiz)))
+ (documento === '--completo' ? null : avaliarMutacoes(lerCarimbo(raiz), documento, readFileSync(join(raiz, documento), 'utf8'), []))
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/processo/revisoes.test.ts › o conferir e o revisores veem a produção sem bloco como o hook vê
- const mutacoes = avaliarMutacoes(lerCarimbo(raiz), documento, conteudo, arquivosAlterados(raiz))
+ const mutacoes = avaliarMutacoes(lerCarimbo(raiz), documento, conteudo, [])
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › lê do diff só as linhas acrescentadas
- if (novo) arquivo = novo[1] ?? null
+ if (true) arquivo = novo[1] ?? null
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › lê do diff só as linhas acrescentadas
- if (cabecalho) {
+ if (false) {
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › o arquivo de nome entre aspas
- arquivo = null
```

```mutacao
arquivo: tools/processo/mutacoes.ts
teste: tools/processo/mutacoes.test.ts › lê do diff só as linhas acrescentadas
 if (linha.startsWith('diff --git ')) {
- noTrecho = false
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/processo/revisoes.test.ts › o conferir e o revisores veem a produção sem bloco como o hook vê
- const pedido = argumentos.find((argumento) => argumento.endsWith('.md') && existsSync(resolve(raiz, argumento)))
+ const pedido = argumentos.find((argumento) => argumento.endsWith('.md') && existsSync(join(raiz, argumento)))
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/processo/revisoes.test.ts › o conferir e o revisores veem a produção sem bloco como o hook vê
- if (pedido) return relative(raiz, resolve(raiz, pedido))
+ if (pedido) return pedido
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral, 1ª | A `EXPRESSAO_REGULAR` dá falso positivo em JSX (`<Foo a={x}/><Bar/>` casa como expressão regular) | `TODO.md`: muda a heurística do operador `regex` e o contrato do que `--faltando` lista; a saída só informa e nenhum bloqueio depende dela |
| revisor-geral, 1ª | Avisar no `/corrigir` (17.0/18.0) que, com o documento da tarefa e o da correção alterados juntos, o portão pede o `.md` explicitamente | Tarefas 17.0/18.0, que tocam o `/corrigir`; esta tarefa não toca o arquivo |
| revisor-geral, 2ª | Acrescentar ao `cenarios.md` (RF17) as três decisões que só estão na Tech Spec §5(d): a linha `Sem mutação` em bloco cercado conta; a regra citada no meio da frase vale `ausente`; o caminho do `.md` é normalizado | `TODO.md`: documento de cenários, sem efeito em código; a Tech Spec §5(d) e os testes já registram as três |
| revisor-geral, 2ª | Um `.md` absoluto fora da raiz chega ao carimbo como `../…`: recusar ou avisar | `TODO.md`: "hoje não há quem chame o portão assim" |
| test-engineer, 2ª | Bloco que apague a linha inteira `if (pedido) return relative(raiz, resolve(raiz, pedido))`, para prova direta de que o pedido vence | Recusada: a cláusula já é provada pelo bloco `resolve`→`join` e pelo bloco `relative`→`pedido`, como o próprio revisor registra |
| test-engineer, 2ª | No teste novo de `conferir`/`revisores`, com a linha presente, asserir também o `status` de `revisores` | `TODO.md`: o `not.toMatch` já prova o que importa (a mensagem do RF17 não aparece); o `status` ali vem dos revisores que faltam |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 16:56:42 | 2026-10-23 16:58:23 | `revisor-geral` | 1 | APROVADO | a8a47b21f7559b31f |
| 2026-10-23 16:56:41 | 2026-10-23 17:00:35 | `test-engineer` | 1 | REPROVADO | abe10e9e2d0c34838 |
| 2026-10-23 17:13:46 | 2026-10-23 17:14:18 | `revisor-geral` | 2 | APROVADO | aec964aeba5cb6495 |
| 2026-10-23 17:13:41 | 2026-10-23 17:15:03 | `test-engineer` | 2 | APROVADO | a478d356ae8e0774d |
