# Achados das revisões — `tasks/correcoes/2026-09-22-corrida-de-porta-na-observabilidade.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-22 12:24:09 · `tasks/correcoes/2026-09-22-corrida-de-porta-na-observabilidade.md`

VEREDITO: REPROVADO

**Cenários exigidos** (correção de ferramenta de teste de infra: sem dado de escola, sem rota, sem persona — permissão e isolamento não se aplicam aqui, e digo isso de propósito para não virar cobrança na próxima rodada):

1. caminho feliz — recriar devolve contêiner **novo** e são;
2. borda — contêiner anterior parado e ainda segurando a porta publicada (o vermelho de 22/09);
3. borda — contêiner deixado em `created` por uma tentativa que falhou é removido pela volta seguinte;
4. borda — **falha do `up` que não é o bind** estoura na hora, sem gastar as cinco voltas;
5. borda — **porta presa além do orçamento** estoura com mensagem, em vez de girar para sempre;
6. borda — serviço rodando e serviço sem contêiner no projeto (os dois estados reais de quem chama);
7. concorrência — alguém de fora do comando segurando a porta (é a corrida de verdade).

**Cobertos:** 1, 2, 3 e 7 em `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.int.test.ts:261-289`. O caso é honesto: com a porta presa por 2 s, tirar a nova tentativa deixa o `up` morrer em ~300 ms (vermelho), e trocar a recriação por `up`/`start` religa o mesmo contêiner e derruba `expect(depois).not.toBe(antes)` (:287). Rodei o caso aqui: verde em 11 s, atravessando ~2 voltas, com folga de 3. A corrida entre os dois arquivos que chamam o helper não existe: `vitest.config.ts:15` fixa `fileParallelism: false`. O cenário 6 eu conferi na mão contra o daemon (`rm --force --stop` sobre `oidc-falso` **rodando**: remove em 0,6 s e o `up` seguinte sobe contêiner novo e são) — funciona, por isso fica como recomendação e não como bloqueante.

**Bloqueantes:**

