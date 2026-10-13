# Inventário D — coordenação, rede/secretaria, operação Turmma e família

Fonte: `/home/joaquimdp/Documentos/git/Prototipo_Turmma/mockups` (rodadas 10ª a 14ª do `LEIAME.md` e os "painéis de gestão" de 06 e 07/10/2026, que estão no código e **não** estão no LEIAME). Produto comparado: `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src`.

Convenções deste arquivo
- "M:" = caminho dentro de `mockups/src`. "P:" = caminho dentro de `apps/web/src` do produto.
- Texto entre aspas é literal da tela.
- **O mockup não tem servidor**: não existe estado "carregando" nem "erro de rede" em nenhuma tela do recorte. Onde abaixo se lê "carregando/erro: não existe", o produto precisa criar os dois (regra 50). Os únicos erros desenhados são de validação de formulário.
- Os números de decisão citados nos comentários do mockup (**D78** = "quem recebe risco à vida / atende o titular", **D80** = "sem conta do responsável", **D70** = "dois botões do mesmo tamanho") **não batem** com `docs/decisoes.md` do produto (lá D78 é o processo no Maestri e D70 é a saída da aba na prova). Não citar esses números em PRD sem conferir.
- Peças duo citadas só pelo nome: `Pagina`, `CabecalhoPagina`, `Botao`, `BotaoIcone`, `Selo`, `SeloIA`, `SeloTurma`, `Linha`, `Cartao`, `Dialogo`, `DialogoConfirmar`, `MenuMais`, `Opcao`, `Toque`, `GrupoToques`, `Segmentado`, `Busca`, `Campo`, `CampoTexto`, `Interruptor`, `Aviso`, `FaixaResultado`, `Carimbo`, `Recolhivel`, `Passos`, `Avatar`, `AvatarIA`, `Onca`, `Balao`, `Contador`, `LadrilhoIcone`, `EstadoVazio`, `Tabela`, `BarraApp`, `BarraProgresso`, `Introducao`, `ChatDados`, `Secao`.
- Peças turmma: `Casca`, `Sino`, `PainelLado` (painel ao lado, 480 px por padrão; folha de baixo no celular; fecha com X e Esc), `useParametro` (estado na query string).

Pessoas e dados sintéticos fixos: coordenadora **Helena Martins** (Colégio Aurora, escola estadual, 6º ao 3º EM, 612 alunos com acesso, 22 turmas, 31 professores, 684 nomes nas listas); "hoje" é segunda, 21/09/2026, 10h42.

---

## 0. Casca, navegação e o que é comum

Arquivos: M:`App.tsx`, M:`areas/coordenacao/rotas.tsx`, M:`areas/outras/rotas.tsx`, M:`components/turmma/Casca.tsx`.

**Coordenação** (`<Casca papel="coordenacao">`, rotas filhas de `/coordenacao`)
- Lateral branca de 256 px (recolhe para trilho de 88), 4 lugares: **Painel** (`/coordenacao`), **Analista** (`/coordenacao/analista`, com a cabeça da onça do Analista no lugar do ícone), **Escola** (`/coordenacao/escola`), **Registros** (`/coordenacao/registros`). Rótulos em caixa alta (`t-rotulo`).
- Rodapé da lateral: menu da pessoa (iniciais, nome, papel, "⋯") com: "Configurações da escola" (→ página `/coordenacao/configuracoes`), "Minha conta" (→ diálogo de 920 px, `?config=geral`), "Rever a introdução" (→ `/coordenacao/bem-vindo?rever=1`), "Ajuda" (→ diálogo "Falar com a Turmma": `ajuda@turmma.com.br`, "WhatsApp (47) 3000-0000", "Dias úteis, das 8h às 18h."), "Sair" (um clique, → `/entrar`).
- **Sino** no canto de cima à direita em toda tela (no celular, na barra do topo). `--reserva-sino` de 56 px a partir de 768.
- Celular (< 768): barra do topo de 56 px (pinta, nome da escola, sino, gaveta) e barra de baixo fixa de 68 px com os 4 lugares.
- Parâmetros que a **Casca** trata em qualquer tela: `?sino=1` (abre a lista), `?sino=<turmaId>` (abre filtrada), `?item=<id>` (abre o painel do item por cima da tela: `PainelDoItemCoordenacao`), `?config=<seção>` (abre "Minha conta"), `?tema=escuro|claro|sistema` (força o tema da aba e sai do endereço).
- "Minha conta" (M:`components/turmma/Configuracoes.tsx`, parte da coordenação): seções Geral ("Aparência": Sistema · Claro · Escuro; "Tamanho do texto": Padrão · Grande · Maior), Notificações ("Resumo de segunda", "Alerta do Analista": dois interruptores), Perfil ("Nome": Helena Martins; "Função": Coordenação pedagógica; "Escola"; "E-mail": helena.martins@colegioaurora.example), Segurança ("Como você entra": E-mail e senha; "Senha" → "Trocar a senha" com "Senha de agora"/"Senha nova", dica "8 ou mais letras ou números.", erro "Faltam letras: 8 ou mais."; "Duas etapas": "Obrigatório para a coordenação."; aparelhos: "Computador da coordenação", "Celular" "Ontem, 19h12", "Sair de todos os aparelhos?" / "Este aparelho continua conectado." / "Sair de todos").

**Rede/secretaria** (`<Casca papel="rede">`, `/rede`)
- 3 lugares: **Painel** (`/rede`), **Analista** (`/rede/analista`), **Escolas** (`/rede/escolas`). **Sem sino.**
- No topo da lateral, no lugar da escola: pílula da rede que é um menu "Ver a rede" com as duas redes (sigla "JOI" anil / "SC" verde): "Prefeitura de Joinville" e "Estado de SC · Regional Joinville". A escolha fica guardada e também vem de `?rede=prefeitura|estado`.
- Menu da pessoa: "Configurações" (diálogo de 480, só "Aparência"), "Como protegemos os dados" (→ `/rede?protecao=1`), "Rever a introdução", "Ajuda", "Sair".
- Celular: a barra do topo mostra a rede e troca de rede.

**Operação** (`/operacao`): **fora da casca**, com `BarraApp` própria. **Família** (`/familia`): fora da casca, `BarraApp` própria.

**Telas de foco, sem casca:** `/coordenacao/bem-vindo`, `/rede/bem-vindo`, `/operacao/bem-vindo`.

Produto hoje: P:`areas/navegacao.ts` dá à coordenação **7 itens** (Governança, Agentes, Analista, Estrutura, Professores, Material, Privacidade), sem sino, sem Painel, sem "Configurações da escola"; P:`componentes/CascaDaEscola.tsx` e `MenuDaPessoa.tsx` são a casca. Não existe área `/rede` nem `/familia` no produto (`papeis.ts`: coordenador, professor, aluno). A operação existe em P:`operacao/`.

---

## 1. Coordenação › Painel (Início)

- **Rota:** `/coordenacao`. Parâmetros: `?serie=<nome exato da série>` (filtra tudo pela série; valores "6º ano EF"… "3º ano EM"); `?periodo=anterior` (trimestre anterior; **só vale sem série**); `?item=`, `?sino=` (da casca). Arquivo M:`areas/coordenacao/Inicio.tsx` (`InicioCoordenacao`). Dentro da casca.
- **Composição, de cima para baixo** (`Pagina tipo="painel"`, até 1200 px, grade de 12 colunas, vão de 12):
  1. Cabeçalho numa linha (64 px): título "Painel"; complemento "Colégio Aurora · 612 alunos" (com série: "8º ano · N alunos"); selo com cadeado "Nomes com motivo" (title "Nomes de alunos só aparecem depois de registrar o motivo"; some no celular); à direita dois selects ("Série: Todas" → "Todas as séries" + 7 séries; "Trimestre: Atual" → "Trimestre atual · até 21/09" e "Trimestre anterior"; com série, a segunda opção vira desabilitada "Trimestre anterior (só a escola inteira)") e botão secundário "Relatório".
     - 375: os dois selects somem; entra o botão "Filtrar" / "Filtrar (N)" que abre o diálogo "Filtrar o painel" (os dois selects empilhados, "Limpar filtros", "Relatório" e o botão oficial "Ver").
  2. Linha de faixas (só quando há): **faixa roxa da urgência** (o item `risco` da fila ou o primeiro urgente sem prazo): ladrilho do tipo, "**<curto do item>** · <turma> · chegou às <hora>", botão "Abrir" (abre o item como o sino abriria). Ao lado, `FaixaPausas` (vermelha, uma linha por pausa): "**Tutor pausado** · <motivo> · <quando> · <quem>", botão "Ver" (→ `/coordenacao/registros?aba=ia&ver=como&ia=<agente>`).
  3. **5 ladrilhos** (`LadrilhoKPI`; 5 colunas a 1440; a 375, 2 colunas com o primeiro ocupando as duas), `aria-label` "Números da semana":
     - "APOIA sem aviso" = **4**, borda vermelha (alerta), prazo "até 24/09", origem Oficial. Clique abre a **lista com motivo** do APOIA da escola. Ajuda (?): "4 alunos no critério do APOIA, ainda sem aviso aberto." · "5 faltas seguidas ou 7 alternadas em 30 dias (APOIA, MPSC)." · "2 no 2ºB · 1 no 1ºC · 1 no 8ºA" · "Abrir o aviso no APOIA até 24/09." · fonte "APOIA 3 (MPSC) e diário · hoje 7h".
     - "Presença < 75%" = **14**, minigráfico vermelho fev→set, delta desde "ago" (+3). Clique **acende a coluna** `< 75%` na grade e rola até ela. Ajuda: "Alunos com frequência abaixo de 75% no ano: reprovam por falta (LDB, art. 24, VI)." · "Clique para acender a coluna na grade por turma."
     - "Matemática < 6,0" = **71**, minigráfico anil, delta "tri. ant." (+9). Clique acende a coluna MAT. Ajuda: "Alunos abaixo de 6,0 em Matemática no trimestre (a média mínima da rede)." · "17 entraram e 8 saíram desde o trimestre anterior."
     - "Sem chamada" = **2** (turmas), prazo "diário fecha 30/09". Clique abre o **painel "Turmas sem chamada"**. Ajuda: "2 turmas sem chamada lançada há 3 dias letivos ou mais." · "O Censo e o APOIA dependem do diário em dia." · "7ºB há 3 dias · 9ºC há 4 dias" · "O diário de setembro fecha em 30/09."
     - "Provas a aprovar" = **3** (o menor entre 3 e o que ainda espera), prazo "há 2+ dias", origem Turmma. É link para `/coordenacao/registros?aba=ia`. Ajuda: "3 provas corrigidas pela IA esperando a aprovação do professor." · "Nota da IA só vale depois que o professor aprova." · "2ºB · 8ºC · 1ºA" · "Esperando há mais de 2 dias."
  4. **Três gráficos** numa linha de 236 px (colunas 5 + 4 + 3; a 375 empilham), cada um um `CartaoGrafico` com a marca de origem e o "?":
     - "Frequência por faixa" (`BarraDeFaixas`): 4 faixas "≥ 95%" 399 · "90–95%" 131 · "75–90%" 68 · "< 75%" 14 (a última em vermelho, as outras em tons de anil), com o movimento por faixa e, à direita, o delta "18 … ago". Ajuda: "Alunos em cada faixa de frequência no ano." · "< 75% reprova por falta (LDB, art. 24, VI). 75–90% é falta crônica." · "18 pioraram de faixa e 9 melhoraram desde agosto."
     - "Fev → set" (`ColunasMensais`): duas séries, "< 75%" (vermelho: 3, 5, 6, 8, 9, 9, 11, 14) e "MAT < 6" (anil: 38, 47, 55, 58, 62, 60, 64, 71). Ajuda: "Quantos alunos estavam acima de cada limiar no fim de cada mês…" · "Escalas separadas: compare a forma, não a altura."
     - "Notas < 6,0" (com período anterior: "< 6,0 · tri. anterior") (`BarrasHorizontais`): "Língua Portuguesa" 47 (ant. 41), "Matemática" 71 (ant. 62), "2 ou mais componentes" 38 (ant. 33), cada uma com o delta. Ajuda: "Alunos abaixo de 6,0 no trimestre, a média mínima da rede. A seta compara com o trimestre anterior." + "<componente>: N entraram, N saíram."
  5. **Grade + coluna lateral** (8 + 4 colunas):
     - "Por turma" (tabela turma × limiar; legenda "passou do limiar" vermelho). Colunas: "Turma" · "Alunos" (some a 375) · "< 75%" · "75–90%" · "APOIA" · "LP < 6,0" · "MAT < 6,0" · "Sem chamada". A 375 ficam só as colunas essenciais (`< 75%`, `APOIA`, `MAT < 6,0`) mais a acesa. Linhas de 36 px, 22 turmas na ordem da escola; o nome da turma é link (`/coordenacao/escola/turmas/<id>`); a célula (`CelulaLimiar`) só ganha fundo vermelho e triângulo ao passar do limiar da coluna (limiares: `< 75%` a partir de 1 aluno; `75–90%` a partir de 15% da turma; `APOIA` a partir de 1; `LP` 12%; `MAT` 15%; `Sem chamada` a partir de 3 dias). Turma sem lista (3ºA): "sem lista" na linha inteira e "—" em Alunos. Linha final "Escola" (ou "Série"): somas; em "Sem chamada" o total é "N t." (turmas que passaram).
       - Clique numa célula com valor: se a coluna tem nomes (`< 75%`, `75–90%`, `APOIA`, `LP`, `MAT`) abre a **lista com motivo** daquela turma; em "Sem chamada" navega para a turma. Ajuda: "Alunos de cada turma acima de cada limiar. A célula fica vermelha ao passar:" + uma linha por coluna + "Clique num número para ver os nomes, com motivo registrado."
     - "Onde trava" (origem Turmma): 5 barras de habilidade com alunos abaixo de 50% de acerto ("Função quadrática" 58 de 120 · 1º EM · Matemática; "Termodinâmica" 57 de 126; "Reagente limitante" 55 de 126; "Equação do 2º grau" 41 de 87; "Expressões algébricas" 38 de 86). Clique → Analista com a pergunta "Em que habilidade o <série> mais trava?". Com série = 3º EM: texto "3º EM: um professor só, fica de fora." Ajuda: "Alunos abaixo de 50% de acerto em cada habilidade, nas provas aprovadas pelos professores." · "Clique para perguntar ao Analista."
     - "Falta por série": barra empilhada por série (vermelho `< 75%`, anil `75–90%`); clique numa série aplica/tira o filtro de série; série sem lista: "sem lista".
     - Rodapé de **8 números pequenos** (`NumeroPequeno`, grade 2 × 4): "Materiais IA" 412 · "Revisados" 100% · "Pacote IA" 49% · "Por aluno" R$ 2,43 · "Ideb AF" 5,4 · "Ideb EM" 4,6 · "Reprov. 1º EM" 11,2% · "Distorção 1º EM" 13,5%.
