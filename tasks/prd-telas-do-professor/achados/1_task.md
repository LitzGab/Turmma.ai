# Achados das revisões — `tasks/prd-telas-do-professor/1_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 23:18:21 · `tasks/prd-telas-do-professor/1_task.md`

VEREDITO: APROVADO

Tela vista: sim (6 fotos lidas). Li as 4 que vieram no prompt (computador com a lista aberta, escola cheia e vazia; celular nas duas). Refotografei o celular com a lista aberta e fotografei `/professor/turmas` no computador e no celular para ver o botão do sino fechado.

Estados: ok. Conferi carregando e erro pelo código e pelo e2e, porque a vitrine não os mostra.
- **Com dado:** a lista agrupa por turma, sem nome de aluno.
- **Vazio:** "Tudo em dia / Nada espera a sua decisão agora." Convida e não se desculpa.
- **Carregando:** `EstadoCarregando` em `Sino.tsx`.
- **Erro:** `EstadoErro` com "Tentar de novo".
- **Parcial:** o aviso diz o que não foi lido, e o vazio nunca aparece sem tudo lido.
- **Sem ano letivo:** aviso próprio.

Acessibilidade: ok.
- O botão tem nome "Esperando você, N", `aria-haspopup` e `aria-expanded`.
- O painel é um `<dialog>` modal: Esc fecha, o foco volta ao botão e o foco fica preso dentro.
- O contador é parado.
- O e2e roda o axe com 0 violações graves.
- Cada grupo é uma região rotulada pela turma.

Chromebook fraco: ok.
- O sino é `lazy()` num chunk próprio e a tela não espera por ele (`Suspense fallback={null}`).
- Não há leitura por tempo, foco ou rede (`SEM_LEITURA_SOZINHA`) e abrir a lista não lê.
- As leituras são em série, no máximo 12 turmas, e param na primeira recusa por limite.
- A contagem guarda só `{ quantidade, haMais }`, com `gcTime: 0`.
- Não há lista longa a virtualizar nem upload de imagem nesta tarefa.

Celular: ok.
- A 360 px não há rolagem lateral nem texto sobreposto. O sino está na barra de topo, com ícone e contador, e o e2e exige botão de pelo menos 44 px por 44 px.
- Não depende de hover nem de atalho. Em `PainelLado`, a folha de baixo tem até 88% da altura e o "Fechar" tem 44 px.
- A foto de 360 px da lista aberta não saiu: as quatro, inclusive a que refiz, mostram a lista fechada. Avaliei a lista aberta no celular pelo código e pelo e2e "360 px" (`e2e/professor-sino.spec.ts:241`). Esse teste confere que o diálogo não passa de 360 px, que não rola de lado e que não há violação grave.

Ação oficial protegida: sim. O sino só lista e leva à tela de cada item (revisar correção, decidir versão adaptada, pedidos de nome, confirmar turma). Nada é aprovado ou publicado dali.

Bloqueantes: nenhum.

Recomendações (não bloqueiam):
1. `apps/web/src/areas/professor/fila-do-professor.ts` (`itensDeEntrega`, linhas 98 a 112): "Correção para revisar" e "Versão adaptada para decidir" apontam para saída de IA, mas o item não diz que veio do Assistente. O `detalhe` é o título da entrega. Considere uma marca curta, como "Assistente de ensino", no `detalhe` ou no rótulo do grupo, para a regra 70 (item 4a) valer também aqui. Hoje o cartão do Início já traz "Adaptação".
2. `apps/web/src/componentes/CascaDaEscola.tsx:322`: no celular o sino ocupa espaço da barra e o nome da escola fica "Colég…" (foto `.processo/vitrine/professora--professor-turmas--celular.png`). O `truncate` é padrão da X1 e X2, o nome inteiro está no menu e a coordenação já tem o mesmo comportamento, então não bloqueia. Se quiser, mostre só o ícone do sino abaixo de 400 px.
3. `apps/web/src/areas/professor/SinoDoProfessor.tsx:11`: "Não li os pedidos de nome de 2 turmas" fala em primeira pessoa. Combina com a voz da tela, mas "Não foi possível ler…" é mais neutro.
4. O sino do professor e o contador "1" de "Seu time" no lado do Assistente de ensino se repetem no computador. É esperado: a tarefa 2.0 tira o contador de "Seu time".

Divergências com a spec: as 8 listadas na tarefa estão declaradas e justificadas. Conferi no diff que `Sino.tsx` só ganhou props opcionais e que a coordenação segue com o texto padrão.

