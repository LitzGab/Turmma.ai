# Correção — a consolidação noturna de uso para para todas as escolas numa escola que não existe mais

**Origem:** uso (achado na correção `2026-09-25-l4-depende-do-tamanho-do-banco`, registrado no `TODO.md`, "Infra e operação")
**Subagentes obrigatórios:** infra-guardian, tenancy-guardian, privacy-guardian
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

Com uma pasta `escolas/<uuid>/` no storage de uma escola que não está no banco, `sistema.consolidar-uso` falha inteiro com
`uso_infra_diario_escola_id_escola_id_fk` (23503), e nenhuma escola depois dela é consolidada. No local, 9 dos 12 testes de
`apps/worker/test/uso.int.test.ts` ficam vermelhos quando só o banco de teste é recriado.

## Causa

`criarConsolidacaoDeUso` descobre as escolas em dois lugares sem escopo, e nenhum deles é o banco:
- `ContadorDeUso.lerDiasFechados` varre `uso:<dia>:<uuid>:req|jobs` no Redis de fila. A chave nasce no `marcar`, com a
  escola do contexto, e vive até a consolidação apagá-la ou até vencer em 35 dias;
- `MedidorDeStorage.listarEscolas` lista as pastas `escolas/<uuid>/` do bucket. O SeaweedFS guarda a pasta vazia depois
  que os objetos saem (conferido no compose de teste: só o `DeleteObject` de `escolas/<id>/` a tira da listagem).

Para cada escola achada, o processador grava `uso_infra_diario`, que tem FK para `escola`, e um erro qualquer interrompia o
laço. Uma escola eliminada, ou um banco recriado com o storage de antes, dava 23503 na primeira gravação dela, e as
escolas seguintes, dos contadores e do storage, ficavam sem consolidar. O mesmo acontecia com um valor que o banco recusa:
texto num contador (22P02, conferido) ou um dia que não existe na chave, que o formato `\d{4}-\d{2}-\d{2}` deixa
passar (`2026-02-30`). E um erro de listagem numa pasta parava a medição de todas as outras.

O id que não é UUID já não chega aqui: os dois lados filtram pelo formato (`FORMATO_CHAVE` e `FORMATO_UUID`).

## Teste que reproduz

`apps/worker/test/uso.int.test.ts › uma escola não para a consolidação das outras (regra 80, item 3)`. Em todos, a escola
recusada vem **antes** da boa: a pasta órfã tem id que começa com zeros, e o contador é lido com a recusada na frente
(`contadorComPrimeiro`). Assim, um `break` no lugar do `continue` fica vermelho. As contagens de log e métrica
consideram só as escolas do teste, e a métrica, que não leva escola, é conferida contra os avisos do log. `guardar` registra
toda pasta do caminho, e o `afterEach` apaga a pasta vazia (conferido: o bucket termina vazio).
- `reprodução: pasta e contador de uma escola que não existe no banco, antes de uma escola real…`: pasta `escolas/<uuid>/`
  e contador criado pelo `marcar`, os dois de uma escola que o banco não tem, e uma escola real com contador e bytes.
  Vermelho antes, com `uso_infra_diario_escola_id_escola_id_fk` (23503). Verde depois: a real consolidada, a órfã pulada e
  contada, log só com ids e erro resumido, o contador órfão no Redis com TTL, e a reexecução sem mudar nada.
- `valor inválido num contador (texto, dia que não existe, negativo)…`: 22P02, 22008 e 23514. Vermelho antes (22P02), verde
  depois.
- `banco fora, ou recusa que não é da escola, não vira escola pulada…`: conexão recusada, 57P01 e 23503 de outra
  restrição sobem. É o controle do que não pode ser engolido, e fica verde antes e depois.
- `erro de storage numa pasta…`: vermelho antes (a escola depois da pasta com erro ficava sem bytes), verde depois.
- `pastas com erro espalhadas (erro, ok, erro, ok, erro)…`: as cinco medidas, as boas gravadas, e a falha no fim com o
  primeiro erro. Prova que "seguidas" é seguidas.
