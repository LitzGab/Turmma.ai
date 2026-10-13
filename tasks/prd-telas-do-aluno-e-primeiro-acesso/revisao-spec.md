# Revisão de spec — telas-do-aluno-e-primeiro-acesso

**Subagentes obrigatórios:** `test-engineer`, `frontend-reviewer`, `privacy-guardian`, `conformidade-reviewer`, `tenancy-guardian`, `infra-guardian`

## Rodada 1 — 13/10/2026

**Veredito: REPROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 5 (escola sem ano em curso; vínculo encerrado × RF12; cláusula `id = <contexto>` sem teste; texto do aviso e RF13/RF14 sem asserção; RF11 no passo 4 e RF12 em contexto novo) |
| `frontend-reviewer` | AJUSTES NECESSÁRIOS | 1 (estados da `BemVindo`) |
| `privacy-guardian` | REPROVADO | 1 (texto do aviso de privacidade promete o que o sistema não faz) |
| `conformidade-reviewer` | REPROVADO | 3 (rosto da onça nas poses; comemoração fora da entrega; falas sem a regra 70, item 4a) |
| `tenancy-guardian` | REPROVADO | 1 (escrita só no próprio registro sem prova) |
| `infra-guardian` | REPROVADO | 1 (custo do `tutor/conversa` no Início e cenário de carga) |

Tamanho: PRD 1.998 palavras · Tech Spec 1.999 palavras (no limite de 2.000; as correções vão estourá-lo, então o topo precisa de aceite escrito ou a Tech Spec precisa enxugar).

