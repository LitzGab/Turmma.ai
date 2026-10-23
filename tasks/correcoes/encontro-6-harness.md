# Correção — o encontro da linha 2 (tarefa 6.0, 8dce7e7) deu conflito em cenarios.md com spec/harness

**Origem:** encontro da linha 2 (`tools/processo/linhas.ts`), tarefa 6.0: o merge de `spec/harness` na branch da linha parou em conflito.
**Subagentes obrigatórios:** `infra-guardian`, `revisor-geral`
<!-- O infra-guardian veio no PEDIDO do Orquestrador (o merge traz o `ci.yml` e a esteira). O revisor-geral entra pelo limite do passo 5 de `corrigir`: o merge traz alterações em `.github/`, `tools/ci/` e `tools/processo/` (tarefa 3.0). O test-engineer é de toda correção. -->

## Nota

O slug do pedido era `encontro-6`, mas `tasks/correcoes/encontro-6.md` já existe, de outra spec (o encontro da linha 2 da
`telas-do-professor`, resolvido em `b90c204`). Reescrever aquele arquivo apagaria a causa e as revisões daquela correção; por
isso este documento e a marca do commit usam `encontro-6-harness`.

## Sintoma

`git merge spec/harness` na linha 2 traz a tarefa 3.0 (`201e9b3`, `690e0b4`: a esteira cancela a superada sozinha). `ci.yml`,
`esteira.ts`, `esteira.test.ts`, `tools/ci/esteira.test.ts`, `techspec.md`, `tasks.md` e `indice.md` juntam sozinhos;
`tasks/prd-harness/cenarios.md` não: `CONFLITO (conteúdo): Conflito de merge em tasks/prd-harness/cenarios.md`, num único
bloco, nas linhas RF1, RF2 e RF3 da tabela A.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa antes do merge.

## Causa

As duas pontas mexeram em linhas vizinhas da tabela A, sem tocar na mesma: a spec (tarefa 3.0) reescreveu só as linhas do RF1
(o `cancel-in-progress` falso em `develop`, `release`, `main` e `workflow_dispatch`, também em branch de spec) e do RF2 (a
sucessora de execução manual ou no mesmo instante não supera); a 6.0 reescreveu só a do RF3 (a verificação do encontro roda no
checkout da linha, depois do merge, com `typecheck` e `lint` por padrão). Conferido contra o ancestral comum: RF1 e RF2 da linha
são iguais aos dele, e RF3 da spec é igual ao dele. O git devolve os dois lados com marcadores porque o bloco é contíguo.

## Teste que reproduz

Não se aplica: é a resolução de um conflito de texto num documento (`cenarios.md`), sem comportamento novo. A prova é o arquivo
sem marcador, com o RF1 e o RF2 byte a byte iguais aos da spec e o RF3 byte a byte igual ao da linha, e o portão da tarefa sobre a
árvore que o merge deixou (o código que veio da 3.0 já passou pelo portão e pela Mesa na linha 1).

## Correção

Mantidos os dois lados, sem alterar o texto de nenhum: RF1 e RF2 da spec (a linha trazia as versões antigas) e RF3 da linha (a
spec trazia a versão antiga). Os marcadores `<<<<<<<`, `=======` e `>>>>>>>` saíram, e a ordem RF1, RF2, RF3 foi mantida. O
merge se fecha com o commit `(correção encontro-6-harness)`.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | O upload do traço do e2e roda também em `pull_request` num repositório público; hoje é sintético, mas levar ao portão da primeira escola real que nenhum seed com dado real chegue a esse job | `TODO.md`, na seção "Antes da primeira escola real". Fora desta correção: o `ci.yml` veio da 3.0 sem alteração |
| revisor-geral (1ª), test-engineer (1ª) | `achados/indice.md`: as linhas da `3_task` (16:42 a 17:00) ficaram fora da ordem de horário em relação às da `6_task` | Recusada: o arquivo é escrito pelo hook e ninguém o edita (protocolo, item 5); o merge o juntou sozinho, e é só aparência |
| test-engineer (1ª) | O slug do encontro já nascer com o nome da spec, para a colisão com `encontro-<n>.md` de outra spec não se repetir | `/retro` da spec `harness` (mudança em `tools/processo/linhas.ts` ou na skill `corrigir`, tarefa futura que toque o encontro) |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 17:19:42 | 2026-10-23 17:20:11 | `infra-guardian` | 1 | APROVADO | a285ed5d23ed25951 |
| 2026-10-23 17:19:44 | 2026-10-23 17:20:40 | `revisor-geral` | 1 | APROVADO | aa0f62436f040455e |
| 2026-10-23 17:19:40 | 2026-10-23 17:21:36 | `test-engineer` | 1 | APROVADO | aa97596aadbc5d771 |
