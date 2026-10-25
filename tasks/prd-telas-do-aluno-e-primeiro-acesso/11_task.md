# Tarefa 11.0 — A introdução da coordenação

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** 10.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A coordenação vê, na primeira entrada, quatro passos: o que vê em agregado, o que só abre com finalidade registrada e o que a IA
nunca faz; pode pular e rever.

## Contexto necessário

- `techspec.md` seções 5 e 9; `prd.md` RF12, RF15 a RF18 e o caso do aviso de incidente (seção 7); `tasks/prd-telas-da-coordenacao/mockup.md`
  seção 7 e fechamento (d)
- Regras 20 (itens 10 e 10a) e 70 (itens 2, 8 e 9); D45, D55, D57 e D64
- Código: `paginas/Inicio.tsx` (a tabela da 9.0 e da 10.0); `areas/coordenacao/rotas.tsx`; `areas/coordenacao/governanca/nunca-faz.ts`
  (`O_QUE_A_IA_NUNCA_FAZ`); `areas/coordenacao/privacidade/AvisoDeIncidente.tsx`; `areas/professor/introducao/BemVindo.tsx`, como modelo
- Depois da 10.0: as três editam `paginas/Inicio.tsx`, `casca.ts`, `escola-montada.spec.ts` e o roteiro

## Subtarefas

- [x] 11.1 — `areas/coordenacao/introducao/textos-da-introducao.ts` e `BemVindo.tsx` (`lazy()`, `tela-coordenacao-BemVindo`), a rota e a entrada
  `coordenador` na tabela de `paginas/Inicio.tsx`. Os passos, com a onça e "Analista de desempenho escolar" e o selo "IA":
  (1) "Eu ajudo a ler os números da <escola>." (2) "Você vê a escola em números agregados." e "O desempenho de professores só aparece
  com dois ou mais no grupo." (3) "Dado com nome só abre com um motivo, e isso fica registrado." (4) "Estas coisas a IA nunca faz.",
  com a lista de `O_QUE_A_IA_NUNCA_FAZ`. "Pular" e "Continuar" iguais. O fim lista "onde fica cada coisa" **lendo
  `NAVEGACAO.coordenador`**, e "Começar" leva ao primeiro lugar dela (desde a X3, "Painel")
- [x] 11.2 — "Rever a introdução" no menu da pessoa da coordenação (`MENU_DA_PESSOA.coordenador`), antes do "Sair"
- [x] 11.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/introducao/textos-da-introducao.ts`, `apps/web/src/areas/coordenacao/introducao/textos-da-introducao.test.ts`, `apps/web/src/areas/coordenacao/introducao/BemVindo.tsx`, `apps/web/src/areas/coordenacao/introducao/BemVindo.test.tsx`, `e2e/coordenacao-introducao.spec.ts` | novo |
| `apps/web/src/areas/coordenacao/rotas.tsx`, `apps/web/src/areas/navegacao.ts`, `apps/web/src/areas/navegacao.test.ts`, `apps/web/src/paginas/Inicio.tsx` | alterado |
| `e2e/__fixtures__/casca.ts`, `e2e/escola-montada.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| os textos (RF15) | unidade | agregado, nominal com motivo e o que a IA nunca faz; sem "ranking", "meta de uso" nem fala de sentimento |
| onde fica cada coisa | componente | a lista sai de `NAVEGACAO.coordenador` |
| primeira entrada: convite e segundo fator | e2e | convite, senha, segundo fator e login caem em `/coordenacao/bem-vindo` (`criarConviteDeCoordenador`, `entrarComoCoordenacaoNaMesmaAba`) |
| pular | componente + e2e | "Pular" grava a data, vai ao primeiro lugar ("Painel"), e a entrada seguinte não volta |
| botões iguais | componente | "Pular" e "Continuar" com a mesma classe |
| falas (regra 70, item 4a; D58) | unidade | texto fixo em `.ts`; reprova afirmar ser pessoa, professor ou amigo, prometer voltar, esperar ou estar sempre ali, e termos de vínculo ou saudade |
| quatro estados da `BemVindo` | componente | carregando (a fala do passo 1, "Sair" à vista, sem "Fechar" nem "Pular"); erro com `EstadoErro`, "Tentar de novo", "Voltar para a abertura" e "Sair"; data desconhecida vale o modo primeira vez; com dado, os passos |
| rever | e2e | menu da pessoa › "Rever a introdução": todo passo fecha, a data não muda |
| aviso de incidente por cima | e2e | com incidente pendente, o aviso aparece sobre a introdução; "Ver depois" o fecha e a introdução continua; confirmar o incidente não a marca como vista |
| a coordenação não sabe quem viu (D64) | e2e | `page.request` em `/v1/professores`: nenhum campo com "introducao" na resposta |
| recomeço da tela | e2e | a coordenadora seguinte no mesmo computador vê a introdução dela |
| 360 px | e2e | sem rolagem lateral, botões de 44 px |

