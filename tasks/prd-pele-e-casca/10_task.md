# Tarefa 10.0 — As peças da conversa com IA na pele nova

**Funcionalidade:** pele-e-casca · **Depende de:** 3.0, 8.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

As dez peças de `componentes/ia/` aparecem com borda de 2 px e degrau onde se aperta, nos dois temas, e as garantias
de que a conversa não induz continuam provadas com a cor nova.

## Contexto necessário

- `techspec.md` 9 (**Tokens**, **Foco**, **Degrau**, **Peças revestidas**) e 10
- `prd.md` RF5, RF6, RF8, RF9, RF11; `cenarios.md`, parte A: A29 a A35, A47, A51, A81, A100; A53, A55, A57 e A59 conferem
- `docs/interface.md` 9.5 (regras 3 e 4: nada em laço) e 10.2 (**Marcar e informar**)
- `.claude/rules/70-conformidade-cne.md`, itens 3 e 4b; D18, D36, D59
- Código: `componentes/ia/` e o `README.md` dela; `Escolha.tsx` (`CLASSES_DA_OPCAO`, uma constante para as duas);
  `Mensagem.tsx` (`Pensando` é só texto); `CaixaPedido.tsx` ("Parar" é `secundario`)
- **Da 8.0** (`8_task.md`, "Divergências"): no `balao`, a `AssinaturaIA` é o cabeçalho, com o balão abaixo, e não o
  avatar ao lado (RF10; `techspec.md` 7b). Usam o `balao`: `professor/Time.tsx` e `professor/Tutor.tsx`

## Subtarefas

- [x] 10.1 — Revestir **sem mudar props, texto nem ordem de foco**: `CaixaPedido` (canto 16, borda 2; "Enviar" primário de
  44 px; "Parar" continua `secundario`, e não oficial; a 360 px o exemplo do campo vazio aparece inteiro, sem linha
  cortada), `Mensagem` (a pessoa em bolha; a IA sem, na `coluna`; no `balao`, a assinatura continua em cima, seja como
  estiver no mockup, e `Mensagem.tsx` não volta a importar o `AvatarAgente`), `ChipFonte` e `Fontes`
  (pílula de 28 px, "da web" tracejado), `MotorFormulario` (gerar primário, cancelar `secundario`, mesma altura),
  `AvisoFila`, `LinhaAprovacao` (continua o `Estado`, sem desenho próprio), `PaginaMini` e `TextoDaIA`
- [x] 10.2 — `Escolha`: as duas opções com **uma** constante só, borda 2 e `degrau-borda`, nenhuma laranja nem grafite, nenhuma com o
  foco ao abrir. `Pensando` e o aviso de demora seguem sem laço e sem pulso
- [x] 10.3 — `galeria/secoes/ia.tsx`: cada peça nos estados de hoje
- [x] 10.4 — Testes (tabela abaixo)
- [x] 10.5 — `professor/Time.tsx`: a data da entrega e o aviso de função suspensa perdem o recuo (`pl-8`, linhas 315 e
  351), que era o do avatar ao lado do balão. Alinhamento, conferido na foto: sem teste novo

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/ia/CaixaPedido.tsx`, `Mensagem.tsx`, `Escolha.tsx`, `ChipFonte.tsx`, `Fontes.tsx` | alterados |
| `apps/web/src/componentes/ia/MotorFormulario.tsx`, `AvisoFila.tsx`, `LinhaAprovacao.tsx`, `PaginaMini.tsx`, `TextoDaIA.tsx` | alterados |
| `apps/web/src/componentes/ia/Escolha.test.tsx`, `Mensagem.test.tsx`, `AvisoFila.test.tsx` | novos |
| `apps/web/src/galeria/secoes/ia.tsx` | alterado |
| `apps/web/src/areas/professor/Time.tsx` | alterado (o recuo, 10.5) |
| `e2e/pecas-ia.spec.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| as duas opções são iguais | componente | as duas `button` da `Escolha` têm a mesma classe, nenhuma com a face `laranja` nem `grafite`; `desligada` desliga as duas juntas |
| as duas opções são iguais, na tela | e2e | mesma largura, altura, fundo, borda e peso, de 44 px ou mais; a lista proibida passa a `[laranja, grafite]` (A32, negativa) |
| "preparando a resposta" não se mexe | componente e e2e | `Pensando` sem classe de animação; `animationName` `none` em `[data-pensando]` (A51) |
| pausa, assunto delicado e faixa | e2e | `aluno-tutor` sem edição: a pausa sem `alert` e sem vermelho, o cartão sem animação, a faixa sem botão e presa (A55, A57, A59) |
| a aprovação diz quem e quando | e2e | A29 e A31 inalterados; a linha tem o desenho do selo de estado, nos três estados (A30) |
| enviar, parar, gerar, chip | e2e | "Enviar" laranja de 44 × 44, "Parar" com fundo `fundo`, "Gerar atividade" laranja e "Cancelar" da mesma altura, chip de 24 px ou mais (A33, A34, A35, A47) |
| o exemplo cabe no celular | e2e (`celular`) | campo vazio a 360 px, na galeria: nenhuma linha do exemplo fica fora do campo (regra 50, item 2a) |
| o aviso de fila não mostra erro cru | componente | `falha` tem `alert` e "Tentar de novo"; `demora` tem `status`; nenhum código |
| texto como a tela mostra | e2e | as falas e a prévia continuam achadas pelo texto (A100) |
| axe e toque | e2e | seção sem violação grave nos dois temas; alvos de 44 px no `celular` |

