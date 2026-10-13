# Achados das revisões — `tasks/prd-telas-do-professor/revisao-spec.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-13 02:40:06 · `tasks/prd-telas-do-professor/revisao-spec.md`

VEREDITO: APROVADO

Tela vista: não. É revisão de spec e ainda não há tela nem fotos. As telas serão vistas na validação, ao lado do mockup (PRD, métrica 3).

Estados: ok. Tech Spec §10 exige, por tela, carregando, vazio, erro e com dado em teste de componente, com o foco depois de cada ação. §7c mostra `EstadoErro` com "Tentar de novo". O sino tem estados próprios: "Tudo em dia", leitura parcial, "100 ou mais" (PRD RF4, §7).

Acessibilidade: ok.
- Axe no e2e de cada tela, nos dois projetos (§10).
- Foco depois de cada ação (§10).
- Nome acessível do sino (tarefa 1.0).
- Texto da pessoa preservado em sessão vencida (§9).
- Contraste vem dos tokens da X1.

Chromebook fraco: ok, com ressalva (recomendações 1 e 2).
- Sem biblioteca nova.
- O sino fica fora da entrada, por `lazy()`, com teto do `size-limit` e pedaços `tela-professor-*` (§7c).
- As leituras por turma saem em série e param na primeira recusa por limite.
- Nenhuma leitura é por tempo (RF5).

Celular: ok.
- RF22 exige 360 px.
- §9 e as tarefas 1, 3, 7 e 9 fixam alvos de 44 px, filtros em diálogo, painel em folha de baixo e barra presa acima da barra da casca.
- Nada depende de hover. O convite não exige celular.
- Os e2e rodam nos dois projetos.

Ação oficial protegida: sim.
- A API segue recusando o lote com destaque fechado (§7b).
- `podeAprovar` libera o botão e o oficial fica na barra presa, nas três abas.
- A versão adaptada continua decidida por `decidir`, na tela do Assistente. O sino só leva até ela e nada se decide nele.
- "Aplicar à turma" continua um ato registrado à parte.

Resposta por item da lista:

| Item | Resposta |
|---|---|
| 1 Quatro estados | Garantido (§10, §7c) |
| 2 Feed nunca vazio | Garantido. O Início sempre tem caixa e atalhos. O vazio do sino é "Tudo em dia", não feed. "Falta uma turma confirmada" só vale sem turma (PRD §7) |
| 3 Seletor de escola | Não se altera: a casca da A1 é mantida. §6 e PRD §7 fazem sino e Criados seguirem a escola ativa |
| 4 Ação oficial | Garantido por manutenção (RF20, §7b) |
| 5 e 5a Máquina fraca e celular | Ver acima |
| 6 Acessibilidade | Garantido |
| 7 Português | Garantido. O teste de vocabulário é estendido aos textos novos (§7b) |
| 8 Erro diz o que fazer | Garantido (§7c, `EstadoErro`) |

Isolamento (regra 10): a chave `pedidos-da-turma` e as outras são esvaziadas por `resetQueries` em `apps/web/src/main.tsx:26`, em toda troca de sessão e de escola. A Tech Spec §6 acrescenta os testes do sino na troca de escola e na segunda pessoa. Dado pessoal: o sino descarta a lista antes do cache, e as leituras nominais ficam com `gcTime: 0` (§7).

Bloqueantes: nenhum.

Recomendações (não bloqueiam):
1. Tech Spec §5/§9: o texto de Criados diz "Ver mais" só nas tarefas (`tasks.md` 5.2). Escreva na Tech Spec que a lista é limitada ou paginada, sem virtualização nova, para atender regra 50 item 1 e regra 80 item 8. Pergunte também se `GET /v1/artefatos` já limita o retorno; não vi `limite` no controller (`apps/api/src/artefato/artefato.controller.ts:27`).
2. §10: acrescente um caso com throttling de rede e de CPU (projeto `chromebook`) para o sino e para Criados. Hoje só o teto de bundle cobre a regra 50 item 1.
3. §6/§7: diga que a chave do sino (contagem) é distinta da chave da lista nominal de pedidos. Com o mesmo `queryKey` e formatos de dado diferentes, a aba Alunos poderia ler o cache só com a contagem.
4. §9: escreva nela os alvos de toque (24 px, 44 px na ação principal) e "sem hover". Hoje isso só está nas tarefas.
5. §12: o limite por usuário das leituras do sino fica não verificado. Reduza o risco: 12 leituras ao abrir a casca, mais 1 na volta do foco, saem para toda aba. Considere agregar a contagem em uma só leitura quando a API permitir.

Arquivos: `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-do-professor/prd.md`, `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-telas-do-professor/techspec.md`.

## frontend-reviewer · 2ª rodada · AJUSTES NECESSÁRIOS · 2026-10-13 08:30:52 · `tasks/prd-telas-do-professor/revisao-spec.md`

VEREDITO: AJUSTES NECESSÁRIOS

Tela vista: não. A funcionalidade é uma spec sem código e não há foto a ler; a tela será vista na validação, tarefa a tarefa (a spec já prevê foto no claro e no escuro, no computador e no celular, ao lado do mockup).

Estados: ok. Cada tela tem carregando, vazio, erro e com dado (Tech Spec §9 e §10; tarefas 3.0, 5.0, 10.0, 12.0 e 14.0). O sino tem os quatro estados mais o parcial: o "Tudo em dia" só vale com tudo lido (RF4).

Acessibilidade: ok. Há `<main>`, `h1`, regiões nomeadas e foco devolvido ao fechar sino, painel e diálogo. Axe e largura rodam em todo e2e. O oficial é grafite, único na tela.

Chromebook fraco: ok. Não entra biblioteca nova, o sino vem por `lazy()` fora da entrada, e há teto por pedaço `tela-professor-*` (§7c). A lista é paginada ("Ver mais"). Falta só a decisão escrita de virtualizar ou paginar (recomendação 1).

Celular: ok. Filtros viram "Filtrar" com diálogo, o painel vira folha de baixo, a barra presa de Aprovar fica acima da barra da casca, e há e2e a 360 px com a lista em linhas de 56 px. Não há hover nem atalho de teclado como único caminho, e o sino tem botão de 44 px.

Ação oficial protegida: sim. Seguem inalterados:
- O aprovar fica desligado até `podeAprovar` e visível nas três abas (§7b, 14.2).
- A confirmação mostra atividade, turma, quantos e o efeito.
- Aplicar e a decisão da versão adaptada continuam registrados.
- Não entra nota, média nem ranking.
- A onça aparece só como cabeça, em `AssinaturaIA`, com função e selo no mesmo bloco (3.0).

Bloqueantes:

1. **Tech Spec §5, "A fila do professor", e §7c (carga e falha).** A spec manda o sino ler "quando a aba volta a ter foco". Isso é releitura sozinha, e contradiz o que a X2 fixou: o sino não relê sozinho (D59), e `refetchOnWindowFocus` e `refetchOnReconnect` ficam em `false` (Tech Spec da X2, §5 e §7c).
   - A conta de §7c, "2 leituras mais 1 por turma, até 12", passa a valer por volta de foco, de cada aba de cada professor. É exatamente o multiplicador que a regra 80 e a X2 recusaram.
   - O RF5 ("não relê por tempo") e o teste da tarefa 1.0 ("5 minutos de relógio falso sem chamada") não cobrem foco nem reconexão. Pelo texto atual a regra é violada de propósito e nenhum teste a protege.
   - O TanStack só reage a `visibilitychange`, então um evento `focus` solto não prova nada.
   - Correção exigida:
     - Escrever na §5 que o sino lê ao entrar na área e quando uma decisão invalida a chave. Fixar `staleTime` e `refetchInterval: false`, e desligar o foco e a reconexão.
     - Se a professora precisar de releitura, usar "Atualizar" a pedido, só pelas chaves exatas do sino (`entregas`, `meus-vinculos`, `pedidos-da-turma/<turmaId>/contagem`), nunca por prefixo.
     - Na 1.5 e no `1_task.md`, acrescentar o teste em dois tempos da X2: `focusManager.setFocused(false/true)` e `onlineManager.setOnline(false/true)` com dado velho, zero chamadas, e o controle com a opção ligada relendo.

Recomendações:

1. **§5/§9 e 5.2/12.1:** dizer na Tech Spec que Criados e Alunos são paginados com "Ver mais" e por que isso basta no Chromebook fraco. Isso já foi pedido pelo frontend-reviewer na rodada 1.
2. **Tarefa 1.3:** a chave da contagem tem de ser distinta da de `consultaPedidosDaTurma(turmaId, 'professor')`, que é `['pedidos-da-turma', turmaId, quem]`. A lista guarda nomes e a contagem guarda `{quantidade, haMais}`; chaves iguais corrompem o cache.
   - `aplicarDecisao` invalida só a chave da lista nominal. Escrever que a decisão também invalida a chave da contagem, por chave exata, senão o item "pedidos de nome" não sai do sino.
   - Prover um teste e2e para isso. Não usar invalidação por prefixo `pedidos-da-turma`: ele também alcança a chave da coordenação, que é leitura auditada.
3. **3.0:** o vazio "Falta uma turma confirmada" traz "Ir para Turmas" (3.0, linha 52), mas a §9 e o RF7 não o dizem. Registrar o próximo passo na Tech Spec.
4. **Sino sem número:** garantir que "100 ou mais" e a leitura parcial usem o mesmo rótulo curto a 360 px (nome acessível do botão). Hoje isso está só no PRD.

Arquivos lidos:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/prd.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/techspec.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/tasks.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/1_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/12_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/14_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-da-coordenacao/techspec.md`

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-13 08:31:26 · `tasks/prd-telas-do-professor/revisao-spec.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma. A spec não cria tabela nem migration (Tech Spec §3 "Nenhuma tabela"; PRD §3 tira de escopo rota, tabela, permissão e contrato novos). Os itens 1 (`escolaId`/`anoLetivoId`), 6 (UUID), 7 (agregado da rede) e 8 (`@SemEscopo()`) não se aplicam: nenhum id novo, nenhuma consulta da camada rede, nenhuma rotina sem escopo. Os parâmetros de endereço novos (`?turma=`, `?ver=`, `?atividade=`, `?aba=`) carregam UUID que já existe ou valor fechado.

