# Tarefa 3.0 — A coordenação navega por quatro lugares e abre no Painel

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A lateral e a barra de baixo passam a ter Painel, Analista, Escola e Registros; Escola e Registros mostram as telas de hoje em abas, nos mesmos endereços; e quem entra chega ao Painel.

## Contexto necessário

- `techspec.md` seções 5 (endereços), 7c ("Bundle"), 9 ("Molduras", "Altura", "Nomes que não mudam") e 10; `prd.md` RF1, RF2, RF3, RF10, RF17
- `mockup.md` seções 0, 3 e 5 (os cabeçalhos); `e2e/__fixtures__/casca.ts`

## Subtarefas

- [x] 3.1 — `navegacao.ts`: os quatro lugares, com `tambemEm` e ícone; `Inicio.tsx` leva ao Painel
- [x] 3.2 — As molduras `Escola` (Turmas, Professores, Material) e `Registros` (IA, Pedidos, Privacidade)
- [x] 3.3 — `rotas.tsx`: cada rota na moldura dela; `Estrutura`, `ListaDaTurma` e `Professores` por `lazy()`; as telas de dentro sem `Tela`; "‹ Escola" na lista da turma e "‹ Registros" em `Agentes`
- [x] 3.4 — `Privacidade.tsx`: as três abas que sobram viram `Segmentado` ("Prazos de guarda", "Empresas", "Incidentes"), nos mesmos endereços
- [x] 3.5 — `e2e/__fixtures__/coordenacao.ts`: `irPelaCoordenacao` e `paginaNaoRola`. Em `casca.ts`, onde a coordenação abre muda **num lugar só**: o corpo de `esperarGovernanca`, que passa a se chamar `esperarPainel`, e o `toHaveURL` de `entrarComoCoordenacaoNaMesmaAba`
- [x] 3.6 — Nos specs, troca mecânica: `irPelaNavegacao` dos sete itens por `irPelaCoordenacao`, o nome da fixture, o `h1` e o `toHaveTitle`. **Nenhuma outra asserção muda**
- [x] 3.7 — Mover sem editar: de `estrutura.spec.ts`, a lista para `lista-da-turma.spec.ts` e a alocação para `alocacao.spec.ts`; de `governanca.spec.ts`, Agentes para `agentes.spec.ts`, e o Analista e o nominal para `analista.spec.ts`
- [x] 3.8 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/navegacao.ts`, `apps/web/src/areas/navegacao.test.ts`, `apps/web/src/paginas/Inicio.tsx` | alterado |
| `apps/web/src/areas/coordenacao/Escola.tsx`, `apps/web/src/areas/coordenacao/Registros.tsx`, `apps/web/src/areas/coordenacao/molduras.test.tsx` | novo |
| `apps/web/src/areas/coordenacao/rotas.tsx`, `apps/web/src/areas/coordenacao/Estrutura.tsx`, `apps/web/src/areas/coordenacao/ListaDaTurma.tsx`, `apps/web/src/areas/coordenacao/Professores.tsx`, `apps/web/src/areas/coordenacao/Material.tsx` | alterado |
| `apps/web/src/areas/coordenacao/Governanca.tsx`, `apps/web/src/areas/coordenacao/Agentes.tsx`, `apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx` | alterado |
| `apps/web/src/componentes/icones/lugares.tsx`, `apps/web/src/areas/coordenacao/moldura.tsx`, `apps/web/src/areas/coordenacao/passagens.test.tsx` | alterado (`moldura.tsx` e `passagens.test.tsx` são novos) |
| `apps/web/src/caminhos.ts`, `apps/web/src/componentes/Abas.tsx` | alterado: a lista de endereços (`pedidos`, o seletor da Privacidade) e a prop `classeDoPainel` |
| `e2e/__fixtures__/coordenacao.ts`, `e2e/lista-da-turma.spec.ts`, `e2e/alocacao.spec.ts`, `e2e/agentes.spec.ts`, `e2e/analista.spec.ts` | novo |
| `e2e/__fixtures__/casca.ts`, `e2e/__fixtures__/fluxo-do-professor.ts`, `e2e/__fixtures__/pedidos-do-titular.ts` | alterado |
| `e2e/areas.spec.ts`, `e2e/estrutura.spec.ts`, `e2e/governanca.spec.ts`, `e2e/professores.spec.ts`, `e2e/material.spec.ts`, `e2e/privacidade.spec.ts`, `e2e/incidentes.spec.ts`, `e2e/pedidos.spec.ts` | alterado |
| `e2e/pedidos-do-titular.spec.ts`, `e2e/escola-montada.spec.ts`, `e2e/escola-e-vinculos.spec.ts`, `e2e/mfa.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts` | alterado |

`apps/web/nome-dos-chunks.test.ts` e `e2e/pedido-do-titular.spec.ts` não precisaram mudar: o `Segmentado` é da entrada (a `Aparencia` o usa) e continua fora de `PECAS_FORA_DA_ENTRADA`, e o detalhe do pedido não mudou de moldura.

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| os lugares | unidade | quatro itens, na ordem; cada endereço de hoje acende o lugar dele |
| estados da tela: as molduras | componente | a aba do endereço é a selecionada; trocar navega; um `h1` só |
| W2, onde abre e os cliques | e2e | a lista de `areas.spec.ts`; a 360 px, os quatro na barra de baixo; entra em `/coordenacao/painel`; cada tela a até dois cliques, Empresas e Incidentes a três |
| recomeço: segunda pessoa; troca de escola | e2e | os casos de hoje, sem perder asserção |

## Como testar

- Moldes: `e2e/areas.spec.ts › W2` (`ITENS_DA_COORDENACAO`) e `apps/web/src/areas/navegacao.test.ts`
- Caso movido: `git diff --color-moved` mostra que o corpo não mudou
- Rodar: `node tools/ci/e2e.ts --manter-ambiente e2e/areas.spec.ts`, e cada spec tocado, um por vez
- Telas: `coordenacao`, `/coordenacao/painel`, `/coordenacao/estrutura`, `/coordenacao/governanca`, `/coordenacao/privacidade/retencao`; mockup `/coordenacao/escola`, `/coordenacao/registros`

## Fora do escopo desta tarefa

Recompor o miolo das telas (4.0 a 13.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A aba IA de Registros traz o link "Como cada IA trabalha" para `/agentes`, já nesta tarefa e não na 10.0 | O item Agentes sai da lateral e o Painel só leva a `/agentes` quando há função suspensa: sem o link, a tela ficaria a mais de dois cliques (RF3) e os e2e dos Agentes não teriam como chegar a ela | `techspec.md` §5, parágrafo "Como se chega aos Agentes (3.0)"; `prd.md` RF3 |
| Asserções que citavam a forma antiga mudam com o elemento: aba da Privacidade vira `radio` (`aria-selected` → `aria-checked`, nomes "Prazos de guarda", "Empresas", "Incidentes"), "Estrutura"/"Professores" da lateral vira "Escola", "Voltar para Estrutura" vira "Voltar para Escola", e a coordenação no celular passa a ter barra de baixo com os quatro lugares | A subtarefa 3.6 pede troca mecânica sem mudar asserção, mas a regra que o teste prova é a mesma: só o elemento que a carrega mudou (RF1, RF17). Nenhuma asserção foi tirada ou afrouxada | `techspec.md` §5, parágrafo "O que muda de asserção com a forma da tela (3.0)"; `prd.md` RF1 e RF17 |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/areas/navegacao.ts
teste: apps/web/src/areas/navegacao.test.ts › cada endereço de hoje da coordenação acende o lugar dele
-    { rotulo: 'Escola', caminho: ROTAS.estrutura, icone: { lugar: 'escola' }, tambemEm: [ROTAS.professores, ROTAS.material] },
+    { rotulo: 'Escola', caminho: ROTAS.estrutura, icone: { lugar: 'escola' } },
```

