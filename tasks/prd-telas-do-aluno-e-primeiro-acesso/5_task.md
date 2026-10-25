# Tarefa 5.0 — As peças da introdução: tela de foco, balão, comemoração e a onça em três poses

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Existem, fora da entrada, as peças da introdução: a `Introducao` passo a passo, a `TelaDeFoco`, o `Balao`, a `Comemoracao` e a onça
em três poses.

## Contexto necessário

- `techspec.md` seções 5 ("Tela de foco"), 7b e 9 ("Peças novas"); `prd.md` RF3, RF8, RF13, RF16 e RF19; `mockup.md` seção 2.8 e fecho
  (b); `docs/interface.md` 9.7
- Regras 50 (item 11) e 70 (itens 4a e 4b); D58 e D59. X1, `tasks/prd-pele-e-casca/techspec.md` 7b: a cabeça da onça
  (`componentes/ui/onca/CabecaOnca.tsx`) e a cadeia fechada (`componentes/ui/ia/avatar-so-nas-duas-pecas.test.ts`) são dela; a
  cadeia passa a aceitar só os importadores daqui
- Código: `componentes/CascaDaEscola.tsx` (`encerrar`, `aoSair`); `componentes/ui/ia/AssinaturaIA.tsx`; `ehTelaDeFoco` em `caminhos.ts`

## Subtarefas

- [x] 5.1 — `componentes/ui/onca/Onca.tsx`, ao lado da `CabecaOnca`: props `pose` (`acenando`, `apontando` ou `comemorando`; **sem "acolhendo"**), `agente` e `tamanho`.
  As três poses usam **o mesmo rosto neutro da cabeça da X1** (olhos e boca); só o corpo muda. SVG parado e igual em qualquer
  render, sempre com o nome da função e o selo "IA" no mesmo bloco, `data-pose`, sem temporizador. A `comemorando` só é desenhada
  pela `Comemoracao`; a introdução usa acenando e apontando e termina parada, sem `Comemoracao`
- [x] 5.2 — `TelaDeFoco` (barra de passo e "Sair" à vista, pelo contexto da casca; sem segundo `<main>`); `Balao` (a fala é o `h1`); `Comemoracao` (um salto, `@keyframes` em CSS ao lado, só `transform` e `opacity`, uma
  iteração, parada com "reduzir movimento", sem som e sem número); `introducao/Introducao`: passos
  (`pose`, tipada `Exclude<Pose, 'comemorando'>`, `fala`, `conteudo`, `obrigatorio`), "Passo N de M" para o leitor de tela, foco no `h1` a cada passo, Enter continua,
  "Continuar" e "Pular" iguais, sem "Pular" no passo obrigatório, "Fechar" em todo passo quando revendo, e `aoConcluir` ou `aoPular`
  para quem chama.
