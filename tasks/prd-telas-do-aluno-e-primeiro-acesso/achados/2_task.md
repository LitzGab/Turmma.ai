# Achados das revisões — `tasks/prd-telas-do-aluno-e-primeiro-acesso/2_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-25 03:44:42 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/2_task.md`

VEREDITO: APROVADO

Tela vista: sim (12 fotos lidas: Início, Eu e Tarefas, no computador e no celular, na escola cheia e na vazia). Nenhuma tela rola a 1366 × 768.

Estados: ok. Li o código; carregando e erro não aparecem na vitrine.
- Início: carregando (`EscolhaDaAtividade.tsx:46`), erro com "Tentar de novo" (`:47-49`), vazio só depois de a leitura terminar (`:50`) e com dado. O vazio diz o que acontece e quando a atividade aparece, e não se desculpa.
- Eu: carregando, com dado e erro com "Tentar de novo", como no Início. O aluno sem turma no ano tem texto próprio que diz a quem recorrer (`Eu.tsx:21`, `:41-46`).
- As linhas Privacidade e Sair existem em todos os estados de Eu, então o "Sair" nunca depende de a turma carregar (`Eu.tsx:73-95`, D59).
- Tarefas só mudou de nome (`Atividades.tsx`) e mantém o estado vazio, "Nada para fazer agora".

Acessibilidade: ok.
- Cada linha de Eu é um `<a>` ou `<button>` de 64 px, e o anel de foco fica por dentro (`Linha.tsx`).
- Eu tem `h1` visível e `h2` no cartão da turma.
- Início tem `h1` só para leitor de tela (`Inicio.tsx:17`), e a escolha da atividade tem `aria-labelledby`.
- As abas têm `aria-current` pela navegação. O hover só reforça, não é a única pista.

Chromebook fraco: ok. `Inicio` e `Eu` entram por `lazy` (`rotas.tsx`) e não pesam no chunk da área. A lista de atividades pagina com "Ver mais", sem rolagem infinita (D59). Esta tarefa não mexe em upload de imagem.

Celular: ok. Nos 360 px das fotos não há rolagem horizontal nem texto cortado, e o nome da escola trunca com reticências no cabeçalho.
- A barra de baixo tem três itens de cerca de 44 px, o "SAIR" do cabeçalho tem cerca de 44 px, e as linhas de Eu e da escolha de atividade passam de 44 px.
- Existem e2e a 360 px (`e2e/minha-turma.spec.ts:159-207`, W12). Não rodei o projeto `celular`; julguei pelas fotos e pelo código.

Ação oficial protegida: sim, não se aplica. A tarefa não tem aprovar, publicar, excluir nem exportar. Sair é a saída de sempre, a um clique, e a linha de Eu usa a mesma função do botão da casca (`CascaDaEscola.tsx:249`, `saida-da-casca.ts`). A faixa "Quem dá a aula acompanha como você usa o Tutor." está no Início, presa e sem botão de fechar (D8, regra 70 item 4). Vi na foto, no Início, que não aparece dado de colega, número de uso nem coisa que empurre o aluno (regra 50 item 9, D59).

Português e termos: nada em inglês nem chave de tradução. O que aparece de técnico são ids no nome do aluno, da turma e da escola ("df86225e", "85be806b"), que vêm do dado sintético da vitrine e não do componente.

Bloqueantes: nenhum.

Recomendações:
1. `apps/web/src/componentes/CascaDaEscola.tsx:300` e `:361`: o `<ContextoDaSaida>` ficou sem recuo em volta do `<div>` que ele envolve. Rodar o formatador. Se o portão tiver `prettier --check`, isso é o que ele aponta.
2. Eu e Início, em 1366 px, deixam metade da tela vazia à direita (largura "conversa"). É o padrão das telas do aluno e a 3.0 e a 7.0 recompõem as duas, então não bloqueia.
3. As fotos mostram "aluno" em minúsculo como papel no rodapé da lateral e o nome sintético com id. Isso é da casca e não desta tarefa, mas vale registrar para a validação.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 03:44:50 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/2_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A tarefa só mexe no web (navegação, telas Início e Eu, a saída da casca), nos e2e e na documentação. Nenhuma escrita em `Nota`, em correção ou em `lancadaPor`. Todos com autor humano? Sim, por vacuidade.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok. Nenhuma saída de IA nova chega ao aluno. A exceção da D47 continua só no Tutor.

