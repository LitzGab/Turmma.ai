# Tarefa 9.0 — Alerta de código errado em massa, `ops:revogar-acessos-sala` e a carga K1/K2

**Funcionalidade:** apresentacao-escola · **Depende de:** 8.0 · **Paralelo com:** 10.0, 11.0 a 16.0
**Subagentes obrigatórios:** `infra-guardian`, `tenancy-guardian`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Um ataque distribuído ao código da turma dispara um alerta com runbook; o operador revoga numa linha todos os acessos
da escola que o log aponta; e a rajada de seis turmas, e a do primeiro dia da escola inteira, ficam versionadas e
passam na régua do login do F1.

## Contexto necessário

- `docs/infra.md` 3.1 (a régua do login) e 3.5; `docs/runbook.md`, "Código da turma errado em massa numa escola"
  (já escrita: o comando e o campo do log que ela cita precisam bater com o código)
- `techspec.md` seções 6 (o comando) e 7c (alerta, carga, limites)
- `cenarios.md`: E29, L11, L12, K1, K2
- `revisao-spec.md`, rodada 5: o L11 pelo leitor de argumentos e pela constante do evento, não por texto do runbook
- Regras 10 (item 9), 20 (item 9), 40, 80 (itens 10, 11)
- Código:
  - `apps/api/src/ops/revogar-convite.ts` e `comando.ts` — o modelo: `parseArgs`, o UUID pelo `zod`,
    `ArgumentoInvalido` com saída 2, `lerOperador`, `abrirBancoDeOperacao`, `autorDoComando`; o script em
    `package.json`
  - `infra/grafana/alertas/login-rebaixado-por-escola.yaml`, `infra/test/alertas.test.ts`,
    `alertas.int.test.ts`, `infra/scripts/ensaio-alertas.ts`, `tools/guardas/alerta-tem-runbook.test.ts`
  - `infra/k6/login-7h30.js`, `infra/scripts/carga-login.ts`, `conferir-carga-login.ts`, `infra/test/carga.test.ts`,
    `infra/compose.carga.yml` — o padrão da carga do F1, com o adaptador de hash calibrado

## Notas da 6.0 (`infra-guardian`, 1ª rodada)

- A reivindicação usa o mesmo `SemaforoDeHash` do login e soma em `login.hash_recusado` e em `login.hash_espera`. O
  alerta `login-hash-recusado` divide o recusado por `login_duracao_seconds_count`, que só conta login: no primeiro dia,
  com muitas reivindicações e poucos logins, a razão sobe sem o login piorar. Decidir aqui: dizer no runbook
  (`docs/runbook.md`, a entrada do alerta) que a reivindicação usa o mesmo semáforo, ou separar o 503 dela por rótulo, ou
  somá-la ao denominador.

## Notas da 7.0 (`infra-guardian`, `revisor-geral` e `privacy-guardian`, 1ª rodada)

- Com o Redis de fila fora, o teto do nome no seguro vira `max(1, floor(5 / instâncias))`: com 3 ou mais instâncias, uma
  matrícula errada trava o nome por 10 min. Decidir aqui um piso para o teto do nome no seguro, ou citar o efeito na sala
  no runbook do `seguro-limite-ativo`.
- O `LimitesDaSala.esperandoOCodigo` pode virar gauge por instância junto com o alerta, para ver o acúmulo na espera de 1 s.
- O parágrafo do runbook diz que, enquanto o slug for alvo, toda entrada pelo código da escola espera 1 s, e que a espera
  não limita o volume do atacante (só o `rl:ip` limita): a resposta é revogar.
- O runbook diz também que qualquer um com o link trava um nome por 10 min com cinco matrículas erradas, e que o "Gerar
  novo" destrava.

## Nota da 8.0 (`infra-guardian`, 1ª rodada)

