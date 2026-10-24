# Achados das revisões — `tasks/correcoes/2026-10-24-acabamento-de-texto-x7.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-24 20:01:59 · `tasks/correcoes/2026-10-24-acabamento-de-texto-x7.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. O diff só troca texto e comentários em `.claude/hooks/contexto-inicial.sh`, `.claude/skills/{executar-task,retro,seguir}`, `docs/aia/ouro-retido/README.md`, `tools/ci/` e `tools/processo/`. A única mudança de comportamento é a regex de um teste do hook de commit. Não há mudança em migration, schema, DTO, repository, rota, storage nem em `apps/*/src` ou `packages/*/src`.

Fora da tabela de dados do docs/lgpd.md: nada, porque não entra campo novo.

Autorização por objeto: ok. Nenhuma rota ou consulta mudou.

Logs: limpos. O aviso do `contexto-inicial.sh` mostra só o valor de `core.hooksPath`, e o texto novo é menor que o anterior. A asserção nova de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-acabamento-de-texto-x7/tools/processo/hook-git.int.test.ts:663-664` confere o nome de um módulo de processo no stderr, que não é dado de pessoa.

Auditoria: não se aplica. A correção não lê dado de aluno, não exporta, não altera nota nem permissão e não aprova saída de IA.

Envio externo: nenhum. O diff não envolve provedor de IA, `ExecucaoAgente` nem conversa de tutor.

Seed/fixture: nenhum foi tocado. O documento da tarefa, `tasks/correcoes/2026-10-24-acabamento-de-texto-x7.md`, não tem dado de pessoa.

Bloqueantes: nenhum.

Recomendações: nenhuma da regra 20.

Pergunta de fechamento: a correção não muda nada que guarde ou envie dado de aluno. A resposta continua a mesma de antes, pelos caminhos já cobertos por `apps/api/test/arquivo-do-titular.int.test.ts` e `apps/api/test/pedido-titular.int.test.ts`.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-24 20:02:00 · `tasks/correcoes/2026-10-24-acabamento-de-texto-x7.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok (não se aplica: nenhum endpoint, limitador ou bloqueio mudou)
Fila e prioridade: ok (não se aplica: nenhum job nem fila mudou)
Concorrência: protegida (não se aplica: nenhuma operação de escrita nova)
Índice e paginação: ok (não se aplica: nenhuma query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica: nenhum código no caminho quente e nenhum alerta novo)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-acabamento-de-texto-x7/.claude/skills/seguir/passos/6-tarefa.md`: para ganhar folga no teto de 24.000 B, o texto perdeu "o de ambientes de teste da máquina", que explicava o teto de 3 linhas, e o trecho "a fila de carga é do portão e do e2e". São as duas frases que dizem por que não se abre uma quarta linha e por que não se serializa à mão. Se o texto voltar a crescer, vale guardá-las em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-acabamento-de-texto-x7/docs/infra.md` ou no `protocolo.md`, para não se perderem num corte futuro.

Rodei o caso alterado de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-acabamento-de-texto-x7/tools/processo/hook-git.int.test.ts` ("o módulo %s que não carrega…") e os 3 casos passam com a regex nova, que exige o nome do módulo. Nenhum teste chama provedor pago. Fora esse teste, as mudanças desta correção ficam em comentário de `tools/`, skill, hook de contexto e documento, e nenhuma toca `apps/*/src` nem `packages/*/src`.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-24 20:02:14 · `tasks/correcoes/2026-10-24-acabamento-de-texto-x7.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. Correção vinda da retro, sem `techspec.md`. Os cinco itens do `TODO.md` (X7, retro, M7) estão feitos. O único arquivo a mais é o `portao-local.ts`, e o documento o declara.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-acabamento-de-texto-x7/tools/processo/hook-git.int.test.ts:664`: a regex nova `portao\.ts` também casa com `sequencia-do-portao.ts`. O comentário diz que "o módulo errado" não passa, e para `portao.ts` isso não vale por inteiro. Prender o nome a uma barra antes dele resolve: `new RegExp('/' + modulo.replaceAll('.', '\\.'))` ou `` `[\\/]${...}` ``.
2. Ainda há citações de `revisoes.ts` como dono da lógica fora da lista do TODO:
   - `tools/guardas/escopo-dos-repositories.ts:254` é um comentário velho. Ele diz que o campo interno do compilador é usado "como em `tools/processo/revisoes.ts`", e esse arquivo hoje só reexporta.
   - `tools/processo/documento-de-revisao.ts:48`, `:204` e `:329` são textos que o hook grava nos documentos da tarefa ("Preenchida pelo hook `tools/processo/revisoes.ts`"). Mudar esses textos muda o que fica gravado, então não cabia nesta correção, que só mexe em comentário. Fica como item no TODO, com o nome certo (`hook-revisoes.ts`).
3. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-acabamento-de-texto-x7/.claude/skills/seguir/passos/6-tarefa.md:81-82`: "confere a marca e a linha `Revisões:` dos commits novos" perdeu o "com código" que estava em "exige ... em todo commit novo com código". Agora o texto dá a entender que commit só de documento também precisa da linha. Na próxima vez que alguém mexer nesse texto, voltar o "com código", se couber nos 325 B de folga.

