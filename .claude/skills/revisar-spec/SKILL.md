---
name: revisar-spec
description: Audita PRD e Tech Spec com os guardiões e o test-engineer antes de gerar as tarefas, e dá o veredito da spec
argument-hint: <nome-funcionalidade em kebab-case>
---

Você obtém uma auditoria **independente** da Tech Spec antes de ela virar tarefa.

Este comando existe porque erro de desenho é o mais caro do processo: uma Tech Spec que esquece
o escopo de ano letivo, manda log com nome de aluno ou põe trabalho demorado dentro do request
vira vinte tarefas construídas em cima do erro. Hoje a primeira auditoria independente da spec
aconteceria só no `/validar`, no fim. Aqui ela acontece quando corrigir é editar um parágrafo.

<critical>Os revisores leem documento, não código: ainda não há código desta funcionalidade.
Eles auditam o desenho contra as regras e cobram o que a Tech Spec deixou implícito.</critical>
<critical>Não corrija a Tech Spec você mesmo durante a revisão. Junte os achados, apresente, e
corrija só depois, com rodada nova de quem reprovou.</critical>

Funcionalidade alvo: `$ARGUMENTS`

## 1. Preparar

- `tasks/prd-$ARGUMENTS/prd.md` e `techspec.md` existem? Não: PARE e aponte `/criar-techspec`.
- Meça: `wc -w tasks/prd-$ARGUMENTS/prd.md tasks/prd-$ARGUMENTS/techspec.md`. Acima de 2.000
  palavras sem aceite escrito no topo é achado **bloqueante** desta revisão.
- Crie `tasks/prd-$ARGUMENTS/revisao-spec.md`, se ainda não existir:

  ```
  # Revisão de spec — <funcionalidade>

  **Subagentes obrigatórios:** `test-engineer`, <os guardiões abaixo>
  ```

  É nele que o hook registra as rodadas, pela linha `Tarefa:` do prompt de cada revisor.

## 2. Escolher os revisores

Pela natureza da funcionalidade, com a mesma tabela do `/criar-tasks`:

| Se a spec... | Revisor |
|---|---|
| sempre | `test-engineer`: a estratégia de testes prova cada RF? Cada caso de borda do PRD tem teste previsto? Concorrência com teste em paralelo? |
| cria tabela, repository, query ou endpoint com dado de escola | `tenancy-guardian` |
| toca dado de pessoa, log, storage, exportação ou envio externo | `privacy-guardian` |
| envolve nota, correção, tutor, autonomia de agente, decisão sobre aluno ou indicador de professor | `conformidade-reviewer` |
| mexe em login, tutor, sala, prova, fila, gateway de IA, migration grande, deploy ou ambiente | `infra-guardian` |
| chama modelo | `llm-integrator` |
| tem tela | `frontend-reviewer` |

Na dúvida, inclua.

## 3. Disparar, todos em paralelo

```
Tarefa: tasks/prd-<func>/revisao-spec.md

Revisão de SPEC, não de código: ainda não existe código desta funcionalidade.
Leia tasks/prd-<func>/prd.md e tasks/prd-<func>/techspec.md e audite o DESENHO contra a sua
lista "O que verificar". Para cada item: a Tech Spec garante, deixa implícito (bloqueante se a
regra é das que têm veto) ou não se aplica? Aponte a seção da Tech Spec em vez de arquivo:linha.
Termine com o formato da sua resposta.
```

Espere todos terminarem.

## 4. Consolidar

Escreva, abaixo do cabeçalho do `revisao-spec.md` e acima da seção "Revisões" que o hook mantém:

```
## Rodada <n> — <data>

**Veredito: APROVADA | REPROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|

### Correções exigidas na Tech Spec
- <seção>: <o que mudar> (<revisor>)

### Recomendações
- ...
```

**APROVADA** só com todo revisor com veto APROVADO. Revisor sem veto com bloqueante vira
correção exigida também: aqui corrigir custa pouco.

## 5. Agir

- **REPROVADA:** apresente as correções ao usuário. Com o aceite, edite a Tech Spec (e o PRD, se
  for o caso) e rode `/revisar-spec` de novo: a rodada nova chama **só os revisores que
  reprovaram**, com as correções exigidas e o diff da Tech Spec no prompt.
  Mudança de desenho que afeta outro guardião (por exemplo, a correção de infra criou tabela
  nova): chame esse também.
- **APROVADA:** próximo passo `/criar-tasks $ARGUMENTS`. As recomendações entram como subtarefa
  ou cenário de teste lá.

Commit direto na `develop` (D23 revista), só com `revisao-spec.md`, `techspec.md`, `prd.md` e, se
o hook os escreveu, `achados/revisao-spec.md` e `achados/indice.md`:
`Revisa a spec de <funcionalidade> com os guardiões`.

## 6. Relatório

```
Revisão de spec — <funcionalidade>

Veredito: APROVADA | REPROVADA (rodada n)
Tamanho: PRD <n> palavras · Tech Spec <n> palavras
Revisores: <revisor veredito, ...>
Correções exigidas: <lista curta ou nenhuma>
Próximo passo: <comando exato>
```