## Como testar

- Componente a copiar: `componentes/pedidos/ListaDePedidos.test.tsx`
- e2e a copiar: `pecas-ia.spec.ts › a Escolha da D18…` (`desenho`, `caixa`) e o de `[data-pensando]`
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/ia`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/pecas-ia.spec.ts e2e/aluno-tutor.spec.ts e2e/professor-assistente.spec.ts`
- O exemplo: sem precedente; o mais próximo é `pecas-ia.spec.ts › a CaixaPedido…` (`caixa(campo)`). O `scrollHeight` do
  campo não conta o exemplo: compare a altura do campo vazio com a do mesmo texto digitado, ou leia
  `getComputedStyle(campo, '::placeholder')`
- Armadilha: A30. A 6.0 já revestiu o `Estado`: a igualdade vale contra ele como está
- **Telas**: `/galeria` (IA), claro e escuro; `professora`, `/professor/nova-conversa` (pedir uma atividade), claro e
  escuro, também a 360 px; `professora`, `/professor/time/assistente` e `/professor/time/tutor` (o balão, com a
  assinatura em cima); `aluno`, `/aluno/tutor`. Mockup: `/fundamentos` (Conversar com IA)

## Fora do escopo desta tarefa

Avatar e selo (8.0): `AssinaturaIA.tsx` não é tocada, nem a casca do selo (`ml-1` e `align-middle`, que ficam no
`TODO.md`). O texto do exemplo (`CaixaDoAssistente.tsx`). `Estado`, `Faixa` e `Aviso` (6.0); texto novo do Tutor.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| Arquivos fora dos "previstos": `componentes/ia/CaixaPedido.test.tsx` e `componentes/ia/pecas-revestidas.test.tsx` (o chip, a lista de fontes, a página de origem e o motor) | A regra da tarefa só é provada antes do commit pelos testes que a própria tarefa cria ou altera: a altura do exemplo e o desenho das peças que o `e2e` mede precisavam de teste de unidade que cai sem a cláusula | `techspec.md` 10 (**Componente**); `cenarios.md` A33, A34, A35, A47 |
| A `CaixaPedido` mede o texto de exemplo quando o campo está vazio (`ajustarAltura`), num **espelho**: um `textarea` igual, `aria-hidden`, `invisible`, fora do fluxo e fora da ordem de foco, com o exemplo como valor; um `ResizeObserver` o observa, para medir de novo quando a largura muda | "A 360 px o exemplo do campo vazio aparece inteiro" (10.1): o `scrollHeight` de um `textarea` não conta o placeholder, e o campo de uma linha cortava o exemplo quebrado. A primeira versão pôs o exemplo como valor do próprio campo por um instante, e isso apaga o histórico do desfazer do navegador (a ordem de correção da rodada 1, item 1): o campo em uso nunca é escrito pela medida. O espelho é o observado, porque a altura dele não muda com a do campo. As props não mudam | `techspec.md` 9 (**Alvo de toque**) e `prd.md` RF23; regra 50, item 2a |
| O `MotorFormulario` mantém o `checkbox` nativo à vista, e a caixa em volta dele passa a ser a da `Opcao` (borda de 2 px, degrau, 64 px, face azul quando marcada); a peça `Opcao` em si **não** é usada | Tentada e desfeita: a `Opcao` esconde o `<input>` (`sr-only`), e o `.check()` do Playwright, que cinco specs usam neste formulário (`a2-assistente`, `professor-assistente`, `roteiro-da-demonstracao`, `pecas-ia`), esbarra no rótulo que o cobre. Trocar a forma de marcar de cinco specs não é desta tarefa. Props, texto, ordem de foco e valores entregues não mudam | `docs/interface.md` 10.2 (`Opcao`); `techspec.md` 9 |
| O chip "da web", com a borda tracejada, **não é desenhado** | Nenhuma citação do produto vem da web hoje (D68 nasce no F9, desligada por padrão): o contrato `Citacao` só tem `materialId`, e a tarefa manda não mudar props. Desenhar uma variante sem dado nem quem a chame seria código morto com cara de função de busca na web. O comentário do `ChipFonte` e a linha da 10.2 dizem que ele nasce com a busca | `docs/interface.md` 10.2 (peças de `componentes/ia/`); `techspec.md` 9 |
| A `PaginaMini` passa de 12 para 14 px de letra, e a folha e o cabeçalho levam a borda de 2 px | O piso de letra da 9.2 é 14 px; o 12 px do comentário vinha do `mvp-rapido.md` 9.2, anterior à D80. A folha continua cortando o trecho que não cabe | `docs/interface.md` 9.2 e 9.3 |
| A bolha da pessoa (`MensagemPessoa`) leva borda de 2 px na `borda`, que a bolha do mockup não tem | "Borda de 2 px em toda peça, em `borda`": é ela que separa a peça do chão, e o `fundo-suave` sozinho some no claro. Só a pessoa fala em bolha: a IA da coluna continua sem | `docs/interface.md` 9.3 |
| `LinhaAprovacao.tsx` e `TextoDaIA.tsx` ficam como estão | A linha já é o `Estado` da 6.0 (A30: sem desenho próprio), e o texto herda a tipografia da coluna da `MensagemIA`. A igualdade da A30 vale no commit | `cenarios.md` A30 |
| O chip de fonte usa `t-apoio` (15 px, `font-bold`, `leading-none`) no lugar do `text-[14px]` escrito à mão | A 9.2 tem uma classe por papel de letra, e o chip de página é texto de apoio dentro da linha; os 28 px da pílula cabem (20 px de linha, 4 px de borda) | `docs/interface.md` 9.2 |
| Três blocos novos na galeria (`escolha-estados`, `caixa-desligada` e `motor-com-falha`), com o que antes só se via por clique ou nunca | "Cada peça nos estados de hoje" (10.3): a Escolha desligada e a escolhida, a caixa desligada e o motor com a falha do envio não tinham bloco. A pergunta da Escolha desligada é outra, para o nome do grupo continuar único na página | `techspec.md` 9 (**Galeria**) |

