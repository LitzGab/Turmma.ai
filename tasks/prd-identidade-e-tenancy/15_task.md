# Tarefa 15.0 — Ataque de senha nunca bloqueia a escola

**Funcionalidade:** identidade-e-tenancy · **Depende de:** 14.0
**Subagentes obrigatórios:** `infra-guardian`, `privacy-guardian`, `tenancy-guardian`, `test-engineer`

## Objetivo

Um script testando matrículas ou e-mails, de fora ou de dentro da rede da escola, perde
prioridade no semáforo em vez de bloquear o IP. Os 400 alunos atrás do mesmo NAT continuam
entrando, e quem já entrou naquele navegador mantém a vez. Ao terminar, rebaixamento por
IP×escola, limite por IP na rota de e-mail (com multiplicador para rede municipal), seguro com o
Redis de fila fora, métricas e dois alertas com runbook funcionam.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF11 e RF21; casos de borda "35 logins do mesmo IP" e "Chromebook do carrinho"
- `techspec.md`:
  - seção 3: `rede.ips_saida`;
  - seção 5, "Baldes do semáforo": e-mail com limite por IP e multiplicador de rede; rajada de falhas na matrícula; passagem pelo cookie `educa_dispositivo`; onde fica; Redis de fila fora;
  - seção 5, "Tentativas": contador `conhecido`/`outro`;
  - seção 7c: métricas `login.falhas`, `login.prioridade_rebaixada`, `login.limite_email_ip`, alertas `login-rebaixado-por-escola` e `login-email-limite-ip`, Redis de fila cai;
  - seção 13: ataque de dentro da rede e ataque distribuído ao balde "equipe".
- `docs/infra.md` seção 5.1: nunca bloquear o IP da escola
- `.claude/rules/80-infra-e-carga.md`, itens 1, 3, 5 e 10: rate limit nunca só por IP; estado
  compartilhado fora da instância; métrica e runbook
- `.claude/rules/20-lgpd-menores.md`: o cookie de dispositivo não identifica ninguém no servidor
  e não tem outro uso; IP só em contador com TTL
- `.claude/rules/10-multitenancy.md`: o limiar e a métrica são por escola, e ataque em A não
  muda nada em B
- `docs/lgpd.md` seção 2: linhas "Contador de tentativas" e "Cookie de dispositivo"
- Código existente:
  - `packages/nucleo/src/limite/limitador.ts`: `SeguroEmMemoria` e a divisão `limiteDoSeguro`;
  - `packages/nucleo/src/limite/chaves.ts` e `proxies-confiaveis.ts`: IP do cliente só confiado da borda;
  - `packages/nucleo/src/redis/clientes.ts`: cliente do Redis de fila;
  - `packages/nucleo/src/telemetria/metricas.ts`: `limite.seguro_ativo`;
  - `infra/grafana/alertas/seguro-limite-ativo.yaml`: o alerta do F0 que continua valendo;
  - `docs/runbook.md`.
- O que as tarefas anteriores criam:
  - semáforo com baldes e rodízio (criado na 14.0);
  - contador de tentativas no Redis de fila e cookie `educa_dispositivo` (criados na 4.0);
  - contador com escola na matrícula (criado na 11.0);
  - `rede` com `ips_saida` (criada na 1.0).

## Subtarefas

- [x] 15.1 — Rebaixamento por IP×escola na matrícula.
  - **Contagem:** falhas por minuto por `(ip, escola_id)` no Redis de fila, com TTL. O limiar é `max(100, 25% dos alunos ativos da escola)`, lido com cache curto por escola.
  - **Acima do limiar:** as tentativas desse IP para essa escola entram no fim do balde da escola, sem recusa, e `login.prioridade_rebaixada{escola_id}` fica em 1.
  - **Passagem:** tentativa com `educa_dispositivo` válido para aquela matrícula (HMAC com a versão de chave atual e entrada dentro de 30 dias) mantém a prioridade.
  - **Cookie:** entrada com chave antiga é ignorada. A 51ª entrada tira a mais antiga. Nada é gravado em login que falhou.
