# Achados das revisões — `tasks/prd-harness/7_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · REPROVADO · 2026-10-23 14:30:11 · `tasks/prd-harness/7_task.md`

VEREDITO: REPROVADO
Caminho quente tocado: nenhum (é ferramenta do processo, `tools/processo/`, fora do produto)
Rate limit: não se aplica
Fila e prioridade: problema (o portão local lê como verde uma reconstrução que estourou o prazo; veja o bloqueante)
Concorrência: protegida. Quando dois portões rodam ao mesmo tempo, `copiaDoSupervisor` grava um arquivo provisório com o pid no nome e depois faz `rename` atômico, com o nome tirado do hash do conteúdo. O teste "depois do prazo, uma segunda corrida pega o flock" prova que a trava é solta.
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: não se aplica (fora do caminho quente)

Bloqueantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/portao-local.ts:197`: a tarefa mudou o tipo `Rodar` para devolver `boolean | 'estourou'`, e quem chama não acompanhou. Hoje a linha está assim:
  ```ts
  const reconstruiu = limpo === null || rodarMutacao(limpo)
  ```
  `'estourou'` é truthy, então `!reconstruiu` na linha 199 dá falso. Uma reconstrução da web que passou do teto de 10 min e foi morta conta como reconstruída. O portão grava o carimbo, e a vitrine e a Mesa fotografam as imagens da última mutação de tela em vez da tela de verdade. O typecheck não pega, porque a união continua aceita em contexto booleano.
  Correção exigida: comparar com `rodarMutacao(limpo) === true` e dizer na mensagem de vermelho quando o motivo foi o prazo. Um teste precisa provar que a reconstrução que estoura deixa o portão vermelho e não grava carimbo. Esse teste entra no bloco de Mutações com essa cláusula. Como a correção toca `portao-local.ts`, esse arquivo entra na lista da tarefa.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/mutacoes.ts:341` (`mutadaMs > prazo`): com o `rodarCalado` de verdade, o relógio de quem chama inclui a subida do Node do supervisor. Um teste que cai poucos milissegundos antes do prazo vira `recusada` em vez de `vermelho`. Dá para confiar só no `'estourou'` do supervisor ou somar uma folga fixa. O relógio injetado continua servindo para os testes de unidade.
- O comentário do supervisor (linha 375) promete soltar "o banco de teste". Matar o grupo derruba o cliente `docker compose`, mas não os containers que ele subiu, porque eles ficam fora do grupo de processo. Vale corrigir o texto ou registrar a limitação no runbook do portão.
- Fora do escopo desta tarefa e sem mudança em relação a antes: o Ctrl-C no portão mata o processo pai sem passar pelo `finally` que devolve o arquivo mutado. O supervisor já leva junto o grupo do teste. Fica como candidato para o `/retro`.

Rodei a suíte da tarefa: `npx vitest run --project unidade tools/processo/mutacoes.test.ts` passou nos 55 casos, em 16 s. Ela cobre os cenários (a) a (f), o neto morto, o arquivo devolvido e o `flock` solto. O que está errado é só quem chama o `Rodar` no portão.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-23 14:30:31 · `tasks/prd-harness/7_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido

Bloqueantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/portao-local.ts:197`. A tarefa trocou o retorno de `Rodar` de `boolean` para `boolean | 'estourou'`, mas o único chamador fora do teste continua lendo o resultado como booleano:
  ```ts
  const reconstruiu = limpo === null || rodarMutacao(limpo)
  ...
  if (falhas.length > 0 || !reconstruiu) {
  ```
  `'estourou'` é uma string, e toda string não vazia conta como verdadeira. Então a reconstrução da web que passa do teto de 10 min (o `rodarCalado` aplica esse teto a ela agora) e é morta pelo supervisor conta como `reconstruiu`. O portão não fica vermelho, grava o carimbo e deixa no ar a web montada a partir do fonte mutado, que é justamente o que essa reconstrução existe para evitar: a vitrine e a Mesa fotografariam a tela mutada. O typecheck não pega, porque `!x` aceita o tipo novo sem reclamar. O defeito nasce do diff desta tarefa, mesmo estando num arquivo que ela não previa.
  Correção exigida: comparar com `true` (`rodarMutacao(limpo) === true`), para que `'estourou'` e `false` caiam no mesmo ramo, de preferência com uma mensagem que diga que a reconstrução passou do teto. Registrar o arquivo em "Arquivos previstos" do `7_task.md` e escrever o bloco de mutação dessa cláusula, com um teste que fique vermelho sem ela.

