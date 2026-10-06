# Achados das revisões — `tasks/correcoes/2026-10-06-audit-proxy-addr-e-multer.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-06 06:32:05 · `tasks/correcoes/2026-10-06-audit-proxy-addr-e-multer.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- Caminho feliz: `npm audit --audit-level=high --omit=dev` vermelho antes e verde depois. O upload de material continua funcionando.
- Borda 1 (aviso do proxy-addr): o IP do cliente, com IPv6 mapeado vindo de fora da borda e `X-Forwarded-For` forjado, não pode passar pela comparação de sub-rede do Express.
- Borda 2: as quatro mudanças do multer 2.4.0 que alcançam o nosso uso, provadas na rota `POST /v1/materiais`:
  - limites validados na construção;
  - pedido com exatamente `parts` partes, agora aceito;
  - `fileFilter` que recusa não consome mais o `maxCount`;
  - a mensagem de `LIMIT_UNEXPECTED_FILE` mudou. O documento não lista essa última, e ela quebra a rota.
- Borda 3: os tetos de quantidade do recebimento (`files: 1`, `fields: 10`, `fieldSize: 2 KiB`, `parts: 11`). O documento diz que eles "continuam garantindo o teto".
- Permissão: não muda. As guardas rodam antes do interceptor, então só a coordenação chega ao multipart.
- Isolamento: não se aplica, porque a correção não toca dado de escola.
- Concorrência: não se aplica.

