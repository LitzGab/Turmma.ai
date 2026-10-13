# Achados das revisões — `tasks/prd-pele-e-casca/6_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-13 14:57:08 · `tasks/prd-pele-e-casca/6_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As divergências foram registradas na `techspec.md` §9, na `docs/interface.md` 10.2 e, a do carregando, na A53 do `cenarios.md`.
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

**O que conferi**
- **Escopo:** a tarefa revestiu `Estado`, `Faixa`, `Abas` e os três de `estado/` sem mudar as props. Criou `Aviso`, `Contador` e `Toque`, pôs as três em `PECAS_FORA_DA_ENTRADA` e deu a elas seções novas na galeria.
- **Fora do pedido, nada:** nenhum aviso escrito à mão foi convertido, e o contador da lateral não foi tocado. A foto `professora--professor-turmas--computador.png` mostra o contador de "Seu time" ainda na pele antiga, como deve ficar até a 12.0.
- **Entrada:** os três de `estado/` só importam `Botao` e `api/cliente`. A entrada fica em 129,6 kB, abaixo do teto de 150.
- **Fotos:** na galeria, claro e escuro (computador-2 a 4), o selo traz glifo e texto em cada família. O aviso tem uma forma por tom e o toque escolhido leva o visto. No erro, o "Tentar de novo" e o "Tentando de novo…" ficam fora do alerta. Em `aluno--aluno-tutor--celular.png` a faixa aparece sem botão.
- **Regras 00, 40 e 60:** nenhum `.skip`, `any`, `.only` nem `TODO` nos arquivos novos. O vocabulário segue o glossário e os nomes da galeria são inventados.

**Recomendações**
1. `tasks/prd-pele-e-casca/6_task.md:112`: a linha diz que a exportação de `FamiliaDeCor` e `FAMILIAS_DE_COR` pelo `Contador` está na `techspec.md` §9 e na 9.0 do `tasks.md`. Não está em nenhum dos dois. A 9.0 (`Ladrilho`) corre em paralelo e pode escrever a sua própria lista das dez famílias. Uma de duas:
   - registrar na 9.0 do `tasks.md` que o `Ladrilho` importa o tipo de `Contador.tsx`;
   - ou tirar a linha da tabela, porque isso não diverge da Tech Spec.
