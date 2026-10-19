# Tarefa 4.0 — Conversa e cartão da ferramenta na pele nova

**Funcionalidade:** telas-do-professor · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A conversa com o Assistente fica na coluna do tipo conversa, com a caixa presa embaixo e o aviso de IA. O cartão da
ferramenta ganha o ícone e o nome. Nenhuma regra muda: a pergunta da D18 continua, e o cartão só abre com o "sim".

## Contexto necessário

- `techspec.md` seção 9 (Conversa: balões, assinatura, a `Escolha`, o cartão, a caixa presa com o menu "Ferramenta");
  `prd.md` RF8, RF9 e RF22; `mockup.md` 2 e 9.2, só pela forma
- Regra 70, itens 3, 4 e 4a; D18 (o Assistente pergunta antes), D58 (função e selo "IA" em toda resposta)
- Código: `apps/web/src/areas/professor/Conversa.tsx` (a pergunta, linhas 151 a 165; o cartão, 170 a 175);
  `CartaoDeFerramenta.tsx`; `ResultadoDaFerramenta.tsx`; `CaixaDoAssistente.tsx`; `icones-de-ferramenta.tsx` (da 3.0)

## Subtarefas

- [x] 4.1 — `Conversa.tsx`: a coluna de 768 px, o vão de 24 e a caixa presa a 24 px do fim, com o menu "Ferramenta" e a
  frase "O Assistente é uma IA e pode errar · Nada chega à turma sem você aprovar" embaixo dela. O `log` mantém o nome
  "Conversa com o Assistente de ensino"
- [x] 4.2 — O cartão: cabeçalho com o ícone ilustrado de 32 px (da 3.0) e o nome; o resto é o motor de hoje, com a
  mesma `key`. O resultado mantém as ações de hoje (Abrir o artefato, Exportar em PDF, Ver e decidir), sem mudar props
  de `ConteudoDoArtefato`, que a 6.0 também usa
- [x] 4.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/Conversa.tsx`, `CartaoDeFerramenta.tsx`, `ResultadoDaFerramenta.tsx`, `CaixaDoAssistente.tsx` | alterado (todos em `apps/web/src/areas/professor/`) |
| `apps/web/src/areas/professor/Conversa.test.tsx`, `CartaoDeFerramenta.test.tsx` | novo |
| `e2e/professor-conversa.spec.ts` | alterado (a 2.5 o criou) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| estados | componente | carregando; erro com "Tentar de novo"; vazio ("Nenhuma conversa ainda"); sem turma, com "Ir para Turmas" e sem caixa; função suspensa, com o aviso e a caixa desligada; com dado |
| a pergunta da D18 | componente | pedido sem ferramenta: aparecem "Usar a ferramenta…" e "Só conversar" com a mesma variante e o mesmo tamanho; nenhuma vem escolhida |
| nenhum cartão sem o "sim" | componente | enquanto a pergunta está aberta, `[data-cartao-de-ferramenta]` não existe; "Só conversar" manda o pedido e não abre cartão; só "Usar a ferramenta" abre |
| a Adaptação | componente | o cartão da Adaptação abre sem o texto da caixa (D35, D67) |
| a IA se identifica | componente | cada resposta tem o nome da função e `[data-selo-ia]` no mesmo contêiner; o cartão tem o ícone e o nome |
| o foco | componente | o cartão que abre recebe o foco; "Cancelar" o devolve à caixa; o pedido enviado deixa o foco na caixa |
| fluxo completo | e2e | os casos de hoje (pedido, pergunta, cartão, resultado com página; "Ver mensagens anteriores"; falha vira aviso; recusa de corrigir redação em `a2-assistente.spec.ts`), nos dois projetos, sem rolar de lado a 360 px |
| recomeço | e2e | a segunda pessoa na mesma aba não vê a conversa nem o cartão da primeira; a resposta atrasada de outra sessão não entra. Concorrência: dois Enter mandam um pedido só (caso de hoje). Log não se aplica: nada novo é gravado |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx › professor: a lista é lida ao abrir…` (`prepararTela`,
  `redeFalsa`); o estado de `useLugarNaAba` se prepara como em `conversa.test.ts`
