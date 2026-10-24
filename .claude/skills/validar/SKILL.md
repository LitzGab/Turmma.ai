---
name: validar
description: Valida a funcionalidade implementada contra o PRD, RF a RF, em contexto independente, e fecha a funcionalidade no roadmap quando aprovada
argument-hint: <funcionalidade> [número da tarefa]
user-invocable: false
---

Você obtém uma validação **independente** do que foi implementado contra o que o PRD
prometeu, e age sobre o veredito.

Este comando existe porque "todas as tarefas `[x]`" não é "funcionalidade pronta". Cada
tarefa passou pelo portão dela, com os revisores dela, olhando um pedaço. Ninguém ainda
conferiu a funcionalidade inteira contra os RF, os casos de borda e o critério de pronto.
É o último portão antes de marcar `[x]` no roadmap e começar a próxima em cima desta base.

Quem conduz é o Orquestrador (`/seguir`, passo 8, D78). O agente `validador` roda no terminal fixo
`Validador`, com a sessão reiniciada e apontada para o andar da spec, e só fala com o Orquestrador.

<critical>A validação é feita pelo agente `validador`, em contexto limpo. Não valide você
mesmo: quem acompanhou a execução tende a aceitar o que já leu no relatório.</critical>
<critical>Evidência é arquivo, linha e teste executado. Nunca aceite "parece coberto".
Qualquer portão vermelho reprova, mesmo que pareça intermitente.</critical>
<critical>Não marque a funcionalidade como concluída sem veredito APROVADA, sem a esteira verde na
ponta da branch, ou com commit de código da spec depois do último commit validado. Correção depois
da validação pede validação nova; o merge da `develop` pede só a esteira.</critical>

Argumentos: `$ARGUMENTS`

## 1. Resolver o alvo

- `<funcionalidade>` → `tasks/prd-<funcionalidade>/`. Aceita também o caminho da pasta ou
  o `F?` do roadmap.
- Número opcional → escopo de uma tarefa (`N_task.md`). Sem número, a funcionalidade
  completa.
- Vazio ou ambíguo: liste as pastas em `tasks/` e pergunte.

Antes de disparar:
- **Árvore limpa** (`git status`). Com mudança sem commit, pare e pergunte: a validação é do
  que está commitado.
- **Escopo completo com tarefa pendente** no `tasks.md`: pare e reporte. Não há o que validar
  ainda. Aponte `/seguir`.
- **Escopo de tarefa** que não está `[x]`: pare e reporte.

## 2. Disparar o validador

Reinicie o `Validador` apontado para o andar da spec (`/seguir`, passo 3), mesmo que ele já esteja
de pé: ele precisa chegar sem nada da rodada anterior. Envie, sem nenhum contexto de implementação:

```
Valide contra o PRD e a Tech Spec, seguindo integralmente `.claude/agents/validador.md`.
Leia por extenso `.claude/rules/00-arquitetura.md`, `40-testes.md`, `60-dominio.md` e `80-infra-e-carga.md`: têm `paths:` e não carregam sozinhas.

Funcionalidade: tasks/prd-<func>/
Escopo: funcionalidade completa | tarefa N.0 (tasks/prd-<func>/N_task.md)
Commit a validar: <hash do HEAD>

Escreva o relatório em tasks/prd-<func>/validacao.md e não altere nenhum outro arquivo.
As suítes inteiras rodam na esteira do GitHub, a cada push: não rode suíte inteira nem espere a esteira.
Rode só o teste que serve de evidência a um requisito, isolado; só termine com o relatório escrito.
A esteira não entra no seu veredito: quem a confere é o Orquestrador, no fechamento.
Envie a <nome do Orquestrador> só o bloco "Formato da resposta", começando a mensagem por
`/seguir RELATÓRIO de <seu nome>`, e encerre o turno.
```

Encerre o turno; o veredito chega como prompt novo. Não peça a outro agente nada que use o compose enquanto ele valida: os testes
dele sobem e derrubam a mesma stack.

Ao receber, confira nos arquivos:
- o `validacao.md` existe e traz a rodada nova;
- `git status` mostra só esse arquivo alterado.

Se o agente mexeu em outro arquivo, desfaça essa mudança e reporte.

## 3. Agir sobre o veredito

### APROVADA, funcionalidade completa

