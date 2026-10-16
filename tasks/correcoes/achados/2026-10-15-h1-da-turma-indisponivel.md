# Achados das revisões — `tasks/correcoes/2026-10-15-h1-da-turma-indisponivel.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-15 21:17:25 · `tasks/correcoes/2026-10-15-h1-da-turma-indisponivel.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: computador e celular, escola cheia e vazia; as duas escolas mostram a mesma tela "Esta turma não está disponível")
Estados: ok. A correção só toca a asserção do estado "turma indisponível". Carregando e erro da `Turma` continuam em `apps/web/src/areas/professor/Turma.tsx:73-83`, fora do escopo desta correção.
Acessibilidade: ok. A tela tem um único `h1` ("Turma"), o aviso é `role=status` e recebe o foco quando a turma some com a tela aberta (`Turma.tsx:73-78`). O link "Voltar para Turmas" tem `min-h-11` (`Turma.tsx:60`) e contraste legível nas fotos.
Chromebook fraco: não afetado. A mudança é só de teste.
Celular: ok. A foto de 360 px não tem rolagem horizontal nem texto cortado. A barra de baixo mostra "Turmas" ativa e o texto quebra limpo.
Ação oficial protegida: sim, não se aplica. A tela não tem ação oficial.

Verificação da correção, em `e2e/acesso-da-turma.spec.ts:1103-1106`:
- O `h1` "Turma" bate com a foto e com o código: `nomeDaTurma` vira `'Turma'` e `serieDaTurma` vira `undefined` quando `indisponivel` (`Turma.tsx:54-55`). Isso vale no cenário do teste, em que `turma.data` ainda está em cache.
- `toHaveText('Turma')` com string é correspondência exata, então rejeita "Turma 7ºA sintética …". Está certo.
- `not.toContainText(turma.turmaNome)` no `body` é seguro: a lateral só tem escola e usuária, e a foto não mostra a turma em lugar nenhum.
- A mutação declarada (`|| indisponivel` removido em `Turma.tsx:54`) faria o `h1` dizer "Turma <nome>" e o teste falharia. A asserção prova a regra: o título não continua afirmando a turma que saiu.
- O diff do arquivo tem dois trechos. O trecho da 13.0 (import de `secoes` e a asserção de "Turmas" na lateral, perto da linha 319) não está em revisão, como o pedido avisa.

Bloqueantes: nenhum
Recomendações:
- O texto do aviso tem "Volte para Turmas; se ela deveria estar lá, fale com a coordenação." Está correto e diz o que fazer. Como o título é só "Turma", o aviso poderia abrir com algo curto como "Turma indisponível". É gosto, não bloqueia.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-15 21:17:31 · `tasks/correcoes/2026-10-15-h1-da-turma-indisponivel.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma. A correção não traz migration nem toca o schema.

Queries verificadas: nenhuma nova. A correção não altera repository, service nem endpoint. Só muda uma asserção do e2e, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/acesso-da-turma.spec.ts`, nas linhas 1103 a 1106.

Teste de isolamento: presente e efetivo.
- **A turma perdida não deixa rastro na tela.** O teste exige um único `h1`, com o texto exato `Turma`. Exige também que a página inteira não contenha o nome da turma: `page.locator('body').not.toContainText(turma.turmaNome)`.
- **A mutação declarada quebra o teste.** Ela tira o `|| indisponivel` de `nomeDaTurma`, na linha 54 de `apps/web/src/areas/professor/Turma.tsx`. Sem essa condição, o dado já carregado da turma voltaria ao `h1` como `Turma <nome>` e ao título da aba. Assim, `toHaveText('Turma')`, a verificação do `body` e `toHaveTitle('Turma · Turmma')` ficariam vermelhos.
- **A mensagem não revela se a turma existe.** O texto "Esta turma não está disponível" é o mesmo para turma inexistente, de outra escola ou com vínculo encerrado. O teste anterior, perto da linha 1056, já cobre o caso da turma de outro professor por endereço direto. As fotos da vitrine também não mostram nome nem série no `h1`.