Supervisão do tutor: ok.
- A faixa saiu de `Tutor.tsx` e foi para `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/FaixaDeSupervisao.tsx` com o mesmo texto e o mesmo `data-faixa-de-supervisao`. Continua presa no topo e sem botão de fechar.
- Ela aparece no Início (`Inicio.tsx:18`) e no Tutor, tanto na escolha quanto na conversa (`Tutor.tsx:284`).
- Testes que provam: `apps/web/src/areas/aluno/Inicio.test.tsx` (`conferirAFaixa` nos quatro estados, com zero botões) e `e2e/aluno-tutor.spec.ts:87-170`, que passa pelo Início e confere a faixa sem botão nem link, ainda visível depois de rolar.
- Nas fotos `aluno--aluno-inicio--computador.png`, `aluno--aluno-inicio--celular.png`, `vazia--aluno--aluno-inicio--computador.png` e `vazia--aluno--aluno-inicio--celular.png`, a faixa "Quem dá a aula acompanha como você usa o Tutor." está no topo em todas, cheia e vazia, no computador e no celular.

Autonomia declarada e visível: sim. Nada aqui toca governança nem nível de agente.

O que conferi também, pelas fotos e pelo código:
- **Nota e conceito (D55):** nenhuma nota, conceito ou sugestão de nota em Início, Eu ou Tarefas. Em Tarefas, "Com resultado / A correção foi aprovada" já existia antes desta tarefa, vale só para objetiva e diz que a correção foi aprovada por uma pessoa (`aluno--aluno-atividades--computador.png`).
- **Supervisão não é vigilância (item 7):** Eu mostra só turma, série e escola. Não há dado de colega, número de uso, ranking nem inferência sobre o aluno.
- **Uso excessivo e saída (D59, item 4b):**
  - A lista de atividades do Início só carrega mais com o botão "Ver mais atividades", sem rolagem infinita (`EscolhaDaAtividade.tsx:164-171`).
  - O "Sair" continua à vista na casca em todas as telas.
  - A linha "Sair" de Eu chama a mesma saída da casca (`Eu.tsx:112`, `CascaDaEscola.tsx`, `saida-da-casca.ts`) e aparece em todos os estados do cartão da turma. Fotos: `aluno--aluno-eu--computador.png` e `aluno--aluno-eu--celular.png`.
  - "Privacidade" fica a um toque, dentro de Eu.
- **Medir o professor (D45):** a tarefa não toca.