- [x] 5.3 — `CascaDaEscola` nos endereços de `ehTelaDeFoco`: sem lateral nem barras; mantém `<main>`, `useInatividade` e `lembrarQuemEsta`
- [x] 5.4 — Seção `galeria/secoes/introducao.tsx` (o `import.meta.glob` da galeria a registra), nos dois temas, só com nomes inventados
- [x] 5.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/ui/onca/Onca.tsx`, `apps/web/src/componentes/ui/onca/Onca.test.tsx` | novo |
| `apps/web/src/componentes/ui/Comemoracao.tsx`, `apps/web/src/componentes/ui/Comemoracao.css`, `apps/web/src/componentes/ui/Comemoracao.test.tsx` | novo |
| `apps/web/src/componentes/introducao/Introducao.tsx`, `apps/web/src/componentes/introducao/Introducao.test.tsx` | novo |
| `apps/web/src/componentes/introducao/TelaDeFoco.tsx`, `apps/web/src/componentes/introducao/Balao.tsx` | novo |
| `apps/web/src/galeria/secoes/introducao.tsx`, `e2e/introducao-pecas.spec.ts`, `apps/web/src/componentes/CascaEmFoco.test.tsx` | novo |
| `apps/web/src/componentes/CascaDaEscola.tsx`, `apps/web/nome-dos-chunks.ts`, `apps/web/src/componentes/ui/ia/avatar-so-nas-duas-pecas.test.ts` | alterado |
| `apps/web/src/componentes/ui/onca/CabecaOnca.tsx` (da X1: o desenho da cabeça sai para o `DesenhoDaCabeca` e as oito cores são exportadas, sem mudar o HTML dela; é o que faz o rosto das três poses ser o mesmo) | alterado |
| `docs/interface.md` (9.7 e o item do parecer: a 5.0 registra o parecer dado), `docs/glossario.md` (Introdução, Balão, Comemoração, Pose) | alterado |
| `TODO.md` (a entrada do `Botao` nos quatro botões, destino de uma recomendação sem aplicar) | alterado |

`nome-dos-chunks.ts` é só desta tarefa: as peças novas entram em `PECAS_FORA_DA_ENTRADA`. Nada novo entra direto em
`componentes/`: ela tem 24 arquivos de produção, e a 8.0 leva o 25º, o teto de `tools/guardas/tamanho-das-pastas.test.ts`.

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| ordem e foco | componente | o `h1` recebe o foco, Enter continua, o leitor ouve "Passo 2 de 4" |
| botões iguais (RF16) | componente | "Continuar" e "Pular" saem com a mesma classe, tamanho e peso |
| passo obrigatório | componente | sem "Pular", sem "Fechar" e Esc não sai; revendo, todo passo fecha, com `['eu']` do cache e depois de erro seguido de "Tentar de novo" |
| onça (RF19) | componente | só as três poses; sempre com função e selo "IA"; nenhum texto de sentimento; nome acessível nunca é "onça" |
| rosto neutro (D80, item 3) | componente | o rosto de cada pose é igual ao da cabeça neutra da X1. **Mutação:** trocar a boca de uma pose deixa vermelho |
| arquitetura | unidade | só `Introducao`, `Comemoracao` e os `BemVindo` importam a onça de corpo inteiro; a entrada não. A pose `comemorando` só é desenhada pela `Comemoracao`, e a `Comemoracao` só é importada por `areas/aluno/Atividade.tsx` |
| movimento | componente + e2e | uma iteração, nunca `infinite`; com "reduzir movimento" o `animationName` é `none` |
| casca em foco | componente | sem lateral nem barras, um `<main>`, "Sair" à vista, inatividade ligada |

Quatro estados, concorrência e log não se aplicam: peças sem dado e sem chamada.

## Como testar

- Copie `ListaDePedidos.test.tsx` (em `componentes/pedidos/`); a casca em foco usa o `memoryLocation` do wouter
- Arquitetura: estenda `avatar-so-nas-duas-pecas.test.ts` (`QUEM_IMPORTA_A_PASTA_DA_ONCA`), com a varredura `importadoresDe`
- Rodar: `npx vitest run --project unidade apps/web/src/componentes/introducao` e
  `node tools/ci/e2e.ts --manter-ambiente e2e/introducao-pecas.spec.ts`
- Telas: nenhuma de produto; galeria `/galeria` (`VITE_COM_GALERIA=1`), seção "Introdução"; mockup `/aluno/bem-vindo?rever=1`

## Fora do escopo desta tarefa

Os textos e as rotas de cada papel (9.0 a 11.0); a pose "acolhendo"; onça no Início, no Eu ou em estado vazio; som.
Se o `conformidade-reviewer` vetar a onça de corpo inteiro ou a comemoração, a peça sai.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A `Comemoracao` também é importada por `galeria/secoes/introducao.tsx`, além de `areas/aluno/Atividade.tsx` | A tarefa aberta (7.0) vem depois; o e2e do salto e de "reduzir movimento" precisa de uma página que a mostre, e a galeria é o palco das peças. A seção não importa a pasta da onça nem o avatar: só a `Comemoracao`, e a cadeia fechada a lista (`QUEM_IMPORTA_A_COMEMORACAO`) | `techspec.md` §9 ("Peças novas") e §10 (linha "Arquitetura"); sem `cenarios.md` nesta spec; seção 11: regra 70 (item 4a), sem desvio |
| "Fechar" chama o mesmo `aoPular` de "Pular" | A tarefa pede `aoConcluir` ou `aoPular`. "Pular" só existe na primeira vez (marca como vista) e "Fechar" só revendo (a data já está gravada, o POST repetido não muda nada), então os dois nunca aparecem juntos e quem chama não precisa distingui-los | `techspec.md` §5 ("Rever": todo passo tem "Fechar", o POST repetido não muda nada) e §9; tarefa 9.0 (sair no meio não grava) |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/componentes/introducao/Introducao.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › passo obrigatório: sem "Pular", sem "Fechar", e o Esc não sai
- const podePular = passo !== undefined && !passo.obrigatorio && !revendo
+ const podePular = passo !== undefined && !revendo
```

