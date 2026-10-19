# Achados das revisões — `tasks/prd-telas-do-professor/10_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-19 03:50:30 · `tasks/prd-telas-do-professor/10_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A tarefa é só de tela e de fixture de e2e: não escreve em `Nota`, não toca no Corretor e não muda o fluxo de aprovação. A fixture `entrar` (`e2e/__fixtures__/professor/cena.ts:64-67`) só cria e confirma vínculos. Todos com autor humano? sim, porque não há caminho novo.

Decisão autônoma sobre aluno: ausente. Hoje, Atividades e Alunos só mostram fato e agregado. Não há nada de aprovação, reprovação ou encaminhamento, e nenhum aluno aparece em ordem de acerto. O teste `TurmaHoje.test.tsx` › "nenhum aluno na aba" e o e2e `professor-turma-aberta.spec.ts:59` provam isso.

Aprovação registrada: ok. Nenhuma saída de IA nova chega ao aluno. A exceção D47 continua só no Tutor. Atividades leva a "Revisar a correção" ou "Ver a correção", que é o fluxo de aprovação da objetiva e não mudou.

Supervisão do tutor: ok.
- **Nada some com a mudança.** O que "Seu time › Tutor" mostrava foi para Hoje, em cada turma: sinais, uso por aluno, atenção humana e funções.
- **O endereço antigo não perde ninguém.** `/professor/time/tutor` leva a Hoje quando há uma turma confirmada e a Turmas quando há mais de uma ou nenhuma (`Tutor.tsx:42-48`, provado em `Tutor.test.tsx` e em `professor-tutor.spec.ts:189-212`).
- **O uso do Tutor fica sempre ao alcance da professora.** O botão "Ver o uso do Tutor por aluno" aparece mesmo sem sinal; está nas fotos `cheia-hoje-computador.png` e `vazia-hoje-computador.png` e no código em `TurmaHoje.tsx:124`.
- **O painel não abre conversa nem mede tempo.** Nada nele leva à conversa de um aluno, a ordem é de nome e não de recência, e "Última troca" aparece como hora e nunca como "há X minutos" (`TurmaHoje.tsx:304, 327, 359, 362`; testes em `TurmaHoje.test.tsx:414-439`).
- **Nada de vigilância (item 7).** A releitura a cada 15 s é a mesma de antes e só lê sinais de trabalho. Não há inferência emocional, tempo ocioso nem navegação.

Autonomia declarada e visível: sim. "O que o Tutor faz sozinho, e o que você vê aqui" aparece em Hoje com a assinatura "Tutor IA" (`TurmaHoje.tsx:160-208`; fotos `cheia-hoje-*.png`). A tela da coordenação não mudou nesta tarefa.

Itens 8 e 9: não se aplicam. Não há nota em discursiva ou redação, nem indicador de professor. O teste de vocabulário estendido (`aprovar.test.ts`, bloco "Hoje (X3, 10.0)") e o `VOCABULARIO_DE_NOTA` nos e2e cobrem nota, conceito, média e ranking.

Fotos: nas oito telas que conferi (Hoje, painel, Atividades e Alunos da escola cheia, e as versões de celular e da escola vazia), toda saída de IA vem rotulada: "Tutor IA" e a assinatura da função nos grupos. Não aparece nota, conceito nem sugestão de nota. Os nomes de aluno só aparecem no painel, que diz isso em português comum ("Os nomes aparecem só aqui, para você, em ordem de nome…"). Nada induz uso nem dificulta sair.

Bloqueantes: nenhum.

Recomendações:
1. **O aviso de atenção humana projetado em sala.** Em Hoje ele aparece sem nome, mas no projetor mostra "precisa de um adulto", o texto "O Tutor parou a conversa e mostrou ao aluno como falar com um adulto" e a hora exata do aviso. Pode chegar no meio da aula pela releitura de 15 s. Com a hora e quem estava no Tutor naquele momento, os colegas podem deduzir quem é (D36; LGPD, art. 14). A Tech Spec decidiu assim, então não reprovo. Sugiro levar ao `/validar` e ao `privacy-guardian` uma versão discreta para a aba projetada: um "Há um aviso do Tutor para você" sem o motivo nem a hora, e o resto só depois de "Ver quem". Código em `apps/web/src/areas/professor/TurmaHoje.tsx:100-116` e `apps/web/src/areas/professor/sinais.ts:63-75`.
2. Nenhuma das fotos mostra o aviso de atenção humana, a ordem de nome nem a linha nominal do painel, porque a escola da vitrine não tem esses sinais. Vale incluir um sinal de atenção humana e dois sinais por aluno na escola cheia da vitrine, para a próxima rodada ver na tela o que hoje só está provado em teste de componente e e2e.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/TurmaHoje.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Tutor.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/sinais.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/TurmaHoje.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/professor-tutor.spec.ts

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-19 03:50:30 · `tasks/prd-telas-do-professor/10_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma. A tarefa só mexe no `apps/web` e no `e2e`: nenhuma migration, nenhum schema, nada em `apps/api`.

Queries verificadas: só leituras pelo cliente da web, que já existiam. Nenhuma recebe `escolaId`, e todas partem do `turmaId` do endereço com o escopo aplicado pela API:
- `consultaTurmaAberta(turmaId)` (`GET /v1/turmas/:id`)
- `consultaEu`
- `consultaSinais(turmaId)` e `consultaUsoDoTutor(turmaId)`, ambas com `gcTime: 0` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/api/tutor-da-turma.ts`
- `consultaDesempenhoDaTurma`, `consultaAtividadesAplicadas`, `consultaTime`, `consultaTitulosDosMateriais`
- `consultaMeusVinculos`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Tutor.tsx`

O `escola={eu.data.escola}` passado a `AlunosDaTurma` vem do `/v1/eu` da sessão. Só serve ao texto e ao link do `AcessoDaTurma`, como já era em `Turma.tsx` no HEAD. Não decide o que é lido.

O endereço só leva valores de lista fechada (`?aba=` e `?ver=tutor`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/endereco-da-turma.ts`). Nome de aluno e id de escola não vão para lá.

