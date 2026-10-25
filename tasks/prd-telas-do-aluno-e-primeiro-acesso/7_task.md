# Tarefa 7.0 — Eu: a turma, como estou indo, Privacidade e Sair

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Eu mostra a turma, "Como estou indo" com as tarefas de correção aprovada e as linhas "Privacidade" e "Sair", sem dado de colega.

## Contexto necessário

- `techspec.md` seções 7b e 9 ("Eu"); `prd.md` RF3, RF9, RF10 e RF20, e o caso do aluno transferido (seção 7); `mockup.md` seção 2.5
- Regras 20 (item 14), 50 (itens 5 e 9) e 70 (itens 3 e 4d); D66
- Código: `areas/aluno/Eu.tsx` (da 2.0: cartão da turma e as linhas); `api/minha-turma.ts`;
  `esquemaRespostaMemoriaDoTutor` em `packages/shared/src/tutor/tutor.ts`
- A 3.0 corre junto: esta tarefa **não edita** `api/tutor.ts` nem `e2e/__fixtures__/aluno.ts`

## Subtarefas

- [x] 7.1 — `consultaMemoriaDoTutor`, em `api/memoria-do-tutor.ts`: `GET /v1/tutor/memoria`, com a `queryFn` (não o `select`) devolvendo só
  os `trabalhos` com `resultado` não nulo e **descartando os `sinais`**, para não irem ao cache. Chave própria; esvaziada com a sessão,
  nunca em armazenamento do navegador. Mostra os 50 mais recentes (o teto da API). Aluno sem turma (`NAO_ENCONTRADO`) é "sem resultado"
- [x] 7.2 — "Como estou indo" em `ComoEstouIndo.tsx`: uma linha por tarefa corrigida, com o título, "N de M certas" (texto e
  `BarraRotulada` neutra) e as habilidades a rever **como a API mandou** (`aReforcar`, código e descrição), na ordem dela. Sem
  limiar, sem "Vale revisar", sem matéria, sem professor. O vazio: "Nada corrigido ainda" e "Depois que quem dá a aula aprovar a
  primeira correção, ela aparece aqui." Uma linha "Achou algo errado? Fale com quem dá a aula." (contestação até o F9, regra 70, item 4d). Eu fica na ordem: cartão da turma,
  "Como estou indo", linhas
