# Retrospectiva — lgpd-e-titular (F3)

11/10/2026, pelo Arquiteto, no térreo, depois do pouso (`a36ae62`) e da esteira verde da `develop`
(execução 38120305349). Comparação com a retrospectiva da A1 (`tasks/prd-apresentacao-escola/retro.md`).

O F3 atravessou dois processos. As tarefas 1.0 a 4.0 rodaram na `develop`, com subagente e esteira por
commit. Da 5.0 em diante rodou no Maestri (D78), e o processo foi revisto oito vezes com a spec andando.
Por isso quase toda medida abaixo vem em dois trechos: **1.0 a 6.0** (a rodada parava na primeira
reprovação, portão inteiro por tarefa) e **7.0 a 20.0** (todos os revisores rodam mesmo com o
`test-engineer` reprovado, portão da tarefa em minutos).

## Medidas

```
Tarefas: 20 · Rodadas de revisor: 236 · Reprovações: 54 (22,9%), contando 2 AJUSTES NECESSÁRIOS do frontend-reviewer
  1.0 a 6.0:  76 rodadas, 9 reprovações (11,8%), 3,5 ciclos de revisão por tarefa
  7.0 a 20.0: 160 rodadas, 45 reprovações (28,1%), 2,4 ciclos de revisão por tarefa
Por revisor: test-engineer 55/22 · revisor-geral 48/16 · privacy-guardian 43/9 · tenancy-guardian 29/1
             infra-guardian 25/4 · conformidade-reviewer 14/0 · frontend-reviewer 14/2 · llm-integrator 8/0
Por modelo do implementador:
  subagente do processo anterior (1.0 a 4.0): 4 tarefas, 12 rodadas por tarefa, 6 reprovações, nenhum diagnóstico
  Haiku (6.0): mais de 5 h depurando um e2e com o portão inteiro; terminou em Sonnet, em 50 min
  Sonnet no processo de transição (5.0): 19 rodadas, 2 reprovações, 4 h 45, com quatro portões de 40 min
  Sonnet no processo revisto (7.0 a 10.0, 13.0 a 20.0): 12 tarefas, 11,2 rodadas por tarefa,
    36 reprovações (3,0 por tarefa), 4 diagnósticos do Arquiteto, mediana de 99 min (de 28 a 220)
  MiMo no opencode (11.0 e 12.0): 2 tarefas, 13 rodadas por tarefa, 9 reprovações (4,5 por tarefa),
    1 diagnóstico, 224 e 185 min
Rodadas por tarefa: média 11,8, pior 5.0 com 19
Rodadas que caducaram sem reprovação do próprio revisor: 81 de 236 (34%)
  - 35 depois de um lote de recomendações, sem reprovação no meio: 22 de 76 na 1.0 a 6.0 (29%),
    13 de 160 na 7.0 a 20.0 (8%)
  - 46 depois da reprovação de outro revisor
Correções fora de tarefa: 9 com commit, e 2 tentativas que terminaram em falha, sem commit
  - 3 por teste de plano intermitente (1a405d2, d44e951 e as duas falhas), 1 por npm audit (ee0215d),
    1 por teste do hook que dependia do papel da sessão (e89a4ec), 1 por decisão do Joaquim (69a68e4),
    1 pelas listas fechadas (9d2887f), 2 por dívida que a tarefa deixou (e13311f, b6f7c1d),
    1 pelo crítico da validação (99958a7)
Duração: 05/10 15:40 (1.0) → 11/10 04:10 (fechamento). No Maestri, da 5.0 à validação aprovada:
  08/10 20:16 → 11/10 03:26, 55 h de relógio para 16 tarefas e 9 correções
  Mediana do pedido ao commit, 16 tarefas no Maestri: 150 min. No processo revisto, em Sonnet: 99 min
Revisão da spec: 7 rodadas, 27 rodadas de revisor, 19 não aprovadas e 1 sem veredito
Ressalvas do /validar: rodada 1 REPROVADA, com 1 crítico, 2 maiores e 8 menores · rodada 2 APROVADA,
  sem crítico nem maior, com os menores m1 a m9 no TODO.md
```

Como contei: as linhas da tabela "Revisões" dos 20 `N_task.md` e dos documentos de correção de 06/10 a
11/10, escritas pelo hook. "Ciclo de revisão" é cada vez que o `test-engineer` abriu uma rodada no
documento. Caducada é a rodada de um revisor que já tinha aprovado na mesma tarefa. Tempo por tarefa é do
pedido ao commit, pelo `estado.md`. Custo é peso de API calculado das transcrições
(`~/.claude/medicao-educa/`), não é fatura.

| | A0b | A1 | F3 |
|---|---|---|---|
| Tarefas | 10 | 17 | 20 |
| Reprovações nas tarefas | 14,7% | 11,9% | 22,9% (11,8% até a 6.0; 28,1% depois) |
| Rodadas por tarefa | 7,5 | 11,4 | 11,8 |
| Caducadas sem reprovação | 24% | 48% | 34% |
| Revisão da spec, não aprovadas | 9 de 18 | 14 de 20 | 19 de 27 |
| Correções fora de tarefa | 7 | 6 | 9, e 2 falhas |
| Crítico ou maior no 1º /validar | 1 maior | 2 maiores | 1 crítico e 2 maiores |
| Tarefas sem nenhuma reprovação | — | — | 1 de 20 (a 20.0, a única pequena do trecho) |