Queries verificadas: a Tech Spec §4 só lê rotas que já existem, e conferi as três no código.
- `GET /v1/artefatos?turmaId=` (`apps/api/src/artefato/artefato.repository.ts`, `listar` e `#noAlcance`): escola e ano vêm de `exigirEscolaDoContexto()` e `exigirAnoEmCurso()`, exige vínculo confirmado na disciplina, e o `turmaId` do cliente só restringe. Turma de outra escola devolve lista vazia, igual a um id inexistente.
- `GET /v1/turmas/:id/reivindicacoes` (`apps/api/src/sala/pedidos.controller.ts`): contrato estrito, e um `escolaId` a mais na consulta vira `ENTRADA_INVALIDA`.
- `GET /v1/turmas/:id/alunos` (`apps/api/src/estrutura/turma.service.ts`, `alunos`): `turma_vinculada` com vínculo `confirmado`, e `NAO_ENCONTRADO` igual para a turma inexistente e a de outra escola.
- Nenhum endpoint passa a decidir a leitura por `escolaId` vindo do cliente.
- O risco novo do lado do cliente é o cache atravessar a troca de escola ou de pessoa. A Tech Spec §6 o trata, e `apps/web/src/main.tsx` faz `resetQueries()` em toda troca de sessão.

Teste de isolamento: presente e efetivo.
- Tech Spec §6 e §10, detalhados nas tarefas:
  - 1.0: troca de escola e segunda pessoa não veem o sino anterior, e a contagem atrasada não entra.
  - 5.0: a turma de outra escola em `?turma=` mostra o mesmo que um id inexistente, e trocar de escola esvazia Criados.
  - 12.0: a turma de outra escola, a de outro professor e a de vínculo pendente respondem "Turma indisponível" sem ler a lista.
- Sem o `reset` do cache, ou sem o alcance `turma_vinculada` no servidor, esses casos falham.
- A §5 (listagem, id e mensagem de erro) é garantida pelo caso de borda "Turma indisponível, igual para a inexistente e a de outra escola" (PRD §7) e pelos testes acima.

Bloqueantes: nenhum.

Recomendações:
1. **Tech Spec §6, texto do cache.** Diz que as chaves do sino "começam pelas de hoje, que `main.tsx` esvazia". Na verdade `main.tsx` faz `resetQueries()` em todas as consultas, não por prefixo. A garantia vale do mesmo jeito, mas o texto induz a crer que o prefixo é o que protege. Corrigir o texto e dizer também que a lista de turmas da série de leituras do sino vem das consultas do cache, nunca de `useState`, que o `reset` não alcança.
2. **Tech Spec §6, "(os e2e de hoje)".** O documento e a turma de outra escola respondendo como inexistentes estão provados hoje nos testes de integração (`apps/api/src/artefato/artefato.int.test.ts`, `apps/api/test/turma-acesso.int.test.ts`) e em `e2e/troca-de-escola.spec.ts`, não num e2e de tela do professor. Citar os arquivos de verdade. Os e2e novos da 5.0 e da 12.0 cobrem a tela.
3. **Tarefa 1.0, cenário "recomeço".** Deixar explícito que a escola A começa com item no sino e a B com zero ou com outros itens, e que a asserção é a ausência dos itens e do número de A. Assim o teste não passa só porque o sino existe.
4. **Tarefa 12.0.** Registrar que a web não envia `?anoLetivoId` em `GET /v1/turmas/:id/alunos`, porque o ano vem do token.
5. **`tasks.md`, "Subagentes por tarefa".** Marcar `tenancy-guardian` na 1.0, que carrega o teste de isolamento do sino da §6, e na 10.0, que muda `Turma.tsx`, onde mora o "Turma indisponível" para a turma de outra escola.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/prd.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/tasks.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/1_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/5_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/12_task.md

## conformidade-reviewer · 1ª rodada · REPROVADO · 2026-10-13 08:32:17 · `tasks/prd-telas-do-professor/revisao-spec.md`

VEREDITO: REPROVADO

Caminhos de escrita em Nota: nenhum novo. A X3 mexe só na web, sem rota, tabela, job, seed nem importação (Tech Spec §1, §3, §4). O lote continua passando só por `aprovar-lote`, que a API recusa com destaque fechado (§7b). Todos com autor humano? sim.

Decisão autônoma sobre aluno: ausente. "Corrigir de novo" (tarefa 11.2) só dispara de novo a correção de objetiva, que nasce pendente. Ficam de fora a ordem por acerto ou média, "Quem precisa de atenção" e a situação do aluno (PRD §3, §6; tarefas 10.0 e 12.0).

Aprovação registrada: ok.
- **Versão adaptada:** continua decidida por `POST /v1/entregas/:id/decidir`, na tela do Assistente, com rejeitar e justificativa (§7b).
- **Atividade:** só chega à turma por "Aplicar à turma", pedindo "é avaliativa?" antes, separado de aprovar (§7b; tarefa 6.0).
- **Lote:** o botão oficial é único, fica desligado até `podeAprovar`, tem confirmação e mostra o registro da validação (D56). Abrir o painel pelo endereço não registra a abertura de um destaque (tarefa 14.3).
- **O sino** só leva à tela onde se decide; nada se decide nele (§5).
- **A exceção do tutor (D47)** não passa para nenhum outro agente.

Supervisão do tutor: lacuna na aba Hoje (§5, §7b). Hoje a professora vê o Tutor quase ao vivo porque `Tutor.tsx` relê os sinais a cada 15 s (`apps/web/src/areas/professor/Tutor.tsx:26` e `:55`); não há WebSocket. A Tech Spec muda essa supervisão para Hoje "com os textos de hoje" e não diz que a releitura continua. Pior, ela escreve três vezes que nada relê por tempo (RF5, §5, contexto D59), o que pode levar quem implementa a tirar a releitura também de Hoje. Além disso, a tarefa 10.2 diz que "as leituras nominais só saem com o painel aberto". Só que a atenção humana (D36) vem de `consultaSinais` e traz o nome do aluno, junto com o agregado. Lido ao pé da letra, o aviso de atenção humana some do alto de Hoje até a professora abrir o painel.

Autonomia declarada e visível: sim.
- "O que cada função do Assistente faz" fica a um clique do sino, e "O que o Tutor faz sozinho" fica em Hoje (RF6; tarefas 2.7 e 10.2, com e2e).
- A tela da coordenação não muda.
- Assinatura com o nome da função e o selo "IA" no Início, na Conversa e nos sinais, com a onça só como cabeça (RF7, RF9; X1 7b).

Bloqueantes:
1. **Tech Spec §5 ("Seu time") e §7b, com reflexo nas tarefas 10.2 e 10.4.** A Tech Spec não garante que a aba Hoje continue mostrando a turma ao vivo (regra 70, item 4; D8), nem que a atenção humana apareça sem abrir o painel (D36). Correção exigida:
   - **(a)** Escrever em §5 e §7b que Hoje lê `consultaSinais` ao abrir, com `refetchInterval` de 15 s enquanto a aba está à vista, como `Tutor.tsx:55` faz hoje. Escrever também que a regra "não relê por tempo" vale só para o sino.
   - **(b)** Escrever que a atenção humana (nome, hora e o que fazer, sem conteúdo) e o agregado da turma aparecem sem abrir o painel. Só a tabela "Sinais por aluno" e `consultaUsoDoTutor` esperam o `?ver=tutor`.
   - **(c)** Na 10.4, um teste de componente com relógio falso: com Hoje aberta, aos 15 s sai uma nova leitura de sinais, e um sinal de atenção humana que chega nela aparece no alto sem recarregar e sem abrir o painel. A mutação que tira o `refetchInterval` precisa deixar esse teste vermelho.

Recomendações (não bloqueiam):
1. **Métrica "cliques do sino até a decisão" (PRD §9):** escrever que ela é medida no e2e, pelo número de passos, e nunca como telemetria por professor (D64; regra 70, itens 8 e 9). A Tech Spec §7 já descarta log novo, mas o PRD deixa a porta aberta.
2. **Atenção humana no cartão da turma (tarefa 9.1):** considerar que o cartão diga que há atenção humana naquela turma, só o número, sem nome. Hoje esse sinal só aparece dentro da turma aberta, e o sino o exclui de propósito (PRD §10).
3. **Teste de vocabulário nas tarefas 10.0 e 12.0:** a extensão do teste de vocabulário (sem "nota", "média", "conceito" ou "pontuação") está só genérica em §7b. Hoje e Alunos herdam textos do mockup ("notas", "média"), e o teste de cada uma deve dizer isso explicitamente, como já fazem a 8.0, a 11.0 e a 14.0. "Média de acertos" (`Aprovar.tsx:275`) vira "acerto médio", conforme a 14.1.
4. **Tech Spec §5:** escrever que "Tentar de novo" e a releitura ao voltar o foco usam a chave exata de cada consulta do sino, como a X2 §5/§7c fixou. Escrever também que a chave da contagem de pedidos é diferente da chave da lista nominal (a recomendação 3 do frontend-reviewer).
5. **Tarefa 10.2:** levar a Hoje também o bloco "Quando o Tutor avisa você", junto de "O que o Tutor faz sozinho". Ele é parte da transparência sobre o que o Tutor faz.

Nenhum dos três documentos traz campo, tela ou prompt que sugira nota em discursiva ou redação. A atividade é só objetiva, o catálogo tem só as três ferramentas que existem, e Redação e discursiva ficam fora de escopo (D55; PRD §6, item 2; tarefa 8.0). O professor medido segue sem ranking, a conversa dele com o chat continua fora do alcance da coordenação e o sino não aparece para ela (PRD §4).

Arquivos:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/techspec.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/prd.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/10_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/apps/web/src/areas/professor/Tutor.tsx`

## infra-guardian · 1ª rodada · REPROVADO · 2026-10-13 08:32:20 · `tasks/prd-telas-do-professor/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: nenhum. Não há rota, job nem tabela novos; o sino, porém, lê em toda tela do professor durante a aula.
Rate limit: ok. A guarda global já limita por usuário e por escola (`LIMITE_REQ_USUARIO_MIN=120`, `LIMITE_REQ_ESCOLA_MIN=30000`, em `.env.example:66-67`). O 429 não é repetido sozinho, e as leituras do sino saem em série e param na primeira recusa (§7c).
Fila e prioridade: ok. Não se aplica: a spec não cria job.
Concorrência: protegida. Decidir entrega, aprovar lote, decidir pedido e gerar acesso continuam com envio único e tratamento de `ENTREGA_JA_DECIDIDA` e `CONFLITO` (§7c). O diálogo de convite mantém o caso "clique duplo" (13.0).
Índice e paginação: ok. Não há query nova. As três rotas que a web passa a ler já são paginadas e começam pelo escopo:
- `/v1/artefatos?turmaId=` usa `artefato_turma_idx (escola_id, turma_id, id)`.
- `/v1/turmas/:id/alunos` e `/reivindicacoes` usam `esquemaConsultaPaginada`, com teto de 100.
Degradação de IA: não se aplica.
Migration: não se aplica.
Métrica e alerta: ok. Nenhum caminho de servidor é novo. O bundle fica coberto pelo `size-limit` e pelo teste do build (§7c, "Orçamento").

Bloqueantes:

1. **O teto de 12 turmas do sino faz ele dizer "Tudo em dia" sem ter lido tudo.** Está na Tech Spec §7c, linhas "Carga na manhã de segunda" e "Rate limit", e em `1_task.md`: subtarefa 1.3 e cenário "não insiste" ("14 turmas dão 12 leituras").
   - **O que está errado.** O teto existe por carga e está certo. Mas a spec só trata como "incompleto" a recusa por limite e a leitura que falha (§5, §7c). As turmas depois da 12ª não são lidas e nada as marca.
   - **O que isso causa.** Professor de Arte ou de Ed. Física com 15 a 20 turmas é comum. Para ele, o sino afirma "Tudo em dia" com pedidos de nome esperando nas turmas 13 a 20. E Turmas, que lê "o que espera" da mesma fila (9.1), mostra essas turmas sem nada pendente.
   - **Por que é bloqueante.** Contraria o RF4 ("não afirma 'Tudo em dia'" sem a leitura completa), e nenhum teste prova o caso.
   - **Correção exigida.**
     - §5 e §7c: escrever que turma confirmada além do teto marca a fila como `incompleto` e que o sino diz o que não leu (por exemplo, "Pedidos de nome de 2 turmas não lidos"). Se a opção for ler o resto em segunda leva, escrever que é em série, só depois da primeira, e sem gatilho de tempo.
     - §5 e §7c: fixar quais 12 turmas são lidas. A ordem deve ser determinística, por nome.
     - `1_task.md`: o cenário "14 turmas" passa a provar também que o estado é `incompleto` e que "Tudo em dia" não aparece.
     - `1_task.md`: declarar a mutação. Tirar a marcação de incompleto por teto tem de deixar o teste vermelho.
     - `9_task.md`: a turma não lida aparece como "não lida", e não sem pendência.

Recomendações:
- **Premissa 5 da §12 (o limite por usuário das leituras do sino).** Ela pode ser fechada com a conta real.
  - O sino faz 14 requisições por leitura (2 mais até 12 turmas). Com o `staleTime` padrão de 30 s (`apps/web/src/api/cliente-de-consultas.ts:25`), o foco custa no máximo cerca de 28 por minuto, contra 120.
  - Escreva na Tech Spec o `staleTime` das consultas do sino, para ninguém copiar o `staleTime: 0` das leituras nominais.
  - Acrescente um teste de componente: dois `focusManager.setFocused(false/true)` dentro do `staleTime` dão zero chamadas. Use o gatilho do `focusManager`, não o evento `focus` (lição da X2).
- **O foco relê o sino.** A §5 diz que o sino relê quando a aba volta a ter foco, e o contexto fixado pela X2 diz que "o sino não relê sozinho". Alinhar o texto, ou justificar a diferença na §5. Para o professor a leitura não é auditada, então não há risco de carga, mas a regra precisa estar escrita igual nas duas specs.
- **Contagem duplicada.** Duas disciplinas na mesma turma devem dar uma leitura só, e não duas. Hoje o teste cobre só o item.
- **Invalidação depois de decidir pedido.** Invalidar a contagem daquela turma pela chave exata, nunca pelo prefixo `pedidos-da-turma`, que relê as 12 turmas. A chave da contagem tem de ser distinta da chave da lista nominal: é a recomendação 3 do `frontend-reviewer`.
- **Ordem por nome com "Ver mais" (12.0).** A rota pagina por id. Ler com `limite=100`, para que turma de até 100 alunos venha numa página só, e reordenar o conjunto inteiro carregado a cada página.
- **Contagem agregada na API.** Registrar no `TODO.md`, fora da X3, uma contagem agregada de pedidos por professor numa leitura só. Ela troca 12 leituras nominais, que trazem até 100 nomes cada só para contar, por uma.

Arquivos:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/1_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/9_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/12_task.md

## test-engineer · 1ª rodada · REPROVADO · 2026-10-13 08:32:43 · `tasks/prd-telas-do-professor/revisao-spec.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **1.0, o sino:**
  - **Caminho feliz:** um item de cada tipo, cada um com o seu destino.
  - **Borda:** vínculo contestado; duas disciplinas na mesma turma; 100 ou mais; mais de 12 turmas; recusa por limite no meio da série; entrega decidida em outra aba; virada de ano.
  - **Permissão:** a coordenação e o aluno não montam o sino do professor.
  - **Isolamento:** troca de escola e segunda pessoa na mesma aba.
  - **Privacidade:** nenhum nome no cache.
  - **Carga:** nada relê por tempo, por foco nem por reconexão.
- **2.0, os lugares:** "Seu time" sai e os sete blocos continuam alcançáveis; nenhum caso de e2e se perde.
- **3.0, Início:** D18 (pergunta antes de abrir o cartão); D35 (a Adaptação não leva o texto da caixa); função suspensa; sem turma; a onça só com a função e o selo "IA".
- **4.0, Conversa:** nenhum cartão sem o "sim"; dois Enter mandam um pedido só.
- **5.0, Criados:** filtros; filtro de turma no servidor; turma de outra escola no endereço; segunda pessoa.
- **6.0, documento:** a aba pelo endereço; a versão rejeitada não exporta; aplicar e encerrar com envio único.
- **7.0 e 8.0, Ferramentas e formulário:** só as três ferramentas; categoria vazia não aparece; vocabulário; Adaptação sem campo de texto; dois cliques em "Gerar".
- **9.0, Turmas:** confirmar e contestar com envio único; duas disciplinas; o texto sobrevive à releitura.
- **10.0, turma aberta:** atenção humana sem conteúdo; nada abre conversa de aluno; leitura nominal só com o painel aberto; endereço antigo do Tutor; isolamento.
- **11.0, Atividades:** estado de cada linha; encerrar com envio único; vocabulário.
- **12.0, Alunos:** ordem de nome; dois alunos com o mesmo nome; aluno sem correção aprovada; nada no cache; isolamento; 41º pedido.
- **13.0, convite:** o link e o código aparecem uma vez; `CONFLITO`; sessão vencida; nada no endereço.
- **14.0, Aprovar:** o oficial desligado até `podeAprovar`; abrir registra uma vez; `?ver=` não registra sozinho; dois cliques aprovam uma vez; o lote mudou.

**Cobertos:** quase todos estão nas tabelas "Testes que provam a regra" das tarefas. Merecem destaque:
- `?ver=` de destaque fechado não abre o painel nem registra (14.0).
- Vínculo pendente não lê a lista (12.0).
- A contagem atrasada não entra (1.0).
- D18 e D35 em componente (3.0 e 4.0).
- O link e o código uma vez, mais a sessão vencida (13.0).
- A conferência da contagem de casos (2.0).
- A onça só como cabeça, com a função e o selo "IA" (3.0): bate com a X1 7b.

**Bloqueantes:**

1. **O sino relê ao voltar o foco, o que contraria o contexto fixado.**
   - **Onde:** Tech Spec §5 ("A fila do professor") e 1_task.md, cenário "não insiste".
   - **O problema:** a §5 diz que o sino lê "quando a aba volta a ter foco". Isso contraria a Tech Spec da X2, §5 e §7c: o sino não relê sozinho; `refetchInterval`, `refetchOnWindowFocus` e `refetchOnReconnect` ficam `false`. O teste "5 minutos de relógio falso sem chamada nova" passaria mesmo com o padrão do TanStack (foco e reconexão ligados). Ele não falha sem a regra.
   - **Correção:** a §5 declara as três opções em `false` nos observadores de `entregas`, `meus-vinculos` e da contagem. O teste da 1.0 roda em dois tempos, como na X2 1.0:
     - além do `staleTime`, `focusManager.setFocused(false→true)` e `onlineManager.setOnline(false→true)` dão zero chamadas;
     - o controle, com a opção ligada, relê;
     - os dois gerenciadores são restaurados no `afterEach`.

2. **Entrega decidida em outra aba: o caso de borda do PRD não tem teste.**
   - **Onde:** PRD §7 ("o item sai do sino"); nenhuma tarefa o cobre.
   - **O problema:** sem a releitura por foco (item 1), o único jeito de o item sair é o `ENTREGA_JA_DECIDIDA` invalidar a chave que o sino lê. Hoje nada prova isso.
   - **Correção:** e2e na 1.0, com dois contextos:
     - decide em B;
     - em A, o item continua no sino até a professora tentar decidir;
     - a tela diz "já estava decidida" e o item sai do sino sem recarregar.

3. **Com mais de 12 turmas, o sino pode afirmar "Tudo em dia" sem ter lido tudo.**
   - **Onde:** Tech Spec §7c e 1_task.md 1.3, cenário "não insiste".
   - **O problema:** "até 12" leituras não diz o que acontece com as turmas que passam de 12. O teste "14 turmas dão 12 leituras" só conta chamadas. Ele passa com o sino dizendo "Tudo em dia" com duas turmas sem leitura, o que viola o RF4.
   - **Correção:** a §7c define que turma além do teto deixa a fila `incompleto` e diz o que faltou. O cenário afirma que, com 14 turmas e nenhum pedido nas 12 lidas, não aparece "Tudo em dia".

4. **"Parar na primeira recusa por limite" não tem cenário.**
   - **Onde:** Tech Spec §7c ("param na primeira recusa por limite, que vira incompleto") e 1_task.md 1.3.
   - **O problema:** é cláusula nova sem teste.
   - **Correção:** teste de componente em que a 3ª leitura recebe 429:
     - não sai nenhuma chamada da 4ª à 12ª;
     - os itens já lidos aparecem;
     - o sino diz que não leu tudo e não afirma "Tudo em dia".

5. **"Sem nome no cache" passa mesmo com o nome guardado.**
   - **Onde:** 1_task.md, cenário "sem nome no cache"; Tech Spec §7 ("descarta a lista antes do cache").
   - **O problema:** se o teste olha o retorno da função ou do `select`, ele passa com o nome guardado. O `select` não muda o que fica no `QueryCache`.
   - **Correção:** a rede falsa devolve pedidos com nomes conhecidos. Depois da leitura, o teste confere que `JSON.stringify(cliente.getQueryCache().getAll().map(q => q.state.data))` não contém nenhum deles. Assim a implementação com `select` reprova.

6. **A 1.0 não tem caso de permissão.**
   - **Onde:** 1_task.md e PRD §4 ("Coordenador: não pode ver o sino").
   - **O problema:** "segunda pessoa não vê o sino anterior" não diz o papel nem conta leituras.
   - **Correção:** dois testes.
     - **Unidade, `sino-do-papel`:** o aluno não tem sino; a coordenação não recebe o `SinoDoProfessor`.
     - **e2e:** a coordenação entra na mesma aba depois da professora (como em `areas.spec.ts:389`). Nenhum pedido sai para `/v1/entregas`, `/v1/vinculos/meus` nem `/reivindicacoes`, e nenhum item da professora aparece.

7. **O teste de isolamento de Criados pode passar sem testar nada.**
   - **Onde:** 5_task.md, cenário "isolamento".
   - **O problema:** "a turma de outra escola no endereço mostra o mesmo que um id inexistente" passa trivialmente se a turma de B não tiver artefato.
   - **Correção:** o cenário exige que a turma de B tenha ao menos um artefato gerado. Com `?turma=<turma de B>`, o título desse artefato não aparece.

