# U04 — apps/api parte 1: esqueleto, sessao, estrutura, professores, sistema

Marcas: **[código]** conferido lendo (`arquivo:linha`, caminhos relativos a `apps/api/` salvo `packages/`) · **[doc]** dito em doc · **[hipótese]** a conferir. Nada foi executado (sem teste, sem build).

## 1. Finalidade e limites

- Esqueleto: `main.ts` (boot, telemetria, shutdown), `configurar-app.ts` (contexto, métricas HTTP, filtro de erro, drenagem), `app.module.ts` (monta 17 módulos e as 4 guardas globais), `banco/limite/uso.module.ts` (pool, Redis de cache + limitador, Redis de fila + contador de uso), `config.ts` (junta 11 leituras de ambiente e reprova o boot com todos os erros de uma vez) [código `src/app.module.ts:80-175`, `src/config.ts:106-158`].
- `sessao/`: identidade de quem entra. Login por e-mail (equipe), por matrícula (aluno), por conta Google/Microsoft (OIDC), MFA do coordenador, convite, troca de escola, renovação/saída/atividade, `/v1/eu`, tela pública de acesso da escola. Também é a **fronteira da resolução de tenant**: única classe com `@SemEscopo` de login (26 métodos) [código `src/sessao/resolucao-de-tenant.repository.ts:95`].
- `estrutura/`: ano letivo, série, disciplina, turma, lista de nomes, vínculo professor×turma×disciplina, inatividade e provedores da escola. `professores/`: cadastro/lista/convite de professor (a escrita delega a `sessao/`). `sistema/`: saúde, estado, avisos, contexto, jobs sintéticos.
- Não é da unidade: guardas e matriz de permissão (`packages/nucleo/src/{identidade,limite,permissao}`), schema (`packages/nucleo/src/db/schema`), contratos zod (`packages/shared`), `operacao/`, `ops/`, `sala/` (reivindicação de nome mora em `sala/`, mas usa `sessao/` como biblioteca).
- Tamanho real: `sessao/` tem 73 arquivos na pasta (92 com subpastas), **6.367 linhas de produção** (26% comentário) e 3.061 de teste colocado; `estrutura/` 2.320 (+194); `professores/` 159; `sistema/` 332 (+83). Os "9,4 mil" do pedido incluem os testes [código, contagem por `wc`/grep].

## 2. Pontos de entrada

Guardas globais, em ordem (`src/app.module.ts:128-165`): JWT (`GuardaDeAutenticacao`) → limite (`GuardaDeLimite`) → sessão no Postgres (`GuardaDeSessao`) → permissão (`GuardaDePermissao`) + `InterceptorDeUso`. Rota sem `@Permite` nem `@RotaAnonima` não sobe (`ConferenciaDasPermissoes`) [código `app.module.ts:128-133`].

| Rota | Guarda/papel | Arquivo |
|---|---|---|
| POST `/v1/sessao/email`, `/v1/sessao/matricula` | `@RotaAnonima` + `@LimiteQueRebaixa` | `sessao/login-email.controller.ts:12`, `matricula.controller.ts` |
| GET `/v1/escolas/:slug/acesso` | anônima | `acesso-da-escola.controller.ts:14` |
| POST `/v1/sessao/mfa`; `/v1/conta/mfa/configurar`, `/ativar` | anônima; quem autoriza é o desafio JWT no `Authorization` | `mfa.controller.ts:25,45` |
| POST `/v1/usuarios/:id/mfa/redefinir` | `@Permite('usuario_mfa','redefinir')` | `redefinir-mfa.controller.ts` |
| GET `/v1/eu`; POST `/v1/sessao/atividade`; DELETE `/v1/sessao` | `@Permite` (eu.ler, sessao.registrar_atividade, sessao.encerrar) | `eu/atividade/saida.controller.ts` |
| POST `/v1/sessao/renovar` | anônima (cookie `educa_sessao`) | `renovacao.controller.ts` |
| POST `/v1/convites/consultar`, `/aceitar` | anônima | `convite.controller.ts` |
| POST `/v1/sessao/escola` | `@AceitaDesafio` + `@Permite('sessao','trocar_escola')` | `troca-de-escola.controller.ts` |
| GET `/v1/sessao/externa/:provedor/iniciar`, `/retorno` | anônima (redirecionamento 302) | `externa/externa.controller.ts` |
| PUT `/v1/escola/sessao`, `/v1/escola/provedores` | coordenação (`escola_configuracao.alterar`) | `estrutura/*.controller.ts` |
| `/v1/anos-letivos` (POST, GET, `:id/abrir`, `:id/encerrar`), `/v1/series`, `/v1/disciplinas`, `/v1/turmas` (+`:id/alunos`), lista de nomes (5 rotas), `/v1/vinculos` (+encerrar/confirmar/contestar), `/v1/meus-vinculos` | `@Permite(recurso, ação)` por rota; professor só em turma/vínculo próprio | `estrutura/*.controller.ts` |
| `/v1/professores` (4 rotas) | coordenação | `professores/professores.controller.ts` |
| GET `/saude`, `/prontidao`, `/v1/sistema/estado`, `/v1/sistema/avisos` | anônimas (`/prontidao` com `@SemLimite`) | `sistema/*.controller.ts`; `ProntidaoController` é registrado no `AppModule` (`app.module.ts:126`) |
| GET `/v1/sistema/contexto`; POST/GET `/v1/sistema/jobs-sinteticos` | `@Permite`; o POST só existe com `ROTAS_SINTETICAS=true` | `sistema.module.ts:25-33` |

