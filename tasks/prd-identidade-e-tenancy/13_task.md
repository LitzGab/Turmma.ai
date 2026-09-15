# Tarefa 13.0 — Login pela conta Google ou Microsoft da escola

**Funcionalidade:** identidade-e-tenancy · **Depende de:** 4.0, 11.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `domain-researcher`, `test-engineer`

## Objetivo

Professor e aluno entram pelo botão da conta Google ou Microsoft da escola, e só vale conta do
domínio ou tenant que a escola cadastrou. Guarda-se só provedor e identificador estável. O
professor é ligado na primeira entrada pelo e-mail verificado; o aluno só entra com conta já
ligada. Nada que o provedor devolve sobre o aluno chega ao banco nem ao log. Ao terminar, o
fluxo roda inteiro contra o `oidc-falso` do compose, sem conta em serviço externo.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF8, RF9 e RF10; casos de borda do admin que não liberou o app para menores, do
  e-mail de professor recriado para outra pessoa, da escola com dois domínios Google e da escola
  que revoga o app no meio do ano
- `techspec.md`:
  - seção 3: `conta_externa` (`E usuario_id, provedor, tenant?, sujeito`, com o único) e `provedor_escola`;
  - seção 4: rotas `externa/:provedor/iniciar` e `retorno`, e `PUT /v1/escola/provedores`;
  - seção 5, "Externo": cookie `educa_oidc`, escopos, discovery, timeout, conferência, ligação e recusa;
  - seção 6: testes de `hd` de A cadastrado em B e de cookie de A com `?slug=` de B;
  - seção 7: redact das claims e teste do log;
  - seção 7c: provedor fora;
  - seção 12: premissas ⚠️.
- Pesquisa já feita nas sessões da Tech Spec (14/09/2026):
  - **`openid-client` 6.8.8 (MIT, ESM):** `discovery`, `randomPKCECodeVerifier`, `calculatePKCECodeChallenge`, `randomState`, `randomNonce`, `buildAuthorizationUrl` e `authorizationCodeGrant(config, url, { pkceCodeVerifier, expectedState, expectedNonce, idTokenExpected })`, com as claims em `tokens.claims()`. Com emissor em http no local, precisa de `allowInsecureRequests`.
  - **Issuer da Microsoft:** a lib troca `{tenantid}` pelo `tid` do token e aceita qualquer tenant, então a lista de `tid` permitidos é nossa.
  - **`mock-oauth2-server` 6.0.2 (MIT, `ghcr.io/navikt/mock-oauth2-server`):** configurado por `JSON_CONFIG`, com `requestMappings` pelo parâmetro `subject` para cada usuário de teste receber o seu `hd`, `tid`, `oid`, `email` e `email_verified`. O issuer dele não é `login.microsoftonline.com`, então o tratamento especial da lib não roda no teste.
  - **Chave:** `sub` no Google, `oid`+`tid` na Microsoft; nunca o e-mail. O `oid` exige o escopo `profile`.
  - **Domínio e tenant:** `hd` no Google (gmail.com vem sem `hd`), `tid` na Microsoft (conta pessoal vem com o tenant `9188040d-6c67-4c5b-b112-36a304b66dad`).
  - **Não verificado:** que `error` volta ao redirect quando o admin bloqueou o app para menor (Google) ou falta consentimento (Microsoft), e se o `nonce` vem no ID token do `mock-oauth2-server`.
- **`domain-researcher`:** antes de fechar a tarefa, confirma as premissas ⚠️ da seção 12 da Tech Spec que puderem ser verificadas em documentação oficial ou no próprio servidor falso (`nonce`, formato do erro). O que continuar sem confirmação fica marcado ⚠️ na Tech Spec, com a mesma mensagem genérica.
- `.claude/rules/00-arquitetura.md`, itens 7 e 8: o provedor externo é adaptador opcional, e o
  compose sobe sem conta externa
- `.claude/rules/10-multitenancy.md`: a escola do retorno vem do cookie cifrado, nunca da query;
  conta ligada em A não entra em B
- `.claude/rules/20-lgpd-menores.md`, itens 2, 9 e 12: do aluno só o identificador opaco;
  e-mail, nome e foto descartados antes de gravar; nada de claim em log