- [x] 15.2 — Limite por IP em `/v1/sessao/email`.
  - **Limite:** `LIMITE_LOGIN_EMAIL_IP_MIN`, padrão 60, obrigatório no ambiente.
  - **Rede municipal:** IP presente em `rede.ips_saida` recebe o limite vezes o número de escolas da rede. A leitura acontece antes de haver escola, então é um método novo do `ResolucaoDeTenantRepository` ("rede por IP de saída", devolve só o número de escolas). A linha já está na tabela de `@SemEscopo` da Tech Spec seção 6 (quinze métodos).
  - **Acima do limite:** as tentativas desse IP vão para o fim do balde "equipe". Quem traz a conta no `educa_dispositivo` mantém a vez. Nada é recusado.
  - **Métrica:** `login.limite_email_ip` conta as tentativas rebaixadas.
- [x] 15.3 — Seguro, métricas e alertas.
  - **Seguro:** com o Redis de fila fora, contadores de tentativa, de IP e de rebaixamento passam para memória em cada instância, com a mesma regra. O limite por IP e o limiar da escola são divididos pelo número de instâncias (`limiteDoSeguro`), e `limite.seguro_ativo` fica em 1.
  - **Métrica:** `login.falhas{escola_id}`, contando também a matrícula (a 11.2 pedia essa métrica, e ela ficou para cá, ratificado em 18/09/2026: nasce aqui, e é a 14.2 que libera `escola_id` em métrica de login). Atualizar o comentário de `login.conta_segurada` em `packages/nucleo/src/telemetria/metricas.ts`, que ainda diz que a conta é global.
  - **Runbook:** o contador comum dos slugs inexistentes (11.0) cresce com varredura de endereço; dizer o que olhar e que ele não segura escola nenhuma.
  - **`login-rebaixado-por-escola`:** métrica em 1 por 2 min.
  - **`login-email-limite-ip`:** mais de 20 tentativas rebaixadas por min por 5 min.
  - **Runbook:** entrada em `docs/runbook.md` para cada um (o que olhar: IP e escola na métrica, se é dentro ou fora da rede da escola; o que fazer: avisar a escola, cadastrar `ips_saida` quando é rede, nunca bloquear o IP da escola).
  - **Ensaio:** `ensaio:alertas` provoca os dois.
- [x] 15.4 — Testes (tabela abaixo).
- [x] 15.6 — Pontos que a 14.0 deixou para cá (decidido em 18/09/2026).
  - **Antes de mexer no login:** extrair o bloco repetido três vezes (reserva no contador, leitura da credencial e hash, dentro da vez do semáforo) numa função só; esta tarefa mexe exatamente nesse trecho, e três cópias divergem.
  - **Runbook:** espera alta em todos os baldes com a CPU da API baixa aponta para Postgres ou Redis lentos, e não para capacidade de hash: dizer o que olhar.
  - **IP em memória:** registrar em `docs/lgpd.md` que o IP é usado só em memória (vez do login por e-mail no semáforo e limites desta tarefa), e dar prazo às entradas de IP guardadas no semáforo, para elas não crescerem sem fim sob inundação.
