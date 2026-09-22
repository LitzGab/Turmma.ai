# Achados das revisões — `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-20 22:57:02 · `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

Verification complete. Key finding confirmed by reading `tools/ci/esteira.test.ts:28-31`: the guard's only inputs are `ci.yml` and `package.json` — it never reads `playwright.config.ts`, and `trace: 'retain-on-failure'` appears nowhere in any test (only in a comment at `esteira.test.ts:76`).

```
VEREDITO: REPROVADO
```

**Cenários exigidos.** Esta correção não toca domínio, endpoint, query nem migration: não há caminho feliz de escola, caso de borda escolar, permissão ou isolamento a exigir — o caso de isolamento em questão (`e2e/escola-e-vinculos.spec.ts:185`) fica intocado de propósito. O que se exige aqui é: (a) vermelho antes / verde depois do passo de publicação; (b) o artefato chega quando o e2e fica vermelho; (c) o artefato contém o traço, que é a razão de existir do passo; (d) a lista fechada de ações não afrouxa; (e) nenhum outro job ganha superfície de artefato; (f) o conteúdo publicado é sintético (regra 20, item 17).

**Cobertos.** (a) `tools/ci/esteira.test.ts:79` — sem o passo, `expected [] to have a length of 1`; confirmei os 9 verdes com o passo presente. (b) `:81` prova `if: failure()`. (d) e (e) cobertos e **a lista não foi enfraquecida**: `:79` fixa exatamente 1 publicação no e2e, `:90-95` fixa 0 nos demais, e `:58` fixa o conjunto de jobs, então nem um job novo nem um segundo passo entram. O saldo de superfície é exatamente um passo em um job. (f) verificado em `e2e/__fixtures__/sessao.ts:78-79` (`@educa.invalid`, `senha-sintetica-*`): a justificativa de privacidade do documento é verdadeira.

**Bloqueante — a guarda prova a forma do passo, não que o traço seja publicado.**

`tools/ci/esteira.test.ts:75-88`. O título afirma "o e2e publica o traço da falha", mas a asserção não alcança nada que produza traço. `esteira.test.ts:28-31` lê só `ci.yml` e `package.json`; `playwright.config.ts:35` (`trace: 'retain-on-failure'`) e o `outputDir` (não declarado, logo o padrão `test-results/` na raiz) não são afirmados em teste nenhum no repositório. Consequências concretas, todas com os 9 verdes intactos:

- `trace: 'off'` em `playwright.config.ts:35` → o passo publica um diretório sem traço;
- `outputDir` apontado para outro lugar → `path: test-results/` não casa e o artefato sai vazio;
- o passo movido para antes de `npm run ci:e2e` → `if: failure()` dispara por falha do `npm ci` e publica nada.

E o que faz disso um defeito e não um detalhe: `.github/workflows/ci.yml:91` usa `if-no-files-found: ignore`, então nenhum dos três casos avisa. A esteira fica verde, o artefato fica vazio, e o próximo vermelho de e2e volta exatamente ao estado que esta correção existe para encerrar — o defeito se reintroduz em silêncio.

**Correção exigida:** em `tools/ci/esteira.test.ts`, amarrar a guarda ao `playwright.config.ts` — que o modo de traço seja um dos que retêm em falha, e que o `path` publicado case com o diretório de saída efetivo da configuração — e afirmar que o passo de publicação vem depois do passo `npm run ci:e2e` (comparação de índice). O arquivo já faz acoplamento entre arquivos em `:62` (`scripts[ci:${nome}]`), então o padrão e o custo já estão estabelecidos.

**Sobre "não reproduz, não mexo no teste": é a decisão certa, não fuga de trabalho.**

Confirmei que não há corrida estrutural disponível para explicar a falha só no `celular`: a web é SPA com Vite, sem SSR, então não existe o clássico toque perdido antes da hidratação — o `tap()` de `acionar` (`e2e/escola-e-vinculos.spec.ts:36-40`) cai em botão já renderizado pelo React, e o Playwright ainda espera estabilidade. As hipóteses com evidência no documento estão de fato descartadas, e a de `etapaDoLogin` confere (`apps/api/src/sessao/login.service.ts:146-150` só exige MFA de coordenador; o segundo acesso é de professor). Reestruturar um teste de isolamento que passa em oito observações, por causa que não se sustenta, trocaria cobertura real por palpite — é o que a regra 10, item 5, não quer. Diante de causa não estabelecida, tornar a próxima ocorrência diagnosticável é a jogada correta.

**Recomendações**

1. `.github/workflows/ci.yml:91` — `if-no-files-found: warn` em vez de `ignore`. O job já falhou; o aviso não custa nada e faz um caminho errado aparecer no log em vez de sumir.
2. `.github/workflows/ci.yml:85` — `if: failure()` não cobre cancelamento. Com `timeout-minutes: 30` (`:69`), um e2e travado é cancelado, não "failure", e não publica nada — justamente na classe de sintoma (lentidão) que motivou a correção. `if: failure() || cancelled()` resolve sem `${{ }}`, que `esteira.test.ts:49` proíbe.
3. Afirmar também `name: traco-do-e2e`: o documento o promete como contrato da conferência final ("a primeira falha tem de trazer o artefato `traco-do-e2e`") e nada o fixa.
4. Registrar na lista de hipóteses que o `celular` tem caminho de código próprio (`tap()`, `e2e/escola-e-vinculos.spec.ts:36-40`) e que oito observações verdes não limitam uma corrida de baixa probabilidade; um `--repeat-each` alto só no projeto `celular` limitaria. Não bloqueia — é registro para o `/retro`.
5. Com `retries: 0` (`playwright.config.ts:29`) e a regra de só commitar sobre esteira verde, um vermelho não reproduzido continua travando a tarefa seguinte. A correção compra diagnóstico, não imunidade; vale deixar isso explícito no documento.
6. Confirmar uma vez que o SHA `043fb46d…` resolve para a tag v7.0.1 de `actions/upload-artifact` — a guarda prova o formato do SHA, não a correspondência. Território do `infra-guardian`.

## test-engineer · 3ª rodada · APROVADO · 2026-09-20 23:59:46 · `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

## Auditoria da rodada 3 (só o diff desde a minha rodada 2)

Auditei o diff de `tools/ci/esteira.test.ts`, `.github/workflows/ci.yml` e o documento, mais o que eles afetam. Rodei `npx vitest run tools/ci/esteira.test.ts`: 9 de 9 verdes, 288 ms.