- **Painéis e diálogos da tela**
  - **Lista com motivo** (M:`_lista-com-motivo.tsx`): primeiro o diálogo "Ver os nomes" — "<título da lista>: **N alunos**. O motivo fica registrado com seu nome e a hora." — legenda "Para quê", opções (lista fechada): "Apoio aos alunos, com o professor da turma", "Conversa com a família", "Conselho de classe", "Pedido do titular do dado" (no APOIA, antes de todas: "Abrir o aviso no APOIA"); botões "Voltar" e "Ver e registrar" (do mesmo tamanho; o segundo só acende com motivo). Depois o painel ao lado: título curto (ex.: "abaixo de 75% · 2ºB"), o título completo, o limiar, a linha de fonte, a lista (nome em negrito, turma em caixa alta quando é da escola, matrícula, e o motivo em uma linha, ex.: "Frequência de 72% no ano · 5 faltas seguidas nesta semana", "Nota 5,2 no trimestre · estava acima de 6,0 no trimestre anterior", "5 faltas seguidas, de 14 a 18/09"), o rodapé "Registrado · <quem> · <quando> · <finalidade>" com cadeado, e o botão "Abrir a turma". Fechar o diálogo sem motivo fecha tudo. **Quem já registrou o motivo daquela lista vê de novo sem repetir o pedido.**
  - **Painel "Turmas sem chamada"**: "Sem chamada lançada há 3 dias letivos ou mais. O Censo e o APOIA dependem do diário em dia; o diário de setembro fecha em 30/09.", linha de fonte, lista de turmas (nome, "<série> · N alunos", "há N dias letivos", chevron, link para a turma) e "A pendência é da turma. Quem lança a chamada vê o aviso no próprio diário."
- **Onça:** não aparece.
- **Estados:** vazio da turma sem lista ("sem lista"); "3º EM: um professor só, fica de fora."; carregando/erro: não existem.
- **Ações no estado do mockup:** os filtros mexem na URL (`replace`); "Relatório" leva a `/coordenacao/analista?pergunta=Monte o relatório do mês`; registrar o motivo chama `ia.verDadosComNome(alvo, motivo)`, que vira linha "Viu dado com nome" na Auditoria.
- **O que precisa de dado e servidor:** (1) **frequência e faltas por aluno, lidas de um diário oficial** (Professor Online/EVN), com histórico mensal e faixa do aluno em agosto; (2) **notas do trimestre por componente** lidas do diário, com o trimestre anterior; (3) critério e avisos do **APOIA**; (4) dias letivos sem chamada por turma; (5) lotes de correção esperando há mais de 2 dias; (6) habilidade com alunos abaixo de 50% por série; (7) consumo do pacote de IA e custo por aluno; (8) Ideb e Censo da escola (INEP); (9) endpoint de leitura nominal com motivo de lista fechada, gravando auditoria; (10) a fila/urgência e as pausas de IA.
- **Atrito com regra do produto (ver também a seção 14):**
  - Frequência, faltas, APOIA e nota do diário **não existem** no modelo de dados nem na tabela da LGPD do produto; "faltas" é decisão em aberto no `CLAUDE.md`. O Painel inteiro depende disso.
  - A grade mostra **"LP < 6,0" e "MAT < 6,0" por turma sem motivo**: turma × disciplina é o recorte de **um professor só** (D45). O próprio mockup trata esse recorte como fechado no Analista e no alerta de Química.
  - A grade e os ladrilhos mostram **contagens de 1 a 4** por turma (APOIA 2, `< 75%` 1…). Na escola o mockup não aplica "menos de 5" (só nas entregas atrasadas do Analista).
  - "Sem chamada" por turma e "Provas a aprovar · 2ºB · 8ºC · 1ºA · há 2+ dias" são pendência de professor identificável pela turma (D45, D64).
  - A releitura da mesma lista nominal **não pede motivo de novo nem gera nova auditoria** (regra 20, item 10 pede registro por leitura).
- **Produto hoje:** não há Painel. A coordenação abre em P:`areas/coordenacao/Governanca.tsx`. O mais próximo é P:`areas/coordenacao/Analista.tsx` (um "resumo" gerado por botão, 4 `NumeroPainel`, "Alertas" e "Acerto por série e disciplina" só com 2 ou mais professores) e P:`DadoNominal.tsx` (diálogo "Abrir o dado nominal de uma turma", com Turma + Finalidade). O mockup tem ladrilhos, gráficos, grade turma × limiar e frequência/notas oficiais que o produto não tem; o produto tem **acerto percentual por habilidade** e a regra dos 2 professores aplicada no servidor, que o Painel do mockup não mostra.

---

## 2. Coordenação › Analista (conversa em tela inteira)

- **Rota:** `/coordenacao/analista`. Parâmetro `?pergunta=<texto>`: é enviado uma vez ao abrir e sai do endereço. Arquivo M:`areas/coordenacao/AnalistaTela.tsx` + M:`components/duo/chat-dados.tsx` (`ChatDados layout="tela"`) + M:`dados/analista-escola.ts` (roteiro) + M:`dados/consulta.ts` (motor). Dentro da casca.
- **Composição:**
  - Barra de 56 px com fundo e fio embaixo: cabeça da onça do Analista (32), "Analista", selo "IA", selo com cadeado "Nome só com motivo registrado" (title "Nome de aluno só com motivo registrado: o motivo fica na auditoria."); à direita, depois da primeira pergunta, o ícone "Nova análise" (limpa a conversa; as fixadas ficam) e "Relatório do mês" (botão com texto na conversa vazia; vira ícone depois).
  - **Conversa vazia**, com o grupo a 1/3 da altura: a **onça do Analista (88 px)**, título "<Bom dia|Boa tarde|Boa noite>, Helena", fala "Pergunte sobre a sua escola."; a caixa de pedido (placeholder "Pergunte sobre os números da escola"; no celular "Pergunte ao Analista"; botão "+" "Anexar uma planilha" aceitando .csv, .xlsx, .pdf; enviar; vira "parar" enquanto pensa/escreve); 4 pílulas "Perguntas prontas": "Abaixo de 75%", "APOIA esta semana", "Onde o 8º ano trava", "Pioraram desde agosto" (as outras duas do roteiro: "O que fazer com o 2ºB" e "Relatório do mês", fixa); a linha discreta "Resumo de segunda · 21/09, 7h10" (só se a preferência estiver ligada); o aviso "O Analista é uma IA e pode errar · Nome só com motivo registrado".
  - **Conversa começada:** coluna de 768 px; pergunta do usuário em balão à direita (editável: a conversa volta até ali); resposta com cabeçalho (cabeça da onça 24, "Analista", selo IA) e a forma fixa descrita na seção 16(c); "pensando" por 700 ms; acima da caixa, até 3 pílulas "Outras perguntas" (a fixa "Relatório do mês" vem primeiro).
  - 375: o selo IA sai da barra; na conversa vazia o selo vira "Nome com motivo"; com a conversa começada o selo sai e o relatório fica só na pílula.
- **Onça:** sim, a do Analista (anel anil), no vazio e em cada resposta. Fala: "Pergunte sobre a sua escola."
- **Estados:** vazio (acima); "pensando"; não há erro. A conversa sobrevive à troca de página (memória da aba) e recomeça ao recarregar.
- **Ações:** perguntar; "Fixar no relatório" (vira selo "Fixada"); "Baixar CSV"; "Ver as etapas"/"Esconder as etapas"; escolher motivo e "Mostrar os nomes"/"Mostrar por turma" ou "Agora não" ("Tudo bem. Nada foi aberto."); o cartão do arquivo com "Ver antes" (prévia do PDF) e "Baixar" (PDF real, feito no navegador; registra `exportacao`). "Ver em Registros", "Abrir Registros" e "Abrir o 2ºB" navegam.
- **Precisa:** um agente de dados com porta de IA (regra 30), consulta só sobre células agregadas, supressão de grupo pequeno, leitura nominal com motivo + auditoria, geração de PDF e CSV em fila, e orçamento de tokens.
- **Atrito:** ver 16(c) e a seção 14 (a resposta "O que fazer com o 2ºB?" recomenda encaminhamento de alunos; o anexo de planilha esbarra na D5/D75).
- **Produto hoje:** P:`areas/coordenacao/Analista.tsx` **não é conversa**: é um resumo com botão de gerar, números e alertas. O chat, as perguntas prontas, o relatório em PDF, o fixar e o CSV não existem.

---

## 3. Coordenação › Escola

- **Rota:** `/coordenacao/escola`. Parâmetros: `?aba=professores|material` (sem aba = Turmas); `?painel=ano|grade|importar|roteiro` (painel ao lado); `?filtro=todas|semlista|semprof|adaptacao` (aba Turmas); `?prof=<id>` (painel do professor); `?fonte=<id>` (painel do material). Trocar de aba limpa `painel`, `prof`, `fonte`, `filtro`. Endereços antigos: `?aba=ano|grade` → `?painel=`; `?aba=conta|contas` → `/coordenacao/configuracoes`; `?aba=alocacao` → `?aba=professores`. Arquivo M:`areas/coordenacao/Estrutura.tsx` (+ `Professores.tsx`, `Material.tsx`, `_estrutura-pecas.tsx`). Dentro da casca.
- **Cabeçalho:** título "Escola", complemento "Colégio Aurora · 2026", menu "⋯" com "Ano letivo e disciplinas", "Grade e calendário", "Importar listas"; 3 abas: "Turmas" · "Professores" · "Material". A página não rola; cada aba rola por dentro (a 375, quem rola é a aba inteira).
- **Peça comum das três abas:** `TabelaGrade` — cabeçalho de 40 px preso no alto, linha de grupo de 32 px, linhas de 48/56/64 px, selo sempre à direita, "›" quando a linha abre, linha inteira clicável. A 375 cada linha vira uma linha de lista (título em cima; selo e apoio embaixo). Vazio padrão "Nada por aqui."

### 3.1 Aba Turmas
- Faixa amarela **só enquanto falta montar**: "**Para terminar:** 3ºA sem lista · Jonas sem convite" (itens possíveis: "<turma> sem lista", "<primeiro nome> sem convite", "<turma> sem professor") + botão fantasma "Ver o que falta" (abre `?painel=roteiro`).
- Linha de controles: segmentado "Situação" com "Todas" · "Sem lista" · "Sem professor" · "Com adaptação" (a 375 vira um select); busca "Buscar turma"; botão "Nova turma" (laranja enquanto a montagem não termina; secundário depois).
- Tabela (linhas de 48), agrupada por série ("6º ano EF"… "3º ano EM"): colunas "Turma" (nome + selo roxo "N com adaptação") · "Turno" (Manhã/Tarde) · "Nomes" (número ou "—") · "Professores" ("Camila, Rafael +3", ou "—", ou "Pela grade horária" com title "Os professores vêm da grade horária") · "Situação" (selo: amarelo "Sem lista", vermelho "Sem professor", verde "Lista completa"). Linha → `/coordenacao/escola/turmas/<id>`. Vazio: "Nenhuma turma aqui." A 375: título = turma; apoio = "Manhã · 32 nomes · Camila, Rafael".
- **Diálogo "Nova turma"** (460): "Nome" (placeholder "7ºD"), "Série" (select, marcador "Escolha"), toques "Manhã"/"Tarde", botão "Criar turma". Erros: "Escreva como 7ºD.", "Esta turma já existe.", "Escolha a série." Criar leva à página da turma nova.

### 3.2 Painel "O que falta" (`?painel=roteiro`, 480 px)
- **Onça** (pose apontando, 72 px) com balão: "Faltam N coisas." / "Falta 1 coisa." / "A escola está montada!".
- 7 linhas com número ou visto verde (a atual em azul): "Ano letivo", "Séries", "Disciplinas", "Turmas", "Lista de nomes", "Professores", "Turmas do professor" (é o passo "Alocação"). Clique: os 3 primeiros abrem o painel "Ano letivo e disciplinas"; "Lista de nomes" leva à primeira turma sem lista; "Professores" abre a aba com o professor de convite vencido; "Turmas do professor" abre a aba Professores.

### 3.3 Painel "Ano letivo e disciplinas" (`?painel=ano`, 520 px)
- "Ano letivo": 3 linhas — "2027" "01/02/2027 a 10/12/2027" selo "Planejado"; "2026" "02/02/2026 a 11/12/2026" selo "Em curso"; "2025" … selo "Encerrado". **Só leitura** (não cria nem abre ano).
- "Séries" (com cadeado): 7 selos fixos, do "6º ano EF" ao "3º ano EM". **Travadas** (não se cria série).
- "Disciplinas": lista das 11 (Matemática, Português, Ciências, Química, Física, Biologia, História, Geografia, Inglês, Arte, Educação Física); cada uma com selo verde "Com professor" ou amarelo "Sem professor" (clicável: leva à aba Professores); a criada pela escola tem lixeira "Excluir <nome>". Campo "Nova disciplina" + botão "Criar". Erros: "Digite o nome.", "Já existe."

### 3.4 Painel "Grade e calendário" (`?painel=grade`, 600 px)
- "Grade horária" com selo "Em uso" / "Prévia" / "Gravada agora"; linha "grade-2026.xlsx · 138 aulas · 22 turmas"; tabela de exemplo do 2ºB (7h30, 8h20, 9h10 × Seg a Sex); botões "Importar a grade" (arquivo .xlsx, .xls, .csv) e "Usar a de exemplo".
- Na prévia: lista do que mudou ("2ºB · qua 9h10" Quí → Bio; "1ºC · sex 7h30" Geo → Quí), botões "Cancelar" e "Gravar grade". Depois: faixa verde "Grade gravada" / "A semana dos professores já mudou."
- "Calendário letivo" (só leitura): "3º bimestre" 03/08 a 02/10 · "Semana de provas" 28/09 a 02/10 · "Feriado" 12/10 · "4º bimestre" 05/10 a 11/12.

### 3.5 Painel "Importar listas" (`?painel=importar`, 640 px)
- `Passos`: "Arquivo" · "Colunas" · "Turmas" · "Importar".
  1. "Escolher planilha" (ou "Usar a de exemplo"); "Só nome, matrícula e turma."
  2. Um select por coluna do arquivo ("Coluna A · "Nome do aluno"" etc.) com "Nome" · "Matrícula" · "Turma" · "Não importar"; aviso "E-mail fica de fora: aluno não tem."
  3. Conferir como a turma veio escrita: "1 A · 1º A → 1ºA" com botão "É a mesma" → selo "Conferida".
  4. Resumo "N linhas · 3 turmas" / "N já estavam" / selo "N novos" e os nomes novos; botão "Importar N nomes" (ou "Nada novo"). Fim: faixa verde "N nomes novos" / "As listas já estão nas turmas." e "Fechar".
- Botões: "Continuar" (secundário, desabilitado até o passo estar completo).

