# Achados das revisões — `tasks/correcoes/2026-10-13-quinta-fatia-do-e2e.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-13 14:31:00 · `tasks/correcoes/2026-10-13-quinta-fatia-do-e2e.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. É uma correção de configuração da esteira, faz o que o próprio runbook ("Esteira vermelha no e2e") manda e não diverge de nenhuma seção da techspec.
Portão local: carimbo válido (o `conferir` aprovou o código atual com typecheck, lint, segredo, dependências, unidade e alvo)
Bloqueantes: nenhum

O total de fatias está escrito em três lugares, e os três mudaram juntos:
- a `matrix.fatia`, que passou a `[1..5]`;
- o `--shard=…/5` do passo do e2e;
- o `name` do job.

O comentário do `ci.yml` deixou de citar o número fixo.

As três mutações desfazem lugares diferentes e cada uma deixa vermelho o teste que cita:
- **Mudar a matriz para quatro:** o `/5` do passo deixa de bater com o tamanho da matriz, e `tem os jobs…` fica vermelho (`tools/ci/esteira.test.ts:129`).
- **Mudar o passo para `/4`:** o mesmo teste fica vermelho.
- **Mudar o `name` para `/4`:** `o e2e roda em fatias…` fica vermelho (`:140`).

O que ainda diz `/4` no repositório é registro histórico (`TODO.md`, `tasks/correcoes/2026-10-*`, validações antigas) ou entrada de teste com valor qualquer (`tools/ci/scripts.test.ts:178`, `tools/ci/prazo-do-e2e.test.ts:86`). Nada disso descreve a esteira atual.

