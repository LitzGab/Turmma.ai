# Achados das revisões — `tasks/correcoes/2026-10-16-pecas-sobrepor-estoura-o-prazo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-16 12:34:19 · `tasks/correcoes/2026-10-16-pecas-sobrepor-estoura-o-prazo.md`

VEREDITO: APROVADO

Tela vista: sim (8 fotos lidas de 42, cheia e vazia). Li computador 1 a 3 e celular 1, 6 e 12 da escola cheia, mais computador 1 e celular 1 da vazia. As outras são fatias da mesma página. A correção só mexe em `e2e/` e a `/galeria` é uma página de bancada que existe só no build do e2e. Ela diz de si mesma "Não é uma tela do produto". Nenhuma foto mostra mudança de interface.

Estados: ok. A galeria mostra carregando, vazio, erro e com dado nas peças. O vazio convida, por exemplo "Nenhum material enviado: envie o PDF da apostila…". O erro diz o que fazer: "Não foi possível responder agora. Tente de novo em instantes". Não há estado novo, porque o código de produto não mudou.

Acessibilidade: sem regressão. A correção não tira o axe nem as asserções dos casos. O axe do `sobrepor:556` continua rodando com a CPU ×4 e a rede do perfil ligadas, porque só a primeira carga da galeria deixa de pagar a rede.

Chromebook fraco: o perfil do projeto fica como estava (CPU ×4, Fast 3G e rede móvel lenta). A CPU ×4 continua ligada durante a abertura, e só a rede é liberada em `carregarSemRedeLenta` (`e2e/__fixtures__/perfis.ts`). O `finally` devolve a rede do perfil mesmo quando o carregamento falha, e os testes novos provam isso.

Celular: nas fotos de 360 px não há rolagem horizontal, texto cortado nem botão sobreposto. Os botões de ação têm altura de toque adequada. Nada depende de hover. A correção melhora o projeto `celular`, que era onde o prazo de 30 s estourava.

Ação oficial protegida: sim. Nenhuma ação oficial é tocada pela correção. Na galeria, "Aprovado por Camila Souza · 19/09, 10h42" e "Rejeitou" mostram quem decidiu e quando, e os resultados de IA trazem a marca "IA".

Bloqueantes: nenhum.
- `abrirGaleria` é o único ponto que abre `/galeria` com `page.goto` nos specs que usam o perfil. O `e2e/aparencia.spec.ts:118` abre outra página de propósito e não é afetado.
- O auxiliar falha alto em página que não veio do `test` do perfil. Os três testes novos cobrem a abertura sem latência, a rede de volta (inclusive depois de erro) e o outro lado nas três medidas. As mutações declaradas cobrem os campos do perfil, o `finally`, a sessão do CDP e o `abrirGaleria`.
- O prazo de 30 s fica e nenhuma asserção muda.
- Não rodei os testes. O portão e a esteira fecham isso.

Recomendações:
- Na foto `coordenacao--galeria--celular-6.png` aparece o texto literal `<b>massa molar</b>` na amostra da resposta do Assistente. Se for a prova de que o HTML é escapado, vale um rótulo na amostra dizendo isso. É só da galeria, que não é tela de produto, então não bloqueia.
- O tempo de baixar a galeria na rede lenta deixa de ser exercitado pelos casos dela. O comentário do auxiliar já diz que isso é medido no orçamento do build (`apps/web/nome-dos-chunks.ts`) e nos specs de tela com API. Confirme na validação que esse orçamento tem teste próprio.

