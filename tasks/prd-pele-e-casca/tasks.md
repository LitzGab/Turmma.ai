# Tarefas — Pele e casca

**PRD:** `prd.md` · **Tech Spec:** `techspec.md` · **Cenários:** `cenarios.md` · **Mockup:** `mockup.md` (inventário do sistema de design)
<!-- Quantas estão concluídas não se escreve aqui: `node tools/processo/estado.ts` conta pela lista. -->

São 15, acima da mira de 12, porque uma peça revestida muda a tela de todo mundo e cada grupo de peças tem
revisão própria. As tarefas 4.0 a 10.0 não se tocam e correm em linhas; o corte possível, se a spec precisar
pousar em duas, é 1.0 a 10.0 (a pele) e 11.0 a 15.0 (a página e as cascas).

## Lista

- [x] **1.0 — Os tokens da D80 existem no claro e no escuro, e nenhuma tela perde cor**
  - [x] 1.1 `estilos.css`: o bloco claro e o bloco `:root[data-tema='escuro']`, iguais aos da 9.10 do `docs/interface.md`; `veu` no fundo do diálogo; a seleção de texto
  - [x] 1.2 `docs/interface.md`: a 9.10 passa a ser a fonte, e o bloco antigo da 9.9 sai
  - [x] 1.3 Os 13 usos de `text-white` e `bg-white` trocados por `sobre-grafite`, `sobre-cor` e `superficie`
  - [x] 1.4 A guarda de cor: nomes novos; `white` e `black` só em lista fechada; a variante `dark:`; o texto que não acompanha a face forte; a cor escrita à mão em qualquer lugar do arquivo e a cor pelo nome entre aspas
  - [x] 1.5 Testes: os dois blocos iguais aos do documento, com o mesmo conjunto de nomes; o contraste de cada linha da tabela de pares, nos dois temas; o CSS servido nos dois temas; a medida do CSS em brotli, antes e depois

- [x] **2.0 — A pessoa escolhe a aparência, e ela vale antes de a primeira tela desenhar**
  - [x] 2.1 O script do `index.html`, o `meta color-scheme` e `src/tema.ts` (`resolverTema`, `useAparencia`)
  - [x] 2.2 As peças `Segmentado` e `Aparencia`; a `Aparencia` em "Sua conta", na barra de topo da operação e na galeria
  - [x] 2.3 A galeria vira `galeria/secoes/*.tsx` e o `e2e/pecas.spec.ts` vira um arquivo por grupo, sem mudar asserção
  - [x] 2.4 `playwright.config.ts` fixa o tema claro; a vitrine fotografa também no escuro; a linha do `TODO.md` sobre o script em linha
  - [x] 2.5 Testes: o tema no primeiro quadro; o script do `index.html` igual a `resolverTema`; Sistema acompanha o aparelho e apaga a chave; o conteúdo exato do armazenamento com duas pessoas no mesmo navegador (RF24); duas abas; o escuro nas telas de verdade, por papel, com axe

- [x] **3.0 — O botão ganha o degrau e os seis desenhos da D80, em todo o produto**
  - [x] 3.1 `estilos.css`: a tipografia `t-*`, o degrau, o anel de foco e a regra de movimento reduzido
  - [x] 3.2 `botao-secundario.ts` e `Botao.tsx`: primário, oficial, secundário, discreto, perigo e perigo cheio; o desligado
  - [x] 3.3 `focoVisivel`, em `e2e/__fixtures__/verificacoes.ts`, passa a exigir o contorno de 3 px na cor `foco`
  - [x] 3.4 Os specs que afirmam a cor e a medida do botão e do foco (`cenarios.md`, parte A)
  - [x] 3.5 O teto de `pecas-*` sobe de 26 para 40 kB (`.size-limit.json` e `tools/ci/tamanho-web.test.ts`), no tronco, antes das linhas
  - [x] 3.6 Testes: o oficial não se parece com nenhum outro, pela cor resolvida em cada tema; desligado legível; 44 px; apertado sem hover; movimento reduzido

