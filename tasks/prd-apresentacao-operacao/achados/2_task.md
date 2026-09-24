# Achados das revisões — `tasks/prd-apresentacao-operacao/2_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-23 21:01:12 · `tasks/prd-apresentacao-operacao/2_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- U3: a guarda de cor em `apps/web/src` aceita só os nomes do `@theme` da 9.9, com `white` e `black`. Ela reprova cor fora da lista, cor arbitrária e o modificador de opacidade `/NN`, e diz o arquivo e a classe.
- E5: o e2e do F1 continua verde na pele nova, em `chromebook` e `celular`.
- E5: o CSS servido tem os hex dos tokens e não tem `oklch(` nem `color-mix(`.
- O aviso de atenção aparece com fundo e borda visíveis.
- B1: a entrada acima de 150 kB reprova. A soma dos chunks acima de 150 kB, com a entrada abaixo, não reprova.
- Contraste AA em todas as telas do F1.
- A tarefa não tem cenário de permissão, isolamento nem concorrência: só muda a cor e o build, e o `2_task.md` já diz isso.

**Cobertos:**
- **U3:** `apps/web/src/estilos.test.ts` tem duas âncoras contra varredura vazia: `Botao.tsx` com `bg-caramelo`, e pelo menos 10 arquivos em `paginas/`. O fixture tem um caso de cada coisa que a guarda reprova: `amber`, `blue`, `neutral`, `text-foo`, `bg-[#1d4ed8]`, `/80`, `/50` e `/[.4]`. Tem também os casos que devem passar: `text-sm/6`, `border-b`, `shadow-flutua` e `bg-[url()]`. A saída sai com arquivo e classe. O teste também exige que `estilos.css` declare exatamente as 33 cores da 9.9, com o hex certo, e nenhuma outra. Se alguém recolocar a paleta antiga, esse teste falha.
- **E5, CSS servido:** `e2e/casca.spec.ts:286-304` confere os hex no CSS servido e reprova `oklch(`, `color-mix(`, `--color-(slate|blue|amber|red|emerald)-` e `@font-face`. Também exige as classes `pendente` e `erro` no CSS servido. Tirar o plugin do `vite.config.ts` derruba esse teste, porque o `color-mix()` do placeholder do preflight volta. Logo, a ligação do plugin está provada.
- **Plugin `apps/web/rebaixar-cor.ts`:** `apps/web/rebaixar-cor.test.ts` cobre quatro casos:
  - o preflight real;
  - o bloco dentro de `@media`;
  - uma `}` dentro de uma string;
  - CSS sem `color-mix()`, que sai igual.

  Cobre também a quebra do build quando sobra `color-mix()` ou `oklch()` fora de `@supports`. O arquivo roda pelo `**/*.test.ts` do projeto de unidade.
- **Aviso de atenção:** `e2e/casca.spec.ts:306-318` confere, pelo estilo calculado do aviso "entre de novo", o fundo `rgb(253, 240, 232)`, a borda de 1px sólida e o texto em `pendente`, e roda o axe. Sem a regra de CSS, o fundo sairia transparente e o teste falharia.
- **B1:** `tools/ci/tamanho-web.test.ts` roda o `.size-limit.json` real contra um build de mentira. Os casos:
  - entrada pequena passa;
  - entrada grande reprova;
  - 90 kB + 90 kB com a entrada abaixo passa, que era o caso que reprovava com `*.js`;
  - o par desse caso, com a entrada grande, reprova;
  - sem `index-*.js` no build, reprova.

  Conferi que o build real gera `index-<hash>.js`, então o glob pega a entrada de verdade.
- **Contraste AA:** `violacoesGraves` com as tags WCAG 2 AA já roda em todas as specs do F1: `casca`, `entrar`, `entrar-na-escola`, `convite`, `escola-e-vinculos` e `inatividade`. `guardas.spec.ts:36` prova que o axe reprova `color-contrast`.
- **Proibições:** não achei `.skip`, teste comentado nem mock que esconda a regra. Não sobrou `slate`, `blue`, `amber`, `red`, `emerald`, `#1d4ed8` nem `#0f172a` em `apps/web/src` nem em `e2e/`, fora das guardas.

**Bloqueantes:** nenhum.

