# Achados das revisões — `tasks/correcoes/2026-10-16-alvo-de-toque-sob-a-barra-de-baixo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-16 00:56:44 · `tasks/correcoes/2026-10-16-alvo-de-toque-sob-a-barra-de-baixo.md`

VEREDITO: APROVADO

Tela vista: não. A correção só altera `e2e/__fixtures__/verificacoes.ts` e `e2e/casca-no-celular.spec.ts`, e nenhum arquivo de `apps/web` mudou. Revisei pelo diff e pelo código do axe 4.13.0 em `node_modules/axe-core/axe.js`. Não rodei o teste novo.

Estados: não se aplica. A tela não mudou.

Acessibilidade: o `pointer-events: none` nas barras `sticky` durante o axe não esconde defeito real de alvo de toque nem de cobertura. Conferi no código do axe:
- **Efeito no axe:** `pointer-events: none` só tira o elemento da lista de obstáculos do `target-size`. Isso acontece em `getTargetRects` (`axe.js:16123`) e em `filterByElmsOverlap` (`axe.js:~25745`). O próprio controle não é pulado: o `matches` do `target-size` não olha `pointer-events` (`axe.js:28289`) e o `targetSizeEvaluate` também não. Os botões dentro das barras presas, como menu, aprovar na `BarraPresa` e a faixa de espera, continuam auditados quanto ao tamanho.
- **Espaçamento entre vizinhos:** o `targetOffsetEvaluate` (`axe.js:25822`) não filtra por `pointer-events`. A exceção do espaçamento entre vizinhos continua valendo igual para controles pequenos lado a lado, dentro ou fora de barra presa.
- **Contraste:** o color-contrast monta a pilha de fundo pela grade interna do axe, sem `elementsFromPoint`. O `pointer-events: none` não muda a conta.
- **Cobertura que se perde:** só a de um controle coberto por uma barra `sticky`. Como o `sticky` fica no fluxo, essa cobertura é sempre passageira e a rolagem desfaz. A cobertura permanente é a da barra `fixed` de baixo, que a correção deixa intacta e que tem teste de medida em `casca-no-celular.spec.ts`.

Chromebook fraco: sem impacto no produto. O custo da correção é um `getComputedStyle` por elemento a cada auditoria, e isso roda só no teste.

Celular: a correção é coerente com a causa que ela mediu. A barra de topo, que já era presa antes da 13.0, cobre o pedaço de um controle no meio da rolagem. O teste novo reproduz isso com três botões de 28 px, 8 px à vista sob a barra de 56 px. Sem a correção, o axe reprova por `partiallyObscured` e por `target-offset`; com ela, os 28 px passam. A posição da rolagem é imposta pelo teste e medida por asserção, então ele não depende do acaso da tela.

Ação oficial protegida: sim. Nada oficial é tocado.

Bloqueantes: nenhum.

Os cinco mutantes declarados parecem pegos pelo teste novo:
- Tirar o `setProperty` deixa os botões reprovando.
- Trocar `sticky` por `fixed` deixa os botões reprovando.
- Trocar o `removeProperty` deixa o banner com `pointer-events: none`.
- Trocar o `Reflect.deleteProperty` deixa a marca `barrasPresasDaAuditoria` na janela.
- Não chamar `desfazer` deixa o banner com `pointer-events: none`.

Recomendações:
1. **`verificacoes.ts`, a limpeza.** `removeProperty` apaga qualquer `pointer-events` em linha que o elemento tivesse antes da auditoria. Hoje nenhum componente grava isso (conferi com `grep`), então é seguro. Mais robusto seria guardar o valor e a prioridade anteriores e restaurá-los, como faz o polyfill do próprio axe.
2. **Barra de topo, `CascaDaEscola.tsx:303`.** A barra de topo `sticky top-0` não tem `scroll-padding-top`, e o foco do teclado pode parar atrás dela (WCAG 2.4.11). A correção já registra isso como fora do escopo. Vale virar tarefa própria, porque esta mudança tira da auditoria o único olhar automático sobre a barra de topo cobrindo controle. Os usos de `sticky top-14` em `Time.tsx:272` e `Tutor.tsx:55` entram na mesma conta.
3. **`violacoesGraves`.** A função agora afeta 332 chamadas de `violacoesGraves` em `e2e`. O comentário está claro, mas convém o `/retro` registrar que, desde 16/10, o `target-size` ignora barras `sticky` e que a cobertura delas é por medida.

