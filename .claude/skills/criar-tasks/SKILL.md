---
name: criar-tasks
description: Gera a lista de tarefas de uma funcionalidade, a partir do PRD e da Tech Spec
argument-hint: <nome-funcionalidade em kebab-case>
user-invocable: false
---

Você vai transformar PRD e Tech Spec em uma lista de tarefas executável.

A razão de as tarefas serem pequenas: cada uma passa por um portão de qualidade, com auditoria de
isolamento, de dado pessoal e de conformidade, e quando uma grande falha, muita coisa já foi
construída em cima dela.

<critical>MOSTRE A LISTA DE ALTO NÍVEL ANTES DE GERAR ARQUIVO. É AVISO, NÃO PARADA (D79): MOSTRE E GERE</critical>
<critical>NÃO IMPLEMENTE NADA</critical>
<critical>CADA TAREFA É UM ENTREGÁVEL FUNCIONAL, NÃO UMA CAMADA</critical>

Funcionalidade alvo: `$ARGUMENTS`

## Pré-requisitos

`tasks/prd-$ARGUMENTS/prd.md`, `tasks/prd-$ARGUMENTS/techspec.md` e `.claude/rules/`.

`tasks/prd-$ARGUMENTS/revisao-spec.md` com veredito **APROVADA** (`/revisar-spec`). Sem ele, volte à
skill `revisar-spec`: erro na Tech Spec contamina todas as tarefas, e é o momento
mais barato de achá-lo.

Leia também o `achados/indice.md` e o `retro.md` das funcionalidades anteriores, se existirem: o
que os revisores exigiram lá vira cenário de teste ou subtarefa aqui. O índice é uma linha por
rodada; abra o bloco inteiro só das que interessam a esta funcionalidade.

## O que é uma boa tarefa

Uma tarefa entrega **comportamento verificável**, não uma camada técnica.

```
ruim:   1.0 Criar as migrations
        2.0 Criar os repositories
        3.0 Criar os controllers
        (nada funciona até a 3.0, e a auditoria não tem o que auditar até o fim)

bom:    1.0 Coordenação cria turma e a turma aparece na listagem da escola
        2.0 Coordenação sobe lista de nomes por turma, com erro apontado por linha
        3.0 Professor entra por convite e escolhe disciplina
        4.0 Aluno reivindica nome pelo link da sala
        5.0 Professor aprova reivindicação e o aluno vira usuário com senha
```

Cada uma dessas pode ser demonstrada, testada e auditada sozinha.

## Etapas

1. **Extrair** requisitos, decisões técnicas e componentes do PRD e da Tech Spec.

2. **Acionar `test-engineer`** para definir, por tarefa, os cenários que provam a regra,
   incluindo os casos de borda do domínio escolar. Os testes saem daí, não de improviso na
   hora de implementar.

3. **Montar a estrutura**: sequenciamento, dependências, os subagentes obrigatórios marcados em
   cada tarefa, e o porte de cada uma.

4. **Mostrar a lista de alto nível**, com a hora. É o momento mais barato para o Joaquim corrigir o
   desenho, e ele tem até 30 minutos depois de os arquivos existirem: o Orquestrador só começa a
   primeira tarefa passado esse prazo (`/seguir`, passo 7).

5. **Gerar os arquivos**, sem esperar.

## Subagentes obrigatórios por natureza da tarefa

| Se a tarefa... | Marque |
|---|---|
| cria migration, repository, query ou endpoint com dado de escola | `tenancy-guardian` (veto) |
| toca dado de aluno, responsável, log, storage, exportação ou envio externo | `privacy-guardian` (veto) |
| envolve nota, correção, tutor, autonomia de agente ou decisão sobre aluno | `conformidade-reviewer` (veto) |
| mexe em login, tutor, modo sala, prova online, fila, gateway de IA, migration em tabela grande, deploy ou ambiente | `infra-guardian` (veto) |
| chama modelo ou cria agente | `llm-integrator` |
| gera ou corrige conteúdo pedagógico | `pedagogia-reviewer` |
| cria ou altera tela | `frontend-reviewer` |
| depende de regra externa ou API de terceiro | `domain-researcher` |
| qualquer tarefa | `test-engineer` e `revisor-geral`, implícitos: o hook os exige mesmo sem marca |

