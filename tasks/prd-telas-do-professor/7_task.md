# Tarefa 7.0 — Ferramentas: o catálogo por categoria

**Funcionalidade:** telas-do-professor · **Depende de:** 5.0
**Subagentes obrigatórios:** `frontend-reviewer`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Ferramentas mostra uma seção por categoria da D74 que tenha ferramenta, com um cartão de ícone ilustrado por
ferramenta. Só existem as três que o produto tem. A lista do que foi gerado já saiu (5.0).

## Contexto necessário

- `techspec.md` seção 9 (Ferramentas: grade, uma seção por categoria); `prd.md` RF10 e RF22; `mockup.md` 8
- D74 (categorias), D18 (o cartão leva ao mesmo motor); PRD seção 3: sem Simulado, sem "Também dá para só pedir" e sem
  "Que prova corrigir?"
- Código: `Ferramentas.tsx`; `ferramentas.ts` (`catalogoPorCategoria`, `CATALOGO_DE_FERRAMENTAS`);
  `icones-de-ferramenta.tsx` (da 3.0, o ícone por ferramenta)

## Subtarefas

- [x] 7.1 — `Ferramentas.tsx`: o `h1` "Ferramentas"; uma seção por categoria com ferramenta (Planejar, Preparar a aula,
  Avaliar; "Corrigir" não aparece, porque nenhuma ferramenta dela existe); o cartão é uma `Linha` de 108 px com o
  ícone de 48 px, o nome, a descrição em até 3 linhas e, se for o caso, o selo "Suspensa pela coordenação". Grade de
  3 colunas a partir de 1280 px, 2 a partir de 768, 1 abaixo. O `data-ferramenta` e o endereço do formulário ficam
