# Runbook

> O que fazer quando um alerta dispara. Quem opera é uma pessoa só (D26), então cada
> entrada precisa ser seguível às 7h40 de uma segunda, sem pensar muito.
>
> **Regra:** alerta novo entra em produção junto com a sua entrada aqui (regra 80, item 10).
> Alerta sem entrada é alerta que ninguém sabe tratar.

Os alertas nascem no F0, locais: as regras ficam em `infra/grafana/alertas/`, disparam no Grafana
da observabilidade local (`http://127.0.0.1:53300`, pasta "Educa.ia alertas") e ainda não chegam
ao celular, o que fica para o staging (D31). Cada arquivo de regra tem aqui a entrada com o mesmo
nome, e o teste `tools/guardas/alerta-tem-runbook.test.ts` reprova a regra que entrar sem ela.
As entradas marcadas *a preencher* são o esqueleto dos alertas previstos em `docs/infra.md`
seção 7, para serem escritas quando cada um for criado.

---

## Formato de cada entrada

```
## <nome do alerta>

Dispara quando: <condição exata e limiar>
Impacto: <quem sente, e o que vê>
Primeiro olhar: <painel ou comando>
Causas prováveis:
  1. <causa> → <o que fazer>
  2. <causa> → <o que fazer>
Se nada disso resolver: <como degradar ou avisar as escolas>
Depois: <o que registrar, e se vira tarefa>
```

---

## Job interativo esperando

**Dispara quando:** o job interativo mais antigo de uma escola espera mais de 30 s, por 1 min
seguido (`max by (fila, escola_id) (job_espera_mais_antiga_s{fila="interativa"}) > 30`, regra
`infra/grafana/alertas/job-interativo-esperando.yaml`). Na prática, um job parado há mais de uns
90 s. O alerta traz o `escola_id`. Uma queda curta do Redis de fila deixa o job até ~30 s a mais
esperando depois que ele volta (a reserva vence e o despachante publica de novo): isso deixa a
regra pendente, e só dispara se a espera continuar acima de 30 s pelo minuto inteiro.

**Impacto:** professora ou aluno daquela escola pediu uma ferramenta e ela não começou. Várias
escolas disparando juntas é o sistema; uma só é algo daquela escola.

**Primeiro olhar:** painel "Fundação — rota, fila e escola", linha "Filas": "Espera do job mais
antigo", "Vagas em uso", "Jobs que chegaram sem vaga" e "Jobs em stalled", na escola do alerta.
Depois `docker compose ps worker-interativo-1 worker-interativo-2 despachante-1 despachante-2 redis-fila`
e `docker compose logs --since 10m worker-interativo-1 worker-interativo-2 despachante-1`.

**Causas prováveis:**
1. Worker interativo parado ou reiniciando em laço (sem `healthy` no `ps`) →
   `docker compose up -d worker-interativo-1 worker-interativo-2`. Se volta a cair, o log dele diz
   por quê (`worker.redis_indisponivel`, `worker.fila_com_erro`). O job não se perde: está em
   `job_registro` e começa quando o worker volta.
2. Só esta escola, com "Vagas em uso" no teto dela (`VAGAS_ESCOLA_INTERATIVA`, ou as vagas da
   escola em `configuracao_operacional_escola`) → a escola espera pelos próprios jobs longos, e as
   outras não sentem. Com "Jobs em stalled" subindo, um job travou: siga o `jobId` no log do worker.
   Um job que rodou de novo aparece com mais de um `job.iniciado` do mesmo `jobId` (a `tentativa`
   sobe na retentativa e se repete no stalled); é esperado, porque a entrega é pelo menos uma vez (D49).
   Aumentar as vagas da escola é decisão, não correção de madrugada: registre.
3. Redis de fila fora (`redis_disponivel{instancia="fila"}` em 0, `despachante.vaga_indisponivel`
   no log) → `docker compose up -d redis-fila`. Com ele de volta, o despachante publica o que ficou
   em até ~30 s, e a reconciliação republica o que sumiu do BullMQ em até ~2 min.
4. Os dois despachantes parados → `docker compose up -d despachante-1 despachante-2`. Sem
   despachante, ninguém mede a espera: o último valor fica congelado no Prometheus por até 5 min,
   e depois a série some e a regra volta a normal **sem o job ter começado**. Confira no painel
   que a espera zerou, e não só sumiu.

**Se nada disso resolver:** reinicie um worker por vez (`docker compose restart worker-interativo-1`,
depois o 2), que espera os jobs em andamento por até 30 s e não perde nenhum. Continuando, avise a
coordenação da escola afetada (seção "Como avisar as escolas") de que as ferramentas estão lentas.

**Depois:** registre no `TODO.md` a escola (id), o horário, a causa e quanto o job esperou, pelo
`jobId` em `job_registro` (só ids). Causa nova vira tarefa com teste que a reproduz.

## Seguro de limite ativo

**Dispara quando:** numa instância da API, por 2 min seguidos, metade ou mais das requisições
limitadas nos últimos 30 s foram contadas pelo seguro em memória (`limite_seguro_ativo >= 0,5`),
ou o Redis de cache não está pronto para ela (`redis_disponivel{instancia="cache"} == 0`), com ou
sem tráfego. Regra `infra/grafana/alertas/seguro-limite-ativo.yaml`; o alerta traz a `instance`.

**Impacto:** ninguém vê erro. O rate limit passa a ser de cada instância, com o limite dividido
por `LIMITE_INSTANCIAS_API`: a proteção contra abuso fica mais frouxa entre instâncias, e um
usuário que cai sempre na mesma recebe 429 mais cedo. Nada é liberado sem limite.

**Primeiro olhar:** painel, linha "Processos": "Redis disponível" e "Seguro de limite ativo".
`docker compose ps redis-cache` e `docker compose logs --since 10m api-1 api-2`, procurando
`limite.seguro_ativado` e `limite.redis_indisponivel`.

