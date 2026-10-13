# Tarefa 4.0 — Conversa e cartão da ferramenta na pele nova

**Funcionalidade:** telas-do-professor · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A conversa com o Assistente fica na coluna do tipo conversa, com a caixa presa embaixo e o aviso de IA. O cartão da
ferramenta ganha o ícone e o nome. Nenhuma regra muda: a pergunta da D18 continua, e o cartão só abre com o "sim".

## Contexto necessário

- `techspec.md` seção 9 (Conversa: balões, assinatura, a `Escolha`, o cartão, a caixa presa com o menu "Ferramenta");
  `prd.md` RF8, RF9 e RF22; `mockup.md` 2 e 9.2, só pela forma
- Regra 70, itens 3, 4 e 4a; D18 (o Assistente pergunta antes), D58 (função e selo "IA" em toda resposta)
- Código: `apps/web/src/areas/professor/Conversa.tsx` (a pergunta, linhas 151 a 165; o cartão, 170 a 175);
  `CartaoDeFerramenta.tsx`; `ResultadoDaFerramenta.tsx`; `CaixaDoAssistente.tsx`; `icones-de-ferramenta.tsx` (da 3.0)

## Subtarefas

- [ ] 4.1 — `Conversa.tsx`: a coluna de 768 px, o vão de 24 e a caixa presa a 24 px do fim, com o menu "Ferramenta" e a
  frase "O Assistente é uma IA e pode errar · Nada chega à turma sem você aprovar" embaixo dela. O `log` mantém o nome
  "Conversa com o Assistente de ensino"
- [ ] 4.2 — O cartão: cabeçalho com o ícone ilustrado de 32 px (da 3.0) e o nome; o resto é o motor de hoje, com a
  mesma `key`. O resultado mantém as ações de hoje (Abrir o artefato, Exportar em PDF, Ver e decidir), sem mudar props
  de `ConteudoDoArtefato`, que a 6.0 também usa
- [ ] 4.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/Conversa.tsx`, `CartaoDeFerramenta.tsx`, `ResultadoDaFerramenta.tsx`, `CaixaDoAssistente.tsx` | alterado (todos em `apps/web/src/areas/professor/`) |
| `apps/web/src/areas/professor/Conversa.test.tsx`, `CartaoDeFerramenta.test.tsx` | novo |
| `e2e/professor-conversa.spec.ts` | alterado (a 2.5 o criou) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| estados | componente | carregando; erro com "Tentar de novo"; vazio ("Nenhuma conversa ainda"); sem turma, com "Ir para Turmas" e sem caixa; função suspensa, com o aviso e a caixa desligada; com dado |
| a pergunta da D18 | componente | pedido sem ferramenta: aparecem "Usar a ferramenta…" e "Só conversar" com a mesma variante e o mesmo tamanho; nenhuma vem escolhida |
| nenhum cartão sem o "sim" | componente | enquanto a pergunta está aberta, `[data-cartao-de-ferramenta]` não existe; "Só conversar" manda o pedido e não abre cartão; só "Usar a ferramenta" abre |
| a Adaptação | componente | o cartão da Adaptação abre sem o texto da caixa (D35, D67) |
| a IA se identifica | componente | cada resposta tem o nome da função e `[data-selo-ia]` no mesmo contêiner; o cartão tem o ícone e o nome |
| o foco | componente | o cartão que abre recebe o foco; "Cancelar" o devolve à caixa; o pedido enviado deixa o foco na caixa |
| fluxo completo | e2e | os casos de hoje (pedido, pergunta, cartão, resultado com página; "Ver mensagens anteriores"; falha vira aviso; recusa de corrigir redação em `a2-assistente.spec.ts`), nos dois projetos, sem rolar de lado a 360 px |
| recomeço | e2e | a segunda pessoa na mesma aba não vê a conversa nem o cartão da primeira; a resposta atrasada de outra sessão não entra. Concorrência: dois Enter mandam um pedido só (caso de hoje). Log não se aplica: nada novo é gravado |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx › professor: a lista é lida ao abrir…` (`prepararTela`,
  `redeFalsa`); o estado de `useLugarNaAba` se prepara como em `conversa.test.ts`
- e2e: os quatro `test(` de `describe('a conversa (11.3)')`, hoje em `professor-assistente.spec.ts`, que a 2.5 moveu.
  Muda o rótulo e a estrutura (o cabeçalho do cartão); nenhuma asserção de regra
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/Conversa.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-conversa.spec.ts`
- Telas: `professora`, `/professor/conversa`, `--clicar 'role=button[name=/Usar a ferramenta/]'`. Mockup:
  `/professor/conversa/:id`

## Fora do escopo desta tarefa

Várias conversas, título com menu, renomear, apagar e o selo "Só você vê esta conversa" (F7); anexo, busca na web,
votos, "Refazer", "Salvar em Criados" e editar a mensagem; o cartão do documento no lugar do resultado em linha (a
decisão da versão adaptada continua na tela do Assistente); o menu "Ferramenta" do Início (3.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
