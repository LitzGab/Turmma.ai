# Tarefa 4.0 — Os campos na pele nova, com busca, interruptor e opção

**Funcionalidade:** pele-e-casca · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Todo campo do produto passa a ter borda de 2 px que se vê (3:1), fundo `campo` e anel no foco, nos dois temas, e a
galeria ganha a busca, o interruptor e a opção.

## Contexto necessário

- `techspec.md` seção 9 (**Desvios do mockup**, **Foco**, **Alvo de toque**, **Peças novas**), 7c e 10
- `prd.md` RF2, RF7, RF9, RF11; `cenarios.md`, parte A, as linhas da 4.0
- `docs/interface.md` 10.2 (medida e token de cada estado); `mockup.md` 3.4 e 7.4
- `.claude/rules/50-frontend.md`, itens 2a e 11
- Código, em `apps/web/src/componentes/`: `Campo.tsx` (`CLASSES_DO_CAMPO`; a ordem de dica, erro e
  `descritoTambemPor` no `aria-describedby`), `CampoDeSenha.tsx`, `CampoLongo.tsx`, `Selecao.tsx`, `seletor.ts`

## Subtarefas

- [x] 4.1 — Revestir **sem mudar props**: borda de 2 px em `borda-campo`, fundo `campo` e, em foco, o anel de 3 px
  **mais** a borda (o mockup tira o anel: aqui não). O erro ganha ícone ao lado do texto; desligado em
  `fundo-suave`, com texto `apoio`
- [x] 4.2 — `Busca` (`valor`, `aoMudar`, `rotulo`): `<input type="search">`, rótulo só para leitor de tela
- [x] 4.3 — `Interruptor` (`ligado`, `aoMudar`, `rotulo`, `desligado`): `<button role="switch" aria-checked>`; Espaço
  e Enter trocam; a borda do desligado em `borda-campo`; os estados diferem pela posição da bolinha, não só pela cor
- [x] 4.4 — `Opcao` (`tipo` `radio` ou `checkbox`, `nome`, `valor`, `rotulo`, `marcada`, `aoMudar`, `icone`, `desligada`): um
  `<label>` com o `<input>` nativo dentro. Rádios de mesmo `nome` são grupo: setas trocam, uma parada de Tab. O anel
  vai no rótulo por `focus-within`, **nunca por `:has()`**; marcada leva o visto; a caixa vazia tem borda de 3:1
- [x] 4.5 — As três entram em `PECAS_FORA_DA_ENTRADA`, com alvo de 44 px. `galeria/secoes/campos.tsx` mostra cada
  peça vazia, preenchida, com erro e desligada, com nomes inventados
- [x] 4.6 — Testes (tabela abaixo)

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/Campo.tsx` | alterado |
| `apps/web/src/componentes/Campo.test.tsx` | novo |
| `apps/web/src/componentes/CampoDeSenha.tsx` | alterado |
| `apps/web/src/componentes/CampoLongo.tsx` | alterado |
| `apps/web/src/componentes/Selecao.tsx` | alterado |
| `apps/web/src/componentes/seletor.ts` | alterado |
| `apps/web/src/componentes/Busca.tsx` | novo |
| `apps/web/src/componentes/Busca.test.tsx` | novo |
| `apps/web/src/componentes/Interruptor.tsx` | novo |
| `apps/web/src/componentes/Interruptor.test.tsx` | novo |
| `apps/web/src/componentes/Opcao.tsx` | novo |
| `apps/web/src/componentes/Opcao.test.tsx` | novo |
| `apps/web/src/galeria/secoes/campos.tsx` | alterado |
| `apps/web/nome-dos-chunks.ts` | alterado |
| `e2e/pecas-campos.spec.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| rótulo, dica e erro ligados | componente | `Campo`, `CampoLongo` e `Selecao`: `aria-describedby` na ordem de hoje, `aria-invalid`, `aria-required`, erro com ícone e texto |
| `Interruptor` | componente | `aria-checked` troca com clique, Espaço e Enter; desligado não troca |
| `Opcao` em grupo | componente | as setas trocam a marcada, uma parada de Tab, `aoMudar` uma vez |
| `Busca` | componente | o nome acessível é o rótulo |
| borda e anel, nos dois temas | e2e | a borda calculada passa de 3:1 contra `fundo` e `campo`, também no interruptor desligado e na caixa da opção; em foco, contorno de 3 px em `foco`, com a borda |
| alvo de toque | e2e (`celular`) | campo, busca, interruptor e opção com 44 px |
| axe nos dois temas | e2e | a seção sem violação grave, nos dois projetos |
| nenhum teste de regra enfraquecido | e2e e unidade | `entrar`, `mfa`, `turma-publica` e `estrutura` acham os campos por `getByLabel`, sem edição; "Mostrar a senha" continua `aria-pressed`; `nome-dos-chunks.test.ts` sem peça da lista na entrada |