[… 25 linhas cortadas]

## privacy-guardian · 1ª rodada · REPROVADO · 2026-10-13 08:34:06 · `tasks/prd-telas-do-professor/revisao-spec.md`

VEREDITO: REPROVADO

Esta foi uma revisão de spec. Li o PRD, a Tech Spec, `tasks.md`, as tarefas 1, 10, 12 e 13 e as partes do `mockup.md` que importam aqui, e conferi o código que a spec cita.

Campos pessoais tocados: o nome do aluno em Alunos, nos sinais, na atenção humana, no uso do Tutor e nos destaques. O acerto por aluno sai do diagnóstico de correção aprovada. Os pedidos de nome trazem `nome` e `teveMatriculaErrada`. Nenhum campo novo é gravado (Tech Spec §3 e §7).

Fora da tabela de dados do docs/lgpd.md: nada. O nome (linha 44), o diagnóstico (49), os sinais e a atenção humana (53 e 59), o uso do Tutor (52), a reivindicação (74) e o acesso da turma (75) já estão lá. A rota nova para a web, `GET /v1/turmas/:id/alunos`, devolve só `{ usuarioId, nome }` com esquema estrito (`packages/shared/src/estrutura/turma.ts:93`).

Autorização por objeto: ok. O servidor não muda (§6). A rota de alunos usa o mesmo critério de acesso da turma, com vínculo `confirmado` e `NAO_ENCONTRADO` igual para todos os casos (`apps/api/src/estrutura/turma.service.ts`). As tarefas 10 e 12 testam outra escola, outro professor e vínculo pendente, todos com "Turma indisponível". A lista `?turmaId=` de artefatos só restringe, e a turma de outro professor não acha nada (`artefato.repository.ts:87`).

Logs: limpos. Não há log novo, e a 12.0 testa que nenhum nome vai para log da web.

Auditoria: presente. O professor lendo a própria turma não exige registro (regra 20, item 10). Abrir destaque, aprovar, aplicar e decidir pedido continuam registrados (§7). A leitura auditada da coordenação não é alcançada.

Envio externo: nenhum. O que a spec garante é que a Adaptação nunca recebe o texto da caixa (RF8, D35, D67).

Seed/fixture: a spec não diz explicitamente que é sintético (ver recomendação 5). As fixtures de hoje são sintéticas.

Pergunta de fechamento: responde. Nada novo é guardado nem enviado, e o arquivo do titular (F3) continua valendo.

Contexto da X1 e da X2: está conforme. O sino não relê por tempo e abrir a lista não faz leitura (RF5, §5). A onça aparece só como cabeça com a função e o selo (RF7, §9).

**Bloqueantes:**

1. **Tech Spec §9 (Turma aberta, aba Hoje), §7 e PRD RF16; tarefa 10.2.** A atenção humana (D36) mostra o nome do aluno logo que a turma abre. Hoje esse sinal fica em "Seu time › Tutor", uma tela separada (`Tutor.tsx:131-144`, que mostra `sinal.aluno.nome`). A X3 o leva para o alto de Hoje, que é a aba padrão da tela que a professora abre e projeta em sala, com nome e "precisa de um adulto". Isso nomeia, diante da turma, o aluno que trouxe um assunto pessoal delicado. Fere a D34 ("nomeado só ao professor da turma") e o art. 14. A Tech Spec ainda se contradiz: a 10.2 diz que "as leituras nominais só saem com o painel aberto", mas os sinais que Hoje lê ao abrir são nominais, e a atenção nominal aparece sem clique nenhum.
   - **Correção exigida:** a Tech Spec deve dizer que, ao abrir, Hoje mostra a atenção humana só com a contagem e o que fazer ("Um aluno precisa de um adulto…"), sem nome. O nome aparece só por ação explícita, no `PainelLado` (`?ver=tutor`) ou num "Ver quem" equivalente.
   - Ela também deve dizer qual leitura nominal sai ao abrir (os sinais, com `gcTime: 0`) e que ali nenhum nome é desenhado.
   - Na 10.0, um teste de componente e um e2e precisam provar que Hoje recém-aberta, com sinal de atenção, não tem nome de aluno no DOM, e que o nome só aparece depois da ação.

2. **Tech Spec §9 (Turma aberta, Alunos) e §7; tarefas 12.0 e 13.0.** O diálogo "Convidar alunos" abre sobre a aba Alunos, e o passo "Acesso gerado" existe para ser projetado ("Projete o código", `acesso-da-turma.ts:46`). A X3 põe na mesma aba os nomes com os acertos de cada aluno e os pedidos de nome. O diálogo tem 560 px e a X1 anuncia um véu mais leve para os diálogos (`estilos.css:318`). Com isso, gerar um acesso novo no meio do ano projeta o desempenho nominal da turma inteira. É o caso do aluno que chega em maio.
   - **Correção exigida:** a Tech Spec deve garantir que, enquanto o passo "Acesso gerado" estiver aberto, nenhum nome, acerto ou pedido da página de trás fique legível. Pode ser um fundo opaco nesse diálogo ou o passo em tela própria, sem a lista atrás.
   - Na 13.0, um e2e precisa provar que, com o passo aberto e a turma com alunos e acertos, nenhum nome nem acerto está visível.

**Recomendações (não bloqueiam):**

1. **§6 e §7, chave da contagem do sino.** Ela precisa ser diferente da chave da lista nominal (`['pedidos-da-turma', turmaId, 'professor']`, `api/pedidos.ts:51`). O sino está montado em toda tela. Se dividir a chave com a lista, os nomes ficam no cache a sessão inteira e o `gcTime: 0` deixa de valer. O teste "sem nome no cache" da 1.0 deveria rodar com a `ListaDePedidos` montada ao mesmo tempo. A contagem deve continuar sob o prefixo da professora, para que `aplicarDecisao` a invalide.
2. **§5, releitura do sino.** "Tentar de novo" e a releitura na volta do foco devem ir pela chave exata de cada consulta do sino, nunca pelo prefixo `['entregas']` ou `['pedidos-da-turma']`. É a mesma regra da Tech Spec da X2, §7c.
3. **§5, o que o sino mostra.** A spec deveria dizer que nenhum item do sino leva nome de aluno, só tipo, turma, título e número, e prová-lo na 1.0. O sino aparece em toda tela, inclusive na que está projetada.
4. **§4, minimização na contagem.** Para contar, o sino lê a lista nominal de pedidos (nome e `teveMatriculaErrada`) de até 12 turmas, a cada volta do foco. Vale registrar no `TODO.md` uma contagem sem nomes na API para o F2, já que a X3 não cria rota.
5. **§10, fixtures.** A spec deveria dizer que as fixtures novas de `e2e/__fixtures__/professor/` usam nomes inventados (regra 20, item 17).
6. **§9, "Texto da pessoa".** A spec deveria registrar que, quando entra outra pessoa, o texto sai junto com a tela. O mecanismo já existe: `lembrarQuemEsta` leva ao início (`CascaDaEscola.tsx:205`). Esse caso deveria entrar nos testes de recomeço da 9.0 e da 14.0.

Arquivos:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/techspec.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/prd.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/10_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/12_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/13_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/apps/web/src/areas/professor/Tutor.tsx`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/apps/web/src/api/pedidos.ts`

## frontend-reviewer · 3ª rodada · APROVADO · 2026-10-13 08:42:04 · `tasks/prd-telas-do-professor/revisao-spec.md`

VEREDITO: APROVADO
Tela vista: não. É revisão de spec e ainda não existe código nem fotos. A tela será vista na validação, incluindo o aviso de atenção humana em Hoje e o passo "Acesso gerado" a 360 px e no Chromebook.
Estados: ok. Cada tarefa de tela lista carregando, vazio, erro e com dado. O sino acrescenta `incompleto`, "100 ou mais", "não lida" e "Tudo em dia" apenas quando a leitura foi completa.
Acessibilidade: ok pelo desenho. O foco fica preso no diálogo e volta a "Convidar alunos" (13_task, linha 59), e há axe nos e2e por tela. O aviso de Hoje com contagem, hora e o que fazer, mais o botão "Ver quem" que abre o `PainelLado`, é alcançável por teclado.
Chromebook fraco: ok. As leituras do sino saem em série, são limitadas a 12 turmas e param na primeira recusa. A conta de cerca de 28 leituras por minuto contra 120 está na §7c. Criados e Alunos paginam com "Ver mais", e o sino e as abas ficam em pedaços carregados por `lazy()`.
Celular: ok. A 360 px os filtros viram diálogo, o painel vira folha de baixo, a barra de Aprovar fica acima da barra da casca, e o 13_task testa 360 px sem rolagem de lado. Nenhum fluxo exige o celular.
Ação oficial protegida: sim. Decidir, aplicar à turma e aprovar lote seguem pelas rotas de hoje, o oficial fica na barra presa e só `podeAprovar` o libera, e a API recusa o lote com destaque fechado.

Conferência da correção exigida na rodada 1
- **Releitura do sino (§5, §7c, 1.3a, 1.5):** feita, item por item.
  - O sino lê ao entrar na área e quando uma decisão invalida a chave.
  - `staleTime` de 5 min, `refetchInterval: false`, `refetchOnWindowFocus: false` e `refetchOnReconnect: false`, como na X2.
  - "Atualizar" e "Tentar de novo" releem só por chave exata, com teste e mutação.
  - O teste em dois tempos usa `focusManager.setFocused(false/true)` e `onlineManager.setOnline(false/true)` com dado velho, zero chamadas e controle com a opção ligada relendo.
  - O `afterEach` restaura os dois gerenciadores.
  - Isso é coerente com `prd-telas-da-coordenacao/techspec.md`, linha 93.

Aviso de atenção humana em Hoje (§7b, §9, 10.2, 10.4)
- Funciona como tela. Fica no alto, sem abrir painel, com contagem, hora e o que fazer.
- Não leva nome de aluno nem texto de mensagem, e some quando não há sinal.
- O nome só sai por "Ver quem", no `PainelLado` (`?ver=tutor`), com os "Sinais por aluno" e o uso do Tutor.
- Sem `?ver=tutor`, só `consultaSinais` é chamada, e isso tem teste com mutação.
- A atualização a cada 15 s enquanto a aba está à vista fica restrita a Hoje (como `Tutor.tsx` faz hoje), e o sino não herda isso.
- Nada contradiz a D36, a D34 nem o art. 14.

Passo "Acesso gerado" (§9, 13.1, 13.3)
- O diálogo tem fundo opaco, o véu forte, porque é projetado.
- O e2e prova que nenhum nome nem acerto fica legível atrás, com mutação (trocar para o véu leve deixa vermelho).
- O código aparece uma vez, o foco volta ao botão de origem e há teste a 360 px.

Bloqueantes: nenhum.

