# Tarefa 9.0 — Importar tabela fora de repository reprova o lint

**Funcionalidade:** reengenharia · **Depende de:** 6.0
**Subagentes obrigatórios:** `tenancy-guardian`, `test-engineer`, `revisor-geral`
**Porte:** pequeno

## Objetivo

A guarda `guardas/tabela-so-no-repository` reprova importar de `@educa/nucleo` uma tabela do schema fora de
`*.repository.ts`, de teste e de `packages/nucleo/src/db/**`, e não pode ser desligada por comentário.

## Contexto necessário

- `onda-1a.md` §2, "T6", "Tabela só no repository (9.0)"; `techspec.md` §6; `prd.md` RF9
- Regra 00, item 3; regra 10, item 3
- `tools/guardas/index.mjs`: `guardas.rules`, `REGRAS_DAS_GUARDAS` e `EXCECOES_DAS_GUARDAS`; `tools/guardas/eslint-das-guardas.ts`,
  a segunda passada que ignora `eslint-disable`
- Hoje só `apps/api/src/assistente/time.service.ts` viola, e a 6.0 tira de lá a classe que importa `suspensaoDeFuncao`
- A 13.0 também edita `tools/guardas/index.mjs`: em série

## Subtarefas

- [x] 9.1 — `tools/guardas/tabelas-do-nucleo.mjs`: a lista dos nomes de tabela exportados por `@educa/nucleo`
- [x] 9.2 — A regra, em `tools/guardas/regras-tenant.mjs`, registrada em `index.mjs` e em `REGRAS_DAS_GUARDAS`, cobrindo
  import, alias, reexport e namespace
- [x] 9.3 — Testes: um `describe` em `tools/guardas/guardas.test.ts` com as fixtures, e o teste da lista contra as
  exportações `PgTable`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/guardas/regras-tenant.mjs` | novo |
| `tools/guardas/tabelas-do-nucleo.mjs` | novo |
| `tools/guardas/tabelas-do-nucleo.test.ts` | novo |
| `tools/guardas/index.mjs` | alterado |
| `tools/guardas/guardas.test.ts` | alterado |
| `tools/guardas/__fixtures__/tabela-fora-do-repository.ts` | novo |
| `tools/guardas/regras-ia.mjs` | alterado (o `export` de `especificador`) |
| `tasks/prd-reengenharia/onda-1a.md` | alterado (o registro desta decisão) |
| `TODO.md` | alterado |

## Testes que provam a regra

Unidade.

| Cenário | O que prova | Mutação |
|---|---|---|
| Fixture como `apps/api/src/x/x.service.ts`: `import { escola } from '@educa/nucleo'` | reprova, na linha marcada | tirar a regra da configuração |
| A mesma como `x.repository.ts` | passa no repository | aplicar a regra a `*.repository.ts` |
| A mesma como `x.int.test.ts` | passa em teste | apagar a exceção de teste |
| A mesma como `packages/nucleo/src/db/schema/x.ts` | passa no schema | apagar a exceção de `db/**` |
| A mesma como `infra/scripts/x.ts` e `tools/x.ts` | fora de `apps/*/src` também reprova | restringir a `apps/**` |
| Fixture: `import { escola as e }` | alias não escapa | comparar só o nome local |
| Fixture: `export { escola } from '@educa/nucleo'` num service | reexport não escapa | olhar só `ImportDeclaration` |
| Fixture: `import * as nucleo` e `nucleo.escola` num service | namespace não escapa (ou o limite declarado, com fixture que fixa "passa") | deixar passar o `import * as` |
| Fixture: `import { exigirEscolaDoContexto, type Banco }` num service | nome que não é tabela passa | reprovar todo import do pacote |
| `// eslint-disable-next-line guardas/tabela-so-no-repository` | a segunda passada reprova igual | deixar a regra fora de `REGRAS_DAS_GUARDAS` |
| `tabelas-do-nucleo.mjs` contra as exportações `PgTable`, nos dois sentidos | tabela nova entra, e o que não é tabela sai | apagar `suspensaoDeFuncao` da lista |
| Repositório real: zero violações | vale hoje | devolver o import de `suspensaoDeFuncao` a `time.service.ts` |

Sem isolamento em banco (a trava é estática), concorrência nem log.

## Como testar

- Fixture com marca "reprova: <regra>" e caminho simulado: `tools/guardas/guardas.test.ts › guarda de SDK de provedor de IA ›
  reprova import, alias, subcaminho, export, require, import() e typeof import() em %s` (`lintar`, `marcasDeViolacao`), e
  o par "deixa o mesmo código passar dentro dos adaptadores"
- Comentário que desliga: `guardas.test.ts › guarda desligada por comentário`
- Lista contra o pacote: `apps/api/test/arquitetura.test.ts` usa `is(valor, PgTable)` de `drizzle-orm` sobre `import * as
  nucleo from '@educa/nucleo'`
- Isolado: `npx vitest run --project unidade tools/guardas/guardas.test.ts tools/guardas/tabelas-do-nucleo.test.ts`
- Armadilha: regra em `warn` não reprova (`--max-warnings=0` só no lint inteiro); registre como `error`

## Fora do escopo desta tarefa

O depcruise e as camadas (12.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A guarda não segue o namespace até o membro: reprova `import * as`, o import padrão, o `schema`, o `default` e tudo que carrega o módulo inteiro, onde o pacote está escrito | seguir valor abriu uma forma nova a cada rodada (diagnóstico da 9.0); nenhum arquivo fora das exceções usa essas formas hoje | `onda-1a.md`, T6, "Tabela só no repository (9.0)" |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
      'guardas/sdk-de-ia-so-no-adaptador': 'error',
-      'guardas/tabela-so-no-repository': 'error',
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › o eslint-disable do arquivo inteiro não fura
  ...REGRAS_DE_SDK_DE_IA,
-  ...REGRAS_DE_TENANT,
  ...REGRAS_DE_TESTE,
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › o eslint-disable-next-line de um import só o esconde
  ...REGRAS_DE_SDK_DE_IA,
-  ...REGRAS_DE_TENANT,
  ...REGRAS_DE_TESTE,
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › a guarda de tabela fica entre as de todo arquivo
-export const REGRAS_EM_TODO_ARQUIVO = [...REGRAS_DE_LOG, ...REGRAS_DE_SDK_DE_IA, ...REGRAS_DE_TENANT]
+export const REGRAS_EM_TODO_ARQUIVO = [...REGRAS_DE_LOG, ...REGRAS_DE_SDK_DE_IA]
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › deixa a mesma fixture passar onde a tabela mora
    files: ['**/*.repository.ts'],
