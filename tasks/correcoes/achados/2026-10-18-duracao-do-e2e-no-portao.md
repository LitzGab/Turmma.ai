# Achados das revisões — `tasks/correcoes/2026-10-18-duracao-do-e2e-no-portao.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-18 10:47:42 · `tasks/correcoes/2026-10-18-duracao-do-e2e-no-portao.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok (a mudança não toca login, API nem limitador)
Fila e prioridade: ok (a fila de carga entre as linhas continua em `garantirFilaDeCarga`, e o portão só lê o relatório depois que a corrida acaba)
Concorrência: protegida (cada linha grava o relatório no próprio checkout, em `.processo/e2e-duracao.json`, pasta que o `.gitignore` já ignora; o arquivo da corrida anterior é apagado antes, e o e2e de duas linhas não roda ao mesmo tempo por causa da fila de carga)
Índice e paginação: ok (não se aplica, a mudança não cria query)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica, é código de processo)
Bloqueantes: nenhum

Os dois pontos que podiam afetar a esteira estão certos:
- **A variável chega ao Playwright.** `tools/ci/executar.ts:19` monta o ambiente a partir de `process.env`, e o `rodar` do portão passa `env: ambiente`. O `EDUCA_RELATORIO_DO_E2E` chega ao `playwright test` sem perda.
- **A esteira não muda.** Sem a variável, `relatoriosDoPlaywright` devolve o mesmo que antes: `list`, mais o `github` com `CI=true`.

Recomendações:
- `tools/ci/duracao-do-e2e.ts`, em `casosMedidos`: a duração soma as tentativas. Com `retries: 0`, como hoje no `playwright.config.ts`, isso não faz diferença. Se um dia o retry for ligado, um caso que falhou uma vez e passou na segunda vai parecer lento. Vale um comentário que prenda essa soma ao `retries: 0`, ou medir só a última tentativa.
- `tools/ci/duracao-do-e2e.ts`, em `alteracoesDoArquivo`: abre dois processos do `git` por arquivo e fica sem `timeout`. Isso é desprezível no portão. Para ficar como os outros comandos de `tools/ci/`, dá para pôr um `timeout` no `execFileSync`.
- O relatório só é medido quando a corrida passa. Quando o e2e fica vermelho, o portão reprova pela falha e não diz quais casos estavam lentos. É aceitável, mas a skill `executar-task` pode dizer isso numa linha.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/duracao-do-e2e.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/duracao-do-e2e.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/portao-local.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/playwright.config.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/executar.ts

## revisor-geral · 1ª rodada · APROVADO · 2026-10-18 10:48:15 · `tasks/correcoes/2026-10-18-duracao-do-e2e-no-portao.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. É uma correção de processo e não tem Tech Spec própria. O que foi feito é o que o documento pede em "Correção", e o portão completo ficou de fora, como o documento declara.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo; mutações conferidas)
Bloqueantes: nenhum

Recomendações:
- **Linha de resumo errada no `TODO.md`.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/TODO.md:952`, a frase "as letras (b), (d) e (e) seguem abertas, salvo a primeira frase da (c)" tirou a (c) da lista das abertas. Duas frases dela continuam por fazer: o `linhas.ts conferir` e o projeto da mutação de e2e. A (g) também segue aberta. Escrever "seguem abertas a (b), a (d), a (e), a (g) e as duas últimas frases da (c)".
- **Lacuna na atribuição de linhas.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/duracao-do-e2e.ts:128-142`, a linha alterada é atribuída ao último `test(` acima dela. Há três situações em que isso falha:
  - Uma mudança num `beforeEach` ou num ajudante que fica entre dois `describe` é cobrada do caso de cima, que a tarefa não tocou.
  - Os casos de baixo, que a mudança deixou mais lentos, passam sem cobrança.
  - Um ajudante do alto do arquivo que fica mais lento não é cobrado de caso nenhum. O documento declara este limite, mas ele é justamente o jeito comum de deixar um arquivo inteiro mais lento.

  Registrar no `TODO.md` como limite conhecido. Uma saída seria tratar a mudança fora de qualquer caso como mudança no arquivo inteiro.