Arquivos relevantes: `e2e/__fixtures__/perfis.ts`, `e2e/__fixtures__/galeria.ts`, `e2e/pecas-galeria.spec.ts` e `tasks/correcoes/2026-10-16-pecas-sobrepor-estoura-o-prazo.md`.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-16 12:34:23 · `tasks/correcoes/2026-10-16-pecas-sobrepor-estoura-o-prazo.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

O que conferi:

- **Escopo.** O produto não mudou. As alterações estão só em `e2e/__fixtures__/perfis.ts`, `e2e/__fixtures__/galeria.ts` e `e2e/pecas-galeria.spec.ts`. O prazo de 30 s ficou, e o perfil (CPU ×4 e rede) não foi mexido. Nenhuma asserção dos casos existentes saiu ou mudou.
- **Tech Spec.** A seção da galeria em `tasks/prd-pele-e-casca/techspec.md`, linhas 216 a 237, não exige que a primeira carga da galeria rode na rede do perfil. O axe, o toque e o foco continuam rodando com a rede do perfil ligada.
- **A afirmação central da correção se sustenta.** `apps/web/src/galeria/Galeria.tsx:19` importa as seções com `eager: true`. Então tudo o que a galeria baixa chega antes de o `h1` aparecer, e a rede do perfil já está de volta quando o caso começa a interagir.
- **O auxiliar.** `carregarSemRedeLenta` usa a mesma sessão do CDP que aplicou o perfil e devolve a rede no `finally`. Numa página que não veio do `test` de perfis, ele lança erro em vez de seguir sem limitação.
- **Mutações.** Cobrem tirar o `finally`, devolver a rede errada, zerar cada campo do perfil, tirar a guarda e não registrar a sessão. O caso 2, que passa por construção, é provado por elas.
- **Fotos.** `coordenacao--galeria--computador-1.png` e `vazia--coordenacao--galeria--celular-1.png` mostram a galeria igual à da rodada anterior, como se espera de uma correção que só mexe em teste.

Recomendações:
- `e2e/pecas-galeria.spec.ts`, no caso "depois de aberta…": a asserção `descida.baixados > 100_000` amarra o teste ao tamanho comprimido do maior pedaço do build. Se o pacote de entrada encolher abaixo de 100 kB, o teste fica vermelho por um motivo que não tem relação com a rede. Vale medir a descida com um pedaço de tamanho conhecido, ou derivar o limite do próprio perfil.
- `e2e/pecas-galeria.spec.ts`, em `pedidoNovo`: o `sort` reordena o array devolvido pelo `filter`. Não causa bug, mas com `reduce` ou `toSorted` a intenção fica mais clara.
- Os títulos dos dois últimos testes são longos demais para ler no relatório do Playwright. A explicação que eles carregam cabe melhor no comentário do `describe`.

## test-engineer · 1ª rodada · APROVADO · 2026-10-16 12:35:30 · `tasks/correcoes/2026-10-16-pecas-sobrepor-estoura-o-prazo.md`

VEREDITO: APROVADO

**Cenários exigidos** (a correção mexe só na infraestrutura de teste, sem regra de produto, dado de escola ou concorrência):
- Caminho feliz: a galeria abre com a rede livre, nos dois projetos.
- Borda 1: a rede do perfil volta depois da abertura, com as três medidas (latência, descida e subida).
- Borda 2: a rede do perfil volta mesmo quando `carregar` lança, e o erro chega ao chamador.
- Borda 3: dentro do auxiliar, nenhuma das três medidas é paga.
- Equivalente ao caso de permissão: numa página que não veio do `test` do perfil, o auxiliar falha alto em vez de seguir sem limitação.
- Isolamento e concorrência não se aplicam: a mudança não toca tenant nem operação repetível.

**Cobertos:** todos, nos três testes novos de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/pecas-galeria.spec.ts` (linhas 143 a 181), nos projetos `chromebook` e `celular`.

O que conferi:
- **Mutações contra o diff.** Cada cláusula nova tem bloco, e cada bloco fica vermelho pelo motivo certo:
  - o `set` no WeakMap;
  - a guarda `aplicado === undefined`;
  - a liberação da rede antes de `carregar`;
  - o `finally`, em três formas: removido, devolvendo a rede errada, e trocado por código sequencial;
  - os três campos de `REDE_SEM_LIMITE`;
  - os três campos de `limitarARede`;
  - o embrulho em `abrirGaleria`.
