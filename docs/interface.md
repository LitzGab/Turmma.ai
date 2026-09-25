# Interface — design, navegação e telas

> O mapa das telas por papel, o comportamento das peças que aparecem em todo lugar (chat,
> ferramenta, feed de agentes, aprovação) **e o design visual**: direção, cor, tipografia,
> movimento, componentes e a casca.
>
> As regras que limitam tudo aqui estão em `.claude/rules/50-frontend.md`: computador fraco
> de escola, responsiva até o celular sem depender dele (D51), quatro estados por tela, ação
> oficial que mostra o que vai acontecer.

Legenda: **decidido** vem de decisão registrada (`docs/decisoes.md`). *Proposta* é ponto de
partida para o PRD da funcionalidade, que pode mudar.

**Como este documento se organiza.** A **Parte A** (seções 1 a 7) é o mapa das telas por
papel. A numeração dela não muda, porque tarefas do F1 já citam as seções 1, 2, 3 e 6. A
**Parte B** (seções 8 a 12) é o design. A direção foi dada pelo Gabriel em 19/09/2026 e revista
por ele em mockup, em oito rodadas, em 19 e 20/09/2026 (`docs/pendencias-dos-mockups.md`). Em
23/09/2026 a pele, o padrão de espaço e a navegação do professor viraram decisão (D72, D73). O
que ainda é proposta está marcado como tal, e o que falta decidir está na seção 7.

| Parte | Seção | O que tem |
|---|---|---|
| A | 1 a 5 | Áreas do professor, do aluno, da coordenação, da rede e da família |
| A | 6 | O que vale em toda tela |
| A | 7 | Em aberto |
| B | 8 | Direção de design: de onde vem, o que pegamos e o que não pegamos |
| B | 9 | Fundamentos visuais: cor, tipografia, forma, ícones, movimento, marca, avatares, tom, tokens |
| B | 10 | Componentes: o protocolo do 21st.dev, o mapa de peças, o que é proibido, o orçamento |
| B | 11 | A casca e as telas-chave, desenhadas |
| B | 12 | As telas do MVP de apresentação (A1 a A5) |

---

# Parte A — Navegação e telas

## 1. Área do professor

**Decidido** (D73, 23/09/2026), a partir do mockup que o Gabriel revisou em 19 e 20/09/2026
(`docs/pendencias-dos-mockups.md`, P04). Substitui o desenho da call:

```
┌──────────────────────┬──────────────────────────────────────────────────┐
│ ◉ Turmma           ⇤ │                                                  │
│ [ Escola ▾ ]         │                                                  │
│                      │                                                  │
│ ✎ Nova conversa      │           conteúdo da seção selecionada          │
│ ▦ Ferramentas        │                                                  │
│ ▤ Calendário         │                                                  │
│ ◫ Turmas             │                                                  │
│                      │                                                  │
│ Seu time           ˅ │                                                  │
│  ▣ Assistente    (3) │                                                  │
│  ▣ Tutor         (2) │                                                  │
│ Histórico          ˅ │                                                  │
│  Hoje                │                                                  │
│   · Prova de estequ… │                                                  │
└──────────────────────┴──────────────────────────────────────────────────┘
```

O desenho visual desta casca, com medidas e componentes, está na seção 11.1.

- **Seletor de escola no topo**, no formato de seletor de espaço de trabalho: sigla, rede, turno e
  número de turmas. Professor dá aula em mais de uma escola (regra 50, item 13). **Trocar de
  escola troca o token** para a nova escola ativa e descarta o cache da anterior inteiro; nenhuma
  lista junta turmas de duas escolas (regra 10; P30)
- **Nova conversa** abre a Home, que é a caixa de pedido do **Assistente de ensino** (D32
  revista), com contexto de turma e material. Tudo que existe em Ferramentas pode ser pedido por
  aqui
- **Ferramentas** é o catálogo em quatro categorias (D74, seção 1.2), com os mesmos fluxos em
  formato de formulário para quem não quer conversar, e a **Biblioteca** com o que já foi gerado
  (P13)
- **Calendário** mostra a semana e o dia por escola e turma: aulas, avaliações, entregas e o que
  o Assistente concluiu. Deriva da estrutura da escola: o professor não monta nem move aula
  (regra 60, item 8). Nasce no F8 (P12)
- **Turmas** (antes "Meu painel", com a aba "Minhas turmas"; D69 e D73) é a lista das turmas do
  professor e, ao lado, **Meu uso**, o espelho da D45: é dele primeiro, o que a coordenação vê
  dele é agregado, e o nominal só abre com auditoria. A tela diz isso em português comum. A
  **turma aberta** mostra o desempenho da turma e de cada aluno por habilidade: nasce no F6 com o
  diagnóstico, ganha os sinais do Tutor no F10 e a comparação da série no F12 (D69). **Quais
  abas ela tem** — as nove do mockup, a sala de carteiras, Recursos e Mural — fecha no PRD da A3
  (P11, P28). Na A1 a turma já existe para o professor ver os alunos e aprovar quem reivindicou o
  nome (D4, D71 revista)
- **Seu time** é um grupo da lateral com os dois agentes que o professor vê: o **Assistente de
  ensino**, por onde chegam as funções que trabalham sozinhas (correção de objetiva, adaptação,
  "seu dia e sua semana"), e o **Tutor**, que o professor supervisiona (D8, D47). Cada um abre a
  própria conversa em tela cheia, com o contador do que espera o professor (seção 1.3)
- **Histórico** lista as conversas do professor, agrupadas por data (hoje, ontem, 7 dias, mês),
  cada uma no próprio endereço. A coordenação nunca vê (regra 70, item 8; P06)
- **Cada item só aparece quando a fase dele existir.** Pela D71 revista, a A1 abre com Turmas;
  Nova conversa, Ferramentas, Seu time e Histórico entram com a A2; Calendário, com o F8.
  **Projetos** e **Fixados** só entram se o `/descobrir` do P05 aceitar

### 1.1 Chat e ferramenta são o mesmo motor (D18)

O professor pode escolher a ferramenta no próprio chat: no menu **Ferramenta** da caixa de
pedido, que lê o mesmo catálogo da página (P17), ou digitando `/` (desenho na seção 11.2).

Quando ele **não escolheu** e o pedido corresponde a uma ferramenta, o chat pergunta antes
de gerar:

```
Camila:      monta uma prova de estequiometria pro 2ºB, dez questões

Assistente:  Posso fazer isso com a ferramenta Prova, ou só conversar.
             ┌─────────────────────────────┬─────────────────────────────┐
             │ ▦ Usar a ferramenta Prova   │ ◌ Só conversar              │
             │ Salva na biblioteca, liga   │ Respondo aqui, sem salvar   │
             │ ao 2ºB e cita a página.     │ nada.                       │
             └─────────────────────────────┴─────────────────────────────┘
```

As duas opções têm o mesmo peso, e nenhuma é a "certa" (D59). Depois da escolha, o cartão
encolhe para uma linha (P16).

Com o sim, a ferramenta aparece **como cartão dentro da conversa**, já preenchida com o que
foi entendido (turma 2ºB, tema estequiometria, dez questões). O professor ajusta os campos e
gera. O resultado é o mesmo artefato do formulário: salvo, ligado à turma, no calendário,
com a página de origem.

Com "só conversar", o chat responde normalmente, sem artefato salvo, e continua citando o
material.

Consequências técnicas:

- Cada ferramenta tem **um** contrato de entrada e **um** caso de uso no backend. O chat e o
  formulário chamam o mesmo caso de uso. Não existem dois jeitos de gerar prova
- Detectar a intenção usa perfil `rapido` (regra 30). Gerar a prova usa o perfil da ferramenta
- A pergunta existe para não gastar token gerando o que o professor não pediu
- O detector de intenção distingue o pedido que tem ferramenta, que pergunta antes, do pedido que
  o chat responde direto (D74; P24). Os dois lados entram no conjunto de avaliação do F5 e do F7

**Busca na web** (D68): desligada por padrão. O professor liga por conversa, num controle
dentro da caixa de pedido; a resposta que usa fonte de fora vem rotulada "da web", com o
link, separada de "material da escola, página X". Nada que vem da web entra na base da
escola.

### 1.2 Ferramentas (F7)

**É ferramenta o que entrega um output próprio** — coisa com formato, que fica na biblioteca, sai
em arquivo e pode ser aplicada. **O que o chat já responde** (e-mail, recado, ideia de atividade,
resumo de um texto) **não é ferramenta: é pedido ao Assistente** (D74; P24). A regra decide o que
entra no catálogo daqui para frente. As ferramentas do roteiro, nas quatro categorias:

| Categoria | Ferramentas |
|---|---|
| **Planejar** | Plano de aula e sequência didática |
| **Preparar a aula** | **Apresentação** (roteiro e slides a partir do material) · **Material didático** (resumo, texto de apoio, revisão; fora da primeira entrega) · **Adaptação**, em que o professor escolhe o **tipo de adaptação** e nunca descreve o aluno em texto livre (D35, D67) |
| **Avaliar** | Prova (gabarito, versões) · Atividade e lista · Simulado ENEM a partir do banco público (D21) |
| **Corrigir** | **Correção de objetiva** com diagnóstico por habilidade, que é função do Assistente e nasce da entrega, não de pedido · **Redação e discursiva**: a ferramenta gera **rubrica e critérios** antes da aplicação, organiza o lote e apoia a correção cega, e **a IA não corrige, não avalia, não dá nota nem conceito e não escreve devolutiva** sobre o texto do aluno (D55). Quem escreve a devolutiva é o professor, na tela, com a rubrica ao lado |

O mockup propõe mais oito: planejamento do período, projeto, plano de recuperação, mapa mental,
roteiro de experimento, avaliação diagnóstica, proposta de redação e importar prova (P22). **Elas
não estão no roteiro**: cada uma passa por `/descobrir` antes do F7, e a tela mostra só as que
existem.

Toda ferramenta produz um **artefato** que fica na biblioteca, ligado à turma e ao
calendário, e toda saída cita material e página. O artefato **exporta em PDF, PowerPoint
(PPTX) e Excel (XLSX)**, conforme o tipo e o que o professor pedir, além da impressão (D67). De
onde vêm as imagens da apresentação está em aberto.

No código, **a ferramenta é dado**: um contrato por ferramenta em `packages/shared`, e o
formulário derivado do schema dele, em vez de uma tela escrita à mão por ferramenta (P23; Tech
Spec da A2).

### 1.3 Seu time: os agentes do professor (F11)

- **Dois agentes na lateral: o Assistente de ensino e o Tutor** (D17, D32 revista). Corretor,
  Planejador e Adaptador deixaram de ser agentes: são **funções do Assistente** — correção de
  objetiva, adaptação, e "seu dia e sua semana", que abre o dia com o que já existe e só gera
  plano quando o professor pede
- **A conversa do Assistente** junta o que as funções fizeram, com filtro: tudo · esperando você ·
  correção · adaptação · seu dia (P14). Cada mensagem diz o que foi feito e, quando aplicável,
  **o que está esperando**: "Corrigi as 32 provas do 2ºB, média 6,4. Esperando você aprovar"
- **A conversa do Tutor** é onde o professor recebe o que o Tutor viu no uso da turma: quem
  travou e onde, quem errou muito, quem pediu resposta pronta, a principal dificuldade, a
  dúvida que se repetiu. Dentro do horário útil da escola (D59)
