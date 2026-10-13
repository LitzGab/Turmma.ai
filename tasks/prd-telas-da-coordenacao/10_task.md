# Tarefa 10.0 — Registros › IA: os números, a tabela com filtro por estado e o consumo

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 4.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A aba IA de Registros mostra o que a IA gerou e se uma pessoa aprovou, como no mockup no que o produto tem: os quatro números, a tabela com o filtro por estado e o consumo do mês por função ao lado.

## Contexto necessário

- `techspec.md` seções 4, 5 (`?estado=`), 9 ("Registros › IA") e 12; `prd.md` RF18, RF22, RF23 e seção 6, pontos 2 e 3
- `mockup.md` seção 5.1: só a composição. As colunas "Turma" e "Aprovado por", a busca e o painel do registro **não entram**
- `.claude/rules/70-conformidade-cne.md` itens 6, 8 e 9
- Código: `apps/web/src/areas/coordenacao/Governanca.tsx` e `textos-da-governanca.ts` (os textos não mudam); `apps/web/src/api/governanca.ts`; `packages/shared/src/governanca/governanca.ts` (`esquemaConsultaResumoDaGovernanca`, só para ler)

## Subtarefas

- [ ] 10.1 — Os quatro `NumeroPainel`, com os rótulos e os textos de apoio de hoje, e o link "Como cada IA trabalha" (`/coordenacao/agentes`)
- [ ] 10.2 — `Segmentado` "Estado": "Todos", "Esperando o professor", "Aprovados" e "Rejeitados", no endereço (`?estado=`). A consulta passa a aceitar o estado, que entra na chave; os números são sempre os da escola inteira
- [ ] 10.3 — A tabela "O que a IA gerou e quem aprovou", com as cinco colunas de hoje, `LinhaAprovacao` na decisão, "Carregar mais" e a frase de hoje sobre por que não há turma nem quem decidiu. A linha não é clicável
- [ ] 10.4 — "Consumo do mês por função" ao lado da tabela a partir de 1024 px, e embaixo dela no celular, com as barras neutras e os textos de hoje
- [ ] 10.5 — Os vazios de hoje ("A IA ainda não gerou nada nesta escola", "Nenhuma linha para mostrar ainda", "Nenhuma função trabalhou neste mês") e o do filtro que não acha nada
- [ ] 10.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/Governanca.tsx`, `apps/web/src/api/governanca.ts` | alterado |
| `apps/web/src/areas/coordenacao/textos-da-governanca.ts`, `apps/web/src/areas/coordenacao/textos-da-governanca.test.ts` | alterado |
| `apps/web/src/areas/coordenacao/Governanca.test.tsx` | novo |
| `e2e/governanca.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| estados da tela | componente | carregando; erro com "Tentar de novo"; os dois vazios da tabela, só com a leitura terminada; o do filtro; com dado; a falha de "Carregar mais" não apaga o que já foi lido |
| sem professor nem turma | componente | a tabela não tem coluna, filtro nem ordem por professor ou por turma, e a tela não manda esses campos à API |
| o filtro | componente | a rede falsa devolve números diferentes com `?estado=`; escolher "Aprovados" chama `resumo?estado=aprovada` e a tela mantém os quatro números do resumo sem filtro. Mutação: usar os números da resposta filtrada deixa o teste vermelho |
| o filtro no servidor | e2e | com `montarEscolaComEntregas`, `estado` filtra a lista e os números ficam (`governanca.controller.ts`; repository) |
| a governança de hoje | e2e | o caso `a coordenação abre em Governança…`, pelo lugar Registros: `[data-aprovacao]` com a espera e a decisão, o consumo em tokens, nenhum nome de professor na página |
| série com um professor só | e2e | a entrega conta nos números e não entra na lista, como hoje |
| recomeço: segunda pessoa; o filtro pelo endereço; resposta atrasada ao trocar de filtro | e2e | nada da escola anterior; a resposta do filtro antigo não cai na lista do novo. Sem diálogo, o quarto caso não se aplica |
| 1366 × 768 e 360 px | e2e | a página não rola e a tabela rola dentro; no celular vira lista, sem rolagem de lado |

## Como testar

- `e2e/governanca.spec.ts › a coordenação abre em Governança…` e `› os quatro estados…`; `montarEscolaComEntregas`, de `e2e/__fixtures__/governanca.ts`
- `textos-da-governanca.test.ts` já prova os textos: acrescente só os rótulos do filtro
- Resposta atrasada: segure a primeira com `page.route` e troque o filtro
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/Governanca.test.tsx`; `node tools/ci/e2e.ts --manter-ambiente e2e/governanca.spec.ts`
- A premissa do filtro foi verificada no código (`techspec.md` seção 12); se o e2e do servidor falhar, pare e avise
- Rode `EXPLAIN` da consulta com `?estado=rejeitada` numa escola com volume e anote o resultado na tarefa
- O roteiro lê os quatro números pelo rótulo: eles não mudam, e o roteiro não é tocado
- Telas: `coordenacao`, `/coordenacao/governanca`; também com `--vazia`; mockup `/coordenacao/registros?aba=ia`

## Fora do escopo desta tarefa

O painel de cada registro, "Por série", a busca, as colunas "Turma" e "Aprovado por"; "Como cada IA trabalha" (11.0); o dado nominal, que já foi para o Analista (4.0).

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

