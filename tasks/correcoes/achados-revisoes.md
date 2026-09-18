# Achados das revisões

Escrito pelo hook `tools/processo/revisoes.ts`. Lido por `/retro`. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-15 20:18:27 · `tasks/correcoes/2026-09-15-vaga-conferida-antes-de-ser-liberada.md`

VEREDITO: APROVADO
Caminho quente tocado: fila
Rate limit: não se aplica (nada de limite por requisição neste diff)
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok (nada de query nova; o teste de `EXPLAIN` em `vagas.int.test.ts:383` segue intacto)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (as asserções de `METRICAS.aguardandoVaga` em `vagas.int.test.ts:370-373` continuam)
Bloqueantes: nenhum

Confirmação do ponto a julgar (procede):

- `apps/worker/src/executor.ts:234-236` faz mesmo `repositorio.concluir` → `renovacao.parar()` → `liberarVaga`, com o motivo escrito na linha 233 e em `RenovacaoDaVaga` (linhas 111-130): parar antes de liberar impede que uma renovação em voo devolva ao ZSET a vaga de um job já terminado por mais uma validade. `aguardarEstado(id,'concluido')` só olha o Postgres, ou seja, só o passo 1; conferir o ZSET na linha seguinte era corrida real, e a janela é maior no teste que usa `intervaloRenovacaoDaVagaMs: 200`. O defeito estava no teste.
- Não há vaga presa escondida: `liberarVaga` engole erro de Redis e a vaga vence em 60 s (`VALIDADE_DA_VAGA_MS`), `tomar` poda as vencidas no `vaga.lua`, e o teto volta a valer na execução (`executor.ts:200-203`), não só na publicação — é o que o teste de publicação ambígua prova.
- Não há afrouxamento que deixe verde sem o worker: `membrosDaVaga` lê `zrange 0 -1`, então membro vencido e não removido continua reprovando, e o prazo de 5 s é muito menor que os 60 s de validade. Se o worker deixar de liberar, o `poll` estoura.
- O retry não fica com vaga órfã: o recuo do BullMQ vai no máximo a ~16 s + jitter (`packages/nucleo/src/fila/publicacao.ts:4-21`), abaixo da validade, e se vencer o `tomarVaga` da tentativa seguinte retoma ou o job espera sem estourar o teto.
- O diff não toca produção. `apps/despachante/test/redis-fora.int.test.ts` está modificado na árvore, mas é a troca de token sintético por `BancadaDeSessoes` da tarefa 2.0 — fora desta correção.

Recomendações:

- `apps/despachante/test/vagas.int.test.ts:138` — `expect(timeout).toBeLessThan(VALIDADE_DA_VAGA_MS / 2)` compara duas constantes (5.000 < 30.000) e nunca pode falhar; ele não protege o caso que o próprio comentário descreve, porque a validade curta é opção de bancada (`validadeDaVagaMs: 1_000`, linhas 333 e 345), não a constante do módulo. Hoje nenhum ponto de chamada usa validade curta, então não bloqueia; se um dia usar, o helper precisa receber a validade em vigor (ou conferir o score do ZSET).
- `apps/despachante/test/vagas.int.test.ts:366` — a asserção positiva nova observa uma janela de ~300 ms de ocupação por rodada; num runner carregado ela pode dar vermelho falso (nunca verde falso). Uma prova determinística de que o helper aponta para a chave certa seria comparar `bancada.vagas.chave('lote', ESCOLA_A)` diretamente, já que `processador.maximo('A')` na linha 368 é quem prova as duas execuções simultâneas.
- A tolerância de 5 s tira deste arquivo qualquer prova de que a liberação é rápida; quem cobre isso é o teste de `vagas.int.test.ts:190` ("a vaga liberada acorda o despachante"). Vale a linha no documento da correção, para a próxima leitura não achar que a latência de liberação ficou sem teste.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-15 20:22:15 · `tasks/correcoes/2026-09-15-vaga-conferida-antes-de-ser-liberada.md`

VEREDITO: APROVADO
Caminho quente tocado: fila
Rate limit: ok (não tocado nesta correção)
Fila e prioridade: ok (nenhuma mudança em produção; `apps/worker` e `apps/despachante` intocados no diff)
Concorrência: protegida — a ordem `concluir → parar renovação → liberar vaga` do executor continua intacta, e o teste passou a tolerá-la em vez de exigir simultaneidade
Índice e paginação: ok (o teste do `EXPLAIN` por chave primária, linhas 383+, continua no lugar)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (o teste da métrica `aguardandoVaga`, linhas 370-373, permanece)
Bloqueantes: nenhum

Verificações feitas nesta rodada:

1. A retirada do `toHaveLength(2)` não deixa a chave do helper sem prova. `membrosDaVaga` deriva de `bancada.vagas.chave(fila, escolaId)`, e as duas combinações usadas por `aguardarVagaVazia` têm afirmação determinística de `zscore` sobre a mesma chave com o job em execução: `('lote', ESCOLA_A)` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/vagas.int.test.ts:284` e `('normal', ESCOLA_A)` em `:320`, `:322` e `:326`. Chave errada deixaria esses vazios/nulos. Recomendação 2 atendida sem perda de cobertura.
2. Nenhum resíduo da tentativa anterior no arquivo, e as asserções que provam a regra do teto continuam (`processador.maximo('A')).toBe(2)` em `:368`).
3. Rodei o arquivo: `npx vitest run --project integracao apps/despachante/test/vagas.int.test.ts` → 17 passed (17), 18,5 s.
4. Verde por vencimento está descartado nos três pontos de chamada atuais (`:299`, `:331`, `:380`): todos rodam com a validade padrão de 60 s e prazo de 5 s, e `membrosDaVaga` usa `zrange 0 -1` sem filtro de score, então membro vencido e não removido reprova.

Sobre a recomendação 1 — basta, e continua recomendação, não exigência:

- `expect(timeout).toBeLessThan(VALIDADE_DA_VAGA_MS / 2)` (`:141`) compara a constante do módulo com a constante padrão do helper; é sempre verdadeiro e não vê a validade real do teste que chama. O arquivo já tem um teste com `validadeDaVagaMs = 1_000` (`:336`), e se um dia ele ganhar um `aguardarVagaVazia`, a guarda passa (5.000 < 30.000) enquanto o prazo é cinco vezes a validade — exatamente o caso que a guarda diz proteger. Hoje isso é hipotético: esse teste não chama o helper, e a regra "a vaga sai no fim do job" está provada nos três pontos reais. Por isso não bloqueia.
- O que eu recomendo (não exijo): passar a validade do caso ao helper (`aguardarVagaVazia(fila, escolaId, { timeout, validadeMs })`, com a asserção contra a validade recebida), ou, se ficar como está, corrigir a frase do documento. O texto em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-15-vaga-conferida-antes-de-ser-liberada.md:74` afirma que a guarda existe "para que um teste com validade curta não a quebre em silêncio", e ela não faz isso — lê o padrão do módulo, não a validade do chamador. Documento que promete garantia que o código não dá é o que faz a próxima pessoa confiar no helper no teste errado.

Recomendações:
- `.../vagas.int.test.ts:138-141` — parametrizar a validade no helper, ou ajustar a frase do documento (`:74` e `:91`) para dizer que a guarda só cobre a validade padrão e que o caso de validade curta depende de quem chamar.
- Documento, seção "Correção": registrar explicitamente que os três pontos de chamada rodam com validade padrão de 60 s; é isso que sustenta "o verde não vem do vencimento" hoje, e é a condição que a próxima alteração precisa preservar.

## test-engineer · 2ª rodada · APROVADO · 2026-09-15 20:35:22 · `tasks/correcoes/2026-09-15-vaga-conferida-antes-de-ser-liberada.md`

Auditei o diff de `apps/despachante/test/vagas.int.test.ts`, o documento da correção, e o código que ele afirma provar (`packages/nucleo/src/fila/vaga.lua`, `vagas-por-escola.ts`, `apps/worker/src/executor.ts`). Não reauditei o resto do arquivo nem a tarefa 2.0.

**Verificação das correções exigidas/recomendadas da rodada 1**

- Rec. 3 (o verde não pode vir do vencimento) — feita, e substantivamente correta. `vagas.int.test.ts:141` afirma `timeout < VALIDADE_DA_VAGA_MS / 2`. Conferi que vale de fato nos três pontos de chamada: nenhum deles passa `validadeDaVagaMs`, então worker e `bancada.vagas` ficam nos 60 s (`vagas-por-escola.ts:7,37`). E o `PEXPIRE` da chave em `vaga.lua:44,56,78` é a própria validade (60 s), então nem a chave inteira some dentro dos 5 s. Como `membrosDaVaga` usa `zrange 0 -1` sem filtro de score, membro vencido e não removido continua reprovando — a parte "as vencidas saíram na tomada" do teste do worker morto segue provada.
- Rec. 4 (asserção positiva da chave) — a retirada é aceitável, e o motivo do `infra-guardian` procede: aquela asserção observaria a janela de execução e traria de volta o vermelho falso que esta correção veio tirar. O substituto é real e mais forte do que o documento diz: em `vagas.int.test.ts:320-326` o teste da retentativa lê `zscore(chave, id)` com o job `ativo` e exige que o score cresça; com chave errada o `zscore` volta `null`, `Number(null)` é 0 e as linhas 322 e 326 ficam vermelhas — determinístico, e com os mesmos literais `('normal', ESCOLA_A)` da chamada do helper na linha 331.
- Recs. 1 e 2 (evidência do vermelho e do verde) — presentes no documento, linhas 54-69, com a mesma mensagem e a mesma linha da falha da esteira.

