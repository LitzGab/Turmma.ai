# U01 — `packages/shared` (contrato compartilhado API↔web)

Método: leitura dos arquivos, grep e dois scripts de leitura (contagem de consumidores por nome exportado; resultado em `scratchpad/u01-out.json`). Nada foi editado nem rodado. "Consumidor" = arquivo fora de `packages/shared` que cita o nome (palavra inteira) em `apps/`, `packages/`, `e2e/`, `infra/`, `tools/`.

## 1. Finalidade e limites

Pacote ESM de 9.262 linhas em 91 arquivos (20 de teste, 1 fixture `matriz.expectativa.ts`) que guarda o contrato entre API, web, worker, realtime, despachante e `packages/nucleo`. Tudo é **zod 4.6.4** (única dependência, `packages/shared/package.json`); 271 `export const esquema*` e 616 outros exports (tipos `z.infer`, constantes `as const`, enums, mensagens, funções puras). [código]

Não é dele: DTO de saída montado pela API (`paraATela` nos services), schemas de ambiente (`config.ts` de cada app), schema do banco (`nucleo/src/db/schema`), prompts e saída do modelo (`nucleo/src/ia/tarefas`), payload de job real (ver seção 6).

Mas o pacote **não é só contrato**: carrega também catálogos e lógica de domínio que API, nucleo e worker executam: matriz de permissão (`permissao/matriz.ts`, 376 linhas, `alcanceDe`), declaração das funções dos agentes e autonomia (`time/funcoes.ts`), catálogo de habilidades (`assistente/habilidades.ts`), retenção (`privacidade/retencao.ts`, `retencaoDaEscola`), classificação de toda tabela do banco (`privacidade/classificacao.ts`), mensagens pt-BR de erro (`erros/mensagens.ts`, 218 linhas), validação de código de turma, `normalizarCodigoDaTurma`. [código]

## 2. Pontos de entrada

Não tem rota, worker nem comando. Entrada única: `src/index.ts` (911 linhas, **barrel escrito à mão**, 887 nomes em `export { } from`/`export type { } from`) [código `packages/shared/src/index.ts`]. O `package.json` tem um só `exports "."` com condição `source` (`src/index.ts`) e `default` (`dist`) [código `package.json:7-11`]. A condição `source` é ligada em `tsconfig.base.json:19` (`customConditions`), no Vite (`apps/web/vite.config.ts`, `resolve.conditions`) e no Vitest (`vitest.config.ts:28-29`); os `tsconfig.build.json` dos apps zeram `customConditions` e usam `dist`. Por isso os scripts `ops:*`, `carga:*` e `ensaio:alertas` do `package.json` raiz refazem `build` de shared+nucleo+api a cada chamada. [código]

Divergência barrel × arquivos: 900 exports nos arquivos, 887 no barrel. Ficam fora de propósito ou por esquecimento: `esquemaEtapaDoPlano`, `RESPOSTAS_A_PROPOSTA`/`RespostaAProposta`, 5 tabelas `MENSAGENS_*` (acessíveis só por função), `NOME_DA_ETAPA`, `esquemaTokenDeLink` (usado só dentro do pacote), `EXPECTATIVA_DA_MATRIZ` (fixture). [código, script]

## 3. Fluxos e invariantes (onde são garantidas)

