# Tarefa 51.0 — Resposta atrasada não sobrescreve, nem depois do F5 nem em outra aba

**Funcionalidade:** reengenharia · **Depende de:** nenhuma
**Subagentes obrigatórios:** `infra-guardian`, `tenancy-guardian`, `frontend-reviewer`, `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O `PUT` da resposta da prova leva uma `sequencia`, e o banco só grava a mais nova: o reenvio atrasado, o F5 e a outra
aba não trocam a escolha mais recente do aluno (regra 80.6, RF21). É a tarefa da linha da web.

## Contexto necessário

- `onda-3c.md` T13, "51.0, a sequência", e o §3 ("Prova", "Outra aba"); `techspec.md` §7c; `prd.md` RF21 (§11)
- Regras 80.6 e 80.7 (concorrência no banco, não "verifica e depois grava"), 10.3, 50 (alvo de 44 px, `role="status"`)
- `apps/api/src/atividade/minha-atividade.repository.ts` › `responder` (o `onConflictDoUpdate` de hoje) e `respostas`
- `packages/shared/src/atividade/prova.ts` › `esquemaPedidoResponderQuestao`, `esquemaRespostaQuestaoSalva`, a leitura da prova
- `apps/web/src/areas/aluno/respostas.ts` (a fila pura) e `fila-de-respostas.ts` (a fila com rede), `Atividade.tsx`

## Subtarefas

- [x] 51.1 — Caracterização, num commit antes: os cinco reenvios em `Promise.all` e a troca de alternativa, como hoje
- [x] 51.2 — Migration: `resposta_atividade.sequencia bigint not null default 0`, sob `lock_timeout`, e o schema Drizzle
- [x] 51.3 — `shared`: `sequencia` opcional no pedido e presente na resposta salva e na lida (`z.number().int().nonnegative()`)
- [x] 51.4 — O upsert grava só `where excluded.sequencia > resposta_atividade.sequencia`; o `PUT` que perde devolve a gravada; sem `sequencia`, grava `resposta_atividade.sequencia + 1`
- [x] 51.5 — A web: a fila manda `max(local, servidor) + 1`; a aba que perde adota a do servidor, não reenvia e mostra o aviso
- [x] 51.6 — Testes: os da tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/drizzle/0037_sequencia_da_resposta.sql`, `packages/nucleo/drizzle/meta/` | novo e alterado |
| `packages/nucleo/src/db/schema/resposta-atividade.ts` | alterado |
| `packages/shared/src/atividade/prova.ts`, `packages/shared/src/atividade/atividade.test.ts` | alterado |
| `apps/api/src/atividade/minha-atividade.repository.ts`, `minha-atividade.service.ts`, `minha-atividade.controller.ts` | alterado |
| `apps/api/src/atividade/atividade.int.test.ts` | alterado |
| `apps/web/src/areas/aluno/respostas.ts`, `respostas.test.ts`, `fila-de-respostas.ts`, `atividade.ts`, `Atividade.tsx` | alterado |
| `apps/web/src/areas/aluno/Atividade.test.tsx` | novo |
| `apps/web/src/api/atividades-do-aluno.ts` (o corpo do `PUT`), `apps/api/src/atividade/atividade-isolamento.int.test.ts`, `apps/web/src/areas/aluno/atividade.test.ts` (as respostas ganham `sequencia`) | alterado |
| `e2e/__fixtures__/aluno.ts`, `e2e/aluno-atividade.spec.ts` (a API simulada grava só a mais nova; os corpos têm `sequencia`) | alterado |
| `packages/nucleo/src/titular/leitura-do-titular.ts`, `docs/lgpd.md` (a coluna entra no arquivo do titular e na tabela de dados) | alterado |

## Testes que provam a regra

