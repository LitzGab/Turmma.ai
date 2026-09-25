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

- [x] 9.1 — O aceite do convite do operador grava `convite_operador.aceito` na `AuditoriaOperacao` e
  encerra as sessões abertas da conta com o motivo novo `convite_aceito`; migration que amplia os dois
  checks
- [x] 9.2 — No segundo fator, uma falha do `contador.zerar` depois do commit não vira erro para quem já
  tem a sessão: vira log por id, e a resposta segue
- [x] 9.3 — As rotas anônimas da operação contam num balde de IP próprio (`rl:ip:op`), para a rede de uma
  escola não esgotar a entrada do operador, nem o contrário
- [x] 9.4 — Expurgo: `order by` no lote de `convite_operador`, como os outros alvos; o `{} as Record`
  vira um objeto que o compilador confere alvo a alvo
- [x] 9.5 — `docs/arquitetura.md`: o `SessaoModule` é global desde a A0, e por quê (o semáforo e o
  contador do login são a mesma instância para a escola e a operação)
- [x] 9.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/drizzle/0017_operador_aceite.sql`, `schema/operador.ts` | novo, alterado |
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

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --infra`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada válida
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Divergências resolvidas nesta tarefa

- **Migration `0017`, e não `0016`**: a `0016` é o `usuario_coordenador_ativo_idx` da 5.0. Só amplia os dois checks, e o
  código anterior nunca grava o valor novo (regra 80, item 9).
- **O `zerar` do contador devolve se o Redis confirmou** (`Promise<boolean>`), e continua sem lançar. O
  `ContadorDeTentativas.zerar` já engolia a falha do Redis: nada virava erro para quem tinha a sessão, e também nada
  ficava registrado. O segundo fator lê o `false` e escreve a linha `operacao.contador_nao_zerado`. Quem chama o `zerar`
  no F1 ignora o valor, como antes. Prova: "`zerar` que falha" e "com o Redis zerando", no
  `segundo-fator-operador.int.test.ts`; `zerar` devolve `false` e `true` nos dois testes do contador.
- **O log leva o `operadorId` do contexto**: o `Logger` do Nest só leva o evento, e o id da linha vem do contexto da
  requisição (o `mixin` do `criarLogger`), que tinha `escolaId` e `usuarioId`, mas não `operadorId`. O `mixin` passa a
  ler o `operadorId` também, e o segundo fator escreve a linha dentro do contexto com o operador da sessão que abriu, como
  o painel faz com a escola (`naEscola`). Efeito colateral declarado: toda linha das rotas `@RotaDeOperacao` (a
  `GuardaDeOperador` põe o operador no contexto), como o `http.requisicao`, passa a levar o `operadorId`, que é id da
  nossa equipe (regra 20, item 9). Pergunta de carga: nenhuma gravação nova; a linha sai só quando o Redis não zera, uma
  por entrada de operador. Prova: o teste do `logger.test.ts` e o "`zerar` que falha", que confere as chaves da linha.
- **As sete rotas de entrada da operação contam no mesmo `rl:ip:op`**, e não só as quatro que contavam no `rl:ip`: as três
  `@LimiteQueRebaixa` (`convite/aceitar`, `sessao/email`, `sessao/mfa`) contavam no `rl:ip-login` da escola, e às 7h30 o
  NAT de uma escola lotando o login rebaixaria o operador que estivesse na mesma rede. Nelas o excesso continua só
  marcando a requisição, nunca 429. Um balde só para as sete, com o teto do anônimo (`LIMITE_REQ_IP_ANONIMO_MIN`, sem
  variável nova): quem usa essas rotas é a nossa equipe, e o balde separado do login da escola existe porque 400 alunos
  dividem um IP, o que não acontece aqui. Quem chama sem autenticação: qualquer um, uma vez por pedido, e o que grava é o
  contador do Redis de cache, com TTL da janela, como os outros baldes. Prova: o "balde próprio" (com as contagens de cada
  balde no Redis e a marca do rebaixamento nos dois sentidos) e o C36 no `arquitetura.test.ts`. Subiu para a seção 7c da
  Tech Spec e para `docs/arquitetura.md`.
- **O aceite recusado não encerra nem audita**: a ordem na transação é aceitar, e só com o aceite feito encerrar e
  auditar. Prova: o "revogado durante o hash" confere a sessão aberta e a auditoria vazia, e o C10 confere uma linha
  `convite_operador.aceito` com dois aceites em paralelo.
- **O `throw new Error` que sobrava no segundo fator** (`segundo-fator.service.ts`, a ativação com a linha travada)
  virou `ErroDeDominio(ERRO_INTERNO)`, pelo mesmo motivo da pendência 5.0 (regra 00, item 9); o do `operador.repository`
  já tinha saído na 1.0.

## Destino das pendências da A0

