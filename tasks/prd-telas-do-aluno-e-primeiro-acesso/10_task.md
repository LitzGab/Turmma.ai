# Tarefa 10.0 — A introdução do professor

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** 9.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O professor vê, na primeira entrada, quatro passos sobre o que a IA faz e não faz; pode pular e rever.

## Contexto necessário

- `techspec.md` seções 5 e 9 ("Lugares"); `prd.md` RF12, RF15 a RF18 e o caso do professor em duas escolas; `tasks/prd-telas-do-professor/mockup.md`
  seção 14 e fechamento (d)
- Regras 70 (itens 3, 4a, 8 e 9) e 20 (item 10a); D55, D58, D64 e D47
- Código: `paginas/Inicio.tsx` (a tabela por papel da 9.0); `areas/navegacao.ts` (`NAVEGACAO.professor`, `MENU_DA_PESSOA`);
  `areas/professor/rotas.tsx`; `Introducao` (5.0); `areas/aluno/introducao/BemVindo.tsx`, como modelo
- Depois da 9.0: as três editam `paginas/Inicio.tsx`, `casca.ts`, `escola-montada.spec.ts` e o roteiro

## Subtarefas

- [x] 10.1 — `areas/professor/introducao/textos-da-introducao.ts` e `BemVindo.tsx` (`lazy()`, `tela-professor-BemVindo`), a rota (2.1) e a entrada
  `professor` na tabela de `paginas/Inicio.tsx`. Os passos, com a onça e o nome "Assistente de ensino" e o selo "IA": (1) "Eu preparo,
  você revê, e só então vai à turma." (2) "Só a resposta do Tutor chega ao aluno sem a sua aprovação, uma a uma." (3) "Eu não corrijo
  redação nem discursiva: ajudo com a rubrica e com a organização do lote." (4) "Usar ou não esta ferramenta não gera número sobre
  você." Em todos, "Pular" e "Continuar" iguais. O fim lista "onde fica cada coisa" **lendo `NAVEGACAO.professor`**, e "Começar" leva
  ao primeiro lugar dele
- [x] 10.2 — "Rever a introdução" no `MENU_DA_PESSOA.professor`, antes do "Sair"
- [x] 10.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/introducao/textos-da-introducao.ts`, `apps/web/src/areas/professor/introducao/textos-da-introducao.test.ts`, `apps/web/src/areas/professor/introducao/BemVindo.tsx`, `apps/web/src/areas/professor/introducao/BemVindo.test.tsx`, `e2e/professor-introducao.spec.ts` | novo |
| `apps/web/src/areas/professor/rotas.tsx`, `apps/web/src/areas/navegacao.ts`, `apps/web/src/areas/navegacao.test.ts`, `apps/web/src/paginas/Inicio.tsx` | alterado |
| `e2e/__fixtures__/casca.ts`, `e2e/__fixtures__/sessao.ts`, `e2e/escola-montada.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts`, `e2e/professores.spec.ts`, `e2e/areas.spec.ts`, `e2e/casca.spec.ts`, `e2e/meus-dados.spec.ts` | alterado |
| `apps/web/src/componentes/introducao/use-introducao.ts`, `apps/web/src/componentes/introducao/Linhas.tsx`, `apps/web/src/componentes/introducao/RegiaoQueRola.tsx`, `apps/web/src/componentes/introducao/RegiaoQueRola.test.tsx` | novo |
| `apps/web/src/areas/aluno/introducao/BemVindo.tsx`, `apps/web/src/componentes/itens-da-lateral.test.tsx`, `apps/web/src/paginas/Inicio.test.tsx` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| os textos (RF15) | unidade | os quatro passos dizem aprova, Tutor sem aprovação uma a uma, nada de correção de discursiva e uso que não vira indicador; sem "ranking" nem "meta de uso"; sem fala de sentimento |
| onde fica cada coisa | componente | a lista sai de `NAVEGACAO.professor`; lugar que a fase não tem não aparece |
| primeira entrada pelo convite | e2e | professora convidada cria a senha, entra e cai em `/professor/bem-vindo` |
| pular | componente + e2e | "Pular" no passo 1 grava a data e vai ao primeiro lugar; a entrada seguinte não volta |
| botões iguais | componente | "Pular" e "Continuar" com a mesma classe |
| falas (regra 70, item 4a; D58) | unidade | texto fixo em `.ts`; reprova afirmar ser pessoa, professor ou amigo, prometer voltar, esperar ou estar sempre ali, e termos de vínculo ou saudade |
| quatro estados da `BemVindo` | componente | carregando (a fala do passo 1, "Sair" à vista, sem "Fechar" nem "Pular"); erro com `EstadoErro`, "Tentar de novo", "Voltar para a abertura" e "Sair"; data desconhecida vale o modo primeira vez; com dado, os passos |
| rever | e2e | menu da pessoa › "Rever a introdução": todo passo fecha, a data não muda |
| duas escolas | e2e | concluída na escola A, a troca para B (pelo seletor) não reabre |
| sair no meio | componente | "Sair" não grava |
| recomeço da tela | e2e | a professora seguinte no mesmo computador vê a introdução dela |
| 360 px | e2e | sem rolagem lateral, botões de 44 px |

Isolamento e concorrência da data são da 1.0; carregando e erro do desvio em `/`, os da `Inicio`; os da `BemVindo`, a linha da tabela.

## Como testar

- Copie `ListaDePedidos.test.tsx` (`componentes/pedidos/`) e a `BemVindo.test.tsx` do aluno; o convite como em `e2e/convite.spec.ts`
  (`criarConviteDeProfessor`); a troca de escola como em `e2e/troca-de-escola.spec.ts`
- `escola-montada` e o roteiro: a professora criada por convite passa pela introdução (helper em `casca.ts`); `navegacao.test.ts`
  ganha o item do menu
- Rodar: `npx vitest run --project unidade apps/web/src/areas/professor/introducao/textos-da-introducao.test.ts` e
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-introducao.spec.ts`
- Telas: `professor`, `/professor/bem-vindo` (convite, senha, entrada; ou o menu da pessoa › "Rever a introdução"); mockup
  `/professor/bem-vindo`