- **Valores do perfil.** As contas das mutações batem com os números de `perfis.ts`. Exemplo: com a latência zerada, o mínimo exigido no Fast 3G passa de ~980 ms, e o pedido sem latência leva ~670 ms. Sobrou sem bloco só o `return await carregar()`, que o caso 3 já cobre: ele usa o valor devolvido.
- **O caso 2 passa sem a correção.** O documento admite isso, e as mutações do `finally` e dos campos é que o tornam efetivo.
- **As asserções são sobre o resultado,** com tempo medido e erro propagado. Também há o mínimo de 20 pedaços, para o caso 1 não passar sem medir nada.
- **Proibições.** Não há `.skip`, mock nem chamada a provedor de IA.
- **Premissa "tudo chega antes do `h1`".** Confirmada: `apps/web/src/galeria/Galeria.tsx` não tem `lazy`, `Suspense` nem `import()` depois do título.
- **Guardas do CI.** O `import type { Page } from '@playwright/test'` no spec é aceito pela guarda. Rodei `npx vitest run tools/ci/playwright.test.ts tools/ci/esteira.test.ts`: 18 de 18 verdes, com o teto de casos da fatia respeitado.
- **O que não muda:** o produto, o prazo de 30 s e as asserções dos outros casos.

Não rodei o e2e para não pôr a máquina sob carga. As fotos da galeria ficaram para o `frontend-reviewer`, porque nenhum arquivo de tela mudou.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Registrar no documento quanto mediu, depois da correção, o pedaço mais lento do caso 1 e os dois pedidos do caso 3. Os três têm teto de 500 ms, rodam com a CPU ×4 e vão para a esteira, que nesta spec já mostrou ser duas vezes mais lenta que a máquina local. Hoje o documento diz que antes passava de 500 ms, mas não diz quanto sobra de folga com a rede livre. Se a folga for pequena, vira o próximo vermelho de tempo.
2. A asserção `descida.baixados > 100_000` (`e2e/pecas-galeria.spec.ts:158`) depende do tamanho do maior pedaço do bundle. Uma mudança no corte dos chunks a derruba sem relação com a regra. Vale um comentário dizendo de onde vem esse número, ou derivar o mínimo do perfil.
3. Em `pedidoNovo` (`e2e/pecas-galeria.spec.ts:124`), o filtro não exige `/assets/`, ao contrário de `duracaoDosPedacosDeJs`. É inofensivo hoje, mas o mesmo critério nos dois evita medir um `.js` de outra origem.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/tasks/correcoes/2026-10-16-pecas-sobrepor-estoura-o-prazo.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/__fixtures__/perfis.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/__fixtures__/galeria.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/pecas-galeria.spec.ts`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-16 12:41:51 · `tasks/correcoes/2026-10-16-pecas-sobrepor-estoura-o-prazo.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. Esta é uma correção que só mexe em teste. Ela não toca o produto nem a arquitetura, e o documento registra o que mudou na rodada.

Portão local: carimbo válido. Cobre typecheck, lint, segredo, dependências, unidade e alvo, e vale para o código atual.

Bloqueantes: nenhum.

As três recomendações da ordem da rodada 1 foram feitas:
1. O mínimo fixo de 100 kB virou `DESCIDA_MINIMA_DO_PERFIL_MS = 200`, que é o tempo do maior pedaço na descida do perfil (`e2e/pecas-galeria.spec.ts:151` e `:168`). A conta do comentário fecha:
   - no Fast 3G, 200 ms a 180 kB/s dão cerca de 36 kB;
   - no celular, com 600 ms de latência, o piso que distingue a vazão é de cerca de 150 ms, e 200 ms continua acima dele.
2. `pedidoNovo` usa o mesmo filtro `/assets/` de `duracaoDosPedacosDeJs` e troca o `sort` por `reduce` (`e2e/pecas-galeria.spec.ts:124-127`). Uma mutação nova, que inverte a comparação do `reduce`, cobre essa linha.
3. A folga dos tetos de 500 ms foi medida e registrada no documento (`tasks/correcoes/2026-10-16-pecas-sobrepor-estoura-o-prazo.md:40`): 44 ms no pior caso, em 12 execuções com CPU ×4. A tabela "Sem aplicar" foi copiada para "Recomendações sem aplicar".

Recomendações:
- `e2e/pecas-galeria.spec.ts:168`: o `perfil?.rede.downloadBytesPorSegundo ?? 1` faz a asserção passar sem medir nada quando falta o perfil. Hoje isso não chega a acontecer, porque a linha 170 já falha nesse caso dentro de `tempoMinimoDoPerfil`. Mesmo assim, ler a vazão por um auxiliar que falha igual, ou chamar `tempoMinimoDoPerfil` antes, tira o caminho que passa vazio.

