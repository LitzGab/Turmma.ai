# Tarefa 6.0 — O operador entra por e-mail e senha

**Funcionalidade:** apresentacao-operacao (A0) · **Depende de:** 5.0
**Subagentes obrigatórios:** `privacy-guardian`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O operador informa e-mail e senha e recebe o desafio da etapa seguinte (`mfa`, ou `configurar_mfa`
dentro das 72 h do aceite), com a mesma proteção por conta do login da escola e sem colidir com ela.

## Contexto necessário

- `docs/visao-produto.md`
- `techspec.md` seções 4 (`/sessao/email`), 5 ("Etapas", "Entrada" e "Limite": grupo de
  `sessao/email`) e 7 (log)
- `cenarios.md`: C15, C22–C25, C33, U2
- `.claude/rules/20-lgpd-menores.md` (itens 6 e 9), `40-testes.md`, `80-infra-e-carga.md` (item 1)
- Código do F1:
  - `apps/api/src/sessao/login-email.controller.ts` e `login.service.ts` — respostas iguais para
    e-mail inexistente e senha errada, e o hash que roda mesmo sem conta
  - `apps/api/src/sessao/contador-de-tentativas.ts` — `chaveDe` fixa o prefixo `login:`; passa a
    receber o prefixo, e a operação usa `login-op:`
  - `apps/api/src/sessao/cookie-dispositivo.ts` — a origem `conhecido`/`outro`; o operador usa chave
    própria
  - `apps/api/src/sessao/senha/limite-email-ip.ts` e `packages/nucleo/src/limite/guarda-limite.ts`
    (`@LimiteQueRebaixa`) — o rebaixamento por IP
  - `apps/api/test/login-email.int.test.ts` e `apps/api/test/ataque-de-senha.int.test.ts` — os
    moldes dos testes

## Subtarefas

- [ ] 6.1 — `ContadorDeTentativas` com prefixo por parâmetro, sem mudar o comportamento da escola
- [ ] 6.2 — `POST /v1/operacao/sessao/email` com `@EntradaDeOperacao`: conta por e-mail e por
  `operador.id` com `login-op:`, origem pelo cookie de dispositivo com chave própria, rebaixa por IP
  no semáforo do hash; e-mail inexistente e senha errada respondem igual, em status e corpo
- [ ] 6.3 — Etapa do desafio: `configurar_mfa` só se o convite foi aceito há menos de 72 h e o segundo
  fator não está ativo; fora disso, igual a senha errada. Com o segundo fator ativo, `mfa`
- [ ] 6.4 — `AcessoOperacao` com `entrada_falha`, IP e data, sem o e-mail digitado; log só com evento
  e ids
- [ ] 6.5 — Testes (tabela abaixo)

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sessao/contador-de-tentativas.ts` e seu teste | alterado |
| `apps/api/src/operacao/entrada.controller.ts`, `entrada.service.ts` | novo |
| `apps/api/src/operacao/operador.repository.ts` | alterado |
| `apps/api/src/operacao/operacao.module.ts` | alterado |
| `packages/shared/src/operacao/entrada.ts` | novo |
| `apps/api/test/entrada-operador.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| C22 | integração | e-mail inexistente e senha errada: status e corpo iguais |
| C23 | integração | dez erros na conta X seguram X com espera crescente; a conta Y do mesmo IP entra |
| C24 | integração | o mesmo e-mail como operador e como coordenador: errar num não segura o outro, nos dois sentidos |
| C25 | integração | depois de `entrada_falha` com e-mail sentinela, o e-mail não está em `AcessoOperacao` nem no log |
| C15 | integração | com relógio controlado: às 71h59 do aceite devolve `configurar_mfa`; às 72h01, igual a senha errada |
| C33 (parte) | integração | `sessao/email` acima do limite do IP não responde 429: rebaixa, e quem recusa é o contador da conta |
| U2 | unidade | a chave do contador com os dois prefixos, e a da escola igual à de antes |
| borda: aparelho de sempre | integração | com o cookie de dispositivo do operador, erros de outro aparelho não seguram a conta |
| borda: operador desativado | integração | e-mail de operador desativado responde igual a inexistente |
| concorrência: tentativas | integração | 15 senhas erradas em `Promise.all` na mesma conta contam todas: a 16ª está segurada |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`,
  com `--e2e` se tocou tela e `--infra` se mexeu em infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que
  vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- Conferir o código do segundo fator e abrir a sessão (7.0)
- A tela de entrada (10.0)
