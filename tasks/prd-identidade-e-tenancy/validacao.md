# Validação — identidade-e-tenancy (F1)

## Rodada 3 — 21/09/2026

**Escopo:** funcionalidade completa (tarefas 1.0 a 20.0)
**Commit validado:** `249cd290b834677183833650c682baffc9fc75c4`
**Veredito: APROVADA COM RESSALVAS** — as quatro ressalvas maiores foram **aceitas por Joaquim em
21/09/2026** (seção 7), e com isso a funcionalidade está fechada.

O crítico único da rodada 2 — esteira vermelha no commit validado — está resolvido, e conferi isso
na fonte, não no relatório: execução `35565654568`, `headSha` `249cd290b834677183833650c682baffc9fc75c4`,
os quatro jobs `success` (`verificar`, `integração`, `infra`, `e2e`). O portão local inteiro repetiu
verde aqui, com a árvore limpa.

As duas correções fizeram o que dizem, e verifiquei cada uma por execução própria, não pelo texto do
commit:

- **`6cbb3b6` (reconciliação).** Reproduzi o vermelho e o verde eu mesmo, com a condição da esteira
  (container que demora mais que o orçamento). Detalhe em "Provas de mutação" abaixo: sem
  `aguardarSaudavel`, a mensagem que sai é **exatamente** a da esteira; com ela, passa.
- **`349fd55` (traço do e2e).** A guarda nova existe, se amarra ao `playwright.config.ts` **por
  projeto** e roda no `npm run test`; o passo do `ci.yml` publica `test-results/` só em `failure()`
  ou `cancelled()`, com `if-no-files-found: warn` e 7 dias. O caso de e2e que ficou vermelho na
  esteira **não foi reestruturado**, e essa escolha está fundamentada: a causa não se sustenta em dez
  observações verdes (oito da correção, mais as duas desta rodada).

O que impede a aprovação sem ressalvas é o que sobrou dessa segunda correção: **a esteira é instável
por desenho**, e isso está registrado como tarefa, não corrigido. Três testes diferentes falharam em
três execuções seguidas, um deles novo e que eu levantei nesta rodada (`infra/test/borda.int.test.ts`,
execução `35525902277`). Nenhum deles é regressão do F1, e nenhum bloqueia o F2 por si; mas a primeira
tarefa do F2 vai commitar em cima dessa esteira.

---

### 1. RF a RF

**Nenhuma linha de código de produção mudou desde o commit da rodada 2.** `git diff --stat
38ce195..249cd29` dá nove arquivos: `.github/workflows/ci.yml`, `TODO.md`,
`apps/despachante/test/reconciliacao.int.test.ts` (teste), `docs/runbook.md`, os dois documentos de
correção, `tasks/correcoes/achados-revisoes.md`, `tools/ci/esteira.test.ts` (guarda de esteira) e este
arquivo. Não há caminho por onde um RF tenha mudado de situação, e a suíte repetiu aqui os mesmos
números da rodada 2 mais os dois casos novos da guarda.

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1–RF21 | **ATENDIDO** (21 de 21) | inalterados desde `6f69754` | `npm run test` 146 arquivos / **1.674** casos (1.672 na rodada 2, + os 2 casos novos de `tools/ci/esteira.test.ts`); `npm run test:e2e` 132; `npm run test:infra` 35 | evidência RF a RF nas rodadas 1 e 2, não repetida aqui |

**Contagem:** 21 atendidos, 0 parciais, 0 não atendidos, 0 não verificáveis.

Provas de mutação (duas nesta rodada; as quatro das rodadas 1 e 2 continuam valendo e não foram
repetidas). A árvore terminou limpa nas duas, restaurada com `git checkout --`:

| O que mutei | O que removi | Resultado |
|---|---|---|
| **Escopo de tenant da leitura de turma** (RF15, RF16, regra 10, itens 3 e 5) — prova nova, para não aceitar o isolamento pela palavra da rodada 2 | `eq(turma.escolaId, exigirEscolaDoContexto())` de `aberta` (`apps/api/src/estrutura/turma.repository.ts:90`) **e** `eq(turma.anoLetivoId, exigirAnoEmCurso())` de `#doAnoDaLeitura` (`:103`), isto é, o escopo inteiro | ❌ **4 casos vermelhos** em `apps/api/test/estrutura-isolamento.int.test.ts`, entre eles "o escopo de escola vale sozinho: com o ano e o usuário de B num contexto de A, nenhum repository alcança B" e "`vinculos/:id/*` e `turmas/:id` com id de B dão o mesmo 404 do inexistente, e nada muda em B" (`expected { status: 500 } to deeply equal { status: 404 }` e três `AssertionError` de DTO). Restaurado: verde |
| **A correção da reconciliação** (`6cbb3b6`) | `await aguardarSaudavel('redis-fila')` de `apps/despachante/test/reconciliacao.int.test.ts:214`, com a subida do container segurada por 25 s (`setTimeout(() => void composeAssincronoOuFalha('start', 'redis-fila'), 25_000)`), que é a condição da esteira | ❌ `AssertionError: expected [] to deeply equal [ Array(1) ]` em 24.980 ms — **a mensagem exata da execução `35517746419`**. Com a linha de volta e o mesmo adiamento de 25 s: ✅ verde. Arquivo inteiro restaurado: 11 casos verdes |

A segunda linha é a que fecha o maior 1 da rodada 2: a correção não é um prazo maior nem uma espera a
mais, é a separação do orçamento, e ela é o que faz o caso sobreviver ao runner carregado.

**Registro de uma tentativa que não serviu de prova, para ninguém repetir o caminho:** retirar
**só** `eq(turma.escolaId, …)` de `aberta` deixa `estrutura-isolamento.int.test.ts` **verde**. Não é
teste fraco: `eq(turma.anoLetivoId, exigirAnoEmCurso())` carrega o isolamento sozinho, porque o id do
ano em curso é um UUID de uma escola só e vem do mesmo contexto. É defesa em profundidade funcionando
(mais as FKs compostas, a terceira camada). Quem for mutar esse repository tem de tirar o par, como na
tabela acima.

---

### 2. Regras de negócio, casos de borda e critério de pronto

As tabelas das rodadas 1 e 2 valem inteiras: nenhuma regra, nenhuma borda e nenhum caminho de produção
mudou. Reconferi só o que o critério de pronto ainda tinha aberto.

| Item | Situação | Evidência |
|---|---|---|
| Pronto: os 21 RF do PRD têm código e teste que falharia sem a regra | cumprido | rodadas 1 e 2, mais a mutação nova do escopo de tenant acima |
| Pronto: testes de isolamento da Tech Spec seção 6 verdes, e cada um quebra sem a cláusula de escola | cumprido | `estrutura-isolamento.int.test.ts` vermelho com o escopo removido, verde restaurado (mutação 1) |
| Pronto: nenhum caminho de login recusa um aluno por causa de outro no mesmo IP; `login-7h30` passa | cumprido | rodada 1 |
| Pronto: nenhum e-mail, nome, foto ou claim de aluno no banco nem no log | cumprido | rodada 1; conferi de novo que as quatro linhas "não" da seção 8 do PRD estão em `docs/lgpd.md:51,53,55-56,58` (hash argon2id, segredo TOTP e HMAC dos códigos, contador de tentativas e contadores por IP, vínculo) |
| Pronto: token sintético não existe mais | cumprido | rodada 1 |
| Pronto: `docs/lgpd.md` e `docs/runbook.md` completos | cumprido, e ampliado: `docs/runbook.md` ganhou a seção "Esteira vermelha no e2e", com como baixar e abrir o traço e o que o vazio significa |
| Pronto: **portão inteiro verde e esteira verde no commit final** | **cumprido** | tabela da seção 3; execução `35565654568` nos quatro jobs |
| Roadmap, "Pronto quando": "a escola A não lê, não escreve e não descobre nada da B, e um professor com vínculo nas duas não leva dado de uma para a outra" | cumprido | mutação 1 (a parte da escola A × B) e `e2e/escola-e-vinculos.spec.ts:185` verde nos dois perfis aqui (`chromebook` 10,5 s, `celular` 11,2 s) |

Critério de pronto: **cumprido, os sete itens.**

---

### 3. Portão

Não foi preciso `npm ci`: `node_modules/.package-lock.json` e `package-lock.json` estão na mesma data
(20/09 01:14). Tudo rodado com a árvore limpa, no commit `249cd29`.

| Portão | Resultado |
|---|---|
| `npm run typecheck` | ✅ |
| `npm run lint` | ✅ (ESLint + guardas) |
| `npm run test` | ✅ 146 arquivos, **1.674** casos (406,7 s) |
| `npm run test:e2e` | ✅ **132** casos, `chromebook` e `celular` (2,3 min) |
| `npm run test:infra` | ✅ 5 arquivos, **35** casos (1.209,6 s), `infra/test/borda.int.test.ts` incluído e verde |
| **Esteira do GitHub no commit validado** | ✅ execução `35565654568`, `headSha` `249cd29…`: `verificar` ✅ 1m51s, `integração` ✅ 8m12s, `infra` ✅ 23m9s, `e2e` ✅ 11m4s (132 passed) |
| Revisões com veto registradas e aprovadas | ✅ nas 20 tarefas e nas duas correções: a última rodada de cada revisor com veto é APROVADO (ver menor 1 sobre o rastro) |

Nenhum `.skip`, `.todo` ou teste comentado. Carimbo do portão local do último commit
(`.processo/portao.json`): `typecheck`, `lint`, `test`, `infra` — sem `e2e`, o que está correto: a
correção `349fd55` não toca tela nem spec de e2e, só a esteira e a guarda dela.

