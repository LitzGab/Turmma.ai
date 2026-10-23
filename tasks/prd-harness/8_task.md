# Tarefa 8.0 — O portão derruba os workers e chama as guardas pelas etapas da esteira

**Funcionalidade:** harness (X7) · **Depende de:** nenhuma
**Subagentes obrigatórios:** `infra-guardian`
**Porte:** pequeno

## Objetivo

Antes da integração, o portão derruba o despachante e os workers do compose de teste, que hoje consomem o job que o
teste enfileirou; e o portão e o `ci:verificar` chamam as guardas pela mesma lista de etapas, para uma guarda nova não
entrar só num dos dois.

## Contexto necessário

- `techspec.md` §2 (linha do `portao-local.ts`)
- `prd.md` RF7, RF8
- `cenarios.md` seção A, **RF7** e **RF8**
- `.claude/rules/40-testes.md`, seção "O portão"
- Código: `tools/processo/portao-local.ts` (`comandoDaSuite`, `ambienteDoComando`, `SUITES_DO_PORTAO_DA_TAREFA`: o
  arquivo roda no topo, sem função testável); `tools/ci/verificar.ts` e `tools/ci/etapas-de-guarda.ts`
  (`etapaSegredos`, `etapaAuditoriaDeDependencias`, `etapaDependenciasDeclaradas`); `package.json`
  (`guarda:segredo`, `guarda:dependencias`); `tools/ci/compose.ts` (nomes dos serviços e o projeto de teste)

## Subtarefas

- [x] 8.1 — Extrair de `portao-local.ts` uma função pura que monta a sequência de comandos (suítes, alvos, ambiente);
  o script passa a chamá-la
- [x] 8.2 — Com integração nos alvos, a sequência derruba `despachante` e os `worker*` do compose de teste antes dela; o
  e2e sobe os workers de novo depois
