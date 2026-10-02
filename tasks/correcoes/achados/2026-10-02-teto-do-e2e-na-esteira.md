# Achados das revisões — `tasks/correcoes/2026-10-02-teto-do-e2e-na-esteira.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-02 07:12:55 · `tasks/correcoes/2026-10-02-teto-do-e2e-na-esteira.md`

```
VEREDITO: APROVADO
```

O teste prova a regra e os números do documento conferem com os logs da esteira. Não há bloqueante; a recomendação 1 merece decisão do Joaquim antes do commit.

**Cenários exigidos**
1. Teto antigo (30) com a suíte de agora reprova.
2. Fronteira: um minuto abaixo da conta reprova, na conta passa.
3. Job de e2e sem `timeout-minutes` reprova.
4. O teste lê o teto do job `e2e`, não o do `infra` (os dois valem 45).
5. Contagem que falha (formato da linha `Total:` muda, ou o Playwright não lista) reprova em vez de passar com zero.
6. O teste roda no job `verificar` da esteira, em checkout limpo e com `CI=true`.

**Cobertos** — todos, por mutação nos arquivos da correção, restaurados a cada passo:

| Mutação | Resultado |
|---|---|
| e2e 45 → 30 | vermelho: `expected 38 to be less than or equal to 30` |
| e2e 45 → 37 | vermelho: `expected 38 … 37` |
| e2e 45 → 38 | verde, 10 de 10 |
| e2e sem `timeout-minutes` | vermelho (`… to NaN`), e o teste do traço também |
| infra 45 → 10, e2e intacto | verde |
| infra 60, e2e 30 | vermelho |
| regex da linha `Total:` quebrada | vermelho: `expected NaN to be greater than 0` |
| `--list` com config inexistente | vermelho, com o stderr do Playwright na mensagem |

- **Cenário 6:** com `CI=true FORCE_COLOR=1` a linha `Total: 334 tests in 20 files` sai igual. Nenhum import alcançado pelos specs passa por `@educa/*` nem por `dist`, então o `--list` não depende de build.
- **Sem `.skip`, `.only` ou `.fixme`** em `e2e/`; sem mock; a asserção é sobre o resultado.
- **Documento contra a fonte:**
  - A anotação do job diz `The job has exceeded the maximum execution time of 30m0s`.
  - O log tem `Running 304 tests using 2 workers`, 286 verdes, nenhum vermelho; o caso 286 termina às 05:01:03 e o cancelamento vem às 05:01:12.
  - Os 20 casos de `estrutura.spec.ts` somam 554,8 s e os 286 somam 3.198 s.
  - As sete durações da tabela de execuções verdes batem ao segundo com o `gh run view`.
  - A aritmética da folga fecha: 1,22; ~36 min; 375 a 400 casos; reprova a partir de 411.
- **Estado da árvore:** `eslint` limpo no arquivo; `portao-local.ts conferir` responde válido para o código atual; `git diff --stat` dos três arquivos igual ao do início (8/10/33 linhas, mesmos md5).

**Bloqueantes:** nenhum.

**Recomendações**

1. **A guarda só dispara depois do estouro que o próprio documento prevê.**
   - Ela reprova a partir de 411 casos. A seção da folga prevê o teto alcançado entre 375 e 400. A 25 casos por tarefa, a 17.0 chega a 409: guarda verde, job estimado em ~46 min, cancelado.
   - `.github/workflows/ci.yml:73-74` ("reprova antes de a esteira cancelar") afirma isso sem ressalva. `docs/runbook.md:642-643` afirma o mesmo e só ressalva na frase seguinte.
   - Saída A: ressalvar o comentário do YAML ("pela média; pelo peso o job estoura antes, ver runbook").
   - Saída B: dar reserva declarada à conta, por exemplo `minutos ≤ teto − 5`. Reprova a partir de 361 casos e coincide com os "40 min" do runbook. Não mexe nos 45, mas antecipa a próxima decisão para a 16.0, por isso é escolha do Joaquim.
