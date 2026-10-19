# Achados das revisões — `tasks/prd-telas-do-professor/12_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 09:57:07 · `tasks/prd-telas-do-professor/12_task.md`

VEREDITO: APROVADO

Tela vista: sim (4 fotos lidas: aba Alunos, escola cheia e vazia, a 1366 px e a 360 px). Não vi na foto a lista vazia, o carregando, o erro, "Ver mais" nem "Saiu da turma". A foto da escola vazia tem 1 aluno sem correção aprovada, como o prompt avisou. Esses estados eu conferi pelo código (`AlunosDaTurma.tsx:100-141`, `alunos-da-turma.ts`) e pelos casos de componente e e2e que a tarefa declara.

Estados: ok.
- Carregando: `EstadoCarregando` com "Carregando os alunos da turma…" (`AlunosDaTurma.tsx:100`). A célula de acertos diz "Carregando os acertos…" enquanto eles não chegam, e não finge "Sem correção aprovada" (`alunos-da-turma.ts:82-84`).
- Erro: `EstadoErro` com "Tentar de novo" para a lista, para a página seguinte e para os acertos. A falha dos acertos não tira os nomes da tela.
- Vazio: "A lista ainda não chegou", dizendo que os alunos aparecem quando entram na turma e a professora aprova o nome, e que a coordenação deve ser procurada se a lista não foi montada. Só aparece com a lista lida até o fim e os acertos já chegados (`AlunosDaTurma.tsx:83`). Convida a agir.
- Com dado: a foto mostra a lista em ordem de nome com os acertos, e o aluno sem correção aprovada com "Sem correção aprovada" e "—", nunca "0 de 0".

Acessibilidade: ok.
- A `Tabela` da X1 traz `caption`, `th` de coluna e de linha, e foco só quando rola dentro do contêiner.
- No celular, a lista usa `dt` e `dd` com o rótulo em texto.
- `Ver mais` desliga e diz "Carregando…" enquanto lê.
- O foco depois de "Ver mais" vai para o botão ou para a frase do fim da lista (`AlunosDaTurma.tsx:66-69`), e há teste para isso.
- Não há controle de ordem, então não há nada ambíguo para o teclado.

Chromebook fraco:
- A lista não fica guardada (`gcTime: 0`) e é lida em páginas de 100.
- Não há virtualização. Uma turma tem algumas dezenas de alunos e a `Tabela` entrega só a página lida, então não bloqueia. Fica como recomendação.
- A rolagem de 991 px a 1366 × 768 não viola nada. Procurei no PRD, no mockup e em `docs/interface.md` e não achei regra de "só o miolo rola" para a turma aberta. A regra de topo fixo e miolo rolando (`docs/interface.md:1577`) é da aula ao vivo.

Celular: ok.
- A 360 px não há rolagem horizontal nem texto cortado. A tabela vira cartões com o rótulo de cada valor ao lado.
- Os botões "Gerar acesso" e "Ver o acesso dos alunos" têm mais de 44 px de altura na foto.
- A linha da lista não tem ação, então não tem alvo de toque a medir.
- Existe e2e de 360 px com nome comprido e linhas de pelo menos 56 px (`e2e/professor-turma-alunos.spec.ts:207`).
- A barra de baixo aparece cortando o conteúdo no meio da foto longa do celular. É a barra fixa da X1 capturada em página inteira, não defeito desta tarefa.

Ação oficial protegida: sim. A tarefa não cria ação oficial nova. Os pedidos de nome seguem com `ListaDePedidos` e as regras de hoje, sem "aprovar todos". A lista não tem ordem por acerto, média, situação, busca nem selo de adaptação, o que respeita D34, D35, D46 e D69. Não vi saída de IA nesta aba.

Bloqueantes: nenhum.
- Português do BR, sem id, chave de tradução nem inglês na tela. Os códigos de habilidade (QUI.EM.05) são conteúdo pedagógico, não termo técnico.
- Os sufixos "1cbb58c5" nos nomes das fotos são dado de teste da vitrine.
- A foto confere com o código da árvore.

