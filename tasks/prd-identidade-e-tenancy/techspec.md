# Tech Spec — Identidade e tenancy

**PRD:** `tasks/prd-identidade-e-tenancy/prd.md`
**Status:** implementada em 21/09/2026 (revisto após duas rodadas de `tenancy-guardian`, `privacy-guardian` e `infra-guardian`, 14/09/2026; alinhada ao construído nas rodadas 1 e 2 da validação, 20/09/2026)

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
conta            email citext? unique (nulo só na conta limpa, 17.0), senha_hash?, mfa_segredo_cifrado?,
                 mfa_chave_versao?, mfa_ativado_em?, mfa_ultimo_passo?
codigo_recuperacao  conta_id, hmac, usado_em?
usuario       E  conta_id? (nulo só para aluno), papel (coordenador|professor|aluno), nome, desativado_em?
                 unique (E, conta_id, papel)
credencial_matricula E usuario_id, matricula, senha_hash; unique (E, matricula)
conta_externa E  usuario_id, provedor, tenant?, sujeito; unique (E, provedor, coalesce(tenant,''), sujeito);
                 unique (E, usuario_id) (13.0)
provedor_escola E provedor, valor (hd|tid), removido_em?; unique parcial (E, provedor, valor) where removido_em
                 is null (13.0)
vinculo       EA usuario_id, turma_id, disciplina_id?, papel, estado (pendente|confirmado|contestado|
                 encerrado), contestacao (nao_leciono|turma_errada|disciplina_errada|outro)?,
                 complemento varchar(140)?, motivo_encerramento (fim_do_ano|desligamento|realocacao)?,
                 criado_por, decidido_em?, encerrado_em?
                 unique parcial (E, A, usuario_id, turma_id, disciplina_id) where estado <> 'encerrado'
                 índices (E, A, usuario_id, estado), (E, A, turma_id, estado)
sessao        E  conta_id?, usuario_id, metodo (email|matricula|externo), familia, refresh_hash unique,
                 refresh_hash_anterior? (índice), atual_apresentado bool, rotacionado_em?,
                 ultimo_uso_em, expira_em (12 h), encerrada_em?, motivo? (saida|troca_de_escola|reuso_de_refresh|
                 desativacao|mfa_redefinido|conta_limpa); índices (coalesce(encerrada_em, expira_em)) do expurgo e
                 parcial (conta_id) where conta_id is not null and encerrada_em is null, das sessões da conta (17.0);
                 fillfactor 70
convite       E  token_hash unique, tipo (coordenador), usuario_id, expira_em (72 h), usado_em?, revogado_em?
registro_acesso E? usuario_id?, evento (login|login_falho|renovacao|saida), ip, em; índices (E, em) e (em), este do
                 expurgo (17.0)
                 check (escola_id is not null or (evento = 'login_falho' and usuario_id is null))
auditoria     E  autor_usuario_id?, autor_operador?, acao, entidade, entidade_id, antes?, depois?,
                 finalidade?, requisicao_id, em
                 check (escola_id is not null or (autor_operador is not null and entidade = 'rede'))
