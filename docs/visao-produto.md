# Visão do produto

> Este é o documento de contexto. Se você está chegando agora, ou é um subagente com
> contexto limpo, leia isto antes de qualquer outro arquivo. Sem entender o produto,
> as regras técnicas parecem arbitrárias.

---

## 1. A situação hoje, numa escola de verdade

Camila dá aula de Química para seis turmas de Ensino Médio em um colégio particular, e de
Ciências para duas turmas do 9º ano. A semana dela é mais ou menos assim:

Domingo à noite ela monta a prova do 2ºB e o plano das aulas da semana. Abre o ChatGPT,
cola o conteúdo do capítulo, pede dez questões. O que volta é razoável, mas genérico: não
segue o material que a escola usa, usa uma notação diferente, e duas questões cobram coisa
que ela ainda não deu. Ela reescreve metade. Isso leva duas horas.

Quinta-feira ela aplica a prova. Sexta e sábado ela corrige 32 provas à mão. Lança as notas
numa planilha, depois redigita tudo no sistema de gestão da escola, porque são dois sistemas
que não conversam. Isso leva mais três horas.

Segunda-feira uma mãe manda mensagem no WhatsApp perguntando como está o filho. Camila
responde do celular, no intervalo, de memória.

Enquanto isso, os alunos dela usam IA também. Metade da turma faz a lista de exercícios com
ChatGPT em dois minutos, cola a resposta, e não aprende nada. Camila sabe disso e não tem o
que fazer. A escola não tem política nenhuma sobre isso.

A coordenadora, Renata, também não tem. Ela não sabe em que habilidade cada série está indo
mal até sair o resultado do bimestre. Suspeita que as provas de uma disciplina estão fáceis
demais, porque a média é sempre 9, e não tem como olhar isso sem parecer que está fiscalizando
um colega. E quando um pai pergunta na reunião se a escola usa inteligência artificial, ela
não sabe responder direito, porque cada professor usa a sua por conta própria, sem registro
de nada.

**É esse o problema. Não é "falta uma ferramenta de gerar prova".**

---

## 2. O que o Educa.ia faz

Um assistente com agentes de IA supervisionados para a escola inteira. A IA prepara o
trabalho e avisa; a escola aprova (D44). Quatro coisas, que vendem juntas (D1):

**Devolve tempo ao professor.** Planejamento, prova, atividade, correção e devolutiva saem
do material que a escola pode usar. Não é IA genérica: é IA que leu o material do 2º ano e
sabe que o capítulo 7 vai da página 148 à 161.

**Dá ao aluno uma IA que ensina em vez de entregar.** O tutor conduz por perguntas, não
responde a lista por ele, e fica restrito ao conteúdo da turma. O professor vê quem usou,
quanto, e em quê.

**Organiza a escola e mostra onde o ensino está indo bem ou mal.** A grade, o calendário e
os vínculos entram de uma vez, e o dia de cada professor sai deles. O desempenho de aluno e
turma aparece por habilidade, e o de cada professor aparece primeiro para ele mesmo (D45). A
coordenação vê o que a IA gerou, quem aprovou, quanto está sendo usado, e onde agir.

**Mantém a família informada** com dado que já está no sistema, sem ninguém digitar nada.
Essa parte fica para uma fase posterior, mas o motor que a alimenta é construído agora.

---

## 3. O que torna isso diferente do que já existe

Existem dezenas de ferramentas de IA para professor no Brasil. Teachy, Profy, GeraProva,
PlanoEdu e outras fazem plano de aula e prova por R$ 10 a R$ 40 por mês por professor. O
Google já dá de graça, dentro do Classroom, ferramentas de professor e um tutor ligado ao
material da turma. Os grandes sistemas de ensino (Arco, Somos, Bernoulli, FTD) oferecem IA
junto com o material que vendem. Gerar plano e prova virou commodity (`docs/negocio.md`).

O que continua sem dono:

**Governança de IA pronta para o CNE.** O CNE aprovou em setembro de 2026 diretrizes que
exigem supervisão humana em correção e nota e proíbem decisão só automatizada sobre o aluno.
Só 22% das escolas brasileiras têm qualquer política de uso de IA. A tela que responde "o
que a IA gerou, quem aprovou e quando" não existe no mercado. Isso é argumento de venda, não
só obrigação.

