# Tarefa 7.0 — Diálogo, confirmação, menu e painel ao lado na pele nova

**Funcionalidade:** pele-e-casca · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `infra-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Diálogo, confirmação, menu e login por cima aparecem com borda de 2 px e degrau sólido, nos dois temas, e a galeria
ganha o painel ao lado, que no celular é folha de baixo.

## Contexto necessário

- `techspec.md` seção 9 (**Peças novas**: `<dialog>` modal, com prisão de foco e Esc do navegador e a devolução do
  foco nossa; **Degrau**; **Foco**), 6 (o login por cima) e 10 (foco e Esc no e2e, **sem dublar `showModal`**)
- `prd.md` RF5, RF7, RF9 e o caso de borda da sessão vencida com diálogo aberto; `cenarios.md`, parte A, linhas da 7.0
- `docs/interface.md` 10.2 e 9.3; `mockup.md` 3.5 (as medidas de `Dialogo`, `DialogoConfirmar` e `PainelLado`) e 3.1
- `.claude/rules/50-frontend.md`, itens 8 e 11; `.claude/rules/80-infra-e-carga.md`, item 7
- Código, em `apps/web/src/componentes/`: `Dialogo.tsx` (`showModal`, `prenderOFoco`, a devolução do foco e o
  `focoDeReserva`), `DialogoDeConfirmacao.tsx`, `dialogos.tsx` (`useEnvioUnico`, `ConfirmacaoDePerigo`), `Menu.tsx`
  com `flutuante.ts`, `LoginPorCima.tsx`, `copia-unica.tsx` e `DialogoDoConvite.tsx`

## Subtarefas

- [x] 7.1 — Revestir **sem mudar props, texto nem ordem de foco**: caixa com borda de 2 px, canto de 16 e degrau
  sólido, sobre o `veu`; o rodapé à direita. Os campos escritos à mão em `LoginPorCima` e `copia-unica` ganham
  aqui a borda de 2 px em `borda-campo` e o fundo `campo` (a 4.0 corre ao lado e não exporta as classes)
- [x] 7.2 — `DialogoDeConfirmacao`: os dois botões **do mesmo tamanho**, em duas colunas iguais (empilhados a
  360 px), cancelar antes de confirmar; o foco continua começando no texto, nunca em confirmar. **Perigo cheio só
  aqui e na `ConfirmacaoDePerigo`**
- [x] 7.3 — `Menu`: a caixa com borda e degrau, item de 44 px, realce em `fundo-suave`, perigoso em
  `vermelho-texto`; `teclado-do-menu.ts` e `flutuante.ts` não mudam
- [x] 7.4 — `PainelLado` (nova; `titulo`, `aoFechar`, `children`, `rodape`, `descritoPor`, `focoDeReserva`): sobre
  `<dialog>` com `showModal`, reaproveitando a prisão e a devolução do foco do `Dialogo` (extraia o que é comum,
  sem copiar). A partir de 768 px, 480 px colados à direita, na altura da janela; abaixo, folha de baixo com até
  88% da altura e a área segura no rodapé. Cabeçalho de 64 px com o título e "Fechar" (44 px); o foco entra no
  miolo, e não no "Fechar"; não anima largura nem altura. Entra em `PECAS_FORA_DA_ENTRADA`
- [x] 7.5 — `galeria/secoes/sobrepor.tsx`: cada peça, com gatilho, com nomes inventados
- [x] 7.6 — Testes (tabela abaixo)

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/Dialogo.tsx` | alterado |
| `apps/web/src/componentes/DialogoDeConfirmacao.tsx` | alterado |
| `apps/web/src/componentes/dialogos.tsx` | alterado |
| `apps/web/src/componentes/copia-unica.tsx` | alterado |
| `apps/web/src/componentes/DialogoDoConvite.tsx` | alterado |
| `apps/web/src/componentes/Menu.tsx` | alterado |
| `apps/web/src/componentes/LoginPorCima.tsx` | alterado |
| `apps/web/src/componentes/PainelLado.tsx` | novo |
| `apps/web/src/componentes/perigo-cheio.test.ts` | novo |
| `apps/web/src/galeria/secoes/sobrepor.tsx` | alterado |
| `apps/web/nome-dos-chunks.ts` | alterado |
| `e2e/pecas-sobrepor.spec.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| foco preso e devolvido | e2e | em `Dialogo`, confirmação e `PainelLado`: Tab e Shift+Tab não saem; ao fechar, o foco volta a quem abriu, e ao `focoDeReserva` quando o gatilho sumiu |
| Esc | e2e | fecha cada um dos três; o Esc do menu fecha o menu, e não o diálogo de trás |
| o painel, ao lado e em folha | e2e | a 1366 px, 480 px colados à direita; no `celular`, folha de baixo com `larguraExcedenteDoDialogo` zero; o foco começa no miolo |
| os dois botões da confirmação iguais | e2e | mesma largura e mesma altura, nas duas famílias e nos dois projetos; nenhum começa com o foco |
| perigo cheio só na confirmação | unidade | lista fechada: só os arquivos de hoje usam `cheio` ou `CLASSES_DO_BOTAO_PERIGO_CHEIO`; um uso novo reprova |
| menu pelo teclado | unidade e e2e | os seis casos de `teclado-do-menu.test.ts`, os dez de `flutuante.test.ts` e os dois do menu no `pecas` ficam |
| nos dois temas, com axe e toque | e2e | a seção sem violação grave; "Fechar" e item de menu com 44 px no `celular` |
| sessão vencida com diálogo aberto | e2e | `inatividade › a sessão vence sozinha…` e `acesso-suspenso › duas abas…`: o login abre por cima, prende o foco e o que estava escrito continua |
| recomeço | e2e | segunda pessoa: `inatividade › Chromebook do carrinho…`; mesma entrada e resposta atrasada: `acesso-da-turma`; falha com o diálogo aberto: `professores` e `pedidos` (o aviso anterior sai) |
| clique duplo em confirmar | e2e | `pedidos` e `acesso-da-turma` continuam mandando um pedido só |
| nenhum teste de regra enfraquecido | e2e | `alertdialog` pelo nome e `larguraExcedenteDoDialogo` (18 specs), sem edição |

Log não se aplica. Concorrência no servidor também não: o que a tarefa guarda é o clique duplo, já provado.

## Como testar

- O `jsdom` não tem `showModal`: a `PainelLado` não ganha teste de componente nem dublê; a prova dela é o e2e
- e2e a copiar: `e2e/pecas-sobrepor.spec.ts › o diálogo de confirmação…` (abrir, medir, fechar, conferir o foco);
  gaveta com foco preso: `e2e/casca.spec.ts › W12: abaixo de 768 px…`
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/perigo-cheio.test.ts`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/pecas-sobrepor.spec.ts e2e/inatividade.spec.ts e2e/pedidos.spec.ts`
- Armadilha: `showModal` duas vezes lança sob `StrictMode` (veja o comentário do `Dialogo`)
- Armadilha: caso de outro `pecas-*` que quebrar é arquivo de outra linha: pare e avise
- Telas: `/galeria` (Sobrepor), claro e escuro; `coordenacao`, `/coordenacao/professores`, `text=Cadastrar professor`;
  `professora`, `/professor/turmas`. Mockup: `/fundamentos` (Sobrepor)

## Fora do escopo desta tarefa

A gaveta da casca (12.0 e 13.0); usar o `PainelLado` nas telas e o sino (X2 e X3); `Campo` (4.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O perigo cheio tem **seis** arquivos na lista fechada, e não os dois que a 7.2 cita: além de `DialogoDeConfirmacao` e `ConfirmacaoDePerigo`, entram a definição (`botao-secundario.ts`, `Botao.tsx`), o `DialogoDeDecisao` dos pedidos de nome e a galeria | O `DialogoDeDecisao` (A1, 16.0) já escreve o `perigo` cheio e é uma confirmação do mesmo jeito; a galeria mostra o desenho do botão. A regra do PRD (RF5: "só dentro da confirmação") vale e é o que o teste prova; a lista só diz onde ela já vive | `7_task.md` 7.2; `prd.md` RF5; `docs/interface.md` 10.2 (linha da `DialogoDeConfirmacao`, com a lista fechada) |
| O `Dialogo` **não tem cabeçalho de no mínimo 64 px nem "X"** | O cabeçalho de 64 px come o espaço de um diálogo de um campo e dois botões a 360 × 640 (A72: o "Cancelar" tem de terminar dentro dos 640 px), e o "X" seria o primeiro controle do Tab de quase todo diálogo, que já tem "Cancelar" ou "Fechar". O de 64 px com "Fechar" é do `PainelLado`, como a 7.4 pede | `docs/interface.md` 10.2 (linha do `Dialogo`, agora com "produto"); A72 |
| A `DialogoDeConfirmacao` tem a largura do `Dialogo` (520 px), e não 460 px | Uma largura só para todo diálogo: a de 460 px faria a caixa da confirmação mudar de largura em relação ao diálogo de formulário que abre na mesma tela | `docs/interface.md` 10.2 (linha da confirmação) |
| A `ConfirmacaoDePerigo` de `dialogos.tsx` **mantém os botões à direita**, com a largura do rótulo e a mesma altura; as duas colunas iguais são só da `DialogoDeConfirmacao` | A 7.1 pede o rodapé à direita para `dialogos.tsx`, e a 7.2 as duas colunas para `DialogoDeConfirmacao`. Mudar a ordem e a largura da `ConfirmacaoDePerigo` mexeria na ordem do Tab de seis telas de área que a 7.0 não toca (D59 pede o mesmo tamanho, e a altura é a mesma) | `7_task.md` 7.1 e 7.2; `docs/interface.md` 10.2 (linha da `DialogoDeConfirmacao`) |
| O `Menu` **não ganha a largura mínima de 224 px** do mockup | A caixa continua `min(20rem, janela − 2rem)`, a do `flutuante.ts`: o menu de ferramenta e o de turma precisam dos 320 px, e `flutuante.test.ts` (U16) afirma os 320 e os 288 | `cenarios.md` U16 |
| O véu do `LoginPorCima` continua o **forte** de hoje (preto a 75%), e não o `veu` | Atrás do login por cima fica a tela de quem estava antes: ela tem de sumir, e não só escurecer. O `veu` vale para todo outro diálogo e para o painel | `docs/interface.md` 10.2 (linha do `LoginPorCima`) |
| O `PainelLado` **não fecha ao tocar fora** | O toque que erra a borda no celular apagaria o que foi digitado no painel. Fecha com "Fechar" e com o Esc, e a peça não tem a prop que ligue o clique fora (o `Dialogo` tem, só para o convite) | `docs/interface.md` 10.2 (linha do `PainelLado`) |
| Arquivos fora da lista de "Arquivos previstos": `dialogo-modal.ts` (a 7.4 pede para extrair o que o `Dialogo` e o `PainelLado` dividem), `dialogo-modal.test.ts`, `Menu.test.tsx`, `__fixtures__/perigo-cheio.ts`, `estilos.css`, `estilos.test.ts`, `nome-dos-chunks.test.ts` | O que é comum mora num arquivo que fica na entrada (o `Dialogo` é da entrada, o `PainelLado` não); o véu por tema é CSS e o teste que o guarda é o de `estilos.css`; o detector do perigo cheio é uma peça com mutação própria | `7_task.md` 7.4 e "Arquivos previstos" |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

Cada bloco tira uma cláusula da prisão do foco (`dialogo-modal.ts`), da pele do `Menu`, da regra do perigo cheio, do véu
por tema ou da peça fora da entrada, e exige o teste de unidade vermelho. O `jsdom` não tem `showModal`, e o `Dialogo` e o
`PainelLado` não ganham teste de componente nem dublê (Tech Spec, seção 10): o que só o navegador prova é do e2e da
galeria, `e2e/pecas-sobrepor.spec.ts`, que o portão da tarefa não roda como mutação. São só do e2e: o `showModal` e o
resto inerte, o Esc de cada um dos três e o do menu, o foco devolvido a quem abriu e ao `focoDeReserva`, o painel de 480 px
à direita e a folha de baixo de até 88%, o foco no miolo, as duas colunas iguais da confirmação com "Cancelar" antes, o
anel de 2 px com o degrau e o véu calculados nos dois temas, o axe e os 44 px de toque. O véu forte do login por cima
(`data-sessao-vencida` e a regra do `::backdrop`, nos dois temas, onde só a ordem do arquivo decide) e a pele dos campos do
login e do link do convite (borda de 2 px em `borda-campo`, fundo `campo`) são provados no e2e, em
`e2e/inatividade.spec.ts` e `e2e/professores.spec.ts`; a largura de 520 px do `Dialogo` e o rodapé à direita, em
`e2e/pecas-sobrepor.spec.ts`.

```mutacao
arquivo: apps/web/src/componentes/dialogo-modal.ts
teste: apps/web/src/componentes/dialogo-modal.test.ts › outra tecla, raiz nula
-if (evento.key !== 'Tab' || raiz === null) return
+if (raiz === null) return
```

```mutacao
arquivo: apps/web/src/componentes/dialogo-modal.ts
teste: apps/web/src/componentes/dialogo-modal.test.ts › outra tecla, raiz nula
-if (evento.key !== 'Tab' || raiz === null) return
+if (evento.key !== 'Tab') return
```

```mutacao
arquivo: apps/web/src/componentes/dialogo-modal.ts
teste: apps/web/src/componentes/dialogo-modal.test.ts › outra tecla, raiz nula
-if (primeiro === undefined || ultimo === undefined || ativo === null) return
+if (ativo === null) return
```

```mutacao
arquivo: apps/web/src/componentes/dialogo-modal.ts
teste: apps/web/src/componentes/dialogo-modal.test.ts › no primeiro controle vai ao último
 if (evento.shiftKey && !haAntes) {
-evento.preventDefault()
 ultimo.focus()
```

```mutacao
arquivo: apps/web/src/componentes/dialogo-modal.ts
teste: apps/web/src/componentes/dialogo-modal.test.ts › o Tab no último controle volta ao primeiro
 } else if (!evento.shiftKey && !haDepois) {
-evento.preventDefault()
 primeiro.focus()
```

```mutacao
arquivo: apps/web/src/componentes/dialogo-modal.ts
teste: apps/web/src/componentes/dialogo-modal.test.ts › o foco no título, que está fora da ordem do Tab
-if (evento.shiftKey && !haAntes) {
+if (!haAntes) {
```

```mutacao
arquivo: apps/web/src/componentes/dialogo-modal.ts
teste: apps/web/src/componentes/dialogo-modal.test.ts › o foco num elemento fora da ordem que está depois do último
-} else if (!evento.shiftKey && !haDepois) {
+} else if (!haDepois) {
```

```mutacao
arquivo: apps/web/src/componentes/dialogo-modal.ts
teste: apps/web/src/componentes/dialogo-modal.test.ts › o foco no título, que está fora da ordem do Tab
-const haAntes = focaveis.some((elemento) => (elemento.compareDocumentPosition(ativo) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0)
+const haAntes = focaveis.some((elemento) => (elemento.compareDocumentPosition(ativo) & Node.DOCUMENT_POSITION_PRECEDING) !== 0)
```

```mutacao
arquivo: apps/web/src/componentes/dialogo-modal.ts
teste: apps/web/src/componentes/dialogo-modal.test.ts › o controle desligado não é o último
-button:not([disabled]), input
+button, input
```

```mutacao
arquivo: apps/web/src/componentes/dialogo-modal.ts
teste: apps/web/src/componentes/dialogo-modal.test.ts › o foco no título, que está fora da ordem do Tab
-[tabindex]:not([tabindex="-1"])
+[tabindex]
```

```mutacao
arquivo: apps/web/src/componentes/Menu.tsx
teste: apps/web/src/componentes/Menu.test.tsx › a caixa tem canto de 16 px
-rounded-cartao bg-superficie p-1.5 text-left shadow-flutua
+rounded-cartao bg-superficie p-1.5 text-left shadow-lg
```

```mutacao
arquivo: apps/web/src/componentes/Menu.tsx
teste: apps/web/src/componentes/Menu.test.tsx › a caixa tem canto de 16 px
-overflow-y-auto rounded-cartao
+overflow-y-auto rounded-lg
```

```mutacao
arquivo: apps/web/src/componentes/Menu.tsx
teste: apps/web/src/componentes/Menu.test.tsx › cada item tem 44 px no mínimo
-t-apoio flex min-h-11 w-full
+t-apoio flex min-h-9 w-full
```

```mutacao
arquivo: apps/web/src/componentes/Menu.tsx
teste: apps/web/src/componentes/Menu.test.tsx › cada item tem 44 px no mínimo
-rounded-linha px-2.5 py-2
+rounded-none px-2.5 py-2
```

```mutacao
arquivo: apps/web/src/componentes/Menu.tsx
teste: apps/web/src/componentes/Menu.test.tsx › o item comum realça em fundo-suave
-hover:bg-fundo-suave focus-visible:bg-fundo-suave ${
+hover:bg-fundo focus-visible:bg-fundo ${
```

```mutacao
arquivo: apps/web/src/componentes/Menu.tsx
teste: apps/web/src/componentes/Menu.test.tsx › a ação de perigo escreve em vermelho-texto
-'text-vermelho-texto' : 'text-tinta'
+'text-erro' : 'text-tinta'
```

```mutacao
arquivo: apps/web/src/componentes/Menu.tsx
teste: apps/web/src/componentes/Menu.test.tsx › o item desligado diz que está desligado em ARIA
-desligadoAqui ? 'text-sutil' :
+desligadoAqui ? 'text-inativo' :
```

```mutacao
arquivo: apps/web/src/componentes/Menu.tsx
teste: apps/web/src/componentes/Menu.test.tsx › o item desligado diz que está desligado em ARIA
-{...(desligadoAqui ? { 'aria-disabled': true } : {})}
+{...(desligadoAqui ? {} : {})}
```

```mutacao
arquivo: apps/web/src/componentes/Menu.tsx
teste: apps/web/src/componentes/Menu.test.tsx › o glifo do item é `sutil`
-item.perigo === true && !desligadoAqui ? '' : 'text-sutil'
+item.perigo === true && !desligadoAqui ? 'text-sutil' : 'text-sutil'
```

```mutacao
arquivo: apps/web/src/componentes/Menu.tsx
teste: apps/web/src/componentes/Menu.test.tsx › o título do menu é um selo em caixa-alta
-<p aria-hidden="true" className="t-selo
+<p className="t-selo
```

```mutacao
arquivo: apps/web/src/componentes/Menu.tsx
teste: apps/web/src/componentes/Menu.test.tsx › o título do menu é um selo em caixa-alta
-t-selo px-2.5 pt-1.5 pb-1 text-sutil
+text-sm px-2.5 pt-1.5 pb-1 text-sutil
```

```mutacao
arquivo: apps/web/src/componentes/Menu.tsx
teste: apps/web/src/componentes/Menu.test.tsx › o título do menu é um selo em caixa-alta
-text-sm font-medium break-words text-sutil
+text-sm font-medium break-words text-tinta
```

```mutacao
arquivo: apps/web/src/componentes/Menu.tsx
teste: apps/web/src/componentes/Menu.test.tsx › o item escolhido, no menu de escolha única
-${marcado ? 'font-bold' : ''}
+${marcado ? 'font-medium' : ''}
```

```mutacao
arquivo: apps/web/src/componentes/DialogoDeConfirmacao.tsx
teste: apps/web/src/componentes/perigo-cheio.test.ts › os arquivos que o escrevem são os da lista fechada
-<Botao variante="perigo" cheio onClick={aoConfirmar}
+<Botao variante="perigo" onClick={aoConfirmar}
```

```mutacao
arquivo: apps/web/src/componentes/Menu.tsx
teste: apps/web/src/componentes/perigo-cheio.test.ts › os arquivos que o escrevem são os da lista fechada
-import { classesDoBotao } from './botao-secundario'
+import { classesDoBotao, CLASSES_DO_BOTAO_PERIGO_CHEIO } from './botao-secundario'
```

```mutacao
arquivo: apps/web/src/__fixtures__/perigo-cheio.ts
teste: apps/web/src/componentes/perigo-cheio.test.ts › não confunde com comentário
-.replace(/\/\*[\s\S]*?\*\//g, '')
+.replace(/\/\*[\s\S]*?\*\//g, '$&')
```

```mutacao
arquivo: apps/web/src/__fixtures__/perigo-cheio.ts
teste: apps/web/src/componentes/perigo-cheio.test.ts › não confunde com comentário
-.replace(/(^|[^:])\/\/.*$/gm, '$1')
+.replace(/(^|[^:])\/\/.*$/gm, '$&')
```

```mutacao
arquivo: apps/web/src/__fixtures__/perigo-cheio.ts
teste: apps/web/src/componentes/perigo-cheio.test.ts › não confunde com comentário
-.replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, "''")
+.replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, '$&')
```

```mutacao
arquivo: apps/web/src/__fixtures__/perigo-cheio.ts
teste: apps/web/src/componentes/perigo-cheio.test.ts › reconhece a prop do botão
-return /\bCLASSES_DO_BOTAO_PERIGO_CHEIO\b/.test(codigo) || PROP_CHEIO_NO_BOTAO.test(codigo) || CHAVE_CHEIO_NAS_CLASSES.test(codigo)
+return PROP_CHEIO_NO_BOTAO.test(codigo) || CHAVE_CHEIO_NAS_CLASSES.test(codigo)
```

```mutacao
arquivo: apps/web/src/__fixtures__/perigo-cheio.ts
teste: apps/web/src/componentes/perigo-cheio.test.ts › reconhece a prop do botão
-const CHAVE_CHEIO_NAS_CLASSES = /\bclassesDoBotao\(\s*\{[^}]*\bcheio\b/
+const CHAVE_CHEIO_NAS_CLASSES = /\bclassesDoBotao\(\s*\{[^}]*\bcheioX\b/
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › fora dos dois blocos de token, o estilos.css escreve cor só no véu do diálogo
-background-color: rgba(0, 0, 0, 0.35);
+background-color: rgba(0, 0, 0, 0.5);
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › fora dos dois blocos de token, o estilos.css escreve cor só no véu do diálogo
-background-color: rgba(0, 0, 0, 0.6);
+background-color: rgba(0, 0, 0, 0.35);
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › fora dos dois blocos de token, o estilos.css escreve cor só no véu do diálogo
-background-color: rgba(13, 13, 13, 0.75);
+background-color: rgba(0, 0, 0, 0.35);
```

```mutacao
arquivo: apps/web/nome-dos-chunks.ts
teste: apps/web/nome-dos-chunks.test.ts › o painel ao lado
 'Opcao',
-'PainelLado',
 'Selecao',
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | A lista do perigo cheio é por arquivo: um segundo uso dentro de um arquivo já listado passa; contar os usos por arquivo fecharia isso | `TODO.md`, em "Marca e interface": muda a forma da lista e do detector, e pede mutação nova; não cabe em poucas linhas |
| test-engineer (1ª) | O detector deixa passar `classesDoBotao(opcoes)` com o objeto montado antes e a prop vinda de um spread | `TODO.md`, no mesmo item: o detector é textual, e fechar os dois jeitos pede análise de sintaxe |
| revisor-geral (1ª) | `estilos.css:512` (hoje `:358`): o véu forte vence o do escuro só pela ordem no arquivo, e `estilos.test.ts` não confere a cascata | Coberta pelo item 1: o e2e afirma o `::backdrop` do login no tema escuro, que é onde a ordem decide |
| infra-guardian (1ª) | `dialogo-modal.test.ts` sem caso direto de `fechadoPeloNavegador` sob `StrictMode` | `/validar`: o `jsdom` não tem `showModal` e a Tech Spec seção 10 não admite dublê; os e2e de Esc provam o caminho |
| infra-guardian (1ª) | O `PainelLado` não tem consumidor; a tela que o usar, se buscar dado que cresce com aluno, precisa passar por ele | X2 e X3 (o sino e a tela que o usar): o `infra-guardian` entra na linha "Subagentes obrigatórios" dessa tarefa, e quem a escreve é o Arquiteto |
| frontend-reviewer (1ª) | A ordem dos botões do rodapé difere entre as peças (formulário e `ConfirmacaoDePerigo` com a ação primeiro; `DialogoDeConfirmacao` e painel com "Cancelar" primeiro) | `TODO.md`, em "Marca e interface": tarefa própria; está documentada na quarta linha de "Divergências resolvidas" (mexer na ordem mexe no Tab de seis telas de área) |
| frontend-reviewer (1ª) | O menu aberto dentro do diálogo e do painel fica sem foto e só tem e2e | X2 e X3: fotografar com dois cliques quando houver tela que o use |
| frontend-reviewer (1ª) | Texto da galeria com termo técnico ("O Esc de dentro do menu fecha só o menu") | `TODO.md`, em "Marca e interface": página interna sem link do produto (`caminhos.ts:199`); reescrever só se a galeria virar referência para o Gabriel |
| revisor-geral (2ª) | `docs/interface.md:1404`: o texto diz "a gaveta da casca (12.0 e 13.0)", mas no `tasks.md` a gaveta é só da 13.0 (13.2); a 12.0 é a casca no computador, sem gaveta. Basta citar a 13.0 | Tarefa 13.0: ela escreve a gaveta e reescreve essa linha da 10.2 |
| test-engineer (2ª) | `e2e/pecas-sobrepor.spec.ts:601-604`: o botão oficial só é provado como "não vermelho"; comparar com o token do `oficial` provaria a cor certa | `TODO.md`, em "Marca e interface": o que a tarefa promete (o perigo cheio só dentro da confirmação) está provado, e a cor do oficial é da 3.0 |
| test-engineer (2ª) | `e2e/inatividade.spec.ts:112-114`: o Tab preso do login por cima não passa do fim da ordem; repetir o Shift+Tab a partir do foco inicial, como na confirmação | `TODO.md`, em "Marca e interface": o próprio revisor diz que é anterior a esta tarefa |

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
| 2026-10-13 16:30:41 | 2026-10-13 16:31:01 | `infra-guardian` | 1 | APROVADO | a52bc88be434bf9a5 |
| 2026-10-13 16:30:33 | 2026-10-13 16:32:25 | `frontend-reviewer` | 1 | APROVADO | a8f13e6cc3cbe706f |
| 2026-10-13 16:30:50 | 2026-10-13 16:33:05 | `test-engineer` | 1 | REPROVADO | acfacb8dfd9558daa |
| 2026-10-13 16:30:59 | 2026-10-13 16:33:15 | `revisor-geral` | 1 | REPROVADO | a2a99c72a4745e357 |
| 2026-10-13 17:06:13 | 2026-10-13 17:06:40 | `revisor-geral` | 2 | APROVADO | a70ba946758d2a3bb |
| 2026-10-13 17:06:02 | 2026-10-13 17:06:44 | `test-engineer` | 2 | APROVADO | aa74c0ad8d67234b7 |
