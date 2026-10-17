# Tarefa 5.0 — Escola › Turmas em tabela, com o ano e as disciplinas num painel ao lado

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A aba Turmas mostra as turmas do ano em tabela, por série, com a linha inteira abrindo a lista da turma; ano letivo, séries e disciplinas passam a um painel ao lado; e tudo o que a Estrutura faz hoje continua.

## Contexto necessário

- `techspec.md` seções 5 (`?painel=`, `?situacao=`), 9 ("Escola › Turmas", "Nomes que não mudam") e 12; `prd.md` RF11, RF12, RF22, RF23 e seção 10 ("sem lista" não entra)
- `mockup.md` seções 3.1, 3.2 e 3.3
- Código: `apps/web/src/areas/coordenacao/Estrutura.tsx` inteiro (os diálogos, os anúncios e o foco de cada ação ficam); `ordem.ts`; `o-que-falta-da-escola.ts`

## Subtarefas

- [x] 5.1 — `turmas-da-escola.ts` (puro): turmas agrupadas por série, na ordem de `ordenarSeries`; os professores de cada turma, pelos vínculos pendentes e confirmados; "sem professor"
- [x] 5.2 — A tabela, na região "Turmas de <ano>": colunas Turma, Turno, Professores (até dois nomes e "+N") e Situação (`Estado` "Sem professor", em texto). A linha é um link com o nome acessível "Lista de nomes da turma <nome>"; a última célula é um `Menu` "Mais ações da turma <nome>", com Renomear e Excluir
- [x] 5.3 — `Segmentado` "Situação": "Todas" e "Sem professor", no endereço (`?situacao=sem-professor`); o vazio do filtro
- [x] 5.4 — "Nova turma" como o único botão `primario`; o diálogo é o de hoje
- [x] 5.5 — O botão "Ano letivo e disciplinas" abre o `PainelLado` (`?painel=ano`) com as regiões "Ano letivo", "Séries" e "Disciplinas" de hoje, e os diálogos delas por cima
- [x] 5.6 — `Aviso` "Para terminar a escola" enquanto falta passo, com "Ver o que falta" (`?painel=falta`): a região "O que falta para a escola começar", com os sete passos. Sem onça
- [x] 5.7 — Sem ano letivo: o vazio "Comece pelo ano letivo", com "Criar o ano letivo". Sem ano em curso: o texto de hoje
- [x] 5.8 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/Estrutura.tsx` | alterado |
| `apps/web/src/areas/coordenacao/AnoEDisciplinas.tsx`, `apps/web/src/areas/coordenacao/OQueFalta.tsx` | novo |
| `apps/web/src/areas/coordenacao/turmas-da-escola.ts`, `apps/web/src/areas/coordenacao/turmas-da-escola.test.ts`, `apps/web/src/areas/coordenacao/Estrutura.test.tsx` | novo |
| `e2e/estrutura.spec.ts`, `e2e/escola-montada.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| agrupar e marcar | unidade | turma sem vínculo, só com contestado ou só com encerrado é "sem professor"; duas disciplinas do mesmo professor mostram o nome uma vez |
| estados da tela | componente | carregando; erro; "Comece pelo ano letivo"; sem ano em curso; com dado; o filtro que não acha nada; "falta" só com a leitura terminada; o foco depois de criar, renomear e excluir |
| nada de lista de nomes | componente | a aba não chama `/lista`: não há contagem de nomes nem "sem lista" |
| montar a escola | e2e | os casos de `estrutura.spec.ts`, abrindo o painel para ano, série e disciplina; a página não rola a 1366 × 768; a tabela vira lista a 360 px |
| renomear e excluir | e2e | o caso de hoje, pelo menu da linha: o nome repetido, o `CONFLITO` que explica, a turma que outra pessoa excluiu |
| diálogo sobre o painel | e2e | foco preso no diálogo, Esc fecha só ele, e o foco volta ao painel |
| recomeço: segunda pessoa; o painel pelo endereço; resposta atrasada; falha com o diálogo aberto | e2e | nada da escola anterior, nem com `?painel=ano` no endereço; os casos de hoje |

