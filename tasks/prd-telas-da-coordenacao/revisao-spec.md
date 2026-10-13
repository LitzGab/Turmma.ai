# Revisão de spec — telas-da-coordenacao

**Subagentes obrigatórios:** `test-engineer`, `frontend-reviewer`, `privacy-guardian`, `conformidade-reviewer`, `infra-guardian`, `tenancy-guardian`

> A rodada foi chamada da sessão que escreveu a spec, com o Joaquim dormindo e a decisão delegada (D80).

## Rodada 1 — 13/10/2026

**Veredito: REPROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 7 |
| `frontend-reviewer` | AJUSTES NECESSÁRIOS | 2 |
| `privacy-guardian` | REPROVADO | 1 |
| `conformidade-reviewer` | REPROVADO | 1 |
| `infra-guardian` | REPROVADO | 1 |
| `tenancy-guardian` | APROVADO | 0 |

Tamanho: PRD 1994 palavras · Tech Spec 1999 palavras (dentro do teto de 2.000).

### Correções exigidas na Tech Spec

- §5 "A fila" e §7c "Releitura", tarefa 1.0 e §10: a regra "não relê por tempo, foco nem reconexão" não tem teste, e `...consultaMateriais` herda o `refetchInterval` de 1,5 s (`api/material.ts:39`). Teste de componente com relógio falso, só o sino montado e um material `processando`: avançar mais de 10 s e disparar `focus` e `online` não faz chamada depois da primeira leitura; incidentes lidos uma vez por sessão; o Painel só relê ao abrir se passou de 5 min; a mutação (tirar `refetchInterval: false` ou `refetchOnWindowFocus: false`) deixa o teste vermelho (`infra-guardian`, `test-engineer`)
- §5 e §7c: o "Tentar de novo" da fila e dos blocos do Painel relê só as consultas que falharam, por chave exata, nunca por prefixo `CHAVE_DA_ESTRUTURA` ou `CHAVE_DA_PRIVACIDADE`; teste na 1.0 com o sino montado sobre a lista da turma e sobre Pedidos, fila `parcial`, clique em "Tentar de novo", zero chamadas a `/lista`, `/reivindicacoes` e `/v1/privacidade/pedidos`; mutação: voltar à releitura por prefixo (`privacy-guardian`)
- §5 "A fila", `montarFila` e tarefa 1.4/1.6: `completa: false` de `lerPaginas` em qualquer das cinco consultas vira `parcial` com "Parte da lista não carregou"; "turmas sem professor" não é calculada com vínculos incompletos; nunca "Tudo em dia" sem leitura completa (`frontend-reviewer`)
- §5 "A fila": turmas e vínculos só se leem com ano letivo em curso (sem ano, `/v1/turmas` responde como inexistente); teste de componente do sino e do bloco "Esperando você" sem ano letivo e com ano só `planejado` ou `encerrado`: nenhuma chamada (ou 404 como vazio), `pronta`, "Tudo em dia"; e2e `--vazia` olha o sino (`test-engineer`)
- §10, `montarFila` e painel do professor: cenários de vínculo encerrado ao lado de aberto (turma com encerrado e confirmado não é "sem professor"; só encerrado é "sem professor"; contestado e depois encerrado não gera item), e no `PainelDoProfessor` professor com um vínculo encerrado e outro aberto, com "Acrescentar turma" aceitando de novo a turma do encerrado (`test-engineer`)
- §5 "A fila", campo `contador`: um item por vínculo ou convite, sem `contador` nos tipos de professor; contador só em "turmas sem professor"; teste de unidade (professor com duas contestações e outro com uma dão três itens, nenhum com contador) e de componente do Painel (nenhum número ao lado de nome de professor); RF7 estendido aos itens e contadores da fila, no sino e no Painel; `id` do item único mesmo com a mesma contestação duas vezes e com homônimos (`test-engineer`, `frontend-reviewer`)
- PRD §4: reescrever "pendência por professor" para dizer o que é vedado (indicador de uso ou desempenho do professor; "provas a aprovar" e "sem chamada" por professor) e que convite vencido e contestação do vínculo são pendência da escola, já visível em Professores, sem ligar a adoção (D64) (`frontend-reviewer`, `conformidade-reviewer`). Isto mexe em texto do PRD, não em critério de aceite: o Arquiteto decide se aplica sozinho
- §5 "O sino" e §10, tarefa 1.0: caso de permissão. Âncora na `CascaDaEscola`, que professor e aluno também usam: nesses papéis, nenhum "Esperando você" da coordenação e nenhuma chamada a `/v1/vinculos`, `/v1/professores` ou `/v1/privacidade/incidentes` vinda do sino (`test-engineer`)
- Tarefa 2.0 e §6: e2e de troca de escola no Painel (números e fila de A não aparecem em B, nem enquanto B carrega) (`test-engineer`)
- Tarefa 10.0 e §12 premissa 3: o teste de "números não mudam com o filtro" precisa de rede falsa que devolva números diferentes na chamada filtrada, mais um e2e com `montarEscolaComEntregas` que prove a premissa no servidor; o `tenancy-guardian` e o `infra-guardian` confirmaram no código que `numeros()` não depende do filtro, então a marca de "não verificada" sai (`test-engineer`)
- §7b, §11, `docs/interface.md` 9.7 e tarefa 1.0 (onça dormindo no vazio do sino): ou (a) tirar a onça do vazio e usar texto ou ícone ilustrado, ou (b) manter, com: registrar na §7b e §11 que "sempre com nome e selo" vale para o avatar e a mascote de corpo inteiro só entra no vazio "Tudo em dia", fora de região com item ou texto de IA, sem anel de agente e sem o "z"; atualizar `docs/interface.md` 9.7 (pelo Arquiteto, na entrega, não nesta revisão); estender o teste de arquitetura da X1 sem afrouxar (`OncaDormindo` só importado por `componentes/sino/Sino.tsx`; `CabecaOnca` só por `AvatarAgente`); teste de componente na 1.0: `aria-hidden`, SVG sem `<title>`, dois renders iguais, nenhum temporizador, onça só com a fila lida e vazia (`conformidade-reviewer`). Mexe em desenho que já saiu da D80(3): se a escolha for (b), é do Joaquim ratificar a leitura

