# Fluxos principais

Os sete caminhos que o sistema precisa fazer funcionar de ponta a ponta. Cada um está
narrado do jeito que acontece na escola, com as decisões técnicas que ele obriga.

Use isto para escrever PRD: o fluxo já contém os casos de borda que importam.

---

## Fluxo 1 — A escola inteira entra no sistema

**Como acontece**

Renata, coordenadora, assina o contrato numa terça. Na quarta ela entra no sistema e cria
as séries dos anos finais e do Ensino Médio e as turmas de cada uma: 8ºA, 1ºA, 1ºB, e assim
por diante. Para cada turma, ela sobe uma lista de nomes — a mesma planilha que ela já tem
da secretaria. Depois importa a grade horária e o calendário do ano, e com isso fica
definido quem dá aula de quê em qual turma (D3 revista).

Ela convida os professores por e-mail. Camila recebe o link, clica, entra e **confirma** o
que a escola informou: Química no 2ºB e no 3ºA, Ciências no 9ºA. Se algo estiver errado, ela
avisa a coordenação; ela não se aloca sozinha. Se Camila também dá aula em outra escola
cliente, o mesmo usuário ganha um segundo vínculo, e o seletor de escola separa as duas.

Se a escola usa Google Workspace ou Microsoft, professores e alunos entram com a conta da
escola, e turmas e vínculos podem vir do Classroom (D48). Senão, na primeira aula Camila
projeta o link da sala no quadro. Os alunos abrem no computador da escola, veem a lista de
nomes da turma, e cada um reivindica o seu. Camila olha a tela dela, vê os 31 pedidos,
confere e aprova. Só nesse momento cada aluno vira usuário de verdade, com matrícula e
senha.

**Por que é assim**

Cadastrar 900 alunos um a um mata o produto na primeira semana. Mas deixar o aluno digitar
o próprio nome livremente cria dois "Enzo Martins" e um "Batman". A reivindicação com
aprovação do professor resolve os dois: rápido para a escola, e ninguém se passa por outro.
O vínculo vem da escola, e não do professor, porque é ele que dá acesso a dado de aluno. E
sem a grade o Planejador e o calendário não têm de onde nascer.

**O que isso obriga tecnicamente**

- Convite com token único, validade, uso único e revogação
- Lista de nomes como entidade própria, com estado: livre, reivindicado, aprovado
- Importação tolerante a planilha suja, com erro apontado linha a linha, e reimportação que
  atualiza em vez de duplicar. Vale para lista de nomes, grade e calendário
- Vínculo professor × turma × disciplina criado pela escola e confirmado pelo professor;
  vínculo não confirmado não libera acesso a aluno
- Usuário com vínculo em mais de uma escola, cada vínculo preso ao tenant e ao ano letivo
- Login pela conta da escola como adaptador opcional, guardando só o identificador opaco;
  e-mail e foto do aluno descartados antes de gravar (regra 20)
- Aluno só existe como usuário depois da aprovação ou da importação pela conta da escola
- Reset de senha do aluno pelo coordenador ou pelo professor, já que o aluno não tem e-mail

**Casos de borda que vão acontecer**

Dois alunos com o mesmo nome na mesma turma. Aluno que chega em maio, depois da turma toda
já formada. Aluno transferido de turma no meio do ano. Aluno que reivindica o nome errado e
o professor aprova sem ver. Planilha com a turma escrita de três jeitos diferentes. Grade
com professor que ainda não foi convidado. Professor que discorda da alocação. Turma do
Classroom que não bate com a turma da secretaria.

---

## Fluxo 2 — O material da escola vira base de conhecimento

**Como acontece**

Renata informa qual material a escola pode ceder e autoriza, por escrito, o uso dele: a
apostila própria da escola, o material dos professores, um livro com licença para esse uso.
Se o material é de um sistema de ensino, ele só entra com licença ou parceria com o dono do
conteúdo (D5 revista). Ela sobe os arquivos, ou, quando houver parceria, o sistema ingere
pela fonte. O conteúdo é quebrado em trechos, classificado por série, disciplina, capítulo e
habilidade da BNCC, e indexado.

A partir daí, toda prova, atividade, plano de aula e resposta do tutor nasce desse material,
citando a página de origem.

**Por que é assim**

