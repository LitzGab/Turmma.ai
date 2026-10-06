# Correção — o `npm audit` da esteira caiu por `proxy-addr` 2.0.7 e `multer` 2.3.0 em dependência de produção da API

**Origem:** esteira run 37421284203, job `verificar`, na `develop`, sobre `d581da6` (tarefa 3.0 da F3)
**Subagentes obrigatórios:** `infra-guardian` (dependência da borda HTTP da API: o Express que recebe toda requisição
e o multipart do upload de material), `revisor-geral` (a correção altera 7 arquivos fora de `tasks/`, contando o `TODO.md`)

## Sintoma

Todos os testes passaram; o que caiu foi o passo "dependência de produção com vulnerabilidade grave (npm audit)"
(`tools/ci/etapas-de-guarda.ts`, `npm audit --audit-level=high --omit=dev`), por dois avisos publicados depois da
última esteira verde:

```
proxy-addr  1.1.0 - 2.0.7   Severity: critical
proxy-addr vulnerable to IP spoofing via IPv4-mapped IPv6 trust subnet - GHSA-jqcg-44mw-7w3h
node_modules/proxy-addr   (express 5.2.1, via @nestjs/platform-express 12.0.1)

multer  2.2.0 - 2.3.0   Severity: moderate
multer vulnerable to Denial of Service via orphaned disk writes on aborted uploads - GHSA-3pph-fpjx-jg34
(multer fixado em 2.3.0 no "overrides" da raiz)

3 vulnerabilities (2 moderate, 1 critical)
```

## Causa

Nenhuma mudança nossa: a base de avisos do npm ganhou dois avisos para versões que o lockfile fixa.

- `proxy-addr` 2.0.7 vem do `express` 5.2.1 (faixa `^2.0.7`), e o lockfile o prende em 2.0.7. A 2.0.8 corrige e cabe na
  faixa: basta o lockfile.
- `multer` estava preso em 2.3.0 pelo `overrides` da raiz desde a tarefa 1.0 do F0 (o `@nestjs/platform-express` 12.0.1
  declara `multer` 2.2.0 exato). A 2.4.0 corrige.

**O aviso do `proxy-addr` alcançava o nosso uso?** Não. Ele trata da comparação de sub-rede confiável (`trust proxy`
com sub-rede) quando o endereço chega como IPv6 mapeado (`::ffff:a.b.c.d`). A API nunca liga o `trust proxy` do
Express (não há `app.set('trust proxy', …)` em `apps/` nem em `packages/`; o padrão do Express é não confiar em
ninguém) e não lê `req.ip`/`req.ips`. O IP do cliente — chave do rate limit anônimo e do login, e o que o registro de
acesso grava — sai de `ipDaRequisicao` (`packages/nucleo/src/limite/guarda-limite.ts`), que aceita o `X-Forwarded-For`
só quando a conexão vem da borda, por `ProxiesConfiaveis.ehConfiavel`, que compara contra um conjunto de IPs exatos (não
sub-rede), normalizados com o IPv6 mapeado virando IPv4 (`normalizarIp`, em `chaves.ts`). O caso do aviso já tem teste
nosso: `proxies-confiaveis.test.ts` (`ehConfiavel('::ffff:10.0.0.2')`) e `chaves.test.ts` (`normalizarIp('::ffff:…')`,
e o `ipDoCliente` com conexão mapeada fora da borda ignorando o cabeçalho). Por isso não entra teste novo para ele: o
código que decide o IP não passa pelo `proxy-addr`.

**O aviso do `multer` alcançava?** Também não: ele trata de escrita órfã em disco (`DiskStorage`) quando o upload é
abortado. O único upload da API (`apps/api/src/material/recebimento.ts`) usa o armazenamento em memória padrão do
`FileInterceptor`, com teto de tamanho, de arquivos, de campos e de partes enquanto o corpo chega.

