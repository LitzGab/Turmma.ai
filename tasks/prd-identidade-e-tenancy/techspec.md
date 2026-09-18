# Tech Spec — Identidade e tenancy

**PRD:** `tasks/prd-identidade-e-tenancy/prd.md`
**Status:** rascunho (revisto após duas rodadas de `tenancy-guardian`, `privacy-guardian` e `infra-guardian`, 14/09/2026)

## 1. Resumo da abordagem

`conta` é global e só da equipe: e-mail, hash e TOTP. Todo o resto tem escola:
- `usuario`, a pessoa na escola, com papel;
- a credencial por matrícula do aluno;
- a conta externa ligada.

**Token.** JWT HS256 de 10 min, em memória na web, com `sub=usuarioId`, `esc` e `sid`. A
renovação usa cookie httpOnly com rotação em `sessao`, no Postgres.

**Guardas, nesta ordem.**
1. Verificam o JWT.
2. Aplicam o limite por `sub` e `esc`.
3. Leem, numa consulta, a sessão, o usuário e o ano letivo em curso, por `(esc, sid)`.

**Antes do contexto.** Login e retorno externo resolvem a escola pelo slug e abrem um contexto
de escola sem usuário. Assim, credencial, conta externa e provedor são lidos pelos
repositories com escopo.

**Login externo.** Usa `openid-client` contra Google, Microsoft ou o `mock-oauth2-server` do
compose.

## 2. Módulos afetados

| Módulo | Novo ou alterado | O quê |
|---|---|---|
| `nucleo/identidade` | alterado | `GuardaDeSessao` depois da `GuardaDeLimite`; contexto com `papel`, `sessaoId`, `anoLetivoId` e contexto de escola sem usuário; `EmissorDeToken`; saem o emissor sintético e `ACEITAR_TOKEN_SINTETICO` |
| `nucleo/permissao`, `nucleo/auditoria` | novo | `MATRIZ` e `@Permite`; `RegistroDeAuditoria.gravar(tx, acao, dados)` com schema zod por ação |
| `api/sessao` | novo | senha, externo, MFA, renovar, atividade, trocar escola, sair, convite; `ResolucaoDeTenantRepository` |
| `api/estrutura` | novo | ano letivo, série, turma, disciplina, vínculo, configuração de acesso |
| `api/ops` | alterado | `ops:escola`, `ops:convite-coordenador`, `ops:revogar-convite`, `ops:redefinir-mfa`, `ops:sessao-sintetica` |
| `worker` | alterado | `sistema.expurgar-acesso` (lote, não urgente) |
| `realtime` | alterado | handshake com a mesma leitura da guarda |
| `shared` | alterado | contratos, `MATRIZ`, códigos `MFA_NECESSARIO`, `CONTA_SEGURADA`, `JA_RENOVADO`, `CONTA_EXTERNA_NAO_LIGADA` |
| `web` | alterado | `wouter` (+2,8 kB), telas de acesso, cliente com renovação |
| `infra` | alterado | `oidc-falso`, `UV_THREADPOOL_SIZE`, cenário `login-7h30`, alertas |

## 3. Modelo de dados

UUIDv7. `E` = `escola_id`, `A` = `ano_letivo_id`. Toda tabela com `E` tem `unique (escola_id,
id)`, e toda referência é FK composta com `escola_id`. A turma tem `unique (escola_id,
ano_letivo_id, id)`, e o vínculo a referencia por `(escola_id, ano_letivo_id, turma_id)`.

```
rede             nome, tipo, ips_saida inet[] (IP público de saída da rede, não é dado de pessoa)
escola           rede_id, nome, slug unique, inatividade_aluno_min 30, inatividade_equipe_min 120
ano_letivo    E  ano, inicio, fim, situacao (planejado|em_curso|encerrado); unique parcial (E) em_curso;
                 unique (E, ano) (8.0)
serie         E  etapa (ef_anos_finais|em), ano; check 6–9 | 1–3; unique (E, etapa, ano)
disciplina    E  nome, area? (área da BNCC); unique (E, lower(nome))
turma         EA serie_id, nome, turno? (manha|tarde|noite|integral); unique (E, A, lower(nome))
conta            email citext unique, senha_hash?, mfa_segredo_cifrado?, mfa_chave_versao?,
                 mfa_ativado_em?, mfa_ultimo_passo?
codigo_recuperacao  conta_id, hmac, usado_em?
usuario       E  conta_id? (nulo só para aluno), papel (coordenador|professor|aluno), nome, desativado_em?
                 unique (E, conta_id, papel)
credencial_matricula E usuario_id, matricula, senha_hash; unique (E, matricula)
conta_externa E  usuario_id, provedor, tenant?, sujeito; unique (E, provedor, coalesce(tenant,''), sujeito)
provedor_escola E provedor, valor (hd|tid)
vinculo       EA usuario_id, turma_id, disciplina_id?, papel, estado (pendente|confirmado|contestado|
                 encerrado), contestacao (nao_leciono|turma_errada|disciplina_errada|outro)?,
                 complemento varchar(140)?, motivo_encerramento (fim_do_ano|desligamento|realocacao)?,
                 criado_por, decidido_em?, encerrado_em?
                 unique parcial (E, A, usuario_id, turma_id, disciplina_id) where estado <> 'encerrado'
                 índices (E, A, usuario_id, estado), (E, A, turma_id, estado)
sessao        E  conta_id?, usuario_id, metodo (email|matricula|externo), familia, refresh_hash unique,
                 refresh_hash_anterior? (índice), atual_apresentado bool, rotacionado_em?,
                 ultimo_uso_em, expira_em (12 h), encerrada_em?, motivo?; fillfactor 70
convite       E  token_hash unique, tipo (coordenador), usuario_id, expira_em (72 h), usado_em?, revogado_em?
registro_acesso E? usuario_id?, evento (login|login_falho|renovacao|saida), ip, em; índice (E, em)
                 check (escola_id is not null or (evento = 'login_falho' and usuario_id is null))
auditoria     E  autor_usuario_id?, autor_operador?, acao, entidade, entidade_id, antes?, depois?,
                 finalidade?, requisicao_id, em
                 check (escola_id is not null or (autor_operador is not null and entidade = 'rede'))
```

