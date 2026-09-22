# Correção — a recriação da observabilidade disputa a porta publicada com o contêiner que sai

**Origem:** dois portões locais vermelhos em 22/09/2026, e registrado no `TODO.md` pelo
`infra-guardian` na correção `2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container`
**Subagentes obrigatórios:** `infra-guardian` (ambiente, compose, subida de serviço)
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

`infra/test/alertas.int.test.ts:81` e `infra/test/metricas.int.test.ts:89` abrem o `beforeAll` com

```ts
await composeAssincronoOuFalha('up', '--detach', '--force-recreate', '--wait', 'observabilidade')
```

e o comando falha com o bind da porta publicada ocupado:

```
Error response from daemon: failed to set up container networking: driver failed programming
external connectivity on endpoint educa-teste-observabilidade-1 (…): failed to bind host port
127.0.0.1:59100/tcp: address already in use
```

`59100` é o `PROMETHEUS_PORTA_HOST` (`infra/teste.env:15`), publicado pela observabilidade
(`infra/compose.yml:430`). Dois portões vermelhos em 22/09/2026 por isso, nos dois arquivos.

## Causa

`up --force-recreate` **cria e sobe o contêiner novo sem esperar o anterior soltar a porta.** O
anterior costuma estar parado — o `afterAll` de `infra/test/borda.int.test.ts` e o dos próprios dois
arquivos param os serviços com `stop`, que deixa o contêiner existindo —, e a liberação da publicação
no daemon não é síncrona com o `stop`: o `up` da linha seguinte chega antes, o bind encontra a porta
tomada e o `beforeAll` inteiro morre.

Não é prazo curto: aumentar timeout não muda nada, porque o `up` falha em ~300 ms, na hora do bind.

**Tirar o `--force-recreate` não é conserto.** A imagem `grafana/otel-lgtm` não tem volume, então o
estado vive no contêiner: reaproveitá-lo devolveria série do Prometheus e estado de alerta da
execução anterior, e o ensaio de alertas — que afirma "pendente desde" e "disparado desde" — passaria
a depender de sujeita herdada. O que o `--force-recreate` compra ali é justamente o começo limpo.

O conserto é tornar **a remoção síncrona**: `rm --force --stop` devolve depois de o contêiner ter
sido removido, com a publicação da porta liberada, e só então o `up` cria o novo. Sobra a janela em
que quem segura a porta é outro processo que está saindo (o `down` de uma execução anterior, um
contêiner órfão do mesmo projeto): para ela, nova tentativa curta, **limitada ao erro do bind** —
qualquer outra falha do `up` continua estourando na hora.

## Teste que reproduz

`tools/ci/compose.int.test.ts` › "recria o serviço em contêiner novo e não desiste enquanto a porta
publicada ainda está presa".

O caso reproduz a corrida de forma determinística, no lugar de esperar a intermitência: para o
`oidc-falso`, **segura a porta publicada dele com um listener do próprio teste** por 2 s — que é o
papel do proxy do contêiner que ainda não saiu — e chama a recriação. Medido antes da correção, com
`up --detach --force-recreate --wait`: vermelho em 304 ms, com a mensagem `failed to bind host port
127.0.0.1:58071/tcp: address already in use` e o contêiner parado em `created`. Depois: verde.

As duas asserções cobrem as duas metades da regra, e cada uma fica vermelha sozinha:

- **o contêiner é outro** (id diferente do de antes) — quem "consertar" a intermitência trocando a
  recriação por um `up`/`start` simples religa o contêiner antigo, com a série e o estado de alerta
  da execução anterior, e cai aqui;
- **a recriação termina verde com a porta presa** — quem tirar a nova tentativa cai aqui.

O segundo caso do mesmo arquivo cobre os outros dois estados em que os `beforeAll` chamam o helper: o
serviço **rodando** (o de um arquivo anterior da suíte) e o serviço **ausente** do projeto (ambiente
recém-derrubado).

Por que o `oidc-falso` e não a observabilidade: o que está sob teste é o helper, que não sabe de que
serviço se trata, e o `oidc-falso` já está de pé na integração (`SERVICOS_INFRA`), sobe em segundos e
não tem estado. Com a observabilidade o mesmo caso custaria um minuto de subida e só rodaria no
`--infra`.

### O laço, em `tools/testes/compose.test.ts`

Exigido pelo `test-engineer` na 1ª rodada, e ele estava certo: com a porta presa de verdade, as duas
metades **novas** da regra continuavam sem prova — apagar qualquer uma delas deixava a suíte inteira
verde. Elas não aparecem contra o Docker sem quebrar um serviço de propósito, então são provadas
contra um compose falso, pela costura `executar` (mock é para o que está fora — regra 40). Cada caso
foi conferido por mutação, um mutante de cada vez:

| Se apagar | Fica vermelho |
|---|---|
| `!PORTA_OCUPADA.test(...)` (repetir qualquer falha) | "falha do `up` que não é a porta ocupada estoura na primeira tentativa" |
| `tentativa === TENTATIVAS_COM_A_PORTA_OCUPADA` (laço sem fim) | "porta ocupada além do orçamento estoura na quinta volta" |
| a checagem do código do `rm` | "remoção que falha estoura sem tentar subir" |
| o `rm` antes de cada `up` | "repete enquanto a porta está ocupada, e remove antes de cada subida" |

O que a primeira linha da tabela evita é concreto: a observabilidade tem `retries: 60` e
`interval: 2s`, então um `up --wait` de serviço quebrado custa ~2 min. Repetindo qualquer falha, o
vermelho que estes dois arquivos existem para dar sairia em ~10 min, com a saída da **última**
tentativa, dentro de um portão que já custa 20 min.

## Correção

`recriarDoZero(servico)` em `tools/testes/compose.ts`: `rm --force --stop` e depois
`up --detach --wait`, com nova tentativa só quando a saída traz `address already in use` — cinco
tentativas, 1 s entre elas. O `rm` de cada volta também limpa o contêiner que a tentativa anterior
deixou em `created`.

Os dois `beforeAll` passam a chamar o helper, como o `infra-guardian` exigiu ("aplicar nos dois
arquivos, senão o vermelho migra de arquivo"). A linha do `TODO.md` sai.

O helper recebe o executor do compose por argumento, com o real por padrão. É costura de teste, e só:
foi ela que permitiu provar o laço. Ela **não** serve de imediato ao ensaio de alertas — o executor de
lá leva a sobreposição de ambiente no primeiro argumento (`infra/scripts/ensaio-alertas.ts:131`), então
o irmão registrado no `TODO.md` precisaria de um invólucro para caber em `ExecutorDeCompose`.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-22 12:19:39 | 2026-09-22 12:24:09 | `test-engineer` | 1 | REPROVADO | a425faf5a4d2a306e |
| 2026-09-22 12:54:38 | 2026-09-22 12:56:09 | `test-engineer` | 2 | APROVADO | a944dccfd2bb1ab19 |
| 2026-09-22 12:56:34 | 2026-09-22 12:59:51 | `infra-guardian` | 1 | APROVADO | a83e935b2335b60b4 |
| 2026-09-22 12:56:41 | 2026-09-22 13:01:50 | `revisor-geral` | 1 | REPROVADO | a3a24a8a0fb057611 |
| 2026-09-22 13:31:32 | 2026-09-22 13:34:53 | `test-engineer` | 3 | APROVADO | aede13113be21babf |
| 2026-09-22 13:35:12 | 2026-09-22 13:37:58 | `revisor-geral` | 2 | APROVADO | a8cefe1b80f4b6814 |
