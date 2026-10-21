# Tech Spec da X5 — Onda 1B: contratos

**Comum:** `techspec.md` · **PRD:** RF6, RF7, RF8, RF12, RF13 · **Tarefas:** 18.0 a 29.0

## 1. O que muda

Os temas T4, T3, T2 e T11 e o RF13 (`techspec.md` §2).

## 2. Desenho

### T4 — Registro de jobs (RF8)

**A definição.** `DEFINICOES_DE_JOB` mora em `packages/shared/src/sistema/definicoes-de-job.ts`, com `definirJob()` e
`TipoDeJob = keyof typeof DEFINICOES_DE_JOB`:
```ts
{ filas: [Fila, ...Fila[]], escopo: 'escola' | 'sistema', executor: 'worker' | 'api', dados: ZodStrictObject,
  retentativa: { tentativas, recuoMs, jitter }, prazoMs, naoUrgente }
```
`executor`: os de hoje são `worker`, os de IA e PDF da onda 3 são `api`. A fila no BullMQ vira
`nomeDaFilaBullMQ(fila, executor)`, senão o worker daria `TIPO_DESCONHECIDO` ao job de IA (`apps/worker/src/executor.ts:223`).

**18.0, ao enfileirar.**
- `Enfileirador.enfileirar<T>(tx, tipo: T, dados: z.input<…>, opcoes?)` faz `parse` antes de gravar; fila e
  `naoUrgente` saem da definição. `enfileirarUmaVez` idem.
- As 6 constantes do worker e o `TIPO_JOB_SINTETICO` vão para shared; `esquemaDadosJobSintetico` passa a `strict`.

**19.0, no worker.**
- `Processador<T>` recebe dados tipados; `ExecutorDeJobs` valida com a definição, e a falha é `FalhaDeJob(DADOS_INVALIDOS)`.
- O despachante troca `OPCOES_DE_JOB_PUBLICADO` por `opcoesDeJob(tipo)` (os mesmos 5 e 2 s). A definição é injetável
  (`fila-de-teste.ts`).

**Os 8 tipos de hoje:** `titular.montar-arquivo` (normal); `titular.eliminar`, `retencao.expurgar-escola`,
`sistema.consolidar-uso`, `sistema.expurgar-acesso`, `sistema.expurgar-jobs` e `sistema.expurgar-dado-pessoal` (lote);
`sintetico` (as três).

**O `prazoMs`** é obrigatório e chega a `ExecucaoDoJob.prazoMs`, aplicado só na onda 3. ⚠️ O valor é o máximo do infra,
arredondado para cima; a onda 3 confirma.

**A trava (testes):** todo tipo tem processador na réplica da fila (`montagem.ts`) e vice-versa; `escopo === 'sistema'`
só quando o tipo começa com `sistema.` (check `job_registro_escola_ou_sistema`); as `filas` casam com
`job_registro_fila_valida`; nenhum esquema tem chave de `CHAVES_PESSOAIS` (`tools/guardas/regras-log.mjs`).

### T3 — Leitor tolerante (RF7)

`lerResposta(esquema, corpo)` sai de `apps/web/src/api/cliente.ts`, exportada e usada também por `api/material.ts`.
1. Se **todo** problema é `unrecognized_keys`, apaga as chaves no `path` de uma cópia e relê.
2. Senão, lança `ErroDeContrato` com `RESPOSTA_FORA_DO_CONTRATO`, no catálogo de shared e nos dois `Record` exaustivos (R39).

A tela diz "Há uma versão nova do Turmma. Recarregue a página.", com "Recarregar" no `EstadoErro`, e `deveTentarDeNovo`
não repete. Campo extra dentro de `z.union` simples cai em "versão nova", o lado seguro.

### T2 — Registro de rotas (RF6)

**O formato.** O registro mora em `packages/shared/src/rotas/`, um arquivo por área:
```ts
'serie.criar': definirRota({ metodo: 'POST', caminho: '/v1/series', status: 201,
  acesso: { permite: ['serie', 'criar'] } /* | 'anonima' | 'operacao' */,
  corpo: esquemaPedidoCriarSerie, resposta: esquemaRespostaSerie })
```

**Na API.** O registro não gera o pipe: o esquema fica no handler (T1), e o registro é o catálogo que o teste confere.
Gerar tudo de um decorator seria o `ts-rest` que a P3 rejeitou. `@Rota('serie.criar')` é só marcador.

