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

- [x] 4.1 — `Tela` de largura `leitura`, título "Analista"; `AssinaturaIA` do Analista no topo, com o selo "IA"; "Gerar resumo" como a ação da tela; o período e a hora do resumo numa linha
- [x] 4.2 — O miolo de hoje nas peças da X1: quatro `NumeroPainel`; "Alertas", cada um com o selo "Hipótese" em texto e as hipóteses da lista fechada; "Acerto por série e disciplina" com `BarraRotulada`; "Recortes sem número"
- [x] 4.3 — O vazio "Nenhum resumo gerado ainda" com a ação de gerar; `AvisoFila` na demora e na falha, como hoje
- [x] 4.4 — `DadoNominal` sai da Governança e entra no fim da página, com o botão oficial "Abrir dado nominal de uma turma". Reabrir pede a finalidade de novo; a leitura não fica guardada
- [x] 4.5 — Nenhum campo de texto, anexo, pergunta pronta, "Relatório" nem "Baixar" na página
- [x] 4.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/Analista.tsx`, `apps/web/src/areas/coordenacao/DadoNominal.tsx`, `apps/web/src/areas/coordenacao/Governanca.tsx` | alterado |
| `apps/web/src/areas/coordenacao/Analista.test.tsx` | novo |
| `apps/web/src/componentes/estado/EstadoVazio.tsx`, `apps/web/src/componentes/estado/estados.test.tsx` | alterado: a ação do vazio ganha `desligada`, para o botão do vazio parar enquanto o pedido está no ar |
| `e2e/analista.spec.ts`, `e2e/governanca.spec.ts` | alterado: o nominal sai da Governança (a asserção de que o botão estava lá passa a dizer que não está) |
| `e2e/roteiro-da-demonstracao.spec.ts` | sem alteração: o passo do nominal já ia pelo Analista desde a 3.0, e o `Gerar resumo` do vazio continua único |

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
| O "Gerar resumo" do alto some enquanto o resumo é `null`: o botão do vazio é o único da tela, e o `EstadoVazio` ganha `desligada` para ele parar com o pedido no ar | Subtarefas 4.1 ("a ação da tela") e 4.3 ("o vazio com a ação de gerar") juntas pedem um só botão primário por tela; com resumo, ou com a leitura falha, o botão volta ao alto | `techspec.md` §9 (Analista, frase acrescentada nesta tarefa), `prd.md` RF8 e RF22 (vazio com "Gerar resumo"); a funcionalidade não tem `cenarios.md`, e o documento da seção 11 não descreve o botão |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/areas/coordenacao/Analista.tsx
teste: apps/web/src/areas/coordenacao/Analista.test.tsx › vazio: "Nenhum resumo gerado ainda" com a ação de gerar
-  const acoes = semResumo ? undefined : (
+  const acoes = (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Analista.tsx
teste: apps/web/src/areas/coordenacao/Analista.test.tsx › gerar: o pedido sai uma vez
-  const semResumo = resumo.data !== undefined && resumo.data.resumo === null
+  const semResumo = resumo.data !== undefined && true
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Analista.tsx
teste: apps/web/src/areas/coordenacao/Analista.test.tsx › carregando: só o aviso de leitura
-  const semResumo = resumo.data !== undefined && resumo.data.resumo === null
+  const semResumo = resumo.data.resumo === null
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Analista.tsx
teste: apps/web/src/areas/coordenacao/Analista.test.tsx › gerar: o pedido sai uma vez
-            acao={{ rotulo: rotuloDeGerar, aoAcionar: gerar, desligada: gerando }}
+            acao={{ rotulo: rotuloDeGerar, aoAcionar: gerar }}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Analista.tsx
teste: apps/web/src/areas/coordenacao/Analista.test.tsx › com dado: assinatura do Analista
-    <Tela titulo="Analista" largura="leitura" acoes={acoes}>
+    <Tela titulo="Analista" acoes={acoes}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Analista.tsx
teste: apps/web/src/areas/coordenacao/Analista.test.tsx › com dado: assinatura do Analista
-                  <Estado familia="info">Hipótese</Estado>
```

