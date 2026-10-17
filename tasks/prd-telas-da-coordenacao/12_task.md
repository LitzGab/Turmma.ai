# Tarefa 12.0 — Registros › Pedidos com o prazo na lista, e o detalhe do pedido

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A lista dos pedidos dos titulares passa a dizer o prazo de cada pedido e a marcar o vencido, com a linha inteira abrindo o detalhe; o detalhe fica na página de leitura, com "‹ Pedidos". Registrar, concluir, corrigir, cancelar e baixar não mudam.

## Contexto necessário

- `techspec.md` seções 7 e 9 ("Pedidos"); `prd.md` RF20, RF22 e seção 6 ("Leitura auditada não sai sozinha")
- `TODO.md`, item "(F3, validação, m3 a m6)": o m3 entra; o m4 e o m5 não, porque pedem campo no DTO
- `mockup.md` seção 5.3: só a tabela com Prazo e Estado. Avisos, encaminhamento, "Ver o trecho" e a resposta **não entram**
- `.claude/rules/20-lgpd-menores.md` itens 10 e 19
- Código: `apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx` (`COLUNAS_DOS_PEDIDOS`), `DetalheDoPedido.tsx`, `textos-do-pedido.ts` (`prazoDoPedido`, `textoDoPrazo`) e `textos-dos-pedidos.ts` (`ordenarOsPedidos`); `apps/web/src/api/privacidade.ts` (`gcTime: 0`, sem releitura)

## Subtarefas

- [x] 12.1 — A coluna "Prazo" na tabela "Pedidos dos titulares": o texto de `textoDoPrazo` e o `Estado` da família dele; o vencido diz "vencido há N dias", com ícone. A ordem continua a da chegada
- [x] 12.2 — A linha inteira é o link do detalhe, com o tipo do pedido no nome acessível; "Registrar pedido" é o único botão `primario`
- [x] 12.3 — O aviso do aluno da lista fica; o link "Ir para a Estrutura" passa a dizer "Ir para as turmas", no mesmo endereço, na lista (`Pedidos.tsx:91`) e no detalhe (`DetalheDoPedido.tsx:185`, e o comentário da 181); a frase "O prazo de cada um aparece no detalhe" sai. Nos textos, "em Estrutura" vira "em Escola › Turmas" (o nome da 3.0, Tech Spec §5): `textos-dos-pedidos.ts:86, 90 e 114` e `textos-do-pedido.ts:163 e 207`. Só o nome do lugar muda; o resto da frase fica
- [x] 12.4 — O detalhe: `Tela` `leitura`, "‹ Pedidos" no lugar de "Voltar para os pedidos", o prazo no topo, o compartilhamento em tabela e o grupo "O que fazer com este pedido" como hoje. `AcoesDoPedido.tsx` e `RegistrarPedido.tsx` não mudam
- [x] 12.5 — Marcar o m3 como feito no `TODO.md`, e deixar m4 e m5
- [x] 12.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx`, `apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx` | alterado |
| `apps/web/src/areas/coordenacao/privacidade/textos-dos-pedidos.ts`, `apps/web/src/areas/coordenacao/privacidade/textos-dos-pedidos.test.ts` | alterado |
| `apps/web/src/areas/coordenacao/privacidade/textos-do-pedido.ts` | alterado (só o nome do lugar, 12.3) |
| `apps/web/src/areas/coordenacao/privacidade/Pedidos.test.tsx` | novo |
| `e2e/pedidos-do-titular.spec.ts`, `e2e/pedido-do-titular.spec.ts`, `e2e/__fixtures__/pedidos-do-titular.ts` | alterado |
| `TODO.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| o prazo na linha | unidade | aberto com dias; o que vence hoje; vencido há N dias, com a família `erro`; concluído e cancelado sem prazo a cumprir |
| estados da tela | componente | carregando; erro com "Tentar de novo"; "Nenhum pedido registrado"; com dado e um vencido; a falha de "Ver mais pedidos" não apaga a lista |
| uma leitura por abertura | componente | a aba lê ao abrir e não relê no foco; o texto do prazo sai de `chegouEm`, sem chamada a mais |
| a lista de hoje | e2e | o caso `carregando, erro…, vazio e com dado: o eliminado, a página de 50…`, com o prazo na linha e o vencido em texto |
| o detalhe de hoje | e2e | os dezesseis casos de `pedido-do-titular.spec.ts`, pelo link novo: cada abertura é uma leitura auditada |
| recomeço: segunda pessoa de outra escola; a leitura atrasada da segunda página; registrar com a rede caindo | e2e | os casos de hoje, sem perder asserção |
| 360 px | e2e | a tabela vira lista, com o prazo em cada item; sem rolagem de lado |

