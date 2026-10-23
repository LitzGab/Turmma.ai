# Inventário de fronteiras (contratos)

Etapa 3, pelo Arquiteto em 20/10/2026. Para cada fronteira: onde está o contrato, se é **explícito** (tipo ou esquema
que os dois lados usam) ou **implícito** (formato combinado no código), se é validado na borda e se há teste que o
prove. Marcas: **[código]** · **[doc]** · **[hipótese]**. A unidade de origem vem entre parênteses.

Nenhum contrato é consumido por terceiro de fora do repositório: não há webhook de entrada, SDK público nem API
publicada [código: U01, U04, U05]. Todo contrato abaixo é entre partes do próprio sistema, e por isso **mudar a forma é
possível** desde que os dois lados mudem juntos e o deploy escalonado seja respeitado (P6).

## 1. Resumo

| Fronteira | Contrato | Explícito? | Validado na borda? | Teste de contrato? |
|---|---|---|---|---|
| Web → API: corpo do pedido | `esquemaPedido*` (shared) | sim | **por convenção** (137 handlers à mão) | não há teste de que todo handler valida |
| API → Web: resposta | `esquemaResposta*` `.strict()` (shared) | sim | sim, nos dois lados (`.parse` no service, `safeParse` em `chamarApi`) | `contratos.test.ts` (campos proibidos) |
| Web → API: caminho e método | literais `'/v1/...'` na web × decorators na API | **não** | não | só e2e e integração; `mvp-contratos.md` lista 42 de ~124 rotas |
| Erro HTTP | `CodigoDeErro` (33) + envelope `RespostaDeErro` | sim (código); envelope é interface | sim | catálogo testado; envelope não |
| Permissão | `MATRIZ` + `@Permite(recurso, ação)` | sim | sim, no boot e na guarda | `matriz.test.ts` × cópia à mão |
| Job: `data` no Redis | `esquemaDadosDoJobNaFila` `.strict()` | sim | sim, no worker | indireto (`execucao.int.test.ts`) |
| Job: `tipo` e `dados` | string + `Record<string, unknown>` | **não** | só dentro de cada processador | não |
| Realtime | namespace, caminho, auth em shared | sim | sim (handshake) | `sistema.int.test.ts`; **sem eventos e sem cliente** |
| Provedor de IA | `LLMProvider` + tarefas com esquema de entrada e saída | sim (porta); **implícito** com o servidor do modelo | sim (saída interpretada e revalidada) | servidor falso; nenhum contra modelo real (esperado) |
| Tarefa de IA ↔ catálogo em shared | `TAREFAS_DE_IA` × `nucleo/ia/tarefas` | parcial | `satisfies` no nucleo | [hipótese] sem teste que compare as duas listas |
| Banco ↔ TS | listas `as const` em shared × `check (...)` no SQL | **não** (repetidas à mão) | o banco recusa | só operador e classificação |
| Auditoria | `ACOES_DE_AUDITORIA` (58 ações, zod por ação) | sim | sim | `acoes.test.ts`, `porta-unica.test.ts` |
| Ambiente | zod por área (`validarAmbiente`) | sim | sim, no boot | `config.test.ts` |
| Ambiente no compose | ~70 variáveis repetidas por serviço com `${X:?}` | **não** (só presença) | o compose cai se faltar | testes leem o texto do compose |
| Cookies, chaves Redis, formato do refresh | constantes locais | **não** | — | não |
| Harness (tarefa, revisões, carimbo) | rótulos de markdown lidos por regex | **não** | o hook | testes dos parsers |
| Doc lido por teste | `modelo-de-dados.md`, `interface.md` 9.1/9.10, `runbook.md` | implícito | — | os próprios testes; o vínculo não está escrito |

## 2. HTTP (API ↔ Web)

**O que é forte [código: U01, U07]:** um só lugar de contrato (`packages/shared`), tipos sempre por `z.infer`, a web sem
nenhum esquema ou tipo de resposta redigitado, toda resposta validada na chegada (`apps/web/src/api/cliente.ts:98-102`),
nenhuma URL `/v1` fora de `src/api/`. A saída é `.strict()` e passa por `.parse` no servidor (93 de 96 esquemas de
resposta usados).

**Furos:**
- **Entrada por convenção.** Todo `@Body()`/`@Query()` é `unknown`. 61 usos de `lerEntrada` (`apps/api/src/estrutura/entrada.ts:36-40`)
  e ~24 blocos `safeParse` + `throw ENTRADA_INVALIDA` à mão. Um controller que esqueça o esquema compila e passa
  [código: U01 §6, U04 §6]. → P2.
