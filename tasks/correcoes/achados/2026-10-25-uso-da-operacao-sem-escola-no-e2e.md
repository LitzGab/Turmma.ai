# Achados das revisões — `tasks/correcoes/2026-10-25-uso-da-operacao-sem-escola-no-e2e.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 19:36:10 · `tasks/correcoes/2026-10-25-uso-da-operacao-sem-escola-no-e2e.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. Esta correção só mexe em fixtures e spec de e2e do Uso da operação. `semearEscolaDoConvite` grava rede, escola e coordenação/convite; `semearPainel` grava escolas e o uso diário de cada uma. Nenhum dos dois toca em `nota`. Todos com autor humano? Não se aplica.
Decisão autônoma sobre aluno: ausente.
Aprovação registrada: ok. O diff não tem saída de IA, entrega de agente nem fluxo de aprovação.
Supervisão do tutor: ok. O diff não toca no tutor.
Autonomia declarada e visível: sim. Nada mudou em `governanca` nem em `docs/agentes.md`.
Bloqueantes: nenhum.

Itens conferidos contra a regra 70:
- **Item 1 (Nota com autor humano):** os seeds novos ou alterados, `umaEscolaNoBanco()` e `semearPainel({ usoNoTopo })` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/__fixtures__/painel.ts:106-114` e `:216-226`, não abrem nenhum caminho de escrita em `Nota`.
- **Itens 8 e 9 (D46/D55, D45/D64):** o Uso da operação mede requisições, tarefas e armazenamento por escola, no painel da equipe Turmma (D76). O diff não cria indicador de professor, ranking de professor, nem nota ou devolutiva em discursiva ou redação. A ordem "por uso" é entre escolas, para a operação; não é métrica de professor nem de aluno.
- **Item 7 (vigilância):** o diff não infere estado emocional, não mede navegação nem tempo ocioso.
- **Seed sintético (regra 20, item 17, por tabela):** os nomes saem de `nomeQueVemPrimeiro('Escola sintética do convite')`, então não há dado real.

O prompt não trouxe fotos da tela, por isso não houve leitura visual.

Recomendações:
- Há uma linha em branco duplicada logo depois do comentário do topo, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/operacao-uso.spec.ts:16-17`. Vale tirar.
- A escola de `umaEscolaNoBanco()` fica no banco depois do teste. A própria correção reconhece isso e deixa a limpeza do banco de teste para outra correção; vale registrar essa correção no `TODO.md` para ela não se perder.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-25 19:36:11 · `tasks/correcoes/2026-10-25-uso-da-operacao-sem-escola-no-e2e.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nem migration. A correção mexe só no seed sintético do e2e (`rede`, `escola`, coordenação e convite em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/__fixtures__/painel.ts`). Os ids continuam sendo os UUIDs gerados pelo banco no `returning id`.

Queries verificadas: as que mudaram são inserts e selects de fixture, fora de `apps/*/src` e `packages/*/src`. Não muda nenhum repository, nenhum endpoint e nenhuma consulta de produção. A única coisa que muda no seed do painel é o valor numérico de uso (`usoDaVez` com `MARGEM_DO_USO_NO_TOPO`), sem efeito no escopo. O `GET /v1/operacao/uso` também não mudou. Ele é da operação da equipe Turmma (D76), lista todas as escolas por desenho e nesta tarefa não ganhou parâmetro novo.

Teste de isolamento: não se aplica. A tarefa não cria módulo, repository nem endpoint, então nenhum teste de isolamento novo é exigido. Os casos alterados não afirmam nada sobre escopo de tenant, e nenhum teste de isolamento existente foi removido ou enfraquecido.

Bloqueantes: nenhum

Recomendações:
- `e2e/operacao-uso.spec.ts:39-45`: a escola criada por `umaEscolaNoBanco()` não é removida no `afterEach`, então rede, escola e convite sintéticos se acumulam no banco da máquina. A própria tarefa já registra isso como correção à parte (limpeza do banco de teste). Vale abrir essa correção para que o resíduo não volte a mascarar dependências entre casos.
- `e2e/operacao-uso.spec.ts:16`: há duas linhas em branco seguidas depois do comentário do topo. É só formatação.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-25 19:36:16 · `tasks/correcoes/2026-10-25-uso-da-operacao-sem-escola-no-e2e.md`

VEREDITO: APROVADO

A correção só mexe em fixture e em spec de e2e. Ela não cria campo, rota, DTO, log, auditoria nem envio externo, e o único dado novo que entra no banco é uma rede e uma escola sintéticas.

