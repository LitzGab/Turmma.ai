# Achados das revisões — `tasks/correcoes/poda-supressao-orfa.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-23 00:39:46 · `tasks/correcoes/poda-supressao-orfa.md`

VEREDITO: APROVADO

**Cenários exigidos.** Isto é uma correção de configuração. Não há regra de negócio nem dado de escola envolvido, então os casos de borda escolares, de isolamento e de permissão não se aplicam. O que precisa ser provado:
1. O `npm run lint` volta a ficar verde depois de remover a supressão de `tools/ci/compose.ts`, que não era mais usada.
2. A catraca continua igual à soma: o `TETO` de `complexity` desce de 249 para 248 no mesmo commit.
3. Se a entrada voltasse, o lint e a catraca ficariam vermelhos de novo.
4. Nenhum outro arquivo ganhou supressão desde o HEAD.

**O que está coberto.** Rodei `npx vitest run tools/guardas/catraca.test.ts` e os 18 testes passaram.
- Cenário 1: `npm run lint está verde com a linha de base` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/catraca.test.ts:203`). Ele roda o `npm run lint` de verdade. Ficou verde agora e estava vermelho no HEAD, que é o sintoma descrito na tarefa.
- Cenário 2: `cita só as quatro regras de tamanho, e a soma por regra é o TETO` (`catraca.test.ts:39`). Ele confere a soma, agora 248, contra o `TETO` da linha 14.
- Cenário 3: com a entrada de volta, a soma passaria a 249. Os testes das linhas 39 e 46 dariam "complexity: 249 supressões, o TETO é 248", e o lint daria "suppressions left that do not occur anymore". As duas falhas apontam diretamente para o que esta correção muda.
- Cenário 4: `nenhum arquivo ganhou supressão desde o HEAD` (`catraca.test.ts:45`) passou.

**Diff.** São duas mudanças, e o documento descreve as duas:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/eslint-suppressions.json` perde exatamente as cinco linhas de `tools/ci/compose.ts`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/catraca.test.ts:14` troca `complexity: 249` por `248`.

**Mutações.** A seção "Nenhuma cláusula nova" está correta: o diff só tira uma linha da base e baixa o `TETO` para acompanhar. Não há lógica nova que precise de um bloco de mutação, e o teste da catraca já é a prova, porque fica vermelho se a entrada voltar.

**Outras verificações.** Não há `.skip`, teste comentado nem mock. A tarefa não envolve IA nem concorrência. Procurei no repositório inteiro e nenhum outro arquivo ainda cita o teto de 249.

Bloqueantes: nenhum.

Recomendações:
- Para o `/retro`: a causa desta correção foram duas linhas de construção, a 13.0 e a 90.0, que estavam verdes cada uma no próprio portão, mas cuja junção (o merge `2b68e74`) deixou o lint vermelho. Vale estudar se o encontro das linhas (`tools/processo/linhas.ts`) deveria rodar `npm run lint` logo depois do merge, para pegar uma supressão sem uso antes da validação.