**Aluno.** É `usuario` sem `conta`, com `credencial_matricula` e vínculo confirmado. No F1 esse
vínculo vem do seed; no F2, da lista.

**Auditoria.** `antes` e `depois` seguem uma lista fechada por ação: ids, estados e datas. Um
teste recusa `nome`, `email`, `matricula`, `complemento`, `hash` e `segredo`.
- A conferência do mapa falha fechada: só aceita objeto estrito, id, data, enum, literal, número e
  booleano. `finalidade` também é declarada por ação, como `enum` de códigos, nunca texto livre.
- A escrita tem uma porta só (`RegistroDeAuditoria`), e o banco exige um autor e só um.
- Sem `unique (escola_id, id)`: nenhuma tabela referencia a auditoria.

**Migrations.**

A numeração segue a ordem das tarefas (`tasks.md`), uma migration por tarefa que cria tabela:

| Tarefa | O que cria |
|---|---|
| 1.0 | `rede`, `escola` (com `inatividade_*`), `auditoria` sem FK em `autor_usuario_id`, que a 2.0 acrescenta |
| 2.0 | `ano_letivo`, `conta`, `usuario`, `sessao`, `registro_acesso` |
| 3.0 | FK `NOT VALID` de `escola_id` em `job_registro`, `configuracao_operacional_escola` e `uso_infra_diario`, sozinha na migration |
| 6.0, 7.0 | `codigo_recuperacao`; `convite` |
| 8.0 | `serie`, `disciplina`, `turma` |
| 9.0 | `vinculo` |
| 11.0, 13.0 | `credencial_matricula`; `conta_externa`, `provedor_escola` |

No deploy do F1 inteiro, todas rodam numa transação só, e a trava de `job_registro` fica do
`ALTER` da 3.0 até o commit, depois de DDL de tabelas vazias (milissegundos). Vale o `lock_timeout` de 5 s com 3 tentativas do F0. O `VALIDATE`
entra numa migration de deploy posterior, fora do horário letivo, depois de confirmar zero
órfãos. O `CREATE INDEX CONCURRENTLY` segue adiado, porque as tabelas nascem vazias.

## 4. API

Envelope de erro do F0. As rotas anônimas levam `@RotaAnonima`.

**Desafio.** JWT de 5 min com `typ: desafio+jwt`, `aud: sessao`, `jti`, `conta_id` ou `usuario_id`, escola, etapa e `mfa_cumprido`.
- A guarda de acesso recusa esse `typ`, e as rotas de sessão recusam o token de acesso.
- O `jti` é consumido (`SET NX` no Redis de fila) quando a etapa é concluída ou no quinto código errado. Os quatro primeiros erros não consomem.
- Com o Redis fora, o desafio é recusado e a pessoa entra de novo. Só afeta quem tem MFA ou mais de uma escola.

| Método | Rota | Papel | Entrada | Saída |
|---|---|---|---|---|
| GET | `/v1/escolas/:slug/acesso` | anônimo | — | `{ nome, provedores: ('google'\|'microsoft')[] }` |
| POST | `/v1/sessao/email`, `/matricula` | anônimo | `{ email, senha, bilhete? }`, `{ slug, matricula, senha }` | `{ etapa, desafio? }`; cookie em `pronta` |
| GET | `/v1/sessao/externa/:provedor/iniciar?slug=`, `/retorno` | anônimo | — | 302 |
| POST | `/v1/sessao/mfa` | desafio `mfa` | `{ codigo }` ou `{ recuperacao }` | etapa |
| POST | `/v1/conta/mfa/configurar`, `/ativar` | desafio `configurar_mfa`, MFA inativo | —, `{ codigo }` | `{ uri, segredo }`, `{ codigosRecuperacao }`; `no-store` |
| POST | `/v1/sessao/escola` | desafio `escolher` ou token de método e-mail | `{ usuarioId }` | etapa ou `{ token }` |
| POST | `/v1/sessao/renovar`, `/atividade`; DELETE `/v1/sessao` | cookie; token | — | `{ token, expiraEm }`; 204 |
| GET | `/v1/eu` | token | — | `{ usuarioId, papel, nome, escola:{id,nome,slug}, inatividadeMin, acessos:[{usuarioId, escolaNome, papel}] }` |
| POST | `/v1/convites/consultar`, `/aceitar` | anônimo | `{ token }`, `{ token, senha? }` | `{ escolaNome }`, `{ etapa: 'configurar_mfa', desafio }` ou `{ etapa: 'entrar', bilhete }` |
| GET/POST | `/v1/anos-letivos`, `/:id/abrir`, `/:id/encerrar`, `/series`, `/disciplinas`, `/turmas` | coordenador | zod; listagens com `?pagina&limite`; `anoLetivoId?` no corpo da turma só confere (outro que não o em curso é 404) | DTO; listagens `{ itens, proxima? }`. A listagem de turmas é a célula `turma.listar`, só da coordenação (8.0) |
| GET | `/v1/turmas/:id`, `/:id/alunos?pagina&finalidade` | coordenador (`finalidade` obrigatória em `/alunos`, um de `acompanhamento_pedagogico`, `atendimento_a_familia`, `conferencia_de_cadastro`); professor com vínculo | `?anoLetivoId` | `{ id, nome, serie }`, `{ itens:[{usuarioId, nome}], proxima? }` |
| GET/POST | `/v1/vinculos?estado`, `/v1/vinculos`, `/:id/encerrar`; `/v1/meus-vinculos`; `/:id/confirmar`, `/contestar` | coordenador; professor dono | `{ usuarioId, turmaId, disciplinaId?, papel }` (no F1, `papel` só `professor`: o de aluno vem do seed), `{ motivo }`, `{ contestacao, complemento? }` | `{ id, turma:{id,nome}, disciplina?:{id,nome}, estado, contestacao?, decididoEm? }`; a coordenação recebe também `usuarioId`, `papel`, `complemento?` e `motivoEncerramento?` (9.0) |
| PUT | `/v1/escola/provedores`, `/sessao` | coordenador | listas, minutos | DTO |
| POST | `/v1/usuarios/:id/mfa/redefinir` | coordenador | `{ finalidade }` | 202, sempre |

