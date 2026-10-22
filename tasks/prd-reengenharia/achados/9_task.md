# Achados das revisões — `tasks/prd-reengenharia/9_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 17:08:38 · `tasks/prd-reengenharia/9_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

O que conferi:
- **Escopo.** A tarefa entrega 9.1 a 9.3 e mexe só nos seis arquivos previstos. Nada entra na 12.0 (depcruise e camadas) nem na 13.0.
- **Tech Spec.** Bate com `onda-1a.md` T6, "Tabela só no repository (9.0)", e com `techspec.md` §6. A seção de divergências diz "nenhuma", e nada no código contradiz isso.
- **Regras.** A regra está registrada como `error`, entra em `REGRAS_DAS_GUARDAS` (então a passada que ignora comentário também a roda) e em `REGRAS_EM_TODO_ARQUIVO`. As três exceções ficam em `EXCECOES_DAS_GUARDAS`, e o teste de configuração as fixa.
- **Teste e mutação.** O teste "o repositório de hoje não tem violação" vale para o código atual. A mutação que devolve `suspensaoDeFuncao` a `apps/api/src/assistente/time.service.ts:1` tem o contexto certo no arquivo.

Recomendações (nenhuma bloqueia):
1. **Import dinâmico escapa.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/regras-tenant.mjs:43-75`, `const { escola } = await import('@educa/nucleo')` e `require('@educa/nucleo').escola` passam sem aviso. A guarda irmã de SDK de IA cobre `require` e `import()`. A tarefa só pede import, alias, reexport e namespace, e por isso não bloqueia. Vale cobrir os dois casos, ou escrever esse limite no comentário do topo, que hoje só cita o namespace passado adiante.
2. **Import relativo dentro do núcleo não é coberto.** Dentro de `packages/nucleo/src`, fora de `db/`, a regra só olha o especificador `@educa/nucleo`. Um `*.service.ts` do núcleo que importa a tabela por `../db/schema` passa sem aviso. Fica fora do texto da 9.0. Sugiro registrar isso como alvo da 12.0 (depcruise), para não ficar furo silencioso.
3. **Diretiva do teste diferente da tabela da tarefa.** O teste "o eslint-disable da guarda de tabela não fura" (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/guardas.test.ts:322`) usa `/* eslint-disable … */` no arquivo inteiro. A tabela da tarefa cita `// eslint-disable-next-line`. Para a segunda passada o efeito é o mesmo, mas o caso escrito na tabela é outro.

## tenancy-guardian · 1ª rodada · REPROVADO · 2026-10-22 17:09:51 · `tasks/prd-reengenharia/9_task.md`

VEREDITO: REPROVADO

Tabelas verificadas: nenhuma tabela nova nesta tarefa. Conferi `TABELAS_DO_NUCLEO` contra as exportações `PgTable` do núcleo, nos dois sentidos, com `tools/guardas/tabelas-do-nucleo.test.ts`.

Queries verificadas: nenhuma query nova. A tarefa cria uma guarda de lint, e auditei a cobertura dela. Testei três formas de contornar a guarda, simulando um arquivo `apps/api/src/x/x.service.ts` com o ESLint do repositório. Nas três a guarda não reprovou nada.

Teste de isolamento: presente e efetivo para o que a fixture cobre. Os 109 casos passam, e as mutações declaradas derrubam os testes citados. Mas a guarda deixa três caminhos abertos (abaixo).

Bloqueantes:

1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/regras-tenant.mjs:45-51`. Basta importar o objeto `schema`, que traz todas as tabelas, e a guarda deixa passar:
   ```ts
   import { schema } from '@educa/nucleo'
   b.select().from(schema.escola)
   ```
   O pacote exporta `schema` em `packages/nucleo/src/db/banco.ts:37`, e é a forma que a documentação do Drizzle ensina. A tarefa pede que o namespace não escape, e o argumento do limite declarado (linha 11, "o nome da tabela continua escrito") não vale aqui: `escola` está escrito e não é pego. Hoje ninguém importa `schema` fora de `db/` (`git grep` vazio), então cobrir isso não reprova nenhum import legítimo.
   **Correção exigida:** quando `schema` for importado de `@educa/nucleo`, inclusive com apelido, tratar o nome local como namespace. Assim `schema.escola`, `schema['escola']`, `const { escola } = schema` e `typeof schema.escola` reprovam. A alternativa é reprovar o próprio import de `schema` fora das exceções. Levar isso para a fixture com marca `reprova:` e acrescentar a mutação. Corrigir também a frase de `tools/guardas/tabelas-do-nucleo.test.ts:23`, que chama de "legítimo" um import que é exatamente esse caminho.

2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/regras-tenant.mjs:57-59` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/__fixtures__/tabela-fora-do-repository.ts:17`. O comentário da linha 57 diz que, depois de `export * as n from '@educa/nucleo'`, o arquivo que importa `n` é quem fica coberto. Não é verdade. O consumidor faz `import { n } from './ponte'` e depois `n.escola`, e a guarda não reprova porque a origem não é `@educa/nucleo`. A fixture fixa esse caso como "passa" com uma justificativa errada. O `import('@educa/nucleo')` dinâmico também passa (`(await import('@educa/nucleo')).escola`), e ele não aparece nem como limite declarado. A guarda de SDK de IA já cobre `import()`.
   **Correção exigida:** reprovar `export * as … from '@educa/nucleo'` e o `ImportExpression` de `@educa/nucleo` fora das exceções. Nenhum dos dois é usado no repositório hoje. A outra opção é declarar os dois no limite da linha 11, com fixture que fixe "passa" pelo motivo certo. Nos dois casos, a frase falsa da linha 57 tem de sair.

Recomendações:
- O `Banco` injetado no service também alcança tabela sem import nenhum, pela consulta relacional (`banco.query.turma.findMany()`) ou por SQL cru (`sql\`…\``). Uma guarda de import não pega isso, e cabe à 12.0 (camadas) impedir que o `Banco` chegue a service ou controller. Vale registrar isso como limite no cabeçalho de `regras-tenant.mjs`.
- Import relativo de `db/schema/*` dentro de `packages/nucleo/src`, fora de repository, fica de fora da guarda, como a spec pede. Hoje só entram constantes (`auditoria/acoes.ts:40-41`). Também vale registrar como limite.