**Causas prováveis:**
1. Redis de cache parado ou reiniciando → `docker compose up -d redis-cache`. Ele não tem
   persistência e volta vazio: as janelas de limite recomeçam, e isso é esperado.
2. Redis de cache no ar, mas lento: proporção entre 0,5 e 1 com "Redis disponível" em 1, porque o
   comando passa dos 100 ms → `docker compose exec redis-cache redis-cli --latency` e
   `redis-cli info memory`. Memória no teto, expulsando chave sem parar, pede mais
   `REDIS_CACHE_MEMORIA_MAXIMA`.
3. Só uma instância dispara → o cliente daquela instância não reconecta:
   `docker compose restart api-1` (ela drena e a borda manda o tráfego para a outra).
4. Redis de cache no ar, e o log traz `login.contador_no_seguro`, `login.limite_por_ip_no_seguro`,
   `login.desafio_sem_redis` ou `login.redis_indisponivel` → quem está no seguro é o login, que guarda no Redis de fila
   o contador de tentativas, os contadores por IP (rebaixamento da escola e limite da rota de e-mail) e a marca do
   desafio (a métrica vale o maior de todos). Com ele fora, a senha errada segura a conta em cada instância, e não no
   sistema inteiro: um ataque espalhado pelas duas instâncias tem o dobro de tentativas; o limiar do rebaixamento e o
   limite por IP ficam divididos pelas instâncias. A conta que o Redis já tinha segurado continua segurada na instância
   que a viu. Ninguém é barrado por isso. `login.desafio_sem_redis` é outra coisa: o coordenador com MFA, ou quem tem
   mais de uma escola, volta ao login depois da senha, porque sem a marca o desafio não vale; com o Redis no ar e esse
   aviso, é o Redis de fila travado (resposta acima de 100 ms): `docker compose exec redis-fila redis-cli --latency`.
   `docker compose ps redis-fila`; parado, `docker compose up -d redis-fila`. Ele é o Redis da fila de jobs também:
   veja se "Job interativo esperando" disparou junto. O corte de 100 ms vale em produção e no **staging**
   (`LOGIN_REDIS_PRAZO_MS`, que a API recusa acima disso nesses ambientes); na máquina de desenvolvimento são 2 s
   (`docs/infra.md` 5.2). No staging, num host fraco, o sintoma é este aviso com 401 em `POST /v1/sessao/escola` ou
   `/v1/sessao/mfa` e o Redis sadio — é a máquina, não o Redis. Na máquina de desenvolvimento, com o `redis-fila`
   pausado, o sintoma é outro: o login fica **lento** antes da mesma mensagem de sessão inválida, porque são seis a dez
   idas sequenciais ao Redis esperando 2 s cada. No cenário de carga local (`npm run carga:login`) o corte volta a ser
   o de produção, de propósito (`infra/carga.env`): 401 no login lá é o cenário medindo o que deve medir. E se o aviso
   aparece em **todo** login, confira `LOGIN_REDIS_PRAZO_MS` antes de procurar o Redis: um prazo mal posto, perto do
   piso, dá exatamente esse sintoma com o Redis sadio.

**Se nada disso resolver:** não há o que degradar: a API segue atendendo com o seguro. Mantenha o
Redis de cache como prioridade do dia, porque com ele fora um aluno com script em laço gasta mais
antes de ser contido.

**Depois:** registre a duração e a causa no `TODO.md`. Queda por memória vira tarefa para rever
`REDIS_CACHE_MEMORIA_MAXIMA` e o volume de chaves.

## Taxa de erro 5xx

**Dispara quando:** mais de 5% das requisições de uma rota, pela rota template e somando as
instâncias do processo, respondem 5xx no último minuto, por 5 min seguidos. Rota sem requisição
no minuto não conta. Regra `infra/grafana/alertas/taxa-5xx.yaml`; o alerta traz `job` e
`http_route`. O 502 da borda (nenhuma instância respondeu) não passa pela API e não aparece aqui:
é o alerta "Sistema fora do ar", do staging.

**Impacto:** quem usa a rota vê "não foi possível concluir agora" ou "o sistema está indisponível
no momento". Com `/saude` no alerta, o Postgres está fora e tudo que lê ou grava falha.

**Primeiro olhar:** painel, linha "HTTP": "Taxa de erro 5xx por rota" e "Requisições por rota e
status", para ver se é uma rota ou todas, e se é 500 ou 503. Log:
`docker compose logs --since 10m api-1 api-2`, procurando `http.erro`, que traz `status`,
`codigo` e `requisicaoId`, nunca a mensagem nem dado.

**Causas prováveis:**
1. 503 em várias rotas, com `/saude` junto → Postgres fora ou sem conexão
   (`docker compose ps postgres`, "Pool do banco em uso" no teto) → `docker compose up -d postgres`.
   Pool no teto com o Postgres no ar é consulta lenta: procure `TEMPO_ESGOTADO` no log.
2. 500 (`ERRO_INTERNO`) numa rota só, começando depois de um commit → defeito de código: siga o
   `requisicaoId` no log até o resumo do erro. No horário letivo, volte ao commit anterior antes
   de investigar.
3. 503 numa instância só → ela está drenando ou travada: `docker compose restart api-1`.
4. 503 só em `/v1/sessao/matricula` ou `/v1/sessao/email` → é o semáforo do hash recusando quem esperou mais de 2 s,
   e o "Login recusado pelo semáforo do hash" dispara junto: siga aquela entrada. A rajada das 7h30 não gera esse
   503: no cenário de login (16.0) ela teve zero. Ele aparece sob ataque de senha (de 1% a 22% das tentativas por
   minuto na rota, no cenário) e só dispara este alerta se o ataque durar mais de 5 min, o que vale o aviso.

**Se nada disso resolver:** com a rota de prova, de login ou de ferramenta falhando no horário
letivo, avise as escolas (seção "Como avisar as escolas") e anote o horário de início, que decide
se um prazo de prova precisa ser estendido.

