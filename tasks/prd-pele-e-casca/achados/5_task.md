# Achados das revisões — `tasks/prd-pele-e-casca/5_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-13 13:40:37 · `tasks/prd-pele-e-casca/5_task.md`

VEREDITO: APROVADO

Tela vista: sim (46 fotos lidas, cheia e vazia). Li a galeria em claro e escuro, no computador e no celular (seções Superfícies, Formulário e Tabela), a governança em claro, escuro e vazia, e `/professor/turmas` cheia e vazia. As fotos batem com o código da árvore.

Estados: ok. A tarefa mexe em peças de apresentação, que não carregam nem falham sozinhas. Os estados das telas que as usam não mudaram. A governança vazia convida com o próximo passo ("Quando um professor pedir uma versão adaptada…", "Quando um professor conversar com o Assistente…").

Acessibilidade: ok pelo código e pelo e2e escrito (não rodei o e2e).
- A `Linha` é um único alvo (`<a>` ou `<button type="button">`), com título, segunda linha e selo no nome acessível. Sem ação, vira `div` sem chevron e sem parada no Tab. O chevron é `aria-hidden`.
- O anel de foco é `-outline-offset-3` por dentro da moldura (`Linha.tsx:28`). O e2e confere 3 px, `foco` e afastamento `-3px` nos dois temas.
- A `Tabela` mantém `caption`, `th scope` e a região com foco e nome só quando há sobra. A lista usa `dt` e `dd`.
- A `BarraRotulada` continua `aria-hidden`, com o valor escrito ao lado.
- Há teste axe nos dois temas e projetos para as cinco seções.

Chromebook fraco: ok.
- Não há sombra borrada, vidro nem animação nova.
- A `Linha` fica fora da entrada (`nome-dos-chunks.ts:109`), e o orçamento medido fecha em 128,2 kB no primeiro carregamento.
- A `Tabela` mantém uma estrutura por vez no DOM.
- A barra presa tem fundo cheio.

Celular:
- Sem rolagem horizontal nem texto cortado a 360 px em nenhuma foto.
- A `Linha` tem 64 px de altura mínima, acima dos 44 px.
- A tabela vira cartões com 2 px de borda. Quando a tabela estreita não cabe, a região rola dentro dela.
- Nada depende de hover: o realce é só reforço, e o `title` é complemento.
- `ABRIR A TURMA` e `ABRIR DADO NOMINAL` têm 44 px ou mais.

Ação oficial protegida: sim. A tarefa não cria nem altera ação oficial. O botão `Aprovar 32 correções` da galeria continua desligado, com o resumo "3 de 5 destaques abertos" à vista. A tabela "O que a IA gerou e quem aprovou" segue sem edição de regra.

Bloqueantes: nenhum.

Recomendações (não bloqueiam, ficam para o `/validar` e o `/retro`):
1. **Cartão de 1 px ao lado de 2 px.** Em `/coordenacao/governanca`, o caixa "Consumo do mês por função" e o cartão "Suas turmas" (`/professor/turmas`) seguem com 1 px de borda `linha`. Ficam ao lado de `NumeroPainel`, tabela e `Cartao` de 2 px. A tarefa manda não converter os 46 cartões escritos à mão, então o resultado é conforme, mas visível: converter na spec da área.
2. **Título truncado no toque.** `Linha.tsx:44` corta o título em uma linha e guarda o texto inteiro só em `title`, que é hover. No celular, o "Relatório de laboratório sobr…" da galeria não se lê inteiro. O nome acessível está certo e a especificação manda reticências, mas a primeira tela real que usar a `Linha` precisa garantir que o título completo apareça na tela de destino. Vale uma linha em `docs/interface.md` 10.2.
3. **Chevron em `apagado`.** O chevron do fim (`Linha.tsx:47`, `text-apagado`) dá cerca de 2,3:1 no claro. É decoração e `aria-hidden`, então não reprova. Vale reavaliar se um dia ele passar a carregar significado.
4. **Trilho da `BarraRotulada` fora do mockup.** O trilho segue `ia-cx`, e não `borda`, por manter os dois e2e de barra neutra sem edição. A divergência está declarada na tarefa e em `docs/interface.md` 10.2, marcada "(produto)". Revisitar quando alguém mexer nessas duas asserções.

Arquivos principais:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Linha.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Tabela.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Cartao.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/NumeroPainel.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/BarraRotulada.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/BarraPresa.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/galeria/secoes/superficies.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/pecas-superficies.spec.ts`

## revisor-geral · 1ª rodada · APROVADO · 2026-10-13 13:40:49 · `tasks/prd-pele-e-casca/5_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum

O que conferi:
- **Escopo.** As subtarefas 5.1 a 5.5 estão feitas. Nada da X2 entrou: a `Tabela` não ganhou linha clicável nem ordenação. A barra presa acima da barra de baixo (13.0) também não entrou, e nenhum cartão escrito à mão foi convertido. A `Linha` não chega a nenhuma tela; só a galeria a importa.
- **Divergências.** As sete do `5_task.md` estão registradas onde a seção 2 pede:
  - A barra neutra, que continua com `ia-cx` e `sutil`, sem `progressbar` nem `scaleX`: está em `techspec.md` §9 "Desvios do mockup", em `cenarios.md` A56, A78 e no item 6 de "O que ficou em aberto", e em `docs/interface.md` 10.2.
  - O `divide-y-2` vir da moldura que junta as linhas: está em `techspec.md` §9 e em `docs/interface.md` 10.2.
  - A expressão `^Aluno:` que não muda: está em `cenarios.md` A79. `professor-turma.spec.ts` e `aluno-tutor.spec.ts` não foram tocados.
  - Tipografia, arquivos fora da lista e seções da galeria seguem o que a 9.2 e a §9 já diziam.
- **Testes existentes.** No `e2e/pecas-superficies.spec.ts`, a única linha removida é a do import, refeita com mais nomes. Nenhum caso existente perdeu asserção.
- **Regras 40 e 60.** Não há `.skip`, `any` nem `TODO` nos arquivos novos. A galeria usa nomes inventados e o vocabulário do glossário.
- **Fotos.** A seção "Superfícies", no claro, no escuro e a 360 px, mostra borda de 2 px sem sombra e o rótulo do número em caixa-alta. A barra continua cinza, também cheia e vazia. As quatro formas da `Linha` aparecem, e o selo desce para baixo do título no celular. A governança mostra a tabela na pele nova e com os mesmos textos. `/professor/turmas` continua com o cartão escrito à mão, como a tarefa manda.

Recomendações:
1. O comentário de `apps/web/src/componentes/Cartao.tsx:16-19` agora cita a 10.2 e diz "20 px a partir de 1024 px", mas a 10.2 e a 9.3 da `docs/interface.md` (linhas 876 e 1369) dizem 768 px. O código usa `lg:p-5`, o mesmo de `NumeroPainel.tsx:22` e dos cartões escritos à mão. Vale escolher um dos dois: passar o documento para 1024 ou abrir o assunto na tarefa que unifica os cartões. Hoje o comentário contradiz o documento que ele cita.
2. A edição em `tasks/prd-pele-e-casca/techspec.md:137-139` deixou uma linha muito mais longa que as vizinhas. Quebrar a linha deixa o próximo diff mais fácil de ler.
3. Em `apps/web/src/componentes/Linha.tsx:439`, `miolo(acionavel)` é uma função montada a cada render só para decidir se o chevron aparece. Um componente interno, ou o JSX com `acionavel` calculado antes, lê mais direto.
4. `e2e/pecas-superficies.spec.ts`: o caso "a tabela que não cabe rola dentro dela" tem o comentário "nenhuma das duas faz a página rolar de lado", mas logo abaixo afirma o `tabindex` da tabela que cabe. A largura excedente só é conferida depois do `if`. Trazer o comentário para perto da asserção que ele descreve.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Cartao.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Linha.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/pecas-superficies.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/docs/interface.md

## test-engineer · 1ª rodada · REPROVADO · 2026-10-13 13:41:20 · `tasks/prd-pele-e-casca/5_task.md`

**VEREDITO: REPROVADO**

**Cenários exigidos**
- **Caminho feliz:** cartão, número de painel, tabela e as duas barras com borda de 2 px e sem sombra, nos dois temas. A linha funciona como link, como botão e só de leitura.
- **Casos de borda:**
  - título comprido;
  - barra vazia, no meio e cheia;
  - tabela que não cabe na largura;
  - linha só de leitura no meio da lista (o Tab pula ela);
  - `fim` com selo a 360 px;
  - virada para lista abaixo de 768 px.
- **Permissão e isolamento:** não se aplicam. A peça não tem servidor nem dado de escola, e a tarefa diz isso.
- **Concorrência, recomeço e log:** não se aplicam, pelo mesmo motivo.
- **Regressão:** `aluno-tutor`, `professor-turma`, `governanca`, `estrutura` e `professores` continuam sem edição.