- [x] **4.0 — Os campos na pele nova, com busca, interruptor e opção**
  - [x] 4.1 `Campo`, `CampoDeSenha`, `CampoLongo`, `Selecao` e `seletor.ts`: borda de 2 px em `borda-campo`, fundo `campo`, anel no foco
  - [x] 4.2 As peças novas `Busca`, `Interruptor` e `Opcao`
  - [x] 4.3 Testes: rótulo, dica e erro ligados ao campo; teclado; foco; alvo de toque; contraste da borda

- [x] **5.0 — Cartão, linha clicável, tabela e número na pele nova**
  - [x] 5.1 `Cartao`, `Tabela`, `NumeroPainel`, `BarraRotulada` e `BarraPresa` revestidos
  - [x] 5.2 A peça nova `Linha`: a linha inteira é o alvo, com chevron
  - [x] 5.3 Testes: a tabela ainda vira lista a 360 px; a barra de acerto continua neutra; a linha é um alvo só

- [x] **6.0 — Selo, contador, aviso e abas dizem o estado sem depender da cor**
  - [x] 6.1 `Estado`, `Faixa`, `Abas` e os três de `estado/` revestidos
  - [x] 6.2 As peças novas `Aviso`, `Contador` e `Toque`
  - [x] 6.3 Testes: texto ou ícone em todo estado; abas pelo teclado; o vazio, o carregando e o erro nos dois temas

- [x] **7.0 — Diálogo, confirmação, menu e painel ao lado na pele nova**
  - [x] 7.1 `Dialogo`, `DialogoDeConfirmacao`, `dialogos.tsx`, `copia-unica.tsx`, `DialogoDoConvite.tsx`, `Menu` e `LoginPorCima` revestidos
  - [x] 7.2 A peça nova `PainelLado`: 480 px ao lado e folha de baixo no celular, sobre `<dialog>`
  - [x] 7.3 Testes, no navegador: foco preso e devolvido; Esc; os dois botões da confirmação do mesmo tamanho; perigo cheio só na confirmação

- [x] **8.0 — A onça é o avatar dos três agentes, sempre com a função e o selo**
  - [ ] 8.1 `componentes/onca/CabecaOnca.tsx`: um desenho, expressão neutra, parado; só a cabeça (a onça inteira não entra na X1)
  - [ ] 8.2 `ia/AvatarAgente` com a cabeça e o anel do agente; `SeloIA` e `AssinaturaIA` na pele nova; `Agentes.tsx` e `Analista.tsx` passam à `AssinaturaIA`
  - [ ] 8.3 `docs/interface.md` 9.7 e 10.3, `docs/aia/tutor.md` e os comentários "nunca rosto"
  - [ ] 8.4 Testes: função e selo "IA" no mesmo bloco, em toda tela que desenha o avatar; dois renders iguais; nenhum temporizador nem animação; a cadeia fechada de importação (`componentes/onca/` só é importado por `AvatarAgente` e por arquivo da própria pasta; `AvatarAgente`, só por `AssinaturaIA` e `ia/Mensagem.tsx`; a seção da galeria usa a `AssinaturaIA`); o bloco `[data-assinatura]` com um `[data-agente]`, a função e um `[data-selo-ia]`, com a mutação de tirar o `SeloIA`; a onça `aria-hidden`, sem `<title>` nem `<desc>`, e nenhum nome acessível da tela casando `/onça/i`

