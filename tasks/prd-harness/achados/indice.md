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