- `/home/joaquimdp/Documentos/git/Educa.ia/tools/testes/compose.ts:93` — a condição `tentativa === TENTATIVAS_COM_A_PORTA_OCUPADA || !PORTA_OCUPADA.test(resultado.saida)` é a metade nova da regra e **nenhum teste a exercita**. Apague `!PORTA_OCUPADA.test(resultado.saida)` (nova tentativa para qualquer falha) e a suíte inteira continua verde — logo, pela regra 40, essa parte não tem teste. E o dano é concreto, não teórico: a observabilidade tem `healthcheck` com `retries: 60` e `interval: 2s` (`infra/compose.yml:441-444`), então um `up --wait` de serviço quebrado custa ~2 min; com a nova tentativa alargada, o vermelho que estes dois arquivos existem para dar vira ~10 min e chega com a saída da **última** tentativa, dentro de um portão que já custa 20 min — e o `hookTimeout` de 900_000 em `infra/test/alertas.int.test.ts:81` nem corta. Exigido: um caso que prove que falha do `up` **fora** do bind estoura na primeira tentativa.
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/testes/compose.ts:89,93` — o fim do laço também não tem teste. Tire o `tentativa === TENTATIVAS_COM_A_PORTA_OCUPADA` e o `for (;;)` gira até o `hookTimeout`, sem nenhum teste vermelho. Exigido: um caso que prove que a porta presa além do orçamento estoura depois de N voltas, com a saída da última.
- Correção exigida para os dois, já que é o mesmo ponto: hoje não há costura — `recriarDoZero` chama `composeAssincrono` do próprio módulo, e espião de ESM não intercepta chamada interna. Dê ao helper um executor injetável (padrão `composeAssincrono`) e prove o laço com um executor falso, em teste de unidade: falha com `address already in use` repete; falha com outra saída estoura na tentativa 1; cinco falhas de porta estouram na quinta com a mensagem; e há um `rm` antes de **cada** `up`. Falsear o CLI do Docker aqui é permitido pela regra 40 (mock é para o que está fora). Se preferir não abrir a costura, sirva os dois casos contra um serviço real cuja subida falhe por motivo que não seja a porta — mas não deixe a metade da regra sem prova.

**Recomendações:**

- `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/ensaio-alertas.ts:404` continua com `up --detach --wait --force-recreate --no-deps api-1 api-2`, e `api-1`/`api-2` publicam porta (`infra/compose.yml:197,211`), dentro do mesmo ensaio que o arquivo de alertas dirige. O risco é menor que o consertado (ali o próprio `up` remove o antigo antes de criar, em um comando só) e não houve vermelho medido — por isso não bloqueio —, mas é a mesma classe e o mesmo arquivo de destino do vermelho. Vale registrar para o `/validar`.
- O caso novo só cobre o estado "contêiner parado". Uma segunda asserção barata, sem `stop` antes (serviço rodando, que é o estado real dos dois `beforeAll`) e uma com o serviço ausente do projeto, fechariam o cenário 6 no teste em vez de na conferência manual — ainda mais porque o portão desta correção rodou a suíte de infra com a observabilidade **ausente**, então o caminho do contêiner rodando não passou por nenhuma execução verde registrada.
- `TENTATIVAS_COM_A_PORTA_OCUPADA = 5` só é provado até 2 pelo caso atual (a porta solta na 2ª volta). Não é regra de negócio, mas se o valor tem razão de ser 5, é o teste de esgotamento pedido acima que a registra.
- `recriarDoZero` sobe sem `--no-deps`. Hoje é inócuo (nem `observabilidade` nem `oidc-falso` têm `depends_on`), mas o helper é genérico e o nome promete recriar **um** serviço; uma linha no docstring dizendo que dependência declarada sobe junto evita a surpresa no terceiro uso.

## test-engineer · 2ª rodada · APROVADO · 2026-09-22 12:56:09 · `tasks/correcoes/2026-09-22-corrida-de-porta-na-observabilidade.md`

Auditei o diff desde a 1ª rodada e rodei eu mesmo a matriz de mutação, um mutante por vez, restaurando `tools/testes/compose.ts` ao final (md5 confere com o original).

Verificação independente das três correções exigidas:

| Mutante aplicado em `/home/joaquimdp/Documentos/git/Educa.ia/tools/testes/compose.ts` | Resultado medido |
|---|---|
| tirar `!PORTA_OCUPADA.test(subida.saida)` | vermelho só em "falha do `up` que não é a porta ocupada estoura na primeira tentativa" (1009 ms) |
| tirar `tentativa === TENTATIVAS_COM_A_PORTA_OCUPADA` | vermelho só em "porta ocupada além do orçamento estoura na quinta volta" |
| tirar a checagem de `remocao.codigo` | vermelho só em "remoção que falha estoura sem tentar subir" |
| mover o `rm` para fora do laço | vermelho em "repete enquanto a porta está ocupada..." e na quinta volta |

A tabela do documento da correção corresponde ao comportamento real. O compose falso que recusa comando a mais é o que transforma "laço sem fim" em vermelho determinístico em vez de `hookTimeout` de 180 s — é a escolha certa. O executor injetável é costura, não mock da regra: a regra sob teste (o laço) continua sendo código nosso executado de verdade, e o Docker, que é o que está fora, é o que foi encenado (regra 40). As chamadas reais em `infra/test/alertas.int.test.ts:81` e `infra/test/metricas.int.test.ts:89` passam `recriarDoZero('observabilidade')` sem executor, então o padrão `composeAssincrono` fica provado pelo caminho de integração.

Os quatro casos estão no projeto `unidade` (`include: ['**/*.test.ts']`), e `npm run test` roda `unidade` + `integracao`, então tanto o laço quanto o caso novo de `tools/ci/compose.int.test.ts` entraram no portão carimbado. Sem `.skip`, sem teste comentado, sem `any`.

```
VEREDITO: APROVADO

Cenários exigidos:
  1. caminho feliz — recriação com a porta livre, contêiner novo
  2. borda — porta presa e depois solta: repete e termina verde
  3. borda — falha do `up` que não é o bind: estoura na primeira tentativa
  4. borda — porta presa além do orçamento: estoura na volta N, com a saída da última
  5. borda — `rm` que falha: estoura sem tentar subir
  6. borda — `rm` antes de CADA `up` (o esqueleto em `created` da volta anterior)
  7. estados reais de quem chama — serviço rodando, parado e ausente do projeto
  8. concorrência (regra 80) — disputa real pela porta publicada, com outro processo segurando o bind
  Permissão e isolamento não se aplicam: helper de teste de infra, sem tenant, sem dado de pessoa,
  sem rota. Anotado para não passar por omissão.