Bloqueantes: nenhum.

Recomendações:
- O documento da correção (`tasks/correcoes/2026-10-15-h1-da-turma-indisponivel.md`, linhas 41 e 42) diz que a verificação do nome da turma fica no `principal`, mas o teste olha o `body` inteiro. O `body` é mais forte; vale alinhar o texto do documento.
- A linha da série (`serieDaTurma`, linha 55 de `Turma.tsx`) não tem mutação própria. O teste a cobre só de forma indireta, pela ausência do nome. Uma mutação que tire o `|| indisponivel` dela tornaria a prova explícita.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-15 21:18:15 · `tasks/correcoes/2026-10-15-h1-da-turma-indisponivel.md`

VEREDITO: REPROVADO

Cenários exigidos:
- Caminho feliz: a turma é lida e o `h1` diz "Turma <nome>", com a série embaixo.
- A turma sai na releitura (a coordenação encerrou o vínculo com a tela aberta). Dela não fica nada na tela: nem o nome, nem a série no `h1` ou na descrição, nem o diálogo, o link ou o código. A aba volta a "Turma · Turmma" e o foco vai para o aviso.
- Uma queda passageira da rede (503) não tira a turma nem o diálogo da tela.
- Isolamento: a turma de outro professor, aberta pelo endereço, responde como a que não existe.
- Permissão: o vínculo encerrado tira o acesso à turma.

Cobertos:
- Feliz: linhas 302-304.
- 503 sem tirar a turma: linhas 1084-1091.
- Isolamento pelo endereço: linhas 1056-1061.
- Vínculo encerrado: linhas 1097-1112, com o `h1` agora exato "Turma" (`toHaveText`), uma só vez, e o nome da turma fora do `body`.
- A mutação declarada derruba a cláusula `|| indisponivel` do `nomeDaTurma` (`Turma.tsx:54`). Na releitura, o `turma.data` continua com a turma antiga. Por isso, sem a cláusula o `h1` passa a ser "Turma <nome>", e a linha 1105 falha pelo motivo certo, antes até do `toHaveTitle` da linha 1110.
- Não há `.skip` nem mock de coisa nossa. Os `route` com 503 simulam a rede caindo, que está fora do sistema.

Bloqueantes:
1. A série que a correção diz provar não está provada.
   - **Onde:** `e2e/acesso-da-turma.spec.ts:1103-1106` e `tasks/correcoes/2026-10-15-h1-da-turma-indisponivel.md:41-42`.
   - **O que está errado:** o comentário do teste diz "sem o nome nem a série". O documento diz "mais a linha da série fora da tela (`not.toContainText(turma.turmaNome)`)". Só que o `turmaNome` é "7ºA sintética …" e a série é "7º ano do Ensino Fundamental" (é o texto que a linha 304 exige no estado com dado). Uma não contém a outra. Se alguém tirar `|| indisponivel` do `serieDaTurma` (`apps/web/src/areas/professor/Turma.tsx:55`), a tela da turma perdida mostra a série embaixo de "Turma", e o teste continua verde. Nenhum teste de unidade da web cobre esse caso. O que fica é uma regra declarada no documento e no comentário sem nenhum teste que a prove.
   - **Correção exigida:**
     - Junto da linha 1106, acrescentar `await expect(principal(page)).not.toContainText('7º ano do Ensino Fundamental')`, de preferência num nome compartilhado com a linha 304.
     - Acrescentar à seção "Mutações" um segundo bloco: `arquivo: apps/web/src/areas/professor/Turma.tsx`, o mesmo teste, trocando a linha 55 por `const serieDaTurma = turma.data === undefined ? undefined : nomeDaSerie(turma.data.serie)`.
     - Corrigir a frase do documento: a série se prova pelo texto dela, e não pelo `turmaNome`.

