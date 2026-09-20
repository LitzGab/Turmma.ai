# Correção — o teste da reconciliação gasta o orçamento de recuperação esperando o container do Redis subir

**Origem:** esteira run 35517746419 (commit `38ce195`), achado como crítico 1 da rodada 2 de
`tasks/prd-identidade-e-tenancy/validacao.md`
**Subagentes obrigatórios:** `infra-guardian` (fila, Redis, resiliência sob carga)
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

`apps/despachante/test/reconciliacao.int.test.ts` › "consulta sem resposta (Redis de fila travado,
e depois parado) não republica; com o Redis de volta, republica" falhou na esteira:

```
AssertionError: expected [] to deeply equal [ Array(1) ]
 ❯ apps/despachante/test/reconciliacao.int.test.ts:210:129
```

36,9 s no caso, 57,1 s no arquivo, único vermelho da tarefa de integração (`11 tests | 1 failed`).
Passa nesta máquina, em execuções seguidas. O commit não leva código: é fragilidade que a execução
expôs, não regressão.

## Causa

O caso termina em:

```ts
await composeAssincronoOuFalha('start', 'redis-fila')
await expect.poll(async () => (await montado.reconciliacao.reconciliar()).republicados, { timeout: 30_000, interval: 500 }).toEqual([id])
```

O `start` devolve quando o Docker aceitou o comando, **não quando o Redis responde**. Com isso, os
30 s do `expect.poll` são um orçamento dividido entre duas coisas de naturezas diferentes:

1. **o container subir** — trabalho do compose, que cresce com a carga da máquina e não diz nada
   sobre o produto;
2. **o cliente e a `Queue` voltarem** — o que o teste existe para provar, e que acontece em
   milissegundos depois de o Redis responder.

Sob carga, (1) come (2). Medido nesta máquina, no mesmo caso, com instrumentação temporária:

| | máquina ociosa | 12 laços ocupados em 12 núcleos |
|---|---|---|
| `start` devolveu | 153 ms | **4.998 ms** |
| Redis saudável | 2.415 ms | **11.180 ms** |
| republicou | 2.421 ms | 12.616 ms |
| **recuperação depois de saudável** | **6 ms** | **1.436 ms** |

A recuperação em si é estável (6 ms → 1,4 s); o que explode é a subida do container, 4,6× só com
contenção de CPU numa máquina de 12 núcleos. O runner da esteira tem menos núcleos e roda quatro
tarefas em paralelo, e nele a subida sozinha passa dos 30 s.

O caso irmão do mesmo arquivo, que derruba e levanta o **Postgres**, já separa as duas coisas:

```ts
await composeAssincronoOuFalha('start', 'postgres')
await aguardarSaudavel('postgres')          // ← o do Redis não tinha esta linha
await expect.poll(...)
```

Não é falta de espera (o `expect.poll` já existia) nem prazo curto demais: é **orçamento
compartilhado entre a infraestrutura do teste e a regra que ele prova**.

Descartado no caminho, com evidência, para não voltar como palpite:

- **Carga do AOF na subida.** O `redis-fila` tem `--appendonly yes` com volume. Com 42 MB de AOF
  aqui, `DB loaded from append only file: 0.372 seconds`. Na esteira o volume nasce vazio a cada
  execução. Não é a causa.
- **Recuo de reconexão do ioredis.** `criarClienteRedisDaFila` tem teto de 2 s
  (`retryStrategy: (tentativa) => Math.min(tentativa * 100, 2_000)`), e a medição acima mostra a
  reconexão em 1,4 s mesmo sob contenção. Não é a causa.

## Teste que reproduz

`apps/despachante/test/reconciliacao.int.test.ts` › "consulta sem resposta (Redis de fila travado,
e depois parado) não republica; com o Redis de volta, republica", com o orçamento passando a medir
só a recuperação (20 s) e a contenção de CPU reproduzindo o runner carregado.

Vermelho antes / verde depois: ver "Evidência" abaixo.

## Correção

Duas linhas no caso, nenhuma em código de produção:

1. `await aguardarSaudavel('redis-fila')` depois do `start`, como o caso do Postgres já fazia. A
   subida do container sai do orçamento da recuperação e passa a ter teto próprio (60 s) e falha
   legível: `aguardarSaudavel` erra com o estado do serviço e as últimas 40 linhas do log dele, em
   vez de `expected [] to deeply equal [ Array(1) ]`, que não diz o que houve.
2. O `expect.poll` passa de 30 s para 20 s. Não é aperto arbitrário: agora ele mede só a
   recuperação, que é de 6 ms ociosa e 1,4 s sob contenção total, e a garantia que o teste prova é
   a do `clientes.ts` — "o Redis que volta é usado de novo em segundos". Um orçamento de 30 s para
   isso esconderia a regressão que o teste existe para pegar.

## Evidência

**Vermelho antes, verde depois, com a mesma condição e de forma determinística.** Contenção de CPU
sozinha não serve de reprodução: com 12 laços ocupados o caso fica 5× mais lento mas ainda passa, e
com 36 laços o vitest é que morre de fome (saída 124, sem terminar) — o vermelho seria da máquina,
não do defeito. A condição da esteira é outra e é reproduzível: **o container demora mais que o
orçamento para responder**. Reproduzida segurando a subida:

```ts
setTimeout(() => void composeAssincronoOuFalha('start', 'redis-fila'), 25_000)  // só na evidência
```

| Código | Resultado | Duração |
|---|---|---|
| como estava (sem `aguardarSaudavel`, prazo de 20 s) | ❌ `AssertionError: expected [] to deeply equal [ Array(1) ]` — **a mensagem exata da esteira** | 26,70 s |
| com a correção (mesmo adiamento de 25 s na subida) | ✅ passou | 31,94 s |

A linha "como estava" mistura de propósito o código antigo com o prazo novo: com os 30 s originais,
um adiamento de 25 s ainda passaria, e reproduzir o vermelho original exigiria adiamento maior que
30 s. Isso não muda a conclusão — o defeito é o orçamento compartilhado, não o número — mas fica
registrado para quem ler a tabela depois.

Depois disso o adiamento foi removido; o que ficou no teste é só a espera pelo serviço e o prazo de
20 s. Medições que sustentam o prazo, no mesmo caso, com instrumentação temporária:

| | máquina ociosa | 12 laços em 12 núcleos |
|---|---|---|
| recuperação depois de o Redis responder | 6 ms | 1.436 ms |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-20 13:35:22 | 2026-09-20 13:38:48 | `test-engineer` | 1 | APROVADO | affc4b63101846f4a |
| 2026-09-20 13:39:22 | 2026-09-20 13:56:43 | `infra-guardian` | 1 | APROVADO | a50933f4e36bd54a7 |
| 2026-09-20 14:25:08 | 2026-09-20 14:26:11 | `test-engineer` | 2 | APROVADO | a8b2525c2f8363827 |
