# Suspeitos de código morto

Etapa 3, pelo Arquiteto em 20/10/2026. **Tudo aqui é suspeita, não conclusão.** Nada se remove por estar nesta lista.
Marcas: **[código]** · **[doc]** · **[hipótese]**.

## 0. Antes de remover qualquer item

Um item só sai depois de quatro buscas sem resultado, registradas na tarefa:

1. **Referência estática:** `git grep -w <nome>` em `apps packages tools e2e infra` e o knip com
   `.reengenharia/medicao/knip.json`.
2. **Referência dinâmica:** DI do Nest (`useFactory`, provider só por ciclo de vida), rota por decorator, string em
   `package.json` (`node dist/ops/<x>.js`), `import()` por caminho, `import * as` com varredura (`contratos.test.ts` percorre
   todo `esquemaResposta*`), flag de ambiente (`ROTAS_SINTETICAS`, `VITE_COM_GALERIA`), compose e `ci.yml`.
3. **Uso fora do código:** runbook, README, skill ou agente que mande rodar o comando.
4. **O portão verde depois de remover**, mais a esteira.

Se o item é teste que protege regra de negócio, ele não sai (MISSAO, Etapa 8).

## 1. Medição estática (prévia de 20/10; a oficial é a da Etapa 4)

knip 6.42.1 com `medicao/knip.json`: **0 arquivos** sem uso; **162 exports e 26 tipos** sem uso (api 68, web 52,
nucleo 13, worker 11, realtime 6, despachante 6, shared 6); `pino` declarado e não importado em `apps/worker` e
`apps/despachante`; `tailwindcss` acusado como não usado (provável falso positivo: é carregado pelo `@tailwindcss/vite`)
[código]. A maior parte dos exports sem uso é **superfície a mais** (tipo ou constante exportada "por precaução"), não
código inútil: o barril do nucleo tem 522 nomes e ~250 sem uso de produção fora dele; o de shared tem 887 e 147 sem
consumidor externo [código: U01 §9, U02 §9].

## 2. Suspeitos de produto

| # | Suspeito | Onde | Como foi procurado | O que pode ser referência | Unidade |
|---|---|---|---|---|---|
| D1 | Tarefa de IA `relatorio_da_correcao` (~120 linhas + testes, prompt, esquemas em shared, `check` no SQL) | `packages/nucleo/src/ia/tarefas/relatorio-da-correcao.ts` | grep em `apps/` sem chamador | outro módulo chamando por outro nome; planejada para o F6 | U03 |
| D2 | Contrato e app do realtime além do handshake | `apps/realtime`, `packages/shared/src/sistema/realtime.ts` | grep `.emit(`, `serverSideEmit`, `socket.io-client` em `apps/web` | fundação do modo sala (F10); `infra/test/borda.int.test.ts` o exercita | U06, U01 |
| D3 | `pgvector` na imagem do Postgres | `infra/compose.yml:8` | grep `vector` nas migrations: zero | ingestão vetorial futura | U12 |
| D4 | Código de teste e carga no caminho de produção: `SandboxDeCpu`, `sintetico.sandbox.ts`, processador `sintetico`, `EfeitoSinteticoRepository` (tabela que não existe em produção), rota `jobs-sinteticos`, `sessoes-sinteticas.ts` | `apps/worker`, `apps/api/src/sistema`, `apps/api/src/sessao` | uso só em teste e cenário de carga | flag `ROTAS_SINTETICAS=true` (ligada no `.env.example:51`); scripts `infra/scripts/carga*.ts` | U04, U06 |
| D5 | Dublês em memória exportados pelo pacote de produção: `OrcamentoEmMemoria`, `ConsumoEmMemoria`, `SuspensoesEmMemoria`, `ExecucoesEmMemoria`, `ArmazemEmMemoria`, `UrlAssinadaPeloFalso` | `packages/nucleo/src/{ia,titular}` | uso só em teste | exportados pelo barril | U02, U03 |
| D6 | `AuditoriaRepository.listarDaEscola` ("não tem rota: serve ao teste", diz o próprio comentário) | `packages/nucleo/src/auditoria/auditoria.repository.ts:27-29` | 1 uso, em teste | consulta do dossiê (D61) no futuro | U02 |
| D7 | `VERSAO_DAS_REGRAS_COMUNS` | `packages/nucleo/src/ia/prompts/comum.ts:8` | grep: só a definição | deveria entrar na versão gravada (é achado de contrato, CONTRATOS §6) | U03 |
| D8 | `ExecucaoRepository.marcarConcluida` chamado depois de `concluirRodando` | `apps/api/src/ia/execucao.repository.ts`, `executor.ts:197` | leitura | provável `update` sem efeito [hipótese] | U03 |
| D9 | `esquemaRespostaSalva`, `esquemaRespostaCorrigida`, `esquemaPedidoDaTurma`, `esquemaPedidoDeMeusDados` | `packages/shared/src/{atividade,sala,privacidade}` | só compõem outro esquema | não são mortos: o nome engana (CONTRATOS §2) | U01 |
| D10 | 17 tipos de shared sem nenhum uso (`PedidoConsultarConvite`, `ProvedorDaEscola`, `PedidoAtivarMfa`, `PedidoRedefinirMfa`, `ResultadoDaLinhaDaLista`, `PedidoSemCorpoDeOperador`, `PedidoConsultarConviteDeOperador`, `TrechoEncontrado`, `MensagemDoUsuario`, `DecisaoDeEntrega`, `PedidoSemCorpo`, `AcertoPorHabilidade`, `ValidacaoDoLote`, `MensagemDoAlunoAoTutor`, `BaixarArquivoDaEscola`, `CorrecaoDeNome`, `TitularDoPedido`) | `packages/shared/src` | o nome aparece uma vez, no arquivo que o define | contrato por inferência | U01 |
| D11 | Funções da web só usadas por teste: `esperandoVoce` e `ItemEsperando` ("o Início deixa de usá-la na 3.0"), `origemDoMaterial`, `tokenDeOperador` | `areas/professor/fila-do-professor.ts:240-270`, `areas/coordenacao/material-envio.ts:152`, `operacao/api/sessao.ts:200` | grep fora de `.test.` | `tokenDeOperador` pode ser API de teste | U08 |
| D12 | `componentes/Busca.tsx` e `componentes/Opcao.tsx` | `apps/web/src/componentes` | únicos importadores de produção estão em `galeria/` | a galeria é usada pelo e2e de peças | U07 |
| D13 | `galeria/` inteira (1.543 linhas) | `apps/web/src/galeria` | rota só com `VITE_COM_GALERIA=1` | **viva para o e2e**: `pecas-*.spec.ts` a visitam [código: U09 §7] | U07, U09 |
| D14 | `pdfkit` em `apps/api/package.json` | — | sem uso achado em `apps/api/src` de U05 | `artefato/pdf-do-artefato.ts` usa lib de PDF [hipótese: é ele; conferir] | U05, U10 |
| D15 | `pino` em `apps/worker` e `apps/despachante` | `package.json` de cada um | knip | usado pelo nucleo, que os declara [hipótese: dependência transitiva declarada por precaução] | U10 |
| D16 | Reexportações de compatibilidade: `ops/escola.ts` (`abrirBancoDeOperacao`, `ArgumentoInvalido`, `lerOperador`), `ops/uso.ts:22` (`urlDoBancoDeOperacao`) | `apps/api/src/ops` | comentário "para quem já o importava daqui" | `ops/sessao-sintetica.ts:7` e `uso.test.ts` ainda importam por ali | U05 |
| D17 | `COMANDO_HEALTHCHECK_BATIMENTO` | `packages/nucleo/src/instancia/batimento.ts:31` | sem import; o texto está copiado em `infra/compose.yml:328,381` | duplicação, não morte | U06 |
| D18 | `config.AMBIENTES`, alias de `AMBIENTES_DO_SISTEMA` | `packages/nucleo/src/config/validar-config.ts:42` | leitura | — | U02 |
| D19 | `ViradaDaSala` (só no próprio arquivo), `ResultadoDaRenovacao` (nenhum uso) | `estrutura/ano-letivo.repository.ts:6`, `sessao/renovacao.service.ts:40` | grep | tipo por inferência | U04 |
| D20 | `professor/Tutor.tsx` (43 linhas) | `apps/web/src/areas/professor` | — | **vivo**: redireciona `/time/tutor`, e o sino aponta para ele | U08 |

