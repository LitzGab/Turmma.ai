# Tarefa 2.0 — A lateral do professor fica com Início, Turmas e Ferramentas, e "Seu time" sai dela

**Funcionalidade:** telas-do-professor · **Depende de:** 1.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A lateral fica na ordem da D80, sem "Seu time"; as duas telas do time abrem pelo pé do sino; e cada tela do
professor passa a ter o spec dela.

## Contexto necessário

- `techspec.md` seções 5 ("Seu time"), 9 ("Nomes que mudam"), 10 e 13; `prd.md` RF1, RF2, RF6 e RF23
- Regra 70, itens 4 e 5: o Tutor nunca fica invisível
- Código: `apps/web/src/areas/navegacao.ts` (`NAVEGACAO`, `SEU_TIME`); `componentes/itens-da-lateral.tsx`
  (linhas 116 a 170); os `describe` dos dois specs que a 2.5 divide

## Subtarefas

- [ ] 2.1 — `navegacao.ts`: Início, Turmas, Ferramentas; `SEU_TIME.professor` vazio. A casca e `itens-da-lateral`
  deixam de desenhar o grupo e de ler entregas para o contador
- [ ] 2.2 — O pé do sino: "O que o Assistente fez" e "O que o Tutor viu", para os dois endereços de `time/`
- [ ] 2.3 — Nenhum texto de tela diz "Seu time": o `h1` das duas telas perde o prefixo; "Ver e decidir em Seu time"
  vira "Ver e decidir"; "Voltar para o Seu time", em Aprovar, vira "Voltar para a turma" (Tech Spec, seção 9); o aviso da Home cita o sino
- [ ] 2.4 — `e2e/__fixtures__/professor/`: `cena.ts` (`entrar`, `irPara`, `acionar`, `comLote`, hoje repetidos nos
  dois specs), `entregas.ts` (`abrirEntregasDoAssistente`), `tutor.ts` (`abrirSinaisDoTutor`) e `criados.ts`
  (`abrirOQueFoiGerado`). Os sete specs com `navigation "Seu time"` passam a chamá-las
- [ ] 2.5 — Os dois specs viram um por tela, **sem mudar título nem asserção**. De `professor-assistente`, por
  `describe`: `professor-lugares` (a navegação), `-inicio` (a Home), `-conversa`, `-ferramentas` (com o
  formulário), `-artefato` e `-entregas` (Seu time › Assistente). De `professor-turma`: `-aplicacao` (aplicar e
  encerrar), `-aprovar`, `-turma-aberta`, e "Seu time com a correção e o Tutor" dividido: o primeiro caso em
  `-entregas`, o segundo em `-tutor`
- [ ] 2.6 — `docs/interface.md`, Parte A (1, 1.3, 11.2 a 11.5): os lugares, o sino e as telas
- [ ] 2.7 — Testes

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/navegacao.ts`, `apps/web/src/areas/navegacao.test.ts` | alterado |
| `apps/web/src/componentes/itens-da-lateral.tsx`, `apps/web/src/componentes/CascaDaEscola.tsx` | alterado |
| `apps/web/src/componentes/sino/SinoDoProfessor.tsx`, `apps/web/src/componentes/sino/SinoDoProfessor.test.tsx` | alterado |
| `apps/web/src/areas/professor/Time.tsx`, `apps/web/src/areas/professor/Tutor.tsx`, `apps/web/src/areas/professor/ResultadoDaFerramenta.tsx`, `apps/web/src/areas/professor/Home.tsx`, `apps/web/src/areas/professor/Aprovar.tsx` | alterado (texto) |
| `e2e/professor-assistente.spec.ts`, `e2e/professor-turma.spec.ts` | removido |
| `e2e/professor-lugares.spec.ts` e os outros nove specs da 2.5 | novo |
| `e2e/__fixtures__/professor/` | novo |
| `e2e/areas.spec.ts`, `e2e/casca.spec.ts`, `e2e/a2-assistente.spec.ts`, `e2e/a3-a4-professor.spec.ts`, `e2e/troca-de-escola.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts`, `docs/interface.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| os lugares | unidade e e2e | Início, Turmas, Ferramentas; nas três larguras não há `navigation "Seu time"`; no celular, estão na barra de baixo |
| "Seu time" tem tela | e2e | pelo pé do sino: as entregas, com aprovar e rejeitar, e as funções do Assistente; os sinais, a atenção humana, o uso por aluno e as funções do Tutor |
| nenhum texto diz "Seu time" | e2e | em cada tela do professor, `getByText(/Seu time/)` não acha nada |
| a separação não perde caso | conferência | a lista ordenada dos títulos de `test(` em `e2e/` é a mesma antes e depois, fora dos que a tarefa declara |
| recomeço | e2e | os casos de `areas` e `troca-de-escola` continuam |

## Como testar

- Antes de mover: `grep -rhoE "test\('[^']+" e2e | sort > antes.txt`; depois, o mesmo, e `diff`
- Os lugares: `e2e/areas.spec.ts` (`ITENS_DO_PROFESSOR`) e `apps/web/src/areas/navegacao.test.ts`
- Isolado: `node tools/ci/e2e.ts --manter-ambiente e2e/professor-lugares.spec.ts e2e/professor-entregas.spec.ts`
- Telas: `professora`, `/professor/time/assistente` e `/professor/time/tutor`

## Fora do escopo desta tarefa

Criados na lateral (5.0); recompor tela (3.0 em diante); o Tutor em Hoje (10.0).

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
