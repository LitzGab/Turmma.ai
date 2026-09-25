# Achados das revisões — `tasks/prd-apresentacao-painel/8_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-25 09:23:16 · `tasks/prd-apresentacao-painel/8_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **W5 (unidade):** número pt-BR com zero e milhar. Bytes com 0, 1 e 1.023 bytes, a virada para KB, "1,2 GB", a base 1024 e a virada de unidade no arredondamento. O dia sem fuso, o mês na virada do ano e no dia 1, e os rótulos.
- **W6 (e2e, `chromebook` e `celular`):** 30 escolas. Página e ordem na barra, sobrevivendo à recarga. `placeholderData` durante a troca. Cada medida na sua coluna. Sem rolagem a 360 px. Alvos de 44 px.
- **W7 (e2e, dois projetos, axe em todos):** carregando, vazio com o link para Escolas, 503 com "Tentar de novo", com dado. Também o 503 com o dado já na tela e a página além da última.
- **Referência:** a data e o mês mostrados são os que a API devolveu, não os de hoje no navegador. Inclui a virada de ano e o fuso de São Paulo.
- **Criar escola invalida o cache do Uso:** a escola nova aparece com zero.
- **Contrato:** a resposta com um campo de pessoa a mais, ou sem o dia de referência, não chega à tela.
- **Permissão:** o operador sem sessão não lê o Uso.
- **Isolamento:** não se aplica a esta tela. O painel é agregado por escola, sem pessoa, e o filtro de campo de pessoa é o teste de contrato acima.

**Cobertos:**
- **W5:** `apps/web/src/operacao/formatos.test.ts`. O caso do fuso no dia e no mês não seria pego no Vitest em UTC, mas o e2e de referência pega. Ele roda com `timezoneId: America/Sao_Paulo`, e `2025-12-31` lido por `new Date` sairia "30/12/2025", ficando vermelho.
- **W6:** `e2e/operacao-uso.spec.ts:85-177`. A troca de colunas de jobs e bytes é pega por `comMedidas`. A troca de dia e mês é pega no teste de referência (`:280`), que usa valores diferentes para o dia e para o mês.
- **W7:** `:179-264`.
- **Referência:** `:266-307`.
- **Invalidação:** `:309-344`. Conferi a mutação que vocês descreveram: o relógio fica parado e o `staleTime` de 30 s não vence sozinho.
- **Contrato e chaves de cache:** `apps/web/src/operacao/api/painel.test.ts:102-137`. Uso e lista têm chaves separadas, e o prefixo `CHAVE_DO_USO` é o que a criação invalida.
- **Permissão:** coberta no servidor, pelo `GET /v1/operacao/uso` em `apps/api/test/rotas-registradas.ts:124`, da 5.0.

Nenhum `.skip`, `.only`, teste comentado ou mock que esconda a regra. O mock de rota só troca a data de referência e as medidas, para provar que a tela lê o que a API devolveu.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Risco de teste instável no W6** (`e2e/operacao-uso.spec.ts:118-121`; o mesmo padrão existe em `e2e/operacao-escolas.spec.ts:93`).
   - Com `fullyParallel`, dois specs e dois projetos, até 4 `semearPainel` podem rodar ao mesmo tempo, com 8 escolas de uso alto cada: 32 escolas para uma primeira página de 25.
   - Cada semeadura posterior passa na frente das anteriores, porque o valor de uso cresce com o relógio. A primeira a semear pode perder escolas da página 1, e o `posicoes.every(p >= 0)` fica vermelho.
   - Correções possíveis:
     - (a) Conferir só a `longa` e a `comMedidas`, e dar uso alto só a elas no seed.
     - (b) Rodar os dois W6 em série, com `test.describe.configure({ mode: 'serial' })` num grupo comum.
     - (c) Achar as escolas do teste pela resposta, e não por página fixa.