```mutacao
arquivo: apps/web/src/areas/navegacao.ts
teste: apps/web/src/areas/navegacao.test.ts › cada endereço de hoje da coordenação acende o lugar dele
-    { rotulo: 'Registros', caminho: ROTAS.governanca, icone: { lugar: 'registros' }, tambemEm: [ROTAS.agentes, ROTAS.privacidade] },
+    { rotulo: 'Registros', caminho: ROTAS.governanca, icone: { lugar: 'registros' } },
```

```mutacao
arquivo: apps/web/src/areas/navegacao.ts
teste: apps/web/src/areas/navegacao.test.ts › os quatro lugares da coordenação
-    { rotulo: 'Painel', caminho: ROTAS.painel, icone: { lugar: 'painel' } },
+    { rotulo: 'Painel', caminho: ROTAS.analista, icone: { lugar: 'painel' } },
```

```mutacao
arquivo: apps/web/src/areas/navegacao.ts
teste: apps/web/src/componentes/itens-da-lateral.test.tsx › o ícone ilustrado é de Início
-    { rotulo: 'Painel', caminho: ROTAS.painel, icone: { lugar: 'painel' } },
+    { rotulo: 'Painel', caminho: ROTAS.painel, icone: { lugar: 'escola' } },
```

```mutacao
arquivo: apps/web/src/areas/navegacao.ts
teste: apps/web/src/componentes/itens-da-lateral.test.tsx › o ícone ilustrado é de Início
-    { rotulo: 'Analista', caminho: ROTAS.analista, icone: { lugar: 'ia' } },
+    { rotulo: 'Analista', caminho: ROTAS.analista, icone: { lugar: 'painel' } },
```