Teste de isolamento: presente e efetivo. Os casos estão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/professor-turma-aberta.spec.ts` (bloco "quem alcança e quem perde (regra 10)", linhas 100-126):
- turma de outra escola em `?aba=hoje`
- turma com id inexistente (`randomUUID()`)
- vínculo encerrado

O `GET /v1/turmas/:id` não é simulado: o fixture `assistente.ts:346-347` só intercepta o `/desempenho` das turmas. Sem o escopo da turma na API, a turma de outra escola abriria, e o caso que exige "Turma indisponível" sem o nome dela falharia. A turma inexistente e a de outra escola dão a mesma resposta, o que cobre a regra 10, item 6. Hoje só monta depois que a API devolve a turma, então nenhuma leitura de sinais sai para uma turma fora do alcance.

Bloqueantes: nenhum.

Recomendações:
- No caso "a turma de outra escola…" (`e2e/professor-turma-aberta.spec.ts:101`), afirmar também que nenhum pedido a `/v1/sinais` nem a `/v1/tutor/uso` sai para o `turmaId` da outra escola. Hoje isso só está garantido pela ordem de montagem em `Turma.tsx:95-104`; com essa asserção, uma refatoração que pedisse a aba antes da turma quebraria o teste.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 03:50:41 · `tasks/prd-telas-do-professor/10_task.md`

VEREDITO: APROVADO

Tela vista: sim (16 fotos lidas: Hoje, Atividades, Alunos e o painel "O que o Tutor viu", no computador e no celular, na escola cheia e na vazia). A escola da vitrine não tem sinal de atenção humana nem sinais por aluno. Por isso o aviso de atenção no alto de Hoje, a ordem de nome e a linha nominal do painel eu li no código (`TurmaHoje.tsx:97-116` e `:297-312`) e nos testes. Os cinco arquivos de teste da tarefa passam (51 testes).

Estados: ok. Pelo código, os quatro estados existem em cada aba:
- Hoje: sinais (`TurmaHoje.tsx:129-146`) e acerto por habilidade (`:212-224`), com erro único e "Tentar de novo" quando as duas leituras caem (`:82`).
- Painel: sinais por aluno e uso do Tutor (`:316-318`, `:335-351`).
- Atividades (`AtividadesDaTurma.tsx:27-31`) e Alunos (`AlunosDaTurma.tsx:48-49`).
- Nas fotos da escola vazia, todo vazio diz o que fazer: "Gere uma atividade objetiva em Ferramentas…", "Gerar acesso", "Quando um aluno travar…". Nenhum pede desculpa.

Acessibilidade:
- Foco: a região `aria-live="polite"` existe sempre, então o aviso novo é anunciado sem mover o foco (`TurmaHoje.tsx:100`).
- O foco volta ao botão do painel quando ele fecha sem ter sido aberto por botão (`:90-95`).
- Abas têm `min-h-11` (`Abas.tsx:83`) e os links de Atividades têm `min-h-11` (`AtividadesDaTurma.tsx:10`).
- Há texto alternativo nos links de Atividades ("Abrir a atividade: <título>") e rótulo nas seções.
- A barra do acerto é neutra e o número está no texto.
- Contraste visível nas fotos.

Chromebook fraco:
- A `Turma` e as três abas são pedaços carregados sob demanda, com o teto da fachada preservado (divergência registrada na tarefa).
- O pedaço da aba é pedido em paralelo com as leituras (`Turma.tsx:55-57`).
- Hoje só relê os sinais aos 15 s com a aba à vista e a janela visível. O uso por aluno só é lido com o painel aberto e sai da memória ao fechar (`gcTime: 0`).
- Não há lista longa nesta tarefa.

Celular:
- As fotos a 360 px não mostram rolagem horizontal nem texto cortado. A tabela de Alunos vira cartões, e o painel vira folha de baixo.
- Nada depende de hover. Os botões principais têm 44 px ("Ver quem", "Ver o uso do Tutor por aluno", "Gerar acesso"). Os e2e rodam nos dois projetos (`hasTouch`).
- A barra inferior que aparece sobre o conteúdo nas fotos de celular é artefato da foto de página inteira: a página termina com folga abaixo do último bloco.

Ação oficial protegida: sim. A tarefa não aprova, publica nem exclui nada. O que ela adiciona é a regra de nome do aluno (D34, D36):
- Hoje, a aba projetada em sala, não tem nenhum nome de aluno nem o conteúdo do que foi dito.
- O nome só aparece depois de "Ver quem" ou de abrir o painel (`?ver=tutor`), em ordem de nome.
- Nenhum link do painel leva a conversa. Há asserções disso no e2e (`professor-tutor.spec.ts:124-156`).
- O endereço e o armazenamento do navegador não guardam nome (`:158-167`).

Bloqueantes: nenhum.

Recomendações (não bloqueiam; ficam para o `/validar` e o `/retro`):
1. `Tutor.tsx:24-28`: o redirecionamento do endereço antigo olha só a primeira página de `consultaMeusVinculos` (`useInfiniteQuery`, `getNextPageParam`). Uma professora com vínculos além da primeira página, mas com uma única turma confirmada nela, iria direto a uma turma só. Usar `hasNextPage` para esperar todas as páginas, ou aceitar o limite de forma declarada.
2. `TurmaHoje.tsx:75`: o aviso "N alunos precisam de um adulto" conta só os sinais da primeira página (`sinais.data.proxima` existe na linha 157). Com mais sinais que a página, um aviso de atenção humana mais antigo pode ficar fora da contagem. O texto "Estes são os sinais mais recentes da turma" cobre o resto, mas não a atenção humana. Vale a API devolver a contagem de atenção humana à parte.
3. Grupo com um aluno só: `sinais.ts:48` diz "1 aluno pediu a resposta pronta na questão 3" numa aba projetada. Sem nome, mas numa turma pequena pode identificar. Considerar um piso de agrupamento na `/validar`.
4. Fotos `cheia-painel-*`, `vazia-painel-*`: o contorno azul em volta do corpo do painel (foco de rolagem em `PainelLado`) fica pesado em 1366 px. O componente não é desta tarefa. Avaliar se o foco precisa aparecer assim quando o painel abre por clique.
5. Falta uma asserção `larguraExcedente` a 360 px para Hoje e para o painel. Só Alunos a tem (`professor-turma-aberta.spec.ts:96`). As fotos estão limpas, mas um sinal com texto longo não está coberto por teste.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-19 03:51:15 · `tasks/prd-telas-do-professor/10_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** nenhum campo novo. A tarefa só mexe no frontend e não muda contrato, migration nem rota da API. As telas passam a ler, em outros lugares, dados que já existiam: nome do aluno em `Sinal` e em `UsoDoAluno` (leituras de `api/tutor-da-turma.ts`, as duas com `gcTime: 0`) e acertos por aluno de `consultaDesempenhoDaTurma`, que já vinham da `VisaoGeralDaTurma.tsx`.

