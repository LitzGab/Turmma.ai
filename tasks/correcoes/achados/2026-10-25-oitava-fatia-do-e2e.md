# Achados das revisões — `tasks/correcoes/2026-10-25-oitava-fatia-do-e2e.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-25 14:22:05 · `tasks/correcoes/2026-10-25-oitava-fatia-do-e2e.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A correção só muda o número de fatias do e2e (8 em vez de 7) em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/.github/workflows/ci.yml` e em `FATIAS_DO_E2E` de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/processo/esteira.ts`, e a documentação que acompanha (`README.md`, `docs/runbook.md`).

Fora da tabela de dados do docs/lgpd.md: nada. Não há campo, migration, DTO nem entidade nova.

Autorização por objeto: não se aplica. Nenhuma rota, repository ou query foi alterada.

Logs: limpos. Nenhum log novo.

Auditoria: não se aplica. Nenhuma ação da lista do item 10 foi tocada.

Envio externo: nenhum a provedor de IA. O único dado que sai do runner são os artefatos do GitHub Actions, que são públicos porque o repositório é público: `traco-do-e2e-<i>` (só na falha ou no cancelamento) e `censo-do-e2e-<i>` (o relatório JSON da fatia). Os dois ficam 7 dias. A oitava fatia acrescenta um artefato de cada tipo, mas o conteúdo continua o mesmo: sai do mesmo `test-results/` e do mesmo `censo-do-e2e.json`, e o ambiente vem só de `.env.example` e `infra/teste.env`. O que torna essa publicação aceitável continua de pé: os comentários do `ci.yml` e o parágrafo "O artefato é público" do runbook amarram a publicação a todo dado do e2e ser sintético (item 17), e a correção não mudou nada disso.

Seed/fixture: sintético. Esta correção não toca seed nem fixture. O `e2e/aluno-fluxo.spec.ts` alterado na árvore é de outra correção e não foi auditado aqui, como pedido.

Bloqueantes: nenhum.

