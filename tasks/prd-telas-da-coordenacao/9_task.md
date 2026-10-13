# Tarefa 9.0 — A lista da turma em duas colunas, com os professores da turma

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A turma aberta pela coordenação fica como no mockup: os nomes em tabela, com a situação de cada um, e ao lado os professores da turma e os pedidos de nome. Tudo o que a tela faz hoje continua, com as mesmas leituras auditadas.

## Contexto necessário

- `techspec.md` seções 7 e 9 ("Lista da turma", "Nomes que não mudam"); `prd.md` RF16, RF22, RF23 e seção 6 ("Leitura auditada não sai sozinha")
- `mockup.md` seção 4
- `.claude/rules/20-lgpd-menores.md` itens 9 e 10
- Código: `apps/web/src/areas/coordenacao/ListaDaTurma.tsx` inteiro, `previa-da-lista.ts` e `ler-arquivo-da-lista.ts`, que **não mudam**; `apps/web/src/api/lista.ts` (`staleTime` infinito) e `pedidos.ts` (a coordenação só lê no "Atualizar"); `apps/web/src/componentes/pedidos/ListaDePedidos.tsx`, que **não muda**

## Subtarefas

- [ ] 9.1 — Cabeçalho: "‹ Escola", o `h1` "Turma <nome>" e, de complemento, a série e o turno. Sem "Exportar lista"
- [ ] 9.2 — A região "Nomes da turma" em tabela: Nome, Matrícula e Situação (`Estado`, em texto, pelo `estado` do nome). "Acrescentar um nome" e "Retirar" como hoje; a contagem dos aprovados com o texto de hoje, que diz quando é só dos nomes mostrados
- [ ] 9.3 — "Subir a lista de nomes": o campo "Lista colada", o arquivo, a região "Prévia" com os erros por linha, e "Gravar lista" só com a prévia limpa e atual, como hoje
- [ ] 9.4 — A coluna do lado, a partir de 1024 px: "Professores da turma" (nome, disciplina e estado do vínculo, de `consultaVinculos` e `consultaProfessores`, com link para o painel do professor) e a `ListaDePedidos`, com o "Atualizar"
- [ ] 9.5 — A turma que não existe, a que saiu do ano e a leitura que falha: os estados e os textos de hoje
- [ ] 9.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx` | alterado |
| `apps/web/src/areas/coordenacao/ProfessoresDaTurma.tsx`, `apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx` | novo |
| `e2e/lista-da-turma.spec.ts`, `e2e/pedidos.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| estados da tela | componente | a turma e a lista, cada uma com carregando e erro; "Nenhum nome nesta turma ainda"; com dado; o foco depois de gravar, acrescentar e retirar |
| leituras | componente | a lista é lida uma vez ao abrir, com a finalidade; os pedidos, nenhuma vez sem o clique; os professores da turma não fazem leitura auditada |
| a prévia e o gravar | e2e | os casos de hoje: windows-1252 e UTF-8 com BOM, erros primeiro e em texto, gravar só sem erro e uma vez só |
| paginada, avulso e retirada | e2e | o caso de hoje: sem releitura ao voltar para a aba; a resposta atrasada; a gravação recusada; a volta para a Escola |
| pedidos pela coordenação | e2e | o caso de `pedidos.spec.ts`: nenhuma leitura sem "Atualizar", nem em 60 s; a finalidade vai e fica na auditoria |
| professores da turma | e2e | duas disciplinas do mesmo professor são duas linhas; turma sem professor diz "Nenhum professor nesta turma" |
| recomeço: segunda pessoa; outra turma pelo histórico; resposta atrasada; a turma excluída entre a prévia e o gravar | e2e | os casos de hoje: o texto colado e a prévia de uma turma nunca vão para outra |
| 1366 × 768 e 360 px | e2e | a página não rola e a lista rola dentro; no celular, uma coluna, sem rolagem de lado |

## Como testar

- `e2e/lista-da-turma.spec.ts` (os três casos vieram de `estrutura.spec.ts` na 3.0): nomes, rótulos e regiões não mudam; só a posição
- `e2e/pedidos.spec.ts › nenhuma leitura sem o clique em "Atualizar"…` e `› com mais de uma página de nomes…`
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx`; `node tools/ci/e2e.ts --manter-ambiente e2e/lista-da-turma.spec.ts`
- Armadilha (correção `2026-10-12-estrutura-lista-estoura-o-prazo`): o caso da lista grande leva mais de um minuto; rode o arquivo sozinho
- Telas: `coordenacao`, `/coordenacao/estrutura`, clique `text=Lista de nomes`; mockup `/coordenacao/escola/turmas/<id>`

## Fora do escopo desta tarefa

A faixa "No Painel"; adaptação e painel do aluno; mudar de turma; encerrar matrícula; acrescentar vários nomes; busca na lista, que é paginada; renomear e excluir a turma (5.0).

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