## 3. Suspeitos de infraestrutura, teste e documentação

| # | Suspeito | Onde | O que pode ser referência | Unidade |
|---|---|---|---|---|
| D21 | `infra/k6/*.js` e `infra/scripts/carga*.ts` | `infra/` | **vivos** para quem roda carga (`npm run carga*`); fora da esteira | U10 |
| D22 | `tools/demonstracao/` | `tools/` | `npm run demonstracao:material` e 2 testes (D75: o PDF da demonstração) | U10 |
| D23 | `tools/testes/metricas.ts`, `promql.ts`, `redis-travado.ts` | `tools/testes` | provavelmente `infra/test` [hipótese] | U09 |
| D24 | Fixtures de pedido do titular com nomes quase iguais (`criarPedidoDoTitularNoBanco`, `criarPedidosDoTitularNoBanco`, `criarPedidoDeTitularEliminadoNoBanco`) | `e2e/__fixtures__/sessao.ts` | conferir referência de cada um dos ~75 exports do arquivo | U09 |
| D25 | Seções históricas de `docs/mvp-rapido.md` (§5, 7, 8, 9, ~300 linhas) | `docs/` | `CLAUDE.md` e `mvp-contratos.md:270` ainda apontam para o documento | U12 |
| D26 | `docs/infra.md:454-458` "Em aberto: concorrência por escola nas filas" | `docs/` | o §5.3 do mesmo documento já resolve | U12 |
| D27 | Os 46 itens `[x]` do `TODO.md` | `TODO.md` | — | U12 |

## 4. Suspeitos do harness (só na Etapa 9 ⛔)

| # | Suspeito | Onde | O que o refutaria | Unidade |
|---|---|---|---|---|
| H1 | Caminho `(mvp: …)` do hook: `marcadorDoMvp`, `avaliarCommitDoMvp`, `SUITES_DO_MVP`, `PREFIXO_DAS_BRANCHES_DO_MVP` + ~40 menções em teste | `tools/processo/revisoes.ts:44-49,953-979` | nova fatia com dado sintético (D77) | U11 |
| H2 | `separar-achados.ts` (160 + 150 de teste) e os parágrafos em `executar-task` e `corrigir` | `tools/processo` | branch antiga ainda viva com `achados-revisoes.md` | U11 |
| H3 | `domain-researcher`: marcar o agente na tarefa não gera registro nem cobrança | `.claude/agents`, `settings.json:14`, `revisoes.ts:31-33,357` | — | U11 |
| H4 | Skill `status` | `.claude/skills/status` | um papel a invocar por pedido do Joaquim | U11 |
| H5 | `criar-prd/exemplo-preenchido.md` | `.claude/skills/criar-prd` | — | U11 |
| H6 | 12 skills de terceiros (~2,2 MB) que nenhum papel manda carregar | `skills-lock.json` | auto-ativação pela descrição | U11 |
| H7 | Isenção da guarda de SDK para `apps/api/src/ia/adapters`, pasta que não existe | `tools/guardas/regras-ia.mjs:29` | — | U03, U11 |