Recomendações:
- O parágrafo "O artefato é público" do runbook proíbe escrever em `test-results/` qualquer coisa além da saída do Playwright. Ele não diz o mesmo do `censo-do-e2e.json`, que também é público e, segundo o comentário do `ci.yml`, leva `stdout`, `stderr` e `errors` de cada caso. Seria bom estender a frase ao relatório do censo: um `console.log` de fixture com dado real vazaria por ali, inclusive em PR de fork. Não bloqueia, porque o dado do e2e hoje é sintético e esta correção não mexe nisso.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-25 14:22:21 · `tasks/correcoes/2026-10-25-oitava-fatia-do-e2e.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A correção só mexe na configuração da esteira e na documentação. Nenhum código roda em request, fila, sala, prova, IA ou migration.
Rate limit: não se aplica
Fila e prioridade: ok (não se aplica)
Concorrência: protegida (não se aplica)
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok. O alerta "e2e perto do teto" de `tools/ci/e2e.ts` não mudou, e o runbook dele, em "Esteira vermelha no e2e", foi atualizado para oito fatias.
Bloqueantes: nenhum

O total de fatias está em oito nos quatro lugares onde aparece:
- a matriz, o `name` do job e o `--shard` do passo, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/.github/workflows/ci.yml`;
- `FATIAS_DO_E2E`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/processo/esteira.ts:161`.

Rodei `npx vitest run --project unidade tools/ci/esteira.test.ts tools/processo/esteira.test.ts` e deu 56 de 56 verdes, com o teste do teto incluído. Nenhum teste chama provedor pago.

O que sobrou com "7" no repositório é registro histórico e não precisa mudar: correções antigas, o fixture `run-view-jobs-cancelada-por-prazo.json` e os nomes `e2e N/7` usados nos testes de `tools/processo/esteira.test.ts`.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/TODO.md:1584`, item (e): ainda diz "com sete fatias de e2e sobram cerca de 180 casos (cerca de 1379…) até a oitava". Convém atualizar para "oito fatias, 1576 casos, uns 190 de margem até a nona", ou marcar o item como superado por esta correção.
- Se a proteção de branch do GitHub exige `e2e 1/7` a `e2e 7/7` como verificações obrigatórias, a lista precisa passar para `e2e 1/8` a `e2e 8/8`. Isso fica fora do repositório. Sem essa troca, o merge fica esperando para sempre verificações que não rodam mais. O Joaquim precisa conferir antes do próximo merge.
- O censo baixa a lista de artefatos com `per_page=100`. Com duas peças por fatia, a folga ainda é grande, mas se a lista de uma execução passar de 100 itens, o censo vai começar a reportar fatia faltando sem que nenhuma falte.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-25 14:22:27 · `tasks/correcoes/2026-10-25-oitava-fatia-do-e2e.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. É uma correção de esteira, sem seção da Tech Spec envolvida. O que foi feito segue a correção escrita e o remédio do runbook, como na sexta e na sétima fatia.
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)
Bloqueantes: nenhum

O total de fatias passou para oito nos quatro lugares onde aparece: a matriz, o `name` do job e o `--shard` do passo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/.github/workflows/ci.yml`, e a lista `FATIAS_DO_E2E` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/processo/esteira.ts`. O resto do job ficou igual: teto de 45 min, `fail-fast: false` e um artefato por fatia.

As contas do runbook batem com `minutosEstimadosDoE2e`, que arredonda o tempo para cima:
- **Em sete fatias:** 198 casos por fatia dão 27,1 min, arredondados para 28.
- **Em oito fatias:** 173 casos dão 24,2 min, arredondados para 25.
- **Limite:** 197 casos por fatia, ou 1576 no total, uns 192 a mais que hoje.

Fora de `tasks/`, nenhum texto vivo ainda diz "/7" ou "sete fatias". A exceção é o `TODO.md` (abaixo) e as fixtures, que são o registro de uma execução passada e estão certas assim.

Recomendações:
1. `TODO.md:1584`, item (e): ainda diz "com sete fatias de e2e sobram cerca de 180 casos (cerca de 1379…) até a oitava". Isso ficou velho com esta correção. Vale atualizar para oito fatias, 1576 casos e a nona, ou retirar o item.
2. `.github/workflows/ci.yml:99-100`: o comentário da matriz cita só o `--shard` e o `name` como o que tem de acompanhar a lista. O runbook agora fala em quatro lugares, então o comentário deveria citar também `FATIAS_DO_E2E` em `tools/processo/esteira.ts`. Foi esse quarto lugar que a própria correção apontou como fácil de esquecer.
3. `tools/processo/esteira.ts:233`: o comentário diz "com as oito fatias a ler" e vai ficar velho na nona, como o "sete" ficou agora. Melhor "com todas as fatias de `FATIAS_DO_E2E` a ler".
4. Aviso ao Orquestrador: logo depois do merge, a última execução verde terá só sete artefatos `traco-do-e2e-<i>`. Até a primeira execução verde já com oito fatias, o censo responde "incompleto" e aponta a fatia 8 como faltando. É passageiro e não é defeito, mas não deve ser lido como regressão.
5. Continua valendo o que a correção já registra: se a proteção de branch exige `e2e N/7`, a lista precisa passar para `e2e 1/8` a `e2e 8/8` no GitHub. Isso fica fora do repositório.

## test-engineer · 1ª rodada · APROVADO · 2026-10-25 14:22:45 · `tasks/correcoes/2026-10-25-oitava-fatia-do-e2e.md`

VEREDITO: APROVADO

Cenários exigidos (correção de configuração da esteira; não toca dado de escola, permissão nem IA):
- **Caminho feliz:** a suíte de 1384 casos cabe em oito fatias, e a maior fica abaixo de 60% do teto de 45 min.
- **O total de fatias tem de bater nos quatro lugares em que está escrito:** a matriz, o `--shard` do passo e o `name` do job em `ci.yml`, e a lista `FATIAS_DO_E2E` em `tools/processo/esteira.ts`. Se um ficar para trás, um teste tem de ficar vermelho.
- **A matriz é `1..n`, sem buraco nem repetição:** uma fatia que some da matriz é um pedaço da suíte que deixa de rodar sem nenhum vermelho.
- **O censo pede às oito fatias, e não a sete:** com uma lista de sete, ele trataria a oitava como faltando.
- **Nada mais muda no job:** o `fail-fast` continua `false`, o teto de cada fatia continua 45 min e cada fatia continua com o seu artefato.

Cobertos:
- **Caminho feliz:** `tools/ci/esteira.test.ts › o teto do e2e cobre a suíte que existe, fatia a fatia e com folga` (linha 466). Ele conta os casos de cada fatia pelo próprio Playwright, e o vermelho de antes está no documento. Rodei agora e deu 21 de 21 verdes.
- **Matriz contra o `--shard`:** `tem os jobs verificar, integracao, infra e e2e` (linhas 341 a 353). O `/n` esperado sai do tamanho da matriz, então as mutações 1 e 2 chegam à cláusula pelo motivo certo.
- **Matriz contra o `name`:** `o e2e roda em fatias que não se cancelam` (linha 360). Cobre a mutação 3, e o mesmo teste afirma o `fail-fast: false`.
- **Matriz contra `FATIAS_DO_E2E`:** `o relatório do censo sobe também na execução verde` (linha 450). Cobre a mutação 4.
- **Matriz `1..n`:** a função `fatiasDoE2e` (linha 79) é chamada por todas essas guardas.
- **O censo com oito fatias:** `tools/processo/esteira.test.ts` monta as fatias a partir de `FATIAS_DO_E2E`, sem nenhum 7 fixo (linhas 295, 369 e 393). Rodei e deu 35 de 35 verdes.
- **As quatro mutações:** cada uma desfaz um dos quatro lugares e cita o teste que afirma aquele lugar. Nenhum lugar do diff fica sem bloco.
- **As contas do documento conferem:**
  - Em sete fatias: 198 casos, 4 + 198 × 7 s ≈ 27,1 min, arredondado para cima dá 28.
  - Em oito fatias: 173 casos, ≈ 24,2 min, arredondado para cima dá 25.
  - A margem até a nona: 197 × 8 = 1576 casos.
- **Proibidos:** não há `.skip`, `.only`, mock nem chamada de provedor nos testes que a correção afeta.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/TODO.md:1584`, item (e) da validação da X3, ainda diz "com sete fatias de e2e sobram cerca de 180 casos (cerca de 1379…) até a oitava". A oitava chegou, então o item pode ser fechado ou trocado pela margem até a nona (1576 casos). Não bloqueia: é anotação de pendência, não algo que a esteira lê.
- O "e2e 4/7" das fixtures e dos testes de `tools/processo/esteira.test.ts` (linhas 135, 166 e 257 a 261) é histórico, porque são execuções de verdade gravadas. Pode ficar como está. Vale só um comentário curto dizendo que o `/7` ali é da época, para quem procurar sobras de sete fatias depois.
- Fica a cargo do Orquestrador a observação que o próprio documento já faz: se a proteção de branch do GitHub exige `e2e N/7`, essa lista tem de passar a `1/8` a `8/8`, fora do repositório.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-25 14:29:21 · `tasks/correcoes/2026-10-25-oitava-fatia-do-e2e.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações: nenhuma nova. As recomendações da 1ª rodada que não foram aplicadas continuam na tabela "Recomendações sem aplicar" do documento da correção.

Esta rodada auditou só o diff desde a aprovação anterior. A 1ª rodada não exigiu correção, então não havia nada a conferir.

- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/.github/workflows/ci.yml`: a mudança é só no comentário. Os quatro lugares que o comentário diz que precisam andar juntos têm todos 8 fatias: a matriz `fatia: [1..8]` (linha 102), o `--shard=…/8` (linha 120), o `name` `…/8` (linha 93) e `FATIAS_DO_E2E = [1..8]` (`tools/processo/esteira.ts:161`).
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/processo/esteira.ts:233`: a mudança é só no JSDoc. O texto bate com o código, porque a linha 245 de fato percorre `FATIAS_DO_E2E`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/docs/runbook.md`: o parágrafo novo avisa que o artefato `censo-do-e2e-<i>` é público e leva `stdout`, `stderr` e `errors` de cada caso. É texto de operação e não muda comportamento.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-25 14:29:26 · `tasks/correcoes/2026-10-25-oitava-fatia-do-e2e.md`