## test-engineer · 1ª rodada · APROVADO · 2026-10-16 00:57:33 · `tasks/correcoes/2026-10-16-alvo-de-toque-sob-a-barra-de-baixo.md`

VEREDITO: APROVADO

**Cenários exigidos**
- **Caminho feliz:** um controle de 28 px meio coberto pela barra de topo, com vizinho ao lado, deixa de reprovar o `target-size`.
- **Borda 1:** o resultado não pode depender de onde a rolagem parou. Esse foi o motivo da troca de vermelho por verde no W6 e no A2.
- **Borda 2:** a barra precisa voltar a receber o toque depois da auditoria.
- **Borda 3:** a auditoria não pode deixar marca na página.
- **Borda 4:** o `finally` desfaz a mudança mesmo quando o axe lança erro.
- **Permissão e isolamento:** não se aplicam. A correção só mexe no utilitário de teste e não toca dado de escola.

**Cobertos**
- **O teste novo prova a regra.** Fica em `e2e/casca-no-celular.spec.ts:302`. Ele põe na tela comprida três botões de 28 px, lado a lado, e manda a rolagem por conta própria (`scrollBy` até sobrarem 8 px à vista). As asserções nas linhas 326 e 327 confirmam que a geometria ficou como o teste pediu, e só então a auditoria roda. O cenário de fato chega à cláusula. No axe 4.13 (`node_modules/axe-core/axe.js:25749`), o vizinho só conta como cobertura se `pointer-events` for diferente de `none`. Os controles do `<header>` preso (`apps/web/src/componentes/CascaDaEscola.tsx:303`), o botão "Abrir o menu" e o link da marca, ficam sobre os botões da sonda. Então o vermelho sem a correção vem do motivo certo.
- **O teste roda nos dois projetos** e continua válido nos dois, porque `entrarComoProfessoraDeTurma` fixa a janela em 360 × 800 e a barra de topo existe nos dois.
- **A barra é devolvida:** a linha 331 lê o `pointer-events` calculado do `banner`.
- **Sem marca na página:** a linha 332 confere a chave na `window`.
- **As cinco mutações batem com o `git diff`:**

| Mutação | Cláusula do código novo | Por que fica vermelho |
|---|---|---|
| 1 | `setProperty` (neutralizar) | a barra volta a cobrir os botões |
| 2 | o filtro `sticky` (trocado por `fixed`) | a barra de topo deixa de ser alcançada |
| 3 | `removeProperty` | o `banner` fica com `none` |
| 4 | `deleteProperty` | a chave sobra na `window` |
| 5 | a chamada de `desfazer` no `finally` | o `banner` fica com `none` |

- **`.skip`, mock e provedor pago:** não há `.skip` nem teste comentado. Não há mock de coisa nossa: só os botões de sonda são postos na página, e a regra testada é a da fixture. Não há IA nem concorrência envolvidas.

**Bloqueantes:** nenhum.

**Recomendações**
1. **Duas linhas estão sem mutação declarada**, ambas em `e2e/__fixtures__/verificacoes.ts`: `presas.push(elemento)` (linha 32) e `Object.assign(window, { barrasPresasDaAuditoria: presas })` (linha 35). Pelo raciocínio, o teste já as pega: sem elas a lista de desfazer fica vazia e a asserção da linha 331 fica vermelha. Mesmo assim, valeria um bloco para cada uma, para o portão provar e não só o raciocínio.
2. **Nenhum teste prova que o `finally` desfaz quando o axe lança erro.** Se `desfazer` saísse do `finally` e fosse para depois do `try`, o teste continuaria verde. O impacto é baixo, porque com o axe lançando o teste já falha. Fica para registro.
3. **A neutralização alcança todo `position: sticky`, não só a barra de topo:**
   - a `BarraPresa` (`apps/web/src/componentes/BarraPresa.tsx:78`);
   - a faixa de supervisão do Tutor do aluno (`apps/web/src/areas/aluno/Tutor.tsx:55`);
   - a faixa "esperando" (`apps/web/src/areas/professor/Time.tsx:272`);
   - as laterais da janela larga (`apps/web/src/componentes/CascaDaEscola.tsx:128` e `:324`).

   Como `pointer-events` é herdado, durante a auditoria os botões dentro dessas regiões deixam de contar como sobreposição, inclusive entre si. O tamanho de cada alvo e o espaçamento continuam auditados, porque o `target-offset` não olha `pointer-events`. Hoje só a barra de topo é provada por teste. Um teste com um controle sob a `BarraPresa`, ou a frase do "Custo" no documento nomeando cada região, deixaria o efeito explícito.
