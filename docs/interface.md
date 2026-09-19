# Interface — navegação e telas

> O mapa das telas por papel e o comportamento das peças que aparecem em todo lugar (chat,
> ferramenta, feed de agentes, aprovação). **Não é design visual:** cores, tipografia e logo
> estão em aberto até a marca ser definida (ver `CLAUDE.md`).
>
> As regras que limitam tudo aqui estão em `.claude/rules/50-frontend.md`: computador fraco
> de escola, responsiva até o celular sem depender dele (D51), quatro estados por tela, ação
> oficial que mostra o que vai acontecer.

Legenda: **decidido** vem de decisão do `CLAUDE.md` ou do desenho da call.
*Proposta* é ponto de partida para o PRD da funcionalidade, que pode mudar.

---

## 1. Área do professor

Veio do desenho da call (Excalidraw), **decidido**:

```
┌────────────────┬──────────────────────────────────────────────────┐
│ [Escola ▾]     │                                                  │
│                │                                                  │
│ Home (chat)    │           conteúdo da seção selecionada          │
│ Ferramentas    │                                                  │
│ Calendário     │                                                  │
│ Seu time       │                                                  │
│ Meu painel     │                                                  │
│                │                                                  │
│ Histórico      │                                                  │
│  · conversa 1  │                                                  │
│  · conversa 2  │                                                  │
└────────────────┴──────────────────────────────────────────────────┘
```

- **Seletor de escola no topo**, filtrando tudo abaixo. Professor dá aula em mais de uma
  escola (regra 50, item 13)
- **Home é o chat.** Com contexto de papel, turma e material. Tudo que existe em Ferramentas
  pode ser feito por aqui
- **Ferramentas** são os mesmos fluxos em formato de formulário, para quem não quer
  conversar com chat
- **Calendário** mostra a semana e o dia por escola e turma: aulas, avaliações, entregas e o
  que os agentes concluíram. Deriva da estrutura da escola, o professor não monta a grade
  (regra 60, item 8)
- **Seu time** é o feed dos agentes. Cada agente é uma thread, com não-lidos
- **Meu painel** (*proposta*, D45) mostra ao professor o próprio uso e o desempenho das
  turmas dele por habilidade, com a comparação da série. É dele primeiro: o que a
  coordenação vê dele é agregado, e o nominal só abre com auditoria. A tela diz isso em
  português comum
- **Histórico** lista as conversas do professor, que a coordenação nunca vê

### 1.1 Chat e ferramenta são o mesmo motor (D18)

O professor pode escolher a ferramenta no próprio chat (*proposta:* um seletor ao lado do
campo de mensagem, e atalho digitando `/`).

Quando ele **não escolheu** e o pedido corresponde a uma ferramenta, o chat pergunta antes
de gerar:

```
Camila:  monta uma prova de estequiometria pro 2ºB, dez questões

Sistema: Quer usar a ferramenta Prova? Ela salva na sua biblioteca, liga ao 2ºB
         e cita a página de cada questão.
         [ Usar ferramenta Prova ]   [ Só conversar ]
```

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

### 1.2 Ferramentas (F7)

Prova (gabarito, versões, exportação) · Atividade e lista · Correção de objetiva com
diagnóstico por habilidade · Adaptação para necessidade específica · Plano de aula e sequência
didática · Simulado ENEM a partir do banco público (D21) · Redação e discursiva: a ferramenta
gera **rubrica e critérios** antes da aplicação, organiza o lote e apoia a correção cega, e
**a IA não corrige, não avalia, não dá nota nem conceito e não escreve devolutiva** sobre o
texto do aluno (D55). Quem escreve a devolutiva é o professor, na tela, com a rubrica ao lado.

Toda ferramenta produz um **artefato** que fica na biblioteca, ligado à turma e ao
calendário, e toda saída cita material e página.

### 1.3 Seu time: o feed de agentes (F11)

- Agentes com nome de função: Rotina, Corretor, Planejador, Monitor de turma, Adaptador
  (D17, D32)
- Cada mensagem de agente diz o que fez e, quando aplicável, **o que está esperando**:
  "Corrigi as 32 provas do 2ºB, média 6,4. Esperando você aprovar"