| Invariante | Onde vive em shared | Como é garantida |
|---|---|---|
| Entrada estrita (campo a mais = erro; escopo nunca vem do cliente) | 299 `.strict()/strictObject` contra 33 `z.object(` | Convenção por schema; cada controller chama o schema à mão (seção 6) |
| Escola/ano nunca no corpo (regra 10 item 3) | schemas sem `escolaId` (`paginacao.ts:12-18`, `estrutura/*`) | `.strict()` recusa o campo; não há teste que varra todos os pedidos |
| 404 = 403 (regra 10 item 6) | `alcanceDe` devolve `nunca`; `idDoCaminho` (`apps/api/src/estrutura/entrada.ts:8-12`) | Guarda de permissão em `nucleo/permissao/guarda-permissao.ts:28`; teste `matriz.test.ts` + `matriz.expectativa.ts` (cópia à mão, comparação nos dois sentidos) |
| Resposta sem credencial/segredo/e-mail de aluno (regras 20) | `esquemaResposta*` | `apps/api/test/contratos.test.ts` varre por reflexão todo `esquemaResposta*` exportado e recusa campos `senha/hash/segredo/sujeito/refresh` (exceções nominais: 2) [código `contratos.test.ts:22-36`]; contratos novos entram sozinhos |
| Nota só com autor humano / D55 | não há tipo de `Nota` em shared; só `esquemaAutorDaDecisao` (`assistente/entrega.ts`) | Fora do pacote (nucleo/API). Shared não tem schema com nota proposta por IA em discursiva, mas nada o impede por estrutura aqui |
| Idempotência de execução de IA | `esquemaChaveEnvio = z.uuid()` (`time/chave-envio.ts`) | Única no banco (`execucao_agente.chave_envio`) |

## 4. Dependências

Para dentro: nenhuma (só zod). Quem importa `@educa/shared` (arquivos que citam o pacote): api 210 (279 contando testes), web 247, nucleo 110, worker 14, despachante 7, realtime 4, e2e 1 (`e2e/__fixtures__/sessao.ts`, mais ~45 specs que importam por caminho relativo à fixture e aparecem na contagem por nome), infra 6, `tools/ci` 2. Todos os 5 apps e `nucleo` declaram a dependência `0.0.0` [código `apps/*/package.json:12-14`, `packages/nucleo/package.json:38`]. Sem ciclo: shared não importa de nucleo, mas **comentários citam o contrato do nucleo** (ex.: `TAREFAS_DE_IA` "os mesmos nomes do catálogo da camada de IA", `time/execucao.ts:23-31`), isto é, dependência semântica invertida mantida por convenção.

Uso real por pacote (nomes exportados que cada consumidor usa): worker usa quase só `Fila`, `CodigoDeFalhaDeJob`, `esquemaDadosJobSintetico`, `TIPO_DO_JOB_*`, `retencaoDaEscola`; realtime usa só `CAMINHO_REALTIME`, `NAMESPACE_REALTIME_SISTEMA`, `RespostaProntidao`, `CodigoDeErro`; despachante usa `Fila`/`CodigoDeFalhaDeJob`. [código, grep em `apps/worker|realtime|despachante/src`]

## 5. Dados

Não lê nem escreve tabela. Mas é **fonte dos valores** de colunas: `nucleo/db/schema/ano-letivo.ts:3-7` importa `SITUACOES_DO_ANO_LETIVO` para o tipo da coluna (36 dos 48 arquivos de schema importam shared) e repete a lista à mão no `check(...)` SQL (`ano-letivo.ts:37`; `material.ts:67` idem). Os comentários de shared registram "o check X repete a lista" em ao menos 6 lugares (`material/material.ts:10,21`, `estrutura/serie.ts:8`, `time/execucao.ts:39,52,58`). Prova de igualdade só localizada para `FORMATO_OPERADOR` (`nucleo/src/db/formato-do-operador.int.test.ts`) e `classificacao.ts` × migrations (`apps/api/test/arquitetura.test.ts`). Para os demais checks não achei teste que compare lista TS e SQL. [código; hipótese de lacuna: confirma-se com `grep` pelos nomes de check em `*.int.test.ts` — só `tabelas-do-mvp.int.test.ts` cita alguns]

## 6. Contratos (foco do pedido)

**Como são definidos.** zod em todos os 271 schemas; tipo TS sempre `z.infer` (nenhum tipo escrito em paralelo para o mesmo payload). As 12 `interface` do pacote são só: `RespostaDeErro` (envelope de erro), `RespostaSaude`, `RespostaProntidao`, opções do realtime, 4 interfaces de retenção, 2 do catálogo de habilidades e `DeclaracaoDeFuncao`. [código]

