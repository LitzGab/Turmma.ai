# Índice dos achados das revisões

Uma linha por rodada que exigiu alguma coisa. O texto inteiro está no arquivo do documento, nesta
pasta (`<documento>.md`), no bloco com o mesmo fim. Escrito pelo hook `tools/processo/revisoes.ts`.
Não edite à mão.

Leia este índice antes de codar, e abra só os blocos que interessam à tarefa de agora.

| Fim | Revisor | Rodada | Veredito | Documento | O que exigiu |
|---|---|---|---|---|---|
| 2026-10-23 11:50:02 | `tenancy-guardian` | 1ª | REPROVADO | `revisao-spec` | Tech Spec §5(b) (RF15): a tabela não exige a rodada do `tenancy-guardian` em todo commit que cria query, endpoint ou escopo. A regra 10 tem veto. Pela tabela… |
| 2026-10-23 11:50:09 | `privacy-guardian` | 1ª | REPROVADO | `revisao-spec` | Tech Spec §5(b), tabela do RF15. A tabela não faz o hook exigir a minha rodada em boa parte do que toca dado de pessoa, log, storage, exportação, autorização… |
| 2026-10-23 11:51:43 | `conformidade-reviewer` | 1ª | REPROVADO | `revisao-spec` | `techspec.md:71-77` (§5(b), linha da conformidade): a tabela deixa de fora código da regra 70 que existe hoje. Por isso o §7b (`techspec.md:119`) e o §11… |
| 2026-10-23 11:53:11 | `infra-guardian` | 1ª | REPROVADO | `revisao-spec` | §5(b), tabela caminho → guardião (RF15): o `infra-guardian` fica fora de boa parte do caminho quente. Conferi no repositório o que nenhuma linha da tabela… |
| 2026-10-23 11:53:52 | `test-engineer` | 1ª | REPROVADO | `revisao-spec` | §10 / §2: seis requisitos sem teste nenhum. |
| 2026-10-23 11:56:26 | `revisor-geral` | 1ª | REPROVADO | `revisao-spec` | §5c, o hook congelado não chega a todas as linhas e pode travar o time. |
| 2026-10-23 13:04:52 | `tenancy-guardian` | 2ª | REPROVADO | `revisao-spec` | Linhas 56 e 62 da tabela, e §5(b): há repositories que não pedem o `tenancy-guardian`. |
| 2026-10-23 13:06:07 | `privacy-guardian` | 2ª | REPROVADO | `revisao-spec` | `tabela-de-guardioes.md`, linhas que ainda não pedem `privacy` (Tech Spec §5b, RF15). Conferi pasta a pasta no código. Estas linhas guardam dado de pessoa,… |
| 2026-10-23 13:06:40 | `conformidade-reviewer` | 2ª | REPROVADO | `revisao-spec` | `tabela-de-guardioes.md:27, 57, 61, 62, 74 e 48`. Código que hoje impõe a regra 70 continua sem pedir C, e com isso o §7b (`techspec.md:130`) e o PRD §8b ficam… |
| 2026-10-23 13:06:46 | `infra-guardian` | 2ª | REPROVADO | `revisao-spec` | Front-end sem `infra-guardian` (`tasks/prd-harness/tabela-de-guardioes.md:44`, `:46`, `:48`). O lado cliente da regra 80 fica sem guardião: |
| 2026-10-23 13:08:12 | `test-engineer` | 2ª | REPROVADO | `revisao-spec` | `cenarios.md:15`, RF4: o caso que passa usa o vocabulário errado, e falta o mutado lento. |
| 2026-10-23 13:08:37 | `revisor-geral` | 2ª | REPROVADO | `revisao-spec` | A terceira camada do RF14 reaproveita uma função que não serve para ela. Está em `tasks/prd-harness/techspec.md:26` e `:67-70`, e em `cenarios.md:58-60`. A… |
