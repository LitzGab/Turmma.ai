# Tarefa 9.0 — A introdução do aluno, com o aviso de privacidade em linguagem de 11 anos

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** 5.0, 8.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Na primeira entrada, o aluno vê quatro passos (o Tutor erra, quem dá a aula acompanha, o aviso de privacidade, o tamanho da letra) e
pode rever em Eu.

## Contexto necessário

- `techspec.md` seção 5 e 7b; `prd.md` RF12 a RF14 e RF16 a RF19; `mockup.md` seção 2.8 e fecho (b)
- Regras 20 (item 12) e 70 (itens 4a e 4b); D58, D59 e D64
- Código: `paginas/Inicio.tsx`; `areas/aluno/tutor.ts`; `concluirIntroducao` (1.0); `Introducao` (5.0)

## Subtarefas

- [x] 9.1 — `aviso-de-privacidade.ts` e `textos-da-introducao.ts`, em `areas/aluno/introducao/`. O aviso: "Veja o que a escola
  guarda de você." "Guardamos seu nome, sua turma e sua matrícula." "Guardamos suas tarefas e o resultado delas." "Guardamos o que
  você escreve para o Tutor e o que ele responde." "A conversa com o Tutor fica de 6 a 24 meses; a escola escolhe." "Suas tarefas ficam pelo tempo que a escola escolhe." "Não temos seu
  e-mail, telefone, CPF, foto, endereço nem data de nascimento." "O professor da turma vê suas tarefas e o resultado." "Quem dá a aula
  acompanha como você usa o Tutor." (`TEXTO_DA_SUPERVISAO`) "A coordenação vê os números da turma toda. Ver algo seu fica
  registrado." "Seus colegas não veem nada seu." "O que você escreve ao Tutor e as habilidades a rever passam por um programa de IA de uma empresa contratada."
  "Seus dados não treinam IA." "Para ver seus dados, abra Eu e depois Privacidade." "Para pedir mais, fale com quem dá a aula ou com a
  coordenação." Frases de até 15 palavras. O passo 1 diz que o Tutor é um programa e pode errar. Falas fixas, sem variar com
  presença, ausência, acerto ou tempo de uso
- [x] 9.2 — `areas/aluno/introducao/BemVindo.tsx` (`lazy()`, `tela-aluno-BemVindo`) e a rota de 2.1. Passos 1 a 3: sem "Pular", sem X, Esc não sai; o 4 tem "Pular"
  igual ao "Continuar". "Começar" e "Pular" chamam `concluirIntroducao()` e vão a `/aluno/inicio`, mesmo se a gravação falhar.
  "Sair" não grava. Revendo, todo passo fecha. O desvio em `paginas/Inicio.tsx` é uma tabela por papel só com o aluno: a 10.0 e a 11.0
  acrescentam o delas
