# Tarefa 5.0 — Renovação, atividade, inatividade e saída

**Funcionalidade:** identidade-e-tenancy · **Depende de:** 4.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `test-engineer`

## Objetivo

A sessão passa a durar enquanto a pessoa usa. O token de 10 min renova pelo cookie, duas
abas renovando juntas não deslogam ninguém, e o refresh roubado encerra a família. O
Chromebook que ficou parado entrega a próxima turma sem a conta anterior. Sair encerra
na hora.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF13 (sessão do aluno termina ao fechar o navegador ou após inatividade
  configurável por escola, com Sair em toda tela), RF5 (corte na requisição seguinte),
  RF19 (reuso de refresh em auditoria) e o caso "Chromebook do carrinho entre duas turmas"
- `techspec.md`:
  - seção 3: `sessao` (`refresh_hash_anterior`, `atual_apresentado`, `rotacionado_em`, `fillfactor`) e `escola.inatividade_*`
  - seção 4: rotas `renovar`, `atividade`, `DELETE /v1/sessao` e `PUT /v1/escola/sessao`
  - seção 5: "Renovar", "Atividade", "Requisição"
  - seção 7c: corridas, métricas, alerta `reuso-de-refresh`
  - seção 12: restauração de sessão do Chrome
- `.claude/rules/80-infra-e-carga.md`, itens 6, 7 e 10: resposta de prova não se perde;
  concorrência resolvida no banco; código novo no caminho quente mede a si mesmo, e alerta
  vem com runbook
- `.claude/rules/20-lgpd-menores.md`, item 10: auditoria em alteração de permissão
- `docs/infra.md`, seção 3.1: a sessão não pode fazer o aluno refazer login a cada aula, e
  a renovação não compete com o login das 7h30
- `docs/runbook.md`, seção "Formato de cada entrada", e as entradas do F0 como exemplo
- Código existente:
  - `apps/api/src/sessao/login.service.ts`, `cookie-dispositivo.ts` e `desafio.ts` (4.0)
  - `packages/nucleo/src/identidade/guarda-sessao.ts` e `sessao.repository.ts` (2.0): inatividade com tolerância
  - `apps/api/src/sessao/resolucao-de-tenant.repository.ts`: acrescentar sessão por `refresh_hash` e pelo anterior
  - `packages/nucleo/src/telemetria/metricas.ts`, `infra/grafana/alertas/*.yaml` e `tools/guardas/alerta-tem-runbook.ts`: padrão de métrica e alerta
  - `packages/nucleo/src/relogio.ts`: relógio injetável para os testes de tempo

## Subtarefas

- [ ] 5.1 — `POST /v1/sessao/renovar` (cookie `educa_sessao`, `@RotaAnonima` com limite por IP do F0)
  - **Transação:** `SELECT ... FOR UPDATE` da sessão encontrada por `refresh_hash` ou `refresh_hash_anterior`.
  - **Hash atual:** confere encerramento, `expira_em` e a inatividade com tolerância. Rotaciona, guarda o anterior, zera `atual_apresentado` e marca `rotacionado_em`; devolve `{ token, expiraEm }` e o cookie novo.
  - **Apresentação:** a primeira requisição autenticada com o token novo marca `atual_apresentado`, com `update` condicional. É isso que distingue resposta perdida de roubo.
  - **Hash anterior, com o atual nunca apresentado:** rotaciona de novo, sem encerrar.
  - **Hash anterior, com o atual apresentado:** até 30 s de `rotacionado_em`, 409 `JA_RENOVADO` sem encerrar. Depois disso é reuso: encerra todas as sessões da `familia` com motivo `reuso`, grava auditoria `sessao.reuso_de_refresh` e incrementa a métrica.
  - **Uso:** renovar não move `ultimo_uso_em`, e grava `renovacao` em `registro_acesso`.
  - **Código novo:** `JA_RENOVADO`.
- [ ] 5.2 — Atividade e inatividade
  - **`POST /v1/sessao/atividade`:** com token, move `ultimo_uso_em` sem segurar a resposta. A gravação roda depois de responder, e a falha é contada em `sessao.atividade_falha`, sem 5xx.
  - **Guarda:** recusa quando `now() - ultimo_uso_em` passa de `escola.inatividade_aluno_min` ou `inatividade_equipe_min`, conforme o papel, mais 5 min de tolerância. A regra da 2.0 é conferida aqui com os valores reais.
  - **Contrato para o F6:** um método `registrarAtividade()` exportado, que a gravação de resposta de avaliação vai chamar.
