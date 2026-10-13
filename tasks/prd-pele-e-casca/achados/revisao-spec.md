# Achados das revisões — `tasks/prd-pele-e-casca/revisao-spec.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-13 01:57:55 · `tasks/prd-pele-e-casca/revisao-spec.md`

VEREDITO: AJUSTES NECESSÁRIOS

Tela vista: não. A revisão é de spec e ainda não existe tela da X1, então não há foto para ler. Reli `prd.md`, `techspec.md`, `cenarios.md`, as seções 9.1 (inclusive "Pares de contraste"), 9.7, 9.10, 10 e 11 do `docs/interface.md`, e os documentos das tarefas 3 a 7.

**As três correções exigidas na rodada 1**

1. **Avatar e selo (7b, seção 10, RF10): atendida.**
   - A onça só aparece em `AssinaturaIA` e no balão de `MensagemIA`, com função e selo no mesmo bloco.
   - `Analista.tsx` e `Agentes.tsx` passam à `AssinaturaIA`.
   - O teste de arquitetura reprova outros importadores, e o e2e confere `[data-agente]` com `[data-selo-ia]` no mesmo contêiner.
   - O avatar `aria-hidden` é coerente com a 9.7: o nome acessível é o da função, e "onça" nunca é nome de agente.
   - "Seu time" mostra o ícone da função num `Ladrilho`.
2. **Anel de foco (seção 9): atendida.**
   - O token `foco` tem 3 px, afastamento de 2, por dentro em linha e anel mais borda no campo.
   - Os pares a 3:1 estão na tabela e passam: 5,47 e 7,80 no chão, 5,10 e 6,40 no fundo suave, 4,72 e 6,14 no `azul-claro`.
   - Fora da tabela, `foco` sobre `campo`, `borda`, `realce`, `papel` e `laranja-claro` também fica acima de 3:1 nos dois temas.
   - O `focoVisivel` novo deixa de aceitar sombra, e a razão está dita.
3. **Alvo de toque (seção 9): atendida no que a regra 50 item 2a exige.**
   - Declara 24 px no mínimo e 44 px na ação principal e abaixo de 768 px, e o e2e da galeria mede no `celular`.
   - As tarefas 4, 5, 6 e 7 fixam 44 px por peça abaixo de 768 px.
   - A inconsistência entre documentos está nas recomendações.

**Contraste calculado** (WCAG 2.1, os 66 pares da tabela e as 20 linhas das famílias):

- Todos os pares da tabela passam o mínimo dos dois temas.
- A margem mais fina é `sobre-cor` sobre `caramelo-fundo` no escuro, 4,55:1.
- Os números "Medida" das dez famílias conferem nos dois temas.
- Conferem também os números do texto de `tinta`, `apoio`, `sutil`, `borda`, `apagado`, `borda-campo`, `sobre-grafite`, `pendente`, `ok`, `erro`, `info` e `ia`.
- Divergem só dois: `foco` no escuro está escrito 8,3:1 e o cálculo dá 7,8:1, e no claro está 5,4:1 e dá 5,47 (5,5).

Estados: ok. Carregando e erro seguem as três peças de `estado/` e o `EstadoErro` (7c), e o vazio e o dado são os de hoje.

Acessibilidade: ok, com um bloqueante de contraste no desligado, descrito abaixo.

Chromebook fraco: ok. Entrada em 127 de 150 kB, sem `import()` no primeiro quadro (provado pelo teste do build), sem fonte, só `transform` e `opacity` animam, nada de `color-mix` ou `:has()`.

Celular: ok. 360 px sem rolagem, barra de baixo para até quatro itens, "Sair" visível, escola ativa na barra de topo e `<main>` com espaço para a barra de baixo. Nada depende de hover (10.1, item 6).

Ação oficial protegida: sim. O `oficial` em `grafite` difere por teste de face e degrau em cada tema, e a confirmação escreve o que vai acontecer antes dos botões.

**Bloqueantes**

1. O texto do botão desligado se contradiz entre os documentos, e a versão que a tarefa implementa reprova 4,5:1 no escuro.
   - Onde:
     - `techspec.md` seção 9, "Degrau", e `docs/interface.md` linhas 788 e 791 (tabela de pares): texto `apoio` sobre `borda`, que passa com 7,98:1 e 7,70:1.
     - `docs/interface.md` linhas 704 (9.1, desvio 2) e 1313 (10.2, `Botao`) e `tasks/prd-pele-e-casca/3_task.md:38` (tarefa 3.2): texto `sutil` sobre `borda`, que dá 5,23:1 no claro e **3,72:1 no escuro**.
   - Por que bloqueia:
     - O implementador lê a 10.2 e a 3.2 e escreve `sutil`.
     - A linha "desligado da D80" da tabela declara um par, não amarra a classe do `Botao`, então o teste de contraste passa mesmo com `sutil` no código.
     - A seção 10 não manda resolver a cor de texto do desligado por tema, só a face e o degrau do oficial.
     - O próprio `cenarios.md` (A4, A41 e a linha 413) deixa a escolha "a fechar na tarefa". Nenhuma tarefa deve herdar uma decisão que reprova contraste.
   - Correção exigida:
     - Trocar para `apoio` nas linhas 704 e 1313 do `docs/interface.md` e em `3_task.md:38`.
     - Resolver A4, A41 e a pendência da linha 413 do `cenarios.md` para `apoio`.
     - Fazer o teste de `Botao` resolver a cor de texto do desligado por tema e exigir 4,5:1 contra a face `borda`.

**Recomendações**