**A API valida a entrada na borda?** Sim, mas **por convenção, não por estrutura**. Não há pipe global nem `ValidationPipe`/`createZodDto`; `configurar-app.ts` só registra middleware e filtro. Todo `@Body()/@Query()` é `unknown` e cada controller chama o schema: 21 controllers com `safeParse` inline + `throw new ErroDeDominio(ENTRADA_INVALIDA)` (ex.: `estrutura/serie.controller.ts:15-17`) e 61 usos do helper `lerEntrada` (`estrutura/entrada.ts:36-40`); 73 ocorrências de `ENTRADA_INVALIDA`. São dois idiomas para o mesmo problema. Controller que esquece o schema compila e passa. Não achei guarda/teste que reprove `@Body` sem parse. [código `apps/api/src`, contagem por grep; lacuna: hipótese a confirmar com varredura de AST dos 137 handlers]

**Saída validada no servidor.** Os services fazem `esquemaResposta*.parse(...)` (93 de 96 `esquemaResposta*` usados na API). Exceções: `esquemaRespostaExecucaoAceita` (usado só na web; a API devolve o tipo, 4 rotas de IA: `artefato.controller.ts:57`, `ferramentas.controller.ts`, `assistente`, `governanca`), `esquemaRespostaSalva` e `esquemaRespostaCorrigida` (sem nenhum consumidor; ver seção 9). Saúde/prontidão (`RespostaSaude/Prontidao`) são só interface, sem schema. [código]

**Web consome sem redigitar.** `chamarApi(caminho, esquema, opcoes)` valida a resposta com `safeParse` do schema de shared; falha vira `ErroDaApi(ERRO_INTERNO)` [código `apps/web/src/api/cliente.ts:81-104`]. A web nem depende do zod: `EsquemaDeResposta<T>` é uma interface mínima (`cliente.ts:21-23`). Não achei `z.object` em `apps/web/src`, nem DTO/`interface` local de payload em `apps/web/src/api` (as interfaces locais são de UI/estado: `CicloNaTela`, `ListaDaEstrutura`, `LugarNaAba`). O corpo de pedido é tipado (`PedidoCriarSerie` etc.) mas **não é validado** no cliente (o servidor valida). [código]

**O que não é contrato explícito:**
- **Caminhos HTTP**: shared cita rotas só em comentários (124 pares método+caminho únicos em comentários; 137 handlers na API, 57 `@Controller`); a web escreve ~80 literais `'/v1/...'` à mão (`apps/web/src/api/estrutura.ts:73-95` etc.) e liga a cada schema na mão. Trocar uma rota ou o par rota↔schema só quebra em e2e/integração. Sem OpenAPI/swagger no repo. [código; grep]
- **Payload de job**: `enfileirar` aceita `dados: Record<string, unknown>` (`nucleo/src/fila/enfileirador.ts:12`); o produtor monta `{ pedidoId }` à mão (`apps/api/src/privacidade/privacidade.service.ts:238`; `nucleo/src/retencao/expurgo-da-escola.repository.ts:479`) e o consumidor redeclara o schema localmente, **duas vezes idêntico** (`apps/worker/src/processadores/eliminar-titular.ts:20`, `montar-arquivo.ts:20`: `z.strictObject({ pedidoId: z.uuid() })`). Shared só carrega o **nome** do tipo (`TIPO_DO_JOB_*`). A exceção é o job sintético (`esquemaDadosJobSintetico`, `jobs-sinteticos.ts`) cujo contrato está em shared e é usado nos dois lados. [código]
- **Evento realtime**: shared define namespace, path, reconexão e `opcoesDoClienteRealtime`, mas a web **não tem cliente socket.io** (grep em `apps/web`), o gateway não emite eventos de domínio (`apps/realtime/src/sistema.gateway.ts`). Contrato exercido só por teste de integração do realtime. [código]
- **Envelope de erro**: `RespostaDeErro` é interface sem schema; a web extrai `erro.codigo` por checagem manual de `typeof` (`cliente.ts:44-55`) e valida contra `CodigoDeErro`. Funciona; duplica a forma do envelope em código imperativo. [código]
- **Strict em resposta + web `safeParse`**: toda resposta é `.strict()` (ex. `sessao/eu.ts:11,25,29`). Um campo novo adicionado pela API quebra a web já carregada (aba aberta ou cache) com `ERRO_INTERNO` até recarregar. Contradiz o "expandir, migrar, contrair" da regra 80 item 9 para o contrato HTTP. [código no padrão; hipótese do efeito, confirma-se subindo API com campo extra contra a build antiga da web]