2. **O sinal "job passar de 40 min" não tem dono automático.** Execução verde de 43 min não chama ninguém. Cabe uma linha no passo 7 da `/executar-task`, ou um aviso de `tools/ci/e2e.ts` quando a etapa de testes passar do limiar.
3. **O runbook guarda o número que o YAML deixou de guardar.** `docs/runbook.md:640` traz "(45 min)" e `:644` traz "40 min", sem teste que os amarre ao YAML. Vão envelhecer na próxima subida do teto.
4. **"Custa o dobro" é quase 2,5 vezes.** Em `tools/ci/esteira.test.ts:52` e `docs/runbook.md:642`, os 13,9 s de relógio contra a média de 5,0 a 5,6 s. "Mais que o dobro" seria exato.
5. **Fora desta correção, para o `infra-guardian`:** o job `infra` levou 30 min 09 s nessa mesma execução, e de 29 a 30 min nas quatro anteriores (cerca de 22 min nas três primeiras da série). O comentário em `ci.yml:54-55` fala em "uns 16 min locais", o teto é 45 e nenhuma guarda liga uma coisa à outra.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-02-teto-do-e2e-na-esteira.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml`
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`

## infra-guardian · 1ª rodada · APROVADO · 2026-10-02 07:17:25 · `tasks/correcoes/2026-10-02-teto-do-e2e-na-esteira.md`

```
VEREDITO: APROVADO
Caminho quente tocado: nenhum (esteira e portão; nenhum código de produto)
Rate limit: ok (não tocado)
Fila e prioridade: ok (não tocado)
Concorrência: protegida (não tocado)
Índice e paginação: ok (não tocado)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (o sinal novo, job `cancelled` com a suíte verde, tem parágrafo no runbook)
Bloqueantes: nenhum
Recomendações: quatro, abaixo
```

## O que conferi

- **Números contra a fonte.** O log do job 110706364301 confirma o documento: 304 casos com 2 trabalhadores, 286 terminados, nenhum `✘`, cancelado às 05:01:12. A soma dos casos dá 3.198 s, o mais longo 72 s, e os 20 de `estrutura` 555 s (27,7 s por caso). A tabela de trechos e a duração dos sete jobs verdes também batem.
- **Guarda no job `verificar`.** Copiei a árvore para o scratchpad, sem `dist/`, `test-results/` nem `.env`, e rodei com `CI=true`. O `npx playwright test --list` saiu com status 0 em 1,1 s e contou 334 casos; o arquivo passou 10 de 10. Não precisa de navegador nem de build, porque o e2e importa `packages/shared/src/...` direto.
- **Sem efeito colateral.** O `--list` não cria nem altera `test-results/`. O `::notice` do reporter `github` fica no stdout capturado e não vira anotação no job.
- **Mutação, só na cópia.** Teto 30 e 37 reprovam com a mensagem certa, e 38 passa. Spec com erro de sintaxe reprova com o stderr do Playwright.
- **Publicação do traço.** Na execução cancelada o passo de upload rodou depois do cancelamento, então o comentário sobre `cancelled()` continua verdadeiro.
- **Árvore.** O `git diff --stat` dos três arquivos está igual ao do início (8, 10 e 33 linhas). A cópia do scratchpad foi apagada.

## Recomendações

1. **`.github/workflows/ci.yml:73-74` e `docs/runbook.md:642-643`: "reprova antes de a esteira cancelar" só vale pela média.** A guarda só reprova a partir de 411 casos, e o próprio documento estima o teto real entre 375 e 400. O custo medido por caso vem subindo (5,2 s, depois 5,56 s com 304 casos, 5,84 s estimado com 334), e a constante é 6 s. O runbook compensa com o sinal dos 40 min; o comentário do YAML não. Acrescentar "pela média; é piso" resolve.

2. **O sinal "job passou de 40 min" não tem quem olhe.** O passo 7 da `/executar-task` confere só a `conclusion`. Entre 375 e 411 casos o primeiro aviso continua sendo o cancelamento, agora depois de 45 min. Para o `/retro`: conferir a duração do job de e2e no passo 7, ou a guarda reprovar com margem (teto menos 5).

3. **`docs/runbook.md:640` e `:644` fixam "45 min" e "40 min" em texto.** É o mesmo envelhecimento que a correção tirou do comentário do YAML, e nenhuma guarda amarra o runbook ao número.