- [x] 7.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/api/memoria-do-tutor.ts`, `apps/web/src/areas/aluno/como-estou-indo.ts`, `apps/web/src/areas/aluno/como-estou-indo.test.ts` | novo |
| `apps/web/src/areas/aluno/ComoEstouIndo.tsx`, `apps/web/src/areas/aluno/Eu.test.tsx`, `e2e/aluno-eu.spec.ts`, `e2e/__fixtures__/memoria-do-aluno.ts` | novo |
| `apps/web/src/areas/aluno/Eu.tsx`, `e2e/minha-turma.spec.ts` | alterado |

`memoria-do-aluno.ts`, que já existe, é o ciclo do Tutor e não muda.

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| só correção aprovada | componente | o trabalho com `resultado: null` não aparece, nem a contagem dele; só o de resultado |
| sinais fora | componente | a memória chega com `sinais`, e nada deles vai à tela nem ao cache |
| nada de colega (RF10) | componente | a varredura de texto não acha média, posição, ranking, pontos nem sequência; a rede vê só turma e memória |
| quatro estados | componente | carregando; vazio ("Nada corrigido ainda"); erro com "Tentar de novo" sem derrubar o cartão da turma; com dado |
| borda: sem turma no ano | componente | o texto de hoje no cartão, e "Como estou indo" segue |
| borda: aluno transferido | integração (nova), `apps/api/src/tutor/tutor.int.test.ts`, bloco "isolamento" | corrigir e aprovar a tarefa, `transferir(a, aluno)`, e `/v1/tutor/memoria` ainda traz o trabalho da turma antiga, com o resultado; a API não muda |
| armazenamento vazio | e2e | depois de abrir Eu, `localStorage`, `sessionStorage` e IndexedDB seguem vazios |
| recomeço da tela | e2e | o aluno seguinte no mesmo computador vê o Eu dele; a resposta atrasada do anterior não aparece |
| 360 px | e2e | sem rolagem lateral; "Sair" e "Privacidade" com 44 px |

Concorrência não se aplica (só leitura). Log: nenhuma linha nova.

## Como testar

- Copie `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx`; os dados vêm de `e2e/__fixtures__/memoria-do-aluno.ts`
  (`trabalhoNaMemoria({ resultado })`)
- Os quatro casos de `e2e/minha-turma.spec.ts` (já em `/aluno/eu`, pela 2.0) seguem verdes; muda só o que o cartão ganha em volta
- Rodar: `npx vitest run --project unidade apps/web/src/areas/aluno/Eu.test.tsx` e
  `node tools/ci/e2e.ts --manter-ambiente e2e/aluno-eu.spec.ts`
- Telas: `aluno`, `/aluno/eu` (pelo item "Eu"; com e sem tarefa corrigida; sem turma); mockup `/aluno/eu`

## Fora do escopo desta tarefa

Desempenho por assunto, "Vale revisar" com limiar e "A prof. pediu" (D66 e F9); contestar a memória, pedir dados e "O que o Tutor
lembra" com sessões (F9); o diálogo "Ajustes" (8.0) e "Rever a introdução" (9.0); onça no vazio; trocar a senha (F2).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O teste de componente de Eu monta os trabalhos da memória num ajudante dentro de `Eu.test.tsx`, em vez de importar `trabalhoNaMemoria` de `e2e/__fixtures__/memoria-do-aluno.ts`, como "Como testar" sugere | o `tsc` da web (`include: ["src"]`, sem `allowImportingTsExtensions`) não compila o import da fixture do e2e, que usa `.ts` explícito e `node:crypto`; o ajudante monta o mesmo contrato (`RespostaMemoriaDoTutor`), e a fixture do e2e segue sendo a do `aluno-eu.spec.ts` | só nesta tarefa ("Como testar"): a Tech Spec (seções 7b e 9) e o `cenarios.md` não dizem onde mora a fixture do teste de componente, e nenhum documento da seção 11 muda |
| A borda "aluno transferido" é um caso de integração novo, e não a conferência de um existente | decisão do Joaquim (resposta A à divergência desta tarefa, 25/10/2026): o aluno transferido de turma no mesmo ano continua vendo em Eu a própria tarefa corrigida da turma antiga, com o resultado (D66); a virada do ano continua cortando pelo `anoLetivoId`; a API não muda | `prd.md` §7 (corrigido pelo Arquiteto em `9e44543f`, na `spec/telas-do-aluno-e-primeiro-acesso`); `.processo/ordens/triagem-divergencia-7_task.md` |
| No caso "recomeço" de `e2e/minha-turma.spec.ts`, o primeiro aluno entra pela API (`page.context().request.post('/v1/sessao/matricula', …)` e `page.goto('/aluno/eu')`), e não mais pela tela de entrada | o caso, com a leitura nova de Eu, chegava a 13,8–14,5 s, perto do teto de 15 s do portão (metade do prazo de 30 s); a entrada do primeiro aluno não é o que o caso prova, que é o segundo aluno não ver a turma do anterior, e isso segue conferido pela tela | só nesta tarefa: a Tech Spec (seção 9, "Eu") e o `cenarios.md` não dizem como o primeiro aluno entra no caso; o que ele prova não muda |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/api/memoria-do-tutor.ts
teste: apps/web/src/areas/aluno/Eu.test.tsx › só a correção aprovada
  const corrigidos: TrabalhoCorrigido[] = []
-  for (const trabalho of memoria.trabalhos) if (trabalho.resultado !== null) corrigidos.push({ ...trabalho, resultado: trabalho.resultado })
+  for (const trabalho of memoria.trabalhos) if (trabalho.resultado !== undefined) corrigidos.push({ ...trabalho, resultado: trabalho.resultado as never })
```

```mutacao
arquivo: apps/web/src/api/memoria-do-tutor.ts
teste: apps/web/src/areas/aluno/Eu.test.tsx › erro: "Tentar de novo" na seção
  } catch (erro) {
-      if (erro instanceof ErroDaApi && erro.codigo === CodigoDeErro.NAO_ENCONTRADO) return []
+      if (erro instanceof ErroDaApi) return []
```

```mutacao
arquivo: apps/web/src/api/memoria-do-tutor.ts
teste: apps/web/src/areas/aluno/Eu.test.tsx › o aluno sem turma no ano
  } catch (erro) {
-      if (erro instanceof ErroDaApi && erro.codigo === CodigoDeErro.NAO_ENCONTRADO) return []
+      if (erro instanceof ErroDaApi && erro.codigo === CodigoDeErro.ERRO_INTERNO) return []
```