## test-engineer · 1ª rodada · APROVADO · 2026-10-22 17:09:53 · `tasks/prd-reengenharia/9_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** a tarefa é uma guarda estática de lint, então isolamento em banco, concorrência e log não se aplicam, como o próprio documento diz.
- Caminho feliz: um service que importa uma tabela de `@educa/nucleo` reprova na linha marcada.
- Exceções: passa em `*.repository.ts`, em teste e em `packages/nucleo/src/db/**`.
- Fora de `apps/*/src` também reprova: `infra/scripts`, `tools`, `apps/worker/src` e um service dentro do próprio núcleo.
- Formas de escapar: apelido, reexport (com nome, `type` e `export *`), namespace (`.`, `['…']`, `typeof`, desestruturação) e import `type`.
- Nome do pacote que não é tabela passa.
- O mesmo nome vindo de outro pacote passa.
- A chave por variável (`nucleo[chave]`) não é tomada como nome de tabela.
- `eslint-disable` não desliga a guarda na segunda passada.
- A lista de tabelas confere com as exportações `PgTable` nos dois sentidos, sem nome repetido.
- O repositório de hoje tem zero violações.

**Cobertos:** cada linha da tabela de testes tem o seu caso.
- Linhas 1 a 5: `guardas.test.ts › guarda de tabela fora do repository › reprova importar, apelidar, reexportar e acessar pelo namespace a tabela do núcleo em %s` (seis caminhos) e `deixa a mesma fixture passar onde a tabela mora: %s` (sete caminhos).
- Linhas 6 a 9: a fixture `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/__fixtures__/tabela-fora-do-repository.ts`, conferida com `toEqual(marcasDeViolacao(...))`. A igualdade exata faz o falso positivo também ficar vermelho, então os nomes que não são tabela (linhas 8, 19, 28–29, 39 e 43) provam a linha 9.
- Linha 10: `o eslint-disable da guarda de tabela não fura`.
- Linha 11: os três casos de `tabelas-do-nucleo.test.ts`.
- Linha 12: `o repositório de hoje não tem violação`.
- A configuração tem dois testes: `as únicas exceções são…` e `a guarda de tabela fica entre as de todo arquivo…`. O segundo é o que faz o `it.each` de "todas as guardas … ligadas como erro" cobrir a regra nova.

**Mutações:** conferi as 32 contra o `git diff`. Toda cláusula nova de `regras-tenant.mjs`, de `index.mjs` e de `tabelas-do-nucleo.mjs` tem bloco, e cada uma cai numa linha da fixture que a distingue. Exemplos:
- `!computada` cai em `nucleo[anoLetivo]`.
- A conferência do pacote em `ExportNamedDeclaration` cai em `export { trecho }` e no `registroAcesso` de outro pacote.
- O laço da desestruturação cai em `escola` e `exigirAnoEmCurso` na mesma linha 43.

Três ficam vermelhas por exceção do ESLint, e não por marca a mais ou a menos:
- `!chave` cai no `...resto`.
- `init === null` cai no `let semValor`.
- `ObjectPattern` cai no `const copia = nucleo`.

Nas três é o motivo certo: a cláusula existe justamente para aquele nó.

**O que rodei:** `npx vitest run --project unidade tools/guardas/guardas.test.ts tools/guardas/tabelas-do-nucleo.test.ts` deu 109 de 109 verdes em 7,6 s. Não há `.skip`, não há mock e não há chamada a provedor.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `tools/guardas/guardas.test.ts:322`, o teste de "não fura" usa `/* eslint-disable … */` no arquivo inteiro, e a tabela da tarefa (linha 55) fala em `// eslint-disable-next-line`. A segunda passada ignora qualquer comentário (`allowInlineConfig: false`), então a prova vale. Mesmo assim, alinhe a forma do comentário com o documento, ou cubra as duas formas com um `it.each`.
2. `regras-tenant.mjs` não segue `await import('@educa/nucleo')` nem `require(...)`. Assim, `const { escola } = await import('@educa/nucleo')` escapa da guarda. A guarda de SDK de IA cobre esses dois casos. A spec não os exige, mas falta pelo menos declarar esse limite no comentário do topo, junto do limite do namespace, e travá-lo com uma linha sem marca na fixture.
3. Dentro do próprio núcleo, um service fora de `db/**` pode importar a tabela pelo caminho relativo (`'../db/schema/…'`) e a guarda não vê, porque ela só olha o `@educa/nucleo`. Hoje só `packages/nucleo/src/auditoria/acoes.ts` faz esse import, e só traz constantes (`PROVEDORES_EXTERNOS`, `TIPOS_DE_REDE`). Fica para a 12.0 (depcruise e camadas) ou para o `TODO.md`.
4. Um helper de teste que não termina em `.test.ts` (por exemplo, em `apps/api/test/`) seria reprovado se importasse tabela. Hoje nenhum importa. Vale um caso que fixe essa decisão, para cada lado, antes que o primeiro helper apareça.
5. Os nomes de teste citados nos blocos de mutação são prefixos dos nomes reais, que terminam em ` em %s`, `: %s` e no texto depois de `:`. O portão aceitou. Usar o nome inteiro evita ambiguidade se outro caso começar igual.

Arquivos auditados, na pasta `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/`:
- `tools/guardas/regras-tenant.mjs`
- `tools/guardas/tabelas-do-nucleo.mjs`
- `tools/guardas/tabelas-do-nucleo.test.ts`
- `tools/guardas/guardas.test.ts`
- `tools/guardas/index.mjs`
- `tools/guardas/__fixtures__/tabela-fora-do-repository.ts`
- `tasks/prd-reengenharia/9_task.md`

## tenancy-guardian · 2ª rodada · REPROVADO · 2026-10-22 17:22:44 · `tasks/prd-reengenharia/9_task.md`

VEREDITO: REPROVADO

**Tabelas verificadas:** nenhuma tabela nova nesta tarefa. O `TABELAS_DO_NUCLEO` não mudou desde a 1ª rodada, e `tabelas-do-nucleo.test.ts` continua conferindo a lista nos dois sentidos.

