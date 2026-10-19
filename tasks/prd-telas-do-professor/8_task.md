# Tarefa 8.0 — O formulário da ferramenta com "Como vai sair"

**Funcionalidade:** telas-do-professor · **Depende de:** 7.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O formulário de uma ferramenta ganha, ao lado, "Como vai sair": um texto fixo que diz o que a ferramenta entrega e o que
acontece depois. O motor, os campos e o pedido são os de hoje.

## Contexto necessário

- `techspec.md` seção 9 (Formulário: o motor e, ao lado a partir de 1024 px, "Como vai sair"); `prd.md` RF11, RF21 e
  RF22; `mockup.md` 9.1 e 9.2, e a tabela das ferramentas em (b), só pela forma
- Regra 70, itens 2a e 3; D35 e D67: a Adaptação não tem campo de texto e não fala de aluno; D46: acertos e diagnóstico,
  nunca nota. O texto é fixo porque o motor não tem o que mostrar antes de gerar (PRD seção 10): nada de prévia
- Código: `Ferramenta.tsx`; `ferramentas.ts` (`CATALOGO_DE_FERRAMENTAS`); `CartaoDeFerramenta.tsx`, que não muda

## Subtarefas

- [x] 8.1 — `Ferramenta.tsx` em duas colunas a partir de 1024 px (o formulário e, ao lado, "Como vai sair"); abaixo, a
  coluna única, com "Como vai sair" depois do formulário. O texto fixo por ferramenta mora em `ferramentas.ts`
  (`COMO_VAI_SAIR`), de três linhas no máximo: o que sai, onde fica (Criados) e se vai à turma e como. A Adaptação diz
  que nasce esperando a aprovação e que só o tipo da adaptação é registrado
- [x] 8.2 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/Ferramenta.tsx`, `apps/web/src/areas/professor/ferramentas.ts` | alterado |
| `apps/web/src/areas/professor/ferramentas.test.ts` | alterado (o texto por ferramenta e o vocabulário) |
| `apps/web/src/areas/professor/Ferramenta.test.tsx` | novo |
| `e2e/professor-ferramentas.spec.ts` | alterado (a Adaptação sem campo de texto; a função suspensa) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| o texto por ferramenta | unidade | `COMO_VAI_SAIR` tem uma entrada por ferramenta do catálogo, de até três linhas; ferramenta nova sem texto reprova |
| o vocabulário | unidade | nenhum texto contém "nota", "conceito", "pontuação", "média", "ranking" nem "diagnóstico do aluno"; a Adaptação não cita aluno nem condição (D35) |
| estados do formulário | componente | carregando; erro com "Tentar de novo"; sem turma confirmada, com "Ir para Turmas"; função suspensa, com o aviso no lugar do formulário e "Como vai sair" ainda à vista; com dado |
| a Adaptação sem campo de texto | componente e e2e | só a atividade, os tipos da lista fechada e o tempo extra; nenhum `textarea` nem campo livre; o pedido manda só isso (caso de hoje) |
| sem prévia | componente | "Como vai sair" não muda ao preencher o formulário nem ao gerar: é o mesmo texto |
| o endereço de ferramenta que não existe | e2e | `/professor/ferramentas/xyz` responde como página não encontrada |
| 360 px e 1366 × 768 | e2e | uma coluna a 360 px, sem rolar de lado; duas colunas a 1366 px; o botão de gerar à vista |
| recomeço | e2e | o formulário aberto de novo começa em branco (`esquecerGeracaoTerminada`); a segunda pessoa na mesma aba não vê a geração da primeira. Concorrência: dois cliques em "Gerar" mandam um pedido (caso de hoje). Log não se aplica |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`)
- Vocabulário: o teste de `aprovar.test.ts` que varre os textos por palavra proibida, ampliado a `COMO_VAI_SAIR`
- e2e: `D35, D67: a Adaptação não tem campo de texto…` e `a função suspensa pela escola tira o formulário…`, hoje em
  `professor-ferramentas.spec.ts`; muda a estrutura (a segunda coluna), não a asserção
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/ferramentas.test.ts`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-ferramentas.spec.ts`
- Telas: `professora`, `/professor/ferramentas/atividade_objetiva`, `--clicar 'role=link[name=/Atividade/]'` em
  Ferramentas. Mockup: `/professor/ferramentas/redacao`, só pela composição

