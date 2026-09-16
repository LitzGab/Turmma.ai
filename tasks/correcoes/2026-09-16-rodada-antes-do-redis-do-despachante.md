# Correção — a primeira rodada do despachante de teste corre antes de o Redis dele conectar, e o teste lê 0 como resultado

**Origem:** teste intermitente na esteira, run 35040908588 (commit 2b26fae, tarefa 2.0)
**Subagentes obrigatórios:** `infra-guardian`, `test-engineer`

## Sintoma

`apps/despachante/test/janela.int.test.ts:123`, no teste
*"borda: interativa e normal com a marca de não urgente nunca são seguradas"*:

```
AssertionError: expected +0 to be 2 // Object.is equality
 ❯ apps/despachante/test/janela.int.test.ts:123:40
```

1 de 267 testes da integração; os outros 12 do mesmo arquivo passaram. Falhou em 65 ms. Não
reproduz localmente: o arquivo passa 5/5 isolado e a suíte inteira passa 267/267 em 4m11s. É a
terceira esteira vermelha seguida em teste de fila diferente, depois de `7dfbd81` (fechada pela
correção `2026-09-15-vaga-conferida-antes-de-ser-liberada`).

## Causa

Não é o relógio nem a janela letiva: é a conexão do Redis do próprio despachante.

`criarClienteRedisDaFila` sobe o cliente com `enableOfflineQueue: false`
(`packages/nucleo/src/redis/clientes.ts:45`). É decisão de desenho, e está certa em produção: com
o Redis fora, o comando falha na hora em vez de acumular fila. A consequência é que **um comando
emitido antes de o cliente ficar `ready` também falha na hora**, com
`Stream isn't writeable and enableOfflineQueue options is false`.

Na rodada, o primeiro comando de Redis é `vagas.membros(...)`
(`apps/despachante/src/despachante.ts:163`). Quando ele falha, `despacharDaEscola` devolve
`'vaga_indisponivel'` e `rodada()` **encerra ali e devolve o que já publicou** — zero, se foi na
primeira fila. Isso também é desenho correto: o comentário de `criarClienteRedisDaFila` diz que
quem publica de novo é a rodada seguinte, e em produção o laço faz exatamente isso.

O defeito está no teste, não no despachante. `ioredis` conecta de forma assíncrona: logo depois de
`montarDespachante` o cliente está sempre em `connecting`. O teste monta o despachante e chama uma
**única** `rodada()`, sem laço que tente de novo. A corrida é entre a conexão do Redis e a consulta
`listarEscolasComPendentes()` no Postgres, que abre a rodada. Na máquina local, com Redis em
`localhost`, a conexão ganha quase sempre; no runner carregado da esteira, perde de vez em quando —
e o teste lê o 0 como se fosse o resultado do despacho.

Por que só este teste caiu: ele é o único do arquivo cuja **primeira** rodada espera resultado
maior que zero. Os vizinhos (linhas 107 e 133) esperam `0` na primeira rodada e passariam mesmo com
o Redis ainda conectando — pelo motivo errado. O mesmo ponto cego está em mais sete lugares que
entram por `rodada()` ou `reconciliar()` (`janela.int.test.ts` 83, 123, 146, 161, 176 e 188,
`reconciliacao.int.test.ts:102` e `reexecucao.int.test.ts:157`) e num oitavo que entra por outra
porta: `metricas-espera.int.test.ts:57` chama `medicao.medir()`, que também abre com uma consulta ao
Postgres e só depois lê o Redis (`metricas-espera.ts:167`). Lá o erro é engolido pelo `catch`,
`redisResponde` vira `false` e a métrica não é exportada — a mesma falha com outra roupa. É o que
explica três esteiras vermelhas seguidas em testes de fila diferentes.

## Teste que reproduz

**A corrida não tem vermelho determinístico, mas o contrato do conserto tem** — e as duas coisas são
diferentes. Reproduzir a corrida exigiria atrasar a conexão TCP por fora do processo, o que testaria
o atraso, não a regra. O que a correção acrescenta, porém, é um contrato determinístico: *a bancada
não entrega despachante antes do `pronto`, e `pronto` resolve no `ready`, no `error` ou no teto*. É
esse contrato que os testes provam, e cada um deles fica vermelho quando o alvo é removido:

