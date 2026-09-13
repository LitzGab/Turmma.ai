# Regra 80 — Infraestrutura, carga e operação

## Por que esta regra existe

Uma escola que entra traz 400 usuários de uma vez, e eles não se espalham pelo dia: às 7h30
turmas inteiras fazem login no mesmo minuto, e às 10h seis turmas usam o tutor juntas. Tudo
isso sai do mesmo IP, porque a escola é uma rede só.

Um sistema que funciona com dez usuários de teste pode cair exatamente nesse momento, e o
momento é o pior possível: no meio de uma prova, na frente da turma, com o professor que
ainda estava decidindo se confia em nós. Depois do vazamento de dado, é o jeito mais rápido
de perder uma escola.

E quem opera é uma pessoa só, sem plantão. O sistema precisa se defender sozinho e avisar
antes de a escola ligar.

O desenho completo, com o modelo de carga em números, está em `docs/infra.md`.

## O modelo mental

**Dimensione para a manhã de segunda, não para a média.** A pergunta que decide qualquer
código no caminho quente não é "funciona?". É **"o que acontece com isso às 10h, com
sessenta turmas ao mesmo tempo?"**.

## As regras

1. **Rate limit é por usuário e por escola, nunca só por IP.** A escola inteira aparece
   como um IP. Bloquear IP por força bruta no login bloqueia 400 alunos por causa de um. A
   proteção de login é por conta (escola + matrícula).

2. **Nada demorado em request** (regra 00, item 4), e a fila tem **prioridade**:
   interativa (tutor em sala, ferramenta com o professor esperando), normal, e lote
   (ingestão, correção em massa, agente noturno, expurgo). Lote nunca atrasa interativo. Lote
   que não é urgente roda fora do horário letivo.

3. **Uma escola não degrada outra.** Job de fila tem limite de concorrência por escola.
   Query tem `statement_timeout`. Upload tem limite de tamanho e de quantidade por vez.

4. **Toda chamada de modelo passa pelo limitador do gateway de IA**, com prioridade,
   limite de tokens por minuto abaixo do contratado, timeout, e degradação declarada: fila
   curta com aviso, depois modelo menor do mesmo perfil, depois provedor de reserva. Nunca
   erro cru para o aluno.

5. **API, realtime e worker não guardam estado em memória** que outra instância precise.
   Sessão, sala ao vivo e rate limit ficam em Redis. Com duas instâncias, qualquer
   requisição pode cair em qualquer uma.

6. **Resposta de prova nunca se perde.** Salva no servidor a cada item, com gravação
   idempotente, reenvio no cliente quando a conexão volta, e relógio da prova no servidor.
   Queda do sistema não conta como tempo do aluno.

7. **Concorrência resolvida no banco, não com "verifica e depois grava".** Dois alunos
   reivindicando o mesmo nome, dois cliques em aprovar, job rodando duas vezes: restrição
   única, transação, ou chave de idempotência.

8. **Toda query em tabela que cresce com aluno tem índice que começa pelo escopo**
   (`escolaId`, e `anoLetivoId` quando houver), e listagem é paginada. `MensagemTutor`,
   `Resposta`, `Evento` e `TrechoIndexado` são as primeiras que crescem.

9. **Migration é compatível com a versão anterior do código.** Expandir, migrar, contrair.
   Deploy em produção só fora do horário letivo, e rollback é um comando.

10. **Código novo no caminho quente mede a si mesmo.** Latência, erro e, se for fila,
    tamanho e idade do job por escola. Alerta novo vem com o parágrafo do runbook que diz o
    que fazer (`docs/runbook.md`).

11. **Teste de carga não chama provedor pago** (regra 30). Usa o adaptador falso com a
    latência de streaming simulada.

12. **Staging nunca tem dado real** (regra 20). Seed sintético, sempre.

## Como isso é checado

O subagente `infra-guardian` audita toda tarefa que mexe em login, tutor, modo sala, prova
online, fila, gateway de IA, migration em tabela grande, deploy ou configuração de
ambiente. O veto dele é falha da tarefa.