**Fora da tabela de dados do docs/lgpd.md:** nada.

**Autorização por objeto:** ok. A turma aberta continua decidida pela API (`GET /v1/turmas/:id`). A de outra escola, a que não existe e a de vínculo encerrado respondem igual, "Turma indisponível". Isso está provado em `e2e/professor-turma-aberta.spec.ts:101`, `:112` e `:119`, e em `e2e/acesso-da-turma.spec.ts:501`. O redirecionamento do `Tutor.tsx` só conta vínculo `confirmado` (`Tutor.tsx:27`), e há mutação declarada para isso.

**Logs:** limpos. Nenhum `console`, `localStorage` ou `sessionStorage` nos arquivos alterados. O endereço guarda só `?aba=` e `?ver=tutor`, que são valores de lista fechada. Há e2e que prova que nenhum nome vai ao endereço nem ao armazenamento (`e2e/professor-tutor.spec.ts:158`).

**Auditoria:** não se aplica. Quem lê é a professora da própria turma (D34), não a coordenação nem a rede, e a tarefa não tem exportação, alteração de nota ou de permissão, nem aprovação de saída de IA.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. Os nomes vêm de `ALUNOS_DO_LOTE` (fixture sintética), e `cena.ts`, com `outrasDisciplinas`, cria só alocações sintéticas.

**O que as fotos mostram:**
- Hoje (`cheia-hoje-computador.png`, `vazia-hoje-*`): nenhum nome de aluno. Só o agregado e as barras neutras do acerto por habilidade.
- Painel (`cheia-painel-computador.png`, `cheia-painel-celular.png`): os nomes aparecem só ali, com o aviso "Os nomes aparecem só aqui…". Não há caminho para a conversa.
- Alunos (`cheia-alunos-computador.png`): acertos por aluno em ordem de nome. É o que a Visão Geral já mostrava, à professora da turma.
- O aviso de atenção humana não aparece nas fotos. Pelo código (`TurmaHoje.tsx:100-116`), ele mostra contagem, hora e o que fazer, sem nome. O nome só chega no `PainelDoTutor` (`TurmaHoje.tsx:297-312`).
- Os testes de componente cobrem quatro coisas: nenhum nome no DOM sem o painel, nenhuma consulta de `CHAVE_DO_USO_DO_TUTOR` no cache sem o painel (`TurmaHoje.test.tsx:337`), a consulta saindo do cache ao fechar (`:351`) e nada que abra a conversa (`:415`).

**Pergunta de fechamento:** esta tarefa não muda o que o sistema guarda nem para onde envia. A resposta continua a mesma de antes e não piora.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Aviso de atenção humana com hora na aba que se projeta em sala.** `TurmaHoje.tsx:107` (com `sinais.ts`, `horaDoUltimoAviso`) mostra na parede da sala "Um aluno precisa de um adulto · Aviso mais recente: 05/10, 10h40". Não há nome, mas o sinal da D36 pode ser de risco à vida, e com a hora exata a turma pode deduzir quem foi. O aviso também não tem como ser recolhido enquanto se projeta. É decisão da Tech Spec §7b, e hoje o dado é sintético (D71), por isso não é bloqueante. Deve ir ao Joaquim e ao Arquiteto antes do piloto. Duas saídas possíveis: tirar a hora da aba Hoje e deixá-la só no painel, ou deixar o aviso ser recolhido sem perder o sinal.
2. **Contagem pequena na tela projetada.** O detalhe do acerto por habilidade, "1 aluno acertou menos da metade…" (`TurmaHoje.tsx:236-238`), também aparece projetado. O texto já existia, mas a aba agora é a que vai para a parede. Vale avaliar na decisão dos indicadores (limiares, antes do PRD do F6).
3. **A leitura dos sinais traz nomes à memória mesmo com o painel fechado.** A Tech Spec aceita isso, e os nomes não vão à tela nem ao cache depois que a tela sai, por `gcTime: 0`. No futuro, separar o agregado (grupos e contagem de atenção) do nominal na API evitaria trazer o nome ao navegador antes do "Ver quem". Fica como dívida para o F6.

