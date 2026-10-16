# Correção — a suíte de e2e passou de 197 casos por fatia e não cabe em cinco

**Origem:** portão local da 2.0 de `telas-da-coordenacao` (`tools/ci/esteira.test.ts › o teto do e2e cobre a suíte que existe, fatia a fatia e com folga`); pedido do Orquestrador em 16/10/2026, com o remédio do `docs/runbook.md`, "Esteira vermelha no e2e".
**Subagentes obrigatórios:** `infra-guardian`, `revisor-geral`
<!-- O `infra-guardian` veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção toca `.github/` (`ci.yml`), e é por isso que ele entra. -->

## Sintoma

`npx vitest run --project unidade tools/ci/esteira.test.ts` fica vermelho em um caso, e o mesmo caso reprova o portão local e
o job `verificar` da esteira:

```
a fatia 1 de 5 do e2e tem 201 casos, uns 28 min no runner, e o teto do job é de 45 min: passa de 60% dele, e a esteira
chega ao cancelamento com a suíte verde. O que fazer está em docs/runbook.md, "Esteira vermelha no e2e".
expected 28 to be less than or equal to 27
```

## Fora desta correção

A tarefa 2.0 de `telas-da-coordenacao` está na árvore, sem commit, pronta e verde. Os arquivos dela ficam na árvore e não entram na
revisão nem no commit desta correção:

```
apps/web/src/areas/coordenacao/Estrutura.tsx
apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
apps/web/src/areas/coordenacao/rotas.tsx
apps/web/src/caminhos.test.ts
apps/web/src/caminhos.ts
e2e/areas.spec.ts
tasks/prd-telas-da-coordenacao/2_task.md
apps/web/src/areas/coordenacao/Painel.test.tsx
apps/web/src/areas/coordenacao/Painel.tsx
apps/web/src/areas/coordenacao/o-que-falta-da-escola.test.ts
apps/web/src/areas/coordenacao/o-que-falta-da-escola.ts
e2e/painel-da-coordenacao.spec.ts
```

## Causa

**É o tempo, pela quarta vez, e a conta é a que a guarda já faz.** A suíte tem 1002 casos na árvore (`npx playwright test --list`,
os dois projetos). Com cinco fatias, o Playwright reparte por contagem e cada uma leva 201 casos, 28 min estimados no runner
(`4 + 201 × 7 s`), contra o limite de 27 min (60% do teto de 45; o limite em casos é 197 por fatia).

De onde vêm os 1002: 990 casos são do que já está commitado (198 por fatia, 28 min: **já acima do limite, sem a 2.0**) e 12 são de
`e2e/painel-da-coordenacao.spec.ts`, da 2.0, ainda sem commit (`e2e/areas.spec.ts` foi alterado sem ganhar caso). A 2.0 só deixou
o vermelho aparecer no portão; a causa é o tamanho da suíte, e não de uma tarefa.

O remédio não é subir o `timeout-minutes` nem baixar as constantes de `tools/ci/prazo-do-e2e.ts`, e o runbook já diz isso: é
acrescentar a fatia.

## Teste que reproduz

`tools/ci/esteira.test.ts › o teto do e2e cobre a suíte que existe, fatia a fatia e com folga` já é o teste, e já estava vermelho
antes da correção: ele conta os casos de cada fatia pelo próprio Playwright (`--shard=<i>/<n>`) e compara com o limite. Nenhum
teste novo, porque a regra é a que ele já afirma; a correção muda a configuração que ele lê.

- **Vermelho antes:** `npx vitest run --project unidade tools/ci/esteira.test.ts`, 10 verdes e 1 vermelho (saída acima), em 16/10/2026.
- **Verde depois:** a mesma linha, 11 de 11.

As outras duas guardas que dependem do total de fatias continuam em pé: a matriz tem de ser `1..n` sem buraco, e o `/n` do passo e
o do `name` do job têm de ser o tamanho da matriz (`tem os jobs verificar, integracao, infra e e2e…` e `o e2e roda em fatias que
não se cancelam…`). É nelas que se apoiam as mutações abaixo. O teste não precisa de edição: ele lê a matriz do `ci.yml`.

## Correção

`.github/workflows/ci.yml`, job `e2e`: a matriz passa de `[1, 2, 3, 4, 5]` para `[1, 2, 3, 4, 5, 6]`, e o `/5` do `name` do job e do
passo `npm run ci:e2e -- --shard=${{ matrix.fatia }}/5` passa a `/6`. Nada mais muda no job: o teto de cada fatia continua 45 min,
o `fail-fast` continua `false`, o artefato do traço continua um por fatia (`traco-do-e2e-<i>`).

