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

- [x] 5.1 — `POST /v1/sessao/renovar` (cookie `educa_sessao`, `@RotaAnonima` com limite por IP do F0)
  - **Transação:** `SELECT ... FOR UPDATE` da sessão encontrada por `refresh_hash` ou `refresh_hash_anterior`.
  - **Hash atual:** confere encerramento, `expira_em` e a inatividade com tolerância. Rotaciona, guarda o anterior, zera `atual_apresentado` e marca `rotacionado_em`; devolve `{ token, expiraEm }` e o cookie novo.
  - **Apresentação:** a primeira requisição autenticada com o token novo marca `atual_apresentado`, com `update` condicional. É isso que distingue resposta perdida de roubo.
  - **Hash anterior, com o atual nunca apresentado:** rotaciona de novo, sem encerrar.
  - **Hash anterior, com o atual apresentado:** até 30 s de `rotacionado_em`, 409 `JA_RENOVADO` sem encerrar. Depois disso é reuso: encerra todas as sessões da `familia` com motivo `reuso`, grava auditoria `sessao.reuso_de_refresh` e incrementa a métrica.
  - **Uso:** renovar não move `ultimo_uso_em`, e grava `renovacao` em `registro_acesso`.
  - **Código novo:** `JA_RENOVADO`.
- [x] 5.2 — Atividade e inatividade
  - **`POST /v1/sessao/atividade`:** com token, move `ultimo_uso_em` sem segurar a resposta. A gravação roda depois de responder, e a falha é contada em `sessao.atividade_falha`, sem 5xx.
  - **Guarda:** recusa quando `now() - ultimo_uso_em` passa de `escola.inatividade_aluno_min` ou `inatividade_equipe_min`, conforme o papel, mais 5 min de tolerância. A regra da 2.0 é conferida aqui com os valores reais.
  - **Contrato para o F6:** um método `registrarAtividade()` exportado, que a gravação de resposta de avaliação vai chamar.
- [x] 5.3 — `DELETE /v1/sessao` e `PUT /v1/escola/sessao`
  - **`DELETE`:** encerra a sessão com motivo `saida`, apaga o `educa_sessao` e grava `saida` em `registro_acesso`. O `educa_dispositivo` não é apagado.
  - **`PUT /v1/escola/sessao`:** `@Permite` de coordenador. Recebe `{ inatividadeAlunoMin, inatividadeEquipeMin }` com limites validados (entre 5 e 480), grava auditoria `escola.sessao_alterada` com antes e depois só dos números, e o DTO de saída é explícito.
- [x] 5.4 — Métricas e alerta
  - **Métricas:** `sessao.renovacao{resultado: ok|ja_renovado|resposta_perdida|reuso|recusada}`, `sessao.atividade_falha` e `sessao.leitura.duracao`, esta medida na `GuardaDeSessao`.
  - **Alerta:** `infra/grafana/alertas/reuso-de-refresh.yaml`, disparado com mais de 5 em 10 min.
  - **Runbook:** entrada "Reuso de refresh" em `docs/runbook.md`, no formato do arquivo: o que significa, como ver a família afetada pelos ids, quando é ataque e quando é bug de cliente, e o que fazer.
- [x] 5.5 — Testes

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

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%, incluindo `npm run test:infra` (alerta novo)
- [x] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [ ] Todos os revisores obrigatórios com rodada na seção "Revisões", iniciada depois da
  última alteração de código, e APROVADO nos que têm veto
- [x] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- Renovação única entre abas com Web Locks e timer de inatividade na web (18.0 e 20.0)
- Sessão com avaliação em andamento que não vence (F6, pelo `registrarAtividade()`)
- Troca de escola encerrando a sessão de origem (12.0)
- Expurgo de sessão encerrada há 30 dias (17.0)
- Cenário de renovação em onda na carga (16.0)

## Notas da implementação

- **Divergência resolvida: a renovação simultânea com o token novo nunca usado.** A subtarefa 5.1 diz "hash anterior,
  com o atual nunca apresentado: rotaciona de novo", e a linha de concorrência da tabela pede que duas renovações em
  paralelo com o mesmo cookie deem uma 200 e uma 409. As duas coisas não cabem juntas: a segunda renovação espera o
  `FOR UPDATE` da primeira e acha o cookie como anterior, com o token novo ainda não usado, e pela regra literal
  rotacionaria de novo (duas 200, e o navegador ficaria com o cookie que perder a corrida do `Set-Cookie`, que depois
  vira reuso ou 401). A implementação separa os dois casos pelo tempo desde a rotação, na hora do banco: até
  `JANELA_DE_RENOVACAO_SIMULTANEA_MS` (2 s) é a renovação simultânea de outra aba e responde 409 `JA_RENOVADO`, sem
  rotacionar; depois disso é a resposta perdida e rotaciona de novo, como a Tech Spec pede. Uma resposta perdida só
  volta depois de o cliente notar a falha; se voltar antes de 2 s, recebe 409, e a web (18.0) tenta de novo com o
  cookie que tem. A seção 5, "Renovar", da Tech Spec registra a janela. **Decisão a confirmar pelo Joaquim.**
  A linha de concorrência da tabela cita "a janela de 30 s": o que a prova de fato exercita é essa janela de 2 s e
  o `FOR UPDATE`. A linha fica como foi escrita, e a decisão sobe junto.
