# Achados das revisões

Escrito pelo hook `tools/processo/revisoes.ts`. Lido por `/retro`. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-21 12:39:42 · `tasks/prd-estabilidade-da-esteira/revisao-spec.md`

Auditei o desenho contra a minha lista, e li o código que a spec promete mudar (`infra/test/borda.int.test.ts`, `tools/ci/e2e.ts`, `playwright.config.ts`, `infra/compose.yml`, `infra/Caddyfile`, `vitest.config.ts`, `tools/guardas/index.mjs`). As respostas aos cinco pontos primeiro, porque três deles viraram bloqueante.

**1. A estratégia do RF7 não basta.** A seção 10 diz a coisa certa ("número de repetições declarado e critério fixo") e a seção 5, etapa 5, desfaz: o número sai *depois* ("o número de repetições e a forma de contenção ficam registrados"). Critério escolhido depois do resultado não é critério — a regra 40 manda a taxa ser **declarada** antes, como em OCR. Pior: o PRD §9 já diz "dez execuções seguidas" e o RF7 diz "N", e ninguém reconcilia. E dez não prova nada aqui: se a probabilidade de vermelho por execução for 10%, dez execuções verdes acontecem por sorte em 35% das vezes (0,9¹⁰ = 0,349); para descartar p ≥ 10% com 95% de confiança são ~29 execuções, e para p ≥ 5%, ~59. Como não existe medição da taxa de hoje (o "sete numa sessão" não tem denominador), não há nem o "antes" contra o qual comparar. Existe forma melhor e mais barata que rodar a suíte inteira N vezes (8 min × N × 2 jobs, sem orçamento declarado): repetição **por caso afetado** sob contenção declarada e determinística (`vitest --repeat`, `--repeat-each` no perfil `celular`), que dá N alto por pouco dinheiro, mais um registro contínuo de flake (o mesmo registro do RF6) lido por algumas semanas; a execução da suíte inteira entra como amostra menor, fora do commit, em job próprio.

**2. "Medir antes de consertar" é só intenção escrita.** Não há nada que impeça pular a etapa 1 — e a própria spec abre a porta: a §1 diz "nenhuma tarefa de conserto começa antes de a tarefa de medição entregar número" e a §5, etapa 2, diz que RF3 e RF4 "não dependem da investigação", enquanto as premissas 12.1 e 12.3 dizem que a justificativa dos dois é exatamente o que não foi medido. Para ser bloqueante de verdade tem que cair onde o processo bloqueia: etapa 1 como tarefa 1.0 com entrega commitada (documento com os três números), tarefas seguintes declarando a dependência e **citando o número de lá**, e revisão que reprova a tarefa que cita número que não está no documento.

**3. As guardas do RF3 e RF4, como estão, são asserção de forma** — a classe que o F1 reprovou duas vezes (retro, "Asserção sobre a forma do código, não sobre o resultado", tarefas 3 e 16). Dá para escrever guarda de resultado, e é obrigatório aqui: para o RF3, subir o ambiente do e2e e afirmar que `docker compose ps --services --status running` **não contém** `observabilidade` e é igual à lista declarada (lista no fonte não prova nada: `up <serviços>` sobe `depends_on` junto); para o RF4, importar o `playwright.config.ts` com `CI=true` e afirmar que `workers` é número declarado e que a variável de ambiente o muda — não que a palavra `workers` aparece no arquivo.

**4. A premissa 2 tem que fechar antes de virar tarefa**, porque decide de quem é o trabalho: se a borda devolve 503 numa janela em que o upstream está voltando, isso é defeito de produto sob a regra 80 (prova no meio da aula), com PRD próprio e `infra-guardian`, não ajuste de teste. E o RF2 já está escrito como se a resposta fosse conhecida ("um 503 transitório da borda não cascateia em 400"), o que prejulga a investigação que a etapa 1 diz existir. A premissa 3 também: um RF cujo ganho a própria spec admite não existir ("se a medição disser que não há ganho, a mudança não se justifica sozinha") é pergunta em aberto, não requisito. A premissa 1 pode ser a primeira tarefa, desde que meça mais do que mede hoje (ver B3). A premissa 4 não é premissa: é achado já observado, e contradiz o escopo (ver B9).

**5. Tamanho: leio o teto como por documento**, e os dois passam. `/criar-prd` e `/criar-techspec` põem "até 2.000 palavras, medido com `wc -w`" no checklist de cada artefato, e o `/revisar-spec` manda medir os dois arquivos e só então chama o excesso de bloqueante — é medição por arquivo, não soma. Não é bloqueante. O que incomoda não é a contagem: os dois documentos renarram a história do F1 que já está em `retro.md` (os dois exemplos de "apertar sem medir" aparecem no PRD §6 e na Tech Spec §1 e §13). Cortar isso paga o espaço do que falta.