## test-engineer · 1ª rodada · APROVADO · 2026-10-24 20:02:58 · `tasks/correcoes/2026-10-24-acabamento-de-texto-x7.md`

VEREDITO: APROVADO

**Cenários exigidos:** os que a correção declara que provam alguma coisa.
- **Item 2:** se o módulo que o teste apagou não carrega, o hook recusa o commit, e a mensagem de erro traz o nome desse módulo. Não basta o código de erro `ERR_MODULE_NOT_FOUND`.
- **Item 3:** a skill da retro contém o termo novo, e o teste fica vermelho se o termo sair.
- **Item 4:** os três arquivos do `/seguir` juntos ficam abaixo de 24.000 B.
- **Itens 1 e 5:** são só comentário e documento, sem regra a provar. O documento declara isso com motivo.

Esta correção não tem cenário escolar, de isolamento nem de concorrência: não mexe em dado de escola nem em operação que possa rodar duas vezes ao mesmo tempo.

**Cobertos:**
- **Item 2:** `tools/processo/hook-git.int.test.ts:655-665`, o caso "o módulo %s que não carrega recusa o commit de papel", com `portao.ts`, `comando-git.ts` e `mutacoes.ts`. O teste confere que o commit não foi criado (`criou` falso) e que a saída não é 0, o que prova a recusa. A regex nova pede o nome do módulo e não aceita mais o código de erro sozinho. Rodei os três casos e passaram.
- **Item 3:** `tools/processo/harness/seguir.test.ts:137-141`. O caso "%s: sem o texto, vermelho" (linha 568) prova que o termo é lido de verdade. O texto antigo, "salvo os do grupo seguinte", não contém o termo novo, então o teste ficaria vermelho com a skill do HEAD.
- **Item 4:** "os três acima de 24.000 B" (`seguir.test.ts:382`). Medi com `wc -c`: 6.843 + 7.833 + 8.999 = 23.675 B, igual ao que o documento diz.
- Rodei `seguir.test.ts` e `metadados.test.ts` juntos: 159 de 159 passaram. Nenhum termo de `REQUISITOS_DO_TEXTO` se perdeu nos cortes do `6-tarefa.md` e do `protocolo.md`.
- Não há `.skip`, teste comentado nem mock. Nada muda em `apps/*/src` nem em `packages/*/src`, e a linha `**Sem mutação:**` tem motivo escrito.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **A regex do item 2 ainda aceita o módulo errado no caso do `portao.ts`.** Ela casa o nome em qualquer ponto do stderr, e a mensagem do Node para um módulo que falta tem a forma "Cannot find module '<faltante>' imported from <quem importa>".
   - Se faltar um módulo que o `portao.ts` importa (`caducidade.ts`, `documento-de-revisao.ts`, `guardioes-por-caminho.ts`), o "imported from .../portao.ts" casa com `portao\.ts`.
   - `hook-portao.ts` também contém `portao.ts`.
   - Isso pode acontecer de verdade: se o `repositorio()` deixar de copiar um módulo novo, o caso do `portao.ts` passa sem testar o que diz.
   - Correção sugerida em `hook-git.int.test.ts:664`: amarrar à parte de quem falta, com `new RegExp(\`Cannot find module '[^']*/${modulo.replaceAll('.', '\\.')}'\`)`.
   - O comentário da linha 663 promete mais do que a regex entrega hoje.