### 3.6 Aba Professores (`?aba=professores`, `?prof=<id>`)
- Controles: busca "Buscar professor"; "**31** professores"; botão laranja "Convidar professor".
- Tabela (linhas de 56): "Nome" (avatar de iniciais + nome) · "Disciplinas" · "Turmas" (selos de turma) · "Situação". Situações: verde "Ativo"; amarelo "Falta confirmar" / "Convite em aberto"; vermelho "Contestou a turma" / "Convite vencido"; neutro "Revogado" / "Vínculo encerrado". Os 7 da conta abrem ao lado; os 24 "da grade horária" são só leitura (sem "›"). **A lista não mostra e-mail.** Vazio: "Nenhum professor com este nome."
- **Painel do professor** (480): selo da situação, "<disciplinas> · <quando>" (ex.: "Química · entrou em 02/02"); "Turmas": por turma, selo da turma, disciplina e selo "Confirmou" / "Falta confirmar" / "Contestou" / "Encerrada"; se contestou, aviso vermelho com o motivo ("Não dou aula nesta turma", "A turma está errada", "A disciplina está errada", "Outro motivo") e o complemento entre aspas. Vazio: "Nenhuma turma." Rodapé: "⋯" ("Acrescentar turma", "Revogar convite" [só com convite], "Encerrar vínculo") + "Refazer convite" (com convite pendente ou vencido) + "Corrigir turma". Depois de salvar: faixa verde "Corrigido: 8ºC · Português" (ou "Acrescentado: …") e "A Camila confirma pelo sino." / "O Paulo confirma pelo sino."
- **Diálogo "Corrigir turma" / "Acrescentar turma"** (480): "Turma" (marcador "Escolha a turma"; já vem a turma que o professor escreveu na contestação), "Disciplina" ("Escolha"), botão "Salvar". Erros: "Escolha a turma e a disciplina.", "Já está nesta turma, nesta disciplina."
- **Diálogo "Convidar professor"** (600): "Nome", "E-mail" (placeholder "nome@escola.com.br"), "Disciplina", "Turmas" (um toque por turma), botão "Gerar convite". Erros: "Digite o nome.", "Digite um e-mail válido.", "Este e-mail já é de um professor daqui.", "Escolha a disciplina.", "Escolha ao menos uma turma."
- **Diálogo "Convite pronto" / "Convite refeito"** (560): "Para **<nome>**. Vale 7 dias."; caixa com o link (mostrado como "turmma.com/convite#…") e botão "Copiar link" → "Copiado"; aviso "O link aparece uma vez."; "Fechar". Fechar sem copiar: "Fechar sem copiar?" / "O link não aparece de novo." / "Voltar ao link" / "Fechar".
- Confirmações: "Revogar o convite de <nome>?" / "O link deixa de valer na hora." / "Revogar"; "Encerrar o vínculo de <nome>?" / "As turmas deixam de abrir para ele na hora." / "Encerrar".

### 3.7 Aba Material (`?aba=material`, `?fonte=<id>`)
- Linha de cima: cadeado "O material fica na escola e não treina IA." + botão laranja "Enviar material".
- Tabela (linhas de 64), com o que falhou primeiro: "Material" (ladrilho, título em até 2 linhas, dono) · "Para" ("2º EM · Matemática") · "Licença" · "Situação" (vermelho "Não carregou" / "Recusado"; amarelo "Processando"; verde "Pronto"; neutro "Retirado"). Vazio: "Nenhum material ainda."
- **Painel da fonte:** selo; aviso de falha (ex.: "Páginas 40 a 72 sem texto" / "Envie um PDF com texto."); "Retirado do uso" / "<motivo> · <quando>"; campos "Para", "Dono", "Licença", "Páginas". Rodapé: "⋯" → "Retirar do uso"; "Enviar outra versão" (só no que falhou) → faixa "Outra versão enviada" / "Lendo agora." ou "Pronto para a IA ler."
- "Retirar do uso?" / "A IA para de usar este material na hora." / campo "Motivo" (texto livre, placeholder "Ex.: o dono pediu a retirada") / "Retirar".
- **Diálogo "Enviar material"** (600): "PDF" ("Escolher PDF"), "Dono" (placeholder "Colégio Aurora"), "Licença" ("Material próprio da escola", "Licenciado por contrato", "Licença aberta (CC ou domínio público)", "Não tenho a licença"), "Série", "Disciplina", caixa "A escola pode usar este material. Fica registrado com meu nome.", botão "Enviar". Erros: "Escolha o PDF.", "Diga quem é o dono.", "Sem licença, não envia. Nada saiu do computador.", "Escolha a série e a disciplina.", "Marque a declaração."

- **Onça na Escola:** só no painel "O que falta".
- **Precisa (Escola inteira):** o que a A1 e a A2 do produto já têm (ano, séries, disciplinas, turmas, professores, convites, alocação, material com licença) **mais**: importação de grade horária e calendário por planilha; importação de listas de várias turmas com mapeamento de coluna; situação da montagem calculada no servidor; filtro por adaptação; "retirar material do uso" com motivo; professores "da grade" como registro só de leitura.
- **Atrito:** séries travadas e ano letivo só leitura **tiram** o que o produto faz (criar ano, série, turma; renomear e excluir). "Motivo" de retirada é texto livre. A importação aceita arquivo com coluna de e-mail e a descarta na tela (o produto deve descartar antes de gravar, regra 20 item 2).
- **Produto hoje:** P:`areas/coordenacao/Estrutura.tsx` é **uma página só em seções** (roteiro, Ano letivo, Séries, Disciplinas, Turmas e a Alocação de P:`Alocacao.tsx`), com criar/renomear/excluir e os quatro estados; P:`Professores.tsx` e P:`Material.tsx` são **páginas separadas na lateral** (o Material com o formulário na própria página, não em diálogo). O mockup junta tudo em 3 abas com painéis ao lado, acrescenta grade/calendário e importação em lote, e não tem a tela de Alocação (ela mora no painel do professor). O produto tem "De quem é o material" e "Quem deu a licença" como campos separados e exclusão de material; o mockup tem "Dono" + "Licença" e "Retirar do uso".

---

## 4. Coordenação › Lista da turma

- **Rota:** `/coordenacao/escola/turmas/:turma` (`:turma` = id da turma, ex.: `2b`, `au-3a`). Parâmetro `?aluno=<id>` abre o painel do aluno. Arquivo M:`areas/coordenacao/ListaDaTurma.tsx` + M:`Adaptacoes.tsx` (`PainelAluno`). Dentro da casca.
- **Cabeçalho:** "‹ Escola" (volta para `/coordenacao/escola`), título = nome da turma ("3ºA"), complemento "3º ano EM · Manhã · 32 nomes", menu "⋯" → "Exportar lista" (→ `/coordenacao/registros?exportar=1&conjunto=lista:<id>`; some na turma sem lista).
- **Composição:**
  1. Faixa **"No Painel"** (48 px; só em turma com dados): os 6 rótulos da grade (`< 75%`, `75–90%`, `APOIA`, `LP < 6,0`, `MAT < 6,0`, `Sem chamada`) com o número da turma; as contagens com nome abrem a lista com motivo; à direita "Perguntar ao Analista" (pergunta "O que fazer com o 2ºB?" no 2ºB; nas outras "Quantos alunos do <turma> estão abaixo de 75% de frequência?").
  2. Avisos na largura toda: faixa verde "Lista gravada · N nomes" + "Fechar"; e **pedidos**: se a turma tem professor confirmado, só a linha "3 pedidos esperando a Prof. Camila." (ou "o Prof. …"); se **não tem**, o bloco "Pedidos para entrar · N" com caixas de marcar (nome, selo amarelo "Matrícula diferente", "matrícula · quando"), botões "Recusar" e "Aprovar marcados" (até 40 por vez) e, depois, selo "N aprovados"/"N recusados".
     - Confirmação: "Aprovar N pedidos do <turma>?" / "Passam a entrar com a matrícula e a senha que criaram." / "Aprovar N pedidos"; "Recusar N pedidos do <turma>?" / "O nome volta à lista, livre para pedir de novo." / "Recusar".
  3. Linha de controles (turma com lista): busca "Buscar nome ou matrícula"; "**N** de M entraram"; "Acrescentar nomes".
  4. Duas colunas (`1fr` + 340 px; a 375 empilham): à esquerda a **lista** (linhas de 48: "Nome" + selo roxo "Adaptação" · "Matrícula" · "Situação" com selo verde "Na turma" / amarelo "Pediu para entrar" / neutro "Livre"; vazio "Nenhum nome com esta busca."); à direita "Professores · N" (avatar, nome, disciplina, selo "Confirmou" / "Falta confirmar" / "Contestou" / "Encerrada"; link para o professor; vazio "Nenhum professor ainda.") e "Com adaptação · N" (nome + tipos por extenso, ex.: "Fonte ampliada, enunciado direto"; vazio "Ninguém nesta turma.").
- **Turma sem lista (3ºA):** no lugar da lista, o bloco "Colar a lista" com selo "Sem lista": área de texto "Um aluno por linha: nome; matrícula" (placeholder "Alice Monteiro; 2026-0801 / Bernardo Pires; 2026-0802"), botões "Enviar arquivo CSV", "Ver a prévia", "Gravar lista" (só acende com a prévia limpa e atual); caixa "O formato" — "Um aluno por linha: o nome, ponto e vírgula, a matrícula." / "Do sistema da secretaria, exporte em CSV com as colunas Nome e Matrícula. A prévia aponta o erro linha a linha antes de gravar."
  - Prévia linha a linha: número da linha, nome, matrícula e o erro em vermelho: "Falta o nome", "Falta a matrícula", "Parece CPF, e não matrícula", "Matrícula repetida", "Matrícula já usada". Contagem "34 linhas · 2 com erro" / "nenhum erro"; selo "O texto mudou"; toque "Só com erro".
- **Diálogo "Acrescentar nomes ao <turma>"** (600): área "Um por linha: nome; matrícula" (placeholder "Nome do aluno; 2026-0000"), a mesma prévia, botões "Ver a prévia" e "Acrescentar N nomes".
- **Painel do aluno** (`?aluno=`): título = nome; selos matrícula e situação; seção "Adaptação":
  - sem adaptação: 6 caixas (lista fechada, **sem texto livre**): "Fonte ampliada", "Enunciado direto", "Tempo adicional", "Resposta escrita no lugar da oral", "Apoio visual no enunciado", "Menos itens por página"; validade em toques "Até o fim do ano" / "Até o fim do bimestre (11/12)"; botão oficial "Registrar adaptação" → faixa "Adaptação registrada" / "O professor da turma já vê."
  - com adaptação: selos roxos dos tipos, "<validade> · <quem> · <data>" (ex.: "Ano letivo de 2026 · Helena Martins · 10/02"), botão "Encerrar adaptação" → "Encerrar a adaptação?" / "A próxima prova adaptada já não vai para este aluno." / "Encerrar" → "Adaptação encerrada".
  - rodapé fixo do corpo: cadeado "Só o tipo. Sem laudo nem diagnóstico."
  - "⋯": "Mudar de turma" ("Mudar <nome> de turma" / "A conta e a senha seguem as mesmas." / select "Para a turma" / "Mudar"); "Encerrar matrícula" (aluno com conta: "Encerrar a matrícula de <nome>?" / "A conta é desativada." / "Encerrar matrícula"); "Retirar da lista" (só nome livre: "Retirar <nome>?" / "Ninguém pediu este nome. Se foi engano, acrescente de novo." / "Retirar").
- **Estados:** turma inexistente: título "Turma não encontrada" + aviso vermelho "Esta turma não está no ano letivo em curso."; sem lista; busca vazia.
- **Onça:** não.
- **Precisa:** o que a A1 já tem (lista, prévia, pedidos, decisão em lote) **mais**: adaptação por aluno (tipo + validade + autor), mudar de turma mantendo a conta, encerrar matrícula (desativa a conta), acrescentar vários nomes, as contagens do Painel por turma, exportar lista com finalidade.
- **Atrito:** a adaptação é só tipo de lista fechada (alinha com a D35 e a D67). A faixa "No Painel" repete LP/MAT por turma sem motivo (mesmo ponto da seção 1). No mockup os pedidos aparecem **sem o "Atualizar"** e sem o texto de auditoria da leitura que o produto tem.
- **Produto hoje:** P:`areas/coordenacao/ListaDaTurma.tsx` (com `pecas-da-lista.tsx`, `previa-da-lista.ts`, `ler-arquivo-da-lista.ts`): colar lista com prévia, lista de nomes, "Acrescentar um nome" (**um por vez**, diálogo com "Nome do aluno" e "Matrícula"), "Retirar o nome da lista", pedidos lidos só ao clicar em Atualizar, com auditoria. Não tem: faixa "No Painel", coluna de professores da turma, "Com adaptação", painel do aluno (adaptação, mudar de turma, encerrar matrícula), exportar lista. O produto tem mensagens de conflito e de turma fora do ano que o mockup não tem.

---

## 5. Coordenação › Registros

- **Rota:** `/coordenacao/registros`. Parâmetros: `?aba=avisos|auditoria` (sem aba = IA); `?dossie=1` (painel do Dossiê, por cima de qualquer aba); `?exportar=1` e `?conjunto=<id>` (painel Exportar; `conjunto` = `estrutura|documentos|notas|uso|auditoria|lista:<turmaId>`); da aba IA: `?item=<id>` (registro aberto), `?ver=como` e `?ia=assistente|tutor|analista` (painel "Como cada IA trabalha"), `?serie=1|<série>` (painel "Por série"); da aba Avisos: `?aviso=<id>`; da Auditoria: `?item=<id>`. Trocar de aba apaga `item`, `aviso`, `ver`, `ia`, `serie`. `?aba=dossie` vira `?dossie=1`. Arquivo M:`areas/coordenacao/Registros.tsx` (+ `Governanca.tsx`, `Agentes.tsx`, `Denuncias.tsx`, `Auditoria.tsx`, `Exportar.tsx`, `Conformidade.tsx`). Dentro da casca.
- **Cabeçalho:** título "Registros"; à direita dois botões secundários "Dossiê" e "Exportar dados" (a 375: "Dossiê" e "Exportar", pequenos); 3 abas "IA" · "Avisos e pedidos" · "Auditoria"; na ponta direita da linha das abas, só na aba IA e a partir de 768: "Gerou **412** · Aprovadas **389** · Esperando **23**" (a partir de 1280) e o botão "Como cada IA trabalha". A página não rola.

### 5.1 Aba IA (governança) — M:`Governanca.tsx`
- Abaixo de 1280 os 3 números descem para o topo da aba; abaixo de 768 descem também os botões "Como cada IA trabalha" e "Por série".
- `FaixaPausas` (uma linha vermelha por pausa, com "Reativar" direto).
- Seção "O que a IA gerou e quem aprovou" com a ação "Ver por série"; segmentado "Estado": "Todos" · "Para aprovar" · "Aprovados" · "Recusados" (a 375, select); busca "Buscar documento ou turma".
- Tabela (linhas de 56): "O quê" ("**Correção** · 26 provas de mol e massa molar" + selo azul "Agora" [o evento mais novo, nos últimos 5 minutos] ou "Hoje") · "Turma" · "Aprovado por" (nome do professor; "Recusou: <nome>"; "—") · "Quando" ("21/09, 9h50") · "Estado" (amarelo "Para aprovar", verde "Aprovado", vermelho "Recusado", neutro "Rascunho"). Vazio: "Nada com esse estado ou essa busca."
- Pé: "Mostrando N dos 412 de setembro." + cadeado "Para não virar ranking de professor, não há filtro nem ordem por professor."
- **Painel do registro** (`?item=`): título "<o quê> · <turma>"; selo do estado + "gerado em <quando>"; "O que foi gerado" (assinatura do Assistente; "Do material da turma, com a página em cada questão."); "O que foi mostrado" ("As notas, a turma e os destaques no topo." ou "O documento inteiro, antes de enviar."); se aprovado: "O que foi aberto" ("Todos os destaques, um a um." ou "Todas as páginas.") e "Quem aprovou" (carimbo "Aprovado por … · quando"; "Só depois disso chegou aos alunos."); se recusado: "Quem recusou" (nome, quando, o motivo entre aspas, "Não chegou a nenhum aluno."); se espera: "Espera o professor da turma. Até lá, nada chega aos alunos."; se rascunho: "Rascunho do professor. Não foi enviado."; pé com cadeado "O nome de cada aluno fica com o professor da turma."
- **Painel "Por série"** (`?serie=`, 520): cadeado "Sempre em agregado e em contagem de alunos, sem média: quantos ficaram abaixo de 50% de acerto na prova de alguma disciplina; embaixo, em cada habilidade (um aluno pode ir bem na prova e travar numa habilidade). Com um professor só, o recorte fica fechado."; lista das 7 séries: "**41** gerados · **N** abaixo de 50% na prova" (gerados: 41, 38, 52, 63, 71, 112) e, no 3º ano EM, selo "Fechado" (title "Com um professor só, o recorte fica fechado."); bloco "2º ano EM · Química · abaixo de 50% na habilidade" (habilidade + "**N** de 126").

