# Tarefa 13.0 — O commit exige o guardião que o caminho pede

**Funcionalidade:** harness (X7) · **Depende de:** 9.0, 10.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`
**Porte:** grande

## Objetivo

Os obrigatórios de um commit passam a ser a união dos marcados com os que o caminho alterado pede: código em `apps/`,
`packages/`, `e2e/`, `tools/guardas/` e `tools/testes/` pede os quatro guardiões, salvo as exceções escritas, e a citação
de uma regra soma o guardião dela; o portão imprime a lista unida.

## Contexto necessário

- `techspec.md` §5(b)
- `prd.md` RF15
- `tabela-de-guardioes.md` inteira, menos a seção "Fora do código de produto" (14.0)
- `cenarios.md` seção B, **RF15**
- Código: `tools/processo/documento-de-revisao.ts` (`revisoresObrigatorios`); `tools/processo/portao.ts`
  (`decidirCommit`, que recebe `conteudoDe`); `tools/processo/portao-local.ts` (o que ele imprime)

## Subtarefas

- [x] 13.1 — `tools/processo/guardioes-por-caminho.ts`: `guardioesDoCaminho(arquivos, conteudoDe)` com a tabela "Exceções
  do código"; prefixo sem glob, o mais longo vence; `*.repository.ts`, `*.controller.ts`, `*.gateway.ts`, `*.service.ts`
  e arquivo com `@SemEscopo(` no HEAD ou no índice nunca caem em exceção; a citação ("regra 10" → T, "regra 20" ou
  "LGPD" → P, "regra 70" → C, "regra 80" → I, sem caixa, no HEAD ou no índice) soma
- [x] 13.2 — `decidirCommit`: obrigatórios = união dos marcados com o caminho
- [x] 13.3 — O portão imprime a lista unida
- [x] 13.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/guardioes-por-caminho.ts` | novo |
| `tools/processo/harness/guardioes.test.ts` | novo |
| `tools/processo/portao.ts` | alterado |
| `tools/processo/portao-local.ts` | alterado |
| `tools/processo/revisoes.test.ts` | alterado |
| `tools/processo/comando-git.ts` | alterado (`conteudoDoHead`, a leitura do HEAD) |
| `tools/processo/hook-git.ts` | alterado (o `conteudoDoIndice` lê também o HEAD) |
| `tools/processo/hook-git.int.test.ts` | alterado (o guardião do caminho pelo git hook; as fixtures levam os quatro) |

## Testes que provam a regra

Todos os casos de `tabela-de-guardioes.md`, seção "O teste da tabela", menos os do RF16 (14.0), com os literais
escritos no teste. Em resumo:

| Cenário | Tipo | O que prova |
|---|---|---|
| todo arquivo versionado nas cinco pastas, exceto os que casam exceção | unidade | os quatro |
| cada exceção casa ao menos um arquivo | unidade | exceção morta é vermelha |
| um caso por exceção | unidade | o conjunto exato |
| `it.each` dos quatro sufixos em `componentes/ui/` e `galeria/` | unidade | os quatro |
| `@SemEscopo(` no índice / só no HEAD / em nenhum (`componentes/ui/`) | unidade | quatro / quatro / C I |
| citação, um caso por termo e arquivo da tabela; sem citação; citava no HEAD e não no índice | unidade | soma; não soma; soma P |
| `AvisoFila.tsx`; `DialogoDeConfirmacao.tsx` | unidade | P C I; C I |
| `leitura-do-titular.ts`, `estrutura-isolamento.int.test.ts`, `aluno-tutor.spec.ts`, pasta inventada | unidade | os quatro |
| repository alterado sem `tenancy-guardian` marcado e sem rodada dele (`decidirCommit`) | unidade | recusado; com a rodada APROVADO, passa |
| marcado e não pedido pelo caminho | unidade | continua obrigatório |
| o portão imprime a lista unida | unidade | |

Cada regra de casamento leva bloco de mutação (prefixo mais longo, sufixos, `@SemEscopo(` no HEAD e no índice, cada termo
da citação, a união).

## Como testar

- Lista de arquivos versionados: `git ls-files` no teste, filtrado pelas cinco pastas; a exceção morta sai da contagem
  de casamentos por exceção.
- `conteudoDe` injetado: `(arquivo, onde: 'head' | 'indice') => string`; o caso "só no HEAD" passa texto diferente para
  os dois.
- Recusa pelo commit: copiar `tools/processo/revisoes.test.ts › portão do commit › bloqueia revisor obrigatório que nunca rodou`, trocando a marcação pela do caminho.
- Rodar: `npx vitest run --project unidade tools/processo/harness/guardioes.test.ts tools/processo/revisoes.test.ts`.

## Fora do escopo desta tarefa

As linhas do RF16 e a lista do §5(e) (14.0); o texto das skills que falam de marcação (18.0).

## Divergências resolvidas nesta tarefa

Nenhuma. As decisões de desenho que a Tech Spec deixava abertas estão em `techspec.md` §5(b), "No código (13.0)", e em `cenarios.md` (RF15).

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Uma por cláusula do diff. Os blocos de `guardioes-por-caminho.ts` rodam o `harness/guardioes.test.ts` inteiro (leva décimos de segundo); os de `portao.ts`, `portao-local.ts`, `hook-git.ts` e `comando-git.ts` citam o caso de `revisoes.test.ts` ou de `hook-git.int.test.ts` que os prova.

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-const PADRAO: readonly Entrada[] = ['apps/', 'packages/', 'e2e/', 'tools/guardas/', 'tools/testes/'].map((prefixo) => ({ prefixo, guardioes: OS_QUATRO }))
+const PADRAO: readonly Entrada[] = ['packages/', 'e2e/', 'tools/guardas/', 'tools/testes/'].map((prefixo) => ({ prefixo, guardioes: OS_QUATRO }))
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-const PADRAO: readonly Entrada[] = ['apps/', 'packages/', 'e2e/', 'tools/guardas/', 'tools/testes/'].map((prefixo) => ({ prefixo, guardioes: OS_QUATRO }))
+const PADRAO: readonly Entrada[] = ['apps/', 'e2e/', 'tools/guardas/', 'tools/testes/'].map((prefixo) => ({ prefixo, guardioes: OS_QUATRO }))
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-const PADRAO: readonly Entrada[] = ['apps/', 'packages/', 'e2e/', 'tools/guardas/', 'tools/testes/'].map((prefixo) => ({ prefixo, guardioes: OS_QUATRO }))
+const PADRAO: readonly Entrada[] = ['apps/', 'packages/', 'tools/guardas/', 'tools/testes/'].map((prefixo) => ({ prefixo, guardioes: OS_QUATRO }))
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-const PADRAO: readonly Entrada[] = ['apps/', 'packages/', 'e2e/', 'tools/guardas/', 'tools/testes/'].map((prefixo) => ({ prefixo, guardioes: OS_QUATRO }))
+const PADRAO: readonly Entrada[] = ['apps/', 'packages/', 'e2e/', 'tools/testes/'].map((prefixo) => ({ prefixo, guardioes: OS_QUATRO }))
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-const PADRAO: readonly Entrada[] = ['apps/', 'packages/', 'e2e/', 'tools/guardas/', 'tools/testes/'].map((prefixo) => ({ prefixo, guardioes: OS_QUATRO }))
+const PADRAO: readonly Entrada[] = ['apps/', 'packages/', 'e2e/', 'tools/guardas/'].map((prefixo) => ({ prefixo, guardioes: OS_QUATRO }))
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'apps/web/src/componentes/ui/', guardioes: [C, I] },
+  { prefixo: 'apps/web/src/componentes/ui/', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'apps/web/src/componentes/ui/ia/', guardioes: [P, C, I] },
+  { prefixo: 'apps/web/src/componentes/ui/ia/', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'apps/web/src/estilos.css', guardioes: [C] },
+  { prefixo: 'apps/web/src/estilos.css', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'apps/web/src/tema.ts', guardioes: [] },
+  { prefixo: 'apps/web/src/tema.ts', guardioes: [I] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'apps/web/src/estilos.test.ts', guardioes: [] },
+  { prefixo: 'apps/web/src/estilos.test.ts', guardioes: [I] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'apps/web/src/tema.test.ts', guardioes: [] },
+  { prefixo: 'apps/web/src/tema.test.ts', guardioes: [I] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'apps/web/src/contraste.test.ts', guardioes: [] },
+  { prefixo: 'apps/web/src/contraste.test.ts', guardioes: [I] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'apps/web/src/galeria/', guardioes: [P, C] },
+  { prefixo: 'apps/web/src/galeria/', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'apps/web/vite.config.ts', guardioes: [I] },
+  { prefixo: 'apps/web/vite.config.ts', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'apps/web/nome-dos-chunks.ts', guardioes: [I] },
+  { prefixo: 'apps/web/nome-dos-chunks.ts', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'apps/web/nome-dos-chunks.test.ts', guardioes: [I] },
+  { prefixo: 'apps/web/nome-dos-chunks.test.ts', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'apps/web/rebaixar-cor.ts', guardioes: [I] },
+  { prefixo: 'apps/web/rebaixar-cor.ts', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'apps/web/rebaixar-cor.test.ts', guardioes: [I] },
+  { prefixo: 'apps/web/rebaixar-cor.test.ts', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'apps/despachante/', guardioes: [T, P, I] },
+  { prefixo: 'apps/despachante/', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { prefixo: 'infra/', guardioes: [I, P] },
+  { prefixo: 'infra/', guardioes: [] },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  return ENTRADAS.filter((entrada) => arquivo.startsWith(entrada.prefixo)).sort((a, b) => b.prefixo.length - a.prefixo.length)[0]
+  return ENTRADAS.filter((entrada) => arquivo.startsWith(entrada.prefixo)).sort((a, b) => a.prefixo.length - b.prefixo.length)[0]
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  if (!entrada) return []
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  if (entrada.guardioes.length === OS_QUATRO.length) return [...OS_QUATRO]
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  const textos = [conteudoDe(arquivo, 'indice'), conteudoDe(arquivo, 'head')].filter((texto): texto is string => texto !== null)
+  const textos = [conteudoDe(arquivo, 'indice')].filter((texto): texto is string => texto !== null)
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  const textos = [conteudoDe(arquivo, 'indice'), conteudoDe(arquivo, 'head')].filter((texto): texto is string => texto !== null)
+  const textos = [conteudoDe(arquivo, 'head')].filter((texto): texto is string => texto !== null)
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  const textos = [conteudoDe(arquivo, 'indice'), conteudoDe(arquivo, 'head')].filter((texto): texto is string => texto !== null)
+  const textos = [conteudoDe(arquivo, 'indice'), conteudoDe(arquivo, 'head')].filter((texto): texto is string => true)
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-const SUFIXOS_QUE_NUNCA_SAO_EXCECAO = ['.repository.ts', '.controller.ts', '.gateway.ts', '.service.ts']
+const SUFIXOS_QUE_NUNCA_SAO_EXCECAO = ['.controller.ts', '.gateway.ts', '.service.ts']
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-const SUFIXOS_QUE_NUNCA_SAO_EXCECAO = ['.repository.ts', '.controller.ts', '.gateway.ts', '.service.ts']
+const SUFIXOS_QUE_NUNCA_SAO_EXCECAO = ['.repository.ts', '.gateway.ts', '.service.ts']
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-const SUFIXOS_QUE_NUNCA_SAO_EXCECAO = ['.repository.ts', '.controller.ts', '.gateway.ts', '.service.ts']
+const SUFIXOS_QUE_NUNCA_SAO_EXCECAO = ['.repository.ts', '.controller.ts', '.service.ts']
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-const SUFIXOS_QUE_NUNCA_SAO_EXCECAO = ['.repository.ts', '.controller.ts', '.gateway.ts', '.service.ts']
+const SUFIXOS_QUE_NUNCA_SAO_EXCECAO = ['.repository.ts', '.controller.ts', '.gateway.ts']
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  if (SUFIXOS_QUE_NUNCA_SAO_EXCECAO.some((sufixo) => arquivo.endsWith(sufixo)) || textos.some((texto) => texto.includes(SEM_ESCOPO))) return [...OS_QUATRO]
+  if (SUFIXOS_QUE_NUNCA_SAO_EXCECAO.some((sufixo) => arquivo.includes(sufixo)) || textos.some((texto) => texto.includes(SEM_ESCOPO))) return [...OS_QUATRO]
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  if (SUFIXOS_QUE_NUNCA_SAO_EXCECAO.some((sufixo) => arquivo.endsWith(sufixo)) || textos.some((texto) => texto.includes(SEM_ESCOPO))) return [...OS_QUATRO]
+  if (SUFIXOS_QUE_NUNCA_SAO_EXCECAO.some((sufixo) => arquivo.endsWith(sufixo))) return [...OS_QUATRO]
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  return [...entrada.guardioes, ...citados]
+  return [...entrada.guardioes]
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  return [...entrada.guardioes, ...citados]
+  return [...citados]
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /regra\s+10(?!\d)/i, guardiao: T },
+  { termo: /regra\s+10(?!\d)/i, guardiao: C },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /regra\s+10(?!\d)/i, guardiao: T },
+  { termo: /regra\s+10(?!\d), guardiao: T },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /regra\s+10(?!\d)/i, guardiao: T },
+  { termo: /regra\s+11(?!\d)/i, guardiao: T },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /regra\s+10(?!\d)/i, guardiao: T },
+  { termo: /regra\s+10/i, guardiao: T },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /regra\s+10(?!\d)/i, guardiao: T },
+  { termo: /regra 10(?!\d)/i, guardiao: T },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /regra\s+20(?!\d)/i, guardiao: P },
+  { termo: /regra\s+20(?!\d)/i, guardiao: C },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /regra\s+20(?!\d)/i, guardiao: P },
+  { termo: /regra\s+20(?!\d), guardiao: P },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /regra\s+20(?!\d)/i, guardiao: P },
+  { termo: /regra\s+21(?!\d)/i, guardiao: P },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /regra\s+20(?!\d)/i, guardiao: P },
+  { termo: /regra\s+20/i, guardiao: P },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /regra\s+20(?!\d)/i, guardiao: P },
+  { termo: /regra 20(?!\d)/i, guardiao: P },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /lgpd/i, guardiao: P },
+  { termo: /lgpd/i, guardiao: C },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /lgpd/i, guardiao: P },
+  { termo: /lgpd, guardiao: P },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /lgpd/i, guardiao: P },
+  { termo: /lgpx/i, guardiao: P },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /regra\s+70(?!\d)/i, guardiao: C },
+  { termo: /regra\s+70(?!\d)/i, guardiao: I },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /regra\s+70(?!\d)/i, guardiao: C },
+  { termo: /regra\s+70(?!\d), guardiao: C },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /regra\s+70(?!\d)/i, guardiao: C },
+  { termo: /regra\s+71(?!\d)/i, guardiao: C },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /regra\s+70(?!\d)/i, guardiao: C },
+  { termo: /regra\s+70/i, guardiao: C },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /regra\s+70(?!\d)/i, guardiao: C },
+  { termo: /regra 70(?!\d)/i, guardiao: C },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /regra\s+80(?!\d)/i, guardiao: I },
+  { termo: /regra\s+80(?!\d)/i, guardiao: C },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /regra\s+80(?!\d)/i, guardiao: I },
+  { termo: /regra\s+80(?!\d), guardiao: I },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /regra\s+80(?!\d)/i, guardiao: I },
+  { termo: /regra\s+81(?!\d)/i, guardiao: I },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /regra\s+80(?!\d)/i, guardiao: I },
+  { termo: /regra\s+80/i, guardiao: I },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  { termo: /regra\s+80(?!\d)/i, guardiao: I },
+  { termo: /regra 80(?!\d)/i, guardiao: I },
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  const pedidos = new Set(arquivos.flatMap((arquivo) => guardioesDoArquivo(arquivo, conteudoDe)))
+  const pedidos = new Set(arquivos.slice(0, 1).flatMap((arquivo) => guardioesDoArquivo(arquivo, conteudoDe)))
```

```mutacao
arquivo: tools/processo/guardioes-por-caminho.ts
teste: tools/processo/harness/guardioes.test.ts
-  return OS_QUATRO.filter((guardiao) => pedidos.has(guardiao))
+  return [...pedidos]
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › repository alterado sem tenancy-guardian
-  const conteudo = entrada.conteudoDe(caminho, 'indice')
+  const conteudo = entrada.conteudoDe(caminho, 'head')
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › o commit que não leva código não pede guardião
-    obrigatorios: obrigatoriosDoCommit(conteudo, tipoDoDocumento(caminho), entrada.arquivos, entrada.conteudoDe),
+    obrigatorios: obrigatoriosDoCommit(conteudo, tipoDoDocumento(caminho), alterados, entrada.conteudoDe),
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › repository alterado sem tenancy-guardian
-  return [...new Set([...revisoresObrigatorios(conteudo, tipo), ...guardioesDoCaminho(arquivos, conteudoDe)])]
+  return [...new Set([...revisoresObrigatorios(conteudo, tipo)])]
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › marcado e não pedido pelo caminho
-  return [...new Set([...revisoresObrigatorios(conteudo, tipo), ...guardioesDoCaminho(arquivos, conteudoDe)])]
+  return [...new Set([...guardioesDoCaminho(arquivos, conteudoDe)])]
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › o portão imprime a lista unida
-  return [...new Set([...revisoresObrigatorios(conteudo, tipo), ...guardioesDoCaminho(arquivos, conteudoDe)])]
+  return [...revisoresObrigatorios(conteudo, tipo), ...guardioesDoCaminho(arquivos, conteudoDe)]
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › o portão imprime a lista unida
-  return `Revisores obrigatórios: ${obrigatorios.join(', ')}`
+  return `Revisores obrigatórios: ${obrigatorios.join(' ')}`
```

```mutacao
arquivo: tools/processo/portao.ts
teste: tools/processo/revisoes.test.ts › o conteúdo do HEAD, lido do git de verdade
-    if (onde === 'head') return doHead(arquivo)
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/processo/revisoes.test.ts › o portão da tarefa e o subcomando revisores imprimem a lista unida
-  const obrigatorios = obrigatoriosDoCommit(conteudo, tipoDoDocumento(documento), alterados, conteudoDoDisco(raiz))
+  const obrigatorios = obrigatoriosDoCommit(conteudo, tipoDoDocumento(documento), [], conteudoDoDisco(raiz))
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/processo/revisoes.test.ts › o portão da tarefa e o subcomando revisores imprimem a lista unida
   const { bloqueios, linhaResumo } = avaliarPortao({
-    obrigatorios,
+    obrigatorios: obrigatorios.filter((nome) => nome !== 'privacy-guardian'),
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/processo/revisoes.test.ts › o portão da tarefa e o subcomando revisores imprimem a lista unida
-  process.stdout.write(`${linhaDosObrigatorios(obrigatorios)}\n`)
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/processo/revisoes.test.ts › o portão da tarefa e o subcomando revisores imprimem a lista unida
-  process.stdout.write(`\n▶ ${linhaDosObrigatorios(obrigatoriosDoCommit(textoDoDocumento, tipoDoDocumento(documento), arquivosAlterados(raiz), conteudoDoDisco(raiz)))}\n`)
+  process.stdout.write(`\n▶ ${linhaDosObrigatorios(obrigatoriosDoCommit(textoDoDocumento, tipoDoDocumento(documento), [], conteudoDoDisco(raiz)))}\n`)
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/processo/revisoes.test.ts › o portão da tarefa e o subcomando revisores imprimem a lista unida
-  process.stdout.write(`\n▶ ${linhaDosObrigatorios(obrigatoriosDoCommit(textoDoDocumento, tipoDoDocumento(documento), arquivosAlterados(raiz), conteudoDoDisco(raiz)))}\n`)
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › o conteúdo do índice e o do HEAD vêm de onde o nome diz
-    if (onde === 'head') return doHead(arquivo)
```

```mutacao
arquivo: tools/processo/hook-git.ts
teste: tools/processo/hook-git.int.test.ts › o conteúdo do índice e o do HEAD vêm de onde o nome diz
-  execFileSync('git', argumentos, { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: LIMITE_DE_LEITURA_DO_GIT })
+  execFileSync('git', argumentos, { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o conteúdo do HEAD, lido do git de verdade
-      return execFileSync('git', ['show', `HEAD:${arquivo}`], { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: LIMITE_DE_LEITURA_DO_GIT })
+      return execFileSync('git', ['show', `:${arquivo}`], { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: LIMITE_DE_LEITURA_DO_GIT })
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o conteúdo do HEAD, lido do git de verdade
-      return execFileSync('git', ['show', `HEAD:${arquivo}`], { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: LIMITE_DE_LEITURA_DO_GIT })
+      return execFileSync('git', ['show', `HEAD:${arquivo}`], { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o arquivo movido no índice traz os dois caminhos
-  return execFileSync('git', ['diff', '--cached', '--name-only', '--no-renames', '-z'], { cwd: raiz, encoding: 'utf8' }).split('\0').filter(Boolean)
+  return execFileSync('git', ['diff', '--cached', '--name-only', '-z'], { cwd: raiz, encoding: 'utf8' }).split('\0').filter(Boolean)
```

```mutacao
arquivo: tools/processo/comando-git.ts
teste: tools/processo/revisoes.test.ts › o conteúdo do HEAD, lido do git de verdade
     } catch {
-      return null
+      return ''
     }
   }
 }
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| privacy-guardian (1ª) | `startsWith` casa também o vizinho de nome parecido (`apps/web/src/tema.tsx` cai na exceção de `tema.ts` e não pede ninguém); exigir caminho igual quando o prefixo não termina em `/`, e testar `tema.tsx` | Muda o comportamento da tabela ("prefixo sem glob", `techspec.md` §5b). Vai para a 14.0, que toca o mesmo arquivo e a mesma tabela, ou para o `/retro` se o Arquiteto não a quiser lá |
| privacy-guardian (1ª) | A exceção `componentes/ui/` tira o `privacy-guardian` de componente genérico; um componente de `ui/` que passe a mostrar dado de pessoa só o volta a exigir se citar a regra | Decidida na tabela; registrar para o `/retro` |
| tenancy-guardian (1ª) | Considerar `escolaId` e `anoLetivoId` no texto do arquivo como gatilho do `tenancy-guardian` dentro das exceções | Nova regra de casamento, fora do RF15; `/retro`, decisão do Arquiteto |
| conformidade-reviewer (1ª) | `apps/despachante/` dispensa o `conformidade-reviewer`; guarda que proíba importar módulo de nota, correção ou tutor, ou somar C quando aparecer `lancadaPor`, `Nota` ou `Correcao` | Nova regra de casamento ou nova guarda; `/retro` |
| conformidade-reviewer (1ª) | `tools/demonstracao/` (`gerar-material.ts`, material gerado por IA, D71) cai em "o resto de `tools/`" e não pede revisor; dar P C | 14.0: a seção "Fora do código de produto" da tabela é dela |
| test-engineer (1ª) | `PASTAS_DE_CODIGO` não tem `tools/guardas/` nem `tools/testes/`: commit só dessas pastas, sem "(tarefa N.0)", escapa da cobrança | 14.0 (a lista do §5e, fora do escopo desta tarefa); conferir lá se a esteira da 12.0 já fecha o caminho |
| test-engineer (1ª) | `estado.ts:383` entrega `obrigatorios` só com os marcados; o texto das skills não pode prometer outra lista | 18.0, que escreve o texto das skills que falam de marcação |
| test-engineer (1ª) | Dois blocos de mutação ficam vermelhos por `TypeError`, e não pela asserção do conjunto (o que apaga `if (!entrada) return []` e o que troca o filtro por `=> true`) | Informativa: o revisor a aceita ("sem a cláusula o código quebra de fato"). Sem ação |
| test-engineer (1ª) | `guardioes.test.ts:64` afirma que `tools/processo/x.ts` citando a regra não pede ninguém; a 14.0 inverte o caso para P | 14.0 |
| conformidade-reviewer (2ª) | O comentário de `portao-local.ts` (subcomando `revisores`) diz que a lista "pode pedir mais guardiões do que o commit vai cobrar, e nunca menos", mas `arquivosAlterados` (`caducidade.ts`) pula o caminho de origem de rename (`R`/`C`) e o arquivo apagado (`D`), que o commit cobra por usar `--no-renames`. Num arquivo movido, a Mesa pode não chamar um guardião que o commit depois exige (o hook barra, então a regra não fica sem guarda). Incluir a origem na lista, ou corrigir o comentário | Confirmada na leitura de `caducidade.ts`. 14.0 (que toca `portao-local.ts` e `portao.ts` no §5e) ou `/retro`. Não é bloqueante: o commit é o que cobra |
| privacy-guardian (2ª) | Quando o `git show` do HEAD falha, o código devolve `null` sem aviso; um aviso curto, só com o caminho, tornaria a perda da citação visível | `/retro`. Já está escrito no comentário de `conteudoDoHead` (item 6 da r1) |
| privacy-guardian (2ª) | Na 14.0, confirmar que a comparação por começo do nome (`tema.ts` contra `tema.tsx`) foi corrigida e testada | 14.0 (já está na tabela da r1) |
| tenancy-guardian (2ª) | Mantida a da 1ª: `escolaId` e `anoLetivoId` no texto de arquivo em exceção como gatilho do `tenancy-guardian` | `/retro` (já está na tabela da r1) |
| test-engineer (2ª) | O bloco de mutação novo (`13_task.md`, o `--no-renames` de `arquivosPreparados`) cita o teste pelo nome curto; o `it` tem o nome completo ("…, o de origem e o de destino") | Texto de documento, sem efeito no portão. Corrigir quando o documento for tocado de novo (a 14.0 não o toca): `/retro` |
| test-engineer (2ª) | O teste de `arquivosPreparados` em `revisoes.test.ts` depende de o git detectar rename por padrão; com `diff.renames=false` global a mutação passaria em silêncio. Forçar `-c diff.renames=true` ou checar antes | `/retro`: só afeta máquina com configuração global fora do padrão, e o `hook-git.int.test.ts` prova o mesmo lado contra o git de verdade |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 22:37:47 | 2026-10-23 22:38:36 | `privacy-guardian` | 1 | APROVADO | a6d65fc96e3f628dc |
| 2026-10-23 22:37:52 | 2026-10-23 22:38:40 | `revisor-geral` | 1 | APROVADO | a03d488eb26ba63de |
| 2026-10-23 22:37:46 | 2026-10-23 22:38:49 | `tenancy-guardian` | 1 | APROVADO | aba36913efb70d470 |
| 2026-10-23 22:37:49 | 2026-10-23 22:38:59 | `conformidade-reviewer` | 1 | APROVADO | aa9e97aebe4bb77bf |
| 2026-10-23 22:37:50 | 2026-10-23 22:40:23 | `test-engineer` | 1 | APROVADO | ac3fc5147edea1fdb |
| 2026-10-23 22:51:21 | 2026-10-23 22:51:42 | `privacy-guardian` | 2 | APROVADO | a26ffda265783dace |
| 2026-10-23 22:51:17 | 2026-10-23 22:51:47 | `tenancy-guardian` | 2 | APROVADO | a505cda10c42c0b52 |
| 2026-10-23 22:51:26 | 2026-10-23 22:51:54 | `conformidade-reviewer` | 2 | APROVADO | a5aeb2ba005c49d69 |
| 2026-10-23 22:51:35 | 2026-10-23 22:52:06 | `revisor-geral` | 2 | APROVADO | a9fb83129cbce9c31 |
| 2026-10-23 22:51:30 | 2026-10-23 22:52:24 | `test-engineer` | 2 | APROVADO | a308ebec92c87e250 |