Bloqueantes: nenhum.

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/__fixtures__/aluno.ts:57-61`: o comentário de `memoria` diz que Eu trata `NAO_ENCONTRADO` como "sem resultado", mas o Eu desta tarefa nem chama `/v1/tutor/memoria`. Escrever "Eu tratará (7.0)", ou mover o comentário para a tarefa que liga isso. O item 4d da regra 70 (o aluno vê o que o Tutor sabe dele e pode contestar) também depende dessa tarefa.
2. Para a 3.0: o aluno agora abre no Início "tenha ou não o Tutor ligado" (`docs/interface.md`, tabela de lugares), e o Início diz "Em qual atividade você quer ajuda?" mesmo com o Tutor desligado para a turma (D19), ou suspenso. O aviso só aparece dentro da conversa. Não viola a regra 70, porque a faixa é verdadeira e o servidor aplica a política. Mesmo assim, vale o Início não prometer ajuda que a turma não tem.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-25 03:44:58 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/2_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login (o destino de quem entra muda de `/aluno/atividades` para `/aluno/inicio`)
Rate limit: ok (nenhum endpoint novo nem limite novo; o diff é só de frontend)
Fila e prioridade: ok (não se aplica, nenhum job novo)
Concorrência: protegida (o "Sair" de Eu usa a mesma `encerrar` da casca, que ignora o segundo clique pelo `saindo`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/CascaDaEscola.tsx:240-249`)
Índice e paginação: ok (nenhuma query nova; o Início usa a mesma `consultaMinhasAtividades` paginada que a tela "Atividades" usava, e a página seguinte só vem quando o aluno pede; Eu usa o mesmo `GET /v1/minha-turma` da antiga "Minha turma")
Degradação de IA: não se aplica (nenhuma chamada de modelo; a faixa e a escolha da atividade foram tiradas de `Tutor.tsx` sem mudar comportamento)
Migration: não se aplica
Métrica e alerta: ok (nenhum código novo de servidor no caminho quente)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/__fixtures__/aluno.ts`: a API simulada passa a responder `GET /v1/tutor/memoria` e `GET /v1/tutor/conversa` sem atividade, mas nada no código desta tarefa chama essas rotas. Quando a 3.0 ou a 7.0 fizer o Início ou o Eu chamá-las, a tela vai receber mais leituras na rajada das 7h30. Essa tarefa precisa medir o número de requisições na entrada do aluno e atualizar o cenário `login às 7h30` do teste de carga.
- A trava contra dois cliques no "Sair" fica no `useState` do cliente, então dois cliques na mesma renderização podem mandar dois pedidos de encerrar a sessão. Hoje isso não é bug, porque encerrar a sessão no servidor já é idempotente. Vale um teste de API que prove isso, se ainda não houver.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-25 03:45:45 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/2_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** nenhum campo novo. A tela Eu (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Eu.tsx`) mostra o mesmo que `MinhaTurma.tsx` mostrava antes (nome da turma, série e nome da escola), pelo mesmo `consultaMinhaTurma` e pelo mesmo contrato de `GET /v1/minha-turma`. O Início mostra o título e o resumo da atividade, que já vinham de `consultaMinhasAtividades`. A tarefa só mexe no frontend: não tem migration, repository, endpoint nem DTO novo.

**Fora da tabela de dados do docs/lgpd.md:** nada. Nenhum campo entra, e nenhuma linha de `docs/lgpd.md` fala de "Minha turma" ou do rodapé, então a tabela não precisa mudar.

**Autorização por objeto:** ok. Não há rota de API nova. A conversa do Tutor continua tratando `NAO_ENCONTRADO` com o mesmo texto, seja a atividade de outra turma ou inexistente (`Tutor.tsx`; só mudou o texto para "Escolha a atividade em Início"). O redirecionamento de `/aluno/minha-turma` para `/aluno/eu` com `replace` fica dentro da área do aluno, que a guarda de papel já protege.

**Logs:** limpos. O diff não acrescenta `console.*` nem `logger`.

**Auditoria:** não se aplica. É leitura do próprio aluno, sem coordenação, rede, exportação, nota, permissão nem aprovação de IA.

**Envio externo:** nenhum. A API simulada do aluno nos e2e passou a responder `/v1/tutor/memoria`, mas nada no app consome isso nesta tarefa, e nada sai para provedor.

**Seed/fixture:** sintético. Os testes usam "Escola sintética", "Colégio Vista Alegre", "Camila Souza" e UUIDs fixos, e os e2e criam alunos com `criarAlunoComMatricula()`. As fotos mostram "Aluno Sintético Caio df86225e", "Colégio sintético da vitrine cheia 85be806b" e "Cinemática: lista sintética".

