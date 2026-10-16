# Achados das revisões — `tasks/correcoes/2026-10-16-sexta-fatia-do-e2e.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-16 16:15:16 · `tasks/correcoes/2026-10-16-sexta-fatia-do-e2e.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/docs/runbook.md:872-874`: o parágrafo da quinta fatia dá a conta das duas situações nas duas configurações: 776 e 818 casos, em quatro e em cinco fatias. O da sexta só dá os 167 por fatia dos 1002 casos. Falta a conta dos 990 commitados em seis fatias: 165 por fatia, uns 23 min. Acrescentar deixa os dois registros iguais.
- No documento da correção, as linhas 75 a 77 dizem que a folga vai até 197 casos por fatia, uns 1182 no total. Pela fórmula, `4 + 197 × 7 s` dá 26,98 min, quase em cima do limite de 27, e não com folga. Vale escrever que é o limite, para ninguém ler os 1182 como margem confortável.

Conferi estes pontos:
- **Diff:** só os três lugares do `ci.yml` em que aparece o total de fatias mudaram: a matriz, o `name` e o `--shard`. O README e o runbook foram ajustados juntos.
- **Sobras de "/5":** procurei com `git grep` em todo o repositório, menos `tasks/correcoes`. Não sobrou "/5" nem "cinco fatias" fora do trecho histórico do runbook.
- **Mutações:** as três citam testes que existem em `tools/ci/esteira.test.ts`, nas linhas 123 e 135. Esses testes calculam o total a partir de `fatiasDoE2e().length`, então cada mutação os deixa vermelhos.
- **Contas:** batem. Os 990 casos em cinco fatias dão 198 por fatia, uns 27,1 min, acima do limite de 27. Os 1002 em seis dão 167 por fatia, uns 23,5 min.
- **Remédio:** é o que o runbook manda. O `timeout-minutes` e as constantes de `tools/ci/prazo-do-e2e.ts` não foram mexidos.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-16 16:15:26 · `tasks/correcoes/2026-10-16-sexta-fatia-do-e2e.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A correção mexe só na esteira (`ci.yml`) e na documentação, e não muda login, tutor, sala, prova, fila, IA, migration nem deploy.
Rate limit: ok (não foi tocado)
Fila e prioridade: ok (não foi tocada)
Concorrência: protegida. Não há operação nova que possa rodar duas vezes ao mesmo tempo. As fatias continuam independentes, com `fail-fast: false` e o artefato `traco-do-e2e-<i>` com nome próprio em cada uma.
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok. Nenhum alerta novo. A seção "Esteira vermelha no e2e" do runbook foi atualizada para seis fatias e `<i>/6`, com a data e a conta.
Bloqueantes: nenhum

**Conferido:**
- `npx vitest run --project unidade tools/ci/esteira.test.ts` passou em 11 de 11. A guarda que estava vermelha antes da correção é "o teto do e2e cobre a suíte que existe, fatia a fatia e com folga".
- A conta do documento fecha: 1002 casos em 6 fatias dão 167 por fatia, ou seja, 4 + 167 × 7 s, uns 23,5 min. O limite é de 27 min, 60% do teto de 45.
- O teto de cada fatia continua em 45 min e as constantes de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tools/ci/prazo-do-e2e.ts` não mudaram. É o remédio que o runbook manda: acrescentar fatia, não subir o teto.
- O total de fatias aparece em três lugares de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/.github/workflows/ci.yml`: a matriz, o `name` do job e o `--shard` do passo. Os três estão iguais, e as três mutações do documento atacam um lugar cada, com a guarda correspondente.
- `tools/processo/esteira.ts` não depende do nome do job do e2e. A única menção restante a "cinco fatias" fica em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/docs/runbook.md:873`, na parte histórica, e está correta ali.

Recomendações:
- Se o GitHub exige `e2e 1/5` a `e2e 5/5` como verificação obrigatória na proteção de alguma branch, troque essa lista para `1/6` a `6/6` antes do primeiro merge depois do pouso. Senão o merge fica esperando uma verificação que não roda mais. Não dá para ver essa configuração pelo repositório.
- A frase do runbook "em cinco fatias eram 198 por fatia (...) e 201" ficaria mais clara assim: "198 só com o commitado, 201 com a 2.0".

## test-engineer · 1ª rodada · APROVADO · 2026-10-16 16:15:38 · `tasks/correcoes/2026-10-16-sexta-fatia-do-e2e.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** a matriz passa a seis fatias, e cada fatia fica em até 60% do teto de 45 min. Isso vale para os 990 casos já commitados e para os 1002 com a 2.0 de `telas-da-coordenacao`.
- **Borda 1:** a matriz cresce, mas o `--shard=…/n` do passo fica no total antigo. Assim uma fatia da suíte não roda e nada fica vermelho.
- **Borda 2:** o `name` do job fica no total antigo. Os jobs aparecem com rótulo errado e não se sabe qual fatia falhou.
- **Borda 3:** a matriz tem buraco ou repetição.
- **Borda 4:** a correção desce sozinha, sem a 2.0. Com 990 casos ela tem de continuar verde, e continua: 165 por fatia.
- **Permissão e isolamento de escola:** não se aplicam, porque a mudança é só na configuração da esteira.
- **Concorrência:** não se aplica. Fatias em paralelo já existiam, com `fail-fast: false`.