### Correções exigidas na Tech Spec
- §3 e tarefa 1.0 (vínculo encerrado × RF12): a data emprestada de outra escola deixa a linha da escola atual nula; quando o vínculo de A termina, a introdução reabre em B, o que contradiz o RF12 e o PRD §7. Decidir e escrever uma de três saídas: o GET com data emprestada grava na linha da própria sessão (com `coalesce`, no próprio escopo); o usuário desativado da mesma conta também empresta; ou o PRD aceita que reabre. Teste "marca em A, A desativada, `/v1/eu` em B" com o comportamento declarado (`test-engineer`; relacionado ao desenho do `tenancy-guardian`).
- §6, §10 e tarefa 1.0 (escrita só no próprio registro): teste de integração com dois usuários da mesma escola e do mesmo papel (dois alunos da mesma turma; dois professores): um faz o POST, a linha do outro continua nula e o `/v1/eu` do outro devolve `introducaoVistaEm: null`. A tarefa declara como mutação a retirada de `id = <contexto>` e o teste fica vermelho com ela (`tenancy-guardian`, `test-engineer`).
- §6, §10 e tarefa 1.0 (escola sem ano letivo em curso): casos de integração, no molde de `sessao-guarda.int.test.ts:199` e `:220`, com a escola sem ano em curso e com a escola entre anos (um encerrado, um planejado): POST responde 200 e grava, GET devolve a data. A escrita usa `identidadeDaRequisicao()`, nunca `sessaoDaRequisicao()` nem `exigirAnoEmCurso()` (`test-engineer`).
- §7b, RF14 do PRD e tarefa 9.1 (aviso de privacidade): trocar "notas aprovadas" por "o resultado das tarefas" (não existe `Nota`, D46); trocar "o que você estudou com o Tutor" por "o que você escreve para o Tutor e o que ele responde"; acrescentar frase de prazo, vinda do prazo da escola em `GET /v1/privacidade/retencao` ou dizendo que a escola escolhe (varia de 6 a 24 meses); acrescentar que o que o aluno escreve ao Tutor passa por um programa de IA de uma empresa que trabalha para a escola; acrescentar que quem dá a aula vê as tarefas e o resultado. O teste de unidade da RF14 exige as frases de guarda, prazo e compartilhamento e recusa "nota" (`privacy-guardian`).
- Tarefa 9.0, tabela (texto do aviso): uma asserção por elemento do RF13 e do RF14 em `textos-da-introducao.test.ts` e `aviso-de-privacidade.test.ts`, incluindo "o Tutor é um programa e pode errar" no passo 1, "o que guardamos", "quem vê" (coordenação em números, com registro, e colegas não) e "como pedir os dados"; os três primeiros passos com `obrigatorio: true` (`test-engineer`).
- Tarefa 9.0 (RF11 e RF12): casos para o passo 4: seguir ou pular sem escolher deixa o `localStorage` vazio; escolher "Maior" ali aplica na hora e fica guardado; a introdução com "Maior" a 360 px não rola de lado. A segunda entrada acontece em `browser.newContext()`, com o armazenamento sem marca da introdução ("em nenhum computador") (`test-engineer`).
- §9 ("Peças novas"), §5 ("Rever"), tarefas 9.5, 10.3 e 11.3 (estados da `BemVindo`): declarar o que a `BemVindo` mostra enquanto lê `/v1/eu` (sem botão decidido pelo modo, "Sair" já à vista), o erro com `EstadoErro` e "Tentar de novo" e um caminho de volta, o modo padrão quando a data é desconhecida, e a linha "quatro estados da `BemVindo`" nas tabelas de teste das três tarefas. "Sair" nunca fica mais difícil que entrar (D59) (`frontend-reviewer`).
- §7c e §9 (carga do Início): declarar o custo por carga do `GET /v1/tutor/conversa?limite=1` no Início (a contagem de `mensagem_tutor` da turma desde o dia 1º do mês, com `not exists` contra `execucao_agente`, cresce com o fim do mês), com o `EXPLAIN` no volume de fim de mês (35 alunos, cerca de 20 trocas por dia, 20 dias), ou trocar a fonte do "Hoje: N de 60" e da pausa por leitura que não conte o mês da turma. Ajustar `infra/k6/login-7h30.js` para que o aluno, depois do login, faça `/v1/eu`, a primeira página de `minhas-atividades` e `tutor/conversa?limite=1`, e pôr o cenário na tabela da §10. Declarar `staleTime` e `refetchOnWindowFocus` das leituras do Início e de Eu (`infra-guardian`).
- RF19 do PRD, §9 e tarefa 5.0 (rosto da onça): fixar que as três poses usam o mesmo rosto neutro da cabeça da X1 e só o corpo muda (D80, item 3); teste de componente que compara o rosto de cada pose com o rosto neutro (`conformidade-reviewer`).
- RF19, §13 e tarefa 5.0 (comemoração): o fim da introdução usa acenando e apontando e fica parado, sem `Comemoracao` (D80, item 7a; `docs/interface.md` 9.7). Tirar a frase da §13 sobre o fim da introdução. Teste de arquitetura: a pose `comemorando` só é desenhada pela `Comemoracao`, e a `Comemoracao` só é importada por `areas/aluno/Atividade.tsx` (`conformidade-reviewer`).
- RF19 e §7b (falas, regra 70 item 4a, D58): as falas são texto fixo em `.ts`, e nenhuma varia com presença, ausência, acerto ou tempo de uso. O teste de unidade dos textos dos três papéis reprova afirmar ser pessoa, professor ou amigo; prometer voltar, esperar ou estar sempre ali ("Amanhã eu volto" do mockup); termos de vínculo ou saudade. A fala do passo 1 do aluno diz que o Tutor é um programa, com teste (`conformidade-reviewer`).
- Tamanho: com as correções, a Tech Spec passa de 2.000 palavras; pôr o aceite escrito no topo ou enxugar (skill, passo 1).

