# Achados das revisões — `tasks/prd-harness/revisao-spec.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · REPROVADO · 2026-10-23 11:50:02 · `tasks/prd-harness/revisao-spec.md`

VEREDITO: REPROVADO

Tabelas verificadas: nenhuma tabela de escola nasce na X7 (Tech Spec §3). Conferi se cada padrão da tabela da §5(b) existe no repositório. Todos existem: `packages/nucleo/drizzle/`, `packages/nucleo/src/db/schema/`, 72 `*.repository.ts`, 55 `*.controller.ts`, `apps/api/src/privacidade`, `packages/nucleo/src/{titular,retencao,log,auditoria,fila,limite,redis,ia}`, `apps/api/src/{tutor,entrega,atividade,governanca,ia,sessao,credencial,sala}`, `apps/{worker,despachante,realtime}/src` e `infra/`. Nenhum padrão fica sem arquivo.

Queries verificadas: procurei em `apps/*/src` e `packages/*/src` onde nasce query, endpoint ou escopo de escola fora de `*.repository.ts` e `*.controller.ts`. Encontrei:
- **Query com escopo de escola, com SQL cru:**
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/packages/nucleo/src/titular/homonimo.ts:17`
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/packages/nucleo/src/titular/troca-de-nome.ts:158` e `:161`, um `update` em massa com `where escola_id = ...`
- **Endpoint WebSocket:**
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/apps/realtime/src/sistema.gateway.ts:22` e `:41`, que entra na sala da escola.
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/apps/realtime/src/autenticacao-do-handshake.ts:107-108`, que tira a escola da sessão.
- **O próprio mecanismo de escopo:**
  - `packages/nucleo/src/contexto/escola-do-contexto.ts` (`exigirEscolaDoContexto`)
  - `packages/nucleo/src/db/sem-escopo.decorator.ts`
  - `packages/nucleo/src/identidade/guarda-sessao.ts` e `token-da-requisicao.ts`
  - `packages/nucleo/src/permissao/guarda-permissao.ts`
  - `packages/nucleo/src/entrada/id.pipe.ts`, que valida o UUID (item 6)
- **`@SemEscopo` fora de repository:**
  - `packages/nucleo/src/uso/contador-uso.ts:101`
  - `apps/worker/src/storage/medidor-de-storage.ts:49`
  - `packages/nucleo/src/ia/executor.ts:47`
- **Contrato de entrada que recusa `escolaId` vindo do corpo:** `packages/shared/src/sala/pedidos.ts:45`, `sala/acesso.ts:45` e `professores/professores.ts:9`.

Teste de isolamento: não se aplica a esta spec (§10). O teste do RF15 previsto na §10 ("casos novos de guardião por caminho") é efetivo para `*.repository.ts`, mas não cobre os caminhos acima.