Recomendações (não bloqueiam)
1. Na 10.2, escrever que o DTO de `consultaSinais` não traz linhas por aluno quando o painel está fechado. Se trouxer, os nomes ficam em memória por `gcTime: 0`, mesmo sem aparecer no DOM. O teste atual olha só o DOM; vale conferir também o `QueryCache`, como o sino faz.
2. Declarar na 10.4 que o aviso novo, aos 15 s, entra sem piscar, sem som e sem mover o foco (D59). O texto do aviso pode ser `aria-live="polite"`, uma vez.
3. A Tech Spec ficou acima do teto de palavras, com aceite por delegação registrado. Se o Joaquim não ratificar a delegação, o ônus fica na Tech Spec, não no desenho.

Arquivos: `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/techspec.md`, `1_task.md`, `10_task.md`, `13_task.md`, `9_task.md`, `12_task.md`.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-13 08:42:37 · `tasks/prd-telas-do-professor/revisao-spec.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma nova. A spec só mexe no cliente e não cria migration, tabela nem coluna. Tech Spec §6, como na rodada 1.

Queries verificadas:
- **Contagem por turma** (Tech Spec §7 e 1_task.md item 1.3)
  - A chave é `['pedidos-da-turma', 'contagem', turmaId]`. Fica sob o prefixo `pedidos-da-turma`, e `main.tsx` faz `clienteConsultas.resetQueries()` sem filtro em `aoTrocarDeSessao`. Por isso a troca de escola e a segunda pessoa esvaziam a contagem junto com o resto (`/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/apps/web/src/main.tsx`).
  - A chave não colide com a lista nominal `[...CHAVE_DOS_PEDIDOS, turmaId, quem]` de `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/apps/web/src/api/pedidos.ts`. O segundo elemento é o literal `'contagem'` de um lado e um UUID do outro.
  - A leitura auditada da coordenação (`quem = 'coordenacao'`, `enabled: false`) tem chave própria. A invalidação da contagem por chave exata não a alcança.
  - O controle de "Atualizar" e "Tentar de novo" por chave exata tem teste com mutação: trocar por prefixo deixa o teste vermelho (1_task.md, cenário "por chave exata", zero chamadas à lista nominal).
- **§6 reescrita.** A lista de turmas do sino vem do cache, não de `useState`, então o `resetQueries()` a alcança. Os três arquivos de teste citados existem: `apps/api/src/artefato/artefato.int.test.ts`, `apps/api/test/turma-acesso.int.test.ts` e `e2e/troca-de-escola.spec.ts`.
- **As 12 turmas em ordem de nome, e as turmas além do teto.** A ordem é aplicada sobre a lista de turmas que a API já devolve com o escopo do token. As leituras usam só `turmaId` no caminho de `/v1/turmas/:id/reivindicacoes`, sem `escolaId` nem `anoLetivoId` vindos do cliente. A turma além do teto não é lida, só marcada `incompleto`, e nada novo sai do servidor.
- **`GET /v1/turmas/:id/alunos`** (12_task.md item 12.1). A web não envia `?anoLetivoId`. O `?anoLetivoId` que o servidor aceita já existia (`esquemaConsultaAlunosDaTurma`, com o ano encerrado conferido contra a escola da sessão em `turma.service.ts`), e a spec não o usa. A leitura com `limite=100` fica dentro da paginação que a API já tem.
- **Permissão** (1_task.md, cenário novo). Tem e2e: a coordenação entra na mesma aba depois da professora e não faz nenhuma chamada a `/v1/entregas`, `/v1/vinculos/meus` nem `/reivindicacoes`.

Teste de isolamento: presente e efetivo. O e2e "recomeço" (troca de escola e segunda pessoa, com A tendo itens e B tendo zero ou outros) quebra se o `resetQueries()` sair ou se a contagem ficar fora do cache. O caso novo de Criados com artefato na turma de B (§10) quebra se o escopo do repository sair.

Bloqueantes: nenhum.

Recomendações:
- **Invalidação da contagem só para a professora** (Tech Spec §7 e 1_task.md item 1.3). Escrever que `aplicarDecisao` invalida a chave da contagem só quando `quem === 'professor'`. Hoje não há vazamento: a contagem não existe numa sessão de coordenação, porque o cache é esvaziado na troca e a coordenação não monta o sino. A condição deixa isso explícito no código.
- **Teste de unidade da chave** (1_task.md, cenário "sem nome no cache"). Conferir que a chave da contagem é exatamente `['pedidos-da-turma', 'contagem', turmaId]`, como `pedidos.test.ts` já faz para a lista nominal. Isso prende o prefixo que o recomeço depende.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-13 08:42:59 · `tasks/prd-telas-do-professor/revisao-spec.md`

VEREDITO: APROVADO

A correção exigida na 1ª rodada foi feita nos três pontos. A saída mais restritiva que o `privacy-guardian` pediu atende a regra 70, item 4, a D8 e a D36.

**Conferência da correção**

- **(a) Hoje relê os sinais: feito.**
  - A Tech Spec §7b diz que Hoje lê `consultaSinais` ao abrir, com `refetchInterval` de 15 s enquanto a aba está à vista. É o que `apps/web/src/areas/professor/Tutor.tsx:55` faz hoje.
  - A §5 limita "não relê por tempo" ao sino: "vale só para o sino: a aba Hoje tem a regra da §7b".
  - A 10.2 repete as duas coisas.
- **(b) O aviso e o agregado não dependem do painel: feito.**
  - A §7b e a 10.2 põem o aviso de atenção humana e o agregado da turma no alto, sem abrir painel.
  - Só os "Sinais por aluno" e `consultaUsoDoTutor` esperam o `?ver=tutor`.
  - O nome sai do aviso, como explico na decisão abaixo.
- **(c) Teste da releitura com relógio falso: feito.**
  - A 10.4 tem a linha "Hoje relê os sinais": aos 15 s sai nova leitura e o sinal novo aparece no alto sem recarregar. Tirar o `refetchInterval` deixa o teste vermelho.
  - Duas linhas novas cobrem o resto. "Atenção humana sem nome nem conteúdo": com Hoje recém-aberta, o aviso está no alto, sem painel, sem nome no DOM. "Sem painel, sem rota nominal": sem `?ver=tutor`, só `consultaSinais` é chamada. As duas têm mutação.
  - Juntas, provam que a atenção humana chega ao vivo sem painel. A §9 da Tech Spec lista os três testes.

**Decisão a conferir: aviso sem nome em Hoje**

A saída atende a minha regra.

- A D36 pede que a professora receba o sinal "precisa de atenção humana" sem o conteúdo. Ela não pede o nome visível de cara.
- O aviso fica no alto e se atualiza a cada 15 s. Leva a contagem, a hora e o que fazer, com o texto de `textoDaAtencaoHumana` em `apps/web/src/areas/professor/sinais.ts`.
- O nome fica a uma ação explícita ("Ver quem"). O adulto certo é avisado na hora e chega ao aluno com um clique.
- A supervisão não fica invisível, que é o que a regra 70, item 4, proíbe. E respeita a D34 e o art. 14 numa aba que é projetada em sala.
- A hora já está escrita, na §7b e na 10.2. A ação que leva ao nome existe ("Ver quem" abre o `PainelLado`).

Duas coisas ficam implícitas. Não bloqueiam, mas estão nas recomendações 1 e 2:

- **Onde fica o botão.** A spec não diz que "Ver quem" fica dentro do próprio aviso.
- **O que o painel mostra primeiro.** A spec não diz que o painel aberto por "Ver quem" começa pela lista de quem precisa de um adulto (nome · hora), como em `Tutor.tsx:137-143` hoje. Do jeito que está escrito, esses nomes podem acabar misturados nos "Sinais por aluno", em ordem de nome.

**Resultado por item da lista**

```
VEREDITO: APROVADO
Caminhos de escrita em Nota: nenhum novo (a X3 é só pele; nenhuma rota nem contrato da API muda, Tech Spec §1 e §6) — todos com autor humano? sim
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok (versão adaptada por POST /v1/entregas/:id/decidir; atividade só por "Aplicar à turma"; lote por aprovar-lote, recusado com destaque fechado; oficial liberado só por podeAprovar; Tech Spec §7b). Exceção do tutor só no Tutor
Supervisão do tutor: ok (Hoje relê a cada 15 s; aviso de atenção humana sem painel, com contagem, hora e o que fazer; nome por "Ver quem"; nada abre conversa; §7b, 10.2, 10.4)
Autonomia declarada e visível: sim ("O que o Tutor faz sozinho" e "Quando o Tutor avisa você" em Hoje; a visibilidade à coordenação não muda nesta spec)
Bloqueantes: nenhum
Recomendações:
1. 10.2 e §7b: escrever que o botão "Ver quem" fica dentro do aviso e que o PainelLado aberto por ele começa pela lista de atenção humana (nome · hora, como em Tutor.tsx:137-143 hoje), separada dos "Sinais por aluno" e acima deles. Teste na 10.4: depois de "Ver quem", o primeiro bloco do painel é o de atenção humana.
2. Com mais de um aluno, escrever qual hora o aviso mostra (a do sinal mais recente).
3. O aviso que surge na releitura de 15 s deve ser anunciado a leitor de tela, com aria-live educado (fica com o frontend-reviewer).
4. 10.2 diz que "o cartão da turma pode mostrar o número de atenção humana", mas a 9.1 proíbe leitura a mais em Turmas. Decidir uma coisa só. Se Turmas não lê sinais, tirar o "pode" para não abrir uma leitura nova sem desenho. O alcance é o mesmo de hoje (era preciso escolher a turma em Seu time › Tutor), então não é regressão. Avisar fora de Hoje continua fora do escopo e vai para o F6 ou o F10.
5. A decisão por delegação (aviso sem nome em Hoje, §12) continua marcada para o Joaquim rever. Do lado da regra 70, não há objeção.
```

Arquivos conferidos:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/prd.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/tasks.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/10_task.md, mais 1_task.md, 5_task.md, 9_task.md, 12_task.md e 13_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/apps/web/src/areas/professor/Tutor.tsx
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/apps/web/src/areas/professor/sinais.ts

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-13 08:43:00 · `tasks/prd-telas-do-professor/revisao-spec.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. As telas leem dados que já existem: o nome do aluno em `consultaSinais`, `consultaUsoDoTutor`, `GET /v1/turmas/:id/alunos` e nos pedidos de nome; o acerto por aluno vem do desempenho aprovado. A contagem de pedidos guarda só `{ quantidade, haMais }`.

Fora da tabela de dados do docs/lgpd.md: nada. A spec não cria campo pessoal.

Autorização por objeto: ok. Nenhuma rota nova, e o escopo continua no repository (Tech Spec §6). O isolamento de Criados agora tem e2e com artefato na turma de B e mutação declarada (5_task). O tenancy-guardian entrou na 1.0 e na 10.0.