Concorrência, recomeço e log não se aplicam: peça sem servidor, sem sessão e sem log.

## Como testar

- Componente a copiar: `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx` (a linha `// @vitest-environment
  jsdom`, o `userEvent`); peça sem rede dispensa `prepararTela`, com `cleanup` no `afterEach`
- e2e a copiar: `e2e/pecas-botoes.spec.ts` (`abrirGaleria`, `desenho`, `caixa`); o contraste, de `e2e/tokens.spec.ts`
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/Opcao.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/pecas-campos.spec.ts e2e/entrar.spec.ts`
- Armadilha: o `jsdom` não calcula cor nem foco visível: vão no e2e. Caso de outro `pecas-*` que quebrar é arquivo
  de outra linha: pare e avise
- Telas: `/galeria` (Campos), claro e escuro; `coordenacao`, `/coordenacao/estrutura`; `/entrar`. Mockup:
  `/fundamentos` (Formulário)

## Fora do escopo desta tarefa

`Segmentado` (2.0); campo escrito à mão em `copia-unica.tsx` e `LoginPorCima.tsx` (7.0); `MotorFormulario` (10.0);
usar as peças novas nas telas (X2 a X4).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O erro do campo **não** leva `role="alert"`: é o texto que o `aria-describedby` do campo aponta, com o ícone `aria-hidden` ao lado | O campo já lê a mensagem ao receber o foco; com `role="alert"` o leitor de tela a anunciaria duas vezes, e o aviso do envio já é região própria fora do campo (`descritoTambemPor`, 17.0 W8). A tabela de 10.2 dizia "com ícone e `role="alert"`" | `techspec.md` §9 "Desvios do mockup" (acrescentei o desvio); `docs/interface.md` 10.2, linha do `Campo` (corrigida) |
| O anel do foco fica **colado à borda** (afastamento 0) nos campos e a borda **não** muda de cor no foco | O mockup tira o anel e clareia a borda; a tarefa pede anel mais borda. Com o afastamento padrão de 2 px o anel largava a borda de 2 px do campo e parecia dois desenhos | `techspec.md` §9 "Desvios do mockup" e "Foco"; `docs/interface.md` 10.2 |
| O afastamento 0 **dos campos de `/entrar`** não é provado aqui: `tokens.spec.ts` continua medindo 2 px de afastamento nas paradas de e-mail e senha | `paginas/Entrar.tsx` usa `<input>` escrito à mão, que a 4.0 não toca (campo à mão é da 14.0, a página de entrada); trocar o caso do `tokens.spec.ts` agora o deixaria vermelho sem o campo mudar | `cenarios.md` A5 (nota da 4.0 acrescentada); a 4.0 prova o afastamento 0 na galeria, em `e2e/pecas-campos.spec.ts` |
| `Opcao` ganha a prop `rotulo` (o texto da opção), que a lista de props da subtarefa 4.4 do plano não citava: ela foi acrescentada à lista desta tarefa | Sem `rotulo` a opção não tem nome para o leitor de tela nem texto para ver; é o mesmo `rotulo` do `Campo`, da `Selecao` e do `Interruptor`. O círculo à direita, igual para `radio` e `checkbox`, já é o de `docs/interface.md` 10.2 | Subtarefa 4.4 deste documento (a lista de props); `docs/interface.md` 10.2, linha da `Opcao` |
| A borda do campo **não** vai para `borda-forte` no hover, como o mockup desenha | `borda-forte` (`#D7D7D7` no claro) tem cerca de 1,4:1 contra o chão: o hover derrubaria a borda abaixo do 3:1 que é a única pista de onde o campo começa (RF2), e some no toque | `techspec.md` §9 "Desvios do mockup" (acrescentei); `mockup.md` 3.4, de onde o hover vem |
| O `Interruptor` **fora de uso** não leva a opacidade de 50% do mockup: o trilho vai para `fundo-suave` com borda `borda`, e a bolinha para `borda-campo` | Um jeito só de mostrar peça desligada, como o campo e a `Opcao` (`fundo-suave`, `apoio`); a opacidade derrubava a borda de 3:1 sem dizer o estado. A posição da bolinha continua dizendo ligado ou não | `techspec.md` §9 "Desvios do mockup" (acrescentei); `docs/interface.md` 10.2, linha do `Interruptor` (marcada "(produto)"); `mockup.md` 3.4 (Formulário), de onde a opacidade vem |
| A `Busca` tem `rotulo` **obrigatório**, sem o padrão "Buscar" que o inventário do mockup dá | A subtarefa 4.2 lista `rotulo` como prop, sem padrão: uma busca sem rótulo próprio diz menos ao leitor de tela do que a tela pede. Quem ler o mockup depois não restaura o padrão | Subtarefa 4.2 deste documento; `mockup.md` 3.4 (Formulário), inventário da `Busca`, que dá o padrão |
| Arquivos fora da lista prevista: `apps/web/src/__fixtures__/cor-das-classes.ts` (helper dos testes de componente: cor da classe por tema), `apps/web/nome-dos-chunks.test.ts` (as três peças fora da entrada), `docs/interface.md`, `techspec.md` e `cenarios.md`; `e2e/pecas-campos.spec.ts` é novo, e não "alterado". `CampoDeSenha.tsx` ficou **sem alteração**: usa o `Campo` e herda a caixa | O `jsdom` não carrega o CSS: sem o helper, o teste de componente não vê a cor que a classe dá. `CampoDeSenha` não tem classe própria de caixa | `techspec.md` §9 "Peças novas"; lista de "Arquivos previstos" desta tarefa |