Arquivos centrais:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/componentes/sino/Sino.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/SinoDoProfessor.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/fila-do-professor.ts`

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-17 23:18:26 · `tasks/prd-telas-do-professor/1_task.md`

VEREDITO: APROVADO

A tarefa 1.0 não tem bloqueante de regra 20. A mudança é só de tela: não cria campo, rota, tabela, log nem envio externo. O sino mostra à professora o número de pedidos de nome, nunca o nome de um aluno.

**Campos pessoais tocados:** nenhum campo novo. O sino lê o que a web já lia:
- as entregas pendentes (título e turma);
- os vínculos da professora (turma e disciplina);
- `GET /v1/turmas/:id/reivindicacoes`, de onde guarda só a quantidade e se há mais (`{ quantidade, haMais }`, em `apps/web/src/api/pedidos.ts:429-438`).

A lista com os nomes é jogada fora na própria leitura, antes de entrar no cache, e não pelo `select`.

**Fora da tabela de dados do `docs/lgpd.md`:** nada.

**Autorização por objeto:** ok.
- O servidor não mudou.
- A contagem só lê turmas em que a professora tem vínculo confirmado (`apps/web/src/areas/professor/fila-do-professor.ts:78-82`). Pendente, contestado e encerrado ficam de fora, e nessas turmas a API responderia como inexistente.
- Só a área do professor monta o `SinoDoProfessor` (`apps/web/src/areas/professor/rotas.tsx:550,586-588`).
- O e2e "permissão" (`e2e/professor-sino.spec.ts:168`) prova que a coordenação, entrando na mesma aba depois da professora, não chama `/v1/entregas`, `/v1/meus-vinculos` nem `/reivindicacoes`, e não vê os itens dela. Conferi esses caminhos em `api/vinculos.ts:5` e `api/entregas.ts:14`.
- O e2e "recomeço" (`e2e/professor-sino.spec.ts:196`) prova que, depois da troca de escola, não sobra na tela nem no cache nenhum id ou nome da escola A, mesmo com a resposta atrasada. Quem garante isso é o `gcTime: 0` da contagem.

**Logs:** limpos. Não há `console` nem `logger` nos arquivos novos ou alterados.

**Auditoria:** não se aplica. A professora lendo os pedidos da própria turma não está na lista do item 10. O texto da contagem lembra que a leitura da coordenação continua auditada e com finalidade (`consultaPedidosDaTurma`), e a decisão de pedidos não mudou.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. São "Ana Sintética do sino", "Bruno Sintético do sino", matrícula `S<uuid>` e "Professora Sintética", em `e2e/__fixtures__/professor/sino.ts:39-42` e `SinoDoProfessor.test.tsx:25-26`.

**Fotos:**
- **Computador, escola cheia:** aparecem o grupo "2ºB C5064CF7" e o item "Versão adaptada para decidir · Estequiometria: versão adaptada sintética". Não há nome nem matrícula de aluno. Esses textos vêm de `fila-do-professor.ts:101` e `:89`.
- **Computador, escola vazia:** "Tudo em dia", sem dado de pessoa.
- **Celular, as duas escolas:** as fotos saíram com a lista fechada, então a lista em 360 px não foi conferida na imagem. O conteúdo é o mesmo componente, e o e2e de 360 px cobre a largura.

**Pergunta de fechamento:** a resposta não muda com esta tarefa. Ela não guarda dado novo e não envia nada a ninguém.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Contar sem baixar os nomes.** `apps/web/src/api/pedidos.ts:433` baixa a página nominal inteira só para contar (até `PEDIDOS_POR_LEITURA` nomes por turma, até 12 turmas). É dado que a professora já pode ver e que não fica no cache, mas os nomes passam pela memória da aba sem necessidade. Uma rota ou parâmetro só de contagem, em spec futura, tiraria isso de vez.
2. **Teste de "sem nome no cache" mais firme.** `apps/web/src/areas/professor/SinoDoProfessor.test.tsx:147` e `:162` procuram só `'Sintético'`, e a Ana é "Ana Sintética". Hoje a mutação fica vermelha porque o Bruno vaza junto. Procurar os dois nomes completos deixa o teste de pé mesmo com um aluno só na fixture.
3. **Título escrito pela professora.** O detalhe do item é `entrega.titulo` (`fila-do-professor.ts:96,101`), texto que ela mesma escreve. Isso já aparecia no Início, então não é exposição nova. Continua dependendo do aviso `AVISO_DE_TEXTO_SEM_ALUNO` na hora de escrever.
4. **Refazer as fotos do celular.** Elas devem mostrar a lista aberta, como evidência para o `/validar`. A qualidade visual é do `frontend-reviewer`.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-17 23:18:36 · `tasks/prd-telas-do-professor/1_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma. A tarefa só mexe na web e não traz migration, tabela nem coluna nova.

Queries verificadas:
- `consultaContagemDePedidos(turmaId)` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/api/pedidos.ts:403-412`. Usa a rota que já existia, `GET /v1/turmas/:id/reivindicacoes?limite=`, sem `escolaId` na query nem no corpo. O cache guarda só `{ quantidade, haMais }`, e o `gcTime: 0` tira do cache, depois da troca de escola, a contagem que tem o id de turma da escola anterior.
- `consultaEntregasPendentes` (`/v1/entregas?estado=pendente`) e `consultaMeusVinculos` (`/v1/meus-vinculos`) não mudaram. Nas duas, a escola e o ano vêm do token.
- A contagem é invalidada só por chave exata e só quando `quem === 'professor'` (`pedidos.ts:429-432`). Uma releitura do sino não alcança a lista nominal.
- `useFilaDoProfessor` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/fila-do-professor.ts:251-325`. Só lê turmas com vínculo `confirmado` vindo de `meus-vinculos`, que a API já limita à escola e ao ano do token. Nenhuma turma vem de parâmetro do cliente.
- Nenhum endpoint novo e nenhum `@SemEscopo()` novo.