**Recomendações** (nenhuma bloqueia):
1. **Borda de um lado só com cor.** Em `apps/web/src/estilos.test.ts:52`, `NAO_E_COR.border` não reconhece borda de um lado com cor, como `border-t-linha` ou `border-b-erro`. O valor `t-linha` é lido como cor desconhecida e a guarda reprova uma classe válida. O mesmo acontece com `ring-offset-<cor>`. Hoje nenhuma tela usa essas classes. Vale aceitar `[xytblrse]-<token>` como cor e conferir o token.
2. **Classe montada em tempo de execução.** A guarda não enxerga classe montada por interpolação, como `bg-${cor}`: o regex exige `[a-z0-9]` depois do hífen, e o caso passa em silêncio. Vale um caso no fixture, ou uma regra que reprove a interpolação no nome de classe de cor.
3. **Estilo calculado dos outros avisos.** O teste do estilo calculado cobre só o aviso `pendente` do `/mfa`. A família `erro` e os dois avisos que a tarefa cita, "este convite não vale mais" e "guarde estes códigos agora", ficam cobertos só pela presença da classe no CSS servido. Vale um caso com `getComputedStyle` para `erro-cx`.
4. **Estados que o axe não vê.** O axe não mede hover, pressionado nem o texto de exemplo do campo. Ficam sem prova:
   - o `::placeholder` em `sutil`, regra nova em `estilos.css:100-106`;
   - o botão secundário em `realce-suave` e `realce`;
   - o fundo do diálogo em `rgba(13, 13, 13, 0.75)`.

   Vale um e2e com o estilo calculado do placeholder, que é o único dos três que é texto.
5. **Glob `index-*.js`.** Qualquer chunk carregado por `import()` que saia de um arquivo `index.tsx` também se chama `index-*.js` e passaria a contar contra a entrada. O erro seria para o lado seguro: reprova a mais, não a menos. Na 10.0, com o `manualChunks` do operador, vale conferir o nome dos chunks.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/estilos.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/rebaixar-cor.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/rebaixar-cor.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/casca.spec.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/tamanho-web.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/.size-limit.json`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/estilos.css`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/vite.config.ts`

## revisor-geral · 1ª rodada · APROVADO · 2026-09-23 21:02:04 · `tasks/prd-apresentacao-operacao/2_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test, e2e)
Bloqueantes: nenhum

**Escopo e Tech Spec.** A tarefa cumpre as seis subtarefas. As telas do F1 seguem a tabela da seção 9. A paleta antiga saiu do `@theme`. O teste de fonte aceita só os 33 nomes da 9.9 e reprova o modificador `/NN`. O e2e confere os hex no CSS servido e reprova `oklch(`, `color-mix(` e `@font-face`. O teto de 150 kB passou a medir só a entrada (`index-*.js`), e um teste prova os dois lados.

A tarefa foi além do previsto em alguns pontos, todos registrados em "Divergências resolvidas nesta tarefa", nenhum deles em silêncio:
- o plugin `apps/web/rebaixar-cor.ts`, ligado no build pelo `vite.config.ts`;
- o `@source not` para os arquivos de teste;
- a marca no lugar de "Educa.ia" e o `<title>` "Turmma";
- três ajustes em `componentes/`, que eram recomendações da 1.0.

O plugin é o "rebaixar para cor fixa" que a 9.9 do `docs/interface.md` já previa. A tarefa não adiantou nada da 10.0: nem `manualChunks`, nem chunk ou telas do operador.

Recomendações:
- **Guarda com falso positivo.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/estilos.test.ts`: a lista `NAO_E_COR` reprova `bg-transparent`, `text-current`, `border-transparent` e `*-inherit`. Esses valores não são token nem cor fixa da paleta, e hoje não quebram porque nenhuma tela os usa. Vale incluí-los na lista antes que alguém tente um e ache que a guarda está errada.
- **Glob do orçamento.** `/home/joaquimdp/Documentos/git/Educa.ia/.size-limit.json`: o `index-*.js` também pega um chunk carregado por `import()` que venha de um arquivo chamado `index.tsx`, porque o Vite também o nomeia `index-<hash>.js`. A 10.0 precisa garantir o nome `operacao-*` pelo `manualChunks`. Senão o chunk do operador volta a contar contra os 150 kB, que é o oposto do que esta tarefa quer.
- **Plugin.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/rebaixar-cor.ts`: o `fimDoBloco` pula strings, mas não trata aspas escapadas (`\"`). Com o CSS que o Tailwind gera hoje isso não acontece. Um comentário dizendo essa premissa, ou um caso no teste, deixaria isso claro.
- **Cabeçalho repetido.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Casca.tsx` e `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Entrar.tsx` agora repetem, linha a linha, o `<header>` com `<Marca />` do `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/CascaPublica.tsx`. Um componente de cabeçalho público evitaria que as três cópias se afastem com o tempo.
- **Nome antigo em fixture.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/etapas-do-login.test.ts:158` ainda usa `otpauth://totp/Educa.ia:...`. Não afeta nada, porque a URI vem da API. Fica para a renomeação técnica da D54.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-09-23 21:02:18 · `tasks/prd-apresentacao-operacao/2_task.md`

