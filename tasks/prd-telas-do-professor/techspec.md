# Tech Spec — Telas do professor

**PRD:** `tasks/prd-telas-do-professor/prd.md`
**Status:** revisada pelos guardiões em 13/10/2026 (rodada 4, `revisao-spec.md`) e aprovada por delegação do Joaquim; ele revê ao ler
**Tamanho:** acima do teto de 2.000 palavras, com aceite por delegação do Joaquim (13/10/2026). Motivo: a revisão dos guardiões exigiu por escrito a releitura do sino, o teto de 12 turmas, a supervisão de Hoje e a tela inteira de "Acesso gerado". O detalhe de cada teste fica nas tarefas.

## 1. Resumo da abordagem

Só `apps/web`, `e2e/` e `docs/interface.md`. As telas de `areas/professor/` são recompostas com as peças e os
tipos de página da X1, lendo as rotas que a API já tem. O que espera a professora vira uma conta feita
no cliente e mostrada pelo sino, preso na casca por `lazy()`. Os dois specs de várias telas viram um arquivo por
tela antes de qualquer tela mudar, para as tarefas correrem em linhas.

## 2. Módulos afetados

| Módulo | Novo ou alterado | O quê |
|---|---|---|
| `apps/web/src/componentes/sino/` | alterado | a peça da X2 ganha `grupo` no item e quatro props opcionais (`textoDoVazio`, `avisoDaLeituraParcial`, `faltaPara` e `pe`, o pé da lista, registrado na divergência da 2.0); `leitura-do-sino.ts` guarda as opções de leitura e o tipo da leitura que o sino da coordenação e o da professora dividem |
| `apps/web/src/areas/professor/` (sino) | novo | `fila-do-professor.ts` (a fila e o gancho que a lê) e `SinoDoProfessor.tsx`, carregado por `lazy()` acima do `Switch` da área |
| `CascaDaEscola.tsx`, `itens-da-lateral.tsx`, `areas/navegacao.ts` | alterado | o sino; os quatro lugares; "Seu time" sai |
| `apps/web/src/areas/professor/` | alterado e novo | todas as telas; `Criados`, `TurmaHoje`, `AtividadesDaTurma`, `AlunosDaTurma`, `ConvidarAlunos`, `Folha` |
| `apps/web/src/api/` | alterado | `artefatos.ts` (filtro de turma), `pedidos.ts` (contagem), `alunos-da-turma.ts` (novo) |
| `caminhos.ts`, `areas/professor/rotas.tsx` | alterado | `/professor/criados` |
| `e2e/`, `e2e/__fixtures__/professor/` | alterado e novo | um spec e uma fixture por tela |
| `docs/interface.md` | alterado | Parte A, seções 1 e 11.2 a 11.5 |

## 3. Modelo de dados

Nenhuma tabela.

## 4. API

Nenhuma rota nova. A web passa a fazer três leituras de rotas que existem: `GET /v1/artefatos?turmaId=` (o
parâmetro já está no contrato), `GET /v1/turmas/:id/reivindicacoes` pelo sino (só a contagem) e
`GET /v1/turmas/:id/alunos` (matriz `aluno_da_turma: turma_vinculada`).

## 5. Fluxo

**A fila do professor.** `filaDoProfessor` é função pura: recebe as entregas pendentes, os vínculos e a contagem
de pedidos por turma confirmada, e devolve os itens, agrupados por turma, em ordem de nome:

| Item | De onde vem | Destino |
|---|---|---|
| Correção para revisar | entrega `lote_de_correcao` pendente | `/professor/aprovar/:atividadeAplicadaId` |
| Correção para revisar, sem atividade aplicada | entrega `lote_de_correcao` pendente com `atividadeAplicadaId` nulo (o contrato admite) | `/professor/time/assistente`: sem a atividade não há tela de correção, e a decisão fica no Assistente |
| Versão adaptada para decidir | entrega `versao_adaptada` pendente | `/professor/time/assistente` |
| Pedidos de nome, com a quantidade | contagem maior que zero na turma | `/professor/turmas/:turmaId?aba=alunos` |
| Confirme sua turma | vínculo `pendente` (o contestado espera a coordenação e não conta) | `/professor/turmas` |