**Cobertos**
- Os quatro arquivos de componente passam: 51 testes, conferidos com `npx vitest run`.
- Os 39 blocos de mutação, um a um, chegam à cláusula que dizem tirar: cada asserção citada lê exatamente a classe ou o atributo trocado.
- O `git diff` confirma o seguinte:
  - Nenhum e2e de regra foi editado: `aluno-tutor`, `professor-turma`, `governanca`, `estrutura` e `professores` estão fora do diff.
  - O `pecas-superficies.spec.ts` só ganhou casos. Nenhuma asserção antiga saiu.
- O e2e prova nos dois temas, com o valor do token lido no navegador:
  - a borda;
  - o canto;
  - a ausência de sombra;
  - o `fill` neutro das barras, com 12 px;
  - o anel de 3 px com −3 px, dentro da moldura;
  - o fio do `divide-y-2`;
  - a análise do axe nas cinco seções.
- Também estão cobertos:
  - um focável por linha;
  - o Enter e o Espaço acionando o botão;
  - a linha de leitura sem foco e sem chevron;
  - 64 px de altura, e 44 px ou mais no toque;
  - reticências com o `title`;
  - a região que rola só quando sobra;
  - a página sem rolagem lateral;
  - o degrau cabendo na barra presa.
- Não há `.skip`. Os mocks são só de API do navegador (`matchMedia`, `ResizeObserver`, `scrollWidth`) e não escondem regra nossa.

**Bloqueantes**
1. **`apps/web/src/componentes/Linha.tsx:52`: o título em `t-cartao` não tem bloco de mutação.** É regra da `docs/interface.md` 10.2 ("Título em `t-cartao`"). O bloco que existe (`5_task.md:301-306`) tira só o `truncate`. O teste `Linha.test.tsx:118` afirma a classe, mas nenhum bloco a prova. O `Cartao` tem o bloco equivalente, e a `Linha` não.
   - **Correção:** acrescentar um bloco que troque `className="t-cartao truncate text-tinta"` por `className="truncate text-tinta"`, com o teste `Linha.test.tsx › o título é de uma linha`.
2. **`apps/web/src/componentes/Linha.tsx:24`: o `w-full` da `CAIXA` não tem bloco.** É o que faz "a linha inteira é um alvo" valer no `<button>`. O `<a>` com `flex` já ocupa a largura toda, mas o `<button>` não, mesmo com `display: flex`. O bloco de `5_task.md:280-285` tira o `min-h-16` e deixa o `w-full`. O e2e de largura (`e2e/pecas-superficies.spec.ts`, caso "alvo de toque", `daLinha.width`) mede só o link, então sem o `w-full` o botão encolheria e o e2e não veria. Só a asserção de classe em `Linha.test.tsx:137` pega isso, e nenhum bloco a prova.
   - **Correção:**
     - acrescentar um bloco que troque `flex min-h-16 w-full min-w-0` por `flex min-h-16 min-w-0`, com o teste `Linha.test.tsx › a linha tem 64 px no mínimo`;
     - no e2e, medir a largura também da linha que é botão (`linhasDaLista(page).nth(1).getByRole('button')`).