```mutacao
arquivo: apps/web/src/areas/navegacao.ts
teste: apps/web/src/componentes/itens-da-lateral.test.tsx › o ícone ilustrado é de Início
-    { rotulo: 'Escola', caminho: ROTAS.estrutura, icone: { lugar: 'escola' }, tambemEm: [ROTAS.professores, ROTAS.material] },
+    { rotulo: 'Escola', caminho: ROTAS.estrutura, icone: { lugar: 'registros' }, tambemEm: [ROTAS.professores, ROTAS.material] },
```

```mutacao
arquivo: apps/web/src/areas/navegacao.ts
teste: apps/web/src/componentes/itens-da-lateral.test.tsx › o ícone ilustrado é de Início
-    { rotulo: 'Registros', caminho: ROTAS.governanca, icone: { lugar: 'registros' }, tambemEm: [ROTAS.agentes, ROTAS.privacidade] },
+    { rotulo: 'Registros', caminho: ROTAS.governanca, icone: { lugar: 'ia' }, tambemEm: [ROTAS.agentes, ROTAS.privacidade] },
```

```mutacao
arquivo: apps/web/src/paginas/Inicio.tsx
teste: apps/web/src/areas/coordenacao/passagens.test.tsx › a coordenação é levada ao Painel
-  if (papel === 'coordenador') return <Redirect to={ROTAS.painel} replace />
+  if (papel === 'coordenador') return <Redirect to={ROTAS.painel} />
```