É o que separa o produto de um ChatGPT com prompt bonito. Uma questão que o professor pode
conferir na página 152 da apostila dele tem valor. Uma questão genérica não tem.

**O que isso obriga tecnicamente**

- Um pipeline único, com duas entradas: adaptador de fonte e upload manual. Se o site da
  fonte mudar, a escola sobe o PDF e continua funcionando no mesmo dia
- Rastreabilidade até a página em cada trecho indexado
- Versionamento: material muda de edição, e a versão usada numa prova precisa ficar registrada
- Autorização escrita da escola registrada por fonte, e licença do dono do conteúdo quando o
  material não é da escola; sem elas, nem o upload nem o adaptador processam
- Conteúdo preso ao tenant da escola. Nunca vira banco nosso, nunca cruza para outra escola
- Ingestão em fila, com estado visível: o que entrou, o que falhou, o que está pendente

**Casos de borda**

PDF escaneado sem camada de texto. Apostila em duas colunas. Fórmula química que a extração
quebra. Material sem numeração de capítulo. Escola que sobe 300 arquivos de uma vez. Escola
que tenta subir a apostila de um sistema de ensino sem licença.

---

## Fluxo 3 — Professor cria uma avaliação

**Como acontece**

Camila abre o chat e pede uma prova de estequiometria para o 2ºB, dez questões, nível médio.
Ou abre a ferramenta e preenche um formulário, se preferir não conversar. O sistema busca no
material da turma, monta, mostra cada questão com a página de origem.

Ela troca duas questões, ajusta o peso de uma, e escolhe **como a prova vai ser aplicada**:
online no computador da escola, em papel para depois corrigir por foto, como trabalho de
entrega, ou presencial com lançamento manual.

A prova fica salva na biblioteca dela e aparece no calendário da turma.

**Por que é assim**

O professor decide a dinâmica, porque a realidade da sala muda: laboratório sem internet,
turma que faz melhor no papel, trabalho em grupo. Um sistema que só aceita prova online
perde metade dos casos reais.

**O que isso obriga tecnicamente**

- Avaliação é um objeto genérico com um **modo**; o modo define a trilha de aplicação e de
  correção, mas o núcleo (questão, item, diagnóstico, nota, boletim) é o mesmo
- Em todos os modos, o resultado termina dentro do sistema: primeiro como diagnóstico por
  habilidade, depois também como nota (D46). Um modo que deixa o resultado de fora quebra o
  painel do coordenador, a medição de desempenho e a notificação da família
- Toda questão gerada guarda de qual material e de qual página veio

---

## Fluxo 4 — O aluno estuda com o tutor, em sala

**Como acontece**

Enzo abre o Tutor — que é um dos agentes do time da escola, e se apresenta como tal. Trava no
exercício 14 e pergunta qual é o reagente limitante. O tutor recusa dar a resposta e pergunta se ele já converteu as massas em mol. Enzo diz que só uma. O tutor
confirma que está certo e indica o próximo passo, citando a página 152.

O Tutor lembra de tudo que o Enzo já fez no sistema — a lista de duas semanas atrás, a prova do
bimestre, as sessões anteriores —, e por isso sabe que ele já tinha travado em conversão de
massa, e que melhorou em balanceamento desde março. Sabe que a turma está no capítulo 7, porque
a Camila informou (D66). Não sabe, nem guarda, nada sobre o jeito do Enzo.

Na tela da Camila, ao vivo, aparece que oito alunos travaram no mesmo ponto e que dois
pediram resposta pronta. É o próprio Tutor que avisa, na thread dele em "Seu time" (D32
revista).

Na semana do trabalho sobre a indústria química, a Camila liga a pesquisa para o 1ºC. Enzo
pergunta onde se usa reagente limitante fora da escola; o Tutor traz duas fontes da lista
aprovada pela escola, pede que ele compare o que cada uma diz, e não escreve o parágrafo por
ele (D68).

**Por que é assim**

O CNE classifica tutor digital como uso que exige cuidados adicionais, permitido **desde que
supervisionado**. O art. 11 do Decreto 12.880/2026 acrescenta quatro obrigações a qualquer IA
conversacional usada por criança e adolescente: transparência sobre o caráter automatizado da
interação — que o produto cumpre por ser vendido e apresentado como time de IA, sem precisar
descaracterizar os agentes (D58) —, prevenção de manipulação comportamental, avaliação de
risco algorítmico e salvaguardas ao desenvolvimento. E do ponto de vista de produto, é a demonstração que ganha a assembleia de
pais: a IA da escola ensina, a IA de fora entrega.

