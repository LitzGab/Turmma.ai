# Tarefa 1.0 — A coordenação vê no sino o que espera por ela

**Funcionalidade:** telas-da-coordenacao · **Depende de:** nenhuma
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`, `infra-guardian`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Em toda tela da coordenação, um sino conta o que espera por ela e abre a lista "Esperando você"; cada item leva à tela que resolve.

## Contexto necessário

- `techspec.md` seções 5 ("O sino", "A fila"), 7, 7b e 7c ("Releitura"); `prd.md` RF4, RF5 e seção 6
- `mockup.md` seção 16(b); `tasks/prd-pele-e-casca/techspec.md` seções 7b e 9; regra 20, item 10
- Código: `apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx` (montado acima do `Switch`, uma leitura por sessão)

## Subtarefas

- [x] 1.1 — A âncora: `useAncoraDoSino()` e o elemento vazio na casca
- [x] 1.2 — A peça `Sino`, com a lista por prop: botão "Esperando você, N" ou "Esperando você, nada", `Contador` parado, e `PainelLado` com os grupos "Urgente" e "Da escola", cada item uma `Linha` que é link
- [x] 1.3 — Os estados: carregando, erro, leitura parcial, e o vazio com ícone ilustrado, sem mascote, e "Tudo em dia" (com "Ver o que falta para a escola"); `completa: false` em qualquer consulta vira leitura parcial, com "Parte da lista não carregou"; "Tentar de novo" também com a fila em `erro`; "Atualizar" e "Atualizado às HH:MM" (só muda depois do clique, sem temporizador), que relê os cinco observadores pela chave exata
- [x] 1.4 — `montarFila` (pura) e `useFilaDaCoordenacao`, como na Tech Spec: observadores com `staleTime` de 5 min, `refetchInterval: false`, `refetchOnWindowFocus: false` e `refetchOnReconnect: false`; retry só por chave exata; um item por vínculo ou convite, `contador` só em turmas sem professor; sem ano em curso não chama turmas nem vínculos
- [x] 1.5 — `SinoDaCoordenacao`, por `lazy()`, em `rotas.tsx`; galeria; `PECAS_FORA_DA_ENTRADA`
- [x] 1.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/sino/Sino.tsx`, `apps/web/src/componentes/sino/Sino.test.tsx` | novo |
| `apps/web/src/componentes/ancora-do-sino.ts` | novo |
| `apps/web/src/componentes/CascaDaEscola.tsx`, `apps/web/nome-dos-chunks.ts` | alterado |
| `apps/web/src/areas/coordenacao/fila-da-coordenacao.ts`, `apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts` | novo |
| `apps/web/src/areas/coordenacao/SinoDaCoordenacao.tsx`, `apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx` | novo |
| `apps/web/src/areas/coordenacao/rotas.tsx`, `apps/web/src/__fixtures__/tela.tsx` | alterado |
| `apps/web/src/galeria/secoes/sino.tsx`, `e2e/sino-da-coordenacao.spec.ts` | novo |
| `apps/web/src/sino-por-area.test.tsx` | novo (o sino só existe na coordenação, pelas rotas da app) |
| `apps/web/src/componentes/CascaDaEscola.test.tsx`, `apps/web/src/componentes/casca-sem-import.test.ts` | alterado (a âncora; `ancora-do-sino.ts` entra na lista da casca) |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| a conta, tipo a tipo | unidade | os cinco tipos viram item com o endereço certo; vínculo pendente e material processando não viram |
| borda: duas disciplinas na mesma turma; turma só com vínculo contestado; sem ano em curso | unidade | conta uma vez; é sem professor; nenhum item de turma |
| vínculo encerrado | unidade | encerrado ao lado de confirmado: não é sem professor; só encerrado: é; contestado e depois encerrado: sem item de contestação |
| lista truncada | unidade e componente | `completa: false` em qualquer das cinco: `parcial`, sem "Tudo em dia"; em turmas ou em vínculos, cada um sozinho, suprime "turmas sem professor" |
| um item por vínculo | unidade | um professor com duas contestações e outro com uma dão três itens, nenhum com `contador`; `id` único com a mesma contestação duas vezes e com homônimos; os tipos são só os cinco da tabela e nada em `montarFila` deriva de uso, entrega ou atividade do professor; revogar o convite tira o item; a contagem do sino é a do filtro "Sem professor" |
| o sino não relê | componente | dois tempos, só o sino montado. (a) Com um material `processando`, avançar 10 s ou mais: zero chamadas. Mutação: tirar `refetchInterval: false`. (b) Avançar além de 5 min, com o dado velho, o foco sai e volta (`focusManager.setFocused(false)` e depois `setFocused(true)`) e a rede sai e volta (`onlineManager.setOnline(false)` e depois `setOnline(true)`): zero chamadas, de qualquer consulta, anos letivos inclusive. Um `focus` na janela ou um `online` solto não fazem o TanStack reler, e o teste passaria sem a opção. O `afterEach` restaura os dois gerenciadores, e um caso de controle prova que a mesma consulta, com a opção ligada, relê (o padrão é o de `apps/web/src/api/privacidade.test.ts`). Mutações, cada uma vermelha sozinha: tirar `refetchOnWindowFocus: false` (falha na volta do foco); tirar `refetchOnReconnect: false` (falha na volta da rede). Incidentes lidos uma vez por sessão |
| "Tentar de novo" e "Atualizar" não leem o que é auditado | componente | sino montado sobre a lista da turma e sobre Pedidos, fila `parcial` e depois `erro`, clique em cada um: zero chamadas a `/lista`, `/reivindicacoes` e `/v1/privacidade/pedidos`; "Atualizado às" só muda depois do clique. Mutação: trocar a releitura (do retry ou do "Atualizar") por invalidação de prefixo deixa o teste vermelho |
| sem ano letivo | componente, e2e | sem ano, ou só `planejado` ou `encerrado`: nenhuma chamada a turmas e vínculos (ou 404 tratado como vazio), `pronta`, "Tudo em dia"; e2e `--vazia` olha o sino |
| só a coordenação | componente | nas áreas do professor e do aluno não há "Esperando você" da coordenação nem chamada a `/v1/vinculos`, `/v1/professores` ou `/v1/privacidade/incidentes` vinda do sino |
| o que a fila não lê | componente | nenhuma chamada a `/lista`, `/reivindicacoes` nem `/v1/privacidade/pedidos`; abrir a lista não faz chamada |
| estados da tela | componente | parcial nunca diz "Tudo em dia"; vazio só com tudo lido; a contagem no nome acessível; o vazio sem mascote |
| do sino à tela | e2e | convite vencido: conta 1, leva a Professores e, refeito, some; foco devolvido; nada animado; 360 px |
| recomeço: segunda pessoa; troca de escola | e2e e componente | e2e: a fila da anterior não aparece (sem formulário, os outros casos não se aplicam). O "1" de A que ainda se desenha antes do primeiro "carregando" não é visto pelo e2e; a garantia de que o item de A não aparece enquanto B carrega é do teste de componente (`resetQueries` com a resposta de B segurada), que tem o bloco de mutação |

