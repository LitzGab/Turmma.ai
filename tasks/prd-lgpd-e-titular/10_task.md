# Tarefa 10.0 — A coordenação vê o aviso de incidente e confirma o recebimento

**Funcionalidade:** lgpd-e-titular · **Depende de:** 6.0, 9.0 · **Paralelo com:** 11.0 a 15.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A casca da coordenação mostra o diálogo do incidente pendente, com "Ver depois" e faixa fixa, e a aba Incidentes lista e confirma.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seção 9 ("Aviso de incidente")
- `docs/interface.md` 11.1 (Sair a um toque)
- D59
- Código: a casca da coordenação e o `DialogoDeConfirmacao` da A1
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [ ] 10.1 — Diálogo na casca, uma leitura por sessão
- [ ] 10.2 — Faixa fixa até a confirmação
- [ ] 10.3 — Aba Incidentes
- [ ] 10.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| casca e componentes de incidente na web | novo/alterado |
| aba Incidentes | novo |
| e2e | novo |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| teclado e 360 px | e2e | confirma só com teclado; rolagem dentro do diálogo; Sair alcançável |
| Ver depois | e2e | deixa a faixa; novo login traz o diálogo de volta |
| duas coordenadoras | e2e | confirmado por uma, some para a outra |
| dois incidentes | e2e | os dois pendentes aparecem |
| estados | e2e | quatro estados da aba, `chromebook` e `celular`, acessibilidade |

## Como testar

- **teclado e 360 px:** `e2e/pedidos.spec.ts › sem rolagem horizontal, também no diálogo…` (`larguraExcedenteDoDialogo`, `focoVisivel`); o Sair em `e2e/casca.spec.ts › W12: abaixo de 768 px, a barra do topo com o "Sair" a um toque…`.
- **Ver depois:** sair e entrar como em `e2e/privacidade.spec.ts › a segunda pessoa na mesma aba…`. Armadilha da 6.0: `entrarComoCoordenacaoNaMesmaAba` já gasta dois passos do segundo fator; o login seguinte só aceita o código depois da virada de 30 s, como em `› a troca de escola não mostra a retenção da escola anterior…` (`codigoDoAutenticador`).
- **duas coordenadoras:** `criarCoordenadoraNaEscola` (`e2e/__fixtures__/sessao.ts`) e a função local `outroNavegador`, de `e2e/escola-montada.spec.ts`.
- **estados:** `e2e/governanca.spec.ts › os quatro estados…` (`portao`, `page.route`, `violacoesGraves`).
- Semeie o incidente no banco, como `ajustarRetencaoDaEscola`. Dois incidentes: sem precedente.
- Rodar: `node tools/ci/e2e.ts --manter-ambiente e2e/<arquivo>.spec.ts`; depois, `npx playwright test e2e/<arquivo>.spec.ts`.

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --e2e)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O registro do incidente (9.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
