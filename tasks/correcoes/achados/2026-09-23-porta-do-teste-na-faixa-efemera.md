# Achados das revisões — `tasks/correcoes/2026-09-23-porta-do-teste-na-faixa-efemera.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-23 15:01:24 · `tasks/correcoes/2026-09-23-porta-do-teste-na-faixa-efemera.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
1. Toda porta publicada do compose de teste fica abaixo de 32768.
2. Toda porta publicada do compose de carga fica abaixo de 32768.
3. Uma porta nova que chega por qualquer caminho, inclusive uma que o `teste.env` ou o `carga.env` esqueceu de sobrescrever, é pega.
4. O `LOGIN_EXTERNO_RETORNO_URL` acompanha a porta nova da web.
5. Nenhum valor que não seja número passa calado.
6. Evidência do mecanismo da falha, que não vira teste automático.

**Cobertos:**
- **1 e 2:** o teste lê as duas chaves `*_PORTA_HOST` dos dois arquivos e confere cada uma contra 32768. Como o arquivo precisa ter ao menos uma porta, o teste não passa com lista vazia. Trocar só uma porta de volta para a faixa (por exemplo 53112) deixa o teste vermelho, como o documento registra.
- **3, em parte:** uma porta nova escrita no `teste.env` ou no `carga.env` com valor alto é pega.
- **4:** o teste que já existia, "o retorno do login ... aponta para a web do próprio ambiente" (`tools/ci/ambiente.test.ts:155-165`), exige que a porta da URL seja igual a `WEB_PORTA_HOST`. Ele pegaria a URL esquecida em 58090.
- **5:** `Number` de um valor que não é número dá `NaN`, e o `toBeLessThan` falha.
- **Resto do repositório:** nenhuma porta antiga sobrou. A única ocorrência é o texto de erro fixo em `tools/testes/compose.test.ts:13`, que é esperado.
- **6:** a reprodução é evidência suficiente para o que não vira teste automático. Ela rodou contra o compose real e trocou uma variável por vez: um socket sem `SO_REUSEADDR` na 53112 faz o `start` falhar com a mesma mensagem da esteira, e fechado o socket o serviço sobe. Ela também explica por que o socket do Node não reproduz a falha (o libuv liga o `SO_REUSEADDR`). O motivo para não automatizar é válido: o teste teria de prender uma porta do host, e é justamente isso que a correção tira de alcance.
- Não há `.skip`, mock nem asserção que passe sempre.

**Bloqueantes:**
- **`tools/ci/ambiente.test.ts:146-147`: o cenário da porta nova acrescentada depois não é provado.**
  - **O que está errado:** o teste lê só o arquivo cru (`parseEnv(lerArquivo(arquivo))`). O ambiente que o compose de fato sobe é outro: é o `.env.example` com o `teste.env` (ou o `carga.env`) por cima (`ARQUIVOS_AMBIENTE_TESTE` e `ARQUIVOS_AMBIENTE_CARGA` em `tools/ci/compose.ts:12,21`). Todas as portas do `.env.example` estão dentro da faixa efêmera, de 53000 a 59090.
  - **Como a falha volta:** alguém acrescenta `FOO_PORTA_HOST=53400` ao `compose.yml` e ao `.env.example` e esquece o `teste.env` e o `carga.env`. Os ambientes de teste e de carga herdam a 53400 calados, dentro da faixa. O teste novo continua verde e a falha da run 35884794643 volta.
  - **Nenhum outro teste segura isso:** o teste em `:130-139` só confere as chaves que o `teste.env` já tem, não as que faltam. E para o `carga.env` não existe teste equivalente.
  - **Correção exigida:** conferir o ambiente que resulta da combinação, e não o arquivo cru. Para o teste, `lerAmbienteDeTeste()`. Para a carga, `Object.assign({}, ...ARQUIVOS_AMBIENTE_CARGA.map(lerArquivoAmbiente))`, ou uma função `lerAmbienteDeCarga` equivalente. A lista de portas deve sair das variáveis usadas em `ports:` do `infra/compose.yml` (e do `infra/compose.carga.yml`, se um dia publicar porta), e não de `endsWith('_PORTA_HOST')` sobre o arquivo de sobreposição. Assim, uma porta que alguém esqueceu de sobrescrever falha com o nome dela na mensagem.