Campos pessoais tocados: nenhum. `umaEscolaNoBanco()` chama `semearEscolaDoConvite('sem_convite')`, que grava só `rede` (nome "Rede sintética do convite") e `escola` (nome "Escola sintética do convite", slug `convite-<uuid>`). No estado `sem_convite`, `coordenacaoNoEstado` sai na primeira linha (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/__fixtures__/painel.ts:72`) e não cria `conta`, `usuario` nem `convite`. O `usoNoTopo` só soma uma margem ao número de requisições semeado, que é uso de escola e não dado de pessoa.
Fora da tabela de dados do docs/lgpd.md: nenhum (não há campo novo).
Autorização por objeto: ok. Nenhuma rota, repository ou DTO mudou. Os casos continuam usando o operador do painel de operação contra `/v1/operacao/uso`, como antes.
Logs: limpos. Não há `console` nem `logger` nos dois arquivos.
Auditoria: não há ação nova que a exija (leitura de aluno, exportação, nota, permissão ou saída de IA).
Envio externo: nenhum.
Seed/fixture: sintético. A escola semeada não é apagada depois do caso. Isso é limpeza do banco de teste, que a própria correção deixa para depois, e o dado é sintético e sem pessoa.
Bloqueantes: nenhum.
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/operacao-uso.spec.ts:16`: o diff deixou duas linhas em branco seguidas depois do comentário do topo. É só aparência; tire uma, se o lint ou o formatador não tirar.
- Quando sair a correção de limpeza do banco de teste, inclua nela as escolas de `umaEscolaNoBanco()`. Elas se acumulam a cada corrida na máquina.

Pergunta de fechamento: a correção não muda o que o sistema guarda sobre um aluno nem para onde isso vai, então a resposta continua a mesma de antes desta correção.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-25 19:36:28 · `tasks/correcoes/2026-10-25-uso-da-operacao-sem-escola-no-e2e.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum

A correção só mexe no e2e. Nenhum código de produção, migration, fila, gateway de IA nem endpoint muda, então a pergunta das 10h não tem o que avaliar em produção. Pelo lado do teste:

- Os três casos que dependiam do banco vazio (referência, W7 e "a escola criada pela tela") agora semeiam a própria escola com `semearEscolaDoConvite('sem_convite')`, que já existia e já era usada nas suítes de convite.
- No W6, `usoNoTopo` soma 1e12 ao `Date.now() * 100`. O relógio só alcança essa margem em cerca de 115 dias. O número continua com 15 dígitos e fica bem abaixo de 2^53, então a afirmação de largura a 360 px continua valendo.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/operacao-uso.spec.ts`, linha 17: sobrou uma linha em branco dupla depois do comentário do topo. Conferir com o formatador.
- A garantia do `usoNoTopo` vale enquanto até 3 W6 com `usoNoTopo` semeiam ao mesmo tempo (8 × 3 = 24 escolas, abaixo das 25 da página). Com `--repeat-each=3 --workers=6` podem ser até 6 em paralelo, e passou por causa do momento em que cada um semeou. Vale anotar esse teto no comentário do teste.
- As escolas que `umaEscolaNoBanco()` cria não são apagadas. O banco local cresce a cada execução, e isso só piora a lista "a primeira por nome". Registrar junto da correção de limpeza do banco de teste que a tarefa já cita.
- `git diff --stat` agora mostra também `tasks/correcoes/achados/indice.md` alterado, que não está na lista de arquivos desta tarefa. Conferir se a mudança é desta correção antes do commit.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-25 19:37:57 · `tasks/correcoes/2026-10-25-uso-da-operacao-sem-escola-no-e2e.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- Os três casos (W7, referência e "a escola criada pela tela") passam com o banco vazio, como na fatia da esteira, nos dois projetos.
- Esses mesmos casos passam com o banco cheio de escolas de outras execuções.
- O W6 do Uso passa com outros painéis semeados ao mesmo tempo (14.4, RF23 e o W6 do outro projeto, com 6 trabalhadores).
- A correção não piora a resistência a painéis concorrentes de quem continua com o painel comum, como o W6 e W10 de `e2e/operacao-escolas.spec.ts`, que também afirma a posição das suas escolas na ordem por uso.
- Uma escola que sobra de uma execução interrompida não quebra a próxima execução no banco local que acumula.
- O que os casos afirmam continua igual: nenhuma asserção afrouxada.

**Cobertos:**
- **W7, referência e "a escola criada pela tela".** Cada um chama `umaEscolaNoBanco()` antes de entrar na tela (`e2e/operacao-uso.spec.ts:252`, `:340`, `:384`). Isso basta para cada caso:
  - W7: a região "Uso por escola" e o alerta dela em `:314`.
  - Referência: o `primeira` existe em `:352`.
  - "Criada pela tela": o `not.toEqual([])` de `:393`. A escola semeada tem o nome gerado antes do `nomeQueVemPrimeiro` de `:399`, então não tira a escola do teste da primeira página.
- **Asserções.** Nenhuma foi tocada. Sem `.skip`, sem mock novo, sem IA.
- **W6 do Uso.** Com `usoNoTopo`, as duas escolas dele só concorrem com as 8 do W6 do outro projeto. Na pior posição ficam no índice 9, abaixo de 25, e o `:182` passa a valer contra os painéis comuns.
- **Mutação.** O `**Sem mutação:**` está certo: só `e2e/` mudou, e a RF17 não se aplica.

**Bloqueantes:**

1. **O `usoNoTopo` deixa o W6 e W10 de Escolas mais frágil sob concorrência, e isso não foi provado.**
   - Onde: `e2e/__fixtures__/painel.ts:114`, com o uso em `e2e/operacao-uso.spec.ts:100`, contra `e2e/operacao-escolas.spec.ts:91`, `:111-112` e `:151`.
   - Esse caso usa o painel comum e exige as 7 escolas de `porEstado` (posições 1 a 7 do painel) na primeira página por uso. Ou seja, no máximo 17 escolas podem ficar acima do painel dele.
   - Antes desta correção, só ficavam acima os painéis semeados **depois** dele. Eram precisos 3 painéis tardios para derrubá-lo.
   - Agora, os dois W6 do Uso ficam acima **sempre que estão vivos**, semeados antes ou depois: são 16 escolas fixas. Basta mais **um** painel comum semeado depois (um 14.4, um RF23 ou o outro W6 de Escolas) para o porEstado mais baixo chegar ao índice 16 + 8 + 7 = 31 e cair na página 2.
   - O `playwright.config.ts:28` tem `fullyParallel: true`. Então o shard da esteira (2 trabalhadores) e a máquina (6 trabalhadores) misturam casos dos dois specs.
   - A prova do documento (`--repeat-each=3 --workers=6 e2e/operacao-uso.spec.ts`) não roda `operacao-escolas.spec.ts`. A frase "seguem com o painel comum" é afirmada, não verificada.
   - O efeito é o mesmo da correção, só mudado de lugar: um caso que passa ou cai conforme o sorteio dos trabalhadores.
   - **Correção exigida:** tirar a dependência dos dois W6, e não só de um. Saídas possíveis:
     - uma faixa de uso própria por spec, que um não invada o do outro;
     - ou o W6 e W10 de Escolas também no topo, com a conta do pior caso escrita: 4 painéis de topo mais o próprio, abaixo de 25;
     - ou outro desenho que não dependa de posição absoluta.
   - Depois, registrar no documento a conta do pior caso para os **dois** specs, e a corrida dos dois arquivos juntos com 6 trabalhadores.

2. **Sobra de execução interrompida fica no topo por mais de 100 dias, e o comentário do topo do fixture ficou falso.**
   - Onde: `e2e/__fixtures__/painel.ts:13-16` e `:114`.
   - O comentário diz que "o que sobrar de uma execução interrompida fica atrás do de agora". Com `usoNoTopo` isso deixa de valer frente a todo painel comum.
   - Quando o trabalhador é morto antes do `afterEach` (Ctrl-C, timeout do trabalhador), sobram até 16 escolas de topo por execução, num banco local que acumula (regra 40, "quem roda `npm run test` sozinho acumula"). Com isso, o W6 e W10 de Escolas:
     - fica a um painel concorrente de cair, depois de uma interrupção;
     - cai sempre, depois de duas, até o banco ser recriado.
   - **Correção exigida:**
     - tratar a sobra: a margem limpa as próprias sobras antes de semear, ou a faixa de topo é reconhecível e é ignorada ou apagada;
     - e corrigir o comentário do topo do fixture.

**Recomendações:**
- **Apagar a escola de `umaEscolaNoBanco()` no `afterEach`.** Ela é `sem_convite`, sem conta e sem convite, então o motivo dado para não apagar (a auditoria que o convite gera, `painel.ts:213-214`) não se aplica aqui. Cada execução deixa 6 escolas e 6 redes a mais no banco local, e cada uma empurra uma posição para baixo as escolas de quem procura a primeira página por nome (`operacao-convite-coordenacao.spec.ts`, o "criada pela tela" de outro trabalhador).
- **A prova do W6 vale menos do que o documento diz.** O documento diz que `--repeat-each=3 --workers=6` "põe até seis painéis semeando ao mesmo tempo" como prova. Com seis W6 de topo vivos, a escola do W6 semeado primeiro iria ao índice 40 e cairia. Os 42 verdes vieram do escalonamento, não da margem. A prova honesta é a conta do pior caso com os 2 W6 de uma execução normal.
- **Linha em branco dupla** em `e2e/operacao-uso.spec.ts:16-17`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/correcoes/2026-10-25-uso-da-operacao-sem-escola-no-e2e.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/operacao-uso.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/__fixtures__/painel.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/operacao-escolas.spec.ts

## test-engineer · 2ª rodada · APROVADO · 2026-10-25 20:06:09 · `tasks/correcoes/2026-10-25-uso-da-operacao-sem-escola-no-e2e.md`

VEREDITO: APROVADO

Cenários exigidos:
- Os três casos do Uso (referência, W7, "a escola criada pela tela") passam com o banco vazio, nos dois projetos.
- O W6 do Uso acha as suas 2 escolas na página 1 por uso, e nenhuma na página 2, com painéis semeando ao mesmo tempo (6 trabalhadores, `fullyParallel`).
- O W6 e W10 de Escolas acham as 7 do `porEstado` na página 1 por uso e nenhuma na página 2, com o W6 do Uso e o outro projeto rodando ao mesmo tempo.
- A sobra de uma execução interrompida não tira escola de ninguém da primeira página por tempo indefinido.
- A escola avulsa não fica no banco.

Cobertos:
- **Correção 1 (tirar a dependência dos dois W6):** feita. Há agora três faixas de uso (`UsoDoPainel`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/__fixtures__/painel.ts:48`). O `topo` dá uso só às 2 escolas que o W6 do Uso afirma. O `nenhum` vale para o RF23 e o 14.4 dos dois specs, que eram os que derrubavam o W6 de Escolas. Conferi a conta do pior caso contra o código:
  - W6 do Uso: na frente ficam só as 2 escolas `topo` do outro projeto, e as dele ficam nos índices 2 e 3. Uma escola `comum` só passa na frente se for semeada mais de 180 s depois, e o W6 morre em 90 s, com o `afterEach` dentro desse prazo e `retries: 0`.
  - W6 e W10 de Escolas: na frente ficam 4 escolas `topo` e as 8 do outro `comum`. A mais baixa do `porEstado` é a posição 7 do painel, então fica no índice 19 de 25, com folga de 5.
  - Ninguém mais grava `uso_infra_diario`: o grep em `e2e/` só acha o fixture. O `definirUsoDaEscolaSemeada` só troca jobs e bytes, e a asserção da linha 149 garante que a `sem_convite` é a 2ª, que tem linha de uso no `topo`.
  - A conta está escrita no tipo e no documento, junto com a corrida dos dois specs juntos com 6 trabalhadores (96 verdes).