## Mutações

Cada bloco tira uma cláusula do desenho das peças de IA e exige o teste de unidade vermelho: na `Escolha` (a constante
única, a borda de 2 px, o degrau, a face, o hover, o desligado, o foco só de quem escolheu aqui); na `Mensagem` (a bolha da
pessoa, a IA sem bolha, o balão com a assinatura em cima, a aprovação antes das ações, o avatar que não é importado, o
`Pensando` sem laço, o registro vivo); na `CaixaPedido` (a medida do exemplo no espelho, o campo que a medida não escreve, o espelho escondido e
fora do foco, o teto de 192 px, a largura que muda, a caixa de 16 px com borda 2, o "Parar" `secundario`); na
`Escolha`, também a borda de 2 px do cartão da pergunta; no `AvisoFila` (os papéis, o botão, a borda, o texto sem código); e no chip,
nas fontes, na página de origem e no motor. São só do e2e (`e2e/pecas-ia.spec.ts`), que o portão da tarefa não roda como
mutação: o exemplo quebrado a 360 px visto no navegador, os 28 e os 44 px medidos, a borda e o degrau resolvidos por tema
(`2px solid` na `borda`, a sombra de 4 px), o axe nos dois temas e o alvo de toque do projeto. A 10.5 (o recuo do
`Time.tsx`) é alinhamento, conferido na foto, sem teste novo.

```mutacao
arquivo: apps/web/src/componentes/ia/Escolha.tsx
teste: apps/web/src/componentes/ia/Escolha.test.tsx › as duas opções são a mesma classe
-'degrau degrau-borda flex min-h-11
+'degrau flex min-h-11
```

```mutacao
arquivo: apps/web/src/componentes/ia/Escolha.tsx
teste: apps/web/src/componentes/ia/Escolha.test.tsx › as duas opções são a mesma classe
-border-2 border-borda bg-superficie p-3 text-left
+border border-borda bg-superficie p-3 text-left
```

```mutacao
arquivo: apps/web/src/componentes/ia/Escolha.tsx
teste: apps/web/src/componentes/ia/Escolha.test.tsx › as duas opções são a mesma classe
-bg-superficie p-3 text-left text-tinta enabled:hover:bg-fundo-suave
+bg-laranja p-3 text-left text-tinta enabled:hover:bg-fundo-suave
```

```mutacao
arquivo: apps/web/src/componentes/ia/Escolha.tsx
teste: apps/web/src/componentes/ia/Escolha.test.tsx › o cartão da pergunta tem a borda de 2 px
-rounded-cartao border-2 border-borda bg-superficie p-3"
+rounded-cartao border border-borda bg-superficie p-3"
```

```mutacao
arquivo: apps/web/src/componentes/ia/Escolha.tsx
teste: apps/web/src/componentes/ia/Escolha.test.tsx › as duas opções são a mesma classe
-text-tinta enabled:hover:bg-fundo-suave
+text-tinta enabled:hover:bg-laranja
```

```mutacao
arquivo: apps/web/src/componentes/ia/Escolha.tsx
teste: apps/web/src/componentes/ia/Escolha.test.tsx › as duas opções são a mesma classe
-className={CLASSES_DA_OPCAO}
+className={opcao.id === 'conversa' ? CLASSES_DA_OPCAO.replace('degrau degrau-borda ', '') : CLASSES_DA_OPCAO}
```

```mutacao
arquivo: apps/web/src/componentes/ia/Escolha.tsx
teste: apps/web/src/componentes/ia/Escolha.test.tsx › as duas opções são a mesma classe
-desligada ? '' : 'text-sutil'
+''
```

```mutacao
arquivo: apps/web/src/componentes/ia/Escolha.tsx
teste: apps/web/src/componentes/ia/Escolha.test.tsx › a opção desligada perde o degrau
-disabled:bg-borda disabled:text-apoio
+disabled:text-apoio
```

```mutacao
arquivo: apps/web/src/componentes/ia/Escolha.tsx
teste: apps/web/src/componentes/ia/Escolha.test.tsx › a opção desligada perde o degrau
-disabled:text-apoio'
+disabled:text-inativo'
```

```mutacao
arquivo: apps/web/src/componentes/ia/Escolha.tsx
teste: apps/web/src/componentes/ia/Escolha.test.tsx › a opção desligada perde o degrau
-disabled={desligada} onClick
+disabled={desligada && opcao.id === 'ferramenta'} onClick
```

```mutacao
arquivo: apps/web/src/componentes/ia/Escolha.tsx
teste: apps/web/src/componentes/ia/Escolha.test.tsx › a opção desligada perde o degrau
-desligada ? '' : 'text-sutil'
+'text-sutil'
```

