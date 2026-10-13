# Tarefa 3.0 — A coordenação navega por quatro lugares e abre no Painel

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A lateral e a barra de baixo passam a ter Painel, Analista, Escola e Registros; Escola e Registros mostram as telas de hoje em abas, nos mesmos endereços; e quem entra chega ao Painel.

## Contexto necessário

- `techspec.md` seções 5 (endereços), 7c ("Bundle"), 9 ("Molduras", "Altura", "Nomes que não mudam") e 10; `prd.md` RF1, RF2, RF3, RF10, RF17
- `mockup.md` seções 0, 3 e 5 (os cabeçalhos); `e2e/__fixtures__/casca.ts`

## Subtarefas

- [ ] 3.1 — `navegacao.ts`: os quatro lugares, com `tambemEm` e ícone; `Inicio.tsx` leva ao Painel
- [ ] 3.2 — As molduras `Escola` (Turmas, Professores, Material) e `Registros` (IA, Pedidos, Privacidade)
- [ ] 3.3 — `rotas.tsx`: cada rota na moldura dela; `Estrutura`, `ListaDaTurma` e `Professores` por `lazy()`; as telas de dentro sem `Tela`; "‹ Escola" na lista da turma e "‹ Registros" em `Agentes`
- [ ] 3.4 — `Privacidade.tsx`: as três abas que sobram viram `Segmentado` ("Prazos de guarda", "Empresas", "Incidentes"), nos mesmos endereços
- [ ] 3.5 — `e2e/__fixtures__/coordenacao.ts`: `irPelaCoordenacao` e `paginaNaoRola`. Em `casca.ts`, onde a coordenação abre muda **num lugar só**: o corpo de `esperarGovernanca`, que passa a se chamar `esperarPainel`, e o `toHaveURL` de `entrarComoCoordenacaoNaMesmaAba`
- [ ] 3.6 — Nos specs, troca mecânica: `irPelaNavegacao` dos sete itens por `irPelaCoordenacao`, o nome da fixture, o `h1` e o `toHaveTitle`. **Nenhuma outra asserção muda**
- [ ] 3.7 — Mover sem editar: de `estrutura.spec.ts`, a lista para `lista-da-turma.spec.ts` e a alocação para `alocacao.spec.ts`; de `governanca.spec.ts`, Agentes para `agentes.spec.ts`, e o Analista e o nominal para `analista.spec.ts`
- [ ] 3.8 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/navegacao.ts`, `apps/web/src/areas/navegacao.test.ts`, `apps/web/src/paginas/Inicio.tsx` | alterado |
| `apps/web/src/areas/coordenacao/Escola.tsx`, `apps/web/src/areas/coordenacao/Registros.tsx`, `apps/web/src/areas/coordenacao/molduras.test.tsx` | novo |
| `apps/web/src/areas/coordenacao/rotas.tsx`, `apps/web/src/areas/coordenacao/Estrutura.tsx`, `apps/web/src/areas/coordenacao/ListaDaTurma.tsx`, `apps/web/src/areas/coordenacao/Professores.tsx`, `apps/web/src/areas/coordenacao/Material.tsx` | alterado |
| `apps/web/src/areas/coordenacao/Governanca.tsx`, `apps/web/src/areas/coordenacao/Agentes.tsx`, `apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx` | alterado |
| `apps/web/src/componentes/icones/lugares.tsx`, `apps/web/nome-dos-chunks.test.ts` | alterado |
| `e2e/__fixtures__/coordenacao.ts`, `e2e/lista-da-turma.spec.ts`, `e2e/alocacao.spec.ts`, `e2e/agentes.spec.ts`, `e2e/analista.spec.ts` | novo |
| `e2e/__fixtures__/casca.ts`, `e2e/__fixtures__/fluxo-do-professor.ts`, `e2e/__fixtures__/pedidos-do-titular.ts` | alterado |
| `e2e/areas.spec.ts`, `e2e/estrutura.spec.ts`, `e2e/governanca.spec.ts`, `e2e/professores.spec.ts`, `e2e/material.spec.ts`, `e2e/privacidade.spec.ts`, `e2e/incidentes.spec.ts`, `e2e/pedidos.spec.ts` | alterado |
| `e2e/pedidos-do-titular.spec.ts`, `e2e/pedido-do-titular.spec.ts`, `e2e/escola-montada.spec.ts`, `e2e/escola-e-vinculos.spec.ts`, `e2e/mfa.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| os lugares | unidade | quatro itens, na ordem; cada endereço de hoje acende o lugar dele |
| estados da tela: as molduras | componente | a aba do endereço é a selecionada; trocar navega; um `h1` só |
| W2, onde abre e os cliques | e2e | a lista de `areas.spec.ts`; a 360 px, os quatro na barra de baixo; entra em `/coordenacao/painel`; cada tela a até dois cliques, Empresas e Incidentes a três |
| recomeço: segunda pessoa; troca de escola | e2e | os casos de hoje, sem perder asserção |

## Como testar

- Moldes: `e2e/areas.spec.ts › W2` (`ITENS_DA_COORDENACAO`) e `apps/web/src/areas/navegacao.test.ts`
- Caso movido: `git diff --color-moved` mostra que o corpo não mudou
- Rodar: `node tools/ci/e2e.ts --manter-ambiente e2e/areas.spec.ts`, e cada spec tocado, um por vez
- Telas: `coordenacao`, `/coordenacao/painel`, `/coordenacao/estrutura`, `/coordenacao/governanca`, `/coordenacao/privacidade/retencao`; mockup `/coordenacao/escola`, `/coordenacao/registros`

## Fora do escopo desta tarefa

Recompor o miolo das telas (4.0 a 13.0).

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

