# Tarefa 6.0 — Repository sem prova de escopo nem motivo reprova o teste

**Funcionalidade:** reengenharia · **Depende de:** nenhuma
**Subagentes obrigatórios:** `tenancy-guardian`, `test-engineer`, `revisor-geral`
**Porte:** pequeno

## Objetivo

Um teste por AST reprova o método público de repository que toca o banco sem prova de escopo, `@SemEscopo` com motivo
ou entrada na lista fechada.

## Contexto necessário

- `onda-1a.md` §2, "T6 — Trava de tenant"
- `techspec.md` §6; `prd.md` RF9
- Regra 10, itens 3, 5 e 9
- `packages/nucleo/src/db/sem-escopo.decorator.ts`: o limite de 30 é `TAMANHO_MINIMO_JUSTIFICATIVA_SEM_ESCOPO`
- `apps/api/src/assistente/time.service.ts:9`: o repository que mora num service

## Subtarefas

- [x] 6.1 — O analisador, com `PROVAS_DE_ESCOPO` e `REPOSITORIES_SEM_ESCOPO` (`{ arquivo, motivo, metodos }`)
- [x] 6.2 — A lista exata, por método e com evidência: os 9 da 7.0, os 3 da 8.0 e os seis da `onda-1a.md` T6
- [x] 6.3 — `SuspensoesDaEscolaRepository` sai de `time.service.ts` para um `*.repository.ts`
- [x] 6.4 — Testes: `repositories-com-escopo.test.ts`, com as fixtures em `tools/guardas/__fixtures__/repositories/`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/guardas/escopo-dos-repositories.ts` | novo |
| `tools/guardas/repositories-com-escopo.test.ts` | novo |
| `apps/api/src/assistente/suspensoes-da-escola.repository.ts` | novo |
| `apps/api/src/assistente/time.service.ts` | alterado |
| `tools/guardas/__fixtures__/repositories/` | novo |
| `tasks/prd-reengenharia/onda-1a.md` | alterado (T6: o que é público, o motivo estático e a lista fechada de 22) |

## Testes que provam a regra

Unidade, em `repositories-com-escopo.test.ts`.

| Cenário | O que prova | Mutação |
|---|---|---|
| Acha `sessao/alunos-ativos.repository.ts` e `fila/job-registro.repository.ts`; total > 0 | o glob enxerga o código | glob em pasta vazia |
| Todo método público real tem (a), (b) ou (c) | vale hoje | tirar o `exigir…` de `AlunosAtivosRepository.contar` |
| Fixture: toca `this.banco` sem prova | reprova, com arquivo e método | aceitar todo método |
| Fixture: `this.tx.execute(sql…)` sem prova | SQL cru também "toca o banco" | reconhecer só `.select/.insert/.update/.delete` |
| Fixture: `exigir…` em comentário ou string | prova é chamada | regex no texto |
| Fixture: função local com o mesmo nome | cópia local não vale | aceitar sem o import |
| Fixture: import com alias | alias conta (positivo) | só o identificador literal |
| Fixture: ajudante do mesmo arquivo | prova indireta passa | não seguir ajudante |
| Fixture: ajudante de outro arquivo | não conta | seguir import |
| Fixtures: só `identidadeDaRequisicao`; só `escopoDoJobNoContexto` | cada uma vale | tirar uma da lista |
| Fixture: motivo de 29 reprova, de 30 passa | a fronteira | `>= 30` vira `> 0` |
| Fixture: `@SemEscopo(MOTIVO)` e template | motivo literal | aceitar expressão |
| Fixture: `escolaId` por parâmetro | reprova | ignorar o parâmetro |
| Fixture: privado sem prova | só o público exige | exigir no privado |
| Fixture: propriedade arrow pública | não escapa | só `MethodDeclaration` |
| Fixture: público que não toca o banco | não exige | exigir em todo público |
| Fixture "chama e não usa" | o limite declarado: passa | nenhuma |
| Lista: método com prova | reprova | aceitá-lo |
| Lista: arquivo inexistente | reprova | ignorá-lo |
| Lista: método inexistente | reprova | ignorá-lo |
| Lista: método fora de `metodos`, sem prova | exceção por método | o arquivo todo |
| Lista: `motivo` de 29 caracteres | reprova | não medir |
| A lista real, por `toEqual` | não cresce calada | uma entrada a mais |
| Fixture: `XRepository` em `x.service.ts` | reprova | olhar só `*.repository.ts` |
| Real: nenhum `*Repository` fora de `*.repository.ts` | o de hoje sumiu | devolvê-lo a `time.service.ts` |
| Fixture com decorator e `satisfies`; erro de parse | parser da raiz; erro reprova | engolir o arquivo |

A 2.ª linha é o "remova e quebra" (regra 10.5). Sem concorrência nem log.

## Como testar

- AST: `tools/processo/revisoes.ts` (`carregarTypescript`, `impressaoSemComentarios`: `createSourceFile` e
  `parseDiagnostics`), só leitura. "Acha o conhecido": `apps/api/test/arquitetura.test.ts › a varredura enxerga o código:
  acha a própria classe dentro do módulo de sessão`
- Fixture com marca: `tools/guardas/guardas.test.ts` (`lerFixture`, `marcasDeViolacao`)
- Isolado: `npx vitest run --project unidade tools/guardas/repositories-com-escopo.test.ts`
- Armadilhas: varredura que passa vazia (a 1.ª linha); a prova (a) não vê o `where` (a 7.0 o cobre por mutação)

## Fora do escopo desta tarefa

Os 9 (7.0), as portas de IA (8.0) e o lint de tabela (9.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O motivo do `@SemEscopo` é **estático** (texto, template sem substituição, soma de textos ou `const` do mesmo arquivo), e não só literal | `material.repository` e `despacho.repository` já escrevem o motivo numa `const`, e `expurgo-de-jobs` e `expurgo-de-acesso`, numa soma; exigir literal os reprovaria sem ganho. Import, `let`, chamada e template com substituição reprovam | `onda-1a.md` §2, "T6 — Trava de tenant", prova (b) |
| "Método público" inclui a **função exportada do módulo** | `insercao-de-auditoria` e as três de `turma-do-professor` são funções, não métodos de classe; sem isso o teste não as enxergaria | `onda-1a.md` §2, T6, "O método público e o banco" |
| "Tocar o banco" é `this.<campo>` ou parâmetro de tipo do banco, e **repassar o banco a outro arquivo também é tocar** | o lado estrito: `TitularesRepository.homonimo` repassa `this.banco` a `haHomonimoDoTitular`, e a prova mora no outro arquivo, onde a análise não alcança; entra na lista com a evidência | `onda-1a.md` §2, T6, "O método público e o banco" |
| A lista fechada tem **22 arquivos**, não 18: entram `ops/operacao-privacidade`, `privacidade/titulares`, `titular/compartilhamento` e `assistente/turma-do-professor` | a leitura por método achou quatro que o desenho não citava; cada um com o motivo comprovado no código, e `ia/execucao` com os quatro métodos que recebem `execucao.escolaId` | `onda-1a.md` §2, T6, "A lista exata, por método, ficou fechada na 6.0" |

## Mutações

Cada cláusula do analisador e da leitura das pastas tem um bloco, 115 ao todo; a condição composta que não dava para
observar foi tirada do código, em vez de declarada. Seguem a ordem do arquivo: as provas e os tipos do banco, o que é método
público, o que é o banco, o motivo estático, a leitura do arquivo, o percurso do método, o decorator, o laço, a verificação da
lista e a leitura das pastas, e por fim as amarras do código real (a prova de `alunos-ativos` e a de
`suspensoes-da-escola`, o `XRepository` em `time.service.ts`, a entrada a mais e o motivo curto da lista). A proteção
contra ciclo entre ajudantes se prova trocando o `continue` por `throw`, porque o executor das mutações não tem prazo e
uma mutação que gira não terminaria. Tirar o termo `!entrada.endsWith('.ts')` faz a leitura das pastas reais lançar
`EISDIR` ao carregar a suíte, sem apontar caso; por isso o bloco troca o termo por `.tsx?`, que só o caso da pasta
temporária distingue.

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o alias de import conta: vale o nome exportado
-'identidadeDaRequisicao',
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › só identidadeDaRequisicao, ou só escopoDoJobNoContexto, valem cada uma
-'escopoDoJobNoContexto'])
+])
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o banco recebido por parâmetro também
-'exigirEscolaDoContexto',
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › SQL cru pela transação também toca o banco
-'TransacaoBanco',
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o banco recebido pelo tipo do executor de auditoria também
-, 'ExecutorDeAuditoria'
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › toca this.banco sem prova de escopo, com o arquivo e o método
-'Banco',
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a assinatura de sobrecarga não é método à parte: sobra um por nome
  function temCorpo(no: ts.FunctionLikeDeclaration): no is Chamavel {
-return no.body !== undefined
+return true
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o acessor get e o set são públicos
-ts.isGetAccessorDeclaration(elemento) ||
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o acessor get e o set são públicos
-ts.isSetAccessorDeclaration(elemento) ||
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a propriedade-função pública não escapa, de seta ou de function; a propriedade que não é
-|| ts.isPropertyDeclaration(elemento)
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a função exportada do módulo é ponto de entrada público, e a interna não
-(ts.getModifiers(no) ?? [])
+(ts.getModifiers(no))
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a função exportada do módulo é ponto de entrada público, e a interna não
-m.kind === ts.SyntaxKind.ExportKeyword
+m.kind === ts.SyntaxKind.AsyncKeyword
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a função exportada do módulo é ponto de entrada público, e a interna não
-if (ehExportado(declaracao)) exportadas.set(nome,
+if (true) exportadas.set(nome,
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a função exportada do módulo é ponto de entrada público, e a interna não
-if (ehExportado(declaracao)) exportadas.set(variavel.name.text,
+if (true) exportadas.set(variavel.name.text,
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a propriedade-função pública não escapa, de seta ou de function; a propriedade que não é
-(ts.getModifiers(membro) ?? [])
+(ts.getModifiers(membro))
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o método privado, o protegido e o #privado sem prova passam: só o público exige
-m.kind === ts.SyntaxKind.PrivateKeyword ||
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o método privado, o protegido e o #privado sem prova passam: só o público exige
-|| m.kind === ts.SyntaxKind.ProtectedKeyword
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › toca this.banco sem prova de escopo, com o arquivo e o método
-if (tipo === undefined) return false
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a função exportada do módulo é ponto de entrada público, e a interna não
-if (tipoEhOBanco(parametro.type)) nomes.add(parametro.name.getText())
+nomes.add(parametro.name.getText())
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o parâmetro do construtor sem modificador não vira propriedade, e this.banco de outro
-ts.isParameterPropertyDeclaration(parametro, elemento) &&
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o público que não toca o banco não exige prova, mesmo com Map.delete, parâmetro de outro
-&& tipoEhOBanco(parametro.type)) classe.bancos.add(parametro.name.getText())
+) classe.bancos.add(parametro.name.getText())
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o banco guardado numa propriedade tipada, com ou sem #, é o banco
-if (tipoEhOBanco(elemento.type)) classe.bancos.add(nome)
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o banco devolvido por um acessor ou método também é o banco
-if (tipoEhOBanco(elemento.type)) classe.bancos.add(nome)
+if (ts.isPropertyDeclaration(elemento) && tipoEhOBanco(elemento.type)) classe.bancos.add(nome)
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o ajudante do mesmo arquivo que toca o banco sem prova reprova o público que o chama, e o
-if (chamavel !== undefined) classe.membros.set(nome, chamavel)
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › toca this.banco sem prova de escopo, com o arquivo e o método
-if (ts.isConstructorDeclaration(elemento)) {
+if (false) {
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a propriedade-função pública não escapa, de seta ou de function; a propriedade que não é
-inicial !== undefined &&
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a propriedade-função pública não escapa, de seta ou de function; a propriedade que não é
-|| ts.isFunctionExpression(inicial)) ? inicial : undefined
+) ? inicial : undefined
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a propriedade-função pública não escapa, de seta ou de function; a propriedade que não é
-(ts.isArrowFunction(inicial) || ts.isFunctionExpression(inicial)) ? inicial
+(ts.isFunctionExpression(inicial)) ? inicial
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a classe sem nome também é lida, e a acusação diz
-declaracao.name?.text ?? '(anônima)'
+declaracao.name.text
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a classe sem nome também é lida, e a acusação diz
-?? '(anônima)'
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a classe sem nome também é lida, e a acusação diz
-linhaDe(fonte, declaracao.name ?? declaracao)
+linhaDe(fonte, declaracao.name)
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o motivo de 29 caracteres reprova, e o de 30 passa; o espaço das pontas não conta
-ts.isStringLiteral(no) ||
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o motivo precisa ser texto estático: import, substituição e chamada de função reprovam
-|| ts.isNoSubstitutionTemplateLiteral(no)
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o motivo precisa ser texto estático: import, substituição e chamada de função reprovam
-&& no.operatorToken.kind === ts.SyntaxKind.PlusToken
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o motivo precisa ser texto estático: import, substituição e chamada de função reprovam
-esquerda === undefined ||
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o motivo precisa ser texto estático: import, substituição e chamada de função reprovam
-|| direita === undefined
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o motivo precisa ser texto estático: import, substituição e chamada de função reprovam
-inicial === undefined ||
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o motivo precisa ser texto estático: import, substituição e chamada de função reprovam
-|| vistos.has(no.text)
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o motivo precisa ser texto estático: import, substituição e chamada de função reprovam
-new Set([...vistos, no.text])
+new Set([...vistos])
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › arquivo que não compila reprova, e nada dele é lido
-parseDiagnostics.length > 0) return { erroDeSintaxe: true
+parseDiagnostics.length > 9999) return { erroDeSintaxe: true
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o público que não toca o banco não exige prova, mesmo com Map.delete, parâmetro de outro
-declaracao.importClause?.namedBindings
+declaracao.importClause.namedBindings
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o público que não toca o banco não exige prova, mesmo com Map.delete, parâmetro de outro
-nomeados !== undefined &&
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o público que não toca o banco não exige prova, mesmo com Map.delete, parâmetro de outro
-&& ts.isNamedImports(nomeados)
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o alias de import conta: vale o nome exportado
-(elemento.propertyName ?? elemento.name).text
+elemento.name.text
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o banco recebido por parâmetro também
-if (PROVAS_DE_ESCOPO.has(exportado)) provasImportadas.add(elemento.name.text)
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o motivo de 29 caracteres reprova, e o de 30 passa; o espaço das pontas não conta
-if (exportado === 'SemEscopo') decoratorsSemEscopo.add(elemento.name.text)
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › outro decorator, com ou sem chamada, não prova nada
-if (exportado === 'SemEscopo')
+if (true)
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a assinatura de sobrecarga não é método à parte: sobra um por nome
-&& temCorpo(declaracao)) {
+) {
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a função exportada sem nome também é ponto de entrada, e a acusação diz default
-declaracao.name?.text ?? 'default'
+declaracao.name.text
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a função exportada sem nome também é ponto de entrada, e a acusação diz default
-?? 'default'
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a função exportada sem nome também é ponto de entrada, e a acusação diz default
-nome: declaracao.name ?? declaracao })
+nome: declaracao.name })
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o público que não toca o banco não exige prova, mesmo com Map.delete, parâmetro de outro
-|| inicial === undefined) continue
+) continue
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o ajudante do mesmo arquivo que toca o banco sem prova reprova o público que o chama, e o
-if (ts.isArrowFunction(inicial) || ts.isFunctionExpression(inicial)) {
+if (ts.isArrowFunction(inicial)) {
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a função exportada do módulo é ponto de entrada público, e a interna não
-if (ts.isArrowFunction(inicial) || ts.isFunctionExpression(inicial)) {
+if (ts.isFunctionExpression(inicial)) {
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o motivo precisa ser texto estático: import, substituição e chamada de função reprovam
-} else if (ehConst) {
+} else {
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o ajudante do mesmo arquivo que toca o banco sem prova reprova o público que o chama, e o
-if (visitados.has(chamavel)) continue
+if (visitados.has(chamavel)) throw new Error('ciclo')
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o ajudante do mesmo arquivo que toca o banco sem prova reprova o público que o chama, e o
-visitados.add(chamavel)
+visitados.add({} as ts.Node)
+if (visitados.size > 100) throw new Error('ciclo')
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o público que não toca o banco não exige prova, mesmo com Map.delete, parâmetro de outro
-&& !(ts.isPropertyAccessExpression(no.parent) && no.parent.name === no)
+
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o público que não toca o banco não exige prova, mesmo com Map.delete, parâmetro de outro
-if (ts.isIdentifier(no) && parametros.has(no.text)
+if (parametros.has(no.text)
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o público que não toca o banco não exige prova, mesmo com Map.delete, parâmetro de outro
-ts.isPropertyAccessExpression(no) && no.expression.kind === ts.SyntaxKind.ThisKeyword && classe?.bancos
+ts.isPropertyAccessExpression(no) && classe?.bancos
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o banco recebido por parâmetro também
-if (provasImportadas.has(chamado.text)) resumo.prova = true
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › toca this.banco sem prova de escopo, com o arquivo e o método
-if (ajudante !== undefined) pilha.push({ chamavel: ajudante, classe: undefined })
+pilha.push({ chamavel: ajudante as Chamavel, classe: undefined })
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o ajudante do mesmo arquivo que toca o banco sem prova reprova o público que o chama, e o
-if (ajudante !== undefined) pilha.push({ chamavel: ajudante, classe: undefined })
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o ajudante do mesmo arquivo que toca o banco sem prova reprova o público que o chama, e o
-if (ajudante !== undefined) pilha.push({ chamavel: ajudante, classe })
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o ajudante do mesmo arquivo que toca o banco sem prova reprova o público que o chama, e o
-ts.isPropertyAccessExpression(chamado) && chamado.expression.kind === ts.SyntaxKind.ThisKeyword) {
+ts.isPropertyAccessExpression(chamado)) {
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o ajudante do mesmo arquivo que toca o banco sem prova reprova o público que o chama, e o
-const ajudante = classe?.membros.get(chamado.name.getText())
+const ajudante = classe.membros.get(chamado.name.getText())
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › toca this.banco sem prova de escopo, com o arquivo e o método
-visitar(chamavel.body)
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › toca this.banco sem prova de escopo, com o arquivo e o método
-ts.getDecorators(membro) ?? []
+ts.getDecorators(membro)
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › outro decorator, com ou sem chamada, não prova nada
-!ts.isCallExpression(chamada) ||
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o @SemEscopo escrito no arquivo, que não é o importado, não vale
-|| !decoratorsSemEscopo.has(chamada.expression.text)) continue
+) continue
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o motivo precisa ser texto estático: import, substituição e chamada de função reprovam
-chamada.arguments.length === 1 ?
+chamada.arguments.length >= 1 ?
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o motivo precisa ser texto estático: import, substituição e chamada de função reprovam
-argumento === undefined ? undefined :
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o motivo precisa ser texto estático: import, substituição e chamada de função reprovam
-if (motivo === undefined) return 'motivo-nao-literal'
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o motivo de 29 caracteres reprova, e o de 30 passa; o espaço das pontas não conta
-return motivo.trim().length <
+return motivo.length <
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o motivo de 29 caracteres reprova, e o de 30 passa; o espaço das pontas não conta
-motivo.trim().length < TAMANHO_MINIMO_JUSTIFICATIVA_SEM_ESCOPO ?
+motivo.trim().length <= TAMANHO_MINIMO_JUSTIFICATIVA_SEM_ESCOPO ?
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o motivo de 29 caracteres reprova, e o de 30 passa; o espaço das pontas não conta
-motivo.trim().length < TAMANHO_MINIMO_JUSTIFICATIVA_SEM_ESCOPO ?
+motivo.trim().length < 1 ?
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › toca this.banco sem prova de escopo, com o arquivo e o método
-!ehMembro(membro) ||
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o método privado, o protegido e o #privado sem prova passam: só o público exige
-|| !ehPublico(membro)
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o ajudante do mesmo arquivo que toca o banco sem prova reprova o público que o chama, e o
-|| ts.isPrivateIdentifier(membro.name)) continue
+) continue
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a propriedade-função pública não escapa, de seta ou de function; a propriedade que não é
-if (chamavel === undefined) continue
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o motivo de 29 caracteres reprova, e o de 30 passa; o espaço das pontas não conta
-decorator === null ? 'sem-escopo' :
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o banco recebido por parâmetro também
-prova: decorator === null ? 'sem-escopo' : prova ? 'contexto' : null,
+prova: decorator === null ? 'sem-escopo' : null,
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › toca this.banco sem prova de escopo, com o arquivo e o método
-erroDoDecorator: decorator ?? null,
+erroDoDecorator: decorator,
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a função exportada do módulo é ponto de entrada público, e a interna não
-tocaBanco: toca, prova: prova ? 'contexto' : null, erroDoDecorator: null
+tocaBanco: toca, prova: null, erroDoDecorator: null
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a função exportada do módulo é ponto de entrada público, e a interna não
-if (!ehDeRepository(fonte.caminho) && !MENCIONA_CLASSE_REPOSITORY.test(fonte.texto)) continue
+if (!MENCIONA_CLASSE_REPOSITORY.test(fonte.texto)) continue
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › XRepository em x.service.ts reprova, e o XService ao lado não
-if (!ehDeRepository(fonte.caminho) && !MENCIONA_CLASSE_REPOSITORY.test(fonte.texto)) continue
+if (!ehDeRepository(fonte.caminho)) continue
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › XRepository em x.service.ts reprova, e o XService ao lado não
-const MENCIONA_CLASSE_REPOSITORY = /\bclass\s+\w*Repository\b/
+const MENCIONA_CLASSE_REPOSITORY = /\bclass\s+Repository\b/
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › arquivo que não compila reprova, e nada dele é lido
-if (analise.erroDeSintaxe) {
+if (false) {
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › XRepository em x.service.ts reprova, e o XService ao lado não
-for (const classe of analise.classes.filter((c) => c.nome.endsWith('Repository'))) {
+for (const classe of analise.classes) {
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › XRepository em x.service.ts reprova, e o XService ao lado não
  }
-continue
  }
  analises.set(fonte.caminho, analise)
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a exceção vale só no arquivo da entrada: o mesmo nome de método em outro arquivo continua
-entrada.arquivo === arquivo &&
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o método na lista, sem prova, passa; o que está fora de `metodos` continua reprovado
-&& entrada.metodos.includes(metodo)
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o motivo de 29 caracteres reprova, e o de 30 passa; o espaço das pontas não conta
-if (metodo.erroDoDecorator !== null) {
+if (false) {
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a função exportada do módulo é ponto de entrada público, e a interna não
-metodo.tocaBanco && metodo.prova === null
+metodo.prova === null
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › o banco recebido por parâmetro também
-&& metodo.prova === null && !naLista
+&& !naLista
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a exceção vale só no arquivo da entrada: o mesmo nome de método em outro arquivo continua
-&& !naLista(arquivo, metodo.nome)) {
+) {
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › arquivo inexistente reprova
-if (analise === undefined) {
+if (false) {
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a entrada da lista com motivo de 29 caracteres reprova, e a de 30 passa
-entrada.motivo.trim().length < TAMANHO_MINIMO_JUSTIFICATIVA_SEM_ESCOPO
+entrada.motivo.length < TAMANHO_MINIMO_JUSTIFICATIVA_SEM_ESCOPO
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a exceção vale só no arquivo da entrada: o mesmo nome de método em outro arquivo continua
-entrada.motivo.trim().length < TAMANHO_MINIMO_JUSTIFICATIVA_SEM_ESCOPO
+entrada.motivo.trim().length <= TAMANHO_MINIMO_JUSTIFICATIVA_SEM_ESCOPO
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › a entrada da lista com motivo de 29 caracteres reprova, e a de 30 passa
-entrada.motivo.trim().length < TAMANHO_MINIMO_JUSTIFICATIVA_SEM_ESCOPO
+entrada.motivo.trim().length < 1
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › método inexistente reprova
-if (achados.length === 0) {
+if (false) {
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › método que nem toca o banco reprova na lista
-!metodo.tocaBanco ||
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › método que já tem prova reprova: a lista só encolhe
-|| metodo.prova !== null))
+))
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › lê só o .ts de produção de src de apps/
  } catch {
-continue
+throw new Error('sem src')
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › lê só o .ts de produção de src de apps/
-!entrada.endsWith('.ts') ||
+!/\.tsx?$/.test(entrada) ||
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › lê só o .ts de produção de src de apps/
-entrada.endsWith('.d.ts') ||
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › lê só o .ts de produção de src de apps/
-|| entrada.endsWith('.test.ts')) continue
+) continue
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › lê só o .ts de produção de src de apps/
-parte === 'node_modules' ||
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › lê só o .ts de produção de src de apps/
-|| parte === 'dist')
+)
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › lê só o .ts de produção de src de apps/
-const pastaSrc = join(raiz, grupo, pacote, 'src')
+const pastaSrc = join(raiz, grupo, pacote, 'vazia')
```