A regra de `esperandoVoce`, hoje em `areas/professor/entregas.ts`, muda de casa para a fila, com o teste dela. O
sino lê ao entrar na área e quando uma decisão invalida a chave. **Não relê por tempo, por foco nem por reconexão**,
e abrir a lista não faz leitura: os observadores de `entregas`, `meus-vinculos` e da contagem usam `staleTime` de 5
min, `refetchInterval: false`, `refetchOnWindowFocus: false` e `refetchOnReconnect: false`, como na X2 (§5 e §7c).
"Atualizar" e "Tentar de novo" releem só pela chave exata, nunca por prefixo. Leitura que falha, recusa por limite ou
turma além do teto marcam a fila como `parcial`: o sino mostra o que leu e diz o que não leu, e nunca "Tudo em
dia". "Não relê por tempo" vale só para o sino: a aba Hoje tem a regra da §7b.

**A série vale em toda leitura que não vem de um clique.** Quantas turmas já foram liberadas é estado do conjunto de turmas
que ela lê: quando o conjunto muda (sessão nova, troca de escola, vínculo novo), a série recomeça na primeira. A contagem que
já respondeu (com dado ou com erro) fica **desligada** (`enabled: false`): o `resetQueries` da troca de sessão e o
`invalidateQueries` da volta da API (`main.tsx`) só relêem consulta ligada, e com todas ligadas as 12 contagens sairiam juntas,
sem a série e sem a parada no limite. Quem relê uma contagem já lida é o clique ("Atualizar", "Tentar de novo", por
`fetchQuery`, em série) e a decisão de um pedido (`invalidarAContagem`, que relê só a da turma). Por isso a invalidação global
não relê a contagem: a hora de "Atualizado às" diz a idade do dado.

**Montagem.** Como na X2, cada área monta o sino dela: `SinoDoProfessor` é carregado por `lazy()` em `areas/professor/rotas.tsx`,
acima do `Switch`, e se desenha por `createPortal` na âncora que a casca deixa (`ancora-do-sino.ts`). **Não existe
`sino-do-papel.ts`**: a casca não importa nada de nenhuma área, nem mapa, e o aluno e a coordenação nunca carregam o sino
do professor. A peça é a da X2, sem mudar o que ela já tinha: ganhou `grupo` no item (o título do grupo, por turma; sem ele,
"Da escola") e as props opcionais `textoDoVazio`, `avisoDaLeituraParcial`, `faltaPara` (sem ele, o vazio não leva ao "falta
para a escola", que é da coordenação) e `pe` (o pé da lista: um título e os links de acompanhamento, que não são item, não
entram no número e aparecem em toda situação da leitura; sem ele, ou sem link, a lista não tem pé, e a coordenação não o usa). As opções de leitura (`SEM_LEITURA_SOZINHA`, `LEITURA_DA_FILA`) e o tipo
`LeituraDaFila` saíram de `fila-da-coordenacao.ts` para `componentes/sino/leitura-do-sino.ts`, porque uma área não importa
módulo de outra. **Sem ano letivo em curso** a professora não lê o ano (só a coordenação): `meus-vinculos` responde como
inexistente (`NAO_ENCONTRADO`), e é por essa resposta que o sino sabe, não chama nenhuma turma e diz que não há ano em curso.
**A contagem tem `gcTime: 0`**: a chave leva o id da turma, e sem observador a consulta sai do cache, para a troca de escola
ou a pessoa seguinte não herdarem o id de uma turma que não é delas.

**Abas no endereço.** A turma aberta, o documento e Aprovar leem `?aba=`; trocar de aba usa `replace`, valor
desconhecido cai na primeira, e o painel ao lado também fica no endereço (`?ver=`, `?atividade=`).

