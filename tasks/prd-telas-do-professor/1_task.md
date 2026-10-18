# Tarefa 1.0 — O sino mostra à professora o que espera por ela

**Funcionalidade:** telas-do-professor · **Depende de:** nenhuma (a X1 pousada)
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`, `infra-guardian`, `tenancy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Toda tela do professor ganha o sino "Esperando você", que lista o que espera decisão dela e leva à tela de cada
item.

## Contexto necessário

- `techspec.md` seções 5 ("A fila do professor", "Montagem"), 7, 7c e 12; `prd.md` RF3, RF4 e RF5
- Regras 20, 50 (itens 2a, 5, 11) e 80 (item 3); D59; `mockup.md` 13.1, só pela forma
- Código: `apps/web/src/componentes/CascaDaEscola.tsx` (linhas 261 a 265, o contador de "Seu time");
  `api/entregas.ts`; `areas/professor/entregas.ts` (`esperandoVoce`); `api/pedidos.ts`

## Subtarefas

- [x] 1.1 — **A peça.** Procure o sino da X2 (`grep -rn "Esperando você" apps/web/src/componentes`) e, existindo,
  use-o sem mudar props. Senão, crie `componentes/sino/Sino.tsx`: botão de 44 px com o `Contador` e nome acessível
  "Esperando você, N" ou "Esperando você, nada"; lista de 400 px (altura cheia abaixo de 768 px), em grupos, com
  linha inteira clicável; Esc e clique fora fecham e devolvem o foco. Props: os itens, o estado da leitura
  (`carregando`, `pronta`, `erro`, `parcial`), "tentar de novo" e o pé
- [x] 1.2 — `fila-do-professor.ts`: `filaDoProfessor`, pura (seção 5). `esperandoVoce` e os testes dela mudam para cá
- [x] 1.3 — `consultaContagemDePedidos(turmaId)`, em `api/pedidos.ts`: a mesma rota, guardando só `{ quantidade,
  haMais }`, com a chave `['pedidos-da-turma', 'contagem', turmaId]`, distinta da lista nominal
  (`[...CHAVE_DOS_PEDIDOS, turmaId, quem]`); `aplicarDecisao` a invalida por chave exata. Leituras em série, as 12
  primeiras turmas em ordem de nome, parando na primeira recusa por limite. Turma além do teto e turmas não lidas após
  a recusa marcam a fila `parcial`, e o sino diz o que não leu; nunca "Tudo em dia". Nenhum item leva nome de aluno
- [x] 1.3a — A releitura, como na X2 (`prd-telas-da-coordenacao/techspec.md` §5 e §7c): os observadores de `entregas`,
  `meus-vinculos` e da contagem com `staleTime` de 5 min, `refetchInterval: false`, `refetchOnWindowFocus: false` e
  `refetchOnReconnect: false`. O sino lê ao entrar na área e quando uma decisão invalida a chave. "Atualizar" e "Tentar
  de novo" releem só por chave exata, nunca por prefixo. Sem ano letivo em curso, o sino não chama turmas nem vínculos
  e diz isso; vínculo de ano encerrado não vira "Confirme sua turma"
- [x] 1.4 — `SinoDoProfessor.tsx` e o mapa `sino-do-papel.ts`, com `lazy()`; a casca desenha o sino no canto de
  cima à direita e, abaixo de 768 px, na barra de topo. A seção da galeria