---

### 4. Achados

**Críticos**

Nenhum.

**Maiores**

1. **A esteira é instável por desenho, e isso continua aberto** (registrado em `TODO.md` por
   `249cd29`, com causa provável e remédios, para virar tarefa por `/criar-tasks`). O que levantei
   nesta rodada, na fonte: depois de nove execuções verdes, **três testes diferentes** falharam em
   três execuções seguidas, cada um passando na seguinte sem mudança nenhuma:
   - `35517746419` (`38ce195`): `apps/despachante/test/reconciliacao.int.test.ts` e
     `e2e/escola-e-vinculos.spec.ts:185` `[celular]` — os dois da rodada 2;
   - `35525902277` (`ec0aa38`): **novo**, job `106117874183`, `infra/test/borda.int.test.ts` ›
     "handshake por polling fica na mesma instância pelo cookie da borda, e autentica no pacote de
     conexão" — `AssertionError: expected [ 200, 200, 503, 400, 400, 400, …(14) ] to deeply equal
     [ 200, 200, 200, 200, 200, 200, …(14) ]`, com o log da borda mostrando `api-1`/`api-2` e
     `realtime-1`/`realtime-2` sem responder ao healthcheck;
   - `35565654568` (`249cd29`): verde inteira, sem mudança em nenhum dos três testes.
   Causa provável nomeada pelo `infra-guardian` (compose inteiro, ~18 contêineres sem limite de CPU
   em `infra/compose.yml`, no mesmo runner do Playwright com CPU ×4; `workers` não fixado e
   `retries: 0` em `playwright.config.ts:29`). **Correção:** a tarefa que fixa `workers`, tira
   `observabilidade` do job do e2e e decide entre folga de `expect` no `celular` ou retentativa com o
   flake registrado — antes ou junto da primeira tarefa do F2, porque é ela que vai commitar em cima
   desta esteira.
2. **`infra/test/borda.int.test.ts` — vermelho sem causa estabelecida e sem `/corrigir`.** Um único
   503 da borda invalida a sessão socket.io e as 17 requisições seguintes viram 400 em cascata; o
   arquivo tem um caso que mata um realtime de propósito, o que aponta contaminação de ordem entre
   casos. Passou aqui (35 de 35) e na execução do commit validado, o que o torna intermitente, não
   ausente. Está no `TODO.md` com a instrução certa ("precisa de `/corrigir` próprio, com a causa
   achada antes da correção"), e é isso que falta. **Correção:** `/corrigir` com a causa, não com um
   prazo maior.
3. **`e2e/escola-e-vinculos.spec.ts:185-232` — a causa do vermelho nunca foi estabelecida.** A
   correção `349fd55` diz isso com todas as letras e compra **diagnóstico**, não imunidade; a decisão
   de não reestruturar um caso de isolamento que passa está bem fundamentada (dez observações verdes,
   contando as duas desta rodada: 10,5 s no `chromebook` e 11,2 s no `celular`). Mas o caso segue
   sendo o mais pesado da suíte no perfil mais lento, com `PRAZO_DA_ENTRADA_MS = 20_000` dentro de um
   prazo de 30 s, e teste de isolamento que falha por tempo não protege o que existe para proteger.
   **Correção:** fica amarrado ao maior 1; se a próxima falha vier, o artefato `traco-do-e2e` agora
   existe e diz para onde o prazo foi.
4. **Commit em cima de esteira vermelha, e push em grupo** (regra 40, último parágrafo). `349fd55`
   foi feito e empurrado com a esteira do commit anterior (`ec0aa38`, execução `35525902277`)
   **vermelha** no job de infra, e o vermelho da borda não virou `/corrigir` — virou linha de
   `TODO.md`. As duas correções também não tiveram execução própria: `6cbb3b6` foi ao GitHub junto de
   `ec0aa38`, e `349fd55` junto de `249cd29`. **Mitigação real:** os dois commits de `TODO.md` não
   levam código, então a execução de cada par cobriu a árvore da correção, e nenhuma linha de código
   ficou sem esteira — é o que impede isto de ser crítico. **Correção:** um push por commit, e o
   vermelho da borda pela `/corrigir` antes da primeira tarefa do F2, como o próprio `TODO.md` pede.

**Menores**

1. **Rodada de revisor com veto sem bloco em `tasks/correcoes/achados-revisoes.md`.** A tabela do
   documento de correção (escrita pelo hook) registra `privacy-guardian` nas rodadas 1, 2, 3 e 4, mas
   só a **3ª** tem bloco no `achados-revisoes.md` — inclusive a 4ª, que é a que vale como aprovação
   final da regra 20. Falta também o bloco do `test-engineer` rodada 1 da correção da reconciliação.
   O que existe é substantivo (a rodada 3 do `privacy-guardian` refez as mutações por conta própria),
   mas o veredito final de um revisor com veto ficou sem conteúdo auditável. Defeito do hook já
   registrado no `TODO.md` por `249cd29`. **Correção:** junto do outro defeito do hook (caducidade
   por `mtime`), na tarefa que mexer em `tools/processo/revisoes.ts`.
2. Os menores 1 a 6 da rodada 2 seguem abertos, todos conferidos de novo aqui: `prd.md:3` ainda
   **"Status: rascunho"**; `docs/modelo-de-dados.md:70` ainda lista `responsavel` como papel;
   as tabelas do F0 (`configuracao_operacional_escola`, `uso_infra_diario`, `job_registro`) ainda
   ausentes do modelo de dados; `saidaConfirmada` compartilhado entre saída pedida e inatividade;
   `CLAUDE.md:8` ainda aponta para `LitzGab/Educa.ia` enquanto o `origin` é `LitzGab/Turmma.ai`.
3. Os menores 1 a 6 da rodada 1 seguem abertos e sem destino registrado (`BroadcastChannel` por
   sessão, `details` do seletor, passkey, auditoria de mudança de papel, rastro do
   `domain-researcher`, `revisor-geral` ausente na 1.0 — confirmei: `1_task.md` não tem nenhuma
   rodada dele). Nenhum bloqueia.
4. Recomendações dos revisores das duas correções que ficaram com destino no `TODO.md` e não foram
   perdidas: guarda de `video`/`screenshot` no mesmo laço da guarda de `trace`; guarda sobre
   `ARQUIVOS_AMBIENTE_TESTE` e a ausência de `process.env` em `tools/ci/compose.ts` (a primeira da
   fila, porque o runbook agora **afirma por escrito** uma propriedade de segurança que nenhum teste
   sustenta); linha de furo conhecido em `docs/lgpd.md` seção 4 sobre artefato público de esteira.
   Ficam listadas aqui só para não se perderem.

**Positivos**

- A correção da reconciliação é o modelo de como se fecha um vermelho de tempo: causa **medida** com
  números nos dois regimes (ocioso e sob contenção), hipóteses alternativas descartadas com evidência
  (AOF, recuo do ioredis), vermelho determinístico com a mensagem exata da esteira, e zero linha de
  produção tocada. Reproduzi e confirmei aqui.
- A correção do traço fez a coisa mais difícil: **não** reescreveu o teste. Diante de um vermelho que
  não reproduz, atacou o que impedia o diagnóstico e disse explicitamente o que não compra
  ("diagnóstico, não imunidade"). É o oposto de mexer no teste até ele ficar verde.
- A guarda nova se amarra ao `playwright.config.ts` **resolvendo o valor efetivo por projeto**, não
  só no `use` de topo. Sem isso, uma linha dentro do projeto `celular` reabriria o furo com a esteira
  verde. É o padrão para toda guarda que afirma uma configuração.
- A 3ª rodada do `privacy-guardian` refez as mutações por conta própria em vez de aceitar a tabela do
  documento, e declarou que a aprovação da rodada 1 — dada sobre a premissa errada de repositório
  privado — não cobria o fato corrigido. Revisor que invalida a própria rodada anterior é exatamente
  o que o processo quer comprar.
- A instabilidade foi nomeada como **desenho**, com causa provável e três remédios, em vez de virar
  três correções soltas perseguindo sintomas. É o achado mais valioso que sai do F1.

---

### 5. Conclusão

O único crítico da rodada 2 caiu, e caiu com evidência: a esteira do commit validado está verde nos
quatro jobs, o portão local repetiu verde inteiro, e as duas correções fazem o que dizem — a da
reconciliação eu reproduzi vermelha e verde aqui, com a condição da esteira e a mensagem exata dela.
Os 21 RF seguem atendidos, agora com uma prova de mutação nova sobre o escopo de tenant, feita nesta
rodada para não herdar o isolamento pela palavra da rodada anterior. O critério de pronto está
cumprido nos sete itens, inclusive o último, que era o que faltava.

Não é APROVADA sem ressalvas porque sobram maiores, e o principal deles é o que a segunda correção
deliberadamente **não** resolveu: a esteira falha por contenção do runner, três testes diferentes em
três execuções, e um desses vermelhos (`infra/test/borda.int.test.ts`) é novo e ainda não tem causa
nem `/corrigir`. Nenhum é regressão do F1 — todos são fragilidade de ambiente de teste, herdada do F0
e exposta pela carga —, nenhum indica furo de isolamento, de dado pessoal ou de conformidade, e por
isso nenhum impede o F2 de começar. Mas a primeira tarefa do F2 commita em cima desta esteira, então
a ressalva tem endereço e ordem:

1. A tarefa da instabilidade da esteira (`/criar-tasks`): fixar `workers`, tirar `observabilidade` do
   job do e2e, e decidir entre folga no `celular` ou retentativa com o flake **registrado**.
2. `/corrigir` para `infra/test/borda.int.test.ts`, com a causa achada antes da correção.
3. Um push por commit, para cada correção ter execução própria.

Os menores não bloqueiam nada e estão todos com destino.

---

### 6. Pendências herdadas

| Pendência | Destino |
|---|---|
| Esteira instável por desenho (maior 1) | tarefa por `/criar-tasks`, antes ou junto da primeira tarefa do F2; já em `TODO.md` |
| `infra/test/borda.int.test.ts` intermitente (maior 2) | `/corrigir` próprio, com a causa; já em `TODO.md` |
| Causa do vermelho de `escola-e-vinculos.spec.ts:185` (maior 3) | amarrada ao maior 1; na próxima falha, o artefato `traco-do-e2e` dá a linha de tempo |
| Push em grupo e commit sobre esteira vermelha (maior 4) | prática, a partir da primeira tarefa do F2 |
| Rodada de revisor sem bloco em `achados-revisoes.md` (menor 1) | junto do defeito de caducidade por `mtime`, na tarefa que mexer em `tools/processo/revisoes.ts`; já em `TODO.md` |
| Guarda de `video`/`screenshot`; guarda de `ARQUIVOS_AMBIENTE_TESTE`; furo conhecido em `docs/lgpd.md` seção 4 | já em `TODO.md`, a segunda como primeira da fila |
| Histórico próprio do aluno | **fechado** na rodada 2: F9, registrado no PRD, na Tech Spec e no `ROADMAP.md` |
| Status do PRD do F1 ainda "rascunho"; `responsavel` em `docs/modelo-de-dados.md:70`; tabelas do F0 fora do modelo de dados | quem fizer a próxima edição desses documentos |
| `BroadcastChannel` por sessão, `details` do seletor, `saidaConfirmada` | `TODO.md` ou a primeira tarefa de web do F2 |
| Passkey | `/registrar-decisao`, ou a pergunta em aberto do PRD do F2 |
| Auditoria de mudança de papel | a tarefa do F2/F3 que criar o caminho de mudar papel |
| Rastro do `domain-researcher` e `revisor-geral` ausente na 1.0 | `/retro` do F1 |
| Endereço do repositório no `CLAUDE.md` | junto da decisão de nome e domínio (Gabriel) |
| Demais pendências do F0 (alertas, `VALIDATE` das FKs, controle negativo do `npm run carga`, calibração do argon2) | já em `TODO.md` e na Tech Spec, seção 12 |

---

### 7. Aceitação das ressalvas

**Quem aceitou:** Joaquim, em 21/09/2026, apresentadas as quatro ressalvas maiores com a correção
sugerida de cada uma. Com a aceitação, o F1 é fechado como no caso APROVADA.

| Ressalva | Decisão e motivo |
|---|---|
| **1. Esteira instável por desenho** | **Aceita, e vira tarefa.** Não é defeito do F1: as nove execuções anteriores foram verdes, e o que mudou foi a folga do runner, não o código. Não fica como linha de `TODO.md`: entra por `/criar-tasks` como a primeira tarefa antes do F2, com o escopo que o `infra-guardian` nomeou — fixar `workers` na esteira, não subir `observabilidade` no job do e2e, e decidir entre folga de `expect` no perfil `celular` ou retentativa com o flake **registrado**, nunca mascarado |
| **2. `borda.int.test.ts` intermitente** | **Aceita, e vira tarefa junto da 1.** É da mesma classe, e corrigi-la isolada repetiria o padrão de tratar sintoma. A causa provável (um 503 invalidando a sessão socket.io, com contaminação de ordem a partir do caso que mata um realtime de propósito) fica registrada para quem pegar a tarefa |
| **3. Causa do vermelho do e2e nunca estabelecida** | **Aceita.** Não há o que corrigir sem reprodução: oito observações locais verdes (isolado, suíte com 6 e com 12 trabalhadores) e a execução seguinte da esteira passou inteira. Reestruturar um teste de isolamento que passa, por causa que não se sustenta, trocaria cobertura real por palpite. A correção `349fd55` entrega o diagnóstico para a próxima ocorrência, e o `traco-do-e2e` é o que vai decidir a hipótese |
| **4. Push em grupo e commit sobre esteira vermelha** | **Aceita, como falha de prática já ocorrida.** O commit `349fd55` foi feito com a esteira de `ec0aa38` vermelha, contra a regra 40. Mitigado no caso concreto — `ec0aa38` e `249cd29` só levam `TODO.md`, e o vermelho que seguravam era justamente a instabilidade que as correções atacavam —, mas a prática correta é esperar, e vale a partir da primeira tarefa do F2 |

---

## Rodada 2 — 20/09/2026

**Escopo:** funcionalidade completa (tarefas 1.0 a 20.0)
**Commit validado:** `38ce1954acf40d679ed07cbc4e23510faa658bb8`
**Veredito: REPROVADA**

O que a rodada 1 reprovou está resolvido: o crítico do RF16 virou uma decisão registrada nos
cinco lugares onde a próxima pessoa lê, `docs/modelo-de-dados.md` agora corresponde ao que foi
construído, e as três divergências da 18.0 e da 20.0 subiram para a Tech Spec. Confirmei cada
um dos três contra o código, e não contra o texto que o commit escreveu sobre si.

O que reprova agora é outra coisa, e ela é nova: **a esteira do commit validado está vermelha**.
Duas das quatro tarefas falharam — integração e e2e —, com dois casos que passam aqui e falharam
lá. O commit `38ce195` não leva uma linha de código (só `.md`), então não há regressão possível
vinda dele: o que a esteira mostrou é fragilidade que já estava no repositório e apareceu na
primeira execução em que o tempo não ajudou. Pela regra 40 e pela D52, vermelho na esteira é
achado, não desculpa, e segura a próxima funcionalidade.

---

### 1. RF a RF

Nenhuma linha de código mudou entre `6f69754` e `38ce195` (`git diff --stat` = `ROADMAP.md`,
`docs/modelo-de-dados.md`, `prd.md`, `techspec.md`, `validacao.md`), e o portão local inteiro
repetiu aqui os mesmos números da rodada 1. As evidências RF a RF da rodada 1 continuam
valendo; não as repito. O que mudou é o RF16, reescrito no PRD, e é o que auditei de novo.

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1–RF15, RF17–RF21 | ATENDIDO | inalterados desde `6f69754` | suíte inteira verde aqui (146 arquivos, 1.672 casos; 132 e2e; 35 de infra) | ver a tabela da rodada 1 |
| RF16 | **ATENDIDO** (era PARCIAL) | `apps/api/src/estrutura/turma.repository.ts:83-145` (`aberta`, `#doAnoDaLeitura`, `#comVinculoDoProfessor`, `#confirmadoAteOFimDoAno`) | `apps/api/test/historico.int.test.ts` — 10 casos, entre eles "o professor desligado em março e o realocado dão o 404 da turma inexistente em outubro, na turma e nos alunos" e "só leitura: em janeiro, com 2027 já em curso, toda escrita sobre 2026 é recusada" | O texto do RF passou a cobrir só o professor; a metade do aluno virou escopo do F9, registrada (abaixo). Prova de mutação nova |