Recomendações:
- `tools/processo/mutacoes.ts:390`: `terminar` pode rodar mais de uma vez, pelo prazo e por um SIGINT, SIGTERM ou SIGHUP que chegue depois, e cada chamada abre um `setInterval` novo. Um `if (estourou) return` no começo resolve.
- `tools/processo/mutacoes.ts:231-237`: `testTimeoutDoProjeto` pega o primeiro `testTimeout:` do `vitest.config.ts` com uma expressão regular, sem saber de que projeto ele é. Além disso, fixa 5 s para a unidade e 30 s para o e2e sem ler o `playwright.config.ts`. Hoje bate com a configuração, mas quebra calado no dia em que a unidade ganhar `testTimeout` próprio ou o Playwright mudar o padrão.
- `tools/processo/mutacoes.ts:405-407`: o teste que passa ou cai normalmente e deixa um neto vivo sai sem levar o grupo junto, e o neto pode continuar segurando o `flock`. A spec só exige o grupo derrubado no estouro do prazo. Mesmo assim, mandar SIGTERM ao grupo também no `close` sairia barato.
- `tools/processo/mutacoes.ts:416`: a cópia do supervisor em `/tmp` só funciona enquanto o `mutacoes.ts` importar apenas módulos `node:`. Um import relativo novo quebra todas as corridas, e o portão leria isso como "o teste não passa limpo". Vale escrever essa restrição na documentação da função.
- `tools/processo/mutacoes.test.ts`: `morreu` e `limpar` estão copiados em dois `describe`. Dá para subir os dois para o escopo do arquivo.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-23 14:31:41 · `tasks/prd-harness/7_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** (a) a mutada que dorme além do prazo injetado de 2 s sai no prazo e fica `recusada`; (b) o neto morre, com o pid conferido; (c) o arquivo volta ao que era; (d) a limpa acima do teto falha sem mutar; (e) limpa de 1 s com mutada de 61 s fica `recusada`; (f) limpa de 4 min dá prazo de 10 min, e não de 12; a mutada que falha rápido fica `vermelho`; a que passa fica `verde`; o piso de 60 s; o prazo declarado no caso vale; o termo 3 × a limpa; o `testTimeout` de 120 s; depois do prazo, a segunda corrida pega o `flock`. Também entram o Ctrl-C do portão levando o grupo junto e a concorrência da cópia do supervisor em `tmpdir`.

**Cobertos:** cada linha da tabela de testes tem o seu caso em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/mutacoes.test.ts`. Os cenários (a), (b) e (c) estão em "(a), (b) e (c): sai no prazo…". O (d) está em "(d) a limpa acima do teto…", o (e) em "(e) limpa de 1 s e mutada de 61 s", o (f) em "(f) limpa de 4 min…". Vermelho e verde estão em "mutada que falha rápido é vermelha, e a que passa é verde". O piso, o caso de 120 s, o termo 3 × e o projeto de 120 s têm cada um o seu caso, e o `flock` está em "depois do prazo, uma segunda corrida pega o flock". O relógio é injetado e nenhum provedor pago é chamado. Não há `.skip`, e o neto é conferido com `ESRCH`. Rodei o arquivo uma vez: 55 de 55 verdes, em 16 s. Os 58 nomes citados nos blocos existem no arquivo.

