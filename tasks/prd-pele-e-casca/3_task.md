# Tarefa 3.0 — O botão ganha o degrau e os seis desenhos da D80, em todo o produto

**Funcionalidade:** pele-e-casca · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Todo botão do produto passa a ter canto de 12 px, rótulo em caixa-alta e degrau, nos seis desenhos da D80; o foco
vira o anel azul de 3 px em toda peça; e entram no CSS a tipografia `t-*` e a regra de movimento reduzido. A decisão
oficial continua com um botão que não se parece com nenhum outro.

## Contexto necessário

- `techspec.md` seção 9, parágrafos **Degrau**, **Foco**, **Peças revestidas** e **Chromebook**; seção 10 (as
  regras de produto presas a cor)
- `prd.md` RF5, RF6, RF7 e RF8
- `docs/interface.md` 9.2 (tipografia), 9.3 (degrau: altura por peça e o que afunda), 9.5 (movimento) e 10.2 (botão)
- `.claude/rules/50-frontend.md`, itens 2a, 8 e 11; `.claude/rules/70-conformidade-cne.md`: aprovar não vira clique
  reflexo, e por isso o oficial tem desenho próprio
- Código: `apps/web/src/componentes/botao-secundario.ts` (a tabela de variantes e as constantes para `<button>` e
  `<a>` escritos à mão: as duas têm de dizer o mesmo botão) e o teste dela; `apps/web/src/componentes/Botao.tsx`;
  `apps/web/src/estilos.css`; `e2e/tokens.spec.ts` (o botão primário e o anel de foco)

## Subtarefas

- [ ] 3.1 — `estilos.css`: as classes `t-*` da 9.2; o **degrau** de um elemento só (`box-shadow` sólido de
  `--altura-degrau` em `--lado`, margem de baixo igual, e apertado com `translateY` e a sombra menor), com as
  classes de cor `degrau-laranja`, `degrau-grafite`, `degrau-borda`, `degrau-vermelho` e `degrau-azul`; o anel de
  foco de 3 px em `foco`, afastado 2 px; a regra global de `prefers-reduced-motion`. A sombra do degrau e a cor do
  hover **trocam sem transição**: só o `transform` anima, em 100 ms
- [ ] 3.2 — `botao-secundario.ts`: primário (face `laranja`, texto `sobre-cor`, degrau laranja), oficial (face
  `grafite`, texto `sobre-grafite`, degrau grafite), secundário (face `superficie`, borda de 2 px e degrau em
  `borda`), discreto (sem face nem degrau, texto `azul-texto`), perigo (como o secundário, texto e borda da família
  vermelha) e perigo cheio (face `vermelho`, texto `sobre-cor`; **só dentro da confirmação**). Desligado: sem
  degrau, face `borda`, texto `apoio` (o teste resolve a cor por tema e exige 4,5:1 contra a face). Tamanhos: `principal` com 44 px de face, `compacto` com 36 no computador e 44
  abaixo de 768, `icone` de 44. As constantes (`CLASSES_DO_BOTAO_*`) continuam dizendo o mesmo que a tabela
- [ ] 3.3 — A seção de botões da galeria (`galeria/secoes/botoes.tsx`): cada desenho, cada tamanho, ligado e
  desligado, com ícone e sem
- [ ] 3.4 — Os specs que afirmam a cor e a medida do botão e do foco (lista em "Como testar"): troque o `rgb()` e a
  medida, e mantenha a regra que cada um prova
- [ ] 3.5 — O teto de `pecas-*` sobe de 26 para 40 kB, em `.size-limit.json` e nos cinco casos de
  `tools/ci/tamanho-web.test.ts` (Tech Spec, 7c). Fica aqui, no tronco, porque as tarefas 4.0 a 10.0 correm em
  linhas e qualquer uma delas pode passar dos 26 kB primeiro