1. **Contrato do embrulho** — `apps/worker/test/esperar-o-redis.test.ts` (unidade, 4 cenários). Com
   um montado de mentira cujo `pronto` se resolve na mão: `rodada()`, `reconciliar()` e `medir()` não
   alcançam o despachante enquanto o `pronto` não resolve; a chamada seguinte não espera de novo
   (contado pelo `then`); o valor devolvido é o do despachante; e montagem sem medição não quebra.
   *Falsificado:* com `esperarORedisNaPrimeiraVez` virando no-op, 2 dos 4 ficam vermelhos.
2. **Ponto de ligação** — `apps/despachante/test/pronto-do-redis.int.test.ts`, *"a bancada entrega as
   três portas embrulhadas"*. Guarda contra montar sem embrulhar, nas três (`rodada`, `reconciliar`
   e `medir`).
   *Falsificado:* com a bancada devolvendo o montado cru, ou deixando `medir` de fora, fica vermelho.
3. **`pronto` pelo `ready`** — mesmo arquivo, *"com o Redis de pé, resolve pelo `ready` sem pagar o
   teto, e a rodada alcança o Redis e publica"*. Mede a espera e afirma o despacho de um job próprio,
   porque sem linha `aguardando` a rodada volta na consulta ao Postgres e a asserção de log passaria
   de graça.
   *Falsificado:* tirando `redis.on('ready', terminar)`, fica vermelho em 5.036 ms — o teto.
4. **`pronto` com o Redis fora** — mesmo arquivo, *"resolve pelo erro do cliente, e não esperando o
   teto"*, contra uma porta que ninguém atende.
   *Falsificado:* tirando `redis.on('error', terminar)`, fica vermelho em 5.015 ms.
5. **Cadeia causal do defeito** — `apps/despachante/test/janela.int.test.ts`, *"a rodada cujo
   primeiro comando de vaga falha não publica nada, e a seguinte publica"*. Prova que leitura de vaga
   que falha produz rodada 0 e `vaga_indisponivel` no log. Passa dos dois lados da correção de
   propósito: é prova da causa e do comportamento do `Despachante`, não do conserto. (Fica vermelho
   se `despachante.ts:141` deixar de devolver em `vaga_indisponivel`.)
6. **Recaída nomeada** — no teste que caiu na esteira, a asserção de log vem **antes** do número, para
   a recaída cair como `vaga_indisponivel` e não como `expected +0 to be 2`. Não foi espalhada pelos
   outros pontos: a espera na bancada tirou a causa de todos, e repetir só somaria ruído.

Como confirmação de não regressão (não como prova principal): 20 execuções seguidas da janela verdes
e o portão inteiro verde.

O teto de 5 s (`montagem.ts:79`) é o único ramo sem vermelho próprio: ele é guarda contra travamento,
não comportamento esperado. Os dois caminhos normais — `ready` e `error` — têm cada um o seu, e é
justamente medindo a espera contra o teto que eles ficam vermelhos quando o ramo some. Para o ramo do
teto não ficar calado — quem espera por ele segue como se o Redis estivesse de pé, que é a corrida
original de volta —, ele grava `despachante.redis_sem_resposta_na_montagem`, com o teto no corpo, e
os testes afirmam a ausência do evento no caminho normal. O nome é o que o operador lê às 7h40, não
o jargão da montagem; não é alerta, então a regra 80 item 10 não pede parágrafo de runbook, como nos
irmãos `fila_com_erro` e `escuta_indisponivel`.

`pronto` é porta de produção que só o teste usa. É defensável porque a conexão é interna à montagem,
mas fica a condição: se aparecer uma **terceira** afordância só-de-teste em `DespachanteMontado`,
separe uma fábrica de apoio a teste em vez de continuar engordando o contrato de produção.

Um resíduo conhecido, registrado de propósito: `pronto` trata todo `error` como "Redis fora", e
`error` não é sinônimo de fora. Um erro transitório na primeira conexão com o Redis **de pé** (o
`info` estourando o `commandTimeout` de 2 s num runner carregado) resolve o `pronto` com o cliente
ainda reconectando, e a rodada seguinte volta a devolver 0 — a corrida original, com margem bem
menor. Dois mitigantes: a recaída cai com nome (`vaga_indisponivel` afirmado antes do número em
`janela.int.test.ts`), e o teste do caminho `ready` não exige a primeira rodada, e sim que ela
publique, para não trocar uma intermitência por outra.