```mutacao
arquivo: apps/web/src/componentes/ia/Escolha.tsx
teste: apps/web/src/componentes/ia/Escolha.test.tsx › escolher aqui leva o foco à linha
-idDaFeita === undefined || !escolheuAqui.current
+idDaFeita === undefined
```

```mutacao
arquivo: apps/web/src/componentes/ia/Escolha.tsx
teste: apps/web/src/componentes/ia/Escolha.test.tsx › a linha da escolha feita tem a borda
-rounded-full border-2 border-borda bg-fundo-suave
+rounded-full border border-borda bg-fundo-suave
```

```mutacao
arquivo: apps/web/src/componentes/ia/Mensagem.tsx
teste: apps/web/src/componentes/ia/Mensagem.test.tsx › é a bolha da pessoa
-border-2 border-borda bg-fundo-suave
+border border-borda bg-fundo-suave
```

```mutacao
arquivo: apps/web/src/componentes/ia/Mensagem.tsx
teste: apps/web/src/componentes/ia/Mensagem.test.tsx › é a bolha da pessoa
-border-2 border-borda bg-fundo-suave
+border-2 border-borda bg-creme
```

```mutacao
arquivo: apps/web/src/componentes/ia/Mensagem.tsx
teste: apps/web/src/componentes/ia/Mensagem.test.tsx › é a bolha da pessoa
-max-w-[85%] min-w-0 rounded-cartao
+min-w-0 rounded-cartao
```

```mutacao
arquivo: apps/web/src/componentes/ia/Mensagem.tsx
teste: apps/web/src/componentes/ia/Mensagem.test.tsx › é a bolha da pessoa
-whitespace-pre-wrap text-tinta
+text-tinta
```

```mutacao
arquivo: apps/web/src/componentes/ia/Mensagem.tsx
teste: apps/web/src/componentes/ia/Mensagem.test.tsx › é a bolha da pessoa
-rounded-cartao border-2 border-borda bg-fundo-suave
+rounded-lg border-2 border-borda bg-fundo-suave
```

```mutacao
arquivo: apps/web/src/componentes/ia/Mensagem.tsx
teste: apps/web/src/componentes/ia/Mensagem.test.tsx › na coluna, a IA não tem bolha
-<div className="t-corpo min-w-0 break-words text-tinta">{children}</div>
+<div className="t-corpo min-w-0 rounded-cartao border-2 border-borda bg-superficie break-words text-tinta">{children}</div>
```

```mutacao
arquivo: apps/web/src/componentes/ia/Mensagem.tsx
teste: apps/web/src/componentes/ia/Mensagem.test.tsx › na coluna, a IA não tem bolha
-<AssinaturaIA {...quem} />
-<div className="t-corpo min-w-0 break-words text-tinta">{children}</div>
+<div className="t-corpo min-w-0 break-words text-tinta">{children}</div>
+<AssinaturaIA {...quem} />
```

```mutacao
arquivo: apps/web/src/componentes/ia/Mensagem.tsx
teste: apps/web/src/componentes/ia/Mensagem.test.tsx › no balão, a assinatura é o cabeçalho
-border-2 border-borda bg-superficie px-4 py-3
+border border-borda bg-superficie px-4 py-3
```

```mutacao
arquivo: apps/web/src/componentes/ia/Mensagem.tsx
teste: apps/web/src/componentes/ia/Mensagem.test.tsx › no balão, a assinatura é o cabeçalho
-border-2 border-borda bg-superficie px-4 py-3
+border-2 border-azul bg-superficie px-4 py-3
```

```mutacao
arquivo: apps/web/src/componentes/ia/Mensagem.tsx
teste: apps/web/src/componentes/ia/Mensagem.test.tsx › no balão, a assinatura é o cabeçalho
-<AssinaturaIA {...quem} />
-<div className="t-corpo max-w-full min-w-0 rounded-cartao border-2 border-borda bg-superficie px-4 py-3 break-words text-tinta sm:max-w-[85%]">{children}</div>
+<div className="t-corpo max-w-full min-w-0 rounded-cartao border-2 border-borda bg-superficie px-4 py-3 break-words text-tinta sm:max-w-[85%]">{children}</div>
+<AssinaturaIA {...quem} />
```

```mutacao
arquivo: apps/web/src/componentes/ia/Mensagem.tsx
teste: apps/web/src/componentes/ia/Mensagem.test.tsx › a aprovação tem lugar fixo
-{aprovacao !== undefined && <LinhaAprovacao {...aprovacao} />}
-{acoes !== undefined && <div className="flex min-w-0 flex-wrap items-center gap-1">{acoes}</div>}
+{acoes !== undefined && <div className="flex min-w-0 flex-wrap items-center gap-1">{acoes}</div>}
+{aprovacao !== undefined && <LinhaAprovacao {...aprovacao} />}
```

```mutacao
arquivo: apps/web/src/componentes/ia/Mensagem.tsx
teste: apps/web/src/componentes/ia/Mensagem.test.tsx › a mensagem não importa o avatar
-import { AssinaturaIA } from './AssinaturaIA'
+import { AssinaturaIA } from './AssinaturaIA'
+import { AvatarAgente } from './AvatarAgente'
```