**O adiamento do histórico do aluno está registrado onde a próxima pessoa lê.** Confronto dos
cinco lugares que o commit alega ter escrito, com o código ao lado:

| Onde | Linha | Confere com o código? |
|---|---|---|
| PRD, seção 3 (fora de escopo) | `prd.md:32-35` | sim: destino F9, motivo, e o que o aluno vê no F1 |
| PRD, RF16 | `prd.md:69` | sim: a cláusula do aluno saiu do requisito e aponta a seção 3 |
| PRD, tabela de papéis | `prd.md:48` | sim: "ver a si (escola e papel de agora, por `/v1/eu`)", e o histórico na coluna do que ele não pode |
| Tech Spec, seção 5, "Histórico" | `techspec.md:271-276` | sim, e cada afirmação dela é verdadeira: `MATRIZ.aluno` tem `turma.ler`, `turma.listar`, `aluno_da_turma.ler` e `vinculo.ler_proprios` em `nunca` (`packages/shared/src/permissao/matriz.ts:109-123`); `?anoLetivoId` com token de aluno responde `NAO_ENCONTRADO` (`apps/api/test/historico.int.test.ts:204-225`); `/v1/eu` devolve escola e papel (`packages/shared/src/sessao/eu.ts:17-27`) |
| `ROADMAP.md`, bloco do F9 | `ROADMAP.md:172-178`, dentro de `## F9 — ambiente-do-aluno` | sim, e diz o que a tarefa do F9 terá de fazer (célula, rota, DTO e o teste que quebra sem a cláusula de `usuario_id`) |

Não sobrou promessa solta: a varredura por "histórico" no PRD, na Tech Spec, no `tasks.md` e em
`docs/` não acha nenhuma outra linha dizendo que o aluno lê o dele no F1.

Prova de mutação (uma nova nesta rodada, sobre o RF16, que a rodada 1 não tinha mutado; as três
da rodada 1 continuam valendo e não foram repetidas):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF16 | `eq(vinculo.motivoEncerramento, 'fim_do_ano')` de `#confirmadoAteOFimDoAno` (`apps/api/src/estrutura/turma.repository.ts:143`) | 5 de 10 em `apps/api/test/historico.int.test.ts`, entre eles o caso que é o critério de aceite do RF16: "borda: o professor desligado em março e o realocado dão o 404 da turma inexistente em outubro, na turma e nos alunos". Restaurado com `git checkout --`; a árvore terminou limpa e o arquivo voltou a 10 verdes |