### Recomendações
- Tarefa 1.0: o caso "a eliminação agendada não empresta"; pré-gravar data antiga conhecida para matar a mutação do `coalesce`; resposta do POST igual ao valor do GET (a mais antiga), com teste; caso com datas nas duas escolas; sessão de rede recusada; `matriz.expectativa.ts` na lista de arquivos; "outra conta, na mesma escola ou em outra, com a data gravada, não empresta a data".
- §4: `rede` recebe `eu.concluir_introducao: 'nunca'` explícito; POST sem linha achada responde `NAO_AUTENTICADO`, como `EuService.obter`.
- §3: para o aluno (`conta_id` nulo) a data é só a da própria linha; reescrever a justificativa do `@SemEscopo` do `acessosDaConta` citando a data, o filtro por mesmo papel e que ela não sai em `acessos`; escrever na `0037` a nota "só expande" da `0035`.
- Minimização: o `/v1/eu` pode devolver `introducaoVista` booleano em vez da data (evita levar à escola A o horário da entrada na B).
- Finalidade "mostrar que o aviso foi apresentado": ou se guarda a versão do aviso, ou se tira essa finalidade e fica só "não repetir". Base legal "execução de contrato" na tarefa 1.5.
- Arquivo do titular, versão `coordenacao`: decidir e testar se `introducao_vista_em` do professor entra (D64, quase sinal de adoção).
- Tarefa 7.1: o filtro dos `sinais` tem de ser na `queryFn`, não no `select`, para não ir ao cache. "Como estou indo" mostra os 50 mais recentes (dizer) ou ganha paginação. Nomear o teste do aluno transferido para a memória (`tutor.int.test.ts:815` cobre só a conversa).
- Seção 7: aluno sem turma recebe `NAO_ENCONTRADO` de `tutor/conversa`; o Início trata como "sem uso", não como erro com "Tentar de novo".
- Tarefa 3.2: saudação fixa, sem "de volta" nem "faz tempo", com teste; uso do dia lido como limite ("Você pode fazer até 60 perguntas hoje; já fez N"); "Sair" com o mesmo tamanho dos vizinhos (RF3); `href` do "Pedir ajuda ao Tutor" afirmado.
- Tarefa 7.2: linha "Achou algo errado? Fale com quem dá a aula." como caminho de contestação até o F9 (regra 70, item 4d).
- Tarefa 8.4/9.5: provar a letra Maior também na `BemVindo`; botão "Voltar" entre passos do mesmo peso; comemoração com `role="status"` e destino do foco declarado (6.2/6.3); registrar o carregando do desvio em `Inicio.tsx` para não piscar nem usar `['eu']` velho após POST que falhou; cache sem data falsa depois do POST que falha.
- Tarefa 11.1: o passo 2 pode dizer que a conversa do professor com o Assistente nunca é visível à coordenação (regra 70, item 8).
- Registrar `educa.letra` no `docs/lgpd.md` (não é dado pessoal, e por quê) e testar que a chave nunca vai em requisição.
- PRD: dizer que o aluno com usuário em duas escolas, sem conta, vê a introdução nas duas.
- Fora da spec, `TODO.md`: `orcamento.consultar` e `usoDeHoje` contam as trocas do dia duas vezes na mesma requisição de `tutor/conversa`.

## Rodada 2 — 13/10/2026

**Veredito: REPROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 2 (PRD RF12 e §7 prometem mais do que a saída entrega; escrita do GET sem teste de `id = <contexto>`) |
| `frontend-reviewer` | APROVADO | 0 |
| `privacy-guardian` | REPROVADO | 1 (frase do prazo no aviso: "6 a 24 meses" vale só para a conversa do Tutor) |
| `conformidade-reviewer` | APROVADO | 0 (B1, B2 e B3 atendidos) |
| `tenancy-guardian` | REPROVADO | 2 (GET grava em B o valor de A; escrita do GET sem prova de escopo) |
| `infra-guardian` | REPROVADO | 1 (seed da carga não deixa o cenário do k6 exercer `minhas-atividades`) |

Tamanho: PRD 1.997 palavras · Tech Spec 3.009 palavras (acima do teto, com o aceite escrito no topo da Tech Spec).

### Correções exigidas na Tech Spec

