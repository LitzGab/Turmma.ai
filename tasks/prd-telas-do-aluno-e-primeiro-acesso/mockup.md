# Inventário B — aluno, páginas públicas e entrada (mockup novo × produto)

Fonte: `/home/joaquimdp/Documentos/git/Prototipo_Turmma/mockups` (rodadas 10ª a 14ª do `LEIAME.md`), lido em 12/10/2026.
Recorte: `src/areas/aluno/**`, `src/areas/publico/**`, `src/areas/entrada/{Entrada,Verificacao,rotas}.tsx`, `src/App.tsx`,
`src/areas/Mapa.tsx` e o que essas telas usam de `src/dados` e `src/components`.
Produto comparado: `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src`.

Convenções deste arquivo: texto entre aspas é literal da tela. "1440" é a janela 1440 × 780 da régua R10; "375" é o
celular. Peças `duo` são só citadas pelo nome. "Evento" é o `registrar(tipo, …)` de `dados/demo/nucleo.ts` (o que o
Mapa lê para o ✓).

## 0. Avisos antes de usar este inventário

1. **O código do mockup já passou da 14ª rodada.** Há comentários "15ª rodada (06/10/2026)" em
   `components/duo/chat.tsx`, `areas/aluno/Tutor.tsx`, `dados/conversas-aluno.ts` e `Casca.tsx`, que o `LEIAME.md` não
   descreve: a saudação grande "Oi, Lucas" sem balão, a linha fixa pequena e cinza sob a caixa, **Copiar · Refazer · 👍 ·
   👎** em cada resposta, **Editar a pergunta**, **Anexar a foto da questão**, **Renomear · Apagar** a conversa (no título
   e na lateral) e o botão **Nova conversa** na lateral do aluno. Estão marcados com **[15ª]** abaixo: decidir se entram.
2. **Os números de decisão nos comentários do mockup não são os do `docs/decisoes.md`.** O mockup cita "D61" (peso igual
   do Avisar), "D78" (atribuições "Atende o titular" e "Recebe risco à vida", "Esqueci a senha" igual), "D79" (quem lê o
   aviso) e "D80" (família sem conta). No produto, D78 e D79 são do processo (Maestri) e D80 não existe. Não citar D do
   mockup em PRD sem conferir.
3. **Tudo no mockup mora em `localStorage`** (`turmma-demo-v2:<fatia>`), com duas abas andando juntas pelo evento
   `storage`. No produto nada disso vai ao navegador (regra 50, itens 3 e 7).
4. **Navegação do aluno muda inteira.** Mockup: Início · Tarefas · Eu · Avisar um adulto. Produto hoje
   (`areas/navegacao.ts`): Tutor · Atividades · Minha turma, com "Privacidade" no rodapé e "Sair" sempre à vista.

---

## 1. A casca do aluno (vale para todas as telas "dentro da casca")

Arquivo: `src/components/turmma/Casca.tsx` (`<Casca papel="aluno" />`, rota-pai `/aluno`).

**1440 (≥ 1024 px)**: lateral branca de 256 px, borda direita de 2 px.
- Topo (88 px): a `Marca` (link para `/aluno`, `aria-label` "Turmma, início"). **Sem lápis, sem botão de recolher.**
- Lugares (`nav` "Lugares"), itens de 52 px, ícone ilustrado de 32 px numa caixa de 36, rótulo em caixa alta a 14 px:
  "Início" (`/aluno`, aceso só em `/aluno` exato) · "Tarefas" (`/aluno/tarefas*`) · "Eu" (`/aluno/eu*`) · "Avisar um
  adulto" (`/aluno/avisar*`). Aceso: borda azul, fundo azul-claro, texto azul.
- Números, no canto do ícone:
  - Tarefas: **contador azul** = quantas estão Para fazer (`praFazer(useTarefasDoAluno()).length`); `aria-label` "Tarefas,
    N para fazer".
  - Eu: **ponto azul** (sem número) quando há pedido de dados respondido e não lido (`usePedidosDadosNaoLidos`).
  - Avisar um adulto: **contador amarelo** só com resposta de aviso não lida (`useRespostasNaoLidas`); "resposta nova".
- Abaixo, separado por borda de 2 px: **[15ª]** o botão "Nova conversa" (leva a `/aluno`) e as conversas em grupos
  "Hoje" · "Ontem" · "Últimos 7 dias", **até 5**, cada linha de 40 px com o título truncado e, ao passar o mouse (sempre
  no toque), o "⋯" com "Renomear" (vira campo, Enter salva, Esc desiste) e "Apagar" (apaga na hora, sem confirmar; se era
  a aberta, vai a `/aluno`). A conversa aberta acende a linha dela, e não o Início.
- Rodapé: o **cartão do aluno** é um link para `/aluno/eu` (`aria-label` "Lucas Pereira, abrir Eu"): bolinha laranja de
  40 px com as iniciais ("LP"), o nome e "2ºB · Colégio Aurora". **Não há menu, e "Sair" não aparece na lateral.**
- Sem sino (o sino é só de professor e coordenação).
- O tamanho do texto do aluno (`preferencias.texto.aluno`) é aplicado como `zoom` no `<html>` enquanto a casca está
  montada: padrão `1`, grande `1.1`, maior `1.2`.

**768 a 1023 px**: trilho de 88 px, só os ícones (com dica ao passar o mouse); o contador vira ponto de 10 px.

**375 (< 768 px)**:
- Barra do topo fixa, 56 px: a pinta laranja, a turma ("2ºB") e um botão "Abrir as conversas" (ícone de balão), que abre
  a gaveta com as conversas e o cartão do aluno.
- Barra de baixo fixa, 68 px (mais a área segura): os 4 lugares em colunas iguais, ícone de 28 px e rótulo de 12 px em
  caixa alta: "Início" · "Tarefas" · "Eu" · "Avisar" (o rótulo curto). Os mesmos contadores.

**Diálogos da casca**: `?config=<seção>` abre "Ajustes" (ver 2.6). A "Ajuda" (Falar com a Turmma) não tem entrada para
o aluno.

**Produto**: `componentes/CascaDaEscola.tsx` + `areas/navegacao.ts`. Lateral de 260 px, trilho de 56, gaveta abaixo de
768 (sem barra de baixo). Itens Tutor · Atividades · Minha turma; rodapé fixo "Privacidade"; menu da pessoa com "Sair"
sempre visível como último item. Não há contadores, conversas na lateral, barra de baixo nem ícones ilustrados.