Sem worker, fila consumida nem webhook nesta unidade. O único job é o `enfileirar` do job sintético [código `sistema/jobs-sinteticos.service.ts`]. Todas as rotas têm teste de integração por caminho (grep nos testes: de 2 a 36 arquivos por rota) [código].

## 3. Fluxos e regras

**Login por e-mail** (`sessao/login.service.ts:94-190`): normaliza e-mail → conta o limite por IP (rebaixa, nunca recusa) → `ConferenciaNaVez` (vez no semáforo do hash, depois reserva no `ContadorDeTentativas` por HMAC(e-mail)+origem, depois argon2) → senha certa → convite/bilhete, usuários ativos → `ConclusaoDeLogin.concluir` decide a etapa (`escolher`/`mfa`/`configurar_mfa`/`pronta`) e só em `pronta` grava sessão, registro de acesso e cookies (`conclusao-de-login.ts:60-135`). Resposta única para e-mail inexistente, senha errada, conta sem usuário: um hash cada (`hash-de-senha.ts:35-48`, hash fixo) [código].

**Login por matrícula** (`matricula.service.ts:81-120`): slug → escola (`escolaPorSlug`), contexto "escola sem usuário", contador por HMAC(`escola|matrícula`), rebaixamento por IP+escola. Slug inexistente segue o mesmo caminho com a "escola desconhecida" `0000…` [código `matricula.service.ts:20-24`].

**Sessão e tokens**: access JWT de 10 min (HS256, `jose`), refresh opaco em cookie, só o SHA-256 no banco, rotação com família e detecção de reuso (409 `JA_RENOVADO` até 30 s, depois encerra a família e audita) [código `renovacao.service.ts:36-60,105-135`]. Desafio de login é outro JWT (`typ: desafio+jwt`, `aud: sessao`, 5 min), com `jti` consumido no Redis de fila [código `desafio.ts:1-100`]. **A sessão não está em Redis**: `GuardaDeSessao` lê o Postgres a cada requisição autenticada, sem cache [código `packages/nucleo/src/identidade/guarda-sessao.ts:27-45`; comentário "o cache … não existe" em `estrutura/ano-letivo.service.ts:33`]. Redis guarda contador de tentativas, contadores por IP, desafio usado e o rate limit.

**Rate limit** (regra 80, item 1): autenticada por `sub` e `esc` do token com limites por escola lidos de `configuracao_operacional_escola`; anônima por IP (3000/min por padrão em `.env.example:68`); login por senha nunca recusa por IP, rebaixa no semáforo; o que segura é o contador por conta (5 falhas → 30 s, dobra até 15 min) [código `packages/nucleo/src/limite/guarda-limite.ts:55-95`, `sessao/contador-de-tentativas.ts:16-30`].