`docs/runbook.md` ("Esteira vermelha no e2e") e `README.md` (a linha do `npm run ci:e2e`) deixam de dizer "cinco fatias" e `<i>/5`:
dizem seis e `<i>/6`, com a data e a conta da sexta (990 casos commitados e 1002 com a 2.0 de `telas-da-coordenacao`; 167 por
fatia, uns 24 min, contra 27). O runbook é lido pela guarda `alerta-tem-runbook`, e por isso conta como código (caduca carimbo e
rodadas): foi mexido antes do portão, não depois.

O que a sexta fatia custa: um job a mais por push (uns 4 min fixos de preparo, compose e navegador), e cada fatia fica com um
sexto da suíte. Com 167 casos por fatia (1002 repartidos em 167 × 6), o limite é de 197 casos por fatia (uns 1182 no total,
`4 + 197 × 7 s` = 26,98 min, quase em cima dos 27): não é margem, é o ponto em que a sétima fatia passa a ser pedida.

## Mutações

Os três primeiros blocos desfazem um dos três lugares em que o total de fatias está escrito; a guarda que os confere tem de ficar vermelha. O quarto desfaz só a matriz e é provado pelo teste do teto, que olha o tamanho da suíte.

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › tem os jobs verificar, integracao, infra e e2e
-        fatia: [1, 2, 3, 4, 5, 6]
+        fatia: [1, 2, 3, 4, 5]
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › tem os jobs verificar, integracao, infra e e2e
-      - run: npm run ci:e2e -- --shard=${{ matrix.fatia }}/6
+      - run: npm run ci:e2e -- --shard=${{ matrix.fatia }}/5
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o e2e roda em fatias que não se cancelam
-    name: e2e ${{ matrix.fatia }}/6 (compose completo e Playwright)
+    name: e2e ${{ matrix.fatia }}/5 (compose completo e Playwright)
```

O teto, que é o teste que reproduz o sintoma: a matriz volta a cinco e o `/6` do passo e do `name` ficam. A guarda dos comandos
também fica vermelha, mas o teto olha outra coisa, o tamanho da suíte: com a matriz em cinco ele reparte em `--shard=<i>/5` e
dá 198 casos por fatia, uns 28 min.

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o teto do e2e cobre a suíte que existe
-        fatia: [1, 2, 3, 4, 5, 6]
+        fatia: [1, 2, 3, 4, 5]
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | "Se o GitHub exige `e2e 1/5` a `e2e 5/5` como verificação obrigatória na proteção de alguma branch, troque essa lista para `1/6` a `6/6` antes do primeiro merge depois do pouso. Senão o merge fica esperando uma verificação que não roda mais. Não dá para ver essa configuração pelo repositório." | Recusada nesta correção: configuração do GitHub fora do repositório, que a correção não alcança. Vai ao Orquestrador (e ao Joaquim), para conferir antes do pouso de `telas-da-coordenacao` |
| revisor-geral (2ª) e test-engineer (2ª) | "o parágrafo antes da quarta mutação diz "dá 198 casos por fatia". [...] Com o e2e da 2.0 ainda sem commit, o portão aplicou a mutação sobre 1002 casos, ou seja, 201 por fatia. A mutação fica vermelha nos dois casos e o mérito não muda. Vale escrever "198 só com o commitado, 201 com a 2.0 na árvore"" / "vale escrever "198 a 201 casos" para bater com a frase do runbook" | Recusada: nenhum dos dois reprovou, e a regra da Mesa só aplica recomendação na primeira ordem do documento. O vermelho sai igual com 198 ou 201, e o runbook, que é o registro que se lê depois, já distingue os dois números |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-16 16:14:54 | 2026-10-16 16:15:16 | `revisor-geral` | 1 | APROVADO | aeaf7519c74547274 |
| 2026-10-16 16:14:52 | 2026-10-16 16:15:26 | `infra-guardian` | 1 | APROVADO | a95b1c1608bf37da0 |
| 2026-10-16 16:14:56 | 2026-10-16 16:15:38 | `test-engineer` | 1 | APROVADO | a049e515b667cc5ca |
| 2026-10-16 16:23:42 | 2026-10-16 16:24:05 | `infra-guardian` | 2 | APROVADO | ad5655bade02cde34 |
| 2026-10-16 16:23:49 | 2026-10-16 16:24:10 | `revisor-geral` | 2 | APROVADO | a6de5fd854850cf45 |
| 2026-10-16 16:23:57 | 2026-10-16 16:24:30 | `test-engineer` | 2 | APROVADO | a560dbcde37814f4f |