- **Rotas sem contrato.** A API declara 137 handlers em 54 controllers; a web escreve ~80 literais à mão e liga cada um
  ao esquema na mão. Sem OpenAPI. Trocar a rota quebra só no e2e [código: U01 §6]. Só `docs/mvp-contratos.md` documenta
  (42 rotas = 42 no código, por acaso, sem trava) [código: U12 §6]. → P3.
- **Estrito nos dois lados e deploy escalonado.** Campo novo na resposta faz a web já aberta cair em `ERRO_INTERNO`
  até recarregar, o que contraria "expandir, migrar, contrair" (regra 80.9) [código no padrão; hipótese do efeito:
  U01 §6]. → P6.
- **Corpo do pedido não é validado no cliente** (só tipado). Aceitável: a borda é a API [código: U07 §6].
- **Prefixo `/v1`** é a única versão [código]. Sem changelog nem teste de compatibilidade.
- **Nomes que enganam a varredura:** `esquemaRespostaSalva` e `esquemaRespostaCorrigida` são itens de lista, não resposta
  HTTP, e entram na varredura de `contratos.test.ts` por acidente de nome [código: U01 §9].
- **Duplicação de contrato:** `sessao/` × `operacao/` em shared repetem 5 pares (token de convite, código TOTP, regex de
  recuperação, corpo vazio); 4 esquemas "corpo vazio" diferentes [código: U01 §10].
- **Regra de domínio só no cliente:** prazo legal de 15 dias do pedido do titular (`areas/coordenacao/privacidade/textos-do-pedido.ts:28`),
  "o que dá professor à turma" em 3 arquivos, "escola montada" calculada de listas inteiras [código: U08 §6].

## 3. Erros

- `ErroDeDominio(codigo, status?, tenteDeNovoEmSegundos?)`, sem texto livre; `FiltroGlobalDeErro` monta
  `{codigo, mensagem, requisicaoId}`, troca 403 por 404 e traduz só 23505 e 57014 do Postgres [código: U02 §3].
- O catálogo (`CodigoDeErro`, 33 códigos, alguns de domínio como `TUTOR_PAUSADO_EM_AVALIACAO`) mora em shared e a
  tabela código → status no nucleo (`STATUS_HTTP_DO_CODIGO`).
- `throw new Error(string)` para erro de programação: 25 no nucleo, 52 na API; quatro estilos de "falta contexto"
  [código: U02 §3, §10]. Nenhuma trava (`only-throw-error` desligada) [código: U10 §11].
- `IA_ORCAMENTO_ESGOTADO` está no catálogo e na web, mas só é produzido por uma implementação de teste [código: U03 §8].

## 4. Fila (API ↔ despachante ↔ worker)

| Parte | Forma | Onde |
|---|---|---|
| Enfileirar | `Enfileirador.enfileirar(tx, { tipo, fila, dados: Record<string, unknown> })` | `packages/nucleo/src/fila/enfileirador.ts:12` |
| Linha | `job_registro` (estado, tentativas, `chave_idempotencia`, `codigo_falha`) | `db/schema/job-registro.ts` |
| Mensagem no Redis | `{escolaId, requisicaoId}` `.strict()`; o payload fica no Postgres | `fila/publicacao.ts:29-34` |
| Tipos | 2 em shared (`TIPO_DO_JOB_*`), 4 literais no worker, 1 no nucleo | U06 §6 |
| `dados` por tipo | `z.strictObject({ pedidoId })` **redeclarado** em `montar-arquivo.ts:20` e `eliminar-titular.ts:20`; o produtor monta à mão (`privacidade.service.ts:238`, `expurgo-da-escola.repository.ts:479`). Só o sintético tem esquema em shared | U01, U06 |
| Falha | `CodigoDeFalhaDeJob` (4) em shared; tipo desconhecido vira `TIPO_DESCONHECIDO` em tempo de execução | `executor.ts:185` |
| Política | 5 tentativas, recuo exponencial de 2 s com jitter, igual para todo tipo; sem fila morta | `publicacao.ts:4-18` |
| Fila (`Fila`) | enum em shared **e** `check` no SQL | sem teste que ligue os dois |

**Não há registro tipado `tipo → esquema de dados → processador`**, nem teste de que todo tipo gravado tem processador
[código: U06 §6]. → P1 (a IA, quando for para a fila, vai precisar disso).

## 5. Realtime