```mutacao
arquivo: apps/web/src/api/memoria-do-tutor.ts
teste: apps/web/src/areas/aluno/Eu.test.tsx › a leitura dura 5 minutos
  },
-  staleTime: 5 * 60_000,
+  staleTime: 0,
  refetchOnWindowFocus: false,
```

```mutacao
arquivo: apps/web/src/api/memoria-do-tutor.ts
teste: apps/web/src/areas/aluno/Eu.test.tsx › a leitura dura 5 minutos
  staleTime: 5 * 60_000,
-  refetchOnWindowFocus: false,
+  refetchOnWindowFocus: true,
```

```mutacao
arquivo: apps/web/src/areas/aluno/ComoEstouIndo.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › carregando: o rótulo dele
  function conteudo() {
-    if (memoria.isPending) return <EstadoCarregando rotulo={ROTULO_DO_CARREGANDO} />
```

```mutacao
arquivo: apps/web/src/areas/aluno/ComoEstouIndo.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › erro: "Tentar de novo" na seção
  if (memoria.isPending) return <EstadoCarregando rotulo={ROTULO_DO_CARREGANDO} />
-    if (memoria.isError) return <EstadoErro erro={memoria.error} tentando={memoria.isFetching} aoTentarDeNovo={() => void memoria.refetch({ cancelRefetch: false })} />
```

```mutacao
arquivo: apps/web/src/areas/aluno/ComoEstouIndo.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › só trabalho sem aprovação
  if (memoria.isError) return <EstadoErro erro={memoria.error} tentando={memoria.isFetching} aoTentarDeNovo={() => void memoria.refetch({ cancelRefetch: false })} />
-    if (memoria.data.length === 0) return <EstadoVazio titulo={TITULO_DO_VAZIO} descricao={DESCRICAO_DO_VAZIO} />
```

```mutacao
arquivo: apps/web/src/areas/aluno/ComoEstouIndo.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › só a correção aprovada
  <BarraRotulada rotulo={titulo} valor={resultado.acertos} maximo={resultado.total} texto={textoDasCertas(resultado.acertos, resultado.total)} />
-              {resultado.aReforcar.length > 0 && (
+              {true && (
```

```mutacao
arquivo: apps/web/src/areas/aluno/Eu.tsx
teste: apps/web/src/areas/aluno/Eu.test.tsx › com dado: a turma
  </section>
-      <ComoEstouIndo />
```