```mutacao
arquivo: apps/api/src/sessao/alunos-ativos.repository.ts
teste: tools/guardas/repositories-com-escopo.test.ts › AlunosAtivosRepository.contar é o caso conhecido: toca o banco e prova o escopo pelo
-const escolaId = exigirEscolaDoContexto()
```

```mutacao
arquivo: apps/api/src/assistente/suspensoes-da-escola.repository.ts
teste: tools/guardas/repositories-com-escopo.test.ts › todo método público real tem
-eq(suspensaoDeFuncao.escolaId, exigirEscolaDoContexto()),
+eq(suspensaoDeFuncao.escolaId, escolaId),
```

```mutacao
arquivo: apps/api/src/assistente/time.service.ts
teste: tools/guardas/repositories-com-escopo.test.ts › todo método público real tem
-import { SuspensoesDaEscolaRepository } from './suspensoes-da-escola.repository.js'
+export class SuspensoesDaEscolaRepository {}
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › todo método público real tem
-export const REPOSITORIES_SEM_ESCOPO: readonly EntradaSemEscopo[] = [
+export const REPOSITORIES_SEM_ESCOPO: readonly EntradaSemEscopo[] = [
+{ arquivo: 'apps/api/src/x/x.repository.ts', motivo: 'uma entrada a mais, com motivo comprido', metodos: [] },
```