Bloqueantes:
1. **Tech Spec §5(b) (RF15): a tabela não exige a rodada do `tenancy-guardian` em todo commit que cria query, endpoint ou escopo.** A regra 10 tem veto. Pela tabela de hoje:
   - `homonimo.ts`, `troca-de-nome.ts` e `leitura-do-titular.ts` chamam só o privacy (linha `titular/**`).
   - `sistema.gateway.ts` e `autenticacao-do-handshake.ts` chamam só o infra (linha `apps/realtime/src/**`).
   - `contexto/`, `identidade/` (fora do `sessao.repository.ts`), `permissao/`, `entrada/`, `db/sem-escopo.decorator.ts`, `db/banco.ts`, `uso/` e `packages/shared/src/**` não chamam guardião nenhum.

   Na prática, um commit que faça `exigirEscolaDoContexto` ler a escola de um cabeçalho, que tire o `.strict()` de um contrato de entrada ou que ponha um `@SemEscopo` num serviço passa sem a minha rodada. Esses são os itens 2, 3 e 8 da minha lista.

   **Correção exigida, uma das duas:**
   - (a) Somar à linha do tenancy na §5(b): `packages/nucleo/src/{contexto,identidade,permissao,entrada,uso}/**`, `packages/nucleo/src/db/**` (no lugar de só `db/schema/**`), `packages/nucleo/src/titular/**`, `**/*.gateway.ts`, `apps/realtime/src/autenticacao-*.ts` e os contratos de entrada em `packages/shared/src/**`.
   - (b) Ou declarar um gatilho por conteúdo no diff do commit: um arquivo de produção que importa `drizzle-orm`, usa `` sql` ``, ou acrescenta `@SemEscopo`, `@Controller`, `@WebSocketGateway` ou `@SubscribeMessage` exige o tenancy.

   Nos dois casos, acrescentar à §10 um caso de teste fora de `*.repository.ts`, por exemplo um `homonimo.ts` alterado sem tenancy marcado e recusado, e um teste do harness de que cada padrão da tabela casa com ao menos um arquivo existente.

Pontos que ficam garantidos, sem bloqueante:
- A regra 10 continua carregando sempre: a tabela de `paths:` da §9 não a inclui, a §11 diz que ela carrega sempre, e o RF20 tem teste de que as sempre carregadas são {10, 20, 70}.
- O veto não afrouxa: o PRD §3 deixa o veto fora de escopo, o teto de três da D79 vale só para o que o Arquiteto marca (§5b), e o obrigatório é a união da marcação com o caminho.

Recomendações:
- §5(a): o `git diff --cached --name-only` detecta renomeação por padrão e devolve só o caminho novo. Um `x.repository.ts` renomeado para `x.ts` escapa da tabela. Usar `--no-renames` ou listar os dois lados.
- §5(b): a exclusão de `*.test.*` tira do tenancy o commit que só enfraquece um teste de isolamento existente (`*.int.test.ts` com 404 cruzado). Considerar exigir o tenancy em teste que já carrega o caso de isolamento.
- §12: se o `CLAUDE_CODE_AGENT` não chegar ao Bash do papel, o `commit-msg` sai 0 e o RF15 fica só no `PreToolUse`. A 1.0 precisa provar isso antes de o RF15 ser declarado coberto pelo hook nativo.
- §5(b): o casamento de `{a,b}` depende do matcher do `guardioes-por-caminho.ts`, que a spec não nomeia. O teste do bloqueante (cada padrão casa com algo) cobre isso.
- RF21 e RF25: a deduplicação de blocos entre revisores e a migração de texto das regras não podem tocar a lista "O que verificar" do `tenancy-guardian` nem a seção "As regras" da regra 10. Declarar isso no item da §2 que altera `.claude/agents/`.

## privacy-guardian · 1ª rodada · REPROVADO · 2026-10-23 11:50:09 · `tasks/prd-harness/revisao-spec.md`

VEREDITO: REPROVADO

A X7 não cria campo de pessoa, não grava dado de pessoa e mantém a regra 20 carregando sempre. Mas a tabela "caminho → guardião" da §5(b) não cumpre o que o RF15 e o PRD §8b prometem. A maior parte da superfície da regra 20 fica sem a minha rodada obrigatória. E a própria tabela, junto com as guardas de lint que garantem a regra 20, pode ser alterada sem ela.

**Campos pessoais tocados:** nenhum. Não há tabela, rota nem IA (§3, §4, §7, §7b). O ensaio do RF31 usa dado sintético (PRD §8).

**Fora da tabela de dados do `docs/lgpd.md`:** nada, porque nenhum campo novo nasce.

**Autorização por objeto:** não se aplica, porque a spec não cria rota. Hoje ela é cobrada só pelo `tenancy-guardian`, em `**/*.controller.ts` e `**/*.repository.ts` (§5(b)). O que entra no DTO de saída e na autorização de leitura não aciona a minha rodada (bloqueante 1).

**Logs:** limpos no desenho. O que a X7 grava:
- `.processo/conteudo.json`: caminho e sha256 (já é assim hoje, `tools/processo/revisoes.ts:134-140`).
- `.processo/portao.json`: início, suítes, alvos e impressão das mutações (`revisoes.ts:76-83`).
- `.processo/hook-congelado/`: só cópia de código (§5(c)).
- `.processo/limpeza.json`: marca `pedida` ou `feita` (§5(g)). A spec não diz quais campos, só que guarda esses estados.
- `--censo`: título de caso e duração tirados do relatório do Playwright da esteira, que só tem dado sintético (§5(f)).
- O hook `UserPromptSubmit` (§5(h)) recebe o texto inteiro que o Joaquim cola. A spec não diz se ele grava algo (ver recomendações).

**Auditoria:** não se aplica, porque nenhuma ação auditável nasce aqui.

**Envio externo:** nenhum novo. O `--censo` só lê artefato que a esteira já guarda.

**Seed/fixture:** sintético (PRD §8). O que fica sem cobrança: a §5(b) tira da conta `*.test.*` e `e2e/**`, e `apps/web/src/__fixtures__` também não está na tabela. Fixture com dado real não pediria a minha rodada (recomendação).

**Regra 20 carregando sempre:** sim. O `paths:` entra só nas regras 00, 40, 60 e 80 (§9), e a regra 20 continua sem ele. O RF20 traz um teste de que as regras sempre carregadas são exatamente {10, 20, 70}, e a §11 confirma. O conflito do `lgpd-brasil` fica escrito no `SKILL.md` dela e é reaplicado por teste depois do `npx skills update` (§9). Está garantido.

**Bloqueantes:**

1. **Tech Spec §5(b), tabela do RF15.** A tabela não faz o hook exigir a minha rodada em boa parte do que toca dado de pessoa, log, storage, exportação, autorização de leitura ou envio externo. Hoje esses caminhos pedem só outro guardião ou nenhum. Conferi cada um no repositório:

   | Caminho | O que tem lá | Hoje pede |
   |---|---|---|
   | `packages/nucleo/src/ia/**` (`adaptador-openai-compat.ts`, `prompts/`, `executor.ts`) | envio ao provedor externo | só conformidade |
   | `apps/api/src/ia/**` (`execucao.repository.ts`) | registro em `ExecucaoAgente` | só conformidade |
   | `apps/api/src/tutor/**` | conversa de tutor (regra 20.14) | só conformidade |
   | `apps/api/src/assistente/**` (`conversa.repository.ts`) | conversa do professor e envio ao provedor | nenhum guardião |
   | `apps/worker/src/processadores/**` (`eliminar-titular.ts`, `expurgar-dado-pessoal.ts`, `montar-arquivo.ts`, `sintetico.ts`) | eliminação, expurgo, exportação e dado sintético | só infra |
   | `apps/worker/src/storage/**` | storage | só infra |
   | `apps/api/src/artefato/**` (`pdf-do-artefato.ts`) | exportação | não está na tabela |
   | `apps/api/src/material/**` (`recebimento.ts`) | storage | não está na tabela |
   | `packages/nucleo/src/convite/**`, `apps/api/src/sessao/convite`, `apps/api/src/operacao/convite`, `apps/api/src/operacao/token-do-convite.ts` | convite (regra 20.8) | só infra, ou nada |
   | `apps/api/src/sessao/externa/**`, `apps/api/src/credencial/**` | descarte do e-mail e da foto do provedor (D48, regra 20.2), matrícula, `registro-de-acesso.repository.ts` | só infra |
   | `packages/nucleo/src/identidade/**`, `packages/nucleo/src/permissao/**` | autorização de leitura, alteração de permissão | não está na tabela |
   | `packages/nucleo/src/erro/**` (`filtro-global.ts`, `resumir-erro.ts`) | erro sem stack trace (regra 20.11) | não está na tabela |
   | `packages/nucleo/src/telemetria/**` | exporta métricas por OTLP para fora do processo (`iniciar.ts:67`) | não está na tabela |
   | `packages/nucleo/src/ciclo-de-vida/**` | fim de vínculo, exclusão lógica (regra 20.15 e 20.18) | não está na tabela |
   | `apps/api/src/estrutura/**` (`lista/leitor-da-lista.ts`) | importação de nomes de aluno | só tenancy, e só em controller e repository |
   | `apps/api/src/sala/**` (`reivindicacao/`), `apps/realtime/src/**` | lista de nomes na reivindicação, sala ao vivo, autenticação do handshake | só infra |
   | `apps/api/src/ops/**`, `apps/api/src/operacao/**` | operação de privacidade e retenção; painel que não pode ver pessoa (D76) | não está na tabela |
   | `packages/shared/src/**` | contratos de saída, onde mora o "DTO de saída explícito" | não está na tabela |

   O furo pior: um commit que acrescenta `matricula` a um contrato de `packages/shared/src/tutor` e o service que o preenche, sem migration, não pede guardião nenhum.

   **Correção exigida:** pôr `privacy` em todas as linhas acima, somado ao guardião que elas já têm. Em `packages/shared/src/**`, pode tirar só `erros/` e `sistema/`, se o Arquiteto quiser.

   Prova exigida na §10: em `revisoes.test.ts`, ao menos um caso por linha da tabela, com bloco de mutação. Por exemplo: `packages/nucleo/src/ia/adaptador-openai-compat.ts` alterado sem `privacy-guardian` marcado é recusado.

2. **Tech Spec §5(b) e §5(e), RF16.** A tabela que cobra os vetos e as guardas de máquina da regra 20 ficam em `tools/`. Pelo RF16, mudança ali pede só `revisor-geral` e `test-engineer`. Assim um commit pode tirar `privacy` de uma linha de `tools/processo/guardioes-por-caminho.ts`. Também pode afrouxar `tools/guardas/regras-log.mjs` (regra 20.9), `tools/guardas/regras-erro.mjs` (regra 20.11) ou o `eslint.config.mjs` que os liga. Em nenhum desses casos a minha rodada é exigida. É a regra 20 deixando de ser cobrada por máquina sem que o guardião dela veja.

   **Correção exigida:** acrescentar à tabela:
   - `tools/processo/guardioes-por-caminho.ts` → tenancy, privacy, conformidade e infra.
   - `tools/guardas/regras-log.mjs`, `tools/guardas/regras-erro.mjs` e `eslint.config.mjs` → privacy.
   - `tools/guardas/regras-tenant.mjs`, `tools/guardas/escopo-dos-repositories.ts` → tenancy.
   - `tools/guardas/regras-ia.mjs` → conformidade.

   E um caso de teste que prove o primeiro: alterar a tabela sem as quatro rodadas é recusado.

**Recomendações:**
- **§5(h):** escrever que o hook `UserPromptSubmit` só testa o prefixo `/seguir ` e não grava nem registra o texto colado.
- **§5(g):** escrever os campos de `.processo/limpeza.json`: estado, instante e terminal, nada mais.
- **§5(b):** a exclusão de `*.test.*` e `e2e/**` deixa sem a minha rodada os testes que provam a regra 20. Exemplos: `tools/guardas/definicoes-de-job.test.ts` ("payload de job é só id") e o teste de que a rede não alcança conversa. Também deixa as fixtures, que precisam ser sintéticas (regra 20.17). Vale considerar uma de duas saídas:
  - não tirar da conta o teste cujo nome cita a regra 20;
  - uma guarda barata na esteira, que procure padrões de CPF, e-mail e telefone em `e2e/**` e em `**/__fixtures__/**`.
- **RF16 e §9:** `.claude/rules/20-lgpd-menores.md`, `.claude/agents/privacy-guardian.md` e `docs/lgpd.md` continuam sendo documento, então o papel pode alterá-los sem rodada. Isso é decisão do Joaquim (D53). Mesmo assim, vale ele confirmar que o texto da regra com veto e o checklist do guardião dela podem mudar sem revisão.
- **`achados/`:** fica no git (PRD §3), e o repositório é público. Com o RF15 haverá mais rodadas minhas, e mais texto de achado entra no repositório. Isso só é aceitável enquanto todo dado de desenvolvimento for sintético. Vale uma linha no `docs/processo-licoes.md` lembrando que achado cita `arquivo:linha`, nunca o valor.

Arquivos lidos:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/techspec.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/prd.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tools/processo/revisoes.ts`
[… 2 linhas cortadas]

## conformidade-reviewer · 1ª rodada · REPROVADO · 2026-10-23 11:51:43 · `tasks/prd-harness/revisao-spec.md`

VEREDITO: REPROVADO

Caminhos de escrita em Nota: a X7 não cria nenhum. Hoje não existe tabela `nota` (`packages/nucleo/src/db/schema/correcao.ts:13`). O único caminho equivalente é a aprovação do lote: `correcao.repository.ts:282` grava `validacao_do_lote`, e `confirmada_por` é conferido por gatilho no banco, com o gatilho adiado de `entrega`. A spec não mexe nisso. Todos com autor humano? sim. Mas a trava mora em `packages/nucleo/drizzle/**` e `db/schema/**`, e a tabela do §5(b) não manda essas pastas ao `conformidade-reviewer` (bloqueante 1).

Decisão autônoma sobre aluno: ausente. É spec do harness, sem IA no caminho do aluno (§7b).

Aprovação registrada: ok. A spec não cria saída de IA. O fluxo que já existe (`apps/api/src/artefato/**`, item 3) fica fora da cobrança por caminho (bloqueante 1).

Supervisão do tutor: ok no desenho. `apps/api/src/tutor/**` está na tabela; as telas do tutor e dos sinais em `apps/web/src` não estão (bloqueante 1).

Autonomia declarada e visível: sim no produto, que a X7 não altera. Mas a declaração em código (`packages/shared/src/time/funcoes.ts`) e a tela da coordenação (`apps/web/src/areas/coordenacao/governanca/**`, com `nunca-faz.ts`, o nível 4) ficam fora da tabela.

**Respostas às perguntas do contexto**
- **A regra 70 continua carregando sempre?** Sim. O RF20 (`prd.md:80`) e o §11 (`techspec.md:181`) mantêm 10, 20 e 70 sempre carregadas, e só 00, 40, 60 e 80 ganham `paths:` (§9). O teste do RF20 prova o conjunto {10, 20, 70}.
- **A ressalva menor da validação passa sem o Joaquim?** Não passa como violação. `validador.md:136-138` classifica violação das regras 10, 20 e 70 como CRÍTICO, que continua parada. O pouso também continua parada do Joaquim. O que vira aviso é só o MENOR ("melhoria, recomendação de revisor sem destino, texto"). Ficam duas brechas de texto, listadas nas recomendações.
- **A tabela cobre tudo da regra 70?** Não. Cobre `apps/api/src/{tutor,entrega,atividade,governanca,ia}` e `packages/nucleo/src/ia/**`, onde estão as políticas (`tarefas/turno-do-tutor.ts`, `tarefas/propor-ferramenta.ts`). Deixa de fora o que está nos bloqueantes abaixo.

Bloqueantes:
1. **`techspec.md:71-77` (§5(b), linha da conformidade): a tabela deixa de fora código da regra 70 que existe hoje.** Por isso o §7b (`techspec.md:119`) e o §11 (`techspec.md:181`) dizem que "o RF15 cobra o `conformidade-reviewer` pelo caminho", e isso não é verdade para estes caminhos:
   - `packages/nucleo/drizzle/**` e `packages/nucleo/src/db/schema/{correcao,validacao-do-lote,entrega,artefato,sinal-tutor,mensagem-tutor,resumo-do-analista,suspensao-de-funcao,execucao-agente,thread-agente,mensagem-agente}.ts`. É onde a validação humana e o "não é Nota" são garantidos por construção. Hoje vão só para tenancy, privacy e infra.
   - `packages/shared/src/**`, que não aparece em linha nenhuma:
     - `time/funcoes.ts`: a autonomia declarada (item 5).
     - `atividade/correcao.ts`: nenhum campo de nota (D55).
     - `tutor/sinal.ts` e `governanca/analista.ts`: D57 e D45.
     - `permissao/matriz.ts` e `matriz.expectativa.ts`: a coordenação nunca lê a conversa do professor (item 8).
   - `apps/api/src/assistente/**`: a conversa só do dono e a conferência D55 da saída (`assistente.service.ts:51,61`, `conversa.repository.ts:30`).
   - `apps/api/src/artefato/**`: a entrega pendente e a versão adaptada só com entrega aprovada (`artefato.service.ts:63-68,109-112`).
   - `packages/nucleo/src/auditoria/**`: `acoes.ts:470` (`entrega.decidida`, item 6). Hoje vai só para privacy.
   - `apps/web/src/**`:
     - `areas/coordenacao/governanca/**`
     - `areas/professor/{atividades,turmas,assistente,artefatos,ferramentas}/**`
     - `areas/aluno/{Tutor.tsx,tutor.ts,memoria-do-aluno.ts,Atividade.tsx,atividade.ts}`
     - `componentes/ui/ia/**`
     
     Sem essas pastas, uma tela com sugestão de nota em discursiva ou que esconde a autonomia não chama a conformidade pelo caminho.
   
   **Correção exigida:** acrescentar esses caminhos à linha da conformidade, ou o `conformidade` às linhas que já existem. Também um caso em `revisoes.test.ts` por caminho novo, por exemplo: "`packages/shared/src/time/funcoes.ts` alterado sem `conformidade-reviewer` marcado: recusado".

2. **`techspec.md:68-69`: "sem contar os arquivos de teste" tira a conformidade dos testes que provam a regra 70.** Um commit só de teste pode afrouxar estes arquivos sem a minha rodada:
   - `packages/nucleo/src/ia/ouro.test.ts` e `selo-do-ouro.test.ts`
   - `apps/api/src/atividade/correcao/correcao.int.test.ts`
   - `packages/shared/src/permissao/matriz.test.ts`
   - `packages/shared/src/tutor/tutor.test.ts`
   
   Há ainda uma ambiguidade. A spec lista `*.test.*` e `e2e/**`, mas o `ehArquivoDeTeste` de hoje (`tools/processo/revisoes.ts:549`) exclui também `__fixtures__/` e `test/`. Se ele for reaproveitado, saem também `packages/nucleo/src/ia/__fixtures__/ouro.ts` (o leitor do corpus) e as amostras `dev` das políticas.
   
   **Correção exigida:** a exclusão de teste não vale para a linha da conformidade, ou vale com as exceções nomeadas (`packages/nucleo/src/ia/**` inteiro, inclusive teste e fixture). A spec escreve a lista de exclusão por extenso, sem herdar o `ehArquivoDeTeste`. E entra um caso no `revisoes.test.ts`: "`ouro.test.ts` alterado sem conformidade: recusado".

3. **O corpus ouro (`docs/aia/ouro/**`, `docs/aia/ouro-retido/**`) fica fora de qualquer cobrança.** Ele está fora de `PASTAS_DE_CODIGO` (`revisoes.ts:41,1181-1183`), e o §5(e) (`techspec.md:93-95`) mantém `docs/` como documento. Assim uma sessão de papel pode mudar amostra, `esperado`, `MEDIDAS.json` (o alvo de cada política) e `SELO.json` sem tarefa e sem revisor. A regra do README do ouro (só o Arquiteto, com o `conformidade-reviewer`, commit `(ouro: <política>)`, R38) não tem nenhuma checagem: `tools/processo/` não menciona "ouro".
   
   **Correção exigida:** tratar `docs/aia/ouro/**` e `docs/aia/ouro-retido/**` como arquivo que uma suíte lê. Já existe precedente em `DOCUMENTO_QUE_UMA_SUITE_LE` (`revisoes.ts:799`). Em sessão de papel, o commit exige o `conformidade-reviewer` pela tabela do RF15, com caso de teste e bloco de mutação.

Recomendações:
- **§9, paradas (`techspec.md:165-167`):** escrever no passo 7 do `/seguir` e no `validador.md` que um achado ligado às regras 10, 20 ou 70 nunca é MENOR. O item que vai para o `TODO.md` vindo de recomendação do `conformidade-reviewer` deve citar o revisor e a rodada.
- **Mesmo trecho, retrospectiva como aviso:** a proposta que "muda só papel ou skill" pode afrouxar `.claude/agents/conformidade-reviewer.md` (a lista "O que verificar"), ou as skills que decidem a marcação de guardião (`criar-tasks`, `revisar-tarefa`), em 30 minutos sem objeção. Proponho excluir do aviso os papéis com veto e essas skills, que continuam parada. Isso vem do PRD §3, que deixa fora de escopo mexer no veto da regra 70.
- **RF25 aplicado à regra 70:** declarar na Tech Spec que os itens 1 a 9 e a tabela da classificação ficam no texto que sempre carrega. Sai, com registro, só a explicação que repete decisão.
- **RF16 e §5(e):** `tools/ia/**` (`medir-risco-a-vida.ts`, D36) passa a exigir também o `conformidade-reviewer`.
- **RF17:** nos caminhos da conformidade, a saída "Sem mutação: <motivo>" deveria precisar da concordância do `conformidade-reviewer`, e não só da do `test-engineer`.
- **Teste contra desatualização no `harness.test.ts`:** todo arquivo de `apps/*/src` ou `packages/*/src` que cita "regra 70", D47, D55, D57 ou D64 no cabeçalho precisa casar com algum caminho da linha da conformidade. Assim um módulo novo não fica fora da tabela calado.
- **`docs/aia/*.md`:** a AIA continua documento, revisado na revisão de spec. Basta registrar isso no §5(e), para não parecer omissão.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/prd.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tools/processo/revisoes.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/docs/aia/ouro/README.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/.claude/agents/validador.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/packages/shared/src/time/funcoes.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/packages/shared/src/permissao/matriz.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/packages/nucleo/src/db/schema/validacao-do-lote.ts

## infra-guardian · 1ª rodada · REPROVADO · 2026-10-23 11:53:11 · `tasks/prd-harness/revisao-spec.md`

VEREDITO: REPROVADO

Caminho quente tocado: nenhum do produto. A spec mexe na esteira (`ci.yml`), na fila de carga e no compose de teste do portão, e no hook que roda em todo Bash.

Rate limit: não se aplica (a spec não cria rota)

Fila e prioridade: não se aplica à fila do produto. A fila de carga do portão está em problema (bloqueante 5).

Concorrência: corrida em §2 / RF1 (o `concurrency` da `develop`, `release` e `main`) e em §5(c) (a cópia congelada do hook lida enquanto é copiada)

Índice e paginação: não se aplica

Degradação de IA: não se aplica

Migration: não se aplica

Métrica e alerta: faltando. O censo de prazo do e2e fica cego e responde "nada a corrigir" (bloqueante 4).

Bloqueantes:

1. **§5(b), tabela caminho → guardião (RF15): o `infra-guardian` fica fora de boa parte do caminho quente.** Conferi no repositório o que nenhuma linha da tabela alcança:
   - **Gateway de IA:** `packages/nucleo/src/ia/**` (tem `adaptador-resiliente.ts`, `executor.ts` e `provedor.ts`) e `apps/api/src/ia/**` (orçamento, consumo, agendador). Só o `conformidade-reviewer` é chamado.
   - **Tutor:** `apps/api/src/tutor/**`. Também só o `conformidade-reviewer`.
   - **Limite de pedidos de IA:** `apps/api/src/assistente/**`, que tem o `limite-de-pedidos-de-ia.ts`. Nenhum guardião, nem o `conformidade-reviewer`, embora seja agente.
   - **Login e sessão:** `packages/nucleo/src/identidade/**` (`guarda-sessao`, `avaliar-sessao`, `emissor-de-token`, `verificar-token`), `apps/api/src/estrutura/escola-sessao/**`, e `apps/api/src/operacao/{entrada,sessao,segundo-fator}/**` com o `falhas-de-entrada.ts`, que é login com contagem de falhas.
   - **Contador e limitador:** `packages/nucleo/src/uso/**` (o contador de uso), `apps/api/src/limite.module.ts` e `apps/api/src/uso.module.ts`.
   - **Banco, migration e deploy:** `packages/nucleo/src/db/*.ts`, que tem o `pool.ts` (onde vive o `statement_timeout`) e o `migrar.ts`, mais `apps/api/src/ops/migrar.ts` e `packages/nucleo/src/instancia/**` (a drenagem no deploy).
   - **Métrica:** `packages/nucleo/src/telemetria/**`.
   - **Ambiente:** `packages/nucleo/src/config/**`, `apps/api/src/{main,config,configurar-app}.ts`, o `compose.yaml` da raiz, o `.env.example` e o `.github/**`.
   - **Trabalho demorado em request:** `apps/api/src/material/**` (`fila-de-extracao.ts`, `extracao-de-pdf.ts`), `apps/api/src/artefato/pdf-do-artefato.ts` (exportação) e `apps/api/src/sistema/jobs-sinteticos*`.

   Além dos buracos, a lista é fechada por nome de pasta. O módulo de prova, de avaliação ou de correção vai nascer numa pasta nova e cair em "nenhum guardião" sem aviso.

   **Correção exigida:**
   - Acrescentar o `infra` às linhas acima. Somar o `conformidade` em `apps/api/src/assistente/**`.
   - O `guardioes-por-caminho.ts` passa a classificar toda pasta de primeiro nível de `apps/*/src` e `packages/*/src`, com "nenhum" escrito quando for o caso.
   - Um teste do `harness.test.ts` fica vermelho quando aparece uma pasta sem classificação.

2. **§2 e §10, RF1 (`concurrency` no `ci.yml`): a `develop`, a `release` e o `main` continuam perdendo execuções.** Mesmo com `cancel-in-progress: false`, o GitHub cancela a execução que está esperando quando entra outra no mesmo grupo. O grupo `esteira-${{ github.ref }}` (o texto do `TODO.md`, M1/P4) também enfileira a `develop` atrás de execuções de até 45 minutos. Com três pushes seguidos na `develop`, o do meio nunca roda, e o RF1 promete o contrário.

   A Tech Spec não define a chave do grupo, e o teste previsto só lê o `cancel-in-progress`.

   **Correção exigida:**
   - Escrever a chave na §2. Para `spec/**` e `correcao/**`, o grupo é por ref, com `cancel-in-progress: true`. Para `develop`, `release`, `main` e `workflow_dispatch`, o grupo é único por execução (por exemplo `esteira-${{ github.run_id }}`).
   - No `pull_request`, o grupo é por número do PR.
   - O teste da §10 confere a chave, não só o booleano.

3. **§2 e §5(f), RF2 ("`cancelled` vira `superada`, vale a concluída mais nova"): um e2e que estoura o tempo passa por verde.** O próprio `ci.yml` registra que o job que passa do `timeout-minutes` termina como `cancelled`. Pela regra da Tech Spec, uma execução cancelada por tempo no último commit, sem nenhuma mais nova, cede o veredito à concluída anterior, que é de outro código e pode estar verde. É o mesmo silêncio que a M1 quer acabar.

   **Correção exigida:**
   - Cancelada só conta como `superada` quando existe execução mais nova na mesma branch, criada depois dela.
   - Cancelada sem sucessora é vermelha e cita o job que estourou.
   - O veredito sai de execução cujo código é o do HEAD. O caso do PRD §7 (push só de documento) continua valendo.
   - Teste na §10 para "cancelada por tempo, sem sucessora: vermelho".

4. **§5(f), RF9: o censo lê um artefato que a esteira não grava.** A Tech Spec diz que o relatório JSON do Playwright "a esteira já grava como artefato". Não grava:
   - O `relatoriosDoPlaywright(true, undefined)` devolve só `list` e `github`. O `json` entra apenas com a variável que o portão define.
   - O `ci.yml` só sobe o `test-results/` com `failure() || cancelled()`. Na execução verde, que é a que o censo lê, não há relatório.

   Do jeito que está, o censo encontra lista vazia, e o Orquestrador entende que não há correção a abrir.

   **Correção exigida:**
   - O `ci.yml` define a variável do relatório e sobe o JSON de cada fatia também no verde, com retenção curta.
   - O `--censo` junta as sete fatias.
   - Relatório ausente ou fatia faltando faz o censo sair com 2 e dizer isso. Nunca vira lista vazia.
   - Teste com uma fatia faltando.

5. **§7c, RF4 (a mutação que trava): o prazo e o que se mata estão indefinidos.**
   - "3 × o do teste" não diz de onde vem esse prazo.
   - A corrida limpa que vem antes da mutação (`conferirMutacoes`, `limpos`) também pode travar, e fica sem prazo.
   - O `timeout` do `spawnSync` mata só o filho direto (`npm`/`npx`). Workers do Vitest e testes de integração podem sobreviver e seguir mexendo no banco do compose de teste enquanto o portão continua, que é o ambiente preso que motivou o M3.

   **Correção exigida:**
   - O prazo é 3 × a duração medida da corrida limpa, com teto de 10 minutos. A corrida limpa tem o próprio teto de 10 minutos.
   - O comando roda em grupo de processo próprio e é morto pelo grupo, com SIGTERM e depois SIGKILL.
   - O arquivo é restaurado antes de o portão seguir.
   - Teste de integração com um teste que trava: a mutação sai recusada, não sobra descendente vivo e o arquivo volta ao original.

6. **§5(c), a cópia congelada do hook: uma cópia pela metade trava o time inteiro.** O `PreToolUse` fecha na falha de carga em todo Bash ("nenhum Bash roda até consertar"). O `hook.sh` escolhe a cópia "quando ela existe". Se o `congelar-hook.ts` copiar só o `hook-revisoes.ts`, ou parar no meio, a cópia não carrega: ela importa o `revisoes.ts`, o `mutacoes.ts` e, depois do RF13, os módulos partidos. Todo papel do andar fica sem Bash. A §13 trata a cópia como defesa, mas nada a protege dela mesma.

[… 28 linhas cortadas]

## test-engineer · 1ª rodada · REPROVADO · 2026-10-23 11:53:52 · `tasks/prd-harness/revisao-spec.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Esteira:**
  - RF1 e RF19: o `ci.yml` lido e avaliado ref a ref.
  - RF2: a cancelada por superação separada da cancelada por prazo.
  - RF9: o censo, com o limiar e a escolha da execução.
- **Linhas:** RF3 (encontro vermelho com a spec parada), RF6 (abandonar) e RF10 (base de `conferir`, com os dois lados).
- **Mutações e portão:**
  - RF4: estouro de prazo vira recusa, e não vermelho.
  - RF5: `--faltando`, com e sem bloco.
  - RF7: os workers parados antes da integração.
  - RF8: as duas listas de guardas comparadas.
  - RF17: os dois casos e a exceção, no portão e no commit.
- **Hook:**
  - RF12: o rótulo que sai do modelo deixa a esteira vermelha.
  - RF13: os testes atuais intactos depois da partição.
  - RF14: formas de chamar o git × resultado, contra um git real.
  - RF15: uma linha da tabela por caso, sem contar arquivo de teste.
  - RF16: com e sem papel, cada caminho.
  - RF18: `(mvp:)` recusado pelo motivo certo.
  - §5c: a cópia congelada.
- **Harness:** o `harness.test.ts` para RF20 a RF25 e RF30, e a vigia para RF27 e RF28.
- **UserPromptSubmit:** RF29.
- **Casos de borda do PRD §7:** os seis.
- **Domínio escolar:** não se aplica, nenhum dado de escola (§6). Isolamento também não se aplica, pela mesma razão.
- **Concorrência:** não há operação nova que rode duas vezes ao mesmo tempo. O `registrar` já usa `comTrava`, e o portão já tem o `flock`. Não exijo teste paralelo.

**Cobertos:**
- No §10: RF2, mas só parcial; RF3, RF6, RF10, RF4, RF5, RF17, RF11, RF13, RF15, RF16 e RF18, só nomeados. RF14 aparece com as formas, mas sem os resultados esperados.
- RF12, RF20, RF21, RF24, RF25 e RF30 por `harness.test.ts`, sem detalhe.
- RF9 com relatório de exemplo.
- Sem provedor de IA, `gh` com saída gravada e `maestri list` com exemplo real: certo.

**Bloqueantes:**

1. **§10 / §2: seis requisitos sem teste nenhum.**
   - **RF7:** sem teste. Exigido: a sequência de comandos do portão (extraída do script de topo para uma função) tem a parada do `despachante`/`worker` antes da integração.
   - **RF8:** sem teste. Exigido: a lista de guardas do portão é igual à de `tools/ci/etapas-de-guarda.ts`. Hoje o `comandoDaSuite` está no topo de `portao-local.ts`, e precisa sair para uma função testável.
   - **RF27:** `vigia.test.ts` não aparece no §10. Exigido:
     - `pedida` há mais de 10 min sem `feita` acorda o Orquestrador;
     - com `feita` depois, não acorda;
     - com menos de 10 min, não acorda;
     - o relógio é injetado.
   - **RF28:** o exemplo gravado do `maestri list` lido por teste.
   - **RF29:** teste do script do `UserPromptSubmit` com o JSON de entrada:
     - `/seguir …` no terminal do Orquestrador recebe o contexto;
     - outro texto não recebe nada;
     - um terminal de papel também não.
   - **RF23 / caso de borda §7 "skills update":** o `harness.test.ts` (§2) não lista o RF23. Exigido: um teste que fica vermelho quando o texto do conflito some do `SKILL.md` das três skills. O teste detecta; não "reaplica", como diz o §9, porque teste não escreve na árvore.

2. **§2 `esteira.ts`, RF2: "`cancelled` vira `superada`" sem distinguir o prazo estourado.**
   - O job que passa do `timeout-minutes` termina `cancelled` (comentário do `ci.yml` e `tools/ci/esteira.test.ts:199`).
   - Com a troca cega, um e2e travado nunca fica vermelho.
   - O caso único do §10 ("cancelada sobre vermelha") não basta. A regra de hoje já devolve vermelha nesse cenário: só falharia se a asserção cobrar qual commit e qual job são citados.
   - Exigidos:
     - (a) cancelada mais nova sobre vermelha: vermelha, citando o commit e o job da vermelha antiga;
     - (b) cancelada mais nova sobre verde: verde;
     - (c) mais nova `rodando` e mais velha cancelada: `rodando`. Hoje dá vermelha (`situacaoDaTarefa`, linha 60);
     - (d) PRD §7: commit de documento verde sobre commit de código cancelado dá verde, em `situacaoDaTarefa` e em `situacaoDoFechamento`;
     - (e) cancelada sem execução mais nova da branch (prazo estourado): continua vermelha;
     - (f) `jobsVermelhos` não cita job cancelado por superação.
   - O caso de `tools/processo/esteira.test.ts:40` muda junto.

3. **§10: casos de um lado só.** Uma implementação errada passaria em cada um:
   - **RF1:** o teste avalia a expressão de `cancel-in-progress` para `spec/x` e `correcao/x` (true) e para `develop`, `release` e `main` (false), e confere que o `group` inclui a ref. Presença da chave não basta.
   - **RF10:** correção saída da spec usa a spec como base, e correção saída da `develop` usa a `develop`.
   - **RF14 / pre-push:** o push de papel para `spec/**` passa, e o push sem papel para a `develop` (o pouso) passa.
   - **RF15:**
     - um caso por linha da tabela do §5b (são cinco globs; erro de digitação derruba um guardião calado);
     - um arquivo `*.test.ts` dentro de `db/schema/` não convoca ninguém (a cláusula de exclusão);
     - o teste passa por `portao()`, para provar a ligação na linha 1202, e não só pela função da tabela.
   - **RF16:**
     - o mesmo `tools/` sem papel passa;
     - um caso por caminho da lista;
     - correção que altera `tools/` sem a rodada do `revisor-geral` é recusada. Hoje a correção só exige o `test-engineer`, em `revisoresObrigatorios`.
   - **RF18:** o caso roda em branch `mvp/…` com carimbo válido e confere a mensagem "sem tarefa". Fora de `mvp/` ele cai em `avaliarCommitDoMvp` pelo motivo errado.

4. **§7c, RF4: o prazo da mutação.**
   - `Rodar` devolve `boolean`. A corrida morta por prazo tem `status` null, que hoje vira `false`, e `false` é "vermelho", ou seja, mutação provada (`conferirMutacoes`, linhas 236-245).
[… 106 linhas cortadas]

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-23 11:56:26 · `tasks/prd-harness/revisao-spec.md`

VEREDITO: REPROVADO
Escopo: incompleto (o RF21 não está coberto; a Tech Spec não diz para onde vão os conflitos de skill do RF23 nem as seções do RF20 que saem do `CLAUDE.md`)
Aderência à Tech Spec: divergência em §5a (`commit-msg` no lugar do `pre-commit` da D53 revista) e em §5e (`.claude/settings.json` no lugar de `.claude/settings*.json`)
Portão local: não se aplica. É revisão de spec e não há código; o `conferir` respondeu "nunca passou nesta árvore", o que não bloqueia aqui.

Bloqueantes:

1. **§5c, o hook congelado não chega a todas as linhas e pode travar o time.**
   - **A linha 1 fica de fora.** O congelamento depende de o Orquestrador lembrar ("ao abri-la", "enquanto o estado.md disser"). A 1.0 roda numa linha que já estava aberta, porque no andar ninguém implementa. Essa linha nunca é "aberta" de novo e segue sem cópia. Na sequência, a partição do RF13 é julgada pela árvore que está sendo editada, o oposto do que o U11 §7 manda.
   - **O modo `git` não tem regra.** O `hook.sh git` (o `commit-msg`) não diz o que fazer quando a cópia congelada é anterior ao `hook-git.ts`. O `core.hooksPath` vai para a config comum do repositório no primeiro `npm ci`, que o `linhas.ts abrir` roda (`linhas.ts:276`, pelo `prepare`). A partir daí, todo commit de papel na X7 cai numa cópia sem `hook-git.ts`, quebra e é recusado.
   - **Formatos lidos dos dois lados.** A cópia lê o que a árvore grava (`.processo/portao.json`, `conteudo.json`, os rótulos), e a trilha 2 mexe nisso (RF17 em `mutacoes.ts`, que o hook importa em `hook-revisoes.ts:5,31`).
   - **Correção:** a §5c precisa dizer:
     - o que a cópia leva (só os arquivos de execução, sem teste);
     - qual cópia vale em cada modo, inclusive o `git`;
     - que o congelamento roda por código, em todas as linhas abertas, logo depois do encontro da 1.0. O `linhas.ts abrir`/`partida` congela sozinho, ou recusa, quando o andar tem a pasta;
     - que os formatos lidos entre a árvore e a cópia não mudam enquanto o hook estiver congelado, ou que a cópia é refeita depois da tarefa que os muda.

2. **§5f, RF3: o encontro checa no lugar errado e o desfazer é perigoso.** A spec manda rodar tipagem e lint "no checkout da spec depois do merge" e desfazer com "`git merge --abort` ou `reset` para o HEAD anterior". Só que no andar da spec o avanço é um `--ff-only` (`linhas.ts:427`):
   - o `merge --abort` não se aplica a ele;
   - o `reset` roda num andar que pode ter documento do Arquiteto a meio, coisa que o próprio encontro aceita (`linhas.ts:400-402`);
   - `reset --hard` apaga esse trabalho, e `reset` misto deixa código sujo no andar, o que barra todo encontro seguinte (`linhas.ts:402`).
   - **Correção:** rodar `typecheck` e `lint` no checkout da linha, depois do `merge --no-edit` (`linhas.ts:406`) e antes do `--ff-only` da spec. No vermelho, a spec fica parada, sai com um código próprio e a linha recebe correção. O teste prova que o HEAD da spec e um documento não commitado do andar continuam intactos.

3. **§2 `esteira.ts`, RF2: tratar toda execução cancelada como "superada" esconde vermelho.** O GitHub também cancela por `timeout-minutes`: o próprio `ci.yml:105` registra que "um e2e travado é cancelado, não failure", e o `estado.md` registra o lote 5/7 passando dos 45 min. Com a regra como está, o `situacaoDaTarefa` pula a cancelada e devolve o verde de um commit anterior.
   - **Correção:** só é "superada" a cancelada que tem execução mais nova na mesma branch. Fora isso, vale como vermelha, com os jobs. Falta um teste com o cancelamento por prazo na execução mais nova.

4. **§5a, RF14: "aplica o mesmo `avaliarPortao`" não cobre as exigências de hoje.** O `avaliarPortao` sozinho não recusa código sem `(tarefa N.0)` ou `(correção …)` (`revisoes.ts:1179-1198`). Também não acha o documento nem confere as mutações (a `conferencia` em `hook-revisoes.ts:31`). Feito ao pé da letra, um `/usr/bin/git commit` de código sem marca passa, e esse é exatamente o caso do RF14 e do RF31.
   - **Correção:** escrever que o hook nativo aplica a decisão inteira do `portao`: marca, documento, obrigatórios do RF15, pastas do RF16, `avaliarPortao` e conferência das mutações. Essa decisão vira uma função só, sobre (mensagem, arquivos, raiz), usada pelas duas entradas.

5. **RF21 sem desenho.** O PRD diz que ele se prova com uma "Lista na Tech Spec com o lugar que ficou". A Tech Spec não tem essa lista nem resolve as contradições do U11-6: esteira "uma vez por spec" contra "em todo push", "`test-engineer` primeiro" contra revisores juntos, `vigia:29`, e as skills `user-invocable: false` citadas como comando.
   - **Correção:** acrescentar a lista, um fato por linha, com o lugar onde ele fica.

6. **§9, RF20 e RF23: conflitos e seções somem em silêncio, contra o PRD §6.** O `CLAUDE.md` lista seis conflitos de skill. A §9 guarda três, tira o `frontend-design` e põe `playwright-best-practices` (projetos `chromebook`/`celular`, D51) e `nestjs-best-practices` (o `docs/arquitetura.md` prevalece) entre as "outras oito, sem conflito". Quando o `CLAUDE.md` encolher, esses dois conflitos perdem o lugar. A Tech Spec também não diz para onde vão as seções "Stack" e "Skills" (time, revisores, hook).
   - **Correção:** destino de cada seção que sai do `CLAUDE.md`, e o conflito do Playwright e do NestJS escritos onde sobrevivem a um `npx skills update`.

7. **§5e e §2, RF16: a spec estreita o caminho sem dizer.** Ela diz `.claude/settings.json`. O PRD RF16 e a D53 revista dizem `.claude/settings*.json`, e `.claude/settings.local.json` não está no `.gitignore` (o `git check-ignore` dá 1).
   - **Correção:** usar o mesmo glob do PRD e da decisão.

8. **§5a contra a D53 revista: a troca de hook não está escrita.** A decisão fala em "`pre-commit` e `pre-push`", e a Tech Spec troca por `commit-msg` sem registrar. A troca é correta: o `pre-commit` não recebe a mensagem, que é onde está a marca.
   - **Correção:** escrever o motivo na §5a e ajustar o texto da D53 com o ok do Joaquim.

Recomendações:
- **§5g, RF27:** gravar `feita` só em sessão sem `CLAUDE_CODE_AGENT`. O Arquiteto também tem sessão no térreo (protocolo §4), e o `clear` dele mascararia uma limpeza perdida do Orquestrador.
- **§5b, RF15:** dar à Mesa a lista unida de guardiões antes da primeira rodada (o portão imprime, ou um comando). Sem isso, todo commit em caminho com guardião gasta uma rodada a mais.
- **§5d, RF17:** trocar "se o documento traz" por "se a árvore alterou, no diff contra a base", como o `--faltando` já faz.
- **Recusa por texto no comando:**
  - A recusa por substring (`--no-verify`, `core.hooksPath`) pega também a mensagem de commit. Dizer na recusa para usar `-F`, ou casar só os argumentos do git.
  - Declarar o que fica de fora: script com `--no-verify` e a configuração por `GIT_CONFIG_*`.
- **O commit-msg confere o disco, não o índice:** o `alteracoesDeCodigo` calcula o hash do arquivo no disco (`revisoes.ts:805`), mas o commit grava o índice. No `commit-msg`, usar o blob do índice.
- **Lista de papéis do `commit-msg`:** o `case` com quatro papéis deixa passar um subagente que tenha `CLAUDE_CODE_AGENT` próprio. Usar a mesma `PAPEIS_DO_TIME` ou "variável não vazia".
- **`.processo/**`:** tirar do vitest e do eslint (`eslint.config.mjs:31`, `vitest.config.ts:7`), ou garantir que a cópia não leve teste.
- **`hook-git.int.test.ts`:** no projeto de integração ele sobe o compose (o `globalSetup`) para um teste que só precisa de git.
- **Tabela de formas do §10:** dizer o resultado esperado do merge limpo de outra linha feito por um papel (`linhas.ts:321`).
- **Contradições internas:** o §11 diz que a 00 e a 80 "não são tocadas", contra o `paths:` do §9 e o RF25. Falta o §8, e o §3 cita "Sem IA (§8)". O PRD aponta as paradas para o §10, mas elas estão no §9.
- **Premissa do `paths:` em subagente (§12):** se não se confirmar, que os revisores mandem ler a regra.
- **Skills de terceiro:** "reaplicado por um teste" não fecha, porque o teste só detecta. Dizer onde mora o texto que se reaplica.
- **`separar-achados`:** o U11-10 condicionava a remoção à confirmação do Gabriel. A Tech Spec tirou a condição e não ligou a remoção a um RF.
- **Partição do RF13:** acrescentar a trava do U11-12, para que `estado.ts` e `esteira.ts` deixem de importar `revisoes.ts`.

Arquivos lidos:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/techspec.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/prd.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tools/processo/linhas.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tools/processo/revisoes.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tools/processo/esteira.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/.github/workflows/ci.yml`

## tenancy-guardian · 2ª rodada · REPROVADO · 2026-10-23 13:04:52 · `tasks/prd-harness/revisao-spec.md`

VEREDITO: REPROVADO

Tabelas verificadas: a X7 não cria nenhuma tabela (Tech Spec §3). Comparei cada linha de `tabela-de-guardioes.md` com o `ls` de `apps/{api,realtime,worker,despachante,web}/src`, `packages/{nucleo,shared}/src` e `packages/nucleo/drizzle`. Toda pasta de primeiro nível tem linha. As correções que pedi na rodada 1 estão feitas: `contexto`, `identidade`, `permissao`, `entrada`, `uso`, `db`, `titular`, realtime, worker e os contratos de `shared` em `sala` e `professores` agora pedem T. O `--no-renames` entrou no §5(a). A lista "O que verificar" não muda e os itens da regra 10 não saem do texto (`texto.md`).

Queries verificadas: procurei `drizzle-orm`, `` sql` ``, `escolaId`/`escola_id`, `exigirEscolaDoContexto` e `@SemEscopo(` nas pastas que a tabela não manda para T. Achei query com escopo, `@SemEscopo`, contexto montado a partir do token e contrato que recusa `escolaId` em `nucleo/src/auditoria`, `retencao`, `limite` e `erro`, em `shared/src/sistema`, em `apps/*/test` e em `tools/guardas`.

Teste de isolamento: não se aplica a esta spec, porque ela não cria módulo de produto. O teste do RF15 (`cenarios.md` B) não acusa nenhum dos furos abaixo. Ele confere "uma linha, os guardiões dela", então passa com a tabela errada. E só olha `apps/*/src` e `packages/*/src`.

Bloqueantes:

1. **Linhas 56 e 62 da tabela, e §5(b): há repositories que não pedem o `tenancy-guardian`.**
   - `src/auditoria/` está como P C. Ali, `auditoria.repository.ts:40-45` lê com `where escolaId` tirado do contexto, e `insercao-de-auditoria.repository.ts:30` grava a escola vinda do contexto.
   - `src/retencao/` está só como P. Ali, `expurgo-da-escola.repository.ts:370,459,494` faz `delete`/`update` em SQL cru com `escola_id`. Há também `@SemEscopo` em `expurgo-de-acesso.repository.ts:218,234` e em `expurgo-de-jobs.repository.ts:65`.
   - Pelo §5(b), o casamento é "por prefixo, sem glob". Então esses repositories passam sem a minha rodada. Isso contradiz o critério do próprio RF15 no PRD ("Repository alterado sem `tenancy-guardian` marcado: recusado").
   - Na mesma situação: `src/limite/` (linha 58, só I), onde `guarda-limite.ts:121-122` monta o contexto da escola a partir de `token.escolaId`; e `src/erro/` (linha 62, só P), onde `filtro-global.ts:14-16` é o ponto único que transforma 403 em 404 (item 5).
   - **Correção exigida:**
     - Somar T a `auditoria/`, `retencao/`, `limite/` e `erro/`.
     - Declarar no §5(b) que `*.repository.ts`, `*.controller.ts` e `*.gateway.ts` em `apps/**` ou `packages/**` sempre somam T, seja qual for o prefixo.
     - Em `cenarios.md` B/RF15, um teste que percorre todo arquivo existente que seja `*.repository.ts` ou contenha `@SemEscopo(` ou `exigirEscolaDoContexto` e afirma que T está nos guardiões dele.

2. **Linha 75 da tabela: `shared/src/sistema/` está como "nenhum".**
   - `sistema/jobs-sinteticos.ts:8-19` é o corpo estrito que recusa `escolaId` (regra 10, item 3).
   - `sistema/definicoes-de-job.ts:79` impõe que todo `dados` de job seja estrito, o que barra `escolaId` entrando pela porta dos fundos.
   - `sistema/contexto.ts:9-17` é o contrato do `escolaId`/`anoLetivoId` do contexto.
   - Um commit que tire o `.strict()` daqui passa sem T (item 3 da minha lista).
   - **Correção exigida:** `sistema/` pede T (`erros/` e a raiz podem continuar "nenhum"), e um caso em `cenarios.md` B/RF15: `packages/shared/src/sistema/x.ts` sem T é recusado.

3. **§5(b), linhas 7-8 da tabela e RF15 do PRD: `apps/*/test/` não tem classificação.**
   - São 91 arquivos em `api/test`, 16 em `worker/test`, 3 em `realtime/test` e 6 em `despachante/test`. A regra "teste segue a pasta" não alcança essas pastas, e o teste de "pasta sem linha" não as vê, então ficam como "nenhum" sem que ninguém escreva isso.
   - É ali que estão as provas da regra 10:
     - `estrutura-isolamento.int.test.ts:74-112`, com o 404 cruzado;
     - `material-isolamento`, `operacao-isolamento`, `acesso-da-escola`, `troca-de-escola` e `contexto.int.test.ts`;
     - `arquitetura.test.ts:174-178`, que fixa os três `@SemEscopo` do painel, as cercas de tenant e o "repository lê a escola do contexto".
   - Um commit que afrouxe o 404 ou aceite um quarto `@SemEscopo` passa sem T (itens 4, 5 e 8).
   - **Correção exigida:**
     - Linhas para `apps/api/test/` (T P C I), `apps/worker/test/` (T P I), `apps/realtime/test/` (T P I) e `apps/despachante/test/` (T I).
     - O teste do harness passa a cobrir toda pasta de primeiro nível de `apps/*` e `packages/*`, não só `src`. Isso inclui `packages/nucleo/drizzle.config.ts`.
     - Casos em `cenarios.md`: pasta nova em `apps/api/test` sem linha fica vermelha; `apps/api/test/x-isolamento.int.test.ts` exige T.

4. **Linhas 82 e 87 da tabela (RF16): as guardas da regra 10 fora dos dois arquivos listados caem em "o resto de `tools/`: nenhum".**
   - `tools/guardas/camadas.cjs:100,145-148`: "query no controller" e as cercas de tenant.
   - `tools/guardas/tabelas-do-nucleo.mjs`: a lista que `regras-tenant.mjs` lê. Tirar uma tabela da lista desliga a guarda para ela.
   - `tools/guardas/index.mjs:6,87,103`: liga `tabelaSoNoRepository` e define os arquivos em que ela vale.
   - `tools/guardas/repositories-com-escopo.test.ts`: a prova do `escopo-dos-repositories.ts`, por exemplo a linha 170, "escolaId por parâmetro não é prova".
   - `tools/guardas/definicoes-de-job.test.ts:37`.
   - **Correção exigida:** T para esses cinco arquivos na seção RF16, e um caso em `cenarios.md` B/RF16: `tools/guardas/camadas.cjs` sem `tenancy-guardian` é recusado.

Recomendações:
- `e2e/**` não convoca ninguém, mas `e2e/acesso-da-turma.spec.ts` e `e2e/entrar-na-escola.spec.ts` têm caso entre escolas. Vale exigir T no e2e que tenha cenário de outra escola.
- `tools/guardas/catraca.ts` é o que barra supressão de regra que não é de tamanho em `eslint-suppressions.json`. Afrouxá-la permite suprimir a guarda de tenant sem T. Somar T a esse arquivo ou declarar que o `revisor-geral` cobre isso.
- Continua a premissa do §12: se o `CLAUDE_CODE_AGENT` não chegar ao Bash do papel, o RF15 fica só no `PreToolUse`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/tabela-de-guardioes.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/cenarios.md

## privacy-guardian · 2ª rodada · REPROVADO · 2026-10-23 13:06:07 · `tasks/prd-harness/revisao-spec.md`

VEREDITO: REPROVADO

**Campos pessoais tocados:** nenhum. Sem tabela nova, sem rota nova e sem IA (Tech Spec §3, §4, §7). O único arquivo novo é `.processo/limpeza.json`, que fica fora do git e guarda só `{pedida, feita}` (§3).

**Fora da tabela de dados do docs/lgpd.md:** nada.

**Autorização por objeto:** não se aplica, porque a spec não cria rota. A cobrança vem da tabela do RF15, e ainda há buraco nela (bloqueante 1).

**Logs:** limpos no desenho.
- O log do hook leva só caminho e nome de revisor, e o achado cita `arquivo:linha`, nunca o valor (§7).
- O `UserPromptSubmit` não grava o texto (§5h), e o teste do RF29 em `cenarios.md` prova isso ("o hook não grava arquivo").

**Auditoria:** não se aplica, porque nenhuma ação auditável nasce na X7.

**Envio externo:** nenhum novo. O `--censo` só baixa da própria esteira o JSON do Playwright (§5f).

**Seed/fixture:** sintético (PRD §8). `apps/web/src/__fixtures__/` agora pede minha rodada. `e2e/__fixtures__/` continua sem pedir (recomendação).

**Correções da rodada 1, conferidas:**
- **Bloqueante 1:** feito em quase todas as linhas que listei (`ia`, `tutor`, `assistente`, `processadores`, `storage`, `artefato`, `material`, `convite`, `sessao`, `credencial`, `identidade`, `permissao`, `erro`, `telemetria`, `ciclo-de-vida`, `estrutura`, `sala`, `realtime`, `ops`, `operacao` e `shared`).
- **Bloqueante 2:** feito em parte. `guardioes-por-caminho.ts` pede os quatro guardiões, `regras-log.mjs` e `regras-erro.mjs` pedem `privacy`, e `regras-tenant.mjs` e `regras-ia.mjs` pedem os guardiões delas. Mas o `eslint.config.mjs`, que eu exigi com `privacy`, ficou em "nenhum" (bloqueante 2 abaixo).
- **Recomendações da rodada 1:** `limpeza.json`, `UserPromptSubmit` e §7 foram feitos.

**Bloqueantes:**

1. **`tabela-de-guardioes.md`, linhas que ainda não pedem `privacy` (Tech Spec §5b, RF15).** Conferi pasta a pasta no código. Estas linhas guardam dado de pessoa, log, storage, convite, erro, envio externo ou o gatilho de auditoria, e não me chamam:
   - **`packages/nucleo` → `src/contexto/` (só T).** `contexto.ts` é "o que identifica a requisição em toda linha de log e em todo erro. Só ids" (regra 20.9). Um campo `nome` posto ali entra em todo log sem a minha rodada.
   - **`packages/nucleo` → `src/config/` (só I).** `config-ia.ts` decide se o provedor de IA conta como local (`enderecoDaNossaRede`, `LLM_PROCESSAMENTO_LOCAL`). Também obriga o `IA_PROVEDOR_ID`, que é o registro de para onde foi o dado do aluno (art. 18, VII; regra 20.13). Afrouxar isso apaga o registro de envio externo.
   - **`packages/nucleo` → `src/fila/` (T I).** O `enfileirador.ts` faz o `safeParse` estrito que barra nome e resposta no dado do job.
   - **`packages/nucleo` → `src/limite/` (só I).** `chaves.ts` guarda o IP no Redis com retenção curta (o próprio arquivo cita a regra 20). O balde `rl:busca-titular` é a defesa contra varredura de nomes.
   - **`packages/shared/src` → `erros/` e `sistema/` ("nenhum").** Retiro a concessão que fiz na rodada 1, porque o código a desmente:
     - `erros/codigo-de-erro.ts` define `RespostaDeErro`, o corpo de erro "sem campo livre: nem stack, nem valor de campo" (regra 20.11 e 20.6).
     - `sistema/definicoes-de-job.ts` tem os esquemas de dado de todo job ("payload só id").
     - `sistema/contexto.ts` é o DTO de saída estrito de `GET /v1/sistema/contexto`.
     - `sistema/realtime.ts` guarda a regra de que o JWT nunca vai na URL.
   - **`apps/api/src` → `sistema/` e arquivos da raiz (T I).**
     - `sistema/contexto.controller.ts` é onde esse DTO de saída é aplicado (`esquemaRespostaContexto.parse`).
     - `configurar-app.ts` liga o `FiltroGlobalDeErro` e o logger. O `main.ts` liga `registrarErrosDoProcesso`.
     - Incoerência: no realtime, o mesmo arquivo pede `privacy`.
   - **`apps/web/src` → `componentes/` ("nenhum").** Ali estão:
     - `link-do-convite.ts`: token no fragmento, nunca enviado ao servidor (regra 20.8).
     - `copia-unica.tsx` e `DialogoDoConvite.tsx`: o link aparece uma vez só.
     - `baixar-por-url.ts`: URL assinada fora do histórico e da tela, com `noreferrer` (regra 20.7).
     - `meus-dados/`: o pedido do titular.
     - `pedidos/atualizacao-dos-pedidos.ts`: a leitura da coordenação grava auditoria, e por isso nunca relê sozinha (regra 20.10).
     
     Basta trocar o `#` por `?token=` para o token ir parar em log de borda e no `Referer`, sem rodada minha.
   - **`apps/web/src/areas/` (sem linha própria).** `areas/navegacao.ts` e qualquer subpasta nova cai na raiz ("nenhum"). O teste de pasta nova olha só o primeiro nível, então uma futura `areas/rede/` nasce sem guardião.

   **Correção exigida:** acrescentar `privacy` a `nucleo/src/contexto/`, `src/config/`, `src/fila/`, `src/limite/`, `shared/src/erros/`, `shared/src/sistema/`, `api/src/sistema/` e à raiz de `apps/api/src`. Dar a `apps/web/src/componentes/` a linha `privacy`; `componentes/ui/` pode seguir "nenhum", e `ui/ia/` segue `conformidade`. Dar a `apps/web/src/areas/` uma linha própria (P C) que valha para subpasta nova. Em `cenarios.md` (RF15), um caso por linha nova com bloco de mutação, por exemplo `packages/nucleo/src/contexto/contexto.ts` alterado sem `privacy-guardian`: recusado.

2. **`tabela-de-guardioes.md`, seção RF16 (Tech Spec §5e), linha "o resto de `tools/` … e as configurações do portão → nenhum".** A exigência explícita da rodada 1 (`eslint.config.mjs` → `privacy`) não foi feita. A linha também contradiz o RF16 do PRD, que pede "o guardião da regra que a guarda … protege". Com a tabela como está, sem a minha rodada é possível:
   - desligar a guarda de log tirando `log-sem-dado-pessoal` de `tools/guardas/index.mjs` (plugin `guardas` e `REGRAS_DE_LOG`) ou do `eslint.config.mjs`;
   - afrouxar `tools/guardas/catraca.ts`, que impede o `eslint-suppressions.json` de suprimir regra que não é de tamanho;
   - mexer em `tools/guardas/definicoes-de-job.test.ts`, o teste "o payload de um job é só id (regra 20, item 9)", e em `tools/guardas/guardas.test.ts` e `tools/guardas/__fixtures__/`, que provam as guardas.
   
   **Correção exigida:** `tools/guardas/` inteiro → `privacy`, mantendo as linhas mais longas de T e C já escritas. `eslint.config.mjs` e `eslint-suppressions.json` → T P C. Em `cenarios.md` (RF16), um caso para `eslint.config.mjs` e um para `tools/guardas/index.mjs` sem `privacy-guardian`: recusado.

**Recomendações:**
- **Aplicador da tabela.** `decidirCommit` (`portao.ts`) e `caducidade.ts` aplicam a união `marcados ∪ guardioesDoCaminho`. Mudar essa união anula a tabela sem tocá-la, e pela tabela atual isso pede só `revisor-geral` e `test-engineer`. Vale pô-los na mesma linha de `guardioes-por-caminho.ts`, ou declarar o limite no §5a.
- **`e2e/__fixtures__/`.** É a semente real do banco de teste e da `tools/vitrine/` (nomes, matrículas, e-mail `.invalid`), e `e2e/**` não convoca ninguém. Vale pedir `privacy` para essa subpasta, ou uma guarda barata na esteira contra CPF, telefone e e-mail fora de `.invalid` em `e2e/__fixtures__/` e `apps/web/src/galeria/dados.ts`.
- **`apps/despachante/src` (T I).** Leva o dado do job do banco ao Redis e só loga id. Hoje está ok; `privacy` ali é barato.
- **§5f, censo.** O repositório é público, e o JSON do Playwright vai subir também no verde. Escrever que o artefato é só o reporter JSON, sem trace, captura nem anexo.
- **Mantida da rodada 1:** decisão do Joaquim sobre `.claude/rules/20-lgpd-menores.md`, `.claude/agents/privacy-guardian.md` e `docs/lgpd.md` mudarem como documento, sem rodada.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/tabela-de-guardioes.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/cenarios.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/prd.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/revisao-spec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/achados/revisao-spec.md

## conformidade-reviewer · 2ª rodada · REPROVADO · 2026-10-23 13:06:40 · `tasks/prd-harness/revisao-spec.md`

VEREDITO: REPROVADO

Caminhos de escrita em Nota: a X7 não cria nenhum. Hoje o equivalente de Nota é a aprovação do lote: `correcao.repository.ts:282` grava `validacao_do_lote`, que tem `confirmada_por NOT NULL` e uma constraint trigger (`packages/nucleo/drizzle/0023_mvp_restricoes.sql:82`). Existe também um caminho de seed por SQL direto: `e2e/__fixtures__/governanca.ts:126-151`, chamado pela vitrine em `tools/vitrine/escola.ts:7,248`. Ele grava `correcao`, `validacao_do_lote` com a professora em `confirmada_por` e marca a `entrega` como aprovada. Todos com autor humano? sim. Quem garante isso é o banco, e o banco já pede a minha rodada (`drizzle/` e `src/db/` estão na tabela com C). O seed em si fica fora dela (bloqueante 2).
Decisão autônoma sobre aluno: ausente. A spec não põe IA no caminho do aluno.
Aprovação registrada: ok no produto. Falta a cobrança pelo caminho em `packages/nucleo/src/titular/`, que garante que saída de IA não aprovada não chega ao aluno (bloqueante 1).
Supervisão do tutor: lacuna em `apps/web/src/componentes/ui/Faixa.tsx` e `componentes/ui/onca/` (bloqueante 1) e nos e2e do tutor (bloqueante 2).
Autonomia declarada e visível: sim. `packages/shared/src/time/` e `apps/web/src/areas/coordenacao/` agora pedem C.

**Correções da rodada 1, conferidas**
- **Bloqueante 1 da rodada 1: feita.** Têm C agora: `drizzle/`, `src/db/`, `shared` (assistente, atividade, governanca, permissao, time, tutor), `assistente/`, `artefato/`, `auditoria/`, as três áreas da web e `ui/ia/`. O teste é "uma linha por entrada" (`cenarios.md:63`).
- **Bloqueante 2 da rodada 1: feita para unidade e integração**, porque teste e fixture agora seguem a pasta (`techspec.md:75`, `cenarios.md:65`). Não está feita para o e2e (bloqueante 2 abaixo).
- **Bloqueante 3 da rodada 1: feita.** `docs/aia/ouro/` e `ouro-retido/` pedem C (`tabela-de-guardioes.md:85`, `techspec.md:92`), com caso por caminho (`cenarios.md:71`).
- **Recomendações da rodada 1 que foram atendidas:** as paradas (`texto.md:60-62`, D79 revista em `docs/decisoes.md`), o C em `tools/ia/` e `regras-ia.mjs`, e a regra 70 sempre carregada sem perder item (`texto.md:27`).

**Bloqueantes**

1. **`tabela-de-guardioes.md:27, 57, 61, 62, 74 e 48`. Código que hoje impõe a regra 70 continua sem pedir C, e com isso o §7b (`techspec.md:130`) e o PRD §8b ficam falsos.** Conferi no código:
   - **`packages/nucleo/src/titular/`, linha 61 da tabela (só T P).**
     - `leitura-do-titular.ts:24-32`: a versão da coordenação nunca traz a conversa do professor com o Assistente (item 8 da regra). A correção de lote não aprovado sai só como estado (item 3).
     - `compartilhamento.ts:35-43`: a foto do professor não separa quem usou IA de quem não usou (D64, itens 8 e 9).
     - `eliminacao-do-titular.repository.ts:98-102`: o que a IA gerou continua ligado a quem aprovou (item 6).
   - **`apps/api/src/privacidade/`, linha 27 (T P).** `titulares.repository.ts:198`: a prévia do professor não mostra uso de IA (D64).
   - **`packages/shared/src/privacidade/`, linha 74 (T P).** `arquivo.ts:16,81` e `titular.ts:133-162`, os mesmos contratos.
   - **`packages/nucleo/src/retencao/`, linha 62 (só P).** `expurgo-da-escola.repository.ts:339-340`: a execução de agente e a autoria do artefato ficam, para a auditoria continuar respondendo (item 6).
   - **`packages/nucleo/src/ciclo-de-vida/`, linha 57 (T P).** A eliminação de pessoa anula `decidida_por` pela FK, e "quem aprovou" passa a depender da auditoria (item 6).
   - **`apps/web/src/componentes/`, linha 48 ("nenhum").**
     - `ui/Faixa.tsx:10-13`: o aviso fixo, que não fecha, de que o professor acompanha o Tutor (D8, item 4).
     - `ui/onca/CabecaOnca.tsx:27-35`: o avatar dos agentes, sem expressão, sem nome e sem animação (D58, itens 4a e 4b).

   Hoje um commit que deixa a coordenação ler a conversa do professor pelo arquivo do titular, que apaga `execucao_agente` no expurgo, que deixa a faixa do Tutor ser fechada ou que anima a onça passa sem a minha rodada.

   **Correção exigida:**
   - Acrescentar C a `packages/nucleo/src/titular/`, `src/retencao/`, `src/ciclo-de-vida/`, `apps/api/src/privacidade/` e `packages/shared/src/privacidade/`.
   - Criar linhas próprias com C para `apps/web/src/componentes/ui/Faixa.tsx` e `componentes/ui/onca/`.
   - Ajustar o §7b e o PRD §8b ao que a tabela de fato cobre.
   - Incluir em `guardioes.test.ts` um caso por linha nova, por exemplo "`packages/nucleo/src/titular/leitura-do-titular.ts` alterado sem `conformidade-reviewer`: recusado".

2. **`tabela-de-guardioes.md:8`, `techspec.md:75` e `cenarios.md:65`: "`e2e/**` não convoca" tira de mim os e2e que provam a regra 70 e o seed da escola cheia.**
   - A regra 40 exige e2e de "aprovação de entrega de agente" e de "tutor recusando entregar resposta". Esses fluxos estão em:
     - `e2e/professor-aprovar.spec.ts`, `professor-entregas.spec.ts`, `professor-tutor.spec.ts`, `professor-artefato.spec.ts` e `professor-conversa.spec.ts`
     - `aluno-tutor.spec.ts` e `aluno-atividade.spec.ts`
     - `agentes.spec.ts`, `governanca.spec.ts`, `analista.spec.ts`, `a2-assistente.spec.ts` e `a3-a4-professor.spec.ts`
     - `pecas-ia.spec.ts` e `pecas-marca-onca.spec.ts`
   - `e2e/__fixtures__/governanca.ts` é o seed que grava `validacao_do_lote` e a entrega aprovada por SQL direto.
   - É o mesmo furo do bloqueante 2 da rodada 1: um commit só de teste afrouxa a prova da regra sem a minha rodada.

   **Correção exigida:** dar ao `e2e/` uma classificação na tabela. Pode ser por prefixo de arquivo, com C nos specs acima e em `e2e/__fixtures__/{governanca,a2,a3,assistente}.ts`, ou `e2e/` inteiro com C. E incluir o caso "`e2e/aluno-tutor.spec.ts` alterado sem `conformidade-reviewer`: recusado". Tirar "`e2e/x.spec.ts` não exige nenhum" de `cenarios.md:65`, ou restringir esse caso a um spec fora da lista.

**Recomendações**
- **Teste contra desatualização** (repito da rodada 1, e ele teria achado o bloqueante 1). Em `guardioes.test.ts`: todo arquivo de `apps/*/src` e `packages/*/src` que cita "regra 70", D47, D55, D56, D57, D58, D64 ou D45 precisa casar com uma linha que tenha C. A classificação por pasta de primeiro nível não pega subpasta nova dentro de uma pasta "nenhum".
- **Ouro.** `docs/aia/ouro/README.md:3-4` manda o Arquiteto commitar com `(ouro: <política>)`, e o RF16 passa a exigir tarefa ou correção. Pôr essa contradição na lista do RF21 (`texto.md:40-52`), com o README passando a `(correção …)` e a minha rodada. Também um caso explícito "`docs/aia/ouro/x.json` sem `conformidade-reviewer`: recusado".
- **Realtime.** `apps/realtime/src/` tem só T P I. Quando o modo sala ao vivo do Tutor entrar ali, ele não me chama. Ou entra C já, ou a tabela anota que o gateway do Tutor nasce com linha própria.
- **Web, peças com D59 e item 7.** `apps/web/src/api/` (`atividades-do-aluno.ts:53`, item 3) e `componentes/pedidos/textos.ts:13` (item 7) poderiam ter C. As peças da casca que aplicam D59 (`CascaDaEscola.tsx`, `MenuDaPessoa.tsx`, `ui/sobrepostos/DialogoDeConfirmacao.tsx`, `ui/Contador.tsx`) idem.
- **Erros.** `packages/shared/src/erros/codigo-de-erro.ts:59-66` (D33, D56, item 3) poderia ter C.
- **RF20 e RF25.** O teste só prova o conjunto {10, 20, 70}. Acrescentar a contagem dos itens da regra 70 (1 a 9, com 2a, 4a a 4d e 6a) e a tabela da classificação. E a tarefa da X7 que edita `.claude/rules/70-conformidade-cne.md` marca `conformidade-reviewer`, porque regra é documento e o caminho não me chama.
- **RF21.** A deduplicação preserva "O que verificar" (`texto.md:57-58`), mas não diz nada do bloco "Formato" de cada guardião. Declarar que ele também não muda.
- **Paradas.** `texto.md:60-62` diz "as skills que decidem a marcação" sem nomeá-las. Escrever quais (`criar-tasks`, `revisar-tarefa`, `revisar-spec`).
- **Vitrine.** `tools/vitrine/` está em "o resto de `tools/`: nenhum" (`tabela-de-guardioes.md:87`), mas monta a escola cheia, que é o dado das fotos de tela que eu audito. Pode ter C junto com o fixture do bloqueante 2.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/tabela-de-guardioes.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/cenarios.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/texto.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/packages/nucleo/src/titular/leitura-do-titular.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/packages/nucleo/src/titular/compartilhamento.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/apps/api/src/privacidade/titulares.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/apps/web/src/componentes/ui/Faixa.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/apps/web/src/componentes/ui/onca/CabecaOnca.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/e2e/__fixtures__/governanca.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/docs/aia/ouro/README.md

## infra-guardian · 2ª rodada · REPROVADO · 2026-10-23 13:06:46 · `tasks/prd-harness/revisao-spec.md`

VEREDITO: REPROVADO

Caminho quente tocado: nenhum no produto. A tabela do RF15 decide quem audita login, tutor, sala, prova, fila, IA e migration, e conferi cada linha dela no código real.
Rate limit: não se aplica (a spec não cria rota). A tabela, porém, deixa sem `infra-guardian` o limite por minuto e o limite de IA (bloqueantes 2 e 4).
Fila e prioridade: problema. O registro de filas e de prioridade de job (`packages/shared/src/sistema/`) está classificado como "nenhum".
Concorrência: corrida no encontro, em `tools/processo/linhas.ts:388-436` combinado com a Tech Spec §5(f), RF3.
Índice e paginação: faltando na cobertura. Pastas com repository em tabela que cresce com aluno ficam sem `infra-guardian`.
Degradação de IA: não se aplica.
Migration: não se aplica. `drizzle/` e `src/db/` têm o `infra-guardian`.
Métrica e alerta: ok. O censo do RF9 foi corrigido.

**Correções da rodada 1:**

| Rodada 1 | Situação |
|---|---|
| 1. Tabela completa | Feita na forma, com erros de classificação (bloqueantes 1 a 5) |
| 2. Grupo do `concurrency` | Feita |
| 3. RF2, cancelada por prazo | Feita na Tech Spec; o PRD ainda diz o contrário (bloqueante 6) |
| 4. Censo | Feita |
| 5. Prazo da mutação | Feita |
| 6. Cópia congelada | Saiu |

Bloqueantes:

1. **Front-end sem `infra-guardian`** (`tasks/prd-harness/tabela-de-guardioes.md:44`, `:46`, `:48`). O lado cliente da regra 80 fica sem guardião:
   - `areas/aluno/` (P C) tem `fila-de-respostas.ts` e `respostas.ts`, o reenvio de resposta da regra 80.6, e o cliente do Tutor.
   - `areas/professor/turmas/TurmaHoje.tsx` relê os sinais da sala em intervalo fixo, e `assistente/Time.tsx` faz o mesmo com as entregas.
   - `areas/coordenacao/material` relê a cada 1,5 s.
   - `api/cliente-de-consultas.ts` (só P) define o `retry` e o `retryDelay` fixo de 1 s de toda consulta. Quando a API volta, isso é a escola inteira repetindo pedido no mesmo segundo.
   - `componentes/pedidos/atualizacao-dos-pedidos.ts` (`setInterval` de 15 s) e `componentes/sino/` estão em "nenhum".
   - `sessao/`, o login do cliente, só tem P.

   **Correção:** I em `apps/web/src/api/`, `sessao/`, `areas/aluno/`, `areas/professor/`, `areas/coordenacao/`, `componentes/pedidos/` e `componentes/sino/`. No `cenarios.md`, RF15, um caso em que `apps/web/src/areas/aluno/fila-de-respostas.ts` exige o I.

2. **`packages/shared` sem I** (`tabela-de-guardioes.md:73-75`).
   - `sistema/` está em "nenhum", mas `sistema/jobs.ts` define `FILAS` e `sistema/definicoes-de-job.ts` define a fila, a retentativa, o `prazoMs` e o `naoUrgente` de cada job. Mudar um job de lote para a fila `interativa` passa sem mim (item 3).
   - `erros/` está em "nenhum", mas guarda os códigos e textos que o aluno vê quando algo falha (`IA_INDISPONIVEL`, `IA_TEMPO_ESGOTADO`, `LIMITE_DIARIO_DO_TUTOR`, `LIMITE_EXCEDIDO`, item 4).
   - Sem I também: `estrutura/paginacao.ts` (`TAMANHO_MAXIMO_DA_PAGINA`), `privacidade/titular.ts` (`LIMITE_DA_BUSCA_DE_TITULARES_POR_MINUTO`), `sessao/`, `sala/`, `tutor/` e `atividade/prova.ts`.

   **Correção:** I em `sistema/`, `erros/`, `estrutura/`, `privacidade/`, `sessao/`, `sala/`, `tutor/` e `atividade/` do shared.

3. **`packages/nucleo` com concorrência e trabalho em lote sem I** (`tabela-de-guardioes.md:56`, `:57`, `:61`, `:62`).
   - `retencao/` (só P): expurgo em lote com transação, escrito para caber no `statement_timeout` de 2 s (`expurgo-da-escola.repository.ts:156`).
   - `titular/` (T P): a eliminação usa `FOR UPDATE` contra o mesmo job rodando duas vezes (`eliminacao-do-titular.repository.ts:49-59`), `troca-de-nome.ts` trabalha em faixas medidas contra o `statement_timeout`, e há o `armazem-s3.ts`.
   - `ciclo-de-vida/` (T P): `conta-global.repository.ts:46` usa `FOR UPDATE`, com deletes em transação.
   - `auditoria/` (P C): grava e lista numa tabela que cresce a cada acesso.
   - `erro/mapear-erro-postgres.ts` traduz o `query_canceled` do `statement_timeout` em erro tipado.

   **Correção:** I nessas cinco pastas.

4. **`apps/api/src` com pastas sem I** (`tabela-de-guardioes.md:19`, `:21`, `:27`, `:28`).
   - `entrega/` (T P C): aprovação em transação (`entrega.service.ts:51`). O clique duplo em aprovar é caso nomeado da regra 80.7.
   - `governanca/` (T P C): `analista.service.ts:63` conta o pedido no `LimiteDePedidosDeIa` e agenda o job `resumo_do_analista`.
   - `privacidade/` (T P): idempotência por `onConflictDoNothing` na `chaveEnvio` (`pedidos.repository.ts:98`) e listagem paginada.
   - `professores/` (T P C): listagem paginada (`professores.repository.ts:32`).

   **Correção:** I nas quatro.

5. **`apps/*/test/` sem classificação** (`tabela-de-guardioes.md:7-9`; Tech Spec §5(b), `techspec.md:74-75`). "Teste segue a pasta" só resolve dentro de `src/`. Os testes que provam limite e concorrência ficam fora da tabela e fora do teste de pasta nova:
   - API: `semaforo-de-login`, `ataque-de-senha`, `limite`, `limites-da-sala`, `salas-reivindicar`, `ativacao-sob-trava`, `segundo-fator-operador-concorrencia`.
   - Worker: `reexecucao`, `prazo-do-job`.
   - Despachante: `redis-fora`, `vagas`.

   Apagar ou enfraquecer um deles passa sem a minha rodada (item 11). O `packages/nucleo/drizzle.config.ts` também não casa com `drizzle/`.

   **Correção:**
   - Classificar `apps/api/test/` e `apps/worker/test/` com T P C I, `apps/realtime/test/` com T P I e `apps/despachante/test/` com T I.
   - Classificar `packages/nucleo/drizzle.config.ts` com I.
   - O teste de pasta sem linha passa a cobrir também as entradas de primeiro nível de `apps/*/` e `packages/*/` fora de `src/`.

6. **O PRD ainda diz o contrário da Tech Spec no RF2** (`tasks/prd-harness/prd.md:48`). O texto "Cancelada não é vermelha: vale a execução concluída mais nova" contradiz a Tech Spec §5(f) (`techspec.md:101-102`). Ele traz de volta o bloqueante 3 da rodada 1: a execução cancelada por prazo, sem sucessora, herda o verde da anterior, e o Validador confere contra o PRD.

   **Correção:** reescrever o RF2 do PRD. Só é "superada" a cancelada que tem execução `push` mais nova na mesma branch. A cancelada sem sucessora é vermelha e cita o job. A coluna de verificação ganha o caso "cancelada por prazo, sem sucessora: vermelha". Isso muda critério do PRD, então é parada do Joaquim.

7. **Corrida no encontro do RF3** (Tech Spec §5(f), `techspec.md:109-112`; `tools/processo/linhas.ts:391` e `:435-436`). O encontro lê o quadro no início (`contextoDe`) e o grava no fim (`gravarQuadro`), sem trava. O RF3 coloca uns 80 s de verificação, mais o `npm ci` quando o lock muda, entre o merge e o `--ff-only`. Com três linhas, dois encontros nessa janela dão o padrão "busca, verifica, grava" sem trava:
   - o segundo `--ff-only` falha;
   - a gravação do quadro parte de uma leitura velha e pode marcar como ocupada, de novo, a linha que o outro encontro acabou de liberar.

   **Correção:**
   - O encontro roda inteiro sob trava exclusiva (`flock` em `.processo/`), do merge até a gravação do quadro, e relê o quadro já com a trava.
[… 15 linhas cortadas]

## test-engineer · 2ª rodada · REPROVADO · 2026-10-23 13:08:12 · `tasks/prd-harness/revisao-spec.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Esteira**
  - RF1 e RF19: o grupo e o `cancel-in-progress` avaliados ref a ref.
  - RF2: superada, cancelada sem sucessora, prazo estourado, sucessora rodando, e os jobs citados.
  - RF9: o limiar e a escolha da execução.
