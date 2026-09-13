# Fluxos principais

Os sete caminhos que o sistema precisa fazer funcionar de ponta a ponta. Cada um está
narrado do jeito que acontece na escola, com as decisões técnicas que ele obriga.

Use isto para escrever PRD: o fluxo já contém os casos de borda que importam.

---

## Fluxo 1 — A escola inteira entra no sistema

**Como acontece**

Renata, coordenadora, assina o contrato numa terça. Na quarta ela entra no sistema e cria
as séries do Ensino Médio e as turmas de cada uma: 1ºA, 1ºB, 1ºC, e assim por diante. Para
cada turma, ela sobe uma lista de nomes — a mesma planilha que ela já tem da secretaria.

Ela convida os professores por e-mail. Camila recebe o link, clica, define senha e escolhe
que dá Química. O sistema já mostra as turmas para as quais ela foi alocada.

Na primeira aula, Camila projeta o link da sala no quadro. Os alunos abrem no Chromebook,
veem a lista de nomes da turma, e cada um reivindica o seu. Camila olha a tela dela, vê os
31 pedidos, confere e aprova. Só nesse momento cada aluno vira usuário de verdade, com
matrícula e senha.

**Por que é assim**

Cadastrar 900 alunos um a um mata o produto na primeira semana. Mas deixar o aluno digitar
o próprio nome livremente cria dois "Enzo Martins" e um "Batman". A reivindicação com
aprovação do professor resolve os dois: rápido para a escola, e ninguém se passa por outro.

**O que isso obriga tecnicamente**

- Convite com token único, validade, uso único e revogação
- Lista de nomes como entidade própria, com estado: livre, reivindicado, aprovado
- Importação tolerante a planilha suja, com erro apontado linha a linha, e reimportação que
  atualiza em vez de duplicar
- Aluno só existe como usuário depois da aprovação
- Reset de senha do aluno pelo coordenador ou pelo professor, já que o aluno não tem e-mail

**Casos de borda que vão acontecer**

Dois alunos com o mesmo nome na mesma turma. Aluno que chega em maio, depois da turma toda
já formada. Aluno transferido de turma no meio do ano. Aluno que reivindica o nome errado e
o professor aprova sem ver. Planilha com a turma escrita de três jeitos diferentes.

---

## Fluxo 2 — O material da escola vira base de conhecimento

**Como acontece**

Renata autoriza, por escrito, o uso do material do sistema de ensino que a escola já paga.
O sistema ingere o conteúdo, ou ela sobe as apostilas em PDF. O conteúdo é quebrado em
trechos, classificado por série, disciplina, capítulo e habilidade da BNCC, e indexado.

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
- Autorização escrita da escola registrada por fonte, sem a qual o adaptador não roda
- Conteúdo preso ao tenant da escola. Nunca vira banco nosso, nunca cruza para outra escola
- Ingestão em fila, com estado visível: o que entrou, o que falhou, o que está pendente

**Casos de borda**

PDF escaneado sem camada de texto. Apostila em duas colunas. Fórmula química que a extração
quebra. Material sem numeração de capítulo. Escola que sobe 300 arquivos de uma vez.

---

## Fluxo 3 — Professor cria uma avaliação

**Como acontece**

Camila abre o chat e pede uma prova de estequiometria para o 2ºB, dez questões, nível médio.
Ou abre a ferramenta e preenche um formulário, se preferir não conversar. O sistema busca no
material da turma, monta, mostra cada questão com a página de origem.

Ela troca duas questões, ajusta o peso de uma, e escolhe **como a prova vai ser aplicada**:
online no Chromebook, em papel para depois corrigir por foto, como trabalho de entrega, ou
presencial com lançamento manual.

A prova fica salva na biblioteca dela e aparece no calendário da turma.

**Por que é assim**

O professor decide a dinâmica, porque a realidade da sala muda: laboratório sem internet,
turma que faz melhor no papel, trabalho em grupo. Um sistema que só aceita prova online
perde metade dos casos reais.

**O que isso obriga tecnicamente**

- Avaliação é um objeto genérico com um **modo**; o modo define a trilha de aplicação e de
  correção, mas o núcleo (questão, item, nota, boletim) é o mesmo
- Em todos os modos, a nota termina dentro do sistema. Um modo que deixa a nota de fora
  quebra o painel do coordenador e a notificação da família
- Toda questão gerada guarda de qual material e de qual página veio

---

## Fluxo 4 — O aluno estuda com o tutor, em sala

**Como acontece**

Enzo trava no exercício 14 e pergunta ao tutor qual é o reagente limitante. O tutor recusa
dar a resposta e pergunta se ele já converteu as massas em mol. Enzo diz que só uma. O tutor
confirma que está certo e indica o próximo passo, citando a página 152.