A taxa de reprovação dobrou, e isso não é só piora. Desde 09/10 a rodada não para na primeira
reprovação: os outros revisores rodam com o `test-engineer` já reprovado, para a ordem de correção sair
com tudo de uma vez. O que caiu foi o número de ciclos, de 3,5 para 2,4 por tarefa, e é o ciclo que custa
tempo (de 25 a 45 minutos cada). A rodada em si é curta: mediana de 2,2 min no `test-engineer` e de 0,7 a
1,4 min nos outros.

O que não melhorou: **uma tarefa em vinte passou sem reprovação**, e o `/validar` achou um crítico que
nenhuma das 236 rodadas pediu.

### Consumo por papel, no Maestri (08/10 18 h a 11/10 04:45)

| Papel | Peso | Parte |
|---|---|---|
| Térreo sem papel: o Orquestrador e a sessão "Claude Code #2", que mexeu no processo | 662 | 48,9% |
| — dos quais, subagentes `general-purpose` chamados do térreo, que nenhum papel do time usa | 213 | 15,7% |
| Mesa de revisão, com os revisores que ela chama | 300 | 22,2% |
| — dos quais, revisores com veto, em Opus | 223 | 16,5% |
| Implementador | 281 | 20,8% |
| Arquiteto | 78 | 5,8% |
| Validador | 32 | 2,4% |

Metade do consumo do período não foi a spec: foi o térreo, e boa parte dele foi mudar o processo com a
spec andando (oito revisões da D78 e sete merges da `develop` na branch).

## As medidas que a D78 deixou para esta retrospectiva

**1. O Orquestrador depois da limpeza por tarefa.** Antes da limpeza (até a 13.0) ele custava de 7,5 a 11
por tarefa, com o contexto em 548 mil tokens. Depois, de 1,9 a 5,3, com o contexto entre 121 e 172 mil
(14.0: 2,3; 16.0: 3,1; 17.0: 2,9; 18.0: 4,2; 19.0: 5,3; 20.0: 1,9). O fim da spec custou 17, em oito
sessões. O `estado.md` não registra nada que ele tenha deixado de fazer por só ler o "Agora"; o que
apareceu foi ruído (o aviso de fim do `maestri ask` chegando à sessão limpa, três vezes). **Passar para
Sonnet: o número não sustenta.** Ele já é uns 8% do custo de uma tarefa, a troca pouparia perto de 2 por
tarefa, e o "O que decidi sem perguntar" tem mais de vinte decisões de julgamento, como conferir no
repositório o que o "Claude Code #2" pedia antes de fazer, e pedir o diagnóstico antes de repassar a
ordem da 19.0, que a Mesa queria direto.

**2. A vigia.** 100 turnos, 96 sem ação nenhuma (nem mensagem, nem menu, nem arquivo), ao custo de 36 dos
41 que ela consumiu. Das quatro que agiram, duas responderam ao pedido de permissão do `test-engineer`
na 13.0, que o `77b01bd` eliminou: depois dele a rodada mais longa do `test-engineer` foi de 6 minutos,
contra 56. **Sustenta o `--pre-run`** (proposta M3).

**3. O tamanho da tarefa.** A medida pedida, linhas do `N_task.md`, não serve: os vinte documentos
nasceram com 80 a 100 linhas, e os que passaram de 200 cresceram **por causa** das rodadas ("Mutações",
"Recomendações sem aplicar" e "Revisões"). É efeito, não causa. A previsão de arquivos também não: o
documento previa de 3 a 7 linhas de arquivo, as tarefas alteraram de 6 a 60, e 14 das 20 passaram da
mira de 15. O que separa as tarefas, e se conhece na criação, é o número de guardiões com veto:

| Guardiões com veto | Tarefas | Rodadas por tarefa | Foram à 3ª rodada com diagnóstico (7.0 a 20.0) |
|---|---|---|---|
| 4 | 4.0, 5.0, 11.0, 13.0, 15.0 | 16,2 | 3 de 3 (11.0, 13.0, 15.0) |
| 3 | 3.0, 9.0, 12.0, 14.0, 19.0 | 13,0 | 1 de 4 (19.0) |
| até 2 | as outras dez | 9,0 | 1 de 7 (18.0, e a causa foi a ordem da Mesa) |

As três de quatro guardiões juntavam vários comportamentos: a 11.0, sete (busca, prévia, registro, lista,
detalhe, concluir e corrigir nome); a 13.0 alterou 60 arquivos. A única que passou de primeira, a 20.0,
tinha uma tela e um ramo. **Sustenta um teto, por guardião e por comportamento** (proposta 4).

