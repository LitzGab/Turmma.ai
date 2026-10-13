# Tarefa 7.0 — A alocação no painel do professor

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 6.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A coordenação liga o professor à turma e à disciplina de dentro do painel dele, onde também vê as turmas que ele confirmou e as que contestou. A seção "Alocação" sai da aba Turmas.

## Contexto necessário

- `techspec.md` seções 9 ("Professores") e 13; `prd.md` RF14, RF22 e seção 6 ("Vínculo é da escola")
- `mockup.md` seção 3.6: o painel do professor e o diálogo "Acrescentar turma"
- `.claude/rules/60-dominio.md` item 8a: o vínculo é o que dá acesso a aluno
- Código: `apps/web/src/areas/coordenacao/Alocacao.tsx` (o envio único, os textos de falha e o que a lista mostra de cada vínculo); `o-que-falta-para-alocar.ts`; `apps/web/src/api/estrutura.ts` (`alocarProfessor`, `consultaVinculos`)

## Subtarefas

- [ ] 7.1 — No painel, a seção "Turmas": um item por vínculo do professor, com a turma, a disciplina e o estado em texto ("Esperando o professor confirmar", "Confirmou", "Contestou", "Encerrada"). No contestado, o motivo (`NOME_DA_CONTESTACAO`) e o complemento que ele escreveu
- [ ] 7.2 — "Acrescentar turma": um `Dialogo` com Turma e Disciplina, que chama `alocarProfessor` com o professor do painel. Só aparece para quem está em `ESTADOS_DO_PROFESSOR_ALOCAVEIS`; os outros veem por que não
- [ ] 7.3 — Sem turma ou sem disciplina na escola, o vazio de `tituloDoQueFalta` e `descricaoDoQueFalta`, no painel
- [ ] 7.4 — As falhas de hoje, no diálogo: o vínculo que já existe, e a turma, a disciplina ou o convite que saíram com o diálogo aberto
- [ ] 7.5 — `Alocacao.tsx` vira o diálogo; a seção sai de `Estrutura.tsx`; o passo "Alocação" de "O que falta" passa a levar a Professores
- [ ] 7.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/PainelDoProfessor.tsx`, `apps/web/src/areas/coordenacao/Alocacao.tsx`, `apps/web/src/areas/coordenacao/Estrutura.tsx` | alterado |
| `apps/web/src/areas/coordenacao/o-que-falta-da-escola.ts`, `apps/web/src/areas/coordenacao/o-que-falta-da-escola.test.ts` | alterado |
| `apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx` | novo |
| `e2e/alocacao.spec.ts`, `e2e/escola-montada.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| estados da tela | componente | carregando; erro com "Tentar de novo"; "Nenhuma turma"; com dado; o vazio do que falta só com as leituras terminadas; o foco depois de acrescentar |
| só o alocável | componente | convite vencido, revogado e conta desativada não têm "Acrescentar turma" |
| o vínculo nasce pendente | e2e | o caso W4 (Alocação) de hoje, pelo painel: depois de acrescentar, "Esperando o professor confirmar", e o professor ainda não alcança a turma |
| borda: duas disciplinas na mesma turma; professor que contestou | e2e | duas linhas; o motivo e o complemento aparecem, e corrigir é acrescentar a turma certa |
| o que sai com a tela aberta | e2e | o caso de hoje: o convite que vence e a turma e a disciplina excluídas por outra pessoa |
| clique duplo em "Acrescentar" | e2e | um pedido só e um vínculo só (a corrida entre duas pessoas é da API, que não muda) |
| recomeço: segunda pessoa; resposta atrasada; falha com o diálogo aberto | e2e | o aviso e o foco da tentativa anterior saem ao reabrir; nada do professor da escola anterior |

## Como testar

- `e2e/alocacao.spec.ts › vazio sem professor alocável e sem turma…` (veio de `estrutura.spec.ts` na 3.0): mudam o caminho até o formulário e o seletor "Professor", que deixa de existir
- `escola-montada` e o roteiro: o passo de alocar passa a ser Professores, a linha do professor e "Acrescentar turma"
- Clique duplo: `e2e/professores.spec.ts › dois cliques em cadastrar mostram um link só…`
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/PainelDoProfessor.test.tsx`; `node tools/ci/e2e.ts --manter-ambiente e2e/alocacao.spec.ts`
- Telas: `coordenacao`, `/coordenacao/professores`, clique na primeira linha e em `text=Acrescentar turma`; mockup `/coordenacao/escola?aba=professores&prof=<id>`

## Fora do escopo desta tarefa

Encerrar vínculo pela tela (a API existe; `TODO.md`); "Corrigir turma" como ação própria; qualquer indicador sobre quem confirmou.

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
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: [caminho do arquivo que tem a cláusula]
teste: [caminho do teste] › [nome do caso]
  [linha de contexto, que fica]
- [a cláusula que sai]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->