4. **O desfazer apaga a propriedade em vez de restaurar o valor que havia antes.** Isso funciona porque hoje nada grava `pointer-events` em linha nessas barras, o que o comentário diz. Guardar o valor anterior e devolvê-lo tira essa premissa do caminho. A asserção da linha 331 também poderia comparar com o valor lido antes da auditoria, em vez de só `not.toBe('none')`.
5. **Os dois testes do sintoma não rodaram antes do commit:** `e2e/a2-assistente.spec.ts:140` e `e2e/pedidos.spec.ts:495`, no projeto `celular`. Eles não estão entre os arquivos alterados, então o portão da tarefa não os rodou. O "verdes depois" do documento só se confirma na esteira, e o Orquestrador deve ler esse veredito antes de fechar.
6. **O nome do arquivo da correção ainda diz "sob a barra de baixo",** embora o próprio documento mostre que a causa era a barra de topo. Vale ajustar no `/retro` para não confundir quem procurar depois.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/correcoes/2026-10-16-alvo-de-toque-sob-a-barra-de-baixo.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/__fixtures__/verificacoes.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/casca-no-celular.spec.ts`

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-16 01:12:53 · `tasks/correcoes/2026-10-16-alvo-de-toque-sob-a-barra-de-baixo.md`

VEREDITO: APROVADO
Tela vista: não. A correção só altera arquivos de e2e e nenhum arquivo de `apps/web` mudou, então não há foto. A revisão foi pelo diff.
Estados: ok. Não se aplica, pois não há tela nova nem alterada.
Acessibilidade: a auditoria axe continua cobrindo tamanho e espaçamento de alvo (`target-size`). Só `pointer-events` das barras `sticky` é neutralizado durante a auditoria, e o texto do documento já diz isso no "Custo".
Chromebook fraco: sem efeito. É código de teste, sem custo em produção.
Celular: a correção é do projeto `celular`. O teste fixa a barra de topo cortando três botões de 28 px, com 8 px à vista.
Ação oficial protegida: não se aplica, pois nenhum fluxo de produto mudou.

Confirmei que as três recomendações da rodada anterior foram aplicadas, lendo o diff. Não rodei os testes.

- **Restauração fiel do `pointer-events` em linha:** `e2e/__fixtures__/verificacoes.ts` guarda `{ elemento, valor, prioridade }` antes de pôr `none !important`. O desfazer devolve com `setProperty(valor, prioridade)` quando havia valor e usa `removeProperty` quando não havia.
- **Teste que prova a restauração:** `e2e/casca-no-celular.spec.ts` cria duas situações. O `header` recebe `pointer-events: auto !important` em linha, e um `div` sticky nasce sem valor.
  - Depois da auditoria ele exige `['auto','important']` no `header`.
  - No `div` exige `''` em linha e `auto` computado.
  - Exige também que `barrasPresasDaAuditoria` não esteja em `window`.
- **Mutações para as linhas que faltavam:** o documento agora cobre cada ponto da função com mutação e teste citado.
  - Tirar o `push`.
  - Tirar o `setProperty none`.
  - Trocar `sticky` por `fixed`.
  - Renomear a chave em `window`.
  - Inverter a condição `valor === ''`.
  - Tirar o `else`.
  - Tirar a prioridade.
  - Não deletar a chave de `window`.
  - Não aguardar o `desfazer`.

  Pelo que li no asserto, cada uma deixa o teste vermelho.
- **Frase no "Custo":** nomeia as regiões `sticky` alcançadas, com `arquivo:linha`: `BarraPresa.tsx:78`, `Tutor.tsx:55`, `Time.tsx:272`, `CascaDaEscola.tsx:128` e `:324`. Diz também que o efeito se herda aos botões internos e que o `target-offset` continua auditado.

Bloqueantes: nenhum.

Recomendações (nenhuma bloqueia):
- `scroll-padding-top` para a barra de topo, `Time.tsx:272` e `Tutor.tsx:55`: o foco do teclado pode parar atrás de uma barra `sticky` (WCAG 2.4.11). É mudança em `apps/web`. O documento já a registra em "Recomendações sem aplicar" e deixa ao Orquestrador decidir entre `TODO.md` e uma correção.
- No `/retro`, registrar que desde 16/10 o `target-size` ignora barras `sticky` e que a cobertura delas é por medida.
- No `/retro`, renomear o arquivo da correção, que ainda diz "sob a barra de baixo".

Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/__fixtures__/verificacoes.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/casca-no-celular.spec.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/correcoes/2026-10-16-alvo-de-toque-sob-a-barra-de-baixo.md`

