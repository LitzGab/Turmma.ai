# Achados das revisões — `tasks/correcoes/2026-10-23-entrar-renovacao-concorrente.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-23 21:24:44 · `tasks/correcoes/2026-10-23-entrar-renovacao-concorrente.md`

VEREDITO: APROVADO
Caminho quente tocado: login (só o teste e2e da renovação de sessão; nenhum código de produção muda)
Rate limit: não se aplica (a correção não muda limite nem bloqueio)
Fila e prioridade: não se aplica
Concorrência: protegida
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: não se aplica
Bloqueantes: nenhum
Recomendações:
- O teste ainda prova a corrida que importa às 10h. Sem a trava, as duas renovações começam quase juntas e cada uma fica presa 1 s em `ROTA_RENOVAR` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/e2e/entrar.spec.ts:196-199`). A sobreposição real fica perto de 1000 ms, e a tolerância de 250 ms só deixaria passar menos de 250 ms. A mutação de `comTravaDeRenovacao` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/apps/web/src/api/sessao.ts:406-408`) fica vermelha de dois jeitos: pela asserção de sobreposição e pelo reuso do refresh, que encerra a família da sessão e manda uma das abas para `/entrar` (linha 222). Por isso a mutação não depende de quanto a CPU lenta atrasa a abertura das duas abas.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/e2e/entrar.spec.ts:203-209`: o horário é tirado no Node, quando o evento chega. Daria para tirá-lo no próprio navegador, por exemplo com `request.timing()` no `requestfinished` ou com uma marca registrada pela trava na página. Isso tiraria a dependência da ordem de entrega entre as duas sessões do CDP e permitiria tolerância zero. Fica para o `/retro`, não bloqueia.
- A correção não tem vermelho que se repita sempre. O documento põe no lugar a medida da folga (1 a 7 ms em 40 corridas, −1 ms na esteira) e 80 corridas verdes seguidas. Isso basta para um defeito do critério do teste. Vale registrar no `/validar` que o teste escrito para provar a trava falhou primeiro na esteira e não na tarefa 18.0.

## test-engineer · 1ª rodada · APROVADO · 2026-10-23 21:24:48 · `tasks/correcoes/2026-10-23-entrar-renovacao-concorrente.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Caminho feliz: duas abas que têm o token só no cookie renovam uma depois da outra, e nenhuma volta para `/entrar`.
- Concorrência de verdade: as duas abas abrem juntas com `Promise.all` e a `ROTA_RENOVAR` segura cada pedido por 1 s. Assim, sem a trava, os dois pedidos ficariam abertos ao mesmo tempo.
- Ruído de medição: o horário do `request` e do `requestfinished` vem de sessões CDP diferentes e chega fora de ordem por 1 a 7 ms, e a esteira mediu −1 ms. Isso não pode reprovar o teste.
- A tolerância não pode esconder a sobreposição real, que fica em torno de 1000 ms sem a trava.
- Permissão e isolamento: não se aplicam. A correção muda só o critério de um teste e não toca dado de escola nem rota.

**Cobertos:**
- Caminho feliz: as asserções `janelas.length >= 2` e `not.toHaveURL(/\/entrar$/)` nas duas abas (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/e2e/entrar.spec.ts:216` e `:222`) continuam iguais.
- Concorrência: as duas chamadas saem em paralelo de verdade (`:213-214`), não em sequência.
- Ruído: a nova `TOLERANCIA_DO_RELOGIO_MS = 250` (`:20`) é usada só na comparação de sobreposição (`:220`). Fica bem acima do ruído medido (de −1 a 7 ms) e bem abaixo da sobreposição sem a trava (cerca de 1000 ms).
- Tolerância contra sobreposição real: o bloco de mutação troca `travas.request(NOME_DA_TRAVA_DE_RENOVACAO, tarefa)` por `tarefa()` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/apps/web/src/api/sessao.ts:408`. Conferi que esse trecho existe e bate com a linha atual. O teste fica vermelho pelo motivo certo: a asserção de sobreposição (`:220`) vem antes da checagem de URL (`:222`). Com as duas rotas seguradas em paralelo, `inicio` fica cerca de 1000 ms antes de `anterior.fim`, então cai na mensagem "duas renovações ao mesmo tempo", e não num efeito colateral.
- Integridade do teste: nenhum `.skip`, nenhum teste comentado. A rota interceptada só atrasa e depois segue com `rota.continue()`, então não esconde a trava, que vive no navegador.
- A tolerância é a única cláusula nova e é do próprio teste. Ela foi provada pela mutação da trava, que o portão já executou. Não há cláusula de produção sem bloco. Não há IA envolvida.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Como o ruído vem de datar no Node, uma correção sem tolerância é datar os eventos no navegador. As duas abas estão no mesmo processo e no mesmo relógio. Daria para usar `request.timing()` (`startTime` mais `responseEnd`) ou `performance.timeOrigin` mais `performance.now()` dentro de cada aba. O critério estrito `inicio >= fim` voltaria a valer. Fica registrado para o `/retro`, porque a tolerância de 250 ms já resolve.
2. O documento não tem vermelho determinístico e substitui por amostragem: 40 corridas antes e 80 verdes depois. Para um defeito de critério de teste que depende de ordem entre canais, isso é aceitável. Seria bom o `/validar` conferir que o job `e2e 1/7` da esteira fica verde no próximo push.
3. O "Sintoma" cita `e2e/entrar.spec.ts:181` e `:213`, que são as linhas antigas. Hoje o caso começa em `:188` e a asserção está em `:220`. É só texto e não bloqueia.

Não rodei o e2e: ele precisa da stack de pé, e o portão da tarefa já provou a mutação.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-23 21:24:48 · `tasks/correcoes/2026-10-23-entrar-renovacao-concorrente.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A correção muda só o critério de tempo de um caso de e2e: a constante `TOLERANCIA_DO_RELOGIO_MS = 250` e a asserção `inicio >= fim anterior - tolerância` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/e2e/entrar.spec.ts:20` e `:220`. Nenhuma migration, DTO, rota, repository ou código de produção mudou.

Fora da tabela de dados do docs/lgpd.md: nada. Não entra campo novo.

Autorização por objeto: ok. Nenhuma rota foi tocada. O caso continua provando o que protege a sessão: a trava das Web Locks impede que as duas abas se cruzem na renovação e reusem o cookie que a outra acabou de rotacionar. A mutação declarada tira a trava em `apps/web/src/api/sessao.ts` e precisa ficar vermelha. Com a trava ausente, as renovações se sobrepõem por cerca de 1000 ms, quatro vezes a tolerância de 250 ms, então a tolerância não esconde a corrida real.

Logs: limpos. A sonda temporária (`console.log` da folga) que o documento cita foi retirada, e não há `console.log` nem `console.info` no diff nem no arquivo.

Auditoria: não se aplica. Não há leitura de dado de aluno, exportação, mudança de nota ou de permissão, nem aprovação de saída de IA.

Envio externo: nenhum.

Seed/fixture: sintético. `criarEquipeComSenha`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/e2e/__fixtures__/sessao.ts:77-97`, não mudou e gera "Professora sintética <marca>" com e-mail no domínio reservado `@educa.invalid`.

Pergunta de fechamento: a resposta à secretaria não muda com esta correção. Nada passa a ser guardado sobre o aluno e nada passa a ser enviado para fora.

Bloqueantes: nenhum.

Recomendações:
- O comentário da constante (linhas 14 a 19) cita a "esteira de 23/10/2026". Com o tempo, o run `40006927589` fica mais fácil de rastrear que a data. Não bloqueia.