### Recomendações

- §7 (campos pessoais tocados): listar o complemento da contestação e os nomes de professor na coluna nova da lista da turma (`privacy-guardian`)
- §9: o título da aba nunca leva nome de pessoa (painel do professor, detalhe do pedido) (`privacy-guardian`)
- Vazio do sino com a escola recém-criada: link "Ver o que falta para a escola"; "Tudo em dia" não afirmar resolvido enquanto há pedido de titular com prazo correndo (`frontend-reviewer`, `conformidade-reviewer`)
- Sino: "atualizado às HH:MM" e "Atualizar" explícito, porque o incidente tem `staleTime: Infinity` (`frontend-reviewer`)
- Teto de linhas, "Mostrar mais" ou virtualização em Material, Pedidos e IA, com caso no e2e `chromebook` com CPU limitada (`frontend-reviewer`)
- 5.2 e 12.2: o link da linha fica na célula do nome, esticado por CSS, e o `Menu` é irmão dele; confirmação de excluir turma e disciplina nomeia o item (`frontend-reviewer`)
- Declarar alvo de toque (24 px, 44 px na ação principal) na galeria e no e2e `celular` (`frontend-reviewer`)
- §7c e §12: contar requisições, não consultas (cada `lerPaginas` pode ser até 10); registrar o limite padrão (120 por minuto por usuário) e fechar a premissa 4 (`frontend-reviewer`, `infra-guardian`)
- §6: o teste de troca de escola cobre as cinco chaves reais da fila, pelo nome, e cita `?material=`, `?painel=ano` e o endereço da lista da turma; painéis abertos pelo endereço procuram o id na lista já carregada, sem `GET /v1/materiais/:id` (`frontend-reviewer`, `tenancy-guardian`)
- Tarefa 10.0: `EXPLAIN` com `?estado=rejeitada` em escola com volume (`infra-guardian`)
- `TODO.md`: polling de 1,5 s da tela Material com ingestão esperando horas na fila de lote (`infra-guardian`)
- §7c: nenhuma ação nova invalida chaves além das de hoje (`infra-guardian`)
- Uma só função para "sem professor" (fila e `turmas-da-escola.ts`), com teste de que a contagem do sino é igual à do filtro "Sem professor"; um `tablist` em Registros e Privacidade; teste do "único botão cheio" em Turmas e Pedidos; asserção de "nada pisca" (`getAnimations()` vazio); fila que falha em parte também no Painel; RF24 com contagem de casos por comando (`test-engineer`)
- Convite vencido escrito como tarefa ("Refazer o convite de …"), e revogar tira o item; Agentes mantém nível de autonomia e selo "Alto risco" por escrito, e o seletor marca a IA suspensa; Professores sem coluna de último acesso ou de uso (`conformidade-reviewer`)