**Arquivos relevantes:**
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/TurmaHoje.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Turma.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Tutor.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/AlunosDaTurma.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/endereco-da-turma.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/sinais.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/TurmaHoje.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/professor-tutor.spec.ts`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-19 03:52:20 · `tasks/prd-telas-do-professor/10_task.md`

**VEREDITO: REPROVADO**

**Cenários exigidos:** a aba pelo endereço (Hoje por padrão, `replace`, só `aba`, `?ver=tutor` fora de Hoje não abre nada) · os estados de Hoje · a atenção humana sem nome nem conteúdo, com o nome só depois de "Ver quem" · a releitura aos 15 s só com a aba à vista e a janela visível · sem painel, sem rota nominal, e fechar o painel solta os nomes e o cache · `aria-live` sem mover o foco · vocabulário · nada abre conversa, sem recência nem tempo parado · acerto por habilidade só de correção aprovada · o endereço antigo do Tutor com uma turma, duas e nenhuma · os blocos do Tutor em Hoje · isolamento (outra escola, inexistente) e nome fora do endereço e do armazenamento · recomeço (recarregar, segunda pessoa, vínculo encerrado) · ordem de nome no painel · o histórico do painel (abrir é `push`, fechar é `replace`, divergência declarada).

**Cobertos:** quase todos. Os 61 testes de unidade e de componente das seis suítes passam aqui. Conferi as 15 mutações declaradas contra o diff, e cada uma chega à cláusula pelo motivo certo. Duas ficam vermelhas por caminho indireto, e o resultado vale do mesmo jeito:
- **`aria-live` retirado:** a região some, ou outra região não contém o aviso.
- **`TurmaHoje` sempre montada:** a leitura de 15 s continua com Atividades ou Alunos aberta.

Nos e2e, cobrem a atenção sem nome, o painel, o endereço antigo nos três casos, o isolamento, o armazenamento e o vínculo encerrado. Recarregar mantém a aba no caso de `acesso-da-turma.spec.ts:327`. O painel pedido no endereço é provado por `irPara` e pelo componente. Não rodei os e2e. Concorrência não se aplica, porque só há leitura.

**Bloqueantes:**

1. **A ordem de nome no painel não está provada inteira.**
   - Na lista de atenção humana (`TurmaHoje.tsx:304`), nenhum teste tem dois alunos com atenção e o painel aberto. `TurmaHoje.test.tsx:251-265` e `e2e/professor-tutor.spec.ts:124` usam só Caio. Tirar o `porNome` dessa linha não deixa nada vermelho, e a regra é D69: não pode haver ordem por recência.
   - Nos "Sinais por aluno" (`TurmaHoje.tsx:327`), o teste existe (`TurmaHoje.test.tsx:365`), mas a cláusula não tem bloco em "Mutações".
   - **Correção exigida:** um caso com dois avisos de atenção fora da ordem de nome, com o mais recente vindo primeiro para distinguir nome de recência (por exemplo Dani às 13h50 e Ana às 13h40), afirmando Ana antes de Dani no painel. E um bloco de mutação para cada uma das duas linhas.

2. **O histórico do painel não está provado.**
   - `TurmaHoje.test.tsx:257`, `:374` e `:385` só olham `localizacao.history.at(-1)`. Com `memoryLocation({ record: true })`, `push` e `replace` deixam o mesmo último item.
   - Tirar o `{ replace: true }` de `fecharOPainel` (`TurmaHoje.tsx:85`) não deixa nada vermelho. Trocar o `push` de `abrirOPainel` (`:84`) por `replace` também não.
   - O comentário em `:373` diz "sem passo novo no histórico", e o teste não prova isso. A divergência da tarefa declara esse comportamento: o Voltar fecha o painel.
   - **Correção exigida:** afirmar `localizacao.history` inteiro, com `toEqual`, depois de abrir e depois de fechar. E um bloco de mutação para cada um dos dois.

3. **O foco do painel aberto pelo endereço não tem teste.**
   - O título de `TurmaHoje.test.tsx:402` promete que "o painel aberto pelo endereço devolve o foco ao botão do painel, e não ao corpo da página". O corpo do teste só abre por "Ver quem", caminho em que o `PainelLado` já devolve o foco sozinho.
   - O `useEffect` de `TurmaHoje.tsx:90-95` e o `focoDeReserva` de `:255` podem ser removidos sem nenhum vermelho. É regra 50, item 11.
   - **Correção exigida:** um caso com `montar('aba=hoje&ver=tutor')` que fecha o painel e afirma `document.activeElement` igual ao botão "Ver o uso do Tutor por aluno". E um bloco de mutação. Se não for fazer o caso, o título precisa deixar de prometer o que o teste não prova.

**Recomendações:**
- O erro único com "Tentar de novo" (`caiuTudo`, `TurmaHoje.tsx:82` e `:216`) tem teste (`TurmaHoje.test.tsx:154`), mas não tem bloco de mutação.
- `Tutor.tsx:27-33` decide com as páginas que já chegaram. Se a primeira página traz uma turma confirmada e há `proxima`, a professora vai para essa turma sem saber das outras. Ir a Turmas quando houver `hasNextPage`, com um caso de teste.
- "O aviso some" está provado só na abertura. Vale um caso em que a releitura dos 15 s traz a atenção resolvida e o aviso sai.
- Segunda pessoa na mesma aba, em Hoje: os nomes dos sinais ficam no cache da leitura. O caso de `acesso-da-turma.spec.ts:1094` prova a turma e o acesso, não Hoje. Vale estender para afirmar que, depois de Sair e outra pessoa entrar, nenhum nome do primeiro chega à tela nem fica no cache.
- "Média de acertos" virar "acerto médio" ficou para a 14.1. Está registrado nas divergências; confirmar lá.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/TurmaHoje.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/TurmaHoje.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Turma.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Turma.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Tutor.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Tutor.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/endereco-da-turma.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/endereco-da-turma.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/professor-tutor.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/professor-turma-aberta.spec.ts

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-19 03:53:32 · `tasks/prd-telas-do-professor/10_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A divergência de tirar `Turma` da fachada não está na `techspec.md` deste checkout, mas já está na da `spec/telas-do-professor`, na seção Orçamento, desde a 9.0. As outras linhas da tabela de divergências são detalhe de implementação e não contrariam a §5 nem a §7b.
Portão local: carimbo válido

Bloqueantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/TurmaHoje.tsx:141` e `:147`. Em certos casos a seção "Sinais da turma" de Hoje fica em branco: aparecem o título e o botão, e nada mais.
  - **Por quê:** o agregado (`grupos`) só conta os últimos 7 dias (`DIAS_DO_AGRUPADO_DE_SINAIS`, em `apps/api/src/tutor/supervisao.service.ts:6`). Já os itens (`itens`) não têm limite de data (`supervisao.repository.ts:182`).
  - **Quando acontece:** a turma tem sinal de trabalho, mas todos com mais de 7 dias. É comum: basta uma semana sem uso do Tutor. Aí `grupos.length === 0` e `trabalho.length > 0`. O vazio não aparece, porque exige `trabalho.length === 0`, e o agregado também não, porque não há grupo.
  - **Por que é desta tarefa:** antes, o `Tutor.tsx` mostrava a tabela "Sinais por aluno" nesse lugar. A tarefa levou a tabela para o painel e não cobriu o buraco que ficou. O próprio comentário da linha 140 diz "a tela não fica vazia" (regra 50, item 6).
  - **Correção exigida:** com `grupos` vazio, Hoje sempre mostra um texto. Se `trabalho.length > 0`, um texto sem nome dizendo que não há sinal da turma nos últimos 7 dias e que os mais antigos, por aluno, estão em "Ver o uso do Tutor por aluno". Junto, o caso no `TurmaHoje.test.tsx`: `grupos: []` com um item de trabalho, conferindo que o texto aparece e que nenhum nome vai ao DOM.

Recomendações:
- **`tasks/prd-telas-do-professor/tasks.md:65-68`:** o 10.0 está marcado `[x]`, mas as subtarefas 10.1 a 10.4 continuam `[ ]`. A 1.0 e a 2.0 marcam as subtarefas também.
- **Citações erradas na tabela de divergências do `10_task.md`:**
  - Ela cita "Tech Spec §8 (Orçamento)", mas não há §8: o Orçamento está no fim da §7c.
  - Cita também `cenarios.md`, que não existe em `tasks/prd-telas-do-professor/`.
  - Várias linhas (o `push`/`replace` do painel, o `?ver=` que não acompanha a aba, `endereco-da-turma.ts`, `outrasDisciplinas`) apontam para a "§5", que não diz nada disso. Elas são detalhe de implementação, não divergência: tirar da tabela ou citar o lugar certo.
- **`Tutor.tsx:184-186`:** só lê a primeira página de `meus-vinculos`. Se houver `proxima`, "uma turma" pode estar errado e o redirecionamento levaria à turma errada (dela, sem vazamento). Ir a Turmas quando `vinculos.hasNextPage`.
- **`Turma.tsx:43-44`:** o comentário ainda diz que a leitura dos pedidos "é a que se repete sozinha". Hoje também se repete agora.
- **`TurmaHoje.tsx:75` e `:288`:** `alunosQuePrecisam` é calculado duas vezes. Passar ao painel por prop.
- **`TurmaHoje.tsx:90-95`:** o efeito de foco roda a limpeza também ao abrir o painel, não só ao fechar. Hoje é inofensivo, mas a intenção ficaria mais clara se ele dependesse só do fechamento.
- **Atenção humana antiga em Hoje:** o aviso no alto vale para qualquer sinal de atenção humana da primeira página, sem limite de data. Um aviso de semanas atrás continua no alto da aba que vai ao projetor; a hora está no texto. O comportamento já era o da tela antiga do Tutor. Levar ao Arquiteto como pergunta para a próxima revisão de spec.

Fotos: Hoje, Atividades, Alunos e o painel, nas duas escolas, trazem as três abas, o vazio dos sinais, o vazio tracejado do acerto e o painel sem nome com dado vazio, como a §7b e a §9 descrevem. Como você avisou, o aviso de atenção humana e a linha nominal não aparecem nelas, e foram conferidos pelo código.

## test-engineer · 2ª rodada · APROVADO · 2026-10-19 04:20:08 · `tasks/prd-telas-do-professor/10_task.md`

VEREDITO: APROVADO

**Cenários exigidos (correções da 1ª rodada):**
1. A atenção humana no painel sai em ordem de nome, e não pela recência. O mesmo vale para os "Sinais por aluno", cada linha com um bloco de mutação.
2. O histórico do painel é afirmado inteiro: abrir acrescenta um passo, fechar troca o endereço sem passo novo. Um bloco de mutação para cada.
3. O painel aberto pelo endereço devolve o foco ao botão "Ver o uso do Tutor por aluno", com bloco de mutação.

**Cobertos:**
1. **Ordem de nome.** O caso novo está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/TurmaHoje.test.tsx:278`. A API entrega Dani às 13h50 antes de Ana às 13h40, e o teste afirma a lista do painel inteira com `toEqual`, Ana antes de Dani. Assim ele separa nome de recência. Os dois blocos estão em "Mutações": o de `TurmaHoje.tsx:310`, que tira o `porNome` da atenção, e o de `:333`, que tira o dos sinais por aluno. O teste de `:392` pega o segundo, porque a API manda Bruno antes de Ana e o teste afirma Ana antes de Bruno.
2. **Histórico.** `localizacao.history` agora é afirmado inteiro com `toEqual`, depois de abrir pelo "Ver quem", depois de abrir pelo botão do painel (`:426`) e depois de fechar (`:415`). Os dois blocos cobrem as trocas que antes ficavam verdes: `push` virando `replace` deixa a lista com um item só, e o `replace` tirado deixa dois.
3. **Foco.** O caso `montar('aba=hoje&ver=tutor')` fecha o painel e afirma `document.activeElement` igual ao botão do painel. Tem bloco de mutação (`focus` trocado por `blur`, `TurmaHoje.tsx:93`). O título antigo, que prometia sem provar, foi partido em três casos, e cada um prova o que diz. A remoção do `focoDeReserva` está coberta pelo caso do "Ver quem" que some com o painel aberto, porque a releitura resolveu o aviso. Esse caso tem bloco próprio.

