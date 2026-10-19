# Achados das revisões — `tasks/correcoes/2026-10-19-mfa-codigo-de-recuperacao-estoura-o-prazo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-19 03:54:44 · `tasks/correcoes/2026-10-19-mfa-codigo-de-recuperacao-estoura-o-prazo.md`

VEREDITO: APROVADO
Caminho quente tocado: login (só teste e2e; o código da API e o da web não mudam)
Rate limit: ok (a correção não mexe no limitador; o segundo caso continua com três entradas com senha na mesma conta, duas pela API e uma pela tela, como o caso antigo tinha pela tela, e a mesma tentativa errada de código; por isso não pressiona mais o limite por conta)
Fila e prioridade: ok (não se aplica, a correção não toca fila)
Concorrência: protegida. O uso único do código de recuperação continua garantido no banco, num `UPDATE ... WHERE usado_em IS NULL RETURNING` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/api/src/sessao/resolucao-de-tenant.repository.ts:284`. A mutação declarada, que tira o `isNull(usadoEm)`, faz o segundo caso reprovar.
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica, não há código novo no caminho quente)
Bloqueantes: nenhum
Recomendações:
- O documento da correção registra duas medidas na máquina local: 10,8 s e 11,8 s no primeiro caso, 11,6 s e 12,3 s no segundo. As duas ficam abaixo dos 15 s do portão. A confirmação definitiva é o job e2e 5/6 da esteira no `celular`. Vale conferir esse job antes de fechar a spec.
- A requisição que gasta o primeiro código em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/mfa.spec.ts:110` poderia ir para uma fixture (`gastarCodigoDeRecuperacaoPelaApi`), junto de `desafioDoSegundoFator`. Assim o caso fica só com o que a aba prova.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-19 03:55:09 · `tasks/correcoes/2026-10-19-mfa-codigo-de-recuperacao-estoura-o-prazo.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A correção mexe só em teste. A API e a web ficam iguais, e não há divergência a registrar na `techspec.md` nem no `cenarios.md`.
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)
Bloqueantes: nenhum

O que conferi:
- **As três asserções do caso antigo continuam no arquivo.** A entrada com o código de recuperação chegando ao painel está no primeiro caso. O código já usado devolvendo `NAO_AUTENTICADO` e a URL presa em `/mfa` estão no segundo. O código ainda não usado entrando também está no segundo.
- **A troca está declarada no documento.** No segundo caso, o primeiro código agora é gasto pela API, e não pela tela seguida de "Sair". Isso não enfraquece a prova do uso único, porque a regra fica no repository. A configuração pela tela continua provada no primeiro caso e no dos cinco códigos errados.
- **As duas mutações batem com o código atual, linha por linha.**
  - Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/api/src/sessao/resolucao-de-tenant.repository.ts:284`, tirar o `isNull(codigoRecuperacao.usadoEm)` faz o código gasto entrar de novo. O alerta esperado não aparece e o segundo caso reprova.
  - Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/api/src/sessao/mfa.service.ts:167`, trocar o retorno por `return false` desliga só o ramo do código de recuperação. Com isso o primeiro caso reprova.
- **Os pedidos à API estão certos.** As rotas, o corpo `{ recuperacao }` (`esquemaPedidoMfa`) e as etapas `configurar_mfa` e `mfa` são os de `packages/shared`. O `request` do Playwright é um contexto separado da aba e não passa cookie para ela.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/__fixtures__/segundo-fator.ts:51-54` e `:69-72` fazem a mesma entrada por senha pela API, mudando só a etapa esperada. Um auxiliar `entrarPelaApi(request, equipe, etapaEsperada)` tiraria a repetição.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/mfa.spec.ts:86-87` tem um comentário que conta a história da execução 39186346916. Esse histórico já está no documento da correção e no commit. No teste bastaria dizer por que a configuração é feita pela API.
- `PRAZO_DA_ENTRADA_MS` está definido duas vezes, em `e2e/mfa.spec.ts:9` e em `e2e/__fixtures__/segundo-fator.ts:10`. Já era assim antes desta correção. Exportar da fixture evitaria que os dois valores se separem.

## test-engineer · 1ª rodada · APROVADO · 2026-10-19 03:55:36 · `tasks/correcoes/2026-10-19-mfa-codigo-de-recuperacao-estoura-o-prazo.md`

VEREDITO: APROVADO

**Cenários exigidos** (a correção só mexe nos testes e tira o caso do código de recuperação do limite de prazo):
- **Caminho feliz:** a coordenação entra pela tela com um código de recuperação e chega ao painel, sem o aplicativo.
- **Borda 1:** o código já usado volta `NAO_AUTENTICADO` e a pessoa continua em `/mfa`.
- **Borda 2:** um erro com o código gasto não gasta o desafio, e um código ainda não usado entra na mesma tela.
- **Borda 3:** a tela de configuração continua provada em algum caso, já que este deixou de passar por ela.
- **Concorrência:** dois usos do mesmo código ao mesmo tempo entram uma vez só.
- **Prazo:** cada caso que o diff tocou fica abaixo de 15 s, metade do prazo de 30 s.
- **Permissão e isolamento:** não se aplicam. Nenhuma rota, query ou regra de escopo mudou.

**Cobertos:**
- **Caminho feliz:** `e2e/mfa.spec.ts:85-100`. A fixture nova configura pela API, a tela entra com o primeiro código e o teste espera o painel.
- **Bordas 1 e 2:** `e2e/mfa.spec.ts:102-129`. O primeiro código é gasto por `POST /v1/sessao/mfa`, e o teste confere a resposta (`gasto.ok()`, linha 114). Na tela, o mesmo código volta o alerta `NAO_AUTENTICADO` e a URL fica em `/mfa` (linhas 121-122). Na mesma tela, o segundo código chega ao painel (linhas 125-128).
- **Borda 3:** a configuração pela tela continua provada no primeiro caso do arquivo (linhas 14-83) e no dos cinco códigos errados, que ainda chama `configurarSegundoFator` (linha 133).
- **Mutação 1:** o trecho citado bate com `apps/api/src/sessao/resolucao-de-tenant.repository.ts:284`. Sem `isNull(usadoEm)`, o update devolve uma linha de novo, o código gasto entra na tela e o caso fica vermelho na linha 121, que é a da regra.
- **Mutação 2:** o trecho citado bate com `apps/api/src/sessao/mfa.service.ts:167`. Com `return false`, a tela não chega ao painel e o primeiro caso fica vermelho pela regra.
- **Concorrência:** já está provada fora deste diff, com duas chamadas em paralelo sobre o mesmo código, em `apps/api/test/mfa.int.test.ts:386-391`.
- **Prazo:** medido em 10,8 a 12,3 s nos dois projetos, com seis workers.
- **Cookies:** a fixture `request` do Playwright tem contexto próprio, então a sessão aberta pela API não vai para a aba. O padrão já existe em `e2e/areas.spec.ts` e em `e2e/acesso-da-turma.spec.ts`.
- **Contrato:** as rotas usam o desafio por `Authorization: Bearer`, como em `apps/api/src/sessao/mfa.controller.ts:31,38,62`, e o campo do corpo é `recuperacao`, como em `packages/shared/src/sessao/mfa.ts:26`.
- Não há `.skip`, teste comentado nem mock de código nosso. O teste não chama IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. O comentário do topo de `e2e/__fixtures__/segundo-fator.ts:5-8` ainda diz que a fixture configura "pela tela". Vale citar a variante pela API.
2. `configurarSegundoFatorPelaApi` e `desafioDoSegundoFator` repetem a mesma entrada por `/v1/sessao/email` (linhas 51-54 e 68-71). Um auxiliar comum, que recebe a etapa esperada, tiraria a repetição.
3. No segundo caso, o código passa a ser gasto pela API, e não por uma entrada na tela seguida de "Sair". A troca está declarada no documento e não muda a regra provada (RF12, no repository). Só fica registrada para o `/validar`.

Não rodei o e2e. As mutações já foram provadas pelo portão da tarefa, e a regra manda não pôr a máquina sob carga.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/mfa.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/__fixtures__/segundo-fator.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/correcoes/2026-10-19-mfa-codigo-de-recuperacao-estoura-o-prazo.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-19 04:09:30 · `tasks/correcoes/2026-10-19-mfa-codigo-de-recuperacao-estoura-o-prazo.md`

VEREDITO: APROVADO

Cenários exigidos (para esta correção, que mexe só em teste e na folga de tempo do e2e):
- Caminho feliz: a coordenação entra com um código de recuperação pela tela e chega ao painel.
- Uso único (RF12): o código já gasto não passa de novo, aparece o alerta `NAO_AUTENTICADO` e a página continua em `/mfa`.
- Gastar um código não derruba o segundo fator inteiro: um código ainda não usado continua entrando.
- A configuração pela tela continua provada em algum caso do arquivo.
- As duas mutações declaradas chegam à cláusula certa.
- Permissão e isolamento entre escolas não se aplicam: o código da API e o da web não mudam.

Cobertos:
- **Nesta rodada, o diff só reorganiza a fixture, sem mudar o que o teste prova.** O novo `entrarPelaApi` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/__fixtures__/segundo-fator.ts:47`) mantém as mesmas conferências da entrada que antes estava escrita dentro de cada função: a entrada responde ok, e a etapa é `configurar_mfa` na configuração e `mfa` na hora de gastar o código. `gastarCodigoDeRecuperacaoPelaApi` (mesmo arquivo, linha 73) faz a mesma requisição `POST /v1/sessao/mfa` com `{ recuperacao: codigo }` e mantém `expect(gasto.ok())`, que estava no spec. A função `desafioDoSegundoFator` foi retirada e o spec não a importa mais.
- As quatro recomendações que a Mesa mandou aplicar foram feitas: o comentário do topo da fixture, o auxiliar único de entrada pela API, o comentário do primeiro caso sem a história da esteira (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/mfa.spec.ts:86`) e a requisição que gasta o código movida para a fixture (`mfa.spec.ts:109`).
- **As mutações continuam chegando à cláusula:**
  - Sem `isNull(usadoEm)`, o gasto pela API continua ok, a segunda entrada com o mesmo código passa e o alerta esperado na linha 116 não aparece. O teste fica vermelho pelo motivo certo.
  - Com `return false`, o primeiro caso não chega ao painel (linha 98). O teste fica vermelho pelo motivo certo.
- Os dois casos verificam o resultado na tela: o painel, o texto do alerta e a URL. Não verificam só que o código rodou.
- Não há `.skip`, nem teste comentado, nem mock de coisa nossa. O e2e roda contra a API real e não chama provedor de IA.
- Não há nada novo que possa acontecer duas vezes ao mesmo tempo: a correção não introduz operação concorrente.
- Não há alteração na árvore além do commit `e5cc576`. Conferi com `git diff` sobre o `e2e`, que veio vazio.

Bloqueantes: nenhum.

Recomendações:
- `primeiro ?? ''` e `segundo ?? ''` depois de `toBeDefined()` são inofensivos: se o código faltasse, o próprio `expect` reprovaria antes. Um auxiliar que devolvesse os códigos já como `string` dispensaria o `?? ''`. É só limpeza e não pede ação.
- Continua valendo o que a 1ª rodada registrou: a confirmação definitiva do prazo é o job e2e 5/6 da esteira no projeto `celular`, que o Orquestrador lê antes de fechar a spec.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-19 04:09:33 · `tasks/correcoes/2026-10-19-mfa-codigo-de-recuperacao-estoura-o-prazo.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A correção mexe só em teste (`e2e/mfa.spec.ts` e `e2e/__fixtures__/segundo-fator.ts`). Nada muda na API, na web nem no contrato. A troca no segundo caso, em que o primeiro código agora é gasto pela API, está declarada na seção "Correção" do documento.

Portão local: carimbo válido. O `conferir` diz "portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)".

Bloqueantes: nenhum.

As quatro recomendações que a Mesa mandou aplicar estão feitas:
- O comentário do topo da fixture (`segundo-fator.ts:5-9`) cita as duas variantes, pela tela e pela API.
- O auxiliar privado `entrarPelaApi` (`segundo-fator.ts:47-53`) tem a etapa esperada tipada. As duas fixtures que entram pela API passam por ele.
- O comentário do primeiro caso (`mfa.spec.ts:86`) não conta mais a história da esteira.
- `gastarCodigoDeRecuperacaoPelaApi` (`segundo-fator.ts:73-77`) substituiu `desafioDoSegundoFator`. Não sobrou nenhuma referência ao nome antigo no repositório.

Os nomes dos testes citados nas mutações não mudaram e continuam batendo com os títulos em `mfa.spec.ts`.

Recomendações:
- Na tabela "Recomendações sem aplicar" do documento, o destino de `PRAZO_DA_ENTRADA_MS` é `TODO.md`, mas o `TODO.md` não tem essa entrada e não está entre os arquivos alterados. Ou o item entra no `TODO.md` antes do commit, ou o documento deixa de apontar para lá.
- `primeiro ?? ''` em `mfa.spec.ts:109` (e em `:93`, `:113`) passa uma string vazia à fixture se o código não existir. O `expect(...).toBeDefined()` de antes já segura esse caso, então é só ruído de leitura. Não bloqueia.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/__fixtures__/segundo-fator.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/mfa.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/correcoes/2026-10-19-mfa-codigo-de-recuperacao-estoura-o-prazo.md