Logs: limpos. O complemento da contestação não vai a log nem ao endereço (9_task), e nenhum token aparece em log nem em URL (13_task).

Auditoria: presente. A leitura de `turma.alunos_lidos` é conferida na 12.1. As decisões passam por `POST /v1/entregas/:id/decidir` e `aprovar-lote`, que não mudam.

Envio externo: nenhum novo. Nenhuma chamada de IA muda.

Seed/fixture: sintético. As fixtures de tela usam nomes inventados (§10).

**Conferência das duas correções exigidas na 1ª rodada**

1. **Atenção humana em Hoje sem nome: atendida.**
   - A Tech Spec diz que o aviso de atenção humana e o agregado aparecem sem abrir painel, só com contagem, hora e o que fazer, e sem nome de aluno (§7b e §9, linha "Turma aberta"). O nome só aparece por ação explícita, em "Ver quem", no `PainelLado` (`?ver=tutor`), que também libera os "Sinais por aluno" e `consultaUsoDoTutor`.
   - A spec diz qual leitura nominal sai quando a aba abre: `consultaSinais`. Pela §7 ela continua com `gcTime: 0`, o que confere com `apps/web/src/api/tutor-da-turma.ts:17`.
   - A 10_task (10.2 e 10.4) traz três testes:
     - Componente e e2e: Hoje recém-aberta, com sinal de atenção, não tem nome de aluno no DOM, e o nome só aparece depois de "Ver quem". Mutação: desenhar o nome no aviso deixa o teste vermelho.
     - Componente: sem `?ver=tutor`, só `consultaSinais` é chamada.
     - Aos 15 s sai nova leitura dos sinais.
   - O redirecionamento de `/professor/time/tutor` leva a `?aba=hoje` sem `ver=tutor` (10.3).

2. **"Acesso gerado" sem nada legível atrás: atendida.**
   - Na Tech Spec, o passo "Acesso gerado" tem fundo opaco, o véu forte, nunca o véu leve da X1 (§9, parágrafo "Acesso gerado").
   - Na 13_task, a 13.1 diz o mesmo. O e2e monta a turma com alunos e acertos e prova que nenhum nome nem acerto fica visível atrás. Mutação: trocar pelo véu leve deixa o teste vermelho.
   - Os pedidos de nome do alto da aba entram em "nenhum nome".

**A saída do conflito com o conformidade-reviewer atende a regra 20 e a D34/D36.**
- A D36 pede que o professor receba o sinal sem o conteúdo. O sinal continua imediato em Hoje, sem painel, com hora e o que fazer.
- A D34 e o art. 14 pedem que o aluno em risco seja nomeado só ao professor, e não à sala para onde a aba padrão é projetada. O nome fica a um clique, nas mãos dela.
- A urgência não sofre: a professora sabe na hora que alguém precisa de um adulto e chega ao nome com uma ação.
- A Tech Spec registra a decisão como tomada por delegação, para o Joaquim rever (§12).

**O que a correção criou de novo, conferido**
- **Chave da contagem.** `['pedidos-da-turma', 'contagem', turmaId]` é distinta da lista nominal `['pedidos-da-turma', turmaId, quem]` e fica sob o prefixo que `main.tsx:27` esvazia com `resetQueries()` na troca de sessão. `aplicarDecisao` a invalida por chave exata, e "Atualizar" e "Tentar de novo" também releem por chave exata, com teste.
- **Nome no cache.** Ao abrir Hoje, o nome dos sinais fica no cache só enquanto a aba está montada (`gcTime: 0`) e nunca no DOM. Isso é aceitável: a professora da turma está autorizada (D34), e a troca de pessoa ou de escola zera o cache.
- **"Ver quem".** Fechar o painel desmonta o DOM com os nomes, e `consultaUsoDoTutor` sai do cache na hora (`gcTime: 0`).

Bloqueantes: nenhum.

Recomendações:
1. **prd.md RF16.** O texto ainda diz só "sem conteúdo (D36)". Acrescentar "e sem nome; o nome por 'Ver quem'", para o PRD não divergir da §7b.
2. **1_task.md, cenário "sem nome no cache".** Como está escrito, o teste não pode passar: com a `ListaDePedidos` montada, o `JSON.stringify` de todo o `QueryCache` contém os nomes da lista nominal, que é legítima. É preciso filtrar pelas chaves do sino (`['pedidos-da-turma', 'contagem', …]`, `entregas`, `meus-vinculos`) ou excluir a chave da lista. A intenção e a mutação continuam valendo.
3. **13_task.md, "nada legível atrás".** Fixar o método de medição. O `toBeVisible` do Playwright não enxerga a sobreposição, então um teste feito com ele ficaria verde com o véu leve. Medir pelo `elementFromPoint` na posição do nome, que deve devolver o véu ou o diálogo, ou pela opacidade calculada do véu.
4. **`?ver=tutor` no endereço.** Ao recarregar a página ou voltar pelo histórico, o painel reabre com os nomes sem uma ação naquele momento. Vale dizer que nenhum link de entrada (cartão, sino, redirecionamento, "Voltar para a turma") leva `ver=tutor`, e considerar não reabrir o painel ao recarregar.
5. **10_task.md, cenário "atenção humana sem nome".** A fixture deve trazer também sinais de outros tipos ligados a um aluno, não só o de atenção. Assim o teste prova que nenhum bloco de Hoje desenha nome, não apenas o aviso.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/prd.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/1_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/10_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/13_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/apps/web/src/api/tutor-da-turma.ts
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/apps/web/src/main.tsx

## infra-guardian · 2ª rodada · APROVADO · 2026-10-13 08:43:25 · `tasks/prd-telas-do-professor/revisao-spec.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum (nenhuma rota, fila, migration ou chamada de IA nova; o sino e a aba Hoje passam a ler em toda tela do professor)
Rate limit: ok
Fila e prioridade: ok (não se aplica, não há job novo)
Concorrência: protegida (§7c "Corridas de concorrência": envio único e tratamento de `ENTREGA_JA_DECIDIDA` e `CONFLITO` como hoje; e2e de entrega decidida em outra aba na 1_task; dois cliques em "Gerar acesso" na 13_task)
Índice e paginação: ok (nenhuma query nova no servidor. `/v1/sinais` e `/v1/turmas/:id/alunos` já paginam; Criados e Alunos usam "Ver mais")
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (nenhum código de servidor no caminho quente; `size-limit` e teste do build, §7c)

**A correção exigida na rodada anterior, item por item:**
- **Turma além do teto marca `incompleto` e o sino diz o que não leu, nunca "Tudo em dia".** Atendido na §5 e na §7c ("Rate limit" e "Quando cada dependência cai").
- **Segunda leva.** Não existe, então não há gatilho de tempo para conferir.
- **Quais 12 turmas são lidas, por nome.** Atendido na §7c ("as 12 primeiras por nome"), em `1_task.md` 1.3 e no cenário "mais de 12 turmas". A §5 só ordena a saída e não repete a ordem da leitura (ver recomendação 2).
- **`1_task.md`, cenário das 14 turmas.** Prova 12 leituras em série e em ordem de nome, o estado `incompleto` e que "Tudo em dia" não aparece. A mutação está declarada.
- **`9_task.md`.** A turma não lida aparece como "não lida", nunca "em dia", e a mutação está declarada.

**O que a correção do foco criou:**
- **Releitura do sino.** `staleTime` de 5 min e `refetchInterval`, `refetchOnWindowFocus` e `refetchOnReconnect` em `false` (§5, `1_task.md` 1.3a). O teste usa `focusManager` e `onlineManager` e tem um caso de controle que relê com a opção ligada. Assim o teste não passa à toa.
- **Premissa 5 da §12 (14 leituras contra 120/min).** Confere com o código: `LIMITE_REQ_USUARIO_MIN=120` e `LIMITE_REQ_ESCOLA_MIN=30000` (`.env.example:66-67`), aplicados por `sub` e `esc` do token, nunca por IP. A conta de 28 por minuto é pessimista: a leitura cheia só acontece ao entrar na área, depois de 5 min ou na troca de sessão, e a decisão invalida uma chave só. O 429 não é repetido sozinho (`deveTentarDeNovo`, `apps/web/src/api/cliente-de-consultas.ts:13`), então a parada na primeira recusa não é desfeita por retry.
- **Chave nova da contagem.** `['pedidos-da-turma', 'contagem', turmaId]` não colide com a lista nominal `['pedidos-da-turma', turmaId, quem]` (`apps/web/src/api/pedidos.ts:51`), porque um UUID nunca é `'contagem'`. O `resetQueries()` de `main.tsx` alcança as duas. Como invalidar `['pedidos-da-turma', turmaId]` não alcança a contagem, a §7 e a 1.3 exigem a invalidação por chave exata em `aplicarDecisao`.
- **Hoje com `refetchInterval` de 15 s.** Não está na conta da §7c, mas não muda o veredito:
  - Por professor, são 4 leituras por minuto com a aba à vista. O TanStack pausa o intervalo com a aba escondida (`refetchIntervalInBackground` é `false` por padrão).
  - Somando ao teto do sino, ficam cerca de 32 por minuto contra 120 por usuário.
  - Por escola, 60 turmas com Hoje aberta dão cerca de 240 por minuto contra 30.000.
  - A rota `/v1/sinais` já existe e é paginada (`apps/web/src/api/tutor-da-turma.ts:16`), e o 429 não é repetido.

  É carga real da manhã de segunda que não estava escrita, mas não chega perto de nenhum limite.

Bloqueantes: nenhum

Recomendações:
1. **§7c "Carga na manhã de segunda".** Somar a leitura de Hoje: 4 por minuto por professor com Hoje à vista, pausada com a aba escondida. Hoje passa a ser a aba de entrada da turma, e a Visão geral de hoje não relia por tempo. Escrever também o total por usuário (cerca de 32 contra 120) e por escola (cerca de 240 contra 30.000).
2. **§5.** Repetir ali que a leitura da contagem pega as 12 primeiras turmas confirmadas por nome. Hoje a §5 só ordena a saída da fila, e a ordem da leitura está só na §7c e na 1_task.
3. **§12, premissa 5.** Dizer de onde sai o "28 por minuto" (duas leituras cheias por minuto como pior caso) e que o 120 é o `LIMITE_REQ_USUARIO_MIN`, configurável por escola em `configuracao_operacional_escola`.
4. **`12_task.md` 12.1.** Ler com `limite=100` e reordenar só o conjunto carregado faz a ordem mudar a cada "Ver mais" numa turma de mais de 100 alunos. Escrever que "Ver mais" reordena tudo o que já foi carregado, ou que a turma cabe numa página.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/1_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/9_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/10_task.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/tasks.md

## test-engineer · 2ª rodada · REPROVADO · 2026-10-13 08:43:41 · `tasks/prd-telas-do-professor/revisao-spec.md`

VEREDITO: REPROVADO