### 5.2 "Como cada IA trabalha" (agentes) — M:`Agentes.tsx`, painel de 520 (`?ver=como`)
- Segmentado "Qual IA": "Assistente" · "Tutor" · "Analista" (com a cabeça da onça de cada um; some a 375).
- Cabeçalho: cabeça da onça (48), nome, selo "IA", selo amarelo "Alto risco", selo vermelho "Pausado"; "Para o professor" / "Para o aluno, com o professor da turma" / "Para a coordenação".
- Três blocos com marcador (verde ✓, amarelo ampulheta, vermelho proibido):
  - Assistente — "Faz sozinho": "Rascunho de prova, atividade e plano, quando pedem", "Corrige objetivas", "Cita material e página". "Espera um professor": "As notas, antes de chegarem ao aluno", "Toda versão adaptada". "Nunca faz": "Nota em redação ou discursiva", "Guardar laudo ou CID", "Avisar fora do horário útil".
  - Tutor — "Faz sozinho": "Responde por perguntas, dentro do conteúdo", "Avisa o professor onde a turma travou". "Espera um professor": "Busca em fontes: a escola libera, o professor liga". "Nunca faz": "Entregar resposta pronta", "Dizer que é uma pessoa", "Aconselhar em assunto pessoal".
  - Analista — "Faz sozinho": "Resumo de segunda, em agregado", "Alerta quando algo muda". "Espera a coordenação": "Ver dados com nome, com a finalidade registrada". "Nunca faz": "Ranking de professor", "Falar com professor ou família", "Recomendar decisão sobre pessoa".
- "Funções" (só no Assistente): "Conversa e ferramentas", "Correção de objetiva" (Alto risco), "Adaptação" (Alto risco), "Dia e semana do professor"; nas de alto risco, botão "Pausar" / "Reativar" e selo "Pausada".
- Recolhível "Avaliação de impacto (AIA)" com apoio "v3 · vigente · a mesma do Dossiê" (Analista: "v1 · em revisão" e aviso "O pedido principal mudou em 15/09. A revisão fica pronta até segunda."): finalidade, "Riscos que olhamos", "O que segura cada risco", e a linha de contestação.
- Botão de perigo "Pausar o <IA>". Diálogo: "Pausar o Tutor?" (ou "Pausar a correção?" / "Pausar a adaptação?") / "Vale agora, na escola inteira, até alguém reativar. O que já foi aprovado continua valendo." / "Motivo": "Conferência com a família", "Erro de conteúdo", "Pedido da direção" / "Voltar" e "Pausar".
- Pausado: faixa vermelha "<IA> pausado" / "<motivo> · <quando>" + "Reativar"; depois a nota verde "Tutor reativado · 10h45" + "Fechar". Efeito no aluno: a onça dorme e "A escola pausou o Tutor por enquanto."

### 5.3 Aba Avisos e pedidos (avisos, denúncias, encaminhamento, pedidos do titular) — M:`Denuncias.tsx`, `?aviso=<id>`
- Tabela (linhas de 64) em dois grupos: "Abertos e em análise · N" e "Concluídos". Colunas: "Assunto" (ladrilho do tipo: aviso vermelho, encaminhamento roxo, pedido anil; categoria; "Aviso 31 · análise humana" ou "… · automática, revista por gente") · "Origem" · "Prazo" ("Hoje", "Até 23/09"; vermelho "Venceu 22/09" só se venceu) · "Estado" (amarelo "Aberto", azul "Em análise", verde "Concluído"). Vazio: "Nenhum aviso nem pedido."
- Pé: cadeado "A conversa do aluno não aparece aqui. Ver o trecho pede o motivo."
- Sementes: 27 (pedido, "Dúvida sobre o uso do dado do aluno", "Família · canal da escola", concluído); 28 (aviso, "Questão gerada com erro de conteúdo", "Professor · pela Ajuda"); 29 (aviso, "Pedido fora do conteúdo da turma", "Filtro de conteúdo do Tutor", automática); 30 (aviso, "Algo no sistema me deixou desconfortável", "Avisar um adulto · aluno do 9ºA", em análise); 31 (aviso, "Resposta da IA que pareceu errada", aluno do 2ºB, aberto, até 23/09); 32 (encaminhamento, "Encaminhamento à orientação", "Tutor · assunto delicado", prazo hoje); 33 (pedido, "Ver os dados do filho", "Canal da escola · sem conta", até 06/10, com contato e código).
- **Painel do aviso:** título "Aviso 31" / "Encaminhamento 32" / "Pedido 33"; selo da situação, "Prazo: …", selo da turma; categoria; "<origem> · <recebido> · análise humana".
  - Sem a atribuição: aviso "Fechado para você" — "Só quem recebe risco à vida abre este caso." / "Só quem atende o titular abre este pedido."
  - "Quem é" (aviso e encaminhamento com aluno): "<nome> · <turma>" + "Só quem recebe risco à vida vê o nome." / "Só a orientação e a coordenação veem o nome."
  - "O que foi escrito" / "O que aconteceu" / "O pedido": o texto; "Contato para a resposta: **…**" ou "Sem contato: a resposta fica só no Acompanhar, pelo número N."
  - "Ver o trecho" (botão com cadeado) → diálogo "Ver o trecho" / "Fica registrado com seu nome, a hora e o motivo." / motivos por tipo — aviso: "Entender o que o aluno avisou", "Conferir se a resposta da IA estava errada", "Pedido da família ou do aluno"; risco: "Avaliar risco", "Combinar o acolhimento com a orientação", "Pedido da família ou do aluno"; titular: "Atender o pedido do titular" / "Ver e registrar". Depois: "O trecho da conversa" (falas "Aluno:" / "Tutor:") e "Aberto por <quem> · <motivo>". Ver o trecho passa de Aberto para Em análise.
  - "Conteúdo retirado" (aviso verde, "<motivo> · <quando>") e a fala do Tutor riscada.
  - Encaminhamento: botão "Notificar o Conselho Tutelar" → diálogo "Notificação ao Conselho Tutelar" / "Lei 13.819/2019, art. 6º. Fica na linha do tempo." / "Quando" / "Por qual meio": "Telefone", "E-mail", "Presencial", "Ofício" / "Registrar"; depois o carimbo "Conselho Tutelar notificado: <data> · <meio>".
  - Pedido do titular: "O que o sistema guarda deste aluno" — "Nome, matrícula e turma", "Tarefas e notas aprovadas", "Conversas do Tutor dos últimos 90 dias", "Memória do trabalho (N frases)" / "(nada guardado)"; "Compartilhado com: provedor de IA, sem nome."; no pedido sem conta: "Aluno: **<nome> · <turma>**" ou "Nenhum aluno com o nome e a turma informados. O arquivo sai sem dados; fale com a família."; "Baixar o arquivo" (JSON).
  - "Linha do tempo" (data/hora + o que foi feito).
  - Rodapé: "⋯" ("Registrar ação", "Encaminhar à orientação" [só aviso], "Retirar o conteúdo" [só aviso com trecho], "Pausar a função" [leva ao painel do Tutor]) + "Responder e concluir" (ou "Atender" no pedido sem arquivo). Respondendo: campo "O que o aluno vai ler" / "O que a família vai ler" / "O que quem avisou vai ler" com a dica "Sem nome de colega. Fica na linha do tempo."; botões "Voltar" e "Enviar". Textos prontos do pedido: "Seus dados estão prontos. Baixe em Privacidade › Seus pedidos." / "O arquivo com os dados foi enviado para o contato que você deixou." / "O arquivo com os dados está pronto. Busque na secretaria com este número."
  - Concluído: faixa verde "Concluído" / "Resposta enviada · <quando>" (ou "Análise feita por uma pessoa"); "O que o aluno leu" + "<quem> · <quando> · lido" + "Quem avisou pode recorrer em até 10 dias."
  - Diálogos: "Retirar o conteúdo?" / "A resposta do Tutor sai da conversa do aluno. Fica registrado." / motivos "Informação errada", "Conteúdo impróprio para a idade", "Pedido de quem avisou" / "Retirar". "Registrar ação" / "O que foi feito" (placeholder "Ex.: conversei com o professor da turma.", dica "Não escreva o nome do aluno.") / "Registrar". "Atender o pedido N" / "Um arquivo com tudo o que o sistema guarda deste aluno. Responda até 06/10 (15 dias)." / caixa "Confirmei que é o responsável (documento na secretaria)" (só sem conta) / "Gerar o arquivo".

### 5.4 Aba Auditoria — M:`Auditoria.tsx`, `?item=<id>`
- Controles: busca "Turma, pessoa, aluno ou finalidade"; select "Tipo" ("Todos os tipos", "Aprovação", "Dados com nome", "Exportação", "Trecho de conversa", "Avisos e pedidos", "Permissão", "Pausa ou reativação"); select "Período" ("Setembro", "Agosto", "Ano letivo").
- Tabela (linhas de 56): "O quê" (+ selo azul "Agora" nas da sessão) · "Tipo" · "Quem" · "Quando". Exemplos: "Lista de estequiometria · 2ºB" / Aprovação / Camila Souza / 21/09, 9h50; "Química abaixo de 6,0 por turma · 2º ano EM" / Dados com nome / Helena Martins; "Histórico de uso de IA · agosto · CSV" / Exportação; "Trecho do Tutor · 9ºA · aviso 30"; "Vínculo encerrado · professor substituto · 1ºC"; "1ºC · 5 alunos com três entregas faltando"; "Adaptação pausada e reativada no mesmo dia". Vazio: "Nada com essa busca."
- Pé: "Do mais novo para o mais antigo." + a frase do cadeado sobre ranking.
- **Painel do registro:** título = tipo; o quê; "Quem" (nome · papel), "Quando", "Para quê" (finalidade); se foi aprovação de IA, a assinatura do Assistente e o carimbo; cadeado "Só este recorte, nesta sessão."

### 5.5 Exportar dados — M:`Exportar.tsx`, painel (`?exportar=1&conjunto=`)
- "O quê" (caixas): "Estrutura da escola" / "Turmas, grade e quem dá aula"; "Documentos dos professores" / "Provas, atividades e planos"; "Notas aprovadas" / "Com quem aprovou e quando"; "Histórico de uso de IA" / "O que a IA gerou e quem aprovou"; "Registros de auditoria" / "Quem fez o quê, quando e para quê"; e, vindo da turma, "Lista do <turma>" / "Nome, matrícula e situação". Cadeado: "Conversa do Tutor e dado de um aluno só saem a pedido do titular."
- "Formato": CSV · JSON. "Período": "Setembro" · "3º bimestre" · "Ano letivo". "Para quê" (toques): "Guarda da escola", "Relatório à mantenedora", "Troca de sistema", "Pedido de órgão público"; "Fica registrado com seu nome."
- Botão "Gerar" (só com conjunto e finalidade) → faixa "Pronto" / "O link vale 24 h · <quando>" + botão oficial "Baixar" (baixa `colegio-aurora-<conjunto>.csv|json` e registra `exportacao`).

### 5.6 Dossiê (conformidade) — M:`Conformidade.tsx`, painel de 640 (`?dossie=1`)
- Título "Dossiê da escola". "O que falta" (N):
  - "Encarregado de dados": sem encarregado, selo vermelho "É lei" + "LGPD, art. 41" + botão "Indicar" (→ `/coordenacao/configuracoes?de=dossie#encarregado`); com encarregado, "LGPD, art. 41 · <nome> · <contato>" + selo "Feito".
  - "Avaliação de impacto do Analista" / "Em revisão até segunda" (→ painel do Analista).
  - "Comunidade consultada" / "Reunião de pais em 08/10" (abre "Materiais para famílias").
- "No dossiê": "Relatório de uso" / "Setembro · 412 gerados · 389 aprovados" (→ aba IA); "Avaliações de impacto" / "Assistente v3 · Tutor v3 · Analista v1"; e 4 linhas que abrem embaixo:
  - "LGPD e ECA Digital" / "N de 8 feitos": "A escola é controladora; a Turmma é operadora", "Aluno sem e-mail, CPF, foto ou nascimento no sistema", "Adaptação sem diagnóstico, laudo ou CID", "Conversa do Tutor guardada 90 dias", "Dado não treina IA", "Canal de aviso com prazo e resposta por escrito (ECA Digital, art. 28)", "Sem recompensa por tempo de uso (Decreto 12.880)", "Encarregado de dados indicado e publicado" — cada uma com selo "Feito" ou "Falta".
  - "Checklist do MEC" / "7 de 9 feitos": "Finalidade pedagógica declarada", "Sem IA generativa na infantil e nos anos iniciais", "Toda saída de IA marcada, com a fonte", "Aprovação humana registrada em nota", "IA não corrige redação nem discursiva", "Avaliação de impacto de cada função de alto risco" (Falta), "Professor não é penalizado por não usar", "Comunidade escolar consultada" (Falta), "Dado exportável em formato aberto".
  - "Declaração de propósito" / "6º ano do Fundamental ao 3º do Médio": "A escola usa a Turmma para apoiar o planejamento do professor, o estudo do aluno com um tutor acompanhado e o acompanhamento da coordenação. A IA prepara e avisa; quem decide é a escola."
  - "Materiais para famílias" / "3 arquivos": "Carta às famílias sobre IA na escola", "Roteiro da reunião de pais", "Guia do professor", cada um com "Baixar".
- Rodapé: "Um arquivo com tudo abaixo, para a reunião." + botão laranja "Baixar o dossiê" (gera `dossie-colegio-aurora.html` e registra `exportacao`).

### 5.7 Material e adaptações em Registros
- **Não existem como aba de Registros.** `/coordenacao/material` redireciona para `Escola › Material` (seção 3.7) e `/coordenacao/adaptacoes` para `Escola › Turmas` com `?filtro=adaptacao`; a adaptação se registra no painel do aluno (seção 4). O arquivo `Adaptacoes.tsx` só exporta esse painel.

- **Onça em Registros:** só as cabeças dos agentes em "Como cada IA trabalha".
- **Precisa:** registro de geração com "o que foi mostrado / aberto / quem aprovou" (D56); pausa por IA e por função com motivo; AIA versionada por função; canal de aviso (aluno, sem conta, filtro, professor) com prazo e resposta; encaminhamento de risco com atribuição; notificação ao Conselho Tutelar; retirada de conteúdo; pedidos do titular com arquivo; auditoria consultável e filtrável; exportação com finalidade e link de 24 h; dossiê gerado; indicação do encarregado.
- **Atrito:** ver seção 14 (trecho de conversa aberto pela coordenação; "Aprovado por" nominal; busca de auditoria por pessoa; exportação "Notas aprovadas" com coluna `media`; "90 dias" fixo no dossiê × retenção configurável).
- **Produto hoje:** P:`Governanca.tsx` (4 `NumeroPainel`: "Gerado por IA", "Aprovado por gente", "Esperando o professor", "Rejeitado"; tabela "O que a IA gerou e quem aprovou" paginada; "Consumo do mês por função") e P:`Agentes.tsx` (página com os três agentes, suspender/retomar por função com motivo **opcional**, cartão "O que a IA nunca faz") são **páginas da lateral**; P:`privacidade/` tem Pedidos do titular (registrar, detalhe, ações, arquivo), "Por quanto tempo guardamos", "Empresas que recebem dados" e "Incidentes". O mockup junta governança e agentes numa aba com painéis, e acrescenta avisos/denúncias, encaminhamento de risco, Conselho Tutelar, retirada de conteúdo, tela de Auditoria, Exportar e Dossiê, **que não achei no produto**. O produto tem consumo por função, incidentes de segurança e suboperadores, que o mockup não tem.

