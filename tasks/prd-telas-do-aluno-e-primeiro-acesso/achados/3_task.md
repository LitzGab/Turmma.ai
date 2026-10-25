# Achados das revisões — `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-25 05:43:19 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: 1366 px e 360 px, escola cheia e vazia). A foto da escola cheia mostra o estado "Nenhuma tarefa por agora", porque a vitrine não semeia atividade aplicada. O estado com tarefas e o da avaliação aberta eu conferi pelo código e pelos testes.
Estados: ok.
- Carregando: `Inicio.tsx:68`, "Carregando as suas tarefas…".
- Vazio: `Inicio.tsx:72`, só com a leitura terminada, e diz que o Tutor ajuda quando houver tarefa.
- Erro: `Inicio.tsx:69-71`, com "Tentar de novo". A saudação e a faixa continuam na tela. Uma releitura que falha não tira as tarefas já lidas.
- Com dado: até três tarefas, na ordem da API.
- Os 24 testes de `Inicio.test.tsx` e `inicio.test.ts` passaram quando rodei. Eles cobrem os quatro estados, a borda de aluno sem turma, o `staleTime` e o `refetchOnWindowFocus`, e a varredura de texto.

Acessibilidade:
- O `<h1>` existe só para o leitor de tela (`tituloSoParaLeitor`).
- A faixa de supervisão é uma nota presa e sem botão de fechar.
- Os links têm texto próprio ("Pedir ajuda ao Tutor", "Ver todas as tarefas") e nenhum fica dentro de outro.
- Não conferi contraste nem foco visível por medição, só pela foto. A foto não mostra problema.

Chromebook fraco:
- O Início faz duas leituras leves: `/v1/eu` e a primeira página de `minhas-atividades`. Não lê `tutor/conversa` nem conta o uso do dia.
- A lista tem no máximo três itens, então não precisa de virtualização.
- Não há upload de imagem nesta tela.
- Não rodei throttling de CPU e rede nesta revisão.
- `staleTime` de 60 s e `refetchOnWindowFocus: false` evitam releitura desnecessária na rede da escola.
- O cenário k6 `login-7h30` foi estendido com as duas leituras e o limite de p95 da rajada.

Celular:
- Na foto a 360 px não há rolagem horizontal, texto cortado nem sobreposição.
- "Ver todas as tarefas" e "Pedir ajuda ao Tutor" usam `CLASSES_DO_LINK_SECUNDARIO`, com `min-h-11`, ou seja, 44 px.
- O "Sair" é o da casca (barra de topo), e o e2e `aluno-inicio.spec.ts` confere o tamanho dele.
- A faixa fica presa abaixo da barra de topo (`top-14`) e continua à vista depois de rolar. O e2e cobre isso a 360 px e checa `larguraExcedente`.
- Nada depende de hover. O `hover:underline` do título é só enfeite.
- A foto do computador mostra a mesma tela sem problema. Nenhuma tela rola a 1366 × 768.

Ação oficial protegida: sim. Não se aplica à tela, que não aprova nada, só lê e navega. A saudação é fixa: sem "de volta", "faz tempo" nem número de uso (D58, D59). Não há dado de colega (regra 50, item 9).
- O Tutor aparece com o nome da função e o selo "IA" (`AssinaturaIA`, regra 70, item 4a).

Bloqueantes: nenhum.

Recomendações:
- `Inicio.tsx:28`: o título da tarefa é um link de `text-base`, com altura de linha de cerca de 24 px. Isso cumpre o mínimo de 24 px, mas é o ponto de toque mais fraco da linha no celular. Vale um `min-h-11` ou `py-2` para chegar a 44 px, já que abrir a tarefa é a ação mais provável.
- `Inicio.tsx:96`: a saudação é um `<p>` e o `<h1>` é só para leitor de tela. Isso está documentado e é coerente, então não bloqueia.
- O vazio diz "O Tutor ajuda nas tarefas. Quando houver uma, ela aparece aqui." Ele convida e não se desculpa. Se a validação quiser um próximo passo mais explícito, o "Ver todas as tarefas" logo abaixo já cumpre esse papel.
- A vitrine da escola cheia não semeia atividade aplicada, então a foto do estado com dado e a da avaliação aberta não existem. Quando a vitrine passar a semear, vale refotografar essas duas.

Arquivos principais:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Inicio.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/inicio.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/aluno-inicio.spec.ts`

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 05:43:40 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. A tela só lê, e o seed de carga em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/infra/scripts/carga-login.ts:349-411` grava ano letivo, série, disciplina, turma, vínculo, artefato, `atividade_aplicada`, `tentativa_atividade` e `resposta_atividade`. Não grava `nota` nem `correcao`, e é sintético, só com `AMBIENTE=local`. Todos com autor humano? Sim, porque não há caminho novo de escrita em Nota.
Decisão autônoma sobre aluno: ausente. "Para fazer" só filtra por situação (`estaParaResponder`) e corta em três. Nada aprova, reprova nem encaminha o aluno.
Aprovação registrada: ok. O Início não mostra saída de IA que afete o aluno. A saudação é texto fixo da interface (`apps/web/src/areas/aluno/inicio.ts:25-28`), não é gerada por modelo, e a exceção da D47 não se estende a outro agente.
Supervisão do tutor: ok. A faixa vem de `TEXTO_DA_SUPERVISAO`, fica presa e não tem botão de fechar (`apps/web/src/areas/aluno/Inicio.tsx:98`, `FaixaDeSupervisao.tsx`). O componente prova que nada fecha a faixa, e o e2e prova que ela continua à vista depois de rolar a 360 px (`e2e/aluno-inicio.spec.ts:35-66`). O Início não lê `tutor/conversa` nem o uso do dia, e o teste prova isso (`Inicio.test.tsx:250-258`). O caminho até o Tutor na avaliação aberta continua, com o `AVISO_DA_AVALIACAO`, e quem pausa o Tutor é o servidor (D36).
Autonomia declarada e visível: sim. A tarefa não muda nenhum agente nem nível de autonomia.

**Como chega à pessoa (as quatro fotos)**
- `aluno--aluno-inicio--computador.png`, `aluno--aluno-inicio--celular.png`, `vazia--aluno--aluno-inicio--computador.png` e `vazia--aluno--aluno-inicio--celular.png` mostram a mesma coisa.
- A saudação "Oi, Aluno." vem com o avatar, o nome da função "Tutor" e o selo "IA" (`Inicio.tsx:95-96`). Ela se identifica como IA, não se passa por pessoa e não usa "de volta", "faz tempo" nem contador (D58, D59).
- A faixa "Quem dá a aula acompanha como você usa o Tutor." está à vista e sem fechar nos dois tamanhos.
- Nenhuma nota, conceito ou sugestão de nota aparece (D55). `resumoDaAtividade` mostra só a disciplina e o número de questões (`atividades.ts:32-34`).
- O vazio não promete que o Tutor está disponível (`inicio.ts:16`), e não há recompensa, sequência de dias, ranking nem dado de colega.
- O "Sair" está à vista nos dois tamanhos (lateral no computador, barra de topo no celular). Sair não é mais difícil que entrar (4b).
- O estado com tarefas e o da avaliação aberta não aparecem nas fotos. Conferi os dois pelo código (`Inicio.tsx:24-39`) e pelos testes (`Inicio.test.tsx:157-247`).

**Supervisão não é vigilância e medir o professor:** a tarefa não toca nesses dois pontos. Não há inferência emocional, tempo ocioso, navegação, indicador de professor nem conversa do professor.

Bloqueantes: nenhum.