-    regras: REGRAS_DE_TENANT,
+    regras: [],
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › deixa a mesma fixture passar onde a tabela mora
    files: ARQUIVOS_DE_TESTE,
-    regras: REGRAS_DE_TENANT,
+    regras: [],
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › deixa a mesma fixture passar onde a tabela mora
    files: ['packages/nucleo/src/db/**'],
-    regras: REGRAS_DE_TENANT,
+    regras: [],
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
-'schema',
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
-'default',
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
-...TABELAS_DO_NUCLEO,
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
-return modulo === PACOTE || (modulo?.startsWith(`${PACOTE}/`) ?? false)
+return (modulo?.startsWith(`${PACOTE}/`) ?? false)
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
-return modulo === PACOTE || (modulo?.startsWith(`${PACOTE}/`) ?? false)
+return modulo === PACOTE
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
-return modulo === PACOTE || (modulo?.startsWith(`${PACOTE}/`) ?? false)
+return modulo === PACOTE || (modulo?.startsWith(PACOTE) ?? false)
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
-?? false
+?? true
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
-no.type === 'Literal' ? no.value : no.name
+no.name
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
 ImportDeclaration(no) {
-if (!ehDoNucleo(no.source)) return
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
-importado.type !== 'ImportSpecifier' ||
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
-NOMES_QUE_LEVAM_TABELA.has(nomeEscrito(importado.imported))
+true
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
 ExportNamedDeclaration(no) {
-if (!ehDoNucleo(no.source)) return
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
-if (NOMES_QUE_LEVAM_TABELA.has(nomeEscrito(reexportado.local)))
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
-'Schema',
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
-no.parent.type === 'ImportDeclaration' ||
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
-|| no.parent.type === 'ExportNamedDeclaration'
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
-if (!ehFonteDeImportPeloNome(no) && ehDoNucleo(no)) denunciar(no)
+if (ehDoNucleo(no)) denunciar(no)
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
-if (!ehFonteDeImportPeloNome(no) && ehDoNucleo(no)) denunciar(no)
+if (!ehFonteDeImportPeloNome(no)) denunciar(no)
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
-if (!ehFonteDeImportPeloNome(no) && ehDoNucleo(no)) denunciar(no)
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
 TemplateLiteral(no) {
-if (ehDoNucleo(no)) denunciar(no)
```

```mutacao
arquivo: tools/guardas/regras-tenant.mjs
teste: tools/guardas/guardas.test.ts › reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote
 TemplateLiteral(no) {
-if (ehDoNucleo(no)) denunciar(no)
+denunciar(no)
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › o repositório de hoje não tem violação
 files: ['tools/guardas/regras-tenant.mjs'],
-regras: REGRAS_DE_TENANT,
+regras: [],
```

```mutacao
arquivo: tools/guardas/tabelas-do-nucleo.mjs
teste: tools/guardas/tabelas-do-nucleo.test.ts › tem toda tabela que o núcleo exporta
  'suboperadorEscola',
-  'suspensaoDeFuncao',
  'tentativaAtividade',
```

```mutacao
arquivo: tools/guardas/tabelas-do-nucleo.mjs
teste: tools/guardas/tabelas-do-nucleo.test.ts › só tem nome que o núcleo exporta como tabela
-  'suspensaoDeFuncao',
+  'suspensaoDeFuncao',
+  'schema',
```

```mutacao
arquivo: tools/guardas/tabelas-do-nucleo.mjs
teste: tools/guardas/tabelas-do-nucleo.test.ts › não repete nome
-  'suspensaoDeFuncao',
+  'suspensaoDeFuncao',
+  'suspensaoDeFuncao',
```

```mutacao
arquivo: apps/api/src/assistente/time.service.ts
teste: tools/guardas/guardas.test.ts › o repositório de hoje não tem violação
-import { type Banco } from '@educa/nucleo'
+import { suspensaoDeFuncao, type Banco } from '@educa/nucleo'
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | "Um helper de teste que não termina em `.test.ts` (por exemplo, em `apps/api/test/`) seria reprovado se importasse tabela. Hoje nenhum importa. Vale um caso que fixe essa decisão, para cada lado, antes que o primeiro helper apareça." | `TODO.md`: o que conta como teste é `ARQUIVOS_DE_TESTE`, compartilhado com as outras guardas; a linha já está lá |
| test-engineer (1ª e 2ª) | "Os nomes de teste citados nos blocos de mutação são prefixos dos nomes reais [...]. O portão aceitou." | Recusada: o portão aceita o prefixo e a mutação prova o mesmo |
| test-engineer (2ª) | "`?? no.argument` é código morto (`regras-tenant.mjs:83`, e o mesmo em `regras-ia.mjs:67`). [...] Apague o trecho, ou deixe-o como está, sabendo disso." | Recusada: a mesma linha está em `regras-ia.mjs`; apagar só num dos dois os deixaria diferentes |
| tenancy-guardian (2ª), test-engineer (2ª), revisor-geral (2ª) | `typeof nucleo.schema.escola` passa; `ehONamespace` sem o tipo do nó; o motivo do limite do `createRequire` | Sem objeto: o diagnóstico da 9.0 tirou o código que seguia o namespace, e o `createRequire` reprova pela chamada com o pacote |
| revisor-geral (2ª) | "Renomeie a variável do laço, por exemplo para `reexportado`." | Aplicada na reescrita do diagnóstico |
| tenancy-guardian (3ª) | "`` require`@educa/nucleo` `` (template com tag) [...] o primeiro não precisa entrar." | Entrou: o `TemplateLiteral` o reprova, e a fixture o fixa |
| test-engineer (3ª) | "Seguem de pé, já registradas: os nomes de teste dos blocos de mutação são prefixos dos nomes reais, e o caso do helper de teste em `apps/api/test/` está no `TODO.md`." | As duas linhas que já estão na tabela |

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
| 2026-10-22 17:07:50 | 2026-10-22 17:08:38 | `revisor-geral` | 1 | APROVADO | a5854e6cda65502be |
| 2026-10-22 17:07:47 | 2026-10-22 17:09:51 | `tenancy-guardian` | 1 | REPROVADO | a9c8c8eb50c7bd881 |
| 2026-10-22 17:07:49 | 2026-10-22 17:09:53 | `test-engineer` | 1 | APROVADO | ac95c242851548361 |
| 2026-10-22 17:21:44 | 2026-10-22 17:22:44 | `tenancy-guardian` | 2 | REPROVADO | aa8563530752c50f8 |
| 2026-10-22 17:21:52 | 2026-10-22 17:22:51 | `revisor-geral` | 2 | APROVADO | a4485e7a3f5f2b6cf |
| 2026-10-22 17:21:48 | 2026-10-22 17:23:52 | `test-engineer` | 2 | REPROVADO | abfb8487440f12fc2 |
| 2026-10-22 17:43:48 | 2026-10-22 17:44:28 | `revisor-geral` | 3 | APROVADO | abb254a7255f7bdb0 |
| 2026-10-22 17:43:32 | 2026-10-22 17:45:18 | `tenancy-guardian` | 3 | REPROVADO | a30e2bec78df7422d |
| 2026-10-22 17:43:41 | 2026-10-22 17:46:04 | `test-engineer` | 3 | REPROVADO | a90238de410550af1 |
| 2026-10-22 18:10:44 | 2026-10-22 18:11:54 | `revisor-geral` | 4 | APROVADO | a09bb07f87cdbf49e |
| 2026-10-22 18:10:28 | 2026-10-22 18:12:14 | `tenancy-guardian` | 4 | APROVADO | aad6a30ecbca1ddc0 |
| 2026-10-22 18:10:37 | 2026-10-22 18:12:16 | `test-engineer` | 4 | APROVADO | a83d863c9627b3818 |