- [x] 7.2 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/Ferramentas.tsx` | alterado |
| `apps/web/src/areas/professor/Ferramentas.test.tsx` | novo |
| `apps/web/src/areas/professor/ferramentas.test.ts` | alterado (a ordem das categorias) |
| `e2e/professor-ferramentas.spec.ts` | alterado (o catálogo; a lista foi para `professor-criados.spec.ts`) |

`ferramentas.ts` não muda aqui: a 8.0 o altera.

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| só as três | unidade | `catalogoPorCategoria` devolve plano de aula, Adaptação e atividade objetiva, nas categorias da D74, e nenhuma outra |
| categoria vazia | componente | "Corrigir" não aparece; nenhum cartão desligado ou "em breve" no lugar do que não existe |
| estados | componente | com a função suspensa, o cartão mostra o selo e o texto explica; a leitura do que está suspenso falha: os cartões ficam e um aviso diz que não foi possível conferir, com "Tentar de novo"; sem turma confirmada, um aviso leva a Turmas e os cartões ficam |
| o cartão leva ao motor | e2e | cada cartão abre `/professor/ferramentas/<id>`; o ícone é decoração (`aria-hidden`) e o nome acessível é o da ferramenta |
| 360 px e axe | e2e | uma coluna, sem rolar de lado, alvo de 44 px, sem violação grave, nos dois projetos |
| recomeço | e2e | a segunda pessoa na mesma aba vê o catálogo e o selo conforme a escola dela. Concorrência e log não se aplicam: só leitura |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`)
- e2e: o caso `o catálogo tem só as três ferramentas… nas categorias da D74` de
  `professor-assistente.spec.ts › Ferramentas (D74) e o formulário`, hoje em `professor-ferramentas.spec.ts`. Muda a
  estrutura do cartão; a asserção das três ferramentas fica
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/Ferramentas.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-ferramentas.spec.ts`
- Telas: `professora`, `/professor/ferramentas`, `--clicar 'role=link[name=/Ferramentas/]'`. Mockup: `/professor/ferramentas`

## Fora do escopo desta tarefa

O seletor "Para a turma" no cabeçalho, o Simulado ENEM, "Também dá para só pedir ao Assistente", "Que prova corrigir?",
as seis ferramentas que o produto não tem (F7, D55) e o texto "Como vai sair" (8.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O `data-ferramenta` mora no `<li>` do cartão, e não no link; o selo "Suspensa pela coordenação" fica embaixo da descrição, e não no `fim` da `Linha` | a `Linha` da X1 não aceita atributo, e a 768 px o cartão tem uns 340 px: o selo ao lado deixaria o nome sem lugar | techspec §9, "Ferramentas (divergências da 7.0)", item 1; `docs/interface.md` 1.2 |
| O título da categoria é `h2`, e o `h2` "Catálogo" só para leitor de tela saiu | o `CabecalhoDeSecao` é `h2`; com o `h1` da tela, a ordem dos títulos não pula | techspec §9, item 2 |
| A página lê também `GET /v1/meus-vinculos`, para o aviso "Falta uma turma confirmada" | a tabela de testes da tarefa pede o aviso que leva a Turmas; a rota já existe (a do Início) | techspec §9, item 3 |
| A leitura do time que falhou é `time.data === undefined && time.errorUpdateCount > 0`, e não `time.isError` | "Tentar de novo" põe a consulta de volta em `pending`; com `isError`, o aviso e o botão apertado somem e voltam, e o foco se perde | techspec §9, item 4 |
| `TEXTO_DA_SUSPENSAO.conversa_e_ferramentas` diz "continua em Criados" (dizia "em Ferramentas") | a lista saiu de Ferramentas na 5.0, e a frase agora aparece na própria página de Ferramentas | techspec §9, item 5 (`avisos.tsx`) |

## Mutações

Cada cláusula que a tarefa acrescenta ao código, com o teste que fica vermelho sem ela. O que é só classe de CSS (as colunas da grade, os 108 px de altura mínima, o alvo de 44 px) o `jsdom` não mede: o e2e mede as colunas a 1366 (3), a 800 (2) e a 360 (1), a altura e o alvo nos dois projetos (`professor-ferramentas.spec.ts › o catálogo tem só as três ferramentas…`), e o clique de cada cartão até o formulário (`› cada cartão abre o formulário`).

**`time.data === undefined`, primeiro termo de `leituraDoTimeFalhou`: com a resposta, o aviso sai**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramentas.tsx
teste: apps/web/src/areas/professor/Ferramentas.test.tsx › a leitura do time falha
  // aviso, com o botão que acabou de ser apertado, sumiria e voltaria (o foco se perderia no meio). Com a resposta, o aviso sai.
-  const leituraDoTimeFalhou = time.data === undefined && time.errorUpdateCount > 0
+  const leituraDoTimeFalhou = time.errorUpdateCount > 0
```

**`time.errorUpdateCount > 0`, segundo termo: antes de falhar não há aviso**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramentas.tsx
teste: apps/web/src/areas/professor/Ferramentas.test.tsx › o time ainda não respondeu
-  const leituraDoTimeFalhou = time.data === undefined && time.errorUpdateCount > 0
+  const leituraDoTimeFalhou = time.data === undefined
```

**o `new Set` das funções: a frase de uma função sai uma vez só**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramentas.tsx
teste: apps/web/src/areas/professor/Ferramentas.test.tsx › a conversa e as ferramentas suspensas
-const FUNCOES_DO_CATALOGO = [...new Set(CATALOGO_DE_FERRAMENTAS.map((item) => item.funcao))]
+const FUNCOES_DO_CATALOGO = CATALOGO_DE_FERRAMENTAS.map((item) => item.funcao)
```

**o filtro das funções suspensas: só a suspensa tem frase**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramentas.tsx
teste: apps/web/src/areas/professor/Ferramentas.test.tsx › só a Adaptação suspensa
-  const suspensas = FUNCOES_DO_CATALOGO.filter((funcao) => funcaoSuspensa(time.data, funcao))
+  const suspensas = FUNCOES_DO_CATALOGO
```

**o selo no cartão só com a função suspensa**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramentas.tsx
teste: apps/web/src/areas/professor/Ferramentas.test.tsx › sem nenhuma suspensa
                        {/* Embaixo do texto, e não no `fim` da linha: a 768 px o cartão tem uns 340 px, e o selo ao lado deixaria o nome sem lugar. */}
-                        {funcaoSuspensa(time.data, item.funcao) && (
+                        {true && (
```