**Versionamento.** Pacote `0.0.0` privado, sem changelog, sem teste de compatibilidade entre versões. A única versão do contrato é o prefixo `/v1` nos 57 `@Controller('v1/...')`. Como API e web são monorepo, o risco é só o deploy escalonado descrito acima. [código]

**Teste de contrato.** Há três: `contratos.test.ts` (varredura de campos proibidos), `matriz.test.ts` (matriz × cópia à mão) e `arquitetura.test.ts` (classificação de tabelas × migrations). Não há teste que, para cada rota, valide corpo/resposta contra o schema declarado (a validação em tempo de execução faz isso nos testes de integração indiretamente).

## 7. Testes

20 arquivos, ~190 casos, todos de **unidade** (zod `parse` com dados sintéticos). Por área: assistente 19, atividade 14, erros 18, estrutura 4+9+1+5+1, governança 13, material 5, operação 12, permissão 23, privacidade 5+11+5, sala 7+7+6, time 4, tutor 14. **Sem teste no pacote**: `sessao/` (11 arquivos, 381 linhas, login/MFA/convite/renovação), `sistema/` (8), `professores/` (109), `privacidade/titular.ts`+`arquivo.ts`+`classificacao.ts`, `estrutura/turma.ts`, `vinculo.ts`, `disciplina.ts`, `tutor/uso.ts` e `sinal.ts`. Elas são exercidas pelas ~88 `*.int.test.ts` de `apps/api/test`, que dependem de banco. `estrutura/lista.test.ts` (13 linhas, 1 caso) e `serie.test.ts` (9 linhas, 1 caso) são finos; só leitura sugere teste fraco, não conferi a asserção. `matriz.expectativa.ts` (446 linhas) é duplicação intencional como teste de mutação da matriz, desenho consciente (cabeçalho do arquivo). [código]

## 8. Resiliência e escala (sinais)

- Cliente realtime: reconexão com jitter `randomizationFactor 0.5` (regra 80), definido em shared (`sistema/realtime.ts`). Nada exercido pela web hoje. [código]
- Paginação por cursor de `uuid` v7 padrão 50, teto 100 (`paginacao.ts:3-5`); lista de conversa tem teto próprio (`conversa.ts:126`). A web lê no máximo 10 páginas por lista (`apps/web/src/api/estrutura.ts` `MAXIMO_DE_PAGINAS_DA_ESTRUTURA`). [código]
- Tetos de tamanho nos esquemas (`TAMANHO_MAXIMO_*`, `MAXIMO_DE_*`) são a defesa de entrada. Espalhados em 90 arrays/constantes `as const`.
- Peso na web: a web importa pelo barrel; `sideEffects:false` permite tree-shaking dos schemas não usados. Sem medição do impacto dos ~170 schemas zod no bundle/Chromebook (regra 50). Hipótese: confirma-se com análise do bundle (`apps/web` tem `tamanho-web.test.ts` em `tools/ci`).

## 9. Suspeitos de código morto

Método: lista de 887 nomes do barrel × grep palavra inteira em apps/packages/e2e/infra/tools. 147 nomes sem consumidor fora do pacote; 163 sem consumidor em código de produção (só teste). Destes, a maioria é **sobre-exportação**: o schema é usado internamente (composição) e só o barrel o expõe, ex. `esquemaDePagina` (14 arquivos internos). Possíveis referências dinâmicas: `import * as shared` em `apps/api/test/contratos.test.ts` percorre todos os `esquemaResposta*`; nada mais dinâmico achado.

