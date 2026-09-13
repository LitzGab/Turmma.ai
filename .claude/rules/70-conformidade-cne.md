# Regra 70 — Conformidade regulatória educacional

## Por que esta regra existe

Em 1º de setembro de 2026 o Conselho Nacional de Educação aprovou diretrizes para o uso de
inteligência artificial na educação. Até 13/09/2026 o texto ainda aguardava homologação do
MEC e publicação como resolução, e os doze meses de adequação contam da publicação. Isso
muda nosso projeto de duas formas.

A primeira é óbvia: algumas coisas que seriam tecnicamente fáceis passaram a ser proibidas,
e outras passaram a exigir um humano no caminho. Correção automática e atribuição de nota
são classificadas como alto risco e exigem supervisão. Decisão só automatizada sobre
promoção ou retenção de aluno é proibida. Segundo a imprensa, a versão final proíbe também
a IA de corrigir ou sugerir nota em redação e prova discursiva; até lermos o texto
publicado, tratamos isso como proibido (D46).

A segunda é comercial e vale mais: praticamente nenhuma escola sabe como se adequar, e só
22% delas têm qualquer política de uso de IA. Um sistema que já nasce em conformidade, com
auditoria pronta para mostrar em reunião, não está cumprindo obrigação — está vendendo a
solução de um problema que o coordenador tem e não sabe resolver.

Por isso estas regras não são burocracia a ser minimizada. São parte do produto.

O detalhamento está em `docs/regulacao.md`.

## A classificação, traduzida

| O que o CNE diz | O que isso significa no código |
|---|---|
| Tutor e personalização são risco moderado, permitidos | O ambiente do aluno é legítimo, desde que supervisionado pelo professor |
| Correção e atribuição de nota são alto risco, exigem supervisão | Em objetiva, a IA corrige, mas nota só existe com aprovação humana registrada, qualificada e documentada |
| Correção e sugestão de nota em redação e discursiva (versão final, segundo a imprensa; texto a confirmar) | A IA entrega só devolutiva formativa, sem nota proposta (D46) |
| Perfilização acadêmica individual e inferência comportamental relevante são alto risco (texto de consulta) | Sinais do tutor e alertas sobre aluno exigem avaliação de impacto, explicação acessível e caminho de contestação. A confirmar no texto final |
| Decisão só automatizada sobre promoção ou retenção é proibida | O sistema não implementa isso nem como sugestão aplicada sozinha |
| IA generativa sem supervisão é vedada na infantil e anos iniciais | Nosso recorte é anos finais e Ensino Médio (D43); descer de faixa reabre esta regra |

## As regras

1. **Nota só existe com autor humano.** Toda escrita em `Nota` exige `lancadaPor`
   preenchido por pessoa, em **todo** caminho: interface, job, importação em lote, seed,
   webhook. O jeito de garantir isso é estrutural, não por disciplina:

   ```ts
   // Correcao é o que a IA produz. Nota é o que vale.
   // Não existe construtor de Nota sem autor.
   class Nota {
     private constructor(readonly valor: number, readonly lancadaPor: UsuarioId) {}
     static aprovar(correcao: Correcao, professor: UsuarioId) { ... }
   }
   ```

2. **Nenhuma funcionalidade decide aprovação, reprovação ou encaminhamento de aluno.** Nem
   como recomendação automática aplicada sem alguém confirmar. Se aparecer um pedido desse
   tipo, ele é recusado e a conversa sobe para produto.

3. **Toda saída de IA que chega ao aluno passa por aprovação registrada**, com autor, data,
   e possibilidade de rejeitar com justificativa. A entrega do agente nasce pendente. Vale
   para material, atividade, devolutiva e adaptação.
   **A única exceção é a resposta do tutor** (D47), que não é aprovada uma a uma porque
   acontece em tempo real. Ela é supervisionada pelo item 4, com escopo e política da turma
   aplicados no servidor. A exceção não se estende a nenhum outro agente.

4. **O tutor é sempre supervisionado.** Não existe uso invisível ao professor. Em sala, o
   professor acompanha ao vivo; em casa, fica registro e resumo.

5. **A autonomia de cada agente é declarada em código e visível ao coordenador**, em
   português comum, não em jargão. A escola precisa poder responder "o que essa IA faz
   sozinha?" apontando para uma tela. Ver `docs/agentes.md`.

6. **A auditoria responde "o que a IA gerou, quem aprovou e quando"** para qualquer item,
   a qualquer momento. É essa consulta que ganha a reunião com a coordenação.

7. **Supervisão não é vigilância.** O professor vê uso e dificuldade de aprendizagem: quem
   travou, quem pediu resposta pronta, qual dúvida se repetiu. Não vê uma janela permanente
   sobre o comportamento do aluno, e o sistema não infere estado emocional. A diferença
   entre as duas coisas é o que mantém a confiança da família.

8. **Medir o professor também não é vigiar** (D45). O professor vê o próprio painel; a
   coordenação vê por série e disciplina e abre o nominal só com registro em auditoria.
   Não existe ranking de professor, e nenhuma métrica alimenta decisão sobre ele
   (avaliação funcional, sanção, dispensa), nem como sugestão. A conversa do professor com
   o chat nunca é visível à coordenação. É o que mantém a confiança do professor, sem a qual
   a escola não renova.

## Como isso é checado

O subagente `conformidade-reviewer` audita toda tarefa que envolva nota, correção, tutor,
autonomia de agente, decisão sobre aluno ou indicador de professor. O veto dele é falha da
tarefa.