- [x] 15.5 — Redis de fila travado no login (decidido em 18/09/2026, das revisões da correção `2026-09-18-contador-testado-com-o-prazo-de-producao`).
  - **Desafio recusado sem rastro:** o `catch` de `ConsumoDeDesafio.consumir` (`apps/api/src/sessao/desafio.ts`) recusa com 401 quando o Redis de fila não responde em 100 ms, sem log nem métrica: o coordenador com MFA cai para o login e ninguém vê a causa. Emitir, com espaçamento e só com ids, um aviso (ex.: `login.desafio_sem_redis`) e somá-lo ao sinal de seguro ativo, com a linha no runbook.
  - **Redis travado sem teste:** o ramo `catch` de `ContadorDeTentativas.reservar` (conectado, sem responder: cai no seguro e pode contar em dobro, para o lado de segurar) e o do desafio não têm teste. Provar os dois com `CLIENT PAUSE`, como em `uso.int.test.ts`.
  - **Prazo do cliente de login nos testes que sobem a API inteira:** `login-email`, `mfa`, `convite`, uso e limite usam o cliente de 100 ms pela montagem de produção, e no runner carregado uma resposta lenta vira reserva no seguro ou desafio recusado (vermelho falso). Dar ao teste um prazo maior por **opção de montagem** (`AppModule.com(config, { ... })`), que o `main.ts` não passa, e nunca por variável de ambiente que a produção leia. Os testes que provam o corte (`limite.int.test.ts`, "Redis fora" do desafio) continuam com os 100 ms fixados.
  - **`docs/infra.md`:** registrar que o contador e o desafio dividem o Redis de fila com o BullMQ, e que um `addBulk` grande ou script de fila longo às 7h30 é o que faria os 100 ms cortarem — reforça lote fora do horário letivo.

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sessao/senha/rebaixamento.ts`, `limite-email-ip.ts`, `cookie-dispositivo.ts` | novo ou alterado |
| `apps/api/src/sessao/senha/baldes-de-login.ts`, `semaforo-de-hash.ts` | alterado |
| `apps/api/src/sessao/resolucao-de-tenant.repository.ts`, `tasks/prd-identidade-e-tenancy/techspec.md` seção 6 | alterado |
| `apps/api/src/config.ts`, `.env.example` | alterado |
| `packages/nucleo/src/telemetria/metricas.ts` | alterado |
| `infra/grafana/alertas/login-rebaixado-por-escola.yaml`, `login-email-limite-ip.yaml` | novo |
| `docs/runbook.md`, `infra/scripts/ensaio-alertas.ts` | alterado |
| `apps/api/src/sessao/senha/cookie-dispositivo.test.ts`, `apps/api/test/ataque-de-senha.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz sob ataque: um IP passa o limiar em A com matrículas diferentes; `login.prioridade_rebaixada` fica em 1 só para A, e nenhum pedido desse IP recebe 429 | integração | rebaixa, não bloqueia (regra 80, item 1) |
| borda: aluno legítimo de A, no mesmo IP do ataque, com `educa_dispositivo` válido, é atendido antes das tentativas rebaixadas | integração | passagem pelo cookie |
| isolamento: com A rebaixada, os logins de B pelo mesmo IP seguem com prioridade normal, e a métrica de B fica em 0 | isolamento | quebra se o contador não levar `escola_id` |
| borda: onda legítima de 30% de senha errada uma vez numa escola de 400 alunos não passa do limiar; a métrica fica em 0 | integração | primeiros dias de aula não viram falso ataque |
| borda: IP em `rede.ips_saida` de uma rede com três escolas tem limite de 180/min no e-mail; acima disso rebaixa e não recusa | integração | rede municipal atrás de um IP |
| borda: script errando a senha de um professor em outro navegador segura só o contador `outro`; o professor com o próprio `educa_dispositivo` entra | integração | aluno com script não tranca a equipe |
| falha: Redis de fila parado; conta segurada continua segurada, o rebaixamento segue em memória com o limiar dividido pelas instâncias, e `limite.seguro_ativo` fica em 1 | integração | seguro sem abrir a porta |
| cookie: entrada com chave antiga é ignorada; a 51ª tira a mais antiga; entrada de 31 dias sai; login que falhou não grava | unidade | validade e rotação |
| privacidade: o cookie não contém matrícula nem e-mail em texto, e nenhuma tabela nem log recebe o valor dele | integração | nenhum outro uso |
| alertas: série sintética leva cada regra a disparar e voltar, e a guarda reprova regra sem runbook | infra | alerta com o que fazer |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] `npm run typecheck` limpo
- [ ] `npm run test:infra` verde (a tarefa mexe em alertas, D52)
- [ ] E2E verde (se tocou tela)
- [ ] Todos os revisores obrigatórios com rodada na seção "Revisões", iniciada depois da
  última alteração de código, e APROVADO nos que têm veto
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- Cenário de carga com o ataque de fora e de dentro da rede: 16.0
- Tela de cadastro de `ips_saida` da rede: F14 (no F1, só por comando ou seed)
- Mensagem "entrando…" na web durante o atraso: 18.0