Suspeitas fortes (nome aparece **uma só vez** no arquivo definidor, sem uso interno nem externo; todos tipos `z.infer`): `PedidoConsultarConvite`, `ProvedorDaEscola`, `PedidoAtivarMfa`, `PedidoRedefinirMfa`, `ResultadoDaLinhaDaLista`, `PedidoSemCorpoDeOperador`, `PedidoConsultarConviteDeOperador`, `TrechoEncontrado`, `MensagemDoUsuario`, `DecisaoDeEntrega`, `PedidoSemCorpo`, `AcertoPorHabilidade`, `ValidacaoDoLote`, `MensagemDoAlunoAoTutor`, `BaixarArquivoDaEscola`, `CorrecaoDeNome`, `TitularDoPedido`. Custo: nulo em runtime, mas cada um é linha no barrel.

Schemas runtime sem consumidor fora do pacote nem dentro do arquivo-fora-composição: `esquemaRespostaSalva` (`atividade/prova.ts:60`, usado só para compor `prova.ts:74` — o nome engana: é item de lista, não resposta HTTP), `esquemaRespostaCorrigida` (`atividade/correcao.ts:136`, idem), `esquemaPedidoDaTurma` (`sala/pedidos.ts:27`, só compõe a página), `esquemaPedidoDeMeusDados` (`privacidade/arquivo.ts:70`, idem). Esses quatro não são mortos, mas o prefixo `esquemaResposta*/Pedido*` contradiz a convenção usada por `contratos.test.ts` (varre `esquemaResposta*`): `esquemaRespostaSalva` e `esquemaRespostaCorrigida` entram na varredura de campo proibido por acidente de nome.

Só testes usam (e quase só nucleo): `opcoesDoClienteRealtime` (só `apps/realtime` teste), `esquemaRespostaJobAceito`, `TAMANHO_MAXIMO_SLUG_NO_LOGIN`, `ehChaveDeFuncao`, `ESTADOS_DE_EXECUCAO`, `TIPOS_DE_SINAL`, `HIPOTESES_DO_ANALISTA`, `ORIGENS_DO_COMPARTILHAMENTO`, `SITUACOES_DA_MINHA_ATIVIDADE`, `ESTADOS_DA_COORDENACAO`. Referência dinâmica possível: `satisfies`/enum em `check` SQL (nucleo importa só o necessário).

Conjunto inteiro suspeito: **contrato do realtime** (`sistema/realtime.ts`, 56 linhas; web não usa, sem eventos).

`matriz.expectativa.ts` não é excluída do `tsc -p tsconfig.build.json` (só `*.test.ts`, `tsconfig.build.json:12`), então vai para `dist` (hipótese; não há `dist` na árvore). Confirmar com `npm run build -w @educa/shared` fora desta análise.

## 10. Duplicação e inconsistência