**O que a primeira tentativa quebrou (achado do `test-engineer`, 1ª rodada).** A menor mudança — só o override do
`multer` em 2.4.0, com o `@nestjs/platform-express` em 12.0.1 — fecha o audit mas troca 400 por 500. O
`transformException` do Nest 12.0.1 traduz o erro do `multer` pela **mensagem**, e a 2.4.0 mudou a de
`LIMIT_UNEXPECTED_FILE` de `Unexpected field` para `Unexpected file field`. O arquivo enviado em outro campo que não
`arquivo` passava sem tradução, caía no filtro global e saía 500 `ERRO_INTERNO` com `logger.error` (regra 00, item 9,
e um 5xx sob demanda para o alerta de taxa de erro). Por isso o `@nestjs/platform-express` subiu.

## Teste que reproduz

1. **A conferência da esteira**, o passo do `ci:verificar`: `npm audit --audit-level=high --omit=dev`, na raiz.
   - **Antes (vermelho), sobre `d581da6`:** a saída do sintoma, `3 vulnerabilities (2 moderate, 1 critical)`, código 1.
   - **Depois (verde):** `found 0 vulnerabilities`, código 0.
2. **O recebimento do multipart**, `apps/api/test/material.int.test.ts` › "o arquivo" › tabela "`$caso`: `ENTRADA_INVALIDA`
   no recebimento, e nada é gravado nem lido". Cada caso fixa 400 `ENTRADA_INVALIDA`, extração não chamada, nenhuma linha
   em `material` e nenhuma auditoria de envio nem de recusa. O helper `enviarMaterial`
   (`apps/api/test/material-de-teste.ts`) ganhou `campoDoArquivo` e `copias`. O que cada caso prova, e o vermelho de cada
   um:

   | Caso | Prova | Vermelho comprovado |
   |---|---|---|
   | o arquivo em outro campo | o erro do `multer` traduzido pelo código | override do `multer` em 2.4.0 com o Nest 12.0.1: `{ status: 500, codigo: 'ERRO_INTERNO' }` |
   | dois arquivos no campo `arquivo` | um arquivo por pedido (o `single` do interceptor) | — (tirar só o `files: 1` não o derruba; o `single` também recusa) |
   | dois arquivos num pedido sem licença | o `files: 1`: na 2.4.0 o arquivo que o `fileFilter` descarta não conta no `maxCount` | sem `files: 1`: `{ status: 422, MATERIAL_SEM_LICENCA }`, com auditoria de recusa |
   | dez campos e o arquivo (exatamente as `parts`) | o recebimento deixa passar, e quem recusa é o contrato estrito | — (fixa o comportamento novo da 2.4.0) |
   | onze campos e o arquivo acima do teto | o `fields` (com o `parts`) para o pedido no campo, antes do arquivo | sem `fields` e `parts`: 413. Sem só o `fields`, o `parts` pega a 12ª parte e a resposta continua 400 |
   | campo de texto acima de 2 KiB e o arquivo acima do teto | o `fieldSize` para o pedido no campo, antes do arquivo | sem `fieldSize`: 413 |

   Nos dois últimos, o arquivo vai um byte acima de `MAXIMO_DE_BYTES_DO_MATERIAL` porque o contrato estrito recusaria
   os dois pedidos do mesmo jeito: o arquivo grande é o que distingue "parou no recebimento" (400) de "recebeu tudo e o
   contrato recusou" (413 no `fileSize`), que é a regra 80, item 3. Cada teto foi tirado de `recebimento.ts`, um de cada
   vez, e restaurado: o arquivo de produção não mudou. Com a correção, os 41 testes do arquivo passam.

   O `parts` sozinho não tem como ser provado pela API: com `files: 1` e `fields: 10`, ele nunca é o primeiro a disparar,
   e é defesa redundante.

## Correção

- `apps/api/package.json` e `apps/realtime/package.json`: `@nestjs/platform-express` 12.0.1 → 12.1.2. A 12.1.2 declara
  `multer` 2.4.0 exato e traduz o erro do `multer` pelo `code`, não pela mensagem. `@nestjs/common` e `@nestjs/core`
  ficam em 12.0.1: a faixa de peer da 12.1.2 é `^12.0.0`, e o que ela importa de `@nestjs/common/internal`
  (`isPlainObject`, `addLeadingSlash`, `stripEndSlash`) existe na 12.0.1.
- `package.json` da raiz: sai o `overrides` do `multer`. Ele só existia para fixar a versão que o Nest 12.0.1 não
  trazia; com a 12.1.2 trazendo a 2.4.0, ele ficaria redundante e pediria edição à mão no próximo aviso.