## Notas da implementação

**Arquivos.** Os previstos, com estes desvios:
- O bloco repetido da 15.6 virou `apps/api/src/sessao/senha/conferencia-na-vez.ts` (`ConferenciaNaVez`): reserva, leitura
  da credencial e hash dentro da vez, e a resposta de falha (`login.falhas`, `login.conta_segurada`, o `aoFalhar`).
  O e-mail, a matrícula e o endereço que não existe usam a mesma função.
- Os contadores por IP estão em `senha/contador-em-janela.ts` (Redis de fila, janela de 1 min, seguro em memória). O
  tamanho da escola vem de `alunos-ativos.repository.ts`, com escopo. O `cookie-dispositivo.ts` não precisou mudar: a
  chave antiga, a 51ª entrada e os 30 dias já estavam lá (4.0), e o teste de unidade dele já cobre os três.
- `LIMITE_LOGIN_EMAIL_IP_MIN` entrou em `configuracao-de-login.ts`, como as outras variáveis do login, e não em `config.ts`.
- `SeguroDoLogin` (`sessao/seguro-do-login.ts`) junta o contador, os contadores por IP e o desafio numa fonte só do
  `limite.seguro_ativo`, e o `main.ts` passa a observar ela.
- 15.5: o prazo do cliente de login nos testes é a opção `prazoDoRedisDeLoginMs` de `AppModule.com` (`MONTAGEM_DE_TESTE`,
  2 s), passada em `api-com-sessao.ts`, `login-email`, `mfa`, `convite`, `troca-de-escola` e `uso`. O `CLIENT PAUSE`
  está em `tools/testes/redis-travado.ts`.

**Escolhas (registradas aqui pela lição 9; nenhuma muda o que a coordenação vê).**
1. **Contradição da tarefa sobre o `limite.int.test.ts`.** A 15.5 põe o `limite` entre os testes que devem ganhar o prazo
   maior e, na mesma frase, entre os que provam o corte. Ficou sem a opção: ele prova o corte do Redis de cache, e o
   cliente de login não entra no que ele mede. O `uso` ganhou a opção. O teste "Redis fora" do `login-email` também fica
   com a montagem de produção (Redis parado não depende de prazo).
2. **Falha que conta para o rebaixamento** é toda resposta de falha na escola: senha errada, matrícula que não existe,
   aluno desativado e conta segurada (429). O 503 do semáforo não conta: é atraso, e contá-lo rebaixaria a rajada
   legítima das 7h30 (a web repete no 503).
3. **O limite por IP do e-mail conta toda tentativa na entrada**, antes da vez, como um limite de requisições, inclusive
   a de quem traz o cookie (que nunca é rebaixada). A rede só é consultada quando o IP passa do limite simples.
4. **A conta que o Redis segurou é copiada para o seguro da instância** (15.3, "conta segurada continua segurada"): sem
   isso, o Redis caindo no meio de um ataque zeraria a espera das contas seguradas em memória.
5. **O endereço que não existe não conta falha por IP**: o balde dele só tem quem erra o endereço, e o limiar por
   escola não se aplica. As falhas dele contam em `login.falhas{escola_id="desconhecida"}`. Ele só é rebaixado pelo
   limite por IP das rotas de login (escolha 8).