```mutacao
arquivo: apps/api/src/tutor/tutor.repository.ts
teste: apps/api/src/tutor/tutor.int.test.ts › o aluno transferido no mesmo ano
-      .where(and(eq(tentativaAtividade.escolaId, escolaId), eq(tentativaAtividade.anoLetivoId, anoLetivoId), eq(tentativaAtividade.alunoId, alunoId)))
+      .where(and(eq(tentativaAtividade.escolaId, escolaId), eq(tentativaAtividade.anoLetivoId, anoLetivoId), eq(tentativaAtividade.alunoId, alunoId), sql`exists (select 1 from vinculo v where v.escola_id = ${escolaId} and v.ano_letivo_id = ${anoLetivoId} and v.usuario_id = ${alunoId} and v.turma_id = ${atividadeAplicada.turmaId} and v.estado = 'confirmado')`))
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | Caso de recomeço com a memória do primeiro aluno já entregue ao cache antes do "Sair" (`e2e/aluno-eu.spec.ts`, "o aluno seguinte no mesmo computador") | `TODO.md`: caso novo de e2e, com a segurança de leitura e o prazo de 15 s a redesenhar; não cabe em poucas linhas |
| test-engineer (1ª) | A mutação do filtro de `resultado` fica vermelha por quebra do componente, e não por a pendente aparecer | A retro desta funcionalidade (o Arquiteto lê `achados/`); não pede código |
| test-engineer (1ª), revisor-geral (1ª) | `sairPelaCasca` e a entrada por matrícula pela API repetidas em `e2e/aluno-eu.spec.ts` e `e2e/minha-turma.spec.ts`; levar para `e2e/__fixtures__/casca.ts` | `TODO.md`, para depois do encontro das linhas: `casca.ts` é compartilhada com a 3.0, que corre junto, e a tarefa não a edita |
| tenancy-guardian (1ª) | Conferir que o e2e do recomeço cobre também o conteúdo de "Como estou indo" do primeiro aluno | Recusada: já está coberto. `e2e/aluno-eu.spec.ts` confere `not.toContainText('Lista só do primeiro aluno')` no `body`, antes e depois de a resposta atrasada chegar, além do nome |
| tenancy-guardian (1ª) | Sem a cláusula de escola em `trabalhos`, nenhum caso quebra (o `alunoId` é UUID único) | A retro desta funcionalidade; o próprio revisor diz que não vem desta tarefa e que não há caso possível |
| conformidade-reviewer (1ª) | Reescrever o item de `TODO.md` "O aluno não vê nem contesta o que o Tutor sabe" (Eu mostra o resultado aprovado e a linha de contestação; falta "O que o Tutor lembra" com `sinais`, sessões e contestação de verdade) | O próprio item de `TODO.md`, reescrito quando a funcionalidade fechar: a tarefa não edita `TODO.md` |
| conformidade-reviewer (1ª), revisor-geral (1ª), frontend-reviewer (1ª) | A barra de baixo cobre a linha "Achou algo errado?" em `aluno--aluno-eu--celular.png` | Recusada: o `frontend-reviewer` conferiu que é efeito da captura de página inteira com a barra fixa (o `main` tem `pb-[calc(var(--barra-baixo)+2rem)]`, `CascaDaEscola.tsx:260`) |
| conformidade-reviewer (1ª) | A fixture da vitrine cheia junta "Cinemática: lista sintética" com habilidades de Química | `TODO.md`: é `tools/vitrine/`, que a tarefa não toca |
| frontend-reviewer (1ª) | `border border-linha` (1 px) em `ComoEstouIndo.tsx` e `Eu.tsx` contra `border-2 border-borda` nas linhas e em `Atividades.tsx` | `TODO.md`, tarefa de acabamento da pele (D80): o 1 px do cartão da turma já vinha da 2.0 |
| frontend-reviewer (1ª) | Tela cheia passa de 768 px a 1366 × 768 (822 px) | Recusada: o PRD não pede que Eu caiba na janela, e a lista pode chegar a 50 itens; o miolo é que rola |
| frontend-reviewer (1ª) | O vazio não tem a onça `apontando` do mockup §2.5 | Recusada: "onça no vazio" está em "Fora do escopo desta tarefa"; fica para a validação |
| privacy-guardian (1ª), infra-guardian (1ª) | A API manda os `sinais` até o navegador e a web só os descarta; uma variante da rota só com `trabalhos` | A spec do F9, junto de "O que o Tutor lembra" (nenhum dos dois pede mudança agora: o dado é do próprio aluno, D66) |
| privacy-guardian (1ª) | `Eu.test.tsx` repete o ajudante da fixture do e2e | Recusada: é a primeira divergência registrada, justificada pelo `tsc` da web |
| infra-guardian (1ª) | Incluir `/aluno/eu` no cenário de rajada do teste de carga | `TODO.md`, para quando o teste de carga for revisto; o revisor diz que não é exigência desta tarefa |
| revisor-geral (1ª) | O teto de 50 da API conta também os trabalhos ainda sem correção aprovada; quem tem muitos envios pendentes vê menos de 50 tarefas corrigidas | A spec do F9; é da Tech Spec e não da tarefa |

<!-- A seção "Revisões" é criada pelo hook tools/processo/revisoes.ts: não a escreva à mão nem acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 13:51:43 | 2026-10-25 13:52:24 | `frontend-reviewer` | 1 | APROVADO | ad3245f13566f4b5c |
| 2026-10-25 13:51:52 | 2026-10-25 13:52:49 | `privacy-guardian` | 1 | APROVADO | a2af170a369ad0c62 |
| 2026-10-25 13:52:07 | 2026-10-25 13:52:52 | `tenancy-guardian` | 1 | APROVADO | aa033be5e432e792d |
| 2026-10-25 13:52:11 | 2026-10-25 13:52:58 | `infra-guardian` | 1 | APROVADO | a2f2ab3f85657106e |
| 2026-10-25 13:51:48 | 2026-10-25 13:53:42 | `conformidade-reviewer` | 1 | APROVADO | acee6807bbf73aaa9 |
| 2026-10-25 13:51:57 | 2026-10-25 13:53:44 | `test-engineer` | 1 | APROVADO | a882231c88adab49e |
| 2026-10-25 13:52:02 | 2026-10-25 13:53:46 | `revisor-geral` | 1 | APROVADO | a9a2397a7bc0ec91a |
| 2026-10-25 14:01:28 | 2026-10-25 14:01:53 | `revisor-geral` | 2 | APROVADO | aa842d9ccd2e55eb9 |
| 2026-10-25 14:01:22 | 2026-10-25 14:02:03 | `test-engineer` | 2 | APROVADO | a73ca14894c817ce4 |