**O que isso obriga tecnicamente**

- Resposta do tutor supervisionada, não aprovada uma a uma (D47)
- O agente se apresenta pela função e **nunca afirma ser humano**; perguntado, diz o que é
  (D58, D65)
- Sem simular vínculo afetivo ou dependência, sem linguagem que crie obrigação de continuar,
  sem recompensa por tempo de uso e sem notificação fora do horário útil (D58, D59)
- Teto diário visível ao aluno como salvaguarda de bem-estar, não como punição (D38, D59)
- AIA do Tutor escrita antes de ele existir, revista a cada troca de modelo (D60)
- Política de tutor por turma: bloqueado, socrático ou livre, definida pelo professor dentro
  do padrão da escola, aplicada **no servidor**
- Trava automática durante avaliação em andamento, independentemente da política
- Escopo de assunto por recuperação do material da turma, com recusa testada e não apenas
  pedida no prompt
- Tempo real por turma no modo sala; registro e resumo no modo casa
- Sinal derivado de evento: o professor vê uso e dificuldade, não uma janela sobre o
  comportamento do aluno
- Conversa do tutor com retenção curta e acesso restrito ao professor da turma
- Memória do Tutor sobre **toda a trajetória** do aluno no sistema — atividades, trabalhos,
  avaliações, práticas e sessões, com resultado e evolução —, mais o contexto estruturado do
  professor e o tipo de adaptação registrada; recuperada por relevância a cada conversa, não
  despejada inteira no prompt. É registro do trabalho: nenhum texto sobre o jeito do aluno,
  e o aluno vê e contesta o que o Tutor sabe do desempenho dele (D66)
- Busca só em fontes aprovadas, com duas chaves (escola libera, professor ativa por turma e
  com prazo), só no modo sala, desligada em avaliação, com teto diário; consulta escrita pelo
  modelo sem texto nem identificador do aluno; resposta rotulada "da web" com o link; o
  professor vê o que foi pesquisado (D68)
- Conteúdo de página da web é dado, nunca instrução: teste adversário com página que tenta
  mandar no Tutor, antes de a busca existir (D68)
- Encaminhamento de assunto delicado que chega também a quem notifica o Conselho Tutelar,
  com acesso ao conteúdo auditado (`docs/regulacao.md` seção 7)

**Casos de borda**

Aluno tentando arrancar a resposta de três formas diferentes, inclusive pedindo que o Tutor
"pesquise e resuma" o trabalho. Aluno perguntando sobre assunto fora da matéria. Fonte aprovada
que saiu do ar ou mudou de conteúdo. Aluno usando o tutor durante a prova. Internet caindo no meio da
aula. Aluno pedindo ajuda sobre algo pessoal e delicado, que precisa de encaminhamento
humano e não de resposta de IA.

---

## Fluxo 5 — Correção, aprovação e devolutiva

**Como acontece**

Terminada a atividade ou a prova, o agente Corretor corrige as objetivas e monta o
diagnóstico por habilidade. Nas discursivas ele **não toca no texto do aluno**: organiza o
lote, confere entrega e prepara a correção cega, sem nota, sem conceito e sem devolutiva
rascunho (D55). Manda uma entrega para o feed da Camila: "corrigi as 32 objetivas, onze alunos
erraram a questão 7, as 32 discursivas estão prontas para você corrigir".

Camila vê a distribuição, abre os casos destacados, escreve ela mesma a devolutiva das
discursivas e aprova. O sistema registra o que apresentou, o que ela abriu e quem confirmou
(D56). O aluno vê a devolutiva, e o diagnóstico sobe para o painel dela e, em agregado, para
o da coordenação.

Quando a nota oficial estiver no sistema, o mesmo fluxo continua: Camila dá a nota das
discursivas, confere as objetivas, e aprova o lote com o registro da validação. Nesse instante
a nota passa a existir e o evento sobe para o painel da coordenação.

**Por que é assim**