2. **Permissão também na tela:** incluir um e2e curto que abra `/operacao/uso` sem sessão e espere `/operacao/entrar`. O servidor já recusa, mas a rota nova depende de estar dentro do `Protegida` (`apps/web/src/operacao/rotas.tsx:103-109`), e nada na web prova isso.
3. **"Anterior" no Uso:** o botão não é acionado em nenhum teste. Ao voltar da página 2 para a 1, conferir a barra e os nomes. Custa pouco, porque o W6 já está na página 2.
4. **Entrada fora do formato:** `formatarDia` e `formatarMesDeReferencia` devolvem o texto cru quando a entrada não bate com o formato (`apps/web/src/operacao/formatos.ts:44,57`), e nenhum teste cobre isso. Vale um caso só, ou tirar o caminho, já que o esquema da resposta já valida o formato.
5. **Asserção fraca na referência** (`e2e/operacao-uso.spec.ts:290`): `not.toContainText(hojeNoNavegador)` é redundante com o `toContainText` exato da linha 287. Não é erro; a linha 287 é a asserção que prova a regra.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-uso.spec.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/formatos.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/api/painel.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/painel.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Uso.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/NovaEscola.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/NavegacaoDaLista.tsx`

## test-engineer · 2ª rodada · APROVADO · 2026-09-25 09:39:52 · `tasks/prd-apresentacao-painel/8_task.md`

VEREDITO: APROVADO

Cenários exigidos (rodada nova, só o diff de teste): as quatro recomendações que foram aplicadas, conferidas contra o que cada uma pedia. O código de produção não mudou desde a 1ª rodada, então não reauditei a tela.

Cobertos:
1. **W6 com as duas escolas do seed**, em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-uso.spec.ts:118-129`. Resolve o risco de instabilidade apontado na 1ª rodada. O teste continua provando:
   - que as duas escolas do seed são exatamente a `longa` e a `comMedidas` (`:120`);
   - que as duas estão na primeira página e na ordem relativa certa (`:122-123`);
   - que cada medida aparece na sua coluna, no formato certo. Na `comMedidas`, "1.234" e "1,2 GB"; na `longa`, "0" e "0 bytes".

   Os testes que rodam em paralelo não conseguem mais tirar essas duas escolas da primeira página. Se a ordenação por uso sair, a asserção de ordem quebra.
2. **"Anterior" depois da recarga**, em `:180-187`. Confere quatro coisas: a URL `?pagina=1&ordem=uso`, os nomes na tela iguais aos da resposta nova, as duas escolas do teste nessa página e o botão "Anterior" desligado. O teste falharia se "Anterior" perdesse a ordem da barra ou não voltasse à página 1.
3. **Sem sessão**, em `:190-200`. O teste é efetivo porque os pedidos são contados por `page.on('request')` com o predicado exato de `/v1/operacao/uso` (`:17`). Se a guarda de sessão sair, a página pede o uso antes de ser redirecionada por um 401, e o `pedidosDoUso` passa a 1, o que derruba o teste. O redirecionamento para `/operacao/entrar$` e a ausência de tabela também estão conferidos.
4. **Referência fora do formato**, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/formatos.test.ts` (o caso novo antes dos rótulos). Sem o `return dia` de `formatos.ts:43`, `formatarDia('23/09/2026')` devolveria `"//"` e o teste falharia.

Não há `.skip`, teste comentado nem mock que esconda regra no diff. A tarefa não chama IA nem tem operação concorrente nova.

Bloqueantes: nenhum.

Recomendações:
- O título do caso novo em `formatos.test.ts` diz "volta como veio, sem quebrar a tela", mas o teste só prova a referência sem hífen. Em `apps/web/src/operacao/formatos.ts:56-57`, a guarda confere `undefined` e deixa passar `NaN`. Com `mes: '2026-xx'` ou `'setembro-2026'`, os dois valores ficam definidos, `Date.UTC` dá uma data inválida e `Intl.DateTimeFormat.format` lança `RangeError`. O contrato da API recusa esse formato antes, por isso isto não bloqueia. Há dois caminhos:
  - restringir o título do teste ao caso sem hífen;
  - ou, numa tarefa futura que mexa em `formatos.ts`, guardar com `Number.isInteger` e acrescentar esses dois casos ao teste.
- A recomendação 5 da 1ª rodada (a asserção redundante do "hoje no navegador") ficou como está, conforme combinado. Fica registrada para o `/validar`.

## test-engineer · 3ª rodada · APROVADO · 2026-09-25 09:55:08 · `tasks/prd-apresentacao-painel/8_task.md`

VEREDITO: APROVADO

Esta rodada cobre só o diff desde a 2ª rodada, que tinha sido aprovada sem bloqueantes. O resto da tarefa não mudou e eu não auditei de novo.

Cenários exigidos (desta rodada):
- Um mês de referência fora de `AAAA-MM` não derruba a tela.
- Isso inclui o formato com hífen mas sem número de mês (`2026-xx`, `setembro-2026`) e o mês fora da faixa (`2026-13`).
- O caminho feliz continua igual, inclusive na virada do ano e no mês anterior inteiro.

Cobertos:
- **A recomendação da 2ª rodada foi aplicada.** Antes, o código fazia `split('-').map(Number)`. Agora ele valida com `FORMATO_DO_MES = /^(\d{4})-(0[1-9]|1[0-2])$/` e devolve o texto como veio quando não bate (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/formatos.ts:48-61`).
- **O teste falharia sem a regra.** As três asserções novas estão em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/formatos.test.ts:59-61`.
  - `2026-xx` e `setembro-2026` lançariam `RangeError` com o código antigo, porque `Date.UTC(NaN, …)` monta uma data inválida e o `Intl` lança ao formatá-la.
  - `2026-13` não lançaria erro, mas o `Date.UTC` passaria para o ano seguinte e o texto sairia "janeiro de 2027". A asserção `'2026-13, até 23/09'` também pegaria isso.
  - Em todos os casos o teste confere o texto exato, não só que a função rodou.
- **O caminho feliz continua coberto** (`formatos.test.ts:46-53`): setembro, dezembro, janeiro na virada do ano e fevereiro até o 28. O dia 15 em UTC continua protegendo o mês contra deslocamento de fuso.
- Rodei `formatos.test.ts` isolado agora: 8 de 8 passaram. Não há `.skip`, mock nem chamada a provedor de IA.

Bloqueantes: nenhum.

Recomendações:
- Um ano de `0000` a `0099` bate na expressão, mas o `Date.UTC` o joga para 1900+ (`0026-09` sairia "setembro de 1926"). O contrato já recusa esse formato, então não é bug hoje. Se quiserem fechar o caso, dá para exigir o ano a partir de 1000 na expressão ou usar `setUTCFullYear`. Fica registrado para o `/validar`.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-25 09:56:20 · `tasks/prd-apresentacao-painel/8_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test, e2e)
Bloqueantes: nenhum

