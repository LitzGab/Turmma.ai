# Tarefa 25.0 — Todo `throw` de produção é tipado, e o lint barra o resto

**Funcionalidade:** reengenharia · **Depende de:** 13.0
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

Os 84 `throw new Error('…')` de produção (contados em 22/10, depois da 96.0) viram erro tipado, e `guardas/erro-tipado` reprova o próximo.

## Contexto necessário

- `techspec.md` §11 (regra 00)
- `onda-1b.md`, "RF13 — Dependências e `throw`" (O `throw`), §3 e §5
- `prd.md` RF13
- `.claude/rules/00-arquitetura.md` (item 9) e `20-lgpd-menores.md` (item 11)
- Código: `packages/nucleo/src/erro/erro-de-dominio.ts` e `filtro-global.ts`; `tools/guardas/regras-log.mjs` (molde de
  regra); `ArgumentoInvalido` em `apps/api/src/ops/comando.ts:15`, `uso.ts:37` e `sessao-sintetica.ts:19`
- Busca: `rg -l "throw new Error\(" apps/*/src packages/nucleo/src -g '!*.test.*'` (64 arquivos em 22/10)

## Subtarefas

- [x] 25.1 — `ErroDeInvariante` em `packages/nucleo/src/erro/`, com motivo fixo (recusa da interpolação pelo tipo ou por
  lint, declarada)
- [x] 25.2 — Trocar cada `throw new Error(` de produção, com a mensagem que um teste afirma igual
- [x] 25.3 — `packages/nucleo/src/permissao/conferencia-das-permissoes.ts:59` lança erro tipado com código, com controller e método em campos;
  `permissao-no-boot.test.ts:74` os lê dali (mudança declarada)
- [x] 25.4 — `ArgumentoInvalido` vira uma classe só, reexportada
- [x] 25.5 — `guardas/erro-tipado` (`tools/guardas/regras-erro.mjs`) em `apps/*/src` e `packages/nucleo/src`, fora de
  teste, exceto `apps/web/src/main.tsx`