- **`docs/interface.md` 9.1:** corrigir o `foco` para "5,5:1 no claro; 7,8:1 no escuro".
- **Pares de contraste:** a tabela não cobre o `texto` de oito famílias sobre `fundo` e `fundo-suave` (laranja, verde, amarelo, roxo, turquesa, anil, lima e rosa). Também não cobre `sutil` e `apoio` sobre `azul-claro` (linha selecionada). Hoje todos passam nos dois temas, mas uma troca futura de hex não seria pega.
- **Medidas do botão:** `compacto` e `principal` estão com 38 e 46 px na 9.3 e na 10.2, e 36 e 44 px no RF5 do PRD, na tarefa 3.2 e no A42. Escolher uma medida e alinhar.
- **Tabela 10.2:** acrescentar a medida abaixo de 768 px em `Toque` (40), `Interruptor` (32) e nos chips. A seção 9 diz "44 em tudo abaixo de 768" e a tabela não acompanha, embora as tarefas 4 e 6 já fixem 44.
- **Nomes de peça:** o teste de arquitetura da seção 10 cita `Mensagem` e a 7b cita `MensagemIA`. Usar o nome real do arquivo.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/techspec.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/3_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/cenarios.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/docs/interface.md`

## conformidade-reviewer · 1ª rodada · REPROVADO · 2026-10-13 01:58:22 · `tasks/prd-pele-e-casca/revisao-spec.md`

VEREDITO: REPROVADO

Caminhos de escrita em Nota: nenhum. A X1 não cria rota, tabela, job nem seed (Tech Spec, seções 3, 4 e 7c). Todos com autor humano? Não se aplica.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. A linha de aprovação continua dizendo quem aprovou e quando (A29 a A31, inalterados), e os pares `ok`, `pendente` e `erro` estão na tabela de contraste da 9.1, como pede o RF2. O selo de IA também está lá (`ia` sobre `ia-cx`).
Supervisão do tutor: ok. A faixa de supervisão continua presa, sem botão, logo abaixo da barra de topo (A55). O modo escuro e a barra de baixo não a escondem. Nada novo é medido sobre o aluno: o navegador guarda só `educa.aparencia` e `educa.lateral-recolhida`, sem identificador (RF24).
Autonomia declarada e visível: sim, sem mudança. `Agentes.tsx` só troca o avatar solto pela `AssinaturaIA`, e o texto da autonomia fica como está.

**Correções exigidas na 1ª rodada**

- **Onça só com a função e o selo.** Atendida na Tech Spec. A seção 7b deixa a onça só em `AssinaturaIA` e no balão de `MensagemIA`. `Analista.tsx` e `Agentes.tsx` passam à `AssinaturaIA`. "Seu time" mostra o ícone da função. A prova é dupla: o teste de arquitetura da seção 10 e o e2e que confere, em quatro telas, a função e o selo no mesmo contêiner de cada `[data-agente]`. O avatar ficou `aria-hidden`, como a 9.7 já dizia.
- **Onça parada e onça de corpo inteiro.** Atendida na Tech Spec, mas desfeita pelo `docs/interface.md` (bloqueante abaixo). As condições estão escritas e testadas: um desenho por agente, expressão neutra, props só `agente` e `tamanho`, nenhum temporizador, dois renders iguais, A51 valendo também para a onça. A 9.7 diz que a onça inteira não aparece na X1, e o item 8.1 do `tasks.md` também. O problema é a 10.2, que diz o contrário.
- **Indução de uso e saída** (D59, regra 70 item 4b, Decreto 12.880 arts. 9º e 10). Nada encontrado:
  - O modo escuro começa em Sistema. Só a escolha explícita grava, e voltar a Sistema apaga a chave.
  - Só `transform` e `opacity` animam, e o CSS servido sem `infinite` está no e2e.
  - "Sair" fica à vista sem abrir nada, do tamanho dos vizinhos, em todo papel e largura (RF15).
  - A comemoração fica de fora até a X4, com parecer.
  - A pose "acolhendo" não entra.

**Bloqueantes**

1. **A 10.2 manda a onça dormindo para a X1.** `docs/interface.md:1340`, na tabela "O catálogo das peças da X1", diz para os três de `estado/`: "O vazio 'Tudo em dia' leva a onça dormindo". Isso contradiz a seção 7b da Tech Spec, a 9.7 (linhas 958 a 966: dormindo só na X2, com parecer) e o item 8.1 do `tasks.md`. A seção 9 da Tech Spec manda o implementador buscar a medida de cada peça justamente na 10.2, e a tarefa 6.0 reveste `estado/`.
   - **Nenhum teste pega isso.** O teste de arquitetura da seção 10 só olha quem importa a cabeça ou o avatar. O e2e do avatar só confere `[data-agente]`. A guarda de cor deixa a onça como exceção nomeada. Uma onça de corpo inteiro num vazio sairia sem nome de função e sem selo "IA", o que viola o RF10 e a D58 (regra 70, item 4a), e sem o parecer que a X2 exige.
   - **A mesma contradição aparece em `docs/interface.md:1430-1431`.** O desenho da lateral da X1 mostra "(onça) Assistente" e "(onça) Tutor" em "Seu time", contra a 7b e a 9.7. Esse caso o teste de arquitetura já pega, porque a casca não pode importar o avatar. Mas o documento continua errado.
   - **Correção exigida:**
     - Na linha 1340, tirar a onça dormindo do catálogo da X1 ou marcá-la "X2, com parecer".
     - Nas linhas 1430 e 1431, trocar "(onça)" pelo ícone da função num ladrilho.
     - Na seção 10 da Tech Spec (camada Arquitetura) e na subtarefa 8.4 do `tasks.md`, alargar o teste: **nenhum arquivo fora de `AssinaturaIA` e `Mensagem.tsx` importa nada de `componentes/onca/`**. É a pasta inteira, não só a cabeça, e assim o teste cobre também a onça de corpo inteiro.

**Recomendações**

- `apps/web/src/galeria/Galeria.tsx` importa o `AvatarAgente` hoje. O teste de arquitetura vai reprovar a galeria dividida em seções. É melhor dizer na 8.4 que a seção da galeria usa a `AssinaturaIA`, e não uma exceção aberta no teste.
- A 9.5, item 3 (`docs/interface.md:912-913`), deixa os três pontos de "pensando" e o esqueleto pulsarem em laço. A A51 e a A53 (nenhuma animação em `[data-pensando]`) e o e2e sem `infinite` dizem o contrário. Os testes protegem a regra, mas o documento convida a quebrá-los. Vale alinhar a 9.5 aos testes.
- O desligado do botão está como `sutil` na 10.2 (`docs/interface.md:1313`) e como `apoio` na tabela de pares e na Tech Spec. O ponto já está em aberto no `cenarios.md`, item 1. É assunto do `frontend-reviewer`, citado só porque a tabela de pares é a prova do RF2.
- A frase da D80, item 3, com as cores do Assistente e do Tutor trocadas, continua para acertar fora da spec, como a 7 do `docs/interface.md` já registra.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/prd.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/cenarios.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/tasks.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/docs/interface.md (9.1 com os pares, 9.5, 9.7, 9.10, 10.2 a 10.4, 11.1)
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/componentes/ia/Mensagem.tsx
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/componentes/ia/AssinaturaIA.tsx

## infra-guardian · 1ª rodada · REPROVADO · 2026-10-13 01:59:20 · `tasks/prd-pele-e-casca/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: nenhum no servidor. No cliente, o primeiro carregamento das 7h30.
Rate limit: ok (não se aplica: nenhuma rota)
Fila e prioridade: ok (não se aplica: nenhum job)
Concorrência: protegida (só no cliente: em duas abas a última escolha vence e a outra acompanha pelo evento `storage`, seção 7c, com e2e na seção 10)
Índice e paginação: ok (não se aplica: nenhuma consulta)
Degradação de IA: não se aplica (nenhuma chamada nova; `AvisoFila` só ganha a pele nova)
Migration: não se aplica
Métrica e alerta: ok (o teto do `size-limit` e o teste do build medem o primeiro carregamento; entrada e CSS medidos em brotli em cada tarefa, seção 7c)