Teste de isolamento: presente e efetivo, no que cabe à web.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-sino.spec.ts:196-239`, o teste do recomeço. A professora troca de escola com a contagem da turma A ainda no ar. O teste confere que o sino de B não mostra itens nem o número de A, e que o cache de consultas não contém o id da escola, do usuário, das turmas nem dos vínculos de A. Ele quebra se a troca de escola deixar de esvaziar o cache (`resetQueries` em `main.tsx`) ou se o `gcTime: 0` sair, e a mutação "sem ninguém olhando" cobre o segundo caso.
- `professor-sino.spec.ts:168-194`, o teste de permissão: a coordenação que entra na mesma aba não chama `/v1/entregas`, `/v1/meus-vinculos` nem `/reivindicacoes`, e não vê os itens da professora.
- O escopo no servidor dessas rotas já existia e esta tarefa não o altera.

Bloqueantes: nenhum.

Recomendações:
- `fila-do-professor.ts:262`. O estado `liberadas` (`useState(1)`) não volta a 1 na troca de escola. O `SinoDoProfessor` continua montado, porque a área do professor é a mesma nas duas escolas, então a escola B pode ler até `liberadas` turmas ao mesmo tempo em vez de uma de cada vez. Não vaza dado, mas quebra a leitura em série da regra 80. Fica para o `infra-guardian`, por exemplo voltando `liberadas` a 1 quando a fila volta a `carregando`, como já se faz com o `atualizadoEm`.
- Depois do `resetQueries` da troca, a contagem da turma de A ainda montada pode ser relida uma vez com o token de B antes de o observador sair. O servidor responde como inexistente e nada fica no cache (o e2e prova isso), mas mandar o id de uma turma de A com a credencial de B é desnecessário. Vale registrar no `/retro` se aparecer em outras filas.

## infra-guardian · 1ª rodada · REPROVADO · 2026-10-17 23:19:32 · `tasks/prd-telas-do-professor/1_task.md`

VEREDITO: REPROVADO
Caminho quente tocado: login (a casca do professor, que toda professora abre às 7h30) e fila de leituras da API
Rate limit: ok
Fila e prioridade: ok (nenhum job novo)
Concorrência: protegida na decisão. A leitura em série quebra em `apps/web/src/areas/professor/fila-do-professor.ts:262-266`
Índice e paginação: ok (nenhuma query nova; usa rotas que já existem e são paginadas)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (a techspec 7c não muda o cenário)

Bloqueantes:

1. **A série e a parada na primeira recusa por limite só valem na primeira montagem.** Ponto: `apps/web/src/areas/professor/fila-do-professor.ts:262` e `:264`.
   - **O que está errado:** o número de turmas já liberadas é guardado em `useState(1)` e nunca volta a 1. As turmas já liberadas ficam todas ativas ao mesmo tempo em `useQueries`. Dois caminhos disparam todas juntas, sem esperar uma pela outra e sem parar no 429:
     - **Troca de escola e sessão nova.** A área do professor continua montada. O `resetQueries()` de `apps/web/src/main.tsx:31-33` refaz em paralelo todas as contagens ativas. Primeiro vão as turmas da escola anterior, já com o token novo, e voltam 404 à toa. Quando os vínculos novos chegam, as N primeiras turmas da escola nova saem de uma vez, porque o número liberado continua o mesmo.
     - **Volta da API depois de uma queda.** O `invalidateQueries()` global de `apps/web/src/main.tsx:39-41` faz o mesmo: até 12 leituras simultâneas por aba de professora, com a escola inteira voltando no mesmo segundo.
   - **Por que bloqueia:** a subtarefa 1.3 manda "Leituras em série … parando na primeira recusa por limite". A techspec, §7c e §12, usa justamente a série e a parada como a proteção do limite por usuário, que ela própria marca como `⚠️ NÃO VERIFICADO`. Hoje essa proteção some nos dois momentos em que a carga chega toda de uma vez. Nenhum teste cobre esses caminhos: os de série, em `SinoDoProfessor.test.tsx:230-315`, só olham a primeira montagem e o "Atualizar".
   - **Correção exigida:**
     - Qualquer releitura que não vem de um clique precisa manter a série e a parada no 429. Isso vale para o reset de sessão, a troca de escola e a invalidação global na volta da API. Por exemplo: voltar a série a 1 quando a sessão ou a lista de turmas muda, e não deixar uma invalidação global refazer mais de uma contagem por vez.
     - Precisa de um teste de componente com duas partes. (a) Depois de `cliente.resetQueries()` com uma lista de turmas nova, as leituras de contagem saem uma de cada vez, e as turmas da escola anterior não são relidas. (b) Depois de `cliente.invalidateQueries()` com a 2ª leitura recusada por 429, nada sai da 3ª em diante.
     - Precisa de um bloco de mutação no documento da tarefa que deixe esse teste vermelho.

Recomendações:
- Incluir no cenário do teste de carga as até 14 leituras por professora que abre a casca. Hoje ele está declarado "inalterado", mas a conta de cerca de 28 leituras por minuto contra o limite de 120 só existe no papel.
- A foto de 360 px saiu com a lista fechada: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/.processo/vitrine/professora--professor-nova-conversa--button-name-Esperando-você--celular.png`. O clique provavelmente acertou outro botão com o mesmo nome. Vale o `frontend-reviewer` conferir se existe um segundo botão "Esperando você", escondido, no celular. O e2e de 360 px em `e2e/professor-sino.spec.ts` abre a lista, então isso não bloqueia aqui.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-17 23:20:22 · `tasks/prd-telas-do-professor/1_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

O que conferi para chegar aqui:

- **Escopo:** a tarefa não tira "Seu time" nem o pé do sino (isso é da 2.0) e não mexe no Início além do import (3.0). Também não lê `?aba=` na turma, que é da 10.1.
- **Divergências:** as que mudam a arquitetura estão na `techspec.md`, nas §2, §5 e §12. São quatro: a montagem por área sem `sino-do-papel.ts`, as três props opcionais com `grupo` no item, a saída de `leitura-do-sino.ts` e o `gcTime: 0`. As linhas que citam só o `1_task.md` são ajustes de teste, porque `Vinculo` não traz o ano letivo. Não há `cenarios.md` nesta spec.
- **Fotos:** o computador cheio mostra o item agrupado pela turma e o link para a tela dele, sem nome de aluno. O vazio mostra "Tudo em dia" com o texto da professora e sem o link da escola.
- **Foto do celular com a lista fechada:** não é falha da tela. `tools/vitrine/foto.ts:186` clica na largura do computador e só depois muda para 360 px. A âncora do sino passa para a barra de topo, o portal remonta e a lista fecha. A abertura a 360 px está provada pelo teste `e2e/professor-sino.spec.ts:241`.

Recomendações:

1. **A lista fecha quando a largura cruza 768 px.** Quem gira um tablet com a lista aberta perde a lista, porque o `Sino` remonta na âncora nova (`apps/web/src/areas/professor/SinoDoProfessor.tsx:27`). Não bloqueia. Vale registrar e fazer a vitrine clicar já na largura da foto.
2. **O valor de "liberadas" nunca volta a 1** (`apps/web/src/areas/professor/fila-do-professor.ts:262`). Hoje a troca de escola passa por `/` e remonta a área, então a série recomeça. Se a troca deixar de remontar, até N leituras de turma saem juntas. Zerar o valor quando o conjunto de turmas muda deixa a série independente disso.
3. **O estado tem dois nomes.** A Tech Spec §5 e a subtarefa 1.3 dizem `incompleto`, e o código usa `parcial`, que é o `SituacaoDoSino` da X2. Alinhar o texto da spec ao nome do código.
4. **Destino da correção sem atividade aplicada.** Quando `atividadeAplicadaId` vem nulo, a correção leva a `/time/assistente` (`fila-do-professor.ts:99`). A tabela da §5 não prevê o caso: vale uma linha nela.
5. **Painel lê pela coordenação.** O `Painel.tsx` importa `SEM_LEITURA_SOZINHA` pela reexportação de `fila-da-coordenacao.ts:169`. Importar direto de `componentes/sino/leitura-do-sino.ts` tira a reexportação, que é um segundo caminho para a mesma constante.

Arquivos principais:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/fila-do-professor.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/SinoDoProfessor.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/api/pedidos.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/componentes/sino/Sino.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/componentes/sino/leitura-do-sino.ts

## test-engineer · 1ª rodada · REPROVADO · 2026-10-17 23:21:50 · `tasks/prd-telas-do-professor/1_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- a conta, tipo a tipo
- sem nome no cache, em (a) e (b)
- a chave da decisão
- estados
- não insiste, em (a) e (b), com o caso de controle
- "Atualizar" e "Tentar de novo" por chave exata
- mais de 12 turmas
- sem ano letivo em curso
- vínculo de ano encerrado
- recusa por limite
- duas disciplinas na mesma turma
- permissão, na unidade e no e2e
- entrega decidida em outra aba
- um item de cada tipo
- recomeço: troca de escola e segunda pessoa
- 360 px e axe
- Pelas regras 80 e 40: leitura em série de verdade, com o número de leituras simultâneas medido, e não só a ordem.