Isolamento e concorrência são da 1.0; carregando e erro do desvio em `/`, os da `Inicio`; os da `BemVindo`, a linha da tabela.

## Como testar

- Copie `ListaDePedidos.test.tsx` (`componentes/pedidos/`); o incidente como em `e2e/incidentes.spec.ts`
- `escola-montada` e o roteiro: a coordenadora criada por convite passa pela introdução (helper em `casca.ts`)
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/introducao/textos-da-introducao.test.ts` e
  `node tools/ci/e2e.ts --manter-ambiente e2e/coordenacao-introducao.spec.ts`
- Telas: `coordenacao`, `/coordenacao/bem-vindo` (convite, senha, segundo fator; ou o menu da pessoa › "Rever a introdução"); mockup
  `/coordenacao/bem-vindo`

## Fora do escopo desta tarefa

Resumo de segunda e o sino, o Analista em conversa e a trilha de montagem da escola (a introdução só grava a data); a introdução da
rede e a da operação.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A fala do passo 1 diz "Eu ajudo a ler os números **de** <escola>.", e não "da <escola>."; enquanto o nome não chegou, o carregando diz "da sua escola" | O nome vem como a escola o escreveu ("Colégio …", "Escola …", "Instituto …"): "da Colégio Vista Alegre" é erro de concordância na primeira tela que a coordenação lê, e o código não conhece o artigo certo de cada nome | `techspec.md` §9, parágrafo "A introdução da coordenação" |
| Os estados de carregando e de erro da `BemVindo` saem do aluno e do professor para `componentes/introducao/IntroducaoDoPapel.tsx`, e a lista "Onde fica cada coisa" para `OndeFicaCadaCoisa.tsx`; as duas telas anteriores passam a usá-los (sem mudar comportamento) e a da coordenação os usa | A coordenação seria a terceira cópia; o `revisor-geral` (1ª rodada da 10.0) e o `infra-guardian` pediram a peça comum para esta tarefa | `techspec.md` §9, "Peças novas" (`IntroducaoDoPapel` e `OndeFicaCadaCoisa`) |
| O passo 4 da coordenação traz a lista do que a IA nunca faz **e** "onde fica cada coisa", as duas dentro da região que rola; o último "Continuar" é o "Começar" e não há tela depois | São quatro passos e nenhuma tela de fim (Tech Spec §9); a lista de onze frases e a de lugares não cabem a 1366 × 768 ao lado da onça (RF20) | `techspec.md` §9, parágrafo "A introdução da coordenação" |
| `e2e/escola-montada.spec.ts` não muda; o roteiro da demonstração é quem passa a atravessar a introdução da coordenação | A coordenadora do W1 nasce pela fixture (`criarEquipeComSenha`), com a introdução já vista; só o roteiro cria a coordenação pelo convite da operação, e por isso só ele a encontra | `11_task.md`, "Arquivos previstos" (a linha de `escola-montada.spec.ts` não se aplica) |
| A coordenação ganha o link "Rever a introdução" no menu da pessoa, e a casca passa a desenhar "Sua conta" para ela; `e2e/casca.spec.ts` (`PAPEIS_DA_CASCA`), `navegacao.test.ts` e `itens-da-lateral.test.tsx` listavam a coordenação sem esse menu | Lista fechada que a tarefa 11.2 muda (passo 4 de `executar-task`) | `techspec.md` §5, "Rever", e `11_task.md`, subtarefa 11.2 |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/componentes/introducao/IntroducaoDoPapel.tsx
teste: apps/web/src/areas/coordenacao/introducao/BemVindo.test.tsx › mostra a fala do passo 1 e o "Sair", sem "Fechar"
-  if (eu.data === undefined && eu.isError) {
+  if (eu.data === undefined) {
```