Na dúvida, marque. Auditoria a mais custa minutos; auditoria a menos custa o contrato.

## Porte da tarefa

Toda tarefa leva `**Porte:** pequeno` ou `**Porte:** grande` no cabeçalho do `N_task.md`. O porte
diz quanto a tarefa deve levar, e é por ele que a vigia do `/seguir` sabe quando uma tarefa está presa.
Marque **grande** quando qualquer um destes vale:

- três ou mais guardiões com veto marcados (`tenancy-guardian`, `privacy-guardian`,
  `conformidade-reviewer`, `infra-guardian`);
- migration em tabela que cresce com aluno, ou índice e restrição que pedem `EXPLAIN` ou prova de
  concorrência;
- corrida entre operações, trava, ou transação que atravessa mais de um repository;
- mais de dez arquivos de código previstos, ou mudança que atravessa API, worker e web.

O resto é pequena: uma tela que lê um endpoint pronto, um endpoint de leitura, um comando de
operação simples, um documento. Na dúvida, grande. Sem a linha, `tools/processo/estado.ts`
infere o porte pela contagem de guardiões e avisa que inferiu.

## Diretrizes

- Ordene dependência antes de dependente: migration antes de repository, backend antes de
  frontend, ambos antes de e2e
- Testes são subtarefas dentro da tarefa, nunca uma tarefa separada no fim
- Cada desvio da seção 11 da Tech Spec vira subtarefa de documento na tarefa que o cria: a exceção ao
  `escolaId` no `docs/modelo-de-dados.md`, o módulo global no `docs/arquitetura.md`. Na A0 os dois
  ficaram de fora, e um deles foi o único achado maior do `/validar`
- O leitor é um desenvolvedor júnior que não participou das conversas. Seja explícito sobre
  o contexto que ele precisa ler
- **Toda tarefa diz como testar**, na seção "Como testar" do modelo: o teste existente a copiar e a
  peça de apoio, achados abrindo o código, e não de memória
- **Mire em até 12 tarefas, e nunca mais de 20.** Passou de 12, mostre junto com a lista o corte em
  duas specs que pousam separadas (o F3, com 20, levou 55 horas de relógio)
- **O "Contexto necessário" aponta a seção da Tech Spec e o requisito do PRD pelo número.** É só o que
  o Implementador lê dos dois (`executar-task`, passo 1)
- **Tarefa cabe numa rodada de revisão: um comportamento, e até três guardiões com veto.** A que
  marcaria os quatro vira duas, cortada por comportamento. No F3, as três tarefas com quatro guardiões
  (11.0, 13.0 e 15.0) foram à terceira rodada com diagnóstico do Arquiteto, e a única que passou de
  primeira foi a 20.0, de uma tela e um ramo. Contar arquivo não serve de teto: a previsão erra (a
  13.0 previa seis linhas de arquivo e alterou 60). Tarefa de tela conta as telas: uma tela, ou um
  diálogo grande, por tarefa. O `N_task.md` nasce com até 800 palavras
- Formato `X.0` para tarefa principal, `X.Y` para subtarefa
- Marque o que pode correr em paralelo

## Saída

- `tasks/prd-$ARGUMENTS/tasks.md`, seguindo `.claude/skills/criar-tasks/tasks-template.md`
- `tasks/prd-$ARGUMENTS/[N]_task.md`, seguindo `.claude/skills/criar-tasks/task-template.md`

Antes de reportar, meça: `wc -w tasks/prd-$ARGUMENTS/*_task.md`. `N_task.md` acima de 800
palavras: corte repetição da Tech Spec (aponte a seção em vez de copiar) ou divida a tarefa.

<critical>NÃO IMPLEMENTE NADA. O FOCO É A LISTA E O DETALHAMENTO.</critical>
