# Tarefa 3.0 — Início: a saudação com a onça, a caixa de pedido e os atalhos

**Funcionalidade:** telas-do-professor · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O Início mostra a saudação com a onça do Assistente, a caixa de pedido com a turma e um atalho por ferramenta. O
que espera a professora deixa de aparecer nele: está no sino.

## Contexto necessário

- `techspec.md` seções 7b e 9; `prd.md` RF7, RF8 e RF22
- Regra 70, item 4a (função e selo "IA" junto da onça); D18 e D35
- `mockup.md` 1 e 3: sem a pílula da aula, sem o "+" e sem link no aviso de IA
- Código: `apps/web/src/areas/professor/Home.tsx`; `CaixaDoAssistente.tsx` (`abrirCartaoNaConversa`,
  `iniciaisDoPedido`); `saudacao.ts`; `componentes/ia/AssinaturaIA.tsx`

## Subtarefas

- [x] 3.1 — `Home.tsx`: `Tela` de conversa, com o `h1` só para leitor de tela; o grupo a um terço da altura
  livre; a `AssinaturaIA` do Assistente (onça de 44 px; 36 abaixo de 768) acima da saudação, que continua num
  elemento só dela, com o texto de hoje; "O que vamos preparar hoje?"; a caixa; os atalhos; e a frase "O Assistente
  é uma IA e pode errar · Nada chega à turma sem você aprovar". A seção "Esperando você" e o erro dela saem; o link
  "Abrir a conversa com o Assistente" fica
- [x] 3.2 — `AtalhosDeFerramenta.tsx`: um botão secundário de 44 px por item de `CATALOGO_DE_FERRAMENTAS`, com o
  ícone ilustrado, e o link "Ferramentas". Atividade e plano abrem o cartão na conversa com a turma e, como tema,
  o que está na caixa; a Adaptação abre sem ler a caixa. A função suspensa desliga o atalho dela. A
  `CaixaDoAssistente` ganha `semMenu`, que o Início usa
- [x] 3.3 — `icones-de-ferramenta.tsx`: três desenhos nossos (atividade, plano, adaptação), `aria-hidden`, só com
  tokens
- [x] 3.4 — Testes

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/Home.tsx`, `apps/web/src/areas/professor/CaixaDoAssistente.tsx` | alterado |
| `apps/web/src/areas/professor/Home.test.tsx`, `apps/web/src/areas/professor/AtalhosDeFerramenta.tsx`, `apps/web/src/areas/professor/icones-de-ferramenta.tsx`, `apps/web/src/areas/professor/icones-de-ferramenta.test.tsx` | novo |
| `e2e/professor-inicio.spec.ts`, `e2e/professor-entregas.spec.ts`, `e2e/professor-ferramentas.spec.ts`, `e2e/professor-sino.spec.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| estados | componente | carregando; erro com "Tentar de novo"; sem turma confirmada, sem caixa nem atalho, com "Ir para Turmas"; com dado |
| saudação | componente | relógio fixo em 8h, 14h e 20h: as três saudações, com o primeiro nome e o ponto |
| o agente se identifica | componente | "Assistente de ensino" e o selo "IA" no bloco da onça |
| atalho | componente | atividade abre o cartão com a turma e o texto da caixa como tema; a Adaptação abre sem o texto (D35); pedido escrito e enviado não abre cartão: vai ao Assistente (D18) |
| nada espera no Início | componente e e2e | com entrega pendente, o Início não tem `[data-esperando-voce]`; o sino tem |
| função suspensa | componente | o aviso de hoje; a caixa e os atalhos desligados |
| recomeço | e2e (no caso de recomeço de `professor-sino.spec.ts`, ver Divergências) | a segunda pessoa na mesma aba não vê o texto que a primeira deixou na caixa; os outros casos não se aplicam: a tela não tem link nem diálogo |
| 360 px e 1366 × 768 | e2e | os atalhos quebram sem rolar de lado; a caixa aparece sem rolar |

## Como testar

- Os estados de `e2e/professor-inicio.spec.ts › carregando, erro com "Tentar de novo"…` passam ao componente; o
  e2e fica com o fluxo. O caso do menu "Ferramenta" vira o do atalho, com as mesmas três ferramentas
