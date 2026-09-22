# Achados das revisões — `tasks/correcoes/2026-09-20-reconciliacao-espera-o-redis-subir-dentro-do-orcamento.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-20 13:56:43 · `tasks/correcoes/2026-09-20-reconciliacao-espera-o-redis-subir-dentro-do-orcamento.md`

Verifiquei o diff, o `aguardarSaudavel`, o healthcheck do `redis-fila`, o cliente de fila e medi a recuperação nesta máquina.

O que apurei, para sustentar o veredito:

- `tools/testes/compose.ts:68` — `aguardarSaudavel` tem teto próprio de 60 s e erra com estado + 40 linhas de log. Não há corrida de "healthy velho": medi o ciclo `stop` → `start` e o `docker compose ps --all --format {{.Health}}` devolve vazio com o container parado e `starting` logo após o `start` (141 ms), nunca `healthy` residual. A espera não pode retornar cedo.
- `packages/nucleo/src/redis/clientes.ts:52-57` — `enableOfflineQueue: false` faz cada `reconciliar()` do poll falhar na hora enquanto o cliente está desconectado (nada de consumir o orçamento em timeout de comando), e o `retryStrategy` tem teto de 2 s. Medição independente com o mesmo cliente, sob 6 laços de CPU ocupados: `start` 201 ms, saudável em 2.561 ms, primeiro comando OK em 2.561 ms — **recuperação depois de saudável: 0 ms**. Com `interval: 2s` no healthcheck, o portão de saúde chega depois de o cliente já ter reconectado; os 20 s ficam como margem de ~10× sobre o pior caso medido (1,4 s) e continuam pegando qualquer regressão acima de 20 s.
- Caso rodado isolado: verde em 6,80 s. (Sob 12 laços de spin o vitest morre de fome antes de iniciar — exit 124, sem saída de teste —, exatamente o que o documento registra na seção Evidência: o vermelho seria da máquina.)
- O padrão já é convenção no repositório: `apps/realtime/test/sistema.int.test.ts:369-371` usa `aguardarSaudavel('redis-fila')` seguido de poll de 20 s; `infra/test/jobs.int.test.ts:165-166` e `infra/test/metricas.int.test.ts:154,189` idem. A correção alinha o caso ao que os irmãos já fazem.
- As asserções de degradação continuam intactas (`reconciliacao.int.test.ts:196-206`): timeout de comando dentro da janela, `semConfirmacao: 1` sem republicar, linha em `publicado`, dois `reconciliacao.consulta_falhou`, zero `job.republicado`. E a garantia de que o Redis que volta é usado de novo e o job não se perde continua sendo o que o poll prova — agora com orçamento dedicado e menor, não maior.
- Orçamento do caso: pior caso ≈ 90 s (setup + 2 s travado + stop + start + 60 s de espera + 20 s de poll) dentro dos 120 s, com folga para o erro legível de `aguardarSaudavel` subir antes de o vitest expirar. O comentário em `reconciliacao.int.test.ts:218-219` descreve isso corretamente.
- A causa não esconde fragilidade de infra: o tempo de subida do container saiu do orçamento, mas não foi silenciado — passou a ter teto próprio e falha com estado e log do serviço. Se o runner estiver mesmo doente, o vermelho vira diagnóstico em vez de `expected [] to deeply equal [ Array(1) ]`.

```
VEREDITO: APROVADO
Caminho quente tocado: fila
Rate limit: não se aplica (nada de limite tocado)
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- apps/despachante/test/redis-fora.int.test.ts:97 — mesmo `composeAssincronoOuFalha('start', 'redis-fila')` sem `aguardarSaudavel`, com poll de 60 s absorvendo a subida do container. Não é urgente (a folga é 3× maior), mas é a mesma fragilidade e, quando ela aparecer, virá com a mesma mensagem ilegível. Vale alinhar numa próxima passada por esse arquivo.
- `aguardarSaudavel` usa o healthcheck de `interval: 2s` (infra/compose.yml:44), então o portão de saúde tende a chegar depois de o cliente já ter reconectado. Se um dia quiserem que o poll meça de fato a latência de reconexão, o ponto de partida honesto é o `ready` do cliente, não o healthcheck.
- A tabela de Evidência mistura código antigo com prazo novo na linha "como estava"; o próprio documento avisa (linhas 110-113). Para o /retro: reprodução de vermelho vale mais quando a linha de controle usa o código exatamente como estava.
```