Bloqueantes:
- **A troca de `public/` por asset com hash foi feita só na seção 7c. Em dois lugares a spec ainda manda para `public/`, e o teto próprio não tem número.**
  - **Seção 12 da Tech Spec.** O primeiro "NÃO VERIFICADO" ainda diz "Saída: o arquivo em `public/` (seção 7c)". Isso contradiz a própria 7c.
  - **`docs/interface.md`, seção 9.4 (linhas 887–888).** Diz que acima do teto os ícones "viram um arquivo de `public/`, usado por `<use>`". A seção 1 da Tech Spec manda ler as medidas no `docs/interface.md`, e a tarefa 9.3 decide "pela 7c". Quem implementa encontra duas instruções opostas.
  - **O que acontece às 7h30 se o caminho `public/` for seguido.** O arquivo não tem hash, então não pode ser servido com cache de longa duração. Depois de um deploy, cada Chromebook ou pergunta ao servidor de novo a cada carga, ou fica com o desenho velho. Além disso, nenhum grupo do `.size-limit.json` olha `public/`, porque todos medem `apps/web/dist/assets/*.js`. O peso dos ícones sairia de toda medição.
  - **O limite de 4 kB não é o mesmo nos três textos.** A 7c diz "ícones de lugar acima de 4 kB", o que pode ser lido como por ícone e não diz a compressão. A 9.4 diz "teto de 4 kB em brotli" para o conjunto. A 10.4 diz "até 4 kB".
  - **Correção exigida.**
    - Na seção 12 e na 9.4, a saída passa a ser a mesma da 7c: um arquivo `.svg` gerado pelo build, importado por URL, com hash no nome.
    - Dizer que os 4 kB são **a soma dos ícones de lugar na entrada, medida em brotli**.
    - Dar ao teto próprio o número e o caminho no `.size-limit.json` (por exemplo `apps/web/dist/assets/lugares-*.svg`, com `brotli: true`; o `@size-limit/file` já instalado mede `.svg`).
    - Pôr o caso que reprova esse teto em `tools/ci/tamanho-web.test.ts`, como os outros grupos.

Conferência das correções e recomendações da 1ª rodada:
- **Lista do que mora na entrada e conta nos 150 kB:** feita, seção 7c (`tema.ts`, `Segmentado`, `Aparencia`, `Ladrilho`, ícones de lugar). Bate com a "Armadilha" da tarefa 2.0.
- **A casca não usa `import()` no primeiro quadro:** feita. Está na 7c e no teste de arquitetura da seção 10, e o teste do build soma só os imports estáticos.
- **"Seu time" com o ícone da função num `Ladrilho`, sem a onça:** feita (seção 7b, RF10, `docs/interface.md` 9.7).
- **Recomendações aplicadas:**
  - Medição em brotli por tarefa: feita. A tarefa 1 já registra o CSS em 5,7 kB antes e 6,6 kB depois, em brotli.
  - `:has()`, `scrollbar-width` e `color-mix`, também em estilo em linha, ficam fora: seção 9, "Desvios", com a lista proibida no e2e `tokens`.
  - Sombra do degrau e hover sem transição: seção 9, "Degrau", e 9.5, item 1.
  - `try/catch` e valor desconhecido no script do tema: seção 5, testado na tabela da seção 10.
- **Números que batem:** o teto de `pecas-*` (26 para 40 kB) está igual na 7c, na 10.4 e nas tarefas. Os tetos das áreas (16, 8 e 5 kB) e o da operação (60 kB) são iguais aos do `.size-limit.json`.

Recomendações:
- **Seção 7c, "a entrada está em 127 de 150 kB".** Os 127 kB são o primeiro carregamento inteiro (a entrada e os pedaços que ela importa direto), como dizem a 10.4 e o `.size-limit.json`. A entrada sozinha pesa menos. Ajustar a palavra.
- **Plano para quando estourar.** Faltam 23 kB até o teto, e a 7c não diz o que sai da entrada se a casca nova passar disso. Hoje só os ícones têm saída. Declarar o próximo da fila (a gaveta ou o seletor de escola por `import()` depois do primeiro quadro, por exemplo).
- **RF22 contra 10.4.** "A área de um papel não baixa ícone nem peça de outro" choca com os ícones de lugar de todos os papéis morarem na entrada: o aluno baixa Turmas e Ferramentas. Escrever que a entrada é comum a todos e que a regra vale para os pedaços das áreas.
- **CSS sem teto.** O CSS bloqueia a pintura e ganhou o bloco do escuro, mas só é medido. Um teto em brotli no `.size-limit.json` impede que cresça calado nas X2 a X4.
- **Cache no staging.** O nome com hash só ajuda se o servidor de produção mandar `Cache-Control: public, max-age=31536000, immutable` em `/assets/*` e `no-cache` no `index.html`, que agora traz o script do tema. Hoje a web roda em `vite preview` e nenhum documento registra isso. Pôr a linha em `tasks/prd-fundacao-tecnica/notas-staging.md`.
- **De onde vem o ícone de "Seu time".** Hoje a lista de agente para ícone mora em `componentes/ia/AvatarAgente.tsx`, pasta que o teste do build trata inteira como fora da entrada. Dizer na seção 9 que essa lista vive fora de `componentes/ia/`, para a tarefa 12.0 não descobrir isso pelo build vermelho.
- **9.4 do `docs/interface.md` contra a Tech Spec.** A 9.4 diz "nenhum hex dentro do ícone", e a seção 10 dá aos ícones ilustrados a exceção de hex em `fill` e `stroke`. Alinhar (é mais do `frontend-reviewer`).

Arquivos citados:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/techspec.md` (seções 7c e 12)
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/docs/interface.md` (9.4, linhas 887–888; 10.4)
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/prd.md` (RF22)
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/.size-limit.json`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tools/ci/tamanho-web.test.ts`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/nome-dos-chunks.ts`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-13 02:01:47 · `tasks/prd-pele-e-casca/revisao-spec.md`

VEREDITO: REPROVADO

