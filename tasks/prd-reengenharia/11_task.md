# Tarefa 11.0 — Os 2 ciclos de `login.service` somem

**Funcionalidade:** reengenharia · **Depende de:** nenhuma
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

O que 13 arquivos importam de `login.service.ts` sai para dois arquivos novos e para `conclusao-de-login.ts`: somem os
ciclos `login.service ↔ conclusao-de-login` e `login.service ↔ convite.service`, e só o controller e o módulo importam o
`LoginService`. O login não muda.

## Contexto necessário

- `onda-1a.md` §2, "T7", "Os ciclos (10.0 e 11.0)", item 11.0; `techspec.md` §5; `prd.md` RF10
- Regra 00 (camadas); a 16.0 depende desta, por mexer na mesma pasta
- `apps/api/src/sessao/login.service.ts`: exporta `OrigemDaRequisicao` (`:16`), `ResultadoDoLogin` (`:27`),
  `BYTES_DO_REFRESH` (`:52`), `normalizarEmail` (`:55`), `hashDoRefresh` (`:60`), `etapaDoLogin` (`:201`), `ipParaRegistro` (`:208`);
  importa `conclusao-de-login.ts` (`:4`) e `convite.service.ts` (`:5`), que o importam de volta
- Importadores fora do controller e do módulo: em `sessao/`, `conclusao-de-login.ts`, `renovacao.service.ts`,
  `matricula.service.ts`, `externa/externa.service.ts`, `convite.service.ts`, `saida.service.ts`, `mfa.service.ts`,
  `troca-de-escola.service.ts`; em `operacao/`, `entrada.service.ts`, `sessao.service.ts`, `segundo-fator.service.ts`

## Subtarefas

- [x] 11.1 — Caracterização, num commit antes: `ipParaRegistro` (que não tem teste hoje) e os casos de `login.service.test.ts`
- [x] 11.2 — `sessao/origem-da-requisicao.ts` (`OrigemDaRequisicao`, `ResultadoDoLogin`, `ipParaRegistro`) e
  `sessao/identificadores-do-login.ts` (`BYTES_DO_REFRESH`, `hashDoRefresh`, `normalizarEmail`)
- [x] 11.3 — `etapaDoLogin` vai para `conclusao-de-login.ts`; os importadores trocam o caminho; `login.service.ts` não reexporta
- [x] 11.4 — Testes: os de unidade divididos pelos arquivos novos, e os dois `it` de quem importa o `login.service`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sessao/origem-da-requisicao.ts`, `origem-da-requisicao.test.ts` | novo |
| `apps/api/src/sessao/identificadores-do-login.ts`, `identificadores-do-login.test.ts` | novo |
| `apps/api/src/sessao/conclusao-de-login.ts`, `conclusao-de-login.test.ts` | alterado, novo |
| `apps/api/src/sessao/login.service.ts`, `login.service.test.ts` | alterado |
| `apps/api/src/sessao/{renovacao,matricula,convite,saida,mfa,troca-de-escola}.service.ts` | alterado |
| `apps/api/src/sessao/externa/externa.service.ts` | alterado |
| `apps/api/src/operacao/{entrada,sessao,segundo-fator}.service.ts` | alterado |
| `apps/api/test/arquitetura.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova | Mutação |
|---|---|---|---|
| `normalizarEmail(' Ana@Escola.COM ')` → `'ana@escola.com'`, do arquivo novo | unidade | o mesmo valor depois de mover | `toLowerCase` vira `toLocaleLowerCase('tr')` |
| `hashDoRefresh` dá o SHA-256 hex conhecido, e `BYTES_DO_REFRESH` é 32 | unidade | a sessão gravada antes continua achada | codificação `base64` |
| `ipParaRegistro(IP_DESCONHECIDO)` → `IP_NAO_LIDO`, e o IP lido passa igual (novo) | unidade | o registro de acesso grava o mesmo IP | devolver o `ip` sem a troca |
| `etapaDoLogin` nos quatro casos de hoje, de `conclusao-de-login.ts` | unidade | professor `pronta`, coordenador ao MFA, dois vínculos a `escolher` | inverter `mfaAtivo ? 'mfa' : 'configurar_mfa'` |
| `login.service.ts` não exporta nenhum dos sete nomes (`Object.keys` do módulo, e leitura do arquivo para os tipos) | unidade | "sem reexportar" | `export { hashDoRefresh } from './identificadores-do-login.js'` |
| Quem importa `login.service.js` fora de teste é exatamente `login-email.controller.ts` e `sessao.module.ts` (`toEqual`) | unidade | os dois ciclos sumiram | devolver o import de `hashDoRefresh` a `conclusao-de-login.ts` |
| Login por e-mail, matrícula, externa, MFA, renovação e troca de escola verdes antes e depois | integração | o login não muda | nenhuma |