**"Seu time".** `/professor/time/assistente` continua tela (`Time.tsx`). `Tutor.tsx` vira redirecionamento: uma
turma confirmada leva a `…/turmas/:id?aba=hoje`; mais de uma, a `/professor/turmas`. O pé do sino tem os dois
links: "O que o Assistente fez" e "O que o Tutor viu".

## 6. Isolamento (obrigatório)

Nenhuma consulta nova no servidor: o escopo continua no repository, a partir do token. No cliente, o risco é o
cache atravessar a troca de escola ou de pessoa. As consultas do sino usam chaves que começam pelas de hoje
(`entregas`, `meus-vinculos`, `pedidos-da-turma`), que `main.tsx` esvazia com `resetQueries()` em toda troca de
sessão; a lista de turmas do sino vem do cache, nunca de `useState`. Testes: o sino
de A não aparece em B depois da troca de escola, nem para a segunda pessoa na mesma aba; o documento e a turma de
outra escola respondem como os inexistentes (os de hoje: `apps/api/src/artefato/artefato.int.test.ts`,
`apps/api/test/turma-acesso.int.test.ts` e `e2e/troca-de-escola.spec.ts`).

## 7. Dado pessoal (obrigatório)

| Item | Resposta |
|---|---|
| Campos pessoais tocados | nome do aluno, em Alunos, nos sinais, no uso do Tutor e nos destaques: os de hoje |
| Novos campos, log, envio a provedor externo | nenhum |
| O que entra em auditoria | o que já entra: abrir destaque, aprovar, aplicar, decidir pedido |
| Retenção, autorização por objeto, DTO de saída | inalterados: quem decide é a API |

O sino **não guarda nome de aluno**: a consulta de contagem descarta a lista antes do cache e fica só com o
número e "há mais", sob a chave `['pedidos-da-turma', 'contagem', turmaId]`, distinta da lista nominal; `aplicarDecisao`
a invalida por chave exata, e nenhum item do sino leva nome. O teste confere o conteúdo do `QueryCache`, não o `select`. As leituras nominais das telas continuam com `gcTime: 0`, inclusive a nova de alunos. Nenhum
endereço leva nome. A contestação e a justificativa mantêm o aviso de não escrever sobre aluno.

## 7b. Conformidade CNE (quando há IA no caminho do aluno)

Nenhuma função muda de risco nem de autonomia. A versão adaptada continua decidida por
`POST /v1/entregas/:id/decidir`; a atividade só vai à turma por "Aplicar à turma"; o lote, por `aprovar-lote`, que
a API recusa com destaque fechado. As abas de Aprovar não mudam a ordem: o oficial fica na barra presa, visível
nas três, e quem o libera é `podeAprovar`. A supervisão do Tutor (regra 70, item 4) fica na aba Hoje, com os
textos de hoje: sinal e uso, nunca conversa. Hoje lê `consultaSinais` ao abrir, com `refetchInterval` de 15 s enquanto a
aba está à vista, como `Tutor.tsx` faz hoje. O aviso de atenção humana e o agregado aparecem **sem abrir painel**, com a
contagem, a hora e o que fazer, e **sem nome de aluno**: Hoje é a aba que a professora projeta em sala (D34, D36, LGPD
art. 14). O nome só vem por ação explícita ("Ver quem", botão dentro do aviso), no `PainelLado` (`?ver=tutor`), que começa
pela lista de atenção humana mostra os "Sinais por aluno" (da mesma `consultaSinais`, já lida) e faz a leitura de `consultaUsoDoTutor`, a única que espera o painel. Com o painel fechado,
nenhum nome de aluno vai à tela. O sinal que chega aos 15 s entra sem piscar, sem som e sem mover o foco, em
`aria-live="polite"` (D59). O teste de vocabulário de `aprovar.test.ts` (sem nota, conceito nem
pontuação) é estendido aos textos novos.

## 7c. Carga e falha (obrigatório)