```mutacao
arquivo: apps/web/src/componentes/introducao/Introducao.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › revendo, todo passo fecha: "Fechar" em cada um, e o Esc também; o passo obrigatório deixa de o ser
- const podePular = passo !== undefined && !passo.obrigatorio && !revendo
+ const podePular = passo !== undefined && !passo.obrigatorio
```

```mutacao
arquivo: apps/web/src/componentes/introducao/Introducao.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › passo obrigatório: sem "Pular", sem "Fechar", e o Esc não sai
- const podeFechar = revendo
+ const podeFechar = true
```

```mutacao
arquivo: apps/web/src/componentes/introducao/Introducao.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › na galeria, com focarNaAbertura desligado, a abertura não leva o foco, mas o passo seguinte leva
- if (indice === 0 && !focarNaAbertura) return
+ if (!focarNaAbertura) return
```

```mutacao
arquivo: apps/web/src/componentes/introducao/Introducao.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › na galeria, com focarNaAbertura desligado, a abertura não leva o foco, mas o passo seguinte leva
- if (indice === 0 && !focarNaAbertura) return
+ if (false) return
```

```mutacao
arquivo: apps/web/src/componentes/introducao/Introducao.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › cada "Continuar" mostra o passo seguinte, leva o foco à fala nova e o leitor ouve "Passo 2 de 4"
- fala.current?.focus()
```

```mutacao
arquivo: apps/web/src/componentes/introducao/Introducao.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › o último "Continuar" conclui, e só ele
  function continuar(): void {
- if (ultimo) aoConcluir()
+ if (ultimo) aoPular()
```

```mutacao
arquivo: apps/web/src/componentes/introducao/Introducao.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › Enter com o foco na fala avança um passo; no último, conclui
  if (alvo?.closest(TEM_ENTER_PROPRIO)) return
- if (ultimo) aoConcluir()
+ if (ultimo) aoPular()
```

```mutacao
arquivo: apps/web/src/componentes/introducao/Introducao.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › Enter que outra peça já tratou com preventDefault não avança
- if (evento.defaultPrevented) return
```

```mutacao
arquivo: apps/web/src/componentes/introducao/Introducao.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › segurar a tecla avança um passo só
- if (evento.key === 'Enter' && !evento.repeat) {
+ if (evento.key === 'Enter') {
```

```mutacao
arquivo: apps/web/src/componentes/introducao/Introducao.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › Enter num botão é do botão: não avança por cima dele
- if (alvo?.closest(TEM_ENTER_PROPRIO)) return
```

```mutacao
arquivo: apps/web/src/componentes/introducao/Introducao.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › Enter num botão é do botão: não avança por cima dele
- const alvo = evento.target instanceof Element ? evento.target : null
+ const alvo = null
```

```mutacao
arquivo: apps/web/src/componentes/introducao/Introducao.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › passo obrigatório: sem "Pular", sem "Fechar", e o Esc não sai
- if (evento.key === 'Escape' && podeFechar) aoPular()
+ if (evento.key === 'Escape') aoPular()
```

```mutacao
arquivo: apps/web/src/componentes/introducao/Introducao.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › revendo, todo passo fecha: "Fechar" em cada um, e o Esc também; o passo obrigatório deixa de o ser
- {...(podeFechar ? { aoFechar: aoPular } : {})}
```