- [x] **9.0 — Os ícones ilustrados dos lugares e o ladrilho**
  - [x] 9.1 `componentes/icones/lugares.tsx` e a peça `Icone`
  - [x] 9.2 A peça `Ladrilho`, para ícone ilustrado e para `lucide`
  - [x] 9.3 A medição da entrada em brotli e a decisão da Tech Spec, seção 7c: os ícones de lugar somam até 4 kB em brotli na entrada; acima disso saem para `lugares-*.svg`, com hash, teto de 6 kB em brotli no `.size-limit.json` e o caso que o reprova em `tools/ci/tamanho-web.test.ts`
  - [x] 9.4 Testes: nome acessível quando o ícone está sozinho; `aria-hidden` ao lado de rótulo; os dois temas; nenhuma cor fora dos tokens além da exceção nomeada

- [x] **10.0 — As peças da conversa com IA na pele nova**
  - [x] 10.1 `CaixaPedido`, `Mensagem`, `Escolha`, `ChipFonte`, `Fontes`, `MotorFormulario`, `AvisoFila`, `LinhaAprovacao`, `PaginaMini` e `TextoDaIA` revestidos
  - [x] 10.2 Testes: as duas opções da `Escolha` iguais; "preparando a resposta" sem laço; a pausa do Tutor e o assunto delicado calmos, sem vermelho; a faixa de supervisão presa

- [x] **11.0 — Toda tela aberta pela lateral mostra o título**
  - [x] 11.1 `Tela`: título visível, cabeçalho de 64 px e as larguras novas
  - [x] 11.2 `Estrutura`, `ListaDaTurma`, `Professores`, `Turmas`, `Turma` e `MinhaTurma` passam a usar a `Tela`, sem mudar o miolo
  - [x] 11.3 Testes: o `h1` de cada tela com o mesmo texto e a caixa medida (visível, e não só para leitor de tela), nos quatro estados; o título da aba do navegador

- [x] **12.0 — A casca da escola no computador: lateral, trilho e menu da pessoa**
  - [x] 12.1 `CascaDaEscola`, `itens-da-lateral`, `MenuDaPessoa` e `SeletorDeEscola` nas medidas da D80; a moldura de 1200 no `<main>`
  - [x] 12.2 `navegacao.ts`: "Nova conversa" vira "Início" (rótulo, `h1` e título da aba); o ícone de cada item; "Seu time" com o ícone da função num ladrilho
  - [x] 12.3 Testes: os nomes acessíveis não mudaram; aceso com `aria-current`; "Sair" visível sem abrir nada, do tamanho do vizinho, com "Meus dados" antes; a lateral recolhida lembrada, também com o armazenamento recusando; a mutação de `lembrarQuemEsta` (a da troca de escola, `usuarioDaSessao`, fica para a 13.0: ver `12_task.md`, "Mutações")

- [x] **13.0 — A casca da escola no celular: barra de topo, barra de baixo e gaveta**
  - [x] 13.1 A barra de topo de 56 px, com a escola ativa e "Sair", e a barra de baixo de 68 px, para o papel com até quatro itens
  - [x] 13.2 A gaveta com o resto; com mais de quatro itens, os itens continuam nela
  - [x] 13.3 `e2e/__fixtures__/casca.ts`: onde ficam os itens no celular (`cenarios.md`, parte B)
  - [x] 13.4 Testes: quatro itens na barra e cinco na gaveta; a 360 px nada rola de lado, com nome de escola comprido; o alvo de 44 px; o último botão da tela acima da barra; a gaveta fecha ao trocar de rota, de pessoa e de escola

- [ ] **14.0 — A entrada e as páginas públicas na moldura nova**
  - [ ] 14.1 `CascaPublica`: o painel com a pinta a partir de 1024 px, empilhado abaixo
  - [ ] 14.2 As páginas de `paginas/` na moldura, sem mudar texto, ordem de campo nem resposta
  - [ ] 14.3 Testes: os e2e de entrada, segundo fator, convite e página da turma, sem trocar asserção de regra; as mesmas mensagens para erro de entrada

