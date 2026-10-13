# Tech Spec — Pele e casca

**PRD:** `tasks/prd-pele-e-casca/prd.md`
**Status:** revisada pelos guardiões em 13/10/2026 (rodada 4, `revisao-spec.md`) e aprovada por delegação do Joaquim; ele revê ao ler
**Tamanho:** acima do teto de 2.000 palavras, com aceite por delegação do Joaquim (12/10/2026). Motivo: a revisão
dos guardiões exigiu por escrito as condições da onça (7b), a lista fechada do navegador (7), o que mora na entrada
(7c) e a estratégia de testes (10). As tabelas longas ficaram no `docs/interface.md` e em `cenarios.md`

## 1. Resumo da abordagem

Só `apps/web`, `e2e/` e documento. A pele entra **por baixo das telas**: os tokens de `estilos.css` ganham os
valores e os nomes da D80, com um segundo bloco para o escuro; as peças de `componentes/` mudam de desenho sem
mudar de props; e a casca é reescrita mantendo os nomes acessíveis que o e2e usa. Nenhuma tela é recomposta, nenhum
endereço muda e nenhum item é reagrupado (X2 a X4). O código do mockup não é copiado: as medidas estão no
`docs/interface.md`, Parte B, e o inventário dele, em `mockup.md`, nesta pasta.

## 2. Módulos afetados

| Módulo | Novo ou alterado | O quê |
|---|---|---|
| `apps/web/src/estilos.css` | alterado | tokens claro e escuro, tipografia `t-*`, degrau, foco, movimento |
| `apps/web/index.html`, `src/tema.ts` | novo | o tema antes do React, e a escolha da pessoa |
| `apps/web/src/componentes/`, `componentes/ia/` | alterado e novo | peças revestidas e novas (seção 9) |
| `apps/web/src/componentes/onca/`, `icones/` | novo | a onça e os ícones ilustrados dos lugares |
| `CascaDaEscola.tsx` e vizinhos, `CascaPublica.tsx`, `operacao/componentes/` | alterado | as três cascas |
| `apps/web/src/galeria/` | alterado | uma seção por arquivo, nos dois temas |
| `e2e/`, testes da web, `docs/interface.md` | alterado | o que afirmava cor, medida e avatar; o bloco de tokens que os testes leem |

## 3. Modelo de dados

Nenhuma tabela.

## 4. API

Nenhuma rota.

## 5. Fluxo

**O tema.** Um `<script>` em linha no `<head>` do `index.html` lê `localStorage['educa.aparencia']` dentro de
`try/catch`, cai no `prefers-color-scheme` e escreve `data-tema` no `<html>`, antes de o CSS pintar;
`<meta name="color-scheme" content="light dark">` cobre o intervalo sem CSS; e, com o CSS, `:root[data-tema='claro']`
declara `color-scheme: light` (e o bloco do escuro, `dark`), para o Claro escolhido sobre um aparelho escuro não deixar
o documento escuro (barra de rolagem, controle nativo). O script só escreve `claro` ou
`escuro`, nunca o texto lido: valor desconhecido é Sistema. `src/tema.ts` repete a conta em função pura
(`resolverTema`), ouve a mudança do sistema e o evento `storage`, e expõe `useAparencia()`. **Só a escolha explícita
grava**, e grava só `claro` ou `escuro`; voltar a Sistema apaga a chave. Leitura ou gravação que lança cai em
Sistema, calada.

**A casca.** As três faixas de hoje continuam decididas em JavaScript, para existir uma navegação por vez no DOM:
abaixo de 768 px, barra de topo e, com até quatro itens, barra de baixo; de 768 a 1023, trilho; a partir de 1024,
lateral aberta, que recolhe por escolha (a chave `educa.lateral-recolhida` não muda). Com mais de quatro (a
coordenação, até a X2), os itens continuam na gaveta.

## 6. Isolamento (obrigatório)