Recomendações:
1. `apps/web/src/componentes/Tabela.tsx` não virtualiza, e a aba lê até 100 alunos por página e acumula com "Ver mais". Numa rede com turma grande no Chromebook fraco, vale medir com throttling de CPU quando houver turma de 100 ou mais.
2. Peça ao e2e ou à vitrine uma foto com a lista vazia e com "Saiu da turma" na tela, para o `/validar` ver esses dois estados. A vitrine vazia de hoje só tem 1 aluno.
3. No vazio, "peça a ela" poderia dizer o caminho dentro do produto, quando houver um. É texto, não bloqueia.

Arquivos principais: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/AlunosDaTurma.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/alunos-da-turma.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/api/alunos-da-turma.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-turma-alunos.spec.ts`.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-19 09:57:33 · `tasks/prd-telas-do-professor/12_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: o nome do aluno e o `usuarioId`, que a web passa a ler de `GET /v1/turmas/:id/alunos`, com o DTO estrito `{ usuarioId, nome }` (`packages/shared/src/estrutura/turma.ts:93`). Também os acertos de correção aprovada, de `/desempenho`, que já eram lidos antes. Nenhum campo novo, nenhuma migration, nada gravado no navegador. A tela não mostra matrícula, situação, média, adaptação nem conversa.

Fora da tabela de dados do docs/lgpd.md: nada. O nome do aluno aprovado já está mapeado. A tarefa só lê o que já existia, por uma rota que já existia.

Autorização por objeto: ok.
- **Na API**, que não mudou nesta tarefa: o professor só lê a lista com vínculo `confirmado`. Turma de outra escola, vínculo pendente, contestado, encerrado ou id inexistente respondem o mesmo `NAO_ENCONTRADO` (`apps/api/src/estrutura/turma.service.ts:125-142`). Isso está provado em `apps/api/test/turma-acesso.int.test.ts:59-103`, `:120-137` e `:424`.
- **Na web**: o e2e (`e2e/professor-turma-alunos.spec.ts:229-280`) testa a turma de outra escola, a de outro professor e a de vínculo pendente. Nos três casos aparece "Turma indisponível", a web não pede a lista e o cache não guarda dado da turma alheia.
- A lista que deixa de achar a turma derruba a página igual aos pedidos (`AlunosDaTurma.tsx:630-633`).

Logs: limpos. Nenhum `console.*` no código novo, e o e2e confere que o console e os `pageerror` não contêm nenhum nome (`e2e/professor-turma-alunos.spec.ts:150-173`).

Auditoria: presente onde a regra exige.
- A leitura pela coordenação continua obrigando a dizer a finalidade e grava `turma.alunos_lidos` (`turma.service.ts:136`).
- A leitura do professor da própria turma fica sem registro, como prevê a matriz (regra 60, item 11). A regra 20, item 10, só pede auditoria na leitura pela coordenação ou pela rede.
- A web não envia `finalidade` nem `?anoLetivoId` (`apps/web/src/api/alunos-da-turma.ts:29`).

Envio externo: nenhum. A tarefa não chama IA nem serviço de terceiro.

Seed/fixture: sintético.
- `matricularAlunosNaTurmaNoBanco` (`e2e/__fixtures__/sessao.ts:752-770`) cria alunos com nomes inventados, sem e-mail.
- A conta da coordenação usa um e-mail `@educa.invalid` aleatório.
- As fotos mostram só "Colégio sintético da vitrine", "Professora Sintética" e "Aluno Sintético".