- **A autonomia é mostrada por função**, em português comum ("corrigir objetiva: faz e avisa;
  diagnóstico ao aluno: espera você"), e a coordenação suspende uma função sem desligar o chat
  (D9 e D60 revistas)
- **Nunca aparece vazio** para professor com turma (regra 50, item 6). Com grade (F2, F8), "seu
  dia" abre o dia com as aulas e as avaliações; antes dela, a conversa do Assistente abre com o
  que já existe na turma e um convite para pedir
- O formato de conversa, com a caixa de resposta, está na seção 11.4 (P29)

### 1.4 Aprovar nota

A ação que não pode virar clique reflexo (regra 50, item 8; regra 70). Entra quando a nota
oficial entrar (D46); até lá, o professor aprova devolutiva e diagnóstico com as mesmas
regras de mostrar antes de confirmar. Em discursiva, a nota e a devolutiva são escritas pelo
professor, sem valor nem texto sugerido pela IA (D55).

- Aprovação individual mostra **aluno, avaliação e valor** antes de confirmar
- Aprovação em lote mostra o resumo e **destaca os casos fora da curva** no topo: nota muito
  distante da média do aluno, prova em branco, item com padrão de erro suspeito
- Rejeitar pede justificativa
- O botão de aprovar o lote fica desabilitado enquanto os destacados não forem abertos (D33)
- A tela **grava o registro da validação**: o que foi apresentado, quais destaques foram
  abertos, quem confirmou e quando (D56). É esse registro que prova, para a escola e para a
  fiscalização, que houve validação qualificada — e não um clique

O desenho da tela, com a cor própria da ação oficial, está na seção 11.5.

### 1.5 Modo sala (F10)

- Mostra **sinal, não conversa**: quem travou, quem pediu resposta pronta, dúvida que se
  repetiu (regra 50, item 10)
- Abrir a conversa de um aluno é ação explícita e fica em auditoria
- Sem inferência de estado emocional (regra 70, item 7)
- Com a busca do Tutor ligada, o professor vê o que a turma pesquisou e quais fontes foram
  abertas (D68)

### 1.6 Prova online: saída da aba (D70)

- Antes de começar, o aluno lê que sair da aba da prova é mostrado ao professor
- O professor vê o fato ("saiu da aba 3 vezes"), junto dos outros destaques do lote. Nada
  acontece sozinho com a prova nem com a nota
- Não existe fora de avaliação, não vira histórico do aluno e não aparece para a coordenação

---

## 2. Área do aluno (F9)

Computador da escola em sala; fora da sala, também o celular, quando a escola liga o modo
casa (D19, D51). Nenhum fluxo exige o celular. Login pela conta Google ou Microsoft da
escola, quando existe, ou por escola + matrícula + senha (D48). A mesma área serve do 6º ano
ao 3º do Ensino Médio; a linguagem do tutor e os textos precisam funcionar para um aluno de
11 anos (D43).

*Proposta de navegação:*

- **Tutor**, restrito ao conteúdo da turma, citando a página do material. Travado durante
  avaliação em andamento. Se apresenta pela função, como os outros agentes do time (D17, D58);
  **nunca afirma ser uma pessoa** e, perguntado sobre si, explica o que é, como funciona e que
  pode errar, em linguagem da faixa etária (D65)
- **Pesquisa em fontes aprovadas**, quando a escola liberou e o professor ligou para a turma
  (D68): o Tutor traz a fonte, pede para comparar, pergunta de volta, e não escreve o trabalho.
  A tela diz de onde veio cada informação, e que a pesquisa é vista pelo professor
- **O Tutor lembra de tudo que o aluno já fez no sistema** — atividades, trabalhos, avaliações
  e sessões (D66) —, e o aluno consegue ver o que o Tutor sabe sobre o trabalho dele e contestar
- **Quanto ainda dá para usar hoje**, do pacote do tutor (D38), mostrado como salvaguarda e
  não como punição, com o ponto de parada visível (D59)
- **Aviso de privacidade em linguagem de faixa etária** e caminho para **avisar um adulto**
  sobre algo errado no sistema — o canal de notificação do ECA Digital, art. 28 (D61)
- **Atividades e provas** atribuídas pelo professor
- **Meu desempenho**, só do próprio aluno
- Aviso visível e permanente de que o professor acompanha o uso do tutor (D8)

Proibido na tela do aluno: ranking, média da turma que permita deduzir nota de colega, lista
de quem entregou (regra 50, item 9). Proibido também, por lei (Decreto 12.880, arts. 9º e 10;
D59): recompensa por tempo de uso, sequência de dias, conteúdo que começa sozinho, rolagem
infinita, notificação fora do horário útil, esconder o ponto de parada, e qualquer caminho de
sair, revogar ou ajustar privacidade que seja mais longo que o de aceitar.

Fora da sala, o tutor só aparece se a escola ligou o modo casa para aquela turma (D19).
Desligado, a tela explica que o tutor funciona em sala, sem parecer erro.

O desenho da área, e o que o design do aluno **não** herda do professor, está na seção 11.6.

---

## 3. Área da coordenação

*Proposta de navegação:*

- **Estrutura**: séries, turmas, listas de nomes, grade horária e calendário importados,
  alocação de professor × turma × disciplina, convites de professor e conexão opcional com
  Google ou Microsoft (F1, F2; D3 revista, D48). É a primeira coisa que a coordenação faz, e
  precisa ser rápida (D24). A escola em si é criada por nós, no painel da operação (A0b, D76) ou
  pelo `ops:escola`, e a coordenação chega por convite (D2). Na A1 entra a parte fina: disciplinas e turmas criadas na tela, lista de nomes
  por turma, alocação e convite ao professor; grade horária e calendário vêm com o F2 (D71
  revista)
- **Material**: **só a coordenação sobe material para a base da escola**; professor e aluno não
  sobem (D75). Fontes com titularidade e licença, upload, estado da ingestão com o que entrou,
  o que falhou, o que está pendente e o que foi recusado por falta de licença (F4,
  D5 revista)
- **Governança** (F12), a tela que fecha a venda:
  - uso de IA por série e disciplina; por professor só com abertura auditada (D45). **Sem
    ranking, sem lista nominal de adoção e sem alerta de professor que não usa** (D64)
  - o que a IA gerou e quem aprovou, com o número; notas aprovadas por humano quando a nota
    oficial existir (D46)
  - desempenho por série, turma e habilidade
  - alertas em agregado, como hipótese com contexto: média fora da curva, habilidade em
    queda, aluno em risco. Nada de ranking de professor
  - consumo de IA do mês contra o orçamento
- **Analista de desempenho escolar**: resumo de segunda de manhã e alertas na hora, em
  agregado; recorte com um professor só conta como nominal (D32 e D45 revistas)
- **Adaptações**: registro da adaptação necessária por aluno, nunca diagnóstico (D35)
- **Agentes**: os três agentes e **as funções de cada um**, com o que cada função faz sozinha e o
  que espera aprovação, em português comum (D9 revista). É a tela para apontar quando alguém
  pergunta "o que essa IA faz sozinha?". Cada função de alto risco mostra o **resumo da avaliação
  de impacto**, o que ela **não** faz e o botão de **suspender só aquela função**, sem desligar o
  resto (D60 revista; P19)
- **Conformidade**: o dossiê da escola em um lugar — declaração de propósito e faixas etárias,
  como o sistema funciona em linguagem simples, conformidade com LGPD e ECA Digital, relatório
  de uso exportável, e o material para conversar com professores e famílias (D61). É a tela
  que a coordenação abre na reunião, e a que responde ao checklist do MEC
- **Denúncias**: o canal de notificação de violação, com o que foi apontado, o que foi feito e
  o recurso, dizendo se a análise foi humana ou automatizada (D61)
- **Exportar**: dado, artefato e histórico de uso em formato aberto, a qualquer momento, sem
  depender de nós (D63)
- **Auditoria**: para qualquer item, o que a IA gerou, quem aprovou e quando
- **Configurações da escola**: política de tutor, modo casa por turma (D19), busca do Tutor em
  fontes aprovadas — liberar na escola e ajustar a lista de fontes (D68) —, retenção

MFA obrigatório para coordenação (F1).

Como os onze itens se agrupam na lateral está na seção 11.1, e o desenho da Governança, na 11.7.

---

## 4. Área da rede (F14)

Consolidado por escola, comparativo e adoção. **Nunca** dado individual de aluno, nunca
conversa de tutor (regra 10, item 8).

## 5. Área da família

Fase posterior (D11). Nota, entrega e alerta, alimentados pelo motor de eventos do F13.

## 5a. Painel da operação Turmma (A0, D76)

Não é área da escola: é a nossa. Só o operador Turmma entra, com conta própria e segundo fator
obrigatório, e nenhuma pessoa de escola alcança estas telas.

- **Escolas**: a lista de redes e escolas, com o estado da primeira coordenação e contagens de
  turmas, alunos e professores ativos do ano em curso. Só número, nunca nome. Os estados são sete, e
  a tela os diz em texto, sem o identificador: sem convite, convite enviado e ainda não aberto,
  vencido, revogado, aceito sem o primeiro acesso, sem coordenação ativa, e ativa. Os textos exatos,
  e os das mensagens de cada ação, estão no cenário W10 da A0b
  (`tasks/prd-apresentacao-painel/cenarios.md`); as ações de cada estado saem da matriz da seção 5
  da Tech Spec da A0b
- **Nova rede** e **nova escola**: nome, tipo de rede e o endereço da escola
- **Convite da coordenação**: cadastrar a primeira coordenadora, copiar o link, revogar e refazer
- **Uso e custo**: por escola, no dia e no mês — o uso de infra desde já (D30), o consumo de IA
  com a A2, contra o teto por aluno (D39)

A pele e a casca são as mesmas do produto (D72), com a marca de que ali é a operação, para
ninguém confundir com a tela de uma escola.

---

## 6. Em toda tela

- Quatro estados: carregando, vazio, erro, com dado. **Vazio é convite para agir**
- Português do Brasil, data e número no formato local
- Erro diz o que fazer: "não foi possível salvar, tente de novo em instantes"
- Navegação por teclado, foco visível, contraste, rótulo em campo
- Lista longa virtualizada. Nada que assuma máquina boa
- **Toda saída de IA é rotulada como tal**, com a fonte e a página quando vem do material, e
  com quem aprovou quando já passou por aprovação (o selo está desenhado na seção 11.3)
- **Sem padrão manipulativo** (D59): nenhuma urgência fabricada, nenhum botão que esconde a
  ação menos lucrativa para nós, e o caminho de recusar do mesmo tamanho do de aceitar
- **Responsiva desde a primeira versão** (D51): do computador da escola ao celular, a
  partir de 360 px. No celular, o menu lateral da área do professor vira navegação
  recolhível, e o chat, o feed e as ferramentas cabem numa coluna. Toque em vez de hover,
  alvo de toque de 44 px na ação principal. Nenhum fluxo exige o celular
- **Padrão de espaço** (D72; P03): aba de navegação **não tem título nem descrição** — a lateral
  já diz onde a pessoa está. O `<h1>` existe só para leitor de tela, e cada rota tem o próprio
  `document.title` (regra 50, item 11). Só tela de **objeto** mostra nome: uma prova aberta, o
  formulário de uma ferramenta, o modo sala. As medidas estão na seção 9.3
- **Tela de trabalho cabe na janela** e rola por dentro: Calendário, Turmas, Seu time. O Gabriel
  revisou numa janela de uns 780 px de altura útil, e no Chromebook de 1366 × 768 sobra menos: o
  e2e do projeto `chromebook` prova que a grade continua legível, e, se não couber, ela rola por
  dentro em vez de espremer

## 7. Em aberto

- **A revisão do Gabriel, em mockup (19 e 20/09/2026, oito rodadas), foi decidida em 23/09/2026
  no que travava a A1 e a A2**: um agente por pessoa (P01 → D32, D9 e D60 revistas), a pele do
  ChatGPT em tudo, com o padrão de espaço (P02, P03 e P31 → D72), a navegação do professor (P04
  → D73) e a regra "ferramenta ou chat", com as quatro categorias (P22 → D74). As seções 1, 6, 8,
  9, 11 e 12 já descrevem a versão decidida. O mockup está na pasta `mockups/`, só para consulta:
  nada de lá é copiado para o `apps/web`. O registro item por item continua em
  `docs/pendencias-dos-mockups.md`
- **Continua em aberto, da mesma revisão:** Projetos (P05), anexo na conversa (P07), faltas e a
  aba Frequência (P08), ranking de participação (P26, que bate na 10.3), as abas da turma aberta
  com Recursos e Mural (P28, antes do PRD da A3), as oito ferramentas novas do catálogo (P22) e a
  licença das peças coladas no mockup (P20)
- **Trazer para `apps/web`** os tokens da seção 9.9 e os SVGs da marca (`mockups/public/marca/`, em
  curvas, sem baixar a Fustat) — é a primeira tarefa de tela da A0 (D76), que migra também as telas
  do F1; o avatar dos três agentes entra na A1. Hoje a casca do F0 ainda usa a paleta `slate`
- **Avatar dos três agentes**: há proposta na seção 9.7, tirada do mockup; o Gabriel fecha o
  desenho antes da Tech Spec da A1. A landing page ainda lista os agentes antigos: alinhar junto
- **Licença das duas peças marcadas "a conferir"** na seção 10.2 (`shadcn/item` e
  `shadcn/spinner`: o 21st.dev não declara, a origem shadcn/ui é MIT), antes de o código entrar
- **Vestir a família Agent Elements**: 121 classes de cor fixa e 63 variantes `dark:` trocadas à
  mão nas sete peças do chat (10.2). O mockup apontou a rampa `neutral` para os cinzas do ChatGPT,
  e esse atalho não entra no produto. Entra na estimativa da A2
- **`color-mix()` no Chrome 109**: confirmar no projeto `chromebook` do e2e o que o build faz com
  modificador de opacidade, e reprovar `color-mix(` no CSS servido se ele não rebaixar (9.9)
- **Onde moram os componentes trazidos do 21st.dev** dentro de `apps/web`, o `components.json`
  e a troca de roteador, se houver (Joaquim, na Tech Spec da A1)
- **Orçamento de JS** com markdown, calendário e gráfico fora do primeiro carregamento (seção
  10.4): o limite de 150 kB de hoje mede o build inteiro, porque a casca do F0 não tem import
  dinâmico (Joaquim)
- Ilustração do painel da tela de entrada (seção 11.8)
- Modo escuro: fora. Os tokens são semânticos para ele poder existir depois sem reescrever tela
- Detalhe de navegação do aluno e da coordenação, a fechar nos PRDs da A1, do F9 e do F12
- Indicadores da turma aberta e do Meu uso: quais, limiar e texto do alerta (decisão em aberto no
  `CLAUDE.md`; o ponto de partida do mockup está no P11)
- Imagens da ferramenta de apresentação (D67)

---

# Parte B — Design

## 8. Direção de design

### 8.1 De onde vem

**Decidido** (D72, 23/09/2026). A direção de 19/09/2026 tinha três fontes; a revisão em mockup
trocou a pele e juntou uma quarta referência, só de estrutura.

| Fonte | O que ela dá | O que ela não dá |
|---|---|---|
| **ChatGPT** (tema claro de `chatgpt.com`, medido em 19/09/2026) | A **pele**: superfícies brancas, a rampa de cinzas, a fonte do sistema, botão em pílula, item de menu de 36 px com canto de 10, caixa de pedido com canto de 28 e sombra suave, a pergunta centralizada na Home | Seletor de modelo e o que é de produto aberto ao público (8.3) |
| **Mulerun** (`mulerun.com/pt-BR/chat`) | A **estrutura** da casca: lateral recolhível, Home que é uma caixa de pedido no centro, histórico na lateral, tela de entrada dividida | Cor, fonte, tom e qualquer coisa de modelo de IA |
| **A marca** (manual em `~/Code/turmma-marca`; os arquivos em `mockups/public/marca/`) | A **pinta**, o logotipo em Fustat e o **laranja** `#E8732E` | A pele da landing page — papel, creme, azul-noite, Fustat nos títulos —, que continua só na landing page |
| **Teachy** | A **estrutura** de Ferramentas e de Turmas: o catálogo em categorias e a turma aberta com abas (P28) | A pele: fonte, canto, medidas e ícones copiados ficam de fora (8.3; P31) |
| **21st.dev** | As **peças**: todo componente de interface sai do catálogo (seção 10), vestido com os nossos tokens | Decisão de produto. O catálogo tem coisa que aqui é proibida por lei (seção 10.3) |

### 8.2 O que pegamos do ChatGPT e do Mulerun

Medido nas telas públicas em 19/09/2026:

- **Duas regiões.** Lateral de **260 px** em `lateral`, um degrau abaixo do branco, sem borda
  pesada; conteúdo no branco. A lateral recolhe por um botão no topo dela
- **Anatomia da lateral**, de cima para baixo: marca e botão de recolher · seletor de escola ·
  "Nova conversa" · itens de navegação com ícone e rótulo, em linhas de **36 px** com canto de
  **10 px** · os grupos "Seu time" e "Histórico", com rótulo cinza e sem caixa-alta · rodapé com
  a pessoa
- **Home = uma pergunta.** Coluna central de **~760 px**: a pergunta em 28 px e peso normal, a
  caixa de pedido grande com canto de **28 px** e a sombra suave do ChatGPT, e embaixo só o que
  espera a professora (11.2)
- **A caixa de pedido tem barra própria**: à esquerda o que se acrescenta ao pedido
  (ferramenta, web), à direita o seletor de turma e o botão redondo de enviar
- **Quase sem sombra.** A hierarquia vem de tom de fundo e de linha fina, não de elevação
- **Botão em pílula**, 14 px em peso 500
- **Entrada dividida**: o painel da marca de um lado, o formulário do outro

### 8.3 O que não pegamos

- **Seletor de modelo** ("Pro ▾"). Perfil de modelo é interno (regra 30). No lugar dele entra o
  **seletor de turma**, que é o contexto que o professor de fato escolhe
- **Adesivo de novidade** sobre botão ("GPT Image 2") e selo "Beta" espalhado: urgência e
  novidade fabricadas não entram (D59)
- **Emoji na moldura da interface** (o aceno da saudação). Renderiza diferente em cada sistema
  e tira a sobriedade que a marca pede para a mesa da coordenação
- **Cor em `oklch()`**. Não existe no Chrome 109 do laboratório, e o e2e já reprova `oklch()` no
  CSS servido. Tudo aqui é hex
- **Animação decorativa em laço** (o brilho que fica passando na pílula). Ver 9.5
- "Baixar apps", "Entrar" flutuante no canto, vitrine de casos de uso: são de produto aberto ao
  público, e aqui não existe cadastro público (D2)
- **Da Teachy, a pele** (P31): Quicksand e Inter, canto de 8 px, título em toda aba, as medidas
  tiradas da tela deles e ícones com acentos fora da paleta. Duas peles dobram o trabalho da A1 e
  da A2, duas fontes a mais pesam no Chromebook, e copiar layout e medida de concorrente direto
  abre risco de concorrência desleal (trade dress)
- **Da landing page, a pele** (P02): papel, creme, azul-noite e Fustat nos títulos. O Gabriel viu
  dentro do produto e rejeitou; ela continua valendo na landing page

### 8.4 Os seis princípios

1. **Uma tela, uma pergunta.** A professora tem quarenta minutos e uma xícara de café na mão
   (regra 50). A Home é uma caixa de pedido; cada outra tela tem uma ação principal, e só uma
2. **Branco no chão, preto na decisão, laranja no que espera você.** O chão é branco e cinza.
   O **preto fica reservado para a decisão oficial**: aprovar, publicar, confirmar. O botão de
   aprovar não se parece com nenhum outro botão do produto, e isso é de propósito: é o que
   combate o clique reflexo (regra 50, item 8). O **laranja aparece pouco** — a pinta, o
   enviar, o contador, o que espera a pessoa —, e por isso chama quando aparece
3. **A IA sempre assina.** Toda saída de IA leva o avatar do agente, o selo "IA", a fonte com
   página e, depois de aprovada, quem aprovou (regra 70; D58). Nunca um texto solto na tela
4. **Calmo por lei.** Nada pisca para chamar de volta, nada comemora tempo de uso, nada começa
   sozinho (D59). Na área do aluno o movimento é só resposta ao que ele fez
5. **Leve por contrato.** O alvo é o Chromebook de entrada em rede de escola. CSS antes de
   JavaScript, `transform` e `opacity` antes de qualquer outra propriedade, e o que pesa
   carrega só na tela que usa (10.4)
6. **Nada genérico, nada solto.** Peça de interface vem do 21st.dev e é vestida com os tokens
   da Turmma. Não se escreve do zero o que o catálogo tem, e não entra peça com a cor de fábrica.
   **Uma pele só** em todas as telas (D72)

---

## 9. Fundamentos visuais

### 9.1 Cor

**Três cores e mais nenhuma** (D72): branco, preto e o laranja da pinta `#E8732E`. Verde e
vermelho só aparecem em estado. Os valores são os medidos no mockup (`mockups/src/index.css`),
com os **nomes** de token que a interface já usava — `noite` virou preto e `creme` virou cinza, e
o nome ficou. Tudo em **hex**. Contraste medido (WCAG 2.1) entre parênteses.

**Chão e estrutura** — a rampa de cinzas do ChatGPT:

| Token | Hex | Uso |
|---|---|---|
| `fundo` | `#FFFFFF` | Fundo do app |
| `superficie` | `#FFFFFF` | Cartão, caixa de pedido, campo, menu. Separa do fundo pela linha, não pelo tom |
| `lateral` | `#F9F9F9` | Fundo da lateral |
| `realce` | `#ECECEC` | Selecionado: item da lateral, linha de tabela. Dá 1,1:1 contra a lateral e 1,2:1 contra o branco — perceptível, mas discreto, então **selecionado nunca é só o fundo** (11.1) |
| `realce-suave` | `#F4F4F4` | Hover de botão, de item de menu e de linha |
| `linha` | `#E8E8E8` | Divisor e borda de cartão. Decorativa: nunca é a única pista de um controle |
| `borda-campo` | `#8F8F8F` | Borda de campo e de botão secundário (3,2:1 no branco, 3,1:1 na lateral — passa o 3:1 de componente). **O mockup usa `#D9D9D9`, que dá 1,4:1 e reprova**: a borda do ChatGPT não serve para campo de formulário de escola |

**Texto:**

| Token | Hex | Uso |
|---|---|---|
| `tinta` | `#0D0D0D` | Texto principal (19,4:1 no branco; 18,5:1 na lateral) |
| `apoio` | `#424242` | Texto de apoio (10,0:1 no branco; 9,5:1 na lateral) |
| `sutil` | `#5D5D5D` | Placeholder, metadado, rótulo de grupo, segunda linha da pergunta (6,6:1 no branco; 6,3:1 na lateral; 5,6:1 no realce). É o piso: nada de texto mais claro que isto |
| `inativo` | `#8F8F8F` | Só controle desabilitado (3,2:1) |

**Marca e decisão:**

| Token | Hex | Uso |
|---|---|---|
| `caramelo` | `#E8732E` | O laranja. Preenchimento da ação primária **com texto `tinta` em cima** (6,4:1), a pinta, o ladrilho do Tutor, o contador do que espera você. Aparece pouco, de propósito |
| `caramelo-claro` | `#EE8747` | Hover da ação primária (7,6:1 com `tinta`) |
| `caramelo-fundo` | `#D4651F` | Pressionado (5,3:1 com `tinta`) |
| `caramelo-texto` | `#B4520F` | Laranja **como texto** e link (5,1:1 no branco) |
| `caramelo-noite` | `#F2A25B` | Anel de foco sobre fundo preto (9,3:1) |
| `noite` | `#0D0D0D` | O preto: ação oficial, dica flutuante, anel de foco (branco em cima: 19,4:1) |
| `noite-alto` | `#2F2F2F` | Hover da ação oficial (13,4:1) |
| `noite-baixo` | `#000000` | Pressionado da ação oficial |
| `creme` | `#F4F4F4` | Bolha de quem escreve, como a do ChatGPT |
| `papel` | `#F4F3F0` | Só o painel da tela de entrada (11.8) |

Duas proibições que a landing page já pagou para aprender continuam: **laranja nunca é texto**
sobre claro (3,0:1 no branco; para isso existe `caramelo-texto`) e **branco nunca vai em cima do
laranja** (3,0:1). Por isso a ação primária é laranja com texto preto.

**Estado** — cada família é um fundo e um texto:

| Família | Fundo | Texto | Quando |
|---|---|---|---|
| `pendente` | `#FDF0E8` | `#8A3E0C` (6,8:1) | "Esperando você". Nesta marca pendência é laranja, não âmbar |
| `ok` | `#E9F5EE` | `#0B6B47` (5,8:1) | Aprovado, conferido, salvo. É a segunda voz do produto: metade do argumento é "um humano aprovou" |
| `erro` | `#FDECEC` | `#B42318` (5,8:1) | Erro, rejeição, ação destrutiva |
| `info` | `#F4F4F4` | `#0D0D0D` (17,7:1) | Aviso permanente (o professor acompanha o Tutor), explicação de autonomia. Cinza: aviso não é alarme |
| `ia` | `#F0F0F0` | `#424242` (8,8:1) | O selo "IA" e o chip de fonte. Neutro de propósito: o selo informa, não chama |

Do mockup **não entram**: `marca-cx`, `marca-cx-forte`, `rank-1` a `rank-3` e as fontes
`font-teachy` e `font-teachy-corpo`, que são da pele da Teachy e do ranking (P26, P31).

Estado nunca é só cor: vem sempre com texto ou ícone (regra 50, item 11). Só tema claro.

### 9.2 Tipografia

**A fonte do sistema**, como no ChatGPT: `ui-sans-serif, -apple-system, system-ui, "Segoe UI",
Helvetica, Arial, sans-serif`. No Chromebook ela cai na fonte do próprio ChromeOS, sem baixar
nada. A **Fustat 600** (12 KB, `woff2` com subconjunto latino, servida pelo próprio app) fica
**só no logotipo** "Turmma" (D72). Não entra outra fonte web: o primeiro carregamento fica mais
leve que com as duas fontes da landing page (regra 50).

| Papel | Peso | Tamanho / entrelinha | Onde |
|---|---|---|---|
| Pergunta da Home | 400 | `clamp(24px, 3vw, 28px)` / 1,25 · −0,01em | Home |
| Título de objeto | 600 | 22 / 1,25 · −0,015em | Só tela de objeto (seção 6; 9.3) |
| Título de cartão | 600 | 16 / 1,35 | Cartão, conversa, diálogo |
| Número de painel | 600 | 28 / 1 · `tabular-nums` | Governança, Turmas |
| Corpo | 400 | 16 / 1,5 | Conversa, formulário, texto do aluno |
| Interface densa | 400–500 | 14 / 1,45 | Tabela, metadado, botão, item de menu |
| Rótulo de grupo | 500 | 13 / 1,2 · **sem caixa-alta**, em `sutil` | "Seu time", "Histórico", cabeçalho de tabela |

Na área do aluno o corpo nunca desce de 16 px (o leitor tem 11 anos, D43). Em nenhuma área
existe texto menor que 12 px. Coluna de leitura de até 72 caracteres.

**Número em Fustat não leva `tabular-nums`**: nela o recurso alarga ponto e vírgula ("3 . 412").
Se um número um dia for para a Fustat, fica proporcional (P02).

### 9.3 Forma, espaço e elevação

- **Canto:** 8 px em chip e selo · 10 px em item de menu e da lateral · 12 px em campo · 16 px em
  cartão, bolha e menu flutuante · 28 px na caixa de pedido e em diálogo · **botão em pílula** ·
  círculo em botão de enviar, avatar de pessoa e contador
- **Margem da página** (P03): 16 px no celular e 24 px a partir de 768 px; topo de 16 a 20 px, fim
  de 32 px
- **Vãos:** grade de 4 px. 16 px entre blocos, 12 px entre cartões de uma grade, 16 px dentro do
  cartão (20 px a partir de 1024 px)
- **Uma barra de 36 px no topo** com os controles da página — abas, filtros, busca. Ela é o
  cabeçalho: aba de navegação não tem título nem descrição (seção 6)
- **Largura fluida** até 1480 px em grade e tabela, 1040 px em formulário, 760 px em leitura e
  conversa
- **Tela de trabalho** (Calendário, Turmas, Seu time) ocupa a altura da janela e rola por dentro;
  linha de grade tem sempre a mesma altura, com ou sem conteúdo
- **Grade CSS com `minmax(0, 1fr)`**, nunca `1fr` sozinho: com texto que não quebra, a coluna
  estoura a 360 px (P02)
- **Altura de controle:** 44 px em toda ação principal e em tudo no celular (regra 50, item
  2a); 36 px em controle secundário no computador, nunca com alvo de toque menor que 24 px
- **Elevação:** o padrão é **linha fina, sem sombra**. A caixa de pedido leva a sombra suave do
  ChatGPT, `0 0 0 1px rgba(0,0,0,.04), 0 2px 8px rgba(0,0,0,.04), 0 4px 80px 8px rgba(0,0,0,.024)`.
  O que flutua — menu, dica, diálogo, aviso temporário — leva uma só:
  `0 0 0 1px rgba(0,0,0,.05), 0 8px 28px -6px rgba(0,0,0,.16)`
- **Fora:** vidro fosco (`backdrop-filter`), degradê animado, brilho de borda, fundo em canvas,
  WebGL ou shader. Custam quadro no Chromebook e não dizem nada

### 9.4 Ícones

- **Uma biblioteca só: `lucide-react`**, importada ícone a ícone. É a que a landing page já usa
  e a que quase todo componente do 21st.dev traz. O 21st.dev não tem conjunto de ícones
  próprio: quando a peça vier com outra (`@tabler/icons-react` em parte dos Agent Elements,
  `@remixicon/react`, `@hugeicons`, `@radix-ui/react-icons`), o ícone é **trocado pelo
  equivalente do lucide na adoção**. Duas bibliotecas de ícone no pacote é reprovação de revisão
- Traço de 1,75 px. 18 px na lateral, 16 px dentro de texto e chip, 20 px em botão só de ícone
- **Na navegação, ícone sempre com rótulo.** Botão só de ícone leva `aria-label` e dica, e a
  dica não é o único jeito de descobrir o que ele faz no celular (sem hover): ali o rótulo aparece
- Logo de terceiro (Google e Microsoft na entrada) vem do `21st logo`, em SVG, seguindo a regra
  de marca de cada um
- **Ícone ilustrado só em Ferramentas** (P17): no cartão e na página de cada ferramenta, o ícone
  é ilustração em SVG feita por nós, chapada, sem contorno, sem sombra e sem ladrilho, e **dentro
  das três cores** (D72) — os acentos verde-água, amarelo, rosa, roxo e azul da oitava rodada do
  mockup saem. São cerca de 25 kB de código na rota de Ferramentas, fora do primeiro carregamento
  (10.4). Em tamanho pequeno, e no resto do produto, continua lucide

### 9.5 Movimento

As curvas são as da landing page, para o produto e a página terem a mesma mão; a entrada ficou
mais curta no mockup (420 ms, contra os 640 da landing page):

| Intenção | Duração | Curva | Exemplos |
|---|---|---|---|
| Estado | 150 ms | `cubic-bezier(.2,0,0,1)` | Hover, pressionar, foco, marcar |
| Gesto | 260 ms | `cubic-bezier(.2,0,0,1)` | Abrir menu, recolher a lateral, trocar de aba, expandir cartão |
| Entrada | até 420 ms | `cubic-bezier(.22,1,.36,1)` | Pergunta da Home, mensagem nova, cartão de ferramenta |

Regras:

1. **Só `transform` e `opacity`.** Nada de animar `blur`, `height`, `box-shadow` ou
   `background-position` em área grande: são as que travam máquina fraca
2. **CSS primeiro.** A biblioteca `motion` (ex-Framer Motion) **não entra no primeiro
   carregamento**. Peça do 21st.dev que dependa dela é portada para CSS na adoção — a landing
   page já tem a técnica pronta (revelar palavra a palavra, cascata, cursor em degrau) — ou não
   é adotada. Se um dia um gesto exigir JavaScript, entra por `LazyMotion`, em pedaço separado
3. **Nenhum laço decorativo.** Em laço só roda o que mostra trabalho acontecendo: o cursor do
   texto chegando, os três pontos de "pensando", o esqueleto de carregamento (pulso de
   opacidade, não faixa de brilho correndo)
4. **A pergunta da Home entra uma vez por sessão**, palavra a palavra, e nenhum brilho fica
   passando
5. **Texto da IA chega em fluxo, sem efeito por letra.** Enquanto chega, o botão de enviar vira
   "Parar"
6. **`prefers-reduced-motion`** desliga tudo que desloca; sobra só troca de opacidade de até
   150 ms
7. **Área do aluno: só as linhas "Estado" e "Gesto", mais o carregamento.** Sem coreografia de
   entrada, sem número subindo, sem confete, sem nada que premie ficar (D59)

### 9.6 A marca na interface

- **Pinta + "Turmma" em Fustat** no topo da lateral; recolhida, fica só a pinta. `favicon` e
  ícone de aplicativo são o `turmma-icone.svg`. Os arquivos da marca (`turmma-icone.svg`,
  `turmma-negativo.svg`, `turmma-pinta.svg`) vêm de `mockups/public/marca/` e são do manual: é a
  única coisa da pasta que entra no `apps/web` como está
- A pinta **não gira, não estica e não troca de cor** fora das versões do manual. Não vira
  indicador de carregamento
- **Cada turma tem a pinta dela** (manual da marca): o sistema gera uma pinta própria, sempre a
  mesma para aquela turma, e ela é o avatar da turma no seletor, no calendário e nos cartões.
  *Proposta:* entra na A1, que é onde a turma passa a ser criada (D71 revista)
- A roseta pode aparecer como padrão estático, bem apagada, no painel da tela de entrada. Em
  nenhuma outra tela do produto há textura de fundo

### 9.7 Avatar dos agentes

*Proposta do mockup; o Gabriel fecha o desenho antes da Tech Spec da A1.* São **três** agentes
(D32 revista). O agente tem identidade de função e **nunca parece uma pessoa** (D17, D58): sem
rosto, sem foto, sem nome próprio, sem mascote. O avatar é um **ladrilho** com o mesmo canto do
ícone da marca (24% do lado), dentro das três cores, com o **ícone da função** dentro. Quem
conversa tem cor cheia:

| Agente | Ladrilho | Ícone (lucide) | Cor do ícone |
|---|---|---|---|
| Assistente de ensino | `#0D0D0D` | `messages-square` | branco (19,4:1) |
| Tutor | `#E8732E` | `message-circle-question` | tinta (6,4:1) |
| Analista de desempenho escolar | `#F0F0F0` | `chart-column` | tinta (17,1:1) |

As **funções** do Assistente não têm avatar próprio. O ícone delas — `clipboard-check` na
correção de objetiva, `sliders-horizontal` na adaptação, `calendar-days` em "seu dia e sua
semana" — aparece no filtro da conversa e no cartão de entrega, sempre com o nome ao lado
("Assistente · correção de objetiva").

Tamanhos: 24 px na linha da mensagem, 32 px na lateral, 48 px no cabeçalho da conversa e na tela
Agentes da coordenação. A cor ajuda, mas o **nome da função aparece sempre ao lado**: o avatar
nunca é a única identificação. O ponto de estado ao lado do avatar diz só que há algo esperando
você, nunca "online" — agente não fica "online" como gente (D59; P29).

### 9.8 Tom da interface

- **Frase curta, verbo na frente, sem ponto de exclamação e sem "Ops".** "Salvo na biblioteca."
  "Não foi possível salvar. Tente de novo em instantes."
- **O agente fala na primeira pessoa da função** e diz o que fez e o que espera: "Corrigi as 32
  provas do 2ºB, média 6,4. Esperando você aprovar." Nunca simula afeto ("senti sua falta") nem
  pressa ("só hoje") (D58, D59)
- **Botão diz o que acontece**, com o objeto: "Aprovar 32 correções", não "Confirmar"; "Exportar
  em PDF", não "OK"
- **Vazio convida:** "Nenhuma prova ainda. Peça uma ao Assistente de ensino ou abra a ferramenta
  Prova." (regra 50, item 5)
- **Aluno:** palavra de 11 anos, sem jargão, sem ironia. "O Tutor é um programa de computador.
  Ele pode errar. Seu professor vê como você usa."
- **Número, data e hora** no formato local; autonomia de agente em português comum ("faz e
  avisa", "prepara e espera você"), nunca "nível 2"

### 9.9 Os tokens, como entram no código

No Tailwind 4 de `apps/web` a paleta de fábrica já é zerada e só volta cor em hex (casca do F0).
A paleta `slate`/`blue` de hoje dá lugar a esta, que é a do mockup com uma troca só, a
`borda-campo` (9.1):

```css
@theme {
  --color-*: initial;
  --color-white: #FFFFFF;        --color-black: #000000;

  /* chão e estrutura: a rampa de cinzas do ChatGPT */
  --color-fundo: #FFFFFF;        --color-superficie: #FFFFFF;
  --color-lateral: #F9F9F9;      --color-realce: #ECECEC;
  --color-realce-suave: #F4F4F4;
  --color-linha: #E8E8E8;        --color-borda-campo: #8F8F8F;
  /* texto */
  --color-tinta: #0D0D0D;        --color-apoio: #424242;
  --color-sutil: #5D5D5D;        --color-inativo: #8F8F8F;
  /* a única cor: o laranja da pinta */
  --color-caramelo: #E8732E;     --color-caramelo-claro: #EE8747;
  --color-caramelo-fundo: #D4651F;   --color-caramelo-texto: #B4520F;
  --color-caramelo-noite: #F2A25B;
  /* o preto da decisão oficial */
  --color-noite: #0D0D0D;        --color-noite-alto: #2F2F2F;
  --color-noite-baixo: #000000;
  --color-creme: #F4F4F4;        --color-papel: #F4F3F0;
  /* estado: fundo e texto */
  --color-pendente-cx: #FDF0E8;  --color-pendente: #8A3E0C;
  --color-ok-cx: #E9F5EE;        --color-ok: #0B6B47;
  --color-erro-cx: #FDECEC;      --color-erro: #B42318;
  --color-info-cx: #F4F4F4;      --color-info: #0D0D0D;
  --color-ia-cx: #F0F0F0;        --color-ia: #424242;

  --font-corpo: ui-sans-serif, -apple-system, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
  --font-titulo: ui-sans-serif, -apple-system, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
  --font-marca: "Fustat", ui-sans-serif, system-ui, sans-serif;

  --radius-linha: 10px;  --radius-controle: 12px;
  --radius-cartao: 16px; --radius-caixa: 28px;

  --shadow-caixa: 0 0 0 1px rgba(0,0,0,.04), 0 2px 8px rgba(0,0,0,.04), 0 4px 80px 8px rgba(0,0,0,.024);
  --shadow-flutua: 0 0 0 1px rgba(0,0,0,.05), 0 8px 28px -6px rgba(0,0,0,.16);

  --t-estado: 150ms; --t-gesto: 260ms; --t-entrada: 420ms;
  --curva-estado: cubic-bezier(.2,0,0,1);
  --curva-entrada: cubic-bezier(.22,1,.36,1);
}
```

**A ponte com o 21st.dev.** As peças do catálogo são escritas no vocabulário do shadcn
(`bg-background`, `text-muted-foreground`, `border-border`…). Em vez de reescrever classe por
classe, esse vocabulário vira **apelido** dos nossos tokens, no mesmo `@theme`.

A lista abaixo é a dos nomes que as peças do mapa (10.2) **de fato usam**, tirada do código
delas:

| Nome do shadcn | Aponta para | Nome do shadcn | Aponta para |
|---|---|---|---|
| `background` | `fundo` | `primary`, `sidebar-primary` | `noite` |
| `foreground`, `card-foreground`, `popover-foreground` | `tinta` | `primary-foreground`, `sidebar-primary-foreground` | branco |
| `card`, `popover` | `superficie` | `secondary`, `muted`, `accent` | `realce-suave` |
| `muted-foreground` | `sutil` | `secondary-foreground`, `accent-foreground` | `tinta` |
| `border`, `sidebar-border` | `linha` | `input` | `borda-campo` |
| `ring`, `sidebar-ring` | `noite` | `destructive` · `destructive-foreground` | `erro` · branco (6,6:1) |
| `sidebar` | `lateral` | `sidebar-accent` | `realce` |
| `sidebar-foreground`, `sidebar-accent-foreground` | `tinta` | | |

**`primary` do shadcn aponta para o preto, não para o laranja.** Nas peças do catálogo, `primary`
é o botão cheio de sempre, e o laranja aqui é raro de propósito: a nossa ação primária é a
variante `primario` do botão (11.1). `accent` é o fundo de hover e de item em foco nos menus do
shadcn, e por isso aponta para `realce-suave`.

Peça que usa cor de fábrica direta (`neutral-200`, `zinc-900`, variante `dark:`) **sai sem cor
nenhuma**, porque a paleta é zerada — é assim que a revisão pega peça não vestida. O mockup
apontou a rampa `neutral` para os cinzas do ChatGPT para vestir as peças de uma vez; no produto,
esse atalho não entra (7). **Foco:** contorno de 2 px em `noite` com 2 px de afastamento; sobre
fundo preto, `caramelo-noite` (9,3:1). Várias peças trazem `outline-none` no campo de texto: sai,
para o foco global valer.

**Modificador de opacidade em cor não entra** (`bg-primary/90`, `bg-black/80`, `text-tinta/50`).
Conferido no Tailwind 4.3.3 do repositório: ele vira `color-mix()` nos dois ramos que o Tailwind
gera, e `color-mix()` só existe a partir do Chrome 111. Se o build não rebaixar isso para cor
fixa, no Chrome 109 do laboratório a declaração é descartada: o hover não muda, e o fundo
escurecido do diálogo simplesmente não aparece. Na adoção, troca-se por token em hex (os hovers
já têm: `caramelo-claro`, `noite-alto`, `realce-suave`) ou por `rgba()` literal no fundo de
diálogo. Vale pedir ao e2e que reprove `color-mix(` no CSS servido, como já reprova `oklch(`
(Joaquim).

---

## 10. Componentes: tudo vem do 21st.dev

### 10.1 O protocolo de adoção

**Direção dada:** nenhuma peça de interface genérica, e nada escrito do zero que o catálogo
tenha. Como isso convive com as regras do repositório:

1. **Procurar antes de escrever.** `21st search "<o que é>"`. O PRD ou a tarefa de tela registra
   qual peça foi usada (`autor/slug`). Só se escreve do zero o que é do nosso domínio e não
   existe lá (o registro da validação, o selo de IA), e mesmo isso é montado sobre peças de lá
2. **Licença declarada e permissiva**: MIT, Apache-2.0 ou ISC, anotada na tarefa. Peça **sem
   licença** no catálogo é "todos os direitos reservados" e **não entra**; copyleft (MPL, GPL)
   também não. É a mesma disciplina do material didático (D5): o que não tem licença não entra
   por nenhum caminho
3. **Dependência na lista.** Livre: `clsx`, `tailwind-merge`, `class-variance-authority`,
   primitivos `@radix-ui/react-*`, `lucide-react`, e `tw-animate-css` — é só CSS, e é o que dá a
   abertura e o fechamento de menu, diálogo, seletor e dica do shadcn (`animate-in`,
   `fade-in-0`…); sem ele tudo funciona, só abre seco. **Só em pedaço carregado sob demanda:**
   `react-markdown`, `remark-gfm`, `date-fns`, `react-day-picker`, `recharts`, `sonner`, `cmdk`,
   `react-dropzone`. **Fora:** `motion`/`framer-motion` no primeiro carregamento, segunda
   biblioteca de primitivos (`@heroui`, `@ark-ui`, `@base-ui-components`, `antd`, `@mui`),
   segunda biblioteca de ícones, `three` e afins, e qualquer `next/*` — somos SPA com Vite
4. **Vestir.** A peça entra com os tokens da 9.9, as fontes da 9.2 e os ícones da 9.4. Sem cor
   de fábrica, sem `oklch()`, sem variante `dark:`, **sem modificador de opacidade em cor** (9.9)
   e sem `outline-none` que apague o foco. Peça no vocabulário do shadcn se veste sozinha pela
   ponte; peça com cor fixa é troca à mão, e o tamanho dessa troca entra na estimativa da tarefa
5. **Passar na regra 50.** Teclado e foco visível, alvo de 44 px na ação principal, 360 px sem
   rolagem horizontal, **nada que só apareça no hover**, os quatro estados, `motion-reduce` em
   toda animação em laço, e o teste com CPU e rede limitadas. O `frontend-reviewer` audita como
   qualquer tela
6. **Peça pronta grande perde para peça pequena montada.** Se o bloco pronto não tem lugar para
   o que é nosso (cartão de ferramenta, citação, selo de IA, registro da validação), ele vira
   referência, e a tela é composta com as peças menores do mesmo catálogo. Foi o que a leitura
   do código decidiu para a conversa, a pergunta da D18, a citação e a entrada (10.2)
7. **O código da peça é nosso depois de entrar.** Vai para o repositório, é revisado e testado
   como código do produto (D71: fatia fina não é atalho). A conta do 21st.dev está no plano
   pago: busca e código sem limite. A geração por IA do 21st não está ligada, e não faz falta

### 10.2 O mapa de peças

Levantado no catálogo em 19/09/2026 e **conferido no código**: as peças foram baixadas pelo CLI
(`21st get <id>`) e lidas contra o protocolo da 10.1 — o que cada uma importa, cor de fábrica,
variante `dark:`, modificador de opacidade, `motion`, `next/*`, biblioteca de ícones, o que só
aparece no hover e o que respeita `prefers-reduced-motion`. A licença vem da página da peça. O
número ao lado do endereço é o id para `21st get`. A conferência de acessibilidade em tela
acontece na adoção.

**O que a leitura do código mostrou, em quatro linhas:**

1. **As peças do shadcn já vêm no vocabulário semântico** (`bg-background`, `text-muted-foreground`),
   sem cor de fábrica e sem `dark:`. A ponte da 9.9 veste todas sem tocar no arquivo
2. **A família Agent Elements, que é a base do chat, não vem.** Tem zero classe semântica: nas
   sete peças adotadas são **121 classes `neutral-*` e 63 variantes `dark:`** em 1.167 linhas. O
   desenho é o melhor do catálogo e a dependência é quase nenhuma, mas vestir é troca à mão,
   arquivo por arquivo. É o trabalho de tela mais caro da A2 e precisa estar na estimativa
3. **Dezesseis peças usam modificador de opacidade** (`bg-primary/90`, `bg-black/80`), inclusive
   `shadcn/button`, `dialog`, `sheet` e `alert-dialog`. Ver a regra nova na 10.1, item 4
4. **Nenhuma animação em laço das peças respeita `prefers-reduced-motion`** (o brilho do
   "gerando…", os três pontos, o pulso do esqueleto). Entra `motion-reduce:` na adoção

**A casca**

| Para | Peça (`autor/slug` · id) | Depende de | Licença | Ao adotar |
|---|---|---|---|---|
| Lateral dos três papéis, trilho recolhido, gaveta no celular | `shadcn/sidebar` · 1627 | Radix (dialog, tooltip, separator, slot), lucide; traz `sheet`, `skeleton`, `tooltip`, `separator`, `button`, `input` | MIT | 764 linhas, toda semântica. Trocar as constantes: `SIDEBAR_WIDTH` de 16rem para **260px**, `SIDEBAR_WIDTH_ICON` de 3rem para **56px** (alvo de toque). Já vem com atalho Ctrl/⌘+B e guarda aberto/fechado num cookie `sidebar_state` de 7 dias: é preferência de tela, não dado sensível, mas é cookie — o Joaquim decide se fica ou vai para memória |
| Gaveta do celular | `shadcn/sheet` | Radix dialog | MIT | Vem junto com a lateral. O fundo escurecido usa `bg-black/80`: trocar (10.1, item 4) |
| Seletor de escola, menu da pessoa | `shadcn/dropdown-menu` · 1574 | Radix | MIT | — |
| Dica de botão só de ícone | `shadcn/tooltip` · 1277 | Radix | MIT | Nunca é a única fonte do rótulo |
| Buscar (atalho de teclado) | `shadcn/command` · 714 | `cmdk`, Radix dialog | MIT | Sob demanda. Fora do MVP |

**O chat — do Assistente de ensino e do Tutor.** A conversa é **montada por nós com peças
pequenas**, e não adotada como um bloco só. A peça pronta do catálogo, `serafimcloud/agent-chat`
(12402), foi lida e **não serve como moldura**: a mensagem dela só aceita texto e erro (não há
lugar para cartão de ferramenta, citação nem selo), ela não expõe a barra da caixa de pedido, e
carrega dentro uma cópia da `input-bar`. Fica como referência de composição.

As peças da família Agent Elements aparecem no site sob o time `@21st`, mas **o endereço de
instalação é o do autor**: `21st add serafimcloud/<slug>`.

| Para | Peça (`autor/slug` · id) | Depende de | Licença | Ao adotar |
|---|---|---|---|---|
| **Moldura de cada mensagem**: avatar, cabeçalho (nome do agente + selo "IA"), conteúdo, rodapé de ações, alinhamento | `shadcn/message` · 19072 | — | MIT | Semântica, 95 linhas. É onde mora a assinatura da IA (11.3) |
| **Caixa de pedido** com barra | `serafimcloud/input-bar` · 12399 | `clsx`, `tailwind-merge` | MIT | Tem o que precisamos: `leftActions` e `rightActions` (Ferramenta, Web, turma), `status` e `onStop` (enviar vira Parar), `placeholder`. Vestir: 32 `neutral-*`, 17 `dark:`. **Corrigir:** o botão de remover anexo só aparece no hover e tem 16 a 20 px — fica sempre visível, com 24 px no mínimo (regra 50, item 2a). Anexo fora do MVP |
| Seletor de ferramenta e de turma | `serafimcloud/mode-selector` · 12356 | + `@tabler/icons-react` | MIT | Ícones para lucide. Vestir: 21 `neutral-*` |
| Atalhos de ferramenta | `serafimcloud/suggestions` · 12342 | — | MIT | 62 linhas, sem ícone próprio. Quebra em duas linhas no celular |
| Mensagem de quem escreve | `serafimcloud/user-message` · 12353 | — | MIT | Bolha em `creme` |
| Resposta da IA em fluxo, com tabela e link | `serafimcloud/markdown` · 12396 | `react-markdown`, `remark-gfm` | MIT | Sob demanda. É a que mais custa vestir: 44 `neutral-*`, 23 `dark:` |
| "Pensando" | `jakobhoeg/message-loading` · 1380 | — | MIT | SVG puro, 48 linhas. Acrescentar `motion-reduce` |
| "Gerando a prova…" | `serafimcloud/generic-tool` · 12376 | — | MIT | Ícone, título e detalhe; o título ganha brilho enquanto `isPending`. O brilho é laço que mostra trabalho (9.5, regra 3), em área do tamanho de uma linha. Acrescentar `motion-reduce` |
| Erro e **degradação declarada** (regra 80, item 4) | `serafimcloud/error-message` · 12394 | — | MIT | 35 linhas. Texto nosso: "Muita gente usando agora. Sua resposta sai em instantes." |
| **A pergunta da D18** ("Quer usar a ferramenta Prova?") | `shadcn/card` · 1551 + dois `shadcn/button` | — | MIT | **Um clique, dois botões do mesmo peso** (D59). A peça de pergunta do catálogo (`serafimcloud/question-tool`, 12420) foi lida e descartada: pede selecionar a opção **e depois** enviar, tem 585 linhas e 60 `neutral-*`, para resolver o que dois botões resolvem |
| **Cartão de ferramenta** dentro da conversa | `shadcn/card` · 1551 + os campos de "Ferramentas, em formulário" | — | MIT | É o mesmo formulário da ferramenta, não um segundo. A peça que parecia servir de base (`serafimcloud/edit-tool`, 12388) é um visualizador de diff de código: dela só vale a ideia do rodapé com duas ações |
| **Citação de página** dentro do texto | `shadcn/popover` · 1320 + o selo (`sean0205/badge-2`) | Radix popover | MIT | Abre por **clique e por teclado**, e por isso funciona no toque. A peça pronta (`vercel-crawled/inline-citation`, 5249) abre por hover e arrasta `embla-carousel-react` e onze arquivos: descartada |
| Lista de fontes ao fim da resposta | `shadcn/collapsible` · 847 | Radix collapsible | MIT | Duas variantes de linha: "material da escola, p. X" e "da web" (D68). Referência de desenho: `vercel-crawled/sources` (5257), que é cópia rastreada e não declara licença |

**Seu time e a aprovação**

| Para | Peça (`autor/slug` · id) | Depende de | Licença | Ao adotar |
|---|---|---|---|---|
| Linha de agente na lateral; cartão de entrega (o que fez, o que espera, ações) | `shadcn/item` · 8669 | Radix (slot, avatar, separator, dropdown) | a conferir (o 21st não declara; a origem, shadcn/ui, é MIT) | Semântica. O cartão de entrega usa `shadcn/card` quando precisa de corpo |
| Base do avatar de agente e da pinta da turma | `shadcn/avatar` · 707 | Radix avatar | MIT | Ladrilho da 9.7, não círculo |
| Contador de não lidos, selo de estado, selo "IA", chip de fonte | `sean0205/badge-2` · 3560 | `radix-ui` | MIT | Trocar o pacote único pelo primitivo avulso. Vem com 56 classes de cor viva e 26 `dark:` para uma dúzia de variantes: **ficam só as cinco famílias da 9.1** (`pendente`, `ok`, `erro`, `info`, `ia`) e o resto sai |
| Destaque fora da curva, aviso permanente do aluno | `shadcn/alert` · 1170 | `cva` | MIT | 60 linhas, semântica; as variantes são as famílias `pendente` e `info`. (A `sean0205/alert-1`, 3587, faz o mesmo com 264 linhas e 32 cores vivas) |
| Lote de correções, governança, auditoria | `shadcn/table` · 721 | — | MIT | Vira lista no celular; virtualizada quando longa (regra 50) |
| Confirmar ação oficial | `shadcn/alert-dialog` · 705 | Radix | MIT | Mostra aluno, avaliação e valor (regra 50, item 8). Fundo escurecido: trocar a opacidade |
| Rejeitar com justificativa, detalhes | `shadcn/dialog` · 1248 | Radix | MIT | Idem |

**Ferramentas, em formulário**

| Para | Peça (`autor/slug` · id) | Depende de | Licença | Ao adotar |
|---|---|---|---|---|
| Botão, nas cinco variantes da 11.1 | `shadcn/button` · 1323 | Radix slot, `cva` | MIT | Variante `oficial` é nossa. O hover de fábrica é `bg-primary/90`: trocar por `caramelo-claro` e `noite-alto` |
| Botão trabalhando | `shadcn/spinner` · 8677 | lucide | a conferir | 17 linhas |
| Campos | `shadcn/input` · 1442, `textarea` · 1281, `select` · 788, `checkbox` · 1289, `radio-group` · 1410, `switch` · 1364, `label` · 1549 | Radix | MIT | Borda em `borda-campo`; `inputmode` e `autocomplete` certos |
| Importação da coordenação em passos | `originui/stepper` · 778 | `@radix-ui/react-icons` | MIT | Ícones para lucide |
| Envio de material com licença | `haydenbleasel/dropzone` · 542 | `react-dropzone` | MIT | Sob demanda; recusa sem licença antes de enviar (D5) |
| Abas de Turmas e da turma aberta | `shadcn/tabs` · 953 | Radix | MIT | — |

**Painéis, calendário e estados**

| Para | Peça (`autor/slug` · id) | Depende de | Licença | Ao adotar |
|---|---|---|---|---|
| Acerto por habilidade, consumo contra orçamento, uso do dia do aluno | `shadcn/progress` · 826 | Radix | MIT | Barra com rótulo e número ao lado; no aluno, cor neutra |
| Gráfico de série no tempo | `shadcn/chart` · 982 | `recharts` | MIT | Sob demanda, e só quando houver série de verdade (F12). O MVP vive de barra |
| Calendário do professor | `ahmedmayara/fullscreen-calendar` · 640 | `date-fns` | MIT | Sob demanda. É visão de mês, sem localidade ligada: passar `ptBR` do `date-fns`; semana e dia são adaptação nossa. Fora do MVP |
| Vazio que convida | `serafimcloud/empty-state` · 1435 | lucide | MIT | Semântica. Veste o `EstadoVazio` que já existe |
| Carregando | `shadcn/skeleton` · 1588 | — | MIT | Pulso de opacidade. Acrescentar `motion-reduce` |
| Aviso temporário ("Salvo", "Exportado") | `shadcn/sonner` · 886 | `sonner` | MIT | Sob demanda. Nunca para erro que pede ação |
| Entrada | `shadcn/card`, `input`, `label`, `button` | — | MIT | Montada com os nossos campos. A peça de entrada do catálogo (`preetsuthar17/clean-minimal-sign-in`, 2110) é um formulário de e-mail e senha com texto em inglês e cor fixa: serve de **referência de layout**, não de base — o aluno aqui nem tem e-mail (D48) |

**Referência de movimento** — o desenho vem do catálogo, a implementação é CSS (9.5). As duas
foram lidas e dependem de `motion`, como esperado: saudação, de `tom_ui/blur-reveal` (18544,
MIT), sem o desfoque; brilho de uma passada na pílula, de `preetsuthar17/shining-text` (1865, MIT).

### 10.3 O que o catálogo tem e aqui é proibido

Não é questão de gosto: cada linha bate em regra ou em lei.

| O que aparece no catálogo | Por que não entra |
|---|---|
| Selo de sequência de dias, placar, pódio, tabela de classificação (`streak-badge`, `leaderboard-*`) | D59 e Decreto 12.880, arts. 9º e 10 (recompensa por uso); regra 50, item 9 (ranking de aluno); D64 (ranking de professor) |
| Contagem regressiva, "só hoje", adesivo de novidade | D59: urgência fabricada |
| Seletor de humor ou de emoção, histórico de comportamento | Regra 70, item 7, e D57: o produto não infere nem registra estado emocional |
| Avatar de IA com rosto, foto ou nome de gente; "orbe" que pulsa como presença viva | D58 e Decreto 12.880, art. 11: o agente não se passa por pessoa nem simula vínculo. Os orbes ainda são canvas e WebGL (9.3) |
| Letreiro correndo, rolagem infinita, carrossel que anda sozinho | D59: conteúdo que começa sozinho, rolagem infinita |
| Fundo de shader, globo 3D, brilho de borda animado, vidro fosco | Regra 50, item 1: custa quadro no Chromebook |
| Moldura de celular e de notebook para exibir tela | É peça de landing page e de material de venda, não de produto |
| Qualquer peça sem licença, ou com `next/*`, ou com biblioteca de primitivos própria | 10.1, itens 2 e 3 |

### 10.4 Orçamento

O limite de hoje é **150 kB de JS (brotli)**, medido sobre o build inteiro porque a casca do F0
não tem import dinâmico. Com telas de verdade, *proposta para a Tech Spec da A1*: o limite
continua valendo para o **primeiro carregamento** (casca, entrada, lateral, Home vazia), e cada
área pesada vira pedaço próprio, carregado quando a pessoa chega nela:

| Pedaço | O que carrega | Quando |
|---|---|---|
| Inicial | React, TanStack Query, roteador, lateral, caixa de pedido, botões, estados | Sempre |
| Conversa | `react-markdown`, `remark-gfm`, citação, cartões | Na primeira resposta da IA |
| Painéis | `recharts`, quando existir | Ao abrir Turmas ou Governança |
| Ferramentas | os ícones ilustrados (9.4) e o motor do formulário (P23) | Ao abrir Ferramentas |
| Calendário | `date-fns`, a peça do calendário | Ao abrir Calendário |
| Material | `react-dropzone` | Ao abrir Material (coordenação) |

Fonte: só a Fustat do logotipo, 12 KB, com `preload`. Nenhuma imagem decorativa acima de 30 KB;
ilustração da entrada em SVG ou WebP.

---

## 11. A casca e as telas-chave

### 11.1 A casca, igual nos três papéis

```
┌────────────────────────┬──────────────────────────────────────────────────────────┐
│ ◉ Turmma             ⇤ │ (barra de 36 px: abas, filtros e busca da seção)         │
│ [ Escola ▾ ]           │                                                          │
│                        │                                                          │
│ ✎  Nova conversa       │              conteúdo da seção, em coluna                │
│ ▦  Ferramentas         │      de até 760 px (conversa), 1040 px (formulário)      │
│ ▤  Calendário          │               ou 1480 px (grade e tabela)                │
│ ◫  Turmas              │                                                          │
│                        │                                                          │
│ Seu time             ˅ │                                                          │
│  ▣ Assistente      (3) │                                                          │
│  ▣ Tutor           (2) │                                                          │
│ Histórico            ˅ │                                                          │
│  Hoje                  │                                                          │
│   Prova de estequiom…  │                                                          │
│                        │                                                          │
│ (CS) Camila Souza    ⋯ │                                                          │
└────────────────────────┴──────────────────────────────────────────────────────────┘
  lateral · 260 px · `lateral`            conteúdo · `fundo`
```

- **Topo da lateral:** pinta + "Turmma" em Fustat, o botão de recolher, e logo abaixo o
  **seletor de escola**, no formato de seletor de espaço de trabalho: sigla, rede, turno, turmas e
  a marca de escolhido (regra 50, item 13; P30). Para quem tem uma escola só, ele mostra o nome e
  não abre
- **"Nova conversa"** é item da lista, como no ChatGPT, e não botão cheio: o laranja da tela é do
  botão de enviar
- **Itens** em linhas de 36 px (44 px no celular), canto de 10 px, ícone de 18 px + rótulo.
  Selecionado tem **três pistas, não uma**: fundo `realce`, texto `tinta` em peso 600 e um
  filete de 3 px em `caramelo` na borda esquerda — o fundo sozinho dá 1,1:1 e some na tela de um
  Chromebook de entrada. O mockup mostra só o fundo; o produto leva as três
- **Seu time**: uma linha por agente, com avatar e contador — em `caramelo` quando há algo
  esperando o professor, em `tinta` quando é só mensagem não lida (P14). O rótulo do grupo é
  cinza, sem caixa-alta
- **Histórico** recolhível, agrupado por data, só o título de cada conversa, com vazio próprio
  ("Nenhuma conversa ainda")
- **Rodapé:** a pessoa, o papel e o menu dela, no modelo do ChatGPT (P18): o nome, "Personalizar
  o Assistente", "Configurações", "Como a IA funciona aqui", "Ajuda" e **Sair** — a um clique, do
  mesmo tamanho de qualquer outro item (D59). Cada entrada nasce com a fase dela; a A1 tem "Como a
  IA funciona aqui" e "Sair" (P09)
- **Recolhida**, a lateral vira trilho de 56 px com os ícones, os avatares e um ponto no agente
  que tem pendência, e a dica de cada um. Nenhum rótulo sobra cortado (P04)
- **Botões**, cinco variantes e nenhuma outra, todas em pílula:

| Variante | Aparência | Para |
|---|---|---|
| `primario` | fundo `caramelo`, texto `tinta` | **A** ação da tela: enviar, gerar, salvar. No máximo um por tela |
| `oficial` | fundo `noite` (o preto), texto branco | **Só decisão oficial**: aprovar, publicar, confirmar envio (8.4, princípio 2) |
| `secundario` | fundo `superficie`, borda `borda-campo`, texto `tinta`; hover `realce-suave` | A alternativa, e as duas opções de uma escolha de peso igual |
| `discreto` | sem fundo, texto `sutil`; hover `realce-suave` e texto `tinta` | Ação de linha, de barra, de cartão |
| `perigo` | texto `erro`; cheio em `erro`, com texto branco, só dentro do diálogo de confirmação | Rejeitar, excluir, revogar |

**O que cada papel vê na lateral:**

| Professor (**decidido**, D73; seção 1) | Aluno (*proposta*) | Coordenação (*proposta*: os onze itens da seção 3 em três grupos e um rodapé) |
|---|---|---|
| Nova conversa · Ferramentas · Calendário · Turmas · **Seu time** (Assistente, Tutor) · **Histórico** | Tutor · Atividades e provas · Meu desempenho · O que o Tutor sabe de mim · rodapé fixo: **Avisar um adulto** e Privacidade | **Escola:** Estrutura, Material, Adaptações · **IA e ensino:** Governança, Analista, Agentes · **Conformidade:** Conformidade, Denúncias, Auditoria, Exportar · rodapé: Configurações |

A coordenação abre em **Governança**, não em chat: é a tela que fecha a venda — enquanto ela não
existe (A5), abre em **Estrutura**, que é onde a escola se monta (A1). O aluno abre no **Tutor**
quando ele está ligado para a turma, e em **Atividades e provas** quando não está.

**Responsivo** (D51):

| Largura | Casca |
|---|---|
| ≥ 1024 px (o Chromebook de 1366 × 768 cai aqui) | Lateral aberta de 260 px; recolhe para o trilho por escolha, e a escolha fica guardada |
| 768 a 1023 px | Trilho de 56 px por padrão; abre por cima do conteúdo |
| < 768 px, a partir de 360 px | Barra de 56 px no topo com o botão do menu, a pinta e a escola; a lateral vira gaveta; conteúdo em uma coluna com 16 px de margem; tabela vira lista |

Na conversa, em qualquer largura, a caixa de pedido fica presa embaixo e a lista rola por trás.

### 11.2 Home do professor

```
              Bom dia, Camila.
              O que vamos preparar hoje?

   ┌──────────────────────────────────────────────────────────────────────┐
   │ Peça uma prova, uma atividade, um plano de aula…                     │
   │                                                                      │
   │ [ ▦ Ferramenta ▾ ]  [ ◎ Web: desligada ]    [ 2ºB · Química ▾ ]  (↑) │
   └──────────────────────────────────────────────────────────────────────┘

   Esperando você
   ┌──────────────────────────────────┐ ┌──────────────────────────────────┐
   │ ☑ Correção de objetiva           │ │ ⚙ Adaptação                      │
   │ 32 provas do 2ºB corrigidas.     │ │ Versão com fonte ampliada da     │
   │ Abra os 5 destaques. [ Revisar ] │ │ lista 3 pronta.      [ Abrir ]   │
   └──────────────────────────────────┘ └──────────────────────────────────┘

   Hoje: 3 aulas e 1 entrega em atraso  → Calendário
```

- **A pergunta** vem pela hora, com o primeiro nome, em 28 px e peso normal; a segunda linha em
  `sutil`. Entra uma vez por sessão (9.5)
- **Caixa de pedido:** à esquerda, o que muda o pedido — **Ferramenta** (D18) e **Web** (D68,
  desligada por padrão e dizendo isso no próprio botão). À direita, o contexto — a **turma**, no
  lugar onde o ChatGPT põe o modelo — e enviar. O menu **Ferramenta**, e o mesmo menu aberto
  digitando `/`, leem o catálogo da página (P17): um retângulo de 320 px por até 292 px que rola
  por dentro e vira para cima quando a janela é baixa. O anexo fica fora do MVP (P07); o lugar
  dele está reservado
- **Sem atalhos em pílula** abaixo da caixa (P15): as ferramentas já estão no menu dela
- **"Esperando você"** são as entregas que esperam a professora, em cartões com o ícone da
  função, o que foi feito e a ação. Só existe quando há entrega pendente. Sem pendência, não há
  cartão — e não há enfeite no lugar dele
- **A linha do dia** ("seu dia e sua semana") é atalho para o Calendário, e só existe quando
  houver grade (F2, F8). É o que faz a primeira tela mostrar o time trabalhando (regra 50, item
  6), no lugar onde o Mulerun põe anúncio de novidade. Uma só, sem laço de brilho

### 11.3 A conversa, o selo de IA e os cartões

```
                                          ┌──────────────────────────────────────┐
                                          │ monta uma prova de estequiometria    │
                                          │ pro 2ºB, dez questões                │
                                          └──────────────────────────────────────┘
  ▣ Assistente de ensino  [ IA ]
  Posso fazer isso com a ferramenta Prova, ou só conversar.
  ┌──────────────────────────────┬──────────────────────────────┐
  │ ▦ Usar a ferramenta Prova    │ ◌ Só conversar               │
  │ Salva na biblioteca, liga ao │ Respondo aqui, sem salvar    │
  │ 2ºB e cita a página.         │ nada.                        │
  └──────────────────────────────┴──────────────────────────────┘

  ┌ ▦ Prova · rascunho ────────────────────────────────────────────────────────────┐
  │ Turma  [ 2ºB ▾ ]    Tema  [ Estequiometria        ]    Questões  [ 10 ]        │
  │ Material  [ Química 2 — cap. 7 ▾ ]    Versões  [ 1 ▾ ]    Gabarito  [✓]        │
  │                                                 [ Cancelar ]   [ Gerar prova ] │
  └────────────────────────────────────────────────────────────────────────────────┘

  ▣ Assistente de ensino  [ IA ]
  1. Qual a massa de CO₂ formada na queima de 24 g de carbono? [ p. 142 ]
  …
  ▸ Fontes (3): Química 2, p. 142 · p. 145 · p. 151
  [ Copiar ]  [ Abrir na biblioteca ]  [ Exportar em PDF ]
```

- **Toda mensagem usa a mesma moldura** (`shadcn/message`, 10.2): avatar, cabeçalho, conteúdo e
  rodapé de ações. O conteúdo é que muda — texto, pergunta, cartão de ferramenta, aviso de fila
- **Quem escreve** fica à direita, em bolha `creme`. **A IA não tem bolha**: texto na largura da
  coluna, e no cabeçalho a **assinatura** — avatar do agente, nome da função e o **selo "IA"**
- **O selo de IA** (seção 6) é um conjunto só, igual em todo o produto: `[ IA ]` em família `ia`
  ao lado do nome do agente; o **chip de fonte** `[ p. 142 ]` dentro do texto, que abre material,
  página e trecho; e, depois da aprovação, a linha **"Aprovado por Camila Souza · 19/09, 10h42"**
  em família `ok`. Fonte de fora leva o chip **"da web"** com o link, de desenho diferente do chip
  de página (D68)
- **A pergunta da D18** é uma frase do Assistente e um cartão estreito com **duas opções do
  mesmo peso** — ícone, título e uma frase —, que encolhe para uma linha depois da escolha (P16).
  Nenhuma das duas é a "certa" (D59)
- **O cartão de ferramenta** é o formulário da própria ferramenta dentro da conversa: mesmos
  campos, mesmo contrato (seção 1.1). "Gerar" é `primario`. Na **Adaptação** o cartão tem a
  lista de **tipos de adaptação** e nenhum campo de texto livre (D35, D67)
- **As ações da resposta ficam sempre visíveis**, em `discreto`. Nada aparece só no hover
- Enquanto o texto chega, enviar vira **Parar**. Fila cheia ou provedor lento vira aviso dentro
  da conversa, nunca erro cru (regra 80, item 4)

### 11.4 Seu time

Cada agente abre a **própria conversa, em tela cheia**, pela linha dele na lateral; a coluna com a
lista de threads saiu (P14). No celular, a lateral e depois a conversa, com voltar.

```
┌ ▣ Assistente de ensino · o que cada função faz sozinha ⓘ ─────────────────────────┐
│ [ Tudo ] [ Esperando você 1 ] [ Correção ] [ Adaptação ] [ Seu dia ]              │
│ ┌ Esperando você ────────────────────────────────────────────────────────────────┐│
│ │ ☑ Correção de objetiva · 32 provas do 2ºB, 5 destaques         [ Revisar → ]  ││
│ └────────────────────────────────────────────────────────────────────────────────┘│
│  Hoje                                                                             │
│  ▣ ┌──────────────────────────────────────────────────┐                           │
│    │ Corrigi as 32 provas de estequiometria do 2ºB.   │                           │
│    │ Média 6,4. 5 casos fora da curva para abrir.     │                           │
│    └──────────────────────────────────────────────────┘                           │
│      [ Ver resumo ]  [ Revisar → ]                                                │
│                               ┌──────────────────────────────────────────────┐    │
│                               │ na próxima, faz com oito questões            │    │
│                               └──────────────────────────────────────────────┘    │
│ ┌──────────────────────────────────────────────────────────────────────────────┐  │
│ │ Responder ao Assistente…                                                (↑)  │  │
│ └──────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────┘
```

- **Formato de conversa** (P29): o agente fala em balão à esquerda e a professora responde à
  direita, com anexos e ações embaixo do balão. Aqui, e só aqui, a mensagem do agente tem balão;
  na conversa da Home a IA continua sem bolha (11.3). A faixa **"Esperando você"** fica presa no
  alto, e a caixa de resposta, no pé
- **Na conversa do Assistente, filtro por função**: tudo · esperando você · correção · adaptação ·
  seu dia (P14). Endereço antigo de agente (`/time/corretor`) abre o Assistente já filtrado
- **Responder ao agente é pedido novo**: é chamada de modelo, pela porta, com perfil e orçamento
  (regra 30, D14). Se esta conversa e a da Home são a mesma ou duas com fronteira clara, fecha no
  PRD do F11 (P29)
- **Ação dentro do balão** ("Revisar", "Aprovar") chama o mesmo caso de uso da aprovação
  registrada (regra 70, item 3): não é atalho em volta dela
- **O cabeçalho diz a autonomia por função**, em português comum (D9 revista), com o ⓘ abrindo o
  que cada função faz sozinha, o que espera aprovação e o que nunca faz
- **A entrega é um cartão** com o que foi feito, o que está esperando e o estado em selo:
  `pendente` "Esperando você", `ok` "Aprovado por…", `erro` "Rejeitado: <motivo>"
- A conversa do **Tutor** mostra **sinal, não conversa de aluno** (regra 50, item 10): o nome do
  aluno aparece só para o professor da turma (D34), e abrir a conversa de um aluno é ação à
  parte, com aviso de que fica em auditoria
- **Ponto de estado e não lidas não viram pressão de uso** (D59): o ponto só diz que há algo
  esperando você

### 11.5 Aprovar

```
┌ Revisar correções · Prova de estequiometria · 2ºB ───────────────────────────────────┐
│  32 provas   média 6,4   ▁▂▅▇▅▂▁   Assistente · correção de objetiva [ IA ]          │
│                                                                                      │
│  Abra estes 5 antes de aprovar                                                       │
│  !  Nota muito abaixo do histórico · Ana B. · 2,0 (costuma tirar 7,5)       [ Abrir ]│
│  !  Prova em branco · Caio M. · sem respostas                               [ Abrir ]│
│  ✓  Questão 7 com erro em 28 de 32 · aberto às 10h38                                 │
│                                                                                      │
│  As outras 27                                                       ( tabela )       │
├──────────────────────────────────────────────────────────────────────────────────────┤
│  3 de 5 destaques abertos        [ Rejeitar… ]    [ Aprovar 32 correções ]  (inativo)│
└──────────────────────────────────────────────────────────────────────────────────────┘
```

- **O botão de aprovar é o único `oficial` da tela**, mora numa barra presa embaixo, e fica
  inativo até o último destaque ser aberto — com o **contador ao lado dizendo por quê** (D33)
- Destaque fechado é `pendente`; aberto vira `ok`, com a hora. É a interface mostrando o que o
  **registro da validação** vai guardar (D56)
- Confirmar abre diálogo com **o que vai acontecer**: avaliação, turma, quantas correções, e que
  o diagnóstico chega aos alunos. Depois, a tela mostra "Validação registrada · Camila Souza ·
  19/09, 10h42"
- **Rejeitar** é `perigo` e pede justificativa
- Em discursiva esta tela não tem valor nem texto sugerido pela IA: só a rubrica ao lado e o
  campo do professor (D55)
- No MVP (A3) o que se aprova é **diagnóstico**, não nota (D46). O desenho é o mesmo

### 11.6 Área do aluno

A mesma casca, mais calma:

- **Faixa fixa no topo do Tutor**, em família `info`: "Seu professor acompanha como você usa o
  Tutor." Não fecha (D8)
- **A caixa de pedido é só texto e enviar.** Sem seletor, sem anexo, sem texto de exemplo que
  troca sozinho. Atalho, só para o que o professor atribuiu ("Continuar a atividade de
  estequiometria")
- **"Hoje: 12 de 60 perguntas"** em texto, com barra fina em cor neutra. Não fica vermelha, não
  pisca; no fim, diz com calma que por hoje acabou e que amanhã volta (D38, D59)
- **"Avisar um adulto"** fica sempre no rodapé da lateral, com o mesmo peso de qualquer item
  (D61)
- **Tutor travado em avaliação**, ou desligado fora da sala, é tela que explica, com ícone e uma
  frase. Não parece erro (D19)
- A assinatura do Tutor é a mesma dos outros agentes: avatar, "Tutor", selo "IA". Perguntado, ele
  diz o que é (D58, D65)
- **Não existe nesta área:** saudação animada, pílula, número subindo, selo de conquista,
  qualquer lista de colegas (regra 50, item 9; seção 9.5, regra 7)

### 11.7 Coordenação: Governança

```
┌ Governança de IA · setembro ─────────────────────────────────────────────────────────┐
│  ┌ Gerado por IA ┐  ┌ Aprovado por gente ┐  ┌ Esperando ┐  ┌ Consumo do mês ────────┐│
│  │  412          │  │  389               │  │  23       │  │ 61% do orçamento ▓▓▓░░ ││
│  └───────────────┘  └────────────────────┘  └───────────┘  └────────────────────────┘│
│                                                                                      │
│  O que a IA gerou e quem aprovou                          [ Exportar ]               │
│  ( tabela: quando · agente e função · o quê · turma · estado · aprovado por )        │
│                                                                                      │
│  Uso por série e disciplina                ( barras, em agregado )                   │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

- Quatro números em 28 px, peso 600, `tabular-nums`, com rótulo em cima. Sem gráfico onde um
  número basta
- A tabela é a consulta da regra 70, item 6. "Aprovado por" em `ok`, "Esperando" em `pendente`
- **Nenhuma coluna, filtro ou ordenação por professor** (D45, D64). Abrir o nominal é botão
  `oficial` à parte, com diálogo dizendo que fica em auditoria
- **Agentes** são três cartões, um por agente: avatar de 48 px, nome e três listas — *faz
  sozinho*, *espera aprovação*, *nunca faz*. O cartão do Assistente lista **as funções**, cada uma
  com a autonomia em português comum, o selo de alto risco, o resumo da AIA e o botão de
  **suspender só aquela função**. No registro, a linha diz "Assistente · correção de objetiva"
  (D9 e D60 revistas; P19)

### 11.8 Entrada

Tela dividida, como a do Mulerun, mas página inteira e não janela:

- **Esquerda (metade, some abaixo de 768 px e vira faixa de 96 px):** fundo `papel`, a roseta em
  padrão estático bem apagado, a marca e uma frase da landing page. Ilustração em
  aberto (seção 7)
- **Direita:** o formulário. **Aluno:** "Entrar com a conta da escola" (Google ou Microsoft,
  quando a escola tem) ou escola + matrícula + senha (D48). **Professor e coordenação:** o que o
  F1 definiu, com o segundo fator da coordenação. Não existe "Cadastre-se" (D2)
- Um `primario` só: "Entrar"

---

## 12. As telas do MVP de apresentação (A1 a A5)

O roteiro do `ROADMAP.md` (D71 revista), passo a passo, com a tela e onde ela está desenhada. A
Parte B vale desde a D72 e a D73 (23/09/2026). **Não existe seed com escola pronta**: tudo que a
demonstração mostra entra pelo próprio produto, com dado inventado (D71 revista).

| Passo do roteiro | Tela | Desenho | Spec |
|---|---|---|---|
| Nós criamos a escola e convidamos a coordenação, no painel da operação | Painel da operação (5a) | — | A0b |
| 1. A coordenação aceita o convite, entra com MFA e monta a escola: disciplinas, turmas, lista de nomes por turma, alocação e convite ao professor | Entrada e Estrutura | 11.8, 3, 11.1 | A1 |
| 1. O professor aceita o convite e confirma o vínculo; o aluno reivindica o nome pelo convite da turma, e o professor aprova | Entrada, Turmas e o convite da turma (P27) | 11.8, 1 | A1 |
| 1. A coordenação sobe o material com licença (D75) | Material | 3 | A2 |
| 2. Professora pede uma atividade; o chat pergunta; abre o cartão; gera com página citada; exporta | Home e conversa | 11.2, 11.3 | A2 |
| 2. Pede a versão adaptada escolhendo o tipo, e aprova | Cartão de Adaptação e cartão de entrega | 11.3, 11.4 | A2 |
| 3. Aluno responde a atividade e abre o Tutor, que recusa, conduz e cita | Área do aluno | 11.6 | A3, A4 |
| 4. Professora recebe do Tutor que oito travaram; o Assistente avisa que corrigiu e espera | Seu time | 11.4 | A3, A4 |
| 4. Abre os destaques e aprova, com o registro da validação | Aprovar | 11.5 | A3 |
| 4. Vê o acerto por habilidade | Turmas › a turma aberta (as abas fecham no PRD da A3, P28) | 1, 10.2 | A3 |
| 5. Coordenação abre a governança, os agentes com as funções, e o resumo do Analista | Governança e Agentes | 11.7 | A5 |

Fora do MVP, com o lugar reservado no desenho: grade horária e "seu dia" (F2, F8), Calendário,
Buscar, anexo e busca na web na caixa de pedido, gráfico de série, modo sala, prova online,
Conformidade, Denúncias, Exportar.