- `storage fora no meio da medição: desiste depois de 3 pastas seguidas…`: prova o limite novo. Antes, a primeira pasta
  com erro já parava tudo; o teste garante que pular a pasta com erro não vira esperar o prazo de cada escola com o storage
  fora.
- `trilha completa…` (já existia) ganhou a pasta órfã e o medidor na montagem: prova que `montarWorker` passa o medidor à
  rotina.

Os testes não perderam força. Com `causaNaEscola` tratando qualquer erro como escola inexistente, `banco fora` fica
vermelho. Sem o `throw` do fim e sem o limite de falhas seguidas, os dois testes de storage ficam vermelhos.

## Correção

- `consolidar-uso.ts`: a gravação de cada escola passa por `causaNaEscola`. 23503 na `uso_infra_diario_escola_id_escola_id_fk`
  vira `escola_inexistente`. Classe 22 (dado inválido) e 23514 (a checagem de não negativo) viram `valor_invalido`. A
  gravação é pulada, e o laço segue. Qualquer outro erro sobe como antes (conexão, prazo, 57P01), e o job falha para a
  fila tentar de novo. Erro na medição de uma pasta vira `erro_de_storage`: as outras escolas são medidas e gravadas, e o
  job falha no fim com esse erro. Com 3 pastas seguidas com erro (`FALHAS_DE_STORAGE_SEGUIDAS_ATE_DESISTIR`), falha na
  hora, porque é o storage fora.
- Cada pulo gera um `uso.escola_ignorada` no log, com `escolaId`, `origem`, `causa` e `resumirErro(erro)`, sem mensagem nem
  valor de linha. Gera também a métrica nova `uso.escola_ignorada` (`uso_escola_ignorada_total`), por `origem` e `causa`,
  sem `escola_id`, com painel "Uso por escola pulado na consolidação". O `uso.consolidado` ganha `ignoradasTotal`.
- **Destino do contador órfão: fica no Redis e vence sozinho** pelo prazo do `marcar` (35 dias). O que não pôde ser gravado
  não é apagado. Um worker apontado para o banco errado, ou uma restauração pela metade, faria todas as escolas parecerem
  inexistentes, e apagar perderia o uso de todas. Deixar a chave é idempotente por construção: a reexecução lê, pula e
  conta de novo, e não muda nada (D49). O custo é a chave aparecer na métrica toda noite até vencer. A escola eliminada
  não tem mais token nem job, e por isso não ganha chave nova.
- Sem alerta. A pasta de uma escola eliminada aparece toda noite, e o erro de storage já falha o job, que é o que a
  pendência de "rotina do sistema que parou de rodar" (`TODO.md`) vai vigiar. O parágrafo por causa está em
  `docs/runbook.md`, "Rotina do sistema sem rodar".
- `montagem.ts` passa o medidor à rotina. `METRICAS` e `NOMES_NO_PROMETHEUS` ganham a métrica, e o `fundacao.json` ganha o
  painel, porque o `painel.test.ts` exige painel para toda métrica.
- A linha do `TODO.md` saiu.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.
| 2026-09-25 08:15:03 | 2026-09-25 08:17:01 | `test-engineer` | 1 | REPROVADO | ad7e02a6f248145b0 |
| 2026-09-25 08:19:17 | 2026-09-25 08:20:51 | `test-engineer` | 2 | APROVADO | a41c1e2a20a90b20b |
| 2026-09-25 08:21:03 | 2026-09-25 08:21:30 | `tenancy-guardian` | 1 | APROVADO | a43de4b01683997e7 |
| 2026-09-25 08:21:07 | 2026-09-25 08:21:49 | `privacy-guardian` | 1 | APROVADO | a4af2254738077cbe |
| 2026-09-25 08:20:58 | 2026-09-25 08:21:59 | `infra-guardian` | 1 | APROVADO | a5876bb233d7a922c |
| 2026-09-25 08:21:14 | 2026-09-25 08:22:05 | `revisor-geral` | 1 | REPROVADO | aba313377c2160e18 |
| 2026-09-25 08:48:14 | 2026-09-25 08:48:24 | `revisor-geral` | 2 | APROVADO | ad4e5004ac66046d2 |
