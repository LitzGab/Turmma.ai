# Achados das revisões — `tasks/correcoes/2026-10-03-e2e-em-fatias.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-03 23:21:36 · `tasks/correcoes/2026-10-03-e2e-em-fatias.md`

VEREDITO: REPROVADO

O que levanta o REPROVADO é um bloqueante só: dá para tirar o aviso de prazo do `e2e.ts` com todos os testes continuando verdes. O resto da correção prova o que diz.

Cenários exigidos:
1. A guarda do teto reprova a configuração antiga (job único, 394 casos, teto 45) com as constantes medidas.
2. A guarda reprova:
   - matriz com buraco ou repetição;
   - `/n` do passo diferente do tamanho da matriz;
   - artefato sem a fatia no nome;
   - `fail-fast` ligado ou ausente;
   - nome do job sem a fatia;
   - qualquer expressão `${{ }}` que não seja `matrix.fatia`.
3. As fatias juntas são a suíte inteira.
4. O aviso de prazo está ligado à etapa de testes do `e2e.ts` de verdade: na esteira como `::warning`, na máquina como linha no log.
5. `--shard` malformado reprova antes de subir qualquer coisa.
6. `aoTerminar` é chamado com o código e a duração, e não é chamado na etapa que não rodou.
7. Nenhum spec depende de estado deixado por outro.

Cobertos:
- **1:** sem matriz, `fatiasDoE2e()` volta `[1]` e a conta dá 50 > 27. Também ficam vermelhos o teste "o e2e roda em fatias…" e o dos comandos. As constantes estão presas por `minutosEstimadosDoE2e(394) === 50` e por `limiarDosTestesEmMinutos(45) === 23`. Trocar para 6 s por caso ou para 100% do teto quebra um dos dois.
- **2:**
  - Buraco ou repetição: o `toEqual` com `1..n` em `esteira.test.ts:370`.
  - `/n`: o comando esperado é montado com `fatiasDoE2e().length` (`:399-400`).
  - Artefato: a igualdade exata com `traco-do-e2e-${{ matrix.fatia }}` (`:154`).
  - `fail-fast`: `toBe(false)`, que pega também a ausência, já que o padrão do GitHub é `true`.
  - Nome: o `toContain` em `:410`.
  - Expressões: o regex mais a contagem de `${{` pegam até `${{ format('{0}', secrets.X) }}`.
- **3:** a soma das fatias é igual ao total.
- **5:** `scripts.test.ts` com `--shard=5/4` sai com código diferente de zero e com `chamadas` vazio, e `prazo-do-e2e.test.ts` cobre os seis formatos inválidos, incluindo `${{ matrix.fatia }}` sem expandir.
- **6:** `executar.test.ts`, com a duração de pelo menos 300 ms.
- **4 em parte:** a função `etapaDosTestesDoE2e` está bem testada isolada, com o limiar, o formato na esteira e na máquina, e o aviso também quando a etapa fica vermelha.

Rodei as quatro suítes (`prazo-do-e2e`, `esteira`, `executar`, `scripts`): 38 de 38 verdes.

**Estado entre specs (cenário 7).** O `playwright.config.ts` tem `fullyParallel: true`. Não há `globalSetup`, `describe.serial` nem projeto com `dependencies`. Os arrays no topo dos specs, como `criados`, `operadores` e `contextos`, guardam só o que cada trabalhador limpa no fim, e isso já é independente hoje. A evidência proposta basta, desde que entre no documento como prometido: cada fatia verde sozinha, com compose limpo, na máquina e na esteira. O risco que sobra é um caso que só passa com o banco já povoado por outros, como listagem ou paginação no painel da operação. A fatia com banco vazio é justamente o que o expõe, e o runbook já registra isso como defeito.

