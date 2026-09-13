# Glossário

O vocabulário do domínio escolar brasileiro, que usamos no código, no banco e na interface.

A razão de existir este arquivo: metade dos bugs de domínio nasce de duas pessoas chamando
a mesma coisa por nomes diferentes. Quando um módulo diz `class` e outro diz `turma`,
ninguém percebe que são a mesma coisa até o comportamento divergir em produção.

**Regra prática:** termo novo entra aqui na mesma tarefa em que aparece no código.

---

## Estrutura da escola

**Rede** — Prefeitura, secretaria, grupo educacional ou mantenedora. Camada opcional acima
da escola. Uma escola particular independente é modelada como rede de uma unidade só, para
não existirem dois fluxos diferentes no código.

**Escola** — A unidade. É o tenant: todo dado pertence a uma escola e nunca cruza para
outra.

**Ano letivo** — O recorte anual. Turma, vínculo e nota pertencem a um ano letivo. Nada no
sistema é perpétuo, porque em janeiro tudo vira.

**Período** — Bimestre, trimestre ou semestre, conforme a escola. Configurável, porque cada
rede faz diferente.

**Série** — 1º, 2º ou 3º ano do Ensino Médio.

**Turma** — O agrupamento concreto de alunos dentro de uma série: 2ºB. Existe dentro de um
ano letivo.

**Disciplina** — A matéria: Química, História.

---

## Pessoas

**Coordenador** — Coordenação ou direção. Decide a compra e administra o sistema na unidade:
cria turmas, sobe listas, convida professores, aprova o que precisa de aprovação
administrativa, e é quem enxerga a governança.

**Professor** — Quem usa mais e quem pode matar o produto. Não paga nada.

**Aluno** — Usa no Chromebook, em sala. Não tem e-mail nem telefone no sistema.

**Responsável** — Pai, mãe ou responsável legal. Tem conta própria, vinculada ao aluno. É o
canal de contato, porque o aluno não é.

**Vínculo** — A ligação de uma pessoa a turma e disciplina, com papel, dentro de um ano
letivo. É o vínculo que responde "esta turma é dele?".

**Matrícula** — O identificador do aluno dentro da escola, e o login dele. Única por escola,
nunca globalmente.

**Lista de nomes** — A lista que a coordenação sobe por turma, antes de os alunos entrarem.
Cada nome tem estado: livre, reivindicado, aprovado.

**Reivindicação** — O ato do aluno de dizer "este nome da lista sou eu", pendente de
aprovação do professor.

**Convite** — Link com token único, validade e uso único. Existe em dois tipos: convite de
professor e link de sala.

---

## Aulas e material

**Grade horária** — A tabela de tempos de aula da escola.

**Tempo de aula** — Um slot: segunda, 3º tempo, 09h20 às 10h10.

**Alocação** — Turma, disciplina e professor em um tempo de aula. É o que gera o calendário
do professor.

**Aula** — A instância concreta de uma alocação numa data, onde o professor registra o que
deu.

**Fonte de material** — De onde o conteúdo vem: um adaptador de scraper ou upload manual.
Toda fonte tem autorização escrita da escola registrada.

**Material** — Apostila, livro ou documento ingerido, com versão.

**Trecho indexado** — O pedaço de material que a busca recupera, com a página de origem.
É o que permite citar "capítulo 7, página 152".

**Habilidade BNCC** — O código curricular usado para classificar material e questão. Tabela
pública, sem dono.

**Banco público** — Questões sem dono, visíveis a todas as escolas, vindas das provas
oficiais do ENEM publicadas pelo INEP. Nunca se mistura com material de escola.

---

## Avaliação

**Avaliação** — Prova, trabalho ou atividade avaliativa. Sempre tem um modo.

**Modo** — Como a avaliação é aplicada e corrigida. Cinco valores: online objetiva, online
discursiva, papel com foto, trabalho de entrega, presencial. O professor escolhe por
avaliação.

**Item** — Uma questão dentro de uma avaliação, com pontuação e ordem.

**Aplicação** — A instância de uma avaliação para um aluno específico.

**Resposta** — O que o aluno respondeu em um item.

**Correção** — A pontuação de uma resposta, com feedback. Pode vir de correção automática,
de IA ou do professor. **É aqui que a IA escreve.**

**Nota** — O valor oficial, que vai para o boletim. Só existe com autor humano. **A IA nunca
escreve aqui.**

**Folha de resposta** — A folha impressa, com código que identifica aluno e avaliação sem
depender de reconhecimento de nome.

---

## IA e agentes

**Agente** — Um especialista de IA com thread própria, nome, escopo e nível de autonomia.
Trabalha sozinho e avisa. Não é um botão nem um prompt salvo. O nome é a função: Corretor,
Planejador, Rotina, Monitor de turma, Tutor, Mensageiro da família.

**Ferramenta** — Um fluxo guiado que produz um artefato: prova, atividade, plano de aula,
adaptação, simulado, redação. Funciona como formulário ou como cartão dentro do chat, com
o mesmo motor nos dois.

**Artefato** — O que uma ferramenta produz e salva na biblioteca, ligado à turma e ao
calendário, citando material e página.

**Feed de agentes** — A seção "Seu time" do professor, onde cada agente é uma thread com
não-lidos. Nunca aparece vazia para professor com turma.

**Entrega** — O que um agente produziu e que aguarda decisão humana. Nasce pendente.

**Nível de autonomia** — O que o agente pode fazer sozinho: executa e registra, executa e
avisa, propõe e espera aprovação, ou nunca faz. Ver `docs/agentes.md`.

**Perfil de IA** — A classe de tarefa que define qual modelo será usado: rápido, padrão,
complexo ou visão.

**Orçamento de IA** — O limite de consumo por aluno e por escola, com aviso antes do corte.

**Tutor** — O agente que conversa com o aluno. Conduz por perguntas e não entrega a
resposta.

**Política de tutor** — A regra da turma sobre o que o tutor pode responder: bloqueado,
socrático ou livre. Definida pelo professor, aplicada no servidor.

**Modo sala** — Aula em andamento, com o professor acompanhando a turma ao vivo.

**Modo casa** — Uso fora da aula, com registro e resumo para o professor, sem tempo real.
Só existe na turma em que a escola ligou o acesso fora da sala. Desligado por padrão.

**Sinal** — O que o professor vê do uso do tutor: quem travou, quem pediu resposta pronta,
qual dúvida se repetiu. É uso e dificuldade, não comportamento.

---

## Outros

**Biblioteca** — O acervo do professor: provas, planos e materiais que ele produziu.

**Evento** — O fato registrado no sistema: nota aprovada, tarefa não entregue, aluno
travado. É o que alimenta notificação e painel.

**Auditoria** — O registro consultável de quem fez o quê: leitura de dado de aluno,
exportação, alteração de nota, aprovação de saída de IA. Diferente de log.

**Titular** — A pessoa a quem o dado pessoal se refere, no vocabulário da LGPD. Quase sempre
um menor de idade, aqui.
