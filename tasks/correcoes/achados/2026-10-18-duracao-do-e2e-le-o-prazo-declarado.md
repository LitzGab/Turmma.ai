# Achados das revisões — `tasks/correcoes/2026-10-18-duracao-do-e2e-le-o-prazo-declarado.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-18 19:00:15 · `tasks/correcoes/2026-10-18-duracao-do-e2e-le-o-prazo-declarado.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A linha na §10 e em "Divergências resolvidas" da 2.0 fica com o Arquiteto e com a 2.0, e o documento diz isso em "Fora desta correção". Bate com o que a divergência pede: "a decisão vira linha na §10". O caminho escolhido foi a alternativa 1, com a mitigação de "só o prazo do HEAD", e foi o Joaquim que decidiu.
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

Recomendações:
- **Título repetido ganha o prazo de outro caso.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tools/ci/duracao-do-e2e.ts:226-229`, a busca é por título em qualquer spec do HEAD. Um caso novo que repete o título de um caso lento de outro arquivo e põe `test.slow()` sobe o limite para 45 s. O risco é baixo e a busca em qualquer arquivo é o que deixa o caso movido levar o prazo que já tinha. Vale uma frase no comentário do topo, ao lado do "Limite conhecido".
- **Título com `${}` cai para 30 s mesmo com `test.slow()` no HEAD.** É o caso do `e2e/acesso-da-turma.spec.ts:497`, gerado num laço `for` com `test.slow()` no corpo. O desvio cobra mais e está documentado. Não pesa na 2.0, porque nenhum título dos specs que ela move ou edita é modelo com `${}` (`professor-assistente`, `professor-turma`, `professor-sino`, `a2`, `a3-a4`, `roteiro`). Só fique registrado: a tarefa que alterar esse caso vai ser medida contra 15 s.
- **`test.slow()` no nível do `describe` seria creditado ao caso de cima.** Esse `test.slow()` ficaria entre dois `test(`, fora de `beforeEach`, e o `FIM_DE_CASO` (`duracao-do-e2e.ts:173`) não para nele. Hoje nenhum spec do HEAD faz isso: todo `test.slow()` e todo `test.setTimeout` estão dentro do corpo de um caso. Se um dia aparecer, é uma linha no "Limite conhecido" ou um corte a mais no `FIM_DE_CASO`.
- **Comentário da linha 3 do `duracao-do-e2e.ts` ficou parcial.** "O prazo de um caso é 30 s no runner" vale só para o caso sem prazo próprio. O parágrafo da linha 14 corrige, mas a primeira frase podia já dizer "sem prazo próprio".

## test-engineer · 1ª rodada · REPROVADO · 2026-10-18 19:02:09 · `tasks/correcoes/2026-10-18-duracao-do-e2e-le-o-prazo-declarado.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Caminho feliz:** um caso que já tinha `test.slow()` ou `test.setTimeout(n)` no HEAD e foi alterado é medido contra a metade desse prazo.
- **Casos de borda reais:**
  - o caso movido para um spec novo leva o prazo que tinha no HEAD;
  - o caso mudou de `describe`;
  - o mesmo título aparece em dois specs (vale o menor prazo);
  - a ordem entre `setTimeout` e `slow`;
  - o separador de milhar no número;
  - o título com aspas escapadas, na linha de baixo ou feito de modelo com `${}`;
  - o prazo do HEAD menor que 30 s;
  - o relatório sem o campo `timeout`;
  - o prazo declarado por constante, como no roteiro;
  - `test.slow()` escrito em comentário.
- **Permissão (quem não pode, não consegue):** o `test.slow()` posto agora, num caso novo ou num caso que o HEAD tinha sem prazo, não aumenta o limite.
- **Isolamento e concorrência:** não se aplicam, porque é ferramenta de processo e não toca dado de escola.

**Cobertos:** todos os itens acima, menos o prazo por constante e o comentário. Rodei `npx vitest run tools/ci/duracao-do-e2e.test.ts`: 35 de 35 verdes. Conferi as 25 mutações contra o diff, e cada uma chega à sua cláusula pelo motivo certo.

**Bloqueantes:**

1. **O prazo do roteiro não é lido.** O defeito está em `tools/ci/duracao-do-e2e.ts:193`.
   - A regex só aceita `test.setTimeout(<número literal>)`, mas o roteiro declara `test.setTimeout(PRAZO_DO_ROTEIRO_MS)` (`e2e/roteiro-da-demonstracao.spec.ts:115`, com `const PRAZO_DO_ROTEIRO_MS = 8 * 60_000` na linha 60).
   - Rodei `prazosDoHead` sobre este repositório: o caso "do painel da operação à governança…" sai com 30 000.
   - O Sintoma diz que a correção resolve o roteiro (71,7 s), e não resolve: a 2.0 continua reprovada nesse caso.
   - O "Limite conhecido" também não declara esse caso. E pela regra do HEAD, trocar a constante por um número na 2.0 não conta.
   - **Correção exigida:** resolver `test.setTimeout(IDENT)` quando o mesmo arquivo tem `const IDENT = <expressão só de números literais e *>`, com um teste na forma real do roteiro e um bloco de mutação. Se isso ficar fora do escopo, declarar no documento que o roteiro continua com limite de 15 s e levar a escolha ao Arquiteto e ao Joaquim, porque muda o que a alternativa 1 entrega.

2. **Comentário conta como declaração de prazo.** O defeito está em `tools/ci/duracao-do-e2e.ts:193`.
   - O texto do caso é lido com os comentários dentro, então um `` `test.slow()` `` escrito em comentário vale como declaração.
   - Isso já acontece no repositório: `e2e/lista-da-turma.spec.ts:523` tem o comentário "limite do `test.slow()`", e o caso sai com 270 000 em vez de 90 000.
   - Hoje o `Math.min` com o prazo da corrida neutraliza o erro. Mas um caso cujo comentário no HEAD cita `test.slow()`, sem ter o `slow()` de verdade, ganha 45 s se a tarefa puser `test.slow()` agora. É a saída que a correção promete fechar, e contradiz o "erra para o lado de cobrar mais".
   - **Correção exigida:** tirar os comentários `//` e `/* */` antes de procurar as declarações, com um teste (o comentário com `test.slow()` dá 30 s) e um bloco de mutação.

3. **O teste promete o `describe` e não o testa.** O teste está em `tools/ci/duracao-do-e2e.test.ts:171`.
   - O título diz "depois de um beforeEach **ou de um describe**", mas o texto do teste só tem `test.beforeEach`.
   - Se a alternativa `describe` sair de `FIM_DE_CASO` (`duracao-do-e2e.ts:173`), nada fica vermelho.
   - O efeito iria para o lado de cobrar menos: um `test.slow()` dentro de um `test.describe` logo abaixo passaria a contar para o caso de cima.
   - **Correção exigida:** pôr um `test.describe(...)` com `test.slow()` no texto do teste e declarar o bloco de mutação que tira `describe|`.

4. **Cláusulas novas de `INICIO_DE_CASO` sem bloco de mutação.** A regex está em `tools/ci/duracao-do-e2e.ts:172`.
   - O `(?:\.(?:only|fixme))?` não tem teste nem bloco. Sem ele, o texto de um `test.fixme('…')` passa a ser do caso de cima, com o `slow()` que tiver dentro.
   - O `\s*` (o título na linha de baixo) tem teste, mas não tem bloco.
   - **Correção exigida:** um teste com `test.fixme(` e o bloco de mutação das duas cláusulas, ou tirar `only|fixme` se a ferramenta não precisa delas.

**Recomendações:**
- **Prazo em duas etapas.** A regra "já estava no HEAD" se contorna em dois commits da mesma spec: o primeiro põe `test.slow()` num caso rápido, que passa abaixo de 15 s; o segundo o deixa lento. Comparar com o `merge-base` da `develop`, em vez do HEAD, fecharia isso. Fica para o `/retro`.
- **Linha do caso no teste.** Em `tools/ci/duracao-do-e2e.test.ts:428`, o relatório diz que o caso `comum` está na linha 6, mas o `test('comum'` está na 5. O teste continua provando a regra, porque a linha 6 cai dentro do diff, mas o certo é 5.
- **Falso início de caso.** `INICIO_DE_CASO` casa com `.test('literal')` de um `RegExp` (`/x/.test('…')`), que parte o texto do caso. Hoje isso só deixa a régua mais apertada, mas vale um `(?<![.\w])` antes de `test`.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tools/ci/duracao-do-e2e.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tools/ci/duracao-do-e2e.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/correcoes/2026-10-18-duracao-do-e2e-le-o-prazo-declarado.md`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-18 19:12:38 · `tasks/correcoes/2026-10-18-duracao-do-e2e-le-o-prazo-declarado.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A correção continua só em ferramenta de processo (`tools/ci/duracao-do-e2e.ts` e o teste dela). O que entrou desde a 1ª rodada é o que o `test-engineer` exigiu nos quatro bloqueantes:
- o prazo dado por constante (`test.setTimeout(PRAZO_DO_ROTEIRO_MS)`) agora é lido;
- comentário não conta mais como declaração de prazo;
- o teste que promete o `describe` agora o testa, e há um bloco de mutação para cada marcador de fim de caso;
- `only|fixme` e o `\s*` do título ganharam teste e bloco de mutação.

A linha 6 que virou 5 no teste é a recomendação dele. As recomendações da minha 1ª rodada entraram no comentário do topo e nos "Limites conhecidos". Não há comportamento além disso. A linha na §10 continua com o Arquiteto e a 2.0, como diz "Fora desta correção".
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

Conferi três pontos de correção:
- **O roteiro.** O teste que lê o `e2e/roteiro-da-demonstracao.spec.ts` real prova os 480 000 ms. As expressões regulares desse arquivo (linhas 61 e 62) não têm aspas nem `//`, então a retirada dos comentários não as confunde.
- **O lado do erro.** Quando a retirada dos comentários erra, ela tira código de verdade, e isso só baixa o prazo lido, ou seja, cobra mais. O caso contrário, uma expressão regular com aspa dentro, está declarado nos "Limites conhecidos" e o `Math.min` com o prazo da corrida limita o dano.
- **Os números de linha.** O texto sem comentários só é usado para ler título e prazo (`prazosDosCasos` e `prazosDoHead`). As linhas que o diff tocou continuam sendo achadas sobre o texto original, então tirar comentário não desloca nada.

Recomendações:
- **Segundo jeito de tirar comentário.** `tools/ci/duracao-do-e2e.ts:180` (`semComentarios`) é um leitor feito à mão. O projeto já tira comentário pelo parser do TypeScript em `tools/processo/revisoes.ts:221` (`impressaoSemComentarios`), e esse parser entende expressão regular literal. Usar o leitor do compilador (por exemplo `ts.createScanner`) acabaria com o limite que hoje fica só declarado. Fica para o `/retro` ou para o `TODO.md`, ao lado do falso início de caso.
- **Constante terminada em `;`.** `constantesNumericas` (`duracao-do-e2e.ts:215`) exige que a linha acabe logo depois da expressão, então `const X = 60_000;` não é lido e o caso conta 30 s. O erro vai para o lado de cobrar mais, mas o projeto não usa ponto e vírgula hoje e vale uma palavra nos "Limites conhecidos" para quem um dia usar.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tools/ci/duracao-do-e2e.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tools/ci/duracao-do-e2e.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/correcoes/2026-10-18-duracao-do-e2e-le-o-prazo-declarado.md`

## test-engineer · 2ª rodada · REPROVADO · 2026-10-18 19:13:10 · `tasks/correcoes/2026-10-18-duracao-do-e2e-le-o-prazo-declarado.md`

**VEREDITO: REPROVADO**

As quatro correções da 1ª rodada foram feitas e cada uma tem teste e bloco. Reprovo porque a cláusula "só números e `*`" da constante ficou sem teste, e três cláusulas novas de `semComentarios` e de `constantesNumericas` ficaram sem bloco de mutação, que a regra trata como bloqueante por si.

**Cenários exigidos:**
1. O roteiro, escrito como está no repositório, conta 8 min.
2. Uma constante feita de números e `*` é lida, com e sem `export`.
3. Uma constante que não é só números, ou que não existe, conta 30 s.
4. Um `test.slow()` ou `test.setTimeout()` dentro de comentário de linha ou de bloco não vale.
5. `//` dentro de aspas e aspa escapada não abrem comentário.
6. Cada marcador do `FIM_DE_CASO` corta o caso de cima.
7. `test.only` e `test.fixme` abrem caso.
8. Título na linha de baixo (`\s*`).

**Cobertos:**
- **1:** `duracao-do-e2e.test.ts:232` lê o arquivo real e cobra 480.000; tem bloco.
- **2 e 3:** `:205` cobre `PRAZO_DO_ROTEIRO_MS`, `export const`, `calcular()` e a constante que não existe; cada um tem bloco.
- **4 e 5:** `:237` e `:242`, com seis blocos.
- **6:** `:190` cobre os seis marcadores, com um bloco por marcador.
- **7:** `:196`, com dois blocos.
- **8:** já estava coberto, e o bloco do `\s*` aponta para ele.

Os 41 testes passam. Rodei `prazosDosCasos` sobre todos os `e2e/*.spec.ts`. Todas as diferenças entre os `test(` que existem e os casos lidos são títulos com `${}`, que ficam de fora de propósito. Nenhum caso foi engolido por comentário ou por aspas.

**Bloqueantes:**
1. **`tools/ci/duracao-do-e2e.ts:217`, a âncora `\s*$` da regex das constantes, não tem teste nem bloco.** É ela que garante "só números e `*`".
   - Se for tirada, `const P = 8 * 60_000 + x()` passa a valer 480 s. O prazo do HEAD fica maior que o declarado, e o portão cobra menos.
   - O teste de `:205` não percebe, porque `calcular()` nem começa por dígito.
   - Exigido: um caso com `const SOMADO_MS = 8 * 60_000 + 1` e `test.setTimeout(SOMADO_MS)` que espera 30 s, e o bloco que tira `\s*$`.
2. **`duracao-do-e2e.ts:218`, o `.replaceAll('_', '')` dos fatores, não tem bloco.** O teste de `:205` já fica vermelho sem ele (`Number('60_000')` dá NaN). Exigido: o bloco apontando para "com a constante do arquivo feita de números".
3. **`duracao-do-e2e.ts:194`, `if (c === aspa) aspa = null` (o fecho da aspa), não tem bloco.** Com `if (false)`, a aspa do título `'citado em comentário'` nunca fecha, o `// … test.slow()` fica no texto, e "comentário não é declaração" fica vermelho. O teste de `semComentarios` não pega essa mutação. Exigido: o bloco apontando para "comentário não é declaração".
4. **`duracao-do-e2e.ts:199`, a parada do comentário de linha no `\n`, não tem bloco.** Se ela sumir, o comentário apaga o resto do arquivo e "semComentarios tira" fica vermelho. Exigido: o bloco que troca `texto.charAt(i) !== '\n'` por `true`, apontando para "semComentarios tira".

**Recomendações:**
- **Regex literal com `\/` antes do fecho.** `e2e/operacao-convite.spec.ts:152` tem `/^otpauth:\/\/totp\//`, e o `\//` final é lido como início de comentário. Ali só some `/)`, sem dano. Mas o limite declarado fala só de "regex com aspa dentro", e vale estendê-lo à regex com `\/` no documento e no comentário do topo do arquivo.
- **`const` dentro de função.** A regex usa `^\s*` com `m`, então uma constante indentada dentro de outra função também entra no mapa, e uma sombra de mesmo nome sobrescreve a do topo. Ninguém faz isso hoje. Fica para o `TODO.md`, junto do falso início de caso.
- As duas recomendações sem aplicar da 1ª rodada estão registradas na tabela do documento, com destino. Nada a acrescentar.

Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tools/ci/duracao-do-e2e.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tools/ci/duracao-do-e2e.test.ts` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/correcoes/2026-10-18-duracao-do-e2e-le-o-prazo-declarado.md`.

## revisor-geral · 3ª rodada · APROVADO · 2026-10-18 19:32:21 · `tasks/correcoes/2026-10-18-duracao-do-e2e-le-o-prazo-declarado.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tools/ci/duracao-do-e2e.test.ts:304`: agora que `limiteDoCaso` não tem valor padrão, a linha com `new Map()` repete o que a linha 303 já prova com `noHead`. Pode sair, ou trocar de propósito: hoje ela não prova nada que a 303 não prove.
- Nos "Limites conhecidos" do documento, no comentário do topo e no JSDoc de `prazosDosCasos` (`tools/ci/duracao-do-e2e.ts:25-27` e `:238`), a expressão "fora de função" promete mais do que a regex entrega. A regex lê qualquer `const` que começa na coluna 0, e uma constante dentro de função escrita sem recuo seria lida. O prettier nunca escreve assim, então não há dano. Mas "na coluna 0 (o que, com o prettier, quer dizer fora de função)" descreve o que o código faz de fato.

O que conferi nesta rodada:
- **Escopo.** Desde a 2ª rodada mudaram só `tools/ci/duracao-do-e2e.ts`, o teste dele, o documento da correção e o `TODO.md`. O `portao-local.ts`, a regra 40 e o `executar-task` ficaram como estavam. Continua sendo só ferramenta de processo. As seis mudanças C1 a C6 e os acréscimos T1 a T5 batem com o diagnóstico do Arquiteto, linha por linha. O documento tem os 83 blocos `mutacao` anunciados.
- **Comportamento nos specs de hoje.** Montei uma comparação no scratchpad entre a versão da árvore `f1a38eb` (`tools/ci/duracao-do-e2e.ts`) e a versão atual, rodando as duas sobre todos os `e2e/*.spec.ts`. O `prazosDosCasos` deu zero arquivos com diferença em 508 casos, e o `prazosDoHead` deu o mesmo mapa de 502 títulos. As quatro constantes recuadas que existem hoje (`acesso-da-turma:1232`, `incidentes:315`, `privacidade:216`, `professores:996`) não aparecem em nenhum `test.setTimeout`, então a restrição à coluna 0 não muda nada. Nenhum spec escreve `setTimeout( n )` com espaço.
- **O que ficou de fora está dito onde o leitor procura.** O limite da expressão regular literal, a constante só na coluna 0 e sem `;` e o `setTimeout( n )` estão nos três lugares: nos "Limites conhecidos" do documento, no comentário do topo de `duracao-do-e2e.ts` e no JSDoc de `prazosDosCasos`. A troca de `semComentarios` pelo `ts.createScanner` e o falso início de caso estão no `TODO.md`, item (a) da retrospectiva da X1, com o nome desta correção. Na tabela "Recomendações sem aplicar", a recomendação da `const` dentro de função aparece como resolvida pelo C3, e a da constante com `;` aparece como aplicada em texto. Bate com o que pedi na 2ª rodada.
- **C6.** Tirar os valores padrão de `limiteDoCaso` e de `avisoDosCasosLentos` não deixa ninguém sem argumento: o único chamador fora do teste é `motivoDaDuracaoDoE2e`, nas linhas 344 a 346, e ele passa os dois. O padrão de `casosLentos` ficou, e com razão: o teste da linha 103 o usa.

## test-engineer · 3ª rodada · REPROVADO · 2026-10-18 19:33:02 · `tasks/correcoes/2026-10-18-duracao-do-e2e-le-o-prazo-declarado.md`

VEREDITO: REPROVADO

**Cenários exigidos (rodada 3):** as quatro correções da 2ª rodada e, pelo critério de executar-task, um bloco para cada termo das condições compostas do código de agora. Também que nenhum bloco que já existia passe a dar vermelho pelo motivo errado por causa das mudanças desta rodada.

**Cobertos:**
1. **Âncora `\s*$`:** o bloco no documento, linhas 465 a 470, e o caso `constante somada` (`const SOMADO_MS = 8 * 60_000 + 1`, esperado 30 s) estão lá. Sem a âncora, a regex lê `8 * 60_000` e dá 480 s, então o teste fica vermelho.
2. **`.replaceAll('_', '')` dos fatores:** o bloco nas linhas 472 a 477 está lá. Sem ele, `Number('60_000')` dá `NaN`, e o roteiro deixa de dar 480 000.
3. **Fecho da aspa:** o bloco nas linhas 479 a 484 está lá. A aspa do título nunca fecha, o comentário fica no texto, e `citado em comentário` deixa de dar 30 s.
4. **Fim do comentário de linha:** o código agora usa `indexOf('\n', i + 2)`. Os blocos nas linhas 486 a 505 (`'x'`, `texto.length - 1` e `quebra + 1`) são todos vermelhos com os casos `'a // sem fim de linha'` e `"…// y\nc…"`. Trocar `i + 2` por `i` não muda nada, porque as posições `i` e `i + 1` são as duas barras.
5. **Cada termo das condições compostas tem bloco:**
   - em `semComentarios`, os dois lados de `/` e `/`, os dois lados de `/` e `*`, cada uma das três aspas, a aspa aberta, o escape (com `saida += seguinte` e `i += 2`) e o `indexOf('*/', i + 2)`;
   - na regex das constantes, `^`, `export`, o grupo `*` e `\s*$`;
   - em `/^\d/`, o `^` (caso `MINUTO_2`) e o `false`;
   - em `INICIO_DE_CASO`, o `\b`, `only`, `fixme`, o `\s*`, cada uma das três aspas, o `\\.` e o `(?!\1)`;
   - em `FIM_DE_CASO`, o `\b` da frente, cada marcador e o `\b` do fim (caso `test.user()`);
   - os dois `\b` da regex das declarações, o `'e2e/'` do `ls-tree` (caso `fora/outro.spec.ts`) e o `?? 0` do `Math.min`.
6. `npx vitest run tools/ci/duracao-do-e2e.test.ts` passa: 42 testes verdes. Não há `.skip`, mock nem provedor pago.

**Bloqueantes:**

1. **O bloco nas linhas 206 a 211 do documento agora fica vermelho pelo motivo errado.** O arquivo é `tasks/correcoes/2026-10-18-duracao-do-e2e-le-o-prazo-declarado.md` e a mutação é `limiteDoCaso(caso, doHead)` trocado por `limiteDoCaso(caso)`.
   - Nesta rodada, `tools/ci/duracao-do-e2e.ts:302` perdeu o padrão `= new Map()`, e o argumento passou a ser obrigatório.
   - Com isso, a mutação faz `prazoContado` chamar `undefined.get(...)` e lançar `TypeError` já na primeira chamada de `motivoDaDuracaoDoE2e`, em `duracao-do-e2e.test.ts:523`. A asserção dos 45 s nunca chega a ser avaliada.
   - Esse código mutado nem passa no `tsc`. O bloco prova só que a linha roda, e não que o teste pega quem mede o caso sem o prazo do HEAD.
   - **Correção exigida:** trocar a linha mutada por `+  const limiteDe = (caso: CasoMedido) => limiteDoCaso(caso, new Map())`. Com ela, o caso de 40 s mede contra 15 s, deixa de dar `null`, e o teste fica vermelho pela regra.

2. **O bloco nas linhas 227 a 232 do documento tem o mesmo problema.** A mutação é `avisoDosCasosLentos(lentos)`, sem `limiteDe`.
   - `duracao-do-e2e.ts:315` também perdeu o padrão nesta rodada.
   - Com a mutação, a segunda chamada do teste, a de 46 s em `duracao-do-e2e.test.ts:524`, quebra com `limiteDe is not a function`. Não é a asserção de `(limite 45,0 s)` que falha.
   - **Correção exigida:** trocar a linha mutada por `+  return lentos.length === 0 ? null : avisoDosCasosLentos(lentos, () => LIMITE_DO_CASO_DE_E2E_MS)`. Com ela, o aviso diz `limite 15,0 s`, e a linha 525 fica vermelha pela regra.

Nos dois casos a regra está protegida de fato; o que falha é o texto do bloco, que mira um código que não compila. A correção é só no documento, e o portão precisa ser rodado de novo para regravar o carimbo.

**Recomendações:**
- O `/^\d/` passou a tratar como constante o identificador que começa por `_`. O código antigo, com `[\d_]+`, lia `_1` como o número 1. Nenhum caso prova isso; um `const _1 = 60_000` no caso das constantes fecharia.
- Trocar `\s*$` por só `$` (espaço no fim da linha) não tem bloco. O prettier tira esse espaço, então não pesa.
- A seção "Recomendações sem aplicar" registra que a sugestão da 2ª rodada sobre a constante dentro de função foi resolvida. O caso `constante de dentro de uma função` confirma.

Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/correcoes/2026-10-18-duracao-do-e2e-le-o-prazo-declarado.md`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tools/ci/duracao-do-e2e.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tools/ci/duracao-do-e2e.test.ts`

## test-engineer · 4ª rodada · APROVADO · 2026-10-18 19:40:58 · `tasks/correcoes/2026-10-18-duracao-do-e2e-le-o-prazo-declarado.md`

VEREDITO: APROVADO

Cenários exigidos: nesta 4ª rodada, as duas correções exigidas na 3ª.
1. A mutação do bloco nas linhas 206 a 212 tem de ficar vermelha pela regra. É a regra de que o caso com prazo declarado no HEAD mede contra esse prazo, e não contra os 15 s.
2. A mutação do bloco nas linhas 227 a 232 tem de ficar vermelha pela regra. É a regra de que o aviso mostra o limite com que o caso foi medido.

Cobertos:
- **Correção 1:** a mutação agora é `limiteDoCaso(caso, new Map())`. Com o mapa vazio, `prazoContado` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tools/ci/duracao-do-e2e.ts:295-299`) usa o padrão de 30 s, e o limite cai para 15 s. Assim o caso de 40 s deixa de caber, e a asserção `toBeNull()` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tools/ci/duracao-do-e2e.test.ts:523` fica vermelha pela regra. A linha `-` do bloco bate com a linha 344 do código.
- **Correção 2:** a mutação agora é `avisoDosCasosLentos(lentos, () => LIMITE_DO_CASO_DE_E2E_MS)`. A constante está exportada no mesmo arquivo (linha 45), então a mutação compila. `casosLentos` continua recebendo o `limiteDe` verdadeiro, e por isso a linha 523 segue verde. Já o aviso do caso de 46 s passa a dizer `limite 15,0 s`, e a asserção `limite 45,0 s` da linha 525 fica vermelha pela regra. A linha `-` bate com a linha 346 do código.
- Fora da seção "Revisões", o diff `c4d71d1..13cf86b` muda só essas duas linhas. Código e teste estão iguais aos da 3ª rodada, que já tinha sido auditada.
- Rodei `npx vitest run tools/ci/duracao-do-e2e.test.ts` na árvore de agora: 42 de 42 testes verdes.

Bloqueantes: nenhum.

Recomendações: ficam as da 3ª rodada, que a Mesa decidiu não aplicar e que continuam registradas:
- o `/^\d/` erra com identificador que começa por `_`;
- trocar `\s*$` por `$`.