**4. O modelo dos revisores.** Os revisores com veto, em Opus, custaram 223, perto de 1 por rodada e de
12 a 19 por tarefa. Das 54 reprovações, 19 eram defeito de código que só a revisão viu (grupo G), e entre
as do `test-engineer` por "falta de prova" havia defeito escondido em pelo menos cinco: a pessoa
reativada que a rotina eliminaria (5.0), o nome de escola contido em outro (9.0), a busca sem letra
(11.0), o prazo do S3 que não existia (13.0) e a carga que não media o Tutor (19.0). O teste de 10/10,
repetindo doze revisões em Sonnet, deu o mesmo veredito em dez, por 40% a 50% do custo, com o Opus
elevando a bloqueante um ou dois itens a mais por revisão do `revisor-geral`. **Manter em Opus.** A
economia seria de 6 a 11 por tarefa, e o `/validar` ainda achou um crítico com todos em Opus. O
`tenancy-guardian` (1 reprovação em 29 rodadas) e o `conformidade-reviewer` (0 em 14) custaram 35 na spec
inteira; baixar o modelo deles pouparia perto de 1 por tarefa nas regras 10 e 70, que não se afrouxam por
retrospectiva. O corte que existe está nas rodadas que não precisavam acontecer: as do grupo D, e as do
grupo A.

**5. Passar de primeira.** Reprovaram na primeira rodada 17 de 29 revisores da 11.0 à 15.0 (59%) e 13 de
22 da 16.0 à 20.0 (59%); tirando a 20.0, pequena, 13 de 17. Das quatro tarefas grandes depois das três
conferências em texto, nenhuma passou de primeira, e na 16.0 a série de mutações do e2e rodou três vezes,
uns 20 minutos cada. **O texto não mexeu no número.** É a terceira vez que este grupo recebe texto (A0b,
A1 e a oitava revisão da D78) e ele segue o maior. Sustenta a conferência mecânica (proposta M1) e tirar
o texto que não funcionou (proposta 3).

**6. A parada que não segura a linha.** Não foi exercida: depois da regra (10/10 09:35) nenhuma parada
abriu com tarefa correndo. Antes dela, a linha ficou parada 3 h 10 pela tela "Login suspenso", que não
afetava a tarefa seguinte. Nenhum documento foi escrito no andar no meio de uma tarefa fora do que o
diagnóstico manda levar no commit dela. A regra fica sem prova.

**7. As listas fechadas e o portão da tarefa.** Quatro tarefas (11.0, 13.0, 14.0, 15.0) deixaram três
listas vermelhas, que ninguém viu por até quatro tarefas. Quem as achou não foi o portão completo: foram
as suítes inteiras rodadas à mão em `873a1ab`, com a linha parada. Depois do texto "Lista fechada"
(16.0 a 20.0), o portão completo passou verde nas duas vezes: **zero vermelho de tarefa anterior**. Pelo
critério da skill, não sustenta pôr a integração inteira no portão da tarefa: seriam 10 minutos a mais em
cada portão, umas 5 horas na spec, contra as duas corridas de 74 minutos que as listas custariam. O que
escapou do portão da tarefa até o fim foi outra coisa: o e2e que falha das 21 h à meia-noite (grupo B) e
o crítico da validação (grupo F). **Duas tarefas em paralelo** seguem dependendo de um ambiente de teste
por checkout (`PROJETO_TESTE` e as portas, em `tools/ci/compose.ts`); nada disso mudou no F3.

**O modo econômico (MiMo).** Duas tarefas. Tempo: 224 e 185 minutos, contra a mediana de 105 das tarefas
de Sonnet com três ou quatro guardiões (9.0, 13.0, 14.0, 15.0, 19.0); a primeira rodada só saiu com
2 h 39 e 2 h 24. Rodadas: 13 por tarefa contra 11,2. Consumo do Claude por tarefa: 35 e 26,9, contra 28 a
36 das vizinhas em Sonnet. Não caiu, porque revisão, diagnóstico e vigia crescem com o tempo da tarefa.
Não foi ligado desde 09/10. O papel é mantido em dobro (`.opencode/agents/implementador.md` espelha o do
Claude) e o protocolo, que todo agente lê em toda sessão, carrega um parágrafo sobre ele. **Recomendo
tirar** (proposta 9); é revisão da D78, e a decisão é do Joaquim.

## Grupos de causa

As 54 reprovações das tarefas, cada uma num grupo só.