```mutacao
arquivo: apps/web/src/componentes/introducao/Introducao.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › passo obrigatório: sem "Pular", sem "Fechar", e o Esc não sai
- {podePular && (
+ {true && (
```

```mutacao
arquivo: apps/web/src/componentes/introducao/Introducao.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › "Continuar" e "Pular" saem com a mesma classe, o mesmo tamanho e o mesmo peso, e 44 px de toque
- <button type="button" onClick={aoPular} className={`${classe} flex-1`}>
+ <button type="button" onClick={aoPular} className={`${classe} flex-1 opacity-70`}>
```

```mutacao
arquivo: apps/web/src/componentes/introducao/Introducao.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › sem passos não desenha nada
- if (passo === undefined) return null
```

```mutacao
arquivo: apps/web/src/componentes/introducao/TelaDeFoco.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › a barra enche conforme o passo: um quarto, depois metade
- const cheio = Math.min(100, Math.max(0, (passo / total) * 100))
+ const cheio = Math.min(100, Math.max(0, ((passo - 1) / total) * 100))
```

```mutacao
arquivo: apps/web/src/componentes/introducao/TelaDeFoco.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › passo obrigatório: sem "Pular", sem "Fechar", e o Esc não sai
- {aoFechar !== undefined && (
+ {true && (
```

```mutacao
arquivo: apps/web/src/componentes/introducao/TelaDeFoco.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › saindo, o botão diz "Saindo…" e não repete o clique
- <Botao variante="secundario" onClick={sair} disabled={saindo} className="shrink-0">
+ <Botao variante="secundario" onClick={sair} className="shrink-0">
```

```mutacao
arquivo: apps/web/src/componentes/introducao/TelaDeFoco.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › saindo, o botão diz "Saindo…" e não repete o clique
- {saindo ? 'Saindo…' : 'Sair'}
+ {'Sair'}
```

```mutacao
arquivo: apps/web/src/componentes/introducao/Balao.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › abre no passo 1 com a fala como `h1`, o foco nela e o leitor ouvindo "Passo 1 de 4"
- <h1 ref={refDaFala} tabIndex={-1} aria-describedby={descritoPor} className="t-balao min-w-0 break-words text-tinta">
+ <h1 ref={refDaFala} aria-describedby={descritoPor} className="t-balao min-w-0 break-words text-tinta">
```

```mutacao
arquivo: apps/web/src/componentes/introducao/Balao.tsx
teste: apps/web/src/componentes/introducao/Introducao.test.tsx › abre no passo 1 com a fala como `h1`, o foco nela e o leitor ouvindo "Passo 1 de 4"
- <h1 ref={refDaFala} tabIndex={-1} aria-describedby={descritoPor} className="t-balao min-w-0 break-words text-tinta">
+ <h1 ref={refDaFala} tabIndex={-1} className="t-balao min-w-0 break-words text-tinta">
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/Onca.test.tsx › o rosto de cada pose é o da cabeça neutra da X1: os mesmos olhos, focinho e boca
  <g data-rosto="" transform={POSICAO_DA_CABECA}>
- <DesenhoDaCabeca />
+ <path d="M20 36q4 -3 8 0" fill="none" stroke="#16233E" />
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/Onca.test.tsx › traz o nome da função e o selo "IA" no mesmo bloco, para cada agente e cada pose
- <SeloIA />
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/Onca.test.tsx › só o corpo muda: as três poses dão três desenhos de corpo diferentes
- { lado: 'direito', angulo: -60, comprimento: 30 },
+ { lado: 'direito', angulo: 210, comprimento: 34 },
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/Onca.test.tsx › só o corpo muda: as três poses dão três desenhos de corpo diferentes
- { lado: 'esquerdo', angulo: 150, comprimento: 34 },
+ { lado: 'esquerdo', angulo: 12, comprimento: 34 },
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/Onca.test.tsx › são três: acenando, apontando e comemorando. Não existe "acolhendo"
- <figure data-onca="" data-pose={pose} className="m-0 flex min-w-0 flex-col items-center gap-2">
+ <figure data-onca="" className="m-0 flex min-w-0 flex-col items-center gap-2">
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/Onca.test.tsx › é um SVG só por onça, na proporção do quadro, e o tamanho é só o tamanho
- height={Math.round((tamanho * ALTURA) / LARGURA)}
+ height={tamanho}
```