**Contagem:** 21 atendidos, 0 parciais, 0 não atendidos, 0 não verificáveis.

---

### 2. Regras de negócio, casos de borda e critério de pronto

As tabelas da rodada 1 valem inteiras: nenhum código mudou e a suíte repetiu os mesmos números.
Reconferi só o que o commit tocou.

| Item | Situação | Evidência |
|---|---|---|
| Regra: matriz de visibilidade e papéis (regra 60, item 11) | cumprida | `matriz.ts:18-22` (`PAPEIS`, `PAPEIS_DE_USUARIO`), `matriz.test.ts` |
| Borda: virada de ano letivo e o que o professor lê depois | coberta | `historico.int.test.ts` (10 casos) + mutação acima |
| Pronto: os 21 RF do PRD têm código e teste que falharia sem a regra | **cumprido** | RF16 fechado com o texto novo do PRD e a mutação acima |
| Pronto: isolamento da Tech Spec seção 6 verde, e cada teste quebra sem a cláusula de escola | cumprido | suíte verde + mutações (rodada 1, e a de agora derrubou também "o escopo de escola vale sozinho no histórico") |
| Pronto: nenhum caminho de login recusa um aluno por causa de outro no mesmo IP; `login-7h30` passa | cumprido | rodada 1 |
| Pronto: nenhum e-mail, nome, foto ou claim de aluno no banco nem no log | cumprido | rodada 1 |
| Pronto: token sintético não existe mais | cumprido | rodada 1 |
| Pronto: `docs/lgpd.md` e `docs/runbook.md` completos | cumprido | rodada 1 |
| Pronto: **portão inteiro verde e esteira verde no commit final** | **faltando** | esteira vermelha em `38ce195` (crítico 1) |
| Roadmap: "A não lê, não escreve e não descobre nada da B…" | cumprido | rodada 1 |

`docs/modelo-de-dados.md` (maior 1 da rodada 1) — conferido tabela a tabela contra
`packages/nucleo/src/db/schema/`:

| Bloco do documento | Confere? |
|---|---|
| `Rede`, `Escola`, `AnoLetivo`, `Serie`, `Turma`, `Disciplina` | sim: `ipsSaida` (`rede.ts:24`), `slug` + `inatividadeAlunoMin` 30 + `inatividadeEquipeMin` 120 (`escola.ts:6-32`), `situacao` com único `em_curso` por escola (`ano-letivo.ts:31-36`), `etapa`/`ano` (`serie.ts`), `turno?` (`turma.ts:30`), `area?` (`disciplina.ts:22`) |
| `Conta`, `CodigoRecuperacao`, `Usuario`, `CredencialMatricula`, `ContaExterna`, `ProvedorEscola`, `Vinculo`, `Sessao`, `RegistroAcesso`, `Convite` | sim, campo a campo; o documento diz que a forma exata está na seção 3 da Tech Spec e aqui fica o desenho, o que é honesto: o que ele omite (`mfaChaveVersao`, `refreshHashAnterior`, `atualApresentado`) é detalhe de implementação, não contradição |
| Identidade global × vínculo por escola, aluno sem conta, `sujeito` opaco, `ProvedorEscola` com `removidoEm` | sim (`usuario.ts:36`, `credencial-matricula.ts:32`, `conta-externa.ts:39-44`, `provedor-escola.ts:32`) |
| `Auditoria` | sim (`auditoria.ts:30-42`: `autorUsuarioId` ou `autorOperador`, `requisicaoId`, sem `ip`) |
| "Ainda não existe — F2" (`Responsavel`, `ListaNome`, `Reivindicacao`, convite de professor e de sala) | sim: `convite.ts:6` só aceita `coordenador`; as outras três tabelas não existem |
| Regra transversal 1, com a exceção da identidade de login | sim: `conta` e `codigo_recuperacao` são as únicas sem `escolaId`, e o acesso sem escopo está cercado pela `ResolucaoDeTenantRepository` |

As três divergências da 20.0 (maior 2 da rodada 1) subiram e batem com o código:
`techspec.md:145` (a etapa `escolher` leva `acessos` — `packages/shared/src/sessao/login.ts:56`),
`techspec.md:435-442` (`resetQueries()` dentro de `guardarToken` — `apps/web/src/main.tsx:21-27`,
`apps/web/src/api/sessao.ts:253`), e `techspec.md:443-446` (o seletor explica em vez de levar ao
endereço da outra escola — `AVISO_DA_TROCA_RECUSADA` em `packages/shared/src/erros/mensagens.ts:100`,
usado em `apps/web/src/componentes/SeletorDeEscola.tsx:15` e provado em
`e2e/escola-e-vinculos.spec.ts:258`).

---

### 3. Portão

Não foi preciso `npm ci`: `node_modules/.package-lock.json` está na mesma data do
`package-lock.json`. Tudo rodado com a árvore limpa, no commit `38ce195`.

| Portão | Resultado |
|---|---|
| `npm run typecheck` | ✅ |
| `npm run lint` | ✅ (ESLint + guardas) |
| `npm run test` | ✅ 146 arquivos, 1.672 casos |
| `npm run test:e2e` | ✅ 132 casos, `chromebook` e `celular` |
| `npm run test:infra` | ✅ 5 arquivos, 35 casos |
| **Esteira do GitHub no commit validado** | ❌ execução 35517746419, `headSha` `38ce195…`: `verificar` ✅, `infra` ✅, **`integração` ❌**, **`e2e` ❌** |
| Revisões com veto registradas e aprovadas | ✅ (conferido de novo nas 20 tarefas: em todas, a última rodada de cada revisor com veto é APROVADO; as duas ressalvas de rastro da rodada 1 seguem, menores 5 e 6 de lá) |

Nenhum `.skip`, `.todo` ou teste comentado no repositório.

---

### 4. Achados

**Críticos**

1. **Esteira vermelha no commit validado** — execução `35517746419`, `headSha` `38ce195`, duas
   das quatro tarefas falharam. O commit não leva código, então não é regressão dele; é
   fragilidade que a execução expôs. Os dois casos, com a saída:
   - `apps/despachante/test/reconciliacao.int.test.ts` › "reconciliação entre job_registro e o
     BullMQ" › **"consulta sem resposta (Redis de fila travado, e depois parado) não republica;
     com o Redis de volta, republica"** — `AssertionError: expected [] to deeply equal [ Array(1) ]`,
     36.863 s. Único vermelho da tarefa (`Test Files 1 failed | 62 passed`).
   - `e2e/escola-e-vinculos.spec.ts:185` `[celular]` › **"isolamento: a troca que passa pelo
     segundo fator também não leva nada da escola de origem para a de destino"** —
     `expect(locator).toBeVisible() failed`, `getByRole('heading', { name: 'Olá, Professora
     sintética 6d728d84' })`, `Timeout: 20000ms`, em `esperarEscola` (`e2e/escola-e-vinculos.spec.ts:57`),
     caso de 27.4 s. `playwright.config.ts:29` tem `retries: 0`, então não houve repetição que
     mascarasse nada — e também não houve segunda chance que confirmasse a intermitência.
   **Correção:** fechar os dois pela `/corrigir` (um `slug` por causa), cada um com o teste que
   reproduz a condição, e só então repetir a validação. Enquanto a esteira do último commit
   estiver vermelha, a regra 40 (portão) e a D52 seguram a primeira tarefa do F2.

**Maiores**

1. `apps/despachante/test/reconciliacao.int.test.ts` — **teste dependente de tempo real.** Ele
   congela e para o Redis da fila e espera a republicação; o caso levou 36,9 s na esteira e
   falhou com a lista vazia, ou seja, a republicação não tinha acontecido ainda quando ele
   olhou. Aqui ele passou duas vezes seguidas (11 casos verdes em cada), o que confirma a
   dependência de máquina. É código do F0, não do F1.
   **Correção:** trocar a espera por condição observável (sondar até o registro aparecer, com
   teto) em vez de um instante, ou declarar o prazo em função do intervalo de reconciliação.
