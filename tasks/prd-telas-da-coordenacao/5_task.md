# Tarefa 5.0 — Escola › Turmas em tabela, com o ano e as disciplinas num painel ao lado

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A aba Turmas mostra as turmas do ano em tabela, por série, com a linha inteira abrindo a lista da turma; ano letivo, séries e disciplinas passam a um painel ao lado; e tudo o que a Estrutura faz hoje continua.

## Contexto necessário

- `techspec.md` seções 5 (`?painel=`, `?situacao=`), 9 ("Escola › Turmas", "Nomes que não mudam") e 12; `prd.md` RF11, RF12, RF22, RF23 e seção 10 ("sem lista" não entra)
- `mockup.md` seções 3.1, 3.2 e 3.3
- Código: `apps/web/src/areas/coordenacao/Estrutura.tsx` inteiro (os diálogos, os anúncios e o foco de cada ação ficam); `ordem.ts`; `o-que-falta-da-escola.ts`

## Subtarefas

- [ ] 5.1 — `turmas-da-escola.ts` (puro): turmas agrupadas por série, na ordem de `ordenarSeries`; os professores de cada turma, pelos vínculos pendentes e confirmados; "sem professor"
- [ ] 5.2 — A tabela, na região "Turmas de <ano>": colunas Turma, Turno, Professores (até dois nomes e "+N") e Situação (`Estado` "Sem professor", em texto). A linha é um link com o nome acessível "Lista de nomes da turma <nome>"; a última célula é um `Menu` "Mais ações da turma <nome>", com Renomear e Excluir
- [ ] 5.3 — `Segmentado` "Situação": "Todas" e "Sem professor", no endereço (`?situacao=sem-professor`); o vazio do filtro
- [ ] 5.4 — "Nova turma" como o único botão `primario`; o diálogo é o de hoje
- [ ] 5.5 — O botão "Ano letivo e disciplinas" abre o `PainelLado` (`?painel=ano`) com as regiões "Ano letivo", "Séries" e "Disciplinas" de hoje, e os diálogos delas por cima
- [ ] 5.6 — `Aviso` "Para terminar a escola" enquanto falta passo, com "Ver o que falta" (`?painel=falta`): a região "O que falta para a escola começar", com os sete passos. Sem onça
- [ ] 5.7 — Sem ano letivo: o vazio "Comece pelo ano letivo", com "Criar o ano letivo". Sem ano em curso: o texto de hoje
- [ ] 5.8 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/Estrutura.tsx` | alterado |
| `apps/web/src/areas/coordenacao/AnoEDisciplinas.tsx`, `apps/web/src/areas/coordenacao/OQueFalta.tsx` | novo |
| `apps/web/src/areas/coordenacao/turmas-da-escola.ts`, `apps/web/src/areas/coordenacao/turmas-da-escola.test.ts`, `apps/web/src/areas/coordenacao/Estrutura.test.tsx` | novo |
| `e2e/estrutura.spec.ts`, `e2e/escola-montada.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| agrupar e marcar | unidade | turma sem vínculo, só com contestado ou só com encerrado é "sem professor"; duas disciplinas do mesmo professor mostram o nome uma vez |
| estados da tela | componente | carregando; erro; "Comece pelo ano letivo"; sem ano em curso; com dado; o filtro que não acha nada; "falta" só com a leitura terminada; o foco depois de criar, renomear e excluir |
| nada de lista de nomes | componente | a aba não chama `/lista`: não há contagem de nomes nem "sem lista" |
| montar a escola | e2e | os casos de `estrutura.spec.ts`, abrindo o painel para ano, série e disciplina; a página não rola a 1366 × 768; a tabela vira lista a 360 px |
| renomear e excluir | e2e | o caso de hoje, pelo menu da linha: o nome repetido, o `CONFLITO` que explica, a turma que outra pessoa excluiu |
| diálogo sobre o painel | e2e | foco preso no diálogo, Esc fecha só ele, e o foco volta ao painel |
| recomeço: segunda pessoa; o painel pelo endereço; resposta atrasada; falha com o diálogo aberto | e2e | nada da escola anterior, nem com `?painel=ano` no endereço; os casos de hoje |

## Como testar

- `e2e/estrutura.spec.ts › carregando, o vazio "Comece pelo ano letivo"…`, `› o nome repetido fica no campo…` e `› sem rolagem horizontal…`: mudam o clique que abre o painel e o menu, nunca a regra
- `escola-montada` e o roteiro: só os passos de ano, série, disciplina e turma
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/Estrutura.test.tsx`; `node tools/ci/e2e.ts --manter-ambiente e2e/estrutura.spec.ts`
- Armadilha: dois `<dialog>` empilhados não abrem no jsdom; o diálogo sobre o painel se prova no e2e
- Telas: `coordenacao`, `/coordenacao/estrutura`, com `text=Ano letivo e disciplinas` e `text=Ver o que falta`; também com `--vazia`; mockup `/coordenacao/escola`, `?painel=ano`, `?painel=roteiro`

## Fora do escopo desta tarefa

A alocação, que fica na página até a 7.0; a lista da turma (9.0); "Grade e calendário", "Importar listas", busca e filtro "Sem lista" ou "Com adaptação".

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

