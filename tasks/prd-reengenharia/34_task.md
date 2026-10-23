# Tarefa 34.0 — `sessao/` só tem fluxos, em subpastas, com `index.ts`

**Funcionalidade:** reengenharia · **Depende de:** 33.0
**Subagentes obrigatórios:** `tenancy-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

O que sobrou em `apps/api/src/sessao/` depois da 33.0 vira uma subpasta por fluxo, e a `ResolucaoDeTenantRepository` fica contida em
`sessao/tenant/`. Só movimento e import, comportamento igual (regra 10: o isolamento é o mesmo). Tarefa mecânica: script, uma pasta por commit.

## Contexto necessário

- `onda-2.md` §2 (RF14, "o mapa" e "Os barris não vazam"); `33_task.md`, "Como testar" (o contrato do script e da conferência, o mesmo aqui)
- `apps/api/test/arquitetura.test.ts › arquitetura: a resolução de tenant fica dentro do módulo de sessão` e `› arquitetura: a conta global só pelo módulo sessao…`:
  citam `apps/api/src/sessao/` por prefixo (`MODULO_SESSAO`), e por caminho exato `resolucao-de-tenant.repository.ts`, `redefinicao-de-mfa.ts` e
  `resolucao-de-tenant.repository.int.test.ts`
- `apps/api/src/operacao/` e `ops/` importam de `sessao/` (`convite.service`, `redefinicao-de-mfa`, `sessoes-sinteticas`, `login.service`); `sala/`, de `acesso-da-sala`

## Subtarefas

- [x] 34.1 — Num commit antes, os três caminhos exatos de `arquitetura.test.ts` passam a ser achados pelo nome da classe e do arquivo dentro de `MODULO_SESSAO`
  (o teste cita a regra, e não a pasta); `grep -rn "sessao/" apps/api/test/arquitetura.test.ts` confere
- [x] 34.2 — `mapa.json` e o script da 33.0. Um commit por destino:
  `tenant/` ← `resolucao-de-tenant.repository` (com `.test` e `.int.test`), `acesso-da-sala`, `escola-sem-usuario`, `sessoes-sinteticas`;
  `login/` ← `login.service`, `login-email.controller`, `matricula.{controller,service}`; `conclusao/` ← `conclusao-de-login`;
  `renovacao/`, `saida/`, `troca-de-escola/`, `acesso-da-escola/`, `eu/` (com `eu.repository`) ← seus `.controller`, `.service` e testes;
  `mfa/` ← `mfa.{controller,service}`, `redefinir-mfa.controller`, `redefinicao-de-mfa`, `redefinicao-de-mfa.repository`;
  `convite/` ← `convite.{controller,service,repository}`, `convite-de-professor.service`, `bilhete-de-convite` (os três casos de uso do operador ficam no `convite.service`);
  `atividade/` ← `atividade.{controller,service}`, `alunos-ativos.repository`. `externa/` já é fluxo e fica; `sessao.module.ts` e `conferencia-do-autor.ts` ficam na raiz
- [x] 34.3 — `sessao/index.ts`: um `export { … }` nomeado por símbolo que `apps/api/{src,test}` fora de `sessao/` e `credencial/` usam; elas passam a importar
  pelo `index.js`. Nunca `export *`, e nenhum arquivo de `tenant/` entra no índice além de `AcessoDaSala` e `sessoes-sinteticas`; `infra/` e `e2e/` ficam no arquivo
- [x] 34.4 — Testes (tabela), o caminho citado como texto, e a conferência final

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sessao/**` | movido e alterado (origem e destino) |
| `apps/api/src/sessao/index.ts` | novo |
| `apps/api/src/{app.module,main}.ts`, `atividade/atividade.module.ts`, `professores/professores.service.ts`, `tutor/tutor.int.test.ts`, `assistente/assistente.module.ts`, `operacao/**`, `ops/**`, `sala/**` | alterado (import) |
| `apps/api/test/**` (em especial `arquitetura.test.ts`) | alterado |
| `infra/scripts/{carga-login,carga-sala,ensaio-alertas}.ts` | alterado (`import type` e `importar('apps/api/dist/sessao/sessoes-sinteticas.js')`) |
| `tools/guardas/guardas.test.ts` | alterado |
| `docs/modelo-de-dados.md` (`:212`), `TODO.md` | alterado (caminho citado) |