- [x] 1.5 — Testes

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/sino/` | novo: a peça (ou a da X2), a fila, o mapa, o sino do professor e os testes |
| `apps/web/src/componentes/CascaDaEscola.tsx`, `apps/web/src/areas/professor/Home.tsx` | alterado |
| `apps/web/src/api/pedidos.ts`, `apps/web/src/api/pedidos.test.ts` | alterado |
| `apps/web/src/areas/professor/entregas.ts`, `apps/web/src/areas/professor/entregas.test.ts` | alterado |
| `apps/web/src/galeria/secoes/sino.tsx`, `e2e/professor-sino.spec.ts`, `e2e/__fixtures__/professor/sino.ts` | novo |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| a conta, tipo a tipo | unidade | o destino de cada tipo; o contestado não conta; duas disciplinas na mesma turma, um item; "100 ou mais" |
| sem nome no cache | componente | a rede falsa devolve nomes conhecidos. (a) Só o sino montado: o `JSON.stringify` do cache inteiro não contém nenhum nome. (b) Sino e `ListaDePedidos` montados juntos: existe a consulta `['pedidos-da-turma','contagem',turmaId]`, o dado dela é exatamente `{quantidade, haMais}` e a chave é diferente da da lista (filtrar só pelo prefixo `contagem` não basta). Mutação: guardar a lista inteira na contagem deixa os dois vermelhos |
| a chave da decisão | unidade | `aplicarDecisao` invalida `['pedidos-da-turma','contagem',turmaId]` por chave exata, e só com `quem === 'professor'`. Mutação: invalidar por prefixo |
| estados | componente | carregando; "Tudo em dia" só com tudo lido; erro; leitura parcial diz o que faltou; Esc devolve o foco |
| não insiste | componente | dois tempos, só o sino montado. (a) 5 minutos de relógio falso sem chamada nova; abrir a lista não lê. Mutação: tirar `refetchInterval: false`. (b) Além do `staleTime`, com o dado velho, `focusManager.setFocused(false)` e depois `(true)`, e `onlineManager.setOnline(false)` e depois `(true)`: zero chamadas. Um `focus` solto na janela não relê, e o teste passaria sem a opção; por isso o caso de controle prova que a mesma consulta, com a opção ligada, relê. O `afterEach` restaura os dois gerenciadores. Mutação: tirar `refetchOnWindowFocus: false` ou `refetchOnReconnect: false` |
| "Atualizar" e "Tentar de novo" por chave exata | componente | sino sobre a lista de Pedidos, fila `parcial` e depois `erro`: o clique relê só as chaves do sino e faz zero chamadas à lista nominal. Mutação: trocar a chave exata por invalidação de prefixo deixa o teste vermelho |
| mais de 12 turmas | componente | 14 turmas dão 12 leituras, em série, em ordem de nome; a fila fica `parcial`, o sino diz o que não leu e nunca mostra "Tudo em dia". O fixture tem zero itens nas 12 turmas lidas, sem entrega e sem vínculo pendente: "Tudo em dia" está ausente do DOM e o aviso do que não foi lido está presente. Mutação: tirar a marca `parcial` da turma além do teto |
| sem ano letivo em curso | componente | zero chamadas a turmas e vínculos; o sino diz que não há ano letivo em curso e não mostra "Tudo em dia". Mutação: chamar turmas sem ano em curso |
| vínculo de ano encerrado | unidade | `filaDoProfessor` não gera item "Confirme sua turma" para vínculo `pendente` de ano encerrado. Mutação: ignorar o ano do vínculo |
| recusa por limite | componente | a 3ª leitura recebe 429: nada sai da 4ª à 12ª, os itens já lidos aparecem, o sino diz que não leu tudo e não mostra "Tudo em dia"; a primeira resposta segurada prova a série. Mutação: tirar a parada na primeira recusa |
| duas disciplinas na mesma turma | componente | uma leitura só de pedidos por turma |
| permissão | unidade e e2e | unidade: o aluno não tem sino e a coordenação não recebe `SinoDoProfessor`. e2e: a coordenação entra na mesma aba depois da professora, sem chamadas a `/v1/entregas`, `/v1/vinculos/meus` e `/reivindicacoes`, e sem itens dela |
| entrega decidida em outra aba | e2e | dois contextos: decide em B; em A o item segue no sino até a tentativa; a tela diz "já estava decidida" (`ENTREGA_JA_DECIDIDA`) e o item sai sem recarregar |
| um item de cada tipo | e2e | os quatro destinos; decidir tira o item; o contador tem `animationName` `none` |
| recomeço | e2e | troca de escola e segunda pessoa não veem o sino anterior: A com itens e B com zero ou outros, sem os itens nem o número de A; a contagem atrasada (`page.route`) não entra |
| 360 px e axe | e2e | nada rola de lado; sem violação grave |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx › professor: a lista é lida ao abrir…`
  (`prepararTela`, `redeFalsa`, `segurar`)
- e2e: a cena de `e2e/professor-assistente.spec.ts` (`entrar`) e a linha 123 dele (contador sem animação); a
  troca, `e2e/troca-de-escola.spec.ts › depois da troca para B…`
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/sino`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-sino.spec.ts`
- Armadilha: a casca só importa o mapa (`apps/web/nome-dos-chunks.test.ts`)
- Telas: `professora`, `/professor/nova-conversa`, `--clicar 'role=button[name=/Esperando você/]'`. Mockup:
  `/professor?sino=1`

## Fora do escopo desta tarefa

