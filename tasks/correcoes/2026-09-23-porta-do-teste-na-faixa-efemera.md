# Correção — as portas publicadas do compose de teste ficam na faixa efêmera, e o religar de um serviço falha

**Origem:** esteira run 35884794643 (commit `9a9d5c5`, job `infra`)
**Subagentes obrigatórios:** `infra-guardian` (ambiente de teste e de carga, `infra/`)
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

Em `infra/test/borda.int.test.ts`, depois de "API não depende do resto (RF2)", o `afterEach` religa os
serviços e o `realtime-2` não sobe: `failed to bind host port for 127.0.0.1:53112:172.18.0.14:3000/tcp:
address already in use`. Os outros três vermelhos da execução são cascata (a borda só tem o
`realtime-1`: "sem o cookie" recebe 20 × 200, "um realtime morre" fica sem instância, "nada de
requisição no log" espera 180 s o `realtime-2` voltar). O commit só mexia em docs.

## Causa

Todas as `*_PORTA_HOST` de `infra/teste.env` e `infra/carga.env` (53010 a 59120) ficavam dentro da
faixa efêmera padrão do Linux (`ip_local_port_range` = 32768–60999, a mesma nesta máquina e no runner
`ubuntu-24.04`). Com o `realtime-2` parado, a porta 53112 fica livre, e qualquer conexão de saída do
próprio processo de teste para 127.0.0.1 (a rajada contra a borda, o Postgres, o Redis) pode recebê-la
do kernel como porta de origem. Enquanto essa conexão está aberta, o `bind` do Docker ao religar o
serviço falha. Não é tempo de soltar a porta: o `start` veio mais de 30 s depois do `stop`.

**Reproduzido nesta máquina**, contra o compose de teste: com o `realtime-2` parado, um socket comum
(sem `SO_REUSEADDR`, como a porta de origem que o kernel sorteia) ligado a 127.0.0.1:53112 e conectado
à borda faz o `compose start realtime-2` falhar com a mesma mensagem da esteira ("failed to bind host
port 127.0.0.1:53112/tcp: address already in use"); fechado o socket, o serviço sobe. Com um socket do
Node o erro não aparece, porque o libuv liga o `SO_REUSEADDR` no `bind` explícito — detalhe que explica
por que a falha é rara.

A mesma classe provavelmente explica o 59100 da correção
`2026-09-22-corrida-de-porta-na-observabilidade`, que também ficava na faixa.

## Teste que reproduz

`tools/ci/ambiente.test.ts › as portas publicadas dos ambientes de teste e de carga ficam abaixo da
faixa efêmera do Linux`: vermelho antes (na 1ª versão, `API_1_PORTA_HOST: expected 53011 to be less
than 32768`), verde depois. Ele confere o ambiente que o compose de fato sobe (`.env.example` com a
sobreposição por cima, por `lerAmbienteDeTeste` e `lerAmbienteDeCarga`), com as portas tiradas do
`ports:` de `infra/compose.yml` e `infra/compose.carga.yml`: uma porta nova que a sobreposição esquecer
herda a do desenvolvimento, que está na faixa, e falha com o nome dela (`test-engineer`, rodada 1).
Mutações, com o arquivo restaurado depois: sem `REALTIME_2_PORTA_HOST` no `teste.env` →
`teste: REALTIME_2_PORTA_HOST: expected 53102 to be less than 32768`; sem `WEB_PORTA_HOST` no
`carga.env` → `carga: WEB_PORTA_HOST: expected 58080 to be less than 32768`. A reprodução do mecanismo contra o compose está descrita acima; ela não
vira teste automático porque depende de prender uma porta do host, que é justamente o que o conserto
tira de alcance.

## Correção

As portas de `infra/teste.env` e `infra/carga.env` descem 30.000, com os mesmos finais (53010 → 23010,
58090 → 28090…), e o `LOGIN_EXTERNO_RETORNO_URL` acompanha a web. A faixa 23000–29999 fica abaixo da
efêmera, acima de 1024 e longe das portas bem conhecidas; serviço novo nos ambientes de teste e de carga
escolhe porta aí, e não por analogia com o `.env.example`. Nada no código lê porta fixa: tudo
vem dos dois arquivos. O `.env.example`, do ambiente de desenvolvimento, continua como está: nenhum
fluxo de desenvolvimento para e religa serviço no meio de uma execução, que é o que abre a janela.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-23 15:00:25 | 2026-09-23 15:01:24 | `test-engineer` | 1 | REPROVADO | afee261f58869e48b |
| 2026-09-23 15:02:25 | 2026-09-23 15:02:50 | `test-engineer` | 2 | APROVADO | a834bbac3468a746e |
| 2026-09-23 15:03:22 | 2026-09-23 15:04:11 | `infra-guardian` | 1 | APROVADO | a9cf5dc200aaddf4d |