Recomendações:
- O documento (linha 42) cita `not.toContainText(turma.turmaNome)` no `principal`, mas o diff usa `page.locator('body')`. O `body` é mais forte, porque inclui a lateral e os diálogos. Basta alinhar o texto do documento ao que o teste faz.
- As fotos da vitrine mostram o endereço de turma inexistente, em que o `turma.data` é `undefined`. O caso desta correção é outro: a turma sai na releitura, e o `turma.data` antigo continua em memória. Quem só lê a foto não vê o caso da correção.

Não alterei nenhum arquivo e não rodei o e2e. A mutação declarada já tinha sido provada pelo portão. A que exijo no bloqueante eu provei lendo o código: a série não é trecho do nome da turma.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/acesso-da-turma.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/correcoes/2026-10-15-h1-da-turma-indisponivel.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/areas/professor/Turma.tsx

## test-engineer · 2ª rodada · APROVADO · 2026-10-15 21:32:13 · `tasks/correcoes/2026-10-15-h1-da-turma-indisponivel.md`

VEREDITO: APROVADO

**Cenários exigidos** (é uma correção de asserção, e o cenário é o mesmo da rodada anterior):
- Caminho feliz: com a turma lida, a tela mostra o nome dela no título e a série "7º ano do Ensino Fundamental".
- Borda real da escola: a coordenação encerra o vínculo com a tela aberta. A releitura não acha mais a turma, e a tela mostra só o título "Turma", sem o nome e sem a série. O diálogo, o código e o link saem da tela, e o foco vai para o aviso.
- Rede da escola caindo na releitura: a turma e o diálogo ficam na tela, e a seção mostra o erro.
- Permissão: a professora com o vínculo encerrado não vê mais a turma, nem o código, nem o link (`page.content()` não contém nenhum dos dois).
- Isolamento: não se aplica. A correção não mexe em consulta, repository nem endpoint.

**Cobertos:** todos, em `e2e/acesso-da-turma.spec.ts:1066-1116`.

Conferi a correção exigida na 1ª rodada:
- `SERIE_DA_TURMA` foi criada em `e2e/acesso-da-turma.spec.ts:57` e é a mesma constante usada no estado com dado (linha 306) e no estado da turma perdida (linha 1109). Assim, o texto que o teste nega com a turma perdida é o mesmo que ele exige com a turma lida, e não dá para um mudar sem o outro.
- A nova asserção (`not.toContainText(SERIE_DA_TURMA)` dentro da área principal) checa exatamente o lugar onde a série aparece. A `Tela` mostra a série como linha de apoio do título, nos dois retornos de `apps/web/src/areas/professor/Turma.tsx` (linhas 72 e 87), e a linha 306 já prova que esse texto fica dentro da área principal.
- O segundo bloco de mutação (`tasks/correcoes/2026-10-15-h1-da-turma-indisponivel.md:62-67`) reproduz palavra por palavra a linha 55 de `Turma.tsx`. A mutação tira `|| indisponivel` da série, que tem a mesma condição do título. Se a mutação do título fica vermelha, é porque a turma ainda tem dado nesse estado. Então, com esta mutação, a série volta para a tela e a linha 1109 fica vermelha pelo motivo certo.
- O documento agora diz que a série se prova pelo texto dela e explica por que o nome da turma não serve para isso (linhas 42-44).

Também conferi:
- Não há `.skip`, teste comentado, nem mock que esconda a regra. O 503 da rede caindo é simulado com `page.route` para provocar a falha, e o encerramento do vínculo é feito no banco de verdade.
- O teste não chama provedor de IA.
- Não há operação concorrente envolvida.

**Bloqueantes:** nenhum.

**Recomendações:**
- Ajustar duas referências de linha no documento:
  - A seção "Fora desta correção" (linha 24) e a seção "Correção" (linha 49) chamam de "linha 304" a asserção que hoje está na linha 306, depois que a constante entrou no topo do arquivo.
  - A seção "Correção" (linha 49) fala em "trecho da linha 1103", mas a asserção alterada está nas linhas 1105-1109.

  Isso não muda nada no que o teste prova.