| # | Causa | Reprovações | Tarefas | Onde evitar |
|---|---|---|---|---|
| A | Regra ou cláusula sem teste que falhe sem ela. Em cinco, a linha de "Mutações" afirmava um vermelho que não acontece (6.0, 15.0 duas vezes, 16.0, 17.0) | 17 | 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 11.0, 12.0 (×2), 13.0, 14.0, 15.0 (×3), 19.0 | portão da tarefa, por conferência mecânica |
| B | Teste ou código que depende do fuso do computador ou da hora do dia | 3, e 1 e2e vermelho das 21 h à meia-noite | 12.0, 16.0, 17.0; correção `b6f7c1d` | portão da tarefa, por conferência mecânica |
| C | Ordem de correção da Mesa que ditou regra, texto ou código de teste sem conferir, e criou a reprovação da rodada seguinte | 4, em 3 das 5 escaladas | 11.0 (×2), 18.0, 19.0 | `revisar-tarefa`, passo 5 |
| D | `revisor-geral` reprovando só pelo bloqueante do `test-engineer`, ou por ele ainda não ter aprovado | 3 | 15.0 (×2), 16.0 | texto do agente |
| E | Texto que diz à pessoa o que o dado não diz: rótulo, resumo ou prazo escrito pelo nome da categoria, sem conferir a consulta | 3, mais 1 correção (`e13311f`) e 1 item do `TODO.md` (o prazo do `registro_de_decisao`) | 18.0 (×3) | Tech Spec, seção 9 |
| F | Caso de borda da regra 40 que a tabela de testes não trazia. Três estão contados em A (pessoa reativada na 5.0, dois vínculos na virada do ano na 12.0, transferido com eliminação agendada na 14.0) | o crítico C1 da validação: sem ano letivo em curso, a aba Pedidos respondia 404 | 11.0, 16.0, 17.0 (C1) | revisão da spec |
| G | Defeito de código que só a revisão viu, um por tarefa, sem causa comum | 19 | 3.0, 4.0, 5.0, 9.0 (×2), 10.0, 11.0 (×3), 13.0 (×3), 14.0 (×2), 15.0, 16.0, 17.0 (×2), 19.0 | é para isso que a revisão existe |
| H | Documento atrás do código, ou subtarefa marcada sem ter sido feita | 4, mais os maiores M1 e M2 da validação | 7.0 (×2), 8.0, 19.0 | sem proposta: quatro causas diferentes |
| I | `test.skip` num e2e | 1 | 18.0 | lint |

**Grupo A.** Recebeu texto na A0b ("rode a mutação"), na A1 ("termo a termo") e na oitava revisão da D78
(três conferências antes da primeira rodada). Continua o maior, e a 15.0 escalou porque a seção foi
preenchida sem rodar. O `test-engineer` hoje refaz as mutações à mão, e é por isso que ele roda sozinho e
primeiro.

**Grupo C.** Cada uma custou um diagnóstico do Arquiteto (de 4 a 9 minutos) e um ciclo. Na 11.0 a ordem
criou uma regra com quatro comparações e pediu teste de uma. Na 18.0 ditou doze rótulos de tela sem
conferi-los contra a contagem da API, e o texto que propôs na segunda ordem ainda era falso para o aluno.
Na 19.0 mandou um caso de teste ler variável preenchida por outro, com uma "Prova" que não se cumpria. A
regra "não acrescente exigência sua" já está na skill.

**Grupo D.** Na 15.0, rodadas 1 e 2, e na 16.0, o único bloqueante do `revisor-geral` foi o do
`test-engineer`, com a frase "a tarefa segue sem a aprovação dele". O texto do agente ainda diz que o
`test-engineer` "já aprovou antes de você", o que deixou de ser verdade em 09/10.

**Grupo F.** O Validador achou o C1 em 14 minutos, pondo o ano da escola em `encerrado`. Custou uma
correção, outro portão completo e outra validação: 2 h 07 no fim da spec.

**Grupo H.** O que repetia a A1 (divergência só no `N_task.md`) caiu de quatro para uma (8.0). As outras
são o `docs/lgpd.md` sem a linha nova (7.0), o `.env.example` contra a Tech Spec (7.0), a subtarefa 19.1
marcada sem ter sido feita, o roadmap anterior ao recorte (M1) e a lateral sem grupo (M2).

**Falsos positivos.** Só os três do grupo D. As outras reprovações eram reais.

## O que funcionou

- O portão da tarefa: a 7.0 fechou em 28 minutos, contra 4 h 45 da 5.0 com o portão inteiro.
- Recomendação em ordem uma vez por documento: as rodadas de lote caíram de 29% para 8%.
- A seção "Como testar": depois da 6.0, nenhuma tarefa ficou presa procurando como escrever o teste.
- O diagnóstico do Arquiteto na segunda reprovação: cinco escaladas, nenhuma virou parada do Joaquim, e
  aplicar o diagnóstico levou de 2 a 10 minutos (na 13.0 a rodada seguinte é que parou, no pedido de
  permissão).
- A limpeza do Orquestrador por tarefa (medida 1) e o `77b01bd`, que acabou com a rodada parada em pedido
  de permissão (medida 2).
- Rodar as suítes completas com a linha parada: achou as três listas e evitou duas corridas do portão
  completo.

## Propostas

Dez de texto, que posso aplicar agora (a 9 é decisão, e muda a D78), e quatro de código de processo, que
entram no `TODO.md` como correção própria: mexem em `tools/processo/` e pedem teste e revisão. Somadas,
as de texto tiram mais linhas do que põem.

### De texto

**1. O `revisor-geral` não reprova pelo bloqueante do `test-engineer`**

