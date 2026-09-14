# Educa.ia — contexto e decisões

> **Antes deste arquivo, leia `docs/visao-produto.md`.** Ele explica o que estamos
> construindo e para quem. Este aqui registra o que já foi decidido e por quê, para não
> rediscutirmos a mesma coisa toda semana.
>
> Nome provisório. Verificar INPI e domínio antes de fixar: já existem "IA Educa Brasil"
> e "Eduka.ai" no mercado. Repositório: https://github.com/LitzGab/Educa.ia

---

## Em uma frase

Um assistente com agentes de IA supervisionados para a escola: o professor tem chat e
ferramentas que produzem a partir do material que a escola pode usar, o aluno usa IA em
sala com o professor vendo, a coordenação organiza a escola e acompanha o uso de IA e o
desempenho de alunos e professores, e a família acompanha. A IA prepara o trabalho e avisa;
a escola aprova (D44).

## O recorte

**Anos finais do Ensino Fundamental (6º ao 9º) e Ensino Médio**, em **escolas particulares
e redes públicas**, começando por Joinville (D43, D20). Em sala, o aluno usa **qualquer
computador da escola** (Chromebook, notebook, laboratório). **Web-first e responsivo**: a
Lei 15.100/2025 tirou o aparelho pessoal da sala, então nada no produto pode depender do
telefone do aluno; mas toda tela funciona também no celular, para o aluno fora da escola e
para professor e coordenação em qualquer lugar (D51).

## Quem constrói

**Joaquim** implementa, com o Claude executando as tarefas do processo SDD e o Joaquim
revisando. **Gabriel** cuida de marca, landing page, benchmark e comercial. Mercado, preço
e concorrência estão em `docs/negocio.md`.

## Quem é quem

| Papel | Usa | Paga | O que precisa |
|---|---|---|---|
| Coordenação | sim | decide a compra | governança de IA e de ensino, alertas, auditoria |
| Professor | sim | não | tempo, e confiança de que nada entra no boletim sem ele |
| Aluno | sim | não | uma IA que ensina em vez de entregar a resposta |
| Família | fase posterior | sim, via mensalidade | nota, entrega, alerta |
| Prefeitura | não diretamente | contrato | governança de rede e resposta pronta sobre LGPD |

A regra que orienta as prioridades: **professor e aluno precisam gostar e usar; coordenação
e família precisam confiar.** Se o professor não gostar, a escola não renova. Se a família
não confiar, a escola não compra.

---

## Decisões tomadas

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
mesmo dia. Condições legais da ingestão em `docs/regulacao.md` seção 4.
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

---

## Conflitos já resolvidos

Registrados porque cada um deles já voltou uma vez.

**Login do aluno.** A reivindicação de nome é o *cadastro*. O *login* recorrente é escola +
matrícula + senha, definida pelo aluno no momento da reivindicação. Aluno não tem e-mail no
sistema. Onde a escola tem conta Google ou Microsoft, o login e a importação vêm dela, e
guardamos só o identificador da conta, nunca o e-mail (D48).

**Notificação à família.** O motor de eventos entra agora; a interface do responsável e o
WhatsApp ficam para depois.

**Importação por planilha.** Sobrevive, reduzida: a coordenação sobe lista de nomes por
turma, grade horária e calendário, não cadastro completo de pessoa (D3 revista). Professor
e aluno entram por link.

**Scraper de material.** Permitido, com cinco condições: licença ou parceria com o dono do
conteúdo, autorização escrita da escola registrada no sistema, credencial fornecida pela
escola, conteúdo preso ao tenant dela, e nada que contorne pagamento ou bloqueio técnico de
terceiro. Fonte que proíbe sai, e **o upload não cobre o caso**: apostila de terceiro sem
licença não entra por nenhum caminho (D5 revista). O primeiro caminho implementado é o
upload de material com licença (D22).

**Correção de discursiva e redação.** A IA não propõe nota nelas enquanto o texto final do
CNE não for publicado e lido; entrega só devolutiva (D46).