2. **"Não chega como mensagem:" não tem termo próprio em `REQUISITOS_DO_TEXTO`.** Uma correção anterior já tirou essa frase de `passos/6-tarefa.md` (item 4 do documento), e um termo no teste de `seguir.test.ts` impediria que um corte futuro para caber no teto a tirasse de novo.
3. **Ainda há citações de `tools/processo/revisoes.ts` como dono do hook, fora da lista do TODO.** Estão em:
   - `.claude/skills/criar-tasks/task-template.md:171`
   - `.claude/skills/revisar-tarefa/SKILL.md:14`
   - `.claude/skills/seguir/time.md:25`
   - `tools/processo/documento-de-revisao.ts:48`, `:204` e `:329`. Este é texto que o hook grava nos documentos de tarefa.
   - `tools/guardas/escopo-dos-repositories.ts:254`

   É o mesmo sintoma do item 1. A correção já foi além da lista no `portao-local.ts`; vale fazer o mesmo com estas, ou deixar uma linha no TODO.
4. **`retro/SKILL.md:93` ainda diz "ela passa para o grupo seguinte"**, a mesma vaguidão que o item 3 corrigiu duas linhas acima. Dá para trocar por "para a confirmação".

Arquivos citados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-acabamento-de-texto-x7/tools/processo/hook-git.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-acabamento-de-texto-x7/tools/processo/harness/seguir.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-acabamento-de-texto-x7/tasks/correcoes/2026-10-24-acabamento-de-texto-x7.md`

## test-engineer · 2ª rodada · APROVADO · 2026-10-24 20:08:14 · `tasks/correcoes/2026-10-24-acabamento-de-texto-x7.md`

VEREDITO: APROVADO

Cenários exigidos (nesta rodada, só o diff desde a aprovação anterior e as três recomendações aplicadas):
- Recomendação 1: o teste do módulo que não carrega tem de exigir, no `stderr`, o nome do módulo que faltou, e o `portao.ts` não pode passar só porque o nome `sequencia-do-portao.ts` também aparece.
- Recomendação 2: "Não chega como mensagem:" tem de ter um termo próprio em `REQUISITOS_DO_TEXTO`.
- Recomendação 4: `retro/SKILL.md` não pode mais dizer "ela passa para o grupo seguinte".

Cobertos:
- **1, feita.** A asserção em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-acabamento-de-texto-x7/tools/processo/hook-git.int.test.ts:665` agora exige que a mensagem de erro do Node contenha `Cannot find module '<caminho>/<módulo>'`.
  - No caso do `portao.ts`, o trecho "-do-portao.ts'" não casa com a regex, porque antes de `portao.ts` ela pede uma barra e não um hífen. Com isso o caso não passa mais pelo módulo errado.
  - Rodei os três casos do `it.each` (`portao.ts`, `comando-git.ts`, `mutacoes.ts`) e todos passam, o que confirma que a mensagem do Node tem mesmo esse formato. Os 49 "skipped" da saída vêm só do filtro `-t`.
- **2, feita.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-acabamento-de-texto-x7/tools/processo/harness/seguir.test.ts:102-106` cita um termo que aparece literal em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-acabamento-de-texto-x7/.claude/skills/seguir/passos/6-tarefa.md:103`. Se a frase for apagada ou reescrita, o requisito fica vermelho. A suíte passa inteira (103 de 103).
- **4, feita.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-acabamento-de-texto-x7/.claude/skills/retro/SKILL.md:93` agora diz "ela passa para a confirmação", e "grupo seguinte" não aparece mais em lugar nenhum do arquivo.
- **3, foi para o `TODO.md`** como linha própria, com os seis caminhos e linhas citados. Era recomendação, então registrar no `TODO.md` basta.
- **"commits novos com código"**, a mudança no `6-tarefa.md:82`, é ajuste de texto. Nenhum requisito do harness citava a frase antiga, e a suíte continua verde.
- Nenhum `.skip` entrou nem teste foi comentado, nenhum mock esconde a regra, nada chama provedor de IA e nenhuma operação concorrente foi tocada.

Bloqueantes: nenhum.

Recomendações:
- A frase nova do `6-tarefa.md:82` ("commits novos com código") não tem termo em `REQUISITOS_DO_TEXTO`. Se ela for regra do passo 6, e não só redação, vale um requisito próprio, como foi feito com a recomendação 2.