Exposição, nas fotos e no código:
- **O que as quatro fotos mostram**: a professora vê, só na turma dela, o nome, os acertos e o acerto por habilidade. Isso está dentro da matriz e da D34. Não aparece matrícula, palavra de nota, média, ranking, nem controle para ordenar por acerto. Na escola vazia aparece "Sem correção aprovada", e não "0 de 0".
- **Cache**: a lista usa `gcTime: 0` (`alunos-da-turma.ts:35`). Ao trocar de sessão, `resetQueries` esvazia o cache (`apps/web/src/main.tsx:31-33`). O e2e prova que, ao sair da aba, o nome some do cache e que nada vai para `localStorage`, `sessionStorage` ou endereço (`professor-turma-alunos.spec.ts:145-174`).
- **Segunda pessoa na mesma aba**: ela não vê a lista nem os pedidos da primeira, nem na tela nem no cache (`e2e/professor-sino.spec.ts:794-817`).
- **Resposta atrasada**: a lista de uma turma que chega depois da troca não aparece na outra turma e não fica no cache (`professor-turma-alunos.spec.ts:176-205`).
- **Decisão de pedido**: aprovar ou recusar marca como velha só a lista da turma decidida (`apps/web/src/api/pedidos.ts:544-546`). Há teste e mutação que provam que a lista de outra turma não é tocada.

Bloqueantes: nenhum.

Recomendações:
1. **Nome de quem saiu da turma.** A linha "Saiu da turma" (`apps/web/src/areas/professor/alunos-da-turma.ts:91-93`) mostra o nome de um aluno que já não está na turma. O nome vem do próprio `/desempenho`, que é autorizado, e a linha só aparece no intervalo entre as duas leituras. Vale registrar no `/retro` se a regra 20, item 18 (fim de vínculo), pede que essa linha mostre só "Um aluno saiu da turma", sem o nome. Não bloqueia: nenhum dado sai do alcance que a professora já tinha.
2. **Prova de isolamento na web.** Os casos de isolamento do e2e mostram que a web nem chega a pedir a lista da turma alheia, porque a página cai antes. A prova de que a rota responde 404 igual fica só na integração da API. Um caso na web que force a chamada direta a `/alunos` com o id alheio fecharia essa prova também por esse lado.

Pergunta de fechamento: a tarefa não cria dado nem envio externo. O que o sistema guarda do aluno (nome, vínculo, acertos) continua respondido pelos caminhos que já existem (`pedido_titular`, auditoria e a foto do compartilhamento), sem lacuna nova.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-19 09:57:34 · `tasks/prd-telas-do-professor/12_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nem migration nesta tarefa. O atalho `matricularAlunosNaTurmaNoBanco` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/__fixtures__/sessao.ts:678`) grava `usuario` e `vinculo` com o `escola_id` do cenário e o `ano_letivo_id` lido da própria turma, filtrando por `escola_id` e `id`. A escola e o ano batem.

Queries verificadas:
- `consultaAlunosDaTurma` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/api/alunos-da-turma.ts`) envia só a turma no caminho, já codificada, mais `limite` e `pagina`. Não envia `escolaId`, `anoLetivoId` nem `finalidade`, e há teste de unidade e de componente que provam essa ausência.
- A rota que a web passa a ler é `GET /v1/turmas/:id/alunos` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/api/src/estrutura/turma.service.ts:125`). Esta tarefa não a alterou. Ela aplica o escopo a partir do token, por meio de `alcanceDaTurma` e `TurmaRepository`, e já tem isolamento provado em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/api/test/turma-acesso.int.test.ts`:
  - linha 59: vínculo pendente e contestado recebem o mesmo 404 do id inexistente;
  - linha 175: professor de outra turma e aluno recebem 404;
  - linha 285: id da escola B recebe o mesmo 404 do inexistente;
  - linha 318: o repository alcança só a escola do contexto.
- A invalidação depois de decidir um pedido (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/api/pedidos.ts:482`) atinge só `['alunos-da-turma', turmaId]`. Uma mutação prova que ela não alcança a lista de outras turmas.
- A lista não fica guardada: `gcTime: 0`, e na troca de sessão ou de escola o `resetQueries` geral de `main.tsx` esvazia o cache.

Teste de isolamento: presente e efetivo. Os três casos de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-turma-alunos.spec.ts` (outra escola, outro professor da mesma escola e vínculo pendente) exigem "Turma indisponível". Exigem também que a lista não seja pedida (`vigiarALista`), que nenhum nome alheio apareça na tela e que não exista consulta `alunos-da-turma` no cache. Se a aba lesse a lista sem esperar a turma ser aceita, o teste quebraria. O escopo do servidor continua coberto pelo teste de integração da API, que esta tarefa não tocou. O recomeço com a segunda pessoa na mesma aba (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-sino.spec.ts`) prova que a lista de nomes e os pedidos da primeira pessoa somem da tela e do cache. Um erro da lista que indica turma indisponível tira a página inteira (`aoPerderATurma`), e uma mutação prova isso. Os outros erros não tiram a página.