- O K2, na variante do primeiro dia, deve incluir o professor decidindo em lotes de 40 (`POST /v1/reivindicacoes/decidir`)
  e o aprovado entrando logo depois: é o trecho que cria os 2.100 usuários, e o p95 do `decidir` (até 40 transações de
  ~10 comandos) precisa ser medido contra os 2 s da regra 00, item 4. Medir também com o Redis de login lento (2ª rodada):
  o zerar dos contadores das aprovadas roda uma vez, depois do lote, em paralelo.

## Subtarefas

- [x] 9.1 — `ops:revogar-acessos-sala --escola <id>`: exige `OPERADOR` antes de tocar no banco; monta o contexto da
  escola do id como os outros `ops:*`, sem `@SemEscopo` novo; o `update` pelo repository com o escopo; um
  `acesso_turma.revogado` por acesso, com `autor_operador`; imprime só a contagem. Id que não é UUID:
  `ArgumentoInvalido`, saída 2; inexistente: `NAO_ENCONTRADO`
- [x] 9.2 — `infra/grafana/alertas/sala-codigo-errado-por-escola.yaml`: `sala_limite_atingido_total{tipo="escola"}`
  somado entre as instâncias, sem agrupar por escola nem por usuário, acima de 10 por minuto, `for: 5m`; a entrada do
  runbook conferida e completa
- [x] 9.3 — `infra/k6/reivindicacao-em-sala.js` (K1: 6 × 35 em 5 min, 20% de código e 10% de matrícula errados,
  pares disputando o mesmo nome, o login de outra escola junto) e a variante do primeiro dia (K2: 2.100 em 5 min),
  com nomes gerados, o script de conferência e o `npm run` no padrão da carga do login
- [x] 9.4 — Testes (portão com `--infra`)

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/ops/revogar-acessos-sala.ts`, `revogar-acessos-sala.test.ts`, `apps/api/src/sala/acesso-da-turma.repository.ts` | novo, alterado |
| `package.json` | alterado |
| `infra/grafana/alertas/sala-codigo-errado-por-escola.yaml`, `infra/test/alertas.test.ts`, `alertas.int.test.ts`, `infra/scripts/ensaio-alertas.ts` | novo, alterado |
| `infra/k6/reivindicacao-em-sala.js`, `infra/scripts/carga-sala.ts`, `conferir-carga-sala.ts`, `infra/test/carga.test.ts` | novo, alterado |
| `apps/api/test/ops-revogar-acessos-sala.int.test.ts`; `docs/runbook.md` | novo, alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| E29 | integração | revoga todos os vigentes de A, link e código respondem `NAO_ENCONTRADO`, uma auditoria por acesso, B intacta; a segunda execução revoga zero; sem `OPERADOR`, recusa antes do banco |
| L11 | unidade | a regra com limiar e `for:`, a entrada do runbook; o leitor de argumentos do comando aceita um UUID, e o campo do log vem da constante do evento `sala.limite_atingido` |
| L12 | infra | ataque sustentado: pendente e depois disparada; a rajada do primeiro dia nem fica pendente; cessado, volta a normal |
| K1, K2 | carga | zero duplicidade, zero 5xx, e o p95 do login da outra escola na régua do F1 |
| concorrência | integração, em paralelo | duas execuções do comando com `Promise.all`: uma auditoria por acesso, nenhuma em dobro |
| log novo | integração | a saída do comando e o log só com a contagem e ids: nada de slug, código nem IP |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%, também `npm run test:infra`
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --infra`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Bloqueio de IP na borda e ler IP das chaves `rl:ip`: não existem na A1 (`TODO.md`, staging, D42). O teste de carga
não chama provedor pago (regra 80, item 11).

## Decisões sobre as notas das tarefas anteriores

- **6.0, o semáforo dividido com a reivindicação:** fica no runbook, sem mudar o alerta. A entrada "Login recusado pelo
  semáforo do hash" ganhou a causa 5: a reivindicação soma no recusado e na espera, não no denominador, e o primeiro dia
  sobe a razão sem o login piorar; o painel "Reivindicações de nome na sala" (`indisponivel`) separa os dois. Separar por
  rótulo mudaria uma métrica do F1 e o alerta, e somar ao denominador esconderia o 503 da própria reivindicação.