1. **Tech Spec §3 ("Primeira saída"), §12b item 1, tarefa 1.2 e caso "duas escolas" da 1.0 (o que o GET grava)** (`tenancy-guardian`; `privacy-guardian` como recomendação): o GET grava em B o valor lido da linha de A, que é dado da escola A persistido no tenant B. Ele sobrevive ao fim do vínculo e ao expurgo de A, entra no arquivo do titular de B e, se anterior à criação do usuário em B, revela outro vínculo. Correção exigida: "a gravação do GET usa `coalesce(introducao_vista_em, now())`, a mesma instrução do POST, e nunca o valor emprestado. O GET continua respondendo a mais antiga enquanto A está ativa." Teste: pré-gravar uma data antiga conhecida em A, ler `/v1/eu` em B e verificar que a linha de B fica não nula e diferente da data de A. Mutação: gravar o valor emprestado no lugar de `now()` deixa o teste vermelho.
2. **Tech Spec §6 e §10; tarefa 1.0, casos "só a própria linha" e "duas escolas", seção "Mutações" (escopo da escrita do GET)** (`tenancy-guardian` e `test-engineer`): o caso dos dois usuários da mesma escola usa só o POST; a escrita do GET nunca dispara nele. Se o GET usar instrução própria e perder `id = <contexto>`, a professora de A e B, ao abrir `/v1/eu` em B, marca todos os usuários de B (alunos inclusive), e nenhum teste previsto fica vermelho. Correção exigida: na 1.2, declarar que o GET chama o mesmo método de repository do POST, com a data como parâmetro; acrescentar o caso de integração "a professora de A e B, mais um colega (aluno e professor sem conta em A) da mesma escola B sem data: ela marca em A e lê `/v1/eu` em B; a linha do colega fica nula e o `/v1/eu` dele devolve nulo"; e pôr na lista de mutações obrigatórias o bloco "tirar `id = <contexto>` da escrita do GET", apontando para esse caso.
3. **PRD RF12 e §7, Tech Spec §6, §12b item 1 e tarefa 1.0 (linha "vínculo encerrado")** (`test-engineer`): o PRD promete "uma vez só, mesmo se o vínculo de uma delas terminar" e "nem o fim de um vínculo a reabrem", mas a saída escolhida declara o contrário para um caso (quem não abriu `/v1/eu` em B antes do fim do vínculo de A vê a introdução de novo), e o próprio teste vai afirmar isso. Correção exigida, uma das duas: pôr a ressalva no RF12, no §7 do PRD e na §12b ("desde que a pessoa tenha entrado na outra escola enquanto o vínculo estava ativo"); ou fazer o vínculo desativado da mesma conta também emprestar a data e trocar o teste. (Atenção: a correção 1 impede o "empréstimo" do valor de A; a ressalva vale igual com `now()`.)
4. **Tech Spec §7b, PRD RF14 e tarefa 9.1 (frase do prazo) e linha "texto do aviso" da 9.0** (`privacy-guardian`): "A escola escolhe por quanto tempo guarda: de 6 a 24 meses." vem depois de nome, matrícula, tarefas e resultado, e diz que tudo some em até 24 meses; isso vale só para a conversa e os sinais do Tutor (`conversa_tutor`, `sinal_tutor`). A tarefa e o resultado ficam 12 meses depois do fim do ano letivo (de 6 a 60); nome e matrícula, 60 meses depois da desativação (de 12 a 60), conforme `docs/lgpd.md`. Correção exigida: "prender o intervalo à conversa, por exemplo: 'A conversa com o Tutor fica de 6 a 24 meses; a escola escolhe.' Para as tarefas, uma frase sem número: 'Suas tarefas ficam pelo tempo que a escola escolhe.'" O teste da RF14 tira o piso e o teto de `CATEGORIAS_DE_RETENCAO.conversa_tutor`, sem número escrito à mão, e recusa que o intervalo apareça numa frase sem "Tutor". Mesmo ajuste no PRD RF14 e na §7b.
5. **Tech Spec §7c ("Métrica, alerta, teste de carga"), §10 ("Carga") e tarefa 3.1 (seed da carga)** (`infra-guardian`): o seed de `infra/scripts/carga-login.ts` (`semearContas`, `criarEscola`) cria as escolas sem ano letivo e 680 alunos por escola sem turma nem vínculo; `GET /v1/minhas-atividades` passa por `exigirAnoEmCurso()` e responde `NAO_ENCONTRADO`, então a rajada toda responde 404 e soma em `respostas_inesperadas` (ou o cenário mede o caminho vazio). "Conferir se as contas têm aluno" não basta. Correção exigida, declarar na §7c, na §10 e na 3.1: o seed da carga ganha ano letivo em curso nas três escolas, com turmas de 35 e vínculo de aluno `confirmado` para as contas de aluno da rajada; cada turma recebe atividades aplicadas em número que encha a primeira página, algumas com tentativa e resposta do aluno, para pesar as subconsultas `respondidas` e `comDiagnostico`; o k6 exige 200 com página não vazia em `minhas-atividades` e 200 em `/v1/eu`, contados em `respostas_inesperadas`, com o limite do p95 das autenticadas valendo na rajada.

