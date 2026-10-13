# Tarefa 1.0 — O sino mostra à professora o que espera por ela

**Funcionalidade:** telas-do-professor · **Depende de:** nenhuma (a X1 pousada)
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`, `infra-guardian`, `tenancy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Toda tela do professor ganha o sino "Esperando você", que lista o que espera decisão dela e leva à tela de cada
item.

## Contexto necessário

- `techspec.md` seções 5 ("A fila do professor", "Montagem"), 7, 7c e 12; `prd.md` RF3, RF4 e RF5
- Regras 20, 50 (itens 2a, 5, 11) e 80 (item 3); D59; `mockup.md` 13.1, só pela forma
- Código: `apps/web/src/componentes/CascaDaEscola.tsx` (linhas 261 a 265, o contador de "Seu time");
  `api/entregas.ts`; `areas/professor/entregas.ts` (`esperandoVoce`); `api/pedidos.ts`

## Subtarefas

- [ ] 1.1 — **A peça.** Procure o sino da X2 (`grep -rn "Esperando você" apps/web/src/componentes`) e, existindo,
  use-o sem mudar props. Senão, crie `componentes/sino/Sino.tsx`: botão de 44 px com o `Contador` e nome acessível
  "Esperando você, N" ou "Esperando você, nada"; lista de 400 px (altura cheia abaixo de 768 px), em grupos, com
  linha inteira clicável; Esc e clique fora fecham e devolvem o foco. Props: os itens, o estado da leitura
  (`carregando`, `pronto`, `erro`, `incompleto`), "tentar de novo" e o pé
- [ ] 1.2 — `fila-do-professor.ts`: `filaDoProfessor`, pura (seção 5). `esperandoVoce` e os testes dela mudam para cá
- [ ] 1.3 — `consultaContagemDePedidos(turmaId)`, em `api/pedidos.ts`: a mesma rota, guardando só `{ quantidade,
  haMais }`, com a chave `['pedidos-da-turma', 'contagem', turmaId]`, distinta da lista nominal
  (`[...CHAVE_DOS_PEDIDOS, turmaId, quem]`); `aplicarDecisao` a invalida por chave exata. Leituras em série, as 12
  primeiras turmas em ordem de nome, parando na primeira recusa por limite. Turma além do teto e turmas não lidas após
  a recusa marcam a fila `incompleto`, e o sino diz o que não leu; nunca "Tudo em dia". Nenhum item leva nome de aluno
- [ ] 1.3a — A releitura, como na X2 (`prd-telas-da-coordenacao/techspec.md` §5 e §7c): os observadores de `entregas`,
  `meus-vinculos` e da contagem com `staleTime` de 5 min, `refetchInterval: false`, `refetchOnWindowFocus: false` e
  `refetchOnReconnect: false`. O sino lê ao entrar na área e quando uma decisão invalida a chave. "Atualizar" e "Tentar
  de novo" releem só por chave exata, nunca por prefixo. Sem ano letivo em curso, o sino não chama turmas nem vínculos
  e diz isso; vínculo de ano encerrado não vira "Confirme sua turma"
- [ ] 1.4 — `SinoDoProfessor.tsx` e o mapa `sino-do-papel.ts`, com `lazy()`; a casca desenha o sino no canto de
  cima à direita e, abaixo de 768 px, na barra de topo. A seção da galeria