## Como testar

- `apps/web/src/areas/coordenacao/privacidade/textos-do-pedido.test.ts` já prova `prazoDoPedido`: o teste novo cobre só a linha
- `e2e/pedidos-do-titular.spec.ts › carregando, erro com "Tentar de novo", vazio e com dado…`; a navegação está em `e2e/__fixtures__/pedidos-do-titular.ts`
- Pedido vencido: semeie com `chegouEm` de vinte dias atrás; "hoje" é o dia de São Paulo
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/privacidade/Pedidos.test.tsx`; `node tools/ci/e2e.ts --manter-ambiente e2e/pedidos-do-titular.spec.ts`
- O link novo: `e2e/pedido-do-titular.spec.ts:385, 441 e 446` e `e2e/pedidos-do-titular.spec.ts:338` afirmam "Ir para a Estrutura" e passam a afirmar "Ir para as turmas", com a mesma asserção (visível, ou contagem zero)
- A vitrine não semeia pedido: semeie à mão e diga em "Telas vistas"
- Telas: `coordenacao`, `/coordenacao/privacidade/pedidos`, e o clique na primeira linha; mockup `/coordenacao/registros?aba=avisos`

## Fora do escopo desta tarefa

m4 (o dia da eliminação) e m5 (esconder "Baixar a versão da escola"); pedido no sino ou no Painel; Avisos e encaminhamento (F9).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| `apps/web/src/componentes/Tabela.tsx` entra na tarefa, fora de "Arquivos previstos": a linha (`tr`) e o item da lista (`li`) ganham `relative` | A linha inteira só pode ser o link se o `after:absolute after:inset-0` do link da célula do nome achar a linha como ancestral posicionado; sem isso ele cobre o miolo todo e a última linha vence as outras. A 5.0 (linha 2) faz a mesma mudança nas mesmas duas linhas, e o merge junta as duas | `techspec.md` §9, "Chromebook e celular": "O link da linha fica na célula do nome", com a frase da `Tabela` acrescentada nesta tarefa |
| Dois arquivos de teste de componente a mais: `DetalheDoPedido.test.tsx` (novo) e `textos-do-pedido.test.ts` (alterado) | O detalhe só tinha e2e, e uma mutação de e2e reconstrói a web a cada bloco; o teste de componente prova a página de leitura, o "‹ Pedidos", o prazo no topo e o link "Ir para as turmas" por cima da rede falsa. O `textos-do-pedido.test.ts` prova os dois textos de 12.3 que moram em `textos-do-pedido.ts` | `techspec.md` §10, linha "Componente (jsdom, `__fixtures__/tela.tsx`)": "cada tela" |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Pedidos.test.tsx › o vencido diz "vencido há N dias"
- const prazo = textoDoPrazo(prazoDoPedido(pedido, hoje))
+ const prazo = textoDoPrazo(prazoDoPedido(pedido, pedido.chegouEm))
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Pedidos.test.tsx › às 22h de São Paulo
- const hoje = hojeEmSaoPaulo()
+ const hoje = new Date().toISOString().slice(0, 10)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Pedidos.test.tsx › a coluna "Prazo" vem antes de "Situação"
- titulo: 'Prazo',
+ titulo: 'Vence',
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Pedidos.test.tsx › o link se estende pela linha
  aria-label={`${nome}, ${ROTULO_DO_TIPO[pedido.tipo]}`}
- className="inline-flex min-h-11 items-center text-caramelo-texto underline after:absolute after:inset-0"
+ className="inline-flex min-h-11 items-center text-caramelo-texto underline"
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Pedidos.test.tsx › há um link só por linha
  to={caminhoDoPedidoDoTitular(pedido.id)}
- aria-label={`${nome}, ${ROTULO_DO_TIPO[pedido.tipo]}`}
  className="inline-flex min-h-11 items-center text-caramelo-texto underline after:absolute after:inset-0"
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Pedidos.test.tsx › o cabeçalho não promete o prazo no detalhe
- apoio="Acesso, portabilidade, compartilhamento, correção e eliminação de dados, pedidos pela própria pessoa ou pelo responsável."
+ apoio="Acesso, portabilidade, compartilhamento, correção e eliminação de dados, pedidos pela própria pessoa ou pelo responsável. O prazo de cada um aparece no detalhe."
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Pedidos.test.tsx › o aviso do aluno fica
- Ir para as turmas
+ Ir para a Estrutura
```