```mutacao
arquivo: apps/web/src/componentes/introducao/IntroducaoDoPapel.tsx
teste: apps/web/src/areas/coordenacao/introducao/BemVindo.test.tsx › uma releitura do `/v1/eu` que falha não tira os passos da tela
-  if (eu.data === undefined && eu.isError) {
+  if (eu.isError) {
```

```mutacao
arquivo: apps/web/src/componentes/introducao/IntroducaoDoPapel.tsx
teste: apps/web/src/areas/aluno/introducao/BemVindo.test.tsx › mostra a fala do passo 1 e o "Sair", sem "Fechar"
-  if (eu.data === undefined) {
+  if (false) {
    return (
      <TelaDeFoco passo={1} total={totalDePassos} idDoPasso={idDoPasso} rodape={null}>
```

```mutacao
arquivo: apps/web/src/componentes/introducao/IntroducaoDoPapel.tsx
teste: apps/web/src/areas/coordenacao/introducao/BemVindo.test.tsx › com a data já gravada, "Fechar" está em todo passo
-  return <Introducao passos={passosDe(eu.data)} agente={agente} revendo={revendo} aoConcluir={terminar} aoPular={terminar} />
+  return <Introducao passos={passosDe(eu.data)} agente={agente} aoConcluir={terminar} aoPular={terminar} />
```

```mutacao
arquivo: apps/web/src/componentes/introducao/IntroducaoDoPapel.tsx
teste: apps/web/src/areas/aluno/introducao/BemVindo.test.tsx › diz o erro com "Tentar de novo"
-          <Link to={aoTerminar} replace className={`${CLASSES_DO_LINK_SECUNDARIO} flex-1`}>
+          <Link to={aoRever} replace className={`${CLASSES_DO_LINK_SECUNDARIO} flex-1`}>
```

```mutacao
arquivo: apps/web/src/componentes/introducao/OndeFicaCadaCoisa.tsx
teste: apps/web/src/areas/coordenacao/introducao/BemVindo.test.tsx › "onde fica cada coisa" só aparece no último passo
-        {lugares.map((lugar) => (
+        {lugares.slice(1).map((lugar) => (
```

