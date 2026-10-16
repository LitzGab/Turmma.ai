# Achados das revisões — `tasks/prd-pele-e-casca/15_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-16 01:44:10 · `tasks/prd-pele-e-casca/15_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A tarefa só muda a barra de topo da operação no `apps/web`. Não há rota, query, fila, chamada de IA, migration nem estado em servidor novos.
Rate limit: ok. Nenhum endpoint novo, e os da operação continuam como estavam.
Fila e prioridade: ok. Nenhum job novo.
Concorrência: protegida. O "Sair" fica desligado enquanto a saída está em andamento (`disabled={saindo}`), em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/operacao/componentes/CascaDaOperacao.tsx`. O teste de componente cobre isso, com mutação declarada.
Índice e paginação: ok. Nenhuma query nova.
Degradação de IA: não se aplica.
Migration: não se aplica.
Métrica e alerta: ok. Nada novo no caminho quente.
Bloqueantes: nenhum.
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/operacao.spec.ts`: o caso "a barra de topo é clara… nos dois temas" faz 8 rodadas de medida (2 temas × 2 larguras × 2 telas) num teste só. Vale conferir na esteira se ele cabe no prazo do caso no projeto `celular`, com a rede lenta simulada.
- O caso de fora da sessão confere a cor da barra só no tema claro. O escuro na entrada, no segundo fator e no convite fica para o spec de escuro (`violacoesGraves`). Vale deixar isso dito na linha da A63 do `cenarios.md`.