**Recomendações:**
- O documento da correção pode dizer por que o limite ficou em 23010–29120 (abaixo da faixa efêmera, acima de 1024 e longe das portas bem conhecidas) e como escolher a próxima porta, para quem acrescentar serviço não voltar para 5xxxx por analogia com o `.env.example`.
- O comentário do teste pode registrar que ele confere o ambiente combinado, depois de feito o bloqueante, e não só a sobreposição.
- No `/retro`, vale reabrir a correção `2026-09-22-corrida-de-porta-na-observabilidade`: pela mesma causa, o 59100 dela pode ter sido tratado como corrida quando era a faixa efêmera.

Arquivos auditados: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/ambiente.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/teste.env`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/carga.env`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-23-porta-do-teste-na-faixa-efemera.md`. Também foram lidos, sem alteração nesta correção: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.ts` e `/home/joaquimdp/Documentos/git/Educa.ia/.env.example`.

## test-engineer · 2ª rodada · APROVADO · 2026-09-23 15:02:50 · `tasks/correcoes/2026-09-23-porta-do-teste-na-faixa-efemera.md`

VEREDITO: APROVADO

Cenários exigidos:
1. Toda porta publicada do compose de teste fica abaixo de 32768.
2. O mesmo vale para o compose de carga.
3. Uma porta que a sobreposição (`teste.env` ou `carga.env`) esqueceu de redefinir é pega, com o nome dela na mensagem. Era o bloqueante da 1ª rodada.
4. O `LOGIN_EXTERNO_RETORNO_URL` acompanha a porta nova da web.
5. Um valor que não é número não passa calado.
6. Há evidência do mecanismo da falha, que não vira teste automático.

Cobertos:
- **Correção exigida, feita.** O teste está em `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/ambiente.test.ts:141-164`.
  - As variáveis saem do `ports:` de `infra/compose.yml` e de `infra/compose.carga.yml`. Conferi que as 13 variáveis do `ports:` do `compose.yml` batem com o formato `${NOME:?...}` que a expressão regular procura.
  - Cada porta é conferida no ambiente combinado, `lerAmbienteDeTeste()` e `lerAmbienteDeCarga()`. As duas funções montam o `.env.example` com a sobreposição por cima (`tools/ci/compose.ts:95,103-105`).
  - Uma porta que só existe no `.env.example` herda um valor de 5xxxx e falha com a mensagem `nome: VARIAVEL`. Se a variável faltar nos dois arquivos, o `valorObrigatorio` lança erro.
  - As duas mutações registradas no documento mostram isso, cada uma com o valor herdado do desenvolvimento: sem `REALTIME_2_PORTA_HOST` no teste deu 53102, sem `WEB_PORTA_HOST` na carga deu 58080.
- **Teste que não passa sem porta.** A exigência de mais de 10 portas (`toBeGreaterThan(10)`) impede que o teste passe sem conferir nada se a leitura do YAML quebrar.
- **Cenário 4.** Continua coberto pelo teste que já existia: a porta do retorno do login precisa ser igual a `WEB_PORTA_HOST`.
- **Cenário 5.** Um valor que não é número vira `NaN` e o `toBeLessThan` falha.
- **Arquivos de ambiente.** `infra/teste.env` e `infra/carga.env` não têm mais nenhuma porta na faixa 5xxxx.
- **Execução.** Rodei `npx vitest run tools/ci/ambiente.test.ts`: 12 de 12 passaram.
- **Cenário 6.** A reprodução com o socket sem `SO_REUSEADDR`, já aceita na 1ª rodada, continua descrita no documento.
- Não há `.skip`, mock nem asserção que passe sempre.
- A recomendação da 1ª rodada foi aplicada: o documento explica a faixa 23000–29999 e como escolher a próxima porta.

Bloqueantes: nenhum.

