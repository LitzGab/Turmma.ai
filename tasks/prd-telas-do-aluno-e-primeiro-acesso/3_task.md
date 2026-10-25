# Tarefa 3.0 — O Início mostra o Tutor, a faixa de supervisão e as próximas tarefas

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`, `infra-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O Início do aluno passa a ter saudação, faixa de supervisão presa e até três tarefas "Para fazer", com o aviso da avaliação aberta,
sem tirar o caminho até o Tutor. **Não lê `tutor/conversa` nem mostra o uso do dia** (techspec 7c).

## Contexto necessário

- `techspec.md` seções 7b, 7c e 9 ("Início", com as leituras); `prd.md` RF3 a RF5, RF10 e RF20; `mockup.md` seção 2.1 (Início vazio, estados, "Formato
  do descansando") e fecho (d), pontos 1, 2 e 5
- Regras 50 (itens 5 e 9), 70 (itens 4, 4a e 4b) e 80 (item 10); D36, D38, D58 e D59
- Código: `areas/aluno/Tutor.tsx` (`FaixaDeSupervisao`, `EscolhaDaAtividade`); `areas/aluno/tutor.ts` (`TEXTO_DA_SUPERVISAO`);
  `areas/aluno/atividades.ts` (`AVISO_DA_AVALIACAO`); `infra/k6/login-7h30.js`
- Esta tarefa corre junto da 4.0 e da 5.0: **não importa** `separarAtividades` (use `estaParaResponder`, que a 4.0 mantém) nem as
  poses da onça (a saudação usa `AssinaturaIA agente="tutor"`, de `componentes/ui/ia/AssinaturaIA.tsx`)

## Subtarefas

- [x] 3.1 — Carga. `infra/scripts/carga-login.ts` (`semearContas`, `criarEscola`): ano em curso nas três escolas, turmas de 35,
  vínculo `confirmado` para as contas de aluno da rajada (com a introdução já vista) e atividades aplicadas que encham a
  primeira página, algumas com tentativa e resposta. `infra/k6/login-7h30.js`: o aluno, depois do login, faz `GET /v1/eu` e a
  primeira página de `GET /v1/minhas-atividades`; exige 200, página não vazia, contados em `respostas_inesperadas`; as duas
  entram em `autenticada_duracao`, com a tag `name` da rota, e a fase `rajada` ganha
  `autenticada_duracao{grupo:rajada}: p(95) < P95_MAXIMO_DO_LOGIN_MS`, e o mesmo limite só para a rota
  `GET /v1/minhas-atividades` (techspec 7c)
- [x] 3.2 — `Inicio.tsx`: "Oi, <primeiro nome>." fixa, sem "de volta" nem "faz tempo", com `AssinaturaIA`; a faixa presa
  (`TEXTO_DA_SUPERVISAO`, sem fechar); "Para fazer" (até três da primeira página, cada uma com "Pedir ajuda ao Tutor" até
  `caminhoDoTutorNaAtividade`, `href` afirmado) e "Ver todas as tarefas"; o vazio diz que o Tutor ajuda quando houver tarefa; "Sair" do tamanho dos vizinhos. A tarefa avaliativa leva o
  `AVISO_DA_AVALIACAO` e o caminho continua. Leituras com o `staleTime` e o `refetchOnWindowFocus` da seção 9. Sem uso do dia
- [x] 3.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/aluno/Inicio.test.tsx`, `e2e/aluno-inicio.spec.ts` | novo |
| `apps/web/src/areas/aluno/Inicio.tsx`, `infra/k6/login-7h30.js`, `infra/scripts/carga-login.ts` | alterado |

Não edita `Tutor.tsx`, `api/tutor.ts`, `e2e/__fixtures__/aluno.ts` nem `atividades.ts`.

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| quatro estados | componente | carregando; vazio só com a leitura terminada ("Nenhuma tarefa por agora"); erro das tarefas com "Tentar de novo", a saudação e a faixa de pé; com dado |
| sem `tutor/conversa` | componente | a rede vê `minhas-atividades` (e o `/v1/eu` do desvio), e **nunca** `tutor/conversa` (7c) |
| saudação fixa (D58, D59) | unidade | o texto é o mesmo com qualquer nome, sem "de volta", "faz tempo" nem número de uso |
| carga do login (k6) | carga | o cenário `login-7h30` exercita `/v1/eu` e `minhas-atividades` do aluno com seed de turma e atividades: 200 e página não vazia; as duas entram em `autenticada_duracao`, com a tag `name` da rota, e a fase `rajada` tem o limite `autenticada_duracao{grupo:rajada}: p(95) < P95_MAXIMO_DO_LOGIN_MS` (1.000 ms): `minhas-atividades` lenta reprova o cenário |
| faixa presa | componente + e2e | sem botão de fechar; à vista depois de rolar, a 360 px |
| avaliativa aberta | componente | a linha traz o `AVISO_DA_AVALIACAO` e o link "Pedir ajuda ao Tutor" continua, com o `href` do Tutor (D36) |
| borda: aluno sem turma no ano | componente | "Nenhuma tarefa por agora", sem erro de rede |
| nada promete o Tutor | unidade | o vazio diz que o Tutor ajuda quando houver tarefa; nenhum texto do Início promete que ele está disponível |
| varredura de texto (RF10) | componente | nenhum "sequência", "pontos", "ranking", "meta", "colega", "média" nem "posição" |
| recomeço da tela | e2e | o aluno seguinte no mesmo computador vê o Início dele; a resposta atrasada do anterior não aparece |

Limite do dia e função suspensa seguem testados na tela do Tutor (`e2e/aluno-tutor.spec.ts`), que esta tarefa não altera.
Concorrência e log não se aplicam: só leitura, sem texto de aluno em log.

## Como testar

- Copie `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa().segurar()` para o carregando)
- E2e: `e2e/aluno-tutor.spec.ts › em avaliação…` e `› no limite do dia…` continuam verdes sem mudar
- Rodar: `npx vitest run --project unidade apps/web/src/areas/aluno/Inicio.test.tsx` e
  `node tools/ci/e2e.ts --manter-ambiente e2e/aluno-inicio.spec.ts`
- Telas: `aluno`, `/aluno/inicio` (entrar pela matrícula; com avaliação aberta, o aviso); mockup `/aluno` e `/aluno?estado=prova`

## Fora do escopo desta tarefa

Caixa de pergunta no Início, sugestões de pergunta, conversa livre com histórico, foto, voto, Refazer e Editar (F9); onça de corpo
inteiro; "Avisar um adulto"; a caixa que some na pausa (D36); o "Hoje: N de 60" no Início (fica no Tutor).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O Início não desenha um "Sair" próprio: usa o da casca (a um clique em toda tela do aluno, 2.0), e o e2e confere o tamanho dele. O título de cada tarefa de "Para fazer" abre a tarefa; "Pedir ajuda ao Tutor" é o segundo link da linha | A casca já oferece o "Sair" em cada lugar do aluno (barra de topo no celular, lateral no computador); um segundo na tela repetiria a armadilha de Eu, que tem dois. A subtarefa 3.2 diz só "Sair do tamanho dos vizinhos". O título que abre a tarefa é o que o aluno espera de uma linha de tarefa, e os dois links não se aninham | `techspec.md` §9, parágrafo "**Início**" (frase sobre o "Sair" da casca e o título da tarefa); `prd.md` RF3 ("a um clique em toda tela do aluno") |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › reaberto antes de 60 s
-  const atividades = useInfiniteQuery({ ...consultaMinhasAtividades, ...LEITURA_DO_INICIO })
+  const atividades = useInfiniteQuery({ ...consultaMinhasAtividades })
```

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › reaberto antes de 60 s
-  const eu = useQuery({ ...consultaEu, ...LEITURA_DO_INICIO })
+  const eu = useQuery({ ...consultaEu })
```

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › reaberto antes de 60 s
-const LEITURA_DO_INICIO = { staleTime: 60_000, refetchOnWindowFocus: false } as const
+const LEITURA_DO_INICIO = { refetchOnWindowFocus: false } as const
```

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › ao voltar para a aba com a leitura velha
-const LEITURA_DO_INICIO = { staleTime: 60_000, refetchOnWindowFocus: false } as const
+const LEITURA_DO_INICIO = { staleTime: 60_000 } as const
```

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › com as duas páginas já no cache
-  const paraFazer = tarefasParaFazer(atividades.data?.pages[0]?.itens ?? [])
+  const paraFazer = tarefasParaFazer(atividades.data?.pages.flatMap((pagina) => pagina.itens) ?? [])
```

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › uma releitura que falha não tira as tarefas da tela
-      {atividades.isError && !lida && (
+      {atividades.isError && (
```

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › lê as tarefas outra vez
-          <EstadoErro erro={atividades.error} tentando={atividades.isFetching} aoTentarDeNovo={() => void atividades.refetch({ cancelRefetch: false })} />
+          <EstadoErro erro={atividades.error} tentando={atividades.isFetching} aoTentarDeNovo={() => undefined} />
```

**Sem bloco para o `cancelRefetch: false` do `aoTentarDeNovo`.** É mutação equivalente: o botão "Tentar de novo" só aparece
com a guarda `atividades.isError && !lida`, ou seja, com a consulta **sem dado**, e nesse estado o `query-core` não cancela a
leitura em andamento mesmo com `cancelRefetch` ligado (`node_modules/@tanstack/query-core/src/query.ts:408`: só cancela quando
`this.state.data !== undefined`). Tirar a opção não deixa teste nenhum vermelho; o que a tela garante é o resultado (um clique
duplo faz uma leitura só), e esse o caso `dois cliques seguidos em "Tentar de novo"` de `Inicio.test.tsx` prova. A opção é o
idioma da casa (`rotas.tsx`, `Eu.tsx`, `Atividades.tsx`, `Tutor.tsx`…), mantida por consistência: não é cláusula esquecida.

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › carregando: a faixa já está na tela
-      {lida && paraFazer.length === 0 && <EstadoVazio titulo={TITULO_DO_VAZIO} descricao={TEXTO_DO_VAZIO} />}
+      {paraFazer.length === 0 && <EstadoVazio titulo={TITULO_DO_VAZIO} descricao={TEXTO_DO_VAZIO} />}
```

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › carregando: a faixa já está na tela
-      {lida && (
+      {true && (
          <Link to={ROTAS_DO_ALUNO.atividades} className={`${CLASSES_DO_LINK_SECUNDARIO} self-start`}>
```

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › carregando: a faixa já está na tela
-      {atividades.isPending && <EstadoCarregando rotulo="Carregando as suas tarefas…" />}
+      {false && <EstadoCarregando rotulo="Carregando as suas tarefas…" />}
```

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › o título de cada tarefa tem altura de toque de 44 px
-        <Link to={caminhoDaAtividadeDoAluno(atividade.id)} className="flex min-h-11 min-w-0 items-center text-base font-semibold text-tinta hover:underline">
+        <Link to={caminhoDaAtividadeDoAluno(atividade.id)} className="flex min-w-0 items-center text-base font-semibold text-tinta hover:underline">
```

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › o título de cada tarefa tem altura de toque de 44 px
-          <span className="min-w-0 break-words">{atividade.titulo}</span>
+          {atividade.titulo}
```

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: e2e/aluno-inicio.spec.ts › a faixa de supervisão fica presa
-          <span className="min-w-0 break-words">{atividade.titulo}</span>
+          <span className="break-words">{atividade.titulo}</span>
```

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › carregando: a faixa já está na tela
-      <FaixaDeSupervisao />
```

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › vazio, com a leitura terminada
-      {tarefas.length > 0 && (
+      {true && (
```

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › vazio, com a leitura terminada
-          <Link to={ROTAS_DO_ALUNO.atividades} className={`${CLASSES_DO_LINK_SECUNDARIO} self-start`}>
+          <Link to={ROTAS_DO_ALUNO.tutor} className={`${CLASSES_DO_LINK_SECUNDARIO} self-start`}>
```

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › avaliativa aberta: a linha traz o aviso de hoje
-        {atividade.avaliativa && <p className="min-w-0 text-sm break-words text-apoio">{AVISO_DA_AVALIACAO}</p>}
+        <p className="min-w-0 text-sm break-words text-apoio">{AVISO_DA_AVALIACAO}</p>
```

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › com dado: até três tarefas na ordem da API
-      <Link to={caminhoDoTutorNaAtividade(atividade.id)} className={`${CLASSES_DO_LINK_SECUNDARIO} self-start`}>
+      <Link to={caminhoDaAtividadeDoAluno(atividade.id)} className={`${CLASSES_DO_LINK_SECUNDARIO} self-start`}>
```

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › com dado: até três tarefas na ordem da API
-        <Link to={caminhoDaAtividadeDoAluno(atividade.id)} className="flex min-h-11 min-w-0 items-center text-base font-semibold text-tinta hover:underline">
+        <Link to={caminhoDoTutorNaAtividade(atividade.id)} className="flex min-h-11 min-w-0 items-center text-base font-semibold text-tinta hover:underline">
```

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › assinada pelo Tutor com o nome da função e o selo IA
-        <AssinaturaIA agente="tutor" tamanho={40} />
```

```mutacao
arquivo: apps/web/src/areas/aluno/Inicio.tsx
teste: apps/web/src/areas/aluno/Inicio.test.tsx › com o primeiro nome
-        <p className="mt-3 text-3xl leading-tight font-bold break-words text-tinta">{saudacaoDoAluno(eu.data?.nome)}</p>
+        <p className="mt-3 text-3xl leading-tight font-bold break-words text-tinta">{saudacaoDoAluno(undefined)}</p>
```

```mutacao
arquivo: apps/web/src/areas/aluno/inicio.ts
teste: apps/web/src/areas/aluno/inicio.test.ts › são as que esperam resposta, na ordem da API, até três
-  return primeiraPagina.filter(estaParaResponder).slice(0, MAXIMO_DE_TAREFAS_NO_INICIO)
+  return primeiraPagina.filter(estaParaResponder)
```

```mutacao
arquivo: apps/web/src/areas/aluno/inicio.ts
teste: apps/web/src/areas/aluno/inicio.test.ts › a encerrada, a enviada e a com resultado nunca entram
-  return primeiraPagina.filter(estaParaResponder).slice(0, MAXIMO_DE_TAREFAS_NO_INICIO)
+  return primeiraPagina.slice(0, MAXIMO_DE_TAREFAS_NO_INICIO)
```

```mutacao
arquivo: apps/web/src/areas/aluno/inicio.ts
teste: apps/web/src/areas/aluno/inicio.test.ts › são as que esperam resposta, na ordem da API, até três
-export const MAXIMO_DE_TAREFAS_NO_INICIO = 3
+export const MAXIMO_DE_TAREFAS_NO_INICIO = 4
```

```mutacao
arquivo: apps/web/src/areas/aluno/inicio.ts
teste: apps/web/src/areas/aluno/inicio.test.ts › usa o primeiro nome e ignora o espaço antes do nome
-  const primeiro = nome?.trim().split(/\s+/)[0]
+  const primeiro = nome?.split(/\s+/)[0]
```

```mutacao
arquivo: apps/web/src/areas/aluno/inicio.ts
teste: apps/web/src/areas/aluno/inicio.test.ts › usa o primeiro nome e ignora o espaço antes do nome
-  const primeiro = nome?.trim().split(/\s+/)[0]
+  const primeiro = nome?.trim().split(/\s+/).at(-1)
```

```mutacao
arquivo: apps/web/src/areas/aluno/inicio.ts
teste: apps/web/src/areas/aluno/inicio.test.ts › sem nome ainda, ou com nome vazio
-  return primeiro === undefined ? 'Oi.' : `Oi, ${primeiro}.`
+  return `Oi, ${primeiro}.`
```

```mutacao
arquivo: apps/web/src/areas/aluno/inicio.ts
teste: apps/web/src/areas/aluno/inicio.test.ts › sem nome ainda, ou com nome vazio
-  return primeiro === undefined || primeiro === '' ? undefined : primeiro
+  return primeiro === undefined ? undefined : primeiro
```

```mutacao
arquivo: infra/k6/login-7h30.js
teste: infra/test/carga-login.test.ts › a rajada julga o p95 de todas as autenticadas
-          'autenticada_duracao{grupo:rajada}': [`p(95)<${P95_MAXIMO_DO_LOGIN_MS}`],
```

```mutacao
arquivo: infra/k6/login-7h30.js
teste: infra/test/carga-login.test.ts › a rajada julga o p95 de todas as autenticadas
-          [`autenticada_duracao{grupo:rajada,name:${ROTA_DAS_TAREFAS}}`]: [`p(95)<${P95_MAXIMO_DO_LOGIN_MS}`],
```

```mutacao
arquivo: infra/k6/login-7h30.js
teste: infra/test/carga-login.test.ts › as duas leituras entram em autenticada_duracao
-  if (conta.matricula !== undefined) leituraDoInicio(token, 'rajada')
```

```mutacao
arquivo: infra/k6/login-7h30.js
teste: infra/test/carga-login.test.ts › as duas leituras entram em autenticada_duracao
-  duracaoAutenticada.add(resposta.timings.duration, { grupo, name: nome })
+  duracaoAutenticada.add(resposta.timings.duration, { grupo })
```

```mutacao
arquivo: infra/k6/login-7h30.js
teste: infra/test/carga-login.test.ts › as duas leituras entram em autenticada_duracao
-  inesperadas.add(tarefas.status !== 200 || (Array.isArray(itens) && itens.length > 0) ? 0 : 1, { grupo, status: 'pagina_vazia' })
+  inesperadas.add(0, { grupo, status: 'pagina_vazia' })
```

```mutacao
arquivo: infra/scripts/carga-login.ts
teste: infra/test/carga-login.test.ts › o seed enche a primeira página
-  return Math.ceil(alunos / ALUNOS_POR_TURMA)
+  return Math.floor(alunos / ALUNOS_POR_TURMA)
```

```mutacao
arquivo: infra/scripts/carga-login.ts
teste: infra/test/carga-login.test.ts › o seed enche a primeira página
-export const ATIVIDADES_POR_TURMA = 60
+export const ATIVIDADES_POR_TURMA = 40
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | k6: o limite de `minhas-atividades` é provado só por texto (`toContain`) e passaria sem amostra; acrescentar `count>0` na submétrica | Validação (Validador): registrar uma rodada de `npm run carga:login` com a submétrica `name:GET /v1/minhas-atividades` no resumo. O `infra-guardian` já viu a submétrica com amostra e p95 de 22 ms em `.processo/carga-rajada.log`. Se a validação não a achar no resumo, o `count>0` vira correção |
| test-engineer (1ª) | O seed `semearTurmasEAtividades` não roda em teste automático | Validação (mesma rodada de carga): a página vazia vira `respostas_inesperadas` e reprova a rajada, então o cenário se confere sozinho quando roda |
| test-engineer (1ª) | A borda "aluno sem turma" é igual ao vazio; citar o teste da API que prova a lista vazia | Validação: o Validador cruza o RF com o teste da API; não cabe a esta tarefa afirmar um teste que ela não toca |
| test-engineer (1ª) | O recomeço está duplicado em `e2e/aluno-inicio.spec.ts` e `e2e/minha-turma.spec.ts` | `TODO.md`: apagar um dos dois mexe em `e2e/minha-turma.spec.ts`, que a tarefa só ajustou por consequência do novo Início; o corte fica para uma passada de e2e |
| revisor-geral (1ª) | `carga-login.ts`: ano letivo fixo em 2026, com datas fixas | `TODO.md`: só vale quando a carga rodar depois de 2026; `matriculaSintetica` (`carga-login.ts:48`) também fixa `2026` e entra na mesma passada |
| revisor-geral (1ª) | `semearTurmasEAtividades` recebe `pool`, e o resto usa `banco`: duas conexões no mesmo seed | `TODO.md`: é só clareza, sem efeito na tela nem na carga; entra junto com o item do ano fixo, na mesma passada pelo seed |
| revisor-geral (1ª), infra-guardian (1ª) | O Início relê todas as páginas da chave infinita quando o aluno passou por Tarefas e volta depois de 60 s | Tarefa 4.0 (Tarefas, que mantém `estaParaResponder` e usa a mesma chave): `maxPages` ou consulta própria de uma página muda comportamento e contrato da chave |
| infra-guardian (1ª) | k6: dar a `GET /v1/eu` limite próprio, simétrico ao de `minhas-atividades` | `TODO.md`: `/v1/eu` já entra no limite de todas as autenticadas, e o spec (7c) pede o limite próprio só para `minhas-atividades` |
| infra-guardian (1ª) | O seed da carga só tem atividade com `avaliativa=false` | `TODO.md`: sem custo para a rajada, mas não muda o que o cenário prova |
| tenancy-guardian (1ª) | k6: conferir que os itens da página são da escola de quem entrou (títulos com o nome da escola) | `TODO.md`: cobertura extra de isolamento sob concorrência; o spec (7c) não a pede e a tarefa não cria endpoint |
| frontend-reviewer (1ª), conformidade-reviewer (1ª), privacy-guardian (1ª) | Semear na vitrine cheia uma atividade aplicada, uma delas avaliativa, para a foto mostrar o estado com tarefas e o aviso da avaliação | `TODO.md`: `tools/vitrine/` não é da tarefa; o Validador fotografa cada requisito com tela e precisa disso, então o item entra antes da validação da spec |
| frontend-reviewer (1ª) | A saudação é `<p>`, e o `<h1>` é só para o leitor de tela | Recusada: o revisor a deu como coerente e documentada, e não pediu mudança |
| test-engineer (2ª) | Medir a altura real do link do título com `boundingBox()` no e2e, como se faz com o "Sair" | `TODO.md`: o teste de componente confere a classe `min-h-11`, e o caso novo do título longo já passa o título pelo e2e; a medida de 44 px entra junto com a foto da vitrine com atividade |
| test-engineer (2ª) | Comentário no teste do clique duplo dizendo que ele protege o resultado, não a opção | Recusada: a nota em "Mutações" deste documento já diz isso |
| revisor-geral (2ª) | O "Sair" da gaveta, a dois toques, fica sem medida de toque neste spec | Recusada: o revisor disse que não bloqueia e que `sairPelaCasca` ainda o aciona; o tamanho dele é da casca (2.0) |
| conformidade-reviewer (2ª) | O import de `abrirNavegacao` em `e2e/aluno-inicio.spec.ts` pode ter ficado sem uso | Recusada: `sairPelaCasca` ainda o chama |
| frontend-reviewer (2ª), conformidade-reviewer (2ª), privacy-guardian (2ª), revisor-geral (2ª) | Semear na vitrine cheia uma atividade aplicada, uma delas avaliativa | Já está na tabela acima (`TODO.md`) |
| frontend-reviewer (2ª) | Sufixo hexadecimal no nome sintético do aluno e da escola na foto, e as iniciais do avatar | Recusada: o próprio revisor diz que é dado da vitrine, não do produto |
| test-engineer (3ª) | Quarto bloco de mutação que tire só o `break-words` do `<span>`, contra o e2e da faixa | Recusada: o próprio revisor diz que não bloqueia, que os dois blocos existentes mais os dois testes já provam a linha, e que o e2e pegaria; um bloco a mais não muda o que a validação confere |
| revisor-geral (3ª) | O teste de componente do título confere nomes de classe, e quem prova a quebra é o e2e; ficar só com o `min-h-11` ou comentar que o e2e é a prova | Recusada: o teste de componente é o que deixa vermelhas as mutações do `<span>` (blocos 2 e 3 do título), e tirá-lo derrubaria a prova de duas cláusulas |
| test-engineer (3ª) | Quando a vitrine semear atividade, incluir um título sem espaço para a foto do celular mostrar a quebra | `TODO.md`: junto com o item já registrado de semear atividade aplicada na vitrine cheia |
| frontend-reviewer (3ª) | Teste com throttling de CPU e de rede no Início | Validação (Validador): é a medida de Chromebook fraco da funcionalidade inteira, e a tela faz uma leitura só |
| frontend-reviewer (3ª) | O nome da escola aparece truncado ("Colégio sintético…") na barra de topo a 360 px | Recusada: o revisor diz que é da casca (2.0) e que não perde ação |
| frontend-reviewer (3ª), conformidade-reviewer (3ª), privacy-guardian (3ª) | Semear na vitrine cheia uma atividade aplicada, uma delas avaliativa | Já está nesta tabela (`TODO.md`) |

<!-- A seção "Revisões" é criada pelo hook tools/processo/revisoes.ts: não a escreva à mão nem acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 05:42:47 | 2026-10-25 05:43:19 | `frontend-reviewer` | 1 | APROVADO | a6a097496443ceedd |
| 2026-10-25 05:42:51 | 2026-10-25 05:43:40 | `conformidade-reviewer` | 1 | APROVADO | a8374878c593e7ba4 |
| 2026-10-25 05:43:07 | 2026-10-25 05:43:45 | `tenancy-guardian` | 1 | APROVADO | a0e6324551cf5b558 |
| 2026-10-25 05:43:11 | 2026-10-25 05:44:10 | `privacy-guardian` | 1 | APROVADO | aea149cbe557cf3da |
| 2026-10-25 05:43:03 | 2026-10-25 05:44:59 | `revisor-geral` | 1 | APROVADO | a5efcc4eb029fa8b4 |
| 2026-10-25 05:42:55 | 2026-10-25 05:45:03 | `infra-guardian` | 1 | APROVADO | a796657889cdf1d7f |
| 2026-10-25 05:42:59 | 2026-10-25 05:46:26 | `test-engineer` | 1 | APROVADO | ac5e1d8b19c8b1890 |
| 2026-10-25 06:10:53 | 2026-10-25 06:11:13 | `frontend-reviewer` | 2 | APROVADO | a56771851c12ba0f3 |
| 2026-10-25 06:11:01 | 2026-10-25 06:11:28 | `conformidade-reviewer` | 2 | APROVADO | a3e91d1e77d124bf8 |
| 2026-10-25 06:11:08 | 2026-10-25 06:11:33 | `infra-guardian` | 2 | APROVADO | aaaa2b68a546808f3 |
| 2026-10-25 06:11:35 | 2026-10-25 06:11:52 | `tenancy-guardian` | 2 | APROVADO | a869eeff3d5050fbb |
| 2026-10-25 06:11:42 | 2026-10-25 06:12:13 | `privacy-guardian` | 2 | APROVADO | a18b3fcb106f40b6a |
| 2026-10-25 06:11:28 | 2026-10-25 06:12:49 | `revisor-geral` | 2 | REPROVADO | a918098b404e9e7f3 |
| 2026-10-25 06:11:20 | 2026-10-25 06:12:58 | `test-engineer` | 2 | APROVADO | a6d3dcf74c84ac2b4 |
| 2026-10-25 06:56:04 | 2026-10-25 06:56:36 | `revisor-geral` | 3 | APROVADO | aae5e6af11b67e4b2 |
| 2026-10-25 06:56:12 | 2026-10-25 06:56:37 | `frontend-reviewer` | 3 | APROVADO | a259a82d1d172c15e |
| 2026-10-25 06:56:28 | 2026-10-25 06:56:43 | `infra-guardian` | 3 | APROVADO | a04860376ab3ceab6 |
| 2026-10-25 06:56:21 | 2026-10-25 06:56:47 | `conformidade-reviewer` | 3 | APROVADO | adb14c06477a02ca9 |
| 2026-10-25 06:56:45 | 2026-10-25 06:57:00 | `tenancy-guardian` | 3 | APROVADO | abe43b15d08c54fc6 |
| 2026-10-25 06:56:51 | 2026-10-25 06:57:21 | `privacy-guardian` | 3 | APROVADO | abe2ad3a9346521ce |
| 2026-10-25 06:56:38 | 2026-10-25 06:58:42 | `test-engineer` | 3 | APROVADO | a26999be9f9284dc9 |
