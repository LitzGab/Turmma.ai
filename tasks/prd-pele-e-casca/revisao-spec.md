# Revisão de spec — pele-e-casca

**Subagentes obrigatórios:** `test-engineer`, `frontend-reviewer`, `privacy-guardian`, `conformidade-reviewer`, `infra-guardian`, `tenancy-guardian`

> A primeira rodada foi chamada da sessão que escreveu a spec, fora do terminal do Arquiteto, com o Joaquim
> dormindo e a decisão delegada (D80). O hook de revisões aponta para o térreo, e por isso não escreveu a seção
> "Revisões" desta rodada: o registro dela é o quadro abaixo. Da segunda em diante, a rodada corre numa sessão
> aberta neste checkout, e o hook registra.

## Rodada 1 — 12/10/2026

**Veredito: REPROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `frontend-reviewer` | AJUSTES NECESSÁRIOS | 3 |
| `conformidade-reviewer` | REPROVADO | 2 |
| `privacy-guardian` | REPROVADO | 1 |
| `infra-guardian` | REPROVADO | 1 |
| `tenancy-guardian` | APROVADO | 0 |
| `test-engineer` | (ver abaixo) | |

### Correções exigidas na Tech Spec

- 7b e seção 10, com o RF10 do PRD: o avatar era `aria-hidden` e a prova pedia nome acessível nele; "função e
  selo sempre" ficava por convenção, e três usos de hoje (`Analista.tsx`, `Agentes.tsx` e "Seu time" na lateral)
  não levam o selo. Corrigido: a onça só aparece em `AssinaturaIA` e no balão de `MensagemIA`, com função e selo no
  mesmo bloco; as duas telas passam à `AssinaturaIA`; teste de arquitetura; "Seu time" mostra o ícone da função
  (`conformidade-reviewer`, `frontend-reviewer`, `infra-guardian`)
- 7b e seção 10: a onça "parada" não tinha teste, e a de corpo inteiro não tinha escopo. Corrigido: as condições
  escritas (um desenho, expressão neutra, sem temporizador, pose, "pensando" nem reação a quem usa; sem fala e sem
  nome), o teste delas, e a onça inteira fora da X1 (`conformidade-reviewer`)
- Seção 9: o anel de foco não tinha cor, espessura nem afastamento, nem estava nos pares de contraste. Corrigido:
  o token `foco`, 3 px, afastado 2, por dentro em linha, e os pares a 3:1 (`frontend-reviewer`)
- Seção 9: o alvo de toque das peças novas não era declarado nem medido. Corrigido: 24 e 44 px, a medida por peça
  na 10.2 do `docs/interface.md`, e o e2e da galeria no `celular` (`frontend-reviewer`)
- Seção 10, com as seções 5 e 7: depois da escolha da aparência, nenhum teste dizia o que o armazenamento pode
  conter. Corrigido: a lista fechada de chaves, o RF24 e o e2e das duas pessoas no mesmo navegador
  (`privacy-guardian`)
- 7c: dizia que as peças novas ficam fora da entrada, e a seção 9 punha duas dentro da casca. Corrigido: a lista
  do que passa a morar na entrada e conta nos 150 kB, a prova de que a casca não usa `import()` no primeiro quadro, e
  o asset com hash e teto próprio no lugar do arquivo de `public/` (`infra-guardian`)

### Recomendações

Aplicadas na Tech Spec: o `try/catch` e o valor desconhecido no script do tema; onde mora cada parte da troca de
escola e de pessoa, e os specs que a provam, pelo nome; o seletor sem turno nem contagem de turmas; a sombra do
degrau e o hover sem transição; o padrão de teclado de cada peça; a escola ativa na barra de topo do celular e o
espaço da barra de baixo no `<main>`; `:has()`, `scrollbar-width` e `color-mix` em linha fora; nomes inventados na
galeria; a medição da entrada e do CSS em brotli por tarefa; "Sair" visível sem abrir nada (RF15).

Viram subtarefa ou cenário nas tarefas: a linha do `TODO.md` sobre o script em linha e a política de segurança de
conteúdo (2.0); as duas mutações da casca, a do fechamento da gaveta e a de `lembrarQuemEsta` (12.0 e 13.0); os
comentários "nunca rosto" e o título do caso do e2e (8.0); o teste que executa o script do `index.html` com o
armazenamento lançando (2.0).

