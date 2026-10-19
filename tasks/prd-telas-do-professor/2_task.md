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

- [x] 2.1 — `navegacao.ts`: Início, Turmas, Ferramentas; `SEU_TIME.professor` vazio. A casca e `itens-da-lateral`
  deixam de desenhar o grupo e de ler entregas para o contador
- [x] 2.2 — O pé do sino: "O que o Assistente fez" e "O que o Tutor viu", para os dois endereços de `time/`
- [x] 2.3 — Nenhum texto de tela diz "Seu time": o `h1` das duas telas perde o prefixo; "Ver e decidir em Seu time"
  vira "Ver e decidir"; "Voltar para o Seu time", em Aprovar, vira "Voltar para a turma" (Tech Spec, seção 9); o aviso da Home cita o sino
- [x] 2.4 — `e2e/__fixtures__/professor/`: `cena.ts` (`entrar`, `irPara`, `acionar`, `comLote`, hoje repetidos nos
  dois specs), `entregas.ts` (`abrirEntregasDoAssistente`), `tutor.ts` (`abrirSinaisDoTutor`) e `criados.ts`
  (`abrirOQueFoiGerado`). Os sete specs com `navigation "Seu time"` passam a chamá-las
- [x] 2.5 — Os dois specs viram um por tela, **sem mudar título nem asserção**. De `professor-assistente`, por
  `describe`: `professor-lugares` (a navegação), `-inicio` (a Home), `-conversa`, `-ferramentas` (com o
  formulário), `-artefato` e `-entregas` (Seu time › Assistente). De `professor-turma`: `-aplicacao` (aplicar e
  encerrar), `-aprovar`, `-turma-aberta`, e "Seu time com a correção e o Tutor" dividido: o primeiro caso em
  `-entregas`, o segundo em `-tutor`
- [x] 2.6 — `docs/interface.md`, Parte A (1, 1.3, 11.2 a 11.5): os lugares, o sino e as telas
- [x] 2.7 — Testes

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
| A régua de duração do e2e do portão passa a ser a metade do prazo **declarado no HEAD** do caso (a 2.0 não conta o prazo que ela mesma põe). Decisão do Joaquim em 18/10/2026, alternativa 1; a 2.0 só encurta ou divide `casca:468` e `areas:151`, os dois casos editados acima de 15 s sem prazo próprio | Os dois casos mediam 14,5 a 18,1 s com seis trabalhadores. `casca:468` virou dois (o trilho e os alvos; a escolha guardada, com a recarga sem a rede lenta do perfil, como o `casca:144`) e `areas:151` virou dois (os itens e as telas; o item selecionado e o apagado, com o desvio de Início a Turmas). Nenhuma asserção saiu: cada uma foi para um dos dois. Os títulos novos são quatro, e a contagem de `test(` em `e2e/` vai de 508 a 510; os 508 títulos que não foram divididos estão iguais, e dos dois divididos só o primeiro perdeu um trecho (`casca:468`: "fica guardado… e abrir desfaz"; `areas:151`: "com as pistas do selecionado") | `techspec.md` §10, parágrafo "Duração do e2e na separação" (commit `23e8794` na branch da spec); `tools/ci/duracao-do-e2e.ts` (correção `75f94a3`) |
| Os títulos dos dois casos da 2.5 que citam a lateral com "Seu time" (`a lateral tem Início, Ferramentas e Turmas, e "Seu time"…` e `o Tutor na lateral, sem contador…`) ficam como eram: a 2.5 não muda título. O corpo prova o que a lateral é hoje (os três lugares na ordem da D80, nenhum grupo "Seu time", o número do sino e o pé dele). A 10.0 cita o segundo pelo título | O texto do título fica atrás do corpo; trocá-lo é decisão do dono da spec | `techspec.md` §10, parágrafo "A separação dos specs"; `10_task.md` ("Testes que provam a regra") |

## Mutações

