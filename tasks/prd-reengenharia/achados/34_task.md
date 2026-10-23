# Achados das revisões — `tasks/prd-reengenharia/34_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-22 21:12:37 · `tasks/prd-reengenharia/34_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nem migration. A tarefa só move arquivos e ajusta imports, e `docs/modelo-de-dados.md` muda só no caminho citado.

Queries verificadas:
- Nos arquivos movidos de `apps/api/src/sessao/**`, o diff só troca linhas de import. Nenhuma cláusula `where` mudou.
- `ResolucaoDeTenantRepository`, agora em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/sessao/tenant/resolucao-de-tenant.repository.ts`, mantém os seis `@SemEscopo` com a justificativa escrita (linhas 103, 142, 155, 172, 183 e 193).
- `git grep` não acha nenhum uso nem citação da classe fora de `apps/api/src/sessao/`, tirando `arquitetura.test.ts`.
- `ConviteRepository` e `ContaExternaRepository` escopam pelo contexto (`exigirEscolaDoContexto`). No índice, só os testes os usam.
- `AlunosAtivosRepository.contar` continua provando o escopo pelo contexto (`repositories-com-escopo.test.ts`, com o caminho novo).
- Nenhum endpoint passou a aceitar `escolaId` do cliente.

Teste de isolamento: presente e efetivo.
- Os `.int.test.ts` de isolamento foram movidos sem mudança de lógica: `convite.repository`, `eu.repository`, `alunos-ativos.repository`, `redefinicao-de-mfa.repository` e `resolucao-de-tenant.repository`.
- O `it` novo do barril em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/arquitetura.test.ts` (linhas 175 a 198) fica vermelho se o índice reexportar a `ResolucaoDeTenantRepository` ou a `ContaGlobalRepository`, com o nome delas ou com outro. Ele confere pela identidade em `Object.values`. Também fica vermelho com `export *` ou com arquivo de `tenant/` além de `acesso-da-sala` e `sessoes-sinteticas`, conferidos pelo texto do índice.
- `daClasse` exige um único arquivo da classe, e dentro de `MODULO_SESSAO`. `usosForaDoModuloSessao` continua `[]`.
- Rodei `arquitetura.test.ts`, `sessao/tenant` e `repositories-com-escopo.test.ts`: 123 passaram. Não rodei as mutações declaradas; elas ficam para o portão.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/sessao/index.ts` exporta `ConviteRepository`, `ContaExternaRepository` e `CHAVE_DA_TRAVA_DO_CONVITE_DA_ESCOLA` só porque os testes de `apps/api/test` os usam. Com isso, repositories ficam na porta pública do módulo, e um módulo de produção pode passar a usá-los sem nada acusar. Sugestão: os testes importarem pelo arquivo, como `arquitetura.test.ts` já faz, ou a regra do depcruise da 12.0 barrar o uso desses símbolos fora de `apps/api/test`.
- Comentários no `.reengenharia/` (`LINHA-DE-BASE.md`, `MAPA.md`, `diagnostico/*.md`) citam os caminhos antigos de `sessao/`. Não bloqueia porque é retrato da linha de base, mas vale registrar no `/retro` se esses documentos devem continuar com os caminhos antigos.

## test-engineer · 1ª rodada · APROVADO · 2026-10-22 21:13:11 · `tasks/prd-reengenharia/34_task.md`

VEREDITO: APROVADO

**Cenários exigidos.** A tarefa só move arquivos e troca imports, sem mudar comportamento. Por isso não há caminho de domínio nem caso de concorrência novo. O que precisa ser provado:
- o barril `sessao/index.ts` não vaza a `ResolucaoDeTenantRepository` nem a `ContaGlobalRepository`, sob nome nenhum, nem por `export *` ou reexport em dois passos;
- da `tenant/`, só o `AcessoDaSala` e as sessões sintéticas entram no índice;
- `usosForaDoModuloSessao` continua vazio, e o arquivo da classe é achado dentro de `MODULO_SESSAO` pelo nome, sem depender da subpasta;
- quem usa a conta global continua o mesmo conjunto: dois arquivos de `sessao/` e dois de `packages/nucleo`;
- o lint do pipe barra controller em subpasta: `@Req()` liberado em `sessao/` e `operacao/` a qualquer profundidade, e tudo barrado em outro módulo;
- os caminhos antigos somem do código;
- o isolamento continua pelos testes que já existem e que foram movidos junto.

**Cobertos.**
- **Linha 1 da tabela:** `arquitetura.test.ts › nem o barrel de sessao/ exporta a ResolucaoDeTenantRepository nem a ContaGlobalRepository… (34.0)`. Ele confere `Object.keys` e `Object.values` contra as classes de verdade. Também confere que o barril foi lido de fato (`SessaoModule` e `AcessoDaSala` presentes), que o texto não tem `export *` e que da `tenant/` vêm exatamente `acesso-da-sala.js` e `sessoes-sinteticas.js`. As cinco mutações de `index.ts` apontam para ele: nome direto, alias, alias da ContaGlobal, `export *` e `naEscolaSemUsuario`. A do `credencial/` continua no `it` da 33.0, com o import da classe atualizado.
- **Linha 2:** `› a varredura enxerga o código` (por `basename`, um só arquivo, dentro de `MODULO_SESSAO`) e `› nenhum arquivo fora de apps/api/src/sessao importa…`. As mutações correspondentes estão declaradas e apontam para esses dois. A lista da conta global separa o que está dentro de `sessao/` (pelo nome) do que está em `packages/nucleo` (pelo caminho), e a lista continua exata.
- **Linha 3:** `guardas.test.ts › o controller em subpasta do módulo é barrado como o da raiz…`. As duas mutações de glob de `eslint.config.mjs`, para `*/` e para um nível só, estão declaradas.
- **Linha 4:** rodei o `git grep` dos caminhos antigos em `apps/api/src`, `apps/api/test`, `apps/worker`, `e2e` e `infra`. Sobram só:
  - as fixtures de texto marcadas como "fora", de propósito, em `arquitetura.test.ts`;
  - o `packages/shared/src/sessao/*`, que é outro módulo;
  - o histórico em `.reengenharia/`;
  - a fixture de `tools/processo/revisoes.test.ts`.
- **Fora de `sessao/`, ninguém importa direto de uma subpasta**, a não ser o `import()` do `arquitetura.test.ts`. Ele está registrado nas divergências e é preciso: o teste do barril compara contra a classe de verdade.
- **Rodada:** `npx vitest run --project unidade apps/api/test/arquitetura.test.ts tools/guardas apps/api/src/sessao apps/api/src/sala` deu 16 arquivos e 308 testes verdes.
- **Proibições:** não há `.skip`, teste comentado, mock de coisa nossa nem chamada a provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `apps/api/test/arquitetura.test.ts:186`: o regex `from '\.\/tenant\/([^']+)'` só reconhece aspas simples. Um `export { naEscolaSemUsuario } from "./tenant/escola-sem-usuario.js"` com aspas duplas passaria pela conferência de texto. O `Object.values` não pega esse caso, porque ele só procura as duas classes. Hoje o lint ou o prettier provavelmente fixam as aspas simples. Mesmo assim, aceitar `['"]` fecha a brecha sem depender disso.
2. Os imports por `dist` em `infra/scripts/{carga-login,carga-sala,ensaio-alertas}.ts` (`apps/api/dist/sessao/tenant/sessoes-sinteticas.js`) só se provam no `test:infra` da esteira. Antes do pouso, vale conferir se o veredito da esteira cobre algum desses três scripts.
3. O pedido de "estender o `it` da 33.0" virou um `it` novo e separado, o que está certo. Fica só a anotação para o `/retro`: a tabela citava o teste a estender, e não o novo.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/34_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/sessao/index.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/arquitetura.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/guardas.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/repositories-com-escopo.test.ts

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 21:13:38 · `tasks/prd-reengenharia/34_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

O que conferi:
- **Mapa da 34.2.** Bate com `onda-2.md` §2. Na raiz de `sessao/` ficaram só `sessao.module.ts`, `conferencia-do-autor.ts` e `index.ts`. `externa/` não saiu do lugar.
- **Só movimento e import.** Fora de `arquitetura.test.ts`, o diff de `apps/api/{src,test}` e `infra/` só troca import e caminho citado. A única exceção é um comentário em `professores.service.ts` que cita o caminho novo. Nenhuma linha de comportamento mudou, e o isolamento continua o mesmo.
- **Índice (`apps/api/src/sessao/index.ts`).**
  - Todos os exports são nomeados, sem nenhum `export *`.
  - De `tenant/` só entram `acesso-da-sala` e `sessoes-sinteticas`, e a `ResolucaoDeTenantRepository` não está lá.
  - Cada símbolo exportado tem pelo menos um uso fora de `sessao/` e `credencial/`, então não há export morto.
- **Imports pelo arquivo.** Fora de `sessao/` e `credencial/`, só três lugares ainda importam direto do arquivo, todos previstos:
  - `infra/scripts/*`, que a 34.3 manda ficar no arquivo;
  - os `import()` de `arquitetura.test.ts`, que constam como divergência e precisam da classe de verdade para comparar;
  - os textos de exemplo dentro do próprio teste.
- **Caminhos antigos.** Só aparecem em `.reengenharia/` (diagnóstico histórico) e em textos de exemplo de `revisoes.test.ts`.
- **`arquitetura.test.ts`.**
  - Acha os arquivos pelo `basename` dentro de `MODULO_SESSAO`, ou seja, cita a regra e não a pasta, como pede o §2.
  - O `it` do índice segue o molde da 33.0 e soma a verificação por texto (sem `export *`, e só os dois arquivos de `tenant/`).
- **Lint em subpasta.** O teste novo em `guardas.test.ts` está coberto. As duas mutações de `eslint.config.mjs` correspondem às linhas que existem hoje (`:87` e `:97`).
- **Divergências.** As cinco estão registradas, cada uma com onde aparece na spec: `tasks.md`, "Tarefa mecânica", e `onda-2.md` §2.

Recomendações:
- O índice exporta `JANELA_DE_RENOVACAO_SIMULTANEA_MS` só porque `renovacao.service.ts:37` repassa adiante uma constante que vem de `@educa/shared`. `apps/api/test/renovacao.int.test.ts:5` poderia importá-la direto de `@educa/shared`. Assim a constante sai do índice e o service deixa de repassá-la (hoje há dois lugares de onde tirar o mesmo valor).
- A mutação que a tabela de testes pede (`export * from './tenant/index.js'`) não tem como ser aplicada ao pé da letra, porque `tenant/index.ts` não existe. Quem cobre o caso é `export * from './tenant/acesso-da-sala.js'` junto com o reexport `as OutroNome`. Vale ajustar a linha da tabela no `34_task.md` para dizer isso, e o próximo leitor não vai procurar um arquivo que não existe.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-22 21:21:02 · `tasks/prd-reengenharia/34_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma nova nem alterada nesta rodada. O diff não toca migration nem schema.

Queries verificadas: nenhuma query mudou. O diff tira um reexport de constante de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/sessao/index.ts` e troca a origem do import em teste. A `ResolucaoDeTenantRepository` (`@SemEscopo`) e a `ContaGlobalRepository` continuam fora do barril. Da `tenant/`, o barril só exporta `AcessoDaSala` e as sessões sintéticas, e cada símbolo vai pelo nome, sem `export *`.

Teste de isolamento: presente e efetivo. O teste de arquitetura em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/arquitetura.test.ts:186` agora aceita aspas simples e duplas no `from './tenant/...'`. Ele ficou mais estrito: um reexport com aspas duplas de outro arquivo da `tenant/` passava antes sem ser visto e agora quebra o teste. A mutação nova da tarefa cobre exatamente esse caso (`naEscolaSemUsuario` com aspas duplas). Nos dois testes, o valor da constante não mudou: `JANELA_DE_RENOVACAO_SIMULTANEA_MS` vem de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/shared/src/sessao/renovacao.ts:19` (2_000), que é a mesma fonte que o `renovacao.service.ts:13` já usa.

Correções exigidas na rodada anterior: nenhuma.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/sessao/renovacao/renovacao.service.ts:37` ainda reexporta `JANELA_DE_RENOVACAO_SIMULTANEA_MS`, e só o teste unitário vizinho usa isso. Esse teste pode importar a constante de `@educa/shared` e o reexport sai.
- A dívida registrada no `TODO.md` está certa: o barril ainda exporta `ConviteRepository`, `ContaExternaRepository`, `CookieOidc`, `CHAVE_DA_TRAVA_DO_CONVITE_DA_ESCOLA` e `ESCOLA_DESCONHECIDA`, que só os testes usam. Quando ela for fechada, vale conferir que nenhum código de produção fora de `sessao/` instancia esses repositories direto.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 21:21:28 · `tasks/prd-reengenharia/34_task.md`

VEREDITO: APROVADO

Cenários exigidos (tarefa mecânica, só com as travas da onda 2 §2):
- O barril de `sessao/` não traz a `ResolucaoDeTenantRepository` nem a `ContaGlobalRepository`, nem com outro nome.
- Da `tenant/`, o barril só traz `acesso-da-sala` e `sessoes-sinteticas`.
- Nenhum uso da classe fora de `MODULO_SESSAO`.
- A lint vale em `*.controller.ts` de subpasta.
- Nenhum caminho antigo sobrou.
- Nesta rodada: o barril deixa de exportar `JANELA_DE_RENOVACAO_SIMULTANEA_MS`, e a recomendação nº 1 (o regex do índice aceitar aspas duplas) foi aplicada.

Cobertos:
- **Recomendação nº 1 feita.** O regex de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/arquitetura.test.ts:186` agora aceita aspas simples e duplas. O bloco novo de "Mutações" (o reexport de `escola-sem-usuario.js` com aspas duplas) chega à cláusula pelo motivo certo: o conjunto lido do índice ganha `escola-sem-usuario.js` e deixa de ser igual a `['acesso-da-sala.js', 'sessoes-sinteticas.js']`. Antes da correção, esse reexport passava sem o teste ver.
- **A constante saiu do barril.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/sessao/index.ts` não exporta mais `JANELA_DE_RENOVACAO_SIMULTANEA_MS`. O `renovacao.int.test.ts:2` passou a importá-la de `@educa/shared`, que a exporta em `packages/shared/src/index.ts:109`. Não sobrou nenhum import dela pelo barril (`git grep`).
- **Tabela de testes, linha 1.** O "Fica vermelho se" agora descreve o que o portão aplica de fato (`export * from './tenant/acesso-da-sala.js'` e o `as OutroNome`). As mutações 1 a 6 cobrem o export pelo nome, o `as OutroNome` das duas classes, o `export *` e o arquivo de `tenant/` fora da lista, com aspas simples e com aspas duplas.
- **O teste roda.** `npx vitest run --project unidade apps/api/test/arquitetura.test.ts` passou: 70 de 70. Não há `.skip`, teste comentado nem mock no que mudou.

Bloqueantes: nenhum.

Recomendações:
1. O comentário em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/arquitetura.test.ts:187` ainda dá como exemplo `export * from './tenant/index.js'`, um arquivo que não existe. A tabela já foi corrigida para `./tenant/acesso-da-sala.js`; o comentário deveria dizer o mesmo.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/sessao/renovacao/renovacao.service.ts:37` ainda repassa `JANELA_DE_RENOVACAO_SIMULTANEA_MS`, e só `renovacao.service.test.ts:2` usa esse caminho. Trocar esse import para `@educa/shared` e apagar o reexport deixa um caminho só para a constante. A recomendação vem desde a 18.0 do F1 e também está no índice de achados da 34.0.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 21:21:31 · `tasks/prd-reengenharia/34_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)
Bloqueantes: nenhum

O que conferi do diff desde a 1ª rodada:
- **Constante fora do índice:** feito. A `JANELA_DE_RENOVACAO_SIMULTANEA_MS` saiu de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/sessao/index.ts`. O `renovacao.int.test.ts:2` agora a importa de `@educa/shared`, onde o contrato a exporta desde a 18.0 (`packages/shared/src/index.ts:109`). O reexport em `renovacao.service.ts:37` já existia no HEAD e o teste de unidade ainda depende dele, então não é código morto que esta tarefa criou.
- **Regex do `it` do barril:** `arquitetura.test.ts:186` aceita aspas simples e duplas. A mutação nova, com aspas duplas, cobre o caso que antes escapava.
- **Linha da tabela de testes e divergências:** coerentes. A divergência da constante saiu porque deixou de existir. As quatro que restam citam onde estão na spec (`tasks.md`, `onda-2.md` §2).
- **Recomendações sem aplicar:** as quatro têm destino. A linha do `tenancy-guardian` sobre o que o índice exporta está escrita no `TODO.md:1734` e não ficou só como promessa.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/34_task.md:56` ainda diz "as mutações 1 a 5 de 'Mutações'". Com o bloco novo de aspas duplas, são seis as mutações sobre o `sessao/index.ts`. Trocar para "1 a 6", ou citar o `it` em vez do número, para a tabela não envelhecer de novo.
