# Achados das revisões — `tasks/correcoes/2026-10-19-detector-de-literal-compara-com-a-web.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-19 02:31:13 · `tasks/correcoes/2026-10-19-detector-de-literal-compara-com-a-web.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. É uma correção sem Tech Spec própria. A mudança fica em `tools/ci/` e nos dois textos que descrevem o comportamento, como o documento declara. A regra 40 já fala em "texto que o diff tirou de `apps/web/src`", e o código agora faz o que ela diz.
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

O único chamador de produção é `tools/processo/portao-local.ts:123`, que usa `e2eDosLiteraisRemovidos(raiz)`. A assinatura dessa função não mudou. A de `literaisRemovidos` mudou, mas só o próprio módulo e o teste a chamam.

Recomendações:
- **Checagem que não faz nada em produção.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-19-detector-de-literal-compara-com-a-web/tools/ci/e2e-que-cita-literal.ts:104`, o teste `!acrescentados.has(literal)` não muda o resultado quando o código roda de verdade. Toda linha acrescentada vem de um arquivo da web que já está na árvore e não é `.test`, então o literal dela já está em `naWeb`. A checagem só vale quando alguém chama `literaisRemovidos` com um `naWeb` incompleto, como faz o teste. Há duas saídas: tirar `acrescentados`, junto com a mutação 2, ou dizer no comentário da função que `acrescentados` cobre quem chama sem a web inteira.
- **Pasta com nome de arquivo.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-19-detector-de-literal-compara-com-a-web/tools/ci/e2e-que-cita-literal.ts:72`, `readdirSync(..., { recursive: true })` também devolve pastas. Uma pasta chamada `algo.ts` em `apps/web/src` faria o `readFileSync` lançar EISDIR e derrubaria o portão. É improvável, mas `withFileTypes` com `isFile()` fecha esse caso.
- **Duas leituras do mesmo arquivo.** `literaisDaWeb` e `e2eQueCitam` leem os arquivos da mesma forma, cada uma com o seu `readdirSync`/`readFileSync`. Não chega a ser um segundo jeito de fazer, mas um ajudante comum de "arquivos da pasta com o sufixo X" juntaria as duas.

## test-engineer · 1ª rodada · APROVADO · 2026-10-19 02:32:23 · `tasks/correcoes/2026-10-19-detector-de-literal-compara-com-a-web.md`

VEREDITO: APROVADO

Cenários exigidos:
1. Caminho feliz: o texto que sai da web inteira continua puxando o spec que o cita.
2. Um texto sai de um arquivo e continua em outro que o diff nem toca: não puxa spec. É o caso do "Tentar de novo".
3. Arquivo da web apagado: tira só o que nenhum outro arquivo da web ainda tem.
4. Texto que continua apenas num `.test.ts(x)` da web: conta como removido, porque o teste não aparece na tela.
5. `literaisDaWeb` lê todo `.ts`/`.tsx` em subpastas e deixa de fora `.css` e teste.
6. Repositório sem `apps/web/src`: o conjunto fica vazio, sem quebrar.
7. Texto recolocado pelo próprio diff, em outra linha ou em outro arquivo: não saiu.
8. Cada literal aparece uma vez só, mesmo vindo de vários arquivos.
9. A troca de assinatura chega à ligação real: `e2eDosLiteraisRemovidos` passa `literaisDaWeb(raiz)`.
10. Permissão, isolamento entre escolas, IA e concorrência não se aplicam: é uma ferramenta de processo, pura, que não toca dado de escola.

Cobertos: todos os dez. A suíte `npx vitest run tools/ci/e2e-que-cita-literal.test.ts` passa inteira: 22 de 22.

Conferi as 7 mutações contra o `git diff`. Toda cláusula nova tem bloco, e cada bloco cai no teste citado pelo motivo certo:
- **Sem `!naWeb.has`:** "Tentar de novo" volta à lista em `tools/ci/e2e-que-cita-literal.test.ts:88`.
- **Sem `!acrescentados.has`:** o caso "movido" (`:76`) passa a devolver `['Governança']`.
- **Sem `!saidos.includes`:** "Governança" vem duas vezes (`:104`).
- **Sem `EH_TESTE_DA_WEB` em `literaisDaWeb`:** o `menu.test.tsx` deixa "Governança" no conjunto da web, e o resultado vira `[]` (`:219`).
- **Sem o filtro de extensão:** cai em `:117`. Ver a recomendação 3.
- **Sem o `existsSync`:** cai em `:126` com ENOENT. Esse é o motivo da cláusula.
- **Ligação com `new Set()`:** `casca.spec.ts` volta a entrar (`:201`).