**Bloqueantes:**

1. **Cláusulas novas sem bloco de mutação.** A introdução da seção "Mutações" diz que cobre "o supervisor (o grupo, …)", mas o grupo não tem bloco. Cada item abaixo é falha por si:
   - **`mutacoes.ts:382`, o `detached: true`.** É o "grupo de processo próprio" da 7.3. Sem ele, `process.kill(-pid)` dá `ESRCH`, o supervisor sai com 124 e o neto continua vivo. Correção: um bloco que tira o `detached: true`, citando "passado o prazo, mata o grupo" ou "(a), (b) e (c)".
   - **`mutacoes.ts:365`, o sinal negativo em `process.kill(-grupo, sinal)`.** Sem o menos, o SIGTERM vai só ao `sh`, e o `sleep` neto fica órfão e vivo. Correção: um bloco com `process.kill(grupo, sinal)`, citando "passado o prazo, mata o grupo".
   - **`mutacoes.ts:402`, o `setTimeout(terminar, prazoMs)`.** É o próprio prazo dentro do supervisor. O bloco "prazo na mutada" muta só quem chama, e não quem mata. Correção: um bloco que tira a linha, citando "passado o prazo, mata o grupo" (sem a linha, o supervisor acaba como `travou`).
   - **`mutacoes.ts:391`, o `estourou = true` dentro de `terminar`.** Sem ele, o `close` resolve com 1, e a mutada morta no prazo vira `vermelho` em vez de `recusada`. O bloco "marca de estouro" muta outra linha, a 388. Correção: um bloco que tira a linha 391, citando "passado o prazo, mata o grupo".
   - **`mutacoes.ts:399`, o `resolver(SAIDA_DO_PRAZO)`.** Trocado por `resolver(1)`, a corrida estourada passa por "caiu" e vira `vermelho`. Correção: um bloco com `resolver(1)`, citando "passado o prazo, mata o grupo".
   - **`mutacoes.ts:227`, o `replaceAll('_', '')` de `numero`.** Sem ele, `120_000` vira `NaN`. Correção: um bloco com `Number(texto)`, citando "o caso: o último argumento do it".
   - **`mutacoes.ts:235`, a leitura de `testTimeout:` da configuração.** Os blocos atuais mutam só o `?? padrão` e os ramos de `unidade` e `e2e`, nunca a leitura em si. Correção: um bloco que troca a linha por `const [declarado] = [] as number[]`, citando "o projeto: unidade fica no padrão".
   - **`mutacoes.ts:469`, a leitura dos argumentos do supervisor.** Trocar `prazo` por `espera`, ou tirar a vaga do `--`, muda o prazo de toda corrida sem nenhum bloco ver. Correção: um bloco que inverte `[espera, prazo]`, citando "a espera até o SIGKILL é a injetada" ou "passado o prazo, mata o grupo".

2. **Corrida contra o arranque do processo, em `mutacoes.test.ts:566` e `:622`.** O `it.each` de SIGINT, SIGTERM e SIGHUP manda o sinal 1,5 s depois do `spawn`, num relógio fixo. Se o Node e o type-stripping de `mutacoes.ts` ainda não registraram o `process.on` nesse instante, o sinal padrão mata o supervisor e o código sai 255 em vez de 124. O neto fica vivo, e o código correto fica vermelho. Isso pode acontecer com o portão rodando a unidade inteira em paralelo e três linhas ao mesmo tempo. É teste que só passa com a máquina folgada. Correção: esperar o `neto.pid` existir e ter conteúdo antes de mandar o sinal. Os handlers são registrados no mesmo tick do `spawn`, então o arquivo do neto prova que eles já existem. Assim o teste para de depender do relógio.

