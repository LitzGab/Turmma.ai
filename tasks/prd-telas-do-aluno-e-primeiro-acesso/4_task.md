# Tarefa 4.0 — Tarefas em três grupos: Para fazer, Entregues e Corrigidas

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A lista de Tarefas mostra três grupos, com linha inteira clicável, ladrilho da matéria e o estado em texto. "Corrigida" só existe
com a correção aprovada.

## Contexto necessário

- `techspec.md` seção 9 ("Tarefas"); `prd.md` RF6, RF10 e RF20; `mockup.md` seção 2.2 (composição, selos, vazio)
- Regras 50 (itens 5 e 9) e 70 (item 3); D59 e D80 (item 7c)
- Código: `areas/aluno/Atividades.tsx` e `atividades.ts` (`TEXTO_DA_SITUACAO`, `separarAtividades`); `atividades.test.ts`
- A 3.0 corre junto: esta tarefa **mantém exportados** `estaParaResponder`, `resumoDaAtividade` e `AVISO_DA_AVALIACAO`
- `Linha` e `Ladrilho` são da X1: confira o nome e as props antes de importar

## Subtarefas

- [ ] 4.1 — `separarAtividades` devolve `paraFazer` (`para_fazer`, `em_andamento`), `entregues` (`enviada`, `encerrada`) e `corrigidas`
  (`com_diagnostico`), na ordem da API. Os selos: "Para fazer", "Entregue", "Encerrada" e "Corrigida". Os vazios: "Nada para fazer
  agora.", "Nada esperando quem dá a aula." e "Nenhuma corrigida ainda."
- [ ] 4.2 — `areas/aluno/materia.ts`: o nome da disciplina (sem acento e sem caixa) vira família de cor da X1 e ícone `lucide`; nome
  desconhecido cai numa reserva neutra
- [ ] 4.3 — `Atividades.tsx` com `Linha` e `Ladrilho` por tarefa: título, "disciplina · N questões", selo e o detalhe de hoje. Os
  `data-atividade` ficam. "ver mais atividades" vira "Ver mais tarefas", a pedido. Sem professor, sem prazo, sem barra, sem "NOVO",
  sem contador e sem filtro por matéria (o contrato não tem; D80, item 7c)
- [ ] 4.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/aluno/materia.ts`, `apps/web/src/areas/aluno/materia.test.ts`, `apps/web/src/areas/aluno/Atividades.test.tsx` | novo |
| `apps/web/src/areas/aluno/Atividades.tsx`, `apps/web/src/areas/aluno/atividades.ts`, `apps/web/src/areas/aluno/atividades.test.ts` | alterado |
| `e2e/aluno-atividade.spec.ts`, `e2e/aluno-fluxo.spec.ts`, `e2e/roteiro-da-demonstracao.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| a separação | unidade | cada `situacao` cai no grupo certo e a ordem da API não muda; `com_diagnostico` é o único em "Corrigidas" |
| "Corrigida" só com correção aprovada | componente | `enviada` e `encerrada` ficam em "Entregues", com o texto de espera, e nunca dizem acerto |
| quatro estados | componente | carregando; vazio total; erro com "Tentar de novo"; com dado, e o vazio de cada grupo sozinho |
| `materia.ts` | unidade | "Matemática", "matematica" e "História" acham família e ícone; nome desconhecido, a reserva |
| nada de colega (RF10) | componente | a varredura de texto não acha "ranking", "média", "posição", "pontos" nem "sequência" |
| "Ver mais tarefas" | componente | a segunda página só vem ao clicar |
| 360 px | e2e | sem rolagem lateral, linha com 44 px; no celular o selo desce para baixo do nome |
| recomeço da tela | e2e | o aluno seguinte vê as tarefas dele; a resposta atrasada do anterior não aparece |

Concorrência e log não se aplicam: só leitura.

## Como testar

- Copie `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx` e use `redeFalsa().segurar()` para o carregando
- O que muda nos e2e (rótulo, nunca a regra): as regiões "Para responder" e "Já feitas" viram "Para fazer", "Entregues" e
  "Corrigidas" (`aluno-atividade.spec.ts` ~110 e ~116, `aluno-fluxo.spec.ts` 79 e 163, `roteiro-da-demonstracao.spec.ts` 430 e 550);
  o selo "Com resultado" vira "Corrigida" e o "Para responder", "Para fazer". "Atividade enviada" não muda
- Rodar: `npx vitest run --project unidade apps/web/src/areas/aluno/atividades.test.ts` e
  `node tools/ci/e2e.ts --manter-ambiente e2e/aluno-atividade.spec.ts`
- Telas: `aluno`, `/aluno/atividades` (pelo item "Tarefas"); a tarefa corrigida vem de um lote aprovado; mockup `/aluno/tarefas`

## Fora do escopo desta tarefa

Professor na linha, prazo ("Até quinta"), barra de progresso, "NOVO", contador azul e filtro por matéria (pedem dado que o contrato
não traz); a tarefa de leitura e a prova em tela de foco (F6); o desenho ilustrado de cada matéria.

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