VEREDITO: APROVADO

Estados: ok. Esta tarefa troca só a cor. Carregando, vazio, erro e com dado continuam nas telas de antes (`EstadoCarregando`, `EstadoErro`, `EstadoVazio`), e nenhum texto de erro mudou. Os erros seguem dizendo o que fazer, sem código nem status.

Acessibilidade: ok. Conferi o contraste dos pares novos:
- `pendente` sobre `pendente-cx`: 6,8:1
- `erro` sobre `erro-cx`: 5,7:1
- `caramelo-texto` sobre branco: 5,1:1, e 4,6:1 sobre `realce-suave` no hover
- botão primário com texto `tinta` sobre `caramelo`: 6,4:1
- o texto `inativo` (3,2:1) aparece só em controle desligado, que o WCAG isenta.

O foco visível global continua em `estilos.css` (2 px em `noite`). Os campos seguem com rótulo. A marca usa `alt=""` com o nome "Turmma" em texto ao lado, então o leitor de tela lê o nome uma vez só. O `<title>` passou a "Turmma", conforme a D54. O e2e novo em `/mfa` confere o fundo, a borda e a cor calculados do aviso de atenção e roda o axe. É o caso que tinha sumido sem aviso no F0.

Chromebook fraco: ok.
- A paleta ficou só em hex. O plugin `apps/web/rebaixar-cor.ts` tira os blocos `@supports (color: color-mix(...))` e para o build se sobrar `color-mix()` ou `oklch()`.
- O e2e reprova `oklch(`, `color-mix(`, `@font-face` e qualquer resto da paleta antiga no CSS servido.
- O fundo do diálogo ficou em `rgba()` literal.
- O orçamento de 150 kB brotli agora mede só a entrada `index-*.js`. Os testes em `tools/ci/tamanho-web.test.ts` provam os dois lados: a entrada acima do teto reprova, e um chunk carregado por `import()` fica de fora da conta.
- Nenhuma fonte, animação ou imagem nova. O SVG da marca tem 24 px.

Celular: ok. O layout, os tamanhos e a quebra de linha não mudaram. Os alvos de toque seguem em `min-h-11` (44 px), e nada novo depende de hover, porque todo hover tem o pressionado equivalente. O test-engineer relata o e2e verde nos projetos `chromebook` e `celular`.

Ação oficial protegida: sim. A contestação de vínculo continua mostrando o efeito antes de confirmar (`Vinculos.tsx:206`), agora na caixa `pendente`. Nenhum fluxo mudou.

Bloqueantes: nenhum.

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/SeletorDeEscola.tsx:86`: o `hover:`/`active:` está sem `enabled:`. Com o item desligado ("Abrindo…"), ele ainda ganha realce no hover e no toque. Vale o mesmo padrão `enabled:` já usado em `EscolherEscola.tsx` e `Vinculos.tsx`.
2. O botão secundário está escrito à mão em três lugares (`Vinculos.tsx:132`, `Vinculos.tsx:220`, `EntrarNaEscola.tsx:179`), e o link com cara de botão primário em dois (`ConfigurarMfa.tsx:178`, `SemDesafio.tsx:19`). Um `BotaoSecundario` e um link primário em `componentes/` evitam que a pele volte a divergir na A1.
3. `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/rebaixar-cor.ts:24`: ao percorrer uma string, a função `fimDoBloco` não trata aspas escapadas (`content:"\""`). O risco é baixo com o CSS que o Tailwind gera, mas um caso no teste deixaria isso registrado.
4. Nenhum teste prova que o texto de exemplo do campo sai em `sutil` depois que o build tira o bloco do preflight. Uma asserção de `getComputedStyle(campo, '::placeholder').color` no e2e cobriria a regra de `estilos.css`.

Arquivos principais auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/estilos.css`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/estilos.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/rebaixar-cor.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/casca.spec.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/tamanho-web.test.ts`
- as dez telas em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/`