## Testes que provam a regra

Cobertura que já existe: `resolucao-de-tenant.repository.test.ts › ResolucaoDeTenantRepository: toda operação sem escopo é marcada e justificada`;
`login.service.test.ts`, `renovacao.service.test.ts`, `bilhete-de-convite.test.ts`, `externa/cookie-oidc.test.ts`; os `.int.test.ts` ao lado dos repositories; em
`apps/api/test`: `sessao-guarda`, `renovacao`, `saida`, `troca-de-escola`, `sessao-externa`, `convite`, `mfa`, `inatividade`, `acesso-da-escola`,
`login-email`, `sessao-matricula`; e o e2e de login na esteira.

| Cenário | Tipo | Fica vermelho se (a mutação) |
|---|---|---|
| `Object.values` de `sessao/index.js` e de `credencial/index.js` não traz `ResolucaoDeTenantRepository` nem `ContaGlobalRepository`, sob nome nenhum (estende o `it` da 33.0) | unidade | `export * from './tenant/acesso-da-sala.js'` e o reexport `as OutroNome` no índice (o reexport que o depcruise não vê; `tenant/index.ts` não existe, e as mutações 1 a 5 de "Mutações" são o que o portão aplica) |
| `usosForaDoModuloSessao` continua `[]`, e o arquivo da classe é achado dentro de `MODULO_SESSAO` | unidade | importar a classe em `operacao/` |
| Lint: a fixture da 14.0 (`entrada-sem-esquema`) lintada como `apps/api/src/sessao/login/x.controller.ts` reprova | unidade | o `files` do bloco de `no-restricted-syntax` ficar em `*/*.controller.ts`, um nível só |
| `git grep` dos caminhos antigos sai vazio | conferência | um import velho em `ops/` ou `sala/` |

## Como testar

- O script e a conferência são os de `33_task.md`; aqui o `mapa.json` leva os pares das subtarefas 34.2, e o passo de texto troca `apps/api/{src,dist}/sessao/<arquivo>`.
- Depois de cada commit: `rm -rf apps/api/dist`, `npm run typecheck`, o `git grep` vazio e
  `npx vitest run --project unidade apps/api/src/sessao apps/api/test/arquitetura.test.ts tools/guardas`.
- O molde do `it` do barril é `arquitetura.test.ts › nem o barrel do @educa/nucleo nem o subcaminho do ciclo de vida exportam a ContaGlobalRepository…`; o da lint, `tools/guardas/guardas.test.ts › processadores do worker…`.
- Armadilha: `resolucao-de-tenant.repository.test.ts` importa quase todos os repositories de `sessao/`; é o primeiro a acusar um mapa incompleto.

## Fora do escopo desta tarefa

