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
de cinco horas na 6.0 do F3), Sonnet 5.5 em toda tarefa, e, desde 09/10/2026, o MiMo-V2.6-Pro no
opencode, para tirar o papel do consumo do Claude. O modelo de cada tarefa está na coluna "Modelo" do
`estado.md`. **Compare o MiMo com o Sonnet em rodadas por tarefa e em tempo por tarefa**: cada rodada a
mais custa revisor em Opus, e a troca só se paga se as rodadas não subirem. Com o número, proponha
manter, voltar ao Sonnet (a reserva em `.claude/agents/implementador.md`) ou dividir por porte. O mesmo
vale para os revisores com veto em Opus: proponha manter ou trocar, com o número.

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