**Mudanças novas:**
- A frase de Hoje para quem só tem sinal antigo tem teste com asserção de texto e de ausência de nomes, e tem bloco de mutação.
- O desvio de `Tutor.tsx` quando há mais vínculos numa próxima página tem teste com histórico inteiro e tem bloco de mutação.

Rodei `TurmaHoje.test.tsx` e `Tutor.test.tsx`: 32 testes, todos verdes. Não há `.skip`, mock da regra nem provedor pago. O `afterEach` restaura o relógio real (`:137`).

**Bloqueantes:** nenhum.

**Recomendações:**
- A asserção nova do e2e da turma de outra escola (`e2e/professor-turma-aberta.spec.ts:274`, que diz que nenhum pedido de `/v1/sinais` ou `/v1/tutor/uso` sai para a turma dela) não tem mutação que a prove. Hoje ela é uma defesa a mais, e não a prova da regra 10. A prova continua sendo o "Turma indisponível" e a região ausente.
- A contagem `alunosQuePrecisam` passou a ir ao painel como prop, para o painel dizer o mesmo número que o aviso de Hoje. Falta um caso com o mesmo aluno repetido e o painel aberto que afirme o número igual nos dois lugares.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-19 04:20:16 · `tasks/prd-telas-do-professor/10_task.md`

VEREDITO: APROVADO

Esta é a 2ª rodada. Auditei só o diff `b1c33b9..aca97f2` e o que ele afeta. A 1ª rodada não exigiu correção.

Caminhos de escrita em Nota: nenhum. O diff é só de tela (`apps/web`), testes e documento da tarefa, sem escrita em Nota. O "Acerto por habilidade" continua lendo só correções já aprovadas, como mostram `cheia-hoje-computador.png` e `cheia-hoje-celular.png`. Todos com autor humano? sim, pois nenhum caminho foi criado.
Decisão autônoma sobre aluno: ausente.
Aprovação registrada: ok. Nenhuma saída de IA nova chega ao aluno. A exceção do tutor (D47) não se estende a outro agente.
Supervisão do tutor: ok.
- Quando os sinais de trabalho são todos antigos, a seção "Sinais da turma" agora avisa e aponta para "Ver o uso do Tutor por aluno", em vez de ficar em branco (`TurmaHoje.tsx:147-152`). O teste prova que o texto não traz nome e que a conversa do aluno não abre.
- A atenção humana no painel está em ordem de nome, não de recência. A ordem tem teste e mutação declarada.
- O aviso que a releitura dos 15 s traz resolvido sai da tela, com teste.
- A contagem de quem precisa de um adulto subiu para o componente pai (`TurmaHoje.tsx:75`), com a mesma conta de antes. O painel e o aviso agora mostram o mesmo número.
Autonomia declarada e visível: sim. O cartão do Tutor com o selo "IA" e "O que o Tutor faz sozinho, e o que você vê aqui" continua na aba Hoje, no computador e no celular.
Bloqueantes: nenhum.
- `Tutor.tsx:29`: com mais de uma página de vínculos, a tela vai a Turmas em vez de escolher uma turma sem ter lido todas. É navegação, não decisão sobre aluno, e reduz o risco de abrir a turma errada.
- `professor-turma-aberta.spec.ts`: o e2e passa a provar que nenhum pedido de `/v1/sinais` ou `/v1/tutor/uso` sai com o id da turma de outra escola. Reforça a supervisão sem vazamento.
- Supervisão não é vigilância (item 7) e medir o professor não é vigiar (item 9): nada no diff mede tempo, navegação, emoção ou o professor.
- Sem nota em discursiva e redação (D46, D55): nenhum campo nem texto propõe nota.
Recomendações:
- Continua o limite das fotos registrado na 1ª rodada: a vitrine não tem sinal de atenção humana nem sinal de trabalho antigo. O texto novo e a ordem de nome do painel só estão provados por teste de componente, não na tela. Já está no `TODO.md` pelas "Recomendações sem aplicar" da tarefa.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/TurmaHoje.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Tutor.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/TurmaHoje.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/professor-turma-aberta.spec.ts
- Fotos lidas: /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/.processo/vitrine/rodada2/cheia-hoje-computador.png, /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/.processo/vitrine/rodada2/cheia-painel-computador.png, /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/.processo/vitrine/rodada2/cheia-hoje-celular.png

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-19 04:20:17 · `tasks/prd-telas-do-professor/10_task.md`

VEREDITO: APROVADO

Tela vista: sim (24 arquivos lidos, 16 fotos entre computador e celular, escola cheia e escola vazia, nas quatro telas: Hoje, Atividades, Alunos e o painel "O que o Tutor viu"; mais os 8 `.txt`, que não abri como imagem).

Estados: ok.
- Carregando e erro conferidos pelo código, não pela foto, que não os mostra.
- Hoje tem carregando e erro para os sinais (`TurmaHoje.tsx:129-137`), para o desempenho (`:218-220`) e para o uso do Tutor no painel (`:341-342`).
- Quando as duas leituras caem juntas, a tela mostra um erro só.
- O estado vazio convida: "Nenhum sinal desta turma ainda" diz o que o Tutor avisa, e "Nenhuma atividade aplicada a esta turma" diz como gerar uma.
- O texto novo cobre o buraco de sinais antigos sem grupo nos últimos 7 dias, em `TurmaHoje.tsx:147-152`. A seção deixa de ficar em branco e não usa nome nenhum.
- O redirecionamento do Tutor em `Tutor.tsx` tem carregando e erro com "Tentar de novo".

Acessibilidade: ok.
- A região `aria-live` existe sempre, então o aviso que entra depois é anunciado sem tirar o foco.
- O foco volta ao botão do painel quando o aviso "Ver quem" sai de cena com o painel aberto. O efeito está em `TurmaHoje.tsx:90-96` e o teste novo o prova.
- O painel tem diálogo nomeado, botão "Fechar", abas com rótulo e contraste legível nas fotos.