2. `tasks/prd-pele-e-casca/6_task.md:108`: a linha do `Aviso` cita "`cenarios.md`, parte A, linhas da 6.0", mas o `cenarios.md` não tem linha do `Aviso` vinda da 6.0. O registro real está na `techspec.md` §9 e na `docs/interface.md` 10.2. Basta corrigir a citação.
3. `apps/web/src/componentes/Abas.tsx:38-39`: o comentário diz que a 10.2 "pede 48 px para a linha de abas solta, e 44 px no cabeçalho de página". A própria tarefa reescreveu a 10.2 para 44 px, com os 48 marcados como do mockup solto. Deixar o comentário com o texto novo.
4. A tabela "Arquivos previstos" (`6_task.md:45-63`) ainda não lista `SeloEFaixa.test.tsx`, `nome-dos-chunks.test.ts` e os três documentos da spec, e ainda dá `e2e/pecas-estado.spec.ts` como "alterado", quando ele é novo. A divergência está explicada na linha 111, mas é a tabela que diz com quem a tarefa corre em paralelo.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/{SeloDeEstado,Faixa,Abas,Aviso,Contador,Toque}.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/estado/{EstadoCarregando,EstadoErro,EstadoVazio}.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/galeria/secoes/estado.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/nome-dos-chunks.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/pecas-estado.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/{6_task,techspec,cenarios,tasks}.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/docs/interface.md`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-13 14:57:26 · `tasks/prd-pele-e-casca/6_task.md`

**VEREDITO: REPROVADO**

Há um bloqueante, e a correção é de uma linha. O resto da tarefa está bem provado.

**Cenários exigidos:**
- Selo, aviso, contador e toque dizem o estado por texto, glifo ou ARIA, sem ler a cor.
- No aviso, só o `erro` é `alert`, os outros tons não têm papel vivo, e nada fecha.
- Abas pelo teclado: uma parada no Tab, setas com volta, Home e End, `aria-selected` e `aria-controls`.
- `EstadoErro` com o `alert` só na mensagem, o botão fora dele e o "Tentando de novo…" em `status`.
- `EstadoCarregando` parado, sem animação.
- `EstadoVazio` com a ação e o "Verificando…".
- Axe e contraste por família e tom, nos dois temas e nos dois projetos.
- Alvo de 44 px no `celular`.
- A faixa não fecha, no componente e no e2e.
- Os três de `estado/` ficam na entrada.
- Nenhum spec de regra é editado.

Os casos de borda do domínio para uma peça sem servidor são o contador em 0, negativo, NaN e 128, o aviso sem título, o toque desligado (e escolhido), a aba ativa fora da lista e a largura de 360 px. Permissão, isolamento e concorrência não se aplicam, e o documento declara isso.

**Cobertos:** todos.
- Rodei os 7 arquivos de unidade, `teclado-das-abas.test.ts` incluído: 50 de 50 verdes.
- Conferi as 37 mutações contra o `git diff`. Cada uma chega à cláusula e fica vermelha pelo teste citado. O `-t` de cada uma casa com o nome do caso.
- A peça fora da entrada tem dupla prova: o teste de importação de `estados.test.tsx` e o build de verdade em `apps/web/nome-dos-chunks.test.ts:354-358`, que também pega import por barril.
- Nenhum spec de regra foi tocado. `aluno-tutor`, `pecas-sobrepor`, `pecas-ia`, `governanca`, `pedido-do-titular` e os 18 specs do "Tentar de novo" estão fora do `git status`.
- Não há `.skip`, `.only` nem mock de coisa nossa. Nenhum teste chama IA.

**Bloqueantes:**
- `apps/web/src/componentes/Aviso.test.tsx:88`: `expect(container).not.toBe(semTitulo)` compara os contêineres de dois `render` diferentes. Ela sempre passa, e a regra 40 proíbe isso de forma expressa. Correção: apagar a linha e o `{ container }` da linha 79, que só existe para ela. As asserções do caso que provam a regra (`t-cartao` ausente e o `textContent` igual ao corpo) já bastam.

**Recomendações (não bloqueiam):**
- `Aviso.tsx:51` e `EstadoErro.tsx:12`: as mutações que põem `role="alert"` no contêiner deixam o alerta aninhado. O vermelho vem do `getByRole('alert')` achando dois elementos, e não da asserção "botão dentro do alerta". O teste prova a regra mesmo assim, porque mover o papel para fora também o deixa vermelho. Uma mutação que mova o papel em vez de duplicá-lo seria uma prova mais limpa.
- Estas cláusulas têm teste mas não têm bloco de mutação:
  - "não fecha" do `Aviso` (o caso existe no teste, ao contrário da `Faixa`, que tem bloco)
  - `bg-azul` do sublinhado das abas
  - `t-secao` do `EstadoVazio`
  - `t-cartao` e `text-tinta` do `Aviso`
  - `t-apoio` da `Faixa`
- `Abas.tsx:78`: o `t-rotulo` novo da aba não tem asserção em teste nenhum, nem de unidade nem de e2e. A subtarefa não exige a tipografia, mas a pele dela fica sem prova.
- `e2e/pecas-estado.spec.ts:219-220`: o contraste das abas é calculado contra o token `fundo`. Vale confirmar que a lista de abas da galeria está mesmo sobre `fundo`, e não sobre `superficie`.
- `e2e/pecas-estado.spec.ts:370`: o "Tentando de novo…" da galeria é fixo, e o clique ali só prova o contador de tentativas. A troca de estado está provada no componente (`estados.test.tsx:41-48`), e isso basta. Só não leia este caso do e2e como prova da troca.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Aviso.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Aviso.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/estado/EstadoErro.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/estado/estados.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Abas.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/nome-dos-chunks.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/pecas-estado.spec.ts

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-13 14:57:31 · `tasks/prd-pele-e-casca/6_task.md`

VEREDITO: APROVADO

Tela vista: sim (21 fotos lidas, escola cheia e vazia). Li a galeria em claro e escuro, nos dois tamanhos, as telas `/aluno/tutor` e `/professor/turmas` nos dois estados e, por conta própria, a turma aberta (`/professor/turmas/<id>`, onde as `Abas` entram em uso real) em 1366 e 360 px. A galeria não tem sessão, então a "vazia" é a mesma página; as fatias 2 a 4 (computador) e 4 a 7 (celular) cobrem as seções desta tarefa.

Estados: ok.
- Carregando: `EstadoCarregando`, texto parado em `role="status"`, sem animação (`EstadoCarregando.tsx:15`).
- Vazio: `EstadoVazio`, que convida e diz o que vai aparecer. O vazio do aluno ("Nenhuma atividade para pedir ajuda agora… Quando houver uma, ela aparece aqui") diz o próximo passo.
- Erro: `EstadoErro`, com mensagem do catálogo, "Tentar de novo" fora do `alert` e "Tentando de novo…" em `status` (`EstadoErro.tsx:25-34`).
- Com dado: galeria e turma aberta.

Acessibilidade: ok.
- O estado nunca é só cor:
  - O selo tem texto e uma forma de ícone por família (`SeloDeEstado.tsx:18`).
  - O `Aviso` tem um glifo por tom, e só o `erro` é `alert`, apenas no texto (`Aviso.tsx:52`).
  - O `Toque` leva `aria-pressed` e o visto (`Toque.tsx:36,41`).
  - O `Contador` diz o que conta em texto `sr-only` (`Contador.tsx:47`).
  - A aba ativa tem três pistas: texto `azul-texto`, sublinhado de 3 px e `aria-selected` (`Abas.tsx:74,78,82`).
- Teclado das abas: uma parada no Tab, setas com volta, Home e End, com `aria-controls`.
- A `Faixa` é `role="note"`, sem botão nem link.
- Contraste: calculei os pares a partir dos tokens, nos dois temas, e todos passam de 4,5:1. Nada depende de hover.
- Rótulos: os grupos de `Toque` na galeria têm `role="group"` com nome.

Chromebook fraco: ok.
- `Aviso`, `Contador` e `Toque` ficam fora da entrada e entram em `PECAS_FORA_DA_ENTRADA` (`nome-dos-chunks.ts`).
- Os três de `estado/` só importam `Botao`.
- O primeiro carregamento fica em 129,6 kB em brotli, abaixo do teto de 150 kB, segundo a medida declarada na tarefa.
- Não há animação em laço, e `Contador`, `EstadoCarregando` e `Aviso` não pulsam.

Celular: ok.
- Sem rolagem horizontal nem texto cortado a 360 px nas seções desta tarefa (`professora--galeria--celular-4` a `7`) nem na turma aberta.
- As abas quebram em duas linhas, com todas à vista.
- `Aba` e `Toque` têm 44 px abaixo de 768 (`Abas.tsx:78`, `Toque.tsx:39`); o contador é leitura e tem 24 px.
- A mesma coleção de pele vale no escuro.

Ação oficial protegida: sim, não se aplica. A tarefa só reveste peças de estado e não cria aprovar, publicar nem excluir. A `LinhaAprovacao`, o selo e `[data-estado]` continuam sem edição.

Bloqueantes: nenhum.

Verificações feitas:
- Rodei os sete arquivos de teste da tarefa: 68 testes, todos verdes.
- Não rodei `e2e/pecas-estado.spec.ts`: o contraste e a medida em navegador ficaram conferidos só pelas fotos e pelo cálculo dos tokens.
- Foto e código concordam: tokens, classes e papéis da árvore batem com o que as fotos mostram.
- `docs/interface.md` 10.2 foi atualizado junto com os desvios (`Abas` 44 px, `Contador` sem `role="img"`, `Aviso` sem papel vivo fora do erro). Não há contradição entre doc, código e tarefa.

Recomendações (não bloqueiam):
1. **Defeito herdado, fora desta tarefa (vai para a 10.0):** em 360 px, o placeholder da caixa de pedido do professor quebra em duas linhas e o botão "Só conversar" o cobre (`professora--galeria--celular-7.png`, `apps/web/src/componentes/ia/CaixaPedido.tsx:112-125`, `rows={1}` com `min-h-11`). O mesmo componente está em `CaixaDoAssistente`, tela real. A 10.0 deve fazer o placeholder caber numa linha ou a barra ficar abaixo da área de escrita.
2. **Padrão visual:** o `EstadoVazio` de lista fica à esquerda e o tracejado centraliza, na mesma galeria. A decisão está documentada. A spec de área que recompuser as telas deve unificar, ou a `docs/interface.md` 10.2 deve dizer qual vale onde.
3. **Placeholder da galeria:** o texto "Procurando as suas conversas." do vazio de exemplo é de galeria, mas se for copiado para tela real vira vazio que não diz o que fazer. Pode ser reescrito como convite.
4. **Aviso, Contador e Toque sem consumidor ainda:** só a galeria os usa. A spec de área deve converter os cerca de 30 avisos à mão, e o teste `pecas-estado` deve ser mantido quando o `Contador` ganhar a lateral (12.0).

Arquivos relevantes: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/` (`Aviso.tsx`, `Contador.tsx`, `Toque.tsx`, `Abas.tsx`, `Faixa.tsx`, `SeloDeEstado.tsx`, `estado/*.tsx`) e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/galeria/secoes/estado.tsx`.

## test-engineer · 2ª rodada · APROVADO · 2026-10-13 15:08:14 · `tasks/prd-pele-e-casca/6_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** o mesmo conjunto da 1ª rodada. Desta vez auditei só o diff desde aquela rodada e o que ele afeta:
- Aviso: o título opcional, a regra "sem título só o corpo aparece", o `alert` só na mensagem e "não fecha".
- Abas: o rótulo em `t-rotulo` e o sublinhado `bg-azul`.
- O e2e das abas, com o fundo real atrás da lista.
- As mutações novas.

