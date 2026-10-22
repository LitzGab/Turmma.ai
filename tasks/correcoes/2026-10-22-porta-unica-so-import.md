# Correção — O teste da porta única de auditoria acusa quem só cita o caminho do módulo de inserção

**Origem:** uso (a 6.0 da reengenharia, `tools/guardas/escopo-dos-repositories.ts`, derrubou o teste ao citar o caminho como dado)
**Subagentes obrigatórios:** `privacy-guardian`
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

`npx vitest run --project unidade packages/nucleo/src/auditoria/porta-unica.test.ts` fica vermelho em
"só o RegistroDeAuditoria importa o módulo de inserção, e o pacote não o exporta":

```
- "packages/nucleo/src/auditoria/registro-de-auditoria.ts",
+ "tools/guardas/escopo-dos-repositories.ts",
```

`tools/guardas/escopo-dos-repositories.ts` (6.0) só escreve `arquivo: 'packages/nucleo/src/auditoria/insercao-de-auditoria.repository.ts'`,
um caminho como dado da lista fechada de repositories sem escopo. Não importa o módulo.

## Fora desta correção

M apps/api/src/assistente/time.service.ts, M tasks/prd-reengenharia/6_task.md, M tasks/prd-reengenharia/onda-1a.md,
?? apps/api/src/assistente/suspensoes-da-escola.repository.ts, ?? tools/guardas/__fixtures__/repositories/,
?? tools/guardas/escopo-dos-repositories.ts, ?? tools/guardas/repositories-com-escopo.test.ts
(a 6.0, em curso: ficam na árvore, fora da revisão e do commit desta correção).

## Causa

O filtro do teste é `/insercao-de-auditoria/.test(texto)`: casa **qualquer menção** ao nome, em string, comentário
ou caminho de dado, e o teste afirma "importa". A regra que importa é a importação; o resto é texto. A varredura
de código olha `apps`, `packages`, `infra` e `tools`, e `tools/guardas` passou a ter um arquivo que cita o caminho.

## Teste que reproduz

`packages/nucleo/src/auditoria/porta-unica.test.ts`:
- "só o RegistroDeAuditoria importa o módulo de inserção, e o pacote não o exporta": vermelho antes (acusa
  `tools/guardas/escopo-dos-repositories.ts`), verde depois;
- "a varredura de importação pega cada forma de importar e deixa o caminho citado como dado": o padrão novo,
  com `from` (inclusive `import type`, `export … from` e `export * from`), `import()`, `require()` e `import 'x'`
  como positivos, e o caminho em `arquivo: '…'`, a constante e o comentário como negativos.

## Correção

