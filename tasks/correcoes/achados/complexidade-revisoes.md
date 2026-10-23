# Achados das revisões — `tasks/correcoes/complexidade-revisoes.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-23 15:50:16 · `tasks/correcoes/complexidade-revisoes.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/revisoes.ts`: os nomes `levarOQueOCommitDaTodos` e `levarOQueOAddPrepara` são difíceis de ler. Nomes como `levarOsDoAdd` e `levarTodosSeCommitA` dizem a mesma coisa de forma mais curta. Na 2.0 eles mudam de módulo, e é a hora barata de trocar.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/revisoes.ts:1191` e `:1121`: o `portao` chama `pastaDoCommit` duas vezes, uma em `bloqueioAntesDaArvore` e outra dentro de `arvoreDoCommit`. Isso já existia antes desta correção e ela não piorou, mas a 2.0, ao montar o `portao.ts`, pode passar o resultado adiante em vez de calcular de novo.
- O `cenarios.md` não diz nada sobre esta correção. Não bloqueia, porque o comportamento não muda e a divergência já está registrada no §2 da `techspec.md` (`0ed2f7d`).

O que conferi:
- **Só extração.** Em `lerSecao`, `arquivosDoCommit`, `pastaDoCommit` e `portao`, o diff só move texto para funções auxiliares. A ordem dos bloqueios é a mesma e as mensagens são idênticas. Em `pastaDoCommit`, a linha `let pasta` subiu duas linhas, sem efeito.
- **Poda e teto no mesmo commit.** O `eslint-suppressions.json` perde só a entrada `tools/processo/revisoes.ts` (`complexity: 4`), e o `TETO.complexity` do `catraca.test.ts` desce de 248 para 244.
- **Mutações.** Cada trecho das seis mutações bate com uma linha só do corpo novo. A linha 1121 contém `'indeterminado' in onde`, mas não o texto completo da mutação.
- **Tech Spec.** O §2 registra a correção antes da partição, com as quatro funções, o teto de 248 para 244 e a catraca sem afrouxar. Bate com o documento da correção.
- **Carimbo.** O `conferir` deu "portão local válido para o código atual": typecheck, lint, segredo, dependências, unidade e alvo.

## test-engineer · 1ª rodada · APROVADO · 2026-10-23 15:51:07 · `tasks/correcoes/complexidade-revisoes.md`

VEREDITO: APROVADO

**Cenários exigidos:**

Esta correção é uma refatoração sem mudança de comportamento. Os cenários de escola (transferência, concorrência, isolamento) não se aplicam a ela. O que precisava ser provado:
- **(a) Regressão da catraca:** a soma por regra bate com o `TETO` novo (244), e o lint passa sem a supressão de `tools/processo/revisoes.ts`. Isso prova que nenhuma das quatro funções passa mais de complexidade 10.
- **(b) Comportamento igual:** `revisoes.test.ts` e `hook-portao.test.ts` ficam sem alteração e continuam verdes.
- **(c) Mutações:** cada uma das quatro funções reescritas tem uma mutação num ramo do corpo novo, que deixa um caso existente vermelho.

**Cobertos:**
- **(a)** `tools/guardas/catraca.test.ts:39` (o caso "cita só as quatro regras de tamanho, e a soma por regra é o TETO") e `:203` (o lint verde com a linha de base) cobrem a regressão. Se a supressão voltasse ou se alguma das quatro funções passasse de 10 de novo, o lint cairia, porque a entrada saiu do `eslint-suppressions.json`. O TETO desceu de 248 para 244 no mesmo diff da poda.
- **(b)** `git diff HEAD` não mostra alteração nos dois arquivos de teste. Rodei `npx vitest run` nos três arquivos: 110 casos verdes.
- **(c)** Conferi cada uma das seis mutações contra o diff e contra o teste que ela cita. Cada trecho mutado aparece uma vez só no arquivo e fica num corpo extraído:
  - **Cerca no corpo da seção:** a mutação está em `lerOCorpoDaSecao`, `revisoes.ts:514`, e derruba `revisoes.test.ts:1184`/`:1197`.
  - **`-a` do `git commit`:** a mutação está em `levarOQueOCommitDaTodos`, e derruba `revisoes.test.ts:687`.
  - **Caminho do `cd`:** a mutação está em `variaveisECaminhosDosTrechos`, `revisoes.ts:1078`, e derruba `revisoes.test.ts:1368`.
  - **Variável que o hook não conhece:** a mutação está em `bloqueioAntesDaArvore`, `revisoes.ts:1191`, e derruba `revisoes.test.ts:1408`. A ocorrência parecida em `:1121` tem outro texto (`!onde || 'indeterminado' in onde`), então não confunde.
  - **Commit que não leva código:** a mutação está em `bloqueioDoCommitSemDocumento`, `revisoes.ts:1205`. Sem a linha, o commit só de `docs.md` cai na mensagem de bloqueio, e `revisoes.test.ts:571` fica vermelho.
  - **Conferência a mais do documento:** a mutação está em `bloqueioDoDocumento`, `revisoes.ts:1240`, e derruba o trecho de `revisoes.test.ts:429`.
- Não há `.skip`, mock nem chamada a provedor de IA. Concorrência não se aplica.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Quatro trechos movidos ficaram sem mutação própria. Eles não são cláusulas novas, e os testes existentes cobrem cada um:
   - `corpoDaSecao`, incluindo o caso da linha em branco que encerra o parágrafo solto;
   - `levarOQueOAddPrepara`, coberto por `revisoes.test.ts:685`, `:686` e `:689`;
   - o ramo `estranho` de `bloqueioAntesDaArvore`, coberto por `revisoes.test.ts:1390`;
   - o ramo do `(mvp: …)` em `bloqueioDoCommitSemDocumento`, coberto por `revisoes.test.ts:592-672`.

   Se a 2.0 levar esses auxiliares para os módulos novos, vale uma mutação por auxiliar no documento dela, já que lá o caminho do arquivo muda.
2. O documento diz "Uma por função", mas são seis mutações, três delas em `portao`. Ajustar para "pelo menos uma por função" deixaria a seção mais clara.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/correcoes/complexidade-revisoes.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/revisoes.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/guardas/catraca.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/eslint-suppressions.json`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tools/processo/revisoes.test.ts`