| Item | Resposta |
|---|---|
| Está no caminho quente? | nenhum do servidor é novo; o sino lê em toda tela do professor |
| Carga na manhã de segunda | por professor que abre a casca: 2 leituras de hoje (entregas e vínculos) e 1 por turma confirmada (pedidos), até 12, em ordem de nome. Com 30 professores e 6 turmas, 240 leituras curtas, contra 400 logins de alunos; no teto, 14 por leitura (cerca de 28 por minuto contra 120 do limite), mais a leitura de Hoje (4 por minuto com a aba à vista, pausada escondida) |
| Fila, limite por escola, índices, migration | não se aplicam |
| Rate limit | nenhuma rota nova. As leituras por turma saem **em série**, as 12 primeiras por nome, e param na primeira recusa por limite. A turma além da 12ª e as não lidas após a recusa marcam `parcial`; em Turmas aparecem como "não lida" |
| Corridas de concorrência | nenhuma nova: decidir entrega, aprovar lote e gerar acesso mantêm o envio único e o tratamento de `ENTREGA_JA_DECIDIDA` e `CONFLITO` |
| Quando cada dependência cai | a tela mostra `EstadoErro` com "Tentar de novo"; o sino diz o que não leu e não afirma "Tudo em dia" |
| Métrica, alerta e cenário de carga | o teto do `size-limit` e o teste do build; cenário inalterado |

**Orçamento.** O sino não entra na entrada: só o mapa e o `lazy()`. As abas e os painéis ficam em pedaços
`tela-professor-*` (30 kB cada). `Turmas` e `Turma` também saem da fachada, por `lazy()`, cada uma no seu pedaço
`tela-professor-*`: com os cartões, a faixa e o painel de contestação da 9.0, a fachada passava de 11 kB contra os 8 kB
do `size-limit` (divergência da 9.0). A 9.0 tira `Turmas`, e a 10.0, que reescreve a turma aberta, tira `Turma`. A
fachada fica com as rotas e o sino, e o teto de 8 kB **não sobe**; a descrição dela no `.size-limit.json` e o
comentário de `areas/professor/rotas.tsx` passam a dizer isso. Os ícones das
ferramentas moram em `areas/professor/icones-de-ferramenta.tsx`; o de Criados, no arquivo de lugares da X1.

## 9. Frontend

Peças e tipos de página são os da X1 (`Tela`, `Linha`, `Ladrilho`, `Segmentado`, `Toque`, `Interruptor`, `Aviso`,
`Contador`, `PainelLado`, `Abas`, `estado/`), sem redefinir nenhuma. O vazio usa o `EstadoVazio` como a X1 o
entregar: nenhuma pose da onça é desenhada aqui.

| Tela | Tipo | Composição |
|---|---|---|
| Início | conversa | onça com função e selo, saudação, caixa com a turma, atalhos, aviso de IA |
| Conversa | conversa | balões, assinatura, a `Escolha`, o cartão com ícone e nome, a caixa presa com o menu "Ferramenta" |
| Ferramentas | grade | uma seção por categoria; cartão com ícone ilustrado |
| Formulário | formulário | o motor e, ao lado a partir de 1024 px, "Como vai sair" |
| Criados | grade | filtros à direita do título; grupos por turma, em `Linha` |
| Documento | formulário, com a folha de 760 sobre `mesa` | abas Conteúdo · Versões adaptadas · Na turma; interruptor "Gabarito" |
| Turmas | grade | faixa "Confirme sua turma"; cartões; contestação no `PainelLado` |
| Turma aberta | grade | Hoje · Atividades · Alunos; Hoje com o aviso de atenção humana sem nome (§7b); Criados e Alunos paginam com "Ver mais", que basta no Chromebook fraco |
| Aprovar | leitura | números do lote; Destaques · Outras · Resumo; barra presa com o oficial |

**O Assistente no Início** (divergência da 3.0): a `AssinaturaIA` do Início usa o avatar de **40 px** em toda largura, e não
os 44 px (36 abaixo de 768) do mockup. O `AvatarAgente` e a `CabecaOnca` só aceitam 24, 32, 40 e 48 px (`docs/interface.md`
9.7), e um tamanho a mais é peça da X1 redefinida, fora do recorte; o 40 é o do cabeçalho de uma conversa.

