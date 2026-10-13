# Tarefa 10.0 — As peças da conversa com IA na pele nova

**Funcionalidade:** pele-e-casca · **Depende de:** 3.0, 8.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

As dez peças de `componentes/ia/` aparecem com borda de 2 px e degrau onde se aperta, nos dois temas, e as garantias
de que a conversa não induz continuam provadas com a cor nova.

## Contexto necessário

- `techspec.md` 9 (**Tokens**, **Foco**, **Degrau**, **Peças revestidas**) e 10
- `prd.md` RF5, RF6, RF8, RF9, RF11; `cenarios.md`, parte A: A29 a A35, A47, A51, A81, A100; A53, A55, A57 e A59 conferem
- `docs/interface.md` 9.5 (regras 3 e 4: nada em laço) e 10.2 (**Marcar e informar**)
- `.claude/rules/70-conformidade-cne.md`, itens 3 e 4b; D18, D36, D59
- Código: `componentes/ia/` e o `README.md` dela; `Escolha.tsx` (`CLASSES_DA_OPCAO`, uma constante para as duas);
  `Mensagem.tsx` (`Pensando` é só texto); `CaixaPedido.tsx` ("Parar" é `secundario`)

## Subtarefas

- [ ] 10.1 — Revestir **sem mudar props, texto nem ordem de foco**: `CaixaPedido` (canto 16, borda 2; "Enviar" primário de
  44 px; "Parar" continua `secundario`, e não oficial), `Mensagem` (a pessoa em bolha, a IA sem), `ChipFonte` e `Fontes`
  (pílula de 28 px, "da web" tracejado), `MotorFormulario` (gerar primário, cancelar `secundario`, mesma altura),
  `AvisoFila`, `LinhaAprovacao` (continua o `Estado`, sem desenho próprio), `PaginaMini` e `TextoDaIA`
- [ ] 10.2 — `Escolha`: as duas opções com **uma** constante só, borda 2 e `degrau-borda`, nenhuma laranja nem grafite, nenhuma com o
  foco ao abrir. `Pensando` e o aviso de demora seguem sem laço e sem pulso
- [ ] 10.3 — `galeria/secoes/ia.tsx`: cada peça nos estados de hoje
- [ ] 10.4 — Testes (tabela abaixo)

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/ia/CaixaPedido.tsx`, `Mensagem.tsx`, `Escolha.tsx`, `ChipFonte.tsx`, `Fontes.tsx` | alterados |
| `apps/web/src/componentes/ia/MotorFormulario.tsx`, `AvisoFila.tsx`, `LinhaAprovacao.tsx`, `PaginaMini.tsx`, `TextoDaIA.tsx` | alterados |
| `apps/web/src/componentes/ia/Escolha.test.tsx`, `Mensagem.test.tsx`, `AvisoFila.test.tsx` | novos |
| `apps/web/src/galeria/secoes/ia.tsx` | alterado |
| `e2e/pecas-ia.spec.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| as duas opções são iguais | componente | as duas `button` da `Escolha` têm a mesma classe, nenhuma com a face `laranja` nem `grafite`; `desligada` desliga as duas juntas |
| as duas opções são iguais, na tela | e2e | mesma largura, altura, fundo, borda e peso, de 44 px ou mais; a lista proibida passa a `[laranja, grafite]` (A32, negativa) |
| "preparando a resposta" não se mexe | componente e e2e | `Pensando` sem classe de animação; `animationName` `none` em `[data-pensando]` (A51) |
| pausa, assunto delicado e faixa | e2e | `aluno-tutor` sem edição: a pausa sem `alert` e sem vermelho, o cartão sem animação, a faixa sem botão e presa (A55, A57, A59) |
| a aprovação diz quem e quando | e2e | A29 e A31 inalterados; a linha tem o desenho do selo de estado, nos três estados (A30) |
| enviar, parar, gerar, chip | e2e | "Enviar" laranja de 44 × 44, "Parar" com fundo `fundo`, "Gerar atividade" laranja e "Cancelar" da mesma altura, chip de 24 px ou mais (A33, A34, A35, A47) |
| o aviso de fila não mostra erro cru | componente | `falha` tem `alert` e "Tentar de novo"; `demora` tem `status`; nenhum código |
| texto como a tela mostra | e2e | as falas e a prévia continuam achadas pelo texto (A100) |
| axe e toque | e2e | seção sem violação grave nos dois temas; alvos de 44 px no `celular` |

## Como testar

- Componente a copiar: `componentes/pedidos/ListaDePedidos.test.tsx`
- e2e a copiar: `pecas-ia.spec.ts › a Escolha da D18…` (`desenho`, `caixa`) e o de `[data-pensando]`
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/ia`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/pecas-ia.spec.ts e2e/aluno-tutor.spec.ts e2e/professor-assistente.spec.ts`
- Armadilha: A30 cruza a 6.0, que reveste o `Estado`; a igualdade vale no commit de cada uma
- **Telas**: `/galeria` (IA), claro e escuro; `professora`, `/professor/nova-conversa` (pedir uma atividade);
  `aluno`, `/aluno/tutor`. Mockup: `/fundamentos` (Conversar com IA)

## Fora do escopo desta tarefa

Avatar e selo (8.0); `Estado`, `Faixa` e `Aviso` (6.0); texto novo do Tutor.

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
