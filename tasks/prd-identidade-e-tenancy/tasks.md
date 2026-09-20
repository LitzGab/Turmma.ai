# Tarefas — Identidade e tenancy

**PRD:** `prd.md` · **Tech Spec:** `techspec.md`
**Status:** 20 de 20 concluídas

## Lista

- [x] **1.0 — Escola nasce por comando do operador, com auditoria de schema fechado**
  - [x] 1.1 Migration de `rede`, `escola` e `auditoria`, com o check de escola nula só para rede
  - [x] 1.2 `RegistroDeAuditoria.gravar(tx, acao, dados)` com schema zod fechado por ação
  - [x] 1.3 `ops:escola` (rede e escola com slug), com `autor_operador` e recusa sem `OPERADOR`
  - [x] 1.4 Testes: slug repetido, nenhuma rota cria escola, `ops:*` sem dado de pessoa, auditoria recusando campo pessoal, isolamento do repository de auditoria

- [x] **2.0 — Guarda de sessão real, com matriz de permissão**
  - [x] 2.1 Migration de `ano_letivo`, `conta`, `usuario`, `sessao` e `registro_acesso`
  - [x] 2.2 `EmissorDeToken` e `GuardaDeSessao` depois da `GuardaDeLimite`, lendo `sessao ⋈ usuario ⋈ ano_letivo em_curso` por `(esc, sid)`, com 503 no erro do banco
  - [x] 2.3 `MATRIZ` em `packages/shared`, `@Permite` e arquivo de expectativa, com o indicador de professor
  - [x] 2.4 `ResolucaoDeTenantRepository` com os `@SemEscopo` justificados, e o teste de que só o módulo `sessao` o importa
  - [x] 2.5 Varredura dos contratos de saída e `ops:sessao-sintetica` só com `AMBIENTE=local`
  - [x] 2.6 Testes: sessão encerrada corta na requisição seguinte, `sub` de A com `esc` de B, ordem das guardas sem consulta ao banco, 503 com o Postgres fora, escola sem ano em curso

- [x] **3.0 — O F0 passa a usar a sessão real e as tabelas do F0 apontam para a escola**
  - [x] 3.1 Sai `ACEITAR_TOKEN_SINTETICO`, o emissor sintético e `ops:token-sintetico`
  - [x] 3.2 Testes de integração do F0, helper de fila e cenário `justica-entre-escolas` montam escola e sessão pelo seed e `ops:sessao-sintetica`
  - [x] 3.3 Handshake do realtime com a mesma leitura da guarda
  - [x] 3.4 Migration só com a FK `NOT VALID` de `escola_id` em `job_registro`, `configuracao_operacional_escola` e `uso_infra_diario`
  - [x] 3.5 Testes: token do emissor antigo recusado, job de escola inexistente recusado, handshake de A fora da sala de B, `npm run carga` verde

- [x] **4.0 — Equipe entra por e-mail e senha**
  - [x] 4.1 `POST /v1/sessao/email` com argon2id e hash fixo para inexistente
  - [x] 4.2 Contador de tentativas no Redis de fila, com HMAC e sufixo `conhecido`/`outro`, e o seguro em memória
  - [x] 4.3 Cookie `educa_dispositivo` e cookie `educa_sessao`
  - [x] 4.4 Desafio com `typ`, `aud` e `jti`, etapas `escolher` e `configurar_mfa`/`mfa`, `registro_acesso`
  - [x] 4.5 Redact novo do logger e `GET /v1/eu` básico
  - [x] 4.6 Testes: respostas iguais, bloqueio com recuo, falhas em paralelo, script em outro navegador, 35 logins do mesmo IP, desafio fora da rota dele

- [x] **5.0 — Renovação, atividade, inatividade e saída**
  - [x] 5.1 `POST /v1/sessao/renovar` com rotação, anterior, `atual_apresentado`, janela de 30 s e reuso
  - [x] 5.2 `POST /v1/sessao/atividade` e inatividade por papel com tolerância de 5 min
  - [x] 5.3 `DELETE /v1/sessao` e `PUT /v1/escola/sessao`
  - [x] 5.4 Métricas `sessao.renovacao`, `sessao.atividade_falha`, `sessao.leitura.duracao`; alerta `reuso-de-refresh` com runbook
  - [x] 5.5 Testes: renovação dupla, resposta perdida, reuso depois de 31 s, 34 e 35 min de inatividade, 12 h absolutas, saída

