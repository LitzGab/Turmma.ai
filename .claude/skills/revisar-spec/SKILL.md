---
name: revisar-spec
description: Audita PRD e Tech Spec com os guardiões e o test-engineer antes de gerar as tarefas, e dá o veredito da spec
argument-hint: <nome-funcionalidade em kebab-case>
user-invocable: false
---

Você obtém uma auditoria **independente** da Tech Spec antes de ela virar tarefa. Quem roda isto é o
Arquiteto, no andar da spec (D78): ele chama os revisores como subagentes, e o hook registra as rodadas.

Este comando existe porque erro de desenho é o mais caro do processo: uma Tech Spec que esquece
o escopo de ano letivo, manda log com nome de aluno ou põe trabalho demorado dentro do request
vira vinte tarefas construídas em cima do erro. Hoje a primeira auditoria independente da spec
aconteceria só na validação, no fim. Aqui ela acontece quando corrigir é editar um parágrafo.

<critical>Os revisores leem documento, não código: ainda não há código desta funcionalidade.
Eles auditam o desenho contra as regras e cobram o que a Tech Spec deixou implícito.</critical>
<critical>Não corrija a Tech Spec você mesmo durante a revisão. Junte os achados, apresente, e
corrija só depois, com rodada nova de quem reprovou.</critical>

Funcionalidade alvo: `$ARGUMENTS`

## 1. Preparar

- `tasks/prd-$ARGUMENTS/prd.md` e `techspec.md` existem? Não: volte à etapa que falta (`criar-prd` ou `criar-techspec`).
- Leia as regras 00 (`00-arquitetura.md`), 40 (`40-testes.md`), 60 (`60-dominio.md`) e 80 (`80-infra-e-carga.md`), de `.claude/rules/`, por extenso: têm `paths:` e não carregam sozinhas aqui (a 10, a 20 e a 70 já estão no contexto), antes de chamar os revisores.
- Meça: `wc -w tasks/prd-$ARGUMENTS/prd.md tasks/prd-$ARGUMENTS/techspec.md`. Acima de 2.000
  palavras sem aceite escrito no topo é achado **bloqueante** desta revisão.
- Crie `tasks/prd-$ARGUMENTS/revisao-spec.md`, se ainda não existir:

  ```
  # Revisão de spec — <funcionalidade>

  **Subagentes obrigatórios:** `test-engineer`, <os guardiões abaixo>
  ```

  É nele que o hook registra as rodadas, pela linha `Tarefa:` do prompt de cada revisor.

## 2. Escolher os revisores

O `test-engineer` sempre: a estratégia de testes prova cada RF? Cada caso de borda do PRD tem teste previsto?
Concorrência com teste em paralelo? Cada rota nova tem cenário na escola sem ano letivo em curso e, se lê vínculo ou
turma, com um vínculo encerrado e outro aberto?

Os demais, pela natureza da funcionalidade inteira, vêm da tabela "Subagentes obrigatórios por natureza da tarefa" do
`criar-tasks` (a única que existe): leia-a lá, e leia "a tarefa" como "a spec". Na dúvida, inclua.

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

- **REPROVADA:** mostre as correções ao Joaquim e, sem esperar, edite a Tech Spec e repita esta
  skill (aviso, não parada: D79). Correção que muda o desenho ou um critério de aceite do PRD é a
  exceção: essa espera a palavra dele. Na repetição, a rodada nova chama **só os revisores que
  reprovaram**, com as correções exigidas e o diff da Tech Spec no prompt.
  Mudança de desenho que afeta outro guardião (por exemplo, a correção de infra criou tabela
  nova): chame esse também.
- **APROVADA:** siga para a skill `criar-tasks`. As recomendações entram como subtarefa
  ou cenário de teste lá.

Commit na branch do andar (D78), com push, só com `revisao-spec.md`, `techspec.md`, `prd.md` e, se
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