```
Causa: D — 3 reprovações (15.0 ×2, 16.0)
Onde evitar: texto do agente (falso positivo)
Mudança: .claude/agents/revisor-geral.md
  - na descrição: "depois do test-engineer aprovar" → "depois do test-engineer"
  - "(`test-engineer`, que já aprovou antes de você)" → "(`test-engineer`, que roda antes de você e
    pode ter reprovado)"
  - em "Severidade e rodada nova", novo item, depois de "REPROVADO só com ao menos um bloqueante.":
    "- **O bloqueante do `test-engineer` não é seu.** Se ele reprovou nesta rodada (seção "Revisões"
      do documento), não repita o achado dele nem reprove por ele ainda não ter aprovado: o hook já
      segura o commit. Diga em uma linha que viu, e julgue o resto. Na 15.0 (duas rodadas) e na 16.0
      do F3, o seu único bloqueante foi o dele."
Efeito esperado: o `revisor-geral` deixa de gastar a rodada, e de precisar de outra, por um defeito que
  já tem dono.
```

**2. A ordem de correção não dita o que o revisor não escreveu**

```
Causa: C — 4 reprovações, em 3 das 5 escaladas (11.0, 18.0, 19.0)
Onde evitar: revisar-tarefa, passo 5
Mudança: .claude/skills/revisar-tarefa/SKILL.md, em "Regras da ordem" — trocar
  "- Não acrescente exigência sua. Se achar que faltou algo, o lugar é o prompt do revisor na próxima
    rodada"
  por
  "- **Não acrescente exigência, regra, texto de tela nem código seu.** `Mude para` e `Prova` trazem a
    correção que o revisor exigiu, como está em `achados/`. Quando ele não deu o texto nem o código, o
    item diz o que tem de ficar verdadeiro e o que o teste afirma, e quem escreve é o Implementador.
    Três das cinco escaladas do F3 nasceram de ordem que ditou sem conferir: uma regra com quatro
    comparações e teste de uma (11.0), doze rótulos de tela (18.0) e um caso de teste que lia variável
    de outro (19.0). Se achar que faltou algo, o lugar é o prompt do revisor na próxima rodada"
Efeito esperado: a segunda reprovação deixa de nascer da ordem. É texto, e o grupo A mostra o limite de
  texto: se a 3ª escalada da próxima spec vier de ordem ditada, a saída é a ordem deixar de trazer
  código.
```

**3. Saem as duas conferências em texto antes da primeira rodada**

```
Causa: A — o texto não mexeu no número (medida 5) e fez o e2e rodar três vezes na 16.0
Onde evitar: executar-task, passo 5
Mudança: .claude/skills/executar-task/SKILL.md — trocar o bloco que começa em "**Antes de pedir a
  primeira rodada, três conferências, nesta árvore e não de memória.**" e vai até o item "3. **A tarefa
  entrou em alguma lista fechada?** (passo 4, "Lista fechada")" por uma linha:
  "**Antes de pedir a primeira rodada, confira se a tarefa entrou em alguma lista fechada** (passo 4,
  "Lista fechada")."
Efeito esperado: 12 linhas a menos em toda tarefa, e a série de mutações de tela deixa de rodar de novo
  só para cumprir a conferência. A instrução de rodar a mutação continua no passo 2, até a M1 existir.
```

**4. Teto de tarefa: um comportamento e até três guardiões com veto**

```
Causa: medida 3 — as três tarefas com quatro guardiões no processo atual foram à 3ª rodada com
  diagnóstico; a única que passou de primeira era pequena
Onde evitar: criar-tasks
Mudança: .claude/skills/criar-tasks/SKILL.md, diretriz "Tarefa cabe numa rodada de revisão" — trocar
  "Mira de até ~15 arquivos de código alterados e um `N_task.md` de até 800 palavras. Tarefa que passa
  disso vira duas: diff grande é onde o revisor deixa passar coisa e onde a rodada nova custa mais."
  por
  "Uma tarefa entrega **um** comportamento e marca até três guardiões com veto; a que marcaria os
  quatro vira duas, cortada por comportamento. No F3, as três tarefas com quatro guardiões (11.0, 13.0
  e 15.0) foram à terceira rodada com diagnóstico do Arquiteto, e a única que passou de primeira foi a
  20.0, de uma tela e um ramo. Contar arquivo não serve de teto: a previsão erra (a 13.0 previa seis
  linhas de arquivo e alterou 60). O `N_task.md` nasce com até 800 palavras."
Efeito esperado: menos tarefas na 3ª rodada. Preço: mais tarefas por spec, e o máximo de 20 passa a
  apertar antes; o F3, com 20 tarefas e Tech Spec de 838 linhas, já era grande demais para uma spec.
```

**5. Sai a seção "Critério de conclusão" do modelo de tarefa**

