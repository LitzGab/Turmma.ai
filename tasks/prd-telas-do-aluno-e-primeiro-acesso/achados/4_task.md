# Achados das revisões — `tasks/prd-telas-do-aluno-e-primeiro-acesso/4_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-25 04:43:23 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/4_task.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: `/aluno/atividades` no computador (1366 px) e no celular (360 px), na escola cheia e na vazia). Não fotografei os estados carregando e erro, porque a vitrine não os mostra. Rodei a unidade das três suítes da tarefa: 23 testes passam.
Estados: ok.
- Carregando usa `EstadoCarregando` (`Atividades.tsx:89`) e erro usa `EstadoErro` com "Tentar de novo" (`:90`).
- Vazio total convida: "Nada para fazer agora" mais "Quando quem dá a aula passar uma atividade para a turma, ela aparece aqui." (`:94`).
- Com dado há três grupos, e cada grupo vazio mostra a linha tracejada com o próprio texto. Nenhum grupo é desenhado quando a lista inteira está vazia (`:97`).
- Os testes de componente cobrem os quatro estados e o vazio de cada grupo sozinho (`Atividades.test.tsx:45-146`).

Acessibilidade: ok pelo código. Cada grupo é uma `section` com `aria-labelledby`, e o `h1` "Tarefas" está presente. A linha inteira é um único `<a>`, com o ladrilho `aria-hidden` e o estado em texto no selo, sem depender só de cor. O `e2e` de 360 px roda `violacoesGraves` (`e2e/aluno-atividade.spec.ts`). Não rodei o e2e.

Chromebook fraco: a lista é paginada por "Ver mais tarefas", sem rolagem infinita (D59), e cada página é pequena. Virtualização não se aplica a esse volume. Nada de imagem nem de upload nesta tela. Não verifiquei o throttling de CPU e de rede nesta rodada (é recomendação 1).

Celular:
- Na foto de 360 px não há rolagem lateral.
- O selo desce para baixo do nome, como a tarefa pede.
- Os títulos longos são truncados com reticências e o texto inteiro fica no `title`, que é o comportamento da `Linha` da X1.
- A linha tem `min-h-16`, ou seja 64 px, acima dos 44 px da ação principal.
- O botão "Ver mais tarefas" usa o `Botao` da X1.
- Nada depende de hover.
- O e2e `Tarefas a 360 px` confere a largura excedente, a altura da linha (44 px) e a posição do selo.

Ação oficial protegida: sim, no sentido que cabe a esta tela. Ela só lê e não aprova nada.
- "Corrigida" e o grupo "Corrigidas" só existem para `com_diagnostico`, a correção já aprovada (regra 70, item 3).
- `enviada` e `encerrada` ficam em "Entregues", com o texto de espera, e o teste proíbe nelas as palavras "corrigid", "resultado" e "acert".
- Não há dado de colega (regra 50, item 9): o teste varre ranking, média, posição, pontos, sequência, nota, prazo, "NOVO", barra de progresso e filtro por matéria.
- Não encontrei termo técnico nem id na tela. O texto antigo ("Para responder", "Já feitas", "Com resultado") não sobrou em `apps/web/src`, `e2e` nem `docs/interface.md`.

Bloqueantes: nenhum.

Recomendações:
1. O throttling de rede e de CPU desta tela não foi registrado. Vale rodar o perfil `chromebook` antes do pouso da spec.
2. Em 360 px o título da tarefa é cortado ("Cinemática: lista sinté…"), porque a `Linha` limita o título a uma linha. Não bloqueia, mas é a limitação mais visível da tela no celular. Se isso incomodar, a mudança é na X1 (`componentes/ui/Linha.tsx`), não nesta tarefa.
3. A reserva de matéria é `anil` com livro aberto (`materia.ts:RESERVA`), e não neutra como a subtarefa 4.2 pedia. A divergência está declarada na tarefa e em `docs/interface.md` 9.1. Como `anil` é a cor de Física, uma disciplina como Robótica passa a parecer Física pela cor, e o livro aberto é a única diferença. Vale reavaliar quando a X1 ganhar uma família neutra.
4. Na foto do computador, o conteúdo fica deslocado para a direita da área principal (largura "conversa"). É a largura padrão da `Tela`, então não é defeito desta tarefa.