**Cenários exigidos:** as oito correções da rodada 1, mais teste para o desenho que elas trouxeram: o aviso sem nome em Hoje com "Ver quem", a chave nova da contagem, o fundo opaco de "Acesso gerado", o ano letivo do sino e o número no cartão da turma.

**Cobertos:**
- **1. O sino não relê por foco nem por reconexão.** A Tech Spec §5 e a 1.3a declaram as quatro opções. O cenário "não insiste" tem os dois tempos, o caso de controle, o `afterEach` e as mutações. Atendido.
- **2. Entrega decidida em outra aba.** Há um e2e com dois contextos e `ENTREGA_JA_DECIDIDA`, e o item sai sem recarregar. Atendido.
- **3. Mais de 12 turmas.** Atendido só em parte; o que falta está no bloqueante 2.
- **4. Recusa por limite.** A 3ª leitura recebe 429, nada sai da 4ª à 12ª, há mutação. Atendido.
- **5. Sem nome no cache.** Passou a teste de componente com `JSON.stringify` e mutação, mas o cenário saiu contraditório (bloqueante 1).
- **6. Permissão.** Há a unidade (aluno sem sino, coordenação sem `SinoDoProfessor`) e o e2e da coordenação na mesma aba. Atendido.
- **7. Isolamento de Criados.** A turma de B tem um artefato, o título dele não aparece, há mutação no servidor. Atendido.
- **8. Hoje.**
  - Relógio falso aos 15 s, com a mutação do `refetchInterval`.
  - Sem `?ver=tutor`, só `consultaSinais` é lida.
  - "Fechar o painel solta os nomes" fica no e2e de isolamento da 10.0.
  - Atendido.
- **Desenho novo coberto:** o aviso sem nome, com "Ver quem" (componente e e2e, com mutação), e a chave da contagem distinta da lista, invalidada por chave exata. Esta última é provada pelo cenário "Atualizar por chave exata" e pelo e2e "decidir tira o item".

**Bloqueantes:**

1. **`1_task.md`, cenário "sem nome no cache": o teste fica vermelho com o código certo.** Com a `ListaDePedidos` montada ao mesmo tempo, a consulta nominal dela está no `QueryCache` com os nomes. O `gcTime: 0` só a remove depois de desmontar. Então `JSON.stringify(cache.getAll()…)` sempre contém nome.
   - Correção exigida, em dois casos:
     - (a) Só o sino montado: o `JSON.stringify` do cache inteiro não contém nenhum nome.
     - (b) Sino e lista montados juntos: existe a consulta `['pedidos-da-turma','contagem',turmaId]`, o dado dela é exatamente `{quantidade, haMais}`, e ela é diferente da chave da lista.
   - Filtrar só pelo prefixo `contagem` não basta. Com a chave compartilhada, o filtro não acha nada e o teste passa vazio.
   - Mantenha a mutação "guardar a lista inteira na contagem".

2. **`1_task.md`, cenário "mais de 12 turmas": falta a condição que dá sentido a "nunca Tudo em dia".** A correção 3 pedia que nenhuma das 12 turmas lidas tivesse pedido. Sem isso, o fixture pode ter itens, e a asserção passa sempre. Assim não se pega a implementação que mostra "não li 2 turmas" e "Tudo em dia" ao mesmo tempo.
   - Correção exigida: o fixture tem zero itens nas 12 turmas lidas, sem entrega e sem vínculo pendente. O teste confere que "Tudo em dia" está ausente do DOM e que o aviso do que não foi lido está presente.

3. **`1_task.md` 1.3a ("Sem ano letivo em curso…; vínculo de ano encerrado não vira 'Confirme sua turma'"): regra nova sem teste.** É o caso da virada de ano letivo, e nenhuma linha da tabela o prova. Hoje uma regressão aqui não deixa nada vermelho.
   - Correção exigida, em dois testes:
     - Componente: sem ano letivo em curso, zero chamadas a turmas e vínculos, o sino diz isso e não mostra "Tudo em dia".
     - Unidade de `filaDoProfessor`: um vínculo `pendente` de ano encerrado não gera item.
   - Cada um com mutação declarada.

4. **"Acesso gerado" (Tech Spec §9, `13_task.md` 13.1 e o cenário "nada legível atrás"): o desenho promete fundo opaco e aponta um véu que não é opaco, e o teste não diz o que mede.**
   - O "véu forte, como o do login por cima" é o `dialog::backdrop` de `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/apps/web/src/estilos.css:322-323`, que é `rgba(13, 13, 13, 0.75)`. Nas minhas contas, um texto escuro sobre branco fica em cerca de 2:1 atrás dele, e isso ainda se lê no projetor. "Opaco" e "véu forte" se contradizem.
   - A medida "de contraste ou de texto visível fora do diálogo" não serve como está:
     - O `toBeVisible` do Playwright ignora o que está por cima. Por esse caminho, o teste fica vermelho com o fundo certo ou passa sempre.
     - Sem um limite, o contraste não decide nada.
   - Correção exigida:
     - Fixar o fundo desse passo como opaco, com alfa 1 e um token nomeado. Tratar a guarda de cor da X1, que só aceita cor no véu do diálogo.
     - O e2e lê `getComputedStyle(dialog, '::backdrop').backgroundColor` e exige alfa 1. Uma alternativa é calcular o contraste de um nome atrás do véu contra o fundo e exigir menos de 1,1:1.
     - A mutação troca o fundo opaco pelo `veu` e precisa deixar o teste vermelho.

5. **`10_task.md` 10.2 ("O cartão da turma pode mostrar o número de atenção humana, sem nome"): desenho opcional, sem fonte e sem teste.** O "pode" deixa a decisão para quem implementa. Isso contradiz a `9_task.md` 9.1, onde o cartão só usa a fila do sino, "nenhuma leitura a mais". Mostrar o número no cartão exigiria ler `consultaSinais` por turma em Turmas, e essa leitura traz dado nominal para todas as turmas.
   - Correção exigida, uma de duas:
     - Tirar a frase. Nesse caso a linha "o que espera" da 9.0 já prova "nenhuma leitura a mais".
     - Ou dizer de onde vem o número e acrescentar à 9.0 um cenário: a conta de chamadas continua a do sino, nenhum nome no DOM nem no cache de Turmas, e há mutação.

**Recomendações:**
- `1_task.md`, "recusa por limite": acrescentar que não aparece "Tudo em dia". Com itens já lidos a asserção é trivial, mas deixa a intenção escrita.
- `1_task.md`, "mais de 12 turmas": provar o "em série" segurando a primeira resposta (`segurar`) e conferindo que só há uma leitura em voo.
- `1_task.md`, e2e de permissão: restringir as rotas checadas às da professora (as `/v1/turmas/<turmas dela>/reivindicacoes`). Assim a leitura legítima do sino da coordenação da X2 não dá falso vermelho.
- `10_task.md`, "Hoje relê os sinais": acrescentar o caso em que Atividades ou Alunos está aberta, ou a aba do navegador está escondida, e nenhuma leitura sai aos 15 s.
- `12_task.md` 12.1: um teste de componente de que a web não envia `?anoLetivoId` e lê com `limite=100`.

## frontend-reviewer · 4ª rodada · APROVADO · 2026-10-13 08:46:35 · `tasks/prd-telas-do-professor/revisao-spec.md`

VEREDITO: APROVADO
Tela vista: não (revisão de spec, sem código nem fotos; só `13_task.md` e `techspec.md` §9 e §10 foram lidos para esta rodada)
Estados: ok. `13_task.md` (Testes) cobre carregando, erro com "Tentar de novo", sem acesso ativo, acesso vigente, gerando e `CONFLITO` (só "Fechar"). O passo "Acesso gerado" mostra o link e o código uma vez; reabrir mostra só a validade. Acesso expirado cai em "Sem acesso ativo" com o gerar. O código tem validade e revogação, sem estado "usado" por aluno, o que combina com o convite por turma. Não há estado novo a cobrir.
Acessibilidade: ok pelo desenho.
- A tela inteira continua sendo um `<dialog>` com `showModal`, herdado da X1 (`prd-pele-e-casca/7_task.md`).
- O foco fica preso e volta ao botão "Convidar alunos"; a tarefa 13.3 testa isso ("360 px e teclado").
- Esc e toque fora pedem fechar pelo `aoFechar` do `Dialogo`. Sem copiar, a pergunta aparece dentro do mesmo diálogo, como em `DialogoDoConvite.tsx` e `copia-unica.tsx`. Não há diálogo dentro de diálogo, como a 13.1 exige.
- O foco de cada passo vai ao título, por `useFocoDaEtapa`.
- A medição por `elementFromPoint` com mutação declarada é o teste certo para "nada legível atrás". A página de trás fica inerte, portanto também sem leitura por leitor de tela.
Chromebook fraco: ok. Não há biblioteca nova, o fundo é por classe de token (sem véu translúcido nem efeito de CPU), e a troca de passo não anima largura nem altura (regra da X1).
Celular: ok. O e2e de 13.3 exige "sem rolar de lado, também com o código grande" nos dois projetos. A saída é por botão, não depende de hover nem de atalho, e nenhum fluxo exige o celular.
Ação oficial protegida: sim. Gerar, gerar novo e revogar mantêm a pergunta de hoje e o envio único, e o e2e do clique duplo permanece (regra 20, itens 7 e 8).
Bloqueantes: nenhum.
Recomendações (não bloqueiam):
1. `13_task.md` 13.1 diz "um `Dialogo` de 560 px" e, na mesma linha, que o passo é "tela inteira". O `Dialogo` atual (`apps/web/src/componentes/Dialogo.tsx:150`) tem largura fixa e não aceita variante, e `Dialogo.tsx` não está em "Arquivos previstos". Escreva que o `Dialogo` ganha uma variante `inteira` (alterado em 13.0, ou em tarefa da X1), e que o passo "Gerar" e o passo "Acesso vigente" continuam em 560 px. Diga também que a mudança de largura entre passos não anima. Hoje o implementador precisa adivinhar onde a classe entra.
2. O histórico do navegador não está dito (§9, 13.2). Diga se abrir o convite em `?convidar=1` usa `push` ou `replace`, e o que o Voltar do navegador faz com o passo "Acesso gerado" aberto. Se o Voltar sair da página com o diálogo aberto, o link some sem a pergunta de fechar. O desenho mais seguro é abrir com `replace` e tratar o Voltar como pedido de fechar, passando pela pergunta. Acrescente um caso ao e2e de teclado.
3. `13_task.md` ("Fora do escopo") deixa de fora a "tela cheia Projetar nova", enquanto o passo "Acesso gerado" já é projetado em tela inteira. Uma frase dizendo que "Projetar" aqui é só o texto do botão que mantém esse passo (e que um modo de projeção maior fica fora) evita que a 13.0 seja lida como contraditória.
4. Mantenha o e2e de "recomeço" com o `LoginPorCima` (outro diálogo) aparecendo por cima do passo em tela inteira. O foco precisa voltar ao diálogo do convite, e a leitura do código e do link não pode vazar para o log nem para a URL.