Não há `.skip`, teste comentado nem mock de coisa nossa: os testes de repositório usam git de verdade, num diretório temporário. A única outra chamada, em `tools/processo/portao-local.ts:123`, usa `e2eDosLiteraisRemovidos(raiz)`, cuja assinatura não mudou.

Bloqueantes: nenhum.

Recomendações:
1. **A galeria esconde mais casos do que o "preço" descrito deixa ver.** `literaisDaWeb` inclui `apps/web/src/galeria/`, que repete rótulos reais das telas. Exemplos: "Tentar de novo" em `apps/web/src/galeria/secoes/estado.tsx:111`, "Esperando você" em `:47` e "Turmas" em `apps/web/src/galeria/secoes/marca-icones.tsx:15`. Trocar um desses textos na tela de verdade nunca puxa o spec dela, porque a galeria o mantém. A correção aceita esse preço por escrito, mas ele fica mais frequente do que o texto sugere. Vale tirar `galeria/` e `__fixtures__/` (`apps/web/src/__fixtures__/`, `apps/web/src/operacao/__fixtures__/`) do conjunto, como já se tira o `.test`. É o item (3) da letra (d) no `TODO.md:967`, e um teste de unidade a mais o prova.
2. **O `TODO.md` ficou desatualizado.** As linhas 962 e 963 ainda dizem que "o literal curto e comum puxa todo spec que o cita"; o comentário do módulo e o `SKILL.md` já foram ajustados. Atualize as linhas e registre a correção desta letra.
3. **A mutação do filtro de extensão cai por EISDIR.** O `readFileSync` tropeça na pasta `areas`, e a asserção sobre o `.css` nem chega a rodar. O vermelho é legítimo, porque a cláusula também protege contra pastas. Mas o "deixa de fora .css" só fica provado por conta própria se o teste tiver só arquivos no topo, ou se a leitura passar a filtrar `isFile()`.
4. **Falta um caso para arquivo novo não rastreado.** O texto que sai de `a.tsx` para um arquivo novo, ainda fora do índice, não aparece no `git diff HEAD`, mas `literaisDaWeb` o lê da árvore. O comportamento está certo, só não tem teste que o prove.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-19-detector-de-literal-compara-com-a-web/tools/ci/e2e-que-cita-literal.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-19-detector-de-literal-compara-com-a-web/tools/ci/e2e-que-cita-literal.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-19-detector-de-literal-compara-com-a-web/tasks/correcoes/2026-10-19-detector-de-literal-compara-com-a-web.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-19-detector-de-literal-compara-com-a-web/.claude/skills/executar-task/SKILL.md

## revisor-geral · 2ª rodada · APROVADO · 2026-10-19 02:36:55 · `tasks/correcoes/2026-10-19-detector-de-literal-compara-com-a-web.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. É uma correção de `tools/ci/` sem seção de Tech Spec. O comportamento novo bate com o que a regra 40 e o `.claude/skills/executar-task/SKILL.md` descrevem: conta como removido só o texto que o diff tirou de `apps/web/src` inteiro.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

As quatro correções da ordem r1 estão feitas:
1. **Leitura da pasta da web.** `literaisDaWeb` agora lê com `withFileTypes` e só abre o que é arquivo (`isFile()`), em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-19-detector-de-literal-compara-com-a-web/tools/ci/e2e-que-cita-literal.ts:71-72`. O `entrada.parentPath` existe no Node exigido pelo `package.json` (>=22.18). O teste ganhou a pasta `apps/web/src/algo.ts/`. Assim a mutação do filtro de extensão cai pela asserção do `.css`, e a mutação nova, que tira o `isFile()`, cai pela pasta.
2. **Arquivo novo fora do índice.** O caso novo está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-19-detector-de-literal-compara-com-a-web/tools/ci/e2e-que-cita-literal.test.ts:216-222`. O documento explica por que ele não ganha bloco de mutação próprio: a mutação 8 (`new Set()`) já o derruba. A explicação confere.
3. **Comentário de `literaisRemovidos`.** Só o comentário mudou, sem tocar na lógica nem nas mutações.
4. **`TODO.md`, letra (d).** O limite antigo virou o critério novo, a correção está registrada, e o item (3) cita também `galeria/` e os dois `__fixtures__/`.

