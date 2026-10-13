# PRD — Pele e casca

**Status:** aprovado, por delegação do Joaquim em 12/10/2026 ("você pode tomar todas as decisões para o projeto, eu Joaquim permito"); ele revê ao ler
**Tamanho:** pouco acima do teto de 2.000 palavras, com aceite pela mesma delegação: a revisão dos guardiões pediu o RF24 e a prova de quatro requisitos por extenso
**Funcionalidade do roadmap:** X1
**Depende de:** F3

## 1. Problema

O Gabriel viu o produto na pele de setembro e reprovou: "muita informação, muita aba, muita coisa", "muito texto,
pouco contraste e cara de site". A professora com quarenta minutos de intervalo acha sete itens na lateral da
coordenação e três grupos na dela; o aluno de 11 anos lê texto cinza de 14 px; e de noite, em casa, a tela é só
branca. De 04 a 07/10/2026 ele redesenhou tudo em mockup (D80), e o produto ficou diferente do que vamos mostrar.

E F2, F6, F7, F9 e F12 ainda vão abrir tela: cada uma feita na pele velha é tela feita duas vezes.

## 2. Objetivo

O `apps/web` inteiro aparece na pele da D80, no claro e no escuro, e cada papel navega pelos lugares dela, sem que
nenhuma tela mude o que faz.

## 3. Fora de escopo

- Recompor o miolo das telas (tabela no lugar de cartões, painel ao lado, a turma em três abas): X2, X3 e X4
- **Reagrupar a navegação.** Os quatro lugares da coordenação são da X2; Criados e o fim de "Seu time", da X3;
  Início, Tarefas e Eu do aluno, da X4. Aqui os itens são os de hoje, na casca nova
- Mudar endereço: nenhum muda
- O sino e "Esperando você" (X2 e X3). "Seu time" continua na lateral do professor até a X3
- A introdução de cada papel e o tamanho da letra (X4)
- Qualquer mudança de regra, de permissão, de endpoint ou de dado gravado no servidor
- Trazer o mockup de outubro para a pasta `mockups/` (decisão do Gabriel e do Joaquim; D80)
- Mecânica de uso compulsivo (D59; D80, item 7), e a comemoração, que só entra na X4

## 4. Papéis envolvidos

| Papel | O que pode fazer | O que não pode |
|---|---|---|
| Coordenador | Navegar pelos sete itens de hoje; escolher a aparência | Nada além do que a matriz de permissão já dá |
| Professor | Navegar por Início, Ferramentas e Turmas, com "Seu time" abaixo; trocar de escola; escolher a aparência | Ver turmas de duas escolas juntas (regra 10) |
| Aluno | Navegar por Tutor, Atividades e Minha turma; escolher a aparência | Ver dado de colega (regra 50, item 9) |
| Operador Turmma | Usar a operação na pele nova; escolher a aparência | Alcançar tela de escola (A0) |
| Quem ainda não entrou | Ver as páginas públicas na pele nova, no tema do sistema | — |

## 5. Requisitos funcionais