- [x] 9.3 — Linha "Rever a introdução" em Eu
- [x] 9.4 — `docs/aia/tutor.md` (pendência 12), `docs/lgpd.md` seção 9, `docs/conformidade-mec.md`
- [x] 9.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/aluno/introducao/aviso-de-privacidade.ts`, `apps/web/src/areas/aluno/introducao/textos-da-introducao.ts`, `apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts`, `apps/web/src/areas/aluno/introducao/BemVindo.tsx`, `apps/web/src/areas/aluno/introducao/BemVindo.test.tsx`, `e2e/aluno-introducao.spec.ts` | novo |
| `apps/web/src/areas/aluno/rotas.tsx`, `apps/web/src/areas/aluno/Eu.tsx`, `apps/web/src/paginas/Inicio.tsx`, `e2e/__fixtures__/casca.ts`, `e2e/escola-montada.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts` | alterado |
| `docs/aia/tutor.md`, `docs/lgpd.md`, `docs/conformidade-mec.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| texto do aviso (RF14) | unidade | até 15 palavras por frase; sem "titular", "controlador", "LGPD", "consentimento", "tratamento" **e sem "nota"**; **uma asserção por elemento**: o que a escola guarda ("A escola guarda…": resultado das tarefas; o que escreve ao Tutor e a resposta), o prazo (a conversa com o Tutor, com piso e teto lidos de `CATEGORIAS_DE_RETENCAO.conversa_tutor`; o intervalo não aparece numa frase sem "Tutor"; as tarefas, sem número), o que não temos (os seis dados), quem vê (professor, coordenação com registro, colegas não, e que quem dá a aula é avisado se o aluno contar algo pessoal difícil), IA de uma empresa contratada, não treina IA, como pedir os dados; a supervisão é o `TEXTO_DA_SUPERVISAO`; apagar qualquer frase deixa vermelho |
| passo 1 e passos obrigatórios (RF13) | unidade | o passo 1 diz que o Tutor é um programa e pode errar; os três primeiros passos têm `obrigatorio: true` |
| falas (regra 70, item 4a; D58) | unidade | texto fixo em `.ts`; reprova afirmar ser pessoa, professor ou amigo, prometer voltar, esperar ou estar sempre ali, e termos de vínculo ou saudade |
| quatro estados da `BemVindo` | componente | carregando (a fala do passo 1, "Sair" à vista, sem "Fechar" nem "Pular"); erro com `EstadoErro`, "Tentar de novo", "Voltar para a abertura" e "Sair"; data desconhecida vale o modo primeira vez; com dado, os passos |
| passo 4 (RF11) | componente + e2e | seguir ou pular sem escolher deixa o `localStorage` vazio; escolher "Maior" aplica na hora e guarda; a 360 px, com "Maior", sem rolagem lateral e com "Continuar" e "Pular" alcançáveis |
| avisos sem "Pular" | componente | passos 1 a 3 sem "Pular" nem X; o 4 com "Pular" do mesmo tamanho |
| sair no meio; POST que falha | componente + e2e | "Sair" e fechar a aba não gravam e a introdução volta; se o POST falha, a pessoa segue |
| primeira e segunda entrada | e2e | pessoa `introducao: 'por_ver'` cai na introdução; depois de concluir, vai ao Início; a segunda entrada em `browser.newContext()`, sem marca da introdução no armazenamento ("em nenhum computador") |
| rever; duplo clique | componente + e2e | revendo, "Fechar" está em todo passo, vale no passo 1 a 4 e o Esc leva a Eu nos passos 1 a 3, sem gravar; no e2e, "Fechar" no passo 1 volta a Eu e a data não muda; dois cliques no último "Continuar", um POST (a trava está provada no componente, com a gravação no ar) |
| recomeço da tela | e2e | o aluno seguinte no mesmo computador vê a introdução dele |
| 360 px | e2e | sem rolagem lateral, botões de 44 px; a linha "Rever a introdução" de Eu cabe inteira, sem reticências |
| aviso rolável | componente | a faixa "Role para ler mais" aparece enquanto há o que ler e some no fim da região |
| falas do e2e | unidade | a lista `FALAS_DA_INTRODUCAO_DO_ALUNO` de `e2e/__fixtures__/casca.ts` é a das falas dos passos |

Isolamento e concorrência da data são da 1.0; carregando e erro do desvio em `/`, os da `Inicio`; os da `BemVindo`, a linha da tabela.

## Como testar

- Copie `ListaDePedidos.test.tsx` (`componentes/pedidos/`); no e2e, `entrarComoAluno` com `introducao: 'por_ver'`
- `escola-montada` e `roteiro-da-demonstracao`: a aluna criada pela tela passa pela introdução (helper em `casca.ts`)
- Rodar: `npx vitest run --project unidade apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts` e
  `node tools/ci/e2e.ts --manter-ambiente e2e/aluno-introducao.spec.ts`