**Depois:** todo 500 vira tarefa, com o `requisicaoId` e um teste que reproduz. 503 por Postgres
fora entra no `TODO.md` com duração e causa.

## Reuso de refresh

**Dispara quando:** mais de 5 renovações de sessão, somadas as instâncias da API, terminam em reuso nos
últimos 10 min (`sessao_renovacao_total{resultado="reuso"}`, o máximo menos o mínimo da janela; a instância que
reiniciou na janela entra só com os reusos desde o reinício; regra `infra/grafana/alertas/reuso-de-refresh.yaml`,
sem `for:`). Reuso é o cookie `educa_sessao` anterior voltando
depois de o token novo já ter sido usado e de passada a janela de 30 s: alguém guardou um cookie velho. Cada
reuso já encerrou a família de sessões dele (motivo `reuso_de_refresh`) e gravou a auditoria
`sessao.reuso_de_refresh`. O alerta não traz escola nem pessoa: a métrica não leva nenhuma das duas.

**Impacto:** a pessoa de cada família encerrada volta para a tela de entrada no meio do que fazia, e entra de
novo. Se é ataque, quem guardou o cookie perdeu o acesso na hora; se é bug de cliente, gente legítima está sendo
deslogada sem motivo.

**Primeiro olhar:** painel, linha "Processos": "Renovações de sessão por resultado", para ver se o reuso vem
sozinho ou junto de `ja_renovado` e `resposta_perdida`. Depois as famílias afetadas, só por ids:

```sql
select escola_id, entidade_id as sessao_id, depois->>'familia' as familia, depois->>'sessoesEncerradas' as encerradas, em
from auditoria where acao = 'sessao.reuso_de_refresh' and em > now() - interval '30 minutes' order by em;
```

e, para uma família, `select escola_id, usuario_id, metodo, rotacionado_em, encerrada_em from sessao where
familia = '<familia>'`. Não copie nome nem matrícula para lugar nenhum: para investigar, os ids bastam.

**Causas prováveis:**
1. Os reusos vêm de uma escola só, de poucos usuários, e cada família tem uma sessão → cookie copiado de um
   Chromebook compartilhado, ou extensão/script guardando cookie. É o que o reuso existe para cortar: nada a
   desfazer. Avise a coordenação daquela escola (seção "Como avisar as escolas") para ver quem usou o computador,
   sem mandar id de aluno por e-mail.
2. Os reusos vêm de várias escolas, começaram depois de um deploy da web, e `ja_renovado` subiu junto → bug do
   cliente: duas abas renovando sem a trava (Web Locks), ou a web repetindo a renovação com o cookie velho depois
   de um 409. Volte a web ao commit anterior no próximo intervalo fora do horário letivo e abra tarefa com o
   caso reproduzido; até lá, cada família derrubada é uma pessoa que entra de novo.
3. Os reusos vêm de um mesmo IP de saída de rede, em várias contas, em sequência → alguém testando cookies
   roubados. Confira `registro_acesso` pelo IP (`evento = 'renovacao'`) e registre; o bloqueio já aconteceu, porque
   a família caiu no primeiro uso. O IP é dado pessoal: fica na investigação, não vai para o `TODO.md` nem por
   e-mail para a escola.

**Se nada disso resolver:** o reuso não tem degradação a ligar: ele encerra só a família afetada, e nenhuma escola
para por ele. Se for bug de cliente em massa no horário letivo, avise as escolas de que "a sessão pode pedir para
entrar de novo" até a correção.

**Depois:** registre no `TODO.md` a hora, quantas famílias e de quantas escolas (só números e ids), e a causa.
Bug de cliente vira tarefa com teste; ataque vira conversa com a escola sobre o computador compartilhado.

## Login lento

**Dispara quando:** o p95 de `login.duracao` no último minuto, somando as instâncias da API e os dois métodos
(e-mail e matrícula), passa de 1 s por 3 min seguidos (`histogram_quantile(0.95, …login_duracao_seconds_bucket…) > 1`,
regra `infra/grafana/alertas/login-lento.yaml`). A duração vai do pedido à resposta e conta todo desfecho: entrou,
senha errada, conta segurada e o 503 do semáforo do hash. O alerta não traz escola nem pessoa.

**Impacto:** alunos e professores esperam para entrar. Às 7h30 é a turma inteira parada na frente do Chromebook,
com a web mostrando "entrando…" e repetindo sozinha por até 30 s; quem passa disso vê erro.

**Primeiro olhar:** painel, linha "Processos": "Login (p95) por método", "Espera pelo hash por escola (p95)" e
"Logins recusados pelo semáforo". Espera alta num balde só é uma escola (ou a `equipe`, ou `desconhecida`) lotando o
login; espera alta em todos os baldes é a instância sem capacidade. Depois "Atraso do event loop (p99)" e "Pool do banco
em uso", e `docker stats api-1 api-2` para a CPU de cada API.

**Causas prováveis:**
1. Espera pelo hash alta em todas as escolas, CPU da API no teto, dentro do horário de entrada → falta capacidade de
   hash: `docker compose ps api-1 api-2` (uma instância fora dobra a fila da outra) e suba a que caiu com
   `docker compose up -d api-2`. Com as duas de pé e a CPU no teto, suba mais uma instância, se houver onde. Rever
   `LOGIN_HASH_CONCORRENCIA` e o custo do argon2 (`LOGIN_ARGON2_ITERACOES`) é decisão, fora do horário letivo, com o
   cenário "login às 7h30" (tarefa 16.0); nunca abaixo da OWASP e nunca acima de `UV_THREADPOOL_SIZE − 8`.
2. Espera alta só no balde `equipe`, ou só em `desconhecida`, com as escolas normais → ataque de senha ao login por
   e-mail, ou a endereço que não existe. O rodízio segura o resto: alunos das escolas entram. Siga o "Login recusado
   pelo semáforo do hash", causa 2.
3. Espera pelo hash baixa e login lento assim mesmo → o tempo está fora do hash: Postgres (pool no teto, `TEMPO_ESGOTADO`
   no log) ou Redis de fila lento (`login.contador_no_seguro` no log). Siga "Taxa de erro 5xx", causa 1, ou "Seguro de
   limite ativo", causa 4.
