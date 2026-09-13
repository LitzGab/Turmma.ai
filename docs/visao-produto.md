# Visão do produto

> Este é o documento de contexto. Se você está chegando agora, ou é um subagente com
> contexto limpo, leia isto antes de qualquer outro arquivo. Sem entender o produto,
> as regras técnicas parecem arbitrárias.

---

## 1. A situação hoje, numa escola de verdade

Camila dá aula de Química para seis turmas de Ensino Médio em um colégio particular.
A semana dela é mais ou menos assim:

Domingo à noite ela monta a prova do 2ºB. Abre o ChatGPT, cola o conteúdo do capítulo,
pede dez questões. O que volta é razoável, mas genérico: não segue o livro que a escola
adotou, usa uma notação diferente da apostila, e duas questões cobram coisa que ela ainda
não deu. Ela reescreve metade. Isso leva duas horas.

Quinta-feira ela aplica a prova. Sexta e sábado ela corrige 32 provas à mão. Lança as notas
numa planilha, depois redigita tudo no sistema de gestão da escola, porque são dois sistemas
que não conversam. Isso leva mais três horas.

Segunda-feira uma mãe manda mensagem no WhatsApp perguntando como está o filho. Camila
responde do celular, no intervalo, de memória.

Enquanto isso, os alunos dela usam IA também. Metade da turma faz a lista de exercícios com
ChatGPT em dois minutos, cola a resposta, e não aprende nada. Camila sabe disso e não tem o
que fazer. A escola não tem política nenhuma sobre isso.

A coordenadora, Renata, também não tem. Ela suspeita que um professor está fazendo prova
fácil demais porque a média da turma dele é sempre 9. Não tem como provar. E quando um pai
pergunta na reunião se a escola usa inteligência artificial, ela não sabe responder direito,
porque cada professor usa a sua por conta própria, sem registro de nada.

**É esse o problema. Não é "falta uma ferramenta de gerar prova".**

---

## 2. O que o Educa.ia faz

Quatro coisas, nessa ordem de importância:

**Devolve tempo ao professor.** Prova, atividade, plano de aula, correção e devolutiva
saem do material que a escola já usa. Não é IA genérica: é IA que leu a apostila do 2º ano
e sabe que o capítulo 7 vai da página 148 à 161.

**Dá ao aluno uma IA que ensina em vez de entregar.** O tutor conduz por perguntas, não
responde a lista por ele, e fica restrito ao conteúdo da turma. O professor vê quem usou,
quanto, e em quê.

**Dá governança à escola.** A coordenação vê o que a IA gerou, quem aprovou, quanto está
sendo usado, e onde o ensino está indo mal. Hoje isso não existe em lugar nenhum do mercado.

**Mantém a família informada** com dado que já está no sistema, sem ninguém digitar nada.
Essa parte fica para uma fase posterior, mas o motor que a alimenta é construído agora.

---

## 3. O que torna isso diferente de tudo que já existe

Existem dezenas de ferramentas de IA para professor no Brasil. Ensinei, Teachy, GeraProva,
PlanoEdu, Educa AI, e outras. Todas fazem plano de aula e prova, e custam entre R$ 10 e
R$ 40 por mês por professor. Vender "mais um gerador de prova" por dez vezes o preço delas
não fecha negócio.

Três coisas nos separam:

**Agente, não assistente.** Todas as ferramentas do mercado esperam o professor clicar.
O nosso sistema tem agentes que trabalham sozinhos e avisam depois: "corrigi as 32 provas
do 2ºB, média 6,4, onze alunos erraram a questão 7". A diferença entre uma ferramenta e um
estagiário produtivo é essa, e ninguém no Brasil vende a segunda.

**Loop institucional fechado.** O professor cria, o aluno responde, o agente corrige, o
professor aprova, o coordenador vê o agregado, a família recebe. Cada player do mercado
cobre um pedaço. Nenhum cobre o caminho inteiro.

**Governança de IA.** O CNE aprovou em setembro de 2026 diretrizes que exigem supervisão
humana em correção e atribuição de nota, e proíbem decisão autônoma sobre aprovação de
aluno. Toda escola tem doze meses para se adequar. Só 22% das escolas brasileiras têm
qualquer política de uso de IA. Nós entregamos a resposta pronta para essa exigência, e
isso vira argumento de venda, não só obrigação.

---

## 4. Quem são as pessoas

**Camila, professora.** Não é técnica. Tem quarenta minutos de intervalo. Vai abrir o
sistema no notebook, entre uma aula e outra. Se ela precisar aprender a "conversar com o
chat", ela desiste — por isso as ferramentas existem em formato de formulário também. Se
uma nota entrar no boletim sem ela conferir, ela nunca mais confia no sistema. Ela não paga
nada, mas se ela não gostar, a escola não renova.

**Enzo, aluno do 1ºC.** Usa Chromebook em sala, porque a Lei 15.100/2025 tirou o celular da
escola. Ele vai tentar arrancar a resposta pronta do tutor, de várias formas. Isso é
esperado, não é falha. O produto precisa segurar.

