# Correção — nenhum teste prova a data da linha em Criados

**Origem:** `tasks/prd-telas-do-professor/validacao.md` §4, C2 (RF12).
**Subagentes obrigatórios:** `test-engineer`
<!-- Os guardiões vieram no PEDIDO do Orquestrador: nenhum além dos implícitos. A correção só acrescenta teste, em um arquivo fora de tasks/. -->

## Sintoma

Tirar ` · {formatarDataHora(artefato.criadoEm)}` de `apps/web/src/areas/professor/Criados.tsx:214` deixou `Criados.test.tsx` e
`professor-criados.spec.ts` verdes. A linha de cada documento criado deixaria de dizer quando ele foi gerado, e nada ficaria vermelho.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa.

## Causa

Os casos da lista conferiam o tipo, a turma, o estado da decisão e os filtros, mas as fixtures tinham todas a mesma `criadoEm`
(`2026-10-05T09:00:00.000Z`) e nenhuma asserção olhava a data. Nem o e2e a confere.

## Teste que reproduz

`apps/web/src/areas/professor/Criados.test.tsx`, em "Criados: os quatro estados":

- `cada linha mostra a data e a hora de quando o documento foi criado, a do próprio documento e não a de outro`: dois documentos com
  `criadoEm` um mês distantes; cada linha tem de conter o `formatarDataHora` do próprio instante e não o do outro. A comparação é com
  o formatador (a data depende do fuso do navegador, e o ambiente de teste não é o do Brasil), e o mês de distância garante que o
  texto seja outro em qualquer fuso.

Vermelho sem a data (mutação abaixo, aplicada à mão antes do portão): 1 caso falha, 21 passam. Verde com ela (22 testes do arquivo).

## Correção

Só teste: o caso acima e o import de `formatarDataHora`. Nenhum código de produção mudou.

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2).

A data sai da linha porque ela é mostrada depois da turma e do tipo.

```mutacao
arquivo: apps/web/src/areas/professor/Criados.tsx
teste: apps/web/src/areas/professor/Criados.test.tsx › cada linha mostra a data e a hora
-                            {turma !== undefined && <span className="sr-only"> · {turma}</span>} · {formatarDataHora(artefato.criadoEm)}
+                            {turma !== undefined && <span className="sr-only"> · {turma}</span>}
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | O e2e `professor-criados.spec.ts` continua sem conferir a data | Recusada: o teste de componente já prova a regra (RF12) e a correção é só de teste de unidade. O e2e fica como cobertura extra para o `/validar` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 16:29:39 | 2026-10-19 16:30:05 | `test-engineer` | 1 | APROVADO | a70bc84d33f5662b2 |