- [x] **6.0 — Coordenador só acessa com MFA**
  - [x] 6.1 Migration de `codigo_recuperacao`; `configurar` e `ativar` com AES-256-GCM, AAD e versão da chave
  - [x] 6.2 `POST /v1/sessao/mfa` com passo condicional, recuperação de uso único e tentativas consumindo o `jti`
  - [x] 6.3 `POST /v1/usuarios/:id/mfa/redefinir` (202 sempre) e `ops:redefinir-mfa`
  - [x] 6.4 Testes: coordenador sem MFA barrado, TOTP e recuperação em paralelo, quinto erro, AAD, redefinir em A e B

- [x] **7.0 — Primeiro coordenador entra por convite do operador**
  - [x] 7.1 Migration de `convite`; `ops:convite-coordenador` em arquivo 0600 e `ops:revogar-convite`
  - [x] 7.2 `POST /v1/convites/consultar` e `/aceitar` condicional, com os dois caminhos (conta nova e conta existente)
  - [x] 7.3 Testes: aceite em paralelo, expirado, revogado e inexistente iguais, e-mail que já coordena B não troca a senha

- [x] **8.0 — Coordenação monta o ano letivo, as séries, as disciplinas e as turmas**
  - [x] 8.1 Migration de `serie`, `disciplina` e `turma`, com FKs compostas
  - [x] 8.2 Rotas de ano letivo (criar, abrir, encerrar sem virada), séries, disciplinas e turmas
  - [x] 8.3 Testes: série fora do recorte, dois anos abertos em paralelo, "7ºA" em anos diferentes, permissão, isolamento

- [x] **9.0 — Vínculo confirmado é o que dá acesso à turma e aos alunos**
  - [x] 9.1 Migration de `vinculo`; criar e encerrar pela coordenação, `meus-vinculos`, confirmar e contestar
  - [x] 9.2 `GET /v1/turmas/:id` e `/alunos` paginado, com `finalidade` e auditoria na leitura da coordenação
  - [x] 9.3 Testes: duas disciplinas na mesma turma, pendente e contestado sem acesso, encerrado corta, clique duplo, turma sem professor, isolamento

- [x] **10.0 — Virada do ano e leitura do ano encerrado**
  - [x] 10.1 Encerrar o ano leva os vínculos a `fim_do_ano` e apaga o `complemento`, na mesma transação
  - [x] 10.2 `?anoLetivoId` só em leitura, com as condições de coordenação e professor
  - [x] 10.3 Testes: falha no meio desfaz, `fim_do_ano` lê e não edita, `desligamento` dá 404, id de B dá 404
  - [x] 10.4 `GET /v1/vinculos` lista só vínculo de professor, com teste

- [x] **11.0 — Aluno entra pelo endereço da escola com matrícula**
  - [x] 11.1 Migration de `credencial_matricula`; `GET /v1/escolas/:slug/acesso` e `POST /v1/sessao/matricula` no contexto de escola sem usuário
  - [x] 11.2 Contador com a escola na chave e inatividade do aluno
  - [x] 11.3 Testes: matrícula 1234 em A e B, conta segurada só em A, respostas iguais, 399 alunos do mesmo IP, aluno transferido, dois "Enzo Martins"

- [x] **12.0 — Quem trabalha em mais de uma escola escolhe e troca**
  - [x] 12.1 `POST /v1/sessao/escola` com desafio `escolher` ou token de método e-mail
  - [x] 12.2 Troca encerra a sessão de origem, aplica MFA e inatividade do destino; `/v1/eu.acessos`
  - [x] 12.3 Testes: MFA ao ir para coordenação, `usuarioId` de outra conta, sessão de matrícula, id de A depois da troca

- [x] **13.0 — Login pela conta Google ou Microsoft da escola**
  - [x] 13.1 Serviço `oidc-falso` (`mock-oauth2-server`) no compose e na esteira
  - [x] 13.2 Migration de `conta_externa` e `provedor_escola`; `PUT /v1/escola/provedores`
  - [x] 13.3 `iniciar` e `retorno` com `openid-client`, cookie `educa_oidc`, `hd`/`tid`, ligação do professor e recusa igual
  - [x] 13.4 Testes: conta pessoal e domínio errado, aluno sem ligação, `email_verified`, retorno em paralelo, nada no log e no banco, cookie de A com slug de B, provedor fora