Arquivos principais:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/Atividades.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/atividades.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/materia.ts`

## infra-guardian · 1ª rodada · APROVADO · 2026-10-25 04:43:38 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/4_task.md`

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
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/Atividades.tsx:99-101`: o vazio de cada grupo olha só as páginas já carregadas. Se a primeira página não trouxer nenhuma corrigida, a tela diz "Nenhuma corrigida ainda." mesmo que a segunda página tenha corrigidas, enquanto "Ver mais tarefas" aparece logo abaixo. Isso não afeta carga, mas o frontend-reviewer deve decidir se o texto do vazio muda quando `hasNextPage` é verdadeiro. A tarefa já recusou o contador pelo mesmo motivo, e o vazio tem o mesmo problema.
- O `staleTime` de 60 s e o `refetchOnWindowFocus: false` que a techspec §9 pede para `minhas-atividades` não estão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/api/atividades-do-aluno.ts:28-34`, que segue com o padrão do cliente (30 s e releitura ao focar a aba). Esse ajuste é da tarefa 3.0, não desta. Fica registrado para conferir que a 3.0 o entregue: com sessenta turmas, cada vez que o aluno volta para a aba sai mais uma leitura.

Por que o veredito: a mudança é só de apresentação no front. Não cria endpoint, query nova, job, chamada de modelo, estado no servidor nem migration. A lista usa a mesma rota paginada de antes e só pede a página seguinte quando o aluno clica (D59). Os testes novos usam `redeFalsa` e não chamam provedor pago.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 04:43:39 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/4_task.md`

VEREDITO: APROVADO

A tarefa só mexe na lista de Tarefas do aluno, que apenas lê dados. A regra 70 entra em um ponto só: "Corrigida" precisa vir de uma correção que alguém aprovou. Isso é garantido no servidor e provado por teste.

Caminhos de escrita em Nota: nenhum nesta tarefa (nenhuma escrita, só `GET /v1/minhas-atividades`). Todos com autor humano? Não se aplica.

Decisão autônoma sobre aluno: ausente. A tela não reordena, não pontua e não encaminha. `separarAtividades` mantém a ordem da API.

Aprovação registrada: ok.
- **Servidor:** `com_diagnostico` só aparece quando a correção do aluno está num lote aprovado (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/api/src/atividade/minha-atividade/minha-atividade.service.ts:24-26`).
- **Tela:** "Corrigida" e o grupo "Corrigidas" ficam só com `com_diagnostico` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/atividades.ts:17` e a função `separarAtividades`).
- **Testes:**
  - `atividades.test.ts` percorre todas as situações e confirma que só `com_diagnostico` diz "corrigid".
  - `Atividades.test.tsx:118-134` prova que enviada e encerrada ficam em "Entregues", com o texto de espera e sem "corrigid", "resultado" nem "acert".
  - As mutações declaradas cobrem a cláusula `corrigidas` e as duas cláusulas `entregues`.
  - O e2e `aluno-fluxo.spec.ts:162-164` mostra "Corrigida" só depois da aprovação real.

Supervisão do tutor: ok, e esta tarefa não a muda. O aviso "Avaliação: o Tutor fica pausado até quem dá a aula encerrar." continua só nas avaliativas ainda em aberto, e há mutação para isso.

Autonomia declarada e visível: sim, e esta tarefa não a muda. Nenhum agente novo.

Outros pontos da lista:
- **Item 7 (vigiar):** a tela não mede tempo nem navegação. A varredura do teste (`Atividades.test.tsx:148-167`) não acha ranking, média, posição, pontos, sequência, colega, nota, conceito, "atrasada" nem "!".
- **Item 8 (D46/D55):** a atividade é objetiva (alternativas de 0 a 3, `packages/shared/src/atividade/prova.ts`). A tela não mostra nota nem conceito. A chave `redacao` em `materia.ts:19` só escolhe a cor do ladrilho e não guarda nada sobre o texto do aluno.
- **Item 9 e D45:** não se aplicam.
- **D59:** "Ver mais tarefas" só busca a próxima página quando o aluno clica, sem rolagem infinita. O teste prova que há uma única chamada antes do clique. Os textos de lista vazia dizem um fato e não cobram.

Fotos:
- **`aluno--aluno-atividades--computador.png` e `--celular.png`:** os três grupos aparecem. As duas tarefas corrigidas trazem "Corrigida" em verde e "A correção foi aprovada.". Não há nota, contador, prazo, professor nem barra. No celular o selo fica abaixo do nome.
- **`vazia--aluno--aluno-atividades--computador.png` e `--celular.png`:** só aparece "Nada para fazer agora", sem cobrança e sem grupo desenhado.

Nenhuma das quatro telas tem conteúdo gerado por IA que exija selo.

Bloqueantes: nenhum.

Recomendações:
1. **"Encerrada" no grupo "Entregues".** O grupo inclui `encerrada`, que é a tarefa que o professor encerrou antes de o aluno enviar (`packages/shared/src/atividade/prova.ts:35`). Para um aluno que respondeu 0 de 3, o título "Entregues" diz que ele entregou, e não entregou. O selo "Encerrada" e o detalhe corrigem a leitura, mas vale levar ao `frontend-reviewer` ou ao produto: um título como "Esperando quem dá a aula" ou um texto próprio para encerrada sem envio. Não é regra 70, porque não fala de resultado.
2. **Texto de "Corrigida".** Na lista, o aluno pode entender que a pessoa corrigiu, quando na verdade a IA corrigiu e quem dá a aula aprovou. Hoje está correto, porque o detalhe diz "A correção foi aprovada." e não atribui a correção a ninguém. Quando a tela do diagnóstico passar pela X4, confira se ela leva o selo de IA da regra 70, item 4a, com a aprovação de quem dá a aula ao lado.
3. **Nome da constante.** O comentário de `TEXTO_DA_ESPERA_PELA_CORRECAO` (`atividades.ts:23`) ainda cita "com resultado". Atualizar para "corrigida" mantém o vocabulário igual ao da tela.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/Atividades.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/atividades.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/materia.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/Atividades.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/atividades.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/aluno-atividade.spec.ts`

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-25 04:43:48 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/4_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. A tela só mostra a lista de `GET /v1/minhas-atividades`, cujo DTO e cuja API não mudaram, e as tarefas que aparecem são as do próprio aluno. A tarefa mexe apenas no frontend: `separarAtividades` passa a separar em três grupos, os textos dos selos mudam, e o novo `materia.ts` escolhe a cor e o ícone pelo nome da disciplina, que não é dado de pessoa.