Recomendações:
- **Porta sem variável não é pega.** Uma porta escrita direto no `ports:`, sem variável (por exemplo `127.0.0.1:53400:80`), escapa da expressão regular e do teste. Uma saída é fazer o teste exigir que toda entrada de `ports:` use uma variável, ou conferir também o número literal quando houver.
- **No `/retro`**, reabrir a correção `2026-09-22-corrida-de-porta-na-observabilidade`. A porta 59100 dela também ficava na faixa efêmera, e a falha pode ter tido a mesma causa desta.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/ambiente.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/teste.env`
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/carga.env`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-23-porta-do-teste-na-faixa-efemera.md`

Também li, sem alteração nesta correção:
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/compose.yml`

## infra-guardian · 1ª rodada · APROVADO · 2026-09-23 15:04:11 · `tasks/correcoes/2026-09-23-porta-do-teste-na-faixa-efemera.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum (só o ambiente de teste e de carga da esteira, `infra/`)
Rate limit: não se aplica
Fila e prioridade: não se aplica
Concorrência: protegida. A causa é disputa de porta no host, e a correção a tira do alcance do kernel.
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok. Nenhuma métrica ou alerta mudou. O Prometheus de teste passa de 59100 para 29100 e nada o lê por porta fixa.
Bloqueantes: nenhum

O que conferi nos pontos que você pediu:
- **Conflito com o runner ou a máquina:** a faixa efêmera aqui é `32768 60999`. Entre 23000 e 29999 só escutam os contêineres do próprio `educa-teste` que o portão subiu (25442, 26389, 26390, 28071, 28343). O Portainer está em 8000 e 9443. No `ubuntu-24.04` não há serviço padrão nessa faixa.
- **Teste e carga juntos:** os 13 valores de `infra/teste.env` e os 13 de `infra/carga.env` não se repetem (finais 10/30, 42/62, 89/409 e assim por diante), e os projetos compose têm nomes diferentes. O desenvolvimento, na faixa 53000–59090, também não cruza com nenhum deles.
- **`.env.example` na faixa:** aceitável. O desenvolvimento sobe pelo `compose.yaml` da raiz, no projeto `educa`, e nenhum teste para e religa serviço dele. É o parar e religar que abre a janela do erro.
- **Correção de 22/09 (59100):** nenhum arquivo versionado tem 59100 ou 58071 fixos. As únicas menções estão no texto da própria correção, em `tasks/correcoes/`.
- **Porta fixa em esteira ou script:** `.github/workflows/ci.yml`, `infra/k6`, `infra/scripts`, `infra/grafana` e o `Caddyfile` não têm porta de host fixa. Os testes montam a URL com `valorObrigatorio(ambiente, '..._PORTA_HOST')`: `apps/api/test/limite.int.test.ts:550`, `infra/test/jobs.int.test.ts:10`, `metricas.int.test.ts:21` e `alertas.int.test.ts:27`. As portas 58080 e 55432 que aparecem em `apps/api/src/sessao/externa/configuracao-externa.test.ts` e `apps/api/src/ops/uso.test.ts` são do desenvolvimento, usadas como dado de teste de unidade, e não precisam mudar.
- Todas as portas publicadas estão em `infra/compose.yml`, via `${..._PORTA_HOST:?}`. O teste novo as tira do `ports:` e compara com o ambiente combinado, então uma porta nova esquecida na sobreposição falha com o nome dela.

Recomendações:
1. O `educa-teste-web-1` ainda está de pé com a config antiga (`127.0.0.1:58090->4173`). O `up` do portão deve recriá-lo com a porta nova. Se a execução `--infra` desta rodada pegou esse contêiner sem recriar, o e2e do login externo cai na porta errada; nesse caso, derrube o projeto `educa-teste` antes de confiar no carimbo.
2. A regra "serviço novo de teste ou carga escolhe porta entre 23000 e 29999" está só no texto da correção. Vale uma linha no cabeçalho de `infra/teste.env` e de `infra/carga.env`.
3. O teste em `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/ambiente.test.ts` confere só o limite de cima (menor que 32768). Ele poderia conferir também que as portas ficam acima de 1024 e que teste e carga não compartilham nenhuma, que é o que permite rodar os dois juntos.
