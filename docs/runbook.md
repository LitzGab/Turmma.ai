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
4. Redis de cache no ar, e o log traz `login.contador_no_seguro` ou `login.redis_indisponivel` → quem
   está no seguro é o contador de tentativas do login por e-mail, que fica no Redis de fila (a métrica
   vale o maior dos dois). Com ele fora, a senha errada segura a conta em cada instância, e não no
   sistema inteiro: um ataque de senha espalhado pelas duas instâncias tem o dobro de tentativas. Ninguém
   é barrado por isso. `docker compose ps redis-fila`; parado, `docker compose up -d redis-fila`. Ele é
   o Redis da fila de jobs também: veja se "Job interativo esperando" disparou junto.

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
   e o "Login recusado pelo semáforo do hash" dispara junto: siga aquela entrada.

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
   e acompanhe.

**Se nada disso resolver:** avise as escolas afetadas (seção "Como avisar as escolas") de que o login está demorando
e de que a tela tenta sozinha. Não desligue o semáforo: sem ele, o hash toma a CPU da API e tudo fica lento, não só o
login.

**Depois:** registre no `TODO.md` o horário, a duração, qual balde encheu (o id da escola, `equipe` ou `desconhecida`)
e a causa. Capacidade que não bastou vira tarefa de calibração; ataque vira registro com a escola, sem IP.

## Rotina do sistema sem rodar (consolidação de uso, expurgo de jobs)

*A preencher antes da primeira escola real* (pendência em `TODO.md`). Hoje nada avisa se
`sistema.consolidar-uso` (2h) ou `sistema.expurgar-jobs` (3h30) param de rodar: o uso por escola
deixa de ser consolidado e `job_registro` cresce sem expurgo. Primeira suspeita: o worker-lote ou a
fila `agendamentos`.

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

O ensaio provoca também os dois alertas de login: recria as APIs com um hash por vez e o argon2 muito mais caro
(`LOGIN_HASH_CONCORRENCIA=1` e `LOGIN_ARGON2_ITERACOES` alto, só no contêiner do ensaio), manda logins de matrícula a
um endereço que não existe até o semáforo passar do prazo, e confere que "Login lento" e "Login recusado pelo semáforo
do hash" disparam depois dos 3 min de cada um. No fim, espera as regras voltarem a normal e só então recria as APIs
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

## Como avisar as escolas

*A definir antes do piloto:* canal (e-mail para a coordenação, aviso na tela), texto padrão
para queda e para retorno, e quem autoriza estender prazo de prova afetada.