Cobertos:
  1, 2, 6 — tools/testes/compose.test.ts:44 (sequência inteira de comandos afirmada)
  3 — tools/testes/compose.test.ts:60
  4 — tools/testes/compose.test.ts:73
  5 — tools/testes/compose.test.ts:88
  7 — tools/ci/compose.int.test.ts:292 (rodando → recriado; ausente → recriado; id diferente e healthy)
  8 — tools/ci/compose.int.test.ts:262 (listener do próprio teste segura a porta por 2 s, contêiner
      parado como os afterAll deixam; asserção de id diferente e de healthy)

Bloqueantes: nenhum

Recomendações:
  - tools/testes/compose.ts:72 — `ESPERA_ENTRE_TENTATIVAS_MS` continua sem prova direta: apagar o
    `setTimeout` deixa os quatro casos de unidade verdes (com relógio falso, a promessa só resolve
    mais cedo). Hoje quem o segura é o caso de integração, e por margem fina: sem espera, cinco `up`
    contra o Docker somam ~1,5 s contra os 2 s de porta presa. Com `vi.useFakeTimers` custa nada
    afirmar que a recriação ainda não resolveu em 999 ms e resolve em 1 001 ms.
  - tools/testes/compose.test.ts:16 — vale um caso com a saída do bind em outra caixa
    ("Address already in use"), que é o que a flag `i` de `PORTA_OCUPADA` existe para cobrir e hoje
    nenhum caso exercita; hoje apagar o `/i` fica verde.
  - TODO.md — o irmão `infra/scripts/ensaio-alertas.ts:404` ficou registrado com a nota de que não há
    vermelho medido e de que o conserto é o mesmo helper. É o registro que eu queria; nada a fazer
    agora.
```

## infra-guardian · 1ª rodada · APROVADO · 2026-09-22 12:59:51 · `tasks/correcoes/2026-09-22-corrida-de-porta-na-observabilidade.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum (ferramenta de teste de infra; os dois consumidores são `infra/test/alertas.int.test.ts` e `infra/test/metricas.int.test.ts`)
Rate limit: não se aplica
Fila e prioridade: não se aplica
Concorrência: protegida — a corrida real (porta publicada presa por outro processo) tem teste determinístico em `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.int.test.ts:262`, e o laço tem os quatro mutantes provados em `/home/joaquimdp/Documentos/git/Educa.ia/tools/testes/compose.test.ts`
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: não se aplica (nenhum código novo de produto no caminho quente; o portão carimbou `infra`, que é onde a observabilidade é exercida)
Bloqueantes: nenhum

Conferi o que importava para mim:

- `recriarDoZero` está nos **dois** arquivos (`alertas.int.test.ts:81`, `metricas.int.test.ts:89`), que era a exigência da rodada anterior — o vermelho não migra de arquivo.
- A nova tentativa é **limitada** a `address already in use` e o laço é limitado a 5 voltas: falha de serviço quebrado estoura na primeira, sem pagar cinco `up --wait` contra um healthcheck de `retries: 60 / interval: 2s` (`infra/compose.yml:441-444`), o que transformaria um portão de 20 min em 30.
- O `rm --force --stop` antes de **cada** `up` limpa o esqueleto em `created` que a tentativa anterior deixa; afirmado pela sequência inteira de comandos em `compose.test.ts:57`.
- Orçamento do caso de integração: porta presa por 2 s, tentativas em ~0, ~1,3, ~2,6 s — folga de três voltas, e `composeAssincrono` usa `spawn`, não `spawnSync`, então o `setTimeout` que solta a porta chega a disparar. Não é flake plantado.
- `oidc-falso` não tem `depends_on` e a integração roda com `fileParallelism: false` (`vitest.config.ts:15`): recriar o serviço no meio da suíte não atropela arquivo vizinho, e o `afterAll` devolve o serviço de pé.
- Nenhum teste novo chama provedor pago; nada toca dado de pessoa, tenant ou log.

Sobre a pergunta direta — **não**, o irmão `infra/scripts/ensaio-alertas.ts:404` não entra nesta correção. Sem vermelho medido, mexer ali agora é aumentar o diff de uma correção fechada e sem teste que force a mão. Fica no `TODO.md`, como está.

