# Tarefa 10.0 — A introdução do professor

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** 9.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O professor vê, na primeira entrada, quatro passos sobre o que a IA faz e não faz; pode pular e rever.

## Contexto necessário

- `techspec.md` seções 5 e 9 ("Lugares"); `prd.md` RF12, RF15 a RF18 e o caso do professor em duas escolas; `tasks/prd-telas-do-professor/mockup.md`
  seção 14 e fechamento (d)
- Regras 70 (itens 3, 4a, 8 e 9) e 20 (item 10a); D55, D58, D64 e D47
- Código: `paginas/Inicio.tsx` (a tabela por papel da 9.0); `areas/navegacao.ts` (`NAVEGACAO.professor`, `MENU_DA_PESSOA`);
  `areas/professor/rotas.tsx`; `Introducao` (5.0); `BemVindo.tsx` do aluno, como modelo
- Depois da 9.0: as três editam `paginas/Inicio.tsx`, `casca.ts`, `escola-montada.spec.ts` e o roteiro

## Subtarefas

- [ ] 10.1 — `areas/professor/textos-da-introducao.ts` e `BemVindo.tsx` (`lazy()`, `tela-professor-BemVindo`), a rota (2.1) e a entrada
  `professor` na tabela de `paginas/Inicio.tsx`. Os passos, com a onça e o nome "Assistente de ensino" e o selo "IA": (1) "Eu preparo,
  você revê, e só então vai à turma." (2) "Só a resposta do Tutor chega ao aluno sem a sua aprovação, uma a uma." (3) "Eu não corrijo
  redação nem discursiva: ajudo com a rubrica e com a organização do lote." (4) "Usar ou não esta ferramenta não gera número sobre
  você." Em todos, "Pular" e "Continuar" iguais. O fim lista "onde fica cada coisa" **lendo `NAVEGACAO.professor`**, e "Começar" leva
  ao primeiro lugar dele
- [ ] 10.2 — "Rever a introdução" no `MENU_DA_PESSOA.professor`, antes do "Sair"
- [ ] 10.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `areas/professor/textos-da-introducao.ts`, `BemVindo.tsx` e os dois testes, `e2e/professor-introducao.spec.ts` | novo |
| `areas/professor/rotas.tsx`, `areas/navegacao.ts`, `areas/navegacao.test.ts`, `paginas/Inicio.tsx`, `e2e/__fixtures__/casca.ts`, `e2e/escola-montada.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts` | alterado |

Caminhos em `apps/web/src/`, salvo `e2e/`.

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| os textos (RF15) | unidade | os quatro passos dizem aprova, Tutor sem aprovação uma a uma, nada de correção de discursiva e uso que não vira indicador; sem "ranking" nem "meta de uso"; sem fala de sentimento |
| onde fica cada coisa | componente | a lista sai de `NAVEGACAO.professor`; lugar que a fase não tem não aparece |
| primeira entrada pelo convite | e2e | professora convidada cria a senha, entra e cai em `/professor/bem-vindo` |
| pular | componente + e2e | "Pular" no passo 1 grava a data e vai ao primeiro lugar; a entrada seguinte não volta |
| botões iguais | componente | "Pular" e "Continuar" com a mesma classe |
| rever | e2e | menu da pessoa › "Rever a introdução": todo passo fecha, a data não muda |
| duas escolas | e2e | concluída na escola A, a troca para B (pelo seletor) não reabre |
| sair no meio | componente | "Sair" não grava |
| recomeço da tela | e2e | a professora seguinte no mesmo computador vê a introdução dela |
| 360 px | e2e | sem rolagem lateral, botões de 44 px |

Isolamento e concorrência da data são da 1.0; carregando e erro são os da `Inicio`.

## Como testar

- Copie `ListaDePedidos.test.tsx` (`componentes/pedidos/`) e a `BemVindo.test.tsx` do aluno; o convite como em `e2e/convite.spec.ts`
  (`criarConviteDeProfessor`); a troca de escola como em `e2e/troca-de-escola.spec.ts`
- `escola-montada` e o roteiro: a professora criada por convite passa pela introdução (helper em `casca.ts`); `navegacao.test.ts`
  ganha o item do menu
- Rodar: `npx vitest run --project unidade apps/web/src/areas/professor/textos-da-introducao.test.ts` e
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-introducao.spec.ts`
- Telas: `professor`, `/professor/bem-vindo` (convite, senha, entrada; ou o menu da pessoa › "Rever a introdução"); mockup
  `/professor/bem-vindo`

## Fora do escopo desta tarefa

Confirmar turma, padrões da prova, "preparar a semana" e gerar prova (a introdução só grava a data); a introdução da rede e a da
operação.

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

<!-- A seção "Revisões" é criada pelo hook tools/processo/revisoes.ts: não a escreva à mão nem acrescente seção depois dela. -->