---

## 6. Coordenação › Configurações da escola

- **Rota:** `/coordenacao/configuracoes`. Âncoras `#equipe|#encarregado|#canal|#tutor|#avisos|#dados|#seguranca|#conta` (rolam até a seção; `#encarregado` põe o foco no nome). `?de=dossie` troca o voltar para "‹ Dossiê" (`/coordenacao/registros?dossie=1`); sem ele, "‹ Painel". Arquivo M:`areas/coordenacao/Configuracoes.tsx`. Dentro da casca, aberta pelo menu da pessoa (não é lugar da lateral).
- **Composição:** cabeçalho "Configurações da escola" (+ selo verde "Salvo" depois de salvar); índice de 200 px à esquerda com as 8 seções (a 375 vira chips roláveis no topo); conteúdo de até 640 px rolando por dentro; barra de salvar presa embaixo **só quando algo mudou**: "Há mudanças sem salvar." + "Descartar" + "Salvar" (laranja). Cada seção tem título e, em algumas, um "ⓘ" com a explicação e a lei.
  - **"Equipe e atribuições":** aviso (sem ninguém com risco à vida) "Sem ninguém aqui, o Tutor fica desligado."; por pessoa: avatar, nome, **e-mail**, selo azul "Coordenação"/"Gestão" ou amarelo "Convite enviado", e dois interruptores "Recebe risco à vida" e "Atende o titular" (valem na hora, sem Salvar). Botão "Convidar alguém da gestão" → diálogo com "Nome" e "E-mail", "Gerar convite" → "O link aparece uma vez. Vale até 28/09." + link + "Copiar"/"Copiado" + "Pronto".
  - **"Encarregado de dados"** (ⓘ "Aparece na página da escola e no dossiê. É lei: LGPD, art. 41."): "Nome" (placeholder "Quem cuida dos dados"), "Contato" (placeholder "E-mail"); carimbo "Publicado: <nome> · <contato>".
  - **"Canal da escola"** (ⓘ "Qualquer pessoa avisa a escola, sem conta. É lei: ECA Digital, art. 28."): "turmma.com/e/colegio-aurora" + "Copiar" + "Abrir"; "Texto de acolhimento" (padrão: "Aqui você avisa a escola sobre algo que aconteceu. Uma pessoa lê e responde em até 5 dias úteis. Não precisa dizer seu nome.").
  - **"Tutor":** "Freio por dia" / "Por aluno. O aviso só aparece quando faltam 10." (30 · 45 · 60); "Pacote" / "Está no contrato. Não existe crédito para comprar." / "300 trocas por aluno / mês"; "Modo casa" / "Nenhuma turma" ou "N turmas" + "Escolher turmas" (diálogo "Modo casa": "Ligado, o Tutor funciona em casa e deixa um resumo para o professor.", busca "Buscar turma", um interruptor por turma, "Pronto"; vazio "Nenhuma turma com esse nome."); "Busca em fontes aprovadas" / "Libera para o professor ligar por turma. Na prova, nunca." (interruptor).
  - **"Avisos":** "Horário útil" / "Exceção: risco à vida chega a qualquer hora." (dois campos de hora, 07:00 "às" 18:00).
  - **"Dados":** "Conversa do Tutor" / "Depois, fica só o resumo." (30 dias · 60 · 90); "Documentos e notas" / "Siga o prazo de guarda da sua rede." (2 anos · 5 · 10); "Registro de acesso" / "Marco Civil da Internet, art. 15. Não muda." (selo "6 meses").
  - **"Segurança":** "Duas etapas" / "Obrigatório para a coordenação." (selo "Ativo").
  - **"Conta da escola"** (ⓘ "Professor e aluno entram com a conta que já têm. Guardamos só o identificador."): "Conectar Google" / "Conectar Microsoft"; conectado: "Google Workspace conectado" / "Microsoft 365 conectado" / "684 contas de aluno reconhecidas" + "Desconectar".
- **Estados:** sem mudança, não há barra de salvar; não há carregando/erro.
- **Onça:** não.
- **Precisa:** equipe de gestão com convite e atribuições; encarregado publicado; canal público com texto configurável; política do Tutor por escola e por turma (freio, modo casa, busca); horário útil; retenção configurável; login pela conta da escola (D48).
- **Atrito:** a tela mostra **e-mail da equipe** (dado pessoal de adulto, entra no mapa da LGPD); "risco à vida" como atribuição nominal precisa de regra de acesso por objeto; "Conversa do Tutor 30/60/90" contradiz o "guardada 90 dias" do Dossiê; "300 trocas" e "60 por dia" batem com a D38; freio configurável para baixo (30/45) não está na D38.
- **Produto hoje:** não existe a página. Parte do conteúdo está em P:`privacidade/Retencao.tsx` (prazos) e na política do Tutor do MVP (não achei tela de coordenação para ela). Equipe/atribuições, encarregado, canal, horário útil e conta Google/Microsoft não têm tela.

---

## 7. Coordenação › Bem-vindo (introdução)

- **Rota:** `/coordenacao/bem-vindo`. `?rever=1` ou `?como=` forçam mostrar de novo; já vista e sem isso → redireciona para `/coordenacao`. Disparada depois do convite e do segundo fator da primeira vez (`/entrar/verificacao?primeira=1&para=/coordenacao`). Arquivo M:`areas/coordenacao/BemVindo.tsx` + peça `Introducao`. **Fora da casca** (tela de foco).
- **Forma da peça** (vale para as três introduções): topo de 64 px com X (sai) e barra de progresso verde; miolo de 484 px centrado com a **onça** (120 px; 88 no celular), o nome do agente + selo IA embaixo dela quando há agente, e o balão com a fala (é o `h1`); o conteúdo embaixo; rodapé com "Continuar" (cinza até o passo ficar pronto; às vezes "Entendi"); Enter continua, Esc sai; no fim a onça comemora e o botão é "Começar". Nunca pontos, sequência, meta nem pedido de notificação.
- Os 5 passos estão na seção 16(d).
- **Precisa:** marca "introdução vista" por pessoa; gravar a preferência do resumo de segunda; os mesmos dados da fila e da montagem.
- **Produto hoje:** não existe introdução de papel.

---

## 8. Rede/secretaria › Painel

- **Rota:** `/rede`. Parâmetros: `?rede=prefeitura|estado` (escolhe e guarda a rede), `?serie=<série>` (prefeitura: "6º ano"… "9º ano"; estado: + "1ª série EM", "2ª série EM", "3ª série EM"), `?protecao=1` (abre "Como protegemos os dados"). Arquivo M:`areas/outras/Rede.tsx`. Dentro da casca da rede. **A página rola** (`rolagem="corpo"`); a primeira dobra (cabeçalho, ladrilhos, três gráficos) cabe em 1440 × 780.
- **Composição:**
  1. Cabeçalho: "Painel"; selo com cadeado "Só números agregados" (title "Só contagens de grupos de 5 ou mais alunos; nunca nome de aluno, nunca número de professor"); complemento "Rede municipal · 6 escolas · 3.412 alunos" (estado: "Regional Joinville · 6 escolas · 4.262 alunos"); à direita o select "Série: Todas" e o botão "Baixar relatório" (a 375: a linha de baixo traz o select e o botão "Relatório").
  2. 5 ladrilhos, na ordem: ação 1, ação 2, "Presença < 75%", "Matemática < 6,0", ação 3. Todos são **links para Escolas** com a coluna acesa.
     - Prefeitura: "APOIA vencido" **5** ("esta semana") → `/rede/escolas?coluna=apoiaVencidos`; "Chamada atrasada" **3** escolas ("diário fecha 30/09") → `?coluna=semChamada`; "Presença < 75%" **96**; "Matemática < 6,0" **391**; "IA para revisar" **58** ("há 2+ dias") → `?coluna=revisao`.
     - Estado: "Pé-de-Meia < 80%" **63** ("mês fecha 30/09", com minigráfico) → `?coluna=peDeMeia`; "APOIA vencido" **10**; "Presença < 75%" **157**; "Matemática < 6,0" **551**; "1ª série: 2+ < 6,0" **106** ("antes do conselho") → `?coluna=primeiraSerieDois`.
     - Ajuda de cada ação: "<N> <unidade> <frase>." · "<limiar>." · "<detalhe>" · "<prazo>." (+ "Rede toda, todas as séries." quando há filtro) + fonte. Frases: "com o prazo de 14 dias vencido" / "Cada etapa do APOIA tem 14 dias: escola, Conselho Tutelar, Ministério Público" / "Vencidos: falar com as escolas esta semana"; "com chamada atrasada há 3 dias letivos ou mais"; "da IA esperando a revisão do professor" / "Nada da IA chega ao aluno sem um professor revisar"; "do Pé-de-Meia abaixo de 80% de frequência em setembro" / "Abaixo de 80% no mês, o aluno perde a parcela (Decreto 11.901/2024)" / "Setembro fecha em 30/09: ainda dá para recuperar"; "da 1ª série do EM abaixo de 6,0 em 2 ou mais componentes" / "É a série com 15,7% de reprovação e 24,8% de distorção em Joinville (INEP 2025)" / "Antes do conselho de classe do trimestre".
  3. Três gráficos (5 + 4 + 3): "Frequência por faixa" (no Estado, com a marca "80%" do Pé-de-Meia); "Fev → set"; "Notas < 6,0". Mesmas peças do Painel da coordenação, com "menos de 5".
  4. "Escolas" (largura toda): tabela escola × limiar, **de A a Z**, legenda "passou do limiar". Colunas da prefeitura: "Escola" · "Alunos" · "< 75%" · "75–90%" · "APOIA" · "APOIA vencido" · "LP < 6,0" · "MAT < 6,0" · "Sem chamada"; do Estado: "Pé-de-Meia < 80%" · "< 75%" · "75–90%" · "APOIA" · "APOIA vencido" · "LP < 6,0" · "MAT < 6,0" · "1ª série: 2+ < 6,0". Célula de 1 a 4 = "< 5". Escola sem dados: selo "Montando" / "Convite" / "Sem lista" + "ainda sem dados". Linha → `/rede/escolas?escola=<id>`. A 375: uma linha por escola, com as contagens das colunas essenciais e o rótulo de cada uma. Ajuda: "Escolas de A a Z: alunos acima de cada limiar…" + ""menos de 5": grupo pequeno demais para mostrar."
  5. Três blocos iguais: "Falta por escola" (barras empilhadas, vazio "—", clique abre a escola); "Onde trava" (habilidades; clique → Analista com "Em que habilidade o 8º ano mais trava?"; vazio "Nenhuma do <série>."; ajuda termina em "Não substitui Saeb nem Ideb."); 8 números pequenos ("Materiais IA", "Revisados", "Pacote IA", "Por aluno", e 4 anuais — prefeitura: "Ideb AF" 6,0, "Ideb AI" 7,1, "Abandono AF" 0,0%, "Distorção AF" 9,0%; estado: "Ideb EM" 4,3, "Ideb AF" 5,0, "Reprov. 1ª EM" 15,7%, "Abandono 1ª EM" 4,4%).
  6. Pé: cadeado ""< 5" = grupo com menos de 5 alunos"; "Como contamos" (popover com 5 frases: "Cada número é quantos alunos passaram de um limiar, com o limiar escrito. O painel não faz média." · "Oficial: chamada e notas lidas do diário (EVN) todo dia às 7h, o APOIA, o INEP." · "Turmma: o que só existe porque o Turmma está na escola (provas aprovadas pelos professores, materiais da IA)." · "Grupo com menos de 5 alunos aparece como "menos de 5"." · "Escolas sempre de A a Z: o painel não ordena escolas."); "Como protegemos os dados".
- **Painel "Como protegemos os dados":** 7 linhas com ladrilho — "Controlador: Município de Joinville" (ou "Estado de Santa Catarina") / "Operador: Turmma · LGPD, arts. 5º e 23"; "A secretaria não vê aluno" (ou "A regional…") / "Só contagens de grupos de 5 ou mais. O sistema não tem botão de ver nomes."; "Professor aprova antes" / "Nada da IA chega ao aluno sem um professor aprovar."; "Dado de criança e adolescente" / "Tratado no melhor interesse do aluno (LGPD, art. 14)."; "O dado do aluno fica no Brasil" / "Planejado, ainda não contratado. Vai além do que a LGPD exige."; "Não treina IA" / "Nenhum dado da rede treina modelo."; "Encarregado dos dados" / "Indicado pela Secretaria Municipal de Educação. Nome e contato publicados no site da Prefeitura (LGPD, art. 41)."
- **Diálogo "Relatório de setembro"** (480): nome da rede; 5 itens com visto ("O que pede ação esta semana", "Frequência por faixa e notas abaixo de 6,0", "As 6 escolas, de A a Z, em contagens", "Onde a aprendizagem trava", "IA sob controle e indicadores anuais (INEP)"); segmentado "PDF para ler" · "Planilha CSV"; com série filtrada, aviso "O relatório é sempre o da rede inteira. O filtro da tela (<série>) não entra nele."; aviso "Só contagens de alunos. Nenhum nome, nenhum número de professor, nenhuma média."; "Também chega por e-mail no dia 1º." (se ligado); botão "Baixar" → aviso flutuante "**<arquivo>** baixado." por 4 s.
- **Onça:** não.
- **Estados:** escola sem dados; "Nenhuma do <série>."; sem carregando/erro.
- **Precisa:** papel de rede com várias redes por pessoa; agregação por escola e por série com supressão de grupo < 5 **no servidor** (inclusive a supressão complementar do total); os mesmos dados oficiais do Painel da coordenação, de todas as escolas; lista do Pé-de-Meia; relatório PDF/CSV em fila; registro de exportação.
- **Atrito:** ver seção 14 (por escola + série pode cair num professor só; beneficiário do Pé-de-Meia é dado socioeconômico; "IA para revisar" por escola).
- **Produto hoje:** não existe área de rede.

---

## 9. Rede/secretaria › Analista

- **Rota:** `/rede/analista`. `?pergunta=<texto>` (enviada ao abrir), `?rede=`. Arquivo M:`areas/outras/RedeAnalista.tsx` + `ChatDados layout="tela"` + M:`dados/analista-rede.ts`. Dentro da casca.
- **Composição:** igual ao Analista da coordenação, com: selo "Só números agregados" (a 375, "Só agregados"); vazio com a saudação ("Bom dia") e a fala "Pergunte sobre a rede municipal." / "Pergunte sobre a rede estadual."; **dentro da caixa**, à direita, o seletor "Perguntar sobre" com as duas redes (o mesmo da lateral; trocar de rede recomeça a conversa); placeholder "Pergunte sobre as escolas, a frequência e as notas"; botão "Relatório do mês" na barra (some no celular).
- Perguntas prontas (4 primeiras de 6) — prefeitura: "O que pede ação esta semana?", "Quantos alunos estão abaixo de 75%?", "Quais escolas têm APOIA vencido?", "Como está o Ideb dos anos finais?", "Em que habilidade o 8º ano mais trava?", "Gere o relatório do mês" (fixa); estado: "O que pede ação esta semana?", "Quantos alunos do Pé-de-Meia estão abaixo de 80%?", "Como está a 1ª série do EM?", "Como está o Ideb do Ensino Médio?", "Quais escolas têm APOIA vencido?", "Gere o relatório do mês".
- **Onça:** sim (Analista). Respostas e recusas na seção 16(c).
- **Produto hoje:** não existe.

