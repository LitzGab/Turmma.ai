## O `estado.md`

Fica em `tasks/prd-<func>/estado.md`, no andar. É o que deixa uma sessão nova retomar sem reler
nada, e o que a retrospectiva lê para medir tempo e rodadas por tarefa.

```
# Estado da execução — <funcionalidade>

## Agora
- **Espero:** <o relatório de cada linha em curso, e em que tentativa cada tarefa está | resposta do Joaquim sobre …>
- **Devo ainda:** <o que ficou combinado e não está feito: um merge, um pedido ao Arquiteto, uma pendência da validação | nada>
- **Base:** `spec/<func>` em `<hash>`

## Concluídas
| Tarefa | Commit | Modelo | Rodadas | Observação |
|---|---|---|---|---|

## Esperando o Joaquim
## O que falhou
## O que decidi sem perguntar
```

"Agora" e "Esperando o Joaquim" são as duas seções que você relê depois de cada limpeza (passo 9): o
que não está nelas nem no quadro (que tarefa cada linha faz, e desde quando), para você não existe. As outras são histórico, e só crescem.

Em "Observação" entram os diagnósticos do Arquiteto e as divergências. Correção avulsa não tem
`estado.md`: o registro dela é o próprio documento em `tasks/correcoes/`.