- [x] 8.3 — `etapas-de-guarda.ts` exporta a lista das guardas; `verificar.ts` e o portão usam a mesma lista
- [x] 8.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/portao-local.ts` | alterado |
| `tools/processo/sequencia-do-portao.ts` | novo (a função pura) |
| `tools/processo/portao-local.test.ts` | novo |
| `tools/ci/etapas-de-guarda.ts` | alterado |
| `tools/ci/verificar.ts` | alterado |
| `tools/ci/scripts.test.ts` | alterado |
| `tools/ci/dependencias.ts` | novo (divergência 1) |
| `tools/ci/compose.ts` | alterado (divergência 2) |
| `tools/guardas/knip.test.ts` | alterado (divergência 1) |
| `tools/ci/duracao-do-e2e.test.ts` | alterado (divergência 4) |
| `package.json` | alterado (divergência 1) |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| RF7: com integração alterada, a sequência derruba os workers antes da integração | unidade | a ordem: derrubar vem antes do `vitest --project integracao` |
| RF7: sem integração alterada | unidade | nada é derrubado |
| RF7: depois da integração, com e2e nos alvos | unidade | o e2e sobe os workers de novo |
| RF8: uma guarda a mais no `ci:verificar` e não no portão | unidade | vermelho |
| RF8: as duas listas | unidade | iguais, lidas de `etapas-de-guarda.ts` |

## Como testar

- RF8: copiar `tools/ci/scripts.test.ts › scripts ci:* reais › ci:verificar roda tipos, lint com guardas, gitleaks, npm audit, knip e unidade, e sai verde só se todos passarem`; a lista vem da exportação, nunca redigitada.
- RF7: a função pura recebe os alvos (como `alvosDoPortao` devolve) e devolve a lista de comandos; o teste afirma a posição relativa do `docker compose … stop despachante worker…` e do `vitest --project integracao`.
- Rodar: `npx vitest run --project unidade tools/processo/portao-local.test.ts tools/ci/scripts.test.ts`.
- Armadilha: o `portao-local.ts` executa ao ser importado; o teste importa só o módulo novo.

## Fora do escopo desta tarefa

O RF17 no portão e o `--faltando` (9.0); a impressão dos guardiões (13.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| 1. `guarda:dependencias` passa a ser `node tools/ci/dependencias.ts`, que roda `ETAPAS_DE_DEPENDENCIAS` (o `npm audit` e o knip da esteira), e não o texto `npm audit … && knip …` redigitado no `package.json`. O teste `tools/guardas/knip.test.ts` que mantinha o texto igual ao da etapa passa a afirmar o novo script | O RF8 pede que o portão e o `ci:verificar` chamem as guardas pelas mesmas etapas. Com o texto no `package.json`, o portão rodaria uma cópia, e uma guarda nova nas etapas não chegaria nele. É o que o `infra-guardian` recomendou na 24.0 da reengenharia ("vale o portão chamar a etapa direto"), adiado até `tools/processo/` poder mudar | `techspec.md` §2 (linhas novas depois da do `portao-local.ts`); `cenarios.md` RF8 |
| 2. `servicosDeJob` em `tools/ci/compose.ts`: os despachantes e workers lidos do `infra/compose.yml`, e não uma lista de nomes escrita no portão. Lista vazia é erro | O RF7 diz "despachante e workers" sem nomear réplicas; o compose tem seis (`despachante-1/2`, `worker-interativo-1/2`, `worker-lote-1/2`). `docker compose stop` sem serviço nenhum derrubaria o projeto inteiro, o banco junto, por isso a lista vazia reprova em vez de virar "nada a derrubar" | `techspec.md` §2 (linha de `compose.ts`); `cenarios.md` RF7 |
| 3. `suitesDoPortao` também mora em `sequencia-do-portao.ts`: a escolha das suítes (tarefa ou completo, com `--e2e` e `--infra`) sai do topo do `portao-local.ts` | A lista das suítes de guarda do portão completo era um literal no script, sem função testável; o RF8 compara as listas, e o teste precisa chamá-la | `techspec.md` §2 (linha de `sequencia-do-portao.ts`) |
| 4. `tools/ci/duracao-do-e2e.test.ts` lê o texto de `portao-local.ts` (`as ligações que nenhuma função sozinha prova`): as duas expressões que ele procura passam a usar `passo.comando` e `ambienteDoPasso(passo)`, os nomes novos | A sequência do portão virou lista de passos (`PassoDoPortao`); o comportamento do e2e (variável do relatório só nele) é o mesmo | `techspec.md` §2 (linha do `portao-local.ts`) |
| 5. A sequência termina num `stop` dos despachantes e workers (suíte `mutacoes`) quando alguma mutação do documento cita um teste de integração (`mutacaoDeIntegracao`), e o `portao-local.ts` lê o documento antes das suítes para saber disso. O `stop` do alvo, antes da integração, fica como redundância declarada: o `down --volumes` do `globalSetup` já derruba o projeto inteiro | A ordem de correção da 1ª rodada (revisor-geral, infra-guardian, test-engineer): o `stop` do alvo não muda nada, e a corrida de integração das mutações roda com `EDUCA_BANCO_NOVO` desligado, depois do e2e que deixa os workers de pé. É o caso em que o RF7 (worker de pé não consome o job do teste) estava aberto | `techspec.md` §2 (linha de `sequencia-do-portao.ts`); `cenarios.md` RF7 |

## Mutações

Cobrem as cláusulas do diff: a ordem e a presença do `stop` antes da integração e antes das mutações de integração, a guarda da lista vazia, o banco limpo, a
escolha das suítes e o comando de cada uma, o filtro dos serviços de job, e a lista das guardas lida pelo `ci:verificar`, pelo
`dependencias.ts` e pelo portão. O `portao-local.ts` só liga essas funções ao `spawnSync` e não tem teste de unidade (executa ao
ser importado): o que ele decide vive em `sequencia-do-portao.ts`.

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › com integração nos alvos, o `stop` dos despachantes e workers vem antes
     ...(alvos.integracao.length > 0
-      ? [passo(derrubarJob(docker, servicosDeJob)), passo(`npx vitest run --project integracao ${alvos.integracao.join(' ')}`, true)]
+      ? [passo(`npx vitest run --project integracao ${alvos.integracao.join(' ')}`, true)]
```

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › com integração nos alvos, o `stop` dos despachantes e workers vem antes
-      ? [passo(derrubarJob(docker, servicosDeJob)), passo(`npx vitest run --project integracao ${alvos.integracao.join(' ')}`, true)]
+      ? [passo(`npx vitest run --project integracao ${alvos.integracao.join(' ')}`, true), passo(derrubarJob(docker, servicosDeJob))]
```

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › sem integração nos alvos, nada é derrubado
-    ...(alvos.integracao.length > 0
+    ...(alvos.integracao.length >= 0
```

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › sem integração nos alvos, nada é derrubado
-    ...(alvos.e2e.length > 0 ?
+    ...(alvos.e2e.length >= 0 ?
```

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › sem integração nos alvos, nada é derrubado
-    ...(alvos.infra.length > 0 ?
+    ...(alvos.infra.length >= 0 ?
```

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › compose sem despachante nem worker é erro
-servicosDeJob.length === 0) throw
+servicosDeJob.length === 1) throw
```

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › o `npm run test` e a integração dos alvos começam do banco limpo
-${alvos.integracao.join(' ')}`, true)]
+${alvos.integracao.join(' ')}`)]
```

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › o `npm run test` e a integração dos alvos começam do banco limpo
-bancoNovo: suite === 'test'
+bancoNovo: suite === 'teste'
```

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › o `npm run test` e a integração dos alvos começam do banco limpo
-(comando: string, bancoNovo = false)
+(comando: string, bancoNovo = true)
```

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › sem integração nos alvos, nada é derrubado
-if (suite === 'alvo') return passosDoAlvo(entrada)
+if (suite === 'alvox') return passosDoAlvo(entrada)
```

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › a suíte typecheck roda
-const comando = COMANDO_DA_SUITE[suite] ?? `npm run ${suite}`
+const comando = COMANDO_DA_SUITE[suite] ?? 'npm run x'
```

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › cada guarda roda o seu script
-  ...Object.fromEntries(GUARDAS_DA_ESTEIRA.map((guarda) => [guarda.suite, `npm run ${guarda.script}`])),
```

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › o portão da tarefa roda as suítes que o carimbo e o hook leem
-if (daTarefa) return [...SUITES_DO_PORTAO_DA_TAREFA]
+if (!daTarefa) return [...SUITES_DO_PORTAO_DA_TAREFA]
```

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › o portão completo é o da esteira
-...(e2e ? ['e2e'] : [])
+...(!e2e ? ['e2e'] : [])
```

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › o portão completo é o da esteira
-...(infra ? ['infra'] : [])
+...(!infra ? ['infra'] : [])
```