## 5. Fluxo

**Baldes do semáforo, sem revelar existência.**
- **Matrícula:** vai sempre ao balde da escola do slug, exista a matrícula ou não. Slug inexistente vai a um balde próprio, e o slug é público de qualquer jeito (`/acesso`).
- **E-mail:** todo login por e-mail vai ao balde "equipe", exista a conta ou não. Dentro do balde, o atendimento roda por IP.
  - O `/v1/sessao/email` tem limite próprio por IP: 60/min por padrão, pela variável `LIMITE_LOGIN_EMAIL_IP_MIN`. Acima dele, nada é recusado: as tentativas desse IP vão para o fim do balde, e quem traz no `educa_dispositivo` a conta já conhecida mantém a vez.
  - IP de saída cadastrado numa rede (`rede.ips_saida`) recebe esse limite vezes o número de escolas da rede, porque a rede municipal sai por um IP só.
  - A regra 80, item 1 trata da rajada de alunos. A equipe atrás de um NAT é dezenas de pessoas.
- **Rajada de falhas na matrícula:** nunca bloqueia, só rebaixa a prioridade.
  - **Limiar:** `max(100, 25% dos alunos ativos da escola)` falhas por minuto de um IP naquela escola.
  - **Acima do limiar:** as tentativas desse IP para essa escola vão para o fim do balde da escola, e a métrica `login.prioridade_rebaixada{escola_id}` fica em 1.
  - **Passagem:** matrícula que já entrou neste navegador mantém a prioridade, pelo cookie `educa_dispositivo`.
    - **Conteúdo:** até 50 entradas `HMAC(LOGIN_CHAVE_DISPOSITIVO_V{n}, escola_id|matricula ou email)`, cada uma com a própria data. A versão da chave vai no cookie, e trocar a chave invalida tudo.
    - **Validade:** cada entrada sai depois de 30 dias, a mais antiga primeiro.
    - **Atributos:** `HttpOnly; Secure; SameSite=Strict; Path=/v1/sessao`. Só é gravado depois de login bem-sucedido.
    - **"Sair" não apaga:** ele só dá prioridade, nunca acesso.
    - **Nenhum outro uso:** nada de analytics, impressão digital ou ligação com `registro_acesso`. Fica no redact.
- **Onde fica:** os contadores de tentativa, de IP e de rebaixamento, e o `jti` do desafio, ficam no Redis de fila, que não expulsa chave e grava em AOF. Todos têm TTL. Se ficassem no Redis de cache (`allkeys-lru`), a expulsão zeraria o contador ou deixaria o desafio ser reusado.
- **Redis de fila fora:** os contadores e o rebaixamento passam para memória em cada instância, com a mesma regra e `limite.seguro_ativo`. O limite por IP e o limiar de falhas da escola são divididos pelas instâncias. O desafio é recusado, e a pessoa entra de novo.
- **Teste:** sob saturação, a taxa de 503 de identificador existente e inexistente é a mesma.

**Hash.**
- **Algoritmo:** `@node-rs/argon2`, argon2id, p=1. Parte da OWASP (m=19456, t=2) e sobe `t` até 100–250 ms na CPU de referência.
- **Concorrência:** `LOGIN_HASH_CONCORRENCIA` é obrigatório e vai no máximo até `UV_THREADPOOL_SIZE − 8`, conferido no boot: as 8 threads de folga são da resolução de nome e de arquivo (`docs/infra.md`, "Threads e DNS").
- **Capacidade:** com 2 hashes de 150 ms, uma instância faz ~13/s e duas ~26/s, contra ~14/s no primeiro minuto. Com uma instância só, o pico passa da capacidade, e o `Retry-After` espalha o excesso. Por isso deploy só fora do horário letivo (D27).
- **Fila:** o semáforo atende os baldes em rodízio. Esperou mais de 2 s, recebe 503 com `Retry-After` aleatório entre 2 e 6 s. Na web isso é atraso, não recusa: o formulário mostra "entrando…" e tenta de novo sozinho por até 30 s antes de mostrar erro.
- **Inexistente:** passa pelo hash fixo e responde igual a senha errada.

