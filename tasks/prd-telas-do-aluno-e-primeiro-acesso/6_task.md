# Tarefa 6.0 — A tarefa aberta na pele nova, com a comemoração na entrega

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** 4.0, 5.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A tarefa aberta usa as peças da X1 sem mudar o fluxo, e a `Comemoracao` aparece uma vez, logo depois do envio confirmado nesta tela.

## Contexto necessário

- `techspec.md` seções 7b e 9 ("Tarefa aberta"); `prd.md` RF7, RF8 e RF20; `mockup.md` seção 2.3 (moldura, forma "Entregue agora")
- Regras 50 (itens 5 e 11), 70 (item 3) e 80 (item 6); D59: a comemoração é da entrega, nunca da nota
- Código: `areas/aluno/Atividade.tsx` (`Respondendo`, `envio.onSuccess`, `SemMaisRespostas`, `VOLTAR`); `atividade.ts`;
  `fila-de-respostas.ts`, que não muda. `Comemoracao` e onça são da 5.0; `Tela` e `Botao`, da X1, em `componentes/ui/`

## Subtarefas

- [ ] 6.1 — Moldura: `Tela` na largura `leitura`, o mapa de questões e a barra "Anterior" e "Próxima" com as peças da X1 (a barra presa
  embaixo no celular). "Voltar para Atividades" vira "Voltar para Tarefas", e o "não disponível" aponta para Tarefas. Não muda: o
  fluxo, a fila, o diálogo "Enviar a atividade?", o resultado só depois de aprovado, "Atividade enviada", "Pedir ajuda ao Tutor
  nesta questão" e os `data-*`
- [ ] 6.2 — `Atividade` guarda `entregueAgora` em estado de tela, ligado só no `onSuccess` do envio; `SemMaisRespostas` mostra a
  `Comemoracao` ("Atividade entregue." e "Quem dá a aula vê a correção antes de você.", com a pose comemorando e "Voltar às tarefas")
  só com `entregueAgora` e `enviadaEm` preenchida. Nada em `localStorage`, na URL ou no cache
- [ ] 6.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/aluno/Atividade.tsx`, `apps/web/src/areas/aluno/Atividade.test.tsx` | alterado |
| `e2e/aluno-atividade.spec.ts` | alterado |

Não edita `roteiro-da-demonstracao.spec.ts` nem `aluno-fluxo.spec.ts`: "Atividade enviada" continua.

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| aparece no envio | componente + e2e | depois da confirmação, a `Comemoracao` está na tela, uma vez, com a onça comemorando, a função e o selo "IA" |
| não aparece ao reabrir | e2e | a tarefa enviada, aberta pela lista ou depois de recarregar, mostra só o "Atividade enviada" |
| não aparece no resultado nem na encerrada | componente | a tarefa com resultado e a encerrada pela professora abrem sem comemoração |
| envio que falha | componente | `ATIVIDADE_ENCERRADA` e erro de rede: nenhuma comemoração |
| nunca de nota nem de acerto | componente | a comemoração não traz número, acerto, tempo nem "parabéns"; só o fato da entrega |
| falas (regra 70, item 4a; D58) | unidade | o texto da `Comemoracao` passa no teste de falas: não afirma ser pessoa, não promete voltar nem esperar, sem vínculo ou saudade |
| movimento reduzido | e2e | com `reducedMotion: 'reduce'` o `animationName` é `none` |
| quatro estados | componente | carregando, não disponível, erro com "Tentar de novo", com dado |
| recomeço da tela | e2e | o aluno seguinte no mesmo computador não herda a comemoração nem a fila do anterior |
| 360 px | e2e | sem rolagem lateral e "Próxima" com 44 px |

Concorrência e log: o envio já é idempotente e não muda; esta tarefa não grava nada.

## Como testar

- Copie `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`): a rede responde a prova, os `PUT` e o
  `POST` de enviar
- E2e: `e2e/aluno-atividade.spec.ts › enviar pede confirmação…` ganha a comemoração; os outros casos mudam só rótulo
- Rodar: `npx vitest run --project unidade apps/web/src/areas/aluno/Atividade.test.tsx` e
  `node tools/ci/e2e.ts --manter-ambiente e2e/aluno-atividade.spec.ts`
- Telas: `aluno`, `/aluno/atividades/<id>` (Tarefas, a linha da tarefa, responder tudo, "Enviar a atividade"); mockup
  `/aluno/tarefas/:id` (formas a e c)

## Fora do escopo desta tarefa

Tutor ao lado da questão, tarefa de leitura, "Isso está errado?", recado com carimbo, "Vale revisar" e prova em tela de foco (F6);
trocar "atividade" por "tarefa" nos textos da tarefa e do Tutor. Se o `conformidade-reviewer` vetar a comemoração, a peça sai daqui.

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