```

**Aluno.** É `usuario` sem `conta`, com `credencial_matricula` e vínculo confirmado. No F1 esse
vínculo vem do seed; no F2, da lista.

**Login externo (decidido na 13.0).** Uma conta externa por usuário na escola: é o que barra, também em paralelo, o
segundo `sujeito` com o mesmo e-mail (RF9); a professora cuja conta Google foi recriada com outro `sub` só liga a nova
depois que a coordenação desligar a antiga (eliminação da `conta_externa` na 17.0). O domínio retirado não é apagado:
ganha `removido_em`, e a auditoria `escola.provedores_alterados` guarda os ids das linhas por provedor, não o texto do
domínio, que a conferência da auditoria recusa como texto livre.

**Autor da auditoria e do vínculo (decidido na 17.0).** `auditoria.autor_usuario_id` e `vinculo.criado_por` deixaram de
ser FK composta e passaram a ser conferidos na gravação por gatilho (`exigir_usuario_da_escola`, migration 0013), com o
mesmo erro e o mesmo nome de restrição (`auditoria_autor_da_escola_fk`, `vinculo_criado_por_da_escola_fk`) e a linha do
autor travada com `for key share`, como a FK faz. Motivo: a eliminação pedida pela escola apaga o usuário, e a auditoria
fica pela retenção legal com o id de quem fez; a FK barraria a eliminação de quem já confirmou um vínculo, e o `set null`
apagaria o autor que a auditoria precisa mostrar. A garantia na escrita (autor existe e é da mesma escola) continua.

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
| 17.0 | não cria tabela: `conta.email` aceita nulo, o motivo `mfa_redefinido`, os índices do expurgo e o gatilho do autor |

No deploy do F1 inteiro, todas rodam numa transação só, e a trava de `job_registro` fica do
`ALTER` da 3.0 até o commit, depois de DDL de tabelas vazias (milissegundos). Vale o `lock_timeout` de 5 s com 3 tentativas do F0. O `VALIDATE`
entra numa migration de deploy posterior, fora do horário letivo, depois de confirmar zero
órfãos. O `CREATE INDEX CONCURRENTLY` segue adiado, porque as tabelas nascem vazias.

## 4. API

Envelope de erro do F0. As rotas anônimas levam `@RotaAnonima`.

**Desafio.** JWT de 5 min com `typ: desafio+jwt`, `aud: sessao`, `jti`, `conta_id` ou `usuario_id`, escola, etapa e `mfa_cumprido`.
- No `mfa` da escolha ou da troca de escola com destino coordenador, leva também o `usuario_id` do destino e, na troca, `origem_esc` e `origem_sid`: a origem só é encerrada quando o código é aceito (12.0).
- `POST /v1/sessao/escola` leva `@AceitaDesafio`: só nela, e só com `typ: desafio+jwt` no cabeçalho, as guardas a tratam como anônima, e o service verifica o desafio (12.0).
- A guarda de acesso recusa esse `typ`, e as rotas de sessão recusam o token de acesso.
- O `jti` é consumido (`SET NX` no Redis de fila) quando a etapa é concluída ou no quinto código errado. Os quatro primeiros erros não consomem.
- Com o Redis fora, o desafio é recusado e a pessoa entra de novo. Só afeta quem tem MFA ou mais de uma escola.

| Método | Rota | Papel | Entrada | Saída |
|---|---|---|---|---|
| GET | `/v1/escolas/:slug/acesso` | anônimo | — | `{ nome, provedores: ('google'\|'microsoft')[] }` |
| POST | `/v1/sessao/email`, `/matricula` | anônimo | `{ email, senha, bilhete? }`, `{ slug, matricula, senha }` | `{ etapa, desafio?, acessos? }`; cookie em `pronta`. Na etapa `escolher`, `acessos` com os mesmos campos de `/v1/eu.acessos` (20.0): o desafio é opaco para o cliente, e sem isso a tela `/escolher-escola` não teria escola, papel nem o `usuarioId` que `POST /v1/sessao/escola` exige (RF14). Vai só para a conta que acabou de provar a senha |
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
- **Limite anônimo por IP nas rotas de login** (decidido na 15.0, pelo veto do `infra-guardian`): `/v1/sessao/email` e `/v1/sessao/matricula` não recebem 429 `LIMITE_EXCEDIDO` do limite anônimo por IP do F0. Elas contam num balde próprio (`rl:ip-login`, mesmo teto `LIMITE_REQ_IP_ANONIMO_MIN`), e acima dele a tentativa vai para o fim do balde do semáforo, com a mesma passagem pelo cookie. Assim um script lotando o login não recusa os alunos atrás do NAT nem gasta o limite das outras rotas anônimas (a página de acesso da escola). Com 10.000 esperando no semáforo, o pedido não rebaixado toma o lugar do rebaixado mais antigo do balde com mais rebaixados, somadas as subfilas, que sai com 503 (corrigido na 16.5: antes era a maior subfila, e no balde da equipe um ataque espalhado por muitos IPs podia despejar o professor atrás do NAT). O ataque rebaixado de uma escola não vira 503 imediato em outra, nem para o professor. Esse rebaixamento conta em `login.rebaixado_ip`, sem rótulo.
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
- **Algoritmo:** `@node-rs/argon2`, argon2id, p=1. Parte da OWASP (m=19456, t=2) e sobe `t` na CPU de referência. A meta era 100–250 ms; a calibração da 16.0, abaixo, fixou 30 ms (`t=12`), com o desvio registrado.
- **Concorrência:** `LOGIN_HASH_CONCORRENCIA` é obrigatório e vai no máximo até `UV_THREADPOOL_SIZE − 8`, conferido no boot: as 8 threads de folga são da resolução de nome e de arquivo (`docs/infra.md`, "Threads e DNS").
- **Capacidade:** a estimativa era de 2 hashes de 150 ms, ~13/s por instância e ~26/s com duas, contra ~14/s no primeiro minuto; a medida da 16.0, com 30 ms por hash e 1 CPU, é ~31/s por instância (abaixo). Com uma instância só, o pico passa da capacidade, e o `Retry-After` espalha o excesso. Por isso deploy só fora do horário letivo (D27).
- **Calibração (16.0, 19/09/2026):** medida nesta máquina de desenvolvimento (AMD Ryzen 5 7600), com as APIs em `cpus: 1` do `infra/compose.carga.yml`; não é o staging, que recalibra quando existir (D31, D42). Com 1 CPU, dois hashes ao mesmo tempo não rendem mais que um: a vazão é a do núcleo.

  | `t` (m=19456, p=1) | 1 hash, 1 CPU | vazão com 2 juntos | Cenário "login às 7h30" |
  |---|---|---|---|
  | 2 (OWASP) | 5 ms | 160/s | — |
  | 12 | 30 ms | 31/s | passa: rajada, ataques e controle negativo reprovando |
  | 20 | 52 ms | 20/s | rajada passa; ataque de dentro reprova (30 de 151 alunos da A sem cookie e 3 de 16 da equipe sem cookie não entram em 30 s) |
  | 36 | 82 ms | 11/s | rajada reprova (p95 2,26 s, 26 contas sem entrar em 30 s) |

  **Fixado:** `LOGIN_ARGON2_ITERACOES=12` e `LOGIN_ARGON2_MEMORIA_KIB=19456` (30 ms por hash na CPU de referência, 6× as iterações da OWASP), `LOGIN_HASH_CONCORRENCIA=2` e `UV_THREADPOOL_SIZE=16`, em `infra/carga.env`. O `.env.example` fica no mínimo da OWASP, para o desenvolvimento e a esteira não pagarem o hash em cada teste.

  **Desvio da faixa de 100–250 ms, registrado:** com 1 CPU por instância, 100 ms de hash dá ~10 logins/s por instância, abaixo do primeiro minuto da rajada (~14/s, ~18 hashes/s com os 30% que erram) e muito abaixo das 3.000 tentativas/min do ataque, que então empurra os alunos sem cookie da própria escola para além dos 30 s. Entre o custo do hash e o RF21 com ataque de dentro, vale o RF21 (quem protege o aluno às 7h30), sem descer do mínimo da OWASP. Subir para a faixa exige mais CPU por instância da API (2 núcleos dão o dobro), e essa é uma pergunta para o staging e a hospedagem (D42), não um valor a copiar de tutorial.
- **Teto do `LOGIN_HASH_CONCORRENCIA`:** fica em `UV_THREADPOOL_SIZE − 8`, como a 14.0 fixou, e não em `− 2`, como o texto da tarefa 16.0 dizia: as 8 de folga são da resolução de nome e de arquivo (`docs/infra.md`, "Threads e DNS"), e a leitura mais restrita protege a conexão nova ao Postgres no pico.
- **A vez vem antes da tentativa** (decidido na 14.0, ratificado em 18/09/2026): a vez no semáforo cobre a reserva no contador, a leitura da credencial e o hash. Se cobrisse só o hash, o 503 contaria como senha errada, e a web, que repete no 503, seguraria a conta do próprio aluno. Efeito aceito: a conta já segurada espera a fila antes de receber o 429.
- **Fila:** o semáforo atende os baldes em rodízio. Esperou mais de 2 s, recebe 503 com `Retry-After` aleatório entre 2 e 6 s. Na web isso é atraso, não recusa: o formulário mostra "entrando…" e tenta de novo sozinho por até 30 s antes de mostrar erro.
- **Inexistente:** passa pelo hash fixo e responde igual a senha errada.

**Tentativas.**
- **Contador:** `ContadorDeTentativas` (tarefa 4.0), um script Lua atômico no Redis de fila (o `rate-limiter-flexible` não tem o recuo que dobra), com chave `login:{HMAC(LOGIN_CHAVE_CONTADOR, escola_id|matricula ou email)}:{conhecido|outro}`, consultada antes do hash.
- **Dois contadores por conta:** o sufixo `conhecido` vale para tentativas com o `educa_dispositivo` válido para aquela conta; `outro`, para o resto. Um script em outro navegador segura só o contador `outro`, e o professor no próprio computador continua entrando. No navegador conhecido, as tentativas também têm limite.
- **Bloqueio:** depois de 5 falhas seguidas, a espera dobra de 30 s até 15 min (429 `CONTA_SEGURADA`), e o acerto zera. `/v1/sessao/mfa` conta no mesmo contador, com `HMAC(conta_id)`: a conta é global e o MFA é dela, então a chave não leva escola. O quinto erro consome o `jti` do desafio.
- **Slug inexistente na matrícula** (decidido na 11.0, ratificado em 18/09/2026): conta num contador de uma "escola desconhecida" fixa, com o mesmo hash e a mesma resposta da matrícula errada, e não grava `registro_acesso`, porque escola nula só existe na falha por e-mail. A falha com escola conhecida grava `login_falho` na escola, sem usuário, para a linha não dizer se a matrícula existe.
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
- **Ratificado em 18/09/2026 (12.0):** a troca pelo token usa `@AceitaDesafio` só nessa rota; com destino na coordenação o MFA é exigido sempre, mesmo vindo de uma sessão de coordenação; e a origem só é encerrada quando o código é aceito. **Revertido:** a origem grava `saida` (motivo `troca_de_escola`) no `registro_acesso` da escola de origem, para o rastro durar os 6 meses do registro e não os 30 dias da sessão (17.5).
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
- **A redefinição encerra as sessões abertas da conta** (decidido em 18/09/2026, feito na 17.4), pela coordenação e pelo operador, em todas as escolas da conta, na mesma transação e com motivo `mfa_redefinido`: a redefinição existe para "perdi o celular" e "suspeita de acesso indevido", e a sessão aberta no aparelho perdido cai na requisição seguinte (401). Pela coordenação, isso só acontece quando todos os usuários ativos da conta são da escola que pediu; a resposta e a auditoria não dizem quantas sessões caíram.

**Vínculo.** Confirmar e contestar são `update … where id and usuario_id=ctx and estado in
('pendente','contestado')`, com auditoria na transação. A tela do `complemento` avisa "não
escreva nome de aluno". Ao encerrar o ano letivo, na mesma transação, os vínculos passam a
`encerrado` com motivo `fim_do_ano` e o `complemento` é apagado.

**Histórico.** `anoLetivoId` só em leitura e só de ano `encerrado` da escola do contexto. A
coordenação lê sem vínculo. O professor, ativo, precisa de vínculo com aquela turma naquele
ano, `confirmado` ou `encerrado` por `fim_do_ano`. Qualquer outro caso é 404.
- **O aluno não lê histórico no F1** (decidido na 10.0, ratificado na validação de 20/09/2026 e
  registrado na seção 3 do PRD): é do F9. Na `MATRIZ`, o aluno tem `turma.ler`, `turma.listar`,
  `aluno_da_turma.ler` e `vinculo.ler_proprios` em `nunca`, e `?anoLetivoId` com token de aluno é
  404. De si, o aluno vê a escola e o papel de agora, por `/v1/eu`. A tarefa do F9 que abrir essa
  leitura muda a célula da `MATRIZ`, cria rota e DTO próprios, e traz o teste que quebra sem a
  cláusula de `usuario_id` do contexto.
- **O `fim_do_ano` precisa ter sido confirmado** (decidido na 10.0 e ratificado em 18/09/2026: o professor que contestou ou nunca respondeu não passa a ler os alunos em janeiro): a virada leva também o pendente e o contestado a
  `fim_do_ano`, e eles nunca deram acesso. Vale o que tem `decidido_em` e não tem código de contestação (confirmar apaga
  o código). O mesmo critério escolhe os alunos da lista do ano encerrado: quem chegou confirmado ao fim do ano, e não o
  transferido no meio dele.
- **A virada** apaga o `complemento`, texto livre, e mantém o código da contestação, que é enum, já está na auditoria
  `vinculo.contestado` e é o que separa o contestado do confirmado. A auditoria `ano_letivo.encerrado` leva só as
  contagens.
- **Lista de vínculos da coordenação** (10.4): `GET /v1/vinculos` e as rotas de vínculo por id tratam só vínculo de
  professor; o de aluno não aparece e, por id, responde como inexistente.

**Convite.** `aceitar` é `update … where usado_em is null and revogado_em is null and
expira_em > now()`.
- **E-mail sem conta:** o aceite define a senha e leva a `configurar_mfa`.
- **E-mail que já tem conta com senha:** a pessoa trabalha em outra escola. O aceite ignora `senha` e responde a etapa `entrar` com o `bilhete`, que a web leva ao login. Ela entra com a senha e o MFA que já tem, e só depois da credencial verificada o usuário do convite é ativado, com auditoria. O `ops:convite-coordenador` cria o usuário já com o `conta_id` (conta nova sem senha, ou a existente), mas inativo até o aceite. O link do convite nunca troca a senha de uma conta existente. A web lê o token do fragmento `#` e o tira da barra com
`history.replaceState`.