4. **Job `infra`: merece correção própria, sem urgência.** A 14.0 é de tela e não soma nele.
   - **Salto, não deriva.** Levava 22 a 23 min até `c2a01c7` e passou a 29 a 30 min desde `3aeec3b` (tarefa 9.0), nas cinco execuções seguintes. Só o caso L12 de `infra/test/alertas.int.test.ts` custa 345 s.
   - **Textos vencidos.** O ensaio dos alertas leva 18 min no runner, e o comentário de `ci.yml:54` diz "uns 11 min". O "uns 16 min" está em `ci.yml:55`, `vitest.config.ts:7`, `README.md:60` e `.claude/rules/40-testes.md:102`. Como os testes esperam relógio real, o `--infra` local deve estar perto de 30 min também; isso não medi.
   - **Folga.** Sobram 15 min em 45. Cada ensaio novo com `for: 5m` custa uns 6 min: cabem dois, e o terceiro cancela com a suíte verde, sem guarda que avise.
   - **Sugestão.** Linha no `TODO.md` agora, e a correção antes da próxima tarefa que acrescentar teste em `infra/**/*.int.test.ts` com espera de relógio.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml`
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-02-teto-do-e2e-na-esteira.md`

## test-engineer · 2ª rodada · APROVADO · 2026-10-02 08:26:25 · `tasks/correcoes/2026-10-02-teto-do-e2e-na-esteira.md`

```
VEREDITO: APROVADO
Cenários exigidos: (rodada nova, só o diff desde a 1ª) os três textos dizem o que a guarda faz; nenhum número solto voltou; nenhuma linha executável mudou; o destino das recomendações sem aplicar é aceitável.
Cobertos: todos os quatro.
Bloqueantes: nenhum
Recomendações: duas, abaixo
```

Não mutei nada na árvore nesta rodada: a prova por mutação (30, 37, 38, sem teto, `infra` trocado, regex quebrada) é da 1ª rodada e a parte executável não mudou. Rodei só o teste isolado e o `conferir`.

**Os três textos contra o código**

- **A conta.** `Math.ceil(4 + casos × 6 / 60) ≤ teto` passa até 410 casos e reprova a partir de 411, como o documento diz. Hoje o Playwright lista 334 casos em 20 arquivos, a conta dá 38, e o arquivo passa 10 de 10.
- **`.github/workflows/ci.yml:70-76`.** "Reprova quando a suíte não cabe nem pela média. É piso: caso pesado estoura o teto antes de a conta passar dele" é o que a asserção faz. A remissão ao runbook aponta para a seção que existe.
- **`tools/ci/esteira.test.ts:52-53`.** "Mais que o dobro da média" confere: 13,9 s contra 5,0 a 5,6 s dá de 2,5 a 2,8 vezes.
- **`docs/runbook.md:638-648`.** Saíram "(45 min)" e "40 min"; entrou "5 min do teto". A frase "que ninguém confere sozinho" admite a lacuna em vez de escondê-la.
- **Números soltos.** Nos três arquivos não sobra "40 min", "45 min" nem "antes de a esteira cancelar". O único "30 min" em `ci.yml:72` é o relato do incidente, não o teto vigente.
- **Documento da correção.** A linha 155 ("job chegando a 5 min do teto") bate com o runbook, e a seção "Recomendações dos revisores" descreve o que de fato mudou.

**Destino das recomendações sem aplicar**

- **Reserva `teto − 5` (minha 1, saída B):** aceitável como decisão do Joaquim, porque muda quando o portão de uma tarefa futura reprova e ele decidiu só o número.
- **Sinal sem dono (minha 2):** aceitável no `/retro`, porque é mudança de skill e o passo 7 da `/executar-task` (linhas 236-249) confere só a `conclusion`.
- **Job `infra` (minha 5):** aceitável como correção própria; os textos vencidos continuam em `ci.yml:54-55`, fora do escopo daqui.

**Estado da árvore**

- `portao-local.ts conferir` responde válido para o código atual (typecheck, lint, test, e2e, infra).
- `git diff --stat` dos três arquivos está igual no início e no fim: 10, 12 e 33 linhas, com os mesmos md5.

**Recomendações**

1. **A lacuna entre 375 e 410 casos continua aberta, e os dois destinos que a fecham ainda não têm registro fora do documento da correção.** Depois da 14.0 o job fica em ~36 min, a 4 min do limiar "5 min do teto", então o sinal que ninguém confere sozinho vira relevante já na 15.0 ou 16.0. Vale levar a saída B ao Joaquim no relatório com essa conta, e não só como item de lista.
2. **A linha do `TODO.md` sobre o job `infra` ficou "para o orquestrador", sem nada que a garanta.** O `TODO.md` não tem ocorrência nenhuma do assunto hoje. Se ela não entrar no commit da 14.0, o único rastro é a tabela deste documento e o bloco de achados, e o gatilho da correção ("antes da próxima tarefa que acrescentar teste com espera de relógio") não aparece para quem abrir essa tarefa.