Recomendações:
- Acrescentar `nota`, `conceito` e `acertos` ao regex da varredura de texto (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Inicio.test.tsx:338`). Hoje o Início não mostra resultado, e a varredura faria disso uma regra provada, protegendo a D55 e a regra 70 item 3 se um dia alguém puser o estado `com_diagnostico` no Início.
- Semear na vitrine cheia uma atividade aplicada, uma delas avaliativa, para a próxima rodada ver na foto o aviso "Avaliação: o Tutor fica pausado até quem dá a aula encerrar." e o link "Pedir ajuda ao Tutor". Hoje esses dois só se veem pelo código.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-25 05:43:45 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela, migration, repository ou endpoint novo. O diff não toca `apps/api` nem `packages/`. No seed da carga (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/infra/scripts/carga-login.ts`, `semearTurmasEAtividades`), todo insert leva `escola_id`, e todo insert de tabela que varia por período leva também `ano_letivo_id`: `turma`, `vinculo`, `artefato`, `atividade_aplicada`, `tentativa_atividade` e `resposta_atividade`. `serie` e `disciplina` levam `escola_id`.

Queries verificadas:
- Seed, os selects e updates do próprio seed: `select id from turma`, a subquery de `atividade_aplicada`, o join com `vinculo`, a origem de `resposta_atividade` e o `update usuario`. Todos filtram por `escola_id` da escola que está sendo semeada, e por `ano_letivo_id` onde a tabela varia por período. Nenhum id cruza de uma escola para outra: turmas, artefatos e alunos vêm da própria escola.
- Web (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Inicio.tsx`): só lê `GET /v1/eu` e `GET /v1/minhas-atividades`, as duas já existentes, e não manda `escolaId` em query nem em corpo. Não lê `tutor/conversa`.
- k6 (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/infra/k6/login-7h30.js`): as rotas novas usam só o Bearer do login, sem parâmetro de escola.

Teste de isolamento: não se aplica a esta tarefa, e por isso não conta como ausente. Não há módulo, repository nem endpoint novo, então não há cláusula de escopo para remover mentalmente. O isolamento no mesmo computador está coberto e é efetivo: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/aluno-inicio.spec.ts:113` segura a resposta do primeiro aluno até o segundo entrar. Se a resposta atrasada, ou o nome do primeiro, aparecer na tela do segundo, o teste quebra.

Os outros itens:
- Mensagem de erro e existência de dado de outra escola: o Início não abre por id e usa o `EstadoErro` comum, então nada revela se um registro de outra escola existe.
- UUID: o seed usa `returning id`, `randomUUID()` e `uuid[]`.
- Camada de rede: não é tocada.
- `@SemEscopo()`: não aparece.

Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/infra/k6/login-7h30.js` (`leituraDoInicio`): a carga confere 200 e que a página não veio vazia, mas não confere que os itens são da escola de quem entrou. As três escolas recebem títulos iguais ("Lista sintética NN"). Se o seed pusesse o nome da escola no título e o k6 contasse como inesperado o item de outra escola, a rajada também mostraria um vazamento sob concorrência. Isso é cobertura extra, não uma falha.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-25 05:44:10 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: na tela, só o nome do próprio aluno. A saudação usa o primeiro nome, que vem de `GET /v1/eu` (`apps/web/src/areas/aluno/Inicio.tsx`, `saudacaoDoAluno(eu.data?.nome)`). "Para fazer" mostra título, resumo e se a tarefa é avaliativa, tudo de `GET /v1/minhas-atividades`. Nenhuma coluna nova, nenhuma migration e nenhum DTO novo: as duas rotas já existiam e a tarefa não muda o contrato delas.

Fora da tabela de dados do docs/lgpd.md: nenhum.

Autorização por objeto: ok. A tarefa não cria rota. As duas leituras são do próprio aluno, pelo token: `/v1/eu` e `/v1/minhas-atividades` não recebem id na URL, então não há id para trocar. Os links levam a `/aluno/tutor/<id>` e `/aluno/atividades/<id>`, que já tinham a checagem por objeto da tarefa 2.0 e não mudaram aqui.

Logs: limpos. Não há `console` nem `logger` em `Inicio.tsx`, em `inicio.ts` nem em `infra/k6/login-7h30.js`. O k6 lê `itens` só para contar se a página veio vazia e não grava o corpo da resposta.

Auditoria: não se aplica. É leitura do aluno sobre ele mesmo, sem coordenação, rede, exportação, nota ou permissão no caminho.

Envio externo: nenhum. Não há chamada de modelo. O teste `Inicio.test.tsx:250` prova que a tela só pede `/v1/eu` e `/v1/minhas-atividades`, e nunca nada com `/tutor` (que incluiria a conversa e o uso do dia). O e2e `aluno-inicio.spec.ts` confere o mesmo na página de verdade.

Seed/fixture: sintético.
- O seed da carga (`infra/scripts/carga-login.ts`, `semearTurmasEAtividades`) cria só nomes como "Turma sintética NN", "Lista sintética NN", "Química sintética" e "Enunciado sintético da questão N". As matrículas saem de `matriculaSintetica`, e o script roda só com `AMBIENTE=local`.
- As fixtures de `Inicio.test.tsx`, `inicio.test.ts` e `rotas.test.tsx` usam "Ana Clara Sintética", "Escola sintética" e UUIDs fixos de teste.

Fotos da tela: as quatro mostram o mesmo conteúdo.
- O cabeçalho é a assinatura "Tutor" com o selo "IA", seguido de "Oi, Aluno.".
- A faixa de supervisão aparece presa e sem botão de fechar.
- O estado vazio não promete o Tutor, e não aparece número de uso, colega nem matrícula.
- O nome completo ("Aluno Sintético Caio df86225e") aparece só no rodapé da lateral, que já existia na casca. A pessoa vê o próprio nome, então não há exposição.

Recomeço no computador compartilhado: ok. O cache das consultas é zerado quando a sessão troca (`apps/web/src/main.tsx:32`, `resetQueries`), então os 60 s de `staleTime` da chave `['eu']` não deixam o nome de um aluno para o seguinte. O e2e `aluno-inicio.spec.ts › recomeço` prova que nem a tarefa nem o nome do primeiro aluno aparecem para o segundo, mesmo quando a resposta do primeiro chega atrasada.

Bloqueantes: nenhum.

Recomendações:
- A tela só mostra o estado com tarefas e o da avaliação aberta pelo teste de componente e pelo e2e com a API simulada; a vitrine cheia não semeia atividade aplicada para o aluno. Semear uma atividade, inclusive uma avaliativa, na vitrine cheia deixaria a próxima auditoria de tela ver esses estados na foto. Cabe em `TODO.md` ou na tarefa que mexer na vitrine.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Inicio.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/inicio.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Inicio.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/aluno-inicio.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/infra/scripts/carga-login.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/infra/k6/login-7h30.js`

## revisor-geral · 1ª rodada · APROVADO · 2026-10-25 05:44:59 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum

Recomendações:
1. **O teste do "Sair" no celular mede o botão errado.** O caso "Sair está à vista no Início…" está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/aluno-inicio.spec.ts:582-599`. Ele chama `abrirNavegacao`, e `lateral(page)` então aponta para a gaveta. Assim o teste mede o "Sair" de dentro da gaveta, que fica a dois toques. O "Sair" a um toque é o da barra de topo (`CascaDaEscola.tsx:319`, visível na foto `aluno--aluno-inicio--celular.png`), e esse não é medido. O §9 da techspec, na redação nova, promete que "o e2e confere que ele tem o tamanho de toque dos vizinhos", e no projeto `celular` essa promessa não é provada. A correção sugerida: abaixo de 768 px, medir o `button "Sair"` do `banner` sem abrir a gaveta. Isso é cobertura de teste e cabe ao `test-engineer`; registro aqui para ele.
2. **Ano fixo no seed da carga.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/infra/scripts/carga-login.ts:368` o ano letivo é gravado como 2026, com início e fim fixos. É melhor tirar o ano do relógio, para a carga não semear um ano "em curso" com datas vencidas quando rodar em 2027.
3. **Duas conexões no mesmo seed.** `semearTurmasEAtividades` recebe `pool`, e a escola e as contas são criadas com `banco` (`carga-login.ts:437`). Usar uma das duas em todo o seed deixaria mais claro que é tudo a mesma conexão.
4. **Releitura de várias páginas ao entrar no Início.** O Início lê `minhas-atividades` com `useInfiniteQuery`, na mesma chave de Tarefas (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Inicio.tsx:62`). Se o aluno passou por Tarefas e carregou várias páginas, o Início relê todas elas ao entrar com a leitura velha, embora mostre só a primeira. Não pesa na rajada das 7h30, porque ali só existe a primeira página. Fica registrado para o `infra-guardian` e para a 4.0.