**Tentativas.**
- **Contador:** `ContadorDeTentativas` (tarefa 4.0), um script Lua atômico no Redis de fila (o `rate-limiter-flexible` não tem o recuo que dobra), com chave `login:{HMAC(LOGIN_CHAVE_CONTADOR, escola_id|matricula ou email)}:{conhecido|outro}`, consultada antes do hash.
- **Dois contadores por conta:** o sufixo `conhecido` vale para tentativas com o `educa_dispositivo` válido para aquela conta; `outro`, para o resto. Um script em outro navegador segura só o contador `outro`, e o professor no próprio computador continua entrando. No navegador conhecido, as tentativas também têm limite.
- **Bloqueio:** depois de 5 falhas seguidas, a espera dobra de 30 s até 15 min (429 `CONTA_SEGURADA`), e o acerto zera. `/v1/sessao/mfa` conta no mesmo contador, com `HMAC(conta_id)`: a conta é global e o MFA é dela, então a chave não leva escola. O quinto erro consome o `jti` do desafio.
- **Redis fora:** um contador em memória por instância, com a mesma regra, liga `limite.seguro_ativo`.

**Etapas.**
- **Rota:** coordenador sem MFA vai a `configurar_mfa`, e com MFA a `mfa`. Mais de um usuário ativo leva a `escolher`. Convite para conta existente responde `entrar`: a web leva ao `/entrar`.
- **Usuário esperando convite:** o login por e-mail que traz o `bilhete` do aceite (JWT `convite+jwt` de 30 min, com a conta e o convite), da mesma conta que provou a senha, ativa, depois da credencial e do MFA, o usuário daquele convite: inativo, com o convite usado, não revogado e aceito depois de o usuário ficar inativo, com auditoria (`usuario.ativado_por_convite`). Aí conta os usuários ativos. Com MFA, a senha certa leva a `mfa` com o convite no desafio, e a ativação acontece depois do código. Sem o bilhete, ou com o de outra conta, o login segue sem ativar nada (decidido na 7.0: o aceite marca o convite como usado; a ativação exige quem aceitou o link e a credencial da conta ao mesmo tempo, para um e-mail digitado errado pelo operador não ativar a conta de outra pessoa, nem pelo login rotineiro dela, nem pelo bilhete da pessoa certa na conta dela).
- **Escolher:** `/v1/sessao/escola` confere que o `usuarioId` está entre os usuários ativos da conta do desafio; senão, 404.
- **Sessão:** só é gravada em `pronta`.
- **Cookie `educa_sessao`:** `HttpOnly`, `Secure` fora do local, `SameSite=Strict`, `Path=/v1/sessao`, sem `Max-Age`.
- **Registro:** login, falha, renovação e saída gravam `registro_acesso`.

**Renovar.** Transação com `FOR UPDATE`.
- **Hash atual:** rotaciona, guarda o anterior e zera `atual_apresentado`. O token de acesso novo sai com `iat` depois de `rotacionado_em`. A primeira requisição autenticada com ele marca `atual_apresentado` (`update … where not atual_apresentado`, sem segurar a resposta), porque token e cookie chegaram juntos. É uma escrita por renovação, ~7/s no pico.
- **Hash anterior, com o atual nunca apresentado:** a resposta anterior se perdeu. Rotaciona de novo, sem encerrar nada. Até 2 s depois da rotação, é a renovação simultânea de outra aba (a segunda esperou o `FOR UPDATE` da primeira): 409 `JA_RENOVADO`, sem rotacionar (decidido em 18/09/2026, na 5.0: as duas situações chegam com o mesmo hash anterior, e só o tempo desde a rotação as separa). Por isso a web, ao receber 409, espera mais de 2 s e tenta uma vez de novo (18.0): se era outra aba, o navegador já tem o cookie novo; se a resposta se perdeu, o cookie ainda é o anterior e a rotação sai.
- **Hash anterior, com o atual já apresentado:** até 30 s, 409 `JA_RENOVADO`; depois disso, conta como reuso, encerra a família, grava auditoria e dispara alerta.
- **Uso:** renovar não conta como uso.

**Atividade.** A web chama `POST /v1/sessao/atividade` quando houve ponteiro ou teclado, no
máximo a cada 5 min. Só isso e a gravação de resposta de avaliação (contrato para o F6) movem
`ultimo_uso_em`. A gravação não segura a resposta, e a falha é contada. A inatividade tem
5 min de tolerância, para uma atividade perdida não deslogar ninguém. Sessão com avaliação em
andamento não vence por inatividade (F6).

**Requisição.** A guarda lê numa consulta só `sessao ⋈ usuario ⋈ ano_letivo em_curso` por
`(esc, sid)`, sem cache.
- **Recusa com `NAO_AUTENTICADO`:** sessão encerrada ou expirada; `sessao.usuario_id ≠ sub`; usuário desativado; inatividade vencida.
- **Postgres com erro ou timeout:** 503, nunca logout.
- **Sem ano em curso:** turma e vínculo falham fechados. Criar e abrir ano letivo não dependem dele.
- **Handshake do realtime:** faz a mesma leitura, e por isso o realtime passa a ter pool de banco. Sessão recusada responde `NAO_AUTENTICADO` no `connect_error`; com o Postgres fora, `INDISPONIVEL_TENTE_DE_NOVO`, e o cliente reconecta com recuo.