- Relógio: `vi.setSystemTime`, nunca a hora da máquina
- `esperarNovaConversa` (`e2e/__fixtures__/casca.ts`) lê a saudação por texto exato: a onça fica fora do elemento
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/Home.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-inicio.spec.ts`
- Telas: `professora`, `/professor/nova-conversa`, e com `--vazia`. Mockup: `/professor`

## Fora do escopo desta tarefa

Anexo, busca na web e a faixa da aula (F7, F8); o menu "Ferramenta" da Conversa (4.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A onça do Início tem **40 px** em toda largura, e não 44 px (36 abaixo de 768) | O `AvatarAgente` e a `CabecaOnca` só aceitam 24, 32, 40 e 48 px (`docs/interface.md` 9.7), e a `AssinaturaIA` repassa o tipo. Acrescentar 44 e 36 redefine uma peça da X1, fora do recorte, e a troca por largura pediria classe responsiva que o avatar não tem. O 40 é o tamanho do cabeçalho de uma conversa | `techspec.md` §9, parágrafo "O Assistente no Início"; `docs/interface.md` 9.7 |
| O Início mostra também o aviso da **Adaptação** suspensa (`AvisoDeSuspensao funcao="adaptacao"`) | A tarefa manda desligar o atalho da função suspensa; sem o aviso o botão desligado não diz por quê, e a Adaptação pode estar suspensa com a conversa em pé (são duas funções) | `techspec.md` §9, parágrafo "A função suspensa no Início" |
| O e2e prova que o sino tem a entrega pelo nome do botão e pelo link do item, e não por `[data-esperando-voce]` | O item do sino da 1.0 não leva o atributo (a §9 da Tech Spec diz que ele "passa ao item do sino"), e o atributo não tem mais consumidor: o Início não o tem e nenhum e2e o cita. Acrescentá-lo é mexer na peça `Sino`, fora desta tarefa | `techspec.md` §9, parágrafo "`data-esperando-voce`" |
| O caso do lote de `professor-entregas.spec.ts` mantém o **título do HEAD**, ainda que o trecho da Home tenha mudado | A régua de duração acha o prazo declarado (`test.slow()`) pelo título do caso no HEAD; um título novo perde o prazo e o caso, que leva 17–19 s, passaria a ser medido contra 15 s sem ter mudado de natureza. O que o caso prova da Home (o sino a conta, o Início não a mostra) está no corpo | `techspec.md` §9 (divergência da 2.0 sobre a duração do e2e); `docs/` do portão (`tools/ci/duracao-do-e2e.ts`) |
| O recomeço da caixa está no caso de recomeço de `professor-sino.spec.ts`, e não num caso novo de `professor-inicio.spec.ts` | Um caso próprio faz duas entradas na mesma aba e leva 14,5 a 15,5 s sem folga: o piso de `entrar` é de 11 a 12 s, e a régua de 15 s o reprovaria em metade das corridas. O caso do sino já era `test.slow()` no HEAD e já sobe a segunda professora na mesma aba; ele passou a deixar o texto na caixa da primeira e a dar uma turma à segunda (sem turma não há caixa), e a conferir a caixa vazia | `techspec.md` §9 (divergência da 2.0 sobre a duração do e2e); `docs/interface.md` 11.5 |
| Dois testes de fora da tarefa mudam: `apps/web/src/estilos.test.ts` (sai a entrada de `Home.tsx` da lista do oficial e o teto cai de 4 para 3) e `e2e/professor-lugares.spec.ts` (o "nenhum avatar da onça na casca" passa a olhar fora do `main`) | A entrada do `Home.tsx` na lista existia para a tarefa que recompõe o Início tirar o `bg-noite` (`sai: X3`), e a lista só encolhe. O `lateral` do computador é o `body` inteiro, e o Início agora tem o avatar do Assistente no `main`, de propósito (3.1); a regra da X1 é sobre a casca | `docs/interface.md` 9.7 e 11.5 |

## Mutações

Cada cláusula nova desta tarefa tem a sua: o menu que sai da caixa do Início (`semMenu`) e o que fica na da conversa; os dois
termos de `desligada || funcaoSuspensa`; o texto da caixa como tema do atalho; o `disabled`, o `onClick` e o destino do link
dos atalhos; o `h1` só para o leitor; a assinatura do Assistente; os dois avisos de suspensão; o aviso de IA; o fim da leitura de
entregas; e, no e2e, as três linhas da grade (a de um terço, o lugar do grupo e a quebra dos atalhos no celular).

```mutacao
arquivo: apps/web/src/areas/professor/CaixaDoAssistente.tsx
teste: apps/web/src/areas/professor/Home.test.tsx › com dado: a caixa com a turma
-      {...(semMenu ? {} : { esquerda: menu })}
+      {...{ esquerda: menu }}
```

```mutacao
arquivo: apps/web/src/areas/professor/CaixaDoAssistente.tsx
teste: apps/web/src/areas/professor/Home.test.tsx › mantém o menu
-  if (!semMenu) return caixa
```

```mutacao
arquivo: apps/web/src/areas/professor/CaixaDoAssistente.tsx
teste: apps/web/src/areas/professor/Home.test.tsx › a conversa e as ferramentas suspensas
-      <AtalhosDeFerramenta aoAbrir={(daFerramenta) => abrirCartao(daFerramenta, texto)} desligado={(funcao) => desligada || funcaoSuspensa(funcao)} />
+      <AtalhosDeFerramenta aoAbrir={(daFerramenta) => abrirCartao(daFerramenta, texto)} desligado={(funcao) => funcaoSuspensa(funcao)} />
```

```mutacao
arquivo: apps/web/src/areas/professor/CaixaDoAssistente.tsx
teste: apps/web/src/areas/professor/Home.test.tsx › só a Adaptação suspensa
-      <AtalhosDeFerramenta aoAbrir={(daFerramenta) => abrirCartao(daFerramenta, texto)} desligado={(funcao) => desligada || funcaoSuspensa(funcao)} />
+      <AtalhosDeFerramenta aoAbrir={(daFerramenta) => abrirCartao(daFerramenta, texto)} desligado={() => desligada} />
```

```mutacao
arquivo: apps/web/src/areas/professor/CaixaDoAssistente.tsx
teste: apps/web/src/areas/professor/Home.test.tsx › a atividade e o plano abrem o cartão
-      <AtalhosDeFerramenta aoAbrir={(daFerramenta) => abrirCartao(daFerramenta, texto)} desligado={(funcao) => desligada || funcaoSuspensa(funcao)} />
+      <AtalhosDeFerramenta aoAbrir={(daFerramenta) => abrirCartao(daFerramenta, '')} desligado={(funcao) => desligada || funcaoSuspensa(funcao)} />
```

```mutacao
arquivo: apps/web/src/areas/professor/AtalhosDeFerramenta.tsx
teste: apps/web/src/areas/professor/Home.test.tsx › só a Adaptação suspensa
-        <Botao key={item.ferramenta} variante="secundario" disabled={desligado(item.funcao)} onClick={() => aoAbrir(item.ferramenta)}>
+        <Botao key={item.ferramenta} variante="secundario" disabled={false} onClick={() => aoAbrir(item.ferramenta)}>
```

```mutacao
arquivo: apps/web/src/areas/professor/AtalhosDeFerramenta.tsx
teste: apps/web/src/areas/professor/Home.test.tsx › a atividade e o plano abrem o cartão
-        <Botao key={item.ferramenta} variante="secundario" disabled={desligado(item.funcao)} onClick={() => aoAbrir(item.ferramenta)}>
+        <Botao key={item.ferramenta} variante="secundario" disabled={desligado(item.funcao)} onClick={() => undefined}>
```

```mutacao
arquivo: apps/web/src/areas/professor/AtalhosDeFerramenta.tsx
teste: apps/web/src/areas/professor/Home.test.tsx › um por ferramenta que existe
-      <Link to={ROTAS_DO_PROFESSOR.ferramentas} className={`${CLASSES_DO_LINK_SECUNDARIO} gap-2`}>
+      <Link to={ROTAS_DO_PROFESSOR.turmas} className={`${CLASSES_DO_LINK_SECUNDARIO} gap-2`}>
```

```mutacao
arquivo: apps/web/src/areas/professor/Home.tsx
teste: apps/web/src/areas/professor/Home.test.tsx › com dado: a caixa com a turma
-    <Tela titulo="Início" largura="conversa" tituloSoParaLeitor>
+    <Tela titulo="Início" largura="conversa">
```

```mutacao
arquivo: apps/web/src/areas/professor/Home.tsx
teste: apps/web/src/areas/professor/Home.test.tsx › o Assistente de ensino aparece
-            <AssinaturaIA agente="assistente_de_ensino" tamanho={40} />
+            <AssinaturaIA agente="tutor" tamanho={40} />
```

```mutacao
arquivo: apps/web/src/areas/professor/Home.tsx
teste: apps/web/src/areas/professor/Home.test.tsx › só a Adaptação suspensa
-              {adaptacaoSuspensa && <AvisoDeSuspensao funcao="adaptacao" />}
+              {false && adaptacaoSuspensa && <AvisoDeSuspensao funcao="adaptacao" />}
```

```mutacao
arquivo: apps/web/src/areas/professor/Home.tsx
teste: apps/web/src/areas/professor/Home.test.tsx › a conversa e as ferramentas suspensas
-              {suspensa && <AvisoDeSuspensao funcao="conversa_e_ferramentas" />}
+              {false && suspensa && <AvisoDeSuspensao funcao="conversa_e_ferramentas" />}
```

```mutacao
arquivo: apps/web/src/areas/professor/Home.tsx
teste: apps/web/src/areas/professor/Home.test.tsx › com dado: a caixa com a turma
 depois={() => navegar(ROTAS_DO_PROFESSOR.conversa)}
