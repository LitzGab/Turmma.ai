## O que verificar

1. **Rate limit** por usuário e por escola. Qualquer limite ou bloqueio só por IP é
   reprovação.
2. **Nada demorado em request.** Chamada de modelo sem streaming, extração de PDF, envio
   de e-mail em lote ou exportação dentro do request é reprovação.
3. **Fila com prioridade certa** e limite de concorrência por escola. Job de lote na fila
   interativa é reprovação.
4. **Gateway de IA:** a chamada passa pelo limitador, tem timeout e tem caminho de
   degradação. Chamada que devolve erro cru ao aluno quando o provedor recusa é reprovação.
5. **Sem estado em memória** que quebre com duas instâncias: sessão, sala, contador,
   cache de autorização.
6. **Concorrência:** operação que pode ser disparada duas vezes ao mesmo tempo (clique
   duplo, dois alunos, job repetido) está protegida por restrição, transação ou
   idempotência? Procure o padrão "busca, verifica, grava" sem trava.
7. **Índice e paginação:** query nova em tabela que cresce com aluno tem índice começando
   pelo escopo e é paginada. Peça o `EXPLAIN` se houver dúvida.
8. **Prova online:** resposta salva por item, idempotente, relógio no servidor, retomada
   após queda.
9. **Migration** compatível com o código anterior. `ALTER` que trava tabela grande, coluna
   `NOT NULL` sem valor padrão em tabela com dado, ou rename direto são reprovação.
10. **Métrica e alerta:** código novo no caminho quente mede latência e erro; alerta novo
    tem runbook.
11. **Teste:** existe teste de concorrência para o item 6 e, se a tarefa está no caminho
    quente, o cenário do teste de carga foi atualizado. Nenhum teste chama provedor pago.