O ramo do teto não tem vermelho próprio, e vale dizer por que ele é difícil, não só que é guarda: o
truque óbvio — um servidor TCP que aceita e nunca responde — não chega lá, porque o `commandTimeout`
de 2 s de `criarClienteRedisDaFila` faria o `info` da conexão estourar e o `error` resolveria o
`pronto` antes. Um vermelho de verdade exigiria teto configurável e cliente de mentira. Por isso fica
como está, observável pelo log.

O worker não precisou de `pronto`, embora `apps/worker/src/montagem.ts` crie o cliente de vagas com o
mesmo `criarClienteRedisDaFila`: lá quem emite o primeiro comando é o BullMQ, depois de conectar, e
nenhum teste dirige leitura de Redis no instante da montagem.

## Correção

Uma linha de desenho: **a bancada de teste não entrega um despachante antes de o Redis dele estar de
pé.** Nada muda no despachante de produção — terminar a rodada quando o Redis não responde continua
igual, porque lá o laço tenta de novo.

- `apps/despachante/src/montagem.ts`: `DespachanteMontado` passa a expor `pronto`, que resolve no
  `ready`, no erro do cliente (Redis de fato fora, que é o caso dos testes que o param de propósito)
  ou no teto, o que vier primeiro. Sem isso a bancada não teria como saber da conexão, que é interna
  à montagem. Produção não usa `pronto`: quem liga o laço não precisa dele.
- `apps/worker/test/fila-de-teste.ts`: `esperarORedisNaPrimeiraVez` embrulha **as três portas que
  leem Redis logo depois da montagem** — `rodada()`, `reconciliar()` e `medir()`. As duas primeiras
  cobrem os sete pontos de `janela`, `reconciliacao` e `reexecucao`; `medir()` cobre
  `metricas-espera.int.test.ts:57`, que entra por outro caminho e teria sido a próxima esteira
  vermelha (`vagas.emUso` falhando vira `redisResponde: false`, e a métrica não é exportada).
  Assim os pontos de montagem nos nove arquivos de teste ficam corrigidos de uma vez, sem mudar
  nenhuma chamada e sem depender de alguém lembrar.

Quem chama `iniciar()` também ganha a espera na primeira volta do laço, já que ela passa por
`rodada()`. É inofensivo: o laço tentaria de novo de qualquer jeito.

O caminho do Redis fora continua atendido sem pedágio: `pronto` resolve no erro do cliente, então
`redis-fora.int.test.ts` e os testes de borda seguem exercitando a degradação.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-16 00:26:49 | 2026-09-16 00:30:18 | `test-engineer` | 1 | REPROVADO | ab522bdeb5efd3f2a |
| 2026-09-16 01:41:12 | 2026-09-16 01:45:08 | `test-engineer` | 2 | REPROVADO | abab66169b9925798 |
| 2026-09-16 02:10:48 | 2026-09-16 02:15:55 | `test-engineer` | 3 | APROVADO | a144569b80690d125 |
| 2026-09-16 02:44:19 | 2026-09-16 02:47:41 | `test-engineer` | 4 | APROVADO | a66cedc04b25620fd |
| 2026-09-16 02:48:28 | 2026-09-16 02:52:15 | `infra-guardian` | 1 | APROVADO | a7db5ae32cf06f459 |
| 2026-09-16 02:48:38 | 2026-09-16 02:53:13 | `revisor-geral` | 1 | APROVADO | a9da300c41440f134 |
| 2026-09-16 03:19:18 | 2026-09-16 03:22:33 | `test-engineer` | 5 | APROVADO | ac6e15fa921805a60 |
| 2026-09-16 03:47:29 | 2026-09-16 03:49:35 | `test-engineer` | 6 | APROVADO | abf66ce96c7b9b3bd |
| 2026-09-16 03:50:00 | 2026-09-16 03:51:56 | `infra-guardian` | 2 | APROVADO | ad7f0e4ff193d3e71 |
| 2026-09-16 03:50:11 | 2026-09-16 03:52:33 | `revisor-geral` | 2 | APROVADO | ae5f6d1aecbc8fc28 |
