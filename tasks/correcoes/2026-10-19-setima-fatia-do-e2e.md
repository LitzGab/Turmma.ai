# Correção — a suíte de e2e, com a spec somada à linha 3, passou de 197 casos por fatia e não cabe em seis

**Origem:** portão local do merge de `spec/telas-do-professor` na linha 3 (correção `encontro-10`); pedido do Orquestrador em 19/10/2026, com o remédio do `docs/runbook.md`, "Esteira vermelha no e2e", e o precedente de `tasks/correcoes/2026-10-16-sexta-fatia-do-e2e.md`.
**Subagentes obrigatórios:** `infra-guardian`, `revisor-geral`
<!-- O `infra-guardian` veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção toca `.github/` (`ci.yml`), e é por isso que ele entra. -->

## Sintoma

Com `spec/telas-do-professor` somada à linha 3, `npx vitest run --project unidade tools/ci/esteira.test.ts` fica vermelho em um
caso, e o mesmo caso reprova o portão local e o job `verificar` da esteira:

```
a fatia 1 de 6 do e2e tem 200 casos, uns 28 min no runner, e o teto do job é de 45 min: passa de 60% dele, e a esteira
chega ao cancelamento com a suíte verde. O que fazer está em docs/runbook.md, "Esteira vermelha no e2e".
expected 28 to be less than or equal to 27
```

## Fora desta correção

Nada depois do passo zero. O merge de `spec/telas-do-professor` (correção `encontro-10`) foi abortado na árvore antes desta
correção e volta depois, por pedido do Orquestrador. O `tasks/correcoes/encontro-10.md` fica na árvore, sem rastreio, e não entra
na revisão nem no commit. O `rotas.tsx` resolvido do merge está guardado fora do repositório.

## Causa

**É o tempo, pela quinta vez, e a conta é a que a guarda já faz.** A linha 3 sozinha tem 1178 casos (`npx playwright test --list`,
os dois projetos): em seis fatias são 197 por fatia, 27 min estimados (`4 + 197 × 7 s`), exatamente no limite de 27 (60% do teto
de 45) e sem folga nenhuma. A spec `telas-do-professor`, das outras linhas, traz 18 casos de e2e que a linha 3 ainda não tinha
(`e2e/professor-turmas.spec.ts` e os ajustes de `professor-*.spec.ts`): somadas, são 1196 casos, e o Playwright reparte 200, 200,
199, 199, 199, 199, uns 28 min na fatia 1, acima do limite.

A causa é o tamanho da suíte, e não uma tarefa. O remédio não é subir o `timeout-minutes` nem baixar as constantes de
`tools/ci/prazo-do-e2e.ts`, e o runbook já diz isso: é acrescentar a fatia.

## Teste que reproduz

`tools/ci/esteira.test.ts › o teto do e2e cobre a suíte que existe, fatia a fatia e com folga` já é o teste: ele conta os casos de
cada fatia pelo próprio Playwright (`--shard=<i>/<n>`) e compara com o limite. Nenhum teste novo, porque a regra é a que ele já
afirma; a correção muda a configuração que ele lê.

Com a árvore da linha 3 sozinha o teste está verde (197 casos, 27 min, no limite), e por isso o vermelho foi reproduzido num
worktree descartável, criado em `HEAD` com o merge de `spec/telas-do-professor` refeito (`git merge --no-commit`), com o mesmo
`node_modules`:

- **Vermelho antes:** `npx vitest run --project unidade tools/ci/esteira.test.ts` nesse worktree, 10 verdes e 1 vermelho (saída
  acima), em 19/10/2026. `npx playwright test --list`: 1196 casos; por fatia de seis, 200, 200, 199, 199, 199, 199.
- **Verde depois:** a mesma linha, 11 de 11, na árvore da linha 3 e, de novo, no worktree com o merge (171 casos por fatia, uns 24
  min).

As outras duas guardas que dependem do total de fatias continuam em pé: a matriz tem de ser `1..n` sem buraco, e o `/n` do passo e
o do `name` do job têm de ser o tamanho da matriz (`tem os jobs verificar, integracao, infra e e2e…` e `o e2e roda em fatias que
não se cancelam…`). É nelas que se apoiam as mutações abaixo. O teste não precisa de edição: ele lê a matriz do `ci.yml`.