**Ferramentas** (divergências da 7.0): (1) o cartão é a `Linha` da X1 dentro de uma moldura de 2 px, e a `Linha` não aceita atributo, por isso o
`data-ferramenta` mora no `<li>` do cartão (o `href` continua o do formulário, no `<a>`); o selo "Suspensa pela coordenação" desce para
baixo da descrição, e não no `fim` da linha, porque a 768 px o cartão tem uns 340 px e o selo ao lado não deixaria lugar para o nome.
(2) O título da categoria é `h2` (o `CabecalhoDeSecao`), e o `h2` "Catálogo" só para leitor de tela saiu; o e2e que contava `h3` conta `h2`.
(3) A página lê, além do time, `GET /v1/meus-vinculos` (rota que já existe, a do Início), para avisar "Falta uma turma confirmada" e levar a
Turmas; o aviso não tira cartão e não aparece enquanto os vínculos não chegam. (4) A leitura do time que falha é `time.data === undefined &&
time.errorUpdateCount > 0`, e não `time.isError`: "Tentar de novo" põe a consulta de volta em `pending` enquanto lê, e o aviso, com o botão
apertado, sumiria e voltaria. (5) A frase da suspensão de `conversa_e_ferramentas` (`TEXTO_DA_SUSPENSAO`) dizia que o que a professora já
gerou "continua em Ferramentas"; desde a 5.0 mora em Criados, e a frase passou a aparecer na própria página de Ferramentas. Largura da tela:
`grade`, como na tabela acima.

**A função suspensa no Início** (divergência da 3.0): além do aviso da conversa e das ferramentas, o Início mostra o da
**Adaptação** (`TEXTO_DA_SUSPENSAO`) quando só ela está suspensa, porque o atalho dela fica desligado e um botão desligado
sem dizer por quê não explica nada.

**O cartão da conversa** (divergência da 4.0): o ícone ilustrado de 32 px não é um cabeçalho à parte, porque o motor já escreve o
nome da ferramenta (como título do formulário e como primeira palavra do pedido recolhido) e um segundo cabeçalho repetiria o
nome. O `MotorFormulario` ganha a prop opcional `icone`, desenhada antes do nome nos dois lugares, sem mudar nenhuma prop que
existia; o `CartaoDeFerramenta` a liga com `comIcone`, que só a Conversa passa (o formulário de Ferramentas tem o nome no
`h1`). A frase "O Assistente é uma IA e pode errar · Nada chega à turma sem você aprovar" é o componente `AvisoDeIA`
(`areas/professor/avisos.tsx`), usado no Início e sob a caixa da Conversa, dentro da `BarraPresa`. **"Nada chega à turma sem você aprovar" é a regra 70, item 3, e só vale enquanto nenhuma ferramenta entregar direto à turma:** quem criar uma ferramenta que entregue à turma sem aprovação tira a frase do `AvisoDeIA`, nas duas telas de uma vez, antes de a ferramenta existir. Sobre a posição: "a caixa presa a 24 px do
fim" é a frase a 24 px do pé da barra (12 px da `BarraPresa` mais `pb-3` do filho; a barra de Aprovar não muda). O "vão de 24"
entre mensagens é o `gap-6` do `log`. O cartão ganha a borda de 2 px (`border-2 border-borda`) da pele nova.

**Aprovar na pele nova** (divergências da 14.0): (1) o painel de um destaque que o endereço traz (`?ver=<alunoId>`) lê as respostas
pela **mesma rota que abre** (`POST …/correcao/destaques/:alunoId/abrir`), que a API já define como idempotente (devolve o mesmo, com a
primeira hora, e não registra outra abertura): não existe rota só de leitura, e a §4 não admite uma nova. Isso só vale para o destaque
que o lote **já traz aberto**: `?ver=` de um destaque fechado, ou de um id que o lote não tem (outra turma, outra escola), não abre
painel e não chama a rota, igual em todo caso (regra 10, item 6). (2) A frase que explica o motivo ("Nenhuma questão foi respondida.")
sai da linha e fica no painel; a linha diz o motivo e os acertos. (3) A lista de Outras é ordenada por nome **na tela** (a API não
promete ordem), com o id como desempate, e nunca por acerto. (4) As abas não levam contador: o número de destaques que faltam está na
faixa e na barra presa. (5) A tela passa de `formulario` para `leitura` (880 px), que é o tipo da tabela acima. (6) O lote já decidido
não abre o destaque que ficou fechado (não há mais o que registrar), e só mostra o que já estava aberto.