Recomendações:

- `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md:74-76` — a justificativa "risco menor — ali o `up` remove o antigo dentro do mesmo comando" está afirmada sem medida, e é ela que vai fazer alguém despriorizar o item. O que protege o caminho corrigido não é só o `rm`: é a **nova tentativa**, e o ensaio não tem nenhuma. Ou mede-se a afirmação, ou tira-se a atenuante e deixa-se só "sem vermelho medido".
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/testes/compose.ts:98-100` — falha do `rm` estoura sem volta, inclusive quando a saída é `removal of container ... is already in progress`, que é exatamente a janela de "alguém ainda está saindo" que o laço existe para cobrir. Repetir o `rm` custa fração de segundo (não paga healthcheck), ao contrário do `up`. Vale uma volta também ali, com o mesmo critério estreito por saída.
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/index.mjs:17` — `recriarDoZero` não está em `CHAMADAS_DE_COMPOSE` da guarda `esperar-servico-do-compose`. Hoje é inócuo porque o helper sempre passa `--wait` por dentro; se um dia alguém tirar esse `--wait`, nenhuma guarda percebe. Uma linha na guarda, ou um comentário no helper dizendo que o `--wait` é contratual, fecha.
- Carrego as duas do `test-engineer` que ficaram abertas e concordo com elas: `ESPERA_ENTRE_TENTATIVAS_MS` (`tools/testes/compose.ts:72`) não tem prova direta, e o `/i` de `PORTA_OCUPADA` (`tools/testes/compose.ts:65`) não é exercitado por nenhum caso.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-22 13:01:50 · `tasks/correcoes/2026-09-22-corrida-de-porta-na-observabilidade.md`

## VEREDITO: REPROVADO

**Escopo:** respeitado — helper + os dois `beforeAll` + testes + registro; nada de tarefa futura, e `infra/scripts/ensaio-alertas.ts` ficou de fora com razão (é outro comando, sem vermelho medido, e alargar seria segunda correção na mesma execução).
**Aderência à Tech Spec:** não se aplica (correção fora de tarefa, sem PRD/Tech Spec).
**Portão local:** carimbo válido — `node tools/processo/portao-local.ts conferir` responde "portão local válido para o código atual (typecheck, lint, test, infra)", início 2026-09-22T15:27:10.706Z.

Sobre o que me foi perguntado, para constar: a costura `executar` **é** o mínimo (parâmetro com padrão real, usado só pelo teste de unidade, exigido pelo `test-engineer`); `/home/joaquimdp/Documentos/git/Educa.ia/tools/testes/compose.ts` **é** o lugar certo (é de onde `infra/test/` e `tools/ci/` já importam `compose`, `composeAssincrono` e `aguardarSaudavel`); e isto **é** correção, não tarefa. O código e os testes estão sãos. O que reprova está todo no registro escrito, e é curto.

### Bloqueantes

**B1. `TODO.md:89` — ponteiro quebrado por este próprio diff.** O item do `--timestamps` diz "o padrão certo já existia em `tools/testes/compose.ts:78`". Antes deste diff, a linha 78 era `const log = compose('logs', '--no-color', '--timestamps', '--tail', '40', servico).saida`. Os 48 linhas de `recriarDoZero` empurraram esse padrão para a **linha 126**, e a 78 agora é prosa do docstring novo (`* up --force-recreate sobe o novo sem esperar...`). Quem pegar aquele item vai copiar o padrão de um lugar que não o tem. Correção exigida: `tools/testes/compose.ts:126` (ou tirar o número e citar `aguardarSaudavel`), no mesmo arquivo que esta correção já edita.

**B2. `TODO.md:76-77` — a razão escrita para "risco menor" contradiz a causa que esta mesma correção documenta.** O item novo diz que o `ensaio-alertas.ts:404` é "a mesma classe … com risco menor — ali o `up` remove o antigo dentro do mesmo comando". Mas a causa em `tasks/correcoes/2026-09-22-corrida-de-porta-na-observabilidade.md:29-33` culpa o `up --force-recreate` justamente por **criar e subir o novo sem esperar o anterior soltar a porta**, e no caso consertado o `up --force-recreate` também removia o antigo dentro do mesmo comando (o contêiner parado continuava existindo — é o que o próprio documento diz em `:31`). Ou seja: "remove dentro do mesmo comando" vale para os dois casos e não distingue nada; se distinguisse, distinguiria para pior, porque em `api-1`/`api-2` o `stop` acontece imediatamente antes do bind, com janela menor ainda. Correção exigida: apagar a comparação de risco e deixar o motivo que é verdadeiro e suficiente — não há vermelho medido ali —, ou trocar por uma diferença que se sustente contra a causa escrita.