Sem isolamento novo (nenhuma consulta muda), concorrência nem log.

## Como testar

- Unidade: copie `apps/api/src/sessao/login.service.test.ts › o e-mail sai sem espaço nas pontas e em minúsculas, como a
  conta (citext) o compara` e `› o refresh vira SHA-256 em hex, que é o que a sessão guarda`; os de `etapaDoLogin`
  (`› um professor só: pronta` e vizinhos) mudam só o import
- "Quem importa": `apps/api/test/arquitetura.test.ts › fora de teste, só o painel.service.ts o importa`, com
  `arquivosDoRepositorio()` e `semComentarios`
- Integração: `apps/api/test/{login-email,sessao-matricula,sessao-externa,mfa,renovacao,troca-de-escola}.int.test.ts`
- Isolado: `npx vitest run --project unidade apps/api/src/sessao/` e `npx vitest run --project integracao <arquivo>`
- `IP_DESCONHECIDO` vem de `@educa/nucleo`; `IP_NAO_LIDO` (`'0.0.0.0'`, `login.service.ts:49`) vai junto para `origem-da-requisicao.ts`
- **Tarefa mecânica** (`tasks.md`, "Tarefa mecânica"): revisores só os do cabeçalho. Trocar o caminho de import é por
  script, nunca à mão: ts-morph numa pasta de rascunho (`npm i --prefix .processo/ts-morph ts-morph@<exata>`, como a
  R7 fez com o depcruise, sem tocar o `package.json`) e `node .processo/mover.ts`, com o mapa "antigo → novo"; o script
  e a pasta ficam no `.processo/` da linha, fora do commit.

## Fora do escopo desta tarefa

