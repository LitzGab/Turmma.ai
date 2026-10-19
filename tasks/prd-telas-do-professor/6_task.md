# Tarefa 6.0 — O documento aberto em folha

**Funcionalidade:** telas-do-professor · **Depende de:** 5.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O artefato abre como documento: cabeçalho com abas, a folha de 760 px sobre a mesa e a página de cada questão. Renomear,
exportar, pedir versão adaptada, quem decidiu cada versão, aplicar com "é avaliativa?" e encerrar continuam como são.

## Contexto necessário

- `techspec.md` seções 5 (abas no endereço), 7b e 9 (Documento); `prd.md` RF13, RF20 e RF22; `mockup.md` 10.2
- Regra 70, itens 3 e 6: a versão adaptada só vai a aluno aprovada; a atividade só vai à turma por "Aplicar à turma".
  O mockup funde aprovar e enviar num ato só e não pergunta "é avaliativa?": aqui os dois atos continuam separados
- Código: `Artefato.tsx` (o voltar, linhas 78 a 84; as versões, 217 a 231); `AplicacaoDoArtefato.tsx` (o diálogo de
  encerrar, linhas 224 a 242); `entregas.ts` (`saidaEmPdf`, `podeRenomear`)

## Subtarefas

- [x] 6.1 — `Artefato.tsx`: o endereço fica `/professor/artefatos/:id` (RF2). Cabeçalho com o voltar "Voltar para
  Criados", o título, o selo e a linha de dados; abas "Conteúdo", "Versões adaptadas" e "Na turma" em `?aba=`
  (`replace`; valor desconhecido cai em Conteúdo; a aba das versões só existe com versão); o interruptor "Gabarito",
  ligado de início como hoje; o conteúdo numa `Folha` de 760 px sobre `mesa`, com a página de cada questão. A
  assinatura da IA e a linha de quem decidiu ficam
- [x] 6.2 — `EncerramentoDaAtividade.tsx`, extraído de `AplicacaoDoArtefato`: o botão "Encerrar a atividade" e o diálogo
  de confirmação, com o mesmo resumo, o mesmo efeito e o mesmo envio único. A 11.0 o usa no painel. Nada muda de
  comportamento
- [x] 6.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/Artefato.tsx`, `AplicacaoDoArtefato.tsx` | alterado (em `apps/web/src/areas/professor/`); `ConteudoDoArtefato.tsx` não muda de props, a 4.0 o usa |
| `apps/web/src/areas/professor/Folha.tsx`, `EncerramentoDaAtividade.tsx`, `Artefato.test.tsx`, `EncerramentoDaAtividade.test.tsx` | novo |
| `e2e/professor-artefato.spec.ts`, `e2e/professor-aplicacao.spec.ts` | alterado (a 2.5 os criou) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| estados | componente | carregando; erro com "Tentar de novo"; documento de outra turma, de outra escola e inexistente com a mesma tela (regra 10, item 6); com dado |
| a aba pelo endereço | componente | `?aba=turma` abre "Na turma"; `?aba=xyz` cai em Conteúdo; trocar de aba usa `replace` e não empilha histórico |
| a versão rejeitada não exporta | componente | sem "Exportar em PDF" e com o texto de hoje; a pendente exporta como rascunho; a aprovada, limpa |
| a versão adaptada nasce pendente | componente | a linha diz que espera a professora, sem botão de aplicar; o original ao lado continua aplicável |
| aplicar e encerrar | e2e | "Aplicar à turma" pede "é avaliativa?" e diz o efeito antes; "Encerrar a atividade" diz o que acontece; dois cliques em confirmar mandam um pedido só |
| a folha e a página | e2e | cada questão mostra a página de origem; renomear devolve o foco ao botão; a 360 px a folha não rola de lado e o último botão fica acima da barra de baixo |
| recomeço | e2e | recarregar mantém a aba; a segunda pessoa não vê o documento; sessão vencida no meio do renomear devolve o texto digitado. Log não se aplica: nada novo é gravado |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`); o diálogo, de
  `componentes/DialogoDeConfirmacao`
