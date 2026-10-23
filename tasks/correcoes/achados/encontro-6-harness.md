# Achados das revisões — `tasks/correcoes/encontro-6-harness.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-23 17:20:11 · `tasks/correcoes/encontro-6-harness.md`

```
VEREDITO: APROVADO
Caminho quente tocado: nenhum (o merge só traz ferramenta de processo e CI: .github/workflows/ci.yml, tools/processo/esteira.ts, nada em apps/ ou packages/)
Rate limit: não se aplica
Fila e prioridade: ok (não toca fila de jobs)
Concorrência: protegida (na esteira, o grupo de `concurrency` do ci.yml usa o `run_id` em develop, release, main e na execução manual, então ali nenhuma execução cancela outra; o cancelamento por push novo vale só em spec/**, correcao/** e PR)
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: não se aplica
Bloqueantes: nenhum
Recomendações:
- O passo de upload do traço do e2e agora roda também em pull_request num repositório público. Hoje está certo porque todo dado do e2e é sintético (o próprio comentário em .github/workflows/ci.yml registra isso). Vale levar esse ponto ao portão da primeira escola real, para que nenhum seed com dado real chegue a esse job.
```

O que conferi no merge (MERGE_HEAD 690e0b4 em spec/harness--l2):
- Os arquivos de código e fixtures que vieram da tarefa 3.0 ficaram idênticos aos da spec. O merge não tocou neles: `.github/workflows/ci.yml`, `tools/processo/esteira.ts`, `tools/processo/esteira.test.ts`, `tools/ci/esteira.test.ts` e os dois arquivos em `tools/processo/__fixtures__/esteira/`. Esse código já passou pela Mesa na linha 1.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/cenarios.md` está sem marcador de conflito. RF1 e RF2 são byte a byte os da spec (só aparecem no diff contra o HEAD) e RF3 é byte a byte o da linha (só aparece no diff contra MERGE_HEAD). Isso bate com o que `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/correcoes/encontro-6-harness.md` declara.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-23 17:20:40 · `tasks/correcoes/encontro-6-harness.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (`conferir` sai 0: typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum
Recomendações:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/achados/indice.md`, as linhas da `3_task` (16:42 a 17:00) ficaram depois das da `6_task` (até 17:10), fora da ordem de horário. Quem lê o índice pela data pode se confundir. É só aparência e não precisa mudar neste merge.

O que conferi:
- **`cenarios.md`, por hash de cada linha da tabela A:** RF1 e RF2 do índice são iguais aos da `MERGE_HEAD` (`spec/harness`), e RF3 é igual ao do HEAD da linha. O ancestral comum (`874fd35`) confirma a causa descrita: a linha não mexeu em RF1 e RF2, e a spec não mexeu em RF3. Não sobrou marcador de conflito em nenhum arquivo do índice.
- **O resto do merge:** comparei a árvore do índice com a que o `git merge-tree` produz sozinho a partir de HEAD e `MERGE_HEAD`. Só diferem o `cenarios.md` sem marcadores e o documento da correção, que é novo. Os arquivos que o git juntou sozinho (`ci.yml`, `esteira.ts`, os testes, `techspec.md`, `tasks.md`, `indice.md`, as fixtures) não foram alterados à mão. O `estado.md` veio inteiro da spec, porque a linha não o mudou desde o ancestral.
- **O que o merge junta:** o código da tarefa 3.0 (`esteira.ts`, `ci.yml`) e o da 6.0 (`linhas.ts`) ficam em arquivos separados, e o portão passou sobre a árvore que o merge deixou.
- **O documento da correção** explica com fundamento o novo slug `encontro-6-harness`: o `encontro-6.md`, de outra spec, foi preservado. Também está justificado por que não há teste que reproduza: é um conflito de texto, sem comportamento novo.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/correcoes/encontro-6-harness.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/cenarios.md`

## test-engineer · 1ª rodada · APROVADO · 2026-10-23 17:21:36 · `tasks/correcoes/encontro-6-harness.md`

VEREDITO: APROVADO

Cenários exigidos: esta correção só resolve um conflito de texto e não traz comportamento novo, então a prova é que o merge está íntegro.
- `cenarios.md` sem marcador de conflito, com RF1 e RF2 iguais aos da spec e RF3 igual ao da linha.
- Nada se perde de nenhum dos dois lados.
- O código que veio da 3.0 continua verde na árvore juntada.
- O código da 6.0 também continua verde.

Cobertos:
- **Nenhum marcador sobrou.** Procurei `<<<<<<<`, `=======` e `>>>>>>>` em `tasks`, `tools` e `.github` no índice e não achei nenhum.
- **RF1 e RF2 vieram da spec.** O `git diff --cached MERGE_HEAD -- tasks/prd-harness/cenarios.md` mostra só a linha do RF3. Então RF1 e RF2 são byte a byte os da `spec/harness`.
- **RF3 veio da linha.** O `git diff --cached HEAD -- tasks/prd-harness/cenarios.md` mostra só RF1 e RF2. Então o RF3 é byte a byte o da 6.0. Isso bate com a causa e a correção descritas em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/correcoes/encontro-6-harness.md`.
- **Nada se perdeu da linha.** O que o índice tem de diferente do `MERGE_HEAD` é exatamente o que a linha mudou desde a base `874fd35`: os mesmos 8 arquivos, com as mesmas contagens, mais o documento desta correção.
- **Nada se perdeu da spec.** O que o índice tem de diferente do `HEAD` é exatamente o que a spec mudou desde a base: os mesmos 13 arquivos, com as mesmas contagens, mais o documento da correção.
- **Os arquivos que só a spec mexeu são idênticos aos dela.** `ci.yml`, `tools/ci/esteira.test.ts`, `esteira.ts`, `esteira.test.ts`, os fixtures, `3_task.md`, `achados/3_task.md` e `estado.md` não diferem do `MERGE_HEAD`.
- **A linha não tocou o `estado.md`.** Ele ficar igual ao da spec está certo.
- **Os testes passam na árvore juntada:**
  - `npx vitest run tools/processo/esteira.test.ts tools/ci/esteira.test.ts`: 38 de 38 verdes.
  - `npx vitest run tools/processo/linhas.test.ts`: 66 de 66 verdes.
  - `esteira.ts` e `linhas.ts` não importam um do outro, então o merge não junta comportamento nenhum.
- **Sem bloco de mutação, e está certo.** Não há cláusula nova de produção no diff da correção: tudo o que entra no código já passou pelo portão e pela Mesa na tarefa de origem (3.0 na linha 1, 6.0 nesta linha).
- **Nenhum `.skip`, mock nem provedor de IA** entra pela correção.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/prd-harness/achados/indice.md`: as seis linhas do `6_task` (16:53 a 17:10) ficaram antes das linhas do `3_task` (16:42), fora da ordem do horário. Não atrapalha a leitura por documento, mas dá para pôr em ordem no próximo toque no arquivo.
- O sufixo `-harness` no slug, para não sobrescrever o `tasks/correcoes/encontro-6.md` de outra spec, está certo e vem explicado na seção "Nota". Vale levar ao `/retro` a ideia de o slug do encontro já nascer com o nome da spec, para a colisão não se repetir.