Tirar "Seu time" e o pé do sino (2.0); o Início (3.0); sinal do Tutor no sino (F10); o sino da coordenação (X2).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| Não existe `sino-do-papel.ts`: cada área monta o sino dela (`SinoDoProfessor` por `lazy()` acima do `Switch`, desenhado por `createPortal` na âncora da casca), como a X2 fez com `SinoDaCoordenacao` | a X2 pousou sem o mapa, e a regra da casca é não importar nada de nenhuma área; um mapa por papel seria a única exceção | `techspec.md` §5 "Montagem" e §2 (reescritos) |
| A peça da X2 ganha `grupo` no item e as props opcionais `textoDoVazio`, `avisoDaLeituraParcial` e `faltaPara` (agora opcional), sem mudar o que ela já tinha | a peça não agrupava por turma, o vazio e o aviso eram da coordenação, e "Ver o que falta para a escola" não existe para a professora; a subtarefa 1.1 mandava "usar sem mudar props", e nenhuma prop existente mudou | `techspec.md` §12, 1ª premissa (marcada `✅ VERIFICADO na 1.0`) e §5 "Montagem" |
| `LeituraDaFila`, `SEM_LEITURA_SOZINHA` e `LEITURA_DA_FILA` saem de `areas/coordenacao/fila-da-coordenacao.ts` para `componentes/sino/leitura-do-sino.ts` (a coordenação as reexporta) | o sino do professor tem de usar as mesmas opções de leitura, e uma área não importa módulo de outra (`areas/navegacao.ts`, item 5); copiar daria dois lugares para esquecer uma delas (regra 80) | `techspec.md` §5 "Montagem" |
| "Sem ano letivo em curso" é lido da resposta `NAO_ENCONTRADO` de `meus-vinculos`, e não de uma leitura do ano | a professora não lê `/v1/anos-letivos` (só a coordenação), e a API responde como inexistente quando não há ano em curso (`exigirAnoEmCurso`) | `techspec.md` §5 "Montagem" |
| A consulta da contagem tem `gcTime: 0` | a chave leva o id da turma, e a consulta que sobra depois da troca de escola deixa no cache da aba o id de uma turma de outra escola (o e2e de recomeço a apanhou) | `techspec.md` §5 "Montagem" |
| "Vínculo de ano encerrado" é testado pelo vínculo de estado `encerrado`, e não por "ignorar o ano do vínculo" | `Vinculo` (`meus-vinculos`) não traz o ano letivo: a API só devolve os do ano em curso, e o de ano que acabou chega `encerrado`; só `pendente` vira "Confirme sua turma" | `tasks/prd-telas-do-professor/1_task.md`, tabela de testes (linha "vínculo de ano encerrado") |
| `?aba=alunos` no destino dos pedidos já está no item, mas a turma só lê `?aba=` a partir da 10.0: hoje o item leva à turma, na aba de sempre | a leitura do parâmetro é a subtarefa 10.1 | `techspec.md` §5 "Abas no endereço" |
| A contagem de pedidos que já respondeu fica desligada (`enabled: false`), e a série recomeça quando muda o conjunto de turmas | o `resetQueries` da troca de sessão e o `invalidateQueries` da volta da API (`main.tsx`) relêem as consultas ligadas todas juntas, sem a série e sem a parada no limite; desligada, a invalidação global não relê a contagem, e quem a relê é o clique (`fetchQuery`, em série) e a decisão de um pedido | `techspec.md` §5, "A série vale em toda leitura que não vem de um clique" |
| `invalidarAContagem` (`api/pedidos.ts`) invalida sem reler (`refetchType: 'none'`) e, com o sino olhando, relê a da turma por `fetchQuery` | a contagem lida está desligada, e a invalidação só relê consulta ligada; sem a releitura, o item não sairia do sino depois da decisão | `techspec.md` §5, "A série vale em toda leitura que não vem de um clique" |
| `refetchInterval: false` é provado pelo teste do sino da coordenação (material processando), e não pelo do professor | nenhuma consulta da fila do professor tem intervalo próprio, então tirar a opção não muda nada na leitura dela; a constante é a mesma das duas áreas (`leitura-do-sino.ts`) | `techspec.md` §5 (fila) |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta. O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

A seleção do vínculo (o que só `pendente` vira) e a de turma confirmada têm cada uma o seu bloco, e a leitura em série (o recomeço com
o conjunto de turmas e a contagem lida desligada) tem os seus.

```mutacao
arquivo: apps/web/src/api/pedidos.ts
teste: apps/web/src/api/pedidos.test.ts › decidir como professor invalida a contagem
-void cliente.invalidateQueries({ queryKey: consulta.queryKey, exact: true, refetchType: 'none' })
+void cliente.invalidateQueries({ queryKey: ['pedidos-da-turma'], refetchType: 'none' })
```

```mutacao
arquivo: apps/web/src/api/pedidos.ts
teste: apps/web/src/api/pedidos.test.ts › a coordenação não tem contagem
-if (quem !== 'professor') return
 const consulta = consultaContagemDePedidos(turmaId)
```

```mutacao
arquivo: apps/web/src/api/pedidos.ts
teste: apps/web/src/api/pedidos.test.ts › decidir como professor invalida a contagem
 void cliente.invalidateQueries({ queryKey })
-invalidarAContagem(cliente, turmaId, quem)
```

```mutacao
arquivo: apps/web/src/api/pedidos.ts
teste: apps/web/src/api/pedidos.test.ts › a decisão que falha no meio do lote
-invalidarAContagem(cliente, turmaId, quem)
 if (quem === 'professor') await cliente.invalidateQueries({ queryKey })
```

