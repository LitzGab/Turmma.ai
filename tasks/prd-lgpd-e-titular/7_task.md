# Tarefa 7.0 — Cada chamada externa de IA registra o provedor que a atendeu

**Funcionalidade:** lgpd-e-titular · **Depende de:** nenhuma · **Paralelo com:** 1.0 a 6.0, 8.0 a 10.0
**Subagentes obrigatórios:** `llm-integrator`, `infra-guardian`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O consumo de IA passa a gravar `provedor` quando há envio externo, com o tipo da porta unindo `envioExterno` e `provedorId`, sem nunca falhar o registro por causa dele.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seção 3 ("`consumo_ia.provedor`" e a contração fora do F3)
- `.claude/rules/30-ia.md`
- Código: `packages/nucleo/src/config/config-ia.ts`, `ia/provedor.ts`, `ia/adaptador.ts`, `ia/adaptador-openai-compat.ts`, `ia/__fixtures__/adaptador-roteirizado.ts`, `apps/api/src/ia/consumo.repository.ts`
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [x] 7.1 — `IA_PROVEDOR_ID` no `esquemaAmbienteDeIa`, obrigatória com `openai_compat` sem processamento local
- [x] 7.2 — Tipo da porta `{ envioExterno: true; provedorId } | { envioExterno: false; provedorId: null }`; o fixture ganha id
- [x] 7.3 — Migration própria: `consumo_ia.provedor` com `check (provedor is null or envio_externo)`; sobe junto com o código
- [x] 7.4 — `MedicaoDaGeracao`, `ConsumoDeIa` e `ConsumoRepository` levam o valor
- [x] 7.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `config-ia.ts`, `provedor.ts`, `adaptador*.ts`, fixture | alterado |
| migration e `consumo-ia.ts` | alterado |
| `consumo.repository.ts` | alterado |
| `.env.example` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| configuração | unidade | subida recusada sem a variável e com formato inválido |
| provedor resolvido | unidade | nulo no falso, local, `regra_fixa` e zero tentativas; o id no externo com servidor falso |
| tipo | unidade | `@ts-expect-error` nos dois pares inválidos |
| banco | integração | `provedor` sem envio externo recusado; formato antigo aceito |
| gravação | integração | grava o `provedor`; a soma da governança não muda; nunca falha pela coluna |

## Como testar

- **configuração:** `packages/nucleo/src/config/config-ia.test.ts › openai_compat sem endereço…` (`erroDe`, `MOTIVO_*`). Armadilha: o `LLAMA` do arquivo é externo e sem id; `› em produção o adaptador falso é recusado` e `› por padrão a chamada conta como envio externo` passam a exigir `IA_PROVEDOR_ID`.
- **provedor resolvido:** `packages/nucleo/src/ia/provedor.test.ts › assunto delicado não passa pelo orçamento` (regra fixa, zero tentativas, `AdaptadorRoteirizado`); externo: `adaptador-openai-compat.test.ts › fora da nossa rede…` (`subirServidorLlamaFalso`).
- **tipo:** `apps/web/src/componentes/ia/assinatura.test.ts › não aceita agente e função juntos`.
- **banco:** `packages/nucleo/src/db/schema/mvp/tabelas-do-mvp.int.test.ts › o consumo guarda como a chamada terminou` (`consumir`, `recusa`).
- **gravação:** `apps/api/src/ia/ia.int.test.ts › grava na escola do registro…` (`consumoDe`); soma: `apps/api/src/governanca/governanca.int.test.ts › soma por função, no mês…`. "Nunca falha": sem precedente; o mais próximo é `ia.int.test.ts › nas funções do Tutor…`.
- Rodar: `npx vitest run --project unidade <arquivo>`; `--project integracao` nos `.int.test.ts`.

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