Rodei os testes de unidade de `apps/web/src/operacao` e o `nome-dos-chunks.test.ts` (B2 e o teto de 60 kB do `operacao-*`): 11 arquivos e 111 testes passaram. A importação nova, `componentes/botao-secundario`, não puxou nenhuma peça de fora da entrada.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-16 01:44:40 · `tasks/prd-pele-e-casca/15_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. As quatro divergências da tabela da `15_task.md` estão escritas fora dela:
- `NavegacaoDaLista.tsx` fica para a X2: está na `techspec.md` 9 ("Feita na 15.0") e no `estilos.test.ts`.
- `AvisoDeInatividade.tsx` não mudou: o `cenarios.md` A64 continua valendo sem edição.
- A barra sai sem o fio vertical do mockup: está na `docs/interface.md` 11.4.
- "Operação Turmma" no lugar de "Equipe Turmma": está na `docs/interface.md` 5a e 11.4, no `cenarios.md` A60 e no item 8 de "O que ficou em aberto".

A foto `operacao-escolas-light-1366.png` mostra a opção "Nome" ainda em preto: é a `NavegacaoDaLista`, que a tabela de divergências deixa para a X2. É corpo da operação, fora desta tarefa.

Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade e os testes que a árvore alterou)

Bloqueantes: nenhum

Recomendações:
- `apps/web/src/operacao/componentes/CascaDaOperacao.tsx:106-108`: a 15.1 e a `docs/interface.md` 11.4, que esta tarefa reescreveu, listam "o nome do operador, a `Aparencia` e o Sair". O código põe a `Aparencia` antes do nome, e a foto `operacao-escolas-light-1366.png` mostra essa ordem. Escolha uma das duas ordens e deixe a documentação e o código iguais.
- `tasks/prd-pele-e-casca/tasks.md:91-93`: a 15.0 e as subtarefas dela continuam desmarcadas. Na 14.0 a marcação foi no mesmo commit da tarefa (`f883d06`). Confira se ela entra neste commit.
- `tasks/prd-pele-e-casca/15_task.md`, seção "Mutações": os testes citados levam só o começo do nome real. Por exemplo, o caso do e2e se chama "…em Escolas e em Uso, a 360 e a 1366 px, nos dois temas". O carimbo prova que o portão achou os casos assim, mas o nome completo evita casar com outro caso no futuro.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/operacao/componentes/CascaDaOperacao.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/operacao/componentes/CascaDaOperacao.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/operacao.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/estilos.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/docs/interface.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/cenarios.md

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-16 01:45:00 · `tasks/prd-pele-e-casca/15_task.md`

VEREDITO: APROVADO

Tela vista: sim (12 fotos lidas: operador em Escolas e Uso, e a entrada sem sessão, a 1366 e 360 px, claro e escuro). Não há foto de escola vazia: a operação não tem. O código foi conferido contra as fotos, e vale o código.

- **A foto e o código:** o `CascaDaOperacao.tsx` foi editado às 01:40:05 e as fotos são de 01:32. O desenho que as fotos mostram é o que o código de hoje escreve: barra `bg-fundo` com borda de 2 px, a pinta, "Operação Turmma", Aparência, nome e "Sair", e a navegação com sublinhado azul.
- **Pinta ausente na entrada:** em `operacao-entrar-light-1366.png` a barra aparece sem a pinta. Nas outras onze fotos ela está lá, e o `<img>` é o mesmo em todo caminho (`CascaDaOperacao.tsx:55`). Foi corrida de carregamento da imagem na hora da foto, não defeito do código.

Estados: ok. A tarefa não cria estado novo. O `ErroDaOperacao` (`CascaDaOperacao.tsx:132`) continua com a mensagem e o "Tentar de novo".

Acessibilidade: ok.
- Há um `banner`, a navegação "Operação" com `aria-current` e sublinhado de 3 px, e a navegação e a barra têm 44 px.
- O item apagado usa `text-sutil`, e o da tela `text-azul-texto` sobre `fundo`. Os dois passam de 4,5:1 nos dois temas.
- O foco é o `foco` global de 3 px.

Chromebook fraco: ok.
- Nenhuma dependência nova.
- O pacote `operacao-DUlrWf03.js` fica em 13,8 kB em brotli, contra o teto de 60 kB.
- `nome-dos-chunks.test.ts` passou.
- Rodei `npx vitest run --project unidade apps/web/src/operacao apps/web/nome-dos-chunks.test.ts apps/web/src/estilos.test.ts`: 12 arquivos, 149 testes verdes.
- Não rodei o e2e. O ambiente dele não subiu aqui, e o que ele mede (72 px, borda de 2 px, sublinhado de 3 px, "Sair" de 44 px, sem estouro de largura) eu só pude conferir pelo código e pelas fotos.

Celular:
- A 360 px não há rolagem horizontal nem texto cortado.
- A conta desce para uma segunda e uma terceira linha: Aparência, depois nome e "Sair".
- Os alvos têm cerca de 44 px, e nada depende de hover.

Ação oficial protegida: sim. Não há ação oficial nesta tarefa. O "Sair" tem 44 px, a mesma altura do "Continuar na sessão", como diz a D59.

Bloqueantes: nenhum.

Recomendações:
1. **Barra alta no celular.** A 360 px a barra e a navegação juntas ocupam cerca de 210 px antes do conteúdo (`operacao-escolas-light-360.png`). O desenho aceita isso: a conta desce quando não cabe. Ao recompor o corpo na X2, vale avaliar a Aparência atrás de um menu da conta no celular.
2. **Ordem da conta.** O `interface.md` 11.4 e a 15.1 dizem "o nome do operador, a `Aparencia` e o Sair". O código põe Aparência, nome e Sair (`CascaDaOperacao.tsx:106-108`, igual ao que veio da 2.0). Alinhar o texto do documento ao código ou o código ao documento.
3. **Tamanho de letra.** `text-[17px] font-bold` em `CascaDaOperacao.tsx:54` repete o `t-cartao` (17/22 px, 700) do `interface.md`. Trocar pela classe do token tira o valor solto.
4. **Bordas de 1 px.** `ErroDaOperacao` (`CascaDaOperacao.tsx:134`, `border border-erro`) e o `AvisoDeInatividade` (`border-t border-pendente`) ficaram com borda de 1 px. As peças novas `EstadoErro` e `Aviso` usam 2 px. O padrão de 1 px está em várias áreas e a 15.0 declarou o corpo fora do escopo, então fica para a X2 ou para a varredura final.
5. **Comentário velho.** `apps/web/src/operacao/api/sessao.ts:457` ainda diz "o da faixa".

## test-engineer · 1ª rodada · APROVADO · 2026-10-16 01:45:36 · `tasks/prd-pele-e-casca/15_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Marca:** o `banner` diz "Operação Turmma" em toda tela da operação (A60): entrada, segundo fator, convite, Escolas e Uso, a 360 e a 1366 px.
- **"Sair" à vista:** fica dentro do `banner`, sem abrir nada, com 44 × 44 px (A61). "Continuar na sessão" e "Sair" têm a mesma altura (A64).
- **Anel de foco:** 3 px na cor `foco`, sobre o `fundo` claro (A62).
- **Não parece escola:** barra em `fundo` com borda de baixo de 2 px na cor `borda`. Não tem lateral, e fora do `main` só existe a navegação "Operação" (A63).
- **Medidas:** 72 px no computador e no mínimo 56 no celular. Nos dois temas.
- **Estrutura:** o `banner` traz a marca e o nome do operador. Enquanto sai, o "Sair" fica desligado e diz "Saindo…". Os dois links têm `aria-current` só no da tela.
- **Item aceso:** se vê pelo sublinhado de 3 px em `azul`, e não só pela cor.
- **Lista do `bg-noite`:** a lista fechada só encolhe, e o teto acompanha a lista.
- **Testes que não podiam mudar:** U12, B2, A97 e os de recomeço (trocar de operador, aviso de inatividade, convite) seguem sem edição.
- **Permissão e isolamento:** não se aplicam, porque a tarefa não cria rota nem dado. Concorrência também não: o duplo clique no "Sair" fica coberto pelo `disabled` enquanto sai.