```mutacao
arquivo: apps/web/src/paginas/Inicio.tsx
teste: apps/web/src/areas/coordenacao/passagens.test.tsx › a coordenação é levada ao Painel
-  if (papel === 'coordenador') return <Redirect to={ROTAS.painel} replace />
+  if (papel === 'coordenador') return <Redirect to={ROTAS.analista} replace />
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Agentes.tsx
teste: apps/web/src/areas/coordenacao/passagens.test.tsx › Agentes volta para Registros
-    <Link to={ROTAS_DA_COORDENACAO.governanca} aria-label="Voltar para Registros" className="inline-flex min-h-11 items-center gap-2 self-start text-caramelo-texto underline">
+    <Link to={ROTAS_DA_COORDENACAO.painel} aria-label="Voltar para Registros" className="inline-flex min-h-11 items-center gap-2 self-start text-caramelo-texto underline">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/coordenacao/passagens.test.tsx › a lista da turma volta para Escola
-    <Link to={ROTAS_DA_COORDENACAO.estrutura} aria-label="Voltar para Escola" className="inline-flex min-h-11 items-center gap-2 self-start text-caramelo-texto underline">
+    <Link to={ROTAS_DA_COORDENACAO.professores} aria-label="Voltar para Escola" className="inline-flex min-h-11 items-center gap-2 self-start text-caramelo-texto underline">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Governanca.tsx
teste: apps/web/src/areas/coordenacao/passagens.test.tsx › leva aos Agentes pelo link
-        <Link to={ROTAS_DA_COORDENACAO.agentes} className={CLASSES_DO_LINK_SECUNDARIO}>
+        <Link to={ROTAS_DA_COORDENACAO.analista} className={CLASSES_DO_LINK_SECUNDARIO}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/moldura.tsx
teste: apps/web/src/areas/coordenacao/molduras.test.tsx › só o miolo rola a partir de 768 px
-          classeDoPainel={O_MIOLO_QUE_ROLA}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/moldura.tsx
teste: apps/web/src/areas/coordenacao/molduras.test.tsx › a tela de dentro leva o foco ao título da moldura
-      <Tela titulo={titulo} refDoTitulo={tituloRef}>
+      <Tela titulo={titulo}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/moldura.tsx
teste: apps/web/src/areas/coordenacao/molduras.test.tsx › só o miolo rola a partir de 768 px
-const O_MIOLO_QUE_ROLA = 'md:relative md:max-h-[calc(100dvh-17rem)] md:overflow-y-auto'
+const O_MIOLO_QUE_ROLA = 'md:relative md:max-h-[calc(100dvh-17rem)] md:overflow-y-visible'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/moldura.tsx
teste: apps/web/src/areas/coordenacao/molduras.test.tsx › só o miolo rola a partir de 768 px
-const O_MIOLO_QUE_ROLA = 'md:relative md:max-h-[calc(100dvh-17rem)] md:overflow-y-auto'
+const O_MIOLO_QUE_ROLA = 'md:max-h-[calc(100dvh-17rem)] md:overflow-y-auto'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/moldura.tsx
teste: e2e/areas.spec.ts › a coordenação abre no Painel
-const O_MIOLO_QUE_ROLA = 'md:relative md:max-h-[calc(100dvh-17rem)] md:overflow-y-auto'
+const O_MIOLO_QUE_ROLA = 'md:relative md:max-h-[calc(100dvh-5rem)] md:overflow-y-auto'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/moldura.tsx
teste: apps/web/src/areas/coordenacao/molduras.test.tsx › trocar de aba desmonta a tela de antes
-          <Suspense key={ativa} fallback={<EstadoCarregando rotulo="Carregando…" />}>{children}</Suspense>
+          <Suspense fallback={<EstadoCarregando rotulo="Carregando…" />}>{children}</Suspense>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/moldura.tsx
teste: apps/web/src/areas/coordenacao/molduras.test.tsx › trocar de aba navega
-            if (aba !== undefined) navegar(aba.caminho)
+            if (aba !== undefined) undefined
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/moldura.tsx
teste: apps/web/src/areas/coordenacao/molduras.test.tsx › a aba do endereço
-  useTituloDaTela(tituloDaAba)
+  useTituloDaTela(titulo)
```

