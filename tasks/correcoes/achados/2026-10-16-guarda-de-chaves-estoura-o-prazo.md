# Achados das revisões — `tasks/correcoes/2026-10-16-guarda-de-chaves-estoura-o-prazo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-16 23:22:21 · `tasks/correcoes/2026-10-16-guarda-de-chaves-estoura-o-prazo.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A correção não toca a arquitetura. O documento pede só o prazo próprio do teste, a mudança no diff é só essa, e a asserção não mudou.
Portão local: carimbo válido. Ele cobre typecheck, lint, segredo, dependencias, unidade e alvo.
Bloqueantes: nenhum.
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tools/guardas/guardas.test.ts:167-168`: o comentário sobre o prazo está depois da asserção, longe do `import()` que causa a demora. Ele ficaria mais claro logo acima do `await import(nucleo)`, junto do comentário que já explica o import por variável. Se ficar onde está, a frase "A asserção acima não muda" fala da revisão e não do código, e pode sair.
- O prazo de 60 s segue o que o projeto já usa em `apps/api/test/ataque-de-senha.int.test.ts`, no terceiro argumento do `it`. Não há segundo jeito de fazer a mesma coisa. Fica um registro: o custo real é o índice inteiro do `@educa/nucleo` sendo carregado num teste de unidade. Se outro teste da unidade importar o núcleo pelo índice, vale exportar `CHAVES_PESSOAIS` por um subcaminho leve do pacote, em vez de repetir o prazo longo em cada teste.

## test-engineer · 1ª rodada · APROVADO · 2026-10-16 23:22:29 · `tasks/correcoes/2026-10-16-guarda-de-chaves-estoura-o-prazo.md`

VEREDITO: APROVADO

Cenários exigidos: esta correção não muda nenhuma regra de negócio. Ela só dá mais tempo a um teste existente, que falhava por estouro de prazo e nunca por asserção. Ela precisa provar três coisas:
- **Caminho feliz:** as chaves da guarda (`CHAVES_PESSOAIS` em `tools/guardas`) são iguais às que o redact do logger remove, lidas do `@educa/nucleo`, que é o módulo que a API usa.
- **Teste que ainda prova a regra:** se uma chave existir num lado e faltar no outro, o `toEqual` das duas listas ordenadas tem que ficar vermelho.
- **Sem flakiness por carga:** o teste não pode depender de a máquina estar folgada.

Permissão, isolamento e concorrência não se aplicam: não há dado de escola, endpoint nem operação que possa acontecer duas vezes.

Cobertos:
- **A asserção não mudou.** O diff em `tools/guardas/guardas.test.ts:167-169` só acrescenta o comentário e o terceiro argumento `60_000` do `it`. O `toEqual` da linha 166 está como antes, então o teste continua falhando se as listas divergirem.
- **O import não mudou.** O teste segue lendo `@educa/nucleo`, o módulo que a API usa, e não um caminho relativo.
- **Sem flakiness:** com 60 s, o prazo se mede dentro do próprio teste e não depende de folga da máquina. É o caminho certo, e não um experimento de carga. A tabela do documento mostra o estouro como causa: 24 de 24 vermelhos com 24 execuções ao mesmo tempo, e 24 de 24 verdes depois.
- **Rodei uma vez:** `npx vitest run --project unidade tools/guardas/guardas.test.ts -t "mesmas chaves"` passou em 1,28 s. Os 73 testes marcados como pulados vêm do filtro `-t`, não de `.skip`.
- **Mutações:** o documento não tem seção de mutações, e não precisa, porque o diff não traz cláusula nova.
- **Proibições:** nenhum `.skip`, nenhum teste comentado, nenhum mock e nenhuma chamada a provedor de IA.

Bloqueantes: nenhum.

Recomendações:
- `tools/guardas/guardas.test.ts:167-168`: o comentário está depois da asserção e fala da própria correção ("A asserção acima não muda"). Ficaria melhor logo acima do `it` ou junto do `60_000`, dizendo só por que o prazo existe (o import do índice do núcleo puxa banco, fila e storage).
- Com 60 s, se o import travar de verdade, o teste demora 60 s para ficar vermelho em vez de 5 s. É aceitável. Fica registrado para o `/retro`: a causa de fundo é o ponto de entrada do `@educa/nucleo` puxar banco, fila e storage. Exportar `CHAVES_PESSOAIS` por um subcaminho leve do pacote eliminaria o custo sem perder a garantia de ler o mesmo módulo que a API usa.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tools/guardas/guardas.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/correcoes/2026-10-16-guarda-de-chaves-estoura-o-prazo.md

## revisor-geral · 2ª rodada · APROVADO · 2026-10-16 23:26:59 · `tasks/correcoes/2026-10-16-guarda-de-chaves-estoura-o-prazo.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. É uma correção de teste e não toca arquitetura nem produto.
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum
Recomendações: nenhuma nova.
- A recomendação da 1ª rodada foi aplicada. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tools/guardas/guardas.test.ts:164-165`, o comentário sobre o prazo de 60 s agora fica junto do `import()` que causa a demora, e a frase sobre a asserção saiu.
- A asserção não mudou. O diff contra a base só acrescenta o terceiro argumento `60_000` e as duas linhas de comentário.
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/correcoes/2026-10-16-guarda-de-chaves-estoura-o-prazo.md`, a tabela "Recomendações sem aplicar" dá destino a cada recomendação da 1ª rodada (`/retro`), com motivo. A frase sobre a rodada 1 na seção "Correção" corresponde ao que o diff mostra.