## Fora do escopo desta tarefa

"Mais opções" e os campos novos (BNCC, estilo, versões), anexo, busca na web, a declaração "De quem é este material?"
(D5, D75, D68); a janela de três passos da Adaptação e a escolha de alunos; Redação e discursiva (F7, D55); o cartão
dentro da conversa (4.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

nenhuma

## Mutações

Cada cláusula que a tarefa acrescenta, com o teste que fica vermelho sem ela. O que é só classe de CSS (as duas colunas a partir de 1024 px, a coluna que não se estica, a ordem) o `jsdom` não mede: o e2e mede nos dois projetos, a 1366 (duas colunas, o texto à direita e mais baixo que o formulário) e a 360 (uma coluna, o texto depois do formulário), em `professor-ferramentas.spec.ts › a 1366 px o formulário e, ao lado…`.

**`lg:grid-cols-[…]`: duas colunas a partir de 1024 px**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramenta.tsx
teste: e2e/professor-ferramentas.spec.ts › a 1366 px o formulário e, ao lado
-      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
+      <div className="grid min-w-0 gap-4 lg:items-start">
```

**`lg:items-start`: a coluna do texto tem a altura do texto**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramenta.tsx
teste: e2e/professor-ferramentas.spec.ts › a 1366 px o formulário e, ao lado
-      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
+      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
```

**o texto vem depois do formulário (`order-first` o poria antes)**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramenta.tsx
teste: e2e/professor-ferramentas.spec.ts › a 1366 px o formulário e, ao lado
-        <aside aria-labelledby={idDoComoVaiSair} data-como-vai-sair={ferramenta} className="min-w-0 rounded-cartao border border-linha bg-superficie p-4">
+        <aside aria-labelledby={idDoComoVaiSair} data-como-vai-sair={ferramenta} className="order-first min-w-0 rounded-cartao border border-linha bg-superficie p-4">
```

**`aria-labelledby` da região: o leitor de tela a acha pelo nome**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramenta.tsx
teste: apps/web/src/areas/professor/Ferramenta.test.tsx › com dado, o formulário e o texto fixo da ferramenta
-        <aside aria-labelledby={idDoComoVaiSair} data-como-vai-sair={ferramenta} className="min-w-0 rounded-cartao border border-linha bg-superficie p-4">
+        <aside data-como-vai-sair={ferramenta} className="min-w-0 rounded-cartao border border-linha bg-superficie p-4">
```

**o `id` do título, a que a região aponta**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramenta.tsx
teste: apps/web/src/areas/professor/Ferramenta.test.tsx › com dado, o formulário e o texto fixo da ferramenta
-          <CabecalhoDeSecao titulo="Como vai sair" id={idDoComoVaiSair} />
+          <CabecalhoDeSecao titulo="Como vai sair" />
```

**`data-como-vai-sair={ferramenta}`: a região é a da ferramenta aberta**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramenta.tsx
teste: apps/web/src/areas/professor/Ferramenta.test.tsx › com dado, o formulário e o texto fixo da ferramenta
-        <aside aria-labelledby={idDoComoVaiSair} data-como-vai-sair={ferramenta} className="min-w-0 rounded-cartao border border-linha bg-superficie p-4">
+        <aside aria-labelledby={idDoComoVaiSair} data-como-vai-sair="atividade_objetiva" className="min-w-0 rounded-cartao border border-linha bg-superficie p-4">
```

**as linhas são as da ferramenta aberta, e não de uma fixa**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramenta.tsx
teste: apps/web/src/areas/professor/Ferramenta.test.tsx › com dado, o formulário e o texto fixo da ferramenta
-            {COMO_VAI_SAIR[ferramenta].map((linha) => (
+            {COMO_VAI_SAIR.atividade_objetiva.map((linha) => (
```

**o texto de cada ferramenta existe (`COMO_VAI_SAIR` sem a Adaptação)**

```mutacao
arquivo: apps/web/src/areas/professor/ferramentas.ts
teste: apps/web/src/areas/professor/ferramentas.test.ts › há um texto por ferramenta do catálogo
     'Não vai à turma: é só seu.',
   ],
-  adaptacao: [
-    'A mesma atividade em outra forma, cobrando o mesmo conteúdo.',
-    'Nasce esperando a sua aprovação e fica em Criados. Só o tipo da adaptação é registrado.',
-    'Depois de aprovada, vai à turma quando você escolher “Aplicar à turma”.',
-  ],
 }
```

**no máximo três linhas**

```mutacao
arquivo: apps/web/src/areas/professor/ferramentas.ts
teste: apps/web/src/areas/professor/ferramentas.test.ts › há um texto por ferramenta do catálogo
     'Fica em Criados.',
-    'Não vai à turma: é só seu.',
+    'Não vai à turma: é só seu.',
+    'Mais uma linha que passa de três.',
   ],
```

**onde fica: "Criados"**

```mutacao
arquivo: apps/web/src/areas/professor/ferramentas.ts
teste: apps/web/src/areas/professor/ferramentas.test.ts › diz o que sai, onde fica
     'Objetivos, etapas com o tempo de cada uma e como avaliar, com a página do material.',
-    'Fica em Criados.',
+    'Fica guardado.',
     'Não vai à turma: é só seu.',
```

**o plano é só da professora**

```mutacao
arquivo: apps/web/src/areas/professor/ferramentas.ts
teste: apps/web/src/areas/professor/ferramentas.test.ts › diz o que sai, onde fica
     'Fica em Criados.',
-    'Não vai à turma: é só seu.',
+    'Fica à vista da turma.',
   ],
```

**a atividade só vai à turma quando ela escolhe "Aplicar à turma"**

```mutacao
arquivo: apps/web/src/areas/professor/ferramentas.ts
teste: apps/web/src/areas/professor/ferramentas.test.ts › diz o que sai, onde fica
-    'Só vai à turma quando você escolher “Aplicar à turma”.',
+    'Vai à turma.',
```

**a versão adaptada nasce esperando a aprovação**

```mutacao
arquivo: apps/web/src/areas/professor/ferramentas.ts
teste: apps/web/src/areas/professor/ferramentas.test.ts › diz o que sai, onde fica
-    'Nasce esperando a sua aprovação e fica em Criados. Só o tipo da adaptação é registrado.',
+    'Nasce pronta e fica em Criados. Só o tipo da adaptação é registrado.',
```

**só o tipo da adaptação é registrado**

```mutacao
arquivo: apps/web/src/areas/professor/ferramentas.ts
teste: apps/web/src/areas/professor/ferramentas.test.ts › diz o que sai, onde fica
-    'Nasce esperando a sua aprovação e fica em Criados. Só o tipo da adaptação é registrado.',
+    'Nasce esperando a sua aprovação e fica em Criados.',
```

**a versão adaptada aprovada vai à turma por "Aplicar à turma" (ordem da rodada 1, item 1)**

```mutacao
arquivo: apps/web/src/areas/professor/ferramentas.ts
teste: apps/web/src/areas/professor/ferramentas.test.ts › diz o que sai, onde fica
-    'Depois de aprovada, vai à turma quando você escolher “Aplicar à turma”.',
+    'Depois de aprovada, vai à turma.',
```

**as aspas são as tipográficas (item 2)**

```mutacao
arquivo: apps/web/src/areas/professor/ferramentas.ts
teste: apps/web/src/areas/professor/ferramentas.test.ts › as aspas são as tipográficas
-    'Só vai à turma quando você escolher “Aplicar à turma”.',
+    'Só vai à turma quando você escolher "Aplicar à turma".',
```

**o vocabulário pega o plural "médias" (item 3)**

```mutacao
arquivo: apps/web/src/areas/professor/ferramentas.test.ts
teste: apps/web/src/areas/professor/ferramentas.test.ts › as listas de palavras proibidas
-const VOCABULARIO_PROIBIDO = /\bnotas?\b|\bconceitos?\b|pontua|\bmédias?\b|ranking|diagn[óo]stico do aluno/i
+const VOCABULARIO_PROIBIDO = /\bnotas?\b|\bconceitos?\b|pontua|\bmédia\b|ranking|diagn[óo]stico do aluno/i
```

**o "Tempo extra", que aparece depois do clique, também é lista fechada (item 4)**

```mutacao
arquivo: apps/web/src/areas/professor/ferramentas.ts
teste: apps/web/src/areas/professor/Ferramenta.test.tsx › pede só a atividade, os tipos da lista fechada e o tempo extra
-  const tempoExtra: CampoDeSelecao = { tipo: 'selecao', chave: 'tempoExtra', rotulo: 'Tempo extra', dica: 'Sem escolher, a escola decide o tempo.', opcoes: TEMPOS_EXTRAS, quando: { campo: 'tipos', contem: 'tempo_adicional' } }
+  const tempoExtra = { tipo: 'texto', chave: 'tempoExtra', rotulo: 'Tempo extra', dica: 'Sem escolher, a escola decide o tempo.', maximo: 20, quando: { campo: 'tipos', contem: 'tempo_adicional' } } as unknown as CampoDeSelecao
```

**a região é irmã da caixa do formulário, na mesma grade, e não está dentro dela (item 5: o teste de componente não conta as camadas de `div`; a posição é medida no e2e)**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramenta.tsx
teste: e2e/professor-ferramentas.spec.ts › a 1366 px o formulário e, ao lado
           <CartaoDeFerramenta ferramenta={ferramenta} nivel={2} {...(iniciais === undefined ? {} : { iniciais })} />
-        </div>
         {/* Fora do cartão: carregando, erro, sem turma e função suspensa não o tiram da tela. */}
         <aside aria-labelledby={idDoComoVaiSair} data-como-vai-sair={ferramenta} className="min-w-0 rounded-cartao border border-linha bg-superficie p-4">
           <CabecalhoDeSecao titulo="Como vai sair" id={idDoComoVaiSair} />
           <ul className="mt-2 flex flex-col gap-2 text-sm break-words text-tinta">
             {COMO_VAI_SAIR[ferramenta].map((linha) => (
               <li key={linha}>{linha}</li>
             ))}
           </ul>
         </aside>
+        </div>
```

**dois cliques mandam um pedido só: a contagem é fixada num ponto estável, não no primeiro instante em que chega a 1 (item 8)**

```mutacao
arquivo: apps/web/src/api/ciclo-de-execucao.ts
teste: e2e/professor-ferramentas.spec.ts › dois cliques em "Gerar" mandam um pedido só
-  if (emCurso(atual)) return undefined
   return { etapa: 'enviando', pedido, chaveEnvio: sortear(), desde: agora }
```

**D46: nenhuma palavra de nota no texto**

```mutacao
arquivo: apps/web/src/areas/professor/ferramentas.ts
teste: apps/web/src/areas/professor/ferramentas.test.ts › D46, RF21
-    'Fica em Criados, para você revisar.',
+    'Fica em Criados, com a nota de cada questão.',
```

**D35: o texto da Adaptação não cita aluno**

```mutacao
arquivo: apps/web/src/areas/professor/ferramentas.ts
teste: apps/web/src/areas/professor/ferramentas.test.ts › D35: o texto da Adaptação não cita aluno
-    'A mesma atividade em outra forma, cobrando o mesmo conteúdo.',
+    'A mesma atividade em outra forma, para cada aluno.',
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | A descrição da ferramenta, acima do formulário, e a primeira linha de "Como vai sair" repetem quase o mesmo (Atividade objetiva, Plano de aula, Adaptação); diferenciar depois do F7 | `TODO.md`: a descrição de cada ferramenta e o texto do "Como vai sair" voltam à mesa quando o F7 acrescentar ferramentas |
| frontend-reviewer (1ª) | Na Adaptação, a linha que junta duas ideias quebra em três linhas visuais no celular; separar só passaria o texto para a quarta linha | Sem ação: o revisor diz "fica como está, é só observação". O item 1 da ordem da rodada 1 já tira a frase do tipo da adaptação dessa linha |
| conformidade-reviewer (1ª) | O texto não diz que quem gera o conteúdo é a IA ("A IA gera…") | Recusada: o texto são três linhas com dono (o que sai, onde fica, se vai à turma), e o revisor diz que não bloqueia porque o artefato já leva o rótulo de IA (regra 70, item 4a). Entra nos textos só se o produto mudar o rótulo |
| conformidade-reviewer (1ª) | A atividade objetiva vai ao aluno por "Aplicar à turma", sem entrega com rejeição e justificativa (regra 70, item 3); registrar se "não aplicar" conta como a rejeição | `TODO.md` e `/retro`: já existia antes da tarefa, que não muda nada aí; decisão de produto antes do piloto |
| revisor-geral (2ª) e test-engineer (2ª) | O teste de componente da grade (`Ferramenta.test.tsx`, `bloco.parentElement` contém o cartão) não prova sozinho que os dois estão na mesma grade; amarrar a um atributo, como `closest('[data-grade-da-ferramenta]')` | Sem aplicar: o e2e mede as duas colunas e o bloco de mutação do item aponta para ele; os dois revisores aprovaram e dizem que não bloqueia |
| test-engineer (2ª) | O botão da Adaptação a 1366 × 768 só é medido com o formulário no estado inicial; com "Tempo adicional" marcado ele pode sair dos 768 px | Sem aplicar, com destino: a tarefa do e2e das ferramentas que tocar o formulário mede o estado com a caixa marcada |
| frontend-reviewer (2ª) | Incluir o `plano_de_aula` na cópia do texto no e2e quando houver tarefa que o altere; fotografar o celular por pedaços para ver o fim da página | Sem aplicar: o plano é coberto pela unidade e pelo componente, e o comentário do e2e diz isso; a barra fixa sobre as fotos de celular é efeito da captura de página inteira (frontend-reviewer, revisor-geral, conformidade e test-engineer concordam) |
| frontend-reviewer (2ª) | A Adaptação repete "Nasce esperando a sua aprovação" na tela e no texto de ajuda | Sem ação: o revisor diz "é aceitável hoje" |
| conformidade-reviewer (2ª) | Os dois itens da 1ª rodada (a entrega com rejeição da atividade objetiva; o rótulo "A IA gera…") continuam valendo | Já têm destino na tabela da 1ª rodada |
| revisor-geral (2ª) | As linhas da tabela que apontam o `TODO.md` não têm item lá | Feito: os dois itens estão em `TODO.md`, na seção "Produto" (a descrição de cada ferramenta e o "Como vai sair"; a atividade objetiva sem entrega com rejeição) |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 11:03:08 | 2026-10-19 11:03:49 | `frontend-reviewer` | 1 | APROVADO | a86cf6931044ab95a |
| 2026-10-19 11:03:13 | 2026-10-19 11:03:58 | `conformidade-reviewer` | 1 | APROVADO | a134e41aa9c7694a1 |
| 2026-10-19 11:03:21 | 2026-10-19 11:04:12 | `revisor-geral` | 1 | APROVADO | a1fe02c91214a2d08 |
| 2026-10-19 11:03:17 | 2026-10-19 11:04:29 | `test-engineer` | 1 | APROVADO | af53ecaa7d19059df |
| 2026-10-19 12:29:33 | 2026-10-19 12:29:55 | `frontend-reviewer` | 2 | APROVADO | a9928456e02230085 |
| 2026-10-19 12:29:40 | 2026-10-19 12:30:27 | `conformidade-reviewer` | 2 | APROVADO | a7cfcf8e9e7b86fdb |
| 2026-10-19 12:29:55 | 2026-10-19 12:30:51 | `revisor-geral` | 2 | APROVADO | a2eab1062143a41ce |
| 2026-10-19 12:29:48 | 2026-10-19 12:31:09 | `test-engineer` | 2 | APROVADO | a8562fa99b8dcbd57 |
