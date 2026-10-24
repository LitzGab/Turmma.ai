# Correção — acabamento de texto da X7: comentários que apontam o módulo errado, um teste frouxo e o orçamento do `/seguir` sem folga

**Origem:** `TODO.md`, item "(X7, retro, M7)" (retro da X7).
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`, `infra-guardian`, `privacy-guardian`, `conformidade-reviewer`
<!-- Vieram no PEDIDO do Orquestrador. Mexe em `.claude/hooks/`, `.claude/skills/` e `tools/`. -->

**Sem mutação:** nenhum arquivo de `apps/*/src` nem de `packages/*/src` muda; o código de `tools/` só perde ou troca comentário. A única linha que muda comportamento é a asserção do teste de `hook-git.int.test.ts`.

## Sintoma

Cinco restos de texto da X7, achados pela retro:

1. Comentários e a skill dizem que a lógica do hook de revisões mora em `tools/processo/revisoes.ts`, que desde a X7 só reexporta os módulos `portao.ts`, `caducidade.ts`, `comando-git.ts` e `documento-de-revisao.ts`. O cabeçalho de `metadados.test.ts` omite a regra e o `settings.json` entre os lugares onde a citação da skill `status` é procurada. O aviso de `contexto-inicial.sh` traz "Checkout anterior à X7: traga a develop antes", frase que nunca aparece onde se aplica (num checkout anterior à X7 roda o `contexto-inicial.sh` antigo, sem ela).
2. O caso dos módulos que não carregam, em `hook-git.int.test.ts`, aceita `ERR_MODULE_NOT_FOUND` sozinho: passaria com o módulo errado, ou com a mensagem sem nome nenhum.
3. `retro/SKILL.md` diz "salvo os do grupo seguinte", sem dizer qual grupo.
4. `passos/6-tarefa.md` perdeu, numa correção anterior, o "Não chega como mensagem:" do `PEDIDO de estado`, e tem "e se abre de novo (`abrir`)" sem sujeito. O `SKILL.md` + `protocolo.md` + `passos/6-tarefa.md` somavam 23.979 B de 24.000, sem folga para nenhum retoque.
5. `docs/aia/ouro-retido/README.md` manda o commit levar `(ouro: <política>)` no assunto, e esse selo não existe mais.

## Fora desta correção

Nada: a árvore estava limpa (o pedido trouxe "Arquivos da tarefa em curso: nenhum").

## Causa

Texto que ficou para trás de uma mudança de código ou de processo: a divisão do `revisoes.ts` em quatro módulos (X7, RF13), a retirada do selo `(ouro: …)` (18.0), o hook nativo que passou a ser ligado pelo `prepare`, e dois cortes feitos para caber no teto de 24.000 B. Nenhum teste lia o texto: o único com defeito de verdade é o do item 2, cuja alternativa `|ERR_MODULE_NOT_FOUND` tornava o nome do módulo opcional.

## Teste que reproduz

| Item | Teste | Antes |
|---|---|---|
| 2 | `tools/processo/hook-git.int.test.ts › o módulo %s que não carrega recusa o commit de papel` | A regex antiga aceita `Error [ERR_MODULE_NOT_FOUND]: Cannot find module outro.ts` para `portao.ts` (`true`); a nova, só com o nome, não (`false`). Conferido com `node -e` sobre as duas regex. |
| 3 | `tools/processo/harness/seguir.test.ts › a retro tira o grupo de confirmação do aviso` | O termo novo, `salvo os da confirmação (abaixo)`, não está no `retro/SKILL.md` do HEAD (`git show HEAD:… | grep -c` dá 0): vermelho com a skill antiga. |
| 4 | o teto dos três de `seguir.test.ts` (24.000 B) | Já passava: a prova do item é a folga (23.675 B, 325 B abaixo do teto). |

Os itens 1 e 5 são comentário e documento: nenhum teste os lê, e não há vermelho a provar.

## Correção

1. **Citação do módulo certo.** `tools/ci/etapas-de-guarda.ts` (`SUITES_DO_PORTAO_DA_TAREFA`), `tools/ci/e2e-que-cita-literal.ts` (`alvosDoPortao`), `tools/processo/sequencia-do-portao.ts` e `tools/processo/portao-local.ts` (mesma frase, fora da lista do TODO) passam a citar `portao.ts`; `executar-task/SKILL.md` cita `caducidade.ts` para `MARCAS_DE_DIRETIVA` e `DOCUMENTO_QUE_UMA_SUITE_LE`, e `hook-revisoes.ts` para o hook. O cabeçalho de `metadados.test.ts` lista regra e `settings.json`. A frase morta sai do `contexto-inicial.sh`.
2. **Regex do módulo.** Sem a alternativa do código de erro, e presa ao módulo que faltou na mensagem do Node: `` new RegExp(`Cannot find module '[^']*/${modulo.replaceAll('.', '\\.')}'`) `` (o nome solto casaria `portao.ts` com `sequencia-do-portao.ts`; 1ª rodada, test-engineer e revisor-geral), com um comentário que diz o mesmo.
3. **Retro.** "salvo os da confirmação (abaixo)" e "ela passa para a confirmação" no `retro/SKILL.md`, e o primeiro termo no `seguir.test.ts` (1ª rodada, test-engineer).
4. **`6-tarefa.md`.** "Não chega como mensagem:" volta ao `PEDIDO de estado`; "e você reabre com `abrir`". Para a folga, saiu só explicação: o que o `partida` faz além de recusar, a fila de carga ("do portão e do e2e, que a tomam sozinhos"), "o de ambientes de teste da máquina", o que o quadro lê, o porquê do `Arquiteto` no checkout da linha (a instrução fica), o detalhe do que o `encontro` confere, e "(provado em 08/10/2026)" do `protocolo.md`. O "com código" do `encontro` voltou (1ª rodada, revisor-geral), e o `seguir.test.ts` ganhou o termo `Não chega como mensagem: lê-se na saída do \`maestri ask\` ou no \`maestri check\``, em `REQUISITOS_DO_TEXTO`, para o próximo corte não a tirar de novo (1ª rodada, test-engineer). Total: 23.687 B, folga de 313 B.
5. **`ouro-retido/README.md`.** Sem o `(ouro: <política>)`.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) e test-engineer (1ª) | Mais citações de `tools/processo/revisoes.ts` como dono do hook: `tools/guardas/escopo-dos-repositories.ts:254` (comentário), `tools/processo/documento-de-revisao.ts:48`, `:204` e `:329` (texto que o hook grava nos documentos), `.claude/skills/criar-tasks/task-template.md:171`, `.claude/skills/revisar-tarefa/SKILL.md:14`, `.claude/skills/seguir/time.md:25` | `TODO.md`: o Implementador acrescenta uma linha, com o nome certo (`hook-revisoes.ts`). Nenhum desses arquivos é tocado por esta correção; o `documento-de-revisao.ts` muda o que fica gravado nos documentos, e o `revisar-tarefa/SKILL.md` e o `time.md` são do processo da Mesa e do time (confirmação do Joaquim, não aviso) |
| infra-guardian (1ª) | Guardar em `docs/infra.md` ou no `protocolo.md` as frases cortadas do `6-tarefa.md` ("o de ambientes de teste da máquina" e "a fila de carga é do portão e do e2e"), se o texto voltar a crescer | Recusada por ora: a recomendação é condicional ("Se o texto voltar a crescer") e hoje o texto tem 313 B de folga; `docs/infra.md` não é tocado por esta correção e o `protocolo.md` está sob o mesmo teto de 24.000 B |
| test-engineer (2ª) | A frase "commits novos com código", de volta em `passos/6-tarefa.md:82`, não tem termo em `REQUISITOS_DO_TEXTO`; "se ela for regra do passo 6, e não só redação, vale um requisito próprio" | Recusada: é redação restaurada (o HEAD já a tinha) e o revisor a deixa condicional. Um termo novo mexe em `seguir.test.ts` e caduca de novo `test-engineer` e `revisor-geral`, uma rodada inteira por uma frase. Se o passo 6 for cortado outra vez, o lugar do termo é essa correção |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-24 20:01:46 | 2026-10-24 20:01:59 | `privacy-guardian` | 1 | APROVADO | a44c97c801c05edd1 |
| 2026-10-24 20:01:44 | 2026-10-24 20:02:00 | `infra-guardian` | 1 | APROVADO | a6b1394f1b5055081 |
| 2026-10-24 20:01:49 | 2026-10-24 20:02:13 | `conformidade-reviewer` | 1 | APROVADO | a3b9718c28cef2de7 |
| 2026-10-24 20:01:42 | 2026-10-24 20:02:14 | `revisor-geral` | 1 | APROVADO | a3d27a601f0b43719 |
| 2026-10-24 20:01:40 | 2026-10-24 20:02:58 | `test-engineer` | 1 | APROVADO | aa8124a9245f6038b |
| 2026-10-24 20:07:54 | 2026-10-24 20:08:12 | `revisor-geral` | 2 | APROVADO | a66ec6ccb83079c94 |
| 2026-10-24 20:07:47 | 2026-10-24 20:08:14 | `test-engineer` | 2 | APROVADO | a0f2baf07faa2d4ad |