- **Caso pulado some das fronteiras.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/duracao-do-e2e.ts:86`, o caso pulado sai também da lista de linhas usada para separar um caso do outro. Uma mudança dentro dele passa a contar para o caso anterior. Hoje isso não pesa, porque `.skip` é proibido pela regra 40. Mesmo assim, as fronteiras deveriam vir de todos os casos, e só a medição deveria ignorar o pulado.
- **Assinatura de commit no teste.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/duracao-do-e2e.test.ts:150-174`, o repositório temporário herda a configuração global do git. Numa máquina com `commit.gpgsign=true`, o `git commit` do teste falha. Configurar `commit.gpgsign false` no repositório temporário, como já se faz com `user.email` e `user.name`.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-18 10:49:04 · `tasks/correcoes/2026-10-18-duracao-do-e2e-no-portao.md`

VEREDITO: REPROVADO

Cenários exigidos:
- Caminho feliz: um caso de e2e que a tarefa alterou e que passou de 15 s deixa o portão vermelho. A mensagem diz arquivo, linha, projeto e segundos.
- Borda: caso lento que a tarefa não tocou, no mesmo arquivo, não reprova.
- Borda: exatamente 15 s ainda cabe, e 15,001 s não.
- Borda: o intervalo de cada caso vai da linha do `test(` até a linha antes do caso seguinte. Linha alterada antes do primeiro caso não é de caso nenhum.
- Borda: arquivo novo, ainda fora do git, tem todos os casos alterados.
- Borda: a remoção pura no diff conta como a linha de cima.
- Borda: o mesmo caso nos dois projetos (chromebook e celular).
- Borda: as tentativas do mesmo caso se somam, e o caso pulado fica de fora.
- Borda: sem relatório, ou com relatório ilegível, o portão reprova.
- Ligação: o `playwright.config.ts` acrescenta o `json` só quando a variável existe. A esteira e quem roda o e2e à mão continuam com `list` e `github`.
- Ligação: o portão passa a variável ao e2e da tarefa e reprova antes das mutações.
- Concorrência: duas linhas rodando o portão ao mesmo tempo não leem o relatório uma da outra. O relatório fica por checkout e é ignorado pelo git, e a fila de carga põe os dois portões em sequência. Não pede teste novo.
- Permissão e isolamento de escola: não se aplicam (código de processo).

Cobertos: todos os cenários acima, menos a parte da ligação do portão descrita no bloqueante 1. Rodei `npx vitest run tools/ci/duracao-do-e2e.test.ts`: 19 de 19 verdes. Conferi as 14 mutações contra o teste citado em cada uma, e todas caem pelo motivo certo. Não há `.skip`, nem mock que esconda a regra, nem provedor de IA. Conferi também o caminho da variável: `executar.ts:19` repassa o `process.env`, e o Playwright roda no host numa invocação só, então um relatório cobre os dois projetos.

Bloqueantes:
1. **`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/portao-local.ts:162` e `:147`: a ligação do portão com o relatório não tem bloco nem asserção.**
   - Linha 162: a troca de `ambienteDaSuite(...)` por `ambienteDoComando(comando, suite)` é o que de fato entrega a variável ao e2e. O teste de `tools/ci/duracao-do-e2e.test.ts:234-239` só confere o corpo de `ambienteDoComando`, não se ela é chamada. Volte a linha 162 ao texto antigo e o teste continua verde.
   - Linha 147: o `rmSync` do relatório da corrida anterior também não tem bloco nem teste. Se as duas cláusulas saírem juntas, o portão lê o relatório velho e passa calado com um caso lento.
   - Correção exigida: no teste das ligações, afirmar `rodar(comando, ambienteDoComando(comando, suite))` e `rmSync(relatorioDoE2e, { force: true })` dentro de `if (daTarefa)`. No documento, declarar um bloco `mutacao` para cada uma: voltar a chamada para `ambienteDaSuite(...)` e remover o `rmSync`.