- e2e: `describe('o artefato')` e `describe('aplicar à turma e encerrar, no artefato (A3)')`, já divididos pela 2.5. Mudam o
  rótulo do voltar ("Voltar para Criados"), a aba que o teste abre antes de ver o bloco e a estrutura da folha; a
  asserção de cada regra fica
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/Artefato.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-artefato.spec.ts e2e/professor-aplicacao.spec.ts`
- Telas: `professora`, `/professor/artefatos/:id`, `--clicar 'role=link[name=/Abrir o artefato/]'`. Mockup: `/professor/criados/:id`

## Fora do escopo desta tarefa

Imprimir, Apresentar, PPTX, Lado a lado, o sumário lateral, a aba Resultados, o envio em dois passos, "Aprovar e enviar",
recusar com motivo, apagar e "Sobre este documento" (F7, PRD seção 3); a lista de Criados (5.0); a decisão da versão
adaptada, que fica na tela do Assistente.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| `ConteudoDoArtefato` ganha a prop **opcional** `comGabarito` (padrão `true`); a tabela de arquivos dizia "não muda de props" | o interruptor "Gabarito" (6.1) precisa tirar a marca da certa e a explicação sem trocar o conteúdo; a prop opcional não muda quem já usa a peça (a 4.0 e `ResultadoDaFerramenta` não a passam e continuam iguais), e o teste do padrão está em `Artefato.test.tsx` | `techspec.md` §9 ("O documento aberto", item 1) |
| A aba **Versões adaptadas** só existe com versão (como a tarefa manda) e a **Na turma** só na atividade objetiva; o plano de aula tem só Conteúdo | "Aplicar à turma" é da atividade; o plano não tem o que aplicar, e `AplicacaoDoArtefato` já devolvia `null` para ele (uma aba vazia seria um beco). `?aba=turma` num plano cai em Conteúdo pelo mesmo caminho do valor desconhecido | `techspec.md` §9 ("O documento aberto", item 2) |
| A assinatura da IA, a adaptação aplicada e a situação da versão adaptada (o "selo": pendente, aprovada por quem e quando, rejeitada com o motivo; o texto do PDF; "Ver e decidir"; "Abrir a atividade de origem") ficam **acima das abas**, e não dentro de Conteúdo | a tarefa manda manter "a assinatura da IA e a linha de quem decidiu"; à vista em toda aba, a decisão sobre a saída de IA não depende da aba aberta (regra 70, itens 3 e 6), e o e2e do HEAD já as procurava sem aba | `techspec.md` §9 ("O documento aberto", item 3) |
| A `Folha` não tem mesa nem borda abaixo de 768 px | o celular do mockup (10.2) é "a folha sem borda e sem mesa"; a 360 px uma folha de 760 px dentro de uma mesa com respiro tiraria 80 px da largura de leitura. O sumário lateral e o "Lado a lado" são do F7 | `techspec.md` §9 ("O documento aberto", item 4); `docs/interface.md` 1 (Criados) |
| `EncerramentoDaAtividade` leva o botão, o diálogo, a trava do envio único e o aviso da falha; "Corrigir de novo" (a atividade já encerrada, sem confirmação) ganha mutation própria (`corrigir`) em `AplicacaoDoArtefato`, com o aviso de falha dela | o botão e o diálogo dividiam a mutation `encerrar` com o "Corrigir de novo"; extrair o diálogo sem separar as duas deixaria a falha de um aparecer no outro | `techspec.md` §9 ("O documento aberto", item 5) |
| `e2e/a3-a4-professor.spec.ts` e `e2e/roteiro-da-demonstracao.spec.ts` clicam na aba "Na turma" antes de aplicar; `docs/roteiro-da-demonstracao.md` e `docs/interface.md` dizem o mesmo | a seção de aplicar só existe com a aba aberta; os dois specs não estão em "Arquivos previstos", mas quebrariam na esteira, e o portão não os acharia (nenhum texto foi tirado da web) | `techspec.md` §9 ("O documento aberto", item 6) |
| Os casos novos de e2e de recomeço (a segunda professora, o isolamento do documento de outra escola) entram pela API (`entrarEmCriados`, `entrarPelaApi`) | o login pela tela passa de 15 s com duas entradas na mesma aba; os casos de Criados (5.0) já seguem assim. O recomeço da sessão vencida usa o login por cima, uma entrada só | `techspec.md` §10 (duração do e2e) |
| O artefato aberto acende **Criados** na navegação do professor (`areas/navegacao.ts`: `tambemEm` passa de Ferramentas para Criados), e a recarga que o recomeço "recarregar mantém a aba" exige é feita dentro do caso lento que já existia, e não num caso novo | o próprio comentário da navegação dizia que o documento em folha (6.0) passava a Criados, e o "Voltar para Criados" ficaria ao lado de Ferramentas acesa; a recarga custa perto de 9 s sob a CPU ×4 e um caso novo com ela passava de 15 s | `techspec.md` §9 (O documento aberto, item 7), `mockup.md` 10.2 |
| **A página não rola, rola a mesa** a 1366 × 768 (ordem de correção 1, item 1): o painel da aba é o miolo (`O_MIOLO_DO_DOCUMENTO`) e as ações saem da linha do título para a da assinatura da IA | o cabeçalho de 370 px deixava a mesa com menos de 300 px, e o mockup 10.2 e o RF22 mandam a página parada; a versão adaptada, com mais linhas acima das abas, tem a mesa mais baixa | `techspec.md` §9 (O documento aberto, itens 7 e 8), `mockup.md` 10.2 |

## Mutações

Cada bloco é uma cláusula nova desta tarefa. O portão aplica o bloco, roda o teste, exige vermelho e restaura
(`tools/processo/mutacoes.ts`). Os de `Artefato.tsx` são as abas (quais existem, qual abre, como se troca), o voltar e o
interruptor; os de `ConteudoDoArtefato.tsx`, o que o gabarito desligado tira e o padrão; os de `EncerramentoDaAtividade.tsx`,
a peça extraída (quem tem o botão, o envio único, a falha, a releitura antes de fechar); o de `AplicacaoDoArtefato.tsx`, o aviso
do "Corrigir de novo"; os de `Folha.tsx`, a largura, a borda e a mesa, vistos no navegador (e2e: reconstroem a imagem).

```mutacao
arquivo: apps/web/src/areas/navegacao.ts
teste: apps/web/src/areas/navegacao.test.ts › o documento aberto acende Criados
-    { rotulo: 'Criados', caminho: ROTAS.criados, icone: { lugar: 'criados' }, tambemEm: [ROTAS.artefatos] },
+    { rotulo: 'Criados', caminho: ROTAS.criados, icone: { lugar: 'criados' } },
```

```mutacao
arquivo: apps/web/src/areas/professor/Artefato.tsx
teste: apps/web/src/areas/professor/Artefato.test.tsx › sem versão, a aba das versões não existe
-    ...(artefato.versoesAdaptadas.length > 0 ? [{ id: 'versoes', rotulo: 'Versões adaptadas' }] : []),
+    { id: 'versoes', rotulo: 'Versões adaptadas' },
```

```mutacao
arquivo: apps/web/src/areas/professor/Artefato.tsx
teste: apps/web/src/areas/professor/Artefato.test.tsx › o plano de aula não tem o que aplicar
-    ...(artefato.tipo === 'atividade_objetiva' ? [{ id: 'turma', rotulo: 'Na turma' }] : []),
+    { id: 'turma', rotulo: 'Na turma' },
```

```mutacao
arquivo: apps/web/src/areas/professor/Artefato.tsx
teste: apps/web/src/areas/professor/Artefato.test.tsx › abre Na turma, com a seção de aplicar
-  return abas.find((aba) => aba.id === pedida)?.id ?? 'conteudo'
+  return pedida ?? 'conteudo'
```

```mutacao
arquivo: apps/web/src/areas/professor/Artefato.tsx
teste: apps/web/src/areas/professor/Artefato.test.tsx › trocar de aba troca o endereço com
-        <Abas rotulo="Seções do documento" abas={abas} ativa={aba} aoMudar={(id) => navegar(`${caminho}?aba=${id}`, { replace: true })} classeDoPainel={O_MIOLO_DO_DOCUMENTO}>
+        <Abas rotulo="Seções do documento" abas={abas} ativa={aba} aoMudar={(id) => navegar(`${caminho}?aba=${id}`)} classeDoPainel={O_MIOLO_DO_DOCUMENTO}>
```

```mutacao
arquivo: apps/web/src/areas/professor/Artefato.tsx
teste: apps/web/src/areas/professor/Artefato.test.tsx › abre Na turma, com a seção de aplicar
-        {aba === 'conteudo' && (
+        {aba !== 'nenhuma' && (
```

```mutacao
arquivo: apps/web/src/areas/professor/Artefato.tsx
teste: apps/web/src/areas/professor/Artefato.test.tsx › abre Na turma, com a seção de aplicar
-        {aba === 'versoes' && (
+        {aba !== 'nenhuma' && dados.versoesAdaptadas.length > 0 && (
```

```mutacao
arquivo: apps/web/src/areas/professor/Artefato.tsx
teste: apps/web/src/areas/professor/Artefato.test.tsx › abre Na turma, com a seção de aplicar
-        {aba === 'turma' && <AplicacaoDoArtefato artefato={dados} nomeDaTurma={turma} />}
+        {aba !== 'nenhuma' && <AplicacaoDoArtefato artefato={dados} nomeDaTurma={turma} />}
```

```mutacao
arquivo: apps/web/src/areas/professor/Artefato.tsx
teste: apps/web/src/areas/professor/Artefato.test.tsx › o voltar para Criados e o texto de espera
-    <Link to={ROTAS_DO_PROFESSOR.criados} className="inline-flex min-h-11 items-center gap-2 self-start text-caramelo-texto underline">
+    <Link to={ROTAS_DO_PROFESSOR.ferramentas} className="inline-flex min-h-11 items-center gap-2 self-start text-caramelo-texto underline">
```

```mutacao
arquivo: apps/web/src/areas/professor/Artefato.tsx
teste: apps/web/src/areas/professor/Artefato.test.tsx › começa ligado, como o artefato sempre foi
-  const [comGabarito, definirComGabarito] = useState(true)
+  const [comGabarito, definirComGabarito] = useState(false)
```

```mutacao
arquivo: apps/web/src/areas/professor/Artefato.tsx
teste: apps/web/src/areas/professor/Artefato.test.tsx › o plano de aula não tem o que aplicar
-            {dados.conteudo.tipo === 'atividade_objetiva' && (
+            {dados.conteudo.tipo !== 'nenhum' && (
```

```mutacao
arquivo: apps/web/src/areas/professor/ConteudoDoArtefato.tsx
teste: apps/web/src/areas/professor/Artefato.test.tsx › começa ligado, como o artefato sempre foi
-                      const certa = comGabarito && posicao === questao.gabarito
+                      const certa = posicao === questao.gabarito
```

```mutacao
arquivo: apps/web/src/areas/professor/ConteudoDoArtefato.tsx
teste: apps/web/src/areas/professor/Artefato.test.tsx › começa ligado, como o artefato sempre foi
-                  {comGabarito && (
+                  {comGabarito !== undefined && (
```

```mutacao
arquivo: apps/web/src/areas/professor/ConteudoDoArtefato.tsx
teste: apps/web/src/areas/professor/Artefato.test.tsx › continua vendo a alternativa certa marcada
-export function ConteudoDoArtefato({ conteudo, materiais, resumido = false, comGabarito = true }: PropsDoConteudo) {
+export function ConteudoDoArtefato({ conteudo, materiais, resumido = false, comGabarito = false }: PropsDoConteudo) {
```

```mutacao
arquivo: apps/web/src/areas/professor/EncerramentoDaAtividade.tsx
teste: apps/web/src/areas/professor/EncerramentoDaAtividade.test.tsx › só a atividade aberta tem o botão
-      {aplicada.estado === 'aberta' && (
+      {aplicada.estado !== 'nenhuma' && (
```

```mutacao
arquivo: apps/web/src/areas/professor/EncerramentoDaAtividade.tsx
teste: apps/web/src/areas/professor/EncerramentoDaAtividade.test.tsx › dois cliques em confirmar no mesmo instante
-    if (decidindo.current) return
+    if (decidindo.current && aberto === undefined) return
```

```mutacao
arquivo: apps/web/src/areas/professor/EncerramentoDaAtividade.tsx
teste: apps/web/src/areas/professor/EncerramentoDaAtividade.test.tsx › a falha fica no diálogo, em português
-    onSettled: () => (decidindo.current = false),
+    onSettled: () => undefined,
```

```mutacao
arquivo: apps/web/src/areas/professor/EncerramentoDaAtividade.tsx
teste: apps/web/src/areas/professor/EncerramentoDaAtividade.test.tsx › a falha fica no diálogo, em português
-      {encerrar.isError && aberto === undefined && (
+      {encerrar.isError && (
```

```mutacao
arquivo: apps/web/src/areas/professor/EncerramentoDaAtividade.tsx
teste: apps/web/src/areas/professor/EncerramentoDaAtividade.test.tsx › a falha fica no diálogo, em português
-            encerrar.reset()
```

```mutacao
arquivo: apps/web/src/areas/professor/EncerramentoDaAtividade.tsx
teste: apps/web/src/areas/professor/EncerramentoDaAtividade.test.tsx › dois cliques em confirmar no mesmo instante
-      definirAberto(undefined)
+      void 0
    },
```

```mutacao
arquivo: apps/web/src/areas/professor/EncerramentoDaAtividade.tsx
teste: apps/web/src/areas/professor/EncerramentoDaAtividade.test.tsx › o diálogo só fecha depois de a lista da turma ser lida de novo
-      await cliente.invalidateQueries({ queryKey: consultaAtividadesAplicadas(aplicada.turmaId).queryKey })
```

```mutacao
arquivo: apps/web/src/areas/professor/AplicacaoDoArtefato.tsx
teste: e2e/professor-aplicacao.spec.ts › com a correção suspensa pela escola
-      {corrigir.isError && (
+      {false && (
```

```mutacao
arquivo: apps/web/src/areas/professor/Folha.tsx
teste: e2e/professor-artefato.spec.ts › a folha e a página
-      <article data-folha="" aria-label={rotulo} className="mx-auto flex w-full max-w-[760px] min-w-0 flex-col gap-4 md:rounded-cartao md:border-2 md:border-borda md:bg-superficie md:p-10">
+      <article data-folha="" aria-label={rotulo} className="mx-auto flex w-full max-w-[900px] min-w-0 flex-col gap-4 md:rounded-cartao md:border-2 md:border-borda md:bg-superficie md:p-10">
```

```mutacao
arquivo: apps/web/src/areas/professor/Folha.tsx
teste: e2e/professor-artefato.spec.ts › a folha e a página
-      <article data-folha="" aria-label={rotulo} className="mx-auto flex w-full max-w-[760px] min-w-0 flex-col gap-4 md:rounded-cartao md:border-2 md:border-borda md:bg-superficie md:p-10">
+      <article data-folha="" aria-label={rotulo} className="mx-auto flex w-full max-w-[760px] min-w-0 flex-col gap-4 md:rounded-cartao md:border-0 md:bg-superficie md:p-10">
```

```mutacao
arquivo: apps/web/src/areas/professor/Folha.tsx
teste: e2e/professor-artefato.spec.ts › a folha e a página
-    <div data-mesa="" className="min-w-0 md:rounded-cartao md:bg-mesa md:p-8">
+    <div data-mesa="" className="min-w-0 md:rounded-cartao md:p-8">
```

```mutacao
arquivo: apps/web/src/areas/professor/Folha.tsx
teste: e2e/professor-artefato.spec.ts › a folha e a página
projeto: celular
-    <div data-mesa="" className="min-w-0 md:rounded-cartao md:bg-mesa md:p-8">
+    <div data-mesa="" className="min-w-0 md:rounded-cartao bg-mesa md:p-8">
```

```mutacao
arquivo: apps/web/src/areas/professor/Artefato.tsx
teste: apps/web/src/areas/professor/Artefato.test.tsx › o foco volta ao botão "Renomear" ao salvar e ao cancelar
-    botaoDeRenomear.current?.focus()
+    void 0
```

```mutacao
arquivo: apps/web/src/areas/professor/Artefato.tsx
teste: apps/web/src/areas/professor/Artefato.test.tsx › a decisão fica à vista também na aba Na turma da própria versão
-            <LinhaDaVersao versao={dados} entregas={entregas.data?.itens} carregando={entregas.isPending} />
+            {aba === 'conteudo' && <LinhaDaVersao versao={dados} entregas={entregas.data?.itens} carregando={entregas.isPending} />}
```

```mutacao
arquivo: apps/web/src/areas/professor/miolo-do-documento.ts
teste: e2e/professor-artefato.spec.ts › a folha e a página
-export const O_MIOLO_DO_DOCUMENTO = 'md:relative md:max-h-[calc(100dvh-var(--topo-do-painel,24.5rem)-2.5rem)] md:overflow-y-auto'
+export const O_MIOLO_DO_DOCUMENTO = 'md:relative md:overflow-y-auto'
```

```mutacao
arquivo: apps/web/src/areas/professor/Folha.tsx
teste: e2e/professor-artefato.spec.ts › a folha e a página
projeto: celular
-      <article data-folha="" aria-label={rotulo} className="mx-auto flex w-full max-w-[760px] min-w-0 flex-col gap-4 md:rounded-cartao md:border-2 md:border-borda md:bg-superficie md:p-10">
+      <article data-folha="" aria-label={rotulo} className="mx-auto flex w-full max-w-[760px] min-w-0 flex-col gap-4 md:rounded-cartao border-2 md:border-borda md:bg-superficie md:p-10">
```

```mutacao
arquivo: apps/web/src/areas/professor/miolo-do-documento.ts
teste: e2e/professor-artefato.spec.ts › os quatro estados
projeto: chromebook
-      no.style.setProperty('--topo-do-painel', `${String(Math.round(painel.getBoundingClientRect().top + window.scrollY))}px`)
+      void 0
```

```mutacao
arquivo: apps/web/src/areas/professor/miolo-do-documento.ts
teste: e2e/professor-artefato.spec.ts › a folha e a página
-    vigia?.observe(no.closest('[data-tela]') ?? document.body)
+    void vigia
```

```mutacao
arquivo: apps/web/src/areas/professor/Artefato.tsx
teste: e2e/professor-artefato.spec.ts › os quatro estados
-    if (novoTitulo !== undefined || !focoPendente.current) return
+    if (novoTitulo !== undefined) return
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| conformidade-reviewer (1ª) | Nenhuma foto mostra uma versão adaptada aberta (pendente ou rejeitada) | Não é mudança de código: a Mesa inclui a foto de uma versão adaptada, se a vitrine tiver uma, no prompt da próxima rodada do `frontend-reviewer` |
| frontend-reviewer (1ª) | Trocar "artefato" por "documento" na tela vazia (`Artefato.tsx`) e em `ResultadoDaFerramenta.tsx` ("Abrir o artefato") | Muda texto de tela que e2e citam, em arquivo que a tarefa não toca (`ResultadoDaFerramenta.tsx`); vai para `TODO.md` ou para a tarefa que o tocar. O termo está no glossário |
| frontend-reviewer (1ª) | "Voltar para Criados" devolve a lista com os filtros que estavam | Muda comportamento e contrato do voltar; `TODO.md`, com o texto do mockup 10.2 |
| frontend-reviewer (1ª) | Faixa de 768 a 1023 px: respiros menores e miniatura abaixo do enunciado até `lg` | Mexe no layout da `Folha` que o item 1 refaz e a faixa nunca foi fotografada; `TODO.md`, para a tarefa que fotografar essa faixa |
| frontend-reviewer (1ª) | A 360 px, três ações empilhadas; agrupar as raras no "⋯" | O próprio revisor manda para X3 ou F7; `TODO.md` |
| frontend-reviewer (1ª) | "Na turma" cai na segunda linha das abas no celular | O revisor diz que pode ficar: é escolha do componente `Abas`. Recusada |
| test-engineer (1ª) | `dblclick` em "Aplicar à turma" pode cair no botão já desligado | A trava é anterior a esta tarefa; caso de componente com dois cliques no mesmo `act`, como o do encerrar, no `TODO.md` |
| revisor-geral (1ª) | `recarregarAtividades` + `invalidateQueries` repetidos três vezes | Pede função nova em `api/atividades.ts`, arquivo fora da tarefa; fica para a 11.0, que vai usar `EncerramentoDaAtividade` |
| revisor-geral (1ª) | O interruptor "Gabarito" fica numa linha só dele; o mockup o põe na ponta direita da linha das abas | Mexe no componente `Abas`, compartilhado; o `frontend-reviewer` não o exigiu. Recusada, o custo é uma linha de rolagem, que o item 1 já trata |
| frontend-reviewer (2ª, aprovou) | A mesa da versão adaptada pendente fica baixa a 1366 × 768 (~150 px de folha); juntar as duas frases do cabeçalho, levar "Abrir a atividade de origem" à linha do "Voltar", e altura mínima do painel no e2e | Muda texto e layout do cabeçalho que acabou de ser aprovado; `TODO.md`, para a tarefa que tocar o cabeçalho da versão |
| frontend-reviewer (2ª, aprovou) | "Pedir versão adaptada" e "Aplicar à turma" são dois botões cheios na aba Na turma | Muda o peso visual de botões fora da tarefa; `TODO.md`, X3/F7 |
| frontend-reviewer (2ª, aprovou) | A tela vazia diz "Artefato" em vez de "documento" | Já no `TODO.md` desde a ordem da rodada 1 |
| revisor-geral (2ª, aprovou) | Recuo de dois espaços a mais no bloco das ações (`Artefato.tsx`, ~214-226) | Só formatação; o revisor aprovou. Fica para o formatador na próxima edição do arquivo |
| revisor-geral (2ª, aprovou) | Os `2.5rem` do `calc` do painel só estão explicados no comentário | O `paginaNaoRola` do e2e pega a mudança da margem; o revisor disse que não bloqueia. Recusada |
| conformidade-reviewer (2ª, aprovou) | Foto da versão pendente na aba Na turma e de uma versão rejeitada aberta | Já cobertos por componente e e2e (`e2e/professor-artefato.spec.ts:105-124`); a vitrine só tem a pendente, e a foto fica para uma vitrine que tenha a rejeitada |
| test-engineer (3ª, aprovou) | O e2e da linha 99 depende de a origem estar em cache; um caso de componente em `Artefato.test.tsx` que monte com o dado já no cliente e afirme que o foco não está no botão | `/retro` da funcionalidade, como o revisor sugeriu |
| revisor-geral (3ª, aprovou) | O comentário de `e2e/professor-artefato.spec.ts:99` junta duas coisas (o cache e quando o foco volta); separar em duas frases ou cortar a do cache | Só comentário; aprovou. Fica para a próxima edição do arquivo |
| test-engineer (3ª, aprovou) | O bloco do `vigia?.observe` não declara `projeto`; só fica vermelho no `chromebook` | Editar a seção Mutações invalida o carimbo do portão (~20 min); o bloco já fica vermelho no `chromebook`, que é o projeto onde roda o `if (largura >= 768)`. Fica para a próxima edição da seção |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 09:50:41 | 2026-10-19 09:51:48 | `conformidade-reviewer` | 1 | APROVADO | a755f6fca360f00b2 |
| 2026-10-19 09:50:37 | 2026-10-19 09:52:33 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | aef5cc8e5eb8813f7 |
| 2026-10-19 09:50:46 | 2026-10-19 09:52:38 | `test-engineer` | 1 | REPROVADO | a41dc35bf44ea4d87 |
| 2026-10-19 09:50:50 | 2026-10-19 09:52:50 | `revisor-geral` | 1 | REPROVADO | a8d4c0b07f74d378b |
| 2026-10-19 10:41:56 | 2026-10-19 10:42:35 | `conformidade-reviewer` | 2 | APROVADO | a8a6c7133acdde36d |
| 2026-10-19 10:41:49 | 2026-10-19 10:42:35 | `frontend-reviewer` | 2 | APROVADO | a028bf78b70ee4547 |
| 2026-10-19 10:42:07 | 2026-10-19 10:42:45 | `revisor-geral` | 2 | APROVADO | a82055ca6fba4342e |
| 2026-10-19 10:42:01 | 2026-10-19 10:43:00 | `test-engineer` | 2 | REPROVADO | a521acd7ca3e7ce85 |
| 2026-10-19 12:19:27 | 2026-10-19 12:19:48 | `revisor-geral` | 3 | APROVADO | a3bf0a00084bf41c6 |
| 2026-10-19 12:19:22 | 2026-10-19 12:20:37 | `test-engineer` | 3 | APROVADO | abc02049079ecc1b7 |