O filtro passa a `importaOModuloDeInsercao(texto)`, que aplica `IMPORTA_O_MODULO_DE_INSERCAO`: o nome **dentro de um
literal de texto** que vem logo depois de `from`, `import(`, `require(` ou `import`. A classe `[^'"`\n]*` mantém o nome
no mesmo literal (sem atravessar aspa nem linha) e o `\1` só fecha com a aspa que abriu. O nome do módulo continua
inteiro, sem quebrar em pedaços. `export … from` entra pelo `from`. A regra da escrita (`ESCRITA_NA_AUDITORIA`) e a da
tabela (`IMPORTA_A_TABELA`) não mudam.

Decisão escrita no comentário do padrão: a importação dinâmica com o caminho montado (`import(base + '…')`) fica de
fora, e a gravação por ela é pega por `ESCRITA_NA_AUDITORIA`. O padrão erra para o lado seguro num caso: um literal
que traz `from` e, dentro dele, outro literal com o nome (`"veio from 'x/insercao-de-auditoria'"`) é acusado.

**Rodada 1 (ordem de recomendações):** o predicado virou função, usada no filtro e no teste da varredura, de modo que a
mutação do padrão cai no teste que não depende de arquivo fora da correção (a antiga mutação do filtro só ficava
vermelha por causa de `tools/guardas/escopo-dos-repositories.ts`, da 6.0); a mutação do filtro agora tira o predicado.
Item 3: `'texto from ' + 'outra/insercao-de-auditoria'` dá **falso** no padrão (não é acusado, ao contrário do que o
revisor supôs); o caso que acusa a mais é o do literal dentro do literal, registrado no teste.

## Mutações

```mutacao
arquivo: packages/nucleo/src/auditoria/porta-unica.test.ts
teste: packages/nucleo/src/auditoria/porta-unica.test.ts › a varredura de importação pega cada forma de importar e deixa o caminho citado como dado
- return IMPORTA_O_MODULO_DE_INSERCAO.test(texto)
+ return /insercao-de-auditoria/.test(texto)
```

```mutacao
arquivo: packages/nucleo/src/auditoria/porta-unica.test.ts
teste: packages/nucleo/src/auditoria/porta-unica.test.ts › só o RegistroDeAuditoria importa o módulo de inserção, e o pacote não o exporta
- .filter((arquivo) => arquivo.caminho !== MODULO_DA_INSERCAO && importaOModuloDeInsercao(arquivo.texto))
+ .filter((arquivo) => arquivo.caminho !== MODULO_DA_INSERCAO)
```

```mutacao
arquivo: packages/nucleo/src/auditoria/porta-unica.test.ts
teste: packages/nucleo/src/auditoria/porta-unica.test.ts › a varredura de importação pega cada forma de importar e deixa o caminho citado como dado
- const IMPORTA_O_MODULO_DE_INSERCAO = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)(['"`])[^'"`\n]*insercao-de-auditoria[^'"`\n]*\1/
+ const IMPORTA_O_MODULO_DE_INSERCAO = /(?:\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)(['"`])[^'"`\n]*insercao-de-auditoria[^'"`\n]*\1/
```

```mutacao
arquivo: packages/nucleo/src/auditoria/porta-unica.test.ts
teste: packages/nucleo/src/auditoria/porta-unica.test.ts › a varredura de importação pega cada forma de importar e deixa o caminho citado como dado
- const IMPORTA_O_MODULO_DE_INSERCAO = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)(['"`])[^'"`\n]*insercao-de-auditoria[^'"`\n]*\1/
+ const IMPORTA_O_MODULO_DE_INSERCAO = /(?:\bfrom\s*|\brequire\s*\(\s*|\bimport\s+)(['"`])[^'"`\n]*insercao-de-auditoria[^'"`\n]*\1/
```

```mutacao
arquivo: packages/nucleo/src/auditoria/porta-unica.test.ts
teste: packages/nucleo/src/auditoria/porta-unica.test.ts › a varredura de importação pega cada forma de importar e deixa o caminho citado como dado
- const IMPORTA_O_MODULO_DE_INSERCAO = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)(['"`])[^'"`\n]*insercao-de-auditoria[^'"`\n]*\1/
+ const IMPORTA_O_MODULO_DE_INSERCAO = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"`])[^'"`\n]*insercao-de-auditoria[^'"`\n]*\1/
```

```mutacao
arquivo: packages/nucleo/src/auditoria/porta-unica.test.ts
teste: packages/nucleo/src/auditoria/porta-unica.test.ts › a varredura de importação pega cada forma de importar e deixa o caminho citado como dado
- const IMPORTA_O_MODULO_DE_INSERCAO = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)(['"`])[^'"`\n]*insercao-de-auditoria[^'"`\n]*\1/
+ const IMPORTA_O_MODULO_DE_INSERCAO = /(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*)(['"`])[^'"`\n]*insercao-de-auditoria[^'"`\n]*\1/
```

## Sem aplicar

Copiado das ordens da Mesa (`.processo/ordens/2026-10-22-porta-unica-so-import-r1.md` e `-r2.md`).

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| privacy-guardian (1ª) | A varredura só deixa de fora arquivo terminado em `.test.ts`; `.test.tsx` ou `.spec.ts` que citasse o módulo seria acusado como código. Alinhar com o filtro das outras guardas | Já era assim antes desta correção, e `arquivosDeCodigo` serve a três testes do arquivo: mudar o filtro muda o que os três varrem. `TODO.md`, uma linha, para a próxima tarefa que mexa em `arquivosDeCodigo` |

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (2ª) | O `\1` do padrão continua sem efeito que um teste veja (a classe `[^'"`\n]*` exclui todas as aspas, e só diferiria num literal aberto e fechado com aspas diferentes, que não é código válido). O texto já não promete mais do que isso | O próprio revisor diz que não precisa mudar nada. Registro para o `/retro`; sem tarefa |
| privacy-guardian (1ª), já na r1 | `.test.tsx` e `.spec.ts` fora do filtro de `arquivosDeCodigo` | `TODO.md`, uma linha, para a próxima tarefa que mexa em `arquivosDeCodigo` (ver a tabela da r1) |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-22 12:31:31 | 2026-10-22 12:32:02 | `privacy-guardian` | 1 | APROVADO | a7b3a9e8cc2c6fcfe |
| 2026-10-22 12:31:33 | 2026-10-22 12:32:28 | `test-engineer` | 1 | APROVADO | ac15604987421e933 |
| 2026-10-22 12:36:52 | 2026-10-22 12:37:24 | `test-engineer` | 2 | APROVADO | afc5707aa908ccc56 |
