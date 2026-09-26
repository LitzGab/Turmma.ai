# Decisões tomadas

> Texto completo das decisões D1 em diante, com o motivo e as revisões. O `CLAUDE.md` tem uma
> linha por decisão e a lista das que estão em aberto. Nova decisão ou revisão entra aqui e no
> índice do `CLAUDE.md`, pelo `/registrar-decisao`.

Cada uma com o motivo, porque decisão sem motivo é decisão que volta.

**D1 — Sistema inteiro, não MVP fatiado.**
A venda acontece em reunião de coordenação e em assembleia de pais, e o que convence é o
fluxo completo. Um pedaço não vende. Construímos por partes, com o sistema completo como
alvo, e não cortamos escopo por conta própria.
Revista em 13/09/2026: o alvo continua sendo o sistema inteiro, mas uma escola piloto
gratuita entra no 1º semestre de 2027 usando o que já estiver pronto, antes do F16. O
portão da primeira escola real (LGPD e infra) vale antes dela, não só no fim. Motivo:
nenhuma escola usou o produto ainda, e construir as 17 fases antes de ver uso real é o
maior risco de construir o que a escola não quer. Piloto gratuito não é vender pedaço.
Revista em 19/09/2026: entra um **MVP de apresentação** logo depois do F1 (D71). O alvo
continua sendo o sistema inteiro; o que muda é que, antes de completar cada fase, construímos
uma fatia fina e real do fluxo de ponta a ponta, com dado sintético, para demonstrar. Motivo:
é a própria razão desta decisão — o que convence é o fluxo completo —, e pela ordem antiga o
fluxo completo só existiria no F15. MVP de apresentação não é MVP de venda: ninguém usa de
verdade antes do F2, do F3 e do portão da primeira escola real.

**D2 — O cliente é a instituição. Não existe cadastro público.**
Sem self-service, sem plano avulso de professor. O dado limpo que faz os agentes
funcionarem vem da escola, não do que o usuário digita.

**D3 — Onboarding por convite, sem cadastro individual.**
Coordenação cria séries e turmas e sobe a lista de nomes. Professor entra por link e escolhe
a disciplina. Aluno entra pelo link da sala, reivindica o próprio nome, e o professor aprova.
Cadastrar novecentos alunos um a um mataria o produto na primeira semana.
Revista em 13/09/2026: a coordenação também importa a grade horária e o calendário escolar
no onboarding, e aloca professor × turma × disciplina (ou a alocação vem da grade
importada); o professor entra por link e **confirma** o vínculo, não escolhe. Um usuário
pode ter vínculo em mais de uma escola. Motivo: disciplina escolhida pelo professor dava
acesso a alunos por autodeclaração (regra 10, item 4), e sem grade o Rotina e o calendário
não têm de onde derivar (regra 60, item 8). Importar não é digitar, então a D24 continua
sem trabalho manual. Onde a escola tem conta Google ou Microsoft, o login e a importação
podem vir de lá (D48).

**D4 — A identidade do aluno passa por aprovação humana.**
Deixar o aluno digitar o nome livremente cria dois "Enzo Martins" e um "Batman". A
reivindicação aprovada resolve isso sem burocracia.

**D5 — Sem integração com sistema de ensino. Pipeline único de ingestão.**
O scraper do material que a escola já paga e o upload manual de PDF desembocam no mesmo
caminho. Se uma fonte mudar de layout, a escola sobe a apostila e continua funcionando no
mesmo dia. Condições legais da ingestão em `docs/regulacao.md` seção 5.
Revista em 13/09/2026: só entra material cuja licença permita o uso: apostila e material
próprios da escola, material do professor, livro licenciado para esse uso, domínio público
e provas oficiais do ENEM. Buscamos parceria com editora e sistema de ensino. Apostila de
terceiro sem licença do dono do direito não entra, por upload ou por scraper. Motivo: a Lei
9.610 (art. 29, IX) exige autorização do autor para incluir a obra em base de dados, a
escola não é dona desse direito, e termos como os do Plurall vedam reproduzir e transferir
o conteúdo. A autorização da escola continua registrada, mas não basta sozinha.

**D6 — Indexação por série, disciplina, capítulo e habilidade da BNCC, com rastreabilidade
até a página.**
Uma questão que o professor confere na página 152 da apostila dele tem valor. Uma questão
genérica é o que ele já consegue de graça.

**D7 — Nota nunca é publicada sem aprovação humana.**
Exigência do CNE, e também a única forma de o professor confiar no sistema. A nota oficial
entra depois do diagnóstico formativo (D46).

**D8 — O tutor do aluno é sempre visível ao professor.**
Modo sala com acompanhamento ao vivo, modo casa com registro e resumo. Exigência do CNE
para classificar o tutor como risco moderado, e o que sustenta a conversa com a família.

