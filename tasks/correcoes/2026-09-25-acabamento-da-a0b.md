# Correção — o acabamento da A0b que a retrospectiva deixou aberto

**Origem:** `tasks/prd-apresentacao-painel/retro.md` ("Pendências de código") e `validacao.md` (rodada 2, seções 4 e 6),
com as recomendações de revisor sem destino das tarefas 3.0 a 10.0 (`tasks/prd-apresentacao-painel/achados/`)
**Subagentes obrigatórios:** revisor-geral, tenancy-guardian, infra-guardian, privacy-guardian
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

Nove acabamentos da mesma funcionalidade (painel da operação, A0b), cada um pequeno: dois comentários que afirmam o que o
código não faz, uma entrada da matriz do convite que diz outra coisa que a Tech Spec, um filtro de defesa em
profundidade que faltava, um texto de cenário sem prova literal e outro fora do cenário, uma frase larga demais no
`docs/lgpd.md`, um caminho morto que inventava `requisicaoId`, e a consolidação de uso terminando em sucesso quando
nenhuma escola encontrada existe no banco. Os que não cabem aqui foram para o `TODO.md`, com destino.

## Causa, teste e correção, item a item

Antes de cada mudança, o item foi conferido no código (`develop` em `0cb7100`): os nove estavam abertos.