**Tenant e autorização por objeto**: `GuardaDeSessao` grava escola/usuário/papel/ano no contexto (AsyncLocalStorage); todo repository lê `exigirEscolaDoContexto()` e `exigirAnoEmCurso()` e nenhum método recebe escola (ex. `estrutura/serie.repository.ts:11-36`, `turma.repository.ts`). Alcance por papel vem de `alcanceDe(papel, recurso, ação)` da matriz de `@educa/shared` (`estrutura/turma.service.ts:30-35`); professor só abre turma com vínculo `confirmado` (`turma_vinculada`). Id fora de formato, de outra escola e inexistente dão o mesmo `NAO_ENCONTRADO` (`estrutura/entrada.ts:8-13`); o teste `estrutura-isolamento.int.test.ts` compara as três respostas e confere que nada mudou em B [código]. `GuardaDePermissao` devolve 404 (não 403) para papel sem permissão (`guarda-permissao.ts:24-31`).

**Concorrência**: unique parcial e `FOR SHARE/UPDATE/NO KEY UPDATE` documentados com a ordem turma→vínculo; `pg_advisory_xact_lock` por escola para convite (`convite.repository.ts:14-24`); `update` condicional para abrir/encerrar ano e aceitar convite [código]. Um deadlock de ordem convidar×eliminar está registrado e aberto (`TODO.md:187`) [doc].

**Auditoria**: `RegistroDeAuditoria.gravar(tx, …)` na mesma transação em escrita de estrutura/vínculo/convite; leitura nominal de alunos da turma pela coordenação exige `finalidade` e grava `turma.alunos_lidos` (`turma.service.ts:121-138`) [código]. Nota com autor humano e D55 não se aplicam a esta unidade.

## 4. Dependências

- Externas: Postgres (Drizzle), Redis cache (limitador) e Redis de fila (login/uso), `jose`, `@node-rs/argon2`, `otpauth`, `openid-client` (adaptador com prazo de 5 s, `externa/openid-client.adapter.ts:7`), `@nestjs/*`, `zod`.
- Internas: tudo vem de `@educa/nucleo` (guardas, contexto, auditoria, schema) e `@educa/shared` (esquemas, matriz).
- **`sessao/` é biblioteca para outros módulos** apesar do comentário "a fronteira fica dentro dele": `operacao/` tem ~30 imports de `../sessao/` em 9 arquivos (hash, cookies, contador, semáforo, `login.service`), `sala/` 8 arquivos, `ops/` 9, `assistente/` o `ContadorEmJanela` [código, grafo de imports rodado fora do repositório]. Só a `ResolucaoDeTenantRepository` é de fato contida (teste em `test/arquitetura.test.ts:58-106`).
- **`estrutura/entrada.ts` é lib compartilhada disfarçada**: `idDoCaminho`, `lerEntrada`, `paginar` são importados por 29 arquivos de outros módulos (artefato, atividade, sala, tutor, governanca, privacidade…), mais `turma/vinculo/disciplina.repository` por 5 [código].
- Ciclos: nenhum em runtime (arquivo ou módulo Nest). Três ciclos só de tipo: `login.service ↔ conclusao-de-login`, `login.service ↔ convite.service`, e `sessao → operacao` (tipo `ConferenciaDoAutor`, `convite.service.ts:25`, `redefinicao-de-mfa.ts:5`) com `operacao → sessao` real [código]. Não há dependency-cruiser/madge/knip no `package.json` nem regra de camada no ESLint [código `package.json:15-22`].
- DI: 100% por `useFactory` com `new` e `inject: [...]` nos módulos `sessao`, `estrutura`, `professores`; `sistema/` usa `@Injectable/@Inject`, estilo diferente [código]. Quatro módulos `@Global()` (banco, limite, uso, sessao). Repositories nunca são injetados: o service cria `new XRepository(tx)` dentro da transação [código `estrutura/turma.service.ts:60-71`].

## 5. Dados

- Escreve/lê: `escola`, `usuario`, `conta`, `convite`, `sessao`, `registro_acesso`, `codigo_recuperacao`, `credencial_matricula`, `conta_externa`, `provedor_escola`, `ano_letivo`, `serie`, `disciplina`, `turma`, `vinculo`, `lista_nome`, `auditoria`, `job_registro` [código, imports nos repositories].
- `AnoLetivoRepository.virarSala` escreve em `acesso_turma`, `reivindicacao` e `lista_nome` (tabelas do domínio de `sala/`) dentro de `estrutura/` (`ano-letivo.repository.ts:77-94`); `TurmaRepository` consulta `acesso_turma`/`vinculo`/`usuario`. Acoplamento de dado estrutura↔sala [código].
- `ConviteRepository` e `ProfessoresRepository` leem `convite`/`usuario`; `ops/*` e `operacao/*` reutilizam `ConviteService` e `AcessoDaEscolaRepository` [código].
- Índices começam pelo escopo nos casos vistos (`vinculo_usuario_idx`, `lista_nome_turma_idx`, `registro_acesso_escola_em_idx`, `sessao_escola_usuario_idx`) [código `packages/nucleo/src/db/schema/*.ts`]. Migrations ficam fora da unidade.

