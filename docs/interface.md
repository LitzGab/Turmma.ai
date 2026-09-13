# Interface — navegação e telas

> O mapa das telas por papel e o comportamento das peças que aparecem em todo lugar (chat,
> ferramenta, feed de agentes, aprovação). **Não é design visual:** cores, tipografia e logo
> estão em aberto até a marca ser definida (ver `CLAUDE.md`).
>
> As regras que limitam tudo aqui estão em `.claude/rules/50-frontend.md`: Chromebook fraco,
> sem celular, quatro estados por tela, ação oficial que mostra o que vai acontecer.

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
- **Histórico** lista as conversas do professor

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

Prova (gabarito, versões, exportação) · Atividade e lista · Correção com devolutiva ·
Adaptação para necessidade específica · Plano de aula e sequência didática · Simulado ENEM
a partir do banco público (D21) · Redação por competência.

Toda ferramenta produz um **artefato** que fica na biblioteca, ligado à turma e ao
calendário, e toda saída cita material e página.

### 1.3 Seu time: o feed de agentes (F11)

- Agentes com nome de função: Corretor, Planejador, Rotina, Monitor de turma (D17)
- Cada mensagem de agente diz o que fez e, quando aplicável, **o que está esperando**:
  "Corrigi as 32 provas do 2ºB, média 6,4. Esperando você aprovar"
- O nível de autonomia do agente fica visível na thread, em português comum
- **O feed nunca aparece vazio** para professor com turma (regra 50, item 6). Sem atividade
  ainda, o agente Rotina abre o dia com o que vem da grade e das avaliações

### 1.4 Aprovar nota

A ação que não pode virar clique reflexo (regra 50, item 8; regra 70).

- Aprovação individual mostra **aluno, avaliação e valor** antes de confirmar
- Aprovação em lote mostra o resumo e **destaca os casos fora da curva** no topo:
  discursiva com baixa confiança da correção, nota muito distante da média do aluno, prova
  em branco
- Rejeitar pede justificativa
- *Proposta:* o botão de aprovar o lote fica desabilitado enquanto os destacados não forem
  abertos

### 1.5 Modo sala (F10)

- Mostra **sinal, não conversa**: quem travou, quem pediu resposta pronta, dúvida que se
  repetiu (regra 50, item 10)
- Abrir a conversa de um aluno é ação explícita e fica em auditoria
- Sem inferência de estado emocional (regra 70, item 7)

---

## 2. Área do aluno (F9)

Chromebook de sala, sem celular em nenhum ponto. Login por escola + matrícula + senha.

*Proposta de navegação:*

- **Tutor**, restrito ao conteúdo da turma, citando a página do material. Travado durante
  avaliação em andamento
- **Atividades e provas** atribuídas pelo professor
- **Meu desempenho**, só do próprio aluno
- Aviso visível e permanente de que o professor acompanha o uso do tutor (D8)

Proibido na tela do aluno: ranking, média da turma que permita deduzir nota de colega, lista
de quem entregou (regra 50, item 9).

Fora da sala, o tutor só aparece se a escola ligou o modo casa para aquela turma (D19).
Desligado, a tela explica que o tutor funciona em sala, sem parecer erro.

---

## 3. Área da coordenação

*Proposta de navegação:*

- **Estrutura**: séries, turmas, listas de nomes, convites de professor (F1, F2). É a
  primeira coisa que a coordenação faz, e precisa ser rápida (D24)
- **Material**: fontes, upload de apostila, estado da ingestão com o que entrou, o que
  falhou e o que está pendente (F4)
- **Governança** (F12), a tela que fecha a venda:
  - uso de IA por professor e turma
  - 100% das notas aprovadas por humano, com o número
  - desempenho por turma e habilidade
  - alertas acionáveis: prova fácil demais, turma em queda, aluno em risco
  - consumo de IA do mês contra o orçamento
- **Agentes**: cada agente, o que faz sozinho e o que espera aprovação, em português comum
  (D9). É a tela para apontar quando alguém pergunta "o que essa IA faz sozinha?"
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

## 7. Em aberto

- Identidade visual: cores, tipografia, logo, tom da interface
- Avatar dos agentes (ícone por função?) — depende da identidade visual
- Detalhe de navegação do aluno e da coordenação, a fechar nos PRDs de F2, F9 e F12