- [x] 25.6 — Testes: classe, formas proibidas, exceções, segunda passada, filtro global, ops

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/erro/erro-de-invariante.ts` e `.test.ts` | novo |
| `packages/nucleo/src/` (18 arquivos), `apps/api/src/` (36, com `ops/`) | alterado |
| `apps/worker/src/` (5), `apps/realtime/src/` (1), `apps/web/src/` (4); `apps/despachante/src/` não tem nenhum | alterado |
| `apps/api/test/permissao-no-boot.test.ts` | alterado |
| `tools/guardas/regras-erro.mjs`, `tools/guardas/__fixtures__/erro-sem-tipo.ts` | novo |
| `tools/guardas/index.mjs`, `tools/guardas/guardas.test.ts`, `eslint.config.mjs` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova | Mutação |
|---|---|---|---|
| `ErroDeInvariante` leva o motivo na `message` e é `instanceof Error` | unidade | a classe | `super('')` |
| Motivo interpolado (`` `papel fora: ${papel}` ``) é recusado | unidade (tsc ou fixture) | motivo fixo | motivo `string` sem restrição |
| `throw new Error('x')` em `apps/*/src` reprova | unidade (`guardas.test.ts`) | a guarda | tirar a regra de `index.mjs` |
| O mesmo em `packages/nucleo/src` reprova | unidade | os dois alcances | alcance só `apps/*/src` |
| `throw 'x'` reprova | unidade | literal lançado | conferir só `new Error` |
| `` throw `x` `` reprova | unidade | template lançado | conferir só `Literal` |
| `throw Error('x')`, sem `new`, reprova (ou é limite declarado) | unidade | o atalho | conferir só `NewExpression` |
| Em `*.test.ts`, passa | unidade | só produção | aplicar a teste |
| Em `apps/web/src/main.tsx`, passa | unidade | a exceção única | tirar a exceção |
| `eslint-disable-next-line guardas/erro-tipado` não fura | unidade | segunda passada | tirar a regra dela |
| As mensagens que os testes de hoje afirmam seguem iguais (`apps/worker/test/execucao.int.test.ts:453`) | integração (existentes) | o texto de hoje | trocar o texto de um motivo |
| Rota sem `@Permite` derruba o boot com controller e método nos campos | unidade (`permissao-no-boot.test.ts`) | 25.3 | nomes só na `message` |
| `ErroDeInvariante` no filtro global vira `ERRO_INTERNO`, sem motivo nem pilha | integração (`erro.int.test.ts`) | regra 20.11 | devolver `message` no corpo |
| O `ArgumentoInvalido` de `ops/uso.ts` é `instanceof` o de `ops/comando.ts` | unidade (`ops/uso.test.ts`) | uma classe só | recriar a classe em `uso.ts` |
| Comando de ops com argumento inválido sai como hoje | unidade (`ops/uso.test.ts`, `ops/escola.test.ts`) | o terminal | — regressão |

## Como testar

- `tools/guardas/guardas.test.ts › guarda de log com dado pessoal › reprova spread, template, …`: fixture com marcas,
  `lintar` e `marcasDeViolacao`, caminho simulado. Segunda passada: `› guarda desligada por comentário`.
- Filtro: `apps/api/test/erro.int.test.ts › exceção não tratada vira ERRO_INTERNO 500 …`; ops:
  `apps/api/src/ops/uso.test.ts › opção desconhecida não repete o valor recebido na mensagem`.
- Isolado: `npx vitest run --project unidade tools/guardas packages/nucleo/src/erro apps/api/test/permissao-no-boot.test.ts`
  e `--project integracao apps/api/test/erro.int.test.ts`.
- Armadilhas: a 20.0 e a 23.0 também editam o `eslint.config.mjs`; procure cada motivo nos testes antes de trocá-lo.

## Fora do escopo desta tarefa

As dependências (24.0) e o erro de contrato da web (20.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| `ErroDeInvariante` mora em `packages/shared/src/erros/` (com o teste ao lado), e não em `packages/nucleo/src/erro/`; o `nucleo` e as apps o importam de `@educa/shared` | `ferramentaDoCatalogo` (`apps/web/src/areas/professor/ferramentas/ferramentas.ts`) lança, e a web não importa o `nucleo` (`web-nao-importa-nucleo-nem-backend`, `guarda:camadas`); uma classe só, no pacote que as duas camadas já importam | `onda-1b.md`, "RF13 — Dependências e `throw`", "Como a 25.0 ficou" |
| O motivo fixo é recusado pelo lint (`guardas/erro-tipado`: `new ErroDeInvariante(x)` e o `super(x)` de uma subclasse só aceitam um texto escrito, sem `${}`, `+` nem variável), e não pelo tipo | O tipo `string` não distingue `'a'` de `` `a ${x}` `` sem genérico no construtor; a subtarefa 25.1 já aceitava "tipo ou lint, declarada" | `onda-1b.md`, "RF13 — Dependências e `throw`", "Como a 25.0 ficou" |
| O alcance da guarda exclui também `**/__fixtures__/**`: as 7 ocorrências de `apps/web/src/__fixtures__/` (4) e `packages/nucleo/src/ia/__fixtures__/` (3) ficam como estão, e o `main.tsx` segue a exceção única de produção. Convertidos: os 76 de produção, não os 84 | A pasta `__fixtures__` é apoio de teste (a `camadas.cjs` a trata como teste); o `Error` com o caminho no texto (`chamada à API sem resposta preparada: ${caminho}`) é o que ajuda quem depura o teste, e o motivo fixo o apagaria | `onda-1b.md`, "RF13 — Dependências e `throw`", "Como a 25.0 ficou" |
| As quatro mensagens com valor viraram motivo fixo, sem o valor (`categoria sem prazo no catálogo`, `nome de coluna fora do formato`, `papel fora da busca de titulares`, `ferramenta fora do catálogo`); a lista de rotas (25.3) e a de problemas do mapa de auditoria saem em campo de subclasse (`RotasSemPermissao`, `MapaDeAuditoriaInvalido`), com a `message` fixa | A mensagem não monta valor de execução (regra 20, item 11); o teste de hoje que afirma texto (`leitura-do-titular.test.ts`) afirma só o prefixo, que fica igual | `onda-1b.md`, "RF13 — Dependências e `throw`", "Como a 25.0 ficou" |
| `ArgumentoInvalido` fica em `comando.ts`, que recebe a opção com os traços (`'--dia'`), e `uso.ts` e `sessao-sintetica.ts` o reexportam; as duas cópias recebiam `'dia'` e punham os traços na mensagem, e agora passam `'--dia'`: o texto no terminal é o mesmo | Uma classe só (25.4); a mensagem `Opção inválida ou ausente: --dia` não muda | `onda-1b.md`, "RF13 — Dependências e `throw`", "Como a 25.0 ficou" |
| `exigirMapaDeAcoesValido(mapa)` sai de `acoes.ts` (o `if` que lançava no carregamento do módulo); o módulo continua chamando-o com o mapa real | A cláusula que lança no import não tinha como ser provada por teste (a mutação ficaria verde); com a função, `acoes.test.ts` a chama com um mapa ruim | `onda-1b.md`, "RF13 — Dependências e `throw`", "Como a 25.0 ficou" |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: packages/shared/src/erros/erro-de-invariante.ts
teste: packages/shared/src/erros/erro-de-invariante.test.ts › leva o motivo na message
  constructor(motivo: string) {
-   super(motivo)
+   super('')
    this.name = 'ErroDeInvariante'
```

```mutacao
arquivo: packages/shared/src/erros/erro-de-invariante.ts
teste: packages/shared/src/erros/erro-de-invariante.test.ts › leva o motivo na message
    super(motivo)
-   this.name = 'ErroDeInvariante'
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-   if (no.type === 'Identifier') return no.name === 'Error'
+   if (no.type === 'Identifier') return no.name === 'Errx'
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-   return no.type === 'MemberExpression' && !no.computed && no.property.type === 'Identifier' && no.property.name === 'Error'
+   return false
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-   return (no.type === 'NewExpression' || no.type === 'CallExpression') && ehErroGenerico(no.callee)
+   return no.type === 'NewExpression' && ehErroGenerico(no.callee)
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
    const atual = desembrulhar(no)
-   if (chamaErroGenerico(atual)) return 'generico'
    if (atual.type === 'Literal' || atual.type === 'TemplateLiteral') return 'solto'
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-   if (atual.type === 'Literal' || atual.type === 'TemplateLiteral') return 'solto'
+   if (atual.type === 'TemplateLiteral') return 'solto'
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-   if (atual.type === 'Literal' || atual.type === 'TemplateLiteral') return 'solto'
+   if (atual.type === 'Literal') return 'solto'
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-   if (atual.type === 'ConditionalExpression') return problemaDoLancado(atual.consequent) ?? problemaDoLancado(atual.alternate)
    if (atual.type === 'LogicalExpression') return problemaDoLancado(atual.left) ?? problemaDoLancado(atual.right)
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
    if (atual.type === 'ConditionalExpression') return problemaDoLancado(atual.consequent) ?? problemaDoLancado(atual.alternate)
-   if (atual.type === 'LogicalExpression') return problemaDoLancado(atual.left) ?? problemaDoLancado(atual.right)
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-   while (['TSAsExpression', 'TSNonNullExpression', 'TSSatisfiesExpression'].includes(atual.type)) atual = atual.expression
+   while (['TSNonNullExpression', 'TSSatisfiesExpression'].includes(atual.type)) atual = atual.expression
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-   while (['TSAsExpression', 'TSNonNullExpression', 'TSSatisfiesExpression'].includes(atual.type)) atual = atual.expression
+   while (['TSAsExpression', 'TSSatisfiesExpression'].includes(atual.type)) atual = atual.expression
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-   while (['TSAsExpression', 'TSNonNullExpression', 'TSSatisfiesExpression'].includes(atual.type)) atual = atual.expression
+   while (['TSAsExpression', 'TSNonNullExpression'].includes(atual.type)) atual = atual.expression
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-   if (atual.type === 'Literal') return typeof atual.value === 'string'
+   if (atual.type === 'Literal') return true
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-   return atual.type === 'TemplateLiteral' && atual.expressions.length === 0
+   return atual.type === 'TemplateLiteral'
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-   return no?.name === NOME_DA_CLASSE_DE_INVARIANTE
+   return no?.name === 'Outro'
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-   return motivo === undefined || resto.length > 0 || !ehTextoFixo(motivo)
+   return resto.length > 0 || !ehTextoFixo(motivo)
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-   return motivo === undefined || resto.length > 0 || !ehTextoFixo(motivo)
+   return motivo === undefined || !ehTextoFixo(motivo)
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-   return motivo === undefined || resto.length > 0 || !ehTextoFixo(motivo)
+   return motivo === undefined || resto.length > 0
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-   if (atual.type === 'ClassDeclaration' || atual.type === 'ClassExpression') return atual
+   if (atual.type === 'ClassExpression') return atual
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-   if (atual.type === 'ClassDeclaration' || atual.type === 'ClassExpression') return atual
+   if (atual.type === 'ClassDeclaration') return atual
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-   if (problema !== null) context.report({ node: no.argument, messageId: problema })
+   if (problema === 'generico') context.report({ node: no.argument, messageId: problema })
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › o jeito certo passa: ErroDeInvariante com texto fixo
      CallExpression(no) {
-     if (no.callee.type !== 'Super') return
      if (ehInvariante(classeDe(no)?.superClass) && motivoInvalido(no.arguments)) context.report({ node: no, messageId: 'motivo' })
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › o jeito certo passa: ErroDeInvariante com texto fixo
-     if (ehInvariante(classeDe(no)?.superClass) && motivoInvalido(no.arguments)) context.report({ node: no, messageId: 'motivo' })
+     if (motivoInvalido(no.arguments)) context.report({ node: no, messageId: 'motivo' })
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-     if (ehInvariante(no.callee) && motivoInvalido(no.arguments)) context.report({ node: no, messageId: 'motivo' })
+     if (motivoInvalido(no.arguments)) context.report({ node: no, messageId: 'motivo' })
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-     'erro-tipado': erroTipado,
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › o eslint-disable não fura: o ESLint comum aceita o comentário e reprova a diretiva
    ...REGRAS_DE_TENANT,
-   ...REGRAS_DE_ERRO,
    ...REGRAS_DE_TESTE,
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
- export const ESCOPO_DO_ERRO_TIPADO = ['apps/*/src/**/*.{ts,tsx}', 'packages/nucleo/src/**/*.{ts,tsx}']
+ export const ESCOPO_DO_ERRO_TIPADO = ['packages/nucleo/src/**/*.{ts,tsx}']
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
- export const ESCOPO_DO_ERRO_TIPADO = ['apps/*/src/**/*.{ts,tsx}', 'packages/nucleo/src/**/*.{ts,tsx}']
+ export const ESCOPO_DO_ERRO_TIPADO = ['apps/*/src/**/*.{ts,tsx}']
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › em teste e em __fixtures__ a mesma fixture passa
-     files: [...ARQUIVOS_DE_TESTE, '**/__fixtures__/**'],
+     files: ['**/__fixtures__/**'],
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › em teste e em __fixtures__ a mesma fixture passa
-     files: [...ARQUIVOS_DE_TESTE, '**/__fixtures__/**'],
+     files: [...ARQUIVOS_DE_TESTE],
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › a exceção única é o main.tsx da web
-     files: ['apps/web/src/main.tsx'],
+     files: ['apps/web/src/principal.tsx'],
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › a guarda de erro tipado fica entre as que a passada sem comentários roda
-     rules: Object.fromEntries(REGRAS_DE_ERRO.map((regra) => [regra, 'error'])),
+     rules: Object.fromEntries(REGRAS_DE_ERRO.map((regra) => [regra, 'warn'])),
```

```mutacao
arquivo: packages/nucleo/src/permissao/conferencia-das-permissoes.ts
teste: apps/api/test/permissao-no-boot.test.ts › rota sem @Permite, sem @RotaAnonima e sem marcador da operação derruba o boot
-     if (semPermissao.length > 0) throw new RotasSemPermissao(semPermissao)
+     if (semPermissao.length > 1) throw new RotasSemPermissao(semPermissao)
```

```mutacao
arquivo: packages/nucleo/src/permissao/conferencia-das-permissoes.ts
teste: apps/api/test/permissao-no-boot.test.ts › rota sem @Permite, sem @RotaAnonima e sem marcador da operação derruba o boot
-   readonly codigo = 'ROTA_SEM_PERMISSAO'
+   readonly codigo = 'OUTRO'
```

```mutacao
arquivo: packages/nucleo/src/permissao/conferencia-das-permissoes.ts
teste: apps/api/test/permissao-no-boot.test.ts › rota sem @Permite, sem @RotaAnonima e sem marcador da operação derruba o boot
-     .map((nome) => ({ controller: controlador.name, metodo: nome }))
+     .map((nome) => ({ controller: nome, metodo: controlador.name }))
```

```mutacao
arquivo: packages/nucleo/src/auditoria/acoes.ts
teste: packages/nucleo/src/auditoria/acoes.test.ts › o mapa com problema é recusado
-   if (problemas.length > 0) throw new MapaDeAuditoriaInvalido(problemas)
+   if (problemas.length > 1) throw new MapaDeAuditoriaInvalido(problemas)
```

```mutacao
arquivo: packages/nucleo/src/auditoria/acoes.ts
teste: packages/nucleo/src/auditoria/acoes.test.ts › o mapa com problema é recusado
-     super('mapa de auditoria inválido')
+     super('')
```

```mutacao
arquivo: packages/nucleo/src/auditoria/acoes.ts
teste: packages/nucleo/src/auditoria/acoes.test.ts › o mapa com problema é recusado
-     this.name = 'MapaDeAuditoriaInvalido'
```

```mutacao
arquivo: packages/nucleo/src/titular/leitura-do-titular.ts
teste: packages/nucleo/src/titular/leitura-do-titular.test.ts › recusa o nome fora do formato
-   for (const nome of nomes) if (!NOME_DE_COLUNA.test(nome)) throw new ErroDeInvariante('nome de coluna fora do formato')
+   for (const nome of nomes) if (!NOME_DE_COLUNA.test(nome)) throw new ErroDeInvariante(`nome de coluna fora do formato: ${nome}`)
```

```mutacao
arquivo: apps/api/src/ops/uso.ts
teste: apps/api/src/ops/uso.test.ts › recusa citando só a opção
-   if (!diaValido(dia)) throw new ArgumentoInvalido('--dia')
+   if (!diaValido(dia)) throw new ArgumentoInvalido('dia')
```

```mutacao
arquivo: apps/api/src/ops/uso.ts
teste: apps/api/src/ops/uso.test.ts › opção desconhecida não repete
-     throw new ArgumentoInvalido('--escola, --dia ou --mes')
+     throw new ArgumentoInvalido('escola, --dia ou --mes')
```

```mutacao
arquivo: apps/api/src/ops/uso.ts
teste: apps/api/src/ops/uso.test.ts › o ArgumentoInvalido do uso é o de comando.ts
- export { ArgumentoInvalido }
```

```mutacao
arquivo: apps/api/src/ops/sessao-sintetica.ts
teste: apps/api/src/ops/sessao-sintetica.test.ts › recusa citando só a opção
-   if (papel === undefined) throw new ArgumentoInvalido('--papel')
+   if (papel === undefined) throw new ArgumentoInvalido('papel')
```

```mutacao
arquivo: apps/api/src/ops/sessao-sintetica.ts
teste: apps/api/src/ops/sessao-sintetica.test.ts › o ArgumentoInvalido reexportado é o de comando.ts
- export { ArgumentoInvalido }
```

```mutacao
arquivo: packages/nucleo/src/erro/resumir-erro.ts
teste: apps/api/test/erro.int.test.ts › ErroDeInvariante vira ERRO_INTERNO 500
-     return { tipo: erro.name, ...(pilha.length > 0 ? { pilha } : {}) }
+     return { tipo: 'Error', ...(pilha.length > 0 ? { pilha } : {}) }
```

```mutacao
arquivo: packages/nucleo/src/permissao/conferencia-das-permissoes.ts
teste: apps/api/test/permissao-no-boot.test.ts › rota sem @Permite, sem @RotaAnonima e sem marcador da operação derruba o boot
-     super('rota sem @Permite, @RotaAnonima nem marcador da operação')
+     super('')
      this.name = 'RotasSemPermissao'