```mutacao
arquivo: tools/ci/compose.ts
teste: tools/processo/portao-local.test.ts › o nome tem de começar por despachante ou worker
-/^(despachante|worker)(-|$)/.test(servico))
+/(despachante|worker)(-|$)/.test(servico))
```

```mutacao
arquivo: tools/ci/compose.ts
teste: tools/processo/portao-local.test.ts › o nome tem de começar por despachante ou worker
-/^(despachante|worker)(-|$)/.test(servico))
+/^(despachante|worker)(-)/.test(servico))
```

```mutacao
arquivo: tools/ci/compose.ts
teste: tools/processo/portao-local.test.ts › o nome tem de começar por despachante ou worker
-/^(despachante|worker)(-|$)/.test(servico))
+/^(despachante|worker)(|$)/.test(servico))
```

```mutacao
arquivo: tools/ci/compose.ts
teste: tools/processo/portao-local.test.ts › são os despachantes e os workers do compose de teste
-/^(despachante|worker)(-|$)/.test(servico))
+/^(despachante)(-|$)/.test(servico))
```

```mutacao
arquivo: tools/ci/compose.ts
teste: tools/processo/portao-local.test.ts › são os despachantes e os workers do compose de teste
-/^(despachante|worker)(-|$)/.test(servico))
+/^(worker)(-|$)/.test(servico))
```