- `.claude/rules/80-infra-e-carga.md`, item 4 (análogo ao gateway): dependência externa com
  timeout, sem derrubar os outros caminhos de login
- D48 no `CLAUDE.md`
- Código existente:
  - `infra/compose.yml`: os serviços `postgres`, `redis-fila`, `borda` e `web`, para o novo `oidc-falso`;
  - `tools/ci/compose.ts`, `tools/ci/integracao.ts` e `tools/ci/e2e.ts`: como a esteira sobe o compose;
  - `.github/workflows/ci.yml`: os jobs `integracao` e `e2e`;
  - `.env.example`: variáveis obrigatórias sem valor real;
  - `packages/nucleo/src/log/logger.ts`: `CAMINHOS_REDACT`.
- O que as tarefas anteriores criam:
  - `ResolucaoDeTenantRepository`, `EmissorDeToken` e `@Permite` (criados na 2.0);
  - etapas, cookies `educa_sessao` e `educa_dispositivo`, `registro_acesso` e redact novo (criados na 4.0);
  - `RegistroDeAuditoria` (criado na 1.0);
  - contexto de escola sem usuário e `/v1/escolas/:slug/acesso` (criados na 11.0).

## Subtarefas

- [ ] 13.1 — Serviço `oidc-falso` (`ghcr.io/navikt/mock-oauth2-server:6.0.2`) no compose e na esteira.
  - **Emissores:** um `google` e um `microsoft`.
  - **Usuários de teste:** `JSON_CONFIG` com `requestMappings` por `subject`, de claims fixas e sintéticas:
    - professor de A com `hd` de A e `email_verified`;
    - professor sem `email_verified`;
    - aluno de A com e-mail, nome e foto falsos;
    - conta pessoal sem `hd`;
    - conta Microsoft pessoal com o tenant de conta pessoal;
    - tenant de A e tenant de B.
  - **Variáveis:** URLs de discovery e client id por provedor em `.env.example`, sem segredo real.
  - **Esteira:** os jobs `integracao` e `e2e` sobem o serviço, e nenhum teste chama Google ou Microsoft de verdade.
- [ ] 13.2 — Migration e rota de cadastro.
  - **Tabela `conta_externa`:** `E usuario_id, provedor (google|microsoft), tenant?, sujeito`, com `unique (escola_id, provedor, coalesce(tenant,''), sujeito)` e FK composta.
  - **Tabela `provedor_escola`:** `E provedor, valor`, com `hd` para Google e `tid` para Microsoft, e mais de um por escola permitido.
  - **`PUT /v1/escola/provedores`:** só coordenador, com `@Permite`. Grava auditoria (alteração de permissão, regra 20, item 10) com `antes` e `depois` na lista fechada de ids e valores de domínio.
  - **`GET /v1/escolas/:slug/acesso`:** passa a listar só o tipo dos provedores.
- [ ] 13.3 — Porta de provedor externo com adaptador `openid-client`.
  - **`iniciar?slug=`:** resolve a escola e grava `escola_id`, `state`, `nonce` e verificador PKCE no cookie `educa_oidc` (AES-256-GCM, 5 min, `SameSite=Lax`, `HttpOnly`). Escopo `openid email` no Google e `openid email profile` na Microsoft, sem `offline_access`.
  - **Discovery e JWKS:** preguiçosos, com timeout de 5 s, uma busca por vez por provedor e sem guardar falha em cache.
  - **`retorno`:** ignora `slug` na query e usa a escola do cookie. `authorizationCodeGrant` com timeout de 5 s. Confere `hd` ou `tid` contra `provedor_escola` dessa escola, com a chave `sub` ou `oid`+`tid`.
  - **Com ligação:** conta ligada a usuário ativo dessa escola entra (sessão `metodo = externo`).
  - **Sem ligação, professor:** liga se o e-mail bate com a `conta` de um professor ativo dessa escola e o Google trouxe `email_verified` ou o `tid` já foi validado. Grava auditoria da ligação.
  - **Recusa:** todo o resto recebe a mesma recusa `CONTA_EXTERNA_NAO_LIGADA`: aluno sem ligação, segundo `sujeito` com o mesmo e-mail, conta de outra escola, domínio ou tenant errado.
  - **Descarte:** `id_token`, `access_token` e claims nunca são gravados, logados nem colocados em exceção.
  - **Erro do provedor:** qualquer `error` no retorno, e o timeout, redirecionam à web com `?falha=provedor`.
