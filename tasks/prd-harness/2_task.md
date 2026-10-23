# Tarefa 2.0 — O `revisoes.ts` partido por responsabilidade, sem mudar comportamento

**Funcionalidade:** harness (X7) · **Depende de:** 1.0
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

O `revisoes.ts` de 1.263 linhas vira quatro módulos com uma responsabilidade cada, e o `revisoes.ts` só reexporta; o
`estado.ts` e o `esteira.ts` deixam de importá-lo. Nada muda de comportamento: é a base das tarefas 9.0 a 14.0, que
mudam a decisão do commit e precisam dela num lugar só.

## Contexto necessário

- `techspec.md` §2 (linha do `revisoes.ts`) e §5(a) (`decidirCommit` vai para `portao.ts`, na 10.0, não aqui)
- `prd.md` RF13
- `cenarios.md` seção B, **RF13**
- Código: `tools/processo/revisoes.ts` inteiro. A divisão:
  - `documento-de-revisao.ts`: veredito, rodada, seção Revisões, achados e índice (`describe` "veredito e tarefa do
    revisor", "seção Revisões", "achados separados por documento, com índice")
  - `caducidade.ts`: o que conta como alteração depois do portão e da rodada, comentário, merge em curso
  - `comando-git.ts`: ler do comando o commit, os arquivos, a árvore (`-C`, `cd`), o push do time
  - `portao.ts`: `avaliarPortao`, `portao`, `PASTAS_DE_CODIGO`, `PAPEIS_DO_TIME`
- Quem importa `revisoes.ts` hoje: `grep -rn "from './revisoes.ts'" tools/`

## Subtarefas

- [x] 2.1 — Mover cada função e constante para o módulo dela, sem alterar corpo; `revisoes.ts` só reexporta
- [x] 2.2 — `estado.ts` e `esteira.ts` importam do módulo novo, não do `revisoes.ts`
- [x] 2.3 — `tools/processo/harness/particao.test.ts`: lê os imports de `estado.ts` e `esteira.ts` e acusa
  `./revisoes.ts`
- [x] 2.4 — Testes: os atuais verdes **sem alteração** (o diff não toca `hook-portao.test.ts`; no `revisoes.test.ts`, só o
  caso "sem o compilador instalado" muda, e só o arquivo que ele copia e importa: `caducidade.ts` no lugar de `revisoes.ts`,
  com as asserções iguais; decisão do Joaquim, 23/10/2026, `prd.md` RF13)

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/revisoes.ts` | alterado (só reexporta) |
| `tools/processo/documento-de-revisao.ts` | novo |
| `tools/processo/caducidade.ts` | novo |
| `tools/processo/comando-git.ts` | novo |
| `tools/processo/portao.ts` | novo |
| `tools/processo/estado.ts` | alterado (import) |
| `tools/processo/esteira.ts` | alterado (import) |
| `tools/processo/hook-revisoes.ts` | alterado, se importar algo movido |
| `tools/processo/harness/particao.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| `revisoes.test.ts`, `hook-portao.test.ts`, `estado.test.ts`, `esteira.test.ts`, `linhas.test.ts` sem alteração, salvo o arquivo copiado no caso "sem o compilador instalado" (2.4) | unidade | o comportamento não mudou |
| `estado.ts` com `import … from './revisoes.ts'` numa cópia | unidade | vermelho |
| quem contorna é acusado: `import('./revisoes.ts')` e `export … from './revisoes.ts'` | unidade | vermelho, um caso por forma |
| a guarda reprova quando o alvo dela não existe: `estado.ts` ausente na amostra | unidade | vermelho |
| o hook carrega: `hook-portao.test.ts › o hook do portão que não carrega bloqueia o Bash › hook são, Bash comum: sai 0 e não diz nada no stdout` | unidade | o comando real do `settings.json` continua de pé |

## Como testar

- Mova com o mínimo de edição: cortar e colar, e ajustar import. Diff de corpo de função é sinal de que mudou
  comportamento.
- Precedente da leitura de import: `tools/guardas/guardas.test.ts`, que lê arquivo e acusa por forma; aqui basta ler o
  texto dos dois arquivos com `readFileSync` e uma expressão por forma.
- Rodar: `npx vitest run --project unidade tools/processo/` (todos os testes do processo, que é o que prova a mudança).
- Armadilha: o hook roda **esta árvore** a cada Bash. Se ele quebrar no meio, conserte pelo Edit (não passa pelo hook),
  ou peça o socorro ao Joaquim (`techspec.md` §5c).

## Fora do escopo desta tarefa

`decidirCommit` (10.0); qualquer mudança de regra; o `separar-achados.ts`.

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O caso `revisoes.test.ts › a impressão sem comentários › sem o compilador instalado (antes do npm ci), não se aplica` copia e importa o `caducidade.ts`, e não o `revisoes.ts`; as asserções são as mesmas | O `revisoes.ts` que só reexporta não carrega sozinho numa pasta fora do repositório (os módulos que ele reexporta não estão lá); a função mora no `caducidade.ts`, que não importa nenhum outro `.ts`. Decisão do Joaquim, opção A (23/10/2026), aplicada pelo Arquiteto em `67dad69` | `prd.md` RF13; `cenarios.md` B, RF13; subtarefa 2.4 desta tarefa |
| `PAPEIS_DO_TIME` e `BRANCHES_PROTEGIDAS` são definidos no `comando-git.ts`, onde o `pushDoTime` os lê, e o `portao.ts` reexporta `PAPEIS_DO_TIME` | Definidos no `portao.ts`, o `comando-git.ts` precisaria importá-lo e o `portao.ts` importa o `comando-git.ts`: um ciclo. Quem importa `PAPEIS_DO_TIME` do `portao.ts` (ou do `revisoes.ts`) continua achando | "Contexto necessário" desta tarefa (a divisão); `techspec.md` §5(a), que só cita o nome |
| A divisão parte do `revisoes.ts` que a correção `complexidade-revisoes` deixou (`df55c2f`): cada auxiliar novo dela vai para o módulo de quem o chama (`corpoDaSecao` e `lerOCorpoDaSecao` para o `documento-de-revisao.ts`; `levarOsDoAdd`, `levarTodosSeCommitA` e `variaveisECaminhosDosTrechos` para o `comando-git.ts`; os três `bloqueio…` para o `portao.ts`), sem supressão nova, e dois deles mudam de nome: `levarOQueOAddPrepara` vira `levarOsDoAdd` e `levarOQueOCommitDaTodos` vira `levarTodosSeCommitA` | A catraca barra supressão em arquivo novo (`tools/guardas/catraca.test.ts`), e a complexidade das quatro funções movidas só cabia abaixo de 10 antes da partição (opção A, triada pelo Arquiteto). Os nomes são a recomendação do `revisor-geral` (1ª rodada da correção), adiada para esta tarefa porque os auxiliares mudam de módulo nela; os dois são privados e nenhum teste os cita | `techspec.md` §2 (linha do `revisoes.ts`, `0ed2f7d`); `tasks/correcoes/complexidade-revisoes.md`, "Recomendações sem aplicar" |

## Mutações

Nota: o movimento de código não leva mutação própria, porque os quatro módulos são o corpo do `revisoes.ts` de antes,
com a mesma lógica; só mudam o `export` de cinco auxiliares que passam a cruzar módulos e os dois nomes da divergência
acima. As mutações desta tarefa são as dos blocos abaixo, das guardas e dos auxiliares que a correção
`complexidade-revisoes` criou.

Os blocos abaixo são de três grupos. Primeiro, a guarda nova, o `particao.test.ts`: os dois imports do `estado.ts` e o do
`esteira.ts` voltando para o `revisoes.ts`, e cada cláusula da leitura dos imports. Depois, quatro blocos que o
`test-engineer` pediu à correção `complexidade-revisoes`, um por auxiliar que a correção criou e a partição move
(`corpoDaSecao`, `levarOsDoAdd`, o ramo `estranho` de `bloqueioAntesDaArvore` e o ramo `(mvp: …)` de
`bloqueioDoCommitSemDocumento`). Em `corpoDaSecao`, o `break` no próximo cabeçalho e o `break` da linha em branco
sobrevivem a qualquer teste de hoje: são cláusulas herdadas, que a partição não toca, e ficam em "Recomendações sem aplicar".

```mutacao
arquivo: tools/processo/estado.ts
teste: tools/processo/harness/particao.test.ts › os arquivos de hoje passam, e a conferência lê os imports que espera
- import { arquivosAlterados, DOCUMENTO_QUE_UMA_SUITE_LE } from './caducidade.ts'
+ import { arquivosAlterados, DOCUMENTO_QUE_UMA_SUITE_LE } from './revisoes.ts'
```

```mutacao
arquivo: tools/processo/estado.ts
teste: tools/processo/harness/particao.test.ts › os arquivos de hoje passam, e a conferência lê os imports que espera
- import { lerRevisoes, REVISORES_COM_VETO, revisoresObrigatorios, type Revisao } from './documento-de-revisao.ts'
+ import { lerRevisoes, REVISORES_COM_VETO, revisoresObrigatorios, type Revisao } from './revisoes.ts'
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/harness/particao.test.ts › os arquivos de hoje passam, e a conferência lê os imports que espera
- import { DOCUMENTO_QUE_UMA_SUITE_LE } from './caducidade.ts'
+ import { DOCUMENTO_QUE_UMA_SUITE_LE } from './revisoes.ts'
```

```mutacao
arquivo: tools/processo/harness/particao.test.ts
teste: tools/processo/harness/particao.test.ts › quem contorna é acusado: tools/processo/estado.ts: por outra pasta
- if (valor !== null && valor.startsWith('.')) caminhos.push(valor)
+ if (valor !== null && valor.startsWith('./')) caminhos.push(valor)
```

```mutacao
arquivo: tools/processo/harness/particao.test.ts
teste: tools/processo/harness/particao.test.ts › quem contorna é acusado: tools/processo/estado.ts: import.. com texto de template
- no !== undefined && (ts.isStringLiteral(no) || ts.isNoSubstitutionTemplateLiteral(no)) ? no.text : null
+ no !== undefined && ts.isStringLiteral(no) ? no.text : null
```

```mutacao
arquivo: tools/processo/harness/particao.test.ts
teste: tools/processo/harness/particao.test.ts › quem contorna é acusado: tools/processo/estado.ts: por outra pasta
- const resolvido = (alvo: string, caminho: string): string => posix.normalize(posix.join(posix.dirname(alvo), caminho)).replace(/\.[cm]?[tj]s$/, '')
+ const resolvido = (alvo: string, caminho: string): string => posix.normalize(caminho).replace(/\.[cm]?[tj]s$/, '')
```

```mutacao
arquivo: tools/processo/harness/particao.test.ts
teste: tools/processo/harness/particao.test.ts › o alvo que não existe
- falhas.push(`alvo ausente: ${alvo}`)
```

```mutacao
arquivo: tools/processo/harness/particao.test.ts
teste: tools/processo/harness/particao.test.ts › o alvo que a conferência lê como vazio
- if (importados < MINIMO_DE_IMPORTS[alvo]) falhas.push(`${alvo}: a conferência leu ${String(importados)} imports, e espera ao menos ${String(MINIMO_DE_IMPORTS[alvo])}`)
```

```mutacao
arquivo: tools/processo/harness/particao.test.ts
teste: tools/processo/harness/particao.test.ts › cada forma de import conta: import de tipo
- if (ts.isImportDeclaration(no) || ts.isImportTypeNode(no)) return true
+ if (ts.isImportTypeNode(no)) return true
```

```mutacao
arquivo: tools/processo/harness/particao.test.ts
teste: tools/processo/harness/particao.test.ts › cada forma de import conta: tipo de import
- if (ts.isImportDeclaration(no) || ts.isImportTypeNode(no)) return true
+ if (ts.isImportDeclaration(no)) return true
```

```mutacao
arquivo: tools/processo/harness/particao.test.ts
teste: tools/processo/harness/particao.test.ts › cada forma de import conta: reexportação nomeada
- if (ts.isExportDeclaration(no)) return no.moduleSpecifier !== undefined
+ if (ts.isExportDeclaration(no)) return false
```

```mutacao
arquivo: tools/processo/harness/particao.test.ts
teste: tools/processo/harness/particao.test.ts › cada forma de import conta: import = require
- if (ts.isImportEqualsDeclaration(no)) return ts.isExternalModuleReference(no.moduleReference)
+ if (ts.isImportEqualsDeclaration(no)) return false
```

```mutacao
arquivo: tools/processo/harness/particao.test.ts
teste: tools/processo/harness/particao.test.ts › cada forma de import conta: require
- no.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(no.expression) && no.expression.text === 'require')
+ no.expression.kind === ts.SyntaxKind.ImportKeyword
```

```mutacao
arquivo: tools/processo/harness/particao.test.ts
teste: tools/processo/harness/particao.test.ts › cada forma de import conta: o caminho numa variável
- no.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(no.expression) && no.expression.text === 'require')
+ ts.isIdentifier(no.expression) && no.expression.text === 'require'
```

```mutacao
arquivo: tools/processo/documento-de-revisao.ts
teste: tools/processo/revisoes.test.ts › o bloqueante vence a recomendação
- for (const proxima of linhas.slice(inicio + 1)) {
+ for (const proxima of linhas.slice(inicio)) {
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › lê do comando os arquivos que o commit leva
- const relativo = token.startsWith(`${raiz}/`) ? token.slice(raiz.length + 1) : token.replace(/^\.\//, '')
+ const relativo = token.replace(/^\.\//, '')
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › o comando do commit não faz mais nada antes dele
- if (estranho !== null) {
+ if (estranho === 'nunca') {
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › passa sem documento de tarefa e sem revisor
- if (marcadorDoMvp(comando) !== null) {
+ if (marcadorDoMvp(comando) === 'nunca') {
```

O último grupo é o do caso que prova que o `revisoes.ts` só reexporta (ordem de correção da 1ª rodada, item 1).

```mutacao
arquivo: tools/processo/harness/particao.test.ts
teste: tools/processo/harness/particao.test.ts › o que é colado no revisoes.ts é acusado: reexportação nomeada
- ts.isExportDeclaration(comando) && comando.exportClause === undefined && !comando.isTypeOnly
+ ts.isExportDeclaration(comando) && !comando.isTypeOnly
```

```mutacao
arquivo: tools/processo/harness/particao.test.ts
teste: tools/processo/harness/particao.test.ts › o que é colado no revisoes.ts é acusado: reexportação só de tipo
- ts.isExportDeclaration(comando) && comando.exportClause === undefined && !comando.isTypeOnly
+ ts.isExportDeclaration(comando) && comando.exportClause === undefined
```

```mutacao
arquivo: tools/processo/harness/particao.test.ts
teste: tools/processo/harness/particao.test.ts › o que é colado no revisoes.ts é acusado: função
- ts.isExportDeclaration(comando) && comando.exportClause === undefined && !comando.isTypeOnly
+ comando.exportClause === undefined && !comando.isTypeOnly
```

```mutacao
arquivo: tools/processo/harness/particao.test.ts
teste: tools/processo/harness/particao.test.ts › o arquivo que não existe: vermelho
- if (texto === null) return [`alvo ausente: ${REVISOES}`]
```

```mutacao
arquivo: tools/processo/harness/particao.test.ts
teste: tools/processo/harness/particao.test.ts › o que é colado no revisoes.ts é acusado: chamada solta
-     else falhas.push(`${REVISOES} tem ${ts.SyntaxKind[comando.kind]} na linha ${String(fonte.getLineAndCharacterOfPosition(comando.getStart(fonte)).line + 1)}: ele só reexporta`)
```

```mutacao
arquivo: tools/processo/harness/particao.test.ts
teste: tools/processo/harness/particao.test.ts › o que é colado no revisoes.ts é acusado: interface
- else falhas.push(`${REVISOES} tem ${ts.SyntaxKind[comando.kind]} na linha ${String(fonte.getLineAndCharacterOfPosition(comando.getStart(fonte)).line + 1)}: ele só reexporta`)
+ else falhas.push(`${REVISOES} tem ${ts.SyntaxKind[comando.kind]} na linha ${String(fonte.getLineAndCharacterOfPosition(comando.getStart(fonte)).line + 2)}: ele só reexporta`)
```

```mutacao
arquivo: tools/processo/harness/particao.test.ts
teste: tools/processo/harness/particao.test.ts › de um módulo que sumiu: vermelho
- for (const modulo of REEXPORTADOS.filter((achado) => !reexportados.includes(achado))) falhas.push(`${REVISOES} não reexporta ${modulo}`)
```

```mutacao
arquivo: tools/processo/harness/particao.test.ts
teste: tools/processo/harness/particao.test.ts › o arquivo de hoje passa
- if (ehReexportacaoDeTudo(comando)) reexportados.push(textoDe(comando.moduleSpecifier) ?? '')
+ if (ehReexportacaoDeTudo(comando)) reexportados.push('')
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª, correção `complexidade-revisoes`) | `portao` chama `pastaDoCommit` duas vezes (`bloqueioAntesDaArvore` e `arvoreDoCommit`); passar o resultado adiante | Recusada nesta tarefa: `arvoreDoCommit(comando, raiz, cwd)` é exportada e o `revisoes.test.ts` a chama com essa assinatura (e o diff não toca os testes além do caso da 2.4); mudar a estrutura de chamada é mudança de comportamento observável por teste, e a tarefa só move. Fica para uma correção própria se o Joaquim quiser |
| esta tarefa (anotação) | Em `corpoDaSecao`, o `break` no próximo cabeçalho (`CABECALHO_DE_SECAO.test(proxima)`) e o `break` da linha em branco (`!ITEM.test(corpo[0] ?? '')`) sobrevivem à mutação: nenhum teste de hoje fica vermelho sem eles | Cláusulas herdadas do `revisoes.ts` de antes (a correção só as separou numa função); falta um teste de seção vazia seguida de outra seção, e de parágrafo solto seguido de linha em branco. Fora do escopo de uma tarefa que só move |
| revisor-geral (1ª) | Os comentários de `tools/ci/etapas-de-guarda.ts:119`, `tools/ci/e2e-que-cita-literal.ts:4` e `tools/processo/sequencia-do-portao.ts:80` apontam para o `revisoes.ts`; "o nome certo agora é `portao.ts`" | `TODO.md`, seção "Da X7 (harness), fora dela": são arquivos que a tarefa não toca (`Arquivos previstos`), e os comentários continuam certos pela reexportação |
| revisor-geral (1ª) | Uma linha na `techspec.md` §2 (linha do `revisoes.ts`) dizendo que `PAPEIS_DO_TIME` e `BRANCHES_PROTEGIDAS` ficam no `comando-git.ts`, para as tarefas 9.0 a 14.0 não procurarem a constante no `portao.ts` | Arquiteto, na retro da X7: a `techspec.md` não é arquivo da tarefa nem do Implementador. A divergência já está registrada em "Divergências resolvidas nesta tarefa"; também no `TODO.md` |
| test-engineer (1ª) | `hook-portao.test.ts:84` quebra só o `revisoes.ts`; erro de sintaxe no `portao.ts` ou no `comando-git.ts` também derruba o hook e nenhum teste o exercita: um caso por módulo | Tarefa 10.0, que altera `hook-portao.test.ts`, `portao.ts` e `comando-git.ts`. Nesta, o enunciado proíbe tocar o `hook-portao.test.ts` (subtarefa 2.4); também no `TODO.md` |
| test-engineer (1ª) | `MINIMO_DE_IMPORTS` é 3 e 1, contra 5 e 2 imports reais; "apagar um import real não acende nada"; pode ficar mais justo | Recusada: o mínimo é a trava contra o leitor que lê zero import (o caso "o alvo que a conferência lê como vazio"), e o próprio revisor o chama de aceitável. Igualar ao número real faria a guarda ficar vermelha numa limpeza de import legítima, sem que `./revisoes.ts` volte |
| test-engineer (1ª) | Os dois `break` de `corpoDaSecao` que sobrevivem à mutação precisam de teste de seção vazia seguida de outra seção e de parágrafo seguido de linha em branco | Já está acima (anotação desta tarefa): correção própria, fora do escopo de uma tarefa que só move; também no `TODO.md` |
| revisor-geral (2ª) | `particao.test.ts:196`: a linha que monta a mensagem de falha passa de 150 colunas e é citada literalmente em dois blocos de mutação; extrair o número da linha para uma constante local | Recusada: nenhum lint de largura de linha está ligado, e o arquivo já tem outras linhas desse tamanho (`particao.test.ts:95`, também citada em bloco de mutação). Mexer na linha reescreve os dois blocos sem mudar o que a guarda prova |
| revisor-geral (2ª) | `particao.test.ts:195`: o `?? ''` em `textoDe(comando.moduleSpecifier)` faz um `export * from` sem string literal sair como "não reexporta ./x.ts", e não como "comando inesperado" | Recusada: a guarda continua vermelha nesse caso, como o próprio revisor diz; só a mensagem fica menos clara |
| test-engineer (2ª) | Os blocos novos citam o teste por um trecho do nome ("o arquivo de hoje passa", "de um módulo que sumiu: vermelho", "o arquivo que não existe: vermelho"); citar o nome inteiro | `TODO.md`, junto da linha da 2.0: o portão casou os nomes, e trocar o texto de 5 blocos pede o portão de novo |
| test-engineer (2ª) | O teste "módulo que sumiu" só tira `./caducidade.ts`; se outro sair de `REEXPORTADOS`, nenhum teste fica vermelho: um `it.each` sobre os quatro módulos | `TODO.md`, junto da linha da 2.0: é dado de configuração, não cláusula, e o revisor a deixa como recomendação |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 16:01:36 | 2026-10-23 16:03:08 | `revisor-geral` | 1 | APROVADO | aceb0bef026d89a7a |
| 2026-10-23 16:01:34 | 2026-10-23 16:03:18 | `test-engineer` | 1 | APROVADO | ad52c6766756647c5 |
| 2026-10-23 16:14:45 | 2026-10-23 16:15:09 | `revisor-geral` | 2 | APROVADO | a00a7db2483cc6e90 |
| 2026-10-23 16:14:39 | 2026-10-23 16:15:20 | `test-engineer` | 2 | APROVADO | a3eaf812faf1b84c7 |
