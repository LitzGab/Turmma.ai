# PRD — Telas do aluno e primeiro acesso

**Status:** aprovado, por delegação do Joaquim em 12/10/2026 ("você pode tomar todas as decisões para o projeto, eu Joaquim permito"); ele revê ao ler
**Funcionalidade do roadmap:** X4
**Depende de:** X1

## 1. Problema

O aluno de 11 anos entra e cai numa lista, com o Tutor, a turma e os dados dele espalhados em três itens e um
rodapé. Ninguém lhe diz, na primeira vez, que o Tutor é um programa, que erra, e que quem dá a aula acompanha; a
professora e a coordenadora também entram sem saber o que a IA faz sozinha. E o aviso de privacidade em linguagem
da idade, que a lei pede, não existe.

## 2. Objetivo

O aluno acha tudo em três lugares (Início, Tarefas e Eu), e cada pessoa vê uma vez, na primeira entrada, o que a IA
é e quem vê o quê.

## 3. Fora de escopo

- **F9:** Avisar um adulto, modo casa, memória do Tutor com contestação, pedido de dados aberto pelo aluno,
  desempenho por assunto, e a conversa livre com histórico, foto, voto, Refazer e Editar
- **F6:** prova em tela de foco, relógio, saída da aba, tarefa de leitura, "Isso está errado?" e Tutor ao lado
- "NOVO", contador de tarefas e filtro por matéria (pedem marcação de leitura por aluno); trocar a senha (F2)
- A introdução da operação e a da rede; nas outras, confirmar turma, padrões de prova, "preparar a semana", gerar
  prova e o Analista em conversa
- Tamanho da letra para professor e coordenação; o desenho ilustrado de cada matéria
- Trocar "atividade" por "tarefa" dentro da tarefa aberta e do Tutor

## 4. Papéis envolvidos

| Papel | O que pode fazer | O que não pode |
|---|---|---|
| Aluno | Navegar por Início, Tarefas e Eu; ver e rever a introdução; escolher o tamanho da letra | Ver dado de colega; pular os três avisos na primeira vez |
| Professor | Ver a introdução uma vez, pular e rever | Mudar dado por ela |
| Coordenador | Ver a introdução uma vez, pular e rever | Saber se um professor viu ou pulou a dele (D64) |

## 5. Requisitos funcionais