**Conferência das cinco recomendações**

1. Documento, "Teste que reproduz" (linhas 83-86): diz "com `failure()` e `cancelled()` na condição", sem o literal `if: failure()`. Aplicada. O único `if: failure() || cancelled()` que sobrou está na seção "Correção" (linha 121), onde é a condição real do passo — correto ali.
2. Documento, linha 116-117: "publica `test-results/` ... Só isso: o `reporter` é `list` e `github` ... sem diretório de relatório para publicar". Confere com `playwright.config.ts:30` (`[['list'], ['github']]` em CI, sem `html`): não existe `outputFolder` a publicar. Aplicada e verdadeira.
3. `tools/ci/esteira.test.ts:96-97`: duas `toContain`. Confirmei os três caminhos que você pediu: `if: always()` → vermelho (não contém `failure()`); só `failure()` → vermelho (não contém `cancelled()`); só `cancelled()` → vermelho; `if` removido → `expect(undefined).toContain(...)` também quebra. A relaxação da ordem literal não afrouxou o que importava, com uma ressalva registrada abaixo (recomendação 1).
4. `:92-93`: `as Passo` fora, `expect(publicacao).toBeDefined()` presente, e o índice sai de `findIndex` próprio em `:104-106`, comparando a publicação com o passo `npm run ci:e2e`. Aplicada.
5. `:101` afirma `timeout-minutes` do job do e2e (`Number(...)` → `NaN` se o campo sair, logo vermelho), e `Job` ganhou `'timeout-minutes'?: number` em `:16`. Confere com `ci.yml:69` (`timeout-minutes: 30`). Aplicada — é a premissa do `cancelled()`, agora fixada.

**Nada mais mudou.** `git diff --stat` mostra só `ci.yml` (+16), `esteira.test.ts` (+60/-2) e `achados-revisoes.md` (+37, o registro da rodada 1). O elo com o `playwright.config.ts` exigido na rodada 1 segue em `:114-119`, intacto, e as duas guardas de borda (`:79-86` lista fechada de ações, `:122-127` nenhum outro job publica artefato) continuam de pé.

```
VEREDITO: APROVADO
Cenários exigidos: (rodada 3, só o diff) a condição do passo continua exigindo falha e cancelamento sem depender da ordem escrita · `always()` e "só uma das duas" ficam vermelhos · a asserção não volta a depender de coerção de tipo (`as Passo`) · o `timeout-minutes` do job do e2e é afirmado, porque é a premissa do `cancelled()` · o documento descreve o passo como ele é (condição e o que se publica) · nada além das cinco recomendações mudou
Cobertos: todos — esteira.test.ts:96-97 (as duas condições, ordem livre; `always()`, condição única e `if` ausente ficam vermelhos), :92-93 (`toBeDefined` no lugar da coerção), :104-106 (ordem provada por `findIndex`, não por índice fixo), :101 (prazo do job > 0; `NaN` se o campo sair), :114-119 (elo com `trace` e `outputDir` efetivo da configuração), :91 e :122-127 (exatamente uma publicação no e2e, zero nos outros jobs), documento linhas 83-86 e 116-117 (texto alinhado ao YAML, conferido contra playwright.config.ts:30)
Bloqueantes: nenhum
Recomendações:
- tools/ci/esteira.test.ts:96-97 — as duas `toContain` aceitam `if: success() || failure() || cancelled()`, que publicaria em execução verde e contraria o "só quando falha" do próprio título do caso. Fecha com duas linhas: `expect(publicacao?.if).not.toContain('success()')` e `expect(publicacao?.if).not.toMatch(/\balways\(\)/)`. Não bloqueia: os regressos plausíveis (`if` removido, `always()`, condição única) já ficam vermelhos.
- tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md:61 e :117 — duas citações fora por uma linha: `trace: 'retain-on-failure'` está em playwright.config.ts:35 (não :34) e o `reporter` em :30 (não :29). O `retries: 0` da linha 130 está certo (:29). Vale corrigir antes do commit, porque é o documento que o /validar vai reler.
- tasks/correcoes/achados-revisoes.md — a tabela do documento (linha 179) registra a minha rodada 2 como APROVADO às 23:29:26, mas não existe bloco correspondente no `achados-revisoes.md` (`grep esteira-descarta` só acha a rodada 1, linha 958). Como o hook gravou o bloco da rodada 2 da correção anterior (linha 934), a ausência aqui parece falha de registro, e ela me custou o texto original das cinco recomendações: auditei contra o resumo do seu prompt mais o que a rodada 1 exigia. Confira o hook antes do commit e, se for o caso, leve o caso ao /retro.
```

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml`, `/home/joaquimdp/Documentos/git/Educa.ia/playwright.config.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados-revisoes.md`.

## test-engineer · 4ª rodada · APROVADO · 2026-09-21 00:29:29 · `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

Verificações feitas, todas empíricas.

**1. As duas asserções novas fecham o furo.** Mutei o `ci.yml` e restaurei (md5 conferido, 9/9 verdes de novo):

| `if` do passo | Guarda |
|---|---|
| `success() \|\| failure() \|\| cancelled()` | vermelho — `expected 'success() \|\| failure() \|\| cancelled()' not to contain 'success()'` |
| `failure() \|\| cancelled() \|\| always()` | vermelho — `not to match /\balways\(\)/` |
| `failure() \|\| cancelled()` (atual) | 9 de 9 verdes, 286 ms |

O `\b` da regex não é decoração: sem ele, nada mudaria nestes casos, mas ele evita casar em palavra que termine em `always()`. A ordem continua livre, como na rodada 3.

**2. As citações batem com a fonte.** `grep -n` em `/home/joaquimdp/Documentos/git/Educa.ia/playwright.config.ts`: `retries: 0` em :29, `reporter` em :30, `trace: 'retain-on-failure'` em :35. O documento agora cita :35 na linha 61, :30 na linha 117 e :29 na linha 130 — as três corretas. Não sobrou nenhuma outra citação de linha do `playwright.config.ts` no documento.

**3. Nada mais mudou.** `git diff --stat`: `ci.yml` +16 (idêntico à rodada 3), `esteira.test.ts` +63/-2 (eram +60/-2, logo as 2 asserções e o comentário), `achados-revisoes.md` +66 (rodadas 1 e 3). O elo com o `playwright.config.ts`, a lista fechada de ações e a guarda de "nenhum outro job publica artefato" seguem intactos.