**Troca de escola.**
- Só vale para sessão de método e-mail e para usuário ativo da mesma conta; senão, 404.
- Cria outra sessão, com família nova, na escola de destino, e encerra a de origem na mesma transação (motivo `troca_de_escola`). Voltar à escola anterior cria outra sessão.
- Aplica o MFA, se o papel for coordenador, e a inatividade do destino.
- Sessão de matrícula ou externa leva ao login da outra escola.

**Externo.**
- **`iniciar`:** grava `escola_id`, `state`, `nonce` e o verificador PKCE no cookie `educa_oidc` (AES-256-GCM, 5 min, `SameSite=Lax`).
- **Escopo:** Google pede `openid email`; Microsoft pede `openid email profile`, porque o `oid` exige `profile`. Sem `offline_access`.
- **Discovery e JWKS:** carregados na primeira chamada, com timeout de 5 s, uma busca por vez e sem guardar falha em cache.
- **`retorno`:** ignora a query e usa a escola do cookie. `authorizationCodeGrant` tem timeout de 5 s.
- **Conferência:** `hd` ou `tid` contra o `provedor_escola`. A chave é `sub` no Google e `oid`+`tid` na Microsoft.
- **Com ligação:** conta ligada a usuário ativo dessa escola entra.
- **Sem ligação, professor:** é ligado se o e-mail bate com a conta de um professor dessa escola, e o Google trouxe `email_verified` ou o `tid` já foi validado. Grava auditoria.
- **Sem ligação, qualquer outro caso:** a mesma recusa.
- **Nunca gravados:** `id_token`, `access_token` e claims, nem em exceção.
- **`error` do provedor:** vira `?falha=provedor`.

**TOTP.**
- `otpauth`: SHA1, 6 dígitos, 30 s, `window=1`.
- Segredo em AES-256-GCM, com `conta_id` como AAD e chave `IDENTIDADE_CHAVE_CIFRA_V{n}`.
- O passo precisa ser maior que `mfa_ultimo_passo`, num `update` condicional.
- 10 códigos de recuperação, com HMAC de chave própria.
- `redefinir` responde 202 sempre. Só age se todos os usuários ativos da conta forem da escola do contexto; senão, grava a recusa em auditoria e a escola recorre a `ops:redefinir-mfa`.

**Vínculo.** Confirmar e contestar são `update … where id and usuario_id=ctx and estado in
('pendente','contestado')`, com auditoria na transação. A tela do `complemento` avisa "não
escreva nome de aluno". Ao encerrar o ano letivo, na mesma transação, os vínculos passam a
`encerrado` com motivo `fim_do_ano` e o `complemento` é apagado.

**Histórico.** `anoLetivoId` só em leitura e só de ano `encerrado` da escola do contexto. A
coordenação lê sem vínculo. O professor, ativo, precisa de vínculo com aquela turma naquele
ano, `confirmado` ou `encerrado` por `fim_do_ano`. Qualquer outro caso é 404.

**Convite.** `aceitar` é `update … where usado_em is null and revogado_em is null and
expira_em > now()`.
- **E-mail sem conta:** o aceite define a senha e leva a `configurar_mfa`.
- **E-mail que já tem conta com senha:** a pessoa trabalha em outra escola. O aceite ignora `senha` e responde a etapa `entrar` com o `bilhete`, que a web leva ao login. Ela entra com a senha e o MFA que já tem, e só depois da credencial verificada o usuário do convite é ativado, com auditoria. O `ops:convite-coordenador` cria o usuário já com o `conta_id` (conta nova sem senha, ou a existente), mas inativo até o aceite. O link do convite nunca troca a senha de uma conta existente. A web lê o token do fragmento `#` e o tira da barra com
`history.replaceState`.

**Operador.** `ops:*` grava `autor_operador` e abre o contexto da escola alvo.
- `ops:sessao-sintetica` só roda com `AMBIENTE=local`.
- O convite vai para um arquivo 0600.
- `ops:redefinir-mfa` recebe `usuarioId` e a referência do pedido, e responde ok ou erro.

**Ciclo de vida.**
- **Desativar aluno:** apaga o `senha_hash` da `credencial_matricula` e as sessões.
- **Desativar o último usuário de uma conta:** apaga e-mail, senha, segredo, códigos e sessões, com auditoria.
- **Eliminação pedida pela escola A:** apaga só o que é de A (usuário, `credencial_matricula`, `conta_externa`, vínculos, sessões). Se era o último usuário da conta, dispara a mesma limpeza da conta, com auditoria. `registro_acesso` e `auditoria` ficam pela retenção legal.
- **`sistema.expurgar-acesso`, de madrugada:** apaga `registro_acesso` com mais de 6 meses, sessão com `coalesce(encerrada_em, expira_em)` de mais de 30 dias e convite 30 dias depois de usado, revogado ou expirado.

## 6. Isolamento (obrigatório)

**Desvio (regra 10, itens 1 e 9).** `conta` e `codigo_recuperacao` não têm escola. O
`ResolucaoDeTenantRepository` concentra, com `@SemEscopo` justificado, toda operação que acontece
antes de existir escola ou que toca a conta global.