- [ ] 3.6 — Testes (tabela abaixo)

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/estilos.css` | alterado |
| `apps/web/src/estilos.test.ts` | alterado |
| `apps/web/src/componentes/botao-secundario.ts` | alterado |
| `apps/web/src/componentes/botao-secundario.test.ts` | alterado |
| `apps/web/src/componentes/Botao.tsx` | alterado |
| `apps/web/src/componentes/Botao.test.tsx` | novo |
| `apps/web/src/galeria/secoes/botoes.tsx` | alterado |
| `e2e/tokens.spec.ts` | alterado |
| `e2e/pecas-botoes.spec.ts` | alterado |
| `e2e/pedidos.spec.ts` | alterado |
| `e2e/professor-turma.spec.ts` | alterado |
| `e2e/professor-assistente.spec.ts` | alterado |
| `e2e/acesso-da-turma.spec.ts` | alterado |
| `e2e/material.spec.ts` | alterado |
| `e2e/__fixtures__/pedidos-do-titular.ts` | alterado |
| `docs/interface.md` | alterado (9.3 e 10.2, se a medida construída divergir) |
| `.size-limit.json`, `tools/ci/tamanho-web.test.ts` | alterados |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| só o oficial é grafite | unidade | a face e o degrau do oficial não são os de nenhuma outra variante, com os valores dos dois temas lidos do CSS (RF6) |
| contraste das classes de verdade | unidade | as classes de `classesDoBotao` de cada variante (face e texto: ligado, hover, apertado e desligado), resolvidas em hex por tema, têm 4,5:1 em cada combinação; mutação declarada: `disabled:text-sutil` no lugar de `disabled:text-apoio` fica vermelho no escuro |
| grafite só onde é oficial | unidade (guarda de `estilos.test.ts`) | `bg-grafite` e `bg-noite` (com `-alto` e `-baixo`) só aparecem como face na lista fechada: as constantes do oficial e os quatro usos de antes (`Atividade.tsx`, `Home.tsx`, `NavegacaoDaLista.tsx`, a dica de `itens-da-lateral.tsx`), cada um com a justificativa e a tarefa ou spec que o tira; arquivo novo com a classe reprova (RF6) |
| o teto das peças | unidade (`tools/ci/tamanho-web.test.ts`) | `pecas-*` de 40 kB passa e de 41 kB reprova; os tetos da entrada, das fachadas das áreas e da operação não mudaram |
| só o primário é laranja | unidade | nenhuma outra variante tem a face `laranja`; o texto em cima é `sobre-cor` |
| perigo cheio só com `cheio` | unidade e componente | sem `cheio`, o perigo nunca tem face vermelha; o tipo não aceita `cheio` em outra variante |
| a constante e a tabela dizem o mesmo botão | unidade | `CLASSES_DO_BOTAO_SECUNDARIO`, `_OFICIAL`, `_PERIGO` e `_PERIGO_CHEIO` iguais a `classesDoBotao` da variante |
| desligado é outro desenho | componente e e2e | sem degrau, com face e texto próprios; o clique não faz nada; distinguível do ligado sem depender de cor de marca |
| alvo de 44 px | e2e (`celular`) | toda variante e tamanho, na galeria; o `compacto` tem 36 só a partir de 768 |
| apertado sem hover | e2e (`celular`) | o toque desce a face (o `transform` muda) sem depender de ponteiro |
| a aprovação continua oficial, e a tela de aprovar não tem botão laranja | e2e | `pedidos`, `professor-turma` e `professor-assistente` continuam provando a regra, com o `rgb()` do grafite |
| no máximo um botão laranja por tela | e2e | `material` e `professor-turma` continuam contando |
| o anel de foco, nos dois temas | e2e | 3 px, afastado 2 px, na cor `foco`; a cor é medida, e não só a largura (RF7) |
| movimento reduzido | e2e | com `reducedMotion: 'reduce'`, apertar não desloca; e nenhuma propriedade além de `transform` e `opacity` tem transição no CSS servido (RF8) |
| o `rgb()` de cada spec | e2e | cada spec da lista passa, com a cor nova e a mesma asserção de regra |

A linha de log não se aplica. A de recomeço não se aplica: a tarefa não muda tela com sessão, link ou formulário.

## Como testar

- Copie `apps/web/src/componentes/botao-secundario.test.ts` (os sete casos de hoje): cada um ganha o equivalente,
  nenhum sai
- Cor e contraste no navegador: `e2e/tokens.spec.ts › botão primário` (`corDe`, `contraste`)
- Quem afirma cor de botão: `grep -rn "rgb(13, 13, 13)\|rgb(232, 115, 46)\|rgb(180, 35, 24)\|rounded-full" e2e apps/web/src --include='*.ts' --include='*.tsx'`
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/botao-secundario.test.ts apps/web/src/componentes/Botao.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/tokens.spec.ts e2e/pecas-botoes.spec.ts e2e/pedidos.spec.ts`
- Armadilha: há 77 `<button>` escritos à mão; os que usam as constantes mudam junto, e os de classe solta ficam
  como estão até a spec da área. Não os converta aqui
- Armadilha: a margem do degrau soma 4 px embaixo de cada botão; confira as barras presas (`BarraPresa`) e os rodapés
  de diálogo na foto
- Telas: `coordenacao`, `/coordenacao/estrutura`; `professora`, `/professor/turmas`; `aluno`, `/aluno/atividades`;
  `/galeria`. Mockup: `/fundamentos` (a seção Botões)

## Fora do escopo desta tarefa

Campos (4.0), cartões (5.0), diálogos (7.0); converter botão escrito à mão em `Botao`.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->