Fora da tabela de dados do docs/lgpd.md: nada. Nenhuma migration, nenhuma coluna e nenhum campo de saída novo.

Autorização por objeto: ok. Nenhuma rota foi criada ou alterada. Cada link leva a `/aluno/atividades/:id`, cuja autorização já existe e não mudou. Um ponto a favor da regra 20: o e2e "recomeço de Tarefas" (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/aluno-atividade.spec.ts`, linhas 552 a 597) prova que, na mesma aba, a resposta atrasada do aluno anterior não aparece para o aluno seguinte. Isso fecha um caminho de vazamento entre titulares no cliente.

Logs: limpos. O diff não acrescenta `console` nem `logger`.

Auditoria: não se aplica. É leitura do próprio aluno, sem exportação, sem alteração de nota ou de permissão e sem aprovação de saída de IA.

Envio externo: nenhum.

Seed/fixture: sintético. Os testes de componente usam "Lista sintética NN" e UUIDs fixos. Os e2e usam `criarAlunoComMatricula`, que gera "Aluno sintético …" com `senha-sintetica-…`. A vitrine mostra "Colégio sintético da vitrine …" e "Aluno Sintético Caio/Téo".

Fotos da tela (tela cheia e vazia, no computador e no celular):
- Aparecem só as tarefas do próprio aluno, com título, disciplina, número de questões e o estado em texto.
- Não aparece colega, nota, média, posição nem professor.
- "Corrigida" e "A correção foi aprovada…" só aparecem nas tarefas `com_diagnostico`, como em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/Atividades.tsx:269` e em `atividades.ts:468-469`. Assim, a tela não diz que algo foi corrigido antes da aprovação humana, o que também protege a regra 70.
- O nome do aluno no rodapé da lateral é o dele mesmo e vem da casca, não desta tarefa.

Pergunta de fechamento: a tarefa não cria dado guardado nem destino de envio, então o que o sistema já responde sobre um aluno continua igual (`arquivo-do-titular`, `pedido-titular`).

Bloqueantes: nenhum.

Recomendações:
- A prova de que a resposta atrasada do aluno anterior não vaza existe só no e2e. Uma prova em teste de componente, com `redeFalsa` e a troca de sessão, pegaria uma regressão mais cedo e por menos. Hoje isso não bloqueia.
- O teste "nada de colega" (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/Atividades.test.tsx:250`) procura palavras proibidas no texto da tela. Vale acrescentar um caso com um item que traga um campo a mais vindo da API, como `nomeDoProfessor`, e conferir que a tela não o mostra. Isso deixaria provado que a tela só mostra o que o contrato traz.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-25 04:43:49 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/4_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As duas divergências da tarefa (a reserva `anil` com livro aberto, e os grupos sem o número do mockup) já estão na `techspec.md` §9, linhas 171–172, e a da reserva também em `docs/interface.md` 9.1. Esta spec não tem `cenarios.md`, então não havia onde mais registrar.
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

A tarefa cumpre o que pediu:
- **Três grupos:** "Para fazer", "Entregues" e "Corrigidas", na ordem em que a API entrega.
- **"Corrigida":** só aparece com `com_diagnostico`, e há teste que varre cada situação.
- **Linha e ladrilho:** cada tarefa usa `Linha` e `Ladrilho`, e os `data-atividade` continuam.
- **Exports mantidos:** `estaParaResponder`, `resumoDaAtividade` e `AVISO_DA_AVALIACAO` continuam exportados para a 3.0.
- **O que ficou de fora:** não há professor, prazo, barra, "NOVO", contador nem filtro.
- **Fotos:** as do computador, do celular e da escola vazia batem com o RF. A 360 px o selo desce para baixo do nome e não há rolagem lateral.

Recomendações:
- **Texto que ainda diz "atividade" numa tela que agora se chama "Tarefas"** (glossário, "Tarefas", linha 232: "tarefa" é o nome no título da lista). Aparece no carregando "Carregando as suas atividades…" (`Atividades.tsx:344`) e no vazio total "…passar uma atividade para a turma…" (`Atividades.tsx:349`, foto `vazia--aluno--aluno-atividades--celular.png`). Vale alinhar, e o rótulo do carregando também está nos testes de componente e no e2e de recomeço.
- **Comentários com o vocabulário antigo em `apps/web/src/areas/aluno/atividades.ts`:**
  - o de `TEXTO_DA_SITUACAO` ainda diz "é para responder";
  - o de `TEXTO_DA_ESPERA_PELA_CORRECAO` ainda diz "separa 'enviada' de 'com resultado'".

  Os dois deviam dizer "para fazer" e "corrigida".
- **Tipo `FamiliaDeCor` importado de `componentes/ui/Contador`** (`apps/web/src/areas/aluno/materia.ts:3`). Segue o mesmo padrão do `Ladrilho`, então não é um segundo jeito de fazer. Mesmo assim, o `Ladrilho` podia reexportar o tipo, para quem usa o ladrilho não depender do `Contador`.
- **Teste de 360 px** (`e2e/aluno-atividade.spec.ts:138`): o nome é localizado pelo seletor `[title]`, que depende de detalhe interno do `Linha`. Um `data-*` estável seria mais robusto.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/Atividades.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/atividades.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/materia.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/Atividades.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/materia.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/atividades.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/aluno-atividade.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-25 04:44:40 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/4_task.md`

**VEREDITO: REPROVADO**

Um bloqueante: uma cláusula nova está sem bloco de mutação. Fora isso, toda linha da tabela tem o seu teste e os cenários estão cobertos.

**Cenários exigidos:**
- Caminho feliz: cada tarefa cai no grupo certo, na ordem da API.
- "Corrigida" só aparece com a correção aprovada (regra 70, item 3).
- Os quatro estados da tela, e o vazio de cada grupo sozinho.
- Nome da matéria escrito de vários jeitos ("Matemática", "matematica", " MATEMÁTICA ", "Língua Portuguesa" ou "Português").
- Disciplina que a escola cadastra com outro nome.
- Professor com duas disciplinas na mesma turma, cada linha com a cor da sua matéria.
- Aluno que perdeu a avaliação (`encerrada`).
- Nada de colega na tela (RF10).
- Clique duplo em "Ver mais tarefas".
- A 360 px, sem rolagem lateral e com o selo abaixo do nome.
- Isolamento na própria aba: o aluno seguinte não vê a resposta atrasada do anterior.
- Permissão: o aluno só lê o que é dele, e a API não mudou.

**Cobertos** (as 8 linhas da tabela, cada uma com teste nomeado):
- **A separação:** `atividades.test.ts`, nos testes "separa em três grupos…", "cada atividade cai em exatamente um grupo…" e "'Corrigida' é só da atividade com a correção aprovada…".
- **"Corrigida" só com correção aprovada:** `Atividades.test.tsx`, no teste "'Corrigida' só com a correção aprovada…". Confere o texto de espera, a ausência de "corrigid", "resultado" e "acert", e o grupo Corrigidas vazio.
- **Quatro estados:** `Atividades.test.tsx`, nos testes "carregando", "com erro", "vazio total", "com dado: três grupos" e "o vazio de cada grupo aparece sozinho". O carregando usa `redeFalsa().segurar()`.
- **`materia.ts`:** os cinco casos de `materia.test.ts`. Incluem `constructor` e `__proto__`, que não atravessam a reserva, e a ausência do laranja.
- **RF10:** `Atividades.test.tsx`, no teste "nada de colega (RF10)". Também confere que não há professor, prazo, "NOVO", barra de progresso nem filtro por matéria.
- **"Ver mais tarefas":** três testes. A segunda página só vem ao clicar, e durante "Carregando…" o botão fica `disabled`, o que cobre o clique duplo.
- **360 px:** `e2e/aluno-atividade.spec.ts`, no teste "Tarefas a 360 px". O `[title]` é o título da `Linha` e o `[data-estado]` é o selo, então a asserção de que o selo desce para baixo do nome é real.
- **Recomeço:** `e2e/aluno-atividade.spec.ts`, no teste "recomeço de Tarefas". O `irPara` navega sem recarregar a página (`pushState`), então a resposta atrasada chega mesmo na mesma aba.

**Mutações:** conferi os 14 blocos contra o `git diff`. Cada um chega à cláusula pelo cenário citado e falharia pelo motivo certo:
- os dois do aviso batem nas linhas 104 e 106 do teste;
- o do selo bate na linha 109;
- o do ladrilho bate na 111, porque azul e turquesa viram anil.

Não há `.skip`, não há mock de coisa nossa (a rede é falsa, a tela e o cliente de consultas são os de verdade) e não há IA. Rodei `npx vitest run` nos 3 arquivos: 23 testes passaram. Não rodei os e2e; quem os prova é o portão.

**Bloqueantes:**
1. `apps/web/src/areas/aluno/materia.ts:46`, a linha `.replace(/\p{M}/gu, '')`, é uma cláusula nova sem bloco de mutação. O `node tools/processo/mutacoes.ts --faltando` a aponta. É ela que tira o acento depois do `normalize('NFD')`, e as outras três etapas da chave (`normalize`, `toLowerCase`, `trim`) têm bloco.
   - **Correção exigida:** um bloco com `arquivo: apps/web/src/areas/aluno/materia.ts`, `teste: apps/web/src/areas/aluno/materia.test.ts › "Matemática", "matematica"` e a linha `- .replace(/\p{M}/gu, '')`. O teste já fica vermelho com isso, porque "Matemática" decomposta não acha a chave `matematica`.

**Recomendações:**
1. `apps/web/src/areas/aluno/Atividades.tsx:108`: o `--faltando` também lista o ternário `isFetchingNextPage ? 'Carregando…' : 'Ver mais tarefas'`. A condição já existia e só o texto mudou, e o teste de "Ver mais" já pega os dois lados, mas um bloco trocando a condição por `false` fecha a lista.
2. Aluno que perdeu a avaliação: uma tarefa `encerrada` com `respondidas: 0` cai em "Entregues", com "O que você marcou ficou guardado.", para quem não entregou nada. Está como a subtarefa 4.1 define, mas nenhum teste cobre esse caso. Vale levar à validação para decidir o texto ou o grupo.
3. A asserção de 44 px no e2e de 360 px passa sempre, porque a `Linha` tem `min-h-16` (64 px). Medir também o selo, que tem `min-h-6`, ou o ladrilho daria mais informação.
4. Os testes "carregando" e "com erro" procuram 'Nada para fazer agora' sem ponto, que é o texto do vazio total. O vazio de grupo, com ponto, só fica coberto pela contagem de regiões zero. Conferir também `VAZIO_DE_CADA_GRUPO` deixaria isso explícito.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/tasks/prd-telas-do-aluno-e-primeiro-acesso/4_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/materia.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/Atividades.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/Atividades.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/atividades.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/materia.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/aluno-atividade.spec.ts

## test-engineer · 2ª rodada · APROVADO · 2026-10-25 04:57:33 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/4_task.md`

VEREDITO: APROVADO

**Cenários exigidos** (definidos na 1ª rodada, não mudaram):
- Caminho feliz: três grupos, na ordem da API.
- Tarefa "Corrigida" só com a correção aprovada; enviada e encerrada ficam em "Entregues".
- Vazio total e vazio de cada grupo.
- Estados de carregando e de erro.
- Aviso de avaliação só antes de responder.
- Matéria escrita de vários jeitos (acento, caixa, espaço, duas grafias) e matéria desconhecida.
- Paginação só quando o aluno clica, sem clique duplo.
- Nenhum dado de colega na tela (RF10).
- Recomeço da tela na troca de aluno (e2e).

**Cobertos:** todos. Nesta rodada conferi:
- **A correção exigida foi feita.** O bloco de `apps/web/src/areas/aluno/materia.ts`, com o teste `materia.test.ts › "Matemática", "matematica"` e a linha `- .replace(/\p{M}/gu, '')`, está em `tasks/prd-telas-do-aluno-e-primeiro-acesso/4_task.md:166-170`. Sem essa linha, "Matemática" vira "matematica" com acento ainda decomposto e cai na reserva, então o teste fica vermelho pelo motivo certo. O `tools/processo/mutacoes.ts --faltando` responde: "Nenhuma linha nova de produção com condição fica sem bloco".
- **O bloco novo de `Atividades.tsx:108` chega a um teste que pega a troca.** Com `{false ? 'Carregando…' : 'Ver mais tarefas'}`, a espera por `findByRole('button', { name: 'Carregando…' })` em `Atividades.test.tsx:219` falha. O nome citado bate com o teste da linha 207.
- **Carregando e erro agora checam também o vazio de cada grupo.** As linhas 54 e 67 de `Atividades.test.tsx` conferem que nenhum texto de `VAZIO_DE_CADA_GRUPO` aparece. Antes só se conferia o vazio total.
- **Teste novo do contrato estrito** (`Atividades.test.tsx:172`). O `safeParse(...).success === false` com um campo a mais prova que o esquema é estrito.
- **`atividades.ts`:** só mudaram dois comentários, sem cláusula nova.
- **Rodada local:** os três arquivos de unidade (`Atividades.test.tsx`, `materia.test.ts`, `atividades.test.ts`) passam, 24 testes. Não há `.skip` e nenhum mock esconde a regra.

**Bloqueantes:** nenhum.

**Recomendações:**
- `apps/web/src/areas/aluno/Atividades.test.tsx:181-184`. As asserções de tela do teste do contrato podem rodar ainda no estado de carregando. O `waitFor` só espera a chamada sair, não a resposta ser recusada, então "nada de lista, nada do nome" passaria mesmo com o esquema frouxo. Hoje quem prova a regra é o `safeParse` da linha 176. Para a parte da tela provar alguma coisa, convém esperar um sinal de que a resposta já foi lida e recusada (o alerta de erro, ou a segunda tentativa registrada) antes de varrer o `textContent`.
- As recomendações da 1ª rodada estão registradas na tabela "Recomendações sem aplicar", com destino ou motivo. Uma é minha (a de 44 px no e2e de 360 px) e foi recusada com motivo, para o Validador conferir no celular. Fica como está.

## revisor-geral · 2ª rodada · REPROVADO · 2026-10-25 04:58:03 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/4_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/tasks/prd-telas-do-aluno-e-primeiro-acesso/4_task.md:207,208,210,212,214,215,216`. O que está errado: sete linhas da tabela "Recomendações sem aplicar" mandam a recomendação para o `TODO.md`, mas o `TODO.md` não foi alterado nesta árvore (nem aparece no `git status`). O modelo da tarefa (`.claude/skills/criar-tasks/task-template.md:164`) diz que o destino `TODO.md` "é a linha já escrita no `TODO.md`, no commit da tarefa, e não promessa". A tarefa 2.0 seguiu isso: o commit `469a3955` escreveu quatro linhas no `TODO.md`. Do jeito que está, essas recomendações somem no commit. Entre elas está a do `conformidade-reviewer` e do `test-engineer`: o aluno que respondeu 0 de 3 numa atividade "Encerrada" aparece em "Entregues", e a tela diz que ele entregou. Correção exigida: escrever no `TODO.md` uma linha para cada uma das sete, com o revisor, o dono e o arquivo, no mesmo commit da tarefa. A outra saída é trocar o destino por uma tarefa que toca o arquivo, ou recusar com motivo. A linha da 212 precisa nomear quem decide (Validador ou produto).

Conferência da rodada:
- As correções do diff foram feitas. O carregando e o erro agora provam que nenhum texto de `VAZIO_DE_CADA_GRUPO` aparece. O teste do campo a mais no contrato estrito entrou. Os comentários de `atividades.ts` foram alinhados ao vocabulário da tela ("fazer", "entregue", "corrigida").
- As duas mutações novas são mortas pelos testes citados. O `.replace(/\p{M}/gu, '')` cai em "Matemática"/"matematica". O `isFetchingNextPage` cai em `Atividades.test.tsx:219`, que procura o botão "Carregando…".

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/Atividades.test.tsx:182-185`: o `waitFor` termina assim que a chamada é registrada, antes de a resposta ser processada. Por isso as asserções de ausência podem passar mesmo que o esquema deixe de ser estrito. Depender só do `safeParse` na linha 176 enfraquece a prova na tela. Para provar de verdade, esperar o estado que vem depois da leitura recusada (o erro, ou o fim das novas tentativas) antes de afirmar a ausência. O dono desse ponto é o `test-engineer`.
- As fotos não mudaram desde a rodada aprovada. `Atividades.tsx` e `materia.ts` estão iguais, e não há nada novo a apontar na tela.

## revisor-geral · 3ª rodada · APROVADO · 2026-10-25 05:09:37 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/4_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok (desde a rodada anterior, o código de produção não mudou)
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

As duas correções da 2ª rodada foram feitas:

- **As sete recomendações agora estão no `TODO.md`.** Antes, a tabela "Recomendações sem aplicar" do `4_task.md` mandava sete linhas para o `TODO.md`, mas ele não tinha sido alterado. Agora há sete linhas novas no fim da lista da X4, uma para cada recomendação. Cada uma diz o revisor, a rodada, o dono e o arquivo, e todas batem com a tabela.
  - A linha que exigia nomear quem decide agora nomeia o Validador. É a do `infra-guardian`, sobre o vazio de cada grupo olhar só as páginas carregadas.
  - A linha do `conformidade-reviewer` e do `test-engineer` diz "Quem decide: o Validador, com o produto". É o caso da atividade "Encerrada" que cai em "Entregues" e faz o aluno que respondeu 0 de 3 ler que entregou. A linha também pede o teste com `encerrada` e `respondidas: 0`.
- **O teste do contrato estrito agora espera o fim da leitura.** Em `apps/web/src/areas/aluno/Atividades.test.tsx:181-184`, o teste espera o `alert` antes de afirmar que não há lista, região, link nem o nome do professor. Assim ele não afirma mais isso enquanto a tela ainda está carregando, que era o que eu tinha recomendado.

Recomendações:
- `apps/web/src/areas/aluno/Atividades.test.tsx:184`: o teste exige exatamente duas chamadas com `toBe(2)`. Isso o amarra a quantas vezes a consulta tenta de novo, que é configuração do `QueryClient` do teste. Se essa configuração mudar, o teste quebra sem que a regra tenha mudado. Bastaria pedir ao menos uma chamada (`toBeGreaterThanOrEqual(1)`), já que o `alert` prova que a leitura terminou.
- O prazo de 4000 ms do `findByRole` fica perto do teto padrão de 5 s do Vitest por caso. Hoje passa, mas em máquina lenta a folga é pequena.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/TODO.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/tasks/prd-telas-do-aluno-e-primeiro-acesso/4_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/Atividades.test.tsx

## test-engineer · 3ª rodada · APROVADO · 2026-10-25 05:09:50 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/4_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 2ª rodada, que aprovei e que não mudaram. Desde lá só mudou o teste do contrato estrito: um campo a mais na resposta (o nome do professor) faz a lista não ser desenhada, e o nome não aparece na tela.

Cobertos:
- **A recomendação da 2ª rodada foi atendida** (`Atividades.test.tsx:181-187`). Antes o teste esperava só a primeira chamada à rede. Isso deixava "nada de lista" ser afirmado ainda no carregando, quando passaria até sem a regra. Agora ele espera o alerta de erro, que só aparece depois que a resposta foi lida e recusada.
- **A contagem de duas chamadas bate com o código.** Em `apps/web/src/api/cliente-de-consultas.ts`, a configuração faz uma nova tentativa, um segundo depois. A falha de leitura do contrato não é um `ErroDaApi`, então `deveTentarDeNovo` repete uma vez. A peça de teste (`__fixtures__/tela.tsx:109`) monta a tela com esse mesmo cliente.
- **O teste falharia sem a regra.** Se o contrato aceitasse o campo a mais, a lista seria desenhada e o alerta não viria. O `findByRole('alert')` estoura o prazo, e as verificações de ausência de região e de link também falhariam. Os dois `safeParse` no começo do caso mostram que o contrato recusa o campo a mais e aceita a atividade sem ele.
- **O prazo é folgado.** A espera é de um segundo de relógio real, contra 4 s do `findByRole` e 60 s do `testTimeout` (`vitest.config.ts:23`). Isso não depende de a máquina estar folgada.
- **A suíte passa:** `npx vitest run apps/web/src/areas/aluno/Atividades.test.tsx` deu 11 de 11 em 2,27 s.
- Não há `.skip`, teste comentado nem mock que esconda a regra. A rede é falsa, e a tela, o cliente de consultas e a sessão são os da aplicação.
- As sete linhas novas do `TODO.md` não são código e não afetam teste nenhum.

Bloqueantes: nenhum.

Recomendações:
- `Atividades.test.tsx:184`: o `toBe(2)` depende de `TENTATIVAS_AUTOMATICAS = 1`. Se essa constante mudar, o teste quebra por um motivo que não é o contrato estrito. Dá para escrever `toBe(1 + TENTATIVAS_AUTOMATICAS)`, importando a constante de `api/cliente-de-consultas`.
- `Atividades.test.tsx:183`: o teste espera um segundo real pela nova tentativa. Com relógio falso (`vi.useFakeTimers({ shouldAdvanceTime: true })` e avanço de `ESPERA_ENTRE_TENTATIVAS_MS`), ele fica mais rápido sem perder o que prova. Não bloqueia, porque a folga é ampla.