**Cobertos:**
- **A correção exigida foi feita.** Em `apps/web/src/componentes/Aviso.test.tsx:79-87` saíram a asserção `expect(container).not.toBe(semTitulo)`, que sempre passava, e o `{ container }` que só existia para ela. O caso agora prova a regra só com o que interessa:
  - com título: `t-cartao` e `text-tinta` no título, e `text-tinta` no corpo;
  - sem título: nenhum `.t-cartao` e o `textContent` igual ao corpo.
- **Teste novo** em `apps/web/src/componentes/Abas.test.tsx:69-72`: confere `t-rotulo` em todas as abas, a ativa e as outras. O bloco de mutação novo tira `t-rotulo ` do início da classe, em `Abas.tsx:78`, e faria esse teste falhar.
- **Mutação `bg-azul` → `bg-borda`** do sublinhado: o teste "a ativa diz que é por três pistas" confere `bg-azul` em `Abas.test.tsx:47`, então o bloco chega à cláusula.
- **Mutações novas do `Aviso`**: cada uma mexe numa classe ou num papel que o teste citado confere, então o vermelho sai pelo motivo certo:
  - "não fecha": um botão injetado depois do corpo; o teste procura `button` em todos os tons.
  - `t-cartao` / `text-tinta` / `text-apoio`.
  - O `role` movido para o contêiner. O teste `:58-68` exige que o botão fique fora do `alert` e dentro do `[data-aviso]`, e esse movimento o deixa vermelho.