```
Causa: 8 de 20 documentos terminaram com caixa em branco (3.0, 4.0, 5.0, 9.0, 14.0, 16.0, 17.0, 19.0),
  em tarefa concluída e validada; e a linha "`test-engineer` primeiro" foi citada nas reprovações do
  grupo D
Onde evitar: task-template.md
Mudança: .claude/skills/criar-tasks/task-template.md — tirar a seção "## Critério de conclusão" inteira
  (9 linhas). Os cinco itens já são cobrados por quem não esquece: subtarefas no `tasks.md`, testes e
  carimbo pelo portão, revisores e commit pelo hook.
  .claude/agents/arquiteto.md, em "Contexto das tarefas" — "sem mudar objetivo, subtarefas, cenários nem
  critério de conclusão" → "sem mudar objetivo, subtarefas nem cenários".
Efeito esperado: o documento não afirma mais um estado que ninguém mantém, e o item do `TODO.md`
  "(F3, fechamento) Critério de conclusão" fecha.
```

**6. A regra 40 diz que o id é v4, e ele é v7**

```
Causa: recomendação do test-engineer na 16.0 (2ª rodada), deixada para esta retro — 1
Onde evitar: .claude/rules/40-testes.md
Mudança: no parágrafo "E o do próprio ambiente de teste", trocar
  "nunca se percorre inteira nem se supõe a ordem do id, que é v4"
  por
  "nunca se percorre inteira, e o id, que é v7, segue o instante da criação: não é a ordem de negócio
  nem desempata duas linhas do mesmo milissegundo"
Efeito esperado: a regra para de contradizer o schema (`uuidv7()` nas 44 tabelas).
```

**7. A revisão da spec cobra o caso de borda da virada de ano em toda rota nova**

```
Causa: F — o crítico C1 da validação (2 h 07 no fim da spec) e 3 reprovações do grupo A
Onde evitar: revisão da spec
Mudança: .claude/skills/revisar-spec/SKILL.md, passo 2, linha "sempre" da tabela — acrescentar ao fim
  da pergunta do `test-engineer`: " Cada rota nova tem cenário na escola sem ano letivo em curso e, se
  lê vínculo ou turma, com um vínculo encerrado e outro aberto?"
Efeito esperado: o estado em que o C1 morava vira linha do `cenarios.md` antes de existir tarefa, uma
  vez por spec.
```

**8. Texto que descreve o dado da pessoa vem escrito na Tech Spec**

```
Causa: E — 3 reprovações e a escalada da 18.0, 1 correção (e13311f) e 1 item do TODO.md
Onde evitar: Tech Spec, seção 9
Mudança: .claude/skills/criar-techspec/template.md, seção "## 9. Frontend" — acrescentar ao fim:
  "Texto que diz à pessoa o que a escola guarda ou fez com o dado dela (rótulo de categoria, resumo,
  prazo) vem escrito aqui, ao lado da consulta ou da regra que o produz. Na 18.0 do F3, doze rótulos
  saíram do nome da categoria, e três revisores reprovaram o mesmo texto falso."
Efeito esperado: o rótulo é conferido contra a consulta por quem desenha, uma vez, e não ditado numa
  ordem de correção.
```

**9. Sai o modo econômico (opencode)** — decisão do Joaquim, revisão da D78

```
Causa: medida do MiMo — 2 tarefas, o dobro do tempo, o mesmo consumo do Claude por tarefa, sem uso
  desde 09/10
Onde evitar: —
Mudança: se aceita, registro como revisão da D78 (`registrar-decisao`) e tiro `.opencode/`, o parágrafo
  do protocolo, a linha da tabela do `/seguir` e da vigia, e as menções no `CLAUDE.md`, no
  `executar-task` e no `retro`. O plugin `.opencode/plugins/portao-de-revisoes.ts` é código: a remoção
  vai num commit de correção, não neste.
Efeito esperado: um parágrafo a menos no texto que os cinco papéis leem em toda sessão, e um papel a
  menos para manter em dobro.
```

**10. A skill `retro` perde as medidas pedidas para o F3**

```
Causa: as sete medidas e a do MiMo estão respondidas acima
Onde evitar: —
Mudança: .claude/skills/retro/SKILL.md, passo 2 — tirar o parágrafo "A linha por modelo é a que
  sustenta a D78…" e os dois blocos "Quatro medidas que a avaliação do processo de 10/10/2026 deixou…"
  e "E três que a oitava revisão da D78 deixou…" (37 linhas), e pôr no lugar:
  "Repita as medidas da seção "As medidas que a D78 deixou para esta retrospectiva" da retro do F3
  (`tasks/prd-lgpd-e-titular/retro.md`) que ainda valem, com o número de agora ao lado do de lá."
Efeito esperado: a skill volta a ser procedimento, e a próxima retro compara com esta.
```

### De código de processo (entram no `TODO.md`, como correção própria)

**M1. O portão da tarefa confere as mutações**