- e2e: os quatro `test(` de `describe('a conversa (11.3)')`, hoje em `professor-assistente.spec.ts`, que a 2.5 moveu.
  Muda o rótulo e a estrutura (o cabeçalho do cartão); nenhuma asserção de regra
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/Conversa.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-conversa.spec.ts`
- Telas: `professora`, `/professor/conversa`, `--clicar 'role=button[name=/Usar a ferramenta/]'`. Mockup:
  `/professor/conversa/:id`

## Fora do escopo desta tarefa

Várias conversas, título com menu, renomear, apagar e o selo "Só você vê esta conversa" (F7); anexo, busca na web,
votos, "Refazer", "Salvar em Criados" e editar a mensagem; o cartão do documento no lugar do resultado em linha (a
decisão da versão adaptada continua na tela do Assistente); o menu "Ferramenta" do Início (3.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O `MotorFormulario` (peça da X1, fora dos "Arquivos previstos") ganha a prop opcional `icone`, desenhada antes do nome no título do formulário e na linha do pedido recolhido. O `CartaoDeFerramenta` ganha `comIcone` (padrão `false`) e a Conversa o liga; o formulário de Ferramentas não | O motor já escreve o nome da ferramenta, como título do formulário e como primeira palavra do pedido recolhido. Um cabeçalho do cartão feito à parte repetiria o nome (dois títulos iguais na região, e `getByText` do e2e ambíguo); o ícone só entra no motor. A prop é opcional e não muda nenhuma que existia, como a 2.0 fez com o `pe` do `Sino` | `techspec.md` §9, parágrafo "O cartão da conversa" |
| A frase "O Assistente é uma IA e pode errar · Nada chega à turma sem você aprovar" vira o componente `AvisoDeIA`, em `avisos.tsx`, e o Início (`Home.tsx`, fora dos "Arquivos previstos") passa a usá-lo | A 3.0 já a escrevia no Início; copiá-la na Conversa seria a segunda cópia de uma promessa da regra 70, item 3, que só vale enquanto nenhuma ferramenta entregar direto à turma. Um lugar só para tirá-la quando deixar de valer | `techspec.md` §9, parágrafo "O cartão da conversa" |
| "A caixa presa a 24 px do fim" é a **frase de IA a 24 px do pé da barra**: a `BarraPresa` tem `py-3` (12 px) e o filho dela leva `pb-3` (mais 12). A `BarraPresa` não muda. O "vão de 24" entre mensagens é o `gap-6` do `log`, que já existia | A `BarraPresa` é peça da X1, partilhada com a barra de Aprovar, que não quer 24 px embaixo; a folga é de quem a usa | `techspec.md` §9, parágrafo "O cartão da conversa" |
| O recomeço da conversa (a segunda pessoa na mesma aba não vê a conversa nem o cartão da primeira) está no caso de recomeço de `e2e/professor-sino.spec.ts` (fora dos "Arquivos previstos"), e não num caso novo de `professor-conversa.spec.ts` | Um caso novo faria duas entradas na mesma aba e leva mais de 15 s (o piso de `entrar` é de 11 a 12 s), e a régua do portão o reprovaria. O caso do sino já era `test.slow()` no HEAD e já sobe a segunda professora na mesma aba: a primeira passou a deixar uma conversa lida e o cartão da Adaptação aberto, e a segunda a encontrar a conversa vazia, sem cartão e sem o texto da primeira no cache | `techspec.md` §10 (divergência da 2.0 sobre a duração do e2e) |

## Mutações

Cada cláusula nova desta tarefa tem a sua: a frase de IA na barra, depois da caixa, e as duas metades do texto dela; a frase
no Início; o `comIcone` que a Conversa liga, o que o cartão repassa e o padrão dele; o tamanho e a ferramenta do ícone; o
ícone nos dois lugares do motor (o título e o pedido recolhido); e, no e2e, a folga de 24 px e a borda de 2 px do cartão.

```mutacao
arquivo: apps/web/src/areas/professor/Conversa.tsx
teste: apps/web/src/areas/professor/Conversa.test.tsx › caixa presa embaixo
-            <AvisoDeIA />
```

```mutacao
arquivo: apps/web/src/areas/professor/Conversa.tsx
teste: apps/web/src/areas/professor/Conversa.test.tsx › caixa presa embaixo
-            <CaixaDoAssistente turmas={turmas} turma={turma} iniciar={iniciar} respondendo={emCurso(ciclo)} desligada={suspensa || cartaoOcupaATela} />
-            <AvisoDeIA />
+            <AvisoDeIA />
+            <CaixaDoAssistente turmas={turmas} turma={turma} iniciar={iniciar} respondendo={emCurso(ciclo)} desligada={suspensa || cartaoOcupaATela} />
```

```mutacao
arquivo: apps/web/src/areas/professor/Conversa.tsx
teste: apps/web/src/areas/professor/Conversa.test.tsx › o cartão da ferramenta tem o ícone
-nivel={2} comIcone aoCancelar
+nivel={2} aoCancelar
```

```mutacao
arquivo: apps/web/src/areas/professor/Conversa.tsx
teste: e2e/professor-conversa.spec.ts › o pedido aparece na hora
-          <div ref={barra} className="flex w-full min-w-0 flex-col gap-2 pb-3">
+          <div ref={barra} className="flex w-full min-w-0 flex-col gap-2">
```

```mutacao
arquivo: apps/web/src/areas/professor/Conversa.tsx
teste: e2e/professor-conversa.spec.ts › o pedido aparece na hora
-rounded-cartao border-2 border-borda bg-superficie p-4 lg:p-5
+rounded-cartao border border-linha bg-superficie p-4 lg:p-5
```

```mutacao
arquivo: apps/web/src/areas/professor/Conversa.tsx
teste: e2e/professor-conversa.spec.ts › o pedido aparece na hora
-rounded-cartao border-2 border-borda bg-superficie p-4 lg:p-5
+rounded-cartao border-2 border-borda-forte bg-superficie p-4 lg:p-5
```

```mutacao
arquivo: apps/web/src/areas/professor/Conversa.tsx
teste: apps/web/src/areas/professor/Conversa.test.tsx › caixa presa embaixo
-            <AvisoDeIA />
+            <AvisoDeIA />
+            <AvisoDeIA />
```

```mutacao
arquivo: apps/web/src/areas/professor/CartaoDeFerramenta.tsx
teste: apps/web/src/areas/professor/CartaoDeFerramenta.test.tsx › fica sem ele
-{...(comIcone ? {
+{...(true ? {
```

```mutacao
arquivo: apps/web/src/areas/professor/CartaoDeFerramenta.tsx
teste: apps/web/src/areas/professor/CartaoDeFerramenta.test.tsx › fica sem ele
-comIcone = false
+comIcone = true
```

```mutacao
arquivo: apps/web/src/areas/professor/CartaoDeFerramenta.tsx
teste: apps/web/src/areas/professor/CartaoDeFerramenta.test.tsx › o título é o nome da ferramenta
-<IconeDeFerramenta ferramenta={ferramenta} tamanho={32} />
+<IconeDeFerramenta ferramenta={ferramenta} tamanho={24} />
```

```mutacao
arquivo: apps/web/src/areas/professor/CartaoDeFerramenta.tsx
teste: apps/web/src/areas/professor/CartaoDeFerramenta.test.tsx › o título é o nome da ferramenta
-<IconeDeFerramenta ferramenta={ferramenta} tamanho={32} />
+<IconeDeFerramenta ferramenta="plano_de_aula" tamanho={32} />
```

```mutacao
arquivo: apps/web/src/componentes/ia/MotorFormulario.tsx
teste: apps/web/src/areas/professor/CartaoDeFerramenta.test.tsx › o título é o nome da ferramenta
-        {icone}
         {descricao.nome}
```

```mutacao
arquivo: apps/web/src/componentes/ia/MotorFormulario.tsx
teste: apps/web/src/areas/professor/CartaoDeFerramenta.test.tsx › gerando
-            {icone}
             <p className="min-w-0 break-words text-apoio">
```

```mutacao
arquivo: apps/web/src/areas/professor/avisos.tsx
teste: apps/web/src/areas/professor/Conversa.test.tsx › caixa presa embaixo
-      O Assistente é uma IA e pode errar · <strong className="font-bold">Nada chega à turma sem você aprovar</strong>
+      O Assistente é uma IA e pode errar
```

```mutacao
arquivo: apps/web/src/areas/professor/avisos.tsx
teste: apps/web/src/areas/professor/Conversa.test.tsx › caixa presa embaixo
-      O Assistente é uma IA e pode errar · <strong className="font-bold">Nada chega à turma sem você aprovar</strong>
+      <strong className="font-bold">Nada chega à turma sem você aprovar</strong>
```

```mutacao
arquivo: apps/web/src/areas/professor/Home.tsx
teste: apps/web/src/areas/professor/Home.test.tsx › com dado: a caixa com a turma
-              <AvisoDeIA />
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª), revisor-geral (1ª) | O menu "Ferramenta" a 360 px abre longe do botão e cortado pela barra de baixo; `posicaoDoFlutuante` ignora `--barra-baixo` (`apps/web/src/componentes/flutuante.ts:79`) | O componente é do 7.0 e esta tarefa não o altera; a foto é de página inteira e pode ser artefato da captura. Destino: `/validar`, abrindo o menu num viewport real de 360 × 740; se o último item não ficar acima da barra, descontar `--barra-baixo` na conta do `espaco`, na tarefa 7.0 |
| frontend-reviewer (1ª) | Na conversa vazia a caixa sobe até logo abaixo do convite, em vez de ficar no pé da janela (a `BarraPresa` é `sticky` no fluxo) | Não muda comportamento nem regra e exige mexer na altura mínima da `Tela`, peça compartilhada. Destino: `/validar`, comparar com o mockup `/professor/conversa/:id`; se o mockup a quer no pé, vira ajuste da `Tela` |
| frontend-reviewer (1ª) | O `pb-3` empilha a folga de 24 px sobre a `BarraPresa` | Sem mudança pedida: é aviso. A divergência 3 do documento a declara e o e2e a trava (a mutação do `pb-3`) |
| test-engineer (1ª) | O `gap-2` entre a caixa e a frase não tem asserção | Recusada: o critério da tarefa fixa os 24 px até o pé da barra, que o e2e mede; o vão de 8 px entre a caixa e a frase é só visual |
| conformidade-reviewer (1ª), revisor-geral (1ª) | A navegação marca "Início" como ativo em `/professor/conversa` | Recusada: é o desenho, não esta tarefa. `apps/web/src/caminhos.ts:185` diz "dentro dela, 'Início' continua selecionado na lateral" |
| revisor-geral (2ª) | A frase nova da §10 (`techspec.md:218`) está numa linha de tabela com a primeira coluna vazia; lê melhor como parágrafo depois da tabela, ou com "E2E" na primeira coluna | Só forma de texto; a Tech Spec vira aviso com prazo (D79). Destino: a retrospectiva da spec, junto da leitura das divergências |
| revisor-geral (2ª) | `fraseDeIA` e `frasesDeIA` (`Conversa.test.tsx:38-39`) repetem o mesmo filtro | Duas linhas de teste, sem risco; destino: a tarefa futura que tocar `Conversa.test.tsx` (a 7.0 ou a 8.0 da Conversa, se houver) ou recusada se não houver |
| test-engineer (2ª) | O e2e compara a cor da borda do cartão com a de um vizinho do mesmo token (`professor-conversa.spec.ts:102`), e não pega mudança do valor de `borda` no tema | Fora da regra desta tarefa; destino: `/validar`, se a pele exigir a cor absoluta |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 04:26:21 | 2026-10-19 04:27:11 | `conformidade-reviewer` | 1 | APROVADO | a3f20a9e392a10d59 |
| 2026-10-19 04:26:17 | 2026-10-19 04:27:49 | `frontend-reviewer` | 1 | APROVADO | a18afb1a31526b45c |
| 2026-10-19 04:26:28 | 2026-10-19 04:28:04 | `revisor-geral` | 1 | APROVADO | a55038b0f7f5d163d |
| 2026-10-19 04:26:25 | 2026-10-19 04:28:56 | `test-engineer` | 1 | APROVADO | a59e5609f6690d001 |
| 2026-10-19 04:57:18 | 2026-10-19 04:57:34 | `revisor-geral` | 2 | APROVADO | a9faa5aa5edf4ac57 |
| 2026-10-19 04:57:11 | 2026-10-19 04:57:41 | `test-engineer` | 2 | APROVADO | a3cd22570f052f4db |