### Recomendações
- Tarefa 1.0, "vínculo encerrado": escrever a ordem por inteiro ("marca em A → `/v1/eu` em B → A desativada → `/v1/eu` em B devolve a data") e separar o caso que sobra num teste próprio (marca em A, desativa A sem GET em B, GET em B volta nulo) (`test-engineer`).
- Tarefa 1.0: caso de B sem ano em curso com a professora de A entrando (a gravação do GET sem `exigirAnoEmCurso()`); tarefa 3.0, linha do k6: dizer que as contas da rajada incluem aluno com a introdução já vista (`test-engineer`).
- Tarefa 7.0: nomear o teste do aluno transferido para a memória do Tutor (`tutor.int.test.ts:815` cobre só a conversa) (`test-engineer`, ainda da rodada 1).
- Corrida do GET declarada na §7c: duas abas logo depois do login e GET em B ao mesmo tempo que POST em B; o `coalesce` mantém a primeira data e o GET responde a mais antiga; caso `Promise.all` com dois GET na 1.0; mutação do `coalesce` do GET separada da do POST se as instruções forem duas; dizer o que acontece se a gravação do GET falhar (falha inteira, ou devolve a data sem gravar) (`infra-guardian`).
- `acessosDaConta` com a data quebra o `escolher` do login: `conclusao-de-login.ts:52` repassa o resultado inteiro e `esquemaAcessoDaConta` é `.strict()` (`packages/shared/src/sessao/eu.ts:9-11`). Ou um método próprio `@SemEscopo` que já filtre por papel na query e devolva só a data mais antiga (terceira exceção do módulo, regra 10 item 9: registrar a justificativa), ou um `map` explícito em `conclusao-de-login.ts`, que entra nos arquivos da 1.0; com teste de que a resposta de `escolher` não leva a data. O filtro de mesmo papel vai no SQL, não no service (`tenancy-guardian`).
- Minimização: devolver `introducaoVista` booleano em `/v1/eu` em vez da data (`tenancy-guardian`, `privacy-guardian`, desde a rodada 1).
- Aviso: o Tutor também manda ao modelo as habilidades a rever (`memoriaDoTrabalho`, `tutor.service.ts:213`); dizer no aviso ou na tela de Privacidade (`privacy-guardian`).
- Registrar `educa.letra` no `docs/lgpd.md` e testar que a chave não vai em requisição (tarefa 8.1) (`privacy-guardian`, da rodada 1).
- Tarefa 6.0: pôr o texto da `Comemoracao` no teste de falas da regra 70 item 4a; tarefa 5.2: tipar `pose` da `Introducao` como `Exclude<Pose, 'comemorando'>`; tarefa 10.1: passo do professor dizer que a conversa com o Assistente nunca é visível à coordenação, ou registrar em "Recomendações sem aplicar"; tarefa 3.2: nenhum texto do Início promete que o Tutor está disponível (`conformidade-reviewer`).
- Início com zero tarefas: a frase de vazio diz que o Tutor ajuda quando houver tarefa; provar "Fechar" em todo passo no modo revendo com `/v1/eu` do cache e depois de erro seguido de "Tentar de novo" (`frontend-reviewer`).
- Fora da spec, `TODO.md`: `orcamento.consultar` e `usoDeHoje` contam as trocas do dia duas vezes na mesma requisição de `tutor/conversa` (`infra-guardian`, ainda sem registro).