**B3. `TODO.md:78-79` e `tasks/correcoes/2026-09-22-corrida-de-porta-na-observabilidade.md:106-108` — "que aceita o executor do ensaio" é falso.** `ExecutorDeCompose` é `(...argumentos: string[]) => Promise<ResultadoComando>` (`tools/testes/compose.ts:68`), e o executor do ensaio é `composeCom: (sobreposicao, ...argumentos) => Promise<ResultadoDeComando>` (`infra/scripts/ensaio-alertas.ts:131`): a sobreposição vem **primeiro**, então não é atribuível — precisa de invólucro `(...args) => composeCom(sobreposicao, ...args)`. É pequeno, mas é exatamente a frase que justifica a costura para além do teste, nos dois documentos. Correção exigida: dizer o invólucro, ou tirar a afirmação e manter a costura justificada só pelo teste do laço, que é o que ela de fato serve hoje.

### Recomendações

- `tools/ci/compose.int.test.ts:255` — `segurarPorta` devolve o `Server` com um `once('error')` que já foi consumido no `listen`; um erro depois disso (conexão que o proxy do contêiner tente abrir na janela) sobe como `unhandled error` e derruba o worker do Vitest em vez de reprovar o caso. Um `servidor.on('error', () => {})` antes do `return` custa uma linha.
- `tools/ci/compose.int.test.ts:283,296,305,311` — `compose(...).saida` concatena `stdout` **e** `stderr` (`tools/testes/compose.ts:22`), e a asserção é `toBe('healthy')`. Qualquer WARN do compose nessas chamadas vira vermelho falso; o mesmo risco já tinha sido registrado num achado anterior sobre `composeOuFalha`. `toContain('healthy')` ou leitura só do `stdout` fecha isso.
- `tools/testes/compose.ts:68` e `infra/scripts/ensaio-alertas.ts:108,129` — `ExecutorDeCompose`/`ResultadoComando` e `ResultadoDeComando`/`compose` são o mesmo par de formas declarado duas vezes no repositório. A duplicação é anterior a esta correção, mas ela acabou de acrescentar o terceiro nome; se o item do `ensaio-alertas` for feito um dia, é a hora de o ensaio importar o tipo de `tools/testes/compose.ts` em vez de redeclarar.
- `tools/guardas/regras-teste.mjs:21` — `CHAMADAS_DE_COMPOSE` lista as cinco formas de subir serviço em teste, com o comentário "deixar uma de fora é o furo pelo qual a classe volta". Agora existe uma sexta, `recriarDoZero`, que a guarda não conhece. Hoje é inócuo (ela sempre passa `--wait`), e incluí-la geraria falso positivo — mas uma linha no docstring da guarda dizendo *por que* ela está de fora evita que o próximo helper entre sem `--wait` e sem ninguém notar.

## test-engineer · 3ª rodada · APROVADO · 2026-09-22 13:34:53 · `tasks/correcoes/2026-09-22-corrida-de-porta-na-observabilidade.md`

Auditei o diff desde a minha 2ª rodada (só `tools/ci/compose.int.test.ts`), e confirmei no ambiente real a semântica das asserções novas.

**O que verifiquei na prática**

