# Tarefa 9.0 — Acabamento da A0 na API e no worker

**Funcionalidade:** apresentacao-painel · **Depende de:** nenhuma · **Paralelo com:** 1.0 a 8.0
**Subagentes obrigatórios:** `privacy-guardian`, `infra-guardian`, `tenancy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

As recomendações dos revisores da A0 que tocam a API e o worker da operação, e que nenhuma tarefa da
A0b já alcança, saem do `retro.md` e viram código e teste.

## Contexto necessário

- `docs/visao-produto.md`
- `tasks/prd-apresentacao-operacao/retro.md`, "Pendências para a A0b" (a tabela), e os blocos citados
  em `tasks/prd-apresentacao-operacao/achados/` (5.0, 6.0, 7.0, 8.0, 9.0)
- `tasks/prd-apresentacao-operacao/techspec.md` seções 3, 5 e 7
- Regras 20 (itens 9 e 10), 40 e 80 (itens 1, 3 e 7)
- Código:
  - `apps/api/src/operacao/convite-operador.service.ts` — o aceite, que troca a senha e zera o segundo
    fator sem `AuditoriaOperacao`
  - `apps/api/src/operacao/operador.repository.ts` e `packages/nucleo/src/db/schema/operador.ts` — os
    checks `auditoria_operacao_acao_valida` e `sessao_operador_motivo_valido`
  - `apps/api/src/operacao/segundo-fator.service.ts` — o `contador.zerar` depois do commit da sessão
  - `sessao.service.ts` (`rotacionarSessao`, a linha `operacao.reuso_de_refresh`) e `entrada.service.ts`
    (o `contador.zerar` da senha certa), em `apps/api/src/operacao/`
  - `packages/nucleo/src/limite/guarda-limite.ts` — o `rl:ip` único das rotas anônimas
  - `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts` — `APAGAR_LOTE.convite_operador`
  - `apps/worker/src/processadores/expurgar-acesso.ts` — o `{} as Record<…>`
  - `apps/api/src/operacao/desafio-de-operador.test.ts:104-120` — o log `operacao.desafio_sem_redis` já
    tem teste, com o conteúdo: a pendência da A0 está coberta, e a tarefa só o registra

## Subtarefas

- [ ] 9.1 — O aceite do convite do operador grava `convite_operador.aceito` na `AuditoriaOperacao` e
  encerra as sessões abertas da conta com o motivo novo `convite_aceito`; migration que amplia os dois
  checks
- [ ] 9.2 — No segundo fator, uma falha do `contador.zerar` depois do commit não vira erro para quem já
  tem a sessão: vira log por id, e a resposta segue
- [ ] 9.3 — As rotas anônimas da operação contam num balde de IP próprio (`rl:ip:op`), para a rede de uma
  escola não esgotar a entrada do operador, nem o contrário
- [ ] 9.4 — Expurgo: `order by` no lote de `convite_operador`, como os outros alvos; o `{} as Record`
  vira um objeto que o compilador confere alvo a alvo
- [ ] 9.5 — `docs/arquitetura.md`: o `SessaoModule` é global desde a A0, e por quê (o semáforo e o
  contador do login são a mesma instância para a escola e a operação)
- [ ] 9.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/drizzle/0016_operador_aceite.sql`, `schema/operador.ts` | novo, alterado |
| `apps/api/src/operacao/` (`convite-operador.service`, `operador.repository`, `segundo-fator.service`) | alterado |
| `packages/nucleo/src/limite/guarda-limite.ts` e o limitador | alterado |
| `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts` | alterado |
| `apps/worker/src/processadores/expurgar-acesso.ts` | alterado |
| `docs/arquitetura.md`, `docs/lgpd.md` (motivo novo da sessão) | alterado |
| testes de integração da operação e do expurgo | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| aceite auditado | integração | o aceite grava `convite_operador.aceito` com o operador alvo, sem senha nem token |
| aceite encerra sessões | integração | com duas sessões abertas da conta, o aceite as encerra com `convite_aceito`, e a requisição seguinte recebe `SESSAO_ENCERRADA` |
| senha certa zera | integração | depois de falhas, a entrada certa deixa o contador da conta zerado; sem a linha do `zerar`, o teste falha |
| `zerar` que falha | integração | Redis recusando o `zerar` depois do commit: a sessão abre, a resposta é 200, e a linha de log, só com ids, não leva nada da pessoa |
| renovar e sair juntos | integração | renovar e sair na mesma sessão, com a ordem forçada nos dois sentidos (a linha da sessão segurada pelo teste): termina encerrada, sem refresh novo válido |
| log do reuso | integração | a linha `operacao.reuso_de_refresh`, capturada, não leva e-mail, token nem refresh |
| balde próprio | integração | esgotar o `rl:ip` da escola não recusa a entrada do operador pelo mesmo IP, e vice-versa |
| lote ordenado | integração | com convites semeados fora da ordem do prazo e o lote menor que o total, sai primeiro o mais antigo; sem o `order by`, falha |
| alvo sem total | typecheck | um `@ts-expect-error` com alvo faltando no objeto dos totais prova que o compilador confere |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --infra`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada válida
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

As pendências da web e do e2e (10.0); a métrica de tempo do convite ao primeiro login, que a Tech Spec
da A0b decidiu não instrumentar (seção 13).