**A prova continua de pé.** Se `liberarVaga` sumisse do executor (`executor.ts:236`), os três pontos ficariam vermelhos: a vaga permanece no ZSET por 60 s, muito além dos 5 s do `poll`. Nada de produção mudou, não há `.skip`, teste comentado nem mock cobrindo a regra, e o teste de concorrência de verdade do arquivo (dois despachantes em paralelo, linha 219) não foi tocado.

```
VEREDITO: APROVADO
Cenários exigidos: a vaga sai no fim do job (três pontos); vaga vencida sai na tomada; o verde
  não pode vir do vencimento da vaga nem da expiração da chave; a chave conferida é a que o
  worker ocupa; a lentidão na liberação não fica sem cobertura; nenhum ponto de produção alterado.
Cobertos: todos. vagas.int.test.ts:299, :331, :380 (a vaga sai, com poll de 5 s contra validade de
  60 s); :296-299 (vencida sai na tomada, com zrange sem filtro de score); :141 (guarda contra o
  vencimento); :320-326 e :284-293 (identidade da chave); :193-204 (liberação acorda o despachante).
Bloqueantes: nenhum.
Recomendações:
  1. vagas.int.test.ts:138-141 — a guarda compara com a constante do módulo, não com a validade
     em vigor no teste, e o próprio comentário invoca o teste de 1 s (linha 336). Se alguém chamar
     o helper lá, `5_000 < 30_000` passa enquanto a validade real é 1 s: verde pelo vencimento,
     exatamente o que a guarda queria impedir. Receber a validade em vigor como parâmetro
     (padrão `VALIDADE_DA_VAGA_MS`) fecharia o buraco.
  2. vagas.int.test.ts:135-136 e documento linha 96 — no teste do worker morto o `zscore` é sobre
     ids que o próprio teste inseriu com `bancada.vagas.tomar`; o que prova a chave ali é o
     comportamento (o job fica `aguardando` na linha 293 com as duas vagas ocupadas, e anda depois
     de vencê-las). No da retentativa o argumento do `zscore` é exato. Vale escrever assim, para um
     leitor futuro não se apoiar na metade tautológica.
  3. Não consegui rodar o arquivo de forma válida aqui: há outra sessão com
     `vitest run --project unidade --project integracao` e `--project infra` no mesmo compose. A
     primeira execução deu 12 vermelhos com assinatura de disputa (inclusive em testes que este
     diff não toca, como `listarEscolasComPendentes` na linha 501) e a segunda abortou na migração
     com 57P03. Não é evidência contra o diff; o verde registrado no documento deve ser de execução
     limpa, e vale repetir o arquivo sozinho antes do commit.
```

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/vagas.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-15-vaga-conferida-antes-de-ser-liberada.md`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/fila/vaga.lua`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/executor.ts`.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-16 00:30:18 · `tasks/correcoes/2026-09-16-rodada-antes-do-redis-do-despachante.md`

VEREDITO: REPROVADO

Cenários exigidos (para esta correção)
1. Caminho feliz: a primeira `rodada()` da bancada só sai com o Redis do despachante de pé.
2. Contrato do mecanismo: a primeira `rodada()`/`reconciliar()` segura até `pronto`; a segunda não segura de novo.
3. Borda — Redis fora de verdade: `pronto` resolve pelo erro do cliente (e não pelo teto de 5 s), para a degradação continuar exercitada sem pedágio.
4. Borda — teto: Redis que nem erra nem fica `ready` não trava a bancada para sempre.
5. Borda — a cadeia causal do defeito: leitura de vaga que falha → rodada devolve 0 → `vaga_indisponivel` no log.
6. Borda — recaída nomeada: o teste que caiu acusa a causa, não `expected +0 to be 2`.
7. Todos os pontos de entrada da bancada que leem Redis logo após a montagem estão cobertos.
8. Isolamento/LGPD/IA: não se aplicam (sem dado de pessoa, sem provedor, escopo por escola já vem do contexto).

Cobertos: 5 (`apps/despachante/test/janela.int.test.ts:131`, e é um teste de verdade — se você tirar o `return publicados` em `vaga_indisponivel` de `apps/despachante/src/despachante.ts:141`, ele fica vermelho). 3 parcialmente, por efeito colateral dos testes de `redis-fora.int.test.ts`. Nada mais.

Bloqueantes

1. **A correção inteira não tem teste que a prove.** `apps/despachante/src/montagem.ts:150-165` (`pronto`) e `apps/worker/test/fila-de-teste.ts:91-107` + `:220` (`esperarORedisNaPrimeiraVez`) são o código novo, e nenhum teste falha se eles sumirem. Falsificação, pela régua da regra 40: troque `pronto` por `Promise.resolve()` na linha 150, ou devolva `montado` cru na linha 220 — typecheck, lint e os 1050 testes continuam verdes, e o arquivo `janela.int.test.ts` continua 20/20 na sua máquina, porque lá a conexão sempre ganha a corrida. Isso é exatamente o estado de antes da correção. O teste novo da linha 131 não cobre esse buraco: ele injeta a rejeição por `embrulharVagas` e passa igual antes e depois — é caracterização do comportamento antigo do `Despachante`, não prova do conserto.
   Correção exigida: teste determinístico do **contrato do conserto**, que é determinístico mesmo sendo a causa uma corrida. Dois, concretamente:
   - exporte `esperarORedisNaPrimeiraVez` e teste-o com um `DespachanteMontado` de mentira cujo `pronto` você resolve na mão: chamar `rodada()`, afirmar que a `rodada` interna **ainda não** foi chamada, resolver `pronto`, afirmar que foi; e afirmar que a segunda `rodada()` não espera de novo (cenário 2). Some `reconciliar()` no mesmo teste;
   - teste de integração sobre `montarDespachante` com `redisFilaUrl` apontando para uma porta que ninguém atende: `await montado.pronto` resolve pelo erro, em muito menos que `TETO_DA_ESPERA_DO_REDIS_MS` (cenário 3). Sem ele, uma regressão que tire o `redis.on('error', terminar)` (montagem.ts:164) fica invisível: todo teste de Redis fora passa a pagar 5 s calado, e a suíte segue verde.

2. **A asserção de log do teste que caiu não faz o que o documento diz que faz.** `apps/despachante/test/janela.int.test.ts:124` (`expect(await despachante.rodada()).toBe(2)`) roda **antes** de `:128` (`expect(log.doEvento('despachante.vaga_indisponivel')).toEqual([])`). O `expect` da 124 lança e aborta o teste, então numa recaída a mensagem continua sendo `expected +0 to be 2` e a linha 128 nunca executa. O item 2 da seção "Teste que reproduz" do documento (`tasks/correcoes/2026-09-16-rodada-antes-do-redis-do-despachante.md:63-65`) fica sem lastro — e é justamente uma das três evidências que substituem o vermelho.
   Correção exigida: guardar o resultado e afirmar o log primeiro — `const publicados = await despachante.rodada()`; `expect(log.doEvento('despachante.vaga_indisponivel')).toEqual([])`; `expect(publicados).toBe(2)`.

3. **Um terceiro ponto de entrada com a mesma exposição ficou de fora do conserto e sem teste.** `apps/despachante/test/metricas-espera.int.test.ts:55-57` monta o despachante e chama `medicao.medir()` direto, sem passar por `rodada()` nem `reconciliar()` — os dois únicos métodos que `fila-de-teste.ts:96` e `:100` embrulham. `MedicaoDaFila.medir` abre com uma consulta ao Postgres (`medirPendentes`) e logo depois lê o Redis em `apps/despachante/src/metricas-espera.ts:167` (`vagas.emUso`), com `vagas: vagasReais` — o cliente do despachante, o mesmo que ainda está `connecting`. Perdendo a corrida, o `catch` da linha 168 engole o erro, `redisResponde` vira `false`, `vagasEmUso` fica `undefined` para todas as séries, a linha 124 não exporta a métrica e `metricas-espera.int.test.ts:87` (`expect(await porSerie(METRICAS.vagasEmUso)).toEqual({...: 2, ...})`) cai com um `{}` — a mesma falha, com outra roupa. A afirmação do documento (linhas 79-81: "os 44 pontos de montagem nos nove arquivos de teste ficam corrigidos de uma vez") é falsa enquanto isso ficar assim, e essa é a quarta esteira vermelha esperando.
   Correção exigida: `esperarORedisNaPrimeiraVez` também embrulhar `montado.medicao?.medir`, compartilhando a mesma `espera`, e um teste que prove a espera nesse caminho (pode ser o mesmo teste do bloqueante 1, com `medir()` junto de `rodada()` e `reconciliar()`).

Respostas diretas aos seus quatro pontos

1. **Não concordo com a premissa inteira.** Para a corrida em si — conexão TCP contra consulta ao Postgres — concordo: não há vermelho determinístico sem atrasar a conexão por fora, e isso testaria o atraso. Mas o que a correção acrescentou não é a corrida, é um contrato: "a bancada não entrega despachante antes do `pronto`, e `pronto` resolve no `ready`, no `error` ou no teto". Esse contrato é 100% determinístico e hoje não tem nenhum teste. O documento pulou do "não dá para reproduzir a corrida" para "não dá para testar a correção", e as duas coisas são diferentes. É o bloqueante 1.

2. **É decoração para a correção, e teste de verdade para outra coisa.** Ele prova o comportamento do `Despachante` diante de vaga indisponível — se você apagar o `if (despachados === 'vaga_indisponivel') return publicados` de `despachante.ts:141`, ele fica vermelho, então tem valor e deve ficar. O que ele não faz é provar causa nem provar conserto: passa igual dos dois lados, e a hipótese que ele sustenta ("o `membros` que falha produz 0 e `vaga_indisponivel`") nunca esteve em dúvida. O elo que falta é o outro: que o cliente *realmente* estava `connecting` na esteira e que agora não está mais. Esse elo só fecha com o teste do contrato.

3. **Não é suficiente, e por um motivo específico.** 20 execuções verdes na sua máquina são a mesma medição que já dava 5/5 **antes** da correção, com N maior. Elas não distinguem "consertei" de "aqui a conexão sempre ganha". O portão verde diz que nada quebrou, o que é necessário e não é evidência da causa. Com os testes do bloqueante 1 no lugar, as 20 execuções viram o que deveriam ser: confirmação de que não houve regressão, não a prova principal.

4. **Concordo com o raciocínio para os sete pontos de `rodada()`/`reconciliar()`, e ele não cobre o oitavo.** A espera na bancada realmente tira a causa de `janela.int.test.ts` 83, 146, 161, 176, 188, `reconciliacao.int.test.ts:102` e `reexecucao.int.test.ts:157` — todos entram por método embrulhado, e asserção repetida ali só somaria ruído. Mas a lista está incompleta: `metricas-espera.int.test.ts:57` entra por `medir()`, que não é embrulhado (bloqueante 3). E, do jeito que está, a asserção que você pôs no único ponto que caiu não dispara (bloqueante 2) — então hoje ela não protege nem esse.

Recomendações (não bloqueiam)

- `apps/despachante/test/janela.int.test.ts:131`: o nome promete "o Redis ainda conectando", mas o teste injeta uma rejeição na porta de vagas. Algo como "a rodada cujo primeiro comando de vaga falha não publica nada, e a seguinte publica" descreve o que ele faz e não sugere cobertura que ele não tem.
- `apps/despachante/src/montagem.ts:156-157`: `setTimeout(() => terminar(), ...)` cita `terminar` antes do `const`. É seguro (o disparo é assíncrono), mas inverter a ordem tira a dúvida de quem lê depois.
- O teto de 5 s (`montagem.ts:76`) é o único ramo sem caminho de teste viável que eu enxergo. Registre no documento que ele é guarda de travamento, não comportamento provado, para o `/validar` não cobrar depois.
- `pronto` entra na interface pública `DespachanteMontado` só por causa da bancada. É defensável (a conexão é interna à montagem), mas vale uma linha no documento dizendo que produção não usa — o comentário da 64-66 já diz, o documento não.
- `esperarORedisNaPrimeiraVez` também passa a atrasar a primeira rodada do laço em quem chama `iniciar()` (`reconciliacao.int.test.ts:72` e `:119`), porque `lacar()` chama `this.rodada()`. É inofensivo e até desejável; só não está escrito em lugar nenhum.

Arquivos auditados: `/Users/joaquim/Git/Educa.ia/tasks/correcoes/2026-09-16-rodada-antes-do-redis-do-despachante.md`, `/Users/joaquim/Git/Educa.ia/apps/despachante/src/montagem.ts`, `/Users/joaquim/Git/Educa.ia/apps/worker/test/fila-de-teste.ts`, `/Users/joaquim/Git/Educa.ia/apps/despachante/test/janela.int.test.ts`, `/Users/joaquim/Git/Educa.ia/apps/despachante/test/metricas-espera.int.test.ts`, `/Users/joaquim/Git/Educa.ia/apps/despachante/src/despachante.ts`, `/Users/joaquim/Git/Educa.ia/apps/despachante/src/metricas-espera.ts`, `/Users/joaquim/Git/Educa.ia/packages/nucleo/src/redis/clientes.ts`.

## test-engineer · 2ª rodada · REPROVADO · 2026-09-16 01:45:08 · `tasks/correcoes/2026-09-16-rodada-antes-do-redis-do-despachante.md`

Auditei o diff desde a rodada 1 (montagem.ts, fila-de-teste.ts, janela.int.test.ts, os dois arquivos novos), o alvo do conserto (`despachante.ts`, `reconciliacao.ts`, `metricas-espera.ts`, `montarWorker`) e a configuração do Vitest. As três correções exigidas foram feitas — mas a falsificação ficou incompleta no ponto mais importante.

VEREDITO: REPROVADO

Cenários exigidos: (a) o embrulho segura as três portas que leem Redis logo após a montagem (`rodada`, `reconciliar`, `medir`); (b) a segunda chamada não paga espera; (c) o valor devolvido é o do despachante; (d) montagem sem medição; (e) a bancada de fato aplica o embrulho (ponto de ligação); (f) `pronto` resolve pelo `ready` quando o Redis está de pé; (g) `pronto` resolve pelo `error` quando está fora, sem pagar o teto; (h) cadeia causal: rodada cujo primeiro comando de vaga falha publica 0 e registra `vaga_indisponivel`, e a seguinte publica; (i) recaída cai com nome.

Cobertos: (a) `apps/worker/test/esperar-o-redis.test.ts:27`; (b) :49; (c) :42; (d) :68; (e) `apps/despachante/test/pronto-do-redis.int.test.ts:79`; (g) :26; (h) `apps/despachante/test/janela.int.test.ts:131`; (i) `janela.int.test.ts:127` (agora com o resultado guardado e a asserção de log antes do número — bloqueante 2 da rodada 1 corrigido). O bloqueante 3 também está corrigido: `medir()` entrou em `fila-de-teste.ts:123-130` e no cenário de contrato. Confirmei que os laços chamam `this.rodada()`, `this.reconciliar()` e `this.medir()` (propriedade da instância), então `iniciar()` herda a espera de verdade, e que `montarDespachante` só é chamado pela bancada e pelo teste novo — não sobrou porta de entrada de Redis pós-montagem nos testes fora das três embrulhadas.

Bloqueantes:

1. **`apps/despachante/test/pronto-do-redis.int.test.ts:48-68` — o cenário (f) não falha se o mecanismo do conserto for removido.** Apague `redis.on('ready', terminar)` de `apps/despachante/src/montagem.ts:166`: com o Redis de pé não há evento `error`, então `pronto` resolve no teto de 5 s; o teste espera calado (o `testTimeout` da integração é 60 s, `vitest.config.ts:18`), passa, e a suíte inteira fica verde — só mais lenta em cada um dos ~40 pontos de montagem. Ou seja: a linha que faz o conserto funcionar no caminho normal não tem teste vermelho. Correção exigida: medir a espera também aqui e limitá-la, espelhando a linha 44 — `const comecou = Date.now(); await montado.pronto; expect(Date.now() - comecou).toBeLessThan(TETO_DA_ESPERA_DO_REDIS_MS / 2)`. Isso fica determinísticamente vermelho (5.0 s > 2.5 s) quando o `ready` sai.

2. **`apps/despachante/test/pronto-do-redis.int.test.ts:61-66` — a asserção central pode passar sem exercitar Redis nenhum.** O teste não enfileira nada. Se `job_registro` não tiver linha `aguardando` no momento, `rodada()` retorna em `listarEscolasComPendentes()` (`apps/despachante/src/despachante.ts:132-134`) sem emitir um único comando ao Redis, e `log.doEvento('despachante.vaga_indisponivel')` é `[]` trivialmente — asserção que sempre passa (regra 40, "o que é proibido"). O que ele exercita depende de sobra de outro arquivo (nenhum arquivo limpa o registro no `afterEach`) e de o despachante do compose estar ou não de pé: este é o único arquivo de teste do despachante sem `beforeAll(() => compose('stop', ...PROCESSOS_DA_FILA))` — comparar `janela.int.test.ts:29-32`, `vagas.int.test.ts:85`, `reconciliacao.int.test.ts:26`, `metricas-espera.int.test.ts:29`, `redis-fora.int.test.ts:42`. Correção exigida: parar os processos de fila do compose no `beforeAll`, limpar o registro, enfileirar o próprio job (via `BancadaDeFila`, que já dá `enfileirar` e limpeza de prefixo no `fechar`) e afirmar o resultado do despacho — `expect(await montado.despachante.rodada()).toBe(1)` e a linha em `publicado` — além do `vaga_indisponivel` vazio. Sem isso o cenário (f) não prova que a rodada alcançou o Redis, que é exatamente o 0 do defeito.

Recomendações (não bloqueiam):

- O guarda do ponto de ligação (`pronto-do-redis.int.test.ts:79-87`) cobre `rodada` e `reconciliar`, mas não `medir` — justamente a porta de `metricas-espera.int.test.ts:57`, apontada no documento como a próxima esteira vermelha. Montar com `medidor` e afirmar `montado.medicao.medir !== MedicaoDaFila.prototype.medir` fecha o trio. Não é bloqueante porque tirar `medir` do embrulho já deixa vermelho o cenário de `esperar-o-redis.test.ts:27`.
- O arquivo novo monta fora da `BancadaDeFila` e nunca limpa: deixa linhas de `job_registro` alteradas e chaves `teste-<uuid>:*` no Redis de fila (sem `obliterate`), diferente de `BancadaDeFila.fechar` (`apps/worker/test/fila-de-teste.ts:294-305`). Usar a bancada no cenário (f) resolve os dois de uma vez.
- `apps/worker/src/montagem.ts:97` cria o cliente de vagas do worker com o mesmo `criarClienteRedisDaFila` sem fila offline. Não achei teste que dependa de comando emitido no instante da montagem ali (o BullMQ só entrega job depois de conectar), mas é a mesma classe de corrida; vale uma linha no documento dizendo por que o worker não precisou de `pronto`.
- O documento continua dizendo, no item 3 e em `montagem.ts:76-79`, que o teto é guarda e não comportamento provado — está correto e coerente com o que os testes fazem; depois do bloqueante 1, vale ajustar o item 3 para registrar que o caminho `ready` também passou a ter vermelho próprio.

Arquivos auditados: `/Users/joaquim/Git/Educa.ia/apps/despachante/src/montagem.ts`, `/Users/joaquim/Git/Educa.ia/apps/despachante/test/pronto-do-redis.int.test.ts`, `/Users/joaquim/Git/Educa.ia/apps/despachante/test/janela.int.test.ts`, `/Users/joaquim/Git/Educa.ia/apps/worker/test/fila-de-teste.ts`, `/Users/joaquim/Git/Educa.ia/apps/worker/test/esperar-o-redis.test.ts`, `/Users/joaquim/Git/Educa.ia/tasks/correcoes/2026-09-16-rodada-antes-do-redis-do-despachante.md`.

## test-engineer · 4ª rodada · APROVADO · 2026-09-16 02:47:41 · `tasks/correcoes/2026-09-16-rodada-antes-do-redis-do-despachante.md`

VEREDITO: APROVADO

Auditei o diff desta rodada (`apps/despachante/src/montagem.ts`, `apps/despachante/test/pronto-do-redis.int.test.ts`, `apps/despachante/test/janela.int.test.ts`, `apps/worker/test/fila-de-teste.ts`, `apps/worker/test/esperar-o-redis.test.ts`) e o que ele afeta. As quatro mudanças fazem o que você disse, e nenhuma enfraqueceu o que a rodada 3 aprovou: só entraram asserções novas, e a única linha de produção é observabilidade dentro de um ramo que já era guarda.

Cenários exigidos: (a) embrulho segura `rodada`, `reconciliar` e `medir` até `pronto`; (b) a segunda chamada não paga espera; (c) o valor devolvido é o do despachante; (d) montagem sem medição; (e) a bancada aplica o embrulho nas três portas; (f) `pronto` pelo `ready`, sem pagar o teto, com a rodada alcançando o Redis de verdade; (g) `pronto` pelo `error`, com o ramo nomeado e não deduzido do relógio; (h) cadeia causal (vaga que falha → 0 e `vaga_indisponivel`, e a seguinte publica); (i) recaída cai com nome.

Cobertos: (a) `esperar-o-redis.test.ts:27`; (b) :49; (c) :42; (d) :68; (e) `pronto-do-redis.int.test.ts:87-99`, agora com `expect(montado.medicao).toBeDefined()` em :96 — sem ele, a montagem que parasse de criar a medição passava de graça pelo `?.` da :97; (f) :44-59; (g) :61-85; (h) `janela.int.test.ts:131`; (i) `janela.int.test.ts:123-127`. Rodei `esperar-o-redis.test.ts`: 4/4 verdes.

Conferências pontuais das mudanças novas:

- **Rec. 2 (ramo nomeado).** A asserção `despachante.redis_indisponivel` ≥ 1 é determinística e não passa por sorte: `criarClienteSemFilaOffline` registra `cliente.on('error', aoErrar)` na criação (`packages/nucleo/src/redis/clientes.ts:55`), antes do `redis.on('error', terminar)` de `montagem.ts:171`, e `avisoEspacado` emite na primeira chamada (`ultimoEm = -Infinity`). Logo, a linha de log já existe quando `await montado.pronto` retoma. O `off('error', terminar)` não deixa o cliente sem ouvinte de erro — o `aoErrar` continua lá.
- **Rec. 3 (log do teto).** `clearTimeout` no `terminar` garante que o evento não sai no caminho `ready` nem no `error`: não duplica `redis_indisponivel`, sai no máximo uma vez por processo, fora de caminho quente, e o timer é `unref`. Não achei teste que afirme conteúdo exato de log do despachante, então a linha nova não quebra asserção alheia.
- **Rec. 4.** `medidor.encerrar()` em `pronto-do-redis.int.test.ts:98`; a medição nunca foi iniciada nesse teste, e o montado sai pelo `bancada.fechar()` do `afterEach`.

Bloqueantes: nenhum.

Sua pergunta direta sobre o evento novo: **o lugar está certo e não vira ruído; o nome é jargão de código.** Ele só dispara quando o Redis nem fica `ready` nem erra em 5 s — com Redis fora de verdade o `error` chega antes e o timer é cancelado, então não há sobreposição com `despachante.redis_indisponivel`. É uma linha por subida de processo, em condição rara e acionável (Redis alcançável mas mudo, pacote sendo dropado). O que um operador não tem é como saber o que é "pronto": ele não existe na operação, existe na montagem. Como não é alerta novo, a regra 80 item 10 não exige parágrafo de runbook, e os irmãos (`fila_com_erro`, `escuta_indisponivel`) também não têm — por isso fica como recomendação, não bloqueante.

Recomendações:

1. `apps/despachante/src/montagem.ts:167` — nome legível ao operador em vez do interno (`despachante.redis_sem_resposta_na_montagem`, por exemplo), com `tetoMs` no corpo, e uma linha em `docs/runbook.md` perto da :63 separando "Redis de fila fora" (erra rápido, `vaga_indisponivel`) de "Redis não responde" (bate no teto).
2. O ramo do teto segue sem vermelho próprio, e vale registrar no documento **por que ele é difícil**, não só que é guarda: o truque óbvio (servidor TCP que aceita e nunca responde) provavelmente não chega lá — o `commandTimeout` de 2 s de `criarClienteRedisDaFila` faria o `info` da conexão estourar e o `error` resolveria `pronto` em ~2 s. Um vermelho de verdade exigiria costura (teto configurável + cliente de mentira). Isso reforça manter como está.
3. `pronto-do-redis.int.test.ts:61-85` e `:87-99` — `montado.encerrar()` e `medidor.encerrar()` só rodam no caminho feliz. Um `expect` que falhe vaza pool e cliente reconectando contra porta morta, e o barulho do vazamento cobre a mensagem da falha. `try/finally` ou registro no `afterEach` resolve.
4. `pronto-do-redis.int.test.ts:94` — `Object.getPrototypeOf(montado.reconciliacao).reconciliar` destoa das linhas 93 e 97, que usam a classe. `Reconciliacao.prototype.reconciliar` deixa as três simétricas.
5. Duas pendências de rastro, não de código: o texto da **3ª rodada não está em `/Users/joaquim/Git/Educa.ia/tasks/correcoes/achados-revisoes.md`** (o último registro é o da 2ª, 01:45), embora a tabela do documento a registre como APROVADO — as cinco recomendações daquela rodada ficam invisíveis ao `/validar` e ao `/retro`; e a **recomendação 5 (fábrica de apoio a teste na terceira afordância só-de-teste em `DespachanteMontado`) não aparece no documento** — procurei por "terceira", "afordância", "fábrica" e "DespachanteMontado" e só há a linha 108, que é a resposta a outra recomendação. Se a intenção é deixá-la como condição futura, ela precisa estar escrita em algum lugar.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-16 02:52:15 · `tasks/correcoes/2026-09-16-rodada-antes-do-redis-do-despachante.md`

VEREDITO: APROVADO
Caminho quente tocado: fila (despachante) — só a montagem; laço, vagas e prioridade intactos
Rate limit: não se aplica (o diff não toca login, HTTP nem limitador)
Fila e prioridade: ok (`FILAS_POR_PRIORIDADE`, vagas por escola e a janela do lote não urgente não foram tocadas)
Concorrência: protegida (nenhum "busca, verifica, grava" novo; reserva no banco e vaga no Lua seguem iguais)
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok — `despachante.pronto_pelo_teto` é `warn` de ramo de guarda, não alerta; a guarda `tools/guardas/alerta-tem-runbook.ts` só cobre `infra/grafana/alertas/`, e não há regra nova lá
Bloqueantes: nenhum

Respostas diretas:

1. **Produção não muda no que importa. Confirmo.** `pronto` não é aguardado em lugar nenhum de produção: `app.module.ts` chama `montado.iniciar()` no bootstrap e `montado.encerrar()` no shutdown, e `iniciar()` não passa pelo `pronto` (`/Users/joaquim/Git/Educa.ia/apps/despachante/src/montagem.ts:187-191`). O `grep` por `.pronto` fora de teste devolve só a declaração e a atribuição. O que efetivamente muda em produção é: dois ouvintes a mais no cliente (`ready` e `error`), removidos no primeiro evento; uma promise que nunca rejeita e nunca é aguardada (logo, sem `unhandledRejection`); e um `warn` a mais em condição rara. O ponto que eu checaria antes de aprovar — `redis.off('error', terminar)` deixar o cliente sem ouvinte de erro e derrubar o processo no `error` seguinte — não acontece: `criarClienteSemFilaOffline` já registra `cliente.on('error', aoErrar)` (`/Users/joaquim/Git/Educa.ia/packages/nucleo/src/redis/clientes.ts:53`), então sempre resta um. Rodada que sai antes da conexão continua terminando em `vaga_indisponivel` e a seguinte publica; com o Redis fora, a degradação é a mesma.

2. **Teto e `unref`: sem efeito no encerramento, no healthcheck ou no SIGTERM.** O healthcheck do compose lê o mtime de `/tmp/educa-batimento`, escrito pelo laço, e o laço não espera `pronto` — o batimento começa no mesmo instante de antes. O temporizador é `unref`, então não segura o processo, e é limpo no primeiro `ready`/`error`; com Redis alcançável ou recusando, isso é imediato. `encerrar()` não aguarda `pronto`, e `enableShutdownHooks(..., { useProcessExit: true })` encerra o processo de qualquer jeito. O único efeito residual possível é uma linha `pronto_pelo_teto` disparando depois do `encerrar()`, se o processo subir e receber SIGTERM dentro de 5 s com o Redis mudo — é um `warn`, não segura nada.

3. **Aceitável sem runbook.** A regra 80, item 10, exige parágrafo de runbook para *alerta* novo, e a guarda automática confere só `infra/grafana/alertas/`. Não há regra nova, e os irmãos (`despachante.fila_com_erro:93`, `despachante.escuta_indisponivel:124`) estão no mesmo patamar. Fica como recomendação o nome: "pronto" não existe no vocabulário da operação, existe na montagem.

4. **Não atrapalha a esteira no caminho verde; atrapalha no vermelho.** O montado contra a porta morta é criado direto por `montarDespachante`, fora da bancada, então **não** entra em `bancada.#montados` e o `afterEach` não o fecha — quem fecha é o `await montado.encerrar()` na última linha do teste. Se qualquer `expect` anterior lançar (`/Users/joaquim/Git/Educa.ia/apps/despachante/test/pronto-do-redis.int.test.ts:81-84`), o `encerrar()` não roda, e o `retryStrategy` de `criarClienteSemFilaOffline` nunca desiste (`Math.min(tentativa * 100, 2_000)`), ficando um cliente reconectando a cada 2 s e um pool do Postgres aberto até o fim do arquivo. Vale a correção defensiva abaixo; como só ocorre com o teste já vermelho, não bloqueia.