## Como testar

- `e2e/estrutura.spec.ts › carregando, o vazio "Comece pelo ano letivo"…`, `› o nome repetido fica no campo…` e `› sem rolagem horizontal…`: mudam o clique que abre o painel e o menu, nunca a regra
- `escola-montada` e o roteiro: só os passos de ano, série, disciplina e turma
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/Estrutura.test.tsx`; `node tools/ci/e2e.ts --manter-ambiente e2e/estrutura.spec.ts`
- Armadilha: dois `<dialog>` empilhados não abrem no jsdom; o diálogo sobre o painel se prova no e2e
- Telas: `coordenacao`, `/coordenacao/estrutura`, com `text=Ano letivo e disciplinas` e `text=Ver o que falta`; também com `--vazia`; mockup `/coordenacao/escola`, `?painel=ano`, `?painel=roteiro`

## Fora do escopo desta tarefa

A alocação, que fica na página até a 7.0; a lista da turma (9.0); "Grade e calendário", "Importar listas", busca e filtro "Sem lista" ou "Com adaptação".

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| Uma `Tabela` por série, cada uma com o título da série (`h3`), e não uma `Tabela` agrupada; a linha da turma não usa `Linha` | A `Tabela` da X1 não agrupa (o `⚠️ NÃO VERIFICADO` da §12 previa isso: "o que faltar entra na tarefa"). Agrupar mudaria a peça para uma tela só; uma tabela por série mantém a peça e dá ao leitor de tela o nome de cada série. A `Linha` continua nas listas do painel | `techspec.md` §9, "Escola › Turmas" (parágrafo "Como ficou na 5.0"); §12, linha `NÃO VERIFICADO`; `prd.md` RF11 |
| `Tabela.tsx` ganha `relative` na linha e no cartão da lista, e o link da primeira célula se estende sobre ela (`after:absolute after:inset-0`), com o `Menu` num contêiner `relative` depois do link (sem `z-index`, para a lista do menu aberto não ficar presa na linha) | RF11 pede a linha inteira abrindo a turma, e a peça não tinha linha que abre ("é da X2"). O link continua na célula do nome, com o `Menu` como irmão, como a §9 manda; só o alvo do clique cresce. `Tabela.tsx` não estava em "Arquivos previstos" | `techspec.md` §9, "Escola › Turmas" (parágrafo "Como ficou na 5.0") e "Chromebook e celular" ("O link da linha fica na célula do nome, com o `Menu` como irmão"); `prd.md` RF11 |
| O nome acessível do link, "Lista de nomes da turma <nome>", vem de `aria-label`, e o texto à vista é só o nome da turma | O nome calculado de um texto escondido seguido do nome saía sem o espaço entre os dois. O nome do contrato ("Nomes que não mudam") é o mesmo, e o texto à vista continua dentro dele (WCAG 2.5.3) | `techspec.md` §9, "Nomes que não mudam" |
| A coluna Situação diz "Com professor" quando há professor, além de "Sem professor", e "—" quando os vínculos não vieram inteiros e a turma não tem professor à vista | A subtarefa 5.2 só cita "Sem professor". Sem o outro valor, a célula da turma com professor ficaria vazia e não se distinguiria da que a tela não sabe dizer. O "—" é a recusa de afirmar o que não leu inteiro | `techspec.md` §9, "Escola › Turmas" (parágrafo "Como ficou na 5.0"); `prd.md` RF11 e a linha "Turma sem professor alocado" da seção de casos de borda |
| O primeiro ano letivo criado a partir do vazio abre `?painel=ano` | A 5.7 mantém o "Criar o ano letivo" do vazio, mas o ano, o "Abrir o ano" e o anúncio de "criado" moram agora no painel. Sem abri-lo, a pessoa criaria o ano e não veria o que fazer em seguida. De dentro do painel o ano criado não empilha outro passo no histórico | `techspec.md` §9, "Escola › Turmas" (parágrafo "Como ficou na 5.0") |
| Asserções de outros arquivos de teste mudam de lugar, sem sair: `titulo-das-telas.test.tsx` (o `h1` de "com dado" espera a região "Turmas de 2026", e não "Séries"), `alocacao.spec.ts` e `professores.spec.ts` (a região "O que falta para a escola começar" agora está no painel `?painel=falta`) e as fixtures `coordenacao.ts` e `verificacoes.ts` (os auxiliares do painel; `larguraExcedenteDoDialogo` mede o diálogo de cima) | As regiões "Séries", "Disciplinas" e "O que falta para a escola começar" saíram da página para os painéis (RF12). Os arquivos não estavam em "Arquivos previstos", mas a regra que cada caso prova é a mesma: só o caminho até a região mudou | `techspec.md` §10, linha E2E ("os specs de hoje, com o caminho novo, nos dois projetos") e §9, "Nomes que não mudam" |
| "Alocar" continua primário (botão cheio) até a 7.0, e a aba tem dois botões cheios: "Nova turma" e, na Alocação, "Alocar" | A 5.4 e o RF11 pedem "Nova turma" como único primário; a `Alocacao.tsx` fica como está até a 7.0, que a refaz (RF11 e a subtarefa 5.7 mantêm "o texto de hoje"), e rebaixar o botão mexeria num arquivo que a 7.0 reescreve. O teste de componente conta os cheios por região e espera a Alocação carregar | `techspec.md` §9, "Escola › Turmas" (parágrafo "Como ficou na 5.0"); `prd.md` RF11 |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/areas/coordenacao/turmas-da-escola.ts
teste: apps/web/src/areas/coordenacao/turmas-da-escola.test.ts › sem os vínculos inteiros, a turma sem professor à vista
- const semProfessor = vinculos?.completa === true ? new Set(turmasSemProfessor(turmas, vinculos.itens).map((turma) => turma.id)) : undefined
+ const semProfessor = vinculos !== undefined ? new Set(turmasSemProfessor(turmas, vinculos.itens).map((turma) => turma.id)) : undefined
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/turmas-da-escola.ts
teste: apps/web/src/areas/coordenacao/turmas-da-escola.test.ts › conta o vínculo pendente e o confirmado
- if (!daProfessor(vinculo)) continue
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/turmas-da-escola.ts
teste: apps/web/src/areas/coordenacao/turmas-da-escola.test.ts › o vínculo de aluno e o de outra turma não entram
- return vinculo.papel === 'professor' && (vinculo.estado === 'pendente' || vinculo.estado === 'confirmado')
+ return (vinculo.estado === 'pendente' || vinculo.estado === 'confirmado')
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/turmas-da-escola.ts
teste: apps/web/src/areas/coordenacao/turmas-da-escola.test.ts › conta o vínculo pendente e o confirmado
- return vinculo.papel === 'professor' && (vinculo.estado === 'pendente' || vinculo.estado === 'confirmado')
+ return vinculo.papel === 'professor' && vinculo.estado === 'confirmado'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/turmas-da-escola.ts
teste: apps/web/src/areas/coordenacao/turmas-da-escola.test.ts › o professor com duas disciplinas
- daTurma.set(vinculo.usuarioId, nomeDoProfessor(vinculo.usuarioId))
+ daTurma.set(vinculo.id, nomeDoProfessor(vinculo.usuarioId))
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/turmas-da-escola.ts
teste: apps/web/src/areas/coordenacao/turmas-da-escola.test.ts › sem os vínculos inteiros, a turma sem professor à vista
- semProfessor: semProfessor === undefined ? (nomes.length > 0 ? false : undefined) : semProfessor.has(turma.id),
+ semProfessor: semProfessor === undefined ? undefined : semProfessor.has(turma.id),
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/turmas-da-escola.ts
teste: apps/web/src/areas/coordenacao/turmas-da-escola.test.ts › agrupa na ordem da escola
- if (ultimo?.serie.id === item.turma.serie.id) ultimo.turmas.push(item)
+ if (ultimo !== undefined) ultimo.turmas.push(item)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/turmas-da-escola.ts
teste: apps/web/src/areas/coordenacao/turmas-da-escola.test.ts › textoDosProfessores
- const resto = nomes.length - 2
+ const resto = nomes.length - 3
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/turmas-da-escola.ts
teste: apps/web/src/areas/coordenacao/turmas-da-escola.test.ts › textoDosProfessores
- return resto > 0 ? `${nomes.slice(0, 2).join(', ')} +${String(resto)}` : nomes.join(', ')
+ return resto > 0 ? `${nomes.slice(0, 1).join(', ')} +${String(resto)}` : nomes.join(', ')
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/turmas-da-escola.ts
teste: apps/web/src/areas/coordenacao/turmas-da-escola.test.ts › o painel é de lista fechada
- return PAINEIS_DA_ESTRUTURA.find((painel) => painel === valor)
+ return (valor ?? undefined) as PainelDaEstrutura | undefined
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/turmas-da-escola.ts
teste: apps/web/src/areas/coordenacao/turmas-da-escola.test.ts › a situação é
- return new URLSearchParams(busca).get('situacao') === 'sem-professor' ? 'sem-professor' : 'todas'
+ return new URLSearchParams(busca).get('situacao') === null ? 'todas' : 'sem-professor' // ? 'sem-professor' : 'todas'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/turmas-da-escola.ts
teste: apps/web/src/areas/coordenacao/turmas-da-escola.test.ts › põe e tira um parâmetro
- if (valor === undefined) parametros.delete(nome)
+ if (valor === undefined) parametros.set(nome, '')
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/turmas-da-escola.ts
teste: apps/web/src/areas/coordenacao/turmas-da-escola.test.ts › põe e tira um parâmetro
- return resto === '' ? caminho : `${caminho}?${resto}`
+ return `${caminho}?${resto}`
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › abre o painel no endereço, com as regiões de hoje
  navegar(enderecoComParametro(caminho, busca, 'painel', undefined), {
- replace: true,
+ replace: false,
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › deixa as turmas sem professor, grava no endereço
- const filtrarPor = (nova: SituacaoDasTurmas): void => navegar(enderecoComParametro(caminho, busca, 'situacao', nova === 'todas' ? undefined : nova), { replace: true })
+ const filtrarPor = (nova: SituacaoDasTurmas): void => navegar(enderecoComParametro(caminho, busca, 'situacao', nova === 'todas' ? undefined : nova), { replace: false })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › o painel já está aberto
- if (painel !== 'ano') abrirPainel('ano')
+ abrirPainel('ano')
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › com a escola montada, o aviso não existe
- {faltam.length > 0 && (
+ {true && (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › sem ano em curso: o texto de hoje
- {anoEmCurso !== undefined && <Botao onClick={() => abrir('turma')}>Nova turma</Botao>}
+ <Botao onClick={() => abrir('turma')}>Nova turma</Botao>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › deixa as turmas sem professor, grava no endereço
- const exibidas = filtrando ? linhas.filter((linha) => linha.semProfessor === true) : linhas
+ const exibidas = filtrando ? linhas.filter((linha) => linha.semProfessor !== true) : linhas
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › os vínculos que vieram só em parte
- } else if (filtrando && vinculos.data?.completa === false) {
+ } else if (false) {
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › o filtro que não acha nada diz
- } else if (exibidas.length === 0) {
+ } else if (exibidas.length === -1) {
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › os vínculos que vieram só em parte
- semProfessor === undefined ? '—' : semProfessor ? <Estado familia="pendente">Sem professor</Estado> : <Estado familia="ok">Com professor</Estado>,
+ semProfessor === undefined ? <Estado familia="pendente">Sem professor</Estado> : semProfessor ? <Estado familia="pendente">Sem professor</Estado> : <Estado familia="ok">Com professor</Estado>,
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › o menu da linha tem Renomear e Excluir
- { id: 'excluir', rotulo: 'Excluir', perigo: true },
+ { id: 'excluir', rotulo: 'Excluir' },
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › a linha é um link para a lista da turma
- "font-semibold text-tinta after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:outline-none focus-visible:after:rounded-linha focus-visible:after:outline-3 focus-visible:after:-outline-offset-3 focus-visible:after:outline-foco"
+ "font-semibold text-tinta after:content-[''] hover:underline focus-visible:outline-none focus-visible:after:rounded-linha focus-visible:after:outline-3 focus-visible:after:-outline-offset-3 focus-visible:after:outline-foco"
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › a linha é um link para a lista da turma
- <span className="relative inline-flex">
+ <span className="inline-flex">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › renomear pelo menu da linha
- aoEscolher={(turma, acao) => abrir(acao === 'excluir' ? 'excluir_turma' : 'renomear_turma', turma)}
+ aoEscolher={(turma, acao) => abrir(acao === 'excluir' ? 'renomear_turma' : 'excluir_turma', turma)}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › excluir pelo menu da linha
- aoEscolher={(id) => aoEscolher(turma, id === 'excluir' ? 'excluir' : 'renomear')}
+ aoEscolher={(id) => aoEscolher(turma, id === 'excluir' ? 'renomear' : 'excluir')}
```