- **7.0, o teto do nome no seguro:** sem piso no código; o efeito está no runbook, "Seguro de limite ativo", causa 5
  (com duas instâncias, duas matrículas erradas travam o nome; com três ou mais, uma; o "Gerar novo" destrava). É
  degradação só com o Redis de fila fora, e o piso mudaria o teto que o L7 prova.
- **7.0, o gauge de `esperandoOCodigo`:** não vira gauge. Cada pedido que entra na espera já soma em
  `sala.limite_atingido{tipo="escola"}`, que é o que o alerta lê, e a resposta do runbook é revogar, não olhar o
  acúmulo. O docblock do getter diz isso.
- **7.0, os dois parágrafos do runbook:** a entrada do alerta diz que a espera de 1 s não limita o volume (só o `rl:ip`
  limita) e que a resposta é revogar (Impacto), e que qualquer um com o link trava um nome por 10 min com cinco matrículas
  erradas, com o "Gerar novo" destravando (causa 3).
- **8.0, o `decidir` no K2:** o professor, com seis turmas, aprova em lotes de até 40 a cada 45 s, e cada aprovado entra
  logo depois; o p95 do `decidir` tem threshold de 2 s, também na fase `k2_redis_lento`, com o Redis de fila pausando os
  clientes 80 ms a cada 100 ms.

## Divergências resolvidas nesta tarefa

- **O `update` do comando não filtra o ano** (`AcessoDaTurmaRepository.revogarVigentesDaEscola`): o comando do operador
  não tem ano no contexto, e o E29 pede "todos os acessos vigentes de A". Um vigente de outro ano não abre a sala (o
  `AcessoDaSala` exige o ano `em_curso`) e cair junto não tira nada de ninguém. Na Tech Spec, seção 6.
- **A existência da escola** é o `AcessoDaEscolaRepository.nome` dentro da transação do comando, que passou a aceitar
  transação: sem ela, o id inexistente imprimiria zero, e o E29 pede `NAO_ENCONTRADO`. Na Tech Spec, seção 6.
- **A saída do comando é `{"revogados":N}`**, em JSON como o `ops:escola` e o `ops:uso`. Na Tech Spec, seção 6.
- **O evento do log vira constante** (`EVENTO_DO_LIMITE_DA_SALA`), mas a chamada do log continua com o texto literal:
  a guarda `log-sem-dado-pessoal` do lint só aceita literal no `evento`. O L11 compara a linha escrita com a constante.
- **K1 e K2** (cenarios.md, K1 e K2, com o texto do código): a outra escola sai do segundo container do compose de carga
  (`k6-atacante`), com IP próprio, como uma escola em outra rede; o "zero 5xx" conta também o 503 que a página repete
  (a Tech Spec diz "zero 5xx", sem exceção); a disputa pelo nome é a mesma matrícula de dois computadores, com chaves
  diferentes, porque com a matrícula de outro a recusa é a da matrícula errada e não a corrida (C1); e a fase
  `k2_redis_lento` é a medição que a nota da 8.0 pediu.
- **O teste de unidade da carga** fica em `infra/test/carga-sala.test.ts`, e não em `carga.test.ts`: o login do F1 tem
  o dele (`carga-login.test.ts`), e o da sala segue o mesmo corte.