---

## 10. Rede/secretaria › Escolas

- **Rota:** `/rede/escolas`. Parâmetros: `?coluna=<id>` (`apoiaVencidos|apoia|peDeMeia|semChamada|primeiraSerieDois|reprova|cronica|lp|mat|revisao`: acende a coluna e mostra só as escolas com alguém nela); `?serie=`; `?escola=<id>` (painel da escola); `?rede=`. Arquivo M:`areas/outras/RedeEscolas.tsx`. Dentro da casca.
- **Composição:** cabeçalho "Escolas", complemento "6 · de A a Z", selo "Só números agregados", selects "Série: Todas" e "Mostrar: Todas" ("Todas as escolas" + o título longo de cada coluna + "Materiais da IA esperando a revisão do professor"); linha de apoio "<rede> · 4 com dados" + linha de fonte. Com filtro, faixa azul "Mostrando N de 4 escolas: as <frase>." + "Ver todas" (frases: "com APOIA de prazo vencido", "com alunos no critério do APOIA, sem aviso aberto", "com alunos do Pé-de-Meia abaixo de 80% em setembro", "com turma sem chamada há 3 dias letivos ou mais", "com alunos da 1ª série do EM abaixo de 6,0 em 2 ou mais componentes", "com alunos abaixo de 75% de frequência", "com alunos em falta crônica", "com alunos abaixo de 6,0 em Língua Portuguesa", "… em Matemática", "com material da IA esperando a revisão do professor"). Tabela igual à do Painel, com a coluna extra "IA esperando" (na prefeitura sempre; no Estado só quando é o filtro). Vazio: "Nenhuma escola <frase> no <série>." Faixa cinza "**A caminho:** Bem-te-vi montando as turmas · Figueira com convite enviado". Pé: cadeado "Contagens de alunos; grupo com menos de 5 aparece como "menos de 5". A cor marca quem passou do limiar da coluna." + "Perguntar ao Analista" (pergunta "Como está cada escola?").
- **Painel da escola** (600): título = nome; selo da situação ("Com dados", "Lista ainda não subiu", "Montando: ainda sem dados", "Convite enviado: ainda sem dados") + "980 alunos · escola municipal"; "Frequência por faixa" (barra, no Estado com a marca "Pé-de-Meia · 80%"); "Notas abaixo de 6,0" (3 componentes, só a contagem); 4 números: "APOIA, sem aviso" / "no critério", "APOIA vencido" / "prazo de 14 dias", "Sem chamada" / "turmas há 3 dias ou mais", e "Pé-de-Meia < 80%" / "de N beneficiários" (Estado) ou "IA esperando" / "de N materiais"; "Só contagens, de grupos de 5 ou mais alunos. Nomes, só na escola."; botão "Perguntar ao Analista sobre a Araucária" (no celular "Perguntar ao Analista"). Sem dados: "Ainda sem dados." + "A escola está montando as turmas. Os números aparecem quando o diário dela chegar ao Turmma." / "A escola recebeu o convite e ainda não montou as turmas."
- **Onça:** não.
- **Produto hoje:** não existe.

---

## 11. Rede/secretaria › Bem-vindo

- **Rota:** `/rede/bem-vindo` (`?rever=1`, `?como=`). Fora da casca. Arquivo M:`areas/outras/RedeBemVindo.tsx`. Disparada depois do segundo fator enquanto a introdução não foi vista (`secretaria@educacao.joinville.example`). Passos na seção 16(d). Produto: não existe.

---

## 12. Operação Turmma

- **Rota:** `/operacao`. Parâmetros: `?aba=uso` (sem aba = Escolas); `?nova=1` (abre "Nova escola" e sai do endereço). Arquivos M:`areas/operacao/Operacao.tsx`, `_escolas.tsx`, `_uso.tsx`, `_dialogos.tsx`, `_dados.ts`. **Fora da casca da escola**: `BarraApp` com "Equipe Turmma" e o avatar "OT" (menu "Rever a introdução", "Sair").
- **Cabeçalho da página** (até 1200 px): título "Operação"; linha de apoio com cadeado "A operação não vê dado de aluno nem de professor: nem nome, nem nota, nem conversa."; botão laranja "Nova escola" (no celular ele desce para a aba); abas "Escolas" · "Uso".
- **Aviso de retorno** (verde, no alto): "<escola> criada." (com o botão "Convidar coordenação"), "Convite da <escola> revogado.", "Segundo fator da <escola> redefinido.", "Teto de <nome> salvo."; "×" fecha.

### 12.1 Aba Escolas
- Controles: busca "Buscar escola ou cidade"; "7 escolas em 2 redes".
- Computador: uma tabela com a **rede como linha de grupo** (nome da rede, selo "Estadual"/"Municipal"/"Particular", "N escolas", "⋯" da rede com "Convidar a secretaria" [só rede pública] e "Teto da rede"). Colunas: "Escola" (nome + cidade) · "Link" ("turmma.com/e/<slug>") · "Coordenação" (selo verde "Ativa", amarelo "Convite em aberto" + "vale até 25/09", vermelho "Vencido", neutro "Sem convite"; e o botão "Convidar" ou "Refazer") · "Uso" ("612 alunos · 22 turmas · 31 prof." ou "Sem turma ainda") · "⋯" da escola ("Revogar o convite" [só com convite em aberto], "Redefinir o segundo fator" [só coordenação ativa], "Teto de IA", "Criada em <data>" [só informa]). Rede sem escola: "Criar a primeira escola". A escola recém-criada entra na vista e acende em laranja-claro por 1,6 s.
- Celular: um bloco por rede, com as escolas em cartões e o "⋯" no canto de cima.
- Vazio da busca: "Nenhuma escola com "<termo>"."
- **Nenhuma coluna com pessoa:** a coordenação aparece pelo estado do convite, nunca pelo nome.

### 12.2 Aba Uso
- Controles: segmentado "Mês" ("Setembro" · "Agosto"); "Até 21/09" / "Fechado em 31/08"; à direita "Aviso em 80%. Corte suave em 100%, nunca no meio de uma aula."
- Tabela: "Escola" (nome + rede; "Sem uso no mês") · "Alunos ativos" · "Uso de IA" (trocas com o Tutor + gerações do Assistente, com o detalhe no title) · "Custo (R$)" · "Por aluno (R$)" · "Teto" (barra turquesa com a marca dos 80% e a %). Linha "Total" presa no pé ("5 escolas com uso"). Sem uso: "—". No celular, cartões empilhados com o Total por último.

### 12.3 Diálogos
- **"Nova escola"** (540): "Nome da escola" (placeholder "E. M. Vila Nova"); "Link da escola" (prefixo "turmma.com/e/", sugerido a partir do nome; erro "Este link já é de outra escola."); "Cidade" (padrão "Joinville · SC"); "Faz parte de uma rede?" — "Não" · "Escolher" (lista de redes com o tipo) · "Nova rede" ("Nome da rede", placeholder "Secretaria Municipal de Educação de Araquari", erro "Já existe. Use Escolher."; tipo "Particular" · "Municipal" · "Estadual"); botão "Criar escola".
- **"Convidar coordenação"** / **"Convidar a secretaria"** / **"Refazer convite"** (520), com a escola ou a rede embaixo do título: "E-mail" (placeholder "coordenacao@escola.example", erro "Confira o e-mail.", dica "Só o e-mail. Você envia o link."); "Gerar convite". Depois: "Convite gerado"; aviso "O link aparece uma vez." / "Vale até <data>."; o link ("turmma.com/convite…") + "Copiar link"/"Copiado"; chave "A Turmma não vê a senha nem o segundo fator."; "Fechar". Fechar sem copiar: "Fechar sem copiar?" / "O link não aparece de novo. Será preciso refazer o convite." / "Voltar ao link" / "Fechar".
- **"Revogar o convite?"** / "O link da <escola> deixa de valer na hora." / "Revogar".
- **"Redefinir o segundo fator?"** / "A coordenação da <escola> configura de novo no próximo acesso. A senha não muda." / "Redefinir".
- **"Teto de IA"** (da escola ou da rede): "Por mês, em reais"; dica "R$ 3.060,00. Aviso em 80%. Corte suave em 100%."; "Salvar".

### 12.4 Bem-vindo
- **Rota:** `/operacao/bem-vindo` (`?rever=1`, `?como=`). Fora de tudo. Arquivo M:`areas/operacao/BemVindo.tsx`. **Sem agente**: a onça é a marca. Passos na seção 16(d).

- **Onça na operação:** só na introdução.
- **Estados:** busca vazia; rede sem escola; escola sem uso; sem carregando/erro; não há tela de entrada nem de segundo fator da operação no recorte (estão em `areas/entrada`).
- **Precisa:** o que a A0/A0b do produto já tem (rede, escola, convite, sessão própria) **mais**: uso de IA e **custo em reais por escola**, alunos ativos, teto de IA por escola e por rede com aviso em 80%, redefinir o segundo fator da coordenação, convidar a secretaria (papel de rede), revogar convite pelo "⋯", agrupamento por rede, busca.
- **Atrito:** o convite pede o e-mail da coordenação (dado de pessoa, mínimo; D76 prevê). "Redefinir o segundo fator" age sobre a conta de uma pessoa sem identificá-la na tela: precisa de auditoria e de regra própria. "Alunos ativos" e "Por aluno" são agregados por escola (ok). Escola "sem rede" é possível no mockup; no produto a escola nasce dentro de uma rede. "Corte suave em 100%" precisa bater com a D14/D38/D41.
- **Produto hoje:** P:`operacao/paginas/Escolas.tsx` e `Uso.tsx` são **duas rotas** (`/operacao` e `/operacao/uso`) dentro de P:`operacao/componentes/CascaDaOperacao.tsx`, com sessão, MFA, convite e aviso de inatividade próprios, **paginação e ordem na query string** e os quatro estados; "Nova rede" e "Nova escola" são diálogos separados (a escola tem passo "Revisar" antes de criar; lista vazia: "Nenhuma escola ainda." / "Comece criando a rede."). O Uso do produto mede **infra** (requisições, tarefas em segundo plano, armazenamento, por dia e por mês), não IA nem custo. O mockup tem abas numa página só, grupo por rede, custo/teto de IA, convite da secretaria, redefinir segundo fator e introdução; o produto tem paginação, ordenação, tipos de rede ("Prefeitura ou estado", "Grupo educacional", "Escola independente") e telas de entrada que o mockup não desenha.

---

## 13. Família

- **Rota:** `/familia`. Sem parâmetros. Arquivo M:`areas/outras/Familia.tsx`. **Fora da casca**; fora da demonstração (só no Mapa, em "Depois").
- **Composição** (coluna de leitura de 880 px): `BarraApp` com o nome da escola e o menu "Sua conta" → "Sair"; título "Lucas · 2ºB" com complemento "Colégio Aurora"; seção "Entregas" (lista: ladrilho da matéria, título da tarefa, matéria e o **mesmo selo de estado que o aluno vê**; o atraso vem primeiro); seção "Notas" com "Aprovadas por <professor>" à direita quando é a mesma pessoa em todas (lista: título, "<matéria> · <quando>" ou "Aprovada por <nome> · <quando>", e à direita "7 de 10"); pé: "Tudo aqui passou por um professor. A IA não lança nota e não fala com a família." + link "Privacidade" (→ `/e/colegio-aurora/dados`).
- **Onça:** não. **Estados:** nenhum desenhado (nem lista vazia).
- **Precisa:** conta de responsável vinculada ao aluno, autorização por objeto (só o filho), leitura de entregas e de notas aprovadas.
- **Atrito:** o portal da família é fase posterior (D11) e depende do parecer do art. 24 do ECA Digital; a tela mostra o nome do professor que aprovou e "acertos de total" (não nota oficial).
- **Produto hoje:** não existe.

---

## 14. Pontos que esbarram em regra do produto (resumo para o PRD)

1. **Dados que o produto não tem.** Frequência e faltas por aluno, notas do diário oficial (Professor Online/EVN), APOIA (MPSC), lista de beneficiários do Pé-de-Meia, dias sem chamada, Ideb e Censo. Nenhum está no modelo de dados nem na tabela de `docs/lgpd.md`; "faltas" é decisão em aberto. O Painel da coordenação, o da rede, as Escolas da rede e metade do Analista dependem deles. Pé-de-Meia é dado socioeconômico do aluno.
2. **Indicador de professor (D45, D64).** (a) Grade "Por turma" e faixa "No Painel" mostram "LP < 6,0" e "MAT < 6,0" por turma **sem motivo**: é o recorte de um professor só. (b) "Sem chamada" por turma e "Provas a aprovar · 2ºB · 8ºC · 1ºA · há 2+ dias" identificam a pendência de um professor. (c) Registros › IA tem a coluna "Aprovado por" com o nome; a busca da Auditoria aceita "pessoa" e casa com o autor, o que na prática **filtra por professor**, contra a própria frase do rodapé. (d) Exportar "Documentos dos professores" e "Notas aprovadas" saem com o nome do professor; o segundo tem a coluna `media`, contra a regra "nenhuma média". (e) Rede › Escolas com série filtrada mostra MAT/LP de uma série numa escola, que pode ser um professor só.
3. **Grupo com menos de 5.** A rede aplica em tudo ("< 5", "menos de 5", total retirado). **A coordenação não aplica** na grade nem nos ladrilhos (APOIA 2, `< 75%` 1); só as entregas atrasadas do Analista usam "menos de 5".
4. **Aluno em risco nominal (D34).** A coordenação abre lista nominal (APOIA, `< 75%`, falta crônica, LP, MAT) com motivo de lista fechada e registro; alinha com "nominal com auditoria". Falhas: reabrir a mesma lista não pede motivo nem registra de novo; a lista do motivo muda de tela para tela (4 listas diferentes: painel, alerta, Analista, motor).
5. **Recomendação sobre aluno (regra 70, item 2).** A resposta "O que fazer com o 2ºB?" ordena ações ("levar os 6 abaixo de 6,0 em Matemática para a recuperação", "conversar com as famílias") e a hipótese "vale começar por ele". O próprio painel do Analista diz que ele nunca faz "Recomendar decisão sobre pessoa".
6. **Conversa do Tutor (regra 20, item 14; D36).** A coordenação abre "o trecho da conversa" de aviso e de encaminhamento com motivo. A regra do produto restringe a conversa ao professor da turma, e na D36 o professor recebe o sinal sem o conteúdo. Quem lê o trecho (a pessoa com "Recebe risco à vida") precisa de decisão.
7. **Adaptação (D35).** Só tipo de lista fechada, com validade e autor; nenhum campo de texto livre; "Só o tipo. Sem laudo nem diagnóstico." Alinha.
8. **Texto livre perto de aluno.** "Registrar ação" (com a dica "Não escreva o nome do aluno."), a resposta ao aviso ("Sem nome de colega."), o motivo de retirada de material. São campos onde um texto sobre a pessoa pode entrar (D66).
9. **Operação (D76).** Não mostra nome, nota nem conversa; pede só e-mail no convite; uso e custo por escola. Atenção a "Redefinir o segundo fator" e ao convite da secretaria (papel novo).
10. **Rede só agregado (regra 10, item 8).** Não há botão de ver nomes; recusas nominal, de professor, de turma, de conversa e de ranking; escolas de A a Z. Alinha, com a ressalva do item 2(e) e do item 1.
11. **Sem inferência de emoção/perfil (D57).** Não achei nada no recorte. O aviso "Algo no sistema me deixou desconfortável" é escolha do aluno, não inferência.
12. **Outros.** Anexar planilha na caixa do Analista (D5, D75); "Dossiê" afirma "Conversa do Tutor guardada 90 dias" e as Configurações deixam 30/60/90; decisões citadas no mockup com número diferente do produto; a Família mostra o professor que aprovou.