```mutacao
arquivo: apps/web/src/componentes/Abas.tsx
teste: apps/web/src/areas/coordenacao/molduras.test.tsx › só o miolo rola a partir de 768 px
-      <div role="tabpanel" id={idDoPainel} {...(ativaExiste ? { 'aria-labelledby': idDaAba(ativa) } : { 'aria-label': rotulo })} tabIndex={0} className={`min-w-0 ${classeDoPainel}`.trim()}>
+      <div role="tabpanel" id={idDoPainel} {...(ativaExiste ? { 'aria-labelledby': idDaAba(ativa) } : { 'aria-label': rotulo })} tabIndex={0} className={`min-w-0`.trim()}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Escola.tsx
teste: apps/web/src/areas/coordenacao/molduras.test.tsx › as três abas, na ordem, cada uma no endereço de hoje
-  { id: 'professores', rotulo: 'Professores', caminho: ROTAS_DA_COORDENACAO.professores },
+  { id: 'professores', rotulo: 'Professores', caminho: ROTAS_DA_COORDENACAO.material },
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Escola.tsx
teste: apps/web/src/areas/coordenacao/molduras.test.tsx › a aba do endereço
-  material: 'Escola: material',
+  material: 'Escola: materiais',
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Registros.tsx
teste: apps/web/src/areas/coordenacao/molduras.test.tsx › a Privacidade, nos prazos de guarda
-  { id: 'privacidade', rotulo: 'Privacidade', caminho: caminhoDaAbaDaPrivacidade('retencao') },
+  { id: 'privacidade', rotulo: 'Privacidade', caminho: caminhoDaAbaDaPrivacidade('incidentes') },
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Registros.tsx
teste: apps/web/src/areas/coordenacao/molduras.test.tsx › os pedidos abrem em /privacidade/pedidos
-  { id: 'pedidos', rotulo: 'Pedidos', caminho: ROTAS_DA_COORDENACAO.pedidos },
+  { id: 'pedidos', rotulo: 'Pedidos', caminho: ROTAS_DA_COORDENACAO.governanca },
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Registros.tsx
teste: apps/web/src/areas/coordenacao/molduras.test.tsx › a aba do endereço
-  privacidade: 'Registros: privacidade',
+  privacidade: 'Registros: privacidades',
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx
teste: apps/web/src/areas/coordenacao/molduras.test.tsx › uma tela que não existe abre os pedidos
-  if (!ehTelaDoSeletorDaPrivacidade(aba)) return <Redirect to={ROTAS_DA_COORDENACAO.pedidos} replace />
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx
teste: apps/web/src/areas/coordenacao/molduras.test.tsx › uma tela que não existe abre os pedidos
-  if (!ehTelaDoSeletorDaPrivacidade(aba)) return <Redirect to={ROTAS_DA_COORDENACAO.pedidos} replace />
+  if (!ehTelaDoSeletorDaPrivacidade(aba)) return <Redirect to={ROTAS_DA_COORDENACAO.governanca} replace />
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx
teste: apps/web/src/areas/coordenacao/molduras.test.tsx › escolher no seletor navega
-  { valor: 'suboperadores', rotulo: 'Empresas' },
+  { valor: 'suboperadores', rotulo: 'Empresas que recebem dados' },
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx
teste: apps/web/src/areas/coordenacao/molduras.test.tsx › escolher no seletor navega
-      <Segmentado rotulo="O que ver em Privacidade" opcoes={TELAS_DA_PRIVACIDADE} valor={aba} aoMudar={(id) => navegar(caminhoDaAbaDaPrivacidade(id))} />
+      <Segmentado rotulo="O que ver em Privacidade" opcoes={TELAS_DA_PRIVACIDADE} valor={aba} aoMudar={(id) => undefined} />
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx
teste: e2e/privacidade.spec.ts › a coordenação abre Privacidade pela navegação
-      {aba === 'suboperadores' ? <EmpresasQueRecebemDados /> : aba === 'incidentes' ? <Incidentes /> : <Retencao />}
+      {aba === 'suboperadores' ? <EmpresasQueRecebemDados /> : aba === 'incidentes' ? <Incidentes /> : <EmpresasQueRecebemDados />}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx
teste: e2e/incidentes.spec.ts › dois incidentes: os dois esperam
-      {aba === 'suboperadores' ? <EmpresasQueRecebemDados /> : aba === 'incidentes' ? <Incidentes /> : <Retencao />}
+      {aba === 'suboperadores' ? <EmpresasQueRecebemDados /> : aba === 'incidentes' ? <Retencao /> : <Retencao />}
```