Recomendações:
- O item (4) da letra (d) do `TODO.md` ainda diz que o cabeçalho de `tools/ci/e2e-que-cita-literal.ts` fala em "o que só custa minutos" e cita só os limites antigos. O cabeçalho já não tem essa frase e já cita o preço novo (linhas 16-18). Na próxima correção desta letra, vale reescrever o item para pedir só o que ainda falta: copiar para o cabeçalho os limites de JSX em várias linhas e de template, que estão no `executar-task`.

## test-engineer · 2ª rodada · APROVADO · 2026-10-19 02:37:08 · `tasks/correcoes/2026-10-19-detector-de-literal-compara-com-a-web.md`

VEREDITO: APROVADO

Cenários exigidos (rodada 2, sobre o diff desde a rodada 1 e as correções que a ordem r1 pedia):
- Uma pasta com nome de arquivo (`algo.ts/`) dentro de `apps/web/src` não derruba a leitura, e o arquivo dentro dela entra no conjunto.
- O filtro de extensão continua provado depois de a leitura passar a usar `withFileTypes` (o `.css` fica fora).
- O `.test` continua fora do conjunto agora que o filtro olha só o nome do arquivo.
- Um texto que sai de um arquivo e vai para um arquivo novo, ainda fora do índice, não conta como tirado da web.
- O `TODO.md` registra o critério novo e o destino da recomendação 1, que ficou sem aplicar.

Cobertos:
- **A pasta `algo.ts/`:** o teste a cria com `dentro.tsx` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-19-detector-de-literal-compara-com-a-web/tools/ci/e2e-que-cita-literal.test.ts:117-120`) e confere que "Dentro da pasta" entra no resultado. A mutação 6 tira o `isFile()`, e aí o teste fica vermelho porque o código tenta ler a pasta como arquivo (erro EISDIR).
- **O filtro de extensão:** a mutação 5 tira o filtro de extensão. Com a pasta já sem tropeço, a falha passa a vir da asserção do `.css` ("Só no estilo" entraria no conjunto), que era o objetivo da recomendação 3.
- **O `.test` fora do conjunto:** a mutação 4 ainda vale. `EH_TESTE_DA_WEB` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-19-detector-de-literal-compara-com-a-web/tools/ci/e2e-que-cita-literal.ts:61`) só olha o fim do nome (`/\.test\.tsx?$/`), então testar `entrada.name` em vez do caminho dá o mesmo resultado.
- **O arquivo novo fora do índice** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-19-detector-de-literal-compara-com-a-web/tools/ci/e2e-que-cita-literal.test.ts:216-222`):
  - O teste confere antes que o arquivo aparece como `??` no `git status`, e depois que o resultado vem vazio.
  - Ele fica vermelho com a mutação 8 (`new Set()`), porque `casca.spec.ts` cita "Governança" e passaria a entrar.
  - Não leva bloco próprio, e está certo: não há cláusula nova.
- **Os 8 blocos de mutação:** cada linha original aparece igual no fonte de agora: linha 105 (mutações 1 a 3), linha 72 (4 a 6), linha 70 (7, sem confusão com o `return []` da linha 118) e linha 138 (8). Toda cláusula nova do diff tem bloco: `isFile()`, o filtro de extensão e o de `.test`. Nenhuma ficou descoberta.
- **O comentário de `literaisRemovidos`:** muda só o texto. A lógica fica igual e a mutação 2 continua de pé.
- **`Dirent.parentPath`:** o `package.json` pede Node `>=22.18.0 <23`, e a esteira usa `.nvmrc`. Nessa versão o campo existe, então a leitura não quebra na esteira.
- **Execução:** `npx vitest run tools/ci/e2e-que-cita-literal.test.ts` passou, 23 de 23. Não achei `.skip`, teste comentado nem mock. A correção não chama IA e não tem operação que possa rodar em paralelo.

Bloqueantes: nenhum.

Recomendações:
- A recomendação 1 da rodada 1 continua sem aplicar: tirar `apps/web/src/galeria/` e os `__fixtures__/` do conjunto de `literaisDaWeb`. O destino está registrado no item (3) da letra (d) do `TODO.md`. Quando a correção seguinte fizer isso, ela precisa de um teste com um rótulo que só a galeria tem e de uma mutação própria. Hoje esse rótulo segura o spec fora dos alvos, e o efeito é o contrário do que se quer.