**Fotos da tela** (12 arquivos, na pasta `.processo/vitrine/` do andar), conferidas contra a regra 20:
- `aluno--aluno-eu--computador.png` e `aluno--aluno-eu--celular.png` (gerado por `Eu.tsx:47-58`): só a turma, a série e a escola. Não aparece colega, professor nem matrícula, e o "Sair" fica à vista nos dois tamanhos.
- `aluno--aluno-inicio--*.png` e `vazia--aluno--aluno-inicio--celular.png` (gerados por `EscolhaDaAtividade.tsx` e `FaixaDeSupervisao.tsx`): a faixa de supervisão sem botão de fechar e só as atividades do próprio aluno, sem número de uso nem dado de terceiro.
- `aluno--aluno-atividades--computador.png`: só o estado das atividades dele, sem média nem posição na turma.
- A casca mostra o nome do próprio aluno no rodapé da lateral, como já fazia antes. Não é dado novo.

**Bloqueantes:** nenhum.

**Recomendações:**
1. A tabela de testes da tarefa promete "o aluno seguinte no mesmo Chromebook vê o Início e o Eu dele". O Eu está provado (`e2e/minha-turma.spec.ts`, "recomeço de Eu"). O Início só é conferido pelo título e pelo nome na lateral (`esperarInicioDoAluno`). Nenhum caso dá atividades ao primeiro aluno e confere que elas não aparecem no Início do segundo. O dado está protegido de qualquer jeito, porque o cache é esvaziado no fim de sessão (`apps/web/src/api/sessao.ts`, `encerrarLocalmente`). Falta só a prova específica: vale acrescentar o caso no `test-engineer` ou na 3.0, quando o Início for recomposto.
2. "Meus dados" (direito de acesso do titular) passou de um clique, no rodapé fixo, para dois (Eu e depois Privacidade). Continua alcançável e com teste em `e2e/meus-dados.spec.ts`. Vale anotar em `docs/lgpd.md`, na parte de direitos do titular, por onde o aluno chega lá hoje, para a resposta ao jurídico apontar a tela certa.
3. `e2e/troca-de-escola.spec.ts` agora confere o texto da tela uma vez só (`textContent`), em vez de esperar com `not.toContainText`. A prova continua equivalente, porque a leitura só acontece depois que o Início do aluno aparece. Vale manter assim e não voltar a ler antes de o Início aparecer.

**Pergunta de fechamento:** esta tarefa não cria dado nem destino novo. O que o sistema guarda sobre o aluno e para onde enviou continua respondido pelos mesmos caminhos de antes (`arquivo-do-titular`, `ExecucaoAgente`).

## revisor-geral · 1ª rodada · APROVADO · 2026-10-25 03:46:03 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/2_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)

Bloqueantes: nenhum

As seis subtarefas foram feitas e nada invade as tarefas 3.0, 4.0, 5.0, 7.0 ou de 9.0 a 11.0:
- Os endereços `bem-vindo` existem só em `caminhos.ts`, sem rota.
- `ehTelaDeFoco` existe, mas a casca ainda não a usa.
- `Eu.tsx` traz só o cartão da turma e as linhas Privacidade e Sair.
- O Início não lê `tutor/conversa`, como pede a seção 7c.

As fotos batem com o RF1 e o RF2. São três lugares (Início, Tarefas e Eu) na lateral e na barra de baixo, sem rodapé. O título "Tarefas" aparece na tela e na aba. Eu mostra a turma e as linhas Privacidade e Sair. A faixa de supervisão está no Início, com o texto de antes.

