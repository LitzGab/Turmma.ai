# Correção — a resposta atrasada de um pedido de criação fecha o diálogo do mesmo tipo reaberto depois

**Origem:** revisão da tarefa 6.0 de `apresentacao-painel` (`tasks/prd-apresentacao-painel/achados/6_task.md`, última
rodada do `frontend-reviewer`), commit `6146a6c`
**Subagentes obrigatórios:** frontend-reviewer
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

No painel da operação, o operador abre Nova escola, envia, cancela com o `POST` ainda no ar e reabre Nova escola (o id
do pedido é sorteado de novo). A resposta do primeiro pedido chega e fecha o diálogo novo, com o que já foi digitado nele,
e o anúncio "Escola X criada." aparece como se fosse a do formulário que estava aberto. O mesmo vale para Nova rede. A
nota da 6.0 (`6_task.md`) diz "só o diálogo que criou é fechado", o que é mais forte do que o código faz.

## Causa

`Escolas.tsx` guardava o diálogo aberto só pelo **tipo** (`'rede' | 'escola' | undefined`), e o `aoCriar` de cada diálogo
fechava com `definirDialogo((aberto) => aberto === 'escola' ? undefined : aberto)`. O `onSuccess` do `useMutation` do
diálogo fica preso à mutação e roda mesmo depois de o diálogo desmontar; quando a resposta chega, a guarda só sabe que há
"um Nova escola" aberto, não **qual** abertura. A reabertura do mesmo tipo passa na guarda e é fechada. O e2e da 6.0
cobria só a troca de tipo (escola para rede), onde a guarda por tipo basta.

## Teste que reproduz

`e2e/operacao-escolas.spec.ts › Escolas, Nova rede e Nova escola (A0b, tarefa 6.0) › clique duplo e resposta perdida: o
mesmo id do pedido, e uma escola só`, no trecho novo "reabrir o mesmo diálogo com o pedido no ar": cancela com o `POST`
seguro, reabre o mesmo diálogo, digita outro nome e só então solta a resposta; o diálogo reaberto tem de continuar aberto,
com o nome digitado, nos dois diálogos (Nova escola e Nova rede). Vermelho antes da correção (o diálogo reaberto fecha),
verde depois.

A regra pura fica provada também em `apps/web/src/operacao/dialogo-aberto.test.ts`.

O pedido era um teste de componente em Vitest, mas o `apps/web` não tem ambiente de DOM (nem `jsdom` nem Testing
Library): os testes dele são de função pura, e a tela é provada pelo Playwright. Trazer um ambiente de DOM para uma
correção é dependência nova fora do mínimo; o e2e já existente da resposta atrasada é o lugar da reprodução.

## Correção

Cada abertura de diálogo passa a ser uma instância com número próprio. O utilitário novo
`apps/web/src/operacao/dialogo-aberto.ts` tem `useDialogoDaTela<Tipo>()` (`aberta`, `abrir`, `fechar`, `fecharSeAinda`) e a
regra pura `fecharSeAindaAberta`, que fecha só se a abertura em que o pedido saiu ainda é a aberta (comparando o número,
não o tipo). `Escolas.tsx` usa o hook no lugar do `useState<'rede' | 'escola' | undefined>`, passa o `numero` como `key`
de cada diálogo (a abertura nova nunca herda o estado da anterior) e o `aoCriar` de cada um chama
`fecharSeAinda(aberta)` com a abertura capturada no render em que o pedido saiu. O anúncio continua saindo, como antes:
a rede ou a escola foi mesmo criada. `NovaRede` e `NovaEscola` não mudaram.

Os diálogos do convite da tarefa 7.0 (gerar, refazer, revogar) reaproveitam o mesmo hook.

A frase de `tasks/prd-apresentacao-painel/6_task.md` ("só o diálogo que criou é fechado") foi reescrita para o que o
código agora faz, com a referência a esta correção.

Evidência do vermelho: com o e2e novo e o código de `6146a6c`, os dois projetos falham na linha que espera o Nova escola
reaberto; com a correção só no Nova escola, o chromebook falha na linha que espera o Nova rede reaberto. Com a correção
inteira, os 14 testes de `operacao-escolas.spec.ts` passam.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-25 05:38:13 | 2026-09-25 05:39:10 | `test-engineer` | 1 | APROVADO | a5f92dbafcc4ff8ee |
| 2026-09-25 05:39:16 | 2026-09-25 05:40:14 | `frontend-reviewer` | 1 | APROVADO | aac9d2489e8bf5c8d |