**Cobertos:**
- **A60 e A63 fora da sessão:** teste novo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/operacao.spec.ts:124`, com entrada, segundo fator e convite nas duas larguras.
- **A60 a A63 dentro da sessão:** teste novo em `operacao.spec.ts:143`, com Escolas e Uso, 360 e 1366 px, claro e escuro. Mede fundo, borda, cor da borda, altura, alvo de 44 px dos links, o sublinhado (3 px, `azul`, só um) e a largura excedente.
- **A61 e A62 no teste antigo:** `operacao.spec.ts:97-113`, agora com o fundo branco e a borda de 2 px.
- **Estrutura:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/operacao/componentes/CascaDaOperacao.test.tsx:49-127` cobre o `banner`, o "Sair" dentro dele, a ausência de `complementary`, o desligado com "Saindo…", o `aria-current` só no aceso e a casca pública sem "Sair" nem navegação.
- **Mutações conferidas contra o `git diff`, uma a uma:**
  - `bg-papel` difere de `fundo` nos dois temas (`estilos.css:67` e `:206`).
  - A borda de 1 px e a retirada do `md:min-h-18` quebram as medidas exatas.
  - O "Sair" sem as classes do botão secundário perde os 44 px.
  - Sem o `disabled`, o teste de componente cai.
  - Com o `aria-current` fixo, cai o `toBeNull`.
  - O sublinhado sempre presente quebra a contagem de 1, e o de 2 px quebra os 3 px.
  - Teto 5 cai em `estilos.test.ts:558`.
  - Os filtros `--grep` e `-t` acham os casos pelo nome declarado.
  - Nenhum bloco chega vermelho pelo motivo errado.
- **Não há `.skip`, nem mock de coisa nossa, nem IA.**
- **Execução:** `npx vitest run --project unidade` sobre `CascaDaOperacao.test.tsx`, `estilos.test.ts` e `nome-dos-chunks.test.ts` passou, 69 de 69.

**Bloqueantes:** nenhum.