**O teste (21.0).** `apps/api/test/rotas-do-registro.test.ts` sobe o `AppModule` e confere método e caminho montados
(`DiscoveryService`) contra o registro, nos dois sentidos; `corpo`, `consulta` e `caminhoParams` por identidade com o
`schema` do `ROUTE_ARGS_METADATA`; e `acesso` contra `@Permite`, `@RotaAnonima` e os marcadores da operação.

A 21.0 usa a catraca de pendentes da T1, e a 22.0 a apaga. A varredura de credencial de `contratos.test.ts` passa a
iterar as `resposta` do registro.

**O OpenAPI.** `gerarOpenApi(ROTAS)` em shared usa `z.toJSONSchema` (`target: 'openapi-3.0'`, `io` de entrada ou saída,
`unrepresentable: 'any'`) e grava `docs/gerado/openapi.json`, com teste byte a byte e `npm run docs:openapi`. ⚠️ Os 22
`union` e `discriminatedUnion` se conferem na 21.0.

**Na web (23.0).** `chamarRota(rota, { caminho, consulta, corpo })` em `api/cliente.ts`, sobre `chamarApi`, com
`montarCaminho` em shared (`encodeURIComponent`). A pilha do operador aceita a rota sem se juntar à da escola (P4). A trava
é `no-restricted-syntax` contra o literal `'/v1/'` em `apps/web/src`, fora de teste.

### T11 — Módulo de políticas (RF12)

**O módulo.** `packages/nucleo/src/conformidade/` tem um arquivo por política (`risco-a-vida`, `assunto-delicado`,
`pedido-de-resposta`, `julgamento-de-texto-de-aluno`, `saida-com-nota`, `saida-qualitativa`), mais `index.ts` e
`corpus/<politica>.dev.ts` (os `__fixtures__` de hoje). Cada uma nasce de `criarPolitica`:
```ts
criarPolitica({ id, regra, erraPara: 'mais' | 'menos', grupos: Record<string, readonly RegExp[]>,
                decidir: (grupos) => (texto, contexto?) => boolean })
```
- `casa(texto, contexto, grupos = politica.grupos)` recebe os padrões por parâmetro (para a mutação). `PEDE_NOTA` vira
  array.
- `turno-do-tutor.ts` e `propor-ferramenta.ts` chamam só `politicas.x.casa(...)`. 26.0 e 27.0 são refatoração pura,
  com `ouro`, `dev` e os testes de hoje verdes.
- Ficam de fora `AFIRMA_SER_PESSOA`, `SIMULA_VINCULO` e `PERGUNTAS_SOBRE_O_TUTOR` (D58).

**Mutação e metamórficos (28.0).**
- `mutacao.test.ts` tira cada padrão e exige que uma amostra de `dev ∪ ouro` mude. Um padrão por jeito de dizer, com
  até 3 alternativas internas.
- `metamorficos.test.ts`: caixa alta, espaços extras, pontuação, "vc"/"você" e o prefixo "oi, " não mudam `casa`.

**O `ouro` protegido (29.0)**, fora de `tools/processo`:
1. O `selo-do-ouro.test.ts` da 1.0 passa para o módulo de políticas.
2. `tools/guardas/ouro-separado.ts`, com teste, lê `git log --no-renames --name-only -m --first-parent 400dc42..HEAD`
   (`400dc42` é a origem do corpus; esteira com `fetch-depth: 0`): o commit que toca `docs/aia/ouro/**` só toca `docs/` e
   leva `(ouro: …)`; `(tarefa` e `(correção` nunca o tocam; clone raso falha.
3. Em toda tarefa de política, o `conformidade-reviewer` confere `git log <início da tarefa>..HEAD -- docs/aia/ouro` vazio.

O marcador forjado num commit só de docs, só a 3 pega; o guardião por caminho fica para a Etapa 9.

### RF13 — Dependências e `throw`

**As dependências (24.0)**, as do knip, nas versões do lock:

- `devDependencies` da raiz: `pg`, `ioredis`, `@node-rs/argon2`, `otpauth`, `bullmq`, `socket.io-client`,
  `@opentelemetry/sdk-metrics`; de `apps/realtime`: `jose`; de `apps/worker`: `drizzle-orm`.
- Sai o `pino` de `apps/despachante` e `apps/worker`.