**Cobertos:**
- Os 77 testes passam em `npx vitest run` nos cinco arquivos.
- A conta tipo a tipo, com o contestado, as duas disciplinas e "100 ou mais", está em `fila-do-professor.test.ts`.
- Os dois casos de "sem nome no cache" estão cobertos. A mutação `...lista` está provada em três testes.
- A chave da decisão está coberta: chave exata, só com `quem === 'professor'` e também na falha no meio do lote.
- Os estados estão cobertos: carregando, "Tudo em dia" só com tudo lido, erro, leitura parcial em palavras, e Esc devolvendo o foco.
- "Não insiste" está coberto em (a) e (b), com controle que relê e `afterEach` que restaura os dois gerenciadores.
- "Atualizar" e "Tentar de novo" estão cobertos sobre a `ListaDePedidos`, com o `dataUpdatedAt` da lista nominal sem mudar.
- Com 14 turmas saem 12 leituras, em ordem de nome, com `maximo === 1`. A concorrência é medida de verdade.
- A 429 na 3ª leitura está coberta, com a primeira resposta segurada, e a 429 na releitura também.
- "Sem ano letivo" está coberto. A divergência registrada explica por que os vínculos são lidos.
- "Vínculo encerrado" está coberto, pela divergência registrada.
- A permissão está coberta pelo aluno na unidade e pela coordenação na mesma aba no e2e.
- No e2e estão cobertos: a entrega decidida em outra aba, os quatro destinos com `semAnimacao`, a troca de escola com a contagem atrasada por `page.route` e a verificação do cache, e 360 px com axe.
- Não há `.skip`. A IA não entra na tarefa.

**Bloqueantes:**

1. **A leitura em série quebra depois da troca de escola, e nenhum teste prova a série no recomeço.** O problema está em `apps/web/src/areas/professor/fila-do-professor.ts:262` (`useState(1)`) e na linha 266.
   - `liberadas` só cresce e nunca volta a 1.
   - Na troca de escola, `AreaDoPapel` mantém a área montada: o `Route nest` é o mesmo e o `papelConhecido` é mantido. Então o `SinoDoProfessor` não desmonta.
   - O `resetQueries` do `main.tsx` esvazia as consultas, mas não esse estado. Uma professora com 12 turmas na escola A chega na escola B com `liberadas = 12`, e as 12 leituras de pedidos de B saem ao mesmo tempo. É exatamente a carga que a série e o teto existem para evitar (regra 80; seção 7c da Tech Spec).
   - O e2e de recomeço não apanha isso, porque a cena tem uma turma confirmada só.
   - **Correção:** zerar a série quando o conjunto de turmas a ler muda (ou por sessão ou escola), e escrever um teste de componente. Nele, a escola A tem 12 turmas lidas; depois vem `cliente.resetQueries()`, e `meus-vinculos` responde as 12 turmas de B. A asserção é `maximo === 1` nas leituras de B.
   - O teste precisa de um bloco de mutação que tire o reinício.

2. **Falta a "segunda pessoa" do recomeço.** A linha "recomeço" da tabela pede: "troca de escola **e segunda pessoa** não veem o sino anterior". Em `e2e/professor-sino.spec.ts:196-239` só existe a troca de escola.
   - O teste de permissão (linhas 168-194) põe a coordenação na mesma aba, mas ela não monta o `SinoDoProfessor`. Então ele não prova nada sobre o cache do sino da professora.
   - Com `staleTime` de 5 min, o risco é real: uma segunda professora veria a contagem e as entregas da primeira se o cache sobrasse.
   - **Correção:** um e2e em que a professora A, com 4 itens, clica em Sair e uma professora B, da mesma escola e com zero itens ou outros, entra na mesma aba. A asserção: o nome do sino não é "Esperando você, 4", nenhum item de A aparece, e o cache não guarda os ids das turmas nem dos vínculos de A.

3. **Há cláusulas novas sem bloco de mutação**, todas em `apps/web/src/areas/professor/fila-do-professor.ts`. Quase todas já têm teste que ficaria vermelho, e só falta o bloco:
   - linha 81: o `.sort(porNome)` das turmas, que é a "ordem de nome" do teto;
   - linha 86: o filtro `estado === 'pendente'` das entregas;
   - linha 87: a ordem por `criadaEm`;
   - linha 147: `quantidade === 0` não vira item;
   - linhas 162-163: a ordem por grupo e tipo, com "Outras turmas" por último;
   - linhas 165-166: carregando enquanto alguma leitura não respondeu;
   - linha 167: sem ano letivo a fila é `parcial`;
   - linha 168: `erro` só quando as entregas e os vínculos falham juntos;
   - linhas 171-174: entregas e vínculos com erro ou truncados entram em `naoLeu`. É o núcleo do "nunca Tudo em dia sem ter lido tudo";
   - linha 175: a turma com erro ou não lida conta em `naoLeu`.

   Dois casos não têm nem teste:
   - **linha 304 (`vinculosAReler`):** o teste "Tentar de novo" não confere quantas vezes `/v1/meus-vinculos` foi lido. É preciso acrescentar `expect(vezesQue(rede, '/v1/meus-vinculos')).toBe(antes)` e um bloco que troque a condição por `true`.
   - **linha 286 (sai o "Atualizado às" da leitura anterior quando a fila volta a carregar):** é regra de recomeço, porque a hora era de outra escola, e não há teste nem bloco.

