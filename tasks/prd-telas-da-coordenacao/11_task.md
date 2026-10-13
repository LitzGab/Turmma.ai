# Tarefa 11.0 — "Como cada IA trabalha", uma IA por vez

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A tela dos agentes vira a página "Como cada IA trabalha", dentro de Registros: a coordenação escolhe uma das três IAs e lê o que ela faz sozinha, o que espera aprovação e o que nunca faz, e suspende ou retoma uma função.

## Contexto necessário

- `techspec.md` seções 5 (`?ia=`), 7b e 9; `prd.md` RF19, RF22 e seção 10 (por que é página, e não painel)
- `mockup.md` seção 5.2: o seletor "Qual IA" e os três blocos. A AIA recolhível e "Pausar o agente inteiro" **não entram**; o selo "Alto risco" e a autonomia de cada função **ficam** (11.3)
- `.claude/rules/70-conformidade-cne.md` itens 4a, 5 e 6a; `docs/decisoes.md` D9 e D60
- Código: `apps/web/src/areas/coordenacao/Agentes.tsx` e `nunca-faz.ts`; `apps/web/src/api/governanca.ts` (`suspenderFuncao`, `retomarFuncao`, `aplicarFuncao`)

## Subtarefas

- [ ] 11.1 — `Tela` `leitura`, com "‹ Registros" e o `h1` "Como cada IA trabalha"; o lugar Registros continua aceso
- [ ] 11.2 — `Segmentado` "Qual IA", com os nomes de função dos três agentes, no endereço (`?ia=`); abre no Assistente de ensino
- [ ] 11.3 — O agente escolhido, numa seção com `data-agente`: `AssinaturaIA` com o selo "IA"; cada função (`data-funcao`) com o que **faz sozinha** e o que **espera aprovação**, no texto que a API devolve; o selo "Alto risco" onde a função tem avaliação de impacto, e o `Estado` "Suspensa", com desde quando e o motivo
- [ ] 11.4 — "Suspender esta função" (perigo) e "Retomar esta função", com o diálogo de confirmação, o motivo de lista fechada opcional e o foco de volta ao botão, como hoje
- [ ] 11.5 — "O que a IA nunca faz" (`nunca-faz.ts`), sempre à vista, igual para as três
- [ ] 11.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/Agentes.tsx` | alterado |
| `apps/web/src/areas/coordenacao/Agentes.test.tsx` | novo |
| `e2e/agentes.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| estados da tela | componente | carregando; erro com "Tentar de novo"; com dado para cada IA (não há vazio: os três agentes sempre existem); o foco depois de suspender e de retomar |
| o texto é o da API | componente | "faz sozinha" e "espera aprovação" são os da resposta, sem texto da tela no lugar; nenhuma frase diz que o agente é pessoa |
| suspender e retomar | e2e | o caso de hoje: `alertdialog` "Suspender a correção de objetiva", o registro no banco com quem e o motivo, e retomar fecha a suspensão |
| autonomia e alto risco | componente | cada função mostra o texto de autonomia da API; a função de alto risco mostra o selo "Alto risco" |
| as três IAs | e2e | cada opção do seletor mostra o agente com o nome da função e `[data-selo-ia]`; o endereço guarda a escolha |
| função já suspensa por outra pessoa | e2e | a tela mostra o estado de agora e o diálogo não oferece suspender de novo |
| recomeço: segunda pessoa; falha com o diálogo aberto; clique duplo em confirmar | e2e | o aviso da tentativa anterior sai ao reabrir; uma suspensão só |
| 360 px e teclado | e2e | o seletor pelas setas; alvos de 44 px; sem rolagem de lado; axe |

## Como testar

- `e2e/agentes.spec.ts › três cartões com as funções; suspender…` (veio de `governanca.spec.ts` na 3.0): os três cartões viram três opções do seletor; `suspensoesNoBanco`, de `e2e/__fixtures__/governanca.ts`
- No roteiro, o laço pelos três agentes passa a escolher cada um no seletor
- `aplicarFuncao` já troca a função na lista lida: não duplique o estado em `useState`
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/Agentes.test.tsx`; `node tools/ci/e2e.ts --manter-ambiente e2e/agentes.spec.ts`
- Telas: `coordenacao`, `/coordenacao/agentes`, com `text=Tutor` e com `text=Suspender esta função`; mockup `/coordenacao/registros?aba=ia&ver=como`

## Fora do escopo desta tarefa

A versão da AIA na tela (F12); suspender o agente inteiro; motivo em texto livre; o que o aluno vê com o Tutor suspenso (já existe, X4).

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