## Rodada 3 — 13/10/2026

**Veredito: REPROVADA** (dois bloqueantes, os dois de texto: uma contradição entre documentos e um limite de carga que o texto não fixa)

| Revisor | Última rodada | Veredito | Bloqueantes |
|---|---|---|---|
| `test-engineer` | 3ª | APROVADO | 0 (correções 1 e 2 da rodada 2 atendidas) |
| `frontend-reviewer` | 2ª | APROVADO | 0 (não chamado nesta rodada) |
| `privacy-guardian` | 3ª | APROVADO | 0 (frase do prazo atendida; gravação do GET com `now()` aprovada contra a regra 20) |
| `conformidade-reviewer` | 2ª | APROVADO | 0 (não chamado nesta rodada) |
| `tenancy-guardian` | 3ª | REPROVADO | 1 (`tasks.md` 1.2 e Tech Spec §7c ainda mandam gravar a data emprestada) |
| `infra-guardian` | 3ª | REPROVADO | 1 (o limite de p95 na rajada não existe) |

Tamanho: PRD 1.997 palavras · Tech Spec 3.318 palavras (acima do teto, com o aceite escrito no topo da Tech Spec).

### Correções exigidas na Tech Spec
- **`tasks.md` 1.2 e Tech Spec §7c ("Carga na manhã de segunda")** (`tenancy-guardian`): os dois ainda mandam gravar a data emprestada, o que a correção 1 da rodada 2 proibiu (dado da escola A gravado no tenant B); §3, §12b e a tarefa 1.0 dizem o contrário, então a spec se contradiz no ponto que tem veto. Teste e mutação já existem; falta alinhar o texto. Correção: no `tasks.md` 1.2, trocar "e copia a emprestada para a própria linha" por "e, se a data veio de outra escola e a própria linha está nula, grava `now()` nela, nunca o valor emprestado"; no §7c, trocar "grava uma vez só a data emprestada" por "e grava uma vez só `now()` na própria linha quando a data veio de outra escola".
- **Tech Spec §7c ("Métrica, alerta, teste de carga"), §10 ("Carga") e tarefa 3.1** (`infra-guardian`): a correção 5 da rodada 2 pedia "o limite do p95 das autenticadas valendo na rajada"; o texto diz só "o limite do p95 das autenticadas vale", sem fase nem número. Na fase `rajada` de `infra/k6/login-7h30.js` não há limite sobre `autenticada_duracao` (só `legitimo('rajada')`, `contas_que_entraram` e `dropped_iterations`; os p95 das autenticadas existem só em `b` e `c`, na `base` e em `bcMantidos()`). Lido ao pé da letra, uma `minhas-atividades` lenta passa na rajada. Correção: escrever na §7c, na §10 e na 3.1 que as chamadas novas entram em `autenticada_duracao` com a tag `name` da rota, e que a fase `rajada` ganha o limite `autenticada_duracao{grupo:rajada}: p(95) < N`, com N declarado (por exemplo `P95_MAXIMO_DO_LOGIN_MS`, como já vale para B e C na `base`).