**Recomendações:**
- `fila-do-professor.ts:261`: o `semAnoLetivo ? [] :` é, pelo próprio documento, impossível de deixar vermelho. Tire-o, ou deixe claro que é só defesa.
- `sino-por-area.test.tsx:58-65`: no controle da coordenação, afirmar que `/v1/entregas` e `/v1/meus-vinculos` não são chamados. É a parte "a coordenação não recebe `SinoDoProfessor`" da linha de permissão na unidade, que hoje só o e2e prova.
- "Tentar de novo" a partir do estado `erro` (entregas e vínculos falhando) não tem teste de componente. A tabela pede "incompleto e depois erro".
- `pedidos.test.ts:58`: o nome do teste promete que a lista nominal não é tocada, mas não há asserção sobre ela.
- Foto do celular (`.processo/vitrine/professora--professor-nova-conversa--button-name-Esperando-você--celular.png`): ela saiu com a lista fechada, embora o e2e de 360 px abra a lista e passe. Vale o `frontend-reviewer` confirmar se é coisa da vitrine ou se o clique não abre no celular.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/fila-do-professor.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/SinoDoProfessor.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/fila-do-professor.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/api/pedidos.test.ts`
[… 2 linhas cortadas]

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-17 23:45:15 · `tasks/prd-telas-do-professor/1_task.md`

VEREDITO: APROVADO

Tela vista: sim (4 fotos lidas: computador e celular, escola cheia e vazia). As fotos de 360 px saíram com a lista fechada, como o prompt avisou. A abertura da lista a 360 px é provada pelo e2e `e2e/professor-sino.spec.ts`, que confere a ausência de rolagem de lado e de violação grave. Não rodei esse e2e, e a rodada só audita o diff.

Estados: ok. O código tem carregando ("Carregando o que espera você…"), vazio, erro com "Tentar de novo", parcial e com dado.
- **Vazio:** "Tudo em dia / Nada espera a sua decisão agora." convida e não se desculpa. Na escola vazia o Início mostra o campo do Assistente, sem tela em branco.
- **Erro:** o novo teste de "Tentar de novo" prova que a fila sai do erro relendo entregas e vínculos uma vez cada.
- **Parcial:** o aviso agora diz "Não foi possível ler …", sem a primeira pessoa e com a próxima ação à vista.

Acessibilidade: ok. O sino tem nome acessível com contagem ("Esperando você, 1", "…, nada", "…, não carregou"). O painel é um diálogo nomeado, com botão de fechar e rótulos legíveis. O contraste está dentro da pele do mockup.

Chromebook fraco: ok. A releitura das contagens agora acontece em série, uma turma de cada vez, e para na primeira recusa por limite. Isso vale também na troca de escola e na invalidação global, e os testes `rastrear` provam que o máximo de leituras ao mesmo tempo é 1. Uma contagem já lida fica desligada, então o reset e a invalidação global não disparam todas juntas.

Celular: ok. A 360 px o sino fica no cabeçalho, com 44 px de altura ou mais e legível, sem corte. O botão "Sair" e a navegação inferior continuam intactos. Nada depende de hover. O fluxo não exige o celular.

Ação oficial protegida: sim. O sino só leva à decisão ("Ver e decidir"), e nada oficial acontece nele.

Correções da rodada anterior: não havia nenhuma exigida. As recomendações foram atendidas:
- **Privacidade:** os testes agora afirmam que o cache do sino não guarda nome de aluno.
- **Texto:** o aviso foi reescrito, e o código, os testes, a galeria e o teste do sino foram atualizados juntos.
- **Recomeço de sessão:** o e2e novo prova que a segunda professora da mesma aba não herda sino, turmas nem contagens da primeira. O cache é conferido sem id nem nome da primeira.
- **Hora de "Atualizado às":** o teste prova que ela não fica na tela enquanto a fila recarrega.
- **Coordenação:** o teste novo prova que a área dela não lê as rotas da professora.

Bloqueantes: nenhum.

Recomendações:
- Em `apps/web/src/areas/professor/fila-do-professor.ts`, a contagem lida fica desligada e só é relida por clique ou por decisão de pedido. Vale registrar no `/retro` se a professora que deixa a aba aberta por horas vê uma contagem velha.
- Na escola vazia, o Início a 360 px não tem nenhum bloco abaixo do campo do Assistente. Como a escola não tem turma, isso fica fora do argumento do feed, mas a spec de Início pode ganhar um convite a montar a primeira turma.
- A vitrine fotografa o celular com a lista fechada. Vale uma opção para clicar depois de encolher a tela, para o revisor ver a lista a 360 px.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-17 23:45:38 · `tasks/prd-telas-do-professor/1_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova. O diff mexe só no frontend (`apps/web`) e nas fixtures de e2e. Nenhuma migration, repository ou endpoint mudou.

Queries verificadas:
- Contagem do sino (`consultaContagemDePedidos`) em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/fila-do-professor.ts`. A contagem que já respondeu agora fica desligada. Isso não deixa dado de outra escola no cache: na troca de sessão ou de escola, `main.tsx:32` chama `resetQueries`, que zera também as consultas desligadas. Depois disso a contagem volta a "pending", lê de novo a partir dos vínculos do token novo, e a série recomeça porque o conjunto de turmas mudou.
- Invalidação da contagem depois de uma decisão, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/api/pedidos.ts:121-128`. Ela usa a chave exata da turma decidida. A releitura só sai se o sino estiver olhando. Não toca a lista nominal da outra turma, e `pedidos.test.ts` agora tem uma asserção que prova isso.
- Releitura em série (`relerEmSerie`). Ela chama `fetchQuery` por chave exata de turma, e a chave vem só dos vínculos devolvidos pela API autenticada. Nenhum `escolaId` é aceito do cliente.

Teste de isolamento: presente e efetivo.
- O e2e novo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-sino.spec.ts:241-266` põe uma segunda professora da mesma escola na mesma aba, sem recarregar. Ele quebraria se o reset de sessão não esvaziasse as contagens desligadas: a quantidade "4", o nome da turma e os ids da primeira professora apareceriam no cache e na tela.
- O teste de unidade da troca de escola, em `SinoDoProfessor.test.tsx` (bloco "troca de escola com o sino montado"), quebraria se uma turma da escola anterior fosse lida de novo.
- O teste de troca de escola entre tenants que já existia na 1ª rodada continua valendo.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/fila-do-professor.ts:362-368` decide se a consulta fica ligada lendo `cliente.getQueryState` durante a renderização. Esse acoplamento ao cache não está escrito como invariante na techspec. Se alguém trocar `resetQueries` por `invalidateQueries` em `main.tsx`, a contagem antiga fica no cache sem ser lida de novo. Hoje os testes de recomeço pegariam isso, mas vale um comentário em `main.tsx` apontando a dependência.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-17 23:45:42 · `tasks/prd-telas-do-professor/1_task.md`

**VEREDITO: APROVADO**

Esta foi a 2ª rodada. A 1ª saiu APROVADO sem nenhuma correção exigida, então não havia correção a conferir. Auditei o diff de `464b050` a `4eaa4a2` e o que ele afeta. A mudança fica toda no frontend e nos testes; nada mexe em API, migration, log ou envio externo.

- **Campos pessoais tocados:** nenhum campo novo. O diff mexe em como a contagem de pedidos de nome é lida e relida no sino da professora. A contagem continua descartando a lista dentro da própria leitura e guarda só `{ quantidade, haMais }`, sem nome de aluno (`apps/web/src/api/pedidos.ts`, `consultaContagemDePedidos`). As duas formas novas de reler passam por essa mesma leitura: `fetchQuery` em `invalidarAContagem` (pedidos.ts:131) e em `relerEmSerie` (`apps/web/src/areas/professor/fila-do-professor.ts`:389). Por isso nenhuma das duas põe nome no cache.
- **Fora da tabela de dados do `docs/lgpd.md`:** nada.
- **Autorização por objeto:** ok, nenhuma rota nova nem alterada. O teste novo (`apps/web/src/api/pedidos.test.ts`:283-288) prova que decidir um pedido não marca como velha a lista com nomes de outra turma. O teste novo em `apps/web/src/sino-por-area.test.tsx`:65-67 prova que a coordenação não dispara as leituras da fila da professora.
- **Logs:** limpos. Nenhum log foi adicionado.
- **Auditoria:** nada mudou. O professor não lê de forma auditada, e a leitura auditada da coordenação continua fora do sino.
- **Envio externo:** nenhum.
- **Seed/fixture:** tudo sintético. `criarProfessoraNaEscola` (`e2e/__fixtures__/sessao.ts`:451-476) cria nome com marca aleatória e e-mail `@educa.invalid`. É uma conta de equipe, e professor pode ter e-mail.
- **Fotos da tela:**
  - Escola cheia, computador: aparecem a turma e o título do material ("2ºB c5064cf7", "Versão adaptada para decidir", "Estequiometria: versão adaptada sintética"), sem nome nem matrícula de aluno, só a turma da própria professora.
  - Escola vazia: aparece "Tudo em dia" e nada de outra pessoa.
  - Celular: as duas fotos saíram com a lista fechada, como foi avisado. Mostram o sino e a home sem dado de aluno.
