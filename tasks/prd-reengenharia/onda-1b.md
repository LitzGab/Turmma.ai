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

**Como a 18.0 ficou (o que a implementação fixou):**
- A assinatura é `enfileirar(tx, tipo, dados, ...opcoes)` e `enfileirarUmaVez(tx, tipo, dados, chave, ...opcoes)`; as opções são
  obrigatórias só no tipo `'do-pedido'` (o sintético). O pedido recusado é `PedidoDeJobRecusado` (`packages/nucleo/src/fila`), com
  motivo fixo e sem `issues` nem valor: é defeito de quem chamou, e não erro de domínio (responde 500, e o log não leva o dado).
- `definirJob` confere em execução que o esquema é estrito: no zod, `z.object()` e `z.strictObject()` têm o mesmo tipo, então só
  o tipo "frouxo" (`looseObject`, `.catchall()`) é barrado na compilação.
- A caracterização dos 8 tipos (18.1) entra no commit da tarefa, como na 14.0 e na 51.0: o hook só aceita commit com código, e um
  commit só de teste pediria tudo duas vezes. O teste foi escrito e passou contra o código antigo antes da migração.
- `BancadaDeFila.enfileirar` (`apps/worker/test/fila-de-teste.ts`) grava pelo repository, sem a definição, porque os testes do
  despachante e do worker enfileiram tipos de teste e `dados.rotulo`; a 19.0 troca isso pela definição injetável.
- Os testes de tipo são `@ts-expect-error` provados pelo `tsc` do portão (o vitest não checa tipo), e não por mutação.
- O `prazoMs` de cada tipo é provisório até a 43.0 conferir; a retentativa é a de hoje (5 tentativas, 2 s, 0,5), igual à
  `OPCOES_DE_JOB_PUBLICADO`, e a 19.0 liga uma à outra.

**Como a 19.0 ficou (o que a implementação fixou):**
- `Processador<Tipo>` recebe `z.output` do esquema do tipo (`DadosLidosDoJob<Tipo>`, em shared), e `ProcessadoresDeJob` é o mapa
  `{ [Tipo in TipoDeJob]?: Processador<Tipo> }`: ler campo que a definição não tem, ou registrar processador de tipo que ela
  não tem, não compila. O executor lê o tipo da linha em execução e chama o processador por um `never` (`ProcessadorSemTipo`): é
  o único ponto sem prova do compilador, e só recebe o que o esquema do mesmo tipo leu.
- O executor confere, nesta ordem, dentro do `try` da tentativa: a definição do tipo (sem ela, `TIPO_DESCONHECIDO`), o escopo
  (`(escopo === 'sistema') !== (escola da linha === null)`, e a linha que não casa, `DADOS_INVALIDOS`), o esquema estrito dos
  dados e o processador da réplica (sem ele, `TIPO_DESCONHECIDO`). Toda recusa é `FalhaDeJob` definitiva, só com o código. O
  `ExecucaoDoJob` ganha o `prazoMs` da definição; aplicá-lo segue na onda 3 (43.0).
- Sobem para o executor a validação à mão de `montar-arquivo.ts`, `eliminar-titular.ts` e `sintetico.ts`; os processadores de
  rotina do sistema mantêm a conferência de contexto que já tinham (`rotinaDoSistema`), porque os testes os chamam direto. Dos da
  escola, `montar-arquivo.ts` lê a escola do contexto com `exigirEscolaDoContexto()` (sem escola, `Error` comum, que o executor
  nunca deixa chegar: o escopo é conferido antes), e `eliminar-titular.ts` já não confere nada.
- `opcoesDeJob(tipo, definicoes?)` (nucleo, `publicacao.ts`) lê a retentativa da definição e substitui `OPCOES_DE_JOB_PUBLICADO`,
  `TENTATIVAS_DE_JOB`, `RECUO_INICIAL_JOB_MS` e `JITTER_DO_RECUO`, que saíram; o tipo que o registro não conhece segue com as
  cinco tentativas e os 2 s de antes, e o worker o termina na primeira com `TIPO_DESCONHECIDO`.
- `nomeDaFilaBullMQ(fila, executor)` tem o `executor` obrigatório: `worker` é o nome de hoje (`interativa`, `normal`, `lote`), e `api`
  é `api-<fila>`. O despachante cria a `Queue` do worker de cada fila no construtor, como antes, e a da API na primeira vez que um tipo
  a pede (`executorDoJob(tipo)`, do tipo desconhecido para o worker); a consulta da reconciliação segue o mesmo caminho.
- `montarProcessadores` sai de `montarWorker` e é exportado: é a fonte do que a réplica de cada fila executa (o sintético em
  toda, `titular.montar-arquivo` na `normal`, as rotinas na `lote`), e `montagem.test.ts` a liga ao registro nos dois sentidos.
- A definição é injetável (`definicoes`) em `montarDespachante` e em `montarWorker`, e `BancadaDeFila` a leva aos dois
  (`new BancadaDeFila(definicoes)`); o `tipo` do pedido da bancada é um dos do registro dela. A gravação da bancada segue sem
  passar pela definição, de propósito: o worker não confia na gravação, e o teste põe na linha o que ele deve recusar.
- "A mesma linha entregue duas vezes em paralelo roda uma vez" fica no teste da entrega repetida depois do `concluido`
  (`execucao.int.test.ts`): `iniciarExecucao` aceita `ativo` de propósito (D49, o stalled), e duas entregas ao mesmo tempo da
  mesma linha rodam as duas; o que se prova é que o terminado não roda de novo.
