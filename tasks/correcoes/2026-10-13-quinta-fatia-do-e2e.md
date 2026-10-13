# Correção — a suíte de e2e chegou a 818 casos e não cabe em quatro fatias

**Origem:** portão local da 6.0 de `pele-e-casca` (`tools/ci/esteira.test.ts › o teto do e2e cobre a suíte que existe, fatia a fatia e com folga`); pedido do Orquestrador em 13/10/2026, com o remédio do `docs/runbook.md`, "Esteira vermelha no e2e".
**Subagentes obrigatórios:** `infra-guardian`, `revisor-geral`
<!-- O `infra-guardian` veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção toca `.github/` (`ci.yml`), e é por isso que ele entra. -->

## Sintoma

`npx vitest run --project unidade tools/ci/esteira.test.ts` fica vermelho em um caso, e o mesmo caso reprova o portão local e
o job `verificar` da esteira:

```
a fatia 1 de 4 do e2e tem 205 casos, uns 28 min no runner, e o teto do job é de 45 min: passa de 60% dele, e a esteira
chega ao cancelamento com a suíte verde. O que fazer está em docs/runbook.md, "Esteira vermelha no e2e".
expected 28 to be less than or equal to 27
```

## Fora desta correção

A tarefa 6.0 de `pele-e-casca` está na árvore, sem commit. Os 24 arquivos dela ficam na árvore e não entram na revisão nem no
commit desta correção (`.processo/ordens/arquivos-da-tarefa-6.txt`):

```
apps/web/nome-dos-chunks.test.ts
apps/web/nome-dos-chunks.ts
apps/web/src/componentes/Abas.tsx
apps/web/src/componentes/Faixa.tsx
apps/web/src/componentes/SeloDeEstado.tsx
apps/web/src/componentes/estado/EstadoCarregando.tsx
apps/web/src/componentes/estado/EstadoErro.tsx
apps/web/src/componentes/estado/EstadoVazio.tsx
apps/web/src/galeria/secoes/estado.tsx
docs/interface.md
tasks/prd-pele-e-casca/6_task.md
tasks/prd-pele-e-casca/cenarios.md
tasks/prd-pele-e-casca/tasks.md
tasks/prd-pele-e-casca/techspec.md
apps/web/src/componentes/Abas.test.tsx
apps/web/src/componentes/Aviso.test.tsx
apps/web/src/componentes/Aviso.tsx
apps/web/src/componentes/Contador.test.tsx
apps/web/src/componentes/Contador.tsx
apps/web/src/componentes/SeloEFaixa.test.tsx
apps/web/src/componentes/Toque.test.tsx
apps/web/src/componentes/Toque.tsx
apps/web/src/componentes/estado/estados.test.tsx
e2e/pecas-estado.spec.ts
```

## Causa

**É o tempo, pela terceira vez, e a conta é a que a guarda já faz.** A suíte tem 818 casos (`npx playwright test --list`, os dois
projetos). Com quatro fatias, o Playwright reparte por contagem e cada uma leva 205 casos, 28 min estimados no runner
(`4 + 205 × 7 s`), contra o limite de 27 min (60% do teto de 45): a esteira chegaria ao cancelamento com a suíte verde, como nas
duas execuções de `2026-10-03-e2e-em-fatias`.

De onde vêm os 818: 776 casos são do que já está commitado (194 por fatia, 27 min: **exatamente no limite, sem folga**) e 42 são
de `e2e/pecas-estado.spec.ts`, da 6.0, que ainda não foi commitada. A 6.0 só empurrou a suíte por cima do limite: com quatro
fatias, qualquer caso novo o faria, e o e2e dela é parte da regra da tarefa (regra 40). A causa é o tamanho da suíte, e não de
uma tarefa.

O remédio não é subir o `timeout-minutes` nem baixar as constantes de `tools/ci/prazo-do-e2e.ts`, e o runbook já diz isso:
é acrescentar a fatia.

## Teste que reproduz

`tools/ci/esteira.test.ts › o teto do e2e cobre a suíte que existe, fatia a fatia e com folga` já é o teste, e já estava
vermelho antes da correção: ele conta os casos de cada fatia pelo próprio Playwright (`--shard=<i>/<n>`) e compara com o limite.
Nenhum teste novo, porque a regra é a que ele já afirma; a correção muda a configuração que ele lê.

- **Vermelho antes:** `npx vitest run --project unidade tools/ci/esteira.test.ts`, 10 verdes e 1 vermelho (saída acima).
- **Verde depois:** a mesma linha, 11 de 11 (passo 4 abaixo).

As outras duas guardas que dependem do total de fatias já existem e continuam em pé: a matriz tem de ser `1..n` sem buraco, e o
`/n` do passo e o do `name` do job têm de ser o tamanho da matriz (`tem os jobs verificar, integracao, infra e e2e…` e `o e2e roda
em fatias que não se cancelam…`). É nelas que se apoiam as mutações abaixo.

## Correção

`.github/workflows/ci.yml`, job `e2e`: a matriz passa de `[1, 2, 3, 4]` para `[1, 2, 3, 4, 5]`, e o `/4` do `name` do job e do
passo `npm run ci:e2e -- --shard=${{ matrix.fatia }}/4` passa a `/5`. O comentário que dizia "o `/4` do passo" deixa de citar o
número. Nada mais muda no job: o teto de cada fatia continua 45 min, o `fail-fast` continua `false`, o artefato do traço continua
um por fatia (`traco-do-e2e-<i>`).