**Recomendações:**
- **Folga do relógio em `mutacoes.test.ts:599`.** O limite de `< 3_500` separa o caso correto, que leva cerca de 1,25 s, do mutante, que leva pelo menos 4,7 s. Hoje o mutante nunca passa por baixo do limite, mas o caso correto fica vermelho com uns 2,2 s de lentidão a mais. Subir `esperaMs` para uns 20 s e o limite para 10 s abre bem a distância, e o custo cai só na corrida mutada.
- **Concorrência da cópia em `mutacoes.ts:421`.** O `copiaDoSupervisor` escreve em `tmpdir`, que é compartilhado por linhas paralelas. O arquivo provisório leva o pid e o `rename` é atômico, então o código está certo. Mas nenhum teste roda dois `rodarCalado` em paralelo, e nenhum bloco tira o `rename` (ficaria escrita direta). Fica registrado para o `/retro`.
- **Neto que sobra depois de uma saída normal.** Quando o filho sai normalmente e deixa um neto em segundo plano, o supervisor resolve no `close` sem varrer o grupo. Esse neto pode continuar segurando o `flock`. Fica fora do RF4, que trata da travada, mas vale anotar.
- **Texto do teste:** "O prazo da caso seguinte" deveria ser "do caso seguinte".

## infra-guardian · 2ª rodada · APROVADO · 2026-10-23 14:44:45 · `tasks/prd-harness/7_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A tarefa só mexe no ferramental do processo (`tools/processo/`) e não toca API, worker, fila de produção nem migration.
Rate limit: ok. A tarefa não toca nada que tenha rate limit.
Fila e prioridade: ok. A tarefa não toca a fila.
Concorrência: protegida. O `terminar` do supervisor agora tem a guarda `if (estourou) return`, e o teste "o prazo e um sinal que chega depois" prova que ele roda uma vez só.
Índice e paginação: ok. A tarefa não cria query.
Degradação de IA: não se aplica.
Migration: não se aplica.
Métrica e alerta: ok. A tarefa não está no caminho quente.
Bloqueantes: nenhum.

A correção exigida na rodada anterior foi feita:
- **O `'estourou'` não conta mais como reconstrução.** O `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/portao-local.ts:184` agora delega para `conferirMutacoesDoDocumento`. A reconstrução foi para `reconstruirDepoisDasMutacoes`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/mutacoes.ts:459-466`, que compara com `corrida === true` e devolve uma mensagem própria quando a corrida passa do teto ("a corrida passou do teto de 10 min").
- **Há teste que prova o portão vermelho.** O caso "a reconstrução que passa do teto deixa o portão vermelho, sem carimbo, dizendo o teto" exige `{ vermelho: ... }`, sem carimbo. O caso "a reconstrução que cai" cobre a falha comum.
- **As mutações declaradas pegam as duas regressões.** O documento traz `if (corrida === true)` trocado por `if (corrida)`, e a mensagem trocada pela genérica. As duas fazem cair o teste do teto.
- **O `portao-local.ts` entrou na lista de arquivos de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tasks/prd-harness/7_task.md`.**
- **Não sobrou ninguém usando o resultado da corrida como booleano.** Fora do teste, o tipo `Rodar` tem três usos (`conferirMutacoes`, `reconstruirDepoisDasMutacoes` e `rodarCalado`), e nenhum lê o resultado em contexto booleano.
- **O supervisor continua importando só módulos `node:`.** É a restrição que a cópia exige, e o comentário novo a deixa escrita.
- **Os testes passam.** Rodei `npx vitest run tools/processo/mutacoes.test.ts`: 63 passaram.