```mutacao
arquivo: apps/web/src/componentes/ui/Comemoracao.tsx
teste: apps/web/src/componentes/ui/Comemoracao.test.tsx › é a onça comemorando, com a função e o selo "IA", e a frase de quem a monta
- <Onca pose="comemorando" agente={agente} tamanho={120} />
+ <Onca pose="acenando" agente={agente} tamanho={120} />
```

```mutacao
arquivo: apps/web/src/componentes/ui/Comemoracao.tsx
teste: apps/web/src/componentes/ui/Comemoracao.test.tsx › sem frase, só a onça: nada de texto inventado pela peça
- {children !== undefined && <p className="t-corpo min-w-0 break-words text-tinta">{children}</p>}
+ {<p className="t-corpo min-w-0 break-words text-tinta">{children}</p>}
```

```mutacao
arquivo: apps/web/src/componentes/ui/Comemoracao.tsx
teste: apps/web/src/componentes/ui/Comemoracao.test.tsx › o salto está num bloco só, em volta da onça, e o texto fica parado
- <div className="comemoracao-salto">
+ <div>
```

```mutacao
arquivo: apps/web/src/componentes/ui/Comemoracao.css
teste: apps/web/src/componentes/ui/Comemoracao.test.tsx › roda uma vez: `animation-iteration-count: 1`, e `infinite` não aparece em lugar nenhum
- animation-iteration-count: 1;
+ animation-iteration-count: infinite;
```

```mutacao
arquivo: apps/web/src/componentes/ui/Comemoracao.css
teste: apps/web/src/componentes/ui/Comemoracao.test.tsx › com "reduzir movimento", a animação é `none`
- animation: none;
+ animation: inherit;
```

```mutacao
arquivo: apps/web/src/componentes/ui/Comemoracao.css
teste: apps/web/src/componentes/ui/Comemoracao.test.tsx › com "reduzir movimento", a animação é `none`
- @media (prefers-reduced-motion: reduce) {
+ @media (prefers-reduced-motion: no-preference) {
```