**4. Minha terceira recomendação.** Confirmei a ausência: `grep esteira-descarta` em `achados-revisoes.md` acha só a 1ª (linha 958) e a 3ª (linha 995) rodadas, enquanto a tabela do documento (linha 179) registra a 2ª como APROVADO às 23:29:26. É falha de registro do hook, e tirá-la desta correção está certo — mexer em `tools/processo/revisoes.ts` aqui seria escopo novo em cima de um portão já carimbado.

```
VEREDITO: APROVADO
Cenários exigidos: (rodada 4, só o diff) `if: success() || failure() || cancelled()` fica vermelho · `always()` em qualquer posição fica vermelho · a condição atual continua verde e os outros 8 casos do arquivo não regridem · as duas citações de linha do documento batem com a fonte · nada além das duas recomendações de código e texto mudou
Cobertos: todos — tools/ci/esteira.test.ts:96-97 (`success()` e `always()` provados vermelhos por mutação real do ci.yml, com restauração conferida por md5), :91-95 e :104-106 (as guardas da rodada 3 seguem verdes, 9 de 9), documento linhas 61, 117 e 130 (conferidas contra playwright.config.ts :35, :30 e :29)
Bloqueantes: nenhum
Recomendações:
- tools/ci/esteira.test.ts:97 — o `not.toContain('success()')` também recusa `if: !success()`, que seria uma forma válida de "publica quando não deu verde". Fica uma forma canônica só, o que é defensável e está dito no comentário; se um dia alguém escrever a negação, o vermelho vai parecer bug do teste. Nada a fazer agora.
- Registro para o /retro (já encaminhado ao TODO.md, fora desta correção): o hook perdeu o bloco da 2ª rodada, e o buraco só aparece quando alguém cruza a tabela do documento com o `achados-revisoes.md`. Uma asserção no `tools/processo/revisoes.ts` que exija um bloco por linha da tabela resolveria a classe inteira.
```

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml`, `/home/joaquimdp/Documentos/git/Educa.ia/playwright.config.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados-revisoes.md`.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-21 00:34:40 · `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

VEREDITO: APROVADO
Caminho quente tocado: deploy (esteira; nada de produção no diff)
Rate limit: não se aplica (nenhum limitador no diff)
Fila e prioridade: não se aplica
Concorrência: não se aplica (nenhuma escrita nova)
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: não se aplica (nenhum caminho quente novo, nenhum alerta novo)

Segurança da mudança na esteira, ponto a ponto do que foi perguntado:
- `actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` confere: `gh api repos/actions/upload-artifact/git/ref/tags/v7.0.1` devolve exatamente esse SHA. Ação oficial da própria GitHub, fixada por SHA de 40 caracteres, e a guarda de `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts:84` mantém a lista fechada.
- Permissão não ampliada: `permissions: contents: read` no topo, nenhum `permissions` de job (asserido em `esteira.test.ts:52-57`), e a publicação de artefato não usa o `GITHUB_TOKEN` — não precisa de `actions: write`. Sem `${{ }}`, sem `secrets.*`, sem `env` em job ou passo (`esteira.test.ts:59-68`). O workflow só dispara em `push` no `main` e `workflow_dispatch`, então fork não alcança o passo.
- Ordem correta: o passo vem depois de `npm run ci:e2e`, e `tools/ci/e2e.ts:22-24` derruba o compose antes de terminar — o `test-results/` do host sobrevive ao `down --volumes`. O `path` bate com o `outputDir` efetivo do `playwright.config.ts` (padrão `test-results`), e a guarda amarra os dois.
- `cancelled()` cobre o estouro de `timeout-minutes: 30` (a doc do GitHub trata o estouro como cancelamento automático do job), e, se em algum caso o job for contabilizado como falha, `failure()` já pega. A condição é superconjunto segura.
- Sem superfície indevida de segredo: o ambiente do e2e sai de `.env.example` e `infra/teste.env`, ambos versionados; `infra/teste.env` não tem credencial. Nada do runner (token do checkout está com `persist-credentials: false`) chega ao `test-results/`.

Bloqueantes: nenhum.

Recomendações:

1. `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md:140` afirma "O artefato é do repositório privado". É falso: `gh repo view` devolve `LitzGab/Turmma.ai`, `visibility: PUBLIC`. A conclusão continua válida (todo dado do e2e é sintético e o ambiente já está versionado em repositório público), mas a premissa precisa ser corrigida, porque o artefato será baixável por qualquer pessoa por 7 dias — o `privacy-guardian` deve julgar com esse fato, não com o outro.

2. O `cancelled()` cobre menos do que o documento promete. Caso morto no meio pelo prazo não tem `trace.zip` finalizado (o `retain-on-failure` só persiste quando o caso termina em falha), e é justamente o caso lento o que seria morto. Além disso a publicação roda dentro da janela de graça do cancelamento, com risco de upload truncado se o `test-results/` estiver grande. Vale ajustar o texto e não contar com o traço nessa via.

3. Falta a metade servidor do diagnóstico, que é a que decidiria as hipóteses listadas (fila do hash rebaixando, `POST /v1/sessao/escola` lento, saturação do Postgres). `tools/ci/e2e.ts:22` só imprime `docker compose logs --no-color --tail 200`, e numa suíte de 132 casos as 200 linhas por serviço já terão passado do momento da falha. Despejar os logs dos serviços dentro de `test-results/` antes do `upload-artifact` (ou subir o `--tail`) compraria a outra ponta da linha de tempo pelo mesmo passo.

4. Sobre o desenho maior, respondendo direto: há fragilidade de infraestrutura de teste por trás dos três vermelhos diferentes, e ela fica de pé. O job do e2e sobe o compose **inteiro** (`etapaCompose('subir o ambiente completo', 'up', ...)` sem lista de serviços): ~18 contêineres, incluindo `observabilidade` (grafana/otel-lgtm), sem nenhum limite de CPU ou memória em `infra/compose.yml`, no mesmo runner compartilhado onde o Playwright roda com `cpuMaisLenta: 4` e, no perfil `celular`, 600 ms de RTT. `workers` não está fixado e `retries: 0`. Nesse arranjo, o orçamento de tempo do `celular` não tem folga, e contenção de CPU do runner vira vermelho que não reproduz em máquina de desenvolvedor — exatamente o padrão dos três casos (e2e fora da curva, `borda.int.test.ts` com 503, reconciliação do despachante). Para o `/retro`: fixar `workers` na esteira, não subir `observabilidade` no job do e2e, e decidir entre folga de `expect` no perfil `celular` ou uma retentativa na esteira com o flake registrado, em vez de tratar cada ocorrência como correção pontual.

