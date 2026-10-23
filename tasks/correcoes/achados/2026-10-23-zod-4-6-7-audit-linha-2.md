# Achados das revisões — `tasks/correcoes/2026-10-23-zod-4-6-7-audit-linha-2.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-23 18:24:33 · `tasks/correcoes/2026-10-23-zod-4-6-7-audit-linha-2.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A troca de versão de dependência alcança a validação de entrada em API, worker e realtime, mas nenhum código de rota, fila, IA ou migration mudou.
Rate limit: ok (não mudou)
Fila e prioridade: ok (não mudou)
Concorrência: protegida (não mudou)
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica)
Bloqueantes: nenhum
Recomendações:
- Os 8 arquivos em revisão são iguais, byte a byte, aos de `bd292fb`, que já passou pelas três revisões da linha 3. Conferi cada um pelo hash.
- O `node_modules/zod` instalado está na 4.6.7. A cópia em `node_modules/knip/node_modules/zod` saiu, e o `npm audit --audit-level=high --omit=dev` termina com `found 0 vulnerabilities`.
- Na hora do commit, mande só o que está no índice (`git diff --cached`). A árvore tem `knip.json`, `tools/processo/*` e `tasks/prd-harness/*`, que são da 10.0, e nenhum deles pode entrar neste commit. Ficam de fora, como a seção "Fora desta correção" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/correcoes/2026-10-23-zod-4-6-7-audit-linha-2.md` já diz.
- O aviso GHSA-mrhx-c7xc-m3w5 trata de memória esgotada ao validar coleções grandes com `.max()`. A 4.6.7 resolve, mas continua valendo ter limite de tamanho do corpo HTTP antes do `ZodValidationPipe`, para que um aviso igual no futuro não derrube a API das 10h. Se isso não estiver garantido, vale um item no `TODO.md`.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-23 18:24:36 · `tasks/correcoes/2026-10-23-zod-4-6-7-audit-linha-2.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. É uma correção de dependência, sem arquitetura envolvida. O documento cita a origem (`bd292fb`, linha 3) e separa o que é da 10.0 na seção "Fora desta correção".

Portão local: carimbo válido. O `conferir` respondeu "portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)", e a suíte `dependencias` é justamente a que reprovava.

Bloqueantes: nenhum.

O que conferi:
- O que está staged é só a troca do `zod` de `4.6.4` para `4.6.7`, com versão exata, nos sete `package.json` que o declaram: a raiz, `apps/api`, `apps/despachante`, `apps/realtime`, `apps/worker`, `packages/nucleo` e `packages/shared`. Nenhuma outra linha desses arquivos mudou, e nenhum workspace ficou com a versão antiga.
- O `package-lock.json` staged é byte a byte o de `bd292fb`: o hash do git é o mesmo nos dois, `019c1a85ba72…`. A diferença no lock é só o `zod`: o `node_modules/zod` sobe para 4.6.7 e a cópia aninhada `node_modules/knip/node_modules/zod` sai.
- Nenhuma mudança da 10.0 entrou no commit. `knip.json`, `tools/*` e `tasks/prd-harness/*` estão só no working tree, fora do que vai ser commitado.

Recomendações:
- Quando a linha 3 juntar com a linha 2 no encontro, a mesma mudança chega pelas duas. O documento já prevê que não dá conflito, e o hash idêntico do lock confirma. Não precisa fazer nada além de não aplicar a versão duas vezes à mão.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/correcoes/2026-10-23-zod-4-6-7-audit-linha-2.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/package-lock.json

## test-engineer · 1ª rodada · APROVADO · 2026-10-23 18:24:41 · `tasks/correcoes/2026-10-23-zod-4-6-7-audit-linha-2.md`

VEREDITO: APROVADO

**Cenários exigidos:** esta correção só troca a versão do `zod`, de 4.6.4 para 4.6.7, nos sete `package.json` e no lock. Não muda regra de negócio, então não há caminho feliz, caso de borda do domínio, caso de permissão ou caso de isolamento a provar. O que precisa ser provado:
- o aviso GHSA-mrhx-c7xc-m3w5 deixa de reprovar o `npm audit --audit-level=high --omit=dev`;
- nenhum lugar do repositório continua declarando a versão antiga;
- o lock fica coerente com os sete `package.json`.

**Cobertos:**
- **A guarda faz o papel do teste.** O "teste que reproduz" é a `guarda:dependencias` (`npm audit --audit-level=high --omit=dev`), que o portão da tarefa e a esteira já rodam. Ela fica vermelha com a 4.6.4 e verde com a 4.6.7: se a versão voltasse, a guarda falharia. Para uma troca de dependência sem código nosso, esse é o teste adequado. Não há cláusula nova no diff, então a falta de uma seção "Mutações" não é bloqueante.
- **Nenhuma versão antiga sobrou.** O `git grep "4.6.4"` em `package.json` e `package-lock.json` não encontra nada. A troca está completa nos sete manifestos: a raiz, `apps/api`, `apps/despachante`, `apps/realtime`, `apps/worker`, `packages/nucleo` e `packages/shared`. A versão continua exata, sem `^`.
- **O lock está coerente.** `node_modules/zod` passa a 4.6.7, com a integridade da 4.6.7. A cópia aninhada `node_modules/knip/node_modules/zod`, que já era 4.6.7, sai porque a versão de cima agora serve a todos. Nenhum outro pacote mudou no lock.
- **É a mesma mudança da linha 3.** `git diff --cached bd292fb -- package.json package-lock.json apps packages` sai vazio: o que está em revisão é byte a byte igual ao `bd292fb`, que já foi aprovado na linha 3. Isso confirma o que o documento diz sobre o merge sem conflito.
- **Nada esconde a regra.** Não há `.skip`, teste comentado nem mock, e não há código de teste no diff.

**Bloqueantes:** nenhum.

**Recomendações:**
- No "Teste que reproduz", em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l2/tasks/correcoes/2026-10-23-zod-4-6-7-audit-linha-2.md:43-51`, vale escrever que essa conferência é a mesma que o `portao-local.ts --tarefa` roda antes do carimbo. Assim fica claro para o `/validar` que a prova roda antes do commit e não só na esteira.
- Para o `/retro`: o mesmo aviso de segurança precisou de uma correção em cada linha (`bd292fb` na linha 3, esta na linha 2). Se outras linhas abertas ainda tiverem o `zod` 4.6.4, vão parar no mesmo ponto do portão. Vale registrar que esse tipo de correção pode subir para a `spec/harness` e chegar às linhas pelo encontro, em vez de ser refeita em cada uma.
