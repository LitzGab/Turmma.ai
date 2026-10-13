# Tarefa 6.0 — O documento aberto em folha

**Funcionalidade:** telas-do-professor · **Depende de:** 5.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O artefato abre como documento: cabeçalho com abas, a folha de 760 px sobre a mesa e a página de cada questão. Renomear,
exportar, pedir versão adaptada, quem decidiu cada versão, aplicar com "é avaliativa?" e encerrar continuam como são.

## Contexto necessário

- `techspec.md` seções 5 (abas no endereço), 7b e 9 (Documento); `prd.md` RF13, RF20 e RF22; `mockup.md` 10.2
- Regra 70, itens 3 e 6: a versão adaptada só vai a aluno aprovada; a atividade só vai à turma por "Aplicar à turma".
  O mockup funde aprovar e enviar num ato só e não pergunta "é avaliativa?": aqui os dois atos continuam separados
- Código: `Artefato.tsx` (o voltar, linhas 78 a 84; as versões, 217 a 231); `AplicacaoDoArtefato.tsx` (o diálogo de
  encerrar, linhas 224 a 242); `entregas.ts` (`saidaEmPdf`, `podeRenomear`)

## Subtarefas

- [ ] 6.1 — `Artefato.tsx`: o endereço fica `/professor/artefatos/:id` (RF2). Cabeçalho com o voltar "Voltar para
  Criados", o título, o selo e a linha de dados; abas "Conteúdo", "Versões adaptadas" e "Na turma" em `?aba=`
  (`replace`; valor desconhecido cai em Conteúdo; a aba das versões só existe com versão); o interruptor "Gabarito",
  ligado de início como hoje; o conteúdo numa `Folha` de 760 px sobre `mesa`, com a página de cada questão. A
  assinatura da IA e a linha de quem decidiu ficam
- [ ] 6.2 — `EncerramentoDaAtividade.tsx`, extraído de `AplicacaoDoArtefato`: o botão "Encerrar a atividade" e o diálogo
  de confirmação, com o mesmo resumo, o mesmo efeito e o mesmo envio único. A 11.0 o usa no painel. Nada muda de
  comportamento
- [ ] 6.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/Artefato.tsx`, `AplicacaoDoArtefato.tsx` | alterado (em `apps/web/src/areas/professor/`); `ConteudoDoArtefato.tsx` não muda de props, a 4.0 o usa |
| `apps/web/src/areas/professor/Folha.tsx`, `EncerramentoDaAtividade.tsx`, `Artefato.test.tsx`, `EncerramentoDaAtividade.test.tsx` | novo |
| `e2e/professor-artefato.spec.ts`, `e2e/professor-aplicacao.spec.ts` | alterado (a 2.5 os criou) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| estados | componente | carregando; erro com "Tentar de novo"; documento de outra turma, de outra escola e inexistente com a mesma tela (regra 10, item 6); com dado |
| a aba pelo endereço | componente | `?aba=turma` abre "Na turma"; `?aba=xyz` cai em Conteúdo; trocar de aba usa `replace` e não empilha histórico |
| a versão rejeitada não exporta | componente | sem "Exportar em PDF" e com o texto de hoje; a pendente exporta como rascunho; a aprovada, limpa |
| a versão adaptada nasce pendente | componente | a linha diz que espera a professora, sem botão de aplicar; o original ao lado continua aplicável |
| aplicar e encerrar | e2e | "Aplicar à turma" pede "é avaliativa?" e diz o efeito antes; "Encerrar a atividade" diz o que acontece; dois cliques em confirmar mandam um pedido só |
| a folha e a página | e2e | cada questão mostra a página de origem; renomear devolve o foco ao botão; a 360 px a folha não rola de lado e o último botão fica acima da barra de baixo |
| recomeço | e2e | recarregar mantém a aba; a segunda pessoa não vê o documento; sessão vencida no meio do renomear devolve o texto digitado. Log não se aplica: nada novo é gravado |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`); o diálogo, de
  `componentes/DialogoDeConfirmacao`
- e2e: `describe('o artefato')` e `describe('aplicar à turma e encerrar, no artefato (A3)')`, já divididos pela 2.5. Mudam o
  rótulo do voltar ("Voltar para Criados"), a aba que o teste abre antes de ver o bloco e a estrutura da folha; a
  asserção de cada regra fica
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/Artefato.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-artefato.spec.ts e2e/professor-aplicacao.spec.ts`
- Telas: `professora`, `/professor/artefatos/:id`, `--clicar 'role=link[name=/Abrir o artefato/]'`. Mockup: `/professor/criados/:id`

## Fora do escopo desta tarefa

Imprimir, Apresentar, PPTX, Lado a lado, o sumário lateral, a aba Resultados, o envio em dois passos, "Aprovar e enviar",
recusar com motivo, apagar e "Sobre este documento" (F7, PRD seção 3); a lista de Criados (5.0); a decisão da versão
adaptada, que fica na tela do Assistente.

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