- A caracterização dos 8 tipos entra no commit da tarefa, como na 18.0: a 19.1 é o teste em literal das opções de publicação
  (`opcoesDeJob`, `fila-de-publicacao.test.ts`), escrito e verde contra o código antigo antes de trocar `OPCOES_DE_JOB_PUBLICADO`.

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
  `@opentelemetry/sdk-metrics`, e também `drizzle-orm` e `zod` (os testes de `tools/guardas/` as importam, e o
  `definicoes-de-job.test.ts` nasceu na 18.0, depois da medição: a lista saiu do knip e não da leitura); de
  `apps/realtime`: `jose`; de `apps/worker`: `drizzle-orm`. Todas exatas, na versão do lock.
- Sai o `pino` de `apps/despachante` e `apps/worker`.

**A trava.** O `knip.json` da raiz, derivado de `reengenharia/temporario:.reengenharia/medicao/knip.json`, roda com
`--include dependencies,unlisted,binaries,unresolved` em `tools/ci/etapas-de-guarda.ts`. O knip é `devDependency` (R40),
6.42.1 exato. O `guarda:dependencias` do `package.json` passa a ser `npm audit … && knip --include …`, porque o portão da
tarefa só roda esse script e `tools/processo/` não muda antes da 92.0; a etapa do `ci:verificar` é a
`etapaDependenciasDeclaradas` (`npx --no knip …`), com os argumentos numa constante só (`ARGUMENTOS_DO_KNIP`).

O `knip.json` tem, além do `ignore` (só as duas pastas de fixture), `ignoreDependencies: ["k6"]` e
`ignoreBinaries: ["flock", "maestri"]` no workspace da raiz, que não são pacote npm (`k6/http` é do executor do k6; os
outros dois são comandos do sistema); a `apps/web` tem `src/estilos.css` como entrada, para o knip seguir o
`@import 'tailwindcss'`. `knip.test.ts` afirma que não há outra porta (`ignoreWorkspaces`, `ignoreIssues`, `ignore` por
workspace).

**O `throw` (25.0).** São 94 `throw new Error('…')` em produção, quase todos invariantes.
- `ErroDeInvariante extends Error` (`packages/nucleo/src/erro/`) leva motivo fixo, sem interpolar valor.
- `guardas/erro-tipado` (`tools/guardas/regras-erro.mjs`) proíbe `throw new Error(` e literal lançado em `apps/*/src` e
  `packages/nucleo/src`, fora de teste, exceto `apps/web/src/main.tsx`.
- `ArgumentoInvalido`, triplicado em `ops/`, vira uma classe.

**Como a 25.0 ficou (o que a implementação fixou):**
- A contagem de 22/10 (84) incluía 7 ocorrências em `__fixtures__` (4 da web, 3 do `nucleo`) e o `main.tsx` da web, que é a exceção
  única: foram convertidos os 76 de produção. A guarda também deixa de fora `**/__fixtures__/**` (apoio de teste, como na
  `camadas.cjs`): o texto com o caminho ajuda quem depura o teste, e o motivo fixo o apagaria.
- `ErroDeInvariante` mora em `packages/shared/src/erros/`, e não no `nucleo`: a web também lança invariante
  (`ferramentaDoCatalogo`) e não importa o `nucleo` (`web-nao-importa-nucleo-nem-backend`). O `nucleo` e as apps o importam de
  `@educa/shared`.
- O motivo fixo é do lint, e não do tipo: `guardas/erro-tipado` reprova `new ErroDeInvariante(x)` e o `super(x)` de uma subclasse
  quando `x` não é um texto escrito (literal, ou template sem expressão); `'a' + x`, `${}` e variável reprovam. Reprova também
  `throw new Error(…)`, `throw Error(…)`, `globalThis.Error` e qualquer literal lançado, com `as`, `!` e `satisfies` por cima, e as
  duas pontas de `?:` e de `||`. Limite: `Error` guardado em outro nome (`const E = Error`) não é reconhecido. Entra na segunda passada
  (`REGRAS_DAS_GUARDAS`), então o `eslint-disable` não a fura.
- Quatro mensagens montavam valor e viraram motivo fixo, sem o valor: `categoria sem prazo no catálogo`, `nome de coluna fora do
  formato`, `papel fora da busca de titulares` e `ferramenta fora do catálogo`. A lista de rotas sem `@Permite` (25.3) sai em
  `RotasSemPermissao.rotas` (`{ controller, metodo }`, com `codigo = 'ROTA_SEM_PERMISSAO'`), e a de problemas do mapa de auditoria em
  `MapaDeAuditoriaInvalido.problemas`; as duas são subclasses de `ErroDeInvariante` com a `message` fixa. `acoes.ts` ganha
  `exigirMapaDeAcoesValido(mapa)`, para a cláusula que lança ter teste. Limite: a chamada que o módulo faz ao carregar
  (`exigirMapaDeAcoesValido(ACOES_DE_AUDITORIA)`) não tem teste que falhe sem ela, porque carregar o módulo no teste já é rodá-la;
  o que se prova é a função, e a chamada é a única linha de `acoes.ts` fora do teste.
- `ArgumentoInvalido` fica em `ops/comando.ts` e recebe a opção com os traços; `uso.ts` e `sessao-sintetica.ts` o reexportam e
  passam `'--dia'` onde passavam `'dia'`, e o texto no terminal é o mesmo.
- O filtro global responde `ERRO_INTERNO` 500 ao `ErroDeInvariante` sem o motivo, e o log leva `erro.tipo = 'ErroDeInvariante'`
  (`apps/api/test/erro.int.test.ts`).

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