- [x] **14.0 — Semáforo de hash justo entre escolas**
  - [x] 14.1 Semáforo com `LOGIN_HASH_CONCORRENCIA` validado contra `UV_THREADPOOL_SIZE`, baldes por escola e "equipe", rodízio
  - [x] 14.2 503 com `Retry-After` aleatório; métricas `login.duracao`, `login.hash_espera`, `login.hash_recusado`
  - [x] 14.3 Alertas `login-lento` e `login-hash-recusado` com runbook
  - [x] 14.4 Testes: boot recusa concorrência alta, B atendida com A cheia, taxa de 503 igual para existente e inexistente

- [x] **15.0 — Ataque de senha nunca bloqueia a escola**
  - [x] 15.1 Rebaixamento por IP×escola com limiar pelo tamanho da escola e passagem pelo cookie de dispositivo
  - [x] 15.2 Limite por IP em `/v1/sessao/email` com rebaixamento e multiplicador de `rede.ips_saida`
  - [x] 15.3 Seguro em memória com o Redis de fila fora; métricas e alertas `login-rebaixado-por-escola` e `login-email-limite-ip` com runbook
  - [x] 15.4 Testes: métrica só em A, erros legítimos sem rebaixar, rede com três escolas, Redis fora, cookie com chave antiga
  - [x] 15.6 Pontos da 14.0: bloco de login extraído, runbook de espera com CPU baixa, prazo e nota LGPD do IP em memória
  - [x] 15.5 Redis de fila travado no login: aviso e métrica do desafio recusado, teste com `CLIENT PAUSE`, prazo de teste do cliente de login, nota em `docs/infra.md`

- [x] **16.0 — Cenário de carga "login às 7h30"**
  - [x] 16.1 `infra/k6/login-7h30.js` e script, com as fases da Tech Spec 7c
  - [x] 16.2 Critérios como `thresholds` do k6 que mudam o código de saída, e conferência de família encerrada por engano
  - [x] 16.3 Calibração do argon2 e de `LOGIN_HASH_CONCORRENCIA` registrada na Tech Spec
  - [x] 16.4 Pontos da 14.0: 503 do semáforo fora do alerta de 5xx, inundação de IPs, aceite de convite
  - [x] 16.5 Despejo com a fila cheia sai de quem foi rebaixado, com `login.rebaixado_ip` e teste

- [x] **17.0 — Ciclo de vida da conta e expurgo**
  - [x] 17.1 Desativação de aluno e de usuário; limpeza da conta sem usuário ativo; eliminação por escola
  - [x] 17.2 `sistema.expurgar-acesso` (registro de acesso, sessão, convite), idempotente
  - [x] 17.3 Testes: hash apagado, conta mantida com usuário em B, limites de 6 meses e 30 dias, expurgo em paralelo
  - [x] 17.4 Redefinir o MFA encerra as sessões abertas da conta, com teste
  - [x] 17.5 A troca de escola grava `saida` no registro de acesso da origem, com teste

- [x] **18.0 — A web mantém a sessão, e a equipe entra por `/entrar`**
  - [x] 18.1 `wouter`, `api/sessao.ts` com token em memória, `Authorization` e renovação única com Web Locks
  - [x] 18.2 409 `JA_RENOVADO`, 503 repetido como "entrando…", 5xx sem logout
  - [x] 18.3 Tela `/entrar` com os quatro estados
  - [x] 18.4 Testes: e2e por teclado e toque nos dois projetos, duas abas, nada em storage nem URL, bundle no teto

- [x] **19.0 — Telas de entrada da escola, do MFA e do convite**
  - [x] 19.1 `/e/:slug` com matrícula e botão da conta da escola, com aviso da TI e `?falha=provedor`
  - [x] 19.2 `/mfa` e `/mfa/configurar` com segredo em texto, copiar e códigos de recuperação
  - [x] 19.3 `/convite#token` com `replaceState` e os dois caminhos
  - [x] 19.4 Testes: e2e de matrícula, conta da escola pelo `oidc-falso`, MFA e convite, com `CONTA_SEGURADA` em português

- [x] **20.0 — Telas depois de entrar: escola, vínculos, saída e inatividade**
  - [x] 20.1 `/escolher-escola` e seletor no cabeçalho, limpando o cache do TanStack Query
  - [x] 20.2 `/vinculos` com confirmar e contestar (código e complemento, com aviso)
  - [x] 20.3 "Sair", timer de inatividade e login por cima da tela sem perder o que foi digitado
  - [x] 20.4 Testes: e2e de inatividade com relógio, troca sem dado de A, clique duplo, Chromebook compartilhado entre dois alunos