## test-engineer · 2ª rodada · APROVADO · 2026-10-16 12:42:06 · `tasks/correcoes/2026-10-16-pecas-sobrepor-estoura-o-prazo.md`

VEREDITO: APROVADO

**Cenários exigidos (rodada 2, só o que mudou desde a rodada 1):**
- **Recomendação 1:** o mínimo da descida passa a vir do perfil, e não do tamanho do pedaço do build.
- **Recomendação 2:** `pedidoNovo` usa o mesmo filtro `/assets/` de `duracaoDosPedacosDeJs` e acha o maior pedaço sem `sort` no array do `filter`.
- **Recomendação 3:** o documento registra a folga medida dos tetos de 500 ms.
- A mudança em `pedidoNovo` precisa de bloco em "Mutações", porque o caso de descida depende dela.

**Cobertos:**
- **Recomendação 1, feita** (`e2e/pecas-galeria.spec.ts:151` e `:168`). `DESCIDA_MINIMA_DO_PERFIL_MS = 200` vale `baixados ÷ descida do perfil`. Conferi a conta com os perfis de `e2e/__fixtures__/perfis.ts:23-33`:
  - Com a descida livre, o piso de 80% só fica acima da latência se os bytes do perfil somarem mais de 140,6 ms no Fast 3G e 150 ms no celular. Os 200 ms cobrem os dois.
  - Na prática isso dá cerca de 36 kB no `chromebook` e 22,5 kB no `celular`. O caso só reclama se o corte dos chunks mudar muito, e a mensagem diz o motivo.
- **Recomendação 2, feita** (`e2e/pecas-galeria.spec.ts:124-127`). O filtro é o mesmo de `duracaoDosPedacosDeJs`, e o `reduce` não mexe no array.
- **Bloco novo em "Mutações"**: inverter a comparação do `reduce` (`>` para `<`) faz o caso escolher o menor pedaço, de 0,2 a 5 kB. Isso dá cerca de 1 a 28 ms de descida, abaixo dos 200 ms. O caso fica vermelho pelo motivo certo: é justamente a garantia que o `reduce` sustenta.
- **Recomendação 3, feita** (documento, linha 40). O pior caso medido foi 44 ms contra o teto de 500 ms, em 12 execuções com `--workers 2` e CPU ×4. São mais de dez vezes de folga, o que basta para um runner duas vezes mais lento.
- **O que não mudou segue como na rodada 1:**
  - nenhum `.skip`;
  - nenhum mock de coisa nossa;
  - nenhuma chamada a provedor de IA;
  - as asserções de tempo usam o perfil do projeto, com o piso fixo de latência.

Não rodei o e2e: não alterei nada, e o portão da tarefa já provou as mutações declaradas.

**Bloqueantes:** nenhum.

**Recomendações:**
- **`e2e/pecas-galeria.spec.ts:168`**: o `perfil?.rede.downloadBytesPorSegundo ?? 1` deixa essa asserção passar à toa quando não há perfil. Isso não esconde nada, porque `tempoMinimoDoPerfil` (linha 138) lança logo na linha 170. Mesmo assim, ler o perfil uma vez no começo do caso, falhando alto, deixa a intenção mais clara do que o `?? 1`.
- **Comentário de `DESCIDA_MINIMA_DO_PERFIL_MS` (linhas 145-150)**:
  - A conta cita só o Fast 3G (≈140 ms). No celular o limite é 150 ms, e vale citar.
  - No mínimo exato de 200 ms, o bloco do `downloadThroughput: -1` só fica vermelho se a sobra do pedido for menor que uns 47 ms. Hoje o maior pedaço passa bem do mínimo, então isso não pesa. Vale uma linha dizendo que o mínimo é o limite de detecção e não a margem de trabalho.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/e2e/pecas-galeria.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/tasks/correcoes/2026-10-16-pecas-sobrepor-estoura-o-prazo.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca/.processo/ordens/diff-pecas-sobrepor-r2.patch
