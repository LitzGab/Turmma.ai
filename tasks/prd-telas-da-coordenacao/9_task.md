# Tarefa 9.0 — A lista da turma em duas colunas, com os professores da turma

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A turma aberta pela coordenação fica como no mockup: os nomes em tabela, com a situação de cada um, e ao lado os professores da turma e os pedidos de nome. Tudo o que a tela faz hoje continua, com as mesmas leituras auditadas.

## Contexto necessário

- `techspec.md` seções 7 e 9 ("Lista da turma", "Nomes que não mudam"); `prd.md` RF16, RF22, RF23 e seção 6 ("Leitura auditada não sai sozinha")
- `mockup.md` seção 4
- `.claude/rules/20-lgpd-menores.md` itens 9 e 10
- Código: `apps/web/src/areas/coordenacao/ListaDaTurma.tsx` inteiro, `previa-da-lista.ts` e `ler-arquivo-da-lista.ts`, que **não mudam**; `apps/web/src/api/lista.ts` (`staleTime` infinito) e `pedidos.ts` (a coordenação só lê no "Atualizar"); `apps/web/src/componentes/pedidos/ListaDePedidos.tsx`, que **não muda**

## Subtarefas

- [x] 9.1 — Cabeçalho: "‹ Escola", o `h1` "Turma <nome>" e, de complemento, a série e o turno. Sem "Exportar lista"
- [x] 9.2 — A região "Nomes da turma" em tabela: Nome, Matrícula e Situação (`Estado`, em texto, pelo `estado` do nome). "Acrescentar um nome" e "Retirar" como hoje; a contagem dos aprovados com o texto de hoje, que diz quando é só dos nomes mostrados
- [x] 9.3 — "Subir a lista de nomes": o campo "Lista colada", o arquivo, a região "Prévia" com os erros por linha, e "Gravar lista" só com a prévia limpa e atual, como hoje
- [x] 9.4 — A coluna do lado, a partir de 1024 px: "Professores da turma" (nome, disciplina e estado do vínculo, de `consultaVinculos` e `consultaProfessores`, com link para o painel do professor) e a `ListaDePedidos`, com o "Atualizar"
- [x] 9.5 — A turma que não existe, a que saiu do ano e a leitura que falha: os estados e os textos de hoje
- [x] 9.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx` | alterado |
| `apps/web/src/areas/coordenacao/ProfessoresDaTurma.tsx`, `apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx` | novo |
| `e2e/lista-da-turma.spec.ts`, `e2e/pedidos.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| estados da tela | componente | a turma e a lista, cada uma com carregando e erro; "Nenhum nome nesta turma ainda"; com dado; o foco depois de gravar, acrescentar e retirar |
| leituras | componente | a lista é lida uma vez ao abrir, com a finalidade; os pedidos, nenhuma vez sem o clique; os professores da turma não fazem leitura auditada |
| a prévia e o gravar | e2e | os casos de hoje: windows-1252 e UTF-8 com BOM, erros primeiro e em texto, gravar só sem erro e uma vez só |
| paginada, avulso e retirada | e2e | o caso de hoje: sem releitura ao voltar para a aba; a resposta atrasada; a gravação recusada; a volta para a Escola |
| pedidos pela coordenação | e2e | o caso de `pedidos.spec.ts`: nenhuma leitura sem "Atualizar", nem em 60 s; a finalidade vai e fica na auditoria |
| professores da turma | e2e | duas disciplinas do mesmo professor são duas linhas; turma sem professor diz "Nenhum professor nesta turma" |
| recomeço: segunda pessoa; outra turma pelo histórico; resposta atrasada; a turma excluída entre a prévia e o gravar | e2e | os casos de hoje: o texto colado e a prévia de uma turma nunca vão para outra |
| 1366 × 768 e 360 px | e2e | a página não rola e a lista rola dentro; no celular, uma coluna, sem rolagem de lado |

## Como testar