- **A rajada do primeiro dia do L12** é um teste próprio em `alertas.int.test.ts`, depois do ensaio, e não parte dele:
  a regra soma as escolas, então a rajada só prova "nem pendente" com o ataque parado.

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|
| `apps/api/src/sala/acesso-da-turma.repository.ts:97`, a escola do contexto no `update` | `ops-revogar-acessos-sala.int.test.ts`, E29 (B intacta) e concorrência |
| `acesso-da-turma.repository.ts:97`, `revogado_em is null` | E29 (a segunda execução revoga zero; o derrubado pelo "Gerar novo" sem auditoria) e concorrência |
| `acesso-da-turma.repository.ts:97`, `expira_em > now()` | E29 (o vencido fica como estava; a contagem é 2) e concorrência |
| `apps/api/src/ops/revogar-acessos-sala.ts:54`, a escola existe | E29, escola inexistente é `NAO_ENCONTRADO` |
| `revogar-acessos-sala.ts:56`, uma auditoria por acesso | E29 e concorrência |
| `revogar-acessos-sala.ts:52`, o autor da conferência na auditoria | E29 (`autor_operador` = `OPERADOR`) |
| `revogar-acessos-sala.ts:76`, `lerOperador` obrigatório | E29, sem `OPERADOR` |
| `revogar-acessos-sala.ts:79`, `autorDoComando(operador)` (trocado por aceitar o apelido direto) | `ops-operador.int.test.ts`, C2, caso `revogar-acessos-sala` (recusa `ninguem`, `bruno` desativado e `fundadora` com operador ativo) |
| `revogar-acessos-sala.ts:76`, `lerOperador` antes de `abrirBanco` | `revogar-acessos-sala.test.ts`, sem `OPERADOR` sem abrir o banco |
| `revogar-acessos-sala.ts:39`, `z.uuid()` no leitor | `revogar-acessos-sala.test.ts` e o L11 de `infra/test/alertas.test.ts` |
| `infra/grafana/alertas/sala-codigo-errado-por-escola.yaml:26`, `for: 5m` | L11, `infra/test/alertas.test.ts` |
| `sala-codigo-errado-por-escola.yaml:68`, limiar 10 | L11 |
| `sala-codigo-errado-por-escola.yaml:47`, sem agrupar (com `by (escola_id)`) | L11 |
| `docs/runbook.md:409`, o comando com `--escola <escolaId do log>` | L11 (a entrada cita o comando com a opção que o leitor aceita) |
| `apps/api/src/sala/limites-da-sala.ts:171`, o evento `sala.limite_atingido` | L11 (a linha escrita traz a constante) |
| `limites-da-sala.ts:171`, o campo `escolaId` | L11 (o comando recebe o campo da linha) |
| `infra/scripts/conferir-carga-sala.ts:71`, nome com dois pedidos | `infra/test/carga-sala.test.ts`, conferência de duplicidade |
| `infra/scripts/carga-sala.ts:122`, 20% de código errado | `carga-sala.test.ts` |
| `carga-sala.ts:203`, a outra escola medida no K1 e no K2 | `carga-sala.test.ts`, veredito |
| `infra/k6/reivindicacao-em-sala.js:125`, threshold da disputa | `carga-sala.test.ts`, thresholds |

O L12 (`alertas.int.test.ts`) roda só no `--infra` do portão final: a regra que dispara pelo ensaio e a rajada do primeiro
dia que nem fica pendente não têm mutação rodada à mão (o ensaio leva uns 10 min por rodada); a rajada prova a métrica
emitida só acima do teto pelo aumento dela, zero, durante 420 códigos errados.

## Resultado da carga (`npm run carga:sala`, 27/09/2026, 15 min, passou)

| Fase | Alunos | Aprovados uma vez | 5xx | `decidir` p95 (máx.) | Maior lote | Login da outra escola p95 | Segurados no teto da escola |
|---|---|---|---|---|---|---|---|
| k1 | 210 | 210 | 0 | 129 ms (130) | 33 | 39 ms | 0 |
| k2 | 2.100 | 2.100 | 0 | 778 ms (1.415) | 40 | 272 ms | 0 |
| k2_redis_lento | 420 | 420 | 0 | 215 ms (215) | 40 | — | 0 |