**Esbarra em regra**:
- **"Sair" some da lateral** e passa a morar em Eu (nome na lateral → Eu → Sair; no celular, Eu na barra de baixo →
  Sair). O produto fez o contrário de propósito (D59: `MenuDaPessoa.tsx`, "o Sair é sempre o último e está sempre à
  vista"). Conferir com o `conformidade-reviewer` antes de aceitar.
- Título da conversa na lateral fica à vista de quem passa atrás da carteira: o mockup já troca por "Conversa com o
  Tutor" no assunto delicado; o título normal é a primeira frase da pergunta (até 40 letras).
- **Apagar conversa pelo aluno [15ª]** bate na D8 (o Tutor é sempre visível ao professor, com registro) e na retenção
  (regra 20, item 14): no produto, "apagar" só pode tirar da lista do aluno, nunca o registro.

---

## 2. Aluno

### 2.1 Início — a conversa com o Tutor

| | |
|---|---|
| Rotas | `/aluno` (vazio) e `/aluno/c/:id` (conversa guardada) |
| Arquivos | `areas/aluno/Tutor.tsx`, `areas/aluno/_conversa-tutor.tsx` |
| Casca | dentro |
| Parâmetros | `:id` = id da conversa (`mol`, `agua`, `fracoes`, `revolucao` ou `c<base36>` criado na hora) · `?assunto=<slug>` abre uma revisão (`massa-molar`, `reagente-limitante`, `proporcao`, `rendimento`, `conservacao-da-massa`) · `?estado=prova|fora|limite` força o estado (só para o Mapa) · `?como=<aluno>` troca a sessão (só Mapa; sai da URL) |

**Composição, Início vazio (`ConversaVazia`, tipo de página "Conversa")**: coluna de 768 px centrada, grupo um pouco
acima do meio (grade `2fr · auto · 3fr`; o LEIAME fala em 1/3). De cima para baixo:
1. `BoasVindas agente="tutor"`: a cabeça da onça (`AvatarIA`, 44 px; 36 no celular) ao lado do `<h1>` "Oi, Lucas" (32/40,
   700) e, embaixo, "Qual é a sua dúvida?".
2. A caixa (`InputBar`): placeholder "Pergunte ao Tutor", foco automático; à esquerda o "+" **[15ª]** "Anexar a foto da
   questão" (`image/*,.pdf`, vários arquivos; o anexo vira chip com "Tirar <arquivo>"); à direita enviar, que vira o
   quadrado de PARAR enquanto pensa ou escreve. Enter envia, Shift+Enter quebra linha.
3. `Sugestoes` (até 4 pílulas `Toque`, centradas): "Massa molar" · "Conferir a minha conta" · "Frações equivalentes" ·
   "Revolução Francesa". Cada uma envia a pergunta: "o que é massa molar?", "fiz a questão 4 e deu 2 mol de alumínio,
   está certo?", "como sei se duas frações são equivalentes?", "por que começou a revolução francesa?".
4. A **linha fixa** (`AvisoIA`, 13 px, cinza, não fecha): "O Tutor é uma IA e pode errar · seus professores acompanham ·
   Como funciona" (o link vai a `/aluno/eu/privacidade#tutor`).

375: a caixa já nasce presa embaixo; a saudação fica no meio do espaço livre; as sugestões e a linha fixa sobem para logo
acima da caixa (sugestões com no máximo 2 linhas).

**Composição, conversa aberta (`ColunaConversa`)**:
1. `BarraConversa` (56 px; 64 no computador): o título da conversa com seta ▾ (`TituloComMenu` **[15ª]**: "Renomear" ·
   "Apagar") e, ao lado, o selo da matéria na cor dela (`Selo`: Química, Matemática, História, Física, Biologia,
   Português). Enquanto o Tutor pergunta a matéria, o selo não aparece. Na conversa do assunto delicado: título fixo
   "Conversa com o Tutor", sem menu e sem selo.
2. As mensagens, a 24 px do topo, vão de 24 px, rolando por dentro; botão flutuante "Ir para o fim da conversa" (↓) quando
   quem lê subiu mais de 160 px.
   - Aluno: balão cinza à direita (`MensagemUsuario`), 17/25; ao passar o mouse, "Copiar a mensagem" e **[15ª]** "Editar
     a mensagem" (vira campo com "Cancelar" e "Enviar"; a conversa é cortada ali e o Tutor responde de novo).
   - Tutor: sem balão; assinatura (`AssinaturaIA`: cabeça da onça 24 px com anel laranja, "Tutor", selo "IA"); texto em
     até 3 frases, terminando em pergunta, com o `ChipPagina` "p. 145" no fim (abre: "Material da escola", o nome do
     material, "cap. 7 · Estequiometria · página 145", o trecho entre aspas e "Abrir a página no material", sem ação).
     Chega palavra a palavra (≈1,5 s; inteiro com `prefers-reduced-motion`). Pronta: **[15ª]** "Copiar" · "Refazer" ·
     "Boa resposta" · "Resposta ruim"; votar mostra "Obrigado. Isso ajuda a escola a ajustar." (só estado da tela).
   - "Pensando…" (`PensandoIA`: a onça com três pontos), 900 ms antes de cada resposta.
3. A caixa presa a 24 px do fim, com o esfumado por cima da última linha; a linha fixa embaixo dela.

**Textos do Tutor por situação (roteiro por palavra-chave, `responder()`)**:
- Resposta pronta pedida ("resposta", "me dá", "me fala", "qual é a", "fala logo"): "Ainda não vou dizer. Na prova eu não
  estou lá, e você consegue." + "Um passo pequeno: <passo>" (ou "Divida 54 g por 27 g/mol. Quanto dá?").
- Conta enviada ("2 mol", "deu 2", "dá 2"): "Isso, 2 mol de alumínio. Agora faça o mesmo com 71 g de Cl₂." + "Pela
  proporção 2 para 3, qual dos dois acaba primeiro?" (p. 151).
- **Identidade** ("pessoa", "robô", "humano"): "Não. Sou o Tutor, um programa da escola." + "Qual é a sua dúvida da
  matéria?".
- Pergunta que serve a duas matérias ("massa", "energia" sem "mol"): "É de Química ou de Física?" com dois `Toque`
  (Química, Física); a escolha vira fala do aluno e define a matéria da conversa.
- Outras: uma pergunta-padrão por matéria (ex.: Química: "Me mostre a sua conta, mesmo errada. O que você já tentou?").
- Abertura da conversa `mol` (a "de hoje"): aluno "qual é a resposta da questão 4 da lista de estequiometria?"; Tutor
  "Essa eu não respondo por você, mas a gente chega lá junto." + "Primeiro passo: quantos mols de alumínio há em 54 g?".
- Revisão por `?assunto=`: "Vamos revisar <assunto>." + "Para começar: …".
- Resposta retirada pela escola: "Esta resposta foi retirada pela escola." (sem ações embaixo).

**Estados**:
| Estado | Quando | Como aparece |
|---|---|---|
| Vazio | `/aluno` sem conversa | a saudação, a caixa, as sugestões (acima) |
| Carregando | resposta a caminho | "Pensando…"; o enviar vira PARAR |
| Limite chegando | faltam ≤ 10 perguntas (o mockup começa com 45 de 60 usadas) | `Selo` acima da caixa: "Hoje ainda dá para N perguntas" ("1 pergunta" no singular). **Sem barra de cota.** |
| Limite do dia | 60 usadas, ou `?estado=limite` | onça dormindo: "Por hoje é isso. Amanhã eu volto." · apoio "Suas tarefas continuam em Tarefas." · botão "Ver minhas tarefas" |
| Prova aberta | há prova enviada "agora" e não entregue (`useTutorTravado` = `prova`), ou `?estado=prova` | "Na prova, eu descanso." · botão "Ir para a prova" (`/aluno/prova/<id>`) · apoio padrão "Enquanto isso, suas tarefas continuam em Tarefas." |
| `?estado=prova` sem prova enviada | só Mapa | "Hoje não tem prova aberta." · "Na prova, eu descanso. Quando a professora mandar uma, ela aparece nas suas tarefas." · "Ver as tarefas" |
| Fora da aula | só `?estado=fora` (não há regra viva) | "Volto na próxima aula." · "Fora do horário de aula, eu descanso. Suas tarefas continuam em Tarefas." · "Ver minhas tarefas" |
| Pausado pela escola | `useTutorPausado()` (vem antes da prova) | "A escola pausou o Tutor por enquanto." · "Sua dúvida pode ir para o professor na próxima aula." · "Ver minhas tarefas" |
| Sem quem receba risco à vida | nenhum membro da equipe com a atribuição "risco" | **o mesmo texto do pausado** (o aluno não vê o motivo real) |
| Assunto delicado | palavra da lista (abaixo) | mensagem fixa em cartão de borda roxa + a caixa sai (abaixo) |
| Erro / sem internet | — | **não existe no mockup** |

Formato do "descansando": no Início (`InicioDescansando`), a onça de 96 px (`pose="dormindo"`, sem animação) com "Tutor"
e o selo "IA" embaixo, o balão (`Balao`) ao lado com a frase como `<h1>`, e, no lugar da caixa, um bloco da mesma largura
(≥ 88 px de altura, borda de 2 px) com o apoio e **um** botão. Na conversa aberta (`/aluno/c/:id`), a onça de 72 px toma
o lugar da caixa (`TutorDescansando`) e as mensagens antigas continuam à vista. Regra do mockup: nunca tela sem saída.

**Assunto delicado (D36)**: gatilhos, sem acento: "nao to bem", "nao estou bem", "briguei", "triste", "me machucar",
"sozinho", "sozinha".
- Mensagem fixa (`MensagemFixa`, assinada pelo Tutor): "Obrigado por contar. Sou um programa e não posso ajudar nisso.
  Fale hoje com um professor ou com a orientação da escola." · "Se for urgente, ligue 188 (CVV). É de graça, a qualquer
  hora." · botão "Avisar um adulto" (`/aluno/avisar`).
- Depois dela, a caixa **some**: a onça `acolhendo` (72 px) com "Vamos falar disso com um adulto." e o botão fantasma
  "Nova conversa" (`/aluno`). A conversa não segue, não aceita edição, e há um só encaminhamento por conversa.
- Se foi a primeira pergunta do Início, a conversa nasce com o título "Conversa com o Tutor".

**Ações e dados no mockup**:
| Ação | Módulo | Evento |
|---|---|---|
| Primeira pergunta no Início | `conversasAluno.criar(pergunta, matéria deduzida)` → navega a `/aluno/c/<id>` | nenhum |
| Pergunta seguinte / resposta | `conversasAluno.acrescentar(id, troca)` | nenhum |
| Primeira fala numa revisão (`?assunto=`) | `conversasAluno.criar` + regrava título "Revisar <assunto>" e a abertura | nenhum |
| Escolher a matéria | `conversasAluno.definirMateria` + fala do aluno | nenhum |
| Editar pergunta [15ª] | `conversasAluno.cortar(id, i, [nova])` | nenhum |
| Renomear / Apagar [15ª] | `conversasAluno.renomear` / `.apagar` | nenhum |
| Assunto delicado | `avisos.assuntoDelicado(texto)`: cria aviso `tipo: 'risco'`, origem "Tutor · assunto delicado", com o trecho (fala do aluno + mensagem fixa), `vistoPeloProfessor: false` | `assunto-delicado` |
| Contar a pergunta no limite | variável de módulo `usadasHoje` (não persiste) | nenhum |
| 👍 / 👎, Copiar, Refazer, Anexar | estado local da tela | nenhum |

**Para existir de verdade**: entidade de conversa do aluno **fora de atividade** (hoje a conversa é por atividade
aplicada), com título, matéria e lista por data; mensagens com citação de página; contagem do dia e do pacote (D38);
estado do Tutor por turma (prova aberta, fora da aula/D19, limite, pausa por função/D60); classificador de assunto
delicado e o encaminhamento; streaming com parar; e, se a [15ª] entrar, edição que corta o histórico, voto por resposta
(categoria de dado nova) e upload de imagem do aluno.

**Esbarra em regra**:
- **A caixa trava quando o Tutor não atende.** No produto ela **nunca trava** (`areas/aluno/Tutor.tsx`: "A caixa existe
  em todos os estados do Tutor"), para o aluno que escreve assunto delicado na pausa ainda receber o 188 (D36). O mockup
  troca a caixa pela onça dormindo: é regressão de D36 se copiado como está.
- **Supervisão menos visível.** O produto tem a faixa presa no topo, que não fecha: "Quem dá a aula acompanha como você
  usa o Tutor." (D8; regra 70, item 4). O mockup reduz a uma linha de 13 px cinza sob a caixa. Conferir contraste (o
  `text-sutil`) e se a linha basta para o art. 11 do Decreto 12.880.
- **Anexar a foto da questão [15ª]**: aluno subindo arquivo bate na D75 (aluno não sobe material), na D5, na decisão em
  aberto "anexo de documento na conversa" e na regra 20 (foto pode trazer rosto, caderno com nome). Foto de resposta
  discursiva abre a porta que a D55 fecha.
- **Refazer [15ª]** gasta troca do pacote (D38) e gera duas respostas para a mesma pergunta: qual fica no registro?
- **Editar a pergunta [15ª]** apaga da tela o que o professor acompanharia (D8): o registro original precisa ficar.
- **👍 / 👎 [15ª]**: "Isso ajuda a escola a ajustar" é finalidade nova para dado de menor; sem linha na tabela do
  `docs/lgpd.md`, não entra (regra 20, item 1).
- **"Amanhã eu volto." / "Volto na próxima aula."**: frase na primeira pessoa do agente prometendo retorno. Não é
  sequência nem recompensa, mas vale passar pelo `conformidade-reviewer` (D58 vínculo afetivo; D59).
- **Onça como rosto do Tutor**, com poses `acolhendo`, `comemorando`, `dormindo`: a D58 e o produto usam "círculo com
  ícone, nunca rosto" (`componentes/ia/AvatarAgente.tsx`). O mascote animal com expressão é mudança de decisão (D72 e
  D58), não detalhe de pele.
- Gatilho "triste" / "sozinho": no produto isso é classificar **o conteúdo da mensagem** para encaminhar (D36), nunca
  gravar estado emocional do aluno (D57; regra 70, item 7). O que o mockup grava é o trecho e "assunto pessoal".
- O estado "sem quem receba risco" mostra ao aluno "A escola pausou o Tutor": texto impreciso, mas não vaza nada.
- Sem ranking, ponto, sequência, meta, colega: conforme.

**Produto**: `areas/aluno/Tutor.tsx` (`/aluno/tutor` e `/aluno/tutor/:atividadeAplicadaId`).
- O mockup tem e o produto não: conversa livre com histórico na lateral, saudação, sugestões, selo de matéria, onça,
  "descansando" com botão, limite só quando faltam 10, e toda a [15ª].
- O produto tem e o mockup não: escolha "Em qual atividade você quer ajuda?", conversa presa à atividade e à questão
  (`?questao=`), faixa de supervisão presa, "Hoje: N de 60 perguntas" com barra neutra sempre, pausas `pacote_do_mes` e
  `fora` de verdade, "Ver mensagens anteriores", carregando/erro/"Tentar de novo", falha dentro da conversa sem erro
  cru, caixa que nunca trava.

### 2.2 Tarefas

| | |
|---|---|
| Rota | `/aluno/tarefas` |
| Arquivo | `areas/aluno/Atividades.tsx` (peças em `_pecas.tsx`) |
| Casca | dentro |
| Parâmetros | nenhum (o filtro de matéria é estado local) |

**Composição (`Pagina tipo="leitura"`, coluna de 880 px na borda esquerda da moldura de 1200; o corpo rola por dentro)**:
1. `CabecalhoPagina` (64 px): título "Tarefas"; à direita, **se houver mais de uma matéria**, o filtro `MenuMais` com o
   botão "Todas as matérias ▾" (itens: "Todas as matérias" e cada matéria).
2. Três `Secao`, vão de 24 px, cada uma com o número entre parênteses: "Para fazer (n)" · "Entregues (n)" ·
   "Corrigidas (n)".
3. Cada seção é um `Cartao` sem respiro com linhas de 64 px (a linha inteira é link, com chevron):
   `LadrilhoMateria` 44 px (ícone e cor da matéria; ícone de prova quando é prova) · título (+ `SeloNovo` "NOVO") e, embaixo,
   "Química · Prof. Camila Souza" · **só na lista começada e não entregue**: `BarraProgresso` de 96 px na cor da matéria
   e "2 de 8" · `SeloEstado`.
4. Seção vazia: uma linha tracejada com visto: "Nada pra fazer agora." · "Nada esperando a professora." · "Nenhuma
   corrigida ainda.".

375: o selo do estado, o NOVO e o "2 de 8" descem para baixo do nome; a barra some; o cabeçalho rola com o corpo.

**Selos de estado**: "Até quinta" / "Até sexta" (neutro) · "Ainda dá" (neutro; é o atraso, sem vermelho) · "Abre agora"
(prova enviada para já) · "Terça 7h30" (prova na próxima aula) · "A professora está vendo" (amarelo, relógio) · "Lida"
(verde, leitura) · "Corrigida" (verde, visto).

**Ordem de Para fazer**: `aberta` → `pra-fazer` → `abre-em` → `atrasada`; dentro, pela `ordem` do prazo. O atraso vai
por último.

**Estados**: vazio total (aluno novo): onça dormindo 96 px a 1/3, "Nada pra fazer agora", "Quando um professor mandar
uma tarefa, ela aparece aqui." · com dado · **sem carregando e sem erro**.

**Ações**: abrir a linha (`paraTarefaViva`: prova não entregue → `/aluno/prova/:id`; o resto → `/aluno/tarefas/:id`);
filtrar por matéria. Nenhum evento. O NOVO some quando a tarefa é aberta (`sessao.marcarVisto`).