**Recomendações**
- O "chevron de 20 px" da 10.2 (`size-5`, `Linha.tsx:59`) não é afirmado em teste nenhum: nem a classe no componente, nem a medida no e2e.
- "`para` **ou** `aoAcionar`" só vale pelo tipo (`never`), e nada prova isso. Um `// @ts-expect-error` num `<Linha para="/a" aoAcionar={…} />` dentro de `Linha.test.tsx` faria o typecheck do portão provar a exclusão.
- O e2e "o Enter e o Espaço acionam a linha que é botão" só aperta Enter. Ou ele aperta também o Espaço, ou o nome deixa de prometer isso. O teste de componente já cobre o Espaço.
- Nada impede um clicável dentro do `fim` ou do `inicio`: a regra está só no comentário. Um aviso em desenvolvimento, ou um caso de componente que documente a fronteira, deixaria isso escrito em código.
- O `rgbDoToken` compara com o valor do próprio token. Se o `borda` estivesse errado no tema escuro, o teste passaria. É aceitável aqui, porque o valor do token é da 2.0.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Linha.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Linha.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Tabela.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Superficies.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/pecas-superficies.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/5_task.md`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-13 13:52:13 · `tasks/prd-pele-e-casca/5_task.md`

```
VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum
Recomendações:
- Linha.tsx:32-45. Quando o `miolo` virou `MioloDaLinha`, a documentação longa do componente (a linha inteira é um alvo só, 64 px no mínimo, `divide-y-2` na moldura) ficou presa à `interface PropsDoMiolo`, e não mais à `export function Linha`. Quem passar o mouse sobre `Linha` no editor perde essa documentação. A sugestão é pôr `PropsDoMiolo` e `MioloDaLinha` antes do bloco, para ele ficar logo acima de `export function Linha` (linha 70).
- Linha.test.tsx:71. O `expect(duas.type).toBe(Linha)` não prova nada em tempo de execução; quem prova a regra é o `@ts-expect-error` da linha 69. Esse arquivo passa pelo `tsc` do portão, porque `apps/web/tsconfig.json` inclui `src`, então o teste funciona. Basta o comentário das linhas 67-68, que já diz isso. A asserção pode sair ou ficar como está, não muda nada.
```

Nesta 2ª rodada conferi o patch r1-r2 e o `Linha.tsx` atual por inteiro:

- **Recomendações da 1ª rodada:** todas as que você mandou aplicar foram feitas.
  - O `miolo(acionavel)` virou o componente `MioloDaLinha`, que recebe o conteúdo por spread, sem `para` e sem `aoAcionar`.
  - A linha longa da `techspec.md` foi quebrada, sem mudar o texto.
  - O comentário do e2e da tabela foi para perto da asserção da largura.
  - A recomendação sobre `Cartao.tsx` (1024 contra 768) ficou na tabela "Recomendações sem aplicar" do `5_task.md`, com destino.
- **e2e:** o caso do Espaço reabre a galeria antes de apertar a tecla, então o texto só pode vir dela. A largura agora é medida também no `<button>`, além do `<a>`. Nenhuma das duas mudanças sai do escopo da 5.0.
- **Mutações novas:** as três (`w-full`, `t-cartao` e `size-5` contra `size-4`) apontam para casos que existem no `Linha.test.tsx`.
- **Fotos:** o diff não mexe em nada visual. Nas fotos da seção "Superfícies" no celular não vi nada fora do que a 10.2 descreve.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Linha.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Linha.test.tsx

## test-engineer · 2ª rodada · APROVADO · 2026-10-13 13:52:16 · `tasks/prd-pele-e-casca/5_task.md`

VEREDITO: APROVADO

Cenários exigidos: esta rodada só confere as duas correções da 1ª e o diff r1→r2 (`.processo/ordens/5_task-diff-r1-r2.patch`). Os cenários da tarefa, já auditados na 1ª rodada, não mudaram.
- O título da `Linha` em `t-cartao` tem bloco de mutação próprio.
- O `w-full` da `CAIXA` tem bloco, e o e2e mede a largura também da linha que é botão.
- As recomendações que entraram na ordem: o chevron de 20 px, a exclusão de `para` com `aoAcionar` e o Espaço no e2e.

Cobertos:
1. **Correção 1:** feita. O bloco novo está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/5_task.md:316-320` e troca `className="t-cartao truncate text-tinta"` por `className="truncate text-tinta"`. Com a mutação, `Linha.test.tsx:127` (`classes.has('t-cartao')`) fica vermelho pelo motivo certo.
2. **Correção 2:** feita.
   - O bloco novo está em `5_task.md:288-292` e troca `flex min-h-16 w-full min-w-0` por `flex min-h-16 min-w-0`. O texto existe só uma vez, em `Linha.tsx:24`. Com a mutação, `Linha.test.tsx:146` (`classes.has('w-full')`) fica vermelho para o link e para o botão.
   - No e2e (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/pecas-superficies.spec.ts:383-386`), a largura agora é medida também em `linhas.nth(1).getByRole('button')`, que é o caso em que só o `w-full` garante a largura cheia.
3. **Chevron de 20 px:** a asserção `size-5` está em `Linha.test.tsx:112`, e o bloco `size-5` → `size-4` em `5_task.md:351-355` chega a ela.
4. **Exclusão de `para` com `aoAcionar`:** o `@ts-expect-error` está em `Linha.test.tsx:69`. O arquivo está no `include` do `apps/web/tsconfig.json` (pasta `src`), então o `tsc` do portão o confere. Se a união deixasse passar as duas props, o typecheck falharia.
5. **Espaço no e2e:** `pecas-superficies.spec.ts:361-366` abre a galeria de novo, afirma o estado inicial e depois aperta o Espaço sozinho. O texto "Aberta" só pode vir do Espaço.
6. **Refatoração de `miolo` para `MioloDaLinha`:** não muda comportamento. Conferi os blocos de `Linha.tsx` contra o código novo, e os textos que eles procuram continuam existindo, como `{acionavel && <ChevronRight` e `flex min-w-0 flex-1 flex-col">`, este só uma vez. O portão já provou cada mutação. Rodei `npx vitest run apps/web/src/componentes/Linha.test.tsx`: 11 de 11 passaram.
7. Não há `.skip`, teste comentado nem mock novo. A tabela "Recomendações sem aplicar" tem destino ou motivo em cada linha.

Bloqueantes: nenhum.

Recomendações:
- `Linha.test.tsx:71`: `expect(duas.type).toBe(Linha)` passa sempre e só existe para usar a variável; quem prova a regra é o `@ts-expect-error`. Trocar por `void duas` deixa claro que a prova é do typecheck e não esta asserção. Isso evita que pareça "asserção que sempre passa", que a regra 40 proíbe.
- O caso "`para` e `aoAcionar` não vão juntos" falha no `tsc`, não no vitest. Uma linha no "Como testar" do `5_task.md` dizendo isso ajuda quem ler o portão vermelho a achar a causa.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-13 13:53:18 · `tasks/prd-pele-e-casca/5_task.md`

VEREDITO: APROVADO

Tela vista: sim (112 fotos na pasta; li as da galeria, cheia e escura, de `/coordenacao/governanca` nos três temas e de `/professor/turmas`, cheia e vazia). As fotos da galeria vazia são byte a byte iguais às da cheia (`cmp` nas 15), porque a galeria é estática. Não li as 9 fotos celular da galeria cheia à parte: são as mesmas da vazia.

Estados: ok. A galeria não é tela do produto. Nas telas reais fotografadas:
- Vazio de `/coordenacao/governanca` convida e diz o próximo passo ("Quando um professor pedir uma versão adaptada… a entrega aparece aqui").
- Com dado: ok.
- Carregando e erro não aparecem na vitrine e esta rodada não os tocou.

Acessibilidade:
- `Linha` continua um alvo só (`<a>` ou `<button>`), com chevron `aria-hidden` e sem parada de Tab na linha de leitura.
- O Espaço no botão agora é provado sozinho no e2e (`e2e/pecas-superficies.spec.ts:361-366`).
- A largura do alvo botão também é medida (`:382-386`).
- Foco e contraste nas fotos claro e escuro estão como na rodada anterior.

Chromebook fraco: sem peso novo. A refatoração troca uma função interna por um componente de duas linhas e não muda o que renderiza.

Celular:
- 360 px sem rolagem horizontal e sem texto cortado nas fotos da tarefa.
- `Linha` com 64 px, a ação principal e o chevron de 20 px cabem.
- A `Tabela` vira lista e o título comprido é truncado com `title`.
- O `e2e` mede os dois projetos.

Ação oficial protegida: sim. Esta tarefa não cria ação oficial. "Aprovar 32 correções" aparece desligado na barra presa até os 5 destaques serem abertos ("3 de 5 destaques abertos"), e o texto diz por quê.

Conferi o diff desde a rodada anterior, que só tocou `Linha`:
- `MioloDaLinha` renderiza o mesmo conteúdo nos três casos (link, botão, leitura), e o chevron continua o último filho do alvo.
- `npx vitest run --project unidade Linha.test.tsx`: 11 passam.
- `tsc` de `apps/web` e de `e2e` sem erro.
- `eslint` nos três arquivos alterados sem aviso.
- As mutações novas do documento batem com o texto de `Linha.tsx:24`, `:58` e `:65`.

Bloqueantes: nenhum.

Recomendações:
- `apps/web/src/componentes/Linha.tsx:26-45`: o comentário longo de `Linha` ("A linha de lista da D80…") ficou acima de `interface PropsDoMiolo` (linha 46), e `export function Linha` (linha 70) está sem documentação. Mover o bloco para a linha 70 e deixar só a frase de `PropsDoMiolo`. Não muda comportamento.
- Placeholder da `CaixaPedido` cortado a 360 px, claro e escuro (`professora--galeria--celular-5.png`; `escuro--professora--galeria--celular-5.png`; `apps/web/src/componentes/ia/CaixaPedido.tsx:112-125`). O texto "…um plano de aula…" quebra e a segunda linha some atrás do botão "Só conversar". A peça não foi tocada nesta tarefa e já está registrada para a 10.0/10.1 em `2_task.md`, `3_task.md` e `4_task.md`. Quem revisar a 10.0 deve tratar como bloqueante, como já combinado.
- Os cartões de 1 px ao lado dos de 2 px ("Consumo do mês por função" em governança e "Suas turmas") seguem para a spec da área, como a tabela de recomendações do documento declara.