Cenários exigidos:
- **Caminho feliz:** os tokens nos dois temas; a escolha da aparência antes do primeiro quadro; os seis botões; a casca nas três larguras; a onça só com a função e o selo.
- **Bordas:** o Chrome 109; o armazenamento bloqueado; dois alunos no mesmo Chromebook; o professor com duas escolas; o aluno sem turma no ano e o professor sem turma confirmada; a sessão vencida com um diálogo aberto; o nome comprido a 360 px; o vínculo encerrado numa das escolas (`acesso-suspenso`).
- **Permissão:** "Sair" sempre à vista; o perigo cheio só dentro da confirmação; a ação oficial com um desenho próprio.
- **Isolamento:** a troca de escola e de pessoa descarta o cache e fecha a gaveta, o que prova a mutação de `lembrarQuemEsta`.
- **Concorrência (só no cliente):** duas abas trocando a aparência; o clique duplo em confirmar.

Cobertos:

**Pedidos da rodada 1:**
- **Foco:** o token `foco`, os 3 px e os pares a 3:1 estão na 9.1 (§9).
- **Alvo de toque:** a medida por peça está na 10.2, e o e2e da galeria a mede no `celular`.
- **Armazenamento:** a lista fechada de chaves e o e2e do RF24 estão no §7 e no §10.
- **Orçamento:** o que mora na entrada, a prova de que a casca não usa `import()` e o asset com hash estão no §7c.
- **Onça:** ela só aparece na `AssinaturaIA` e no balão da `MensagemIA`, e a de corpo inteiro fica fora da X1 (§7b).
- **Tarefas:** a 8.3 leva os comentários "nunca rosto", e a A28 leva o título do caso. A 12.3 leva as mutações de `lembrarQuemEsta` e da troca de escola, e a 13.4 o caso da gaveta.

**RF com teste previsto:**
- **RF1:** A1, A9, A10 e U1 a U4.
- **RF2:** `contraste.test.ts` lê a tabela inteira, com número fixo de linhas, e calcula nos dois temas. Os 67 pares da 9.1 estão todos cobertos.
- **RF3 e RF4:** §10, mais o `2_task` em parte.
- **RF5 a RF8:** `3_task`, A37 a A46, U5 a U11.
- **RF9:** a galeria com axe, nos dois temas e nos dois projetos.
- **RF11:** A23 e A24.
- **RF12:** a 11.3.
- **RF13 a RF16:** A14 a A22, U14 e a parte B.
- **RF18 a RF21:** os e2e de hoje e a contagem da parte C.

**Bordas já cobertas pelos e2e de hoje:** `minha-turma:90`, `inatividade:63/265/294`, `acesso-suspenso:136/169`, `escola-e-vinculos:407`.

**Mutações do `1_task`:** as seis são aplicáveis, e cada teste citado existe e fica vermelho. Conferi pelo trecho de contexto e pelo nome do caso: `estilos.test.ts:204`, `estilos.test.ts:196`, `contraste.test.ts` (o `it.each`), `botao-secundario.test.ts:28`, a guarda U3 e `tokens.spec.ts:149`. As do 2.0 ao 7.0 ainda serão preenchidas por quem implementa.

Bloqueantes:

1. **O desligado está em duas cores, e nenhum teste liga a classe do botão ao par.**
   - **Onde:** Tech Spec §9 "Degrau" e a tabela de pares (`docs/interface.md:788-792`) dizem texto `apoio`. Já o `3_task.md` 3.2, a `docs/interface.md:704` e a `docs/interface.md:1313` dizem `sutil`.
   - **Por que importa:** `sutil` sobre `borda` no escuro dá cerca de 3,7:1. O `contraste.test.ts` calcula só o par declarado, e o axe não mede elemento desligado. Quem seguir o `3_task` passa por todos os testes com o desligado ilegível no escuro, o que viola o RF5 e o RF2.
   - **Correção:**
     - Unificar em `apoio` no `3_task` 3.2 e na `docs/interface.md` 704 e 1313.
     - Na linha "Botão" do §10, exigir um teste de unidade que resolva as classes reais de `classesDoBotao` em hex por tema: face e texto, ligado, hover, apertado e desligado. Ele calcula o contraste de cada combinação.
     - Mutação: `disabled:text-sutil` no lugar de `disabled:text-apoio` deixa esse teste vermelho.
2. **O RF2 diz "cada par que a pele usa", e a tabela deixa de fora pares em uso.**
   - **O que falta na 9.1:**
     - O `<família>-texto` sobre `fundo`: a própria 9.1 diz que ele serve "para escrever no chão" e traz a medida, mas só `azul-texto` e `vermelho-texto` estão na tabela.
     - `ok` e `pendente` sobre `fundo`: a A67 os afirma como texto no diálogo.
     - `sobre-grafite` sobre `noite-baixo`: o oficial de antes, apertado (`botao-secundario.ts:33`, `:69`).
   - **Correção:** acrescentar essas linhas à tabela e atualizar `PARES_DA_TABELA`.
3. **O RF6 não tem teste para o que não é botão.**
   - **Onde:** o teste do §10 compara só as variantes do botão. Mas `bg-noite` continua como face fora do oficial em `Atividade.tsx:150`, `Home.tsx:125`, `NavegacaoDaLista.tsx:27` e na dica de `itens-da-lateral.tsx:30`. No escuro, `noite` e `grafite` têm o mesmo valor, `#F1F7FB`; no claro, `#0D0D0D` contra `#333333`.
   - **Correção:** a guarda de `estilos.test.ts` passa a aceitar `bg-grafite` e `bg-noite` (e `-alto`/`-baixo`) como face só numa lista fechada, que são as constantes do oficial. Os quatro usos trocam de token ou entram na lista com justificativa. O outro caminho é reescrever o RF6 para a afirmação mais estreita.
4. **O RF10 tem dois furos no teste.**
   - **O contêiner não está definido:** a §10 pede a função e o selo "no mesmo contêiner", sem dizer qual. Se for um ancestral qualquer, o `main` sempre tem um selo, e o teste passa com a regra removida.
     - Correção: nomear o bloco, por exemplo o `[data-assinatura]` mais próximo. Ele contém exatamente um `[data-agente]`, o nome da função em texto visível e um `[data-selo-ia]`. Declarar a mutação: tirar o `SeloIA` da `AssinaturaIA` deixa o teste vermelho.
   - **Condições do §7b sem teste:** "nenhum texto atribuído à onça" e "'onça' nunca é o nome acessível" não aparecem na §10. É regra 70, item 4a, com veto.
     - Correção: um teste de componente afirma que o avatar tem `aria-hidden="true"`, que o SVG não tem `<title>` nem `<desc>`, e que nenhum nome acessível casa com `/onça/i`.
