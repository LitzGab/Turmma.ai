# Correção — os testes do contador de tentativas e do desafio usam o cliente Redis de produção, que desiste em 100 ms

**Origem:** esteira run 35334421615, primeira tentativa (commit `4e310e8`, job integração). O
commit era só de documento, com o código idêntico ao `07f813a`, que tinha passado.
**Subagentes obrigatórios:** `infra-guardian`, `test-engineer`

## Sintoma

`apps/api/src/sessao/contador-de-tentativas.int.test.ts › borda: a quinta falha segura 30 s…`
falhou na linha 49:

```
expect(contador.proporcaoDoSeguro).toBe(0)
Received: 0.125
```

Uma das oito reservas do teste foi atendida pelo seguro em memória, e não pelo script no Redis.

## Causa

O cliente Redis de produção da API (`criarClienteRedisDaApi`) tem `commandTimeout` de 100 ms,
de propósito: com o Redis lento ou travado, o login cai no seguro em memória em vez de travar
(Tech Spec, seção 5, e regra 80). O teste usa esse mesmo cliente para provar a lógica do script
Lua do contador. No runner carregado da esteira, uma resposta do Redis passou dos 100 ms, a reserva
foi para o seguro, e a asserção que confere que tudo passou pelo Redis falhou.

O teste de concorrência de `desafio.int.test.ts` tem a mesma fragilidade: com uma resposta acima
de 100 ms, as duas conclusões do desafio são recusadas, e o teste espera exatamente uma.

Não é defeito de produção: em produção o prazo de 100 ms é o desenho, e a queda para o seguro é o
comportamento esperado com o Redis lento. O defeito é o teste da lógica do script depender do
relógio do runner.

## Teste que reproduz

Outra conexão ocupa o Redis de fila com um script Lua de ~290 ms (`while i<40000000`), disparado
logo antes da primeira reserva. É o que um runner lento faz por conta própria.

**Contador, cliente de produção da API, Redis ocupado — vermelho:**

```
AssertionError: expected 0.25 to be +0 // Object.is equality
    expect(contador.proporcaoDoSeguro).toBe(0)
```

Mesma asserção da esteira.

**Desafio, cliente de produção da API, Redis ocupado — vermelho:**

```
AssertionError: expected [] to have a length of 1 but got +0
```

Com a correção e a mesma ocupação, os dois ficam verdes. Sem a ocupação, os dois arquivos passam
6/6.

## Correção

Os dois testes passaram a criar o cliente com `criarClienteRedisDaFila`: é a mesma fábrica, sem
fila offline, com prazo de 2 s em vez de 100 ms. O que eles provam (o script do contador, a marca
de uso único do desafio) não depende do prazo.

A queda para o seguro em memória **com o Redis fora** continua provada por quem usa o cliente de
produção de propósito: `login-email.int.test.ts` ("com o Redis de fila fora, o contador em memória
segura a conta") e `desafio.int.test.ts` ("com o Redis de fila fora, o desafio é recusado"), que
segue com `criarClienteRedisDaApi`.

Nada de produção mudou.

## O que fica em aberto

O `test-engineer` apontou duas coisas que esta correção não resolve, e que ficam registradas:

- **Redis travado (conectado, sem responder) no contador e no desafio:** o ramo `catch` de
  `ContadorDeTentativas.reservar` e o de `ConsumoDeDesafio.consumir` não têm teste. Com o Redis
  parado, o cliente nem fica `ready`, e o caminho provado é outro. A lacuna já existia antes desta
  correção. O caminho é um teste com `CLIENT PAUSE`, como em `uso.int.test.ts`.
- **Os testes que sobem a API inteira têm a mesma exposição**, e neles não dá para trocar o
  cliente: o `SessaoModule` cria o cliente de login com `criarClienteRedisDaApi`. Login por e-mail,
  MFA e convite (`login-email`, `mfa`, `convite` `.int.test.ts`), e o uso e o limite, podem ver uma
  reserva cair no seguro ou um desafio recusado se o Redis passar de 100 ms no runner. Se isso
  aparecer na esteira, a correção é dar ao compose de teste um prazo maior para o cliente Redis da
  API, por configuração, mantendo os 100 ms em produção e nos testes que provam o corte.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-18 08:16:19 | 2026-09-18 08:17:27 | `test-engineer` | 1 | APROVADO | a3ba7b08b414e38b8 |
| 2026-09-18 08:17:56 | 2026-09-18 08:18:08 | `test-engineer` | 2 | APROVADO | acfc136496e50d522 |
| 2026-09-18 08:18:00 | 2026-09-18 08:18:45 | `infra-guardian` | 1 | APROVADO | a4e06ddfdbd80b232 |
