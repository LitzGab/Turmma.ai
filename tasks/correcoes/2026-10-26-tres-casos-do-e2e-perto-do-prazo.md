# Correção — três casos do e2e passam de 90% do prazo de 30 s no celular da esteira (`convite:409`, `material:478` e `:491`)

**Origem:** esteira run 40264500227 da `spec/telas-do-aluno-e-primeiro-acesso--l1` (`0d5af65`), censo do e2e: `e2e/convite.spec.ts:409` a 28,9 s, `e2e/material.spec.ts:478` a 27,7 s e `:491` a 27,8 s, todos no `celular`. Diagnóstico do Arquiteto em `.processo/ordens/diagnostico-censo.md`, seção 3 (só o risco imediato).
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`, `infra-guardian`, `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. `revisor-geral` já é obrigatório em toda correção. -->

## Sintoma

Três casos do `celular` (CPU ×4, rede móvel lenta) levam 27,7 a 28,9 s dos 30 s. Nenhum falhou ainda; passam por menos de 2,5 s, e a variação de um runner a outro já derrubou casos assim (`2026-10-16-galeria-da-onca-estoura-o-prazo`). Os três são os mesmos há três execuções seguidas (develop 28,8 / 28,5 / 28,4 s), isto é, já eram assim antes da X4.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa. Os outros 36 casos entre 67% e 90% do prazo são dívida da develop, fora desta correção (diagnóstico, seção 3).

## Causa

**Tempo, e a causa é de contagem de trabalho por caso.**

- `convite.spec.ts:409` (`recomeço, consulta atrasada…`): um `for (const volta of ['vale', 'nao_vale', 'cai'])` dentro de **um** caso. Cada volta cria dois convites no banco, abre `/sistema`, abre `/convite#…`, troca o `#`, solta a consulta segurada e aceita até `Senha nova`. São três rodadas completas sob o prazo de um caso só (~9,6 s cada).
- `material.spec.ts:478` e `:491`: depois de `abrirMaterial` (entrada da coordenadora e navegação até Material), o caso faz `page.goto('/coordenacao/material?material=…')`, uma **carga inteira da aplicação** sob a rede "móvel lenta" (600 ms de latência, 1 Mbps). O que esses casos afirmam é o que o painel faz com o `?material=`, e não quanto tempo a tela leva para baixar na rede lenta (isso se mede no orçamento do build e nos specs de tela com API); o precedente é `carregarSemRedeLenta` (`e2e/__fixtures__/perfis.ts`).

## Teste que reproduz

Tempo de runner alheio não é determinístico; a evidência é a medida, no mesmo ambiente (`tools/ci/e2e.ts`, os dois specs, 6 trabalhadores) antes e depois, e a estabilidade com os 2 trabalhadores da esteira.

| Caso (`celular` / `chromebook`) | Antes | Depois |
|---|---|---|
| `convite.spec.ts:409`, as três voltas num caso | **27,1 s** / 23,6 s | 3 casos (`vale`, `nao_vale`, `cai`): 8,8–9,4 s / 7,7–8,3 s cada um |
| `material.spec.ts:478`, painel pelo endereço | **27,1 s** / 24,9 s | 8,5 s / 8,1 s |
| `material.spec.ts:491`, id que não existe | **27,2 s** / 24,8 s | 8,4 s / 8,0 s |

Passo intermediário, que não bastou: só envolver o segundo `goto` em `carregarSemRedeLenta` (o passo 1 do diagnóstico) baixou os dois casos do material a 24,7 e 25,2 s; abrir o endereço já na entrada, em vez do menu, a 21,5 e 21,9 s. O tempo estava na **entrada pela tela** (dois logins e a configuração do segundo fator sob a rede lenta: os vizinhos que só clicam levam 17–21 s por isso), e não no segundo `goto`. Não consegui o traço `traco-do-e2e-6` (a execução 40264500227 só tem os `censo-do-e2e-*`); o que vale é a medida local acima.

Estabilidade: `npx playwright test e2e/convite.spec.ts e2e/material.spec.ts --repeat-each 3 --workers 2` (os 2 trabalhadores da esteira), ambiente de pé: **168 de 168 verdes**. Os casos tocados ficaram em 8,3–9,4 s no `celular` e 7,5–8,1 s no `chromebook`. O mais lento do arquivo, `material.spec.ts:527` (`segunda pessoa…`, com `test.slow()` desde antes), levou 34,9 s de 90 s e não foi tocado.

## Correção

Só teste muda; o produto não, e a cobertura é a mesma.

- `e2e/convite.spec.ts`: o laço sobre `['vale', 'nao_vale', 'cai']` deixa de estar dentro de um caso e passa a gerar um caso por volta (`voltas.forEach((volta) => test(…))`), com o nome da volta no título. Corpo e asserções iguais; o prazo de 30 s vale para cada volta. A lista de voltas e o comentário foram para o topo do arquivo e o `test(` ficou na linha do `forEach`: o portão da duração conta como do caso tudo o que está entre o `test(` dele e o seguinte, e um `for` solto ali puxava o caso vizinho (`:347`, `resposta atrasada`, 15,7 s) para a medida sem que ele tenha sido tocado.
- `e2e/material.spec.ts`: os dois casos que provam o que o painel faz com o `?material=` (`painel abre pelo endereço` e `id que não existe`) entram pela API com o segundo fator já configurado (`entrarPelaApiComSegundoFator`, `e2e/__fixtures__/segundo-fator.ts`, que já existia para isso) e abrem o endereço numa carga só, dentro de `carregarSemRedeLenta`. O ajudante novo é `abrirMaterialPeloEndereco`; `abrirMaterial` não mudou. A entrada pela tela e o menu continuam provados nos outros casos do arquivo e em `mfa.spec.ts`. As asserções dos dois casos são as mesmas (o precondicional "a linha aparece na lista antes do `goto`" saiu do `:478`, porque o `goto` é agora a primeira carga; no `:491` a linha continua sendo conferida depois do endereço).