**Dado do mockup**: `useTarefasDoAluno()` (`dados/avaliacoes.ts`) = as 7 tarefas fixas do Lucas
(`dados/tarefas-aluno.ts`) + as enviadas pela professora (`dados/envios.ts`). O professor da linha vem da alocação
confirmada da turma (`useAlocacoes`), com reserva numa tabela fixa.

**Para existir de verdade**: lista paginada das atividades do aluno com tipo (lista, prova, leitura), matéria, professor
que atribuiu, prazo, janela de abertura, progresso (respondidas/total), estado e "há novidade não vista" por aluno.

**Esbarra em regra**: mostra o **nome do professor** ao aluno (o produto evitou: "Minha turma" não traz professor);
"NOVO" e contador azul são novidade, não recompensa (D59 ok, mas é marcação de leitura por aluno = dado novo);
"Ainda dá" em vez de "atrasada" (conforme); sem colega, sem média (conforme regra 50, item 9).

**Produto**: `areas/aluno/Atividades.tsx` (`/aluno/atividades`).
- Mockup tem: três grupos (o produto tem "Para responder" e "Já feitas"), filtro de matéria, professor, tipo leitura,
  barra de progresso, NOVO, prova com tela própria, onça no vazio.
- Produto tem: carregando, erro com "Tentar de novo", "Ver mais atividades" (paginação), o aviso de avaliação na linha,
  o detalhe da situação em texto.

### 2.3 Uma tarefa

| | |
|---|---|
| Rota | `/aluno/tarefas/:id` |
| Arquivo | `areas/aluno/Atividade.tsx` |
| Casca | dentro |
| Parâmetros | `:id` da tarefa · `?ajuda=<n>` abre o Tutor ao lado na questão n (1 a 8; 1 na leitura) |

Moldura comum (`Pagina tipo="leitura"`, 880): `CabecalhoPagina` com "‹ TAREFAS" (volta a `/aluno/tarefas`), o título da
tarefa, o complemento "Química · até quinta" (ou "· corrigida", "· entregue em 21/09") e, à direita, o **mapa de
questões** (`MapaQuestoes` pequeno: bolinhas de 28 px; atual em azul cheio, respondida em azul-claro, vazia branca; no
resultado, certa verde e errada vermelha com `Ponto`) e um texto. Com o Tutor aberto ao lado, a página ganha
`padding-right: 480px`.

A tela escolhe uma de seis formas:

**a) Fazer (lista não entregue)**
- Cabeçalho à direita: mapa + "2 de 8 feitas".
- "QUESTÃO 3" e, na mesma linha à direita, `RespostaSalva`: "Salvo. Pode parar quando quiser." (no celular só "Salvo.").
- O enunciado (até 68 caracteres por linha) e as `Alternativas` (`Opcao` rádio de 56 px, letra num quadradinho).
- Barra única sob as alternativas (presa embaixo no celular): à esquerda "Tirar dúvida com o Tutor" (com a cabeça da
  onça; "Dúvida" no celular); à direita "Anterior" · "Próxima ›"; na última questão, "Entregar" (laranja) no lugar de
  Próxima.
- `DialogoConfirmar` "Entregar?": "Você respondeu 5 de 8. Depois não dá para mudar." · confirmar "Entregar".
- Abre na primeira questão sem resposta.

**b) Leitura** (tipo `leitura`)
- Bloco: ladrilho de 56 px, "Capítulo 4 · páginas 84 a 97", "No livro de História. Leia com calma; se travar, pergunte
  ao Tutor.".
- Barra: "Tirar dúvida com o Tutor" · "Marcar como lida". Lida: selo "Lida" no cabeçalho e "Lida. Bom trabalho.".
- Painel do Tutor: título "Tutor · Capítulo 4", abertura "Vamos ler juntos. O que o título do capítulo faz você pensar?".

**c) Entregue agora** (logo depois de confirmar): `Comemoracao` com a onça `comemorando` 96 px, "Entregue!", "Sua
professora vê antes de você.", botão "Voltar às tarefas". A onça salta uma vez e 5 pintas saem em leque (700 ms; parado
com movimento reduzido).

**d) Esperando** (entregue, lote não aprovado)
- Cabeçalho: mapa + "8 de 8 respondidas".
- Faixa cinza com visto: "Entregue em 21/09. A professora está vendo; a nota chega aqui depois que ela aprovar.".
- A questão com as alternativas só para ler (a marcada com selo "Sua resposta"); "Anterior" · "Próxima".

**e) Corrigida** (lote aprovado)
- Cabeçalho: mapa de certas e erradas + "4 de 8 certas". Abre na primeira errada.
- Avisos no topo, quando há revisão: `Aviso` info "A professora vai olhar a questão que você apontou." (esperando);
  `Aviso` certo "A professora olhou: manteve a nota." / "…mudou a nota." com o motivo entre aspas e NOVO.
- Dois cartões lado a lado (1fr · 320 px; empilham no celular):
  - "O RECADO": o texto (sem a frase "Revise a página…", que vai para o lado); embaixo "Escrito pelo Tutor" + selo IA
    (ou "Escrito pela professora") e o `Carimbo` "Aprovado por Prof. Camila · 18/09, 16h20".
  - "VALE REVISAR" (só se errou alguma): onça `apontando` 56 px, "Massa molar · p. 145", botão "Estudar com o Tutor"
    (`/aluno?assunto=massa-molar`).
- A questão: "QUESTÃO n" + selo "Certa" (verde) ou "Errada" (vermelho); alternativas em leitura (a certa em verde com
  "Certa" ou "Sua resposta"; a marcada errada em vermelho com "Sua resposta").
- Barra: "Isso está errado?" (fantasma; some enquanto há revisão esperando) · "Anterior" · "Próxima".
- Diálogo `IssoEstaErrado` (480 px): título "Isso está errado?", "Escolha o motivo. Quem olha é a sua professora.";
  "Em qual questão?" (bolinhas, já na questão aberta); "O que está errado?" com "A correção está errada" · "A questão
  tem problema" · "Outra coisa"; campo "Quer explicar? Não precisa."; botões "Voltar" e "Enviar" do mesmo tamanho
  (Enviar só com motivo).
- Texto do recado em modelo: "Você acertou 7 de 10. Errou nas questões 3, 4 e 8: confira as páginas 145 e 151." ou
  "…Acertou todas: siga assim.".

**f) Não achei**: cabeçalho "Tarefa"; onça `pensando` 96 px; "Não achei esta tarefa"; "Ver as tarefas".

Prova ainda não entregue aberta por este endereço → redireciona a `/aluno/prova/:id`.

**O Tutor ao lado ("Tirar dúvida")**: no computador, `aside` fixo à direita de 480 px, **sem véu**, a questão continua
clicável; cabeçalho de 64 px "Tutor · Questão 3" e X; fecha com X ou Esc; a lateral recolhe enquanto está aberto e volta
depois. No celular, `PainelLado` (folha de baixo; "O Tutor ao lado da questão. Feche com Esc."). Dentro, a
`ConversaTutor compacta` com contexto (tarefa, questão, alternativa marcada, página): abre com "Você marcou 88 g. Antes
da conta: quantos gramas tem 1 mol de água?" ou "Vamos olhar a questão 3 juntos. …". **Essa conversa vive só na tela**
(não entra no histórico). Com o Tutor travado: onça dormindo 96 px, a frase e o botão (ex.: "Ir para a prova"), sem dica.

**Ações e dados**:
| Ação | Módulo | Evento |
|---|---|---|
| Marcar alternativa | `avaliacoes.responder(tarefaId, questao, letra)` (não grava depois de entregue) | `tarefa-respondida` |
| Entregar | `avaliacoes.entregar(tarefaId)`: grava a entrega e cria/atualiza o lote `lote-<tarefa>` com acertos pelo gabarito e o recado em modelo, estado "espera" | `tarefa-entregue` |
| Marcar como lida | `avaliacoes.marcarLida` | `leitura-feita` |
| Isso está errado? | `revisoes.pedir({ tipo: 'nota', tarefaId, questao, motivo, texto })` | `revisao-pedida` |
| Abrir | `sessao.marcarVisto(chaveNovo)` | nenhum |

**Estados ausentes**: carregando, erro, resposta que não salvou, sem internet (a lista não tem; só a prova).

**Para existir de verdade**: prova/lista com questões e alternativas; gravação idempotente por item (regra 80, item 6;
o produto já tem `fila-de-respostas.ts`); envio; tipo leitura com "lida"; resultado só depois da aprovação com gabarito,
recado (autor e aprovador), reforço por assunto com página; contestação de questão com resposta do professor; Tutor
contextual por questão.

**Esbarra em regra**:
- O recado "Escrito pelo Tutor", aprovado junto com a nota, é devolutiva de IA em **objetiva**: cabe na regra 70, item 3
  (aprovada, com autor e data) e a D56 pede o registro do que foi mostrado. Em discursiva o tipo do dado prevê
  `autor: 'professora'` (D55): nenhuma tela do recorte mostra discursiva.
- A comemoração é da **entrega**, uma vez, nunca da nota (D59): conforme; passar pelo `conformidade-reviewer` por ser
  animação de reforço.
- "Vale revisar" nasce de `< 50%` ou do reforço da professora: limiar é decisão em aberto (indicadores).
- "Tirar dúvida" em tarefa avaliativa: o mockup só trava na **prova**; lista comum sempre abre o Tutor.
- O resultado mostra o gabarito inteiro ao aluno depois da aprovação: confirmar com a escola (reuso da prova).

**Produto**: `areas/aluno/Atividade.tsx` (`/aluno/atividades/:atividadeAplicadaId`).
- Mockup tem: cabeçalho com mapa, Tutor ao lado sem sair da questão, leitura, comemoração, recado com carimbo, "Vale
  revisar" com atalho, "Isso está errado?" e a resposta da professora.
- Produto tem: fila de respostas com estados `salvando`/`salva`/`nao_salva` e reenvio ("Não foi possível salvar esta
  resposta. Chame quem dá a aula."), aviso de escolhas perdidas, diagnóstico **por habilidade** (`BarraRotulada` com a
  descrição da BNCC) em "Seu resultado", "Quem dá a aula encerrou esta atividade", carregando/erro/não disponível, e o
  Tutor em outra tela ("Pedir ajuda ao Tutor nesta questão" → `/aluno/tutor/:id?questao=`).

### 2.4 Prova (tela de foco)

| | |
|---|---|
| Rota | `/aluno/prova/:id` |
| Arquivo | `areas/aluno/Prova.tsx` (`TelaFoco`) |
| Casca | **fora** (sem lateral, sem barra de baixo) |
| Parâmetros | `:id` (padrão `prova-estequiometria`) · `?rede=caiu` simula sem internet (só Mapa) |

**Guardas**: sem envio da professora → redireciona a `/aluno/tarefas`; entregue ou corrigida → `/aluno/tarefas/:id`.

**Fases**:

1. **Ainda não abriu** (enviada "na próxima aula"): a 1/3 da altura, ladrilho 56, o nome, "Abre terça, 7h30.", botão
   "Voltar às tarefas". O Tutor não dorme.
2. **Antes** (coluna de 480 px a 1/3, sem topo): ladrilho, `<h1>` com o nome, "Química · 10 questões · 50 minutos" e
   quatro linhas com ícone:
   - "Na prova, o Tutor descansa."
   - "Se você sair desta tela, a professora fica sabendo."
   - "Cada resposta fica salva, mesmo se a internet cair."
   - "Antes de entregar, você revisa as que marcou."
   Dois botões do **mesmo tamanho**: "Agora não" (volta às tarefas) e "Começar".
