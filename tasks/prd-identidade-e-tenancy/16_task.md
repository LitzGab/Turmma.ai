# Tarefa 16.0 — Cenário de carga "login às 7h30"

**Funcionalidade:** identidade-e-tenancy · **Depende de:** 5.0, 15.0
**Subagentes obrigatórios:** `infra-guardian`, `test-engineer`

## Objetivo

Um comando roda, contra o compose local, a rajada de login das 7h30 com renovação e ataque de
senha, e decide sozinho se passa. O cenário prova quatro coisas:
- 2.100 contas de três escolas entram atrás de um IP com p95 abaixo de 1 s;
- nenhum aluno é recusado por causa de outro, nem com ataque vindo de fora ou de dentro da escola;
- a renovação em duas abas não derruba nenhuma família de sessões;
- a queda do Redis de fila no meio do ataque não recusa ninguém.

Os parâmetros do argon2 e `LOGIN_HASH_CONCORRENCIA` saem calibrados desta execução, e não de
tutorial.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF11 (tentativas por conta, nunca por IP), RF13 (inatividade), RF21 (rajada das 7h30)
- `techspec.md`:
  - seção 5, "Baldes do semáforo", "Hash", "Tentativas" e "Renovar";
  - seção 7c, tabela e "Cenário de carga";
  - seção 12, premissa "Custo do argon2 e capacidade da seção 5";
  - seção 13, risco da leitura de sessão com p95 alto.
- `.claude/rules/80-infra-e-carga.md`. Itens 1 (a escola inteira sai por um IP), 3 (uma escola não degrada outra) e 11 (teste de carga não chama provedor pago): este cenário existe porque o login das 7h30 é o momento em que o sistema cai na frente da turma.
- `docs/infra.md`:
  - seção 3.1: ~7 logins/s, hash de 100 a 250 ms, e o login não compete por CPU com o resto;
  - seção 10: o teste de carga cresce a cada funcionalidade do caminho quente.
- `.claude/rules/40-testes.md`: limite só impresso na tela é decoração. O critério tem que mudar o código de saída.
- Código existente do F0, que é o modelo a seguir:
  - `infra/scripts/carga.ts`: sobe o projeto de carga, roda o k6 em duas execuções e derruba tudo passe ou não;
  - `infra/scripts/conferir-carga.ts`: confere no banco o que o k6 mediu;
  - `infra/compose.carga.yml`: `cpus:` por serviço;
  - `infra/k6/justica-entre-escolas.js`: VUs num container da mesma rede, threshold sobre a base;
  - `tasks/prd-fundacao-tecnica/15_task.md`: tarefa manual, controle negativo e resultado registrado.
- Criado nas tarefas anteriores do F1:
  - `ops:sessao-sintetica` e o seed de escola (2.0 e 3.0);
  - `POST /v1/sessao/email` e cookie `educa_dispositivo` (4.0);
  - `POST /v1/sessao/renovar` (5.0);
  - `POST /v1/sessao/matricula` (11.0);
  - semáforo e baldes (14.0);
  - rebaixamento e métrica `login.prioridade_rebaixada` (15.0).

## Subtarefas

- [x] 16.1 — `infra/k6/login-7h30.js` e o script de execução.
  - **Seed:** as três escolas sintéticas A, B e C, com 2.100 contas (alunos por matrícula e equipe por e-mail). A senha sintética fica fora do repositório e é gerada na hora.
  - **Ambiente:** o compose sobe com `infra/compose.carga.yml`, duas APIs com `cpus: 1` cada, que é a CPU de referência, e `UV_THREADPOOL_SIZE` fixo.
  - **Fases, na ordem da Tech Spec 7c:**
    1. **base:** login e requisições autenticadas da B e da C sem ataque, para medir o p95 de referência;
    2. **rajada:** 2.100 logins em 5 min, com 40% no primeiro minuto e 30% errando a senha uma vez antes de acertar, seguidos de requisições autenticadas;
    3. **renovação:** token curto e duas abas por conta renovando juntas;
    4. **ataque de fora:** um segundo container k6, com IP próprio, faz 3.000 tentativas por minuto em matrículas diferentes da A e em e-mails diferentes, com e sem conta;
    5. **ataque de dentro:** o mesmo ataque saindo do IP da escola;
    6. **Redis fora:** o Redis de fila é derrubado no meio do ataque e religado.
  - **Emulação da web:** a conta legítima repete o 503 com `Retry-After`, como a web faz (18.0), por até 30 s.