| Operação | Justificativa |
|---|---|
| Ler escola por slug | é o que dá a escola |
| Ler rede por IP de saída (devolve só o número de escolas) | limite por IP da rota de e-mail, antes de haver escola (15.0) |
| Ler conta por e-mail | a credencial da equipe é global |
| Ler usuários ativos da conta | login, `/v1/eu.acessos` e troca, depois da credencial; devolve só id, escola e papel |
| Ler sessão por `refresh_hash` e pelo anterior | o cookie não diz a escola |
| Ler convite por `token_hash` (`conviteValidoPorHash`), e marcá-lo como usado no aceite (`usarConvitePorHash`) | idem: o link não diz a escola (7.0) |
| Ler o usuário da conta que espera o convite do bilhete (`usuarioComConviteAceito`) | login por e-mail com o bilhete, depois da credencial e do MFA; devolve só id, escola, papel e convite (7.0) |
| Achar ou criar a conta pelo e-mail no `ops:convite-coordenador` (`contaParaConvite`); ler a escola de um convite no `ops:revogar-convite` (`escolaDoConviteParaOperador`) | a credencial é global; rotina do operador, que recebe só o id do convite, e a escola vem do banco (7.0) |
| Ler conta por `conta_id` (segredo cifrado, códigos de recuperação) | verificar TOTP e recuperação; o `conta_id` vem do desafio |
| Gravar `registro_acesso` com escola nula | falha de login por e-mail, antes de haver escola |
| Criar a conta da equipe (e-mail, sem ler conta existente): convite do coordenador (7.0) e `ops:sessao-sintetica` local | a credencial é global e não tem escola; devolve só o id |
| Ler a escola e a conta de um usuário pelo id (`escolaDoUsuarioParaOperador`), só no `ops:redefinir-mfa` | rotina do operador: o comando recebe só o `usuarioId` do pedido formal, e a escola que vira o contexto vem do banco, nunca do argumento; devolve escola, conta e se está ativo, nunca o nome (6.0) |
| Escrever na conta, por `conta_id` já verificado: senha no aceite do convite, configurar e ativar MFA, `mfa_ultimo_passo`, consumir código de recuperação, redefinir MFA, limpeza da conta | a credencial é global; o `conta_id` vem do desafio ou da sessão verificados, nunca do cliente |

O item 9 fala em três exceções por módulo, e aqui são mais de dez métodos (13 depois da 6.0 e 20 depois da 7.0; a contagem cresce com as tarefas, e a lista que vale é a própria classe, com uma justificativa em cada `@SemEscopo`). O motivo: essa classe é a
própria fronteira da resolução de tenant, a única do sistema, e há teste de que só o módulo
`sessao` a importa. Fora dela, `@SemEscopo` só aparece em `sistema.expurgar-acesso`
(`retencao`, como no F0) e no `RedeEEscolaRepository` do `ops:escola`, com dois métodos (criar rede,
que fica acima do tenant, e criar escola, que é o tenant nascendo): só inserem e devolvem o id, e um
teste prova que nenhum outro código cria rede ou escola (1.0).

`registro_acesso` aceita escola nula só em `login_falho` sem usuário, que é a falha por e-mail.

**Escopo.** Vem do contexto, nunca do cliente. As FKs compostas barram referência a outra
escola e a outro ano. A alternativa, senha e MFA por escola, foi recusada na clarificação.

**Testes, que quebram sem a cláusula.** As rotas do F1 com id no caminho ou no corpo são
`anos-letivos/:id/abrir`, `anos-letivos/:id/encerrar`, `turmas/:id`, `/alunos`,
`vinculos/:id/*`, `usuarios/:id/mfa/redefinir` e `sessao/escola`.
- id de B nessas rotas dá 404 igual ao inexistente, exceto `usuarios/:id/mfa/redefinir`, que responde 202 sem efeito (seção 5, "TOTP"); encerrar o ano de B a partir de A não muda nada;
- as listagens da coordenação de A (`anos-letivos`, `series`, `disciplinas`, `turmas`, `vinculos`) e o `meus-vinculos` do professor com A ativa não trazem nada de B;
- criar turma ou vínculo com `serie_id`, `turma_id`, `usuario_id` ou `disciplina_id` de B dá 404, e a turma de outro ano também;
- token do `EmissorDeToken` com `sub` de A e `esc` de B é recusado. É o único teste que assina à mão, e roda também com o cache da seção 13 ligado;
- `anoLetivoId` de B, e de A com vínculo `desligamento` ou com outra turma, dá 404;
- `escolher` e troca com `usuarioId` de outra conta dão 404; troca para B como coordenador pede MFA;
- redefinir MFA de usuário só de B dá 202 sem efeito; de usuário de A com a conta também em B, 202 sem efeito e com recusa em auditoria;
- a mesma matrícula, com a senha de A, no slug de B é recusada; a conta segurada em A não segura B;
- B cadastrando o `hd` de A não recebe o aluno ligado em A; retorno com cookie de A e `?slug=` de B entra só em A;
- o repository de auditoria filtra por escola; o handshake entra só na sala da sessão.

## 7. Dado pessoal (obrigatório)