5. **O RF22 contradiz o §7c e fica sem teste.**
   - **Onde:** o RF22 diz que "a área de um papel não baixa ícone de outro". O §7c põe na entrada os ícones de lugar do professor e do aluno (os de até 4 kB), e com isso todo papel os baixa.
   - **Correção:** escolher um dos caminhos:
     - o RF22 exclui os ícones da casca, por escrito;
     - os ícones de um papel saem da entrada, e `nome-dos-chunks.test.ts` ganha o caso, com mutação.
6. **O `2_task.md`, "Testes que provam a regra", não traz o que a §10 e a rodada 1 exigiram.**
   - **O que falta:**
     - O teste que extrai o `<script>` do `index.html` e o roda com a tabela de casos, igual a `resolverTema`: inclui a leitura que lança e o caso sem `matchMedia`. A rodada 1 o mandou para a 2.0, e a tabela só tem `resolverTema`.
     - No caso do RF24: a pessoa A também recolhe a lateral; o `sessionStorage` fica vazio; o valor é de conjunto fechado; o caso roda nos dois projetos.
   - **Correção:** acrescentar as linhas com esses oráculos. A tabela do documento é o que o Implementador segue ("Não improvise aqui").

Recomendações:
- **Mapa único de RF para teste:** `cenarios.md` cobre as asserções de hoje, mas não diz "RF → teste novo → tarefa". Uma parte D com isso, e com as bordas do PRD §7 apontadas para os specs que já as provam, fecha a conferência num lugar só. O `tasks.md:145` conta "23 requisitos", e o PRD tem 24.
- **`focoVisivel` no escuro:** precisa receber a cor esperada por tema (`#60B9F4` no escuro); a parte B só dá a do claro.
- **Primeiro quadro (`2_task`):** o script `type="module"` segura o `DOMContentLoaded`. O teste deve usar `waitUntil: 'commit'` e ler o fundo do `html`, que é onde a 1.0 o pôs, e não o do `body`.
- **RF24 no `celular`:** abaixo de 768 px não há como recolher a lateral, então o caso troca a largura. Vale também afirmar que nenhum cookie legível novo aparece.
- **Teste de arquitetura da onça:** escrever a lista exata. O `AvatarAgente` é o único que importa a `CabecaOnca`. A `AssinaturaIA` e a `Mensagem` são as únicas que importam o `AvatarAgente`; ficam de fora os `*.test.tsx`. Dizer se a galeria entra, e reprovar a re-exportação.
- **RF8:** o oráculo do "apertado não desloca" deve ser explícito (o `transform` calculado continua `none`). O teste do CSS precisa olhar também as propriedades dentro de `@keyframes`.
- **RF17:** o "teste de componente da lateral, por papel" não está na §10 nem na 12.3.
- **RF23:** o "cabe em 1366 × 768" só se prova pela foto da vitrine. Um e2e nas telas que tem barra presa resolveria.
- **Pares de foco a mais:** `foco` contra `realce` e `papel`; o hover do perigo (`vermelho-texto` sobre `fundo-suave`).
- **13.4:** declarar a mutação do fechamento da gaveta por troca de pessoa e de escola, como a rodada 1 pediu. Hoje ela está como cenário, sem a mutação.
- **Seletor:** uma asserção negativa de que a linha não mostra contagem nem turno (§6).
[… 8 linhas cortadas]

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-13 02:05:06 · `tasks/prd-pele-e-casca/revisao-spec.md`

VEREDITO: APROVADO
Tela vista: não (revisão de spec, ainda não existe tela; as fotos serão da validação)
Estados: ok (a Tech Spec e as tarefas de tela cobrem os quatro estados; sem mudança nesta rodada)
Acessibilidade: ok. O contraste do botão desligado está unificado e foi recalculado (abaixo).
Chromebook fraco: ok. Sem mudança nesta rodada: só CSS e transform, orçamento de bundle e ícones em `lucide` importados um a um.
Celular: ok. O botão `compacto` volta a 44 px abaixo de 768 px, em `docs/interface.md` 9.3 e 10.2.
Ação oficial protegida: sim. O oficial é `grafite` e o perigo cheio fica só dentro da confirmação (`3_task.md` 3.2, RF5).

**Correção exigida da rodada anterior: atendida.**

O texto do botão desligado é `apoio` sobre a face `borda` em todo documento:
- `techspec.md` §9 "Degrau" (linha 143) e §10, linha "Botão" (linha 197).
- `docs/interface.md` 9.1: desvio 2, a linha "desligado da D80" da tabela de pares e o parágrafo logo abaixo dela; 10.2, linha `Botao` (1337).
- `3_task.md` 3.2 (linha 37).
- `cenarios.md`: A4, A41, U10 e o item 1 de "O que ficou em aberto" (413), fechados em `apoio`.
- `tasks.md` 3.5.

O teste de unidade em `3_task.md` (linha 75) e na Tech Spec §10 resolve as classes reais de `classesDoBotao` em hex por tema (face e texto: ligado, hover, apertado e desligado) e exige 4,5:1. A mutação `disabled:text-sutil` no lugar de `disabled:text-apoio` está declarada, e ela fica vermelha no escuro (3,72:1). O desligado "de antes" (`tinta` sobre `inativo`, pelos `1_task.md` 92 e 127) passa nos dois temas, então a 1.0 não deixa buraco antes da 3.0.

**Contraste recalculado, claro e escuro (WCAG 2.1):**

| Par | Claro | Escuro |
|---|---|---|
| `apoio` sobre `borda` | 7,98 | 7,70 |
| `sutil` sobre `borda` (descartado) | 5,23 | 3,72 |
| `tinta` sobre `inativo` | 6,01 | 5,65 |
| `apoio` sobre `azul-claro` | 8,68 | 10,44 |
| `sutil` sobre `azul-claro` | 5,69 | 5,05 |
| `foco` sobre `fundo` | 5,47 | 7,80 |
| `foco` sobre `fundo-suave` | 5,10 | 6,40 |
| `foco` sobre `azul-claro` | 4,72 | 6,14 |
| `borda-campo` sobre `fundo` | 3,23 | 4,02 |
| `borda-campo` sobre `campo` | 3,23 | 3,30 |

As dez famílias (`texto` sobre chão, fundo suave e `claro`; `sobre-cor` sobre a face) ficam todas em 4,5:1 ou mais, o menor valor sendo 4,61 (vermelho, turquesa e anil sobre `claro`). Também passam `sobre-grafite` sobre `grafite`, `noite-alto` e `noite-baixo`, `sobre-cor` sobre `caramelo-fundo` (4,55 no escuro) e `caramelo-claro`, e `sobre-grafite` sobre `erro`.