Nenhuma consulta nova. O descarte do cache na troca de escola e de pessoa mora em `api/sessao.ts`
(`guardarToken`, `limparDadosDaEscola`) e em `main.tsx` (`resetQueries`), que **não são tocados**. Na casca
reescrita têm de sobreviver, com o teste que os prova: `lembrarQuemEsta` (outra pessoa na mesma aba volta ao
início; `inatividade`), `useInatividade`, e a gaveta que fecha por troca de pessoa e de escola, e não só de rota
(`areas`). No seletor: uma troca por vez e o aviso igual para escola que não existe (`troca-de-escola`,
`escola-e-vinculos`). Continuam sem perder asserção também `acesso-suspenso`, `privacidade`, `meus-dados` e
`minha-turma`, nos casos de segunda pessoa. Cada linha do seletor mostra escola, rede e papel, de `/v1/eu`, sem
turno nem contagem de turmas (o mockup mostra; aqui não); quem vê o seletor é quem tem mais de um acesso.

## 7. Dado pessoal (obrigatório)

| Item | Resposta |
|---|---|
| Campos pessoais tocados, novos campos | nenhum |
| Log, auditoria, envio a provedor externo | nada novo |
| Retenção, autorização por objeto, DTO de saída | inalterados |

**O que o navegador pode guardar é lista fechada:** `educa.aparencia` (`claro` ou `escuro`) e
`educa.lateral-recolhida` (`sim`). Nenhuma chave leva pessoa, escola, papel nem identificador, e nada vai para o
`sessionStorage`. A aparência é do aparelho: fica para o próximo aluno do mesmo computador, e nada mais fica. A
lista entra no `docs/interface.md`, seção 6, e é o portão da X3 e da X4.

## 7b. Conformidade CNE (quando há IA no caminho do aluno)

Nenhuma função muda. A onça entra como avatar em **dois lugares, e só neles**: `AssinaturaIA` e o balão de
`MensagemIA`, que desenham a cabeça (`CabecaOnca`) num círculo com o anel do agente (Assistente azul, Tutor laranja,
Analista anil) **junto do nome da função e do selo "IA", no mesmo bloco**. `Analista.tsx` e `Agentes.tsx`, que hoje
põem o avatar com o nome e sem o selo, passam à `AssinaturaIA`. Um teste de arquitetura reprova qualquer outro
arquivo que importe o avatar, e a cadeia é fechada: **`componentes/onca/` só é importado por `AvatarAgente` e por
arquivo da própria pasta** (a pasta inteira: cobre a onça de corpo inteiro, que não entra na X1), e `AvatarAgente`,
só por `AssinaturaIA` e `ia/Mensagem.tsx`; a seção da galeria usa a `AssinaturaIA`. Na lateral e no trilho, "Seu time" mostra
o ícone da função num `Ladrilho` (a tabela de agente para ícone passa a morar fora de `componentes/ia/`, pasta
que o teste do build mantém fora da entrada), sem a onça: a casca é da entrada, e o grupo sai na X3.

As condições, que o teste prova: um desenho por agente, com uma expressão neutra só, igual em qualquer render; as
props são `agente` e `tamanho`; nenhum temporizador, animação, pose, "pensando" nem reação a quem usa (presença,
ausência, acerto, tempo); nenhum texto atribuído à onça, e "onça" nunca é o nome acessível de um agente. **A onça de
corpo inteiro não aparece na X1**: vem com o primeiro uso (X2 e X4), com parecer próprio. Mudam junto o
`docs/interface.md` 9.7 e 10.3 (que continua proibindo rosto, foto e nome de gente, e "presença viva") e o
`docs/aia/tutor.md`.

## 7c. Carga e falha (obrigatório)

| Item | Resposta |
|---|---|
| Está no caminho quente? | nenhum do servidor. No cliente, o primeiro carregamento de todos às 7h30 |
| Carga na manhã de segunda | nenhuma requisição nova. O risco é byte: o primeiro carregamento (a entrada e o que ela importa direto) está em 127 de 150 kB |
| Fila, limite por escola, rate limit, índices, migration | não se aplicam: nenhuma rota e nenhuma tabela |
| Corridas de concorrência | nenhuma no servidor. Duas abas trocando a aparência: a última vence, e as duas se igualam pelo `storage` |
| Quando cada dependência cai | inalterado: `EstadoErro`, o login por cima e a fronteira da área, na pele nova |
| Métrica e alerta | o teto do `size-limit` e o teste do build, com o que a casca nova desenha dentro da conta |
| Cenário de teste de carga | inalterado |