- `e2e/lista-da-turma.spec.ts` (os três casos vieram de `estrutura.spec.ts` na 3.0): nomes, rótulos e regiões não mudam; só a posição
- `e2e/pedidos.spec.ts › nenhuma leitura sem o clique em "Atualizar"…` e `› com mais de uma página de nomes…`
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx`; `node tools/ci/e2e.ts --manter-ambiente e2e/lista-da-turma.spec.ts`
- Armadilha (correção `2026-10-12-estrutura-lista-estoura-o-prazo`): o caso da lista grande leva mais de um minuto; rode o arquivo sozinho
- Telas: `coordenacao`, `/coordenacao/estrutura`, clique `text=Lista de nomes`; mockup `/coordenacao/escola/turmas/<id>`

## Fora do escopo desta tarefa

A faixa "No Painel"; adaptação e painel do aluno; mudar de turma; encerrar matrícula; acrescentar vários nomes; busca na lista, que é paginada; renomear e excluir a turma (5.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O turno do complemento do título vem de `consultaTurmas` (a lista de turmas do ano, não auditada, só pedida com a turma aberta lida), e não da turma aberta | `GET /v1/turmas/:id` não traz o turno; a subtarefa 9.1 pede "a série e o turno". Sem o turno (a lista falhou ou não traz a turma), o complemento é só a série e a tela continua | `techspec.md` §2 (módulos) e §9 ("Lista da turma"), que não dizem de onde vem o turno; `mockup.md` §4; subtarefa 9.1. Nenhum contrato muda: `consultaTurmas` já existe |
| Os professores são ordenados pelo nome do professor e, dentro dele, pela disciplina (`ordenarPeloNome` sobre `ordenarVinculos`) | `ordenarVinculos` põe a disciplina antes do professor, e as duas disciplinas do mesmo professor tinham de ficar juntas (subtarefa 9.4 e o e2e "duas disciplinas do mesmo professor são duas linhas") | `techspec.md` §9 ("Lista da turma"), que só diz "os professores da turma"; `ordem.ts` não muda |
| O estado do vínculo vai embaixo da disciplina, dentro de `abaixo` da `Linha`, e não no `fim` dela | A coluna tem 19 rem; a `Linha` põe o `fim` ao lado do texto a partir de 640 px, e o selo tomava a largura toda e escondia o nome do professor (visto na vitrine, 1366 px). `Linha.tsx` é peça da X1 e não muda | `techspec.md` §9 ("Lista da turma": duas colunas a partir de 1024 px); `mockup.md` §4 |
| `caminhoDoProfessor` foi para `caminhos.ts`, e `fila-da-coordenacao.ts` passou a usá-lo no lugar das duas constantes locais; `O_MIOLO_QUE_ROLA` e o docstring foram de `moldura.tsx` para `miolo-que-rola.ts`; `NOME_DO_TURNO` ficou em `nome-do-turno.ts` | O link ao painel do professor nasce em três telas (fila, esta e a 5.0) e a lista da turma passou a ter o mesmo miolo que rola das molduras: uma definição só, em vez de cópias. Comportamento igual ao de antes nos dois primeiros | `techspec.md` §2 (módulos afetados: `caminhos.ts`, `moldura.tsx`, `fila-da-coordenacao.ts`) e §9 ("Altura") |
| `apps/web/src/areas/titulo-das-telas.test.tsx` (fora dos "Arquivos previstos") ganhou, num `beforeEach`, os dois dublês de `matchMedia` e `ResizeObserver` que o `jsdom` não tem | A lista da turma passou a ler a largura da janela (tabela e miolo); sem o dublê, os casos "com dado" e "a turma que sai" da coordenação estouravam `window.matchMedia is not a function`. Os casos e as asserções não mudaram | `techspec.md` §9 ("Lista da turma") e §10 (testes); o portão da tarefa o achou na unidade inteira |
| Nos e2e `lista-da-turma.spec.ts` e `pedidos.spec.ts` os nomes passaram a ser contados por `linhasDaTabela` (helper novo em `__fixtures__/coordenacao.ts`: `tbody tr` ou `[data-tabela="lista"] > li`) e não por `listitem`; e a matrícula é lida como `880001`, sem o prefixo "Matrícula " | A região "Nomes da turma" virou tabela (no celular, lista), e a matrícula é uma célula com o próprio rótulo. Nomes, regiões e textos de estado não mudam | `techspec.md` §9 ("Nomes que não mudam": a região "Nomes da turma"; o resto é a forma da tabela) e §10 (testes) |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › a turma que a API não acha
- const turmas = useQuery({ ...consultaTurmas, enabled: turma.data !== undefined })
+ const turmas = useQuery({ ...consultaTurmas, enabled: true })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › diz a série e o turno de complemento
- const turno = turmas.data?.itens.find((candidata) => candidata.id === turmaId)?.turno ?? null
+ const turno = turmas.data?.itens.find((candidata) => candidata.id !== turmaId)?.turno ?? null
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › diz a série e o turno de complemento
- <Tela titulo={nomeDaTurma} descricao={turno === null ? serie : `${serie} · ${NOME_DO_TURNO[turno]}`} antes={voltar} idDoTitulo="titulo-da-turma">
+ <Tela titulo={nomeDaTurma} descricao={serie} antes={voltar} idDoTitulo="titulo-da-turma">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › sem o turno
- <Tela titulo={nomeDaTurma} descricao={turno === null ? serie : `${serie} · ${NOME_DO_TURNO[turno]}`} antes={voltar} idDoTitulo="titulo-da-turma">
+ <Tela titulo={nomeDaTurma} descricao={`${serie} · ${NOME_DO_TURNO[turno ?? 'manha']}`} antes={voltar} idDoTitulo="titulo-da-turma">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › com dado: cada nome é uma linha
- {nome.estado === 'livre' ? <Estado familia="info">{ESTADO_DO_NOME.livre}</Estado> : <Estado familia="pendente">{ESTADO_DO_NOME.reivindicado}</Estado>}
+ {nome.estado !== 'livre' ? <Estado familia="info">{ESTADO_DO_NOME.livre}</Estado> : <Estado familia="pendente">{ESTADO_DO_NOME.reivindicado}</Estado>}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › com dado: cada nome é uma linha
- {nome.estado === 'livre' && (
+ {nome.estado !== 'livre' && (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › a partir de 768 px o miolo que rola recebe foco
- {...(comMiolo ? { tabIndex: 0 } : {})}
+ {...{ tabIndex: 0 }}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › só aprovados: a contagem diz tudo
- {semAprovados.length > 0 && (
+ {true && (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ProfessoresDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › um item por vínculo
- vinculos.data.itens.filter((vinculo) => vinculo.papel === 'professor' && vinculo.turma.id === turmaId),
+ vinculos.data.itens.filter((vinculo) => vinculo.turma.id === turmaId),
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ProfessoresDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › um item por vínculo
- vinculos.data.itens.filter((vinculo) => vinculo.papel === 'professor' && vinculo.turma.id === turmaId),
+ vinculos.data.itens.filter((vinculo) => vinculo.papel === 'professor'),
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ProfessoresDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › um item por vínculo
- const daTurma = ordenarPeloNome(
+ const daTurma = ((lista) => lista)(
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ProfessoresDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › um item por vínculo
- <span>{vinculo.disciplina?.nome ?? 'Sem disciplina'}</span>
+ <span>{vinculo.disciplina?.nome ?? ''}</span>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ProfessoresDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › um item por vínculo
- para={caminhoDoProfessor(vinculo.usuarioId)}
+ para={caminhoDoProfessor(vinculo.id)}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ProfessoresDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › o professor que a lista de professores não traz
- const nomeDe = (vinculo: VinculoDaCoordenacao): string => nomes.get(vinculo.usuarioId) ?? 'Nome não carregado'
+ const nomeDe = (vinculo: VinculoDaCoordenacao): string => nomes.get(vinculo.usuarioId) ?? ''
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ProfessoresDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › um item por vínculo
- ordenarVinculos(
+ ((lista, _nomeDe) => lista)(
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › a turma está na lista de turmas, mas sem turno
- <Tela titulo={nomeDaTurma} descricao={turno === null ? serie : `${serie} · ${NOME_DO_TURNO[turno]}`} antes={voltar} idDoTitulo="titulo-da-turma">
+ <Tela titulo={nomeDaTurma} descricao={turno === undefined ? serie : `${serie} · ${NOME_DO_TURNO[turno as 'manha']}`} antes={voltar} idDoTitulo="titulo-da-turma">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ProfessoresDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › "Tentar de novo" troca o erro por "Carregando…"
- <EstadoErro erro={primeira.error} aoTentarDeNovo={() => falhas.forEach((consulta) => void consulta.refetch({ cancelRefetch: false }))} />
+ <EstadoErro erro={primeira.error} aoTentarDeNovo={() => undefined} />
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ProfessoresDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › a lista de vínculos que bateu no teto de páginas
- vinculos.data.completa && (
+ true && (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ProfessoresDaTurma.tsx
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › carregando e erro são da seção
- const falhas = [vinculos, professores].filter((consulta) => consulta.isError)
+ const falhas = [vinculos, professores]
```