- `package-lock.json`: `proxy-addr` 2.0.7 → 2.0.8 (dentro da faixa do `express`), `multer` 2.3.0 → 2.4.0,
  `@nestjs/platform-express` 12.0.1 → 12.1.2. A 2.4.0 tirou a dependência `concat-stream`, e com ela saíram
  `concat-stream`, `readable-stream`, `safe-buffer`, `string_decoder`, `typedarray` e `util-deprecate`; o `buffer-from`,
  que só o `concat-stream` usava em produção, passou a `dev`.

O que muda do `@nestjs/platform-express` 12.0.1 para a 12.1.2 (diff do pacote publicado e notas de v12.0.2 a v12.1.2):

- o erro do `multer` é traduzido pelo `code`, e passa a cobrir `LIMIT_FIELD_ARRAY_INDEX` e `INVALID_FIELD_NAME` (400);
- os `limits` do módulo e do interceptor são mesclados chave a chave (nós só declaramos no interceptor: sem efeito);
- o prefixo global é normalizado (barra no começo, sem barra no fim);
- a versão por cabeçalho `Accept` é lida de outro jeito (não usamos versionamento por cabeçalho);
- o `+json` (`application/problem+json`) conta como JSON na resposta.

O que muda no `multer` 2.4.0 e toca o nosso uso (notas da versão, expressjs/multer v2.4.0):

- os limites são validados na construção, e `fileSize` não inteiro é recusado (os nossos são inteiros);
- o pedido com exatamente `limits.parts` partes passa a ser aceito: o teste dos dez campos fixa que o contrato estrito
  recusa;
- o `fileFilter` que descarta o arquivo deixa de consumir o `maxCount`: o teste dos dois arquivos sem licença fixa que
  `files: 1` continua recusando;
- a mensagem de `LIMIT_UNEXPECTED_FILE` mudou: era o 500 acima, fechado pelo Nest 12.1.2.

O resto (opção `streamHandler`, `flush` no disco) não alcança o armazenamento em memória que usamos.

O `npm audit` sem `--omit=dev` ainda lista avisos em dependência só de desenvolvimento (`brace-expansion`,
`source-map-js`, e o `esbuild` antigo que o `drizzle-kit` puxa). Eles ficam fora daqui: a conferência da esteira é só
de produção (`--omit=dev`) e não foi afrouxada nem alargada, e cada correção trata um defeito.

`TODO.md`, em "Infra e operação": entra a linha para alinhar os pacotes `@nestjs/*` na mesma versão, recomendação do
`infra-guardian`. Hoje o `platform-express` está em 12.1.2 e os outros em 12.0.1.

**Rodada que falta na tabela de revisões.** A primeira rodada do `test-engineer` terminou às 06:32:05 com REPROVADO
(o override do `multer` sem subir o Nest trocava 400 por 500, e os tetos do recebimento estavam sem teste). O hook a
registrou na tabela, mas a linha se perdeu quando este documento foi reescrito por inteiro depois dela. Ela continua
em `tasks/correcoes/achados/indice.md` (linha 194) e no bloco dela em `achados/2026-10-06-audit-proxy-addr-e-multer.md`.
Por isso a tabela numera como 1ª e 2ª o que foram a 2ª e a 3ª rodada do `test-engineer`. A partir daí, o documento só
foi editado por trecho.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-06 06:35:25 | 2026-10-06 06:37:20 | `test-engineer` | 1 | REPROVADO | ada1ea693cf69b898 |
| 2026-10-06 06:39:11 | 2026-10-06 06:39:40 | `test-engineer` | 2 | APROVADO | a6e7f5e1c280512d8 |
| 2026-10-06 06:39:50 | 2026-10-06 06:40:42 | `infra-guardian` | 1 | APROVADO | a44dd2d9bedd39655 |
| 2026-10-06 08:13:44 | 2026-10-06 08:14:59 | `revisor-geral` | 1 | REPROVADO | ab58c64ef82d20769 |
| 2026-10-06 08:15:21 | 2026-10-06 08:15:37 | `revisor-geral` | 2 | APROVADO | a83beda71553f1dd9 |