## Fora do escopo desta tarefa

Confirmar turma, padrões da prova, "preparar a semana" e gerar prova (a introdução só grava a data); a introdução da rede e a da
operação.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A gravação da data, o "revendo" e a ida embora saem da `BemVindo` do aluno para `componentes/introducao/use-introducao.ts`, e `Linhas` para `Linhas.tsx`; a do aluno passa a usá-los (sem mudar comportamento) | Autoconferência, pergunta 9: copiar a lógica da trava do segundo clique e do cache para a segunda introdução, e a seguir para a terceira (11.0), é onde o erro volta | `techspec.md` §9, "Peças novas" (`Linhas` e `useIntroducao`) |
| A região que rola do aviso de privacidade do aluno vira `componentes/introducao/RegiaoQueRola.tsx` (com a faixa "Role para ler mais" e a medida na montagem e ao mudar de tamanho), e o último passo do professor a usa; a do aluno passa a usá-la | Com a lista "Onde fica cada coisa" o último passo media 917 px a 1366 × 768 e rolava a página (RF20); a mesma região do aluno não podia ser copiada | `techspec.md` §9, "Peças novas" (`RegiaoQueRola`); `10_task.md`, RF20 |
| O último "Continuar" do professor é o "Começar" da subtarefa 10.1: o botão segue rotulado "Continuar", sem tela de fim, e leva ao primeiro lugar dele (como no aluno) | Quatro passos e nenhuma tela depois (Tech Spec, §9); um rótulo novo só no último passo seria um botão que muda de nome no meio do fluxo | `techspec.md` §9 (a linha que começa em "recebe passos", estendida ao professor) |
| Revendo, "Fechar", o último "Continuar" e o Esc do professor levam ao primeiro lugar dele, e não a Eu | Não há "de onde veio": o link está no menu da pessoa, em toda tela; o primeiro lugar é o mesmo de "Começar" | `techspec.md` §5, "Rever" |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/componentes/introducao/use-introducao.ts
teste: apps/web/src/areas/professor/introducao/BemVindo.test.tsx › dois cliques seguidos em "Continuar" no último passo fazem um POST só
  function terminar(): void {
-    if (!revendo && !jaGravou.current) {
+    if (!revendo) {
      jaGravou.current = true
```

```mutacao
arquivo: apps/web/src/componentes/introducao/use-introducao.ts
teste: apps/web/src/areas/professor/introducao/BemVindo.test.tsx › o último "Continuar" de quem revê também só fecha
  function terminar(): void {
-    if (!revendo && !jaGravou.current) {
+    if (!jaGravou.current) {
      jaGravou.current = true
```

```mutacao
arquivo: apps/web/src/componentes/introducao/use-introducao.ts
teste: apps/web/src/areas/professor/introducao/BemVindo.test.tsx › dois cliques seguidos em "Continuar" no último passo fazem um POST só
    if (!revendo && !jaGravou.current) {
-      jaGravou.current = true
      gravar.mutate()
```

```mutacao
arquivo: apps/web/src/componentes/introducao/use-introducao.ts
teste: apps/web/src/areas/aluno/introducao/BemVindo.test.tsx › com a data já gravada, "Fechar" no passo
      gravar.mutate()
    }
-    ir(revendo ? destinos.aoRever : destinos.aoTerminar, { replace: true })
+    ir(destinos.aoTerminar, { replace: true })
  }
```

```mutacao
arquivo: apps/web/src/componentes/introducao/use-introducao.ts
teste: apps/web/src/areas/professor/introducao/BemVindo.test.tsx › dois cliques seguidos em "Continuar" no último passo fazem um POST só
    mutationFn: concluirIntroducao,
-    onSuccess: ({ introducaoVistaEm }) => cliente.setQueryData(consultaEu.queryKey, (antes) => (antes === undefined ? antes : { ...antes, introducaoVistaEm })),
+    onSuccess: () => cliente.setQueryData(consultaEu.queryKey, (antes) => antes),
  })
```

```mutacao
arquivo: apps/web/src/componentes/introducao/use-introducao.ts
teste: apps/web/src/areas/professor/introducao/BemVindo.test.tsx › data nula é a primeira vez
-  const revendo = eu.data !== undefined && eu.data.introducaoVistaEm !== null
+  const revendo = eu.data !== undefined
```

```mutacao
arquivo: apps/web/src/componentes/introducao/use-introducao.ts
teste: apps/web/src/areas/professor/introducao/BemVindo.test.tsx › mostra a fala do passo 1 e o "Sair"
-  const revendo = eu.data !== undefined && eu.data.introducaoVistaEm !== null
+  const revendo = eu.data.introducaoVistaEm !== null
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/BemVindo.tsx
teste: apps/web/src/areas/professor/introducao/BemVindo.test.tsx › mostra a fala do passo 1 e o "Sair", sem
-  if (eu.data === undefined && eu.isError) {
+  if (eu.data === undefined) {
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/BemVindo.tsx
teste: apps/web/src/areas/professor/introducao/BemVindo.test.tsx › uma releitura do `/v1/eu` que falha não tira os passos da tela
-  if (eu.data === undefined && eu.isError) {
+  if (eu.isError) {
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/BemVindo.tsx
teste: apps/web/src/areas/professor/introducao/BemVindo.test.tsx › com a data já gravada, "Fechar" está em todo passo
-  return <Introducao passos={passos} agente={AGENTE_DA_INTRODUCAO} revendo={revendo} aoConcluir={terminar} aoPular={terminar} />
+  return <Introducao passos={passos} agente={AGENTE_DA_INTRODUCAO} aoConcluir={terminar} aoPular={terminar} />
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/BemVindo.tsx
teste: apps/web/src/areas/professor/introducao/BemVindo.test.tsx › "onde fica cada coisa" só aparece no último passo
    <RegiaoQueRola nome="Leia até o fim" alturaMaxima="max-h-[34dvh]">
      <Linhas linhas={passo.linhas} />
-      <OndeFicaCadaCoisa />
+      {null}
    </RegiaoQueRola>
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/BemVindo.tsx
teste: apps/web/src/areas/professor/introducao/BemVindo.test.tsx › "onde fica cada coisa" só aparece no último passo
-  if (!ultimo) return <Linhas linhas={passo.linhas} />
+  if (true) return <Linhas linhas={passo.linhas} />
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/BemVindo.tsx
teste: e2e/professor-introducao.spec.ts › os quatro passos levam ao primeiro lugar
-    <RegiaoQueRola nome="Leia até o fim" alturaMaxima="max-h-[34dvh]">
+    <>
      <Linhas linhas={passo.linhas} />
      <OndeFicaCadaCoisa />
-    </RegiaoQueRola>
+    </>
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/professor/introducao/textos-da-introducao.test.ts › o passo 1 diz que a IA prepara e o professor aprova
-    linhas: ['Nada do que eu preparo chega à turma sem a sua aprovação.', 'Eu sou um programa e posso errar.'],
+    linhas: ['Nada chega à turma sem a sua aprovação.', 'Eu sou um programa e posso errar.'],
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/professor/introducao/textos-da-introducao.test.ts › o passo 2 diz que só a resposta do Tutor
-    linhas: ['O que eu preparo para a turma espera pela sua aprovação.', 'Do Tutor você vê o uso: onde a turma travou e qual dúvida se repetiu.'],
+    linhas: ['O que eu preparo para a turma espera pela sua aprovação.'],
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/BemVindo.tsx
teste: apps/web/src/areas/professor/introducao/BemVindo.test.tsx › mostra a fala do passo 1 e o "Sair", sem
-  if (eu.data === undefined) {
+  if (false) {
    return (
      <TelaDeFoco passo={1} total={TOTAL_DE_PASSOS} idDoPasso={idDoPasso} rodape={null}>
```

```mutacao
arquivo: apps/web/src/componentes/introducao/RegiaoQueRola.tsx
teste: apps/web/src/componentes/introducao/RegiaoQueRola.test.tsx › sem medida
-    if (medida === null || medida.clientHeight === 0) return
+    if (medida === null) return
```

```mutacao
arquivo: apps/web/src/componentes/introducao/RegiaoQueRola.tsx
teste: apps/web/src/componentes/introducao/RegiaoQueRola.test.tsx › quando o conteúdo cabe inteiro, a faixa sai sem ninguém rolar
-    if (medida === null || typeof ResizeObserver === 'undefined') return
+    if (medida === null || typeof ResizeObserver !== 'undefined') return
```

```mutacao
arquivo: apps/web/src/componentes/introducao/RegiaoQueRola.tsx
teste: apps/web/src/componentes/introducao/RegiaoQueRola.test.tsx › a faixa vai com a rolagem
-      {haMais && (
+      {!haMais && (
```

```mutacao
arquivo: apps/web/src/componentes/introducao/RegiaoQueRola.tsx
teste: apps/web/src/componentes/introducao/RegiaoQueRola.test.tsx › ao sair da tela, para de observar o tamanho
-    return () => observador.disconnect()
+    return undefined
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/BemVindo.tsx
teste: apps/web/src/areas/professor/introducao/BemVindo.test.tsx › "onde fica cada coisa" só aparece no último passo
-    conteudo: conteudoDoPasso(passo, indice === PASSOS_DO_PROFESSOR.length - 1),
+    conteudo: conteudoDoPasso(passo, indice === 0),
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/BemVindo.tsx
teste: apps/web/src/areas/professor/introducao/BemVindo.test.tsx › "onde fica cada coisa" só aparece no último passo
-        {NAVEGACAO.professor.map((lugar) => (
+        {NAVEGACAO.professor.slice(1).map((lugar) => (
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/BemVindo.tsx
teste: apps/web/src/areas/professor/introducao/BemVindo.test.tsx › "Pular" no passo 1 grava a data
-const PRIMEIRO_LUGAR = `~${NAVEGACAO.professor[0]?.caminho ?? ROTAS.novaConversa}`
+const PRIMEIRO_LUGAR = `${NAVEGACAO.professor[0]?.caminho ?? ROTAS.novaConversa}`
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/professor/introducao/textos-da-introducao.test.ts › nenhum é obrigatório
    fala: FALA_DO_PASSO_1,
    linhas: ['Nada do que eu preparo chega à turma sem a sua aprovação.', 'Eu sou um programa e posso errar.'],
-    obrigatorio: false,
+    obrigatorio: true,
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/professor/introducao/textos-da-introducao.test.ts › o passo 1 diz que a IA prepara e o professor aprova
-    linhas: ['Nada do que eu preparo chega à turma sem a sua aprovação.', 'Eu sou um programa e posso errar.'],
+    linhas: ['Eu sou um programa e posso errar.'],
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/professor/introducao/textos-da-introducao.test.ts › o passo 1 diz que a IA prepara e o professor aprova
-    linhas: ['Nada do que eu preparo chega à turma sem a sua aprovação.', 'Eu sou um programa e posso errar.'],
+    linhas: ['Nada do que eu preparo chega à turma sem a sua aprovação.'],
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/professor/introducao/textos-da-introducao.test.ts › o passo 2 diz que só a resposta do Tutor
-    linhas: ['O que eu preparo para a turma espera pela sua aprovação.', 'Do Tutor você vê o uso: onde a turma travou e qual dúvida se repetiu.'],
+    linhas: ['Do Tutor você vê o uso: onde a turma travou e qual dúvida se repetiu.'],
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/professor/introducao/textos-da-introducao.test.ts › o passo 3 diz que a IA não corrige redação nem discursiva
-    linhas: ['Na prova objetiva eu corrijo, e o resultado só vale depois da sua aprovação.', 'Em redação e discursiva, a correção é sua.'],
+    linhas: ['Na prova objetiva eu corrijo, e o resultado só vale depois da sua aprovação.'],
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/professor/introducao/textos-da-introducao.test.ts › o passo 3 diz que na objetiva só vale depois da aprovação do professor
-    linhas: ['Na prova objetiva eu corrijo, e o resultado só vale depois da sua aprovação.', 'Em redação e discursiva, a correção é sua.'],
+    linhas: ['Na prova objetiva eu corrijo.', 'Em redação e discursiva, a correção é sua.'],
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/professor/introducao/textos-da-introducao.test.ts › o passo 4 diz que usar ou não a ferramenta não vira número
-    linhas: ['Escolher não usar não vira indicador, aviso nem cobrança.', 'A conversa que você tem comigo não aparece para a coordenação.'],
+    linhas: ['Escolher não usar não vira indicador, aviso nem cobrança.'],
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/professor/introducao/textos-da-introducao.test.ts › quem fala é o Assistente de ensino
-export const AGENTE_DA_INTRODUCAO: Agente = 'assistente_de_ensino'
+export const AGENTE_DA_INTRODUCAO: Agente = 'tutor'
```

```mutacao
arquivo: apps/web/src/areas/professor/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/professor/introducao/textos-da-introducao.test.ts › todo lugar da navegação do professor tem a frase dele
  Turmas: 'Confirme suas turmas e abra cada uma.',
  Ferramentas: 'Uma ferramenta para cada tipo de material.',
-  Criados: 'O que você já criou, para rever e aprovar.',
```

```mutacao
arquivo: apps/web/src/paginas/Inicio.tsx
teste: apps/web/src/paginas/Inicio.test.tsx › o professor que ainda não viu a introdução
-const INTRODUCAO_POR_PAPEL: Readonly<Partial<Record<PapelDeUsuario, string>>> = { aluno: ROTAS.bemVindoDoAluno, professor: ROTAS.bemVindoDoProfessor }
+const INTRODUCAO_POR_PAPEL: Readonly<Partial<Record<PapelDeUsuario, string>>> = { aluno: ROTAS.bemVindoDoAluno }
```

```mutacao
arquivo: apps/web/src/areas/navegacao.ts
teste: apps/web/src/areas/navegacao.test.ts › X4
    // X4 (10.0): rever a introdução é o mesmo endereço da primeira entrada; revendo, todo passo fecha e a data não muda.
-    { rotulo: 'Rever a introdução', caminho: ROTAS.bemVindoDoProfessor, icone: { lucide: BookOpen, familia: 'lima' } },
  ],
```

```mutacao
arquivo: apps/web/src/areas/professor/rotas.tsx
teste: e2e/professor-introducao.spec.ts › os quatro passos levam ao primeiro lugar
        <Route path={ROTAS_DO_PROFESSOR.turmas} component={Turmas} />
-        <Route path={ROTAS_DO_PROFESSOR.bemVindo} component={BemVindo} />
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| tenancy-guardian (1ª) | Deixar escrito na `techspec.md` §5 que a data da introdução vale para a conta, entre escolas (`e2e/professor-introducao.spec.ts`, caso das duas escolas) | Recusada: o comportamento é da 1.0 e não muda nesta tarefa; o comentário do caso de duas escolas ("com a data de A emprestada") já o diz |
| tenancy-guardian (1ª) | Trocar o `${introducaoVistaEm(...)}` no SQL de `e2e/__fixtures__/sessao.ts` (linhas 106, 124 e 688) por parâmetro `$n` | Recusada: o valor sai de um enum fixo (`null` ou `now()`), é só de teste, e o `privacy-guardian` confirmou que não entra texto de fora |
| frontend-reviewer (1ª) | Subir a altura máxima do miolo do passo 4 (`max-h-[34dvh]`) ou pôr a lista antes das duas linhas | Recusada: a altura é o que faz o passo caber a 1366 × 768 (divergência 2, RF20); a faixa "Role para ler mais" avisa, e o próprio revisor aprovou sem exigir |
| infra-guardian (1ª) | Dizer no texto da 11.0 que mudar `staleTime` ou `refetchOnWindowFocus` de `['eu']` vale para os três papéis | Tarefa 11.0 (`11_task.md`), que reaproveita `useIntroducao` |
| conformidade-reviewer (1ª) | "não gera número sobre você" ficará imprecisa quando o painel do próprio professor (D45) existir | `TODO.md`: rever a fala do passo 4 e a linha do `textos-da-introducao.ts` quando o painel do professor entrar |
| revisor-geral (1ª) | Extrair uma peça comum dos estados de erro e de carregando da `BemVindo` do aluno e da do professor | Tarefa 11.0 (`11_task.md`), que seria a terceira cópia |
| revisor-geral (1ª) | Renomear a região "Leia até o fim", que é uma instrução e não diz o que contém | Recusada: o `frontend-reviewer`, a quem o `revisor-geral` deixou a decisão, viu a tela e aprovou sem pedir mudança, e o e2e do último passo cita esse nome |
| revisor-geral (1ª) | Tirar o `?? ROTAS.novaConversa` de `PRIMEIRO_LUGAR`, que nunca é usado | Recusada: com `noUncheckedIndexedAccess` ligado (`tsconfig.base.json`), `NAVEGACAO.professor[0]` é `T \| undefined` e o `?.` com o `??` é o que o tipo exige |
| test-engineer (2ª) | Um segundo bloco de mutação que troque `alturaMaxima="max-h-[34dvh]"` por `"max-h-none"` em `areas/professor/introducao/BemVindo.tsx`: mantém a região e prova que a sobra de altura fica vermelha; hoje o fragmento já quebra a asserção da região, antes de chegar a `paginaNaoRola` | `TODO.md`: acrescentar o bloco quando a 11.0 ou outra tarefa tocar o `BemVindo.tsx` |
| test-engineer (2ª) | Registrar que a 360 px o RF20 do passo 4 não é conferido (o caso corta por largura ≥ 768) | Nenhuma ação: é o que o RF20 manda, e o corte é o mesmo de `paginaNaoRola` |
| revisor-geral (2ª) | Um caso em `BemVindo.test.tsx` que monte a navegação com outros itens e confira a lista, para provar na suíte que ela sai de `NAVEGACAO.professor` | Recusada: a mutação `.slice(1)` do documento já prova a leitura, e o `test-engineer` aprovou com a limitação registrada no comentário do caso |
| revisor-geral (2ª) | Deixar o comentário de `aoRever` (`use-introducao.ts`) genérico e registrar o destino de cada papel no lugar de quem chama | Recusada: o texto atual é o ajuste que o `test-engineer` e o `infra-guardian` pediram na 1ª rodada (item 6 da ordem `10_task-r1.md`); mudar de novo contradiz os dois |
| frontend-reviewer (2ª) | O passo 4 diz "não gera número sobre você", o que deixa de valer quando o painel do próprio professor (D45) entrar | `TODO.md`, linha já escrita na 1ª rodada (rever a fala do passo 4 quando o painel do professor entrar) |
| frontend-reviewer (2ª) | O nome da região "Leia até o fim" é uma instrução | Recusada, como na 1ª rodada (linha acima na tabela) |
| frontend-reviewer (2ª) | "Continuar" do passo 4 aparece com fundo cinza claro na foto | Nenhuma ação: é o hover do último clique do script da vitrine, e o código não desabilita o botão |
| conformidade-reviewer (2ª) | A mutação nova do passo 2 prova o texto, e não que a tela do professor mostra os sinais `travou` e `duvida_repetida`; conferir se `apps/api/src/tutor/tutor.int.test.ts` cobre esses sinais **vistos pelo professor**, e não só criados | `TODO.md`: conferir a cobertura de leitura dos sinais pelo professor (o teste de hoje cobre o nascimento dos dois sinais, `tutor.int.test.ts`, caso "travou nasce uma vez…") |
| tenancy-guardian (2ª) | Uma guarda que impeça importar `e2e/__fixtures__` fora de `e2e/`, para o aviso de `introducaoVistaEmDoUsuario` não depender de disciplina | `TODO.md`: guarda de arquitetura para `e2e/__fixtures__` |
| privacy-guardian (2ª) | Nenhum teste trava o elo entre a promessa "a conversa não aparece para a coordenação" e `assistente.int.test.ts`; lembrar dela quando a camada de rede ou um painel da coordenação ganhar leitura do Assistente | `TODO.md`: lembrete junto da linha da fala do passo 4 |
| privacy-guardian (2ª) | Ao rever a fala do passo 4, manter que o número é só do professor e nunca alimenta decisão sobre ele (regra 20, item 10a; regra 70, item 8) | `TODO.md`, mesma linha da fala do passo 4 |
| infra-guardian (2ª) | Manter o `introducaoVistaEmDoUsuario` junto do `page.goto('/')` depois do "Pular", e não tirá-lo numa limpeza futura | Nenhuma ação: os dois já estão no caso do e2e |
| infra-guardian (2ª) | Conferir na `11_task.md` a nota sobre `staleTime` e `refetchOnWindowFocus` de `['eu']` | Já tem destino: tarefa 11.0 (linha da 1ª rodada) |

<!-- A seção "Revisões" é criada pelo hook tools/processo/revisoes.ts: não a escreva à mão nem acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 18:41:17 | 2026-10-25 18:41:41 | `tenancy-guardian` | 1 | APROVADO | a2eb0a3b40f794d10 |
| 2026-10-25 18:41:04 | 2026-10-25 18:41:53 | `frontend-reviewer` | 1 | APROVADO | a0321f1f4c4562dab |
| 2026-10-25 18:41:24 | 2026-10-25 18:41:54 | `infra-guardian` | 1 | APROVADO | a078152794e741407 |
| 2026-10-25 18:41:20 | 2026-10-25 18:42:10 | `privacy-guardian` | 1 | APROVADO | a50d1ae7caff04f16 |
| 2026-10-25 18:41:07 | 2026-10-25 18:42:24 | `conformidade-reviewer` | 1 | APROVADO | a04b46eaaa4ba7fe3 |
| 2026-10-25 18:41:10 | 2026-10-25 18:43:24 | `test-engineer` | 1 | REPROVADO | a9fe4527a69304d5e |
| 2026-10-25 18:41:14 | 2026-10-25 18:43:33 | `revisor-geral` | 1 | APROVADO | a08a50a940ed5b80c |
| 2026-10-25 19:06:43 | 2026-10-25 19:07:08 | `frontend-reviewer` | 2 | APROVADO | aaba3d44c025affc5 |
| 2026-10-25 19:06:48 | 2026-10-25 19:07:19 | `conformidade-reviewer` | 2 | APROVADO | a3b07dcf7d339b84c |
| 2026-10-25 19:07:09 | 2026-10-25 19:07:30 | `tenancy-guardian` | 2 | APROVADO | ac9565aaec23af603 |
| 2026-10-25 19:07:03 | 2026-10-25 19:07:31 | `revisor-geral` | 2 | APROVADO | a171e5e1fa257e950 |
| 2026-10-25 19:07:14 | 2026-10-25 19:07:36 | `privacy-guardian` | 2 | APROVADO | a6f8661d63e7e6df2 |
| 2026-10-25 19:07:20 | 2026-10-25 19:07:38 | `infra-guardian` | 2 | APROVADO | af8b927ea9fb85a72 |
| 2026-10-25 19:06:57 | 2026-10-25 19:07:49 | `test-engineer` | 2 | APROVADO | ab53757624cd8d5b6 |