**Alunos na pele nova** (divergências da 12.0): (1) a aba lê **três** rotas, `GET /v1/turmas/:id/alunos` (nova para a web), o desempenho
aprovado e os pedidos; a lista de nomes é a base das linhas, e os acertos entram **pelo id** (`usuarioId` da lista é o `alunoId` do
desempenho). A leitura é de cem em cem, sem `?anoLetivoId` nem finalidade (a leitura do professor não grava auditoria; é a da
coordenação que grava `turma.alunos_lidos`), com `gcTime: 0` e a chave `['alunos-da-turma', turmaId]`. (2) **"Transferido ou com o acesso
desativado"**: a API devolve em `/alunos` e em `/desempenho` só quem está na turma **agora** (vínculo `confirmado`, usuário ativo), e por
isso o estado só é observável como o aluno que o desempenho traz e a lista, lida **até o fim**, não: ele saiu entre uma leitura e a
outra. A linha diz "Saiu da turma", sem número, e a frase não distingue um motivo do outro, porque a API também não. Com páginas por ler
a linha não existe (o aluno pode estar na seguinte). (3) **Os "56 px" do mockup (5.3) são a peça `Tabela` da X1**, sem redefinição: no
computador é a tabela de linhas de 64 px; a 360 px, a lista de cartões de `Tabela`, cada um com mais de 56 px e com o nome quebrando
(`break-words`). Linha de 56 px própria seria peça nova, fora do recorte. (4) A lista ordena por nome com `localeCompare` em `pt-BR` e o id
como desempate, **tudo o que já foi lido**, também depois de "Ver mais"; o foco depois dele fica no botão, ou vai à frase do fim da
lista quando o botão sai. (5) **A decisão de um pedido marca como velha a lista de nomes da turma** (`aplicarDecisao` e
`descartarListaDepoisDaFalha`, por chave `['alunos-da-turma', turmaId]`): aprovar um nome põe o aluno na turma, e a lista aberta ao lado
dos pedidos deixaria de valer. (6) O vazio é "A lista ainda não chegou", e só aparece com a lista lida até o fim, vazia, e os acertos já
lidos. O recomeço da segunda pessoa na mesma aba (a lista e os pedidos da anterior) fica no caso de recomeço de `professor-sino.spec.ts`
(§10): um caso com duas entradas passa de 15 s.