Recomendações:
- **Vazio do Uso copia o componente comum.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Uso.tsx:114-129`: o `VazioDoUso` repete a marcação do `EstadoVazio` (`apps/web/src/componentes/estado/EstadoVazio.tsx`). O `Link` dele repete as classes do `Botao` à mão, sem o `enabled:` e com o risco de divergir quando a pílula mudar. É um segundo jeito de fazer o vazio. O melhor é o `EstadoVazio` aceitar uma ação do tipo link, ou haver um `LinkDeAcao` com as mesmas classes do `Botao`.
- **Parágrafo da seção 9 da Tech Spec sem quebra de linha.** `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/techspec.md:184-186`: o parágrafo inserido saiu numa linha longa, fora da largura do resto do documento. É só forma.
- **O e2e da escola nova não apaga o que cria.** `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-uso.spec.ts:332-367`: a rede do `criarRedeDoPainel` e a escola criada pela tela ficam no banco de teste depois da suíte. É o mesmo padrão do `operacao-escolas.spec.ts`. As duas últimas correções (L4 e consolidação) nasceram de banco acumulado ou de escola que sumiu, então vale limpar as duas no `afterEach`.
- **Rótulo do seletor de ordem.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/NavegacaoDaLista.tsx:384-386`: o `aria-label` "Ordenar as escolas por" fica fixo. As páginas já recebem `rotulo` por prop, e a ordem podia receber também, para o Uso anunciar algo como "Ordenar o uso por". Não é erro: a ordem é mesmo das escolas.

Os três tipos de vazio estão certos: API com zero escolas, página além da última e erro com dado anterior na tela. A data mostrada vem da resposta da API e não do relógio do navegador. As divergências estão declaradas no `8_task.md` e registradas na seção 9 da Tech Spec: base 1024, peças de navegação levadas para `NavegacaoDaLista.tsx` e invalidação do `CHAVE_DO_USO` ao criar escola. A mudança em `Escolas.tsx` só troca código por essas peças, sem mudar o comportamento. A tarefa 9.0 não foi tocada.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-09-25 09:56:48 · `tasks/prd-apresentacao-painel/8_task.md`

VEREDITO: APROVADO