5. `if-no-files-found: warn` não é sinal único de mudança de configuração do traço: falha ao subir o compose também deixa `test-results/` vazio e produz o mesmo aviso. O comentário do `ci.yml:93-94` promete mais do que o aviso distingue.

6. `docs/runbook.md` não tem parágrafo dizendo o que fazer com esteira vermelha de e2e nem cita o artefato `traco-do-e2e`. Uma linha lá é o que faz o diagnóstico comprado aqui ser encontrado na próxima ocorrência.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-21 01:06:55 · `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

VEREDITO: APROVADO
Caminho quente tocado: deploy (esteira; nada de produção no diff)
Rate limit: não se aplica
Fila e prioridade: não se aplica
Concorrência: não se aplica (nenhuma escrita nova)
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (nenhum alerta novo; o artefato ganhou o parágrafo de runbook que a regra 80, item 10, pede)

Conferência do diff desde a rodada 1 (`git diff --stat`: `ci.yml` +16 igual à rodada 1, `docs/runbook.md` +16 novo, `esteira.test.ts` 66 linhas, `achados-revisoes.md` +133 — nenhum arquivo de produção tocado):

1. **Recomendação 1 aplicada e o fato confere.** `gh repo view --json nameWithOwner,visibility` → `LitzGab/Turmma.ai`, `PUBLIC`. O documento (linhas 143-163) troca a premissa e refaz o argumento sobre o fato certo. Verifiquei as duas pernas do argumento: `e2e/__fixtures__/sessao.ts:74-79` cria nome, `@educa.invalid` e `senha-sintetica-<uuid>` por execução, e as chaves que aparecem no traço (`IDENTIDADE_CHAVE_CIFRA_V1`, `LOGIN_CHAVE_DISPOSITIVO_V1`, `LOGIN_EXTERNO_*_SEGREDO`, `STORAGE_CHAVE_SECRETA`) estão todas em `.env.example`, versionadas e rotuladas sintéticas; `infra/teste.env` só tem portas. O artefato de fato não revela nada que o repositório já não contenha.
2. **Recomendação 2 aplicada** (documento 121-125 e `docs/runbook.md`, "O caso morto pelo estouro de `timeout-minutes` não deixa traço finalizado"). O texto agora promete o que a via entrega.
3. **Recomendação 5 aplicada** no documento (126-128).
4. **Recomendação 6 aplicada:** a seção "Esteira vermelha no e2e" tem nome do artefato, `gh run download`, `show-trace`, prazo, o significado do vazio e a regra de tratar vermelho não reproduzido por `/corrigir`. Confere com o passo real do `ci.yml`.
5. **Pedido do `privacy-guardian`:** `tools/ci/esteira.test.ts:29-33` fixa `MODOS_QUE_GUARDAM_NA_FALHA = ['retain-on-failure']` e a asserção compara contra `playwright.config.ts:35`. `'on'` passa a ficar vermelho — minimização certa num repositório público.

Portão: `.processo/portao.json` (início 2026-09-21T03:36:46Z, suítes typecheck, lint, test, infra) e `node tools/processo/portao-local.ts conferir` diz "portão local válido para o código atual". `npx vitest run tools/ci/esteira.test.ts`: 9 de 9 verdes, 284 ms.

**Encaminhamento das recomendações 3 e 4: está certo, nenhuma das duas entra aqui.**

- **3 (logs dos serviços dentro de `test-results/`)**: fora do escopo e, num repositório público, é justamente a parte que precisa de julgamento de conteúdo antes de ser publicada — log de serviço não tem a mesma garantia de sinteticidade que o traço do Playwright tem por construção. A meia-ponta que existe hoje (`tools/ci/e2e.ts:22`, `docker compose logs --tail 200` no log do job) está registrada no runbook como o que resta. Adiar é a decisão conservadora.
- **4 (fixar `workers`, não subir `observabilidade` no job do e2e, folga no `celular` ou retentativa registrada)**: é desenho da esteira, não defeito desta correção, e nenhuma regra 80 de caminho quente de produção depende disso. Continua sendo o achado mais valioso da sessão, e vira tarefa com teste próprio — não correção em cima de portão já carimbado.

Bloqueantes: nenhum

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml:93-94` — o comentário no YAML ficou mais estreito que o texto corrigido: ainda diz que o vazio "significa que a configuração do traço ou o diretório de saída mudou", sem a terceira causa (compose que não subiu), que o documento e o runbook já registram. Uma palavra no comentário alinha as três fontes.
2. `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md` — as recomendações 3 e 4 ainda não estão lá (`grep` só acha a linha 51, de observabilidade, sem relação). Como o encaminhamento é exatamente "TODO em commit separado e `/retro` do F1", registre antes de fechar a sessão: a 4 é a que explica três vermelhos diferentes e é a que se perde se ficar só no prompt.
3. A conferência final segue sendo a esteira: a primeira falha de e2e depois deste commit tem de trazer `traco-do-e2e`, e execução verde não pode trazer nada. Se a primeira falha vier com artefato vazio e `warn`, a hipótese a investigar primeiro é compose que não subiu, não configuração do traço — o elo com o `playwright.config.ts` já está guardado em teste.

## test-engineer · 5ª rodada · REPROVADO · 2026-09-21 01:08:28 · `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

VEREDITO: REPROVADO

**O que confirmei do que você pediu** (mutação em cópia do repositório em `/tmp`, repositório real intocado — `git status` e md5 conferidos):

| Mutação | Guarda |
|---|---|
| `trace: 'on'` no `use` de topo | ❌ vermelho — `expected [ 'retain-on-failure' ] to include 'on'` |
| `trace: 'off'` no `use` de topo | ❌ vermelho — `to include 'off'` |
| passo de publicação removido do `ci.yml` | ❌ vermelho — `expected [] to have a length of 1` |
| tudo restaurado | ✅ 9 de 9, 285 ms |

O predicado também recusa `'on-first-retry'`, `undefined` e a forma de objeto (`{ mode: … }`) — probei isolado. Com `retries: 0`, excluir os modos de retentativa está certo.

