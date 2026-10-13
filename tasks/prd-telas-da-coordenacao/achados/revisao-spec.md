# Achados das revisões — `tasks/prd-telas-da-coordenacao/revisao-spec.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-13 02:20:49 · `tasks/prd-telas-da-coordenacao/revisao-spec.md`

VEREDITO: AJUSTES NECESSÁRIOS

Tela vista: não. A spec ainda não tem código nem fotos, então revisei pelo PRD, pela Tech Spec e pelas tarefas. Também conferi no código de hoje os pontos de que a fila depende (`apps/web/src/api/estrutura.ts`, `material.ts`, `professores.ts`, `privacidade.ts`).

Estados: ok. O RF22 e a Tech Spec seção 7c cobrem carregando, vazio, erro com "Tentar de novo" e com dado. O sino tem `parcial` e `erro`. O vazio só vale com a leitura terminada. A ressalva está no bloqueante 1.

Acessibilidade: garantida em quase tudo. A região rolável tem nome e `tabIndex={0}` (seção 9), o foco volta a quem abriu (tarefa 6.4) e as abas continuam links. O que falta aparece nas recomendações 4 e 5.

Chromebook fraco: parcial. Os tetos de bundle e o `lazy()` estão na seção 7c, e a 1366×768 sem rolar está no RF23. A seção 7c contabiliza "5 leituras", mas cada uma é `lerPaginas`, que percorre até 10 páginas (bloqueante 1 e recomendação 3). Não há virtualização nem teto de linhas nas tabelas.

Celular: garantido. O RF23 cobre 360 px sem rolagem lateral. A `Tabela` vira lista abaixo de 768 px (seção 9), nada depende de hover, e há a barra de baixo com o sino. Na ação principal, o alvo de 44 px está implícito nas peças da X1; ver recomendação 5.

Ação oficial protegida: sim. Suspender e retomar por função têm confirmação e motivo (11.4). Excluir material usa a confirmação de hoje, que diz o que acontece (`Material.tsx:468`). "Confirmo que recebi" usa botão oficial (13.4). Aprovar nota e publicar não existem nesta spec.

Bloqueantes:

1. **Fila do sino e do Painel diz "Tudo em dia" com leitura incompleta (Tech Spec seções 5, "A fila", e 7c "Quando cada dependência cai"; PRD RF4 e caso de borda "Fila que falha em parte").**
   - **O que está errado:** `parcial` só cobre consulta que falhou. As consultas de hoje usam `lerPaginas`, que devolve `{ completa: false }` ao bater em `MAXIMO_DE_PAGINAS_DA_ESTRUTURA` (`apps/web/src/api/estrutura.ts:44` e `:68`). As telas de hoje tratam isso com `AvisoDeListaIncompleta`. A fila não trata.
   - **Consequência:** com vínculos ou materiais incompletos, ela pode contar "turmas sem professor" errado, perder um material que falhou, ou afirmar "Tudo em dia" sem ter lido tudo. É o mesmo princípio que a spec declara ("nunca diz Tudo em dia sem ter lido").
   - **Correção exigida:** a seção 5 e a tarefa 1.4 devem dizer que `completa: false` em qualquer das cinco consultas vira `parcial`, com o aviso "Parte da lista não carregou". Também devem dizer que "turmas sem professor" não é calculada quando `consultaVinculos` está incompleta. Acrescentar o caso a `montarFila` (seção 10) e à 1.6.

2. **PRD seção 4 contradiz o sino, e o teste de RF7 não alcança a fila (PRD seção 4, linha Coordenador, "não pode"; RF4; RF7; Tech Spec seção 5).**
   - **O que está errado:** o PRD proíbe a coordenação de "ver indicador ou pendência por professor", mas o sino e a fila do Painel listam "professor contestou" e "convite vencido" com o nome dele. O RF7 só testa números do Painel, não os itens da fila. A regra 70, itens 8 e 9, e a D64 têm veto.
   - **Correção exigida:**
     - Reescrever a seção 4 para dizer o que de fato é vedado: indicador de uso ou desempenho do professor, e "provas a aprovar" ou "sem chamada" por professor. Dizer também que o estado de onboarding (convite, contestação do vínculo) é pendência da escola, já visível em Professores.
     - Acrescentar à seção 10 e à tarefa 1.6 um teste que feche a lista de tipos da fila nos cinco da tabela e prove que nenhum item nem contador deriva de uso, entrega ou atividade do professor.
     - Estender o RF7 aos itens e contadores da fila, no sino e no Painel.

Recomendações:

1. "Tudo em dia" com a escola recém-criada (PRD seção 7) não convida a nada. Acrescentar o link "Ver o que falta para a escola" no vazio do sino quando "Para terminar a escola" tiver passo pendente.
2. O sino não relê ao abrir (RF5) e o incidente tem `staleTime: Infinity` (seção 7c), então ele pode afirmar "Tudo em dia" por uma sessão inteira. Mostrar "atualizado às HH:MM" e um "Atualizar" explícito, que é ação da pessoa e não relê por tempo.
3. Material, Pedidos e a tabela de IA podem ter centenas de linhas (a regra 40 cita 300 apostilas). A seção 9 e a 7c não dizem como a lista que rola por dentro se comporta em CPU fraca. Declarar um teto de linhas, "Mostrar mais" ou virtualização, e acrescentar o caso ao e2e `chromebook` com throttling de CPU.
4. 5.2 e 12.2 pedem "linha inteira é o link" e, na Turmas, um `Menu` dentro da linha. Dizer que o link fica na célula do nome, esticado para a linha por CSS, e que o menu é irmão dele. Interativo dentro de interativo quebra teclado e leitor de tela.
5. Declarar o alvo de toque (24 px, 44 px na ação principal) na galeria e no e2e `celular` das telas novas, em vez de deixar para a X1.
6. A seção 7c diz "5 leituras a mais" por entrada na área. Cada uma pode ser até 10 requisições (`lerPaginas`, até 10 páginas); a premissa do limite por usuário (seção 12, última) deve contar requisições, não consultas. Verificar antes da 2.0, não depois.
7. Seção 6: `CHAVE_DO_MATERIAL` existe em `api/material.ts:20`, mas `consultaProfessores` e `consultaVinculos` usam `CHAVE_DA_ESTRUTURA`. Dizer na seção 6 que o teste de troca de escola cobre as cinco chaves reais da fila, pelo nome.
8. Excluir turma e excluir disciplina também são ação oficial. Dizer na 5.2 que a confirmação nomeia a turma, como a de Material, já que o menu da linha é uma interação nova.

Arquivos lidos:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/prd.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/techspec.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/tasks.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/api/estrutura.ts`

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-13 02:21:01 · `tasks/prd-telas-da-coordenacao/revisao-spec.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma. A seção 3 da Tech Spec não cria tabela, e as seções 2 e 4 limitam o trabalho a `apps/web` e `e2e/`, sem rota, sem permissão e sem campo novo em DTO. Os dados que a spec usa já existem em `packages/shared`: `esquemaVinculoDaCoordenacao`, `ESTADOS_DA_COORDENACAO` (os sete estados do RF21) e `esquemaConsultaResumoDaGovernanca`.

Queries verificadas: todas são rotas que já existem, com o escopo tirado do token.
- **Fila e Painel (seções 5 e 7c):** usam `consultaIncidentes`, `consultaVinculos`, `consultaProfessores`, `consultaMateriais` e `consultaTurmas` (`/v1/privacidade/incidentes`, `/v1/vinculos`, `/v1/professores`, `/v1/materiais`, `/v1/turmas`). Nenhuma recebe `escolaId`.
- **`GET /v1/governanca/resumo?estado=` (seção 4):** o esquema é `.strict()`, então `escolaId` na query é recusado. O controller repassa a consulta inteira por `lerEntrada`. Em `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/api/src/governanca/governanca.repository.ts`, `entregas()` filtra por `exigirEscolaDoContexto()` e usa `estado` só como filtro adicional (linhas 139-151). Os números (linhas 88-101) não dependem do filtro.
- **Troca de id na URL das telas novas (seção 5):**
  - `?professor=<usuarioId>` e `?material=<id>`: o painel procura o id na lista já lida da escola da sessão. Um id inexistente e um id de outra escola dão o mesmo resultado, "não acha linha", e o parâmetro é ignorado. Não há mensagem diferente entre os dois casos.
  - `/estrutura/turmas/:turmaId`: continua usando `GET /v1/turmas/:id` e `turmas/:id/lista`, rotas que já existem e já têm isolamento.
  - `?painel=`, `?situacao=`, `?estado=` e `?ia=`: aceitam só valores de lista fechada.
  - As ações dos painéis (refazer e revogar convite, excluir material) são as mesmas mutações por id de hoje. O "Tentar de novo" do material é reenvio no cliente, sem rota nova.
- **Cache no cliente (seção 6):** `main.tsx` chama `resetQueries()` em toda troca de sessão e de escola, e isso cobre qualquer chave, inclusive as dos observadores novos da fila.
- **Operador e coordenação:** o RF21 e o ponto 9 da seção 6 do PRD não dão ao operador nenhuma ação nova nem nome de pessoa. Não aparece nenhum `@SemEscopo()` novo.
- **Camada de rede (item 7):** não se aplica, a rede está fora de escopo (PRD, seção 3).
- **Ids:** os que vão no endereço são os UUIDs de hoje.

Teste de isolamento: presente e efetivo. A seção 6 e as tarefas 1, 2, 5, 6, 8, 9 e 13 mantêm os testes de segunda pessoa e de troca de escola sem perder asserção. Elas também acrescentam:
- a fila e o Painel da pessoa anterior não aparecem;
- o `?professor=` da escola A, aberto na sessão de B, não abre painel;
- o `?material=` de A, na sessão de B, não abre nada;
- o `?painel=ano` não mostra nada da escola anterior.

Removendo o escopo mentalmente: se o repository de professores ou de materiais não filtrasse pela escola, o id de A estaria na lista de B e o painel abriria, então o teste quebra. Se a fila guardasse estado fora do cache que `resetQueries` esvazia, o teste de segunda pessoa quebra.

Bloqueantes: nenhum.

