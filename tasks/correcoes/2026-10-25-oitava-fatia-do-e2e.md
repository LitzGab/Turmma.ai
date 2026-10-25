# Correção — a suíte de e2e passou de 197 casos por fatia e não cabe em sete

**Origem:** esteira / portão local (`tools/ci/esteira.test.ts › o teto do e2e cobre a suíte que existe, fatia a fatia e com folga`); pedido do Orquestrador em 25/10/2026, com o remédio do `docs/runbook.md`, "Esteira vermelha no e2e", e os precedentes de `tasks/correcoes/2026-10-16-sexta-fatia-do-e2e.md` e `tasks/correcoes/2026-10-19-setima-fatia-do-e2e.md`.
**Subagentes obrigatórios:** `infra-guardian`, `privacy-guardian`, `revisor-geral`
<!-- O `infra-guardian` e o `revisor-geral` vieram no PEDIDO do Orquestrador; o `revisor-geral` também porque a correção toca `.github/` (`ci.yml`) e `tools/processo/`. O `privacy-guardian` entra pela Mesa: `.github/` está na tabela de `tools/processo/guardioes-por-caminho.ts` com `infra-guardian` e `privacy-guardian`. test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

`npx vitest run --project unidade tools/ci/esteira.test.ts` fica vermelho em um caso, e o mesmo caso reprova o portão local e o job
`verificar` da esteira:

```
a fatia 1 de 7 do e2e tem 198 casos, uns 28 min no runner, e o teto do job é de 45 min: passa de 60% dele, e a esteira
chega ao cancelamento com a suíte verde. O que fazer está em docs/runbook.md, "Esteira vermelha no e2e".
expected 28 to be less than or equal to 27
```

## Fora desta correção

Os dois itens abaixo são da correção do Tutor pausado (`tasks/correcoes/2026-10-25-tutor-pausado-no-cartao-da-avaliacao.md`), em
curso na mesma árvore. Ficam na árvore e não entram na revisão nem no commit desta correção:

```
e2e/aluno-fluxo.spec.ts
tasks/correcoes/2026-10-25-tutor-pausado-no-cartao-da-avaliacao.md
```

(O ajuste em `e2e/aluno-fluxo.spec.ts` troca linhas de um caso que já existe e não acrescenta caso: a contagem abaixo é a mesma
com ou sem ele.)

## Causa

**É o tempo, pela sexta vez, e a conta é a que a guarda já faz.** A suíte tem 1384 casos (`npx playwright test --list`, os dois
projetos). Com sete fatias, o Playwright reparte por contagem e a fatia 1 leva 198 casos, uns 28 min estimados no runner
(`4 + 198 × 7 s`), contra o limite de 27 min (60% do teto de 45; o limite em casos é 197 por fatia, ou 1379 no total em sete).

A suíte passou dos 1379 com as tarefas 6.0 e 7.0 de `telas-do-aluno-e-primeiro-acesso`, que acrescentaram casos de e2e; o tamanho
da suíte, e não uma tarefa, é a causa, e a margem da sétima fatia (uns 180 casos sobre os 1196 de 19/10) acabou. O remédio não é
subir o `timeout-minutes` nem baixar as constantes de `tools/ci/prazo-do-e2e.ts`, e o runbook já diz isso: é acrescentar a fatia.

Desta vez o total de fatias está escrito em **quatro** lugares, e não em três: além da matriz, do `--shard` do passo e do `name`
do job do `ci.yml`, a lista `FATIAS_DO_E2E` de `tools/processo/esteira.ts`, que o censo do e2e lê (nasceu em 23/10, com o censo do prazo do e2e, depois da sétima
fatia). A guarda `o relatório do censo sobe também na execução verde…` confere que ela é igual à matriz; sem acompanhá-la, o
censo leria sete relatórios de oito e reportaria fatia faltando.

## Teste que reproduz

`tools/ci/esteira.test.ts › o teto do e2e cobre a suíte que existe, fatia a fatia e com folga` já é o teste: ele conta os casos de
cada fatia pelo próprio Playwright (`--shard=<i>/<n>`) e compara com o limite. Nenhum teste novo, porque a regra é a que ele já
afirma; a correção muda a configuração que ele lê.

- **Vermelho antes:** `npx vitest run --project unidade tools/ci/esteira.test.ts`, 20 verdes e 1 vermelho (saída acima), em 25/10/2026.
- **Verde depois:** a mesma linha, 21 de 21.

As outras guardas que dependem do total de fatias continuam em pé: a matriz tem de ser `1..n` sem buraco, o `/n` do passo e o do
`name` do job têm de ser o tamanho da matriz (`tem os jobs verificar, integracao, infra e e2e…` e `o e2e roda em fatias que não
se cancelam…`), e `FATIAS_DO_E2E` tem de ser a matriz. É nelas que se apoiam as mutações abaixo. O teste do teto não precisa de
edição: ele lê a matriz do `ci.yml`.

## Correção

`.github/workflows/ci.yml`, job `e2e`: a matriz passa de `[1, 2, 3, 4, 5, 6, 7]` para `[1, 2, 3, 4, 5, 6, 7, 8]`, e o `/7` do `name`
do job e do passo `npm run ci:e2e -- --shard=${{ matrix.fatia }}/7` passa a `/8`. `tools/processo/esteira.ts`: `FATIAS_DO_E2E`
ganha o 8. Nada mais muda no job: o teto de cada fatia continua 45 min, o `fail-fast` continua `false`, o artefato do traço
continua um por fatia (`traco-do-e2e-<i>`).