- **`sessao/` × `operacao/`**: o mesmo desenho escrito duas vezes, com 5 pares: `sessao/eu.ts`↔`operacao/eu.ts`, `sessao/convite.ts`↔`operacao/convite.ts`, `sessao/login.ts`↔`operacao/entrada.ts`, `sessao/renovacao.ts`↔`operacao/sessao.ts`, `sessao/mfa.ts`↔`operacao/segundo-fator.ts` (≈ 260 linhas de operador). Repetem literalmente `const token = z.string().min(1).max(TAMANHO_MAXIMO_TOKEN_DE_CONVITE)` (`sessao/convite.ts:43`, `operacao/convite.ts:4`), `codigoDoAutenticador` (`sessao/mfa.ts:14`, `operacao/segundo-fator.ts:11`) e o regex de recuperação digitada (`mfa.ts:23-30`, `segundo-fator.ts:13-18`). `esquemaTokenDeLink` (`sessao/token.ts`, formato exato de 43 caracteres) existe mas as duas versões de convite não o usam; ficam com `max(128)`. [código]
- **Quatro schemas "corpo vazio"** diferentes: `esquemaPedidoSemCorpo` (`atividade-aplicada.ts:62`), `esquemaPedidoSemCorpoDeOperador` (`operacao/sessao.ts:8`), `esquemaPedidoSemCorpoDoConviteDeProfessor` (`professores.ts:22`), `esquemaPedidoRevogarAcesso` (`sala/acesso.ts:55`). [código]
- Dois estilos de objeto estrito: `z.object().strict()` e `z.strictObject()` misturados (299 usos totais). `z.uuid()` 151 vezes e `z.iso.datetime()` 50 vezes sem alias nomeado de id/instante.
- Dois idiomas de validação nos controllers (inline vs `lerEntrada`) — seção 6.
- Listas TS × `check` SQL repetidas à mão — seção 5.
- Arquivos grandes: `index.ts` 911, `permissao/matriz.ts` 376 + expectativa 446, `privacidade/titular.ts` 224, `privacidade/retencao.ts` 195, `erros/mensagens.ts` 218, `operacao/painel.ts` 252. Pastas maiores: `privacidade` 819 linhas/6 arquivos, `estrutura` 718/10, `assistente` 515. Nenhuma pasta-depósito: cada arquivo ≈ uma tela/rota.
- Nomes que misturam camadas: sessão/MFA/convite tem versão "do operador" em `operacao/`, e `operacao/painel.ts` mistura schemas de painel, convite da coordenação e criação de escola (17 schemas).

## 11. Doc × código

- `docs/arquitetura.md:19` diz "packages/shared tipos e contratos" (e `:31` "dto contrato de saída explícito"); o código também guarda matriz de permissão, catálogos, mensagens e retenção. Doc subdescreve.
- Regra 00 item 6 ("contrato compartilhado em `packages/shared`") **cumprida para HTTP**; **não cumprida** para payload de job (schema local nos dois processadores do worker) nem para os caminhos das rotas.
- Regra 00 item 5 (DTO de saída explícito): cumprida por `esquemaResposta*.strict().parse` nos services; a convenção está só nos comentários, sem lint.
- Comentário de `time/execucao.ts:23` diz que `TAREFAS_DE_IA` é "os mesmos nomes do catálogo da camada de IA"; não achei teste que compare as duas listas. [hipótese; confirma-se lendo `nucleo/src/ia/tarefas/index.ts` e testes]
- `CLAUDE.md`/D12 falam em "realtime para modo sala"; o contrato de shared existe, a web não consome.

## 12. Tamanho, risco e dependências

- 9.262 linhas, 91 arquivos (71 de fonte + 20 de teste, ~7,6 mil de fonte). Último commit no pacote 2026-10-10 (873a1ab); 61 commits no total, 20 desde 01/10: churn alto.
- **Risco de mexer: alto**. Todo schema é lido por api (210 arquivos), web (247) e nucleo (110) e é `.strict()`; mexer em campo quebra os três e as e2e. Não há versionamento. Risco **baixo** para os 17 tipos órfãos e para o contrato do realtime.
- Depende de: zod. Dependem dele: `apps/api`, `apps/web`, `apps/worker`, `apps/realtime`, `apps/despachante`, `packages/nucleo`, `e2e`, `infra`, `tools/ci`. Unidades vizinhas (U-nucleo, U-api, U-web) herdam qualquer mudança aqui.

## 13. Os 5 achados mais importantes