Recomendações:
1. Tech Spec, seção 6: a lista de testes cita só o `?professor=`. Falta citar o `?material=` (tarefa 8), o `?painel=ano` (tarefa 5) e o endereço da lista da turma (tarefa 9), que as tarefas já cobrem.
2. Tech Spec, seção 5: dizer por escrito que os painéis abertos pelo endereço procuram o id na lista já carregada e nunca chamam `GET /v1/materiais/:id` nem outra leitura por id. No e2e, verificar que o id de outra escola deixa a tela igual à de um UUID aleatório.
3. Tech Spec, seção 12: a premissa marcada como não verificada, de que "o controller da governança repassa `estado` e os números não mudam com o filtro", está confirmada pelo código citado acima. A marca e a saída de contingência podem sair.

## privacy-guardian · 1ª rodada · REPROVADO · 2026-10-13 02:21:44 · `tasks/prd-telas-da-coordenacao/revisao-spec.md`

VEREDITO: REPROVADO

Campos pessoais tocados: nome de professor (na fila do sino, no painel do professor e na coluna "Professores da turma" da lista da turma); o complemento da contestação, que é texto livre do professor (no painel dele); nome e matrícula de aluno (só na lista da turma e nos pedidos, como hoje); o nome do titular no detalhe do pedido (como hoje). Nenhum campo novo, nenhuma rota, nenhum DTO novo (Tech Spec §3, §4, §7).

Fora da tabela de dados do docs/lgpd.md: nenhum. A spec não cria dado (PRD §8). Não há campo proibido de aluno, e a adaptação está fora do escopo.

Autorização por objeto: ok. A autorização continua no servidor, sem rota nova. Pelo endereço só passam id ou valor de lista fechada, e valor desconhecido é ignorado (§5). Troquei o id na URL de cabeça: o `?professor=`, o `?material=` e o `?painel=` da escola A, abertos na sessão de B, têm teste previsto nas tarefas 6.0, 8.0 e 5.0 (§6). O dado nominal continua uma mutação sem cache, com finalidade e uma auditoria por leitura, inclusive quando reabre ("abrir duas vezes grava duas", tarefa 4.0; §7b).

Logs: limpos. Não há log, telemetria, `localStorage` nem `sessionStorage` novos (§7).

Auditoria: presente para as leituras de hoje (lista de nomes, pedidos de nome, pedidos de titular, dado nominal, suspensão de função, recusa de licença). Ausente em: a garantia de que o sino não **dispara** uma leitura auditada que a coordenação não pediu (bloqueante abaixo).

Envio externo: nenhum. Nenhuma chamada nova de IA (§8).

Seed/fixture: sintético. `e2e/__fixtures__/coordenacao.ts` só ajuda a navegar, e as semeaduras são as de hoje.

Bloqueantes:

1. **Tech Spec §5 ("O sino", "A fila") e §7c ("Releitura"): o sino pode reler a lista de nomes e os pedidos de titular sem a coordenação pedir.**
   - **O que está errado.** O sino passa a ficar montado acima do `Switch`, então está presente em todas as telas, inclusive na lista da turma (`/estrutura/turmas/:turmaId`) e em Pedidos. As consultas que ele observa usam o mesmo prefixo das leituras auditadas:
     - a lista de nomes é `[...CHAVE_DA_ESTRUTURA, 'lista', turmaId]` (`/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/api/lista.ts:39`);
     - os pedidos de titular são `[...CHAVE_DA_PRIVACIDADE, 'pedidos']` (`/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/api/privacidade.ts:79`).

     O código de hoje já tem um "Tentar de novo" que invalida o prefixo inteiro (`/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/areas/coordenacao/Estrutura.tsx:209`). Se o "Tentar de novo" do estado `erro` ou `parcial` da fila copiar esse padrão, um clique no sino em cima da lista da turma relê `/lista` e grava `turma.lista_lida`. Em cima de Pedidos, relê a lista e grava `pedidos.listados`. Em nenhum dos dois casos a coordenação abriu ou pediu a leitura, o que quebra a regra do próprio PRD (§6, "Leitura auditada não sai sozinha") e a regra 20, item 10.
   - **Por que o teste previsto não pega.** A §5 e a §7c só dizem que a fila "relê quando uma tela invalida a chave". O teste da tarefa 1.0 ("o que a fila não lê") monta o sino sozinho. Os testes de leitura da 9.0 e da 12.0 montam a tela sem o sino.
   - **Correção exigida.**
     - Na Tech Spec, dizer em §5/§7c que o "Tentar de novo" da fila (e o de cada bloco do Painel) relê só as consultas que falharam, pela chave exata (`refetch` de cada observador, ou `invalidateQueries({ queryKey, exact: true })`), e nunca pelo prefixo `CHAVE_DA_ESTRUTURA` ou `CHAVE_DA_PRIVACIDADE`.
     - Na tarefa 1.0, um teste de componente com o sino montado sobre a lista da turma e sobre Pedidos: forçar a fila a `parcial`, clicar em "Tentar de novo" e exigir zero chamadas a `/lista`, `/reivindicacoes` e `/v1/privacidade/pedidos`. A mutação declarada troca a releitura exata pela do prefixo e precisa deixar o teste vermelho.

Recomendações:
- Na §7, a linha "Campos pessoais tocados" não lista o complemento da contestação nem os nomes de professor na coluna nova da lista da turma. Vale acrescentar os dois.
- Na §9, dizer que o título da aba do navegador nunca leva nome de pessoa: nem no painel do professor (`?professor=`), nem no detalhe do pedido. Hoje é assim (`/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx:69` usa "Pedido de titular"), mas ao refazer a moldura alguém pode trocar pelo `h1`, que mostra o nome do titular. O título da aba vai para o histórico do Chromebook compartilhado.
- O PRD §4 diz que a coordenação não pode ver "pendência por professor", e o sino lista "professor que contestou a turma" e o convite vencido com o nome dele. São pendências da escola, não indicador de uso (D64), mas vale ajustar o texto para não parecer contradição. A leitura de D64 é do `conformidade-reviewer`.
- Pergunta de fechamento: a X2 não toca o backend. O que o sistema guarda sobre um aluno e para onde foi enviado continua respondido pelo fluxo de pedido de titular do F3 (prévia, declaração, empresas que receberam). A spec não piora essa resposta.

## infra-guardian · 1ª rodada · REPROVADO · 2026-10-13 02:22:05 · `tasks/prd-telas-da-coordenacao/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: nenhum
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok

Bloqueantes:

1. **A regra de não reler sozinho está escrita, mas nenhum teste a prova.** Onde está: `techspec.md` §7c ("Releitura") e §10 (linha "Componente"). Na tarefa, a tabela "Testes que provam a regra" de `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/1_task.md` (linhas 42 a 49).
   - **O que diz o desenho.** O §7c manda que os observadores da fila usem `staleTime` de 5 minutos. Eles não podem ter `refetchInterval`, nem reler no foco ou na reconexão. O observador de materiais também não pode herdar o intervalo de 1,5 s da tela Material. O RF5 do PRD pede "teste de componente conta as chamadas".
   - **O que falta.** A tarefa 1.0 só testa que abrir a lista não faz chamada e que nada pisca. Nenhum caso prova que o tempo, o foco e a reconexão não disparam leitura.
   - **Por que é real.** `consultaMateriais` (`/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/api/material.ts:36-40`) já traz `refetchInterval` de 1,5 s enquanto há material `processando`. O caminho natural é `useQuery({ ...consultaMateriais, staleTime })`, e esse spread leva o intervalo junto. O sino fica montado em toda tela da coordenação. Como o lote só roda fora do horário letivo, um material pode ficar em `processando` por horas.
   - **A conta.** São 40 leituras por minuto por aba, cada uma com até 10 páginas (`lerPaginas`). Com duas abas abertas, ou com dois ou três materiais por página, passa de `LIMITE_REQ_USUARIO_MIN=120` (`.env.example:66`). A partir daí é 429 em todas as telas da coordenação, e o mesmo acontece com o refetch no foco multiplicado pelas cinco consultas da fila.
   - **Correção exigida.** Acrescentar à tabela da 1.0 um teste de componente com relógio falso e um material `processando`. O caso monta só o `SinoDaCoordenacao`, sem a tela Material, avança mais de 10 s e dispara `focus` e `online`. Ele precisa provar zero chamadas depois da primeira leitura e uma única leitura de incidentes por sessão. A 1.0 também precisa declarar a mutação: tirar o `refetchInterval: false` e o `refetchOnWindowFocus: false` dos observadores da fila tem que deixar o teste vermelho. Na Tech Spec, citar esse teste no §10.

Recomendações:
- **Fechar a premissa 4 do §12.** O limite padrão é de 120 requisições por minuto por usuário e 30000 por escola (`.env.example:66-67`, `packages/nucleo/src/limite/limitador.ts`). Entrar no Painel faz por volta de 12 a 20 requisições, contando as páginas. Basta escrever a conta e dizer que um limite por escola configurado abaixo do padrão aciona as duas levas.
- **Fechar a premissa 3 do §12.** Já está verificada: o controller repassa `estado` (`apps/api/src/governanca/governanca.controller.ts:39`). O filtro só afeta `entregas()`, e `numeros()` não muda com ele (`governanca.repository.ts:85-108` e `139-157`).
- **Pedir o `EXPLAIN` na tarefa 10.0** com `?estado=rejeitada` numa escola com volume, por causa da consulta da tabela da IA. O índice `entrega_ano_idx (escola_id, ano_letivo_id, id)` começa pelo escopo, mas o `estado` entra como filtro residual. Cada linha varrida avalia a subconsulta correlacionada `#serieComGrupoMinimo`, e um estado raro faz a varredura ir longe até achar `limite + 1` linhas.
- **Tratar lista truncada como leitura incompleta na fila.** `montarFila` deveria marcar `parcial` quando alguma lista volta com `completa: false` (teto de 10 páginas em `lerPaginas`). Hoje "turmas sem professor" é uma diferença entre conjuntos e daria falso positivo com os vínculos truncados. O "Tudo em dia" também apareceria sem a leitura completa, o que contraria o caso de borda "Fila que falha em parte" do PRD.
- **Registrar no `TODO.md`, fora da X2, o polling que já existe na tela Material.** Ela relê a cada 1,5 s enquanto a ingestão espera horas na fila de lote. Um recuo progressivo do intervalo evitaria leitura à toa.
- **Explicitar no §7c que nenhuma ação nova da X2 invalida chaves além das de hoje.** Com o sino sempre montado, cada `invalidateQueries(CHAVE_DA_ESTRUTURA)` passa a reler também as consultas ativas da fila. É barato, mas vale ficar escrito.

