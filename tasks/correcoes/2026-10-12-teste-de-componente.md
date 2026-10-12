# Correção — a web não tem teste de componente, e toda condição de tela só se prova com o navegador

**Origem:** retrospectiva do F3 (`tasks/prd-lgpd-e-titular/retro.md`, M4) e o item "(F3, retro, M4) Condição de tela provada sem navegador" do `TODO.md`; pedido do Orquestrador em 12/10/2026.
**Subagentes obrigatórios:** `frontend-reviewer`, `revisor-geral`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: o pedido o marca, e a correção toca `vitest.config.ts` e o `apps/web/package.json`. -->

## Sintoma

Na 16.0, na 17.0 e na 18.0 do F3 o código da tela ficou pronto em uns 20 minutos e a primeira rodada saiu com 140, 98 e 140: as
três tabelas de teste eram só e2e. Na 18.0, 110 dos 188 minutos foram Playwright. O estado da tela (carregando, vazio, erro, com
dado), o rótulo de um botão e o que cada papel vê são condição de **uma peça**, e o único jeito de prová-los era subir o compose
inteiro, construir a web e abrir um navegador: minutos por cenário, e minutos de novo a cada mutação.

A web não tem como renderizar um componente nos testes: nenhum `jsdom`, nenhuma `testing-library`, e o projeto `unidade` do
`vitest.config.ts` só inclui `**/*.test.ts` (um `*.test.tsx` não é nem encontrado).

## Fora desta correção

Nada: nenhuma tarefa em curso.

Também não entra, por pedido do Orquestrador: a linha "estados da tela" do modelo de tarefa
(`.claude/skills/criar-tasks/task-template.md`), que passa a pedir teste de componente **depois** desta correção, por outra mão.
Nenhum arquivo de `.claude/` é tocado aqui.

## Causa

1. **A web não tinha onde renderizar uma peça.** O repositório não tinha `jsdom` nem `testing-library`: a única maneira de ver "o
   botão diz Aprovar 2 pedidos" ou "a coordenação não lê nada ao abrir" era o Playwright, com o compose inteiro de pé e a web
   construída. Por isso as tabelas de teste das telas do F3 eram só e2e (16.0, 17.0 e 18.0), e cada mutação de tela custava os
   minutos de um e2e, e não os segundos de uma unidade.
2. **O projeto `unidade` não enxergava `.test.tsx`.** Mesmo com o `jsdom`, `include: ['**/*.test.ts']` deixava o arquivo de
   componente fora: nem o portão da tarefa, nem a esteira (`npm run test:unidade`) o rodariam. O `tools/processo/mutacoes.ts`
   já manda `.test.tsx` para o projeto `unidade` (`tipoDoTeste`), de modo que o resto do processo só esperava o arquivo ser achado.

Falha da configuração de teste, desde o F0; não é de nenhuma tarefa.

## Teste que reproduz

Esta correção cria a capacidade, e o "vermelho antes" é a ausência dela. O caso que a prova é o primeiro teste de componente da
web, em tela que já existe:

- `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx` (5 casos, 1 s). A peça é a `ListaDePedidos`, a mesma para o
  professor e para a coordenação (A1, 16.0): ela tem os quatro estados da regra 50, item 5, o rótulo de um botão que carrega uma
  contagem e superfícies diferentes por papel. Os casos:
  1. `professor: a lista é lida ao abrir…` — carregando, depois com os pedidos; texto da atualização sozinha; sem "Atualizar".
  2. `coordenação: nada é lido ao abrir…` — nenhuma chamada na montagem, o aviso de auditoria, e só o clique lê, com a
     finalidade `conferencia_de_cadastro`.
  3. `o rótulo da decisão diz quantos pedidos ela alcança…` — nenhum botão antes de marcar; "Aprovar 1 pedido", "Aprovar 2
     pedidos"; nenhum "todos"; a marca da matrícula errada só no pedido que a teve (três pedidos, um com a marca).
  4. `lista lida e vazia…` — o vazio que a tela deu, o próximo passo, nenhuma decisão.
  5. `leitura que falha antes de haver lista…` — o erro e o "Tentar de novo", sem afirmar o vazio; o novo clique lê.
- **Vermelho antes:** `npx vitest run --project unidade apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx` com o
  `vitest.config.ts` original sai com `No test files found, exiting with code 1` (`include: **/*.test.ts`). Sem o `jsdom`, o
  mesmo arquivo falharia no `import` do ambiente.