**Tutor e aprovação prévia.** O tutor é supervisionado, não aprovado resposta por resposta.
A regra 70, item 3, declara essa exceção (D47).

**Fila de jobs.** A auditoria de 13/09/2026 propôs trocar por fila só no Postgres. Ficou
como está, com entrega pelo menos uma vez e idempotência obrigatória (D49).

**Processo de construção.** A mesma auditoria propôs teto de tamanho por tarefa, assinatura
humana no portão e revisor de simplicidade. O processo fica como está: nove revisores,
vetos e o ritmo atual, com o portão de qualidade no processo (D23).

**Nome dos agentes.** O desenho da call tinha nomes próprios; os docs usam função. Fica a
função (D17).

**Escola particular ou rede pública.** As duas, como alvo juntas desde o início, com a rede
em pacote com piso de preço (D20 e D41 revistas).

**Chromebook.** Deixou de ser filtro de mercado: vale qualquer computador da escola. Continua
como referência de máquina fraca para desempenho (D43, regra 50).

**Celular.** O produto não depende do celular em nenhum fluxo, mas toda tela funciona nele
(D51). "Sem dependência de celular" e "responsivo para celular" não se contradizem: o
primeiro é sobre o que o fluxo exige, o segundo sobre onde a tela funciona.

---

## Decisões em aberto

Use `/descobrir <tema>` para fechar uma, e `/registrar-decisao` para escrevê-la.

Todas têm dono e momento. Nenhuma trava o F0.

| Decisão | Dono | Quando fecha |
|---|---|---|
| Provedor de modelo principal e reserva | Joaquim | avaliação de `docs/avaliacao-de-modelos.md`, antes de a F5 ficar pronta (D37) |
| Provedor de hospedagem | Joaquim | quando o staging for criado, antes da primeira demonstração externa ou do piloto (D42) |
| Identidade visual (paleta, tipografia, logo) | Gabriel | **antes do PRD do F2**, a primeira tela real |
| Nome, INPI e domínio | Gabriel | antes do material de venda e do piloto |
| Sistemas de ensino das escolas-alvo, licença do material e primeiro adaptador | quem conduzir o piloto | nas entrevistas com escolas; até lá só upload de material com licença (D5, D22) |
| Quais funcionalidades formam a fatia do piloto, e quais das quatro coisas da D24 ele precisa ter | Joaquim e Gabriel | antes do PRD da primeira funcionalidade depois do F1 (D1 revista) |
| Valores das faixas de preço e teto de IA do pacote base | Gabriel e Joaquim | com a planilha de custo por pacote, validados no piloto (D50, D39) |
| Indicadores de desempenho do professor e do aluno (quais, limiar, texto do alerta) | Joaquim e Gabriel | antes do PRD do F12 (D45, D46) |
| Texto final das diretrizes do CNE e o que muda na correção e nos sinais do tutor | Joaquim, com advogado | quando a resolução for publicada pelo MEC (D46) |

---

## Stack

**Backend** NestJS + TypeScript, Postgres, Drizzle, BullMQ + Redis, JWT próprio, storage
S3-compatível. **Frontend** React + Vite + TypeScript, TanStack Query, Tailwind, web-first
e responsivo, do computador fraco de escola (Chromebook como referência) ao celular (D51). **Tempo real** WebSocket para o modo sala. **IA** interface `LLMProvider`
com adaptadores Ollama e OpenAI-compatível. **Testes** Vitest e Playwright. **Infra**
Docker Compose.

O critério que guiou tudo isso: nada pode impedir que o sistema inteiro suba em um servidor
no Brasil, se um contrato exigir.

---

## As seis regras que não se negociam

1. **Vazamento entre escolas encerra a empresa.** Escopo de tenant no repository, sempre.
   Regra 10.
2. **Dado de menor é o ativo mais perigoso do sistema.** Leia `docs/lgpd.md` antes de tocar
   em qualquer campo de pessoa. Regra 20.