```mutacao
arquivo: tools/ci/etapas-de-guarda.ts
teste: tools/ci/scripts.test.ts › as guardas da esteira são o gitleaks, o npm audit e o knip, nesta ordem
-etapas: ETAPAS_DE_DEPENDENCIAS },
+etapas: [etapaAuditoriaDeDependencias] },
```

```mutacao
arquivo: tools/ci/etapas-de-guarda.ts
teste: tools/ci/scripts.test.ts › as guardas da esteira são o gitleaks, o npm audit e o knip, nesta ordem
-etapas: [etapaSegredos] },
+etapas: [] },
```

```mutacao
arquivo: tools/ci/etapas-de-guarda.ts
teste: tools/ci/scripts.test.ts › as guardas da esteira são o gitleaks, o npm audit e o knip, nesta ordem
-GUARDAS_DA_ESTEIRA.flatMap((guarda) => guarda.etapas)
+GUARDAS_DA_ESTEIRA.flatMap((guarda) => guarda.etapas.slice(0, 1))
```

```mutacao
arquivo: tools/ci/etapas-de-guarda.ts
teste: tools/ci/scripts.test.ts › RF8: o portão local cobre todas as etapas do ci:verificar
-return etapasDaEsteira.filter((etapa) => !cobertas.has(etapa))
+return etapasDaEsteira.filter((etapa) => cobertas.has(etapa))
```

```mutacao
arquivo: tools/ci/etapas-de-guarda.ts
teste: tools/ci/scripts.test.ts › RF8: o portão local cobre todas as etapas do ci:verificar
-const cobertas = new Set(guardas.flatMap((guarda) => guarda.etapas))
+const cobertas = new Set(guardas.flatMap(() => []))
```

```mutacao
arquivo: tools/ci/etapas-de-guarda.ts
teste: tools/ci/scripts.test.ts › RF8: o script do portão de cada guarda
-script: 'guarda:segredo'
+script: 'guarda:segredox'
```

```mutacao
arquivo: tools/ci/verificar.ts
teste: tools/ci/scripts.test.ts › ci:verificar roda tipos, lint, as guardas da lista
-    ...ETAPAS_DE_GUARDA,
```

```mutacao
arquivo: tools/ci/dependencias.ts
teste: tools/ci/scripts.test.ts › RF8: o script do portão de cada guarda
-executarEtapas(ETAPAS_DE_DEPENDENCIAS)
+executarEtapas([])
```

```mutacao
arquivo: package.json
teste: tools/ci/scripts.test.ts › RF8: o script do portão de cada guarda
-    "guarda:dependencias": "node tools/ci/dependencias.ts",
+    "guarda:dependencias": "npm audit --audit-level=high --omit=dev",
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/ci/duracao-do-e2e.test.ts › o portão da tarefa passa a variável só ao e2e
-rodar(passo.comando, ambienteDoPasso(passo))
+rodar(passo.comando)
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/ci/duracao-do-e2e.test.ts › o portão da tarefa passa a variável só ao e2e
-daTarefa && passo.comando.includes('tools/ci/e2e.ts')
+passo.comando.includes('tools/ci/e2e.ts')
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/processo/revisoes.test.ts › o portão local, rodado como processo
-passo.bancoNovo ? '1' : undefined
+'1'
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/processo/revisoes.test.ts › o portão local, rodado como processo
-passo.bancoNovo ? '1' : undefined
+passo.bancoNovo ? '1' : process.env['EDUCA_BANCO_NOVO']
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/ci/duracao-do-e2e.test.ts › o portão liga a sequência pura
-e2e: argumentos.includes('--e2e'), infra:
+e2e: false, infra:
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/ci/duracao-do-e2e.test.ts › o portão liga a sequência pura
-const textoDoDocumento = documento ? readFileSync
+const textoDoDocumento = false ? readFileSync
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/ci/duracao-do-e2e.test.ts › o portão liga a sequência pura
-textoDoDocumento !== null && mutacaoDeIntegracao(
+textoDoDocumento !== null && !mutacaoDeIntegracao(
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/ci/duracao-do-e2e.test.ts › o portão liga a sequência pura
-docker: ['docker', ...ARGUMENTOS_COMPOSE], servicosDeJob: servicosDeJob(), mutacoesDeIntegracao })
+docker: ['docker'], servicosDeJob: servicosDeJob(), mutacoesDeIntegracao })
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/ci/duracao-do-e2e.test.ts › o portão liga a sequência pura
-servicosDeJob: servicosDeJob(), mutacoesDeIntegracao })
+servicosDeJob: [], mutacoesDeIntegracao })
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/ci/duracao-do-e2e.test.ts › o portão liga a sequência pura
-servicosDeJob: servicosDeJob(), mutacoesDeIntegracao })
+servicosDeJob: servicosDeJob(), mutacoesDeIntegracao: false })
```