| # | Requisito | Como se prova |
|---|---|---|
| RF1 | Os lugares do aluno são **Início, Tarefas e Eu**, na lateral e na barra de baixo. "Avisar um adulto" não aparece; "Privacidade" vira linha de Eu | e2e `areas` |
| RF2 | O aluno abre no Início. Os endereços de hoje abrem as telas de hoje, e `/aluno/minha-turma` leva a `/aluno/eu` | e2e por endereço |
| RF3 | "Sair" está a um clique em toda tela do aluno e de foco, do tamanho dos vizinhos (D59) | e2e; teste de componente |
| RF4 | O Início mostra a saudação com a onça do Tutor, a função e o selo "IA"; a faixa de supervisão de hoje, presa e sem fechar; até três tarefas para fazer, cada uma com "Pedir ajuda ao Tutor"; e "Hoje: N de 60 perguntas", em texto e barra neutra | teste de componente; e2e com a faixa à vista depois de rolar |
| RF5 | Com o Tutor pausado (avaliação, limite, função suspensa), o Início avisa com os textos de hoje e **não tira o caminho** até a conversa, cuja caixa existe em todo estado (D36) | teste de componente; o e2e do assunto delicado na pausa |
| RF6 | Tarefas tem três grupos, **Para fazer, Entregues e Corrigidas**, com linha inteira clicável, ladrilho da matéria, estado em texto e "Ver mais" a pedido. Corrigida é só a de correção aprovada | unidade; teste de componente; e2e |
| RF7 | A tarefa aberta mantém o fluxo de hoje: salva a cada escolha, reenvia, envia com confirmação, resultado só depois de aprovado | os e2e de hoje, sem perder asserção |
| RF8 | A **comemoração** aparece uma vez, logo depois do envio confirmado, e não volta ao recarregar. Nunca em acerto, resultado ou tempo de uso; sem som nem número; parada com "reduzir movimento" | teste de componente; e2e |
| RF9 | Eu mostra a turma, a série e a escola (ou o texto de quem está sem turma); "Como estou indo": as tarefas de correção aprovada, com "N de M certas" e as habilidades a rever; e as linhas Privacidade, Ajustes, Rever a introdução e Sair | teste de componente; e2e |
| RF10 | Nenhuma tela do aluno mostra colega, média ou posição na turma, sequência de dias, pontos, meta ou prêmio por uso | teste de componente varre o texto |
| RF11 | O aluno escolhe o **tamanho da letra**: Padrão, Grande ou Maior. Vale na área dele, antes de a tela desenhar; fica no navegador, sem identificador, e só grava quando ele escolhe. Com Maior, a 360 px, nada rola de lado | e2e: escolher, recarregar e medir; armazenamento vazio sem escolha, e recusando |
| RF12 | Na primeira entrada depois do login, aluno, professor e coordenação veem a **introdução** do papel, em tela de foco. Quem já viu não vê de novo, em nenhum computador; com o mesmo papel em duas escolas, uma vez só | integração; e2e: primeira e segunda entrada |
| RF13 | A do aluno tem quatro passos: o Tutor é um programa e pode errar; quem dá a aula acompanha; o aviso de privacidade; o tamanho da letra. Os três primeiros são avisos, sem "pular" na primeira vez | teste de componente; e2e |
| RF14 | O aviso de privacidade está em linguagem de 11 anos: frases de até 15 palavras, sem termo jurídico; diz o que guardamos, o que não temos, quem vê, que o dado não treina IA e como pedir os dados | unidade sobre o texto |
| RF15 | A do professor diz que a IA prepara e ele aprova; que só a resposta do Tutor chega ao aluno sem aprovação uma a uma; que a IA não corrige redação nem discursiva; e que o uso dele não vira indicador. A da coordenação diz o que ela vê em agregado, o que só abre com finalidade registrada e o que a IA nunca faz. As duas podem ser puladas | teste de componente; unidade |
| RF16 | Seguir e pular têm o mesmo tamanho e peso. Sair da conta ou fechar a aba no meio não marca a introdução como vista | teste de componente; integração |
| RF17 | "Rever a introdução" está em Eu (aluno) e no menu da pessoa (professor e coordenação). Revendo, todo passo fecha, e a data não muda | e2e por papel |
| RF18 | A introdução não chama modelo, não gera documento, não confirma turma; só grava a data, por rota da própria pessoa, idempotente, que `GET /v1/eu` devolve | integração: repetida, em paralelo e isolamento |
| RF19 | A onça da introdução tem três poses (acenando, apontando, comemorando), com a função e o selo "IA"; sem expressão de preocupação nem fala de sentimento | teste de componente |
| RF20 | Toda tela nova ou recomposta tem os quatro estados, funciona a 360 px e cabe em 1366 × 768; sai num pedaço de até 30 kB, e a entrada continua em até 150 kB | teste de componente; e2e nos dois projetos; o build |
| RF21 | Nenhum teste que prova regra é apagado, pulado ou enfraquecido; as páginas públicas não mudam | o diff dos testes; a esteira |

## 6. Regras de negócio

**Regra vence desenho** (D80, item 7). O destino dos 14 pontos do fechamento (d) do `mockup.md`:

- **Não entram:** (1) a caixa do Tutor que some na pausa, na prova e no limite (D36); (2) a supervisão em linha
  cinza, no lugar da faixa presa (D8); (5) a conversa livre com histórico (F9); (6) anexar foto, apagar e editar
  conversa, Refazer e voto (D5, D75, D55, D8, D38); (7) a entrada que responde "pedido esperando" (regra 20, item
  6); (8) o convite com e-mail e entrada direta; (9) o segundo fator só por QR (regra 50, item 2); (10) a busca
  pública de escola; (11) avisar e pedir dados sem conta (parecer do ECA Digital); (14) o nome do professor na
  tarefa e na introdução: a tela diz "quem dá a aula"
- **Entram, diferentes:** (3) "Sair" ganha a linha em Eu e continua à vista na casca (D59); (4) a onça tem três
  poses, sem "acolhendo" (D58); (12) Eu e a introdução entram, Avisar fica no F9 e a prova de foco, no F6; (13)
  toda tela ganha carregando e erro, e "sem turma no ano", sessão vencida e resposta que não salvou ficam como hoje

Valem ainda: **uma formulação só** para a supervisão, a da faixa, com o que o professor vê de fato (uso e sinais);
**resultado só de correção aprovada** (regra 70, item 3), sem limiar novo; **nada induz uso** (D59); **o agente não
se passa por pessoa** (D58); e **a introdução é da pessoa e do papel**.

## 7. Casos de borda

| Caso | Comportamento esperado |
|---|---|
| Aluno sem turma no ano letivo | Eu mostra o texto de hoje; o Início diz que não há tarefa e não mostra o uso |
| Aluno transferido | A tarefa corrigida da turma antiga não aparece em Eu, como hoje |
| Dois alunos no mesmo Chromebook | O tamanho da letra fica; nada do primeiro aparece para o segundo |
| Professor em duas escolas; virada do ano letivo | Uma introdução por papel; nem a troca de escola nem o ano novo a reabrem |
| Dois cliques em "Começar", ou duas abas | Uma data só, a primeira |
| A gravação da data falha | A pessoa segue; a introdução volta na entrada seguinte |
| Coordenação com aviso de incidente pendente | O aviso aparece por cima da introdução |

## 8. Dado pessoal envolvido

| Dado | Titular | Finalidade | Retenção | Já está em `docs/lgpd.md`? |
|---|---|---|---|---|
| Data em que a pessoa viu a introdução do papel | aluno, professor, coordenador | não repetir a introdução, e mostrar que o aviso de IA e de privacidade foi apresentado | enquanto o cadastro existir; sai com ele | não: entra nesta spec |

Só a data: nenhum registro de passo, de tempo ou de "pulou". O tamanho da letra fica só no navegador.

## 8b. Risco regulatório (quando há IA no caminho do aluno)

Nenhuma função de IA muda: o Tutor continua de alto risco, supervisionado (D47), com a AIA de `docs/aia/tutor.md`.
Muda como a transparência chega: a introdução e o aviso fecham a pendência 12 da AIA e a do `docs/lgpd.md`, seção 9
(Decreto 12.880, art. 11; LGPD, art. 14, § 6º). Três pontos pedem o `conformidade-reviewer`: a comemoração (D59;
sai se ele vetar), as falas da onça (D58) e os avisos sem "pular".

## 9. Métricas

- O e2e do aluno e das páginas públicas verde, com o mesmo número de casos ou mais
- O Gabriel vê as telas ao lado do mockup e aprova ou aponta
- Quem concluiu ou pulou a introdução **não é medido** (D64)

## 10. Perguntas em aberto

**Respondido por delegação:** o Início leva ao Tutor de uma tarefa; "Como estou indo" lista as tarefas corrigidas, e
o agregado por assunto fica para o F9; "pular" marca a introdução como vista, e sair no meio, não; o tamanho da
letra vale só na área do aluno; a data entra em "Meus dados" e não gera auditoria.

**Para a Tech Spec:** onde mora a data; de onde vêm o uso do dia e o resultado por tarefa, sem rota nova.

**Em aberto, sem travar:** se o art. 24 do ECA Digital pede que o responsável também receba o aviso (F9).