**Recomendações** (nenhuma bloqueia; ficam para o `/validar` e o `/retro`):
1. **Nome da tela no teste de fora da sessão.** O teste em `e2e/operacao.spec.ts:131` espera "um `h1` qualquer". Se `/operacao/mfa` ou `/operacao/convite` redirecionasse para a entrada, o caso continuaria verde sem ter visitado a tela. Vale fixar o nome de cada uma: "Entrar na operação", "Segundo fator" e "Convite para a operação".
2. **Classes novas sem teste nem mutação** em `CascaDaOperacao.tsx`:
   - a marca em 17 px e 700 (`text-[17px] font-bold`), que a 15.1 lista;
   - a cor do item aceso, `text-azul-texto`;
   - o fio de 2 px da navegação, `border-b-2 border-borda`, sobre o qual o sublinhado se apoia;
   - o `t-titulo` do `h1` público.

   Nenhuma é regra de negócio, e a tabela do `test-engineer` não pedia, mas uma regressão de pele em qualquer uma passaria. Uma asserção de `fontSize` e `fontWeight` na marca, e o `borderBottomWidth` da `nav`, no mesmo laço do `:143`, resolvem.
3. **A barra de 56 px no celular não está provada.** O conteúdo (44 + 16 + 2 = 62 px) já passa de 56, então o `toBeGreaterThanOrEqual(56)` a 360 px seguiria verde sem o `min-h-14`. É só registro, porque a medida fica cumprida pelo conteúdo.
4. **Faces mortas no `tokens.spec.ts`.** `e2e/tokens.spec.ts:292` e `:295` ainda montam "cabeçalho da operação" e "grupo da Aparência na faixa" em `bg-noite`. Essas faces não existem mais no produto. Os testes passam, mas medem desenho morto, como já acontecia com a "dica da lateral" e o "avatar do Assistente", que saíram na 12.0 e na 8.0. A regra `.bg-noite .bg-fundo :focus-visible` do `estilos.css` também ficou sem uso real. Limpar numa tarefa que toque esse spec, ou na X2.
5. **Escuro sem axe.** O caso novo percorre o tema escuro mas não chama `violacoesGraves`. O contraste do nome do operador em `text-apoio` sobre o `fundo` escuro fica com o spec do escuro nas telas de verdade e com a tabela de contraste. Vale conferir que esse spec passa pela operação com a sessão aberta.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-16 01:57:44 · `tasks/prd-pele-e-casca/15_task.md`

VEREDITO: APROVADO
Tela vista: não para esta rodada. O prompt informou que não dá para tirar fotos novas: o vitrine não tem papel de operador. As 12 fotos antigas de `.processo/vitrine/operacao-*.png` são anteriores à troca da marca, e não as li de novo, porque o diff desta rodada não muda nada que elas mostrem. Revisei pelo código e pelo diff. A troca da marca fica para a validação, que deve conferir a barra da operação a 360 e a 1366 px.
Estados: ok. O diff não mexe em carregando, vazio, erro nem com dado. O "Saindo…" do botão continua coberto pelo teste de unidade.
Acessibilidade: ok. A classe `t-cartao` em `apps/web/src/estilos.css:415-419` vale 17 px, linha de 22 px e peso 700, igual ao `text-[17px] font-bold` que saiu. Não muda contraste, foco nem alvo de toque. O e2e novo roda o axe no tema escuro nas três telas públicas (`violacoesGraves`, `e2e/operacao.spec.ts`). Esse é o ponto onde o contraste da barra e do título muda de cor.
Chromebook fraco: ok. É só uma troca de classe. O caso de e2e agora faz 12 medidas, e o prazo foi para 90 s. A recomendação do infra-guardian de verificar se estoura no projeto `celular` está registrada com destino: o Orquestrador lê a esteira.
Celular: ok. O e2e continua medindo `larguraExcedente` igual a 0 a 360 e a 1366 px, agora nos dois temas.
Ação oficial protegida: não se aplica. A tarefa só mexe na casca.

Conferência das seis correções do diff:
- A ordem da conta (`Aparencia`, nome, Sair) agora coincide entre o código (`CascaDaOperacao.tsx:106`), `docs/interface.md` 11.4, 15.1 e o techspec 9.
- A marca usa `t-cartao`, com os mesmos valores do estilo anterior.
- O e2e de fora da sessão cobre os dois temas e as três telas, com o título de cada uma no `heading`. Um redirecionamento para a entrada não passa mais despercebido.
- Os nomes dos testes nas "Mutações" estão completos.
- A63 do `cenarios.md` descreve os dois temas.
- `tasks.md` está marcado como feito.