```mutacao
arquivo: apps/web/src/componentes/ia/Mensagem.tsx
teste: apps/web/src/componentes/ia/Mensagem.test.tsx › é a assinatura e um texto parado
-className="t-corpo min-w-0 break-words text-sutil"
+className="t-corpo min-w-0 animate-pulse break-words text-sutil"
```

```mutacao
arquivo: apps/web/src/componentes/ia/Mensagem.tsx
teste: apps/web/src/componentes/ia/Mensagem.test.tsx › é a assinatura e um texto parado
-<p aria-live="polite" className="t-corpo
+<p className="t-corpo
```

```mutacao
arquivo: apps/web/src/componentes/ia/Mensagem.tsx
teste: apps/web/src/componentes/ia/Mensagem.test.tsx › é um registro que anuncia
-aria-relevant="additions" aria-busy={ocupada}
+aria-busy={ocupada}
```

```mutacao
arquivo: apps/web/src/componentes/ia/Mensagem.tsx
teste: apps/web/src/componentes/ia/Mensagem.test.tsx › é um registro que anuncia
-aria-busy={ocupada} aria-label
+aria-busy={false} aria-label
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › com texto, o campo cresce
-const altura = campo.value === '' && espelho !== null ? espelho.scrollHeight : campo.scrollHeight
+const altura = espelho !== null ? espelho.scrollHeight : campo.scrollHeight
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › sem exemplo, o campo vazio mede
-{exemplo !== undefined && (
+{true && (
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › vazio, o campo mede o exemplo
-const altura = campo.value === '' && espelho !== null ? espelho.scrollHeight : campo.scrollHeight
+const altura = campo.value === 'nunca' && espelho !== null ? espelho.scrollHeight : campo.scrollHeight
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › vazio, o campo mede o exemplo
-          value={exemplo}
-          data-espelho-do-exemplo=""
+          value=""
+          data-espelho-do-exemplo=""
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › apagar o pedido não escreve no campo
-  campo.style.height = 'auto'
-  const altura = campo.value
+  campo.style.height = 'auto'
+  if (espelho !== null) {
+    const antes = campo.value
+    campo.value = espelho.value
+    campo.value = antes
+  }
+  const altura = campo.value
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › o exemplo é medido de novo
-    observador.observe(medido)
+    observador.observe(medido.parentElement as HTMLElement)
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › o espelho é só para medir
-          aria-hidden="true"
-          tabIndex={-1}
+          tabIndex={-1}
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › o espelho é só para medir
-          tabIndex={-1}
-          readOnly
+          readOnly
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › o espelho é só para medir
-          readOnly
-          rows={1}
+          rows={1}
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › o espelho é só para medir
-pointer-events-none invisible absolute
+pointer-events-none absolute
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › o espelho é só para medir
-className="t-corpo pointer-events-none
+className="pointer-events-none
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › o campo para de crescer em 192 px
-campo.style.height = `${String(Math.min(altura, ALTURA_MAXIMA_DO_CAMPO))}px`
+campo.style.height = `${String(altura)}px`
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › o exemplo é medido de novo
-      if (medido.clientWidth === largura) return
+      // sempre mede
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › o exemplo é medido de novo
-      largura = medido.clientWidth
-      if (campo.current !== null) ajustarAltura(campo.current, medido)
+      if (campo.current !== null) ajustarAltura(campo.current, medido)
```


```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › a caixa tem canto de 16 px
-border-2 border-borda-campo bg-campo p-2
+border border-borda-campo bg-campo p-2
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › a caixa tem canto de 16 px
-border-2 border-borda-campo bg-campo p-2
+border-2 border-borda bg-campo p-2
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › a caixa tem canto de 16 px
-border-2 border-borda-campo bg-campo p-2
+border-2 border-borda-campo bg-campo p-2 shadow-caixa
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › a caixa tem canto de 16 px
-border-2 border-borda-campo bg-campo p-2
+border-2 border-borda-campo bg-superficie p-2
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › a caixa tem canto de 16 px
-rounded-controle bg-campo px-3 py-2.5
+rounded-controle bg-superficie px-3 py-2.5
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › a caixa tem canto de 16 px
-disabled:bg-fundo-suave disabled:text-apoio
+disabled:text-inativo
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › o enviar é o primário redondo
-<Botao key="parar" variante="secundario"
+<Botao key="parar" variante="oficial"
```

```mutacao
arquivo: apps/web/src/componentes/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ia/CaixaPedido.test.tsx › o enviar é o primário redondo
-tamanho="icone" aria-label="Enviar"
+tamanho="principal" aria-label="Enviar"
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvisoFila.tsx
teste: apps/web/src/componentes/ia/AvisoFila.test.tsx › a falha é `alert`
-role={falha ? 'alert' : 'status'}
+role="status"
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvisoFila.tsx
teste: apps/web/src/componentes/ia/AvisoFila.test.tsx › a demora é `status`
-role={falha ? 'alert' : 'status'}
+role="alert"
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvisoFila.tsx
teste: apps/web/src/componentes/ia/AvisoFila.test.tsx › a demora é `status`
-{falha && aoTentarDeNovo !== undefined && (
+{aoTentarDeNovo !== undefined && (
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvisoFila.tsx
teste: apps/web/src/componentes/ia/AvisoFila.test.tsx › a falha sem a ação não inventa botão
-{falha && aoTentarDeNovo !== undefined && (
+{falha && (
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvisoFila.tsx
teste: apps/web/src/componentes/ia/AvisoFila.test.tsx › a falha é `alert`
-variante="secundario" onClick={aoTentarDeNovo}
+variante="oficial" onClick={aoTentarDeNovo}
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvisoFila.tsx
teste: apps/web/src/componentes/ia/AvisoFila.test.tsx › as duas situações têm a borda de 2 px
-rounded-controle border-2 p-3
+rounded-controle border p-3
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvisoFila.tsx
teste: apps/web/src/componentes/ia/AvisoFila.test.tsx › as duas situações têm a borda de 2 px
-'border-vermelho-borda bg-erro-cx
+'border-erro bg-erro-cx
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvisoFila.tsx
teste: apps/web/src/componentes/ia/AvisoFila.test.tsx › as duas situações têm a borda de 2 px
-'border-borda bg-info-cx
+'border-azul-borda bg-info-cx
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvisoFila.tsx
teste: apps/web/src/componentes/ia/AvisoFila.test.tsx › a falha é `alert`
-texto: 'Tente de novo em instantes.'
+texto: 'Erro 503 do provedor. Tente de novo em instantes.'
```