## Rodada 2 — 13/10/2026

**Veredito: REPROVADA**

Tamanho: PRD 1998 palavras · Tech Spec 2571 palavras (acima do teto, com aceite escrito no topo da Tech Spec, por delegação do Joaquim; não é bloqueante).

Chamados os cinco que reprovaram ou pediram ajuste na rodada 1; o `tenancy-guardian` aprovou e não foi chamado. As correções 1 a 11 da rodada 1 foram conferidas item por item: **todas atendidas**, exceto a de releitura (correção 1), cujo teste está desenhado de um jeito que não prova o foco nem a reconexão. Os dois outros bloqueios nascem de um texto novo, o "Atualizar" do sino, e de um caso que ficou só no sino.

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 3 |
| `frontend-reviewer` | APROVADO | 0 |
| `privacy-guardian` | REPROVADO | 1 |
| `conformidade-reviewer` | APROVADO | 0 |
| `infra-guardian` | REPROVADO | 1 |

### Correções exigidas na Tech Spec

- §7c "Releitura", §10 (linha "Componente"), §5 e tarefa 1.0 (cenário "o sino não relê", subtarefa 1.4): o teste avança só 10 s e depois dispara `focus` e `online`, mas o `staleTime` de 5 min mantém o dado fresco, e o TanStack só relê no foco ou na reconexão o que já venceu; as mutações `refetchOnWindowFocus: false` e `refetchOnReconnect: false` sobrevivem. Exigido: o caso tem dois tempos: (a) avançar 10 s ou mais com um material `processando` e provar zero chamadas (prova o intervalo); (b) avançar além de 5 minutos, para o dado ficar velho, disparar `focus` e `online` e provar zero chamadas em turmas, vínculos, professores e materiais. O §7c e a 1.4 nomeiam as três opções (`refetchInterval: false`, `refetchOnWindowFocus: false`, `refetchOnReconnect: false`); a 1.0 declara as três mutações, cada uma vermelha sozinha, com o tempo dela; o §10 ganha a mesma frase (`infra-guardian`, `test-engineer`)
- §5 "A fila", §7c (última frase) e tarefa 1.0 (subtarefas 1.3/1.4 e cenário "'Tentar de novo' não lê o que é auditado"): o botão "Atualizar" e o "Atualizado às HH:MM" do sino entraram nesta rodada sem regra de chave nem teste; feito do jeito óbvio (`invalidateQueries` do prefixo `CHAVE_DA_ESTRUTURA` ou `CHAVE_DA_PRIVACIDADE`), relê a lista de nomes ou os pedidos de titular e grava `turma.lista_lida` ou `pedidos.listados` sem a coordenação pedir (regra 20, item 10; PRD §6). "Nenhuma ação nova invalida chaves além das de hoje" não protege, porque esses prefixos já são chaves de hoje. Exigido: o "Atualizar" relê só os cinco observadores da fila, cada um pela chave exata, nunca pelo prefixo; entra nas subtarefas 1.3 ou 1.4 junto do "Atualizado às"; o cenário do "Tentar de novo" é estendido ao clique em "Atualizar", com o sino montado sobre a lista da turma e sobre Pedidos, zero chamadas a `/lista`, `/reivindicacoes` e `/v1/privacidade/pedidos`; "Atualizado às" só muda depois do clique, sem temporizador; mutação declarada: o "Atualizar" passa a invalidar por prefixo e o teste fica vermelho. Alternativa aceita: tirar o "Atualizar" do §7c, porque era recomendação da rodada 1 (`privacy-guardian`, `test-engineer`, `infra-guardian` como recomendação)
- Tarefa 2.0 (tabela de testes) e e2e `--vazia` do Painel: o caso "sem ano letivo" da correção 2 foi feito no sino, mas não no bloco "Esperando você" do Painel; a demonstração começa por uma escola vazia (D71) e o Painel pode mostrar "Parte da lista não carregou" ali. Exigido: um caso de componente na 2.0, sem ano e com o ano só `planejado` ou `encerrado`: nenhuma chamada a turmas e vínculos, e o bloco diz "Tudo em dia"; o e2e `--vazia` do Painel confere o mesmo texto no bloco (`test-engineer`)

### Recomendações

