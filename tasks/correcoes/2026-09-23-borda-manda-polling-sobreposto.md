# Correção — o teste da borda manda POSTs de polling sobrepostos, que o engine.io recusa

**Origem:** esteira run 35890116711 (commit `8f2fa23`, job `infra`)
**Subagentes obrigatórios:** `infra-guardian` (teste da borda, `infra/`)
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

Em `infra/test/borda.int.test.ts`, "handshake por polling fica na mesma instância pelo cookie da
borda" esperava 20 respostas 200 e recebeu 6 × 200, um 503 e 13 × 400. É a mesma assinatura ("503
seguido de 400 em cascata") que o `TODO.md` registra desde 20/09/2026. O commit só mexia em docs.

## Causa

O teste mandava os 20 POSTs **em paralelo** no mesmo `sid` (`Promise.all`). O engine.io 6.6.10 recusa
POST concorrente no mesmo transporte (`node_modules/engine.io/build/transports/polling.js:91-96`,
"data request overlap from client"): responde 400 e fecha o transporte, e o `doClose` destrói o POST
que estava em andamento (`:299`), que a borda converte em 503. Os seguintes recebem 400 "Session ID
unknown". O verde dependia de o Caddy entregar os POSTs um depois do outro — sorte de agendamento,
que some com o runner carregado. Nesse intervalo a borda não teve nenhuma troca de sonda: não foi
instância saindo do balanceamento. O cliente real nunca sobrepõe, porque o engine.io-client enfileira.

## Teste que reproduz

`infra/test/borda.int.test.ts › realtime pela borda › o engine.io recusa POST sobreposto no mesmo
sid`: abre um POST por socket cru com o corpo retido e manda outro no mesmo `sid`, esperando por
condição (não por tempo) até o primeiro chegar ao realtime. Confere antes que o cookie da borda veio
(sem ele, o 400 poderia ser o de sessão desconhecida, da outra instância). O segundo recebe 400 **com
corpo vazio**, que é a resposta da sobreposição (`polling.js:94`), e o seguinte recebe 400 com
`{"code":1,"message":"Session ID unknown"}`: foi a sobreposição que fechou o transporte.
É a prova determinística do que o teste antigo afirmava ao contrário; o vermelho do teste antigo é
o da esteira citada.

## Correção

O caso "handshake por polling" manda os 20 pacotes em sequência, como o cliente real e como o caso
vizinho ("sem o cookie") já fazia. O que ele prova não muda: com o cookie, os 20 caem na mesma
instância. A outra falha da borda da mesma semana (porta do host tomada na religação do
`realtime-2`, run 35884794643) tem outra causa e vai em correção própria.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-23 14:24:05 | 2026-09-23 14:25:03 | `test-engineer` | 1 | REPROVADO | a1ed60200b9a26fda |
| 2026-09-23 14:26:49 | 2026-09-23 14:27:17 | `test-engineer` | 2 | APROVADO | afb631d71d974cacc |
| 2026-09-23 14:27:26 | 2026-09-23 14:28:30 | `infra-guardian` | 1 | APROVADO | adfa54d0f918d386b |

O socket cru ganha um ouvinte de `error`: quando a sobreposição fecha o transporte, a borda fecha a
conexão com o corpo pendente, e um `ECONNRESET` sem ouvinte derrubaria o worker do vitest
(`infra-guardian`, rodada 1). Fica aceita uma janela de menos de 1 ms na primeira tentativa, em que o
POST do `fetch` chegaria ao realtime antes do cru: o cabeçalho cru já foi escrito numa conexão
aberta antes de o `fetch` abrir a sua.
| 2026-09-23 14:29:09 | 2026-09-23 14:29:27 | `infra-guardian` | 2 | APROVADO | a084bbd9125a63c34 |
| 2026-09-23 14:29:06 | 2026-09-23 14:29:29 | `test-engineer` | 3 | APROVADO | acb1fcd351b9f042a |
Se esse caso ficar vermelho com o corpo `{"code":1,"message":"Session ID unknown"}` no lugar do vazio,
olhe primeiro essa janela: o cru levou o 400 e o `fetch` levou o 503. A premissa do caso é a borda
repassar o cabeçalho antes do corpo; se o `reverse_proxy` passar a juntar o corpo (`request_buffers`),
o laço esgota as tentativas e o caso precisa ser refeito.