Recomendações:
- **Contagem no runbook:** em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/docs/runbook.md:870`, os 818 casos incluem os 42 de `e2e/pecas-estado.spec.ts`, que é da 6.0 e ainda não tem commit. Se a 6.0 cair ou mudar de tamanho antes do pouso, o número fica errado. Vale escrever "776 commitados mais os 42 da 6.0", ou conferir o número quando a 6.0 entrar.
- **Comentário do teste:** o comentário de `tools/ci/esteira.test.ts:127-128` fala em "`/3` com quatro fatias" e "a de `/5`". Ainda faz sentido como exemplo, mas agora o `/5` é o valor certo, e o exemplo confunde. É fora do escopo desta correção; só registro.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/.github/workflows/ci.yml`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/README.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/docs/runbook.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/correcoes/2026-10-13-quinta-fatia-do-e2e.md`

## infra-guardian · 1ª rodada · APROVADO · 2026-10-13 14:31:09 · `tasks/correcoes/2026-10-13-quinta-fatia-do-e2e.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum (só a esteira de CI: a matriz do e2e e a documentação dela)
Rate limit: não se aplica
Fila e prioridade: não se aplica
Concorrência: não se aplica
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (o aviso "e2e perto do teto" e a guarda de `tools/ci/esteira.test.ts` não mudaram, e a seção "Esteira vermelha no e2e" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/docs/runbook.md` diz agora cinco fatias e `/5`)
Bloqueantes: nenhum
Recomendações:
- As referências a `e2e n/4` que ainda aparecem em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/TODO.md` (linhas 342 e 1191), em `docs/mvp-rapido.md:179`, em `tasks/prd-*` e nas correções antigas são registro de execuções passadas. Estão certas e ficam como estão.

O que conferi:
- Rodei `npx vitest run --project unidade tools/ci/esteira.test.ts` com a árvore atual e passaram os 11 casos.
- O total de fatias aparece em três lugares de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/.github/workflows/ci.yml`: a matriz, o `name` do job e o `--shard` do passo. Os três estão em 5.
- Continuam iguais o `timeout-minutes: 45`, o `fail-fast: false` e o artefato `traco-do-e2e-<i>` por fatia.
- As constantes de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tools/ci/prazo-do-e2e.ts` não foram mexidas.
- A conta do documento bate com `minutosEstimadosDoE2e`. Com 5 fatias, a maior tem 164 casos: ceil(4 + 164 × 7 / 60) = 24 min, abaixo do limite de 27 min (60% de 45). Com 4 fatias eram 205 casos e 28 min, que é o vermelho de antes.
- Nenhum script em `tools/processo/` nem em `tools/ci/` depende do nome do job `e2e n/4`.

## test-engineer · 1ª rodada · APROVADO · 2026-10-13 14:31:23 · `tasks/correcoes/2026-10-13-quinta-fatia-do-e2e.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** com cinco fatias, cada uma cabe em 60% do teto de 45 min.
- **Borda 1:** a matriz e o `/n` do passo `npm run ci:e2e` divergem, o que deixaria fatia sem rodar ou faria uma fatia rodar sozinha uma parte que não existe.
- **Borda 2:** o `/n` do `name` do job diverge do total de fatias, e aí não se sabe qual job ficou vermelho.
- **Borda 3:** a matriz tem buraco ou repetição, como `[1,2,4,5]`.
- **Borda 4:** as fatias somadas dão a suíte inteira.
- **Permissão:** não se aplica, porque nenhum dado nem papel muda.
- **Isolamento:** não se aplica, porque a correção não toca dado de escola.
- **Concorrência:** não se aplica. `fail-fast: false` continua afirmado.

**Cobertos:**
- **Teto por fatia.** O teste `o teto do e2e cobre a suíte que existe` (`tools/ci/esteira.test.ts:199`) conta os casos pelo próprio Playwright, fatia a fatia, contra o limite de 27 min. O documento registra esse teste vermelho antes da correção (205 casos, 28 min). Rodei `npx vitest run --project unidade tools/ci/esteira.test.ts` agora: 11 de 11 verdes.
- **As três mutações provam a regra pelo motivo certo:**
  - Matriz com 4 e passo com `/5`: o teste `tem os jobs…` (`:129-130`) espera `/4` pelo tamanho da matriz, e fica vermelho.
  - Passo com `/4` e matriz com 5: o mesmo teste fica vermelho, porque espera `/5`.
  - `name` com `/4`: o teste `o e2e roda em fatias…` (`:140`) fica vermelho.
  - Cada bloco desfaz um dos três lugares em que o total aparece. Nenhuma cláusula nova do diff ficou sem bloco.
- **Matriz `1..n` sem buraco nem repetição:** `fatiasDoE2e` (`:76`) confere.
- **Soma das fatias igual à suíte:** `:221`.
- **Contas do documento:** batem com a fórmula `4 + casos × 7 s`, arredondada para cima.
  - 205 casos dão 28 min.
  - 194 casos dão 27 min.
  - 164 casos dão 24 min.
  - 197 casos dão 27 min, que é a folga declarada.
- **Restos do total antigo:** não sobrou `/4` vivo no README, no runbook nem no workflow. As outras ocorrências são registro histórico, em correções antigas, validações e `docs/mvp-rapido.md`.
- **Proibições:** não há `.skip`, nem mock, nem chamada a provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Nenhuma mutação reverte os três lugares juntos e de forma coerente, voltando tudo a `/4`. Hoje isso só fica vermelho no teste do teto, e só enquanto `e2e/pecas-estado.spec.ts` da 6.0 estiver na árvore. Sem ela, os 776 casos já commitados dão 194 por fatia, 27 min, que é exatamente o limite e passa. Depois que a 6.0 for commitada, o teste do teto cobre a reversão por inteiro. Fica registrado para o `/validar` conferir que a correção não pousa sem a 6.0, ou que a reversão está coberta.
2. O comentário em `tools/ci/esteira.test.ts:127-128` usa "`/3` com quatro fatias" e "`/5`" como exemplos. Continua correto, mas com cinco fatias hoje ficaria mais claro escrito como "`/n-1`" e "`/n+1`". É só texto.

Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/.github/workflows/ci.yml`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tools/ci/esteira.test.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/correcoes/2026-10-13-quinta-fatia-do-e2e.md`

## infra-guardian · 2ª rodada · APROVADO · 2026-10-13 14:36:05 · `tasks/correcoes/2026-10-13-quinta-fatia-do-e2e.md`

VEREDITO: APROVADO
Caminho quente tocado: deploy (só a esteira, nenhum código de produção)
Rate limit: ok (não se aplica, a correção não toca nenhuma rota)
Fila e prioridade: ok (não se aplica)
Concorrência: protegida (não se aplica)
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok. O runbook acompanha a mudança: a seção "Esteira vermelha no e2e" fala em cinco fatias e `/5` nos três lugares, e o remédio diz "o total (hoje `/5`)".
Bloqueantes: nenhum.

O que esta rodada conferiu:
- **Contas de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/docs/runbook.md`:** refeitas com `minutosEstimadosDoE2e` (arredonda para cima 4 + casos × 7/60). O limite é 27 min, que são 60% do `timeout-minutes: 45` do job e2e em `.github/workflows/ci.yml:89`.
  - 194 casos: 26,6, ou seja 27 min, no limite.
  - 205 casos: 27,9, ou seja 28 min, acima dele.
  - 156 casos: 22,2, ou seja 23 min.
  - 164 casos: 23,1, ou seja 24 min.
  - Os totais também batem: 776/4 dá 194, 818/4 dá 205, 776/5 dá 156 e 818/5 dá 164.
  - O documento da correção diz que a folga vai até 197 casos por fatia, 985 no total. A conta confirma: 197 casos dão 27 min e 198 passariam a 28.
- **Workflow:** `.github/workflows/ci.yml` tem as mesmas três mudanças que aprovei na 1ª rodada (`name` com `/5`, `matrix.fatia: [1, 2, 3, 4, 5]` e `--shard=…/5`). `timeout-minutes` e as constantes de `tools/ci/prazo-do-e2e.ts` não mudaram.
- **Correções exigidas na rodada anterior:** não havia nenhuma.

Recomendações:
- As três recomendações recusadas na tabela "Recomendações sem aplicar" do documento da correção ficam para o `/validar`. Um ponto pede atenção: esta correção não pode pousar sem a 6.0 de pele-e-casca. Sem os 42 casos dela, uma volta para `/4` só ficaria vermelha no teste do teto quando a suíte passasse de 776 casos.

Arquivos revisados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/docs/runbook.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/.github/workflows/ci.yml
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tools/ci/prazo-do-e2e.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/correcoes/2026-10-13-quinta-fatia-do-e2e.md

## revisor-geral · 2ª rodada · APROVADO · 2026-10-13 14:36:10 · `tasks/correcoes/2026-10-13-quinta-fatia-do-e2e.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A correção não toca a arquitetura. Ela aplica o remédio que o `docs/runbook.md` ("Esteira vermelha no e2e") já mandava: acrescentar uma fatia, sem subir o `timeout-minutes` e sem baixar as constantes.

Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")

Bloqueantes: nenhum.

Nesta rodada só o texto da contagem mudou, em `docs/runbook.md:869-872` e no documento da correção, linha 86. Refiz as contas com a fórmula de `tools/ci/prazo-do-e2e.ts:28`, que arredonda para cima, e todas batem:
- 776 casos em quatro fatias dão 194 por fatia, 27 min (no limite).
- 818 casos em quatro fatias dão 205 por fatia, 28 min (acima do limite).
- Em cinco fatias, 156 casos levam 23 min e 164 levam 24.
- A folga vai até 197 por fatia (27 min), uns 985 casos no total.

O runbook agora separa os 776 casos já commitados dos 42 da 6.0, como a recomendação da rodada 1 pedia. A recomendação recusada, sobre o comentário de `tools/ci/esteira.test.ts`, tem motivo registrado na tabela "Recomendações sem aplicar". O arquivo é de teste e está fora desta correção, então a recusa é aceitável.

`.github/workflows/ci.yml` e `README.md` não mudaram desde a rodada aprovada.

Recomendações:
- O texto diz "uns 23 e 24 min" porque o tempo é arredondado para cima: 156 casos dão 22,2 min, que vira 23. Se alguém conferir com arredondamento comum, o número parece errado. Dá para citar uma vez, no runbook, que a estimativa vem de `estimarMinutosDoE2e` (ou do nome real da função em `tools/ci/prazo-do-e2e.ts`), sem repetir a fórmula. Não bloqueia.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/correcoes/2026-10-13-quinta-fatia-do-e2e.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/docs/runbook.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/.github/workflows/ci.yml
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/README.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tools/ci/prazo-do-e2e.ts

## test-engineer · 2ª rodada · APROVADO · 2026-10-13 14:36:13 · `tasks/correcoes/2026-10-13-quinta-fatia-do-e2e.md`

VEREDITO: APROVADO

**Cenários exigidos:** os mesmos da 1ª rodada, que aprovei sem bloqueante. A matriz tem cinco fatias. O `--shard` e o `name` do job dizem `/5`. A guarda de `tools/ci/esteira.test.ts` confere o total do `--shard` e do `name` contra o tamanho da matriz, e refaz a conta de cada fatia contra 60% do teto. O runbook precisa dizer o mesmo que o `ci.yml`.

**Cobertos:** nesta rodada o código só mudou em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/docs/runbook.md`, e é texto, sem cláusula executável nova. Por isso não cabe bloco de mutação novo, e as mutações da 1ª rodada continuam valendo para o `ci.yml`. Refiz a conta do texto novo com `minutosEstimadosDoE2e` de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tools/ci/prazo-do-e2e.ts`, que é `ceil(4 + casos × 7 / 60)`:
- Em quatro fatias:
  - 776 casos dão 194 por fatia, ou 27 min, igual ao limite (60% de 45 = 27).
  - 818 casos dão 205 por fatia (204,5 arredondado para cima), ou 28 min, acima do limite.
- Em cinco fatias:
  - 776 casos dão 156 por fatia, ou 23 min.
  - 818 casos dão 164 por fatia, ou 24 min.

Os números do runbook batem com essa conta, e o documento da correção traz os mesmos. A frase nova separa o que está commitado (776) do que inclui os 42 casos do e2e da 6.0, que não estão em revisão. Isso corrige a ambiguidade que o revisor-geral apontou. As duas recomendações minhas que foram recusadas estão registradas com motivo na tabela "Recomendações sem aplicar". Elas não eram bloqueantes, e a recusa é legítima.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Continuam valendo as da 1ª rodada, que ficam para o `/validar`.
   - A folga só se confirma com a 6.0 na árvore. Com os 818 casos, a guarda de 60% em quatro fatias reprovaria, mas sem a 6.0 seriam 27 min, exatamente no limite. A reversão para `/4` só fica vermelha com a 6.0 commitada.
   - Falta ajustar o comentário de `tools/ci/esteira.test.ts`.
2. O runbook agora grava contagens de casos com data. Elas envelhecem a cada spec. Se alguém quiser evitar isso, vale trocar por "ver o documento da correção" e deixar os números só em `tasks/correcoes/2026-10-13-quinta-fatia-do-e2e.md`. Não bloqueia.