Medida do orçamento (Tech Spec, seção 7c), no build de produção (`vite build`, sem a galeria), em brotli, antes (HEAD
`8f7624a`, a 3.0 pronta) e depois desta tarefa:

| | Antes | Depois | Diferença |
|---|---|---|---|
| Entrada (`index-*.js`) | 345.598 bytes, 91.715 em brotli | 343.346 bytes, 91.157 em brotli | menos 558 bytes em brotli |
| Primeiro carregamento (entrada e as partes que ela importa estaticamente) | 480.084 bytes, 127.467 em brotli | 480.934 bytes, 128.256 em brotli | mais 789 bytes em brotli |
| CSS (`index-*.css`) | 37.355 bytes, 7.088 em brotli | 39.469 bytes, 7.317 em brotli | mais 229 bytes em brotli |
| Pedaços `pecas-*.js` (23 arquivos) | 32.325 bytes, 14.690 em brotli | 32.135 bytes, 14.678 em brotli | menos 12 bytes em brotli |

A entrada encolhe só porque o `createLucideIcon` (3.102 bytes) saiu dela e virou um pedaço compartilhado
(`parte-createLucideIcon-*.js`, que a entrada pré-carrega): o que conta é o primeiro carregamento, que sobe 789 bytes e
fica em 128,3 kB, abaixo do teto de 150 kB (`nome-dos-chunks.test.ts`, que mede o build de verdade). A `Busca`, o
`Interruptor` e a `Opcao` ficam fora da entrada e fora do `pecas-*`: nenhuma tela as usa ainda (X2 a X4), e só a galeria
as importa. O teto de 40 kB do `pecas-*` não sobe.

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