```mutacao
arquivo: apps/web/src/componentes/introducao/OndeFicaCadaCoisa.tsx
teste: apps/web/src/areas/coordenacao/introducao/BemVindo.test.tsx › "onde fica cada coisa" só aparece no último passo
-            <span className="text-sutil"> · {descricoes[lugar.rotulo]}</span>
+            <span className="text-sutil"> · </span>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/BemVindo.tsx
teste: apps/web/src/areas/coordenacao/introducao/BemVindo.test.tsx › o passo 4 lista o que a IA nunca faz
-  if (!ultimo) return <Linhas linhas={linhas} />
+  if (true) return <Linhas linhas={linhas} />
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/BemVindo.tsx
teste: apps/web/src/areas/coordenacao/introducao/BemVindo.test.tsx › "onde fica cada coisa" só aparece no último passo
-    conteudo: conteudoDoPasso(passo.linhas, indice === PASSOS_DA_COORDENACAO.length - 1),
+    conteudo: conteudoDoPasso(passo.linhas, indice === 0),
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/BemVindo.tsx
teste: apps/web/src/areas/coordenacao/introducao/BemVindo.test.tsx › "onde fica cada coisa" só aparece no último passo
      <ListaDoQueANuncaFaz frases={linhas} />
-      <OndeFicaCadaCoisa titulo={TITULO_DE_ONDE_FICA_CADA_COISA} lugares={NAVEGACAO.coordenador} descricoes={DESCRICAO_DO_LUGAR} />
+      {null}
    </RegiaoQueRola>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/BemVindo.tsx
teste: apps/web/src/areas/coordenacao/introducao/BemVindo.test.tsx › "onde fica cada coisa" só aparece no último passo
-      <OndeFicaCadaCoisa titulo={TITULO_DE_ONDE_FICA_CADA_COISA} lugares={NAVEGACAO.coordenador} descricoes={DESCRICAO_DO_LUGAR} />
+      <OndeFicaCadaCoisa titulo={TITULO_DE_ONDE_FICA_CADA_COISA} lugares={NAVEGACAO.coordenador.slice(1)} descricoes={DESCRICAO_DO_LUGAR} />
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/BemVindo.tsx
teste: apps/web/src/areas/coordenacao/introducao/BemVindo.test.tsx › "Pular" no passo 1 grava a data
-const PRIMEIRO_LUGAR = `~${NAVEGACAO.coordenador[0]?.caminho ?? ROTAS.painel}`
+const PRIMEIRO_LUGAR = `${NAVEGACAO.coordenador[0]?.caminho ?? ROTAS.painel}`
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/BemVindo.tsx
teste: apps/web/src/areas/coordenacao/introducao/BemVindo.test.tsx › cada passo mostra as frases dele
-    fala: falas[indice] ?? '',
+    fala: falas[0] ?? '',
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/BemVindo.tsx
teste: apps/web/src/areas/coordenacao/introducao/BemVindo.test.tsx › o passo 1 diz o nome da escola que o
-      passosDe={(eu) => passosDaCoordenacao(eu.escola.nome)}
+      passosDe={() => passosDaCoordenacao('')}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/BemVindo.tsx
teste: e2e/coordenacao-introducao.spec.ts › os quatro passos levam ao Painel
-    <RegiaoQueRola nome="Leia até o fim" alturaMaxima="max-h-[34dvh]">
+    <RegiaoQueRola nome="Leia até o fim" alturaMaxima="max-h-none">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/BemVindo.tsx
teste: e2e/coordenacao-introducao.spec.ts › os quatro passos levam ao Painel
-    <RegiaoQueRola nome="Leia até o fim" alturaMaxima="max-h-[34dvh]">
+    <>
      <ListaDoQueANuncaFaz frases={linhas} />
      <OndeFicaCadaCoisa titulo={TITULO_DE_ONDE_FICA_CADA_COISA} lugares={NAVEGACAO.coordenador} descricoes={DESCRICAO_DO_LUGAR} />
-    </RegiaoQueRola>
+    </>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.test.ts › o nome da escola vem depois de
-  return nomeDaEscola === undefined ? 'Eu ajudo a ler os números da sua escola.' : `Eu ajudo a ler os números de ${nomeDaEscola}.`
+  return nomeDaEscola !== undefined ? 'Eu ajudo a ler os números da sua escola.' : `Eu ajudo a ler os números de ${nomeDaEscola}.`
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.test.ts › as falas são as da tarefa
-export const FALA_DO_PASSO_2 = 'Você vê a escola em números agregados.'
+export const FALA_DO_PASSO_2 = 'Você vê a escola.'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.test.ts › as falas são as da tarefa
-export const FALA_DO_PASSO_3 = 'Dado com nome só abre com um motivo, e isso fica registrado.'
+export const FALA_DO_PASSO_3 = 'Dado com nome só abre com um motivo.'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.test.ts › as falas são as da tarefa
-export const FALA_DO_PASSO_4 = 'Estas coisas a IA nunca faz.'
+export const FALA_DO_PASSO_4 = 'Estas coisas a IA faz.'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.test.ts › o passo 1 diz que a IA prepara e avisa
-    linhas: ['Eu preparo e aviso. Quem aprova é a escola.', 'Eu sou um programa e posso errar.'],
+    linhas: ['Eu sou um programa e posso errar.'],
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.test.ts › o passo 1 diz que a IA prepara e avisa
-    linhas: ['Eu preparo e aviso. Quem aprova é a escola.', 'Eu sou um programa e posso errar.'],
+    linhas: ['Eu preparo e aviso. Quem aprova é a escola.'],
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.test.ts › o passo 2 diz que a escola se vê em números agregados
-    linhas: ['Turma, série e disciplina aparecem somadas, sem nome de pessoa.', 'O desempenho de professores só aparece com dois ou mais no grupo.'],
+    linhas: ['O desempenho de professores só aparece com dois ou mais no grupo.'],
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.test.ts › o passo 2 diz que a escola se vê em números agregados
-    linhas: ['Turma, série e disciplina aparecem somadas, sem nome de pessoa.', 'O desempenho de professores só aparece com dois ou mais no grupo.'],
+    linhas: ['Turma, série e disciplina aparecem somadas, sem nome de pessoa.'],
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.test.ts › o passo 3 diz que o dado com nome só abre com um motivo
-    linhas: ['Abrir um aluno ou um professor pelo nome pede um motivo.', 'O registro guarda quem abriu, quando e para quê.'],
+    linhas: ['Abrir um aluno ou um professor pelo nome pede um motivo.'],
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.test.ts › o passo 3 diz que o dado com nome só abre com um motivo
-    linhas: ['Abrir um aluno ou um professor pelo nome pede um motivo.', 'O registro guarda quem abriu, quando e para quê.'],
+    linhas: ['O registro guarda quem abriu, quando e para quê.'],
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.test.ts › o passo 4 traz a lista do que a IA nunca faz
-    linhas: O_QUE_A_IA_NUNCA_FAZ,
+    linhas: O_QUE_A_IA_NUNCA_FAZ.slice(1),
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.test.ts › nenhum é obrigatório
    linhas: ['Eu preparo e aviso. Quem aprova é a escola.', 'Eu sou um programa e posso errar.'],
-    obrigatorio: false,
+    obrigatorio: true,
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.test.ts › quem fala é o Analista de desempenho escolar
-export const AGENTE_DA_INTRODUCAO: Agente = 'analista_de_desempenho_escolar'
+export const AGENTE_DA_INTRODUCAO: Agente = 'tutor'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/coordenacao/introducao/textos-da-introducao.test.ts › todo lugar da navegação da coordenação tem a frase dele
  Escola: 'Turmas, professores e material da escola.',
-  Registros: 'O que a IA fez, os pedidos de titular e a privacidade.',
```

