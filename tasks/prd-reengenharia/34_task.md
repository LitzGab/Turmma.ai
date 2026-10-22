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

- [ ] 34.1 — Num commit antes, os três caminhos exatos de `arquitetura.test.ts` passam a ser achados pelo nome da classe e do arquivo dentro de `MODULO_SESSAO`
  (o teste cita a regra, e não a pasta); `grep -rn "sessao/" apps/api/test/arquitetura.test.ts` confere
- [ ] 34.2 — `mapa.json` e o script da 33.0. Um commit por destino:
  `tenant/` ← `resolucao-de-tenant.repository` (com `.test` e `.int.test`), `acesso-da-sala`, `escola-sem-usuario`, `sessoes-sinteticas`;
  `login/` ← `login.service`, `login-email.controller`, `matricula.{controller,service}`; `conclusao/` ← `conclusao-de-login`;
  `renovacao/`, `saida/`, `troca-de-escola/`, `acesso-da-escola/`, `eu/` (com `eu.repository`) ← seus `.controller`, `.service` e testes;
  `mfa/` ← `mfa.{controller,service}`, `redefinir-mfa.controller`, `redefinicao-de-mfa`, `redefinicao-de-mfa.repository`;
  `convite/` ← `convite.{controller,service,repository}`, `convite-de-professor.service`, `bilhete-de-convite` (os três casos de uso do operador ficam no `convite.service`);
  `atividade/` ← `atividade.{controller,service}`, `alunos-ativos.repository`. `externa/` já é fluxo e fica; `sessao.module.ts` e `conferencia-do-autor.ts` ficam na raiz
- [ ] 34.3 — `sessao/index.ts`: um `export { … }` nomeado por símbolo que `apps/api/{src,test}` fora de `sessao/` e `credencial/` usam; elas passam a importar
  pelo `index.js`. Nunca `export *`, e nenhum arquivo de `tenant/` entra no índice além de `AcessoDaSala` e `sessoes-sinteticas`; `infra/` e `e2e/` ficam no arquivo
- [ ] 34.4 — Testes (tabela), o caminho citado como texto, e a conferência final

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
| `Object.values` de `sessao/index.js` e de `credencial/index.js` não traz `ResolucaoDeTenantRepository` nem `ContaGlobalRepository`, sob nome nenhum (estende o `it` da 33.0) | unidade | `export * from './tenant/index.js'` no índice (o reexport em dois passos que o depcruise não vê) |
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