```mutacao
arquivo: apps/web/src/componentes/ia/ChipFonte.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › é a pílula de 28 px
-inline-flex min-h-7 min-w-7
+inline-flex min-h-6 min-w-6
```

```mutacao
arquivo: apps/web/src/componentes/ia/ChipFonte.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › é a pílula de 28 px
-rounded-full border-2 border-borda t-apoio
+rounded-lg border-2 border-borda t-apoio
```

```mutacao
arquivo: apps/web/src/componentes/ia/ChipFonte.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › é a pílula de 28 px
-rounded-full border-2 border-borda t-apoio
+rounded-full border border-borda t-apoio
```

```mutacao
arquivo: apps/web/src/componentes/ia/ChipFonte.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › é a pílula de 28 px
-leading-none font-bold whitespace-nowrap text-ia
+leading-none font-medium whitespace-nowrap text-ia
```

```mutacao
arquivo: apps/web/src/componentes/ia/ChipFonte.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › é a pílula de 28 px
-: 'bg-ia-cx'}
+: 'bg-realce'}
```

```mutacao
arquivo: apps/web/src/componentes/ia/ChipFonte.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › é a pílula de 28 px
-inline-flex min-h-7 min-w-7 items-center
+degrau inline-flex min-h-7 min-w-7 items-center
```

```mutacao
arquivo: apps/web/src/componentes/ia/ChipFonte.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › aberto, o cartão é a caixa flutuante
-whitespace-normal shadow-flutua
+whitespace-normal
```

```mutacao
arquivo: apps/web/src/componentes/ia/ChipFonte.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › aberto, o cartão é a caixa flutuante
-text-sm font-bold text-sutil">Material da escola
+text-[13px] font-bold text-sutil">Material da escola
```

```mutacao
arquivo: apps/web/src/componentes/ia/Fontes.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a linha recolhida tem 44 px
-t-apoio flex min-h-11 min-w-0 cursor-pointer
+t-apoio flex min-h-9 min-w-0 cursor-pointer
```

```mutacao
arquivo: apps/web/src/componentes/ia/Fontes.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a linha recolhida tem 44 px
-rounded-linha px-1.5 text-apoio hover:bg-fundo-suave
+rounded-linha px-1.5 text-apoio hover:bg-realce
```

```mutacao
arquivo: apps/web/src/componentes/ia/Fontes.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a linha recolhida tem 44 px
-rounded-controle border-2 border-borda bg-ia-cx
+rounded-controle border border-borda bg-ia-cx
```

```mutacao
arquivo: apps/web/src/componentes/ia/Fontes.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a linha recolhida tem 44 px
-bg-ia-cx px-3 py-2 text-ia
+bg-fundo-suave px-3 py-2 text-ia
```

```mutacao
arquivo: apps/web/src/componentes/ia/Fontes.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a linha recolhida tem 44 px
-py-2 text-ia
+py-2 text-apoio
```

```mutacao
arquivo: apps/web/src/componentes/ia/PaginaMini.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a folha tem a borda de 2 px
-rounded-linha border-2 border-borda bg-superficie p-3
+rounded-linha border border-borda bg-superficie p-3
```

```mutacao
arquivo: apps/web/src/componentes/ia/PaginaMini.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a folha tem a borda de 2 px
-border-b-2 border-borda pb-1.5 text-sm font-bold
+border-b border-borda pb-1.5 text-sm font-bold
```

```mutacao
arquivo: apps/web/src/componentes/ia/PaginaMini.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a folha tem a borda de 2 px
-pb-1.5 text-sm font-bold text-sutil
+pb-1.5 text-xs font-bold text-sutil
```

```mutacao
arquivo: apps/web/src/componentes/ia/PaginaMini.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a folha tem a borda de 2 px
-overflow-hidden text-sm leading-snug
+overflow-hidden text-xs leading-snug
```

```mutacao
arquivo: apps/web/src/componentes/ia/PaginaMini.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a folha tem a borda de 2 px
-text-right text-sm text-sutil tabular-nums
+text-right text-xs text-sutil tabular-nums
```

```mutacao
arquivo: apps/web/src/componentes/ia/MotorFormulario.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › gerar é o primário, cancelar é o secundário
-<Botao variante="secundario" onClick={aoCancelar}>
+<Botao variante="oficial" onClick={aoCancelar}>
```