A contração que exige `provedor` (release posterior ao F3, `TODO.md`).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|
| Nenhuma contradiz a Tech Spec. Duas decisões de forma que ela não dizia, registradas em «Tarefa 7.0, como ficou no código»: o adaptador expõe `envio: EnvioDaChamada` no lugar de `envioExterno`, e o construtor do `AdaptadorOpenAICompat` repete a exigência do `IA_PROVEDOR_ID` | uma classe não implementa união, e o tipo da porta só garante o par se o adaptador também o trouxer em par; quem monta a configuração à mão não passa pela subida | `techspec.md` §3, «`consumo_ia.provedor`», item «Tarefa 7.0, como ficou no código»; `docs/modelo-de-dados.md` (`ConsumoIa`) e `docs/lgpd.md` (item 4 da seção de IA) |

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|
| `config-ia.ts` › `esquemaAmbienteDeIa` › `IA_PROVEDOR_ID: opcional(z.string().regex(FORMATO_DO_PROVEDOR_ID).optional())` (sem o `regex`) | `config-ia.test.ts › fora da nossa rede, o provedor precisa de id…` |
| `config-ia.ts` › `superRefine` › `valores.LLM_PROCESSAMENTO_LOCAL !== 'true' &&` (termo apagado) | `config-ia.test.ts › com processamento local não há provedor a declarar…` e `› .env.example e o ambiente de teste sobem…` |
| `config-ia.ts` › `superRefine` › `valores.IA_PROVEDOR_ID === undefined` (trocado por `false`) | `config-ia.test.ts › fora da nossa rede, o provedor precisa de id…` e `apps/api/src/config.test.ts › a camada de IA é lida aqui…` |
| `config-ia.ts` › `superRefine` › `valores.AMBIENTE !== 'local' &&` (termo apagado) | `config-ia.test.ts › o id de exemplo do .env.example só vale em local…` |
| `config-ia.ts` › `superRefine` › `valores.IA_PROVEDOR_ID === PROVEDOR_ID_DE_EXEMPLO` (trocado por `false`) | `config-ia.test.ts › o id de exemplo do .env.example só vale em local…` |
| `config-ia.ts` › `superRefine` › `valores.LLM_PROCESSAMENTO_LOCAL !== 'true' &&` da linha do exemplo (termo apagado) | `config-ia.test.ts › o id de exemplo do .env.example só vale em local…` (o caso com processamento local em produção) |
| `config-ia.ts` › `lerConfiguracaoDeIa` › `...(valores.IA_PROVEDOR_ID === undefined ? {} : { provedorId })` (apagada; e trocada por `provedorId: … ?? ''`) | `config-ia.test.ts › fora da nossa rede…`, `› com processamento local não há provedor…`, `› o modelo local…`; `config.test.ts › a camada de IA…` |
| `adaptador-openai-compat.ts` › construtor › `if (config.processamentoLocal) this.envio = SEM_ENVIO_EXTERNO` (trocada por `false`) | `adaptador-openai-compat.test.ts › com processamento local não há provedor…` e mais 40 do arquivo |
| `adaptador-openai-compat.ts` › construtor › `else if (config.provedorId === undefined) throw` (trocada por `false`) | `adaptador-openai-compat.test.ts › fora da nossa rede o adaptador não nasce sem o id do provedor…`; e `› o erro lançado traz o motivo` no mesmo caso, sem o 2º argumento de `ConfiguracaoInvalida` |
| `provedor.ts` › `medir` › `gasto.tentativas > 0 ? adaptador.envio : SEM_ENVIO_EXTERNO` (a condição trocada por `true`) | `provedor.test.ts › a falha antes de qualquer chamada não conta como envio…` e `› assunto delicado não passa pelo orçamento…` (adaptador externo, regra fixa) |
| `provedor.ts` › `medir` › o mesmo ramo, com `!regraFixa` no lugar de `tentativas > 0` | `provedor.test.ts › a falha antes de qualquer chamada não conta como envio…` |
| `provedor.ts` › `medir` › o ramo inteiro trocado por `SEM_ENVIO_EXTERNO` | `provedor.test.ts › a chamada que falhou depois de sair…`, `› com envio externo, o id do provedor…`; `adaptador-openai-compat.test.ts › fora da nossa rede, a medição e o registro…` |
| `adaptador-falso.ts` › `envio` › `SEM_ENVIO_EXTERNO` (trocado por um par externo) | `provedor.test.ts › devolve a saída da tarefa já validada…` |
| `__fixtures__/adaptador-roteirizado.ts` › construtor › `envioExterno ? {…} : SEM_ENVIO_EXTERNO` (sempre externo) | `provedor.test.ts › com envio externo, o id do provedor…` |
| `consumo.repository.ts` › `registrar` › `provedor: consumo.provedorId` (apagada) | `ia.int.test.ts › ConsumoRepository … grava o provedor de quem recebeu o conteúdo…` |
| `consumo-ia.ts` e migration `0028` › `check consumo_ia_provedor_so_no_envio_externo` (derrubado no banco de teste) | `tabelas-do-mvp.int.test.ts › o provedor só existe onde houve envio externo…` |
| `porta.ts` › `EnvioDaChamada` e `consumo.ts` › `ConsumoDeIa` › o par em união (campos soltos) | os quatro `@ts-expect-error` de `provedor.test.ts › o tipo da porta só aceita os dois pares…` (o `tsc` reprova o que ficaria sem erro); `tutor.service.ts` sem `provedorId: null` também reprova o `tsc` |

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª), privacy-guardian (1ª), llm-integrator (1ª) | Teste de integração de ponta a ponta: `ProvedorDeIa` com adaptador externo gravando pelo `ConsumoRepository` no Postgres | Recusada: o `AdaptadorRoteirizado` externo mora em `packages/nucleo/src/ia/__fixtures__/` e não é exportado por `@educa/nucleo`, então o teste de `apps/api` teria de importá-lo por caminho relativo entre pacotes. O elo entre as duas metades é o tipo (`ConsumoDeIa` recebe o resultado de `medir` sem conversão, e os quatro `@ts-expect-error` de `provedor.test.ts` o prendem), e as duas metades estão provadas |
| test-engineer (1ª), privacy-guardian (1ª), revisor-geral (1ª) | Check de formato no banco: `provedor is null or provedor ~ '^[a-z][a-z0-9_-]{1,39}$'` | Tarefa 8.0 (nasce `suboperador.chave`, com que o `provedor` é cruzado): o check entra lá, em migration própria, se o cruzamento exigir. Aqui mudaria a migration `0028` e o snapshot, contrato que a rodada não pode alterar; o valor só tem uma origem (a subida, que confere o formato) |
| infra-guardian (1ª), llm-integrator (1ª) | `infra/compose.yml`: trocar `${IA_PROVEDOR_ID:?…}` por `${IA_PROVEDOR_ID:-}` | Recusada: `tools/ci/ambiente.test.ts` proíbe o padrão `:-`, e com o item 3 o placeholder do `.env.example` já não grava provedor falso fora de `local`. A nota da Tech Spec foi corrigida no item 2 |
| test-engineer (2ª) | Caso com `IA_ADAPTADOR=falso` em staging e o valor de exemplo, para prender que a recusa só vale com `openai_compat` | Recusada: cobertura extra, não bloqueia; a recusa está depois do `return` de `IA_ADAPTADOR !== 'openai_compat'` em `config-ia.ts`, e só voltaria a importar se alguém movesse essa linha |
| revisor-geral (2ª) | O teste ler `provedor-de-exemplo` do `.env.example` em vez de repeti-lo, e juntar as duas condições num `if` | Tarefa 8.0 (cruzamento do `IA_PROVEDOR_ID` com `suboperador.chave` na subida): a guarda do literal passa a ser coberta de vez ali; a fusão dos `if` é só estilo |
| privacy-guardian (2ª) | Citar o professor como titular indireto na linha "Consumo de IA por aluno" de `docs/lgpd.md`, ou remeter à linha 85 | Tarefa 15.0 (eliminação do titular), que revê as linhas do mapa por titular; `provedor` não identifica o professor, porque `consumo_ia` não tem coluna de usuário (D64) |
| privacy-guardian (2ª), llm-integrator (2ª), infra-guardian (2ª) | Quando `suboperador.chave` nascer, conferir que `provedor` / `IA_PROVEDOR_ID` corresponde a um suboperador cadastrado | Tarefa 8.0 |
| privacy-guardian (2ª) | Conferir no `/validar` que o portão completo cobre o caminho real `ProvedorDeIa` → `ConsumoRepository` | Validação da spec (já recusado o teste de ponta a ponta, com motivo, na rodada 1) |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-09 09:41:52 | 2026-10-09 09:44:05 | `test-engineer` | 1 | APROVADO | ae5bd56bfc4eb0f2a |
| 2026-10-09 09:44:24 | 2026-10-09 09:45:17 | `infra-guardian` | 1 | APROVADO | a1bd16f61da99c0f5 |
| 2026-10-09 09:44:28 | 2026-10-09 09:45:22 | `privacy-guardian` | 1 | REPROVADO | a32b4cbfab735a6f9 |
| 2026-10-09 09:44:20 | 2026-10-09 09:45:44 | `llm-integrator` | 1 | APROVADO | a99d1de863f0511a4 |
| 2026-10-09 09:44:16 | 2026-10-09 09:46:26 | `revisor-geral` | 1 | REPROVADO | a2226939368b42af3 |
| 2026-10-09 09:52:04 | 2026-10-09 09:53:03 | `test-engineer` | 2 | APROVADO | a865fbdd9060537e9 |
| 2026-10-09 09:53:16 | 2026-10-09 09:53:41 | `privacy-guardian` | 2 | APROVADO | ac8ca0d4ae115459d |
| 2026-10-09 09:53:29 | 2026-10-09 09:53:55 | `llm-integrator` | 2 | APROVADO | a3f8993f381416d34 |
| 2026-10-09 09:53:23 | 2026-10-09 09:53:55 | `revisor-geral` | 2 | APROVADO | a07be8241969431a2 |
| 2026-10-09 09:53:36 | 2026-10-09 09:54:05 | `infra-guardian` | 2 | APROVADO | af2a95ecf3af52a05 |
