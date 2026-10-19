# Tarefa 14.0 — Aprovar na pele nova

**Funcionalidade:** telas-do-professor · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

"Revisar a correção" ganha a faixa de números, três abas (Destaques, Outras, Resumo) e o destaque aberto num painel ao
lado. A ação oficial fica numa barra presa, única, desligada até o último destaque ser aberto, e visível nas três abas.

## Contexto necessário

- `techspec.md` seções 5 ("Abas no endereço"), 7b e 9 (Aprovar: leitura, barra presa); `prd.md` RF20 e RF21; `mockup.md`
  12, só pela composição
- Regra 70, itens 1, 3 e 7; D33, D46, D56, D70; regra 50, item 8: a confirmação diz o que vai acontecer. O mockup aprova
  num clique, sem "Acerto por habilidade", e fala em "notas" e "média": aqui nada disso entra
- Código: `Aprovar.tsx` (`DestaqueAberto`, a barra, linhas 340 a 400); `aprovar.ts` (`contadorDosDestaques`,
  `rotuloDeAprovar`); `aprovar.test.ts` (o vocabulário); `api/atividades.ts` (`abrirDestaque`, `aprovarLote`)

## Subtarefas

- [x] 14.1 — `Aprovar.tsx`: a faixa de números (`NumeroPainel`: corrigidas, destaques abertos, acerto médio em questões);
  abas `?aba=destaques|outras|resumo` (`replace`; desconhecido cai em Destaques). Destaques: "Abra estes N antes de
  aprovar", cada um aberto por clique. Outras: "As outras N correções", em ordem de nome. Resumo: distribuição, acerto
  por habilidade e por questão, com o aviso do gabarito. O destaque aberto aparece no `PainelLado`, com `?ver=<alunoId>`
- [x] 14.2 — A barra presa com o botão oficial (grafite, o único da tela), o contador que diz por quê está desligado,
  "Rejeitar a correção" e a confirmação de hoje; fica visível nas três abas e, a 360 px, acima da barra de baixo
- [x] 14.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/Aprovar.tsx`, `aprovar.ts` | alterado (em `apps/web/src/areas/professor/`) |
| `apps/web/src/areas/professor/aprovar.test.ts` | alterado (o vocabulário cobre os textos novos) |
| `apps/web/src/areas/professor/Aprovar.test.tsx` | novo |
| `e2e/professor-aprovar.spec.ts` | alterado (a 2.5 o criou) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| o oficial desligado | componente | com um destaque fechado, o botão está desligado e o contador diz quantos faltam, nas três abas; só `podeAprovar` o liga |
| abrir registra uma vez | componente e e2e | o clique no destaque chama `abrirDestaque` uma vez, mesmo com dois cliques; recarregar com `?ver=` de destaque ainda fechado não abre o painel nem registra |
| a confirmação | e2e | a confirmação mostra a atividade, a turma, quantos e o efeito antes de aprovar; dois cliques mandam uma aprovação só; o registro "Validação registrada por … · quando" aparece depois |
| nenhum botão laranja | componente | a tela tem um único botão oficial e nenhum `primario`; "Rejeitar a correção" é `perigo` e secundário |
| o vocabulário | unidade | `aprovar.test.ts` varre os textos novos: sem "nota", "conceito", "pontuação", "média", "ranking" nem comparação com o histórico do aluno; as outras correções saem em ordem de nome, nunca de acerto |
| estados | componente | carregando; erro com "Tentar de novo"; correção que não existe ("Esta correção não está disponível"), igual para a de outra turma e a de outra escola; com dado |
| a aba pelo endereço | componente | `?aba=resumo` abre o Resumo; a barra continua; trocar de aba usa `replace` |
| o lote mudou | e2e | a aprovação recusada porque o lote mudou vira aviso calmo, com a tela relida; rejeitar exige justificativa de 8 a 500 caracteres |
| recomeço | e2e | recarregar mantém aba e destaques já abertos; a segunda pessoa não vê o lote; a sessão vencida com a confirmação aberta não aprova sozinha ao voltar. Log: nenhum nome de aluno em log da web |
| 360 px | e2e | a barra presa fica acima da barra de baixo; o painel vira folha de baixo; sem rolar de lado |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`); o vocabulário, de `aprovar.test.ts`
- e2e: `describe('aprovar a correção (11.5)')`, três casos em `professor-aprovar.spec.ts`. Mudam a aba que o teste clica
  antes de ver cada bloco e o painel do destaque; nenhuma asserção de regra, e `a3-a4-professor.spec.ts` segue pelas
  fixtures
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/aprovar.test.ts`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-aprovar.spec.ts`
- Telas: `professora`, `/professor/aprovar/:atividadeAplicadaId`, `--clicar 'role=link[name="Revisar a correção"]'`.
  Mockup: `/professor/aprovar/prova-2b?aba=destaques`