**Agentes que preparam e avisam, com a escola no comando.** As ferramentas do mercado
esperam o professor clicar. Os nossos agentes preparam o trabalho quando o evento acontece e
avisam: "a atividade do 2ºB está corrigida, onze alunos erraram a questão 7, a devolutiva
está esperando você". Tudo que vale passa por aprovação ou supervisão, e isso é parte da
promessa, não uma limitação dela.

**Loop institucional fechado, sem vigiar ninguém.** O professor cria, o aluno responde, o
agente corrige, o professor aprova, a coordenação vê o agregado, a família recebe. Cada
player do mercado cobre um pedaço. Medir aluno e professor sem virar vigilância é o que
permite a escola usar esse dado.

**Neutro em relação ao material.** Não vendemos apostila. Trabalhamos com o material que a
escola pode usar, citando a página, e com parceria quando o dono do conteúdo aceita (D5).

---

## 4. Quem são as pessoas

**Camila, professora.** Não é técnica. Tem quarenta minutos de intervalo. Vai abrir o
sistema no notebook, entre uma aula e outra. Se ela precisar aprender a "conversar com o
chat", ela desiste — por isso as ferramentas existem em formato de formulário também. Se
uma nota entrar no boletim sem ela conferir, ela nunca mais confia no sistema. Se ela
achar que o sistema existe para a coordenação vigiá-la, ela não usa: por isso o painel dela
é dela primeiro. Ela não paga nada, mas se ela não gostar, a escola não renova.

**Enzo, aluno do 1ºC.** Usa o Chromebook ou o notebook da escola em sala, porque a Lei
15.100/2025 tirou o aparelho pessoal da sala de aula. Em casa, se a escola ligou o modo casa
para a turma dele, abre o tutor no celular. Ele vai tentar arrancar a resposta
pronta do tutor, de várias formas. Isso é esperado, não é falha. O produto precisa segurar.

**Lara, aluna do 8º ano.** Tem 13 anos. Tudo que vale para o Enzo vale para ela, com mais
cuidado: a linguagem do tutor, o que ela vê de si mesma e o que é guardado sobre ela.

**Renata, coordenadora.** É quem decide a compra e quem administra o sistema. Ela cria as
turmas, importa a lista de alunos, a grade e o calendário, e define quem dá aula em qual
turma. Se esse trabalho for penoso, o sistema morre na primeira semana, antes de qualquer
funcionalidade bonita ser usada. Ela precisa poder responder a um pai, em reunião, o que a
IA faz na escola dela.

**A família.** Paga, via mensalidade, na escola particular. Precisa perceber valor.
Entra numa fase posterior.

**A rede pública**, prefeitura ou estado, compra por contrato, com pacote e preço próprios
(D41), e vai perguntar sobre LGPD e sobre onde o dado fica na primeira reunião.

---

## 5. Um dia dentro do sistema

7h00 — O agente **Rotina** abre a manhã da Camila: três aulas hoje, a prova do 2ºB às 10h,
catorze atividades esperando devolutiva. Ela não configurou nada disso: veio da grade
horária que a Renata importou e das avaliações que a própria Camila criou.

7h40 — Ela pede no chat: "monta uma revisão de trinta minutos sobre reagente limitante para
o 2ºB". O sistema busca no capítulo 7 do material da escola, monta, e salva na biblioteca
dela. A saída cita a página de origem, para ela conferir.

10h00 — A prova é aplicada. Alguns alunos respondem no computador da escola. Como a turma
do 3ºA fará em papel, a Camila escolheu outro modo para aquela avaliação.

10h50 — O agente **Corretor** corrige as objetivas, escreve a devolutiva das discursivas e
monta o diagnóstico por habilidade. **Ele não lança nada, e não sugere nota para as
discursivas** (D46). Manda a entrega para o feed: "esperando você".

11h15 — Camila revisa as correções das objetivas, ajusta duas devolutivas, dá ela mesma a
nota das discursivas e aprova. Só nesse momento a nota existe. É lei, e é também o que faz
ela confiar.

11h16 — O evento "nota aprovada" dispara. Vai para o painel da Renata e, na fase posterior,
para a família.

14h00 — Na aula seguinte, Enzo pergunta ao tutor qual é o reagente limitante do exercício
14. O tutor recusa e conduz por perguntas. Camila, na tela dela, vê que oito alunos
travaram no mesmo ponto.