## Dependências e paralelismo

| Tarefa | Depende de | Pode correr em paralelo com |
|---|---|---|
| 1.0 | — | — |
| 2.0 | 1.0 | — |
| 3.0 | 2.0 | 4.0, 8.0 |
| 4.0 | 2.0 | 3.0, 8.0 |
| 5.0 | 4.0 | 6.0, 8.0, 9.0 |
| 6.0 | 4.0 | 5.0, 8.0, 9.0 |
| 7.0 | 6.0 | 9.0, 10.0, 11.0, 12.0 |
| 8.0 | 2.0 | 3.0, 4.0 |
| 9.0 | 8.0 | 5.0, 6.0 |
| 10.0 | 9.0 | 7.0, 11.0, 12.0 |
| 11.0 | 4.0, 9.0 | 7.0, 10.0, 12.0 |
| 12.0 | 4.0, 6.0 | 7.0, 10.0, 11.0 |
| 13.0 | 4.0, 11.0 | 14.0, 17.0, 18.0 |
| 14.0 | 4.0, 11.0 | 13.0, 17.0, 18.0 |
| 15.0 | 14.0 | 13.0, 17.0, 18.0 |
| 16.0 | 5.0, 15.0 | 17.0, 19.0, 20.0 |
| 17.0 | 5.0, 9.0, 11.0 | 13.0, 14.0, 15.0, 18.0 |
| 18.0 | 5.0 | 13.0, 14.0, 17.0 |
| 19.0 | 18.0, 6.0, 7.0, 11.0, 13.0 | 16.0, 20.0 |
| 20.0 | 18.0, 9.0, 12.0 | 16.0, 19.0 |

Com commit direto no `main` e esteira verde antes do commit seguinte (regra 40), "paralelo"
quer dizer "sem dependência de código", não duas tarefas commitando ao mesmo tempo.

## Subagentes por tarefa

| Tarefa | Subagentes obrigatórios |
|---|---|
| 1.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `test-engineer` |
| 2.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `conformidade-reviewer`, `test-engineer` |
| 3.0 | `tenancy-guardian`, `infra-guardian`, `test-engineer` |
| 4.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `test-engineer` |
| 5.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `test-engineer` |
| 6.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `test-engineer` |
| 7.0 | `tenancy-guardian`, `privacy-guardian`, `test-engineer` |
| 8.0 | `tenancy-guardian`, `test-engineer` |
| 9.0 | `tenancy-guardian`, `privacy-guardian`, `test-engineer` |
| 10.0 | `tenancy-guardian`, `privacy-guardian`, `test-engineer` |
| 11.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `test-engineer` |
| 12.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `test-engineer` |
| 13.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `domain-researcher`, `test-engineer` |
| 14.0 | `infra-guardian`, `privacy-guardian`, `test-engineer` |
| 15.0 | `infra-guardian`, `privacy-guardian`, `tenancy-guardian`, `test-engineer` |
| 16.0 | `infra-guardian`, `test-engineer` |
| 17.0 | `privacy-guardian`, `tenancy-guardian`, `infra-guardian`, `test-engineer` |
| 18.0 | `frontend-reviewer`, `privacy-guardian`, `infra-guardian`, `test-engineer` |
| 19.0 | `frontend-reviewer`, `privacy-guardian`, `test-engineer` |
| 20.0 | `frontend-reviewer`, `privacy-guardian`, `tenancy-guardian`, `test-engineer` |

## Critério de pronto da funcionalidade

Do `ROADMAP.md`: teste prova que a escola A não lê, não escreve e não descobre nada da B, e
que um professor com vínculo nas duas não leva dado de uma para a outra. Detalhado:

- Os 21 RF do PRD têm código e teste que falharia sem a regra
- Os testes de isolamento da Tech Spec seção 6 estão verdes, e cada um quebra quando a
  cláusula de escola é retirada
- Nenhum caminho de login recusa um aluno por causa de outro no mesmo IP, e o cenário
  `login-7h30` passa com os critérios da Tech Spec 7c
- Nenhum e-mail, nome, foto ou claim de aluno vindo do Google ou da Microsoft aparece no
  banco nem no log
- O token sintético não existe mais, e os testes e o cenário do F0 continuam verdes
- `docs/lgpd.md` tem todas as linhas dos campos novos, e `docs/runbook.md` tem uma entrada
  por alerta novo
- Portão inteiro verde (typecheck, lint, test, e2e, infra) e esteira verde no commit final