Recomendações:
- O teste do tratador lento afrouxou o limite de 3,5 s para 10 s, com espera de 20 s. Ainda prova que o grupo terminou sem esperar a espera inteira, mas a margem ficou larga. Se o caso ficar instável, vale apertar de novo.
- As quatro recomendações da rodada 1 que ficaram de fora estão no `TODO.md`, para o `/retro` da X7: o Ctrl-C que pula o `finally`, o `testTimeout` lido sem saber de que projeto é, o neto que fica vivo quando o teste sai normalmente e a falta de teste de `rodarCalado` em paralelo. Concordo com o destino.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-23 14:44:53 · `tasks/prd-harness/7_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido. O `conferir` deu "portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)", e as mutações do documento também passaram.

Bloqueantes: nenhum

A correção da rodada 1 foi feita:
- **Comparação com `true`:** a regra está em `reconstruirDepoisDasMutacoes`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/mutacoes.ts:458-466`, com `if (corrida === true) return null`. Com isso, `'estourou'` e `false` caem no mesmo ramo, que deixa o portão vermelho.
- **Mensagem do teto:** quando a reconstrução estoura, a mensagem diz que passou do teto de 10 min.
- **O que o portão chama:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/portao-local.ts:181-190` agora chama `conferirMutacoesDoDocumento`. O comportamento de antes continua igual: primeiro as mutações, depois a reconstrução da web mesmo que alguma mutação tenha reprovado, depois o motivo e o `exit(1)`, tudo com o mesmo texto.
- **Arquivos previstos:** `portao-local.ts` está registrado no `7_task.md`.
- **Mutações novas:**
  - Tirar o `=== true` derruba o teste "a reconstrução que passa do teto", que espera a mensagem exata.
  - Também têm bloco e teste: a mensagem do teto, o ramo sem tela, o `.at(-1)`, o bloco malformado, o documento sem bloco, a mutação reprovada, a reconstrução que cai, a reconstrução mesmo com falha e o `total` do carimbo.
  - Os nomes de teste citados nos blocos existem no arquivo de teste.

O que mais mudou desde a rodada 1 também está certo:
- **`terminar` roda uma vez:** a guarda `if (estourou) return` tem teste com o prazo e um SIGINT chegando juntos, e um bloco próprio.
- **Testes de processo:** esperavam um tempo fixo e agora esperam o `neto.pid` aparecer.
- **Funções repetidas:** as duas cópias iguais de `morreu` e `limpar` viraram uma só.
- **Docstring do supervisor:** agora diz que os containers do `docker compose` ficam fora do grupo de processo.

Recomendações:
- O parágrafo do topo de "Mutações" (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tasks/prd-harness/7_task.md:73`) lista o que os blocos cobrem, mas não cita as cláusulas novas da reconstrução e de `conferirMutacoesDoDocumento`. Vale acrescentar uma linha.
- Depois que as funções repetidas saíram, ficaram duas linhas em branco seguidas no arquivo de teste, logo depois de `pasta` e de `scriptDoTeste`. Tirar uma de cada.
- No teste de reconstrução, o auxiliar `conferir` decide que o fonte está mutado procurando no repositório um trecho exato com `\n` e indentação. Se o `REPOSITORIO` do teste mudar de formatação, esse trecho para de casar, todas as corridas viram "mutadas" e o teste falha. Valeria tirar o trecho de `deRepositorio.antes`.

## test-engineer · 2ª rodada · APROVADO · 2026-10-23 14:45:51 · `tasks/prd-harness/7_task.md`

VEREDITO: APROVADO

Cenários exigidos: (a) a mutada que dorme além do prazo sai no prazo como `recusada`; (b) o neto morre e o pid é conferido; (c) o arquivo mutado volta ao que era; (d) a corrida limpa acima do teto falha sem mutar nada; (e) e (f) o relógio injetado decide o prazo; os pisos de prazo (60 s, 3 vezes a limpa, `testTimeout` do projeto e do caso); depois do prazo, uma segunda corrida pega o `flock`; o grupo de processo morto no prazo; SIGINT, SIGTERM e SIGHUP levam o grupo junto; o prazo e um sinal juntos mandam um SIGTERM só; a reconstrução da web que estoura ou cai deixa o portão vermelho; o documento sem bloco e o bloco malformado.

