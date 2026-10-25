# PRD — Telas do aluno e primeiro acesso

**Status:** aprovado por delegação do Joaquim (12/10/2026).
**Funcionalidade do roadmap:** X4
**Depende de:** X1

## 1. Problema

O aluno de 11 anos entra e cai numa lista, com o Tutor, a turma e os dados dele espalhados. Ninguém lhe diz que o
Tutor é um programa, que erra, e que quem dá a aula acompanha; professora e coordenadora entram sem saber o que a IA
faz sozinha. E falta o aviso de privacidade em linguagem da idade.

## 2. Objetivo

O aluno acha tudo em três lugares (Início, Tarefas e Eu), e cada pessoa vê uma vez o que a IA é e quem vê o quê.

## 3. Fora de escopo

- **F9:** Avisar um adulto, memória do Tutor com contestação, pedido de dados pelo aluno, desempenho por
  assunto, e a conversa livre com histórico, foto, voto, Refazer e Editar
- **F6:** prova em tela de foco, relógio, saída da aba, tarefa de leitura, "Isso está errado?" e Tutor ao lado
- "NOVO", contador de tarefas e filtro por matéria; trocar a senha (F2)
- A introdução da operação e a da rede; nas outras, confirmar turma, "preparar a semana", gerar prova e o Analista
  em conversa
- Letra para professor e coordenação; o desenho ilustrado de cada matéria; "atividade" por "tarefa" dentro da tarefa
  aberta e do Tutor

## 4. Papéis envolvidos

| Papel | O que pode fazer | O que não pode |
|---|---|---|
| Aluno | Navegar por Início, Tarefas e Eu; ver e rever a introdução; escolher a letra | Ver dado de colega; pular os três avisos na primeira vez |
| Professor | Ver a introdução, pular e rever | Mudar dado por ela |
| Coordenador | Ver a introdução, pular e rever | Saber se um professor viu ou pulou a dele (D64) |

## 5. Requisitos funcionais