1. Esteira verde **na branch da spec**, no último commit que alterou código: ela rodou sozinha no
   push dele (D79), e quem responde é `node tools/processo/esteira.ts --fechamento`, no andar. Ainda
   rodando: espere com o `gh run watch` que a resposta traz, em segundo plano. Vermelha: `corrigir` na
   branch, e validação de novo. O push da branch do andar é livre.
2. No `ROADMAP.md`, marque a funcionalidade `[x]` e acrescente abaixo do título
   `Concluída em <DD/MM/AAAA>, validada em tasks/prd-<func>/validacao.md.`
3. No `techspec.md`, troque o status para `implementada em <DD/MM/AAAA>`, mantendo o
   histórico de revisões entre parênteses.
4. Leve as **pendências herdadas** ao destino de cada uma:
   - decisão tomada no caminho e não registrada: é parada do Joaquim (`/seguir`, passo 7), e com a
     resposta dele o Arquiteto registra (`registrar-decisao`);
   - item fora do código: `TODO.md`, e o achado **menor** do relatório também, uma linha por achado,
     com dono e data (D79: a ressalva menor não segura o pouso);
   - commit `Fora do processo:` com código da spec: o `validacao.md` os lista na seção 6, com hash e motivo
     (`git log origin/develop..HEAD -i --grep='^Fora do processo:' --format='%h %s' -- apps packages infra e2e tools`).
     Diga ao Joaquim no pedido de pouso que há código que não passou por revisor, e quais commits;
   - recomendação para uma funcionalidade futura: fica na seção 6 do `validacao.md`, e
     `criar-techspec` daquela funcionalidade precisa lê-la.
5. Commit na branch da spec, com push: `Valida <funcionalidade> contra o PRD e fecha F? no
   roadmap`, só com `validacao.md`, `ROADMAP.md`, `techspec.md`, `TODO.md` e o `estado.md`.
6. Peça o pouso: é parada do Joaquim (`/seguir`, passos 7 e 8). Depois do pouso e da esteira da
   `develop` verde, a retrospectiva (`retro`), antes do PRD da próxima.

### APROVADA, escopo de tarefa

Commit só do `validacao.md`. Nada muda no roadmap.

### APROVADA COM RESSALVAS

A ressalva é o achado **maior** (ou o que toca as regras 10, 20 e 70, que nunca é menor); o menor vai
para o `TODO.md` e não é ressalva (D79 revista em 23/10/2026). Não feche a funcionalidade. Apresente os
maiores ao usuário, com a correção sugerida de cada um, e pergunte:
- corrigir agora e revalidar (recomendado quando o maior toca a próxima funcionalidade);
- aceitar a ressalva. Quem escreve é o Orquestrador, com a resposta do Joaquim. A aceitação vai no `validacao.md`, **na própria linha do veredito**, no
  formato `**Veredito: APROVADA COM RESSALVAS** — ressalvas aceitas por <quem> em <data>: <motivo>`,
  e só então a funcionalidade é fechada como no caso APROVADA. É por "aceitas por <quem>" nessa linha
  que `tools/processo/estado.ts` sabe que a parada foi respondida; sem isso a fase continua
  `validacao-com-ressalvas`.

A esteira nunca é ressalva: o Validador não a confere, e ela roda no fechamento (passo 3, item 1).

### REPROVADA

Não feche nada, e **não pare**: reprovação é falha técnica, e o Orquestrador segue (D78). Faça o
commit de documento do `validacao.md` (`/seguir`, passo 4) e trate os críticos e os maiores:
- correção pequena e localizada: `corrigir`, uma execução por achado, com o teste que reproduz, o
  `test-engineer` e os guardiões que o Orquestrador ditar pelo assunto;
- correção que muda o desenho: nova tarefa no `tasks.md`, escrita pelo Arquiteto (`criar-tasks`) e
  executada pelo ciclo do `/seguir`.

Depois das correções, valide de novo, com o Validador reiniciado. A rodada nova entra no topo do
mesmo `validacao.md`.

## 4. Relatório ao usuário

```
Validação — <funcionalidade> (<escopo>)

Veredito: <APROVADA | APROVADA COM RESSALVAS | REPROVADA>
RF: <n> atendidos de <total>
Portão: <resumo> · esteira: <verde | pendente | vermelha>
Críticos: <lista curta ou nenhum>
Maiores: <lista curta ou nenhum>
Feito: <roadmap fechado | nada alterado | correção proposta>
Próximo passo: <comando exato>
```