## test-engineer · 1ª rodada · APROVADO · 2026-10-16 01:13:22 · `tasks/correcoes/2026-10-16-alvo-de-toque-sob-a-barra-de-baixo.md`

VEREDITO: APROVADO

Cenários exigidos (nesta rodada, o que o diff mexe):
- O desfazer devolve o `pointer-events` de cada barra presa: a que tinha valor em linha volta com o mesmo valor e a mesma prioridade, e a que não tinha volta sem nenhum.
- Nada fica marcado na página depois da auditoria.
- O sintoma original continua coberto: o controle cortado pela barra de topo não reprova o `target-size`.
- O título citado nos blocos de mutação é igual ao título do teste.

Cobertos:
- **Barra com valor em linha.** O teste põe `pointer-events: auto !important` no `header` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/casca-no-celular.spec.ts:319`). Depois da auditoria, confere o valor e a prioridade pelo `banner`, `['auto','important']`, na linha 338. Pelo que li, as mutações que mexem no desfazer derrubam essa asserção:
  - trocar a condição para `valor !== ''`: o `header` perde a propriedade;
  - tirar o `else setProperty`: o `header` continua com `none !important`;
  - tirar a `prioridade`: volta `['auto','']`;
  - tirar `presas.push`, trocar a chave do `Object.assign` ou usar `Promise.resolve(desfazer)`: nada é devolvido.
- **Barra sem valor.** É um `div` sticky de altura zero dentro do `main`, conferido com `['','auto']` na linha 339. Se o desfazer esquecer essa barra, ela fica em `none` e o teste fica vermelho.
- **Nada fica marcado.** A linha 340 confere que `barrasPresasDaAuditoria` saiu do `window`, e isso derruba a mutação que troca `Reflect.deleteProperty` por `Reflect.has`.
- **Sintoma.** As asserções de rolagem (linhas 332 e 333) e a de `violacoesGraves` (linha 334) não mudaram. A mutação `sticky→fixed` continua parando nelas pelo motivo certo, porque o `header` da casca é `sticky top-0` (`apps/web/src/componentes/CascaDaEscola.tsx:303`).
- **Título e mutações.** O título nos nove blocos, "devolve as barras como estavam", é igual ao do teste. Cada cláusula nova do diff (o `push` com valor e prioridade, os dois ramos do desfazer e a prioridade) tem bloco próprio. O texto do "Custo" agora nomeia as regiões `sticky` que a auditoria deixa de contar como cobertura.
- Não há `.skip`, teste comentado nem mock. Não toca IA nem dado de escola. Não há concorrência a provar.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/casca-no-celular.spec.ts:319` marca a barra com `document.querySelector('header')`, mas a linha 338 confere pelo `getByRole('banner')`. Hoje os dois apontam para o mesmo elemento. Se um dia a tela ganhar outro `<header>` antes da barra, o teste fica vermelho por um motivo que não é a regra. Vale escolher a barra do mesmo jeito nas duas linhas, por exemplo com `header:not(main header)` ou marcando a barra pelo locator do `banner`.
- A asserção da barra sem valor (linha 339) não derruba sozinha nenhuma das nove mutações declaradas, porque a `valor !== ''` já cai na linha 338. Ela protege contra alguém tirar o `removeProperty`, e isso não tem bloco próprio. Não bloqueia, porque `setProperty` com valor vazio também tira a propriedade e o resultado é o mesmo. Fica registrado para o `/retro`.