**Cobertos:**
- **A conta do teto:** `tools/ci/esteira.test.ts:199`, "o teto do e2e cobre a suíte…", conta os casos de cada fatia pelo próprio Playwright (`--shard=i/n`) e compara com o limite. Ele não mede o relógio da máquina, então não depende de ela estar folgada. Rodei `npx vitest run --project unidade tools/ci/esteira.test.ts` agora: 11 de 11 verdes.
- **Mutação 1,** matriz de volta a `[1..5]` com o resto em `/6`: cai em `esteira.test.ts:129`, que exige `--shard=…/${fatiasDoE2e().length}`. O passo diz `/6` e a matriz tem 5, então fica vermelho pelo motivo certo.
- **Mutação 2,** passo de volta a `/5` com a matriz em 6: mesma asserção, linha 129, vermelho pelo motivo certo.
- **Mutação 3,** `name` de volta a `/5`: cai em `esteira.test.ts:140`, `toContain('${{ matrix.fatia }}/6')`, vermelho pelo motivo certo.
- **Matriz `1..n` sem buraco:** já existe uma guarda para isso, `fatiasDoE2e` (linhas 67–90), e esta correção não a alterou.
- **Lugares do diff:** os três lugares em que o total de fatias aparece no `ci.yml` têm cada um o seu bloco de mutação, e nenhuma cláusula ficou sem bloco. As mudanças no README e no runbook são só texto. O `timeout-minutes` e as constantes de `tools/ci/prazo-do-e2e.ts` não mudaram.
- **Proibidos:** não há `.skip`, teste comentado nem mock. A guarda lê o `ci.yml` real e pergunta ao Playwright real.
- **Restos de "cinco fatias" ou `/5`:** procurei com `git grep` e só sobra registro histórico. São o parágrafo da quinta fatia em `docs/runbook.md` e os achados e correções antigos.

**Bloqueantes:** nenhum.

**Recomendações:**
1. A guarda que reproduz o sintoma, o teste do teto, não tem bloco de mutação próprio. Isso não bloqueia, porque a mutação 1 também o deixa vermelho (198 por fatia com cinco). Mas um bloco apontando esse teste para a matriz de volta a 5 deixaria escrito que é ele que pega o tamanho da suíte, e não só a coerência entre `/n` e a matriz.
2. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/docs/runbook.md:872-874`, o parágrafo da sexta dá a conta em seis fatias só para os 1002 casos (167). Falta a dos 990 commitados (165), que o parágrafo da quinta dava nas duas situações. É só texto.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/.github/workflows/ci.yml`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/README.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/docs/runbook.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/correcoes/2026-10-16-sexta-fatia-do-e2e.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tools/ci/esteira.test.ts`

## infra-guardian · 2ª rodada · APROVADO · 2026-10-16 16:24:05 · `tasks/correcoes/2026-10-16-sexta-fatia-do-e2e.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum (só a esteira de CI: `.github/workflows/ci.yml`, sem mudança desde a 1ª rodada; nesta rodada mudaram só o runbook e o documento da correção)
Rate limit: ok (não se aplica, nada de runtime foi tocado)
Fila e prioridade: ok (não se aplica)
Concorrência: protegida (não se aplica)
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok. O parágrafo "Esteira vermelha no e2e" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/docs/runbook.md` (linhas 870 a 875) tem os números certos:
- 990 casos em 5 fatias dão 198 por fatia; 1002 em 5 dão 201 na maior.
- 990 em 6 dão 165; 1002 em 6 dão 167.
- Em 5 fatias passa de 27 min, que é 60% do teto de 45. Em 6 fica em uns 24 min.
- Com o `Math.ceil` de `tools/ci/prazo-do-e2e.ts:28`, o limite de 197 casos por fatia do documento está certo: 197 casos dão 26,98, que arredonda para 27 e passa. 198 dão 27,1, que vira 28 e reprova.

Bloqueantes: nenhum.

Conferência das recomendações da 1ª rodada:
- **Quarta mutação (matriz `[1..6]` → `[1..5]`, provada pelo teste "o teto do e2e cobre a suíte que existe", `tools/ci/esteira.test.ts:199`).** Ela é efetiva. A matriz em cinco faz o teste repartir em `--shard=<i>/5`, e as fatias ficam com 198 casos (só a suíte commitada) a 201 (com o e2e da 2.0 na árvore). Isso dá 28 min contra o limite de 27 em qualquer dos dois estados da árvore, então o teste fica vermelho.
- **Runbook.** A frase de 198 e 201 está desambiguada, e a conta dos 990 entrou.
- **Documento da correção.** "Folga" foi trocada por "limite". O texto agora diz que 197 casos por fatia não é margem: é o ponto em que a sétima fatia passa a ser pedida.
- **Recomendação do GitHub.** Ficou sem aplicar e foi registrada com destino na tabela "Recomendações sem aplicar" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/correcoes/2026-10-16-sexta-fatia-do-e2e.md`: o Orquestrador e o Joaquim conferem antes do pouso. Se a proteção de branch exige `e2e 1/5` a `e2e 5/5`, o merge fica esperando uma verificação que não roda mais. Isso não se vê pelo repositório e não bloqueia a correção.

