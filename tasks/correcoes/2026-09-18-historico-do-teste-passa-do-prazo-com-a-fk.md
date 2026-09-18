# Correção — a preparação de 100 mil jobs de histórico passa do prazo de 2 s do pool de teste desde a FK de `escola_id`

**Origem:** esteira run 35080942567 (commit `c86a25f`, tarefa 3.0, job integração)
**Subagentes obrigatórios:** `infra-guardian`, `test-engineer`

## Sintoma

`apps/despachante/test/metricas-espera.int.test.ts › carga: com 5.000 lotes da A à espera, a
medição não varre a tabela, e a contagem para no teto` falhou na esteira, na linha 137:

```
error: canceling statement due to statement timeout
 ❯ apps/despachante/test/metricas-espera.int.test.ts:137:5
Serialized Error: { code: '57014', where: 'SQL statement "SELECT 1 FROM ONLY "public"."escola" x
  WHERE "id" OPERATOR(pg_catalog.=) $1 FOR KEY SHARE OF x"' }
```

O `where` é a conferência da chave estrangeira: a instrução cancelada é a que insere o
histórico do teste, e não a medição que o teste quer provar.

## Causa

A tarefa 3.0 ligou `job_registro.escola_id` a `escola` por FK. Desde então, cada linha inserida
dispara uma consulta a `escola` para conferir a chave.

O teste prepara o cenário inserindo 100 mil linhas de histórico numa instrução só, pelo pool da
bancada, que tem `statement_timeout` de 2 s — o prazo do worker em produção, que vale para o que
o teste mede, não para a preparação dele.

Medido nesta máquina, a mesma instrução de 100 mil linhas:

| | tempo |
|---|---|
| com a FK (como está desde a 3.0) | 535 ms |
| sem a FK (`session_replication_role = replica`, só para medir) | 281 ms |

A FK quase dobra o custo da preparação. No runner da esteira, mais lento e com os outros
arquivos de integração disputando CPU, isso passou dos 2 s.

**Não é problema de produção.** Nenhum caminho do produto insere dezenas de milhares de jobs numa
instrução: o `enfileirar` grava um job por vez na transação de quem pede, e o custo da FK é de uns
2,5 µs por linha. A FK fica.

## Teste que reproduz

`apps/despachante/test/metricas-espera.int.test.ts › carga: com 5.000 lotes da A à espera…`,
com o prazo do pool da bancada baixado para 400 ms (só para a medição, e depois restaurado).

Nesta máquina a preparação leva 535 ms, então com o prazo real de 2 s o teste passa. Baixar o
prazo para 400 ms põe a máquina na mesma situação do runner da esteira, que é umas quatro vezes
mais lento.

**Vermelho, com o teste antigo e o prazo de 400 ms:**

```
error: canceling statement due to statement timeout
 ❯ apps/despachante/test/metricas-espera.int.test.ts:137:5
 Tests  1 failed | 3 skipped (4)
```

Mesma instrução e mesma linha da esteira.

**Verde, com a correção e o mesmo prazo de 400 ms:** `Tests 1 passed | 3 skipped (4)`. Com o
prazo restaurado para 2 s, o arquivo inteiro passou 4/4 em duas execuções seguidas.

## Correção

A bancada de fila ganhou `semear(texto, valores)`, que roda a preparação de volume com prazo de
60 s **nos dois lados**:

- no servidor, com `set local statement_timeout` numa transação própria;
- no cliente, com `query_timeout` na própria consulta. O `pg` herda do pool um prazo de cliente de
  2 s + 2 s de conexão, e ele cortaria sozinho em 4 s.

A primeira versão desta correção só subia o prazo do servidor, e o `test-engineer` a reprovou: o
helper dava 4 s, não os 60 s que o comentário prometia. A reprodução com 400 ms não mostrava isso,
porque o prazo do cliente ficava em 2,4 s e a preparação cabia nele.

O prazo de 2 s continua valendo para tudo o que o teste mede: a medição, o `EXPLAIN` e os
repositories seguem pelo pool normal. O comentário do helper diz que ele é só para preparação,
nunca para a instrução medida.

As três inserções de preparação do teste de carga (os 5.000 lotes à espera, os 100 mil de
histórico e as 10 mil linhas acima do teto da contagem) passaram a usar `semear`. O que o teste
prova não mudou: a medição não varre a tabela e a contagem para no teto.

Pela rodada 2 do `test-engineer`, entraram mais dois ajustes:

- o prazo do cliente é 5 s maior que o do servidor, para quem corta ser o Postgres, com o 57014
  legível, e a consulta não seguir rodando no servidor depois de o cliente desistir;
- o `analyze job_registro` sobre as 115 mil linhas também é preparação e passou a `semear`: no
  runner lento era a próxima instrução a bater nos 2 s.

Se a conexão cair no meio da preparação, o erro que sobe é o da preparação, e a conexão quebrada
sai do pool em vez de voltar para ele.

### O helper provado

`apps/worker/test/bancada.int.test.ts › semear passa dos 4 s do cliente e dos 2 s do servidor, e o
pool normal continua cortando em 2 s`:

- `pg_sleep(2.5)` pelo pool normal é cortado com 57014;
- `pg_sleep(4.5)` por `semear` termina.

Com a primeira versão do helper (sem o `query_timeout` do cliente), esse teste fica vermelho:

```
AssertionError: promise rejected "Error: Query read timeout" instead of resolving
 ❯ apps/worker/test/bancada.int.test.ts:19:57
```

Com a versão final, verde. O arquivo da medição também passa 4/4.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-18 00:06:15 | 2026-09-18 00:06:53 | `test-engineer` | 1 | APROVADO | a856012e32e436fd7 |
| 2026-09-18 00:07:22 | 2026-09-18 00:07:49 | `test-engineer` | 2 | APROVADO | a26c73cb70ac7b88e |
| 2026-09-18 00:07:55 | 2026-09-18 00:08:58 | `infra-guardian` | 1 | APROVADO | a432a57511bcabc33 |
| 2026-09-18 00:10:30 | 2026-09-18 00:10:41 | `test-engineer` | 3 | APROVADO | adb27b20c8823a491 |
| 2026-09-18 00:10:45 | 2026-09-18 00:10:58 | `infra-guardian` | 2 | APROVADO | a4cd630c86285c6e8 |