`docs/runbook.md` ("Esteira vermelha no e2e") e `README.md` (a linha do `npm run ci:e2e`) deixam de dizer "quatro fatias" e
`<i>/4`: dizem cinco e `<i>/5`, com a data e a conta da quinta (776 casos commitados e 818 com a 6.0; 156 e 164 por fatia, uns 23 e 24 min, contra 27). O documento do
runbook é lido pela guarda `alerta-tem-runbook`, e por isso conta como código (caduca carimbo e rodadas): foi mexido antes do
portão, não depois.

O que a quinta fatia custa: um job a mais por push (uns 4 min fixos de preparo, compose e navegador), e cada fatia fica com 20%
menos casos. Com 164 casos por fatia (os 818 repartidos em 164, 164, 164, 163 e 163), a suíte tem folga até uns 197 por fatia (uns
985 no total, `4 + 197 × 7 s` = 27 min), antes de pedir a sexta.

## Mutações

Cada bloco desfaz um dos três lugares em que o total de fatias está escrito; a guarda que os confere tem de ficar vermelha.

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › tem os jobs verificar, integracao, infra e e2e
-        fatia: [1, 2, 3, 4, 5]
+        fatia: [1, 2, 3, 4]
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › tem os jobs verificar, integracao, infra e e2e
-      - run: npm run ci:e2e -- --shard=${{ matrix.fatia }}/5
+      - run: npm run ci:e2e -- --shard=${{ matrix.fatia }}/4
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o e2e roda em fatias que não se cancelam
-    name: e2e ${{ matrix.fatia }}/5 (compose completo e Playwright)
+    name: e2e ${{ matrix.fatia }}/4 (compose completo e Playwright)
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | "Nenhuma mutação reverte os três lugares juntos e de forma coerente, voltando tudo a `/4`. Hoje isso só fica vermelho no teste do teto, e só enquanto `e2e/pecas-estado.spec.ts` da 6.0 estiver na árvore. […] Fica registrado para o `/validar` conferir que a correção não pousa sem a 6.0, ou que a reversão está coberta." | Recusada: não é mudança de código. O teste do teto (`tools/ci/esteira.test.ts`) já cobre a reversão inteira assim que a 6.0 entra na mesma branch; fica para o `/validar` conferir |
| revisor-geral (1ª) e test-engineer (1ª) | O comentário de `tools/ci/esteira.test.ts:127-128` usa "`/3` com quatro fatias" e "`/5`" como exemplos; "ficaria mais claro escrito como `/n-1` e `/n+1`" | Recusada: o arquivo é de teste, fora desta correção, e o comentário continua correto como exemplo; os dois revisores o registram como só texto |
| infra-guardian (1ª) | As referências a `e2e n/4` em `TODO.md`, `docs/mvp-rapido.md`, `tasks/prd-*` e correções antigas "são registro de execuções passadas. Estão certas e ficam como estão." | Recusada: o revisor mesmo diz que não há o que mudar; é registro histórico |
| revisor-geral (2ª) | "O texto diz "uns 23 e 24 min" porque o tempo é arredondado para cima: 156 casos dão 22,2 min, que vira 23. […] Dá para citar uma vez, no runbook, que a estimativa vem de `estimarMinutosDoE2e` (ou do nome real da função em `tools/ci/prazo-do-e2e.ts`), sem repetir a fórmula. Não bloqueia." | Recusada: o texto já diz "uns", e a fórmula mora em `tools/ci/prazo-do-e2e.ts`, que a guarda de `esteira.test.ts` refaz a cada push. Mexer no runbook caduca o carimbo e as três rodadas por uma nota de rodapé |
| test-engineer (2ª) | "O runbook agora grava contagens de casos com data. Elas envelhecem a cada spec. Se alguém quiser evitar isso, vale trocar por "ver o documento da correção" e deixar os números só em `tasks/correcoes/2026-10-13-quinta-fatia-do-e2e.md`. Não bloqueia." | Recusada: o parágrafo é datado de propósito ("A quinta entrou em 13/10/2026"): conta o porquê da quinta fatia, e quem vigia o número vivo é a guarda, não o texto |
| infra-guardian (2ª) | "As três recomendações recusadas na tabela […] ficam para o `/validar`. Um ponto pede atenção: esta correção não pode pousar sem a 6.0 de pele-e-casca. Sem os 42 casos dela, uma volta para `/4` só ficaria vermelha no teste do teto quando a suíte passasse de 776 casos." | Repete a recomendação 1 do test-engineer (1ª), que já está na tabela do documento, com destino no `/validar`. Sem código a mudar |
| test-engineer (2ª) | "Continuam valendo as da 1ª rodada, que ficam para o `/validar`." | Já na tabela do documento |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-13 14:30:37 | 2026-10-13 14:31:00 | `revisor-geral` | 1 | APROVADO | ab06728ac39143963 |
| 2026-10-13 14:30:35 | 2026-10-13 14:31:09 | `infra-guardian` | 1 | APROVADO | a5718e090bdbab467 |
| 2026-10-13 14:30:39 | 2026-10-13 14:31:23 | `test-engineer` | 1 | APROVADO | ab31d12a08de522bd |
| 2026-10-13 14:35:45 | 2026-10-13 14:36:05 | `infra-guardian` | 2 | APROVADO | a6f1ced6744ad6e5a |
| 2026-10-13 14:35:50 | 2026-10-13 14:36:10 | `revisor-geral` | 2 | APROVADO | a21d2e702c45220df |
| 2026-10-13 14:35:55 | 2026-10-13 14:36:13 | `test-engineer` | 2 | APROVADO | a8f8c0e024c6159a4 |