- **Isolamento ao trocar de pessoa ou de escola:** a série de leituras agora recomeça quando o conjunto de turmas muda (`fila-do-professor.ts`:352-356). O e2e "recomeço" (`e2e/professor-sino.spec.ts`:497-522) prova que a segunda professora, na mesma aba e sem recarregar, não vê no cache, no texto da tela nem no sino nada da primeira: id, turmas, vínculos e nome. O teste "a hora da leitura anterior" prova que o "Atualizado às" da sessão anterior não fica na tela.
- **Pergunta de fechamento:** a resposta não mudou nesta rodada. O diff não guarda nada novo sobre aluno e não envia nada a lugar nenhum.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `apps/web/src/api/pedidos.ts`:131, a releitura depois de uma decisão sai fora da série e da parada por limite. É uma leitura só, de uma turma, então não pesa. Vale citar isso no comentário, para ninguém generalizar o padrão para várias turmas.
2. O e2e "recomeço" confere o cache e o texto da tela. Um teste unitário poderia conferir também que o estado `serie.conjunto` recomeça quando o sino continua montado entre duas sessões. Hoje isso só está coberto pelo teste de troca de escola com `resetQueries`.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-17 23:46:09 · `tasks/prd-telas-do-professor/1_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A tarefa só mexe nas leituras que a web já faz à API, sem rota, fila, migration nem IA nova. É caminho quente só pelo volume de leituras por aba.
Rate limit: ok. O back não mudou. A série e a parada no 429 agora valem também no reset de sessão e na invalidação global.
Fila e prioridade: ok (não se aplica, sem job novo)
Concorrência: protegida
Índice e paginação: ok (sem query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica, sem código de servidor)
Bloqueantes: nenhum

**A correção exigida na 1ª rodada foi feita.**
- **O conserto.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/fila-do-professor.ts:354-368`, a série agora pertence ao conjunto de turmas e volta a 1 quando ele muda. A contagem que já respondeu fica desligada (`enabled` só enquanto `pending` ou sem estado).
- **O que muda às 10h.** O `resetQueries()` e o `invalidateQueries()` de `main.tsx` deixam de reler as contagens juntas. Durante o reset os vínculos ficam vazios, então as turmas da escola anterior saem da lista e a série recomeça. Depois disso, quem relê uma contagem é o clique (`fetchQuery`, uma turma por vez, parando no 429, linhas 384-393) ou a decisão de um pedido, que relê só a turma decidida (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/api/pedidos.ts:121-127`).
- **Os testes.** Os três testes novos em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/SinoDoProfessor.test.tsx:205-269` cobrem as partes (a) e (b):
  - troca de escola: 12 leituras da escola nova, uma de cada vez, e nenhuma da anterior;
  - invalidação global com as mesmas turmas: nenhuma contagem relida;
  - invalidação global com turmas novas: a 2ª recusada por 429 impede a 3ª.
- **As mutações.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/prd-telas-do-professor/1_task.md` tem um bloco de mutação para cada teste: o recomeço da série (l. 347), a contagem desligada (l. 355), a releitura pela decisão (l. 369) e a parada no 429 na invalidação com turmas novas (l. 503).
- **O que rodei.** `SinoDoProfessor.test.tsx` passa inteiro aqui (25 testes). `pedidos.test.ts` e `fila-do-professor.test.ts` não carregam neste checkout porque o `@educa/shared` não está compilado. Isso é do ambiente, não da tarefa, e não compilei para não gravar arquivo. Confira que o portão da tarefa rodou com o shared compilado.

Recomendações:
- Uma contagem que ainda estava sendo lida na hora do reset sai mais uma vez, com o token novo, e volta 404. É no máximo uma leitura por troca de sessão, mas dá para cancelar com `cancelQueries` da chave `['pedidos-da-turma', 'contagem']` antes do reset.
- Na volta da API, uma contagem que falhou por erro que não é 429 (por exemplo 503) continua com erro e deixa a fila parcial até a professora clicar em "Atualizar". É questão de experiência de uso, não de carga; vale levar ao `/validar`.
- Continua valendo a recomendação da 1ª rodada, que já está no TODO.md: pôr no cenário do teste de carga as até 14 leituras por professora que abre a casca.
- As fotos de 360 px seguem com a lista fechada, por limite da vitrine. A abertura a 360 px é provada pelo e2e.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-17 23:46:45 · `tasks/prd-telas-do-professor/1_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

**O que auditei nesta rodada**
- **Bloqueante 1 do `infra-guardian` (a série valia só na primeira montagem): resolvido.**
  - A série agora pertence ao conjunto de turmas e recomeça na primeira quando esse conjunto muda (`fila-do-professor.ts:262-266`).
  - A contagem que já respondeu fica desligada (`:271-277`). Por isso o `resetQueries` e o `invalidateQueries` de `main.tsx` não a releem.
  - Isso também fecha a segunda recomendação do `tenancy-guardian`: depois do reset, nenhuma turma da escola A é relida com o token da escola B.
  - Testes de componente para o reset, para a invalidação global e para a invalidação global com turmas novas e 429 na 2ª leitura. Cada um tem bloco de mutação.
- **A decisão continua tirando o item do sino.** `invalidarAContagem` (`pedidos.ts:122-128`) invalida sem reler e, se o sino está observando, relê a contagem daquela turma por `fetchQuery`. Isso compensa o `enabled: false`. Tem teste ("decidir um pedido relê a contagem…") e mutação.
- **As três tentativas de setState durante a renderização não entram em laço.** Quando o conjunto muda e a primeira turma já foi lida, as duas chamadas de `definirSerie` convergem para `{conjunto, 2}`. O crescimento para no tamanho de `turmasAoLer`.
- **A divergência está registrada nos dois lugares que precisavam.** `enabled: false` e a série que recomeça estão na `techspec.md` §5 ("A série vale em toda leitura que não vem de um clique") e na tabela de divergências do `1_task.md`. A spec não tem `cenarios.md`. A troca de `incompleto` por `parcial` e a linha nova para a correção sem atividade aplicada alinham o texto ao código, como o revisor-geral recomendou na 1ª rodada.
- **A tarefa não passou do escopo.** `criarProfessoraNaEscola` e o e2e da segunda pessoa são o que o `test-engineer` exigiu. Nada da 2.0, da 3.0 ou da 10.1 entrou.
- **Fotos.** As do computador (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/.processo/vitrine/professora--professor-nova-conversa--button-name-Esperando-você--computador.png` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/.processo/vitrine/vazia--professora--professor-nova-conversa--button-name-Esperando-você--computador.png`) mostram:
  - a escola cheia agrupada pela turma, com "Versão adaptada para decidir" e sem nome de aluno;
  - a escola vazia com "Tudo em dia" e "Nada espera a sua decisão agora.".
  - As do celular saíram com a lista fechada. É problema conhecido da vitrine, já registrado em "Recomendações sem aplicar", e o e2e de 360 px cobre a abertura.

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/fila-do-professor.ts:248-249`: o comentário do `useFilaDoProfessor` ainda diz que "Atualizar" relê cada leitura "por `refetchQueries` com a chave exata". As contagens agora são relidas por `fetchQuery` em série (`:309`). Vale alinhar o comentário.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/api/pedidos.ts:126`: "Sem ninguém olhando a contagem fica velha e é lida na vez seguinte" não descreve o que acontece. Com `gcTime: 0`, a contagem sem observador sai do cache, e não fica velha esperando. Vale reescrever a frase.
3. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/fila-do-professor.ts:274`: decidir `enabled` lendo `cliente.getQueryState` durante a renderização funciona, mas depende de o `useQueries` renderizar de novo quando o status muda. Uma linha dizendo isso, ou derivar o `enabled` do resultado anterior, deixa a regra menos frágil se alguém mexer no `notifyOnChangeProps`.

## test-engineer · 2ª rodada · REPROVADO · 2026-10-17 23:47:20 · `tasks/prd-telas-do-professor/1_task.md`

VEREDITO: REPROVADO

Cenários exigidos: caminho feliz (os quatro tipos de item, agrupados e em ordem); turma sem pedido não vira item; duas disciplinas na mesma turma; vínculo de ano encerrado; mais de 12 turmas; sem ano letivo; leitura parcial e erro; recusa por limite na primeira leitura e no "Atualizar"; o sino não relê sozinho; "Atualizar" e "Tentar de novo" só por chave exata, sem tocar a lista nominal; nenhum nome de aluno no cache; recomeço depois da troca de escola e com a segunda pessoa; a série recomeça depois do reset e da invalidação global; decidir um pedido relê a contagem; a coordenação não lê a fila do professor.

Cobertos (as três correções da 1ª rodada):
1. **Série no recomeço: feito.** A série agora pertence ao conjunto de turmas (`fila-do-professor.ts:263-266`). O teste "troca de escola com o sino montado" prova `maximo === 1` nas 12 turmas de B e que nenhuma turma de A é relida, e tem um bloco que tira o reinício. Também entraram "invalidação global" e "invalidação global com turmas novas", com blocos.
2. **Segunda pessoa: feito.** `e2e/professor-sino.spec.ts:241` cobre a professora B na mesma aba. As asserções conferem que o nome não é "Esperando você, 4", que nenhum link aparece e que o nome da turma e o da professora A não aparecem. Também conferem que o cache não guarda o usuário, as turmas nem os vínculos de A.
3. **Blocos de mutação: feito.** Todas as cláusulas listadas têm bloco: linhas 81, 86, 87, 147, 162-163 (três blocos), 165-166 (dois), 167, 168, 171-174 (quatro), 175, `vinculosAReler` (com a asserção sobre `/v1/meus-vinculos`) e a saída do "Atualizado às". Os testes citados existem. As quatro recomendações anteriores foram aplicadas.

Rodei os testes de `SinoDoProfessor`, `fila-do-professor`, `pedidos` e `sino-por-area` com `--root` na raiz do repositório: todos verdes. Com `--root` em `apps/web`, `pedidos.test.ts` e `fila-do-professor.test.ts` falharam ao carregar o `@educa/shared` ("Failed to resolve entry"). É do ambiente, não do código, e não mexi em nada.

Bloqueantes:
- **`apps/web/src/api/pedidos.ts:31`: a condição nova não tem bloco nem teste.** A cláusula é esta:
  ```ts
  if ((cliente.getQueryCache().find({ queryKey: consulta.queryKey, exact: true })?.getObserversCount() ?? 0) > 0) void cliente.fetchQuery(consulta)…
  ```
  O único bloco apaga a linha inteira, e só prova que existe uma releitura. A condição em si fica sem prova: sem ninguém olhando, não se relê. Esse caso existe na área do professor. A contagem tem `gcTime: 0`, então a consulta de uma turma que o sino não lê some do cache: a 13ª turma, além do teto, ou uma turma que ficou sem ler depois de uma recusa por limite. Trocada a condição por `true`, decidir um pedido nessas turmas lê a contagem delas. Isso fura o teto e a parada no limite (regra 80). Hoje nenhum teste veria: `pedidos.test.ts:279` só olha `isInvalidated`, que continua `true` com a busca em voo ou com erro.
  - Correção: em `pedidos.test.ts`, no teste "decidir como professor…" ou num novo sem observador, afirmar que `chamadas` não tem GET a `/v1/turmas/${TURMA}/reivindicacoes` depois de `aplicarDecisao`. Melhor ainda, um teste de componente com 14 turmas: decidir na 13ª não lê a contagem dela. E um bloco que troque `> 0` por `>= 0` (ou a condição por `true`).

Recomendações:
- `pedidos.ts:28`: o `refetchType: 'none'` parece não mudar nada. A contagem já lida está desligada, e a invalidação só relê consulta ligada. Justificar o motivo na linha de desvio ou tirar.
- `fila-do-professor.ts:309`: o `staleTime: 0` no `fetchQuery` está provado só de forma implícita, pelo "Atualizar" clicado dentro dos 30 s do `staleTime` padrão do cliente. Declarar um bloco que tire o `staleTime: 0` deixa isso escrito.
- `SinoDoProfessor.test.tsx:584-586`: o `void act(async () => { void cliente.resetQueries() })` fica sem `await`. Funciona, mas pode gerar aviso de `act` e ficar instável. Prefira segurar a promessa e esperar o `act` depois do `liberar`.
- `e2e/professor-sino.spec.ts`: a asserção `not.toHaveAccessibleName('Esperando você, 4')` repete o que o `esperarSino(page, 'Esperando você, nada')` já prova. Não atrapalha.
- Concorrência: clique duplo em decidir gera dois `fetchQuery` da mesma contagem, que o TanStack funde em um. Um teste com duas chamadas de `aplicarDecisao` em paralelo, contando uma leitura só, fecharia o caso da regra 80.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/api/pedidos.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/api/pedidos.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/fila-do-professor.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/SinoDoProfessor.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-sino.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/prd-telas-do-professor/1_task.md

## revisor-geral · 3ª rodada · APROVADO · 2026-10-18 09:56:54 · `tasks/prd-telas-do-professor/1_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

Esta rodada mudou pouco. Em `apps/web/src/api/pedidos.ts` só mudou o comentário. Entraram dois testes em `apps/web/src/api/pedidos.test.ts` e um em `apps/web/src/areas/professor/SinoDoProfessor.test.tsx`, que também ganhou o `await` no `act`. No documento da tarefa entraram três blocos de mutação e a tabela das recomendações sem aplicar. Era isso que o `test-engineer` pedia na 2ª rodada.

- **Contagem sem ninguém olhando.** Depois de uma decisão, a contagem só é relida se o sino estiver olhando aquela turma, e agora isso está provado de três jeitos:
  - um teste que afirma que nenhum pedido sai para a lista de pedidos da turma, tanto da contagem guardada sem o sino olhando quanto da turma que nunca foi lida;
  - um teste do sino com 14 turmas, em que a 1ª turma serve de controle e prova que a 13ª não é lida;
  - os blocos de mutação que trocam `> 0` por `>= 0`.

  Os nomes dos testes citados nos blocos existem.
- **"Atualizar" relê de verdade.** O bloco que tira o `staleTime: 0` aponta para o teste "\"Atualizar\": uma leitura a mais…" (`SinoDoProfessor.test.tsx:458`) e para a linha que existe em `fila-do-professor.ts:309`.
- **O comentário novo bate com o código.** O sino desliga a contagem que já leu, mas continua observando a turma, e é isso que mantém o número de observadores acima de zero. A turma além do teto e a que ficou sem ler depois de uma recusa por limite não têm ninguém observando.
- **Fotos.** Os dois arquivos do computador são iguais aos da rodada aprovada. Na escola cheia aparece a adaptação agrupada por "2ºB" e nenhum nome de aluno. Na vazia aparece "Tudo em dia". Nenhuma tela mudou nesta rodada.

Recomendações:
- `apps/web/src/api/pedidos.test.ts`, teste "dois cliques em decidir…". O nome diz "uma releitura só", mas a asserção é `toHaveLength(2)`, porque conta também a leitura inicial. Escrever "leitura inicial + uma releitura" no nome ou numa variável deixa a conta legível.
- `apps/web/src/api/pedidos.ts:125-129`. O comentário de quatro linhas sobre uma linha só de condição está no limite. Ele explica um porquê que não dá para ver no código, então pode ficar, mas sem crescer mais.

## test-engineer · 3ª rodada · APROVADO · 2026-10-18 09:57:31 · `tasks/prd-telas-do-professor/1_task.md`

VEREDITO: APROVADO

**Cenários exigidos (desta rodada, pela correção da 2ª):**
- Decidir um pedido sem ninguém observando a contagem não lê nada. Isso vale nos dois casos: contagem guardada sem observador, e turma nunca lida (como a 13ª).
- Decidir na 13ª turma, além do teto de 12, não lê a contagem dela. Decidir na 1ª relê a dela uma vez só.
- Um bloco de mutação para a condição `> 0`.
- Recomendações da rodada anterior: justificar o `refetchType: 'none'`, um bloco sobre o `staleTime: 0` de `relerEmSerie`, o `await act` que faltava, e dois cliques em decidir com uma leitura só.

**Cobertos:**
- **Correção exigida, feita.** O teste novo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/api/pedidos.test.ts:291` cobre os dois casos sem observador: a TURMA, com a contagem no cache e sem observador, e a OUTRA, sem consulta nenhuma. Ele afirma que não sai nenhum GET a `/reivindicacoes`.
  - Com a mutação `>= 0`, o `fetch` falso grava a chamada antes de lançar o erro "sem resposta preparada". Na OUTRA, o `?? 0` vira `0 >= 0`. O teste fica vermelho pelo motivo certo nos dois casos.
- **Teste de componente com 14 turmas,** em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/SinoDoProfessor.test.tsx:303`.
  - A 13ª fica fora do `useQueries`, porque a lista é cortada no teto (`fila-do-professor.ts:262`). Por isso ela não tem observador.
  - O controle na 1ª mostra que o teste enxerga a releitura (chega a 2) antes de afirmar 0 na 13ª.
  - A 13ª é decidida antes, pelo mesmo caminho. Com a mutação, a leitura dela sai antes do controle.
- **Mutações.** Há dois blocos `> 0` → `>= 0`, um para cada teste, e eles casam com a linha 129 de `pedidos.ts`. O bloco do `staleTime: 0` em `relerEmSerie` também foi incluído. Nenhuma cláusula nova do diff ficou sem bloco.
- **`refetchType: 'none'`:** está justificado no comentário de `pedidos.ts:125-128`.
- **`void act`:** virou `await act` em `SinoDoProfessor.test.tsx:604`.
- **Dois cliques em decidir** (`pedidos.test.ts:303`) é paralelo de verdade, com `Promise.all`. A segunda decisão entra com a releitura da primeira ainda no ar. O teste conta exatamente 2 leituras: a inicial e uma releitura. Uma terceira leitura seria gravada e deixaria o teste vermelho, e o `afterEach` exige a fila de respostas vazia.
- **Nada escondendo a regra.** Não há `.skip`, nem teste comentado. O mock é só do `fetch`, nunca do código nosso.
- **Os dois arquivos passam:** 18 de 18 em `pedidos.test.ts` e verde em `SinoDoProfessor.test.tsx`. A primeira vez que rodei `pedidos.test.ts` a partir de `apps/web`, ele falhou com "Failed to resolve entry for package @educa/shared". Rodado da raiz do repositório, passou. Parece ser o `@educa/shared` sendo recompilado ao mesmo tempo por outro revisor, e não um problema dos testes.

**Bloqueantes:** nenhum.

**Recomendações:**
- O teste de dois cliques protege, na prática, a deduplicação do próprio TanStack Query. Nenhuma linha nossa o deixa vermelho: tirar o `refetchType: 'none'` não muda nada, porque a contagem lida está desligada. Ele vale como guarda de regressão, sem bloco de mutação. Vale dizer isso num comentário para ninguém achar que ele prova uma cláusula.
- O controle do teste de 14 turmas depende de a leitura da 13ª sair antes da releitura da 1ª pelo mesmo caminho assíncrono. O comentário do teste já diz isso. Se um dia o caminho de `chamarComSessao` mudar para cada turma, o controle pode deixar de cobrir a ordem.