Cenários exigidos: (rodada 5, só o diff) `trace: 'on'` fica vermelho · `trace: 'off'` continua vermelho · a configuração **efetiva** do traço e do diretório de saída é a afirmada, porque é dela que depende a minimização que sustenta publicar num repositório público · os 8 casos anteriores não regridem · o documento descreve o que o teste de fato exige, e o registro de revisão do documento é verdadeiro.

Cobertos: `tools/ci/esteira.test.ts:123` (modo único aceito, `'on'` e `'off'` provados vermelhos), `:125` (`path` × `outputDir` de topo), `:91-119` (as guardas das rodadas 3 e 4 seguem verdes), `docs/runbook.md:468-483` (nome do artefato, `gh run download`, `show-trace`, limite do estouro de prazo e o vazio como sinal).

Bloqueantes:

1. **`tools/ci/esteira.test.ts:123-125` — a guarda lê só o `use` de topo, e a configuração efetiva do Playwright é por projeto. A minimização que a rodada 5 introduziu é evadível por uma linha, sem vermelho.** Provei as duas evasões na cópia, com o resto intacto:
   - `trace: 'on'` dentro de `projects[].use` do `celular` → **9 de 9 verdes**. `projects[].use` vence o `use` de topo, então o modo efetivo do `celular` passa a ser `'on'`: o artefato público levaria o traço dos 66 casos do projeto, exatamente o que `MODOS_QUE_GUARDAM_NA_FALHA` existe para impedir (documento, linhas 161-162).
   - `outputDir: 'outro-lugar'` dentro de `projects[]` do `celular` → **9 de 9 verdes**. O traço do projeto onde o vermelho desta correção aconteceu cairia fora de `test-results/`, e o `if-no-files-found: warn` daria o mesmo aviso indistinguível.
   
   O mesmo vale para `trace: 'off'` por projeto: é o bloqueante da minha rodada 1 reaberto na granularidade de projeto. **Correção exigida:** resolver o valor efetivo por projeto e afirmar cada um — `projects[].use?.trace ?? use.trace` contra `MODOS_QUE_GUARDAM_NA_FALHA`, e `projects[].outputDir ?? outputDir ?? 'test-results'` contra o `path` publicado — ou, se preferir a forma curta, afirmar que nenhum projeto declara `trace` nem `outputDir` (a configuração hoje não declara, `playwright.config.ts:38-57`). Não aceito isto como recomendação porque é a rodada 5 que faz a minimização virar a justificativa de regra 20 para publicar num repositório público: a afirmação do documento passou a depender de um teste que não a cobre.

2. **`tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md:145-146` — o fato registrado sobre a própria revisão é falso, e ele esconde uma aprovação de regra 20 dada sobre a premissa errada.** O documento diz que o erro "foi apontado pelo `infra-guardian` e a premissa corrigida antes de o `privacy-guardian` decidir". A tabela do próprio documento (`:205-206`) diz o contrário: `privacy-guardian` rodada 1 terminou às **00:33:34**, `infra-guardian` rodada 1 às **00:34:40**, e o documento foi gravado às **00:36**. Ou seja, o `privacy-guardian` aprovou a versão que dizia "repositório privado" e não viu nem o fato corrigido nem o estreitamento de `MODOS_QUE_GUARDAM_NA_FALHA` — os dois estão dentro do que ele audita (minimização, regra 20). Agrava: o bloco da rodada dele não existe em `tasks/correcoes/achados-revisoes.md` (só o do `infra-guardian`, `:1042`), então o texto do documento é o único registro, e ele está errado. **Correção exigida:** corrigir a frase para o que aconteceu (premissa corrigida **depois** da rodada 1 do `privacy-guardian`, por achado do `infra-guardian`) e rodar o `privacy-guardian` sobre a premissa "repositório público" mais a minimização nova, em vez de dar a rodada 1 dele como cobrindo o fato certo.

Recomendações:

- `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md:107-108` — "o modo de traço tem de estar entre os que guardam na falha" descreve a guarda anterior. Hoje o teste exige **exatamente** `retain-on-failure` e recusa `'on'`, que também guarda na falha. A linha 161 está certa; a 107 contradiz ela.
- `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md:100-105` — a tabela de mutações provadas não tem a linha de `trace: 'on'`, que é a mutação da rodada 5. Confirmei o vermelho; falta só registrar, porque é essa tabela que o `/validar` relê.
- `.github/workflows/ci.yml:91-92` — o comentário ainda diz que diretório vazio "significa que a configuração do traço ou o diretório de saída mudou". O documento (`:126-128`) e o runbook já reconhecem que o `warn` não distingue a causa (compose que não subiu produz o mesmo vazio); o comentário no YAML ficou com a versão antiga.
- `docs/runbook.md:469` repete o nome `traco-do-e2e` à mão. O teste fixa o nome em `tools/ci/esteira.test.ts:28`; uma renomeação futura deixa o runbook obsoleto em silêncio. Vale um comentário cruzado, ou aceitar e registrar.

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/playwright.config.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml`, `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados-revisoes.md`.

## privacy-guardian · 3ª rodada · APROVADO · 2026-09-21 02:12:49 · `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

Auditei o diff da rodada 3 (guarda por projeto, `ci.yml`, `docs/runbook.md`) e reexecutei as mutações que sustentam a minimização. Não editei nada; o `playwright.config.ts` foi restaurado ao original depois das mutações (`git diff --stat` limpo).

O que verifiquei por conta própria, em vez de aceitar a tabela do documento:

- `tools/ci/esteira.test.ts:130-143` resolve o efetivo por projeto (`projeto.use?.trace ?? topo`, `projeto.outputDir ?? topo ?? 'test-results'`) e itera `[...projetos, {}]`, ou seja, afirma cada projeto **e** o topo. Mutação 1, `trace: 'on'` dentro de `projects[].use` do `celular`: vermelho, `AssertionError: modo de traço de celular: expected [ 'retain-on-failure' ] to include 'on'`. Mutação 2, `outputDir: 'outro-lugar'` no projeto `celular`: vermelho, `diretório de saída de celular: expected 'test-results' to be 'outro-lugar'`. Restaurado: 9 de 9 verdes.
- A guarda falha fechada nas variações que o `test-engineer` não listou: `trace` como objeto (`{ mode: 'on' }`) não está em `MODOS_QUE_GUARDAM_NA_FALHA` e reprova; `projects` vazio reprova em `expect(projetos.length).toBeGreaterThan(0)`; `path` com mais de uma entrada não bate a igualdade com o `outputDir`.
- Quem mais escreve em `test-results/`: ninguém. Grep no repositório inteiro (fora de `node_modules`, `.git`, `tasks/`, e as skills de terceiros) só acha `.gitignore`, `.dockerignore`, `eslint.config.mjs` e o próprio `ci.yml`. `video` e `screenshot` não estão configurados em lugar nenhum, então o artefato de hoje é `trace.zip` + `error-context.md` do caso que falhou.
- A premissa que o runbook passou a declarar confere: `tools/ci/compose.ts:12,18,64` monta o ambiente só de `.env.example` e `infra/teste.env`, sem `process.env`; `.github/workflows/ci.yml` não tem nenhum `secrets.*` e os quatro `checkout` usam `persist-credentials: false`.
- Nenhum campo pessoal, DTO, log, rota ou seed foi tocado. Fixtures do e2e continuam sintéticas (`e2e/__fixtures__/sessao.ts`, nome inventado, domínio `.invalid`).

```
VEREDITO: APROVADO
Campos pessoais tocados: nenhum — o diff é esteira (.github/workflows/ci.yml), guarda de esteira (tools/ci/esteira.test.ts) e documentação (docs/runbook.md)
Fora da tabela de dados do docs/lgpd.md: nada novo
Autorização por objeto: não se aplica (nenhuma rota tocada)
Logs: limpos
Auditoria: não se aplica (nenhuma ação auditável tocada)
Envio externo: nenhum envio a provedor de IA. Há publicação de artefato para o GitHub Actions em repositório público — traço do caso que falhou, dado sintético, 7 dias, com nome, prazo, caminho, condição e modo de traço por projeto afirmados em teste
Seed/fixture: sintético (e2e/__fixtures__/sessao.ts, domínio .invalid)
Bloqueantes: nenhum
Recomendações:
  1. tools/ci/esteira.test.ts:130-143 — a guarda cobre `trace` e `outputDir`, mas não `video` nem `screenshot`, que são saída do Playwright e vão para o mesmo `test-results/`. Hoje nenhum dos dois está configurado (padrão `off`), então não há furo; `video: 'on'` no topo ou num projeto reabriria exatamente a classe de evasão que esta rodada fechou, e a linha nova do runbook ("nada além da saída do Playwright") não cobre, porque vídeo é saída do Playwright. Asserção de uma linha por modo, no mesmo laço.
  2. Recomendações 1, 2 e 4 da rodada 2 continuam sem registro: TODO.md não está modificado na árvore e nenhum commit novo o toca. Registre antes do commit desta correção, como o documento promete.
  3. docs/runbook.md — o parágrafo do artefato público é bom; vale nomear ali o teste que o sustenta (`tools/ci/esteira.test.ts`, guarda por projeto), para quem for mexer no `playwright.config.ts` saber onde o vermelho vai aparecer.
```

Respondendo às duas perguntas diretas.

**A aprovação da rodada 2 se mantém?** Sim. Ela apoiava-se em duas pernas: o fato de o repositório ser público e a minimização garantida por teste. O buraco que o `test-engineer` achou não desmente o fato nem o conteúdo do artefato de hoje — desmentia o *alcance da prova*, que valia só para o `use` de topo. Com a resolução efetiva por projeto, provada vermelha nas duas evasões e restaurada, a segunda perna volta a sustentar o peso que eu tinha posto nela. A minimização agora não é a configuração atual estar certa por acaso; é a esteira reprovar quem a mudar, inclusive por dentro de um projeto.

**Alguma das recomendações 1, 2 e 4 passou a ser obrigatória?** Não, nenhuma vira bloqueante. Mas a de número 2 (guarda sobre `ARQUIVOS_AMBIENTE_TESTE` e a ausência de `process.env` em `tools/ci/compose.ts`) subiu de prioridade, e o motivo é o próprio parágrafo novo do runbook: ele agora declara, por escrito, que o artefato é inofensivo *porque* o ambiente de teste sai só dos dois arquivos versionados. Uma afirmação de segurança escrita em documento e não amarrada em teste é a mesma forma de furo que esta rodada acabou de consertar no `trace` — a diferença é que lá o defeito já podia ser explorado por uma linha, e aqui a construção está correta hoje e conferi que está. Leve-a ao `/validar` marcada como a primeira da fila, junto com a recomendação 1 acima, que é da mesma família.

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/playwright.config.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml`, `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`.

## test-engineer · 6ª rodada · APROVADO · 2026-09-21 02:13:11 · `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

Auditei o diff desde a rodada 5 e provei as correções por mutação real (repositório restaurado: md5 de `playwright.config.ts` e de `ci.yml` conferidos, `git diff --stat` inalterado, 9/9 verdes no fim).

**Bloqueante 1 — corrigido, provado.** `tools/ci/esteira.test.ts:137-142` resolve o valor efetivo por projeto e afirma cada um mais o topo. Mutei e restaurei cinco vezes:

| Mutação em `playwright.config.ts` | Guarda |
|---|---|
| `trace: 'on'` em `projects[].use` do `celular` | vermelho — `modo de traço de celular: expected [ 'retain-on-failure' ] to include 'on'` |
| `trace: 'off'` em `projects[].use` do `chromebook` | vermelho — `modo de traço de chromebook: ... to include 'off'` |
| `outputDir: 'outro-lugar'` em `projects[]` do `celular` | vermelho — `diretório de saída de celular: expected 'test-results' to be 'outro-lugar'` |
| `outputDir` de topo trocado | vermelho |
| `projects: []` | vermelho — `expected 0 to be greater than 0` (`:136`) |
| passo removido do `ci.yml` | vermelho — `expected [] to have a length of 1` |
| tudo restaurado | 9 de 9, 286 ms |

As duas evasões que eu achei na rodada 5 ficam vermelhas, cada uma nomeando o projeto. A mensagem por projeto não é cosmética: é ela que diz onde olhar quando a guarda cair.

**Bloqueante 2 — corrigido.** O texto (`:153-159`) agora bate com a tabela: `privacy-guardian` rodada 1 às 00:33:34 sobre a premissa errada, `infra-guardian` às 00:34:40, premissa corrigida, e a rodada 2 do `privacy-guardian` (01:04:19–01:07:43, linha 221) como a que vale. Confirmei a cronologia: a rodada 2 do `infra-guardian` (iniciada 01:04:45) já auditou o documento com a premissa corrigida, então a rodada 2 do `privacy-guardian`, iniciada 01:04:19, viu o fato certo.

