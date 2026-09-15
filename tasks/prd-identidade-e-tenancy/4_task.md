# Tarefa 4.0 — Equipe entra por e-mail e senha

**Funcionalidade:** identidade-e-tenancy · **Depende de:** 2.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `test-engineer`

## Objetivo

Professor e coordenador entram por e-mail e senha. A resposta é a mesma para conta que
existe e para conta que não existe, e errar a senha segura só aquela conta, e só em outro
navegador. Quem tem mais de uma escola recebe a etapa `escolher`, e o coordenador recebe a
etapa de MFA.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF6 (e-mail e senha, respostas iguais), RF11 (segura por conta, nunca por IP),
  RF14 (mais de uma escola) e os casos de borda "35 logins do mesmo IP" e "Chromebook do carrinho"
- `techspec.md`:
  - seção 4: desafio e rotas `/v1/sessao/email` e `/v1/eu`
  - seção 5: "Hash" (algoritmo e hash fixo), "Tentativas", "Etapas", e em "Baldes" os parágrafos "Passagem" e "Onde fica"
  - seção 6: métodos `@SemEscopo` desta tarefa (conta por e-mail, gravar `registro_acesso` com escola nula)
  - seção 7: redact novo
  - seção 7c: Redis de fila cai
- `.claude/rules/80-infra-e-carga.md`, item 1: a escola inteira é um IP; bloqueio é por conta
- `.claude/rules/20-lgpd-menores.md`, itens 6, 9 e 11: resposta igual; log só com id; erro curto
- `.claude/rules/10-multitenancy.md`, item 9: conta global só pelo `ResolucaoDeTenantRepository`
- `docs/lgpd.md`, seção 2: linhas de hash, e-mail global, sessão, contador e cookie de dispositivo
- `docs/infra.md`, seção 3.1 e seção 5.1
- Código existente:
  - `packages/nucleo/src/limite/limitador.ts`: `rate-limiter-flexible` com `SeguroEmMemoria` e `limite.seguro_ativo`, que é o padrão a seguir no contador
  - `packages/nucleo/src/redis/clientes.ts`: `criarClienteRedisDaFila`
  - `packages/nucleo/src/limite/rota-anonima.decorator.ts`: `@RotaAnonima`
  - `packages/nucleo/src/log/logger.ts`: `CAMINHOS_REDACT` e `CHAVES_PESSOAIS`
  - `packages/nucleo/src/identidade/emissor-de-token.ts` e `apps/api/src/sessao/resolucao-de-tenant.repository.ts` (2.0)
  - `packages/nucleo/src/auditoria/acoes.ts` (1.0)

## Subtarefas

- [ ] 4.1 — `POST /v1/sessao/email` com `@RotaAnonima`
  - **Hash:** `@node-rs/argon2`, argon2id, p=1, com parâmetros por variável de ambiente validada no boot (mínimo OWASP m=19456, t=2). A calibração fica na 16.0.
  - **Conta inexistente:** verifica contra um hash fixo gerado no boot com os mesmos parâmetros e responde igual à senha errada.
  - **Usuário desativado:** conta sem usuário ativo também responde igual.
  - **Consulta:** conta por e-mail pelo `ResolucaoDeTenantRepository`; depois da credencial, usuários ativos da conta.
- [ ] 4.2 — Contador de tentativas no Redis de fila
  - **Chave:** `login:{HMAC(LOGIN_CHAVE_CONTADOR, email normalizado)}:{conhecido|outro}`, consultada antes do hash.
  - **Recuo:** depois de 5 falhas seguidas, espera de 30 s que dobra até 15 min, com 429 `CONTA_SEGURADA` e `Retry-After`; o acerto zera o contador daquele sufixo.
  - **Redis fora:** contador em memória por instância com a mesma regra, ligando `limite.seguro_ativo`.
  - **Código novo:** `CONTA_SEGURADA` em `packages/shared`, com mensagem pt-BR que diz quanto esperar.
  - **Métrica:** `login.conta_segurada`.
- [ ] 4.3 — Cookies
  - **`educa_dispositivo`:**
    - até 50 entradas `HMAC(LOGIN_CHAVE_DISPOSITIVO_V{n}, email)`, cada uma com a data, e a versão da chave no cookie;
    - validade de 30 dias por entrada, a mais antiga sai primeiro;
    - atributos `HttpOnly; Secure` fora do local, `SameSite=Strict; Path=/v1/sessao`;
    - gravado só depois de login bem-sucedido; cookie com chave antiga é ignorado;
    - decide o sufixo `conhecido` do contador.
  - **`educa_sessao`:** refresh aleatório de 32 bytes (grava-se o SHA-256), `HttpOnly`, `Secure` fora do local, `SameSite=Strict`, `Path=/v1/sessao`, sem `Max-Age`.