```mutacao
arquivo: apps/web/src/paginas/Inicio.tsx
teste: apps/web/src/paginas/Inicio.test.tsx › a coordenação que ainda não viu a introdução
  professor: ROTAS.bemVindoDoProfessor,
-  coordenador: ROTAS.bemVindoDaCoordenacao,
```

```mutacao
arquivo: apps/web/src/areas/navegacao.ts
teste: apps/web/src/areas/navegacao.test.ts › o aluno não tem rodapé fixo nem menu da pessoa com links
-  coordenador: [{ rotulo: 'Rever a introdução', caminho: ROTAS.bemVindoDaCoordenacao, icone: { lucide: BookOpen, familia: 'lima' } }],
+  coordenador: [],
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/rotas.tsx
teste: e2e/coordenacao-introducao.spec.ts › os quatro passos levam ao Painel
        <Route path={ROTAS_DA_COORDENACAO.painel} component={Painel} />
-        <Route path={ROTAS_DA_COORDENACAO.bemVindo} component={BemVindo} />
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | Bloco de mutação `max-h-none` do professor (item do `TODO.md`) | Recusada: o `BemVindo.tsx` do professor só passou a usar `IntroducaoDoPapel`/`OndeFicaCadaCoisa`, sem mudar a região que rola, e `e2e/professor-introducao.spec.ts` já prova a sobra de altura (a região "Leia até o fim" e `paginaNaoRola` a 1366 × 768) |
| revisor-geral (1ª) | Roteiro da demonstração repete o convite, a senha e o segundo fator que `entrarComoCoordenacaoPeloConvite` já faz | `TODO.md`: o roteiro entra por `linkDaCoordenacao` (convite da operação), não por `ConviteDeCoordenadorDeTeste`; juntar as duas entradas pede a fixture da operação, tarefa que toque `roteiro-da-demonstracao.spec.ts` |
| revisor-geral (1ª) | `id="onde-fica-cada-coisa"` fixo em `OndeFicaCadaCoisa.tsx`; `useId()` evitaria id repetido | `TODO.md`: há uma lista por tela hoje, sem defeito; mexer no `.tsx` caducaria os sete revisores só por isso. Fazer se a peça aparecer duas vezes na mesma tela |
| frontend-reviewer (1ª) | A fala do passo 1 lê "de Colégio …"; sem artigo ficaria melhor | Recusada: é a divergência 1 deste documento, já escrita na Tech Spec §9; texto de tela é do Arquiteto |
| frontend-reviewer (1ª) | "Onde fica cada coisa" só aparece rolando o passo 4; ver se a coordenadora chega a ela | Validador (fotografar o passo 4 rolado) e, se não chegar, o Arquiteto decide se vira passo próprio |
| frontend-reviewer (1ª) | Não há foto da primeira vez (com "Pular") nem do passo 4 rolado | Validador, na foto de cada requisito com tela |
| conformidade-reviewer (1ª), privacy-guardian (1ª) | Passo 3 ("Abrir um aluno ou um professor pelo nome pede um motivo") promete mais do que a lista da turma e a lista de professores fazem; passo 2 ("sem nome de pessoa") não vale para Escola › Turmas | `TODO.md`, com pedido ao Arquiteto: o texto vem do PRD (RF15) e a frase certa é decisão dele; antes da validação |
| tenancy-guardian (1ª) | Caso do `/v1/eu` da coordenação trazendo só a data da própria pessoa | `TODO.md`: é da API da 1.0 |
| infra-guardian (1ª) | O cenário de carga do login cobre a coordenação caindo em `/coordenacao/bem-vindo` uma vez | `TODO.md`: conferir no cenário de carga do login; poucas pessoas por escola, fora do pico |
| infra-guardian (1ª) | Contador de falha da gravação da data, ou conferir a métrica da rota na 1.0 | `TODO.md`: métrica da 1.0 |
| test-engineer (1ª) | Coordenadora com vínculo em duas escolas: visto na A não vale na B | `TODO.md`: é da API da 1.0, nenhum caso desta spec atravessa isso pela tela |
| test-engineer (1ª) | Nenhum caso abre `/coordenacao/bem-vindo` como professor ou aluno | `TODO.md`: a guarda da área, tarefa que toque a guarda |
| test-engineer (1ª) | Contagem 4 e rótulos dos lugares escritos à mão em `e2e/coordenacao-introducao.spec.ts` | Recusada: é fumaça do e2e, e o caso de componente já lê `NAVEGACAO.coordenador` |
| privacy-guardian (1ª) | Guarda que impeça importar `e2e/__fixtures__` fora de `e2e/` | Já está no `TODO.md` (item "Guarda de arquitetura que impeça importar `e2e/__fixtures__` fora de `e2e/`") |
| test-engineer (2ª), revisor-geral (2ª) | Em `textos-da-introducao.test.ts`, o caso `"dois ou mais" é o grupo mínimo que o código aplica` repete o `toContain` do caso do passo 2: juntar os dois ou apagar o segundo | `TODO.md`: duplicação de teste sem defeito, na tarefa que tocar esse arquivo |
| test-engineer (2ª) | No primeiro caso do e2e, o `expect(gravacoes).toHaveLength(1)` final não espera nada depois do `poll`, e o comentário "nenhuma tardia" promete mais do que prova (a prova de verdade é a do caso do "Pular"): ajustar o comentário | `TODO.md`: ajuste de comentário, na tarefa que tocar `e2e/coordenacao-introducao.spec.ts` |

<!-- A seção "Revisões" é criada pelo hook tools/processo/revisoes.ts: não a escreva à mão nem acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 19:51:49 | 2026-10-25 19:52:42 | `frontend-reviewer` | 1 | APROVADO | aecab11012eff07b7 |
| 2026-10-25 19:52:13 | 2026-10-25 19:52:43 | `tenancy-guardian` | 1 | APROVADO | acc469f5919a7d3bf |
| 2026-10-25 19:52:26 | 2026-10-25 19:52:56 | `infra-guardian` | 1 | APROVADO | a0f2a642e14f983cd |
| 2026-10-25 19:51:55 | 2026-10-25 19:53:15 | `conformidade-reviewer` | 1 | APROVADO | adae061d40d5f240a |
| 2026-10-25 19:52:20 | 2026-10-25 19:53:20 | `privacy-guardian` | 1 | APROVADO | a82384e475faf79c2 |
| 2026-10-25 19:52:07 | 2026-10-25 19:53:40 | `revisor-geral` | 1 | APROVADO | ab82b82310bad2458 |
| 2026-10-25 19:52:01 | 2026-10-25 19:54:26 | `test-engineer` | 1 | APROVADO | af1ece66b041e3899 |
| 2026-10-25 20:15:32 | 2026-10-25 20:15:54 | `revisor-geral` | 2 | APROVADO | a0ebefe56c8280218 |
| 2026-10-25 20:15:23 | 2026-10-25 20:16:14 | `test-engineer` | 2 | APROVADO | ab050fd4b5b1c8510 |