## Fora do escopo desta tarefa

"Trocar o gabarito desta questão", "Tirar do lote", o recado que vai com a nota, o destaque "Saiu da aba", "Abaixo/Acima do
costume" e "Diferentes do que costumam" (comparação com o histórico do aluno: perfilização, D60, D70); a faixa "Em branco";
"Aprovar as notas" com vocabulário de nota (D46); o painel de prova de um aluno.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O painel de um destaque trazido pelo endereço (`?ver=`) lê as respostas pela mesma rota que abre (`POST …/abrir`), só para o destaque que o lote já traz aberto; `?ver=` de destaque fechado ou de id que o lote não tem não abre painel e não chama a rota | Não existe rota só de leitura, e a §4 não admite uma nova; a rota de abrir já é idempotente (devolve o mesmo, com a primeira hora) | `techspec.md` §9, "Aprovar na pele nova", item 1 |
| A frase que explica o motivo do destaque sai da linha e fica no painel; a linha diz motivo e acertos | A linha inteira é o botão (`Linha`, "nada clicável dentro"), e o texto longo não cabe numa linha de 64 px | `techspec.md` §9, "Aprovar na pele nova", item 2 |
| Outras sai em ordem de nome na tela, com o id como desempate | A API não promete ordem, e a ordem por acerto é placar (regra 50, item 9) | `techspec.md` §9, item 3 |
| As abas não levam contador | O número de destaques que faltam já está na faixa e na barra presa | `techspec.md` §9, item 4 |
| A tela passa de `formulario` para `leitura` | O tipo da tabela de §9 para Aprovar é "leitura" | `techspec.md` §9, item 5 |
| O lote já decidido não abre o destaque que ficou fechado | Não há mais o que registrar (a API responde `ENTREGA_JA_DECIDIDA`) | `techspec.md` §9, item 6 |
| "Rejeitar…" vira "Rejeitar a correção"; "Abrir" e "Ver de novo" somem (a linha é o botão); "Média de acertos" vira "Acerto médio" | RF21 e a regra 50, item 8: nome diz o que acontece, e "média" fica fora das telas | `techspec.md` §9, "Nomes que mudam"; `docs/interface.md`, Aprovar |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

Cada bloco é uma cláusula da tarefa tirada do código; o teste citado tem de ficar vermelho (`tools/processo/mutacoes.ts`).

Valor de `?aba=` que não é aba cai em Destaques, e não em outra aba.

```mutacao
arquivo: apps/web/src/areas/professor/aprovar.ts
teste: apps/web/src/areas/professor/aprovar.test.ts › e o que não é aba cai em Destaques
-  return ABAS_DA_CORRECAO.find((aba) => aba.id === valor)?.id ?? 'destaques'
+  return ABAS_DA_CORRECAO.find((aba) => aba.id === valor)?.id ?? 'resumo'
```

`?ver=` de destaque ainda fechado ou desconhecido abre painel (abrir é o clique, e é ele que fica registrado).

```mutacao
arquivo: apps/web/src/areas/professor/aprovar.ts
teste: apps/web/src/areas/professor/aprovar.test.ts › só abre destaque do lote e já aberto
-  return destaque.abertoEm !== null || abertosAgora.has(destaque.alunoId) ? destaque : undefined
+  return destaque
```

O destaque que a tela acabou de abrir, e que a leitura do lote ainda não trouxe, não mostra o painel.

```mutacao
arquivo: apps/web/src/areas/professor/aprovar.ts
teste: apps/web/src/areas/professor/aprovar.test.ts › só abre destaque do lote e já aberto
-  return destaque.abertoEm !== null || abertosAgora.has(destaque.alunoId) ? destaque : undefined
+  return destaque.abertoEm !== null ? destaque : undefined
```