`docs/runbook.md` ("Esteira vermelha no e2e") e `README.md` (a linha do `npm run ci:e2e`) deixam de dizer "sete fatias" e `<i>/7`:
dizem oito e `<i>/8`. Só o runbook traz a data e a conta da oitava (1384 casos: 198 por fatia em sete, uns 28 min, acima de 27; 173
em oito, uns 25 min) e a margem até a nona (1576 casos no total em oito fatias, cerca de 190 a mais que hoje); o README só troca o
número. O runbook é lido pela guarda `alerta-tem-runbook`, e por isso conta como código (caduca carimbo e rodadas): foi mexido
antes do portão, não depois.

O que a oitava fatia custa: um job a mais por push (uns 4 min fixos de preparo, compose e navegador), e cada fatia fica com um
oitavo da suíte. O limite em casos continua 197 por fatia (`4 + 197 × 7 s` = 26,98 min), ou 1576 no total em oito fatias: a margem é
de uns 190 casos, e é o ponto em que a nona fatia passa a ser pedida.

Recomendação já feita ao Orquestrador na sexta fatia e que vale de novo: se a proteção de branch do GitHub exige `e2e N/7` como
verificação obrigatória, a lista troca para `1/8` a `8/8`; é configuração fora do repositório, que esta correção não alcança.

## Mutações

Os quatro blocos desfazem um dos lugares em que o total de fatias está escrito; a guarda que o confere tem de ficar vermelha.

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › tem os jobs verificar, integracao, infra e e2e
-        fatia: [1, 2, 3, 4, 5, 6, 7, 8]
+        fatia: [1, 2, 3, 4, 5, 6, 7]
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › tem os jobs verificar, integracao, infra e e2e
-      - run: npm run ci:e2e -- --shard=${{ matrix.fatia }}/8
+      - run: npm run ci:e2e -- --shard=${{ matrix.fatia }}/7
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o e2e roda em fatias que não se cancelam
-    name: e2e ${{ matrix.fatia }}/8 (compose completo e Playwright)
+    name: e2e ${{ matrix.fatia }}/7 (compose completo e Playwright)
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/ci/esteira.test.ts › o relatório do censo sobe também na execução verde
-export const FATIAS_DO_E2E = [1, 2, 3, 4, 5, 6, 7, 8] as const
+export const FATIAS_DO_E2E = [1, 2, 3, 4, 5, 6, 7] as const
```

O teto, que é o teste que reproduz o sintoma, não leva mutação declarada: com a matriz em sete o `/8` do passo e do `name` ficam, e
a guarda dos comandos também fica vermelha, mas o teto olha o tamanho da suíte (198 casos por fatia em sete, 28 min), e isso já foi
mostrado no vermelho de antes. Os quatro blocos acima provam cada lugar do total.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian, revisor-geral, test-engineer (1ª) | `TODO.md:1584`, item (e) da validação da X3, ainda diz "com sete fatias de e2e sobram cerca de 180 casos (cerca de 1379…) até a oitava": atualizar para oito fatias, 1576 casos, uns 190 de margem até a nona, ou fechar o item | `TODO.md` não é arquivo desta correção. Destino: o próprio item (e) do `TODO.md`, que o Orquestrador atualiza no próximo commit de documento dele |
| infra-guardian (1ª) | Se a proteção de branch do GitHub exige `e2e 1/7` a `e2e 7/7`, trocar a lista para `1/8` a `8/8`; sem isso o merge espera para sempre verificações que não rodam mais | Fora do repositório, e o documento já registra. Destino: o Joaquim, antes do próximo merge; o Implementador cita no relatório ao Orquestrador |
| revisor-geral (1ª), test-engineer (1ª) | Depois do merge, a última execução verde terá só sete artefatos e o censo responde "incompleto" com a fatia 8 faltando, até a primeira execução verde com oito | Aviso sem ação: passageiro e sem defeito. O Implementador repassa ao Orquestrador no relatório da correção |
| infra-guardian (1ª) | O censo baixa a lista de artefatos com `per_page=100`; se passar de 100 itens por execução, passa a reportar fatia faltando sem faltar | `TODO.md`, para a tarefa futura que mexer no censo: a folga é grande (2 artefatos por fatia, 16 de 100) e não muda nesta correção |
| test-engineer (1ª) | Um comentário curto em `tools/processo/esteira.test.ts` dizendo que o `/7` das fixtures e dos testes (linhas 135, 166, 257 a 261) é da época | Recusada: o arquivo não é desta correção, tocá-lo pediria os guardiões da pasta, e o próprio revisor diz que "pode ficar como está" |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 14:21:46 | 2026-10-25 14:22:05 | `privacy-guardian` | 1 | APROVADO | ae988483c3985e3d3 |
| 2026-10-25 14:21:44 | 2026-10-25 14:22:21 | `infra-guardian` | 1 | APROVADO | a196eaae60f67962b |
| 2026-10-25 14:21:47 | 2026-10-25 14:22:27 | `revisor-geral` | 1 | APROVADO | aca9d3f1281fefc10 |
| 2026-10-25 14:21:49 | 2026-10-25 14:22:45 | `test-engineer` | 1 | APROVADO | aa7305779acc71ff0 |
| 2026-10-25 14:29:08 | 2026-10-25 14:29:21 | `infra-guardian` | 2 | APROVADO | ab0c9e33b30c15c4b |
| 2026-10-25 14:29:13 | 2026-10-25 14:29:26 | `privacy-guardian` | 2 | APROVADO | aba5eecf8e1fd46e8 |
| 2026-10-25 14:29:18 | 2026-10-25 14:29:37 | `revisor-geral` | 2 | APROVADO | ab57b64e1dbbb1c24 |
| 2026-10-25 14:29:23 | 2026-10-25 14:29:49 | `test-engineer` | 2 | APROVADO | acc7fbeac76852bbf |