3. **Andamento**:
   - Topo de 64 px: o nome da prova (só ≥ 768); no meio "Questão 3 de 10" ("3 de 10" no celular) e o relógio "41 min"
     (`role="timer"`, só minutos, sem segundos, sem piscar); à direita dois botões fantasmas de 176 px (76 no celular):
     "Avisar um adulto" ("Avisar") e "Sair da prova" ("Sair").
   - Miolo (760 px): "QUESTÃO 3", o selo amarelo "Para revisar" quando marcada, "Salvo" e o botão fantasma "Marcar para
     revisar" / "Tirar a marca"; enunciado; `Alternativas`.
   - Rodapé preso: `NavQuestoes` ("‹ Anterior" · bolinhas 1 a 10 · "Próxima ›"; com mais de 8 questões, só as setas no
     computador; no celular o mapa vai numa linha de cima). Na última, "Revisar e entregar".
   - Voltou depois de sair: `Aviso` info "Você voltou. Suas 3 respostas estão salvas. Faltam 41 minutos." (some na
     próxima resposta); abre na primeira sem resposta.
4. **Revisar** (no lugar da questão, sem rodapé): "Revisar a prova" e "8 de 10 respondidas · 2 em branco · 1 para
   revisar"; grade de cartões de 80 px (5 colunas; 2 no celular): "QUESTÃO n" + "Letra C" ou "Em branco" (tracejado) e o
   marcador amarelo; cada um volta à questão. Embaixo: "Toque numa questão para voltar a ela. Depois de entregar, não dá
   para mudar." · "Voltar à prova" · "Entregar".
5. **Entregar?** (`DialogoConfirmar`): "Você respondeu 8 de 10 (2 em branco). Depois não dá para mudar. A nota chega
   depois que a professora aprovar." · "Entregar".