Arquivos lidos: `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/techspec.md`, `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/13_task.md`.

## test-engineer · 3ª rodada · REPROVADO · 2026-10-13 08:48:29 · `tasks/prd-telas-do-professor/revisao-spec.md`

VEREDITO: REPROVADO

Cenários exigidos: as cinco correções da rodada 2, e teste para o que elas trouxeram de novo:
- a tela inteira de "Acesso gerado";
- os casos novos de Hoje (aba escondida, outra aba aberta, `aria-live`);
- o "não lida" em Turmas;
- as recomendações da rodada 2 que viraram texto.

Cobertos:
- **Correção 1 atendida** (`1_task.md`, cenário "sem nome no cache"). O caso (a) tem só o sino montado e confere o `JSON.stringify` do cache inteiro. O caso (b) tem sino e `ListaDePedidos` juntos e confere três coisas: a chave `['pedidos-da-turma','contagem',turmaId]` existe, o dado é exatamente `{quantidade, haMais}`, e a chave é diferente da da lista. A tarefa avisa que o prefixo não basta. A mutação "guardar a lista inteira" fica e deixa os dois vermelhos. Conferi que nem `entregas` nem `meus-vinculos` trazem nome de aluno: o único `nome` de `packages/shared/src/assistente/entrega.ts:29` é o do professor. Então o caso (a) não fica vermelho com o código certo.
- **Correção 2 atendida.** O fixture tem zero itens nas 12 turmas lidas, sem entrega e sem vínculo pendente. O teste exige "Tudo em dia" ausente e o aviso do que não foi lido presente. A mutação tira a marca `incompleto`.
- **Correção 3 atendida.** Há o teste de componente "sem ano letivo em curso" (zero chamadas, o sino diz isso, sem "Tudo em dia") e a unidade "vínculo de ano encerrado". Cada um tem mutação.
- **Correção 4 atendida em parte.** A §9 e a 13.1 fixam a tela inteira com `bg` do token `fundo`, que é opaco: `#ffffff` e `#131f24` em `apps/web/src/estilos.css:34,173`. Também fixam que não entra cor nova no `::backdrop`, e o teste não usa mais `toBeVisible`. O que falta está no bloqueante 2.
- **Correção 5 atendida.** A frase do número no cartão saiu da 10.2. A 9.0 ganhou "a conta de chamadas é a do sino" e a mutação do "em dia" na turma não lida.
- **Recomendações da rodada 2 que viraram texto:**
  - "recusa por limite" agora diz que não aparece "Tudo em dia";
  - a 12.0 testa que a web não manda `?anoLetivoId` e lê com `limite=100`;
  - a 10.0 cobre Atividades ou Alunos aberta e a aba escondida.
  - Só o caso da 10.0 abriu buraco (bloqueante 1).

Bloqueantes:

1. **`10_task.md:62`, cenário "sem painel, sem rota nominal": a parte "o `QueryCache` não tem linha por aluno" fica vermelha com o código certo.** É o mesmo defeito da correção 1, agora em Hoje.
   - Pelo próprio desenho (10.2 e Tech Spec §7b), Hoje lê `consultaSinais` ao abrir, porque é ela que dá a contagem do aviso de atenção humana.
   - A resposta dessa consulta traz `aluno: { id, nome }` em todo sinal, inclusive no de `atencao_humana` (`packages/shared/src/tutor/sinal.ts:26` e `:43`). Com `gcTime: 0`, ela fica no cache enquanto Hoje observa.
   - A 10.2 também se contradiz. Ela diz que só os "Sinais por aluno" e `consultaUsoDoTutor` esperam o painel, mas os "Sinais por aluno" vêm da mesma `consultaSinais`, que já foi lida ao abrir.
   - Correção exigida, uma de duas:
     - (a) Reescrever a asserção como: nenhum nome no **DOM**, e nenhuma consulta `CHAVE_DO_USO_DO_TUTOR` no cache. Corrigir a 10.2 para dizer que só `consultaUsoDoTutor` espera o painel e que os nomes dos sinais estão em memória, mas não na tela.
     - (b) Se o cache não deve ter nome com o painel fechado, desenhar uma leitura de Hoje que descarte o aluno antes do cache, como a contagem do sino. Aí o teste confere o conteúdo do cache, com mutação.

2. **`13_task.md:57`, cenário "nada legível atrás de 'Acesso gerado'": a mutação exigida na correção 4 (trocar o fundo opaco pelo `veu`) não está lá, e a única declarada só prova a caixa.**
   - "Tirar a classe de tela inteira" é pega pela asserção da caixa. Fica sem nenhuma mutação a asserção do alfa 1, que é metade da regra: uma tela inteira com fundo translúcido deixa a lista legível.
   - Há mais um motivo para essa mutação. O `<dialog>` já recebe `background-color: Canvas` do estilo padrão do navegador, então o alfa 1 pode passar sem a classe `fundo`. Só a troca por `veu` (ou por transparente), com a tela inteira mantida, prova que o teste morde.
   - A asserção do `document.elementFromPoint` não decide nada. Num diálogo aberto com `showModal`, o ponto fora da caixa cai no `::backdrop`, e o navegador devolve o próprio `<dialog>`. Se "de dentro do diálogo" inclui o próprio diálogo, o teste passa sem a tela inteira. Se exige um elemento filho, pode ficar vermelho com o código certo, quando o ponto cai em área vazia.
   - Correção exigida:
     - Declarar a segunda mutação: com a tela inteira mantida, trocar `fundo` por `veu` (ou transparente) deixa o e2e vermelho.
     - Dizer que o fundo lido é o do elemento que leva a classe (o `<dialog>`).
     - Tirar o `elementFromPoint`, ou defini-lo de um jeito que distinga as duas coisas. O par "caixa cobre a janela + alfa 1" já basta.

Recomendações:
- `10_task.md:62`: dizer como a aba fica escondida no jsdom, com `focusManager.setFocused(false)` restaurado no `afterEach`. O `refetchIntervalInBackground: false` é padrão do TanStack e não tem cláusula para mutar. Hoje, o caso de Atividades ou Alunos aberta também não tem mutação.
- Ainda abertas da rodada 2:
  - `1_task.md:71`: o e2e de permissão confere `/reivindicacoes` em geral, e o sino da coordenação da X2 pode dar falso vermelho. Restringir às rotas das turmas da professora.
  - `1_task.md:66`: provar o "em série" com `segurar` também no cenário das 14 turmas.
- `12_task.md`: o teste "sem `?anoLetivoId`, com `limite=100`" e o do aluno transferido não têm mutação declarada.
- As recomendações 1 e 2 do `frontend-reviewer` (rodada 4) afetam o teste da tela inteira:
  - a variante `inteira` do `Dialogo`, que hoje não está nos arquivos previstos;
  - o Voltar do navegador com "Acesso gerado" aberto.
  - Sem elas, a classe que a mutação tira não tem lugar definido.

Arquivos lidos:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/1_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/10_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/tasks/prd-telas-do-professor/13_task.md`
- o diff da `techspec.md`, `9_task.md`, `12_task.md`, `5_task.md`, `prd.md` e `tasks.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/apps/web/src/api/tutor-da-turma.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/packages/shared/src/tutor/sinal.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/packages/shared/src/assistente/entrega.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--revisao-x3-x4/apps/web/src/estilos.css`

## test-engineer · 4ª rodada · APROVADO · 2026-10-13 08:51:20 · `tasks/prd-telas-do-professor/revisao-spec.md`

VEREDITO: APROVADO

Cenários exigidos: as duas correções da 3ª rodada.
1. Em Hoje com o painel fechado, a asserção não pode ficar vermelha com o código certo. A 10.2 tem de bater com a §7b.
2. Em "Acesso gerado", a asserção do alfa 1 precisa de mutação própria. O fundo lido tem de ser o do `<dialog>`. O `elementFromPoint` sai. O `Dialogo.tsx` com a variante `inteira` entra em "Arquivos previstos".

Cobertos:

- **Correção 1, feita pela opção (a).**
  - `10_task.md:63` agora exige "nenhum nome de aluno no DOM, e nenhuma consulta `CHAVE_DO_USO_DO_TUTOR` no `QueryCache`". Diz também, por escrito, que os nomes dos sinais ficam na resposta de `consultaSinais`, fora da tela.
  - A asserção fica verde com o código certo e vermelha com a mutação "tirar a condição do painel": sem a condição, a consulta de uso sobe ao cache e a rota nominal é chamada. A chave existe em `apps/web/src/api/chaves-do-professor.ts`.
  - A 10.2 (`10_task.md:35-39`) agora diz que só a leitura de `consultaUsoDoTutor` espera o painel. Os "Sinais por aluno" saem da mesma `consultaSinais`, e o que espera o painel é mostrar os nomes.
  - A §7b (linhas 96-101 da Tech Spec) diz o mesmo: "da mesma `consultaSinais`, já lida", e `consultaUsoDoTutor` como "a única que espera o painel". A §10 (linha 164) fala em "sem nome no DOM" e "nenhuma rota nominal além dos sinais". Não sobrou contradição.
- **Correção 2, feita.**
  - `13_task.md:58` declara as duas mutações, cada uma vermelha sozinha:
    - tirar a classe de tela inteira, que a asserção da caixa pega;
    - com a tela inteira mantida, trocar `bg-fundo` por fundo transparente, que o alfa 0 pega nos dois temas.
  - O fundo lido é o do próprio `<dialog>`, o elemento que leva a classe.
  - O `elementFromPoint` saiu.
  - A explicação de por que o teste não passa sem a classe confere com a árvore:
    - no escuro, `estilos.css:169` põe `color-scheme: dark`, e o `Canvas` escuro do Chromium (#121212) difere de `--color-fundo` (#131f24, linha 173);
    - no claro, os dois são brancos, e a tarefa assume que só o escuro distingue.
  - A §9 (linha 154 da Tech Spec) bate com a 13.0.
  - O `Dialogo.tsx` com a variante `inteira` está em "Arquivos previstos" (`13_task.md:42`).

Bloqueantes: nenhum.

Recomendações:
- `10_task.md:69`, "fechar o painel solta os nomes": com a opção (a), os nomes dos sinais continuam em memória depois de fechar o painel. Vale escrever o que o e2e confere: os nomes saem da tela, e a consulta de uso sai do cache por `gcTime: 0`. Assim ninguém o lê como "nenhum nome em memória", que seria o mesmo defeito da correção 1.
- `13_task.md:42` promete que "Gerar" e "Acesso vigente" continuam em 560 px e que a troca de largura não anima. Nenhum cenário da tabela prova isso. Uma asserção de largura no passo "Gerar" fecharia a mutação de aplicar `inteira` em todos os passos.
- As recomendações das rodadas anteriores continuam como recomendação.