- `/home/joaquimdp/Documentos/git/Educa.ia/tools/testes/compose.ts` não mudou: `recriarDoZero` está idêntico ao que a matriz de mutação cobre.
- Os quatro casos de `/home/joaquimdp/Documentos/git/Educa.ia/tools/testes/compose.test.ts` estão intactos e verdes (4/4), e a suíte de unidade inteira passa (1129 casos). A matriz que exigi na 1ª rodada continua de pé.
- `infra/test/alertas.int.test.ts` e `infra/test/metricas.int.test.ts` continuam com a troca de uma linha só, nos dois arquivos (o `infra-guardian` exigia os dois).
- Contra o Docker do projeto `educa-teste`, medi a saída que os helpers leem: `ps --format '{{.Health}}' oidc-falso` devolve exatamente `healthy\n` em stdout, stderr vazio; serviço ausente devolve stdout vazio com código 0. Ou seja `saude()` vira `[]` quando o contêiner não existe e `['unhealthy']`/`['starting']` nos outros estados — todos vermelhos em `toContain('healthy')`, que em array é igualdade estrita. O helper **não afrouxou** a asserção; `toContain` em string é que teria afrouxado, e não foi o que fizeram.
- `id()` devolve `''` para serviço ausente (medido), então `expect(id()).toBe('')` depois do `rm` continua sendo asserção de verdade.

**Os dois casos de integração continuam provando o que provavam**

- Caso da porta presa: `stop` (contêiner em `created`/`exited`, que é o estado de onde a corrida nasce) → porta segurada por 2 s → `recriarDoZero`. Trocar por `up --force-recreate` estoura no bind; trocar por `up`/`start` simples religa o mesmo contêiner e cai em `expect(depois).not.toBe(antes)`; tirar a nova tentativa estoura dentro de `recriarDoZero`. As três mutações continuam vermelhas.
- Caso rodando/ausente: `expect(recriado).not.toBe(rodando)` morre se o `rm --force --stop` sair do helper, e o trecho do serviço ausente prova que o `rm` no vazio não estoura.
- Nenhuma das asserções novas cria caminho de falso verde: um `ps` que falhasse entraria como texto de stderr, e toda ramificação termina em `saude()).toContain('healthy')`, que ficaria vermelho.

**Sobre o `servidor.on('error', () => {})`** (`tools/ci/compose.int.test.ts:277`): não esconde regra nenhuma. Depois do `listen` bem-sucedido, o servidor não emite mais `EADDRINUSE`, e erro de socket não desfaz o bind — o ouvinte só evita que o worker do Vitest morra em vez de reprovar o caso. O `finally` com `soltar()` idempotente continua garantindo que a porta é devolvida mesmo com `recriarDoZero` estourando.

```
VEREDITO: APROVADO
Cenários exigidos (corrida da regra 80, item 7): porta publicada presa por quem está saindo · serviço rodando · serviço parado · serviço ausente do projeto · falha do `up` que não é bind estoura na primeira volta · orçamento de voltas acaba · `rm` que falha não tenta subir · contêiner resultante é outro, não o religado
Cobertos: todos. Os quatro últimos por mutação em tools/testes/compose.test.ts:44,60,73,88; os quatro primeiros contra o Docker em tools/ci/compose.int.test.ts:285,315
Bloqueantes: nenhum
Recomendações:
- tools/ci/compose.int.test.ts:255 — `id()` ficou sem a defesa que `saude()` ganhou: como `saida` junta stderr, um WARN do compose entraria no id e deixaria `expect(id()).toBe('')` (linha 327) vermelho por motivo que não é a regra. Medi que hoje o stderr vem vazio com os dois `--env-file`, então é defesa futura, e no sentido seguro (falso vermelho, não falso verde). Filtrar linha que não tem cara de id, ou usar `composeOuFalha`, fecharia.
- tools/ci/compose.int.test.ts:240 — o `afterAll` é o único `up` cru do bloco novo, e roda logo depois de um caso que parou ou removeu o contêiner: é exatamente o estado do qual a corrida nasce. Só dispara quando um caso já falhou, mas `recriarDoZero(SERVICO)` ali daria a mesma restauração com a nova tentativa já embutida.
- tools/ci/compose.int.test.ts:285 — o caso supõe que o `rm --force --stop` termina dentro dos 2 s em que a porta está presa. Se numa máquina carregada o `rm` passar disso, o primeiro `up` já encontra a porta livre e a metade "não desiste" passa sem ser exercida (verde silencioso, não vermelho). A metade está provada deterministicamente no teste de unidade, então não bloqueia; passar um executor que conte as saídas com `address already in use` e afirmar `>= 1` tornaria a prova explícita também contra o Docker.
- tools/ci/compose.int.test.ts:258,312 — `toContain('healthy')` aceita um array com mais de uma linha de saúde. Com uma réplica só do `oidc-falso` é inofensivo; `toEqual(['healthy'])` sobre as linhas que não são WARN também pegaria sobra de contêiner em `created`.
```