Bloqueantes: nenhum.

Recomendações:
- O cenário "trocar de escola esvazia" da tabela de testes da tarefa não tem caso próprio para `alunos-da-turma`. Hoje ele depende do `resetQueries` geral, provado só pelo recomeço da segunda pessoa no `professor-sino.spec.ts`. Uma asserção em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/troca-de-escola.spec.ts`, com a aba Alunos aberta antes da troca, fecharia esse ponto.
- A linha "Saiu da turma" mostra o nome de quem o desempenho traz e a lista não. Fica dentro da mesma escola e da mesma turma do professor, então não há vazamento entre escolas. Vale o `privacy-guardian` confirmar que exibir o nome de um aluno já transferido ao professor de origem é aceitável pela D34 e pela regra 20, item 18.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-19 09:57:51 · `tasks/prd-telas-do-professor/12_task.md`

VEREDITO: APROVADO

Escopo: respeitado. As subtarefas 12.1, 12.2 e 12.3 estão feitas. A tarefa não entregou nada do que ela mesma deixa de fora: não há situação, média, busca por nome, selo "Adaptação", "Abrir a conversa" nem o diálogo do convite. A invalidação em `api/pedidos.ts` e os arquivos alterados fora da lista prevista estão justificados na tabela de divergências.

Aderência à Tech Spec: ok. As quatro divergências da tarefa estão escritas em `techspec.md` §9, "Alunos na pele nova", itens 1 a 6, e a premissa da §12 virou "VERIFICADO na 12.0". Esta spec não tem `cenarios.md`, então não havia onde mais registrar. A tela segue o RF18 e o RF21: nomes em ordem de nome, acertos só de correção aprovada, "Sem correção aprovada" no lugar de "0 de 0", e nenhuma palavra de nota, média ou ranking. Nas quatro fotos (cheia e vazia, computador e celular) a tela mostra isso e nada além.

Portão local: carimbo válido.

Bloqueantes: nenhum.

Recomendações:
1. **Releitura que falha some sem aviso.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/AlunosDaTurma.tsx:101` e `:140`, o erro só aparece na primeira leitura (`!listaLida`) ou na página seguinte (`isFetchNextPageError`). Quando a releitura depois de decidir um pedido falha (erro da releitura, com a lista já na tela), a tabela velha continua sem nenhum aviso: o aluno recém-aprovado não aparece e nada explica por quê. Vale um aviso curto com "Tentar de novo".
2. **Teste do sino ficou mais frouxo.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-sino.spec.ts:303-312`, o id da turma A saiu da busca no cache inteiro (que inclui as chaves) e passou a ser procurado só nos dados. A causa é anterior a esta tarefa: as chaves `estrutura/turma/<id>` e `acesso-da-turma/<id>` continuam depois da troca de sessão. Mesmo assim, a §5 da Tech Spec usa `gcTime: 0` na contagem justamente para "a pessoa seguinte não herdar o id de uma turma". Isso precisa ser decidido de forma explícita: ou a exceção entra na Tech Spec, ou vai para o `TODO.md` dar `gcTime: 0` também a essas duas consultas.
3. **Variável inútil no e2e.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-turma-alunos.spec.ts:178-179`, o `const api = await simularAssistente(page); void api` existe só para calar o aviso de variável sem uso. Basta `await simularAssistente(page)`.
4. **Frase sobre o atalho do e2e.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/__fixtures__/sessao.ts:961`, a função cria uma coordenadora sintética a cada chamada. Funciona, mas o comentário poderia dizer que é um atalho sem a decisão humana registrada, para ninguém reaproveitar a função fora do e2e. Hoje o comentário diz só que o atalho é do e2e e pula a decisão humana e a auditoria.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-19 09:59:43 · `tasks/prd-telas-do-professor/12_task.md`

**VEREDITO: REPROVADO**

Os 66 testes de unidade e de componente passam: `AlunosDaTurma.test.tsx`, os dois `alunos-da-turma.test.ts` (o da api e o da tela), `pedidos.test.ts` e `Turma.test.tsx`. Os testes são bons. O que reprova são duas cláusulas novas que ficaram sem bloco na seção "Mutações".

**Cenários exigidos (tabela da 12.0):** a ordem de nome · aluno sem correção aprovada · aluno transferido ou desativado · vocabulário · nenhuma ordem por acerto · os estados (carregando, erro, vazio, mais de uma página, com dado) · a lista fora do cache · isolamento (outra escola, outro professor, vínculo pendente, troca de escola) · os pedidos de nome pela aba · recomeço e resposta atrasada · 360 px. Pelo domínio, valem ainda: dois alunos com o mesmo nome, aluno transferido e clique duplo.

**Cobertos:**
- **A ordem de nome:** cobre "Álvaro" junto do A, o desempate pelo id nas duas ordens, a reordenação depois de "Ver mais" e a ordem que não muda com os números. Prova na unidade, no componente e no e2e, com a ordem de id real da API.
- **Sem correção aprovada:** total zero e aluno fora do desempenho dão o mesmo texto, sem "0 de 0". Com os acertos carregando ou falhando, a célula não afirma nada.
- **Transferido:** o aluno que o desempenho traz e a lista lida até o fim não aparece como "Saiu da turma", sem número. Com páginas por ler, ele não aparece.
- **Os estados:** os cinco estão no componente. A falha de "Ver mais" e a releitura dos acertos que falha também.
- **Clique duplo em "Ver mais":** dois `click()` seguidos no mesmo instante. É concorrência de verdade, não duas chamadas em sequência.
- **O cache:** `gcTime: 0` está provado na consulta e no componente. O e2e confere a memória da aba, o `localStorage`, o `sessionStorage`, o endereço e o log.
- **Isolamento:** os três casos no e2e, com controle positivo e sem chave `alunos-da-turma` no cache.
- **A decisão de um pedido:** marca como velha só a lista da turma decidida, e com a aba aberta a lista é lida de novo de verdade.
- **Os pedidos de nome:** `pedidos.spec.ts` já chega pela aba Alunos (`abrirAbaAlunos`).
- **Recomeço:** está no `professor-sino.spec.ts`, com a lista e os pedidos.
- **360 px:** os 56 px e a quebra do nome comprido.
- Nenhum `.skip`, e nenhum mock de coisa nossa: a rede falsa responde por caminho, e a tela, o cliente de consultas e a `Tabela` são os de verdade. A IA não entra.

**Bloqueantes:**

1. **`apps/web/src/api/alunos-da-turma.ts:27`:** a chave por turma, `queryKey: [...CHAVE_DOS_ALUNOS_DA_TURMA, turmaId]`, não tem bloco em "Mutações" (`12_task.md`, linhas 89 a 436). É a cláusula que impede a lista de uma turma de aparecer na aba de outra (regra 10), e que limita a decisão de um pedido à turma decidida.
   - Correção exigida: acrescentar o bloco `-queryKey: [...CHAVE_DOS_ALUNOS_DA_TURMA, turmaId],` / `+queryKey: [...CHAVE_DOS_ALUNOS_DA_TURMA],`.
   - Teste a citar: `apps/web/src/api/alunos-da-turma.test.ts › a chave começa por \`alunos-da-turma\` e leva a turma`, que já existe e ficaria vermelho.