```mutacao
arquivo: apps/web/src/componentes/Tabela.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Pedidos.test.tsx › o link se estende pela linha
- <tr key={chaveDaLinha(linha)} className="relative h-16 border-b-2 border-borda last:border-b-0">
+ <tr key={chaveDaLinha(linha)} className="h-16 border-b-2 border-borda last:border-b-0">
```

```mutacao
arquivo: apps/web/src/componentes/Tabela.tsx
teste: apps/web/src/areas/coordenacao/privacidade/Pedidos.test.tsx › no celular o item também é o ancestral posicionado
- <li key={chaveDaLinha(linha)} className="relative min-w-0 rounded-cartao border-2 border-borda bg-superficie p-4">
+ <li key={chaveDaLinha(linha)} className="min-w-0 rounded-cartao border-2 border-borda bg-superficie p-4">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx
teste: apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.test.tsx › com dado: coluna de leitura
- <Link to={caminhoDaAbaDaPrivacidade('pedidos')} aria-label="Voltar para Pedidos" className="inline-flex min-h-11 items-center gap-2 self-start text-caramelo-texto underline">
+ <Link to={caminhoDaAbaDaPrivacidade('pedidos')} aria-label="Voltar para os pedidos" className="inline-flex min-h-11 items-center gap-2 self-start text-caramelo-texto underline">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx
teste: apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.test.tsx › com dado: coluna de leitura
  <ArrowLeft aria-hidden="true" size={18} />
- Pedidos
+ Voltar para os pedidos
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx
teste: apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.test.tsx › com dado: coluna de leitura
  titulo={pedido.titular?.nome ?? TEXTO_DO_TITULAR_ELIMINADO}
- largura="leitura"
  objeto
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx
teste: apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.test.tsx › carregando, pedido que não se acha e erro
- <Tela titulo="Pedido de titular" largura="leitura" antes={voltar}>
+ <Tela titulo="Pedido de titular" antes={voltar}>
  <EstadoCarregando rotulo="Carregando o pedido…" />
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx
teste: apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.test.tsx › carregando, pedido que não se acha e erro
- <Tela titulo="Pedido de titular" largura="leitura" antes={voltar}>
+ <Tela titulo="Pedido de titular" antes={voltar}>
  {naoAchado ? (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx
teste: apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.test.tsx › o prazo vem no topo
- <Cartao titulo="Prazo da declaração completa">
+ <Cartao titulo="O pedido">
  <div className="flex min-w-0 flex-col gap-2">
  <div>
  <Estado familia={prazo.familia}>{prazo.texto}</Estado>
  </div>
  <p className="text-sm break-words text-sutil">
  O prazo é de {String(PRAZO_DA_DECLARACAO_COMPLETA_DIAS)} dias e conta do dia em que o pedido chegou à escola (LGPD, art. 19, II).
  </p>
  </div>
  </Cartao>
- <Cartao titulo="O pedido">
+ <Cartao titulo="Prazo da declaração completa">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx
teste: apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.test.tsx › a correção aberta leva a
  <Link to={ROTAS_DA_COORDENACAO.estrutura} className={CLASSES_DO_LINK_SECUNDARIO}>
- Ir para as turmas
+ Ir para a Estrutura
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/textos-dos-pedidos.ts
teste: apps/web/src/areas/coordenacao/privacidade/textos-dos-pedidos.test.ts › a busca sem ninguém
- lista de nomes da turma, em Escola › Turmas.'
+ lista de nomes da turma, em Estrutura.'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/textos-dos-pedidos.ts
teste: apps/web/src/areas/coordenacao/privacidade/textos-dos-pedidos.test.ts › a busca sem ninguém
- abra a turma em Escola › Turmas. Ler a lista
+ abra a turma em Estrutura. Ler a lista
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/textos-dos-pedidos.ts
teste: apps/web/src/areas/coordenacao/privacidade/textos-dos-pedidos.test.ts › a busca sem ninguém
- se faz pela turma, em Escola › Turmas.',
+ se faz pela turma, em Estrutura.',
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/textos-do-pedido.ts
teste: apps/web/src/areas/coordenacao/privacidade/textos-do-pedido.test.ts › a orientação existe só nos estados
- Corrija o nome da pessoa por aqui. A correção de turma ou de vínculo se faz pela turma, em Escola › Turmas.
+ Corrija o nome da pessoa por aqui. A correção de turma ou de vínculo se faz pela turma, em Estrutura.
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/textos-do-pedido.ts
teste: apps/web/src/areas/coordenacao/privacidade/textos-do-pedido.test.ts › o que corrigir o nome faz
- é refeito, e a correção de turma ou de vínculo se faz pela turma, em Escola › Turmas.'
+ é refeito, e a correção de turma ou de vínculo se faz pela turma, em Estrutura.'
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | `Pedidos.tsx:63` e `:70-74`: a mesma linha mistura "14 de outubro de 2026" com "até 29/10/2026"; um formato só deixaria a leitura mais limpa | Muda o texto de `textoDoPrazo`, que os testes e os e2e afirmam, e o formato curto é o do prazo em toda a Privacidade. Fora desta tarefa: `TODO.md`, na próxima tarefa que mexer em `textos-do-pedido.ts` |
| frontend-reviewer (1ª) | `Pedidos.tsx:53-58`: o foco por teclado desenha o anel só no nome; um `focus-within` na linha, em `Tabela.tsx`, marcaria a linha toda. "Pode ir para o `/retro`" | Muda o comportamento visual de toda `Tabela` (12 telas), e não só dos Pedidos. Destino: `/retro`, como o próprio revisor indicou |
| frontend-reviewer (1ª) | `Tabela.tsx:62` e `:96`: o `relative` na linha e no item vale para toda `Tabela`; a 5.0 faz a mesma mudança, e o merge deve juntar sem conflito | Não é edição desta tarefa. Destino: o Orquestrador, ao juntar as linhas no encontro, que já está na linha "Divergências resolvidas" do documento |
| privacy-guardian (1ª) | Com a linha inteira virando link, abrir um detalhe sem querer gera um `pedido.lido`; olhar o efeito no ruído da auditoria quando ela ganhar filtro por finalidade | Não é vazamento e não há o que mudar agora. Destino: `/retro` |
| privacy-guardian (1ª) | O `aria-label` do link repete o que já aparece na linha; coluna nova no nome acessível só pode ser dado que já aparece na linha | Já é verdade hoje e não pede edição. Recusada, sem mudança |
| revisor-geral (1ª) | A busca do link no e2e perdeu o `exact` | Aplicada com outra forma: `linkDoPedido` (fixture) ancora o nome inteiro e a vírgula, `^<nome>, `, porque o tipo do pedido não está à mão nos pontos de `abrirODetalhe` |
| test-engineer (2ª) | `e2e/__fixtures__/pedidos-do-titular.ts:118`: `linkDoPedido` ainda aceita qualquer tipo depois da vírgula; onde o tipo estiver à mão, passá-lo como argumento opcional deixa a busca mais firme | Os nomes são únicos por `marca()` e o `abrirODetalhe` não tem o tipo à mão. Destino: a próxima tarefa que mexer no fixture `pedidos-do-titular.ts` |
| test-engineer (2ª) | `DetalheDoPedido.test.tsx:87`: o comentário diz "o limite de pedidos", mas o código de erro é o genérico `LIMITE_EXCEDIDO` | Texto de comentário de teste, sem efeito no que o teste prova. Destino: a próxima tarefa que mexer em `DetalheDoPedido.test.tsx` |

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
| 2026-10-17 00:18:24 | 2026-10-17 00:19:07 | `frontend-reviewer` | 1 | APROVADO | ad51a0cd491feec36 |
| 2026-10-17 00:18:27 | 2026-10-17 00:19:20 | `privacy-guardian` | 1 | APROVADO | a54accb1c72b38d84 |
| 2026-10-17 00:18:32 | 2026-10-17 00:20:38 | `revisor-geral` | 1 | APROVADO | ac7179518bd033e48 |
| 2026-10-17 00:18:30 | 2026-10-17 00:20:58 | `test-engineer` | 1 | APROVADO | a1e747c1d239d41c4 |
| 2026-10-17 00:30:39 | 2026-10-17 00:31:12 | `revisor-geral` | 2 | APROVADO | a6683a5d536dbb0b1 |
| 2026-10-17 00:30:33 | 2026-10-17 00:31:13 | `test-engineer` | 2 | APROVADO | a63800e24be1043ab |