6. **`login.prioridade_rebaixada`** é gauge por instância: 1 se ela rebaixou tentativa daquela escola no último minuto, 0
   até 10 min depois, e então a série some. O alerta usa `max by (escola_id)`.
7. **Ensaio.** A rajada de matrícula do ensaio passou do endereço que não existe para o de uma escola sintética (é o que
   leva a escola ao rebaixamento), e o ensaio ganhou a rajada de e-mail, com pausa entre os pedidos para não tirar do
   balde da escola a vez que as falhas dela precisam.
8. **Limite anônimo por IP nas rotas de login** (veto do `infra-guardian`, 1ª rodada): o `@RotaAnonima()` das duas rotas
   de login respondia 429 `LIMITE_EXCEDIDO` acima de `LIMITE_REQ_IP_ANONIMO_MIN` por IP, o que bloquearia a escola
   inteira atrás do NAT sob um script de alto volume, e o cenário da 16.0 passa desse teto. Agora elas levam
   `@LimiteQueRebaixa()`: contam num balde próprio (`rl:ip-login`, mesmo teto) e, acima dele, a guarda só marca a
   requisição, que o login rebaixa (com a passagem pelo cookie). O balde próprio mantém a página de acesso e as outras
   rotas anônimas do IP respondendo. Com a fila do semáforo cheia, o pedido não rebaixado despeja o rebaixado mais
   antigo. Registrado na Tech Spec, seção 5. As outras rotas anônimas (MFA, convite, renovação, conta externa, acesso)
   seguem com o limite do F0: nenhuma delas é o alvo de uma varredura de senha, e o MFA tem contador por conta.
9. **IPv6 por endereço inteiro**, e não por /64: risco aceito no F1, na Tech Spec, seção 13.

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-18 17:23:32 | 2026-09-18 17:27:00 | `test-engineer` | 1 | REPROVADO | ae55f4c1f622e348d |
| 2026-09-18 17:34:42 | 2026-09-18 17:35:34 | `test-engineer` | 2 | APROVADO | aa3c4c71503152a20 |
| 2026-09-18 17:55:50 | 2026-09-18 17:56:23 | `tenancy-guardian` | 1 | APROVADO | ac118fd15424d8638 |
| 2026-09-18 17:55:39 | 2026-09-18 17:56:27 | `privacy-guardian` | 1 | APROVADO | a3c9598ca3392a4b5 |
| 2026-09-18 17:55:29 | 2026-09-18 17:57:59 | `infra-guardian` | 1 | REPROVADO | a1fa62f201611b46f |
| 2026-09-18 17:55:18 | 2026-09-18 18:03:03 | `revisor-geral` | 1 | REPROVADO | ae2b640d5056e44c3 |
| 2026-09-18 18:08:49 | 2026-09-18 18:10:30 | `test-engineer` | 3 | REPROVADO | aa4d64118c66b55b6 |
| 2026-09-18 18:22:03 | 2026-09-18 18:22:30 | `test-engineer` | 4 | APROVADO | a4b0dd87406425532 |
| 2026-09-18 18:32:01 | 2026-09-18 18:32:11 | `test-engineer` | 5 | APROVADO | ae2c42e4029daabd3 |
| 2026-09-19 11:38:12 | 2026-09-19 11:38:52 | `tenancy-guardian` | 2 | APROVADO | a4c9553b52244b925 |
| 2026-09-19 11:38:03 | 2026-09-19 11:38:55 | `revisor-geral` | 2 | APROVADO | a0670aaf9b01450fe |
| 2026-09-19 11:38:08 | 2026-09-19 11:39:00 | `privacy-guardian` | 2 | APROVADO | a67a93f60789a0a35 |
| 2026-09-19 11:37:55 | 2026-09-19 11:39:09 | `infra-guardian` | 2 | APROVADO | a48a188e15b97c833 |