| Cenário | Tipo | Fica vermelho se (a mutação), ou o que prova |
|---|---|---|
| `sequencia` 5 e 7 em `Promise.all`, nas duas ordens → fica a 7, 20 repetições; e 6 com duas alternativas ao mesmo tempo → as duas respostas iguais à linha gravada | integração | a corrida prova que o banco decide (as duas vão a 200, uma linha só); a mutação do `where excluded.sequencia > …` é provada pelo caso sequencial seguinte, `a 5 que chega depois da 7`, que é determinístico |
| A 5 chega depois da 7 → responde 200 com a 7 gravada (alternativa e `sequencia`) | integração | tirar o `where excluded.sequencia > …` (o bloco de mutação cita este caso); devolver o que foi pedido |
| Cliente antigo (sem `sequencia`) e depois o novo com `servidor + 1` → o novo vence; o antigo sobe a sequência em 1 | integração | gravar 0 sem `sequencia` |
| Os cinco reenvios iguais continuam uma linha só | integração | caracterização |
| `sequencia` negativa, texto ou chave a mais → `ENTRADA_INVALIDA`, nada gravado | integração | sem `.strict()` |
| Aluno de A com a atividade de B → o mesmo 404 do inexistente | integração | tirar o `eq(…escolaId…)` |
| Depois do envio, `ATIVIDADE_ENCERRADA` com qualquer `sequencia` | integração | o prazo não muda |
| A fila manda `max(local, servidor) + 1`, e a escolha nova depois da leitura vence | unidade | mandar `local + 1` |
| A aba que perde adota a `sequencia` do servidor e não manda nada | unidade | "reenviar sobrescreve a mais nova" |
| Na tela: o aviso "Sua resposta foi alterada em outra janela" em `role="status"`, e a alternativa que ficou marcada | unidade | o aviso fora do `status`; a alternativa local |
| Migration aplicada sobre linhas antigas: todas com `sequencia` 0 | integração | sem `default 0` |

## Como testar

- A corrida: copie `apps/api/src/atividade/atividade.int.test.ts › o aluno responde › a resposta é gravada de forma
  idempotente: a mesma questão duas vezes, e cinco ao mesmo tempo depois da queda de rede, …` (o `Promise.all` de
  `rotas.responder`), trocando os cinco iguais por 5 e 7.
- O isolamento: o mesmo `describe`, com `montarEscolaComAssistente` duas vezes (A e B).
- A fila: `apps/web/src/areas/aluno/respostas.test.ts › a fila das respostas ainda não salvas › a última escolha da mesma
  questão é a que vale`, e `› o reenvio das respostas` para a rede.
- A tela: `renderizarTela` e `redeFalsa` (`apps/web/src/__fixtures__/tela.tsx`), no molde de
  `apps/web/src/areas/coordenacao/Governanca.test.tsx`.
- A migration: a última de `packages/nucleo/drizzle/` como molde, gerada pelo `drizzle-kit`, com `set lock_timeout`.
- Isolado: `npx vitest run --project integracao apps/api/src/atividade/atividade.int.test.ts` e
  `npx vitest run --project unidade apps/web/src/areas/aluno`.
- Armadilha: a tabela cresce com aluno (regra 80.8); a coluna nova não precisa de índice, porque a escrita já vai pelo
  índice único do escopo. A `sequencia` é do aluno da sessão: nunca vem com `alunoId`.

## Fora do escopo desta tarefa