**Orçamento.** A casca mora na entrada. Passam a morar nela, e a contar nos 150 kB, que não sobem: `tema.ts`,
`Segmentado`, `Aparencia`, `Ladrilho` e os ícones de lugar. A casca **não busca nada por `import()`** para o
primeiro quadro, e o teste do build prova (a soma do primeiro carregamento só vê import estático). A onça e as
outras peças novas ficam fora da entrada. A entrada e o CSS são medidos em brotli antes e depois, em cada tarefa
que os toca, com o número no documento da tarefa. Os ícones de lugar **somam até 4 kB em brotli
na entrada**; acima disso saem dela para um `.svg` gerado pelo build, importado por URL, com hash no nome e teto
próprio no `.size-limit.json` (`apps/web/dist/assets/lugares-*.svg`, 6 kB em brotli), com o caso que o reprova em
`tools/ci/tamanho-web.test.ts`. Se ainda assim a casca passar dos 150 kB, o próximo a sair é o seletor de escola,
por `import()` depois do primeiro quadro. O teto de `pecas-*` sobe de 26 para 40 kB, com `tools/ci/tamanho-web.test.ts`;
os das fachadas das áreas (16, 8 e 5 kB) e o da operação (60 kB) não sobem.

## 9. Frontend

**Tokens.** Os 33 nomes de hoje ficam (as telas não mudam uma classe), com valor novo onde a D80 mudou
(`lateral` branco, `linha` igual a `borda`, `radius-caixa` 16, sombras sem desfoque). Entram: `fundo-suave`,
`borda`, `borda-forte`, `apagado`, `grafite`, `grafite-degrau`, as dez famílias em cinco tons, `sobre-cor`,
`sobre-grafite`, `campo`, `mesa`, `icone-papel`, `icone-linha`, `foco` e `veu`, este em hex de oito dígitos. O escuro é um
bloco `:root[data-tema='escuro']` fora de camada, com os mesmos nomes. `white` e `black` não mudam com o tema: texto
sobre face colorida usa `sobre-cor`, e sobre o oficial, `sobre-grafite`. A variante `dark:` continua sem uso. O
documento é a fonte: os dois testes de token passam a ler os dois blocos da seção de tokens do `docs/interface.md`.

**Desvios do mockup, de propósito** (D80, item 7): `borda-campo` com 3:1 nos dois temas, também em caixa de
marcar e interruptor desligado; o campo em foco leva o anel, e não só a borda mais clara, colado à borda (afastamento 0), e o hover não leva a
borda a `borda-forte`, que não chega a 3:1; o interruptor fora de uso não usa a opacidade de 50% do mockup, e sim
os tokens das outras peças desligadas (`fundo-suave`, borda `borda`, bolinha `borda-campo`), porque um jeito só de
mostrar peça desligada vale mais que dois, e a opacidade derrubava a borda de 3:1 sem dizer o estado; o erro
do campo leva ícone ao lado do texto e é descrição do campo (`aria-describedby`), sem `role="alert"`: o aviso do envio
já é região própria (`descritoTambemPor`), e dois alertas o anunciariam duas vezes; o hover do botão troca a cor de
fundo, sem `filter`; a `BarraRotulada` mantém o trilho `ia-cx` e o enchimento `sutil` de hoje (só a forma muda: 12 px e ponta
redonda), continua desenho `aria-hidden` com o valor escrito ao lado, e não ganha `role="progressbar"` nem `scaleX`; o
fio de 2 px entre as `Linha` é da moldura que as junta (`divide-y-2`), e não de cada uma; a lateral não anima a
largura; `apagado` nunca é cor de texto; nada depende de
`:has()`, `scrollbar-width` nem `color-mix`, nem em estilo em linha.