**Estados:** ok. Os quatro estão em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Uso.tsx:164-187`:
- **Carregando:** "Carregando o uso das escolas…".
- **Erro:** mostra `ErroDaOperacao` com "Tentar de novo". Se o dado já estava na tela, a mensagem aparece em cima e o dado fica.
- **Vazio:** convida a agir, com "Nenhuma escola ainda.", a explicação e o link "Ir para Escolas", do tamanho da ação principal.
- **Com dado:** a tela normal.
- **Página além da última:** tem vazio próprio, com o caminho de volta à primeira página.

O e2e passa por todos, com axe e sem rolagem horizontal em cada um. O 503 aparece como "O Turmma está indisponível agora. Tente de novo em instantes.", e o código numérico não vaza.

**Acessibilidade:**
- **Botões e links:** todos nativos. O foco visível vem do `:focus-visible` global, inclusive na faixa escura.
- **Ordem e navegação:** o seletor de ordem usa `aria-pressed`, então a escolha não depende só da cor. A navegação usa `aria-current="page"`, com sublinhado.
- **Tabela:** tem `caption` e `th scope="row"` por escola. Os títulos dos dois períodos usam `scope="colgroup"`, com a data que a API devolveu.
- **Cartões:** usam `h2` por escola, `h3` por período e `dl` com `dt`/`dd`.
- **Troca de página:** é anunciada por `role="status"` e `aria-busy` na seção.
- **Título da aba:** "Uso · Operação Turmma".
- **Axe:** sem violação grave nos dois projetos, em todos os estados.

**Chromebook fraco:**
- A lista é paginada de 25 em 25 na query string, com `placeholderData`: a página anterior fica na tela enquanto a nova chega. Com isso, a virtualização não faz falta.
- O chunk `operacao-*` ficou com 15,9 kB brotli e a tela não tem imagem.
- O e2e roda com CPU 4 vezes mais lenta e Fast 3G (`/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/perfis.ts:37`).
- O dia é lido do texto `AAAA-MM-DD` que a API devolve, sem passar por `Date`. O mês é montado no dia 15 em UTC, então nenhum fuso do navegador muda o mês mostrado. O e2e de referência prova isso com o fuso de São Paulo e a virada do ano.

**Celular:**
- Abaixo de 640 px, cada escola vira um cartão, com o dia e o mês empilhados.
- O e2e confere, no projeto `celular`, que não há rolagem horizontal a 360 px em cada estado.
- Os alvos de toque têm 44 px: Próxima, Nome, Mais uso no mês, os dois itens da navegação e "Ir para Escolas".
- Nada depende de hover ou de atalho, e nenhum fluxo exige o celular.

**Ação oficial protegida:** não se aplica. A tela só lê números por escola e não tem ação oficial. A criação de escola continua com a revisão antes de confirmar (`NovaEscola.tsx`), e agora também invalida o cache do Uso.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Números longos podem quebrar no meio entre 640 e cerca de 760 px** (`Uso.tsx:39` e `:75`).
   - Nessa faixa a tabela `table-fixed` deixa uns 59 a 66 px de texto por coluna numérica, e o `td` tem `wrap-anywhere`.
   - Um total do mês com oito dígitos, como "12.345.678", pode sair "12.345.67" numa linha e "8" na seguinte. Lendo, parecem dois números.
   - Essa faixa aparece num tablet em pé ou num Chromebook com zoom de 200%. Nenhum projeto do Playwright a cobre.
   - Opções: trocar `wrap-anywhere` por `whitespace-nowrap` nos `td` numéricos, deixando a tabela rolar dentro de um contêiner próprio; ou subir a troca entre cartão e tabela para `md`.
   - É uma estimativa pela conta das larguras; não medi na tela.
2. **O seletor de ordem aparece no vazio e no erro sem dado** (`Uso.tsx:160-162`). "Nome" e "Mais uso no mês" sem nada para ordenar são ruído. A tela Escolas faz o mesmo, então a correção pode valer para as duas.
3. **Associação explícita das células com o período:** num `td` do mês, alguns leitores de tela anunciam só "Requisições", sem o período. Um `headers` em cada `td`, com o id do título do período e da medida, deixa isso certo em todos os leitores. O axe não acusa, por isso não bloqueia.
4. **Termos técnicos no texto:** "infra" (no `caption`) e "consolidação" (no parágrafo da referência) são termos de dentro. Aqui o público é só a equipe Turmma, então servem. Se a tela algum dia for mostrada à coordenação, pedem outra redação.