### Recomendações
- Tirar "com a data como parâmetro" da §3 e da subtarefa 1.2: o método não recebe data, o `now()` vai dentro da instrução (`test-engineer`, `tenancy-guardian`).
- `tasks.md` linha 14 (1.6): listar "escrita do GET, só a própria linha" e "sem GET intermediário"; linha 3.1: citar o seed de `infra/scripts/carga-login.ts`, além do k6 (`test-engineer`, `infra-guardian`).
- Subtarefa 1.2, frase final truncada: separar em "Gravação do GET que falha: devolve a data lida, sem gravar." e "`acessos`, na resposta, não muda." (os quatro).
- Dizer como o teste de integração provoca a falha da gravação do GET (gatilho no banco de teste que recusa o `update`, não mock do repository, regra 40); pedir contador ou evento da falha, só com ids (`test-engineer`, `infra-guardian`).
- Caso "escrita do GET, só a própria linha": usar um aluno como colega (pior efeito: pular o aviso) e, se couber, também um professor (`test-engineer`).
- Mutações dos filtros do método novo: listar papel, conta, vínculo ativo e eliminação agendada (`test-engineer`).
- §6 diz "método que já é `@SemEscopo` para o seletor"; §3 e 1.2 dizem "método próprio". Escolher um; se for próprio, citar a lista de métodos de `resolucao-de-tenant.repository.test.ts` e a justificativa da exceção (`tenancy-guardian`).
- Ainda abertas de rodadas anteriores: `introducaoVista` booleano no `/v1/eu` em vez da data; registrar `educa.letra` em `docs/lgpd.md` com teste de que a chave não vai em requisição (8.1); aviso/Privacidade dizer que o Tutor manda ao modelo as habilidades a rever; registrar no `TODO.md` a contagem dupla de `orcamento.consultar` e `usoDeHoje` em `tutor/conversa`; nomear o teste do aluno transferido na memória do Tutor (7.0).

## Rodada 4 — 13/10/2026

**Veredito: APROVADA** (os seis revisores com veto aprovados; esta rodada chamou só os dois que reprovaram na 3ª)

| Revisor | Última rodada | Veredito | Bloqueantes |
|---|---|---|---|
| `test-engineer` | 3ª | APROVADO | 0 |
| `frontend-reviewer` | 2ª | APROVADO | 0 |
| `privacy-guardian` | 3ª | APROVADO | 0 |
| `conformidade-reviewer` | 2ª | APROVADO | 0 |
| `tenancy-guardian` | 4ª | APROVADO | 0 (`tasks.md` 1.2 e §7c gravam `now()`; nenhuma frase manda persistir a data emprestada) |
| `infra-guardian` | 4ª | APROVADO | 0 (limite `autenticada_duracao{grupo:rajada}: p(95) < P95_MAXIMO_DO_LOGIN_MS` na §7c, na §10 e na 3.1; implementável com o `login-7h30.js` atual) |

Tamanho: PRD 1.997 palavras · Tech Spec 3.366 palavras (acima do teto, com o aceite escrito no topo da Tech Spec).

### Correções exigidas na Tech Spec
Nenhuma.