A pasta `sessao/` em subpastas (34.0) e a regra do depcruise (12.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| 11.1 não tem commit próprio: a caracterização de `ipParaRegistro` (e os casos de `login.service.test.ts`) foi rodada verde contra o código antigo, num arquivo de rascunho apagado em seguida, e o teste definitivo (`origem-da-requisicao.test.ts`) entra no commit único da tarefa | O hook exige carimbo do portão e revisão aprovada em todo commit `(tarefa N.0)`, e a tarefa mecânica fecha em um commit só | `tasks.md`, "Tarefa mecânica" (a divergência da 36.0 e da 97.0 já a diz) |
| `arquitetura.test.ts` ganha o `describe` "só o controller e o módulo importam o login.service", provisório até a 12.0, no lugar do `it` solto do texto da tarefa; ele varre o texto sem comentário e reprova também reexportação e `import()` | O `it` pedido ("fora de teste, só o X o importa") ganha o par que prova a varredura, como a 10.0 e o painel | `onda-1a.md` §2, T7, "A trava (12.0)": o depcruise o substitui |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/api/src/sessao/identificadores-do-login.ts
teste: apps/api/src/sessao/identificadores-do-login.test.ts › o e-mail sai sem espaço nas pontas e em minúsculas, como a conta citext o compara
- return email.trim().toLowerCase()
+ return email.trim().toLocaleLowerCase('tr')
```

```mutacao
arquivo: apps/api/src/sessao/identificadores-do-login.ts
teste: apps/api/src/sessao/identificadores-do-login.test.ts › o e-mail sai sem espaço nas pontas e em minúsculas, como a conta citext o compara
- return email.trim().toLowerCase()
+ return email.toLowerCase()
```

```mutacao
arquivo: apps/api/src/sessao/identificadores-do-login.ts
teste: apps/api/src/sessao/identificadores-do-login.test.ts › o refresh vira SHA-256 em hex, que é o que a sessão guarda, e tem 32 bytes sorteados
- .digest('hex')
+ .digest('base64')
```

```mutacao
arquivo: apps/api/src/sessao/identificadores-do-login.ts
teste: apps/api/src/sessao/identificadores-do-login.test.ts › o refresh vira SHA-256 em hex, que é o que a sessão guarda, e tem 32 bytes sorteados
- export const BYTES_DO_REFRESH = 32
+ export const BYTES_DO_REFRESH = 16
```

```mutacao
arquivo: apps/api/src/sessao/origem-da-requisicao.ts
teste: apps/api/src/sessao/origem-da-requisicao.test.ts › o endereço que não foi lido vira o não roteável, e o lido passa igual
- return ip === IP_DESCONHECIDO ? IP_NAO_LIDO : ip
+ return ip
```

```mutacao
arquivo: apps/api/src/sessao/origem-da-requisicao.ts
teste: apps/api/src/sessao/origem-da-requisicao.test.ts › o endereço que não foi lido vira o não roteável, e o lido passa igual
- return ip === IP_DESCONHECIDO ? IP_NAO_LIDO : ip
+ return IP_NAO_LIDO
```

```mutacao
arquivo: apps/api/src/sessao/origem-da-requisicao.ts
teste: apps/api/src/sessao/origem-da-requisicao.test.ts › o endereço que não foi lido vira o não roteável, e o lido passa igual
- const IP_NAO_LIDO = '0.0.0.0'
+ const IP_NAO_LIDO = '0.0.0.1'
```

```mutacao
arquivo: apps/api/src/sessao/conclusao-de-login.ts
teste: apps/api/src/sessao/conclusao-de-login.test.ts › usuário ativo em mais de uma escola: escolher, com ou sem coordenação entre elas
- if (usuarios.length > 1) return 'escolher'
+ if (usuarios.length > 2) return 'escolher'
```

```mutacao
arquivo: apps/api/src/sessao/conclusao-de-login.ts
teste: apps/api/src/sessao/conclusao-de-login.test.ts › um professor só: pronta
- if (usuarios[0]?.papel === 'coordenador' && !mfaCumprido) return mfaAtivo ? 'mfa' : 'configurar_mfa'
+ if (usuarios[0]?.papel !== 'coordenador' && !mfaCumprido) return mfaAtivo ? 'mfa' : 'configurar_mfa'
```

```mutacao
arquivo: apps/api/src/sessao/conclusao-de-login.ts
teste: apps/api/src/sessao/conclusao-de-login.test.ts › um coordenador só, com o segundo fator já cumprido nesta entrada: pronta
- if (usuarios[0]?.papel === 'coordenador' && !mfaCumprido) return mfaAtivo ? 'mfa' : 'configurar_mfa'
+ if (usuarios[0]?.papel === 'coordenador') return mfaAtivo ? 'mfa' : 'configurar_mfa'
```

```mutacao
arquivo: apps/api/src/sessao/conclusao-de-login.ts
teste: apps/api/src/sessao/conclusao-de-login.test.ts › um coordenador só: configurar o MFA, ou informá-lo quando já tem; nunca pronta
- return mfaAtivo ? 'mfa' : 'configurar_mfa'
+ return mfaAtivo ? 'configurar_mfa' : 'mfa'
```

```mutacao
arquivo: apps/api/src/sessao/login.service.ts
teste: apps/api/src/sessao/login.service.test.ts › o módulo só exporta o LoginService
- import { normalizarEmail } from './identificadores-do-login.js'
+ import { normalizarEmail } from './identificadores-do-login.js'
+ export { hashDoRefresh } from './identificadores-do-login.js'
```

```mutacao
arquivo: apps/api/src/sessao/login.service.ts
teste: apps/api/src/sessao/login.service.test.ts › nenhuma exportação do arquivo cita um dos sete nomes, que os tipos não aparecem em Object.keys
- import { normalizarEmail } from './identificadores-do-login.js'
+ import { normalizarEmail } from './identificadores-do-login.js'
+ export type { OrigemDaRequisicao } from './origem-da-requisicao.js'
```

```mutacao
arquivo: apps/api/src/sessao/login.service.ts
teste: apps/api/src/sessao/login.service.test.ts › nenhuma exportação do arquivo cita um dos sete nomes, que os tipos não aparecem em Object.keys
- import { normalizarEmail } from './identificadores-do-login.js'
+ import { normalizarEmail } from './identificadores-do-login.js'
+ export * from './origem-da-requisicao.js'
```

```mutacao
arquivo: apps/api/src/sessao/login.service.ts
teste: apps/api/src/sessao/login.service.test.ts › nenhuma exportação do arquivo cita um dos sete nomes, que os tipos não aparecem em Object.keys
- import { normalizarEmail } from './identificadores-do-login.js'
+ import { normalizarEmail } from './identificadores-do-login.js'
+ export type {
+   OrigemDaRequisicao,
+ } from './origem-da-requisicao.js'
```

```mutacao
arquivo: apps/api/src/sessao/conclusao-de-login.ts
teste: apps/api/test/arquitetura.test.ts › fora de teste, só o login-email.controller.ts e o sessao.module.ts o importam
- import { BYTES_DO_REFRESH, hashDoRefresh } from './identificadores-do-login.js'
+ import { BYTES_DO_REFRESH } from './identificadores-do-login.js'
+ import { hashDoRefresh } from './login.service.js'
```

```mutacao
arquivo: apps/api/src/sessao/convite.service.ts
teste: apps/api/test/arquitetura.test.ts › fora de teste, só o login-email.controller.ts e o sessao.module.ts o importam
- import { normalizarEmail } from './identificadores-do-login.js'
+ import { normalizarEmail } from './login.service.js'
```

```mutacao
arquivo: apps/api/src/operacao/sessao.service.ts
teste: apps/api/test/arquitetura.test.ts › fora de teste, só o login-email.controller.ts e o sessao.module.ts o importam
- import { ipParaRegistro } from '../sessao/origem-da-requisicao.js'
+ import { ipParaRegistro } from '../sessao/login.service.js'
```

```mutacao
arquivo: apps/api/src/sessao/externa/externa.service.ts
teste: apps/api/test/arquitetura.test.ts › fora de teste, só o login-email.controller.ts e o sessao.module.ts o importam
- import { ipParaRegistro, type OrigemDaRequisicao } from '../origem-da-requisicao.js'
+ import { ipParaRegistro, type OrigemDaRequisicao } from '../login.service.js'
```

```mutacao
arquivo: apps/api/test/arquitetura.test.ts
teste: apps/api/test/arquitetura.test.ts › a varredura reprova quem mais o importa, reexporta ou carrega por import dinâmico, e deixa o teste e o comentário passarem
  arquivos
- .filter((arquivo) => !deTeste(arquivo.caminho))
  .filter((arquivo) => IMPORTA_O_LOGIN_SERVICE.test(semComentarios(arquivo.texto)))
```

```mutacao
arquivo: apps/api/test/arquitetura.test.ts
teste: apps/api/test/arquitetura.test.ts › a varredura reprova quem mais o importa, reexporta ou carrega por import dinâmico, e deixa o teste e o comentário passarem
- .filter((arquivo) => IMPORTA_O_LOGIN_SERVICE.test(semComentarios(arquivo.texto)))
+ .filter((arquivo) => IMPORTA_O_LOGIN_SERVICE.test(arquivo.texto))
```

```mutacao
arquivo: apps/api/test/arquitetura.test.ts
teste: apps/api/test/arquitetura.test.ts › a varredura reprova quem mais o importa, reexporta ou carrega por import dinâmico, e deixa o teste e o comentário passarem
- const IMPORTA_O_LOGIN_SERVICE = /\blogin\.service\.js['"]/
+ const IMPORTA_O_LOGIN_SERVICE = /\blogin\.service\.ts['"]/
```

```mutacao
arquivo: apps/api/test/arquitetura.test.ts
teste: apps/api/test/arquitetura.test.ts › a varredura reprova quem mais o importa, reexporta ou carrega por import dinâmico, e deixa o teste e o comentário passarem
  .map((arquivo) => arquivo.caminho)
- .sort()
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer 1ª | Sete importadores (`renovacao`, `matricula`, `saida`, `mfa`, `troca-de-escola`, `operacao/entrada`, `operacao/segundo-fator`) sem bloco em "Mutações" | Recusada: troca de caminho de import não é cláusula nova (o próprio revisor diz que não é bloqueante), e a varredura com `toEqual` do `arquitetura.test.ts` pega qualquer um deles |
| test-engineer 1ª | Regex `/\blogin\.service\.js['"]/` de `arquitetura.test.ts:1432` casaria `outro-login.service.js` e deixaria passar import sem extensão | A 12.0 (regra do depcruise), que substitui o `describe` provisório; linha já escrita no `TODO.md` |
| test-engineer 1ª | A linha 1 da tabela de testes cita `' Ana@Escola.COM '`, mas o teste usa `'  Camila@Escola.Invalid '` e `'INES@ESCOLA.INVALID'` | Recusada: o teste é mais forte que o texto, e o revisor mesmo diz que "o teste é melhor"; ajustar a tabela é editar o documento para acomodar o resultado |
| test-engineer 2ª | A regex de `login.service.test.ts:16` não pega `export default <nome>` nem `export = <nome>` | A 12.0 (depcruise) substitui a varredura provisória; linha já escrita no `TODO.md`. Hoje nenhum dos dois aparece e `Object.keys` pega o `export default` de valor |
| test-engineer 2ª | O filtro `/^export\s+\*/` de `login.service.test.ts:18` repete o que a regex já separa; poderia ser caso à parte | Recusada: só muda o nome do vermelho, e o teste é provisório até a 12.0 |

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->


## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-22 18:06:55 | 2026-10-22 18:07:52 | `revisor-geral` | 1 | APROVADO | a03b93e403dd07daa |
| 2026-10-22 18:06:52 | 2026-10-22 18:10:13 | `test-engineer` | 1 | APROVADO | ad9e8065f6ec63106 |
| 2026-10-22 18:15:42 | 2026-10-22 18:16:04 | `revisor-geral` | 2 | APROVADO | a96b2af2650ebc89a |
| 2026-10-22 18:15:35 | 2026-10-22 18:16:17 | `test-engineer` | 2 | APROVADO | a4bfb6118c723918e |