Cada bloco tira uma cláusula da caixa do campo ou de uma das três peças novas e exige o teste de componente vermelho
(o `jsdom` não calcula cor, e por isso o teste lê a classe e o token dela; o que depende da cascata é do e2e da galeria,
`e2e/pecas-campos.spec.ts`, que não entra aqui). A mutação de `aria-hidden` do ícone não existe de propósito: a
biblioteca de ícones já o põe por padrão, e o teste cobre o resultado, não o atributo.

```mutacao
arquivo: apps/web/src/componentes/seletor.ts
teste: apps/web/src/componentes/Campo.test.tsx › tem a borda de 2 px que se vê
-border-2 border-borda-campo
+border border-borda-campo
```

```mutacao
arquivo: apps/web/src/componentes/seletor.ts
teste: apps/web/src/componentes/Campo.test.tsx › tem a borda de 2 px que se vê
-border-borda-campo bg-campo
+border-borda bg-campo
```

```mutacao
arquivo: apps/web/src/componentes/seletor.ts
teste: apps/web/src/componentes/Campo.test.tsx › tem a borda de 2 px que se vê
-bg-campo text-tinta
+bg-fundo text-tinta
```

```mutacao
arquivo: apps/web/src/componentes/seletor.ts
teste: apps/web/src/componentes/Campo.test.tsx › o texto digitado é legível sobre o campo
-text-tinta focus-visible
+text-campo focus-visible
```

```mutacao
arquivo: apps/web/src/componentes/seletor.ts
teste: apps/web/src/componentes/Campo.test.tsx › em foco o anel de 3 px fica colado
-focus-visible:outline-offset-0
+focus-visible:outline-offset-2
```

```mutacao
arquivo: apps/web/src/componentes/seletor.ts
teste: apps/web/src/componentes/Campo.test.tsx › inválido, a borda é vermelho-texto
-aria-invalid:border-vermelho-texto
+aria-invalid:border-borda-campo
```

```mutacao
arquivo: apps/web/src/componentes/seletor.ts
teste: apps/web/src/componentes/Campo.test.tsx › desligado, o fundo é fundo-suave
-disabled:bg-fundo-suave
+disabled:bg-campo
```

```mutacao
arquivo: apps/web/src/componentes/seletor.ts
teste: apps/web/src/componentes/Campo.test.tsx › desligado, o fundo é fundo-suave
-disabled:text-apoio
+disabled:text-inativo
```

```mutacao
arquivo: apps/web/src/componentes/seletor.ts
teste: apps/web/src/componentes/Campo.test.tsx › tem a borda de 2 px que se vê
-rounded-controle ${FACE_DO_CAMPO}
+rounded-controle
```

```mutacao
arquivo: apps/web/src/componentes/seletor.ts
teste: apps/web/src/componentes/Campo.test.tsx › tem a borda de 2 px que se vê
-t-corpo ${CAIXA_DO_CAMPO}`
+t-corpo`
```

```mutacao
arquivo: apps/web/src/componentes/Campo.tsx
teste: apps/web/src/componentes/Campo.test.tsx › tem a borda de 2 px que se vê
-py-2 t-corpo ${CAIXA_DO_CAMPO}`
+py-2 t-corpo`
```

```mutacao
arquivo: apps/web/src/componentes/Campo.tsx
teste: apps/web/src/componentes/Campo.test.tsx › acompanha um ícone de decoração
-<CircleAlert aria-hidden="true" className="mt-0.5 size-4.5 shrink-0" />
```

```mutacao
arquivo: apps/web/src/componentes/Campo.tsx
teste: apps/web/src/componentes/Campo.test.tsx › Campo sem erro nem obrigatório
-{erro !== undefined && <MensagemDeErro id={idDoErro}>{erro}</MensagemDeErro>}
+<MensagemDeErro id={idDoErro}>{erro}</MensagemDeErro>
```

