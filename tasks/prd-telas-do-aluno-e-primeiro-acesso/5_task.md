# Tarefa 5.0 — As peças da introdução: tela de foco, balão, comemoração e a onça em três poses

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Existem, fora da entrada, as peças da introdução: a `Introducao` passo a passo, a `TelaDeFoco`, o `Balao`, a `Comemoracao` e a onça
em três poses.

## Contexto necessário

- `techspec.md` seções 5 ("Tela de foco"), 7b e 9 ("Peças novas"); `prd.md` RF3, RF8, RF13, RF16 e RF19; `mockup.md` seção 2.8 e fecho
  (b); `docs/interface.md` 9.7
- Regras 50 (item 11) e 70 (itens 4a e 4b); D58 e D59. X1, `tasks/prd-pele-e-casca/techspec.md` 7b: a cabeça da onça e o teste de
  arquitetura são dela (confira o arquivo; o teste passa a aceitar só os importadores daqui)
- Código: `componentes/CascaDaEscola.tsx` (`encerrar`, `aoSair`); `componentes/ia/AssinaturaIA.tsx`; `ehTelaDeFoco` em `caminhos.ts`

## Subtarefas

- [ ] 5.1 — `componentes/onca/Onca.tsx`: props `pose` (`acenando`, `apontando` ou `comemorando`; **sem "acolhendo"**), `agente` e `tamanho`.
  SVG parado e igual em qualquer render, sempre com o nome da função e o selo "IA" no mesmo bloco, `data-pose`, sem temporizador
- [ ] 5.2 — `TelaDeFoco` (barra de passo e "Sair" à vista, pelo contexto da casca; sem segundo `<main>`); `Balao` (a fala é o `h1`); `Comemoracao` (um salto, `@keyframes` em CSS ao lado, só `transform` e `opacity`, uma
  iteração, parada com "reduzir movimento", sem som e sem número); `introducao/Introducao`: passos
  (`pose`, `fala`, `conteudo`, `obrigatorio`), "Passo N de M" para o leitor de tela, foco no `h1` a cada passo, Enter continua,
  "Continuar" e "Pular" iguais, sem "Pular" no passo obrigatório, "Fechar" em todo passo quando revendo, e `aoConcluir` ou `aoPular`
  para quem chama.
- [ ] 5.3 — `CascaDaEscola` nos endereços de `ehTelaDeFoco`: sem lateral nem barras; mantém `<main>`, `useInatividade` e `lembrarQuemEsta`
- [ ] 5.4 — Seção `galeria/secoes/Introducao.tsx`, nos dois temas, só com nomes inventados
- [ ] 5.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/onca/Onca.tsx`, `apps/web/src/componentes/onca/Onca.test.tsx` | novo |
| `apps/web/src/componentes/TelaDeFoco.tsx`, `Balao.tsx`, `Comemoracao.tsx`, `Comemoracao.css`, `Comemoracao.test.tsx` | novo |
| `apps/web/src/componentes/introducao/Introducao.tsx`, `apps/web/src/componentes/introducao/Introducao.test.tsx` | novo |
| `apps/web/src/galeria/secoes/Introducao.tsx`, `e2e/introducao-pecas.spec.ts`, `apps/web/src/componentes/CascaEmFoco.test.tsx` | novo |
| `apps/web/src/componentes/CascaDaEscola.tsx`, `apps/web/nome-dos-chunks.ts` | alterado |

`nome-dos-chunks.ts` é só desta tarefa: as peças novas entram em `PECAS_FORA_DA_ENTRADA`.

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| ordem e foco | componente | o `h1` recebe o foco, Enter continua, o leitor ouve "Passo 2 de 4" |
| botões iguais (RF16) | componente | "Continuar" e "Pular" saem com a mesma classe, tamanho e peso |
| passo obrigatório | componente | sem "Pular", sem "Fechar" e Esc não sai; revendo, todo passo fecha |
| onça (RF19) | componente | só as três poses; sempre com função e selo "IA"; nenhum texto de sentimento; nome acessível nunca é "onça" |
| arquitetura | unidade | só `Introducao`, `Comemoracao` e os `BemVindo` importam a onça de corpo inteiro; a entrada não |
| movimento | componente + e2e | uma iteração, nunca `infinite`; com "reduzir movimento" o `animationName` é `none` |
| casca em foco | componente | sem lateral nem barras, um `<main>`, "Sair" à vista, inatividade ligada |

Quatro estados, concorrência e log não se aplicam: peças sem dado e sem chamada.

## Como testar

- Copie `ListaDePedidos.test.tsx` (em `componentes/pedidos/`); a casca em foco usa o `memoryLocation` do wouter
- Rodar: `npx vitest run --project unidade apps/web/src/componentes/introducao` e
  `node tools/ci/e2e.ts --manter-ambiente e2e/introducao-pecas.spec.ts`
- Telas: nenhuma de produto; galeria `/galeria` (`VITE_COM_GALERIA=1`), seção "Introdução"; mockup `/aluno/bem-vindo?rever=1`

## Fora do escopo desta tarefa

Os textos e as rotas de cada papel (9.0 a 11.0); a pose "acolhendo"; onça no Início, no Eu ou em estado vazio; som.
Se o `conformidade-reviewer` vetar a onça de corpo inteiro ou a comemoração, a peça sai e o fim da introdução fica parado.

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