```mutacao
arquivo: apps/web/src/caminhos.ts
teste: apps/web/src/areas/coordenacao/molduras.test.tsx › /privacidade/incidentes marca
-export const TELAS_DO_SELETOR_DA_PRIVACIDADE = ['retencao', 'suboperadores', 'incidentes'] as const
+export const TELAS_DO_SELETOR_DA_PRIVACIDADE = ['retencao', 'suboperadores'] as const
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Professores.tsx
teste: e2e/professores.spec.ts › Nenhum professor ainda
-  const focarNaLista = useCallback(() => (tituloDaLista.current === null ? focarOTituloDaMoldura() : tituloDaLista.current.focus()), [focarOTituloDaMoldura])
+  const focarNaLista = useCallback(() => (tituloDaLista.current === null ? undefined : tituloDaLista.current.focus()), [focarOTituloDaMoldura])
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/rotas.tsx
teste: e2e/areas.spec.ts › a coordenação abre no Painel
-          <Escola aba="turmas">
+          <Escola aba="professores">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/rotas.tsx
teste: e2e/areas.spec.ts › a coordenação abre no Painel
-          <Escola aba="professores">
+          <Escola aba="material">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/rotas.tsx
teste: e2e/areas.spec.ts › a coordenação abre no Painel
-          <Escola aba="material">
+          <Escola aba="turmas">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/rotas.tsx
teste: e2e/areas.spec.ts › a coordenação abre no Painel
-          <Registros aba="ia">
+          <Registros aba="pedidos">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/rotas.tsx
teste: e2e/areas.spec.ts › a coordenação abre no Painel
-            <Registros aba="privacidade">
+            <Registros aba="ia">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/rotas.tsx
teste: e2e/areas.spec.ts › a coordenação abre no Painel
-          <Registros aba="pedidos">
+          <Registros aba="ia">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/rotas.tsx
teste: e2e/privacidade.spec.ts › o endereço sem aba
-        <Route path={ROTAS_DA_COORDENACAO.pedidos}>
+        <Route path={ROTAS_DA_COORDENACAO.pedidoDoTitular}>
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › cada forma tem a cor que a 9.4 dá a ela
-      <rect x="5" y="7" width="38" height="34" rx="6" className="fill-anil" />
+      <rect x="5" y="7" width="38" height="34" rx="6" className="fill-amarelo" />
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › cada forma tem a cor que a 9.4 dá a ela
-      <path d="M13 7h22a8 8 0 0 1 8 8v12a8 8 0 0 1-8 8H24l-9 7v-7h-2a8 8 0 0 1-8-8V15a8 8 0 0 1 8-8z" className="fill-anil" />
+      <path d="M13 7h22a8 8 0 0 1 8 8v12a8 8 0 0 1-8 8H24l-9 7v-7h-2a8 8 0 0 1-8-8V15a8 8 0 0 1 8-8z" className="fill-azul" />
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › cada forma tem a cor que a 9.4 dá a ela
-      <rect x="18" y="10" width="12" height="16" rx="2" className="fill-azul" />
+      <rect x="18" y="10" width="12" height="16" rx="2" className="fill-anil" />
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › cada forma tem a cor que a 9.4 dá a ela
-      <rect x="9" y="5" width="30" height="38" rx="5" className="fill-amarelo" />
+      <rect x="9" y="5" width="30" height="38" rx="5" className="fill-azul" />
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer 1ª; revisor-geral 1ª | "Estrutura" em `Pedidos.tsx:91`, `DetalheDoPedido.tsx:181` e `:185`, `privacidade/textos-dos-pedidos.ts:86,90,114` e `privacidade/textos-do-pedido.ts:163,207` | Tarefa 12.0: ela já altera `Pedidos.tsx`, `DetalheDoPedido.tsx` e `textos-dos-pedidos.ts`; `textos-do-pedido.ts` está no "Código" dela. A 3.0 não toca esses arquivos nem os testes dos textos. O Orquestrador leva ao Arquiteto o pedido de acrescentar a troca ao `12_task.md` |
| frontend-reviewer 1ª | Escola a 360 px: a aba "Material" cai numa segunda linha | `TODO.md`: mexe no layout do `Abas` para as quatro telas de abas, não numa tela só |
| frontend-reviewer 1ª | Registros › IA: "Como cada IA trabalha" e "Consumo do mês por função" encostam no texto de cima | Tarefa 10.0, que recompõe a aba |
| frontend-reviewer 1ª | Sombra ou borda no pé do miolo que rola | `TODO.md`: decisão de desenho do mockup, que só faz sentido depois de a altura fechar |
| revisor-geral 1ª | Tirar a asserção `expect(cliquesAte(tela)…)` | Recusada: a 3.0 declara que nenhuma asserção saiu (divergência 2); entrou o comentário do test-engineer no lugar |
| test-engineer 1ª | `passagens.test.tsx › Agentes volta para Registros` só olha o estado carregando | Recusada: o `voltar` é a mesma constante nos três estados, e o próprio test-engineer diz que o teste basta |
| revisor-geral 2ª; frontend-reviewer 2ª | `paginaNaoRola` (`e2e/__fixtures__/coordenacao.ts`): o `expect.poll` aceita a primeira amostra, inclusive com "Carregando…" na tela | Tarefa 11.0: apertar a medida deixa o laço vermelho em `/coordenacao/agentes`, que ainda rola a página, e é a 11.0 que recompõe os Agentes |
| frontend-reviewer 2ª | `/coordenacao/agentes` rola a página inteira a 1366 × 768 (`Agentes.tsx` usa `Tela` própria); o comentário de `e2e/areas.spec.ts` ("em nenhuma tela de Escola nem de Registros") afirma mais do que é verdade | Tarefa 11.0, que recompõe a tela dos Agentes; o comentário se ajusta junto |
| revisor-geral 2ª | O comentário de `e2e/areas.spec.ts` diz que `paginaNaoRola` mede "na tela com o miolo mais longo", mas o laço mede todas | Tarefa 11.0, junto com o ajuste do `paginaNaoRola` |
| frontend-reviewer 2ª | `17rem` é constante, medida a 1366 × 768, com 14 px de folga; título com descrição ou sino em duas linhas reabre a rolagem | `TODO.md`: já tem o item do miolo que rola; cadeia flex com `min-h-0` quando a altura for revista |
| test-engineer 2ª | O `md:relative` do painel só tem bloco contra a string da classe; declarar também contra `e2e/areas.spec.ts` | `TODO.md`: depende de o `paginaNaoRola` esperar o conteúdo (11.0); sem isso o bloco pode não ficar vermelho |
| test-engineer 2ª | O redirecionamento de `/privacidade` sem aba (`rotas.tsx`) não tem bloco próprio | Recusada: já é provado por `e2e/privacidade.spec.ts` (o endereço sem aba), e um bloco a mais não muda o que é provado |
| frontend-reviewer 2ª | "Estrutura" na tela dos pedidos: `Pedidos.tsx:91`, `DetalheDoPedido.tsx:181,185`, `textos-dos-pedidos.ts:86,90,114`, `textos-do-pedido.ts:163,207` | Tarefa 12.0: o `12_task.md` só traz a troca do link da 12.3, e o Arquiteto precisa acrescentar o resto (pendência do Orquestrador) |
| frontend-reviewer 2ª | Aba "Material" em duas linhas a 360 px; "Colégio s…" cortado no cabeçalho do celular; Registros › IA com texto encostado | `TODO.md` (as duas primeiras, a do cabeçalho junto com a das abas) e tarefa 10.0 (a terceira) |
| frontend-reviewer 2ª | A escola "vazia" da vitrine tem os sete passos feitos | Não é defeito da 3.0: o e2e W4 de `areas.spec.ts` cobre o estado |
| revisor-geral 2ª | O parágrafo sobre `nome-dos-chunks.test.ts` quebrava a tabela de "Arquivos previstos", e `Inicio.tsx` aparecia em duas linhas | Aplicada: o parágrafo foi para depois da tabela e `Inicio.tsx` ficou numa linha só |

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
| 2026-10-16 21:20:37 | 2026-10-16 21:24:30 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | a1fcad9d94bd71e08 |
| 2026-10-16 21:20:59 | 2026-10-16 21:24:56 | `revisor-geral` | 1 | REPROVADO | a38779655ff72cb5c |
| 2026-10-16 21:20:43 | 2026-10-16 21:25:44 | `test-engineer` | 1 | REPROVADO | aa29e03d3ba7fb00e |
| 2026-10-16 22:08:57 | 2026-10-16 22:10:41 | `revisor-geral` | 2 | APROVADO | a97544be0507b937b |
| 2026-10-16 22:08:43 | 2026-10-16 22:10:56 | `test-engineer` | 2 | APROVADO | a748009ada4848d85 |
| 2026-10-16 22:08:33 | 2026-10-16 22:12:22 | `frontend-reviewer` | 2 | APROVADO | aee26289e27f1c3f7 |