Conferi também o que poderia ter sido bloqueante, e está em ordem:
- **Arquivos proibidos:** a tarefa não editou `Tutor.tsx`, `api/tutor.ts`, `e2e/__fixtures__/aluno.ts` nem `atividades.ts`.
- **E2e do Tutor:** os casos "em avaliação…" e "no limite do dia…" não mudaram. Em `e2e/aluno-tutor.spec.ts` só mudou o primeiro caso, para seguir o texto novo do Início. Os outros e2e alterados só trocam rótulo.
- **Divergência do "Sair" e do título da tarefa:** está registrada na tarefa e também no §9 da `techspec.md`. Esta spec não tem `cenarios.md`.
- **Leituras do Início:** a tela lê só `/v1/eu` e `minhas-atividades`, com 60 s de `staleTime` e sem reler ao voltar para a aba, como pede o §9. Não lê `tutor/conversa` nem mostra o uso do dia (7c).
- **Carga (k6):** os dois limites de p95 da rajada e a tag `name` da rota batem com o 7c. A chave nova não colide com as de `legitimo()`.
- **Fotos:** batem com o que o código produz. Saudação com o Tutor e o selo "IA", faixa com `TEXTO_DA_SUPERVISAO` e sem fechar, vazio "Nenhuma tarefa por agora" que não promete o Tutor. Nenhum texto de colega, número de uso ou recompensa.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-25 05:45:03 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`

VEREDITO: APROVADO

Caminho quente tocado: login (a rajada das 7h30 agora inclui as leituras do Início do aluno)
Rate limit: ok. A tarefa não cria rota nem contador novo. As duas leituras passam pela guarda geral, que limita por usuário e por escola (`LIMITE_REQ_USUARIO_MIN=120`, `LIMITE_REQ_ESCOLA_MIN=30000`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/.env.example:66-67`). Na rajada, `respostas_429{grupo:rajada} = 0`.
Fila e prioridade: ok. Não se aplica: a tarefa não tem job nem fila.
Concorrência: protegida. A tarefa só lê, e não há escrita nova.
Índice e paginação: ok. Nenhuma query nova. `minhas-atividades` já é paginada por cursor (`apps/api/src/atividade/minha-atividade/minha-atividade.repository.ts`, `listar`), e o Início lê só a primeira página. Na rajada, com a página cheia (60 atividades por turma, 20 turmas por escola, tentativa e resposta nas mais novas), o p95 dessa rota ficou em 22 ms e o de todas as autenticadas em 19 ms (`.processo/carga-rajada.log:952,956`), bem abaixo do limite de 1.000 ms.
Degradação de IA: não se aplica. O Início não chama modelo e não lê `tutor/conversa`; o teste de componente prova isso.
Migration: não se aplica.
Métrica e alerta: ok. Não há código novo no backend. O cenário `login-7h30` recebeu as duas rotas, com a tag `name`, a página vazia contada em `respostas_inesperadas` e os dois limites da fase `rajada`. A execução registrada passou com 2.100 contas, nenhuma iteração perdida, nenhum 503 e nenhum 429. O registro é anterior aos horários de modificação dos dois arquivos de carga, mas esses horários coincidem com o fim do portão de mutação (05:19), então são o portão restaurando os arquivos.
Bloqueantes: nenhum

Recomendações:
- `apps/web/src/areas/aluno/Inicio.tsx:62`: o Início usa a mesma chave infinita da tela Tarefas. Se o aluno carregou várias páginas em Tarefas e volta ao Início depois de 60 s, o TanStack relê todas as páginas em série, não só a primeira. Vale limitar com `maxPages` ou dar ao Início uma consulta própria de uma página só.
- `infra/k6/login-7h30.js:237`: só `GET /v1/minhas-atividades` tem limite próprio. Um limite igual para `GET /v1/eu` deixaria o par simétrico, embora o `/v1/eu` hoje entre no limite de todas as autenticadas.
- `infra/scripts/carga-login.ts:387-392`: todas as atividades do seed têm `avaliativa=false`. Se alguma for avaliativa, a carga passa pelo mesmo caminho que o aviso da avaliação usa na tela, sem custo para o cenário.

## test-engineer · 1ª rodada · APROVADO · 2026-10-25 05:46:26 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
1. Os quatro estados: carregando; vazio só depois da leitura; erro com "Tentar de novo", com a saudação e a faixa de pé; e com dado.
2. Nenhuma leitura de `tutor/conversa` e nenhum uso do dia.
3. Saudação fixa (D58, D59).
4. Carga do login no k6: `/v1/eu` e `minhas-atividades` medidos em `autenticada_duracao`, página não vazia e o p95 da rajada.
5. Faixa presa, sem botão de fechar, à vista depois de rolar a 360 px.
6. Tarefa avaliativa aberta: o aviso aparece e o link para o Tutor continua, com o `href` certo (D36).
7. Borda: aluno sem turma no ano.
8. Nada promete o Tutor.
9. Varredura de texto (RF10).
10. Recomeço da tela: o aluno seguinte no mesmo computador e a resposta atrasada do anterior.
11. Caso extra da 3.2: até três tarefas, só da primeira página, na ordem da API.
12. Caso extra da 3.2: leituras com `staleTime` de 60 s e sem `refetchOnWindowFocus`.
13. Caso extra da 3.2: "Sair" do tamanho dos vizinhos.

Concorrência e isolamento não se aplicam. A tela só lê, por endpoints que já existiam, e a troca de pessoa na mesma aba está no e2e de recomeço.