- Telas: `aluno`, `/aluno/bem-vindo` (login com matrícula, primeira vez; ou Eu › "Rever a introdução"); mockup `/aluno/bem-vindo`

## Fora do escopo desta tarefa

"Avisar um adulto" e o passo dele (F9); pedido de dados; aviso ao responsável (ECA Digital, art. 24).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O que vai à IA, que a subtarefa 9.1 punha numa frase só de 22 palavras, são duas frases: "O que você escreve e as habilidades a rever vão a um programa de IA." e "Esse programa é de uma empresa contratada." | A própria 9.1 e o RF14 exigem frases de até 15 palavras; a frase dada não cabe. O conteúdo é o mesmo (D62) | `techspec.md` §7b (a frase que cita o programa de IA ganhou "em duas frases"); `docs/aia/tutor.md` §1.8, item 12 |
| "Começar" é o "Continuar" do passo 4: a introdução tem quatro passos e nenhuma tela de fim | A `Introducao` da 5.0 tem "Continuar" no pé de todo passo; a pose `comemorando` é só da `Comemoracao` (RF19), e a tabela de testes da própria tarefa pede "Continuar" e "Pular" no passo 4. O "Pular" e o "Continuar" do passo 4 gravam e levam ao Início, como a 9.2 manda | `techspec.md` §9 (a `Introducao` recebe passos e avisa "concluiu" ou "pulou") |
| Revendo, nada é gravado e "Fechar", o último "Continuar" e o Esc levam a Eu, de onde a pessoa veio (e não ao Início) | RF17: a data não muda. O POST repetido é idempotente, mas um POST que não muda nada só gasta uma chamada na rajada das 7h30 (regra 80); Eu é o lugar do link | `techspec.md` §5, "Rever" |
| O aviso diz que quem dá a aula é avisado se o aluno contar algo pessoal difícil ("Se você contar algo pessoal difícil, quem dá a aula é avisado."), no grupo "Quem vê"; a subtarefa 9.1 não a listava | O `privacy-guardian` (1ª rodada) apontou que o sinal `atencao_humana` chega ao professor com o nome do aluno e o aviso não dizia (LGPD, art. 6º, VI, e art. 14, § 6º; ECA Digital, art. 16); a ordem deu a saída (a), com a frase de até 15 palavras | `techspec.md` §7b (a lista do que o aviso diz) |
| As frases do aviso dizem "A escola guarda…", e não "Guardamos…" | Dito pela onça, "guardamos" sugere que a IA guarda os dados; a escola é a controladora (D10; D58) | `techspec.md` §7b (parágrafo do aviso) |
| A `Linha` ganha a prop `tituloEmDuasLinhas`, usada só em "Rever a introdução"; o aviso rolável ganha a faixa "Role para ler mais" | A 360 px o título saía como "Rever a introd…" (regra 50, item 2a); o aviso mostrava três frases e uma cortada, sem sinal de que rola (item 11) | `techspec.md` §7b (parágrafo do aviso); `docs/interface.md` (linha da `Linha`) |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/BemVindo.tsx
teste: apps/web/src/areas/aluno/introducao/BemVindo.test.tsx › dois cliques seguidos em "Continuar" no último passo fazem um POST só
  function terminar(): void {
-    if (!revendo && !jaGravou.current) {
+    if (!revendo) {
      jaGravou.current = true
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/BemVindo.tsx
teste: apps/web/src/areas/aluno/introducao/BemVindo.test.tsx › o último "Continuar" de quem revê também só fecha
  function terminar(): void {
-    if (!revendo && !jaGravou.current) {
+    if (!jaGravou.current) {
      jaGravou.current = true
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/BemVindo.tsx
teste: apps/web/src/areas/aluno/introducao/BemVindo.test.tsx › com a data já gravada, "Fechar" no passo
      gravar.mutate()
    }
-    ir(revendo ? ROTAS_DO_ALUNO.eu : ROTAS_DO_ALUNO.inicio, { replace: true })
+    ir(ROTAS_DO_ALUNO.inicio, { replace: true })
  }
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/BemVindo.tsx
teste: apps/web/src/areas/aluno/introducao/BemVindo.test.tsx › dois cliques seguidos em "Continuar" no último passo fazem um POST só
    mutationFn: concluirIntroducao,
-    onSuccess: ({ introducaoVistaEm }) => cliente.setQueryData(consultaEu.queryKey, (antes) => (antes === undefined ? antes : { ...antes, introducaoVistaEm })),
+    onSuccess: () => cliente.setQueryData(consultaEu.queryKey, (antes) => antes),
  })
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/BemVindo.tsx
teste: apps/web/src/areas/aluno/introducao/BemVindo.test.tsx › data nula é a primeira vez
-  const revendo = eu.data !== undefined && eu.data.introducaoVistaEm !== null
+  const revendo = eu.data !== undefined
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/BemVindo.tsx
teste: apps/web/src/areas/aluno/introducao/BemVindo.test.tsx › mostra a fala do passo 1 e o "Sair"
-  const revendo = eu.data !== undefined && eu.data.introducaoVistaEm !== null
+  const revendo = eu.data.introducaoVistaEm !== null
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/BemVindo.tsx
teste: apps/web/src/areas/aluno/introducao/BemVindo.test.tsx › mostra a fala do passo 1 e o "Sair", sem
-  if (eu.data === undefined && eu.isError) {
+  if (eu.data === undefined) {
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/BemVindo.tsx
teste: apps/web/src/areas/aluno/introducao/BemVindo.test.tsx › uma releitura do `/v1/eu` que falha não tira os passos da tela
-  if (eu.data === undefined && eu.isError) {
+  if (eu.isError) {
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/BemVindo.tsx
teste: apps/web/src/areas/aluno/introducao/BemVindo.test.tsx › com a data já gravada, "Fechar" está em todo passo
-  return <Introducao passos={passos} agente="tutor" revendo={revendo} aoConcluir={terminar} aoPular={terminar} />
+  return <Introducao passos={passos} agente="tutor" aoConcluir={terminar} aoPular={terminar} />
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/BemVindo.tsx
teste: apps/web/src/areas/aluno/introducao/BemVindo.test.tsx › o passo 3 mostra o aviso
-  if (passo.id === 'privacidade') return <AvisoDePrivacidade />
+  if (passo.id === 'privacidadeX') return <AvisoDePrivacidade />
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/BemVindo.tsx
teste: apps/web/src/areas/aluno/introducao/BemVindo.test.tsx › seguir ou pular no passo 4 sem escolher a letra
-  if (passo.id === 'letra') return <PassoDaLetra />
+  if (passo.id === 'letraX') return <PassoDaLetra />
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts › os três primeiros passos são obrigatórios
-  { id: 'supervisao', pose: 'apontando', fala: FALA_DA_SUPERVISAO, linhas: LINHAS_DA_SUPERVISAO, obrigatorio: true },
+  { id: 'supervisao', pose: 'apontando', fala: FALA_DA_SUPERVISAO, linhas: LINHAS_DA_SUPERVISAO, obrigatorio: false },
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts › o passo 1 diz que o Tutor é um programa
-export const FRASE_QUE_PODE_ERRAR = 'Eu posso errar. Confira no livro ou pergunte a quem dá a aula.'
+export const FRASE_QUE_PODE_ERRAR = 'Confira no livro ou pergunte a quem dá a aula.'
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/aviso-de-privacidade.ts
teste: apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts › o prazo da conversa com o Tutor usa o piso e o teto
-export const FRASE_DO_PRAZO_DA_CONVERSA = `A conversa com o Tutor fica de ${String(piso)} a ${String(teto)} meses; a escola escolhe.`
+export const FRASE_DO_PRAZO_DA_CONVERSA = 'A conversa com o Tutor fica de 12 a 24 meses; a escola escolhe.'
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/aviso-de-privacidade.ts
teste: apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts › os dados não treinam IA
-    frases: [FRASE_DO_QUE_VAI_A_IA, FRASE_DA_EMPRESA, FRASE_DO_NAO_TREINA],
+    frases: [FRASE_DO_QUE_VAI_A_IA, FRASE_DA_EMPRESA],
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/aviso-de-privacidade.ts
teste: apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts › a supervisão é a frase da faixa do Início
-    frases: [FRASE_DO_PROFESSOR, FRASE_DA_SUPERVISAO, FRASE_DO_AVISO_DE_ATENCAO, FRASE_DA_COORDENACAO, FRASE_DO_REGISTRO, FRASE_DOS_COLEGAS],
+    frases: [FRASE_DO_PROFESSOR, FRASE_DO_AVISO_DE_ATENCAO, FRASE_DA_COORDENACAO, FRASE_DO_REGISTRO, FRASE_DOS_COLEGAS],
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/aviso-de-privacidade.ts
teste: apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts › o que não temos: "CPF"
-export const FRASE_DO_QUE_NAO_TEMOS = 'Não temos seu e-mail, telefone, CPF, foto, endereço nem data de nascimento.'
+export const FRASE_DO_QUE_NAO_TEMOS = 'Não temos seu e-mail, telefone, foto, endereço nem data de nascimento.'
```

```mutacao
arquivo: apps/web/src/paginas/Inicio.tsx
teste: apps/web/src/paginas/Inicio.test.tsx › o aluno abre em /aluno/inicio
-  if (introducao !== undefined && eu.data?.introducaoVistaEm === null) return <Redirect to={introducao} replace />
+  if (introducao !== undefined) return <Redirect to={introducao} replace />
```

```mutacao
arquivo: apps/web/src/paginas/Inicio.tsx
teste: apps/web/src/paginas/Inicio.test.tsx › com a data nula, o
-  if (introducao !== undefined && eu.data?.introducaoVistaEm === null) return <Redirect to={introducao} replace />
+  if (eu.data?.introducaoVistaEm === null) return <Redirect to={introducao ?? ROTAS.inicio} replace />
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/BemVindo.tsx
teste: apps/web/src/areas/aluno/introducao/BemVindo.test.tsx › mostra a fala do passo 1 e o "Sair"
-  if (eu.data === undefined) {
+  if (eu.data === null) {
```

```mutacao
arquivo: apps/web/src/paginas/Inicio.tsx
teste: apps/web/src/paginas/Inicio.test.tsx › com a data nula, o
-  const introducao = doPapel(INTRODUCAO_POR_PAPEL, papel)
+  const introducao = INTRODUCAO_POR_PAPEL.aluno
```

```mutacao
arquivo: apps/web/src/paginas/Inicio.tsx
teste: apps/web/src/paginas/Inicio.test.tsx › com a data nula, o
-  if (abertura !== undefined) return <Redirect to={abertura} replace />
+  if (abertura !== undefined && papel === 'aluno') return <Redirect to={abertura} replace />
```

```mutacao
arquivo: apps/web/src/paginas/Inicio.tsx
teste: apps/web/src/paginas/Inicio.test.tsx › mantém a tela em pé com "Tentar de novo"
-  return papel === undefined ? undefined : tabela[papel]
+  return papel === undefined ? tabela.aluno : tabela[papel]
```

```mutacao
arquivo: apps/web/src/areas/aluno/Eu.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › saindo: a linha diz
-          titulo={saindo ? 'Saindo…' : 'Sair'}
+          titulo={'Sair'}
```

```mutacao
arquivo: apps/web/src/areas/aluno/Eu.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › com dado
-            para={ROTAS_DO_ALUNO.bemVindo}
+            para={ROTAS_DO_ALUNO.eu}
```

```mutacao
arquivo: apps/web/src/areas/aluno/rotas.tsx
teste: apps/web/src/areas/aluno/rotas.test.tsx › "/aluno/bem-vindo" abre a introdução
      <Route path={ROTAS_DO_ALUNO.eu} component={Eu} />
-      <Route path={ROTAS_DO_ALUNO.bemVindo} component={BemVindo} />
```

```mutacao
arquivo: apps/web/src/componentes/ui/Linha.tsx
teste: apps/web/src/componentes/ui/Linha.test.tsx › o título que pede
-          <span title={titulo} className={`t-cartao text-tinta ${tituloEmDuasLinhas ? 'line-clamp-2 break-words' : 'truncate'}`}>
+          <span title={titulo} className={`t-cartao text-tinta ${tituloEmDuasLinhas ? 'truncate' : 'truncate'}`}>
```

```mutacao
arquivo: apps/web/src/areas/aluno/Eu.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › o título "Rever a introdução" quebra
-          tituloEmDuasLinhas
+          tituloEmDuasLinhas={false}
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/BemVindo.tsx
teste: apps/web/src/areas/aluno/introducao/BemVindo.test.tsx › o aviso mostra "Role para ler mais" enquanto
-  const [haMais, definirHaMais] = useState(true)
+  const [haMais, definirHaMais] = useState(false)
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/BemVindo.tsx
teste: apps/web/src/areas/aluno/introducao/BemVindo.test.tsx › o aviso mostra "Role para ler mais" enquanto
-          definirHaMais(regiao.scrollTop + regiao.clientHeight < regiao.scrollHeight - FOLGA_DO_FIM)
+          definirHaMais(true)
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/BemVindo.tsx
teste: apps/web/src/areas/aluno/introducao/BemVindo.test.tsx › o aviso mostra "Role para ler mais" enquanto
-      {haMais && (
+      {!haMais && (
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/aviso-de-privacidade.ts
teste: apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts › diz quem vê: se o aluno conta algo pessoal difícil
-    frases: [FRASE_DO_PROFESSOR, FRASE_DA_SUPERVISAO, FRASE_DO_AVISO_DE_ATENCAO, FRASE_DA_COORDENACAO, FRASE_DO_REGISTRO, FRASE_DOS_COLEGAS],
+    frases: [FRASE_DO_PROFESSOR, FRASE_DA_SUPERVISAO, FRASE_DA_COORDENACAO, FRASE_DO_REGISTRO, FRASE_DOS_COLEGAS],
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/aviso-de-privacidade.ts
teste: apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts › diz o que a escola guarda: as tarefas
-export const FRASE_DAS_TAREFAS = 'A escola guarda suas tarefas e o resultado delas.'
+export const FRASE_DAS_TAREFAS = 'Guardamos suas tarefas e o resultado delas.'
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | O "Continuar" do passo 3 libera sem ter rolado o aviso inteiro | Recusada: o PRD não exige. Fica para o Validador conferir contra o RF20 |
| frontend-reviewer (1ª) | A barra de baixo aparece sobre o conteúdo na foto de página inteira de `/aluno/eu` | Recusada: o próprio revisor diz que é efeito da barra fixa na captura, não do código |
| revisor-geral (1ª) | Quem revê fica com Eu duas vezes no histórico (`BemVindo.tsx`, o `replace: true` do fechamento) | `TODO.md`: muda comportamento de navegação, que a divergência 3 desta tarefa declara ("levam a Eu") |
| privacy-guardian (1ª) | "Esse programa é de uma empresa contratada" só é verdade com provedor externo; ligar ao cadastro de suboperador | `TODO.md`: depende de tela de suboperador da escola, que não existe nesta spec |
| privacy-guardian (1ª) | O aviso não fala do registro de acesso (IP e hora, 6 meses) | Recusada: o revisor diz que cabe em "Meus dados", sem entrar no passo 3 |
| privacy-guardian (1ª) | A frase "O que você escreve e as habilidades a rever vão a um programa de IA" está certa; muda junto se a entrada do Tutor ganhar campo | Sem ação: o revisor confirma a frase |
| test-engineer (1ª) | A frase de IA perdeu o "ao Tutor" da subtarefa 9.1 e pode ser lida como se as respostas das tarefas fossem à IA | Sem ação: o `privacy-guardian` conferiu o fluxo e confirma que a frase está certa |
| infra-guardian (1ª) | `infra/k6/login-7h30.js`: o seed da rajada cria os alunos com a introdução já vista; falta uma variante com parte das contas em `por_ver` | `TODO.md` |
| infra-guardian (1ª) | Quando a gravação falha, o cache `['eu']` fica com a data nula e a introdução abre de novo na volta a `/` | Recusada: a tarefa aceita isso ("a introdução volta na entrada seguinte"); o runbook só ganha o parágrafo se o contador `eu.introducao_falha` subir em produção |
| revisor-geral (1ª) | (o corte de "Rever a introdução" no celular) | Já é o item 1 |
| conformidade-reviewer (1ª), item 6 da ordem da rodada 1 | Dizer no aviso que o professor pode abrir a conversa | Não aplicada: nada na tela abre a conversa (`tutor.controller.ts`, `SupervisaoDoTutorService`); o `revisor-geral` (2ª) confirmou que escrever isso seria dizer ao aluno algo falso. Gatilho: no dia em que existir a tela que abre a conversa (regra 50, item 10), a frase do sinal e o aviso mudam juntos (`revisor-geral`, 2ª) → `TODO.md` e pendência 12 de `docs/aia/tutor.md` |
| frontend-reviewer (2ª), infra-guardian (2ª), test-engineer (2ª), revisor-geral (2ª) | `BemVindo.tsx`, `useState(true)` de `haMais`: se o aviso couber inteiro numa tela alta, a faixa "Role para ler mais" fica para sempre; medir `scrollHeight > clientHeight` ao montar e no redimensionamento | `TODO.md`: hoje não acontece (17 frases passam de `28dvh` em qualquer tela real), e os quatro revisores aprovaram. Um teste: `scrollHeight` igual a `clientHeight` sem evento de rolagem não mostra a faixa |
| frontend-reviewer (2ª) | A barra de abas fixa aparece sobre o conteúdo nas fotos de página inteira de `/aluno/eu` no celular; `scroll-padding` ou `pb` no miolo | Recusada: o revisor diz que é efeito da captura com elemento fixo; só se a validação visual real mostrar a última linha escondida |
| frontend-reviewer (2ª) | Conferir que `docs/lgpd.md` e `docs/aia/tutor.md` dizem o mesmo que o aviso | Sem ação: o `privacy-guardian` (2ª) conferiu os dois e o `TODO.md` |
| privacy-guardian (2ª) | O registro de acesso (Marco Civil) fora do aviso não tem destino | `TODO.md`, junto da pendência 12 de `docs/aia/tutor.md`: a revisão do texto por advogado decide |
| privacy-guardian (2ª) | Quando o Joaquim decidir a mensagem fixa do Tutor ao receber o sinal, ela e a frase do aviso devem dizer a mesma coisa, de preferência por uma constante só | `TODO.md`, na linha que já registra a decisão da mensagem fixa |
| privacy-guardian (2ª) | "Esse programa é de uma empresa contratada" só vale com provedor externo | Já está no `TODO.md` (ligar ao cadastro de suboperadores) |
| conformidade-reviewer (2ª) | A mensagem fixa que o aluno recebe na hora do sinal ainda não diz que o professor é avisado; entra na validação desta spec | Já está no `TODO.md` (linhas 58 a 62), com a decisão do Joaquim; o Validador a recebe como ponto de atenção |
| conformidade-reviewer (2ª) | `FRASE_DO_QUE_NAO_TEMOS` ("Não temos seu e-mail…") ficou na primeira pessoa, e o grupo agora diz "A escola guarda" | `TODO.md`, na revisão do texto por orientação educacional e advogado (pendência 12) |
| test-engineer (2ª) | A tabela de testes de `9_task.md` está atrás do código: a linha 50 ainda diz "o que guardamos" e não lista a frase do sinal; a linha 58 atribui "todo passo fecha" ao e2e; faltam linhas para a faixa, o título a 360 px e a cópia das falas | O Implementador ajusta a tabela da tarefa junto com a cópia desta tabela (só o documento da tarefa, sem código; não pede rodada nova) |
| test-engineer (2ª) | O Esc no passo 4, revendo, não tem caso próprio | Recusada: o revisor diz que só importa se o passo 4 deixar de usar o mesmo `podeFechar` |
| revisor-geral (2ª) | `textos-da-introducao.test.ts:331-339` lê `casca.ts` por expressão regular, que quebra com apóstrofo ou template string; o `e2e/` importar o `.ts` puro resolveria na origem | `TODO.md`: a mudança toca como o e2e importa módulo da web, fora do escopo desta tarefa |
| revisor-geral (2ª) | `docs/lgpd.md:369` e `docs/conformidade-mec.md`, item 3, só listam a revisão do texto como pendente; falta a decisão sobre a mensagem fixa | `TODO.md` já registra a decisão; os dois documentos mudam quando o Joaquim decidir |
| infra-guardian (2ª) | A variante do k6 com contas em `por_ver` continua aberta e precisa estar pronta antes de ligar a introdução no piloto | Já está no `TODO.md` |

<!-- A seção "Revisões" é criada pelo hook tools/processo/revisoes.ts: não a escreva à mão nem acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 16:40:38 | 2026-10-25 16:40:57 | `tenancy-guardian` | 1 | APROVADO | adc51855d5a5a831b |
| 2026-10-25 16:40:43 | 2026-10-25 16:41:27 | `infra-guardian` | 1 | APROVADO | a7cc1e488c059936e |
| 2026-10-25 16:40:11 | 2026-10-25 16:41:28 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | a4ab4d6cccf672edf |
| 2026-10-25 16:40:17 | 2026-10-25 16:41:38 | `conformidade-reviewer` | 1 | APROVADO | a8f7f7dd16a84949a |
| 2026-10-25 16:40:33 | 2026-10-25 16:41:43 | `revisor-geral` | 1 | APROVADO | afba254971ce1f03a |
| 2026-10-25 16:40:27 | 2026-10-25 16:42:48 | `test-engineer` | 1 | REPROVADO | ab194882dd865d89e |
| 2026-10-25 16:40:22 | 2026-10-25 16:43:09 | `privacy-guardian` | 1 | REPROVADO | aeddc5024667c2540 |
| 2026-10-25 17:09:11 | 2026-10-25 17:09:53 | `frontend-reviewer` | 2 | APROVADO | a21fbce44db22bcc7 |
| 2026-10-25 17:09:53 | 2026-10-25 17:10:19 | `tenancy-guardian` | 2 | APROVADO | a028a29a05a073365 |
| 2026-10-25 17:09:59 | 2026-10-25 17:10:24 | `infra-guardian` | 2 | APROVADO | a9386e851c360c6fb |
| 2026-10-25 17:09:32 | 2026-10-25 17:10:41 | `privacy-guardian` | 2 | APROVADO | af460998c29addee3 |
| 2026-10-25 17:09:40 | 2026-10-25 17:11:04 | `conformidade-reviewer` | 2 | APROVADO | a103c9f39e463bc5e |
| 2026-10-25 17:09:21 | 2026-10-25 17:11:09 | `test-engineer` | 2 | APROVADO | a9bbf3abe8f4ff5f2 |
| 2026-10-25 17:09:47 | 2026-10-25 17:11:52 | `revisor-geral` | 2 | APROVADO | ac808df85bc2cb90f |