Com outro destino: o parecer do advogado sobre a mascote e o de trade dress (`TODO.md`, itens da D80); o tamanho
da letra guardado em computador compartilhado (X4, com o `privacy-guardian`); as poses, a onça dormindo e a
comemoração (X2 e X4, com o `conformidade-reviewer`).

Corrigido fora da spec: a D80 dizia "Assistente em laranja, Tutor em azul"; o certo, como no mockup, é o anel do
Assistente em azul e o do Tutor em laranja.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-13 01:56:22 | 2026-10-13 01:57:28 | `privacy-guardian` | 1 | APROVADO | af4649e2d0eb36542 |
| 2026-10-13 01:56:14 | 2026-10-13 01:57:55 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | a81df6c2328eb0c4e |
| 2026-10-13 01:56:18 | 2026-10-13 01:58:22 | `conformidade-reviewer` | 1 | REPROVADO | af4e9bae185f41015 |
| 2026-10-13 01:56:27 | 2026-10-13 01:59:20 | `infra-guardian` | 1 | REPROVADO | a04f5ccc72b33c150 |
| 2026-10-13 01:56:09 | 2026-10-13 02:01:47 | `test-engineer` | 1 | REPROVADO | a1a18a3ea7e2371d6 |

## Rodada 2 — 13/10/2026

**Veredito: REPROVADA**

Chamados os cinco revisores que reprovaram na rodada 1, cada um novo e em paralelo. O `tenancy-guardian` aprovou na
rodada 1 e não foi chamado. Todas as correções da rodada 1 foram conferidas como atendidas; o que reprova agora é
resíduo de coerência entre documentos e teste que não amarra a regra.

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 6 |
| `frontend-reviewer` | AJUSTES NECESSÁRIOS | 1 (o desligado do botão, o mesmo do `test-engineer`) |
| `conformidade-reviewer` | REPROVADO | 1 |
| `privacy-guardian` | APROVADO | 0 |
| `infra-guardian` | REPROVADO | 1 |
| `tenancy-guardian` | APROVADO (rodada 1, não chamado) | 0 |

### Correções exigidas na Tech Spec

1. **Seção 9 "Degrau", seção 10 (linha "Botão"), `3_task.md` 3.2, `docs/interface.md` 704 e 1313, `cenarios.md` A4, A41 e
   a linha 413:** o texto do botão desligado está em duas cores. Tech Spec e tabela de pares dizem `apoio` sobre `borda`
   (7,7:1 a 8,0:1); `3_task.md`, 10.2 e 9.1 desvio 2 dizem `sutil` (3,72:1 no escuro, reprova 4,5:1), e o
   `contraste.test.ts` só mede o par declarado, não a classe. Unificar em `apoio`; fechar A4, A41 e a pendência da linha
   413 do `cenarios.md` em `apoio`; na linha "Botão" da seção 10, exigir teste de unidade que resolva em hex, por tema,
   as classes reais de `classesDoBotao` (face e texto: ligado, hover, apertado, desligado) e calcule o contraste de cada
   combinação; declarar a mutação `disabled:text-sutil` no lugar de `disabled:text-apoio`. (`test-engineer`,
   `frontend-reviewer`)
2. **Seção 7b e 10, `docs/interface.md` 10.2 (linha 1340) e 1430–1431, `tasks.md` 8.4:** a 10.2 manda "a onça dormindo"
   para o vazio de `estado/` na X1 (contradiz a 7b, a 9.7 e o item 8.1 do `tasks.md`: dormindo só na X2, com parecer), e
   o desenho da lateral ainda mostra "(onça) Assistente / (onça) Tutor" em "Seu time". Tirar a onça dormindo do catálogo
   da X1 ou marcá-la "X2, com parecer"; trocar "(onça)" pelo ícone da função num ladrilho; alargar o teste de
   arquitetura: nenhum arquivo fora de `AssinaturaIA` e `Mensagem.tsx` importa nada de `componentes/onca/` (a pasta
   inteira, não só a cabeça). Hoje nenhum teste pega a onça de corpo inteiro num vazio, sem nome de função e sem selo
   (RF10, D58, regra 70 item 4a). (`conformidade-reviewer`)