**Operador.** `ops:*` grava `autor_operador` e abre o contexto da escola alvo.
- `ops:sessao-sintetica` só roda com `AMBIENTE=local`.
- O convite vai para um arquivo 0600.
- `ops:redefinir-mfa` recebe `usuarioId` e a referência do pedido, e responde ok ou erro.

**Ciclo de vida.** Serviço de domínio `CicloDeVidaService` (17.0), sem rota no F1: a tela é do F2 e o pedido do titular do F3. Cada ação é uma transação, com a auditoria dentro, na escola do contexto; o autor é a pessoa da sessão ou o operador. Id de outra escola, de ninguém, o próprio ou, na desativação, já desativado: `NAO_ENCONTRADO`. As travas vão na ordem usuário, conta, sessões.
- **Desativar (aluno ou equipe):** `usuario.desativado_em`, encerra as sessões dele nesta escola (motivo `desativacao`), apaga o `senha_hash` da `credencial_matricula` (a linha e a matrícula ficam) e desliga a `conta_externa` dele nesta escola (a retenção do identificador é "enquanto houver vínculo", `docs/lgpd.md`). Auditoria `usuario.desativado`, só com contagens e sim ou não.
- **Limpeza da conta:** com a conta travada (`FOR UPDATE`), se ela não tem usuário ativo em escola nenhuma nem usuário esperando convite ainda válido, apaga e-mail, senha, segredo, passo e códigos, e encerra as sessões que restarem com motivo `conta_limpa` (saem pelo expurgo de 30 dias, a retenção da sessão; o encerramento desce pelo índice parcial de `conta_id`). Se um convite segurava a conta, o `sistema.expurgar-acesso` a limpa pelo mesmo critério na madrugada depois de o convite vencer ou ser revogado. A linha fica só com o id, que os usuários desativados ainda apontam. O convite válido segura a conta porque, sem o e-mail, o aceite dele deixaria alguém com senha e sem login. Duas desativações da mesma conta, em A e em B, esperam uma pela outra na conta, e a segunda limpa.
- **Eliminação pedida pela escola A:** apaga só o que é de A (usuário, `credencial_matricula`, `conta_externa`, vínculos, sessões; o convite sai em cascata). Se era o último usuário da conta, a mesma limpeza da conta. `registro_acesso` e `auditoria` ficam pela retenção legal, com o id; o vínculo de outra pessoa que o eliminado criou também fica (seção 3, "Autor"). Auditoria `usuario.eliminado`.
- **Desligar a conta externa** de um usuário ativo (decidido na 13.0, feito na 17.0): apaga a `conta_externa`, e o professor liga a nova no login seguinte. Auditoria `conta_externa.desligada`.
- **Desafio emitido antes da limpeza:** a conta sem e-mail não é achada por `mfaDaConta`, e o código certo responde `NAO_AUTENTICADO`.
- **`sistema.expurgar-acesso`, às 4h30 de São Paulo** (uma hora depois de `expurgar-jobs` e duas e meia antes do primeiro turno), na fila de lote e não urgente: apaga `registro_acesso` com mais de 6 meses (inclusive a falha sem escola), sessão com `coalesce(encerrada_em, expira_em)` de mais de 30 dias e convite 30 dias depois do primeiro entre usado, revogado ou expirado (`least`). Depois, limpa em lotes as contas da equipe sem usuário ativo e sem convite válido (as que um convite segurava na desativação), em duas instruções numa transação: a primeira trava as candidatas (`for update skip locked`), a segunda reconfere o critério com a visão de depois da trava e só então limpa (numa instrução só, um convite com commit entre o começo dela e a trava não seria visto). O convite trava a conta existente (`contaParaConvite`, `FOR NO KEY UPDATE`): o lote a pula, e o convite que chega depois da trava do lote cria outra conta. Lotes de 5.000 com `for update skip locked`, como o expurgo de jobs do F0; o corte vem do relógio do worker, lido uma vez por execução. Registro e sessão descem pelos índices `registro_acesso_em_idx` e `sessao_fim_idx`; o convite, um por coordenador convidado, não tem índice próprio.
- **Troca de escola:** grava `saida` no registro de acesso da origem, com o usuário da origem (17.5).

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
| Travar a conta, conferir se ela ainda serve a alguma escola e limpá-la (`travarConta`, `limparContaSemUso`), e encerrar as sessões dela em todas as escolas (`encerrarSessoesDaConta`) | a credencial é global: o `conta_id` vem do usuário da escola do contexto (desativação e eliminação) ou da conta já travada na redefinição do MFA; devolvem só se limpou ou quantas (17.0) |