Detalhe menor, sem pedir mudança: `docs/runbook.md:643` diz "reprova no portão local", e o teste também roda no job `verificar` da esteira. A frase está certa, só incompleta.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-02-teto-do-e2e-na-esteira.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados/2026-10-02-teto-do-e2e-na-esteira.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml`
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`

## infra-guardian · 2ª rodada · APROVADO · 2026-10-02 08:26:48 · `tasks/correcoes/2026-10-02-teto-do-e2e-na-esteira.md`

```
VEREDITO: APROVADO
Caminho quente tocado: nenhum (esteira e portão; nenhum código de produto)
Rate limit: ok (não tocado)
Fila e prioridade: ok (não tocado)
Concorrência: protegida (não tocado)
Índice e paginação: ok (não tocado)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (o parágrafo do runbook agora diz o limite da guarda e que o sinal de duração não tem quem olhe)
Bloqueantes: nenhum
Recomendações: três, abaixo
```

## O que conferi nesta rodada

- **Correções da 1ª rodada.**
  - Recomendação 1, aplicada: `.github/workflows/ci.yml:73-76` e `docs/runbook.md:642-645` dizem "não cabe nem pela média" e "é piso", e a frase "reprova antes de a esteira cancelar" não aparece mais em nenhum dos três arquivos.
  - Recomendação 3, aplicada: o runbook não tem mais "45 min" nem "40 min"; ficou "5 min do teto" em `docs/runbook.md:646`.
  - Recomendações 2 e 4: sem aplicar, com destino escrito na tabela do documento da correção.
- **Os três textos contra a guarda.**
  - A conta `teto(4 + casos × 6 / 60) ≤ 45` reprova a partir de 411 casos; com reserva de 5 min reprovaria a partir de 361. Os dois números do documento fecham.
  - "Mais que o dobro" confere: 13,9 s contra 5,0 a 5,6 s dá de 2,5 a 2,8 vezes.
  - "Que ninguém confere sozinho" confere: o passo 7 de `.claude/skills/executar-task/SKILL.md:236-251` olha só `status` e `conclusion`.
  - A remissão `"Esteira vermelha no e2e"` do YAML e da mensagem do teste aponta para um título que existe (`docs/runbook.md:620`).
- **YAML.** Parseia sem erro nem aviso. Quatro jobs com os tetos 15, 20, 45 e 45, os mesmos passos de antes, e o passo de publicação do traço intacto.
- **Teste isolado.** `npx vitest run --project unidade tools/ci/esteira.test.ts` passa 10 de 10, com 334 casos listados pelo Playwright.
- **Árvore.** O `git diff --stat` dos três arquivos está igual ao do início (10, 12 e 33 linhas), os md5 não mudaram, e `portao-local.ts conferir` responde válido. Não editei nada.

## Recomendações

1. **O destino `/retro` da A1 chega depois do estouro previsto.** A A1 tem 17 tarefas e o documento estima o teto alcançado entre a 16.0 e a 17.0; o `/retro` vem depois da 17.0. Até lá, a única coisa que avisaria antes do cancelamento é a reserva na guarda, que está como decisão do Joaquim. O destino é aceitável, porque o pior caso é um job cancelado aos 45 min que segura a tarefa seguinte, sem efeito em produto. O relatório deve dizer isso com essas palavras, para a decisão ser tomada sabendo que o `/retro` não cobre a janela.

2. **A linha do job `infra` no `TODO.md` ainda não existe em arquivo nenhum fora do documento da correção.** Não levar o `TODO.md` nesta correção é o certo, porque ele está com alteração da 14.0. O orquestrador deve escrever a linha no commit da 14.0, e não depois: é a próxima vez que o arquivo entra.

3. **`docs/runbook.md:644-645`: "reprova no portão local".** O teste é de unidade e reprova também no job `verificar` da esteira. "No portão local e no `verificar`" seria exato. Só texto.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-02-teto-do-e2e-na-esteira.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados/2026-10-02-teto-do-e2e-na-esteira.md`