3. **Seção 12 e `docs/interface.md` 9.4 (linhas 887–888), seção 7c e 10.4:** a spec ainda manda o excedente de ícones
   para um arquivo em `public/` (sem hash, sem cache longo, fora de toda medição do `.size-limit.json`), contra a 7c, que
   já escolheu asset com hash. Pôr a mesma saída nos três lugares: `.svg` gerado pelo build, importado por URL, com hash
   no nome; dizer que os 4 kB são a soma dos ícones de lugar na entrada, medida em brotli; dar ao teto próprio o número
   e o caminho no `.size-limit.json` (por exemplo `apps/web/dist/assets/lugares-*.svg`, `brotli: true`); pôr o caso que
   reprova esse teto em `tools/ci/tamanho-web.test.ts`. (`infra-guardian`)
4. **Seção 9 "Pares de contraste" (`docs/interface.md` 9.1) e `PARES_DA_TABELA`:** o RF2 diz "cada par que a pele usa" e a
   tabela deixa de fora pares em uso: o `<família>-texto` sobre `fundo` (e `fundo-suave`) das famílias além de `azul` e
   `vermelho`; `ok` e `pendente` sobre `fundo` (A67); `sobre-grafite` sobre `noite-baixo` (`botao-secundario.ts:33` e
   `:69`); `sutil` e `apoio` sobre `azul-claro` (linha selecionada). Acrescentar as linhas e atualizar
   `PARES_DA_TABELA`. Corrigir também o `foco` no escuro: 7,8:1, não 8,3:1; no claro, 5,5:1. (`test-engineer`,
   `frontend-reviewer`)
5. **Seção 10, RF6 e guarda de `estilos.test.ts`:** o RF6 ("o oficial é grafite, nunca outra face") não tem teste para
   o que não é botão: `bg-noite` continua como face em `Atividade.tsx:150`, `Home.tsx:125`, `NavegacaoDaLista.tsx:27` e na
   dica de `itens-da-lateral.tsx:30`, e no escuro `noite` e `grafite` valem o mesmo `#F1F7FB`. A guarda passa a aceitar
   `bg-grafite` e `bg-noite` (e `-alto`/`-baixo`) como face só numa lista fechada, que são as constantes do oficial; os
   quatro usos trocam de token ou entram na lista com justificativa; ou o RF6 é reescrito para a afirmação mais estreita.
   (`test-engineer`)
6. **Seção 10, RF10 (contêiner e condições da 7b):** "no mesmo contêiner" não diz qual; se for ancestral qualquer, o
   `main` sempre tem selo e o teste passa com a regra removida. Nomear o bloco (o `[data-assinatura]` mais próximo, com
   exatamente um `[data-agente]`, o nome da função em texto visível e um `[data-selo-ia]`) e declarar a mutação: tirar o
   `SeloIA` da `AssinaturaIA` deixa o teste vermelho. As condições "nenhum texto atribuído à onça" e "'onça' nunca é o
   nome acessível" não têm teste na seção 10 (regra 70 item 4a, com veto): teste de componente que afirma
   `aria-hidden="true"`, SVG sem `<title>` nem `<desc>`, e nenhum nome acessível casando `/onça/i`. (`test-engineer`)
7. **PRD RF22 contra a seção 7c / 10.4:** "a área de um papel não baixa ícone de outro" contradiz os ícones de lugar de
   todos os papéis morarem na entrada. Escolher: o RF22 exclui por escrito os ícones da casca (a entrada é comum a
   todos; a regra vale para os pedaços das áreas), ou os ícones de um papel saem da entrada e `nome-dos-chunks.test.ts`
   ganha o caso, com mutação. É correção de critério de aceite do PRD: espera a palavra do Joaquim se mudar o desenho
   (a primeira opção só esclarece o texto). (`test-engineer`, `infra-guardian`)
8. **`2_task.md`, "Testes que provam a regra":** falta o que a seção 10 e a rodada 1 exigiram: o teste que extrai o
   `<script>` do `index.html` e o roda com a tabela de `resolverTema`, incluindo a leitura que lança e o caso sem
   `matchMedia`; e, no caso do RF24, que a pessoa A também recolhe a lateral, o `sessionStorage` fica vazio, os valores
   são de conjunto fechado, e o caso roda nos dois projetos (a linha 79 só diz "o armazenamento só tem
   `educa.aparencia`"). A tabela do documento é o que o Implementador segue. (`test-engineer`, com a recomendação do
   `privacy-guardian`)