Arquivos citados:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/techspec.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/1_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/api/material.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/api/estrutura.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/api/src/governanca/governanca.repository.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/.env.example`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-13 02:22:41 · `tasks/prd-telas-da-coordenacao/revisao-spec.md`

VEREDITO: REPROVADO

Cenários exigidos:
- **Sino e fila (RF4, RF5):** a contagem de cada um dos cinco tipos, levando ao endereço certo; leitura parcial; vazio só com tudo lido; abrir a lista não faz leitura; nada relê por tempo, no foco nem na reconexão; escola sem ano letivo e escola na virada de ano; turma com um vínculo encerrado e outro aberto; professor com duas disciplinas na mesma turma; homônimos; caso de permissão; segunda pessoa e troca de escola.
- **Painel (RF6, RF7):** os quatro estados de cada bloco; nenhum número de professor, de turma nem de pedido de titular; escola vazia; caso de permissão; segunda pessoa e troca de escola.
- **Lugares e molduras (RF1 a RF3, RF10, RF17):** os quatro lugares nas três larguras; cada endereço de hoje abre a tela dele; a contagem de cliques; um só conjunto de abas.
- **Telas recompostas (RF8 a RF21):** os casos de hoje, sem perder asserção; os vazios; as bordas do domínio (duas disciplinas, contestação, sem licença, homônimos, planilha suja); clique duplo; o painel aberto pelo endereço com id de outra escola.
- **Operação (RF21):** sete estados em texto; nenhum dado de pessoa; sem sessão leva à entrada.

Cobertos:
- **RF1, RF2, RF3:** tarefa 3.0, unidade de `navegacao` e e2e `areas` com a contagem de cliques.
- **RF4:** `montarFila` tipo a tipo, com duas disciplinas, turma só com vínculo contestado e sem ano em curso; e2e do convite vencido, que some depois de refeito.
- **RF5, em parte:** abrir a lista não chama `/lista`, `/reivindicacoes` nem pedidos; a leitura única de incidentes.
- **RF6:** os quatro estados de cada bloco do Painel.
- **RF8:** sem `textbox`. O teste falha se a regra sair: o `DadoNominal` usa `Selecao`, então não há campo de texto legítimo que confunda o teste.
- **RF9:** "abrir duas vezes grava duas".
- **RF10 a RF16:** tarefas 5.0 a 9.0, com duas disciplinas, contestação, sem licença auditada, homônimos, planilha suja e clique duplo em alocar e em cadastrar.
- **RF17 a RF21:** tarefas 10.0 a 14.0. Os casos de duas coordenadoras no incidente e de clique duplo em suspender e em criar escola são os de hoje.
- **RF22, RF23:** os quatro estados e as larguras, por tarefa.
- **Isolamento pelo endereço:** `?professor=` e `?material=` de A na sessão de B.
- **Concorrência:** nenhuma corrida nova (seção 7c). As de hoje continuam nos e2e movidos.

Bloqueantes:
1. **RF5, "não relê por tempo": nenhum teste prova** (Tech Spec 7c "Releitura" e seção 10; `1_task.md`, "Testes que provam a regra").
   - A `consultaMateriais` já carrega o `refetchInterval` de 1,5 s dentro do `queryOptions` (`/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/api/material.ts:39`). A fila que fizer `...consultaMateriais` herda esse intervalo.
   - O padrão do cliente é `staleTime` de 30 s, com releitura no foco ligada (`api/cliente-de-consultas.ts`).
   - Exigido, um teste de componente com relógio falso:
     - (a) com um material `processando` e fora da tela Material, avançar mais de 1,5 s não faz nova chamada a `/v1/materiais`;
     - (b) passados mais de 5 minutos, `focusManager` e `onlineManager` não disparam chamada nenhuma;
     - (c) o Painel só relê ao abrir se a leitura passou de 5 minutos.
2. **Escola sem ano letivo e virada de ano: o sino diz "Tudo em dia"** (PRD 7, linhas 1 e 6; Tech Spec 5 "A fila").
   - Sem ano em curso, `/v1/turmas` responde como inexistente (`api/estrutura.ts:86`). Os vínculos também são do ano em curso.
   - A seção 5 não diz que turmas e vínculos só se leem com ano em curso. O único teste previsto é do `montarFila` puro, e o defeito provável está no hook: o 404 vira falha, a situação vira `parcial` e o sino nunca diz "Tudo em dia".
   - Exigido:
     - a seção 5 declara essa dependência;
     - um teste de componente do `SinoDaCoordenacao` e do bloco "Esperando você" do Painel, sem ano letivo e com o ano só `planejado` ou `encerrado`: nenhuma chamada a turmas e vínculos (ou 404 tratado como vazio), situação `pronta` e "Tudo em dia";
     - um e2e `--vazia` que olha o sino.
3. **Vínculo encerrado ao lado de vínculo aberto: sem cenário na fila nem no painel do professor** (Tech Spec 10; `1_task.md`; `7_task.md`).
   - A fila lê vínculos e turmas. A 5.0 cobre só "só com encerrado" em outro módulo, o `turmas-da-escola.ts`.
   - Exigido no `montarFila`:
     - turma com um vínculo encerrado e um confirmado não é "sem professor";
     - turma só com vínculo encerrado é "sem professor";
     - vínculo contestado e depois encerrado não gera item de contestação.
   - Exigido no `PainelDoProfessor`: professor com um vínculo encerrado e um aberto; "Acrescentar turma" aceita de novo a turma do vínculo encerrado.
4. **RF7: um número por professor pode passar** (Tech Spec 5 "A fila", campo `contador`; `2_task.md`, "nenhum número por professor").
   - A granularidade dos itens "professor contestou" e "convite vencido" não está fixada. Um item por professor com `contador` 2 é pendência numerada por professor, e isso viola o PRD 4 e a D45/D64.
   - O teste do Painel, como está descrito ("só os quatro números da escola"), passa com esse contador dentro do bloco da fila.
   - Exigido:
     - a Tech Spec fixa um item por vínculo ou convite, sem `contador` nos tipos de professor; contador só em "turmas sem professor";
     - unidade: um professor com duas contestações e outro com uma dão três itens, e nenhum tem contador;
     - componente do Painel com esse dado: nenhum número ao lado do nome de um professor.
5. **Sino: falta o caso de permissão** (Tech Spec 5 "O sino" e seção 10; `1_task.md`).
   - A âncora fica na `CascaDaEscola`, que professor e aluno também usam. A X3 vai montar ali o sino do professor.
   - Exigido: na área do professor e na do aluno, nenhum "Esperando você" da coordenação e nenhuma chamada a `/v1/vinculos`, `/v1/professores` nem `/v1/privacidade/incidentes` vinda do sino.
6. **Painel: falta a troca de escola** (Tech Spec 6 exige "segunda pessoa e troca de escola... ganham a fila, o Painel"; `2_task.md`, linha "recomeço", tem só a segunda pessoa).
   - Exigido: um e2e de troca de escola em que os números e a fila de A não aparecem em B, nem enquanto B carrega.
7. **Filtro da IA: o teste dos números pode não provar nada** (Tech Spec 12, premissa 3; `10_task.md`, linha "o filtro").
   - "Os quatro números não mudam com o filtro", contra uma rede falsa, só falha se a falsa responder números diferentes para `?estado=`.
   - Exigido:
     - a rede falsa devolve números diferentes na chamada filtrada, e a tela mantém os sem filtro;
     - um e2e com `montarEscolaComEntregas` prova a premissa no servidor de verdade (o `estado` filtra a lista e os números ficam). Sem esse e2e, o seletor sai, como a própria seção 12 manda.

Recomendações:
- A regra "sem professor" mora em dois lugares (`montarFila` e `turmas-da-escola.ts`). Melhor uma função só, com um teste de que a contagem do sino é igual à do filtro "Sem professor".
- RF1: no laço de cliques do RF3, conferir que o sino está visível em cada rota.
- RF17: conferir que Registros e Privacidade têm exatamente um `tablist`, para provar "nunca aba dentro de aba".
- O "único botão cheio" de Turmas (5.0) e de Pedidos (12.0) não tem teste. A 8.0 tem um que serve de molde.
- "Nada pisca" (1.0, e2e): dizer qual é a asserção, por exemplo `getAnimations()` vazio no `Contador` e no botão.
- Homônimos na fila: dois professores com o mesmo nome dão itens distintos, cada um levando ao seu `?professor=<id>`. O `id` do item também precisa ser único quando o mesmo professor contesta duas vezes.
- PRD 7, linha 5 (fila que falha em parte) também vale para o bloco "Esperando você" do Painel; ele não tem teste próprio.
- RF24: contar os casos de e2e antes e depois com um comando, e não de olho.
- Premissa 4 (dez leituras contra o limite por usuário): ler a configuração do limite na tarefa 2.0 e registrar o valor.
- A seção 10 da Tech Spec é genérica e o detalhe está nas tarefas. Os pontos 1 a 4 acima deveriam estar também na seção 10, para não se perderem se as tarefas forem refeitas.

Arquivos lidos:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/prd.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/techspec.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/tasks.md` e as tarefas `1_task.md` a `14_task.md`

## conformidade-reviewer · 1ª rodada · REPROVADO · 2026-10-13 02:23:44 · `tasks/prd-telas-da-coordenacao/revisao-spec.md`

VEREDITO: REPROVADO

Caminhos de escrita em Nota: nenhum. A X2 não cria rota, tabela nem mutação (PRD §3; Tech Spec §3 e §4). Todos com autor humano? sim, porque não há escrita nova.

Decisão autônoma sobre aluno: ausente. O Analista só mostra hipótese sobre conteúdo e não tem campo de pergunta (PRD §6, ponto 5; RF8; tarefa 4.5, testada com "nenhum `textbox`"). A resposta "O que fazer com o 2ºB?" do mockup ficou de fora.