- PRD RF4: "Tudo em dia, só com as cinco leituras completas" contradiz a §5 (sem ano letivo, "Tudo em dia" com três leituras); alinhar o texto, porque quem seguir o RF4 ao pé da letra quebra o teste do bloqueante 3 (`test-engineer`)
- Lista truncada: a 1.0 suprime "turmas sem professor" com `completa: false` em qualquer das cinco listas e a §5 só com vínculos incompletos; alinhar (turmas ou vínculos incompletos), com um caso de unidade para cada e a prova de que material truncado ainda mostra as turmas (`test-engineer`); repetir `completa: false` na subtarefa 1.4 do `tasks.md:16` (`frontend-reviewer`)
- Teste "tipos fechados" da 1.0: acrescentar asserção de que nenhuma entrada de `montarFila` deriva de uso, entrega ou atividade do professor (`frontend-reviewer`)
- Observadores do Painel (séries, disciplinas, resumo, consumo, funções): declarar `staleTime` de 5 min e nenhuma releitura no foco, como na fila; fechar a premissa 4 do §12 na 2.0 com a conta real (cinco consultas da área mais cinco do Painel, cada `lerPaginas` com até 10 páginas) (`infra-guardian`)
- Cenário do "Tentar de novo" cobre também a fila em `erro`; mutação para o "por chave exata" do Painel; tarefa 9.4: abrir ou fechar a coluna "Professores da turma" não relê `/lista` (`privacy-guardian`)
- `tasks/prd-telas-da-coordenacao/11_task.md` linha 16 diz que "Alto risco" por função "não entram", contra a §7b e o e2e de hoje (`e2e/governanca.spec.ts:163-164`); reescrever (fora fica só o selo amarelo do mockup com "Pausar") e pôr o selo de autonomia e "Alto risco" na 11.3 e na tabela de testes (`conformidade-reviewer`)
- `docs/interface.md:989` e `:1366` ainda dizem que a pose "Dormindo" nasce na X2; trocar por "decisão do Joaquim (Tech Spec da X2, §12)"; `mockup.md:466` e `:113`: anotar que onça no sino e onça apontando no "O que falta" não entram; §7b: trocar "nenhum outro arquivo importa a cabeça da onça" por "nada fora de `AvatarAgente` importa a pasta `componentes/onca/`" (`conformidade-reviewer`)
- Revogar o convite também tira o item do sino, com caso de teste na 1.0; texto do item de convite neutro, sem "não aceitou" (`conformidade-reviewer`)
- "Ver o que falta para a escola" no vazio do sino sem linha de teste e só com passo pendente; "Mostrar mais" em Material, Pedidos e IA nas tarefas 8.0, 10.0 e 12.0, com material com falha e pedido com prazo correndo antes do corte; `toHaveTitle` sem nome de pessoa no `?professor=` e no detalhe do pedido; dizer como o e2e segura a resposta de B (`page.route`) em "nem enquanto B carrega" e limpar a frase da §6; e2e de "Acrescentar turma de novo" na 7.0 (`test-engineer`)
- As recomendações da rodada 1 que seguem em aberto (função única de "sem professor", `tablist` único, "único botão cheio", `getAnimations()`, RF24 com contagem por comando, EXPLAIN na 10.0, TODO do polling de 1,5 s) continuam valendo e entram como subtarefa ou cenário em `criar-tasks`

## Rodada 3 — 13/10/2026

**Veredito: REPROVADA** (um bloqueante, de um revisor com veto)

Tamanho: PRD 1999 palavras · Tech Spec 2713 palavras (acima do teto, com aceite escrito no topo da Tech Spec, por delegação do Joaquim; não é bloqueante).

Chamados só os três que reprovaram na rodada 2: `test-engineer`, `privacy-guardian` e `infra-guardian`. Os outros três aprovaram e não foram chamados; a tabela traz a última rodada de cada um. As três correções da rodada 2 foram conferidas item por item e **estão todas atendidas** no texto: o caso "o sino não relê" em dois tempos com as três opções e as três mutações; o "Atualizar" do sino pela chave exata, com cenário e mutação; o caso "sem ano letivo" no bloco "Esperando você" do Painel. O que sobra é o **gatilho** do tempo (b): como está escrito ("disparar `focus` e `online`"), não dispara nada no TanStack instalado, e o texto repete a redação da correção que os próprios revisores deram na rodada 2.

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | APROVADO (rodada 3) | 0 |
| `frontend-reviewer` | APROVADO (rodada 2) | 0 |
| `privacy-guardian` | APROVADO (rodada 3) | 0 |
| `conformidade-reviewer` | APROVADO (rodada 2) | 0 |
| `infra-guardian` | REPROVADO (rodada 3) | 1 |
| `tenancy-guardian` | APROVADO (rodada 1) | 0 |

