# Correção — o caso "troca de escola pelo seletor" de `areas.spec.ts` estoura o `page.goto('/entrar')` em 30 s no celular da esteira

**Origem:** esteira run 40332902053 (commit `d6b82ea8`), job `e2e 5/8`, `e2e/areas.spec.ts:619` (`celular`); os outros 183 casos do shard passaram. Pedido do Orquestrador em 26/10/2026.
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`, `infra-guardian`, `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. `revisor-geral` já é obrigatório em toda correção. -->

## Sintoma

```
Error: page.goto: Test timeout of 30000ms exceeded.
  - navigating to "http://127.0.0.1:28090/entrar", waiting until "load"
> 622 |     await page.goto('/entrar')
```

O caso leva 15,0 s no `celular` e 13,5 s no `chromebook` nas execuções verdes de hoje (40268260411 e 40274377827) e 30,2 s nesta: não é lentidão, é uma trava.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa.

## Causa

**Uma trava da primeira carga sob a rede emulada, no navegador; não é a tela, a API nem o servidor da web.** O traço da esteira (`traco-do-e2e-5`, `trace.zip`) mostra, depois do `goto`:

- o documento `/entrar` respondeu 200 em 618 ms, e quatro `parte-*.js` (`coerce`, `jsx-runtime`, `Botao`, `login`) em 0,7 a 0,9 s, cada um numa conexão nova, de modo que o servidor atendeu;
- os outros **14 pedidos** (`index-*.js`, `parte-iso` e mais oito `parte-*.js`, o CSS) foram criados no mesmo instante e **nunca receberam resposta** nos 29 s restantes. Neles o traço não tem nem os cabeçalhos que o navegador manda na rede: não saíram do navegador. Até o `parte-token`, de 93 bytes, ficou parado, e as cinco conexões que já tinham respondido ficaram ociosas. Falta de banda não explica; o servidor também não, porque ele nunca viu esses pedidos;
- o JavaScript da página nunca chegou a rodar, e o `load` não veio.

É a mesma assinatura da correção `2026-10-17-casca-carregando-estoura-o-goto` (documento 200 e os pedidos seguintes sem resposta), em outro caso e outro projeto de perfil. Aquela correção deixou escrito que, se a trava voltasse em outro caso, a investigação iria para o servidor estático (`vite preview`) e não para mais um `carregarSemRedeLenta`. A investigação foi feita, e o traço **exclui o servidor**: os pedidos parados não chegaram a ele. O que sobra é a limitação de rede do perfil (`Network.emulateNetworkConditions`), que é a única coisa que fica entre o navegador e o servidor neste ambiente.

Vizinhos do mesmo job, no mesmo minuto, carregaram a mesma página em segundos, e o código do caso e da tela de entrada não mudou nesta spec. Duas ocorrências em nove dias, ambas na primeira carga de um contexto novo; não há fio de código para consertar.

O que é do teste é depender dessa carga: o caso afirma que a gaveta fecha na troca de escola, e **não afirma nada sobre o tempo de baixar `/entrar` na rede lenta**. Esse tempo é medido onde ele é medido (o orçamento do build e os specs de tela com API). Existe `carregarSemRedeLenta` (`e2e/__fixtures__/perfis.ts`) para a primeira carga de um caso assim, e este não o usava.

## Teste que reproduz

**Não há vermelho determinístico**, e a razão está na causa: é uma trava do navegador sob a rede emulada, que aconteceu duas vezes em nove dias e em centenas de milhares de cargas. Na máquina, antes da correção: `npx playwright test e2e/areas.spec.ts -g "troca de escola pelo seletor" --project celular --repeat-each 15 --workers 2` passou **15 de 15**, sem reproduzir (a correção de 17/10 também não reproduziu em 50). A evidência que substitui o vermelho é o traço da esteira descrito na "Causa" (os 14 pedidos que não saíram do navegador, com o servidor respondendo os outros cinco), e a prova depois é a estabilidade e a duração.

## Correção

Só teste muda; o produto não, e a cobertura é a mesma.

`e2e/areas.spec.ts`: a primeira carga do caso (`page.goto('/entrar')`) passa a `carregarSemRedeLenta(page, () => page.goto('/entrar'))`, e o import ganha o auxiliar. A CPU continua limitada e a rede do perfil volta logo depois do `goto`; a entrada por e-mail, a escolha da escola, a troca pelo seletor e as asserções da gaveta continuam na rede do perfil, como estavam. O comentário no código diz por quê.

Depois: o caso repetido 20 vezes em cada projeto com 2 trabalhadores (a esteira dá 2): **40 de 40 verdes**. Duração sozinho: 10,8 a 11,0 s no `celular` (15,0 s antes, nas execuções verdes da esteira; a máquina é mais rápida que o runner) e 10,1 s no `chromebook`.

**O que a correção não prova.** Ela tira da primeira carga deste caso a limitação de rede onde a trava aconteceu; não demonstra que a limitação seja a causa, porque a trava não se reproduz. Os outros 104 `page.goto('/entrar')` do e2e (e as demais primeiras cargas) seguem expostos à mesma trava rara, na rede do perfil, que é o que a regra 50.1 manda medir. Tirar a rede do perfil de todos eles seria perder essa medida; por isso não é feito aqui.

## Mutações

Nenhuma. A mudança é só de teste e tira uma causa de ambiente: remover o `carregarSemRedeLenta` deixa o caso verde na máquina, como antes, e não há teste que fique vermelho sem ele. Fingir um bloco `mutacao` seria afirmar um vermelho que não acontece.

## Recomendações sem aplicar

| Origem | Recomendação | Destino ou motivo |
|---|---|---|
| Esta correção | Se a trava aparecer uma terceira vez, em qualquer caso, a investigação sobe para o harness (`e2e/__fixtures__/perfis.ts`): reproduzir com laço de contextos novos que só fazem `goto` sob o perfil e comparar com e sem a limitação, e, se confirmado, pôr nova tentativa da primeira navegação no fixture. Mais um `carregarSemRedeLenta` por caso não escala (105 cargas de `/entrar`) | `/retro` da spec telas-do-aluno-e-primeiro-acesso; não é mudança de código desta correção |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-26 11:42:47 | 2026-10-26 11:43:03 | `privacy-guardian` | 1 | APROVADO | aa83257441457fd1d |
| 2026-10-26 11:42:48 | 2026-10-26 11:43:04 | `conformidade-reviewer` | 1 | APROVADO | a784f962175e8fec8 |
| 2026-10-26 11:42:45 | 2026-10-26 11:43:06 | `infra-guardian` | 1 | APROVADO | a726698ef30d17f49 |
| 2026-10-26 11:42:44 | 2026-10-26 11:43:09 | `revisor-geral` | 1 | APROVADO | a9e732a6b1926e109 |
| 2026-10-26 11:42:43 | 2026-10-26 11:43:12 | `test-engineer` | 1 | APROVADO | a8e576dd8291145a4 |
| 2026-10-26 11:42:46 | 2026-10-26 11:43:13 | `tenancy-guardian` | 1 | APROVADO | a67902fa1e377877a |
| 2026-10-26 11:50:20 | 2026-10-26 11:50:30 | `revisor-geral` | 2 | APROVADO | a103f486dfa443f45 |
