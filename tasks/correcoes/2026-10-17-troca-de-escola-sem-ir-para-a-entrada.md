# Correção — o código de ativação do segundo fator, gerado 30 s atrás, sai da janela da API quando a virada do passo cai entre a geração e a conferência

**Origem:** esteira run 39062201162 da `spec/telas-da-coordenacao` (`91d4722`): `e2e/painel-da-coordenacao.spec.ts:187` (`a troca de escola pelo seletor › o Painel da escola B não traz os números nem o item da A, nem enquanto carrega`) em `Test timeout of 90000ms exceeded` no `chromebook`, na linha 203 (`Ir para a entrada`). 1 falha em 181. Verde até `5ecda3f`; o pedido perguntava se o defeito é da tela ou do teste.
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
<!-- Os dois vieram no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção mexe em quatro arquivos fora de `tasks/` (a fixture, o teste novo e dois specs), abaixo do limite de 5, e fora de `.github/`, `tools/ci/` e `tools/processo/`. O teste novo mora em `tools/ci/` porque o vitest ignora `e2e/` e o Playwright pegaria um `.test.ts` ali; não é código da esteira. -->

## Sintoma

```
Test timeout of 90000ms exceeded.
Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: 'Ir para a entrada' })
> 34 |   else await alvo.click()          (acionar, chamado na linha 203 do spec)
```

O mesmo caso passou no `celular` da mesma execução. O `error-context.md` do traço (`traco-do-e2e-2`) mostra a tela parada em "Configurar o segundo fator", com o código `539118` digitado e o alerta **"Código incorreto ou já usado. Confira o código que o aplicativo mostra agora e tente de novo."**: a ativação foi recusada, e por isso o link da tela dos códigos de recuperação nunca apareceu.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa.

## Causa

**É do teste, não da tela, e não veio da 11.0.** O diff de `5ecda3f` a `HEAD` não toca a API, as fixtures de sessão nem a tela de `ConfigurarMfa` (só Agentes, `dialogos.tsx` e testes): o "primeiro vermelho depois da 11.0" é coincidência de relógio.

O caso ativa o segundo fator com o código do passo **anterior** (`codigoDoAutenticador(segredo, -30)`), para que o login (agora) e a troca de escola (um passo à frente, `+30`) entrem em ordem crescente de passo sem esperar meio minuto (`mfa_ultimo_passo`). A API confere com `JANELA_TOTP = 1`: aceita os passos `s'-1`, `s'` e `s'+1`, sendo `s'` o passo do servidor **na hora da conferência**. O código de `-30` é o do passo `s-1`, com `s` o passo da hora em que o teste o gerou: ele só vale enquanto `s' ≤ s`, ou seja, **só se nenhuma virada de passo (de 30 em 30 s, nos segundos :00 e :30 do relógio) cair entre a geração e a conferência**. Passou a virada, `s' = s+1`, a janela é `[s, s+2]` e o código de `s-1` fica de fora. O `0` e o `+30` não têm o problema: o tempo só anda para frente.

O traço prova, e não só sugere:

| O que | Quando (UTC) |
|---|---|
| virada do passo | 19:43:00.000 |
| o pedido `POST /v1/conta/mfa/ativar` chegou ao servidor | 19:43:00.249 (401, 584 ms de resposta na rede do perfil) |
| o `fill` do código e o `click` em "Ativar" | 225 ms um do outro, o `fill` no máximo uns 0,3 s antes |

O código foi gerado antes das 19:43:00 e conferido 249 ms depois. A janela entre gerar e conferir é de uns 0,5 a 1 s no `chromebook` (a latência do perfil entra), sobre 30 s: de 2% a 3% das vezes o caso cai nela. O `celular` tem o mesmo risco e não caiu nesta execução. `e2e/sino-da-coordenacao.spec.ts:188` faz o mesmo passo a passo e tem o mesmo defeito.

## Teste que reproduz