## Como testar

- Componente: `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx › coordenação: nada é lido ao abrir…`. A fila lê em paralelo: `redeFalsa` passa a responder por caminho
- e2e: `e2e/professores.spec.ts › W4 (Professores)…` semeia o convite vencido; a leitura única de `e2e/incidentes.spec.ts` não pode virar duas
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts`; `node tools/ci/e2e.ts --manter-ambiente e2e/sino-da-coordenacao.spec.ts`
- Telas: `coordenacao`, `/coordenacao/governanca`, clique `text=Esperando você`; mockup `/coordenacao?sino=1`

## Fora do escopo desta tarefa

Os lugares (3.0), o Painel (2.0), o sino do professor (X3), item de leitura auditada e a onça de corpo inteiro no vazio (decisão do Joaquim, `techspec.md` seção 12).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O nome do botão tem mais formas que as duas da spec: "Esperando você, carregando", "…, parte não carregou" e "…, não carregou" | "nada" com a lista não lida inteira diria "Tudo em dia" sem ter lido (RF4); `nada` fica só para a fila `pronta` | `techspec.md` §5, "O sino" |
| O `contador` do item é `{ n, oQueConta }`, e não só o número | o `Contador` precisa do texto que o leitor de tela diz depois do número, e a peça `Sino` é genérica (serve à X3) | `techspec.md` §5, "A fila" |
| Um item por incidente sem confirmação, no grupo "Urgente" | a spec não dizia se era um item ou um com a contagem; o aviso da área já trata um por vez | `techspec.md` §5, tabela da fila |
| "Atualizar" relê anos, turmas, vínculos, professores e materiais; os incidentes ficam fora | "os cinco observadores" da spec são esses; os incidentes são uma leitura por sessão (`staleTime: Infinity`, como o aviso) | `techspec.md` §7c, "Releitura" |
| A lista do sino fecha ao se ir a um item (muda o caminho ou só a consulta) | o `PainelLado` é modal e ficaria por cima da tela de destino | `techspec.md` §5, "O sino" |
| "Tentar de novo" da fila relê também a lista que veio truncada (`completa: false`), não só a que falhou | o aviso "Parte da lista não carregou" vale para as duas causas, e um botão que ignorasse a truncada não faria nada; custo dito: até 10 requisições por lista truncada por clique, com o botão desligado enquanto relê | `techspec.md` §5 ("Tentar de novo" da fila) e §7c (carga) |
| `redeFalsa` ganha `responderPor(caminho, resposta)`, que responde por caminho sem consumir | a fila lê seis consultas em paralelo, e a fila de respostas em ordem viraria sorteio (a spec já anuncia: "`redeFalsa` passa a responder por caminho") | `1_task.md`, "Como testar" |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › com um material processando
-const SEM_LEITURA_SOZINHA = { staleTime: 5 * 60_000, refetchInterval: false, refetchOnWindowFocus: false, refetchOnReconnect: false } as const
+const SEM_LEITURA_SOZINHA = { staleTime: 5 * 60_000, refetchOnWindowFocus: false, refetchOnReconnect: false } as const
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › o foco sai e volta
-const SEM_LEITURA_SOZINHA = { staleTime: 5 * 60_000, refetchInterval: false, refetchOnWindowFocus: false, refetchOnReconnect: false } as const
+const SEM_LEITURA_SOZINHA = { staleTime: 5 * 60_000, refetchInterval: false, refetchOnReconnect: false } as const
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › a rede sai e volta
-const SEM_LEITURA_SOZINHA = { staleTime: 5 * 60_000, refetchInterval: false, refetchOnWindowFocus: false, refetchOnReconnect: false } as const
+const SEM_LEITURA_SOZINHA = { staleTime: 5 * 60_000, refetchInterval: false, refetchOnWindowFocus: false } as const
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › dentro dos 5 minutos
-const SEM_LEITURA_SOZINHA = { staleTime: 5 * 60_000, refetchInterval: false, refetchOnWindowFocus: false, refetchOnReconnect: false } as const
+const SEM_LEITURA_SOZINHA = { staleTime: 0, refetchInterval: false, refetchOnWindowFocus: false, refetchOnReconnect: false } as const
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › incidentes velho
-const incidentes = useQuery({ ...consultaIncidentes, ...SEM_LEITURA_SOZINHA, staleTime: Infinity })
+const incidentes = useQuery({ ...consultaIncidentes, ...SEM_LEITURA_SOZINHA, staleTime: 5 * 60_000 })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › sem ano em curso
-const turmas = useQuery({ ...consultaTurmas, ...SEM_LEITURA_SOZINHA, enabled: aplicaAoAno })
+const turmas = useQuery({ ...consultaTurmas, ...SEM_LEITURA_SOZINHA, enabled: true })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › sem ano em curso
-const vinculos = useQuery({ ...consultaVinculos, ...SEM_LEITURA_SOZINHA, enabled: aplicaAoAno })
+const vinculos = useQuery({ ...consultaVinculos, ...SEM_LEITURA_SOZINHA, enabled: true })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › relê as cinco leituras
-const reler = (consulta: { readonly queryKey: readonly unknown[] }): Promise<unknown> => cliente.refetchQueries({ queryKey: consulta.queryKey, exact: true })
+const reler = (consulta: { readonly queryKey: readonly unknown[] }): Promise<unknown> => cliente.refetchQueries({ queryKey: consulta.queryKey.slice(0, 1) })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › relê só o que falhou
-const reler = (consulta: { readonly queryKey: readonly unknown[] }): Promise<unknown> => cliente.refetchQueries({ queryKey: consulta.queryKey, exact: true })
+const reler = (consulta: { readonly queryKey: readonly unknown[] }): Promise<unknown> => cliente.refetchQueries({ queryKey: consulta.queryKey.slice(0, 1) })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › relê as cinco leituras
-{ resultado: incidentes, consulta: consultaIncidentes, atualiza: false },
+{ resultado: incidentes, consulta: consultaIncidentes, atualiza: true },
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › relê só o que falhou
-const relidas = leiturasDaFila.filter(({ resultado }) => resultado.isError || veioTruncada(resultado.data)).map(({ consulta }) => reler(consulta))
+const relidas = leiturasDaFila.filter(({ resultado }) => veioTruncada(resultado.data)).map(({ consulta }) => reler(consulta))
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › turmas que vieram truncadas
-const relidas = leiturasDaFila.filter(({ resultado }) => resultado.isError || veioTruncada(resultado.data)).map(({ consulta }) => reler(consulta))
+const relidas = leiturasDaFila.filter(({ resultado }) => resultado.isError).map(({ consulta }) => reler(consulta))
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts › turmas ou vínculos truncados
-return leitura.estado === 'lida' && leitura.completa ? leitura.dado : undefined
+return leitura.estado === 'lida' ? leitura.dado : undefined
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts › turmas ou vínculos truncados
-if (turmasLidas !== undefined && vinculosLidos !== undefined) itens.push(...itemDeTurmasSemProfessor(turmasSemProfessor(turmasLidas, vinculosLidos)))
+if (turmasLidas !== undefined) itens.push(...itemDeTurmasSemProfessor(turmasSemProfessor(turmasLidas, vinculosLidos ?? [])))
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts › turmas ou vínculos truncados
-if (turmasLidas !== undefined && vinculosLidos !== undefined) itens.push(...itemDeTurmasSemProfessor(turmasSemProfessor(turmasLidas, vinculosLidos)))
+if (turmasLidas !== undefined) itens.push(...itemDeTurmasSemProfessor(turmasSemProfessor(turmasLidas, vinculosLidos ?? [])))
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts › incidente confirmado
-.filter((incidente) => incidente.confirmadoEm === null)
+.filter(() => true)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts › só o vínculo de professor contestado
-.filter((vinculo) => vinculo.papel === 'professor' && vinculo.estado === 'contestado')
+.filter((vinculo) => vinculo.estado === 'contestado')
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts › os cinco tipos
-.filter((vinculo) => vinculo.papel === 'professor' && vinculo.estado === 'contestado')
+.filter((vinculo) => vinculo.papel === 'professor' && vinculo.estado !== 'encerrado')
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts › os cinco tipos
-.filter((professor) => professor.estado === 'vencido')
+.filter((professor) => professor.estado !== 'ativo')
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts › os cinco tipos
-.filter((material) => material.estado === 'falhou')
+.filter((material) => material.estado !== 'pronto')
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts › os cinco tipos
-const ESTADOS_QUE_DAO_PROFESSOR = ['pendente', 'confirmado'] as const
+const ESTADOS_QUE_DAO_PROFESSOR = ['confirmado'] as const
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts › vínculo encerrado
-const ESTADOS_QUE_DAO_PROFESSOR = ['pendente', 'confirmado'] as const
+const ESTADOS_QUE_DAO_PROFESSOR = ['pendente'] as const
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts › vínculo de aluno
-const comProfessor = new Set(vinculos.filter((vinculo) => vinculo.papel === 'professor' && ESTADOS_QUE_DAO_PROFESSOR.some((estado) => estado === vinculo.estado)).map((vinculo) => vinculo.turma.id))
+const comProfessor = new Set(vinculos.filter((vinculo) => ESTADOS_QUE_DAO_PROFESSOR.some((estado) => estado === vinculo.estado)).map((vinculo) => vinculo.turma.id))
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts › nada lido
-if (leituras.some((leitura) => leitura.estado === 'carregando')) return { itens, situacao: 'carregando' }
+if (false) return { itens, situacao: 'carregando' }
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts › nada lido
-if (!leituras.some((leitura) => leitura.estado === 'lida')) return { itens, situacao: 'erro', ...falha }
+if (false) return { itens, situacao: 'erro', ...falha }
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts › a falha de uma leitura
-if (primeiraFalha !== undefined || truncada) return { itens, situacao: 'parcial', ...falha }
+if (truncada) return { itens, situacao: 'parcial', ...falha }
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts › lista truncada em qualquer
-if (primeiraFalha !== undefined || truncada) return { itens, situacao: 'parcial', ...falha }
+if (primeiraFalha !== undefined) return { itens, situacao: 'parcial', ...falha }
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › só vale para a lista lida inteira
-if (situacao === 'carregando') return 'Esperando você, carregando'
+if (situacao === 'carregando') return 'Esperando você, nada'
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › só vale para a lista lida inteira
-if (situacao === 'erro') return 'Esperando você, não carregou'
+if (situacao === 'erro') return 'Esperando você, nada'
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › só vale para a lista lida inteira
-if (situacao === 'parcial') return 'Esperando você, parte não carregou'
+if (situacao === 'parcial') return 'Esperando você, nada'
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › diz quantos esperam
-if (itens > 0) return `Esperando você, ${String(itens)}`
+if (itens > 100) return `Esperando você, ${String(itens)}`
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › muda só a consulta
-const endereco = `${caminho}?${busca}`
+const endereco = caminho
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › ir a um item fecha a lista
-if (abertoEm !== null && abertoEm !== endereco) definirAbertoEm(null)
+if (false) definirAbertoEm(null)
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › traz os grupos
-const urgentes = itens.filter((item) => item.urgente)
+const urgentes = itens.filter((item) => !item.urgente)
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › traz os grupos
-{situacao === 'pronta' && itens.length === 0 && (
+{situacao === 'pronta' && (
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › lista parcial mostra
-{situacao === 'pronta' && itens.length === 0 && (
+{itens.length === 0 && (
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › com itens e parte sem ler
-{(situacao === 'pronta' || situacao === 'parcial') && (
+{situacao === 'pronta' && (
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › lista parcial mostra
-{situacao === 'parcial' && (
+{situacao === 'parcial' && itens.length > 0 && (
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › Atualizado às
-{atualizadoEm === undefined ? '' : `Atualizado às ${HORA.format(atualizadoEm)}`}
+{''}
```

