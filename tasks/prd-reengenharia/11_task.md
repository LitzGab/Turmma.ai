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

- [ ] 11.1 — Caracterização, num commit antes: `ipParaRegistro` (que não tem teste hoje) e os casos de `login.service.test.ts`
- [ ] 11.2 — `sessao/origem-da-requisicao.ts` (`OrigemDaRequisicao`, `ResultadoDoLogin`, `ipParaRegistro`) e
  `sessao/identificadores-do-login.ts` (`BYTES_DO_REFRESH`, `hashDoRefresh`, `normalizarEmail`)
- [ ] 11.3 — `etapaDoLogin` vai para `conclusao-de-login.ts`; os importadores trocam o caminho; `login.service.ts` não reexporta
- [ ] 11.4 — Testes: os de unidade divididos pelos arquivos novos, e os dois `it` de quem importa o `login.service`

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

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: [caminho do arquivo que tem a cláusula]
teste: [caminho do teste] › [nome do caso]
  [linha de contexto, que fica]
- [a cláusula que sai]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->