**Renata, coordenadora.** É quem decide a compra e quem administra o sistema. Ela cria as
turmas, sobe a lista de alunos, convida os professores. Se esse trabalho for penoso, o
sistema morre na primeira semana, antes de qualquer funcionalidade bonita ser usada. Ela
precisa poder responder a um pai, em reunião, o que a IA faz na escola dela.

**A família.** Paga, via mensalidade, mesmo sem saber. Precisa perceber valor para aceitar
os R$ 30 a mais. Entra numa fase posterior.

**A prefeitura**, no caso da rede pública, compra por contrato e vai perguntar sobre LGPD
na primeira reunião.

---

## 5. Um dia dentro do sistema

7h00 — O agente **Rotina** abre a manhã da Camila: três aulas hoje, a prova do 2ºB às 10h,
catorze tarefas esperando correção. Ela não configurou nada disso: veio da grade horária
que a Renata montou e das avaliações que a própria Camila criou.

7h40 — Ela pede no chat: "monta uma revisão de trinta minutos sobre reagente limitante para
o 2ºB". O sistema busca no capítulo 7 da apostila da escola, monta, e salva na biblioteca
dela. A saída cita a página de origem, para ela conferir.

10h00 — A prova é aplicada. Alguns alunos respondem no Chromebook. Como a turma do 3ºA fará
em papel, a Camila escolheu outro modo para aquela avaliação.

10h50 — O agente **Corretor** corrige as objetivas sozinho e propõe as notas. **Ele não
lança nada.** Manda a entrega para o feed: "esperando você aprovar".

11h15 — Camila revisa, discorda de duas correções de discursiva, ajusta, aprova. Só nesse
momento a nota existe. É lei, e é também o que faz ela confiar.

11h16 — O evento "nota aprovada" dispara. Vai para o painel da Renata e, na fase posterior,
para a família.

14h00 — Na aula seguinte, Enzo pergunta ao tutor qual é o reagente limitante do exercício
14. O tutor recusa e conduz por perguntas. Camila, na tela dela, vê que oito alunos
travaram no mesmo ponto.

Fim do dia — Renata abre a governança: 39 professores ativos, 1.284 itens gerados por IA,
100% das notas aprovadas por humano, 61% do orçamento de IA do mês. E um alerta: a média do
2ºA em Biologia está em 9,4 enquanto as outras turmas estão em 6,8.

---

## 6. As cinco ideias estruturais

Tudo no sistema deriva destas cinco. Quando uma decisão técnica parecer arbitrária, é
porque ela está sustentando uma delas.

**A escola é o dono do dado, e cada escola é um mundo fechado.** Multi-tenant não é detalhe
de arquitetura, é o produto. Uma escola nunca pode ver nada de outra. Se isso vazar uma vez,
acabou — o comprador aqui é um coordenador que precisa confiar em nós para entregar a lista
de alunos menores de idade dele.

**Ninguém se cadastra sozinho.** A coordenação cria as turmas e sobe a lista de nomes. O
professor entra por link e escolhe a disciplina. O aluno entra pelo link da sala, reivindica
o próprio nome e o professor aprova. Isso resolve dois problemas ao mesmo tempo: a escola
inteira entra em um dia, e ninguém se passa por outro.

**O contexto vem da instituição, não do usuário.** O sistema sabe que a Camila dá Química
para o 2ºB porque a escola informou, não porque ela contou no chat. É daí que vem tudo que
faz um agente parecer um funcionário e não um chatbot.

**A IA propõe, o humano decide.** Nota, mensagem à família e qualquer decisão sobre o aluno
passam por aprovação registrada. Isso é exigência do CNE, mas seria a decisão certa mesmo
sem lei: é o que separa "confio nisso" de "não deixo isso perto do meu boletim".

**A saída da IA nasce do material da escola e aponta de onde veio.** Se a questão não pode
ser conferida na página 152 da apostila, ela é indistinguível do que o professor consegue
de graça no ChatGPT. A rastreabilidade é o produto.

---

## 7. O que este produto não é

- Não é um sistema de gestão escolar. Não substitui TOTVS, Sponte ou similar. Integra, um dia.
- Não é um chat genérico com tema de escola.
- Não é uma ferramenta avulsa vendida a professor. O cliente é a instituição.
- Não decide nada sobre a vida escolar do aluno. Não aprova, não reprova, não encaminha.
- Não é aplicativo de celular. É web, em Chromebook de sala.

---

## 8. Onde isso pode dar errado

Vale ter claro desde já, porque cada item vira decisão técnica em algum ponto:

**A cola.** Se a escola descobrir que o nosso tutor faz a tarefa pelo aluno antes de termos
resposta, o contrato cai. Por isso a política de tutor é por turma, aplicada no servidor,
com registro visível ao professor.

**O vazamento.** É assim que SaaS de educação morre. Ver `docs/lgpd.md`, que é o documento
mais importante do repositório.

**A desconfiança do professor.** Uma nota errada que entrou sozinha custa mais que dez
funcionalidades boas.

**O custo de IA.** O tutor gasta muito mais token que geração de prova. Se não medirmos
desde a primeira chamada, a margem do R$ 30 por aluno some sem ninguém perceber.

**O onboarding.** Se a Renata precisar cadastrar 900 alunos na mão, ela abandona antes de
ver qualquer valor.