**As quatro recomendações** foram aplicadas: tabela de mutações com as linhas novas (`:100-108`), "exatamente `retain-on-failure`" no lugar de "entre os que guardam na falha" (`:110-113`), terceira causa do vazio no comentário do `ci.yml`, e o cruzamento com a guarda em `docs/runbook.md`.

Portão: `node tools/processo/portao-local.ts conferir` diz "portão local válido para o código atual (typecheck, lint, test, infra)".

```
VEREDITO: APROVADO
Cenários exigidos: (rodada 6, só o diff) o modo de traço efetivo por projeto é afirmado, e `trace: 'on'` ou `'off'` dentro de `projects[].use` fica vermelho · o `outputDir` efetivo por projeto é afirmado contra o `path` publicado · a lista de projetos não pode esvaziar para a guarda passar por vacuidade · as guardas das rodadas 3, 4 e 5 não regridem · o registro de revisão do documento é verdadeiro contra a própria tabela, e a rodada de `privacy-guardian` que cobre a premissa corrigida existe
Cobertos: todos — tools/ci/esteira.test.ts:137-142 (laço por projeto mais o topo; cinco mutações provadas vermelhas, com o nome do projeto na mensagem), :136 (`projects: []` vermelho), :100-125 (publicação única, `failure() || cancelled()` sem `success()` nem `always()`, `warn`, prazo ≤ 7, ordem depois do `npm run ci:e2e`, `timeout-minutes` do job), :89-96 e :145-150 (lista fechada de ações e nenhum outro job publicando), documento :153-159 e :212-222 (texto e tabela coerentes)
Bloqueantes: nenhum
Recomendações:
- tools/ci/esteira.test.ts:133 — o `import` do `playwright.config.ts` executa `lerAmbienteDeTeste()`/`valorObrigatorio` no carregamento do módulo. Chave faltando em `.env.example` ou `infra/teste.env` deixa esta guarda vermelha por motivo que nada tem a ver com o traço, e a mensagem não vai dizer isso. Uma linha no comentário poupa a próxima investigação.
- tools/ci/esteira.test.ts:40 — a evasão que sobra é afrouxar o próprio `MODOS_QUE_GUARDAM_NA_FALHA` (acrescentar `'on'`). O comentário acima explica por que não, o que é o que dá para fazer em teste; fica o registro de que a minimização depende de alguém ler esse comentário na revisão.
- A rodada 2 do `privacy-guardian` (01:07:43) auditou a guarda que lia só o `use` de topo; a resolução por projeto veio depois dela. Como a mudança só estreita o que pode ser publicado, a aprovação vale a fortiori — mas vale registrar, porque é essa minimização que sustenta publicar artefato em repositório público (regra 20).
- tasks/correcoes/achados-revisoes.md — não existe bloco nenhum de `privacy-guardian` para esta correção (nem da rodada 1, nem da 2), embora a tabela registre as duas. O buraco do hook já foi encaminhado ao /retro nas rodadas 3 e 4; reforço aqui porque justamente o revisor cujo texto sustenta a decisão de regra 20 é o que não deixou rastro consultável.
- TODO.md — as recomendações 3 e 4 do `infra-guardian` continuam sem registro (`grep` só acha a linha 51, de observabilidade, sem relação). A 4 (fixar `workers` na esteira, não subir `observabilidade` no job do e2e, decidir sobre folga no perfil `celular`) é a que explica três vermelhos diferentes e é a que se perde se ficar só no prompt.
```

Arquivos: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/playwright.config.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml`, `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados-revisoes.md`.

## test-engineer · 7ª rodada · APROVADO · 2026-09-21 02:15:33 · `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

Estado confirmado. Nenhum arquivo foi modificado por mim nesta rodada — todos os comandos foram de leitura (`git status`, `git diff`, `stat`, `awk`, `cat`, `git hash-object`).

**A prova de que o conteúdo é o mesmo da rodada 6**, em três linhas independentes:

1. **Nada foi tocado depois do fim da rodada 6 (02:13:11).** O arquivo mais recente da árvore é `tasks/correcoes/achados-revisoes.md` às 02:13:11.839 e o documento da correção às 02:13:11.838 — os dois escritos pelo próprio hook ao registrar a rodada 6, no mesmo instante. Nenhum outro arquivo rastreado tem `mtime` posterior.
2. **Os dois arquivos com `mtime` dentro da janela da rodada 6** são exatamente os dois que a rodada 6 diz ter mutado e restaurado: `.github/workflows/ci.yml` (02:12:09) e `playwright.config.ts` (02:11:52). O segundo é **idêntico ao HEAD** (`git status --porcelain playwright.config.ts` vazio), o que prova a restauração. O primeiro é o único que o hook leu como "mudou", e o diagnóstico do prompt está correto: `mtime` mexido por mutar-e-restaurar, conteúdo intacto.
3. **Todas as 19 âncoras de linha citadas no registro da rodada 6 batem, linha a linha, com o conteúdo atual** — `esteira.test.ts` nas linhas 40, 89, 96, 100, 125, 133, 136, 137, 142, 145, 150, e o documento nas linhas 100, 108, 110, 113, 153, 159, 212, 222. Qualquer inserção ou remoção em qualquer ponto teria deslocado as âncoras seguintes. Não deslocou nenhuma.

Não repeti mutação: a rodada 6 já provou as sete linhas da tabela (incluindo `trace: 'on'` e `outputDir` dentro de `projects[]` do `celular`, que eram o bloqueante da rodada 5) e não há diff a auditar.