| # | Onde | Causa | Teste que prova (vermelho antes, verde depois) | Correção |
|---|---|---|---|---|
| 1 | `packages/shared/src/operacao/eu.ts:3-10` | O comentário de `FORMATO_OPERADOR` dizia que os checks do banco "são gerados desta expressão". São escritos à mão no schema e na migration; o que os liga é o teste que os compara | não há regra nova: comentário. A prova do que ele passa a dizer é `packages/nucleo/src/db/formato-do-operador.int.test.ts` (já existente) | O comentário diz a verdade: definição única no código, checks por extenso no banco, e o teste que os compara |
| 2 | `packages/shared/src/operacao/painel.ts`, `REVOGAR_CONVITE_POR_ESTADO.sem_convite` | Valia `conflito`; a tabela da Tech Spec (seção 5) e a rota dizem `NAO_ENCONTRADO` (o id não acha convite de coordenação, e a resposta sai antes da matriz). O tipo já tinha `nao_encontrado`, e só o servidor lê a entrada (a tela só procura `revogar`) | `packages/shared/src/operacao/painel.test.ts › a matriz do convite da coordenação é a da Tech Spec › revogar: …` (vermelho com `conflito`) | A entrada passa a `nao_encontrado`, com o porquê no docblock. Comportamento igual: na corrida com o expurgo (o único jeito de alcançá-la) a resposta já era `NAO_ENCONTRADO`, por `revogado() === undefined`; agora sai pela matriz. `REFAZER_…sem_convite` fica `conflito` (o tipo não tem `nao_encontrado`), já marcada como inalcançável; o teste a fixa também. `techspec.md` (seção 5) e o docblock de `revogarConvitePeloOperador` dizem isso |
| 3 | `apps/api/src/sessao/convite.repository.ts`, `revogarParaRefazer` | O `where` não tinha `tipo = 'coordenador'`. Quem chama já achou a escola por um convite de coordenação, mas o repository não se defendia sozinho (`tenancy-guardian` da 3.0) | `apps/api/src/sessao/convite.repository.int.test.ts › revogarParaRefazer só alcança convite de coordenação: um convite em aberto de outro tipo, pelo id, fica em aberto`. Numa transação que volta atrás, o check `convite_tipo_valido` sai e o convite vira `professor`; sem o filtro, o refazer o revogava e devolvia o usuário (vermelho visto) | `eq(convite.tipo, 'coordenador')` no `where`, e o docblock diz por quê |
| 4 | `apps/web/src/operacao/textos.test.ts` | O texto do 401 era conferido contra o catálogo e só pelo começo ("Entre de novo"): se o catálogo mudasse, o W10 ficava falso e tudo verde | o próprio teste, agora com o texto por extenso. Mutação: `MENSAGENS_DE_ERRO.SESSAO_ENCERRADA` trocado para "…Entre de novo." deixa-o vermelho (antes, verde) | `toBe('Sua sessão terminou. Entre de novo para continuar.')` |
| 5 | `tasks/prd-apresentacao-painel/cenarios.md` (W10) | O `NAO_ENCONTRADO` do gerar ("Essa escola não foi encontrada. A lista foi atualizada.") estava em `textos.ts` e no teste, fora da lista fechada do W10 | `textos.test.ts:75` (já existente, confere o texto por extenso) | O W10 lista o texto; o comentário de `TEXTO_DA_ESCOLA_QUE_NAO_EXISTE`, que dizia "o cenário W10 não o lista", foi acertado |
| 6 | `docs/lgpd.md:107` | "O único dado de pessoa que passa pelo painel" é mais largo que o fato: o painel também recebe e-mail, senha e segundo fator do operador | documento | "O único dado de pessoa **da escola**…", com remissão à linha "Conta de operador Turmma" |
| 7 | `apps/api/src/operacao/segundo-fator.service.ts:177` | `contextoAtual() ?? { requisicaoId: randomUUID() }`: o middleware abre o contexto em toda requisição HTTP, e o serviço só é chamado pelo controller. Sem contexto é falha de montagem, e inventar um id a esconde | `apps/api/test/segundo-fator-operador.int.test.ts › fora do contexto da requisição (falha de montagem), \`entrar\` recusa com ERRO_INTERNO antes de tudo: o desafio não é gasto e nenhuma sessão abre` (vermelho: a sessão abria) | `entrar` confere o contexto como primeira instrução e lança `ErroDeDominio(ERRO_INTERNO)` antes de gastar o desafio; a linha `operacao.contador_nao_zerado` usa esse contexto. A falha fica no começo, e não no log, porque o log sai depois da sessão gravada, e a resposta de quem entrou não pode virar erro ali |
| 8 | `apps/api/src/sessao/hash-do-token.ts:3-7` | Docblock de arquivo solto, seguido de outro docblock (`revisor-geral` da 10.0). `apps/api/src/operacao/token-do-convite.ts` tinha o mesmo desenho | comentário | Os dois viram comentário de módulo (`//`), e o de `token-do-convite.ts` aponta de onde vem a peça |
| 9 | `apps/worker/src/processadores/consolidar-uso.ts` | Quando todas as escolas encontradas (contador e storage) são inexistentes no banco, cada uma era pulada e o job terminava em sucesso sem gravar nada: o worker apontado para o banco errado passava despercebido | `apps/worker/test/uso.int.test.ts › todas as escolas encontradas inexistentes no banco (o worker apontado para outro banco): …` (vermelho: o job concluía); `› a escola real conta de onde vier: …` e `› sem escola nenhuma encontrada …` fixam os limites | Cada uma continua pulada, contada e logada; no fim, se o conjunto das encontradas não é vazio e está todo em `escola_inexistente`, `uso.nenhuma_escola_no_banco` no log (só `encontradasTotal`) e `FalhaDeJob(ERRO_INTERNO)`, não definitiva. Uma inexistente entre escolas que existem continua só pulada (a "reprodução" da correção `2026-09-25-consolidacao-para-na-escola-inexistente` segue verde). Parágrafo novo em `docs/runbook.md` ("Escola pulada na consolidação de uso", causa 1) |

### Das pendências do `TODO.md`, conferidas e fechadas aqui

- **Títulos C32 e C36b dizendo `rl:ip`:** já fechados na 2ª rodada da 9.0; os títulos dizem `rl:ip:op`
  (`apps/api/test/sessao-operador.int.test.ts:413,470`). Nada a fazer.