### Correções exigidas na Tech Spec

- §7c "Releitura", §10 (linha "Componente") e tarefa 1.0 (linha "o sino não relê", tempo (b)) e, por coerência, 1.4: o gatilho do foco e da reconexão não faz o TanStack reler, e as mutações `refetchOnWindowFocus: false` e `refetchOnReconnect: false` sobrevivem. Em `@tanstack/query-core` 5.102.8 o `focusManager` escuta só `visibilitychange` (`focusManager.ts:23`), então um evento `focus` na `window` não chega à consulta; o `onlineManager` só avisa quando o estado muda (`onlineManager.ts:55-57`) e a aba já começa online, então um `online` sozinho não muda nada. Exigido: no tempo (b), o foco passa a ser `focusManager.setFocused(false)` seguido de `setFocused(true)` (ou um `visibilitychange`), e a reconexão `onlineManager.setOnline(false)` seguido de `setOnline(true)` (ou `offline` e depois `online`); o teste restaura os dois gerenciadores no `afterEach`; o padrão, com o "controle" que prova que a mesma consulta relê com a opção ligada, já existe em `apps/web/src/api/privacidade.test.ts:40-41`, `:58-61` e `:69-84`; ajustar a frase do §7c, a do §10 e a linha da `1_task.md` (`infra-guardian`; o `test-engineer` apontou o mesmo ponto como recomendação)

### Recomendações

- Tempo (b): contar também a consulta de anos letivos, ou exigir "zero chamadas" em geral, porque o observador de anos usa as mesmas opções (`infra-guardian`)
- `2_task.md`, linha "quando relê" ("nenhuma releitura no foco"): usar o mesmo gatilho do `focusManager`, senão o caso do Painel cai na mesma armadilha (`infra-guardian`, `test-engineer`)
- §5: uma frase sobre o "Atualizar", para a regra da chave exata ficar num lugar só (hoje está só na §7c) (`test-engineer`)
- `tasks.md` 1.6 ("nem por tempo, foco ou retry") não cita o "Atualizar"; PRD RF5 poderia dizer que o sino relê só no "Atualizar", por clique e pela chave exata; `tasks.md` 9.4 ("lidos só no 'Atualizar'") lê como se os professores também esperassem o clique, e a `9_task.md` está certa: alinhar a frase (`privacy-guardian`)
- Tarefa 2.0: declarar uma mutação para o "por chave exata" do Painel; tarefa 9.0: teste de que abrir ou fechar a coluna "Professores da turma" não relê `/lista` (`privacy-guardian`)
- Fechar a premissa 4 do §12 (requisições contra `LIMITE_REQ_USUARIO_MIN`) na 2.0, com a conta real, e declarar `staleTime` de 5 min e nenhuma releitura no foco nos observadores do Painel (`infra-guardian`)
- Seguem da rodada 2, para `criar-tasks`: alinhar o RF4 com a §5; "turmas ou vínculos incompletos" na lista truncada; "Ver o que falta" e "Mostrar mais" com teste; `toHaveTitle` sem nome de pessoa; papel "de professor" em "sem professor"; como o e2e segura a resposta de B (`page.route`); e2e do "Acrescentar turma de novo" (`test-engineer`)

## Rodada 4 — 13/10/2026

**Veredito: APROVADA**

Tamanho: PRD 1999 palavras · Tech Spec 2783 palavras (acima do teto, com aceite escrito no topo da Tech Spec, por delegação do Joaquim; não é bloqueante).