Bloqueantes:
1. **O aviso de prazo pode ser removido do `e2e.ts` sem nenhum teste falhar.** Fica em `tools/ci/e2e.ts:24`, e o ponto cego do teste está em `tools/ci/scripts.test.ts:170-182`.
   - **O que está errado:** se `etapaDosTestesDoE2e(fatia, tetoDoE2e(), naEsteira)` for trocada por `{ nome: 'testes e2e', comando: 'npx', argumentos: ['playwright', 'test', ...(fatia ? [`--shard=${fatia}`] : [])] }`, sem `aoTerminar`, tudo continua verde. O teste de `scripts.test.ts` só confere a linha `npx playwright test --shard=2/4` no registro do `npx` falso, que termina na hora, e o limiar é de 23 min. Passar `false` no lugar de `naEsteira` também não quebra nada. Assim, a regra que a correção introduz ("anotação 'e2e perto do teto' na esteira, verde ou vermelha", que está no runbook) não tem teste que a prove. É exatamente o furo da correção anterior, em que o aviso recomendado não chegou a existir.
   - **Correção exigida:** um teste que rode o `e2e.ts` de verdade, ou a lista de etapas que ele monta, e fique vermelho sem o aviso. Dois caminhos servem:
     - (a) Mover a montagem das etapas para uma função exportada (por exemplo `etapasDoE2e(argv, teto, naEsteira)`) e afirmar que a etapa do Playwright tem `aoTerminar`, e que chamá-la com uma duração acima do limiar escreve `::warning title=e2e perto do teto::` quando `naEsteira` é verdadeiro.
     - (b) No `scripts.test.ts`, fazer o `npx` falso demorar e baixar o teto por um caminho de teste, por exemplo um workflow alternativo lido por `tetoDoE2e`. Depois afirmar que o stdout do `e2e.ts` com `CI=true` contém `::warning title=e2e perto do teto::`.

     Os dois precisam ficar vermelhos com a mutação descrita acima.

Recomendações:
- A soma "fatias = total" em `esteira.test.ts:460` é quase tautológica, porque o próprio Playwright reparte sem perder caso. O que pega a fatia esquecida de fato é a guarda do `/n` e a do `1..n`. Vale um comentário dizendo isso, para ninguém achar que a soma protege contra `/n` errado.
- A matriz pode ganhar `include:` ou `exclude:` sem a guarda notar, porque ela lê só `matrix.fatia`. Uma linha `expect(Object.keys(matrix)).toEqual(['fatia'])` fecha isso.
- `tetoDoE2e()` e o teste leem o mesmo YAML, então `expect(teto).toBe(tetoDoE2e())` (`esteira.test.ts:441`) não prova nada além de coerência. Não chega a ser um problema, só não conte com ele como guarda.
- Na medição de cada fatia, registre também quantos casos cada uma rodou e a duração da etapa de testes, para conferir os 98 a 99 casos e os ~16 min da tabela contra o real. E deixe anotado no documento que a anotação `::warning` não sai quando o job é cancelado pelo teto, porque o processo morre antes do `aoTerminar`. Ela é sinal antecipado, não diagnóstico do cancelamento.

Arquivos:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-03-e2e-em-fatias.md
- /home/joaquimdp/Documentos/git/Educa.ia/tools/ci/e2e.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tools/ci/prazo-do-e2e.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tools/ci/prazo-do-e2e.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tools/ci/scripts.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tools/ci/executar.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml

## test-engineer · 2ª rodada · APROVADO · 2026-10-03 23:23:47 · `tasks/correcoes/2026-10-03-e2e-em-fatias.md`

VEREDITO: APROVADO

O bloqueante da 1ª rodada foi corrigido, e as três recomendações também. Rodei as dez suítes de `tools/ci/`: 99 de 99 verdes.

Cenários exigidos: os mesmos da 1ª rodada. Nesta rodada conferi só o que mudou: o aviso de prazo agora ligado à etapa de testes que o `ci:e2e` realmente roda, a matriz com só a chave `fatia`, o comentário sobre a soma e a nota sobre o job cancelado.

Cobertos:
- **O aviso agora tem teste que fica vermelho sem ele.** O `e2e.ts` não monta mais as etapas: ele só chama `etapasDoE2e(process.argv.slice(2), tetoDoE2e(), naEsteira)`, que está em `tools/ci/prazo-do-e2e.ts:104-124`. O teste novo (`tools/ci/prazo-do-e2e.test.ts:54-71`) confere três coisas:
  - só uma etapa roda `playwright test`, com `--shard=3/4`, e é a última;
  - depois de 30 min, só ela avisa, no formato `::warning title=e2e perto do teto::`;
  - na máquina, o aviso sai como linha comum, sem a sintaxe de anotação.

  Tirar o `aoTerminar` da etapa de testes, ou trocar o `naEsteira` dentro da lista, deixa esse teste vermelho.
- **O `e2e.ts` de verdade continua coberto.** O `scripts.test.ts` exige `npx playwright test --shard=2/4`, e essa fatia só chega ao Playwright pela lista. Um `e2e.ts` que deixasse de usar `etapasDoE2e` teria de reescrever a leitura da fatia à mão para passar. Isso é reescrever a regra, não apagá-la.
- **Recomendações:**
  - `Object.keys(matriz)` agora é conferido igual a `['fatia']`;
  - o comentário em `esteira.test.ts` diz que a soma das fatias é quase tautológica;
  - o documento registra, na linha 116, que a anotação não sai quando o job é cancelado pelo teto.