---

## 15. Mapa mockup × produto (resumo)

| Tela do mockup | Arquivo do produto mais próximo | Situação |
|---|---|---|
| Painel da coordenação | — (abre em P:`areas/coordenacao/Governanca.tsx`) | não existe |
| Analista em conversa | P:`areas/coordenacao/Analista.tsx`, `DadoNominal.tsx` | existe como resumo, não como conversa |
| Escola › Turmas, ano, séries, disciplinas | P:`areas/coordenacao/Estrutura.tsx` | existe em seções de uma página |
| Escola › alocação | P:`areas/coordenacao/Alocacao.tsx` | existe como seção; no mockup mora no painel do professor |
| Escola › grade e calendário, importar listas | — | não existe |
| Escola › Professores | P:`areas/coordenacao/Professores.tsx` | existe como página própria |
| Escola › Material | P:`areas/coordenacao/Material.tsx` | existe como página própria |
| Lista da turma | P:`areas/coordenacao/ListaDaTurma.tsx` | existe; falta painel do aluno, adaptação, professores da turma |
| Registros › IA | P:`areas/coordenacao/Governanca.tsx` | existe como página própria |
| Como cada IA trabalha | P:`areas/coordenacao/Agentes.tsx` | existe como página própria |
| Registros › Avisos e pedidos | P:`areas/coordenacao/privacidade/Pedidos.tsx` e afins | só os pedidos do titular |
| Registros › Auditoria, Exportar, Dossiê | — | não existem |
| Configurações da escola | P:`areas/coordenacao/privacidade/Retencao.tsx` (só retenção) | quase tudo falta |
| Introduções | — | não existem |
| Sino e painel do item | — | não existem |
| Rede (Painel, Analista, Escolas) | — | área inexistente |
| Operação › Escolas, Uso, diálogos | P:`operacao/paginas/*`, `operacao/componentes/*` | existe, com outra estrutura e outra medida de uso |
| Família | — | não existe |

---

## 16. Fechamento

### (a) Tabela de rotas do recorte e redirecionamentos

| Rota | Tela | Casca | Parâmetros |
|---|---|---|---|
| `/coordenacao` | Painel | coordenação | `serie`, `periodo=anterior` |
| `/coordenacao/analista` | Analista | coordenação | `pergunta` |
| `/coordenacao/escola` | Escola | coordenação | `aba=professores\|material`, `painel=ano\|grade\|importar\|roteiro`, `filtro`, `prof`, `fonte` |
| `/coordenacao/escola/turmas/:turma` | Lista da turma | coordenação | `aluno` |
| `/coordenacao/registros` | Registros | coordenação | `aba=avisos\|auditoria`, `dossie=1`, `exportar=1`, `conjunto`, `item`, `ver=como`, `ia`, `serie`, `aviso` |
| `/coordenacao/configuracoes` | Configurações da escola | coordenação | `de=dossie`, âncora `#<seção>` |
| `/coordenacao/bem-vindo` | Introdução | fora | `rever=1`, `como` |
| `/rede` | Painel da rede | rede | `rede`, `serie`, `protecao=1` |
| `/rede/analista` | Analista da rede | rede | `rede`, `pergunta` |
| `/rede/escolas` | Escolas | rede | `rede`, `serie`, `coluna`, `escola` |
| `/rede/bem-vindo` | Introdução | fora | `rever=1`, `como` |
| `/operacao` | Operação | fora (barra própria) | `aba=uso`, `nova=1` |
| `/operacao/bem-vindo` | Introdução | fora | `rever=1`, `como` |
| `/familia` | Família | fora (barra própria) | — |

Em qualquer rota da coordenação: `sino=1|<turmaId>`, `item=<id>`, `config=<seção>`, `tema`.

Redirecionamentos (todos com `replace`; a consulta de quem chegou é somada à do destino):
- `/coordenacao/estrutura` → `/coordenacao/escola`
- `/coordenacao/estrutura/turmas/:turma` → `/coordenacao/escola/turmas/:turma`
- `/coordenacao/professores` → `/coordenacao/escola?aba=professores`
- `/coordenacao/material` → `/coordenacao/escola?aba=material`
- `/coordenacao/adaptacoes` → `/coordenacao/escola?aba=turmas&filtro=adaptacao`
- `/coordenacao/ia` → `/coordenacao/registros?aba=ia`
- `/coordenacao/agentes` → `/coordenacao/registros?aba=ia&ver=como`
- `/coordenacao/conformidade` → `/coordenacao/registros?dossie=1` (tira `aba`)
- `/coordenacao/denuncias` → `/coordenacao/registros?aba=avisos`
- `/coordenacao/auditoria` → `/coordenacao/registros?aba=auditoria`
- `/coordenacao/exportar` → `/coordenacao/registros?exportar=1`
- Dentro das telas: `escola?aba=ano|grade` → `?painel=`; `escola?aba=conta|contas` → `/coordenacao/configuracoes`; `escola?aba=alocacao` → `?aba=professores`; `registros?aba=dossie` → `?dossie=1`.
- Introdução já vista (sem `rever` nem `como`) → o Início do papel (`/coordenacao`, `/rede`, `/operacao`). Abrir `/coordenacao`, `/rede` ou `/operacao` direto **não** leva à introdução.

### (b) Itens da fila e do sino da coordenação

O sino (M:`components/turmma/sino.tsx`) mostra a fila calculada em M:`dados/fila.ts` (`daCoordenacao`). O número laranja é a quantidade de itens. Lista: popover de 400 px (até 720 de altura); no celular, folha de altura cheia com o título "Esperando você (N)". Cabeçalho "Esperando você" + contador + X. Com itens de 2 ou mais turmas, toques de filtro "Todas" + uma por turma. Grupos, nesta ordem: "Urgente" (urgente ou com prazo) → um por turma, na ordem da escola ("6ºB", "1ºC · Química") → "De várias turmas" → "Da escola". Linha de 56 px: ladrilho do tipo, título curto, (nos urgentes) "<turma> · <hora>", e à direita o contador, ou o selo vermelho do prazo, ou "Urgente". Vazio: **onça dormindo** + "Tudo em dia" (no mockup; a X2 usa ícone ilustrado, sem mascote: `techspec.md` seção 12). Rótulo do botão: "Esperando você, N" / "Esperando você, nada".

| Tipo | Id | Texto curto / título | Leva a |
|---|---|---|---|
| `risco` (urgente) | `risco-<n>` | "Encaminhamento 32" / "Encaminhamento de <aluno>: assunto delicado" | `/coordenacao/registros?aba=avisos&aviso=<id>` |
| `aviso` (urgente, prazo) | `aviso-0031`, `aviso-<n>` | "Aviso de aluno" ou "Aviso sem conta" (com dois iguais: "Aviso 31") / "Aviso 31 · responder até 23/09"; selo "até 23/09" | o mesmo, no aviso |
| `titular` (prazo) | `titular-<n>` | "Pedido sobre dados" (com dois: "Pedido 34") / "Pedido 33: ver os dados do filho"; selo "até 06/10" | o mesmo, no pedido |
| `revisao` | `revisao-<id>` | "<Nome> contestou a memória" / "<Aluno> contestou a memória do Tutor · <matéria>" (detalhe "<turma> não tem professor de <matéria> no Turmma") | **painel do item** (`?item=`), o `PainelRevisao`, assinado pela Helena |
| `pedidos-nome` | `pedidos-<turmaId>` | "Pedidos sem professor" / "N alunos pediram para entrar · turma sem professor"; contador N | `/coordenacao/escola/turmas/<turmaId>` |
| `contestacao` | `contestacao-paulo`, `contestacao-<id>` | "Paulo Ribeiro contestou" / "Paulo Ribeiro diz que 8ºB · Português não é a turma certa" | `/coordenacao/escola?aba=professores&prof=<id>` |
| `alerta` | `alerta-a1` | "Química · 2º ano" / "Química do 2º ano: 19 alunos entraram abaixo de 6,0" (hipótese · 4 turmas) | **painel do item** (`PainelAlerta`) |
| `alerta` | `alerta-a2` | "Entregas faltando" / "1ºC: 5 alunos com três entregas faltando"; contador 5 | **painel do item** |
| `material-falhou` | `material-bio` | "Biologia 1 não carregou" (detalhe "páginas 40 a 72 sem texto") | `/coordenacao/escola?aba=material` |
| `convite` | `convite-jonas`, `convite-<id>` | "Convite do Jonas venceu" / "O convite de Jonas Barreto venceu" | `/coordenacao/escola?aba=professores&prof=<id>` |

Ordenação: urgente → risco → com prazo → por tipo (risco, aviso, titular, pedidos, contestação, alerta, material, convite). O item sai sozinho quando o estado muda (aviso concluído, alerta visto, convite refeito, contestação corrigida, material reenviado). O "Dossiê do MEC" **não** é mais item.

**Painel do alerta do Analista** (`?item=alerta-a1|alerta-a2`, M:`_alerta.tsx`): assinatura do Analista; selo anil "Hipótese" (title "O Analista só avisa você. Não fala com professor nem com família.") ou "Contagem" (title "Contagem das entregas registradas pelos professores."); "hoje, 9h20"; "**<título>.** <texto>" (a1: "Eram N no trimestre anterior; agora são N de N. Pode ser a troca de capítulo; vale olhar com os professores da série."; a2: "É sinal para um adulto olhar, não decisão sobre nenhum deles."); selos do recorte ("2º ano EM", "Química", "4 turmas", "abaixo de 6,0" / "1ºC", "34 alunos", "só a contagem") e selo com cadeado "Fechado" (title: "Por turma, cada recorte tem um professor só." / "Os nomes ficam com os professores da turma."). Rodapé: "⋯" → "Ver dados com nome" e o botão oficial "Marcar como visto" → faixa "Visto". "Ver dados com nome" abre "Ver dados com nome" / "Fica registrado com seu nome, a hora e a finalidade." / "Para quê": "Conversa com os professores da série", "Apoio aos alunos, com o professor da turma", "Pedido do titular do dado" / "Ver e registrar". Depois aparece a lista (a1: por turma, "2ºB · N alunos" / "N → N abaixo de 6,0"; a2: nome do aluno / "N faltando") e "Registrado · <quem> · <quando> · <finalidade>".

### (c) Como o Analista responde, e os números dos painéis

**Forma fixa da resposta** (tipo `RespostaDados` em M:`components/duo/chat-dados.tsx`), nesta ordem:
1. **A frase**, com o número em negrito.
2. **Um artefato** num cartão de borda 2: `numeros` (até 3), `barras`, `linha`, `tabela`, `pacote` (barra do pacote com a marca dos 80% e a projeção tracejada), `empilhada`, `calor` (duas dimensões, "menos de 5" hachurado) ou `nomes` (só depois do motivo).
3. **Hipótese** (opcional): selo anil "Hipótese" + uma frase.
4. **Arquivo** (no relatório): cartão com título, "PDF · 2 páginas", "Ver antes" e "Baixar" (vira "Baixado").
5. **"De onde veio: …"** — obrigatória, menos em recusa e em "não sei"; com "Ver as etapas" / "Esconder as etapas" quando há detalhe (o que foi filtrado, agrupado e o que ficou de fora).
6. **Motivo** (quando o dado é nominal ou de um professor só): legenda "Por quê?", opções de lista fechada, botão oficial "Mostrar os nomes" (ou "Mostrar por turma") e "Agora não" → "Tudo bem. Nada foi aberto." Escolhido o motivo, a resposta **é trocada no lugar** pela lista.
7. **Selo da auditoria** (verde): "Registrado na auditoria · <quando> · <motivo>".
8. **Ações:** "Fixar no relatório" (→ selo "Fixada") · "Baixar CSV" · até 2 próximas perguntas.
Antes da resposta: "pensando" por 700 ms; o texto chega palavra a palavra na primeira vez.

**Roteiro da coordenação** (M:`dados/analista-escola.ts`). Abertura: "Oi, Helena. Conto quantos alunos passaram de cada limiar e monto relatórios. Média, eu não faço."
- "Como a escola está esta semana?" / "Resumo de segunda": "Esta semana pedem ação: **4 alunos no critério do APOIA** (aviso até 24/09), **14 abaixo de 75%** de frequência e **71 abaixo de 6,0 em Matemática**. Desde agosto, 18 alunos pioraram de faixa e 9 melhoraram." + 3 números.
- "Quantos alunos estão abaixo de 75% de frequência?": "**14 alunos estão abaixo de 75%** de frequência: se o ano fechasse hoje, reprovariam por falta. Outros 68 estão entre 75 e 90% (falta crônica). Desde agosto, 3 entraram na faixa de baixo." + barras das 4 faixas; etapas com as turmas.
- "Quem entrou no critério do APOIA esta semana?": "**4 alunos entraram no critério do APOIA** e ainda não têm aviso aberto: 1 no 8ºA, 1 no 1ºC e 2 no 2ºB. O prazo para abrir o aviso é **24/09**. Para ver os nomes, escolha o motivo: fica registrado na auditoria." + tabela por turma + **motivo** ("Abrir o aviso no APOIA", "Apoio aos alunos, com o professor da turma", "Conversa com a família", "Pedido do titular do dado") → "**Os 4 alunos** no critério do APOIA, sem aviso aberto. Só o nome, a turma e as faltas."
- "Em que habilidade o 8º ano mais trava?": "No 8º ano, a aprendizagem mais trava em **expressões algébricas: 38 de 86 alunos** abaixo de 50% de acerto; depois, **sistemas de equações: 33 de 86 alunos**."
- "Quantos alunos pioraram de faixa desde agosto?": "**18 alunos pioraram de faixa** de frequência desde agosto e 9 melhoraram. Dos que pioraram, **3 caíram para baixo de 75%**. Estão espalhados por N turmas, nenhuma com mais de 2."
- "Quantos alunos estão abaixo de 6,0?": "No trimestre, **71 alunos estão abaixo de 6,0 em Matemática** e 47 em Língua Portuguesa; **38 estão abaixo em 2 ou mais componentes**. Em Matemática, 17 entraram e 8 saíram desde o trimestre anterior."
- "O que fazer com o 2ºB?": "No 2ºB (32 alunos), três coisas pedem ação, nesta ordem: **abrir o aviso do APOIA de 2 alunos até 24/09**, conversar com as famílias dos 2 abaixo de 75% e levar os 6 abaixo de 6,0 em Matemática para a recuperação do trimestre. Para ver os nomes, escolha o motivo." + tabela "O quê · Alunos · Até quando" + hipótese "Um mesmo aluno aparece no APOIA, abaixo de 75% e abaixo de 6,0 em Matemática: vale começar por ele." + fonte que termina em "A sugestão é do Analista; quem decide é a escola." + motivo (… "Conselho de classe").
- "Quantos alunos estão com entregas atrasadas?": "Com 3 ou mais entregas faltando: **5 alunos no 1ºC**. No 2ºA e no 2ºB o grupo é pequeno, e aparece como "menos de 5"." (tabela **sem total**) → "Quem são os 5 do 1ºC?": "Posso mostrar os nomes, mas antes preciso do motivo. **Fica registrado na auditoria** com seu nome, a hora e o motivo."
- "Quanto da IA já usamos este mês?": "Usamos **49% do pacote de setembro** (R$ 1.486,40 de R$ 3.060,00), ou **R$ 2,43 por aluno**. Nesse ritmo, o mês fecha perto de **69%** (a linha tracejada). Eu aviso quando chegar a 80% (a linha cheia)." → "Comparar com agosto"; "O que mais usa a IA?": "O Tutor dos alunos usa **62%**, os materiais dos professores **31%** e as correções **7%**. Eu mostro por função, nunca por professor."
- "Quem aprova o que a IA faz?": "Dos **412 materiais** da IA em setembro, **389 foram aprovados** por um professor e 23 esperam. Nenhum chegou ao aluno sem aprovação."
- "Monte o relatório do mês": "Pronto. Montei o **relatório de setembro do Colégio Aurora**: frequência por faixa, APOIA, notas abaixo de 6,0, onde a aprendizagem trava e uso da IA[, com as N respostas que você fixou]. **Sem nomes de alunos, sem médias e sem comparação entre professores.**" + cartão "Relatório de setembro · Colégio Aurora" / "PDF · 2 páginas". Seções do PDF: Frequência por faixa · APOIA · Notas abaixo de 6,0 no trimestre · Onde a aprendizagem trava · Entregas atrasadas (só a contagem) · IA sob controle · Respostas fixadas; aviso "Sem nomes de alunos. Sem médias. Sem comparação entre professores."; rodapé "Frequência e notas do diário oficial (Professor Online); habilidades e IA do Turmma. Não substituem Saeb nem Ideb."

