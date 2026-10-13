# Tarefa 2.0 — O Painel mostra os números da escola, a fila e o que falta

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 1.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`, `infra-guardian`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Em `/coordenacao/painel`, a coordenação vê os números da IA na escola, o consumo do mês, o que espera por ela e o que falta para terminar a escola. A tela entra na lateral na 3.0.

## Contexto necessário

- `techspec.md` seções 5, 7c e 9 ("Painel"); `prd.md` RF6, RF7, RF22 e seção 6, ponto 2
- `mockup.md` seção 1: só o cabeçalho e os ladrilhos; regra 70, itens 8 e 9
- Código: `apps/web/src/areas/coordenacao/Governanca.tsx` (os quatro `NumeroPainel` e o `Consumo`); `Estrutura.tsx` (`passosDoRoteiro`)

## Subtarefas

- [ ] 2.1 — `o-que-falta-da-escola.ts`: `passosDoRoteiro` sai da Estrutura para um módulo puro, com o endereço de cada passo; a Estrutura o importa
- [ ] 2.2 — A tela `Painel` (`Tela` `grade`), por `lazy()`, na rota nova: função suspensa (`Aviso`, com link para `/coordenacao/agentes`); os quatro números de hoje, com "Ver em Registros"; o consumo do mês numa linha
- [ ] 2.3 — "Esperando você": os itens de `useFilaDaCoordenacao` e a porta fixa "Pedidos dos titulares", sem número, com "Os prazos aparecem ao abrir. Cada leitura fica na auditoria."
- [ ] 2.4 — "Para terminar a escola": só os passos que faltam, com link; sem ano letivo, "Comece pelo ano letivo"; com tudo feito, "A escola está montada"
- [ ] 2.5 — Cada bloco com o seu carregando e o seu erro
- [ ] 2.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/Painel.tsx`, `apps/web/src/areas/coordenacao/Painel.test.tsx` | novo |
| `apps/web/src/areas/coordenacao/o-que-falta-da-escola.ts`, `apps/web/src/areas/coordenacao/o-que-falta-da-escola.test.ts` | novo |
| `apps/web/src/areas/coordenacao/Estrutura.tsx`, `apps/web/src/areas/coordenacao/rotas.tsx` | alterado |
| `apps/web/src/caminhos.ts`, `apps/web/src/caminhos.test.ts` | alterado |
| `e2e/painel-da-coordenacao.spec.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| os passos | unidade | feito, falta ou "ainda não sei"; a lista de nomes nunca tem marca |
| nenhum número por professor | componente | dois professores com pendências diferentes: só os quatro números da escola; na fila do Painel, nenhum número ao lado de nome de professor |
| fila que falha em parte | componente | uma consulta falha ou vem com `completa: false`: o Painel mostra o que leu, o aviso, e nunca "Tudo em dia"; "Tentar de novo" relê só o que falhou, por chave exata |
| quando relê | componente | o Painel só relê ao abrir se a leitura passou de 5 min (relógio falso); `staleTime` de 5 min e nenhuma releitura na volta do foco, provocada por `focusManager.setFocused(false)` e depois `setFocused(true)`, nem na volta da rede (`onlineManager.setOnline(false)` e depois `setOnline(true)`), com o dado velho; mutações: tirar `refetchOnWindowFocus: false` e tirar `refetchOnReconnect: false`, cada uma vermelha sozinha |
| sem ano letivo | componente, e2e | o bloco "Esperando você", sem ano e com ano só `planejado` ou `encerrado`: nenhuma chamada a turmas e vínculos, e "Tudo em dia". O e2e `--vazia` do Painel confere o mesmo texto no bloco |
| estados da tela | componente | cada bloco nos quatro estados; "A escola está montada" só com tudo lido e sem erro |
| o que o Painel não lê | componente | nenhuma chamada a `/v1/privacidade/pedidos`, `/lista` nem `/reivindicacoes` |
| caminho feliz, escola vazia e permissão | e2e | os números da Governança; "Comece pelo ano letivo"; não rola a 1366 × 768; 360 px; o professor vê "Página não encontrada" |
| recomeço: segunda pessoa na mesma aba; troca de escola | e2e | nenhum número nem item da anterior; os números e a fila de A não aparecem em B, nem enquanto B carrega (sem formulário, os outros casos não se aplicam) |

## Como testar

- Componente: a rede falsa por caminho da 1.0
- e2e: `e2e/governanca.spec.ts › a coordenação abre em Governança…` (`montarEscolaComEntregas`); a guarda de papel, em `e2e/areas.spec.ts`
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/Painel.test.tsx`; `node tools/ci/e2e.ts --manter-ambiente e2e/painel-da-coordenacao.spec.ts`
- O resumo é consulta infinita: use a mesma chave e só a primeira página
- Telas: `coordenacao`, `/coordenacao/painel`; também com `--vazia`; mockup `/coordenacao`

## Fora do escopo desta tarefa

O item na lateral (3.0); gráfico, filtro e número que o produto não mede.

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