Recomendações: nenhuma nova.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-16 16:24:10 · `tasks/correcoes/2026-10-16-sexta-fatia-do-e2e.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. É uma correção da esteira e não tem seção de Tech Spec. Ela segue o remédio que `docs/runbook.md` já define em "Esteira vermelha no e2e": acrescentar uma fatia, sem subir o `timeout-minutes` e sem mexer nas constantes de `tools/ci/prazo-do-e2e.ts`.
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/correcoes/2026-10-16-sexta-fatia-do-e2e.md`, parágrafo antes da quarta mutação: o texto diz que, com a matriz em cinco, o teto "dá 198 casos por fatia". O teste do teto conta pelo Playwright o que está na árvore (`tools/ci/esteira.test.ts:208`). Com o e2e da 2.0 ainda sem commit, o portão aplicou a mutação sobre 1002 casos, ou seja, 201 por fatia. A mutação fica vermelha nos dois casos e o mérito não muda. Vale escrever "198 só com o commitado, 201 com a 2.0 na árvore", como o runbook já faz.

As duas correções da rodada anterior foram feitas:
- **A conta do runbook fecha.** 990 / 6 = 165 e 1002 / 6 = 167. Os "uns 24 min" usam o mesmo arredondamento para cima das fatias anteriores. A frase de 198 e 201 agora diz qual número vem de quê.
- **A quarta mutação vale.** O teste do teto calcula o `/n` pelo tamanho da matriz, em `indices.length` (`tools/ci/esteira.test.ts:208`), e não pelo `/6` do passo. Por isso, desfazer só a matriz deixa esse teste vermelho, como o documento afirma.

`ci.yml` e `README.md` não mudaram desde a rodada aprovada. A recomendação do GitHub que ficou sem aplicar tem destino registrado (Orquestrador e Joaquim, antes do pouso de `telas-da-coordenacao`).

## test-engineer · 2ª rodada · APROVADO · 2026-10-16 16:24:30 · `tasks/correcoes/2026-10-16-sexta-fatia-do-e2e.md`

VEREDITO: APROVADO

Cenários exigidos:
- Caminho feliz: a suíte de 1002 casos, dividida em seis fatias, cabe no limite de 27 min (60% do teto de 45).
- Borda 1: só o que já está commitado (990 casos) já estourava cinco fatias, com 198 por fatia.
- Borda 2: a matriz, o `/n` do passo e o `/n` do `name` do job ficam desencontrados.
- Permissão e isolamento: não se aplicam. A correção só mexe em configuração da esteira e em texto, sem dado de escola.

Cobertos:
- **O quarto bloco de mutação chega ao teste certo.** Ele volta a matriz para `[1, 2, 3, 4, 5]` e deixa o `/6` onde estava. O teste do teto (`tools/ci/esteira.test.ts:199`) calcula o total de fatias pelo tamanho da matriz (linhas 202 e 208), e não pelo `/6` do passo. Com a mutação, ele divide a suíte em `--shard=<i>/5`, dá de 198 a 201 casos por fatia e fica acima do limite de 197 na linha 217. Fica vermelho pelo motivo do sintoma, e não por acaso. O nome do teste no bloco é o começo do nome completo, do mesmo jeito que nos três primeiros blocos.
- **As contas do runbook e do documento conferem:**
  - 990/6 = 165 e 1002/6 = 167, como diz a frase nova de `docs/runbook.md`.
  - `4 + 197 × 7 s` = 26,98 min.
  - 198 e 201 casos dão "uns 28 min" pelo arredondamento para cima que a guarda usa.
  - A frase de 198/201 agora diz qual número é só o commitado e qual inclui a 2.0.
- **O termo ficou certo.** "limite" no lugar de "folga", e o texto diz que 197 é o ponto em que a sétima fatia passa a ser pedida.
- **A recomendação que ficou de fora tem destino.** A proteção de branch do GitHub está registrada na tabela "Recomendações sem aplicar", com o motivo e o destino.
- **A guarda está verde.** Rodei `npx vitest run --project unidade tools/ci/esteira.test.ts` agora: 11 de 11.
- **Nada escondido.** Não há `.skip`, mock, provedor pago nem chamada concorrente envolvidos.

Bloqueantes: nenhum.

Recomendações:
- `tasks/correcoes/2026-10-16-sexta-fatia-do-e2e.md:106`: o parágrafo antes do quarto bloco diz "dá 198 casos por fatia". Esse número vale só para o commitado. Com a 2.0 na árvore, que é como o portão roda agora, a fatia 1 tem 201 casos. O vermelho sai do mesmo jeito; vale escrever "198 a 201 casos" para bater com a frase do runbook.