Recomendações:
1. **Comentário que contradiz a Tech Spec.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/__fixtures__/aluno.ts`, logo antes de `const atividade = url.searchParams.get('atividadeAplicadaId')`, está escrito "o Início, que pergunta o estado do Tutor sem abrir conversa". A seção 7c e a 12b, item 4, proíbem isso, e nenhum código faz essa leitura. O comentário deve dizer para que serve a resposta, sem atribuí-la ao Início.
2. **Comentários desatualizados.**
   - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Atividades.tsx:41` ainda diz "É onde o aluno abre". Agora o aluno abre no Início.
   - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Tutor.tsx:275` ainda diz "pelo item da lateral, a escolha da atividade", e o Tutor já não é item da lateral.
3. **Comentário fora do lugar.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/areas.spec.ts`, no caso "o aluno vê Início, Tarefas e Eu", o comentário "A marca leva à raiz, e a raiz do aluno é Início" está antes de `irPelaNavegacao(page, 'Eu')`. Deveria estar antes de `voltarAoInicio`.
4. **Texto do glossário.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/docs/glossario.md:226` diz "a página Início que antes só redirecionava". Ela ainda redireciona (`paginas/Inicio.tsx`), então o "antes" engana.
5. **Seta na linha "Sair".** Em Eu, a linha "Sair" mostra a mesma seta das linhas que levam a outra tela (foto `aluno--aluno-eu--celular.png`, origem `apps/web/src/areas/aluno/Eu.tsx`). Quem decide é o `frontend-reviewer`, porque ação e navegação ficam com a mesma cara.
6. **Para o `test-engineer`.** O caso da avaliação aberta em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/aluno-fluxo.spec.ts` (por volta da linha 172) conferia contra a API real o aviso na lista de atividades. Agora confere no Início. Vale ele confirmar se o aviso em Tarefas continua provado em outro teste, por causa do RF21 (nenhum teste de regra enfraquecido).

## test-engineer · 1ª rodada · REPROVADO · 2026-10-25 03:46:33 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/2_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Lugares (unidade):** três itens e rodapé vazio. Início acende em `/aluno/tutor` e na conversa, Eu acende em `/aluno/privacidade`. Endereço de prefixo parecido não acende nada.
- **Lugares na tela (e2e):** cada item leva à sua tela, com o título da aba e `aria-current`. No celular, os itens ficam na barra de baixo.
- **Endereços (e2e):** a entrada cai em `/aluno/inicio`. `/aluno/tutor`, `/aluno/privacidade` e `/aluno/atividades` continuam abrindo. `/aluno/minha-turma` vai para `/aluno/eu` com `replace`.
- **Borda, aluno sem turma no ano (virada de ano letivo):** a tela mostra o texto de hoje, e não erro de rede.
- **Supervisão:** a faixa aparece no Início e na conversa, sem botão de fechar.
- **Privacidade e Sair:** "Meus dados" se alcança por Eu a 360 px. "Sair" fica a um clique nos três lugares, e também quando a leitura da turma falha.
- **Estados da tela:** Início e Eu em carregando, erro, vazio (só depois da leitura terminar) e com dado.
- **Recomeço:** o aluno seguinte no mesmo Chromebook vê o Início e o Eu dele, e nada do anterior.
- **Permissão:** quem não é aluno não alcança `/aluno/eu`. O aluno não alcança os endereços do professor nem os da coordenação.
- **Concorrência:** clique duplo no "Sair" da linha de Eu.

**Cobertos:**
- **Lugares:** `navegacao.test.ts` ("cada endereço do aluno acende", "o aluno não tem rodapé fixo"), `BarraDeBaixo.test.tsx` e `CascaDaEscola.test.tsx` (estreita).
- **Lugares na tela:** `e2e/areas.spec.ts › o aluno vê "Início", "Tarefas" e "Eu"…`. O caso confere o título, o `aria-current` e que só um item fica aceso, nos projetos `chromebook` e `celular`.
- **Endereços:**
  - `esperarInicioDoAluno`, `areas.spec.ts › os endereços de hoje do aluno…` e `areas.spec.ts › o endereço de Minha turma leva a Eu…`. O `goBack` fica vermelho se o `replace` sair.
  - `rotas.test.tsx`, `paginas/Inicio.test.tsx` e `caminhos.test.ts`.
- **Borda sem turma:** `e2e/minha-turma.spec.ts` (o caso de `NAO_ENCONTRADO`) e `Eu.test.tsx › o aluno sem turma no ano`.
- **Supervisão:**
  - `aluno-tutor.spec.ts` confere a faixa no Início (linha 93) e confere que ela não fecha na conversa (linhas 167 e 168).
  - `Inicio.test.tsx › conferirAFaixa` confere a faixa e a ausência de botão, nos quatro estados.
