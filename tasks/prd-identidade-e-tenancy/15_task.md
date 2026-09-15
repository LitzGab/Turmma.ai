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

- [ ] 15.1 — Rebaixamento por IP×escola na matrícula.
  - **Contagem:** falhas por minuto por `(ip, escola_id)` no Redis de fila, com TTL. O limiar é `max(100, 25% dos alunos ativos da escola)`, lido com cache curto por escola.
  - **Acima do limiar:** as tentativas desse IP para essa escola entram no fim do balde da escola, sem recusa, e `login.prioridade_rebaixada{escola_id}` fica em 1.
  - **Passagem:** tentativa com `educa_dispositivo` válido para aquela matrícula (HMAC com a versão de chave atual e entrada dentro de 30 dias) mantém a prioridade.
  - **Cookie:** entrada com chave antiga é ignorada. A 51ª entrada tira a mais antiga. Nada é gravado em login que falhou.
- [ ] 15.2 — Limite por IP em `/v1/sessao/email`.
  - **Limite:** `LIMITE_LOGIN_EMAIL_IP_MIN`, padrão 60, obrigatório no ambiente.
  - **Rede municipal:** IP presente em `rede.ips_saida` recebe o limite vezes o número de escolas da rede. A leitura acontece antes de haver escola, então é um método novo do `ResolucaoDeTenantRepository` ("rede por IP de saída", devolve só o número de escolas). A linha já está na tabela de `@SemEscopo` da Tech Spec seção 6 (quinze métodos).
  - **Acima do limite:** as tentativas desse IP vão para o fim do balde "equipe". Quem traz a conta no `educa_dispositivo` mantém a vez. Nada é recusado.
  - **Métrica:** `login.limite_email_ip` conta as tentativas rebaixadas.
- [ ] 15.3 — Seguro, métricas e alertas.
  - **Seguro:** com o Redis de fila fora, contadores de tentativa, de IP e de rebaixamento passam para memória em cada instância, com a mesma regra. O limite por IP e o limiar da escola são divididos pelo número de instâncias (`limiteDoSeguro`), e `limite.seguro_ativo` fica em 1.
  - **Métrica:** `login.falhas{escola_id}`.
  - **`login-rebaixado-por-escola`:** métrica em 1 por 2 min.
  - **`login-email-limite-ip`:** mais de 20 tentativas rebaixadas por min por 5 min.
  - **Runbook:** entrada em `docs/runbook.md` para cada um (o que olhar: IP e escola na métrica, se é dentro ou fora da rede da escola; o que fazer: avisar a escola, cadastrar `ips_saida` quando é rede, nunca bloquear o IP da escola).
  - **Ensaio:** `ensaio:alertas` provoca os dois.
- [ ] 15.4 — Testes (tabela abaixo).

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

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->
