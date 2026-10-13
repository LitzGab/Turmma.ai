# Tarefa 9.0 — Turmas: os cartões e "Confirme sua turma"

**Funcionalidade:** telas-do-professor · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Turmas mostra, antes dos cartões, uma faixa "Confirme sua turma" para cada vínculo que espera a professora, com confirmar
e contestar. A contestação abre num painel ao lado. Cada cartão diz o que espera naquela turma.

## Contexto necessário

- `techspec.md` seções 5 (a fila), 7 e 9 (Turmas: grade, faixa, cartões, contestação no `PainelLado`); `prd.md` RF14,
  RF22 e a seção 7 (duas disciplinas na mesma turma); `mockup.md` 4.1 e 13.3 (d)
- Regras 10 e 20: o complemento da contestação é texto livre, e a tela avisa para não escrever nome de aluno; D3 e
  regra 60, item 8a: a professora só confirma
- Código: `Turmas.tsx` (`ContestacaoEmAndamento`, `FormularioDeContestacao`); `api/vinculos.ts`; `fila-do-professor.ts`
  e `consultaContagemDePedidos` (da 1.0)

## Subtarefas

- [ ] 9.1 — `Turmas.tsx`: o `h1` "Turmas" visível; a faixa de cada vínculo em decisão, com a região "Confirme suas
  turmas", o texto "Confirme sua turma · 7ºA · Matemática" e os botões "Confirmar" e "Contestar"; a grade de cartões
  em "Suas turmas" (um por turma e disciplina), cada um com ladrilho, nome, série e o estado em texto. O que espera
  vem da fila do sino (as mesmas consultas, nenhuma leitura a mais): "N esperando você". A turma que o sino não leu
  (falha, recusa ou além das 12) diz "não lida", nunca "em dia". Só o vínculo confirmado abre a turma
- [ ] 9.2 — A contestação no `PainelLado` (folha de baixo a 360 px): o motivo em lista fechada, o complemento com o aviso
  de não escrever sobre aluno e o efeito escrito antes de enviar. O texto fica no estado da página, como hoje
- [ ] 9.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/Turmas.tsx` | alterado |
| `apps/web/src/areas/professor/Turmas.test.tsx` | novo |
| `e2e/professor-turmas.spec.ts` | novo |
| `e2e/escola-e-vinculos.spec.ts` (`vínculos do professor`), `e2e/areas.spec.ts` (`W4: os estados de "Turmas"`) | alterado |

A 9.0 e a 5.0 não correm juntas: as duas editam `e2e/areas.spec.ts`.

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| estados | componente | carregando; erro com "Tentar de novo"; vazio ("A coordenação ainda não alocou você"); só pendente; com confirmadas |
| confirmar | componente e e2e | a faixa some e o cartão aparece em "Suas turmas"; dois cliques mandam uma decisão só; o cartão pendente e o contestado não têm "Abrir a turma" |
| duas disciplinas na mesma turma | componente | dois cartões, cada um com o seu estado; confirmar um não muda o outro |
| contestar | componente e e2e | sem motivo não envia; o aviso de não escrever nome de aluno e o efeito aparecem antes do envio; o contestado sai da faixa e não conta para o sino |
| o texto sobrevive | componente | a lista relida (`invalidateQueries`) com o painel aberto não apaga motivo nem complemento; Esc fecha e devolve o foco ao botão "Contestar" |
| o que espera | componente | o selo "N esperando você" soma entrega, versão adaptada e pedidos de nome da turma, e a conta de chamadas é a do sino (nenhuma a mais); leitura parcial e turma além das 12 mostram "não lida", nunca "em dia". Mutação: mostrar "em dia" na turma não lida. Os dois cartões da mesma turma abrem a mesma turma |
| recomeço | e2e | a segunda pessoa na mesma aba não vê painel nem texto; a sessão vencida com o painel aberto volta com o texto; trocar de escola esvazia a lista. Log: o complemento nunca vai a log nem ao endereço (privacy-guardian). O "Texto da pessoa" sai junto quando entra outra pessoa |
| 360 px | e2e | o painel vira folha de baixo, sem rolar de lado; a faixa quebra; alvos de 44 px |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`)
- e2e: `vínculos do professor` (4 casos) em `escola-e-vinculos.spec.ts` e `W4: os estados de "Turmas"` em
  `areas.spec.ts`. Muda o painel da contestação (o formulário sai do cartão); motivo, efeito e envio único ficam
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/Turmas.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-turmas.spec.ts e2e/escola-e-vinculos.spec.ts`
- Telas: `professora`, `/professor/turmas`, `--clicar 'role=button[name="Contestar"]'`. Mockup: `/professor/turmas`

## Fora do escopo desta tarefa

A aba Semana, "Começar aula", o acerto da turma, a próxima aula e o uso do Tutor no cartão (F6, F8, F10); "Não é minha"
no lugar de "Contestar" (o nome do botão é contrato do e2e); o convite depois de confirmar (13.0).

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