## 6. Contratos

- Entrada: todo controller recebe `@Body() corpo: unknown` e faz `esquema.safeParse` → `ENTRADA_INVALIDA`. Há dois idiomas: bloco inline repetido **24 vezes** (sessao, parte de estrutura, sistema) e o helper `lerEntrada` (**61 usos**, estrutura/professores). Não há pipe/validador global [código].
- Saída: esquema `esquemaResposta*` do `@educa/shared` aplicado com `.parse` (DTO de saída estrito). Em `sessao/` o `.parse` fica no controller; em `estrutura/` e `professores/` no service [código].
- Erros: `ErroDeDominio(CodigoDeErro.X)` tipado em todo lugar; `throw new Error('…')` só para invariante interna [código].
- Explícito e testado: `test/contratos.test.ts` varre todo `esquemaResposta*` e proíbe campos `senha/hash/segredo/refresh/email` fora de exceções nominais [código `contratos.test.ts:1-60`].
- Implícito: nomes de cookie, formato do refresh (`/^[A-Za-z0-9_-]{43}$/`, `renovacao.service.ts:48`) e chaves Redis (`login:`, `login-op:`, `desafio:usado:`) vivem em constantes locais, sem tipo compartilhado nem teste de contrato [código]. Claims do desafio têm schema zod próprio (`desafio.ts:49-60`).

## 7. Testes

- Três lugares: (a) colocados em `src/**/*.test.ts` e `*.int.test.ts` (11 de integração de repository em `sessao/`); (b) `test/` plano com 88 arquivos e 35.108 linhas (66 `*.int.test.ts`, 15 helpers `*-de-teste.ts`, `sessao-de-teste.ts`, `api-com-sessao.ts`); (c) `e2e/`. Convenção: unidade `*.test.ts`, integração `*.int.test.ts`, escolhidas por `vitest.config.ts` [código]. Plano de reorganização (testes HTTP por módulo em subpastas, helpers em `__fixtures__`) está **só na memória do usuário** de 26/09 e em `RESPOSTAS.md:13`; nada aplicado [doc].
- 52 arquivos de `test/` chamam `subirApi`, que sobe o `AppModule` inteiro por arquivo; qualidade alta nos amostrados: isolamento compara resposta de B, inexistente e id malformado e confere estado do banco e as FKs compostas (`estrutura-isolamento.int.test.ts:93-160`) [código].
- `test/arquitetura.test.ts` (1.403 linhas, ~19 `describe`) é um depósito de travas: contenção da resolução de tenant e da conta global, painel/operação (C36-C46), suboperador, incidente, retenção/arquivo do titular, tabelas sem `escola_id`. Só ~170 linhas tratam desta unidade; **nenhuma trava a regra 00** (controller sem regra, service sem drizzle) nem camadas/ciclos [código].
- Sem `.skip/.only/.todo` na unidade [código, grep]. Unidades puras de qualidade (`login.service.test.ts`, `seguro-do-login.test.ts`) são pequenas e específicas.
- Lacuna a conferir [hipótese]: `externa.service` e `openid-client.adapter` não são citados por nenhum teste unitário (só `sessao-externa.int.test.ts` via HTTP); confirmaria lendo o int test e vendo se cobre falha/timeout do provedor.

## 8. Resiliência e escala (sinais)