```mutacao
arquivo: apps/web/src/componentes/CampoLongo.tsx
teste: apps/web/src/componentes/Campo.test.tsx › tem a borda de 2 px que se vê
-py-2 t-corpo ${CAIXA_DO_CAMPO}`
+py-2 t-corpo`
```

```mutacao
arquivo: apps/web/src/componentes/CampoLongo.tsx
teste: apps/web/src/componentes/Campo.test.tsx › CampoLongo sem erro não desenha
-{erro !== undefined && <MensagemDeErro id={idDoErro}>{erro}</MensagemDeErro>}
+<MensagemDeErro id={idDoErro}>{erro}</MensagemDeErro>
```

```mutacao
arquivo: apps/web/src/componentes/Selecao.tsx
teste: apps/web/src/componentes/Campo.test.tsx › tem a borda de 2 px que se vê
-${CLASSES_DO_SELETOR} w-full
+w-full
```

```mutacao
arquivo: apps/web/src/componentes/Selecao.tsx
teste: apps/web/src/componentes/Campo.test.tsx › é redonda e tem a mesma face do campo
-md:min-h-9 ${FACE_DO_CAMPO}
+md:min-h-9
```

```mutacao
arquivo: apps/web/src/componentes/Selecao.tsx
teste: apps/web/src/componentes/Campo.test.tsx › não é inválida nem desenha mensagem de erro
-{erro !== undefined && <MensagemDeErro id={idDoErro}>{erro}</MensagemDeErro>}
+<MensagemDeErro id={idDoErro}>{erro}</MensagemDeErro>
```

```mutacao
arquivo: apps/web/src/componentes/Busca.tsx
teste: apps/web/src/componentes/Busca.test.tsx › é um campo de busca cujo nome acessível
 id={campo}
-type="search"
+type="text"
```

```mutacao
arquivo: apps/web/src/componentes/Busca.tsx
teste: apps/web/src/componentes/Busca.test.tsx › o rótulo é só para o leitor de tela
-<label htmlFor={campo} className="sr-only">
+<label htmlFor={campo}>
```

```mutacao
arquivo: apps/web/src/componentes/Busca.tsx
teste: apps/web/src/componentes/Busca.test.tsx › o rótulo é só para o leitor de tela
-placeholder={rotulo}
```

```mutacao
arquivo: apps/web/src/componentes/Busca.tsx
teste: apps/web/src/componentes/Busca.test.tsx › avisa o que a pessoa digita
-onChange={(evento) => aoMudar(evento.target.value)}
+onChange={() => undefined}
```

```mutacao
arquivo: apps/web/src/componentes/Busca.tsx
teste: apps/web/src/componentes/Busca.test.tsx › tem a caixa do campo
-font-medium ${CAIXA_DO_CAMPO}`
+font-medium`
```

```mutacao
arquivo: apps/web/src/componentes/Interruptor.tsx
teste: apps/web/src/componentes/Interruptor.test.tsx › o clique troca na hora
-onClick={() => aoMudar(!ligado)}
+onClick={() => aoMudar(ligado)}
```

```mutacao
arquivo: apps/web/src/componentes/Interruptor.tsx
teste: apps/web/src/componentes/Interruptor.test.tsx › não troca com o clique nem com a tecla
-disabled={desligado}
```

```mutacao
arquivo: apps/web/src/componentes/Interruptor.tsx
teste: apps/web/src/componentes/Interruptor.test.tsx › é um switch com o rótulo por nome
-aria-checked={ligado}
+aria-checked={false}
```

```mutacao
arquivo: apps/web/src/componentes/Interruptor.tsx
teste: apps/web/src/componentes/Interruptor.test.tsx › é um switch com o rótulo por nome
 type="button"
-role="switch"
```

```mutacao
arquivo: apps/web/src/componentes/Interruptor.tsx
teste: apps/web/src/componentes/Interruptor.test.tsx › é um switch com o rótulo por nome
-aria-label={rotulo}
```