- **Linhas:** RF3, RF6 e RF10.
- **Mutações:**
  - RF4: prazo, neto, restauração, teto, e o mutado que falha devagar.
  - RF5.
  - RF17, no portão e na `decidirCommit`.
- **Portão:** RF7 e RF8.
- **Hook:**
  - RF12, RF13 e RF18.
  - RF14: formas, índice contra árvore, merge de papel dos dois lados, `pre-push` dos dois lados, a negação do `PreToolUse` e a terceira camada com histórico real de spec.
  - RF15: linha a linha, pela `decidirCommit`, com os testes de fora de `src`.
  - RF16: caminho a caminho, coerente com a tabela.
- **Guarda de IA:** a mudança da pasta isenta (RF24).
- **Texto:** RF20 a RF26 e RF30, com amostra quebrada e contagem mínima.
- **Maestri:** RF27, RF28 e RF29.
- **PRD §7:** os sete casos de borda.
- **Domínio escolar e isolamento:** não se aplicam (§6).
- **Concorrência:** não há operação nova que corra duas vezes ao mesmo tempo (o `comTrava` e o `flock` já existem).

**Cobertos (rodada 1 conferida):**
- O bloqueante 1 foi resolvido: RF7, RF8, RF23, RF27, RF28 e RF29 têm teste, e os dois lados de cada um estão em `cenarios.md:18-19,93,104-110`.
- Também resolvidos:
  - 6: as formas contra o git real, índice contra árvore e os limites declarados.
  - 7: a negação do `PreToolUse`, com os casos que passam.
  - 8: a cópia congelada saiu.
  - 9: RF16 com `package.json` e as configurações do portão.
  - 10: amostra quebrada e contagem mínima.
  - 11: RF3 no checkout da linha, com o comando injetado.