1. A validação de entrada é por convenção: nenhum pipe global, 137 handlers, dois idiomas (21 `safeParse` inline e 61 `lerEntrada`) e nenhuma guarda que reprove controller sem schema (`apps/api/src/estrutura/entrada.ts:36`, `serie.controller.ts:15`).
2. O contrato de payload de job não está em shared: `dados: Record<string, unknown>` (`nucleo/src/fila/enfileirador.ts:12`), produtor monta `{ pedidoId }` à mão e o worker redeclara o mesmo `z.strictObject` em dois processadores (`eliminar-titular.ts:20`, `montar-arquivo.ts:20`).
3. Respostas estritas validadas pela web (`cliente.ts:102`) viram `ERRO_INTERNO` no primeiro campo novo da API: sem versionamento de contrato, o deploy escalonado quebra a web já aberta (conflita com regra 80 item 9).
4. `sessao/` e `operacao/` repetem 5 pares de schemas (token, código TOTP, recuperação, sem-corpo), e o contrato do realtime (56 linhas) não tem consumidor na web; 17 tipos e vários nomes `esquemaResposta*` mal nomeados (`esquemaRespostaSalva`, `esquemaRespostaCorrigida`) engordam um barrel de 911 linhas mantido à mão.
5. O pacote virou também catálogo de domínio (matriz, retenção, classificação de tabelas, mensagens) e fonte de valores dos `check` SQL, que são repetidos à mão sem teste de igualdade (exceto operador e classificação); shared é o ponto de maior churn e risco alto, com 20 testes unitários que deixam `sessao/`, `sistema/` e `professores/` sem cobertura própria.

## Anexo — inventário dos contratos por área

| Área (pasta) | Linhas (sem teste) | Schemas | Principais contratos | Rotas citadas | Testes no pacote | Consumidores (arquivos) |
|---|---|---|---|---|---|---|
| sessao | 381 | 20 | login e-mail/matrícula, convite (consultar/aceitar), MFA, `/v1/eu`, troca de escola, renovação, escola-sessão (inatividade) | 13 | 0 | api 50, web 35 |
| estrutura | 718 | 46 | ano letivo, série, disciplina, turma, lista da turma, vínculo, provedores da escola, paginação, documento-na-matrícula | 22 | 5 arquivos | api 100, web 71, nucleo 22 |
| professores | 109 | 5 | cadastro de professor, convite do professor, lista | 4 | 0 | api 11, web 11 |
| sala | 321 | 14 | acesso da turma (código/link), abrir sala, reivindicar nome, pedidos da turma, decisão, mensagens da sala | 8 | 3 | api 35, web 29 |
| operacao | 435 | 30 | painel (redes, escolas, uso), convite da coordenação, entrada/segundo fator/sessão/convite do operador | 15 | 1 | api 57, web 46 |
| assistente | 515 | 34 | conversa, mensagem, proposta de ferramenta, artefato, entrega/decisão, conteúdo da atividade/plano/adaptação, catálogo de habilidades | 11 | 1 | api 55, web 51, nucleo 34 |
| atividade | 424 | 38 | atividade aplicada, prova do aluno, resposta, correção do lote, validação do professor, desempenho da turma | 12 | 1 | api 49, web 31 |
| tutor | 281 | 17 | mensagem do tutor, memória, sinais, uso do aluno | 5 | 1 | api 27, web 13 |
| governanca | 289 | 19 | funções dos agentes, suspensão, consumo, resumo e alertas do analista | 9 | 1 | api 28, web 22 |
| time | 296 | 10 | agentes e funções (autonomia), execução (estado, tarefa, perfil), chave de envio | 4 | 1 | api 18, web 20, nucleo 22 |
| material | 153 | 8 | material, licença, busca de trechos | 5 | 1 | api 21, web 17, nucleo 14 |
| privacidade | 819 | 23 | pedido do titular, arquivo do titular, retenção, classificação das tabelas, incidente, suboperador, job de eliminação/arquivo | 8 | 3 | api 77, web 52, nucleo 42, worker 11 |
| permissao | 376 (+446 fixture) | 0 | `PAPEIS`, `RECURSOS`, `MATRIZ`, `alcanceDe` | 51 (em comentários) | 1 | nucleo 8, api 5, web 3 |
| erros | 343 | 0 | `CodigoDeErro` (33 códigos), `RespostaDeErro`, `MENSAGENS_DE_ERRO` e mensagens de entrada/convite/MFA | 1 | 1 | web 13, api 2, nucleo 3, e2e muitos |
| sistema | 234 | 8 | saúde, prontidão, estado, avisos, contexto, filas/estados de job, job sintético, realtime | 5 | 0 | api 19, worker 7, realtime 5, despachante 5, web 6 |