**Cobertos:**
- **Audit.** Rodei `npm audit --audit-level=high --omit=dev`: `found 0 vulnerabilities`, saída 0. O `npm ls` mostra `proxy-addr@2.0.8` e `multer@2.4.0 overridden`.
- **"O proxy-addr não alcança o nosso uso": correto e coberto.**
  - Não existe `trust proxy`, `req.ip` nem `req.ips` em `apps/*/src` nem em `packages/*/src`.
  - Todo `origem.ip` vem de `ipDaRequisicao` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/limite/guarda-limite.ts:122`).
  - `ProxiesConfiaveis` compara por conjunto de IPs exatos, já normalizados, e não por sub-rede.
  - Os testes `proxies-confiaveis.test.ts:15` (`::ffff:10.0.0.2`) e `chaves.test.ts:6` e `:36` (IPv6 mapeado de fora da borda ignora o cabeçalho) quebrariam se a normalização saísse.
  - Para esse aviso, a evidência da esteira basta no lugar de um teste de comportamento.
- **"O multer não alcança (DiskStorage)": correto.** A rota usa `memoryStorage`. Isso fecha o aviso, mas não as mudanças de comportamento da versão.
- **Mudanças cobertas pelos testes atuais:**
  - A validação dos limites na construção: os nossos são inteiros, e qualquer `.int.test.ts` sobe a API.
  - O tamanho do arquivo: acima do teto dá 413 (`material.int.test.ts:250`), exatamente no teto passa (`:263`).
  - Recusa por licença com o arquivo antes e depois dos campos (`:157-188`).

**Bloqueantes:**

1. **O override sem subir o Nest troca 400 por 500.** Arquivo: `/home/joaquimdp/Documentos/git/Educa.ia/package.json:65` (`"multer": "2.4.0"`), com `@nestjs/platform-express` 12.0.1 em `apps/api/package.json:16`.
   - O `transformException` do Nest 12.0.1 traduz o erro do multer comparando a **mensagem** (`node_modules/@nestjs/platform-express/multer/multer/multer.constants.js:9`: `'Unexpected field'`).
   - O multer 2.4.0 mudou essa mensagem para `'Unexpected file field'` (`node_modules/multer/lib/multer-error.js:10`).
   - Resultado: um arquivo enviado em campo diferente de `arquivo` passa como `MulterError` sem tradução, cai no `FiltroGlobalDeErro` e sai **500 `ERRO_INTERNO`**, registrado como `logger.error`. Na 2.3.0 era 400 `ENTRADA_INVALIDA`.
   - Reproduzi sem banco, com multer 2.4.0 e o `transformException` instalado: o campo errado dá `{"code":"LIMIT_UNEXPECTED_FILE","nest":"MulterError","status":null}`.
   - Isso quebra a regra 00, item 9 (erro de domínio tipado) e dá a quem envia um 5xx sob demanda, que conta no alerta de taxa de erro.
   - O Nest 12.1.2 declara `multer` 2.4.0 exato e já usa `'Unexpected file field'`. Então a frase da linha 79 do documento ("subir o Nest para 12.1.2 não foi preciso") está errada.
   - **Correção exigida:**
     - Subir os pacotes `@nestjs/*` para 12.1.2 (o override do multer então pode sair), ou traduzir o `MulterError` pelo `code` no recebimento ou no filtro.
     - Teste em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/material.int.test.ts`, no `describe('o arquivo')` (linha 207): PDF enviado no campo `outro` responde `{ status: 400, codigo: ENTRADA_INVALIDA }`, sem linha em `material` e sem chamar a extração. Esse teste é o "teste que reproduz": está vermelho hoje.
     - Para isso, o `enviarMaterial` em `apps/api/test/material-de-teste.ts:62` precisa de opção para o nome do campo do arquivo.
     - Corrigir no documento a lista do que muda na 2.4.0 e a linha 79.

2. **Os tetos de quantidade do upload não têm teste, e foi neles que a versão mudou.** Arquivo: `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/material/recebimento.ts:32` (`files`, `fields`, `fieldSize`, `parts`).
   - O documento diz que "o teto continua garantido por `files` e `fields`" (linha 76) e que "o `material.int.test.ts` cobre... os tetos" (linha 81).
   - Só o `fileSize` é testado. Tirar `files`, `fields`, `fieldSize` ou `parts` não derruba nenhum teste. A 2.4.0 mudou justamente a contagem de `parts` e o consumo do `maxCount` pelo `fileFilter`.
   - **Correção exigida:** no mesmo `describe` do `material.int.test.ts`, com o resultado fixado e "nada gravado e extração não chamada" em cada caso:
     - **Dois arquivos em `arquivo` com licença válida:** 400 `ENTRADA_INVALIDA`.
     - **Dois arquivos em `arquivo` com licença recusada (`sem_licenca`, campos antes):** é o caso em que o `fileFilter` deixa de consumir o `maxCount`. Hoje dá 400 `ENTRADA_INVALIDA` por `LIMIT_FILE_COUNT`, sem auditoria de recusa. Fixar o que a API devolve.
     - **Os 6 campos + 4 a mais via `extra` (10 campos + arquivo = exatamente 11 partes, agora aceito pelo multer):** 400 `ENTRADA_INVALIDA` pelo contrato estrito.
     - **Os 6 campos + 5 a mais (11 campos):** 400 `ENTRADA_INVALIDA`.
     - **`titulo` acima de 2 KiB:** 400 `ENTRADA_INVALIDA`.
   - Reproduzi sem banco que, na 2.4.0, os casos de dois arquivos, 11 campos e campo grande dão 400, e que 10 campos + arquivo passam pelo multer. O teste prova isso na rota de verdade.

**Recomendações:**
- O lockfile marcou `buffer-from` como `"dev": true`. Está certo: só o `concat-stream`, que saiu, o usava em produção. Vale uma linha no documento.
- Com o Nest em 12.1.2, o `overrides` do `multer` fica redundante. Tirá-lo evita que o próximo aviso exija editar o override de novo.
- Nenhum teste de integração prova que o `trust proxy` do Express continua desligado (`X-Forwarded-For` forjado numa rota que lesse `req.ip`). Hoje nada lê `req.ip`, então não bloqueia. Fica para o `/retro`, caso algum código passe a usar `req.ip`.

Não rodei nenhuma suíte com banco. As reproduções foram scripts Node isolados na scratchpad, sobre `node_modules/multer` 2.4.0 e `node_modules/@nestjs/platform-express` 12.0.1.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-06 06:37:20 · `tasks/correcoes/2026-10-06-audit-proxy-addr-e-multer.md`

**VEREDITO: REPROVADO**

A correção 1 está feita por completo. Na correção 2, dois dos seis casos novos não falhariam se o teto que dizem provar fosse removido. Esse ponto também é falha minha: na 1ª rodada eu exigi "11 campos -> 400" e "titulo acima de 2 KiB -> 400" sem notar que o contrato estrito já devolve esse mesmo resultado. A troca de arquivo que resolve está no bloqueante abaixo.

Conferido sem banco (o portão continua rodando):
- `npm audit --audit-level=high --omit=dev` dá `found 0 vulnerabilities`, código 0.
- `npm ls` mostra `@nestjs/platform-express@12.1.2` (deduped em api, realtime e core), `multer@2.4.0` e `proxy-addr@2.0.8`.
- O `transformException` instalado traduz o erro do multer pelo `code`.
- Não há `overrides` em `package.json`.

**Cenários exigidos:**
- O arquivo em outro campo responde 400 `ENTRADA_INVALIDA`.
- Dois arquivos com licença válida.
- Dois arquivos sem licença.
- 10 campos e o arquivo, exatamente as `parts`.
- 11 campos.
- `titulo` acima de 2 KiB.

Em todos: nada gravado, extração não chamada, nenhuma auditoria. Mais o `npm audit` de produção verde.

**Cobertos:**
- **Outro campo** (`material.int.test.ts:275`). Vermelho comprovado com Nest 12.0.1 e multer 2.4.0 (500 `ERRO_INTERNO`); prova a tradução pelo `code`.
- **Dois arquivos com licença** (`:276`). Prova a regra de um arquivo só. Removendo só `files: 1` ele não cai, porque o `FileInterceptor` usa `single` (`maxCount` 1), mas o caso seguinte cobre o `files: 1`.
- **Dois arquivos sem licença** (`:278`). Este prova o `files: 1`: no multer 2.4.0 o arquivo descartado pelo `fileFilter` não conta no `maxCount`. Sem o teto, o segundo arquivo também seria descartado, o pedido chegaria ao serviço e sairia a recusa por licença com auditoria `material.recusado`, que o teste proíbe.
- **10 campos e o arquivo** (`:280`). Fixa o limite exato de `parts` e o contrato recusando.
- **Documento.** Causa, lista do que muda no Nest e no multer, `buffer-from` registrado como dev e o `overrides` removido: tudo feito. As duas recomendações da 1ª rodada foram atendidas.

**Bloqueantes:**

1. **`apps/api/test/material.int.test.ts:281` e `:282`: os casos "onze campos" e "campo de texto acima de 2 KiB" não falhariam sem o teto.**
   - **Onze campos.** Removendo `fields` e `parts` de `RecebimentoDoMaterial` (`apps/api/src/material/recebimento.ts:32`), o pedido passa pelo multer. O `esquemaPedidoEnviarMaterial` é `strictObject` (`packages/shared/src/material/material.ts:66`), então `lerEntrada` lança `ErroDeDominio(ENTRADA_INVALIDA)`, 400, com nada gravado e sem extração. Sai o mesmo resultado que o teste espera.
   - **Título de 2 KiB.** Removendo `fieldSize`, o mesmo acontece com o título acima de 2 KiB, que o contrato já recusa por `max(160)`.
   - **Por que importa.** O filtro global devolve o mesmo envelope nos dois caminhos. O teste não distingue "parou no recebimento, antes de o arquivo entrar na memória", que é a regra 80, item 3, de "recebeu tudo e o contrato recusou". O comentário em `:269` e o nome em `:281` ("acima dos campos e das partes") dizem que o teste prova algo que ele não prova.
   - **Correção exigida.** Nesses dois casos, enviar um arquivo acima do teto: `MAXIMO_DE_BYTES_DO_MATERIAL + 1`, como já faz o caso em `:258`. Manter a asserção `{ status: 400, codigo: ENTRADA_INVALIDA }`.
     - Com o teto, o multer aborta no campo, antes do arquivo: `fieldsLimit` vira `LIMIT_FIELD_COUNT` e o campo truncado vira `LIMIT_FIELD_VALUE` (`node_modules/multer/lib/make-middleware.js:262` e `:429`), e a resposta é 400.
     - Sem o teto, o arquivo chega ao `fileSize` e sai 413. O teste fica vermelho.
     - Para o caso dos onze campos, o vermelho só aparece removendo `fields` e `parts` juntos. Removendo só `fields`, o `parts` pega a 12ª parte, que é o arquivo, e devolve 400 também. Basta deixar isso dito no comentário.
     - Corrigir o comentário de `:269` e a seção "Teste que reproduz" do documento conforme o que cada caso prova.
     - Comprovar o vermelho de cada caso tirando o teto correspondente (`fieldSize`; `fields` + `parts`) e registrar no documento, como foi feito com o caso do outro campo.

**Recomendações:**
- O `parts: MAXIMO_DE_CAMPOS + 1` não tem como ser provado sozinho pela API. Com `files: 1` e `fields: 10`, ele nunca é o primeiro a disparar, e nenhum pedido válido chega a 11 partes, porque o contrato aceita no máximo 6 campos. Vale uma linha no comentário de `recebimento.ts` dizendo que ele é defesa redundante, para ninguém procurar o teste dele depois.
- O comentário de `recebimento.ts:7` diz "seis campos" e o pedido padrão manda cinco, porque `licenciante` é opcional. O texto está certo quanto ao máximo, mas o caso de `:279` depende dessa conta; vale citar a constante ou o esquema no lugar do número.
- Concorrência não se aplica: a mudança não cria operação que possa acontecer duas vezes.

Arquivos:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/material.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/material-de-teste.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/material/recebimento.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/material/material.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-06-audit-proxy-addr-e-multer.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-06 06:39:40 · `tasks/correcoes/2026-10-06-audit-proxy-addr-e-multer.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- O `npm audit --audit-level=high --omit=dev` passa de vermelho para verde.
- O erro do `multer` é traduzido pelo código (arquivo enviado em outro campo dá 400, e não 500).
- Um arquivo por pedido.
- O `files: 1` vale antes da recusa por licença (a 2.4.0 não conta no `maxCount` o arquivo que o `fileFilter` descarta).
- Exatamente o número de `parts` passa pelo recebimento.
- O teto de `fields` (com o `parts`) para o pedido antes do arquivo.
- O `fieldSize` para o pedido antes do arquivo.
- Isolamento e concorrência não se aplicam: a correção sobe versão de dependência e não toca escopo nem operação repetível.

**Cobertos:** todos. A correção exigida na 2ª rodada foi feita.

Na tabela de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/material.int.test.ts` (linhas 289 a 310), os casos "onze campos" e "campo acima de 2 KiB" mandam agora `PDF_ACIMA_DO_TETO`, um byte acima de `MAXIMO_DE_BYTES_DO_MATERIAL` (20 MiB), e continuam esperando 400 `ENTRADA_INVALIDA`. Conferi pelo código que o raciocínio fecha:

- O helper manda 5 campos (`licenciante` vai indefinido), e o caso soma mais 6, total de 11 acima do `fields: 10`. Sem `fields`, a 12ª parte (o arquivo) estoura o `parts: 11` e a resposta continua 400. Só tirando os dois o arquivo chega ao `fileSize` e sai 413. Isso bate com a nota do documento.
- O `titulo` com 2049 bytes estoura o `fieldSize`. Sem esse teto, o contrato falha, o `fileFilter` aceita o arquivo e ele estoura o `fileSize`, o que dá 413.
- Os campos vão antes do arquivo (`arquivoPrimeiro = false`), então o teto de campo dispara primeiro.

O vermelho de cada teto está registrado na tabela "Teste que reproduz" do documento, e o arquivo de produção ficou fora do diff. Não há `.skip` nem `.only`, e o teste usa só a rota real, sem mock da regra.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/material.int.test.ts:265`, o teste de 413 refaz o mesmo buffer que agora existe como `PDF_ACIMA_DO_TETO` (linha 37). Dá para reusar a constante.
2. Os casos "dez campos" e "dois arquivos no campo `arquivo`" não têm vermelho próprio, e o documento já diz isso. O de dez campos daria 400 também se a contagem de `parts` voltasse ao jeito antigo, então só fixa o comportamento da 2.4.0 e não prova regra. Vale deixar essa limitação dita no comentário do `it.each`, como está no documento.
3. Continuam valendo as da rodada anterior, para quando alguém mexer em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/material/recebimento.ts`:
   - o comentário fala em "seis campos", mas o pedido manda cinco quando `licenciante` não vem;
   - falta dizer no código que o `parts` é defesa redundante.

Documento auditado: `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-06-audit-proxy-addr-e-multer.md`.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-06 06:40:42 · `tasks/correcoes/2026-10-06-audit-proxy-addr-e-multer.md`

VEREDITO: APROVADO

Caminho quente tocado: login (a borda HTTP do Express, que a requisição de login atravessa sem mudança de comportamento) e o upload de material (fora do caminho quente de sala)

Rate limit: ok. A correção não muda o rate limit e não liga `trust proxy`, e `apps/` não lê `req.ip`. A requisição autenticada continua contando por usuário e por escola. A anônima e a de login continuam contando pelo IP, que sai de `ipDaRequisicao` com `ProxiesConfiaveis` e não passa pelo `proxy-addr`. Esse desenho já existia antes da correção.

Fila e prioridade: ok, não se aplica. A correção não cria job.

Concorrência: protegida. A correção não grava nada de novo.

Índice e paginação: ok, não se aplica. Não há query nova.

Degradação de IA: não se aplica

Migration: não se aplica

Métrica e alerta: ok. O código de produção não mudou: `recebimento.ts` está intacto. O caso que gerava um 5xx sob demanda (arquivo em outro campo virando 500 `ERRO_INTERNO`) agora sai 400. Assim o alerta de taxa de erro não ganha um disparo que qualquer cliente poderia provocar.

Bloqueantes: nenhum

O que eu conferi:
- **Audit:** `npm audit --audit-level=high --omit=dev` dá `found 0 vulnerabilities`.
- **Versões:** `npm ls` mostra `@nestjs/platform-express@12.1.2`, `express@5.2.1`, `proxy-addr@2.0.8` e `multer@2.4.0`, sem dependência inválida ou faltando.
- **Lockfile:** o diff só tem os três pacotes que sobem e os seis que saíram junto com o `concat-stream`. Nenhuma outra versão mudou.
- **Pacote publicado:** comparei o 12.0.1 com o 12.1.2 e as mudanças batem com a lista do documento. O erro do `multer` passa a ser traduzido pelo `code`, os `limits` passam a ser mesclados chave a chave, o prefixo é normalizado, a versão por `Accept` é lida de outro jeito e o `+json` conta como JSON. Nada disso atinge o código: não há `setGlobalPrefix`, `enableVersioning` nem resposta `+json` em `apps/api/src`, `apps/realtime/src` ou `packages/nucleo/src`.
- **Versões mistas do Nest:** a 12.1.2 aceita `@nestjs/common` e `@nestjs/core` em `^12.0.0`. O `@nestjs/common/internal.js` da 12.0.1 reexporta `utils/shared.utils.js`, e lá estão `isPlainObject`, `addLeadingSlash` e `stripEndSlash`.
- **Realtime:** só importa o tipo `NestExpressApplication` e não usa `multer`. A subida de versão não muda o comportamento dele.
- **Regra 80, item 3:** os tetos do multipart (`files`, `fields`, `parts`, `fieldSize` e `fileSize`) continuam em `recebimento.ts:31`. Os seis casos novos em `material.int.test.ts` exercitam esses tetos na rota de verdade, e o vermelho de cada um está documentado. Nenhum teste chama provedor pago.

Não rodei nenhuma suíte, porque o portão local estava usando o banco de teste.

Recomendações:
- Hoje `@nestjs/platform-express` está em 12.1.2 e `@nestjs/common`/`@nestjs/core` em 12.0.1 (`apps/api/package.json:14-16` e `apps/realtime/package.json:14-16`). Isso funciona porque o pacote depende de exports que o próprio `@nestjs/common` marca como `@internal`, e um `npm update` que mexa só em um dos lados pode quebrar sem aviso de peer. Vale alinhar `common`, `core`, `platform-socket.io` e `websockets` em 12.1.2 numa tarefa própria, ou registrar no `TODO.md` que as quatro sobem juntas.
- O documento da correção diz que o `parts` sozinho não tem como ser provado pela API e que é defesa redundante. Vale deixar essa frase num comentário em `recebimento.ts`, para ninguém tirar o `parts` achando que está sem teste, ou trocar o valor achando que está coberto.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-06-audit-proxy-addr-e-multer.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/material/recebimento.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/material.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/material-de-teste.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/limite/guarda-limite.ts

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-06 08:14:59 · `tasks/correcoes/2026-10-06-audit-proxy-addr-e-multer.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok (é uma correção de dependência, sem seção de Tech Spec. O código de produção `apps/api/src/material/recebimento.ts` não mudou)
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, test, e2e, infra)")

O que conferi sem rodar suíte: `npm audit --audit-level=high --omit=dev` dá `found 0 vulnerabilities`. O `npm ls` mostra `@nestjs/platform-express@12.1.2` deduplicado na api, no realtime e no core, com `proxy-addr@2.0.8` e `multer@2.4.0`, e nenhuma dependência inválida. O lockfile só tem as três subidas e os seis pacotes que saíram com o `concat-stream`. O `overrides` saiu da raiz. A conta de partes do teste fecha: o helper manda 5 campos, porque `licenciante` vai indefinido; mais 5 dá 10 campos e o arquivo, ou seja, as 11 `parts`. O espião do extrator é desfeito pelo `vi.restoreAllMocks()` da linha 90.

Bloqueantes:

1. **`tasks/correcoes/2026-10-06-audit-proxy-addr-e-multer.md:132-133`: há texto escrito à mão dentro da seção "Revisões", abaixo da tabela.** Essa seção diz "Não edite à mão", e o hook (`acrescentarRevisao`, em `tools/processo/revisoes.ts:318-324`) acrescenta cada rodada no fim do arquivo. A minha rodada e as próximas vão cair depois desse parágrafo. A tabela fica partida em duas, e o parágrafo fica no meio do registro das revisões.
   - **Correção exigida:** levar o parágrafo do `TODO.md` para a seção "Correção", que fica acima de `## Revisões`, junto da lista do que muda. Depois do parágrafo, a seção "Revisões" deve conter só o que o hook escreve.

2. **No mesmo documento, a tabela de "Revisões" (linhas 126-130) perdeu a primeira rodada do `test-engineer`, a das 06:32:05, que reprovou.** Essa rodada está em `tasks/correcoes/achados/indice.md:194` e no achado (cabeçalho da linha 5). O hook só grava o achado se o documento já existe (`existsSync`, em `revisoes.ts:645`). Então, às 06:32, o documento existia e recebeu a linha, e foi reescrito por inteiro depois. Por isso a rodada das 06:37 aparece como "1", e o índice tem duas rodadas "1ª" do `test-engineer`. O registro da revisão é o rastro que o processo da D53 audita, e uma rodada reprovada sumiu dele.
   - **Correção exigida:** registrar no documento, fora da tabela (na seção "Correção" ou numa nota antes de `## Revisões`), que a rodada do `test-engineer` das 06:32:05 reprovou e se perdeu da tabela quando o documento foi reescrito. A nota deve apontar para `achados/indice.md:194`. Daqui em diante, editar o documento por trecho, sem reescrevê-lo.

Recomendações:
- `apps/api/src/material/recebimento.ts:8`: o comentário fala em "seis" campos de texto, mas o pedido da tela manda cinco quando `licenciante` não vem. Falta também dizer ali que o `parts` é defesa redundante e não tem teste próprio. Dois revisores já pediram isso. Entra na próxima tarefa que tocar o arquivo; esta correção, com razão, não mexeu em produção.
- `apps/api/test/material.int.test.ts`: o teste de 413 ainda monta o mesmo buffer que agora existe como `PDF_ACIMA_DO_TETO`. Dá para reaproveitar a constante.
- O prompt fala em "3ª rodada" do `test-engineer`, mas o documento registra a aprovação como 2ª. A diferença vem da linha que se perdeu (bloqueante 2).

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-06-audit-proxy-addr-e-multer.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados/indice.md
- /home/joaquimdp/Documentos/git/Educa.ia/tools/processo/revisoes.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/material/recebimento.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/material.int.test.ts

## revisor-geral · 2ª rodada · APROVADO · 2026-10-06 08:15:37 · `tasks/correcoes/2026-10-06-audit-proxy-addr-e-multer.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok (é uma correção de esteira, sem Tech Spec. A troca de versão está explicada no documento, e o `TODO.md` registra o desalinhamento entre os pacotes `@nestjs/*`)
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, test, e2e, infra)")
Bloqueantes: nenhum

As duas correções exigidas na 1ª rodada foram feitas.

1. O parágrafo do `TODO.md` agora está no fim da seção "Correção", em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-06-audit-proxy-addr-e-multer.md:120-121`. A seção "Revisões" (linha 130 em diante) só tem o cabeçalho padrão e a tabela, contínua e com as linhas que o hook escreveu.
2. A rodada que faltava está registrada fora da tabela, em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-06-audit-proxy-addr-e-multer.md:123-128`. O parágrafo diz o horário (06:32:05), que a rodada reprovou e por quê. Também aponta para `achados/indice.md` na linha 194 e para o bloco do achado; conferi que os dois existem (o índice tem a linha na 194 e o achado tem o bloco na linha 5). Explica ainda por que a numeração da tabela ficou deslocada.

Não houve mudança de código desde a 1ª rodada. A tabela de revisões não ganhou nem perdeu linha, o que é compatível com a edição feita por trecho.

Recomendações (as mesmas da 1ª rodada, não aplicadas de propósito, e nenhuma bloqueia):
- `apps/api/test/material.int.test.ts:265`: reaproveitar `PDF_ACIMA_DO_TETO` no teste de 413 em vez de montar o mesmo buffer de novo.
- `apps/api/src/material/recebimento.ts`: escrever no comentário que o `parts` é uma defesa redundante, porque nenhum teste pela API consegue provar esse teto sozinho. A observação já está no documento da correção. Fica para uma tarefa que mexa nesse arquivo.