O espelho em `sessionStorage` (53.0), o prazo do `fetch` e o "Tentar de novo" (52.0, X6) e o corte da tela (onda 4, X6).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A 51.1 (caracterização) não tem commit próprio: o teste `caracterização: cinco reenvios iguais ao mesmo tempo…` foi escrito e rodado verde **no código de antes**, e entra no commit único da tarefa | O hook bloqueia commit de `apps/` sem `(tarefa N.0)`, e com ele exige portão carimbado e rodada dos cinco revisores: um commit só de teste custaria uma rodada inteira. O teste vale igual antes e depois (sem `sequencia`, é o cliente antigo) | `onda-3c.md` T13, "51.0, a sequência" (a caracterização é a linha "Prova" da tabela de falha: "5 e 7 em `Promise.all` fica a 7; cliente antigo, depois o novo") |
| `e2e/__fixtures__/aluno.ts` e `e2e/aluno-atividade.spec.ts` entram nos arquivos da tarefa | A resposta do `PUT` passa a trazer `sequencia` (obrigatória), e a API simulada do e2e precisa gravar só a mais nova, como a real; as asserções dos corpos dos `PUT` passam a ter `sequencia` | `techspec.md` §3, tabela de rotas ("PUT … a resposta da prova ganha `sequencia`", 51.0); `onda-3c.md` T13 |
| A coluna `sequencia` entra no arquivo do titular (`leitura-do-titular.ts`) e em `docs/lgpd.md` | A guarda `arquitetura.test.ts` exige destino para toda coluna das tabelas que o arquivo lê (ficou vermelha no portão), e a regra 20 pede o campo novo na tabela de dados na mesma tarefa. A sequência diz quantas vezes o aluno trocou a escolha: entra, e não fica de fora | `onda-3c.md` T13, "51.0, a sequência" (último item); regra 20, itens 1 e 19 |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/api/src/atividade/minha-atividade.repository.ts
teste: apps/api/src/atividade/atividade.int.test.ts › a 5 que chega depois da 7
          set: { alternativa, sequencia: sql`excluded.sequencia`, respondidaEm: sql`now()` },
-          setWhere: sql`excluded.sequencia > ${respostaAtividade.sequencia}`,
        })
```

```mutacao
arquivo: apps/api/src/atividade/minha-atividade.repository.ts
teste: apps/api/src/atividade/atividade.int.test.ts › a mesma sequência com outra alternativa
-          setWhere: sql`excluded.sequencia > ${respostaAtividade.sequencia}`,
+          setWhere: sql`excluded.sequencia >= ${respostaAtividade.sequencia}`,
```

```mutacao
arquivo: apps/api/src/atividade/minha-atividade.repository.ts
teste: apps/api/src/atividade/atividade.int.test.ts › cliente antigo
-      ? gravar.onConflictDoUpdate({ target: alvo, set: { alternativa, sequencia: sql`${respostaAtividade.sequencia} + 1`, respondidaEm: sql`now()` } })
+      ? gravar.onConflictDoUpdate({ target: alvo, set: { alternativa, sequencia: sql`${respostaAtividade.sequencia}`, respondidaEm: sql`now()` } })
```

```mutacao
arquivo: apps/api/src/atividade/minha-atividade.repository.ts
teste: apps/api/src/atividade/atividade.int.test.ts › cliente antigo
-      .values({ escolaId: exigirEscolaDoContexto(), anoLetivoId: exigirAnoEmCurso(), atividadeAplicadaId, alunoId: sessaoDaRequisicao().usuarioId, questao, alternativa, sequencia: sequencia ?? 1 })
+      .values({ escolaId: exigirEscolaDoContexto(), anoLetivoId: exigirAnoEmCurso(), atividadeAplicadaId, alunoId: sessaoDaRequisicao().usuarioId, questao, alternativa, sequencia: sequencia ?? 0 })
```

```mutacao
arquivo: apps/api/src/atividade/minha-atividade.repository.ts
teste: apps/api/src/atividade/atividade.int.test.ts › a 5 que chega depois da 7
-      gravada !== undefined
+      gravada === undefined
        ? [gravada]