- **Privacidade e Sair:**
  - `meus-dados.spec.ts › o aluno acha Privacidade em Eu…` confere o alvo de 44 px, a largura excedente 0 e Eu aceso em Privacidade.
  - `minha-turma.spec.ts › RF3…` tem os dois casos.
  - `CascaDaEscola.test.tsx › a tela que consome o contexto…` confere o DELETE e o `replace` para `/entrar`.
- **Estados:** `Eu.test.tsx` e `Inicio.test.tsx`, com os quatro estados cada um, mais `titulo-das-telas.test.tsx`.
- **Recomeço de Eu:** `minha-turma.spec.ts › recomeço de "Eu"`.
- **Permissão:**
  - `areas.spec.ts`: o professor abre `/aluno/eu` e cai em "não encontrada", sem baixar o chunk.
  - `areas.spec.ts`: o aluno abre `/professor/...` e `/coordenacao/...` e cai em "não encontrada".
- **Isolamento:** não se aplica. A tarefa não toca API nem repository.
- **Mutações:** os 27 blocos batem com o `git diff`, e cada nome de teste citado existe. Nenhuma cláusula nova ficou sem bloco. Nenhum `.skip`. A rede falsa é só o `fetch`, e não esconde regra nossa. Rodei os 7 arquivos de unidade da tarefa: 50 de 50 verdes.

**Bloqueantes:**
1. **O recomeço do Início não tem teste.** A linha "recomeço da tela" (`tasks/prd-telas-do-aluno-e-primeiro-acesso/2_task.md:56`) pede "o aluno seguinte… vê o Início **e** o Eu dele; a resposta atrasada do anterior não aparece".
   - Só o Eu tem e2e: `e2e/minha-turma.spec.ts:115-156`.
   - No Início, o segundo aluno só passa por `esperarInicioDoAluno` (`minha-turma.spec.ts:148`). Isso confere o nome dele na lateral, e não as atividades da tela.
   - Nenhum e2e intercepta `/v1/minhas-atividades`: a busca só acha a rota em `e2e/__fixtures__/aluno.ts`.
   - Se o cache das atividades do primeiro aluno sobrevivesse à troca de sessão, o Início mostraria as atividades dele ao colega, e nenhum teste ficaria vermelho.
   - **Correção exigida:** um caso e2e com dois alunos na mesma aba, cada um com uma atividade de título distinto (API real, ou `simularAluno` respondendo por sessão).
     - O primeiro vê a atividade dele no Início e sai.
     - O segundo entra com a leitura de `/v1/minhas-atividades` segurada. O Início mostra "Carregando as suas atividades…", e o `body` não tem o título da atividade do primeiro.
     - Liberada a leitura, aparece a atividade do segundo, e a do primeiro continua ausente.
     - Cite o caso pelo nome na tabela.

**Recomendações:**
- `apps/web/src/areas/aluno/rotas.test.tsx:44` prepara `/v1/atividades`, mas o Início lê `/v1/minhas-atividades`. A rede falsa só casa o caminho exato (`__fixtures__/tela.tsx:62`), então a chamada estoura "sem resposta preparada" e a tela cai no erro. O caso passa só porque confere o `h1`. Trocar para `/v1/minhas-atividades` e conferir também o vazio.
- Clique duplo no "Sair" da linha de Eu: `saida-da-casca.ts:10` promete "dois cliques saem uma vez só", e a `Linha` não fica `disabled` enquanto sai. Falta um teste com dois cliques seguidos na linha que confira um único `DELETE /v1/sessao`, na casca de verdade e não com o `vi.fn`.
- No e2e do Início, conferir também `faixa(page).getByRole('button')` com contagem 0 (hoje isso só está provado na conversa e no componente).
- `e2e/minha-turma.spec.ts:126` usa `.first()` para pegar o "Sair" da casca. Localizar pelo contêiner, como pede a armadilha da tarefa, é mais robusto que depender da ordem no documento.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/prd-telas-do-aluno-e-primeiro-acesso/2_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/minha-turma.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/rotas.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/saida-da-casca.ts