- **Correção 2 (sobra e comentário do topo):** feita. A sobra do `topo` passa a ficar atrás das demais depois de `MARGEM_DO_TOPO_MS` (3 min), e não mais de 100 dias. O efeito nesses 3 minutos está contado: dois abandonos seguidos cabem na folga de 5, três não. O comentário do topo do fixture (`painel.ts:13-20`) agora diz o que o código faz.
- **Recomendações aplicadas:** o `afterEach` apaga a escola de `umaEscolaNoBanco()` (`removerEscolaSemConvite`). A linha em branco dupla saiu. A prova do W6 está escrita como conta do pior caso, com a corrida só como conferência.
- **Asserções:** o que cada caso afirma não mudou. Não há `.skip`, mock nem IA no caso.

Bloqueantes: nenhum.

Recomendações:
1. O comentário em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/operacao-uso.spec.ts:145-146` ficou falso. Ele ainda diz que o W6 do outro projeto "passa as oito dele na frente", mas no `topo` são 2. A correção é trocar "as oito" por "as duas".
2. A conta do pior caso vale para uma instância de cada caso por projeto. Com `--repeat-each=3` e 6 trabalhadores, até 6 painéis `comum` do W6 e W10 de Escolas podem estar vivos ao mesmo tempo. São até 40 escolas na frente, mais que as 25 da página, e a conta não cobre isso: os 96 verdes dessa corrida dependem do escalonamento. Vale registrar em `UsoDoPainel` e no documento que a conta não vale com repetição.
3. `removerEscolaSemConvite` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/__fixtures__/painel.ts:258`) aceita qualquer `EscolaDoConvite`, inclusive a `pendente`, que tem convite e conta. Hoje só a `sem_convite` chega lá. Um parâmetro de tipo mais estreito, ou a conferência do `rowCount` do `delete`, deixaria a regra no código e não só no nome.