## Correção

`.github/workflows/ci.yml`, job `e2e`: a matriz passa de `[1, 2, 3, 4, 5, 6]` para `[1, 2, 3, 4, 5, 6, 7]`, e o `/6` do `name` do
job e do passo `npm run ci:e2e -- --shard=${{ matrix.fatia }}/6` passa a `/7`. Nada mais muda no job: o teto de cada fatia
continua 45 min, o `fail-fast` continua `false`, o artefato do traço continua um por fatia (`traco-do-e2e-<i>`).

`docs/runbook.md` ("Esteira vermelha no e2e") e `README.md` (a linha do `npm run ci:e2e`) deixam de dizer "seis fatias" e `<i>/6`:
dizem sete e `<i>/7`. Só o runbook traz a data e a conta da sétima (1178 casos na linha e 1196 com a spec somada; 169 e 171 por
fatia, uns 24 min nos dois, contra 27) e a margem até a oitava (uns 1379 casos no total, cerca de 180 a mais que hoje); o README
só troca o número, como já fazia na sexta fatia. O runbook é lido pela guarda `alerta-tem-runbook`, e por isso conta como código (caduca carimbo e
rodadas): foi mexido antes do portão, não depois.

O que a sétima fatia custa: um job a mais por push (uns 4 min fixos de preparo, compose e navegador), e cada fatia fica com um
sétimo da suíte. O limite em casos continua 197 por fatia (`4 + 197 × 7 s` = 26,98 min), ou uns 1379 no total em sete fatias:
a margem é de uns 180 casos, e é o ponto em que a oitava fatia passa a ser pedida.

## Mutações

Os três blocos desfazem um dos três lugares em que o total de fatias está escrito; a guarda que os confere tem de ficar
vermelha.

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › tem os jobs verificar, integracao, infra e e2e
-        fatia: [1, 2, 3, 4, 5, 6, 7]
+        fatia: [1, 2, 3, 4, 5, 6]
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › tem os jobs verificar, integracao, infra e e2e
-      - run: npm run ci:e2e -- --shard=${{ matrix.fatia }}/7
+      - run: npm run ci:e2e -- --shard=${{ matrix.fatia }}/6
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o e2e roda em fatias que não se cancelam
-    name: e2e ${{ matrix.fatia }}/7 (compose completo e Playwright)
+    name: e2e ${{ matrix.fatia }}/6 (compose completo e Playwright)
```

O teto, que é o teste que reproduz o sintoma: a matriz volta a seis e o `/7` do passo e do `name` ficam. A guarda dos comandos
também fica vermelha, mas o teto olha outra coisa, o tamanho da suíte: com a matriz em seis ele reparte em `--shard=<i>/6`, e
na linha 3 sozinha dá 197 casos por fatia, no limite, sem passar dele. Por isso o teto só prova a falta da sétima fatia com a
spec somada; na árvore da linha 3 a mutação dele fica verde. A mutação dele **não é declarada**: o portão a rodaria na árvore
da linha 3, onde ela não reprova, e as três acima já provam cada lugar do total.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 04:33:35 | 2026-10-19 04:34:03 | `infra-guardian` | 1 | APROVADO | ace94e5cfc6c81fa0 |
| 2026-10-19 04:33:36 | 2026-10-19 04:34:04 | `revisor-geral` | 1 | APROVADO | a9393305638a874ce |
| 2026-10-19 04:33:37 | 2026-10-19 04:34:13 | `test-engineer` | 1 | APROVADO | ae05469a8ab24239f |
| 2026-10-19 04:45:03 | 2026-10-19 04:45:16 | `infra-guardian` | 2 | APROVADO | a4da3ccb46c788db4 |
| 2026-10-19 04:45:07 | 2026-10-19 04:45:19 | `revisor-geral` | 2 | APROVADO | ac4b6d5019348dc8a |
| 2026-10-19 04:45:11 | 2026-10-19 04:45:32 | `test-engineer` | 2 | APROVADO | a8cb8586f404b724b |