- O nível de autonomia do agente fica visível na thread, em português comum
- **O feed nunca aparece vazio** para professor com turma (regra 50, item 6). Sem atividade
  ainda, o agente Rotina abre o dia com o que vem da grade e das avaliações

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

### 1.5 Modo sala (F10)

- Mostra **sinal, não conversa**: quem travou, quem pediu resposta pronta, dúvida que se
  repetiu (regra 50, item 10)
- Abrir a conversa de um aluno é ação explícita e fica em auditoria
- Sem inferência de estado emocional (regra 70, item 7)

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

---

## 3. Área da coordenação

*Proposta de navegação:*

- **Estrutura**: séries, turmas, listas de nomes, grade horária e calendário importados,
  alocação de professor × turma × disciplina, convites de professor e conexão opcional com
  Google ou Microsoft (F1, F2; D3 revista, D48). É a primeira coisa que a coordenação faz, e
  precisa ser rápida (D24)
- **Material**: fontes com titularidade e licença, upload, estado da ingestão com o que
  entrou, o que falhou, o que está pendente e o que foi recusado por falta de licença (F4,
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
- **Analista da coordenação**: resumo de segunda de manhã e alertas na hora, em agregado (D32)
- **Adaptações**: registro da adaptação necessária por aluno, nunca diagnóstico (D35)
- **Agentes**: cada agente, o que faz sozinho e o que espera aprovação, em português comum
  (D9). É a tela para apontar quando alguém pergunta "o que essa IA faz sozinha?". Cada agente
  de alto risco mostra o **resumo da avaliação de impacto** e o que ele **não** faz (D60)
- **Conformidade**: o dossiê da escola em um lugar — declaração de propósito e faixas etárias,
  como o sistema funciona em linguagem simples, conformidade com LGPD e ECA Digital, relatório
  de uso exportável, e o material para conversar com professores e famílias (D61). É a tela
  que a coordenação abre na reunião, e a que responde ao checklist do MEC
- **Denúncias**: o canal de notificação de violação, com o que foi apontado, o que foi feito e
  o recurso, dizendo se a análise foi humana ou automatizada (D61)
- **Exportar**: dado, artefato e histórico de uso em formato aberto, a qualquer momento, sem
  depender de nós (D63)
- **Auditoria**: para qualquer item, o que a IA gerou, quem aprovou e quando
- **Configurações da escola**: política de tutor, modo casa por turma (D19), retenção

MFA obrigatório para coordenação (F1).

---

## 4. Área da rede (F14)

Consolidado por escola, comparativo e adoção. **Nunca** dado individual de aluno, nunca
conversa de tutor (regra 10, item 8).

## 5. Área da família

Fase posterior (D11). Nota, entrega e alerta, alimentados pelo motor de eventos do F13.

---

## 6. Em toda tela

- Quatro estados: carregando, vazio, erro, com dado. **Vazio é convite para agir**
- Português do Brasil, data e número no formato local
- Erro diz o que fazer: "não foi possível salvar, tente de novo em instantes"
- Navegação por teclado, foco visível, contraste, rótulo em campo
- Lista longa virtualizada. Nada que assuma máquina boa
- **Toda saída de IA é rotulada como tal**, com a fonte e a página quando vem do material, e
  com quem aprovou quando já passou por aprovação
- **Sem padrão manipulativo** (D59): nenhuma urgência fabricada, nenhum botão que esconde a
  ação menos lucrativa para nós, e o caminho de recusar do mesmo tamanho do de aceitar
- **Responsiva desde a primeira versão** (D51): do computador da escola ao celular, a
  partir de 360 px. No celular, o menu lateral da área do professor vira navegação
  recolhível, e o chat, o feed e as ferramentas cabem numa coluna. Toque em vez de hover,
  alvo de toque de 44 px na ação principal. Nenhum fluxo exige o celular

## 7. Em aberto

- Identidade visual: cores, tipografia, logo, tom da interface
- Avatar dos agentes (ícone por função?) — depende da identidade visual
- Detalhe de navegação do aluno e da coordenação, a fechar nos PRDs de F2, F9 e F12
- Conteúdo do "Meu painel" do professor e dos indicadores (decisão em aberto no `CLAUDE.md`)