```mutacao
arquivo: apps/web/src/componentes/Interruptor.tsx
teste: apps/web/src/componentes/Interruptor.test.tsx › os dois estados diferem pela posição da bolinha
-'justify-end border-azul-degrau
+'justify-start border-azul-degrau
```

```mutacao
arquivo: apps/web/src/componentes/Interruptor.tsx
teste: apps/web/src/componentes/Interruptor.test.tsx › o trilho desligado tem a borda borda-campo
-border-borda-campo bg-borda'
+border-borda bg-borda'
```

```mutacao
arquivo: apps/web/src/componentes/Interruptor.tsx
teste: apps/web/src/componentes/Interruptor.test.tsx › o trilho desligado tem a borda borda-campo
-rounded-full border-2 px-0.5
+rounded-full border px-0.5
```

```mutacao
arquivo: apps/web/src/componentes/Interruptor.tsx
teste: apps/web/src/componentes/Interruptor.test.tsx › o trilho ligado é azul
-border-azul-degrau bg-azul'
+border-azul bg-azul'
```

```mutacao
arquivo: apps/web/src/componentes/Opcao.tsx
teste: apps/web/src/componentes/Opcao.test.tsx › o Espaço marca e desmarca
-onChange={(evento) => aoMudar(evento.target.checked)}
+onChange={() => aoMudar(true)}
```

```mutacao
arquivo: apps/web/src/componentes/Opcao.tsx
teste: apps/web/src/componentes/Opcao.test.tsx › o grupo é o fieldset
-checked={marcada} disabled={desligada}
+disabled={desligada}
```

```mutacao
arquivo: apps/web/src/componentes/Opcao.tsx
teste: apps/web/src/componentes/Opcao.test.tsx › desligada não troca
-checked={marcada} disabled={desligada}
+checked={marcada}
```

```mutacao
arquivo: apps/web/src/componentes/Opcao.tsx
teste: apps/web/src/componentes/Opcao.test.tsx › é uma parada só no Tab
-type={tipo} name={nome} value={valor}
+type={tipo} value={valor}
```

```mutacao
arquivo: apps/web/src/componentes/Opcao.tsx
teste: apps/web/src/componentes/Opcao.test.tsx › desligada não troca
-aria-disabled={desligada}
```

```mutacao
arquivo: apps/web/src/componentes/Opcao.tsx
teste: apps/web/src/componentes/Opcao.test.tsx › marcada leva o visto à direita
-{marcada && <Check className="size-4" strokeWidth={3} />}
+{null}
```

```mutacao
arquivo: apps/web/src/componentes/Opcao.tsx
teste: apps/web/src/componentes/Opcao.test.tsx › o anel é do rótulo, por focus-within
-focus-within:outline-solid focus-within:outline-foco
+focus-within:outline-solid focus-within:outline-borda
```

```mutacao
arquivo: apps/web/src/componentes/Opcao.tsx
teste: apps/web/src/componentes/Opcao.test.tsx › marcada leva o visto à direita
-bg-azul-claro text-azul-texto degrau-azul
+bg-azul-claro text-tinta degrau-azul
```

```mutacao
arquivo: apps/web/src/componentes/Opcao.tsx
teste: apps/web/src/componentes/Opcao.test.tsx › a caixa vazia tem a borda borda-campo
-'border-borda-campo bg-campo'
+'border-borda bg-campo'
```

```mutacao
arquivo: apps/web/src/componentes/Opcao.tsx
teste: apps/web/src/componentes/Opcao.test.tsx › é apoio sobre fundo-suave, com 4,5:1 nos dois temas
-border-borda bg-fundo-suave text-apoio'
+border-borda bg-fundo-suave text-inativo'
```

```mutacao
arquivo: apps/web/src/componentes/Opcao.tsx
teste: apps/web/src/componentes/Opcao.test.tsx › é apoio sobre fundo-suave, com 4,5:1 nos dois temas
-border-borda bg-fundo-suave text-apoio'
+border-borda bg-borda text-apoio'
```