A tabela tem 86 linhas, igual ao que `1_task.md:128` declara.

Bloqueantes: nenhum

Recomendações:
- `1_task.md:127` cita como fonte a linha "Texto sobre o desligado de hoje" da tabela de pares, mas a linha se chama "desligado de antes" (`docs/interface.md` 810). Ajustar o nome para o rastro não quebrar.
- O `8_task.md` ainda não existe. A Mesa deve conferir o item 8.4 do `tasks.md` (só `AssinaturaIA` e `Mensagem.tsx` importam o avatar e `componentes/onca/`) quando ele for escrito.
- `cenarios.md` A2 (linha 38) ainda cita "o desligado em inativo" no nome do caso antigo. É o nome do teste de hoje e fica correto, mas a 3.0 deve renomeá-lo junto com a troca para `apoio`.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-13 02:05:24 · `tasks/prd-pele-e-casca/revisao-spec.md`

VEREDITO: APROVADO

A correção exigida na 2ª rodada foi feita nas três frentes. Nada mais bloqueia.

**Conferência da correção exigida, item a item**

1. **A onça dormindo saiu da X1.** A linha do catálogo dos três de `estado/` mudou de lugar com as edições: era a 1340 e agora é a 1364 da `docs/interface.md` 10.2. Ela diz: "Sem onça na X1: a dormindo é da X2, com parecer (9.7)". Isso bate com a §7b da Tech Spec, com a tabela de poses da 9.7 (a dormindo é da X2, com parecer) e com o item 8.1 do `tasks.md` (só a cabeça). Feito.
2. **"(onça)" na lateral virou ícone.** O desenho da 11.1 está agora nas linhas 1453 a 1455 e mostra "[ícone] Assistente (3)" e "[ícone] Tutor". A 9.7 também diz isso nas linhas 973 e 974: o ícone da função num ladrilho, sem a onça. Feito.
3. **O teste de arquitetura cobre a pasta inteira.** A §10 da Tech Spec (camada Unidade, item "Arquitetura") e a §7b dizem: "só `ia/AssinaturaIA.tsx` e `ia/Mensagem.tsx` importam o avatar ou qualquer arquivo de `componentes/onca/`". A §7b acrescenta que isso cobre a onça de corpo inteiro. O 8.4 do `tasks.md` diz o mesmo e acrescenta que a seção da galeria usa a `AssinaturaIA`. Feito.

Também foram resolvidas três das quatro recomendações da rodada anterior. A quarta, a frase da D80 com as cores trocadas, está fora da spec e não foi conferida aqui.
- **Galeria:** usa a `AssinaturaIA`, sem exceção aberta no teste (§7b e 8.4).
- **Movimento:** o item 3 da 9.5 agora diz que os três pontos de "pensando" e o esqueleto ficam parados, sem `infinite`.
- **Botão desligado:** o texto é `apoio` em todo documento (§9 "Degrau", 10.2, cenários A4 e A41, item 1 de "O que ficou em aberto").

**A lista do que verificar, contra o desenho**

1. **Nota com autor humano:** não se aplica. A spec não cria tabela nem rota (§3 e §4).
2. **Decisão sobre o aluno:** não se aplica. Nenhuma função de IA muda (§7b, PRD 8b).
3. **Aprovação registrada:** os fluxos de aprovação não mudam. A linha de quem aprovou e o botão `oficial` continuam (10.2; regra 50, item 8). A exceção do tutor não se estende a outro agente.
4. **Tutor supervisionado:** a faixa permanente que não fecha (D8) continua (`Faixa`, 10.2; tarefa 10.2 "faixa de supervisão presa").
5. **Autonomia declarada:** não muda.
6. **Auditoria:** não muda.
7. **Supervisão sem vigilância:** o avatar não reage a presença, ausência, acerto nem tempo de uso (§7b). A 10.3 continua proibindo seletor de humor e histórico de comportamento.
8. **Sem nota em discursiva e redação (D55):** nenhum campo, tela ou prompt sugere nota. A 10.3 proíbe comemoração de nota e de acerto.
9. **Medir o professor (D45, D64):** não se aplica. A 10.3 mantém a proibição de ranking de professor.
- **Item 4a (D58):** a onça só aparece com o nome da função e o selo "IA" no mesmo bloco. Isso é garantido por estrutura (§7b), com o e2e de `[data-assinatura]` e a mutação declarada (§10, E2E). "onça" nunca é nome acessível de um agente, e isso é testado (§10, Componente).

---

Caminhos de escrita em Nota: nenhum (a spec não toca o servidor) — todos com autor humano? sim (nenhum novo)
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok (os fluxos não mudam; a linha de aprovação e o `oficial` continuam)
Supervisão do tutor: ok (a faixa permanente da D8 continua, e o teste a prende)
Autonomia declarada e visível: sim (não muda nesta spec)
Bloqueantes: nenhum

Recomendações:
- **A regra do teste de arquitetura falha contra o próprio avatar.** Como está escrita na Tech Spec §10 e no 8.4 ("só `AssinaturaIA` e `Mensagem.tsx` importam o avatar ou qualquer arquivo de `componentes/onca/`"), ela reprovaria o `ia/AvatarAgente.tsx`, que precisa importar `onca/CabecaOnca`. A redação que eu exigi na rodada anterior tinha o mesmo furo. O certo é escrever a cadeia fechada: `onca/` só é importado por `AvatarAgente` e por arquivos de dentro de `onca/`, e `AvatarAgente` só é importado por `AssinaturaIA` e `Mensagem`. Assim o implementador não abre uma lista de exceções.
- **O PRD e a 9.7 descrevem um teste mais estreito que o da Tech Spec.** O RF10 do PRD diz "só essas peças importam a cabeça", e a `docs/interface.md` 9.7, nas linhas 972 e 973, diz "um teste reprova outro arquivo que importe a cabeça". Os dois deveriam dizer "qualquer arquivo de `componentes/onca/`", como a §10.
- **A contagem de `svg` do avatar (cenários A28, item 11 de "O que ficou em aberto")** fecha na 8.0. Vale escrever que a cabeça não leva `<title>` nem `<desc>`, como a §10 (camada Componente) já exige.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/techspec.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/prd.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/tasks.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/cenarios.md
- /home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/docs/interface.md

## infra-guardian · 2ª rodada · APROVADO · 2026-10-13 02:05:34 · `tasks/prd-pele-e-casca/revisao-spec.md`

VEREDITO: APROVADO

Caminho quente tocado: nenhum. No servidor não há nada novo. No cliente, o risco é o primeiro carregamento de todos às 7h30, coberto pela Tech Spec, seção 7c.