Bloqueantes: nenhum.

Recomendações:
- Confirmar que o e2e de fora da sessão cabe nos 90 s no projeto `celular`, quando a esteira rodar.
- Na validação, olhar a barra a 360 px. A conta (`Aparencia`, nome, Sair) desce de linha e a barra mais a navegação ocupam cerca de 210 px. É registro do frontend-reviewer, com destino X2.
- As demais recomendações dos revisores seguem em "Recomendações sem aplicar" em `tasks/prd-pele-e-casca/15_task.md`, cada uma com destino.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-16 01:57:50 · `tasks/prd-pele-e-casca/15_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- O caso de fora da sessão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/operacao.spec.ts` agora tem 12 recargas e roda o axe seis vezes, e o prazo subiu para 90 s. A minha recomendação da 1ª rodada sobre o prazo no `celular` foi atendida. Falta conferir na esteira o tempo real desse caso no projeto `celular`. Se ele passar de uns 60 s, é melhor separar os temas em dois casos do que subir o prazo outra vez.
- A troca para `t-cartao` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/operacao/componentes/CascaDaOperacao.tsx:54` mantém 17 px e 700. Ela traz também `line-height: 22px`, definido em `apps/web/src/estilos.css:415-419`. As 12 fotos de `.processo/vitrine/operacao-*.png` são de antes da troca. A altura da barra (72/56 px) está protegida pela medida do e2e, mas a conferência visual fica para o Validador.

Nenhuma correção tinha sido exigida na 1ª rodada, então não há nada a conferir desse lado. O diff não toca nenhum caminho quente: não mexe em rate limit, fila, gateway de IA, estado em memória, concorrência, query, migration nem métrica.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-16 01:58:22 · `tasks/prd-pele-e-casca/15_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)

Bloqueantes: nenhum.

As seis recomendações da ordem `.processo/ordens/15_task-r1.md` foram aplicadas, e nada novo apareceu no diff:
- **Ordem da conta.** O código põe a `Aparencia`, depois o nome e por último o "Sair" (`apps/web/src/operacao/componentes/CascaDaOperacao.tsx:106-110`). A `docs/interface.md` 11.4, a 15.1 e a `techspec.md` 9 dizem agora a mesma ordem, e a mudança tem linha própria em "Divergências resolvidas".
- **`tasks.md`.** A 15.0, a 15.1 e a 15.2 estão marcadas.
- **Nomes nas "Mutações".** Conferi cada `teste:` contra o `test(` e o `it(` reais: `operacao.spec.ts:155`, `CascaDaOperacao.test.tsx:66` e `:92`, `estilos.test.ts:541`. Os nomes batem por inteiro.
- **E2e de fora da sessão.** Os três títulos esperados são os que as telas escrevem (`Entrar.tsx:57`, `Mfa.tsx:42/85`, `Convite.tsx:123`). Assim, um redirecionamento para a entrada deixa o caso vermelho. O caso passa pelos dois temas e roda o axe no escuro; `violacoesGraves` já vem importado (`e2e/operacao.spec.ts:8`).
- **A63 do `cenarios.md`.** Diz onde cada tema é provado, com a sessão aberta e fora dela.
- **`t-cartao`.** O token tem 17 px, linha de 22 px e peso 700 (`apps/web/src/estilos.css:415-419`), as mesmas medidas da 11.4. A barra tem altura mínima própria (`min-h-14 md:min-h-18`), então a linha de 22 px não mexe nas medidas que o e2e confere.

Sobre as fotos: são de antes da troca para `t-cartao`. Tamanho e peso não mudaram, só a linha de 22 px, que fica dentro da altura mínima da barra. Por isso não reabri a leitura visual.

Recomendações:
- O comentário de `CascaDaOperacao.tsx:65` diz que a `CascaPublicaDaOperacao` serve "entrar e o segundo fator", mas ela também serve o convite (`Convite.tsx:123`). O mesmo vale para `:98`. Corrigir quando o arquivo for tocado de novo; não bloqueia.