2. `e2e/escola-e-vinculos.spec.ts:185-232` — **o caso mais pesado do e2e está no limite do prazo
   dele no perfil `celular`.** Ele faz, num único teste: login por e-mail, escolha de escola,
   configuração e ativação do segundo fator, volta à entrada, segundo login, escolha de novo,
   leitura dos vínculos, troca de escola e mais um segundo fator — tudo com CPU ×4 e rede lenta
   (`playwright.config.ts:44-55`), com `PRAZO_DA_ENTRADA_MS = 20_000` (`:21`) dentro do prazo de
   30 s do teste. Na esteira ele estourou no `esperarEscola` do segundo login. Tentei reproduzir
   aqui e a tentativa não vale como evidência: rodei o spec isolado com o compose sem as APIs de
   pé (`educa-teste-api-*` saem depois do `test:infra`), e a tela mostrou "O sistema está
   indisponível" — erro meu, registrado para não virar conclusão errada de ninguém. No `npm run
   test:e2e` completo, com o ambiente que o `tools/ci/e2e.ts` levanta, ele passou.
   **Correção:** partir o caso em dois (configurar o segundo fator uma vez, reaproveitar o
   estado) ou preparar o MFA pelo seed, e revisar o prazo da entrada contra o tempo real do
   argon2 na esteira. Teste de isolamento que falha por tempo deixa de proteger o que ele existe
   para proteger.

**Menores**

1. `docs/modelo-de-dados.md:70` — a linha `papel`: `rede · coordenador · professor · aluno ·
   responsavel` ficou como estava enquanto o resto da seção foi reescrito. No código há dois
   níveis: `PAPEIS` (`rede`, `coordenador`, `professor`, `aluno` — `matriz.ts:18`) e
   `PAPEIS_DE_USUARIO` (os três que a tabela aceita, `matriz.ts:22`, com o check
   `usuario_papel_valido` em `usuario.ts:35`). `responsavel` não existe em nenhum dos dois, e
   `Responsavel` já foi para o bloco "Ainda não existe — F2" logo abaixo.
   **Correção:** citar os dois níveis e levar `responsavel` para o bloco do F2, junto da entidade.
2. `docs/modelo-de-dados.md:7-20` — a seção diz "Tudo isso existe desde o F1", e as tabelas do F0
   que existem no banco não estão em lugar nenhum do documento:
   `configuracao_operacional_escola`, `uso_infra_diario` e `job_registro`. Herança do F0, não
   deste commit, mas o documento se apresenta como o mapa do que existe.
3. `tasks/prd-identidade-e-tenancy/prd.md:3` — **Status: rascunho** num PRD cuja funcionalidade
   está construída e cujo texto acabou de ser revisto; o F0 usa "aprovado (revisto em …)"
   (`tasks/prd-fundacao-tecnica/prd.md:3`). **Correção:** marcar aprovado com a data da revisão.
4. `tasks/prd-identidade-e-tenancy/achados-revisoes.md:5260` — recomendação do `privacy-guardian`
   (4ª rodada da 20.0) sem destino: `saidaConfirmada` compartilhado entre a saída pedida e a
   inatividade (`apps/web/src/api/sessao.ts:88` e `:261`), dois fins de sessão com semânticas
   distintas num sinalizador só. Junta-se aos menores 1 e 2 da rodada 1.
5. `CLAUDE.md:8` diz que o repositório é `https://github.com/LitzGab/Educa.ia`, e o `origin`
   aponta para `https://github.com/LitzGab/Turmma.ai`. Não afeta código; afeta quem procura o
   repositório pelo documento.
6. Os menores 1 a 6 da rodada 1 seguem abertos e sem destino registrado (`BroadcastChannel` por
   sessão, `details` do seletor, passkey, auditoria de mudança de papel, rastro do
   `domain-researcher`, `revisor-geral` ausente na 1.0). Nenhum bloqueia.

**Positivos**

- O adiamento foi registrado do jeito certo: nos cinco lugares, com o motivo, com o que o F1
  entrega no lugar, e com a instrução do que a tarefa do F9 terá de fazer. É o modelo para todo
  recorte que sobrar de uma funcionalidade.
- `docs/modelo-de-dados.md` passou a separar "existe" de "ainda não existe — F2", em vez de
  descrever tudo no presente. Isso é o que impede a próxima Tech Spec de especificar em cima de
  uma tabela que não existe.
- A Tech Spec ganhou as três divergências com o **motivo** de cada uma, não só o que ficou. A de
  `resetQueries` explica por que o `clear` antes do token traria o dado da escola de origem de
  volta: é uma armadilha que a próxima pessoa evitaria de novo.

---

### 5. Conclusão

A escrita que a rodada 1 pediu está feita e está correta: conferi cada afirmação nova contra o
código, e todas se sustentam. Com o RF16 reescrito, os 21 RF do PRD estão atendidos, e a prova
de mutação nova mostra que o teste do histórico morre quando a regra morre.

O que impede a aprovação é o portão: a esteira do commit validado está vermelha em duas das
quatro tarefas. O portão local aqui está inteiro verde, e os dois casos vermelhos são de tempo —
um espera o Redis voltar, o outro espera uma tela no perfil `celular`. Isso não os torna menos
sérios: um deles é justamente um teste de isolamento entre escolas, e teste de isolamento que
falha por tempo não protege nada. Pelo processo, vermelho na esteira reprova e segura a próxima
tarefa.

**Caminho até a aprovação:**

1. `/corrigir` para `apps/despachante/test/reconciliacao.int.test.ts` (espera por condição, não
   por instante).
2. `/corrigir` para `e2e/escola-e-vinculos.spec.ts:185` (partir o caso ou preparar o MFA pelo
   seed, e rever o prazo da entrada contra o argon2 da esteira).
3. Empurrar, esperar a esteira verde no commit da segunda correção, e revalidar. Os menores não
   bloqueiam.

Se a decisão for que os dois casos são de ambiente e não de teste, ela precisa ser escrita — no
`TODO.md` ou numa decisão —, com o que muda na esteira para não se repetir. O que não vale é
revalidar em cima da mesma esteira vermelha.

---

### 6. Pendências herdadas

| Pendência | Destino |
|---|---|
| Histórico próprio do aluno | **fechado**: F9, registrado no PRD (seção 3), na Tech Spec (seção 5) e no `ROADMAP.md` |
| `docs/modelo-de-dados.md` desatualizado | **fechado** neste commit; sobraram os menores 1 e 2 |
| Divergências da 18.0 e da 20.0 fora da Tech Spec | **fechado** neste commit |
| Dois testes frágeis (maiores 1 e 2) | `/corrigir`, antes da primeira tarefa do F2 |
| `BroadcastChannel` por sessão, `details` do seletor, `saidaConfirmada` | `TODO.md` ou a primeira tarefa de web do F2 |
| Passkey | `/registrar-decisao`, ou a pergunta em aberto do PRD do F2 |
| Auditoria de mudança de papel | a tarefa do F2/F3 que criar o caminho de mudar papel |
| Rastro do `domain-researcher` na tabela de revisões | `/retro` do F1 |
| Status do PRD do F1 ainda "rascunho" | quem fizer a próxima edição do PRD |
| Endereço do repositório no `CLAUDE.md` | junto da decisão de nome e domínio (Gabriel) |
| Demais pendências do F0 (alertas, `VALIDATE` das FKs, controle negativo do `npm run carga`, calibração do argon2) | já em `TODO.md` e na Tech Spec, seção 12 |

---

## Rodada 1 — 20/09/2026

**Escopo:** funcionalidade completa (tarefas 1.0 a 20.0)
**Commit validado:** `6f6975429265e203b16cc116dbdd457f410b265c`
**Veredito: REPROVADA**

Um crítico: **RF16 está parcial**. A metade do professor está implementada e bem testada; a
metade "o aluno lê o próprio histórico" não tem código, não tem rota, e o teste de integração
que existe prova o contrário (o aluno recebe 404). A decisão de empurrar isso para o F9 foi
tomada dentro da 10.0 e não voltou para o PRD nem para a Tech Spec.

Tudo o mais está em ordem, e em bom estado: portão inteiro verde aqui, esteira verde no commit
exato, e as três provas de mutação que rodei ficaram vermelhas onde deveriam.

---