4. Espera pelo hash alta em todos os baldes, com a CPU das APIs baixa → não é falta de capacidade de hash, e subir
   instância não resolve: a vez no semáforo cobre também a reserva no contador de tentativas (Redis de fila) e a leitura
   da credencial (Postgres), e com um dos dois lento cada vez demora mais para voltar. Olhe "Pool do banco em uso" e o
   log (`TEMPO_ESGOTADO`, `login.contador_no_seguro`, `login.limite_por_ip_no_seguro`), e
   `docker compose exec redis-fila redis-cli --latency`. Um `addBulk` grande ou um script de fila longo no Redis de fila
   às 7h30 é o suspeito de sempre: lote fica fora do horário letivo (`docs/infra.md`, seção 5.2).

**Se nada disso resolver:** avise as escolas afetadas (seção "Como avisar as escolas") de que o login está lento e de
que a tela tenta de novo sozinha: ninguém precisa recarregar a página. Deploy só fora do horário letivo (D27): não
reinicie as duas APIs juntas no horário de entrada.

**Depois:** registre no `TODO.md` o horário, o p95 que chegou, quantas instâncias estavam de pé e a CPU delas (só
números). Capacidade que não bastou na entrada vira tarefa de calibração com o cenário de carga.

## Login recusado pelo semáforo do hash

**Dispara quando:** mais de 1% dos logins do último minuto, somando as instâncias da API, saem com 503
`INDISPONIVEL_TENTE_DE_NOVO` porque esperaram mais de 2 s pela vez no semáforo do hash de senha, por 3 min seguidos
(`login_hash_recusado_total` sobre `login_duracao_seconds_count`, regra
`infra/grafana/alertas/login-hash-recusado.yaml`). O semáforo roda no máximo `LOGIN_HASH_CONCORRENCIA` hashes por
instância e atende os baldes em rodízio: um por escola (matrícula), um `equipe` (todo login por e-mail, com a vez
rodando por IP) e um `desconhecida` (endereço de escola que não existe). O alerta não traz escola nem pessoa.

**Impacto:** a web recebe o 503 com `Retry-After` de 2 a 6 s e tenta de novo sozinha, mostrando "entrando…". Quem
não consegue a vez em 30 s vê erro. O 503 não conta como senha errada e não segura conta nenhuma.

**Primeiro olhar:** painel, linha "Processos": "Espera pelo hash por escola (p95)", para ver qual balde está cheio,
"Logins recusados pelo semáforo" e "Login (p95) por método". Depois a CPU das APIs (`docker stats api-1 api-2`) e
quantas estão de pé (`docker compose ps api-1 api-2`).

**Causas prováveis:**
1. Todos os baldes esperando, na entrada da manhã, com uma instância fora ou a CPU no teto → capacidade. Suba a
   instância que caiu (`docker compose up -d api-1`), ou mais uma. Rever `LOGIN_HASH_CONCORRENCIA` e o custo do hash é
   decisão fora do horário letivo, com o cenário de carga (tarefa 16.0).
2. Só o balde `equipe` esperando, com as escolas normais → ataque distribuído ao login por e-mail: muitos IPs tentando
   senhas. O rodízio por IP e o balde separado seguram os alunos; a equipe de todas as escolas entra mais devagar
   (risco aceito no F1, Tech Spec da identidade, seção 13). Confira `registro_acesso` com `evento = 'login_falho'` e
   escola nula no último quarto de hora, contando por IP, só para a investigação: o IP é dado pessoal, não vai para o
   `TODO.md` nem por e-mail. Um IP só pedindo muito é assunto do limite por IP da rota de e-mail (tarefa 15.0).
3. Só o balde de uma escola esperando → aquela escola inteira entrando junto (rajada legítima) ou alguém da rede dela
   errando senha em massa. As outras escolas não sentem. Rajada legítima passa em minutos; falha em massa aparece como
   `login.conta_segurada` subindo junto.
4. Só `desconhecida` esperando → alguém tentando endereços de escola que não existem. Não atrasa escola real; registre
   e acompanhe. O mesmo aparece em "Falhas de login por escola", na série `desconhecida`: todos os endereços que não
   existem contam num contador comum (11.0), que cresce com varredura de endereço e não segura nem rebaixa escola
   nenhuma, porque não é de escola nenhuma. Para ver de onde vem, `registro_acesso` não ajuda (endereço que não existe
   não grava registro): olhe a borda (`docker compose logs --since 10m borda`).

**Se nada disso resolver:** avise as escolas afetadas (seção "Como avisar as escolas") de que o login está demorando
e de que a tela tenta sozinha. Não desligue o semáforo: sem ele, o hash toma a CPU da API e tudo fica lento, não só o
login.

**Depois:** registre no `TODO.md` o horário, a duração, qual balde encheu (o id da escola, `equipe` ou `desconhecida`)
e a causa. Capacidade que não bastou vira tarefa de calibração; ataque vira registro com a escola, sem IP.

## Login rebaixado numa escola

**Dispara quando:** numa instância da API, a série `login.prioridade_rebaixada` de uma escola fica em 1 por 2 min
seguidos (`max by (escola_id) (login_prioridade_rebaixada)`, regra `infra/grafana/alertas/login-rebaixado-por-escola.yaml`).
Ela vai a 1 quando um IP passa de `max(100, 25% dos alunos ativos da escola)` falhas de login por matrícula em um
minuto naquela escola, e as tentativas desse IP para essa escola passam a ir para o fim da fila dela. O alerta traz a
escola, nunca o IP.

**Impacto:** ninguém é bloqueado, e nenhuma outra escola sente. Quem entra pelo mesmo IP e já entrou naquele navegador
nos últimos 30 dias (cookie `educa_dispositivo`) mantém a vez. Quem nunca entrou naquele navegador espera o fim da fila
da escola, e sob ataque forte pode ver "entrando…" por mais tempo; a web repete sozinha por até 30 s.