- [ ] 13.4 — Testes (tabela abaixo), contra o `oidc-falso` real do compose, nunca com a lib
  mockada.

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `infra/compose.yml`, `infra/oidc-falso/config.json`, `.env.example` | alterado / novo |
| `tools/ci/compose.ts` (serviço na esteira, se preciso) | alterado |
| `packages/nucleo/src/db/schema/conta-externa.ts`, `provedor-escola.ts`, migration em `packages/nucleo/drizzle/` | novo |
| `apps/api/src/sessao/externa/provedor-externo.port.ts`, `openid-client.adapter.ts`, `externa.controller.ts`, `externa.service.ts`, `cookie-oidc.ts` | novo |
| `apps/api/src/estrutura/provedores-da-escola.controller.ts` | novo |
| `packages/shared/src/sessao/externa.ts`, `packages/shared/src/estrutura/provedores.ts` | novo |
| `packages/nucleo/src/log/logger.ts` | alterado (confere o redact de claims) |
| `apps/api/test/sessao-externa.int.test.ts`, `provedores-da-escola.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: professor de A com `hd` de A e `email_verified` entra a primeira vez, fica ligado (uma `conta_externa`), grava auditoria, e na segunda vez entra pela ligação | integração | RF9 |
| borda: conta pessoal sem `hd`, `hd` de outra escola, tenant de conta pessoal e tenant não cadastrado dão a mesma recusa, com status e corpo iguais | integração | RF8 |
| borda: aluno de A com domínio válido e sem ligação é recusado, e nenhuma linha nova aparece em `usuario`, `conta_externa` nem `sessao` | integração | RF10 |
| borda: professor sem `email_verified` é recusado; segundo `sujeito` com o mesmo e-mail de professor já ligado é recusado (e-mail recriado para outra pessoa) | integração | a chave é o identificador, não o e-mail |
| borda: escola com dois `hd` cadastrados aceita conta de qualquer um deles | integração | caso de borda do PRD |
| concorrência: dois `retorno` em paralelo no primeiro login do mesmo professor criam uma `conta_externa` só | concorrência | índice único |
| privacidade: depois do login do aluno ligado, busca no log capturado e em todas as tabelas pelo e-mail, nome e URL de foto do `oidc-falso` não acha nada | integração | regra 20, itens 2 e 9 |
| isolamento: cookie `educa_oidc` de A com `?slug=` de B no retorno entra só em A; B cadastrando o `hd` de A não recebe o aluno ligado em A | isolamento | quebra se a escola vier da query ou se a ligação não for por escola |
| falha: `error=access_denied` no retorno e `oidc-falso` parado (timeout de 5 s) viram `?falha=provedor`, e o login por matrícula da mesma escola continua respondendo | integração | provedor fora não derruba o resto |
| falha: discovery falhando uma vez não fica em cache; a chamada seguinte, com o serviço de volta, funciona | integração | sem cache de falha |
| permissão: professor em `PUT /v1/escola/provedores` é recusado; coordenador de A não altera os provedores de B | integração | `@Permite` e escopo |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [ ] Premissas ⚠️ da Tech Spec seção 12 revistas com o `domain-researcher`, e a Tech Spec atualizada com o que foi confirmado
- [ ] Todos os revisores obrigatórios com rodada na seção "Revisões", iniciada depois da
  última alteração de código, e APROVADO nos que têm veto
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- Botão da conta da escola na tela `/e/:slug`, aviso da TI e mensagem de `?falha=provedor`: 19.0
- Ligar a conta Google ou Microsoft de aluno (importação do Classroom ou reivindicação): F2
- Checklist para a TI da escola liberar o app: F2
- Troca de escola a partir de sessão externa (leva ao login da outra escola): 20.0
- Eliminação de `conta_externa` por escola: 17.0

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->