**`data-esperando-voce`** (divergência da 3.0): o item do sino da 1.0 não leva o atributo, e a 3.0 não o acrescenta. O
Início não tem o atributo nem o que ele marcava, e o e2e prova que o sino tem a entrega pelo nome do botão ("Esperando você,
1") e pelo link do item ("Versão adaptada para decidir…", "Correção para revisar…").

**Nomes que não mudam** (contrato com o e2e): um `<main>`; `h1` "Turmas", "Ferramentas", "Turma <nome>", "Revisar a
correção"; `log` "Conversa com o Assistente de ensino"; regiões "Sinais da turma", "Acerto por habilidade",
"Confirme suas turmas", "Suas turmas", "Pedidos de nome"; `group` "Aprovação do lote" e "Código da turma";
títulos "Acesso dos alunos", "Acesso gerado", "Gerar acesso", "Gerar novo acesso", "Revogar o acesso"; links
"Abrir o artefato", "Revisar a correção", "Voltar para Turmas"; botões "Contestar", "Aplicar à turma", "Encerrar a
atividade", "Exportar em PDF", "Pedir versão adaptada"; e todos os `data-*` do inventário, menos
`data-contador-do-time`, que vira `data-contador-do-sino`, e `data-esperando-voce`, que sai do Início e não passa ao item do sino (divergência da 3.0).
**Nomes que mudam:** as abas da turma; "Voltar para Ferramentas", no documento, vira "Voltar para Criados"; "Voltar
para o Seu time" vira "Voltar para a turma"; "Ver e decidir em Seu time" vira "Ver e decidir"; o `h1` das telas
do time perde "Seu time: ". Em Aprovar (14.0): o botão "Rejeitar…" da barra vira "Rejeitar a correção"; o "Abrir" e o "Ver de novo" de cada
destaque somem, porque a linha inteira é o botão (o nome acessível dele é o do aluno, o motivo e o estado); o número "Média de
acertos" vira "Acerto médio", porque a palavra "média" fica fora das telas do professor (RF21).

**Cartão da turma.** Tudo vem do `Vinculo` de `meus-vinculos` e da fila do sino: o ladrilho da disciplina, "7ºA ·
Matemática" (turma e disciplina), o estado em texto (`NOME_DO_ESTADO_DE_VINCULO`) e o selo do que espera. **A série
não entra no cartão**: o `Vinculo` não a traz, e lê-la seria um `GET /v1/turmas/:id` por cartão, que a §4 não admite e
que a API recusa no vínculo pendente. O nome da turma já diz o ano. A série volta quando o contrato de `meus-vinculos`
a trouxer, em spec que mexa na API (divergência da 9.0).

**Texto da pessoa.** O que a professora escreve (pedido, contestação, justificativa) mora no estado da página:
releitura e sessão vencida não o apagam; sai junto quando entra outra pessoa.

**Acesso gerado.** O diálogo de "Convidar alunos" nesse passo é projetado: enquanto estiver aberto, nada da página de
trás fica legível. O passo é uma **tela inteira**: o diálogo ocupa a janela (largura e altura), com fundo `fundo` por classe de token, e nenhuma cor nova no `::backdrop` (a guarda de cor da X1 só aceita cor no véu do diálogo). O e2e mede a caixa e o fundo calculado do `<dialog>`, nos dois temas, e não `toBeVisible` (13.0).

**Chromebook e celular.** Nenhuma biblioteca nova. A 360 px, os filtros viram um botão "Filtrar" com diálogo, o
painel ao lado vira folha de baixo, e a barra presa de Aprovar fica acima da barra de baixo da casca.

## 10. Testes

| Camada | O que será testado |
|---|---|
| Unidade | `filaDoProfessor`, tipo a tipo, com o contestado, as duas disciplinas na mesma turma e "100 ou mais"; filtros de Criados; estado da atividade aplicada; "Como vai sair"; vocabulário; a aba pelo endereço |
| Componente (jsdom, `__fixtures__/tela.tsx`) | por tela: carregando, vazio, erro, com dado e o foco depois de cada ação; o oficial desligado até `podeAprovar`. O sino, contando as chamadas: leitura parcial; recusa na 3ª leitura; 14 turmas em `parcial`; dois tempos com o `focusManager` e o `onlineManager` (zero chamadas, e o controle relê); retry e "Atualizar" por chave exata; `JSON.stringify` do `QueryCache` sem nome. Hoje: aos 15 s sai nova leitura; recém-aberta, sem nome no DOM; sem `?ver=tutor`, nenhuma rota nominal além dos sinais |
| E2E | um spec por tela, nos dois projetos, com axe e largura; entrega decidida em outra aba; a coordenação na mesma aba sem leituras da professora; Hoje sem nome; "Acesso gerado" sem nome nem acerto legível; os fluxos `a2-assistente`, `a3-a4-professor` e `roteiro-da-demonstracao`, por fixtures de tela |
| Isolamento | os de hoje, mais o sino na troca de escola e na segunda pessoa; Criados com artefato na turma de B (o título dele não aparece com `?turma=` de B) |
|  | **Onde mora o recomeço da conversa** (divergência da 4.0): o recomeço do Início (3.0, o texto na caixa) e o da conversa (4.0, a conversa lida e o cartão aberto) estão no caso de recomeço da segunda professora de `e2e/professor-sino.spec.ts`, e não em casos novos de `professor-inicio.spec.ts` e `professor-conversa.spec.ts`: um caso com duas entradas na mesma aba passa de 15 s (o piso de `entrar` é de 11 a 12 s) |

**A separação dos specs** (tarefa 2.0) move casos sem mudar título nem asserção: a contagem de `test(` em `e2e/` é
conferida antes e depois.

**Duração do e2e na separação** (divergência da 2.0, decidida pelo Joaquim em 18/10/2026, alternativa 1): a régua do
portão (`tools/ci/duracao-do-e2e.ts`) passa a ser metade do prazo declarado do caso, e só vale o prazo que já estava
no HEAD (no padrão de 30 s, continua 15 s). A mudança da régua é correção de processo à parte, antes de a 2.0 retomar.
A regra acima não muda; a 2.0 só encurta ou divide `casca:468` e `areas:151`, os dois casos editados acima de 15 s sem
prazo próprio.

## 11. Conformidade com as regras

| Regra | Como é atendida | Desvio e justificativa | Documento que registra o desvio |
|---|---|---|---|
| 00, 10, 20 | só a web; seções 6 e 7 | nenhum | — |
| 40 | estado em teste de componente, fluxo em e2e | dois specs são divididos, sem perder caso | esta seção |
| 50 | seção 9; quatro estados por tela | o mockup é contrariado onde afrouxa regra | `prd.md`, seção 6; D80, item 7 |
| 70, 80 | seções 7b e 7c | nenhum | — |

## 12. Premissas não verificadas

- `✅ VERIFICADO na 1.0` — o nome e as props da peça do sino da X2: `componentes/sino/Sino.tsx`, com a lista por prop. Ela
  não tinha agrupamento por turma nem vazio próprio, e a 1.0 acrescentou três props opcionais e `grupo` no item, sem mudar
  nenhuma que existia (a 2.0 acrescentou a quarta, `pe`, para o pé da seção 5, "Seu time"); a montagem é por área, e não por mapa (seção 5, "Montagem")
- `⚠️ NÃO VERIFICADO` — as props das peças novas da X1, que não existem neste checkout. Saída: cada tarefa lê a
  peça antes de usar e registra a divergência
- `✅ VERIFICADO na 12.0` — a web nunca leu `GET /v1/turmas/:id/alunos` como professor, e a API devolve em ordem de
  id. Conferido em `apps/api/test/turma-acesso.int.test.ts`: o professor com vínculo confirmado lê sem finalidade e sem auditoria,
  a página é de até 100 com `proxima`, e só entra quem está confirmado e ativo agora. A 12.0 ordena por nome
- `⚠️ NÃO VERIFICADO` — como o teste do build nomeia o pedaço de `componentes/sino/`. Saída: `PECAS_FORA_DA_ENTRADA`
- `⚠️ NÃO VERIFICADO` — o limite por usuário das leituras do sino. Saída: a série de no máximo 12 turmas (seção 7c), a conta de cerca de 28 leituras por minuto contra 120, e a parada na primeira recusa
- **Decisão por delegação, que o Joaquim revê:** o `conformidade-reviewer` queria o nome, a hora e o que fazer da atenção humana em Hoje sem abrir painel; o `privacy-guardian` vetou o nome em Hoje (D34, D36, art. 14). Fechou o mais restritivo: aviso sem painel, sem nome; nome só por "Ver quem". Também por delegação: o sino não relê por foco, como na X2

## 13. Riscos técnicos

- **Sete specs chegam às telas do time pela lateral.** A 2.0 troca o caminho por fixtures
- **Mover caso de e2e perde caso sem ninguém ver.** A contagem entra na 2.0
- **Item do sino que não sai.** Cada decisão já invalida a consulta dela; a 1.0 prova tipo a tipo
- **O acesso num diálogo esbarra em nove casos de e2e.** Os títulos de cada passo não mudam (seção 9)