A tabela "Pendências para a A0b" do `tasks/prd-apresentacao-operacao/retro.md`, linha a linha:

| Origem | Pendência | Destino |
|---|---|---|
| 3.0 | `conferirOperador` fora da transação nos `ops:*` de escola | feita na 1.0 (`OperadorRepository.autorAtivoNaTransacao`, a primeira instrução da transação de cada `ops:*`) |
| 4.0 | o formato do apelido em três lugares | feita na A0 e na 1.0: `FORMATO_OPERADOR` em `@educa/shared`, e `formato-do-operador.int.test.ts` compara os checks do banco com a constante |
| 5.0 | `throw new Error(...)` sem código no `operador.repository.ts` | feita na 1.0 (`ErroDeDominio(ERRO_INTERNO)`, com o teste em `operador.repository.test.ts`); o último `throw new Error` de invariante do banco na operação, no segundo fator, sai aqui |
| 5.0 | o aceite troca a senha e zera o segundo fator sem `AuditoriaOperacao` | feita aqui (9.1): `convite_operador.aceito`; teste "aceite auditado" |
| 5.0 | motivo `convite_aceito`: o aceite não derruba as sessões abertas | feita aqui (9.1); teste "aceite encerra sessões" |
| 5.0 | o `SessaoModule` global fora de `docs/arquitetura.md` | feita aqui (9.5) |
| 6.0 | nenhum teste prova que a senha certa zera o contador | já coberta desde a 6.0 da A0 (o teste "borda: a senha certa zera o contador do e-mail", que a 2ª rodada do `test-engineer` aceitou); aqui ganha a leitura direta do contador no Redis, e a mutação sem o `zerar` fica vermelha |
| 7.0 e 9.0 | o log espaçado `operacao.desafio_sem_redis` sem teste | já coberta: `desafio-de-operador.test.ts:104-120` prova o espaçamento e o conteúdo |
| 7.0 | `contador.zerar` depois do commit da sessão | feita aqui (9.2): vira a linha `operacao.contador_nao_zerado`, e a resposta segue |
| 8.0 | renovar e sair em paralelo sem teste | feita aqui: "renovar e sair juntos", nas duas ordens |
| 8.0 | o conteúdo da linha `operacao.reuso_de_refresh` sem teste | feita aqui: "log do reuso" |
| 8.0 | o `rl:ip` é um balde só | feita aqui (9.3): `rl:ip:op` |
| 9.0 | o lote `convite_operador` sem `order by` | feita aqui (9.4): "lote ordenado" |
| 9.0 | `{} as Record<…>` no expurgo | feita aqui (9.4): "alvo sem total" |
| 10.0 | renovações em paralelo na web; clique duplo em "Entrar" do segundo fator e em "Sair" | tarefa 10.0 |
| 10.0 e 11.0 | fronteira de erro sem `document.title`; a senha no estado depois de falha; aceite durante `hashchange` | tarefa 10.0 |
| `/validar` | o e2e semeia o convite por SQL e repete o hash; o E5 sem o identificador no nome | tarefa 10.0 |
| `/validar` | a métrica "do convite ao primeiro login em até 3 min" não é medida | decidida na Tech Spec da A0b, seção 13: métrica de ensaio, cronometrada na demonstração, não instrumentada |
| correção de 24/09 | `tabelasSemEscola` só reconhece o DDL do drizzle | tarefa 10.0 |
| processo | a revisão da spec da A0 terminou com o `test-engineer` REPROVADO | feita na revisão da spec da A0b: a conferência do mapa de tarefas rodou até a 8ª rodada APROVADO (`achados/revisao-spec.md`) |

## Fora do escopo desta tarefa

As pendências da web e do e2e (10.0); a métrica de tempo do convite ao primeiro login, que a Tech Spec
da A0b decidiu não instrumentar (seção 13).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-25 10:56:51 | 2026-09-25 10:58:41 | `test-engineer` | 1 | REPROVADO | a5bbf0db0ffe94956 |
| 2026-09-25 11:31:06 | 2026-09-25 11:31:34 | `test-engineer` | 2 | APROVADO | af31a042cdc4b8402 |
| 2026-09-25 11:32:12 | 2026-09-25 11:32:53 | `tenancy-guardian` | 1 | APROVADO | a04d75a224b6cf3ae |
| 2026-09-25 11:31:57 | 2026-09-25 11:33:05 | `privacy-guardian` | 1 | APROVADO | ae95f3aed07390f7e |
| 2026-09-25 11:31:49 | 2026-09-25 11:33:40 | `revisor-geral` | 1 | APROVADO | a53f110d6ed0c3260 |
| 2026-09-25 11:32:05 | 2026-09-25 11:33:49 | `infra-guardian` | 1 | APROVADO | a7e15567adb80d02d |