```mutacao
arquivo: apps/web/src/componentes/Opcao.tsx
teste: apps/web/src/componentes/Opcao.test.tsx › é apoio sobre fundo-suave, com 4,5:1 nos dois temas
-'cursor-not-allowed border-borda
+'cursor-not-allowed degrau-borda border-borda
```

```mutacao
arquivo: apps/web/src/componentes/Opcao.tsx
teste: apps/web/src/componentes/Opcao.test.tsx › marcada e desligada ao mesmo tempo
-'border-borda-campo bg-campo text-apoio'
+'border-azul bg-azul text-sobre-cor'
```

```mutacao
arquivo: apps/web/src/componentes/Opcao.tsx
teste: apps/web/src/componentes/Opcao.test.tsx › marcada e desligada ao mesmo tempo
-const circulo = desligada ?
+const circulo = false ?
```

```mutacao
arquivo: apps/web/src/componentes/Interruptor.tsx
teste: apps/web/src/componentes/Interruptor.test.tsx › fora de uso o trilho é fundo-suave
-border-borda bg-fundo-suave
+border-borda bg-borda
```

```mutacao
arquivo: apps/web/src/componentes/Interruptor.tsx
teste: apps/web/src/componentes/Interruptor.test.tsx › fora de uso o trilho é fundo-suave
-disabled:cursor-not-allowed md:h-8
+disabled:cursor-not-allowed disabled:opacity-50 md:h-8
```

```mutacao
arquivo: apps/web/src/componentes/Interruptor.tsx
teste: apps/web/src/componentes/Interruptor.test.tsx › fora de uso o trilho é fundo-suave
-desligado ? 'bg-borda-campo' : 'bg-fundo'
+desligado ? 'bg-fundo' : 'bg-fundo'
```

```mutacao
arquivo: apps/web/src/componentes/Interruptor.tsx
teste: apps/web/src/componentes/Interruptor.test.tsx › fora de uso o trilho é fundo-suave
-${ligado ? 'justify-end' : 'justify-start'} border-borda
+justify-start border-borda
```

```mutacao
arquivo: apps/web/src/componentes/Busca.tsx
teste: apps/web/src/componentes/Busca.test.tsx › pede o teclado de busca no celular
-inputMode="search"
+inputMode="text"
```

```mutacao
arquivo: apps/web/src/componentes/Busca.tsx
teste: apps/web/src/componentes/Busca.test.tsx › pede o teclado de busca no celular
-autoComplete="off"
+autoComplete="on"
```

```mutacao
arquivo: apps/web/nome-dos-chunks.ts
teste: apps/web/nome-dos-chunks.test.ts › as peças novas de campo
-'Busca',
```

```mutacao
arquivo: apps/web/nome-dos-chunks.ts
teste: apps/web/nome-dos-chunks.test.ts › as peças novas de campo
-'Interruptor',
```