O item 9 fala em três exceções por módulo, e aqui são mais de dez métodos (13 depois da 6.0, 20 depois da 7.0, 21 depois da 12.0, 22 depois da 15.0 e 25 depois da 17.0; a contagem cresce com as tarefas, e a lista que vale é a própria classe, com uma justificativa em cada `@SemEscopo`). O motivo: essa classe é a
própria fronteira da resolução de tenant, a única do sistema, e há teste de que só o módulo
`sessao` a importa. Fora dela, `@SemEscopo` só aparece em `sistema.expurgar-acesso`
(`retencao`, como no F0: o lote vencido de cada tabela e a limpeza das contas sem uso, 17.0; com o expurgo de jobs, são três métodos no módulo, todos rotina nossa sem requisição de escola, e por isso a terceira exceção do item 9 não aponta desenho errado) e no `RedeEEscolaRepository` do `ops:escola`, com dois métodos (criar rede,
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
  - **Decidido na 18.0:** `/` é a área autenticada (sem sessão, leva a `/entrar`), e a casca do estado do sistema, que
    era a raiz no F0, passou a `/sistema`, pública: é a tela que se abre justamente quando não se consegue entrar.
  - **Estado da sessão fora do TanStack Query** (18.0): ele vive no módulo `api/sessao.ts` e chega à tela por
    `useSyncExternalStore`. A sessão não é dado de servidor para guardar em cache, e o esvaziamento do cache na troca
    de escola (20.0) apagaria justamente o que diz se a pessoa ainda está dentro.
  - **O esvaziamento do cache na troca é `resetQueries()` dentro de `guardarToken`, com o token do destino já em
    memória** (20.0, no lugar do `queryClient.clear()` antes do token que esta seção pedia). São duas razões: o `clear`
    tira a consulta do cache mas a tela montada segue mostrando o último dado que recebeu, porque o observador fica
    preso à consulta removida — e é a tela montada, a que fica atrás do login por cima, que não pode continuar com o
    nome e a escola da pessoa anterior (regra 20, itens 4 e 5); e o `resetQueries` refaz as buscas, então refazê-las
    antes do token novo traria o dado da escola de origem de volta, porque na troca que passa pelo segundo fator a
    sessão de origem ainda vale. Só quando a sessão é nova (entrada, escolha de escola, troca concluída), nunca na
    rotação de rotina, e a troca que para no segundo fator não esvazia nada.
  - **O seletor não leva ao endereço da outra escola: explica e manda entrar por lá** (20.0). Os `acessos` levam o nome
    da escola e mais nada dela (seção 7), e pôr o `slug` da outra ali alargaria o que uma escola sabe da outra. A troca
    recusada mostra `AVISO_DA_TROCA_RECUSADA`, que manda sair e entrar pela escola de destino. A sessão de matrícula
    nunca chega ao seletor: o aluno não tem conta, `acessos` vem vazio e o cabeçalho mostra só a escola dele.
- **Token:** fica em memória, no módulo `api/sessao.ts`. Quem manda `Authorization` e, no 401, renova uma vez e repete
  é `chamarComSessao`/`buscarComSessao` desse módulo; o `buscarDaApi` de `api/cliente.ts` continua sendo a chamada
  anônima, sem token e sem renovação (18.0).
- **Sair** (18.0): `DELETE /v1/sessao`, com uma repetição. O token vencido é renovado **antes** do `DELETE`, porque a
  guarda exige JWT válido: sem isso, a tela parada mais de 10 min sairia com 401, e a web contaria como sessão já
  encerrada enquanto ela seguia viva no servidor. Com o token em dia, o 401 é sessão que já não existe, e o 401 da
  repetição é a resposta perdida da primeira. Encerrar não passa por `chamarComSessao`: depois dessa renovação, não há
  por que rotacionar o cookie de novo a cada tentativa. Esta aba esquece o token de qualquer jeito, porque o computador é
  compartilhado, e **todo fim de sessão limpa o cache do TanStack Query**: sem isso, a pessoa seguinte no Chromebook
  do carrinho abriria a área autenticada com o nome e a escola da anterior ainda em cache (regra 20, itens 4 e 5).
  Quando a API não confirma o encerramento, o cookie de renovação continua valendo no servidor: a tela de entrada
  avisa, em vez de apresentar a saída como concluída. O aviso vive em memória, e um F5 na entrada o apaga — risco
  residual aceito no F1, porque o cookie é de sessão do navegador e fechar o navegador resolve. **Sessão esquecida
  nesta aba não renova mais:** sem isso, um pedido perdido da tela que ainda estava montada reabriria pelo cookie
  sobrevivente a sessão que a pessoa acabou de encerrar.
- **Renovação:**
  - uma por vez, entre abas também (Web Locks);
  - com 409 `JA_RENOVADO`, espera a trava e tenta uma vez com o cookie atual, passada a janela de
    `JANELA_DE_RENOVACAO_SIMULTANEA_MS`, que mora em `packages/shared` desde a 18.0 para os dois lados usarem o
    mesmo número;
  - com resposta perdida, repete; o servidor trata o caso (seção 5).
- **Entrada por e-mail:** o 503 do semáforo com `Retry-After` é repetido sozinho por até 30 s, com o botão em
  "Entrando…". 503 ou falha de rede **sem** `Retry-After` não é a fila do login: sobe como erro na hora, para a
  pessoa não ficar trinta segundos olhando "Entrando…" com a rede da escola fora (18.0).
  - **A espera do cabeçalho é limitada** ao intervalo de 1 s até o que resta dos 30 s (18.0). `Retry-After` zerado
    viraria repetição sem intervalo contra a rota que o semáforo está protegendo, com a escola inteira atrás do mesmo
    IP; maior que o orçamento deixaria a pessoa em "Entrando…" além do prazo que a tela promete, e sobe como erro.
- **Sessão vencida:** o login abre por cima da tela, sem perder o estado. Com 5xx ou sem rede, não desloga.
- **Inatividade:** timer de ponteiro e teclado. Nenhuma tela faz polling, e "Sair" fica no cabeçalho.
- **Troca de escola:** limpa o cache do TanStack Query.
- **Campos:** matrícula com `inputmode="numeric"` e `autocomplete="username"`; TOTP com `one-time-code`; segredo com botão copiar; aviso da TI no botão da conta.
- **Estados:** os quatro do F0. Coluna única a partir de 360 px, alvo de 44 px, projetos `chromebook` e `celular`.
- **Desafio e bilhete em memória** (19.0): o desafio da etapa (`mfa`, `configurar_mfa`, `escolher`) e o bilhete do
  convite vivem no mesmo módulo do token, em variável de módulo, com a etapa conferida na leitura. São meia
  credencial — quem os tem já provou a senha, ou o link do convite —, e no computador compartilhado da escola nada
  disso pode sobreviver à aba. Um F5 na tela do segundo fator os perde de propósito, e a tela manda refazer a senha
  em vez de mostrar um formulário que só responderia erro. A sessão aberta apaga os dois.
- **Segundo fator na tela** (19.0): o 503 **não** é repetido sozinho em `/v1/sessao/mfa`, ao contrário das duas
  entradas por senha — a rota não faz hash, e repetir gastaria tentativa do contador da conta com um código que vale
  30 s. O `CONTA_SEGURADA` do quinto código errado leva de volta à entrada com a explicação, porque ali o desafio já
  foi consumido pela API. Segredo e códigos de recuperação ficam só no estado do componente, nunca no cache de
  consultas, e o QR é conveniência ao lado do segredo em texto, nunca o único caminho (regra 50, item 2).
- **Convite na tela** (19.0): o token vem do fragmento `#` e sai da barra antes da primeira chamada. A tela chama
  `aceitar` **sem senha** primeiro: a conta nova recebe `ENTRADA_INVALIDA` sem gastar o convite, e só então a senha é
  pedida; a conta que já existe responde `entrar` e nunca vê campo de senha nova.
- **Mensagem por tela** (19.0): `packages/shared/src/erros/mensagens.ts` tem um texto por tela para os códigos que
  precisam dizer outra coisa ali (matrícula em vez de e-mail, código do segundo fator, convite, endereço da escola) e
  a mensagem única de qualquer `?falha=` do provedor. Não foi criado código de erro novo: nenhuma resposta da API traz
  `MFA_NECESSARIO` — a etapa `mfa` é resposta 200, e quem a trata é a rota da etapa.
- **`oidc-falso` no e2e** (19.0, ponto aberto na 13.0): o emissor anuncia `http://oidc-falso:8080`, que é como a API
  o alcança na rede do compose e o que ela validou no discovery. O navegador do Playwright roda na máquina, onde esse
  nome não existe, e por isso a configuração do Playwright manda o resolvedor do Chromium mapear esse nome e porta
  para a porta publicada no host (`--host-resolver-rules`). O `Host` continua o mesmo, e nada muda no que a API
  confere. O `LOGIN_EXTERNO_RETORNO_URL` do ambiente de teste aponta para a porta da web dele (`infra/teste.env`).

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
| 10 | seção 6, FKs compostas, contexto de escola sem usuário | `conta` sem escola; os métodos `@SemEscopo` da fronteira de resolução (25 depois da 17.0); `registro_acesso` com escola nula na falha por e-mail |
| 20 | aluno sem e-mail; claims descartadas; registro de acesso; auditoria fechada; expurgo | — |
| 40, 50, 60 | seções 9 e 10; token em memória; vínculo só confirmado | — |
| 80 | guardas em ordem; baldes por escola; 503 no lugar de logout; cenário | sessão no Postgres, e não no Redis (item 5): o Redis de cache é `allkeys-lru` e expulsaria sessão no meio da aula |

## 12. Premissas não verificadas

- ⚠️ **Retorno do Google e da Microsoft quando a escola não liberou o app:** revisto na 13.0 com o `domain-researcher` (18/09/2026) e ainda sem confirmação oficial do valor exato. O Google documenta `?error=access_denied` na recusa do usuário, mas não diz se `admin_policy_enforced` volta ao `redirect_uri` ou fica na tela dele; a Microsoft descreve AADSTS65001 e AADSTS90094 como tela própria, e só confirma o retorno com `error=` no fluxo vizinho de consentimento do administrador. O RFC 6749 (4.1.2.1) manda devolver o erro ao `redirect_uri` registrado. Todo `error`, com qualquer valor, vira `?falha=provedor` (implementado), e a tela avisa antes do botão.
- ✅ **`hd` sem o escopo `email`:** confirmado na 13.0. O Google entrega `hd` sem condição de escopo (documentação do OpenID Connect do Google). `email` fica porque a ligação do professor precisa dele.
- ✅ **`nonce` no `mock-oauth2-server`:** confirmado na 13.0, observado no `oidc-falso` e exigido pelo OpenID Connect Core (seção 2). Com `interactiveLogin: true`, o nome digitado no formulário é o `subject` dos `requestMappings` (README do projeto).
- ✅ **Microsoft:** confirmado na 13.0 (referência de claims do ID token): o `oid` exige `profile`; o `email` de conta gerenciada não é garantido e pode faltar (aí a ligação do professor é recusada, como qualquer conta sem e-mail); o `tid` de conta pessoal é `9188040d-6c67-4c5b-b112-36a304b66dad`. O `openid-client` aceita o emissor `{tenantid}` só quando o discovery é `https://login.microsoftonline.com` (`handleEntraId` em `build/index.js`), e a lista de `tid` é nossa.
- ✅ **Custo do argon2 e capacidade da seção 5:** medidos na 16.0 (seção 5, "Calibração"), nesta máquina e não no staging. O hash ficou em 30 ms (`t=12`), abaixo da faixa de 100–250 ms, porque 1 CPU por instância não sustenta o RF21 sob ataque de dentro com o hash mais caro; nunca abaixo da OWASP. A premissa que continua aberta é a CPU do staging, que recalibra pelo mesmo cenário.
- ⚠️ **Restauração de sessão do Chrome:** o cookie sem `Max-Age` sobrevive a ela. A inatividade no servidor é a garantia.

## 13. Riscos técnicos

- **p95 da leitura de sessão alto no cenário:** cache de 15 s no Redis de cache, com chave `sessao:{esc}:{sid}`. O vínculo fica fora do cache, porque é conferido no repository a cada acesso: encerrar vínculo não precisa invalidar nada.
  - O valor guarda só ids, papel e datas.
  - É invalidado ao encerrar sessão ou desativar usuário.
  - Abrir ou encerrar ano letivo e mudar a inatividade da escola avançam uma versão por escola (`sessao:v:{esc}`), que entra na chave.
- **Ataque de dentro da rede da escola:** o rebaixamento atrasa os alunos da própria escola que ainda não entraram naquele navegador, mas não recusa ninguém nem degrada outra escola. O alerta `login-rebaixado-por-escola` avisa.
- **IPv6:** os contadores por IP contam o endereço inteiro. Quem controla um /64 troca de endereço e escapa do rebaixamento por IP e do limite do e-mail. Aceito no F1: o contador por conta continua segurando cada conta, e o ataque espalhado cai no rodízio por IP da equipe; contar por /64 fica para quando houver escola com IPv6 de saída (a rede da escola sai por um IPv4 de NAT hoje).
- **Ataque distribuído ao balde "equipe":** muitos IPs podem lotar o balde e atrasar o login da equipe de todas as escolas. O rodízio por IP e o limite por IP reduzem o efeito, e o alerta `login-hash-recusado` avisa. Aceito no F1: a equipe tem sessão de 12 h e entra poucas vezes por dia.
- **Consulta do titular:** a seção 7 lista as tabelas. A execução por código (acesso e exportação) é do F3, como está no roadmap.
- **Testes do F0 presos ao token sintético:** migram na tarefa que tira a flag.
- **`VALIDATE` da FK com órfão:** a consulta prévia aponta a linha, e a migration espera.