Chromebook fraco: ok.
- A turma é um `lazy` com um pedaço por aba. O diff não acrescenta peso nem lista longa.
- O painel descarta o cache ao fechar (`gcTime: 0`).

Celular: ok.
- Em 360 px não há rolagem horizontal nem texto cortado nas oito fotos de celular.
- A ação principal tem 44 px ou mais: "Ver o uso do Tutor por aluno", "Gerar acesso" e "Ver o acesso dos alunos".
- Nas fotos, a barra inferior cobre trechos da página longa. É efeito da captura de página inteira com barra fixa, não defeito de tela.
- O painel vira folha de baixo no celular e o texto novo usa `min-w-0` e `break-words`.
- Nenhum fluxo exige o celular.

Ação oficial protegida: sim. A tarefa não tem ação oficial. Hoje só lê. O nome aparece só depois de "Ver quem" ou de "Ver o uso do Tutor por aluno", e nada abre a conversa do aluno.

Bloqueantes: nenhum.
- Nenhuma foto mostra termo técnico, id, inglês, rolagem horizontal, alvo pequeno ou tela vazia em branco.
- O tom e a pele batem com a pele Turmma.
- O texto de IA tem a marca: "Tutor" com selo "IA" e `MensagemIA`.
- Pelo diff, as correções da rodada anterior estão feitas:
  - `Tutor.tsx` vai a Turmas quando há mais de uma página de vínculos, com teste e mutação.
  - O painel e o aviso de Hoje usam a mesma contagem de alunos, passada por `alunosQuePrecisam`.
  - A ordem do painel é por nome.
  - Abrir o painel é um passo no histórico e fechar troca o endereço.
  - O e2e prova que nenhum pedido de sinais ou de uso sai para a turma de outra escola.
- A rodada anterior não exigiu correção.

Recomendações (não bloqueiam):
- A vitrine não tem sinal de atenção humana nem sinais por aluno. O aviso, a ordem de nome, a linha nominal do painel e o texto novo dos sinais antigos nunca foram vistos em foto, só em teste de componente. Quando `tools/vitrine/` ganhar esses casos, fotografe-os, principalmente o aviso em 360 px e em 1366 px.
- Em `cheia-hoje-*` e `cheia-painel-*`, "Nenhum aluno acertou menos da metade das questões desta habilidade nas atividades aprovadas." se repete sob cada habilidade. Fica pesado e é a mesma frase duas vezes. Vale uma única nota ao fim da seção ou só quando houver exceção.
- O contorno azul de foco em volta do corpo do painel (`cheia-painel-computador.png`) é pesado em 1366 px. O componente é `PainelLado`, da casca, e já está registrado como recusado nesta tarefa. Fica para a linha da casca.
- Em `vazia-alunos-*` a aba não tem a seção "Por aluno". O convite fica só nos dois blocos de acesso. Uma frase de "Por aluno" vazia, como "Os acertos aparecem aqui quando houver correção aprovada", fecharia o quarto estado da aba.
- A hora exata e o aviso sem limite de data continuam no alto de Hoje, que se projeta em sala. Já está em `TODO.md`, com pergunta ao Arquiteto.

Arquivos principais:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/TurmaHoje.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Tutor.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/.processo/vitrine/rodada2/`

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-19 04:20:27 · `tasks/prd-telas-do-professor/10_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. O diff só muda onde os dados já lidos (sinais e uso do Tutor) aparecem na tela. O `alunosQuePrecisam` agora é uma contagem calculada uma vez, em `TurmaHoje.tsx:75`, e passada ao painel, que antes repetia a mesma conta. Continua sendo só um número, sem nome.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok.
- `Tutor.tsx:29` agora só leva direto a uma turma quando os vínculos cabem numa página. Se há mais páginas, manda para Turmas. Isso reduz a chance de abrir uma turma escolhida com informação incompleta, e o caso `com mais vínculos na página seguinte` tem uma mutação que o prova.
- `e2e/professor-turma-aberta.spec.ts:106-116` passou a provar que, com a turma de outra escola na URL, nenhum pedido a `/v1/sinais` ou `/v1/tutor/uso` sai com o id dela.
- A resposta continua "Turma indisponível", igual à da turma que não existe.

Logs: limpos. O diff não acrescenta nenhum log.

Auditoria: nada novo a exigir. O diff não traz leitura por coordenação ou rede, exportação, nota, permissão nem aprovação de saída de IA.

Envio externo: nenhum.

Seed/fixture: sintético. As fotos mostram "Colégio sintético da vitrine", "Professora Sintética Helena", "Aluno Sintético Caio", e o teste usa "Ana Sintética" e "Dani Sintética".

Fotos da rodada 2 (`.processo/vitrine/rodada2/`):
- `cheia-hoje-computador.png` e `vazia-hoje-computador.png`: a aba Hoje não mostra nome nenhum, só a seção "Sinais da turma", o estado vazio e o acerto por habilidade em agregado ("2 de 2", "1 de 2").
- `cheia-painel-computador.png` e `cheia-painel-celular.png`: os nomes ficam só no painel. O painel avisa que o que foi dito ao Tutor não aparece e que nada abre a conversa de um aluno.
- `cheia-alunos-computador.png`: o nome do aluno aparece com os acertos na aba Alunos, para a professora da turma, como a matriz de visibilidade permite.

O texto novo para sinais antigos (`TurmaHoje.tsx:147-152`) não aparece nas fotos, como o prompt avisou. Pelo código, ele é fixo e sem nome, e `TurmaHoje.test.tsx` (`sinal de trabalho só antigo`) confere com `seNomes(textoDaPagina())` que nenhum nome vai para a tela, com uma mutação que o prova.

Bloqueantes: nenhum.