```mutacao
arquivo: apps/web/src/componentes/CascaDaEscola.tsx
teste: apps/web/src/componentes/CascaDaEscola.test.tsx › a âncora do sino
-{faixa !== 'estreita' && <div ref={definirAncora} data-ancora-do-sino="" className="-mb-2 flex justify-end empty:hidden" />}
+{<div ref={definirAncora} data-ancora-do-sino="" className="-mb-2 flex justify-end empty:hidden" />}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › a fila inteira em erro
-const reler = (consulta: { readonly queryKey: readonly unknown[] }): Promise<unknown> => cliente.refetchQueries({ queryKey: consulta.queryKey, exact: true })
+const reler = (consulta: { readonly queryKey: readonly unknown[] }): Promise<unknown> => cliente.refetchQueries({ queryKey: consulta.queryKey.slice(0, 1) })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts › o incidente confirmado
-if (semProfessor.length === 0) return []
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › sem ano em curso
-return lida(anos)?.find((ano) => ano.situacao === 'em_curso')
+return lida(anos)?.find(() => true)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › sem ano em curso
-if (!aplica) return { estado: 'nao-se-aplica' }
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › com a fila parcial
-if (consulta.isError) return { estado: 'erro', erro: consulta.error }
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › a leitura dos incidentes que falha
-? { estado: 'erro', erro: incidentes.error }
+? { estado: 'carregando' }
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › é a hora em que a fila terminou
-if (atualizadoEm === undefined && fila.situacao !== 'carregando') definirAtualizadoEm(new Date())
-if (atualizadoEm !== undefined && fila.situacao === 'carregando') definirAtualizadoEm(undefined)
+if (atualizadoEm === undefined) definirAtualizadoEm(new Date())
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › a sessão que troca esvazia a fila
-if (atualizadoEm !== undefined && fila.situacao === 'carregando') definirAtualizadoEm(undefined)
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › relê as cinco leituras
 definirAtualizando(false)
-definirAtualizadoEm(new Date())
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts › uma turma sem professor diz no singular
-titulo: semProfessor.length === 1 ? 'Uma turma sem professor' : 'Turmas sem professor',
+titulo: 'Turmas sem professor',
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
teste: apps/web/src/areas/coordenacao/fila-da-coordenacao.test.ts › nada do que o professor faz
-id: `contestacao-${vinculo.id}`,
+id: `contestacao-${vinculo.usuarioId}-${vinculo.turma.id}`,
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › só aparece o grupo que tem item
-if (itens.length === 0) return null
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › traz os grupos
-const daEscola = itens.filter((item) => !item.urgente)
+const daEscola = itens
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › lendo
-{situacao === 'carregando' && <EstadoCarregando rotulo="Carregando o que espera você…" />}
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › o erro tem
-{situacao === 'erro' && <EstadoErro erro={erro} aoTentarDeNovo={aoTentarDeNovo} tentando={tentandoDeNovo} />}
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › clique duplo
-<Botao variante="secundario" disabled={atualizando} onClick={aoAtualizar}>
+<Botao variante="secundario" disabled={false} onClick={aoAtualizar}>
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › clique duplo
-<Botao variante="secundario" disabled={tentandoDeNovo} onClick={aoTentarDeNovo}>
+<Botao variante="secundario" disabled={false} onClick={aoTentarDeNovo}>
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral 3ª, test-engineer 3ª | `sino-por-area.test.tsx`: a espera de 300 ms depende de o teste de controle já ter carregado o `lazy()` do sino; carregar o código no `beforeAll` | `TODO.md` |
| revisor-geral 3ª | ajuste de uma linha na `techspec.md` §7c (sino descrito duas vezes na célula de carga) | `TODO.md`, na próxima edição da Tech Spec |
| test-engineer 3ª | anotar no `1_task.md` por que o clique duplo de "Tentar de novo" usa a lista truncada | recusada: o motivo já está no comentário do teste |
| test-engineer 1ª | `Sino.tsx` em `carregando` com itens já lidos: botão diz "Esperando você, N" e a lista só "Carregando…" | `TODO.md` (muda comportamento) |
| test-engineer 1ª | `Sino.test.tsx:69` regex sobre `className` fraca | recusada: o e2e cobre pelo estilo calculado |
| privacy-guardian 1ª | filtro `?papel=professor` em `GET /v1/vinculos` e consulta própria do sino | `TODO.md` (muda a API; fora de `apps/web`) |
| frontend-reviewer 1ª | trocar de faixa de largura remonta o sino e fecha a lista | `TODO.md` (X-spec da casca) |
| frontend-reviewer 1ª, revisor-geral 1ª | `?painel=falta`, `?situacao=sem-professor`, `?professor=`, `?material=` ainda sem leitor nas telas | tarefa 3.0 (Lugares) e as da Escola; registrar nelas |
| frontend-reviewer 1ª, conformidade 1ª | vitrine cheia sem item: semear convite vencido/contestação para fotografar lista cheia, parcial, erro | `/validar` |

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
| 2026-10-16 08:46:55 | 2026-10-16 08:47:48 | `conformidade-reviewer` | 1 | APROVADO | a4933b8dda8335c51 |
| 2026-10-16 08:46:52 | 2026-10-16 08:47:53 | `infra-guardian` | 1 | APROVADO | a29d53ccb30297955 |
| 2026-10-16 08:47:00 | 2026-10-16 08:48:51 | `revisor-geral` | 1 | REPROVADO | a01b1d8181ba03a0d |
| 2026-10-16 08:46:48 | 2026-10-16 08:48:52 | `privacy-guardian` | 1 | APROVADO | a21b60799dcc54800 |
| 2026-10-16 08:46:44 | 2026-10-16 08:49:05 | `frontend-reviewer` | 1 | APROVADO | ad0f1bafc9fe8db51 |
| 2026-10-16 08:46:58 | 2026-10-16 08:50:18 | `test-engineer` | 1 | REPROVADO | a20be97d20d1ffb64 |
| 2026-10-16 09:04:31 | 2026-10-16 09:04:58 | `infra-guardian` | 2 | APROVADO | a468053ab7ee90d74 |
| 2026-10-16 09:04:28 | 2026-10-16 09:05:04 | `privacy-guardian` | 2 | APROVADO | a4f8e22a5fa0b4d90 |
| 2026-10-16 09:04:26 | 2026-10-16 09:05:05 | `frontend-reviewer` | 2 | APROVADO | ae71db0f6eb4e06f6 |
| 2026-10-16 09:04:34 | 2026-10-16 09:05:12 | `conformidade-reviewer` | 2 | APROVADO | ac889e150c0f02899 |
| 2026-10-16 09:04:42 | 2026-10-16 09:05:30 | `revisor-geral` | 2 | APROVADO | a29d1c2149219b2f5 |
| 2026-10-16 09:04:38 | 2026-10-16 09:07:47 | `test-engineer` | 2 | REPROVADO | ab1317012e3243dcb |
| 2026-10-16 09:17:26 | 2026-10-16 09:17:59 | `revisor-geral` | 3 | APROVADO | a818c1989a0c9bc4c |
| 2026-10-16 09:17:22 | 2026-10-16 09:18:57 | `test-engineer` | 3 | APROVADO | a32f42ae39e71dedc |