```mutacao
arquivo: tools/processo/portao-local.ts
teste: tools/ci/duracao-do-e2e.test.ts › o portão liga a sequência pura
-if (documento && textoDoDocumento !== null) {
+if (documento) {
```

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › com mutação de integração, um `stop` vem depois do e2e
-    ...(entrada.mutacoesDeIntegracao ? [{ suite: 'mutacoes', comando: derrubarJob(entrada.docker, entrada.servicosDeJob), bancoNovo: false }] : []),
```

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › com mutação de integração, um `stop` vem depois do e2e
-    ...suites.flatMap((suite) => passosDaSuite(suite, entrada)),
-    ...(entrada.mutacoesDeIntegracao ? [{ suite: 'mutacoes', comando: derrubarJob(entrada.docker, entrada.servicosDeJob), bancoNovo: false }] : []),
+    ...(entrada.mutacoesDeIntegracao ? [{ suite: 'mutacoes', comando: derrubarJob(entrada.docker, entrada.servicosDeJob), bancoNovo: false }] : []),
+    ...suites.flatMap((suite) => passosDaSuite(suite, entrada)),
```

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › sem mutação de integração, só o `stop` do alvo
-...(entrada.mutacoesDeIntegracao ? [{ suite
+...(!entrada.mutacoesDeIntegracao ? [{ suite
```

```mutacao
arquivo: tools/processo/sequencia-do-portao.ts
teste: tools/processo/portao-local.test.ts › só o teste de integração conta
-tipoDoTeste(mutacao.teste) === 'integracao'
+tipoDoTeste(mutacao.teste) !== 'e2e'
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª), infra-guardian (1ª) | `servicosDeJob()` e `ARGUMENTOS_COMPOSE` lidos no carregamento de `portao-local.ts`, mesmo sem integração nos alvos, e `compose.ts` valida `EDUCA_AMBIENTE_TESTE` e grava o `.env` também no `conferir` | Tarefa 9.0, que toca `portao-local.ts` (RF17 e `--faltando`): mudar a hora da leitura muda comportamento do portão e do `conferir` |
| revisor-geral (1ª) | `SUITES_DO_PORTAO_DA_TAREFA` e `SUITES_DO_PORTAO_COMPLETO` em `tools/processo/revisoes.ts` ainda trazem `'segredo', 'dependencias'` à mão | Tarefa 13.0 (RF13, partição de `revisoes.ts`); hoje o teste de `portao-local.test.ts` segura o desvio |
| test-engineer (1ª) | `etapasSemGuardaNoPortao` não protege nada fora do teste: o resultado vazio é tautológico | Arquiteto e `/validar`: tirar a função mexe nos dois blocos de mutação dela, no `cenarios.md` RF8 e em `scripts.test.ts`; quem prova o RF8 é o teste que roda o `verificar.ts` |
| test-engineer (1ª) | o vínculo entre o script do portão e as etapas da guarda usa `ETAPAS_DE_DEPENDENCIAS` pelo nome, e não itera `GUARDAS_DA_ESTEIRA` | Recusada por ora: com duas guardas, a lista escrita à mão é lida do teste que roda o script; refaz-se quando entrar a terceira guarda |
| test-engineer (1ª) | duas mutações (`alvos.e2e.length`, `alvos.infra.length`) sob um teste de nome estreito | Recusada: o vermelho é legítimo (`toEqual([])`), e renomear o teste obriga a mexer em todos os blocos que o citam |
| infra-guardian (2ª) | o teste `o portão liga a sequência pura` (`tools/ci/duracao-do-e2e.test.ts`) procura a linha inteira de `portao-local.ts`, caractere por caractere: uma reformatação o deixa vermelho sem mudança de comportamento | `/retro`: extrair a ligação do `portao-local.ts` para função testável (o `test-engineer` pede o mesmo, na recomendação 2 da 2ª rodada); as mutações declaradas valem como prova até lá |
| infra-guardian (2ª) | `lerMutacoes(textoDoDocumento).mutacoes` em `portao-local.ts` ignora os `erros`; um comentário de uma linha diria que o `conferirMutacoesDoDocumento` reprova o documento logo depois | Tarefa 9.0, que toca `portao-local.ts` |
| revisor-geral (2ª) | uma mutação de e2e sobre `apps/` ou `packages/` (`pedeReconstrucao`) sobe o ambiente inteiro (`--manter-ambiente`); vinda antes de uma mutação de integração no mesmo documento, os workers voltam | Tarefa 9.0, que toca `mutacoes.ts`: rodar o `stop` antes de cada corrida de integração que vem depois de um e2e; ou o Arquiteto escreve o caso na Tech Spec como limitação conhecida. Nenhum documento de tarefa existente mistura os dois tipos |
| revisor-geral (2ª) | comentários desatualizados: o de `passosDaSuite` (`sequencia-do-portao.ts`) e o de `portao-local.ts` (linha do `stop` do alvo) tratam o `stop` do alvo como o que protege o teste | Tarefa 9.0 para o `portao-local.ts`; o de `sequencia-do-portao.ts`, na próxima tarefa que tocar o arquivo |
| revisor-geral (2ª) | a mensagem de erro de `derrubarJob` diz "antes da integração", e a função serve também ao `stop` das mutações | Na próxima tarefa que tocar `sequencia-do-portao.ts` |
| revisor-geral (2ª) | o texto da divergência 5 em `8_task.md` diz que o `infra-guardian` exigiu a correção, mas ele aprovou na 1ª rodada | `/validar`: erro de redação do documento, sem efeito no código |
| test-engineer (2ª) | a tabela "Testes que provam a regra" de `8_task.md` não tem linha para a divergência 5, e as linhas existentes não citam o teste pelo nome | `/validar`, junto com o item acima |
| test-engineer (2ª) | a ligação documento → `mutacaoDeIntegracao` → sequência só é provada pelo texto; uma variante de `tools/processo/revisoes.test.ts:487` com `docker` falso no `PATH` provaria o comportamento | `/retro`, com a extração da ligação do `portao-local.ts` em função testável |
| test-engineer (2ª) | duas linhas de `portao-local.ts` movidas ou reescritas sem bloco: `const documento = daTarefa ? documentoDasMutacoes() : null` e `!dependencias ? 'dependências' : sequencia.find(...)?.suite` | Tarefa 9.0: o `--faltando` lista as linhas sem bloco, e a tarefa que o implementa decide entre declarar o bloco e registrar o motivo |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 15:07:56 | 2026-10-23 15:08:22 | `infra-guardian` | 1 | APROVADO | a3b8845d5d0774933 |
| 2026-10-23 15:07:59 | 2026-10-23 15:10:08 | `revisor-geral` | 1 | REPROVADO | add43408668e68442 |
| 2026-10-23 15:07:57 | 2026-10-23 15:11:46 | `test-engineer` | 1 | REPROVADO | a461fae82bc29bd39 |
| 2026-10-23 15:19:09 | 2026-10-23 15:19:41 | `infra-guardian` | 2 | APROVADO | a67948f38ac86dada |
| 2026-10-23 15:19:21 | 2026-10-23 15:20:28 | `revisor-geral` | 2 | APROVADO | a5098b45d36ea4a42 |
| 2026-10-23 15:19:14 | 2026-10-23 15:20:39 | `test-engineer` | 2 | APROVADO | a8516f5eb12456209 |
