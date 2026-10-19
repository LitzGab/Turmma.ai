# Correção — nenhum teste prova que a correção aprovada, nem a turma confirmada, saem do sino

**Origem:** `tasks/prd-telas-do-professor/validacao.md` §4, C1 (RF3).
**Subagentes obrigatórios:** `test-engineer`
<!-- Os guardiões vieram no PEDIDO do Orquestrador: nenhum além dos implícitos. A correção só acrescenta teste, em um arquivo fora de tasks/. -->

## Sintoma

Tirar a invalidação de `entregas` de `recarregarDepoisDoLote` (`apps/web/src/api/atividades.ts:88`) deixou `Aprovar.test.tsx`,
`SinoDoProfessor.test.tsx` e `fila-do-professor.test.ts` verdes. Na tela, a correção aprovada ficaria no sino até 5 minutos (o
`staleTime` da fila). O mesmo vale para "Confirme sua turma": que ele sai do sino ao confirmar só era provado de forma indireta, pela
faixa da própria tela de Turmas.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa.

## Causa

Cada teste olhava um lado da ligação. `Aprovar.test.tsx` não aprova o lote (o fluxo é do e2e) e não monta o sino; o
`SinoDoProfessor.test.tsx` só decidia pedidos de nome, com `aplicarDecisao` chamada à mão; `fila-do-professor.test.ts` testa a função
pura. Ninguém juntava a tela que decide e o sino **no mesmo cliente de consultas**, que é onde a invalidação faz diferença. O e2e
`professor-sino.spec.ts` decide pedidos e uma versão adaptada em outra aba, mas não aprova o lote nem confirma a turma.

## Teste que reproduz

`apps/web/src/areas/professor/SinoDoProfessor.test.tsx`, no `describe` "o que a professora decide em outra tela tira o item do sino,
na mesma aba (RF3)":

- `aprovar o lote tira a correção do sino, sem outra ação: as entregas são relidas e o item some da lista`: monta `Aprovar` e o sino
  no mesmo cliente, aprova o lote pelo diálogo e espera o sino em "nada" e a lista sem "Correção para revisar".
- `confirmar a turma tira "Confirme sua turma" do sino, sem outra ação, e a turma passa a ter os pedidos lidos`: monta `Turmas` e o
  sino no mesmo cliente, confirma o vínculo e espera o sino em "nada", com a leitura dos pedidos da turma feita uma vez.

Vermelho sem a invalidação (cada mutação abaixo, aplicada à mão antes do portão): o primeiro caso estoura os 5 s esperando "nada"; o
segundo, igual. Verde com ela (29 testes do arquivo).

## Correção

Só teste: o `montar` do arquivo ganhou a opção `aoLado` (a tela que decide, ao lado do sino), e entraram os dois casos acima, com a
correção do lote, a aprovação e o vínculo como a API os devolve. Nenhum código de produção mudou.

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2).

A correção aprovada sai do sino porque as entregas são relidas depois do lote.

```mutacao
arquivo: apps/web/src/api/atividades.ts
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › aprovar o lote tira a correção do sino
 export async function recarregarDepoisDoLote(cliente: QueryClient): Promise<void> {
-  void cliente.invalidateQueries({ queryKey: CHAVE_DAS_ENTREGAS })
   void cliente.invalidateQueries({ queryKey: CHAVE_DAS_ATIVIDADES })
```

A turma confirmada sai do sino porque os vínculos são relidos depois da confirmação.

```mutacao
arquivo: apps/web/src/areas/professor/Turmas.tsx
teste: apps/web/src/areas/professor/SinoDoProfessor.test.tsx › confirmar a turma tira
-  const recarregar = () => cliente.invalidateQueries({ queryKey: consultaMeusVinculos.queryKey })
+  const recarregar = () => Promise.resolve()
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | Caso de rejeitar o lote no sino (`Aprovar.tsx:204`) e de contestar o vínculo (`Turmas.tsx:93`) | Recusada: caso novo por caminho, não "poucas linhas", e hoje a mesma invalidação já está provada pelas duas mutações. Entra se cada caminho ganhar recarga própria |
| test-engineer (1ª) | Caso de `ENTREGA_JA_DECIDIDA` vindo de outra aba relendo as entregas (`Aprovar.tsx:212-220`) | Recusada: é outro comportamento (lote decidido em duas abas), fora da correção C1 da validação (RF3) |
| test-engineer (1ª) | Primeiro caso conferir também que `/v1/entregas` foi lido de novo | Recusada: o vermelho da mutação já prova a releitura (o item só sai se a lista é lida de novo); contar a chamada acopla o teste ao detalhe da rede |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 16:20:12 | 2026-10-19 16:21:21 | `test-engineer` | 1 | APROVADO | acea977a4e2f3c1ef |