```mutacao
arquivo: apps/web/src/componentes/estado/EstadoVazio.tsx
teste: apps/web/src/componentes/estado/estados.test.tsx › com a ação desligada o botão não aciona
-          <Botao onClick={acao.aoAcionar} disabled={acao.desligada === true}>
+          <Botao onClick={acao.aoAcionar}>
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | Esconder o "Gerar resumo" do alto também enquanto `resumo.isPending`: hoje ele aparece, um toque durante a leitura já gera, e ele some quando o vazio chega (salto de layout) | `TODO.md`. Muda comportamento, e o comentário de `Analista.test.tsx` diz que o botão no alto durante a carga é intencional. Vale o mesmo para revisor-geral (1ª), que apontou o mesmo ponto |
| revisor-geral (1ª) | Mutação 3 com `&& true` é difícil de ler | Recusada: a mutação foi provada pelo portão (vermelho); reescrevê-la muda o que ele prova |
| privacy-guardian (1ª) | Mínimo de alunos por recorte (hoje "2 alunos" mostra 75%, perto do individual; a regra pede dois professores) | `TODO.md`, junto da decisão em aberto dos indicadores de desempenho, antes do piloto com dado real. Já existia antes da tarefa |
| privacy-guardian (1ª), conformidade-reviewer (1ª) | A foto `Gerar-resumo--computador-2.png` saiu em branco | Recusada: é faixa em branco da captura de página inteira, o estado com resumo está em `Gerar-resumo--computador-1.png`. Não é defeito da tela |
| conformidade-reviewer (1ª) | Rotular a linha "Resumo gerado em…" como do Analista, para o rótulo de IA aparecer no celular sem o topo à vista | `TODO.md`: muda texto de tela; levar ao `/validar` |
| conformidade-reviewer (1ª) | "conta como nominal" no selo do recorte sem número é jargão | `/validar`: o texto é de antes da tarefa (os textos da tela não mudam, subtarefa 4.4) |
| frontend-reviewer (1ª) | "Verificando…" do vazio nunca aparece; "Ainda não escolhida" no diálogo | Sem ação: o revisor registrou como fato e como correto |
| test-engineer (1ª) | `dblclick` no botão ainda ligado, em vez de clicar no desligado | `TODO.md`: teste novo, mais que as poucas linhas |
| test-engineer (1ª) | Falha do pedido saindo do vazio (função suspensa, limite de pedidos): `AvisoFila` e botão do vazio volta ligado, sem dois primários | `TODO.md`: teste novo, mais que as poucas linhas; tarefa futura que toque `Analista.tsx` |
| test-engineer (1ª) | A mutação 3 fica vermelha por `TypeError`, e `resumo.data?.resumo == null` esconderia o botão do alto na carga sem teste perceber | `TODO.md`, junto do primeiro ponto desta tabela |
| test-engineer (2ª) | A espera de 20 s quando a aba aborta o pedido: avisar no próprio `route` se o `fulfill` falhou e esperar o anúncio ou esse aviso, o que chegar primeiro | `TODO.md` (entrada "a espera de 20 s do recomeço"). A anotação do caminho foi aplicada |
| test-engineer (2ª) | Registrar qual caminho aconteceu, com um booleano no `catch` do `fulfill` | Aplicada: `entregaAbortada` e a anotação `resposta atrasada` |
| revisor-geral (3ª), test-engineer (3ª) | Quando a anotação `resposta atrasada` diz "sem anúncio no prazo", a resposta nem chegou à aba nem foi abortada, e o teste passa sem ter provado nada: fazer esse caminho falhar, ou ao menos avisar | `TODO.md`, na entrada "a espera de 20 s do recomeço" (telas da coordenação, 4.0), que já trata desse trecho do e2e. Muda o comportamento do teste e pede decisão sobre o que fazer quando o aborto e o anúncio faltam |

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
| 2026-10-16 22:51:18 | 2026-10-16 22:52:02 | `privacy-guardian` | 1 | APROVADO | a91bbc51f97a6fa98 |
| 2026-10-16 22:51:12 | 2026-10-16 22:52:05 | `frontend-reviewer` | 1 | APROVADO | ae9e13440747b0122 |
| 2026-10-16 22:51:15 | 2026-10-16 22:52:06 | `conformidade-reviewer` | 1 | APROVADO | ae64852d56aef9c78 |
| 2026-10-16 22:51:24 | 2026-10-16 22:52:45 | `revisor-geral` | 1 | APROVADO | a57ddbd718af3e6fe |
| 2026-10-16 22:51:21 | 2026-10-16 22:53:16 | `test-engineer` | 1 | APROVADO | a3e49b8c09491320f |
| 2026-10-16 23:04:01 | 2026-10-16 23:04:41 | `test-engineer` | 2 | APROVADO | a65de2ad59d98e34e |
| 2026-10-16 23:04:07 | 2026-10-16 23:05:01 | `revisor-geral` | 2 | REPROVADO | ae344f89590c8857c |
| 2026-10-16 23:33:26 | 2026-10-16 23:33:48 | `revisor-geral` | 3 | APROVADO | a93533a0917fc1ba2 |
| 2026-10-16 23:33:20 | 2026-10-16 23:34:11 | `test-engineer` | 3 | APROVADO | a0e3dac13cb99eceb |