```mutacao
arquivo: apps/web/src/componentes/Tabela.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › a linha é um link para a lista da turma
- <tr key={chaveDaLinha(linha)} className="relative h-16 border-b-2 border-borda last:border-b-0">
+ <tr key={chaveDaLinha(linha)} className="h-16 border-b-2 border-borda last:border-b-0">
```

```mutacao
arquivo: apps/web/src/componentes/Tabela.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › a 360 px a tabela vira lista
- <li key={chaveDaLinha(linha)} className="relative min-w-0 rounded-cartao border-2 border-borda bg-superficie p-4">
+ <li key={chaveDaLinha(linha)} className="min-w-0 rounded-cartao border-2 border-borda bg-superficie p-4">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/OQueFalta.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › enquanto falta passo
- <PainelLado titulo="O que falta" aoFechar={aoFechar} focoDeReserva={focoDeReserva}>
+ <PainelLado titulo="Roteiro" aoFechar={aoFechar} focoDeReserva={focoDeReserva}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/AnoEDisciplinas.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › abre o painel no endereço, com as regiões de hoje
- <PainelLado titulo="Ano letivo e disciplinas" aoFechar={aoFechar} focoDeReserva={focoDeReserva}>
+ <PainelLado titulo="Ano" aoFechar={aoFechar} focoDeReserva={focoDeReserva}>
```