| # | Requisito | Como se prova |
|---|---|---|
| RF1 | Toda cor servida vem da lista de tokens da D80, em hex, nos dois temas, e a lista do código é a do `docs/interface.md` | Teste lê o bloco do documento e o CSS: diferença de nome ou de hex reprova; o CSS servido não tem `oklch(` nem `color-mix(` |
| RF2 | Cada par de texto e fundo que a pele usa tem contraste de 4,5:1, e cada borda que é a única pista de um controle e o anel de foco, 3:1, no claro e no escuro. O selo "IA" e a linha de aprovação estão entre os pares | Teste calcula o contraste de cada par declarado, nos dois temas |
| RF3 | A pessoa escolhe a aparência entre **Sistema**, **Claro** e **Escuro**, pelo menu dela, em qualquer área. A escolha fica no navegador, vale antes de a primeira tela desenhar e, em Sistema, acompanha o aparelho com a página aberta | e2e: escolher Escuro, recarregar e conferir o fundo no primeiro quadro; trocar o tema do sistema emulado com a página aberta |
| RF4 | Sem armazenamento no navegador, a aparência é a do sistema e nada quebra | Teste de componente com o armazenamento recusando |
| RF5 | O botão tem seis desenhos e nenhum outro: primário (laranja, texto escuro), oficial (grafite), secundário, discreto, perigo e perigo cheio (este só dentro da confirmação). Todos têm alvo de 44 px (o compacto, 36 no computador), estado apertado visível no toque, e o desligado é outro desenho, legível e sem cor de ação | Teste de componente por variante e estado; e2e da galeria |
| RF6 | A ação oficial não se parece com nenhuma outra da tela, nos dois temas (regra 50, item 8) | Teste: a cor da face e do degrau do oficial não é a de nenhuma outra variante, em cada tema |
| RF7 | Tudo o que recebe foco pelo teclado mostra o anel de foco, nos dois temas, em todas as peças | e2e da galeria percorre com Tab e mede a largura e a cor do contorno |
| RF8 | Nada pisca, gira ou se move em laço para enfeitar; só `transform` e `opacity` animam; com "reduzir movimento" ligado, nada desloca | Teste do CSS servido (propriedades animadas) e e2e com a preferência emulada |
| RF9 | As peças revestidas e as novas (Tech Spec, seção 9) estão na galeria com todos os estados, nos dois temas, operáveis por teclado e sem violação grave de acessibilidade | e2e da galeria com axe, nos projetos `chromebook` e `celular`, em cada tema |
| RF10 | A onça é o avatar do Assistente, do Tutor e do Analista, e só aparece com o nome da função e o selo "IA" visíveis no mesmo bloco. É um desenho só por agente, com expressão neutra, parado; não tem nome próprio, fala nem traço de pessoa. Na lateral, "Seu time" mostra o ícone da função, sem a onça | Teste de componente em cada peça que desenha o avatar (função e selo no mesmo bloco; dois renders iguais; nenhum temporizador); teste de arquitetura: só essas peças importam a cabeça |
| RF11 | Estado nunca é só cor: selo, aviso e item selecionado levam texto ou ícone, e o item selecionado da navegação leva `aria-current` | Teste de componente; axe |
| RF12 | Toda tela aberta por um item da lateral tem título visível, que é o `h1`, e título próprio na aba do navegador; a conversa é a exceção, com `h1` só para leitor de tela | e2e percorre os itens de cada papel, mede a caixa do `h1` e confere o título da aba |
| RF13 | No computador (a partir de 1024 px) a lateral tem 256 px, com os lugares em ícone ilustrado e rótulo; recolhe para um trilho de 88 px por escolha, que o navegador lembra; de 768 a 1023 px, é o trilho | e2e nas três larguras |
| RF14 | Abaixo de 768 px, uma barra de topo de 56 px e, para o papel com até quatro itens (professor e aluno), uma barra de baixo fixa de 68 px com eles; o resto (escola, "Seu time", conta) abre numa gaveta. Com mais de quatro (a coordenação, até a X2), os itens continuam na gaveta. A 360 px nada rola de lado | e2e no projeto `celular`: os itens do professor e do aluno estão na barra de baixo, os da coordenação na gaveta, e a largura excedente é zero |
| RF15 | "Sair" está visível, sem abrir nada, em toda tela de quem entrou, do mesmo tamanho dos vizinhos (D59) | e2e: em cada papel e largura, "Sair" está à vista e tem a altura e a largura do item vizinho |
| RF16 | Os itens de cada papel são os de hoje, na ordem de hoje, e abrem as telas de hoje. Um rótulo muda: "Nova conversa" vira **"Início"**, no item, no `h1` e no título da aba | e2e W2: a lista de cada papel, item a item |
| RF17 | Cada item tem ícone e rótulo; o ícone é ilustrado onde a D80 desenhou um (Início, Turmas, Ferramentas, Atividades) e, nos outros, o de hoje dentro de um ladrilho | Teste de componente da lateral, por papel |
| RF18 | Nenhum endereço muda, e cada papel abre onde abre hoje | Os e2e de hoje, sem trocar `toHaveURL` |
| RF19 | O professor com mais de uma escola continua trocando de escola no topo da lateral, com a troca de token e o descarte do cache de hoje (regra 10; regra 50, item 13) | O e2e `troca-de-escola` continua verde, só com o seletor novo |
| RF20 | As páginas públicas e a operação aparecem na pele nova, sem mudar texto de erro, ordem de campo nem resposta | Os e2e delas continuam verdes |
| RF21 | Nenhum teste que prova regra é apagado, pulado ou enfraquecido: em teste só muda a cor, a medida ou o rótulo que a pele trocou | Revisão do diff dos testes por tarefa; a esteira verde |
| RF22 | O primeiro carregamento continua em até 150 kB (brotli), e o pedaço da área de um papel não baixa ícone nem peça de outro (a entrada, com a casca e os ícones de lugar, é comum a todos) | O teste do build e o `.size-limit.json` |
| RF23 | Cada tela continua cabendo em 1366 × 768 onde cabia, e funcionando a 360 px; no celular, o último botão da tela não fica atrás da barra de baixo | e2e nos dois projetos; as fotos da vitrine |
| RF24 | Depois de a pessoa escolher a aparência, o navegador guarda só `educa.aparencia` e, se ela recolheu a lateral, `educa.lateral-recolhida`: nenhuma chave nem valor leva pessoa, escola ou papel, e voltar a Sistema apaga a primeira | e2e nos dois projetos: a pessoa A escolhe Escuro e sai, a pessoa B entra no mesmo navegador, e o conteúdo do armazenamento é exatamente esse |