Recomendações:
- `/Users/joaquim/Git/Educa.ia/apps/despachante/test/pronto-do-redis.int.test.ts:66-86`: fechar o montado em `try/finally` (ou registrá-lo na bancada) para o caminho vermelho não deixar cliente reconectando e pool aberto.
- `/Users/joaquim/Git/Educa.ia/apps/despachante/test/pronto-do-redis.int.test.ts:37-43`: `portaSemNinguem()` devolve uma porta efêmera já liberada; no runner carregado, outro processo pode tomá-la entre o `close` e o `connect`. Probabilidade baixa e a asserção de `despachante.redis_indisponivel` nomeia o ramo, mas é a mesma família de intermitência que esta correção fecha.
- `/Users/joaquim/Git/Educa.ia/apps/worker/test/esperar-o-redis.test.ts:2`: o teste roda no projeto `unidade` e importa `fila-de-teste.ts`, que arrasta bullmq, ioredis, pg e lê os `.env` de teste no import. Extrair `esperarORedisNaPrimeiraVez` para um módulo próprio deixa a unidade sem esse grafo.
- `/Users/joaquim/Git/Educa.ia/apps/despachante/src/montagem.ts:167`: `despachante.pronto_pelo_teto` é jargão de código para quem lê o log às 7h40. Algo como `despachante.redis_mudo_na_montagem` diz o que houve.
- `/Users/joaquim/Git/Educa.ia/apps/despachante/src/montagem.ts:157-168`: `terminar` cita `temporizador` antes do `const`. É seguro (disparo assíncrono), mas inverter a ordem tira a dúvida de quem lê depois.
- `/Users/joaquim/Git/Educa.ia/apps/worker/test/fila-de-teste.ts:117-120`: a escrita em `montado.reconciliacao.reconciliar` pela visão alargada `MontadoQueEspera` (`() => Promise<unknown>`) é aceita pelo TS de forma não sã; o valor real é preservado em tempo de execução, mas um tipo genérico no embrulho evitaria a brecha.

