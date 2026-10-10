---
name: retro
description: Retrospectiva de uma funcionalidade concluída — mede rodadas e reprovações, agrupa o que os revisores exigiram e propõe mudanças nos templates, agentes e regras para o erro não voltar
argument-hint: <nome-funcionalidade em kebab-case>
user-invocable: false
---

Você transforma o histórico de revisões de uma funcionalidade em mudança de processo.

Este comando existe porque o processo reprovava o mesmo tipo de erro tarefa após tarefa: no F0 e
no começo do F1, 31 de 119 rodadas reprovaram, 16 delas do `test-engineer`, e nada fazia a
tarefa seguinte aprender com a anterior. Cada reprovação evitada é uma rodada inteira de
revisores a menos.

<critical>Proponha, não aplique. Mudança em template, agente ou regra só com confirmação do
usuário, arquivo por arquivo.</critical>
<critical>Regra 10, 20 e 70 não são afrouxadas por retrospectiva. Se o achado é "o guardião é
rigoroso demais", a proposta é deixar o requisito mais claro para quem implementa, não tirá-lo.</critical>

Funcionalidade: `$ARGUMENTS`

## 1. Ler

- `tasks/prd-$ARGUMENTS/*_task.md`: a seção "Revisões" de cada um
- `tasks/prd-$ARGUMENTS/achados/indice.md`: uma linha por rodada com o que cada revisor exigiu.
  Agrupe pelo índice e abra `achados/<documento>.md` só onde precisar do texto inteiro
- `tasks/prd-$ARGUMENTS/revisao-spec.md` e `validacao.md`, se existirem
- `tasks/prd-$ARGUMENTS/estado.md`: a tabela "Concluídas" traz o modelo que implementou cada tarefa,
  as escaladas e o que o Orquestrador decidiu sem perguntar
- `tasks/correcoes/*.md` com data dentro do período da funcionalidade
- `git log --format='%h %ad %s' --date=iso` dos commits da funcionalidade

## 2. Medir

```
Tarefas: <n> · Rodadas de revisor: <n> · Reprovações: <n> (<%>)
Por revisor: <revisor: rodadas / reprovações>
Por modelo do implementador: <modelo: tarefas / rodadas por tarefa / reprovações / diagnósticos do Arquiteto / tempo por tarefa>
Rodadas por tarefa: média <n>, pior <tarefa> com <n>
Rodadas que caducaram sem reprovação (revisor aprovou e teve de rodar de novo): <n>
Correções fora de tarefa: <n>
Duração: primeira tarefa → último commit, e mediana por tarefa (intervalo entre commits)
Ressalvas do /validar: <n críticos, n maiores>
```

Compare com a retrospectiva anterior (`tasks/prd-*/retro.md` mais recente), se houver.

A linha por modelo é a que sustenta a D78. O Implementador passou por três: Haiku 5.5 nas pequenas (mais
de cinco horas na 6.0 do F3), Sonnet 5.5 em toda tarefa, e o MiMo-V2.6-Pro no opencode na 11.0 e na
12.0 do F3, de onde voltou ao Sonnet: de duas a quatro vezes o tempo, e o mesmo consumo do Claude por
tarefa (D78, quinta revisão). O modelo de cada tarefa está na coluna "Modelo" do `estado.md`. **Se
alguma tarefa rodou no modo econômico, compare o MiMo com o Sonnet em rodadas, em tempo e em consumo do
Claude por tarefa**, e proponha com o número se o modo econômico continua existindo. O mesmo
vale para os revisores com veto em Opus e para a vigia do Orquestrador, que são a maior parte do
consumo de uma tarefa: proponha manter ou trocar, com o número.

Quatro medidas que a avaliação do processo de 10/10/2026 deixou para esta retrospectiva (D78, sétima
revisão). Meça cada uma e proponha com o número, ou diga que o número não sustenta:

- **O Orquestrador depois da limpeza por tarefa:** o custo dele por tarefa antes e depois da 13.0 do
  F3, e o que ele deixou de fazer por não estar no "Agora" do `estado.md`. Com isso, se ele passa a
  Sonnet: não lê código e segue um roteiro
- **A vigia:** quantos turnos dela não acharam nada a fazer. Se for a maioria, a rotina ganha um
  `--pre-run` que só acorda o modelo quando há terminal parado ou tarefa fora do prazo
- **O tamanho da tarefa:** linhas do `N_task.md` e número de guardiões contra rodadas e escaladas. No
  F3, até a 13.0, as três com documento acima de 200 linhas (5.0, 11.0 e 13.0) foram as três com quatro
  rodadas ou escalada. Se o resto confirmar, o `criar-tasks` ganha um teto
- **O modelo dos revisores:** antes de propor baixar o `test-engineer`, leia a 13.0 do F3. A reprovação
  dele na 2ª rodada parecia só falta de prova ("o prazo de 5 s não está provado") e era defeito: o
  prazo não existia no código. Reprovação por falta de prova não é sinônimo de rigor demais

## 3. Agrupar causas

Leia cada achado e agrupe pela **causa**, não pelo revisor. Exemplos de causa: "teste de
concorrência em sequência em vez de paralelo", "DTO devolvendo campo da entidade", "N_task sem o
caso de borda que o revisor cobrou", "Tech Spec não dizia o índice". Para cada grupo:

- quantas vezes, em quais tarefas;
- **onde o erro deveria ter sido evitado**: no PRD, na Tech Spec, no `N_task.md` (criar-tasks),
  na autoconferência do implementador (executar-task, passo 2), ou é falso positivo do revisor.

## 4. Propor

Uma proposta por grupo com duas ou mais ocorrências, no formato:

```
Causa: <grupo> — <n> ocorrências (<tarefas>)
Onde evitar: <etapa>
Mudança: <arquivo> — <o texto exato a acrescentar ou trocar>
Efeito esperado: <qual reprovação deixa de acontecer>
```

Destinos típicos: pergunta nova na autoconferência do `executar-task`; linha nova na tabela de
testes do `task-template.md`; item mais claro no "O que verificar" do agente; seção obrigatória
na Tech Spec; caso de borda novo na regra 40. Falso positivo do revisor vira ajuste no texto do
agente, com o exemplo que ele reprovou sem motivo.

Proponha também o que **tirar**: item de checklist que nunca pegou nada em toda a funcionalidade
e custa leitura em toda tarefa.

## 5. Aplicar com confirmação

Mostre as propostas e pergunte quais aplicar. Aplique só as aceitas.

## 6. Salvar

`tasks/prd-$ARGUMENTS/retro.md`, com as medidas, os grupos, as propostas e o que foi aceito ou
recusado (com o motivo). O `/criar-tasks` da próxima funcionalidade lê esse arquivo.

Commit na `develop`, no térreo, depois do pouso da funcionalidade (D78), sem push (o push é do
Orquestrador): `Faz a retrospectiva de <funcionalidade> e ajusta o processo`,
só com `retro.md` e os arquivos de processo alterados.

## 7. Relatório

```
Retro — <funcionalidade>

Reprovações: <n de n rodadas (%)> · antes: <% da retro anterior ou "primeira">
Maior causa: <grupo, n ocorrências>
Aceitas: <n propostas> · Recusadas: <n>
Arquivos alterados: <lista>
```