Chamado só o `infra-guardian`, único que reprovava na rodada 3. A correção exigida foi conferida nos quatro pontos e **está atendida**: no tempo (b) do teste "o sino não relê", o foco passa a ser `focusManager.setFocused(false)` e depois `setFocused(true)`, e a reconexão `onlineManager.setOnline(false)` e depois `setOnline(true)`; o texto diz que um `focus` na janela ou um `online` solto não servem; os dois gerenciadores são restaurados no `afterEach`, com o caso de controle de `apps/web/src/api/privacidade.test.ts`; cada mutação (`refetchOnWindowFocus: false`, `refetchOnReconnect: false`) fica vermelha sozinha. Conferido na versão instalada de `@tanstack/query-core`: `setFocused` e `setOnline` só avisam quando o estado muda, então a sequência exigida dispara a releitura. A §7c, a §10 (linha "Componente"), a linha "o sino não relê" do `1_task.md` e a linha "quando relê" do `2_task.md` estão alinhadas, e a recomendação de contar a consulta de anos letivos também entrou.

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | APROVADO (rodada 3) | 0 |
| `frontend-reviewer` | APROVADO (rodada 2) | 0 |
| `privacy-guardian` | APROVADO (rodada 3) | 0 |
| `conformidade-reviewer` | APROVADO (rodada 2) | 0 |
| `infra-guardian` | APROVADO (rodada 4) | 0 |
| `tenancy-guardian` | APROVADO (rodada 1) | 0 |

### Correções exigidas na Tech Spec

Nenhuma.

### Recomendações

- `2_task.md`, linha "quando relê": incluir também a volta da rede (`onlineManager.setOnline(false)` e depois `setOnline(true)`) e a mutação `refetchOnReconnect: false`; hoje o Painel só prova o foco, e a §7c manda as mesmas opções para os blocos dele (`infra-guardian`)
- Seguem da rodada 3, para `criar-tasks`: uma frase sobre o "Atualizar" na §5; alinhar `tasks.md` 1.6 e 9.4 e o RF5 do PRD; mutação do "por chave exata" do Painel na 2.0 e teste de que abrir a coluna "Professores da turma" não relê `/lista` na 9.0; fechar a premissa 4 do §12 na 2.0 com a conta real e declarar `staleTime` de 5 min nos observadores do Painel (`infra-guardian`, `privacy-guardian`, `test-engineer`)
- Seguem das rodadas 2 e 3: alinhar o RF4 com a §5; "turmas ou vínculos incompletos" na lista truncada; "Ver o que falta" e "Mostrar mais" com teste; `toHaveTitle` sem nome de pessoa; papel "de professor" em "sem professor"; como o e2e segura a resposta de B (`page.route`); e2e do "Acrescentar turma de novo" (`test-engineer`)

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-13 02:19:23 | 2026-10-13 02:20:49 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | afac31ca5cb9e16e2 |
| 2026-10-13 02:19:34 | 2026-10-13 02:21:01 | `tenancy-guardian` | 1 | APROVADO | a8328e8797b6c793d |
| 2026-10-13 02:19:25 | 2026-10-13 02:21:44 | `privacy-guardian` | 1 | REPROVADO | a6999e3a020c218b8 |
| 2026-10-13 02:19:31 | 2026-10-13 02:22:05 | `infra-guardian` | 1 | REPROVADO | a4e3c664b9cbca340 |
| 2026-10-13 02:19:21 | 2026-10-13 02:22:41 | `test-engineer` | 1 | REPROVADO | a407037588b7c714d |
| 2026-10-13 02:19:28 | 2026-10-13 02:23:44 | `conformidade-reviewer` | 1 | REPROVADO | a364881206c4789d5 |
| 2026-10-13 02:30:18 | 2026-10-13 02:30:39 | `frontend-reviewer` | 2 | APROVADO | aa00d5143ff8eb550 |
| 2026-10-13 02:30:24 | 2026-10-13 02:31:15 | `privacy-guardian` | 2 | REPROVADO | a486bed27fa03c5e4 |
| 2026-10-13 02:30:40 | 2026-10-13 02:31:44 | `infra-guardian` | 2 | REPROVADO | afb1f22191bf56ee4 |
| 2026-10-13 02:30:33 | 2026-10-13 02:32:30 | `conformidade-reviewer` | 2 | APROVADO | a7d0f3ea03179897a |
| 2026-10-13 02:30:12 | 2026-10-13 02:32:35 | `test-engineer` | 2 | REPROVADO | a65283a0acca35fbb |
| 2026-10-13 02:35:06 | 2026-10-13 02:36:04 | `privacy-guardian` | 3 | APROVADO | a8a103c85f0099cd4 |
| 2026-10-13 02:35:12 | 2026-10-13 02:36:10 | `infra-guardian` | 3 | REPROVADO | af4296ba41189eb11 |
| 2026-10-13 02:35:00 | 2026-10-13 02:36:14 | `test-engineer` | 3 | APROVADO | aacbd0c0099159e77 |
| 2026-10-13 02:37:29 | 2026-10-13 02:37:50 | `infra-guardian` | 4 | APROVADO | a4392be56c565234f |