## test-engineer · 5ª rodada · APROVADO · 2026-09-16 03:22:33 · `tasks/correcoes/2026-09-16-rodada-antes-do-redis-do-despachante.md`

Auditei o diff da rodada 5 e rodei os testes afetados. Resultado abaixo.

**Verificações que fiz**

- `apps/worker/test/esperar-o-redis.test.ts`: 4/4 verdes (projeto `unidade`, 1,01 s).
- `apps/despachante/test/pronto-do-redis.int.test.ts`: 3/3 verdes (2,09 s).
- `apps/despachante/test/janela.int.test.ts`: 14/14 verdes (2,45 s).
- Carimbo do portão presente em `/Users/joaquim/Git/Educa.ia/.processo/portao.json` com `typecheck`, `lint`, `test` e `infra`.
- Sem `.skip`, `.only`, teste comentado ou `any` nos cinco arquivos tocados. O único cast é `as unknown as Promise<void>` no thenable de contagem (`esperar-o-redis.test.ts:62`), que é o mecanismo da asserção, não um escape de tipo.
- `rodada`, `reconciliar` e `medir` são métodos de protótipo (não campos de instância), então as três asserções `not.toBe(Prototype.x)` em `pronto-do-redis.int.test.ts:109-113` são falsas antes do embrulho — o guarda do ponto de ligação continua valendo.
- `embrulharVagas` usado no teste novo da janela já existia desde `732f0e6` (tarefa 9.0); não é afordância só-de-teste nova em produção.
- Nenhuma referência pendente ao nome antigo `pronto_pelo_teto` fora do log de revisões.

