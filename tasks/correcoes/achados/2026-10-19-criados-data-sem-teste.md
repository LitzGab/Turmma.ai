# Achados das revisões — `tasks/correcoes/2026-10-19-criados-data-sem-teste.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-19 16:30:05 · `tasks/correcoes/2026-10-19-criados-data-sem-teste.md`

VEREDITO: APROVADO

**Cenários exigidos:** o problema era que, se a data e a hora sumissem da linha de cada documento em Criados (RF12, C2 da validação), nenhum teste ficava vermelho. A correção pede três coisas. Primeiro, um teste que fique vermelho se a data sair da linha. Segundo, cada linha tem de mostrar a data do próprio documento, e não a de outro: as fixtures antigas tinham todas a mesma `criadoEm`, então uma data trocada entre linhas passava sem ninguém ver. Terceiro, o teste tem de passar em qualquer fuso do computador que o roda. Permissão e isolamento não se aplicam: a correção só exibe um campo que já vinha no DTO, e nenhuma regra de acesso mudou.

**Cobertos:**
- O caso novo fica em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Criados.test.tsx:182-198`. Ele monta dois documentos na mesma turma, com `criadoEm` a um mês de distância, e confere nos dois sentidos: cada linha contém a própria data e não contém a do outro. Com isso, ficam vermelhos tanto a remoção da data quanto uma troca entre linhas ou uma data fixa.
- O teste compara com o mesmo `formatarDataHora` que a tela usa, e o mês de distância deixa o texto diferente em qualquer fuso. Se o formatador quebrasse e devolvesse texto vazio, o `not.toContain('')` falharia, então o teste não passa à toa.
- A mutação do documento corresponde ao trecho real de produção, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Criados.tsx:214`. A data está dentro do link da `Linha` (prop `abaixo`), então a busca pelo papel `link` alcança o texto. O portão da tarefa provou a mutação e o carimbo é válido.
- Rodei `npx vitest run apps/web/src/areas/professor/Criados.test.tsx`: 22 de 22 passaram. Não há `.skip`, nem teste comentado, nem mock que esconda a regra: a rede falsa só fornece as fixtures. Nenhum código de produção mudou.

**Bloqueantes:** nenhum.

**Recomendações:**
- O e2e `professor-criados.spec.ts` continua sem conferir a data. Fica como cobertura extra para o `/validar`, porque o teste de componente já prova a regra.