**Cobertos:**
- **Quatro estados:** `Inicio.test.tsx` › "carregando…", "com erro…", "Tentar de novo lê as tarefas outra vez", "vazio, com a leitura terminada", "com dado…". Mais "só com tarefa já enviada…" e "uma releitura que falha não tira as tarefas da tela".
- **Sem `tutor/conversa`:** › "só o /v1/eu e as tarefas…". O teste compara o conjunto exato de rotas pedidas e confere que nenhuma tem `/tutor`. O e2e "avaliação aberta" também confere que nada de `/v1/tutor` foi pedido.
- **Saudação fixa:** `inicio.test.ts` › "é a mesma frase para qualquer nome…", "usa o primeiro nome…", "sem nome ainda…". No componente, › "é Oi, Ana.…" (assinatura com função e selo IA) e "antes de o nome chegar diz só Oi.".
- **k6:** `infra/test/carga-login.test.ts` › "o seed enche a primeira página", "a rajada julga o p95…", "as duas leituras entram em autenticada_duracao…", e a lista de rotas atualizada.
- **Faixa presa:** `conferirAFaixa` em todos os estados do componente (nenhum botão, texto uma vez só). O e2e › "a faixa de supervisão fica presa…" prova que a página rolou de verdade (`not.toBeInViewport` antes), confere a posição colada à barra de topo e a largura excedente zero.
- **Avaliativa:** componente › "avaliativa aberta…" (aviso só na avaliativa, `href` do Tutor). O e2e segue até a pausa e a caixa habilitada.
- **Sem turma:** › "borda: aluno sem turma no ano…".
- **Nada promete o Tutor:** a unidade (vazio do Início) e o componente (texto inteiro).
- **Varredura:** › "varredura: nenhum…".
- **Recomeço:** `e2e/aluno-inicio.spec.ts` › "recomeço…", com a primeira leitura segurada e liberada depois da troca de aluno.
- **Até três, primeira página:** `inicio.test.ts` (filtro e limite) e componente › "com as duas páginas já no cache…" e "só a primeira página conta…".
- **Leituras:** › "ao voltar para a aba com a leitura velha…" e "reaberto antes de 60 s…". As duas usam relógio falso só no `Date`. O padrão do cliente é 30 s com foco ligado, então as três mutações dessa cláusula têm vermelho legítimo.
- **"Sair":** e2e › "Sair está à vista no Início e tem o tamanho de toque dos vizinhos".
- **Mutações:** cada cláusula nova do diff em `Inicio.tsx`, `inicio.ts`, `login-7h30.js` e `carga-login.ts` tem o seu bloco, e cada bloco cai num cenário que alcança a cláusula.
- **Sem `.skip` nem mock que esconda a regra:** só a rede é falsa, a tela e o cliente de consultas são os de verdade. Não há IA envolvida.
- **Execução:** rodei de novo os três arquivos da web (27 testes) e `infra/test/carga-login.test.ts` (35 testes), todos verdes.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **k6: o limite da `minhas-atividades` pode passar sem medir nada.** Em `infra/test/carga-login.test.ts:396-410` a prova é textual (`toContain` sobre o script). O teste não vê se o limite está nas thresholds da fase `rajada` nem se o seletor `name:GET /v1/minhas-atividades` casa com alguma amostra. No k6, um limite sobre submétrica sem amostra passa sem medir nada, e "`minhas-atividades` lenta reprova o cenário" ficaria sem prova. Duas correções possíveis:
   - acrescentar `count>0` na mesma submétrica em `infra/k6/login-7h30.js:238`, com o teste correspondente;
   - registrar na validação uma rodada de `npm run carga:login` na rajada, com a submétrica presente no resumo.
2. **O seed não roda em nenhum teste automático.** As instruções SQL de `semearTurmasEAtividades` (`infra/scripts/carga-login.ts:349-411`) só rodam na carga manual. A página vazia viraria `respostas_inesperadas` e reprovaria a rajada, então o cenário se confere sozinho, mas só quando é rodado. Vale registrar a rodada na validação.
3. **O teste da borda "aluno sem turma" é igual ao do vazio.** Em `Inicio.test.tsx:147-155`, os dois recebem a mesma lista vazia. O teste só ganha sentido junto com o teste de API que prova que o aluno sem turma recebe a lista vazia. Vale citar esse teste da API no documento.
4. **A varredura cobre só o estado com dado.** Em `Inicio.test.tsx:332-340`, valeria passar também pelo vazio e pelo erro. A regex com `\b` não pega plurais como "médias" e "metas".
5. **O recomeço está duplicado.** `e2e/aluno-inicio.spec.ts:113` repete quase igual o caso de `e2e/minha-turma.spec.ts:167` ("segunda pessoa no Início"). Basta um dos dois.
6. **Sem bloco para o `cancelRefetch: false`.** É o que segura o clique duplo em "Tentar de novo" (`Inicio.tsx:70`). Fica como cobertura extra.
7. **Arquivos fora da lista de "Arquivos previstos".** `aluno-tutor.spec.ts`, `casca-no-celular.spec.ts`, `minha-turma.spec.ts`, `rotas.test.tsx`, `inicio.ts`, `inicio.test.ts` e `carga-login.test.ts` mudaram. As mudanças nos e2e vêm da troca de texto e da saída da escolha de atividade do Início. Os casos "em avaliação…" e "no limite do dia…" de `aluno-tutor.spec.ts` não foram tocados.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Inicio.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Inicio.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/inicio.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/inicio.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/aluno-inicio.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/infra/k6/login-7h30.js
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/infra/scripts/carga-login.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/infra/test/carga-login.test.ts

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-25 06:11:13 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas, 1366 e 360 px, escola cheia e vazia). As duas fotos "cheias" mostram o vazio ("Nenhuma tarefa por agora"), porque a vitrine não semeia atividade aplicada para o aluno. A linha de tarefa não aparece em foto nenhuma e foi conferida só pelo código e pelos testes.
Estados: ok.
- Carregando: `EstadoCarregando` em `apps/web/src/areas/aluno/Inicio.tsx:68`.
- Erro: `EstadoErro` com "Tentar de novo" em `Inicio.tsx:69-71`. A saudação e a faixa de supervisão continuam na tela, e a segunda leitura não cancela a primeira (`cancelRefetch: false`).
- Vazio: só com a leitura terminada, e convida em vez de pedir desculpa (`Inicio.tsx:72`, texto em `inicio.ts`).
- Com dado: até três tarefas (`Inicio.tsx:24-39`).

Acessibilidade:
- Há um `<h1>` só para o leitor de tela, e a seção "Para fazer" tem `aria-labelledby`.
- Os dois destinos de cada tarefa são links separados, nenhum dentro do outro.
- Nas fotos o foco e o contraste da pele da D80 estão consistentes.

Chromebook fraco:
- A tela faz duas leituras só: `/v1/eu` e `minhas-atividades`, ambas com `staleTime` de 60 s e sem reler ao voltar para a aba.
- Não lê a conversa do Tutor nem o uso do dia, de propósito: isso entraria na rajada de login das 7h30 (regra 80).
- A lista tem no máximo 3 itens, então não precisa de virtualização.

Celular:
- A 360 px não há rolagem horizontal nem texto cortado. A barra de baixo tem Início, Tarefas e Eu.
- O "Sair" fica à vista na barra do topo, com cerca de 44 px de altura.
- "Ver todas as tarefas" tem `min-h-11` (`apps/web/src/componentes/ui/botao-secundario.ts`).
- A correção da rodada foi feita: o link do título da tarefa agora tem `min-h-11` (`Inicio.tsx:28`), e o teste confere isso em `Inicio.test.tsx:205`.
- O teste do "Sair" a um toque no celular usa `getByRole('banner')` e `toHaveCount(1)` (`e2e/aluno-inicio.spec.ts:73-77`).
- Nada depende de hover, porque o `hover:underline` do título é só enfeite.
- Nenhum fluxo exige o celular.

Ação oficial protegida: sim. A tela não tem ação oficial. "Pedir ajuda ao Tutor" só leva à conversa, e a supervisão fica com o servidor e com o professor (D8, D36).

Conformidade:
- O Tutor aparece com o selo "IA" (`AssinaturaIA`).
- A saudação é fixa, sem "de volta", sem tempo de uso e sem sequência de dias (D59, regra 70 item 4b).
- Não há dado de colega nem nota na tela (regra 50 item 9).
- A faixa "Quem dá a aula acompanha como você usa o Tutor" fica presa e sem fechar (D8).

Bloqueantes: nenhum.