**Queries verificadas:** nenhuma query nova. Auditei o diff a2c0b55 → c800361 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/regras-tenant.mjs` e da fixture. Os 110 testes passam (`vitest --project unidade` nos dois arquivos). Rodei também o ESLint do repositório contra `apps/api/src/x/x.service.ts` com dez formas de contornar a guarda.

**Correções da 1ª rodada:**
- **1 (`schema` como namespace): feita.** Reprovam `schema.escola`, `esquema['usuario']`, `const { escola } = schema`, `typeof schema.vinculo`, `nucleo.schema.escola`, `nucleo['schema']['turma']`, `schema?.escola` e `const { ['escola']: e } = schema`. A fixture tem as marcas `reprova:`, as mutações estão no documento e a frase de `tabelas-do-nucleo.test.ts:23` foi corrigida.
- **2 (`export * as` e `import()`): feita.** `export * as … from '@educa/nucleo'`, `import()`, `typeof import()` e `require()` reprovam, e o caso de outro pacote passa. A frase falsa saiu.
- **Recomendações aplicadas:** o cabeçalho agora declara o limite do `Banco` (consulta relacional e SQL cru) e o do import relativo dentro do núcleo.

**Teste de isolamento:** presente e efetivo para o que a fixture cobre. Falta o caso do bloqueante abaixo.

**Bloqueantes:**

1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/regras-tenant.mjs:73-76`
   - **O que está errado:** `export { schema } from '@educa/nucleo'` e `export { schema as esquema } from '@educa/nucleo'` passam sem aviso (testado com o ESLint do repositório). O `ExportNamedDeclaration` só denuncia nome de tabela. Reexportar o objeto `schema` leva todas as tabelas de uma vez, e o consumidor faz `import { schema } from './ponte'` e depois `schema.escola` sem ser visto. É o mesmo furo do `export * as n from '@educa/nucleo'` que a correção 2 mandou fechar, agora pelo objeto que a correção 1 passou a tratar como namespace. Ele também não está entre os limites declarados no cabeçalho, e o pacote aparece escrito no próprio arquivo, então a guarda consegue ver.
   - **Correção exigida:**
     - Em `ExportNamedDeclaration` com origem `@educa/nucleo`, denunciar o especificador cujo `local` seja `schema`, inclusive com apelido no `exported`.
     - Acrescentar à fixture `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/__fixtures__/tabela-fora-do-repository.ts` as linhas `export { schema } from '@educa/nucleo' // reprova: …` e `export { schema as … } from '@educa/nucleo' // reprova: …`, mais uma linha sem marca com `schema` reexportado de `outro-pacote`.
     - Declarar a mutação que tira a cláusula nova.

**Recomendações:**
- `import { schema } from '@educa/nucleo'` seguido de `export { schema }` também passa. Pelo cabeçalho, isso é "namespace passado adiante", então não bloqueia. Fechar junto do bloqueante custa uma linha: o `ExportSpecifier` sem `source` cujo `local` esteja em `namespaces`. A alternativa é citar esse caso nominalmente no limite declarado.
- `typeof nucleo.schema.escola` passa. O `TSQualifiedName` só olha `left.name`, e em `nucleo.schema.escola` o `left` é outro `TSQualifiedName`. Como é só tipo e não dá acesso à tabela em runtime, não bloqueia. Mesmo assim, o cabeçalho diz que `nucleo.schema` é tratado como namespace, e no tipo não é: cubra com a mesma recursão do `ehONamespace` ou declare o limite.
- `ehONamespace` checa `namespaces.has(no.name)` sem exigir `no.type === 'Identifier'`. Hoje não erra, mas vale explicitar o tipo, como estava antes.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 17:22:51 · `tasks/prd-reengenharia/9_task.md`

**VEREDITO: APROVADO**

**Escopo:** respeitado. As cinco correções da ordem foram feitas, e nada entra na 12.0 nem na 13.0.
- **Bloqueante 1 do `tenancy-guardian` (objeto `schema` como namespace):** a guarda agora pega o `import { schema }`, também com apelido, e o `nucleo.schema`. Reprovam `schema.escola`, `esquema['usuario']`, `typeof schema.vinculo`, a desestruturação e `nucleo['schema']['turma']`. Os nomes que não são tabela e o `schema` vindo de outro pacote passam (fixture, linhas 11-12 e 35-52). A frase de `tabelas-do-nucleo.test.ts:23` foi corrigida.
- **Bloqueante 2 do `tenancy-guardian` (`export * as`, `import()`, `require`):** a guarda agora reprova `export * as … from '@educa/nucleo'`, o `import()`, o `typeof import()` e o `require()` do pacote. A frase falsa do antigo comentário da linha 57 saiu (`regras-tenant.mjs:77-86`; fixture, linhas 19-20 e 54-64).
- **Limites no cabeçalho:** `createRequire`, a ponte por `./ponte`, o `Banco` injetado e o import relativo de `db/schema` dentro do núcleo estão declarados, e os dois últimos apontam para a 12.0 (`regras-tenant.mjs:14-22`).
- **Os dois formatos de `eslint-disable`:** cada um tem o seu teste (`guardas.test.ts:322` e `:333`). O cálculo `escondida + 2` aponta para a linha certa.
- **Linha no `TODO.md`:** está escrita, para o helper de teste que não termina em `.test.ts`.
- **`tools/guardas/regras-ia.mjs`:** a única mudança é o `export` de `especificador`, para reaproveitar o helper em vez de duplicá-lo. Está dentro do escopo.

**Aderência à Tech Spec:** ok.

**Portão local:** carimbo válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo).

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Nome que esconde outro:** em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/regras-tenant.mjs:75`, o laço `for (const especificador of no.specifiers)` esconde a função `especificador` importada na linha 1. Hoje funciona, mas confunde quem lê. Renomeie a variável do laço, por exemplo para `reexportado`.
2. **Tipo pelo `nucleo.schema` não é pego:** `TSQualifiedName` (`regras-tenant.mjs:93`) só olha `no.left.name`, então `typeof nucleo.schema.escola` passa. A versão com valor, `nucleo.schema.escola`, é pega. O risco é baixo, porque é só tipo e não monta query, mas falta declarar isso como limite ou cobrir pelo `ehONamespace`.
3. **Disjunção sem mutação:** a primeira parte do `ehONamespace` (`namespaces.has(no.name) ||`, `regras-tenant.mjs:57`) mudou nesta rodada e não tem bloco de mutação. Isso é da área do `test-engineer`; fica só o aviso.
4. **Arquivos previstos:** acrescentar `tools/guardas/regras-ia.mjs` (alterado) à tabela de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tasks/prd-reengenharia/9_task.md`, para que o arquivo do commit e o documento batam.