Rate limit: ok. Não se aplica: nenhuma rota nova (7c).

Fila e prioridade: ok. Não se aplica: nenhum job (7c).

Concorrência: protegida. No servidor não há nada. Com duas abas, vence a última, e as duas se igualam pelo `storage` (7c). O e2e "duas abas do mesmo contexto" prova isso (§10).

Índice e paginação: ok. Não se aplica: nenhuma tabela nem consulta nova (seções 3 e 6).

Degradação de IA: não se aplica.

Migration: não se aplica.

Métrica e alerta: ok. Os tetos ficam no `.size-limit.json` e em `apps/web/nome-dos-chunks.test.ts`. A entrada e o CSS são medidos em brotli antes e depois de cada tarefa que os toca (7c).

**A correção exigida na 2ª rodada, item por item:**
- **§12 da Tech Spec:** foi feita. A primeira premissa agora diz "o `.svg` do build, com hash e teto próprio (seção 7c)". Não sobrou nenhuma menção a `public/` na Tech Spec.
- **`docs/interface.md` 9.4:** foi feita (linhas 908–911). Diz `.svg` gerado pelo build, importado por URL, com hash no nome, e "Nunca um arquivo de `public/`, que não tem hash nem entra em medição".
- **Os 4 kB, iguais nos três textos:** foi feita. A 7c, a 9.4 e a 10.4 dizem a mesma coisa: os ícones de lugar somam até 4 kB, em brotli, na entrada.
- **O teto próprio, com número e caminho:** foi feita. A 7c traz `apps/web/dist/assets/lugares-*.svg`, 6 kB em brotli, e a 9.4 repete o número.
- **O caso que reprova esse teto:** foi feita. A 7c manda pôr o caso em `tools/ci/tamanho-web.test.ts`. Como o teto só nasce se o `.svg` sair da entrada, o caso entra junto com ele. Isso é coerente com o primeiro teste desse arquivo, que exige a lista exata de tetos.

**Recomendações da rodada anterior que fecharam:**
- "127 de 150 kB" agora diz que é o primeiro carregamento inteiro (7c e 10.4).
- O plano para quando estourar existe: sai primeiro o seletor de escola, por `import()` (7c).
- O RF22 bate com a 10.4.
- A exceção de hex: a §10 nomeia a onça como única exceção e diz que o ícone ilustrado lê token, o que bate com "nenhum hex" da 9.4.
- A lista que liga cada agente ao seu ícone em "Seu time" está na `docs/interface.md` 9.7, linha 973.

Bloqueantes: nenhum.

Recomendações:
- `tasks/prd-pele-e-casca/9_task.md`, 9.3: escrever nela mesma o que fazer se passar de 4 kB, em vez de "teto novo no `.size-limit.json`": `lugares-*.svg` com 6 kB em brotli, o caso em `tools/ci/tamanho-web.test.ts` e o cuidado de que o teto só entra junto com o asset. É que o size-limit reprova quando o caminho não acha nenhum arquivo. Pôr o mesmo no item 9.3 do `tasks.md`.
- Os 4 kB valem para os 12 ícones de lugar, e a X1 só mede quatro. As specs X2 a X4, que trazem os outros, precisam medir de novo. Vale uma linha na 10.4 ou no Estado.
- O CSS continua sem teto em brotli: hoje só é medido antes e depois (`tasks.md` 1.5). Fica para o `/validar`.
- O cache longo do asset com hash depende do `Caddyfile` e do staging. Registrar em `notas-staging.md`, que ainda não existe na pasta da spec.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/techspec.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/docs/interface.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/9_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/tasks.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/.size-limit.json`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tools/ci/tamanho-web.test.ts`

## test-engineer · 2ª rodada · REPROVADO · 2026-10-13 02:06:13 · `tasks/prd-pele-e-casca/revisao-spec.md`

VEREDITO: REPROVADO

Cenários exigidos: as seis correções da rodada 2. São elas: o desligado em `apoio`, com o teste das classes reais e a mutação. Os pares que faltavam e o `foco` corrigido. A guarda de `bg-grafite` e `bg-noite` (RF6). O bloco do avatar, com a mutação, e o teste de nome acessível da onça. O RF22 coerente com a 7c e a 10.4. A tabela de testes da `2_task.md`, com o script do `index.html` e o RF24 completo.

Cobertos:
1. **Desligado: atendido.** Agora é `apoio` em todos os lugares: Tech Spec §9 "Degrau", `3_task.md` 3.2, `docs/interface.md` 704 (desvio 2), 809 a 813 e 1337 (10.2). No `cenarios.md`, A4, A41 e o item 1 de "O que ficou em aberto" estão fechados em `apoio`. A linha "Botão" da §10 e a `3_task.md` exigem o teste das classes reais de `classesDoBotao` (ligado, hover, apertado e desligado, por tema), com a mutação `disabled:text-sutil` declarada. Conferi a conta: `apoio` sobre `borda` dá cerca de 8,0:1 no claro e 7,7:1 no escuro. O `sutil` fica abaixo de 4,5:1 no escuro, então a mutação fica vermelha.
2. **Pares: atendido.** A tabela tem 86 linhas e `PARES_DA_TABELA = 86` em `apps/web/src/contraste.test.ts:20`. Entraram:
   - o `<família>-texto` sobre `fundo` e `fundo-suave` das oito famílias;
   - `ok` e `pendente` sobre `fundo`;
   - `sobre-grafite` sobre `noite-baixo`;
   - `apoio` e `sutil` sobre `azul-claro`.
   
   O `foco` está em 5,5:1 e 7,8:1 (9.1, linha 628). Refiz a conta e confere.
3. **RF6: atendido.** A guarda da §10 e a `3_task.md` aceitam a face só numa lista fechada que só encolhe: as constantes do oficial mais os quatro usos, cada um com justificativa e com a tarefa ou spec que o tira. Arquivo novo com a classe reprova.
4. **RF10: atendido na Tech Spec.**
   - (a) O e2e define o bloco como o `[data-assinatura]` mais próximo, com exatamente um `[data-agente]`, o nome da função visível e um `[data-selo-ia]`. A mutação de tirar o `SeloIA` está declarada.
   - (b) O teste de componente afirma `aria-hidden="true"`, o SVG sem `<title>` nem `<desc>`, e nenhum nome acessível casando `/onça/i`.
5. **RF22: atendido.** O PRD exclui por escrito a entrada, que é comum a todos. Isso bate com a 7c, com a linha "Entrada" da 10.4 (1426) e com a 1433.
6. **`2_task.md`: atendido em parte.** A linha 73 (o script extraído e rodado com a tabela inteira, incluindo a leitura que lança e o caso sem `matchMedia`) está como foi pedida. A linha 80 tem um oráculo errado, descrito abaixo.