Recomendações:
- Fazer a vitrine cheia semear uma atividade aplicada para o aluno. Assim a linha de tarefa, com o aviso de avaliação e os dois links, passa a ser vista em foto e não só no código.
- O nome do aluno no rodapé da lateral (por exemplo "Aluno Sintético Caio df86225e") e o nome da escola da vitrine trazem sufixo hexadecimal. É dado sintético da vitrine, não do produto, então não bloqueia.
- O avatar do aluno mostra "A9" na foto vazia e "AD" na cheia. É consequência do nome sintético e não exige ação.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-25 06:11:28 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. A rodada 2 só muda a apresentação e os testes do Início do aluno e não grava em `Nota`. Todos com autor humano? Não se aplica.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. Nenhuma saída de IA nova chega ao aluno. O Início só lista atividades que já foram aplicadas e oferece o Tutor, que segue a exceção da D47.
Supervisão do tutor: ok. As quatro fotos mostram o aviso "Quem dá a aula acompanha como você usa o Tutor." (cheia e vazia, no computador e no celular).
Autonomia declarada e visível: sim. Esta tarefa não mexe nela: não há agente novo nem mudança de nível.
Bloqueantes: nenhum
Recomendações:
- O import de `abrirNavegacao` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/aluno-inicio.spec.ts:3` pode ter ficado sem uso no teste do "Sair". Se não houver outro uso no arquivo, vale tirar. Não é da regra 70.
- A vitrine cheia ainda não semeia atividade aplicada, então nenhuma foto mostra a linha de tarefa com o resumo. A varredura sem nota, conceito nem acertos está provada em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Inicio.test.tsx:52-83`, mas não na tela. Semear uma atividade, objetiva e avaliativa, na vitrine cheia deixaria isso visível na próxima rodada com foto.

O que conferi nesta rodada:
- **Correções exigidas:** nenhuma havia. A recomendação da 1ª rodada foi aplicada. A varredura de texto agora pega nota, conceito e acertos, com plural, e roda nos três estados: com dado, vazio e com erro (`Inicio.test.tsx:52-83`). Isso cobre o item 8 (D55) no texto do Início.
- **`Inicio.tsx:28`:** só ganha classes de altura de toque. Nenhum dado novo aparece e nada sugere nota.
- **O "Sair" no e2e (`e2e/aluno-inicio.spec.ts:117-120`):** no celular, o teste agora prova que o "Sair" fica a um toque na barra do topo, sem abrir a gaveta, e que existe um só. Isso fortalece a 4b (sair nunca é mais difícil que entrar).
- **O teste dos dois cliques em "Tentar de novo":** é sobre a leitura da lista e não afeta a regra 70.