Fechar o painel não tira `?ver=` do endereço.

```mutacao
arquivo: apps/web/src/areas/professor/aprovar.ts
teste: apps/web/src/areas/professor/aprovar.test.ts › o endereço troca a aba sem fechar o painel
-  if (mudanca.ver === null) parametros.delete(PARAMETRO_DO_DESTAQUE)
-  else if (mudanca.ver !== undefined) parametros.set(PARAMETRO_DO_DESTAQUE, mudanca.ver)
+  if (mudanca.ver !== undefined && mudanca.ver !== null) parametros.set(PARAMETRO_DO_DESTAQUE, mudanca.ver)
```

A faixa não diz "0" quando não há destaque, e diz "x de y" sem a conta certa.

```mutacao
arquivo: apps/web/src/areas/professor/aprovar.ts
teste: apps/web/src/areas/professor/aprovar.test.ts › a faixa de números
-      valor: total === 0 ? '0' : `${String(correcao.destaquesAbertos)} de ${String(total)}`,
+      valor: `${String(correcao.destaquesAbertos)} de ${String(total)}`
```

"Todos abertos" só quando o último foi aberto, e não um antes.

```mutacao
arquivo: apps/web/src/areas/professor/aprovar.ts
teste: apps/web/src/areas/professor/aprovar.test.ts › a faixa de números
-      apoio: total === 0 ? 'Nenhum para abrir antes de aprovar.' : correcao.destaquesAbertos >= total ? 'Todos abertos.' : 'Abra todos antes de aprovar.',
+      apoio: total === 0 ? 'Nenhum para abrir antes de aprovar.' : correcao.destaquesAbertos >= total - 1 ? 'Todos abertos.' : 'Abra todos antes de aprovar.',
```

O título da aba Destaques não distingue um de vários.

```mutacao
arquivo: apps/web/src/areas/professor/aprovar.ts
teste: apps/web/src/areas/professor/aprovar.test.ts › os títulos das abas
-  return quantos === 1 ? 'Abra este antes de aprovar' : `Abra estes ${String(quantos)} antes de aprovar`
+  return `Abra estes ${String(quantos)} antes de aprovar`
```

As outras correções saem na ordem em que a API devolveu, e não em ordem de nome.

```mutacao
arquivo: apps/web/src/areas/professor/aprovar.ts
teste: apps/web/src/areas/professor/aprovar.test.ts › as outras correções saem em ordem de nome
-  return [...outras].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR') || a.alunoId.localeCompare(b.alunoId))
+  return [...outras]
```

Nome igual não desempata pelo id, e a ordem depende de quem a API devolveu primeiro.

```mutacao
arquivo: apps/web/src/areas/professor/aprovar.ts
teste: apps/web/src/areas/professor/aprovar.test.ts › as outras correções saem em ordem de nome
-  return [...outras].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR') || a.alunoId.localeCompare(b.alunoId))
+  return [...outras].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
```

Dois cliques seguidos mandam duas aberturas.

```mutacao
arquivo: apps/web/src/areas/professor/Aprovar.tsx
teste: apps/web/src/areas/professor/Aprovar.test.tsx › dois cliques seguidos
     if (abertos[alunoId] !== undefined) return mostrar()
-    if (emAbertura.current.size > 0) return
     emAbertura.current.add(alunoId)
```

Abrir de novo o destaque já lido chama a API outra vez.

```mutacao
arquivo: apps/web/src/areas/professor/Aprovar.tsx
teste: apps/web/src/areas/professor/Aprovar.test.tsx › fechar o painel troca o endereço
-    if (abertos[alunoId] !== undefined) return mostrar()
     if (emAbertura.current.size > 0) return
```

Fechar o painel ganha um passo no histórico.

```mutacao
arquivo: apps/web/src/areas/professor/Aprovar.tsx
teste: apps/web/src/areas/professor/Aprovar.test.tsx › fechar o painel troca o endereço
-  const fecharPainel = (): void => navegar(enderecoDaCorrecao(caminho, busca, { ver: null }), { replace: true })
+  const fecharPainel = (): void => navegar(enderecoDaCorrecao(caminho, busca, { ver: null }))
```