**A trava.** O `knip.json` da raiz, derivado de `.reengenharia/medicao/knip.json`, roda com
`--include dependencies,unlisted,binaries,unresolved` em `tools/ci/etapas-de-guarda.ts`. O knip é `devDependency` (R40),
6.42.1 exato.

**O `throw` (25.0).** São 94 `throw new Error('…')` em produção, quase todos invariantes.
- `ErroDeInvariante extends Error` (`packages/nucleo/src/erro/`) leva motivo fixo, sem interpolar valor.
- `guardas/erro-tipado` (`tools/guardas/regras-erro.mjs`) proíbe `throw new Error(` e literal lançado em `apps/*/src` e
  `packages/nucleo/src`, fora de teste, exceto `apps/web/src/main.tsx`.
- `ArgumentoInvalido`, triplicado em `ops/`, vira uma classe.

## 3. Falha

| Peça | O que o teste mostra |
|---|---|
| T4 | payload inválido recusado ao enfileirar, sem gravar; no worker, `DADOS_INVALIDOS`; tipo desconhecido antigo, `TIPO_DESCONHECIDO` |
| T3 | campo extra aceito; obrigatório ausente: `ErroDeContrato`, sem repetir |
| T2 | rota divergente ou fora do registro reprova |
| T11 | padrão tirado e `ouro` alterado ficam vermelhos; clone raso falha |

## 4. Isolamento, dado pessoal, conformidade, carga

O `escopo` do job se confere contra o contexto; payload só com id (`CHAVES_PESSOAIS`) e OpenAPI só com esquema; T11 é
refatoração da regra 70; um `parse` a mais por enfileirar.

## 5. Tarefas

| # | Título | RF | Depende de | Veto | Porte | Paralelo com |
|---|---|---|---|---|---|---|
| 18.0 | Payload inválido é recusado ao enfileirar, e tipo sem definição não compila | 8 | 14.0 | tenancy, privacy | grande | 15.0–17.0, 24.0 |
| 19.0 | O worker valida pela definição, e o teste liga tipo, fila e processador | 8 | 18.0 | tenancy, infra | grande | 15.0–17.0, 25.0 |
| 20.0 | A web aceita campo extra e, com contrato quebrado, mostra "há uma versão nova" | 7 | 18.0 | — | pequeno | 19.0, 25.0 |
| 21.0 | Rota fora do registro ou divergente reprova, e o OpenAPI sai dele | 6 | 17.0, 20.0 | — | grande | 19.0, 26.0 |
| 22.0 | Todas as rotas estão no registro, sem lista de pendentes | 6 | 21.0 | tenancy | grande | 26.0, 27.0 |
| 23.0 | A web chama pelo registro, sem literal `/v1/` | 6 | 22.0 | — | grande | 26.0–29.0 |
| 24.0 | Toda dependência é declarada onde é usada, sem sobra | 13 | 12.0 | infra | pequeno | 18.0, 26.0 |
| 25.0 | Todo `throw` de produção é tipado, e o lint barra o resto | 13 | 13.0 | — | grande | 19.0, 20.0, 26.0 |
| 26.0 | Risco à vida, assunto delicado e pedido de resposta em `conformidade/`, comportamento igual | 12 | 2.0, 3.0 | conformidade | pequeno | 21.0–25.0, 29.0 |
| 27.0 | Os padrões da D55, de entrada e de saída, vivem em `conformidade/` | 12 | 26.0 | conformidade | pequeno | 22.0–25.0, 29.0 |
| 28.0 | Tirar qualquer padrão deixa uma amostra vermelha | 12 | 27.0 | conformidade | pequeno | 23.0, 29.0 |
| 29.0 | Mudar o `ouro` junto com o padrão é recusado | 12 | 1.0 | conformidade | pequeno | 26.0, 27.0 |

**O tronco em `packages/shared` corre em série:** 14.0 → 18.0 → 20.0 → 21.0 → 22.0.

**Não correm juntas:** 25.0 espera a 13.0 (`eslint.config.mjs`, `tools/guardas/index.mjs`); 24.0 espera a 12.0
(`package-lock.json`).

## 6. Riscos

- A `resposta` do registro só se confere contra o handler quando o interceptor `@RespostaPor` entrar; até lá documenta,
  e o `parse` segue no service.
- 20.0, 23.0 e 25.0 mexem no `eslint.config.mjs`: conflito de uma linha, resolvido no encontro.
- O corpus `dev` passa para o lado da política. ⚠️ Conferir na 26.0 que o `dist/` não o compila para quem o importa.