### 1. RF a RF

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 | ATENDIDO | `apps/api/src/ops/escola.ts:84-162`, `apps/api/src/ops/comando.ts:34` (`lerOperador`), `apps/api/src/sessao/convite.service.ts:149` | `apps/api/test/ops-escola.int.test.ts:208` ("lista as rotas registradas no Nest e nenhuma de escrita fala de rede ou escola"), `:51`, `:92`, `:119`; `apps/api/test/convite.int.test.ts:281` (arquivo 0600, terminal sem token/nome/e-mail), `:535` | A varredura de rotas é o que prova "nenhuma rota cria escola", e ela enumera o roteador do Nest, não uma lista à mão |
| RF2 | ATENDIDO | `packages/shared/src/estrutura/serie.ts:5-25`, `packages/nucleo/src/db/schema/serie.ts:29` (check `serie_no_recorte`), `apps/api/src/estrutura/turma.service.ts:48`, `packages/nucleo/src/db/schema/turma.ts:20-41` | `apps/api/test/estrutura.int.test.ts:111` ("5º ano" e "4º do EM" dão ENTRADA_INVALIDA, e o banco recusa os dois mesmo por fora da rota), `:228`, `:296`, `:313`, `:332` | Duas camadas: zod na entrada e check no banco, e o teste exercita as duas |
| RF3 | ATENDIDO | `apps/api/src/estrutura/vinculo.service.ts:75-93`, `packages/nucleo/src/db/schema/vinculo.ts:41` (default `pendente`), `packages/shared/src/permissao/matriz.ts:105` (professor `vinculo.criar: 'nunca'`) | `apps/api/test/vinculo.int.test.ts:76` (nasce `pendente`, `decidido_em: null`), `:357` ("professor não cria, não lista e não encerra vínculo"), `:281` | |
| RF4 | ATENDIDO | `apps/api/src/estrutura/vinculo.service.ts:107-151`, `apps/api/src/estrutura/vinculo.repository.ts:122-146`, `packages/nucleo/src/db/schema/vinculo.ts:70-72` (checks de código e complemento) | `apps/api/test/vinculo.int.test.ts:76` (confirma uma e contesta a outra, com autor e data), `:165`, `:196`, `:236`, `:382`, `:399`; e2e `e2e/escola-e-vinculos.spec.ts:266`, `:312`, `:342` | |
| RF5 | ATENDIDO | `apps/api/src/estrutura/turma.repository.ts:83-131` (`aberta`, `#comVinculoDoProfessor`), `:152` (`alunos`) | `apps/api/test/turma-acesso.int.test.ts:59` (pendente e contestado dão 404), `:90` (encerrado corta na requisição seguinte, mesmo token e mesma sessão), `:107`, `:120`, `:140` | Prova de mutação 2, abaixo |
| RF6 | ATENDIDO | `apps/api/src/sessao/login-email.controller.ts:20`, `apps/api/src/sessao/hash-de-senha.ts:15-45` (hash fixo para inexistente), `apps/api/src/sessao/senha/conferencia-na-vez.ts:48-82` | `apps/api/test/login-email.int.test.ts:178` (senha errada, e-mail inexistente, conta sem senha e desativado respondem igual, com um hash cada), `:223` (o bloqueio também não revela a conta); e2e `e2e/entrar.spec.ts:406` | A igualdade de tempo vem do hash fixo sempre rodado, não de medição em teste — é o desenho certo, e o teste conta os hashes |
| RF7 | ATENDIDO | `apps/api/src/sessao/acesso-da-escola.controller.ts:15`, `apps/api/src/sessao/matricula.service.ts:47` (`identificadorDoAluno`, chave `escolaId\|matricula`), schema `credencial_matricula` unique `(E, matricula)` | `apps/api/test/sessao-matricula.int.test.ts:172` (matrícula 1234 em A e em B, cada um só no slug da própria), `:375` (aluno transferido); e2e `e2e/entrar-na-escola.spec.ts:123` | |
| RF8 | ATENDIDO | `apps/api/src/sessao/externa/externa.service.ts:148-152` (`hd`/`tid` contra a lista da escola, tenant pessoal recusado), `apps/api/src/sessao/externa/conta-externa.repository.ts:5-9` (chave sem e-mail), `provedor-externo.port.ts:16-32` | `apps/api/test/sessao-externa.int.test.ts:219` (conta pessoal, hd de outra escola, tenant pessoal e não cadastrado — mesma recusa), `:368` (nem log nem tabela têm e-mail, nome ou foto), `:208`, `:413` | Prova de mutação 3, abaixo |
| RF9 | ATENDIDO | `apps/api/src/sessao/externa/externa.service.ts:156-169`, `:176-186` (`#ligar`), `conta-externa.repository.ts:83-111`; unique `(E, usuario_id)` em `conta_externa` | `apps/api/test/sessao-externa.int.test.ts:178` (primeira entrada liga, segunda entra pela ligação), `:303` (mesmo e-mail com outro sujeito é recusado), `:339` e `:354` (as duas corridas) | A orientação "procurar a coordenação" é a mensagem única de falha do provedor na tela (`e2e/entrar-na-escola.spec.ts:255`); não há e2e com a persona do professor nesse caso |
| RF10 | ATENDIDO | `apps/api/src/sessao/externa/externa.service.ts:160` (só professor é ligado pelo e-mail) | `apps/api/test/sessao-externa.int.test.ts:281` (aluna com domínio válido e sem ligação: nenhuma linha nova em `usuario`, `conta_externa` nem `sessao`); e2e `e2e/entrar-na-escola.spec.ts:238` | |
| RF11 | ATENDIDO | `apps/api/src/sessao/contador-de-tentativas.ts:7-9`, `:130-187` (chave por conta, HMAC, nunca IP), `apps/api/src/sessao/senha/rebaixamento.ts` (o IP só rebaixa a vez na fila, nunca recusa) | `apps/api/test/sessao-matricula.int.test.ts:293` (400 alunos do mesmo IP entram; o Enzo, com 10 erros, fica segurado), `:194`; `apps/api/test/login-email.int.test.ts:312` (35 professores do mesmo IP) | O freio efetivo é na 5ª falha, mais apertado que os 10 do texto do PRD — mais protetor, não menos |
| RF12 | ATENDIDO | `apps/api/src/sessao/mfa.service.ts:54-110`, `apps/api/src/sessao/segundo-fator.ts:9-63`, `apps/api/src/sessao/login.service.ts:148` (`etapaDoLogin` → `configurar_mfa`) | `apps/api/test/mfa.int.test.ts:282` (sem MFA só alcança a configuração), `:378` (recuperação de uso único, inclusive em paralelo), `:395`; e2e `e2e/mfa.spec.ts:45` (bloco "sem celular"), `:116`, `:146` | Chave de acesso não existe; ver menor 3 |
| RF13 | ATENDIDO | `packages/nucleo/src/identidade/avaliar-sessao.ts:9-35`, `packages/nucleo/src/db/schema/escola.ts:32` (padrão 30, por escola), `apps/api/src/sessao/cookies.ts:14-37` (cookie sem `Max-Age`), `apps/web/src/componentes/Cabecalho.tsx:13-63` ("Sair" em toda tela) | `apps/api/test/inatividade.int.test.ts:30`, `:60` (Chromebook do carrinho), `:80`; `apps/api/test/sessao-matricula.int.test.ts:420` (inatividade por escola); e2e `e2e/inatividade.spec.ts:56`, `:258`, `e2e/entrar.spec.ts:324` | A restauração de sessão do Chrome sobrevive ao cookie; está declarada na Tech Spec, seção 12, com a inatividade no servidor como garantia |
| RF14 | ATENDIDO | `apps/api/src/sessao/troca-de-escola.service.ts:38-80`, `apps/api/src/sessao/eu.repository.ts:20`, `apps/api/src/sessao/resolucao-de-tenant.repository.ts:119`, `:133` | `apps/api/test/troca-de-escola.int.test.ts:211`, `:281`, `:298` (depois da troca, a turma de A dá 404), `:320`, `:665`; e2e `e2e/escola-e-vinculos.spec.ts:123`, `:185` | |
| RF15 | ATENDIDO | `packages/nucleo/src/identidade/guarda-sessao.ts:37-62`, `packages/nucleo/src/contexto/escola-do-contexto.ts:8`, `packages/nucleo/src/contexto/ano-em-curso.ts:10`, repositories de `apps/api/src/estrutura/*` | `apps/api/test/contexto.int.test.ts:147` (`x-escola-id` e `?escolaId=` de B são ignorados), `:181`; `apps/api/test/turma-acesso.int.test.ts:225-423` (bloco de isolamento), `:318` (o escopo de escola vale sozinho), `:374` (FKs compostas como segunda camada); `apps/api/test/estrutura-isolamento.int.test.ts:74`, `:93`, `:123`; `packages/nucleo/src/auditoria/auditoria.int.test.ts:50` | Prova de mutação 1, abaixo |
| RF16 | **PARCIAL** | Professor e coordenação: `apps/api/src/estrutura/turma.repository.ts:74-144` (`#doAnoDaLeitura`, `#confirmadoAteOFimDoAno`). **Aluno: sem código** — nenhuma rota, e `MATRIZ.aluno` tem `turma.ler`, `vinculo.ler_proprios` e `aluno_da_turma.ler` em `nunca` (`packages/shared/src/permissao/matriz.ts:109-123`) | `apps/api/test/historico.int.test.ts:129`, `:142` (só leitura), `:179`, `:190`, `:262`. Para o aluno, `:204` prova a **recusa**, não a leitura | Crítico 1 |
| RF17 | ATENDIDO | `packages/shared/src/permissao/matriz.ts:32-136` (`RECURSOS`, `MATRIZ`, `alcanceDe`), `matriz.expectativa.ts`, `packages/nucleo/src/permissao/conferencia-das-permissoes.ts:47` | `packages/shared/src/permissao/matriz.test.ts:15` (célula a célula contra a expectativa escrita à mão, nos dois sentidos), `:26` (a comparação pega uma célula trocada), `:41` (indicador de professor), `:34` (a rede nunca tem alcance individual); `apps/api/test/permissao-no-boot.test.ts:51` (rota sem `@Permite` derruba o boot) | Não é um `it` por célula, é uma comparação total contra uma cópia manual, com teste que prova que a comparação pega a troca. Cumpre o que o RF pede |
| RF18 | ATENDIDO | Contratos `esquemaResposta*` em `packages/shared`, todos `.strict()`, e os controllers e services fazem `.parse()` na saída (`apps/api/src/sessao/eu.service.ts:22`, `apps/api/src/estrutura/*.service.ts`, `apps/api/src/sessao/*.controller.ts`) | `apps/api/test/contratos.test.ts:98` (varre todo `esquemaResposta*` exportado, em qualquer profundidade), `:102` (a exceção do segredo só vale no contrato do configurar), `:107` (reprova a fixture com `senhaHash`, `mfaSegredo`, `sujeitoExterno`, `refreshToken`, `Cookie`), `:126`; `apps/api/test/troca-de-escola.int.test.ts:665` | A varredura acha contrato novo sozinho, e a exceção nominal é única e declarada |
| RF19 | ATENDIDO | `packages/nucleo/src/auditoria/acoes.ts:43-260` (mapa fechado de 21 ações), `registro-de-auditoria.ts:33-38` (porta única), chamadas em `apps/api/src/ops/escola.ts:88`, `:105`, `apps/api/src/estrutura/vinculo.service.ts:88`, `:122`, `:141`, `apps/api/src/sessao/redefinicao-de-mfa.ts:38`, `:43`, `apps/api/src/sessao/externa/externa.service.ts:182` | `packages/nucleo/src/auditoria/auditoria.int.test.ts:84`, `:111`; `packages/nucleo/src/auditoria/acoes.test.ts` (schema fechado, campo pessoal recusado); conferência por consulta à tabela em `vinculo.int.test.ts:196`, `:257`, `mfa.int.test.ts:462`, `historico.int.test.ts:105` | "Mudança de papel" não tem ação porque não há caminho de mudar papel no F1; ver menor 4 |
| RF20 | ATENDIDO | `playwright.config.ts:24-56` (projetos `chromebook` e `celular`, sem filtro por projeto), telas em `apps/web/src/paginas/*`, estados em `apps/web/src/componentes/estado/*` | `e2e/entrar.spec.ts:67`, `:90`, `:214`; `e2e/entrar-na-escola.spec.ts:64`, `:101`, `:143`, `:213`; `e2e/mfa.spec.ts:46`, `:146`; `e2e/convite.spec.ts:20`; `e2e/escola-e-vinculos.spec.ts:92`, `:312`, `:388` (os quatro estados, explícito). 132 casos verdes nos dois projetos | |
| RF21 | ATENDIDO | `infra/k6/login-7h30.js` (p95 1 s, 2.100 contas, 840 no 1º minuto, `respostas_429 == 0` como threshold), `infra/scripts/carga-login.ts:320-330` (hash real calibrado), `infra/scripts/conferir-carga-login.ts` | Resultado registrado em `16_task.md:128-170`: p95 do login 40 ms (máx. 202 ms), zero 429 legítimo, e o **controle negativo reprovou** (saída 0 com `LOGIN_PROTECAO_DESLIGADA`, p95 entre 2,15 e 2,19 s) | O cenário não roda na esteira; o critério é o threshold do k6 com execução registrada. É o desenho previsto na Tech Spec 7c |