| Item | Resposta |
|---|---|
| Campos pessoais tocados | nome e matrícula do aluno; nome e e-mail da equipe; identificador externo; IP |
| Novos campos (atualizar `docs/lgpd.md`) | **atualizado junto com esta Tech Spec** (hash, TOTP, e-mail global, sessão, contador, vínculo e contestação, convite, operador); as migrations das tarefas 2.0, 6.0, 7.0, 9.0, 11.0 e 13.0 dependem disso |
| O que vai para log | `evento`, ids, provedor, código de erro. Redact novo: `*.id_token`, `*.access_token`, `*.claims`, `*.picture`, `*.name`, `*.given_name`, `*.family_name`, `*.preferred_username`, `*.upn`, `*.unique_name`, `*.token`, `*.desafio`, `*.uri`, `*.segredo`, `*.codigo`, `*.recuperacao`, `*.codigosRecuperacao`, `*.refresh`, `*.state`, `*.complemento`, `*.dispositivo`, `set-cookie` e `cookie`. Teste lê o log depois do login externo do aluno e não acha e-mail |
| O que entra em auditoria | RF19 do PRD; `/alunos` lido pela coordenação; `PUT /v1/escola/*`; reuso de refresh; desativação. `finalidade` na leitura e no MFA |
| O que é enviado a provedor externo | só o redirect OAuth, o único envio externo do F1 |
| Retenção e expurgo | seção 5, "Ciclo de vida"; contador 15 min; auditoria no F3. Um teste por regra |
| Titular | "tudo sobre o aluno" no F1 = `usuario`, `credencial_matricula` (sem o hash), `conta_externa`, `vinculo`, `sessao`, `registro_acesso` e `auditoria`, por `usuario_id` |
| Autorização por objeto | `@Permite` por papel; repository junta vínculo ou `usuario_id` do contexto |
| DTO de saída | seção 4, zod. Teste procura `senha`, `hash`, `segredo`, `sujeito` e e-mail de aluno. Exceção nominal: `/v1/conta/mfa/configurar` e `/ativar` |

## 7b. Conformidade CNE

Não há IA no caminho do aluno. A `MATRIZ` declara o indicador de professor (regra 70, item 8).

## 7c. Carga e falha (obrigatório)

| Item | Resposta |
|---|---|
| Está no caminho quente? | login; e a leitura de sessão em toda requisição |
| Carga na manhã de segunda | ~7 logins/s por 5 min, ~14/s no primeiro minuto; `atividade` ~13/s |
| Fila e prioridade | só `sistema.expurgar-acesso`, lote |
| Limite por escola | balde por escola no semáforo; contador de senha com a escola na chave (matrícula); o de e-mail e o de MFA são da conta global |
| Rate limit | do F0, antes da leitura de sessão |
| Corridas | renovação com `FOR UPDATE`; `update` condicional em vínculo, TOTP e convite; índices únicos no vínculo e na conta externa; `jti` com `SET NX` |
| Índices | começam por `escola_id`; `refresh_hash` e o anterior |
| Migration | só expande; `VALIDATE` depois |
| Postgres cai | 503 "tente de novo em instantes", sem logout; a web mantém token e formulário e tenta de novo com recuo |
| Redis de fila cai | contadores e rebaixamento em memória por instância; desafio recusado, login de novo |
| Redis de cache cai | limite do F0 no seguro; o login segue |
| Google ou Microsoft caem | mensagem no botão; matrícula e e-mail seguem |
| Métricas | `login.duracao{metodo}`, `login.hash_espera{escola_id}`, `login.hash_recusado`, `login.falhas{escola_id}`, `login.prioridade_rebaixada{escola_id}`, `login.limite_email_ip`, `login.conta_segurada`, `sessao.leitura.duracao`, `sessao.renovacao{resultado}`, `sessao.atividade_falha`. `escola_id` fora de job fica limitado a essas três métricas de login, com cardinalidade de dez. Isso amplia a regra do F0 (`METRICAS_COM_ESCOLA`, só métrica de job), e a 14.0 atualiza a lista e o teste de cardinalidade |

Alertas, cada um com runbook:

| Alerta | Dispara quando |
|---|---|
| `login-lento` | p95 acima de 1 s por 3 min |
| `reuso-de-refresh` | mais de 5 em 10 min |
| `login-rebaixado-por-escola` | `login.prioridade_rebaixada` em 1 por 2 min |
| `login-hash-recusado` | 503 do semáforo acima de 1% dos logins por 3 min |
| `login-email-limite-ip` | mais de 20 tentativas rebaixadas por min por 5 min |
| `seguro-limite-ativo` | alerta do F0, reaproveitado |

**Cenário de carga, `infra/k6/login-7h30.js`.** Roda com `infra/compose.carga.yml`: duas APIs,
1 CPU cada, e essa é a CPU de referência.
- 2.100 contas de três escolas, saindo de um IP, em 5 min, com 40% no primeiro minuto e 30% errando a senha uma vez antes de acertar;
- requisições autenticadas depois do login, comparadas à base;
- onda de renovação com token curto e duas abas;
- Redis de fila derrubado no meio, durante o ataque;
- ataque de 3.000 tentativas por minuto em matrículas diferentes da escola A e em e-mails diferentes, com ou sem conta, em duas variações: de um segundo container k6, com IP próprio, e do mesmo IP da escola.

A equipe das três escolas faz menos de 60 logins por minuto, dentro do limite por IP da rota de e-mail.

O controle negativo roda com `LOGIN_PROTECAO_DESLIGADA=true`, que desliga baldes e rebaixamento e é recusado com `AMBIENTE=producao`, como a `VAGAS_POR_ESCOLA_DESLIGADAS` do F0. Nele, o cenário precisa reprovar. O k6 imita o recuo da web no 503.

Passa com:
- p95 do login abaixo de 1 s;
- p95 da B e da C mantido;
- nenhum 429 para conta legítima com o cookie de dispositivo, inclusive da A e da equipe, mesmo com o script errando a senha dela;
- nenhum 503 para conta legítima com ataque de fora;
- com ataque do mesmo IP, conta legítima sem cookie entra em até 30 s, com os 503 com `Retry-After` repetidos pela web contando como atraso, e nunca recebe erro na tela;
- `login.prioridade_rebaixada` em 0 na fase sem ataque, só com os erros legítimos de senha.

## 8. Uso de IA

