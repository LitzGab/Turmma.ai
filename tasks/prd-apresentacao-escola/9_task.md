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

## Subtarefas

- [ ] 9.1 — `ops:revogar-acessos-sala --escola <id>`: exige `OPERADOR` antes de tocar no banco; monta o contexto da
  escola do id como os outros `ops:*`, sem `@SemEscopo` novo; o `update` pelo repository com o escopo; um
  `acesso_turma.revogado` por acesso, com `autor_operador`; imprime só a contagem. Id que não é UUID:
  `ArgumentoInvalido`, saída 2; inexistente: `NAO_ENCONTRADO`
- [ ] 9.2 — `infra/grafana/alertas/sala-codigo-errado-por-escola.yaml`: `sala_limite_atingido_total{tipo="escola"}`
  somado entre as instâncias, sem agrupar por escola nem por usuário, acima de 10 por minuto, `for: 5m`; a entrada do
  runbook conferida e completa
- [ ] 9.3 — `infra/k6/reivindicacao-em-sala.js` (K1: 6 × 35 em 5 min, 20% de código e 10% de matrícula errados,
  pares disputando o mesmo nome, o login de outra escola junto) e a variante do primeiro dia (K2: 2.100 em 5 min),
  com nomes gerados, o script de conferência e o `npm run` no padrão da carga do login
- [ ] 9.4 — Testes (portão com `--infra`)

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

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%, também `npm run test:infra`
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --infra`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Bloqueio de IP na borda e ler IP das chaves `rl:ip`: não existem na A1 (`TODO.md`, staging, D42). O teste de carga
não chama provedor pago (regra 80, item 11).

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