```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › os vínculos ainda não lidos
-   if (filtrando && vinculos.data === undefined) {
+   if (filtrando && vinculos.data !== undefined) {
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › os vínculos que falharam
-     corpo = vinculos.isError ? (
+     corpo = !vinculos.isError ? (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › os vínculos que falharam
-       {!filtrando && vinculos.data === undefined && vinculos.isError && (
+       {!filtrando && vinculos.data === undefined && !vinculos.isError && (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › deixa as turmas sem professor, grava no endereço
- navegar(enderecoComParametro(caminho, busca, 'situacao', nova === 'todas' ? undefined : nova), { replace: true })
+ navegar(enderecoComParametro(caminho, busca, 'situacao', nova), { replace: true })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › pelo endereço, abre já com o painel
-           {painel === 'ano' && (
+           {painel !== 'ano' && (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › enquanto falta passo
-           {painel === 'falta' && <PainelDoQueFalta
+           {painel !== 'falta' && <PainelDoQueFalta
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/turmas-da-escola.ts
teste: apps/web/src/areas/coordenacao/turmas-da-escola.test.ts › conta o vínculo pendente e o confirmado
-     const nomes = ordenarPeloNome(
+     const nomes = ((itens: Array<{ nome: string }>) => itens)(
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/turmas-da-escola.ts
teste: apps/web/src/areas/coordenacao/turmas-da-escola.test.ts › textoDosProfessores
-   if (nomes.length === 0) return '—'
+   if (nomes.length === 0) return ''
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › aberto já pelo endereço, sem botão que o tenha aberto
- if (painelAnterior.current !== undefined && painel === undefined && document.activeElement === document.body) tituloDasTurmas.current?.focus()
+ if (painelAnterior.current !== undefined && painel === undefined && document.activeElement !== document.body) tituloDasTurmas.current?.focus()
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | A linha que abre não tem sinal de que abre: o `mockup.md` seção 3 prevê o "›", e as fotos mostram só o nome em negrito. Um "›" na última célula, ou o nome com a cor de link (`Estrutura.tsx:99`) | tarefa 9.0, que abre a lista da turma, ou o `/validar`; o próprio revisor indicou |
| frontend-reviewer (1ª) | `position: relative` em `<tr>` (`Tabela.tsx:98`) falha em Safari anterior ao 16 | conferir no `/validar`: não há aparelho para conferir antes disso |
| frontend-reviewer (1ª) | O "—" nas colunas Turno e Situação não diz nada ao leitor de tela; um texto escondido como "Sem turno" | muda o nome acessível que o contrato "Nomes que não mudam" fixa e não é barata; `TODO.md`, para a validação decidir |
| frontend-reviewer (1ª) | Fotografar o Aviso "Para terminar a escola" e o vazio "Comece pelo ano letivo" quando a vitrine ganhar uma escola sem ano letivo | `TODO.md`: a vitrine é de `tools/vitrine/`, fora desta tarefa |
| test-engineer (1ª) | Um e2e que siga os links "Ver o que falta" do sino e `PARA_O_ANO` do Painel e veja o painel abrir (`sino-da-coordenacao.spec.ts:115`, `painel-da-coordenacao.spec.ts:144`) | `TODO.md`: toca dois specs que a tarefa não alterou; o `/validar` confere o caminho de ponta a ponta |
| revisor-geral (1ª) | `daProfessor` (`turmas-da-escola.ts:38-40`) repete à mão `'pendente' \| 'confirmado'`, que já existe em `ESTADOS_QUE_DAO_PROFESSOR` (`fila-da-coordenacao.ts:51`): exportar a constante e usá-la nas duas | `TODO.md`: exige mexer em `fila-da-coordenacao.ts`, que a tarefa não toca |
| revisor-geral (1ª) | `ProfessoresDaTurma.tsx:75` repete `'Nome não carregado'`; usar `NOME_NAO_CARREGADO` | `TODO.md`: `ProfessoresDaTurma.tsx` não é arquivo desta tarefa |
| revisor-geral (1ª) | "Ver o que falta" e "Ano letivo e disciplinas" (`Estrutura.tsx:252` e `:267`) são `<button>` crus com `CLASSES_DO_BOTAO_SECUNDARIO`, enquanto "Tentar de novo" (`:522`) usa `<Botao variante="secundario">` | `TODO.md`: trocar a marcação dos dois botões da tela muda a peça de ação principal; fica para o `/validar` decidir |
| revisor-geral (1ª) | A `Secao` agora serve à página de Turmas, mas mora em `AnoEDisciplinas.tsx`; ficaria em `pecas-da-lista.ts` | `TODO.md`: `pecas-da-lista.ts` não é arquivo desta tarefa |
| revisor-geral (1ª) | "Abra o ano letivo acima" (`Estrutura.tsx:275` e `Alocacao.tsx:71`) aponta para um lugar que não existe mais: o ano agora abre no painel | tarefa 7.0, que refaz a `Alocacao.tsx`, junto com o texto de `Estrutura.tsx:275`; a 5.7 pediu "o texto de hoje" e texto de tela não é decisão da Mesa |
| revisor-geral (1ª) | Abrir o painel e fechar deixa duas entradas `/estrutura` seguidas (`Estrutura.test.tsx:456`), então um Voltar logo depois não faz nada visível; considerar ao fixar o padrão para `?professor=` e `?material=` | tarefa 6.0 (`?professor=`) e 8.0 (`?material=`), que fixam o padrão; é decisão de produto sobre histórico |
| frontend-reviewer (2ª) | A foto do menu da linha no celular sai idêntica à da tela sem menu: o `Menu` fecha na rolagem (`flutuante.ts`) e a vitrine rola para fotografar a página inteira; fotografar o menu sem rolar | `TODO.md`, junto do item da vitrine (`tools/vitrine/foto.ts`): é limite da vitrine, fora desta tarefa |
| frontend-reviewer (2ª) | O foco depois de "Excluir" vai ao título das turmas (`Estrutura.test.tsx:596`); conferir de ponta a ponta | `/validar` |
| frontend-reviewer (2ª) | "Abra o ano letivo acima" (`Estrutura.tsx:282`) e os dois `<button>` crus com `CLASSES_DO_BOTAO_SECUNDARIO` (`:259` e `:274`) | já destinadas na 1ª rodada (7.0 e `TODO.md`); sem mudança |
| revisor-geral (2ª) | Nenhuma das fotos do menu aberto prova o caso da 1ª rodada, o menu abrindo para baixo sobre a linha seguinte; fotografar o menu da última linha, ou da penúltima, quando a vitrine permitir | `TODO.md`, junto do item da vitrine acima; o clique sem `force` do e2e de Renomear (`estrutura.spec.ts:605` e `:618`) prova o caso |
| test-engineer (2ª) | O efeito do foco (`Estrutura.tsx:213`) tem duas cláusulas sem bloco de mutação, `painelAnterior.current !== undefined` e `painel === undefined`: hoje as mutações dão quase o mesmo comportamento (na montagem o título ainda não existe, e ao abrir o painel o diálogo pega o foco antes do efeito) | `TODO.md`: passa a importar se a Estrutura um dia montar com os anos no cache e o foco no `body`; tarefa futura que toque `Estrutura.tsx` |
| test-engineer (2ª) | `nadaDeA()` confere a página em instantes; um comentário dizendo que a prova depende de a rota estar segurada evita que alguém tire o `portao` | `TODO.md`: comentário em `e2e/estrutura.spec.ts`; tarefa futura que toque o caso "segunda pessoa" |
| test-engineer (2ª) | As listas vazias do painel de B são conferidas por `locator('li')` com contagem 0: se o vazio da seção virar lista sem `li`, a conferência passa sem provar; conferir o texto do vazio da seção | `TODO.md`: mesma tarefa futura do item acima |

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
| 2026-10-17 01:22:01 | 2026-10-17 01:23:37 | `frontend-reviewer` | 1 | APROVADO | a45854c63071674d1 |
| 2026-10-17 01:22:06 | 2026-10-17 01:25:49 | `test-engineer` | 1 | REPROVADO | a4fc470a174855f71 |
| 2026-10-17 01:22:11 | 2026-10-17 01:27:16 | `revisor-geral` | 1 | REPROVADO | ab2ee257c42b725ed |
| 2026-10-17 01:59:24 | 2026-10-17 02:00:41 | `frontend-reviewer` | 2 | APROVADO | a735625520fe1956f |
| 2026-10-17 01:59:53 | 2026-10-17 02:01:12 | `revisor-geral` | 2 | APROVADO | a76cdfb98f0d69168 |
| 2026-10-17 01:59:39 | 2026-10-17 02:02:18 | `test-engineer` | 2 | APROVADO | ac99a0d54e28ad524 |