```
Causa: A — 17 reprovações em 14 tarefas, depois de três rodadas de texto
Onde evitar: tools/processo/portao-local.ts --tarefa
Mudança: a seção "Mutações" ganha formato que máquina lê (arquivo, trecho exato, o que entra no lugar,
  teste). O portão da tarefa aplica cada linha, roda o teste citado, exige vermelho e restaura o
  arquivo. Recusa: trecho que não existe mais no arquivo, teste que não existe, e teste que fica verde.
  Mutação de teste de unidade e de integração roda sempre; a de e2e roda só o caso citado, numa
  corrida por arquivo.
Efeito esperado: somem as cinco reprovações por linha falsa, e a cláusula sem teste aparece antes da
  rodada, em minutos. Não pega a cláusula que não tem linha: essa continua com o `test-engineer`.
  Sem prova: quanto o portão cresce numa tarefa com 40 linhas de mutação de integração.
```

**M2. A unidade roda com fuso diferente de São Paulo, e o banco de teste declara o dele**

```
Causa: B — 3 reprovações e 1 e2e vermelho das 21 h à meia-noite
Onde evitar: vitest.config.ts e tools/ci/compose.ts
Mudança: o projeto `unidade` fixa `TZ` num fuso longe de -03 (o `vitest.config.ts` hoje não fixa
  nenhum, e o teste que esquece `America/Sao_Paulo` passa nesta máquina); a sessão do banco de teste
  declara o fuso, em vez de herdar o que vier; e um caso de unidade em `tools/` prova as duas coisas.
Efeito esperado: o teste que só passa no fuso do computador, ou fora da janela das 21 h, fica vermelho
  na primeira corrida.
```

**M3. A vigia só acorda o modelo quando há o que fazer**

```
Causa: medida 2 — 96 de 100 turnos sem ação, 36 de custo
Onde evitar: a rotina "Vigia do processo"
Mudança: um `tools/processo/vigia-precisa.ts`, usado como `--pre-run` da rotina, que responde "nada"
  quando algum terminal do time está trabalhando e a tarefa da vez está dentro do prazo do porte, e só
  então deixa o `/vigia` chegar ao Orquestrador. Com teste; e o passo 9 do `/seguir` e a skill `vigia`
  passam a citá-lo.
Efeito esperado: perto de 36 a menos por spec, e a conversa do Orquestrador sem 96 turnos de "nada".
  O valor é pequeno (2,7% do período); entra por último.
```

**M4. Condição de tela provada sem Playwright**

```
Causa: tarefa de tela é espera por e2e — na 16.0, na 17.0 e na 18.0 o código ficou pronto em uns 20
  minutos e a primeira rodada saiu com 140, 98 e 140; as três tabelas de teste eram só e2e
Onde evitar: apps/web (teste de componente) e task-template.md
Mudança: a web ganha teste de componente no projeto `unidade` (hoje não há `jsdom` nem
  `testing-library` no repositório; é dependência nova de desenvolvimento, a decidir na Tech Spec da
  próxima spec de tela). Com ele, a linha "estados da tela" do modelo de tarefa passa a pedir unidade
  para a condição e e2e para o fluxo.
Efeito esperado: a mutação de tela sai de minutos de Playwright para segundos. É a mudança que mais
  pesa na próxima spec, se ela for de tela.
```

## O que manter, com o número

- **Orquestrador em Opus** (medida 1) e **revisores com veto em Opus** (medida 4).
- **Portão da tarefa sem a integração inteira** (medida 7).
- **`tenancy-guardian` e `conformidade-reviewer` em toda tarefa que os marca**, mesmo com 1 reprovação em
  43 rodadas: reprovaram a spec nas rodadas 1 e 2, que é onde o trabalho deles pesa.
- **Rodar as suítes completas quando a linha para.** Foi feito à mão uma vez e pagou. Não proponho
  texto: é do redesenho dizer quem roda e quando.

## Pendências fora das propostas

- **Processo mexido com a spec andando.** Oito revisões da D78 e sete merges da `develop` na branch em
  três dias; o térreo foi metade do consumo. Não é proposta de arquivo: é a regra que o Joaquim já
  escreveu no prompt do redesenho, e esta retrospectiva é o lugar de mexer.
- **26 `@SemEscopo` em `resolucao-de-tenant.repository.ts`** (`tenancy-guardian`, 14.0), acima do sinal da
  regra 10, item 9. Declarar exceção na regra ou partir o módulo é decisão de desenho sobre a regra 10:
  não se resolve por retrospectiva. Vai ao `TODO.md`, para a Tech Spec da próxima spec que tocar sessão.
- **Lint que recuse `.skip` e `.only` em teste** (grupo I, uma ocorrência): a regra 40 proíbe, e hoje
  só o `test-engineer` vê. Vai ao `TODO.md`.
- **Recomendações que os documentos mandaram "para o /retro"** e são código ou teste, que a retro não
  altera. Vão ao `TODO.md` numa entrada só: o teste que fixa os índices únicos de `suboperador` (8.0); a
  chave de idempotência do `ops:incidente` (9.0); as duas camadas do escopo em `troca-de-nome.ts` e a
  sondagem da `pg_stat_activity` sem filtro de `pid` (15.0); o ponto de sincronia antes das asserções
  negativas em `e2e/meus-dados.spec.ts` (18.0); o "antes e depois" que lê a tabela global `suboperador`
  e o limite relativo da latência falsa (19.0); o comentário de `pedido-titular.int.test.ts:231`
  (`e13311f`); e a guarda textual de `conteudo` em `assistente.int.test.ts`, que não pega `to_jsonb(m)`
  (`9d2887f`, cuja ordem da 2ª rodada ficou no andar e se perdeu no pouso; o achado está em
  `tasks/correcoes/achados/indice.md`).
