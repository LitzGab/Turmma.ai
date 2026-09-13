# Agentes

## O que é um agente aqui

Um especialista de IA com **thread própria**, nome, avatar, escopo e **nível de autonomia
declarado**. Ele prepara o trabalho quando o evento acontece e avisa. Não é um botão, não é
um prompt salvo.

A diferença que o benchmark mostrou: todos os concorrentes vendem "assistente sob
comando". Os nossos agentes preparam e avisam, e tudo que vale passa por aprovação ou
supervisão da escola. O produto se apresenta como **assistente com agentes supervisionados**
(D44), não como "IA que trabalha sozinha": a coordenação compra conformidade, e autonomia
vendida como promessa contradiz isso.

## Níveis de autonomia

| Nível | O agente… | Exemplos |
|---|---|---|
| **1 — Executa e registra** | Faz sem pedir, deixa rastro | Indexar material novo, gerar rascunho de prova, resumir dúvidas do dia |
| **2 — Executa e avisa** | Faz e notifica quem precisa saber | Corrigir objetivas (rascunho de nota), sinalizar aluno travado, lembrar entregas |
| **3 — Propõe e espera aprovação** | Prepara tudo e aguarda um humano | Publicar nota, mensagem à família, adaptar prova de um aluno, plano de recuperação |
| **4 — Nunca faz** | Fora do escopo, por lei ou por escolha | Decidir aprovação ou reprovação, vigilância emocional, assunto fora da escola |

**O nível é propriedade do agente, declarada em código e visível ao coordenador.** Não é
configuração escondida. A escola precisa poder responder "o que essa IA faz sozinha?" em
uma tela.

## Regra estrutural

> O agente faz, o humano aprova antes de valer — sempre que houver **nota**, **comunicação
> com a família** ou **decisão sobre o aluno**.

Isso vem do CNE (`docs/regulacao.md`), não da nossa preferência. Tecnicamente: toda
`Entrega` de agente nasce `pendente`, e nada oficial acontece antes de `aprovadaPor`.

**A única exceção é a resposta do Tutor** (D47, regra 70 item 3): ela acontece em tempo real
e é supervisionada, não aprovada uma a uma. Nenhum outro agente herda essa exceção.

**Nenhum agente produz dado para decidir sobre o professor** (D45, regra 70 item 8). O que
um agente mostra sobre as turmas de um professor chega primeiro a ele, e à coordenação só
em agregado.

## Nome

**O nome do agente é a função** (D17). Sem nome próprio: a coordenação precisa explicar em
reunião de pais o que cada IA faz, e "o Corretor" se explica sozinho. Os nomes do desenho da
call (Pipo, Waz, Maky) não são usados.

## Os agentes (D32)

| Agente | Para quem | Dispara | Nível | O que faz |
|---|---|---|---|---|
| **Rotina** | professor | todo dia letivo, de manhã | 1 | Abre o dia com aulas, avaliações e pendências que já existem na grade e nas avaliações. Não gera conteúdo novo, por isso é barato. Garante que o feed nunca apareça vazio |
| **Corretor** | professor | fim da atividade ou avaliação | 2 para corrigir, 3 para nota | Corrige objetivas, escreve devolutiva formativa das discursivas **sem propor nota** (D46) e monta o diagnóstico por habilidade e o relatório por questão. Primeiro entrega só diagnóstico; quando a nota oficial existir, propõe a nota das objetivas, que só existe depois da aprovação |
| **Planejador** | professor | **sob pedido**, ou "preparar a semana" ligado pelo professor para uma turma | 1 | Plano de aula e sequência didática a partir do material e do calendário. Não gera plano que ninguém pediu |
| **Monitor de turma** | professor | diário, de madrugada, e por evento | 2 | Entregas pendentes, quem travou, dúvidas frequentes, queda de desempenho por habilidade. Aluno nomeado só para o professor da turma. Possível alto risco no CNE (perfilização): explicação e contestação antes de existir (`docs/regulacao.md`) |
| **Tutor** | aluno | aluno pergunta | 2, sempre supervisionado, sem aprovação prévia por resposta (D47) | Conduz por perguntas, nunca entrega resposta pronta, cita a página |
| **Adaptador** | professor | avaliação ou atividade criada para turma com aluno que tem adaptação registrada | 3 | Propõe a versão adaptada (fonte ampliada, tempo extra, enunciado simplificado). O professor aprova antes de o aluno receber |
| **Analista da coordenação** | coordenação | toda segunda de manhã, e por evento que passa do limiar | 2 | Resumo semanal e alerta na hora, **em agregado** por série e disciplina: média fora da curva, habilidade em queda, consumo de IA alto, alunos em risco. O detalhe por turma ou professor só abre com auditoria (D45). Alerta é hipótese com contexto, nunca veredito sobre o professor. Só avisa: nunca contata professor nem família |
| **Mensageiro da família** | professor, coordenação | evento | 3 | Prepara a comunicação e envia só depois da aprovação. **Fase posterior** |