`tools/ci/codigo-do-autenticador.test.ts › o código do passo anterior, gerado a 100 ms da virada, ainda vale quando a API o confere 1 s depois`. Relógio falso (`vi.useFakeTimers`), a hora fixada a 100 ms antes de uma virada, o código que a fixture entrega e o `passoDoCodigo` da própria API conferindo 1 s depois: é o caso do traço, sem esperar a sorte da esteira.

Vermelho antes da correção: o código de `-30` gerado a 100 ms da virada volta `undefined` na conferência (`expected undefined to be defined`).

## Correção

Só teste e fixture mudam; o produto não.

- `e2e/__fixtures__/sessao.ts`: `codigoDoPassoAnterior(segredo)`, que **espera a virada do passo quando faltam 5 s ou menos para ela** e só então gera o código de `-30`. A API o aceita por 30 s depois disso, contra 1 s de folga antes. `esperaPelaViradaDoPasso(agoraMs)` é a conta pura, exportada para o teste. Custo: até 5 s de espera em 1 caso de cada 6.
- `e2e/painel-da-coordenacao.spec.ts` e `e2e/sino-da-coordenacao.spec.ts`: a ativação passa a `await codigoDoPassoAnterior(segredo)`.

O que **não** muda: a tela, a API, a janela do TOTP e o `+30` da troca.

## Estabilidade

`npx playwright test e2e/painel-da-coordenacao.spec.ts e2e/sino-da-coordenacao.spec.ts -g "troca de escola pelo seletor" --repeat-each 10 --workers 2`: **40 de 40 verdes** (os dois casos, dez vezes em cada projeto), o mais lento a 22,9 s. A corrida em si não se reproduz no e2e de propósito (depende de cair a 0,3 s de uma virada de 30 s): quem a prova, de forma determinística, é o teste de unidade com o relógio falso, acima. Os dois specs inteiros, antes das dez repetições: 22 de 22 verdes.

## Mutações

```mutacao
arquivo: e2e/__fixtures__/sessao.ts
teste: tools/ci/codigo-do-autenticador.test.ts › o código do passo anterior, gerado a 100 ms da virada, ainda vale quando a API o confere 1 s depois
-  return faltam <= margemMs ? faltam + FOLGA_DA_VIRADA_MS : 0
+  return 0
```

O limite exato (1ª ordem da Mesa, item 2): faltando 5 000 ms a fixture espera, e o `<=` é a comparação que prova isso.

```mutacao
arquivo: e2e/__fixtures__/sessao.ts
teste: tools/ci/codigo-do-autenticador.test.ts › só espera quando a virada está a 5 s ou menos: no começo e no meio do passo a espera é zero
-  return faltam <= margemMs ? faltam + FOLGA_DA_VIRADA_MS : 0
+  return faltam < margemMs ? faltam + FOLGA_DA_VIRADA_MS : 0
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | "O caso da escola cheia mostra "Segunda linha do texto.", que é dado sintético da fixture … na vitrine de demonstração convém um texto de incidente mais realista." | Recusada nesta correção: é dado da vitrine/fixture do incidente, fora dos quatro arquivos da correção, que não toca tela nem produto. Fica para o Orquestrador, se quiser a vitrine mais realista |
| frontend-reviewer (1ª) | "No celular, o título "Incidente de segurança sem ..." fica truncado no cartão do Painel … Dá para deixá-lo quebrar em duas linhas … Não vem desta tarefa." | Não aplicar: é tela do Painel (apps/web), e esta correção é só de teste e fixture. Destino: o Orquestrador, na validação da spec X2 ou em tarefa que toque o cartão do Painel |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-17 17:20:52 | 2026-10-17 17:21:17 | `frontend-reviewer` | 1 | APROVADO | af2ea9c46f857b7ca |
| 2026-10-17 17:20:55 | 2026-10-17 17:21:17 | `privacy-guardian` | 1 | APROVADO | ad1d05381dc25fe03 |
| 2026-10-17 17:20:58 | 2026-10-17 17:21:42 | `test-engineer` | 1 | APROVADO | a0bbcc133c5ba7657 |
| 2026-10-17 17:26:40 | 2026-10-17 17:27:04 | `test-engineer` | 2 | APROVADO | aa1405f877198f47e |