- **Verde depois:** 5 de 5, três corridas seguidas (cerca de 1 s cada), no projeto que já roda em `TZ=Asia/Tokyo`.

A prova de que os casos não são enfeite está na seção "Mutações": cada cláusula da peça que eles dizem provar sai, e o caso cai.

O que o teste de componente **não** substitui, e fica no e2e: o diálogo da decisão (`DialogoDeDecisao`, que é `<dialog>`), a
gravação, o foco depois do fechamento e a navegação entre telas. A `ListaDePedidos` continua coberta por `e2e/` nisso.

## Correção

- `apps/web/package.json` e `package-lock.json`: `jsdom` 30.1.1, `@testing-library/react` 16.3.3, `@testing-library/dom` 10.4.2 e
  `@testing-library/user-event` 14.6.7, todas `devDependencies` do `@educa/web`, em versão exata (o lock do repositório não usa
  `^`). `jsdom` pede Node `^22.22.2`, e o `.nvmrc` está em 22. `npm audit --omit=dev` (a guarda da esteira) continua em zero: são
  dependências de desenvolvimento, e as duas advisories de `npm audit` completo (`brace-expansion` e `source-map-js`) já estavam
  no lock com as mesmas versões.
- `vitest.config.ts`: o projeto `unidade` passa a incluir `**/*.test.{ts,tsx}`. O ambiente **não** muda no projeto: o arquivo de
  componente declara `// @vitest-environment jsdom` na primeira linha, e a unidade da API, do worker e dos pacotes continua no
  Node, sem pagar o `jsdom`. Arquivo sem a linha cai em `document is not defined`: não passa calado.
- `apps/web/src/__fixtures__/tela.tsx`: o que todo teste de tela vai repetir, uma vez. `redeFalsa()` (o `fetch` global, com
  `responder`, `segurar` para ver o carregando, e o registro das chamadas com a credencial de cada uma), `prepararTela()` (abre a
  sessão pelo cookie como a aba faz, e desmonta a tela depois de cada caso) e `renderizarTela()` (o cliente de consultas **da
  aba**, `criarClienteDeConsultas`, novo a cada chamada). A rede é o único dublê: a peça, o cliente e o módulo de sessão são os de
  produção (regra 40: mock só do que está fora). O `jsdom` não faz layout nem calcula CSS: ele prova o que a tela diz e faz, e
  não o que ela mostra. Texto cortado, bloco desalinhado e celular espremido continuam sendo da vitrine
  (`tools/vitrine/`) e do e2e.
- `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx`: o primeiro caso, acima.
- `TODO.md`: o item M4 passa a feito, com o que ficou para outra mão (a linha "estados da tela" do modelo de tarefa).

Não muda: nenhum arquivo de produção (`apps/*/src` fora de `__fixtures__`, `packages/*/src`), `tools/processo/`, `tools/ci/`,
`.github/`, `.claude/` e o `package.json` da raiz. O portão da tarefa e a esteira já rodam a unidade inteira (`npm run
test:unidade`), e agora ela alcança os `.test.tsx`; nenhuma suíte nova foi criada.

## Mutações

Cada bloco tira uma cláusula da **peça**, ou da configuração, e o caso citado tem de cair.

```mutacao
arquivo: vitest.config.ts
teste: apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx
-          include: ['**/*.test.{ts,tsx}'],
+          include: ['**/*.test.ts'],
```

```mutacao
arquivo: apps/web/src/__fixtures__/tela.tsx
teste: apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx › professor: a lista é lida ao abrir
-    await abrirSessaoPeloCookie()
```

```mutacao
arquivo: apps/web/src/__fixtures__/tela.tsx
teste: apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx
-    cleanup()
     vi.unstubAllGlobals()
```

```mutacao
arquivo: apps/web/src/componentes/pedidos/ListaDePedidos.tsx
teste: apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx › professor: a lista é lida ao abrir
-        {!sozinha && (
+        {true && (
```

```mutacao
arquivo: apps/web/src/componentes/pedidos/ListaDePedidos.tsx
teste: apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx › professor: a lista é lida ao abrir
-{sozinha ? TEXTO_DA_ATUALIZACAO_SOZINHA : TEXTO_DA_AUDITORIA_DA_LEITURA}
+{!sozinha ? TEXTO_DA_ATUALIZACAO_SOZINHA : TEXTO_DA_AUDITORIA_DA_LEITURA}
```