- RF10 e RF11 agora têm os dois lados.
- RF15 é testado pela `decidirCommit`, com união de marcados e caminho, pasta nova e linha que não casa.
- O RF4 agora exige que o neto morra (pid conferido) e que a corrida limpa acima do teto falhe.
- A seção D (Maestri) tem os dois lados.
- Os bloqueantes 2, 3, 4 e 5 ficaram pela metade. O que falta está nos itens 1, 2, 5 e 6 abaixo.
- O §5(c) se sustenta: `hook-portao.test.ts` está no projeto `unidade` (`vitest.config.ts:41-53`), então roda em todo portão.

**Bloqueantes:**

1. **`cenarios.md:15`, RF4: o caso que passa usa o vocabulário errado, e falta o mutado lento.**
   - Em `mutacoes.ts:185-186`, `recusada` quer dizer bloco recusado, com o portão vermelho. O que passa é `vermelho`.
   - O cenário diz que o mutado que falha rápido fica "recusada como hoje" e que o que passa fica "aceita". Escrito assim, o teste afirma o contrário da regra.
   - Correção, nos termos do código:
     - falha rápida: `vermelho`;
     - mutado que passa: `verde`;
     - estouro de prazo: `recusada`.
   - Falta também o mutado que falha devagar. Com prazo de 3 × a corrida limpa e sem piso (`techspec.md:142`), um teste que só fica vermelho depois de um `expect.poll` ou de um `waitFor` vira `recusada`. Isso depende da folga da máquina.
   - Correção exigida:
     - o prazo passa a ser o maior entre 3 × a corrida limpa e o timeout do próprio teste ou projeto;
     - novo caso, com relógio injetado: corrida limpa de 1 s e mutado que falha em 5 s, dentro do piso, dá `vermelho`.