Trocar de aba ganha um passo no histórico.

```mutacao
arquivo: apps/web/src/areas/professor/Aprovar.tsx
teste: apps/web/src/areas/professor/Aprovar.test.tsx › trocar de aba usa `replace`
-    if (nova !== undefined) navegar(enderecoDaCorrecao(caminho, busca, { aba: nova.id }), { replace: true })
+    if (nova !== undefined) navegar(enderecoDaCorrecao(caminho, busca, { aba: nova.id }))
```

O botão oficial liga por conta própria quando a tela vê todos os destaques abertos, sem a API liberar.

```mutacao
arquivo: apps/web/src/areas/professor/Aprovar.tsx
teste: apps/web/src/areas/professor/Aprovar.test.tsx › quem liga o botão é a API
-          <Botao variante="oficial" disabled={!dados.podeAprovar} aria-describedby={idDoContador} onClick={() => abrirDecisao('aprovar')}>
+          <Botao variante="oficial" disabled={dados.destaquesAbertos < dados.destaques.length} aria-describedby={idDoContador} onClick={() => abrirDecisao('aprovar')}>
```

Lote já decidido abre o destaque que ficou fechado.

```mutacao
arquivo: apps/web/src/areas/professor/Aprovar.tsx
teste: apps/web/src/areas/professor/Aprovar.test.tsx › o lote já decidido não tem barra
-    const acionavel = estado.aberto || pendente
+    const acionavel = true
```

A aba Outras sai na ordem da API.

```mutacao
arquivo: apps/web/src/areas/professor/Aprovar.tsx
teste: apps/web/src/areas/professor/Aprovar.test.tsx › as outras correções saem em ordem de nome
-                linhas={outrasEmOrdem}
+                linhas={outras}
```

O endereço de um destaque já aberto lê as respostas de novo a cada leitura que deu certo, sem parar.

```mutacao
arquivo: apps/web/src/areas/professor/Aprovar.tsx
teste: apps/web/src/areas/professor/Aprovar.test.tsx › de destaque já aberto lê as respostas uma vez só
-    if (verId === undefined || abertos[verId] !== undefined || emAbertura.current.size > 0) return
+    if (verId === undefined || emAbertura.current.size > 0) return
```

Com uma abertura no ar, o endereço de outro destaque já aberto manda uma segunda leitura por cima dela.

```mutacao
arquivo: apps/web/src/areas/professor/Aprovar.tsx
teste: apps/web/src/areas/professor/Aprovar.test.tsx › com uma abertura no ar
-    if (verId === undefined || abertos[verId] !== undefined || emAbertura.current.size > 0) return
+    if (verId === undefined || abertos[verId] !== undefined) return
```

"Tentar de novo" no painel que já mostra o destaque ganha outro passo no histórico.

```mutacao
arquivo: apps/web/src/areas/professor/Aprovar.tsx
teste: apps/web/src/areas/professor/Aprovar.test.tsx › a leitura do painel que falha mostra o erro no painel
-    const mostrar = () => (verId === alunoId ? undefined : navegar(enderecoDaCorrecao(caminho, busca, { ver: alunoId })))
+    const mostrar = () => navegar(enderecoDaCorrecao(caminho, busca, { ver: alunoId }))
```

O erro da leitura do painel se repete na linha do destaque.

```mutacao
arquivo: apps/web/src/areas/professor/Aprovar.tsx
teste: apps/web/src/areas/professor/Aprovar.test.tsx › a leitura do painel que falha mostra o erro no painel
-        {abrir.isError && abrir.variables === destaque.alunoId && doPainel?.alunoId !== destaque.alunoId && (
+        {abrir.isError && abrir.variables === destaque.alunoId && (
```


## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| privacy-guardian (1ª) | Fixar `Referrer-Policy` (`same-origin` ou `no-referrer`), já que `?ver=` leva o `alunoId` | `TODO.md`: tarefa de staging ou de cabeçalhos de segurança; não é arquivo desta tarefa |
| privacy-guardian (1ª) | Teste de integração na API que prove que a segunda chamada de `abrir` não grava outro `correcao.destaque_aberto` | Validador: conferir se a 11.5 já o tem; se não, `/corrigir` na API. Fora dos arquivos desta tarefa |
| privacy-guardian (1ª), revisor-geral (1ª) | Juntar `VOCABULARIO_PROIBIDO` (e2e e `aprovar.test.ts`) com `VOCABULARIO_DE_NOTA` de `cena.ts` num só lugar | `TODO.md`: tarefa futura que alterar `e2e/__fixtures__/professor/cena.ts`; o arquivo não é desta tarefa e há mais três specs que o importam |
| frontend-reviewer (1ª) | "Muito fora do histórico do aluno" e "Nas correções aprovadas antes": confirmar se esse motivo já passou pela AIA (D60) | Validador (`/validar`) ou `/retro`; vem da API, é anterior à tarefa |
| frontend-reviewer (1ª) | A 1366 × 768 sobra meia linha de destaque; sem medida de rolagem para Aprovar | Sem aplicar: o revisor a registra como observação, não como defeito; o Validador fotografa a tela |
| conformidade-reviewer (1ª) | Pôr o selo de IA no cabeçalho do painel do destaque (regra 70, item 4a) | Validador: muda a tela e caducaria todos os revisores; decidir no `/validar` |
| conformidade-reviewer (1ª) | O aviso do gabarito ficou só no Resumo; citá-lo no apoio de Destaques ou no diálogo de aprovar (D56) | Arquiteto, decisão de produto; no `/retro` |
| conformidade-reviewer (1ª) | Quem abriu o destaque fica fora da validação (dois professores no mesmo lote) | `/retro`, como pergunta sobre a D56; anterior à tarefa |
| revisor-geral (1ª) | `mostrar` guarda o `busca` do clique, e a troca de aba durante o pedido volta a aba anterior | `/corrigir` depois da spec, ou Validador: muda o código de `Aprovar.tsx` e caducaria todos os revisores |
| revisor-geral (1ª) | O caso da segunda pessoa apaga o lote da API simulada, então não prova o alcance | Recusada: o isolamento é da API (regra 10), provado na integração dela; a tela só mostra o que a API responde |
| test-engineer (1ª) | `Aprovar.tsx` engole o clique num segundo destaque enquanto outro abre | Validador: muda comportamento da tela; decidir no `/validar` |
| test-engineer (1ª) | O limite de 500 caracteres da justificativa não é exercido nesta tela | Recusada: existe antes da tarefa e é da regra da API; a tela só repassa |
| test-engineer (2ª) | Comentar por que a espera de 30 ms basta em `Aprovar.test.tsx` (cenário "com uma abertura no ar") | Sem aplicar: editar o teste caducaria `test-engineer` e `revisor-geral` por um comentário; fica para a tarefa futura que o tocar |
| test-engineer (2ª), revisor-geral (2ª) | Em `professor-aprovar.spec.ts`, trocar os `?? 0` / `?? -1` da conta da barra a 360 px por um guarda explícito (`if (presa === null …) throw`) | Sem aplicar: as asserções `not.toBeNull()` já barram o caso, não há falso verde; caducaria os dois revisores |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 06:06:15 | 2026-10-19 06:07:13 | `privacy-guardian` | 1 | APROVADO | aca1086a691ccdd8b |
| 2026-10-19 06:06:18 | 2026-10-19 06:07:16 | `frontend-reviewer` | 1 | APROVADO | ace647e8652bd5b18 |
| 2026-10-19 06:06:13 | 2026-10-19 06:07:47 | `conformidade-reviewer` | 1 | APROVADO | adb10dbef835190f2 |
| 2026-10-19 06:06:19 | 2026-10-19 06:08:13 | `revisor-geral` | 1 | APROVADO | a57f681827fd7c07f |
| 2026-10-19 06:06:17 | 2026-10-19 06:08:48 | `test-engineer` | 1 | REPROVADO | aae3bc34d78293c36 |
| 2026-10-19 06:21:50 | 2026-10-19 06:22:12 | `revisor-geral` | 2 | APROVADO | aad38aee1c72573ba |
| 2026-10-19 06:21:46 | 2026-10-19 06:22:41 | `test-engineer` | 2 | APROVADO | aafe6c9c8bf4e9159 |
