# Achados das revisões — `tasks/correcoes/2026-10-10-resumo-do-arquivo-do-pedido-de-entrada.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-10 22:43:34 · `tasks/correcoes/2026-10-10-resumo-do-arquivo-do-pedido-de-entrada.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** o resumo do arquivo traz para a `reivindicacao` o mesmo texto da tela "Meus dados" ("Os pedidos de entrada na turma feitos com o seu nome ou decididos por você").
- **Borda 1:** o aluno teve um pedido recusado antes no mesmo nome, e a consulta traz os dois. O texto não pode afirmar que o aluno fez os dois pedidos.
- **Borda 2:** o professor que decidiu o pedido. O texto continua verdadeiro pelo caminho "decididos por você".
- **Permissão e isolamento:** não se aplicam. A correção só muda o texto do resumo e um comentário. A consulta, as colunas, a lista `fora` e o escopo `escola_id` não mudaram no diff.

**Cobertos:**
- O caso novo em `packages/nucleo/src/titular/leitura-do-titular.test.ts:64-70` fixa o texto exato com `toBe`. Também afirma a ausência de "que você fez".
- O teste falharia se a regra fosse removida. Voltar ao texto antigo, ou mudar qualquer palavra da `descricao`, quebra o `toBe` de forma direta.
- Rodei o arquivo e passou: 13 de 13.
- Não rodei a mutação na prática. O arquivo está alterado sem commit, e o `git checkout --` que desfaz a mutação apagaria também a própria correção. Com o `toBe` exato, o vermelho é evidente pela leitura.
- O texto novo é idêntico, caractere por caractere, ao de `apps/web/src/componentes/meus-dados/regras.ts:132`, que `regras.test.ts:173` também fixa.
- O texto antigo não aparece mais no código-fonte de `apps/`, `packages/`, `e2e/` nem `docs/`. Só sobra em `packages/nucleo/dist/`, que é saída do build e não é revisada.
- Não há `.skip`, mock nem chamada a provedor de IA.
- Não há operação nova que possa acontecer duas vezes ao mesmo tempo, então não cabe teste de concorrência.

**Bloqueantes:** nenhum.

**Recomendações:**
1. O mesmo texto vive em dois lugares: em `packages/nucleo/src/titular/leitura-do-titular.ts:142` e em `apps/web/src/componentes/meus-dados/regras.ts:132`. Cada um tem o seu teste, mas nada impede que um mude sem o outro e voltem a divergir, que é exatamente o defeito desta correção. Fica para o `/retro` decidir se vale uma fonte única em `packages/shared`, ou um teste que compare os dois textos.
2. O comentário novo afirma que a consulta do aluno traz também o pedido recusado antes naquele nome, "de propósito". Esse comportamento não é desta correção, mas vale conferir se existe teste de integração da leitura do titular que o prove: o aluno aprovado depois de uma recusa no mesmo nome recebe os dois pedidos, e nenhum deles leva `decidida_por` nem `teve_matricula_errada`. Se não existir, entra como cobertura extra para a validação do F3.
3. O `not.toMatch(/que você fez/)` é redundante com o `toBe`. Não atrapalha, porque documenta a intenção do teste.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/leitura-do-titular.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/leitura-do-titular.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/TODO.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/correcoes/2026-10-10-resumo-do-arquivo-do-pedido-de-entrada.md

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-10 22:44:04 · `tasks/correcoes/2026-10-10-resumo-do-arquivo-do-pedido-de-entrada.md`

VEREDITO: APROVADO

A correção só muda texto e comentário. A consulta, as colunas, a lista `fora` e o escopo de tenant ficaram iguais, então não entra dado novo no arquivo do titular e o que já saía continua saindo. O resumo deixa de afirmar uma autoria que a consulta não garante, e o arquivo baixado passa a dizer o mesmo que a tela "Meus dados".

Campos pessoais tocados: nenhum. Muda só a `descricao` de `LEITURAS_DO_ARQUIVO.reivindicacao` e o comentário da consulta do aluno, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/leitura-do-titular.ts:142` e `:152-156`.

Fora da tabela de dados do docs/lgpd.md: nada, porque não há campo novo.

Autorização por objeto: ok. As duas consultas seguem presas a `escola_id` vindo do contexto e a `titularId`, ligadas por `lista_nome.usuario_id` ou por `decidida_por`. O pedido recusado antes, naquele nome, que entra na lista do aluno não identifica quem o fez: `decidida_por`, `chave_envio`, `senha_hash` e `teve_matricula_errada` continuam em `fora`.

Logs: limpos. A correção não toca em log.

Auditoria: não se aplica. Nada mudou em leitura, exportação ou permissão.

Envio externo: nenhum.

Seed/fixture: sintético. O teste novo é de unidade e só confere o texto da `descricao`, sem dado de pessoa.

Bloqueantes: nenhum.

Recomendações:
- O comentário em `packages/nucleo/src/titular/leitura-do-titular.ts:155` diz que "a linha leva só o estado e as datas". A linha leva também `id`, `turma_id`, `lista_nome_id` e `decidida_como`. Nenhum desses identifica outra pessoa, mas o comentário pode listar as colunas como elas são, para não induzir quem audite depois.
- O comentário em `apps/api/test/pedido-titular.int.test.ts:231` ainda diz "o pedido que o aprovou". É o mesmo descompasso que esta correção tirou da consulta e o teste de lá vale para o caso que ele cobre, então fica para o `/retro` ou para a próxima tarefa que tocar esse arquivo.
- O texto da `descricao` aparece igual em dois lugares, no núcleo (`leitura-do-titular.ts:142`) e na web (`apps/web/src/componentes/meus-dados/regras.ts:132`). Cada um tem um teste que fixa a própria cópia, mas nenhum confere que as duas são iguais. Um teste que confronte as duas, ou uma constante única em `packages/shared`, evita que voltem a divergir.