2. **`apps/web/src/areas/professor/AlunosDaTurma.tsx:131`:** a escolha entre o botão "Ver mais" e a frase do fim (`alunos.hasNextPage ? <Botao …> : <p …>`) não tem bloco. É a cláusula do estado "mais de uma página", que é cenário exigido.
   - Correção exigida: acrescentar o bloco `-{alunos.hasNextPage ? (` / `+{true ? (`.
   - Teste a citar: `AlunosDaTurma.test.tsx › com dado: os alunos em ordem de nome` (ele exige a frase do fim) ou `› mais de uma página` (ele exige que o botão saia).

**Recomendações (não bloqueiam):**
- **`e2e/professor-turma-alunos.spec.ts:176` (resposta atrasada):** a lista da primeira turma passa o `signal`, então sai do ar quando a tela troca de turma. O `rota.fallback()` falha calado, e a resposta atrasada nunca chega ao navegador.
  - O teste continua valendo: com a chave sem a turma ele fica vermelho. Mas o título e o comentário prometem uma chegada que não acontece. Ajuste o texto, ou responda com `route.fulfill` antes de abortar.
  - O `void api` da linha 179 sobra.
- **`AlunosDaTurma.tsx` e `api/alunos-da-turma.ts`:** a linha `if (porNome !== 0) return porNome` e a passagem do `signal` também não têm bloco. A primeira já é derrubada pelos testes de ordem. A segunda não tem teste nenhum que dependa dela.
- **"Trocar de escola esvazia":** não tem caso com a aba Alunos aberta. O caminho é o mesmo `aoTrocarDeSessao`/`resetQueries` que o recomeço do sino já prova com a lista, e o `troca-de-escola.spec.ts` prova o cache em geral. Um passo nesse spec, abrindo a aba antes da troca, fecharia o item da tabela ao pé da letra.
- **`e2e/professor-sino.spec.ts:303-312`:** o id da turma A saiu da lista checada contra o cache inteiro e passou a ser checado só contra os dados. É justificado, porque agora a primeira pessoa abre a turma. Mas um id da turma anterior numa chave que não seja da navegação deixa de ser pego. Vale restringir a exceção às chaves `estrutura/turma` e `acesso-da-turma`.
- **"Transferido ou desativado":** só aparece no caso de corrida entre as duas leituras. A API real tira o aluno das duas rotas, o que está registrado no §9 da Tech Spec. O e2e usa desempenho simulado. Um caso com aluno de vínculo encerrado ou `desativadoEm` no banco provaria que ele some da aba sem levar número.
- **Professor que dá duas disciplinas na mesma turma:** não tem caso. Bastaria `criarAlocacaoDoProfessor(..., ['Química', 'Física'])` no cenário do e2e, para provar uma lista só, sem aluno repetido.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/prd-telas-do-professor/12_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/api/alunos-da-turma.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/AlunosDaTurma.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-turma-alunos.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-sino.spec.ts

