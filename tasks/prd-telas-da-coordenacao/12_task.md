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

- [ ] 12.1 — A coluna "Prazo" na tabela "Pedidos dos titulares": o texto de `textoDoPrazo` e o `Estado` da família dele; o vencido diz "vencido há N dias", com ícone. A ordem continua a da chegada
- [ ] 12.2 — A linha inteira é o link do detalhe, com o tipo do pedido no nome acessível; "Registrar pedido" é o único botão `primario`
- [ ] 12.3 — O aviso do aluno da lista fica; o link "Ir para a Estrutura" passa a dizer "Ir para as turmas", no mesmo endereço, na lista (`Pedidos.tsx:91`) e no detalhe (`DetalheDoPedido.tsx:185`, e o comentário da 181); a frase "O prazo de cada um aparece no detalhe" sai. Nos textos, "em Estrutura" vira "em Escola › Turmas" (o nome da 3.0, Tech Spec §5): `textos-dos-pedidos.ts:86, 90 e 114` e `textos-do-pedido.ts:163 e 207`. Só o nome do lugar muda; o resto da frase fica
- [ ] 12.4 — O detalhe: `Tela` `leitura`, "‹ Pedidos" no lugar de "Voltar para os pedidos", o prazo no topo, o compartilhamento em tabela e o grupo "O que fazer com este pedido" como hoje. `AcoesDoPedido.tsx` e `RegistrarPedido.tsx` não mudam
- [ ] 12.5 — Marcar o m3 como feito no `TODO.md`, e deixar m4 e m5
- [ ] 12.6 — Testes

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

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: [caminho do arquivo que tem a cláusula]
teste: [caminho do teste] › [nome do caso]
  [linha de contexto, que fica]
- [a cláusula que sai]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->