- Bom: Redis do login com prazo de 100 ms e seguro em memória por instância, que divide o limite por `LIMITE_INSTANCIAS_API`; semáforo do hash com rodízio por balde, espera máxima de 2 s e 503 com `Retry-After` sorteado; `GuardaDeSessao` responde 503 (não 401) se o Postgres cai; paginação por cursor `limite+1` em todas as listas; `statement_timeout` no pool; drenagem no SIGTERM [código `semaforo-de-hash.ts:6-14`, `guarda-sessao.ts:45-60`, `main.ts:28-31`].
- Estado em memória: contador de tentativas, contador em janela, rebaixamento, semáforo, `LimiteDoEmailPorIp` (6 `Map` de instância). Declarado e intencional para o semáforo; os demais caem nele só com Redis fora [código/doc].
- Risco de escala **[hipótese]**: a sessão sai do Postgres a cada requisição (1 query com join); com 400 usuários e ~60 turmas isso é carga constante no banco. Confirmaria medindo `sessao.leitura.duracao` no cenário de carga existente.
- `RegistroDeAcessoRepository.gravar` insere a cada login, renovação e saída (tabela cresce com uso); retenção de 6 meses por expurgo noturno fora da unidade [código/doc].
- Observabilidade: métricas por login (duração, `conta_segurada`, `renovacao`), `observarSeguroDoLimite` no boot, log sem PII por convenção e teste (`linhasDeLog`) [código].

## 9. Suspeitos de código morto (não afirmo morte)

Busquei exports sem referência em produção no repositório todo (apps, packages, tools, e2e, infra) com script de leitura. Nenhum arquivo ou classe inteiros ficaram sem uso. Restam:
- Tipo sem nenhuma referência (nem teste): `ViradaDaSala` só é usado no próprio arquivo e `ResultadoDaRenovacao` em nenhum (`estrutura/ano-letivo.repository.ts:6`, `sessao/renovacao.service.ts:40`) — podem ser parte de contrato por inferência.
- ~95 exports só usados por teste ou só dentro do arquivo (constantes `ESPERA_*`, `MOTIVO_*`, `Dependencias*`, `PREFIXO_*`); ruído de superfície, não morto. Dinâmico possível: nenhum (Nest usa `useFactory`, mas as classes são importadas por nome).
- `sessoes-sinteticas.ts` (154 linhas) e `sistema/jobs-sinteticos.*` são código de teste/carga na árvore de produção; referenciados por `ops/sessao-sintetica.ts` e pela flag `ROTAS_SINTETICAS`. Confirmaria no CI/`tools/` se o cenário de carga ainda os chama [hipótese].

## 10. Duplicação e inconsistência

- **`convite.service.ts` (363 linhas) mistura três coisas**: aceite público (`ConviteService:77`), ativação no login (`AtivacaoPorConvite:140`) e três casos de uso do **operador** (`criarConviteDeCoordenador:257`, `refazerConviteDaCoordenacao:301`, `revogarConvitePeloOperador:339`) que só `operacao/` e `ops/` chamam [código].
- `login.service.ts` exporta utilitários usados fora (`normalizarEmail:55`, `hashDoRefresh:60`, `ipParaRegistro:208`, `BYTES_DO_REFRESH`), importados por `conclusao-de-login`, `matricula`, `renovacao`, `saida`, `operacao/*`: origem dos ciclos de tipo [código].
- Helper `escolaDoContexto()` copiado em 5 repositories (`escola-sessao`, `convite`, `criacao-de-sessao`, `escrita-de-sessao`, `redefinicao-de-mfa`) apesar de existir `exigirEscolaDoContexto` do nucleo usado nos demais [código, grep]. Idem `contextoAtual()?.requisicaoId ?? randomUUID()` 13 vezes, com `naEscolaSemUsuario` existindo.
- AES-256-GCM reimplementado duas vezes (`cifra-do-segredo.ts:43-62` e `externa/cookie-oidc.ts:66-92`); HMAC-SHA256 com chave em 4 classes [código].
- `sessao.module.ts` (308 linhas): ~30 providers por `useFactory`; `opcoes.medidor ?? medidorGlobal()` 11 vezes; `new EmissorDeDesafio(chave)`/`EmissorDeToken` instanciados 5 vezes em vez de um provider [código `sessao.module.ts`]. `AppModule.com` repete o spread condicional de opções 8 vezes e cria 3 loggers (`app.module.ts:104-120`); expõe opções "só do teste" (`armazemDeArquivos`, `relogioDaPrivacidade`, `sortearCodigoDaSala`) no módulo de produção [código `app.module.ts:48-65`].
- `acesso-publico.repository.ts` contém `AcessoDaEscolaRepository` (nome do arquivo ≠ classe) e é usado por 5 arquivos de `ops/` [código].
- Estilo de Nest divergente: `useFactory` sem decorators (sessao/estrutura) vs `@Injectable` (sistema); `ProntidaoController` mora em `sistema/` mas é registrado no `AppModule`.
- Controllers com lógica leve: `TrocaDeEscolaController` ramifica por tipo de bearer (`troca-de-escola.controller.ts:30-32`), `RedefinirMfaController` engole id inválido com 202 (`redefinir-mfa.controller.ts:22-26`), `RenovacaoController` trata `RenovacaoRecusada` para cookie (`renovacao.controller.ts:26-33`). Nada grave, mas a regra 00 item 2 é só convenção.
- Plano de quebrar `sessao/` em subpastas: já existem `senha/` (11 arquivos) e `externa/` (8). Agrupamento natural por linhas de produção: login-senha 1.391 (inclui `senha/`), sessão/ciclo 925, convite 789, externa 778, MFA 748, tenant 565, matrícula 252, troca 121, acesso-escola 77, módulo+config+hash+sintéticas 721 [código, grupos por mim; soma = 6.367].