## test-engineer · 2ª rodada · APROVADO · 2026-10-19 10:23:30 · `tasks/prd-telas-do-professor/12_task.md`

VEREDITO: APROVADO

Cenários exigidos (da 1ª rodada, sem mudança): a lista de alunos da turma aberta em ordem de nome, com os acertos de cada um · paginação com "Ver mais" e a frase do fim · dois alunos com o mesmo nome · aluno que saiu da turma · lista vazia · erro, inclusive a falha de "Ver mais" · dois cliques no mesmo instante em "Ver mais" · resposta atrasada da primeira turma depois de abrir a segunda · decisão de um pedido marcando a lista como velha · troca de sessão sem deixar nome nem id da primeira professora no cache · isolamento pela rota da API.

Cobertos: todos os cenários acima, como na 1ª rodada. Nenhum arquivo de `apps/` mudou. Conferi as duas correções exigidas:

1. **Chave por turma.** O bloco novo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/prd-telas-do-professor/12_task.md` tira o `turmaId` da `queryKey`. Essa linha existe tal como o bloco a escreve, em `apps/web/src/api/alunos-da-turma.ts:27`. O teste citado (`alunos-da-turma.test.ts:55`) espera `['alunos-da-turma', TURMA]` e chaves diferentes para turmas diferentes. Com a mutação ele falha, e falha justamente na cláusula mutada.
2. **"Ver mais" ou frase do fim.** O bloco novo troca `{alunos.hasNextPage ? (` por `{true ? (`, e essa linha existe em `apps/web/src/areas/professor/AlunosDaTurma.tsx:131`. O teste citado (`AlunosDaTurma.test.tsx:99`) verifica na linha 111 que a frase do fim (`MENSAGEM_DO_FIM`) aparece. Com a mutação o botão fica e a frase some, então ele também falha pelo motivo certo.

As recomendações que a ordem mandou aplicar foram feitas:
- **E2e do sino** (`e2e/professor-sino.spec.ts:306-311`): a exceção ficou presa às chaves `estrutura/turma` e `acesso-da-turma`, e só quando a consulta está sem dado. Antes a conta olhava só o dado das consultas. Agora olha a consulta inteira, chave e dado, então o id da turma da primeira professora em qualquer outra chave também deixa o teste vermelho. O teste ficou mais rigoroso.
- **E2e da resposta atrasada** (`e2e/professor-turma-alunos.spec.ts:176-201`): o `void api` saiu, e o título e o comentário agora dizem o que o caso prova: com a leitura cancelada, a segunda turma não mostra nome da primeira e nada fica no cache.

Também não há `.skip`, mock que esconda a regra, nem chamada a provedor de IA no que mudou.

Bloqueantes: nenhum.

Recomendações:
- A passagem do `signal` continua sem teste que dependa dela. Hoje o caso da resposta atrasada passa com a leitura cancelada ou não. O item já está na tabela de "Recomendações sem aplicar", com destino `TODO.md`; fica só o registro para o `/validar`.
- Ao tirar "Nenhuma até aqui.", a seção "Recomendações sem aplicar" do `12_task.md` ficou com uma linha em branco sobrando antes da tabela. É só texto.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-19 10:23:55 · `tasks/prd-telas-do-professor/12_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)
Bloqueantes: nenhum

O que mudou desde a 1ª rodada e o que isso afeta:

- **O sino** (`e2e/professor-sino.spec.ts:306-311`): a exceção do id da turma ficou mais estreita. Antes, a busca pelo id só olhava o dado guardado. Agora olha a chave e o dado de toda consulta. Só ficam de fora as duas chaves da navegação, `estrutura/turma/<id>` e `acesso-da-turma/<id>`, e só quando estão sem dado. A conferência explícita de `alunos-da-turma` sem dado saiu, mas o caso ficou coberto e mais forte: qualquer entrada de `alunos-da-turma` que sobre, com ou sem dado, leva o id da turma na chave e reprova o teste. O `cache` continua sendo usado no laço da linha 312, então não sobrou variável morta. `semAcessosDaConta` aceita `unknown`, e passar a lista filtrada é o uso certo.
- **A aba Alunos** (`e2e/professor-turma-alunos.spec.ts:176`): o `void api` saiu como eu tinha recomendado. O que o caso afirma não mudou.
- **O documento da tarefa** (`12_task.md`): as duas mutações novas apontam para trechos que existem, a chave com `turmaId` e o `hasNextPage` do "Ver mais", e o portão diz que todas as 41 mutações ficaram vermelhas. A tabela de "Recomendações sem aplicar" dá destino a cada uma. O destino `TODO.md` é gravado no `/validar` (`.claude/skills/validar/SKILL.md:88`), então não faltar a entrada no `TODO.md` agora é o esperado.

Recomendações:
1. `e2e/professor-turma-alunos.spec.ts:176` e `:200-201`: o nome do caso ("a leitura sai do ar") e o comentário afirmam que o navegador aborta a leitura pelo `signal`. O caso não prova isso: sem o `signal`, a resposta atrasada cairia numa consulta já tirada do cache (`gcTime: 0`) e o caso passaria do mesmo jeito. Ou o texto descreve só o que o caso prova (a segunda turma não mostra nome da primeira, e nada da primeira fica no cache), ou o teste de cancelamento que o test-engineer pediu entra junto.
2. A exceção das duas chaves da navegação agora está escrita no teste (`e2e/professor-sino.spec.ts:306-309`), mas não na §5 da `techspec.md`. Ela já foi para o Arquiteto pela tabela de recomendações. Vale fechar antes do `/validar`, para que a regra não exista só no e2e.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-sino.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-turma-alunos.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/prd-telas-do-professor/12_task.md
