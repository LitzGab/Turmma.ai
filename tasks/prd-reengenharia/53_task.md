# Tarefa 53.0 — Pendente sobrevive ao F5 e à sessão vencida

**Funcionalidade:** reengenharia · **Depende de:** 51.0
**Subagentes obrigatórios:** `privacy-guardian`, `infra-guardian`, `frontend-reviewer`, `test-engineer`, `revisor-geral`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A escolha da prova que o servidor ainda não confirmou sobrevive ao F5, à aba reaberta e à sessão que vence com o mesmo
aluno, guardada só com ids em `sessionStorage`; outra pessoa no mesmo Chromebook nunca a vê (RF21, regra 80.6). É da
linha da web, depois da 51.0.

## Contexto necessário

- `onda-3c.md` T13, "53.0, o espelho da prova", e o §3 ("Espelho"); `prd.md` RF21 e §8 (a linha "Escolha pendente no
  `sessionStorage`"); regras 20 (só ids, sem nome, sem resposta de texto) e 80.6
- `apps/web/src/areas/aluno/fila-de-respostas.ts` (a fila em memória, `parar`, `aoTrocarDeSessao`) e `respostas.ts`
  (`esperaAntesDeTentar`, o recuo que ganha jitter)
- `apps/web/src/api/sessao.ts:73` (hoje diz que nada da sessão vive em `sessionStorage`: o espelho não é sessão, e o
  comentário passa a dizer isso), `:110-115` (`quemEstaNaAba`, o `usuarioId` que separa "a mesma pessoa voltou" de
  "sentou outra pessoa"), `:316` (`usuarioAntesDeVencer`)
- O que a 51.0 entregou: a `sequencia` de cada pendente

## Subtarefas

- [x] 53.1 — `espelho-da-fila.ts`: uma chave por atividade, `{ dono: usuarioId, atividade, pendentes: [{ questao, alternativa, sequencia }] }`, lido por esquema zod estrito; inválido ou de outro dono é descartado
- [x] 53.2 — A fila grava o espelho a cada mudança e hidrata dele ao abrir, só com o mesmo dono
- [x] 53.3 — Limpa no envio, no "Sair" e na troca de dono; **não** limpa na sessão vencida
- [x] 53.4 — O recuo de `esperaAntesDeTentar` ganha ±25 % de jitter
- [x] 53.5 — `docs/lgpd.md`: a linha da escolha pendente no `sessionStorage` (só ids; até o envio, o "Sair", a troca de dono ou o fechamento da aba)
- [x] 53.6 — Testes: os da tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/api/espelho-da-fila.ts`, `espelho-da-fila.test.ts` (o módulo, que a casca carrega; era `areas/aluno/` na previsão: ver a divergência 3), `apps/web/src/areas/aluno/espelho-da-fila.test.ts` (a fila com o espelho) | novo |
| `apps/web/src/areas/aluno/fila-de-respostas.ts`, `respostas.ts`, `respostas.test.ts`, `Atividade.tsx`, `Atividade.test.tsx`, `apps/web/src/componentes/CascaDaEscola.tsx`, `CascaDaEscola.test.tsx`, `packages/shared/src/atividade/prova.ts`, `packages/shared/src/index.ts` | alterado |
| `apps/web/src/api/sessao.ts` (o comentário de `:73`, e o aviso de "Sair" se a fila precisar dele) | alterado |
| `docs/lgpd.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | Fica vermelho se (a mutação), ou o que prova |
|---|---|---|
| F5 com duas pendentes: a fila nova hidrata as duas, com a `sequencia`, e as manda | unidade | não hidratar |
| Sessão vencida e o mesmo aluno volta: as pendentes ficam e saem | unidade | limpar na sessão vencida |
| Outro dono (inclusive na aba reaberta, em que o Chrome devolve o `sessionStorage`): descarta, nada é mandado nem mostrado | unidade | hidratar sem conferir o dono |
| "Sair": limpa o espelho de todas as atividades | unidade | limpar só a atual |
| Duas atividades: cada uma hidrata a sua | unidade | chave sem a atividade |
| Envio confirmado: a pendente sai do espelho | unidade | gravar só na entrada |
| Espelho com campo a mais, nome, texto ou tipo errado: descartado inteiro | unidade | esquema sem `.strict()` |
| `sessionStorage` que lança (cota, modo restrito): a fila segue em memória, sem erro na tela | unidade | sem `try/catch` |
| O jitter fica entre 75 % e 125 % da espera e respeita o teto | unidade | sem jitter; passar do teto |

## Como testar

- A fila: copie `apps/web/src/areas/aluno/respostas.test.ts › o reenvio das respostas › a sessão que acaba esvazia a
  fila: nada da pessoa anterior é mandado nem mostrado à seguinte` (é o caso do outro dono) e `› a resposta que falha ao
  salvar continua marcada e é mandada de novo sozinha…` (é o caso do F5, com uma fila nova sobre o mesmo espelho).
- A troca de dono: `apps/web/src/api/sessao.test.ts › limpa o que vive fora do módulo (o cache de consultas) em todo
  caminho que muda o dono da aba`.
- O recuo: `respostas.test.ts › a espera entre as tentativas cresce e tem teto…`, com `Math.random` fixado por `vi.spyOn`.
- Isolado: `npx vitest run --project unidade apps/web/src/areas/aluno apps/web/src/api/sessao.test.ts`.
- Armadilha: o espelho guarda id de atividade, número de questão, índice de alternativa e `sequencia`; nunca o enunciado,
  o nome do aluno nem o `usuarioId` em texto legível além do campo `dono`. `localStorage` não: sobreviveria à aba fechada.

## Fora do escopo desta tarefa

O prazo do `fetch` e o "Tentar de novo" (52.0, X6); o corte da tela da Atividade (onda 4, X6).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O esquema estrito mora em `packages/shared/src/atividade/prova.ts` (`esquemaEspelhoDaFila`, com `index.ts`), e não em `espelho-da-fila.ts` | A web não depende de `zod` (`apps/web/package.json`) e lê todo esquema do `shared`; acrescentar a dependência mexeria no lockfile por um esquema só. O `strictObject` sem coerção descarta a questão em texto, que o `esquemaNumeroDaQuestao` (com `z.coerce`) aceitaria | `onda-3c.md`, T13, 53.0, item "Onde mora o esquema" |
| O dono lido na hora de gravar e de hidratar é o `usuarioId` do `/v1/eu` no cache de consultas, e não `quemEstaNaSessao()` | Na sessão vencida a memória da aba ainda guarda a pessoa anterior até a casca rodar `lembrarQuemEsta`: a fila nova, criada nesse intervalo, hidrataria as escolhas dela com o token de quem entrou. O cache é esvaziado a cada troca (`resetQueries`), então só há dono depois que o `/v1/eu` novo chega. Por isso `Atividade.tsx` (fora dos arquivos previstos) assina o `/v1/eu` com `enabled: false` e chama `fila.hidratar()` quando ele chega | `onda-3c.md`, T13, 53.0, item "O dono vem do `/v1/eu`" |
| A limpeza no "Sair" e na suspensão, e a permanência na sessão vencida, moram em `api/espelho-da-fila.ts` (gancho `aoTrocarDeSessao` com `estadoDaSessao()`, carregado pela casca), e a troca de dono é a `CascaDaEscola` chamando `esquecerEspelhosDeOutroDono` a cada `/v1/eu`; `sessao.ts` só ganha o comentário | A fila só é importada pela Atividade, que é `lazy`: com a limpeza nela, o "Sair" depois de um F5 fora da Atividade, ou a entrada de outra pessoa sem abrir atividade, deixaria as escolhas da anterior no navegador (privacy-guardian e revisor-geral, 1ª rodada). A `onda-4a.md` (57.0) citava a limpeza em `sessao.ts:332` | `onda-3c.md`, T13, 53.0, item "A limpeza mora em `apps/web/src/api/espelho-da-fila.ts`"; `onda-4a.md`, T15, "A sessão (57.0)" |
| "Limpa no envio" é o espelho seguir as pendentes: a chave sai quando a última é confirmada | A atividade só se envia sem pendente (`impedimentoDoEnvio`), então a limpeza no envio da atividade já é a da última confirmação, sem cláusula a mais | `onda-3c.md`, T13, 53.0, mesmo item |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: packages/shared/src/atividade/prova.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › descarta o conjunto inteiro, e apaga a chave
- export const esquemaEspelhoDaFila = z.strictObject({
+ export const esquemaEspelhoDaFila = z.object({
  dono: z.uuid(),
```

```mutacao
arquivo: packages/shared/src/atividade/prova.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › descarta o conjunto inteiro, e apaga a chave
    .array(
-      z.strictObject({
+      z.object({
        questao: z.number().int().min(1).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE),
```

```mutacao
arquivo: packages/shared/src/atividade/prova.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › descarta o conjunto inteiro, e apaga a chave
- questao: z.number().int().min(1).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE),
+ questao: z.coerce.number().int().min(1).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE),
```

```mutacao
arquivo: packages/shared/src/atividade/prova.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › descarta o conjunto inteiro, e apaga a chave
- questao: z.number().int().min(1).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE),
+ questao: z.number().int().min(0).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE),
```

```mutacao
arquivo: packages/shared/src/atividade/prova.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › descarta o conjunto inteiro, e apaga a chave
- questao: z.number().int().min(1).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE),
+ questao: z.number().int().min(1),
```

```mutacao
arquivo: packages/shared/src/atividade/prova.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › descarta o conjunto inteiro, e apaga a chave
  )
- .max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE),
  })