## 6. Regras de negócio

- **Regra vence desenho** (D80, item 7): onde o mockup e uma proteção do produto discordam, vale o produto
- **Item sem tela não aparece** (D73); quem decide o alcance é a API
- **A ação oficial tem botão próprio** (regra 50, item 8): aprovar pedido de nome e aprovar lote continuam em oficial
- **Nada sensível no navegador** (regra 50, item 7): só a aparência e a lateral recolhida
- **O agente tem identidade e nunca se passa por pessoa** (D58; regra 70, item 4a)
- **Alvo é o Chromebook fraco** (regra 50, item 1): sem fonte web, sem biblioteca de animação

## 7. Casos de borda

| Caso | Comportamento esperado |
|---|---|
| Laboratório com Chrome 109 | As cores, o degrau e o foco aparecem; o CSS servido não tem `oklch(`, `color-mix(`, `:has(` nem `scrollbar-width` |
| Chromebook gerenciado que bloqueia o armazenamento | Aparência do sistema, lateral aberta; nenhum erro na tela |
| Dois alunos, um depois do outro, no mesmo computador | A aparência é do navegador e fica; nada do primeiro aluno fica |
| Professor com vínculo em duas escolas | O seletor aparece; quem tem uma só não o vê |
| Professor sem turma confirmada, aluno sem turma no ano | A casca abre, o lugar mostra o vazio de hoje, com o texto de hoje |
| Sessão vencida com um diálogo aberto | O login por cima continua funcionando, na pele nova |
| Link antigo guardado nos favoritos (`/coordenacao/estrutura`, `/aluno/atividades`) | Abre a tela nova equivalente |
| Nome de escola ou de pessoa comprido, a 360 px | Corta com reticências dentro da barra, sem empurrar a tela |

## 8. Dado pessoal envolvido

| Dado | Titular | Finalidade | Retenção | Já está em `docs/lgpd.md`? |
|---|---|---|---|---|
| Nenhum dado novo | — | — | — | — |

A aparência e a lateral recolhida ficam só no navegador, sem identificador.

## 8b. Risco regulatório (quando há IA no caminho do aluno)

Nenhuma função de IA muda, e a classificação do CNE é a mesma. Muda a cara dos agentes: a onça entra como avatar.
O Decreto 12.880, art. 11, proíbe sugerir pessoa ou vínculo afetivo: a onça é um animal desenhado, aparece sempre
com o nome da função e o selo "IA", e nenhuma fala nova é escrita nesta spec.

## 9. Métricas

- O e2e inteiro verde nos dois projetos, com o mesmo número de casos ou mais
- Primeiro carregamento em brotli, antes e depois
- A galeria ao lado da prancha do mockup, peça a peça, na foto: o Gabriel aprova ou aponta

## 10. Perguntas em aberto

- O script que aplica o tema antes do React vai em linha ou em arquivo próprio?
- Os ícones ilustrados entram como componente ou como arquivo de imagem, fora do JavaScript?
- Quanto o teto do pedaço de cada área sobe com as peças novas?
