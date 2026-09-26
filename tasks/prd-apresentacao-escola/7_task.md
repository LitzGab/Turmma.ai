# Tarefa 7.0 — Limites da sala: por escola, por nome e por turma, com as métricas

**Funcionalidade:** apresentacao-escola · **Depende de:** 6.0 · **Paralelo com:** 11.0
**Subagentes obrigatórios:** `infra-guardian`, `privacy-guardian`, `tenancy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Código errado demais numa escola só atrasa, sem trancar o código certo; matrícula errada demais num nome trava só
aquele nome até o "Gerar novo"; hash demais sem pedido numa turma só rebaixa a prioridade; e 35 alunos do mesmo IP
nunca recebem 429.

## Contexto necessário

- `docs/lgpd.md`, linha "Contadores da sala"; `docs/infra.md` 3.1 e 5.3
- `techspec.md` seções 5 (passo 5, "Quem conta") e 7c (a tabela de limites, métricas, falhas) e 11 (regra 80)
- `cenarios.md`: os ids da tabela abaixo
- `revisao-spec.md`, rodada 5: o L2 com o campo `escolaId`, o log uma linha por escola e janela
- Regras 20 (item 9), 40, 80 (itens 1, 3, 4, 10)
- Código:
  - `apps/api/src/sessao/senha/contador-em-janela.ts`; `limite-email-ip.ts` e `rebaixamento.ts` mostram
    `limiteDoSeguro`, o seguro em memória e `LIMITE_INSTANCIAS_API`; `semaforo-de-hash.ts`, a prioridade
  - `packages/nucleo/src/limite/chaves.ts` (chaves HMAC) e `telemetria/metricas.ts` (`METRICAS_COM_ESCOLA` é fechada)
  - `apps/api/test/arquitetura.test.ts` — o que o `sala` pode importar de `sessao`

## Subtarefas

- [ ] 7.1 — `ContadorEmJanela` com a janela por parâmetro (10 min na sala); o login continua com 60 s
- [ ] 7.2 — Escola (código errado, 1.000): acima do teto, 1 s de espera **antes** da busca do acesso, fora de
  transação e sem conexão do pool; o código certo entra
- [ ] 7.3 — Nome (`acesso_turma`, `listaNomeId`, 5): só matrícula errada em nome ainda `livre`, lido depois da volta
  atrás com escola, ano e turma do acesso; acima, `LIMITE_EXCEDIDO` com `Retry-After` a esse nome
- [ ] 7.4 — Turma (hash sem pedido, 150): acima, o hash vai rebaixado; nunca recusa
- [ ] 7.5 — O reenvio não conta; o `insert` do pedido lê `teve_matricula_errada` do contador do nome
- [ ] 7.6 — Métricas `sala.reivindicacao{resultado}` e `sala.limite_atingido{tipo}`, sem rótulo de escola; log
  `sala.limite_atingido` uma linha por escola e janela, com `escolaId`
- [ ] 7.7 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sala/limites-da-sala.ts`; `reivindicacao.service.ts`, `salas.service.ts` | novo, alterado |
| `contador-em-janela.ts` e teste; `chaves.ts`, `metricas.ts` e os testes deles | alterado |
| `apps/api/test/limites-da-sala.int.test.ts`; `salas-reivindicar.int.test.ts` | novo, alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| I10 | integração | sete tentativas em nome de T2, de B e aleatório: 21 respostas idênticas, nenhuma chave de nome criada; em T1, a 6ª trava |
| L1, L2 | integração | 35 do mesmo IP sem 429; 100 códigos errados abaixo do teto: o certo abre sem espera, nenhum cookie lido |
| L3 | integração | 1.000 errados: o certo abre depois de 1 s; B do mesmo IP sem espera; pool mínimo, outra rota sem esperar conexão |
| L4, L4b | integração | a 6ª trava o nome, também com a matrícula certa; o código Y destrava os 35 |
| L5, L6, L6b | integração | o 151º rebaixado pelo espião do semáforo; a tabela de quem conta, lida no Redis; o nome tomado 200 vezes não trava logins |
| L7, L8 | integração, unidade | Redis fora: o teto dividido por `LIMITE_INSTANCIAS_API`; janela de 10 min e 60 s no login |
| C1, C2, E21 (contadores) | integração, em paralelo | o perdedor soma só na turma; os reenvios não somam |
| E30 (gravação) | integração | duas erradas e a certa: `teveMatriculaErrada: true`; de primeira, `false`; depois de "Gerar novo", o contador antigo não marca |
| `Retry-After` no nome | integração | o `LIMITE_EXCEDIDO` do nome traz o cabeçalho |
| métrica sem escola | unidade | nenhuma das duas métricas novas aceita o rótulo de escola |
| log novo | integração | `sala.limite_atingido`: uma linha por escola e janela, com `escolaId`; nada de IP, código, matrícula nem nome (A4) |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Alerta, comando e carga (9.0); anular o `teve_matricula_errada` (8.0); os textos (17.0); `rl:ip:sala` e bloqueio
de IP (F2 e staging).

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