**Foco.** Anel de 3 px em `foco` (`#146EAA` no claro, `#60B9F4` no escuro), afastado 2 px; por dentro (−3 px) em
linha de tabela e de lista; no campo, o anel mais a borda. O anel entra na tabela de pares, a 3:1, contra `fundo`,
`superficie`, `fundo-suave` e `azul-claro`. A face `noite` que ainda existe (a faixa da operação, a dica da lateral, os
avatares) é clara no escuro, e o `foco` dá 1,99:1 sobre ela: ali, e só no escuro, o anel é o `sobre-grafite`, e o chão
próprio dentro da face (o grupo da `Aparencia` na faixa) volta ao `foco`. A regra sai com a última face `noite`.

**Alvo de toque.** Toda peça interativa tem alvo de 24 px no mínimo, e de 44 px na ação principal e em tudo abaixo
de 768 px (regra 50, item 2a). A medida de cada peça está na 10.2 do `docs/interface.md`, e o e2e da galeria mede
todas, no projeto `celular`.

**Degrau.** Uma classe `degrau` de um elemento só, que serve a `<button>` e a `<a>`: `box-shadow` sólido de
`--altura-degrau` na cor `--lado`, margem de baixo do mesmo tamanho e, apertado, `translateY` e sombra menor.
`--lado` vem de seis classes fixas (`degrau-laranja`, `degrau-grafite`, `degrau-borda`, `degrau-vermelho`,
`degrau-vermelho-borda` e `degrau-azul`), declaradas no CSS; o botão só de ícone põe `--altura-degrau` em 3 px.
Desligado: sem degrau, face `borda`, texto `apoio` (acima de 4,5:1 nos dois
temas; `sutil` não chega no escuro), em todo documento. Medidas: `principal` com face de 44 px, `compacto` de 36
(44 abaixo de 768). A sombra e a cor do hover
trocam **sem transição**: só o `transform` anima, em 100 ms.

**Peças revestidas, sem mudar props:** `Botao` e as constantes de `botao-secundario.ts` (canto 12, 700 em
caixa-alta, degrau; `oficial` em `grafite`; `perigo cheio` em `vermelho` com `sobre-cor`), `Campo`, `CampoDeSenha`,
`CampoLongo`, `Selecao`, `Cartao`, `Tabela`, `Abas`, `Menu`, `Estado`, `Faixa`, `BarraRotulada`, `NumeroPainel`,
`Dialogo`, `DialogoDeConfirmacao`, `dialogos.tsx`, `LoginPorCima`, os três de `estado/`, e as peças de
`componentes/ia/`.
**Peças novas**, uma por arquivo, com teste de componente: `Linha` (linha inteira clicável), `Ladrilho`,
`Segmentado`, `Toque`, `Opcao`, `Interruptor`, `Busca`, `Aviso`, `Contador`, `PainelLado`, `Aparencia`. Teclado,
foco e ARIA são nossos (não há Radix), e o teste de cada peça percorre o padrão: `Dialogo`, `PainelLado` e a gaveta
são `<dialog>` modal do navegador (prisão de foco e Esc nativos; devolver o foco é nosso); `Segmentado`,
`Aparencia` e `Opcao` são grupo de rádio, com setas e uma parada de Tab; `Interruptor` é `role="switch"`; `Toque` é
botão com `aria-pressed`; `Abas` e `Menu` mantêm os testes de teclado de hoje. As seções da galeria usam só nomes
inventados (regra 20, item 17).

**Página.** `Tela` passa a mostrar o título (`h1` em `t-titulo`, cabeçalho de 64 px, ação à direita) e ganha a
largura `leitura`; `conversa` vira 768, `formulario` fica 1040 e `grade`, 1200. O `<main>` da casca deixa de limitar
em 1024: a moldura é de 1200, com margem de 16 e 32. As seis telas que escrevem o cabeçalho à mão (`Estrutura`,
`ListaDaTurma`, `Professores`, `Turmas`, `Turma`, `MinhaTurma`) passam a usar a `Tela`, sem mudar o miolo. Continua
um `<main>` só, e o texto do `h1` de cada tela não muda.