```mutacao
arquivo: apps/web/nome-dos-chunks.ts
teste: apps/web/nome-dos-chunks.test.ts › as peças novas de campo
-'Opcao',
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª), frontend-reviewer (1ª) | `campos.tsx`, função `Interruptores`: o texto ao lado do interruptor é um `<span>` solto, e tocar nele não troca; envolver peça e texto num rótulo | Acontece quando uma tela usa a peça, e usar as peças nas telas é "Fora do escopo desta tarefa" (X2 a X4). A galeria só mostra os estados. A tarefa que levar o `Interruptor` a uma tela confere o alvo da linha inteira |
| test-engineer (1ª), frontend-reviewer (1ª) | `Opcao.tsx`: o anel por `focus-within` aparece também no clique do mouse | Aceita, e fica registrada como decisão: a subtarefa 4.4 prescreve o anel no rótulo por `focus-within`, "nunca por `:has()`". Sem defeito para o aluno, e o desenho só pelo teclado exigiria `:has()` |
| test-engineer (1ª) | `e2e/pecas-campos.spec.ts:251`: o teste usa `hasTouch` no lugar do ponto de quebra de 768 px | Recusada: sem defeito hoje, o próprio revisor diz que vale enquanto o projeto `celular` tiver largura abaixo de 768 px, que é o que a regra 50, item 2a, manda testar |
| test-engineer (1ª), frontend-reviewer (1ª) | `Interruptor.tsx`: a bolinha em `bg-fundo` não tem asserção, e no tema claro tem pouco contraste própria | Recusada: o estado é dito pela posição da bolinha (com bloco de mutação) e pela borda de 3:1 do trilho, conforme `docs/interface.md` 10.2 |
| frontend-reviewer (1ª) | `CaixaPedido.tsx:112-125`: o texto de exemplo quebra e a segunda linha some atrás do botão "Só conversar", em 360 px | Fora da tarefa (peça não tocada aqui): é da tarefa 10.0, onde já está registrada em `2_task.md` e `3_task.md`, e quem a revisar trata como bloqueante |
| frontend-reviewer (1ª) | Tema escuro: `campo` e `fundo-suave` são o mesmo `#202f36`; o desligado se distingue só pelo texto `apoio` e pelo cursor | Conforme a D80 e controle desligado não pede contraste; fica para o `/validar` decidir se quer uma pista a mais |
| frontend-reviewer (1ª) | `/entrar` ainda mostra os campos com borda de 1 px (`<input>` escritos à mão em `paginas/Entrar.tsx`) | Tarefa 14.0, já anotada em `cenarios.md` A5; a 4.0 não toca de propósito |
| revisor-geral (2ª) | `Opcao.tsx`: o ternário aninhado de `circulo` numa linha só ficaria mais legível quebrado, como o `aspecto` | Recusada: os blocos de mutação do `4_task.md` citam essa linha por inteira (`const circulo = desligada ? …`), e quebrá-la obriga a reescrever e reprovar cada um sem mudar nada no comportamento. Legibilidade apenas |
| test-engineer (2ª) | `Opcao.test.tsx`: o laço de contraste usa `'apoio'`, `'fundo-suave'` e `'campo'` escritos à mão, em vez do token lido do elemento | Recusada: é redundante com a igualdade logo acima, que já lê o token do elemento; o próprio revisor diz que não é falha |
| test-engineer (2ª) | O e2e da galeria não mede o estilo calculado da opção desligada nem do interruptor fora de uso; só o teste de componente os cobre, sem cascata | `/validar`, como o revisor indicou |
| frontend-reviewer (2ª) | `campos.tsx:104`: `ligado={desligado}` (o `useState` chamado `desligado` guarda o "ligado") confunde com a prop `desligado` da peça | Recusada: variável local da demonstração da galeria, sem efeito em contrato nem em tela |
| frontend-reviewer (2ª) | Tabela que vira lista, na galeria, no contêiner de 280 px: corta o selo "IA" e as colunas à direita | Fora do diff da tarefa (demonstração de contêiner de outra tarefa): o `/validar` confere se o corte é intencional |

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-13 12:45:26 | 2026-10-13 12:47:05 | `revisor-geral` | 1 | APROVADO | ab843c71515d5f1d9 |
| 2026-10-13 12:45:24 | 2026-10-13 12:47:28 | `test-engineer` | 1 | REPROVADO | a43bc5118e256c50d |
| 2026-10-13 12:45:21 | 2026-10-13 12:52:56 | `frontend-reviewer` | 1 | APROVADO | a1ffbf64cf4244b45 |
| 2026-10-13 13:03:04 | 2026-10-13 13:04:03 | `test-engineer` | 2 | APROVADO | ad58aac2d5b616559 |
| 2026-10-13 13:03:09 | 2026-10-13 13:04:18 | `revisor-geral` | 2 | REPROVADO | ac41575697f4ce72e |
| 2026-10-13 13:02:56 | 2026-10-13 13:04:24 | `frontend-reviewer` | 2 | APROVADO | a1bfe174cc61bf62c |
| 2026-10-13 13:10:25 | 2026-10-13 13:10:47 | `revisor-geral` | 3 | APROVADO | a746f364d47054b2f |