## 11. Doc × código

- Regra 80 item 5 (e `docs/infra.md:157`): "sessão … em Redis". Código: sessão no Postgres sem cache; só desafio/contadores no Redis [código vs doc].
- `sessao.module.ts` e `arquitetura.md` falam em "fronteira da resolução de tenant dentro do módulo". Verdade para a `ResolucaoDeTenantRepository`; falso para o resto, que outros módulos consomem (§4) [doc vs código].
- Regra 10 item 9 ("terceira exceção `@SemEscopo` no mesmo módulo é sinal de problema"): 26 na resolução, aceitas por teste de contenção, justificativa por método [código]. A regra é cumprida pela exceção documentada, não pela letra.
- Regra 00 item 3 (repository único com banco): cumprida na unidade (nenhum `drizzle-orm` em service/controller) [código]. Item 2 (controller sem regra): cumprida na prática, não travada.
- Memória: 73 arquivos em `sessao/` confere (73 na raiz da pasta).

## 12. Tamanho, risco e dependências

- 160+ arquivos entre as 4 pastas e o esqueleto: ~9,2 mil linhas de produção (6.367 + 2.320 + 159 + 332 + 974 do esqueleto/config.test), ~3,3 mil de teste colocado e ~15 mil de `test/` relacionadas.
- Risco de mexer: **alto** em `sessao/` (segurança, concorrência, ordem de travas, cookies; `operacao/`, `sala/`, `ops/` dependem de seus símbolos por caminho; 38 commits na pasta), **médio** em `estrutura/` (travas turma→vínculo, 29 arquivos externos dependem de `entrada.ts`), **baixo** em `sistema/` e `professores/`. Mover arquivos exige atualizar `arquitetura.test.ts` (prefixo `apps/api/src/sessao/` em `:22`) [código].
- Depende de: `nucleo` (guardas, contexto, auditoria, schema, config) e `shared`. Dependem dela: `operacao`, `ops`, `sala`, `assistente`, `atividade`, `artefato`, `entrega`, `governanca`, `ia`, `material`, `privacidade`, `tutor` (via `estrutura/entrada.ts` e repositories), `main.ts`, `config.ts`.

## 13. Os 5 achados mais importantes

1. `sessao/` é biblioteca de fato (operacao, sala, ops, assistente importam 30+ símbolos) mas é desenhada como módulo fechado; `estrutura/entrada.ts` é utilitário global (29 importadores) morando no módulo errado.
2. `convite.service.ts` e `login.service.ts` acumulam responsabilidades alheias (casos de uso do operador; utilitários de e-mail/refresh/IP), origem dos ciclos de tipo e dos pontos de corte do plano de subpastas.
3. Cada controller revalida com `safeParse` à mão (24 blocos) ou `lerEntrada` (61 usos) e o `.parse` de saída fica ora no controller, ora no service: falta um padrão único de borda (pipe/decorator) e nenhuma trava de camada (regra 00) ou de ciclo existe.
4. Sessão lida do Postgres a cada requisição (regra 80 item 5 diz Redis) é o maior risco de escala sem medição citada nesta unidade; o resto do rate limit/login é cuidadoso (Redis com seguro, semáforo, 503 em vez de 401).
5. Duplicações pequenas e fáceis: `escolaDoContexto` copiado 5x, AES-GCM duplicado, `medidor ?? medidorGlobal()` 11x, 3 loggers e opções "só de teste" no `AppModule`; mais `test/` plano com 88 arquivos e `arquitetura.test.ts` de 1.403 linhas misturando travas de outras unidades.