**Casca da escola.** Lateral branca de 256 px com borda de 2, lugares de 52 px (ícone numa caixa de 36, rótulo em
`t-rotulo`), aceso com borda `azul-borda`, fundo `azul-claro`, texto `azul-texto` e `aria-current`; trilho de 88;
barra de topo de 56 e barra de baixo de 68 mais a área segura. Ficam **como estão** os nomes que o e2e usa:
`navigation` "Seções", "Seu time", "Rodapé" e "Sua conta"; `dialog` "Menu"; os botões "Abrir o menu", "Fechar o
menu", "Recolher a lateral", "Abrir a lateral" e "Sair"; o seletor `/^Escola: /`; o link "Turmma, página inicial".
Um rótulo muda: "Nova conversa" vira **"Início"**, no mesmo endereço. Item sem ícone ilustrado usa o `lucide`
num `Ladrilho`. "Sair" fica **visível sem abrir nada**, do tamanho dos vizinhos, no pé da lateral, no trilho e na
barra de topo; a `Aparencia` entra em "Sua conta", entre "Meus dados" e "Sair", na lateral aberta e na gaveta (no trilho de 56 px, só de ícones, ela não aparece: a pessoa a alcança abrindo a lateral). No celular, a barra de topo mostra a escola ativa (regra 50,
item 13), e o `<main>` guarda embaixo a altura da barra de baixo mais a área segura: o último botão da tela nunca
fica atrás dela.

**Casca pública e operação.** A pública divide a tela a partir de 1024 px (painel `papel` com a pinta, cartão do
formulário à direita) e empilha abaixo; a da operação troca a faixa preta por barra de topo clara. Textos, ordem
de campo e mensagens não mudam.

**Galeria.** `galeria/secoes/*.tsx`, por `import.meta.glob`, para duas tarefas não editarem o mesmo arquivo; no
topo, a `Aparencia`. Os auxiliares comuns dos blocos moram em `galeria/Secao.tsx` e `galeria/dados.ts`, e os dos specs, em
`e2e/__fixtures__/galeria.ts`. Os casos de `pecas.spec.ts` saem inteiros, sem partir nenhum, em cinco arquivos (`pecas-ia`,
`pecas-galeria`, `pecas-botoes`, `pecas-sobrepor`, `pecas-superficies`); `pecas-estado` e `pecas-campos` nascem com as
tarefas que têm caso para pôr neles.

**Chromebook.** Nenhuma fonte, nenhuma biblioteca. Só `transform` e `opacity` animam, com a regra global de
`prefers-reduced-motion`.

## 10. Testes

A referência do que não pode se perder está em `cenarios.md`, nesta pasta: (A) cada asserção de hoje presa a cor ou
a medida, com a regra que ela prova e o oráculo novo; (B) o que cada função de `e2e/__fixtures__/casca.ts` continua
afirmando; (C) a contagem de casos por spec antes da X1. A tarefa que troca uma cor leva as linhas dela de (A), e
cada linha é mutação declarada.