-semMenu
 funcaoSuspensa={(funcao) => funcaoSuspensa(time.data, funcao)}
```

```mutacao
arquivo: apps/web/src/areas/professor/Home.tsx
teste: apps/web/src/areas/professor/Home.test.tsx › só a Adaptação suspensa
-                funcaoSuspensa={(funcao) => funcaoSuspensa(time.data, funcao)}
+                funcaoSuspensa={() => false}
```

```mutacao
arquivo: apps/web/src/areas/professor/Home.tsx
teste: apps/web/src/areas/professor/Home.test.tsx › com dado: a caixa com a turma
-                O Assistente é uma IA e pode errar · <strong className="font-bold">Nada chega à turma sem você aprovar</strong>
+                O Assistente é uma IA e pode errar
```

```mutacao
arquivo: apps/web/src/areas/professor/Home.tsx
teste: apps/web/src/areas/professor/Home.test.tsx › com entrega pendente, a tela não tem
-  const time = useQuery(consultaTime)
+  const time = useQuery(consultaTime); void fetch('/v1/entregas')
```

```mutacao
arquivo: apps/web/src/areas/professor/Home.tsx
teste: e2e/professor-inicio.spec.ts › a medida
-      <div className="grid min-h-[calc(100dvh-14rem)] min-w-0 grid-rows-[1fr_auto_2fr] md:min-h-[calc(100dvh-9rem)]">
+      <div className="grid min-h-[calc(100dvh-14rem)] min-w-0 grid-rows-[1fr_auto_1fr] md:min-h-[calc(100dvh-9rem)]">
```

```mutacao
arquivo: apps/web/src/areas/professor/Home.tsx
teste: e2e/professor-inicio.spec.ts › a medida
-        <div data-grupo-do-inicio="" className="row-start-2 flex min-w-0 flex-col gap-6 pb-4">
+        <div data-grupo-do-inicio="" className="flex min-w-0 flex-col gap-6 pb-4">
```

```mutacao
arquivo: apps/web/src/areas/professor/AtalhosDeFerramenta.tsx
teste: e2e/professor-inicio.spec.ts › a medida
projeto: celular
-    <div role="group" aria-label="Atalhos de ferramenta" className="flex min-w-0 flex-wrap items-center justify-center gap-x-3 gap-y-4">
+    <div role="group" aria-label="Atalhos de ferramenta" className="flex min-w-0 items-center justify-center gap-x-3 gap-y-4">
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | Na validação, conferir se a professora percebe o sino sem o feed na primeira tela (regra 50, item 6, cumprida pelo sino) | Recusada na tarefa: o PRD (RF7, RF8) decidiu tirar a fila do Início. Fica para o Validador, que fotografa cada requisito com tela |
| frontend-reviewer (1ª) | Na barra do celular, o nome da escola e o "Sair" ficam apertados ("Colég…" cortado) | `/retro`: a casca é da X1/2.0 e não é desta tarefa |
| frontend-reviewer (1ª) | O botão de enviar vazio (cinza) tem pouco contraste com o fundo | `TODO.md`: vem da `CaixaPedido`, que a 3.0 não altera |
| frontend-reviewer (1ª) | `Home.tsx:97-105`: o `role="status"` fica vazio quando não há resposta em curso; conferir com leitor de tela | Recusada: o próprio revisor diz que é inofensivo e o conteúdo muda quando há resposta |
| test-engineer (1ª) | O ícone ilustrado dentro do atalho não tem bloco de mutação (só asserção por `data-icone-de-ferramenta`) | Recusada: o próprio revisor diz que é elemento visual, e não regra |
| revisor-geral (1ª) | `fila-do-professor.ts:199`: `esperandoVoce` e o tipo `ItemEsperando` ficaram sem chamada em produção; só `fila-do-professor.test.ts` os usa | Tarefa 9.0 (Turmas), que já lista `fila-do-professor.ts` no código a ler: remover junto com o teste. Não entra aqui porque o arquivo não é da 3.0 e a remoção é código de produção |
| frontend-reviewer (2ª) | A foto mostra "2°B c5064cf7 · Química": o sufixo hexadecimal é dado sintético da vitrine; confirmar que a turma real nunca mostra id | Validador: confere com turma de nome real. O sufixo vem do seed sintético, não do código da tarefa |
| frontend-reviewer (2ª) | No celular o nome da escola fica cortado ("Colég…") por causa do sino e do "Sair" | Já registrada na 1ª rodada: `/retro` (a casca não é desta tarefa) |
| frontend-reviewer (2ª) | O texto de rodapé "O Assistente é uma IA e pode errar" tem 13 px; considerar 14 px | Recusada: 13/18 é a medida do mockup (`mockup.md` linha 33, `AvisoIA`), e a 3.0 segue o mockup |
| revisor-geral (1ª) | `mockup.md:39` descreve o Início "no produto" como era antes da 3.0 | Recusada: o `mockup.md` é a leitura do mockup no dia da spec; o registro do que mudou está nas divergências desta tarefa e no §9 da Tech Spec |

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
| 2026-10-19 02:48:18 | 2026-10-19 02:48:50 | `frontend-reviewer` | 1 | APROVADO | a62009ea8342e5bdf |
| 2026-10-19 02:48:26 | 2026-10-19 02:49:10 | `conformidade-reviewer` | 1 | APROVADO | adcd306e0f85e4869 |
| 2026-10-19 02:48:30 | 2026-10-19 02:49:53 | `test-engineer` | 1 | APROVADO | af6ae8deecdc0337e |
| 2026-10-19 02:48:34 | 2026-10-19 02:49:57 | `revisor-geral` | 1 | APROVADO | aa3f4fe7a7dbf8093 |
| 2026-10-19 03:12:36 | 2026-10-19 03:12:53 | `frontend-reviewer` | 2 | APROVADO | a9c4c429ccfe9d215 |
| 2026-10-19 03:12:46 | 2026-10-19 03:13:11 | `conformidade-reviewer` | 2 | APROVADO | a868a61650fa39ddc |
| 2026-10-19 03:12:55 | 2026-10-19 03:13:21 | `test-engineer` | 2 | APROVADO | ae0d339d43ade7805 |
| 2026-10-19 03:13:05 | 2026-10-19 03:13:29 | `revisor-geral` | 2 | APROVADO | a144102c44ab03b9e |