3. **Nada que a IA produz vira nota, mensagem à família ou decisão sobre aluno sem aprovação
   humana registrada.** É lei. Regra 70.
4. **Nenhum módulo chama provedor de IA direto.** Sempre pela porta, sempre com perfil e
   orçamento. Regra 30.
5. **Teste prova regra de negócio.** "Retornou 200" não é teste. Regra 40.
6. **O horário de aula é sagrado.** Dimensione para a manhã de segunda, limite por usuário
   e por escola (nunca só por IP), e nenhuma resposta de prova se perde. Regra 80.

---

## Mapa dos documentos

**Para entender o produto:** `docs/visao-produto.md`, `docs/fluxos.md`, `docs/glossario.md`
**Para entender a interface:** `docs/interface.md`
**Para entender o negócio:** `docs/negocio.md` (mercado, preço, concorrência). Não é leitura
obrigatória para implementar
**Para não quebrar a lei:** `docs/lgpd.md`, `docs/regulacao.md`
**Para construir:** `docs/arquitetura.md`, `docs/modelo-de-dados.md`, `docs/agentes.md`,
`docs/ingestao.md`
**Para não cair no horário de aula:** `docs/infra.md`, `docs/runbook.md`
**Para escolher modelo e medir custo de IA:** `docs/avaliacao-de-modelos.md`
**Para trabalhar:** `README.md`, `ROADMAP.md`, `TODO.md`, `.claude/rules/`, `.claude/skills/`

---

## Skills

**Do processo** (nossas, em `.claude/skills/`): `/status`, `/descobrir`,
`/registrar-decisao`, `/criar-prd`, `/criar-techspec`, `/criar-tasks`, `/executar-tasks`,
`/executar-task`, `/executar-review`, `/validar`.

**Técnicas** (de terceiros, instaladas via skills.sh, versões em `skills-lock.json`):
`nestjs-best-practices`, `drizzle-orm-patterns`, `supabase-postgres-best-practices`,
`bullmq-specialist`, `vercel-react-best-practices`, `tanstack-query-best-practices`,
`tailwind-design-system`, `frontend-design`, `accessibility`, `vitest`,
`playwright-best-practices`, `lgpd-brasil`. Atualizar com `npx skills update -p`, e ler o
diff antes de commitar: skill vira instrução para o Claude.

<critical>As skills de terceiros são referência técnica genérica. Quando conflitam com
`.claude/rules/` ou com uma decisão deste arquivo, a regra e a decisão vencem. Os conflitos
já conhecidos:</critical>

- **Escopo de tenant.** `supabase-postgres-best-practices` recomenda RLS. Aqui o escopo é
  aplicado no repository, a partir do token (regra 10). RLS pode entrar como segunda camada
  de defesa, nunca no lugar do repository
- **React.** `vercel-react-best-practices` é escrita para Next.js. Somos SPA com Vite: ignore
  Server Components, Server Actions e tudo que depende de servidor Next. As regras de bundle,
  re-render e carregamento valem, e valem ainda mais no Chromebook fraco (regra 50)
- **Visual.** `frontend-design` pede ousadia estética. Aqui o limite é Chromebook fraco,
  acessibilidade e a professora com quarenta minutos de intervalo (regra 50). Fonte pesada,
  animação e efeito que custam CPU ficam de fora. A identidade visual ainda está em aberto
- **Playwright.** Viewport de celular, toque e rede móvel **se aplicam** (D51): toda tela
  roda nos projetos `chromebook` e `celular`. Geolocalização, permissões de aparelho, PWA
  instalável e app nativo não se aplicam (regra 50, item 2)
- **LGPD.** `lgpd-brasil` resume a lei. O que vale para o código é `docs/lgpd.md` e a regra
  20, que são mais restritivos (aluno sem e-mail, sem CPF, sem foto)
- **NestJS.** A organização em controller, service, repository e DTO de `docs/arquitetura.md`
  prevalece sobre qualquer outra estrutura sugerida