2. **Cláusulas novas em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/duracao-do-e2e.ts` com teste mas sem bloco.** Cada uma tem teste que cairia; falta só declarar a mutação, porque cláusula nova sem bloco é bloqueante por si.
   - `:172-176`: o relatório ilegível reprova, e o documento diz isso em "Correção".
   - `:36`: o `github` na esteira, que saiu do `playwright.config.ts` e veio para cá.
   - `:75`: o `caminhoDoSpec`, que acrescenta o `e2e/`. Sem ele, o caso não casa com o diff do arquivo.
   - Correção exigida: um bloco para cada uma.
     - Para a `:172-176`: trocar `return \`o relatório de duração …\`` por `return null`, citando o caso "sem o relatório, ou com ele ilegível".
     - Para a `:36`: trocar `naEsteira ? [['github'] …] : []` por `[]`, citando o caso "sem o arquivo, a lista de sempre".
     - Para a `:75`: trocar o retorno por `arquivo`, citando o caso "devolve cada caso em cada projeto…".

Recomendações:
- Partes do arquivo que ficam fora de todo caso não são medidas. Isso vale para um `test.beforeEach` ou ajudante acima do primeiro caso, e para o que está em `e2e/__fixtures__/`. Uma mudança ali pode deixar todos os casos lentos sem acusar nenhum.
- Um `beforeEach` no começo de um `describe` cai no intervalo do último caso do `describe` anterior.
- Vale registrar os dois limites no `TODO.md` como limites conhecidos, como a letra (f) fez.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/ci/duracao-do-e2e.test.ts:146`: o comentário diz "linhas 2, 7 e 12", mas o terceiro caso está na linha 13, e o relatório de `:182` já usa 13.
- `portao-local.ts:153` e `:169`: as condições `daTarefa &&` e `alvos.e2e.length > 0` não têm teste. Se saírem, o portão fica vermelho em toda tarefa sem e2e, então o erro aparece sozinho e não é bloqueante.
- Um caso perto de 15 s pode oscilar de uma corrida para outra. Vale uma frase no `executar-task` dizendo para olhar a duração do e2e isolado com folga, e não no limite.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-18 10:54:33 · `tasks/correcoes/2026-10-18-duracao-do-e2e-no-portao.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. É uma correção de processo sem Tech Spec. O documento, o `TODO.md` (letra (a), com os limites conhecidos) e a seção "Fora desta correção" dizem a mesma coisa sobre o que fica aberto: (b), (d), (e), (g), as duas últimas frases da (c) e a duração no portão completo.

Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes: nenhum.

O que conferi no diff desde a 1ª rodada:
- **Os cinco blocos de mutação novos:** cada linha de origem existe exatamente como está escrita no código atual, e cada teste citado existe com o mesmo título.
  - `tools/processo/portao-local.ts:147`, o `rmSync`, e `:162`, o `ambienteDoComando`.
  - `tools/ci/duracao-do-e2e.ts:36`, `:75` e `:177`.
  - Os testes estão em `tools/ci/duracao-do-e2e.test.ts:52`, `:127` e `:219`, e o das ligações.
- **As duas asserções novas no teste das ligações:** batem com o fonte. O regex `if (daTarefa) {\n  rmSync(relatorioDoE2e, { force: true })` corresponde a `portao-local.ts:146-147`. A mutação `void relatorioDoE2e` derruba esse regex. A mutação para `ambienteDaSuite(suite)` derruba o `toContain`.
- **O `commit.gpgsign false` no repositório temporário:** está correto, e o comentário explica por que o teste precisa dele. O comentário do doc da função foi acertado de 12 para 13, a linha real do terceiro caso.
- **O comentário de soma das tentativas em `casosMedidos`:** registra uma armadilha real, o retry ligado faria um caso parecer lento. Não é comentário do óbvio.
- **As duas frases novas no `executar-task`:** são coerentes com o código. A duração só é lida com as suítes verdes (`portao-local.ts:169` vem depois do `find` da `:162`).
- **A tabela "Recomendações sem aplicar":** registra as recomendações da 1ª rodada, cada uma com destino ou motivo.