## test-engineer · 2ª rodada · REPROVADO · 2026-10-22 17:23:52 · `tasks/prd-reengenharia/9_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** a 9.0 é uma guarda estática de lint. Isolamento em banco, concorrência e log não se aplicam, como o documento diz. Os cenários são as 12 linhas da tabela, mais o que a correção da 2ª rodada acrescentou: `schema` tratado como namespace, `export * as`, `import()`, `typeof import()`, `require()` e as duas formas de `eslint-disable`.

**Cobertos:**
- **Pedidos da rodada anterior, todos feitos:**
  - `schema` como namespace: `import { schema }`, o apelido, `nucleo.schema`, `nucleo['schema']`, `typeof schema.x` e a desestruturação. Estão nas linhas 11, 35–36 e 43–50 da fixture, com as linhas sem marca que distinguem cada cláusula.
  - `export * as` reprova (linha 19), e a linha 20 é o par de outro pacote.
  - `import()`, `require()` e `typeof import()`: linhas 55–63, com os pares `outro-pacote`, `require()` e `carregar(...)`.
  - O `createRequire` ficou como limite declarado.
  - As duas formas de `eslint-disable`:
    - `o eslint-disable do arquivo inteiro não fura`.
    - `o eslint-disable-next-line de um import só o esconde…`. Ele prova os dois lados: o ESLint comum perde exatamente a linha `escondida + 2`, e a passada das guardas devolve todas as marcas.
  - A linha do `TODO.md` foi escrita.
  - A frase falsa do `ExportAllDeclaration` saiu.
- **Mutações:** conferi os blocos novos contra o diff. Cada cláusula nova de `regras-tenant.mjs` tem bloco, e cada um cai numa linha da fixture que a distingue:
  - `!== PACOTE` cai em `esquemaDeOutro`.
  - `namespaces.add('nenhum')` cai em `esquema['usuario']`.
  - `ehONamespace` sem o tipo do nó fica vermelho por exceção: a recursão lê `.object` de um `Identifier`. É o motivo certo.
  - O nome `schema` cai em `nucleo.exigirEscolaDoContexto.escola`.
  - `ehONamespace(no.object)` cai em `outroPacote.schema.escola`.
  - `require` cai em `carregar('@educa/nucleo')`.
  - A conferência do pacote em `denunciarPacote` cai em `require('outro-pacote')`.
  - A conferência do pacote em `ExportAllDeclaration` cai em `export * from 'outro-pacote'`.
- **Rodei** `npx vitest run --project unidade tools/guardas/guardas.test.ts tools/guardas/tabelas-do-nucleo.test.ts`: 110 de 110 verdes. Não há `.skip`, mock nem provedor.

**Bloqueantes:**
1. O `schema` reexportado escapa: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/regras-tenant.mjs:73-76`.
   - **O furo:** `export { schema } from '@educa/nucleo'` (ou `export { schema as tudo } from …`) num service passa. O `ExportNamedDeclaration` só pergunta `ehTabela(local)`, e `schema` não é tabela.
   - **Por que bloqueia:** é o mesmo caminho que a correção acabou de fechar no `export * as todoOPacote from '@educa/nucleo'`. O arquivo-ponte leva todas as tabelas, e quem importa dele faz `t.escola` sem que a guarda veja. O cabeçalho (linhas 9–12) diz que `schema` é tratado como namespace e que o que "leva todas de uma vez" reprova. Mesmo assim esse caso não reprova, não está entre os limites declarados (linhas 14–22) e nenhuma linha da fixture o fixa. A linha 52 da tabela ("reexport não escapa") fica sem prova para o objeto que a própria correção passou a tratar como namespace.
   - **Correção exigida:**
     - Reprovar o especificador de `export { … } from '@educa/nucleo'` cujo nome local seja `NOME_DO_OBJETO_SCHEMA`, além das tabelas.
     - Pôr na fixture `export { schema as tudoDoSchema } from '@educa/nucleo' // reprova: …`.
     - Acrescentar o bloco de mutação da cláusula nova.
     - Declarar no cabeçalho o `import { schema } …; export { schema }` sem `from`: ele cabe em "passado adiante", que hoje só cita `usar(nucleo)` e `const outro = nucleo`.