**Contagem:** 20 atendidos, 1 parcial, 0 não atendidos, 0 não verificáveis.

Provas de mutação (três, todas restauradas com `git checkout --`; árvore limpa ao fim):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF15 | `eq(turma.escolaId, exigirEscolaDoContexto())` de `TurmaRepository.aberta` (`apps/api/src/estrutura/turma.repository.ts:90`) | `apps/api/test/turma-acesso.int.test.ts:318` — "o escopo de escola vale sozinho: com o ano e o usuário de B num contexto de A, nenhum repository alcança B" (1 de 14 vermelho; os testes por rota seguiram verdes porque a FK composta e o ano são a segunda camada, que é exatamente o que o teste isola) |
| RF5 | `eq(vinculo.estado, 'confirmado')` de `#comVinculoDoProfessor` (`turma.repository.ts:127`) | 4 de 14 vermelhos em `apps/api/test/turma-acesso.int.test.ts` (pendente/contestado abrindo a turma, entre outros) |
| RF8 | `await repositorio.dominioLiberado(...)` de `#decidir` (`apps/api/src/sessao/externa/externa.service.ts:150`) | 3 de 21 vermelhos em `apps/api/test/sessao-externa.int.test.ts` (conta pessoal e domínio de outra escola entrando; a escola que revoga o domínio seguindo a entrar) |

---

### 2. Regras de negócio, casos de borda e critério de pronto

**Regras de negócio do PRD (seção 6)**

| Item | Situação | Evidência |
|---|---|---|
| Escola é o tenant e ano letivo a segunda dimensão; escopo do token | cumprida | `guarda-sessao.ts:37-62`; `contexto.int.test.ts:147`; mutação 1 |
| Matrícula única por escola, nunca globalmente | cumprida | unique `(E, matricula)` em `credencial_matricula`; `sessao-matricula.int.test.ts:172` |
| Vínculo definido pela escola e só confirmado pelo professor | cumprida | `matriz.test.ts:57`; `vinculo.int.test.ts:357` |
| Aluno sem e-mail, telefone nem foto; da conta externa, só o identificador | cumprida | `sessao-externa.int.test.ts:368`; `contratos.test.ts:126` |
| "Não encontrado" e "sem permissão" respondem igual | cumprida | `turma-acesso.int.test.ts:175`, `:285`; `vinculo.int.test.ts:382` |
| Sem cadastro público, e o operador não lê dado de pessoa | cumprida | `ops-escola.int.test.ts:208`; `convite.int.test.ts:281` |
| Nenhum fluxo exige celular | cumprida | `e2e/mfa.spec.ts:45` (segredo em texto + copiar, QR como conveniência) |
| Fim de vínculo desativa o acesso | cumprida | `turma-acesso.int.test.ts:90` |

**Casos de borda do PRD (seção 7)**

| Item | Situação | Evidência |
|---|---|---|
| Professor discorda de uma alocação | coberta | `vinculo.int.test.ts:76`; `e2e/escola-e-vinculos.spec.ts:266` |
| Turma sem professor alocado | coberta | `turma-acesso.int.test.ts:175` |
| Professor com duas disciplinas na mesma turma | coberta | `vinculo.int.test.ts:76`; `turma-acesso.int.test.ts:140` |
| Professor sai em março de uma das duas escolas | coberta | `turma-acesso.int.test.ts:406` |
| Aluno transferido de escola | coberta | `sessao-matricula.int.test.ts:375`; `turma-acesso.int.test.ts:120` |
| Virada de ano letivo | coberta | `virada-do-ano.int.test.ts`; `historico.int.test.ts:129`, `:142` |
| Chromebook do carrinho entre duas turmas | coberta | `inatividade.int.test.ts:60`; `e2e/entrar.spec.ts:324` |
| Admin não liberou o app no Google para menores | coberta | `sessao-externa.int.test.ts:462`; `e2e/entrar-na-escola.spec.ts:255` |
| E-mail de professor recriado para outra pessoa | coberta | `sessao-externa.int.test.ts:303`, `:354` |
| Escola com dois domínios Google | coberta | `sessao-externa.int.test.ts:323` |
| Único coordenador perde app e códigos | coberta | `apps/api/src/ops/redefinir-mfa.ts`; `mfa.int.test.ts:462`; `ops/redefinir-mfa.test.ts` |
| Escola revoga o app no meio do ano | coberta | `sessao-externa.int.test.ts:259` |

**Critério de pronto (tasks.md e ROADMAP.md)**

| Item | Situação | Evidência |
|---|---|---|
| Os 21 RF têm código e teste que falharia sem a regra | **faltando** | RF16, metade do aluno (crítico 1) |
| Testes de isolamento da Tech Spec seção 6 verdes, e cada um quebra sem a cláusula de escola | cumprido | suíte verde + mutação 1 |
| Nenhum caminho de login recusa um aluno por causa de outro no mesmo IP; `login-7h30` passa | cumprido | `sessao-matricula.int.test.ts:293`; `16_task.md:128-170` |
| Nenhum e-mail, nome, foto ou claim de aluno no banco nem no log | cumprido | `sessao-externa.int.test.ts:368` |
| O token sintético não existe mais, e os testes e o cenário do F0 continuam verdes | cumprido | `validar-config.test.ts:41`; `contexto.int.test.ts:218`; suíte verde |
| `docs/lgpd.md` com todas as linhas dos campos novos | cumprido | `docs/lgpd.md:51` (hash), `:53` (MFA e recuperação), `:55` (contador), `:58-59` (vínculo, estado, motivo), `:39`, `:60`, `:62` |
| `docs/runbook.md` com uma entrada por alerta novo | cumprido | `docs/runbook.md:203`, `:157`, `:285`, `:244`, `:333`, `:78`; guarda em `tools/guardas/alerta-tem-runbook.test.ts` |
| Portão inteiro verde e esteira verde no commit final | cumprido | seção 3 |
| Roadmap: "A não lê, não escreve e não descobre nada da B; professor nas duas não leva dado de uma para a outra" | cumprido | `turma-acesso.int.test.ts:225-423`; `troca-de-escola.int.test.ts:298`; `e2e/escola-e-vinculos.spec.ts:123`, `:185` |

---

### 3. Portão

Não foi preciso `npm ci`: o `node_modules` está na mesma data do `package-lock.json`.
Tudo rodado com a árvore limpa, no commit `6f69754`.

| Portão | Resultado |
|---|---|
| `npm run typecheck` | ✅ |
| `npm run lint` | ✅ (ESLint + guardas) |
| `npm run test` | ✅ 146 arquivos, 1.672 casos |
| `npm run test:e2e` | ✅ 132 casos, `chromebook` e `celular` |
| `npm run test:infra` | ✅ 5 arquivos, 35 casos |
| Esteira do GitHub no commit validado | ✅ execução 35501826855, `headSha` `6f69754…`, as quatro tarefas (verificar, integração, e2e, infra) `success` |
| Revisões com veto registradas e aprovadas | ✅ com uma ressalva de rastro (menor 5) |

Nenhum `.skip`, `.todo` ou teste comentado no repositório.

---

### 4. Achados

**Críticos**

1. `tasks/prd-identidade-e-tenancy/prd.md:74` (RF16) · `packages/shared/src/permissao/matriz.ts:109-123` — **"o aluno lê o próprio histórico" não foi implementado por nenhuma tarefa.** Não existe rota que devolva ao aluno as turmas dele de anos encerrados, nem os vínculos dele: na `MATRIZ`, o aluno tem `turma.ler`, `turma.listar`, `aluno_da_turma.ler` e `vinculo.ler_proprios` todos em `nunca`, e `GET /v1/eu` só devolve a escola e o papel de agora. O único teste que toca o caso prova a recusa: `apps/api/test/historico.int.test.ts:204` ("...o aluno com `?anoLetivoId` é recusado"). A decisão de adiar está registrada só dentro da tarefa — `tasks/prd-identidade-e-tenancy/10_task.md:99`, "Histórico do aluno sobre o próprio ano anterior além de `/v1/eu`: F9" — e não voltou nem para a seção 3 do PRD ("Fora de escopo"), nem para a Tech Spec, cuja seção 5 ("Histórico", `techspec.md:267-269`) só fala de coordenação e professor. O PRD também declara isso na tabela de papéis (`prd.md:44`: o aluno pode "ver a si e o próprio histórico").
   **Correção:** decidir e registrar. Ou (a) implementar a leitura própria do aluno no F1 — célula na `MATRIZ`, rota, DTO e teste que quebre sem a cláusula de `usuario_id` do contexto; ou (b) aceitar o adiamento, e então mover a cláusula do RF16 para a seção 3 do PRD com o destino (F9), anotar a Tech Spec na seção 5, e registrar a pendência no `ROADMAP.md` do F9. O caminho (b) é defensável: no F1 o "histórico" do aluno seria só a lista de turmas passadas, sem nota nem entrega, e o valor real aparece com o F9. Mas precisa estar escrito onde a próxima pessoa lê, não dentro de uma tarefa de dez dias atrás.