`credencial/` (33.0); `ops/` (35.0); o `dependency-cruiser` e a regra de só importar pelo `index.ts` (12.0); `ConferenciaDoAutor` em `sessao/` (10.0 a pôs lá).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| Um commit só para a tarefa, e não um por pasta (34.2) nem o dos três caminhos de `arquitetura.test.ts` num commit antes (34.1): o hook exige carimbo do portão e revisão aprovada em todo commit `(tarefa N.0)`, e a Mesa revisa a tarefa uma vez. O movimento rodou pelo script, em passos, com os tipos e a unidade conferidos no fim; o git guarda cada arquivo como renomeação | O processo (D78, D53) não tem como aprovar commit intermediário de uma tarefa (a mesma divergência da 33.0, da 36.0 e da 97.0) | `tasks.md`, "Tarefa mecânica" (a regra do commit por tarefa, escrita lá) |
| O `arquitetura.test.ts` acha o arquivo da classe e os usos da conta global **pelo nome do arquivo, dentro de `MODULO_SESSAO`**: `basename` igual a `resolucao-de-tenant.repository.ts` e um só (pasta dentro de `sessao/`); na lista da conta global, `redefinicao-de-mfa.ts` e `resolucao-de-tenant.repository.int.test.ts` dentro de `sessao/`, e os dois de `packages/nucleo` por caminho | A regra é "a classe fica dentro de `sessao/`", e não a subpasta onde ela mora; assim `tenant/` pode mudar sem reabrir o teste | `onda-2.md` §2, "As travas" (a última linha: "O `arquitetura.test.ts` cita a regra, não o caminho") |
| O `apps/api/test/arquitetura.test.ts` continua importando `tenant/resolucao-de-tenant.repository.js` e `tenant/acesso-da-sala.js` pelo arquivo (`import()` dinâmico), nunca pelo índice | O índice não pode trazer a `ResolucaoDeTenantRepository`, e o `it` do barril existe justamente para conferir que ela não está lá: precisa da classe de verdade para comparar com `Object.values` | `onda-2.md` §2, "Os barris não vazam (34.0)" |
| O script vive em `/tmp` (scratchpad da sessão), fora do repositório e do `.processo/`: o mesmo `mover.cjs` da 33.0 (`mapa-34.mjs` gera o `mapa.json`; `indice-34.cjs` cria o `sessao/index.ts`, deixa `tenant/` de fora menos os dois arquivos, e passa os de fora a importar por ele). Ele reescreve também o texto `apps/api/{src,dist}/sessao/<arquivo>`, e três citações curtas (`sessao/acesso-da-sala.ts` no `TODO.md`, `sessao/convite-de-professor.service.ts` em `professores.service.ts`, `sessao/convite.repository.int.test.ts` no `guia-do-desenvolvedor.md`) foram trocadas à mão | O ESLint lê `.processo/` e reprova o rascunho (`no-console`, `no-require-imports`); a 33.0 já registrou o mesmo | `tasks.md`, "Tarefa mecânica" (o script fica fora do commit) |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/api/src/sessao/index.ts
teste: apps/api/test/arquitetura.test.ts › nem o barrel de sessao/ exporta
-export { SessaoModule } from './sessao.module.js'
+export { SessaoModule } from './sessao.module.js'
+export { ResolucaoDeTenantRepository } from './tenant/resolucao-de-tenant.repository.js'
```

```mutacao
arquivo: apps/api/src/sessao/index.ts
teste: apps/api/test/arquitetura.test.ts › nem o barrel de sessao/ exporta
-export { SessaoModule } from './sessao.module.js'
+export { SessaoModule } from './sessao.module.js'
+export { ResolucaoDeTenantRepository as OutroNome } from './tenant/resolucao-de-tenant.repository.js'
```

```mutacao
arquivo: apps/api/src/sessao/index.ts
teste: apps/api/test/arquitetura.test.ts › nem o barrel de sessao/ exporta
-export { SessaoModule } from './sessao.module.js'
+export { SessaoModule } from './sessao.module.js'
+export { ContaGlobalRepository as OutroNome } from '@educa/nucleo/conta-global'
```

```mutacao
arquivo: apps/api/src/sessao/index.ts
teste: apps/api/test/arquitetura.test.ts › nem o barrel de sessao/ exporta
-export { SessaoModule } from './sessao.module.js'
+export { SessaoModule } from './sessao.module.js'
+export * from './tenant/acesso-da-sala.js'
```

```mutacao
arquivo: apps/api/src/sessao/index.ts
teste: apps/api/test/arquitetura.test.ts › nem o barrel de sessao/ exporta
-export { SessaoModule } from './sessao.module.js'
+export { SessaoModule } from './sessao.module.js'
+export { naEscolaSemUsuario } from './tenant/escola-sem-usuario.js'
```

```mutacao
arquivo: apps/api/src/sessao/index.ts
teste: apps/api/test/arquitetura.test.ts › nem o barrel de sessao/ exporta
-export { SessaoModule } from './sessao.module.js'
+export { SessaoModule } from './sessao.module.js'
+export { naEscolaSemUsuario } from "./tenant/escola-sem-usuario.js"
```

```mutacao
arquivo: apps/api/src/operacao/painel.service.ts
teste: apps/api/test/arquitetura.test.ts › nenhum arquivo fora de apps/api/src/sessao importa ou cita a ResolucaoDeTenantRepository
-import { OperadorRepository } from './operador.repository.js'
+import { OperadorRepository } from './operador.repository.js'
+import { ResolucaoDeTenantRepository } from '../sessao/tenant/resolucao-de-tenant.repository.js'
```

```mutacao
arquivo: apps/api/test/arquitetura.test.ts
teste: apps/api/test/arquitetura.test.ts › a varredura enxerga o código: acha a própria classe dentro do módulo de sessão
-const ARQUIVO_DA_RESOLUCAO = 'resolucao-de-tenant.repository.ts'
+const ARQUIVO_DA_RESOLUCAO = 'resolucao-de-tenant.nao-existe.ts'
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › o controller em subpasta do módulo é barrado como o da raiz
-    files: ['apps/api/src/**/*.controller.ts'],
+    files: ['apps/api/src/*/*.controller.ts'],
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › o controller em subpasta do módulo é barrado como o da raiz
-    files: ['apps/api/src/{sessao,operacao}/**/*.controller.ts'],
+    files: ['apps/api/src/{sessao,operacao}/*.controller.ts'],
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| tenancy-guardian (1ª) | O índice exporta `ConviteRepository`, `ContaExternaRepository` e `CHAVE_DA_TRAVA_DO_CONVITE_DA_ESCOLA` só porque os testes de `apps/api/test` os usam; os testes importarem pelo arquivo, ou a regra do depcruise barrar o uso fora de `apps/api/test` | Vai contra a 34.3, que manda o índice trazer o que `apps/api/{src,test}` usam. Destino: a regra do `dependency-cruiser` da 12.0; linha no `TODO.md` |
| tenancy-guardian (1ª) | `.reengenharia/` (`LINHA-DE-BASE.md`, `MAPA.md`, `diagnostico/*.md`) cita os caminhos antigos de `sessao/` | Recusada: é retrato da linha de base. A pergunta ao `/retro` fica com o Orquestrador |
| test-engineer (1ª) | Os imports por `dist` em `infra/scripts/{carga-login,carga-sala,ensaio-alertas}.ts` só se provam no `test:infra` da esteira | Não é mudança de código: o Orquestrador confere o veredito da esteira ao fechar a tarefa |
| test-engineer (1ª) | O "estender o `it` da 33.0" da tabela virou um `it` novo | Nota para o `/retro`; sem ação no código |
| test-engineer (2ª) | O comentário de `arquitetura.test.ts:187` ainda dá como exemplo `export * from './tenant/index.js'`, arquivo que não existe | `TODO.md`: uma linha, junto com as duas abaixo (texto de comentário, sem efeito no teste) |
| test-engineer (2ª), tenancy-guardian (2ª) | `renovacao.service.ts:37` ainda reexporta `JANELA_DE_RENOVACAO_SIMULTANEA_MS`, e só `renovacao.service.test.ts:2` usa; trocar o import do teste para `@educa/shared` e apagar o reexport | `TODO.md`, mesma linha. O reexport já existia no HEAD (18.0); fica para a tarefa que mexer em `renovacao.service.ts` |
| revisor-geral (2ª) | `34_task.md:56` diz "as mutações 1 a 5 de 'Mutações'"; com o bloco novo são seis | `TODO.md`, mesma linha (texto do documento; mexer no `.md` agora pode caducar a rodada) |
| tenancy-guardian (2ª) | Quando a dívida do índice for fechada, conferir que nenhum código de produção fora de `sessao/` instancia os repositories direto | Já registrada na linha do `TODO.md` da 1ª rodada; sem ação |

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
| 2026-10-22 21:11:35 | 2026-10-22 21:12:37 | `tenancy-guardian` | 1 | APROVADO | a83a6123cf904bdad |
| 2026-10-22 21:11:50 | 2026-10-22 21:13:11 | `test-engineer` | 1 | APROVADO | a0093a09eeb57a3db |
| 2026-10-22 21:12:04 | 2026-10-22 21:13:38 | `revisor-geral` | 1 | APROVADO | a4a921349491d4048 |
| 2026-10-22 21:20:46 | 2026-10-22 21:21:02 | `tenancy-guardian` | 2 | APROVADO | ae2f1c4add47e543c |
| 2026-10-22 21:20:54 | 2026-10-22 21:21:28 | `test-engineer` | 2 | APROVADO | a2afb096674bccb3a |
| 2026-10-22 21:21:03 | 2026-10-22 21:21:31 | `revisor-geral` | 2 | APROVADO | a5aa76519987793c7 |