```

```mutacao
arquivo: apps/api/src/atividade/minha-atividade.repository.ts
teste: apps/api/src/atividade/atividade.int.test.ts › quem perde numa questão
-            .where(and(this.#minha(respostaAtividade, atividadeAplicadaId), eq(respostaAtividade.questao, questao)))
+            .where(this.#minha(respostaAtividade, atividadeAplicadaId))
```

```mutacao
arquivo: apps/api/src/atividade/minha-atividade.repository.ts
teste: apps/api/src/atividade/atividade.int.test.ts › quem perde numa questão
-            .where(and(this.#minha(respostaAtividade, atividadeAplicadaId), eq(respostaAtividade.questao, questao)))
+            .where(eq(respostaAtividade.questao, questao))
```

```mutacao
arquivo: apps/api/src/atividade/minha-atividade.service.ts
teste: apps/api/src/atividade/atividade.int.test.ts › a 5 que chega depois da 7
-      return atividades.responder(id, questao, alternativa, sequencia)
+      return atividades.responder(id, questao, alternativa)
```

```mutacao
arquivo: apps/api/src/atividade/minha-atividade.service.ts
teste: apps/api/src/atividade/atividade.int.test.ts › a 5 que chega depois da 7
-    return esquemaRespostaQuestaoSalva.parse({ questao: salva.questao, alternativa: salva.alternativa, sequencia: salva.sequencia, respondidaEm: salva.respondidaEm.toISOString() })
+    return esquemaRespostaQuestaoSalva.parse({ questao: salva.questao, alternativa: salva.alternativa, respondidaEm: salva.respondidaEm.toISOString() })
```

```mutacao
arquivo: apps/api/src/atividade/minha-atividade.service.ts
teste: apps/api/src/atividade/atividade.int.test.ts › 5 e 7 ao mesmo tempo
-      respostas: aberta.respostas.map(({ questao, alternativa, sequencia }) => ({ questao, alternativa, sequencia })),
+      respostas: aberta.respostas.map(({ questao, alternativa }) => ({ questao, alternativa })),
```

```mutacao
arquivo: packages/shared/src/atividade/prova.ts
teste: apps/api/src/atividade/atividade.int.test.ts › sequência negativa, fracionária
-export const esquemaSequencia = z.number().int().nonnegative()
+export const esquemaSequencia = z.number().int()
```

```mutacao
arquivo: packages/shared/src/atividade/prova.ts
teste: apps/api/src/atividade/atividade.int.test.ts › sequência negativa, fracionária
-export const esquemaSequencia = z.number().int().nonnegative()
+export const esquemaSequencia = z.number().nonnegative()
```

```mutacao
arquivo: packages/shared/src/atividade/prova.ts
teste: apps/api/src/atividade/atividade.int.test.ts › cliente antigo
-export const esquemaPedidoResponderQuestao = z.strictObject({ alternativa: esquemaAlternativa, sequencia: esquemaSequencia.optional() })
+export const esquemaPedidoResponderQuestao = z.strictObject({ alternativa: esquemaAlternativa, sequencia: esquemaSequencia })
```

```mutacao
arquivo: packages/shared/src/atividade/prova.ts
teste: apps/api/src/atividade/atividade.int.test.ts › 5 e 7 ao mesmo tempo
-export const esquemaRespostaSalva = z.strictObject({ questao: esquemaNumeroDaQuestao, alternativa: esquemaAlternativa, sequencia: esquemaSequencia })
+export const esquemaRespostaSalva = z.strictObject({ questao: esquemaNumeroDaQuestao, alternativa: esquemaAlternativa })
```

```mutacao
arquivo: packages/shared/src/atividade/prova.ts
teste: apps/api/src/atividade/atividade.int.test.ts › a 5 que chega depois da 7
  alternativa: esquemaAlternativa,
-  sequencia: esquemaSequencia,
  respondidaEm: z.iso.datetime(),
```

```mutacao
arquivo: packages/nucleo/drizzle/0037_sequencia_da_resposta.sql
teste: apps/api/src/atividade/atividade.int.test.ts › a migration 0037
-ALTER TABLE "resposta_atividade" ADD COLUMN "sequencia" bigint DEFAULT 0 NOT NULL;
+ALTER TABLE "resposta_atividade" ADD COLUMN "sequencia" bigint NOT NULL;
```

```mutacao
arquivo: packages/nucleo/drizzle/0037_sequencia_da_resposta.sql
teste: apps/api/src/atividade/atividade.int.test.ts › a migration 0037
-ALTER TABLE "resposta_atividade" ADD COLUMN "sequencia" bigint DEFAULT 0 NOT NULL;
+ALTER TABLE "resposta_atividade" ADD COLUMN "sequencia" bigint DEFAULT 0;
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a escolha entra na fila na hora
-  const sequencia = (estado.conhecidas[questao]?.sequencia ?? 0) + 1
+  const sequencia = (estado.conhecidas[questao]?.sequencia ?? 1) + 1
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a escolha entra na fila na hora
-    conhecidas: { ...estado.conhecidas, [questao]: { alternativa, sequencia } },
+    conhecidas: estado.conhecidas,
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a aba que perde adota a gravada
-    alteradas: estado.alteradas.filter((alterada) => alterada !== questao),
+    alteradas: estado.alteradas,
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › o servidor com a mesma alternativa e uma sequência maior
-  const perdeu = salva.sequencia !== noAr.sequencia || salva.alternativa !== noAr.alternativa
+  const perdeu = salva.alternativa !== noAr.alternativa
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › duas abas que leram a mesma sequência
-  const perdeu = salva.sequencia !== noAr.sequencia || salva.alternativa !== noAr.alternativa
+  const perdeu = salva.sequencia !== noAr.sequencia
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › quem troca de alternativa enquanto a anterior é salva
-  const eEla = (pendente: EscolhaPendente): boolean => pendente.questao === noAr.questao && pendente.sequencia === noAr.sequencia
+  const eEla = (pendente: EscolhaPendente): boolean => pendente.questao === noAr.questao
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › manda uma por vez
-  const eEla = (pendente: EscolhaPendente): boolean => pendente.questao === noAr.questao && pendente.sequencia === noAr.sequencia
+  const eEla = (pendente: EscolhaPendente): boolean => pendente.sequencia === noAr.sequencia
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › manda uma por vez
-    pendentes: estado.pendentes.filter((pendente) => !eEla(pendente)),
+    pendentes: estado.pendentes,
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › duas abas que leram a mesma sequência
-    conhecidas: salva.sequencia >= conhecida ? { ...estado.conhecidas, [noAr.questao]: { alternativa: salva.alternativa, sequencia: salva.sequencia } } : estado.conhecidas,
+    conhecidas: salva.sequencia > conhecida ? { ...estado.conhecidas, [noAr.questao]: { alternativa: salva.alternativa, sequencia: salva.sequencia } } : estado.conhecidas,
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › quem troca de alternativa enquanto a anterior é salva
-    conhecidas: salva.sequencia >= conhecida ? { ...estado.conhecidas, [noAr.questao]: { alternativa: salva.alternativa, sequencia: salva.sequencia } } : estado.conhecidas,
+    conhecidas: true ? { ...estado.conhecidas, [noAr.questao]: { alternativa: salva.alternativa, sequencia: salva.sequencia } } : estado.conhecidas,
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a escolha que o servidor grava como veio
-    alteradas: perdeu && estado.pendentes.some(eEla) ? [...estado.alteradas.filter((alterada) => alterada !== noAr.questao), noAr.questao] : estado.alteradas,
+    alteradas: perdeu ? [...estado.alteradas.filter((alterada) => alterada !== noAr.questao), noAr.questao] : estado.alteradas,
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a escolha que o servidor grava como veio
-    alteradas: perdeu && estado.pendentes.some(eEla) ? [...estado.alteradas.filter((alterada) => alterada !== noAr.questao), noAr.questao] : estado.alteradas,
+    alteradas: estado.pendentes.some(eEla) ? [...estado.alteradas.filter((alterada) => alterada !== noAr.questao), noAr.questao] : estado.alteradas,
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › uma leitura atrasada
-    if (conhecida !== undefined && lida.sequencia <= conhecida.sequencia) continue
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a aba que venceu mostra a sua
-    if (conhecida !== undefined && lida.sequencia <= conhecida.sequencia) continue
+    if (conhecida !== undefined && lida.sequencia < conhecida.sequencia) continue
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a leitura não passa por cima
-    if (conhecida !== undefined && lida.sequencia <= conhecida.sequencia) continue
+    if (lida.sequencia <= conhecida.sequencia) continue
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a leitura não passa por cima
-    if (pendenteDaQuestao(estado, lida.questao) !== undefined) continue
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a leitura não passa por cima
-    if (conhecida !== undefined) alteradas = [...alteradas.filter((alterada) => alterada !== lida.questao), lida.questao]
+    alteradas = [...alteradas.filter((alterada) => alterada !== lida.questao), lida.questao]
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a aba que venceu mostra a sua
-  return conhecidas === estado.conhecidas ? estado : { ...estado, conhecidas, alteradas }
+  return { ...estado, conhecidas, alteradas }
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a gravação que falha NÃO tira a escolha da fila
-  return { ...estado, noAr: undefined, falha: tipoDaFalha(codigo), tentativas: estado.tentativas + 1 }
+  return { pendentes: estado.pendentes, conhecidas: {}, alteradas: [], noAr: undefined, falha: tipoDaFalha(codigo), tentativas: estado.tentativas + 1 }
```

```mutacao
arquivo: apps/web/src/areas/aluno/respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a aba que perde adota a gravada
-  return estado.alteradas.includes(questao)
+  return estado.alteradas.length > 0
```

```mutacao
arquivo: apps/web/src/areas/aluno/fila-de-respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › o envio que perdeu para uma escolha mais nova
-    salvar(proximo.questao, proximo.alternativa, proximo.sequencia).then(
+    salvar(proximo.questao, proximo.alternativa, 1).then(
```

```mutacao
arquivo: apps/web/src/areas/aluno/fila-de-respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › o envio que perdeu para uma escolha mais nova
-        publicar(confirmarEnvio(estado, salva))
+        publicar(confirmarEnvio(estado, { alternativa: proximo.alternativa, sequencia: proximo.sequencia }))
```

```mutacao
arquivo: apps/web/src/areas/aluno/fila-de-respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a leitura da prova com uma escolha mais nova
    adotar: (lidas) => {
-      if (parada) return
      publicar(adotarLeitura(estado, lidas))
```

```mutacao
arquivo: apps/web/src/areas/aluno/fila-de-respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a resposta confirmada entra na prova lida
-  if (atual !== undefined && atual.sequencia > salva.sequencia) return prova
+  if (atual !== undefined && atual.sequencia >= salva.sequencia) return prova
```

```mutacao
arquivo: apps/web/src/areas/aluno/fila-de-respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a resposta confirmada entra na prova lida
-  if (atual !== undefined && atual.sequencia > salva.sequencia) return prova
```

```mutacao
arquivo: apps/web/src/areas/aluno/fila-de-respostas.ts
teste: apps/web/src/areas/aluno/respostas.test.ts › a resposta confirmada entra na prova lida
-  if (atual !== undefined && atual.sequencia > salva.sequencia) return prova
+  if (atual.sequencia > salva.sequencia) return prova
```

```mutacao
arquivo: apps/web/src/api/atividades-do-aluno.ts
teste: apps/web/src/areas/aluno/Atividade.test.tsx › a aba que perde adota a alternativa gravada
-  return chamarComSessao(`${caminhoDaAtividade(atividadeAplicadaId)}/respostas/${String(questao)}`, esquemaRespostaQuestaoSalva, { metodo: 'PUT', corpo: { alternativa, sequencia } })
+  return chamarComSessao(`${caminhoDaAtividade(atividadeAplicadaId)}/respostas/${String(questao)}`, esquemaRespostaQuestaoSalva, { metodo: 'PUT', corpo: { alternativa } })
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › a primeira abertura da atividade
-          {alteradaEmOutraJanela(estadoDaFila, numero) && <span className="min-w-0 break-words text-apoio">{AVISO_DE_OUTRA_JANELA}</span>}
+          {<span className="min-w-0 break-words text-apoio">{AVISO_DE_OUTRA_JANELA}</span>}
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › a aba que perde adota a alternativa gravada
-        <div role="status" data-resposta={marca} className="flex min-h-6 min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-base">
+        <div data-resposta={marca} className="flex min-h-6 min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-base">
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › a aba que venceu mostra a sua
  useEffect(() => {
-    if (respostasLidas !== undefined) fila.adotar(respostasLidas)
  }, [respostasLidas, fila])
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › a aba que venceu mostra a sua
-  }, [respostasLidas, fila])
+  }, [fila])
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › a aba que venceu mostra a sua
-    if (respostasLidas !== undefined) fila.adotar(respostasLidas)
+    fila.adotar(respostasLidas as never)
```

```mutacao
arquivo: apps/api/src/atividade/minha-atividade.repository.ts
teste: apps/api/src/atividade/atividade.int.test.ts › cliente antigo
          target: alvo,
-          set: { alternativa, sequencia: sql`excluded.sequencia`, respondidaEm: sql`now()` },
+          set: { alternativa, sequencia: sql`${respostaAtividade.sequencia}`, respondidaEm: sql`now()` },
           setWhere: sql`excluded.sequencia > ${respostaAtividade.sequencia}`,
```

```mutacao
arquivo: packages/nucleo/src/titular/leitura-do-titular.ts
teste: packages/nucleo/src/titular/leitura-do-titular.test.ts › as respostas do aluno saem com a
-    colunas: ['id', 'ano_letivo_id', 'atividade_aplicada_id', 'questao', 'alternativa', 'sequencia', 'respondida_em'],
+    colunas: ['id', 'ano_letivo_id', 'atividade_aplicada_id', 'questao', 'alternativa', 'respondida_em'],
```

```mutacao
arquivo: packages/nucleo/src/titular/leitura-do-titular.ts
teste: packages/nucleo/src/titular/leitura-do-titular.test.ts › as respostas do aluno saem com a
-      sql`select ${colunasDoSelect('id', 'ano_letivo_id', 'atividade_aplicada_id', 'questao', 'alternativa', 'sequencia', 'respondida_em')} from resposta_atividade t where t.escola_id = ${escolaId} and t.aluno_id = ${titularId}`,
+      sql`select ${colunasDoSelect('id', 'ano_letivo_id', 'atividade_aplicada_id', 'questao', 'alternativa', 'respondida_em')} from resposta_atividade t where t.escola_id = ${escolaId} and t.aluno_id = ${titularId}`,
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| tenancy-guardian (1ª) | Caso em que o aluno da A perde para uma `sequencia` mais alta sem que nada da B volte | Recusada: a própria revisão diz que é cobertura a mais, porque o alvo do conflito já é por escola; o caso da corrida com a mesma `sequencia` e o 404 de A com a atividade de B já passam pelo caminho de quem perde |
| frontend-reviewer (1ª) | Aviso com o que fazer ("Confira a alternativa marcada e, se quiser, escolha de novo") | Recusada: o texto "Sua resposta foi alterada em outra janela" é o da tabela de testes da tarefa e do T13, e a ordem não troca texto de tela. Vai ao Arquiteto na revisão do corte da tela (onda 4, X6) |
| frontend-reviewer (1ª), test-engineer (1ª) | Caso de e2e com duas páginas na mesma atividade, nos projetos `chromebook` e `celular` | `TODO.md`: entra na tarefa da X6 que fecha a outra aba e o F5 (53.0, o espelho em `sessionStorage`); a 51.0 deixou o aviso provado em unidade |
| frontend-reviewer (1ª) | Atividade em andamento na semente da vitrine | `TODO.md`: o arquivo é de `tools/vitrine/`, fora desta tarefa |
| infra-guardian (1ª) | Contrato na janela do deploy (web nova com API antiga, e aba antiga com API nova) | `TODO.md`: a nota de ordem de deploy vai em `docs/runbook.md`, que a tarefa não toca; fica com a primeira tarefa que mexer nele |
| infra-guardian (1ª) | `.max()` declarado em `esquemaSequencia` | `TODO.md`: muda o contrato do `shared` e o corpo recusado; decisão do Arquiteto |
| infra-guardian (1ª) | Cenário de carga da prova em `infra/k6/` | `TODO.md`: cabe junto da 52.0 e da 53.0 |
| infra-guardian (1ª) | Dizer nos fixtures `apps/api/test/atividade-de-teste.ts` e `e2e/__fixtures__/aluno-pela-api.ts` que o `PUT` sem `sequencia` é o cliente antigo | `TODO.md`: os dois arquivos não são da tarefa |
| revisor-geral (1ª) | Teste do titular com data fixa (`apps/api/test/arquivo-do-titular.int.test.ts`, 3 casos vencidos desde 19/10) | `TODO.md`, e correção própria antes do pouso: a esteira fica vermelha por isso até alguém corrigir, e não é desta tarefa (o Orquestrador é avisado no relatório) |
| revisor-geral (1ª) | Uma linha no `onda-3c.md` T13 sobre a 51.1 sem commit próprio | Recusada: a divergência já está escrita em "Divergências resolvidas" deste documento, com a coluna da spec preenchida; o `onda-3c.md` é do Arquiteto |
| frontend-reviewer (2ª) | Rótulo "Assistente · correção de objetiva" em linguagem corrente | Recusada: é o nome de função do agente (D17) e a regra 70, item 4a, pede a identidade visível; o próprio revisor diz que é só gosto |
| revisor-geral (2ª) | O caso concorrente usa o índice 10 e o 9 não é usado; usar o 9 com `length: 10`, ou pôr o caso no fim | Recusada: só a numeração dos alunos de teste, sem efeito no que o teste prova; mexer caduca as cinco aprovações |
| test-engineer (2ª) | Citar o nome completo do caso em paralelo no bloco de `51_task.md` que prova o `>` do `setWhere`, para ficar claro qual prova o `>` | Recusada: o prefixo casa os dois casos e ao menos um fica vermelho, como o próprio revisor confirma; mexer no bloco pede portão e rodada nova |
| test-engineer (2ª) | Comentário curto no caso em paralelo dizendo que só a resposta que perdeu relê a linha gravada | Recusada: a asserção de igualdade já pega o caminho se ele quebrar; cosmético, e mexer caduca as cinco aprovações |

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
| 2026-10-22 11:56:04 | 2026-10-22 11:56:39 | `tenancy-guardian` | 1 | APROVADO | acdb3b8d5df1c7bdc |
| 2026-10-22 11:56:12 | 2026-10-22 11:56:39 | `frontend-reviewer` | 1 | APROVADO | a2e9a3b25b7883c88 |
| 2026-10-22 11:56:01 | 2026-10-22 11:57:26 | `infra-guardian` | 1 | APROVADO | a0845ba92f75cec25 |
| 2026-10-22 11:56:15 | 2026-10-22 11:58:41 | `test-engineer` | 1 | REPROVADO | a5c95072f1aa3c9c3 |
| 2026-10-22 11:56:19 | 2026-10-22 11:59:26 | `revisor-geral` | 1 | APROVADO | a7457f8d4f40d49f9 |
| 2026-10-22 12:11:54 | 2026-10-22 12:12:11 | `infra-guardian` | 2 | APROVADO | ab113a951fe1499bc |
| 2026-10-22 12:12:01 | 2026-10-22 12:12:22 | `tenancy-guardian` | 2 | APROVADO | a1cb328351bbae09c |
| 2026-10-22 12:12:14 | 2026-10-22 12:12:34 | `frontend-reviewer` | 2 | APROVADO | aadf76f21a0a59039 |
| 2026-10-22 12:12:32 | 2026-10-22 12:12:57 | `revisor-geral` | 2 | APROVADO | a936e7dbe67d32960 |
| 2026-10-22 12:12:24 | 2026-10-22 12:13:14 | `test-engineer` | 2 | APROVADO | ae21caadea552dc1c |