## test-engineer · 2ª rodada · APROVADO · 2026-10-16 01:58:30 · `tasks/prd-pele-e-casca/15_task.md`

VEREDITO: APROVADO

Cenários exigidos: na rodada 2, auditei o diff `8b19d28..7e2c4c1` e conferi as seis recomendações aplicadas da ordem `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/.processo/ordens/15_task-r1.md`. São estes os pontos:
- **A troca da marca para `t-cartao`.** Nenhum bloco de "Mutações" cita a linha que mudou. A medida de 72 px da barra vem do `min-h` do `header`, e não da altura de linha do `p`.
- **Os nomes dos testes em "Mutações".** Cada `teste:` tem de bater com o `test(` ou `it(` real.
- **O e2e de fora da sessão.** O título de cada tela tem de estar fixado, nos dois temas, com o axe rodando no escuro.
- **A ordem da conta.** O código, a `docs/interface.md` 11.4, a 15.1 e a techspec 9 têm de dizer a mesma coisa.
- **A A63 e o `tasks.md`.**

Cobertos:
- **Nomes dos testes.** Os 9 blocos `teste:` de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/15_task.md:99-162` batem caractere a caractere com os nomes reais:
  - `e2e/operacao.spec.ts:45` e `:155`;
  - `CascaDaOperacao.test.tsx:66` e `:92`;
  - `estilos.test.ts:541`.
- **Títulos fixados no e2e.** Os títulos que o teste espera são os que as telas escrevem hoje: "Entrar na operação" (`Entrar.tsx:57`), "Segundo fator" (`Mfa.tsx:42` e `:85`) e "Convite para a operação" (`Convite.tsx:123`). Com isso, se `/operacao/mfa` ou `/operacao/convite` redirecionasse para a entrada, o caso ficaria vermelho, que era o que a minha recomendação 1 pedia (`e2e/operacao.spec.ts:142`).
- **Axe no escuro.** `violacoesGraves` está importado (`:8`) e roda nas 6 telas do escuro (`:149`). O prazo do caso passou para 90 s com `test.setTimeout` (`:126`), dentro do teste, sem depender de máquina folgada.
- **`t-cartao`.** A classe existe em `estilos.css:415` com 17 px e peso 700, iguais aos do `text-[17px] font-bold` de antes. Muda só a altura de linha, que agora é 22 px.
- **Ordem da conta.** O código põe a `Aparencia` antes do nome, e `docs/interface.md` 11.4, a 15.1 e a techspec 9 agora dizem o mesmo. A escolha está registrada em "Divergências resolvidas".
- **A63 e `tasks.md`.** A A63 diz onde cada tema é provado, e o `tasks.md` está marcado.
- **Testes de componente.** `npx vitest run src/operacao/componentes/CascaDaOperacao.test.tsx` passou, com 6 testes.
- **O resto.** Não há `.skip`, mock novo, IA nem operação concorrente nova no diff.

Bloqueantes: nenhum

Recomendações:
1. **A volta do escuro não prova que o tema virou.** O caso fora da sessão (`e2e/operacao.spec.ts:134-149`) compara o fundo da barra com `corDoToken(page, 'fundo')` lido na própria página, e o caso com a sessão aberta (`:160-187`) faz o mesmo. As duas medidas são relativas. Se a casca da operação deixasse de seguir o `prefers-color-scheme`, a volta "dark" passaria medindo o tema claro outra vez, e o axe rodaria no claro.
   - **Correção sugerida:** guardar o `fundo` da volta clara e exigir, na volta escura, que o valor seja diferente dele, ou ler o atributo de tema no `html`.
   - **Destino:** o Validador ou a X2.
2. **As fotos de `.processo/vitrine/operacao-*.png` são de antes da troca para `t-cartao`.** O tamanho e o peso não mudaram, mas a altura de linha da marca passou a 22 px. A diferença visual deve ser nula ou de 1 a 2 px no alinhamento.
   - **Correção sugerida:** o Validador confere numa foto nova quando o vitrine tiver o papel de operador.