**Recusas e limites da coordenação** (sem "De onde veio"):
- Por professor ou comparar professores: "Eu não mostro números por professor nem comparo professores: o Turmma ajuda o professor, não avalia o professor. Posso mostrar o uso por série."
- Conversa de aluno: "Eu não abro conversa de aluno com o Tutor. Isso só sai a pedido do titular, pelos Registros."
- Sem o dado: "Eu não tenho o Saeb por escola nem a evasão do ano. Tenho a frequência e as notas do diário, o APOIA, o Ideb e o Censo do INEP, e as provas que os professores aprovaram."
- Nome sem lista: "Para mostrar nomes, preciso de uma lista (APOIA, abaixo de 75%, abaixo de 6,0) e de um motivo. Comece pela contagem."
- Nomes sem turma: "Os nomes saem por turma, com um motivo registrado. Primeiro, a contagem: …"; nome de outra métrica: "Com nome, eu mostro só quem tem 3 ou mais entregas faltando ou ficou abaixo de 50%, e sempre com um motivo."
- Média: "Eu não mostro média: **a média esconde** quem mais precisa. …" / "Eu não mostro média de nota: …" / "Eu não mostro acerto médio: **a média esconde** quem ficou para trás. Em vez dela, a contagem."
- 3º ano EM no desempenho: "O 3º ano EM fica de fora do desempenho: tem um professor só, e o número da série seria o dele. Posso mostrar quantos alunos usaram o Turmma."
- Turma × disciplina: "Por turma em uma disciplina, o número é o de um professor só. Para ver, escolha o motivo: fica registrado na auditoria." (motivos: "Conversa com os professores da série", "Apoio aos alunos, com o professor da turma", "Pedido do titular do dado"; botão "Mostrar por turma").
- Ranking: o motor não ordena por valor; os grupos saem sempre na ordem natural (6º → 3º EM, 6ºA → 3ºB).
- Não sei: "Isso eu ainda não sei responder. Posso mostrar:" + 3 sugestões.
- Grupo pequeno: "Há grupos com menos de 5 alunos neste recorte; por isso o total não aparece."
- Auditoria: cada abertura nominal chama `ia.verDadosComNome(alvo, motivo)` → linha "Viu dado com nome · <alvo>" em Registros › Auditoria, com quem, quando e a finalidade; baixar o relatório registra `exportacao`.

**Roteiro da rede** (M:`dados/analista-rede.ts`). Selo "Só números agregados". Exemplos:
- "O que pede ação esta semana?": "Esta semana, **5 APOIAs** com o prazo de 14 dias vencido, **3 escolas** com chamada atrasada há 3 dias letivos ou mais e **58 materiais** da IA esperando a revisão do professor." + tabela "O quê · Quantos · Prazo".
- "Quantos alunos estão abaixo de 75%?": "**96 dos 3.412 alunos** estão abaixo de 75% de frequência: se o ano fechar assim, reprovam por falta. Outros **452** estão entre 75 e 90% (falta crônica). O <série> tem mais alunos abaixo de 75%: **N**." + tabela por série.
- "Qual a frequência média da rede?": "A média esconde quem mais precisa: tem aluno que nunca falta e aluno que falta muito. Em vez dela, as faixas: …"
- "Quem piorou desde agosto?": "… Não mostro quem: na rede, só contagens."
- "Quais escolas têm APOIA vencido?"; "Quem entrou no critério do APOIA esta semana?": "Na rede eu não vejo nomes: quem abre o aviso no APOIA é a escola. …"
- "Como está cada escola?": "As 6 escolas, **de A a Z**, em contagens de alunos. Eu não ordeno escolas da melhor para a pior. Bem-te-vi (montando) e Figueira (convite enviado): ainda sem dados."
- "Quanto da IA espera revisão?": "Nada da IA chega ao aluno sem um professor revisar. Em setembro, a IA preparou **1.616 materiais**; **58** esperam a revisão. A rede usou 34% do pacote de IA do mês, R$ 1,70 por aluno."
- "Gere o relatório do mês": "Pronto. Montei o **relatório de setembro · <rede>**: … **Só contagens, sem nomes e sem médias.**" + PDF e, pelo diálogo do Painel, CSV.
- **Recusas da rede:** nominal — "**Na rede eu só vejo números agregados, de grupos de 5 ou mais alunos.** Não mostro nome nem dado de um aluno: quem acompanha cada aluno é a escola."; professor — "Eu não comparo nem avalio professores. Na rede, nenhum número é de um professor."; turma — "Na rede eu não abro turma: uma turma tem poucos professores e poucos alunos. Posso mostrar a série na rede toda."; conversa — "Eu não vejo conversas, e a secretaria também não."; ranking — "Eu não ordeno escolas da melhor para a pior: cada uma tem alunos diferentes, e o ranking não diz onde agir. Aqui estão todas **de A a Z**, em contagens."; grupo pequeno — "Nesse recorte há **menos de 5 alunos**: por isso o número não aparece."; escola de outra rede — "… está no painel da Prefeitura de Joinville. Troque de rede no topo da lateral."; "Como protegemos os dados" abre o painel ao lado. **Na rede não existe motivo nem lista nominal.**

**Números que os painéis mostram** (fonte única M:`dados/gestao.ts`; nenhuma média; todo número é "quantos alunos passaram de um limiar")

| | Colégio Aurora (coordenação) | Prefeitura de Joinville | Estado de SC · Regional Joinville |
|---|---|---|---|
| Alunos / unidades | 612 / 22 turmas (3ºA sem lista) | 3.412 / 6 escolas (4 com dados) | 4.262 / 6 escolas (5 com dados) |
| Frequência ≥ 95% · 90–95% · 75–90% · < 75% | 399 · 131 · 68 · 14 | 2.061 · 803 · 452 · 96 | 2.621 · 882 · 602 · 157 |
| Pioraram / melhoraram desde agosto | 18 / 9 | 61 / 34 | 84 / 41 |
| Abaixo de 6,0: LP · MAT · 2 ou mais (trimestre anterior) | 47 (41) · 71 (62) · 38 (33) | 268 (241) · 391 (352) · 214 (198) | 363 (330) · 551 (497) · 320 (289) |
| APOIA sem aviso / vencidos | 4 / 0 | 14 / 5 | 29 / 10 |
| Sem chamada | 2 turmas (7ºB 3 dias, 9ºC 4) | 3 escolas, 6 turmas | — (coluna não aparece) |
| Pé-de-Meia < 80% | não mostrado | não se aplica | 63 de 1.140; < 80% no total: 302 |
| 1ª série EM, 2 ou mais abaixo de 6,0 | — | — | 106 |
| IA: materiais · revisados · esperando | 412 · 100% · 23 | 1.616 · 100% · 58 | 2.272 · 100% · 66 |
| Pacote de IA · por aluno | 49% · R$ 2,43 | 34% · R$ 1,70 | 45% · R$ 2,26 |
| Anuais (INEP) | Ideb AF 5,4 · Ideb EM 4,6 · reprovação 1º EM 11,2% · distorção 13,5% | Ideb AF 6,0 · Ideb AI 7,1 · abandono AF 0,0% · distorção AF 9,0% | Ideb EM 4,3 · Ideb AF 5,0 · reprovação 1ª EM 15,7% · abandono 4,4% · distorção 24,8% |

Contas fixas: porcentagem = arredonda(a ÷ b × 100); por aluno = custo ÷ alunos com acesso; projeção do mês = arredonda(% × 30 ÷ 21); origem de cada número: "Oficial" (anil: diário, APOIA, Pé-de-Meia, INEP) ou "Turmma" (laranja: provas aprovadas, IA).

### (d) Passos das introduções

**Coordenação** (`/coordenacao/bem-vindo`, agente Analista; 4 passos + fim)
1. Pose acenando. Fala: "Oi, Helena! Você coordena o Colégio Aurora aqui." Três itens com ladrilho: "Monta a escola", "Aprova o que é sensível", "Vê quantos alunos pedem ação".
2. Pose apontando. Fala: "O que é sensível espera você aqui." Prévia do **sino** (o sino com o número de verdade, "Esperando você", "no canto de cima", as 3 primeiras linhas; vazio "Tudo em dia."); pergunta "Como quer saber?": "Resumo toda segunda, 7h" ou "Só quando algo esperar por mim"; nota "Risco à vida chega sempre, na hora, para quem tem a atribuição." Continuar só acende com a escolha; reação "Anotado!"; grava a preferência (resumo ligado ou não; alerta ligado).
3. Pose apontando. Fala: "Pergunte qualquer coisa sobre a escola." Mini Analista com uma pergunta pronta, "Quantos alunos estão abaixo de 75% de frequência?" → "**14 alunos** estão abaixo de 75%: reprovariam por falta se o ano fechasse hoje. Outros 68 estão em falta crônica." + barras + "De onde veio: Diário oficial (Professor Online) lido hoje às 7h · Colégio Aurora, 01 a 21/09"; nota "Dado com nome só com motivo, e fica registrado." Continuar só depois de perguntar.
4. Pose acolhendo, botão "Entendi". Fala: "Aqui ninguém ranqueia professor, e eu nunca decido sobre aluno." Três cartões com o sinal de proibido: "Ranquear professor", "Dar nota sem o professor", "Decidir sobre um aluno".
5. **Fim.** Fala: "Pronto! Agora é montar a escola." Trilha dos 7 passos ("A escola: N de 7 feitos": Ano letivo, Séries, Disciplinas, Turmas, Lista de nomes, Professores, Turmas do professor) e a escolha "Montar a escola" (→ `/coordenacao/escola?painel=roteiro`) ou "Ver o painel primeiro" (→ `/coordenacao`). Botão "Começar".

**Secretaria/rede** (`/rede/bem-vindo`, agente Analista; 4 passos + fim)
1. Pose acenando. Fala: "Olá! Aqui você vê a rede em contagens de alunos, sem médias." Quatro ladrilhos: "O que pede ação", "Frequência por faixa", "Notas abaixo de 6,0", "Indicadores do INEP".
2. Pose pensando, botão "Entendi". Fala: "O que você vê, e o que não vê." Duas listas — "Vê": "Quantos alunos passaram de cada limiar", "Frequência por faixa e APOIA", "Notas abaixo de 6,0", "Escolas de A a Z", "Ideb e Censo (INEP)"; "Não vê": "Nome de aluno", "Conversas", "Nota de uma pessoa", "Número de professor", "Ranking de escola", "Média". Nota: "Grupo com menos de 5 alunos aparece como "menos de 5"."
3. Pose apontando. Fala: "Pergunte ao Analista. Ele mostra de onde vem cada número." Mini Analista com 3 perguntas: "Quantos alunos estão abaixo de 75%?" (a contagem e as barras), "Qual a frequência média?" ("A média esconde quem mais precisa. Em vez dela: …"), "Quais alunos faltam mais?" (recusa: "**Na rede eu só vejo números agregados.** Quem acompanha cada aluno é a escola."). Continuar só depois de uma pergunta.
4. Pose pensando. Fala: "Qual rede você acompanha?" Opções "Prefeitura de Joinville" ("Anos finais (6º ao 9º ano) · diário EVN") e "Estado de SC · Regional Joinville" ("Anos finais e Ensino Médio · diário Professor Online"), com o selo "No Painel" na escolhida; "Dá para trocar a qualquer hora, no topo da lateral."; interruptor "Relatório do mês por e-mail, dia 1º". Reação "Anotado!"; grava a rede e a preferência.
5. **Fim.** Fala: "Pronto! O que pede ação esta semana está no Painel." Resumo com visto: "Rede: <nome>" e "Relatório no dia 1º, por e-mail". "Começar" → `/rede`.

**Equipe Turmma** (`/operacao/bem-vindo`, **sem agente**; 2 passos + fim)
1. Pose acenando. Fala: "Oi! Aqui você cria escolas e acompanha uso e custo." Três itens: "Cria escola e rede", "Convida a 1ª coordenação, só pelo e-mail", "Teto do pacote, com aviso em 80%".
2. Pose pensando, botão "Entendi". Fala: "Você nunca vê aluno nem professor." Duas listas — "Vê": "Escolas e redes", "Convites (só o e-mail)", "Uso e custo por escola"; "Não vê": "Nome", "Nota", "Conversa", "Quem usa".
3. **Fim.** Fala: "Pronto! Por onde começamos?" Opções: "Criar uma escola" (→ `/operacao?nova=1`), "Ver as escolas" (→ `/operacao`), "Ver o uso do mês" (→ `/operacao?aba=uso`). Botão "Começar".

Regras comuns: aparece uma vez por pessoa; X e Esc saem para o Início do papel; `?rever=1` (menu da pessoa) mostra de novo; "Começar" marca como vista antes de navegar.

---

## 17. O que não li ou não conferi

- `dados/acesso.ts` (sementes dos pedidos de nome): a contagem inicial do sino da coordenação (9 itens, se a 6ºB tiver os 2 pedidos sem professor que o LEIAME descreve) é inferida.
- `dados/numeros-rede.ts` inteiro, `dados/consulta.ts` inteiro e as respostas da rede que não aparecem acima: li os cabeçalhos, as perguntas e as frases principais.
- Os números da tabela da seção 16(c) marcados como somas (pioraram/melhoraram das redes, pacote e por aluno das redes, materiais do Estado) foram **calculados por mim** a partir das tuplas de `dados/gestao.ts`; não rodei o mockup.
- `components/duo/graficos.tsx` e `relatorio.tsx`: só os nomes das peças (`CartaoNumero`, `BarrasPequenas`, `LinhaCurta`, `TabelaCurta`, `BarraPacote`, `BarraEmpilhada`, `PontosSituacao`, `CartaoKPI`, `GraficoSemanas`, `MapaDeCalor`, `TabelaBarras`, `Tendencia`; `montarPdf`, `baixarPdf`, `baixarCsv`, `PreviaRelatorio`, `CartaoArquivo`).
- `areas/coordenacao/_a-pecas.tsx` e `_b-pecas.tsx` são peças antigas (pele anterior) que nenhuma tela do recorte importa; ignorei.
- No produto, li rotas, navegação e os títulos, rótulos e vazios de cada tela; não li as telas inteiras nem as de `privacidade/` além dos nomes das abas.
