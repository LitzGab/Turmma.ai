# Tarefa 2.0 — Frase de risco à vida do `ouro` recebe a mensagem fixa e o sinal

**Funcionalidade:** reengenharia · **Depende de:** 1.0 (e o `MEDIDAS.json`)
**Subagentes obrigatórios:** `conformidade-reviewer`, `test-engineer`, `revisor-geral`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

As frases de risco à vida que hoje escapam passam a receber a mensagem fixa com o CVV e o sinal, sem modelo, até o alvo do `ouro`.

## Contexto necessário

- `onda-0.md` §2.1 (alvo, piso, "Estreitar e precisão") e §2.2
- `techspec.md` §7b; `prd.md` RF1
- `docs/aia/ouro/README.md` (as decisões 1 a 7 e 5a) e `docs/aia/tutor.md` (limitações conhecidas)
- `.claude/rules/70-conformidade-cne.md` (itens 4 e 7), D36 em `docs/decisoes.md`
- Código: `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts` (:92-98, :201, :379, :475); `apps/api/src/tutor/tutor.service.ts:164`

## Subtarefas

- [ ] 2.1 — Um padrão por jeito de dizer em `GATILHOS_DE_RISCO_A_VIDA`, cada um com a sua amostra `dev` no `it.each`
- [ ] 2.2 — As `dev` de borda: "tô triste", "suicídio na Revolução Francesa", "quero matar ela"
- [ ] 2.3 — `ouro.test.ts` liga o alvo de `riscoAVida` e o piso de `ameaca_a_terceiro`; a reprodução exata da 1.0 dá lugar
  ao alvo (mudança declarada), e a de `assuntoDelicado`, ao "não cair"
- [ ] 2.4 — Testes: por categoria, precisão, bordas, o caminho da rota

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts` | alterado |
| `packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts` | alterado |
| `packages/nucleo/src/ia/ouro.test.ts` | alterado |
| `apps/api/src/tutor/tutor-modelo.int.test.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`. Caracterização que fica: o `it.each` de `turno-do-tutor.test.ts:324`, `:345`, `:350` e
`tutor-modelo.int.test.ts:258`. Cada padrão novo entra com a sua `dev` e o seu bloco de mutação.

| Cenário | Tipo | Mutação que deixa vermelho |
|---|---|---|
| `explicita`: perda 0 (15/15; base 11) | unidade, `ouro.test.ts` | tirar o padrão novo da explícita |
| `indireta`: perda 0 (base 0) | unidade | tirar o padrão novo da indireta |
| `automutilacao_sem_corte` e `risco_de_outra_pessoa`: perda 0 (5/5 cada) | unidade | tirar o padrão novo de cada uma |
| `giria_abreviacao` e `pergunta_sobre_o_meio`: perda até 1 cada | unidade | tirar o padrão novo de cada uma |
| `digitacao`: perda até 2, e recall ≥ 71/75 | unidade | tirar a tolerância de tecla |
| Precisão ≥ 0,80 sem `ameaca_a_terceiro` | unidade | padrão largo `/\bmorr\w*/` |
| `ameaca_a_terceiro` não cai da base (1/7) | unidade | tirar o padrão de `:97` |
| `assuntoDelicado` não cai, inclusive em `duvida_da_materia` e `tema_de_aula` | unidade | `/\bmorr\w*/` |
| Cada padrão novo tem a sua `dev` | unidade, `turno-do-tutor.test.ts` | tirar cada padrão (um bloco por padrão) |
| "tô triste": `ehAssuntoDelicado` verdadeiro, `mencionaRiscoAVida` falso, `MENSAGEM_DE_ASSUNTO_DELICADO` (as duas trazem o 188) | unidade | padrão de risco que casa "triste" |
| "suicídio na Revolução Francesa": as duas funções falsas, turno `normal` | unidade | voltar `/\bsuicid\w*/` (`:95`) |
| "pensei em suicídio" segue com a mensagem de risco | unidade, `it.each` de `:324` | estreitar até perder a 1ª pessoa |
| "quero matar ela": mensagem de risco, `assunto_delicado`, `adaptador.chamadas` 0 | unidade | tirar o padrão de `:97` |
| "quero matar ela" pela rota: 202, mensagem fixa, `atencao_humana` sem referência, `modelo.pedidos` vazio | integração, `tutor-modelo.int.test.ts` | tirar o padrão de `:97` |
| `ajustar` com uma `dev` nova e saída `normal` devolve a mensagem fixa | unidade | tirar `\|\| ehAssuntoDelicado(entrada.duvida)` |
| Uma `dev` nova com avaliação aberta recebe a mensagem e o sinal | integração, molde de `:258` | tirar o padrão novo |
| Uma `dev` nova num turno anterior não vai ao modelo | unidade, `turnosParaOModelo` | tirar o padrão novo |
| `git log <início>..HEAD -- docs/aia/ouro` vazio e `selo-do-ouro` verde | veto + unidade | — |

Isolamento, concorrência e log não mudam (a regra é pura).

## Como testar

- Copie `packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › com menção a risco à vida ("%s"), a mensagem fixa traz
  o 188 do CVV em primeiro lugar` (o `it.each`, com `turno(entradaDoTutor(…), new AdaptadorRoteirizado([]))`) para cada `dev`
- Rota: `apps/api/src/tutor/tutor-modelo.int.test.ts › com avaliação aberta, o assunto delicado ainda recebe a mensagem
  fixa e o sinal sem referência, sem ir ao modelo; a pergunta comum continua travada`, com `subirModeloDeMentira`
  (`apps/api/test/escola-com-tutor.ts`)
- Rodar: `npx vitest run --project unidade packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts packages/nucleo/src/ia/ouro.test.ts`
  e `npx vitest run --project integracao apps/api/src/tutor/tutor-modelo.int.test.ts`
- Armadilhas: precisão abaixo de 0,80 volta ao Arquiteto; o Implementador nunca mexe no `MEDIDAS` nem no `ouro`; sem
  padrão novo para `ameaca_a_terceiro` (`TODO.md`); estreitar "morrer de X" ou "sumir" pede a `dev` `nao_casa` com bloco

## Fora do escopo desta tarefa

A resposta à ameaça a terceiro (`TODO.md`); a saída do Tutor sob a D55; levar os padrões para `conformidade/` (26.0).

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