| # | Requisito | Como se prova |
|---|---|---|
| RF1 | Os lugares do aluno são **Início, Tarefas e Eu**, na lateral e na barra de baixo. "Avisar um adulto" não aparece; "Privacidade" vira linha de Eu | e2e `areas` |
| RF2 | O aluno abre no Início. Os endereços de hoje abrem as telas de hoje; `/aluno/minha-turma` leva a `/aluno/eu` | e2e por endereço |
| RF3 | "Sair" está a um clique em toda tela do aluno e de foco, do tamanho dos vizinhos (D59) | e2e; componente |
| RF4 | O Início mostra a saudação com a onça do Tutor, a função e o selo "IA"; a faixa de supervisão de hoje, presa e sem fechar; e até três tarefas para fazer, cada uma com "Pedir ajuda ao Tutor". O uso do dia fica na tela do Tutor | teste de componente; e2e com a faixa à vista depois de rolar |
| RF5 | Com uma avaliação aberta, o Início avisa com o texto de hoje e **não tira o caminho** até a conversa, cuja caixa existe em todo estado (D36). Limite do dia e função suspensa são avisados na tela do Tutor | teste de componente; o e2e do assunto delicado na pausa |
| RF6 | Tarefas tem três grupos, **Para fazer, Entregues e Corrigidas**, com linha inteira clicável, ladrilho da matéria, estado em texto e "Ver mais". Corrigida é só a de correção aprovada | unidade; teste de componente; e2e |
| RF7 | A tarefa aberta mantém o fluxo de hoje: salva a cada escolha, reenvia, envia com confirmação, resultado só depois de aprovado | os e2e de hoje |
| RF8 | A **comemoração** aparece uma vez, depois do envio confirmado, e não volta ao recarregar. Nunca em acerto, resultado ou tempo de uso; sem som nem número; parada com "reduzir movimento" | teste de componente; e2e |
| RF9 | Eu mostra a turma, a série e a escola (ou o texto de quem está sem turma); "Como estou indo": as tarefas de correção aprovada, com "N de M certas" e as habilidades a rever; e as linhas Privacidade, Ajustes, Rever a introdução e Sair | teste de componente; e2e |
| RF10 | Nenhuma tela do aluno mostra colega, média ou posição na turma, sequência de dias, pontos, meta ou prêmio por uso | componente varre o texto |
| RF11 | O aluno escolhe o **tamanho da letra**: Padrão, Grande ou Maior. Vale na área dele, antes de a tela desenhar; fica no navegador, sem identificador, e só grava quando ele escolhe. Com Maior, a 360 px, nada rola de lado | e2e: escolher, recarregar e medir; armazenamento vazio sem escolha |
| RF12 | Na primeira entrada depois do login, aluno, professor e coordenação veem a **introdução** do papel, em tela de foco. Quem já viu não vê de novo, em nenhum computador; com o mesmo papel em duas escolas, uma vez só, mesmo se o vínculo de uma delas terminar, desde que a pessoa tenha entrado na outra enquanto ele estava ativo | integração; e2e: primeira e segunda entrada |
| RF13 | A do aluno tem quatro passos: o Tutor é um programa e pode errar; quem dá a aula acompanha; o aviso de privacidade; o tamanho da letra. Os três primeiros são avisos, sem "pular" na primeira vez | teste de componente; e2e |
| RF14 | O aviso de privacidade está em linguagem de 11 anos: frases de até 15 palavras, sem termo jurídico; diz o que guardamos (o resultado das tarefas, o que você escreve para o Tutor e o que ele responde), o que não temos, quem vê (o professor da turma vê as tarefas e o resultado), que o texto passa por um programa de IA de uma empresa contratada, que não treina IA, que a conversa com o Tutor fica de 6 a 24 meses (a escola escolhe) e as tarefas pelo tempo que a escola escolhe, e como pedir os dados. Nunca diz "nota" | unidade: exige as frases e recusa "nota" |
| RF15 | A do professor diz que a IA prepara e ele aprova; que só a resposta do Tutor chega ao aluno sem aprovação uma a uma; que a IA não corrige redação nem discursiva; e que o uso dele não vira indicador. A da coordenação diz o que ela vê em agregado, o que só abre com finalidade registrada e o que a IA nunca faz. As duas podem ser puladas | teste de componente; unidade |
| RF16 | Seguir e pular têm o mesmo tamanho e peso. Sair ou fechar a aba no meio não marca a introdução como vista | teste de componente; integração |
| RF17 | "Rever a introdução" está em Eu (aluno) e no menu da pessoa (professor e coordenação). Revendo, todo passo fecha e a data não muda | e2e por papel |
| RF18 | A introdução não chama modelo, não gera documento, não confirma turma; só grava a data, por rota da própria pessoa, idempotente, que `GET /v1/eu` devolve | integração: repetida, em paralelo e isolamento |
| RF19 | A onça tem três poses (acenando, apontando, comemorando), todas com o mesmo rosto neutro da cabeça da X1: só o corpo muda. A introdução só acena e aponta e termina parada; `comemorando` só a `Comemoracao` desenha, na entrega. Sempre com a função e o selo "IA". As falas são fixas, sem variar com presença, ausência, acerto ou tempo de uso, e não afirmam ser pessoa, professor ou amigo nem prometem voltar, esperar ou estar sempre ali | componente (rosto); arquitetura; unidade nos textos dos três papéis |
| RF20 | Toda tela nova ou recomposta, a `BemVindo` inclusive, tem os quatro estados, funciona a 360 px e cabe em 1366 × 768; sai num pedaço de até 30 kB, e a entrada fica em até 150 kB | teste de componente; e2e nos dois projetos; o build |
| RF21 | Nenhum teste de regra é apagado, pulado ou enfraquecido; páginas públicas intactas | o diff dos testes; a esteira |

## 6. Regras de negócio

**Regra vence desenho** (D80, item 7). Os 14 pontos do fechamento (d) do `mockup.md`:

- **Não entram:** (1) a caixa do Tutor que some na pausa (D36); (2) a supervisão em linha
  cinza, no lugar da faixa presa (D8); (6) anexar foto, apagar e editar
  conversa, Refazer e voto (D5, D75, D55, D8, D38); (7) a entrada que responde "pedido esperando" (regra 20, item
  6); (8) o convite com e-mail; (9) o segundo fator só por QR (regra 50, item 2); (10) a busca de escola;
  (11) avisar e pedir dados sem conta (ECA Digital); (14) o nome do professor na tarefa: a tela diz "quem dá a aula"
- **Entram, diferentes:** (3) "Sair" ganha a linha em Eu e continua à vista na casca (D59); (4) a onça tem três
  poses, sem "acolhendo" (D58); (12) Eu e a introdução entram, Avisar fica no F9 e a prova de foco, no F6; (13)
  toda tela ganha carregando e erro; o resto fica como hoje

Valem ainda: **uma formulação só** para a supervisão, a da faixa; **resultado só de correção aprovada** (regra 70,
item 3), sem limiar novo; **nada induz uso** (D59); **o agente não se passa por pessoa** (D58); e **a introdução é da
pessoa e do papel**.

## 7. Casos de borda

| Caso | Comportamento esperado |
|---|---|
| Aluno sem turma no ano letivo | Eu mostra o texto de hoje; o Início diz que não há tarefa |
| Aluno transferido de turma no mesmo ano | A tarefa corrigida da turma antiga continua em Eu ("Como estou indo"), com o resultado: é trabalho dele, e o Tutor também a lembra (D66). A virada do ano letivo corta |
| Dois alunos no mesmo Chromebook | A letra fica; nada do primeiro aparece para o segundo |
| Professor em duas escolas; virada do ano letivo; vínculo de uma escola encerrado | Uma introdução por papel; nem a troca de escola, nem o ano novo, nem o fim de um vínculo (com a outra já aberta) a reabrem |
| Aluno em duas escolas | Vê a introdução nas duas |
| Dois cliques em "Começar", ou duas abas | Uma data só, a primeira |
| A gravação falha | A pessoa segue; a introdução volta na entrada seguinte |
| Coordenação com incidente pendente | O aviso aparece por cima da introdução |

## 8. Dado pessoal envolvido

| Dado | Titular | Finalidade | Retenção | Já está em `docs/lgpd.md`? |
|---|---|---|---|---|
| Data em que a pessoa viu a introdução do papel | aluno, professor, coordenador | não repetir a introdução | enquanto o cadastro existir; sai com ele | não: entra nesta spec |

Só a data: nenhum registro de passo, de tempo ou de "pulou". A letra fica só no navegador.

## 8b. Risco regulatório (quando há IA no caminho do aluno)

Nenhuma função de IA muda: o Tutor segue de alto risco e supervisionado (D47), com a AIA de `docs/aia/tutor.md`. A introdução e o aviso fecham a pendência 12 da AIA e a do `docs/lgpd.md`, seção 9 (Decreto 12.880, art. 11; LGPD,
art. 14, § 6º).

## 9. Métricas

- O e2e do aluno e das páginas públicas verde, com os mesmos casos ou mais
- O Gabriel vê as telas ao lado do mockup
- Quem concluiu ou pulou a introdução **não é medido** (D64)

## 10. Perguntas em aberto

**Respondido por delegação:** o Início leva ao Tutor de uma tarefa; "Como estou indo" lista as tarefas corrigidas
(o agregado por assunto é do F9); "pular" marca a introdução como vista, e sair no meio, não; a letra vale só na área
do aluno; a data entra em "Meus dados" sem auditoria; o uso do dia fica só no Tutor.

**Para a Tech Spec:** onde mora a data; de onde vem o resultado por tarefa, sem rota nova.

**Em aberto, sem travar:** se o art. 24 do ECA Digital pede o aviso também ao responsável (F9).