| Camada | O que será testado |
|---|---|
| Unidade | **Tokens:** os dois blocos do CSS iguais aos do documento, com o mesmo conjunto de nomes e o número fixo de cada bloco; todo valor em hex (`veu` em hex de oito dígitos); fora dos dois blocos, o `estilos.css` só escreve cor no véu do diálogo, e a seleção de texto pinta por token. **Contraste:** o teste lê a tabela "Pares de contraste" do `docs/interface.md` 9.1, de número fixo de linhas, e calcula cada par nos dois temas: texto sobre cada chão, o `texto` de cada família sobre o `claro` dela, sobre o chão e sobre o fundo suave, `ok` e `pendente` sobre o chão, `apoio` e `sutil` sobre a linha selecionada, `sobre-cor` sobre cada face, `sobre-grafite` sobre `grafite`, o desligado, os pares antigos (`pendente`, `ok`, `erro`, `info`, `ia`), e, a 3:1, `borda-campo` e `foco`. **Guarda de cor:** reprova nome fora da lista, cor arbitrária, modificador de opacidade, a variante `dark:`, `white` e `black` fora de lista fechada, o texto `tinta` ou `white` com a mesma variante de uma face forte (`noite`, `erro`, `caramelo` e as duas variantes dele, `laranja`, `grafite` e `vermelho`: o texto certo é `sobre-cor` ou `sobre-grafite`), e também a face que troca sob uma variante (`hover:bg-laranja`) quando o texto do estado normal é `tinta` ou `white` e nenhum texto da mesma variante o acompanha, e a cor escrita à mão (hex ou função de cor, sem diferença de maiúscula) em qualquer lugar dos `.ts` e `.tsx`, inclusive entre os colchetes de uma classe, mais a cor pelo nome quando ela é o texto inteiro entre aspas, com o QR e a onça como exceções nomeadas (o ícone ilustrado lê token e não leva hex). Reprova também `bg-grafite` e `bg-noite` (com `-alto` e `-baixo`) como face fora de uma lista fechada, que só encolhe: as constantes do oficial e os **sete** usos de antes (`Atividade.tsx`, `Home.tsx`, `NavegacaoDaLista.tsx`, a dica de `itens-da-lateral.tsx`, e os três que a varredura achou na 3.0: `areas/navegacao.ts`, `ia/AvatarAgente.tsx` e `CascaDaOperacao.tsx`), cada um com a classe que pode escrever, a justificativa e a tarefa ou spec que o tira (RF6); o teto da lista é o de hoje, a entrada cuja classe o arquivo já não escreve reprova, e só o arquivo do oficial diz "não sai". Da cor escrita à mão, os falsos positivos aceitos são o hex num comentário, a âncora e o `url(#…)` com nome que parece hex, e o texto que é exatamente um nome de cor do CSS; e o que a guarda não pega é a cor pelo nome dentro de um valor composto e a cor montada em tempo de execução, que ficam com o axe no tema escuro. **Botão:** classe, token e hex resolvidos por tema: a face e o degrau do oficial diferem dos de toda outra variante, ligada e desligada; e as classes reais de `classesDoBotao` (face e texto: ligado, hover, apertado e desligado; a face do `discreto` é o chão, e no hover o fundo suave), resolvidas em hex por tema, têm 4,5:1 em cada combinação, com a mutação `disabled:text-sutil` no lugar de `disabled:text-apoio` declarada. **Tema:** `resolverTema`; e o `<script>` extraído do `index.html`, rodado com a mesma tabela de casos (`claro`, `escuro`, ausente, valor inválido, leitura que lança, sem `matchMedia`; sistema claro e escuro), igual a `resolverTema`. **Arquitetura:** a cadeia fechada da onça (`componentes/onca/` só é importado por `ia/AvatarAgente.tsx` e por arquivo da própria pasta; `AvatarAgente`, só por `ia/AssinaturaIA.tsx` e `ia/Mensagem.tsx`); a casca não tem `import()` |
| Componente (jsdom) | cada peça nova e revestida: estados, nome acessível, teclado; a `Aparencia` e a lateral com o armazenamento recusando; o avatar com função e selo no mesmo bloco, dois renders iguais e nenhum temporizador; a onça com `aria-hidden="true"`, SVG sem `<title>` nem `<desc>`, e nenhum nome acessível da tela casando `/onça/i`; a casca com quatro itens (barra de baixo) e com cinco (gaveta); o `h1` das seis telas que passam à `Tela`, nos quatro estados |
| E2E | `tokens`: o CSS servido nos dois temas, sem `oklch(`, `color-mix(`, `:has(`, `scrollbar-width`, `@font-face` nem `infinite`, e com transição só de `transform` e `opacity`. **Aparência:** o tema antes do primeiro quadro, com o pacote da entrada segurado por rota; Sistema acompanhando o aparelho; voltar a Sistema esvazia o armazenamento; duas abas do mesmo contexto; em cada área, inclusive a operação (na barra de topo). **Armazenamento (RF24):** a pessoa A escolhe Escuro, recolhe a lateral e sai; a B entra: as chaves são exatamente as duas, com valor de conjunto fechado, e o `sessionStorage` está vazio. **O escuro nas telas de verdade:** um spec percorre os itens de cada papel, as páginas públicas e a operação com o sistema escuro emulado, com `violacoesGraves`. **Foco:** `focoVisivel`, em `verificacoes.ts`, passa a exigir contorno sólido de 3 px na cor `foco` e deixa de aceitar sombra (o degrau é sombra permanente, e a asserção passaria sempre); a galeria é percorrida por Tab nos dois temas. **Avatar:** em Agentes, Analista, conversa e Tutor, o bloco de cada `[data-agente]` é o `[data-assinatura]` mais próximo (a `AssinaturaIA` e o cabeçalho do balão da `MensagemIA` levam o atributo), e ele tem exatamente um `[data-agente]`, o nome da função em texto visível e um `[data-selo-ia]`; mutação declarada: tirar o `SeloIA` da `AssinaturaIA` deixa o teste vermelho; nenhum nó animado. **Casca (W12):** as medidas novas; "Sair" visível sem abrir nada a 360, 900 e 1366 px, com a lateral aberta e recolhida, nos três papéis e na operação, do tamanho do item vizinho, com "Meus dados" antes dele; nome de escola comprido a 360 px; o último botão acima da barra de baixo. **Galeria (`pecas-*`):** axe nos dois temas; alvo de toque de toda peça no `celular`; `Dialogo`, `PainelLado` e gaveta com foco preso, Esc e foco devolvido, no navegador. E **todos os outros specs**, mudando só a cor, a medida e o rótulo "Início" |
| Isolamento | os que existem, intactos (seção 6) |