Não se aplica.

## 9. Frontend

- **Rotas:** `/entrar`, `/e/:slug`, `/mfa`, `/mfa/configurar`, `/escolher-escola`, `/vinculos`, `/convite#token`.
- **Token:** fica em memória. `buscarDaApi` manda `Authorization` e, no 401, renova uma vez.
- **Renovação:**
  - uma por vez, entre abas também (Web Locks);
  - com 409 `JA_RENOVADO`, espera a trava e tenta uma vez com o cookie atual;
  - com resposta perdida, repete; o servidor trata o caso (seção 5).
- **Sessão vencida:** o login abre por cima da tela, sem perder o estado. Com 5xx ou sem rede, não desloga.
- **Inatividade:** timer de ponteiro e teclado. Nenhuma tela faz polling, e "Sair" fica no cabeçalho.
- **Troca de escola:** limpa o cache do TanStack Query.
- **Campos:** matrícula com `inputmode="numeric"` e `autocomplete="username"`; TOTP com `one-time-code`; segredo com botão copiar; aviso da TI no botão da conta.
- **Estados:** os quatro do F0. Coluna única a partir de 360 px, alvo de 44 px, projetos `chromebook` e `celular`.

## 10. Testes

| Camada | O que será testado |
|---|---|
| Unidade | `MATRIZ` contra o arquivo de expectativa; recuo; TOTP com replay; schema de auditoria; teto do semáforo no boot; rodízio de baldes |
| Integração | respostas iguais para senha errada e identificador inexistente; conta segurada sem afetar outra; tentativas de MFA; seguro com Redis fora; renovação dupla e resposta perdida sem logout; reuso encerra a família; 503 com Postgres fora; desativação e encerramento cortam na requisição seguinte; inatividade com tolerância; externo (domínio, `tid` pessoal, aluno sem ligação, segundo `sujeito`, sem `email_verified`); log sem e-mail; auditoria por ação; convite aceito duas vezes; expurgos; `ops:*` sem dado de pessoa |
| E2E | e-mail com MFA; matrícula em `/e/:slug`; externo pelo `oidc-falso`; escolher e trocar escola; confirmar e contestar; falha do provedor; inatividade com relógio simulado; teclado e toque nos dois projetos |
| Isolamento | seção 6 |

O seed e `ops:sessao-sintetica` montam as pessoas. Os testes do F0 que usam o token sintético
migram na mesma tarefa, e o helper cria a escola antes do job, por causa da FK.

## 11. Conformidade com as regras

| Regra | Como é atendida | Desvio e justificativa |
|---|---|---|
| 00 | controller fino, porta externa, `oidc-falso` no compose | — |
| 10 | seção 6, FKs compostas, contexto de escola sem usuário | `conta` sem escola; os métodos `@SemEscopo` da fronteira de resolução (20 depois da 7.0); `registro_acesso` com escola nula na falha por e-mail |
| 20 | aluno sem e-mail; claims descartadas; registro de acesso; auditoria fechada; expurgo | — |
| 40, 50, 60 | seções 9 e 10; token em memória; vínculo só confirmado | — |
| 80 | guardas em ordem; baldes por escola; 503 no lugar de logout; cenário | sessão no Postgres, e não no Redis (item 5): o Redis de cache é `allkeys-lru` e expulsaria sessão no meio da aula |

## 12. Premissas não verificadas

- ⚠️ **Retorno do Google e da Microsoft quando a escola não liberou o app:** não se sabe se o redirect volta nem com qual `error`. Todo `error` vira a mesma mensagem, e a tela avisa antes do botão.
- ⚠️ **`hd` sem o escopo `email`:** não verificado. `email` fica porque a ligação do professor precisa dele.
- ⚠️ **`nonce` no `mock-oauth2-server`:** conferir no primeiro teste.
- ⚠️ **Custo do argon2 e capacidade da seção 5:** estimados. O cenário mede, e nunca abaixo da OWASP.
- ⚠️ **Restauração de sessão do Chrome:** o cookie sem `Max-Age` sobrevive a ela. A inatividade no servidor é a garantia.

## 13. Riscos técnicos

- **p95 da leitura de sessão alto no cenário:** cache de 15 s no Redis de cache, com chave `sessao:{esc}:{sid}`. O vínculo fica fora do cache, porque é conferido no repository a cada acesso: encerrar vínculo não precisa invalidar nada.
  - O valor guarda só ids, papel e datas.
  - É invalidado ao encerrar sessão ou desativar usuário.
  - Abrir ou encerrar ano letivo e mudar a inatividade da escola avançam uma versão por escola (`sessao:v:{esc}`), que entra na chave.
- **Ataque de dentro da rede da escola:** o rebaixamento atrasa os alunos da própria escola que ainda não entraram naquele navegador, mas não recusa ninguém nem degrada outra escola. O alerta `login-rebaixado-por-escola` avisa.
- **Ataque distribuído ao balde "equipe":** muitos IPs podem lotar o balde e atrasar o login da equipe de todas as escolas. O rodízio por IP e o limite por IP reduzem o efeito, e o alerta `login-hash-recusado` avisa. Aceito no F1: a equipe tem sessão de 12 h e entra poucas vezes por dia.
- **Consulta do titular:** a seção 7 lista as tabelas. A execução por código (acesso e exportação) é do F3, como está no roadmap.
- **Testes do F0 presos ao token sintético:** migram na tarefa que tira a flag.
- **`VALIDATE` da FK com órfão:** a consulta prévia aponta a linha, e a migration espera.