Bloqueantes: nenhum.

Recomendações:
- Ainda dá para trocar `naEsteira` por `false` no próprio `tools/ci/e2e.ts` sem nenhum teste falhar. O aviso continuaria saindo, mas como linha no log e não como anotação no resumo da execução. O `scripts.test.ts` já roda com `CI=true`; basta afirmar ali a chamada `npx playwright install --with-deps chromium`, que depende do mesmo `naEsteira`, para prender essa ligação.
- Quando a medição de cada fatia entrar no documento, registre os casos e a duração da etapa de testes de cada uma. É o que confirma os 98 a 99 casos e os ~16 min estimados, e é a evidência de que nenhum spec depende de outro ter rodado antes. Continua valendo o que disse na 1ª rodada: com isso, a evidência basta.

Arquivos:
- /home/joaquimdp/Documentos/git/Educa.ia/tools/ci/e2e.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tools/ci/prazo-do-e2e.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tools/ci/prazo-do-e2e.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tools/ci/scripts.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-03-e2e-em-fatias.md

## infra-guardian · 1ª rodada · APROVADO · 2026-10-03 23:25:05 · `tasks/correcoes/2026-10-03-e2e-em-fatias.md`

VEREDITO: APROVADO
Caminho quente tocado: deploy (só a esteira de CI; nada de login, tutor, sala, prova, fila ou IA em produção)
Rate limit: ok (não muda)
Fila e prioridade: ok (não muda)
Concorrência: protegida (não se aplica ao runtime; as fatias não compartilham estado)
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum

**Os cinco pontos que você pediu para olhar:**
- **Injeção.** A matriz é a lista fixa `[1, 2, 3, 4]` do próprio YAML, sem contexto de fora. A guarda em `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts` exige que toda expressão `${{…}}` seja exatamente `${{ matrix.fatia }}`. Ela também confere que o número de `${{` abertos é igual ao de expressões aceitas, então uma expressão com `}` dentro não passa. A matriz tem que ser só `fatia`, sem `include` nem `exclude`. Em `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/prazo-do-e2e.ts:65-75`, `--shard` malformado ou fora do total para o job antes de subir o compose.
- **Passo 7 da `/executar-task`.** Continua valendo. O passo lê a `conclusion` da execução inteira (`.claude/skills/executar-task/SKILL.md:236-249`), e uma fatia `failure` ou `cancelled` deixa a execução não `success`. Também conferi as regras de proteção do `main`, da `release` e da `develop` pela API do GitHub: nenhuma branch exige o check com o nome antigo do job (as três respondem 404 e a lista de rulesets vem vazia). Renomear o job não trava merge.
- **Folga.** Pelo `--list` de agora, as fatias têm 99, 99, 98 e 98 casos. Pela conta da guarda, a pior dá 16 min, para um limite de 27 (60% de 45). Rodei `esteira.test.ts`, `prazo-do-e2e.test.ts` e `executar.test.ts`: 24 de 24 passaram. O aviso sai quando a etapa de testes passa de 23 min.
- **Dependência entre specs.** Não achei `globalSetup`, `storageState`, `beforeAll` com estado nem `describe.serial`. O único `describe.configure` é `retries: 2` em `e2e/guardas.spec.ts:55`. Com `fullyParallel: true` a ordem já não era garantida antes da matriz, então repartir não cria dependência nova.
- **Custo de 4 composes.** São uns 3 jobs de runner a mais por push, cada um com uns 4 min fixos. Num repositório público com runner padrão isso não pesa. Não é bloqueante.

Recomendações:
1. Antes do `/validar`, preencher no documento da correção a `<medição local>` e a linha "Esteira desta correção", com a duração de cada fatia. A evidência de que cada fatia passa sozinha é exatamente esse registro.
2. A guarda conta casos, não peso. O Playwright reparte em ordem, então specs pesados vizinhos, como `estrutura.spec.ts` a ~13,9 s por caso, podem cair juntos numa fatia. A anotação `::warning` cobre esse caso. Ao fechar a esteira desta correção, vale comparar a duração real da fatia mais lenta com os 16 min estimados e registrar a diferença.
3. Pensar num grupo de `concurrency` com `cancel-in-progress` só para `develop`, para não deixar 4 composes rodando sobre um commit que já foi substituído. Isso precisa de uma expressão (`github.ref`) que a guarda hoje recusa, então é decisão à parte, para o `/retro`.
4. O `/4` aparece em dois lugares, no `name` e no passo. A guarda confere os dois contra o tamanho da matriz, mas o runbook poderia dizer explicitamente que acrescentar fatia exige trocar o total nos dois.