`playwright.config.ts` fixa `colorScheme: 'light'`; nenhum projeto nem fixture semeia `educa.aparencia`, e as
asserções de armazenamento vazio de hoje não ganham filtro. A vitrine ganha a opção de fotografar no escuro. Peça
sobre `<dialog>` prova foco e Esc no e2e, sem dublar `showModal` no jsdom. O rótulo, o `h1` e o título da aba de
`/professor/nova-conversa` viram "Início".

## 11. Conformidade com as regras

| Regra | Como é atendida | Desvio e justificativa | Documento que registra o desvio |
|---|---|---|---|
| 00, 10, 20 | só a web; seções 6 e 7 | nenhum | — |
| 40 | teste de componente por peça; nenhum teste de regra enfraquecido (RF21) | nenhum | — |
| 50 | seções 7c e 9 | o mockup é contrariado onde reprova contraste e movimento | `docs/interface.md`, Parte B; D80, item 7 |
| 70 | seção 7b | "nunca rosto", da interface, vira "nunca pessoa" | D80, item 3 |
| 80 | seção 7c | nenhum | — |

## 12. Premissas não verificadas

- `⚠️ NÃO VERIFICADO` — o peso dos ícones de lugar na entrada. Saída: o `.svg` do build, com hash e teto próprio (seção 7c)
- `⚠️ NÃO VERIFICADO` — como a fonte do ChromeOS mede o rótulo em caixa-alta de 15 px na lateral. Saída: o e2e
  mede; se cortar, o rótulo desce a 14 px
- `⚠️ NÃO VERIFICADO` — o script em linha diante de uma política de segurança de conteúdo. Hoje o `Caddyfile` não
  serve nenhuma; quando o F16 trouxer, o script entra por hash (`TODO.md`)

## 13. Riscos técnicos

- **A casca nova quebra a navegação de 23 specs.** Por isso os nomes acessíveis não mudam, e a única mudança de
  estrutura (os itens fora da gaveta no celular) é consertada em `e2e/__fixtures__/casca.ts`
- **Cor em 12 arquivos do e2e.** Cada tarefa que troca uma cor leva os specs que a afirmam
- **A pele pela metade nas telas que escrevem botão, cartão e aviso à mão** (77, 46 e 30 lugares): mudam de cor
  pelos tokens e ficam sem o degrau até a spec da área, que as recompõe
- **O escuro em tela que usa `white` como fundo ou como texto.** A tarefa dos tokens troca os 13 usos pelos nomes
  novos