**Maiores**

1. `docs/modelo-de-dados.md:20-47` — **o documento de modelo de dados contradiz o que foi construído.** `Usuario` ainda aparece como entidade única por escola com `email?`, `matricula?`, `senhaHash?`, `contaExternaId?` e `mfa?` embutidos (`:20-21`), quando o F1 implementou `conta` global + `usuario` por escola + `credencial_matricula` + `conta_externa` como tabelas separadas. `Vinculo` (`:22-23`) não tem `estado`, `contestacao`, `complemento` nem `motivo_encerramento`, que são o coração dos RF3, RF4 e RF5. Não existem `Sessao`, `RegistroAcesso`, `CodigoRecuperacao` nem `ProvedorEscola`. E `:45-47` ainda pergunta "usuário por escola ligado a uma identidade de login, ou identidade global com vínculos por escola? é decisão da Tech Spec do F1" — decisão já tomada e implementada. `Convite` (`:25-26`) descreve `tipo (professor | sala)`, e o implementado só aceita `coordenador`.
   **Correção:** atualizar `docs/modelo-de-dados.md` com o modelo da Tech Spec seção 3, marcando o que ainda é F2 (`ListaNome`, `Reivindicacao`, convite de professor e de sala) como futuro, e não como presente. É o documento que a próxima Tech Spec vai ler.

2. `tasks/prd-identidade-e-tenancy/techspec.md:131-157` e `:425-427` — **a Tech Spec ficou para trás do código em dois pontos, com a divergência registrada só na tarefa 20.0.** (a) A tabela da seção 4 ainda diz que `POST /v1/sessao/email` responde `{ etapa, desafio? }`, mas a etapa `escolher` passou a levar também `acessos` (`20_task.md:101-106`, sem o que a tela `/escolher-escola` não funcionaria, RF14). (b) A seção 9 ainda nomeia `queryClient.clear()` na troca de escola, e a 20.0 implementou outro caminho — o próprio `revisor-geral` apontou isso na 4ª rodada (`achados-revisoes.md:5218`). A divergência 2 da 20.0 (o seletor não leva ao endereço da outra escola) também está só na tarefa.
   **Correção:** levar as três para a Tech Spec, como as decisões da 10.0, da 13.0 e da 17.0 já foram levadas. A Tech Spec é o que o `/criar-techspec` do F2 vai ler para não repetir a discussão.

**Menores**

1. `apps/web/src/sessao/inatividade.ts:19` — recomendação do `revisor-geral` (4ª rodada da 20.0) sem destino: o `BroadcastChannel` é por origem, não por sessão, então duas abas com pessoas diferentes adiam o vencimento uma da outra. Amarrar o nome do canal ao `usuarioId` de `quemEstaNaSessao()` fecha. Destino sugerido: `TODO.md` ou a primeira tarefa do F2 que mexer na web.
2. `apps/web/src/componentes/SeletorDeEscola.tsx:73` — recomendação do `revisor-geral` sem destino: o `details` fica aberto depois da troca, listando a escola de onde a pessoa veio. Não vaza dado (o nome da escola é dela mesma), mas contradiz o "tudo abaixo é da escola ativa" do RF14 na leitura da tela.
3. `tasks/prd-identidade-e-tenancy/prd.md:66` e `:137` — a "chave de acesso é opcional" do RF12 não existe, e a pergunta em aberto "Chave de acesso (passkey) no F1 ou depois?" foi respondida só dentro das tarefas (`6_task.md:130` e `19_task.md:109`: "depois do F1"). A Tech Spec não menciona passkey em lugar nenhum. O RF12 está atendido no que importa (TOTP + códigos de recuperação, sem celular), e "opcional" é literalmente opcional — mas a resposta à pergunta em aberto precisa sair da tarefa e entrar no PRD ou numa decisão.
4. `packages/nucleo/src/auditoria/acoes.ts:43-260` — o RF19 pede auditoria de "mudança de papel", e não existe ação para isso. Não é falta: não há caminho no F1 que mude o papel de um usuário (nenhuma rota, nenhum comando). Fica como lembrete para a tarefa do F2 ou do F3 que criar esse caminho — ela nasce devendo a ação de auditoria.
5. `tasks/prd-identidade-e-tenancy/13_task.md:4` — o `domain-researcher` é subagente obrigatório da 13.0 e não tem rodada na seção "Revisões" da tarefa. Ele de fato rodou: a Tech Spec, seção 12, registra o resultado datado de 18/09/2026 (três premissas confirmadas ✅ e uma ainda ⚠️), e o checklist da tarefa (`13_task.md:122`) está marcado. O hook `tools/processo/revisoes.ts` só registra revisor com veredito, e o `domain-researcher` não dá veredito. Não é revisor sem rodada; é rastro que fica fora da tabela. Correção sugerida: ou o hook passa a registrar também o pesquisador, ou a tabela de subagentes do `tasks.md` separa "revisores" de "pesquisa".
6. `tasks/prd-identidade-e-tenancy/1_task.md` — a 1.0 não tem rodada de `revisor-geral`. É consistente com o processo da época: a 1.0 foi commitada em 15/09/2026 às 12:24, e o `revisor-geral` nasceu no commit `7dfbd81` (D53) às 19:31 do mesmo dia. Registrado só para que a leitura da tabela não pareça uma falha.

**Positivos**

- O par `matriz.ts` + `matriz.expectativa.ts`, com um teste que prova que a comparação pega uma célula trocada, é a forma mais barata de fazer uma matriz de permissão não apodrecer. Vale repetir em toda matriz futura.
- `apps/api/test/contratos.test.ts` varre os contratos por reflexão em vez de listá-los: contrato novo entra na varredura sozinho, e a exceção é nominal e única. Esse é o desenho certo para o RF de DTO de saída de toda funcionalidade.
- Cada teste de varredura tem um caso que prova que a varredura enxerga o código (`arquitetura.test.ts:45`, `contratos.test.ts:88`). É o antídoto para o teste que passa porque não achou nada.
- `10_task.md:105-138` ("Notas da implementação", com as mutações conferidas à mão listadas uma a uma) é o melhor registro de tarefa do repositório até aqui. A seção "Divergências resolvidas nesta tarefa" da 20.0 também — só falta ela subir para a Tech Spec.
- A `ResolucaoDeTenantRepository` concentrar os 25 `@SemEscopo`, com um teste de arquitetura que prova que só o módulo `sessao` a importa, transforma um desvio da regra 10 numa fronteira auditável em vez de num furo espalhado.

---

### 5. Conclusão

O F1 está, no essencial, construído e provado: 20 dos 21 RF atendidos com teste que falharia
sem a regra, isolamento verificado por mutação em três frentes de risco, portão inteiro verde
aqui e esteira verde no commit exato. A qualidade dos testes é acima da média do que a regra 40
exige — eles provam regra, não status.

O que reprova é uma coisa só e é do tipo que esta validação existe para achar: um pedaço de RF
que nenhuma tarefa cobriu, adiado numa nota dentro de uma tarefa, sem voltar para o PRD nem para
a Tech Spec. Quem ler o PRD do F1 hoje vai acreditar que o aluno lê o próprio histórico, e ele
não lê.

**Caminho até a aprovação**, por `/corrigir` ou por uma tarefa curta:

1. Decidir o crítico 1 — implementar a leitura própria do aluno, ou registrar o adiamento no PRD
   (seção 3), na Tech Spec (seção 5) e no `ROADMAP.md` do F9.
2. Atualizar `docs/modelo-de-dados.md` (maior 1).
3. Levar as três divergências da 18.0 e da 20.0 para a Tech Spec (maior 2).
4. Revalidar. Os menores não bloqueiam.

Se a decisão do passo 1 for adiar, os passos 1 a 3 são só escrita: não mexem em código, não
mexem no portão, e a revalidação é rápida.

---

### 6. Pendências herdadas

| Pendência | Destino |
|---|---|
| Histórico próprio do aluno (crítico 1, se a decisão for adiar) | F9, com a linha no `ROADMAP.md` e no PRD do F1 |
| `BroadcastChannel` por sessão e `details` do seletor (menores 1 e 2) | `TODO.md` ou a primeira tarefa de web do F2 |
| Passkey (menor 3) | `/registrar-decisao`, ou a pergunta em aberto do PRD do F2 |
| Auditoria de mudança de papel (menor 4) | a tarefa do F2/F3 que criar o caminho de mudar papel |
| Rastro do `domain-researcher` na tabela de revisões (menor 5) | `/retro` do F1 |
| Alerta para `login.externo{resultado="provedor"}` em massa, e claim `xms_edov` da Microsoft | já em `TODO.md` (revisão da 13.0) |
| Alerta para rotina do sistema que parou (`sistema.expurgar-acesso`) | já em `TODO.md`, antes da primeira escola real |
| `VALIDATE` das FKs `NOT VALID` das tabelas do F0 | já em `TODO.md`, migration de deploy fora do horário letivo |
| Controle negativo do `npm run carga` do F0 que parou de reprovar | já em `TODO.md`; não afeta o `login-7h30` do F1, cujo controle negativo reprovou em 19/09/2026 |
| Calibração do argon2 medida nesta máquina, não no staging | Tech Spec seção 12; recalibrar pelo mesmo cenário quando o staging existir (D42) |