**D9 — Todo agente tem nível de autonomia declarado e visível.**
A coordenação precisa poder responder "o que essa IA faz sozinha?" apontando para uma tela.
Ver `docs/agentes.md`.
Revista em 23/09/2026: a autonomia é declarada **por função** do agente, não por agente
("corrigir objetiva: faz e avisa, a nota espera você"; "adaptar: prepara e espera você
aprovar"), com o selo de alto risco quando a função tem AIA (D60), e aparece assim na tela da
coordenação. Motivo: com a D32 revista, o Assistente de ensino faz coisas de risco muito
diferente, e um rótulo único por agente esconderia justamente a que o CNE classifica como alto
risco.

**D10 — A escola é controladora dos dados; nós somos operadores.**
Padrão B2B, com o consentimento coberto por contrato. Ver `docs/lgpd.md`.

**D11 — WhatsApp e portal da família ficam para depois, mas o motor de eventos entra agora.**
O motor é o que alimenta o painel da coordenação de qualquer forma. Adiar só a interface
significa que a fase seguinte pluga sem refazer nada. A aprovação da API oficial do WhatsApp
tem prazo próprio de semanas, então começa cedo mesmo sem ser usada já.

**D12 — Backend e frontend separados, multi-tenant por escola, nada travado em fornecedor.**
Hospedagem indefinida e possível exigência de dado em território nacional. Tudo em
container.

**D13 — IA por porta e adaptador, com Ollama local no desenvolvimento.**
Teste infinito a custo zero, e trocar de provedor vira variável de ambiente.

**D14 — Orçamento de tokens por aluno e por escola é requisito, não otimização.**
O alvo é R$ 30 por aluno por mês e o tutor consome muito mais que a geração de prova. Sem
medir desde a primeira chamada, a margem some sem aviso.

**D15 — Construção do zero, sem reaproveitar produto anterior.**

**D16 — A stack está ratificada.**
A que está em "Stack", abaixo. Sem ela fixa o F0 não começa, e cada PRD reabriria a
discussão. As skills técnicas instaladas em `.claude/skills/` seguem esta stack.

**D17 — Agentes têm nome de função, não nome próprio.**
Corretor, Planejador, Rotina, Monitor de turma, Tutor, Mensageiro da família. Os nomes do
Excalidraw (Pipo, Waz, Maky) saem. A coordenação precisa explicar em reunião de pais o que
cada IA faz, e "o Corretor" se explica sozinho, "o Pipo" não. Numa escola, um nome sóbrio
também passa mais confiança.
Revista em 19/09/2026: a regra do nome de função continua; a lista de nomes passa a ser a da
D32 revista (Assistente de ensino, Tutor, Corretor, Planejador, Adaptador e Analista de
desempenho escolar).
Revista em 23/09/2026: a lista passa a ser a da D32 revista no mesmo dia — **Assistente de
ensino, Tutor e Analista de desempenho escolar**, mais o Mensageiro da família depois. As
funções do Assistente também têm nome de função: correção de objetiva, adaptação, "seu dia e
sua semana".

**D18 — Chat e ferramentas são o mesmo motor. O chat abre a ferramenta dentro da conversa.**
O professor pode escolher a ferramenta no próprio chat. Se ele não escolheu e o pedido
corresponde a uma ferramenta ("monta uma prova do 2ºB"), o chat **pergunta** se quer usar a
ferramenta de prova antes de gerar qualquer coisa. Com o sim, a ferramenta aparece como
cartão dentro da conversa, já preenchida com o que foi entendido, e o professor ajusta e
salva. O artefato sai igual ao do formulário: salvo, ligado à turma, com a página citada.
Um motor só evita duas implementações que divergem, e perguntar antes evita gastar token
gerando o que o professor não pediu. Ver `docs/interface.md`.

**D19 — O tutor fora da sala é configuração da escola, por turma, desligada por padrão.**
Quando ligado vale o modo casa, com registro e resumo para o professor. O custo de token e a
disposição da escola para supervisionar variam, e quem controla o dado decide (D10).

**D20 — A rede pública faz parte do sistema alvo.**
A venda começa pela escola particular, mas prefeitura e governança de rede (F14) ficam no
roadmap, e as regras que falam de rede continuam valendo. Os contatos com rede pública
existem e o sistema completo precisa atender os dois compradores (D1).
Revista em 13/09/2026: particular e pública são alvo juntas desde o início, e não mais "a
venda começa pela particular". A pública entra com pacote de rede e piso de preço (D41).
Motivo: os contatos com rede existem, e com os anos finais no recorte (D43) a prefeitura
passa a ter o que comprar, já que o Ensino Médio público é estadual.

**D21 — O banco público de questões vem das provas oficiais do ENEM (INEP) e entra no F7.**
Serve ao simulado ENEM com correção imediata. É banco sem dono, separado do material de
qualquer escola. Vestibulares ficam de fora até que a licença de cada um seja verificada.

**D22 — A ingestão começa pelo upload de PDF. Adaptador de scraper só com escola real.**
Ainda não sabemos quais sistemas de ensino as escolas-alvo usam, então escrever adaptador
agora é apostar no fornecedor errado. O pipeline nasce com a porta de fonte (D5), o upload
é a primeira implementação, e cada adaptador entra quando uma escola com fonte definida e
autorização escrita existir.
Revista em 13/09/2026: upload e adaptador só recebem material com licença para esse uso
(D5 revista). Adaptador de sistema de ensino depende também de licença ou parceria com o
dono do conteúdo, não só da autorização da escola.

**D23 — Commit direto no `main`, um commit por tarefa.**
Enquanto são duas pessoas, branch e PR custam mais do que protegem. O portão de qualidade
fica no processo (`/executar-review` e os vetos), não no merge. Reabrir quando entrar uma
terceira pessoa no código.
Revista em 15/09/2026: o portão continua no processo, mas a autorrevisão do
`/executar-review` foi substituída pelo agente `revisor-geral`, e código só entra por tarefa ou
por `/corrigir` (D53).
Revista em 19/09/2026: a terceira pessoa entrou no código, que era a condição para reabrir, e
o Joaquim mandou desconsiderar a regra do commit direto. Quando o F1 fechar, o `main` deixa de
receber trabalho direto e nascem os branches **`release`** e **`develop`**; todo trabalho,
código e documentação, passa a ser feito em branch próprio. O ponto de partida é um só: o
branch de documentação entra no `main` quando o Joaquim avisar, o `main` vai para o `release`,
e o `release` para o `develop`. Motivo: com três pessoas, commit direto no `main` arrisca
conflito e código sem um segundo par de olhos, e o MVP de apresentação (D71) pede duas frentes
andando ao mesmo tempo. Os vetos dos revisores e o portão local continuam valendo dentro do
branch.

**Fixado em 21/09/2026, pelo Joaquim:** o trabalho acontece **direto na `develop`** — código e
docs —, sem branch por tarefa. `release` e `main` recebem por merge, e o Joaquim gerencia esse
caminho. O Gabriel abre branch própria, para não mexer no que está em andamento, e integra na
`develop`. A esteira roda nas três branches (`develop`, `release`, `main`), e é na `develop` que
ela vale como portão do dia a dia: o `/executar-task`, o `/corrigir`, o `/validar`, o
`/revisar-spec`, o `/retro` e a regra 40 passaram a apontar para lá. De onde sai o staging fica com
a D31, quando o staging existir.

**D24 — Na primeira semana, a coordenação precisa ver quatro coisas funcionando.**
A escola inteira cadastrada sem trabalho manual, o painel de governança de IA com 100% das
notas aprovadas por humano, professores gerando prova e plano a partir da apostila com a
página citada, e alunos usando o tutor em sala com os sinais chegando ao professor. É o
critério de sucesso do piloto e o roteiro da demonstração (F15). Por isso nenhuma dessas
quatro pode ficar para a fase posterior.
Revista em 13/09/2026: enquanto a nota oficial não existir (D46), a governança mostra o
que a IA gerou e quem aprovou nas entregas que chegam ao aluno, e a nota entra nessa conta
quando entrar no sistema. O material citado é o que tem licença (D5 revista). Continua
como critério da demonstração e da venda; quais das quatro o piloto por fatias (D1
revista) precisa ter no primeiro dia está em aberto.

**D25 — A infra do primeiro ano é desenhada para até dez escolas, e a arquitetura para
crescer até uma rede.**
Uns 4.000 alunos, com pico de ~1.600 simultâneos na manhã. Cada escola entra com centenas de
usuários de uma vez, e o uso se concentra no horário de aula. API, realtime e worker ficam
separados e sem estado desde o início, para uma rede municipal (D20) ser questão de mais
instâncias, não de refazer. Modelo de carga em `docs/infra.md`.

**D26 — Banco, Redis e storage são serviços gerenciados.**
Quem opera é o Joaquim, sozinho e sem plantão. Manter Postgres com replicação e backup na
mão não cabe nisso. Continuam sendo padrões abertos (Postgres, Redis, S3), então a regra 00
e o `docker compose up` seguem valendo.

**D27 — Meta de 99,5% de disponibilidade no horário letivo, com prova resiliente.**
Resposta de prova salva por item, relógio no servidor e retomada após queda. Deploy em
produção só fora do horário letivo. Cair no meio da prova custa a confiança do professor;
alta disponibilidade em várias zonas custaria mais do que uma pessoa consegue operar.

**D28 — Hospedagem em região Brasil. O provedor ainda está em aberto.**
Atende LGPD e a exigência provável da rede pública. Fixar a região agora evita escolher
serviço que só existe fora do país.

**D29 — Modelo de IA em produção vem de API de provedor, com contrato e provedor de reserva.
No pico, fila curta e depois modelo menor.**
GPU própria fica ociosa à noite e é operação pesada para uma pessoa. O contrato veda
treinamento com nosso dado (regra 20) e garante limite de tokens por minuto para o pico do
tutor (~1,5 milhão por minuto em dez escolas, estimativa de `docs/infra.md`). Quando o limite
aperta, o aluno espera alguns segundos com aviso, depois é atendido por um modelo menor do
mesmo perfil. Nunca vê erro cru.

**D30 — Infra custa até R$ 2 por aluno por mês, sem contar IA.**
Uns 7% do preço alvo. É medido por escola desde o F0, junto com o custo de IA (D14).
Revista em 13/09/2026: o uso já nasce marcado por escola no F0; o custo do ambiente passa a
ser medido quando o staging existir (D31).

**D31 — Três ambientes: local, staging e produção. O staging nasce quando houver o que
mostrar fora da nossa máquina.**
Staging recebe todo commit do `main`, roda e2e e teste de carga, e só tem seed sintético.
Com commit direto no `main` (D23), é o staging que segura o erro antes de chegar à escola.
Revista em 13/09/2026: o F0 e a validação inicial são 100% locais, sem ambiente remoto e
sem gasto; até o staging existir, o portão é a esteira do GitHub (tipos, lint, testes e
e2e). O staging é criado antes da primeira demonstração a alguém de fora ou do piloto, o
que vier primeiro. Validar local não exige máquina ligada nem custo, e o que só um ambiente
remoto prova (URL pública, check externo, custo do ambiente) não tem valor antes de haver
quem veja.

**D32 — Os agentes são sete, mais o Mensageiro da família na fase posterior.**
Rotina, Corretor, Planejador, Monitor de turma, Tutor, Adaptador e Analista da coordenação.
O Rotina trabalha sozinho porque só organiza o que já existe; o Planejador trabalha sob
pedido, porque plano que ninguém pediu é token jogado fora. O Analista existe porque quem
compra é a coordenação, e ela precisa do próprio "funcionário". O Adaptador existe porque
inclusão é o tema mais anunciado do mercado e é trabalho que o professor raramente tem tempo
de fazer. Nível e gatilho de cada um em `docs/agentes.md`.
Revista em 19/09/2026 *(ratificada pelo Joaquim em 23/09/2026, e superada pela revisão de 23/09/2026 logo abaixo)*: os
agentes passam a ser **seis**, um por
necessidade de cada papel — **Assistente de ensino, Tutor, Corretor, Planejador, Adaptador e
Analista de desempenho escolar** —, mais o Mensageiro da família na fase posterior. O que
mudou: (1) o chat do professor ganha identidade de agente, o **Assistente de ensino**, que é a
cara das ferramentas (D18); (2) o **Monitor de turma se dissolve**: o que o aluno mostra no
uso do Tutor — travou, errou muito, pediu resposta pronta, principal dificuldade — chega ao
professor pela thread do próprio **Tutor**, as entregas pendentes vão para o Planejador, e a
queda por habilidade aparece em "Minhas turmas" (D69); (3) o **Planejador absorve o Rotina**,
mantendo os dois gatilhos: abre o dia e a semana com o que já existe, sem gerar conteúdo, e
gera plano só sob pedido; (4) o Analista da coordenação passa a se chamar **Analista de
desempenho escolar**. Motivo: a estrutura fechada pelo Gabriel com o time em 19/09/2026 pede
uma voz por assunto para cada papel; "Monitor" servia a duas coisas diferentes (o assistente
do professor e o agente que olhava a turma); e Rotina e Planejador eram, para o professor, a
mesma conversa sobre o que vem pela frente. O custo continua protegido: abrir o dia não chama
modelo para gerar conteúdo, e plano que ninguém pediu continua não sendo gerado. O aluno segue
nomeado só para o professor da turma (D34) e a notificação só sai no horário útil da escola
(D59).
Revista em 23/09/2026 *(decidida pelo Gabriel em 20/09/2026, vista em mockup; ratificada pelo
Joaquim)*: **um agente para cada pessoa da escola**. O professor tem o **Assistente de
ensino**, o aluno tem o **Tutor**, a coordenação tem o **Analista de desempenho escolar**, e a
família terá o Mensageiro na fase posterior. Corretor, Planejador e Adaptador deixam de ser
agentes e viram **funções do Assistente de ensino**: **correção de objetiva** (corrige, monta
o diagnóstico e espera o professor), **adaptação** (aplica o tipo de adaptação registrado e
espera aprovação, D35 e D67) e **seu dia e sua semana** (organiza o que já existe, sem gerar
conteúdo; plano só sob pedido). O professor continua vendo o Tutor em "Seu time", como segunda
voz, porque é ele quem supervisiona o agente dos alunos (D8, D47). Motivo: cada um dos três
tinha uma ferramenta gêmea que chamava o mesmo caso de uso — mudava só quem disparava e onde o
resultado aparecia —, e o risco que o CNE classifica é da funcionalidade, não da persona. A
autonomia passa a ser declarada por função (D9) e a suspensão também (D60). A apresentação
passa a ser "um agente para cada pessoa da escola", e a frase da D44 continua valendo.

**D33 — Nota de objetiva é aprovada em lote, com os casos fora da curva abertos antes.**
Aprovar aluno por aluno vira clique reflexo e esvazia a supervisão que a lei exige. O lote
com resumo mantém o humano olhando o que importa.

**D34 — Aluno em risco chega nomeado só ao professor da turma. A coordenação vê agregado.**
Abrir o detalhe como coordenação é possível e fica em auditoria. É o menor caminho de dado
de menor que ainda faz alguém agir.

**D35 — A coordenação registra a adaptação necessária do aluno, nunca o diagnóstico.**
É dado sensível (art. 11). "Fonte ampliada, tempo +50%" basta para o Adaptador trabalhar, e
um vazamento desse campo é muito menos grave que o de um laudo.

**D36 — Assunto pessoal delicado no tutor é encaminhado a um humano.**
O tutor não aconselha: responde com mensagem fixa, orienta procurar professor ou orientação
e, com menção a risco à vida, o CVV (188). O professor recebe o sinal "precisa de atenção
humana" sem o conteúdo por padrão. O gatilho é o que o aluno escreveu, nunca inferência de
estado emocional. Só recusar o assunto deixaria um aluno em risco sem ninguém saber.

**D37 — O provedor de modelo sai de uma avaliação com amostras sintéticas.**
Finalistas: Maritaca (Sabiazinho 4 e Sabiá 4, variante processada no Brasil) e Google
(Gemini Flash-Lite e Flash). Principal e reserva são escolhidos pelo resultado, antes de a
F5 ficar pronta. Benchmark genérico não mede o que importa aqui: recusar a resposta em
português de Ensino Médio e citar a página certa. Critérios em `docs/avaliacao-de-modelos.md`.

**D38 — O tutor tem pacote mensal por turma, com freio diário por aluno.**
Pacote de 300 trocas por aluno por mês, somado na turma: o aluno que precisa mais na véspera
da prova usa o saldo dos colegas que usaram menos. Freio de 60 trocas por dia por aluno
contra abuso. Professor e coordenação veem o consumo. Limite individual rígido cortaria
justamente quem mais precisa; sem teto, uma turma consumiria o mês da escola.

**D39 — IA custa até R$ 5 por aluno por mês na escola particular.**
Soma tutor, ferramentas do professor e agentes. Com infra de R$ 2 (D30), sobram uns R$ 23
dos R$ 30 para suporte, imposto e margem. Na prática, modelo pequeno no tutor e médio na
geração de prova e na correção de discursiva.
Revista em 13/09/2026: o teto de R$ 5 vale para o pacote completo, com tutor (D50). O teto
do pacote base fica em aberto até a planilha de custo por pacote. Correção de discursiva
não propõe nota por enquanto (D46), então sai da conta como nota e fica como devolutiva.

**D40 — A escola paga por aluno, com uso normal incluso. Não há crédito visível.**
Professor e aluno nunca veem "acabou o crédito". O orçamento é interno (D14, D38). Se uma
escola passar do teto de forma recorrente, renegocia o contrato, não o uso no meio do
bimestre. Previsível para a escola e fácil de explicar em assembleia de pais.
Revista em 13/09/2026: o preço por aluno passa a ter faixas de pacote (D50). A regra de não
existir crédito visível continua igual.

**D41 — Na rede pública, o orçamento de IA é derivado do preço do contrato.**
O sistema é o mesmo, mas a rede paga R$ 5 a R$ 10 por aluno, então o orçamento de IA dela é
configurado menor (ordem de R$ 1,50 por aluno): modelo pequeno no tutor e pacote menor por
turma. O preço define o orçamento, e não o contrário. Por isso o orçamento é configuração
por escola e por rede, nunca constante no código.
Revista em 13/09/2026: a rede entra com **pacote de rede com piso de preço**, em torno de
R$ 10 por aluno por mês, ou com um pacote com menos tutor que caiba no preço. Motivo: a
R$ 5, IA (R$ 1,50) mais infra (R$ 2) mais imposto dão uns R$ 4,15 e não sobra para suporte
nem licitação. Perder licitação só por preço é aceito. O orçamento continua sendo
configuração por rede.

**D42 — O provedor de hospedagem é escolhido quando o staging for criado, por critério fixo.**
Nada de produção é necessário antes do staging. Critérios: região São Paulo, Postgres
gerenciado com pgvector e backup contínuo, Redis gerenciado configurável sem expulsão de
chave, storage S3-compatível, custo dentro de R$ 2 por aluno (D30), preço em real ou
crédito para startup. Comparar AWS São Paulo, Google São Paulo, Azure Brazil South e Magalu
Cloud. Revista em 13/09/2026: saiu da Tech Spec do F0, porque o F0 passou a ser só local
(D31). A comparação já feita fica como ponto de partida (AWS São Paulo como candidata;
Azure eliminada por não ter API S3, Magalu por não ter Redis gerenciado), e opção sem custo
entra na comparação.

**D43 — O recorte é anos finais e Ensino Médio, em qualquer computador da escola.**
Do 6º ao 9º ano e do 1º ao 3º do Ensino Médio, em escola particular e rede pública, com o
aluno usando Chromebook, notebook ou laboratório da escola, nunca aparelho pessoal. O
Chromebook deixa de ser filtro de mercado e continua como referência de máquina fraca para
desempenho (regra 50). Motivo: só o Ensino Médio privado dá uns R$ 371 milhões por ano a
R$ 30, contra ~R$ 1 bilhão com os anos finais; e o Ensino Médio público é estadual,
enquanto os anos finais são divididos entre município e estado, então sem eles a prefeitura
(D20) não tem o que comprar. Educação infantil e anos
iniciais continuam fora (regra 70). Aluno de 11 a 14 anos pede cuidado extra no tutor e
atrai o ECA Digital (Lei 15.211/2025).

**D44 — O produto se apresenta como assistente com agentes supervisionados.**
"Um time de IA que prepara o trabalho e avisa, e a escola aprova." Os agentes continuam
(D32), mas "agente, não assistente" e "trabalha sozinho" saem da visão e da venda. Motivo:
quase tudo que a IA faz passa por aprovação ou supervisão humana por exigência do CNE, e
vender autonomia para a coordenação contradiz o argumento de conformidade, que é o que
fecha a venda.

**D45 — O professor é medido em espelho: ele vê o próprio dado, a coordenação vê o
agregado.**
O professor vê o próprio painel de uso e de desempenho das turmas dele. A coordenação vê
por série e disciplina e abre o nominal só com registro em auditoria, como a D34 faz com o
aluno. Sem ranking de professor, e nenhuma métrica alimenta decisão sobre o professor
(avaliação funcional, sanção, dispensa). Motivo: se o professor sente que está sendo
vigiado, ele não usa, e "se o professor não gostar, a escola não renova". Métrica que forma
perfil profissional atrai o art. 20 da LGPD, a convenção coletiva na particular e o
estatuto do servidor na pública. Os indicadores do professor entram no mapa de dados de
`docs/lgpd.md` antes de qualquer migration.
Revista em 19/09/2026 *(ratificada pelo Joaquim em 23/09/2026; indicadores com advogado, `TODO.md`)*: o
indicador do professor deriva do desempenho das turmas dele — dificuldade, acertos e evolução
por habilidade —, continua em espelho e continua sem alimentar decisão sobre ele. Entra a
**regra do grupo mínimo**: a coordenação só vê agregado de um recorte (série × disciplina)
quando há **dois ou mais professores** nele. Com um só, o agregado é nominal na prática, e vale
a regra do nominal: o professor vê primeiro, e a coordenação abre com registro em auditoria.
Motivo: em escola de 300 alunos, "2º ano × Química" é uma professora, e chamar isso de
agregado seria cumprir a D45 só no papel.

**D46 — Primeiro o diagnóstico formativo, depois a nota oficial.**
No início a IA entrega devolutiva e diagnóstico por habilidade em atividade e avaliação,
sem gerar `Nota`. Nota oficial, boletim, aprovação em lote (D33) e exportação para o
sistema de gestão da escola entram depois. Em discursiva e redação a IA não propõe nota
enquanto o texto final das diretrizes do CNE não for publicado e lido. Motivo: segundo a
imprensa de 01/09/2026, o CNE vetou até a sugestão de nota em discursiva e redação; o
diagnóstico formativo tem menos risco legal, não mexe no boletim e é o que alimenta a
medição de desempenho de aluno e professor. A regra de que nota só existe com autor humano
continua valendo quando a nota entrar (D7).

**D47 — O tutor é supervisionado, não aprovado resposta por resposta.**
A resposta do tutor ao aluno não passa por aprovação prévia: ela é supervisionada, com
sinais ao vivo para o professor, registro, resumo, política da turma e escopo aplicados no
servidor. A aprovação prévia registrada continua valendo para tudo o mais que a IA entrega
ao aluno: material, atividade, devolutiva e adaptação. Motivo: o tutor responde em tempo
real, e aprovação prévia de cada resposta o tornaria impossível; o CNE classifica tutor
como risco moderado desde que supervisionado. A regra 70, item 3, passa a declarar essa
exceção por escrito.

**D48 — O login usa a conta da escola quando ela existe, e matrícula quando não existe.**
Aluno e professor entram com a conta Google ou Microsoft da escola, e turmas e vínculos
podem ser importados do Classroom como adaptador opcional. Do aluno guardamos só o
identificador da conta, nunca e-mail nem foto (regra 20). Escola + matrícula + senha, com
reivindicação de nome (D3, D4), continua para quem não tem conta, como boa parte da rede
pública. Motivo: menos senha esquecida e menos reset pela coordenação, e grade e vínculo
chegam prontos. Adaptador opcional mantém a regra 00, item 7.

**D49 — A fila de jobs fica como está, com entrega "pelo menos uma vez" e idempotência
obrigatória.**
O desenho do F0 (job no Postgres, despachante, BullMQ, vaga por escola e reconciliação) é
mantido. A promessa passa a ser entrega pelo menos uma vez, não "executado uma única vez":
todo processador de job recebe chave de idempotência e precisa tolerar reexecução. O teste
intermitente de `pool.int.test.ts` é corrigido. Motivo: o desenho já está construído e
testado contra queda de Redis e justiça entre escolas, e corrigir os pontos custa menos que
refazer as tarefas 7 a 9. A auditoria de 13/09/2026 achou quatro caminhos em que um job
roda duas vezes, e no F5 isso seria chamada de IA paga em dobro. A complexidade para uma
pessoa operar é aceita.

**D50 — O preço por aluno tem faixas de pacote.**
Na escola particular, preço por aluno por mês com um pacote base (assistente do professor
e gestão, hipótese de R$ 12 a R$ 18) e um completo com tutor (hipótese de R$ 25 a R$ 30).
Os valores são validados no piloto. Motivo: R$ 30 para uma escola de 330 alunos dá uns R$
550 por professor por mês, contra R$ 39,90 da Teachy e o Gemini grátis no Classroom; a
faixa base deixa a escola começar menor. O ponto de equilíbrio sobe para 10 a 15 escolas.

**D51 — Toda tela nasce responsiva e usável no celular, para todos os papéis.**
A web é uma só e funciona do computador fraco da escola ao celular: layout que se adapta a
partir de 360 px de largura, toque em vez de mouse, rede móvel lenta, nada que só funcione
com hover ou teclado físico. Vale para aluno, professor, coordenação e, depois, família.
Continua proibido **depender** do celular: nenhum fluxo exige o telefone (login, código,
foto), e em sala vale o computador da escola e a política dela (Lei 15.100). Não há app
nativo. Motivo: o aluno usa o tutor fora da escola quando a escola liga o modo casa (D19),
professor e coordenação abrem o sistema fora do colégio, e o portal da família será usado
quase só no celular; adaptar cada tela depois custaria refazer o frontend inteiro.

**D52 — Os testes de integração da infra saem do portão de toda tarefa e ficam na esteira.**
Os `*.int.test.ts` de `infra/` (borda, métricas, alertas, jobs no compose inteiro) formam o
projeto `infra` do Vitest, fora do `npm run test`. O portão da tarefa roda
`npm run test:infra` só quando ela mexe em infra (regra 40); a esteira roda os três
projetos em todo push no `main`, com um job `infra` próprio. Motivo: esses testes esperam o
relógio real (o `for:` de 5 min do alerta, a sonda da borda, a exportação de métricas) e
somam uns 16 min dos ~21 da integração; no F1 em diante, toda tarefa pagaria isso sem tocar
em infra. A esteira continua segurando o erro antes do staging (D31).

**D53 — O processo de construção é enxugado onde repetia trabalho, sem tirar revisão.**
Na tarefa, o `test-engineer` revisa primeiro e sozinho, e os outros revisores entram em paralelo
depois que ele aprova. A aprovação caduca pelo que o revisor audita: mudança só em arquivo de teste
caduca só `test-engineer` e `revisor-geral`. A rodada nova recebe o diff desde a anterior e as
correções exigidas. O portão local grava um carimbo que o hook exige antes do commit, e o
`revisor-geral` o confere em vez de rodar tudo de novo. A autorrevisão do `/executar-review` vira o
agente `revisor-geral`, em contexto limpo e com veto. Revisores ficam sem ferramenta de edição e
separam bloqueante de recomendação: só bloqueante reprova. A Tech Spec passa por `/revisar-spec`
antes de virar tarefa. Código só entra no `main` por tarefa ou por `/corrigir`, e o hook bloqueia o
resto. O hook guarda o que os revisores exigiram em `achados/<documento>.md`, com resumo de uma
linha por rodada em `achados/indice.md`, que o `/retro` usa depois do `/validar` para mudar
templates, agentes e regras (a separação por documento e o índice entraram em 22/09/2026, na
correção `2026-09-22-achado-de-revisao-nao-cabe-na-janela`: o arquivo único da pasta chegou a 646 KB
e o passo que manda lê-lo antes de cada tarefa não cabia na janela). O texto completo das decisões sai do
`CLAUDE.md` para este arquivo, as regras 30 e 50 passam a carregar por caminho, e PRD, Tech Spec e
`N_task.md` têm o tamanho medido. Motivo: a avaliação do processo de 15/09/2026 achou 119 rodadas de
revisor no F0 e na 1.0 do F1, com 31 reprovações, 16 delas do `test-engineer`; a 1.0 teve 16
execuções de revisor, com `tenancy-guardian` e `infra-guardian` aprovando as quatro vezes; o portão
rodava três vezes na mesma árvore; três commits de correção entraram sem revisor; e a Tech Spec do F1
saiu com 5.393 palavras para um teto de 2.000. Os vetos, o commit direto no `main` (D23) e a esteira
como portão (D31) continuam.

---

> **D54 a D65 — propostas de 19/09/2026, ratificadas.** Saíram da leitura das fontes
> primárias de regulação e dos dois documentos do MEC (`docs/regulacao.md`,
> `docs/conformidade-mec.md`), no branch `docs/direcionamento-regulatorio`, e estão escritas no
> formato de decisão para poderem ser implementadas sem reinterpretação. O Gabriel ratificou as
> que dependiam dele em 19/09/2026, e o Joaquim ratificou todas em bloco em 23/09/2026. O que
> ainda depende de parecer ou de outra decisão está dito em cada uma.

**D54 — O nome do produto é Turmma.** *(ratificada pelo Gabriel em 19/09/2026)*
A marca está pronta: manual, logo, paleta (caramelo #E8732E, azul-noite #16233E, creme
#FFF3E2, papel #FDFBF7) e landing page em `turmma.com`. Documentação, material de venda e
interface passam a dizer Turmma. O repositório, os pacotes, o banco, o compose e os comandos
continuam `educa` até uma renomeação técnica própria, que não vale o risco agora: renomear
pacote e projeto compose no meio do F1 custa mais do que ganha. Motivo: "nome provisório" nos
docs mantinha viva uma discussão já resolvida fora do repositório, e o material de venda e a
primeira tela real precisam de um nome. INPI e registro de domínio continuam pendentes
(`TODO.md`), e é o único risco que sobra: se o INPI negar, a troca é de marca, não de código.

**D55 — Em discursiva e redação, a IA não corrige, não avalia, não dá nota, não atribui
conceito nem mérito, e não faz pré-correção nem sugere nota ao professor.** *(ratificada pelo
Gabriel em 19/09/2026 e pelo Joaquim em 23/09/2026; depende do parecer sobre o texto oficial)*
Revisão da D46, que dizia "sem nota proposta, só devolutiva". A cobertura do ato do CNE de
01/09/2026 é explícita: a IA não pode ser usada para corrigir, avaliar, dar nota, conceito ou
mérito em redação e questão dissertativa, **nem para pré-corrigir, nem para apresentar ao
professor uma sugestão de nota**. Isso alcança a "devolutiva rascunho de discursiva" do F6 e
a ferramenta de redação por competência do F7 como estavam desenhadas. O que continua
permitido: gerar rubrica e critérios antes da aplicação (são sobre a atividade, não sobre o
texto do aluno), organizar o lote, conferir entrega e anonimizar para correção cega.
Consequência técnica: nenhum campo, nem interno, nem rascunho, nem log, guarda nota, conceito
ou pontuação sugerida pela IA para discursiva ou redação. Motivo: é a proibição mais dura do
ato e a mais fácil de violar sem perceber, porque "só um rascunho para o professor" é
exatamente o que o texto chama de pré-correção. A devolutiva formativa em discursiva volta a
ser discutida quando o texto oficial for publicado e lido com advogado (`TODO.md`); até lá o
produto não a entrega. Custo aceito: perdemos uma funcionalidade que a Teachy e a Geekie
anunciam — e ganhamos o argumento de que elas estão do lado errado da norma.

**D56 — Na objetiva, a validação humana é registrada: o sistema guarda o que foi mostrado, o
que foi aberto e quem confirmou.** *(ratificada pelo Joaquim em 23/09/2026)*
Complementa a D33, que fica de pé. O ato do CNE classifica correção de objetiva como alto
risco e exige validação humana "efetiva, prévia, qualificada e documentada", dizendo que o
professor não pode apenas clicar em "aprovar". Então a aprovação em lote passa a gravar o
registro da validação: a distribuição apresentada, quais casos destacados foram abertos
(discursiva com baixa confiança, nota distante do histórico do aluno, prova em branco), quem
confirmou e quando. O botão do lote continua travado até os destacados serem abertos. Motivo:
"documentada" não é satisfeito por um booleano `aprovado`; a escola precisa poder mostrar à
fiscalização *como* o humano validou. E é o mesmo registro que alimenta a governança do F12.

**D57 — Usos vedados, escritos e testados: sem inferência de emoção, sem perfil comportamental
ou psicológico, sem pontuação social, sem biometria, e nenhum dado educacional para
publicidade ou fim comercial.** *(ratificada pelo Joaquim em 23/09/2026)*
Estava implícito na regra 70, item 7, como ausência de funcionalidade. Passa a ser proibição
escrita, com teste, porque agora tem três fundamentos independentes: o ato do CNE classifica
essas práticas como risco excessivo ou incompatível; o ECA Digital veda perfilamento e análise
emocional para publicidade (art. 22) e criação de perfil comportamental de menor (art. 26); e
o Decreto 12.880 veda inferência emocional como prática manipulativa (art. 10, II). O sinal de
aluno em risco continua existindo, derivado de fato declarado — entrega, desempenho, o que o
aluno escreveu de forma explícita —, nunca de leitura de estado emocional, e sempre com
explicação e caminho de contestação (D60). Motivo: é a fronteira que, atravessada uma vez,
tira o produto da categoria "supervisão" e o põe na de "vigilância", que é o que a família
recusa e a ANPD multa.

**D58 — Os agentes continuam agentes: identidade de função, sem se passar por pessoa.** *(ratificada
pelo Gabriel em 19/09/2026 e pelo Joaquim em 23/09/2026)*
O agente mantém nome, avatar, thread e jeito próprio — o time de IA é o produto (D32, D44), e
o nome é o da função (D17). A transparência que o art. 11, I, do Decreto 12.880/2026 exige
("caráter sintético e automatizado" da interação) é cumprida pelo que o produto já é de ponta
a ponta: a escola contrata um time de IA, a família ouve isso na assembleia, a área do aluno
se chama "Seu time", o agente se apresenta pela função e **toda saída de IA é rotulada como
tal**, com a fonte. Nenhum aluno tem como achar que o Tutor é a professora dele.

O que fica proibido é estreito e não custa produto: dizer que é humano quando o aluno
pergunta; usar nome de pessoa que sugira uma pessoa real; simular vínculo afetivo ou
dependência ("senti sua falta", "não me deixe agora"); e qualquer manipulação de
comportamento, que é o inciso II do mesmo artigo. Perguntado sobre si, o agente explica o que
é, como funciona e que pode errar (D65).

Motivo: o decreto pede que a criança não seja **enganada**, não que o produto seja sem graça.
Persona que esconde ser IA é o problema que a norma mira — produto de companhia artificial,
não tutor escolar. Agente que diz o que é e o que faz é a solução, e é justamente o que torna
a supervisão explicável em reunião de pais: "o Assistente corrigiu, a professora aprovou". A
versão anterior desta decisão, de 19/09/2026, exigia um aviso não desligável no início de cada
sessão e proibia persona; foi revertida no mesmo dia, a pedido do Gabriel, porque descaracteriza
o conceito central do produto e não decorre do texto do decreto. Nada impede que a escola, no
material dela, explique que são agentes de IA — isso já está no dossiê (D61).

**D59 — Nada no produto induz uso excessivo, e nenhum caminho de saída é mais difícil que o de
entrada.** *(ratificada pelo Gabriel em 19/09/2026 e pelo Joaquim em 23/09/2026)*
Do art. 9º do Decreto 12.880 (uso excessivo, problemático ou compulsivo) e do art. 10 (práticas
manipulativas), com o art. 8º, IV, e o art. 17, § 4º, II, do ECA Digital. Proibido: recompensa
por tempo de uso, sequência de dias, conteúdo que se inicia sozinho, rolagem infinita,
notificação fora do horário útil da escola, e ocultar ponto de parada. Obrigatório: o teto
diário do tutor (D38) é mostrado ao aluno como salvaguarda, não como punição; e revogar
consentimento, sair, ou mudar configuração de privacidade tem caminho tão curto quanto o de
aceitar. Motivo: o caminho fácil de engajamento em produto para adolescente é exatamente o que
a lei chama de manipulativo, e o princípio 8 do MEC manda a escola **rejeitar** plataforma com
design persuasivo. Isso vira item de checklist do `frontend-reviewer`, não recomendação.

**D60 — Avaliação de Impacto Algorítmico por funcionalidade de alto risco, no roteiro de seis
etapas do MEC, antes de a funcionalidade existir.** *(ratificada pelo Joaquim em 23/09/2026)*
Alto risco aqui é: Tutor, correção de objetiva, diagnóstico por habilidade, sinais do tutor e
alertas sobre aluno, e adaptação por necessidade específica. Cada um tem uma AIA escrita,
versionada no repositório, com as seis etapas do Referencial do MEC: justificação e escopo
(inclusive o escopo negativo, o que a ferramenta não deve fazer), análise dos dados e do modelo,
identificação e avaliação de riscos, estratégias de mitigação, validação e auditoria da equidade,
e monitoramento contínuo com procedimento de suspensão. O RIPD do `TODO.md` continua, e a AIA é
a camada que o RIPD não cobre: viés, equidade e impacto pedagógico. A AIA é revista a cada troca
de modelo ou mudança relevante de prompt. Motivo: o ECA Digital já obriga gerenciamento de risco
e relatório de impacto (art. 8º, I, e art. 16), a AIA é o formato que o MEC espera ver, e é
documento que a escola vai pedir (`docs/conformidade-mec.md` seção 5). Fazer depois é reescrever
o PRD com outro nome.
Revista em 19/09/2026: as AIAs ficam versionadas em `docs/aia/`, um arquivo por avaliação. O
Joaquim escreve o rascunho da etapa 1 (justificação e escopo, com o escopo negativo) e o
Gabriel revisa. A lista acompanha a D32 revista e está em `docs/aia/README.md`.
Revista em 23/09/2026: com a D32 revista, o procedimento de suspensão é **por função numa
escola** — a coordenação desliga a correção automática sem desligar o chat do professor —, com
registro próprio e auditoria. A AIA continua por funcionalidade, que já era o recorte da regra
70, item 6a.

**D61 — O dossiê de conformidade é entregável de produto, não material de marketing.** *(ratificada
pelo Gabriel em 19/09/2026 e pelo Joaquim em 23/09/2026)*
A escola compra por checklist (os quatro critérios do MEC) e exige documento do desenvolvedor.
Entregamos, versionado no repositório e gerado por escola: declaração de propósito com as faixas
etárias para as quais o produto foi projetado; documentação do funcionamento em linguagem
simples, com fluxograma do algoritmo, do uso de dados e do modelo pedagógico; relatório de
conformidade com LGPD e ECA Digital, artigo por artigo; RIPD e AIA; relatório de uso legível por
não especialista (que é a tela de governança do F12 exportada); e material de apoio para a escola
comunicar a adoção a professores e famílias. Junto entram duas peças de produto: **canal de
notificação de violação** acessível a aluno, professor, coordenação e família, com retirada de
conteúdo e direito de recurso informando se a análise foi humana ou automatizada (ECA arts. 28 a
30, Decreto art. 41); e o material da **consulta prévia à comunidade escolar**, que o MEC pede
pelo princípio da gestão democrática. Motivo: 78% das escolas não têm política de IA e agora têm
prazo para se adequar; quem entrega o documento pronto entra na reunião como parceiro. E é o
mesmo trabalho da tela que já íamos construir.

**D62 — Conversa de aluno só em provedor de modelo com processamento no Brasil.** *(ratificada pelo Joaquim em 23/09/2026;
o provedor fecha com a D37, e o afrouxamento 2 da D71 vale enquanto o dado for sintético)*
Roteamento por soberania, não por custo: o que carrega conversa de aluno — Tutor, sinais,
qualquer prompt com texto escrito por menor de idade — vai para provedor com processamento em
território nacional, escrito em contrato. Tarefa sem dado pessoal, como gerar questão a partir de
trecho de material ou resumir conteúdo público, pode usar provedor fora, com as cláusulas-padrão
da ANPD e informação à escola. Na prática isso favorece a Maritaca (Sabiá) como principal do
Tutor e deixa o Gemini como reserva e como modelo de tarefa sem dado pessoal, e passa a ser
critério da avaliação de modelos (D37) com peso maior que preço. Motivo: o capítulo de soberania
do Referencial do MEC trata dado educacional de menor fora do país como risco de Estado, citando
o Cloud Act, e a rede pública vai perguntar isso na primeira reunião. É também a única vantagem
competitiva que nenhum concorrente estrangeiro pode copiar. Custo aceito: se o modelo brasileiro
for pior no tutor, perdemos qualidade onde ela mais aparece — por isso a avaliação da D37 decide
com amostra real, e o resultado pode derrubar esta decisão.

**D63 — O que a escola e o professor produzem é deles, e sai em formato aberto a qualquer
momento.** *(ratificada pelo Gabriel em 19/09/2026 e pelo Joaquim em 23/09/2026)*
Material ingerido, artefato gerado, histórico de uso e dado de desempenho são exportáveis em
formato aberto pela própria coordenação, a qualquer momento, sem pedir a nós, e integralmente no
fim do contrato. Nada do que o professor produz vira nosso: sem reaproveitamento entre escolas,
sem treinamento de modelo, sem licença nossa sobre a produção docente. Motivo: o documento da SEB
lista "perda da propriedade intelectual da produção docente" e dependência de fornecedor como
riscos de contratação, e pergunta em checklist se o recurso permite baixar dado e histórico em
formato aberto. Era a pergunta que respondíamos pior. Além disso, exportação fácil é o que torna
o piloto reversível, e reversibilidade é requisito do princípio 10 do MEC.

**D64 — Recusar a ferramenta não gera indicador: não existe medição nominal de adoção por
professor.** *(ratificada pelo Gabriel em 19/09/2026 e pelo Joaquim em 23/09/2026)*
Afina a D45. O MEC exige que a rede garanta que nenhum professor seja penalizado por optar por
não usar uma ferramenta, e que a autonomia didático-pedagógica seja preservada. Então não existe,
em nenhuma tela: ranking de uso por professor, alerta de "professor que não usa", lista nominal de
adoção, nem meta de uso por professor. Adoção é agregada por série e disciplina, e é métrica
nossa de produto, não instrumento de cobrança da coordenação. O painel do professor continua
sendo dele primeiro (D45). Motivo: "se o professor não gostar, a escola não renova" é a regra que
orienta prioridade, e medir adoção nominal é o jeito mais rápido de transformar o produto em
instrumento de cobrança — além de atrair art. 20 da LGPD, convenção coletiva e estatuto do
servidor.

**D65 — Letramento em IA entra por três portas pequenas, e não vira fase de roadmap.** *(ratificada
pelo Gabriel em 19/09/2026 e pelo Joaquim em 23/09/2026)*
As diretrizes do CNE exigem ensino sobre IA progressivo e transversal, e o MEC exige que a
adoção de recurso com IA venha acompanhada de ensino crítico sobre a tecnologia. Não vendemos
currículo. O que entra: (1) o Tutor, perguntado sobre si, explica o que é, como funciona, o que
não sabe e que pode errar, em linguagem da faixa etária — que é a transparência do art. 11, I, do
Decreto 12.880 sendo útil; (2) o Assistente de ensino gera, sob pedido do professor, atividade alinhada às
12 aprendizagens do documento da SEB e às habilidades de Computação da BNCC, como qualquer outro
conteúdo; (3) o material de comunicação e formação do dossiê (D61) cobre o lado dos adultos.
Motivo: é exigência da norma que atendemos com três itens pequenos, e transformá-la em módulo de
currículo seria escopo novo sem comprador. Se uma rede pedir currículo de IA, isso é conversa de
produto, não de conformidade.

---

> **D66 a D70 — propostas de 19/09/2026, ratificadas.** Saíram da estrutura de agentes por
> papel que o Gabriel fechou com o time (aluno, professor, coordenação), conferida contra as
> decisões e as regras, no branch `docs/estrutura-de-agentes`. No mesmo passo foram revistas a
> D17, a D23, a D32, a D45 e a D60. O Gabriel decidiu, e o Joaquim ratificou em bloco em
> 23/09/2026. A lista de agentes que elas citam foi revista no mesmo dia (D32): onde o texto diz
> Corretor, Planejador ou Adaptador, leia a função correspondente do Assistente de ensino.

**D66 — O Tutor tem memória de tudo que o aluno fez no sistema, feita do registro do trabalho
e nunca de texto sobre a pessoa, e recebe contexto estruturado do professor.** *(ratificada pelo Joaquim em 23/09/2026)*
O Tutor acompanha o aluno ao longo do ano, e a memória é **obrigatória**. Ela cobre **toda a
trajetória do aluno no sistema** — todas as atividades, trabalhos, avaliações, práticas e
sessões com o Tutor, com o que foi feito, o resultado por habilidade e a evolução no tempo —, e
não um retrato pontual de onde ele travou na última vez. É feita do que o sistema registra
sobre **o trabalho**: o que foi feito e quando, o resultado, a devolutiva que o professor
escreveu, e o resumo de cada sessão com o Tutor em formato fixo (assunto, habilidade,
exercício, onde travou, como terminou) — o mesmo registro e resumo que o professor já vê (D8).
O que não existe é texto sobre **a pessoa**: jeito, humor, atenção, comportamento ou rótulo,
escrito por modelo ou por gente (D57). A cada conversa o Tutor busca na memória o que importa
para aquela dúvida; o histórico inteiro não vai no prompt, por minimização (regra 20, item 12)
e por custo (D14). Em discursiva e redação a memória guarda que o trabalho foi feito e a
devolutiva que o professor escreveu; o Tutor não avalia o texto (D55). A memória segue a
retenção de cada dado que a compõe (`docs/lgpd.md`). O professor alimenta o Tutor
de duas formas, as duas estruturadas: **por turma** (o que está sendo dado, a lista ativa, o
foco da semana) e **por aluno** (as habilidades a reforçar, escolhidas da lista; sem texto
livre sobre a pessoa). O Tutor também lê a **adaptação registrada** do aluno (D35) para ajustar
a forma — frases mais curtas, passos menores, resposta compatível com leitor de tela —, nunca
o que é cobrado. Motivo: tutor que não lembra onde o aluno travou ontem é um chat genérico, e é
a memória que permite direcionar de forma individual; mas perfil acadêmico individual é alto
risco no CNE, e texto livre sobre menor vira prontuário (regra 20, item 3). Registro do
trabalho é auditável, explicável ao aluno e contestável; opinião sobre a pessoa não é. Consequências: entra na
AIA do Tutor (D60), com explicação em linguagem comum e caminho de contestação; o que for campo
novo entra no mapa de dados de `docs/lgpd.md` antes de qualquer migration; e a adaptação viaja
para o modelo como tipo de adaptação, sem nome e sem motivo (regra 20, item 12), só em provedor
com processamento no Brasil (D62).

**D67 — O professor ganha as ferramentas de apresentação e de material didático, e o artefato
sai no formato que ele pedir.** *(ratificada pelo Joaquim em 23/09/2026)*
Entram no F7: **apresentação** (roteiro e slides a partir do material, com a página citada) e
**material didático** (resumo, texto de apoio, revisão), este fora da primeira entrega. O
artefato exporta em **PDF, PowerPoint (PPTX) e Excel (XLSX)**, conforme o tipo e o pedido do
professor, além da impressão. A ferramenta de adaptação passa a se chamar só **Adaptação**, e a
entrada dela é a **escolha do tipo de adaptação** (linguagem direta, fonte ampliada, tempo
extra, compatível com leitor de tela…), nunca texto livre descrevendo o aluno. A adaptação, função do Assistente de ensino (D32
revista), faz uma coisa simples: adapta prova e atividade — e material didático, quando o professor pedir —
para o aluno surdo, para o que não fala, para quem precisa de enunciado mais fácil, sem o
sistema saber nem guardar a condição (D35). Não geramos o documento formal de PEI, que descreve
o aluno e é da equipe da escola. **Isso não deixa a escola irregular**: o plano individual
(estudo de caso e Plano de AEE; LBI, art. 28, VII; Decreto 12.686/2025) é obrigação da escola,
feito pela equipe pedagógica com a família, do jeito que ela já faz hoje; o que a lei pune é
recusar matrícula ou **recusar adaptação** (Lei 7.853/1989, art. 8º, I; LBI, art. 4º, § 1º, e
art. 88), e adaptar é justamente o que a ferramenta faz. O fluxo fica coerente: o plano da
escola define as adaptações, a coordenação registra só as adaptações (D35), e a função de
adaptação as aplica. Não gerar o PEI é escolha nossa de minimização de dado sensível de menor, não proibição
legal; pode ser revista com advogado se uma escola pedir. Motivo: o professor entrega em formatos diferentes conforme a
escola e a aula, e ferramenta que só exporta num formato devolve o professor ao copiar e colar;
PDF, PPTX e XLSX são padrões ISO abertos, o que mantém a D63. Na adaptação, o risco nunca esteve
no nome da ferramenta, e sim no campo de texto livre onde alguém escreve o diagnóstico.
**Continua em aberto:** de onde vêm as imagens da apresentação (licença, D5).

**D68 — Busca na web existe por ativação do professor: para ele no Assistente de ensino, e para
o aluno no Tutor, só em fontes aprovadas.** *(ratificada pelo Joaquim em 23/09/2026; com pergunta nova
ao parecer do ECA Digital)*
Por padrão, tudo nasce do material da escola. O professor pode ligar a busca em dois lugares.
**No Assistente de ensino**, por conversa, para ele próprio. **No Tutor**, para a turma
pesquisar além do material didático, com estas condições: (1) a busca do aluno só alcança uma
**lista de fontes aprovadas** — órgãos públicos, IBGE, INEP, universidades, museus,
enciclopédias —, com lista padrão nossa, por faixa etária, que a escola ajusta; web aberta não;
(2) **duas chaves**: a coordenação libera o recurso na escola, desligado por padrão como o modo
casa (D19), e o professor ativa por turma, com prazo; em avaliação em andamento fica sempre
desligada; (3) o Tutor **continua socrático**: traz a fonte, pede para comparar duas, pergunta
de volta, e não escreve o trabalho — é letramento em pesquisa, junto da D65; (4) o **assunto
continua sendo o da turma**: muda de onde vem a informação, não sobre o que o Tutor fala; (5) a
**consulta é escrita pelo modelo**, sem o texto nem o identificador do aluno, porque o buscador
é terceiro fora do País (D62), e ele entra no registro de suboperadores; (6) o professor vê o
que foi pesquisado e quais fontes foram abertas, e a resposta vem rotulada "da web", com o
link, separada de "material da escola, página X"; (7) há teto de buscas por aluno por dia,
dentro do pacote do Tutor (D38, D39); (8) começa **só no modo sala**. Motivo: pesquisar além da
apostila é parte de estudar, e o aluno que não pode fazer isso no Turmma faz no ChatGPT, sem
ninguém vendo. As condições não são preferência nossa: o ECA Digital exige a configuração mais
protetiva por padrão (arts. 3º e 7º) e conteúdo compatível com a faixa etária (art. 8º) — temos
aluno de 11 anos —, e o Decreto 12.880 exige salvaguardas ao desenvolvimento (art. 11, IV).
Lista de fontes aprovadas é o que torna a busca defensável. Consequências: entra na AIA do
Tutor; o teste adversário do Tutor passa a cobrir **página da web com instrução escondida**, e
vem do F16 para o F9; e o parecer do ECA Digital ganha uma pergunta: ligar a busca para aluno de
até 16 anos sem conta de responsável vinculada conta como rebaixar a proteção (art. 24, § 5º)?

**D69 — "Minhas turmas" é aba do "Meu painel" do professor, e nasce no F6.** *(ratificada pelo Joaquim em 23/09/2026)*
A análise da turma — desempenho, principais dificuldades, evolução, conteúdo com mais erro,
alunos que precisam de atenção — não é item novo de menu: é a aba **Minhas turmas** de "Meu
painel", ao lado de **Meu uso**. Nasce no F6, com o diagnóstico por habilidade e o relatório
por questão; ganha os sinais do Tutor no F10 e a comparação com a série no F12. Motivo: o menu
do professor veio fechado do desenho da call, e esperar o F12 para o professor enxergar a
própria turma deixaria o diagnóstico do F6 sem tela. "Aluno que precisa de atenção" sai de fato
declarado — acerto por habilidade, entrega, onde travou —, com a explicação na tela e caminho
de contestação (D57, D60), e aparece nomeado só para o professor da turma (D34). **Continua em
aberto** a lista de indicadores, os limiares e o texto dos alertas (`CLAUDE.md`). Ponto de
partida do Gabriel: percentual de erro e acerto, e o sinal **"concluiu o que foi atribuído"**,
para o professor liberar a próxima lista. Medir tempo ocioso do aluno não entra: é medir
atenção e comportamento (regra 70, item 7), e o mesmo objetivo sai do fato "concluiu".
Revista em 23/09/2026 (D73): "Meu painel" deixa de existir. "Minhas turmas" vira o item
**Turmas** da navegação do professor, com a lista das turmas dele e o **Meu uso** (o espelho da
D45) ali dentro. O que a turma aberta mostra — as abas desenhadas no mockup — fecha no PRD da
A3 (`docs/pendencias-dos-mockups.md`, P11 e P28). Continua nascendo no F6, com uma fatia na A3.

**D70 — Sair da aba durante a prova é fato mostrado ao professor, e só durante a avaliação.**
*(ratificada pelo Joaquim em 23/09/2026; AIA e `conformidade-reviewer` antes de existir)*
Em prova e atividade avaliativa online, o sistema registra quando a aba da avaliação perde o
foco e mostra ao professor como fato: "saiu da aba da prova 3 vezes". **Só notifica o
professor.** Não tenta saber para onde o aluno foi — uma página web não enxerga isso —, não tem
consequência automática sobre a prova nem sobre a nota, o aluno é **avisado antes** de começar,
e o registro fica preso àquela avaliação, junto do registro da validação (D56), nunca como
atributo ou histórico do aluno. **Fora de avaliação não existe**: aluno estudando com o Tutor
não tem a navegação acompanhada, porque aí deixa de ser integridade da prova e vira a janela
sobre o comportamento que a regra 70, item 7, proíbe. Esse caso fica como pergunta para a AIA
de sinais e para o parecer, não como funcionalidade. Motivo: o professor precisa saber quando a
prova online pode ter sido feita com outra aba aberta, e esse é um fato simples e verificável;
o mesmo mecanismo ligado o tempo todo é vigilância, que a família recusa e a ANPD multa (D57).
Risco a escrever na AIA: leitor de tela, teclado virtual e notificação do sistema também tiram
o foco da aba, e o falso positivo cai justamente no aluno com adaptação registrada — por isso é
fato para o professor olhar, nunca evidência automática. Bloquear outras IAs no computador da
escola é configuração do Google Admin ou do filtro da rede: entregamos o guia no dossiê (D61).

**D71 — Depois do F1 vem um MVP de apresentação: fatias finas e reais do fluxo completo, com
dado sintético.** *(direção dada pelo Gabriel e pelo time em 19/09/2026; ratificada pelo Joaquim
em 23/09/2026, com a composição revista abaixo, e o detalhe de cada spec fecha no PRD dela)*
Em vez de seguir F2, F3, F4… até o F15 para só então ter o que mostrar, a próxima construção
depois do F1 é o MVP de apresentação: o mínimo que demonstra as três áreas — aluno, professor e
coordenação, com os seis agentes da D32 revista — e as quatro coisas da D24, numa escola
sintética. São cinco specs, A1 a A5 (`ROADMAP.md`): **base** (casca com a marca, camada de IA
mínima, runtime mínimo de agente, seed), **professor** (ingestão mínima, Assistente de ensino,
atividade, plano de aula, Adaptação, Planejador), **atividade e correção** (aluno responde,
Corretor, diagnóstico, aprovação com registro, "Minhas turmas"), **tutor e sinais** (Tutor
socrático com memória, thread do Tutor para o professor) e **coordenação** (governança de IA,
agentes e autonomia, Analista de desempenho escolar, roteiro). Depois dele o roadmap continua
na ordem de antes, e cada fase **completa** a fatia que já existe em vez de começar do zero.
Regras da fatia: (1) dado 100% sintético — nenhum aluno, professor ou escola real, e o portão
da primeira escola real continua intocado; (2) é código do produto, não protótipo: mesma
arquitetura, mesmas regras 00 a 80, mesmo processo (PRD, Tech Spec, tarefas, revisores) — fatia
fina não é atalho; (3) a regra 70 vale inteira: entrega nasce pendente, nada de discursiva
corrigida por IA, saída de IA rotulada; (4) fica de fora tudo que não aparece no roteiro.
Três afrouxamentos, que valem **só enquanto o dado for sintético** e precisam do aceite do
Joaquim: a AIA entra com a etapa 1 (escopo e escopo negativo) antes do PRD da fatia, e as seis
etapas antes do primeiro aluno real (D60); o provedor de modelo é o que tivermos pela porta,
porque não há texto de aluno real, e a D62 volta a valer antes de aluno real; e o cenário de
carga não cresce com as fatias, cresce quando a fase for completada (regra 80). Motivo:
precisamos começar a demonstrar, e a D1 já dizia que o que convence é o fluxo completo. O risco
que o roadmap apontava — refazer os agentes por construí-los antes da base — é menor agora: F0
e F1 já são a base, e a fatia nasce sobre ela, no desenho final. Custo aceito: F2 e F3 atrasam,
e nenhuma escola real entra antes deles e do portão. A apresentação roda primeiro na nossa
máquina (`docker compose up` e seed); o staging nasce quando alguém de fora precisar usar
sozinho (D31, D42).
Revista em 23/09/2026, pelo Joaquim: os **três afrouxamentos estão aceitos**, e a composição
muda no começo. A **A1 passa a ser a escola** (`apresentacao-escola`): a casca com a marca, a
coordenação montando a escola na tela — disciplinas, turmas, lista de nomes por turma e
alocação professor × turma × disciplina —, o professor entrando por convite e confirmando o
vínculo, e o aluno reivindicando o nome com a aprovação do professor. É o núcleo do F2, fino.
A escola em si é criada por nós, pelo `ops:escola`, e a coordenação recebe o convite pelo
`ops:convite-coordenador`, que já existem desde o F1 (D2). **Não existe seed com escola
pronta**: o que a demonstração mostra entra pelo próprio produto, digitado por nós, e continua
100% sintético — nomes inventados, nenhuma pessoa real (regra 20, item 17). A camada de IA
mínima e o runtime de agente passam para o começo da A2, junto da ingestão, que é feita pela
coordenação (D75). Grade horária e calendário ficam para o F2 e o F8, e o "seu dia" do
Assistente sai do roteiro até lá. Os agentes do roteiro são os três da D32 revista. Motivo: a
primeira das quatro coisas da D24 é a escola cadastrada sem trabalho manual, e um seed com a
escola montada escondia exatamente isso; é também a primeira coisa que uma escola real vai
fazer, então é a que precisa estar de pé desde já. Os fixtures de teste continuam existindo,
dentro dos testes: o que sai é a escola pronta na demonstração.
Revista de novo em 23/09/2026 (D76): antes da A1 entra a **A0**, o painel da operação, e a
escola passa a nascer nele em vez de no `ops:escola`, que continua existindo.
Revista em 25/09/2026, pelo Joaquim, na revisão da spec da A1: um **quarto afrouxamento**, que vale só enquanto o
dado for sintético. A conta de professor é global e, na A1, nasce por um link que a coordenação da escola copia, sem
prova de posse do e-mail, e é reaproveitada quando outra escola convida o mesmo e-mail (RF7 da A1). Ficam tolerados
dois comportamentos: (a) o aceite do convite responde diferente para e-mail com e sem conta Turmma, e quem tem o link
descobre se a pessoa trabalha em outra escola cliente; (b) a senha de uma conta global é definida por quem tem o link
de uma escola e vale no convite de outra. Antes da primeira escola real, a prova de posse do e-mail fecha os dois,
como item do portão (`ROADMAP.md`). Motivo: a prova exige envio de e-mail pelo sistema, que o PRD da A1 deixou fora,
e com dado sintético ninguém real fica exposto.

**D72 — A pele do produto é o sistema do ChatGPT, em branco, preto e laranja, e é uma só.**
*(decidida pelo Joaquim em 23/09/2026, entre a pele do P02, que o Gabriel escolheu em
19/09/2026, e a cópia da Teachy da oitava rodada, P31; o Gabriel é avisado)*
Três cores e mais nenhuma: branco, preto (`#0D0D0D`) e o laranja da pinta (`#E8732E`); verde e
vermelho só em estado. Fonte do sistema, com a Fustat só no logotipo. Botão em pílula, item de
menu de 36 px com canto de 10, caixa de pedido com canto de 28 e sombra suave, rótulo de grupo
cinza sem caixa-alta, e o laranja aparecendo pouco: a pinta, o enviar, o contador e o que
espera a pessoa. Vale em **todas** as telas: Ferramentas e Turmas mantêm a estrutura que o
Gabriel desenhou na oitava rodada (o catálogo, a turma aberta), mas sem Quicksand e Inter, sem
o canto de 8 px, sem as medidas tiradas da Teachy e com os ícones de ferramenta dentro da
paleta. Junto vem o **padrão de espaço** do P03: aba de navegação sem título nem descrição (o
`<h1>` existe só para leitor de tela, e cada rota tem o próprio `document.title`), margem de 16
px no celular e 24 px a partir de 768, uma barra de 36 px com os controles da página, largura
de até 1480 px em grade e tabela, 1040 em formulário e 760 em leitura e conversa, e tela de
trabalho que cabe na janela e rola por dentro. Os nomes dos tokens da seção 9.9 do
`docs/interface.md` ficam; os valores e os SVGs do logotipo vêm de `mockups/` (`src/index.css`
e `public/marca/`), que são da marca e não código de terceiro. Os avatares dos três agentes o
Gabriel entrega antes da Tech Spec da A2. A pele da landing page — papel, creme, azul-noite —
continua sendo da landing page. Motivo: o Gabriel rejeitou a pele da landing vendo o produto;
duas peles dobram o trabalho da A1 e da A2; sem fonte web além do logotipo, o primeiro
carregamento fica menor no Chromebook (regra 50); e copiar fonte, medida e canto de um
concorrente direto abre o risco de concorrência desleal (trade dress) sem ganho que o
compense.
Revista em 25/09/2026, pelo Joaquim: os avatares dos três agentes e "Seu time" passam da A1 para a
A2, onde os agentes nascem, e a casca da A1 não reserva o lugar. Motivo: na A1 não existe agente, e
pela D73 item de fase que não existe não aparece; manter o prazo na A1 travava a Tech Spec dela sem
nada a mostrar na demonstração.

**D73 — A navegação do professor é a do mockup: a caixa de pedido em primeiro lugar, o time e o
histórico na lateral.** *(decidida pelo Gabriel em 20/09/2026, vista em mockup; ratificada pelo
Joaquim em 23/09/2026)*
Revisa a seção 1 do `docs/interface.md`, que estava marcada como decidida pelo desenho da call,
sem renumerar a Parte A. A lateral do professor tem **Nova conversa · Ferramentas · Calendário ·
Turmas**, e dois grupos: **Seu time** (Assistente de ensino e Tutor, cada um abrindo a própria
conversa em tela cheia) e **Histórico** (as conversas de verdade, por data). Cada item só
aparece quando a fase dele existir: Calendário nasce no F8, e Projetos e Fixados só entram se o
P05 for aprovado. "Meu painel" deixa de existir, e "Minhas turmas" vira **Turmas**, com o **Meu
uso** dentro (revisão do nome na D69). O menu da pessoa segue o P18, com "Sair" a um clique e do
mesmo tamanho dos outros (D59). Motivo: o professor abre o produto para pedir alguma coisa, e a
navegação da call punha na frente páginas que ele raramente abre; o Gabriel reprovou o desenho
antigo vendo, e o novo tem menos itens e nenhum que exista sem fase.

**D74 — É ferramenta o que entrega um output próprio; o resto é pedido ao Assistente.**
*(decidida pelo Gabriel em 20/09/2026; ratificada pelo Joaquim em 23/09/2026)*
Ferramenta é a ação específica que entrega uma coisa com formato, que fica na biblioteca, sai em
arquivo e pode ser aplicada — um plano completo, uma apresentação, uma prova. O que o chat já
responde — e-mail, ideia de atividade, resumo de um texto, pergunta sobre um conteúdo — não é
ferramenta: é pedido ao Assistente de ensino, sem contrato próprio (D18). As ferramentas se
organizam em quatro categorias, com estes nomes na tela e na busca: **Planejar**, **Preparar a
aula**, **Avaliar** e **Corrigir**. As oito ferramentas novas que o mockup propôs (planejamento
do período, projeto, plano de recuperação, mapa mental, roteiro de experimento, avaliação
diagnóstica, proposta de redação e importar prova) **não** entram por esta decisão: cada uma
passa por `/descobrir` antes do F7, e na A2 a tela mostra só as que existem. Motivo: sem um
critério, cada pedido vira ferramenta, e o catálogo incha como os de "60 ferramentas" do mercado;
com ele, recusar um pedido de ferramenta tem resposta escrita, e o detector de intenção da D18
ganha os dois lados que precisa distinguir.

**D75 — O material da escola entra pela coordenação.** *(decidida pelo Joaquim em 23/09/2026)*
A base de material da escola é montada só pela coordenação: ela cria as disciplinas e sobe os
documentos, com a titularidade e a licença declaradas (D5, D22). Professor e aluno não sobem
material para a base. A titularidade continua sendo declarada (material da escola, do professor
autor, de terceiro com licença, de domínio aberto): quem sobe é a coordenação, de quem é o
material é a titularidade que ela declara. O anexo numa conversa (P07) é outra coisa, vale só
naquela conversa, e continua em aberto. Motivo: a licença é da escola, que é a controladora
(D10); com uma porta só de entrada, a D5 é conferida num lugar só, por quem responde por ela; e
é o fluxo que a escola já tem, em que a coordenação distribui o material.

**D76 — A equipe Turmma tem um painel de operação: cria rede e escola, convida a coordenação e
acompanha uso e custo por escola, sem ver dado de pessoa.** *(decidida pelo Joaquim em
23/09/2026)*
Quem entra é só o **operador Turmma**, com conta separada das contas de escola: a primeira nasce
por comando, porque alguém precisa existir antes da tela, e o segundo fator é obrigatório. O
painel cria rede e escola; gera, revoga e refaz o convite da primeira coordenação; lista as
escolas com o estado e com contagens — turmas, alunos e professores ativos —; e mostra o uso de
infra de cada escola no dia e no mês, que já é medido desde o F0 (D30). Com a A2, a mesma tela
passa a mostrar o consumo de IA por escola, em tokens e em reais estimados pelo preço de cada
perfil, contra o teto por aluno (D39); o custo de infra em reais espera o provedor de hospedagem
(D42). O painel **não vê** nome, matrícula, nota, conversa nem material de ninguém: a escola é a
controladora do dado (D10), e nenhuma ação do operador devolve dado de pessoa (RF1 do F1). A
leitura entre escolas é a exceção da regra 10, item 9: um módulo só, com a justificativa escrita
em cada consulta sem escopo, e teste provando que usuário de escola não alcança o painel e que o
painel não devolve dado de pessoa. Toda ação do operador vai para a auditoria com o identificador
dele. Os comandos `ops:*` continuam existindo, e a D2 continua valendo: não é cadastro público.
Motivo: a validação do MVP começa com a escola nascendo numa tela, e as metas de custo (D30,
D39) só se conferem olhando escola por escola; comando no terminal com o token num arquivo não
serve à equipe inteira. Fica numa spec própria, a A0, antes da A1, porque é outra superfície de
segurança, com revisores próprios, e a A1 já estava no teto do PRD. Na revisão da spec, no mesmo
dia, a A0 foi dividida em duas: a **A0**, identidade do operador e a pele da D72, e a **A0b**, o
painel.