```mutacao
arquivo: apps/web/src/componentes/ia/MotorFormulario.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › gerar é o primário, cancelar é o secundário
-<Botao type="submit">{descricao.verbo}</Botao>
+<Botao type="submit" variante="secundario">{descricao.verbo}</Botao>
```

```mutacao
arquivo: apps/web/src/componentes/ia/MotorFormulario.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a lista de tipos é uma caixa por tipo
-type="checkbox"
+type="radio"
```

```mutacao
arquivo: apps/web/src/componentes/ia/MotorFormulario.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a lista de tipos é uma caixa por tipo
-evento.target.checked ? [...marcados, opcao.valor] : marcados.filter((valor) => valor !== opcao.valor)
+evento.target.checked ? [...marcados, opcao.valor] : marcados
```

```mutacao
arquivo: apps/web/src/componentes/ia/MotorFormulario.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a lista de tipos é uma caixa por tipo
-min-h-16 min-w-0 cursor-pointer items-center gap-3 rounded-controle border-2 px-3
+min-h-11 min-w-0 cursor-pointer items-center gap-3 rounded-controle border-2 px-3
```

```mutacao
arquivo: apps/web/src/componentes/ia/MotorFormulario.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a lista de tipos é uma caixa por tipo
-gap-3 rounded-controle border-2 px-3
+gap-3 rounded-controle border px-3
```

```mutacao
arquivo: apps/web/src/componentes/ia/MotorFormulario.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a lista de tipos é uma caixa por tipo
-'border-azul-borda bg-azul-claro text-azul-texto degrau-azul'
+'border-borda bg-fundo text-tinta degrau-borda'
```

```mutacao
arquivo: apps/web/src/componentes/ia/MotorFormulario.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a lista de tipos é uma caixa por tipo
-hover:bg-fundo-suave degrau-borda'
+hover:bg-fundo-suave degrau-azul'
```

```mutacao
arquivo: apps/web/src/componentes/ia/MotorFormulario.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › o que falta é dito com o ícone
-{erro !== undefined && <MensagemDeErro id={idDoErro}>{erro}</MensagemDeErro>}
+{erro !== undefined && <p id={idDoErro}>{erro}</p>}
```

```mutacao
arquivo: apps/web/src/componentes/ia/MotorFormulario.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › o que falta é dito com o ícone
-rounded-controle border-2 border-vermelho-borda bg-erro-cx p-3
+rounded-controle border border-vermelho-borda bg-erro-cx p-3
```

```mutacao
arquivo: apps/web/src/componentes/ia/MotorFormulario.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › o que falta é dito com o ícone
-<legend className="t-apoio font-bold text-tinta">
+<legend className="font-medium">
```

```mutacao
arquivo: apps/web/src/componentes/ia/MotorFormulario.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › o que falta é dito com o ícone
-className="t-cartao text-tinta">
+className="text-base font-semibold text-tinta">
```

```mutacao
arquivo: apps/web/src/componentes/ia/MotorFormulario.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a descrição com campo de texto na Adaptação não abre
-rounded-cartao border-2 border-vermelho-borda bg-erro-cx p-4 text-erro
+rounded-cartao border border-vermelho-borda bg-erro-cx p-4 text-erro
```

```mutacao
arquivo: apps/web/src/componentes/ia/MotorFormulario.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › pedido recolhido e gerando
-rounded-cartao border-2 border-borda bg-superficie p-4 text-apoio
+rounded-cartao border border-borda bg-superficie p-4 text-apoio
```

```mutacao
arquivo: apps/web/src/componentes/ia/MotorFormulario.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › pedido recolhido e gerando
-rounded-cartao border-2 border-borda bg-superficie px-4 py-3
+rounded-cartao border border-borda bg-superficie px-4 py-3
```

```mutacao
arquivo: apps/web/src/componentes/ia/ChipFonte.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › é a pílula de 28 px
-t-apoio px-2.5 leading-none font-bold
+px-2.5 text-[14px] leading-none font-bold
```