```
VEREDITO: APROVADO
Campos pessoais tocados: nenhum
Fora da tabela de dados do docs/lgpd.md: nenhum
Autorização por objeto: ok (não há rota, query nem endpoint no diff)
Logs: limpos
Auditoria: presente (nenhuma ação da regra 20 é tocada)
Envio externo: nenhum envio a provedor de IA. O censo-do-e2e.json continua sendo artefato público do CI, com dado sintético, e o runbook agora diz isso
Seed/fixture: sintético
Bloqueantes: nenhum
Recomendações: nenhuma nova
```

Conferi só o que mudou desde a rodada 1, que foi aprovada. O diff na árvore bate com o que você mandou, e nada mudou de comportamento.

- **`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/docs/runbook.md:975-978`**: a recomendação da rodada 1 foi aplicada. O parágrafo "O artefato é público" agora inclui o relatório do censo (`censo-do-e2e-<i>`, o arquivo `censo-do-e2e.json`). Diz que ele também é público, inclusive em pull request de fork, e que leva o `stdout`, o `stderr` e os `errors` de cada caso, de modo que um `console.log` de fixture com dado real vazaria por ali. É o aviso que eu tinha pedido.
- **`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/.github/workflows/ci.yml:99-100`**: só mudou um comentário. Ele passa a citar `FATIAS_DO_E2E` como a quarta coisa que tem de acompanhar o número de fatias. Isso bate com `tools/processo/esteira.ts:161` e com o runbook na linha 967.
- **`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/processo/esteira.ts:233`**: só mudou um JSDoc ("todas as fatias de `FATIAS_DO_E2E`" no lugar de "as oito fatias"). O código continua igual.