```mutacao
arquivo: apps/web/src/componentes/pedidos/ListaDePedidos.tsx
teste: apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx › professor: a lista é lida ao abrir
-      if (pedidos.isFetching) return <EstadoCarregando rotulo="Carregando os pedidos…" />
+      if (pedidos.isFetching && false) return <EstadoCarregando rotulo="Carregando os pedidos…" />
```

```mutacao
arquivo: apps/web/src/api/pedidos.ts
teste: apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx › coordenação: nada é lido ao abrir
-    enabled: !daCoordenacao,
+    enabled: true,
```

```mutacao
arquivo: apps/web/src/componentes/pedidos/ListaDePedidos.tsx
teste: apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx › o rótulo da decisão diz quantos pedidos
-              {rotuloDaDecisao('aprovar', marcadosNaLista.length)}
+              {rotuloDaDecisao('aprovar', itens.length)}
```

```mutacao
arquivo: apps/web/src/componentes/pedidos/ListaDePedidos.tsx
teste: apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx › o rótulo da decisão diz quantos pedidos
-              {rotuloDaDecisao('recusar', marcadosNaLista.length)}
+              {rotuloDaDecisao('recusar', itens.length)}
```

```mutacao
arquivo: apps/web/src/componentes/pedidos/ListaDePedidos.tsx
teste: apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx › o rótulo da decisão diz quantos pedidos
-                    {pedido.teveMatriculaErrada && <span
+                    {true && <span
```

```mutacao
arquivo: apps/web/src/componentes/pedidos/ListaDePedidos.tsx
teste: apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx › lista lida e vazia
-    if (itens.length === 0) {
+    if (itens.length < 0) {
```

```mutacao
arquivo: apps/web/src/componentes/pedidos/ListaDePedidos.tsx
teste: apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx › leitura que falha antes de haver lista
       if (pedidos.isFetching) return <EstadoCarregando rotulo="Carregando os pedidos…" />
-      if (pedidos.isError) return erroDaLeitura
       // Só a coordenação chega aqui: a lista dela ainda não foi pedida.
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral, 1ª | Versão do Node: `engines` da raiz em `>=22.18.0 <23`, e o `jsdom` 30.1.1 pede `^22.22.2`; subir o piso para 22.22.2 | `TODO.md`, ao lado do item M4 que a correção já edita: o `package.json` da raiz está declarado fora desta correção. Esteira e `.nvmrc` (22.23.2) passam |
| test-engineer, 1ª | Dois alunos com o mesmo nome na lista (a marcação é por id) | `TODO.md`: primeira tarefa que alterar a `ListaDePedidos` ou o `DialogoDeDecisao` leva o caso. Caso novo exige bloco de mutação novo e muda o alcance da correção, que é criar a capacidade |
| test-engineer, 1ª | Releitura que falha com a lista já na tela, e com a lista lida e vazia (`ListaDePedidos.tsx:118,123`) | `TODO.md`, mesma tarefa acima |
| test-engineer, 1ª | Limite de 40 marcados, "há mais pedidos" e o anúncio dos pedidos novos na região viva (`ListaDePedidos.tsx:128,152,153-157,194-196`) | `TODO.md`, mesma tarefa acima |
| test-engineer, 1ª | `DialogoDeDecisao`: testar se o `jsdom` 30 já cobre `showModal` quando a linha "estados da tela" do modelo de tarefa mudar | `TODO.md`, junto da linha "estados da tela" do item M4: depende de arquivo de `.claude/`, que a correção declara fora |
| frontend-reviewer, 1ª | Quando a linha "estados da tela" do `task-template.md` passar a pedir teste de componente, exigir que cite `__fixtures__/tela.tsx` para não nascer um segundo auxiliar | `TODO.md`, mesmo item: é do modelo de tarefa, feito por outra mão depois desta correção |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.
| 2026-10-12 11:08:58 | 2026-10-12 11:09:47 | `revisor-geral` | 1 | APROVADO | a305da0487c9be658 |
| 2026-10-12 11:08:56 | 2026-10-12 11:09:59 | `test-engineer` | 1 | APROVADO | adc4bbecff49682ca |
| 2026-10-12 11:08:59 | 2026-10-12 11:10:16 | `frontend-reviewer` | 1 | APROVADO | a9900e4ed7c439b49 |
| 2026-10-12 11:14:13 | 2026-10-12 11:15:03 | `test-engineer` | 2 | APROVADO | a86eb904e5440c38b |
| 2026-10-12 11:14:21 | 2026-10-12 11:15:04 | `revisor-geral` | 2 | APROVADO | a526ad888b5e62fcf |