Bloqueantes:
- **`2_task.md`, linha 80 (RF24): o valor da lateral recolhida está errado.** A tabela exige `educa.lateral-recolhida` com valor do conjunto `1`. O código grava `'sim'` (`apps/web/src/componentes/CascaDaEscola.tsx:53` e `:61`), e a Tech Spec diz a mesma coisa: §7 "`educa.lateral-recolhida` (`sim`)" e §5 "a chave não muda". Escrito como está, o teste fica vermelho pelo motivo errado. Ou então empurra o Implementador a mudar o valor gravado, contra a Tech Spec. A tabela é o que ele segue ("Não improvise aqui"). **Correção:** trocar `` `1` `` por `` `sim` `` na linha 80.

Recomendações:
- **RF24 no projeto `celular`.** Abaixo de 768 px não há como recolher a lateral. Esse passo pede `setViewportSize` de 1024 ou mais antes de recolher, senão a linha 80 não executa naquele projeto. Isso já veio da rodada 2.
- **`vermelho-texto` sobre `fundo-suave`.** A §10 diz "o `texto` de cada família… sobre o fundo suave", mas a tabela só tem o vermelho sobre `fundo`. O hover do perigo fica coberto pelo teste das classes do botão. O item perigoso do `Menu` (10.2, 1339) não fica. Sugiro acrescentar a linha, que passaria a 87.
- **Avatar na `8_task.md`, que ainda está sendo escrita.** O 8.4 do `tasks.md` resume sem estas partes da §10:
  - a definição do `[data-assinatura]` e a mutação do `SeloIA`;
  - o `<desc>` no SVG;
  - o `/onça/i` em toda a tela.
  
  O rascunho tem o `aria-hidden`, e a 8.0 precisa levar tudo isso. Senão o RF10 volta a ficar sem teste na revisão da tarefa (regra 70, item 4a, que tem veto).
- **Guarda de `bg-grafite` e `bg-noite`.** Declarar na 3.0 a mutação "um arquivo novo com `bg-noite` como face fica vermelho". Dizer também como "só encolhe" se prova: lista literal no teste, com tamanho fixo.
- **Teste de contraste das classes do botão.** Dizer qual é a face do `discreto`, que é transparente: resolver contra `fundo` e contra `fundo-suave`, o hover dele.
- **Restos da rodada 2 que continuam abertos:**
  - a cor do `focoVisivel` por tema;
  - `waitUntil: 'commit'` e o fundo lido do `html`;
  - o oráculo `transform: none` do movimento reduzido;
  - o teste da lateral por papel (RF17);
  - a negativa de contagem e turno no seletor;
  - a mutação do fechamento da gaveta (13.4).

Arquivos lidos: `tasks/prd-pele-e-casca/techspec.md`, `prd.md`, `2_task.md`, `3_task.md`, `tasks.md`, `cenarios.md` e `revisao-spec.md`; `docs/interface.md` (9.1 a 9.7, 10.2 a 10.4, 11.1); `apps/web/src/contraste.test.ts`; `apps/web/src/componentes/CascaDaEscola.tsx`. Todos os caminhos ficam sob `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/`.

## test-engineer · 3ª rodada · APROVADO · 2026-10-13 02:09:02 · `tasks/prd-pele-e-casca/revisao-spec.md`

VEREDITO: APROVADO

Esta é a 4ª rodada. Conferi a correção exigida, o código que ela cita e a coerência do resto da tabela. O que não mudou eu não reauditei.

**Cenários exigidos:** os da tabela "Testes que provam a regra" do `2_task.md`, que fecharam como completos na rodada 3. Esta rodada pedia só que o oráculo do RF24 batesse com o valor que o código grava e com a Tech Spec.

**Cobertos:**
- **A correção exigida foi feita.** A linha 80 do `2_task.md` agora diz que os valores são `claro` ou `escuro` para `educa.aparencia` e `sim` para `educa.lateral-recolhida`.
- **O código grava `'sim'`.** Está em `apps/web/src/componentes/CascaDaEscola.tsx:61`, e a leitura compara com `'sim'` na `:53`. A chave é `'educa.lateral-recolhida'` (`:49`). Bate com a seção 7 da Tech Spec ("`educa.lateral-recolhida` (`sim`)") e com a seção 5 ("a chave não muda").
- **O resto da tabela não ficou incoerente.**
  - A pessoa A escolhe Escuro, então `educa.aparencia` existe com `escuro`, e a frase "exatamente as duas chaves" vale.
  - A linha 76 ("voltar a Sistema esvazia o armazenamento") é outro cenário, sem lateral recolhida, então não conflita.
  - A linha 77 continua valendo, porque a chave da lateral é apagada no valor padrão (`guardarRecolhida`).
  - O `sessionStorage` vazio está de acordo com a Tech Spec, seção 7.
  - O que foi acrescentado na rodada 3 (`setViewportSize` de 1024 px no `celular`) cai na faixa larga do código. A consulta é `CONSULTA_LARGA = '(min-width: 1024px)'` (`CascaDaEscola.tsx:29`), e o limite é inclusivo, então a lateral pode ser recolhida a 1024 px. O cenário chega à cláusula e não fica vermelho pelo motivo errado.
- **As recomendações aplicadas da rodada 3 não criaram bloqueante novo** no que eu conferi: o RF24 no `celular` e a tabela do `2_task.md`. Os outros itens foram aplicados em arquivos que não li nesta rodada.

**Bloqueantes:** nenhum.

**Recomendações:**
- O parêntese da linha 80 do `2_task.md` diz "abaixo de 768 não há o que recolher". Pelo código, entre 768 e 1023 px também não há botão de recolher: só o trilho, que abre a lateral por cima (`CascaDaEscola.tsx:20` e `:365`). O certo é "abaixo de 1024". O passo prescrito (1024 px) já está certo; o erro é só no texto, mas ele pode induzir alguém a "economizar" usando 800 px.
- No RF24, vale fazer a asserção dos valores por igualdade exata com `{ 'educa.aparencia': 'escuro', 'educa.lateral-recolhida': 'sim' }`, e não só por pertencer ao conjunto fechado. Assim o teste também prova que a escolha da pessoa A ficou gravada como foi feita.

**Arquivos lidos:**
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/2_task.md`
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/apps/web/src/componentes/CascaDaEscola.tsx` (linhas 20–61, 235–366)
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/techspec.md` (seções 5, 7 e a linha E2E da seção de testes)
- `/home/joaquimdp/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca/tasks/prd-pele-e-casca/prd.md` (RF24)