## revisor-geral · 2ª rodada · APROVADO · 2026-09-22 13:37:58 · `tasks/correcoes/2026-09-22-corrida-de-porta-na-observabilidade.md`

Auditei o diff desde a minha 1ª rodada, li os arquivos alterados por inteiro e conferi cada afirmação nova contra a fonte.

**Verificação das três correções exigidas**

- **B1** — `TODO.md:92-94` agora diz "o padrão certo já existia no despejo de `aguardarSaudavel` (`tools/testes/compose.ts`)", sem número de linha. Confirmei que `aguardarSaudavel` é de fato onde o `--timestamps` está (`/home/joaquimdp/Documentos/git/Educa.ia/tools/testes/compose.ts:126`), e o ponteiro agora é por âncora, então não caduca no próximo diff do arquivo. Fechado.
- **B2** — a comparação de risco saiu. Ficou "não há vermelho medido" mais "Nenhuma atenuante de desenho o distingue", que é o que se sustenta contra a causa escrita no documento. Confirmei os três ponteiros do item: `infra/scripts/ensaio-alertas.ts:404` é `opcoes.composeCom(sobreposicao, 'up', '--detach', '--wait', '--force-recreate', '--no-deps', ...opcoes.apis)`; `apis` é `['api-1', 'api-2']` (`:628`); e `infra/compose.yml:197` e `:211` são as portas publicadas das duas. Fechado.
- **B3** — os dois documentos agora dizem que o executor do ensaio não cabe sem invólucro. Confirmei a assinatura em `infra/scripts/ensaio-alertas.ts:131` (`composeCom: (sobreposicao, ...argumentos)`), que o número de linha citado no documento da correção está certo, e que o invólucro escrito no `TODO.md` (`(...argumentos) => composeCom(sobreposicao, ...argumentos)`) tem a direção certa. No documento da correção (`:105-108`) a costura passou a ser justificada só pelo teste do laço. Fechado.

**O que audite de novo no que mudou**

O ouvinte permanente em `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.int.test.ts:277` está no lugar certo — depois do `listen` bem-sucedido, antes do `return` — e não encobre a regra: o `EADDRINUSE` do laço continua chegando pelo `once` de `:270`, e o caminho de erro fora de `EADDRINUSE` continua estourando em `:280`.

Os helpers `linhas`/`id`/`saude` (`:248-258`) corrigem o problema que eu apontei: `toContain('healthy')` sobre um array é igualdade estrita por elemento, então `['unhealthy']` e `['starting']` ficam vermelhos, e serviço ausente vira `[]`, também vermelho. Era exatamente o afrouxamento que eu queria evitar, e não aconteceu.

Portão local: `conferir` responde "portão local válido para o código atual (typecheck, lint, test, infra)", carimbo de 2026-09-22T16:03:54.229Z com as quatro suítes.

```
VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: não se aplica (correção fora de tarefa, sem PRD/Tech Spec)
Portão local: carimbo válido — "portão local válido para o código atual (typecheck, lint, test, infra)"
Bloqueantes: nenhum
Recomendações:
- tools/ci/compose.int.test.ts:255 — `id()` continua lendo `saida`, que junta stderr. Hoje o stderr vem vazio (o test-engineer mediu), e a falha seria falso vermelho, não falso verde. Mesma recomendação dele; registrada, não precisa de ação agora.
- tools/ci/compose.int.test.ts:240 — o `afterAll` é o único `up` cru do bloco e roda logo depois de um caso que parou ou removeu o contêiner, que é o estado de onde a corrida nasce. `recriarDoZero(SERVICO)` ali daria a mesma restauração já com a nova tentativa.
- tools/testes/compose.ts:65,72 — o `/i` de `PORTA_OCUPADA` e o `ESPERA_ENTRE_TENTATIVAS_MS` seguem sem caso próprio. Já estão no registro de achados; anoto só para não sumirem no `/validar`.
- As duas recomendações não aplicadas (duplicação de tipos com `ensaio-alertas.ts` e a linha no docstring da guarda) têm motivo que aceito, e estão no registro. A da guarda só vale quando alguém tocar `tools/guardas/` por outro motivo.
```