```

```mutacao
arquivo: packages/nucleo/src/permissao/conferencia-das-permissoes.ts
teste: apps/api/test/permissao-no-boot.test.ts › rota sem @Permite, sem @RotaAnonima e sem marcador da operação derruba o boot
      super('rota sem @Permite, @RotaAnonima nem marcador da operação')
-     this.name = 'RotasSemPermissao'
```

```mutacao
arquivo: packages/nucleo/src/permissao/conferencia-das-permissoes.ts
teste: apps/api/test/permissao-no-boot.test.ts › rota sem @Permite, sem @RotaAnonima e sem marcador da operação derruba o boot
- export class RotasSemPermissao extends ErroDeInvariante {
+ export class RotasSemPermissao extends Error {
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-   if (atual.type === 'ConditionalExpression') return problemaDoLancado(atual.consequent) ?? problemaDoLancado(atual.alternate)
+   if (atual.type === 'ConditionalExpression') return problemaDoLancado(atual.consequent)
```

```mutacao
arquivo: tools/guardas/regras-erro.mjs
teste: tools/guardas/guardas.test.ts › reprova Error genérico, texto e literal lançados e o motivo do ErroDeInvariante
-   if (atual.type === 'LogicalExpression') return problemaDoLancado(atual.left) ?? problemaDoLancado(atual.right)
+   if (atual.type === 'LogicalExpression') return problemaDoLancado(atual.right)
```

```mutacao
arquivo: apps/web/src/areas/professor/ferramentas/ferramentas.ts
teste: apps/web/src/areas/professor/ferramentas/ferramentas.test.ts › a ferramenta fora do catálogo é um ErroDeInvariante
-   if (achada === undefined) throw new ErroDeInvariante('ferramenta fora do catálogo')
+   if (achada === undefined) throw new ErroDeInvariante(`ferramenta fora do catálogo: ${ferramenta}`)
```

```mutacao
arquivo: apps/web/src/areas/professor/ferramentas/ferramentas.ts
teste: apps/web/src/areas/professor/ferramentas/ferramentas.test.ts › a ferramenta fora do catálogo é um ErroDeInvariante
-   if (achada === undefined) throw new ErroDeInvariante('ferramenta fora do catálogo')
+   if (achada === undefined) throw new Error('ferramenta fora do catálogo')
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (2ª) | O `describe('ferramentaDoCatalogo')` de `ferramentas.test.ts` chama `ferramentaDoCatalogo(fora)` três vezes; capturar o erro uma vez e conferir tipo, mensagem e ausência do nome no mesmo objeto | Recusada: estilo, e o revisor diz que "o teste fica mais curto e não muda de força". Recomendação de quem aprovou, depois da primeira ordem |
| revisor-geral (2ª), test-engineer (2ª) | Os dois blocos de mutação de `ferramentas.ts` citam o teste por um prefixo do nome ("a ferramenta fora do catálogo é um ErroDeInvariante"); citar o nome inteiro | Recusada: o portão da tarefa já provou que o prefixo casa com um teste só (as mutações ficaram vermelhas pelo teste certo); só importaria se outro teste ganhasse o mesmo começo |
| test-engineer (2ª) | A chamada `exigirMapaDeAcoesValido(ACOES_DE_AUDITORIA)` ao carregar o módulo fica sem teste que falhe sem ela | Sem ação: o limite já está declarado em `onda-1b.md` ("Como a 25.0 ficou") e na divergência da tabela; o revisor o aceita e deixa registrado para o `/validar` |

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
| 2026-10-22 23:58:47 | 2026-10-23 00:00:31 | `revisor-geral` | 1 | APROVADO | aaf3a4477e6a5f6c5 |
| 2026-10-22 23:58:39 | 2026-10-23 00:01:49 | `test-engineer` | 1 | REPROVADO | a32fa5fe27bb9ed88 |
| 2026-10-23 00:08:39 | 2026-10-23 00:09:08 | `revisor-geral` | 2 | APROVADO | ad665eb0dabaebb4e |
| 2026-10-23 00:08:26 | 2026-10-23 00:09:21 | `test-engineer` | 2 | APROVADO | aec92358a6119b08b |