## revisor-geral · 2ª rodada · APROVADO · 2026-10-25 04:11:54 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/2_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

**O que conferi nesta rodada**

- **Recomendações sem aplicar:** a seção em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/prd-telas-do-aluno-e-primeiro-acesso/2_task.md` dá destino ou motivo para cada uma. Quatro vão para tarefas futuras (3.0, 7.0 e 9.0). A da idempotência do `DELETE /v1/sessao` virou linha nova no `TODO.md`. A do formatador foi recusada porque o repositório não usa o prettier. Não há "anularia as aprovações" como motivo.
- **Teste do clique duplo** (`apps/web/src/componentes/CascaDaEscola.test.tsx:326`): o botão de teste `LinhaDeSaida` não tem `disabled`. Por isso o segundo clique chega de fato a `encerrar()`, e a mutação que tira `if (saindo) return` (`CascaDaEscola.tsx:241`) gera um segundo `DELETE`. O teste prova a trava.
- **`rotas.test.tsx`:** o caso do Início agora responde pelo endereço certo, `/v1/minhas-atividades`. O caso exige o vazio e a ausência de `alert`, então não passa mais com uma chamada sem resposta preparada.
- **Recomeço do Início** (`e2e/minha-turma.spec.ts`): a primeira página de `consultaMinhasAtividades` vai sem `?pagina=`, e o padrão `**/v1/minhas-atividades` pega essa chamada. O teste segura a leitura do segundo aluno e confere que o título do primeiro não aparece no `body`. `sairPelaCasca` agora escolhe o "Sair" pelo contêiner, fora do `main`, e não pela ordem no documento.
- **Glossário e comentários:** a mudança em `Atividades.tsx`, `Tutor.tsx` e `e2e/__fixtures__/aluno.ts` é só de texto e bate com o que a tela faz.
- **Fotos:** o Início cheio e o vazio, Eu no celular e Tarefas no computador estão com os nomes do glossário (Início, Tarefas, Eu). A faixa de supervisão está no Início, sem botão de fechar, e não aparece nada fora do que a tarefa pede. Não muda nada em relação à 1ª rodada.

Recomendações:
- `e2e/minha-turma.spec.ts:261`: o padrão `**/v1/minhas-atividades` não pega `?pagina=`. Hoje não faz diferença, porque o fixture devolve uma página só, mas `**/v1/minhas-atividades*` deixaria o caso firme se um dia houver segunda página.
- A linha do test-engineer da 1ª rodada consta como REPROVADO na seção "Revisões" do `2_task.md`. Esse veredito é dele e não pesa no meu, mas o commit continua preso até a rodada nova dele.

## test-engineer · 2ª rodada · APROVADO · 2026-10-25 04:12:23 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/2_task.md`

VEREDITO: APROVADO

**Cenários exigidos (tarefa 2.0):** o aluno abre no Início; três lugares na lateral (Início, Tarefas, Eu); `/aluno/tutor` continua abrindo a escolha da atividade; faixa de supervisão sem botão de fechar; "Meus dados" e "Sair" a partir de Eu, a 360 px; quatro estados no Início e no Eu; recomeço da tela quando o aluno seguinte entra no mesmo Chromebook; clique duplo em "Sair" (concorrência, regra 80); o aviso de avaliação antes de abrir a atividade.