**Sobre a sua pergunta direta — o `expect.poll` afrouxou?**

Não. A asserção que carrega o peso no caminho `ready` é a da linha 54 (`Date.now() - comecou < TETO_DA_ESPERA_DO_REDIS_MS / 2`), e ela está intacta e vem **antes** do poll. Tirando `redis.on('ready', terminar)`, com o Redis de pé não há evento `error`, o `pronto` só resolve no teto de 5 s, e a linha 54 fica vermelha — é exatamente o vermelho que você mediu. O poll não é o falsificador do `ready`; ele é o que impede a asserção de passar de graça (sem linha `aguardando`, a rodada volta na consulta ao Postgres sem emitir comando de Redis). E ele não passa de graça: `beforeAll` para os processos de fila do compose, `beforeEach` limpa o registro, e o despachante roda no prefixo da bancada — quem publica o job é a rodada do próprio teste. Se o Redis não fosse alcançado, o poll estouraria os 10 s em vermelho.

A troca de `=== 1` por "publica" perdeu só a exigência de que fosse a *primeira* rodada, que era justamente a asserção acoplada ao resíduo do `error` transitório. Foi troca de precisão inútil por robustez real, na direção certa.

**As quatro recomendações da minha rodada 4**: (1) nome do evento — feita, com `tetoMs`; (2) por que o ramo do teto é difícil — registrada no documento, linhas 112-116; (3) `try/finally` — feito em `pronto-do-redis.int.test.ts:86-99` e `:106-116`; (4) `Reconciliacao.prototype.reconciliar` — feito na linha 110. A (5) é rastro e continua aberta (abaixo). A condição da terceira afordância só-de-teste entrou no documento, linhas 100-102.

```
VEREDITO: APROVADO
Cenários exigidos: (a) o embrulho segura `rodada`, `reconciliar` e `medir` até o `pronto`, em paralelo; (b) a segunda chamada não paga espera; (c) o valor devolvido é o do despachante; (d) montagem sem medição; (e) a bancada aplica o embrulho nas três portas; (f) `pronto` pelo `ready`, sem pagar o teto, com a rodada alcançando o Redis de verdade; (g) `pronto` pelo `error`, com o ramo nomeado e não deduzido só do relógio; (h) cadeia causal (vaga que falha → 0 e `vaga_indisponivel`, e a seguinte publica); (i) recaída cai com nome.
Cobertos: (a) esperar-o-redis.test.ts:32 (Promise.all de verdade, três portas em paralelo); (b) :54; (c) :47; (d) :73; (e) pronto-do-redis.int.test.ts:102-117; (f) :45-69; (g) :71-100; (h) janela.int.test.ts:131-160; (i) janela.int.test.ts:122-127.
Bloqueantes: nenhum.
Recomendações:
1. `apps/despachante/test/pronto-do-redis.int.test.ts:54` — o caminho `ready` nomeia seu ramo só pelo relógio, e a margem é estreita: o `commandTimeout` de 2 s do cliente faz o ramo `error` resolver em ~2.000 ms contra um limite de 2.500 ms. Acrescentar `expect(log.doEvento('despachante.redis_sem_resposta_na_montagem')).toEqual([])` (o `log` da linha 50 hoje não é afirmado em nada) deixa a falsificação independente do relógio, simétrica com as linhas 93-94, e alinha o teste ao que o documento afirma na linha 96 ("os testes afirmam a ausência do evento no caminho normal") — hoje só o teste do Redis fora afirma isso.
2. `tasks/correcoes/achados-revisoes.md` — repetição da minha recomendação 5 da rodada 4, ainda aberta: o arquivo tem as rodadas 1, 2 e 4 do `test-engineer` e a 1 do `infra-guardian`, mas não tem o texto da 3ª rodada nem o do `revisor-geral`, que a tabela do documento registra como APROVADO. As recomendações dessas duas rodadas ficam invisíveis ao `/validar` e ao `/retro`.
3. `tasks/correcoes/2026-09-16-rodada-antes-do-redis-do-despachante.md:75` — diz "5.048 ms" e a sua última falsificação mediu 5.036 ms; alinhar com a medição atual.
```