### Recomendações
- Método da leitura entre escolas: §6 e §11 (linha da regra 10) dizem "o método que já é `@SemEscopo` para o seletor"; §3 e `1_task.md` 1.2 dizem "método próprio"; a 1.2 ainda diz no começo que "`acessosDaConta` devolve a data só para o service". Escolher um e usar em todo lugar; sendo o próprio, citar a entrada nova na lista de métodos de `apps/api/src/sessao/resolucao-de-tenant.repository.test.ts` (`tenancy-guardian`).
- Limite por rota: o p95 da rajada mistura três `GET /v1/sistema/contexto` com um `/v1/eu` e um `minhas-atividades`; uma `minhas-atividades` lenta em parte das chamadas pode passar. Gravar a Trend com `{ grupo, name }` e acrescentar `autenticada_duracao{grupo:rajada,name:GET /v1/minhas-atividades}: p(95) < P95_MAXIMO_DO_LOGIN_MS` (`infra-guardian`).
- `tasks.md` 3.1: citar o limite `< P95_MAXIMO_DO_LOGIN_MS` e o seed de `infra/scripts/carga-login.ts`, para o índice não divergir da `3_task.md` (`infra-guardian`).
- `1_task.md` 1.2: frase final truncada; separar em "Gravação do GET que falha: devolve a data lida, sem gravar." e "`acessos`, na resposta, não muda."; dizer como o teste provoca a falha (gatilho no banco de teste, não mock do repository) e pedir contador ou evento da falha só com ids (`infra-guardian`, `test-engineer`).
- Ainda abertas de rodadas anteriores: `introducaoVista` booleano no `/v1/eu` em vez da data; registrar `educa.letra` em `docs/lgpd.md` com teste de que a chave não vai em requisição (8.1); aviso/Privacidade dizer que o Tutor manda ao modelo as habilidades a rever; registrar no `TODO.md` a contagem dupla de `orcamento.consultar` e `usoDeHoje` em `tutor/conversa`; nomear o teste do aluno transferido na memória do Tutor (7.0).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-13 08:35:22 | 2026-10-13 08:36:46 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | a276ec05ddf06ef0c |
| 2026-10-13 08:35:33 | 2026-10-13 08:37:12 | `tenancy-guardian` | 1 | REPROVADO | a6931221acbe94650 |
| 2026-10-13 08:35:36 | 2026-10-13 08:38:25 | `infra-guardian` | 1 | REPROVADO | afe187d0b3a8d54ce |
| 2026-10-13 08:35:25 | 2026-10-13 08:38:42 | `privacy-guardian` | 1 | REPROVADO | a90ab60886d066ff4 |
| 2026-10-13 08:35:29 | 2026-10-13 08:38:59 | `conformidade-reviewer` | 1 | REPROVADO | a6c94e7d322377014 |
| 2026-10-13 08:35:19 | 2026-10-13 08:40:02 | `test-engineer` | 1 | REPROVADO | afa34a0398d21e811 |
| 2026-10-13 08:48:19 | 2026-10-13 08:48:42 | `frontend-reviewer` | 2 | APROVADO | a681ce83e3ccd935d |
| 2026-10-13 08:48:12 | 2026-10-13 08:49:52 | `test-engineer` | 2 | REPROVADO | a25f766684396b18e |
| 2026-10-13 08:48:34 | 2026-10-13 08:49:57 | `conformidade-reviewer` | 2 | APROVADO | a5645831a8576b19f |
| 2026-10-13 08:48:41 | 2026-10-13 08:50:26 | `tenancy-guardian` | 2 | REPROVADO | a5e093ffa36b80db5 |
| 2026-10-13 08:48:26 | 2026-10-13 08:50:36 | `privacy-guardian` | 2 | REPROVADO | a50b0207c3534007a |
| 2026-10-13 08:48:49 | 2026-10-13 08:50:58 | `infra-guardian` | 2 | REPROVADO | a38c315a346e78de2 |
| 2026-10-13 08:54:24 | 2026-10-13 08:55:39 | `test-engineer` | 3 | APROVADO | ab5b103ca7aa7d605 |
| 2026-10-13 08:54:31 | 2026-10-13 08:55:39 | `privacy-guardian` | 3 | APROVADO | abe566c768ebb3394 |
| 2026-10-13 08:54:38 | 2026-10-13 08:55:43 | `tenancy-guardian` | 3 | REPROVADO | a3cd5355b05bbf9f2 |
| 2026-10-13 08:54:44 | 2026-10-13 08:56:23 | `infra-guardian` | 3 | REPROVADO | ab26ab1f45ffd4098 |
| 2026-10-13 08:57:43 | 2026-10-13 08:58:13 | `tenancy-guardian` | 4 | APROVADO | a01474b74a566e81c |
| 2026-10-13 08:57:50 | 2026-10-13 08:58:20 | `infra-guardian` | 4 | APROVADO | ab17e3fa8b2dcf2ef |