**Cobertos:**
- **Correção exigida, recomeço do Início: feita.** O caso novo está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/minha-turma.spec.ts:166-205`, citado pelo nome na tabela (`2_task.md:56`).
  - `page.route` responde conforme o aluno da vez, com um título distinto para cada um.
  - O primeiro aluno vê a atividade dele e sai.
  - O segundo entra na mesma aba, sem recarregar, com a leitura segurada. O teste confere "Carregando as suas atividades…" e um `body` sem o título do primeiro. Depois de liberada a leitura, aparece a atividade do segundo, e a do primeiro continua ausente.
  - O teste falharia se o cache sobrevivesse à troca de sessão. A chave da consulta é fixa, `['minhas-atividades']` (`apps/web/src/api/chaves-do-aluno.ts:5`). Se o cache sobrevivesse, `isPending` seria falso: o "Carregando" não apareceria e o título do primeiro estaria no `body`. Os dois pontos ficariam vermelhos.
  - A primeira página é pedida sem query string (`atividades-do-aluno.ts:31`), então o glob `**/v1/minhas-atividades` alcança a requisição.
- **Recomendação 1, rota certa em `rotas.test.tsx:42-50`: aplicada.** A rota respondida agora é `/v1/minhas-atividades`, e o teste confere o estado vazio e a ausência de `alert`. A leitura foi respondida de verdade, e não ficou presa no erro.
- **Recomendação 2, dois cliques em "Sair": aplicada.** O caso está em `CascaDaEscola.test.tsx:326-350`.
  - É concorrência de verdade: o encerramento fica no ar quando o segundo clique acontece.
  - O botão de teste não fica desabilitado, então o segundo clique chama `sair` de fato.
  - Sem o `if (saindo) return` (`CascaDaEscola.tsx:241`), saem dois `DELETE`, e a asserção `toHaveLength(1)` fica vermelha pelo motivo certo.
  - O bloco de mutação foi declarado no documento e o caso entrou na tabela.
- **Recomendação 3, botão da faixa no e2e do Início: aplicada.** `e2e/aluno-tutor.spec.ts:94` confere `toHaveCount(0)` para botão dentro da faixa.
- **Recomendação 4, o `.first()` do "Sair": aplicada.** O helper `sairPelaCasca` (`minha-turma.spec.ts:33-40`) separa os dois "Sair" pelo contêiner (`:not(main *)`), com uma guarda `toHaveCount(1)`. Se o seletor errasse, o teste ficaria vermelho em vez de passar à toa.
- Rodei `npx vitest run` em `CascaDaEscola.test.tsx` e `rotas.test.tsx`: 18 de 18 passaram.
- Nenhum `.skip`, nenhum teste comentado e nenhum provedor de IA no diff.

**Resposta à pergunta do `revisor-geral` (RF21): o aviso em Tarefas continua provado, e nenhum teste de regra ficou mais fraco.**
- Em `/aluno/atividades`, `e2e/aluno-atividade.spec.ts:117` confere `AVISO_DA_AVALIACAO` na avaliação em andamento da região "Para responder". O teste ficaria vermelho sem a condição de `Atividades.tsx:31`.
- Os textos estão travados em `apps/web/src/areas/aluno/atividades.test.ts:35`.
- O aviso dentro da atividade aberta está em `aluno-atividade.spec.ts:340`.
- O que mudou em `aluno-fluxo.spec.ts:173-178` foi o lugar onde o aviso é conferido contra a API real: antes era a lista, agora é o Início. O Início lê o mesmo `GET /v1/minhas-atividades` e usa a mesma condição (`avaliativa && estaParaResponder`). Por isso a ponta da API real continua provada.
- A asserção que saiu do `aluno-fluxo` era só de navegação: a ida pelo item "Tutor", que deixou de existir.

**Bloqueantes:** nenhum.

**Recomendações:**
1. O caso novo do Início prova o cache que sobreviveria à troca de sessão. Ele não prova uma resposta do primeiro aluno que ainda estivesse no ar e chegasse depois do login do segundo. A casca dele é a mesma do caso de Eu, como a correção pedia; um teste para essa corrida em particular seria cobertura a mais.
2. O caso novo cria dois alunos e faz dois logins sem `test.slow()`. O portão mede metade do prazo, 15 s, sobre as linhas tocadas. Se ficar perto desse limite na esteira, vale declarar `test.slow()` no lugar de depender de a máquina estar folgada.

Não olhei as fotos da tela: segundo o pedido, a mudança em `apps/web/src` nesta rodada é só de comentário e de teste, e a tela fica com o `frontend-reviewer`.