Cada cláusula nova desta tarefa tem a sua: o pé do sino (existe, aparece em toda situação, e some sem link), os dois
destinos dele, o "Voltar para a turma" de Aprovar e o item "Turmas" da lateral.

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › aparece em toda situação da leitura
-{pe !== undefined && <PeDaLista {...pe} />}
+{false && pe !== undefined && <PeDaLista {...pe} />}
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › sem o pé, ou com o pé sem link
-if (links.length === 0) return null
```

```mutacao
arquivo: apps/web/src/areas/professor/SinoDoProfessor.tsx
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › o pé leva às duas telas do time
-{ rotulo: 'O que o Tutor viu', para: ROTAS_DO_PROFESSOR.timeDoTutor },
+{ rotulo: 'O que o Tutor viu', para: ROTAS_DO_PROFESSOR.timeDoAssistente },
```

```mutacao
arquivo: apps/web/src/areas/professor/aprovar.ts
teste: apps/web/src/areas/professor/aprovar.test.ts › leva à turma da correção
-return turmaId === undefined ? ROTAS_DO_PROFESSOR.turmas : caminhoDaTurmaDoProfessor(turmaId)
+return ROTAS_DO_PROFESSOR.turmas
```

```mutacao
arquivo: apps/web/src/areas/navegacao.ts
teste: apps/web/src/areas/navegacao.test.ts › W2
-{ rotulo: 'Turmas', caminho: ROTAS.turmas, icone: { lugar: 'turmas' } },
```

```mutacao
arquivo: apps/web/src/areas/professor/Aprovar.tsx
teste: e2e/professor-aprovar.spec.ts › carregando, erro e a correção que não existe
-<Link to={caminhoDeVoltaDaCorrecao(entregaInteira?.turmaId)} className="inline-flex min-h-11 items-center gap-2 self-start text-caramelo-texto underline">
+<Link to={caminhoDeVoltaDaCorrecao(undefined)} className="inline-flex min-h-11 items-center gap-2 self-start text-caramelo-texto underline">
```

```mutacao
arquivo: apps/web/src/areas/professor/Artefato.tsx
teste: e2e/professor-artefato.spec.ts › os quatro estados
-<Link to={ROTAS_DO_PROFESSOR.timeDoAssistente} className="text-caramelo-texto underline">
+<Link to={ROTAS_DO_PROFESSOR.turmas} className="text-caramelo-texto underline">
```

```mutacao
arquivo: apps/web/src/areas/professor/Home.tsx
teste: e2e/professor-inicio.spec.ts › carregando, erro com
-{pendentes.data?.proxima !== undefined && <p className="text-sm text-sutil">Há mais entregas esperando você. Veja no sino “Esperando você”.</p>}
+{false && pendentes.data?.proxima !== undefined && <p className="text-sm text-sutil">Há mais entregas esperando você. Veja no sino “Esperando você”.</p>}
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª), conformidade-reviewer (1ª) | Os títulos que ainda dizem "Seu time" (`professor-lugares.spec.ts`, `professor-tutor.spec.ts`, os `describe` de `professor-entregas.spec.ts`) ficaram como eram | Recusada: a 2.5 não muda título, e está nas "Divergências resolvidas" da tarefa. A 10.0 cita o segundo pelo título e o renomeia com o dono da spec |
| test-engineer (1ª) | `aprovar.test.ts` só resolve `@educa/shared` rodando da raiz | `TODO.md` (Processo): é do ambiente de teste, não da tarefa |
| revisor-geral (1ª) | A Tech Spec fala em três props opcionais do `Sino` (§2 e §5, "Montagem") e agora há uma quarta, `pe` | Aviso da Tech Spec ao Arquiteto (D79): a Mesa o leva ao Orquestrador. Não muda a arquitetura |
| revisor-geral (1ª) | `abrirOQueFoiGerado` (`criados.ts`) não é chamada por nenhum spec | Fica: a 2.4 a pede e a `5_task.md` a cita; a 5.0 é a primeira a usá-la |
| frontend-reviewer (1ª) | Os nomes do pé ("O que o Assistente fez", "O que o Tutor viu") não batem com o `h1` e o título da aba ("Assistente de ensino", "Tutor") | `TODO.md` (Marca e interface), para o dono da spec: muda título de tela e de aba, que a Tech Spec §9 fixa. Nenhuma tarefa recompõe `Time.tsx` ou `Tutor.tsx` |
| frontend-reviewer (1ª) | A Home da escola vazia fica só com a caixa de pedido, sem convite abaixo | 3.0 (a Home é dela): garantir que a Home com turma nunca fique sem convite (regra 50, item 6) |
| frontend-reviewer (1ª) | As abas "Tudo / Esperando você / Correção / Adaptação" de "O que o Assistente fez" quebram em duas linhas a 360 px | `TODO.md` (Marca e interface): nenhuma tarefa da spec recompõe `Time.tsx`; a 10.0 trata as abas da turma, que são outras |
| frontend-reviewer (1ª), conformidade-reviewer (1ª), revisor-geral (1ª) | A foto do sino aberto a 360 px sai sem a lista: a vitrine reduz a janela depois do clique | `/retro` da spec: ajuste em `tools/vitrine/`, que a tarefa não toca. O e2e já prova o pé no projeto `celular` |
| test-engineer (2ª), conformidade-reviewer (2ª) | `navegacao.test.ts`: `not.toHaveProperty('SEU_TIME')` é mais fraco que a lista exata de exports | Recusada: a lista exata era a recomendação do `revisor-geral` (1ª), aplicada pela ordem da rodada 1; os nomes de cada papel na lateral seguem provados nas asserções logo acima (`not.toContain('Assistente de ensino')` e `not.toContain('Seu time')`) |
| frontend-reviewer (2ª) | Os comentários de `navegacao.ts` e `SinoDoProfessor.tsx` ainda citam "Seu time" como histórico | Recusada: não chega ao usuário e conta por que o pé do sino existe |

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
| 2026-10-18 21:40:07 | 2026-10-18 21:41:33 | `conformidade-reviewer` | 1 | APROVADO | ab724486cd52a81e2 |
| 2026-10-18 21:40:17 | 2026-10-18 21:43:25 | `test-engineer` | 1 | REPROVADO | ae2f6d101bfe37b57 |
| 2026-10-18 21:40:27 | 2026-10-18 21:43:56 | `revisor-geral` | 1 | APROVADO | a60af46435cff826f |
| 2026-10-18 21:39:58 | 2026-10-18 21:44:46 | `frontend-reviewer` | 1 | APROVADO | a1bd088189562ca43 |
| 2026-10-18 22:35:25 | 2026-10-18 22:36:02 | `revisor-geral` | 2 | APROVADO | a3daebdf5b46ae03f |
| 2026-10-18 22:35:51 | 2026-10-18 22:36:35 | `frontend-reviewer` | 2 | APROVADO | a3ac371a37d61d5ba |
| 2026-10-18 22:35:16 | 2026-10-18 22:36:36 | `test-engineer` | 2 | APROVADO | a6000862aa67aa7dd |
| 2026-10-18 22:35:38 | 2026-10-18 22:38:21 | `conformidade-reviewer` | 2 | APROVADO | a1c8b1125d4ee79a8 |