Cobertos: os 13 cenários da tabela continuam com teste. Desde a rodada 1 entraram estes testes:
- `o prazo e um sinal que chega depois mandam um SIGTERM só`
- `documento sem bloco não tem carimbo nem corrida; bloco malformado é o vermelho`
- `todas vermelhas e sem tela`
- `a tela mutada é reconstruída do fonte de volta`
- `a reconstrução que passa do teto deixa o portão vermelho`
- `a reconstrução que cai deixa o portão vermelho`
- `mutação que reprovou é o vermelho, e a web é reconstruída mesmo assim`
- `reconstruir: sem mutação de tela não roda nada`

O `npx vitest run tools/processo/mutacoes.test.ts` passou: 63 de 63.

As correções da rodada 1 foram feitas:
1. **As oito cláusulas sem bloco agora têm bloco:**
   - `detached: true` (`mutacoes.ts:382`)
   - `process.kill(-grupo)` trocado pelo sinal só ao filho
   - `setTimeout(terminar, prazoMs)` (`:404`)
   - `estourou = true` dentro de `terminar` (`:393`, a única linha com esse texto)
   - `resolver(SAIDA_DO_PRAZO)` trocado por `resolver(1)` (`:401`)
   - o `replaceAll('_', '')` (`:227`)
   - a leitura de `testTimeout:` (`:235`)
   - a ordem `[prazo, espera]` (`:513`)

   Cada bloco cita um teste que cai pelo motivo certo. Um exemplo: com a ordem dos argumentos invertida, o `o SIGTERM chega primeiro` passa a esperar 20 s antes do SIGTERM e estoura o `durouMs < 10_000`. Também ganharam bloco a guarda nova `if (estourou) return` e cada cláusula de `conferirMutacoesDoDocumento` e de `reconstruirDepoisDasMutacoes`: o `=== true`, a mensagem do teto, `comando === null`, `.at(-1)`, os três vermelhos, a reconstrução feita mesmo com mutação reprovada, o `total` e o aviso do começo.
2. **A corrida contra o arranque do processo saiu.** O `sinalDepoisDe` com relógio fixo virou `sinalQuando`, e o sinal só sai quando `pidDoNeto(raiz) !== null` (`mutacoes.test.ts:665`). Os `process.on` são registrados no mesmo tick do `spawn` (`mutacoes.ts:382` a `:406`). Por isso o arquivo do neto prova que os handlers já existem, e o teste não depende mais de quanto o Node leva para subir.

Bloqueantes: nenhum.

Recomendações:
1. `tasks/prd-harness/7_task.md:39-53`: a tabela "Testes que provam a regra" não tem linha para a reconstrução da web que estoura, cai ou roda com mutação reprovada, nem para a guarda de `terminar` que roda uma vez. Os testes existem e são citados pelos blocos, mas o `/validar` confere a tabela.
2. `tools/processo/portao-local.ts`, no ramo `if ('vermelho' in conferencia) { … process.exit(1) }`: essa ligação não tem bloco. Ela só reorganiza saídas que já existiam e também não tinham bloco, e o hook (`avaliarMutacoes`, que bloqueia o portão que não conferiu o documento) cobre o caso de ela sumir. Fica para o `/retro`.
3. `mutacoes.test.ts:633-646`: com a máquina muito carregada, se o laço de 25 ms só vir o marcador depois dos 1,5 s do SIGKILL, a mutação que tira a guarda passaria verde. O código correto nunca fica vermelho por isso. Uma `esperaMs` maior (por exemplo 5 s, com o `limiteMs` ajustado) tira a janela.
4. `mutacoes.test.ts:611` e `:654` ainda medem `durouMs < 5_000` com relógio real, contando a subida do Node. Havia folga de cerca de 4 s e o ponto não foi levantado na rodada 1. Fica registrado.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/mutacoes.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/mutacoes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/portao-local.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tasks/prd-harness/7_task.md