```
VEREDITO: APROVADO
Cenários exigidos: (rodada 7, sem diff de código) o estado da árvore é o mesmo que a rodada 6 aprovou — conteúdo de `tools/ci/esteira.test.ts`, `.github/workflows/ci.yml` e `docs/runbook.md` inalterado, `playwright.config.ts` restaurado ao HEAD, nenhum arquivo tocado depois de 02:13:11
Cobertos: todos — `git status --porcelain` lista só os 4 modificados de sempre mais o documento não rastreado; `playwright.config.ts` limpo contra o HEAD; `stat` de todos os arquivos rastreados sem nada posterior ao fim da rodada 6; as 19 âncoras de linha do registro da rodada 6 batendo com o conteúdo atual em tools/ci/esteira.test.ts e no documento da correção
Bloqueantes: nenhum
Recomendações:
- Defeito do hook, para o `/retro`: `tools/processo/revisoes.ts` decide caducidade por `mtime`, e mutar-e-restaurar — que é o trabalho esperado deste revisor — atualiza o `mtime` sem mudar o conteúdo. O revisor invalida a própria rodada ao fazer o que se pede dele. O critério deveria ser hash de conteúdo (`git hash-object` do arquivo contra o gravado no fim da rodada), não `mtime`. Foram duas rodadas gastas por isso nesta correção (a 7, e parte da 6).
- Permanecem, da rodada 6, sem virar bloqueante: o comentário em `tools/ci/esteira.test.ts:133` sobre o `import` do `playwright.config.ts` executar `lerAmbienteDeTeste()` no carregamento (chave faltando em `.env.example` deixa a guarda vermelha por motivo alheio ao traço, sem a mensagem dizer isso); a evasão que sobra em `tools/ci/esteira.test.ts:40`, afrouxar o próprio `MODOS_QUE_GUARDAM_NA_FALHA`, que só a leitura do comentário na revisão segura.
- Permanece a lacuna de rastro: `tasks/correcoes/achados-revisoes.md` não tem bloco nenhum de `privacy-guardian` para esta correção (a tabela do documento registra três rodadas dele; o arquivo tem zero). Justamente o revisor cujo texto sustenta a decisão de regra 20 sobre publicar artefato em repositório público é o que não deixou registro consultável.
- Permanece: as recomendações 3 e 4 do `infra-guardian` continuam sem registro no `TODO.md` (a 4 — fixar `workers` na esteira, não subir `observabilidade` no job do e2e, decidir folga no perfil `celular` — é a que explica três vermelhos diferentes).
```

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml`, `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`, `/home/joaquimdp/Documentos/git/Educa.ia/playwright.config.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados-revisoes.md`.

## infra-guardian · 3ª rodada · APROVADO · 2026-09-21 02:15:47 · `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

VEREDITO: APROVADO
Caminho quente tocado: deploy (esteira; nenhum arquivo de produção no diff)
Rate limit: não se aplica
Fila e prioridade: não se aplica
Concorrência: não se aplica (nenhuma escrita nova)
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (nenhum alerta novo; o artefato tem a seção de runbook que a regra 80, item 10, pede)

Conferência do diff desde a minha rodada 2 (`git diff --stat`: `ci.yml` +17, `docs/runbook.md` +25, `tools/ci/esteira.test.ts` +83, `achados-revisoes.md`; nenhum arquivo de produção tocado). Nenhum arquivo modificado por mim.

1. **Resolução por projeto (bloqueante do `test-engineer`, rodada 5) — fechada.** `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts:132-141` itera `[...projetos, {}]` e resolve `projeto.use?.trace ?? topo.use?.trace` e `projeto.outputDir ?? topo.outputDir ?? 'test-results'`. Como `projects[].use` vence o topo no Playwright, `trace: 'on'` ou `outputDir` dentro do `celular` agora caem em `MODOS_QUE_GUARDAM_NA_FALHA` / na comparação de `path` e ficam vermelhos. `expect(projetos.length).toBeGreaterThan(0)` impede que a evasão volte por lista vazia. `devices['Desktop Chrome']` espalhado no `chromebook` não traz `trace`, então o `??` resolve para o topo, como deve. `npx vitest run tools/ci/esteira.test.ts`: 9 de 9 verdes, 284 ms.
2. **Recomendação 1 da rodada 2 — aplicada.** `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml:93-95` agora lista as três causas do vazio, incluindo "o compose que não subiu", alinhado com o documento e com `docs/runbook.md`.
3. **Recomendação 3 (logs de serviço no artefato) — respondida por decisão, não por adiamento solto.** `docs/runbook.md` fixa que o artefato é público e que **nada além da saída do Playwright** pode ser escrito em `test-results/`, o que faz um despejo futuro de log exigir decisão nova com o `privacy-guardian`. É a resposta certa para repositório público: log de serviço não tem a garantia de sinteticidade que o traço tem por construção.
4. **Cronologia corrigida.** O documento (seção "Sobre o conteúdo") agora bate com a tabela de revisões: `privacy-guardian` rodada 1 às 00:33:34 sobre a premissa "privado" (falsa), `infra-guardian` às 00:34:40 apontando, premissa corrigida, e a rodada 2 do `privacy-guardian` (01:04:19–01:07:43) como a que vale. Sem afirmação falsa restante que eu consiga cruzar.
5. **Sem nova superfície na esteira.** A ação continua oficial e fixada por SHA de 40 caracteres, a lista permitida segue fechada (`esteira.test.ts:89-95`), `permissions: contents: read` no topo sem `permissions` de job, sem `secrets.*` e `persist-credentials: false`. O passo continua depois de `npm run ci:e2e`, e a guarda afirma a ordem. Verifiquei que o `import('../../playwright.config.ts')` novo não cria dependência de runtime no job `verificar`: `lerAmbienteDeTeste` (`tools/ci/compose.ts:63`) lê só `.env.example` e `infra/teste.env`, ambos versionados — nada de docker nem de variável do runner.

Bloqueantes: nenhum.

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md` — "nada além da saída do Playwright deve ser escrito em `test-results/`" é hoje só prosa. Uma asserção que confira que nenhum passo do job do e2e escreve nesse diretório antes da publicação tornaria a regra executável; não bloqueia, porque o único escritor atual é o Playwright.
2. Mantida da rodada 2: `expect(publicacao?.if).not.toContain('success()')` recusa também `if: !success()`, que seria uma forma válida. Forma canônica única é defensável e está no comentário.
3. Mantida: a conferência final é a esteira. A primeira falha de e2e depois deste commit tem de trazer `traco-do-e2e`; execução verde não pode trazer nada. Artefato vazio com `warn` aponta primeiro para compose que não subiu, já que o elo com o `playwright.config.ts` está guardado em teste.
4. Encaminhamento confirmado e inalterado: recomendações 3 e 4 da rodada 1 (logs dos serviços; fixar `workers`, não subir `observabilidade` no job do e2e, decidir entre folga no perfil `celular` ou retentativa com flake registrado) para o `TODO.md` em commit separado e para o `/retro` do F1. A 4 continua sendo o achado mais valioso da sessão: é o que explica três vermelhos diferentes.