### Recomendações

- Mapa único RF → teste novo → tarefa (uma parte D no `cenarios.md`), com as bordas do PRD §7 apontadas para os specs que
  já as provam; o `tasks.md:145` conta "23 requisitos" e o PRD tem 24 (`test-engineer`).
- `focoVisivel` no escuro recebe a cor esperada por tema (`#60B9F4`); pares de foco a mais: `foco` contra `realce` e
  `papel`, e o hover do perigo (`vermelho-texto` sobre `fundo-suave`) (`test-engineer`, `frontend-reviewer`).
- Primeiro quadro (2.0): `waitUntil: 'commit'` e ler o fundo do `html`, não do `body`; RF24 no `celular` troca a largura,
  pois abaixo de 768 px não há como recolher a lateral; afirmar que nenhum cookie legível novo aparece
  (`test-engineer`).
- Teste de arquitetura da onça: lista exata de importadores, dizer se a galeria entra (melhor: a seção da galeria usa a
  `AssinaturaIA`, sem exceção aberta; hoje `Galeria.tsx` importa o `AvatarAgente`), reprovar re-exportação, e usar o nome
  real do arquivo (`Mensagem.tsx`, não `MensagemIA`) (`test-engineer`, `conformidade-reviewer`, `frontend-reviewer`).
- RF8: oráculo explícito do "apertado não desloca" (`transform` calculado `none`) e olhar também as propriedades dentro
  de `@keyframes`; RF17: o teste de componente da lateral por papel não está na seção 10 nem na 12.3; RF23: um e2e do
  "cabe em 1366 × 768" nas telas com barra presa; 13.4: declarar a mutação do fechamento da gaveta por troca de pessoa e
  de escola; asserção negativa de que o seletor não mostra contagem nem turno (`test-engineer`).
- Medidas do botão divergentes: `compacto` e `principal` com 38 e 46 px (9.3 e 10.2) contra 36 e 44 px (RF5, 3.2, A42);
  escolher uma. Tabela 10.2: acrescentar a medida abaixo de 768 px em `Toque` (40), `Interruptor` (32) e chips
  (`frontend-reviewer`).
- `docs/interface.md` 9.5 item 3 deixa "pensando" e o esqueleto pulsarem em laço, contra A51/A53 e o e2e sem `infinite`;
  9.4 diz "nenhum hex dentro do ícone" e a seção 10 dá exceção de hex em `fill` e `stroke` aos ícones ilustrados:
  alinhar os dois documentos (`conformidade-reviewer`, `infra-guardian`).
- Seção 7c: "a entrada está em 127 de 150 kB" é o primeiro carregamento inteiro, ajustar a palavra; declarar o plano para
  quando estourar (a gaveta ou o seletor de escola por `import()` depois do primeiro quadro); teto em brotli para o CSS
  no `.size-limit.json`; registrar em `tasks/prd-fundacao-tecnica/notas-staging.md` o `Cache-Control: public,
  max-age=31536000, immutable` em `/assets/*` e `no-cache` no `index.html`; dizer na seção 9 que a lista agente → ícone
  de "Seu time" vive fora de `componentes/ia/` (`infra-guardian`).
- Na seção 6 do `docs/interface.md`, uma linha apontando para a lista de chaves do navegador da 11.1; opcional, uma
  frase no `docs/lgpd.md` junto da linha do cookie de dispositivo (linha 70) (`privacy-guardian`).
- A frase da D80, item 3, com as cores do Assistente e do Tutor trocadas, segue para acertar fora da spec
  (`conformidade-reviewer`).

## Rodada 3 — 13/10/2026

**Veredito: REPROVADA**

Chamados os quatro revisores que reprovaram na rodada 2, cada um novo e em paralelo, com as correções deles e a
instrução de conferir item por item. O `privacy-guardian` e o `tenancy-guardian` aprovaram antes e não foram chamados.
O `8_task.md` ainda não existe e ficou de fora: vale o item 8.4 do `tasks.md`. Três revisores aprovaram, com todas as
correções da rodada 2 conferidas como atendidas. Resta um bloqueante, de uma linha, no `2_task.md`.

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 1 |
| `frontend-reviewer` | APROVADO | 0 |
| `conformidade-reviewer` | APROVADO | 0 |
| `infra-guardian` | APROVADO | 0 |
| `privacy-guardian` | APROVADO (rodada 2, não chamado) | 0 |
| `tenancy-guardian` | APROVADO (rodada 1, não chamado) | 0 |

