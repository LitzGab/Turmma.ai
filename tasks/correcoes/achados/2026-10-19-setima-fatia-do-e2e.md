# Achados das revisões — `tasks/correcoes/2026-10-19-setima-fatia-do-e2e.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-19 04:34:03 · `tasks/correcoes/2026-10-19-setima-fatia-do-e2e.md`

VEREDITO: APROVADO
Caminho quente tocado: deploy (só a esteira de CI, sem código de runtime)
Rate limit: não se aplica (a correção não toca request nem login)
Fila e prioridade: ok (não há fila de jobs no diff)
Concorrência: protegida (não há escrita concorrente no diff)
Índice e paginação: ok (não há query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não há alerta novo; a seção "Esteira vermelha no e2e" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/docs/runbook.md` foi atualizada com a data e a conta da sétima fatia)
Bloqueantes: nenhum
Recomendações:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/docs/runbook.md:876`, a margem que sobra antes de a oitava fatia ser pedida está só no documento da correção: uns 1379 casos no total, cerca de 180 a mais que hoje. Pôr esse número no parágrafo do runbook avisa quem lê a esteira antes de a guarda ficar vermelha. É só texto.
- O total de fatias continua escrito à mão em três lugares do `ci.yml`, e mais dois documentos repetem o número. A guarda de `tools/ci/esteira.test.ts` já confere os três do `ci.yml`. Se esta for a última fatia antes do F4, vale tirar o total do `README.md` e deixar só o runbook com ele, para a próxima correção mexer em menos lugares.

Conferido:
- A matriz `[1..7]`, o `/7` do `name` do job e o `/7` do passo `npm run ci:e2e` estão alinhados em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/.github/workflows/ci.yml:74,83,99`.
- `fail-fast: false`, o teto de 45 min e o artefato `traco-do-e2e-<i>` não mudaram.
- A busca não achou outra menção a `/6` nem a "seis fatias" fora do histórico de correções, além da conta "em seis fatias" do próprio parágrafo novo.
- `npx vitest run --project unidade tools/ci/esteira.test.ts` passou, 11 de 11, na árvore da linha 3. Não rodei o worktree com o merge de `spec/telas-do-professor`; o vermelho de antes e o verde de depois nele são o que o documento da correção registra.
- A conta confere: 1196 / 7 dá 171 casos por fatia, uns 24 min (`4 + 171 × 7 s`), abaixo do limite de 27.
- Nenhum teste chama provedor pago.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-19 04:34:04 · `tasks/correcoes/2026-10-19-setima-fatia-do-e2e.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A correção mexe só na infra da esteira e não toca nenhuma seção da Tech Spec. Ela segue o remédio que o `docs/runbook.md` manda em "Esteira vermelha no e2e" e repete a sexta fatia (`9d9985f`): mesmos três arquivos, mesmos lugares.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tasks/correcoes/2026-10-19-setima-fatia-do-e2e.md:71-72` fala de um "quarto" bloco de mutação, "provado pelo teste do teto". As linhas 95-99 dizem que esse bloco não foi declarado, e só existem três blocos `mutacao`. Basta corrigir a frase de abertura da seção para "três blocos", e deixar a mutação do teto só no parágrafo final.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tasks/correcoes/2026-10-19-setima-fatia-do-e2e.md:60-62` diz que o runbook e o README passam a trazer "a data e a conta da sétima". Só o runbook traz. O README, na linha 74, só troca o número para sete e `<i>/7`, como já fazia na sexta fatia. Convém ajustar a frase para não prometer o que o README não tem.

Conferências:
- As contas batem. 1178 casos em 6 fatias dão 197 por fatia e 1196 dão 200. Em 7 fatias dão 169 e 171, uns 24 min, contra o limite de 27.
- O total de fatias está nos três lugares do `ci.yml` (linhas 74, 83 e 99), e todos dizem 7.
- Não sobrou "seis fatias" nem `/6` em nenhum arquivo rastreado fora das correções antigas.
- As três mutações declaradas atingem cada uma uma guarda diferente de `tools/ci/esteira.test.ts`: a matriz e o `--shard` na guarda dos comandos (linha 129), e o `name` do job na das fatias (linha 140).

## test-engineer · 1ª rodada · APROVADO · 2026-10-19 04:34:13 · `tasks/correcoes/2026-10-19-setima-fatia-do-e2e.md`

VEREDITO: APROVADO

**Cenários exigidos** (a correção só muda configuração da esteira, sem dado de escola nem permissão):
- **Caminho feliz:** com sete fatias, a suíte da linha 3 somada à spec (1196 casos) cabe abaixo de 60% do teto de 45 min em cada fatia.
- **Borda 1:** a matriz, o `--shard` do passo e o `name` do job dizem totais diferentes. Assim uma fatia deixa de rodar sem ficar vermelha, ou o job roda uma fatia que não existe.
- **Borda 2:** a matriz `1..n` fica com buraco ou com número repetido.
- **Borda 3:** alguém sobe o `timeout-minutes` ou baixa as constantes de `tools/ci/prazo-do-e2e.ts` em vez de acrescentar a fatia.
- **Borda 4:** a suíte cresce de novo até passar dos 197 casos por fatia.
- **Permissão e isolamento:** não se aplicam, porque a correção não toca dado de escola nem rota.

**Cobertos:**
- **Os três lugares do total**, cada um com o seu bloco de mutação: a matriz (`ci.yml:83`), o passo `ci:e2e` (`ci.yml:99`) e o `name` (`ci.yml:74`). Os blocos apontam para guardas que existem e que reprovam a divergência:
  - `tools/ci/esteira.test.ts:129` compara o `/n` do passo com o tamanho da matriz;
  - `tools/ci/esteira.test.ts:140` compara o `/n` do `name` com o tamanho da matriz.
  
  Toda cláusula nova do `git diff` em `ci.yml` tem bloco.
- **Matriz sem buraco nem repetição:** é a `fatiasDoE2e`, em `tools/ci/esteira.test.ts:67-75`, que vale para qualquer número de fatias.
- **Teto contra o tamanho da suíte:** é `tools/ci/esteira.test.ts:199`. O Playwright conta os casos de cada fatia de verdade, e o teste não tem mock.
- **Subir o teto ou baixar as constantes:** o diff não faz nenhum dos dois, e o runbook continua dizendo que isso não é saída.
- **Rodei** `npx vitest run --project unidade tools/ci/esteira.test.ts` nesta árvore: 11 de 11 verdes.
- **A conta do documento confere:** 1178/7 dá 169 por fatia, 1196/7 dá 171, e 4 + 171 × 7 s dá uns 24 min, abaixo dos 27. O limite de 197 × 7 = 1379 casos também confere.

**Bloqueantes:** nenhum. Não há `.skip`, teste comentado, mock da regra nem provedor de IA. A correção não tem operação concorrente que pedisse teste em paralelo.

**Recomendações:**
1. O vermelho que motivou a correção (200 casos na fatia 1) só se reproduz com `spec/telas-do-professor` somada à linha 3. A quarta mutação, a da matriz contra o teto, ficou sem declarar, e o documento explica o motivo com honestidade. Por isso a prova de que sete fatias resolvem só acontece de fato no portão do merge (`encontro-10`). Vale registrar no `estado.md` que esse portão é o que fecha a prova do teto. Se ele voltar vermelho no teste do teto, a correção não bastou.
2. A margem até a oitava fatia é de uns 180 casos, e o documento já registra isso. Vale anotar o número no "Agora" do Orquestrador, para que a oitava fatia seja pedida antes de outra spec de tela grande e não depois de mais um vermelho.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tasks/correcoes/2026-10-19-setima-fatia-do-e2e.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/.github/workflows/ci.yml
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tools/ci/esteira.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/docs/runbook.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/README.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-19 04:45:32 · `tasks/correcoes/2026-10-19-setima-fatia-do-e2e.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Caminho feliz: a matriz passa a sete fatias, e o `/7` aparece nos dois lugares do `ci.yml`.
- A suíte de e2e passa de 197 casos por fatia quando a spec é somada à linha 3.
- Na linha 3 sozinha, a suíte fica exatamente no limite.
- As três cópias do total de fatias têm de concordar entre si: matriz, `--shard` do passo e `name` do job.
- Permissão e isolamento não se aplicam: é configuração da esteira e documentação, sem dado de escola.

**Cobertos:**
- **Rodada nova.** Desde a 1ª rodada, só mudaram o texto de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/docs/runbook.md` e o documento da correção. `ci.yml` e `README.md` são os mesmos que aprovei. Também não mudaram os três blocos de mutação nem o teste que eles citam.
- **A conta nova do runbook está certa.** Conferi contra `tools/ci/prazo-do-e2e.ts:28`, que calcula `Math.ceil(4 + casos × 7 / 60)`. Com 197 casos dá 27 min, dentro do limite de 27 (60% de 45). Com 198 já dá 28 e reprova, então 197 é mesmo o máximo por fatia. Em sete fatias isso dá 7 × 197 = 1379 casos, e 1379 − 1196 = 183, o "cerca de 180" do texto. O documento diz a mesma coisa (linhas 61-62 e 66-68), e o README ficou só com a troca do número.
- **As mutações continuam valendo.** O "três blocos" da linha 72 do documento agora bate com os três blocos que existem. A mutação do teto de tempo continua não declarada, e o motivo dado se sustenta: na árvore da linha 3 sozinha ela não reprova. O vermelho dela foi reproduzido à mão num worktree com o merge refeito: 200 casos por fatia, 28 min, contra 27.
- Não há `.skip` nem mock. Nenhum teste chama IA.

**Bloqueantes:** nenhum.

**Recomendações:**
- A margem até a oitava fatia ("uns 1379 no total") vale só enquanto as constantes de `tools/ci/prazo-do-e2e.ts` não mudarem: 7 s por caso, 4 min fixos e 60% do teto de 45 min. Uma remissão a esse arquivo no parágrafo do runbook evita que o número fique errado em silêncio quando elas mudarem. É só texto, não bloqueia.