```mutacao
arquivo: tools/guardas/escopo-dos-repositories.ts
teste: tools/guardas/repositories-com-escopo.test.ts › todo método público real tem
-motivo: 'só calcula duas datas pela aritmética do banco, sem ler tabela nenhuma: não há escola a aplicar',
+motivo: 'só calcula',
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª), test-engineer (1ª) | Tratar `export { f }`, `export default f`, parâmetro desestruturado e alias de tipo local no analisador, com uma fixture para cada | Muda o que o analisador reprova e abre quatro fixtures e quatro mutações; a tarefa declara os limites no cabeçalho (item 4). `TODO.md`, uma linha, para a próxima tarefa que mexer em `escopo-dos-repositories.ts` |
| tenancy-guardian (1ª) | A prova (a) não distingue escopo de escola de escopo de ano letivo | Recusada: o limite já está declarado ("a prova (a) não vê o `where`") e o teste de isolamento de cada módulo é a defesa |
| tenancy-guardian (1ª) | `ia/consumo`, `ia/orcamento` e `ia/suspensao` recebem a escola por argumento; a 8.0 precisa tirá-las | Tarefa 8.0, que já as tem (`onda-1a.md` T6); a trava força: método que passa a provar o escopo e continua na lista reprova |
| revisor-geral (1ª) | `onda-1a.md`, parágrafo da 9.0, ainda diz "Hoje só `time.service.ts` viola" | Tarefa 9.0, que toca o parágrafo (o próprio revisor diz que a correção cabe a ela) |
| test-engineer (1ª) | O `toEqual` da lista real não compara o `motivo` | Recusada: o motivo é evidência, não regra, e o tamanho já é conferido |
| revisor-geral (2ª) | O cabeçalho de `escopo-dos-repositories.ts` diz que nenhum dos limites "existe hoje no código", mas o primeiro item cita a função de `homonimo.ts`, que existe e só não passa sem acusação porque `titulares.homonimo` está na lista | Só texto de comentário. `TODO.md`, na mesma linha dos limites do analisador (a próxima tarefa que mexer em `escopo-dos-repositories.ts`) |
| test-engineer (2ª) | O nome "cada entrada diz o motivo com pelo menos 30 caracteres" ainda diz 30 por extenso, e o corpo usa a constante | Só texto de nome de teste, e renomear mexe nos blocos de mutação que o citam. `TODO.md`, na mesma linha: a próxima tarefa que mexer em `repositories-com-escopo.test.ts` |

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->


## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-22 12:43:38 | 2026-10-22 12:44:45 | `tenancy-guardian` | 1 | APROVADO | ad61c0c8826776625 |
| 2026-10-22 12:43:40 | 2026-10-22 12:44:46 | `revisor-geral` | 1 | APROVADO | aa8b0fa413a3cc0a1 |
| 2026-10-22 12:43:39 | 2026-10-22 12:44:53 | `test-engineer` | 1 | APROVADO | a85554e0bf82daa9a |
| 2026-10-22 12:51:37 | 2026-10-22 12:52:08 | `test-engineer` | 2 | APROVADO | a1a929d3587da82b3 |
| 2026-10-22 12:51:43 | 2026-10-22 12:52:18 | `revisor-geral` | 2 | APROVADO | a42b88f1373845fb4 |
