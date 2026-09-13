---
name: criar-tasks
description: Gera a lista de tarefas de uma funcionalidade, a partir do PRD e da Tech Spec
argument-hint: <nome-funcionalidade em kebab-case>
---

Você vai transformar PRD e Tech Spec em uma lista de tarefas executável.

A razão de as tarefas serem pequenas: cada uma passa por um portão de qualidade, com
auditoria de isolamento, de dado pessoal e de conformidade. Vinte tarefas de um dia recebem
vinte auditorias; quatro tarefas de uma semana recebem quatro, e quando uma falha, muita
coisa já foi construída em cima dela.

<critical>MOSTRE A LISTA DE ALTO NÍVEL E AGUARDE APROVAÇÃO ANTES DE GERAR ARQUIVO</critical>
<critical>NÃO IMPLEMENTE NADA</critical>
<critical>CADA TAREFA É UM ENTREGÁVEL FUNCIONAL, NÃO UMA CAMADA</critical>

Funcionalidade alvo: `$ARGUMENTS`

## Pré-requisitos

`tasks/prd-$ARGUMENTS/prd.md`, `tasks/prd-$ARGUMENTS/techspec.md` e `.claude/rules/`.

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

3. **Montar a estrutura**: sequenciamento, dependências, e os subagentes obrigatórios
   marcados em cada tarefa.

4. **Mostrar a lista de alto nível e AGUARDAR aprovação.** Este passo não é formalidade: é
   o momento mais barato para corrigir o desenho.

5. **Gerar os arquivos** depois da aprovação.

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
| qualquer tarefa | `test-engineer` antes da revisão |

Na dúvida, marque. Auditoria a mais custa minutos; auditoria a menos custa o contrato.

## Diretrizes

- Ordene dependência antes de dependente: migration antes de repository, backend antes de
  frontend, ambos antes de e2e
- Testes são subtarefas dentro da tarefa, nunca uma tarefa separada no fim
- O leitor é um desenvolvedor júnior que não participou das conversas. Seja explícito sobre
  o contexto que ele precisa ler
- **Máximo 20 tarefas.** Se passar disso, a funcionalidade está grande demais e deveria ser
  dividida no roadmap
- Formato `X.0` para tarefa principal, `X.Y` para subtarefa
- Marque o que pode correr em paralelo

## Saída

- `tasks/prd-$ARGUMENTS/tasks.md`, seguindo `.claude/skills/criar-tasks/tasks-template.md`
- `tasks/prd-$ARGUMENTS/[N]_task.md`, seguindo `.claude/skills/criar-tasks/task-template.md`

<critical>NÃO IMPLEMENTE NADA. O FOCO É A LISTA E O DETALHAMENTO.</critical>