Recomendações:
- A atenção humana continua contada só na primeira página de sinais (`TurmaHoje.tsx:75`), e o nome continua chegando ao navegador antes do "Ver quem". As duas já estão registradas como dívida para o `TODO.md` em "Recomendações sem aplicar" de `10_task.md`. Vale conferir no `/validar` que entraram de fato no `TODO.md`.
- O caso novo, em que o aviso some quando os sinais são relidos a cada 15 s, faz a projeção em sala parar de mostrar uma atenção que já passou. Isso vai na direção da recomendação da 1ª rodada sobre o aviso antigo que ficava no alto da tela, mas não substitui a pergunta ao Arquiteto sobre uma versão discreta na aba projetada.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/TurmaHoje.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Tutor.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/professor-turma-aberta.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tasks/prd-telas-do-professor/10_task.md`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-19 04:20:30 · `tasks/prd-telas-do-professor/10_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

**A correção exigida na 1ª rodada foi feita.** Em `apps/web/src/areas/professor/TurmaHoje.tsx:148-152`, quando a turma não tem grupo e tem sinal de trabalho, Hoje agora mostra "Nenhum sinal agrupado da turma nos últimos 7 dias. Os sinais mais antigos, por aluno, estão em “Ver o uso do Tutor por aluno”." O texto não leva nome.

O texto não engana a professora. Na API (`supervisao.repository.ts:192-202`), qualquer sinal de trabalho dos últimos 7 dias já forma um grupo, mesmo com um aluno só, e o teto `MAXIMO_DE_GRUPOS_DE_SINAL` limita quantos grupos vêm, sem zerar a lista. Então lista de grupos vazia com sinal de trabalho só acontece quando todos os sinais têm mais de 7 dias, que é o que a frase diz.

O caso que a correção pedia está em `TurmaHoje.test.tsx:194-204`: confere o texto, que o vazio da turma sem sinal não aparece, que o bloco do agrupado não aparece e que nenhum nome vai à tela. A mutação `trabalho.length > 99` está declarada para esse caso.

**O resto do que mudou desde a 1ª rodada, conferido:**
- **Redirecionamento do Tutor:** com mais vínculos numa página seguinte, `Tutor.tsx` deixa de escolher a turma e manda para Turmas. Tem teste e mutação.
- **Contagem de quem precisa de um adulto:** o painel passa a receber o número por prop, o mesmo que o aviso de Hoje mostra, e deixou de recalcular.
- **Foco ao fechar o painel:** o `focoDeReserva` saiu. O efeito de foco cobre os dois caminhos em que o foco cairia no corpo da página: o painel aberto pelo endereço e o "Ver quem" que some com o painel aberto. Os dois têm caso e mutação.
- **Pedidos à turma de outra escola:** o caso em `professor-turma-aberta.spec.ts` confere que nenhum pedido de sinais ou de uso do Tutor sai para essa turma.
- **Tabela de divergências:** agora cita seções que existem na Tech Spec (§2, §7, §7c, §9, §10).

**Fotos da tela:** não aparece nada fora do que a tarefa pede, e os nomes seguem o glossário (Hoje, Atividades, Alunos, "Sinais da turma", "O que o Tutor viu"). O texto novo dos sinais antigos não aparece em nenhuma foto, porque a escola da vitrine não tem sinal; ele está coberto só pelo teste do componente.

Recomendações:
- **Pendências que dizem ir ao `TODO.md`:** seis linhas de "Recomendações sem aplicar" em `10_task.md` dão o `TODO.md` como destino, e o `TODO.md` não foi alterado. As linhas da 2.0 também não estão lá, então parece que o arquivo só é escrito no fechamento da spec (`validar`). Vale confirmar que a validação copia essas seis linhas, para nenhuma se perder.
- **Celular, em `vazia-painel-celular.png`:** abaixo do painel aparece a página sem a camada por cima. Provavelmente é efeito da foto da página inteira, maior que a tela. A qualidade visual é do `frontend-reviewer`; deixo só o aviso.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/TurmaHoje.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/TurmaHoje.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Tutor.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/api/src/tutor/supervisao.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tasks/prd-telas-do-professor/10_task.md

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-19 04:20:31 · `tasks/prd-telas-do-professor/10_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma. O diff desta rodada não traz migration nem schema, e não mexe em `packages/` nem em `apps/api`.

Queries verificadas: as leituras do navegador que esta rodada toca, todas na API e com o escopo vindo do token.
- `GET /v1/sinais?turmaId=` e `GET /v1/tutor/uso?turmaId=`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/api/tutor-da-turma.ts:16` e `:29`. Nenhuma mudou nesta rodada, e nenhuma manda `escolaId`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Tutor.tsx:28`: a nova condição `!vinculos.hasNextPage` só deixa a escolha da turma para a tela Turmas. Os vínculos vêm da leitura da própria sessão, e nenhum id é recebido do cliente.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/TurmaHoje.tsx:147-152`: o texto novo dos sinais antigos não tem nome. A contagem que passou a vir por prop (`alunosQuePrecisam`) é a mesma conta de antes e vem dos sinais da turma já lida.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Turma.tsx`: só comentário mudou.

Teste de isolamento: presente e efetivo.
- A asserção nova está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/professor-turma-aberta.spec.ts:106-115`. Ela registra os pedidos a `/v1/sinais` e `/v1/tutor/uso` antes da navegação e exige que nenhum leve o `turmaId` da turma de outra escola.
- O `turmaId` vai na query string em claro (é UUID), então o filtro `includes` acerta.
- Removendo mentalmente a condição de que Hoje só monta com a turma lida, a aba dispara esses pedidos e o teste quebra.
- O caso continua exigindo "Turma indisponível", que é a mesma resposta da turma inexistente, sem o nome da turma e sem a região "Sinais da turma".

Bloqueantes: nenhum.

Recomendações:
- Hoje a asserção só olha os pedidos de sinais e de uso do Tutor. Valeria estender a mesma observação aos pedidos de desempenho da aba Hoje, para provar que nenhuma leitura sai para a turma de outra escola, e não só as do Tutor.
