# Correção — o teste do despejo da falha exige o `|` do prefixo do compose, que não faz parte da promessa

**Origem:** esteira run 40095652612 (job integração), `tools/ci/compose.int.test.ts › o despejo da falha sai cruzável`; passou na `develop` em `aad6d14`.
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`, `infra-guardian`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. `revisor-geral`: a correção toca `tools/ci/`, que o passo 5 de `corrigir` obriga. -->

## Sintoma

`AssertionError: linha sem carimbo do Docker: postgres-1    2026-10-24T13:04:00.513760237Z 2026-10-24 13:04:00.511 UTC [66] FATAL:  terminating connection due to admi: expected undefined to be defined`
(`tools/ci/compose.int.test.ts:263`). A linha **traz** o carimbo do Docker, inteiro e no lugar certo; o que ela não traz é o `|`
do prefixo: `postgres-1` e quatro espaços, onde o compose imprime `postgres-1  | ` (`postgres-1` + dois espaços + `| `). O teste
só aceitava o prefixo com `|`.

## Fora desta correção

Nada: nenhuma tarefa em curso. A M1 da retro da X7 já está no commit anterior desta branch.

Também não entra: descobrir por que o `docker compose logs` entregou aquela linha sem o `|`. Ver "Causa".

## Causa

**O teste checava mais do que o despejo promete.** O que o despejo da falha promete é o carimbo do Docker logo depois do
prefixo, que é o que ordena linhas de serviços diferentes (`ETAPA_DO_LOG_DA_FALHA`, `--timestamps`). O `|` é a apresentação
do compose, e a regex `^(\S+)\s+\|\s+(carimbo)\s` o tornava obrigatório. Basta uma linha em que o compose não o imprima para o
teste ficar vermelho sem que o despejo tenha perdido nada do que importa.

**O que não se achou:** por que o compose entregou aquela linha sem o `|`. Não reproduz: 350 execuções do mesmo
`compose logs --no-color --timestamps --tail 15 postgres redis-fila` (150 em série e 200 em 16 processos paralelos) contra um
ambiente de teste de pé deram só linhas com `|`. A mesma linha, no despejo que a esteira fez sobre os mesmos contêineres seis
minutos depois, saiu com `|`. Um caractere perdido numa saída de ferramenta de fora é o que sobra; não é bug do repositório,
e a correção não finge que sabe mais do que isso. A mensagem da asserção passa a mostrar a linha com `JSON.stringify`, para a
próxima ocorrência dizer qual caractere veio no lugar.

## Teste que reproduz

`tools/ci/despejo-da-falha.test.ts › lê a linha da esteira 40095652612, a que chegou sem o `|` do prefixo mas com o carimbo do Docker`
(a linha literal do log da esteira). Vermelho antes (`expected undefined to be 'postgres-1'`), verde depois.

Não dá para reproduzir a intermitência em si (ver "Causa"); o que substitui o vermelho do `compose logs` é a linha literal
da esteira como entrada de uma função pura, e a prova da estabilidade do caso de integração, abaixo.

**Estabilidade:** `npx vitest run --project integracao tools/ci/compose.int.test.ts -t "o despejo da falha sai cruzável"`, dez vezes
seguidas: 10 de 10 verdes (24/10/2026, nesta árvore). Isso prova que o caso não regrediu; não prova que a linha sem `|` não volta, e
para isso vale a unidade com a linha literal.

## Correção

- `tools/ci/despejo-da-falha.ts` (novo): `lerLinhaDoDespejo(linha)`, a regex que estava dentro do teste, com o `|` opcional
  e o nome do serviço começando por letra (sem isso, com o `|` opcional, um carimbo solto passaria por nome de serviço). Continua
  exigindo o carimbo do Docker (`T` e `Z` literais) logo depois do prefixo: os carimbos do Postgres, do Redis e do Caddy, e o
  deslocamento `-03:00`, seguem recusados.
- `tools/ci/compose.int.test.ts`: usa `lerLinhaDoDespejo`; a mensagem da asserção mostra a linha com `JSON.stringify`.
- `tools/ci/despejo-da-falha.test.ts` (novo): a linha da esteira, a linha de sempre, o carimbo sem fração, e as recusas.

## Mutações

Sai: o `|` volta a ser obrigatório.

```mutacao
arquivo: tools/ci/despejo-da-falha.ts
teste: tools/ci/despejo-da-falha.test.ts › lê a linha da esteira 40095652612, a que chegou sem o `|` do prefixo mas com o carimbo do Docker
-const PARTIDA = /^([A-Za-z][\w.-]*)\s+(?:\|\s+)?(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z)\s/
+const PARTIDA = /^([A-Za-z][\w.-]*)\s+\|\s+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z)\s/
```

Sai: o serviço começar por letra, que impede um carimbo de passar por nome de serviço.

```mutacao
arquivo: tools/ci/despejo-da-falha.ts
teste: tools/ci/despejo-da-falha.test.ts › recusa dois carimbos e nenhum serviço: o primeiro não é nome de serviço
-const PARTIDA = /^([A-Za-z][\w.-]*)\s+(?:\|\s+)?(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z)\s/
+const PARTIDA = /^(\S+)\s+(?:\|\s+)?(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z)\s/
```

Sai: a recusa do carimbo no formato certo e impossível.

```mutacao
arquivo: tools/ci/despejo-da-falha.ts
teste: tools/ci/despejo-da-falha.test.ts › recusa carimbo no formato certo e impossível, de mês 13
-  if (Number.isNaN(instante)) return undefined
+  void instante
```

Sai: a recusa de linha sem o carimbo (grupos ausentes).

```mutacao
arquivo: tools/ci/despejo-da-falha.ts
teste: tools/ci/despejo-da-falha.test.ts › recusa carimbo do próprio Postgres, sem o do Docker
-  if (partida === null) return undefined
+  if (partida === null) return { servico: '', instante: 0 }
```

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-24 10:42:45 | 2026-10-24 10:43:19 | `infra-guardian` | 1 | APROVADO | af39e8d37eb99c2e8 |
| 2026-10-24 10:42:44 | 2026-10-24 10:43:22 | `revisor-geral` | 1 | APROVADO | ad7c0f0dda6737e0c |
| 2026-10-24 10:42:43 | 2026-10-24 10:43:31 | `test-engineer` | 1 | APROVADO | a6b19607456db49b0 |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | Mover `despejo-da-falha.ts` (e o teste) para `tools/testes/` | Recusada: o próprio revisor oferece o comentário como saída, que é o item 4. A mudança de pasta troca o caminho de dois arquivos, das quatro mutações e dos imports, e muda a linha de guardiões do caminho (`tools/testes/` pede os quatro, `tools/ci/` pede só `infra-guardian`); não é barata nem sem efeito sobre o contrato do processo. |
| 2026-10-24 10:48:31 | 2026-10-24 10:48:46 | `revisor-geral` | 2 | APROVADO | a84ed9764e68db382 |
| 2026-10-24 10:48:23 | 2026-10-24 10:48:52 | `test-engineer` | 2 | APROVADO | a44fbcb729ae23a59 |