Fim do dia — Camila abre o próprio painel: a turma dela do 2ºB está abaixo das outras em
estequiometria, e a sugestão é uma revisão. Renata abre a governança: 39 professores
ativos, 1.284 itens gerados por IA, todos com o registro de quem aprovou, e o consumo de IA
do mês. E um alerta em agregado: o 2º ano em Biologia está com média muito acima das outras
disciplinas da série. Se ela abrir o detalhe por turma, esse acesso fica registrado (D45).

---

## 6. As cinco ideias estruturais

Tudo no sistema deriva destas cinco. Quando uma decisão técnica parecer arbitrária, é
porque ela está sustentando uma delas.

**A escola é o dono do dado, e cada escola é um mundo fechado.** Multi-tenant não é detalhe
de arquitetura, é o produto. Uma escola nunca pode ver nada de outra. Se isso vazar uma vez,
acabou — o comprador aqui é um coordenador que precisa confiar em nós para entregar a lista
de alunos menores de idade dele.

**Ninguém se cadastra sozinho.** A coordenação cria as turmas e importa a lista de nomes, a
grade e o calendário, e define quem dá aula onde. O professor entra por link e confirma o
vínculo. O aluno entra pela conta da escola, quando ela existe, ou pelo link da sala,
reivindicando o próprio nome com aprovação do professor (D3, D48). A escola inteira entra em
um dia, e ninguém se passa por outro.

**O contexto vem da instituição, não do usuário.** O sistema sabe que a Camila dá Química
para o 2ºB porque a escola informou, não porque ela contou no chat. É daí que vem tudo que
faz um agente parecer um funcionário e não um chatbot.

**A IA propõe, o humano decide.** Nota, mensagem à família e qualquer decisão sobre o aluno
passam por aprovação registrada; o tutor, que responde em tempo real, é supervisionado
(D47). Nenhuma métrica decide nada sobre o professor (D45). Isso é exigência do CNE, mas
seria a decisão certa mesmo sem lei: é o que separa "confio nisso" de "não deixo isso perto
do meu boletim".

**A saída da IA nasce do material que a escola pode usar e aponta de onde veio.** Se a
questão não pode ser conferida na página 152 do material, ela é indistinguível do que o
professor consegue de graça no ChatGPT. A rastreabilidade é o produto, e só vale com
material licenciado (D5).

---

## 7. O que este produto não é

- Não é um sistema de gestão escolar. Não substitui TOTVS, Sponte ou similar. Integra, um dia.
- Não é um chat genérico com tema de escola.
- Não é uma ferramenta avulsa vendida a professor. O cliente é a instituição.
- Não decide nada sobre a vida escolar do aluno. Não aprova, não reprova, não encaminha.
- Não é ferramenta de avaliação funcional do professor. Não ranqueia, não pune, não
  recomenda dispensa.
- Não é aplicativo nativo. É uma web só, que funciona no computador da escola e, fora da
  sala, no celular (D51). Nenhum fluxo exige o celular.
- Não é para educação infantil nem anos iniciais (regra 70).

---

## 8. Onde isso pode dar errado

Vale ter claro desde já, porque cada item vira decisão técnica em algum ponto:

**A cola.** Se a escola descobrir que o nosso tutor faz a tarefa pelo aluno antes de termos
resposta, o contrato cai. Por isso a política de tutor é por turma, aplicada no servidor,
com registro visível ao professor.

**O vazamento.** É assim que SaaS de educação morre. Ver `docs/lgpd.md`, que é o documento
mais importante do repositório.

**A desconfiança do professor.** Uma nota errada que entrou sozinha custa mais que dez
funcionalidades boas. Um painel que parece vigilância custa o mesmo.

**O grátis.** O Google e os sistemas de ensino já dão de graça boa parte do que fazemos. Se
a governança, o diagnóstico e a organização da escola não forem claramente melhores, o
preço não se defende.

**O material.** Sem licença do dono do conteúdo, a página citada não existe para aquela
escola. Material com licença e parceria vêm antes de qualquer adaptador (D5, D22).

**O custo de IA.** O tutor gasta muito mais token que geração de prova. Se não medirmos
desde a primeira chamada, a margem some sem ninguém perceber.

**O onboarding.** Se a Renata precisar cadastrar 900 alunos e a grade na mão, ela abandona
antes de ver qualquer valor.

**Construir sem ninguém usar.** O sistema inteiro é o alvo, mas uma escola piloto usa o que
estiver pronto antes do fim (D1).