```mutacao
arquivo: apps/web/src/componentes/ia/MotorFormulario.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a lista de tipos é uma caixa por tipo
-has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-solid has-[:focus-visible]:outline-foco
+focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-solid focus-within:outline-foco
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| conformidade-reviewer (1ª) | `ia.tsx:259`: quando a caixa desligada do Tutor entrar numa tela de verdade, conferir se o texto não pede ao aluno que espere ou volte (4b) | Não é desta tarefa: é conferência de texto de tela que ainda não existe. Destino: `TODO.md`, na tarefa que montar a caixa desligada do Tutor |
| conformidade-reviewer (1ª) | No escuro, a caixa desligada mal se distingue da ligada (`escuro--professora--galeria--computador-5.png`, `disabled:bg-fundo-suave`) | Recomendação "para o frontend-reviewer", que aprovou a tarefa sem apontá-la. Destino: prompt do `frontend-reviewer` na próxima rodada, com a foto citada |
| frontend-reviewer (1ª) | Chip "da web" não desenhado: uma linha no `TODO.md` ou no `ROADMAP.md` do F9 para a variante tracejada não se perder | `TODO.md`: linha acrescentada (o motivo já está na divergência da tarefa e em `docs/interface.md` 10.2) |
| frontend-reviewer (1ª) | Exemplo do `Campo` de linha única truncado a 360 px (placeholder "Tema" do `MotorFormulario`, `celular-8`) | Não é desta tarefa (`Campo`). Destino: `TODO.md`, e o `/retro` |
| frontend-reviewer (1ª) | Demonstração `data-tabela-estreita` (280 px, `superficies.tsx:149`) mostra a tabela em modo largo e corta "AGENTE E FUNÇÃO" | Peça de outra tarefa. Destino: `TODO.md` |
| test-engineer (1ª) | `font-bold` das `Fontes` e `t-corpo` do `AvisoFila` só têm prova no e2e ou nenhuma | Recusada: é tipografia, conferida nas fotos e que o revisor chamou "não bloqueia"; o bloco de unidade por classe de fonte repete o que o e2e e as fotos já provam |
| test-engineer (1ª) | O `MotorFormulario` usa `bg-fundo` na caixa desmarcada e a tabela de testes da tarefa diz "Parar com fundo `fundo`", com o teste conferindo `superficie` | Recusada: os dois tokens têm o mesmo valor nos dois temas e não aparecem na tela; o nome no comentário da `Escolha` foi acertado (item 6) |
| test-engineer (1ª) | `e2e/pecas-ia.spec.ts:472` (`violacoesDasSecoes`) repete a lógica do `violacoesGraves`: parâmetro de seções no helper de `e2e/__fixtures__/verificacoes.ts` | `TODO.md`: o helper é de outros specs e está fora dos arquivos da tarefa |
| revisor-geral (1ª) | `Escolha.tsx:30-31`: `CLASSES_DA_OPCAO` repete a cor do secundário e do desligado de `botao-secundario.ts` (`COR_DO_SECUNDARIO` e `DESLIGADO`); exportar e compor | `TODO.md`: exige exportar de `botao-secundario.ts`, arquivo fora da tarefa e de todo `Botao`. A parte do comentário foi o item 6 |
| frontend-reviewer (2ª) | Dar à caixa desligada um sinal que não dependa do fundo no escuro (`fundo-suave` e `campo` têm o mesmo valor no escuro, `estilos.css:176` e `:179`; `CaixaPedido.tsx:156`); registrar no `/retro` que o token coincide também para o `Campo` desligado (`docs/interface.md` 10.2) | `TODO.md` e `/retro`: muda o par de tokens de uma peça que a 6.0 revestiu e que o desenho de `docs/interface.md` manda assim; não é desta tarefa |
| frontend-reviewer (2ª) | Nas fotos da nova conversa o seletor mostra "2ºB 624444e1 · Química": conferir que a escola real não mostra o sufixo | Recusada: o sufixo é do dado sintético da vitrine, não do produto |
| test-engineer (2ª) | Classes do espelho sem bloco de mutação (`pointer-events-none`, `inset-x-0 top-0`, `px-3`, `py-2.5`, `min-h-11`, `w-full`); um bloco para `w-full` | Recusada: o teste "o espelho é só para medir" já confere todas e fica vermelho sem qualquer uma; a quebra de linha igual à do campo é provada a 360 px no e2e |
| test-engineer (2ª) | Registrar nas divergências da `10_task.md` por que `name`/`value` do checkbox saíram | Recusada: o `revisor-geral` confirmou que o checkbox voltou a ser igual ao `HEAD`, então não há divergência a registrar |
| test-engineer (2ª) | Comentário no teste do desfazer dizendo que a regra verdadeira é provada pelo Ctrl+Z do e2e (o teste de unidade redefine `value` por cima do rastreador do React) | `TODO.md`: comentário de teste, para quem mantiver `CaixaPedido.test.tsx` na próxima troca de versão do React |
| revisor-geral (2ª) | `CaixaPedido.tsx:154` e `:171`: as classes de letra e de respiro do campo e do espelho estão escritas duas vezes; uma constante única | `TODO.md`: o teste "o espelho é só para medir" segura a igualdade hoje; a constante é refatoração da própria `CaixaPedido` |
| revisor-geral (2ª) | `CaixaPedido.test.tsx` "apagar o pedido não escreve no campo": `toBeLessThanOrEqual(1)` é folgado; conferir `escritas` igual a `['']` | `TODO.md`: junto com o comentário acima, no mesmo teste |

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
| 2026-10-15 15:02:06 | 2026-10-15 15:03:19 | `conformidade-reviewer` | 1 | APROVADO | a58eba6e642e7557e |
| 2026-10-15 15:01:59 | 2026-10-15 15:03:52 | `frontend-reviewer` | 1 | APROVADO | a3484885e31501d22 |
| 2026-10-15 15:02:13 | 2026-10-15 15:04:36 | `test-engineer` | 1 | REPROVADO | a7b10fcbff25c801a |
| 2026-10-15 15:02:20 | 2026-10-15 15:04:38 | `revisor-geral` | 1 | REPROVADO | a425b76c88fd36b88 |
| 2026-10-15 15:27:08 | 2026-10-15 15:27:47 | `conformidade-reviewer` | 2 | APROVADO | abdb749954031c83c |
| 2026-10-15 15:26:59 | 2026-10-15 15:27:53 | `frontend-reviewer` | 2 | APROVADO | ae96402eb406d9072 |
| 2026-10-15 15:27:16 | 2026-10-15 15:28:01 | `test-engineer` | 2 | APROVADO | a5554aa336aa485bc |
| 2026-10-15 15:27:25 | 2026-10-15 15:28:41 | `revisor-geral` | 2 | APROVADO | aebd812d2764eb4c3 |
