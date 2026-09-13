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

## Candidatos iniciais

| Agente | Nível | O que faz |
|---|---|---|
| **Rotina** | 1 | Abre o dia do professor: aulas, avaliações e pendências, a partir da grade e das avaliações. Garante que o feed nunca apareça vazio |
| **Corretor** | 2 para objetiva, 3 para publicar nota | Corrige, monta relatório por questão, propõe notas |
| **Planejador** | 1 | Plano de aula e sequência didática a partir do material e do calendário |
| **Monitor de turma** | 2 | Entregas pendentes, quem travou, dúvidas frequentes, queda de desempenho |
| **Tutor** | 2, sempre supervisionado | Conduz o aluno por perguntas, nunca entrega resposta pronta |
| **Mensageiro da família** | 3 | Prepara a comunicação; envia só depois da aprovação. Fase posterior |

Os nomes estão decididos. **A lista final e o nível de cada um ainda são decisão em aberto**:
feche com `/descobrir agentes` antes do PRD do F11.

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