- **Qual token marca `atual_apresentado`.** Como a Tech Spec diz, pelo `iat`: a guarda marca quando o `iat` não é
  anterior a `rotacionado_em` (`tokenDaUltimaRenovacao`), e o `update` confere de novo no banco
  (`rotacionado_em <= to_timestamp(iat)`), só na escola e na sessão do token. O `iat` é em segundos, então a renovação
  emite o token com `iat` no segundo seguinte ao da rotação (`EmissorDeToken.emitir` ganhou o instante opcional):
  um token de antes da rotação, do mesmo segundo, não passa por token novo. O `TokenVerificado` passou a levar o
  `iat` (`emitidoEm`). A marcação não segura a resposta; se falhar, a requisição seguinte com o mesmo token marca.
- **Uma leitura só para achar a sessão pelo cookie.** `sessaoParaRenovar` substitui `sessaoPorRefreshHash` e
  `sessaoPorRefreshHashAnterior` (que nenhum código usava): acha pelo hash atual ou anterior, trava com
  `FOR UPDATE OF sessao` (sem travar usuário nem escola, que seria travar a escola inteira a cada renovação) e diz
  por qual achou. Continua sendo um método `@SemEscopo` da tabela da seção 6.
- **Escritas escopadas numa classe só.** `EscritaDeSessaoRepository` (rotacionar, encerrar a família, encerrar,
  registrar uso) lê a escola do contexto, que na renovação é a escola da sessão travada.
- **Autor da auditoria do reuso.** A auditoria exige um autor, e o reuso não tem pessoa agindo: o autor é o usuário
  dono da família, a pessoa cuja credencial foi reapresentada, e a entidade é a sessão. `depois` leva só a família e
  quantas sessões caíram. O motivo de encerramento é o `reuso_de_refresh`, que a 2.0 já tinha no banco.
- **Recusa apaga o cookie.** Renovação recusada (sessão que não vale, cookie desconhecido, reuso) responde 401
  `NAO_AUTENTICADO` com `Set-Cookie` que apaga o `educa_sessao`. O 409 não mexe em cookie.
- **Atividade sem segurar a resposta.** `RegistroDeAtividade.registrarAtividade()` é o contrato para o F6, exportado
  pelo `SessaoModule`: começa a gravação e devolve na hora; a falha conta em `sessao.atividade_falha` e vira uma linha
  de aviso espaçada, nunca 5xx.
- **Alerta sem `increase()`.** A regra soma, por instância, o máximo menos o mínimo do contador na janela de 10 min:
  o `increase()` extrapola e passaria de 5 com 5 reusos. Para o primeiro reuso depois do boot contar, a API cria cada
  série de `sessao.renovacao` em 0 no boot. Sem `for:`.
- **O ensaio de alertas continua com as três regras do F0.** O reuso não nasce de serviço parado; a prova dele é um
  caso próprio em `infra/test/alertas.int.test.ts` (5 reusos não disparam, o sexto dispara). `REGRAS_PROVISIONADAS`
  lista as quatro.
- **Limpeza da bancada de teste.** Usuário que é autor de auditoria não é mais apagado no fim do teste (a auditoria
  só se escreve pela porta dela e tem FK para o autor).

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-18 04:14:16 | 2026-09-18 04:16:06 | `test-engineer` | 1 | APROVADO | ae46b3b48466d6714 |
| 2026-09-18 04:20:52 | 2026-09-18 04:21:28 | `test-engineer` | 2 | APROVADO | aa109ae0493ca1bee |
| 2026-09-18 04:31:14 | 2026-09-18 04:32:01 | `tenancy-guardian` | 1 | APROVADO | ae978914414f6d5ad |
| 2026-09-18 04:31:26 | 2026-09-18 04:32:34 | `privacy-guardian` | 1 | APROVADO | a9fada7aba4126588 |
| 2026-09-18 04:31:38 | 2026-09-18 04:33:29 | `infra-guardian` | 1 | APROVADO | aaee484620cb1ebd6 |
| 2026-09-18 04:44:23 | 2026-09-18 04:46:43 | `revisor-geral` | 1 | REPROVADO | acb276dc380512710 |
| 2026-09-18 04:50:37 | 2026-09-18 04:51:25 | `test-engineer` | 3 | APROVADO | a2fdddf21f6113719 |
| 2026-09-18 04:51:42 | 2026-09-18 04:51:53 | `tenancy-guardian` | 2 | APROVADO | a747b1f9d0081b849 |
| 2026-09-18 04:51:48 | 2026-09-18 04:52:06 | `privacy-guardian` | 2 | APROVADO | a46bd5214726a58f3 |
| 2026-09-18 04:51:54 | 2026-09-18 04:52:24 | `infra-guardian` | 2 | APROVADO | ae3d28a3bb785449d |
| 2026-09-18 05:14:41 | 2026-09-18 05:15:05 | `revisor-geral` | 2 | APROVADO | a987f61117b2833d9 |