- **O `Partial<>` que contornava o total do expurgo (9.0):** o código não o usa, mas a regra de lint deixava. A regra de
  `apps/worker/src/processadores/**` passa de `objectLiteralTypeAssertions: 'never'` para `assertionStyle: 'never'`
  (`eslint.config.mjs`): nenhuma afirmação de tipo, e `as const` continua valendo. Prova: o trecho
  `const t: Partial<Totais> = {}; for (…) t[alvo] = 0; return t as Totais` passa com a regra antiga e é reprovado com a
  nova; os processadores reais passam limpos. A prova ficou permanente (recomendação do `test-engineer`, 1ª rodada):
  `tools/guardas/guardas.test.ts › processadores do worker: nenhuma afirmação de tipo …`, com a fixture
  `tools/guardas/__fixtures__/afirmacao-de-tipo-no-processador.ts` pelo ESLint do repositório no caminho de um processador.
- As outras dez foram para o `TODO.md` ("Pendências de código da A0b", na seção "Processo e dívida do F0"), com arquivo e
  destino. O `desfazer` do contador continua aberto e é defeito: foi como `/corrigir` próprio. O mesmo caminho morto do
  item 7 em `apps/api/src/operacao/painel.service.ts:62` foi junto, porque lá a falha fechada pede outro lugar.

## Mutações

| Cláusula | Teste vermelho |
|---|---|
| `painel.ts`, `REVOGAR_CONVITE_POR_ESTADO.sem_convite: 'nao_encontrado'` → `'conflito'` | `painel.test.ts › … revogar` |
| `convite.repository.ts`, `eq(convite.tipo, 'coordenador')` no `revogarParaRefazer`, apagado | `convite.repository.int.test.ts › revogarParaRefazer só alcança convite de coordenação …` |
| `textos.test.ts`, o catálogo `SESSAO_ENCERRADA` trocado | `textos.test.ts › o 401 leva à entrada …` |
| `segundo-fator.service.ts`, `if (requisicao === undefined) throw …`, apagado (e o `?? { requisicaoId }` restaurado) | `segundo-fator-operador.int.test.ts › fora do contexto da requisição …` |
| `consolidar-uso.ts`, `encontradas.size > 0 &&` apagado | `uso.int.test.ts › sem escola nenhuma encontrada …` e `› concorrência …` |
| `consolidar-uso.ts`, `every` → `some` | `› reprodução …`, `› a escola real conta de onde vier …`, `› trilha completa …` |
| `consolidar-uso.ts`, `inexistentes.add` apagado | `› todas as escolas encontradas inexistentes …` |
| `consolidar-uso.ts`, `encontradas` só do storage | `› a escola real conta de onde vier …`, `› trilha completa …` |
| `consolidar-uso.ts`, `encontradas` só do contador | `› reprodução …`, `› todas as escolas encontradas inexistentes …`, `› a escola real conta de onde vier …` |
| `consolidar-uso.ts`, `encontradasTotal` de `escolas.length` (só o storage) | `› todas as escolas encontradas inexistentes …` (3 contra 2) |
| `consolidar-uso.ts`, o `throw` apagado | `› todas as escolas encontradas inexistentes …` |
| `eslint.config.mjs`, o bloco da regra valendo para `apps/**/*.ts` | `guardas.test.ts › … vale só nos processadores …` |
| `eslint.config.mjs`, `assertionStyle: 'never'` → a regra anterior | `guardas.test.ts › processadores do worker: nenhuma afirmação de tipo …` (a linha 18 da fixture deixa de ser reprovada) |

## Recomendações dos revisores

Aplicadas num lote, com todos os revisores da primeira passada terminados:

- `test-engineer` (1ª): o caso "todas inexistentes" com uma órfã só no contador (três encontradas, duas pastas), a chave
  `encontradasTotal` no lugar de `escolasTotal`, a prova permanente da regra de lint e o comentário do `alter table`;
  (2ª) a mutação de `encontradasTotal` registrada e o `lintar` com as regras por parâmetro, em vez de repetir o miolo;
  (3ª) o controle negativo de escopo da regra de lint (fora dos processadores, a mesma fixture passa).