O que as quatro fotos mostram (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/.processo/vitrine/aluno--aluno-inicio--computador.png`, `aluno--aluno-inicio--celular.png`, `vazia--aluno--aluno-inicio--computador.png` e `vazia--aluno--aluno-inicio--celular.png`, todas na mesma pasta):
- O Tutor aparece com avatar e o selo "IA" (4a). A saudação "Oi, Aluno." não tem tom de vínculo afetivo.
- O vazio é factual: "O Tutor ajuda nas tarefas. Quando houver uma, ela aparece aqui." Não promete nem chama o aluno de volta.
- Não aparece nota, conceito, pontos, sequência nem ranking.
- O "Sair" fica visível a um toque no celular e na lateral no computador.
- Nada fala de comportamento ou emoção do aluno.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-25 06:11:33 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum (nesta rodada só mudaram a tela e os testes. `infra/` e o backend estão iguais aos da 1ª rodada aprovada)
Rate limit: ok (não mudou desde a 1ª rodada)
Fila e prioridade: ok (não se aplica, nenhum job mudou)
Concorrência: protegida. O "Tentar de novo" usa `refetch({ cancelRefetch: false })` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Inicio.tsx:70`. Assim, um clique duplo dispara uma leitura só e não cancela a que já está em andamento. O teste novo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Inicio.test.tsx` prova isso: segura a resposta e confere que houve duas leituras no total (a carga que falhou mais uma nova tentativa). Às 10h, um aluno que clica duas vezes não dobra a carga em `/v1/minhas-atividades`.
Índice e paginação: ok (nenhuma query nova. O Início continua lendo só a primeira página)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (nada novo no caminho quente)
Bloqueantes: nenhum
Recomendações: nenhuma nova. As da 1ª rodada (o Início relê as várias páginas da chave infinita, limite próprio para `/v1/eu`, atividade avaliativa no seed da carga) já estão em "Recomendações sem aplicar" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`, cada uma com destino.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-25 06:11:52 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nesta rodada. O patch `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/.processo/ordens/3_task-diff-r1-r2.patch` só altera `Inicio.tsx`, `Inicio.test.tsx`, `e2e/aluno-inicio.spec.ts` e `3_task.md`. O `git status` também não mostra mudança em `apps/api`, `packages/` nem em migration.

Queries verificadas: nenhuma query nova nem alterada. O front continua lendo só `/v1/eu` e `/v1/minhas-atividades`, as duas com escopo tirado do token, sem `escolaId` na query nem no corpo. Isso não mudou desde a 1ª rodada. A mudança em `apps/web/src/areas/aluno/Inicio.tsx:28` é só de classe CSS no `Link` (altura de toque). O id da atividade na rota continua sendo o UUID que a API devolve.

Teste de isolamento: não se aplica a esta rodada, porque o diff não toca repository, endpoint nem schema. O que foi aprovado na 1ª rodada continua valendo.

Bloqueantes: nenhum

Recomendações:
- A recomendação da 1ª rodada (títulos com o nome da escola na carga) continua registrada em "Recomendações sem aplicar", com destino. Não houve correção exigida a conferir.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-25 06:12:13 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`

VEREDITO: APROVADO

Esta é a rodada 2, e audito só o que mudou desde a rodada 1 aprovada. A mudança no código é de estilo: o título de cada tarefa ganhou `flex min-h-11 items-center` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Inicio.tsx:28`. O resto são testes novos ou ajustados: o clique duplo em "Tentar de novo", a altura do título, a varredura de texto maior e o "Sair" do banner no celular. A rodada anterior não exigiu correção, então não havia nada a conferir. `apps/api` e `packages/` não mudaram. `infra/scripts/carga-login.ts` aparece modificado, mas já estava assim na rodada 1, e o diff desta rodada não passa por `infra/`.

- **Campos pessoais tocados:** nenhum campo novo. O link continua mostrando só `atividade.titulo` e levando a `atividade.id`, e o DTO `MinhaAtividade` não mudou.
- **Fora da tabela de dados do docs/lgpd.md:** nenhum.
- **Autorização por objeto:** ok. Não há rota nem endpoint novo, e a leitura continua sendo `/v1/minhas-atividades` e `/v1/eu`, escopadas pelo token.
- **Logs:** limpos. O diff não acrescenta nenhum log.
- **Auditoria:** nenhuma ação desta rodada pede auditoria. O aluno lê os próprios dados, e não há exportação, nota, permissão nem aprovação de saída de IA.
- **Envio externo:** nenhum.
- **Seed/fixture:** sintético. Os testes usam "Lista sintética 01/02/03", e os nomes nas fotos são sintéticos ("Aluno Sintético Caio df86225e", "Colégio sintético da vitrine cheia/vazia").
- **Fotos** (computador e celular, escola cheia e vazia, em `.processo/vitrine/`):
  - O aluno vê só a si mesmo: o primeiro nome na saudação e, no computador, o nome completo no rodapé da lateral. Não aparece colega, matrícula, nota nem conteúdo de conversa.
  - O aviso "Quem dá a aula acompanha como você usa o Tutor" aparece nos quatro estados.
  - A foto da escola cheia continua mostrando "Nenhuma tarefa por agora", porque a vitrine ainda não semeia atividade. Por isso o título com altura de toque não aparece em nenhuma foto. Ele só é provado pelo teste novo em `Inicio.test.tsx` e pela mutação registrada no documento da tarefa.
- **Varredura de texto:** agora cobre também "nota", "conceito" e "acertos", nos estados com dado, vazio e erro. Isso reforça que o Início não expõe nada de desempenho.

**Pergunta de fechamento:** esta rodada não cria dado guardado nem destino de envio, então o que o sistema responde sobre um aluno continua igual à rodada 1.

**Bloqueantes:** nenhum.

**Recomendações:**
- Continua valendo a da rodada 1, que já tem destino no `TODO.md`: semear na vitrine cheia uma atividade aplicada, uma delas avaliativa. Sem isso, nenhuma foto mostra o estado com tarefas, e a foto não confere se o título e o resumo da tarefa trazem só o que o DTO promete.

## revisor-geral · 2ª rodada · REPROVADO · 2026-10-25 06:12:49 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido

Bloqueantes:
- `apps/web/src/areas/aluno/Inicio.tsx:28`: a correção desta rodada põe uma regressão na largura de 360 px. Antes, o `Link` do título era um bloco, e o `break-words` quebrava o título dentro da largura do cartão. Agora o `Link` é `flex`, e o título vira um item de flex com `min-width: auto`, que mede a largura mínima do conteúdo. O `overflow-wrap: break-word` não reduz essa medida, então uma palavra longa sem espaço não quebra mais e passa da borda do cartão.

  Medi as mesmas classes no Chromium a 360 px com o título `Exercícios_de_estequiometria_do_capítulo_três_parte_dois`. Com as classes da 1ª rodada a página não sobra nada para o lado; com as de agora sobram 38 px de rolagem horizontal. Isso viola a regra 50, item 2a (nada de rolagem horizontal a 360 px), e desfaz em silêncio o `break-words` que já estava na linha. O título vem do professor, então o caso é possível.

  Nenhum teste pega isso. O e2e de largura (`e2e/aluno-inicio.spec.ts:39`, `:62`) só usa títulos curtos com espaço ("Lista sintética N"). O teste novo de `Inicio.test.tsx` confere só a classe `min-h-11` e não a quebra.

  Correção exigida: manter a altura de 44 px sem tirar a quebra. Por exemplo, envolver o texto num `<span className="min-w-0 break-words">` dentro do `Link`, ou trocar `break-words` por `wrap-anywhere` (Tailwind 4). Junto, pôr no caso de largura do e2e (`aluno-inicio.spec.ts:39`) um título longo sem espaço e conferir `larguraExcedente(page)` igual a 0 no projeto `celular`.

Recomendações:
- O teste dos dois cliques em "Tentar de novo" (`Inicio.test.tsx`, novo bloco na linha 126 e seguintes) não tem bloco de mutação, e a explicação procede. Sem dado em cache, o TanStack Query v5 ignora o `cancelRefetch`. Com uma leitura já em andamento, ele devolve a mesma promessa, com ou sem a opção. O `EstadoErro` não desabilita o botão, então quem garante a leitura única é a biblioteca, não o `cancelRefetch: false` da linha 70. O teste prova o comportamento que a pessoa vê, e vale mantê-lo. Mas o nome dele ("a segunda não cancela a primeira") sugere que isso vem do código da tela. Vale dizer no `3_task.md` que não há mutação porque a garantia é da biblioteca no estado sem dado. Manter o `cancelRefetch: false` está certo, porque é o padrão das outras 10 telas.
- O e2e do "Sair" (`aluno-inicio.spec.ts:74`) agora mede o botão da barra do topo no celular. As fotos confirmam que é esse o "Sair" à vista (`.processo/vitrine/aluno--aluno-inicio--celular.png`). O "Sair" da gaveta, a dois toques, fica sem medida de toque neste spec. Isso não bloqueia, porque o `sairPelaCasca` ainda o aciona.
- As fotos (cheia e vazia, computador e celular) mostram só o estado vazio, então o título com `min-h-11` não aparece em nenhuma. A recomendação de semear atividade na vitrine cheia já está com destino no `TODO.md`.

## test-engineer · 2ª rodada · APROVADO · 2026-10-25 06:12:58 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`

**VEREDITO: APROVADO**

**Cenários exigidos (rodada nova, só o diff desde a 1ª):**
- dois cliques seguidos em "Tentar de novo" fazem uma leitura só
- o título de cada tarefa tem altura de toque de 44 px
- a varredura de texto passa também pelo vazio e pelo erro, com plurais e com "nota", "conceito" e "acertos"
- o "Sair" do celular é o da barra do topo, e só um
- a pergunta sobre o `cancelRefetch: false`

**Cobertos:**
- **Clique duplo:** o teste novo (`Inicio.test.tsx`, "dois cliques seguidos em "Tentar de novo"...") faz os dois cliques sem esperar entre eles e confere o resultado: a contagem de leituras fica em 2 antes e depois de liberar a resposta, e a lista aparece. O botão de `EstadoErro` não fica desabilitado enquanto tenta de novo, então o segundo clique chega mesmo ao `aoTentarDeNovo`. O bloco que já existe, que troca `aoTentarDeNovo` por `() => undefined`, também deixa este teste vermelho, porque a contagem para em 1.
- **Título com 44 px:** tem bloco próprio, que tira só o `min-h-11`. O bloco antigo do título foi atualizado para o className novo e continua aplicável.
- **Varredura:** roda nos três estados (com dado, vazio e erro), cada um com o seu `unmount` e a sua espera.
- **"Sair":** no celular pega o da barra do topo e no computador o da lateral. O `toHaveCount(1)` impede que o seletor ache o botão da gaveta junto. A medida da altura continua.
- **Testes:** `npx vitest run` de `Inicio.test.tsx`, `inicio.test.ts` e `rotas.test.tsx` passou, com 29 testes verdes.
- **Fotos:** batem com o estado vazio, com a saudação, a faixa e "Ver todas as tarefas". Nada rola a 1366 × 768.

**Sobre o `cancelRefetch: false` (`apps/web/src/areas/aluno/Inicio.tsx:70`):** conferi no código da biblioteca, e a mutação é equivalente, ou seja, nenhum teste consegue deixá-la vermelha.
- Em `node_modules/@tanstack/query-core/src/query.ts:408`, o cancelamento só acontece quando `this.state.data !== undefined && fetchOptions?.cancelRefetch`. Sem dado, o código vai para `#retryer.continueRetry()` e devolve a leitura que já está em andamento, com qualquer valor da opção.
- O botão só aparece com `atividades.isError && !lida`, e `lida` quer dizer `data !== undefined`. Então ele nunca existe com dado no cache, e a opção nunca é lida.
- O único jeito de a opção passar a contar seria tirar o `!lida`. Essa mutação já tem bloco, e o teste "uma releitura que falha não tira as tarefas da tela" a deixa vermelha.

O Implementador tem razão. A opção não pede outro cenário nem é bloqueante: é o padrão da casa, igual em cerca de 50 telas, e não guarda nenhuma regra que se possa remover sem que outro teste fique vermelho.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Registrar em `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`, seção "Mutações", que o `cancelRefetch: false` da linha 70 não tem bloco por ser mutação equivalente, citando `query.ts:408` e a guarda `!lida`. Assim a validação não o confunde com cláusula esquecida.
2. O teste do título confere só a classe `min-h-11` (no jsdom não há como medir), e não a altura de verdade. Medir o link do título com `boundingBox()` em `e2e/aluno-inicio.spec.ts`, como já se faz com o "Sair", provaria os 44 px no celular.
3. O teste do clique duplo prova o que o aluno vê (uma leitura só), mas quem faz isso é a biblioteca. Vale um comentário no próprio teste dizendo que ele protege o resultado, não a opção, para ninguém tomar a opção como provada por ele.

## revisor-geral · 3ª rodada · APROVADO · 2026-10-25 06:56:36 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido. Cobre typecheck, lint, segredo, dependências, unidade e alvo. Em `.processo/portao-3.log` os quatro casos de `e2e/aluno-inicio.spec.ts` passaram nos projetos `chromebook` e `celular`, e as 35 mutações ficaram vermelhas.
Bloqueantes: nenhum

As duas correções desta rodada foram feitas:
- **Título que quebrava a 360 px:** corrigido em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Inicio.tsx:28-29`. O `Link` continua `flex min-h-11`, então a altura de 44 px se mantém. O texto agora fica num `<span className="min-w-0 break-words">`, que pode encolher e quebrar. No e2e, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/aluno-inicio.spec.ts:16,41,49`, o caso de 360 px agora tem `TITULO_SEM_ESPACO` à vista e ainda termina em `larguraExcedente(page)` igual a 0 (`:65`). Esse caso passou no projeto `celular` (linha 1100 do log).
- **Nota sobre o `cancelRefetch: false`:** está em `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md:145-150`. Explica que a mutação é equivalente, citando `query.ts:408` e a guarda `isError && !lida`, e diz qual caso de teste prova o resultado.

As fotos estão coerentes com a tela pedida. Aparecem a saudação do Tutor com o selo "IA", a faixa de supervisão, "Para fazer" vazio com o texto do glossário e "Ver todas as tarefas". Nada fora do escopo aparece e nada rola de lado. As duas vitrines não semeiam atividade, então as fotos não mostram o título longo. Quem prova esse ponto é o e2e.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Inicio.test.tsx:208-210`: o teste confere os nomes das classes do `span`, não o comportamento. Quem prova de fato que o título quebra é o e2e. O caso de componente pode ficar só com o `min-h-11`, ou ganhar um comentário dizendo que o e2e é a prova da quebra.

## frontend-reviewer · 3ª rodada · APROVADO · 2026-10-25 06:56:37 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: `/aluno/inicio` no computador e no celular, escola cheia e vazia). As duas escolas mostram "Nenhuma tarefa por agora". A linha de tarefa, o aviso de avaliação e o título longo foram conferidos só pelo código e pelos testes. Os arquivos estão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/.processo/vitrine/`.
Estados: ok.
- Carregando: `EstadoCarregando` ("Carregando as suas tarefas…"), em `Inicio.tsx:68`.
- Vazio: `EstadoVazio`, só depois da leitura terminar (`Inicio.tsx:72`). Ele convida em vez de se desculpar: "O Tutor ajuda nas tarefas. Quando houver uma, ela aparece aqui", com "Ver todas as tarefas" logo abaixo.
- Erro: `EstadoErro` com "Tentar de novo" (`Inicio.tsx:69-71`). A saudação e a faixa de supervisão continuam de pé.
- Com dado: até três tarefas.

Acessibilidade:
- O `<h1>` "Início" fica só para o leitor de tela e a seção tem `aria-labelledby`.
- O foco visível e o contraste vêm dos componentes compartilhados; as fotos não mostram nada fora do padrão.
- Os links têm texto próprio.
- A faixa de supervisão usa `role=note`.
- O e2e roda `violacoesGraves` a 360 px.

Chromebook fraco:
- O Início faz uma leitura só, `minhas-atividades`, com `staleTime` de 60 s e sem reler ao voltar à aba. O `/v1/eu` já tinha sido lido pelo desvio da entrada.
- Não lê a conversa do Tutor, o que o e2e confirma (`leiturasDoTutor` vazio).
- A lista tem no máximo 3 itens (`MAXIMO_DE_TAREFAS_NO_INICIO`), então virtualizar não faz sentido.
- Não tem upload de imagem.
- Não vi teste com throttling de rede e de CPU nesta tarefa. É recomendação, porque a tela é leve e não toca no caminho quente.

Celular:
- Na foto a 360 px não há rolagem horizontal nem corte, e a barra de baixo e o "Sair" no topo estão à vista.
- Os links "Ver todas as tarefas" e "Pedir ajuda ao Tutor" têm `min-h-11 min-w-11` (44 px). O título da tarefa tem `min-h-11` (`Inicio.tsx:28`).
- A correção desta rodada resolveu a regressão. O `<Link>` é `flex min-h-11 min-w-0` e o título vai dentro de um `<span className="min-w-0 break-words">` (`Inicio.tsx:28-30`), então a palavra longa quebra dentro do cartão e o alvo continua com 44 px.
- O e2e a 360 px (`aluno-inicio.spec.ts:36-67`) usa um título de 56 caracteres sem espaço. Ele exige o título visível e `larguraExcedente` igual a 0.
- `Inicio.test.tsx:209-210` confere `min-w-0` e `break-words` no `span`.
- Nada depende de hover. O `hover:underline` é só realce.
- Nenhum fluxo exige o celular.

Ação oficial protegida: sim. O Início não tem ação oficial. Só navega para a tarefa e para o Tutor.

Conformidade:
- A saída de IA tem marca: "Tutor" com o selo "IA", pela `AssinaturaIA`.
- A faixa de supervisão é presa e sem como fechar (D8).
- A saudação é fixa, sem "de volta" e sem número de uso (D59).
- Não aparece dado de colega.
- A avaliação aberta é avisada antes de o aluno abrir a tarefa, e o caminho até o Tutor continua (D36).
- Os textos estão em português, sem termo técnico nem id na tela.

Bloqueantes: nenhum.

Recomendações:
- A vitrine cheia não semeia atividade aplicada, então a foto não mostra a linha de tarefa. Semear uma atividade (e uma avaliativa) deixaria a próxima revisão ver a tela com dado.
- O Início não tem teste com throttling de CPU e rede. Vale registrar na validação.
- Na barra de topo a 360 px o nome da escola aparece truncado ("Colégio sintético…"). Isso é da casca, não desta tarefa, e não perde ação.

## conformidade-reviewer · 3ª rodada · APROVADO · 2026-10-25 06:56:47 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum neste diff. A mudança é só de layout do título no Início do aluno e de testes. A tarefa não abre nem altera nenhum caminho de gravação em `Nota`. Todos com autor humano? sim (nenhum caminho novo)
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. Nenhuma saída de IA nova chega ao aluno.
Supervisão do tutor: ok. A faixa "Quem dá a aula acompanha como você usa o Tutor." continua no computador e no celular, na escola cheia e na vazia.
Autonomia declarada e visível: sim, sem alteração nesta tarefa.

Bloqueantes: nenhum

O que conferi nesta rodada, só no diff da rodada 2 para a 3:

- **`Inicio.tsx:28-29`**: o `Link` deixou de ter `break-words`. O título agora fica num `<span className="min-w-0 break-words">`. Isso não toca a regra 70: não há rótulo de IA, nota, conceito ou sugestão de nota no lugar. `grep` por `nota` e `conceito` em `Inicio.tsx` e `inicio.ts` não acha nada.
- **`Inicio.test.tsx:205-211`**: o teste confere `min-w-0` e `break-words` no span, além de `min-h-11` no link.
- **`e2e/aluno-inicio.spec.ts`**: o título sintético de 56 caracteres sem espaço (`TITULO_SEM_ESPACO`) é dado de teste e não traz dado pessoal.
- **`3_task.md`**: só ganhou notas de mutação e o registro das recomendações da 2ª rodada.

Nas quatro fotos (`aluno--aluno-inicio--computador.png`, `aluno--aluno-inicio--celular.png`, `vazia--aluno--aluno-inicio--computador.png`, `vazia--aluno--aluno-inicio--celular.png`):

- O Tutor aparece com o selo "IA" e com nome de função, sem se passar por pessoa (4a).
- Não aparece nota nem conceito.
- Nada induz uso: sem contador, sequência de dias ou conteúdo que começa sozinho. O "Sair" está à vista no cabeçalho do celular e no rodapé da barra lateral no computador (4b).
- Não há indicador de comportamento ou de emoção (item 7).

Recomendações:
- A recomendação da 2ª rodada continua aberta: semear na vitrine cheia uma atividade aplicada, uma delas avaliativa. Ela já está registrada em `TODO.md`. Sem isso, as fotos não mostram como o cartão de tarefa chega ao aluno, e é ali que um rótulo de nota ou de correção indevido apareceria.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Inicio.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Inicio.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/aluno-inicio.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/.processo/ordens/3_task-diff-r2-r3.patch

## privacy-guardian · 3ª rodada · APROVADO · 2026-10-25 06:57:21 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`

VEREDITO: APROVADO

Esta rodada mudou só a forma como o título da tarefa quebra na tela, um texto sintético no e2e e o documento da tarefa. Nenhum campo de pessoa, nenhum log e nenhum envio externo foram tocados.

Campos pessoais tocados: nenhum novo. Em `apps/web/src/areas/aluno/Inicio.tsx:29`, o título da atividade (`atividade.titulo`) agora fica dentro de um `<span className="min-w-0 break-words">`. É a mesma informação que já saía na 2ª rodada. Título de atividade é conteúdo do professor, não dado do aluno.
Fora da tabela de dados do docs/lgpd.md: nada.
Autorização por objeto: ok. Nenhuma rota, consulta ou DTO mudou. Nada em `apps/api` nem em `packages/` foi alterado desde a rodada aprovada, e a leitura continua sendo a das atividades do próprio aluno.
Logs: limpos. Não há `console.*` nem logger novo em `Inicio.tsx` nem em `e2e/aluno-inicio.spec.ts`.
Auditoria: não se aplica. A tela é o aluno lendo o próprio Início, e nenhuma ação da regra 20, item 10, foi tocada.
Envio externo: nenhum.
Seed/fixture: sintético. `TITULO_SEM_ESPACO = 'Exercícios_de_estequiometria_do_capítulo_três_parte_dois'` (`e2e/aluno-inicio.spec.ts:16`) e "Lista sintética N" não identificam ninguém.

Fotos (computador e celular, escola cheia e vazia):
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/.processo/vitrine/aluno--aluno-inicio--computador.png`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/.processo/vitrine/aluno--aluno-inicio--celular.png`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/.processo/vitrine/vazia--aluno--aluno-inicio--computador.png`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/.processo/vitrine/vazia--aluno--aluno-inicio--celular.png`

O que aparece nas fotos:
- **Nome:** só o nome do próprio aluno, no menu da pessoa ("Aluno Sintético Caio df86225e" e "Aluno Sintético Téo 993242f6"). Os dois são sintéticos.
- **Saudação:** só "Oi, Aluno.", sem nome nenhum.
- **O que não aparece:** matrícula, colega, nota e conversa.
- **Supervisão:** a faixa "Quem dá a aula acompanha como você usa o Tutor." está presente.

Nenhuma das fotos mostra a quebra do título longo, porque a vitrine cheia não tem atividade aplicada. Essa quebra só fica provada pelo e2e (`e2e/aluno-inicio.spec.ts:41-49`) e pelo teste de componente (`Inicio.test.tsx`). Para a minha regra a diferença não importa, porque o campo exibido é o mesmo.

Pergunta de fechamento: esta rodada não guarda nem envia dado novo. A resposta continua a de antes, pelo arquivo do titular e pelo `ExecucaoAgente`, que esta tarefa não tocou.

Bloqueantes: nenhum.

Recomendações:
- Semear na vitrine cheia uma atividade aplicada (já está no `TODO.md`), para a foto mostrar o título longo e o que o cartão expõe de verdade.

## test-engineer · 3ª rodada · APROVADO · 2026-10-25 06:58:42 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** nesta rodada, a correção do revisor-geral. Um título longo sem espaço quebra dentro do cartão a 360 px, a página não rola de lado, e o título continua com 44 px de toque.

**Cobertos:**

- **Se o span perde o `min-w-0 break-words`, o e2e fica vermelho.**
  - `larguraExcedente` (`e2e/__fixtures__/verificacoes.ts:73`) mede `documentElement.scrollWidth - clientWidth`. Nem `Tela`, nem a casca, nem `Inicio.tsx` têm `overflow-*`, então o que vaza do cartão aumenta o documento e é medido.
  - O título tem 56 caracteres ligados por `_`. O sublinhado (U+005F) é da classe AL da quebra de linha Unicode e não abre ponto de quebra, ao contrário do hífen. Em 16 px negrito são perto de 470 px, num espaço de uns 290 px. O excesso é muito maior que zero.
  - O caso fica vermelho pelo motivo certo. Com a mutação o título volta a uma linha, como na rodada 2, e o `not.toBeInViewport` do "Ver todas as tarefas" continuava passando nessa altura. A falha cai no `expect(await larguraExcedente(page)).toBe(0)`.
- **Bloco 3 (só tira o `min-w-0`, mantém o `break-words`) chega à cláusula sutil.** O `overflow-wrap: break-word` não muda a largura mínima do conteúdo (min-content). Sem `min-w-0`, o filho do flex não encolhe abaixo da palavra inteira e transborda. Só o e2e prova isso, e é o teste que o bloco cita.
- **O teste de componente também fica vermelho.**
  - Bloco 2 (tira o span): `querySelector('span')` devolve `null`, e o `toMatch` sobre `undefined` falha. É um caso que rodou e falhou, não um erro de carga.
  - Tirar só uma das duas classes também derruba as asserções novas (`Inicio.test.tsx`, linhas 213 a 215 da árvore nova).
- **Bloco 1 (`min-h-11` no Link)** está regravado com a linha atual, sem o `break-words` que saiu do Link. Os outros blocos que citam a linha do Link (o da troca de destino na linha 232) também foram atualizados, e o portão encontra o trecho.
- **O bloco de e2e roda no projeto certo.** Sem a linha `projeto:` ele roda no `chromebook`, mas o caso força a janela de 360 × 520, então a mutação é vista ali. O `--grep` com "a faixa de supervisão fica presa" acha o caso pelo começo do nome.
- **Os testes de componente passam:** `npx vitest run apps/web/src/areas/aluno/Inicio.test.tsx` deu 20 de 20. Não rodei o e2e.
- **Rodada anterior:** não havia correção exigida. A nota sobre o `cancelRefetch: false` está em "Mutações" (linhas 145 a 150 do documento) e confere com a guarda `isError && !lida` (`Inicio.tsx:69`).

**Bloqueantes:** nenhum.

**Recomendações:**

1. Não há bloco que tire só o `break-words` e deixe o `min-w-0` (`Inicio.tsx:29`). Pela minha análise o e2e pegaria: com o span encolhido, o texto sem quebra vaza dele e aumenta o documento. O teste de componente também pegaria, pela classe. Mas nenhuma mutação do portão prova isso sozinha: o bloco 2 tira o span inteiro e fica vermelho pela estrutura. Um quarto bloco, `<span className="min-w-0 break-words">` → `<span className="min-w-0">` contra `e2e/aluno-inicio.spec.ts › a faixa de supervisão fica presa`, fecha a cláusula que motivou a reprovação. Não bloqueia porque a linha já tem dois blocos e os dois testes a provam.
2. As fotos não mostram o cartão com título longo, porque a vitrine cheia não semeia atividade. Isso já está no `TODO.md`. Quando entrar, vale incluir lá um título sem espaço, para a validação ver a quebra na foto do celular.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Inicio.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Inicio.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/aluno-inicio.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/__fixtures__/verificacoes.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md