```

```mutacao
arquivo: packages/shared/src/atividade/prova.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › o dono que não é um id não vale
- dono: z.uuid(),
+ dono: z.string(),
  atividade: z.uuid(),
```

```mutacao
arquivo: packages/shared/src/atividade/prova.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › esquecer o de outro dono apaga as chaves dele
  dono: z.uuid(),
- atividade: z.uuid(),
+ atividade: z.string(),
  pendentes: z
```

```mutacao
arquivo: apps/web/src/api/espelho-da-fila.ts
teste: apps/web/src/areas/aluno/espelho-da-fila.test.ts › o próprio acesso ao sessionStorage que lança
  } catch {
-     return quandoFalha
+     throw new Error('sem armazenamento')
```

```mutacao
arquivo: apps/web/src/api/espelho-da-fila.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › sem pendente nenhuma, a chave sai
- if (pendentes.length === 0) {
-   apagar(chaveDa(atividade))
-   return
- }
  tentar(() => window.sessionStorage.setItem(chaveDa(atividade), JSON.stringify({ dono, atividade, pendentes })), undefined)
```

```mutacao
arquivo: apps/web/src/api/espelho-da-fila.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › o que é de outro dono não volta
- if (guardado?.dono === dono && guardado.atividade === atividade) return guardado.pendentes
+ if (guardado?.atividade === atividade) return guardado.pendentes
```

```mutacao
arquivo: apps/web/src/api/espelho-da-fila.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › descarta o conjunto inteiro, e apaga a chave
- if (guardado?.dono === dono && guardado.atividade === atividade) return guardado.pendentes
+ if (guardado?.dono === dono) return guardado.pendentes
```

```mutacao
arquivo: apps/web/src/api/espelho-da-fila.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › esquecer o de outro dono apaga as chaves dele
- for (const chave of chavesDoEspelho()) if (conteudoDa(chave)?.dono !== dono) apagar(chave)
+ for (const chave of chavesDoEspelho()) if (conteudoDa(chave) === undefined) apagar(chave)
```

```mutacao
arquivo: apps/web/src/api/espelho-da-fila.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › esquecer o de outro dono apaga as chaves dele
- for (const chave of chavesDoEspelho()) if (conteudoDa(chave)?.dono !== dono) apagar(chave)
+ for (const chave of chavesDoEspelho()) if (conteudoDa(chave) !== undefined && conteudoDa(chave)?.dono !== dono) apagar(chave)
```

```mutacao
arquivo: apps/web/src/api/espelho-da-fila.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › esquecer o de outro dono apaga as chaves dele
- return chaves.filter((chave): chave is string => chave?.startsWith(PREFIXO) === true)
+ return chaves.filter((chave): chave is string => chave !== null)
```

```mutacao
arquivo: apps/web/src/api/espelho-da-fila.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › o "Sair" apaga o espelho de todas as atividades
- for (let indice = 0; indice < guardado.length; indice += 1) chaves.push(guardado.key(indice))
+ for (let indice = 1; indice < guardado.length; indice += 1) chaves.push(guardado.key(indice))
```

```mutacao
arquivo: apps/web/src/api/espelho-da-fila.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › o "Sair" apaga o espelho de todas as atividades
- for (const chave of chavesDoEspelho()) apagar(chave)
+ for (const chave of chavesDoEspelho().slice(0, 1)) apagar(chave)
```

```mutacao
arquivo: apps/web/src/areas/aluno/fila-de-respostas.ts
teste: apps/web/src/areas/aluno/espelho-da-fila.test.ts › sessão vencida e o mesmo aluno volta
  function refletir(): void {
-   if (parada || espelho === undefined) return
+   if (espelho === undefined) return
```

```mutacao
arquivo: apps/web/src/areas/aluno/fila-de-respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a resposta que falha ao salvar continua marcada e é mandada de novo sozinha
  function refletir(): void {
-   if (parada || espelho === undefined) return
+   if (parada) return
```

```mutacao
arquivo: apps/web/src/areas/aluno/fila-de-respostas.ts
teste: apps/web/src/areas/aluno/espelho-da-fila.test.ts › sem saber quem é o aluno, nada é gravado
- if (dono !== undefined) gravarEspelho(dono, espelho.atividade, estado.pendentes)
+ gravarEspelho(dono ?? 'sem-dono', espelho.atividade, estado.pendentes)
```

```mutacao
arquivo: apps/web/src/areas/aluno/fila-de-respostas.ts
teste: apps/web/src/areas/aluno/espelho-da-fila.test.ts › só grava quando as pendentes mudam
- if (mudouAFila) refletir()
+ refletir()
```

```mutacao
arquivo: apps/web/src/areas/aluno/fila-de-respostas.ts
teste: apps/web/src/areas/aluno/espelho-da-fila.test.ts › a fila parada não hidrata nem manda
  hidratar: () => {
-   if (parada || espelho === undefined) return
+   if (espelho === undefined) return
    const dono = espelho.dono()
```

```mutacao
arquivo: apps/web/src/areas/aluno/fila-de-respostas.ts
teste: apps/web/src/areas/aluno/espelho-da-fila.test.ts › a fila parada não hidrata nem manda
  hidratar: () => {
-   if (parada || espelho === undefined) return
+   if (parada) return
    const dono = espelho.dono()
```

```mutacao
arquivo: apps/web/src/areas/aluno/fila-de-respostas.ts
teste: apps/web/src/areas/aluno/espelho-da-fila.test.ts › sem saber quem é o aluno, não hidrata nem apaga
- if (dono === undefined) return
  // Quem sentou depois não herda, nem deixa ao alcance, a escolha da pessoa anterior.
```

```mutacao
arquivo: apps/web/src/areas/aluno/fila-de-respostas.ts
teste: apps/web/src/areas/aluno/espelho-da-fila.test.ts › outro dono, também na aba reaberta
- esquecerEspelhosDeOutroDono(dono)
  publicar(hidratarDoEspelho(estado, lerEspelho(dono, espelho.atividade)))
```

```mutacao
arquivo: apps/web/src/areas/aluno/fila-de-respostas.ts
teste: apps/web/src/areas/aluno/espelho-da-fila.test.ts › F5 com duas pendentes
- publicar(hidratarDoEspelho(estado, lerEspelho(dono, espelho.atividade)))
+ lerEspelho(dono, espelho.atividade)
```

```mutacao
arquivo: apps/web/src/areas/aluno/fila-de-respostas.ts
teste: apps/web/src/areas/aluno/espelho-da-fila.test.ts › sem saber quem é o aluno, nada é gravado
  // aluno marcou antes de se saber quem ele é só entra no espelho agora.
- refletir()
  bombear()
```

```mutacao
arquivo: apps/web/src/areas/aluno/fila-de-respostas.ts
teste: apps/web/src/areas/aluno/espelho-da-fila.test.ts › F5 com duas pendentes
  // aluno marcou antes de se saber quem ele é só entra no espelho agora.
  refletir()
- bombear()
```

```mutacao
arquivo: apps/web/src/api/espelho-da-fila.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › a sessão vencida por inatividade não apaga
- if (estado !== 'vencida' && estado !== 'aberta') esquecerTodosOsEspelhos()
+ if (estado !== 'aberta') esquecerTodosOsEspelhos()
```

```mutacao
arquivo: apps/web/src/api/espelho-da-fila.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › o "Sair" apaga o espelho de todas as atividades
- if (estado !== 'vencida' && estado !== 'aberta') esquecerTodosOsEspelhos()
+ if (estado !== 'vencida') esquecerTodosOsEspelhos()
```

```mutacao
arquivo: apps/web/src/api/espelho-da-fila.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › o "Sair" apaga o espelho de todas as atividades
- if (estado !== 'vencida' && estado !== 'aberta') esquecerTodosOsEspelhos()
+ if (estado === 'vencida' && estado === 'aberta') esquecerTodosOsEspelhos()
```

```mutacao
arquivo: apps/web/src/api/espelho-da-fila.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › a sessão suspensa apaga
- if (estado !== 'vencida' && estado !== 'aberta') esquecerTodosOsEspelhos()
+ if (estado === 'anonima') esquecerTodosOsEspelhos()
```

```mutacao
arquivo: apps/web/src/areas/aluno/fila-de-respostas.ts
teste: apps/web/src/areas/aluno/espelho-da-fila.test.ts › F5 com duas pendentes
- espelho: { atividade: atividadeAplicadaId, dono: () => cliente.getQueryData(consultaEu.queryKey)?.usuarioId },
+ espelho: { atividade: atividadeAplicadaId, dono: () => cliente.getQueryData(consultaEu.queryKey)?.escola.id },
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › o aluno da sessão só se sabe depois de a tela abrir
    fila.hidratar()
- }, [alunoDaSessao, fila])
+ }, [fila])
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › o aluno da sessão só se sabe depois de a tela abrir
- const alunoDaSessao = useQuery({ ...consultaEu, enabled: false }).data?.usuarioId
+ const alunoDaSessao = useQuery({ ...consultaEu, enabled: true }).data?.usuarioId
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › o F5 com a escolha ainda não salva
  useEffect(() => {
-   fila.hidratar()
  }, [alunoDaSessao, fila])
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › o jitter deixa a espera
- return Math.min(MAIOR_ESPERA_DA_FILA_MS, Math.round(base * (1 - JITTER_DA_FILA + 2 * JITTER_DA_FILA * Math.random())))
+ return Math.round(base * (1 - JITTER_DA_FILA + 2 * JITTER_DA_FILA * Math.random()))
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › o jitter deixa a espera
- return Math.min(MAIOR_ESPERA_DA_FILA_MS, Math.round(base * (1 - JITTER_DA_FILA + 2 * JITTER_DA_FILA * Math.random())))
+ return Math.min(MAIOR_ESPERA_DA_FILA_MS, Math.round(base * (1 + JITTER_DA_FILA + 2 * JITTER_DA_FILA * Math.random())))
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › o jitter deixa a espera
- return Math.min(MAIOR_ESPERA_DA_FILA_MS, Math.round(base * (1 - JITTER_DA_FILA + 2 * JITTER_DA_FILA * Math.random())))
+ return Math.min(MAIOR_ESPERA_DA_FILA_MS, Math.round(base * (1 - JITTER_DA_FILA + JITTER_DA_FILA * Math.random())))
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a pendente que o espelho guardou volta à fila
- const entram = guardadas.filter((guardada) => pendenteDaQuestao(estado, guardada.questao) === undefined && guardada.sequencia > (estado.conhecidas[guardada.questao]?.sequencia ?? 0))
+ const entram = guardadas.filter((guardada) => guardada.sequencia > (estado.conhecidas[guardada.questao]?.sequencia ?? 0))
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a pendente que o espelho guardou volta à fila
- const entram = guardadas.filter((guardada) => pendenteDaQuestao(estado, guardada.questao) === undefined && guardada.sequencia > (estado.conhecidas[guardada.questao]?.sequencia ?? 0))
+ const entram = guardadas.filter((guardada) => pendenteDaQuestao(estado, guardada.questao) === undefined && guardada.sequencia >= (estado.conhecidas[guardada.questao]?.sequencia ?? 0))
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a pendente que o espelho guardou volta à fila
- if (entram.length === 0) return estado
  const conhecidas = { ...estado.conhecidas }
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a pendente que o espelho guardou volta à fila
  const conhecidas = { ...estado.conhecidas }
- for (const { questao, alternativa, sequencia } of entram) conhecidas[questao] = { alternativa, sequencia }
  return { ...estado, pendentes: [...entram, ...estado.pendentes], conhecidas }
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a pendente que o espelho guardou volta à fila
- return { ...estado, pendentes: [...entram, ...estado.pendentes], conhecidas }
+ return { ...estado, pendentes: [...estado.pendentes, ...entram], conhecidas }
```

```mutacao
arquivo: apps/web/src/api/espelho-da-fila.ts
teste: apps/web/src/areas/aluno/espelho-da-fila.test.ts › duas atividades: cada fila hidrata a sua
- const chaveDa = (atividade: string): string => `${PREFIXO}${atividade}`
+ const chaveDa = (_atividade: string): string => PREFIXO
```

```mutacao
arquivo: apps/web/src/areas/aluno/fila-de-respostas.ts
teste: apps/web/src/areas/aluno/espelho-da-fila.test.ts › cada mudança das pendentes vai para o espelho, e a confirmação do servidor tira a pendente dele
- const mudouAFila = novo.pendentes !== estado.pendentes
+ const mudouAFila = novo.pendentes.length > estado.pendentes.length
```

```mutacao
arquivo: apps/web/src/api/espelho-da-fila.ts
teste: apps/web/src/api/espelho-da-fila.test.ts › o que é de outro dono não volta, e sai do armazenamento
  if (guardado?.dono === dono && guardado.atividade === atividade) return guardado.pendentes
- apagar(chaveDa(atividade))
  return []
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: apps/web/src/componentes/CascaDaEscola.test.tsx › o `/v1/eu` de quem entrou apaga o espelho dos outros donos
- esquecerEspelhosDeOutroDono(dados.usuarioId)
  }, [dados, navegar])
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | Dado sintético com atividade "para responder" na vitrine, para fotografar o estado "não salva" e o "Tentar de novo" a 360 px | `TODO.md` (`tools/vitrine/` está fora dos arquivos da tarefa) |
| frontend-reviewer (1ª) | Frase em `role="status"` avisando que a escolha foi recuperada depois do F5 | Recusada nesta tarefa: muda o texto da tela, e a 53.0 não muda o que a tela mostra. Destino: o corte da tela da Atividade, onda 4 (X6), já listado em "Fora do escopo" |
| infra-guardian (1ª) | `aoAbrirSessao(tentarTodas)` sai na hora, sem a variação do recuo | `TODO.md`; só pesa se a sessão passar a voltar sozinha, o que hoje não existe |
| infra-guardian (1ª) | Quando o cenário da prova online existir, o teste de carga deve simular a volta da rede com trinta alunos atrás do mesmo IP | Recusada: a tarefa não toca teste de carga e o próprio revisor disse que "está certo assim" |
| test-engineer (1ª) | Aba duplicada: caso que cite a garantia de deduplicação da 51.0 | Recusada: a garantia é do servidor (o upsert de `minha-atividade.repository.ts` só grava `sequencia` maior, conferido pelo infra-guardian), e teste de web não a prova |
| revisor-geral (1ª) | As fotos da tela não mostram nada fora da tarefa | Sem ação: é constatação, a limitação da vitrine já está dita no prompt da rodada |
| privacy-guardian (2ª), revisor-geral (2ª) | `apps/web/src/api/sessao.ts:76-78`: o comentário ainda aponta para `areas/aluno/espelho-da-fila.ts` e diz só "sai no 'Sair'"; deve citar `api/espelho-da-fila.ts`, a suspensão e a troca de dono feita pela casca | `TODO.md`: uma linha só, "(X5, 53.0) acabamentos do espelho", com este item e os dois seguintes de `revisor-geral` |
| revisor-geral (2ª) | A limpeza no "Sair" só vale porque a `CascaDaEscola` é importada direto, sem `lazy`: se alguém a passar para `lazy`, volta a falhar sem teste que avise; importar o espelho em `main.tsx` ou registrar o gancho por função chamada ali | `TODO.md`, na mesma linha dos acabamentos |
| revisor-geral (2ª) | `api/espelho-da-fila.ts:2` importa o tipo `EscolhaPendente` de `areas/aluno/respostas` (a camada `api/` depende de tela); mover para `packages/shared` ao lado de `esquemaEspelhoDaFila`, ou derivar de `EspelhoDaFila['pendentes'][number]` | `TODO.md`, na mesma linha dos acabamentos |
| test-engineer (2ª) | Caso em `CascaDaEscola.test.tsx` que clique em "Sair" e confira o `sessionStorage` vazio, sem a Atividade carregada | `TODO.md`, na mesma linha dos acabamentos: é o teste que fixa o item do `lazy` acima |
| test-engineer (2ª) | Caso que fixe que a troca de escola da mesma pessoa apaga as pendentes da escola anterior | `TODO.md`, na mesma linha dos acabamentos |
| test-engineer (2ª) | `areas/aluno/espelho-da-fila.test.ts:84` e `:97` testam quase a mesma coisa (o acesso ao `sessionStorage` que lança e os métodos de `Storage` que lançam): juntar ou dizer no nome o que cada um prova a mais | Recusada: os dois exercitam o `tentar` por caminhos diferentes (o acesso à propriedade e a chamada do método), e as mutações de `espelho-da-fila.ts` dependem dos dois |
| privacy-guardian (2ª) | O segundo caso novo de `CascaDaEscola.test.tsx` ("a pessoa da sessão troca sob a mesma tela") não tem mutação própria | Recusada: o próprio revisor diz que a mutação da linha da casca já derruba o primeiro caso e que isto é "só cobertura extra" |
| infra-guardian (2ª) | `aoAbrirSessao(tentarTodas)` reenvia sem jitter; rever quando a 57.0 mexer na sessão | Já está no `TODO.md` (linha `(X5, 53.0) aoAbrirSessao(tentarTodas) sem a variação do recuo`) |
| infra-guardian (2ª) | Cenário de carga da prova em `infra/k6/` (o `PUT` com `sequencia` e reenvio, trinta alunos atrás do mesmo IP) | Já está no `TODO.md` (linha `(X5, 51.0) Cenário de carga da prova em infra/k6/`) |
| frontend-reviewer (2ª) | `tools/vitrine/` sem atividade "para responder", para fotografar "não salva" e "Tentar de novo" a 360 px | Já está no `TODO.md` (linha `(X5, 53.0) Dado sintético com atividade "para responder" na vitrine`) |
| frontend-reviewer (2ª) | A faixa "CORREÇÃO APROVADA POR PROFESSOR SINTÉTICO DAVI AE51B7CB" mostra um sufixo parecido com id; conferir na validação se o nome real sai assim | Recusada: o sufixo vem do dado sintético da vitrine, não do componente, e a tarefa não toca a faixa. O Validador fotografa a tela na validação da spec |
| frontend-reviewer (2ª) | Frase em `role="status"` avisando que a escolha foi recuperada depois do F5 | Já destinada na 1ª rodada: o corte da tela da Atividade, onda 4 (X6) |

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
| 2026-10-22 12:47:37 | 2026-10-22 12:48:01 | `frontend-reviewer` | 1 | APROVADO | a162aff3f68f10592 |
| 2026-10-22 12:47:27 | 2026-10-22 12:49:01 | `privacy-guardian` | 1 | REPROVADO | ac01ac21108ec92d3 |
| 2026-10-22 12:47:32 | 2026-10-22 12:49:05 | `infra-guardian` | 1 | APROVADO | a001be7010f918245 |
| 2026-10-22 12:47:48 | 2026-10-22 12:49:32 | `revisor-geral` | 1 | REPROVADO | ae0c7ea4daabd7181 |
| 2026-10-22 12:47:42 | 2026-10-22 12:50:07 | `test-engineer` | 1 | REPROVADO | aad78a846ccf18bc1 |
| 2026-10-22 13:04:00 | 2026-10-22 13:04:29 | `infra-guardian` | 2 | APROVADO | a94b4cfe26236ffd6 |
| 2026-10-22 13:04:09 | 2026-10-22 13:04:31 | `frontend-reviewer` | 2 | APROVADO | ab42c76570d740013 |
| 2026-10-22 13:03:51 | 2026-10-22 13:04:47 | `privacy-guardian` | 2 | APROVADO | a27c7c5702082f7f9 |
| 2026-10-22 13:04:20 | 2026-10-22 13:05:28 | `test-engineer` | 2 | APROVADO | a150905f28e9bcf45 |
| 2026-10-22 13:04:30 | 2026-10-22 13:05:35 | `revisor-geral` | 2 | APROVADO | a2e05d2966c600fcc |