2. **`cenarios.md:13`, RF2: dois casos que exigi na rodada 1 não entraram.**
   - O caso (d) usa uma sucessora concluída. Com ele, a regra errada "só é superada por execução já concluída" passa no teste. Hoje `situacaoDaTarefa` (`esteira.ts:57-60`) devolve vermelha nesse cenário.
   - Exigido:
     - cancelada mais velha com a mais nova da mesma branch ainda rodando dá `rodando`;
     - os jobs da superada não aparecem em `jobsVermelhos`;
     - o caso (d) é afirmado em `situacaoDaTarefa` e também em `situacaoDoFechamento`.

3. **`cenarios.md:20`, RF9: a escolha da execução não tem teste.**
   - O §5(f) (`techspec.md:105`) diz que o censo lê "a última execução verde".
   - Exigido: uma vermelha mais nova que a verde, e o censo lê a verde.

4. **`cenarios.md:41,50`, RF14: o merge de papel só tem o lado que recusa.**
   - A regra errada "recusa todo merge de papel" passa no teste.
   - A cláusula nova, que lista só o que diverge dos dois lados, não tem prova. Sem ela, um merge limpo que traz código fica recusado.
   - Exigido, contra o git real:
     - merge limpo de papel, sem marca: passa;
     - merge com conflito resolvido por papel, com marca, revisões e carimbo: passa.

