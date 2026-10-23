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