- **Demais blocos novos:** `EstadoErro` com o `role` no contêiner, `t-secao` no `EstadoVazio` e `t-apoio` na `Faixa`. Os nomes batem com os testes e a linha mutada existe no código.
- **`e2e/pecas-estado.spec.ts:219-227`**: o contraste calculado passa a usar o par de cores que a tela realmente desenha. O teste sobe do elemento até achar o primeiro fundo pintado e exige que ele seja `fundo`. Assim, o contraste de `azul-texto` e `sutil` sobre `fundo` deixa de ser uma suposição.
- **Mudanças sem cláusula nova:**
  - O comentário do `Abas.tsx` (44 px contra 48 px): só documentação, não precisa de bloco.
  - A descrição do `EstadoVazio` na galeria: texto de demonstração, sem regra a provar.
- **Rodei** `npx vitest run src/componentes/Aviso.test.tsx src/componentes/Abas.test.tsx`: 15 de 15 verdes. Não há `.skip`, teste comentado, mock nem IA no diff.

**Bloqueantes:** nenhum.

**Recomendações:**
- Em `e2e/pecas-estado.spec.ts:220-226`, o laço que acha o primeiro fundo pintado só serve a este caso. Se outro caso de contraste precisar dele, vale levá-lo para um auxiliar ao lado de `desenho` e `estiloDe`, para não aparecer em várias cópias.
- Em `tasks/prd-pele-e-casca/6_task.md:309,400,427,435`, os nomes de teste nos blocos de mutação repetem crases e frases inteiras do `it(...)`. Se um título mudar, o bloco quebra sem a regra ter mudado. Prefixos mais curtos e estáveis, como já se fez em `:426` ("o rótulo da aba é `t-rotulo`"), aguentam melhor.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-13 15:08:27 · `tasks/prd-pele-e-casca/6_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

O que conferi do diff desde a rodada 1:

- **As quatro recomendações da rodada 1 foram tratadas.**
  - Em "Divergências resolvidas", saiu a linha do `Contador` que exportava `FamiliaDeCor`.
  - A linha do `Aviso` não cita mais o `cenarios.md`. Agora aponta para a `techspec.md` §9 e para a `docs/interface.md` 10.2, onde a divergência está registrada.
  - O comentário de `Abas.tsx:41-42` não se contradiz mais: 44 px é o que a 10.2 pede, e os 48 px ficam como os da linha de abas solta do mockup, que esta peça não desenha.
  - A tabela "Arquivos previstos" agora lista os arquivos que a tarefa realmente tocou, e `e2e/pecas-estado.spec.ts` aparece como novo.
- **Testes.**
  - `Abas.test.tsx` ganhou o caso do `t-rotulo`, que a nova mutação de `Abas.tsx:78` cobre.
  - Em `Aviso.test.tsx` saiu `expect(container).not.toBe(semTitulo)`, uma asserção que passava sempre. Foi para melhor.
  - O e2e das abas passou a provar que o contraste calculado é o do fundo que de fato aparece atrás da lista (`fundo`).
- **Mutações.** Os blocos novos e os refeitos (o papel do contêiner do `Aviso` e do `EstadoErro`, o "não fecha", `t-cartao`, `text-tinta`, `bg-azul`, `t-rotulo`, `t-secao`, `t-apoio`) mudam de fato a cláusula que cada um diz testar.
- **Fotos.**
  - `.processo/vitrine/professora--galeria--computador-3.png` mostra a nova descrição do vazio "Nenhuma conversa" (`apps/web/src/galeria/secoes/estado.tsx:175`). Usa o vocabulário do glossário ("Assistente") e diz o que fazer, em vez de descrever a busca.
  - `.processo/vitrine/professora--galeria--computador-4.png` mostra o selo, o erro e a região viva sem nada fora do que a tarefa pede.

Recomendações:
- `docs/interface.md:1374` diz "o vazio tracejado (`borda-campo`) centraliza; o vazio de lista continua à esquerda". Mas em `apps/web/src/componentes/estado/EstadoVazio.tsx:31` as duas variantes têm borda tracejada em `borda-campo`. O que muda entre elas é só a variante `tracejado`, que centraliza. Vale escrever "a variante `tracejado` centraliza" na 10.2 e na `techspec.md` §9, para que quem ler não ache que o vazio de lista não tem tracejado.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-13 15:08:38 · `tasks/prd-pele-e-casca/6_task.md`

VEREDITO: APROVADO

Tela vista: sim (17 fotos lidas, escola cheia e vazia). Li as fatias da galeria em que moram selo, abas, aviso, contador, toque e os três estados, no computador (claro e escuro) e no celular de 360 px. Li também `/professor/turmas` e `/aluno/tutor`, cheios e vazios. Rodei os 7 arquivos de teste da tarefa: 69 testes passam.

Estados: ok
- Carregando, vazio e erro, conferidos pelo código e pelos testes, porque a vitrine não os fotografa.
- `estado/EstadoCarregando.tsx` é texto parado em `status`.
- `estado/EstadoErro.tsx` tem o `alert` só na mensagem, o "Tentar de novo" fora dele e o "Tentando de novo…" em `status`. A mensagem diz o que fazer.
- `estado/EstadoVazio.tsx` convida: título, o que vai aparecer ali, ação e "Verificando…".
- O texto que mudou nesta rodada (`apps/web/src/galeria/secoes/estado.tsx:175`) ficou melhor: "As conversas com o Assistente aparecem aqui. Se acabou de pedir uma, verifique de novo." deixou de ser "Procurando as suas conversas".

Acessibilidade: ok
- Aviso, selo, contador e toque dizem o estado por ícone e texto, nos dois temas, nunca só pela cor.
- `Aviso` só é região viva no `erro`; os outros tons não têm papel vivo e nenhum fecha.
- `Faixa` é `role="note"` e sem botão.
- `Abas` mantém uma parada no Tab, com setas, Home, End, `aria-selected` e `aria-controls`.
- `Toque` é `aria-pressed` e o escolhido leva o visto.
- O comentário de `Abas.tsx` (44 px, 10.2) agora bate com o código (`min-h-11`).

Chromebook fraco: ok
- Sem animação nos estados.
- As três peças novas (`Aviso`, `Contador`, `Toque`) ficam fora da entrada, nos `pecas-*`.
- O primeiro carregamento sobe 1,4 kB em brotli e fica em 129,6 kB, abaixo do teto de 150 kB (medida do documento da tarefa, não refeita por mim).
- `apps/web/nome-dos-chunks.test.ts` prova que os três de `estado/` moram na entrada.

Celular: ok
- A 360 px não há rolagem horizontal nem texto cortado nas peças desta tarefa.
- As abas quebram em duas linhas e ficam todas à vista.
- Aba e `Toque` têm 44 px abaixo de 768; o botão do aviso e o "Tentar de novo" ficam abaixo do texto, empilhados.
- Nada depende de hover ou atalho.

Ação oficial protegida: sim. A tarefa não cria nem altera ação oficial; `Faixa` e `Aviso` não ganham botão de fechar.

Bloqueantes: nenhum

Recomendações:
- Placeholder da `CaixaPedido` cortado a 360 px: em `professora--galeria--celular-7.png`, "Peça uma atividade, um plano de aula…" quebra e a segunda linha some atrás do botão "Só conversar". O defeito vem de antes e a peça não é tocada aqui (`apps/web/src/componentes/ia/CaixaPedido.tsx:112-125`). Já está registrado para a 10.0 (subtarefa 10.1) em `2_task.md`, `3_task.md`, `4_task.md` e `5_task.md`, e quem revisar a 10.0 deve tratá-lo como bloqueante.
- A foto reflete o último e2e, e `e2e/pecas-estado.spec.ts` não rodei: o contraste calculado e os 3 px do sublinhado são dele e do portão. Se alguma foto contradisse o código, valeria o código; nenhuma contradisse.
- Nota sobre as fotos: o `Escuro` da galeria sai igual à foto padrão porque a aparência ficou gravada como escura; o claro está em `vazia--professora--galeria--computador-3.png`, também sem defeito.

Arquivos principais:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Abas.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Aviso.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/estado/EstadoVazio.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/galeria/secoes/estado.tsx`