Correção de objetiva e atribuição de nota são alto risco pelo CNE e exigem validação humana
**efetiva, prévia, qualificada e documentada** — com a frase explícita de que o professor não
pode apenas clicar em "aprovar". Em redação e discursiva a IA não corrige, não avalia, não dá
nota nem conceito e **não pré-corrige para o professor** (D55). Decisão só automatizada sobre
promoção do aluno é proibida. Além da lei: professor não assina embaixo de nota que não
conferiu. E o diagnóstico formativo vem primeiro porque tem menos risco e é o que alimenta a
medição de desempenho.

**O que isso obriga tecnicamente**

- `Correcao` e `Nota` são entidades separadas. A IA escreve na primeira, nunca na segunda
- `Nota` só é gravada com autor humano, em **todo** caminho: interface, job, importação, seed
- Discursiva e redação **sem correção, sem nota, sem conceito e sem devolutiva gerada por IA**,
  em nenhum campo, nem interno, nem rascunho, nem log, até a regra 70 mudar (D55)
- Aprovação qualificada e **documentada**: o lote mostra resumo e destaques antes de liberar
  (D33) e grava o registro da validação — o que foi mostrado, o que foi aberto, quem confirmou
  e quando (D56)
- Entrega de agente nasce pendente, com aprovar e rejeitar com justificativa
- Auditoria responde "o que a IA gerou, quem aprovou, quando"
- A justificativa da correção precisa ser boa o bastante para o professor defender a nota
  diante de um pai

---

## Fluxo 6 — A coordenação governa

**Como acontece**

Renata abre o painel e vê quantos professores estão usando, quanto de IA foi gerado, que
tudo o que chegou aos alunos tem registro de quem aprovou, e o consumo de IA do mês.

Dois alertas em agregado esperam por ela: o 2º ano em Biologia está com média muito acima
das outras disciplinas da série, e o 1º ano caiu em Matemática em duas avaliações seguidas,
concentrado em funções do primeiro grau. Cada alerta vem como hipótese, com a distribuição
e a dificuldade dos itens. Se ela abrir o detalhe por turma, o acesso fica em auditoria.

Camila, no mesmo dia, abre o próprio painel: vê o uso dela, o desempenho das turmas dela por
habilidade e a comparação com a série, antes de qualquer conversa com a coordenação (D45).

**Por que é assim**

É a tela que decide a renovação do contrato, e é a que nenhum concorrente tem. A escola
precisa poder responder, em reunião de pais, o que a IA faz ali dentro. E o professor
precisa saber que o painel é dele primeiro, ou ele não usa o sistema.

**O que isso obriga tecnicamente**

- Agregação por turma, disciplina, série e habilidade
- Indicador do professor visível primeiro a ele; coordenação vê agregado e abre o nominal
  com auditoria; sem ranking de professor e sem ligação com decisão sobre ele (regra 70,
  item 8)
- Detecção de anomalia com limiar configurável, formulada como hipótese com contexto
- Auditoria consultável de saída de IA e de aprovação
- Nível de autonomia de cada agente exposto em linguagem comum
- Consumo de tokens por escola e por perfil
- Leitura de dado de aluno pela coordenação registrada em auditoria

---

## Fluxo 7 — O agente executa e avisa

**Como acontece**

O Planejador roda de madrugada, cruza as entregas com os prazos, e de manhã abre o dia da
Camila: três aulas, a prova do 2ºB às 10h, e cinco alunos do 1ºC que não entregaram a lista,
quatro deles também sem a anterior. Não gerou conteúdo nenhum para isso. Na fase posterior, o
Mensageiro da família propõe o aviso às famílias, que fica esperando aprovação.

**Por que é assim**

Toda ferramenta do mercado espera o clique; a nossa prepara o trabalho e puxa a conversa, e
a escola aprova o que vale (D44).

**O que isso obriga tecnicamente**

- Runtime de agente em fila, nunca dentro de request
- Idempotência: a fila entrega pelo menos uma vez, e rodar duas vezes não duplica aviso nem
  chamada de IA (D49)
- Limite de passos e de custo por execução. Agente que não sabe parar queima a margem
- Estado explícito: executado, aguardando aprovação, aprovado, rejeitado
- Thread por agente, com não-lidos
- Nível de autonomia declarado em código e visível ao coordenador
- Registro completo de cada execução: gatilho, entrada, saída, modelo, tokens, custo