Contrato explícito em `packages/shared/src/sistema/realtime.ts` (56 linhas): namespace `/sistema`, caminho, opções do
cliente com reconexão e jitter, esquema da autenticação. O servidor autentica e põe na sala `escola:<id>`. **Não há
nenhum evento definido, nenhum emissor e nenhum cliente na web** [código: U06 §6, U07 §4]. → P7.

## 6. IA (domínio ↔ provedor)

- **Porta explícita e forte** [código: U03 §6]: `LLMProvider.gerar(tarefa, entrada, escolaId)`, implementação única
  `ProvedorDeIa`; 7 tarefas declarativas com perfil, prompt versionado, esquema zod de entrada e saída, conferência e
  versão determinística (`falso`); `esquemaEntradaDaExecucao` e `esquemaResultadoGravado` em shared, união discriminada.
- **Implícitos:**
  - Com o servidor do modelo: só o esquema mínimo da resposta, mais suposições do `llama-server`
    (`chat_template_kwargs.enable_thinking`, `response_format`); `temperature` fixa no código (`adaptador-openai-compat.ts:69,113-118`).
  - Variável `lido` de closure, mutável, compartilhada entre `entrada()` e `aoConcluir()` em 4 serviços: a ordem de chamada é o contrato.
  - A versão do prompt é string manual. `REGRAS_COMUNS` entra em todo prompt, mas a versão dele não é gravada no consumo.
  - `levaTextoDeAluno` (D62) é declarado em toda tarefa e **nenhum código de produção o lê** [código: U03 §11].
  - `consumo_ia` tem dois escritores: `ProvedorDeIa` e um insert direto em `tutor.service.ts:342` (regra fixa).
- **Listas repetidas no SQL:** funções e tarefas em `check` de `consumo_ia` e `execucao_agente`: tarefa nova exige migration.

## 7. Banco ↔ código

- Listas TS repetidas à mão em `check (...)`: `ano_letivo`, `material`, `serie`, `execucao`, `job_registro`, `consumo_ia`
  (ao menos 6 comentários "o check repete a lista") [código: U01 §5]. Igualdade provada por teste só para
  `FORMATO_OPERADOR` e para a classificação das tabelas.
- Gatilhos e detalhes fora do Drizzle (0013, 0022, 0023, 0032; `fillfactor`; FKs `NOT VALID`) [código: U02 §5].
- Tabela nova com dado de pessoa: 7 registros paralelos, amarrados por testes de arquitetura (MAPA §4).

## 8. Auditoria, permissão e ambiente

- **Auditoria:** a melhor fronteira do sistema. Porta única `RegistroDeAuditoria.gravar(tx, acao, dados)`, catálogo fechado
  de ações com zod por parte, campos de pessoa proibidos, `insert` fora do barril, teste que varre outras escritas
  [código: U02 §3].
- **Permissão:** `MATRIZ` em shared tipa `@Permite`; o boot recusa rota sem marca; `matriz.test.ts` compara com
  `matriz.expectativa.ts` (446 linhas, cópia à mão de propósito, para pegar mutação) [código: U01 §3].
- **Ambiente:** zod por área no boot, com erro que cita só o nome da variável [código: U02 §6]. No compose, ~70
  variáveis repetidas por serviço, sem esquema único; `.env.example` (231 linhas) é a fonte; a versão do Node aparece em
  4 lugares [código: U10 §6, §10].

## 9. Contratos implícitos do harness (Etapa 9)

O hook de commit e o cálculo de fase leem texto livre por regex [código: U11 §6]: `**Subagentes obrigatórios:**`,
`**Porte:**`, primeira linha `Tarefa: <caminho>` do prompt do revisor, tabela `| Início | Fim | Revisor |`, blocos
```` ```mutacao ````, linha `ressalvas aceitas por`, título do roadmap `## X<n> — \`nome\` [ ]`, `Revisões:` no commit,
`## Decisões em aberto` do `CLAUDE.md`. Mudar a redação de uma skill pode quebrar o hook sem aviso [hipótese]. As
mensagens entre agentes (`/seguir RELATÓRIO`, `PEDIDO`, `ORDEM DE CORREÇÃO`) não têm validador.

## 10. Documento como contrato executável

Testes que leem documentação [código: U12 §3]: `arquitetura.test.ts:997` (exceções de `modelo-de-dados.md`),
`contraste.test.ts:35` e `estilos.test.ts:65` (`interface.md` 9.1 e 9.10), `alerta-tem-runbook.test.ts` (`runbook.md`).
Editar esses documentos quebra a esteira; isso não está escrito em lugar nenhum. Na Etapa 11, cada um precisa dizer que
é lido por teste.