```mutacao
arquivo: apps/web/src/componentes/ui/Comemoracao.css
teste: apps/web/src/componentes/ui/Comemoracao.test.tsx › o salto muda só `transform` e `opacity`
- transform: translateY(-18px);
+ margin-top: -18px;
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: apps/web/src/componentes/CascaEmFoco.test.tsx › o "Sair" da `TelaDeFoco` está à vista e sai pelo caminho da casca: encerra na API e volta para a entrada
- if (ehTelaDeFoco(caminho)) {
+ if (false) {
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: apps/web/src/componentes/CascaEmFoco.test.tsx › o "Sair" da `TelaDeFoco` está à vista e sai pelo caminho da casca: encerra na API e volta para a entrada
  if (ehTelaDeFoco(caminho)) {
  return (
- <ContextoDaSaida value={saida}>
+ <ContextoDaSaida value={{ sair: () => undefined, saindo: false }}>
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| tenancy-guardian (1ª) | Auditar o POST de "vista" quando as tarefas 9.0 a 11.0 ligarem a introdução às rotas: escopo pelo token e teste de isolamento efetivo | tarefas 9.0, 10.0 e 11.0 (é onde nasce a chamada; o `tenancy-guardian` delas audita) |
| privacy-guardian (1ª) | A fala com o nome do aluno só vai para a tela, nunca para evento, log nem telemetria, e o teste dos textos do papel prova isso | tarefas 9.0 a 11.0 (os textos de cada papel estão fora do escopo da 5.0) |
| privacy-guardian (1ª) | Na 7.0, confirmar que a frase passada à `Comemoracao` é o fato ("Atividade enviada.") e nunca nota, acerto ou resultado | tarefa 7.0 (é a que monta a `Comemoracao` em `Atividade.tsx`) |
| conformidade-reviewer (1ª) | A fala de amostra da galeria diz "um programa da escola"; a techspec exige "IA da empresa" no aviso; sugestão: "um programa de IA que a escola usa" | tarefa 9.0: o texto do Tutor é dela, e `mockup.md` (linha 1042) traz "Oi, Lucas! Eu sou o Tutor, um programa da escola." como fala do passo 1. A exigência da techspec ("programa de IA de uma empresa contratada", `techspec.md` linha 135, e RF14 do PRD) é sobre o aviso de privacidade (RF14), e a 5.0 não escreve textos de papel |
| frontend-reviewer (1ª), revisor-geral (1ª) | A onça da `Introducao` é sempre 120 px; o mockup 2.8 pede 88 px no celular | tarefa 9.0 (é a que monta a introdução com a largura da tela e escolhe o tamanho) |
| frontend-reviewer (1ª) | A `Comemoracao` fixa a onça em 120 px; o mockup pede 160 px, ou 120 no celular | tarefa 7.0 |
| frontend-reviewer (1ª) | A frase da `Comemoracao` não está em região `role="status"`: decidir se o leitor de tela anuncia "Atividade enviada" | tarefa 7.0 |
| frontend-reviewer (1ª) | Na primeira vez, o passo não obrigatório tem "Pular" mas o Esc não faz nada; o mockup diz "Esc sai quando pode" | tarefa 9.0 |
| frontend-reviewer (1ª) | A barra de passo é cinza neutra e o mockup a desenha verde | recusada: o próprio revisor diz que não é defeito (regra da `BarraRotulada`, cor neutra sempre, D59) e só a registra para a validação |
| frontend-reviewer (1ª) | A pose apontando é um braço aberto, com pouca leitura de "apontar" | recusada: o revisor a classifica como "questão de gosto, não bloqueia", e o `conformidade-reviewer` aceitou a pose |
| revisor-geral (1ª) | Usar o mesmo componente `Botao` nos quatro botões (`Introducao.tsx` monta "Continuar" e "Pular" com `<button>` e `classesDoBotao`) | `TODO.md`: refatoração sem efeito para quem usa; mexe no DOM que o teste de RF16 e o bloco de Mutações com `opacity-70` citam |
| revisor-geral (1ª) | A regra de avançar ou concluir está escrita em `continuar()` e no tratador do Enter | recusada: são duas linhas, e extrair obriga a mexer nas dependências do efeito dos atalhos e a refazer os dois blocos de Mutações `if (ultimo) aoConcluir()` |
| revisor-geral (1ª) | Enter e Esc são ouvidos no documento inteiro: um `Dialogo` no conteúdo de um passo fecharia a introdução com o Esc, revendo | tarefas 9.0 a 11.0 (um caso de teste quando um passo trouxer `Dialogo`) |
| test-engineer (1ª) | Dois cliques no último "Continuar" (ou dois Enter sem `repeat`) chamam `aoConcluir` duas vezes; provar "um POST" também por ele | tarefas 9.0 a 11.0 (é onde está o POST) |
| test-engineer (1ª) | O limite entre 0 e 100 da barra (`TelaDeFoco.tsx`) não tem caso com passo maior que o total | recusada: a `Introducao` passa `passo={indice + 1}` e `total={passos.length}` (`Introducao.tsx:86-87`), nunca um passo maior que o total |
| revisor-geral (2ª) | O teste de transição do e2e só olha `[data-onca]`; se outro elemento da introdução, fora os botões, ganhar transição, passa sem perceber; inverter o filtro (tudo, menos os botões) | recusada: o título do teste já diz "a onça dela não tem nem transição", e a asserção prova exatamente isso; os botões do sistema têm a transição do degrau (`estilos.css`) |
| test-engineer (2ª) | No caso "revendo que chega depois", apertar o Esc em cada passo, e não só no último | recusada: o próprio revisor diz que a única mudança que o caso deixa passar (tirar `podeFechar` das dependências do efeito) é recusada pelo lint (`react-hooks/exhaustive-deps`, `--max-warnings=0`) |
| test-engineer (2ª) | A lista da entrada em `avatar-so-nas-duas-pecas.test.ts` ficou sem `rotas.tsx`: pôr nela, ou comentar por que fica de fora | tarefa 9.0 (é a que liga a introdução às rotas do aluno: é onde o import entra, e onde se vê se é `lazy`) |
| infra-guardian (2ª) | O POST de "vista" vale para todos os alunos de uma turma às 10h: restrição única `(escolaId, usuarioId, papel)` ou equivalente, teste de concorrência do clique duplo, rate limit por usuário e por escola, e entrar no cenário de carga do primeiro acesso | tarefas 9.0 a 11.0 (é onde o POST nasce) |
| infra-guardian (2ª) | A nova asserção `toBeDefined` deixa o `if (conteudo === undefined) continue` sem efeito: removê-lo | recusada: `conteudo` é `string \| undefined` e o `toBeDefined` não estreita o tipo para o TypeScript; o `continue` é o que o estreia |
| conformidade-reviewer (3ª) | `docs/interface.md`, tabela da 9.7: a referência "nas condições da Parte B, item …" aponta para a Parte B, mas o item está na seção 7 (linha 627, na Parte A; a Parte B começa na linha 659); trocar por "nas condições da seção 7, item 'A comemoração na entrega e a onça acolhendo'". O revisor sugeriu a 7.0 | tarefa 8.0, que já edita `docs/interface.md` (8.3); a 7.0 não toca esse arquivo |

<!-- A seção "Revisões" é criada pelo hook tools/processo/revisoes.ts: não a escreva à mão nem acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 05:11:12 | 2026-10-25 05:11:28 | `tenancy-guardian` | 1 | APROVADO | aa6c5e598d07cb51c |
| 2026-10-25 05:11:17 | 2026-10-25 05:11:51 | `infra-guardian` | 1 | APROVADO | a10e0ad6200fba3d6 |
| 2026-10-25 05:11:14 | 2026-10-25 05:12:08 | `privacy-guardian` | 1 | APROVADO | a70a2a7ba453572c8 |
| 2026-10-25 05:11:04 | 2026-10-25 05:12:31 | `conformidade-reviewer` | 1 | APROVADO | a276c547168e38074 |
| 2026-10-25 05:10:59 | 2026-10-25 05:12:35 | `frontend-reviewer` | 1 | APROVADO | aa208c7ac49c8ca8c |
| 2026-10-25 05:11:09 | 2026-10-25 05:12:53 | `revisor-geral` | 1 | APROVADO | aff49ee78f6b02f81 |
| 2026-10-25 05:11:07 | 2026-10-25 05:13:49 | `test-engineer` | 1 | REPROVADO | a83bfa87682c78723 |
| 2026-10-25 05:26:47 | 2026-10-25 05:27:21 | `revisor-geral` | 2 | APROVADO | ac64427cc9707e5ff |
| 2026-10-25 05:27:11 | 2026-10-25 05:27:23 | `tenancy-guardian` | 2 | APROVADO | a2828339c44b44f58 |
| 2026-10-25 05:27:05 | 2026-10-25 05:27:24 | `frontend-reviewer` | 2 | APROVADO | aee13c2a96c5fcebb |
| 2026-10-25 05:27:17 | 2026-10-25 05:27:33 | `privacy-guardian` | 2 | APROVADO | a9936029eb224f4da |
| 2026-10-25 05:27:23 | 2026-10-25 05:27:41 | `infra-guardian` | 2 | APROVADO | acb983d5f4009d455 |
| 2026-10-25 05:26:41 | 2026-10-25 05:27:52 | `test-engineer` | 2 | APROVADO | a461ea182fe7dc2f0 |
| 2026-10-25 05:26:56 | 2026-10-25 05:27:57 | `conformidade-reviewer` | 2 | REPROVADO | a33534b1a7acbfde8 |
| 2026-10-25 05:48:43 | 2026-10-25 05:49:13 | `conformidade-reviewer` | 3 | APROVADO | a63da9e865c84642f |