## test-engineer · 3ª rodada · APROVADO · 2026-10-03 23:33:41 · `tasks/correcoes/2026-10-03-e2e-em-fatias.md`

VEREDITO: APROVADO

As três mudanças posteriores à minha aprovação estão certas, e nenhuma delas cria um bloqueante. Rodei o `scripts.test.ts`: 15 de 15 verdes.

Cenários exigidos: os mesmos das rodadas anteriores. Nesta rodada conferi só o que mudou.

Cobertos:
1. **`naEsteira` agora está preso no `e2e.ts` de verdade.** O teste em `tools/ci/scripts.test.ts:175` passou a exigir também `npx playwright install --with-deps chromium`. O `rodarScript` roda com `CI=true`, e o `--with-deps` só aparece com `naEsteira` verdadeiro. Se alguém passar `false` no lugar de `naEsteira` no `e2e.ts`, esse teste agora fica vermelho. Era o resíduo da 2ª rodada.
2. **A frase nova do `docs/runbook.md` está correta.** Ela diz que o `/4` aparece no `name` do job e no passo `npm run ci:e2e`, e que a guarda confere os dois contra o tamanho da matriz. Isso bate com `esteira.test.ts`, que confere o passo pelo comando esperado e o nome pelo `toContain` com `${{ matrix.fatia }}/<n>`.
3. **A medição local basta como evidência.**
   - As quatro fatias rodaram com compose limpo, cada uma com 99, 99, 98 e 98 casos. Somam os 394, e todas ficaram verdes com o banco vazio.
   - Isso responde ao risco de um spec depender de estado deixado por outro na divisão de hoje.
   - Os 3,0 a 3,5 min de teste na máquina não se comparam com a estimativa do runner, porque a máquina roda com mais trabalhadores. A conta de 60% do teto continua apoiada nos tempos medidos na esteira, e não nesta medição.

Bloqueantes: nenhum.

Recomendações:
- A medição prova a independência para a partição de agora. Quando um spec novo entrar, ou o número de fatias mudar, os casos trocam de fatia. O que segura isso daqui em diante é a própria esteira: cada fatia já começa com o banco vazio. Vale uma linha no documento dizendo isso, para a frase "nenhum caso depende de estado deixado por outro" não ser lida como garantia permanente.
- O campo "Esteira desta correção" ainda está em branco. Preencha com a execução, a conclusão e a duração de cada fatia antes de fechar. É o dado que confirma no runner a estimativa de ~16 min na pior fatia.

Arquivos:
- /home/joaquimdp/Documentos/git/Educa.ia/tools/ci/scripts.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-03-e2e-em-fatias.md

## infra-guardian · 2ª rodada · APROVADO · 2026-10-03 23:34:12 · `tasks/correcoes/2026-10-03-e2e-em-fatias.md`

VEREDITO: APROVADO
Caminho quente tocado: deploy (só a esteira de CI)
Rate limit: ok (não muda)
Fila e prioridade: ok (não muda)
Concorrência: protegida (não se aplica ao runtime)
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum

**As três mudanças desta rodada:**
1. **Runbook.** `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md:655-657` agora diz que o `/4` aparece em dois lugares, no `name` do job e no passo `npm run ci:e2e`. Diz também que a guarda confere os dois contra o tamanho da matriz. A recomendação 4 está feita.
2. **Teste do ci:e2e.** `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/scripts.test.ts` agora exige `npx playwright install --with-deps chromium` quando o ci:e2e roda com fatia. Isso prova que `CI=true` chega às etapas. Rodei `scripts.test.ts` e `esteira.test.ts`: 26 de 26 passaram.
3. **Medição local.** O documento registra 99, 99, 98 e 98 casos, somando 394. As quatro fatias passaram cada uma com o banco vazio, com 3,0 a 3,5 min só de testes. Isso confirma, na partição de hoje, que nenhum caso depende de estado deixado por outro spec.

Recomendações:
1. A linha "Esteira desta correção" do documento continua vazia. Ela precisa ser preenchida depois do commit, com a execução, a conclusão e a duração de cada fatia no runner, antes do `/validar`. A comparação com os 16 min estimados para a pior fatia também entra aí.
2. A recomendação 3 da rodada anterior (`concurrency` com `cancel-in-progress`) continua pendente e fica para o `/retro`, como combinado.