## test-engineer · 2ª rodada · APROVADO · 2026-09-20 14:26:11 · `tasks/correcoes/2026-09-20-reconciliacao-espera-o-redis-subir-dentro-do-orcamento.md`

Auditei só o diff desde a minha rodada 1 (`apps/despachante/test/reconciliacao.int.test.ts:208-220` e o parágrafo novo do documento), e o que ele afeta: o orçamento do caso e a legibilidade da falha.

**Conferência das correções exigidas/recomendadas aplicadas**

1. Recomendação 1 (prazo do `it`): aplicada em `apps/despachante/test/reconciliacao.int.test.ts:220` — `90_000` → `120_000`, com o comentário em `:218-219` explicando o porquê. A opção por alargar o `it` em vez de encurtar o teto do `aguardarSaudavel` está certa e é a mais conservadora: o teto de 60 s de `tools/testes/compose.ts:68` é o que produz o erro legível (estado do serviço + 40 linhas de log); encurtá-lo encurtaria a tolerância a runner lento, que é exatamente o defeito original. Alinhamento com o irmão do Postgres confirmado: `reconciliacao.int.test.ts:337` também é `120_000`.
2. Orçamento refeito por mim, e fecha: setup + 2 s do comando travado (`TIMEOUT_COMANDO_REDIS_FILA_MS = 2_000`, `packages/nucleo/src/redis/clientes.ts:35`) + `stop`/`start` + 60 s de `aguardarSaudavel` + 20 s do poll ≈ 90 s de pior caso dentro de 120 s. Com os 90 s anteriores o `aguardarSaudavel` podia estourar junto com o vitest e a mensagem útil se perdia — o motivo da recomendação, resolvido.
3. Recomendação 4 (tabela de evidência): aplicada, documento linhas 110-113, e diz o que eu pedia — a linha "como estava" mistura código antigo com prazo novo, e reproduzir o vermelho original exigiria adiamento maior que 30 s, sem mudar a conclusão.

**A regra continua provada.** O prazo que mede a regra não mudou: o `expect.poll` de 20 s em `:217` segue sendo o único orçamento da recuperação, e se `reconciliar()` deixar de republicar depois do Redis voltar o teste fica vermelho em 20 s, muito antes dos 120 s. O `it` maior é só rede de segurança externa — não afrouxa nenhuma asserção. As asserções de degradação de `:196-206` estão intactas. Sem `.skip`, sem `.only`, sem `any`, sem mock entre o teste e o cliente Redis real.

```
VEREDITO: APROVADO
Cenários exigidos: (rodada 2, só o diff) fila que não responde não republica · fila que volta republica dentro do prazo de recuperação · falha do container produz erro diagnosticável em vez de assertion ilegível · nenhuma asserção enfraquecida pelo prazo novo
Cobertos: todos — reconciliacao.int.test.ts:196-206 (degradação: timeout de comando na janela, semConfirmacao: 1, linha em `publicado`, dois `reconciliacao.consulta_falhou`, zero `job.republicado`), :213 (aguardarSaudavel com teto próprio e erro com estado + log), :217 (recuperação em 20 s, ~10× o pior caso medido de 1,4 s), :220 (120 s, igual ao irmão do Postgres em :337)
Bloqueantes: nenhum
Recomendações:
- As recomendações 2, 3 e 5 da rodada 1 ficaram fora por escopo, o que é legítimo, mas ainda não existem em TODO.md (procurei por `redis-fora`, `aguardarSaudavel` e `interval: 2s`: nenhuma ocorrência). Registre-as antes do commit desta correção, senão somem com a conversa. São elas: `apps/despachante/test/redis-fora.int.test.ts:97` com o mesmo `start` sem `aguardarSaudavel`; a guarda de lint contra `composeAssincronoOuFalha('start', ...)` sem espera pelo serviço; e a observação de que o healthcheck de `interval: 2s` (`infra/compose.yml:44`) faz o portão de saúde chegar depois de o cliente já ter reconectado — se um dia o poll precisar medir a reconexão de fato, o ponto de partida honesto é o `ready` do cliente.
- Para o `/retro`: o padrão "`start` de container seguido de poll que também mede a subida" já apareceu em dois arquivos do despachante. Vale virar item do checklist de teste de integração que derruba serviço, não achado caso a caso.
```

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/reconciliacao.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-20-reconciliacao-espera-o-redis-subir-dentro-do-orcamento.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/testes/compose.ts`.
