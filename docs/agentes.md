# Agentes

## O que é um agente aqui

Um especialista de IA com **thread própria**, nome, avatar, escopo e **nível de autonomia
declarado**. Ele trabalha sozinho e avisa. Não é um botão, não é um prompt salvo.

A diferença que o benchmark mostrou: todos os concorrentes vendem "assistente sob
comando". Ninguém vende agente que executa e avisa. É esse o produto.

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

## Nome

**O nome do agente é a função** (D17). Sem nome próprio: a coordenação precisa explicar em
reunião de pais o que cada IA faz, e "o Corretor" se explica sozinho. Os nomes do desenho da
call (Pipo, Waz, Maky) não são usados.

## Os agentes (D32)

| Agente | Para quem | Dispara | Nível | O que faz |
|---|---|---|---|---|
| **Rotina** | professor | todo dia letivo, de manhã | 1 | Abre o dia com aulas, avaliações e pendências que já existem na grade e nas avaliações. Não gera conteúdo novo, por isso é barato. Garante que o feed nunca apareça vazio |
| **Corretor** | professor | fim da avaliação | 2 para corrigir, 3 para nota | Corrige objetivas e propõe nota para discursivas com justificativa e confiança. Monta relatório por questão. Nota só existe depois da aprovação |
| **Planejador** | professor | **sob pedido**, ou "preparar a semana" ligado pelo professor para uma turma | 1 | Plano de aula e sequência didática a partir do material e do calendário. Não gera plano que ninguém pediu |
| **Monitor de turma** | professor | diário, de madrugada, e por evento | 2 | Entregas pendentes, quem travou, dúvidas frequentes, queda de desempenho. Aluno nomeado só para o professor da turma |
| **Tutor** | aluno | aluno pergunta | 2, sempre supervisionado | Conduz por perguntas, nunca entrega resposta pronta, cita a página |
| **Adaptador** | professor | avaliação ou atividade criada para turma com aluno que tem adaptação registrada | 3 | Propõe a versão adaptada (fonte ampliada, tempo extra, enunciado simplificado). O professor aprova antes de o aluno receber |
| **Analista da coordenação** | coordenação | toda segunda de manhã, e por evento que passa do limiar | 2 | Resumo semanal e alerta na hora: prova com média fora da curva, turma em queda, consumo de IA alto, alunos em risco **em agregado**. Só avisa: nunca contata professor nem família |
| **Mensageiro da família** | professor, coordenação | evento | 3 | Prepara a comunicação e envia só depois da aprovação. **Fase posterior** |

### Detalhes que já estão decididos

**Aprovação de nota de objetiva é em lote** (D33). Um confirmar para a turma, depois de ver
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
`pedagogia-reviewer` antes de existir.

### O que nenhum agente faz (nível 4)

- Decidir aprovação, reprovação ou encaminhamento de aluno, nem como sugestão aplicada sozinha
- Publicar nota ou falar com a família sem aprovação humana registrada
- Inferir emoção, humor, atenção ou comportamento, ou ranquear alunos por isso
- Falar de assunto fora do conteúdo escolar da turma

## Agente e ferramenta não são a mesma coisa

A **ferramenta** espera o professor pedir e produz um artefato na hora (pelo formulário ou
pelo chat, D18). O **agente** trabalha sem pedido, disparado por evento ou horário, e avisa
no feed. Os dois podem usar o mesmo caso de uso por baixo: o Corretor e a ferramenta de
correção chamam a mesma correção. O que muda é quem dispara e onde o resultado aparece.

## Requisitos de runtime

- Roda em fila, nunca dentro de request
- Idempotente e capaz de sobreviver a reinício do worker
- Limite de passos e de custo por execução — agente que não sabe parar queima a margem
- Registro completo: gatilho, entrada, saída, modelo, tokens, custo, duração, estado
- Estados: `executado`, `aguardando aprovação`, `aprovado`, `rejeitado`
- Notificação roteada para quem precisa saber, no canal disponível na fase atual