- [ ] 5.3 — `DELETE /v1/sessao` e `PUT /v1/escola/sessao`
  - **`DELETE`:** encerra a sessão com motivo `saida`, apaga o `educa_sessao` e grava `saida` em `registro_acesso`. O `educa_dispositivo` não é apagado.
  - **`PUT /v1/escola/sessao`:** `@Permite` de coordenador. Recebe `{ inatividadeAlunoMin, inatividadeEquipeMin }` com limites validados (entre 5 e 480), grava auditoria `escola.sessao_alterada` com antes e depois só dos números, e o DTO de saída é explícito.
- [ ] 5.4 — Métricas e alerta
  - **Métricas:** `sessao.renovacao{resultado: ok|ja_renovado|resposta_perdida|reuso|recusada}`, `sessao.atividade_falha` e `sessao.leitura.duracao`, esta medida na `GuardaDeSessao`.
  - **Alerta:** `infra/grafana/alertas/reuso-de-refresh.yaml`, disparado com mais de 5 em 10 min.
  - **Runbook:** entrada "Reuso de refresh" em `docs/runbook.md`, no formato do arquivo: o que significa, como ver a família afetada pelos ids, quando é ataque e quando é bug de cliente, e o que fazer.
- [ ] 5.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sessao/renovacao.controller.ts`, `renovacao.service.ts`, `atividade.controller.ts`, `saida.controller.ts` | novo |
| `apps/api/src/sessao/resolucao-de-tenant.repository.ts`, `packages/nucleo/src/identidade/guarda-sessao.ts`, `sessao.repository.ts` | alterado |
| `apps/api/src/estrutura/escola-sessao.controller.ts`, `estrutura.module.ts` | novo |
| `packages/shared/src/sessao/renovacao.ts`, `escola-sessao.ts`; `erros/codigo-de-erro.ts`, `mensagens.ts` | novo, alterado |
| `packages/nucleo/src/auditoria/acoes.ts`, `telemetria/metricas.ts` | alterado |
| `infra/grafana/alertas/reuso-de-refresh.yaml`, `docs/runbook.md` | novo, alterado |
| `apps/api/test/renovacao.int.test.ts`, `inatividade.int.test.ts`, `saida.int.test.ts`, `escola-sessao.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: renovar devolve token e cookie novos; o cookie antigo, com o novo já apresentado e dentro de 30 s, dá 409 `JA_RENOVADO` sem encerrar | integração | rotação |
| concorrência: duas renovações em paralelo com o mesmo cookie dão uma 200 e uma 409, e a família continua viva | concorrência | `FOR UPDATE` e a janela de 30 s (duas abas) |
| borda: resposta perdida, com o anterior reapresentado e o atual nunca usado, rotaciona de novo sem encerrar | integração | queda de rede no Chromebook não desloga |
| borda: o anterior reapresentado 31 s depois, com o atual já apresentado, encerra a família toda, grava a auditoria e incrementa `sessao.renovacao{resultado=reuso}` | integração com relógio | detecção de roubo |
| borda: aluno com 34 min sem atividade segue válido e com 35 min e 1 s dá 401 (inatividade 30 + 5); renovar no meio não muda o resultado | integração com relógio | RF13 e "renovar não é uso" |
| borda: Chromebook do carrinho, com a sessão vencida por inatividade às 8h50: o cookie dela não renova às 9h, e o aluno seguinte precisa entrar | integração | ninguém herda a conta anterior |
| borda: sessão com atividade contínua expira nas 12 h absolutas | integração com relógio | teto de sessão |
| falha: `atividade` com o Postgres lento responde 204 e conta `sessao.atividade_falha`, e a sessão não cai por isso dentro da tolerância | integração | atividade perdida não desloga |
| caminho feliz: `DELETE /v1/sessao` faz a requisição seguinte com o mesmo JWT dar 401, o cookie não renova, e `saida` fica gravada | integração | RF5 e RF13 |
| permissão: professor em `PUT /v1/escola/sessao` é recusado; coordenador altera, grava auditoria, e 15 min em A não muda B | integração + isolamento | configuração por escola, com escopo |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%, incluindo `npm run test:infra` (alerta novo)
- [ ] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [ ] Todos os revisores obrigatórios com rodada na seção "Revisões", iniciada depois da
  última alteração de código, e APROVADO nos que têm veto
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- Renovação única entre abas com Web Locks e timer de inatividade na web (18.0 e 20.0)
- Sessão com avaliação em andamento que não vence (F6, pelo `registrarAtividade()`)
- Troca de escola encerrando a sessão de origem (12.0)
- Expurgo de sessão encerrada há 30 dias (17.0)
- Cenário de renovação em onda na carga (16.0)

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->