Na tela da Camila, ao vivo, aparece que oito alunos travaram no mesmo ponto e que dois
pediram resposta pronta.

**Por que é assim**

O CNE classifica tutor digital como risco moderado, permitido **desde que supervisionado**.
E do ponto de vista de produto, é a demonstração que ganha a assembleia de pais: a IA da
escola ensina, a IA de fora entrega.

**O que isso obriga tecnicamente**

- Política de tutor por turma: bloqueado, socrático ou livre, definida pelo professor dentro
  do padrão da escola, aplicada **no servidor**
- Trava automática durante avaliação em andamento, independentemente da política
- Escopo de assunto por recuperação do material da turma, com recusa testada e não apenas
  pedida no prompt
- Tempo real por turma no modo sala; registro e resumo no modo casa
- Sinal derivado de evento: o professor vê uso e dificuldade, não uma janela sobre o
  comportamento do aluno
- Conversa do tutor com retenção curta e acesso restrito ao professor da turma

**Casos de borda**

Aluno tentando arrancar a resposta de três formas diferentes. Aluno perguntando sobre
assunto fora da matéria. Aluno usando o tutor durante a prova. Internet caindo no meio da
aula. Aluno pedindo ajuda sobre algo pessoal e delicado, que precisa de encaminhamento
humano e não de resposta de IA.

---

## Fluxo 5 — Correção, aprovação e devolutiva

**Como acontece**

Terminada a prova, o agente Corretor corrige as objetivas automaticamente e propõe nota para
as discursivas, com justificativa. Ele **não lança nada**. Manda uma entrega para o feed da
Camila: "corrigi as 32 provas, média 6,4, esperando você aprovar".

Camila revisa. Discorda de duas correções, ajusta, aprova o lote. Nesse instante a nota
passa a existir, o aluno vê a devolutiva, e o evento sobe para o painel da coordenação.

**Por que é assim**

Correção automática e atribuição de nota são classificadas como alto risco pelo CNE e
exigem supervisão humana. Decisão autônoma sobre aprovação do aluno é proibida. Além da
lei: professor não assina embaixo de nota que não conferiu.

**O que isso obriga tecnicamente**

- `Correcao` e `Nota` são entidades separadas. A IA escreve na primeira, nunca na segunda
- `Nota` só é gravada com autor humano, em **todo** caminho: interface, job, importação, seed
- Entrega de agente nasce pendente, com aprovar e rejeitar com justificativa
- Auditoria responde "o que a IA gerou, quem aprovou, quando"
- A justificativa da correção precisa ser boa o bastante para o professor defender a nota
  diante de um pai

---

## Fluxo 6 — A coordenação governa

**Como acontece**

Renata abre o painel e vê quantos professores estão usando, quanto de IA foi gerado, que
100% das notas passaram por aprovação humana, e quanto do orçamento de IA do mês já foi
consumido.

Dois alertas esperam por ela: a média do 2ºA em Biologia está em 9,4 contra 6,8 das outras
turmas da mesma série, e o 1ºC caiu 1,4 ponto em Matemática em duas avaliações seguidas,
concentrado em funções do primeiro grau.

**Por que é assim**

É a tela que decide a renovação do contrato, e é a que nenhum concorrente tem. A escola
precisa poder responder, em reunião de pais, o que a IA faz ali dentro.

**O que isso obriga tecnicamente**

- Agregação por professor, turma, disciplina e habilidade
- Detecção de anomalia com limiar configurável
- Auditoria consultável de saída de IA e de aprovação
- Nível de autonomia de cada agente exposto em linguagem comum
- Consumo de tokens por escola e por perfil
- Leitura de dado de aluno pela coordenação registrada em auditoria

---

## Fluxo 7 — O agente executa e avisa

**Como acontece**

O Monitor de turma roda de madrugada, cruza as entregas com os prazos, e de manhã avisa:
cinco alunos do 1ºC não entregaram a lista, e quatro deles também não entregaram a anterior.
Propõe preparar um aviso às famílias, que fica esperando aprovação.

**Por que é assim**

É o produto. Toda ferramenta do mercado espera o clique; a nossa puxa a conversa.

**O que isso obriga tecnicamente**

- Runtime de agente em fila, nunca dentro de request
- Idempotência: rodar duas vezes não duplica aviso
- Limite de passos e de custo por execução. Agente que não sabe parar queima a margem
- Estado explícito: executado, aguardando aprovação, aprovado, rejeitado
- Thread por agente, com não-lidos
- Nível de autonomia declarado em código e visível ao coordenador
- Registro completo de cada execução: gatilho, entrada, saída, modelo, tokens, custo