```
VEREDITO: REPROVADO

Cenários exigidos:
  - `borda.int.test.ts` sob contenção declarada, N execuções, com a causa estabelecida antes
  - contaminação de ordem: o caso anterior que para/religa realtime, seguido do handshake
  - o job de e2e sem `observabilidade`: o ambiente efetivo não tem o serviço E o e2e não regride
    (exportador OTLP sem destino que resolve)
  - `workers` resolvido no config sob `CI=true`, e a substituição por ambiente
  - falha por estouro de prazo nomeia o serviço/passo (RF5)
  - retentativa, se entrar, aparece no registro de flake (RF6)
  - suíte repetida com N declarado ANTES, contra linha de base medida (RF7)
  - bordas do PRD §7: runner menor/mais carregado; dois jobs simultâneos na mesma máquina
    (projeto compose fixo `educa-teste`, portas fixas em `infra/teste.env`); `restart` com AOF
  - contenção da suíte consigo mesma: `unidade` e `integracao` no mesmo `vitest run`

Cobertos: guarda de `workers`; guarda de `observabilidade`; `borda.int.test.ts` sob contenção
  N vezes; caso de ordem (kill → handshake); suíte N vezes. Os cinco, com ressalva: três são
  asserção de forma ou dependem de N indefinido.

Bloqueantes:
  B1 §5 etapa 5 + §10 + PRD RF7/§9 — critério do RF7 não é fixo nem declarado: N é escolhido
     depois, "dez" no PRD e "N" na spec não batem, "sob contenção" não é definido e não há linha
     de base. Exigido: declarar antes a taxa de hoje (medida), o N por taxa-alvo com a confiança,
     a forma determinística de contenção, onde essas execuções rodam (job próprio, fora do
     commit) e o orçamento de runner; repetição por caso afetado como prova principal, suíte
     inteira como amostra.
  B2 §10 (linhas 1 e 2 da tabela) — as duas guardas provam forma, não resultado. Exigido: RF3
     provado pelo ambiente efetivo (`compose ps --services --status running` sem
     `observabilidade` e igual à lista declarada); RF4 provado pelo config resolvido com
     `CI=true` (valor numérico e substituição por ambiente), não pela presença da palavra.
  B3 §5 etapa 2 e §12.1 — tirar `observabilidade` tem efeito colateral já medido neste repo e
     não citado: `TELEMETRIA_OTLP_URL: http://observabilidade:4318` está fixo em
     `infra/compose.yml` (5 ocorrências, ex. :191-192) e é obrigatório em
     `packages/nucleo/src/telemetria/iniciar.ts:28`. Sem o serviço, API, realtime, despachante e
     worker exportam para um nome que não resolve — e `infra/test/borda.int.test.ts:249-253`
     documenta a medição desse caso (consulta DNS saindo do Docker, ~3 s, atrasando a saída no
     SIGTERM). O RF3 pode INTRODUZIR a classe de flake que existe para tirar. Exigido: dizer o
     que acontece com o exportador (destino que resolve, sink nulo, ou manter o serviço com teto
     de CPU) e medir a execução do e2e sem ele, não só "tempo do job e pico de CPU".
  B4 §5 etapa 1, pergunta 1 — a hipótese é falsa dicotomia e aponta o vizinho errado. O caso que
     mata a instância está em `infra/test/borda.int.test.ts:445`, DEPOIS do handshake (:426), na
     ordem em que o vitest roda o arquivo: não pode contaminá-lo na mesma execução. O predecessor
     real é `API não depende do resto` (:350-395), cujo `afterEach` (:354) religa realtime-1/2 e
     espera `VOLTA_AO_BALANCEAMENTO_MS = 3_000` (:25) — prazo fixo menor que a pior janela de
     readmissão da própria borda (`infra/Caddyfile`: `health_interval 2s`, `health_timeout 3s`,
     `health_fails 2`), e com `lb_policy cookie educa_realtime` o pedido preso ao upstream ausente
     cai na outra instância, que não conhece o `sid`: 503 e depois 400 em cascata, que é a saída
     observada. Exigido: a terceira resposta entra na investigação, e a medição observa o estado
     do pool de upstream da borda (sondas/admin), não só a contagem de 503.
  B5 §5 etapa 3, caminho "se for contaminação" — o conserto proposto ("restaurá-la e esperar ela
     voltar") já está implementado: `voltarAoBalanceamento` (:93-96) faz `start` +
     `aguardarSaudavel` + espera, e segue cada queda do caso. Do jeito que está, o único conserto
     concreto da spec é no-op. Exigido: nomear a condição/constante que muda (trocar a espera
     fixa por condição observada na borda).
  B6 §1 contra §5 etapa 2, com §12.1 e §12.3 — a spec diz que nenhum conserto começa sem número
     e, três parágrafos depois, que RF3 e RF4 não dependem da investigação que mede exatamente
     os dois. É o buraco por onde a etapa 1 é pulada, e nada estrutural a torna bloqueante.
     Exigido: etapa 1 como tarefa 1.0 com documento de medição commitado; tarefas seguintes
     declarando a dependência e citando o número de lá; e o RF4 rebaixado a pergunta em aberto
     até a medição 3 dizer que há ganho de estabilidade.
  B7 §10 — RF5 e RF6 não têm uma linha de teste. O RF6 é justamente o que, feito errado, viola a
     regra 40: "inaceitável, retries sem registro" é prosa sem guarda. Exigido: teste que falha
     se um teste que passou na segunda tentativa não aparece no registro, e teste que força
     estouro de prazo e afirma que a mensagem nomeia o serviço/passo.
  B8 PRD §7 contra §10 — três bordas sem cenário: runner menor/mais carregado; dois jobs
     simultâneos na mesma máquina (o projeto é fixo, `tools/ci/compose.ts:11`, e as portas do
     host são fixas em `infra/teste.env:4-11` — duas execuções colidem, e isso é candidato direto
[… 26 linhas cortadas]

## infra-guardian · 1ª rodada · REPROVADO · 2026-09-21 12:39:47 · `tasks/prd-estabilidade-da-esteira/revisao-spec.md`

## Respostas às seis perguntas

**1. A hipótese do `borda.int.test.ts` está mal colocada.** A spec aponta o caso de `:445` como contaminador do handshake, mas `:445` roda **depois** de `:426` — o Vitest executa os `it` na ordem do arquivo e `vitest.config.ts` não declara `sequence.shuffle`. O caso que de fato antecede o handshake é o de `:361` ("com worker, despachante, realtime, Redis e storage parados"), que para `realtime-1` e `realtime-2` (`:368-369`) e os restaura no `afterEach` de `:354-359`. E a forma de medir não distingue as duas coisas que a spec quer distinguir, porque falta a terceira hipótese, que é a mais provável: a restauração termina com `esperar(VOLTA_AO_BALANCEAMENTO_MS)`, **3 s fixos** (`:25`), depois de um `aguardarSaudavel` que só lê `{{.Health}}` do contêiner (`tools/testes/compose.ts:68-74`) e nada diz sobre a borda ter recolocado o upstream no balanceamento. O `infra/Caddyfile:34-38` sonda com `health_interval 2s` e `health_timeout 3s`: sob disputa, a volta ao pool passa de 3 s, e um realtime vivo porém lento sai do pool no meio do caso (2 falhas × 2 s). Daí o 503, e o 400 em cascata é só o socket.io não conhecendo o `sid` na outra instância. Ou seja: contaminação **e** disputa ao mesmo tempo, com a espera fixa como o elo — que é a mesma classe que a guarda `esperar-servico-do-compose` existe para matar, um nível acima dela.

**2. A fronteira da etapa 3 está certa, mas incompleta.** 503 da borda numa janela em que o upstream volta é defeito de produto, sim. Duas faltas: a pergunta só é feita no ramo "se for disputa" — se for contaminação, a mesma pergunta não é feita, e ela vale igual; e a spec não diz o que acontece com o teste entre o diagnóstico e o conserto de produto. Com regra 40 proibindo `.skip` e D52 fazendo o vermelho segurar a próxima tarefa, "vira tarefa própria" sem ordenação é fila travada ou teste desligado.

**3. Tirar `observabilidade` do e2e tem risco, e ele está medido no próprio repositório.** `infra/test/borda.int.test.ts:238-243` documenta: com o serviço parado, o nome não resolve na rede do compose, a consulta sai para o resolvedor da máquina, leva ~3 s e **atrasa a saída do processo no SIGTERM**. `TELEMETRIA_OTLP_URL` é obrigatório (`packages/nucleo/src/telemetria/iniciar.ts:28`), o intervalo é 5 s e o prazo 5 s (`.env.example:174`, `iniciar.ts:18`): sem o serviço, todo processo do compose de e2e tenta exportar e falha a cada 5 s. Nenhum teste de e2e depende do coletor, mas o comportamento muda. Tirar o serviço só vale junto com desligar o destino OTLP naquele ambiente.

**4. Fixar `workers` está certo; proibir retentativa sem registro também.** Marcar como conhecido-instável é pior: é `.skip` com outro nome, e a regra 40 fecha essa porta. Mas o registro que a etapa 4 descreve não existe: "três semanas seguidas" exige um registro que dure três semanas, e o único mecanismo em pé (`ci.yml`, `traco-do-e2e`) guarda 7 dias e **só na falha** — teste que passa na segunda tentativa deixa o job verde e não publica nada.

**5. Falta risco, e a premissa 4 é a ponta certa do fio errado.** O mecanismo local tem nome: `tools/processo/portao-local.ts:46,51` roda `e2e` antes de `infra` no mesmo portão, e `test:e2e` é `node tools/ci/e2e.ts --manter-ambiente`, que pula o `down` (`tools/ci/e2e.ts:26`). Com `--e2e --infra`, os testes de infra rodam com os 19 serviços do e2e ainda de pé — e `borda.int.test.ts:364-368` calcula o que parar a partir de "tudo que está de pé", então o conjunto cresce e o ciclo stop/start fica mais longo que os 3 s fixos. Risco ausente também: a etapa 2 não toca o job onde o sintoma mora.

**6. Limite de CPU por serviço, do jeito binário da pergunta, piora.** `cpus:` é teto absoluto e as asserções da borda são de relógio: `paradaMs >= DRENAGEM_ESPERA_BORDA_MS` e `< DRENAGEM_PRAZO_MS` (`:480-482`), `health_timeout 3s` da sonda. Capar a CPU de `borda`, `api-*`, `realtime-*`, `postgres` e `redis-*` fabrica justamente o 503 sob investigação. Vale só para quem participa de pé e não é medido — `observabilidade`, `storage`, `oidc-falso` — e a pergunta em aberto precisa ser partida assim, não respondida com sim ou não.

```
VEREDITO: REPROVADO
Caminho quente tocado: deploy (esteira, compose de teste e portão local)
Rate limit: não se aplica — nenhuma rota, nenhum limitador novo
Fila e prioridade: não se aplica
Concorrência: não há código de produto; a corrida está no arranjo do teste — infra/test/borda.int.test.ts:25 e :358 (espera fixa de 3 s no lugar de condição observável)
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: faltando — RF6 exige registro consultável do flake e a spec não declara onde ele vive nem por quanto tempo
Bloqueantes:
  1. Tech Spec seção 5, etapa 1, item 1 — a hipótese nomeia o caso errado. infra/test/borda.int.test.ts:445 roda DEPOIS de :426 (ordem do arquivo, sem sequence.shuffle em vitest.config.ts): não pode contaminá-lo. Correção exigida: reescrever a hipótese contra o caso de :361, que para realtime-1 e realtime-2 (:368-369) e restaura no afterEach de :354-359, e incluí-lo na medição como o caso imediatamente anterior.
  2. Tech Spec seção 5, etapa 1, "Como medir" — dicotomia falsa. Falta a hipótese da espera fixa: VOLTA_AO_BALANCEAMENTO_MS = 3_000 (borda.int.test.ts:25) depois de aguardarSaudavel, que só lê {{.Health}} do contêiner (tools/testes/compose.ts:68-74), contra infra/Caddyfile:34-38 (health_interval 2s, health_timeout 3s), cujo pior caso passa de 3 s sob disputa. Correção exigida: três desfechos possíveis na medição, com a contagem de 503 correlacionada ao instante em que a borda recoloca o upstream, e a troca da espera fixa por condição observável na etapa 3.
  3. Tech Spec seção 5, etapa 2 e RF3 — tirar observabilidade não é mudança livre. infra/test/borda.int.test.ts:238-243 mede o acoplamento: sem o serviço o nome não resolve, a consulta vaza para o resolvedor da máquina (~3 s) e atrasa a saída no SIGTERM, que é o que os casos de drenagem medem; e TELEMETRIA_OTLP_URL é obrigatório (packages/nucleo/src/telemetria/iniciar.ts:28) com exportação a cada 5 s. Correção exigida: tirar o serviço só junto com desligar o destino OTLP no e2e, e medir a saída dos processos, não só tempo de job e pico de CPU.
  4. Tech Spec seção 1 e seção 5, etapa 2 — as duas mudanças "de justificativa pronta" não alcançam o job do sintoma. borda.int.test.ts roda no projeto `infra` (vitest.config.ts) pelo job `infra` de .github/workflows/ci.yml, que não usa Playwright nem a lista de serviços de tools/ci/e2e.ts. Quatro dos sete vermelhos ficam intocados. Correção exigida: declarar, por job, qual alavanca se aplica, e a etapa 2 carregar ao menos uma medida para o job `infra`.
  5. Tech Spec seção 12, premissa 4, e etapa 5 — o critério de pronto só cobre a esteira, com três dos sete vermelhos no portão local, e o mecanismo local não é nomeado: tools/processo/portao-local.ts:46,51 roda e2e antes de infra, e test:e2e usa --manter-ambiente, que pula o `down` (tools/ci/e2e.ts:26); os testes de infra herdam os 19 serviços de pé, e borda.int.test.ts:364-368 monta o conjunto a parar a partir do que está rodando. Correção exigida: incluir essa hipótese e rodar a etapa 5 também no portão local com --e2e --infra, nessa ordem.
  6. Tech Spec etapa 5 e seção 10 (e PRD RF7) — "N vezes" nunca é declarado, e a própria seção 10 exige número declarado e critério fixo. Correção exigida: fixar N e a forma de contenção antes de a etapa 3 concluir, derivados da taxa medida na etapa 1, e registrar que N não se escolhe depois de ver o resultado.
  7. Tech Spec etapa 4 — o registro que condiciona a retentativa se contradiz: "três semanas seguidas" contra um mecanismo de artefato de 7 dias e só na falha (ci.yml, traco-do-e2e), sendo que flake que passa na segunda tentativa deixa o job verde. Correção exigida: definir lugar, leitor e retenção do registro antes de `retries: 1` ser permitido; sem isso é a retentativa silenciosa que a própria seção chama de inaceitável.
  8. Tech Spec etapa 3, ramificação de produto — não diz o que acontece com o teste entre o diagnóstico e o conserto. Correção exigida: declarar que a tarefa de produto pertence a esta mesma funcionalidade, antes da etapa 5, e que o teste não é desligado enquanto isso (regra 40, D52).
Recomendações:
  - Partir a pergunta em aberto do CPU: teto só para quem fica de pé sem ser medido (observabilidade, storage, oidc-falso); nunca para borda, api-*, realtime-*, postgres e redis-*, cujas asserções são de relógio (borda.int.test.ts:480-482).
  - Alavanca mais barata para o job `infra`: o otel-lgtm inteiro sobe durante o teste mais instável (borda.int.test.ts:238) só para evitar 3 s de DNS. Apontar TELEMETRIA_OTLP_URL para um endereço que falha rápido resolve o mesmo sem o contêiner.
  - Declarar o escopo da guarda de `observabilidade`: ela precisa valer só para a lista do job de e2e — metricas.int.test.ts:89, alertas.int.test.ts:81 e borda.int.test.ts:238 sobem o serviço de propósito.
  - Dizer qual é o valor padrão de `workers` e o que ele faz com a duração do portão local de 12 núcleos; a spec descreve o padrão vindo do runner e o ambiente sobrepondo, que é o inverso do uso.
```

## test-engineer · 2ª rodada · REPROVADO · 2026-09-21 12:47:59 · `tasks/prd-estabilidade-da-esteira/revisao-spec.md`

Read the rewritten PRD and Tech Spec and checked every claim against the code: `infra/test/borda.int.test.ts` (`:25`, `:93-96`, `:354-359`, `:361`, `:426`), `infra/Caddyfile` (admin em `127.0.0.1:2019` dentro do contêiner, `health_interval 2s` / `health_passes 1`), `tools/processo/portao-local.ts` (ordem `typecheck, lint, test, e2e, infra` — confirmada), `tools/ci/e2e.ts` (`up --wait` sem lista + `--manter-ambiente`), `tools/ci/infra.ts`, `tools/testes/integracao.setup.ts` e `vitest.config.ts`.

O mecanismo da seção 1 confere com o código. Sete dos nove bloqueantes da rodada 1 estão resolvidos. Os que sobram são os três que você perguntou.

**Resposta direta às suas três perguntas:**

1. **A prova do RF2 não substitui a reprodução, por dois motivos.** Primeiro, ela é ela mesma probabilística e sem critério: com a condição removida, a janela de readmissão é de até ~2 s (`health_interval 2s`, `health_passes 1`) depois que `aguardarSaudavel` retorna, então o handshake de `:426` falha **às vezes**, não sempre. Um "removi e passou mesmo assim" fica sem leitura — é a armadilha que a própria spec diz evitar. Segundo, remoção prova que *alguma* espera é necessária; não prova que a condição nova observa o sinal certo. Uma condição errada (saúde de contêiner com outro nome, admin dizendo healthy enquanto o upstream fixado pelo cookie ainda dá 503) passa na mutação e mantém o flake. Falta a asserção positiva.

2. **O N do RF8 ainda é promessa, e o jeito como está escrito não produz N nenhum.** Derivar N de uma taxa-alvo exige alvo como limite superior; com alvo zero (`prd.md:121`), N é infinito. O exemplo da §6 é sobre a taxa *de hoje*, não sobre o alvo, e não há fórmula nem lugar onde o número fique escrito antes da rodada.

3. **Asserção de forma não sobrou** — a linha do ambiente efetivo (`techspec.md:125`) virou resultado de verdade, e é a correção da classe que o F1 reprovou duas vezes. O que sobrou é outra coisa: asserção de resultado **sem limiar** (SIGTERM) e sem N (mutação e repetição).

---

VEREDITO: REPROVADO

Cenários exigidos: mutação do conserto do RF2 (remoção da condição) com critério de falha; asserção positiva de que a condição observa a readmissão na borda; RF4 (herança do ambiente do e2e no portão local); RF5 (ambiente efetivo sem `observabilidade` + saída no SIGTERM); RF6 (mensagem de estouro nomeia serviço/passo); RF7 (flake retentado aparece no registro); RF8 (repetição por caso afetado com N e contenção); bordas: dois jobs/portões na mesma máquina, serviço vivo porém lento saindo do pool, runner menor, `restart` com AOF, teste que só falha depois de outro no mesmo arquivo.

Cobertos: RF4 (`techspec.md:127`, mecanismo confirmado em `portao-local.ts:47` + `package.json` `test:e2e = node tools/ci/e2e.ts --manter-ambiente`); RF5 pelo ambiente efetivo (`techspec.md:125`) e pela medição do SIGTERM (`techspec.md:126`), com a condição do OTel declarada em `techspec.md:85-90`; RF6 (`techspec.md:128`); RF7 (`techspec.md:129`); "teste que só falha depois de outro" (`techspec.md:124`); RF1 como tarefa com documento commitado (`techspec.md:42-51`); `workers` rebaixado a pergunta em aberto (`prd.md:132`); ramificação de produto com a tarefa dentro da funcionalidade e o teste não desligado (`techspec.md:63-75`).

Bloqueantes:

1. **`techspec.md:60-61` e `prd.md:81` — a mutação do RF2 não tem critério de falha, então não é executável nem auditável.** "Removida a condição, o caso do handshake falha" descreve um evento probabilístico: a janela entre `aguardarSaudavel` retornar (`tools/testes/compose.ts:68-80`, lê só `{{.Health}}`) e a borda readmitir é de até ~2 s, e o handshake pode cair depois da sonda. Correção exigida: declarar quantas execuções mutadas e que fração precisa falhar (ex.: ≥ 8 de 10), **ou** tornar a janela determinística — asserir o estado do upstream logo depois de `aguardarSaudavel` via `docker compose exec borda wget -qO- 127.0.0.1:2019/reverse_proxy/upstreams` (o admin escuta só no loopback do contêiner, `infra/Caddyfile:6`, então não dá para bater do host), o que dispensa repetição.

2. **`techspec.md:55-61` — falta a asserção positiva do RF2: nada prova que a condição nova observa a readmissão.** A remoção prova necessidade, não correção. Correção exigida: uma linha na tabela da §10 que afirme, **depois** de `voltarAoBalanceamento('realtime-1')` retornar, que um pedido pela borda fixado naquela instância é atendido na primeira tentativa, e que **antes** de retornar ele não é. É essa asserção que falha se a condição for trocada por uma condição errada — a mutação sozinha não falha.

3. **`prd.md:87`, `prd.md:121` e `techspec.md:94` — o N do RF8 não é derivável do que está escrito.** "Alvo zero" não é limite superior: `N = ⌈ln(1−c)/ln(1−p)⌉` com `p = 0` é infinito, e nenhuma quantidade de verde prova p = 0. O exemplo de `prd.md:95-96` (p ≥ 10%, 95% → ~29) é sobre a taxa atual, não sobre o alvo. Correção exigida: declarar no PRD o limite superior alvo (ex.: p < 2% por execução), a confiança, a fórmula, e **onde o número fica escrito antes de a rodada começar** — o mesmo documento da etapa 1 serve.

4. **`prd.md:87` e `techspec.md:95` — "sob contenção declarada e determinística" aparece quatro vezes e nunca é definida.** Os exemplos dados (`vitest --repeats`, `--repeat-each`) são repetição, não contenção. O bloqueante G exigia contenção declarada de forma determinística, e repetição em máquina ociosa não prova nada num fenômeno que é de relógio: a máquina do Joaquim é justamente o caso em que os vermelhos não reproduzem (`prd.md:104`). Correção exigida: dizer o que carrega a máquina durante a prova (núcleos disponíveis, trabalhadores em paralelo, job concorrente), em termos reproduzíveis. (A flag do Vitest 5 é `--repeats`, não `--repeat`.)

5. **`prd.md:101-102` e `prd.md:107` — duas bordas listadas não têm cenário em lugar nenhum, e uma delas é um mecanismo diferente do que o RF2 conserta.** "Serviço vivo porém lento sai do pool por 2 falhas de sonda no meio de um caso" é a **saída** do balanceamento (`health_fails 2`, `health_timeout 3s`); o RF2 conserta só a **volta**. Se for a causa de algum dos quatro vermelhos de `borda`, tudo aqui passa e o flake fica. E "dois jobs ou portões na mesma máquina" (projeto `educa-teste` e portas fixas em `infra/teste.env`) fabrica vermelho falso que polui a linha de base do RF1 e a prova do RF8 — `techspec.md:166` só o nomeia como risco. Correção exigida: cenário para cada um na §10, ou decisão escrita de que é aceito e por quê; para o segundo, uma guarda que falhe cedo com mensagem legível (mesma classe do RF6) é o caminho barato.

Recomendações:

- `techspec.md:126`: "não reintroduziu o atraso de DNS" precisa de número. O comentário de `borda.int.test.ts:239-243` fala em "uns 3 s"; o limiar deve sair da etapa 1 e ficar escrito.
- `techspec.md:127`: trocar a invariante para "quando `test:infra` começa, só os `SERVICOS_INFRA` estão de pé". Como está, ela passa de graça em máquina limpa e não cobre a contaminação inversa, que a opção escolhida em `techspec.md:82-83` (rodar `infra` antes de `e2e`) cria: `npm run test:infra` no portão local não derruba nada — `tools/testes/integracao.setup.ts` só faz `up` idempotente, e o `down` de `tools/ci/compose.ts:45` só existe no `ci:infra`.
- `techspec.md:56-57`: além das duas opções de condição observável, existe uma terceira já pronta — o log `sonda` da borda (`infra/Caddyfile:17-23`), descrito como "o que mostra instância fora do balanceamento". E vale registrar que a opção do admin custa um `compose exec` por consulta, que é contenção adicionada no teste mais sensível a relógio.
- `techspec.md:42-51`: dizer explicitamente que a etapa 1 é a tarefa 1.0 e que nenhuma outra commita antes dela — hoje a ordem está implícita.
- `prd.md:86` / `techspec.md:129`: RF7 exige "lugar declarado, com leitor e retenção" mas não declara nenhum dos três, e depende da pergunta em aberto de `prd.md:133`. Se a resposta for "retentativa fica em zero", a linha da §10 some; vale dizer isso.
- `prd.md:105`: `restart` com AOF carregado continua sem cenário; menor gravidade que os dois do bloqueante 5, mas está listado.

## infra-guardian · 2ª rodada · REPROVADO · 2026-09-21 12:49:40 · `tasks/prd-estabilidade-da-esteira/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: deploy (borda/balanceador e o portão que segura a fila de tarefas)
Rate limit: ok (não se aplica — sem rota nova)
Fila e prioridade: ok (não se aplica)
Concorrência: protegida (não se aplica — sem escrita de domínio)
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (RF1 é a medição; nenhum alerta novo)

Correções exigidas da rodada 1: A, B, D, E, F, G, J, K e a recomendação do teto de CPU foram feitas. A alavanca que faltava para o job `infra` (E) existe agora e é o próprio RF2, que roda nesse job. O que segue abaixo é novo ou é resto do que ficou pela metade.

Bloqueantes:

1. `tasks/prd-estabilidade-da-esteira/prd.md:31` e `techspec.md:14,27,55,123` — o conserto aponta para o sítio errado, de novo. O `afterEach` do caso de `:361` **não chama** `voltarAoBalanceamento`: ele repete a lógica na mão em `infra/test/borda.int.test.ts:354-359` (`start` → `aguardarSaudavel` → `esperar(VOLTA_AO_BALANCEAMENTO_MS)`). E há mais dois `esperar(VOLTA_AO_BALANCEAMENTO_MS)` soltos, em `:270` (depois do `restart api-1`) e `:317` (depois da API travada). Trocar a espera dentro de `voltarAoBalanceamento` (`:93-96`) e a constante (`:25`) deixa intacto exatamente o sítio que o PRD acusa de produzir o vermelho — é a mesma falha que a rodada 1 chamou de no-op (achado C), um nível adiante. Correção exigida: a spec nomeia os quatro sítios (`:96`, `:270`, `:317`, `:358`), exige que toda restauração passe por um helper só, e declara que a condição observada vale para os serviços atrás da borda (`SERVICOS_ATRAS_DA_BORDA`, `:23`) enquanto os demais de `parados` (redis, storage, fila) continuam em `aguardarSaudavel`.

2. `techspec.md:17-19` e `prd.md:33-38` — a aritmética do mecanismo para de ler o Caddyfile duas linhas antes do que interessa. A spec cita `infra/Caddyfile:34-38` e conclui "readmissão de até 5 s > 3 s esperados", mas `infra/Caddyfile:40-41` tem `lb_try_duration 5s` e `lb_try_interval 250ms`: requisição que chega com o pool vazio é retentada por 5 s antes de virar 503. Somando os 3 s fixos do teste, o pool precisaria ficar vazio por mais de 8 s depois de `aguardarSaudavel` retornar. Some a isso que a sonda da borda é `/prontidao` (`Caddyfile:34`) e que o healthcheck do contêiner do realtime é **o mesmo `/prontidao`** (`infra/compose.yml:248`): quando `aguardarSaudavel` retorna, o endpoint que a borda sonda já responde 200 e falta no máximo um intervalo de 2 s. O mecanismo, como está escrito, não fecha — e o PRD o declara "estabelecido" (`prd.md:26`) enquanto a própria Tech Spec admite que não foi reproduzido (`techspec.md:148-150`). Três etapas e a decisão de produto do RF3 se apoiam nisso. Correção exigida: a spec incorpora `lb_try_duration`/`lb_try_interval` e o `/prontidao` compartilhado na conta, e a etapa 1 mede o instante da readmissão contra o instante do 503 **antes** de a etapa 2 ser declarada o conserto. A condição observável continua certa de qualquer jeito; o que não pode é a etapa 3 decidir sobre produto com uma conta que a configuração citada contradiz.

3. `techspec.md:25-32` e `:121-130` — `tools/ci/borda.test.ts` não aparece nem nos módulos afetados nem nos testes. Esse arquivo existe justamente para prender as relações entre números espalhados por quatro arquivos, e hoje só cobre a **saída** do pool (`tools/ci/borda.test.ts:47-51`: `health_interval × health_fails + 1 ≤ DRENAGEM_ESPERA_BORDA_MS`). A relação da **volta** — quanto a borda demora para readmitir e se `lb_try_duration` cobre essa janela — não tem guarda nenhuma. Quem baixar `lb_try_duration` ou subir `health_interval` amanhã ressuscita o vermelho sem nada ficar vermelho antes. Correção exigida: RF2 acrescenta a relação da readmissão em `tools/ci/borda.test.ts` (custo zero, roda no projeto `unidade`), e o arquivo entra na seção 2 e na tabela de testes.

4. `prd.md:83` e `techspec.md:79-83,127` — RF4 conserta a ordem do portão, não o acoplamento. `infra/test/borda.int.test.ts:363-367` continua montando o conjunto a parar a partir de `ps --status running`, então `npm run test:e2e` seguido de `npm run test:infra` na mão — o laço normal de quem está consertando um teste de infra, e `npm run test:e2e` tem `--manter-ambiente` fixo no `package.json:20` — reproduz a herança inteira. Pior: a guarda proposta ("nenhum serviço do e2e está de pé quando `test:infra` começa") passa por construção depois da troca de ordem, sem provar nada — é a classe "prova forma, não resultado" que a rodada 1 reprovou no achado H. Correção exigida: RF4 passa a exigir que o projeto `infra` **declare e imponha o estado de entrada** (o `globalSetup` de `tools/testes/integracao.setup.ts`, ou o equivalente do projeto, parando o que não está no conjunto declarado — `stop` de serviço parado é no-op), e a guarda afirma esse estado de entrada, não a ordem das suítes. A troca de ordem fica como o passo barato que é, não como o requisito.

Recomendações:

- **Sobre a sua pergunta do RF4 (`infra` antes de `e2e`):** a ordem é a escolha certa como passo barato e não perde o `--manter-ambiente`. Ela só não pode ser o requisito, pelo bloqueante 4. Vale registrar na spec que, com `infra` primeiro, o conjunto que `:363-367` monta vem do `SERVICOS_INFRA` do `globalSetup` mais o `up borda observabilidade` do `beforeAll` (`:238`), que traz `api-1`, `api-2`, `realtime-1` e `realtime-2` por `depends_on` (`infra/compose.yml:388-398`) — a asserção de `:367` continua valendo. Diga isso, ou a troca vira uma aposta.
- **Sobre a condição observável:** a requisição de prova, sozinha, não serve para o sítio do bloqueante 1. Naquele `afterEach` voltam **dois** upstreams, e o caso seguinte (`:438`) depende dos dois estarem no pool; qualquer 200 pela borda pode ter vindo só de um. A escolha melhor é per-upstream pela API de administração (`admin 127.0.0.1:2019`, `infra/Caddyfile:5`, alcançável por `compose exec borda`), com teto de espera e erro legível no padrão de `aguardarSaudavel`, e a requisição de prova como asserção final. Se a API de administração não devolver o estado por upstream na versão fixada (`caddy:2.11.4-alpine`), a alternativa é ler o log `sonda` que o Caddyfile já separa para isso (`:20-22`) — foi feito exatamente para "mostrar instância fora do balanceamento".
- **Sobre a fronteira da etapa 3:** a fronteira está certa (tarefa de produto dentro desta funcionalidade, antes da etapa 5, teste não desligado). Errada está a pergunta. O RF3 não separa dois estados que não têm nada em comum: (a) um upstream voltando com o outro atendendo — não existe 503 possível; (b) pool vazio — o 503 é inevitável e a única alavanca é a relação `lb_try_duration` × janela de readmissão. Só (b) é o estado testado, e em produção ele é um restart do pool inteiro, que a regra 80 item 9 já põe fora do horário letivo com deploy em rolagem. Escreva os dois estados e a alavanca de cada um; do jeito atual a pergunta é indecidível e trava a etapa 5.
- `techspec.md:34` diz "nada em código de produto exceto se o RF3 concluir defeito". Se concluir, muda `infra/Caddyfile` e `tools/ci/borda.test.ts` junto, e provavelmente um parágrafo de `docs/runbook.md` — vale antecipar na seção 2.
- `prd.md:26` chama o mecanismo de "estabelecido" e `techspec.md:148` o chama de não reproduzido. Um dos dois textos precisa ceder, independentemente do bloqueante 2.

Arquivos lidos: `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-estabilidade-da-esteira/prd.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-estabilidade-da-esteira/techspec.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-estabilidade-da-esteira/revisao-spec.md`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/borda.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/Caddyfile`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/compose.yml`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/borda.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/e2e.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/processo/portao-local.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/testes/integracao.setup.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/vitest.config.ts`.

## test-engineer · 3ª rodada · REPROVADO · 2026-09-21 12:57:55 · `tasks/prd-estabilidade-da-esteira/revisao-spec.md`

Li o PRD, a Tech Spec, o `revisao-spec.md`, o `achados-revisoes.md` (minhas rodadas 1 e 2 e as do `infra-guardian`) e conferi cada afirmação nova contra o código: `infra/test/borda.int.test.ts` (`:23`, `:25`, `:93-96`, `:270`, `:297`, `:317`, `:354-359`, `:410-441`, `:477-548`), `infra/Caddyfile` (`:34-41`, `:57-69`), `tools/ci/borda.test.ts`, `package.json` (vitest 5.0.0, `--repeats` existe — `node_modules/vitest/dist/chunks/cac.D805sv8h.js:1041`).

**Os cinco bloqueantes da rodada 2:** 1 (critério de mutação), 3 (N derivável), 4 (contenção definida e `--repeats`) e 5 (bordas com cenário) estão atendidos, e verifiquei os números. O 2 está atendido no texto, mas não na forma executável — é o que segue.

**Por que o 2 ainda não fecha.** A asserção positiva está escrita como "um pedido pela borda **fixado naquela instância** é atendido na primeira tentativa; antes de retornar, não é". Não existe mecanismo para isso em três dos quatro sítios, e no quarto ela não discrimina:

- `lb_policy cookie educa_realtime` existe **só** no bloco do realtime (`infra/Caddyfile:61`). O bloco da API (`:66-69`) usa a política padrão: nenhum pedido pode ser fixado em `api-1` ou `api-2`. Os sítios `:270`, `:297` (`voltarAoBalanceamento('api-2')`) e `:317` são todos de API, e em todos eles a **outra** instância está de pé — o pedido pela borda volta 200 com ou sem readmissão. Escrita ao pé da letra, a asserção vira "a borda respondeu 200": passa igual se a condição observar o sinal errado, que é exatamente o que ela deveria pegar (regra 40).
- Metade negativa ("antes de retornar, não é atendido") é **falsa** nesses três sítios pelo mesmo motivo. Ela só vale enquanto o pool está vazio — o caso de `:358`/`:547-548`, onde voltam os dois realtimes.
- No `:358`, onde o pool fica vazio, qualquer 200 pode ter vindo de um upstream só: é o mesmo ponto que o `infra-guardian` levantou na rodada 2 e que a Tech Spec aceita em `techspec.md:63-64` para a condição — mas a asserção positiva foi escrita sem esse cuidado.
- Não há discriminador de instância na resposta: nenhum cabeçalho, e `service.instance.id` só vai para OTel (`packages/nucleo/src/telemetria/iniciar.ts:72`). Os dois que existem hoje têm ressalva: o `sid` do socket.io morre no restart do processo, e o `educa_realtime` é reescrito pela borda quando o upstream do cookie está fora (é o que `:438` prova). Provar pela porta direta (`API_2_DIRETA`, `:285`) é o sinal errado — é o mesmo que `aguardarSaudavel` já lê.

A mutação, essa sim, ficou executável e auditável: `≥ 8 de 10` é critério, e a alternativa determinística (asserir o estado por upstream logo depois de `aguardarSaudavel`, mostrando a janela entre saúde do contêiner e readmissão na borda) é melhor que a repetição e não é circular — ela mede a lacuna, não a condição por ela mesma.

**N do RF8:** saiu de promessa. `prd.md:118-121` tem fórmula, limite superior, os dois números (149 / 59), a confiança e o lugar onde fica escrito antes da rodada; `techspec.md:115-117` amarra N e contenção ao documento da etapa 1. A contenção deixou de ser sinônimo de repetição (`prd.md:122-125`). Aceito.

**Tabela da seção 10:** cobre RF4 (`:149`), RF5 (`:147-148`), RF6 (`:153`), RF7 (`:154`), RF8 (`:155`), RF9 (`:150`) e as duas bordas novas (`:151`, `:152`). RF1 e RF3 não têm linha e não precisam — são documento commitado e decisão escrita —, mas isso merece uma nota na tabela para o `/criar-tasks` não procurar teste. O que falta de verdade é a linha da asserção positiva do RF2: hoje a tabela tem só a mutação (`:145`) e a sequência `:361` → handshake (`:146`), e a própria spec diz em `techspec.md:70-72` que é a positiva que falha quando a condição observa o sinal errado.

```
VEREDITO: REPROVADO

Cenários exigidos: mutação do RF2 com critério · asserção positiva de que a condição observa a
  readmissão na borda, por sítio · RF4 (estado de entrada imposto) · RF5 (ambiente efetivo sem
  `observabilidade` + saída no SIGTERM com limiar) · RF6 (mensagem nomeia serviço/passo) · RF7
  (flake retentado no registro) · RF8 (repetição com N e contenção declarados antes) · RF9
  (relação da volta presa em `tools/ci/borda.test.ts`) · bordas: saída do pool por instância viva
  porém lenta, duas execuções na mesma máquina, teste que só falha depois de outro.

Cobertos: mutação com critério (`techspec.md:73-75`) · RF4 (`techspec.md:98-100`, `:149`) · RF5
  (`:147-148`, com o limiar vindo da etapa 1 em `techspec.md:52-53`) · RF6 (`:153`) · RF7 (`:154`)
  · RF8 com N derivável e contenção definida (`prd.md:118-125`, `techspec.md:115-119`) · RF9
  (`techspec.md:27`, `:150`) · candidata 2 / saída do pool (`prd.md:136-139`, `techspec.md:151`) ·
  duas execuções na mesma máquina (`prd.md:130-131`, `techspec.md:152`) · contaminação de ordem
  (`:149`).

Bloqueantes:
  1. `techspec.md:70-72` e `prd.md:102` — a asserção positiva do RF2, a que a própria spec diz
     ser a principal, não é executável como está, e escrita ao pé da letra não falharia se a
     condição observasse o sinal errado. "Pedido fixado naquela instância" não existe para
     `api-1`/`api-2`: `lb_policy cookie` está só no bloco do realtime (`infra/Caddyfile:61`); o
     bloco da API (`:66-69`) usa a política padrão. Nos sítios de API (`:270`, `:297`, `:317`) a
     outra instância está de pé, então o pedido pela borda é atendido com ou sem readmissão — a
     metade "antes de retornar, não é atendido" é falsa ali — e a asserção degenera em "retornou
     200" (regra 40). No `:358`, único sítio de pool vazio, voltam dois upstreams e um 200 não diz
     qual atendeu. Não há discriminador de instância na resposta (nenhum cabeçalho;
     `service.instance.id` só vai para OTel, `packages/nucleo/src/telemetria/iniciar.ts:72`), o
     `sid` morre no restart do processo e o `educa_realtime` é reescrito pela borda quando o
     upstream do cookie está fora (é o que `borda.int.test.ts:438` prova). Provar pela porta direta
     (`API_2_DIRETA`, `:285`) é o sinal que `aguardarSaudavel` já lê.
     Correção exigida: declarar a asserção positiva **por sítio**, com o discriminador que existe
     hoje, e pôr a(s) linha(s) na tabela da §10, onde hoje só há a mutação (`techspec.md:145`).
     Três caminhos que servem, um deles basta por sítio: (a) realtime — pedido com o cookie
     capturado antes do `stop` e asserção de que a resposta **não** reescreve `educa_realtime`
     (hash igual), porque a reescrita é a prova de que a borda caiu na outra instância; (b) API —
     manter a outra instância parada durante a asserção, de modo que um 200 na primeira tentativa
     só possa ter vindo da instância restaurada; (c) por sítio onde (a) e (b) não couberem,
     declarar explicitamente que a prova é a da lacuna (admin diz "fora do pool" logo depois de
     `aguardarSaudavel` e "no pool" depois do helper) e que não há asserção pela borda ali. E
     retirar a metade negativa ("antes de retornar, não é atendido") dos sítios em que a outra
     instância está de pé, onde ela não vale.

Recomendações:
  - `prd.md:153` — a métrica ainda diz "alvo zero, com o N do RF8", que é a combinação que
    `prd.md:118-121` declara impossível. Trocar por "abaixo do limite superior declarado", como o
    RF8 já diz, para ninguém escrever "zero" no documento da etapa 1.
  - `techspec.md:150` — escrever a desigualdade da volta, no estilo de `tools/ci/borda.test.ts:47-51`
    (`health_interval × health_passes + folga ≤ lb_try_duration`). "Fica vermelho se baixar" sem
    a relação escrita é o caminho de volta à asserção de forma.
  - `techspec.md:66` — se a condição cair no log `sonda`, declarar como ele é lido (`compose logs
    --since` do instante do `start`), ou a condição herda o problema de relógio que está corrigindo.
  - `prd.md:107` e `techspec.md:154` — RF7 continua sem lugar, leitor e retenção, dependendo da
    pergunta em aberto de `prd.md:165`. Vale dizer em uma linha que, se a resposta for "retentativa
    fica em zero", a linha da §10 some junto.
  - `prd.md:135` — `restart` com AOF carregado segue listado como borda e sem cenário nem decisão
    escrita de descarte. Menor que as duas bordas já resolvidas, mas é o último item pendente da §7.
  - Tabela da §10 — uma nota dizendo que RF1 e RF3 se provam por documento commitado e decisão
    escrita, não por teste, evita que o `/criar-tasks` invente teste para eles.
```

## infra-guardian · 3ª rodada · REPROVADO · 2026-09-21 12:58:15 · `tasks/prd-estabilidade-da-esteira/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: deploy (borda/balanceador e o portão que segura a fila de tarefas)
Rate limit: ok (não se aplica — sem rota nova)
Fila e prioridade: ok (não se aplica)
Concorrência: protegida (não se aplica — sem escrita de domínio)
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (RF1 é a medição; nenhum alerta novo)

Correções exigidas da rodada 2: a 1 e a 3 estão feitas e conferem com o código (`:96`, `:270`, `:317`, `:358` existem e o `afterEach` de `:354-359` repete a lógica na mão; `SERVICOS_ATRAS_DA_BORDA` é `:23`; RF9 entrou). A 2 está feita no texto — a seção 1 agora separa fato de causa e a aritmética incorpora `lb_try_duration` e o `/prontidao` compartilhado (`infra/compose.yml:248` confere). A 4 está feita pela metade: o requisito virou o estado de entrada, mas a prova continua passando por construção.

Respondendo às três perguntas: a seção 1 agora descreve o estado do conhecimento honestamente, **exceto num ponto** — ela continua tratando `lb_try_duration` como se valesse para a requisição que falhou. Falta uma candidata, e é a que a evidência aponta. O RF4 ataca o acoplamento certo, mas a guarda dele ainda não prova nada.

Bloqueantes:

1. `tasks/prd-estabilidade-da-esteira/prd.md:53-62` (as três candidatas), `:101` (prova do RF1), `:103` (RF3) e `techspec.md:48` e `:85-88` — **falta a quarta candidata, e a medição não consegue separar nenhuma delas porque não olha a origem do 503.** A saída observada (`[200, 200, 503, 400, 400, …]`) é o `comCookie` de `borda.int.test.ts:434`: vinte **POSTs** em paralelo. E `borda.int.test.ts:105-106` diz, no próprio repositório: *"O GET é repetido pela borda se a conexão cair; o POST não, e é ele que mostra requisição derrubada."* A conta da seção 1 ("requisição que chega com o pool vazio é retentada por 5 s antes de virar 503") só vale para a requisição que a borda repete — a candidata que falta é **falha de conexão numa requisição não repetível contra upstream que está no pool** (conexão keepalive morta para o contêiner que acabou de ser parado e religado, ou porta ainda recusando no `start`), que vira 502 e sai como 503 pelo `handle_errors 502 503 504` do `infra/Caddyfile:76-82`. Pior: como esse `handle_errors` mapeia 502 e 504 para 503 com o mesmo envelope, **o status sozinho nunca diz qual caminho produziu o 503**, e o log do proxy que diria está excluído de propósito (`Caddyfile:13-17`, regra 20 item 9) — sobra o log `sonda` (`Caddyfile:19-22`), que mostra a pertinência ao pool no instante. Correção exigida: (a) a seção 1 acrescenta essa candidata e declara que a retentativa de 5 s não cobre requisição não repetível; (b) o RF1 passa a registrar, para cada 503, **o estado do pool no instante pelo log `sonda` e o método da requisição**, não só o instante da readmissão — sem isso a etapa 1 não separa "pool vazio" de "upstream no pool com conexão morta"; (c) o RF3 deixa de afirmar que no estado (b) "a única alavanca é `lb_try_duration`": se a requisição não é repetida, a alavanca é o desenho de drenagem e keepalive (`packages/nucleo/src/instancia/drenagem.ts`, `keepalive 30s`), e isso tem consequência direta de produto — é o POST do aluno salvando resposta de prova durante rolagem de instância (regra 80, item 6).

2. `tasks/prd-estabilidade-da-esteira/prd.md:104` (coluna "Como se prova" do RF4) e `techspec.md:98-100` e `:149` — **a guarda do estado de entrada passa por construção, que é o achado H da rodada 1 de novo.** Se o `globalSetup` do projeto `infra` impõe o estado e a guarda, logo depois, afirma o estado, ela fica verde em runner limpo mesmo com a imposição removida: em CI nada está de pé antes. Some a isso que `vitest.config.ts` roda o `globalSetup` **uma vez por projeto**, e os arquivos de infra rodam em série depois dele (`fileParallelism: false`) — `alertas.int.test.ts:81` e `metricas.int.test.ts:89` sobem `observabilidade` e não a param, então o estado no início de `borda.int.test.ts` não é o estado de entrada do projeto. Correção exigida: o RF4 declara que a prova **fabrica o estado sujo** (subir um serviço fora do conjunto declarado, executar a imposição, afirmar que ele foi parado e que o conjunto de `borda.int.test.ts:363-367` não o inclui), e diz o que acontece com o que sobe **durante** a execução do projeto — ou o `borda.int.test.ts` para de montar `parados` a partir de `ps --status running` e passa a usar conjunto declarado, que é o conserto direto do acoplamento.

Recomendações:

- `techspec.md:69-71` — a metade negativa da asserção positiva ("antes de retornar, não é atendido") é uma corrida: se a borda readmitir entre o `start` e a checagem, ela fica vermelha sozinha, dentro do arquivo mais instável da suíte. Afirme o estado "fora" pela mesma observação (estado por upstream / log `sonda`) logo após o `start`, ou restrinja a metade negativa à execução mutada.
- `prd.md:109` (RF9) — nomeie qual número representa a janela de readmissão no arquivo, já que ela não existe como diretiva: o que dá para prender é `health_interval × health_passes ≤ lb_try_duration` (2 s ≤ 5 s). Sem isso o RF9 vira "escrever um teste sobre um número que não está escrito".
- `prd.md:101` — vale dizer que a linha de base precisa separar o 503 do teste do 503 da aplicação (`packages/nucleo/src/identidade/guarda-sessao.ts:82`, `apps/api/src/sessao/senha/semaforo-de-hash.ts:314`), que usam o mesmo envelope e o mesmo status: nas rajadas de `borda.int.test.ts` eles são possíveis, e contá-los como flake polui a linha de base.
- `techspec.md:34` — se a etapa 3 concluir defeito de produto, o `docs/runbook.md` muda junto (regra 80, item 10); está citado, mas não aparece na tabela de módulos da seção 2.

## infra-guardian · 4ª rodada · REPROVADO · 2026-09-21 13:06:04 · `tasks/prd-estabilidade-da-esteira/revisao-spec.md`

Auditei o diff da rodada 4 (PRD seções 1, RF1, RF3, RF4, RF9; Tech Spec etapas 1-4, seções 2 e 7c) contra o código citado.

**As duas correções exigidas da rodada 3:** a 1 está feita e confere (candidata 4 em `prd.md:56-58`, o não-distinguir do status em `:60-62`, RF1 em `:95`, RF3 (c) em `:97`, etapa 3 (c) em `techspec.md:90-93`). A 2 está feita na metade que importava — a prova do RF4 agora fabrica o estado sujo (`prd.md:98`, `techspec.md:108-110`) — mas a outra metade, "o que sobe durante o projeto", foi respondida com uma afirmação que o código contradiz.

**Resposta às suas duas perguntas.** A candidata 4 está certa como mecanismo — melhor até do que você escreveu: `compose stop` manda SIGTERM e passa pela drenagem, então o caminho do teste **é** o caminho de produção, e o transporte do Go só repete requisição em conexão ociosa morta quando ela é replayable (sem corpo / idempotente); POST com corpo não é, vira erro de conexão, 502, 503 pelo `handle_errors`. Mas **acionável ela ainda não é**, pelo motivo do bloqueante 2: nenhum 503 da suíte carrega instante, e o log `sonda` só registra transição. A ligação com a regra 80 item 6 está na proporção certa, não exagerada — o que falta é nomear a alavanca que a própria regra prescreve (ver recomendações).

VEREDITO: REPROVADO
Caminho quente tocado: deploy (borda/balanceador e o portão que segura a fila de tarefas)
Rate limit: ok (não se aplica — sem rota nova)
Fila e prioridade: ok (não se aplica)
Concorrência: protegida (não se aplica — sem escrita de domínio)
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (RF1 é a medição; `docs/runbook.md` entrou na tabela de módulos)

Bloqueantes:

1. `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-estabilidade-da-esteira/techspec.md:110-112` — **a afirmação sobre o que sobe durante o projeto está errada, e é justamente a metade da correção 2 da rodada 3.** A spec diz "`alertas` e `metricas` sobem `observabilidade` e não o param". Os dois param: `infra/test/alertas.int.test.ts:93` faz `stop ...SERVICOS` com `SERVICOS` incluindo `observabilidade` (`:30`), e `infra/test/metricas.int.test.ts:113` faz o mesmo com `SERVICOS` de `:24`. O que de fato sobra no meio do projeto é outro, e nos dois sentidos: `alertas.int.test.ts:87` sobe `redis-cache` no `afterAll` e **não** o para (ele não está em `SERVICOS`), e `metricas.int.test.ts:88` para `PROCESSOS_DA_FILA` no `beforeAll` e nunca os religa. Somado a `vitest.config.ts` não declarar `sequence.sequencer` — a ordem dos arquivos do projeto `infra` não é alfabética nem estável —, o conjunto que `borda.int.test.ts:363-367` monta a partir de `ps --status running` varia entre execuções, que é exatamente o acoplamento que o RF4 diz remover. Correção exigida: trocar a frase pelos serviços certos, com `arquivo:linha`, e declarar o que a imposição do `globalSetup` faz com mudança **durante** o projeto (ela roda uma vez só, por `vitest.config.ts`), ou fechar pela alternativa já escrita — `:363-367` passa a usar conjunto declarado, e aí o RF4 cobre o mecanismo inteiro em vez do estado de entrada apenas.

2. `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-estabilidade-da-esteira/prd.md:95` (RF1) e `techspec.md:44-47` (etapa 1) — **a correlação exigida não é executável com o instrumento atual: nenhum 503 tem instante.** `infra/test/borda.int.test.ts:98-102` define `Resultado` como `{ pedido, status, esperado }`, sem carimbo de tempo; `:167-176` (`inesperados`) agrega por `pedido + status` e **descarta ordem e tempo**; e a saída observada que originou tudo, `comCookie` em `:434`, é um `Promise.all` que guarda só `resposta.status`. Do outro lado, o `log sonda` (`infra/Caddyfile:18-22`) registra transição de upstream ("host is up"/"host is down"), não estado contínuo. Sem o instante de cada 503 não há contra o que correlacionar a transição, e a etapa 1 termina onde estamos hoje: "um 503 entre vinte POSTs, momento desconhecido". Correção exigida: o RF1 declara que o instrumento passa a registrar, por 503, **o instante** (e, no bloco do realtime, a qual upstream o cookie prendia, já que `lb_policy cookie` está só em `Caddyfile:61`), e a tabela de módulos da `techspec.md:24` inclui a mudança em `rajada`/`Resultado`/`inesperados` e no caso de `:426` — hoje ela só lista os quatro sítios da espera fixa.

Recomendações:

- `techspec.md:90-93` e `prd.md:97` (RF3 (c)) — a spec acerta ao excluir a retentativa como alavanca (repetir POST na borda seria escrita dupla, regra 80 item 7), mas nomeia só drenagem e keepalive. A regra 80 item 6 prescreve **gravação idempotente e reenvio no cliente**, que é a alavanca mais barata e a única que cobre o caso sem drenagem (crash, OOM, SIGKILL). Vale escrever, para a tarefa de produto não nascer mirando só `Caddyfile`.
- `prd.md:56-58` — nomear o mecanismo exato dá o que procurar na etapa 1: conexão ociosa do pool da borda para instância que já saiu, e o transporte do Go só repete requisição replayable. Junto com `Caddyfile:43-45` (`keepalive 30s` menor que a ociosidade de 65 s da instância), isso diz que a janela de risco é a conexão aberta há menos de 30 s, não qualquer uma.
- `techspec.md:61-62` — o `compose logs --since` lê do serviço `borda`; o `subirBordaDescartavel` (`borda.int.test.ts:190+`) já tem `logs()` próprio. Dizer qual dos dois vale em cada sítio evita a etapa 2 nascer lendo o log errado.
- `prd.md:156` — a linha ainda diz "qual das **três** candidatas", já são quatro.

## test-engineer · 4ª rodada · REPROVADO · 2026-09-21 13:07:30 · `tasks/prd-estabilidade-da-esteira/revisao-spec.md`

Li a spec (PRD e Tech Spec), o `revisao-spec.md`, o `infra/Caddyfile`, o `infra/test/borda.int.test.ts` inteiro e o `tools/ci/borda.test.ts`. Confirmo o que você conferiu: `lb_policy cookie educa_realtime` está só no bloco do realtime (`infra/Caddyfile:61`); o bloco da API (`:66-69`) usa a política padrão. A decisão de declarar a positiva por sítio está certa.

As duas perguntas, respondidas direto:

**1. As três positivas falhariam se a condição observasse o sinal errado? Não — as três passam com condição prematura.** O motivo é um só e está no mesmo bloco que você citou: `infra/Caddyfile:40-41` tem `lb_try_duration 5s` com `lb_try_interval 250ms`. Essa diretiva faz a borda **repetir a seleção de upstream internamente**, segurando o cliente, quando nenhum upstream está disponível — é o caso "pool vazio", anterior a qualquer envio, e portanto vale também para POST (o `:105-106` do teste fala de conexão que cai *depois* de a requisição sair, que é outro caminho). O cliente vê 200 dos dois jeitos: "atendido na primeira tentativa" **não é observável do lado de fora**. A janela que a condição existe para fechar (`health_interval 2s × health_passes 1`, mais `health_timeout 3s`) cabe inteira dentro dos 5 s de mascaramento. Uma condição que retorne 2 s cedo passa nas três asserções.

**2. A tabela da seção 10 cobre os RF?** Sim, no inventário: RF2, RF4, RF5 (duas linhas), RF6, RF7, RF8, RF9 têm linha, e RF1 e RF3 têm a não-linha escrita com motivo. O buraco não é de cobertura, é de força — nas linhas do RF2 (`techspec.md:148-151`) — e de sítios do RF2 que o inventário de quatro sítios não alcança.

---

VEREDITO: REPROVADO

Cenários exigidos: mutação da condição (≥ 8/10) · positiva por sítio no realtime de pool vazio · positiva por sítio nos sítios de API · negativa onde o pool fica vazio · sequência `:361` + handshake sob contenção declarada · ambiente efetivo do e2e · saída no SIGTERM com e sem coletor · estado de entrada sujo fabricado (RF4) · relação `health_interval × health_passes ≤ lb_try_duration` (RF9) · saída do pool com instância viva porém lenta (candidata 2) · duas execuções na mesma máquina · estouro de prazo que nomeia · caso que passa na segunda tentativa · repetição com N declarado · RF1 e RF3 por documento e decisão escrita.

Cobertos: todos têm linha na tabela ou não-linha justificada. Faltam força em três delas e sítios em duas.

Bloqueantes:

1. **`techspec.md:68-72` e `techspec.md:149-150` (linhas da tabela), `prd.md:96` — as três positivas passam com condição prematura, por `infra/Caddyfile:41`.** `lb_try_duration 5s` faz a borda esperar e repetir a seleção por até 5 s quando não há upstream disponível, e devolver 200 ao fim. "Um 200 na primeira tentativa só pode ter vindo da restaurada" é verdade sobre *qual* instância atendeu, e falso sobre *quando* ela entrou no pool — que é o que a condição prova. Correção exigida: cada sonda da positiva precisa de um observável que `lb_try_duration` não saiba fabricar — prazo de cliente declarado e bem abaixo de 5 s (`AbortSignal.timeout`), **ou** asserção sobre o tempo medido da resposta contra um limiar escrito na spec. O limiar (ou o prazo) entra na spec, não na implementação. A mesma correção vale para a metade negativa de `techspec.md:77-78`: um pedido feito "antes de a condição retornar" também volta 200 dentro dos 5 s, a menos que o prazo do cliente seja menor que `lb_try_duration` ou que ele seja tomado com os serviços comprovadamente parados havia mais que isso — e isso precisa estar escrito.

2. **`techspec.md:68-70` e `techspec.md:149` — a positiva do realtime passa por vacuidade quando o pool está vazio.** `handle_errors 502 503 504` (`Caddyfile:75-81`) responde sem `Set-Cookie`; a política de cookie só reescreve quando **escolhe** um upstream. Logo, "a resposta não reescreve `educa_realtime`" é verdadeira num 503 — exatamente o estado que a asserção deveria excluir. É asserção que sempre passa no ramo que importa (regra 40). Correção exigida: a positiva do realtime é **conjunção** — handshake bem-sucedido dentro do prazo declarado **e** ausência de reescrita do cookie. A tabela da seção 10 precisa carregar as duas metades, porque é dela que a tarefa é escrita.

3. **`techspec.md:68-74` versus `infra/test/borda.int.test.ts:484, :492, :499, :547, :548` — cinco chamadas do helper ficam sem asserção declarada, e o inventário de pool vazio está incompleto.** `voltarAoBalanceamento` (`:93-96`) é chamado de seis lugares, não de um: `:297` (API), `:484`, `:492`, `:499` (realtime com a outra instância de pé) e `:547-548` (realtime-1 restaurada **com realtime-2 ainda parada** — pool vazio, dentro do caso do log). Duas consequências: (a) a frase "a metade negativa vale só onde o pool fica vazio (`:358`)" é factualmente incompleta — `:547` é o segundo sítio de pool vazio; (b) os sítios de `:484` a `:548` caem no terceiro caminho, "a prova é a da lacuna", cuja segunda metade (`admin` diz "no pool" depois do helper) **lê o mesmo sinal que a condição esperou** — é tautológica e não falharia com sinal errado; só a primeira metade ("fora do pool logo depois de `aguardarSaudavel`") prova algo. Correção exigida: enumerar os seis sítios de chamada com o estado do pool de cada um, dizer qual das duas provas (cookie fixado ou instância única de pé) se aplica em cada um, e declarar que a lacuna sozinha não conta como positiva — ela prova a existência da lacuna, não a corretude da condição.

Recomendações:

- `techspec.md:71-72` no sítio `:270`: a asserção cai com a `rajada` ainda ativa (`carga.parar()` só em `:271`), e parar a api-2 ali faz a asserção existente `inesperados(resultados)` passar a cobrir pool de instância única. Ou põe a sonda depois de `:271`, ou declara essa mudança do que o caso prova.
- Linha do RF9 (`techspec.md:155`): dizer que a desigualdade protege só o caminho de falha de seleção. Ela não cobre a candidata (c) — POST cuja conexão morre depois de sair —, que é justamente a que a evidência aponta.
- RF7 (`techspec.md:159`, `prd.md:101`): nenhum módulo da seção 2 é dono do registro de flake, e lugar, leitor e retenção seguem sem declaração. Enquanto a pergunta em aberto não fecha, o ramo testável hoje é o outro: guarda que afirma `retries = 0` nas configurações de Vitest e Playwright.
- Inventário com dois vocabulários: `:96` é o corpo do helper e `:297` é uma chamada dele; a seção 1 lista os quatro sítios de `esperar(...)` no fonte e a etapa 2 lista chamadas. Usar um só ("três esperas inline em `:270`, `:317`, `:358` + helper em `:96` com seis chamadas") evita que a tarefa conserte quatro e deixe cinco.
- `borda.int.test.ts:499` restaura depois de `SIGKILL`, sem drenagem: é o sítio mais próximo da candidata (c) e vale nomeá-lo na etapa 1 como lugar de procurar a evidência de keepalive morto.
- Confirmar na versão fixada (`caddy:2.11.4-alpine`, `infra/compose.yml:385`) que o hash do cookie é do endereço configurado (`realtime-1:3000`) e não do IP resolvido; se fosse o IP, o `start` mudaria o cookie e a asserção ficaria vermelha pelo motivo errado.
- Borda do PRD "runner com menos núcleos, ou mais carregado" (`prd.md:123`) não tem linha: ou entra na definição de contenção do documento da etapa 1, ou vira descarte escrito como o do AOF.
- Cabeçalho do `revisao-spec.md:12` está defasado: os documentos estão em 1.965 e 1.999 palavras (`wc -w`), não 1.538 e 1.600. Continuam abaixo do teto por documento, mas a Tech Spec está com margem de uma palavra — as correções acima terão de tirar texto de outro lugar, e a renarrativa do F1 segue sendo o candidato.

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-estabilidade-da-esteira/techspec.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-estabilidade-da-esteira/prd.md`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/Caddyfile`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/borda.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/borda.test.ts`.

## test-engineer · 5ª rodada · REPROVADO · 2026-09-21 14:08:11 · `tasks/prd-estabilidade-da-esteira/revisao-spec.md`

Li os dois documentos inteiros, o `revisao-spec.md` e o código citado. As três perguntas primeiro, porque as respostas são os bloqueantes.

**O recorte é honesto?** Em três quartos, sim. Adiar a asserção que discrimina até conhecer o mecanismo é a decisão certa, e os bloqueantes 1‑3 da rodada 4 estão preservados como roteiro. Mas a fase 1 ficou com dois trabalhos difíceis reduzidos a uma linha cada — de onde sai o "estado do pool" e onde o log sobrevive ao vermelho — e ficou com um conserto dentro dela (RF4/RF5) que muda o objeto medido, que é justamente o que a regra central da fase proíbe.

**A etapa 1 basta para a etapa 3 correlacionar?** Não, como está escrita. Ela produz instante e método; não produz o estado do pool, e a fonte de correlação que a etapa 3 pretende ler não existe mais quando o vermelho acontece na esteira.

**RF2, RF3 e RF6 sem linha na tabela de testes?** Aceitável e correto — "a taxa foi 8%" não é regra de negócio, e forçar teste sobre medição produziria a asserção decorativa que a regra 40 condena. Com duas condições: o documento precisa de caminho nomeado e de ser entregável da tarefa, e o que dentro do RF2 é **mecanismo** (separar o 503 da aplicação) não pode ficar sem observável nomeado.

---

VEREDITO: REPROVADO

Cenários exigidos: instrumentação que sobrevive ao vermelho (instante, método, estado do pool) · imposição do estado de entrada com estado sujo fabricado · vazamento no meio do projeto (`alertas`, `metricas`) sem passar por construção · duas execuções colidindo na mesma máquina · 503 da aplicação separado do 503 da borda · linha de base colhida antes de qualquer conserto · isolamento do projeto `infra` sem afetar o projeto `integracao`.

Cobertos: estado sujo fabricado (techspec.md:98) e colisão de duas execuções (techspec.md:100) estão bem desenhados — o primeiro fecha o achado H da rodada 1, e é a melhor parte da spec. Instrumentação tem linha (techspec.md:101), mas ver B1. Vazamento no meio do projeto tem linha (techspec.md:99), mas ver B6.

Bloqueantes:

1. **`techspec.md:39-47` (etapa 1) não produz o "estado do pool" que `prd.md:73` (RF1) e `techspec.md:101` exigem.** A etapa 1 acrescenta instante, método e o upstream do cookie. Estado do pool não sai de lugar nenhum: a API de administração do Caddy escuta em `127.0.0.1:2019` **dentro** do container (`infra/Caddyfile:6`), inalcançável do processo de teste sem `compose exec`, que custa centenas de ms e perturbaria a própria rajada — mudando o objeto medido. Correção exigida: declarar a fonte (amostragem periódica do `/reverse_proxy/upstreams` por um `exec` em paralelo à rajada, com o custo medido; ou reconstrução pós‑hoc a partir do log `sonda`). Se for reconstrução, RF1 e a linha `techspec.md:101` precisam parar de dizer "no momento"/"traz estado do pool" — do jeito que estão, o teste exigido não pode passar.

2. **`techspec.md:64-69` manda correlacionar com `compose logs --since`, e na esteira esse log já foi embora.** `tools/ci/compose.ts:43-46`: em falha, o job roda `logs --no-color --tail 200` (200 linhas no total, para os 19 serviços) e em seguida `down --volumes --remove-orphans`. O log `sonda` da borda na janela do caso não chega ao artefato, e os quatro vermelhos que interessam aconteceram ali. Correção exigida: a coleta da janela do log `sonda` (e ver B3) acontece **dentro do teste**, junto ao caso, e vira arquivo publicado pelo job — e isso pertence à etapa 1, não à 3, porque é a condição de a etapa 3 existir.

3. **RF2 (`prd.md:74`) exige separar o 503 da aplicação, e pelo envelope isso é impossível; e a candidata que ele esconde não está na lista das quatro.** `packages/nucleo/src/erro/erro-de-dominio.ts:23` fixa `TENTE_DE_NOVO_PADRAO_SEGUNDOS = 5`, exatamente o `Retry-After 5` de `infra/Caddyfile:78-79`; `filtro-global.ts:72-79` devolve o mesmo código, a mesma mensagem do catálogo, um `requisicaoId` UUID e os mesmos três cabeçalhos. São indistinguíveis de fora. Pior: o caso de `borda.int.test.ts:361` derruba **todas** as conexões das APIs com o Postgres (`:375`), que é a condição exata em que `packages/nucleo/src/identidade/guarda-sessao.ts:82` devolve 503 — então o 503 da aplicação não é só poluição da linha de base, é uma **quinta candidata** para o vermelho, e `techspec.md:118` (premissa 3) a descarta por afirmação. Correção exigida: nomear o observável da separação — o log `http.erro` das APIs (`filtro-global.ts:59-63`) já carrega status e código e é correlacionável por instante, e precisa ser coletado junto com o `sonda` (B2) — e acrescentar a quinta candidata ao RF3, ou escrever o descarte com evidência.

4. **A ordem das etapas destrói a linha de base.** `techspec.md:49` põe a etapa 2 (RF4/RF5) antes da etapa 3 (RF2/RF3). RF4/RF5 mudam o conjunto que `borda.int.test.ts:364-367` monta, logo mudam a duração do ciclo `stop`/`start` do caso — que é o mecanismo da candidata 1. A métrica de `prd.md:111` pede "vermelhos do portão local **antes e depois** do RF4 e do RF5", e esse "antes" não existe na ordem escrita. E a regra central da fase (`prd.md:82-83`) é violada pela própria etapa 2: nenhuma asserção muda, mas o ambiente do caso medido muda. Correção exigida: a linha de base do RF2 e a coleta do RF3 rodam **antes** da etapa 2, e a spec diz qual das duas medições é a linha de base contra a qual a fase 2 será comparada (`prd.md:109`).

5. **O sítio da imposição do RF4 é compartilhado com o projeto `integracao`.** `vitest.config.ts:13` dá o mesmo `globalSetup: ['tools/testes/integracao.setup.ts']` aos projetos `integracao` e `infra`, e `techspec.md:27` nomeia esse arquivo como o lugar da imposição do estado de entrada "do projeto `infra`". Mais de vinte testes do projeto `integracao` param e religam serviços do compose pelo mesmo helper (`apps/despachante/test/redis-fora.int.test.ts`, `apps/api/test/prontidao.int.test.ts`, entre outros): uma imposição cega os alcança também. Correção exigida: dizer como o setup distingue o projeto (o `globalSetup` do Vitest recebe o projeto) ou separar o arquivo, e acrescentar à guarda a afirmação de que o conjunto declarado do `infra` **não** é imposto ao `integracao`.

6. **A linha de teste do RF5 (`techspec.md:99`) passa por construção sob a própria saída preferida da spec.** `techspec.md:59-60` diz que a saída preferida é `:363-367` passar a usar conjunto declarado. Se ela for tomada, "o que `alertas` e `metricas` sobem ou param não muda o conjunto que `:363-367` monta" vira verdade por construção — é a classe de prova de forma que o achado H da rodada 1 já reprovou. Some-se que trocar `:364-367` por lista declarada muda o que `:368` afirma na prática e muda o `stop` do caso, o que colide com a regra central da fase. Correção exigida: ou a prova é feita contra o ambiente efetivo depois de rodar os três arquivos em ordem forçada (um subprocesso que roda `alertas`, `metricas` e `borda` nessa ordem e afirma o conjunto de `ps --status running` na entrada do terceiro), ou a saída preferida é abandonada nesta fase e fica para a fase 2.

Recomendações:
- Nomear o caminho do documento de medição (ex.: `tasks/prd-estabilidade-da-esteira/medicao.md`) em `techspec.md:31` e declará-lo entregável da tarefa; "documento commitado" sem caminho não é conferível pelo portão.
- `prd.md:12-14` diz "quatro em `borda.int.test.ts` ou vizinhos" e não diz onde caíram os outros três. RF2 mede por job; atribuir os sete às suas jobs ancora a linha de base e mostra se RF4/RF5 sequer alcançam três deles.
- As citações são `:363-367`, mas `:363` é o comentário — o código começa em `:364`. Mesmo caso em `techspec.md:26` para `inesperados` (`:168-176`).
- O formato do log já é conhecido: `"logger":"http.handlers.reverse_proxy.health_checker.active"` com `"ts"` numérico, usado em `borda.int.test.ts:586`. Citar isso na etapa 3 poupa uma descoberta.
- A premissa 1 (`techspec.md:114-116`) pode fechar de graça: enquanto o host está saudável a sonda não escreve nada, então "pool cheio" é ausência de evidência, não evidência. Declarar já, porque isso define o balde residual onde moram a candidata 4 e o 503 da aplicação.
- A recomendação da rodada 4 — `borda.int.test.ts:499`, restauração depois do `SIGKILL`, como lugar mais provável da evidência de keepalive morto — não foi reaproveitada na etapa 3, e é candidata natural a sítio de coleta.
- Tamanho: 1.352 e 1.176 palavras. O achado aberto de tamanho do cabeçalho do `revisao-spec.md` está fechado e pode ser marcado como tal.

## infra-guardian · 5ª rodada · REPROVADO · 2026-09-21 14:08:14 · `tasks/prd-estabilidade-da-esteira/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: nenhum em código de produto — a suíte que prova borda, fila e drenagem
Rate limit: não se aplica (nada muda no limitador; os limites são por minuto, `apps/api/src/limite.module.ts:53`, e não carregam entre execuções)
Fila e prioridade: ok (nada muda)
Concorrência: protegida (sem escrita nova)
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (RF6 mede sem mudar; nenhum alerta novo)

Bloqueantes:

1. `techspec.md:51-60` (RF5, "saída preferida") — trocar `borda.int.test.ts:364` por conjunto declarado transforma a asserção de `:367` (`expect(parados).toEqual(expect.arrayContaining([...PROCESSOS_DA_FILA, 'realtime-1', 'realtime-2', 'redis-fila', 'redis-cache', 'storage']))`) em tautologia: hoje ela prova que aqueles serviços *estavam de pé* e portanto estão mesmo sendo parados; com lista fixa, ela afirma que a constante contém a constante. O caso "API não depende do resto" perde o que prova, e isso contradiz a regra central da fase ("nenhuma asserção existente muda"). Correção exigida: ou `:364` continua derivando do estado efetivo e `alertas`/`metricas` restauram, ou, se o conjunto declarado for adotado, a spec declara que `:367` passa a ser asserção sobre o estado efetivo depois do `stop` (`ps --status running` == essenciais) — e então a regra "nenhuma asserção muda" tem de ser reescrita, porque está sendo mudada.

2. `prd.md:40-41` e `prd.md:77` (RF5, metade `alertas`) — a premissa é falsa. `infra/test/alertas.int.test.ts:87` sobe `redis-cache`, que está em `SERVICOS_INFRA` (`tools/ci/compose.ts:27`), isto é, no próprio conjunto de entrada que o `globalSetup` garante: ele **restaura** a linha de base, não vaza. E `borda.int.test.ts:367` **exige** `redis-cache` rodando. Uma tarefa escrita contra este RF pode fazer `alertas` parar o `redis-cache` e quebrar `borda` sempre que a ordem dos arquivos puser `alertas` antes — a ordem, como o próprio PRD diz, não é fixa. Correção exigida: retirar `alertas:87` da lista de vazamentos (ou provar o vazamento com o conjunto declarado escrito), mantendo só `metricas.int.test.ts:87`, que de fato para `PROCESSOS_DA_FILA` e nunca religa.

3. `prd.md:73` e `techspec.md:39-47` (RF1, "instante") — instrumentar o instante **da resposta** não permite a correlação do RF3. O POST tem `limitePorRequisicaoMs = 10_000` (`borda.int.test.ts:113`) e a borda ainda repete internamente por `lb_try_duration 5s` (`infra/Caddyfile:40`): o instante da resposta fica até 5–10 s depois da seleção que falhou, e a sonda cicla a cada 2 s (`Caddyfile:34`). A janela de correlação cobre cinco ciclos de sonda e não separa candidata nenhuma. Correção exigida: registrar **instante de início e duração** de cada requisição (na rajada e nos 20 POSTs de `:434`), e declarar que a correlação é feita contra o intervalo início→fim, não contra um ponto.

4. `prd.md:73` e `techspec.md:39-44` (RF1, "estado do pool") — o requisito pede estado do pool por 503, mas nenhum dos pontos citados (`Resultado`, `inesperados`, a rajada, `:426`) tem como obtê-lo: são construídos a partir da resposta do `fetch`. A spec cai no log `sonda`, que ela mesma declara premissa não verificada (`techspec.md:113-115`) — enquanto `infra/Caddyfile:5-6` habilita `admin 127.0.0.1:2019`, já usado como healthcheck do compose (`infra/compose.yml:400`), e é canal autoritativo do estado por upstream. Aprovar sem canal nomeado repete o padrão das quatro rodadas: tarefa que não consegue entregar o número de que todas as outras dependem. Correção exigida: nomear o canal (`/reverse_proxy/upstreams` pela admin, via `compose exec`, ou o log `sonda` com a limitação escrita), o intervalo de amostragem, e como o custo da amostragem é mantido fora do que se mede (`compose exec` por amostra é processo novo, e as asserções do caso são de relógio, `:480-482`).

5. `techspec.md:27` e `:51` (RF4) — `tools/testes/integracao.setup.ts` é `globalSetup` **dos dois projetos**: `vitest.config.ts:42-56` espalha o mesmo objeto em `integracao` e em `infra`. Impor ali "o estado de entrada do projeto `infra`" aplica a imposição também ao `npm run test`, que roda antes no portão, sem que a spec diga qual é o conjunto declarado daquele projeto — e mudar o ambiente de uma suíte fora do escopo viola o "medir sem mudar". Some-se que `--manter-ambiente` (`tools/ci/e2e.ts:5`) faz os 19 serviços sobreviverem ao portão inteiro: a herança também precede o `test` da **execução seguinte**, e por isso trocar a ordem (`techspec.md:62`) não fecha nada sozinho. Correção exigida: declarar um conjunto de entrada **por projeto**, ou um setup próprio do projeto `infra`, e dizer explicitamente o que acontece com o projeto `integracao`.

6. `prd.md:76` e `techspec.md:98` (RF4, definição do estado de entrada) — o estado é definido só como "serviços do compose rodando", e isso não cobre dois restos que o próprio arquivo produz: (a) contêineres e redes fora do projeto, criados em `borda.int.test.ts:196-226` (`educa-teste-caddy-*`, `educa-teste-upstream-*`, `educa-teste-sem-realtime-*`), invisíveis a `docker compose ps` e que sobrevivem a cancelamento do job ou do portão, queimando CPU num caso cujas asserções são de relógio; (b) conteúdo dentro dos serviços com estado — job pendente em `redis-fila` deixado pelo e2e começa a executar exatamente quando `borda.int.test.ts:362` sobe `PROCESSOS_DA_FILA`. Correção exigida: o conjunto declarado diz o que cobre e o que não cobre, e o estado sujo fabricado da guarda inclui ao menos o resto fora do projeto (`docker ps --filter name=educa-teste-`).

7. `prd.md:74` (RF2) — não há número de execuções, regra de parada nem método de obtenção. "Sete numa sessão" segue sem denominador, e a linha de base é justamente o que o PRD §9 usa para julgar a fase 2. Com o job `infra` em até 45 min na esteira (`.github/workflows/ci.yml:54`) e ~16 min local, isto é trabalho sem teto. Era o achado G da rodada 1 e sumiu na reescrita. Correção exigida: declarar quantas execuções por job, como são obtidas (`workflow_dispatch`, laço local, repetição por caso), e a precisão que a taxa resultante terá — ou rebaixar RF2 a "registro contínuo dos vermelhos com o denominador que houver", assumindo por escrito que não é linha de base estatística.

Recomendações:

- Respondendo direto: **isolar o conjunto de serviços não basta** — faltam os restos fora do projeto e o conteúdo dos serviços com estado (bloqueante 6), e falta o outro projeto que divide o `globalSetup` (bloqueante 5). Na esteira o runner é limpo, então RF4 é no-op lá: o ganho dele é do portão local, e vale dizer isso no PRD para o resultado não ser lido como maior.
- **RF1 é implementável sem mexer no que os casos provam** na parte de `Resultado`/`inesperados`: as três chamadas de `inesperados` afirmam `toEqual([])` (`borda.int.test.ts:274`, `:312`, `:384`), então campo novo e ordem preservada não mudam asserção. O que não é implementável como está é o estado do pool (bloqueante 4).
- **A fase 1 sozinha entrega valor**, com uma ressalva: o valor determinístico é RF4/RF5 (isolamento), que não depende de medição; RF2/RF3 entregam valor probabilístico e têm saída declarada de "não consegui". Vale a spec assumir isso na seção 9 — se RF3 não separar, o que sobra é o isolamento, e é preciso dizer se isso justifica a fase.
- Citações fora por uma linha: `Resultado` é `:99-104` (não `:98-102`), `inesperados` é `:168-176` (não `:167-176`), `parados` começa em `:364` (não `:363`). `:426`, `:434` e `:105-106` estão exatos.
- `techspec.md:62` (ordem `infra` antes de `e2e`) — dizer que ela não remove a herança, só a move para a execução seguinte, para não ser lida como alternativa ao RF4.

Arquivos lidos: `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-estabilidade-da-esteira/prd.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-estabilidade-da-esteira/techspec.md`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/borda.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/alertas.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/metricas.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/Caddyfile`, `/home/joaquimdp/Documentos/git/Educa.ia/vitest.config.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/testes/integracao.setup.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/e2e.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/processo/portao-local.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml`.