- `infra-guardian`: o título do teste não promete alerta; o runbook diz "Sem alerta" e aponta a pendência do alerta de
  rotina parada, que agora cita `uso.nenhuma_escola_no_banco`.
- `revisor-geral`: a exceção do runbook cobre qualquer noite em que todas as encontradas sejam eliminadas, e a pendência
  da eliminação de escola diz que o resto de uso agora derruba o job; o item "Consolidação" de
  `tasks/prd-fundacao-tecnica/techspec.md` diz o que acontece com escola inexistente; a linha do W10 voltou à quebra.
- `privacy-guardian`: `docs/lgpd.md` cita também o nome e o apelido do operador, na sessão.
- Segunda passada: o docblock e o comentário de `consolidar-uso.ts` admitem a noite de só resto de escola eliminada, como o
  runbook (`infra-guardian`); as linhas longas do W10 e do `docs/lgpd.md` foram quebradas (`revisor-geral`,
  `privacy-guardian`).
- `tenancy-guardian`: a pendência do caminho morto no `TODO.md` inclui o `refazerConviteDaCoordenacao`, com a
  observação de que no gerar e no revogar o fallback é vivo (os comandos `ops:*` rodam sem requisição).

Sem aplicar: a do `tenancy-guardian` sobre `REFAZER_CONVITE_POR_ESTADO.sem_convite` passar a `nao_encontrado` junto com o
tipo se um dia ficar alcançável. É condicional a uma mudança que não existe; o docblock da entrada já a marca como
inalcançável e o teste a fixa, e quem a tornar alcançável vê o teste vermelho. E a do `test-engineer` (4ª) de subir o
nome da fixture e o conjunto de regras para o `describe`: são duas linhas repetidas em dois `it` vizinhos, sem efeito no
que se prova, e cada `it` segue legível sozinho.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-25 16:11:01 | 2026-09-25 16:12:48 | `test-engineer` | 1 | APROVADO | a3416962b9bee829c |
| 2026-09-25 16:43:20 | 2026-09-25 16:43:57 | `test-engineer` | 2 | APROVADO | acd79dfc39de51759 |
| 2026-09-25 16:44:37 | 2026-09-25 16:45:05 | `tenancy-guardian` | 1 | APROVADO | a60403b662c819455 |
| 2026-09-25 16:44:51 | 2026-09-25 16:45:30 | `privacy-guardian` | 1 | APROVADO | a070fd8233bbb1859 |
| 2026-09-25 16:44:45 | 2026-09-25 16:45:34 | `infra-guardian` | 1 | APROVADO | aeac37bf8f902e70a |
| 2026-09-25 16:44:30 | 2026-09-25 16:46:32 | `revisor-geral` | 1 | APROVADO | ab37aa5c9b1a9b442 |
| 2026-09-25 17:16:50 | 2026-09-25 17:17:15 | `test-engineer` | 3 | APROVADO | afe443d3a5af7b884 |
| 2026-09-25 17:18:04 | 2026-09-25 17:18:23 | `test-engineer` | 4 | APROVADO | a2659279bd9c06031 |
| 2026-09-25 17:47:13 | 2026-09-25 17:47:39 | `tenancy-guardian` | 2 | APROVADO | a014f7e6f6e3fadd7 |
| 2026-09-25 17:47:18 | 2026-09-25 17:47:43 | `infra-guardian` | 2 | APROVADO | a2a6394383b82c40d |
| 2026-09-25 17:47:23 | 2026-09-25 17:47:45 | `privacy-guardian` | 2 | APROVADO | afa1d53a2b4a0f1d4 |
| 2026-09-25 17:47:08 | 2026-09-25 17:47:47 | `revisor-geral` | 2 | APROVADO | af6446b3f701faafb |
| 2026-09-25 18:17:37 | 2026-09-25 18:17:53 | `revisor-geral` | 3 | APROVADO | addff6af0e01dfbba |