- [ ] 4.4 — Desafio e etapas
  - **Desafio:** JWT de 5 min com `typ: desafio+jwt`, `aud: sessao`, `jti`, `conta_id`, etapa e `mfa_cumprido`. O `jti` é consumido com `SET NX` no Redis de fila quando a etapa conclui.
  - **Etapas:** coordenador sem MFA vai a `configurar_mfa`, e com MFA a `mfa`. Com mais de um usuário ativo, vai a `escolher`. Nos outros casos, `pronta`.
  - **Sessão:** só é gravada em `pronta`, com `metodo=email`, família nova e `expira_em` de 12 h.
  - **Nesta tarefa:** `configurar_mfa`, `mfa` e `escolher` só devolvem o desafio. As rotas que o consomem são da 6.0 e da 12.0.
  - **Registro de acesso:** `login` e `login_falho` em `registro_acesso`, com escola nula na falha e método `@SemEscopo` justificado.
- [ ] 4.5 — Redact e `/v1/eu`
  - **Redact:** acrescenta ao `CAMINHOS_REDACT` todos os caminhos da seção 7 da Tech Spec, inclusive `set-cookie`, `cookie` e `*.dispositivo`.
  - **`GET /v1/eu`:** `{ usuarioId, papel, nome, escola:{id,nome,slug}, inatividadeMin }`, com contrato zod. `acessos` entra na 12.0.
  - **Auditoria:** nenhuma ação nova aqui; o login fica no `registro_acesso`.
- [ ] 4.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sessao/login-email.controller.ts`, `login.service.ts`, `hash-de-senha.ts`, `contador-de-tentativas.ts`, `cookie-dispositivo.ts`, `desafio.ts` | novo |
| `apps/api/src/sessao/eu.controller.ts` | novo |
| `apps/api/src/sessao/resolucao-de-tenant.repository.ts`, `sessao.module.ts` | alterado |
| `packages/shared/src/sessao/login.ts`, `eu.ts`; `packages/shared/src/erros/codigo-de-erro.ts`, `mensagens.ts` | novo, alterado |
| `packages/nucleo/src/log/logger.ts`, `logger.test.ts`, `telemetria/metricas.ts` | alterado |
| `apps/api/package.json` (`@node-rs/argon2`), `.env.example`, `infra/compose.yml` | alterado |
| `apps/api/src/sessao/*.test.ts`, `apps/api/test/login-email.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: professor com um usuário ativo entra, recebe `pronta`, token e `educa_sessao`; `/v1/eu` devolve o contrato; `registro_acesso` grava `login` | integração | RF6 |
| privacidade: senha errada, e-mail inexistente e conta com usuário desativado dão status e corpo iguais, e o argon2 roda uma vez em cada (espião no hash, sem medir tempo) | integração | RF6, sem revelar existência |
| borda: 5 falhas dão `CONTA_SEGURADA` com 30 s; com relógio simulado, a sexta dá 60 s; o acerto zera | unidade + integração | recuo da seção 5 |
| concorrência: 10 senhas erradas em paralelo (`Promise.all`) avaliam no máximo 5 hashes antes do bloqueio | integração | contador atômico, não "lê e depois grava" |
| borda: script sem cookie segura o contador `outro`; o professor com `educa_dispositivo` válido continua entrando | integração | ataque de outro navegador não tranca a pessoa |
| borda: 35 professores do mesmo IP em 1 min entram, com um deles segurado por errar a senha | integração | RF11 e regra 80, item 1 |
| borda: conta com usuário em A e em B recebe `escolher`; coordenador sem MFA recebe `configurar_mfa`; nenhum dos dois grava sessão nem `educa_sessao` | integração | sessão só em `pronta` |
| permissão: desafio usado como Bearer em `/v1/eu` é recusado; token de acesso no lugar do desafio também | integração | `typ` e `aud` separam os dois |
| borda: `login_falho` por e-mail grava com escola nula; `login` com escola nula o banco recusa | integração | check da seção 3 |
| falha: Redis de fila fora, o contador em memória segura a conta e `limite.seguro_ativo` fica em 1 | integração | seguro da seção 5 |
| privacidade: depois de um login com erro, o log não contém e-mail, senha, cookie nem desafio | integração | redact novo |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [ ] Todos os revisores obrigatórios com rodada na seção "Revisões", iniciada depois da
  última alteração de código, e APROVADO nos que têm veto
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- Renovação, atividade, inatividade e saída (5.0)
- MFA: configurar, ativar e verificar (6.0)
- `POST /v1/sessao/escola` e `acessos` (12.0)
- Login por matrícula (11.0) e pela conta externa (13.0)
- Semáforo de hash, baldes e 503 com `Retry-After` (14.0); rebaixamento e limite por IP (15.0)
- Calibração do argon2 (16.0)
- Tela `/entrar` (18.0)

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->