- [x] 16.2 — Critérios como `thresholds` do k6, que mudam o código de saída.
  - **Contagem por grupo:** conta legítima com cookie, conta legítima sem cookie, equipe, atacante e escolas B e C.
  - **Os thresholds:**
    - p95 do login abaixo de 1 s;
    - p95 das requisições da B e da C até a margem declarada sobre a base;
    - zero 429 para conta legítima com o cookie de dispositivo, inclusive a da equipe atacada;
    - zero 503 final para conta legítima com ataque de fora;
    - com ataque de dentro, conta legítima sem cookie entra em até 30 s e nunca termina em erro;
    - `login.prioridade_rebaixada` em 0 na fase 2.
  - **Conferência depois:** um script lê o banco e as métricas. Nenhuma família de sessão foi encerrada por reuso na fase 3 (`sessao.renovacao{resultado=reuso}` em 0), e o rebaixamento só apareceu na A durante o ataque.
  - **Controle negativo:** sem o rebaixamento e sem os baldes por escola (flag de teste recusada em `AMBIENTE=producao`, como `VAGAS_POR_ESCOLA_DESLIGADAS` no F0), o cenário precisa reprovar pela B, pela C ou pela conta legítima da A.
  - **Comandos:** `npm run carga:login` e `npm run carga:login:controle-negativo`.
- [x] 16.4 — Pontos que a 14.0 deixou para cá (decidido em 18/09/2026).
  - **Alerta de 5xx às 7h30:** o 503 `INDISPONIVEL_TENTE_DE_NOVO` do semáforo é atraso por desenho, e hoje também entra na "Taxa de erro 5xx". O cenário mostra se ele dispara o alerta na entrada; se disparar, a regra passa a não contar esse código (ou a separar o 503 com `Retry-After` do login), com teste no `ensaio:alertas`. Alerta que dispara toda manhã vira ruído e esconde o 5xx de verdade.
  - **Inundação de IPs:** medir o custo da roda da equipe com mais de 10.000 IPs distintos esperando.
  - **Aceite de convite:** gera hash fora do semáforo; confirmar que ele não entra na rajada das 7h30 (é raro e fora do horário de aula), ou colocá-lo na vez.
- [x] 16.5 — Despejo com a fila cheia sai de quem foi rebaixado (decidido em 19/09/2026, da revisão da 15.0).
  - **O defeito:** com a fila do semáforo cheia, o despejo escolhe a maior subfila, e não o balde com mais rebaixados, como diz o comentário. No balde da equipe (login por e-mail), um ataque espalhado por muitos IPs pode despejar um professor legítimo com 503. Isso contraria o objetivo da 15.0: o ataque rebaixa a si mesmo, nunca empurra quem entra de verdade.
  - **O que fazer:** o despejo sai primeiro de uma tentativa rebaixada (a mais antiga, ou a de IP com mais rebaixadas); só sem rebaixada na fila ele volta à regra atual. Evitar percorrer todas as subfilas a cada pedido no pico: manter o índice dos rebaixados junto da fila.
  - **Métrica e runbook:** `login.rebaixado_ip` para o rebaixamento pelo limite por IP do login (hoje sem métrica própria), e a entrada "Login rebaixado numa escola" do runbook passa a citá-lo.
  - **Prova:** teste de unidade do semáforo com a fila cheia de rebaixados de muitos IPs e um pedido normal chegando: o normal fica, sai um rebaixado. E a fase de ataque do `login-7h30` confere que nenhuma conta legítima recebe 503 de despejo.