Arquivos auditados: `/Users/joaquim/Git/Educa.ia/apps/despachante/src/montagem.ts`, `/Users/joaquim/Git/Educa.ia/apps/despachante/test/pronto-do-redis.int.test.ts`, `/Users/joaquim/Git/Educa.ia/apps/despachante/test/janela.int.test.ts`, `/Users/joaquim/Git/Educa.ia/apps/worker/test/fila-de-teste.ts`, `/Users/joaquim/Git/Educa.ia/apps/worker/test/esperar-o-redis.test.ts`, `/Users/joaquim/Git/Educa.ia/apps/despachante/src/despachante.ts`, `/Users/joaquim/Git/Educa.ia/apps/despachante/src/reconciliacao.ts`, `/Users/joaquim/Git/Educa.ia/apps/despachante/src/metricas-espera.ts`, `/Users/joaquim/Git/Educa.ia/tasks/correcoes/2026-09-16-rodada-antes-do-redis-do-despachante.md`, `/Users/joaquim/Git/Educa.ia/tasks/correcoes/achados-revisoes.md`.

## test-engineer · 6ª rodada · APROVADO · 2026-09-16 03:49:35 · `tasks/correcoes/2026-09-16-rodada-antes-do-redis-do-despachante.md`

Auditei só o diff desde a rodada 5 (mtimes confirmam: os únicos arquivos tocados depois de 03:22:33 — fim da rodada 5 — são `pronto-do-redis.int.test.ts` e o documento, ambos 03:22:59; `montagem.ts` 02:54, `fila-de-teste.ts` 01:46, `janela.int.test.ts` 00:33, `esperar-o-redis.test.ts` 02:53 ficaram intactos). Carimbo do portão em `/Users/joaquim/Git/Educa.ia/.processo/portao.json` é de 06:25 UTC, posterior à edição, com typecheck, lint, test e infra.

**A asserção nova está certa e no lugar certo.**

- Nome exato: `'despachante.redis_sem_resposta_na_montagem'` é literalmente o mesmo de `/Users/joaquim/Git/Educa.ia/apps/despachante/src/montagem.ts:167` (grep confirma as três ocorrências idênticas), e o mecanismo (`LogEmMemoria.doEvento` filtrando por `registro['evento']`) já é provado no vizinho da linha 97 do mesmo arquivo.
- Momento certo: o `logger.warn` acontece **dentro** do callback do `setTimeout`, síncrono e **antes** do `terminar()` (`montagem.ts:166-169`), e o destino do `LogEmMemoria` é `write` síncrono em array. Depois de `await montado.pronto`, se o ramo do teto tivesse resolvido, a linha já estaria no log. A asserção em `/Users/joaquim/Git/Educa.ia/apps/despachante/test/pronto-do-redis.int.test.ts:58` está depois do `await` e antes do `expect.poll` de 10 s, então a falha aparece rápido e não depende do poll.
- O `log` da linha 50, que a rodada 5 apontou como não afirmado em nada, agora é afirmado.
- Não introduz verde falso nem intermitência: é estritamente mais forte que o que já havia — no caminho feliz o evento nunca aparece, e quando aparecesse a asserção de tempo da linha 55 já estaria vermelha.
- Recomendação 3 aplicada: documento linha 75 diz 5.036 ms.

Nada mais mudou de comportamento. Uma diferença de numeração que vale registrar por honestidade: o arquivo é untracked, então não há diff byte a byte contra a rodada 5; a asserção de tempo saiu de `:54` para `:55` (o `log` continua em `:50`), ou seja, entrou também uma linha de formatação/branco entre `:51` e `:55`. Conteúdo sem alteração semântica.

```
VEREDITO: APROVADO
Cenários exigidos: (a) o embrulho segura `rodada`, `reconciliar` e `medir` até o `pronto`, em paralelo; (b) a segunda chamada não paga espera; (c) o valor devolvido é o do despachante; (d) montagem sem medição; (e) a bancada aplica o embrulho nas três portas; (f) `pronto` pelo `ready`, sem pagar o teto, com a rodada alcançando o Redis de verdade e sem o evento do teto no log; (g) `pronto` pelo `error`, com o ramo nomeado e não deduzido só do relógio; (h) cadeia causal (vaga que falha → 0 e `vaga_indisponivel`, e a seguinte publica); (i) recaída cai com nome.
Cobertos: (a) esperar-o-redis.test.ts:32; (b) :54; (c) :47; (d) :73 — inalterados desde a rodada 5. (e) pronto-do-redis.int.test.ts:106-121; (f) :45-73, agora com a ausência do evento do teto em :58; (g) :75-104; (h) janela.int.test.ts:131-160; (i) janela.int.test.ts:122-127.
Bloqueantes: nenhum.
Recomendações:
1. `/Users/joaquim/Git/Educa.ia/apps/despachante/test/pronto-do-redis.int.test.ts:55-58` — a asserção nova alinha o teste ao que o documento afirma na linha 96 e descarta o ramo do teto **pelo nome**, o que era o principal da minha recomendação 1; mas ela não elimina de todo a dependência do relógio no cenário estreito que motivou a recomendação: se alguém tirasse `redis.on('ready', terminar)` **e** um `error` transitório resolvesse o `pronto` em ~2.000 ms (o `commandTimeout` de 2 s num runner carregado), a linha 55 passaria (<2.500 ms) e a 58 também, porque não haveria evento de teto. Falsificação de fato independente do relógio exigiria afirmar positivamente o ramo `ready` (um evento/marca no `ready`, ou teto configurável com cliente de mentira) — o mesmo obstáculo já registrado nas linhas 112-116 do documento. Fica como recomendação porque, com o Redis de pé, o ramo `error` não é o caminho normal.
2. `/Users/joaquim/Git/Educa.ia/tasks/correcoes/2026-09-16-rodada-antes-do-redis-do-despachante.md:91` — cita `montagem.ts:79` para o teto; a constante está em `montagem.ts:78`. Nit que já existia antes desta rodada.
3. Minha recomendação 2 da rodada 5 (o `achados-revisoes.md` sem o texto da 3ª rodada do `test-engineer` e sem o do `revisor-geral`, ambos registrados como APROVADO na tabela) segue aberta e continua correto não editar o arquivo à mão — é do hook `tools/processo/revisoes.ts`. Confirmado que ela vai ao Joaquim no relatório final, para o `/validar` e o `/retro` não perderem essas duas rodadas.
```

## revisor-geral · 2ª rodada · APROVADO · 2026-09-16 03:52:33 · `tasks/correcoes/2026-09-16-rodada-antes-do-redis-do-despachante.md`

Auditei a árvore inteira dos arquivos alterados (não só o diff), o carimbo do portão e os seis pontos que você diz ter mudado.

**Confirmação de cada ponto**

1. Evento renomeado: `/Users/joaquim/Git/Educa.ia/apps/despachante/src/montagem.ts:167` grava `despachante.redis_sem_resposta_na_montagem` com `tetoMs`. Nome exato batendo com as duas asserções em `pronto-do-redis.int.test.ts:58` e `:98`, e nenhuma sobra do nome antigo no código.
2. Resíduo do `error` registrado no documento, linhas 104-110, com os dois mitigantes nomeados.
3. Teste do caminho `ready`: a asserção que carrega o peso continua sendo a do tempo (`:55`, `< TETO/2`), **antes** do `expect.poll`, e ganhou a ausência do evento do teto (`:58`). Não enfraqueceu: o que saiu foi a exigência de que fosse a *primeira* rodada, que era exatamente a asserção acoplada ao resíduo. A prova de que a bancada embrulha as três portas não morava nesse teste — mora em `pronto-do-redis.int.test.ts:113-117` e em `esperar-o-redis.test.ts`, que seguem intactos.
4. `try/finally` em `:90-103` (encerra o montado cru, que não passa pela bancada) e `:110-120` (medidor). O montado do teste `ready` vem da bancada e é fechado no `afterEach`, então não falta um terceiro.
5. `Reconciliacao.prototype.reconciliar` em `:114`, simétrico com `Despachante.prototype.rodada` e `MedicaoDaFila.prototype.medir`. Os três são métodos de protótipo, então as asserções são falsas antes do embrulho.
6. Operador vírgula desfeito; o que restou em `esperar-o-redis.test.ts:34` é atribuição em arrow, não vírgula.

**O que verifiquei por fora do que você listou**, para a aprovação valer para a árvore atual: `criarClienteRedisDaFila` não usa `lazyConnect` (senão todo montado pagaria o teto de 5 s), o ouvinte de `error` do cliente permanece depois de `terminar()` remover o dele (sem `unhandled error`), o `setTimeout` é `unref`, o único `montarDespachante` fora da bancada é o teste do Redis fora (que não chama `rodada`), o embrulho de `medir` alcança de fato `metricas-espera.int.test.ts:57`, e o tipo devolvido por `reconciliar()` continua o concreto no ponto de chamada (`reexecucao.int.test.ts` usa `resultado.conferidos`). Nada de `any`, `.skip`, `.only` ou `TODO` nos cinco arquivos.

Escopo: tudo é teste, mais uma adição estritamente aditiva na montagem. Nenhuma mudança de comportamento do despachante em produção — `despacharDaEscola` continua devolvendo `vaga_indisponivel` e encerrando a rodada.

```
VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test, infra, para o código atual)
Bloqueantes: nenhum
Recomendações:
1. `/Users/joaquim/Git/Educa.ia/apps/worker/test/fila-de-teste.ts:102-109` — o resíduo do `error` transitório poderia ser fechado na bancada, e não no documento: em vez de zerar `espera` sempre, zerar só quando o cliente ficou de fato de pé, esperando de novo enquanto não estiver. Fica como recomendação porque exigiria expor o cliente (ou o estado dele) em `DespachanteMontado`, e seria a terceira afordância só-de-teste — exatamente o que a condição das linhas 100-102 do documento manda evitar. Se o resíduo voltar a produzir esteira vermelha, a saída é a fábrica de apoio a teste, não uma quarta afordância.
2. `/Users/joaquim/Git/Educa.ia/tasks/correcoes/2026-09-16-rodada-antes-do-redis-do-despachante.md:48` — `reexecucao.int.test.ts` está em `apps/worker/test/`, não em `apps/despachante/test/` como os dois vizinhos citados na mesma linha sugerem. Qualificar o caminho.
3. O defeito do hook (`achados-revisoes.md` sem o texto da 3ª rodada do `test-engineer` nem o da minha 1ª) está corretamente fora desta correção e não se edita à mão. Vale entrar como item do `/retro`, não como nota de relatório que se perde: são rodadas APROVADAS na tabela cujo texto o `/validar` não enxerga.
```