Nenhuma correção tinha sido exigida na rodada anterior, então não havia o que cobrar.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-25 14:29:37 · `tasks/correcoes/2026-10-25-oitava-fatia-do-e2e.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

Esta segunda rodada só mexeu em comentário e texto. As duas recomendações que fiz na primeira rodada e a do `privacy-guardian` foram aplicadas como pedido:
- **`ci.yml`:** o comentário da matriz agora lembra de mexer junto em três lugares: o `--shard`, o `name` do job e a lista `FATIAS_DO_E2E` (definida em `tools/processo/esteira.ts:161`).
- **`esteira.ts:233`:** o JSDoc do censo cita `FATIAS_DO_E2E` em vez de "oito fatias", então não vai envelhecer quando entrar a nona.
- **`docs/runbook.md`:** o texto agora diz que o relatório do censo (`censo-do-e2e-<i>`) também é público, inclusive em pull request de fork, e que um `console.log` de fixture com dado real vazaria por ali.

O documento ganhou a tabela "Recomendações sem aplicar" (linhas 116 a 124). Cada linha tem destino ou motivo. Três pontos dela valem sua atenção:
- **`TODO.md:1584`:** o item ainda fala em sete fatias. Atualizar fica com o Orquestrador, no próximo commit de documento dele.
- **Proteção de branch no GitHub:** se ela exige `e2e 1/7` a `e2e 7/7`, o merge vai esperar para sempre por verificações que não rodam mais. A troca para `1/8` a `8/8` é sua (Joaquim) e tem de ser feita antes do próximo merge.
- **Comentário em `esteira.test.ts`:** a recusa tem motivo aceitável. O arquivo não é desta correção e o próprio revisor disse que podia ficar como está.

Recomendações:
- Feche o item (e) de `TODO.md:1584` no mesmo pouso desta correção, para que o número de fatias não fique errado em dois lugares.
- Logo depois do merge, o censo vai responder "incompleto" até a primeira execução verde com oito fatias. O aviso ao Orquestrador precisa dizer isso, para ninguém tratar como defeito.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/correcoes/2026-10-25-oitava-fatia-do-e2e.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/.github/workflows/ci.yml
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/docs/runbook.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/processo/esteira.ts

## test-engineer · 2ª rodada · APROVADO · 2026-10-25 14:29:49 · `tasks/correcoes/2026-10-25-oitava-fatia-do-e2e.md`

VEREDITO: APROVADO

**Cenários exigidos.** Os mesmos da 1ª rodada, que foi aprovada. Os quatro lugares que dizem o número de fatias precisam dizer o mesmo: a matriz `fatia` do `ci.yml`, o total do `--shard`, o total do `name` do job e a lista `FATIAS_DO_E2E` de `tools/processo/esteira.ts`. Com a oitava fatia, o teto de cada fatia continua abaixo de 60%. E o censo só sai com todas as fatias de `FATIAS_DO_E2E` lidas.

**Cobertos.**
- O diff desta rodada só mexe em comentário e texto, e não muda comportamento:
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/.github/workflows/ci.yml`: o comentário da matriz agora cita `FATIAS_DO_E2E`.
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/processo/esteira.ts`: o JSDoc de `fazerOCenso` diz "todas as fatias de `FATIAS_DO_E2E`" em vez de "as sete fatias".
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/docs/runbook.md`: novo parágrafo avisando que o relatório `censo-do-e2e-<i>` é público, inclusive na execução de pull request de fork.
- Conferi no `git diff` que os quatro lugares dizem 8: matriz `[1..8]`, `--shard=.../8`, `name: e2e .../8` e `FATIAS_DO_E2E = [1..8]`.
- `npx vitest run tools/ci/esteira.test.ts` passou: 21 de 21. Esse teste confere que a matriz do `ci.yml` e a `FATIAS_DO_E2E` batem e refaz a conta do teto por fatia.
- As três recomendações aplicadas estão no diff. A que recusei foi a do comentário em `esteira.test.ts`, que ficou registrada com motivo na tabela "Recomendações sem aplicar" do documento. Aceito a recusa, porque era só recomendação.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova.