- [ ] 1.5 — Testes

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/sino/` | novo: a peça (ou a da X2), a fila, o mapa, o sino do professor e os testes |
| `apps/web/src/componentes/CascaDaEscola.tsx`, `apps/web/src/areas/professor/Home.tsx` | alterado |
| `apps/web/src/api/pedidos.ts`, `apps/web/src/api/pedidos.test.ts` | alterado |
| `apps/web/src/areas/professor/entregas.ts`, `apps/web/src/areas/professor/entregas.test.ts` | alterado |
| `apps/web/src/galeria/secoes/sino.tsx`, `e2e/professor-sino.spec.ts`, `e2e/__fixtures__/professor/sino.ts` | novo |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| a conta, tipo a tipo | unidade | o destino de cada tipo; o contestado não conta; duas disciplinas na mesma turma, um item; "100 ou mais" |
| sem nome no cache | componente | a rede falsa devolve nomes conhecidos. (a) Só o sino montado: o `JSON.stringify` do cache inteiro não contém nenhum nome. (b) Sino e `ListaDePedidos` montados juntos: existe a consulta `['pedidos-da-turma','contagem',turmaId]`, o dado dela é exatamente `{quantidade, haMais}` e a chave é diferente da da lista (filtrar só pelo prefixo `contagem` não basta). Mutação: guardar a lista inteira na contagem deixa os dois vermelhos |
| a chave da decisão | unidade | `aplicarDecisao` invalida `['pedidos-da-turma','contagem',turmaId]` por chave exata, e só com `quem === 'professor'`. Mutação: invalidar por prefixo |
| estados | componente | carregando; "Tudo em dia" só com tudo lido; erro; leitura parcial diz o que faltou; Esc devolve o foco |
| não insiste | componente | dois tempos, só o sino montado. (a) 5 minutos de relógio falso sem chamada nova; abrir a lista não lê. Mutação: tirar `refetchInterval: false`. (b) Além do `staleTime`, com o dado velho, `focusManager.setFocused(false)` e depois `(true)`, e `onlineManager.setOnline(false)` e depois `(true)`: zero chamadas. Um `focus` solto na janela não relê, e o teste passaria sem a opção; por isso o caso de controle prova que a mesma consulta, com a opção ligada, relê. O `afterEach` restaura os dois gerenciadores. Mutação: tirar `refetchOnWindowFocus: false` ou `refetchOnReconnect: false` |
| "Atualizar" e "Tentar de novo" por chave exata | componente | sino sobre a lista de Pedidos, fila `incompleto` e depois `erro`: o clique relê só as chaves do sino e faz zero chamadas à lista nominal. Mutação: trocar a chave exata por invalidação de prefixo deixa o teste vermelho |
| mais de 12 turmas | componente | 14 turmas dão 12 leituras, em série, em ordem de nome; a fila fica `incompleto`, o sino diz o que não leu e nunca mostra "Tudo em dia". O fixture tem zero itens nas 12 turmas lidas, sem entrega e sem vínculo pendente: "Tudo em dia" está ausente do DOM e o aviso do que não foi lido está presente. Mutação: tirar a marca `incompleto` da turma além do teto |
| sem ano letivo em curso | componente | zero chamadas a turmas e vínculos; o sino diz que não há ano letivo em curso e não mostra "Tudo em dia". Mutação: chamar turmas sem ano em curso |
| vínculo de ano encerrado | unidade | `filaDoProfessor` não gera item "Confirme sua turma" para vínculo `pendente` de ano encerrado. Mutação: ignorar o ano do vínculo |
| recusa por limite | componente | a 3ª leitura recebe 429: nada sai da 4ª à 12ª, os itens já lidos aparecem, o sino diz que não leu tudo e não mostra "Tudo em dia"; a primeira resposta segurada prova a série. Mutação: tirar a parada na primeira recusa |
| duas disciplinas na mesma turma | componente | uma leitura só de pedidos por turma |
| permissão | unidade e e2e | unidade: o aluno não tem sino e a coordenação não recebe `SinoDoProfessor`. e2e: a coordenação entra na mesma aba depois da professora, sem chamadas a `/v1/entregas`, `/v1/vinculos/meus` e `/reivindicacoes`, e sem itens dela |
| entrega decidida em outra aba | e2e | dois contextos: decide em B; em A o item segue no sino até a tentativa; a tela diz "já estava decidida" (`ENTREGA_JA_DECIDIDA`) e o item sai sem recarregar |
| um item de cada tipo | e2e | os quatro destinos; decidir tira o item; o contador tem `animationName` `none` |
| recomeço | e2e | troca de escola e segunda pessoa não veem o sino anterior: A com itens e B com zero ou outros, sem os itens nem o número de A; a contagem atrasada (`page.route`) não entra |
| 360 px e axe | e2e | nada rola de lado; sem violação grave |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx › professor: a lista é lida ao abrir…`
  (`prepararTela`, `redeFalsa`, `segurar`)
- e2e: a cena de `e2e/professor-assistente.spec.ts` (`entrar`) e a linha 123 dele (contador sem animação); a
  troca, `e2e/troca-de-escola.spec.ts › depois da troca para B…`
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/sino`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-sino.spec.ts`
- Armadilha: a casca só importa o mapa (`apps/web/nome-dos-chunks.test.ts`)
- Telas: `professora`, `/professor/nova-conversa`, `--clicar 'role=button[name=/Esperando você/]'`. Mockup:
  `/professor?sino=1`

## Fora do escopo desta tarefa

Tirar "Seu time" e o pé do sino (2.0); o Início (3.0); sinal do Tutor no sino (F10); o sino da coordenação (X2).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->