Aprovação registrada: ok. Nenhuma função de IA muda (Tech Spec §7b e §8). A tabela "O que a IA gerou e quem aprovou" continua sem turma e sem quem decidiu, como já é hoje no contrato (`packages/shared/src/governanca/governanca.ts:22-25`). O nome de quem aprovou continua na auditoria do servidor, então a regra 70, item 6 não piora. O filtro `?estado=` usa um parâmetro que já existe (`governanca.ts:19`).

Supervisão do tutor: ok. Nada muda no Tutor, e a coordenação continua sem abrir trecho de conversa (PRD §6, ponto 6). Não há medida de comportamento nem inferência emocional; o mockup também não tinha (PRD §6, ponto 11).

Autonomia declarada e visível: sim. "Como cada IA trabalha" vira página (RF19; Tech Spec §7b, com a autonomia lida de `/v1/governanca/funcoes`). A suspensão por função tem confirmação, motivo de lista fechada e auditoria (PRD §6; tarefa 11.4 e 11.6, com o teste "suspender uma função não desliga as outras"). A função suspensa sobe ao Painel (RF6). O nível ("Faz e avisa") e o selo "Alto risco" não estão escritos em §9 nem na 11.3. Mesmo assim ficam garantidos: as asserções de `e2e/governanca.spec.ts:163-164` passam para `agentes.spec` sem mudar asserção (Tech Spec §10; RF24).

Itens com atenção pedida:
- **Indicador de professor (D45, D64):** garantido. RF7 tem teste com dois professores de pendências diferentes. Saíram LP/MAT por turma, "Sem chamada", "Provas a aprovar" por turma e "Aprovado por" (PRD §6, ponto 2). A tarefa 10.6 testa que não há coluna, filtro nem ordem por professor, e a 6.2 tira a ordem por uso.
- **Sino e D59:** garantido. RF5 e Tech Spec §7c: não pisca, não soa, não relê por tempo, não relê no foco, `Contador` parado, e abrir a lista não faz leitura (tarefa 1.6). É aviso dentro do produto, sem push e sem notificação fora do horário.
- **Analista, D55 e D57:** garantido, nas mesmas seções da decisão autônoma acima.

Bloqueantes:

1. **A onça dormindo no vazio do sino.** Está em PRD RF4 e §8b, Tech Spec §2 (`componentes/onca/`, pose dormindo) e §7b, e na tarefa 1.3 (`OncaDormindo`, "só o `Sino` a importa"). A D80(3) pede o meu parecer "na spec que os trouxer", e a spec adiou para a tarefa 1.0. **O parecer é favorável, com condições.** O público é adulto, a imagem é parada e `aria-hidden`, sem fala, e só aparece quando a fila foi lida inteira e está vazia (RF4, §7c). O desenho não se sustenta por três motivos:
   - **Contradiz a letra da D80(3)** ("sempre com o nome da função e o selo 'IA' à vista no mesmo bloco"). No sino não há função nenhuma, e pôr o selo "IA" ali rotularia como IA um conteúdo que não é de IA.
   - **Afrouxa um teste da X1 sem dizer como.** A X1 fecha a pasta inteira: `componentes/onca/` só é importado por `AvatarAgente` (`tasks/prd-pele-e-casca/techspec.md` §7b; `docs/interface.md` 9.7, "qualquer coisa da pasta da onça"). A Tech Spec da X2, §7b, já diz só "a cabeça da onça". Nenhuma linha da §10 nem da tabela de testes da tarefa 1.0 prova as condições da onça de corpo inteiro.
   - **O "z parado" da pose** (`tasks/prd-pele-e-casca/mockup.md:1358`) é um texto atribuído à onça.

   Correção exigida, uma das duas:
   - (a) Tirar a onça do vazio do sino e usar texto ou ícone ilustrado.
   - (b) Manter a onça com as condições escritas:
     - Na §7b e na §11, registrar a leitura: "sempre com nome e selo" vale para o avatar, e a mascote de corpo inteiro só entra no vazio "Tudo em dia", fora de qualquer região com item ou texto de IA, sem anel de agente e sem o "z".
     - Atualizar `docs/interface.md` 9.7.
     - Estender o teste de arquitetura da X1 sem afrouxar: `OncaDormindo` importado só por `componentes/sino/Sino.tsx`, e `CabecaOnca` continua só com `AvatarAgente`.
     - Pôr na tarefa 1.0 o teste de componente: `aria-hidden`, SVG sem `<title>`, dois renders iguais, nenhum temporizador, e onça só com a fila lida e vazia.

Recomendações:
- **Convite vencido no sino** (Tech Spec §5, "A fila"). Escrever o item como tarefa da coordenação ("Refazer o convite de …"). Declarar na spec que o item fala da conta, e não de adoção da ferramenta (D64). Garantir que revogar o convite tira o item, para quem recusou não ficar como alerta permanente.
- **"Tudo em dia"** pode ser lido como "nada pendente" enquanto há pedido de titular com prazo correndo. Ou o texto do vazio não afirma que está tudo resolvido, ou leva a porta "Pedidos dos titulares". O assunto é do `privacy-guardian`.
- **"Como cada IA trabalha"** (tarefa 11.2-11.3). Escrever na 11.3 e na Tech Spec §9, "Agentes", que o nível da autonomia e o selo "Alto risco" continuam. Marcar em texto, no seletor "Qual IA", a IA que tem função suspensa, porque a página abre no Assistente.
- **Professores** (tarefa 6.6): acrescentar a asserção de que não há coluna de último acesso nem de uso por professor.
- **RF4 e §4 do PRD:** "pendência por professor" (proibida) e o nome do professor que contestou ou tem convite vencido (permitido) parecem se contradizer. Explicar a diferença numa linha.

Arquivos da auditoria:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/prd.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/tasks.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/1_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/11_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/docs/interface.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/areas/coordenacao/Agentes.tsx
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/e2e/governanca.spec.ts

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-13 02:30:39 · `tasks/prd-telas-da-coordenacao/revisao-spec.md`

VEREDITO: APROVADO
Tela vista: não (revisão de spec, ainda não existe tela)
Estados: ok. O desenho cobre carregando, vazio, erro e com dado. A fila ganhou o estado `parcial`, e o RF22 exige "Tentar de novo" em toda tela. Tech Spec seção 5 ("A fila") e 7c; tarefa 1.0, subtarefa 1.3.
Acessibilidade: ok pelo desenho. O sino tem nome acessível com contagem, foco devolvido, não anima e não soa, e há teste de `textbox` no Analista. O alvo de toque é checado no e2e `celular` (Tech Spec seção 9).
Chromebook fraco: ok. Não entra biblioteca nova, o sino é carregado por `lazy()`, não há releitura por tempo, foco ou reconexão, as listas têm teto com "Mostrar mais" e a página não rola a 1366 px (RF23).
Celular: ok. A `Tabela` vira lista abaixo de 768 px, nada rola de lado a 360 px, o alvo é de 24/44 px, o e2e roda nos dois projetos e nenhum fluxo exige o celular.
Ação oficial protegida: sim. Suspender função mantém confirmação, motivo de lista fechada e auditoria (PRD seção 6). Nada oficial passa a acontecer em um clique.

**Conferência das correções da rodada 1**

1. Fila com "Tudo em dia" em leitura incompleta: atendida.
   - A Tech Spec seção 5 diz que `completa: false` em qualquer das cinco consultas vira `parcial`, com o aviso "Parte da lista não carregou".
   - A mesma seção diz que "turmas sem professor" não é calculada com vínculos incompletos.
   - A seção 7c diz que a fila "nunca diz Tudo em dia sem ter lido".
   - A seção 10 inclui `completa: false` em `montarFila`.
   - A tarefa 1.0 tem o caso "lista truncada" (unidade e componente) e a subtarefa 1.3.
   - A tarefa 2.0 repete o caso no Painel.
   - O PRD seção 7 tem a linha "Lista lida só até o limite de páginas".

2. PRD seção 4 contra o sino, e RF7 sem alcançar a fila: atendida.
   - A seção 4 agora veda "indicador de uso ou de desempenho por professor ("provas a aprovar", "sem chamada")".
   - A seção 4 declara convite vencido e contestação como pendência da escola, sem relação com adoção (D64).
   - O RF7 cobre "número nem item do Painel ou da fila", fecha os tipos nos cinco do RF4 e proíbe contador por professor.
   - A tarefa 1.0 tem o teste "um item por vínculo": tipos só os cinco, nenhum item com `contador`, `id` único.
   - A tarefa 2.0 tem o teste "nenhum número por professor", com dois professores de pendências diferentes.

Bloqueantes: nenhum.

Recomendações:
- Em `tasks.md:16`, a linha da subtarefa 1.4 não cita `completa: false` nem "sem professor não é calculada com vínculos incompletos". Isso só está na 1.3, na Tech Spec e nos testes da 1.0. Vale repetir na 1.4, que é onde a conta mora.
- O teste "tipos fechados" da tarefa 1.0 prova o conjunto de tipos e a ausência de `contador`. Vale acrescentar uma asserção explícita de que nenhuma entrada de `montarFila` vem de dado de uso, entrega ou atividade do professor. Hoje isso vem do fato de a fila só ler vínculos, convites, incidentes, materiais e turmas.
- A mascote no vazio do sino fica para decisão do Joaquim (Tech Spec seção 12). Nenhuma ação é necessária agora.

## privacy-guardian · 2ª rodada · REPROVADO · 2026-10-13 02:31:15 · `tasks/prd-telas-da-coordenacao/revisao-spec.md`

VEREDITO: REPROVADO

A correção da rodada 1 foi feita. O diff desta rodada, porém, criou outro botão no sino ("Atualizar") que reabre o mesmo furo e não tem teste.

**Conferência da correção da rodada 1 (o "Tentar de novo" do sino relia leitura auditada):** atendida.
- **Tech Spec §5, "A fila":** o "Tentar de novo" da fila e dos blocos do Painel relê só as consultas que falharam, pela chave exata (`refetch` do observador ou `invalidateQueries` com `exact: true`). Nunca pelo prefixo `CHAVE_DA_ESTRUTURA` nem `CHAVE_DA_PRIVACIDADE`, e a seção diz o porquê: esses prefixos também guardam leituras auditadas.
- **Tarefa 1.0, cenário "'Tentar de novo' não lê o que é auditado":** sino montado sobre a lista da turma e sobre Pedidos, fila `parcial`, clique, zero chamadas a `/lista`, `/reivindicacoes` e `/v1/privacidade/pedidos`. A mutação volta à releitura por prefixo e precisa deixar o teste vermelho. É o que foi exigido.
- **Tarefa 2.0:** o Painel relê só o que falhou, por chave exata.
- **PRD §6:** "Leitura auditada não sai sozinha" continua igual.

