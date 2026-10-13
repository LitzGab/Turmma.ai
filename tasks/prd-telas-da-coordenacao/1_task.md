# Tarefa 1.0 — A coordenação vê no sino o que espera por ela

**Funcionalidade:** telas-da-coordenacao · **Depende de:** nenhuma
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`, `infra-guardian`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Em toda tela da coordenação, um sino conta o que espera por ela e abre a lista "Esperando você"; cada item leva à tela que resolve.

## Contexto necessário

- `techspec.md` seções 5 ("O sino", "A fila"), 7, 7b e 7c ("Releitura"); `prd.md` RF4, RF5 e seção 6
- `mockup.md` seção 16(b); `tasks/prd-pele-e-casca/techspec.md` seções 7b e 9; regra 20, item 10
- Código: `apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx` (montado acima do `Switch`, uma leitura por sessão)

## Subtarefas

- [ ] 1.1 — A âncora: `useAncoraDoSino()` e o elemento vazio na casca
- [ ] 1.2 — A peça `Sino`, com a lista por prop: botão "Esperando você, N" ou "Esperando você, nada", `Contador` parado, e `PainelLado` com os grupos "Urgente" e "Da escola", cada item uma `Linha` que é link
- [ ] 1.3 — Os estados: carregando, erro, leitura parcial, e o vazio com ícone ilustrado, sem mascote, e "Tudo em dia" (com "Ver o que falta para a escola"); `completa: false` em qualquer consulta vira leitura parcial, com "Parte da lista não carregou"; "Tentar de novo" também com a fila em `erro`; "Atualizar" e "Atualizado às HH:MM" (só muda depois do clique, sem temporizador), que relê os cinco observadores pela chave exata
- [ ] 1.4 — `montarFila` (pura) e `useFilaDaCoordenacao`, como na Tech Spec: observadores com `staleTime` de 5 min, `refetchInterval: false`, `refetchOnWindowFocus: false` e `refetchOnReconnect: false`; retry só por chave exata; um item por vínculo ou convite, `contador` só em turmas sem professor; sem ano em curso não chama turmas nem vínculos
- [ ] 1.5 — `SinoDaCoordenacao`, por `lazy()`, em `rotas.tsx`; galeria; `PECAS_FORA_DA_ENTRADA`
- [ ] 1.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/sino/Sino.tsx`, `apps/web/src/componentes/sino/Sino.test.tsx` | novo |
| `apps/web/src/componentes/ancora-do-sino.ts` | novo |
| `apps/web/src/componentes/CascaDaEscola.tsx`, `apps/web/nome-dos-chunks.ts` | alterado |
| `apps/web/src/areas/coordenacao/fila-da-coordenacao.ts`, `apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts` | novo |
| `apps/web/src/areas/coordenacao/SinoDaCoordenacao.tsx`, `apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx` | novo |
| `apps/web/src/areas/coordenacao/rotas.tsx`, `apps/web/src/__fixtures__/tela.tsx` | alterado |
| `apps/web/src/galeria/secoes/sino.tsx`, `e2e/sino-da-coordenacao.spec.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| a conta, tipo a tipo | unidade | os cinco tipos viram item com o endereço certo; vínculo pendente e material processando não viram |
| borda: duas disciplinas na mesma turma; turma só com vínculo contestado; sem ano em curso | unidade | conta uma vez; é sem professor; nenhum item de turma |
| vínculo encerrado | unidade | encerrado ao lado de confirmado: não é sem professor; só encerrado: é; contestado e depois encerrado: sem item de contestação |
| lista truncada | unidade e componente | `completa: false` em qualquer das cinco: `parcial`, sem "Tudo em dia"; em turmas ou em vínculos, cada um sozinho, suprime "turmas sem professor" |
| um item por vínculo | unidade | um professor com duas contestações e outro com uma dão três itens, nenhum com `contador`; `id` único com a mesma contestação duas vezes e com homônimos; os tipos são só os cinco da tabela e nada em `montarFila` deriva de uso, entrega ou atividade do professor; revogar o convite tira o item; a contagem do sino é a do filtro "Sem professor" |
| o sino não relê | componente | dois tempos, só o sino montado. (a) Com um material `processando`, avançar 10 s ou mais: zero chamadas. Mutação: tirar `refetchInterval: false`. (b) Avançar além de 5 min, com o dado velho, o foco sai e volta (`focusManager.setFocused(false)` e depois `setFocused(true)`) e a rede sai e volta (`onlineManager.setOnline(false)` e depois `setOnline(true)`): zero chamadas, de qualquer consulta, anos letivos inclusive. Um `focus` na janela ou um `online` solto não fazem o TanStack reler, e o teste passaria sem a opção. O `afterEach` restaura os dois gerenciadores, e um caso de controle prova que a mesma consulta, com a opção ligada, relê (o padrão é o de `apps/web/src/api/privacidade.test.ts`). Mutações, cada uma vermelha sozinha: tirar `refetchOnWindowFocus: false` (falha na volta do foco); tirar `refetchOnReconnect: false` (falha na volta da rede). Incidentes lidos uma vez por sessão |
| "Tentar de novo" e "Atualizar" não leem o que é auditado | componente | sino montado sobre a lista da turma e sobre Pedidos, fila `parcial` e depois `erro`, clique em cada um: zero chamadas a `/lista`, `/reivindicacoes` e `/v1/privacidade/pedidos`; "Atualizado às" só muda depois do clique. Mutação: trocar a releitura (do retry ou do "Atualizar") por invalidação de prefixo deixa o teste vermelho |
| sem ano letivo | componente, e2e | sem ano, ou só `planejado` ou `encerrado`: nenhuma chamada a turmas e vínculos (ou 404 tratado como vazio), `pronta`, "Tudo em dia"; e2e `--vazia` olha o sino |
| só a coordenação | componente | nas áreas do professor e do aluno não há "Esperando você" da coordenação nem chamada a `/v1/vinculos`, `/v1/professores` ou `/v1/privacidade/incidentes` vinda do sino |
| o que a fila não lê | componente | nenhuma chamada a `/lista`, `/reivindicacoes` nem `/v1/privacidade/pedidos`; abrir a lista não faz chamada |
| estados da tela | componente | parcial nunca diz "Tudo em dia"; vazio só com tudo lido; a contagem no nome acessível; o vazio sem mascote |
| do sino à tela | e2e | convite vencido: conta 1, leva a Professores e, refeito, some; foco devolvido; nada animado; 360 px |
| recomeço: segunda pessoa; troca de escola | e2e | a fila da anterior não aparece (sem formulário, os outros casos não se aplicam) |

## Como testar

- Componente: `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx › coordenação: nada é lido ao abrir…`. A fila lê em paralelo: `redeFalsa` passa a responder por caminho
- e2e: `e2e/professores.spec.ts › W4 (Professores)…` semeia o convite vencido; a leitura única de `e2e/incidentes.spec.ts` não pode virar duas
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts`; `node tools/ci/e2e.ts --manter-ambiente e2e/sino-da-coordenacao.spec.ts`
- Telas: `coordenacao`, `/coordenacao/governanca`, clique `text=Esperando você`; mockup `/coordenacao?sino=1`

## Fora do escopo desta tarefa

Os lugares (3.0), o Painel (2.0), o sino do professor (X3), item de leitura auditada e a onça de corpo inteiro no vazio (decisão do Joaquim, `techspec.md` seção 12).

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

