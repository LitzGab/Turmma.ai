# Tarefa 16.0 — Sessão e operação validam pelo esquema, com a ordem dos erros caracterizada

**Funcionalidade:** reengenharia · **Depende de:** 14.0, 11.0
**Subagentes obrigatórios:** `tenancy-guardian`, `infra-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

`sessao/` e `operacao/` validam pelos decorators da 14.0, com a ordem 401 antes de 400 caracterizada e mantida, sem
gastar tentativa da conta com entrada inválida.

## Contexto necessário

- `onda-1a.md` §2, "T1 — Borda de entrada" (o `@IdDoCaminhoOuNada` do `redefinir-mfa`, o `@DoCaminho` do `slug` e do
  `provedor`, e "Antes da 16.0"); `techspec.md` §6 e §7c
- `prd.md` RF5; `.claude/rules/80-infra-e-carga.md` itens 1 e 7 (limite por conta, não por IP), `10-multitenancy.md` item 6
- `apps/api/src/sessao/mfa.controller.ts:37` (`extrairTokenBearer` antes do `safeParse`) e
  `apps/api/src/sessao/redefinir-mfa.controller.ts:20-25` (corpo primeiro; id inválido devolve 202 sem efeito)
- A 11.0 já separou `login.service`: os controllers de login chamam os arquivos novos dela

## Subtarefas

- [ ] 16.1 — Caracterização, num commit antes: a ordem dos erros em `mfa`, `sessao/mfa` e `redefinir-mfa`, e o 404 do `slug` e do `provedor`
- [ ] 16.2 — Migram os 12 controllers de `sessao/` e os 6 de `operacao/`
- [ ] 16.3 — Os dois módulos saem da lista de pendentes
- [ ] 16.4 — Testes: os da tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sessao/*.controller.ts`, `apps/api/src/sessao/externa/externa.controller.ts` | alterado |
| `apps/api/src/operacao/*.controller.ts` (6) | alterado |
| `packages/nucleo/src/entrada/` (a lista de pendentes) | alterado |
| `apps/api/test/{mfa,login-email,sessao-matricula,sessao-externa,acesso-da-escola,troca-de-escola,semaforo-de-login}.int.test.ts` | alterado |
| `apps/api/test/{entrada-operador,segundo-fator-operador-concorrencia,painel-leitura,painel-escrita}.int.test.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`.

| Cenário | Tipo | Fica vermelho se (a mutação), ou o que prova |
|---|---|---|
| `POST /v1/mfa/ativar` sem `Authorization` e com corpo inválido → 401 | integração | o pipe antes do token |
| `POST /v1/sessao/mfa` com desafio inválido e corpo inválido → 401 | integração | o pipe antes do desafio |
| `POST /v1/sessao/mfa` com desafio válido e corpo inválido → `ENTRADA_INVALIDA`, sem gastar tentativa | integração | o pipe passar `undefined` |
| Login por e-mail ou matrícula com corpo inválido → `ENTRADA_INVALIDA`, sem tentativa nem `registro_acesso` | integração | inválido não alimenta a trava |
| Login com corpo inválido conta no balde por IP da rota anônima como hoje | integração | a guarda de limite vem antes (regra 80.1) |
| 35 logins do mesmo IP ao mesmo tempo, verdes depois | integração | o limite por conta não muda |
| A mesma matrícula com o `slug` de A e de B entra em cada uma | integração | o esquema não perde o `slug` |
| `slug` fora do formato → o 404 do inexistente | integração | responder 400 |
| `provedor` desconhecido → o mesmo 404 | integração | responder 400 |
| `redefinir-mfa`: id fora do formato e corpo válido → 202, sem efeito | integração | `@IdDoCaminho` (404) |
| `redefinir-mfa`: id fora do formato e corpo inválido → 400 | integração | validar o id antes |
| `redefinir-mfa`: id de coordenador de B, no contexto de A → 202, MFA dele intacto | integração | tirar o `eq(usuario.escolaId, …)` |
| Troca para escola sem vínculo → o erro da escola inexistente | integração | regra 10.6 |
| Entrada do operador com corpo inválido conta no `rl:ip:op` como hoje | integração | o limite da operação não muda |
| Dois segundos fatores do operador ao mesmo tempo, verdes | integração | concorrência mantida |
| Painel com consulta paginada inválida → `ENTRADA_INVALIDA` | integração | o `safeParse` do `painel.controller.ts` sai |
| Criar escola com slug fora do formato ou chave a mais não cria rede, escola nem auditoria | integração | sem `.strict()` |
| Sessão e operação saem da lista de pendentes | unidade | devolver um |

## Como testar

- A ordem dos erros: copie `apps/api/test/mfa.int.test.ts › permissão: professor chamando redefinir recebe 404, como rota
  inexistente, e nada muda; finalidade fora da lista é recusada` (`:568`), trocando o par de entradas.
- Sem gastar tentativa: `apps/api/test/login-email.int.test.ts › entrada fora do contrato é recusada antes de qualquer
  hash` (`:379`).
- A carga: `apps/api/test/semaforo-de-login.int.test.ts › borda (regra 80, item 1): 35 alunos do mesmo IP ao mesmo
  tempo, …` (`:227`) roda sem mudança.
- A corrida do operador: `segundo-fator-operador-concorrencia.int.test.ts` (`:151`, `:173`).
- Isolado: `npx vitest run --project integracao apps/api/test/mfa.int.test.ts`.
- Armadilha: se o pipe mudar a ordem 401/400, não "conserte" o teste: escreva a mudança em "Divergências resolvidas" com a
  seção da onda.

## Fora do escopo desta tarefa

Os outros módulos (15.0, 17.0); o limite por IP da operação (`arquitetura.test.ts:781`) não muda.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: [caminho do arquivo que tem a cláusula]
teste: [caminho do teste] › [nome do caso]
  [linha de contexto, que fica]
- [a cláusula que sai]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->