```mutacao
arquivo: apps/web/src/api/pedidos.ts
teste: apps/web/src/api/pedidos.test.ts › sem ninguém olhando
 return { quantidade: lista.itens.length, haMais: lista.proxima !== undefined }
 },
-gcTime: 0,
 })
```

```mutacao
arquivo: apps/web/src/api/pedidos.ts
teste: apps/web/src/api/pedidos.test.ts › lê a mesma rota da lista
-return { quantidade: lista.itens.length, haMais: lista.proxima !== undefined }
+return { ...lista, quantidade: lista.itens.length, haMais: lista.proxima !== undefined }
```

```mutacao
arquivo: apps/web/src/api/pedidos.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › só o sino montado
-return { quantidade: lista.itens.length, haMais: lista.proxima !== undefined }
+return { ...lista, quantidade: lista.itens.length, haMais: lista.proxima !== undefined }
```

```mutacao
arquivo: apps/web/src/api/pedidos.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › sino e ListaDePedidos juntos
-return { quantidade: lista.itens.length, haMais: lista.proxima !== undefined }
+return { ...lista, quantidade: lista.itens.length, haMais: lista.proxima !== undefined }
```

```mutacao
arquivo: apps/web/src/componentes/sino/leitura-do-sino.ts
teste: apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx › com um material processando
-export const SEM_LEITURA_SOZINHA = { staleTime: 5 * 60_000, refetchInterval: false, refetchOnWindowFocus: false, refetchOnReconnect: false } as const
+export const SEM_LEITURA_SOZINHA = { staleTime: 5 * 60_000, refetchOnWindowFocus: false, refetchOnReconnect: false } as const
```

```mutacao
arquivo: apps/web/src/componentes/sino/leitura-do-sino.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › o foco sai e volta
-export const SEM_LEITURA_SOZINHA = { staleTime: 5 * 60_000, refetchInterval: false, refetchOnWindowFocus: false, refetchOnReconnect: false } as const
+export const SEM_LEITURA_SOZINHA = { staleTime: 5 * 60_000, refetchInterval: false, refetchOnReconnect: false } as const
```