**Campos pessoais tocados:** nome de professor na fila; o complemento da contestação, só no painel do professor; nome e matrícula de aluno, só na lista da turma e nos pedidos, como hoje (Tech Spec §7). Nenhum campo novo.

**Fora da tabela de dados do docs/lgpd.md:** nenhum.

**Autorização por objeto:** ok.
- Nenhuma rota nova.
- Um painel aberto pelo endereço procura o id na lista já carregada, sem `GET` por id (§6).
- O `?professor=` da escola A, aberto na sessão de B, não mostra nada de A (§6, tarefa 2.0).
- O sino só existe na área da coordenação, e o teste da 1.0 prova que professor e aluno não fazem as chamadas dele.

**Logs:** limpos. A spec não cria log (§7).

**Auditoria:** a de hoje continua, sem leitura a mais (§7). Falta garantir isso para o botão "Atualizar" do sino (bloqueante abaixo).

**Envio externo:** nenhum.

**Seed/fixture:** sintético (`montarEscolaComEntregas`, e2e `--vazia`).

**Bloqueantes:**

1. **Tech Spec §7c ("Releitura", última frase) e tarefa 1.0 (subtarefas e cenários): o botão "Atualizar" do sino pode reler leituras auditadas sem a coordenação pedir.**
   - **O que está errado:** o diff desta rodada pôs no sino "Atualizado às HH:MM" e um botão "Atualizar", que relê a fila inteira. A regra da chave exata em §5 vale só para o "Tentar de novo". O "Atualizar" não tem regra nenhuma.
   - **Por que a frase de §7c não basta:** "Nenhuma ação nova invalida chaves além das de hoje" não proíbe nada aqui, porque `CHAVE_DA_ESTRUTURA` e `CHAVE_DA_PRIVACIDADE` já são chaves de hoje.
   - **O que acontece se for feito do jeito óbvio:** o jeito óbvio de fazer um "Atualizar tudo" é invalidar os prefixos, e é o que o código de hoje já faz (`apps/web/src/areas/coordenacao/Estrutura.tsx:209`). O sino fica montado acima do `Switch`. Sobre a lista da turma, um clique relê `[...CHAVE_DA_ESTRUTURA, 'lista', turmaId]` (`apps/web/src/api/lista.ts:39`) e grava `turma.lista_lida`. Sobre Pedidos, relê `[...CHAVE_DA_PRIVACIDADE, 'pedidos']` (`apps/web/src/api/privacidade.ts:80`) e grava `pedidos.listados`. É o furo da rodada 1 por outro botão. Viola a regra 20, item 10, e o PRD §6.
   - **Teste que falta:** a tarefa 1.0 não cita o "Atualizar" em nenhuma subtarefa nem cenário. O teste do "Tentar de novo" não cobre esse clique.
   - **Correção exigida:**
     - Em §7c (ou §5): o "Atualizar" relê só os cinco observadores da fila, cada um pela chave exata, nunca pelo prefixo.
     - Na tarefa 1.0: pôr o "Atualizar" e o "Atualizado às" na subtarefa 1.3 ou 1.4.
     - Estender o cenário "'Tentar de novo' não lê o que é auditado" ao clique em "Atualizar", sobre a lista da turma e sobre Pedidos, exigindo zero chamadas a `/lista`, `/reivindicacoes` e `/v1/privacidade/pedidos`.
     - Declarar a mutação: o "Atualizar" passa a invalidar por prefixo, e o teste fica vermelho.
   - **Alternativa:** tirar o "Atualizar" da §7c, porque era recomendação da rodada 1 e não exigência.

**Recomendações:**
- **Tarefa 1.0, cenário do "Tentar de novo":** cobrir também a fila em `erro`, além de `parcial`. É o mesmo botão, em outro estado.
- **Tarefa 2.0, cenário "fila que falha em parte":** declarar uma mutação para o "por chave exata" do Painel. Hoje o Painel não tem observador auditado ativo, então errar no prefixo ali não vaza. A mutação protege contra um bloco futuro que observe a lista.
- **Tarefa 9.4:** a coluna "Professores da turma" passa a observar `consultaVinculos` e `consultaProfessores` dentro da lista da turma. Vale um teste dizendo que abrir ou fechar essa coluna não relê `/lista`.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/techspec.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/prd.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/tasks.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/1_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/2_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/7_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/9_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/10_task.md`

## infra-guardian · 2ª rodada · REPROVADO · 2026-10-13 02:31:44 · `tasks/prd-telas-da-coordenacao/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: nenhum. A coordenação são uma a três pessoas por escola, e a spec não cria rota nem tabela.
Rate limit: ok. Não há rota nova, o 429 não é repetido sozinho (`deveTentarDeNovo` em `apps/web/src/api/cliente-de-consultas.ts`), e §7c conta requisições, não consultas.
Fila e prioridade: ok. Não se aplica, porque não há job novo.
Concorrência: protegida. As mutações e travas são as de hoje (§7c).
Índice e paginação: ok. Não há query nova. O EXPLAIN de `?estado=rejeitada` foi para a tarefa 10.0.
Degradação de IA: não se aplica.
Migration: não se aplica.
Métrica e alerta: ok. Não há caminho quente novo. O `size-limit` e o teste do build cobrem o bundle.

Bloqueantes:

1. **O teste do foco e da reconexão está desenhado de um jeito que não fica vermelho.** O problema está em `techspec.md` §7c ("Releitura") e §10 (linha "Componente"), e em `tasks/prd-telas-da-coordenacao/1_task.md`, cenário "o sino não relê".
   - A metade do relógio da correção que exigi está feita. Tirar `refetchInterval: false` faz o observador herdar os 1,5 s de `consultaMateriais` (`apps/web/src/api/material.ts:36-40`). Com um material `processando` e o relógio avançando mais de 10 s, o teste fica vermelho. O mesmo vale para incidentes com `staleTime: Infinity`.
   - A metade do foco não funciona. No TanStack Query, `refetchOnWindowFocus: true` e `refetchOnReconnect: true` só releem dado velho. O observador da fila tem `staleTime` de 5 minutos, então aos 10 s o dado ainda está fresco. Disparar `focus` e `online` não faz chamada, com ou sem a opção.
   - Resultado: a mutação declarada ("tirar `refetchOnWindowFocus: false` deixa o teste vermelho") sobrevive. O portão da tarefa vai travar, ou alguém ajusta o teste no improviso.
   - A falha está no texto da correção que eu mesmo exigi na rodada 1 ("avança mais de 10 s e dispara `focus` e `online`").
   - Correção exigida: o caso precisa ter dois tempos.
     - (a) Avançar 10 s ou mais com um material `processando` e provar zero chamadas. Isso prova o intervalo.
     - (b) Avançar além de 5 minutos, para o dado ficar velho, disparar `focus` e `online`, e provar zero chamadas em turmas, vínculos, professores e materiais.
     - A tarefa também precisa declarar três mutações em separado, cada uma com o seu tempo: `refetchInterval: false`, `refetchOnWindowFocus: false` e `refetchOnReconnect: false`, que hoje não está na lista.
     - Ajustar a frase do §10 para o mesmo desenho.

Recomendações:

- §5 e §7c, botão "Atualizar" do sino. Ele entrou nesta rodada e a spec não diz por qual chave relê. Deveria ser a mesma regra de "Tentar de novo": chave exata, nunca o prefixo `CHAVE_DA_ESTRUTURA` ou `CHAVE_DA_PRIVACIDADE`. Também convém estender a ele o caso "zero chamadas a `/lista`, `/reivindicacoes` e `/v1/privacidade/pedidos`" da 1.0. Se usar o prefixo, cada clique pode refazer até 10 páginas e uma leitura auditada da lista aberta por baixo.
- §7c, observadores do Painel (séries, disciplinas, resumo, consumo, funções). A spec só fixa "relê ao abrir se passou de 5 min". Eles herdam `staleTime: 30_000` e a releitura no foco do cliente padrão, então uma aba aberta faz até 5 leituras a cada volta do foco depois de 30 s. Não há laço, e o volume é baixo. Convém declarar `staleTime` de 5 minutos e nenhuma releitura no foco também nesses observadores, para ficar coerente com a fila.
- §12, premissa das requisições contra `LIMITE_REQ_USUARIO_MIN`. Continua `NÃO VERIFICADO`, e a saída ("duas levas") está declarada. Fechar a premissa na 2.0 com a conta real: cinco consultas da área mais cinco do Painel, cada `lerPaginas` com até 10 páginas.