## test-engineer · 1ª rodada · REPROVADO · 2026-09-18 00:04:58 · `tasks/correcoes/2026-09-18-historico-do-teste-passa-do-prazo-com-a-fk.md`

**VEREDITO: REPROVADO**

**Cenários exigidos:**
1. A preparação de volume (5.000 lotes pendentes e 100 mil de histórico, com a FK de `escola_id`) cabe no prazo mesmo num runner lento.
2. O que o teste mede continua com os 2 s: a medição pelo repository, o `EXPLAIN (ANALYZE)` e a contagem que para no teto.
3. O prazo maior não vaza para outras consultas do pool.
4. O helper não passa a servir para esconder lentidão real em outros testes.

**Cobertos:**
- **Cenário 2:** coberto. O teste não prova nada por tempo. Ele prova pelo plano (nenhum `Seq Scan` em `job_registro`, uso de `job_registro_pendentes_urgentes_idx`) e pela contagem: 5.000, e depois o teto. A medição roda num `criarPool(configuracaoDoBanco())` próprio, com 2 s. O `EXPLAIN` e o `medirPendentes()` do fim continuam em `bancada.pool`, também com 2 s. Tirar o prazo da preparação não afrouxa nenhuma asserção, e as asserções continuariam falhando se o índice ou o teto fossem removidos.
- **Cenário 3:** coberto. O `set local` fica preso à transação e não volta ao pool com a conexão.
- **Cenário 4:** hoje o helper só é usado nas duas inserções de preparação, e o nome e o comentário deixam claro que ele é para preparação. Não achei nenhum uso que mascare o que um teste mede.
- **Cenário 1:** não coberto, ver o bloqueante.

**Bloqueantes:**

1. **`apps/worker/test/fila-de-teste.ts:306-310`: `semear` não dá 60 s. O limite real dele é de uns 4 s.**
   - **Causa:** `criarPool` (`packages/nucleo/src/db/pool.ts:133`) configura também o prazo do lado do cliente, `query_timeout = timeoutConsultaMs + timeoutConexaoMs`. Na bancada (`fila-de-teste.ts:43`) isso dá 2.000 + 2.000 = 4.000 ms. O `pg` aplica esse prazo a todo cliente que sai do pool, inclusive o que vem de `pool.connect()` (`node_modules/pg/lib/client.js:702`). O `set local statement_timeout = '60s'` só muda o prazo do servidor, e o do cliente continua cortando.
   - **Como conferi:** montei um teste temporário que chamava `bancada.semear('select pg_sleep(5)')`. Ele voltou com `Error: Query read timeout`. Já apaguei o arquivo e o `git status` está igual ao de antes.
   - **Por que a reprodução do documento não mostrou isso:** com o prazo do pool em 400 ms, o do cliente ficou em 400 + 2.000 = 2.400 ms, e 535 ms cabem nele. O verde não prova os 60 s.
   - **O que isso significa:** a correção só dobra a folga, de 2 s para uns 4 s, e não chega aos 60 s descritos no comentário e no documento. Se o runner da esteira for 8 vezes mais lento que esta máquina, o vermelho volta, agora como `Query read timeout`.
   - **Correção exigida:**
     - Passar o prazo do cliente por consulta: `cliente.query({ text: texto, values: valores, query_timeout: 60_000 })`. No `pg`, o `query_timeout` da consulta vence o da conexão.
     - Refazer o vermelho/verde de modo que a preparação passe dos 4 s. Por exemplo, um caso da bancada que chama `semear` com `pg_sleep(5)` e afirma que ele termina, e que a mesma instrução por `bancada.pool.query` é cortada. Assim fica provado que o helper faz o que diz.
     - Registrar a nova medição no documento da correção.

**Recomendações:**
- `fila-de-teste.ts:311-313`: se a conexão caiu, o `rollback` no `catch` também lança erro e esconde o erro original, e o `release()` devolve ao pool uma conexão quebrada. Vale usar `rollback().catch(() => {})` e `release(erroFatal)` para descartar a conexão.
- `metricas-espera.int.test.ts:183`: a inserção de `TETO_DA_CONTAGEM_DE_PENDENTES` linhas (10 mil, com a FK) também é preparação e ainda passa pelo pool de 2 s. É 10 vezes menor que a do histórico, mas é o mesmo tipo de risco. Deixar em `semear` por coerência.
- O `limparRegistro` do próximo `beforeEach` apaga umas 115 mil linhas com o prazo de 2 s. Não confere FK, porque apaga do lado que referencia, mas vale acompanhar na esteira.
- No comentário do helper, dizer que ele serve só para dado de preparação e nunca para a instrução que o teste mede. Isso deixa explícito o limite que impede mascarar lentidão real.

Arquivos: `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/fila-de-teste.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/metricas-espera.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/pool.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-18-historico-do-teste-passa-do-prazo-com-a-fk.md`

## test-engineer · 1ª rodada · APROVADO · 2026-09-18 00:06:53 · `tasks/correcoes/2026-09-18-historico-do-teste-passa-do-prazo-com-a-fk.md`

VEREDITO: APROVADO

A correção exigida na rodada 1 foi feita. `semear` agora sobe o prazo nos dois lados, e um teste prova isso. Rodei os dois arquivos juntos: 2 arquivos e 5 testes verdes, em 9,7 s.

Cenários exigidos:
- **Caminho feliz:** a preparação de volume (100 mil linhas de histórico, 5.000 lotes, 10 mil acima do teto) termina mesmo com a FK de `escola_id`, sem ser cortada pelo prazo de 2 s do pool.
- **Borda 1:** a preparação passa dos 4 s do prazo do cliente (2 s de consulta mais 2 s de conexão), e não só dos 2 s do servidor. Foi esta a falha da rodada 1.
- **Borda 2:** o pool normal, por onde passa a instrução que o teste mede, continua cortando em 2 s com 57014. Assim a lentidão que o teste deve pegar não passa em silêncio.
- **Borda 3:** se a conexão cai no meio da preparação, o erro que sobe é o da preparação, e a conexão quebrada sai do pool.
- **Permissão e isolamento:** não se aplicam. A correção é só no apoio de teste; o isolamento por escola que o teste de medição prova não mudou.
- **Concorrência:** não se aplica. A correção não cria operação que rode duas vezes ao mesmo tempo.

Cobertos:
- **Caminho feliz:** as três inserções de `apps/despachante/test/metricas-espera.int.test.ts` (linhas 128, 137 e 169) passaram a usar `semear`. O arquivo passa 4 de 4.
- **Bordas 1 e 2:** um único teste em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/bancada.int.test.ts:16-20` cobre as duas.
  - `pg_sleep(2.5)` pelo pool normal falha com 57014.
  - `pg_sleep(4.5)` por `semear` termina.
  - O teste falha se a regra for removida, dos dois jeitos. Sem o `query_timeout`, falha com `Query read timeout`, que é a evidência registrada no documento. Sem o `set local statement_timeout`, falha porque o servidor corta aos 2 s.
  - Se alguém subir o prazo do pool normal, falha na primeira asserção.
  - O `pg_sleep(4.5)` passa dos dois prazos do pool, então prova a regra de fato e não passa por folga.
- **O que o teste de medição prova não mudou:** a medição, o `EXPLAIN` e os repositories continuam pelo pool normal, com o prazo de 2 s.

Bloqueantes: nenhum.

Recomendações:
1. **Queda de conexão sem teste:** o caminho de `semear` em que a conexão cai (`fila-de-teste.ts:319-325`) não tem teste. É código de apoio de teste, então fica como cobertura extra, sem bloquear.
2. **Rollback depois do corte do cliente:** `fila-de-teste.ts:317` usa os mesmos 60 s para o `query_timeout` do cliente e para o `statement_timeout` do servidor. Quando o cliente corta primeiro, o `pg` não cancela a consulta no servidor. O `rollback` fica na fila da mesma conexão até o servidor terminar ou cortar, e o erro demora a aparecer. Um `query_timeout` um pouco maior que o `statement_timeout` faria o servidor cortar primeiro, com o 57014, que é mais legível.
3. **`analyze` pelo pool normal:** `apps/despachante/test/metricas-espera.int.test.ts:142` roda `analyze job_registro` pelo pool normal, sobre cerca de 115 mil linhas. É preparação e hoje é rápido, porque o `analyze` só lê uma amostra. Mas no runner lento é a próxima instrução que pode bater nos 2 s; vale considerar passá-la por `semear` também.
4. **Registrar para o `/retro`:** a reprodução com 400 ms não pegava o prazo do cliente. A lição é que o teste que prova um helper de prazo precisa passar do prazo efetivo mais alto da conexão, e não só do prazo do servidor.

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 00:07:49 · `tasks/correcoes/2026-09-18-historico-do-teste-passa-do-prazo-com-a-fk.md`

VEREDITO: APROVADO

Fiz as duas recomendações que você aplicou, e as duas estão certas. Rodei os dois arquivos: 2 arquivos e 5 testes verdes, em 10,9 s.

**O que conferi nesta rodada**
- **Recomendação 2, feita** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/fila-de-teste.ts:319`): o prazo do cliente agora é `PRAZO_DA_PREPARACAO_MS + 5_000`, e o do servidor fica em `PRAZO_DA_PREPARACAO_MS`. Quem corta primeiro é o Postgres, com o código 57014. O teste do helper continua valendo: se o `query_timeout` sair, `pg_sleep(4.5)` bate nos 4 s que o cliente herda do pool; se o `set local` sair, o servidor corta aos 2 s.
- **Recomendação 3, feita** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/metricas-espera.int.test.ts:142`): o `analyze job_registro` agora passa por `semear`. O `ANALYZE` roda dentro de transação, ao contrário do `VACUUM`, e o teste passou 4 de 4. As estatísticas ficam gravadas no commit, antes do `EXPLAIN`, então o plano que o teste confere continua sendo o de estatística atualizada.
- **O que o teste mede não mudou:** o `EXPLAIN`, a medição pelo repository e a contagem acima do teto continuam pelo pool normal, com o prazo de 2 s. A mudança não enfraquece nenhuma asserção.
- **O documento da correção** (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-18-historico-do-teste-passa-do-prazo-com-a-fk.md`) registra os dois ajustes.