**Recomendações:**
1. **`typeof nucleo.schema.escola` passa** (`regras-tenant.mjs:92-94`). O `TSQualifiedName` só olha `no.left.name`, e o `left` aninhado é outro `TSQualifiedName`. O cabeçalho promete `nucleo.schema` como namespace. Só tipo não monta query, por isso não bloqueia. Mesmo assim vale seguir o `left` recursivamente, como o `ehONamespace`, com uma linha na fixture.
2. **O motivo do limite do `createRequire` está errado** (`regras-tenant.mjs:17-18`). O comentário diz que ele "não tem o pacote escrito no import", mas `createRequire(…)('@educa/nucleo')` tem o pacote escrito, e a guarda irmã já o cobre (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/regras-ia.mjs:63-65`). Copiar as duas linhas fecha o limite. Se não copiar, corrija o motivo.
3. **`?? no.argument` é código morto** (`regras-tenant.mjs:83`, e o mesmo em `regras-ia.mjs:67`). No `@typescript-eslint/types` 8.70.0, `source` é sempre `StringLiteral`. O `argument`, marcado como obsoleto, é um `TSLiteralType`, que o `especificador` nunca resolve. Nenhuma mutação o distinguiria. Apague o trecho, ou deixe-o como está, sabendo disso.
4. **A tabela "Recomendações sem aplicar" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tasks/prd-reengenharia/9_task.md:419-420` está vazia.** Falta pelo menos a minha recomendação 4 da 1ª rodada, cujo destino é o `TODO.md`, e a 5, os nomes completos nos blocos de mutação, que não foi aplicada. Pelo próprio texto da seção, ela tem linhas ou "nenhuma".
5. **Os nomes de teste nos blocos de mutação continuam sendo prefixos.** Isso vale também para os dois de `eslint-disable`. O portão aceita, mas dois testes de nome parecido no mesmo `describe` já existem.

## revisor-geral · 3ª rodada · APROVADO · 2026-10-22 17:44:28 · `tasks/prd-reengenharia/9_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/guardas.test.ts`: o nome do caso diz "acessar pelo namespace", mas o acesso pelo namespace deixou de ser reprovado no uso. A guarda agora reprova o próprio `import * as`. O diagnóstico manteve o nome de propósito. Na próxima tarefa que mexer nesse arquivo, vale trocar o nome para algo como "trazer pelo namespace". O nome teria de mudar junto nos blocos de "Mutações" que o citam.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/regras-tenant.mjs`: a regra reprova qualquer chamada que receba o pacote como primeiro argumento, e não só o `require`. Hoje nada fora das exceções faz isso. Mas o primeiro script que chamar algo como `resolverCaminho('@educa/nucleo')` vai ser reprovado com uma mensagem que fala de tabela. O cabeçalho já explica o motivo. Se isso acontecer, ajuste a mensagem para dizer o que de fato reprovou.

O que a rodada pediu conferir:
- **Divergência:** a linha em "Divergências resolvidas" do `9_task.md` tem a coluna "Onde está na spec" preenchida (`onda-1a.md`, T6, "Tabela só no repository (9.0)"). O parágrafo novo de `onda-1a.md` descreve o mesmo desenho que `regras-tenant.mjs` implementa:
  - não segue valor;
  - reprova `schema`, `default`, `import * as`, o import padrão, `import = require`, `export *`, `import()`, `typeof import()` e a chamada que recebe o pacote;
  - leva os mesmos limites declarados no cabeçalho.
- **Onde a decisão vive:** a `techspec.md` §6 manda o detalhe para `onda-1a.md`, e esta spec não tem `cenarios.md`. O registro está no lugar certo.
- **Arquivos previstos:** a tabela bate com a árvore. São 9 arquivos, entre eles `regras-ia.mjs`, `onda-1a.md` e `TODO.md`, que entraram nesta rodada. O `9_task.md` e o `achados/` são do processo.
- **Mudança na fixture:** usar `@educa/nucleo/auditoria` no lugar de `/conta-global` não muda o que se prova. Os dois são subcaminhos do pacote, e a mutação `` `${PACOTE}/` `` cai pela linha de `/ciclo-de-vida`.
- **Mutações:** os blocos novos de `regras-tenant.mjs` cobrem cada cláusula do código atual e não citam mais código que saiu. As duas linhas `if (!ehDoNucleo(no.source)) return`, que são iguais, se distinguem pela linha de cima, que vai como contexto.
- **Recomendações das rodadas anteriores:** as da 1ª e da 2ª rodada foram tratadas em "Recomendações sem aplicar". A linha do helper de teste está escrita no `TODO.md`.

## tenancy-guardian · 3ª rodada · REPROVADO · 2026-10-22 17:45:18 · `tasks/prd-reengenharia/9_task.md`

VEREDITO: REPROVADO

Tabelas verificadas: nenhuma tabela nova nesta rodada. `tools/guardas/tabelas-do-nucleo.mjs` não mudou desde a 2ª rodada.

Queries verificadas: nenhuma query nova. Auditei a guarda `guardas/tabela-so-no-repository` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/regras-tenant.mjs`), as exceções em `tools/guardas/index.mjs` e a fixture `tools/guardas/__fixtures__/tabela-fora-do-repository.ts`. A árvore de trabalho é igual à `313e858`. Os testes da guarda passam. Rodei uma sonda pelo ESLint do repositório, como `apps/api/src/x/x.service.ts`.

Teste de isolamento: presente e efetivo. Com a cláusula nova de `ExportNamedDeclaration` removida, a linha 30 e a linha 38 da fixture quebram o teste. A mutação está declarada na `9_task.md`.

Correção exigida na 2ª rodada: o código está feito. `export { schema } from '@educa/nucleo'`, `export { 'schema' as s }` e `export { default }` são reprovados. A fixture ficou incompleta: tem `export { schema as todasAsTabelas }` (linha 30) e a linha sem marca de `outro-pacote` (linha 39), mas falta a linha `export { schema } from '@educa/nucleo'` sem apelido, que foi pedida.

Bloqueantes:

1. `tools/guardas/regras-tenant.mjs:83-89` (com `especificador` em `tools/guardas/regras-ia.mjs:36-43`). Há formas com o pacote escrito como texto, no ponto em que é carregado, que passam sem denúncia. O cabeçalho (linhas 13-15) diz que reprova `import()` e `require`, e nenhum limite das linhas 18-25 cobre estes casos:
   - **Afirmação de tipo em volta do texto.** `especificador` só reconhece `Literal` e `TemplateLiteral`, e a afirmação muda o nó. Passam:
     - `import('@educa/nucleo' as string)`
     - `require('@educa/nucleo' as string)`
     - `require('@educa/nucleo' satisfies string)`
     - `require('@educa/nucleo'!)`
     - `require(<string>'@educa/nucleo')`
   - **O pacote fora da primeira posição.** Só `arguments[0]` é olhado. Passam:
     - `require.call(null, '@educa/nucleo')`
     - `require.apply(null, ['@educa/nucleo'])`
     - `Reflect.apply(require, null, ['@educa/nucleo'])`
   - **O texto dentro de uma expressão** que o limite "guardado ou montado em variável" não descreve. Passam:
     - `require((0, '@educa/nucleo'))`
     - `require(cond ? '@educa/nucleo' : 'y')`
     - `require('@educa/nucleo' || 'y')`

   Correção exigida:
   - Fechar a classe, não só os exemplos. Em `ImportExpression`, `TSImportType`, `TSExternalModuleReference`, `CallExpression` e `NewExpression`, a guarda reprova quando o pacote ou um subcaminho aparece como texto em qualquer argumento. A busca atravessa `TSAsExpression`, `TSSatisfiesExpression`, `TSNonNullExpression`, `TSTypeAssertion`, `SequenceExpression`, `ConditionalExpression`, `LogicalExpression` e elementos de `ArrayExpression`.
   - Acrescentar à fixture, com a marca `// reprova: guardas/tabela-so-no-repository`, uma linha de cada grupo: `as string` em `import()` e em `require`, o `!`, `require.call(null, …)`, `Reflect.apply(require, null, [...])` e o condicional.
   - Acrescentar uma linha sem marca com `'outro-pacote'` em segunda posição, para provar que a guarda não reprova pacote alheio.
   - Acrescentar a linha `export { schema } from '@educa/nucleo'` sem apelido, que faltou da 2ª rodada.
   - Declarar uma mutação para cada cláusula nova.
   - Se alguma dessas formas for deixada de fora de propósito, escrevê-la entre os limites do cabeçalho com o motivo. Hoje nenhum limite a cobre.

Recomendações:
- Atualizar o cabeçalho de `regras-tenant.mjs` (linhas 14-15) para descrever o critério novo ("o pacote como texto em qualquer argumento da chamada"), em vez de "primeiro argumento".
- `` require`@educa/nucleo` `` (template com tag) e `new X('@educa/nucleo')` também passam. Nenhum dos dois carrega o módulo de fato. Se a correção acima já cobrir `NewExpression`, o segundo sai junto; o primeiro não precisa entrar.

## test-engineer · 3ª rodada · REPROVADO · 2026-10-22 17:46:04 · `tasks/prd-reengenharia/9_task.md`

VEREDITO: REPROVADO

Cenários exigidos: import pelo nome, com apelido e como `type`, também quando o nome está entre aspas; reexport com `export { … } from`; o objeto `schema` importado ou reexportado (a correção da 2ª rodada); o `default`; o que traz o módulo inteiro (`import * as`, import padrão, `import … = require()`, `export *`, `export * as`, `export type *`, `import()`, `typeof import()` e a chamada que recebe o pacote); subcaminho de `@educa/nucleo`, sem confundir com `@educa/nucleo-legado`; nome que não é tabela passa; fora de `apps/*/src` também reprova; repository, teste e `db/**` passam; `eslint-disable` no arquivo ou na linha não fura; a lista contra `PgTable` nos dois sentidos; o repositório de hoje sem violação.

Cobertos: todos acima, na fixture `tools/guardas/__fixtures__/tabela-fora-do-repository.ts`, que roda nos seis caminhos reprovados e nos sete permitidos, e em `tabelas-do-nucleo.test.ts`. A correção exigida na 2ª rodada foi feita:
- `export { schema as todasAsTabelas } from '@educa/nucleo'` tem marca na fixture.
- O bloco `-'schema',` prova a cláusula.
- O `import { schema }; export { schema }` sem `from` deixou de ser limite, porque o import já reprova.

Cada cláusula nova de `regras-tenant.mjs` tem o seu bloco de mutação: `'schema'`, `'default'`, `...TABELAS_DO_NUCLEO`, as três de `ehDoNucleo`, `nomeEscrito` com `Literal`, `importado.type !== 'ImportSpecifier'`, os dois `.has(...)` e cada visitante. Conferi os subcaminhos do `exports` do núcleo: `ciclo-de-vida` e `armazem-s3` não exportam tabela com outro nome, e o núcleo não exporta objeto `relations`. `npx vitest run tools/guardas/guardas.test.ts tools/guardas/tabelas-do-nucleo.test.ts` passou: 110 de 110. Não há `.skip` nem mock. A guarda não envolve IA nem concorrência.

Bloqueantes:
1. `tools/guardas/regras-tenant.mjs:89`, junto com a promessa da linha 9: o pacote escrito como texto em outra posição da chamada passa sem denúncia. O cabeçalho diz que a guarda "reprova onde o pacote, ou um subcaminho dele, está escrito", mas o `CallExpression` só olha `no.arguments[0]`. Provei passando o código pela entrada padrão do ESLint, com caminho simulado de service e sem alterar arquivo. Este trecho saiu sem nenhuma denúncia:
   ```ts
   const r = createRequire(import.meta.url)
   export const a = r.call(null, '@educa/nucleo')
   export const b = Reflect.apply(r, null, ['@educa/nucleo'])
   ```
   O mesmo vale para `[ '@educa/nucleo' ].map(r)`. Nos três casos o pacote está escrito como texto onde é carregado, e o `@typescript-eslint/no-require-imports` também não pega, porque a função não se chama `require`. Isso não cai em nenhum limite declarado: o primeiro limite fala do especificador guardado em variável, e aqui ele está escrito como texto. Também fica incoerente com a fixture, onde `carregar('@educa/nucleo')` reprova e o mesmo pacote no segundo argumento passa.

   Correção exigida, uma das duas:
   - (a) Fazer valer a linha 9: reprovar o texto do pacote, ou de um subcaminho, em qualquer posição fora da `source` de um import pelo nome permitido. Pôr na fixture as linhas `r.call(null, '@educa/nucleo')` e `Reflect.apply(r, null, ['@educa/nucleo'])`, cada uma com `// reprova:`, e acrescentar o bloco de mutação da cláusula. Cuidado: o `PACOTE` do próprio `regras-tenant.mjs` cairia nessa regra, e o teste que varre o repositório pegaria isso.
   - (b) Estreitar a linha 9 para "o pacote como primeiro argumento", e declarar nos limites o pacote passado em outra posição da chamada ou dentro de array (`r.call(null, …)`, `Reflect.apply(…, [...])`). Nesse caso, pôr a linha na fixture sem marca, para fixar que passa.

Recomendações:
- Hoje `import type { Schema } from '@educa/nucleo'`, que é o tipo de todas as tabelas, passa, enquanto `import type { turma }` reprova. Não monta consulta, mas é incoerente. Vale ou reprovar, ou dizer no cabeçalho por que o tipo passa.
- `` import(`@educa/${x}`) ``, um template com expressão, e o `import('@educa/nucleo')` dentro de JSDoc num `.mjs` passam. O primeiro cabe em "montado"; vale citar os dois de forma explícita no limite, junto com o bloqueante, se a correção for a (b).
- Seguem de pé, já registradas: os nomes de teste dos blocos de mutação são prefixos dos nomes reais, e o caso do helper de teste em `apps/api/test/` está no `TODO.md`.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/regras-tenant.mjs
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/__fixtures__/tabela-fora-do-repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/guardas.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tasks/prd-reengenharia/9_task.md

## revisor-geral · 4ª rodada · APROVADO · 2026-10-22 18:11:54 · `tasks/prd-reengenharia/9_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A mudança desta rodada vem da R62 (`.reengenharia/DECISOES.md`) e está no parágrafo T6 de `tasks/prd-reengenharia/onda-1a.md`, que agora cita o `Schema`, o texto do pacote em qualquer ponto do código e "só a fonte do import pelo nome passa".

Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes: nenhum

O que conferi nesta rodada:
- **Cabeçalho, mensagem, fixture e mutações dizem a mesma coisa.**
  - O cabeçalho e a mensagem de `tools/guardas/regras-tenant.mjs` batem com os visitantes `Literal` e `TemplateLiteral`.
  - A fixture `tools/guardas/__fixtures__/tabela-fora-do-repository.ts` fixa os embrulhos citados (linhas 49 a 66): `as`, `satisfies`, `!`, `<string>`, `require.call`, `Reflect.apply`, `.map(require)`, condicional, sequência, template com tag e `new`. Fixa também os limites declarados, que passam (linhas 75 a 78).
  - Cada forma reprova uma vez só, sem marca em dobro. O `import … = require()` e o `export *` caem só no `Literal`. O `import type * as` cai só no `ImportDeclaration`, porque a fonte do import pelo nome é pulada.
  - Os blocos de mutação do `9_task.md` foram renomeados para o caso novo, e as linhas citadas existem no código. A mutação da exceção nova (`index.mjs`, contra "o repositório de hoje não tem violação") está registrada.
- **O repositório de hoje não tem violação.** Um `git grep` pelo texto do pacote fora de import, teste, repository e `db/**` só encontra comentários (`ciclo-de-vida.service.ts:26`, `ciclo-de-vida/index.ts:1`, `shared/.../painel.ts:78`, `professores.ts:40`, `index.mjs:85`). A guarda não olha comentário, então isso confirma o "zero violações".
- **A exceção nova está fixada por teste.** O caso `configuração das guardas` de `tools/guardas/guardas.test.ts` agora confere a exceção de `tools/guardas/regras-tenant.mjs`, e o caso novo de `.tsx` cobre a exceção de teste onde a fixture não compila.

Recomendações:
- A exceção de um arquivo para `tools/guardas/regras-tenant.mjs` (`tools/guardas/index.mjs:84-88`) está registrada na R62, no cabeçalho da guarda e no teste. Mas faltam dois registros:
  - `onda-1a.md` T6 ainda lista as exceções como "`*.repository.ts`, teste e `packages/nucleo/src/db/**`".
  - A linha de "Divergências resolvidas" do `9_task.md` não cita nem a exceção nova nem a R62 na coluna "Onde está na spec".

  Não bloqueia: a decisão é do Arquiteto, está no registro de decisões e não abre caminho para dado. Mas vale acrescentar os dois na próxima vez que alguém mexer nesses textos.
- Os blocos de mutação de `regras-tenant.mjs` citam todos o mesmo caso parametrizado ("reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote"). Ele roda em seis caminhos, então a mutação fica vermelha se cair em qualquer um deles, e isso basta. A recomendação de nome de teste por prefixo, das rodadas anteriores, segue registrada na tabela.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/regras-tenant.mjs`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/index.mjs`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/__fixtures__/tabela-fora-do-repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tasks/prd-reengenharia/9_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tasks/prd-reengenharia/onda-1a.md`

## tenancy-guardian · 4ª rodada · APROVADO · 2026-10-22 18:12:14 · `tasks/prd-reengenharia/9_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nesta rodada. A 9.0 é uma guarda estática. Conferi `NOMES_QUE_LEVAM_TABELA` (`TABELAS_DO_NUCLEO`, `schema`, `default` e agora `Schema`) em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/regras-tenant.mjs:34-42`.

Queries verificadas: nenhuma query nova. Conferi a guarda `guardas/tabela-so-no-repository`. Os visitantes `Literal` e `TemplateLiteral` (`regras-tenant.mjs:87-92`) denunciam o texto do pacote, ou de um subcaminho, em qualquer ponto, exceto na fonte de `import … from` e de `export { … } from`, onde o nome importado decide. A exceção nova em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/index.mjs:84-88` vale para um arquivo só, o da própria guarda, e tem a justificativa escrita.

Correção exigida na 3ª rodada:
- **Classe fechada.** Rodei uma sonda própria pelo ESLint do repositório, com caminho simulado de `apps/api/src/x/x.service.ts` e de `apps/worker/src/x.ts`, sem alterar arquivo. Reprovam:
  - afirmações de tipo: `as`, `satisfies`, `!` e `<string>`;
  - pacote fora da primeira posição: `require.call`, `require.apply` e `Reflect.apply`;
  - texto dentro de expressão: sequência, `?:`, `||`, `??`, parênteses, array indexado e objeto com membro;
  - tagged template, `String.raw` e `new X(...)`;
  - escapes (`'\x40educa/nucleo'`, `'@educa\/nucleo'`), barra final e `dist/index.js`;
  - `import()` com comentário e com atributos, `export *`, `export * as` e `export { default }`;
  - `export { schema }`, `export { Schema }` e `import x = require()`;
  - `typeof import()`, `import('…').Schema` e `import('…')['schema']`;
  - o texto em constante usada depois em `require(m)`.

  Passam, como deve ser: `import '@educa/nucleo'` só pelo efeito (não traz nome), import e reexport de nome que não é tabela, `@educa/nucleo-legado` e as formas do limite declarado (texto montado e comentário, inclusive `/// <reference types>`). Também passa `'@educa/nucleo?x'`, mas essa forma não carrega: o Node trata o texto inteiro como nome de pacote e o `tsc` não resolve. Não é furo.
- **Fixture.** Tem uma linha de cada grupo com a marca. Tem a linha sem marca `carregar(1, 'outro-pacote')` com o pacote em segunda posição. Tem `export { schema } from '@educa/nucleo'` sem apelido.
- **Mutações.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tasks/prd-reengenharia/9_task.md:238-297` tem uma mutação para cada cláusula nova: `'Schema'`, os dois lados de `ehFonteDeImportPeloNome`, as três variantes do `Literal`, as duas do `TemplateLiteral` e a exceção da própria guarda. Conferi de cabeça que cada uma quebra o teste: a fixture tem linhas sem marca de `import` e de `export { … } from` com nome que não é tabela, e linhas marcadas para cada visitante. Não rodei o executor das mutações porque ele altera arquivos; o portão roda.
- **Cabeçalho.** Os limites estão atualizados (variável, texto montado, comentário, caminho relativo). As duas recomendações da 3ª rodada entraram: o cabeçalho e as formas `` require`…` `` e `new X('…')`.
- `npx vitest run --project unidade tools/guardas/guardas.test.ts tools/guardas/tabelas-do-nucleo.test.ts`: 111/111.

Teste de isolamento: presente e efetivo. É a fixture com o caminho simulado mais o teste "o repositório de hoje não tem violação". Sem os visitantes `Literal` e `TemplateLiteral`, as linhas marcadas de carga dinâmica deixam de sair e o teste fica vermelho.

Bloqueantes: nenhum.

Recomendações:
- `declare module '@educa/nucleo' { }`, o aumento de módulo, é reprovado fora das exceções. É excesso que não vaza dado. Se um dia precisarem dele, cabe uma linha nos limites do cabeçalho de `regras-tenant.mjs` dizendo que ele fica no `db/**` ou no repository.

## test-engineer · 4ª rodada · APROVADO · 2026-10-22 18:12:16 · `tasks/prd-reengenharia/9_task.md`

VEREDITO: APROVADO

Cenários exigidos:
- A correção da 3ª rodada, opção (a): a guarda reprova o texto do pacote, ou de um subcaminho, em qualquer posição, menos na fonte do import pelo nome.
- A fixture tem `require.call(null, '@educa/nucleo')` e `Reflect.apply(require, null, ['@educa/nucleo'])`, cada uma com `// reprova:`.
- A cláusula nova tem bloco de mutação.
- O próprio `PACOTE` de `regras-tenant.mjs` não quebra a varredura do repositório, e a exceção criada para isso também tem bloco de mutação.
- Cada cláusula nova do diff (`Literal`, `TemplateLiteral`, `ehFonteDeImportPeloNome`, `'Schema'`) tem o seu bloco.
- Os testes renomeados continuam citados com o nome atual.

Cobertos:
- **Correção exigida, feita.** Os visitantes `Literal` e `TemplateLiteral`, em `tools/guardas/regras-tenant.mjs:87-92`, cumprem por construção o que o cabeçalho promete nas linhas 14-17.
- **A fixture fixa os dois lados.** Em `tools/guardas/__fixtures__/tabela-fora-do-repository.ts`:
  - Reprovam as linhas 60-66 (`require.call`, `Reflect.apply`, `.map(require)`, condicional, sequência, template com tag, `new`), as linhas 56-59 (`as`, `satisfies`, `!`, `<string>`) e o texto solto da linha 80.
  - Passam o outro pacote em `Reflect.apply` e em `carregar(1, …)`, e `@educa/nucleo-legado` (linhas 71-73).
  - O limite declarado fica fixado como "passa" nas linhas 75-78: variável, concatenação, template com expressão e comentário. O cabeçalho repete isso nas linhas 21-24.
- **Cada cláusula nova tem bloco, e cada bloco chega à cláusula:**
  - Remover o `Literal` derruba as linhas 49 a 66.
  - Trocar por `ehDoNucleo(no)` sozinho reprova a fonte dos imports permitidos (linhas 19-20 e 40).
  - Trocar por `!ehFonteDeImportPeloNome(no)` sozinho reprova todo texto, inclusive `'outro-pacote'`.
  - As duas metades de `ehFonteDeImportPeloNome` têm bloco cada uma.
  - Remover o `TemplateLiteral` derruba as linhas 50 e 65; trocá-lo por `denunciar(no)` reprova a linha 77, que é o limite.
  - Remover `'Schema'` derruba a linha 12.
- **O `PACOTE` da guarda está tratado.** A exceção de `regras-tenant.mjs` está em `index.mjs:84-88`. O bloco que a esvazia (`regras: []`) cita "o repositório de hoje não tem violação". Esse teste varre todo arquivo que contém `@educa/nucleo`, inclusive o da guarda, e por isso fica vermelho sem a exceção.
- **O teste de `.tsx` deixou de passar no vazio.** Antes, a fixture como `x.test.tsx` não compilava. Agora `guardas.test.ts:323-331` usa código próprio e prova os dois lados: `[]` no teste `.tsx` e `[1]` no componente `.tsx`. O `[1]` mostra que o arquivo compilou e que a regra disparou.
- **Os nomes citados batem.** Os blocos de mutação citam "reprova trazer do núcleo a tabela, o schema, o módulo inteiro e o texto do pacote" e "o repositório de hoje não tem violação", e os dois existem.
- **A recomendação da 3ª sobre `Schema` foi aplicada**, com a linha 12 da fixture e a linha 31 (`export { schema }`).
- Rodei `npx vitest run tools/guardas/guardas.test.ts tools/guardas/tabelas-do-nucleo.test.ts` e passaram os 111 testes. O `lintar` exige zero erro fatal, então nenhum caminho da fixture passa sem compilar. Não há `.skip`, mock nem IA. Não há operação concorrente.

Bloqueantes: nenhum

Recomendações:
1. A tabela "Testes" do `9_task.md` (linhas 47-60) não tem linha para o texto do pacote fora do import pelo nome: `require.call`, `Reflect.apply`, o texto solto e `typeof import()`. O cenário está provado pela fixture e pelos blocos de mutação, mas a tabela, que o `/validar` lê, ainda descreve a guarda da 1ª rodada. Uma linha bastaria: "texto do pacote em qualquer outro ponto | reprova | tirar o visitante `Literal`".
2. O import só por efeito colateral, `import '@educa/nucleo'` (linha 21 da fixture), passa, e com razão: não traz nome nenhum. Vale uma palavra no cabeçalho, onde ele diz que "só a fonte de `import … from` … passa", para ninguém ler isso como esquecimento.
3. A regra agora reprova qualquer texto `@educa/nucleo` fora das exceções. Isso inclui um alias de `vite.config.ts`, um `declare module '@educa/nucleo'` ou uma mensagem de erro. Hoje a varredura dá zero, e a decisão está tomada na R62. Convém registrar no `onda-1a.md` que o primeiro arquivo desses que aparecer pede uma exceção de um arquivo em `index.mjs`, e não um afrouxamento da regra.
4. Seguem registradas como antes: os nomes de teste nos blocos de mutação são prefixos dos nomes reais, e o helper de teste em `apps/api/test/` está no `TODO.md`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/regras-tenant.mjs
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/index.mjs
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/__fixtures__/tabela-fora-do-repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/guardas.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tasks/prd-reengenharia/9_task.md