6. **Entregue**: comemoração, "Entregue!", "Sua professora vê antes de você. O Tutor já voltou." (ou "…O Tutor está
   pausado pela escola."), "Voltar ao início" (`/aluno`). **Nenhuma nota.**

**Outros estados**:
- **Sem internet** (`?rede=caiu`): `Aviso` atenção "Sem internet. O tempo parou. Sua resposta está guardada."; o
  relógio para (`aria-label` "…, relógio parado"). No mockup entra já na questão 3 com 41 min.
- **Sair agora?** (`DialogoConfirmar`): "Suas respostas ficam salvas e a professora fica sabendo." · "Sair" → conta uma
  saída e vai a `/aluno/tarefas`.
- **Avisar um adulto na prova**: `PainelLado` por cima; "O relógio da prova está parado enquanto você escreve." e "O
  relógio da prova parou."; o `FormularioAvisar` em uma coluna, **sem** a opção "O Tutor disse algo errado", com o
  bloco do 188 no fim. Enviado: `Aviso` "Recebido. A orientação responde até 23/09." + "Aviso 34 · a resposta chega em
  Avisar um adulto" + "Voltar à prova". Não conta como saída.
- Tempo esgotado, erro de gravação, prova encerrada pela professora: **não existem**.

**Ações e dados**:
| Ação | Módulo | Evento |
|---|---|---|
| Marcar alternativa | `avaliacoes.responder` | `tarefa-respondida` |
| Trocar de aba (`visibilitychange` → hidden) durante o andamento, fora do Avisar | `avaliacoes.saiuDaProva` (soma por aluno e prova) | `prova-saida` |
| Sair da prova | `avaliacoes.saiuDaProva` + navega | `prova-saida` |
| Entregar | `avaliacoes.entregar` (leva `saidas` ao lote) | `tarefa-entregue` |
| Avisar | `avisos.enviar({ origem: 'prova', … })` | `aviso-enviado` |
| Marcar para revisar | estado local (some ao recarregar) | nenhum |

O relógio é simulado (1 min a cada 60 s; ao voltar, `minutos − 2 − 3 × respondidas`). O tempo que resta fica num `Map`
em memória.

**Para existir de verdade**: avaliação online com janela de abertura, duração e **relógio no servidor** que para em
queda e em "Avisar" (regra 80, item 6); gravação idempotente por item com reenvio; contagem de saídas por avaliação
visível só ao professor (D70); marcação "para revisar" (decidir se persiste); entrega; bloqueio do Tutor por prova
aberta; canal de aviso dentro da prova.

**Esbarra em regra**:
- D70 atendida no texto (o aluno é avisado antes; não vê contador; só durante a avaliação). Falta o parecer que a D70
  pede. "Sair da prova" pelo botão **também conta** como saída: conferir se é isso que a D70 quer registrar.
- D59: "Agora não" e "Começar" do mesmo tamanho (conforme). Sair pede confirmação; entrar pede a tela "Antes" + Começar:
  dois passos de cada lado.
- Parar o relógio ao abrir "Avisar um adulto" é brecha de tempo: precisa de limite ou registro no produto.
- A prova é sempre objetiva (A a D). Sem discursiva (D55 não é tocada).

**Produto**: não existe tela de prova. A avaliação é a mesma `Atividade.tsx` com `avaliativa` e o aviso
`AVISO_DA_AVALIACAO`; sem tela de foco, relógio, marcar para revisar, revisão antes de entregar, saída da aba nem aviso
dentro da prova.

### 2.5 Eu

| | |
|---|---|
| Rota | `/aluno/eu` |
| Arquivo | `areas/aluno/Eu.tsx` |
| Casca | dentro |
| Parâmetros | nenhum |

**Composição (`Pagina tipo="leitura"`, 880; cabe em 1440 × 780)**:
1. `CabecalhoPagina`: título "Eu", complemento "2ºB · Colégio Aurora".
2. `Secao` "Como estou indo", com o `Segmentado` de matérias à direita (ícone + nome: Química · Matemática · História;
   só aparece com até 4 matérias e aluno não novo). `Cartao` com linhas de 56 px em colunas `200 · 216 · 1fr · 96`:
   nome do assunto · `BarraProgresso` de 160 px na cor da matéria + "7 de 8" · selos "Vale revisar" (amarelo, quando
   acertos/total < 50%) e "A prof. Camila pediu" (roxo; hoje só em "Massa molar") · "Estudar" (fantasma, só no assunto
   fraco com atalho; `/aluno?assunto=<slug>`).
   Dados iniciais (Química): Conservação da massa 7 de 8 · Balanceamento 6 de 6 · Massa molar 4 de 10 · Reagente
   limitante 2 de 6. Soma as provas aprovadas na demonstração.
3. 32 px abaixo, `nav` "Conta": `Cartao` em grade 2 × 2 (uma coluna no celular), linhas de 56 px com ícone e chevron:
   "Privacidade" (`/aluno/eu/privacidade`) · "Ajustes" (abre o diálogo) · "Rever a introdução"
   (`/aluno/bem-vindo?rever=1`) · "Sair" (um clique, sem confirmar → `/e/colegio-aurora`).

375: a barra e os selos vão para uma segunda linha sob o nome; as matérias descem para baixo do título da seção.

**Estados**: aluno novo: `Cartao` com a onça `apontando` 72 px, "Suas notas aparecem aqui", "Depois que a professora
aprovar a primeira correção." · sem carregando, sem erro.

**Ajustes** (`Configuracoes papel="aluno"`, `Dialogo` de 480 px, título "Ajustes"):
- "Aparência": `Segmentado` "Sistema" · "Claro" · "Escuro" (`localStorage['turmma-aparencia']`).
- "Tamanho do texto": "Padrão" · "Grande" · "Maior" (`preferencias.texto.aluno`).
- "Senha": botão "Trocar a senha" → campos "Senha de agora" e "Senha nova" (dica "8 ou mais letras ou números."; erro
  "Faltam letras: 8 ou mais."), "Trocar a senha" / "Cancelar"; feito: carimbo "Senha trocada". Não grava nada.

**Ações**: nenhuma grava evento. "Sair" não encerra sessão no mockup (só navega).

**Para existir de verdade**: desempenho do aluno por assunto/habilidade só com correção aprovada; o pedido de reforço
do professor por assunto (D66); preferências por pessoa no servidor (tema pode ficar no navegador); troca de senha do
aluno; logout.

**Esbarra em regra**:
- "Como estou indo" é a tela "Meu desempenho" que o produto ainda não tem; assunto "com o nome do livro" em vez da
  habilidade BNCC (o produto mostra a descrição da habilidade). Limiar de 50% é provisório (decisão em aberto).
- Só dado do próprio aluno, sem média da turma (conforme regra 50, item 9).
- "A prof. Camila pediu": é o contexto estruturado do professor (D66), mostrado ao aluno com o nome dela.
- "Sair" a dois toques da lateral (ver seção 1).

**Produto**: não existe "Eu". O mais próximo é `areas/aluno/MinhaTurma.tsx` (`/aluno/minha-turma`: turma, série, escola,
com o estado "sem turma no ano"), que no mockup vira só o complemento do título. O estado "aluno sem turma no ano letivo"
some no mockup.

### 2.6 Privacidade

| | |
|---|---|
| Rota | `/aluno/eu/privacidade` |
| Arquivo | `areas/aluno/Privacidade.tsx` |
| Casca | dentro |
| Parâmetros | `#dados`, `#memoria`, `#guardamos`, `#tutor` (rola até a seção ao abrir) |

**Composição (`Pagina tipo="leitura"`, 880; o corpo rola por dentro)**:
1. `CabecalhoPagina`: "‹ EU", título "Privacidade" e, na linha de apoio, as âncoras em pílulas: "MEUS DADOS" · "O QUE O
   TUTOR LEMBRA" · "O QUE GUARDAMOS".
2. **"Meus dados"** (`#dados`): `Cartao` com "Você pode ver, corrigir, apagar ou levar os seus dados." e o botão laranja
   "Pedir meus dados".
   - `Dialogo` "Pedir meus dados" (480): rádio "Ver meus dados" · "Corrigir algo" · "Apagar meus dados" · "Levar meus
     dados"; campo "Quer explicar? Não precisa."; "Enviar". Enviado: `Aviso` "Pedido 34" · "A escola responde até
     06/10." · "Fechar".
3. **"Seus pedidos"** (só quando há): linhas "Pedido 34" + o tipo + selo "Resposta até 06/10" (amarelo) ou "Atendido"
   (verde) + NOVO; atendido: botão "Baixar meus dados" (baixa `meus-dados-pedido-34.json` e marca lido).
4. **"O que o Tutor lembra"** (`#memoria`): "Guardo o que você estudou, não quem você é."; `Cartao` com uma linha por
   sessão: título = assunto; embaixo "Ontem · Travou em achar o número que divide os dois e depois acertou.". As frases
   saem de duas listas fechadas (onde travou × como terminou). Dados: Frações equivalentes (Ontem), Reagente limitante
   (18/09, "…e a aula acabou antes."), Revolução Francesa (18/09, "…e terminou com uma dica."), Massa molar (16/09).
   - Tocar abre "Isso está errado?" com os motivos "Isso não aconteceu assim" · "Não quero que o Tutor use isso" ·
     "Outra coisa" e "Quem olha é Camila, que dá Química na sua turma." (ou "a coordenação").
   - Depois: selo amarelo "Camila vai olhar"; respondido: `Aviso` "Camila olhou e manteve: "…"" ou "Camila corrigiu:
     "…"", com NOVO; apagado: a frase some e fica "Camila apagou da memória do Tutor.".
   - Rodapé "Algo errado? Toque no item."; aluno novo: "Nada ainda.".
5. **"O que guardamos"** (`#guardamos`): dois cartões lado a lado.
   - "GUARDAMOS" (visto verde): "Seu nome, sua turma e sua matrícula" · "As tarefas e as notas aprovadas" · "O que você
     estudou com o Tutor".
   - "NÃO TEMOS" (X cinza): "E-mail, telefone ou foto" · "Endereço ou data de nascimento" · "Nada sobre sua saúde ou seu
     humor".
6. **"Quem vê o quê"**: tabela de duas colunas (180 px · resto):
   - Você: "Tudo o que é seu."
   - Seus professores: "Tarefas, notas e quando você trava. A conversa inteira só abre com um motivo, que fica
     registrado."
   - A coordenação: "Os números da turma toda; para ver algo seu, fica registrado."
   - Seus colegas: "Nada."
   - A Turmma: "Cuida do sistema e não vende nem treina IA com seus dados."
7. **"Como o Tutor funciona"** (`#tutor`): "É um programa, não uma pessoa." · "Lê o material da sua turma e pergunta
   para você pensar." · "Pode errar. Confira na página que ele mostra." · "Na prova, ele descansa.".

**Ações e dados**:
| Ação | Módulo | Evento |
|---|---|---|
| Pedir meus dados | `avisos.pedirDados({ oQue, texto, origem: 'aluno' })`: aviso `tipo: 'titular'`, prazo "até 06/10" | `titular-pedido` |
| Contestar item da memória | `revisoes.pedir({ tipo: 'memoria', itemId, itemTexto, materia, motivo, texto })` | `revisao-pedida` |
| Baixar meus dados | monta JSON no navegador (aluno, tarefas, conversas com nº de falas, memória sem os apagados, "o que não temos") + `avisos.marcarLido` | nenhum |
| Ver resposta | `sessao.marcarVisto` | nenhum |

**Estados**: sem carregando, sem erro; vazios descritos acima.

**Para existir de verdade**: pedido de titular aberto **pelo próprio aluno** com tipo (ver, corrigir, apagar, levar) e
prazo; arquivo gerado no servidor com URL assinada; memória do Tutor em campos fixos por sessão (D66) com contestação e
decisão (manter, corrigir, apagar) de quem dá a matéria; a matriz "quem vê o quê" como texto de produto.

**Esbarra em regra**:
- O texto "A conversa inteira só abre com um motivo, que fica registrado" casa com a regra 50, item 10. Já a introdução
  diz "Seus professores veem o que você me pergunta" e a linha fixa diz "seus professores acompanham": três formulações
  para a mesma regra. Escolher uma.
- "Apagar meus dados" pedido por menor de idade, sozinho: eliminação é direito, mas quem representa o menor e o que a
  escola é obrigada a guardar (regra 20, itens 15 e 16) precisam de texto próprio; hoje a tela não avisa.
- O download não avisa do computador da escola (o produto avisa: `AVISO_DE_BAIXAR`).
- "Onde travou" e "como terminou" são do trabalho, em lista fechada (D66 conforme); nenhuma frase sobre a pessoa.
- "Nada sobre sua saúde ou seu humor": afirma por escrito a D57.

**Produto**: `componentes/meus-dados/MeusDados.tsx` em `/aluno/privacidade` ("Privacidade", seção "Meus dados").
- Mockup tem: o aluno abre o pedido na tela (4 tipos), a memória do Tutor com contestação, "guardamos / não temos",
  "quem vê o quê", "como o Tutor funciona".
- Produto tem: "Seus pedidos" só de leitura (o vazio manda pedir à coordenação), "O que a escola guarda de você" com a
  **contagem de registros por categoria**, diálogo de baixar com o aviso do computador da escola, arquivo que expira em
  7 dias, URL assinada de 5 min, carregando e erro.

### 2.7 Avisar um adulto

| | |
|---|---|
| Rota | `/aluno/avisar` |
| Arquivo | `areas/aluno/Avisar.tsx` (`FormularioAvisar` e `Bloco188` também usados pela prova) |
| Casca | dentro |
| Parâmetros | `?conversa=<id>` (de qual conversa vem o trecho de "O Tutor disse algo errado") |

**Composição (`Pagina tipo="leitura"`, 880)**:
1. `CabecalhoPagina`: título "Avisar um adulto"; na linha de apoio, **preso no cabeçalho (não rola)**, o `Bloco188`:
   link `tel:188`, roxo, com telefone: "Se for urgente, ligue 188 (CVV)." / "É de graça, a qualquer hora.". No celular o
   bloco fica `sticky` no alto do corpo.
2. Se chegou resposta nova: **"Seus avisos (n)" vem antes do formulário**, já aberto na resposta.
3. O formulário:
   - Legenda "Sobre o quê? Se quiser, toque numa opção." e 4 `Opcao` em grade 2 × 2 (1 coluna no celular), cartões de
     64 px com ícone, tipo checkbox (uma só; tocar de novo desmarca): "Alguém me tratou mal" · "Vi algo que me assustou" ·
     "O Tutor disse algo errado" · "Outra coisa".
   - `CampoTexto` "Conte o que aconteceu, do seu jeito" (5 linhas, mínimo 160 px).
   - Com "O Tutor disse algo errado": caixa cinza "Sobre esta resposta do Tutor: "<até 90 letras>…"".
   - Linha "quem lê" (`aria-live`): "Quem lê: a orientação da escola. Ela vê o seu nome e responde aqui até 23/09. Seus
     colegas, não." ou, no toque do Tutor, "Quem lê: a coordenação. Ela vê o seu nome e o trecho da conversa, e responde
     aqui até 23/09.".
   - "Enviar" à direita; acende com texto **ou** com uma opção.
4. Enviado: `FaixaResultado` info "Recebido. A orientação responde até 23/09." (ou "A coordenação…") com "Aviso 34 · a
   resposta chega aqui, em Seus avisos" e o botão "Novo aviso".
5. **"Seus avisos (n)"**: linhas "Aviso 34" + o toque ou o começo do texto + selo "A escola está vendo" (amarelo) ou
   "Respondido" (verde) + NOVO. Aberto: "A escola respondeu:" · o texto · "Lido por uma pessoa da escola · 21/09, 11h02"
   · "Não concordou? Envie um novo aviso em até 10 dias.". O encaminhamento do Tutor (assunto delicado), quando
   respondido, aparece como **"Conversa com a orientação"**, sem o texto do aviso e sem a linha do "não concordou".

**Ações e dados**:
| Ação | Módulo | Evento |
|---|---|---|
| Enviar | `avisos.enviar({ origem: 'aluno', toque, texto, conversaId })`: aviso com número curto, prazo de 2 dias; no toque do Tutor leva o trecho (pergunta + última resposta do Tutor) e de onde veio | `aviso-enviado` |
| Abrir resposta | `avisos.marcarLido(id)` (zera o contador amarelo) | nenhum |

**Estados**: sem aviso nenhum (só o formulário); sem carregando, sem erro, sem "não foi possível enviar".

**Para existir de verdade**: canal de aviso do aluno com categoria opcional, texto livre, destinatário por tipo
(orientação × coordenação), número curto, prazo, resposta lida por pessoa, "lido" por aluno; trecho da conversa anexado
só no toque do Tutor; retirada de conteúdo pela coordenação.

**Esbarra em regra**:
- O formulário leva **o nome do aluno** a quem lê (dito na tela). Texto livre de menor sobre terceiros é dado sensível
  novo: precisa de linha no `docs/lgpd.md`, retenção e acesso restrito (regra 20, itens 1 e 14).
- "responde aqui até 23/09" promete prazo de 2 dias: é compromisso da escola, não nosso.
- Notificação fora do horário: o contador só aparece dentro do produto (conforme D59).
- É item novo de navegação com fase própria (o produto diz: "Avisar um adulto nasce com a tela dele"). Base: ECA Digital,
  art. 28.

**Produto**: não existe.

### 2.8 Introdução do aluno

| | |
|---|---|
| Rota | `/aluno/bem-vindo` |
| Arquivo | `areas/aluno/BemVindo.tsx` (peça `Introducao`, `components/duo/introducao.tsx`) |
| Casca | **fora** (tela de foco) |
| Parâmetros | `?rever=1` mostra de novo · `?como=<aluno>` idem (Mapa). Já vista e sem parâmetro → redireciona a `/aluno` |

**Moldura da peça**: topo de 64 px com a barra de progresso verde (16 px, até 560 px; "Passo 2 de 5" para leitor de
tela) e o X **só nos passos não obrigatórios**; miolo numa coluna de 484 px centrada: a onça de 120 px (88 no celular)
com "Tutor" e o selo "IA" embaixo, e o balão com a fala como `<h1>`; o conteúdo embaixo; rodapé preso com o botão largo
"Continuar" (cinza até o passo ficar pronto). Enter continua; Esc sai quando pode. O fim troca tudo pela comemoração
(onça de 160 px; 120 no celular), a fala como título, o resumo com vistos verdes, o conteúdo e "Começar".

Os passos estão na seção (b) do fecho. Sair pelo X (ou Esc) leva a `/aluno` **sem marcar como vista**.

**Esbarra em regra**: sem pontos, sequência, meta nem pedido de notificação (conforme D59). No primeiro acesso, os passos
1, 2 e 4 são obrigatórios (sem X): o aluno não consegue pular antes de usar. É a entrada ficando mais longa que a saída?
Conferir com o `conformidade-reviewer` (D59), embora a intenção seja informar (Decreto 12.880, art. 11).

**Produto**: não existe introdução de nenhum papel.

---

## 3. Páginas públicas (sem sessão)

### 3.0 A moldura (`areas/publico/_casca.tsx`)

**1440**: duas colunas iguais, altura da janela, a página não rola.
- Esquerda (`bg-papel`, 40 px de respiro): no alto a `Marca` (link para `/entrar`, "Turmma, entrar"); no meio a `Pinta`
  laranja grande (180 a 300 px) e a frase "Nada chega à turma sem alguém da escola aprovar."; no pé, a linha da escola
  ("Colégio Aurora · Joinville · SC").
- Direita (branca, rola por dentro): o **cartão do formulário** de 480 px, borda de 2 px, canto 16, respiro de 32, a 1/3
  do espaço livre; no pé da coluna, o **canal da escola** (`CanalDaEscola`), quando a tela passa.

**375**: a esquerda vira uma faixa de 96 px só com a `Marca`; o cartão perde a borda; o canal vem depois do conteúdo.

**Peças locais**: `Titulo` (28/34, 700, com linha de apoio) · `Voltar` ("‹ Colégio Aurora") · `DivisorOu` ("OU") ·
`SeloCerto` (círculo verde com visto, 64 px) · `classeDoLink` (azul, 700) · `useHashUmaVez` (lê o `#` e tira da barra) ·
`useTituloDaAba`.

**Canal da escola (rodapé)**: "Avisar a escola" · "Pedido sobre dados" (botões fantasmas pequenos; o atual em tinta) e,
quando a escola indicou, "Encarregado de dados: Helena Martins · dados@colegioaurora.example".

**Escola inexistente** (qualquer `/e/<slug>` desconhecido): título "Escola não encontrada", `Aviso` erro "Não
encontramos esta escola. Confira o endereço com a escola.", link "Procurar a escola" (`/entrar`).

**Produto**: `componentes/CascaPublica.tsx`: coluna única `max-w-md`, cabeçalho só com a marca, `<h1>` de título; sem
painel lateral, sem frase, sem canal da escola.

### 3.1 Entrada da escola

| | |
|---|---|
| Rota | `/e/:escola` |
| Arquivo | `areas/publico/EntrarNaEscola.tsx` |
| Casca | fora (moldura pública) |
| Parâmetros | `:escola` = slug (`colegio-aurora`, `rio-cachoeira`) |

**Composição**: `Titulo` com o nome da escola · botão secundário largo com o logotipo "Entrar com a conta Google da
escola" ("Conta Google da escola" no celular; Microsoft na E. M. Rio Cachoeira) · "OU" · `CampoTexto` "Matrícula"
(placeholder "2026-0000", `inputMode="numeric"`, `autoComplete="username"`) · `CampoSenha` "Senha" · avisos · botão
"Entrar" · "Esqueceu a senha? Fale com seu professor." · "Primeira vez? Tenho um código" (`/e/<escola>/turma`) · rodapé
do canal. Campos vêm vazios. Título da aba: o nome da escola.

**Respostas**: `Aviso` atenção "Seu pedido ainda está esperando a escola." (só com a matrícula **e** a senha do pedido
pendente) · `Aviso` erro "Matrícula ou senha incorretas." (limpa a senha). Somem ao digitar.

**Ações**: `entrar(matricula, senha)` (`dados/acesso.ts`) → `ok`: `sessao.entrarComoAluno`, evento `aluno-entrou`, e
navega a `/aluno/bem-vindo` na primeira vez (sem `onboarding` visto) ou a `/aluno`. O botão da conta da escola, no
mockup, entra como o Lucas.

**Estados ausentes**: carregando do endereço, escola sem provedor, falha do provedor externo, limite de tentativas.

**Para existir de verdade**: já existe (login por escola + matrícula + senha, e conta Google/Microsoft com
identificador opaco, D48). Novo: saber se é a primeira vez (introdução), o canal no rodapé e o encarregado público.

**Esbarra em regra**: **"Seu pedido ainda está esperando a escola."** contraria o que o produto decidiu (R5 da A1): até a
aprovação a entrada responde "Matrícula ou senha incorretas", para não confirmar que o pedido existe (regra 20, item 6).
O mockup só responde "espera" com a senha certa, o que reduz o vazamento, mas é mudança de regra. "Esqueceu a senha? Fale
com seu professor." pede um fluxo de redefinição pelo professor que precisa existir.

**Produto**: `paginas/EntrarNaEscola.tsx` (`/e/:slug`). O produto tem o aviso da TI antes dos botões ("A equipe de
tecnologia da escola precisa liberar este aplicativo…"), os provedores vindos da API, carregando e erro do endereço com
"Tentar de novo", e a falha do provedor tirada da barra. O mockup tem a matrícula **depois** do botão da conta, o link
"Tenho um código", "Esqueceu a senha?" e o canal da escola.

### 3.2 Página da turma (o aluno pede o próprio nome)

| | |
|---|---|
| Rota | `/e/:escola/turma` |
| Arquivo | `areas/publico/TurmaPublica.tsx` |
| Casca | fora (moldura pública, com canal no rodapé) |
| Parâmetros | `?codigo=K7M2QX9B` ou `#<código ou token>` (o `#` sai da barra ao abrir). Código válido pula a etapa 1 |

**Etapa 1, o código**: "‹ Colégio Aurora" · `Titulo` "Digite o código da turma" · `CampoTexto` "Código" (placeholder
"AB12 CD34", maiúsculas, espaçamento largo, dica "Está no quadro ou no link do professor.") · "Continuar" · "Já tem
senha? Entrar". Erros: "Digite o código que o professor mostrou." · "Código não encontrado. Confira com o professor."
(também quando o código do link não vale).

**Etapa 2, nome, matrícula e senha**: no alto "3ºA · Colégio Aurora" (como "‹ voltar" se veio pelo código digitado;
texto fixo se veio pelo link) · `Titulo` "Qual é o seu nome?" ·
- com mais de 6 nomes livres, a `Busca` "Procure seu nome";
- a lista de nomes livres, de A a Z, em `Opcao` rádio, com altura máxima de 232 px rolando por dentro; sem resultado:
  "Nenhum nome com "<filtro>".";
- apoio "Seu nome não está aqui? Chame o professor." (ou o erro "Escolha o seu nome.");
- `CampoTexto` "Matrícula" (placeholder "2026-0000", dica "Está na carteirinha. Não sabe? Peça ao professor."; erro
  "Digite a sua matrícula.");
- `CampoSenha` "Crie uma senha" (placeholder "8 ou mais letras ou números"; erros "Crie uma senha." / "Use 8 ou mais
  letras ou números.");
- "Seus dados: nome e matrícula, só para a escola. Como usamos" (abre o diálogo);
- botão "Pedir para entrar".
- Respostas: `Aviso` erro "Este nome já foi pedido. Chame o professor." · "Nome e matrícula não conferem. Peça ajuda ao
  professor.".
- Sem lista: `Aviso` atenção "A lista desta turma ainda não chegou. Fale com o professor.". Todos pedidos: `Aviso` info
  "Todos os nomes desta turma já foram pedidos." (botão desligado).
- Diálogo "Como usamos seus dados" (460): "Quem cuida: Colégio Aurora. A Turmma opera para a escola." · "O que
  guardamos: seu nome, sua matrícula e sua turma." · "Para quê: o professor saber que é você e aprovar a sua entrada." ·
  "Não treina IA. Você ou sua família podem pedir para ver, corrigir ou apagar." · "Entendi".

**Etapa 3, pronto**: `SeloCerto` · `Titulo` "Pronto! Seu professor vai confirmar que é você." (ou "Pronto! A escola vai
confirmar que é você.", quando a turma não tem professor confirmado) · link "Entrar". Nada do pedido aparece.

**Ações**: `acessos.turmaDoCodigo(codigo)` (código de 8 ou token de 12 que vale agora) · `pedidos.pedir({ turmaId,
nomeId, matricula, senha })` → `'ok' | 'nao-confere' | 'ja-pedido'`; o nome passa a "reivindicado"; evento
`pedido-nome`.

**Para existir de verdade**: já existe (A1). Novo: a busca de nome, o diálogo de privacidade e o canal no rodapé.

**Esbarra em regra**: a lista de nomes da turma fica visível a quem tem o código (já é assim no produto; regra 20, item
8). "Este nome já foi pedido" distingue-se de "não conferem": o produto usa **um texto só** para não dizer qual dos dois
errou (`MENSAGENS_DA_SALA.recusada`). A senha do pedido fica no estado do mockup em claro (só mockup).

**Produto**: `paginas/TurmaPublica.tsx` (`/e/:slug/turma`), mesmo fluxo.
- Mockup tem: busca de nome, diálogo "Como usamos", título-pergunta por etapa, "Pronto!" curto com um link só.
- Produto tem: "Abrindo a turma…", link que falhou com "Tentar de novo", reenvio automático no 503 ("O sistema está
  cheio agora. Tentando de novo…"), limite de tentativas com espera, "Usar outro código", e a tela "Pedido enviado" que
  explica que a entrada responde "Matrícula ou senha incorretas" até a aprovação e oferece "Voltar à lista de nomes".

### 3.3 Avisar a escola (sem conta)

| | |
|---|---|
| Rota | `/e/:escola/avisar` |
| Arquivo | `areas/publico/AvisarEscola.tsx` (+ `Acompanhar` em `_casca.tsx`) |
| Casca | fora (moldura pública; canal no rodapé com "Avisar a escola" marcado) |
| Parâmetros | nenhum (as etapas são estado local) |

**Escrever**: "‹ Colégio Aurora" · `Titulo` "Avisar a escola" · o texto de acolhimento que a coordenação escreve em
Configurações › Canal da escola (quando há) · `CampoTexto` "O que aconteceu?" (4 linhas, até 2000; erro "Conte o que
aconteceu.") · lado a lado "Turma" (120 px, "Opcional", até 12) e "Contato para a resposta" ("Opcional", até 120,
`autoComplete="email"`) · "Enviar" · linha com telefone vermelho "Se alguém corre perigo agora, ligue 188 (CVV) ou 190."
(os dois são `tel:`) · "Já avisou? Acompanhar".

**Enviado**: `SeloCerto` · `Titulo` "Recebido. Número 34, código K7P2." · "A escola responde em até 5 dias úteis. Guarde
o número e o código." · "Acompanhar" · link com o nome da escola.

**Acompanhar**: "‹ Avisar a escola" · `Titulo` "Acompanhar" · "Número" (placeholder "Ex.: 36", só dígitos) e "Código"
(placeholder "Ex.: K7P2", 4 caracteres) · "Ver a situação". Achou: cartão "Número 34" + selo "Recebido" (amarelo) / "Em
análise" (azul) / "Concluído" (verde) · "Recebido em 21/09, 10h43 · resposta até 28/09" · `Aviso` "A escola respondeu"
com o texto entre aspas, ou "Ainda sem resposta.". Não achou: `Aviso` erro "Não achamos esse número com esse código.
Confira e tente de novo.". Só mostra o que entrou pelo canal público, do tipo certo, com o código batendo.

**Ações**: `avisos.enviar({ origem: 'publico', texto, turma, contato })` → aviso com origem "Canal da escola · sem
conta", prazo "até 28/09", código de conferência de 4 caracteres sorteado; evento `aviso-enviado` (`origem: 'publico'`,
quem "Sem conta").

**Para existir de verdade**: endpoint público por escola, sem sessão, com limite por IP **e** por escola (regra 80), texto
livre, protocolo (número + código), consulta pelo par, prazo e resposta; o texto de acolhimento configurável; entrada em
Registros › Avisos e pedidos da coordenação.

**Esbarra em regra**: formulário público de texto livre preso ao tenant pelo slug: precisa de proteção contra abuso e de
teste de isolamento (o número é sequencial **por escola**? no mockup é global). "Contato para a resposta" pode receber
e-mail ou telefone de um aluno (o campo sugere e-mail): a regra 20, item 2, diz que aluno não tem contato no sistema;
decidir como tratar e a retenção. Base legal: ECA Digital, art. 28 (canal para quem não tem conta).

**Produto**: não existe.

### 3.4 Pedido sobre dados de um aluno (sem conta)

| | |
|---|---|
| Rota | `/e/:escola/dados` |
| Arquivo | `areas/publico/PedidoDados.tsx` (+ `Acompanhar`) |
| Casca | fora (moldura pública; canal com "Pedido sobre dados" marcado) |
| Parâmetros | nenhum |

**Pedir**: "‹ Colégio Aurora" · `Titulo` "Pedido sobre dados de um aluno" · "Nome do aluno" (erro "Escreva o nome do
aluno.") e "Turma" (96 px, placeholder "7ºA") · "O que você quer?" com 4 `Opcao` em grade 2 × 2: "Ver os dados" ·
"Corrigir" · "Apagar" · "Levar os dados" (erro "Escolha o que você quer.") · "Contato do responsável" (placeholder
"E-mail ou telefone"; erro "Deixe um e-mail ou telefone.") · "Enviar" · "Já pediu? Acompanhar".

**Enviado**: `Titulo` "Recebido. Pedido 35, código R4KT." · "A escola responde em até 15 dias, até 06/10. Guarde o
número e o código." · "Acompanhar" · link da escola.

**Acompanhar**: a mesma peça de 3.3, com "‹ Pedido sobre dados" e `tipo="titular"`.

**Ações**: `avisos.pedirDados({ origem: 'publico', oQue, alunoNome, turma, contato })` → aviso `tipo: 'titular'`,
origem "Canal da escola · sem conta", prazo "até 06/10", com código; evento `titular-pedido` (quem "Família · sem
conta"). Na coordenação, `arquivoDoTitular` só junta dados se nome e turma batem com um aluno.

**Para existir de verdade**: pedido de titular aberto por terceiro sem conta, com identificação do aluno por texto e
contato do responsável; conferência de identidade pela escola antes de entregar qualquer dado; prazo de 15 dias;
protocolo; ligação com os pedidos do F3 (`/coordenacao/privacidade/pedidos`).

**Esbarra em regra**: qualquer pessoa digita o nome de um menor e pede os dados: o risco é a entrega a quem não é o
responsável (o mockup devolve só "situação" e o texto da resposta no Acompanhar, e o arquivo sai pela coordenação).
"Contato do responsável" é dado de responsável (regra 20 permite), mas é coleta nova sem linha na tabela. Depende da
decisão em aberto do art. 24 do ECA Digital (conta de responsável).

**Produto**: não existe tela pública. O produto tem os pedidos de titular na coordenação (F3) e "Meus dados" de leitura.

### 3.5 Aceite do convite

| | |
|---|---|
| Rota | `/convite` |
| Arquivo | `areas/publico/AceitarConvite.tsx` |
| Casca | fora (moldura pública, **sem** canal no rodapé) |
| Parâmetros | `#<token>` (lido uma vez e tirado da barra) · `?papel=coordenacao` · `?conta=existente` |

**Professor, conta nova** (`#token` válido): `Titulo` "A coordenação do Colégio Aurora convidou você para dar aula de
Física." com o e-mail na linha de apoio · "Seus dados: nome e e-mail, para a escola. Como usamos" · `CampoSenha` "Crie
uma senha" (dica "8 ou mais letras ou números."; erros "Crie uma senha." / "Use 8 ou mais letras ou números.") · botão
"Criar senha e entrar".

**Professor com conta** (`?conta=existente`, ou convite já aceito, como o da Camila `#t9KQ2xLmP4aR`): o mesmo título e
só o botão "Aceitar e entrar".

**Coordenação** (`?papel=coordenacao#hm-aurora`): `Titulo` "A Turmma convidou você para coordenar o Colégio Aurora."
(e-mail `helena.martins@colegioaurora.example`) · "Crie uma senha" · botão "Criar senha". Para escola criada na
operação: "…coordenar a <escola>." e, depois, `SeloCerto` + "Conta criada." / "A montagem começa no próximo acesso." +
"Entrar".

**Inválido** (vencido, revogado, usado, incompleto): `Titulo` "Este convite não vale mais." com "Peça um novo à
coordenação." (professor) ou "Peça um novo à Turmma." (coordenação) · "Já tem senha? Entrar" (`/entrar?quem=equipe`).

**Diálogo "Como usamos seus dados"**: "Quem cuida: o Colégio Aurora. A Turmma opera para a escola." · "O que guardamos:
nome, e-mail, turmas e o que você aprova." · "Para quê: você entrar e a escola saber quem aprovou cada coisa." · "Não
treina IA. Você pode pedir para ver, corrigir ou apagar seus dados." · "Entendi".

**Ações**: professor: `convites.aceitar(token, senha)` (evento `convite-aceito`) → `sessao.entrarComoProfessor` →
`/professor/bem-vindo` (ou `/professor` se já viu a introdução). Coordenação do Aurora: navega a
`/entrar/verificacao?primeira=1&para=/coordenacao`; a chegada a `/coordenacao` registra `convite-aceito` com
`papel: 'coordenacao'` (feito em `App.tsx`, por `sessionStorage`).

**Para existir de verdade**: já existe. Novo: mostrar a disciplina e o e-mail antes do aceite, entrar direto depois de
criar a senha, e disparar a introdução.

**Esbarra em regra**: o mockup **mostra o e-mail e a disciplina do convidado a quem tem o link**; o produto, de
propósito, mostra só o nome da escola ("a consulta diz só a escola que convida") e o convite inválido nunca diz a
escola. Entrar direto depois de criar a senha pula o login que o produto exige do professor (e o segundo fator continua
só da coordenação).

**Produto**: `paginas/Convite.tsx` (`/convite`). O produto consulta a API, tem "Conferindo o convite…", erro com
"Tentar de novo", o passo "aceitar sem senha" que descobre se a conta é nova, e manda o professor à entrada e o
coordenador a `/mfa/configurar`. O mockup tem título com disciplina e e-mail, o diálogo de privacidade e a ida direta
à introdução.

---

## 4. Entrada

### 4.1 Entrar

| | |
|---|---|
| Rota | `/entrar` |
| Arquivo | `areas/entrada/Entrada.tsx` |
| Casca | fora (moldura pública, sem canal) |
| Parâmetros | `?quem=equipe` abre direto em e-mail e senha · `state.aviso` (do roteador) mostra um aviso verde |

**Aluno, "Qual é a sua escola?"** (padrão): `Titulo` "Qual é a sua escola?" · um campo de busca com lupa (combobox;
`<label>` oculto "Nome da escola"; placeholder "Comece a digitar o nome"; foco automático) com a lista flutuante de
escolas (nome à esquerda, "Joinville · SC" à direita; setas, Enter, Esc; ignora acento e pontuação) · botão "Continuar"
· link "Sou da equipe da escola". Erros: "Digite o nome da sua escola." · "Não achamos essa escola. Confira o nome com o
professor.". Escolher leva a `/e/<slug>`. Escolas do mockup: Colégio Aurora (Google) e E. M. Rio Cachoeira (Microsoft).

**Equipe** (`?quem=equipe`): "‹ Sou aluno" · `Titulo` "Entrar na Turmma" · aviso verde opcional · `CampoTexto` "E-mail" ·
`CampoSenha` "Senha" (erro "E-mail ou senha incorretos.") · "Entrar" · link "Esqueci a senha" → `Aviso` info "Se o
e-mail estiver cadastrado, enviamos um link." · "Não tem acesso? Peça um convite à coordenação.". No mockup os campos
vêm preenchidos (`camila.souza@colegioaurora.example` / `demonstracao`).

**Para onde vai cada e-mail** (o e-mail decide o papel): `camila.souza@…` ou professor ativo criado na demonstração →
`/professor?como=<id>`; `helena.martins@…` → `/entrar/verificacao?para=/coordenacao`; `secretaria@educacao.joinville…` →
`…?para=/rede`; `equipe@turmma…` → `…?para=/operacao`. Qualquer outro, ou senha vazia: erro.

**Sem "Cadastre-se"** (D2). Título da aba: "Entrar · Turmma".

**Para existir de verdade**: busca pública de escola por nome (endpoint novo, sem sessão); recuperação de senha por
e-mail para a equipe; o resto já existe.

**Esbarra em regra**: a busca pública **enumera as escolas clientes** por nome (hoje o aluno chega pelo endereço que a
escola divulga). Precisa de limite de consulta e de decisão comercial. Aluno não tem "Esqueci a senha" (correto: não tem
e-mail). "Esqueci a senha" responde igual com ou sem conta (conforme regra 20, item 6).

**Produto**: `paginas/Entrar.tsx` (`/entrar`): só e-mail e senha da equipe ("Use o e-mail e a senha que a sua escola
cadastrou."), com "Entrando…" e mensagens por código. Não tem a busca de escola nem "Esqueci a senha". Tem, e o mockup
não tem, `paginas/EscolherEscola.tsx` (`/escolher-escola`, para quem tem acesso em mais de uma escola), o login por cima
da tela com a sessão vencida (`LoginPorCima`) e a tela "Acesso suspenso".

### 4.2 Segundo fator

| | |
|---|---|
| Rota | `/entrar/verificacao` |
| Arquivo | `areas/entrada/Verificacao.tsx` |
| Casca | fora (moldura pública, sem canal) |
| Parâmetros | `?para=/coordenacao|/rede|/operacao` (qualquer outro vira `/coordenacao`) · `?primeira=1` (primeira vez, vinda do convite) |

**Composição**: `Titulo` "Confirme que é você" / "Digite o código do app autenticador." (ou, na primeira vez, "Proteja
sua conta" / "Escaneie com o app autenticador.") ·
- na primeira vez, um bloco em duas colunas (112 px · resto): o **desenho** de um QR (não é QR de verdade;
  `aria-label` "Código QR para o app autenticador") e o cartão "Códigos de recuperação" com **6** códigos
  (`7KQ2-M9XD`…) em duas colunas e o botão "Copiar" → "Copiados";
- legenda "Código de 6 números" (ou "Código do app") e **seis caixas** de um dígito (56 px de altura, 24 px, 700;
  colar o código inteiro preenche as seis; Backspace volta; `autoComplete="one-time-code"` na primeira; `aria-label`
  "Dígito 1 de 6");
- botão "Confirmar e entrar" (desligado até completar);
- link "Perdi o acesso ao aplicativo" → `Aviso` info "Peça a outra pessoa da coordenação ou à Turmma.";
- botão fantasma "Voltar" (`/entrar`).

Título da aba: "Proteger a conta · Turmma" ou "Confirme que é você · Turmma".

**Depois de confirmar**: coordenação com `primeira=1` → `/coordenacao/bem-vindo`; rede e operação enquanto não viram a
introdução → `/rede/bem-vindo` e `/operacao/bem-vindo`; senão, o `para`. Qualquer 6 dígitos valem. Sem erro de código.

**Para existir de verdade**: já existe (TOTP, recuperação). Novo: o segundo fator para rede e operação nesta mesma tela
e o destino "introdução".

**Esbarra em regra**: a primeira vez só oferece **QR** ("Escaneie com o app autenticador"), o que exige celular; o
produto mostra o **segredo em texto com copiar**, para gerenciador de senhas no computador (regra 50, item 2: nada exige
telefone para autenticar). Os códigos de recuperação aparecem **antes** de o fator ser ativado e são 6 (no produto, 10,
mostrados uma vez depois de ativar). Não há campo para entrar com código de recuperação.

**Produto**: `paginas/Mfa.tsx` (`/mfa`) e `paginas/ConfigurarMfa.tsx` (`/mfa/configurar`), duas telas. O produto tem um
campo único "Código do aplicativo" (6 dígitos) ou "Código de recuperação", o desafio em memória ("entre de novo" depois
de F5 ou do quinto erro, `SemDesafio`), o segredo em texto, o QR ao lado e os 10 códigos no fim. O mockup junta tudo
numa tela, com as seis caixas e "Perdi o acesso ao aplicativo".

---

## 5. Fecho

### (a) Rotas do recorte e redirecionamentos

| Rota | Tela | Arquivo | Casca |
|---|---|---|---|
| `/` | Mapa (roteiro de quem apresenta; **não é tela do produto**) | `areas/Mapa.tsx` | fora |
| `/entrar` | Entrar: "Qual é a sua escola?" e, com `?quem=equipe`, e-mail e senha | `areas/entrada/Entrada.tsx` | fora |
| `/entrar/verificacao` | Segundo fator (`?para=`, `?primeira=1`) | `areas/entrada/Verificacao.tsx` | fora |
| `/fundamentos`, `/fundamentos/onca` | prancha e bancada (outro inventário) | `areas/entrada/Fundamentos.tsx`, `BancadaOnca.tsx` | fora |
| `/e/:escola` | Entrada da escola (aluno) | `areas/publico/EntrarNaEscola.tsx` | fora |
| `/e/:escola/turma` | Página da turma (`?codigo=`, `#token`) | `areas/publico/TurmaPublica.tsx` | fora |
| `/e/:escola/avisar` | Avisar a escola, sem conta | `areas/publico/AvisarEscola.tsx` | fora |
| `/e/:escola/dados` | Pedido sobre dados, sem conta | `areas/publico/PedidoDados.tsx` | fora |
| `/convite` | Aceite do convite (`#token`, `?papel=coordenacao`, `?conta=existente`) | `areas/publico/AceitarConvite.tsx` | fora |
| `/aluno` | Início: conversa vazia com o Tutor (`?assunto=`, `?estado=`) | `areas/aluno/Tutor.tsx` | dentro |
| `/aluno/c/:id` | Uma conversa com o Tutor | `areas/aluno/Tutor.tsx` | dentro |
| `/aluno/tarefas` | Tarefas | `areas/aluno/Atividades.tsx` | dentro |
| `/aluno/tarefas/:id` | Uma tarefa (`?ajuda=n`) | `areas/aluno/Atividade.tsx` | dentro |
| `/aluno/eu` | Eu | `areas/aluno/Eu.tsx` | dentro |
| `/aluno/eu/privacidade` | Privacidade (`#dados`, `#memoria`, `#guardamos`, `#tutor`) | `areas/aluno/Privacidade.tsx` | dentro |
| `/aluno/avisar` | Avisar um adulto (`?conversa=`) | `areas/aluno/Avisar.tsx` | dentro |
| `/aluno/prova/:id` | Prova (`?rede=caiu`) | `areas/aluno/Prova.tsx` | **fora** (foco) |
| `/aluno/bem-vindo` | Introdução do aluno (`?rever=1`) | `areas/aluno/BemVindo.tsx` | **fora** (foco) |

Parâmetros globais (lidos em `App.tsx`, saem da URL com `replace`): `?como=<pessoa>` troca a sessão (aluno em
`/aluno/*`, professor em `/professor/*`); `?tema=escuro|claro|sistema` força o tema na aba. `?config=<seção>` abre os
Ajustes na casca.

Redirecionamentos (todos com `replace`; o `Redireciona` soma a consulta de quem chegou):

| De | Para |
|---|---|
| `/aluno/prova/estequiometria` | `/aluno/prova/prova-estequiometria` |
| `/aluno/prova` | `/aluno/prova/prova-estequiometria` |
| `/aluno/eu/memoria` | `/aluno/eu/privacidade#memoria` |
| `/aluno/memoria` | `/aluno/eu/privacidade#memoria` |
| `/aluno/privacidade` | `/aluno/eu/privacidade` |
| `/aluno/atividades` | `/aluno/tarefas` |
| `/aluno/atividades/:id` | `/aluno/tarefas/:id` |
| `/aluno/desempenho` | `/aluno/eu` |
| `/aluno/tarefas/:id` com prova não entregue | `/aluno/prova/:id` |
| `/aluno/prova/:id` já entregue ou corrigida | `/aluno/tarefas/:id` |
| `/aluno/prova/:id` sem envio da professora | `/aluno/tarefas` |
| `/aluno/bem-vindo` já vista, sem `?rever` nem `?como` | `/aluno` |

Atenção para o produto: `/aluno/atividades` e `/aluno/privacidade` são **endereços vivos hoje** (`caminhos.ts`); no
mockup viram redirecionamento. `/aluno/tutor`, `/aluno/tutor/:id` e `/aluno/minha-turma` não existem no mockup.

Encadeamentos de entrada: `/e/:escola` → (ok, primeira vez) `/aluno/bem-vindo` → "Começar" → primeira tarefa ou
`/aluno`; `/convite` (professor) → `/professor/bem-vindo` ou `/professor`; `/convite?papel=coordenacao` →
`/entrar/verificacao?primeira=1&para=/coordenacao` → `/coordenacao/bem-vindo`; `/entrar?quem=equipe` → professor direto,
ou verificação → `/coordenacao` · `/rede(/bem-vindo)` · `/operacao(/bem-vindo)`; Eu › Sair → `/e/colegio-aurora`.

### (b) As introduções ("bem-vindo")

No recorte só há a do **aluno** (`/aluno/bem-vindo`, 4 passos + fim = as "5 telas" do LEIAME). As outras quatro
(`/professor`, `/coordenacao`, `/rede`, `/operacao` `/bem-vindo`) são dos outros inventários; aqui só os gatilhos.

| # | Pose da onça | Fala (balão, `<h1>`) | Conteúdo | Botão | Obrigatório | O que grava |
|---|---|---|---|---|---|---|
| 1 `tutor` | acenando | "Oi, Lucas! Eu sou o Tutor, um programa da escola." | dois ladrilhos: "Posso errar. Confira no livro." · "Mostro a página de onde tirei." | "Continuar" | sim, no primeiro acesso (sem X) | nada |
| 2 `professores` | apontando | "Seus professores veem o que você me pergunta." | mini conversa só de leitura ("como acho o reagente limitante?" → "Divida os mols pelo coeficiente. O menor limita." + chip p. 151; na turma só de Física: "como passo km/h para m/s?" → "Divida por 3,6. 72 km/h viram 20 m/s.") e a linha com olho: "Prof. Camila acompanha a 2ºB." / "Seus professores acompanham a 2ºB." / "Seus professores acompanham." | "Entendi" | sim | nada |
| 3 `letra` | pensando | "Qual tamanho de letra fica bom pra você?" → reação "Assim fica bom!" | 3 `Opcao` com "Aa": "Normal" (17 px) · "Grande" (20) · "Bem grande" (24) e a prévia ao vivo "Assim fica a minha letra." | "Continuar" (só depois de escolher) | não (tem X) | `preferencias.mudar({ texto: { aluno } })` ao continuar |
| 4 `avisar` | acolhendo | "Se algo te incomodar, toque em Avisar um adulto." → reação "Isso! Aqui é só treino. Ninguém foi avisado." | caixa tracejada com o selo "TREINO" e a réplica do item da lateral "AVISAR UM ADULTO"; tocado: "Lá, quem lê é a orientação da escola." | "Continuar" (só depois de tocar) | sim | nada (nada é enviado) |
| fim | comemorando | "Pronto, Lucas!" | resumo com vistos: "Letra normal" (ou grande / bem grande) · "Avisar um adulto fica no menu"; e o cartão da primeira tarefa pendente (ladrilho, título, prazo) ou, sem tarefa, a caixa tracejada "Sua primeira dúvida vai aqui." | "Começar" | — | `sessao.verIntroducao('aluno')` → marca vista e registra `onboarding-visto` { alunoId }; navega à primeira tarefa (`/aluno/tarefas/:id`) ou a `/aluno` |

Regras da peça: uma vez por pessoa; sair pelo X ou Esc não marca como vista; Enter continua; nada de pontos, XP,
sequência, meta, vidas, ranking ou pedido de notificação. Rever: Eu › "Rever a introdução" (`?rever=1`).

Gatilhos das introduções (todas):

| Papel | Rota | Disparada por | Rever |
|---|---|---|---|
| Aluno | `/aluno/bem-vindo` | primeiro login em `/e/:escola` (`entrar()` devolve `primeiraVez`) | Eu › Rever a introdução |
| Professor | `/professor/bem-vindo` | aceitar o convite em `/convite` (se ainda não viu) | menu da pessoa |
| Coordenação | `/coordenacao/bem-vindo` | convite → `/entrar/verificacao?primeira=1&para=/coordenacao` | menu da pessoa |
| Secretaria | `/rede/bem-vindo` | segundo fator, enquanto não viu | menu do avatar |
| Equipe Turmma | `/operacao/bem-vindo` | segundo fator, enquanto não viu | menu do avatar |

Abrir `/rede`, `/operacao` ou `/coordenacao` direto não redireciona. Evento dos outros papéis: `introducao-vista`
{ papel, pessoa }.

### (c) Os fluxos do Mapa que passam por estas telas

O Mapa (`/`) tem quatro roteiros; os passos abaixo são os que tocam o recorte. O ✓ vem do evento entre parênteses.
(As definições F1 a F29 moram em planos fora do repositório, `~/Code/Turmma/pesquisa/…`, que não estão nesta máquina: os
números F são os que o `LEIAME.md` e o `Mapa.tsx` citam.)

**Roteiro 1 · A escola do zero ao primeiro aluno (F1, F9, F17)**
- Passo 1, Coordenação: `/convite?papel=coordenacao#hm-aurora` → criar a senha → `/entrar/verificacao?primeira=1` (6
  dígitos) → `/coordenacao/bem-vindo` (`introducao-vista` da coordenação ou `convite-aceito` com `papel: 'coordenacao'`).
- Passo 4, Professor: `/convite#<token do Marcos>` → "Criar senha e entrar" → `/professor/bem-vindo`
  (`convite-aceito`).
- Passo 6, Aluno: `/e/colegio-aurora/turma?codigo=<código da 3ºA>` → Alice Monteiro · 2026-0801 · senha de 8 ou mais →
  "Pronto! Seu professor vai confirmar que é você." (`pedido-nome`).
- Passo 8, Aluno: `/e/colegio-aurora` → 2026-0801 e a senha → `/aluno/bem-vindo` (5 telas) → "Começar"
  (`onboarding-visto` de aluno que não é o Lucas). A Alice é aluna nova: Tarefas vazias ("Nada pra fazer agora"), Eu com
  "Suas notas aparecem aqui".

**Roteiro 2 · A IA supervisionada em sala (F2 a F6, F11)**
- Passo 4, Aluno: `/aluno/tarefas?como=lucas` → a prova (NOVO, "Abre agora") → `/aluno/prova/prova-estequiometria` →
  Começar → responder → Revisar e entregar → "Entregue!" (`tarefa-entregue`). Enquanto a prova está aberta, o Início
  mostra "Na prova, eu descanso.".
- Passo 6, Aluno: Tarefas › Corrigidas › a prova → `/aluno/tarefas/prova-estequiometria` → "Isso está errado?" na
  questão 3 (`revisao-pedida`); depois do passo 7, o `Aviso` "A professora olhou: manteve a nota." com NOVO.
- Passo 8, Aluno: `/aluno/avisar?como=lucas` → "um colega me xingou no intervalo" + "Alguém me tratou mal" → "Recebido."
  (`aviso-enviado`, origem diferente de `publico`); depois do passo 9, o contador amarelo e a resposta em Seus avisos.
- Passo 10, Aluno: `/aluno?como=lucas` → digitar "não tô bem, briguei em casa" → mensagem fixa, 188 e "Avisar um adulto"
  (`assunto-delicado`).

**Roteiro 3 · Para a prefeitura e o jurídico (F7, F8, F10, F14, F15, F16)**
- Passo 1, Secretaria: `/entrar?quem=equipe` → `secretaria@educacao.joinville.example` → `/entrar/verificacao?para=/rede`
  → `/rede/bem-vindo` (`introducao-vista` da rede).
- Passo 9, Aluno: `/aluno?como=lucas` com o Tutor pausado pela coordenação: "A escola pausou o Tutor por enquanto."
  (o ✓ é `ia-reativada`, depois de a coordenação reativar).
- Passo 11, Aluno: `/aluno/eu/privacidade?como=lucas` → "Pedir meus dados" (`titular-pedido`, origem `aluno`); depois de
  atendido, o ponto azul em Eu e "Baixar meus dados".
- Passo 12, Público: `/e/colegio-aurora` → rodapé › "Avisar a escola" → enviar → guardar número e código → "Acompanhar"
  (`aviso-enviado`, origem `publico`). O "Pedido sobre dados" (`/e/colegio-aurora/dados`) está no mesmo rodapé.

**Roteiro 4 · Painéis sem média**: não passa pelo recorte.

**"Primeiro acesso, por papel"**: `/aluno/bem-vindo?como=lucas&rever=1` ("O Lucas conhece o Tutor", 5 telas) e os outros
quatro `…/bem-vindo?rever=1`.

**"Estados para demonstrar"** (atalhos do Mapa no recorte):
- `/aluno?estado=prova&como=lucas` — "Na prova, eu descanso."
- `/aluno?estado=fora&como=lucas` — "Volto na próxima aula."
- `/aluno?estado=limite&como=lucas` — "Por hoje é isso. Amanhã eu volto."
- `/aluno/prova/prova-estequiometria?rede=caiu&como=lucas` — "Sem internet. O tempo parou."
- `/aluno/tarefas/balanceamento?como=lucas` — tarefa corrigida, 6 de 8, o recado e "Isso está errado?"
- `/aluno/bem-vindo?como=lucas&rever=1` — primeiro acesso com a onça.
- Os dois atalhos de prova levam ao documento da professora, com "Envie a prova ao 2ºB antes", enquanto a prova não foi
  enviada.

**"Frases para o Tutor"** (todas em `/aluno?como=lucas`): "me dá a resposta da questão 4" · "deu 2 mol" · "você é uma
pessoa?" · "não tô bem, briguei em casa".

**"Atalhos de quem apresenta"** que valem aqui: senha "qualquer uma com 8 letras ou números"; segundo fator "qualquer 6
dígitos"; matrícula da Alice 2026-0801; matrícula do Lucas 2026-0412 (senha `demonstracao` ou 8+); código do 2ºB
K7M2 QX9B; e-mails da secretaria e da equipe.

### (d) O que mais pesa na hora de escrever o PRD (resumo dos esbarros)

1. **Caixa do Tutor que trava** na pausa, na prova e no limite × D36 (o produto mantém a caixa para o 188).
2. **Supervisão visível**: faixa presa do produto × linha cinza de 13 px do mockup (D8; Decreto 12.880, art. 11).
3. **"Sair"** fora da lateral do aluno × D59 (produto: sempre à vista).
4. **Onça com rosto e poses** como avatar do Tutor × D58 e D72 (produto: círculo com ícone, nunca rosto).
5. **Conversa livre fora de atividade**, com histórico: entidade nova, retenção, D8, D19 (fora da sala), D38.
6. **15ª rodada**: anexar foto (D5, D75, D55, regra 20), apagar/editar conversa (D8), refazer (D38), voto (regra 20,
   item 1).
7. **Entrada da escola responde "pedido esperando"** × R5 da A1 (produto: sempre "Matrícula ou senha incorretas").
8. **Convite mostra e-mail e disciplina** e entra direto × desenho atual (só a escola; login depois).
9. **Segundo fator só por QR** × regra 50, item 2 (segredo em texto no computador).
10. **Busca pública de escola** em `/entrar`: enumera clientes; endpoint novo sem sessão.
11. **Canais sem conta** (`/e/:escola/avisar`, `/e/:escola/dados`): superfícies públicas novas por tenant, com texto
    livre, contato de terceiro e risco de abuso; dependem do parecer do ECA Digital (arts. 24 e 28).
12. **Avisar um adulto, Eu (desempenho), prova em tela de foco e introdução**: telas sem fase no roadmap atual.
13. **Estados que o mockup não desenha** e o produto exige (regra 50, item 5): carregando e erro em todas as telas do
    aluno; resposta que não salvou; limite de tentativas; sessão vencida; aluno sem turma no ano.
14. **Nome do professor** na linha da tarefa, na memória do Tutor e na introdução: hoje o aluno não recebe esse dado.