**Cenários exigidos** (os mesmos da rodada 2)
- **Caminho feliz:** a preparação de volume cabe no prazo mesmo com a FK de `escola_id`.
- **Borda:** a preparação passa dos 4 s do cliente, e não só dos 2 s do servidor.
- **Borda:** o pool normal continua cortando em 2 s.
- **Borda:** se a conexão cai no meio da preparação, o erro que sobe é o da preparação, e a conexão quebrada sai do pool.
- **Permissão, isolamento e concorrência:** não se aplicam, porque a correção só mexe no código de apoio dos testes.

**Cobertos:** o caminho feliz e as duas primeiras bordas, pelos testes de `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/bancada.int.test.ts` e `/home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/metricas-espera.int.test.ts`. A borda da queda de conexão está implementada, mas não tem teste, como aceito na rodada 2.

**Bloqueantes:** nenhum.

**Recomendações:**
1. O teste da queda de conexão no `semear` continua de fora. É cobertura extra de código de apoio, como você decidiu, e fica registrada para o `/validar`.
2. A lição da reprodução com 400 ms fica para o `/retro` do F1: o teste que prova um helper de prazo precisa passar do maior prazo que vale na conexão, e não só do prazo do servidor.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-18 00:08:58 · `tasks/correcoes/2026-09-18-historico-do-teste-passa-do-prazo-com-a-fk.md`

VEREDITO: APROVADO

Caminho quente tocado: fila (só a bancada de teste e o teste de medição da fila; nenhum código de produção muda)
Rate limit: não se aplica
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok (o teste ainda prova, pelo `EXPLAIN`, que a medição não varre `job_registro` e usa `job_registro_pendentes_urgentes_idx`)
Degradação de IA: não se aplica
Migration: não se aplica (a 0006 já está no `main` e é `NOT VALID`, sem varredura nem trava longa)
Métrica e alerta: ok
Bloqueantes: nenhum

Rodei `npx vitest run --project integracao` nos dois arquivos: 2 arquivos e 5 testes passaram, em 9,95 s.

**Ponto 1: a FK não é problema de produção.** O documento está certo.
- `packages/nucleo/src/fila/enfileirador.ts:27` passa por `JobRegistroRepository.inserir` (`packages/nucleo/src/fila/job-registro.repository.ts:71`). Esse caminho grava uma linha por chamada, na transação de quem pede, com um `pg_notify` junto.
- Hoje só dois lugares enfileiram: `apps/api/src/sistema/jobs-sinteticos.service.ts:31` e `apps/worker/src/agendamentos.ts:84`. Os dois gravam um job por vez.
- Ingestão e correção ainda não existem no código. Pelo desenho (`docs/ingestao.md:41`), o pior caso é da ordem de 300 jobs por pedido (300 PDFs), o que dá menos de 1 ms de conferência de FK.
- O `addBulk` de `apps/despachante/src/fila-de-publicacao.ts` publica no Redis e não insere em `job_registro`.
- A conferência pega `FOR KEY SHARE` na linha da `escola`. Essa trava não conflita com outros inserts nem com `UPDATE` de coluna que não é chave. Sessenta turmas enfileirando juntas não se bloqueiam.
- O expurgo apaga de `job_registro`, a tabela que aponta para `escola`, então não dispara conferência.

**Ponto 2: o helper não mascara lentidão do que o teste mede.**
- `semear` é usado só nas quatro preparações de `apps/despachante/test/metricas-espera.int.test.ts` (linhas 128, 137, 142 e 169).
- O que o teste mede continua com 2 s: `medirPendentes` pelo pool criado com `configuracaoDoBanco()`, o `EXPLAIN ANALYZE` por `bancada.pool` e a contagem no teto por `bancada.despacho`.
- `semear` devolve `Promise<void>`, então não serve para ler resultado de medição. Isso dificulta usá-lo por engano no lugar da instrução medida.
- `apps/worker/test/bancada.int.test.ts` prova os dois lados: o pool normal corta `pg_sleep(2.5)` com o erro 57014 (prazo do servidor esgotado), e `semear` passa dos 4 s.

Recomendações:
- Outras preparações de volume ainda passam pelo pool de 2 s e poderiam usar `semear`: `apps/worker/test/expurgo.int.test.ts:72` e `:136` (12 mil linhas), `apps/despachante/test/janela.int.test.ts:251` (5 mil) e `apps/despachante/test/vagas.int.test.ts:116`. Pela medição do documento, 12 mil linhas com FK levam uns 65 ms locais, então hoje estão longe do prazo. Vale trocar se a esteira voltar a oscilar. Deixar para o `/retro`.
- O `VALIDATE CONSTRAINT` da FK de `job_registro` continua pendente, fora do horário letivo, conforme a 0006 e o TODO.md. Não é desta correção.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-18-historico-do-teste-passa-do-prazo-com-a-fk.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/fila-de-teste.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/bancada.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/metricas-espera.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/fila/job-registro.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0006_fk_escola_nas_tabelas_do_f0.sql

## test-engineer · 3ª rodada · APROVADO · 2026-09-18 00:10:41 · `tasks/correcoes/2026-09-18-historico-do-teste-passa-do-prazo-com-a-fk.md`

VEREDITO: APROVADO

Cenários exigidos (os mesmos da rodada 3):
- Preparar dado em volume (100 mil linhas em `job_registro`, com a FK de `escola_id`) com prazo de 60 s no servidor e no cliente.
- A instrução que o teste mede continua com os 2 s do pool.
- Um erro na preparação faz rollback, e a conexão perdida sai do pool.

Cobertos:
- No `git diff` de `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/fila-de-teste.ts`, a única diferença de conteúdo desde a rodada 3 é a interface local `ConsultaComPrazoDoCliente` (`text`, `values`, `query_timeout`, em `fila-de-teste.ts:43-47`) e a variável `consulta` que a usa (`fila-de-teste.ts:326`).
- Os valores passados são os mesmos de antes: `texto`, `valores` e `PRAZO_DA_PREPARACAO_MS + 5_000`.
- O objeto chega igual a `cliente.query`, então o comportamento em execução é idêntico.
- Continua valendo o que aprovei: `set local statement_timeout` de 60 s, o cliente esperando 5 s a mais para que quem corte seja o Postgres com o erro 57014, rollback que registra a conexão perdida e `release(conexaoPerdida)`.
- A lista de arquivos alterados é a mesma da rodada 3. Nenhum arquivo novo apareceu fora da tarefa.
- Não rodei testes, como você pediu. Considero o seu resultado: `bancada.int.test.ts` com 1 passed, e typecheck e lint limpos.

Bloqueantes: nenhum.

Recomendações:
- O tipo local repete o formato do `pg` à mão. Se um dia o `@types/pg` passar a declarar `query_timeout`, vale trocar pelo tipo dele e apagar a interface local. O comentário na linha 42 já explica por que ela existe, então isso não bloqueia.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-18 00:10:58 · `tasks/correcoes/2026-09-18-historico-do-teste-passa-do-prazo-com-a-fk.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum (só código de teste, na bancada da fila)
Rate limit: não se aplica
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum.

Conferi o `git diff`. A única mudança desde a minha aprovação é a interface local `ConsultaComPrazoDoCliente` e a variável `consulta` que a usa (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/fila-de-teste.ts:43-47` e `:326`). Os valores continuam `texto`, `valores` e `PRAZO_DA_PREPARACAO_MS + 5_000`, e o objeto chega igual a `cliente.query`. Por isso o comportamento não mudou:
- a transação continua com `set local statement_timeout` de 60 s;
- o cliente ainda espera 5 s a mais que o servidor;
- o rollback continua registrando a conexão perdida, e o `release(conexaoPerdida)` a tira do pool.

Os outros arquivos alterados (`/home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/metricas-espera.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/bancada.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados-revisoes.md`) são os mesmos da rodada aprovada. A instrução que o teste mede continua no pool normal, com prazo de 2 s. Não rodei testes, como você pediu.

Recomendações:
- Se o `@types/pg` passar a declarar `query_timeout`, troque o tipo local pelo tipo do pacote e apague a interface.
- Continua valendo a recomendação da rodada anterior, para o `/retro`: passar para `semear` as outras preparações de volume, se a esteira voltar a oscilar. São elas `expurgo.int.test.ts:72` e `:136`, `janela.int.test.ts:251` e `vagas.int.test.ts:116`.