5. **`cenarios.md:42,47`, RF14 `pre-push`: o lado sem papel não tem teste (meu bloqueante 3 da rodada 1).**
   - Se o `pre-push` não tiver a guarda `[ -n "$CLAUDE_CODE_AGENT" ] || exit 0`, o pouso do Orquestrador para a `develop` trava e nenhum teste acusa.
   - Exigido: sem `CLAUDE_CODE_AGENT`, `git push origin HEAD:develop` passa.

6. **`cenarios.md:58-60`, terceira camada: o caso que passa não é um histórico real de spec.**
   - O `conferirEntrega` (`linhas.ts:345-369`) com `naSpec` exige que o último commit com código seja a correção. Se for reaproveitado como está, todo push de `spec/**` fica vermelho.
   - Ainda assim o teste "histórico com marca: sai 0" passa, se a amostra for de correção.
[… 72 linhas cortadas]

## revisor-geral · 2ª rodada · REPROVADO · 2026-10-23 13:08:37 · `tasks/prd-harness/revisao-spec.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência em §5(a), na terceira camada do RF14, e entre §5(e) e `tabela-de-guardioes.md`
Portão local: não se aplica. É revisão de spec e não há código; o `conferir` responde "nunca passou nesta árvore".

Os oito bloqueantes da rodada 1 foram corrigidos:
- 1, a cópia congelada: saiu por decisão do Joaquim (PRD §6, Tech Spec §5c).
- 2, o encontro do RF3: agora roda no checkout da linha, antes do `--ff-only` (§5f).
- 3, o veredito do RF2: só conta como `superada` a cancelada com push mais novo na mesma branch, e a cancelada sem sucessora é vermelha.
- 4, a decisão do commit: virou uma função só, a `decidirCommit`, com o índice lido por `git show :<arquivo>` e a lista `PAPEIS_DO_TIME`.
- 5, a lista do RF21: está em `texto.md:40-52`, com as quatro contradições do U11-6.
- 6, os destinos: cada seção do `CLAUDE.md` e os seis conflitos de skill têm lugar escrito.
- 7, `.claude/settings*.json`: corrigido.
- 8, `commit-msg` no lugar do `pre-commit`: escrito na D53, com o motivo.

O §8 da Tech Spec continua faltando de propósito: no modelo ele é "Uso de IA", e o §3 diz que não se aplica.

Bloqueantes:

1. **A terceira camada do RF14 reaproveita uma função que não serve para ela.** Está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/techspec.md:26` e `:67-70`, e em `cenarios.md:58-60`. A Tech Spec diz que o `ci:conferir-entregas` "aplica o `conferirEntrega` a cada commit desde a base com a develop". Essa função (`tools/processo/linhas.ts:345-371`) falha num histórico normal de spec, nos dois modos:
   - Com `naSpec`, ela exige que o último commit com código seja uma correção (`:369`). Toda spec cujo último commit é de tarefa fica vermelha.
   - Sem `naSpec`, com `tarefa` nula, só aceita a marca de correção (`:357`). Todo commit `(tarefa N.0)` é recusado.
   - Com o intervalo vazio, ela devolve `'nenhum commit novo'`, que conta como erro (`:349`).
   - Para ela, código é tudo que não é `.md` nem `tasks/` (`linhas.ts:314`). O hook usa `PASTAS_DE_CODIGO` mais a lista do §5(e). Então a esteira ficaria vermelha com commits que o hook aceitou como documento: `skills-lock.json`, `.gitignore`, `mockups/` e os `docs/*.json` fora do `ouro`.

   **Correção exigida:** escrever a regra no §5(a), com estes pontos:
   - A conferência é commit a commit, de `develop..HEAD`.
   - Código é a mesma classificação da `decidirCommit`.
   - É preciso decidir se a lista do RF16, que vale só em sessão de papel, conta como código para a esteira, que não sabe qual era a sessão.
   - Vale qualquer `(tarefa N.0)` ou `(correção <slug>)`, desde que haja a linha `Revisões:`.
   - O merge é julgado por `--remerge-diff`.
   - Intervalo vazio sai 0.
   - Não se exige "último commit é correção" nem "falta o commit da tarefa".

   E acrescentar em `cenarios.md` três casos:
   - merge limpo do encontro, sem marca: sai 0;
   - merge com conflito resolvido em código, sem marca: sai 1;
   - commit só de `skills-lock.json`: sai 0.

2. **`compose.yaml` e `.env.example` estão na tabela, mas nunca chegam a ela.** `tabela-de-guardioes.md:86` manda os dois ao `infra-guardian`. Só que nenhum deles está em `PASTAS_DE_CODIGO` (`revisoes.ts:41`) nem na lista do §5(e) (`techspec.md:91-94`). Na prática são documento: o commit passa sem tarefa e sem guardião, e essa linha da tabela nunca dispara. É exatamente o que o `infra-guardian` exigiu na rodada 1 (bloqueante 1, "Ambiente").

   **Correção exigida:** uma das duas.
   - Pôr os dois na lista do §5(e). Como a lista do PRD RF16 e a da D53 revista são fechadas, alinhar também esses dois textos, com o ok do Joaquim.
   - Ou tirar os dois da tabela e escrever que eles ficam sem guardião pelo caminho.

Recomendações:
- **`texto.md:8` e §9:** "o conflito na primeira linha do `SKILL.md`" quebra o frontmatter. Ele precisa começar na linha 1 com `---`, e o RF30 ficaria vermelho. Escrever "primeira linha depois do frontmatter".
- **§5(a), negação no `PreToolUse`:**
  - "Contém `CLAUDE_CODE_AGENT`" e "contém `--no-verify`" negam também `grep` e `printenv` em sessão de papel, inclusive para quem mantém o próprio hook. E isso é mais amplo do que `cenarios.md:53-56` lista. Casar só os argumentos do git e as formas de mexer no ambiente (`VAR=`, `unset`, `env -u`).
  - Acrescentar `GIT_CONFIG_*` aos limites declarados.
- **§5(f), RF3 no vermelho:** depois de a linha voltar ao commit de antes do merge, a quebra só aparece de novo depois de um novo `git merge <spec>`. A saída do encontro precisa dizer isso, como o caminho do conflito já diz (`linhas.ts:421-422`). Senão a correção passa verde na linha e o encontro fica vermelho de novo.
- **`cenarios.md:13`, caso (b) do RF2:** `timed_out` no job não acontece nesta esteira. O `ci.yml:105` registra que o e2e travado sai `cancelled`. O caso real é o (a); o (b) pode sair ou usar `cancelled`.
- **§5(c), o socorro:**
  - O `checkout origin/develop -- tools/processo` descarta em silêncio o que não foi commitado.
  - Ele deixa na árvore o `hook-git.ts`, o `portao.ts` e a pasta `git-hooks/`, que só existem na branch. O `commit-msg` pode continuar quebrado depois do socorro.
  - Escrever que, nesse caso, quem commita o conserto é o Joaquim, fora de sessão de papel.
- **RF26:** o orçamento de 20 KB tem duas definições. `texto.md:55` diz `SKILL.md` com `protocolo.md`; `cenarios.md:96` diz os bytes que o passo de tarefa manda ler, o que inclui o arquivo do passo. Além disso, o `protocolo.md` (7,9 KB) recebe a seção Skills do `CLAUDE.md`, perto de 4 KB.
- **RF9:** "o `/seguir` diz quando" não tem passo nomeado em `texto.md`.
- **RF10:** não está escrito como a base da correção é descoberta.
- **RF23 e RF24:** a tabela de auditoria das skills de processo e o critério de saída de cada papel não têm destino na Tech Spec.
- **`tabela-de-guardioes.md:81`:** a `decidirCommit`, em `portao.ts`, e a `REVISORES_COM_VETO` também podem anular a tabela. Considerar a mesma linha T P C I para elas.
- **Código fora da tabela:** `apps/*/test/`, `packages/nucleo/drizzle.config.ts` e `apps/web/vite.config.ts` são código e não têm linha. Escrever "nenhum" para eles.
- **Tabela de formas do RF14:** falta o merge limpo de outra linha feito por papel (R61).

Arquivos lidos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/prd.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/texto.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/tabela-de-guardioes.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/cenarios.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tools/processo/linhas.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tools/processo/revisoes.ts

## tenancy-guardian · 3ª rodada · REPROVADO · 2026-10-23 13:34:41 · `tasks/prd-harness/revisao-spec.md`

VEREDITO: REPROVADO

Tabelas verificadas: a X7 não cria tabela nenhuma (Tech Spec §3). Comparei cada exceção de `tabela-de-guardioes.md` com o código:
- `apps/web/src/componentes/ui/` (C): não tem `escolaId`, `anoLetivoId`, `fetch`, `useQuery` nem `@SemEscopo`, e nenhum arquivo cita "regra 10". `MotorFormulario.tsx` e `Mensagem.tsx` só citam `GET /v1/execucoes` em comentário; quem chama a API é quem usa a peça.
- `estilos.css`, `tema.ts` e os testes deles (nenhum): só cor e tema.
- `galeria/` (P): dado sintético. A única coisa que importa da API é o tipo `ErroDaApi`.
- `vite.config.ts`, `nome-dos-chunks.ts` e `rebaixar-cor.ts` (I): o único ponto de rede é o proxy de `/v1` para a borda, sem escopo.
- `apps/despachante/` (T P I): `despachante.ts:136-172` lê `escolaId` e roda em `executarNoContexto(contextoDaEscola(...))`. A exceção mantém o T, então está certa.

Correções da rodada 2, conferidas, todas feitas pelo padrão dos quatro:
- `auditoria/`, `retencao/`, `limite/` e `erro/` do núcleo agora pedem os quatro.
- `shared/src/sistema/` também.
- `apps/*/test/` também, com caso nomeado: `apps/api/test/estrutura-isolamento.int.test.ts`.
- `tools/guardas/**` inteiro, `eslint.config.mjs` e `eslint-suppressions.json` também.
- `e2e/**` (está em `PASTAS_DE_CODIGO`, `revisoes.ts:41`) também.

Queries verificadas: fora de `apps/`, `packages/`, `e2e/` e `tools/guardas/`, tem SQL com `escola_id` só em:
- `tools/vitrine/escola.ts:109-227`: seed sintético das fotos de tela, fora do runtime, e já pede P C.
- `tools/ia/medir-risco-a-vida.ts:156`: escola fixa da medida.

Nenhuma exceção da tabela tem query, escopo, contexto montado do token, nem contrato com `escolaId` ou `anoLetivoId`.

Teste de isolamento: não se aplica, porque a spec não cria módulo de produto. O teste da tabela (`tabela-de-guardioes.md:46-52`, `cenarios.md:73-76`) é efetivo para o padrão e para o `*.repository.ts`. Falta prova para três das regras de casamento (bloqueante abaixo).

Bloqueantes:

1. **`tabela-de-guardioes.md:15-17` e `:49-50` (com `cenarios.md:73-76`): três regras de casamento não têm teste.**
   - **O que está errado.** São três regras:
     - "nunca cai em exceção" para `*.controller.ts`, `*.gateway.ts` e `*.service.ts`;
     - o gatilho por conteúdo `@SemEscopo(` (regra 10, item 9; item 8 da minha lista);
     - "arquivo de exceção que cita 'regra 10' soma T".

     O teste só exercita o nome `*.repository.ts` e o "regra 20 soma P". Nenhuma exceção de hoje contém `@SemEscopo(` nem cita "regra 10". Por isso a varredura de "todo arquivo versionado" não alcança essas regras: apagar o gatilho de `@SemEscopo(`, tirar os três sufixos ou ligar "regra 10" ao guardião errado deixa a suíte verde.
   - **Correção exigida.** Em "O teste da tabela" e no RF15 de `cenarios.md`, somar estes casos, cada um com bloco de mutação:
     - um arquivo de cada exceção com nome `*.controller.ts`, `*.gateway.ts` e `*.service.ts` pede os quatro (`it.each`);
     - um arquivo em `apps/web/src/componentes/ui/`, com nome comum e `@SemEscopo(` no conteúdo do índice, pede os quatro; o mesmo arquivo sem o decorador continua só com C;
     - um arquivo de exceção que cita "regra 10" soma T, e um que cita "regra 70" soma C, ao lado do caso de "regra 20" que já existe.

Recomendações:
- Somar T também a arquivo de exceção que contém `escolaId`, `anoLetivoId` ou `/v1/` fora de comentário. Isso cobre um hook de dados que nasça dentro de `componentes/ui/`. E casar "regra 10" sem distinguir maiúscula de minúscula.
- Alguns arquivos alimentam a `decidirCommit` e estão em "o resto de `tools/`" e em `.claude/settings*.json` (nenhum): `hook-git.ts`, a lista de arquivos tirada do `git diff --cached`, o `revisoes.ts` que reexporta, o `comando-git.ts` e a entrada do `PreToolUse` no `settings.json`. Mexer neles anula a tabela só com `revisor-geral` e `test-engineer`. Vale pôr os quatro nesses arquivos, ou declarar o limite no §5(a).
- `vitest.config.ts` e `playwright.config.ts` (nenhum) e `.github/workflows/ci.yml` (só I) decidem quais testes de isolamento rodam. Vale um teste do harness: todo `*-isolamento*.int.test.ts` e o `apps/api/test/arquitetura.test.ts` caem em algum projeto do vitest que a esteira executa.
- A terceira camada (§5a) só confere o texto da marca e da linha `Revisões:`. Um commit forjado por script com `--no-verify` passa sem a minha rodada. Vale cruzar com a tabela "Revisões" do documento da tarefa, exigindo APROVADO dos guardiões que o caminho pede, ou declarar isso nos limites.
- Escrever que "nunca cai em exceção" vale também para as linhas da seção RF16. Por exemplo, um `@SemEscopo(` em `tools/vitrine/`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/tabela-de-guardioes.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/cenarios.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/prd.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/apps/despachante/src/despachante.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tools/vitrine/escola.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tools/processo/revisoes.ts

## test-engineer · 3ª rodada · REPROVADO · 2026-10-23 13:35:01 · `tasks/prd-harness/revisao-spec.md`

VEREDITO: REPROVADO

**Cenários exigidos:** os mesmos da rodada 2. São os cenários da esteira (RF1, RF2, RF9, RF19), das linhas (RF3, RF6, RF10), das mutações (RF4, RF5, RF17), do portão (RF7, RF8) e do hook (RF12 a RF18). No RF14 entram as formas, índice contra árvore, merge e `pre-push` dos dois lados, a negação do `PreToolUse` e a terceira camada. O RF15 vai linha a linha, pela `decidirCommit`, e o RF16 caminho a caminho, coerente com a tabela. Entram também a guarda de IA (RF24), o texto (RF20 a RF26 e RF30), o Maestri (RF27 a RF29) e os sete casos do PRD §7.

O que entrou nesta rodada também precisa de cenário:
- as regras de casamento da tabela;
- as linhas da tabela "Fora do código de produto";
- a classificação da terceira camada;
- o `flock` do encontro.

Domínio escolar e isolamento de escola não se aplicam: nada lê dado de escola.

**Cobertos:** conferi os 10 bloqueantes da rodada 2.
- **2 (RF2), resolvido** em `cenarios.md:14`:
  - (d) com a sucessora ainda `rodando`;
  - (e) sem os jobs da superada;
  - (c) a (e) testados nas duas funções;
  - `cancelled` pelo `timeout-minutes`;
  - (g) com outra branch ou com `pull_request`.
- **3 (RF9), resolvido** em `cenarios.md:21`: a vermelha mais nova leva à verde, e o artefato expirado sai 2.
- **4 (merge), resolvido** em `cenarios.md:43-45`: os dois lados do merge de papel.
- **5 (`pre-push`), resolvido** em `cenarios.md:53`: sem papel, o `push` para a `develop` passa.
- **6 (terceira camada), resolvido em parte** (`cenarios.md:64-68`). Entraram o histórico real de spec, a marca sem `Revisões:` e o `Fora do processo:`, que o papel tem recusado em `:46`. O que falta está no bloqueante 4.
- **7 (RF17 na `decidirCommit`), resolvido** em `cenarios.md:85-87`.
- **8 (guarda de IA), resolvido** em `cenarios.md:103`, dos dois lados.
- **9 (`compose.yaml` e `.env.example`), resolvido no §5(e)** (`techspec.md:95`, `cenarios.md:79`). O lado do guardião ficou sem caso: está no bloqueante 3.
- **10 (testes fora de `src`), resolvido** em `tabela-de-guardioes.md:47,51-52`.
- **1 (RF4), resolvido em parte:** o vocabulário está certo e o piso de 60 s está provado (`cenarios.md:16`). Os outros termos do prazo estão no bloqueante 1.

Fora da rodada 2, também estão cobertos:
- RF3 com `flock` e `npm ci`, dos dois lados;
- RF5 com o `--faltando` saindo 0;
- RF12, RF13 e RF18;
- a negação do `PreToolUse` com os casos que passam;
- o início de sessão;
- a seção C, com amostra quebrada e contagem mínima;
- RF27 a RF29.

**Bloqueantes:**

1. **`cenarios.md:16`, RF4: dos três termos do prazo, só o piso tem prova.**
   - O que está errado: `techspec.md:145` define o prazo do mutado como "o maior entre 3 × a medida, o prazo do teste e 60 s, até 10 min". Os casos (e) e "falha em 5 s" usam uma corrida limpa de 1 s. Com ela, o máximo é sempre o piso. Trocar a regra por "prazo = 60 s" passa em todos os casos.
   - Correção exigida, com relógio injetado:
     - 3 × a medida: limpa de 30 s e mutado que falha em 80 s dá `vermelho`. Sem o termo, dá `recusada`.
     - prazo do teste: limpa de 1 s, teste com prazo de 120 s e mutado que falha em 90 s dá `vermelho`.
     - teto: limpa de 4 min dá prazo de 10 min, e não de 12 (mutado de 11 min dá `recusada`).

2. **`tabela-de-guardioes.md:15-17` e `:49-50`: das regras de casamento, só duas têm caso.**
   - O que está errado: só `*.repository.ts` e "regra 20 soma P" têm caso.
   - Sem caso, e removíveis da implementação sem nenhum teste vermelho:
     - os sufixos `*.controller.ts`, `*.gateway.ts` e `*.service.ts`;
     - o casamento pelo conteúdo `@SemEscopo(`, que é outro mecanismo (lê o arquivo, não o nome) e é exatamente o caso da regra 10;
     - "regra 10" soma T e "regra 70" soma C.
   - Correção exigida: um caso para cada um, dentro de uma exceção. Por exemplo, `apps/web/src/componentes/ui/x.gateway.ts` e um arquivo de `apps/web/src/galeria/` com `@SemEscopo(`, os dois pedindo os quatro; e um arquivo de exceção citando "regra 10" (soma T) e "regra 70" (soma C). Os literais ficam escritos no teste, não lidos da constante.

3. **`cenarios.md:78-82` contra `tabela-de-guardioes.md:34-42`, RF16: só três das sete linhas da tabela têm o lado do guardião testado.**
   - O que está errado: `tools/guardas/` (P), `eslint.config.mjs` (T) e `ouro` (C) têm caso. As linhas abaixo não têm:
     - `tools/processo/guardioes-por-caminho.ts`, `portao.ts`, `caducidade.ts` e `documento-de-revisao.ts`, que pedem os quatro. É a tabela governando a si mesma: "mexer na exceção pede os quatro" (`tabela-de-guardioes.md:11`) não tem teste, e um commit que a reduz a "nenhum" não é pego.
     - `tools/vitrine/` (P e C).
     - `tools/ia/` (C).
     - `infra/`, `compose.yaml`, `.env.example` e `.github/` (I).
     - `eslint-suppressions.json` (os quatro).
     - O outro lado: "o resto de `tools/`" passa com só `revisor-geral` e `test-engineer`.
   - Correção exigida: para cada linha, um arquivo dela, sem o guardião da linha, recusado, e com ele, aceito. Para o resto, `tools/processo/linhas.ts` passa sem nenhum guardião com veto.

4. **`cenarios.md:63-69` contra `techspec.md:70-72`, terceira camada: a classificação e a marca de correção não têm caso.**
   - O que está errado: a camada classifica por "código de produto mais a lista do §5e", mas todo caso de "código" é de produto. Uma implementação que usa só `PASTAS_DE_CODIGO` (`revisoes.ts:41`) deixa passar um commit em `tools/guardas/` sem marca, empurrado por `env -u CLAUDE_CODE_AGENT`. Esse é justamente o furo que a camada existe para pegar.
   - E nenhum commit `(correção <slug>)` com `Revisões:` aparece no lado que sai 0, embora o `ci.yml` a chame em `correcao/**`. A regra "aceita só `(tarefa`" passa no teste e deixa vermelho todo push de correção.
   - Correção exigida:
     - sai 1: commit sem marca só em `tools/guardas/x.mjs`, e outro só em `.github/workflows/ci.yml`;
     - sai 0: histórico de `correcao/x` com `(correção x)` e `Revisões:`.

**Recomendações:**
- **RF4 (a) a (c):** declarar o prazo injetado curto (2 s). Com o piso real de 60 s, cada caso leva um minuto.
- **RF3, "dois encontros ao mesmo tempo":** dois processos de fato em paralelo, com o primeiro preso na trava por um comando de verificação injetado que espera um sinal (arquivo), e não por `sleep`. Assim o teste não depende da folga da máquina.
- **RF14, negação:** pôr no lado que passa `git -c user.name=x commit` e `GIT_AUTHOR_DATE=x git commit`. Hoje, recusar todo `-c` e todo `VAR=` passa no teste.
- **RF5:** cobrir também `&&`, `||`, ternário, `case` e expressão regular, que o §5(d) lista.
- **RF17:** caso em que só `apps/web/vite.config.ts` (fora de `src`) muda e o bloco não é exigido.
- **Terceira camada:** `Fora do processo:` com motivo vazio sai 1.
- **`package.json`:** um teste de que o `prepare` aponta `tools/processo/git-hooks`. Sem ele, um clone novo nasce sem hook e só o aviso de sessão percebe.
[… 4 linhas cortadas]

## conformidade-reviewer · 3ª rodada · REPROVADO · 2026-10-23 13:35:23 · `tasks/prd-harness/revisao-spec.md`

VEREDITO: REPROVADO

Caminhos de escrita em Nota: a X7 não cria nenhum caminho de escrita em Nota. Hoje o que faz as vezes de Nota é a aprovação do lote. Conferi três caminhos que gravam essa aprovação:
- `correcao.repository.ts`, que grava `validacao_do_lote` com `confirmada_por NOT NULL` e o gatilho do banco. Pede T P C I.
- O seed `e2e/__fixtures__/governanca.ts`, que agora pede T P C I.
- `tools/vitrine/escola.ts`, que chama esse seed e pede P C.

O `infra/scripts/expurgo-da-carga.ts`, que pede só I, grava apenas `execucao_agente` sintética de carga. Não grava aprovação nem nota.
Todos com autor humano? sim.

Decisão autônoma sobre aluno: ausente. A spec não põe IA no caminho do aluno.

Aprovação registrada: ok. `titular/`, `privacidade/`, `retencao/` e `ciclo-de-vida/` caem no padrão dos quatro. `componentes/ui/` inteiro pede C, e com isso `ui/ia/LinhaAprovacao.tsx` e `aprovacao.ts` também.

Supervisão do tutor: ok. `Faixa.tsx`, `onca/` e `Contador.tsx` estão em `componentes/ui/`, que pede C. `e2e/**` inteiro pede os quatro, com `aluno-tutor.spec.ts` no teste (`tabela-de-guardioes.md:51-52`). O realtime cai no padrão.

Autonomia declarada e visível: sim. `packages/shared/src/time/` e as áreas da web caem no padrão dos quatro.

**Correções da rodada 2, conferidas**
- **Bloqueante 1: feita.** As cinco pastas do núcleo, da api e do shared ficaram no padrão. A faixa e a onça ficaram em `componentes/ui/` com C. O §7b (`techspec.md:133`) e o PRD §8b (`prd.md:125`) agora dizem o que a tabela cobre de fato.
- **Bloqueante 2: feita.** `e2e/**`, specs e fixtures pedem os quatro (`tabela-de-guardioes.md:9-10`). O caso "`e2e/x.spec.ts` não exige nenhum" saiu do `cenarios.md`.
- **Recomendações atendidas:**
  - o ouro entrou na lista do RF21 (`texto.md:53`) e tem caso no RF16 (`cenarios.md:82`)
  - o bloco do formato não muda (`texto.md:59-60`)
  - as skills da marcação estão nomeadas (`texto.md:63`)
  - a vitrine pede P C
  - a contagem dos itens das regras 10, 20 e 70 entrou (`cenarios.md:98`)
  - "achado das regras 10, 20 e 70 nunca é menor" está em `texto.md:64` e na D79 revista

**Exceções contra o código.** Nenhuma exceção sem C cobre nota, validação humana, tutor, autonomia, decisão sobre aluno ou indicador de professor:
- `apps/despachante/` só tira job do banco e publica no Redis. A lógica mora no `DespachoRepository` do núcleo, que pede os quatro.
- `tema.ts`, `vite.config.ts`, `nome-dos-chunks.ts` e `rebaixar-cor.ts` são cor, tema e bundle.
- `estilos.css` é CSS global (ver recomendações).
- `galeria/` não cria peça: só monta peças de `componentes/`, que pedem C ou os quatro. O `pecas-ia.spec.ts` confere o texto exato da linha de aprovação e as assinaturas, com a contagem.

Bloqueantes:
1. **`tabela-de-guardioes.md:17` e `:50`. A regra "arquivo de exceção que cita regra 10, 20 ou 70 soma o guardião da regra citada" só tem teste para "regra 20 → P".**
   - Essa regra é a única rede que traz C a um arquivo novo dentro de uma exceção sem C (`galeria/`, `despachante/`, tema, bundle).
   - Uma mutação que tire "regra 70" ou "regra 10" do mapa passa no teste do jeito que ele está.
   - Pelo critério de severidade, isso é regra sem teste que a prove.
   - **Correção exigida:**
     - Em "O teste da tabela" (`tabela-de-guardioes.md:50`) e no RF15 de `cenarios.md:73-76`, um caso por regra citada:
       - "arquivo em `apps/web/src/galeria/` com 'regra 70' no texto sai com P C"
       - "arquivo em `apps/despachante/src/` com 'regra 10' sai com T P I" (já tem T por padrão: use uma exceção sem T, por exemplo `apps/web/vite.config.ts` com 'regra 10' sai com I T)
       - o lado que passa: "arquivo de exceção sem citação não soma"
     - Cada caso com bloco de mutação que tira a entrada do mapa.

Recomendações:
- **Galeria com C.** `apps/web/src/galeria/secoes/ia.tsx` e `marca-onca.tsx` são o dado do `e2e/pecas-ia.spec.ts` e do `pecas-marca-onca.spec.ts`, que provam o item 3 (autor, data, rejeição com motivo) e a D58. Mesmo motivo que deu P C à `tools/vitrine/`.
- **`estilos.css` com C, ou um motivo mais estreito.** É CSS global: uma regra `display:none` pode esconder o selo "IA" ou a faixa do Tutor. Hoje o arquivo pede "nenhum" (`tabela-de-guardioes.md:25`).
- **Entradas do hook na linha T P C I.** Hoje pedem "nenhum": `hook-git.ts`, `git-hooks/`, `tools/ci/conferir-entregas.ts`, o comando do `PreToolUse` em `.claude/settings.json` e `tools/processo/harness/guardioes.test.ts`. São as entradas que chamam a `decidirCommit`, e esse é o teste que prova a tabela. Dizer também em que arquivo fica o `REVISORES_COM_VETO` depois da partição (hoje está em `tools/processo/revisoes.ts:31`, que vira só reexportação).
- **Tarefa que edita guardião ou regra marca o guardião.** A tarefa da X7 que edita `.claude/rules/70-conformidade-cne.md` ou `.claude/agents/conformidade-reviewer.md` deve marcar `conformidade-reviewer`, porque documento não chama guardião pelo caminho. Na deduplicação do RF21, a frase da seção "Fotos da tela" que é própria da regra de cada guardião não muda, como já vale para "O que verificar" e para o formato.
- **Contagem dos itens da regra 70.** Declarar que conta os subitens (2a, 4a a 4d, 6a) e as linhas da tabela "A classificação, traduzida".
- **Soma por número de decisão.** A soma por citação poderia valer também para D45, D47, D55 a D59 e D64, e não só para "regra 70".
- **RF17 sem mutação.** Nos arquivos que pedem C, a linha "Sem mutação" deveria precisar também da concordância do `conformidade-reviewer` (repito da rodada 1).
- **Commit "Fora do processo".** O commit do Joaquim com `Fora do processo:` que leva código de produto entra na spec sem nenhum guardião. É prerrogativa dele (D53), mas o `/validar` poderia listar esses commits antes do pouso.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/tabela-de-guardioes.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/cenarios.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/texto.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/prd.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/apps/web/src/galeria/secoes/ia.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/apps/web/src/estilos.css
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/e2e/pecas-ia.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tools/processo/revisoes.ts

## infra-guardian · 3ª rodada · REPROVADO · 2026-10-23 13:35:46 · `tasks/prd-harness/revisao-spec.md`

VEREDITO: REPROVADO
Caminho quente tocado: nenhum no produto. A tabela do RF15 e do RF16 decide quem audita login, tutor, sala, prova, fila, IA e migration. Conferi as exceções contra o código.
Rate limit: não se aplica, porque a spec não cria rota. Com os quatro como padrão, todo limite em `apps/**` e `packages/**` passa a pedir o `infra-guardian`.
Fila e prioridade: problema. Em `compose.yaml` a separação entre worker interativo e worker de lote pede o `infra-guardian`. O teste que prova essa separação, `tools/ci/ambiente.test.ts`, não pede (bloqueante 2).
Concorrência: corrida em `tools/processo/linhas.ts:307` (`partida`) e `:278` (`abrir`), e no `abandonar` novo do RF6, contra o encontro sob trava da Tech Spec §5(f) (bloqueante 3).
Índice e paginação: ok na cobertura. A `Tabela.tsx` de `componentes/ui/` declara a regra 80.8 e fica sem I (bloqueante 1).
Degradação de IA: não se aplica à spec. O aviso de degradação no cliente (`AvisoFila.tsx`) fica sem `infra-guardian` (bloqueante 1).
Migration: não se aplica. `drizzle/`, `src/db/` e `drizzle.config.ts` pedem os quatro.
Métrica e alerta: ok. O censo do RF9 sai com 2 quando o artefato expira ou falta uma fatia, e sobe só o JSON.

Correções da rodada 2:

| Rodada 2 | Situação |
|---|---|
| 1 a 4. Web, shared, núcleo e api sem I | Feitas: com os quatro como padrão, todas pedem I. Conferi que nenhuma cai em exceção |
| 5. `apps/*/test/` e `drizzle.config.ts` | Feita. O teste de pasta nova cobre `apps/**` inteiro |
| 6. RF2 do PRD | Feita (`prd.md:48`). O PRD agora bate com a §5(f) e com os casos (a) a (g) do `cenarios.md` |
| 7. Encontro sem trava | Feita em parte: só o encontro pega a trava (bloqueante 3) |

As exceções existem no código. `vite.config.ts`, `nome-dos-chunks.ts`, `rebaixar-cor.ts`, os testes deles, `estilos.css`, `tema.ts`, `galeria/` e `apps/despachante/` (`src/` e `test/`) estão nos caminhos da tabela. As que levam I estão certas. `galeria/` e `tema.ts` não cruzam nada da regra 80.

Bloqueantes:

1. **Exceção de `componentes/ui/` e regra de soma sem a regra 80** (`tasks/prd-harness/tabela-de-guardioes.md:24` e `:17`). A exceção dá só C, com o motivo "peça visual sem dado nem chamada". No código, três peças dela declaram a regra 80:
   - `apps/web/src/componentes/ui/ia/AvisoFila.tsx:13`: "nunca erro cru", que é a regra 80.4, a degradação de IA na tela do aluno.
   - `apps/web/src/componentes/ui/sobrepostos/DialogoDeConfirmacao.tsx:36`: "o clique duplo não manda duas decisões", que é a regra 80.7, e é a peça que o `Aprovar` do professor usa.
   - `apps/web/src/componentes/ui/Tabela.tsx:41`: a regra 80.8.

   A regra de casamento da linha 17 só soma guardião para "regra 10", "regra 20" e "regra 70". Fazer o `AvisoFila` receber a mensagem do erro, ou soltar o `disabled={confirmando}`, passa sem o `infra-guardian`.

   **Correção exigida:**
   - A linha 17 passa a somar I para o arquivo que cita "regra 80".
   - O teste da tabela ganha estes casos: `componentes/ui/ia/AvisoFila.tsx` sai com C P I, e `componentes/ui/sobrepostos/DialogoDeConfirmacao.tsx` sai com C I.

2. **O resto de `tools/` sem guardião, contra o próprio RF16** (`tabela-de-guardioes.md:42`; `prd.md`, RF16: "o guardião da regra que a guarda ou o corpus protege"). Três caminhos ficam com "nenhum" e protegem a regra 80:
   - `tools/ci/ambiente.test.ts` prova o que o `compose.yaml` (com I) promete: o `worker-interativo` atende interativa e normal, o `worker-lote` só lote, os pools e as vagas de dez escolas (D25), o healthcheck e o `migrar` antes das instâncias.
   - `tools/ci/dockerfile.test.ts` prova a imagem de produção.
   - `tools/testes/` traz `redis-travado.ts`, `metricas.ts`, `promql.ts` e `integracao.setup.ts`. São fixtures de 80 testes em `apps/`, `packages/` e `infra/`, entre eles os do Redis fora e do contador em janela.

   Enfraquecer qualquer um deles derruba a prova da fila e da degradação sem a minha rodada. É o mesmo furo do bloqueante 5 da rodada 2, agora fora de `apps/`.

   **Correção exigida:**
   - I em `tools/ci/ambiente.test.ts`, em `tools/ci/dockerfile.test.ts` e em `tools/testes/`.
   - Um caso de cada um no `guardioes.test.ts` e no caso do RF16 em `cenarios.md`.

3. **Só o encontro pega a trava; os outros que gravam o quadro, não** (`techspec.md:112`; `cenarios.md:15` e `:18`; `tools/processo/linhas.ts:278`, `:307` e o `abandonar` do RF6).
   - Agora o encontro segura o quadro lido no início por cerca de 80 s, ou cerca de 4 min com `npm ci`, e grava `restante` a partir dessa leitura (`linhas.ts:435-436`).
   - `partida`, `abrir` e o `abandonar` novo leem e gravam o `linhas.json` sem trava.
   - Uma `partida 2` durante o encontro da linha 1 grava a linha 2 como ocupada, e o encontro sobrescreve com a leitura velha: a linha 2 volta a livre enquanto o Implementador 2 trabalha.
   - É o padrão "busca, verifica, grava" sem trava, que a spec já admite ao prever dois encontros ao mesmo tempo.

   **Correção exigida:**
   - `abrir`, `partida`, `abandonar` e `encontro` pegam a mesma trava, no `.processo/` da raiz do andar, onde está o quadro, e não no checkout da linha.
   - Cada um relê o quadro com a trava e grava só a própria linha.
   - Casos novos no RF3 e no RF6: `partida 2` durante o encontro da linha 1 deixa o quadro final com a 2 ocupada e a 1 livre; `abandonar 3` durante o encontro da linha 1 deixa a 3 livre e não volta.

Recomendações:
- `.dockerignore` e `.nvmrc` decidem a imagem e o runtime, e o `dockerfile.test.ts` os lê. Hoje caem em "documento" no §5(e). Vale somá-los à lista do RF16 com I.
- Na §7c, dizer de onde sai "o prazo do teste" na conta do prazo da mutada: o `testTimeout` do projeto Vitest do arquivo, ou o declarado no caso.
- Na §5(f), escrever que a `partida` espera a trava com prazo, ou sai com o código "encontro em curso", para o Orquestrador não ficar parado 4 min sem saber por quê.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/tabela-de-guardioes.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/cenarios.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/prd.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tools/processo/linhas.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/apps/web/src/componentes/ui/ia/AvisoFila.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/apps/web/src/componentes/ui/sobrepostos/DialogoDeConfirmacao.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/apps/web/src/componentes/ui/Tabela.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tools/ci/ambiente.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tools/ci/dockerfile.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tools/testes/redis-travado.ts

## privacy-guardian · 3ª rodada · REPROVADO · 2026-10-23 13:35:59 · `tasks/prd-harness/revisao-spec.md`

VEREDITO: REPROVADO

**Campos pessoais tocados:** nenhum. A spec não cria tabela nem rota e não usa IA (Tech Spec §3, §4). Fora do git, só `.processo/limpeza.json`, que guarda `{pedida, feita}`.

**Fora da tabela de dados do docs/lgpd.md:** nada.

**Autorização por objeto:** não se aplica, porque a spec não cria rota. O que cobra a minha regra é a tabela do RF15 e do RF16, e ela ainda deixa um furo (bloqueante 1).

**Logs:** limpos no desenho. O log do hook leva caminho e nome de revisor (§7), o `UserPromptSubmit` não grava o texto (§5h, `cenarios.md:119`), e a linha `Fora do processo:` não carrega dado de pessoa.

**Auditoria:** não se aplica, porque a X7 não cria nenhuma ação auditável.

**Envio externo:** nenhum novo. O `--censo` baixa da própria esteira o JSON do Playwright, e o `ci.yml` sobe só o reporter JSON, sem trace nem anexo, por 7 dias (`techspec.md:107`). Isso cumpre a minha recomendação da rodada 2.

**Seed/fixture:** sintético. `e2e/__fixtures__/` e `apps/web/src/__fixtures__/` agora pedem os quatro guardiões (`tabela-de-guardioes.md:9-10`).

**Correções da rodada 2, conferidas:**
- **Bloqueante 1** (`contexto/`, `config/`, `fila/`, `limite/`, `shared/erros` e `sistema`, `api/sistema` e a raiz, `web/componentes`, `areas/` com pasta nova): feito pela inversão do padrão. Nenhuma dessas pastas aparece entre as exceções, e o caso "pasta nova inventada sai com os quatro" está em `tabela-de-guardioes.md:51-52`.
- **Bloqueante 2:** feito. `tools/guardas/` e `eslint.config.mjs`/`eslint-suppressions.json` pedem T P C I (`tabela-de-guardioes.md:36`, `:38`), e `cenarios.md:81` tem o caso `tools/guardas/index.mjs` sem `privacy-guardian`: recusado.
- **Recomendações da rodada 2:** o aplicador da tabela pede os quatro (`:37`), o despachante pede P (`:28`), e o censo sobe só o JSON (§5f). Todas feitas.

**As exceções conferidas contra o código:**
- **`componentes/ui/` → C:** "sem dado nem chamada" vale quase sempre. Duas peças aplicam a regra 20 e citam "regra 20" no texto, então somam P:
  - `ui/ia/motor-formulario.ts:11`: a Adaptação sem texto livre (regra 20, item 3).
  - `ui/ia/AvisoFila.tsx:13`: nenhum texto de exceção chega à conversa (item 11).

  O `MotorFormulario.tsx` cita só "D35, D67", então fica com C. Não é vazamento, porque o servidor recusa texto livre pelo `z.enum(TIPOS_DE_ADAPTACAO)` em `packages/shared/src/assistente/conteudo.ts:47`, que pede os quatro. Ficou como recomendação.
- **`estilos.css`, `tema.ts` → nenhum:** ok. O `localStorage` de `tema.ts:43-86` guarda só a preferência de aparência do aparelho.
- **`galeria/` → P:** ok. Só dado sintético, e a galeria só entra no build com `VITE_COM_GALERIA`.
- **`vite.config.ts`, `nome-dos-chunks.ts`, `rebaixar-cor.ts` → I:** ok. Alvo de navegador, proxy local e nome de chunk; nada de dado, token, log ou envio.
- **`apps/despachante/` → T P I:** ok. Os logs levam só `jobId`, `evento` e o erro resumido (`despachante.ts:100-307`).

**Bloqueantes:**

1. **`infra/` pede só I, e o resto de `tools/` não pede guardião nenhum (`tabela-de-guardioes.md:41` e `:42`; Tech Spec §5e).** Isso contradiz o RF16 do PRD e a D53 revista, que pedem "o guardião da regra que a guarda protege". Três coisas da regra 20 ficam sem a minha rodada:
   - **`infra/Caddyfile:9-18`:** é a única barreira que impede a borda de logar URL com query, IP e User-Agent de toda requisição de aluno (regra 20, item 9). Basta tirar o `exclude http.log.access` para isso voltar ao log.
   - **`tools/ci/borda.test.ts:100-128`:** é o teste que prova essa barreira, e hoje cai em "nenhum".
   - **`infra/grafana/alertas/`:** `eliminacao-vencida.yaml`, `arquivo-em-preparacao.yaml`, `expurgo-noites-incompletas.yaml` e `incidente-sem-confirmacao.yaml` são os alarmes dos prazos de eliminação (LGPD art. 18, VI), de acesso e portabilidade (art. 19, II), de retenção (regra 20.16) e de incidente (art. 48). Apagar um deles faz o prazo do titular vencer calado.

   A regra "arquivo de exceção que cita regra 20 soma P" (`:17`) não resolve. Ela fala de "exceção" e está escrita para a tabela do código, `borda.test.ts` não cita a regra 20, e os alertas citam "LGPD", não "regra 20".

   **Correção exigida:**
   - `infra/` → I P. Se preferir uma lista fina: `infra/Caddyfile` e `infra/grafana/alertas/` → I P.
   - `tools/ci/borda.test.ts` → P.
   - Em `cenarios.md` (RF16), dos dois lados: `infra/Caddyfile` sem `privacy-guardian`: recusado; `tools/ci/borda.test.ts` sem `privacy-guardian`: recusado; um arquivo de `infra/k6/` com `infra-guardian` e `privacy-guardian`: passa.

**Recomendações:**
- **Regra de casamento da citação (`tabela-de-guardioes.md:17`, teste em `:50`).** Ela deve ler o texto do HEAD **e** o do índice. Hoje, o commit que tira a garantia junto com o comentário "regra 20" deixa de somar P. Vale um caso em `cenarios.md`: arquivo de exceção que citava "regra 20" no HEAD e não cita no índice, sem `privacy-guardian`: recusado. Vale também escrever se a regra vale para as linhas do RF16.
- **`apps/web/src/componentes/ui/ia/` → P C**, como entrada mais longa. O `MotorFormulario.tsx` é o formulário que recebe a Adaptação (D35, D67). Retiro a concessão que fiz na rodada 2 ("`ui/ia/` segue `conformidade`"): hoje o servidor segura, mas a peça é o ponto de coleta.
- **`.github/` e `playwright.config.ts` → +P.** O repositório é público, e são eles que decidem o que entra no artefato (trace, captura de tela, corpo de requisição). O comentário em `ci.yml:103-104` já cita a regra 20, item 17.
- **`tools/ia/` → P C.** `exigirModeloDaMedida` (`tools/ia/medir-risco-a-vida.ts:199-206`) é a trava "modelo local, salvo `--provedor-contratado`" da regra 20, item 13. O corpus é sintético, então hoje não há vazamento.
- **Mantida da rodada 1:** a decisão do Joaquim sobre `.claude/rules/20-lgpd-menores.md`, `.claude/agents/privacy-guardian.md` e `docs/lgpd.md` continuarem mudando como documento, sem rodada.

**Pergunta de fechamento:** a X7 não toca o caminho do titular. `packages/nucleo/src/titular/` e o resto do código de produto continuam pedindo os quatro guardiões, e o teste da tabela (`tabela-de-guardioes.md:51`) prova isso para `titular/leitura-do-titular.ts`. O furo do bloqueante 1 é no rastro operacional (log da borda e alertas de prazo), não na resposta ao titular.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/tabela-de-guardioes.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/cenarios.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/prd.md (diff)
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/revisao-spec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/achados/revisao-spec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/infra/Caddyfile
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tools/ci/borda.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/apps/web/src/componentes/ui/ia/motor-formulario.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/apps/web/vite.config.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/apps/despachante/src/despachante.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tools/ia/medir-risco-a-vida.ts

```
VEREDITO: REPROVADO
Campos pessoais tocados: nenhum
Fora da tabela de dados do docs/lgpd.md: nada
Autorização por objeto: não se aplica (sem rota); a cobrança vem da tabela do RF15/RF16, furada no RF16 (bloqueante 1)
Logs: limpos no desenho; mas a config que impede log de requisição na borda (infra/Caddyfile:9-18) muda sem privacy-guardian
Auditoria: não se aplica
Envio externo: nenhum novo; o censo baixa só o reporter JSON da própria esteira (techspec.md:107)
Seed/fixture: sintético; e2e/__fixtures__ e apps/web/src/__fixtures__ pedem os quatro
Bloqueantes: tabela-de-guardioes.md:41-42 — infra/Caddyfile (regra 20.9), tools/ci/borda.test.ts e infra/grafana/alertas/ dos prazos LGPD sem P; exigido: infra/ → I P (ou Caddyfile e alertas/ → I P), tools/ci/borda.test.ts → P, e os casos em cenarios.md (RF16)
Recomendações: regra da citação lendo HEAD e índice, e valendo para o RF16; ui/ia/ → P C; .github/ e playwright.config.ts +P; tools/ia/ +P; documentos da regra 20 mantidos da rodada 1
[… 1 linhas cortadas]

## revisor-geral · 3ª rodada · REPROVADO · 2026-10-23 13:37:33 · `tasks/prd-harness/revisao-spec.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: há divergência em dois pontos. No §5(a), nos limites declarados do RF14. No `texto.md`, na definição do orçamento do RF26, que não bate com o corte do `/seguir`.
Portão local: não se aplica. É revisão de spec e não há código. O `conferir` responde "nunca passou nesta árvore", como na rodada 2.

**Os dois bloqueantes da rodada 2 foram corrigidos.**
- **Terceira camada.** O §5(a) agora tem regra própria:
  - confere commit a commit de `develop..HEAD`;
  - usa a classificação da `decidirCommit` com a lista do §5(e);
  - julga o merge por `--remerge-diff`;
  - intervalo vazio sai 0, e o job usa `fetch-depth: 0`.

  O `cenarios.md` já traz os três casos que pedi: merge limpo, merge com conflito em código e o commit só de `skills-lock.json`.
- **`compose.yaml` e `.env.example`.** Estão no §5(e), no RF16 do PRD e na D53 revista.

**As recomendações da rodada 2 também foram atendidas:**
- o conflito vem depois do frontmatter;
- a negação só nos argumentos do git e no ambiente, com `GIT_CONFIG_`;
- a saída do RF3 manda refazer o merge;
- o socorro diz o que perde e quem commita;
- o `cancelled` do RF2;
- o passo do RF9;
- a base do RF10;
- os destinos do RF23 e do RF24;
- os quatro aplicadores da tabela;
- `apps/*/test/` sob o padrão;
- o merge limpo de papel.

**Bloqueantes:**

1. **§5(a), "Limites declarados (RF14)", `techspec.md:68-74`. A linha `Fora do processo:` não identifica quem escreveu, e isso não está declarado.**
   - Quem recusa a linha vinda de papel é só o `hook-git.ts`. Ele não roda justamente nos casos que a terceira camada existe para pegar: `env -u CLAUDE_CODE_AGENT` ou `--no-verify` dentro de script, `commit-tree`.
   - Nesses casos, um commit com a linha `Fora do processo: x` passa nas três camadas. O mesmo vale para o Orquestrador, que não tem papel: um commit dele por `/usr/bin/git` ou `sh -c` não passa pelo `commit-msg`.
   - O RF14 do PRD exige que o que a máquina não barra "fica escrito". A D53 revista diz que "a esteira recusa" esse commit. Sem a ressalva, as duas afirmações valem menos do que dizem.
   - **Correção exigida:**
     - escrever no §5(a) que a terceira camada não sabe quem escreveu a linha, e que papel que escapou do hook e o Orquestrador passam com ela;
     - pôr no `cenarios.md` o caso "`env -u` com `Fora do processo:` sai 0 na terceira camada", como limite conhecido;
     - dizer se a `decidirCommit`, chamada pelo `PreToolUse` numa sessão sem papel, aceita `Fora do processo:`. O PRD §4 proíbe o Orquestrador de commitar código.

2. **`texto.md:55-58` (RF22 e RF26). O orçamento cita um arquivo que o próprio corte não cria, e a conta não fecha.**
   - O texto mantém no `SKILL.md` os passos 1, 2, 5 e 6. O passo 6 é "O ciclo de uma tarefa". Mesmo assim, o orçamento soma "o arquivo do passo de tarefa", que nesse desenho não existe.
   - Medido hoje, só o que fica passa de 20 KB:

     | Parte | Tamanho |
     |---|---|
     | Cabeçalho e passos 1, 2, 5 e 6 | ≈ 12,6 KB |
     | `protocolo.md` | 7,9 KB |
     | Seção Skills do `CLAUDE.md`, que vai para o `protocolo.md` | 4,0 KB |
     | **Total** | **≈ 24,5 KB, mais o índice** |

   - O passo 6 não tem entrada datada de diário de incidentes, então o RF22 não tira bytes dele.
   - O Implementador vai encontrar o teste do RF26 vermelho e vai ter de escolher sozinho o que corta ou o que move.
   - **Correção exigida:**
     - decidir se o passo 6 fica no `SKILL.md` ou vai para `passos/`;
     - reescrever o orçamento só com arquivos que existem no desenho;
     - escrever de onde saem os cerca de 5 KB que faltam, ou rever o teto de 20 KB com o Joaquim. O teto está no critério do RF26.

**Recomendações:**
- **`tabela-de-guardioes.md:37`:** pelo próprio critério ("aplicam a tabela e a lista de veto"), também anulam a tabela:
  - `hook-revisoes.ts` e `hook-git.ts`;
  - `revisoes.ts`, que continua sendo a importação do `hook-revisoes.ts` depois de partido;
  - `comando-git.ts` e `git-hooks/`;
  - a linha do `PreToolUse` no `.claude/settings.json`.

  Hoje esses arquivos saem com "nenhum" guardião.
- **`tabela-de-guardioes.md:41`:** `infra/` está sob o título "só em sessão de papel". Só que o `infra/` está em `PASTAS_DE_CODIGO` (`revisoes.ts:41`), que vale para toda sessão (§5e). Mover para a seção de código, com o motivo de pedir só I.
- **§5(a), limites:** acrescentar `git am` e `revert` à lista (`am` não chama o `commit-msg`). Escrever também que o `--no-verify` dentro de script fura o `pre-push` e que a terceira camada não roda na `develop`. Usar `origin/develop..HEAD`, que é a ref que existe no checkout da esteira.
- **§5(e):** `package-lock.json` e `.dockerignore` estão fora da lista. Avaliar se entram.
- **`texto.md:25`:** definir o que a "base fixa" soma. Pela conta dos 75 KB do PRD §1, é o `CLAUDE.md` mais as regras sem `paths:`.
- **§5(f), RF3:** os "~80 s / ~4 min" são estimativa. Falta um prazo que encerre o encontro.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/prd.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/texto.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/tabela-de-guardioes.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/cenarios.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/revisao-spec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/tasks/prd-harness/achados/revisao-spec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness/docs/decisoes.md
[… 3 linhas cortadas]