### Detalhes que já estão decididos

**Aprovação de nota de objetiva é em lote** (D33), quando a nota oficial entrar (D46). Um
confirmar para a turma, depois de ver
média, distribuição e os casos destacados: discursiva com baixa confiança, nota muito longe
do histórico do aluno, prova em branco. Os destacados precisam ser abertos antes de o botão
de aprovar o lote liberar. Aluno por aluno viraria clique reflexo, que é justamente o que a
regra 50 quer evitar.

**Aluno em risco chega nomeado só ao professor da turma** (D34). A coordenação vê o
agregado ("1ºC tem 5 alunos com três entregas faltando") e abre o detalhe só com registro
em auditoria. É sinal para um humano olhar, nunca decisão sobre o aluno (regra 70).

**A adaptação é registrada pela coordenação, e só a adaptação** (D35). "Fonte ampliada,
tempo +50%", nunca diagnóstico, laudo ou CID. O professor da turma vê; todo acesso fica em
auditoria. É dado sensível de menor (`docs/lgpd.md`).

**Assunto pessoal delicado no tutor** (D36). O Tutor não aconselha. Responde com mensagem
fixa, revisada pela escola, que acolhe e orienta a procurar o professor ou a orientação
educacional e, se houver menção a risco à vida, o CVV (188). Gera o sinal "precisa de
atenção humana" para o professor da turma, **sem mostrar o conteúdo por padrão**. O gatilho
é o que o aluno escreveu explicitamente, nunca inferência de humor ou estado emocional. O
texto da mensagem e a lista de gatilhos passam pelo `conformidade-reviewer` e pelo
`pedagogia-reviewer` antes de existir. A escola tem obrigação de notificar o Conselho
Tutelar em caso de automutilação ou tentativa de suicídio (Lei 13.819/2019, ampliada pela
Lei 15.231/2025): o sinal precisa chegar também a quem notifica (orientação ou direção), com
acesso ao conteúdo auditado. A detalhar no PRD do F9 (`docs/regulacao.md` seção 6).

### O que nenhum agente faz (nível 4)

- Decidir aprovação, reprovação ou encaminhamento de aluno, nem como sugestão aplicada sozinha
- Publicar nota ou falar com a família sem aprovação humana registrada
- Inferir emoção, humor, atenção ou comportamento, ou ranquear alunos por isso
- Ranquear professores, ou recomendar qualquer decisão sobre um professor
- Propor nota em redação ou discursiva (D46)
- Falar de assunto fora do conteúdo escolar da turma

## Agente e ferramenta não são a mesma coisa

A **ferramenta** espera o professor pedir e produz um artefato na hora (pelo formulário ou
pelo chat, D18). O **agente** trabalha sem pedido, disparado por evento ou horário, e avisa
no feed. Os dois podem usar o mesmo caso de uso por baixo: o Corretor e a ferramenta de
correção chamam a mesma correção. O que muda é quem dispara e onde o resultado aparece.

## Requisitos de runtime

- Roda em fila, nunca dentro de request
- Idempotente e capaz de sobreviver a reinício do worker: a fila entrega **pelo menos uma
  vez**, então o processador recebe chave de idempotência e tolera reexecução sem duplicar
  aviso nem chamada de IA paga (D49)
- Limite de passos e de custo por execução — agente que não sabe parar queima a margem
- Registro completo: gatilho, entrada, saída, modelo, tokens, custo, duração, estado
- Estados: `executado`, `aguardando aprovação`, `aprovado`, `rejeitado`
- Notificação roteada para quem precisa saber, no canal disponível na fase atual