**Primeiro olhar:** painel, linha "Processos": "Escola com login rebaixado", "Falhas de login por escola" (quantas por
minuto) e "Espera pelo hash por escola (p95)" daquela escola. Para saber o IP, e só para a investigação:
`registro_acesso` com `evento = 'login_falho'` daquela escola nos últimos 15 min, contando por IP. O IP é dado pessoal:
não vai para o `TODO.md`, para e-mail nem para chat.

**Causas prováveis:**
1. O IP que falha em massa é o IP de saída da própria escola → ataque de dentro da rede: um aluno com script tentando
   matrículas. É o caso que o rebaixamento existe para aguentar. Avise a coordenação da escola (seção "Como avisar as
   escolas") de que alguém na rede dela está testando senhas, com o horário; ela sabe onde procurar. Não bloqueie o IP
   da escola: são 400 alunos atrás dele.
2. O IP é de fora (não é o da escola, nem de uma rede cadastrada) → ataque de fora, contra matrículas daquela escola. Os
   alunos da escola, que saem por outro IP, nem são rebaixados. Registre e acompanhe; se durar, avise a escola.
3. O IP é o de saída de uma rede municipal, e a escola é da rede → várias escolas saindo pelo mesmo IP e uma delas com
   muitas senhas erradas de verdade (primeiro dia de aula). Confira se a rede tem `rede.ips_saida` cadastrado (no F1,
   por comando; a tela é do F14): sem ele, a rota de e-mail da equipe dessa rede também fica limitada como IP comum.
4. Muitas falhas legítimas numa escola pequena na primeira semana → o limiar tem piso de 100 por minuto justamente
   para isso; se ainda assim disparar, é senha trocada em massa (reset da escola) e passa sozinho em minutos.

**Rebaixado pelo volume, e não pelas falhas:** a espera pelo hash de uma escola pode subir sem este alerta. É o outro
rebaixamento, o do limite por IP das rotas de login (`LIMITE_REQ_IP_ANONIMO_MIN` por minuto, num balde próprio): o IP
que manda mais tentativas que isso, certas ou erradas, vai para o fim da fila, com a mesma passagem pelo cookie. Ele
aparece em `login.rebaixado_ip` (painel "Login rebaixado pelo limite por IP das rotas de login"), sem escola e sem
IP. Subiu junto com a espera de uma escola e sem falhas dela: é volume, não senha errada (um script ou uma rede
inteira atrás de um IP só). O que fazer é o mesmo: ninguém é recusado, não bloqueie o IP. Se for uma rede municipal,
confira o `rede.ips_saida` (causa 3). Com a fila cheia (10.000 esperando numa instância), quem sai com 503 para dar
lugar a quem não foi rebaixado é o rebaixado mais antigo da fila com mais rebaixados, nunca quem traz o cookie.
Esse rebaixado pode ser alguém de verdade sem o cookie (um professor atrás do NAT da escola): a web repete o 503 e
ele entra depois.

**Se nada disso resolver:** não há o que desligar: o rebaixamento não recusa ninguém. Nunca bloqueie o IP da escola na
borda, nem por "só uns minutos" (regra 80, item 1). Se a escola reclamar de lentidão para entrar, oriente a entrar
pelo navegador de sempre, que guarda a prioridade.

**Depois:** registre no `TODO.md` o horário, a duração e a escola (o id), se o ataque veio de dentro ou de fora da rede
dela, e o que a escola fez. Sem IP.

## Login por e-mail acima do limite por IP

**Dispara quando:** mais de 20 tentativas de login por e-mail por minuto, somando as instâncias da API, são rebaixadas
pelo limite por IP da rota, por 5 min seguidos (`login_limite_email_ip_total`, regra
`infra/grafana/alertas/login-email-limite-ip.yaml`). O limite é `LIMITE_LOGIN_EMAIL_IP_MIN` (60) tentativas por minuto de
um IP, vezes o número de escolas da rede quando o IP é o de saída dela (`rede.ips_saida`). O alerta não traz IP nem
escola.

**Impacto:** ninguém é bloqueado. As tentativas do IP acima do limite vão para o fim da fila da equipe; quem traz no
cookie `educa_dispositivo` a própria conta mantém a vez. A equipe atrás desse IP que entra num navegador novo espera
mais. As escolas e os alunos (matrícula) não sentem: a equipe tem fila própria.

**Primeiro olhar:** painel, linha "Processos": "Login por e-mail rebaixado pelo limite por IP", "Falhas de login por
escola" na série `equipe` e "Espera pelo hash por escola (p95)" na `equipe`. Para saber o IP, e só para a investigação:
`registro_acesso` com `evento = 'login_falho'` e escola nula nos últimos 15 min, contando por IP. O IP é dado pessoal: não
vai para o `TODO.md`, para e-mail nem para chat.

**Causas prováveis:**
1. Um IP de fora tentando e-mails e senhas (lista vazada, varredura) → é o que o limite existe para conter. Registre e
   acompanhe; o contador por conta segura cada e-mail atacado no navegador do atacante, e o professor no próprio
   computador continua entrando.
2. O IP é o de saída de uma rede municipal que não tem `rede.ips_saida` cadastrado → a equipe de várias escolas atrás
   de um IP só passa de 60 por minuto no começo do turno. Cadastre o IP na rede (no F1, por comando; a tela é do F14):
   o limite vira 60 vezes as escolas dela. Confirme com a rede qual é o IP público de saída antes de cadastrar.
3. O IP é o de uma escola, e a equipe dela não passa de algumas dezenas de pessoas → alguém na rede da escola testando
   e-mails. Avise a coordenação da escola, com o horário. Não bloqueie o IP da escola.

**Se nada disso resolver:** não há o que desligar: o limite não recusa ninguém. Nunca bloqueie o IP de uma escola ou
rede na borda (regra 80, item 1). Se o ataque vier de muitos IPs, o que avisa é "Login recusado pelo semáforo do hash"
(causa 2), e é risco aceito no F1 (Tech Spec da identidade, seção 13).

**Depois:** registre no `TODO.md` o horário, a duração, se era rede sem `ips_saida` (e se ela foi cadastrada) ou
ataque, sem IP.

## Código da turma errado em massa numa escola

**Dispara quando:** mais de 10 tentativas por minuto, somadas as instâncias da API, passam do teto de códigos da turma
errados numa escola (1.000 em 10 min), por 5 min seguidos (`sum(rate(sala_limite_atingido_total{tipo="escola"}[1m])) *
60 > 10`, regra `infra/grafana/alertas/sala-codigo-errado-por-escola.yaml`, que nasce com a A1; Tech Spec da A1, seção
7c). A manhã da escola inteira no primeiro dia erra uns 420 códigos em 5 min, abaixo do teto: acima dele, por 5 min, é
alguém tentando códigos. O alerta não traz escola nem IP (`METRICAS_COM_ESCOLA` é fechada).

**Impacto:** ninguém é recusado. Na escola atacada, todo `salas/abrir` por código espera 1 s, também o do código
certo; o link, o login e as outras escolas não sentem. O risco é outro: quem acerta um código vigente vê os nomes
livres daquela turma, que são de menores. Um IP sozinho, no teto do `rl:ip`, leva uma semana para ter ~0,2% de chance;
com muitos IPs, a chance cresce na mesma proporção, e é por isso que este alerta existe.

**Primeiro olhar:** a escola, no log da API: a linha `sala.limite_atingido` com `tipo` `escola` traz o `escolaId`, que é
o que o comando abaixo recebe. É o que basta, porque a resposta na A1 é por escola, não por IP.
Não procure o IP: as rotas da sala não gravam registro de acesso (Tech Spec da A1, seção 7), e ninguém lê as chaves
`rl:ip` do Redis à mão, nem durante o alerta (`docs/lgpd.md`, "IP só em memória, no login"). Se o log trouxer mais de
uma escola, cada uma segue os passos abaixo.

**Causas prováveis:**
1. Alguém tentando códigos contra a escola, de fora ou de dentro da rede dela → revogue os acessos da escola:
   `OPERADOR=<você> npm run -s ops:revogar-acessos-sala -- --escola <escolaId do log>`. Link e código de todas as turmas dela
   caem na hora, e o que o atacante já testou deixa de valer. O comando imprime só a contagem e grava cada revogação
   na auditoria da escola. Avise a coordenação (seção "Como avisar as escolas"), com o horário, de que cada professor
   precisa gerar um código novo na tela Acesso da turma antes da próxima aula; se o ataque veio de dentro, ela sabe
   onde procurar.
2. O ataque volta depois da revogação, contra os códigos novos → alguém dentro da sala está vendo o código projetado
   (Tech Spec da A1, seção 13). Revogue de novo, trate como incidente (seção "Como avisar as escolas") e combine com a
   coordenação o passo seguinte, abaixo.

**Se nada disso resolver:** não há como desligar a página da sala só para uma escola. Com os acessos revogados, o
atacante precisa começar de novo contra os códigos novos, e cada um vale no máximo 30 dias. Se o ataque não parar,
combine com a coordenação que os professores gerem o código na hora da aula, com validade de 1 dia, e o revoguem ao
fim dela. Não bloqueie IP na borda na A1: não há de onde tirar o IP sem ler dado que ninguém lê, e o IP de saída da
escola esconde centenas de alunos (regra 80, item 1). O bloqueio na borda fica para quando existirem o staging e o
provedor (D42), com finalidade e prazo no `docs/lgpd.md` antes do primeiro uso, e nunca em arquivo versionado: o
repositório é público (`TODO.md`).

**Depois:** registre no `TODO.md` o horário, a duração, a escola (o id) e quantos acessos foram revogados. Sem IP. Se
durou mais de um dia ou voltou depois da revogação, registre como incidente e reveja a prioridade do balde próprio da
sala no limite por IP (`rl:ip:sala`), previsto para o F2.

## Rotina do sistema sem rodar (consolidação de uso, expurgo de jobs, expurgo do acesso)

*A preencher antes da primeira escola real* (pendência em `TODO.md`). Hoje nada avisa se
`sistema.consolidar-uso` (2h), `sistema.expurgar-jobs` (3h30) ou `sistema.expurgar-acesso` (4h30) param de
rodar: o uso por escola deixa de ser consolidado, `job_registro` cresce sem expurgo, e registro de acesso
com mais de 6 meses, sessão e convite vencidos há mais de 30 dias ficam no banco além da retenção de
`docs/lgpd.md`, o que é descumprimento da LGPD, e não só espaço. Primeira suspeita: o worker-lote ou a
fila `agendamentos`. A última execução de cada uma aparece em `job_registro` (tipo e estado) e no log
(`job_registro.expurgado`, `acesso.expurgado`, só com as contagens). Rodar de novo à mão é seguro: as
três toleram reexecução (D49), e o expurgo do acesso não apaga nada dentro do prazo. O mesmo job apaga também o
acesso à operação (6 meses), a sessão e o convite de operador (30 dias): parado, eles também passam da retenção.
A auditoria da operação e a conta do operador nunca passam por ele.

**Escola pulada na consolidação de uso** (painel "Uso por escola pulado na consolidação", métrica
`uso_escola_ignorada_total` por `origem` e `causa`; log `uso.escola_ignorada`, com o id da escola, a origem, a causa e o
erro resumido: SQLSTATE e restrição, ou o tipo). Sem alerta. A consolidação pula a escola que o banco recusa e segue com as
outras. Por causa:
1. `escola_inexistente`: a escola não está mais no banco. O SeaweedFS guarda a pasta `escolas/<id>/` vazia depois que os
   objetos saem, e por isso ela volta toda noite, com `origem="storage"`. É esperado depois de uma eliminação. O contador do
   Redis (`origem="contador"`) não é apagado: ele vence sozinho em 35 dias. Se o id for de uma escola que devia existir,
   pare: é o worker apontado para outro banco, ou uma restauração pela metade. Confira o `BANCO_URL` do worker-lote antes
   de qualquer outra coisa. Nada foi perdido, porque o contador continua no Redis até vencer.
   **Todas as escolas da noite inexistentes:** quando nenhuma escola encontrada (no contador e no storage) existe no banco,
   a consolidação pula cada uma como acima, mas o job falha no fim, com `uso.nenhuma_escola_no_banco` no log (só a
   contagem, `encontradasTotal`), e aparece como job falho em `job_registro`; a fila tenta de novo e falha igual. Sem
   alerta: até existir o de rotina parada (pendência "alerta para rotina do sistema que parou de rodar", `TODO.md`), só
   quem procura em `job_registro` ou no log vê. Primeiro, o caso do `BANCO_URL` acima: o primeiro passo é o mesmo.
   Corrigido o banco, rode a consolidação de novo à mão (D49); os contadores ainda estão no Redis. Se o banco está certo e
   todos os ids da noite são de escolas eliminadas (uma noite sem requisição de escola nenhuma, com a pasta vazia de uma
   eliminada no storage, basta), é o resto de uso que a eliminação ainda não apaga (pendência "Eliminar escola apaga
   também o resto de uso dela", `TODO.md`): apague a pasta `escolas/<id>/` vazia no storage.
2. `valor_invalido`: um contador com texto, ou com um dia que não existe na chave. Nada no sistema escreve assim: é chave
   gravada à mão ou corrompida. Veja com `redis-cli --scan --pattern 'uso:*:<id>:*'` no Redis de fila e apague a chave errada.
   O contador válido da mesma escola, em outro dia, foi gravado normalmente.
3. `erro_de_storage`: a listagem da pasta da escola falhou. As outras escolas foram medidas, e o job falha no fim para a
   fila tentar de novo, então também aparece como job falho em `job_registro`. Depois de três pastas seguidas com erro, a
   rotina desiste na hora, porque é o storage fora: siga pelo storage (`docker compose ps storage`). Rodar de novo à mão é
   seguro (D49).

## Operador não entra no painel da operação (Redis de fila fora)

Sem alerta próprio: aparece como o 503 `INDISPONIVEL_TENTE_DE_NOVO` ao concluir o segundo fator
(`POST /v1/operacao/sessao/mfa` e `/sessao/mfa/configurar`) e como `operacao.desafio_sem_redis` no log da API, no
máximo uma linha a cada 30 s e sem nada da pessoa. A marca de desafio usado mora no Redis de fila; sem ela não dá para
saber se o desafio já foi usado, e o painel recusa em vez de aceitar. Do lado das escolas, o mesmo Redis fora é o
"Seguro de limite ativo", causa 4. A sessão de operador já aberta não usa a marca de desafio e segue até vencer.
**O que fazer:** o Redis de fila é o mesmo da fila de jobs; siga "Seguro de limite ativo", causa 4
(`docker compose ps redis-fila`; parado, `docker compose up -d redis-fila`). **Enquanto ele não volta, o caminho da
equipe são os comandos `ops:*`**, que falam direto com o banco e não passam pelo desafio: `ops:escola`,
`ops:convite-coordenador`, `ops:revogar-convite`, `ops:redefinir-mfa`, `ops:uso` e `ops:operador` (README, "Rodando local"). Não há o que liberar à mão: com o Redis de volta, o
operador entra de novo com e-mail e senha.

## Sistema fora do ar no horário letivo

*A preencher quando o staging existir (D31).*

## Tutor lento (p95 do primeiro token acima do limite)

*A preencher no F5.* Primeira suspeita: tokens por minuto perto do limite do provedor.

## Tokens por minuto acima de 80% do contratado

*A preencher no F5.*

## Salvamento de resposta de prova lento ou falhando

*A preencher no F6.* Prioridade máxima: há aluno fazendo prova agora.

## Backup do dia não concluído

*A preencher antes da primeira escola real.*

---

## Ensaiar os alertas

`npm run ensaio:alertas`, com o ambiente local de pé (`docker compose up`), provoca as três
condições do F0 de uma vez, e as duas do login: para o `worker-interativo` e manda um job interativo, para o Redis de cache,
e força 5xx em `POST /v1/sistema/jobs-sinteticos` para uma escola sintética (um gatilho
temporário no banco recusa a gravação só dessa escola). Confere pela API do Grafana que as três
regras chegam a disparadas, e restaura tudo: religa o que parou, remove o gatilho e espera as três
voltarem a normal. Leva uns 8 minutos, por causa dos 5 min da regra de 5xx. Só roda com
`AMBIENTE=local`, e um de cada vez: o gatilho tem nome fixo, e um segundo ensaio no mesmo banco
remove o gatilho do primeiro. Com o ambiente parado, o ensaio o sobe inteiro e o deixa de pé.

O ensaio provoca também os quatro alertas de login: recria as APIs com um hash por vez e o argon2 muito mais caro
(`LOGIN_HASH_CONCORRENCIA=1` e `LOGIN_ARGON2_ITERACOES` alto, só no contêiner do ensaio), manda logins de matrícula que
não existem ao endereço de uma escola sintética até o semáforo passar do prazo, e em paralelo logins por e-mail sem
conta acima do limite por IP. Confere que "Login lento" e "Login recusado pelo semáforo do hash" disparam depois dos
3 min de cada um, "Login rebaixado numa escola" (as falhas do IP do ensaio passam do limiar daquela escola) depois dos
2 min, e "Login por e-mail acima do limite por IP" depois dos 5 min. Nenhum login do ensaio recebe 429. No fim, espera as regras voltarem a normal e só então recria as APIs
com o `.env` de sempre (a instância que sai deixa o último valor no Prometheus por até 5 min). Se o ensaio for
interrompido, recrie-as à mão: `docker compose up -d --force-recreate --no-deps api-1 api-2`.

O "Reuso de refresh" não entra no ensaio, porque não nasce de serviço parado: ele tem prova própria em
`infra/test/alertas.int.test.ts`, que reusa cinco cookies (a regra fica normal) e depois o sexto (dispara), na
esteira.

## Rodar o cenário de carga

`npm run carga` roda o cenário "justiça entre escolas" num projeto compose próprio (`educa-carga`),
que não toca no ambiente de desenvolvimento nem no de teste, e o derruba no fim. Passa quando a
espera da escola B com a escola A enchendo a fila fica até 500 ms acima da espera sem ela, quando só o
usuário abusivo recebe 429 e quando `job_registro` mostra nenhum job `falhou` e nenhum interativo
acima de 30 s. Rode de novo quando uma tarefa mexer no caminho quente (fila, despachante, worker,
rate limit, borda) e registre o resultado na tarefa.

Se reprovar, a saída diz o critério. Espera da B acima da margem ou interativo acima de 30 s é o
problema de justiça entre escolas: olhe a vaga por escola e o rodízio do despachante antes de
qualquer outra coisa, e confirme com `npm run carga:controle-negativo`, que precisa continuar
reprovando (sem a vaga por escola, o cenário tem de quebrar). 429 fora do usuário abusivo é o rate
limit tratando escola como IP. `k6_base` ou `k6_carga` é o ambiente que não rodou até o fim: veja os
logs que o script imprime.

## Rodar o cenário de login

`npm run carga:login` roda o cenário "login às 7h30" (tarefa 16.0) no mesmo projeto compose próprio (`educa-carga`) do
cenário de carga, e o derruba no fim. Leva uns 20 min. Não rode junto com o portão, com os testes nem com o outro
cenário: os dois sobem o mesmo projeto, e a medição depende da CPU livre. As fases, em ordem: base (B e C sem ataque),
rajada (2.100 contas em 5 min, 40% no primeiro minuto, 30% errando a senha uma vez), renovação em duas abas, ataque de
fora (um segundo container k6), ataque de dentro (do IP da escola) e o Redis de fila derrubado no meio de um ataque.

Passa quando o p95 do login fica abaixo de 1 s na rajada, e na B, na C e nas contas com cookie da A e da equipe durante os ataques, as autenticadas da B e da C
ficam até 250 ms acima da base, nenhuma conta legítima com o cookie de dispositivo recebe 429, nenhuma conta legítima
termina em erro (a web repete o 503 por até 30 s), nenhuma família de sessão é encerrada por reuso, o rebaixamento
aparece só na A e só durante os ataques, e `limite.seguro_ativo` chega a 1 com o Redis de fila fora. Rode de novo quando
uma tarefa mexer no login, no semáforo, no rebaixamento, na renovação ou no hash, e registre o resultado na tarefa.

Para depurar uma fase sem esperar o cenário inteiro: `npm run carga:login -- --fases rajada` (a base roda sempre). O
resultado parcial não vale como registro.

Se reprovar, a saída diz a fase e o critério:
- **p95 do login na rajada acima de 1 s, ou conta que não entrou:** o hash custa mais do que a CPU de referência aguenta.
  Confira `LOGIN_ARGON2_ITERACOES` em `infra/carga.env` contra a calibração da Tech Spec da identidade (seção 5, "Hash").
  Não baixe abaixo do mínimo da OWASP (a API não sobe); a saída é mais CPU por instância, não hash mais fraco.
- **B ou C degradadas num ataque:** o rodízio entre baldes do semáforo não está separando as escolas. Confirme com
  `npm run carga:login:controle-negativo`, que precisa continuar reprovando (sem os baldes e o rebaixamento, o cenário
  tem de quebrar).
- **429 para conta com cookie:** o contador `conhecido`/`outro` (4.0) não está separando o dono do script.
- **família encerrada por reuso:** a janela de 2 s do `JA_RENOVADO` (5.0) não está cobrindo as duas abas.
- **`k6` da fase:** o ambiente não rodou até o fim; veja os logs que o script imprime.

## Esteira vermelha no e2e

O job de e2e publica o diretório de saída do Playwright quando falha ou é cancelado: artefato
**`traco-do-e2e`** da execução, com `trace.zip` e `error-context.md` do caso que falhou, por 7 dias.
(O nome, o prazo e o caminho são afirmados em `tools/ci/esteira.test.ts`; se renomearem o artefato, é
lá que o vermelho aparece, e esta seção precisa acompanhar.)
Baixe com `gh run download <id> --name traco-do-e2e` e abra com `npx playwright show-trace <arquivo>`:
é ele que tem a linha de tempo das requisições e diz se o prazo foi numa resposta lenta da API, numa
tentativa rebaixada na fila do login ou na tela que não chegou a montar.

Sem artefato na execução falha, o vazio é sinal por si: ou a configuração do traço mudou
(`playwright.config.ts`), ou o compose não subiu — o passo avisa com `if-no-files-found: warn`.
O caso morto pelo estouro de `timeout-minutes` não deixa traço finalizado; aí o que resta é o log dos
serviços no próprio job.

Vermelho de e2e que não reproduz na máquina segura a tarefa seguinte (regra 40, D52): trate como
defeito por `/corrigir`, com a causa achada no traço, e não repetindo a execução até passar.

**O artefato é público**, porque o repositório é. Ele é inofensivo hoje por construção: todo dado do
e2e é sintético, e o ambiente do compose de teste sai só de `.env.example` e `infra/teste.env`, os dois
versionados, sem ler nada do runner (`tools/ci/compose.ts`). Por isso, **nada além da saída do
Playwright deve ser escrito em `test-results/`** — despejo de log de serviço, dump ou material
licenciado de fixture mudariam a classe do que se publica, e aí a decisão de publicar precisa ser
tomada de novo, com o `privacy-guardian`.

## Como avisar as escolas

*A definir antes do piloto:* canal (e-mail para a coordenação, aviso na tela), texto padrão
para queda e para retorno, e quem autoriza estender prazo de prova afetada.