Arquivos lidos: `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/techspec.md`, `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/1_task.md`, `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/2_task.md`, `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/api/material.ts`, `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/api/cliente-de-consultas.ts`.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-13 02:32:30 · `tasks/prd-telas-da-coordenacao/revisao-spec.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A spec só mexe em `apps/web` e `e2e/`, sem rota, tabela nem mutação nova (PRD §3, Tech Spec §3, §4 e §8). Todos com autor humano? Sim, porque o desenho não abre nenhum caminho novo.

Decisão autônoma sobre aluno: ausente. O Analista mostra só hipótese sobre conteúdo, nunca recomendação (PRD §6, ponto 5, e §8b).

Aprovação registrada: ok. Nenhum fluxo de aprovação muda. A tabela "O que a IA gerou e quem aprovou" continua com a decisão e com a frase de hoje que explica por que não mostra turma nem quem decidiu (Tech Spec §9, tarefa 10.3). A exceção da D47 não aparece em outro agente.

Supervisão do tutor: ok. A coordenação continua sem abrir trecho de conversa (PRD §6, ponto 6) e nada muda no modo sala ou casa.

Autonomia declarada e visível: sim. A Tech Spec §7b manda a autonomia vir de `/v1/governanca/funcoes` sem texto reescrito, e diz que "Agentes mantém autonomia e selo 'Alto risco'". O e2e que já existe confere isso (`e2e/governanca.spec.ts:163-164`, "Alto risco" e "Faz e avisa"), e ele muda de lugar sem perder asserção (RF24). Nível 4 não aparece.

**A correção exigida na 1ª rodada foi feita (opção (a)):**
- **PRD:** o RF4 diz "um ícone ilustrado e 'Tudo em dia'"; a §6 diz "A onça não entra no sino"; a §8b diz "O vazio do sino não leva mascote".
- **Tech Spec:** a §2 não lista mais `componentes/onca/` nem pose; a §7b diz "ícone ilustrado, sem mascote"; a §12 deixa a mascote de corpo inteiro como decisão do Joaquim, "Sem a ratificação, não entra".
- **`tasks.md`:** a 1.3 e o critério de pronto dizem "sem mascote".
- **`1_task.md`:** a 1.3 diz "sem mascote"; a tabela de testes prova "o vazio sem mascote"; a seção "Fora do escopo" põe a onça fora.
- **Busca no texto:** `OncaDormindo`, "dormindo" e o "z" só sobram na §12, de propósito, como registro do parecer condicional para o Joaquim. A 5.6 também diz "Sem onça" para o "O que falta". De qualquer forma, o teste de arquitetura da X1 fecha `componentes/onca/` em `AvatarAgente`, então nenhuma pose passa sem quebrar esse teste.

**O texto novo do PRD §4, conferido contra a regra 70, itens 8 e 9, e a D64:**
- A coordenação não pode "Ver indicador de uso ou de desempenho por professor ('provas a aprovar', 'sem chamada')".
- Convite vencido e contestação de vínculo aparecem como pendência da escola, um item por convite ou vínculo, que sai quando a coordenação resolve.
- O RF7 fecha os tipos da fila em cinco, sem contador por professor. A Tech Spec §5 só põe `contador` em "turmas sem professor".
- Os testes provam isso:
  - na 1.0, dois professores com contestações diferentes dão três itens, nenhum com `contador`, e outro teste fecha os tipos;
  - na 2.0, dois professores com pendências diferentes deixam o Painel só com os quatro números da escola;
  - na 6.2, a tabela fica sem ordem por uso;
  - na 10.6, nenhum nome, filtro ou ordem por professor.
- O item de convite vencido é escrito como ação da coordenação ("Refazer o convite de …") e some ao ser refeito, e não quando o professor aceita (e2e da 1.0). Não vira alerta de "professor que não usa".
- Não há ranking. O nominal do Analista pede finalidade e grava auditoria a cada leitura (RF9, 4.6), e a conversa do professor fica fora do alcance da coordenação.
- **Não vi brecha.**

Bloqueantes: nenhum.

Recomendações:
1. **`tasks/prd-telas-da-coordenacao/11_task.md`, linha 16 ("Contexto necessário"):** "'Alto risco' por função … **não entram**" contradiz a Tech Spec §7b e o e2e de hoje. Além disso, a 11.3 e a tabela de testes não citam o selo de autonomia (`NOME_DA_AUTONOMIA`).
   - Reescrever a linha: o que fica fora é o selo amarelo do mockup com "Pausar" só nas funções de alto risco. O "Alto risco: tem avaliação de impacto" e o selo de autonomia de hoje ficam.
   - Acrescentar os dois na 11.3 e na tabela de testes.
   - Ficou como recomendação porque a Tech Spec garante e o e2e protegido pelo RF24 prova. Se o selo sumir na implementação, a revisão da 11.0 reprova.
2. **`docs/interface.md:989` e `:1366`:** ainda dizem que a pose "Dormindo" nasce na "X2, com parecer". Trocar por "decisão do Joaquim (Tech Spec da X2, §12); não entra sem ratificação".
3. **`tasks/prd-telas-da-coordenacao/mockup.md:466`** (onça dormindo no sino) e **`:113`** (onça apontando no "O que falta"): anotar que nenhuma das duas entra (PRD §6; tarefa 5.6), para quem consulta o inventário não tomar como requisito.
4. **Tech Spec §7b:** trocar "nenhum outro arquivo importa a cabeça da onça" por "nada fora de `AvatarAgente` importa a pasta `componentes/onca/`", que é o que o teste da X1 fecha.
5. **Recomendações da 1ª rodada que seguem em aberto:**
   - revogar o convite também tira o item do sino, e isso deveria estar num caso de teste da 1.0;
   - o texto do item de convite fica neutro, sem "não aceitou".

Arquivos lidos:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/prd.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/techspec.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/tasks.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/1_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/2_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/7_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/10_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/11_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/mockup.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/docs/interface.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/e2e/governanca.spec.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/areas/coordenacao/Agentes.tsx`

## test-engineer · 2ª rodada · REPROVADO · 2026-10-13 02:32:35 · `tasks/prd-telas-da-coordenacao/revisao-spec.md`

VEREDITO: REPROVADO

**Como conferi.** Comparei o diff da rodada 2 em `prd.md`, `techspec.md`, `tasks.md`, `1_task.md`, `2_task.md`, `7_task.md` e `10_task.md` com as sete correções da rodada 1. Para julgar se os testes previstos ficariam vermelhos, li três arquivos do código de hoje:
- `apps/web/src/api/cliente-de-consultas.ts`: o cliente usa `staleTime` de 30 s e deixa o foco e a reconexão no padrão do TanStack, que só relê consulta vencida.
- `apps/web/src/api/material.ts:36-40`: a consulta de materiais traz o próprio intervalo de releitura.
- `packages/nucleo/src/db/schema/vinculo.ts:59-61`: o índice único parcial deixa de fora o vínculo `encerrado`.

**Correções da rodada 1, item por item**

| # | Exigido | Situação |
|---|---|---|
| 1 | RF5: não relê por tempo, foco nem reconexão | **(a) feita, (b) não, (c) feita.** O caso (b) avança 10 s, muito antes de os 5 min do `staleTime` vencerem (bloqueante 1) |
| 2 | Sem ano letivo e virada de ano | **Feita no sino, faltando no Painel.** A seção 5 declara a dependência; a 1.0 tem o componente e o e2e `--vazia`. O bloco "Esperando você" do Painel não tem teste (bloqueante 3) |
| 3 | Vínculo encerrado | **Feita.** As três bordas estão no `montarFila` (1.0), e o `PainelDoProfessor` está na 7.0. O índice parcial confirma que reacrescentar a turma do vínculo encerrado é possível no servidor |
| 4 | RF7, granularidade | **Feita.** A seção 5 fixa um item por vínculo ou convite, com `contador` só em turmas sem professor. A unidade 2+1=3 está na 1.0; "nenhum número ao lado do nome" está na 2.0; o RF7 do PRD fecha os tipos |
| 5 | Permissão do sino | **Feita.** A seção 5 diz que só a coordenação monta o sino, e a 1.0 tem o caso "só a coordenação" |
| 6 | Troca de escola no Painel | **Feita** (2.0, linha "recomeço"; seção 6) |
| 7 | Filtro da IA | **Feita.** A rede falsa devolve números diferentes, com mutação declarada, e há um e2e com `montarEscolaComEntregas` (10.0; seções 10 e 12) |

**Cenários exigidos:** os da rodada 1, sem mudança: o sino e a fila (RF4, RF5), com as bordas do ano letivo, do vínculo encerrado, de duas disciplinas e de homônimos, mais permissão, segunda pessoa e troca de escola; o Painel (RF6, RF7) nos quatro estados, com a escola vazia, a permissão e o recomeço; os lugares e molduras; as telas recompostas; e a operação.

**Cobertos:** tudo o que a rodada 1 já tinha como coberto, mais as correções 3 a 7 inteiras, a 1(a) e (c), e a 2 no sino. Também entraram a lista truncada (`completa: false`), o "Tentar de novo" por chave exata sobre a lista da turma e sobre Pedidos, e a contagem do sino igual à do filtro "Sem professor".

**Bloqueantes:**

1. **O teste "o sino não relê" não prova a regra do foco nem a da reconexão** (Tech Spec 7c, "Releitura"; `1_task.md`, linha "o sino não relê").
   - **O que está errado:** o caso avança "mais de 10 s" e só então dispara `focus` e `online`. Com `staleTime` de 5 min, a consulta ainda está válida aos 10 s. O TanStack só relê no foco ou na reconexão o que já venceu, então os dois eventos não fazem chamada nenhuma, com ou sem `refetchOnWindowFocus: false`.
   - **Consequência:** das duas mutações que a 1.0 declara, a de tirar `refetchOnWindowFocus: false` fica verde. É a correção 1(b), que pedia "passados mais de 5 minutos".
   - **Também falta:** o 7c diz "sem releitura na reconexão", mas manda desligar só `refetchInterval` e `refetchOnWindowFocus`. O `refetchOnReconnect: false` não aparece no texto, na 1.4 nem na mutação.
   - **Correção exigida:**
     - O caso avança mais de 5 min antes de disparar `focus` e `online`, e mantém a parte do material `processando`, que já fica vermelha com o intervalo de 1,5 s.
     - O 7c e a 1.4 nomeiam as três opções: `refetchInterval: false`, `refetchOnWindowFocus: false` e `refetchOnReconnect: false`.
     - A 1.0 declara as três mutações, cada uma vermelha sozinha.

2. **"Atualizar" no sino é uma releitura nova, sem tarefa e sem teste** (Tech Spec 7c, última frase: "O sino mostra 'Atualizado às HH:MM' e 'Atualizar'").
   - **O que está errado:** nenhuma subtarefa da 1.0 implementa esse botão, e nenhuma linha da tabela o testa. A regra da chave exata, na seção 5, cita só o "Tentar de novo".
   - **Consequência:** um "Atualizar" feito como `invalidateQueries(CHAVE_DA_ESTRUTURA)` ou `CHAVE_DA_PRIVACIDADE` relê a lista de nomes ou os pedidos e grava a auditoria sem a coordenação pedir. É o mesmo defeito que o `privacy-guardian` bloqueou na rodada 1, por outra porta.
   - **Correção exigida:** a seção 5 estende a releitura por chave exata ao "Atualizar". A 1.2 e a 1.6 ganham o caso: com o sino montado sobre a lista da turma e sobre Pedidos, clicar em "Atualizar" não chama `/lista`, `/reivindicacoes` nem `/v1/privacidade/pedidos`, e "Atualizado às" só muda depois do clique, sem temporizador. A mutação "releitura de prefixo" precisa ficar vermelha. A alternativa é tirar o "Atualizar" do 7c.