Banco: nenhum nome com dois pedidos, nenhum aluno a mais, nenhuma credencial a mais, nenhum aluno com dois vínculos,
nenhum pedido esperando no fim; disputas com um vencedor só; todos os aprovados entraram. A primeira execução completa
reprovou no K2 com seis 503 do semáforo no login dos aprovados, que o k6 mandava todos no mesmo milissegundo (40 hashes de
uma vez, sem repetir o 503 como a web): o aprovado passou a entrar um depois do outro, repetindo o 503 como a web, e o 503
continua contando em "zero 5xx". Registrado aqui porque a régua não mudou, e o modelo da entrada sim.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `revisor-geral`, 1ª | Leitura de existência com nome próprio no repository de escola da operação, em vez do `AcessoDaEscolaRepository.nome` | Recusada: o repository de escola da operação (`ops/escola.repository.ts`) é o da criação, com os dois `@SemEscopo` contados pelo teste dele; a leitura com escopo pela escola do contexto já existe no `AcessoDaEscolaRepository`, e reaproveitá-la é o que o passo 2 da skill pede |
| `infra-guardian`, 1ª | Critério para a entrada do aprovado na fase `k2_redis_lento` ("entrou em até 30 s") | `/validar`: é decisão de régua, e a fase mede o `decidir`, que é o que a nota da 8.0 pediu |
| `privacy-guardian`, 1ª | Ação ou finalidade própria para a revogação pelo operador, separada da do professor, se o dossiê (D61) precisar | `/retro` e a tarefa do dossiê (D61): hoje o `autor_operador` separa as duas |
| `test-engineer`, 2ª | A escola montada no `beforeAll` da C2 fica no banco de teste | `/retro`, junto do acúmulo no banco de teste (regra 40): segue o padrão dos outros testes de sala, e as consultas filtram pelo id |
| `revisor-geral`, 2ª | Usar `EVENTO_DO_LIMITE_DA_SALA` no `logger.warn` em vez do literal | Recusada: a guarda `log-sem-dado-pessoal` do lint só aceita texto literal no `evento` (ver "Divergências"); o L11 pega a divergência entre os dois |
| `infra-guardian`, 2ª | Conferir as duas turmas de B também no teste de concorrência | Recusada: ali B tem um acesso só, e o E29 já prova B com dois |
| `test-engineer`, 1ª | Carga com dois alunos de mesmo nome na mesma turma | Recusada: o E24 prova o homônimo com a matrícula de cada um, e a corrida pelo nome é a do pedido (C1), que a disputa da carga já exercita; o nome igual não muda o caminho quente |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-27 04:35:14 | 2026-09-27 04:37:07 | `test-engineer` | 1 | REPROVADO | a439bcf48ea078ae3 |
| 2026-09-27 04:48:20 | 2026-09-27 04:49:01 | `test-engineer` | 2 | APROVADO | aae9e5527a914c797 |
| 2026-09-27 04:49:26 | 2026-09-27 04:50:14 | `tenancy-guardian` | 1 | APROVADO | ae980de1500dfe321 |
| 2026-09-27 04:49:30 | 2026-09-27 04:50:29 | `privacy-guardian` | 1 | APROVADO | a2698713f28e52582 |
| 2026-09-27 04:49:20 | 2026-09-27 04:51:24 | `infra-guardian` | 1 | APROVADO | ade8ac2905016507a |
| 2026-09-27 04:49:14 | 2026-09-27 04:51:51 | `revisor-geral` | 1 | REPROVADO | acfe72b047a7b74a6 |
| 2026-09-27 05:02:34 | 2026-09-27 05:03:26 | `test-engineer` | 3 | APROVADO | afedafb8feeaa2716 |
| 2026-09-27 05:13:03 | 2026-09-27 05:13:28 | `test-engineer` | 4 | APROVADO | a1f928153949a53b7 |
| 2026-09-27 05:13:37 | 2026-09-27 05:13:57 | `revisor-geral` | 2 | APROVADO | a4f538a7cdc3495a5 |
| 2026-09-27 05:13:44 | 2026-09-27 05:14:08 | `infra-guardian` | 2 | APROVADO | ae7179be50c9f2b8c |
| 2026-09-27 05:13:49 | 2026-09-27 05:14:11 | `tenancy-guardian` | 2 | APROVADO | ac1cdb52603fb8354 |
| 2026-09-27 05:13:54 | 2026-09-27 05:14:13 | `privacy-guardian` | 2 | APROVADO | a52d101af468f7f33 |