Fora desta correção: os outros 36 casos entre 67% e 90% do prazo (diagnóstico, seção 3) e as `pecas-*` do celular.

## Mutações

```mutacao
arquivo: e2e/material.spec.ts
teste: e2e/material.spec.ts › o painel abre pelo endereço, como o link do sino, e o Esc tira o id do endereço
  await antes(cenario)
-  await carregarSemRedeLenta(page, () => entrarPelaApiComSegundoFator(page, request, coordenadora, endereco(cenario)))
+  await carregarSemRedeLenta(page, () => entrarPelaApiComSegundoFator(page, request, coordenadora, '/coordenacao/material'))
  return cenario
```

```mutacao
arquivo: e2e/convite.spec.ts
teste: e2e/convite.spec.ts › recomeço, consulta atrasada .cai.
    // E o aceite seguinte leva o token do link novo, e não o do anterior.
    const aceite = page.waitForRequest((pedido) => new URL(pedido.url()).pathname === '/v1/convites/aceitar')
    await acionar(page, 'Aceitar o convite', hasTouch)
-    expect((await aceite).postDataJSON(), volta).toEqual({ token: novo.token })
+    expect((await aceite).postDataJSON(), volta).toEqual({ token: anterior.token })
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | `for (const x of …) { test(…) }` é o padrão do projeto (`areas.spec.ts`, `casca.spec.ts`, `pecas-ia.spec.ts`, `tokens.spec.ts`); o `forEach` existe por limitação da contagem do portão da duração (`tools/ci/duracao-do-e2e.ts`), que deveria ser corrigida | Retro da funcionalidade: é mudança em `tools/ci`, fora do escopo de uma correção que só mexe em teste; a recomendação já está em `achados/` e a retro lê dali |
| test-engineer (1ª) | Mutar a guarda da consulta atrasada em `apps/web/src/paginas/Convite.tsx`, e não a asserção do teste, no bloco de mutação do convite | Recusada: a correção não toca o produto, e o mesmo revisor registra que as mutações da guarda em `Convite.tsx` continuam pegas, cada uma pelo caso da sua volta (`tasks/prd-apresentacao-escola/14_task.md`) |
| test-engineer (1ª) | Bloco de mutação para o caso do id inexistente (trocar o id por `semTextoId`) | Recusada: o caso já existia, as asserções são as mesmas e não há cláusula nova (o revisor diz que não bloqueia); outra mutação é mais uma execução do portão para um caso que a correção só moveu de entrada |
| tenancy-guardian, privacy-guardian, infra-guardian (1ª) | Usar o id de um material de uma segunda escola no caso do id inexistente | Recusada: muda o que o caso prova, e o isolamento entre escolas já é provado pelo caso `segunda pessoa…` (`material.spec.ts:527`), que a correção não tocou. O item 1 da ordem tira a promessa do título |
| infra-guardian (1ª) | Se o censo mostrar "o segundo fator pela API não abriu a sessão", olhar primeiro o cálculo `codigoDoAutenticador(segredo, 30)` em `entrarPelaApiComSegundoFator` | Sem ação: é pista de diagnóstico, não mudança |
| privacy-guardian (1ª) | A entrada pela tela saiu desses dois casos; manter a prova dela nos outros casos do arquivo e em `mfa.spec.ts` | Sem ação: já é assim; fica como cuidado para quando esses specs forem otimizados |
| test-engineer (1ª) | Os outros 36 casos entre 67% e 90% do prazo seguem como dívida | Sem ação: já registrada no documento, "Fora desta correção" |
| test-engineer (2ª) | O documento ainda chama os casos do material de `:478` e `:491`, linhas que andaram; citar pelo nome envelhece menos | Recusada: são o registro histórico da medida que motivou a correção (a tabela "Teste que reproduz" e a "Origem" citam as linhas do censo da esteira), e o próprio revisor diz que não atrapalha. Os nomes dos casos já estão na seção "Correção" |
| test-engineer (2ª) | Não rodou os testes na rodada | Sem ação: quem prova o verde é o portão da tarefa, que já gravou o carimbo |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-26 02:10:52 | 2026-10-26 02:11:09 | `infra-guardian` | 1 | APROVADO | a0483b72be5dba92a |
| 2026-10-26 02:10:55 | 2026-10-26 02:11:12 | `conformidade-reviewer` | 1 | APROVADO | acdb4ebcb8fee7250 |
| 2026-10-26 02:10:53 | 2026-10-26 02:11:14 | `tenancy-guardian` | 1 | APROVADO | a2038f5bf00ca68d8 |
| 2026-10-26 02:10:54 | 2026-10-26 02:11:18 | `privacy-guardian` | 1 | APROVADO | a37205bd6d52ca108 |
| 2026-10-26 02:10:51 | 2026-10-26 02:11:33 | `revisor-geral` | 1 | APROVADO | a968259dd1add1130 |
| 2026-10-26 02:10:50 | 2026-10-26 02:13:24 | `test-engineer` | 1 | APROVADO | a512d7a9fa6747663 |
| 2026-10-26 02:25:07 | 2026-10-26 02:25:30 | `revisor-geral` | 2 | APROVADO | a86eb3b846866e723 |
| 2026-10-26 02:25:02 | 2026-10-26 02:25:37 | `test-engineer` | 2 | APROVADO | a4aebaa78f4c4de91 |