- [x] 16.3 — Calibração e registro.
  - Subir `t` do argon2 a partir do mínimo da OWASP (m=19456, t=2, p=1) até 100 a 250 ms por hash na CPU de referência, e fixar `LOGIN_HASH_CONCORRENCIA` no máximo `UV_THREADPOOL_SIZE − 2`.
  - Registrar os valores na Tech Spec seção 5 e trocar a premissa ⚠️ da seção 12 pelo resultado.
  - Registrar o resultado da execução nesta tarefa, como a 15.0 do F0, com a tabela medido contra limite.
  - Acrescentar a entrada "Rodar o cenário de login" em `docs/runbook.md`, ao lado de "Rodar o cenário de carga".

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `infra/k6/login-7h30.js` | novo |
| `infra/scripts/carga-login.ts`, `infra/scripts/conferir-carga-login.ts` | novo |
| `infra/compose.carga.yml`, `infra/carga.env` | alterado |
| `infra/test/carga-login.test.ts` (conferência do script, como `carga.test.ts`) | novo |
| `packages/nucleo/src/config/validar-config.ts` (flag do controle negativo recusada em produção) | alterado |
| `package.json` (`carga:login`, `carga:login:controle-negativo`) | alterado |
| `tasks/prd-identidade-e-tenancy/techspec.md` (seções 5 e 12), `docs/runbook.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| rajada: 2.100 contas de A, B e C por um IP em 5 min, 40% no primeiro minuto e 30% errando uma vez, com p95 abaixo de 1 s e zero 429 legítimo | carga | RF21 e regra 80, item 1: ninguém recusado por IP, e o hash calibrado dá conta |
| ataque de fora: 3.000/min em matrículas da A e em e-mails, com ou sem conta, sem 503 final nem 429 para conta legítima; p95 da B e da C dentro da margem | carga | uma escola atacada não degrada as outras, e o ataque por identificadores diferentes não passa pelo contador por conta |
| ataque de dentro: o mesmo ataque do IP da escola, com cookie entrando sem atraso e sem cookie entrando em até 30 s, sem erro final | carga | rebaixamento, nunca bloqueio da escola (15.0) |
| conta da equipe atacada pelo script errando a senha dela: o dono, com o cookie, entra sem 429 | carga | contador `conhecido`/`outro` (4.0) sob carga |
| renovação em duas abas por conta: nenhuma família encerrada, conferido na métrica de reuso e não só no k6 | carga e integração | janela de 30 s e `JA_RENOVADO` (5.0) sob concorrência real |
| Redis de fila derrubado no meio do ataque: nenhuma conta legítima recusada, e `limite.seguro_ativo` em 1 | carga | seguro em memória por instância (15.0) |
| fase sem ataque, só com erros legítimos: `login.prioridade_rebaixada` em 0 | carga | o limiar pelo tamanho da escola não gera falso positivo |
| controle negativo: sem baldes por escola e sem rebaixamento, o cenário reprova com a base de pé | carga | quebra se a regra for removida |
| permissão: a flag do controle negativo não sobe em `AMBIENTE=producao` | unidade | a flag de teste não vira porta aberta |

Nenhum destes cenários chama provedor pago nem o `oidc-falso`: o login externo não entra na
rajada (regra 30, item 3; regra 80, item 11).

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] `npm run typecheck` limpo
- [x] E2E verde (se tocou tela): não se aplica, a tarefa não toca tela
- [x] `npm run test:infra` verde (a tarefa mexe em `infra/`, D52)
- [x] `npm run carga:login` passou e `npm run carga:login:controle-negativo` reprovou pela regra, com o resultado registrado nesta tarefa
- [x] Todos os revisores obrigatórios com rodada na seção "Revisões", iniciada depois da
  última alteração de código, e APROVADO nos que têm veto
- [x] Revisão aprovada
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Resultado da execução (16.3)

Em 19/09/2026, na máquina do Joaquim (AMD Ryzen 5 7600, 12 threads, 30 GB), com `infra/compose.carga.yml` (duas APIs
com `cpus: 1`, a CPU de referência), `infra/carga.env` (argon2id m=19456, t=12, p=1; `LOGIN_HASH_CONCORRENCIA=2`;
`UV_THREADPOOL_SIZE=16`) e k6 2.2.0. Senha sintética gerada na hora, 2.100 contas sintéticas.

**`npm run carga:login`: passou, saída 0** (início 17:50 UTC, 19 min com a subida do compose; execução com a versão
final do k6 e dos scripts).

| Critério | Medido | Limite |
|---|---|---|
| p95 do login na rajada (2.100 contas em 5 min, 840 no 1º minuto, 630 errando uma vez) | 40 ms (máx. 202 ms) | < 1 s |
| contas da rajada que entraram, iterações perdidas | 2.100, 0 | 2.100, 0 |
| 429 e erro final de conta legítima, em todas as fases | 0 | 0 |
| p95 do login da B e da C: base / ataque de fora / de dentro / Redis fora | 52 e 54 / 267 e 270 / 252 e 260 / 248 e 251 ms | < 1 s |
| p95 das autenticadas da B e da C: base / sob ataque | 3 ms / 57 e 58 ms nas três fases de ataque | ≤ base + 250 ms (253 ms) |
| p95 do login da A com cookie: fora / dentro / Redis fora | 368 / 363 / 703 ms (máx. 1,15 s) | < 1 s |
| p95 do login da equipe com cookie (dono da conta que o script ataca): fora / dentro / Redis fora | 314 / 290 / 425 ms | < 1 s, sem 429 |
| A sem cookie, do 1º envio até entrar, com as repetições da web (p95; máx.): fora / dentro / Redis fora | 468 ms (865 ms) / 1,79 s (9,3 s) / 741 ms (1,1 s) | até 30 s, sem erro |
| equipe sem cookie, até entrar (p95): fora / dentro / Redis fora | 280 / 885 / 422 ms | até 30 s, sem erro |
| 503 recebidos por conta legítima (repetidos pela web): fora / dentro / Redis fora | 0 / 3 / 0 | nenhum final |
| 503 do semáforo, todos (com o ataque): fora / dentro / Redis fora | 110 / 91 / 50 | informativo |
| ataque enviado por fase | 9.000 (3.000/min por 3 min) | ≥ 8.550 |
| renovação em duas abas: 600 contas, 409 `JA_RENOVADO`, 401 | 600 contas, 600 × 409, 0 × 401 | 0 × 401 |
| famílias encerradas por reuso (banco) e `sessao.renovacao{resultado=reuso}` | 0 e 0 (ok 602, ja_renovado 301 por minuto) | 0 |
| `login.prioridade_rebaixada` | 0 na base, na rajada e na renovação; 1 só na A, nos três ataques | 0 sem ataque, só a A em cada ataque |
| `limite.seguro_ativo` com o Redis de fila fora | 1 | 1 |

A execução anterior, com a mesma calibração e o p95 da conta com cookie ainda sem limite, também passou, mas com mais
503 do semáforo (725, 621 e 689) e a A com cookie mais lenta com o Redis fora (até entrar p95 1,26 s, máx. 7,4 s). O
número de 503 varia entre execuções; o limite de p95 da conta com cookie é o que pega a regressão da passagem pelo
cookie.

**`npm run carga:login:controle-negativo`: saída 0, o cenário reprovou pela proteção** (início 18:10 UTC, 9 min). Com
`LOGIN_PROTECAO_DESLIGADA=true`, a base ficou de pé (login da B e da C 53 e 58 ms, autenticadas 4 ms), e os dois ataques
cruzaram: p95 do login da B, da C, da A com cookie e da equipe com cookie entre 2,15 e 2,19 s; erro final na B, na C, na
A com e sem cookie e na equipe sem cookie; do 1º envio até entrar, p95 de 17 a 25 s; 503 do semáforo 2.721 e 2.764.

**16.4, o que o cenário mostrou:**
- **Alerta de 5xx às 7h30:** a rajada não gerou nenhum 503 do semáforo, e o alerta "Taxa de erro 5xx" não dispara na
  entrada. A regra fica como está. Sob ataque, o 503 do login vai de 1% a 22% por minuto na rota, conforme a execução, e o alerta só dispara
  se o ataque durar mais de 5 min, o que merece o aviso. O runbook (causa 4 do alerta) registra isso.
- **Inundação de IPs:** medido com o semáforo compilado nesta máquina, 10.000 IPs distintos esperando no balde da
  equipe custam em média 252 µs por vez concedida (1.000 IPs: 29 µs), porque a vez percorre as subfilas do balde.
  Com ~31 hashes/s por instância, isso dá menos de 1% de um núcleo, e só com a fila no teto. Não muda nada agora. Com
  a fila cheia, o despejo (16.5) custa 8,5 µs por pedido, porque percorre só os baldes.
- **Aceite de convite:** o hash do aceite fica fora do semáforo. Ele só roda com um token de convite válido, de uso
  único, e só quando a conta ainda não tem senha. Um script não consegue gerar esses hashes em volume, e o aceite não
  entra na rajada das 7h30.

**16.5 no cenário, divergência registrada:** a tarefa pede que a fase de ataque confira que nenhuma conta legítima
recebe 503 de despejo. O cenário não prova isso. Com o ataque de 3.000/min, a fila do semáforo não chega perto das
10.000 esperas, e o despejo não acontece. O k6 também não distingue o 503 de despejo do 503 de prazo. A prova do
despejo fica só no teste de unidade do semáforo. No cenário, nenhuma conta legítima terminou em erro.

**Calibração (16.3):** está na Tech Spec, seção 5, "Calibração". `t=12` (30 ms por hash na CPU de referência) passa.
`t=20` já reprova o ataque de dentro, e `t=36` reprova a rajada. O hash fica abaixo da faixa de 100–250 ms da Tech Spec
e de `docs/infra.md`, com o motivo registrado lá: com 1 CPU por instância, o hash mais caro não sustenta o RF21 com
ataque de dentro. O teto do `LOGIN_HASH_CONCORRENCIA` ficou em `UV_THREADPOOL_SIZE − 8`, como a 14.0 fixou, e não em
`− 2`, como dizia o texto desta tarefa.

O que o resultado não cobre: a CPU do staging, que recalibra pelo mesmo cenário (D31, D42). Também não cobre rede real
nem máquina de escola.

## Fora do escopo desta tarefa

- Login pela conta Google ou Microsoft na rajada: fica fora, porque depende de provedor externo. A 13.0 prova o comportamento com o `oidc-falso`.
- Cenário completo "manhã de segunda", com tutor e prova: F16.
- Carga contra o staging: quando o staging existir (D31).
- Rodar este cenário na esteira a cada commit: ele é manual, como o do F0, e roda de novo quando uma tarefa mexe no login.
- Mudar o semáforo, o rebaixamento ou a renovação: se o cenário reprovar por defeito deles, a correção volta para a 14.0, a 15.0 ou a 5.0, com a divergência reportada.

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-19 14:45:14 | 2026-09-19 14:47:35 | `test-engineer` | 1 | APROVADO | a5e66d9b296133895 |
| 2026-09-19 14:47:56 | 2026-09-19 14:49:39 | `infra-guardian` | 1 | REPROVADO | ad0f2d16001a293f8 |
| 2026-09-19 14:47:49 | 2026-09-19 14:49:59 | `revisor-geral` | 1 | REPROVADO | a6a30381ace8e4e33 |
| 2026-09-19 16:16:11 | 2026-09-19 16:16:34 | `test-engineer` | 2 | APROVADO | a8b287d68457a0368 |
| 2026-09-19 16:16:58 | 2026-09-19 16:17:21 | `infra-guardian` | 2 | APROVADO | aa3f2b14d3fbe950f |
| 2026-09-19 16:16:47 | 2026-09-19 16:17:49 | `revisor-geral` | 2 | REPROVADO | a92f05374bfff961e |
| 2026-09-19 16:45:35 | 2026-09-19 16:45:43 | `revisor-geral` | 3 | APROVADO | aff98ac88267e1e92 |