```mutacao
arquivo: apps/web/src/componentes/sino/leitura-do-sino.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › a rede sai e volta
-export const SEM_LEITURA_SOZINHA = { staleTime: 5 * 60_000, refetchInterval: false, refetchOnWindowFocus: false, refetchOnReconnect: false } as const
+export const SEM_LEITURA_SOZINHA = { staleTime: 5 * 60_000, refetchInterval: false, refetchOnWindowFocus: false } as const
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › "Atualizar": uma leitura a mais
-await cliente.fetchQuery({ ...consulta, staleTime: 0 }).catch(() => undefined)
+await cliente.refetchQueries({ queryKey: ['pedidos-da-turma'] })
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › "Tentar de novo": relê só o que falhou
-const turmasComFalha = emLeitura.filter((_, indice) => leiturasDasTurmas[indice]?.isError === true).map((turma) => turma.turmaId)
+const turmasComFalha = emLeitura.map((turma) => turma.turmaId)
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › "Tentar de novo": relê só o que falhou
-const entregasAReler = consultaDeEntregas.isError || (entregas.estado === 'lida' && !entregas.completa)
+const entregasAReler = true
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › a 3ª leitura recusada por limite
-if (!recusada && liberadas < turmasAoLer.length && leiturasDasTurmas.every((leitura) => leitura.status !== 'pending'))
+if (liberadas < turmasAoLer.length && leiturasDasTurmas.every((leitura) => leitura.status !== 'pending'))
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › a segunda turma recusada por limite na releitura
-if (estado?.status === 'error' && foiRecusadaPorLimite(estado.error)) return
+if (estado?.status === 'error' && !foiRecusadaPorLimite(estado.error)) return
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › a 3ª leitura recusada por limite
-if (serie.conjunto !== conjuntoDeTurmas) definirSerie({ conjunto: conjuntoDeTurmas, liberadas: 1 })
+if (serie.conjunto !== conjuntoDeTurmas) definirSerie({ conjunto: conjuntoDeTurmas, liberadas: TETO_DE_TURMAS_LIDAS })
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › 14 turmas dão 12 leituras
-const turmasAoLer = turmasConfirmadas(lida(vinculos) ?? []).slice(0, TETO_DE_TURMAS_LIDAS)
+const turmasAoLer = turmasConfirmadas(lida(vinculos) ?? [])
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › além do teto de turmas
-const alemDoTeto = turmas.slice(TETO_DE_TURMAS_LIDAS)
+const alemDoTeto: typeof turmas = []
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › 14 turmas dão 12 leituras
-const alemDoTeto = turmas.slice(TETO_DE_TURMAS_LIDAS)
+const alemDoTeto: typeof turmas = []
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › sem ano letivo em curso
-return leitura.estado === 'erro' && leitura.erro instanceof ErroDaApi && leitura.erro.codigo === CodigoDeErro.NAO_ENCONTRADO
+return false
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › sem ano letivo em curso
-return leitura.estado === 'erro' && leitura.erro instanceof ErroDaApi && leitura.erro.codigo === CodigoDeErro.NAO_ENCONTRADO
+return false
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › o vínculo contestado espera a coordenação
-.filter((vinculo) => vinculo.estado === 'pendente')
+.filter((vinculo) => vinculo.estado !== 'confirmado')
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › a turma confirmada sai em ordem de nome
-for (const vinculo of vinculos) if (vinculo.estado === 'confirmado' && !porId.has(vinculo.turma.id)) porId.set(vinculo.turma.id, vinculo.turma.nome)
+for (const vinculo of vinculos) if (!porId.has(vinculo.turma.id)) porId.set(vinculo.turma.id, vinculo.turma.nome)
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › duas disciplinas na mesma turma
-for (const vinculo of vinculos) if (vinculo.estado === 'confirmado' && !porId.has(vinculo.turma.id)) porId.set(vinculo.turma.id, vinculo.turma.nome)
+for (const vinculo of vinculos) if (vinculo.estado === 'confirmado') porId.set(`${vinculo.turma.id}:${vinculo.disciplina?.id ?? ''}`, vinculo.turma.nome)
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › página cheia
-if (haMais) return { detalhe: `${String(quantidade)} ou mais pedidos esperando a decisão`, oQueConta: 'ou mais pedidos de nome' }

```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › a correção leva à tela de revisar
-para: entrega.atividadeAplicadaId === null ? ROTAS_DO_PROFESSOR.timeDoAssistente : caminhoDaCorrecaoDoProfessor(entrega.atividadeAplicadaId),
+para: caminhoDaCorrecaoDoProfessor(entrega.atividadeAplicadaId ?? ''),
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › o item com `grupo`
-const titulo = item.grupo ?? GRUPO_DA_ESCOLA
+const titulo = GRUPO_DA_ESCOLA
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › o vazio da professora
-{faltaPara !== undefined && (
+{(
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › o vazio da professora
-<p className="t-apoio max-w-prose text-apoio">{textoDoVazio}</p>
+<p className="t-apoio max-w-prose text-apoio">{VAZIO_PADRAO}</p>
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: apps/web/src/componentes/sino/Sino.test.tsx › o aviso da leitura parcial
-{avisoDaLeituraParcial}
+{AVISO_PARCIAL_PADRAO}
```

```mutacao
arquivo: apps/web/src/areas/professor/SinoDoProfessor.tsx
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › sem ano letivo em curso
-if (semAnoLetivo) return AVISO_SEM_ANO_LETIVO

```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › troca de escola com o sino montado
-const liberadas = serie.conjunto === conjuntoDeTurmas ? serie.liberadas : 1
-if (serie.conjunto !== conjuntoDeTurmas) definirSerie({ conjunto: conjuntoDeTurmas, liberadas: 1 })
+const liberadas = serie.liberadas
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › as contagens já lidas não saem juntas
-return { ...consulta, ...LEITURA_DA_FILA, enabled: estado === undefined || estado.status === 'pending' }
+return { ...consulta, ...LEITURA_DA_FILA, enabled: true }
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › "Atualizar": uma leitura a mais
-await cliente.fetchQuery({ ...consulta, staleTime: 0 }).catch(() => undefined)
+await reler(consulta)
```

```mutacao
arquivo: apps/web/src/api/pedidos.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › decidir um pedido relê a contagem
-if ((cliente.getQueryCache().find({ queryKey: consulta.queryKey, exact: true })?.getObserversCount() ?? 0) > 0) void cliente.fetchQuery(consulta).catch(() => undefined)
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › "Tentar de novo": relê só o que falhou
-const vinculosAReler = consultaDeVinculos.isError || consultaDeVinculos.hasNextPage
+const vinculosAReler = true
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › a hora da leitura anterior não fica na tela
-if (atualizadoEm !== undefined && fila.situacao === 'carregando') definirAtualizadoEm(undefined)
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › a turma confirmada sai em ordem de nome
-return [...porId].map(([turmaId, nome]) => ({ turmaId, nome })).sort((a, b) => porNome(a.nome, b.nome))
+return [...porId].map(([turmaId, nome]) => ({ turmaId, nome }))
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › a versão adaptada leva ao Assistente, e a decidida não conta
 return entregas
-.filter((entrega) => entrega.estado === 'pendente')
 .sort((a, b) => a.criadaEm.localeCompare(b.criadaEm))
 .map((entrega) => {
 const grupo = nomes[entrega.turmaId] ?? GRUPO_DA_TURMA_SEM_NOME
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › dentro da turma e do tipo, a entrega mais antiga vem primeiro
 .filter((entrega) => entrega.estado === 'pendente')
-.sort((a, b) => a.criadaEm.localeCompare(b.criadaEm))
 .map((entrega) => {
 const grupo = nomes[entrega.turmaId] ?? GRUPO_DA_TURMA_SEM_NOME
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › um pedido fala no singular, e turma sem pedido não vira item
-if (leitura.estado !== 'lida' || leitura.dado.quantidade === 0) continue
+if (leitura.estado !== 'lida') continue
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › a entrega de turma que os vínculos não trazem
-const grupoDoItem = (item: ItemDaFilaDoProfessor) => (item.grupo === GRUPO_DA_TURMA_SEM_NOME ? '￿' : item.grupo)
+const grupoDoItem = (item: ItemDaFilaDoProfessor) => item.grupo
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › agrupa por turma em ordem de nome
-itens.sort((a, b) => porNome(grupoDoItem(a), grupoDoItem(b)) || TIPOS_DA_FILA_DO_PROFESSOR.indexOf(a.tipo) - TIPOS_DA_FILA_DO_PROFESSOR.indexOf(b.tipo))
+itens.sort((a, b) => porNome(grupoDoItem(a), grupoDoItem(b)))
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › agrupa por turma em ordem de nome
-itens.sort((a, b) => porNome(grupoDoItem(a), grupoDoItem(b)) || TIPOS_DA_FILA_DO_PROFESSOR.indexOf(a.tipo) - TIPOS_DA_FILA_DO_PROFESSOR.indexOf(b.tipo))
+itens.sort((a, b) => TIPOS_DA_FILA_DO_PROFESSOR.indexOf(a.tipo) - TIPOS_DA_FILA_DO_PROFESSOR.indexOf(b.tipo))
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › tudo lido e nada esperando é pronta
-if (lendo) return { itens, situacao: 'carregando', naoLeu: [], semAnoLetivo: false }
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › tudo lido e nada esperando é pronta
-const lendo = entregas.estado === 'carregando' || vinculos.estado === 'carregando' || leituras.some(({ leitura }) => leitura.estado === 'carregando')
+const lendo = entregas.estado === 'carregando' || vinculos.estado === 'carregando'
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › sem ano letivo em curso a fila é parcial
-if (semAnoLetivo) return { itens, situacao: 'parcial', naoLeu: [], semAnoLetivo: true }
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › entregas e vínculos que falharam juntos são erro
-if (entregas.estado === 'erro' && vinculos.estado === 'erro') return
+if (entregas.estado === 'erro' || vinculos.estado === 'erro') return
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › as entregas que não vieram deixam a fila parcial
-if (entregas.estado === 'erro') naoLeu.push('as correções e as versões adaptadas')
+if (entregas.estado === 'erro' && false) naoLeu.push('as correções e as versões adaptadas')
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › as entregas que não vieram deixam a fila parcial
-else if (entregas.estado === 'lida' && !entregas.completa) naoLeu.push('parte das correções e das versões adaptadas')
+else if (entregas.estado === 'lida' && false) naoLeu.push('parte das correções e das versões adaptadas')
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › os vínculos que não vieram
-if (vinculos.estado === 'erro') naoLeu.push('as suas turmas')
+if (vinculos.estado === 'erro' && false) naoLeu.push('as suas turmas')
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › os vínculos que não vieram
-else if (vinculos.estado === 'lida' && !vinculos.completa) naoLeu.push('parte das suas turmas')
+else if (vinculos.estado === 'lida' && false) naoLeu.push('parte das suas turmas')
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/fila-do-professor.test.ts › a turma cuja contagem falhou ou não foi lida
-const semLeitura = leituras.filter(({ leitura }) => leitura.estado !== 'lida').length + alemDoTeto.length
+const semLeitura = alemDoTeto.length
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › invalidação global com turmas novas
-if (!recusada && liberadas < turmasAoLer.length && leiturasDasTurmas.every((leitura) => leitura.status !== 'pending'))
+if (liberadas < turmasAoLer.length && leiturasDasTurmas.every((leitura) => leitura.status !== 'pending'))
```

```mutacao
arquivo: apps/web/src/api/pedidos.ts
teste: apps/web/src/api/pedidos.test.ts › decidir sem o sino olhando não lê a contagem
-if ((cliente.getQueryCache().find({ queryKey: consulta.queryKey, exact: true })?.getObserversCount() ?? 0) > 0) void cliente.fetchQuery(consulta).catch(() => undefined)
+if ((cliente.getQueryCache().find({ queryKey: consulta.queryKey, exact: true })?.getObserversCount() ?? 0) >= 0) void cliente.fetchQuery(consulta).catch(() => undefined)
```

```mutacao
arquivo: apps/web/src/api/pedidos.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › decidir na 13ª turma
-if ((cliente.getQueryCache().find({ queryKey: consulta.queryKey, exact: true })?.getObserversCount() ?? 0) > 0) void cliente.fetchQuery(consulta).catch(() => undefined)
+if ((cliente.getQueryCache().find({ queryKey: consulta.queryKey, exact: true })?.getObserversCount() ?? 0) >= 0) void cliente.fetchQuery(consulta).catch(() => undefined)
```

```mutacao
arquivo: apps/web/src/areas/professor/fila-do-professor.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › "Atualizar": uma leitura a mais
-await cliente.fetchQuery({ ...consulta, staleTime: 0 }).catch(() => undefined)
+await cliente.fetchQuery(consulta).catch(() => undefined)
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | "Correção para revisar" e "Versão adaptada para decidir" não dizem que vieram do Assistente: considerar uma marca curta, como "Assistente de ensino", no `detalhe` ou no rótulo do grupo (regra 70, item 4a) | `TODO.md`: muda texto de tela e a forma do item, que é decisão do Arquiteto; a revisão da 2.0, que mexe em "Seu time", é onde olhar |
| frontend-reviewer (1ª) | `CascaDaEscola.tsx:322`: no celular o sino ocupa espaço da barra e o nome da escola fica "Colég…"; se quiser, mostrar só o ícone do sino abaixo de 400 px | `TODO.md`: o `truncate` é o padrão da X1 e da X2, a coordenação tem o mesmo comportamento e o arquivo não é tocado pela tarefa |
| frontend-reviewer (1ª) | O sino do professor e o contador "1" de "Seu time" no Assistente de ensino se repetem no computador | Recusada: é esperado, a 2.0 tira o contador de "Seu time" (campo "Fora do escopo desta tarefa") |
| privacy-guardian (1ª) | `pedidos.ts:433` baixa a página nominal inteira só para contar; uma rota ou parâmetro só de contagem, em spec futura, tiraria isso de vez | `TODO.md`: exige rota nova na API, fora do escopo da tarefa (só web) |
| privacy-guardian (1ª) | O detalhe do item é `entrega.titulo`, texto que a professora escreve; depende do aviso `AVISO_DE_TEXTO_SEM_ALUNO` | Recusada: já aparecia no Início, não é exposição nova e o revisor não pediu mudança |
| privacy-guardian (1ª), infra-guardian (1ª) | Refazer as fotos do celular com a lista aberta | Não é do Implementador: a vitrine clica na largura do computador e só depois encolhe a tela (`tools/vitrine/foto.ts`, o laço de `TELAS`), e a âncora do sino troca de lugar. A Mesa refotografa pela rodada seguinte; a correção da vitrine vai para `TODO.md` |
| tenancy-guardian (1ª) | Depois do `resetQueries`, a contagem da turma de A ainda montada pode ser relida uma vez com o token de B antes de o observador sair; registrar no `/retro` se aparecer em outras filas | `/retro` da spec; a parte da série, que é do item 1, entrou na ordem (a contagem lida fica desligada, e o reset não a relê) |
| infra-guardian (1ª) | Incluir no cenário do teste de carga as até 14 leituras por professora que abre a casca (a conta de cerca de 28 por minuto contra o limite de 120 só existe no papel) | `TODO.md`: a mudança é no teste de carga de infra, fora dos arquivos da tarefa |
| revisor-geral (1ª) | A lista fecha quando a largura cruza 768 px (a âncora muda e o `Sino` remonta); vale registrar e fazer a vitrine clicar já na largura da foto | `TODO.md`, junto da correção da vitrine acima |
| revisor-geral (1ª) | O `Painel.tsx` importa `SEM_LEITURA_SOZINHA` pela reexportação de `fila-da-coordenacao.ts:169`; importar direto de `componentes/sino/leitura-do-sino.ts` tira a reexportação | `TODO.md`: o `Painel.tsx` é da coordenação e a tarefa não o toca |
| test-engineer (2ª) | `e2e/professor-sino.spec.ts`: a asserção `not.toHaveAccessibleName('Esperando você, 4')` repete o que o `esperarSino(page, 'Esperando você, nada')` já prova | Recusada: o revisor diz que não atrapalha e não pede mudança |
| frontend-reviewer (2ª) | A contagem lida fica desligada e só é relida por clique ou decisão; registrar no `/retro` se a professora que deixa a aba aberta por horas vê uma contagem velha | `/retro` da spec |
| frontend-reviewer (2ª) | Na escola vazia, o Início a 360 px não tem nenhum bloco abaixo do campo do Assistente; a spec de Início pode ganhar um convite a montar a primeira turma | `TODO.md`: é da 3.0 (o Início), fora desta tarefa |
| frontend-reviewer (2ª), infra-guardian (2ª) | A vitrine fotografa o celular com a lista fechada; uma opção para clicar depois de encolher a tela | `TODO.md`, junto da correção da vitrine já registrada |
| tenancy-guardian (2ª) | `fila-do-professor.ts` decide `enabled` lendo `cliente.getQueryState` durante a renderização; um comentário em `main.tsx` apontando a dependência do `resetQueries` | `TODO.md`: `main.tsx` não é tocado pela tarefa |
| privacy-guardian (2ª) | `pedidos.ts:131`: a releitura depois de uma decisão sai fora da série e da parada por limite; citar isso no comentário | `TODO.md`: comentário, e quem entra pelo item 1 já lê esse trecho |
| privacy-guardian (2ª) | Teste unitário do estado `serie.conjunto` recomeçando com o sino montado entre duas sessões | Recusada: o teste de troca de escola com `resetQueries` e o e2e de recomeço já a provam |
| infra-guardian (2ª) | Uma contagem que ainda estava sendo lida na hora do reset sai mais uma vez, com o token novo, e volta 404; dá para cancelar com `cancelQueries` antes do reset | `/retro` da spec (é no máximo uma leitura por troca de sessão) |
| infra-guardian (2ª) | Na volta da API, uma contagem que falhou por erro que não é 429 (503) deixa a fila parcial até "Atualizar" | `/validar`: é questão de experiência de uso |
| revisor-geral (2ª) | `fila-do-professor.ts:248-249`: o comentário ainda diz que "Atualizar" relê por `refetchQueries` com a chave exata; as contagens são relidas por `fetchQuery` em série | `TODO.md` |
| revisor-geral (2ª) | `fila-do-professor.ts:274`: decidir `enabled` lendo `getQueryState` na renderização depende de o `useQueries` renderizar de novo; uma linha dizendo isso, ou derivar o `enabled` do resultado anterior | `TODO.md` |
| test-engineer (3ª) | O teste "dois cliques em decidir" protege, na prática, a deduplicação do próprio TanStack Query; nenhuma linha nossa o deixa vermelho. Vale dizer isso num comentário | `TODO.md`: comentário de teste; o revisor aprovou sem pedir bloco |
| test-engineer (3ª) | O controle do teste de 14 turmas depende de a leitura da 13ª sair antes da releitura da 1ª pelo mesmo caminho assíncrono; o comentário do teste já diz isso | Recusada: já está dito no comentário do teste |
| revisor-geral (3ª) | `pedidos.test.ts`, teste "dois cliques em decidir…": o nome diz "uma releitura só", mas a asserção é `toHaveLength(2)`, que conta também a leitura inicial; escrever "leitura inicial + uma releitura" no nome ou numa variável | `TODO.md`: nome de teste |
| revisor-geral (3ª) | `pedidos.ts:125-129`: o comentário de quatro linhas sobre uma linha só de condição está no limite; pode ficar, sem crescer mais | Recusada: o revisor diz que explica um porquê que o código não mostra |

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
| 2026-10-17 23:16:59 | 2026-10-17 23:18:21 | `frontend-reviewer` | 1 | APROVADO | a4b57b75f8402047c |
| 2026-10-17 23:17:05 | 2026-10-17 23:18:26 | `privacy-guardian` | 1 | APROVADO | a3b82ffb0f484aecc |
| 2026-10-17 23:17:16 | 2026-10-17 23:18:36 | `tenancy-guardian` | 1 | APROVADO | a5a09b00a9af15696 |
| 2026-10-17 23:17:10 | 2026-10-17 23:19:32 | `infra-guardian` | 1 | REPROVADO | aeee26d0c027f5706 |
| 2026-10-17 23:17:26 | 2026-10-17 23:20:22 | `revisor-geral` | 1 | APROVADO | a860a41ce58970d10 |
| 2026-10-17 23:17:21 | 2026-10-17 23:21:50 | `test-engineer` | 1 | REPROVADO | a4d211b69f906862b |
| 2026-10-17 23:44:47 | 2026-10-17 23:45:15 | `frontend-reviewer` | 2 | APROVADO | a50c6344cca8f555d |
| 2026-10-17 23:45:04 | 2026-10-17 23:45:38 | `tenancy-guardian` | 2 | APROVADO | a120ae2ae1e77f3b6 |
| 2026-10-17 23:44:56 | 2026-10-17 23:45:42 | `privacy-guardian` | 2 | APROVADO | a8eacb6a2b8f12f4b |
| 2026-10-17 23:44:23 | 2026-10-17 23:46:09 | `infra-guardian` | 2 | APROVADO | ac7228e1258a5a81f |
| 2026-10-17 23:45:14 | 2026-10-17 23:46:45 | `revisor-geral` | 2 | APROVADO | a932c47e2a0cec663 |
| 2026-10-17 23:44:38 | 2026-10-17 23:47:20 | `test-engineer` | 2 | REPROVADO | a769bc49c07c4600c |
| 2026-10-18 09:56:15 | 2026-10-18 09:56:54 | `revisor-geral` | 3 | APROVADO | a42bf5b19462ee510 |
| 2026-10-18 09:56:04 | 2026-10-18 09:57:31 | `test-engineer` | 3 | APROVADO | ad631ed9f82b130b0 |
