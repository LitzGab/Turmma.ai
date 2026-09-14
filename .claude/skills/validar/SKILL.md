---
name: validar
description: Valida a funcionalidade implementada contra o PRD, RF a RF, em contexto independente, e fecha a funcionalidade no roadmap quando aprovada
argument-hint: <funcionalidade> [número da tarefa]
---

Você obtém uma validação **independente** do que foi implementado contra o que o PRD
prometeu, e age sobre o veredito.

Este comando existe porque "todas as tarefas `[x]`" não é "funcionalidade pronta". Cada
tarefa passou pelo portão dela, com os revisores dela, olhando um pedaço. Ninguém ainda
conferiu a funcionalidade inteira contra os RF, os casos de borda e o critério de pronto.
É o último portão antes de marcar `[x]` no roadmap e começar a próxima em cima desta base.

<critical>A validação é feita pelo agente `validador`, em contexto limpo. Não valide você
mesmo: quem acompanhou a execução tende a aceitar o que já leu no relatório.</critical>
<critical>Evidência é arquivo, linha e teste executado. Nunca aceite "parece coberto".
Qualquer portão vermelho reprova, mesmo que pareça intermitente.</critical>
<critical>Não marque a funcionalidade como concluída sem veredito APROVADA e esteira verde
no commit validado.</critical>

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
  ainda. Aponte `/executar-tasks`.
- **Escopo de tarefa** que não está `[x]`: pare e reporte.

## 2. Disparar o validador

Dispare o agente `validador`, sem nenhum contexto de implementação desta sessão:

```
Valide contra o PRD e a Tech Spec, seguindo integralmente `.claude/agents/validador.md`.

Funcionalidade: tasks/prd-<func>/
Escopo: funcionalidade completa | tarefa N.0 (tasks/prd-<func>/N_task.md)
Commit a validar: <hash do HEAD>

Escreva o relatório em tasks/prd-<func>/validacao.md e não altere nenhum outro arquivo.
Espere em primeiro plano todo teste longo, e só termine com o relatório escrito.
Retorne só o bloco "Formato da resposta".
```

Aguarde o veredito. Não rode outra coisa que use o compose enquanto ele valida: os testes
dele sobem e derrubam a mesma stack.

Ao receber, confira nos arquivos:
- o `validacao.md` existe e traz a rodada nova;
- `git status` mostra só esse arquivo alterado.

Se o agente mexeu em outro arquivo, desfaça essa mudança e reporte.

## 3. Agir sobre o veredito

### APROVADA, funcionalidade completa

1. Esteira do GitHub verde no commit validado. Se estiver pendente, espere a execução. Se o
   commit ainda não foi enviado, pergunte antes de fazer o push.
2. No `ROADMAP.md`, marque a funcionalidade `[x]` e acrescente abaixo do título
   `Concluída em <DD/MM/AAAA>, validada em tasks/prd-<func>/validacao.md.`
3. No `techspec.md`, troque o status para `implementada em <DD/MM/AAAA>`, mantendo o
   histórico de revisões entre parênteses.
4. Leve as **pendências herdadas** ao destino de cada uma:
   - decisão tomada no caminho e não registrada: proponha `/registrar-decisao` e espere o
     usuário;
   - item fora do código: `TODO.md`;
   - recomendação para uma funcionalidade futura: fica na seção 6 do `validacao.md`, e
     `/criar-techspec` daquela funcionalidade precisa lê-la.
5. Commit direto no `main` (D23): `Valida <funcionalidade> contra o PRD e fecha F? no
   roadmap`, só com `validacao.md`, `ROADMAP.md`, `techspec.md` e `TODO.md`.

### APROVADA, escopo de tarefa

Commit só do `validacao.md`. Nada muda no roadmap.

### APROVADA COM RESSALVAS

Não feche a funcionalidade. Apresente os maiores ao usuário, com a correção sugerida de
cada um, e pergunte:
- corrigir agora e revalidar (recomendado quando o maior toca a próxima funcionalidade);
- aceitar a ressalva. A aceitação vai escrita no `validacao.md`, com quem aceitou e o motivo,
  e só então a funcionalidade é fechada como no caso APROVADA.

Se a única ressalva for a esteira pendente, espere a esteira e trate como APROVADA quando
ela ficar verde.

### REPROVADA

Não feche nada. Apresente os críticos e os maiores, e proponha o caminho:
- correção pequena e localizada: um subagente de correção com o achado exato, o
  `test-engineer` na revisão, e os revisores com veto que o assunto exigir;
- correção que muda o desenho: nova tarefa no `tasks.md` via `/criar-tasks`, executada por
  `/executar-tasks`.

Depois da correção, rode `/validar` de novo. A rodada nova entra no mesmo `validacao.md`.

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