- [ ] **15.0 — A operação na pele nova**
  - [ ] 15.1 `CascaDaOperacao` com a barra de topo clara; as páginas de entrada da operação
  - [ ] 15.2 Testes: a marca "Operação Turmma" à vista em toda tela; "Sair" visível; o anel de foco sobre a barra; os e2e da operação

## Dependências e paralelismo

| Tarefa | Depende de | Pode correr em paralelo com |
|---|---|---|
| 1.0 | — | — |
| 2.0 | 1.0 | — |
| 3.0 | 2.0 | — |
| 4.0 | 3.0 | 5.0, 6.0, 7.0, 8.0, 9.0, 10.0 |
| 5.0 | 3.0 | 4.0, 6.0, 7.0, 8.0, 9.0, 10.0 |
| 6.0 | 3.0 | 4.0, 5.0, 7.0, 8.0, 9.0, 10.0 |
| 7.0 | 3.0 | 4.0, 5.0, 6.0, 8.0, 9.0, 10.0 |
| 8.0 | 3.0 | 4.0, 5.0, 6.0, 7.0, 9.0 |
| 9.0 | 3.0 | 4.0, 5.0, 6.0, 7.0, 8.0, 10.0 |
| 10.0 | 3.0, 8.0 | 4.0, 5.0, 6.0, 7.0, 9.0 |
| 11.0 | 5.0, 6.0 | 14.0, 15.0 |
| 12.0 | 7.0, 9.0, 11.0 | 14.0, 15.0 |
| 13.0 | 12.0 | 14.0, 15.0 |
| 14.0 | 4.0, 6.0 | 11.0, 12.0, 13.0, 15.0 |
| 15.0 | 4.0, 6.0 | 11.0, 12.0, 13.0, 14.0 |

## Subagentes por tarefa

| Tarefa | Subagentes obrigatórios |
|---|---|
| 1.0 | `frontend-reviewer` |
| 2.0 | `frontend-reviewer`, `privacy-guardian` |
| 3.0 | `frontend-reviewer`, `conformidade-reviewer` |
| 4.0 | `frontend-reviewer` |
| 5.0 | `frontend-reviewer` |
| 6.0 | `frontend-reviewer` |
| 7.0 | `frontend-reviewer`, `infra-guardian` |
| 8.0 | `frontend-reviewer`, `conformidade-reviewer` |
| 9.0 | `frontend-reviewer`, `infra-guardian` |
| 10.0 | `frontend-reviewer`, `conformidade-reviewer` |
| 11.0 | `frontend-reviewer` |
| 12.0 | `frontend-reviewer`, `tenancy-guardian`, `privacy-guardian` |
| 13.0 | `frontend-reviewer`, `tenancy-guardian` |
| 14.0 | `frontend-reviewer`, `infra-guardian`, `privacy-guardian` |
| 15.0 | `frontend-reviewer`, `infra-guardian` |

`test-engineer` e `revisor-geral` valem em todas, marcados ou não.

## Critério de pronto da funcionalidade

Do `ROADMAP.md`, X1: toda tela do `apps/web` aparece na pele nova, no claro e no escuro, sem cor fora dos tokens,
sem `oklch(` nem `color-mix(` no CSS servido e com o contraste de cada par de texto conferido por teste; a pessoa
escolhe a aparência e a escolha vale na próxima visita, sem a tela piscar; cada papel navega pela lateral nova e, no
celular, pela barra de baixo quando os itens cabem nela; nenhum endereço muda; "Sair" está a um clique em toda
tela; o primeiro carregamento continua dentro do teto; e o e2e inteiro que existia continua verde, nos projetos
`chromebook` e `celular`.

Em detalhe: os 24 requisitos do PRD têm teste apontado na tarefa que os entrega; o número de casos do e2e não
diminui; o `.size-limit.json` e o teste do build passam com os tetos da Tech Spec, seção 7c; a galeria mostra cada
peça da seção 9 nos dois temas; e o `docs/interface.md`, Parte B, descreve o que foi construído.