### Correções exigidas na Tech Spec
- `2_task.md`, tabela "Testes que provam a regra", linha 80 (RF24, "duas pessoas no mesmo computador"): o oráculo
  diz que `educa.lateral-recolhida` tem valor do conjunto fechado `1`, mas o código grava `'sim'`
  (`apps/web/src/componentes/CascaDaEscola.tsx:53` e `:61`) e a Tech Spec diz o mesmo (seção 7: "`educa.lateral-recolhida`
  (`sim`)"; seção 5: "a chave não muda"). Do jeito que está, o teste fica vermelho pelo motivo errado, ou empurra o
  Implementador a mudar o valor gravado contra a Tech Spec; e a tabela é o que ele segue ("Não improvise aqui").
  Correção: trocar `` `1` `` por `` `sim` `` na linha 80 (`test-engineer`).

Conferido como atendido pelo `test-engineer`: desligado em `apoio` em todo documento, com o teste das classes reais de
`classesDoBotao` e a mutação `disabled:text-sutil` (1); 86 linhas na tabela de pares e `PARES_DA_TABELA = 86`, `foco`
em 5,5:1 e 7,8:1 (2); guarda de `bg-grafite`/`bg-noite` com lista fechada que só encolhe (3); bloco `[data-assinatura]`
com a mutação do `SeloIA` e o teste de `aria-hidden`, sem `<title>`/`<desc>` e sem nome casando `/onça/i` (4); RF22 com
a entrada excluída por escrito (5); a linha 73 do `2_task.md`, o script do `index.html` com a tabela inteira (6, em
parte).

### Recomendações
- A regra do teste de arquitetura da onça, como está na seção 10 e no 8.4 ("só `AssinaturaIA` e `Mensagem.tsx` importam
  o avatar ou qualquer arquivo de `componentes/onca/`"), reprovaria o próprio `ia/AvatarAgente.tsx`, que precisa
  importar `onca/CabecaOnca`. Escrever a cadeia fechada: `onca/` só é importado por `AvatarAgente` e por arquivos de
  dentro de `onca/`; `AvatarAgente` só é importado por `AssinaturaIA` e `Mensagem`. O PRD (RF10) e a 9.7 (linhas
  972–973) dizem "a cabeça" e deveriam dizer "qualquer arquivo de `componentes/onca/`" (`conformidade-reviewer`).
- A `8_task.md`, ao ser escrita, leva o que a seção 10 pede e o 8.4 resume sem: a definição do `[data-assinatura]` e a
  mutação do `SeloIA`, o `<desc>` ausente no SVG, o `/onça/i` na tela inteira (`test-engineer`, `frontend-reviewer`).
- RF24 no `celular`: abaixo de 768 px não há como recolher a lateral; o passo pede `setViewportSize` de 1024 ou mais
  antes de recolher (`test-engineer`).
- Acrescentar a linha `vermelho-texto` sobre `fundo-suave` (item perigoso do `Menu`, 10.2), que leva a tabela a 87;
  dizer qual é a face do botão `discreto` (transparente: resolver contra `fundo` e `fundo-suave`); declarar na 3.0 a
  mutação "arquivo novo com `bg-noite` como face fica vermelho", com a lista literal de tamanho fixo
  (`test-engineer`).
- `9_task.md` 9.3 e `tasks.md` 9.3: escrever o que fazer se passar de 4 kB (`lugares-*.svg`, 6 kB em brotli, o caso em
  `tools/ci/tamanho-web.test.ts`, e o teto só entra junto com o asset, porque o size-limit reprova caminho sem arquivo);
  os 4 kB valem para os 12 ícones de lugar e a X1 mede quatro, então X2 a X4 medem de novo; o cache longo do asset com
  hash em `notas-staging.md`; teto em brotli para o CSS fica para o `/validar` (`infra-guardian`).
- `1_task.md:127` cita a linha "Texto sobre o desligado de hoje", que na tabela se chama "desligado de antes"
  (`docs/interface.md` 810); `cenarios.md` A2 (linha 38) cita "o desligado em inativo" e a 3.0 renomeia o caso
  (`frontend-reviewer`).
- Restos da rodada 2 que seguem abertos como recomendação: cor do `focoVisivel` por tema; `waitUntil: 'commit'` e fundo
  lido do `html` no primeiro quadro; oráculo `transform: none` do movimento reduzido; teste da lateral por papel (RF17);
  negativa de contagem e turno no seletor; mutação do fechamento da gaveta na 13.4 (`test-engineer`).
| 2026-10-13 02:04:20 | 2026-10-13 02:05:06 | `frontend-reviewer` | 2 | APROVADO | a0fb09b92ff8b6244 |
| 2026-10-13 02:04:27 | 2026-10-13 02:05:24 | `conformidade-reviewer` | 2 | APROVADO | a2dee17508602d5c8 |
| 2026-10-13 02:04:33 | 2026-10-13 02:05:34 | `infra-guardian` | 2 | APROVADO | a64d553b08a26266a |
| 2026-10-13 02:04:14 | 2026-10-13 02:06:13 | `test-engineer` | 2 | REPROVADO | a586145fbb477a84d |
| 2026-10-13 02:08:32 | 2026-10-13 02:09:02 | `test-engineer` | 3 | APROVADO | ad63254f16f73c929 |

## Rodada 4 — 13/10/2026

**Veredito: APROVADA**

Chamado só o `test-engineer`, novo, que reprovou na rodada 3 por um bloqueante de uma linha. Ele conferiu que a linha
80 do `2_task.md` agora diz `sim` para `educa.lateral-recolhida` (e `claro` ou `escuro` para `educa.aparencia`), que
`apps/web/src/componentes/CascaDaEscola.tsx` grava `'sim'` (`:61`, leitura em `:53`, chave em `:49`) e que o resto
da tabela ficou coerente, incluindo o `setViewportSize` de 1024 px no `celular` (a consulta larga é `min-width:
1024px`, inclusiva). Nenhum erro novo veio das recomendações aplicadas na rodada 3. O hook registrou esta rodada do
`test-engineer` como a 3ª dele (a rodada 1 foi fora do hook).

| Revisor | Veredito (última rodada) | Bloqueantes |
|---|---|---|
| `test-engineer` | APROVADO (rodada 4 da spec) | 0 |
| `frontend-reviewer` | APROVADO (rodada 3 da spec) | 0 |
| `conformidade-reviewer` | APROVADO (rodada 3 da spec) | 0 |
| `infra-guardian` | APROVADO (rodada 3 da spec) | 0 |
| `privacy-guardian` | APROVADO (rodada 2 da spec, não chamado) | 0 |
| `tenancy-guardian` | APROVADO (rodada 1 da spec, não chamado) | 0 |

### Correções exigidas na Tech Spec
Nenhuma.

### Recomendações
- `2_task.md`, parêntese da linha 80: diz "abaixo de 768 não há o que recolher"; pelo código, entre 768 e 1023 px
  também não há botão de recolher (só o trilho, que abre a lateral por cima, `CascaDaEscola.tsx:20` e `:365`). Escrever
  "abaixo de 1024". O passo de 1024 px já está certo (`test-engineer`).
- RF24: afirmar os valores por igualdade exata com `{ 'educa.aparencia': 'escuro', 'educa.lateral-recolhida':
  'sim' }`, e não só por pertencer ao conjunto fechado (`test-engineer`).
- Seguem abertas, das rodadas 2 e 3, e entram como subtarefa ou cenário nas tarefas: a cadeia fechada de importação
  da onça escrita igual na Tech Spec (7b e seção 10), no PRD (RF10, "qualquer arquivo de `componentes/onca/`") e no
  8.4; a `8_task.md` com a definição do `[data-assinatura]`, a mutação do `SeloIA`, o `<desc>` ausente e o `/onça/i`
  na tela inteira; a mutação "arquivo novo com `bg-noite` como face" na 3.0, com lista literal de tamanho fixo; a
  cor do `focoVisivel` por tema; `waitUntil: 'commit'` e o fundo lido do `html` no primeiro quadro; o oráculo
  `transform: none` do movimento reduzido; o teste da lateral por papel (RF17); a negativa de contagem e turno no
  seletor; a mutação do fechamento da gaveta (13.4); a 9.3 do `tasks.md` com o plano acima de 4 kB; o cache longo do
  asset com hash em `notas-staging.md`; o ajuste da frase da D80 (cores do Assistente e do Tutor) fora da spec.