3. **O bloco "Esperando você" do Painel não tem o caso sem ano letivo** (correção 2; `2_task.md`, tabela de testes).
   - **O que está errado:** a correção 2 pedia esse teste no sino e no Painel. A 2.0 não o tem. O e2e "escola vazia" só confere "Comece pelo ano letivo".
   - **Consequência:** a demonstração começa por uma escola vazia (D71), e essa é a primeira tela que ela vê. Se o Painel tratar a situação da fila por conta própria, ele pode mostrar "Parte da lista não carregou" ali.
   - **Correção exigida:** um caso de componente na 2.0, sem ano e com o ano só `planejado` ou `encerrado`: nenhuma chamada a turmas e vínculos, e o bloco diz "Tudo em dia". O e2e `--vazia` do Painel confere o mesmo texto no bloco.

**Recomendações:**
- O RF4 do PRD diz "Tudo em dia, só com as cinco leituras completas", mas sem ano letivo a seção 5 manda dizer "Tudo em dia" com três leituras. Vale alinhar o texto do RF4, porque quem o seguir ao pé da letra quebra o teste do bloqueante 3.
- **Lista truncada.** A linha da 1.0 suprime "turmas sem professor" com `completa: false` em qualquer uma das cinco listas; a seção 5 só com os vínculos incompletos. Vale alinhar: suprimir quando turmas ou vínculos vierem incompletos, com um caso de unidade para cada uma, e provar que um material truncado ainda mostra as turmas.
- **"Ver o que falta para a escola" no vazio do sino** não tem linha de teste. A seção 5 o põe sempre, mas a recomendação do frontend era mostrá-lo só com passo pendente.
- **"Mostrar mais" em Material, Pedidos e IA** (Tech Spec 9) não aparece em nenhuma tarefa. Se entrar, que entre na 8.0, na 10.0 e na 12.0, com teste de que material com falha e pedido com prazo correndo ficam antes do corte.
- **"A aba do navegador nunca leva nome de pessoa"** (Tech Spec 7) não tem teste. Basta um `toHaveTitle` no `?professor=` e no detalhe do pedido.
- **"Turmas sem professor"** (seção 5): a palavra "de professor" saiu do texto. Hoje o servidor já filtra o papel (`apps/api/src/estrutura/vinculo.repository.ts:254`), mas a função compartilhada poderia dizê-lo, ou ter um caso com vínculo de aluno.
- **"Nem enquanto B carrega"** (2.0 e seção 6): dizer como o e2e segura a resposta de B (`page.route`). A frase da seção 6 depois dos dois-pontos também ficou confusa.
- O `7_task.md` prova o "Acrescentar turma de novo" só em componente. Um e2e mostraria a ida e a volta pelo servidor, que o índice parcial já permite.

Arquivos:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/prd.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/1_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/2_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/7_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/10_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/api/cliente-de-consultas.ts
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/api/material.ts
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/packages/nucleo/src/db/schema/vinculo.ts

## privacy-guardian · 3ª rodada · APROVADO · 2026-10-13 02:36:04 · `tasks/prd-telas-da-coordenacao/revisao-spec.md`

VEREDITO: APROVADO

**Conferência da correção da rodada 2:** atendida em todos os pontos.

1. **Regra na Tech Spec (§7c, "Releitura"):** atendida. O texto diz que o "Atualizar" do sino relê só os cinco observadores da fila, cada um pela chave exata, nunca pelo prefixo `CHAVE_DA_ESTRUTURA` nem `CHAVE_DA_PRIVACIDADE`, e explica que esses prefixos guardam a lista de nomes e os pedidos. A frase antiga, que não proibia nada, virou "Nenhuma ação nova invalida prefixo". "Atualizado às HH:MM" só muda depois do clique, sem temporizador. A §10 ("Componente") cita "o retry e o 'Atualizar' por chave exata".
2. **Lugar na tarefa 1.0:** atendido. A subtarefa 1.3 de `1_task.md` traz o "Atualizar" e o "Atualizado às HH:MM", que relê os cinco observadores pela chave exata. A linha 1.4 de `tasks.md` repete "'Atualizar' por chave exata".
3. **Cenário estendido:** atendido. Em `1_task.md` o cenário agora se chama "'Tentar de novo' e 'Atualizar' não leem o que é auditado". O sino fica montado sobre a lista da turma e sobre Pedidos, com a fila em `parcial` e depois em `erro`, e há clique em cada botão. O teste exige zero chamadas a `/lista`, `/reivindicacoes` e `/v1/privacidade/pedidos`, e que "Atualizado às" só mude depois do clique. A recomendação da rodada 2 sobre o estado `erro` também entrou.
4. **Mutação declarada:** atendida. Trocar a releitura do retry ou do "Atualizar" por invalidação de prefixo deixa o teste vermelho. Conferi no código que a mutação de fato fica vermelha:
   - A lista da turma (`apps/web/src/api/lista.ts:39`) e os pedidos de titular (`apps/web/src/api/privacidade.ts:80`, usados em `Pedidos.tsx:69`) são consultas ativas. Invalidar o prefixo relê as duas.
   - As reivindicações da coordenação ficam com `enabled: false` (`apps/web/src/api/pedidos.ts:57`), então invalidar não as relê. A asserção de zero chamadas continua valendo.

**Campos pessoais tocados:**
- Nome de professor na fila, e o complemento da contestação só no painel dele.
- Nome e matrícula de aluno só na lista da turma e nos pedidos, como hoje (Tech Spec §7).
- Nenhum campo novo, nenhuma rota, nenhum DTO novo (§3 e §4).

**Fora da tabela de dados do docs/lgpd.md:** nenhum. A spec não cria dado, não tem campo proibido de aluno e não guarda diagnóstico.

**Autorização por objeto:** ok.
- Não há rota nova, e o endereço só leva id ou valor de lista fechada (§5).
- Um painel aberto pelo endereço procura o id na lista já carregada, sem `GET` por id. O `?professor=` da escola A, aberto na sessão de B, não mostra nada (§6).
- Só a coordenação monta o sino, e há teste disso na 1.0.

**Logs:** limpos. A spec não cria log. Nada vai para `localStorage` ou `sessionStorage`, e o título da aba não leva nome de pessoa (§7).

**Auditoria:** presente. A de hoje continua sem leitura a mais (§7, PRD §6 "Leitura auditada não sai sozinha"). O "Tentar de novo" e o "Atualizar" do sino agora estão presos à chave exata, com teste e mutação.

**Envio externo:** nenhum (§8).

**Seed/fixture:** sintético (`montarEscolaComEntregas`, e2e `--vazia`).

**Pergunta de fechamento:** a X2 não toca o backend. A resposta sobre o que o sistema guarda de um aluno e para onde enviou continua sendo o fluxo de pedido de titular do F3, e a spec não piora isso.

**Bloqueantes:** nenhum.

**Recomendações:**
- A linha 1.6 de `tasks.md` diz "nem por tempo, foco ou retry" e não cita o "Atualizar". O teste está em `1_task.md`, mas vale repetir no resumo.
- O RF5 do PRD (`prd.md`, linha 46) poderia dizer que o sino relê só no "Atualizar", por clique e pela chave exata. Assim o PRD acompanha a Tech Spec §7c.
- A linha 9.4 de `tasks.md` ("os professores da turma e os pedidos de nome, lidos só no 'Atualizar'") lê como se os professores também esperassem o clique. A `9_task.md` está correta: os professores são lidos ao abrir e só os pedidos esperam o "Atualizar". Vale alinhar a frase.
- Recomendações da rodada 2 que continuam em aberto:
  - uma mutação para o "por chave exata" do Painel na 2.0, porque o cenário cita a regra mas não declara mutação;
  - um teste na 9.0 de que abrir ou fechar a coluna "Professores da turma" não relê `/lista`.

**Arquivos auditados:**
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/techspec.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/prd.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/tasks.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/1_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/2_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/9_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/achados/revisao-spec.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/api/lista.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/api/privacidade.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/api/pedidos.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx`

## infra-guardian · 3ª rodada · REPROVADO · 2026-10-13 02:36:10 · `tasks/prd-telas-da-coordenacao/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: nenhum. A área da coordenação atende de uma a três pessoas por escola, sem rota nova, tabela nova ou job novo.
Rate limit: ok (não se aplica; o desenho cita `LIMITE_REQ_USUARIO_MIN`)
Fila e prioridade: ok (não se aplica)
Concorrência: protegida (nenhuma corrida nova; as travas são as de hoje)
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (`size-limit` e teste do build; carga inalterada)

Correção exigida na rodada 2, item por item:
- (a) O tempo de 10 s com material `processando` e a mutação `refetchInterval: false` estão atendidos: `techspec.md` §7c "Releitura" e §10 "Componente", `1_task.md` 1.4 e a linha "o sino não relê".
- As três mutações agora vêm em separado (`refetchInterval`, `refetchOnWindowFocus`, `refetchOnReconnect`), cada uma com o seu tempo. `tasks.md` 1.4 e 1.6 foram alinhados.
- (b) A estrutura em dois tempos está feita, mas o gatilho escrito não dispara nada. O texto pede "disparar `focus` e `online`", que foi a redação da minha própria correção na rodada 2. Ela estava imprecisa, e conferi isso agora no código instalado.