**o selo lê a função do próprio cartão, e não uma fixa**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramentas.tsx
teste: apps/web/src/areas/professor/Ferramentas.test.tsx › a conversa e as ferramentas suspensas
-                        {funcaoSuspensa(time.data, item.funcao) && (
+                        {funcaoSuspensa(time.data, 'adaptacao') && (
```

**`onClick` de "Tentar de novo": lê o time outra vez**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramentas.tsx
teste: apps/web/src/areas/professor/Ferramentas.test.tsx › a leitura do time falha
-                <Botao variante="secundario" tamanho="compacto" onClick={() => void time.refetch()} disabled={time.isFetching}>
+                <Botao variante="secundario" tamanho="compacto" onClick={() => undefined} disabled={time.isFetching}>
```

**`disabled` de "Tentar de novo" enquanto a leitura corre**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramentas.tsx
teste: apps/web/src/areas/professor/Ferramentas.test.tsx › a leitura do time falha
-                <Botao variante="secundario" tamanho="compacto" onClick={() => void time.refetch()} disabled={time.isFetching}>
+                <Botao variante="secundario" tamanho="compacto" onClick={() => void time.refetch()}>
```

**o texto "Tentando de novo…" enquanto a leitura corre**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramentas.tsx
teste: apps/web/src/areas/professor/Ferramentas.test.tsx › a leitura do time falha
-                  {time.isFetching ? 'Tentando de novo…' : ''}
+                  {''}
```

**`vinculos.data !== undefined`, primeiro termo: o aviso não pisca enquanto os vínculos não chegam**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramentas.tsx
teste: apps/web/src/areas/professor/Ferramentas.test.tsx › enquanto os vínculos não chegam
-        {vinculos.data !== undefined && turmas.length === 0 && (
+        {turmas.length === 0 && (
```

**`vinculos.data !== undefined`: a leitura dos vínculos que falha não vira aviso de turma**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramentas.tsx
teste: apps/web/src/areas/professor/Ferramentas.test.tsx › a leitura dos vínculos que falha
-        {vinculos.data !== undefined && turmas.length === 0 && (
+        {!vinculos.isPending && turmas.length === 0 && (
```

**`turmas.length === 0`, segundo termo: com turma confirmada não há aviso**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramentas.tsx
teste: apps/web/src/areas/professor/Ferramentas.test.tsx › com uma turma confirmada não há aviso
-        {vinculos.data !== undefined && turmas.length === 0 && (
+        {vinculos.data !== undefined && (
```

**o destino de "Ir para Turmas"**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramentas.tsx
teste: apps/web/src/areas/professor/Ferramentas.test.tsx › sem vínculo nenhum
-              <Botao variante="secundario" tamanho="compacto" onClick={() => navegar(ROTAS_DO_PROFESSOR.turmas)}>
+              <Botao variante="secundario" tamanho="compacto" onClick={() => navegar(ROTAS_DO_PROFESSOR.ferramentas)}>
```

**o endereço do formulário no cartão**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramentas.tsx
teste: apps/web/src/areas/professor/Ferramentas.test.tsx › cada cartão leva ao formulário
-                    para={caminhoDaFerramentaDoProfessor(item.ferramenta)}
+                    para={ROTAS_DO_PROFESSOR.ferramentas}
```

**o ícone de 48 px**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramentas.tsx
teste: apps/web/src/areas/professor/Ferramentas.test.tsx › cada cartão leva ao formulário
-                    inicio={<IconeDeFerramenta ferramenta={item.ferramenta} tamanho={48} />}
+                    inicio={<IconeDeFerramenta ferramenta={item.ferramenta} tamanho={32} />}
```

**o corte da descrição em três linhas**

```mutacao
arquivo: apps/web/src/areas/professor/Ferramentas.tsx
teste: apps/web/src/areas/professor/Ferramentas.test.tsx › cada cartão leva ao formulário
-                        <span title={item.descricao} className="line-clamp-3">
+                        <span title={item.descricao}>
```

**a frase da suspensão aponta para Criados, onde a lista mora**

```mutacao
arquivo: apps/web/src/areas/professor/avisos.tsx
teste: apps/web/src/areas/professor/Ferramentas.test.tsx › a conversa e as ferramentas suspensas
-o que você já gerou continua em Criados. Fale
+o que você já gerou continua em Ferramentas. Fale
```


## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | Encurtar as descrições em `ferramentas.ts` até caberem em três linhas a 360 px (na Adaptação some "o conteúdo…") | A 8.0, que é a tarefa que altera `ferramentas.ts` (a 7.0 declara que ele não muda aqui) |
| frontend-reviewer (1ª) | Aviso curto com "Tentar de novo" quando a leitura dos vínculos falha | Não aplicada: muda comportamento e texto de tela. O revisor-geral e o frontend-reviewer aceitam o silêncio (a leitura só serve para avisar e não tira cartão); o item 3 deixa o silêncio fixado e dito |
| frontend-reviewer (1ª) | Rótulo "FERRAMENTAS" cortado em "FERRAMEN…" a 360 px na barra inferior e o nome da escola cortado no cabeçalho (`CascaDaEscola.tsx`) | Fora desta tarefa (arquivo da X1); vai ao Validador, que fotografa a casca nas telas da professora |
| frontend-reviewer (1ª) | Contraste do selo da suspensão (cor de família "info") no modo escuro | `/validar`, se a diferença para o cartão normal parecer fraca |
| test-engineer (1ª) | O aviso "Falta uma turma confirmada" olha só a primeira página de `/v1/meus-vinculos` | `/retro`, como dívida do padrão (mesmo padrão de `Home.tsx` e `CartaoDeFerramenta.tsx`; o próprio revisor diz que não é regressão) |
| revisor-geral (1ª) | Frase de apoio ao lado do título de cada seção (`CabecalhoDeSecao` aceita `apoio`; `mockup.md` 8 fala dela) | Não aplicada: é texto de tela fora da subtarefa 7.1, e nenhum documento da spec define as três frases. Vai ao Validador, que confere o RF10 contra o mockup |
| revisor-geral (1ª) | A 1366 px os cartões ocupam um terço da largura (uma ferramenta por seção em grade de 3 colunas) | Recusada: é o que o PRD manda (3 colunas a partir de 1280) e se corrige sozinha quando entrarem as outras ferramentas (F7) |
| revisor-geral (2ª) | O helper `naoApareceDepoisDaLeitura` só vale com o `retry` do QueryClient do teste desligado; uma linha no comentário do helper evita regressão silenciosa se o `retry` for ligado | `/retro`, como cuidado do padrão de teste "não aparece" com janela de tempo; não reabre a tarefa (o caso novo do silêncio dos vínculos já falha por 404, que o `deveTentarDeNovo` não repete) |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 08:27:06 | 2026-10-19 08:27:55 | `frontend-reviewer` | 1 | APROVADO | a473a08b678b6ef34 |
| 2026-10-19 08:27:09 | 2026-10-19 08:28:28 | `test-engineer` | 1 | APROVADO | a88babe4ecde081c3 |
| 2026-10-19 08:27:12 | 2026-10-19 08:28:45 | `revisor-geral` | 1 | APROVADO | a1a75fe106c0aa867 |
| 2026-10-19 08:45:06 | 2026-10-19 08:45:32 | `frontend-reviewer` | 2 | APROVADO | aa606c3d302ea2dbc |
| 2026-10-19 08:45:20 | 2026-10-19 08:45:52 | `revisor-geral` | 2 | APROVADO | ac6285abda9c2df8c |
| 2026-10-19 08:45:13 | 2026-10-19 08:46:03 | `test-engineer` | 2 | APROVADO | abb5876bcc4102575 |
