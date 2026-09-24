# Achados das revisões — `tasks/correcoes/2026-09-24-escola-da-bancada-fora-de-ordem.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-24 16:04:57 · `tasks/correcoes/2026-09-24-escola-da-bancada-fora-de-ordem.md`

VEREDITO: APROVADO

Os testes continuam provando as duas regras, a correção resolve a falha e a reprodução é determinística. Não rodei os dois testes: o ambiente de teste do compose estava em uso, e o teste de reexecução para os processos da fila e apaga a tabela de efeitos, então rodá-lo ali atrapalharia outra execução. Conferi pela leitura do diff e dos arquivos inteiros.

**Cenários exigidos**
- Caminho feliz da medição: as filas das escolas A e B saem em séries separadas, com espera, pendentes e vagas certas por escola.
- Isolamento na reexecução: o job de A e o de B, reexecutados em sequência na mesma réplica, gravam cada um no escopo do próprio job, e não no da execução anterior.
- A ordem ruim fixada: a escola A com o id maior, para que qualquer asserção que dependa da ordem dos ids falhe sempre, e não em metade das vezes.
- Alcance: nenhum outro teste que compara duas escolas pode supor que o id cresce com a criação.

**Cobertos**
- **A reprodução é determinística.** Nos dois `beforeEach` (`apps/worker/test/reexecucao.int.test.ts:50` e `apps/despachante/test/metricas-espera.int.test.ts:46`), a linha `[ESCOLA_B, ESCOLA_A] = (…).sort()` põe a B com o id menor. O `randomUUID()` gera texto em minúsculas, e o Postgres compara uuid byte a byte, então a ordem do texto é a mesma do `order by escola_id`. As asserções antigas falhariam sempre: a leitura dos efeitos vem na ordem B, A contra o esperado A, B, e as chaves ordenadas vêm na ordem `interativa:B, interativa:A, lote:A` contra `interativa:A, interativa:B, lote:A`.
- **O isolamento na reexecução continua provado** (`reexecucao.int.test.ts:273-294`). O mapa `escolaDaReexecucao` confere a escola do contexto em cada reexecução. E `toHaveLength(2)` junto com `arrayContaining` das duas linhas exatas equivale a comparar os conjuntos. Como a chave primária é `(escola_id, chave_idempotencia)`, uma reexecução no escopo errado gravaria uma terceira linha, e o teste falha. Se a regra for removida, ele quebra.
- **As séries separadas por escola continuam provadas** (`metricas-espera.int.test.ts:86-94`). A lista de chaves ordenada dos dois lados só tira a dependência de ordem. Os valores são conferidos por chave com escola, e `pendentes` e `vagasEmUso` usam `toEqual` sobre objeto, que não depende da ordem das chaves.
- **Não sobrou outra suposição de ordem nos dois arquivos.** O teste de permissão compara `interativa:A` com `normal:sistema`, e essa ordem é fixa pelo nome da fila. O teste de borda tem uma chave só, e os outros casos da reexecução usam uma escola só.
- **A bancada continua sorteando UUID v4**, que é o que o produto grava agora. Voltar a v7 só esconderia a suposição.
- **Nada de `.skip`**, teste comentado, mock que esconda a regra ou chamada a provedor de IA.

**Bloqueantes**
Nenhum.

**Recomendações**
- A varredura com ids decrescentes rodou só o projeto `integracao`. O projeto `infra` ficou de fora: `infra/test/borda.int.test.ts` e `infra/test/alertas.int.test.ts` também chamam `sessoes.escola()`. Pela leitura, cada teste de lá usa uma escola só e nenhum compara escolas por ordem de id, então não há falha escondida. Vale uma linha no documento da correção dizendo que o projeto `infra` foi conferido por leitura, para a evidência de alcance ficar completa.
- Fixar a ordem ruim tira da cobertura o caso com A menor que B. Nenhuma das duas regras depende de qual escola vem primeiro, então não bloqueia. Se algum dia um teste precisar das duas ordens, o caminho é parametrizar com as duas, e não voltar ao sorteio.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-24-escola-da-bancada-fora-de-ordem.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/reexecucao.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/metricas-espera.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/fila-de-teste.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-de-teste.ts

## infra-guardian · 1ª rodada · APROVADO · 2026-09-24 16:05:57 · `tasks/correcoes/2026-09-24-escola-da-bancada-fora-de-ordem.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A correção mexe só em teste e comentário. Toca a bancada da fila, e o código de produção da fila não mudou.
Rate limit: não se aplica, nada mudou nele.
Fila e prioridade: ok. Conferi por leitura que o rodízio não depende da ordem do id da escola. `apps/despachante/src/despachante.ts:146-152` (`emRodizio`) começa cada rodada por uma escola diferente, então o `order by fila, escola_id` de `packages/nucleo/src/fila/despacho.repository.ts:126-137` só serve para percorrer o índice. Isso não dá preferência a nenhuma escola. Id UUID v4 no painel e no `ops:escola` não é problema de desenho.
Concorrência: protegida. Não houve mudança. O teste de isolamento da reexecução continua provando o escopo, porque `toHaveLength(2)` junto com `arrayContaining` pega tanto a linha a mais quanto a linha gravada na escola trocada. A comparação do `Map` de `escolaDaReexecucao` não depende da ordem.
Índice e paginação: ok. Não há query nova. O teste de carga com `EXPLAIN` em `metricas-espera.int.test.ts` continua sem mudança e não depende de ordem.
Degradação de IA: não se aplica.
Migration: não se aplica.
Métrica e alerta: ok. As asserções de série por `fila:escola_id` continuam a mesma cobertura, agora sem supor ordem. Olhei também as linhas 104, 106 e 119 do mesmo arquivo, que a correção não mexeu: nenhuma depende da ordem entre A e B.
Bloqueantes: nenhum.
Recomendações:
- `apps/worker/test/reexecucao.int.test.ts:50` e `apps/despachante/test/metricas-espera.int.test.ts:46`: a ordem ruim ficou fixa num só sentido, com A tendo o id maior. Se alguém escrever depois uma asserção que suponha o contrário (A > B), ela passa sempre e ninguém percebe. Vale deixar registrado no comentário que as duas ordens já foram conferidas pela varredura com gerador decrescente descrita na correção. Outra saída é inverter a ordem num segundo `describe`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-24-escola-da-bancada-fora-de-ordem.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/reexecucao.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/metricas-espera.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/fila-de-teste.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-de-teste.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/src/despachante.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/fila/despacho.repository.ts