Recomendações:
- `TODO.md:930`: a letra (a) virou uma frase única muito longa, com os limites conhecidos dentro de um parêntese. Separar os limites numa frase própria, como foi feito na (f), facilita a releitura quando o item for revisto.

O REPROVADO do `test-engineer` na 1ª rodada é dele. Não pesa neste veredito.

Documento da tarefa: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tasks/correcoes/2026-10-18-duracao-do-e2e-no-portao.md`

## test-engineer · 2ª rodada · APROVADO · 2026-10-18 10:54:39 · `tasks/correcoes/2026-10-18-duracao-do-e2e-no-portao.md`

VEREDITO: APROVADO

**Cenários exigidos:** as duas correções da 1ª rodada.
- Correção 1: a ligação do portão com o relatório. Isso inclui a chamada `rodar(comando, ambienteDoComando(comando, suite))` e o `rmSync(relatorioDoE2e, { force: true })` dentro de `if (daTarefa)`, cada uma com asserção e com bloco de mutação.
- Correção 2: blocos de mutação para três cláusulas novas de `tools/ci/duracao-do-e2e.ts`: o relatório ilegível que reprova, o `github` na esteira e o `caminhoDoSpec`.

**Cobertos:**
- `tools/processo/portao-local.ts:162`, a chamada com `ambienteDoComando`: está afirmada em `tools/ci/duracao-do-e2e.test.ts:241` com `toContain`. A string só aparece nessa linha do portão. O bloco cita o caso "o portão da tarefa passa a variável só ao e2e e reprova pela duração antes das mutações", que existe com esse nome inteiro. Se a chamada voltar para `ambienteDaSuite(suite)`, o `toContain` falha, que é o motivo certo.
- `tools/processo/portao-local.ts:146-147`, o `rmSync` dentro de `if (daTarefa)`: está afirmado em `tools/ci/duracao-do-e2e.test.ts:242`. A expressão exige o `rmSync` na linha logo abaixo do `if`. O bloco cita o mesmo caso. Com a troca por `void relatorioDoE2e`, a expressão não casa, que é o motivo certo.
- `tools/ci/duracao-do-e2e.ts:177`, o relatório ilegível: o bloco cita "sem o relatório, ou com ele ilegível, o portão reprova: não mediu nada", que existe (`:219`). Com `return null`, o `toContain('não é um JSON legível')` cai na linha 224. A linha 221 continua verde, então o vermelho vem desta cláusula e não do relatório ausente.
- `tools/ci/duracao-do-e2e.ts:36`, o `github` na esteira: o bloco cita "sem o arquivo, a lista de sempre: list, e o github na esteira", que existe (`:127`). Com `...[]`, `relatoriosDoPlaywright(true, undefined)` devolve só `[['list']]`, e a linha 129 cai.
- `tools/ci/duracao-do-e2e.ts:75`, o `caminhoDoSpec`: o bloco cita "devolve cada caso em cada projeto, com o arquivo no caminho do repositório e o título com o describe", que existe (`:52`). Com `return arquivo`, o caminho sai `material.spec.ts` em vez de `e2e/material.spec.ts`, e o `toEqual` cai.
- O resto do diff só mexe em comentários e documentos, mais o `commit.gpgsign false` no repositório temporário do teste. Nada disso muda regra nem enfraquece asserção.
- Rodei `npx vitest run tools/ci/duracao-do-e2e.test.ts`: os 19 casos passam. Não há `.skip`, teste comentado nem mock que esconda a regra.

**Bloqueantes:** nenhum.

**Recomendações:**
- `tools/ci/duracao-do-e2e.test.ts:242` prova que o `rmSync` existe dentro de `if (daTarefa)`, mas não prova que ele vem antes da corrida do e2e. Comparar `indexOf` do `rmSync` com o da chamada `rodar(...)` cobriria isso, como já se faz na linha 243 com `motivoDaDuracaoDoE2e`. Se alguém mover o `rmSync` para depois da corrida, o portão apaga o relatório que acabou de ser gerado e sempre reprova por "não deixou o relatório". O erro aparece logo, então não é bloqueante.
