# Tarefa 4.0 — O Analista numa página de leitura, com o dado nominal

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`, `privacy-guardian`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A página do Analista fica como no mockup no que o produto tem: assinada por ele, com o resumo gerado a pedido, os alertas como hipótese e o acerto por série e disciplina. O pedido de dado nominal de uma turma passa a morar aqui.

## Contexto necessário

- `techspec.md` seções 7b e 9 ("Analista"); `prd.md` RF8, RF9, RF22 e seção 6, pontos 2 a 5
- `mockup.md` seções 2 e 16(c): só a barra do topo, a largura de leitura e o vazio. **Não é conversa**
- `.claude/rules/70-conformidade-cne.md` itens 2, 7 e 8; `20-lgpd-menores.md` item 10
- Código: `apps/web/src/areas/coordenacao/Analista.tsx` e `DadoNominal.tsx` (os textos e a ordem aviso, turma, finalidade não mudam); `Governanca.tsx` (de onde o `DadoNominal` sai)

## Subtarefas

- [ ] 4.1 — `Tela` de largura `leitura`, título "Analista"; `AssinaturaIA` do Analista no topo, com o selo "IA"; "Gerar resumo" como a ação da tela; o período e a hora do resumo numa linha
- [ ] 4.2 — O miolo de hoje nas peças da X1: quatro `NumeroPainel`; "Alertas", cada um com o selo "Hipótese" em texto e as hipóteses da lista fechada; "Acerto por série e disciplina" com `BarraRotulada`; "Recortes sem número"
- [ ] 4.3 — O vazio "Nenhum resumo gerado ainda" com a ação de gerar; `AvisoFila` na demora e na falha, como hoje
- [ ] 4.4 — `DadoNominal` sai da Governança e entra no fim da página, com o botão oficial "Abrir dado nominal de uma turma". Reabrir pede a finalidade de novo; a leitura não fica guardada
- [ ] 4.5 — Nenhum campo de texto, anexo, pergunta pronta, "Relatório" nem "Baixar" na página
- [ ] 4.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/Analista.tsx`, `apps/web/src/areas/coordenacao/DadoNominal.tsx`, `apps/web/src/areas/coordenacao/Governanca.tsx` | alterado |
| `apps/web/src/areas/coordenacao/Analista.test.tsx` | novo |
| `e2e/analista.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| estados da tela | componente | carregando; erro com "Tentar de novo"; vazio com "Gerar resumo"; com dado; os três vazios de dentro só com a leitura terminada; o foco depois de gerar |
| não é conversa | componente | a página não tem `textbox`, campo de arquivo nem link de baixar |
| regra dos dois professores | e2e | o caso de hoje: o recorte de um professor só aparece sem número, e o alerta é hipótese com contexto |
| o nominal | e2e | o caso de hoje, pelo Analista: o aviso antes, turma e finalidade obrigatórias, uma auditoria por leitura; **abrir duas vezes grava duas** |
| o Analista assinado | e2e | `[data-agente]` com o nome da função e `[data-selo-ia]` no mesmo bloco; 360 px; axe |
| recomeço: segunda pessoa; mesma entrada (gerar de novo com o pedido no ar); resposta atrasada; falha com o diálogo aberto | e2e | o resumo e o nominal da anterior não aparecem; um pedido só no ar; o aviso da tentativa anterior sai ao reabrir |

## Como testar

- `e2e/analista.spec.ts › gera o resumo…` e `› o pedido de dado nominal avisa da auditoria antes…` (vieram de `governanca.spec.ts` na 3.0): muda só o caminho até o botão
- `auditoriasNoBanco`, de `e2e/__fixtures__/governanca.ts`, conta as leituras nominais
- No roteiro, muda só o passo do nominal: ele deixa de voltar à Governança
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/Analista.test.tsx`; `node tools/ci/e2e.ts --manter-ambiente e2e/analista.spec.ts`
- Telas: `coordenacao`, `/coordenacao/analista`; também com `--vazia`; mockup `/coordenacao/analista`

## Fora do escopo desta tarefa

O Analista em conversa (F12); a tabela da IA, que continua na Governança (10.0); qualquer recomendação sobre aluno ou número por professor.

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