Bloqueantes:
1. `techspec.md` §7c "Releitura" e §10 "Componente"; `1_task.md`, linha "o sino não relê", tempo (b). As duas mutações do foco e da reconexão sobrevivem com o teste como está escrito.
   - **O que está errado:** a versão instalada é `@tanstack/query-core` 5.102.8.
     - O `focusManager` só escuta `visibilitychange` (`node_modules/@tanstack/query-core/src/focusManager.ts:23`). Um evento `focus` na `window` não chega à consulta.
     - O `onlineManager` só avisa quando o estado muda (`onlineManager.ts:55-57`). A aba já começa online, então um `online` sozinho não muda nada.
     - Resultado: tirar `refetchOnWindowFocus: false` ou `refetchOnReconnect: false` mantém o teste verde, que é o mesmo defeito da rodada 2 por outra porta.
   - **Correção exigida:**
     - No tempo (b), o gatilho passa a ser `focusManager.setFocused(false)` seguido de `setFocused(true)` (ou um `visibilitychange`). A reconexão passa a ser `onlineManager.setOnline(false)` seguido de `setOnline(true)` (ou `offline` e depois `online`).
     - O teste restaura os dois gerenciadores no `afterEach`.
     - O padrão já existe em `apps/web/src/api/privacidade.test.ts:40-41` e `:58-61`, inclusive o "controle" que prova que a mesma consulta relê com a opção ligada (`:69-84`).
     - Ajustar a frase do §7c, a do §10 e a linha da `1_task.md`.

Recomendações:
- No tempo (b), contar também a consulta de anos letivos, ou exigir "zero chamadas" em geral. Hoje a lista cita só turmas, vínculos, professores e materiais, e o observador de anos usa as mesmas opções.
- `2_task.md`, linha "quando relê" ("nenhuma releitura no foco"): usar o mesmo gatilho do `focusManager`, senão o caso do Painel cai na mesma armadilha.
- Continuam da rodada 2:
  - fechar a premissa 4 do §12 (requisições contra `LIMITE_REQ_USUARIO_MIN`) na 2.0, com a conta real;
  - o caso de "Atualizar" por chave exata já entrou, e a recomendação sobre ele fica atendida.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/prd.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/tasks.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/1_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/2_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/achados/revisao-spec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/api/material.ts
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/api/privacidade.test.ts
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/node_modules/@tanstack/query-core/src/focusManager.ts
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/node_modules/@tanstack/query-core/src/onlineManager.ts

## test-engineer · 3ª rodada · APROVADO · 2026-10-13 02:36:14 · `tasks/prd-telas-da-coordenacao/revisao-spec.md`

**VEREDITO: APROVADO**

As três correções da 2ª rodada estão nos documentos. Sobra um ponto, como recomendação: o teste do foco e da reconexão, escrito ao pé da letra, não chega a disparar a releitura.

**Como conferi**
- Li `prd.md`, `techspec.md`, `tasks.md`, `1_task.md` e `2_task.md`, procurando cada correção pelo termo que ela pedia.
- Conferi o comportamento do TanStack Query instalado (`@tanstack/query-core` 5.102.8, em `node_modules/@tanstack/query-core/build/modern/focusManager.js` e `onlineManager.js`).
- Vi como os testes que já existem simulam o foco e a rede (`apps/web/src/api/privacidade.test.ts:58-61`).
- Não alterei nenhum arquivo.

**Correção 1, o sino não relê: atendida**
- A seção 7c da Tech Spec ("Releitura") e a subtarefa 1.4 (em `1_task.md` e em `tasks.md`) nomeiam as três opções: `refetchInterval: false`, `refetchOnWindowFocus: false` e `refetchOnReconnect: false`.
- O caso "o sino não relê" (`1_task.md:49`) agora tem dois tempos:
  - **(a)** com um material `processando`, avança 10 s ou mais e espera zero chamadas. Mutação: tirar `refetchInterval: false`.
  - **(b)** avança além de 5 min, com o dado já vencido, dispara `focus` e `online` e espera zero chamadas em turmas, vínculos, professores e materiais. Declara duas mutações, cada uma vermelha sozinha: tirar `refetchOnWindowFocus: false` e tirar `refetchOnReconnect: false`.

**Correção 2, "Atualizar" no sino: atendida**
- A regra da chave exata para o "Atualizar" ficou na 7c ("Releitura"), não na seção 5, onde está a do "Tentar de novo". A regra é a mesma, só muda o lugar: relê os cinco observadores da fila pela chave exata, nunca pelo prefixo `CHAVE_DA_ESTRUTURA` nem `CHAVE_DA_PRIVACIDADE`. "Atualizado às" só muda depois do clique, sem temporizador, e nenhuma ação nova invalida prefixo.
- A subtarefa 1.3 implementa o botão. O caso de `1_task.md:50` monta o sino sobre a lista da turma e sobre Pedidos, com a fila `parcial` e depois em `erro`, e clica em cada botão.
- O caso espera zero chamadas a `/lista`, `/reivindicacoes` e `/v1/privacidade/pedidos`, e "Atualizado às" mudando só depois do clique.
- Declara a mutação de trocar a releitura (do retry ou do "Atualizar") por invalidação de prefixo. Ela fica vermelha porque as duas telas montadas deixam essas leituras ativas.

**Correção 3, Painel sem ano letivo: atendida**
- `2_task.md:46` traz o caso de componente: sem ano, e com o ano só `planejado` ou `encerrado`, nenhuma chamada a turmas e vínculos, e o bloco "Esperando você" diz "Tudo em dia".
- O e2e `--vazia` do Painel confere o mesmo texto no bloco. A seção 10 da Tech Spec registra o caso na 2.0.

**Cenários exigidos (1.0 e 2.0)**
- **Caminho feliz:** a conta tipo a tipo; do sino à tela, com o convite vencido.
- **Bordas:**
  - duas disciplinas na mesma turma;
  - turma só com vínculo contestado;
  - vínculo encerrado;
  - lista truncada (`completa: false`);
  - falha parcial;
  - sem ano letivo, ou com o ano só `planejado` ou `encerrado`;
  - homônimos e a mesma contestação duas vezes.
- **Permissão:** só a coordenação monta o sino.
- **Isolamento:** segunda pessoa e troca de escola (seção 6 e o e2e de recomeço).
- **Carga:** sem releitura por tempo, foco ou reconexão; retry e "Atualizar" pela chave exata, sem tocar nas leituras auditadas.

**Cobertos:** todos os acima, com o teste e a mutação declarados na tabela de cada tarefa.

**Bloqueantes:** nenhum.

**Recomendações**
1. **Diga na 7c e em `1_task.md:49` como o caso (b) dispara o foco e a reconexão.** Na versão instalada do TanStack (5.102.8):
   - o foco escuta só `visibilitychange` (`focusManager.js:12`), então um evento `focus` na janela não faz nada;
   - a rede só avisa quando o estado muda (`onlineManager.js:36-37`), e o jsdom já começa online, então um `online` sem `offline` antes também não faz nada.

   Escrito "disparar `focus` e `online`", as duas mutações ficariam verdes. O portão da tarefa barraria isso na implementação, e por isso não bloqueia agora. Use o padrão que já existe em `apps/web/src/api/privacidade.test.ts:58-61`: `focusManager.setFocused(false)` e depois `true`, `onlineManager.setOnline(false)` e depois `true`. O mesmo vale para "nenhuma releitura no foco" do Painel (`2_task.md:45`).
2. **Copie para a seção 5 uma frase sobre o "Atualizar"**, que hoje está só na 7c. A regra da chave exata ficaria num lugar só.
3. **Continuam abertas as recomendações da rodada 2:**
   - alinhar o RF4 com a seção 5;
   - alinhar a frase "turmas ou vínculos incompletos";
   - "Ver o que falta" e "Mostrar mais" sem teste;
   - `toHaveTitle`;
   - o papel "de professor" em "sem professor";
   - como o e2e segura a resposta de B;
   - e2e do "Acrescentar turma de novo".

**Arquivos**
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/1_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/2_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/tasks.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-da-coordenacao/prd.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/api/privacidade.test.ts

## infra-guardian · 4ª rodada · APROVADO · 2026-10-13 02:37:50 · `tasks/prd-telas-da-coordenacao/revisao-spec.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A spec cobre só leitura da coordenação. O ponto de carga é a releitura da fila do sino por aba aberta, e ele está tratado.
Rate limit: ok. A spec não cria rota nova de escrita nem de login. Nesta rodada só mudou a releitura.
Fila e prioridade: ok. Não se aplica: a spec não cria job.
Concorrência: protegida. Nesta rodada não entrou operação de escrita nova.
Índice e paginação: ok. Não mudou desde a rodada anterior.
Degradação de IA: não se aplica.
Migration: não se aplica.
Métrica e alerta: ok. Não mudou desde a rodada anterior.
Bloqueantes: nenhum. A correção 1 da 3ª rodada está atendida nos quatro pontos:
- **`techspec.md` §7c "Releitura"**:
  - O tempo (b) usa `focusManager.setFocused(false)` e depois `setFocused(true)` para o foco, e `onlineManager.setOnline(false)` e depois `setOnline(true)` para a rede.
  - Diz por escrito que um `focus` na janela ou um `online` solto não servem.
  - Exige restaurar os dois gerenciadores no `afterEach`, com o controle de `apps/web/src/api/privacidade.test.ts`.
- **`techspec.md` §10, linha "Componente"**: tem os dois tempos, os dois gerenciadores, zero chamadas e o controle que relê com a opção ligada.
- **`tasks/prd-telas-da-coordenacao/1_task.md:49`**:
  - Tem o gatilho certo, o `afterEach` e o caso de controle.
  - Cada mutação fica vermelha sozinha: tirar `refetchOnWindowFocus: false` falha na volta do foco, e tirar `refetchOnReconnect: false` falha na volta da rede.
  - Pede zero chamadas de qualquer consulta, anos letivos inclusive. Isso atende a recomendação da 3ª rodada.
- **`tasks/prd-telas-da-coordenacao/2_task.md:45`**: a linha "quando relê" usa o mesmo gatilho do `focusManager`. Atende a outra recomendação.
- **Conferido na versão instalada**:
  - `focusManager.setFocused` só avisa quando o estado muda (`node_modules/@tanstack/query-core/src/focusManager.ts`, a partir da linha 59), e o `setOnline` também (`onlineManager.ts:54-57`). Com a sequência exigida, a mutação deixa o teste vermelho.
  - O padrão citado existe em `apps/web/src/api/privacidade.test.ts:38-41` e `:58-61`.

Recomendações:
- `tasks/prd-telas-da-coordenacao/2_task.md:45`: incluir também a volta da rede (`onlineManager.setOnline(false)` e depois `setOnline(true)`) e a mutação de `refetchOnReconnect: false`. Hoje o Painel só prova o foco, e a §7c manda as mesmas opções para os blocos do Painel.