```mutacao
arquivo: apps/web/src/caminhos.ts
teste: apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx › um item por vínculo
- return `${ROTAS_DA_COORDENACAO.professores}?professor=${encodeURIComponent(usuarioId)}`
+ return `${ROTAS_DA_COORDENACAO.professores}?prof=${encodeURIComponent(usuarioId)}`
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: e2e/lista-da-turma.spec.ts › a 1366 × 768 há duas colunas
- className={`grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] ${O_MIOLO_QUE_ROLA}`}
+ className={`grid min-w-0 grid-cols-1 items-start gap-6 ${O_MIOLO_QUE_ROLA}`}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/miolo-que-rola.ts
teste: e2e/lista-da-turma.spec.ts › a 1366 × 768 há duas colunas
- export const O_MIOLO_QUE_ROLA = 'md:relative md:max-h-[calc(100dvh-17rem)] md:overflow-y-auto'
+ export const O_MIOLO_QUE_ROLA = 'md:relative md:max-h-[calc(100dvh-17rem)]'
```

Sem teste que as prenda, por serem refatoração de lugar sem mudança de comportamento: a troca das constantes locais de `fila-da-coordenacao.ts` por `caminhoDoProfessor` (o texto do endereço é o mesmo e já é provado por `fila-da-coordenacao.test.ts`), e o `encodeURIComponent` do id, que num UUID não muda nada.

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | `nome-do-turno.ts` repete a tabela de `NOME_DO_TURNO` de `Estrutura.tsx:59`: "Sugestão: a 5.0, que mexe na `Estrutura.tsx`, passa a importar de `nome-do-turno.ts`." | Tarefa 5.0 (`tasks/prd-telas-da-coordenacao/5_task.md`), que altera `Estrutura.tsx`. A 9.0 não toca esse arquivo |
| frontend-reviewer (1ª) | "Texto em inglês no seletor de arquivo": "Choose File / No file chosen" nas fotos. Duas saídas: fixar `locale: 'pt-BR'` no contexto da vitrine, ou trocar o campo por um botão em português | O campo é o nativo do navegador e sai em português num navegador pt-BR; a 9.0 não o mexeu. Trocar por botão com `input` escondido muda a a11y e os e2e de upload, fora do que a tarefa pede. A saída da vitrine (`tools/vitrine/`) foi para `TODO.md` |
| frontend-reviewer (1ª) | "Foto do 1366 px": a tabela só se vê no celular; a vitrine poderia rolar o miolo ou fotografar a região | `TODO.md` (a vitrine é `tools/vitrine/`, fora desta tarefa). O desenho a 1366 px é provado pelo e2e `a 1366 × 768 há duas colunas` |
| frontend-reviewer (1ª) | "Nome do professor truncado": na coluna de 19 rem o nome fica com reticências, e `title` não aparece no toque | A `Linha` é peça da X1 e não muda nesta tarefa. Conferir com nomes reais longos na validação da spec (Validador) |
| frontend-reviewer (1ª) | "Texto do vazio": "no campo acima" está correto a 1024 px e no celular, "sem ajuste necessário" | Recusada: o próprio revisor diz que não há o que ajustar |
| test-engineer (1ª) | "Busca por palavra fraca" (`ListaDaTurma.test.tsx:348`): a busca por `/uso\|entrega\|atividade\|acesso/i` é guarda e não prova a D64 | Recusada: o revisor diz que "pode ficar como guarda" e que o componente não tem de onde tirar dado de uso; a prova da D64 é a do caso "Sem rastro" |
| privacy-guardian (1ª) | "o complemento do título mostra só '2º ano do Ensino Médio', sem o turno": conferir se é só o dado da vitrine | Não é defeito: `turno` é `nullable` (`packages/shared/src/estrutura/turma.ts:42`) e a turma da vitrine não tem turno. O caso "sem o turno" já existe, e o caso da turma na lista com `turno: null` foi acrescentado |
| revisor-geral (2ª) | `Alocacao.tsx:103` ainda mostra "Professor" quando o nome não carrega, e a lista da turma agora mostra "Nome não carregado": "Vale alinhar os dois textos na tarefa que mexer na Alocação." | Tarefa 7.0 (`7_task.md`, subtarefa 7.5), que altera `Alocacao.tsx` |
| frontend-reviewer (2ª) | "Nome não carregado" é honesto, mas não diz o que fazer; sugere "Nome indisponível. Atualizar a página" | Junto com o alinhamento acima, na 7.0: o texto das duas telas se decide uma vez. A 9.0 não tem o que acrescentar |
| frontend-reviewer (2ª) | Nome do professor cortado com reticências na coluna de 19 rem; deixar quebrar em duas linhas | O mesmo item da rodada 1: a `Linha` é peça da X1; conferir na validação da spec com nomes longos |
| frontend-reviewer (2ª) | Seletor de arquivo em inglês na vitrine | O mesmo item da rodada 1: `TODO.md`, linha da vitrine (já acrescentada) |
| frontend-reviewer (2ª) | A barra de baixo do celular no meio da foto de página inteira | Recusada: o próprio revisor diz que é efeito da captura em pedaços e não defeito da tela |
| privacy-guardian (2ª) | A foto de 1366 px não mostra a tabela de nomes; corrigir antes da próxima tela com tabela de aluno | `TODO.md`, linha da vitrine já acrescentada nesta tarefa |
| test-engineer (2ª) | Os casos `turno: null` e "sem o turno" passam pelo mesmo ramo (`?? null`); "pode ficar como está" | Recusada: o revisor diz que vale como guarda do dado opcional e que não há o que mudar |
| test-engineer (2ª) | O e2e não foi rodado por ele (precisa do ambiente) | Não é pendência: a prova de que fica verde é o portão da tarefa, já carimbado |

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
| 2026-10-16 23:02:01 | 2026-10-16 23:02:52 | `privacy-guardian` | 1 | APROVADO | aa059b4045801e978 |
| 2026-10-16 23:01:54 | 2026-10-16 23:02:57 | `frontend-reviewer` | 1 | APROVADO | a596ae3334e27adf1 |
| 2026-10-16 23:02:07 | 2026-10-16 23:04:01 | `test-engineer` | 1 | APROVADO | a2b19d2f85f74320d |
| 2026-10-16 23:02:13 | 2026-10-16 23:04:20 | `revisor-geral` | 1 | APROVADO | a18269dc1903b29ed |
| 2026-10-16 23:19:02 | 2026-10-16 23:19:29 | `frontend-reviewer` | 2 | APROVADO | a31737b2f3f26abe7 |
| 2026-10-16 23:19:13 | 2026-10-16 23:19:38 | `privacy-guardian` | 2 | APROVADO | a3e4113a577a0321e |
| 2026-10-16 23:19:33 | 2026-10-16 23:20:11 | `revisor-geral` | 2 | APROVADO | a3d5b2cd1439ea474 |
| 2026-10-16 23:19:23 | 2026-10-16 23:20:18 | `test-engineer` | 2 | APROVADO | a8cef803095d24414 |