- **O que some no pouso.** As ordens e os diagnósticos ficam em `.processo/ordens/`, fora do git, e o
  andar é apagado. Os cinco diagnósticos do Arquiteto e a ordem acima não existem mais. Vale decidir no
  redesenho se o diagnóstico entra no commit da tarefa.
- **Leitura inicial do Implementador.** Perto de 290 mil tokens antes da primeira linha, com a sessão
  compactando aos 5 minutos (17.0). A Tech Spec tem 16 mil palavras e o `cenarios.md`, 7,9 mil. Não
  proponho cortar leitura por texto: o tamanho vem do tamanho da spec, e é o item 3 do prompt do
  redesenho.
- **A Mesa como tradutora.** Três das cinco escaladas nasceram da ordem dela (grupo C). Se a proposta 2
  não bastar, a pergunta do redesenho é se a ordem precisa existir ou se o achado do revisor vai direto.

## Decisão

Perguntei ao Joaquim em 11/10/2026, no terminal do Arquiteto, proposta por proposta, em quatro grupos. A
resposta dele, igual nos quatro: **"somente o necessário"**. Li assim: entra o que corrige texto que hoje
é falso, o que tira texto medido sem efeito ou que ninguém mantém, e o que fecha o crítico da validação.
Fica de fora o que acrescenta procedimento ou muda uma decisão; esses seguem aqui, com o número, para o
redesenho do processo. Se a leitura estiver errada, é um commit de documento, sem push, e se desfaz.

| Proposta | Decisão | Motivo |
|---|---|---|
| 1. `revisor-geral` não reprova pelo bloqueante do `test-engineer` | aplicada | o texto dizia que o `test-engineer` "já aprovou", o que é falso desde 09/10, e gerou os três falsos positivos |
| 2. A ordem da Mesa não dita o que o revisor não escreveu | não aplicada | acrescenta texto a um papel que o redesenho pode refazer; o diagnóstico do Arquiteto segue como rede |
| 3. Saem as duas conferências em texto | não aplicada | são o texto da oitava revisão da D78 (`docs/decisoes.md`), que marca a própria revisão para esta retro: tirá-las é rever a decisão, e pede a palavra dele. O número está na medida 5 (59% antes e depois); saem junto com a M1, que as troca por conferência do portão |
| 4. Teto de tarefa por guardião e comportamento | não aplicada | muda como a spec é cortada e tem preço em número de tarefas; é o item 3 do redesenho, e o número está na medida 3 |
| 5. Sai a seção "Critério de conclusão" | aplicada no `task-template.md` | ninguém a mantinha (8 de 20 em branco); o `arquiteto.md` fica como está, porque a frase ainda vale para os documentos antigos |
| 6. Regra 40, o id é v7 | aplicada | a regra contradizia o schema |
| 7. Virada de ano na revisão da spec | aplicada | é uma frase, uma vez por spec, e o que ela evita custou 2 h 07 e chegou à validação |
| 8. Texto da pessoa escrito na Tech Spec | não aplicada | acrescenta texto ao modelo; fica para a Tech Spec da próxima spec com tela desse tipo |
| 9. Sai o modo econômico | não aplicada | muda a D78, e isso pede a palavra dele para essa decisão, não uma resposta geral |
| 10. A skill `retro` perde as medidas do F3 | aplicada | as instruções mandavam medir tarefas do F3 e ficariam erradas na próxima retro |
| M1. O portão da tarefa confere as mutações | no `TODO.md` | ataca a maior causa |
| M2. Fuso nos testes | no `TODO.md` | barata, e o defeito dela depende da hora em que se roda |
| M3. Vigia com `--pre-run` | não entrou | 2,7% do período; fica aqui para o redesenho |
| M4. Condição de tela sem Playwright | não entrou | pede dependência nova, que se decide na Tech Spec da spec de tela |

Também foram ao `TODO.md`, em "Processo e dívida do F0": os 26 `@SemEscopo` da 14.0 e as recomendações de
código e de teste que as tarefas deixaram para esta retro. O item "(F3, fechamento) Critério de conclusão"
fechou.

Arquivos de processo alterados: `.claude/agents/revisor-geral.md`,
`.claude/skills/criar-tasks/task-template.md`, `.claude/rules/40-testes.md`,
`.claude/skills/revisar-spec/SKILL.md` e `.claude/skills/retro/SKILL.md`. No total, 52 linhas a menos e 12 a
mais (`git diff --numstat`, sem o `TODO.md`).

**Aberto, para o Joaquim:** as propostas 3 e 9 mudam a D78 e só entram com a palavra dele sobre cada uma; a
2, a 4, a 8, a M3 e a M4 ficam com o número, para o redesenho do processo.
