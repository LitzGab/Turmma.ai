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

## test-engineer · 1ª rodada · APROVADO · 2026-09-18 01:53:19 · `tasks/correcoes/2026-09-18-guarda-de-cpu-do-e2e-reprova-a-maquina.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** a fixture aplica a limitação de CPU do perfil e o teste passa, tanto na máquina livre quanto na máquina disputada.
- **Borda 1:** com o runner disputado, a aba recebe menos CPU que o teto de 1/4. A razão cai, e o teste não pode reprovar uma configuração que está certa. Esse é o sintoma dos 1,32 e 1,35 na esteira.
- **Borda 2:** a disputa varia ao longo da execução e pode pegar um bloco de medição inteiro. Uma separação baixa demais precisa dar vermelho com o motivo escrito, e não uma decisão tomada no ruído.
- **Mutação (é o que a guarda existe para pegar):** a fixture sem `setCPUThrottlingRate` reprova, com a máquina livre e com a máquina disputada.
- **Retry:** a nova tentativa não pode dar a uma fixture quebrada várias chances de passar por ruído.
- Permissão e isolamento de escola não se aplicam: é guarda de infraestrutura do e2e e não toca dado de escola.

**Cobertos (conferi com execução própria):**
- **Teste real, máquina livre:** passou 10/10 com `--repeat-each 5` nos dois projetos.
- **Teste real com `taskset -c 0-3`:** passou 16/16. Os processos concorrentes já tinham expirado nessa rodada, então este número não prova nada sobre disputa. A evidência de passar com CPU disputada continua sendo só a do documento (4/4).
- **Mutação, máquina livre:** montei uma cópia fora do repositório em `/tmp/mutacao-cpu/`, com a fixture sem a linha da limitação e `retries: 0`. Reprovou 30/30. A razão perfil/livre ficou entre 0,99 e 1,02, e o limite exigido ficou em cerca de 2,0.
- **Mutação, máquina disputada:** browser preso aos núcleos 0-3, com dois processos concorrentes por núcleo. Reprovou 16/16. A separação caiu até 2,34, o limite até 1,53, e a razão perfil/livre ficou em no máximo 1,024.
- **Margem contra falso verde:** o limite nunca fica abaixo de √1,5 ≈ 1,22 × livre, por causa da exigência de separação ≥ 1,5. Em 46 tentativas com a fixture quebrada, o maior desvio observado foi 2,4%. Para passar por ruído, o bloco inteiro de cinco medições do perfil precisaria sair pelo menos 22% mais lento que o bloco livre.
- **Leitura dos erros de CDP:** se a sessão do teste não conseguir sobrescrever a da fixture, a separação fica perto de 1 e o teste dá vermelho, não verde.
- **Diff e regra 40:** não há `.skip`, teste comentado nem mock. A verificação da rede não mudou.

**As três perguntas:**
1. **A guarda ainda pega a fixture sem a limitação?** Sim, com margem larga, com a máquina livre e com ela disputada.
2. **O `retries: 2` é aceitável?** Sim. Não desabilita o teste, e uma regressão da fixture é determinística: reprova em todas as tentativas, como a mutação mostrou. Mas o comentário em `e2e/guardas.spec.ts:50-51` diz mais do que o código faz (ver recomendação 1).
3. **Há falso verde possível?** Em teoria sim: um pico de ocupação que pegue o bloco inteiro do perfil e poupe o bloco livre. Na prática a margem medida torna isso improvável, e o retry multiplica uma chance que já é pequena. Não bloqueia.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **`e2e/guardas.spec.ts:50-52` e o documento dizem que a nova tentativa existe "só por um motivo".** O Playwright repete qualquer falha, inclusive a da linha 98, que é a asserção da fixture. Além disso, um teste que passa na segunda tentativa sai como "flaky" com código de saída 0: o repositório não usa `--fail-on-flaky-tests`, e `tools/ci/playwright.test.ts` não confere `retries`. Duas formas de resolver:
   - corrigir o comentário para dizer que toda falha é repetida e que o resultado flaky não fica vermelho;
   - ou tirar a nova tentativa do Playwright e repetir só as referências dentro do teste, por exemplo numa segunda aba (`context.newPage()`) com sessão CDP própria. Assim a aba da fixture não é sobrescrita e pode ser medida de novo. Antes, confirmar que as duas abas não dividem o mesmo renderer, senão a limitação de uma vaza para a outra.
2. **Anotar a tentativa quando houver uma** (`testInfo.retry > 0` em `testInfo.annotations`), para o `/retro` enxergar quantas vezes a esteira precisou de nova tentativa.
3. **Ordem fixa das medições (linha 88).** O perfil é medido logo depois do `goto` e do `fetch`, com a página ainda carregando. Hoje isso favorece o falso verde só em teoria, porque a medição da mutação não mostrou viés. Se um dia aparecer, medir o perfil de novo depois de uma pausa curta resolve.
4. **A guarda não confere o valor exato da taxa.** Uma fixture com taxa 2 no lugar de 4 ficaria bem no limite, porque o limite é √4 = 2 × livre. O teste antigo tinha a mesma folga, então não é regressão. Se quiser fechar isso, dá para exigir que o perfil fique perto da referência limitada, e não só acima da média geométrica.

A cópia mutante para reproduzir está em `/tmp/mutacao-cpu/` (config, fixture sem a limitação e spec com `console.log` das razões). Não editei nada no repositório.

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 01:54:17 · `tasks/correcoes/2026-09-18-guarda-de-cpu-do-e2e-reprova-a-maquina.md`

VEREDITO: APROVADO

**Cenários exigidos:** nesta rodada, só as duas recomendações da rodada 1 que você aplicou, e se elas mudaram o que o teste prova. O resto não mudou e não reauditei:
- o estado da fixture tem de parecer com a aba limitada e não com a livre (média geométrica das duas);
- com a máquina ocupada demais (separação abaixo de 1,5), o teste tenta de novo;
- a fixture sem limitação reprova em toda tentativa;
- a verificação de rede ficou igual.

**Cobertos:**
- **Recomendação 1.** O comentário do `describe` em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/guardas.spec.ts:51-54` agora diz que o Playwright repete qualquer falha, que a falha que passa na nova tentativa sai como "flaky" sem ficar vermelha, e que o que segura é o defeito ser determinístico. O documento `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-18-guarda-de-cpu-do-e2e-reprova-a-maquina.md:68-73` registra as medições (3/3 da tarefa, e 30/30 e 16/16 do revisor).
- **Recomendação 2.** Em `e2e/guardas.spec.ts:59`, com `testInfo.retry > 0`, o teste anota `nova-tentativa`. A anotação é só metadado e não muda nenhuma asserção.
- **As outras duas.** Aceito deixar a 3 (reordenar a medição do perfil) e a 4 (conferir a taxa exata) de fora, pelo motivo que você deu. Nenhuma delas era bloqueante.
- **Nova tentativa só neste teste.** `retries: 2` continua preso ao `describe` próprio, e `playwright.config.ts:16` segue com `retries: 0` para o resto do e2e.
- **Rodei o spec:** 8 passed em 4,4 s, sem nenhum flaky.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Os reporters configurados em `playwright.config.ts:17` (`list`, e `github` no CI) não parecem imprimir anotações; não confirmei isso nesta versão do Playwright. Se não imprimirem, a `nova-tentativa` só fica visível num relatório JSON ou HTML, que a esteira não gera. O que a `/retro` vê hoje é a contagem de "flaky" no resumo do `list`. Há duas saídas: acrescentar um reporter `json` no CI, ou dizer no documento (linha 72) que a contagem vem do resumo "flaky" da esteira.
2. Texto: o comentário do spec cita só o "três de três" da correção, e o documento cita também o 30/30 e o 16/16 do revisor. Não chega a ser inconsistência, mas o comentário pode apontar para o documento em vez de repetir parte do número.

## test-engineer · 1ª rodada · APROVADO · 2026-09-18 08:17:27 · `tasks/correcoes/2026-09-18-contador-testado-com-o-prazo-de-producao.md`

VEREDITO: APROVADO

A correção se sustenta. A regra continua provada, e rodei os dois arquivos com `npx vitest run --project integracao ...`: 6 de 6 verdes. Não encontrei bloqueante. Uma frase do comentário e do documento promete mais do que os testes cobrem, e outros testes de integração têm a mesma fragilidade. As duas coisas estão nas recomendações.

**Cenários exigidos:**
- (a) O script Lua do contador continua provado: a quinta falha segura 30 s, a espera dobra, para em 15 min, o acerto zera só aquela origem, e dez tentativas em paralelo liberam exatamente cinco.
- (b) O desafio só pode ser usado uma vez, também com duas conclusões em paralelo.
- (c) A contagem passa pelo Redis e não pelo seguro em memória.
- (d) Com o Redis fora, o login cai no seguro e o desafio é recusado.
- (e) Com o Redis travado (conectado, mas sem responder), o comando corta no prazo e o seguro atende.

**Cobertos:**
1. **A prova continua de pé.** Os valores exatos de espera, o teto de 15 min, o zerar por origem e a concorrência de 5 em 10 continuam em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.int.test.ts`. Um script errado quebra esses testes. A asserção `proporcaoDoSeguro === 0` (linha 49) ainda prova que a contagem passou pelo Redis, e é justamente ela que separa o Redis do seguro, porque o seguro devolve os mesmos números. `keys` e `pttl` também só respondem pelo Redis. Com o prazo de 2 s a asserção não fica mais fraca: se uma resposta ainda cair no seguro, o teste fica vermelho em vez de passar calado. No desafio, tirar o `NX` ou a marca faz o teste de concorrência cumprir as duas conclusões e falhar. O teste roda duas chamadas em paralelo de verdade (`Promise.allSettled`).
2. **A queda com o Redis fora continua provada.** O contador está coberto em `apps/api/test/login-email.int.test.ts:372`, que para o `redis-fila` e confere o seguro, `seguro_ativo = 1` e a conta segurada. O desafio está coberto em `apps/api/src/sessao/desafio.int.test.ts:50`, que segue com `criarClienteRedisDaApi` na porta 9. O corte de 100 ms com o Redis travado está provado para o cliente em `apps/api/test/limite.int.test.ts:501` e para o limitador em `:539`.
3. Nada de produção mudou. Não há `.skip`, e nenhum mock esconde a regra.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **O comentário e o documento prometem o caso travado, e ninguém o prova para o contador nem para o desafio.** O comentário (`contador-de-tentativas.int.test.ts:30`, `desafio.int.test.ts:26`) e a seção "Correção" do documento dizem que a queda com o Redis "fora ou travado" está provada. Não está.
   - Os dois testes citados provam só o Redis fora. Com o Redis parado, o status não fica `ready`, e o caminho usado é o do `if`.
   - O ramo `catch` de `ContadorDeTentativas.reservar` (`apps/api/src/sessao/contador-de-tentativas.ts:149-151`) não tem teste. É o ramo em que o status está `ready` mas o comando estoura o prazo, e é nele que a tentativa pode ser contada duas vezes, para o lado de segurar.
   - O mesmo falta para o `catch` de `ConsumoDeDesafio.consumir` com o Redis travado.
   - A lacuna já existia antes desta correção; a correção só a deixou escrita como coberta.
   - Duas saídas: trocar o texto para "fora", ou abrir uma correção com o Redis pausado (`CLIENT PAUSE`, como em `uso.int.test.ts:137`). Esse teste provaria que o contador cai no seguro e que o desafio é recusado.
2. **Os testes que sobem a aplicação inteira têm a mesma fragilidade, e não dá para trocar o cliente neles.** O `SessaoModule` cria `CLIENTE_REDIS_LOGIN` com `criarClienteRedisDaApi` (`apps/api/src/sessao/sessao.module.ts:80`). Todo teste que passa pela aplicação usa esse cliente de 100 ms para provar lógica que não depende do prazo:
   - `login-email.int.test.ts:204, 215, 268, 276, 286, 304`: se parte das reservas cair no seguro, a contagem fica dividida entre Redis e memória, e os números "cinco hashes" e "cinco seguradas" podem sair errados.
   - `mfa.int.test.ts:205, 307, 339, 352, 369` e `convite.int.test.ts:221, 379, 449`: o desafio recusa quando o Redis não responde a tempo, então um 200 esperado vira 401 no runner carregado.
   - Para esses a troca de cliente não serve. Seria preciso uma opção de teste em `configuracaoDeTeste()` para o prazo do cliente de login, ou aceitar o risco e registrá-lo. Fica para o `/retro` ou para uma correção à parte.
3. `ops-uso.int.test.ts` e `uso.int.test.ts`, pelo `uso.module.ts:24`, e `limite.int.test.ts:466`, que espera `seguroAtivo` 0 com o Redis de cache, estão expostos do mesmo jeito a uma resposta acima de 100 ms. Vale olhar junto com o item 2.

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 08:18:08 · `tasks/correcoes/2026-09-18-contador-testado-com-o-prazo-de-producao.md`

VEREDITO: APROVADO

**Cenários exigidos:** os mesmos da rodada 1. O script do contador e a marca de uso único do desafio continuam provados, inclusive em paralelo. A contagem passa pelo Redis e não pelo seguro em memória. Com o Redis fora, o login cai no seguro. Com o Redis travado, o caso ficou declarado como sem teste.

**Cobertos:** conferi a correção desta rodada no `git diff`, sem rodar testes, como você pediu.
- **Comentários dos dois testes.** O comentário em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.int.test.ts:27-31` e em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.int.test.ts:23-27` já não diz que o caso "fora ou travado" está provado. Agora diz que a queda com o Redis fora é provada e que o caso travado "ainda não há teste". Isso fecha a minha recomendação 1 na forma "trocar o texto".
- **Documento.** Em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-18-contador-testado-com-o-prazo-de-producao.md`, a seção "Correção" fala só em "com o Redis fora". A seção nova "O que fica em aberto" registra três coisas:
  - o ramo `catch` do contador e o do desafio sem teste, com o caminho por `CLIENT PAUSE`;
  - os testes que sobem a API inteira (`login-email`, `mfa`, `convite`, uso e limite), expostos ao prazo de 100 ms;
  - a saída por configuração do compose de teste, que mantém os 100 ms em produção e nos testes que provam o corte.

  Isso cobre as minhas recomendações 2 e 3.
- **Código.** Não mudou desde a rodada 1. As duas linhas que trocam para `criarClienteRedisDaFila` são as que eu já tinha aprovado.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova. As lacunas de "O que fica em aberto" já estão registradas para o `/retro`: o Redis travado no contador e no desafio, e o prazo de 100 ms nos testes que sobem a API inteira.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-18 08:18:45 · `tasks/correcoes/2026-09-18-contador-testado-com-o-prazo-de-producao.md`

VEREDITO: APROVADO
Caminho quente tocado: login (só nos testes; nenhum código de produção mudou)
Rate limit: ok (o contador continua por conta, pela chave `login:{HMAC}:{origem}`, e nunca por IP)
Fila e prioridade: ok (não se aplica ao diff)
Concorrência: protegida (os scripts que os dois testes provam continuam provados: 5 de 10 em paralelo no contador e `SET NX` no desafio)
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (a proporção do seguro do contador alimenta `limite.seguro_ativo`, e o runbook já cobre `login.contador_no_seguro`)
Bloqueantes: nenhum

**Pergunta 1: os 100 ms em produção.** O prazo está certo, e o estouro no runner não prova que ele cortaria em produção. Com Redis gerenciado na mesma região, um `EVAL` curto ou um `EXISTS`/`SET NX` leva poucos milissegundos no p99, então 100 ms dá uma folga de dezenas de vezes. O runner da esteira roda Postgres, dois Redis, observabilidade e a suíte na mesma máquina com CPU disputada. Esse cenário não representa o Redis gerenciado.

Às 7h30, 400 logins por escola e dez escolas dão algumas dezenas de comandos por segundo. Isso é carga trivial para o Redis. O que pode passar de 100 ms em produção é outra coisa: o Redis de fila travado por um script longo de outro cliente, ou em failover. Nesse caso cair no seguro é exatamente o desenho: o login não trava, e o erro puxa para segurar a conta, nunca para liberar. O alerta `seguro-limite-ativo` fica de sentinela. Se ele disparar com frequência em staging, a causa é a latência do Redis, não o prazo.

Existe uma assimetria que o documento não registra. No contador, o corte cai no seguro e o login segue. No desafio, o corte recusa (`desafio.ts:113-131`). E se o `SET NX` chegou a rodar e só a resposta atrasou, a marca fica gravada: o usuário recebe 401 e precisa recomeçar o login. Isso atinge só quem tem MFA ou vínculo em mais de uma escola, e fechar é a escolha certa. Mas esse caminho não emite log nem métrica. Está na recomendação 1.

**Pergunta 2: o risco em aberto e o caminho proposto.** O risco é real, e o caminho faz sentido com duas condições:
- **Prazo maior sem virar opção de produção.** O ideal é trocar o provider `CLIENTE_REDIS_LOGIN` (`apps/api/src/sessao/sessao.module.ts:80`) na montagem de teste, por `configuracaoDeTeste()` ou `overrideProvider`, em vez de criar uma variável de ambiente que a API lê em produção. Se virar variável, a validação de ambiente precisa recusá-la fora do perfil de teste. Assim ninguém sobe produção com um prazo de 2 s que penduraria o login com o Redis travado.
- **O corte continua provado com 100 ms.** `limite.int.test.ts:466`, `:501` e `:539` e o caso "Redis fora" de `desafio.int.test.ts:50` precisam seguir com o prazo de produção, fixado de forma explícita.

Discordo de um ponto do documento: esperar "se isso aparecer na esteira". Os testes afetados são `login-email`, `mfa` e `convite`, e o `mfa`/`convite` espera 200 e recebe 401 quando o Redis atrasa. Eles falham de forma intermitente e seguram a tarefa seguinte, pela regra 40. Vale abrir a correção agora.

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.ts:117` e `:128`: o `catch` recusa sem log nem métrica. Com o Redis de fila lento em produção, o coordenador com MFA recebe 401 sem que ninguém veja a causa. Emitir, com espaçamento e usando só ids, um aviso como `login.desafio_sem_redis` e somá-lo ao sinal de seguro ativo, com a linha correspondente no runbook.
2. Abrir já a correção do prazo do cliente de login nos testes que sobem a API inteira, nas condições descritas na pergunta 2, em vez de esperar a esteira falhar.
3. Fazer o teste com `CLIENT PAUSE` que o documento já registra. Ele deve provar duas coisas: com o Redis travado, o contador cai no seguro (e conta em dobro para o lado de segurar), e o desafio é recusado. É o único caminho de degradação do login que hoje não tem prova.
4. Documentar em `/home/joaquimdp/Documentos/git/Educa.ia/docs/infra.md` que o contador e o desafio dividem o Redis de fila com o BullMQ. Um `addBulk` grande ou um script de fila longo às 7h30 é o que, em produção, faria os 100 ms cortarem. Isso reforça a regra de que lote não roda no horário letivo.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-18 08:24:39 · `tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

VEREDITO: APROVADO

**1. É texto de teste, não segredo.** Sim.
- A linha 330 de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite.int.test.ts` está no commit `ce0e698` exatamente como a exceção descreve. Os dois textos, `'senha-escolhida-em-a-1'` e `'senha-escolhida-em-b-2'`, são senhas escolhidas pelo próprio teste.
- As contas nascem no teste. As escolas vêm de `bancada.escola()`, o e-mail é `convidada-${randomUUID()}@escola.invalid` (um domínio reservado que não existe) e o convite sai de `convidarEm` no banco do compose de teste. O banco grava só o hash, que o teste confere com `hash.verificar`.
- Os textos não servem como credencial fora do teste: não existe conta real, ambiente ou serviço externo que os aceite.

**2. A exceção é estreita.** Sim.
- `condition = "AND"` exige ao mesmo tempo o caminho exato (`^apps/api/test/convite\.int\.test\.ts$`) e a linha inteira escrita literalmente, com as duas senhas. Nenhuma pasta, extensão ou regra ficou de fora.
- Uma senha diferente naquela mesma linha já não bate com a exceção e volta a reprovar.
- O teste `reprova o segredo nos arquivos que têm linha na allowlist` agora inclui esse arquivo. Ele prova que um segredo em qualquer outra linha do arquivo continua reprovando, e o teste de `generic-api-key` prova que a regra segue ligada.
- Rodei `npx vitest run --project integracao tools/guardas/gitleaks.int.test.ts`: passaram os 6 testes, incluindo o do histórico do repositório.

Campos pessoais tocados: nenhum. A mudança é só de configuração da guarda e do teste dela.
Fora da tabela de dados do docs/lgpd.md: nada.
Autorização por objeto: não se aplica, não há rota nem consulta nova.
Logs: limpos. A saída do gitleaks mostra `REDACTED` no lugar do valor, e o teste da fixture confere que o segredo não aparece no log.
Auditoria: não se aplica.
Envio externo: nenhum.
Seed/fixture: sintético (e-mail em `.invalid`, nomes marcados como sintéticos, senhas inventadas).
Bloqueantes: nenhum.

Recomendações:
- **Ancorar o início da regex.** Em `/home/joaquimdp/Documentos/git/Educa.ia/.gitleaks.toml`, a regex da nova exceção fecha com `\s*$`, mas não abre com `^\s*`. Em tese, um segredo colado antes do `const` na mesma linha seria perdoado. O risco é baixo, porque o resto da linha teria que ser idêntico. As duas exceções mais antigas têm a mesma folga. Trocar o começo das três por `^\s*` fecha isso sem custo.
- **Seguir o "Para não repetir" da correção.** A partir de agora, senha de teste vai numa constante nomeada, como já é feito com `SENHA_NOVA` e `SENHA_DE_B` no mesmo arquivo, e não direto depois de um `.token, `. Assim a lista de exceções não cresce a cada tarefa. Isso fica para o `/retro`.

## test-engineer · 1ª rodada · APROVADO · 2026-09-18 08:24:40 · `tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

VEREDITO: APROVADO

**Cenários exigidos:**
1. A linha 330 de `apps/api/test/convite.int.test.ts` deixa de reprovar na varredura do histórico.
2. Um segredo de verdade em outra linha do mesmo arquivo continua reprovando.
3. A exceção não desliga o `generic-api-key` para o resto do repositório.
4. A exceção é de arquivo exato e linha exata, na mesma forma das duas que já existiam.

**Cobertos:**
1. O teste `o histórico do próprio repositório passa` cobre o primeiro cenário (`tools/guardas/gitleaks.int.test.ts:113`). Estava vermelho no portão com o achado do commit `ce0e698`, segundo o documento, e agora passa.
2. `reprova o segredo nos arquivos que têm linha na allowlist` (`tools/guardas/gitleaks.int.test.ts:87-93`) cobre o segundo e passou a incluir `apps/api/test/convite.int.test.ts`. Ele falharia se a exceção fosse só pelo caminho, sem a condição da linha, porque o arquivo inteiro passaria e a asserção `File: apps/api/test/convite.int.test.ts` não bateria. Ou seja, prova que a exceção vale só para a linha.
3. `reprova chave genérica de alta entropia` (linha 103) cobre o terceiro, sem mudança.
4. Sobre a forma, `.gitleaks.toml:26-31` usa `condition = "AND"`, `regexTarget = "line"`, caminho com `^...$` e ponto escapado, e o regex com a linha inteira, `\.` em `deA\.token` e `deB\.token`, colchetes e parênteses escapados e `\s*$` no fim. Casa só com a linha 330. As linhas 335 e 336, que repetem as senhas, não casam e também não são achados, porque ali a senha não vem depois de `token`.

Rodei `npx vitest run --project integracao tools/guardas/gitleaks.int.test.ts` e os seis testes passaram.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Início da linha sem âncora.** O regex em `.gitleaks.toml:31` não começa com `^`, como os outros dois. Se alguém colar um segredo no começo dessa mesma linha física, antes de `const [emA, emB] = ...`, a exceção cobriria o segredo. É improvável e segue o padrão que já existe. Vale pôr `^\s*` nas três entradas numa correção futura.
2. **Condição do caminho sem teste próprio.** Nenhum teste prova que a mesma linha colada em outro arquivo continua reprovando. Um teste assim protegeria contra alguém trocar o `AND` ou alargar o `paths`. Hoje isso vale para as três exceções, não só para esta.
3. **Aviso para as próximas tarefas.** O "Para não repetir" do documento (senha sintética numa constante com nome) serve para o `/retro` e para o `/criar-tasks`, e pode virar uma nota na regra 40 ou no guia de testes. Sem isso, cada teste de aceite com senha tende a pedir uma exceção nova.

**Arquivos:**
- /home/joaquimdp/Documentos/git/Educa.ia/.gitleaks.toml
- /home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/gitleaks.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite.int.test.ts (linha 330)

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-18 08:25:28 · `tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A correção só mexe na configuração do gitleaks e no teste dessa guarda. A senha perdoada é sintética e pertence a uma conta que o teste cria num banco de teste e descarta ao terminar.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: não se aplica (nenhuma rota nem repository foi tocado).

Logs: limpos.

Auditoria: não se aplica.

Envio externo: nenhum.

Seed/fixture: sintético.

Bloqueantes: nenhum.

O que conferi nesta rodada:
- **As regexes estão ancoradas.** As três exceções de `/home/joaquimdp/Documentos/git/Educa.ia/.gitleaks.toml` agora começam com `^\s*` e terminam com `\s*$`. Cada uma continua com `condition = "AND"`, `regexTarget = "line"` e um `paths` que aponta para um único arquivo. Era o que eu tinha recomendado na rodada 1.
- **A exceção bate com a linha real.** Ela casa com o texto exato de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite.int.test.ts:330`. As linhas 335 e 336 repetem as senhas sem o padrão `token, '...'` e ficam fora da exceção. Isso está certo.
- **O teste novo prova a regra.** "reprova a linha perdoada quando ela aparece em outro arquivo" (`/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/gitleaks.int.test.ts:95`) falha se alguém trocar `AND` por `OR` ou alargar o `paths`. O teste "a exceção é da linha, não do arquivo" passou a incluir o arquivo do convite.
- **A suíte da guarda passa.** Rodei `npx vitest run --project integracao tools/guardas/gitleaks.int.test.ts`: 7 de 7, inclusive o teste do histórico.

Recomendações:
- Nenhum teste prova a âncora `^\s*` em si. Um caso novo resolveria: no arquivo do convite, colar um token falso na mesma linha física, antes do texto perdoado, e esperar reprovação. Sem esse teste, alguém pode tirar a âncora sem que nada falhe.
- Siga o que a própria correção propõe em "Para não repetir": nos testes novos, guardar a senha sintética numa constante com nome, para ela não ficar logo depois de `.token`. Assim a allowlist não cresce a cada tarefa.

## test-engineer · 2ª rodada · REPROVADO · 2026-09-18 08:25:54 · `tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- Caminho feliz: o histórico real do repositório passa com a exceção.
- A exceção vale só para a linha: um segredo em outra linha de `convite.int.test.ts` continua reprovando.
- A exceção vale só para o arquivo: a mesma linha colada em outro arquivo reprova.
- A allowlist não desliga a `generic-api-key` inteira.
- Um segredo apagado no commit seguinte continua reprovando, porque a varredura é do histórico.
- Um repositório limpo passa, para mostrar que a falha vem do segredo e não da execução.

**Cobertos:** todos os seis, e os 7 testes passam quando rodo `npx vitest run --project integracao tools/guardas/gitleaks.int.test.ts`. As duas correções da rodada 1 estão feitas:
- As três exceções de `/home/joaquimdp/Documentos/git/Educa.ia/.gitleaks.toml` agora começam com `^\s*`.
- O caso novo da linha 95 falharia se alguém trocasse o `AND` ou alargasse o `paths`.

**Bloqueantes:**

1. **`/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/gitleaks.int.test.ts:96`: o caso novo traz escrita no código a mesma linha que a `generic-api-key` reprova. Depois do commit, o próprio teste reprova o histórico.**
   - A linha repete a original: `...aceitar(deB.token, <senha sintética>)...`. A exceção vale só para `apps/api/test/convite.int.test.ts`, então no caminho `tools/guardas/gitleaks.int.test.ts` ela é um achado. O caso novo existe justamente para provar isso.
   - Os 7 passam agora só porque a mudança ainda não foi commitada, e a varredura lê commits.
   - Reproduzi assim: repositório temporário com o `.gitleaks.toml` e esse arquivo no caminho real, um commit, e a varredura com `argumentosGitleaks`. O resultado foi status 1, com `RuleID: generic-api-key`, `File: tools/guardas/gitleaks.int.test.ts`, `Line: 96`.
   - Consequência: depois do commit, `o histórico do próprio repositório passa` fica vermelho no portão e na esteira. É o mesmo sintoma que esta correção veio resolver, agora num commit que também não se desfaz.
   - Correção exigida:
     - Não deixar o texto da linha escrito no arquivo de teste. Ler a linha em tempo de execução do arquivo real, por exemplo: `readFileSync(join(raizRepositorio, 'apps/api/test/convite.int.test.ts'), 'utf8').split('\n').find((l) => l.includes('aceitar(deB.token'))`.
     - Afirmar que a linha foi encontrada (`expect(linha).toBeDefined()`) antes de gravá-la em `apps/api/test/outro.int.test.ts`. Assim o teste também avisa se o teste do convite mudar e a exceção ficar velha.
     - Depois do ajuste, simular o commit (repositório temporário com o arquivo no caminho real) e confirmar que a varredura passa, ou deixar o portão rodar sobre o commit antes do push. Rodar o arquivo de testes com a mudança ainda não commitada não pega esse erro.

**Recomendações:**
- Um caso que prove a âncora `^\s*`: um segredo colado antes da linha perdoada, na mesma linha física, em `convite.int.test.ts`, reprova. Hoje nenhum teste falharia se alguém tirasse o `^`.
- Levar a nota da seção "Para não repetir" (senha sintética em constante com nome) também para o teste da guarda: literal que imita segredo, em teste da própria guarda, precisa ser montado em tempo de execução. O `tokenFalso()` já segue esse cuidado; a linha 96 não seguiu. Fica para o `/retro`.

## privacy-guardian · 3ª rodada · APROVADO · 2026-09-18 08:27:21 · `tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A correção mexe só em configuração da guarda de segredos e no teste dela. A linha perdoada carrega uma senha sintética de uma conta de teste (`senha-escolhida-em-b-2`), não um dado de pessoa.
Fora da tabela de dados do docs/lgpd.md: nada.
Autorização por objeto: ok (a correção não tem rota nem endpoint).
Logs: limpos.
Auditoria: ok (a correção não traz ação que a exija).
Envio externo: nenhum.
Seed/fixture: sintético. A linha perdoada é senha de teste, com banco que nasce e morre no teste.

O que conferi nesta rodada:
- **`.gitleaks.toml`**: igual à rodada 2. A exceção vale só para o arquivo exato e a linha exata juntos (`condition = "AND"`), e a regex é presa ao começo (`^\s*`) e ao fim (`\s*$`) da linha. Nenhuma pasta, extensão ou regra inteira ficou de fora.
- **Correção exigida pelo `test-engineer` na rodada 2, feita**: o arquivo de teste da guarda não tem mais a linha perdoada escrita como texto. O grep por `senha-escolhida` e `deB.token, '` em `/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/gitleaks.int.test.ts` não encontra nada. `linhaPerdoadaDoConvite()` lê a linha do arquivo real em tempo de execução e falha com mensagem própria se ela sair de lá, o que avisa quando a exceção fica velha.
- **Minha recomendação da rodada 2, feita**: o caso novo cola um token falso antes da linha perdoada, na mesma linha, e ele reprova. Isso prova a âncora `^\s*`. O token é gerado aleatoriamente a cada execução e não fica gravado no repositório.
- **A linha perdoada existe uma vez só** em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite.int.test.ts:330`, então o `.find` não pega a linha errada.
- **Rodei `npx vitest run --project integracao tools/guardas/gitleaks.int.test.ts`**: 8 de 8 passam, inclusive o do histórico. Não repeti o commit simulado. O `no leaks found` depois do commit fica pelo relato do documento, e o teste do histórico na esteira confirma depois do push.

Bloqueantes: nenhum.

Recomendações:
- No teste do convite, passar a senha sintética por uma constante com nome (`const SENHA_EM_B = '...'`), como o documento já registra em "Para não repetir". Assim o padrão não volta em teste novo e a allowlist não cresce.
- Para o `/retro`: a lição registrada no documento vale como regra de processo. Mudança na allowlist se prova com a varredura depois do commit, e literal que imita segredo, dentro do teste da guarda, é montado em tempo de execução.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/.gitleaks.toml`
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/gitleaks.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

## test-engineer · 3ª rodada · APROVADO · 2026-09-18 08:27:46 · `tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- A linha perdoada do convite passa, no commit de verdade e no histórico.
- Um segredo em qualquer outra linha de `apps/api/test/convite.int.test.ts` reprova. A exceção vale para a linha, não para o arquivo.
- A mesma linha colada em outro arquivo reprova. A exceção vale para o arquivo e a linha juntos.
- Um segredo colado antes da linha perdoada, na mesma linha, reprova (âncora `^\s*`).
- O teste da guarda não pode ser, ele mesmo, um achado depois do commit. Esse era o bloqueante da rodada 2.
- Segredo que foi commitado e depois apagado continua reprovando (o caso que já existia).

**Cobertos:**
- **Bloqueante da rodada 2 resolvido.** `linhaPerdoadaDoConvite()` lê a linha do arquivo real (`tools/guardas/gitleaks.int.test.ts:35-41`), então o texto dela não fica mais escrito no teste da guarda. Repeti a simulação: um repositório temporário com `.gitleaks.toml`, o teste da guarda e o teste do convite nos caminhos reais, um commit, e a varredura com `argumentosGitleaks`. Resultado: código 0, `no leaks found`.
- **Âncora provada.** Rodei o caso "colada" duas vezes. Com o `.gitleaks.toml` atual, o código foi 1. Com o `^\s*` tirado das três exceções, o código foi 0. Então o teste da linha 116 falha se a âncora sair.
- **Caso "outro arquivo" (linha 110).** Ele falha se o `AND` virar `OR` ou se o `paths` for alargado.
- **Caso do arquivo com linha na allowlist.** Ele inclui o convite (linha 103).
- **Portão da guarda.** `npx vitest run --project integracao tools/guardas/gitleaks.int.test.ts` passou nos 8 testes, sem `.skip` e sem mock. Chama o gitleaks de verdade.
- Os casos de permissão, isolamento e concorrência não se aplicam: a mudança é só configuração de guarda.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `tools/guardas/gitleaks.int.test.ts:38`: a checagem de "exceção velha" só procura o trecho `aceitar(deB.token`. Ela não confere se a linha encontrada ainda bate com a regex do `.gitleaks.toml`.
   - O risco: se alguém seguir o "Para não repetir" e passar a senha por constante, a linha muda mas ainda contém o trecho. Os casos das linhas 110 e 116 continuam verdes sem provar mais nada. O 116 reprovaria só pelo token, com ou sem âncora.
   - Duas saídas: conferir que a linha bate com a regex lida do `.gitleaks.toml`, ou tirar a linha do commit `ce0e698` (`git show ce0e698:apps/api/test/convite.int.test.ts`). O commit é o que a exceção existe para perdoar, e o histórico não muda.
   - O documento da correção diz que o teste "avisa se a exceção ficou velha". Hoje isso vale só em parte.
2. Para o `/retro`, reforço o que o documento já registra: uma mudança na allowlist se prova com uma varredura depois de um commit simulado, não com os testes rodando com a mudança ainda fora do commit.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/.gitleaks.toml`
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/gitleaks.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

## privacy-guardian · 4ª rodada · APROVADO · 2026-09-18 09:15:31 · `tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A rodada mexe só na configuração da guarda de segredos e em documentos do processo. O texto perdoado é uma senha sintética de uma conta de teste. Não é dado de pessoa.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: não se aplica, porque não há rota, repository nem query na mudança.

Logs: limpos.

Auditoria: não se aplica.

Envio externo: nenhum.

Seed/fixture: sintético.

**A exceção continua estreita.** Olhei o que muda em `/home/joaquimdp/Documentos/git/Educa.ia/.gitleaks.toml:27-31`:
- Continua com `condition = "AND"`. A linha só é perdoada quando o arquivo e o conteúdo batem juntos.
- O novo caminho está preso ao nome exato do arquivo, com `^` no início, `$` no fim e o ponto escapado: `^tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite\.md$`. Não pega nenhum outro arquivo de `tasks/correcoes/`.
- A regex da linha não mudou. Ela exige a linha inteira, do `^\s*` ao `\s*$`, com as duas senhas literais. Outra senha no mesmo documento continua sendo reprovada.
- A linha 25 de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md` é exatamente a linha que a regex descreve. A seção nova do documento não repete a linha.

**Onde mais o literal aparece.** Procurei na árvore toda:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados-revisoes.md:762`: a correção foi feita, o literal agora é `<senha sintética>`.
- As linhas 659 e 779 do mesmo arquivo trazem só o literal solto, sem o `deB.token, ` antes, que é o que a `generic-api-key` lê como chave. Pela simulação que vocês relataram, elas não disparam.
- As linhas 335 e 336 de `convite.int.test.ts` também não disparam.
- O acréscimo em `achados-revisoes.md` ainda não foi commitado. `git log -S` mostra o literal só em `ce0e698` e `c1bceaa`, nos dois caminhos que agora têm exceção. A varredura do histórico fica coberta.

Bloqueantes: nenhum.

Recomendações:
1. Falta um caso em `/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/gitleaks.int.test.ts` que prove que a mesma linha continua reprovada em outro documento de `tasks/correcoes/`. Seria o análogo, para documentos, do caso de `apps/api/test/outro.int.test.ts`. Ele travaria quem alargar o `paths` para `tasks/correcoes/.*` no futuro.
2. Proponho levar para a `/retro`: documento de processo e relato de revisor não citam literal que dispara a guarda. Trocar por `<senha sintética>` na hora de escrever evita pedir mais exceções no `.gitleaks.toml`.

## test-engineer · 4ª rodada · APROVADO · 2026-09-18 09:16:17 · `tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`

VEREDITO: APROVADO

A correção funciona: com a exceção nova, a varredura da esteira passa; sem ela, o documento reprova. Não rodei a suíte.

**Cenários exigidos:**
- (a) A varredura do histórico inteiro, que já contém `c1bceaa`, passa com a config nova.
- (b) A exceção nova é o que faz passar: sem ela, a mesma varredura reprova no documento.
- (c) Nenhum arquivo pendente do próximo commit traz achado novo.
- (d) A exceção continua presa ao arquivo e à linha exatos (`condition = "AND"` e a regex ancorada), sem virar exceção de pasta ou de regra.
- (e) O literal trocado em `achados-revisoes.md` não fica no histórico.

**Cobertos:**
- (a) e (b): rodei a imagem fixada da esteira, `gitleaks:v8.30.1@sha256:c00b6b…`, sobre o repositório de trabalho.
  - Com o `.gitleaks.toml` novo, o histórico dá `no leaks found`.
  - Com o `.gitleaks.toml` de `HEAD`, o mesmo histórico dá `leaks found: 1`, que é a linha 25 de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-18-gitleaks-le-senha-de-teste-do-convite.md`, gravada em `c1bceaa`.
  - Como a linha já está num commit publicado, reescrever o documento não resolveria. Estender a exceção é a saída certa.
- (c): não consegui repetir a simulação por commit. O hook de processo bloqueou o `git commit` no repositório temporário, porque a árvore leva os dois `.int.test.ts` da outra correção, e eu não quis contornar o hook. No lugar dela, varri no modo `dir` os seis arquivos pendentes: `.gitleaks.toml`, o documento, `achados-revisoes.md`, o documento novo do contador e os dois testes de sessão. Todos deram `no leaks found`. Somado ao histórico limpo, o resultado equivale à sua simulação.
- (d): `/home/joaquimdp/Documentos/git/Educa.ia/.gitleaks.toml:26-31` segue o mesmo formato das outras exceções. O segundo caminho é exato e ancorado (`^…\.md$`). A regex de linha não mudou, então o que o teste da guarda já provava continua valendo: a linha perdoada em outro arquivo reprova, e um segredo colado nela também.
- (e): `achados-revisoes.md` não estava em `c1bceaa` (`git show --stat`), então o literal da linha 762 nunca entrou no histórico. A troca por `<senha sintética>` basta. As outras menções ao literal, nas linhas 659 e 779 de `achados-revisoes.md` e na linha 29 do documento, estão em prosa e não reprovam, como mostrou a varredura.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Para o `/retro`: esta é a segunda vez nesta correção que citar a linha perdoada gera achado novo, primeiro no teste da guarda e agora no documento. Vale uma regra de processo: documento de correção e relato de revisor citam uma linha perdoada pelo gitleaks com o literal trocado por um marcador, como foi feito em `achados-revisoes.md`. Assim a lista de caminhos da exceção não cresce a cada documento. Também vale registrar que a simulação precisa levar todos os arquivos do commit, e a seção "Depois do commit" já diz isso.
2. Na simulação de commit, o hook bloqueia quando a árvore traz código de outra correção, como os dois `.int.test.ts` do contador. Varrer o histórico com a config nova e passar os arquivos pendentes no modo `dir`, como fiz, dá o mesmo resultado sem depender do commit. Pode entrar no documento como o jeito de repetir a prova.

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

## test-engineer · 1ª rodada · REPROVADO · 2026-09-20 22:57:02 · `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

Verification complete. Key finding confirmed by reading `tools/ci/esteira.test.ts:28-31`: the guard's only inputs are `ci.yml` and `package.json` — it never reads `playwright.config.ts`, and `trace: 'retain-on-failure'` appears nowhere in any test (only in a comment at `esteira.test.ts:76`).

```
VEREDITO: REPROVADO
```

**Cenários exigidos.** Esta correção não toca domínio, endpoint, query nem migration: não há caminho feliz de escola, caso de borda escolar, permissão ou isolamento a exigir — o caso de isolamento em questão (`e2e/escola-e-vinculos.spec.ts:185`) fica intocado de propósito. O que se exige aqui é: (a) vermelho antes / verde depois do passo de publicação; (b) o artefato chega quando o e2e fica vermelho; (c) o artefato contém o traço, que é a razão de existir do passo; (d) a lista fechada de ações não afrouxa; (e) nenhum outro job ganha superfície de artefato; (f) o conteúdo publicado é sintético (regra 20, item 17).

**Cobertos.** (a) `tools/ci/esteira.test.ts:79` — sem o passo, `expected [] to have a length of 1`; confirmei os 9 verdes com o passo presente. (b) `:81` prova `if: failure()`. (d) e (e) cobertos e **a lista não foi enfraquecida**: `:79` fixa exatamente 1 publicação no e2e, `:90-95` fixa 0 nos demais, e `:58` fixa o conjunto de jobs, então nem um job novo nem um segundo passo entram. O saldo de superfície é exatamente um passo em um job. (f) verificado em `e2e/__fixtures__/sessao.ts:78-79` (`@educa.invalid`, `senha-sintetica-*`): a justificativa de privacidade do documento é verdadeira.

**Bloqueante — a guarda prova a forma do passo, não que o traço seja publicado.**

`tools/ci/esteira.test.ts:75-88`. O título afirma "o e2e publica o traço da falha", mas a asserção não alcança nada que produza traço. `esteira.test.ts:28-31` lê só `ci.yml` e `package.json`; `playwright.config.ts:35` (`trace: 'retain-on-failure'`) e o `outputDir` (não declarado, logo o padrão `test-results/` na raiz) não são afirmados em teste nenhum no repositório. Consequências concretas, todas com os 9 verdes intactos:

- `trace: 'off'` em `playwright.config.ts:35` → o passo publica um diretório sem traço;
- `outputDir` apontado para outro lugar → `path: test-results/` não casa e o artefato sai vazio;
- o passo movido para antes de `npm run ci:e2e` → `if: failure()` dispara por falha do `npm ci` e publica nada.

E o que faz disso um defeito e não um detalhe: `.github/workflows/ci.yml:91` usa `if-no-files-found: ignore`, então nenhum dos três casos avisa. A esteira fica verde, o artefato fica vazio, e o próximo vermelho de e2e volta exatamente ao estado que esta correção existe para encerrar — o defeito se reintroduz em silêncio.

**Correção exigida:** em `tools/ci/esteira.test.ts`, amarrar a guarda ao `playwright.config.ts` — que o modo de traço seja um dos que retêm em falha, e que o `path` publicado case com o diretório de saída efetivo da configuração — e afirmar que o passo de publicação vem depois do passo `npm run ci:e2e` (comparação de índice). O arquivo já faz acoplamento entre arquivos em `:62` (`scripts[ci:${nome}]`), então o padrão e o custo já estão estabelecidos.

**Sobre "não reproduz, não mexo no teste": é a decisão certa, não fuga de trabalho.**

Confirmei que não há corrida estrutural disponível para explicar a falha só no `celular`: a web é SPA com Vite, sem SSR, então não existe o clássico toque perdido antes da hidratação — o `tap()` de `acionar` (`e2e/escola-e-vinculos.spec.ts:36-40`) cai em botão já renderizado pelo React, e o Playwright ainda espera estabilidade. As hipóteses com evidência no documento estão de fato descartadas, e a de `etapaDoLogin` confere (`apps/api/src/sessao/login.service.ts:146-150` só exige MFA de coordenador; o segundo acesso é de professor). Reestruturar um teste de isolamento que passa em oito observações, por causa que não se sustenta, trocaria cobertura real por palpite — é o que a regra 10, item 5, não quer. Diante de causa não estabelecida, tornar a próxima ocorrência diagnosticável é a jogada correta.

**Recomendações**

1. `.github/workflows/ci.yml:91` — `if-no-files-found: warn` em vez de `ignore`. O job já falhou; o aviso não custa nada e faz um caminho errado aparecer no log em vez de sumir.
2. `.github/workflows/ci.yml:85` — `if: failure()` não cobre cancelamento. Com `timeout-minutes: 30` (`:69`), um e2e travado é cancelado, não "failure", e não publica nada — justamente na classe de sintoma (lentidão) que motivou a correção. `if: failure() || cancelled()` resolve sem `${{ }}`, que `esteira.test.ts:49` proíbe.
3. Afirmar também `name: traco-do-e2e`: o documento o promete como contrato da conferência final ("a primeira falha tem de trazer o artefato `traco-do-e2e`") e nada o fixa.
4. Registrar na lista de hipóteses que o `celular` tem caminho de código próprio (`tap()`, `e2e/escola-e-vinculos.spec.ts:36-40`) e que oito observações verdes não limitam uma corrida de baixa probabilidade; um `--repeat-each` alto só no projeto `celular` limitaria. Não bloqueia — é registro para o `/retro`.
5. Com `retries: 0` (`playwright.config.ts:29`) e a regra de só commitar sobre esteira verde, um vermelho não reproduzido continua travando a tarefa seguinte. A correção compra diagnóstico, não imunidade; vale deixar isso explícito no documento.
6. Confirmar uma vez que o SHA `043fb46d…` resolve para a tag v7.0.1 de `actions/upload-artifact` — a guarda prova o formato do SHA, não a correspondência. Território do `infra-guardian`.

## test-engineer · 3ª rodada · APROVADO · 2026-09-20 23:59:46 · `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

## Auditoria da rodada 3 (só o diff desde a minha rodada 2)

Auditei o diff de `tools/ci/esteira.test.ts`, `.github/workflows/ci.yml` e o documento, mais o que eles afetam. Rodei `npx vitest run tools/ci/esteira.test.ts`: 9 de 9 verdes, 288 ms.

**Conferência das cinco recomendações**

1. Documento, "Teste que reproduz" (linhas 83-86): diz "com `failure()` e `cancelled()` na condição", sem o literal `if: failure()`. Aplicada. O único `if: failure() || cancelled()` que sobrou está na seção "Correção" (linha 121), onde é a condição real do passo — correto ali.
2. Documento, linha 116-117: "publica `test-results/` ... Só isso: o `reporter` é `list` e `github` ... sem diretório de relatório para publicar". Confere com `playwright.config.ts:30` (`[['list'], ['github']]` em CI, sem `html`): não existe `outputFolder` a publicar. Aplicada e verdadeira.
3. `tools/ci/esteira.test.ts:96-97`: duas `toContain`. Confirmei os três caminhos que você pediu: `if: always()` → vermelho (não contém `failure()`); só `failure()` → vermelho (não contém `cancelled()`); só `cancelled()` → vermelho; `if` removido → `expect(undefined).toContain(...)` também quebra. A relaxação da ordem literal não afrouxou o que importava, com uma ressalva registrada abaixo (recomendação 1).
4. `:92-93`: `as Passo` fora, `expect(publicacao).toBeDefined()` presente, e o índice sai de `findIndex` próprio em `:104-106`, comparando a publicação com o passo `npm run ci:e2e`. Aplicada.
5. `:101` afirma `timeout-minutes` do job do e2e (`Number(...)` → `NaN` se o campo sair, logo vermelho), e `Job` ganhou `'timeout-minutes'?: number` em `:16`. Confere com `ci.yml:69` (`timeout-minutes: 30`). Aplicada — é a premissa do `cancelled()`, agora fixada.

**Nada mais mudou.** `git diff --stat` mostra só `ci.yml` (+16), `esteira.test.ts` (+60/-2) e `achados-revisoes.md` (+37, o registro da rodada 1). O elo com o `playwright.config.ts` exigido na rodada 1 segue em `:114-119`, intacto, e as duas guardas de borda (`:79-86` lista fechada de ações, `:122-127` nenhum outro job publica artefato) continuam de pé.

```
VEREDITO: APROVADO
Cenários exigidos: (rodada 3, só o diff) a condição do passo continua exigindo falha e cancelamento sem depender da ordem escrita · `always()` e "só uma das duas" ficam vermelhos · a asserção não volta a depender de coerção de tipo (`as Passo`) · o `timeout-minutes` do job do e2e é afirmado, porque é a premissa do `cancelled()` · o documento descreve o passo como ele é (condição e o que se publica) · nada além das cinco recomendações mudou
Cobertos: todos — esteira.test.ts:96-97 (as duas condições, ordem livre; `always()`, condição única e `if` ausente ficam vermelhos), :92-93 (`toBeDefined` no lugar da coerção), :104-106 (ordem provada por `findIndex`, não por índice fixo), :101 (prazo do job > 0; `NaN` se o campo sair), :114-119 (elo com `trace` e `outputDir` efetivo da configuração), :91 e :122-127 (exatamente uma publicação no e2e, zero nos outros jobs), documento linhas 83-86 e 116-117 (texto alinhado ao YAML, conferido contra playwright.config.ts:30)
Bloqueantes: nenhum
Recomendações:
- tools/ci/esteira.test.ts:96-97 — as duas `toContain` aceitam `if: success() || failure() || cancelled()`, que publicaria em execução verde e contraria o "só quando falha" do próprio título do caso. Fecha com duas linhas: `expect(publicacao?.if).not.toContain('success()')` e `expect(publicacao?.if).not.toMatch(/\balways\(\)/)`. Não bloqueia: os regressos plausíveis (`if` removido, `always()`, condição única) já ficam vermelhos.
- tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md:61 e :117 — duas citações fora por uma linha: `trace: 'retain-on-failure'` está em playwright.config.ts:35 (não :34) e o `reporter` em :30 (não :29). O `retries: 0` da linha 130 está certo (:29). Vale corrigir antes do commit, porque é o documento que o /validar vai reler.
- tasks/correcoes/achados-revisoes.md — a tabela do documento (linha 179) registra a minha rodada 2 como APROVADO às 23:29:26, mas não existe bloco correspondente no `achados-revisoes.md` (`grep esteira-descarta` só acha a rodada 1, linha 958). Como o hook gravou o bloco da rodada 2 da correção anterior (linha 934), a ausência aqui parece falha de registro, e ela me custou o texto original das cinco recomendações: auditei contra o resumo do seu prompt mais o que a rodada 1 exigia. Confira o hook antes do commit e, se for o caso, leve o caso ao /retro.
```

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml`, `/home/joaquimdp/Documentos/git/Educa.ia/playwright.config.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados-revisoes.md`.

## test-engineer · 4ª rodada · APROVADO · 2026-09-21 00:29:29 · `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

Verificações feitas, todas empíricas.

**1. As duas asserções novas fecham o furo.** Mutei o `ci.yml` e restaurei (md5 conferido, 9/9 verdes de novo):

| `if` do passo | Guarda |
|---|---|
| `success() \|\| failure() \|\| cancelled()` | vermelho — `expected 'success() \|\| failure() \|\| cancelled()' not to contain 'success()'` |
| `failure() \|\| cancelled() \|\| always()` | vermelho — `not to match /\balways\(\)/` |
| `failure() \|\| cancelled()` (atual) | 9 de 9 verdes, 286 ms |

O `\b` da regex não é decoração: sem ele, nada mudaria nestes casos, mas ele evita casar em palavra que termine em `always()`. A ordem continua livre, como na rodada 3.

**2. As citações batem com a fonte.** `grep -n` em `/home/joaquimdp/Documentos/git/Educa.ia/playwright.config.ts`: `retries: 0` em :29, `reporter` em :30, `trace: 'retain-on-failure'` em :35. O documento agora cita :35 na linha 61, :30 na linha 117 e :29 na linha 130 — as três corretas. Não sobrou nenhuma outra citação de linha do `playwright.config.ts` no documento.

**3. Nada mais mudou.** `git diff --stat`: `ci.yml` +16 (idêntico à rodada 3), `esteira.test.ts` +63/-2 (eram +60/-2, logo as 2 asserções e o comentário), `achados-revisoes.md` +66 (rodadas 1 e 3). O elo com o `playwright.config.ts`, a lista fechada de ações e a guarda de "nenhum outro job publica artefato" seguem intactos.

**4. Minha terceira recomendação.** Confirmei a ausência: `grep esteira-descarta` em `achados-revisoes.md` acha só a 1ª (linha 958) e a 3ª (linha 995) rodadas, enquanto a tabela do documento (linha 179) registra a 2ª como APROVADO às 23:29:26. É falha de registro do hook, e tirá-la desta correção está certo — mexer em `tools/processo/revisoes.ts` aqui seria escopo novo em cima de um portão já carimbado.

```
VEREDITO: APROVADO
Cenários exigidos: (rodada 4, só o diff) `if: success() || failure() || cancelled()` fica vermelho · `always()` em qualquer posição fica vermelho · a condição atual continua verde e os outros 8 casos do arquivo não regridem · as duas citações de linha do documento batem com a fonte · nada além das duas recomendações de código e texto mudou
Cobertos: todos — tools/ci/esteira.test.ts:96-97 (`success()` e `always()` provados vermelhos por mutação real do ci.yml, com restauração conferida por md5), :91-95 e :104-106 (as guardas da rodada 3 seguem verdes, 9 de 9), documento linhas 61, 117 e 130 (conferidas contra playwright.config.ts :35, :30 e :29)
Bloqueantes: nenhum
Recomendações:
- tools/ci/esteira.test.ts:97 — o `not.toContain('success()')` também recusa `if: !success()`, que seria uma forma válida de "publica quando não deu verde". Fica uma forma canônica só, o que é defensável e está dito no comentário; se um dia alguém escrever a negação, o vermelho vai parecer bug do teste. Nada a fazer agora.
- Registro para o /retro (já encaminhado ao TODO.md, fora desta correção): o hook perdeu o bloco da 2ª rodada, e o buraco só aparece quando alguém cruza a tabela do documento com o `achados-revisoes.md`. Uma asserção no `tools/processo/revisoes.ts` que exija um bloco por linha da tabela resolveria a classe inteira.
```

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml`, `/home/joaquimdp/Documentos/git/Educa.ia/playwright.config.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados-revisoes.md`.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-21 00:34:40 · `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

VEREDITO: APROVADO
Caminho quente tocado: deploy (esteira; nada de produção no diff)
Rate limit: não se aplica (nenhum limitador no diff)
Fila e prioridade: não se aplica
Concorrência: não se aplica (nenhuma escrita nova)
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: não se aplica (nenhum caminho quente novo, nenhum alerta novo)

Segurança da mudança na esteira, ponto a ponto do que foi perguntado:
- `actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` confere: `gh api repos/actions/upload-artifact/git/ref/tags/v7.0.1` devolve exatamente esse SHA. Ação oficial da própria GitHub, fixada por SHA de 40 caracteres, e a guarda de `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts:84` mantém a lista fechada.
- Permissão não ampliada: `permissions: contents: read` no topo, nenhum `permissions` de job (asserido em `esteira.test.ts:52-57`), e a publicação de artefato não usa o `GITHUB_TOKEN` — não precisa de `actions: write`. Sem `${{ }}`, sem `secrets.*`, sem `env` em job ou passo (`esteira.test.ts:59-68`). O workflow só dispara em `push` no `main` e `workflow_dispatch`, então fork não alcança o passo.
- Ordem correta: o passo vem depois de `npm run ci:e2e`, e `tools/ci/e2e.ts:22-24` derruba o compose antes de terminar — o `test-results/` do host sobrevive ao `down --volumes`. O `path` bate com o `outputDir` efetivo do `playwright.config.ts` (padrão `test-results`), e a guarda amarra os dois.
- `cancelled()` cobre o estouro de `timeout-minutes: 30` (a doc do GitHub trata o estouro como cancelamento automático do job), e, se em algum caso o job for contabilizado como falha, `failure()` já pega. A condição é superconjunto segura.
- Sem superfície indevida de segredo: o ambiente do e2e sai de `.env.example` e `infra/teste.env`, ambos versionados; `infra/teste.env` não tem credencial. Nada do runner (token do checkout está com `persist-credentials: false`) chega ao `test-results/`.

Bloqueantes: nenhum.

Recomendações:

1. `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md:140` afirma "O artefato é do repositório privado". É falso: `gh repo view` devolve `LitzGab/Turmma.ai`, `visibility: PUBLIC`. A conclusão continua válida (todo dado do e2e é sintético e o ambiente já está versionado em repositório público), mas a premissa precisa ser corrigida, porque o artefato será baixável por qualquer pessoa por 7 dias — o `privacy-guardian` deve julgar com esse fato, não com o outro.

2. O `cancelled()` cobre menos do que o documento promete. Caso morto no meio pelo prazo não tem `trace.zip` finalizado (o `retain-on-failure` só persiste quando o caso termina em falha), e é justamente o caso lento o que seria morto. Além disso a publicação roda dentro da janela de graça do cancelamento, com risco de upload truncado se o `test-results/` estiver grande. Vale ajustar o texto e não contar com o traço nessa via.

3. Falta a metade servidor do diagnóstico, que é a que decidiria as hipóteses listadas (fila do hash rebaixando, `POST /v1/sessao/escola` lento, saturação do Postgres). `tools/ci/e2e.ts:22` só imprime `docker compose logs --no-color --tail 200`, e numa suíte de 132 casos as 200 linhas por serviço já terão passado do momento da falha. Despejar os logs dos serviços dentro de `test-results/` antes do `upload-artifact` (ou subir o `--tail`) compraria a outra ponta da linha de tempo pelo mesmo passo.

4. Sobre o desenho maior, respondendo direto: há fragilidade de infraestrutura de teste por trás dos três vermelhos diferentes, e ela fica de pé. O job do e2e sobe o compose **inteiro** (`etapaCompose('subir o ambiente completo', 'up', ...)` sem lista de serviços): ~18 contêineres, incluindo `observabilidade` (grafana/otel-lgtm), sem nenhum limite de CPU ou memória em `infra/compose.yml`, no mesmo runner compartilhado onde o Playwright roda com `cpuMaisLenta: 4` e, no perfil `celular`, 600 ms de RTT. `workers` não está fixado e `retries: 0`. Nesse arranjo, o orçamento de tempo do `celular` não tem folga, e contenção de CPU do runner vira vermelho que não reproduz em máquina de desenvolvedor — exatamente o padrão dos três casos (e2e fora da curva, `borda.int.test.ts` com 503, reconciliação do despachante). Para o `/retro`: fixar `workers` na esteira, não subir `observabilidade` no job do e2e, e decidir entre folga de `expect` no perfil `celular` ou uma retentativa na esteira com o flake registrado, em vez de tratar cada ocorrência como correção pontual.

5. `if-no-files-found: warn` não é sinal único de mudança de configuração do traço: falha ao subir o compose também deixa `test-results/` vazio e produz o mesmo aviso. O comentário do `ci.yml:93-94` promete mais do que o aviso distingue.

6. `docs/runbook.md` não tem parágrafo dizendo o que fazer com esteira vermelha de e2e nem cita o artefato `traco-do-e2e`. Uma linha lá é o que faz o diagnóstico comprado aqui ser encontrado na próxima ocorrência.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-21 01:06:55 · `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

VEREDITO: APROVADO
Caminho quente tocado: deploy (esteira; nada de produção no diff)
Rate limit: não se aplica
Fila e prioridade: não se aplica
Concorrência: não se aplica (nenhuma escrita nova)
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (nenhum alerta novo; o artefato ganhou o parágrafo de runbook que a regra 80, item 10, pede)

Conferência do diff desde a rodada 1 (`git diff --stat`: `ci.yml` +16 igual à rodada 1, `docs/runbook.md` +16 novo, `esteira.test.ts` 66 linhas, `achados-revisoes.md` +133 — nenhum arquivo de produção tocado):

1. **Recomendação 1 aplicada e o fato confere.** `gh repo view --json nameWithOwner,visibility` → `LitzGab/Turmma.ai`, `PUBLIC`. O documento (linhas 143-163) troca a premissa e refaz o argumento sobre o fato certo. Verifiquei as duas pernas do argumento: `e2e/__fixtures__/sessao.ts:74-79` cria nome, `@educa.invalid` e `senha-sintetica-<uuid>` por execução, e as chaves que aparecem no traço (`IDENTIDADE_CHAVE_CIFRA_V1`, `LOGIN_CHAVE_DISPOSITIVO_V1`, `LOGIN_EXTERNO_*_SEGREDO`, `STORAGE_CHAVE_SECRETA`) estão todas em `.env.example`, versionadas e rotuladas sintéticas; `infra/teste.env` só tem portas. O artefato de fato não revela nada que o repositório já não contenha.
2. **Recomendação 2 aplicada** (documento 121-125 e `docs/runbook.md`, "O caso morto pelo estouro de `timeout-minutes` não deixa traço finalizado"). O texto agora promete o que a via entrega.
3. **Recomendação 5 aplicada** no documento (126-128).
4. **Recomendação 6 aplicada:** a seção "Esteira vermelha no e2e" tem nome do artefato, `gh run download`, `show-trace`, prazo, o significado do vazio e a regra de tratar vermelho não reproduzido por `/corrigir`. Confere com o passo real do `ci.yml`.
5. **Pedido do `privacy-guardian`:** `tools/ci/esteira.test.ts:29-33` fixa `MODOS_QUE_GUARDAM_NA_FALHA = ['retain-on-failure']` e a asserção compara contra `playwright.config.ts:35`. `'on'` passa a ficar vermelho — minimização certa num repositório público.

Portão: `.processo/portao.json` (início 2026-09-21T03:36:46Z, suítes typecheck, lint, test, infra) e `node tools/processo/portao-local.ts conferir` diz "portão local válido para o código atual". `npx vitest run tools/ci/esteira.test.ts`: 9 de 9 verdes, 284 ms.

**Encaminhamento das recomendações 3 e 4: está certo, nenhuma das duas entra aqui.**

- **3 (logs dos serviços dentro de `test-results/`)**: fora do escopo e, num repositório público, é justamente a parte que precisa de julgamento de conteúdo antes de ser publicada — log de serviço não tem a mesma garantia de sinteticidade que o traço do Playwright tem por construção. A meia-ponta que existe hoje (`tools/ci/e2e.ts:22`, `docker compose logs --tail 200` no log do job) está registrada no runbook como o que resta. Adiar é a decisão conservadora.
- **4 (fixar `workers`, não subir `observabilidade` no job do e2e, folga no `celular` ou retentativa registrada)**: é desenho da esteira, não defeito desta correção, e nenhuma regra 80 de caminho quente de produção depende disso. Continua sendo o achado mais valioso da sessão, e vira tarefa com teste próprio — não correção em cima de portão já carimbado.

Bloqueantes: nenhum

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml:93-94` — o comentário no YAML ficou mais estreito que o texto corrigido: ainda diz que o vazio "significa que a configuração do traço ou o diretório de saída mudou", sem a terceira causa (compose que não subiu), que o documento e o runbook já registram. Uma palavra no comentário alinha as três fontes.
2. `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md` — as recomendações 3 e 4 ainda não estão lá (`grep` só acha a linha 51, de observabilidade, sem relação). Como o encaminhamento é exatamente "TODO em commit separado e `/retro` do F1", registre antes de fechar a sessão: a 4 é a que explica três vermelhos diferentes e é a que se perde se ficar só no prompt.
3. A conferência final segue sendo a esteira: a primeira falha de e2e depois deste commit tem de trazer `traco-do-e2e`, e execução verde não pode trazer nada. Se a primeira falha vier com artefato vazio e `warn`, a hipótese a investigar primeiro é compose que não subiu, não configuração do traço — o elo com o `playwright.config.ts` já está guardado em teste.

## test-engineer · 5ª rodada · REPROVADO · 2026-09-21 01:08:28 · `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

VEREDITO: REPROVADO

**O que confirmei do que você pediu** (mutação em cópia do repositório em `/tmp`, repositório real intocado — `git status` e md5 conferidos):

| Mutação | Guarda |
|---|---|
| `trace: 'on'` no `use` de topo | ❌ vermelho — `expected [ 'retain-on-failure' ] to include 'on'` |
| `trace: 'off'` no `use` de topo | ❌ vermelho — `to include 'off'` |
| passo de publicação removido do `ci.yml` | ❌ vermelho — `expected [] to have a length of 1` |
| tudo restaurado | ✅ 9 de 9, 285 ms |

O predicado também recusa `'on-first-retry'`, `undefined` e a forma de objeto (`{ mode: … }`) — probei isolado. Com `retries: 0`, excluir os modos de retentativa está certo.

Cenários exigidos: (rodada 5, só o diff) `trace: 'on'` fica vermelho · `trace: 'off'` continua vermelho · a configuração **efetiva** do traço e do diretório de saída é a afirmada, porque é dela que depende a minimização que sustenta publicar num repositório público · os 8 casos anteriores não regridem · o documento descreve o que o teste de fato exige, e o registro de revisão do documento é verdadeiro.

Cobertos: `tools/ci/esteira.test.ts:123` (modo único aceito, `'on'` e `'off'` provados vermelhos), `:125` (`path` × `outputDir` de topo), `:91-119` (as guardas das rodadas 3 e 4 seguem verdes), `docs/runbook.md:468-483` (nome do artefato, `gh run download`, `show-trace`, limite do estouro de prazo e o vazio como sinal).

Bloqueantes:

1. **`tools/ci/esteira.test.ts:123-125` — a guarda lê só o `use` de topo, e a configuração efetiva do Playwright é por projeto. A minimização que a rodada 5 introduziu é evadível por uma linha, sem vermelho.** Provei as duas evasões na cópia, com o resto intacto:
   - `trace: 'on'` dentro de `projects[].use` do `celular` → **9 de 9 verdes**. `projects[].use` vence o `use` de topo, então o modo efetivo do `celular` passa a ser `'on'`: o artefato público levaria o traço dos 66 casos do projeto, exatamente o que `MODOS_QUE_GUARDAM_NA_FALHA` existe para impedir (documento, linhas 161-162).
   - `outputDir: 'outro-lugar'` dentro de `projects[]` do `celular` → **9 de 9 verdes**. O traço do projeto onde o vermelho desta correção aconteceu cairia fora de `test-results/`, e o `if-no-files-found: warn` daria o mesmo aviso indistinguível.
   
   O mesmo vale para `trace: 'off'` por projeto: é o bloqueante da minha rodada 1 reaberto na granularidade de projeto. **Correção exigida:** resolver o valor efetivo por projeto e afirmar cada um — `projects[].use?.trace ?? use.trace` contra `MODOS_QUE_GUARDAM_NA_FALHA`, e `projects[].outputDir ?? outputDir ?? 'test-results'` contra o `path` publicado — ou, se preferir a forma curta, afirmar que nenhum projeto declara `trace` nem `outputDir` (a configuração hoje não declara, `playwright.config.ts:38-57`). Não aceito isto como recomendação porque é a rodada 5 que faz a minimização virar a justificativa de regra 20 para publicar num repositório público: a afirmação do documento passou a depender de um teste que não a cobre.

2. **`tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md:145-146` — o fato registrado sobre a própria revisão é falso, e ele esconde uma aprovação de regra 20 dada sobre a premissa errada.** O documento diz que o erro "foi apontado pelo `infra-guardian` e a premissa corrigida antes de o `privacy-guardian` decidir". A tabela do próprio documento (`:205-206`) diz o contrário: `privacy-guardian` rodada 1 terminou às **00:33:34**, `infra-guardian` rodada 1 às **00:34:40**, e o documento foi gravado às **00:36**. Ou seja, o `privacy-guardian` aprovou a versão que dizia "repositório privado" e não viu nem o fato corrigido nem o estreitamento de `MODOS_QUE_GUARDAM_NA_FALHA` — os dois estão dentro do que ele audita (minimização, regra 20). Agrava: o bloco da rodada dele não existe em `tasks/correcoes/achados-revisoes.md` (só o do `infra-guardian`, `:1042`), então o texto do documento é o único registro, e ele está errado. **Correção exigida:** corrigir a frase para o que aconteceu (premissa corrigida **depois** da rodada 1 do `privacy-guardian`, por achado do `infra-guardian`) e rodar o `privacy-guardian` sobre a premissa "repositório público" mais a minimização nova, em vez de dar a rodada 1 dele como cobrindo o fato certo.

Recomendações:

- `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md:107-108` — "o modo de traço tem de estar entre os que guardam na falha" descreve a guarda anterior. Hoje o teste exige **exatamente** `retain-on-failure` e recusa `'on'`, que também guarda na falha. A linha 161 está certa; a 107 contradiz ela.
- `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md:100-105` — a tabela de mutações provadas não tem a linha de `trace: 'on'`, que é a mutação da rodada 5. Confirmei o vermelho; falta só registrar, porque é essa tabela que o `/validar` relê.
- `.github/workflows/ci.yml:91-92` — o comentário ainda diz que diretório vazio "significa que a configuração do traço ou o diretório de saída mudou". O documento (`:126-128`) e o runbook já reconhecem que o `warn` não distingue a causa (compose que não subiu produz o mesmo vazio); o comentário no YAML ficou com a versão antiga.
- `docs/runbook.md:469` repete o nome `traco-do-e2e` à mão. O teste fixa o nome em `tools/ci/esteira.test.ts:28`; uma renomeação futura deixa o runbook obsoleto em silêncio. Vale um comentário cruzado, ou aceitar e registrar.

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/playwright.config.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml`, `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados-revisoes.md`.

## privacy-guardian · 3ª rodada · APROVADO · 2026-09-21 02:12:49 · `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

Auditei o diff da rodada 3 (guarda por projeto, `ci.yml`, `docs/runbook.md`) e reexecutei as mutações que sustentam a minimização. Não editei nada; o `playwright.config.ts` foi restaurado ao original depois das mutações (`git diff --stat` limpo).

O que verifiquei por conta própria, em vez de aceitar a tabela do documento:

- `tools/ci/esteira.test.ts:130-143` resolve o efetivo por projeto (`projeto.use?.trace ?? topo`, `projeto.outputDir ?? topo ?? 'test-results'`) e itera `[...projetos, {}]`, ou seja, afirma cada projeto **e** o topo. Mutação 1, `trace: 'on'` dentro de `projects[].use` do `celular`: vermelho, `AssertionError: modo de traço de celular: expected [ 'retain-on-failure' ] to include 'on'`. Mutação 2, `outputDir: 'outro-lugar'` no projeto `celular`: vermelho, `diretório de saída de celular: expected 'test-results' to be 'outro-lugar'`. Restaurado: 9 de 9 verdes.
- A guarda falha fechada nas variações que o `test-engineer` não listou: `trace` como objeto (`{ mode: 'on' }`) não está em `MODOS_QUE_GUARDAM_NA_FALHA` e reprova; `projects` vazio reprova em `expect(projetos.length).toBeGreaterThan(0)`; `path` com mais de uma entrada não bate a igualdade com o `outputDir`.
- Quem mais escreve em `test-results/`: ninguém. Grep no repositório inteiro (fora de `node_modules`, `.git`, `tasks/`, e as skills de terceiros) só acha `.gitignore`, `.dockerignore`, `eslint.config.mjs` e o próprio `ci.yml`. `video` e `screenshot` não estão configurados em lugar nenhum, então o artefato de hoje é `trace.zip` + `error-context.md` do caso que falhou.
- A premissa que o runbook passou a declarar confere: `tools/ci/compose.ts:12,18,64` monta o ambiente só de `.env.example` e `infra/teste.env`, sem `process.env`; `.github/workflows/ci.yml` não tem nenhum `secrets.*` e os quatro `checkout` usam `persist-credentials: false`.
- Nenhum campo pessoal, DTO, log, rota ou seed foi tocado. Fixtures do e2e continuam sintéticas (`e2e/__fixtures__/sessao.ts`, nome inventado, domínio `.invalid`).

```
VEREDITO: APROVADO
Campos pessoais tocados: nenhum — o diff é esteira (.github/workflows/ci.yml), guarda de esteira (tools/ci/esteira.test.ts) e documentação (docs/runbook.md)
Fora da tabela de dados do docs/lgpd.md: nada novo
Autorização por objeto: não se aplica (nenhuma rota tocada)
Logs: limpos
Auditoria: não se aplica (nenhuma ação auditável tocada)
Envio externo: nenhum envio a provedor de IA. Há publicação de artefato para o GitHub Actions em repositório público — traço do caso que falhou, dado sintético, 7 dias, com nome, prazo, caminho, condição e modo de traço por projeto afirmados em teste
Seed/fixture: sintético (e2e/__fixtures__/sessao.ts, domínio .invalid)
Bloqueantes: nenhum
Recomendações:
  1. tools/ci/esteira.test.ts:130-143 — a guarda cobre `trace` e `outputDir`, mas não `video` nem `screenshot`, que são saída do Playwright e vão para o mesmo `test-results/`. Hoje nenhum dos dois está configurado (padrão `off`), então não há furo; `video: 'on'` no topo ou num projeto reabriria exatamente a classe de evasão que esta rodada fechou, e a linha nova do runbook ("nada além da saída do Playwright") não cobre, porque vídeo é saída do Playwright. Asserção de uma linha por modo, no mesmo laço.
  2. Recomendações 1, 2 e 4 da rodada 2 continuam sem registro: TODO.md não está modificado na árvore e nenhum commit novo o toca. Registre antes do commit desta correção, como o documento promete.
  3. docs/runbook.md — o parágrafo do artefato público é bom; vale nomear ali o teste que o sustenta (`tools/ci/esteira.test.ts`, guarda por projeto), para quem for mexer no `playwright.config.ts` saber onde o vermelho vai aparecer.
```

Respondendo às duas perguntas diretas.

**A aprovação da rodada 2 se mantém?** Sim. Ela apoiava-se em duas pernas: o fato de o repositório ser público e a minimização garantida por teste. O buraco que o `test-engineer` achou não desmente o fato nem o conteúdo do artefato de hoje — desmentia o *alcance da prova*, que valia só para o `use` de topo. Com a resolução efetiva por projeto, provada vermelha nas duas evasões e restaurada, a segunda perna volta a sustentar o peso que eu tinha posto nela. A minimização agora não é a configuração atual estar certa por acaso; é a esteira reprovar quem a mudar, inclusive por dentro de um projeto.

**Alguma das recomendações 1, 2 e 4 passou a ser obrigatória?** Não, nenhuma vira bloqueante. Mas a de número 2 (guarda sobre `ARQUIVOS_AMBIENTE_TESTE` e a ausência de `process.env` em `tools/ci/compose.ts`) subiu de prioridade, e o motivo é o próprio parágrafo novo do runbook: ele agora declara, por escrito, que o artefato é inofensivo *porque* o ambiente de teste sai só dos dois arquivos versionados. Uma afirmação de segurança escrita em documento e não amarrada em teste é a mesma forma de furo que esta rodada acabou de consertar no `trace` — a diferença é que lá o defeito já podia ser explorado por uma linha, e aqui a construção está correta hoje e conferi que está. Leve-a ao `/validar` marcada como a primeira da fila, junto com a recomendação 1 acima, que é da mesma família.

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/playwright.config.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml`, `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`.

## test-engineer · 6ª rodada · APROVADO · 2026-09-21 02:13:11 · `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

Auditei o diff desde a rodada 5 e provei as correções por mutação real (repositório restaurado: md5 de `playwright.config.ts` e de `ci.yml` conferidos, `git diff --stat` inalterado, 9/9 verdes no fim).

**Bloqueante 1 — corrigido, provado.** `tools/ci/esteira.test.ts:137-142` resolve o valor efetivo por projeto e afirma cada um mais o topo. Mutei e restaurei cinco vezes:

| Mutação em `playwright.config.ts` | Guarda |
|---|---|
| `trace: 'on'` em `projects[].use` do `celular` | vermelho — `modo de traço de celular: expected [ 'retain-on-failure' ] to include 'on'` |
| `trace: 'off'` em `projects[].use` do `chromebook` | vermelho — `modo de traço de chromebook: ... to include 'off'` |
| `outputDir: 'outro-lugar'` em `projects[]` do `celular` | vermelho — `diretório de saída de celular: expected 'test-results' to be 'outro-lugar'` |
| `outputDir` de topo trocado | vermelho |
| `projects: []` | vermelho — `expected 0 to be greater than 0` (`:136`) |
| passo removido do `ci.yml` | vermelho — `expected [] to have a length of 1` |
| tudo restaurado | 9 de 9, 286 ms |

As duas evasões que eu achei na rodada 5 ficam vermelhas, cada uma nomeando o projeto. A mensagem por projeto não é cosmética: é ela que diz onde olhar quando a guarda cair.

**Bloqueante 2 — corrigido.** O texto (`:153-159`) agora bate com a tabela: `privacy-guardian` rodada 1 às 00:33:34 sobre a premissa errada, `infra-guardian` às 00:34:40, premissa corrigida, e a rodada 2 do `privacy-guardian` (01:04:19–01:07:43, linha 221) como a que vale. Confirmei a cronologia: a rodada 2 do `infra-guardian` (iniciada 01:04:45) já auditou o documento com a premissa corrigida, então a rodada 2 do `privacy-guardian`, iniciada 01:04:19, viu o fato certo.

**As quatro recomendações** foram aplicadas: tabela de mutações com as linhas novas (`:100-108`), "exatamente `retain-on-failure`" no lugar de "entre os que guardam na falha" (`:110-113`), terceira causa do vazio no comentário do `ci.yml`, e o cruzamento com a guarda em `docs/runbook.md`.

Portão: `node tools/processo/portao-local.ts conferir` diz "portão local válido para o código atual (typecheck, lint, test, infra)".

```
VEREDITO: APROVADO
Cenários exigidos: (rodada 6, só o diff) o modo de traço efetivo por projeto é afirmado, e `trace: 'on'` ou `'off'` dentro de `projects[].use` fica vermelho · o `outputDir` efetivo por projeto é afirmado contra o `path` publicado · a lista de projetos não pode esvaziar para a guarda passar por vacuidade · as guardas das rodadas 3, 4 e 5 não regridem · o registro de revisão do documento é verdadeiro contra a própria tabela, e a rodada de `privacy-guardian` que cobre a premissa corrigida existe
Cobertos: todos — tools/ci/esteira.test.ts:137-142 (laço por projeto mais o topo; cinco mutações provadas vermelhas, com o nome do projeto na mensagem), :136 (`projects: []` vermelho), :100-125 (publicação única, `failure() || cancelled()` sem `success()` nem `always()`, `warn`, prazo ≤ 7, ordem depois do `npm run ci:e2e`, `timeout-minutes` do job), :89-96 e :145-150 (lista fechada de ações e nenhum outro job publicando), documento :153-159 e :212-222 (texto e tabela coerentes)
Bloqueantes: nenhum
Recomendações:
- tools/ci/esteira.test.ts:133 — o `import` do `playwright.config.ts` executa `lerAmbienteDeTeste()`/`valorObrigatorio` no carregamento do módulo. Chave faltando em `.env.example` ou `infra/teste.env` deixa esta guarda vermelha por motivo que nada tem a ver com o traço, e a mensagem não vai dizer isso. Uma linha no comentário poupa a próxima investigação.
- tools/ci/esteira.test.ts:40 — a evasão que sobra é afrouxar o próprio `MODOS_QUE_GUARDAM_NA_FALHA` (acrescentar `'on'`). O comentário acima explica por que não, o que é o que dá para fazer em teste; fica o registro de que a minimização depende de alguém ler esse comentário na revisão.
- A rodada 2 do `privacy-guardian` (01:07:43) auditou a guarda que lia só o `use` de topo; a resolução por projeto veio depois dela. Como a mudança só estreita o que pode ser publicado, a aprovação vale a fortiori — mas vale registrar, porque é essa minimização que sustenta publicar artefato em repositório público (regra 20).
- tasks/correcoes/achados-revisoes.md — não existe bloco nenhum de `privacy-guardian` para esta correção (nem da rodada 1, nem da 2), embora a tabela registre as duas. O buraco do hook já foi encaminhado ao /retro nas rodadas 3 e 4; reforço aqui porque justamente o revisor cujo texto sustenta a decisão de regra 20 é o que não deixou rastro consultável.
- TODO.md — as recomendações 3 e 4 do `infra-guardian` continuam sem registro (`grep` só acha a linha 51, de observabilidade, sem relação). A 4 (fixar `workers` na esteira, não subir `observabilidade` no job do e2e, decidir sobre folga no perfil `celular`) é a que explica três vermelhos diferentes e é a que se perde se ficar só no prompt.
```

Arquivos: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/playwright.config.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml`, `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados-revisoes.md`.

## test-engineer · 7ª rodada · APROVADO · 2026-09-21 02:15:33 · `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

Estado confirmado. Nenhum arquivo foi modificado por mim nesta rodada — todos os comandos foram de leitura (`git status`, `git diff`, `stat`, `awk`, `cat`, `git hash-object`).

**A prova de que o conteúdo é o mesmo da rodada 6**, em três linhas independentes:

1. **Nada foi tocado depois do fim da rodada 6 (02:13:11).** O arquivo mais recente da árvore é `tasks/correcoes/achados-revisoes.md` às 02:13:11.839 e o documento da correção às 02:13:11.838 — os dois escritos pelo próprio hook ao registrar a rodada 6, no mesmo instante. Nenhum outro arquivo rastreado tem `mtime` posterior.
2. **Os dois arquivos com `mtime` dentro da janela da rodada 6** são exatamente os dois que a rodada 6 diz ter mutado e restaurado: `.github/workflows/ci.yml` (02:12:09) e `playwright.config.ts` (02:11:52). O segundo é **idêntico ao HEAD** (`git status --porcelain playwright.config.ts` vazio), o que prova a restauração. O primeiro é o único que o hook leu como "mudou", e o diagnóstico do prompt está correto: `mtime` mexido por mutar-e-restaurar, conteúdo intacto.
3. **Todas as 19 âncoras de linha citadas no registro da rodada 6 batem, linha a linha, com o conteúdo atual** — `esteira.test.ts` nas linhas 40, 89, 96, 100, 125, 133, 136, 137, 142, 145, 150, e o documento nas linhas 100, 108, 110, 113, 153, 159, 212, 222. Qualquer inserção ou remoção em qualquer ponto teria deslocado as âncoras seguintes. Não deslocou nenhuma.

Não repeti mutação: a rodada 6 já provou as sete linhas da tabela (incluindo `trace: 'on'` e `outputDir` dentro de `projects[]` do `celular`, que eram o bloqueante da rodada 5) e não há diff a auditar.

```
VEREDITO: APROVADO
Cenários exigidos: (rodada 7, sem diff de código) o estado da árvore é o mesmo que a rodada 6 aprovou — conteúdo de `tools/ci/esteira.test.ts`, `.github/workflows/ci.yml` e `docs/runbook.md` inalterado, `playwright.config.ts` restaurado ao HEAD, nenhum arquivo tocado depois de 02:13:11
Cobertos: todos — `git status --porcelain` lista só os 4 modificados de sempre mais o documento não rastreado; `playwright.config.ts` limpo contra o HEAD; `stat` de todos os arquivos rastreados sem nada posterior ao fim da rodada 6; as 19 âncoras de linha do registro da rodada 6 batendo com o conteúdo atual em tools/ci/esteira.test.ts e no documento da correção
Bloqueantes: nenhum
Recomendações:
- Defeito do hook, para o `/retro`: `tools/processo/revisoes.ts` decide caducidade por `mtime`, e mutar-e-restaurar — que é o trabalho esperado deste revisor — atualiza o `mtime` sem mudar o conteúdo. O revisor invalida a própria rodada ao fazer o que se pede dele. O critério deveria ser hash de conteúdo (`git hash-object` do arquivo contra o gravado no fim da rodada), não `mtime`. Foram duas rodadas gastas por isso nesta correção (a 7, e parte da 6).
- Permanecem, da rodada 6, sem virar bloqueante: o comentário em `tools/ci/esteira.test.ts:133` sobre o `import` do `playwright.config.ts` executar `lerAmbienteDeTeste()` no carregamento (chave faltando em `.env.example` deixa a guarda vermelha por motivo alheio ao traço, sem a mensagem dizer isso); a evasão que sobra em `tools/ci/esteira.test.ts:40`, afrouxar o próprio `MODOS_QUE_GUARDAM_NA_FALHA`, que só a leitura do comentário na revisão segura.
- Permanece a lacuna de rastro: `tasks/correcoes/achados-revisoes.md` não tem bloco nenhum de `privacy-guardian` para esta correção (a tabela do documento registra três rodadas dele; o arquivo tem zero). Justamente o revisor cujo texto sustenta a decisão de regra 20 sobre publicar artefato em repositório público é o que não deixou registro consultável.
- Permanece: as recomendações 3 e 4 do `infra-guardian` continuam sem registro no `TODO.md` (a 4 — fixar `workers` na esteira, não subir `observabilidade` no job do e2e, decidir folga no perfil `celular` — é a que explica três vermelhos diferentes).
```

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml`, `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`, `/home/joaquimdp/Documentos/git/Educa.ia/playwright.config.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados-revisoes.md`.

## infra-guardian · 3ª rodada · APROVADO · 2026-09-21 02:15:47 · `tasks/correcoes/2026-09-20-esteira-descarta-o-traco-do-e2e-que-falhou.md`

VEREDITO: APROVADO
Caminho quente tocado: deploy (esteira; nenhum arquivo de produção no diff)
Rate limit: não se aplica
Fila e prioridade: não se aplica
Concorrência: não se aplica (nenhuma escrita nova)
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (nenhum alerta novo; o artefato tem a seção de runbook que a regra 80, item 10, pede)

Conferência do diff desde a minha rodada 2 (`git diff --stat`: `ci.yml` +17, `docs/runbook.md` +25, `tools/ci/esteira.test.ts` +83, `achados-revisoes.md`; nenhum arquivo de produção tocado). Nenhum arquivo modificado por mim.

1. **Resolução por projeto (bloqueante do `test-engineer`, rodada 5) — fechada.** `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/esteira.test.ts:132-141` itera `[...projetos, {}]` e resolve `projeto.use?.trace ?? topo.use?.trace` e `projeto.outputDir ?? topo.outputDir ?? 'test-results'`. Como `projects[].use` vence o topo no Playwright, `trace: 'on'` ou `outputDir` dentro do `celular` agora caem em `MODOS_QUE_GUARDAM_NA_FALHA` / na comparação de `path` e ficam vermelhos. `expect(projetos.length).toBeGreaterThan(0)` impede que a evasão volte por lista vazia. `devices['Desktop Chrome']` espalhado no `chromebook` não traz `trace`, então o `??` resolve para o topo, como deve. `npx vitest run tools/ci/esteira.test.ts`: 9 de 9 verdes, 284 ms.
2. **Recomendação 1 da rodada 2 — aplicada.** `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml:93-95` agora lista as três causas do vazio, incluindo "o compose que não subiu", alinhado com o documento e com `docs/runbook.md`.
3. **Recomendação 3 (logs de serviço no artefato) — respondida por decisão, não por adiamento solto.** `docs/runbook.md` fixa que o artefato é público e que **nada além da saída do Playwright** pode ser escrito em `test-results/`, o que faz um despejo futuro de log exigir decisão nova com o `privacy-guardian`. É a resposta certa para repositório público: log de serviço não tem a garantia de sinteticidade que o traço tem por construção.
4. **Cronologia corrigida.** O documento (seção "Sobre o conteúdo") agora bate com a tabela de revisões: `privacy-guardian` rodada 1 às 00:33:34 sobre a premissa "privado" (falsa), `infra-guardian` às 00:34:40 apontando, premissa corrigida, e a rodada 2 do `privacy-guardian` (01:04:19–01:07:43) como a que vale. Sem afirmação falsa restante que eu consiga cruzar.
5. **Sem nova superfície na esteira.** A ação continua oficial e fixada por SHA de 40 caracteres, a lista permitida segue fechada (`esteira.test.ts:89-95`), `permissions: contents: read` no topo sem `permissions` de job, sem `secrets.*` e `persist-credentials: false`. O passo continua depois de `npm run ci:e2e`, e a guarda afirma a ordem. Verifiquei que o `import('../../playwright.config.ts')` novo não cria dependência de runtime no job `verificar`: `lerAmbienteDeTeste` (`tools/ci/compose.ts:63`) lê só `.env.example` e `infra/teste.env`, ambos versionados — nada de docker nem de variável do runner.

Bloqueantes: nenhum.

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md` — "nada além da saída do Playwright deve ser escrito em `test-results/`" é hoje só prosa. Uma asserção que confira que nenhum passo do job do e2e escreve nesse diretório antes da publicação tornaria a regra executável; não bloqueia, porque o único escritor atual é o Playwright.
2. Mantida da rodada 2: `expect(publicacao?.if).not.toContain('success()')` recusa também `if: !success()`, que seria uma forma válida. Forma canônica única é defensável e está no comentário.
3. Mantida: a conferência final é a esteira. A primeira falha de e2e depois deste commit tem de trazer `traco-do-e2e`; execução verde não pode trazer nada. Artefato vazio com `warn` aponta primeiro para compose que não subiu, já que o elo com o `playwright.config.ts` está guardado em teste.
4. Encaminhamento confirmado e inalterado: recomendações 3 e 4 da rodada 1 (logs dos serviços; fixar `workers`, não subir `observabilidade` no job do e2e, decidir entre folga no perfil `celular` ou retentativa com flake registrado) para o `TODO.md` em commit separado e para o `/retro` do F1. A 4 continua sendo o achado mais valioso da sessão: é o que explica três vermelhos diferentes.

## test-engineer · 1ª rodada · APROVADO · 2026-09-21 09:36:49 · `tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md`

Auditei o diff de três linhas em `/home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/redis-fora.int.test.ts` e o documento `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md`. Não editei nada; as conferências foram leitura, `git diff` e `git stash show -p` (nenhum deles toca a árvore). Não rodei o teste de integração: ele para, pausa e religa o `redis-fila`, e rodá-lo em paralelo sabotaria o portão local em andamento.

**1. A correção mantém o que o caso prova?** Mantém, integralmente. O diff é puramente aditivo e não toca nenhuma asserção: `:94` (`{ aguardando: 50 }` com o Redis fora), `:95` (nenhuma `rodada_falhou`), `:87-91` (aviso só com ids — a chave por chave, que é a asserção de privacidade), `:102` (`concluido === 50` depois da volta) e `:105-106` (cada job exatamente uma vez) continuam iguais. `aguardarSaudavel` só executa `docker compose ps` (`tools/testes/compose.ts:68-82`): não fala com o despachante, com o worker nem com o `job_registro`, então não há como ela fazer o caso passar vazio. Apague a recuperação do despachante e o `:102` continua vermelho. O healthcheck do `redis-fila` é `redis-cli ping` com `interval: 2s` (`infra/compose.yml`), ou seja, `healthy` é um proxy apertado de "o Redis responde" — a fronteira está no lugar certo, e custa no máximo ~2 s de tempo morto fora do orçamento. E, no stop/start, o Docker reinicia a saúde em `starting`, então não há risco de a espera voltar na hora com um `healthy` velho (o caso do `pause`, que o `afterEach` já trata em `:50-51`).

**2. Os 60 s são defensáveis?** São, e o argumento do documento é o certo — mas por uma razão mais forte do que a que ele dá. No caso de 20/09 o aperto de 30 s → 20 s tinha base: a recuperação medida era de 6 ms a 1,4 s, e a garantia do `clientes.ts` ("o Redis que volta é usado de novo em segundos") é uma garantia de *tempo*, que 30 s esconderiam. Aqui o que o caso prova, pelo próprio título, é *correção* — "ao religar cada job executa uma vez" —, não latência: o orçamento largo não esconde a regra que o teste existe para pegar. E o trabalho depois do `healthy` é de outra ordem de grandeza: reconexão do ioredis (recuo de até 2 s), sondagem do despachante a cada 500 ms (`apps/despachante/src/despachante.ts:24`), tomada de vaga por escola, publicação de 50 jobs e execução com concorrência 10 gravando no Postgres. Apertar isso de cabeça seria exatamente o palpite que a correção anterior evitou. Fica como recomendação medir uma vez (a estimativa analítica é de poucos segundos, o que sugere que 20-30 s caberiam) e registrar o número, para o aprendizado da classe ficar completo: a metade "orçamento não compartilhado" foi aplicada, a metade "orçamento dimensionado por medição" ficou pendente.

**3. "O lint reprova sem a linha" basta como vermelho-antes?** Basta, nesta ordem e com esta redação, por três motivos. A guarda existe e eu a li no stash `retro-do-f1` (`tools/guardas/regras-teste.mjs` e `tools/guardas/__fixtures__/esperar-servico.ts`): ela acusa `composeAssincronoOuFalha('start', …)` sem `aguardarSaudavel` nas instruções seguintes do mesmo bloco, e com a linha nova o `:97` passa a estar coberto pelo `:100` dentro do mesmo `try` — a evidência declarada é consistente com o código que vi. A ordem inversa não era possível: registrar a guarda antes da correção deixaria o `main` com lint vermelho, e o documento diz isso em letras (`:36`, `:38-39`), sem fingir que a prova está neste commit. E a causa não está em dúvida: é a mesma semântica do `start`, provada com medição no documento irmão, e verifiquei que `redis-fora.int.test.ts:97` era mesmo a última ocorrência do repositório — todos os outros pontos que sobem serviço (`reconciliacao:323,415`, `execucao:342`, `sistema:368`, `mfa:681`, `login-email:411`, `ataque-de-senha:538`, `limite:163`, `saude:15`) já pareiam com `aguardarSaudavel`, e `alertas.int.test.ts:87` usa `--wait`. O que eu exigiria se a causa fosse nova — a reprodução determinística por adiamento do `start`, como em 20/09 — aqui seria cerimônia sobre um mecanismo já provado.

```
VEREDITO: APROVADO

Cenários exigidos (o que a correção não pode perder, mais o que ela precisa passar a garantir):
- com o Redis fora, 50 POSTs em 202 e nada reservado, publicado ou executado
- o aviso de vaga indisponível sai só com ids (privacidade no log, regra 20 item 9)
- o laço do despachante não cai por exceção com a dependência fora
- com o Redis de volta, a rodada seguinte despacha e os 50 jobs concluem
- job executado uma única vez depois da religação (execução em duplicata, regra 80 item 7)
- quando o container não sobe, a falha diz o que houve, em vez de AssertionError mudo
- a classe do defeito (orçamento compartilhado com a subida do container) não volta

Cobertos:
- redis-fora.int.test.ts:81-84 (202 em menos de 1 s cada), :87-91 (chaves do aviso), :94 ({ aguardando: 50 }),
  :95 (nenhuma rodada_falhou), :102 (concluido === 50), :105-106 (exatamente uma execução por job) — todos
  intactos, o diff não toca asserção nenhuma
- :100 `aguardarSaudavel('redis-fila')` — teto próprio de 60 s e erro com estado e as últimas 40 linhas do
  log do serviço (tools/testes/compose.ts:76-81), no lugar do vermelho ilegível
- a classe: `guardas/esperar-servico-do-compose` (tools/guardas/regras-teste.mjs + fixture
  __fixtures__/esperar-servico.ts), hoje no stash `retro-do-f1`, entra no commit seguinte — ordem
  necessária, porque a guarda com a violação de pé deixaria o main vermelho

Bloqueantes: nenhum.

Recomendações:
1. tasks/correcoes/2026-09-21-...md:44-45 — medir uma vez a recuperação depois do `healthy` (instrumentação
   temporária, como em 20/09) e registrar o número no documento ou no TODO. Pelos parâmetros
   (sondagem de 500 ms, recuo do ioredis de até 2 s, 50 jobs com concorrência 10) a recuperação deve ficar
   em poucos segundos, e 60 s sobreviveriam a uma regressão grande. Não bloqueia: o que este caso prova é
   exatamente-uma-vez, não latência.
2. redis-fora.int.test.ts:100 vs :110 — o pior caso agora soma `aguardarSaudavel` (60 s) + poll (60 s) +
   laço dos 50 POSTs (teto de 1 s cada) + poll de :88 (10 s) + 1,5 s, e encosta nos 180 s do caso. Se
   encostar, a falha volta a ser "test timed out in 180000ms", justo o que a correção existe para evitar.
   `aguardarSaudavel` aceita `limiteMs`: um teto menor aqui (ou um timeout de caso maior) fecha a brecha.
3. Para o commit da retrospectiva, não para este: `CHAMADAS_DE_COMPOSE` em tools/guardas/regras-teste.mjs
   lista `compose`, `composeOuFalha` e `composeAssincronoOuFalha`, e deixa de fora `composeAssincrono` e
   `composeAssincronoCom`. Hoje nenhum deles sobe serviço sem `--wait` (o único uso é alertas.int.test.ts:87),
   então não há violação escondida — mas é um furo para a próxima vez.
4. tasks/correcoes/2026-09-21-...md:49-51 — dizer na própria seção de evidência que esses dois resultados
   foram obtidos com a guarda aplicada por cima (stash `retro-do-f1`) e que, neste commit, `npm run lint`
   passa com e sem a linha. O documento já explica a ordem em :36 e :38-39; faltou amarrar isso à tabela de
   evidência, que é o que alguém vai tentar reproduzir daqui a seis meses.
```

## test-engineer · 2ª rodada · APROVADO · 2026-09-21 10:02:06 · `tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md`

Auditei o diff da rodada 2 (apenas `apps/despachante/test/redis-fora.int.test.ts`, mais o documento), a guarda no stash `retro-do-f1` e o healthcheck do `redis-fila`. Não editei nada; só leitura, `git diff` e `git stash show -p`.

**Recomendação 2 (a de risco real) — aplicada e correta.** `aguardarSaudavel('redis-fila', 30_000)` em `apps/despachante/test/redis-fora.int.test.ts:102`, com o comentário `:98-101` dizendo as duas coisas certas: por que a subida fica fora do orçamento e por que o teto é menor que o padrão. A aritmética fecha: pior caso agora ≈ 50 s (laço dos 50 POSTs, com teto de 1 s por POST asseverado em `:81`) + 10 s (`:88`) + 1,5 s (`:93`) + 30 s (espera) + 60 s (poll) ≈ 151,5 s, mais a montagem — dentro dos 180 s do `it`, ao contrário dos ~181,5 s da rodada 1. E o teto é folgado para o que precisa cobrir: o healthcheck é `redis-cli ping` com `interval: 2s`, `timeout: 3s`, sem `start_period` (`infra/compose.yml:42-46`), então `healthy` depois de um `start` chega em poucos segundos; 30 s é ordem de grandeza acima. Quando não chegar, a falha é a mensagem de `tools/testes/compose.ts:79` com estado e 40 linhas de log, não "test timed out".

**A linha continua satisfazendo a guarda.** Conferi na regra em stash: `esperaAlgumServico` procura `aguardarSaudavel(` nas instruções seguintes do mesmo bloco e casa pelo nome do serviço no texto; `aguardarSaudavel('redis-fila', 30_000)` contém `'redis-fila'`, então o `:97` segue coberto. O segundo argumento não muda nada para a guarda — a evidência de lint da rodada 1 continua valendo para este código.

**Recomendação 4 — aplicada.** A seção "Evidência" (`:58-61`) agora diz que os dois resultados vieram da guarda aplicada por cima, que **neste commit o lint passa com e sem a linha**, e por que a ordem é esta. E a seção "Correção" (`:46-54`) separa os dois orçamentos com o argumento certo: aqui o caso prova exatamente-uma-vez, não latência.

**Nenhuma asserção mudou.** O diff é aditivo: `:94` (`{ aguardando: 50 }`), `:95` (nenhuma `rodada_falhou`), `:87-91` (aviso só com ids), `:104` (`concluido === 50`) e `:107-108` (uma execução por job) estão intactos. `aguardarSaudavel` só roda `docker compose ps`, não fala com despachante, worker nem `job_registro` — não há como ela fazer o caso passar vazio.

As duas não aplicadas (1 e 3) eram recomendações, e o encaminhamento declarado é o correto: a 3 pertence mesmo ao commit onde a guarda vive.

```
VEREDITO: APROVADO
Cenários exigidos: os mesmos da rodada 1, mais as duas correções exigidas por recomendação —
  (a) teto de espera que não encoste nos 180 s do `it`, e (b) evidência de lint que diga em que árvore
  cada resultado foi obtido.
Cobertos: apps/despachante/test/redis-fora.int.test.ts:102 (teto de 30 s) com a justificativa em
  :98-101; documento :46-54 (por que o poll fica em 60 s aqui e caiu para 20 s em 20/09) e :58-61
  (evidência amarrada ao stash, e lint verde com e sem a linha neste commit). Asserções do caso
  inalteradas: :81-84, :87-91, :94, :95, :104, :107-108.
Bloqueantes: nenhum.
Recomendações:
1. Mantida da rodada 1, e o encaminhamento ao TODO.md está aceito: medir uma vez a recuperação depois
   do `healthy` e registrar o número. Com ele, o poll de 60 s em :104 passa a ser dimensionado, não
   herdado.
2. Mantida da rodada 1, para o commit da retrospectiva: `CHAMADAS_DE_COMPOSE` não cobre
   `composeAssincrono` nem `composeAssincronoCom`. Sem violação hoje; furo para a próxima.
3. Nova, não bloqueia: o maior termo do pior caso agora é o laço dos 50 POSTs (até 50 s pelo teto de
   :81), não a espera. Se um dia este `it` voltar a encostar nos 180 s, é ali que a folga está, não em
   :102.
4. apps/despachante/test/redis-fora.int.test.ts:51 — o `aguardarSaudavel` do `afterEach` segue no padrão
   de 60 s dentro de um hook de 120 s. Está certo assim (ali o prazo não é compartilhado com medição
   nenhuma); registro só para que a diferença entre as duas chamadas não pareça descuido depois.
```

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/redis-fora.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/testes/compose.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/compose.yml`.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-21 10:03:47 · `tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md`

VEREDITO: APROVADO
Caminho quente tocado: fila (teste de resiliência do despachante contra o Redis de fila; nenhuma linha de produção no diff)
Rate limit: ok (não tocado)
Fila e prioridade: ok
Concorrência: protegida — `apps/despachante/test/redis-fora.int.test.ts:106-108` continua provando execução única por job depois da religação, e `:94`/`:95` continuam provando que nada é reservado nem publicado com o Redis fora. `aguardarSaudavel` só executa `docker compose ps` (`/home/joaquimdp/Documentos/git/Educa.ia/tools/testes/compose.ts:68-80`): não fala com despachante, worker nem `job_registro`, logo não há como ela fazer o caso passar vazio. Removida a recuperação do despachante, o poll de `:104` segue vermelho.
Índice e paginação: ok (não tocado)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não tocado)

Respondendo às três perguntas do prompt:

1. **Continua provando a resiliência da regra 80?** Sim. O diff é puramente aditivo, não toca asserção nenhuma, e a fronteira está no lugar certo: o healthcheck do `redis-fila` é `redis-cli ping` com `interval: 2s` (`/home/joaquimdp/Documentos/git/Educa.ia/infra/compose.yml:42-46`), ou seja, `healthy` é um proxy apertado de "o Redis responde", e o que fica dentro do poll é só o produto (reconexão do ioredis, sondagem de 500 ms, tomada de vaga, publicação e execução dos 50 jobs). Confirmei também que `:97` era a última ocorrência do repositório: os outros nove pontos que sobem serviço já pareiam com `aguardarSaudavel`.

2. **O teto de 30 s é o certo?** A aritmética do `test-engineer` procede (com 60 s o pior caso soma 60 + 60 + 10 + 1,5 + o laço dos 50 POSTs com teto de 1 s cada e a subida da API, e encosta nos 180 s do `it`), e o saldo é favorável: a tolerância total do trecho passa de 60 s para 90 s, e a falha deixa de ser `AssertionError` mudo. Mas o número escolhido contradiz o documento irmão — ver recomendação 1.

3. **Manter o poll em 60 s é defensável?** Sim. O título do caso é "ao religar cada job executa uma vez": o que ele prova é correção, não latência, e um orçamento largo não esconde a regra que ele existe para pegar. Diferente do caso de 20/09, onde a garantia provada era de tempo ("o Redis que volta é usado de novo em segundos") e 30 s a esconderiam.

Bloqueantes: nenhum.

Recomendações:

1. `apps/despachante/test/redis-fora.int.test.ts:102` — o teto de 30 s contradiz a conclusão escrita do documento irmão: `tasks/correcoes/2026-09-20-reconciliacao-espera-o-redis-subir-dentro-do-orcamento.md` afirma "O runner da esteira tem menos núcleos e roda quatro tarefas em paralelo, e nele **a subida sozinha passa dos 30 s**". Se aquela frase estiver certa, esta linha nasce vermelha na esteira. A frase é inferência, não medição (o vermelho da esteira foi o caso inteiro em 36,9 s com poll de 30 s, e cada iteração do poll custava até `TIMEOUT_COMANDO_REDIS_FILA_MS` = 2 s, de `packages/nucleo/src/redis/clientes.ts:35`; a medição local foi `healthy` em 11,2 s sob contenção total). Não bloqueia porque o vermelho resultante seria legível e atribuído (`redis-fila não voltou a healthy em 30000 ms` com estado e 40 linhas de log), mas as duas saídas honestas são: medir a subida no runner uma vez e fixar o teto pelo número, ou subir o timeout do `it` (`:112`) e manter o padrão de 60 s. Escolher entre elas sem medir é o mesmo palpite que a correção diz evitar.

2. A rodada 1 do `test-engineer` (fim 2026-09-21 09:36:49) auditou o código com o padrão de 60 s — o texto dela em `tasks/correcoes/achados-revisoes.md` cita `:100 aguardarSaudavel('redis-fila')` e "teto próprio de 60 s". O arquivo foi editado às 10:00:46, depois dela, justamente para aplicar a recomendação 2 daquela rodada. O número que está na árvore nunca passou por revisor de teste. O hook deve exigir rodada nova; se não exigir, é o defeito de caducidade que a retrospectiva corrige.

3. `TODO.md:118` é exatamente este item e continua aberto; feche-o no commit desta correção, junto com o registro da medição prometida em `tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md:49`.

4. Este é o único teto não padrão entre os 29 usos de `aguardarSaudavel` no repositório, e a razão vive só no comentário. Se a classe voltar, vale expressar o orçamento do caso como constante derivada do timeout do `it`, em vez de dois números soltos que só um comentário liga.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-21 10:05:55 · `tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md`

VEREDITO: APROVADO
Caminho quente tocado: fila (teste de resiliência do despachante contra o Redis de fila; nenhuma linha de produção no diff)
Rate limit: ok (não tocado)
Fila e prioridade: ok
Concorrência: protegida — `/home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/redis-fora.int.test.ts:104-106` continua provando execução única por job depois da religação, e `:94`/`:95` continuam provando que nada é reservado nem publicado com o Redis fora. O diff da rodada 2 segue puramente aditivo em relação às asserções.
Índice e paginação: ok (não tocado)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não tocado)

Conferência das correções exigidas (minha recomendação 1 da rodada 1):

1. **Teto padrão restaurado.** `:100` é `await aguardarSaudavel('redis-fila')`, sem segundo argumento. Confirmei no repositório: são 29 chamadas de `aguardarSaudavel` e **nenhuma** passa `limiteMs` — o padrão de `tools/testes/compose.ts:68` (`limiteMs = 60_000`) vale para todas. O teto não padrão que eu apontei sumiu, e com ele a contradição com o documento irmão e a recomendação 4 da minha rodada 1.
2. **Prazo do caso em 240 s.** `:113`. A aritmética do pior caso fecha com folga: ≤50 s do laço dos 50 POSTs (teto de 1 s por POST asseverado em `:81`) + 10 s (`:88`) + 1,5 s (`:93`) + 60 s (espera) + 60 s (poll `:102`) ≈ 181,5 s, sobrando ~58 s para a montagem do Nest, da sessão e da bancada. A falha, quando vier, é a mensagem de `tools/testes/compose.ts:79` com estado e 40 linhas de log, não "test timed out". Os 240 s cabem no `timeout-minutes: 45` do job de integração (`.github/workflows/ci.yml:54`) e não colidem com nada em `vitest.config.ts` (o `testTimeout: 60_000` do projeto é sobreposto pelo prazo do `it`).
3. **A frase errada foi registrada como inferência.** Documento `:58-62`. É a saída certa: o "passa dos 30 s" não tinha medição atrás, e alargar o prazo do caso não aposta em número de runner nenhum.

A guarda continua satisfeita: ela casa `aguardarSaudavel(` com o nome do serviço no texto, e `'redis-fila'` está lá sem o segundo argumento.

Bloqueantes: nenhum.

Recomendações:

1. `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md:43` — a seção "Correção" ainda abre com `Uma linha: await aguardarSaudavel('redis-fila', 30_000)`, número que não existe mais na árvore. O parágrafo `:51-62` desmente, mas quem ler de cima para baixo vê primeiro o valor errado. Trocar por `aguardarSaudavel('redis-fila')` e deixar o 30 s só na narrativa da tentativa descartada.
2. Documento `:73-74` — "`tools/guardas/guardas.test.ts` 65 de 65" e "Portão local desta correção, verde" foram obtidos na árvore da rodada 1 (com 30 s e `it` de 180 s), que mudou depois. O portão roda de novo agora; vale reescrever essas duas linhas com o resultado desta árvore, senão a evidência aponta para um estado que não existe.
3. Mantida da rodada 1: `TODO.md:118` continua aberto e é exatamente este item. Fechar no commit, como combinado.
4. Mantida da rodada 1: medir uma vez a recuperação depois do `healthy` e registrar o número, para o poll de `:102` passar a ser dimensionado em vez de herdado. Não bloqueia — o que este caso prova é exatamente-uma-vez, não latência.
5. Novo, sem violação hoje: com 240 s, o maior termo do pior caso é o laço dos 50 POSTs (até 50 s pelo teto de `:81`), não a espera. Se este `it` voltar a encostar no prazo um dia, é ali que a folga está.

## test-engineer · 3ª rodada · APROVADO · 2026-09-21 10:06:46 · `tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md`

Audit complete. I verified the diff since round 2 (three lines in the test, plus the document), recomputed the arithmetic myself, and checked the helper's default ceiling, the sibling document's claim, the vitest project config and the CI job caps. I edited nothing — only reads, `git diff` and `git status`.

**A conta, conferida de forma independente.** Termos com teto duro dentro do `it`, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/redis-fora.int.test.ts`:

| Termo | Linha | Teto |
|---|---|---|
| laço dos 50 POSTs, 1 s asseverado por POST | `:81` | 50,0 s |
| poll do aviso de vaga indisponível | `:88` | 10,0 s |
| espera fixa antes de conferir `{ aguardando: 50 }` | `:93` | 1,5 s |
| `aguardarSaudavel('redis-fila')`, teto padrão | `:100` + `tools/testes/compose.ts:68` | 60,0 s |
| poll do `concluido === 50` | `:102` | 60,0 s |
| **soma** | | **181,5 s** |

A conta do prompt está certa, e o ponto que importa é a folga, não a soma: rodada 1 = 181,5 s contra 180 s (negativa, o risco que levantei); rodada 2 = 151,5 s contra 180 s (28,5 s); rodada 3 = 181,5 s contra 240 s (**58,5 s**). Subir a espera em 30 s e o prazo em 60 s deixa saldo de +30 s — a troca **resolve** o risco, não o move. E o pior caso agora falha legivelmente antes do prazo: se o container não subir, a espera estoura aos 60 s com ~121,5 s consumidos, e o vermelho é a mensagem de `tools/testes/compose.ts:79` (estado + 40 linhas de log), não "test timed out".

O único termo não modelado é a montagem (`BancadaDeFila`, boot do Nest, `escolaComSessao`, `compose stop` — cujo pior caso prático é a carência de 10 s do Docker — e o `app.close()` do `finally`, que conta). Ela cabe nos 58,5 s com margem larga; na rodada 2 cabia em 28,5 s e ninguém reclamou, porque a espera típica é 6,5–11,2 s, não 60. Contra o cap do job (`.github/workflows/ci.yml:37`, 20 min para uma suíte de ~5 min), +60 s de pior caso é irrelevante.

O ponto 3 confere: `tasks/correcoes/2026-09-20-reconciliacao-espera-o-redis-subir-dentro-do-orcamento.md:44-50` traz a tabela medida (11.180 ms sob contenção total) e, logo depois, a frase "no runner da esteira a subida sozinha passa dos 30 s" sem número que a sustente — é inferência mesmo, e o novo documento a registra como tal em vez de silenciar.

```
VEREDITO: APROVADO

Cenários exigidos (rodada 3, só o que o diff afeta):
- a aritmética do pior caso cabe no prazo do caso, com folga demonstrável
- a falha do container continua legível (mensagem do serviço, não "test timed out")
- nenhuma asserção do caso muda com a troca do teto
- o teto de espera não nasce vermelho num runner mais lento que esta máquina
- o registro diz o que foi medido e o que foi inferido

Cobertos:
- 181,5 s de termos com teto duro contra 240 s (:113): folga de 58,5 s, contra 28,5 s na rodada 2
  e -1,5 s na rodada 1. Conferido termo a termo (:81, :88, :93, :100, :102)
- :100 volta ao teto padrão de 60 s (tools/testes/compose.ts:68), igual aos outros 28 usos; a
  falha sai por tools/testes/compose.ts:79 com estado e 40 linhas de log
- diff puramente aditivo/numérico: :94, :95, :87-91, :102, :105-106 intactos. `aguardarSaudavel`
  só roda `docker compose ps` — não fala com despachante, worker nem `job_registro`, e não há
  como fazer o caso passar vazio. Apague a recuperação do despachante e :102 continua vermelho
- a contradição com o documento irmão desaparece: o teto de 60 s não depende de nenhuma
  estimativa do runner, medida ou inferida
- 2026-09-21-...md:58-62 registra a inferência como inferência, com os números medidos (11,2 s
  sob contenção, ~6,5 s na esteira, execução 35517746419)

Bloqueantes: nenhum.

Recomendações:
1. tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md:43-44 — a abertura da seção
   "Correção" ainda diz que o conserto é `await aguardarSaudavel('redis-fila', 30_000)`, que é
   exatamente a forma revertida oito linhas abaixo (:51-62) e não é o que está no código (:100).
   Corrigir antes do commit: é a mesma falha que esta rodada existe para consertar — um número
   errado parado num documento que alguém vai ler daqui a seis meses e citar como fato.
2. :110-112 — o comentário justifica o 240 s, mas não mostra a conta. Uma linha com a soma
   (50 + 10 + 1,5 + 60 + 60 = 181,5 s, mais a montagem) poupa a próxima pessoa de refazê-la, e é
   o que impede o número de ser apertado de novo por palpite.
3. Mantida da rodada 1 (recomendação 1): medir uma vez a recuperação depois do `healthy` e
   registrar o número. O que este caso prova é exatamente-uma-vez, não latência, então 60 s de
   poll não escondem a regra — mas a metade "orçamento dimensionado por medição" do aprendizado
   segue pendente, e está no TODO (:49).
4. Mantida da rodada 1 (recomendação 3), para o commit da retrospectiva, não para este:
   `CHAMADAS_DE_COMPOSE` em tools/guardas/regras-teste.mjs deixa `composeAssincrono` e
   `composeAssincronoCom` de fora. Hoje não há violação escondida; é furo para a próxima vez.
```

## test-engineer · 1ª rodada · REPROVADO · 2026-09-21 16:28:14 · `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

Auditoria concluída. Verifiquei por leitura, por execução dos scripts reais com `docker`/`npm` imitados (fora da árvore, em `/tmp`) e por mutação da função em cópia fora da árvore. Nenhum arquivo do repositório foi tocado.

```
VEREDITO: REPROVADO

Cenários exigidos (caminho de falha da esteira — não é domínio escolar, então a lista de borda
aplicável é a da regra 80/40 sobre esteira e evidência):
  C1 execução verde não despeja log (ruído)
  C2 execução vermelha despeja com carimbo uniforme e alcance suficiente
  C3 o despejo acontece ANTES do `down --volumes --remove-orphans`, senão não sobra evidência
  C4 `--manter-ambiente` com falha: despeja e não derruba
  C5 os dois scripts reais (`ci:e2e` e `ci:infra`/`ci:integracao`) emitem o despejo carimbado
  C6 todo passo de encerramento fala com o projeto compose de teste, nunca com o de desenvolvimento

Cobertos:
  C1 — tools/ci/compose.test.ts:24
  C2 — tools/ci/compose.test.ts:13 (no nível da função; falha de verdade se `--timestamps` sair ou
       o tail cair para 200 — conferido)
  C4 — parcialmente: tools/ci/compose.test.ts:28 (parâmetro) e tools/ci/scripts.test.ts:134 (script
       real, só a ausência do `down`)
  C6 — tools/ci/compose.test.ts:35 e tools/ci/scripts.test.ts:140

Bloqueantes:

1. tools/ci/compose.test.ts:8-11 — a ordem dos passos não é afirmada em lugar nenhum, e ela é a
   regra. `argumentosDe` filtra por nome e descarta a posição, então trocar a ordem em
   tools/ci/compose.ts:47-50 (derrubar antes de despejar) deixa os 4 casos verdes. Conferido por
   mutação em cópia fora da árvore: com `down --volumes --remove-orphans` antes do `logs`, o
   resultado é `4 passed`. Nesse mundo o despejo imprime nada — os contêineres já foram removidos —
   e a correção inteira vira letra morta sem nenhum vermelho. É justamente a hipótese que o
   documento refuta em suas linhas 32-33 ("o `down` roda depois do despejo"): afirmação de
   comportamento sem teste que a sustente.
   Correção exigida: afirmar a sequência, não só a presença. Ex.:
   `expect(etapasDeEncerramento(1).map((e) => e.nome)).toEqual(['logs dos serviços', 'derrubar o ambiente'])`
   e o par com `derrubar = false`.

2. tools/ci/e2e.ts:22 e tools/ci/compose.ts:63 — a linha que esta correção mudou não tem teste
   nenhum. `compose.test.ts` prova a função; nada prova que os scripts a usam. Reverter
   tools/ci/e2e.ts para o array embutido de antes (sem `--timestamps`, `--tail 200`) mantém a suíte
   inteira verde — e é exatamente a duplicação que existia até este diff, ou seja, a regressão é a
   mais provável de todas. O arreio para provar isso já existe e já roda os dois scripts reais com
   `docker` imitado: tools/ci/scripts.test.ts:24-56, cujos casos vermelhos (:85-94, :110-119,
   :134-138) afirmam a ordem de `up`/teste/`down` e nunca olham a chamada `logs` (grep por
   `logs|timestamps|tail` em scripts.test.ts não devolve nada).
   Correção exigida: nos casos vermelhos já existentes de `scripts.test.ts`, afirmar que aparece uma
   chamada `docker compose ... logs` com `--timestamps` e tail ≥ 2000, e que o índice dela é menor
   que o de ` down `. Cobre C3 e C5 nos dois scripts de uma vez. (Conferi na mão que hoje o
   comportamento está certo — `e2e.ts` e `infra.ts` emitem
   `docker compose … logs --no-color --timestamps --tail 2000` e só depois o `down`, inclusive com
   `--manter-ambiente`, que despeja e não derruba. O que falta é o teste que segura isso.)

Recomendações:
- Prova do que o carimbo serve, com a infraestrutura que já existe: um caso em
  tools/ci/compose.int.test.ts (projeto `integracao`, compose já de pé) que roda
  `logs --no-color --timestamps --tail N` em dois serviços e afirma que toda linha começa por
  carimbo RFC3339 e que as linhas dos dois serviços ordenam numa linha do tempo só. Hoje a asserção
  é de forma (a string está no argv); essa seria a do resultado (o despejo é cruzável), e de quebra
  prova que a combinação de flags é aceita pela versão de compose instalada — se não fosse, o passo
  sairia não-zero no pior momento e `executar.ts:36-39` engoliria o código em silêncio numa execução
  já vermelha.
- `--tail 2000` está defensável como direção, não como número: o argumento dos 16 min é raciocínio,
  não medição — a mesma espécie de raciocínio que produziu o 200. Uma linha de evidência no
  documento com linhas/min do serviço mais falante numa execução de infra (a borda não conta: 
  infra/test/borda.int.test.ts:554 prova que ela não loga acesso HTTP) fecharia o ponto. Registrar
  também o teto: 19 serviços × 2000 = até 38 mil linhas no log público do job.
- Mesmo sintoma, fora do escopo desta correção: infra/scripts/carga.ts:304 e
  infra/scripts/carga-login.ts:444 ainda despejam `logs --no-color --tail 100` sem `--timestamps`.
  O padrão certo já existia em tools/testes/compose.ts:78 — vale uma linha no TODO.
- Para o `infra-guardian`, não para mim: subir de 200 para 2000 linhas por contêiner multiplica por
  dez o que vai parar no log público do job. Só é aceitável porque o dado da esteira é sintético
  (regra 20, itens 12 e 17) e o lint guarda o log das APIs; vale dizer isso no documento, que hoje
  só trata da comparação com o artefato.
- O documento diz "como o quarto caso do teste afirma" (linha 86) sobre `--manter-ambiente`; é o
  terceiro caso (compose.test.ts:28), e ele afirma o parâmetro da função, não o script.
```

Sobre os três pontos que você pediu para julgar:

1. **Forma ou resultado?** A asserção sobre o argv é legítima — o argv é o único observável da função, e ela falha de verdade se `--timestamps` sair ou o tail voltar a 200 (o documento registra isso, e confirmei). Não é decoração. Mas ela para onde o risco real começa: as duas mutações que a atravessam verdes são a inversão de ordem e o desvio do call site. As duas têm conserto barato com arreio que já existe (`scripts.test.ts`), sem inventar infraestrutura nenhuma. A versão forte "de verdade" — carimbo RFC3339 em toda linha e duas fontes numa linha do tempo só — cabe em `compose.int.test.ts`, que já roda com o compose de pé.

[… 7 linhas cortadas]

## test-engineer · 2ª rodada · APROVADO · 2026-09-21 17:26:58 · `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

Auditei por leitura e por mutação independente, em cópia em `/tmp` (removida ao fim). Nenhum arquivo da árvore foi tocado — `git status` no fim é idêntico ao do começo.

```
VEREDITO: APROVADO

Cenários exigidos (caminho de falha da esteira; a lista de borda aplicável é a da regra 80/40
sobre esteira e evidência, não a do domínio escolar):
  C1 execução verde não despeja log
  C2 execução vermelha despeja com carimbo uniforme e alcance medido
  C3 o despejo acontece ANTES do `down --volumes --remove-orphans`
  C4 `--manter-ambiente` com falha: despeja e não derruba
  C5 os três scripts reais (`ci:integracao`, `ci:infra`, `ci:e2e`) emitem o despejo carimbado
  C6 todo passo de encerramento fala com o projeto compose de teste

Cobertos:
  C1 — tools/ci/compose.test.ts:26 e tools/ci/scripts.test.ts:115,142
  C2 — tools/ci/compose.test.ts:13 (função) + tools/ci/scripts.test.ts:68-78 (scripts reais)
  C3 — tools/ci/compose.test.ts:30 (ordem do array) + tools/ci/scripts.test.ts:77 (ordem em
       execução real), e a ordem do array vale em runtime: tools/ci/executar.ts:36 roda a
       finalização em sequência — provei mutando ele, não só lendo (3 vermelhos)
  C4 — tools/ci/compose.test.ts:34,42 e tools/ci/scripts.test.ts:158-164
  C5 — tools/ci/scripts.test.ts:112,141,163, nos três scripts
  C6 — tools/ci/compose.test.ts:46 (função)

Bloqueantes: nenhum. Os dois da rodada 1 estão fechados, e fechados de verdade, não na forma:

  B1 (ordem) — tools/ci/compose.test.ts:30-37 afirma a sequência nos quatro mundos. Conferido:
     inverter em tools/ci/compose.ts:50-55 dá 4 vermelhos (não 1 — ver R2). E fui além do que
     você mutou: inverti a finalização em tools/ci/executar.ts:36, que é onde a ordem do array
     vira ordem de execução — 3 vermelhos em scripts.test.ts. A asserção de array não é
     decorativa; tem uma asserção de runtime atrás dela.
  B2 (call site) — `afirmarDespejoCarimbado` prende os scripts à função. Conferido nos dois call
     sites, não só no seu: desviar tools/ci/e2e.ts:22 dá 2 vermelhos, e desviar
     tools/ci/compose.ts:67 (`executarTestesComInfra`, que você não mutou) dá 2. Também mutei o
     default `derrubar = true` → `false` (4 vermelhos) e "some o despejo quando `--manter-ambiente`"
     (2 vermelhos).

Recomendações:
```

**R1 — as três mutações que sobreviveram, e as três morrem com uma mudança só.** Rodei sete mutações além das suas; três passaram com **19 verdes**:

- `ETAPA_DO_LOG_DA_FALHA` com `--tail` duplicado — `['logs','--no-color','--timestamps','--tail','4000','--tail','200']`. O Docker usa o **último**; os dois testes usam `indexOf`, que pega o primeiro. Efeito real: tail 200, suíte verde;
- despejo restrito a serviços — `[...,'--tail','4000','postgres','redis-fila']`. Somem os 12 serviços nossos, que são a justificativa inteira do 4.000, e nenhum teste percebe. É o edit plausível de quem for "otimizar" as 24,5 mil linhas;
- call site desviado **com as flags certas mas sem `--project-name educa-teste`**: o despejo passa a falar com o compose de desenvolvimento. `scripts.test.ts:166` só olha a execução **verde**, e o despejo só existe na vermelha — é a única chamada de compose que o guarda de projeto nunca vê.

Conserto único: afirmar o argv **inteiro**, não a presença. Em `compose.test.ts`, `expect(etapasDeEncerramento(1)[0]?.argumentos).toEqual([...ARGUMENTOS_COMPOSE, ...ETAPA_DO_LOG_DA_FALHA])`; e em `afirmarDespejoCarimbado` exigir que a linha comece por `docker compose --project-name educa-teste ...`. Não bloqueia porque a regra desta correção (carimbo, profundidade, ordem, call site) tem teste que a prova; o que falta é largura de asserção.

**R2 — a tabela não bate, e é achado.** `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md:127` diz que a ordem invertida dá **"❌ 1 caso, `compose.test.ts:31`"**. Medi: dá **4** — `compose.test.ts:30` mais os três casos de `scripts.test.ts` (`integracao.ts`, `infra.ts`, `ci:e2e`), porque `afirmarDespejoCarimbado` também checa o índice do ` down `. Parece medição feita no estado da rodada 1, antes do helper existir, misturada na mesma tabela com as outras. As outras quatro linhas batem exatamente (5, 5, 2, 19 verdes). Corrija o número e a citação (`:31` é `:30`) — a tabela é a evidência do documento, e ela está subestimando a própria proteção.

**R3 — o piso `>= 4_000` envelhece, mas para o lado certo.** Ele nunca fica falso-vermelho: só deixa de significar o que promete se os serviços ficarem mais falantes, e aí segue verde dizendo "alcança a execução inteira" sem alcançar. Não dá para consertar isso sem infraestrutura nova, e não vale inventar. O que dá, e eu faria: tirar o `4_000` duplicado de `compose.test.ts:23` e `scripts.test.ts:75` para um lugar só, com a **data e a fonte da medição na constante** (`// 21/09/2026, test:infra: api-2, 3.899 linhas`). Não importe esse piso de `compose.ts`: se o teste ler o número do código sob teste, baixar a régua passa a deixar tudo verde, e o piso deixa de ser independente.

**R4 — `/ logs /` erra para vermelho em tudo que consegui construir, menos em um caso.** Falta de `--tail` vira `NaN >= 4_000` (vermelho); token no fim da linha não casa e o `toBeGreaterThanOrEqual(0)` reprova; falso positivo numa execução verde derruba o `expect(...some(/ logs /)).toBe(false)`. Conferi o conjunto real de chamadas dos três scripts: hoje nenhuma outra linha contém ` logs `. O buraco é de direção verde e é o mesmo da R1: o docstring em `scripts.test.ts:62-67` promete afirmar "existe chamada `docker compose ... logs`", mas a regex não olha `docker`, nem `compose`, nem o projeto. `/^docker compose .* logs /` fecha.

**R5 — segue aberta da rodada 1, e é a única asserção de *resultado* que falta.** Um caso em `tools/ci/compose.int.test.ts` que rode `logs --no-color --timestamps --tail N` em dois serviços e afirme carimbo RFC3339 em toda linha e as duas fontes numa linha do tempo só. Hoje tudo é asserção sobre argv. A medição manual do documento (linhas 110-111) cobre metade do ponto; a outra metade continua sem rede: se uma versão futura do compose recusar a flag, `tools/ci/executar.ts:36-39` preserva o vermelho original e o despejo falha **em silêncio**, exatamente na execução em que ele é a única evidência.

Sem achados nos demais itens do meu roteiro: nenhum `.skip`, nenhum teste comentado, nenhum `any`, nenhum mock escondendo a regra (o `docker` imitado registra e devolve, não substitui a decisão), nada de provedor pago. O carimbo do portão em `/home/joaquimdp/Documentos/git/Educa.ia/.processo/portao.json` confere com o início declarado e lista `typecheck, lint, test, infra`. A recomendação da rodada 1 sobre `infra/scripts/carga.ts:304` e `carga-login.ts:444` entrou no `TODO.md`, e a correção do "terceiro caso" no texto também.

## test-engineer · 3ª rodada · REPROVADO · 2026-09-21 18:06:38 · `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

Auditei o diff desde a minha rodada 2 por leitura e por mutação independente, em cópia em `/tmp` (já removida). Nenhum arquivo da árvore foi tocado: `git status` no fim é idêntico ao do começo.

```
VEREDITO: REPROVADO

Cenários exigidos (os mesmos C1–C6 da rodada 2, mais o C7 que a R5 pedia):
  C1 execução verde não despeja log
  C2 execução vermelha despeja com carimbo uniforme e alcance medido
  C3 o despejo acontece ANTES do `down --volumes --remove-orphans`
  C4 `--manter-ambiente` com falha: despeja e não derruba
  C5 os três scripts reais emitem o despejo carimbado
  C6 todo passo de encerramento fala com o projeto compose de teste
  C7 asserção de RESULTADO: o despejo sai cruzável (carimbo do Docker em toda linha,
     serviços comparáveis entre si)

Cobertos:
  C1 — tools/ci/compose.test.ts:33 · tools/ci/scripts.test.ts:124,151
  C2 — tools/ci/compose.test.ts:23 (argv inteiro, `toEqual`) + tools/ci/scripts.test.ts:70-87
  C3 — tools/ci/compose.test.ts:40-43 + tools/ci/scripts.test.ts:86
  C4 — tools/ci/compose.test.ts:41,43,49 + tools/ci/scripts.test.ts:167-173
  C5 — tools/ci/scripts.test.ts:121,150,172
  C6 — tools/ci/compose.test.ts:53-58 + tools/ci/scripts.test.ts:68,175-184
  C7 — tools/ci/compose.int.test.ts:132-159, parcialmente (ver bloqueante)

Bloqueantes:
  tools/ci/compose.int.test.ts:158 — `expect(Math.max(...todos) - Math.min(...todos))
  .toBeGreaterThanOrEqual(0)` é asserção que SEMPRE passa, proibida pela regra 40 ("O que é
  proibido: ... asserção que sempre passa"). Não é caso de borda improvável: para qualquer
  array não vazio de números finitos, max >= min por definição, e `todos` só chega aqui não
  vazio (`:142` exige > 1 linha) e só com números finitos (`:150` reprova NaN antes). O único
  mundo em que ela falharia é `todos` vazio, que `:142` e `:148` já tornaram impossível.
  Agrava: é ela que carrega a segunda metade do nome do caso (`:132`, "os serviços numa linha
  do tempo só") e da afirmação do documento (`:124`) — a claim está sem nenhuma asserção que
  possa ficar vermelha.
  Correção exigida, uma das duas:
   (a) apagar `:157-158` e tirar "e os serviços numa linha do tempo só" do nome do caso e do
       documento — o substantivo já está provado por `:148` (RFC3339 do Docker em TODA linha)
       mais `:156` (>= 2 serviços), que é o que "mesma escala" significa; ou
   (b) trocar por asserção que possa falhar, e não-flaky: cada carimbo é instante de parede
       plausível — `expect(Math.max(...todos)).toBeLessThanOrEqual(Date.now())` e um piso
       (`Date.now() - N`), o que reprova carimbo do próprio serviço em outra escala.
   NÃO exija intercalação entre os dois serviços: as últimas 15 linhas de cada um podem
   legitimamente não intercalar, e isso viraria vermelho falso.

Recomendações:
```

**1. Sim, há uma quarta mutação pela mesma fresta — e ela é o mesmo conserto que a sua pergunta 2.** As três da R1 morreram de verdade (medi as oito do documento, uma a uma, restaurando entre elas, com os mesmos 19 casos de base). Mas o `toEqual` só protege *dentro* de `etapasDeEncerramento`; no nível do script `afirmarDespejoCarimbado` continua afirmando **propriedades**, não o comando. Qualquer call-site desviado que satisfaça as quatro propriedades sobrevive com 19 verdes. Medido:

- `tools/ci/e2e.ts:22` trocado por array embutido `['logs','--no-color','--timestamps','--since','1m','--tail','4000']` → **19 verdes**. O `--since 1m` corta o despejo para o último minuto e destrói a evidência da falha que aconteceu aos 15 min — que é exatamente a alternativa que o documento diz ter considerado e descartado (`:104`);
- o mesmo sem `--no-color` → **19 verdes** (dano menor: escapes ANSI no log do job, e o caminho real deixa de ser o que o `compose.int.test.ts` afirma).

Conserto único, e é a resposta direta à sua pergunta 2: em `tools/ci/scripts.test.ts:76-84`, afirmar a **linha inteira**, não os tokens:

```ts
expect(chamadas[indice]).toBe(
  'docker compose --project-name educa-teste --env-file .env.example --env-file infra/teste.env ' +
  '-f infra/compose.yml logs --no-color --timestamps --tail 4000',
)
```

Conferi que é literalmente a linha que os scripts reais produzem hoje. Isso mata de uma vez: `--since`, `--no-color` sumido, `--tail` duplicado, lista de serviços no fim, projeto trocado, arquivo de compose trocado e ordem dos argumentos — e dispensa `DESPEJO`, os dois `indexOf('--tail') + 1` e o piso. Não bloqueio porque foi exatamente o que eu pedi na rodada 2 (R1/R4) e foi feito; a largura que falta é achado novo meu, não correção descumprida.

**2. `partes[partes.length - 1]).toBe(String(Number(...)))` (scripts.test.ts:84) é torta, sim, e frágil para o lado errado.** Ela diz "o último token é o número do tail", não "sem serviços no fim": `--tail 4000 --no-color` (ordem legítima) ficaria vermelho sem nada de errado, e `String(Number(x))` normaliza para *mais* estrito (`04000` reprova). A forma direta é a do item 1. Se preferir manter a checagem por propriedade, o honesto é afirmar o complemento — nenhum token depois do valor do tail — e não uma igualdade que finge ser outra coisa.

**3. O caso novo de `compose.int.test.ts` é teste legítimo aqui, não teste de biblioteca disfarçado.** O que ele prende não é "o Docker funciona": é o **contrato externo em que a nossa única evidência de falha se apoia** — que aquela combinação de flags é aceita e devolve carimbo do lado do Docker em toda linha. `executar.ts:36-39` preserva o código original, então a recusa dessa combinação apareceria como despejo vazio dentro de uma execução já vermelha, em silêncio; é a definição de coisa que precisa de rede. O seu vermelho induzido (`redis-fila-1 | 1:M 21 Sep 2026 20:55:01.773 *`) é a prova de que a asserção de `:148` é efetiva. O valor do caso está em `:148` e `:156` — e é por isso que o bloqueante acima é sobre `:158` apenas, e não sobre o caso.

**4. O caso de integração retipou as flags em vez de usar a fonte (`compose.int.test.ts:140` vs `compose.ts:47`).** Como está, ele garante a combinação **de hoje**; se amanhã o despejo real ganhar uma flag, o guarda continua verde afirmando outra chamada. `composeOuFalha(...ETAPA_DO_LOG_DA_FALHA, 'postgres', 'redis-fila')` (ou com o `4000` substituído por `15` no map) o acopla ao argv que ele promete cobrir. Aqui importar de `compose.ts` é seguro: o que o teste afirma é o carimbo no resultado, não a régua do tail — o argumento da R3 não se aplica.

**5. `composeOuFalha` devolve `stdout + stderr` concatenados (`tools/testes/compose.ts:22`).** Se o compose emitir qualquer WARN em stderr nessa chamada, a linha entra em `linhas` (`compose.int.test.ts:141`) e reprova em `:148` como "linha sem carimbo". Hoje o ambiente é limpo (o próprio `:34` afirma `stderr` vazio), então é risco de flake, não defeito: ou lê só `stdout`, ou o comentário registra a dependência.

**6. R3 (o 4.000 em dois lugares) não é preguiça — mantenha.** Importar de `compose.ts` faria baixar a régua ficar verde, e um terceiro arquivo para uma constante é indireção pior que a duplicação, você está certo. Com o item 1 aplicado, os dois passam a ser literais da mesma forma (um no `toEqual`, um na string), o que é mais fácil de manter sincronizado que literal + piso escrito de outro jeito.

**7. Sobre a tabela (R2): confirmo os oito números, com uma ressalva de rótulo.** Base 19/19. `sem --timestamps` 5 ✓ · `--tail 200` 5 ✓ · **ordem invertida 4 ✓** (a correção da R2 está certa) · call-site `e2e.ts` 2 ✓ · call-site `executarTestesComInfra` 2 ✓ · `--tail` duplicado 5 ✓ · serviços no fim 5 ✓ · "projeto trocado" 2 ✓ **somente na leitura "arquivo de compose trocado, `--project-name` mantido"**; trocando o nome do projeto no despejo dá **6** (os 2 de `compose.test.ts` mais os 4 de `scripts.test.ts`, que é o `DESPEJO` funcionando). Vale desmembrar a linha em duas, porque os dois vermelhos vêm de guardas diferentes. E o texto de `:164-165` promete mais do que existe: `scripts.test.ts` não afirma "o comando completo com o projeto", afirma prefixo mais quatro propriedades — corrija a frase ou aplique o item 1, que a torna verdadeira.

**8. Um crack que eu procurei e NÃO existe, para registro:** trocar `stdio: 'inherit'` por `'ignore'` em `tools/ci/executar.ts:15` — que tornaria o despejo invisível no log do job e a correção inteira letra morta — é pego por `tools/ci/executar.test.ts` (1 vermelho a mais sobre a base do projeto `unidade`). O canal de entrega está protegido; não é achado.

Arquivos auditados: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/scripts.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/e2e.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/executar.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/testes/compose.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`.

## test-engineer · 5ª rodada · REPROVADO · 2026-09-21 19:19:00 · `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

Audited the delta. I confirmed one of your two suspicions empirically, with Docker, and it is a blocker.

## Question 1 — the log ceiling case does not affirm what it promises

Your comment at `tools/ci/compose.int.test.ts:142-143` says "Trocar o driver também apareceria aqui, porque `logging` inteiro tem de estar ausente". **That is false**, and it is the second time this correction carries an affirmation without proof. The assertion is on `logging?.options`, not on `logging`. I ran `config --format json` on a scratch compose file outside the tree:

```
"borda":    { "logging": { "driver": "none" } }      → logging?.options === undefined → PASSA
"postgres": { "logging": { "driver": "local" } }     → logging?.options === undefined → PASSA
"api-2":    { "logging": { "driver": "syslog" } }    → logging?.options === undefined → PASSA
```

`logging` is not required to be absent — only `options` is. And the driver path is **strictly worse than the `max-size` path you closed**. With `logging: {driver: none}` on a service, I measured, with two real containers:

```
docker compose logs --no-color --timestamps --tail 4000
  stdout:  50 linhas de normal-1, ZERO de ruidoso-1
  stderr:  level=warning msg="Can't retrieve logs ...: configured logging driver does not support reading"
  exit=0
```

Zero lines, not fewer lines, and **exit 0** — so `executar.ts` sees nothing wrong and the argv tests stay green. Same for `syslog`, `gelf`, `fluentd`, `awslogs`: all fail the reader-capability check identically.

The companion case at `compose.int.test.ts:168` does not backstop it, because it dumps only `postgres` and `redis-fila`. `driver: none` on `borda` or on `api-2` — the 3.899-line service that is the entire piso justifying the 4.000 — passes all nineteen cases. I grepped: nothing else in the repo looks at `logging`. And the edit is the plausible one: the evidência section itself records that 88% of `borda`'s 38.787 lines are healthcheck noise queued for its own correção. `driver: none` on `borda` is exactly what someone enxugando that noise writes.

## Question 2 — the 30-day floor: the argument half holds, and the comment overclaims

I built wrong timestamps against the window `(agora − 30d, agora + 60s]`:

```
PASSA    2026-09-21T19:17:56Z  hora local do host (UTC-3) rotulada Z  ← "fuso do contêiner"
PASSA    2026-09-01T22:17:56Z  relógio do contêiner 20 dias atrasado
VERMELHO 1970-01-01T00:00:00Z  epoch
VERMELHO 2026-09-22T00:17:56Z  fuso a leste (UTC+2) rotulado Z
```

Host is `GMT-0300`. So your comment at `compose.int.test.ts:186-195` names three failure modes the window supposedly catches, and **"fuso do contêiner" is not one of them** for any western timezone — which is the only timezone that matters here (D28, hospedagem em região Brasil). Detection is asymmetric: the `+60s` ceiling catches skew ahead, the 30-day floor catches only era-level errors. "Erra por horas ou por anos, nunca por dias" is half-true — hours *behind* passes.

But the case is not without power, and the power is not in the floor: it is in the **regex**, which requires a literal `Z` and the `T` separator, and therefore rejects all three real formats (`1:M 21 Sep 2026`, `2026-09-21 20:55:01.773 UTC`, `"ts":1789870704.789`), plus any `-03:00` offset form. Plus the ceiling, the `>= 2` serviços and `linhas > 1`. So widening to 30 days did not leave the claim unasserted — it left the floor nearly decorative while the comment credits it with work the regex does. Recommendation, not blocker.

## Question 3 — nothing already proven was weakened

Items 5 and 6 **strengthened** what round 4 had: `toContain(DESPEJO_DA_FALHA)` on the array is exact-element equality, so "lista de serviços no fim" now dies in `scripts.test.ts` too, not only in `compose.test.ts`; and `toContain('15')` makes a fused `--tail=4000` go red instead of slow. Fraction-optional is a correctness fix (Go trims trailing zeros), not a loosening. Ceiling 5s→60s loses only skew between 5 and 60 seconds.

One piece of recorded evidence went stale, though: doc line 144, "conferi que ela falha, deslocando o `agora` em 48 h", was measured against the old window. With 30d/60s, shifting `agora` **+48h now passes green**; only −48h still goes red. Same class of error as the round-2 lesson this document records about itself.

---

```
VEREDITO: REPROVADO

Cenários exigidos (correção de esteira: não há dado de escola, logo sem caso de
permissão nem de isolamento — os cenários são as frestas que matam a evidência
sem ficar vermelho):
  caminho feliz: despejo carimbado, argv inteiro, antes do down
  verde não despeja · --manter-ambiente ainda despeja
  ordem invertida · call site desviado (os dois) · --tail duplicado · --since ·
  --no-color removido · lista de serviços no fim · projeto/arquivo trocado
  resultado real: carimbo do Docker em toda linha, escala do relógio do host
  fresta de configuração: teto de log no compose (options E driver)

Cobertos: todos, menos a metade do último.

Bloqueantes:
  tools/ci/compose.int.test.ts:144 — `expect(servico.logging?.options).toBeUndefined()`
  não cobre troca de driver, e o comentário de :142-143 afirma que cobre. Provado com
  `config --format json`: `logging: {driver: none}`, `{driver: local}` e `{driver: syslog}`
  saem com `options` ausente e passam. Provado com contêineres reais: `driver: none` faz
  `logs --tail 4000` entregar ZERO linha daquele serviço e sair com exit 0 — o despejo
  falha em silêncio na única execução em que é a única evidência, com os dezenove casos
  verdes. O caso de :168 não segura, porque só olha postgres e redis-fila; nada mais no
  repositório olha `logging`.
  Correção exigida: afirmar `servico.logging` (não `.options`), que é o que o comentário
  já diz ser a regra — uma linha, fecha driver, `none`, `syslog` e `options` de uma vez —
  e medir a mutação `logging: {driver: none}` em `borda` para registrar o vermelho.

Recomendações:
  1. compose.int.test.ts:186-195 — o piso de 30 dias não pega "fuso do contêiner" (UTC-3
     rotulado Z passa; o host é GMT-0300, e D28 põe tudo em região Brasil). Quem pega o
     fuso é a regex, que exige `T` e `Z` literais. Reescrever o comentário para creditar a
[… 16 linhas cortadas]

## test-engineer · 6ª rodada · APROVADO · 2026-09-21 19:53:25 · `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

Audit done. I read the four changed files, the round-5 requirements, the compose file and the Caddyfile, and I ran both suites to confirm the bases you cite.

## Verificações que fiz

- `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.test.ts` + `.../tools/ci/scripts.test.ts`: **19/19 verdes** (1,10 s) — a base das onze primeiras mutações confere.
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.int.test.ts`: **9/9 verdes** (1,66 s) — a base das quatro últimas confere, e o `toHaveLength(19)` passa contra o compose real.
- `infra/compose.yml`: contei os serviços à mão — 19 exatos (os três `*-dados` são volumes). Nenhum `logging`, nenhum `include:`, `extends:`, `profiles:` ou `x-`. O número está certo.
- O bloqueante da rodada 5 está fechado: a asserção em `compose.int.test.ts:154` é `expect(servico.logging).toBeUndefined()`, e as duas mensagens de erro que você colou batem exatamente com o template da linha 154 (`{ driver: 'none' }` e `{ driver: 'json-file', …(1) }` — esta última é a normalização que o `config` faz do `max-size`, o que confirma que a medição é real e não redigitada).
- As quatro recomendações: rec 1 em `compose.int.test.ts:196-201` (credita a regex, aceita o fuso a oeste com motivo), rec 2 na tabela do documento linhas 174-178 (com a direção, e o `+48 h` marcado como passa), rec 3 em `:152`, rec 4 na tabela de quinze com a nota das duas bases. Todas aplicadas.
- Sem `.skip`, `.only`, teste comentado ou `any` no delta.
- `tools/ci/compose.int.test.ts` cai no projeto `integracao` (o `exclude` do projeto só tira `infra/**`), então ele roda no `npm run test` do portão da tarefa, não só na esteira. Importante e correto: o guarda de configuração não depende do `--infra`.
- Carimbo em `.processo/portao.json` com `inicio` `2026-09-21T22:21:40.507Z` e as quatro suítes.

## Suas três perguntas

**1. Existe uma terceira porta — e ela não é hipotética, é a próxima correção que você mesmo anunciou.** Não é `daemon.json` nem `x-` anchors (você tem razão nas duas: uma não é versionada, a outra o `config` resolve antes de você ler). É o **serviço decidindo para onde escreve**. `/home/joaquimdp/Documentos/git/Educa.ia/infra/Caddyfile:12-22` já é exatamente esse knob em uso:

```
log default { output stderr ... exclude http.log.access http.log.error http.handlers.reverse_proxy }
log sonda   { output stderr ... include http.handlers.reverse_proxy.health_checker }
```

Trocar `output stderr` por `output file`, ou mexer no `include` do logger `sonda`, entrega **zero linha** daquelas mensagens ao `docker logs`, com argv intacto, exit 0, nenhum `logging:` no compose e os 28 casos verdes. E as linhas do logger `sonda` são precisamente as 484 `host is up` que o seu documento (linha 191) nomeia como o que diagnostica um 503. A correção do ruído de `admin.api` vai mexer nesse mesmo bloco. O mesmo vale para `logging_collector=on` no Postgres.

Não bloqueio por isso: o guarda que esta correção instala é sobre o *despejo*, e a verbosidade de cada serviço é outro defeito — que o documento já separou de propósito. Mas o comentário em `compose.int.test.ts:133` diz "O **último** caminho que mata a evidência da falha sem ficar vermelho", e isso é uma afirmação de exaustividade sem medição atrás, da mesma família da que te reprovou na rodada 5. Troque "o último" por "o caminho de configuração do compose".

**2. `toHaveLength(19)` é a direção certa de falhar, e há uma forma estritamente melhor.** Não vai virar vermelho falso chato, por duas razões: acrescentar serviço é ato deliberado num arquivo versionado, e o mesmo arquivo **já** obriga a tocar o inventário em outros dois lugares (`compose.int.test.ts:50`, a lista `semPorta`, e `:80-91`, a lista dos pools). O 19 entra numa classe de manutenção que já existe, não cria uma nova. A melhora: use o `toEqual` com os nomes, como o teste dos pools ao lado já faz. Dá a mesma não-vacuidade, e ainda pega serviço **removido ou renomeado** (que o `toHaveLength` não pega se alguém tirar um e pôr outro), e o vermelho vem com o diff nomeando qual serviço apareceu, em vez de "esperava 19, recebi 20".

**3. O documento está honesto no que importa, e tem três afirmações sem medição atrás — todas no mesmo ponto, e nenhuma delas no argumento central.** O argumento central eu refiz na mão e ele fecha exatamente: com "outros" somando 192 linhas, `200 → 1.768`, `2.000 → 12.568` e `4.000 → 24.467` reproduzem ao número, e os "13 de 19 / 14 de 19" e "11 de 12 / 12 de 12" saem certos. Essa tabela é sólida. O que não tem medição atrás:

- **"os seis de infraestrutura"** (doc:55 e :101, e o comentário em `tools/ci/compose.ts:42-43`). São **sete** serviços de terceiro (postgres, redis-fila, redis-cache, storage, oidc-falso, borda, observabilidade — conferi por `image:` vs `build:`), e, pior, a sua própria tabela mostra que em `--tail 4000` os truncados são **cinco**, não seis: postgres, borda, redis-fila, redis-cache e storage. `oidc-falso` e `observabilidade` são de infraestrutura e saem **completos**. Em 200 e em 2.000 o sexto truncado é a `api-2`, que é nossa. O comentário em `compose.ts:43` chega a enumerar "(postgres, borda, redis, storage)", que são cinco contêineres, sob o rótulo "os seis".
- **"juntos passam de 150 mil linhas"** (doc:102). A sua tabela soma **149.322** para esses cinco; com os "outros" (≤ 42 cada) ainda não chega a 150.000. É a medição do próprio documento contradizendo a frase duas linhas abaixo dela.
- **"os outros 9"** (doc:88). São **10**: 19 menos os 9 nomeados. Não afeta nenhum total (os 192 continuam valendo), é só o rótulo.

Não é autoelogio de processo. O tom das três lições ("a rodada 1 estava certa nas duas", "a tabela da rodada 2 estava errada, e quem achou foi o revisor") é registro de erro próprio, não elogio, e a linha `+48 h → 0, passa` é a coisa mais honesta do documento: uma mutação que **não** é pega, escrita na tabela de mutações. Mantenha.

```
VEREDITO: APROVADO

Cenários exigidos (correção de esteira: sem dado de escola, logo sem caso de permissão
nem de isolamento — os cenários são as frestas que matam a evidência sem ficar vermelho):
  caminho feliz: despejo carimbado, argv inteiro, antes do down
  verde não despeja · --manter-ambiente ainda despeja
  ordem invertida · call site desviado (os dois) · --tail duplicado · --since ·
  --no-color removido · lista de serviços no fim · projeto/arquivo trocado
  resultado real: carimbo do Docker em toda linha, escala do relógio do host
  fresta de configuração do compose: teto de log (`options`) E troca de driver

Cobertos: todos. O último, que era a metade que faltava na rodada 5, agora em
  tools/ci/compose.int.test.ts:154 — `expect(servico.logging).toBeUndefined()`, sobre
  `logging` inteiro, não `.options`; não-vacuidade real em :152 (19 exatos, não
  `toBeGreaterThan(1)`); mutações medidas nas duas portas, 1 vermelho cada.
  Os demais inalterados desde a rodada 4: compose.test.ts:23 (argv inteiro com toEqual),
  :34, :40, :48, :56; scripts.test.ts:74 e :87 (linha inteira do despejo); 
  compose.int.test.ts:158 (carimbo no resultado real, dois serviços).

Bloqueantes: nenhum.

Recomendações:
  1. tools/ci/compose.int.test.ts:133 — "O **último** caminho que mata a evidência da
     falha sem ficar vermelho" é afirmação de exaustividade sem medição atrás, a mesma
     classe do bloqueante da rodada 5. Existe uma terceira porta: infra/Caddyfile:12-22
     decide o que a borda escreve em stderr (`output stderr`, e o `include` do logger
     `sonda`). Trocar por `output file`, ou tirar o health_checker do `sonda`, apaga as
     484 linhas `host is up` — que o próprio documento (linha 191) nomeia como o que
     diagnostica um 503 — com argv intacto, exit 0 e 28 casos verdes. Escrever "o
     caminho de configuração do compose", e registrar a porta do Caddyfile na correção
     do ruído de `admin.api`, que vai mexer nesse mesmo bloco.
  2. tools/ci/compose.int.test.ts:152 — trocar `toHaveLength(19)` pelo `toEqual` com os
     19 nomes, como o teste dos pools em :80-91 do mesmo arquivo já faz. Mesma
     não-vacuidade, e ainda pega serviço renomeado ou trocado um-por-um, com diff
     nomeando o culpado em vez de "esperava 19, recebi 20".
  3. Documento :55 e :101, e o comentário tools/ci/compose.ts:42-43 — "os seis de
     infraestrutura" não bate com a medição do próprio documento. São sete serviços de
     terceiro, e em `--tail 4000` os truncados são cinco (postgres, borda, redis-fila,
     redis-cache, storage): `oidc-falso` e `observabilidade` saem completos, e em 200 e
     2.000 o sexto truncado é a `api-2`, que é nossa.
  4. Documento :102 — "juntos passam de 150 mil linhas": a tabela de :82-88 soma 149.322
     para esses cinco, e com os "outros" não chega a 150.000.
  5. Documento :88 — "os outros 9" são 10 (19 menos os 9 nomeados). Não muda nenhum
[… 15 linhas cortadas]

## test-engineer · 7ª rodada · APROVADO · 2026-09-21 20:30:01 · `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

Tree untouched, gate stamp matches. Here is the audit.

---

**VEREDITO: APROVADO**

**Cenários exigidos** (correção de esteira: sem dado de escola, logo sem caso de permissão nem de isolamento — os cenários são as frestas que matam a evidência sem ficar vermelho):
caminho feliz (despejo carimbado, argv inteiro, antes do `down`) · verde não despeja · `--manter-ambiente` ainda despeja · ordem invertida · call site desviado (os dois) · `--tail` duplicado · `--since` · `--no-color` removido · lista de serviços no fim · projeto/arquivo trocado · resultado real (carimbo do Docker em toda linha, escala do relógio do host) · fresta de configuração do compose (teto de log **e** troca de driver).

**Cobertos:** todos, os mesmos da rodada 6, nada perdido e um estritamente mais forte. Conferi que cada asserção que aprovei continua no lugar, só deslocada: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.test.ts:23` (argv inteiro com `toEqual`), `:34`, `:40`, `:48`, `:56`; `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/scripts.test.ts:74` e `:87` (linha inteira do despejo); `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.int.test.ts:164` (`logging` inteiro `toBeUndefined`) e `:168` (carimbo no resultado real). Bases medidas por mim: **19 de 19** verdes (1,09 s) e **9 de 9** verdes (1,65 s).

**As oito correções exigidas, conferidas uma a uma:**

- **Recs 3, 4, 5 — refeitas e agora corretas, medidas por mim e não pela sua palavra.** Rodei `config --format json` contra o compose real: 19 serviços, **7** de terceiro (`image:` sem `build:`: borda, observabilidade, oidc-falso, postgres, redis-cache, redis-fila, storage) e **12** nossos (`build:`). Refiz a soma dos cinco truncados: 50.970+38.787+35.886+15.705+7.974 = **149.322** ✓. E "os outros 10" fecha a aritmética inteira: com 192 linhas neles, os totais 1.768 / 12.568 / 24.467 e os "13 de 19 / 14 de 19" e "11 de 12 / 12 de 12" reproduzem ao número. O comentário de `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.ts:41-46` foi corrigido junto ✓.
- **Rec 2 — aplicada e é a melhora que eu previ.** `compose.int.test.ts:158` é `toEqual` com os 19 nomes, escritos à mão (não derivados do `compose.yml`, o que seria vacuidade). Bate exatamente com os nomes reais.
- **Recs 1, 6, 7, 8 — aplicadas.** A rec 8 eu conferi de verdade: `stdio` aparece uma única vez em `tools/ci/` (`executar.ts:15`), e `scripts.test.ts` lê o arquivo de registro das imitações, não a saída dos processos — então `'pipe'` descartado passaria verde mesmo. A afirmação está certa, e é honesta em se declarar sem teste.

**Bloqueantes: nenhum.** Nenhuma regra ficou sem teste que a prove, nenhum `.skip`, `.only`, teste comentado, `any` ou mock cobrindo a regra no delta. O que achei abaixo é texto que erra sobre o mundo, não asserção que erra sobre o código — a mesma classe das recs 3-5 da rodada 6, que também não bloqueei.

**Suas três perguntas**

**1. A sexta existe, são duas, e uma delas é minha.** Ambas no mesmo par de lugares (documento + comentário do teste), ambas medidas por mim agora:

**(a) A lista de drivers está errada** — `.../2026-09-21-log-da-falha-sem-carimbo-de-hora.md:126` e `compose.int.test.ts:146`: "`driver: none` (ou `local`, `syslog`, `gelf`, `fluentd`, `awslogs`) → entrega **zero** linha, com exit 0 e só um warning". Medi com um compose descartável em `/tmp`, cinco serviços alpine, um por caso, e o comando real `logs --no-color --timestamps --tail 4000`:

```
exit=0
driver-none    → 0 de 3 linhas; stderr: warning "configured logging driver does not support reading"
driver-local   → 3 de 3 linhas, sem warning
driver-syslog  → 3 de 3 linhas, sem warning
teto-100k      → 3 de 3 linhas
sem-logging    → 3 de 3 linhas
```

Só `none` é a porta de zero linha. `local` é driver de leitura (o Docker lista json-file, local e journald), e `syslog` ainda entrega por causa do cache de *dual logging*, ligado por padrão desde o 20.10 — o mesmo mecanismo vale para gelf, fluentd e awslogs. Esses cinco pertencem à **primeira** porta, não à segunda: entregam **menos** linhas (o `local` corta em 20m×5 por padrão, o cache no anel dele), não zero. Não bloqueia porque a asserção é sobre `logging` inteiro e proíbe todos eles; o que está errado é o tamanho do dano, não a cobertura.

**(b) "Tudo verde" na terceira porta é falso, e o erro é meu, copiado da minha rec 1 da rodada 6.** Documento `:139-142` e `compose.int.test.ts:136-138` dizem que trocar `output stderr` por `output file`, ou tirar o `health_checker` do `sonda`, passa "com argv intacto, exit 0, nenhum `logging:` no compose e tudo verde". As duas metades já são pegas hoje:

- **tirar o `health_checker` do `sonda`** → `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/borda.test.ts:88` fica vermelho. Rodei as três regexes daquele caso contra uma cópia mutada em memória: `:86` passa, `:87` passa, `:88` **VERMELHO**. É teste de unidade, ou seja, cai no `npm run test` do **portão da tarefa**.
- **`output stderr` → `output file`** → `borda.test.ts` segue verde, mas `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/borda.int.test.ts:577-588` faz `expect.poll` por uma linha `"logger":"http.handlers.reverse_proxy.health_checker.active"` em `borda.logs()`, que é `docker logs` de um Caddy montado sobre o `infra/Caddyfile` real (`:220-226`). Medi com dois contêineres Caddy sobre cópias em `/tmp`: original **28** linhas `health_checker` em `docker logs`, com `output file` **0**. O poll estoura e o caso fica vermelho no `test:infra` e na esteira.

Ou seja: a terceira porta está guardada nas duas metades, uma no portão e outra na esteira. O registro para a correção do ruído de `admin.api` continua útil — o que ela vai mexer é o `include`/`exclude`, não o `output` —, mas a frase precisa dizer qual teste pega o quê, em vez de anunciar uma fresta aberta que não está aberta. É exatamente o vício que este documento existe para não ter, e eu o introduzi.

**2. A terceira lista se paga, e o custo é o barato.** Adicionar serviço é ato deliberado num arquivo versionado, e a falha é **alta e nominal**: `:158` diz qual nome apareceu ou sumiu, `:53` quebra se o serviço novo não publicar porta, `:80-91` quebra se ele tiver pool. Três vermelhos ao mesmo tempo, todos nomeando o serviço — não é o tipo de manutenção que corrói. Consolidar as três numa constante só **não reduz** o número de edições (`semPorta` e a dos pools são subconjuntos com significado próprio, não o inventário), e derivar a lista do `compose.yml` a tornaria vacuosa. Fica como está.

**3. Nada foi enfraquecido.** O `git diff` de `compose.int.test.ts` é puramente aditivo: dois `it` novos, com `semPorta` (`:50`) e a lista dos pools (`:80-91`) intocadas. `toEqual` com nomes é estritamente mais forte que `toHaveLength(19)`: pega renomeação e troca um-por-um, que a contagem não pegava. E a tabela de quinze mutações continua internamente consistente — conferi dois números pela contagem de casos: "sem `--timestamps` → 5" (1 em `compose.test.ts` + 4 em `scripts.test.ts`) e "nome do projeto trocado → 7" (os 4 de `scripts.test.ts` mais os 3 do `it.each` de `:178`).

**Recomendações:**

1. `.../2026-09-21-log-da-falha-sem-carimbo-de-hora.md:126` e `tools/ci/compose.int.test.ts:146` — separar `none` dos outros cinco drivers: `driver: none` é zero linha com warning; `local`, `syslog`, `gelf`, `fluentd` e `awslogs` ainda entregam, pelo cache de dual logging, com o teto do cache — são a **primeira** porta, não a segunda. Medição acima.
2. `.../2026-09-21-log-da-falha-sem-carimbo-de-hora.md:136-142` e `tools/ci/compose.int.test.ts:133-138` — trocar "tudo verde" pelo que a medição mostra: `tools/ci/borda.test.ts:88` pega tirar o `health_checker` do `sonda` (no portão da tarefa) e `infra/test/borda.int.test.ts:586` pega `output file` (na esteira, 28 linhas → 0). Erro de origem minha na rodada 6; vale a nota no `/retro`, porque foi a segunda vez que uma afirmação de exaustividade minha entrou no documento sem medição.
3. `tools/ci/compose.int.test.ts:158-165` — o `toEqual` do inventário roda **antes** do laço do `logging`. Serviço novo já declarando `logging: {driver: none}` fica vermelho pela lista, com a mensagem menos precisa. Invertendo (laço primeiro, inventário depois) o vermelho nomeia o defeito que importa. Continua vermelho nos dois casos, então é só legibilidade.
4. Para o `/retro`: as quatro afirmações erradas da rodada 6 e as duas desta eram todas em **texto explicativo sobre o mundo fora do repositório** (contagem de serviços, comportamento de driver, o que outro teste pega), nunca nas asserções. O padrão sugere um critério simples para o próximo documento: frase sobre comportamento de ferramenta de terceiro ou sobre "nada mais pega isso" só entra com o comando e a saída colados ao lado.

## test-engineer · 8ª rodada · APROVADO · 2026-09-21 21:05:42 · `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

Estado conferido antes de julgar: `tools/ci/compose.test.ts` + `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/scripts.test.ts` **19/19 verdes** (1,09 s), `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.int.test.ts` **9/9 verdes** (1,66 s). O delta desde a minha rodada 7 (fim 20:30:01) é de fato só dois arquivos: `compose.int.test.ts` (20:32:05) e o documento (20:32:32); nenhum outro arquivo rastreado tem `mtime` posterior a 20:30:01, e `compose.ts`, `e2e.ts`, `compose.test.ts` e `scripts.test.ts` estão intactos desde a rodada 7. O carimbo em `.processo/portao.json` (`23:32:43.403Z`, `typecheck, lint, test, infra`) é posterior à última edição — cobre esta árvore. Nenhum `.skip`, `.only`, `any` ou `@ts-` nos cinco arquivos.

**Pergunta 2 — a reordenação mudou só a mensagem.** As duas asserções continuam incondicionais e com os mesmos argumentos (`compose.int.test.ts:158-160` e `:164-168`); o Vitest aborta na primeira que falha, então a conjunção provada é idêntica. A vacuidade continua fechada: `services` vazio passaria o laço e morreria no inventário por nome. E as contagens de mutação não mudam — `logging: {driver: none}` na `borda` dá 1 vermelho nas duas ordens; serviço renomeado dá 1 nas duas. O ganho é o que o comentário `:156-157` diz ser: para serviço novo que já chegue com `logging`, o vermelho agora nomeia o defeito em vez de dizer que a lista mudou.

**Pergunta 1 — a seção registra os erros, mas a classificação é generosa em dois pontos, os dois na direção que absolve os testes.**

1. `:310` — "**O código foi reprovado duas vezes**, as duas com razão (rodadas 1 e 3)". Foram **três**, pela tabela de Revisões do próprio documento (`:346`, `:348`, `:350`). A rodada 5 reprovou uma **asserção**: `expect(servico.logging?.options).toBeUndefined()` não alcançava troca de driver, e `logging: {driver: none}` — zero linha de evidência, exit 0 — passava com os dezenove casos verdes. A correção exigida foi mudar a asserção para `servico.logging`. Isso é a categoria mais grave do meu roteiro, "regra sem teste que a prove", e é o pior resultado possível desta correção (a evidência sumindo em silêncio na execução em que é a única que existe). A seção a arquiva na linha "comportamento de ferramenta de terceiro".

2. `:314-315` — "Todas as afirmações erradas caíram na mesma categoria: **prosa sobre o mundo fora do repositório**, nunca uma asserção de teste". Três das seis linhas da própria tabela são prosa sobre o **alcance dos próprios testes**, não sobre o mundo externo: rodada 2 ("a ordem invertida dá 1 vermelho" — comportamento das suas suítes), rodada 5 ("trocar o driver também apareceria aqui" — alcance da sua asserção) e uma sétima que **não está na tabela**: `:216-218`, "conferi que ela falha, deslocando o `agora` em 48 h", que afirmava que o caso pegava uma mutação que ele não pega (`:222`, +48 h passa). Essa é a pior da família, porque **superestima a proteção**, e é interna. Some-se a oitava, `:78-79` ("2.000 cobre a execução inteira"), erro seu derrubado por medição sua. Então "as seis afirmações erradas" é uma contagem que não foi contada — o vício 2 da própria seção — e "nunca uma asserção de teste" é falso como escrito.

O resto da seção não é autoabsolvição: manter na tabela de mutações a linha `+48 h → 0, passa` e escrever "a tabela da rodada 2 estava errada, e quem achou foi o revisor" é registro de erro próprio. O conserto é trocar "duas" por "três", tirar a rodada 5 da coluna de prosa, e trocar "prosa sobre o mundo fora do repositório" por "prosa sobre comportamento que eu não medi — de ferramenta de terceiro **ou do meu próprio teste**".

**Pergunta 3 — sobrou uma, e ela entrou junto com a rec 1, que é minha.** A tabela `:125` e o comentário `compose.int.test.ts:143-147` agora dizem que `local`, `syslog`, `gelf`, `fluentd` e `awslogs` "entregam **menos** que as 3.899 linhas do maior serviço nosso, matando o piso que justifica o 4.000". A medição colada (`:131-137`) prova **que entregam** — 3 de 3 linhas —, nunca **quanto**: com três linhas escritas, nenhum teto podia aparecer. A sua medição e a minha foram a mesma medição, e nenhuma das duas testou o teto. Medi agora, Docker 29.7.2, 6.000 linhas escritas, comando real de leitura:

```
--log-driver local                              docker logs → 6000 linhas
--log-driver syslog (udp://127.0.0.1:514)       docker logs → 6000 linhas
```

Nenhum truncamento na ordem de grandeza que importa (3.899). `local` tem `max-size 20m`/`max-file 5` por padrão e o cache de dual logging não cortou nada aqui, então nesses dois casos o despejo é indistinguível do de hoje. O enunciado defensável é: `none` zera; os outros cinco entregam, e o que os faz entregar **menos** é um teto configurado (`max-size`, `cache-max-size`) — que é o caso `options`, já na mesma linha. A asserção não muda nada com isso (ela proíbe `logging` inteiro, e o documento diz isso em `:141-142`), por isso é recomendação e não bloqueante. Mas é exatamente o vício 1 da sua seção nova reincidindo dentro da correção que o declara, e pela porta que a sua própria observação final nomeia: repetir a recomendação do revisor sem medir a parte que o revisor também não mediu. A rec 1 da minha rodada 7 está errada nessa metade, e a responsabilidade da frase "entrega menos" é minha antes de ser sua.

Dois achados menores de contagem, da mesma família: `:306` diz "correção de **três** linhas de comportamento" e `:49` diz "**Duas** linhas de comportamento" — o documento contradiz a si mesmo em 257 linhas de distância. E "Sete rodadas de `test-engineer`" vira oito no instante em que esta rodada é registrada, o que é o vício 2 aplicado à frase que o descreve.

```
VEREDITO: APROVADO

Cenários exigidos (correção de esteira; sem dado de escola, logo sem caso de permissão
nem de isolamento — os cenários são as frestas que matam a evidência sem ficar vermelho):
  caminho feliz: despejo carimbado, argv inteiro, antes do down
  verde não despeja · --manter-ambiente ainda despeja
  ordem invertida · call site desviado (os dois) · --tail duplicado · --since ·
  --no-color removido · lista de serviços no fim · projeto e arquivo de compose trocados
  resultado real: carimbo do Docker em toda linha, duas fontes, escala do relógio do host
  fresta de configuração do compose: `logging` inteiro (options E driver), sem vacuidade

Cobertos: todos, e nada perdido na reordenação. Conferi asserção por asserção:
  compose.test.ts:23 (argv inteiro com toEqual), :34, :40, :48, :56 — intactos desde a
  rodada 4; scripts.test.ts:74 e :87 (linha inteira do despejo no script real) — intactos;
  compose.int.test.ts:159 (`logging` inteiro toBeUndefined, agora no laço que vem antes)
  e :164 (os 19 por nome, que fecha a vacuidade) e :171 (carimbo no resultado real).
  Bases medidas por mim nesta rodada: 19/19 verdes (1,09 s) e 9/9 verdes (1,66 s).

Bloqueantes: nenhum. Nenhuma asserção nova, nenhuma removida, nenhuma enfraquecida; a
  reordenação preserva a conjunção provada e as contagens de mutação. Nenhum .skip,
  .only, teste comentado, `any` ou mock cobrindo a regra. Nada chama provedor pago.

Recomendações:
  1. tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md:310 e :314-324 —
     "o código foi reprovado duas vezes" são três (rodadas 1, 3 e 5, pela tabela :346-350);
     a rodada 5 foi reprovação de asserção (`logging?.options` → `logging`), com `driver:
     none` passando verde, e não prosa sobre ferramenta de terceiro. E "nunca uma asserção
     de teste" é falso para as linhas da rodada 2 e da 5, que são afirmações sobre o alcance
     dos próprios testes. Falta na tabela a sétima, :216-218 ("+48 h falha"), que é a que
     superestimava a proteção; e a oitava, :78-79 ("2.000 cobre a execução inteira").
  2. Documento :125 e tools/ci/compose.int.test.ts:143-147 — "entrega MENOS que as 3.899
     linhas" não é sustentado pela medição de 3 linhas colada em :131-137, e é falso na
     escala que importa: medi 6.000/6.000 com `--log-driver local` e 6.000/6.000 com
     `--log-driver syslog` (Docker 29.7.2). O que a medição prova é "entregam"; o que os
     faz entregar menos é um teto configurado, que é o caso `options` da mesma linha.
     Erro de origem na minha rec 1 da rodada 7 — corrija a frase nos dois lugares, não a
     asserção. Vale nota no /retro: revisor e revisado mediram a mesma metade.
  3. Documento :306 diz "três linhas de comportamento"; :49 diz "duas". E "Sete rodadas"
     vira oito com esta. Números do documento que mudam embaixo da frase — o vício 2 que a
     própria seção fixa como critério.
  4. Mantida da rodada 7: tools/ci/executar.ts com `stdio: 'inherit'` segue sem teste, por
     decisão registrada em :168-171. Continuo de acordo, e o registro de que ali a proteção
     é social, não automática, é o que faz a decisão auditável.
```

## test-engineer · 9ª rodada · APROVADO · 2026-09-21 21:39:34 · `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

**Estado conferido antes de julgar.** Delta desde minha rodada 8 (fim 21:05:42) é de fato só dois arquivos: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.int.test.ts` (21:07:24) e `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md` (21:07:15). `compose.ts`, `e2e.ts`, `compose.test.ts` e `scripts.test.ts` intactos desde a rodada 7. Nenhuma asserção mudou — o diff de `compose.int.test.ts` é só comentário (`:148-150`). Rodei eu mesmo: `compose.test.ts` + `scripts.test.ts` **19/19 verdes** (1,09 s), `compose.int.test.ts` **9/9 verdes** (1,65 s). Carimbo `2026-09-22T00:07:27.213Z` (= 21:07:27 local) é posterior às duas edições. Nenhum `.skip`, `.only`, teste comentado ou mock sobre a regra.

**Pergunta 2 — não, e a resposta é a mais importante desta rodada: você devia ter medido, e o que faltava não era um servidor syslog.** A pergunta que o documento declara não saber distinguir ("0 por truncamento" vs "0 por contêiner morto") se fecha com um `docker inspect`. Medi agora, mesmo Docker 29.7.2, mesma URL sem servidor nenhum:

```
docker run -d --log-driver syslog --log-opt syslog-address=udp://127.0.0.1:514 alpine
  (6000 linhas escritas)
docker inspect → status=exited exit=0 erro=   driver=syslog
docker logs     → 6000 linhas, stderr vazio
```

O contêiner **sobe**, sai 0 e `docker logs` devolve tudo — é o cache de *dual logging*, ligado por padrão desde o 20.10. Ou seja: a hipótese "provavelmente nem subiu" (`:146-147`) está refutada, o seu 0 veio de outra coisa no arranjo descartável, e minha medição da rodada 8 (6.000/6.000) reproduz. A linha "não medido de forma conclusiva" (`:128`) não é registro honesto porque o seu premissa está errada: a medição que faltava custava um comando, não um servidor. Não bloqueia (a asserção proíbe `logging` inteiro de qualquer forma), mas é um **0 registrado como evidência** na seção de evidência, que é pior que uma frase sem medição.

**Pergunta 1 — a seção melhorou muito e ainda sobra generosidade em dois pontos, os dois na mesma direção de antes.** (a) `:337` "o texto errou **oito** vezes" e a tabela que vem embaixo tem **nove** linhas (`:343-351`) — e onze erros, porque a linha da rodada 6 empacota três. É a terceira rodada seguida em que aponto número do documento contradizendo o próprio documento, e agora dentro do parágrafo que nomeia o vício 2. (b) `:334-335` "o argumento central — `--timestamps` como conserto, `--tail 4000` pelo maior log de serviço nosso — sobreviveu a todas as rodadas": a metade do `--tail` **não** sobreviveu. Até a rodada 4 o documento trazia 2.000, que ele mesmo chama de "número chutado e, nos próprios termos em que eu o justifiquei, inútil" (`:99-100`). É a versão final do argumento retroprojetada sobre as rodadas em que ela não existia.

**Pergunta 3 — sim, sobraram três, e duas nasceram do conserto da rec 2.** Além do syslog acima: `:127` e `:150` dizem que o `local` "só truncaria com teto **configurado**" — o driver `local` tem teto **por padrão**, `max-size 20m`/`max-file 5`; eu escrevi isso na rodada 8 (`achados-revisoes.md:1982`) e a reescrita perdeu essa metade, virando afirmação mais forte que a medição (6.000 linhas curtas não chegam perto de 20 MB). E `:121` — "Declarar `logging` num serviço matava a evidência com o argv intacto, exit 0 e toda a suíte de argv verde" — é contradito pela linha da própria tabela seis linhas abaixo: com `driver: local`, declarar `logging` **não** mata a evidência.

O que confirmei que reproduz ao dígito: a tabela do `--tail` (`:92-96`). 1.768 = 6×200 + 568; 12.568 = 6×2.000 + 568; 24.467 = 5×4.000 + 3.899 + 568; e 149.322 é a soma exata dos cinco. Os 19 serviços = 12 nossos + 7 de terceiro fecham com a lista enumerada em `compose.int.test.ts:165-169`. 34.102/38.787 = 87,9%.

```
VEREDITO: APROVADO

Cenários exigidos (correção de esteira; sem dado de escola, logo sem caso de permissão nem
de isolamento — os cenários são as frestas que matam a evidência sem ficar vermelho):
  caminho feliz: despejo carimbado, argv inteiro, antes do down
  verde não despeja · --manter-ambiente ainda despeja
  ordem invertida · call site desviado (os dois) · --tail duplicado · --since ·
  --no-color removido · lista de serviços no fim · projeto e arquivo de compose trocados
  resultado real: carimbo do Docker em toda linha, duas fontes, escala do relógio do host
  fresta de configuração do compose: `logging` inteiro (options E driver), sem vacuidade

Cobertos: todos, inalterados desde a rodada 8. compose.test.ts:23 (argv inteiro com
  toEqual), :34, :40, :48, :56; scripts.test.ts:74 e :87 (linha inteira no script real);
  compose.int.test.ts:160 (`logging` inteiro toBeUndefined, no laço antes do inventário),
  :165 (os 19 por nome, que fecha a vacuidade), :172 (carimbo no resultado real).
  Bases medidas por mim nesta rodada: 19/19 e 9/9 verdes.

Bloqueantes: nenhum. Nenhuma asserção nova, removida ou enfraquecida — o delta em
  tools/ci/compose.int.test.ts é só o comentário :148-150. Nenhum .skip, .only, `any`,
  teste comentado ou mock cobrindo a regra. Nada chama provedor pago.

Recomendações:
  1. .../2026-09-21-log-da-falha-sem-carimbo-de-hora.md:128 e :146-152, e
     tools/ci/compose.int.test.ts:148-150 — a linha "não medido de forma conclusiva" está
     apoiada numa hipótese refutável por um comando, e refutada: `docker inspect` mostra o
     contêiner com syslog subindo (status=exited exit=0, erro vazio) e `docker logs`
     devolvendo 6000/6000 (Docker 29.7.2, udp://127.0.0.1:514 sem servidor). O enunciado
     defensável é o mesmo dos outros quatro: entregam, pelo cache de dual logging; o que
     faz entregar menos é um teto, que é a linha `options`. Se preferir manter "não
     medido", diga o que não foi medido (o teto do cache, `cache-max-size`), não a
     subida do contêiner.
  2. Documento :127 e :150 — "só truncaria com teto configurado": o driver `local` trunca
     por padrão (max-size 20m, max-file 5). Estava na minha rodada 8
     (tasks/correcoes/achados-revisoes.md:1982) e caiu na reescrita. Vício 1 reincidindo
     pela porta que a própria seção nomeia: repetir o revisor sem a metade que ele mediu.
  3. Documento :121 — "Declarar `logging` num serviço matava a evidência ... exit 0 e toda
     a suíte de argv verde" é contradito pela linha `driver: local` da tabela logo abaixo.
     Precisa do qualificador: com teto ou com driver sem leitura. E :118 anuncia "duas
     portas" para uma tabela de quatro linhas numa coluna chamada "Porta", em que uma
     (`local`) está medida como não sendo porta.
  4. Documento :337 — "o texto errou oito vezes" contra nove linhas em :343-351 (onze
     erros, com a linha da rodada 6 empacotando três). E :319 "Oito rodadas" fica velho no
     instante em que esta é registrada. Sugestão de conserto definitivo: parar de contar em
     prosa e remeter à tabela ("as rodadas da tabela de Revisões", "as linhas abaixo").
  5. Documento :334-335 — "o argumento central ... sobreviveu a todas as rodadas" absolve
     o `--tail`: o 4.000 só ganhou critério depois da medição que derrubou o 2.000, e o
     2.000 está na sua própria tabela de erros. Diga que sobreviveu o `--timestamps`.
     Nomeie também qual tabela "reproduz ao dígito": a do --tail reproduz (recomputei as
     três linhas e a soma 149.322); a de mutações é a que foi remedida três vezes.
  6. Documento :78-96 — o piso de 3.899 foi medido numa execução **verde** (35 testes
     verdes, 20,2 min), e o despejo só acontece em execução **vermelha**, em que o serviço
     que falha costuma escrever mais (erro, tentativa, stack). O 4.000 continua
     estritamente melhor que 200, mas o piso vem da classe de execução em que o despejo
     nunca roda. Vale uma frase dizendo isso, ou a contagem de uma execução vermelha.
  7. Mantida das rodadas 7 e 8: tools/ci/executar.ts com `stdio: 'inherit'` segue sem
     teste, por decisão registrada em :181-184. Continuo de acordo; o registro de que ali
     a proteção é social é o que faz a decisão auditável.
```

## test-engineer · 11ª rodada · APROVADO · 2026-09-21 23:25:22 · `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

## Conferência

Rodei três medições próprias antes de julgar.

**1. Recomendações da rodada 10 — todas verificadas como aplicadas.**
- Rec 1: `tools/ci/compose.int.test.ts:148-151` agora diz "`local` e `syslog` entregam tudo (6.000 de 6.000, medido), o primeiro com teto de 20 MB por padrão, que 3.899 linhas não alcançam. `gelf`, `fluentd` e `awslogs` não foram medidos" — bate com a tabela do documento (linhas 165-167), sem contradição.
- Recs 2, 3, 4: documento linha 169 ("Das quatro declarações medidas, **duas** são porta" — confere: `max-size` e `none` de quatro medidas), linhas 356 e 379 (remetem à tabela em vez de afirmar "todas as rodadas"), linha 165 (a linha do `local` sem inversão de leitura).
- Rec 5: registrada em `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md:218-221`.

**2. Nenhuma asserção mudou.** Conferi o diff inteiro dos quatro arquivos de código e os dois de teste: `ETAPA_DO_LOG_DA_FALHA`, `etapasDeEncerramento`, o `toEqual` do argv em `tools/ci/compose.test.ts:23-30` (com o `4000` à mão), o `DESPEJO_DA_FALHA` de linha inteira em `tools/ci/scripts.test.ts` e o caso de resultado em `tools/ci/compose.int.test.ts:173-227` estão como na rodada 8. Sem `.skip`, sem teste comentado, sem mock escondendo regra.

**3. O defeito do `7.5`: sua leitura está certa, e eu reproduzi deterministicamente.** Forcei o relógio no instante que você viu e rodei o logger real:

```
{"level":"info","time":"2026-09-22T01:45:37.569Z","servico":"teste","aluno":{"id":"a1","nome":"[removido]",...
contem 7.5 ? true    nota redigida ? true    indice 42 → "-09-22T01:45:37.569Z\","
```

A redação está correta (`correcao.nota === '[removido]'`); o único `7.5` da linha está dentro do carimbo. Taxa própria sobre 1.000.000 de instantes sorteados: **1,009%**, e nenhum outro dos cinco valores da lista de `logger.test.ts:48` colide. O locus é único: o `.` só aparece entre segundos e milissegundos, logo a colisão exige segundo terminando em `7` e milissegundo começando por `5` — 1/10 × 1/10. `timestamp: stdTimeFunctions.isoTime` em `packages/nucleo/src/log/logger.ts:170` confirma o formato.

Varri o repositório pela mesma classe (todo `not.toContain`/`not.toMatch` sobre texto que carrega carimbo): `logger.test.ts:49` é o único caso real. `procurados` de `sessao-externa.int.test.ts:381`, `sentinela` de `borda.int.test.ts:518` e `'(8)'` de `estrutura.int.test.ts:152` são longos ou não passam por linha de log.

---

VEREDITO: APROVADO

**Cenários exigidos:** despejo da falha carimbado e completo (argv inteiro, não propriedades) · despejo **antes** do `down --volumes` · os dois call sites (`compose.ts` e `e2e.ts`) presos à mesma função · execução verde não despeja · `--manter-ambiente` preserva o despejo · todo passo fala com o compose de teste, nunca o de desenvolvimento · porta de **configuração** (`logging` com teto ou driver sem leitura) · resultado real: carimbo RFC3339 do Docker em toda linha, de dois serviços, na escala do relógio de parede.

**Cobertos:** todos. `tools/ci/compose.test.ts:13-58` (argv com `toEqual` e `4000` à mão, ordem por `toEqual` de nomes, verde sem despejo, prefixo `ARGUMENTOS_COMPOSE` em todo passo); `tools/ci/scripts.test.ts` (linha inteira no script real, nos três casos, com a ordem contra o `down`); `tools/ci/compose.int.test.ts:132-171` (`logging` inteiro ausente, laço antes do inventário dos 19 nomes) e `:173-227` (carimbo no resultado, com a regex exigindo `T` e `Z` e os limites de época). A tabela de quinze mutações no estado final sustenta que cada uma falha sem a regra.

**Bloqueantes:** nenhum.

**Recomendações:**

1. **Abra a correção do `7.5` antes do próximo commit de tarefa**, não depois. `packages/nucleo/src/log/logger.test.ts:48-50` roda no projeto `unidade`, logo em todo portão e todo push: é 1% de chance de o portão ficar vermelho gritando regra 20 sem motivo. Enquanto ele existe, vermelho na suíte deixou de significar uma coisa só, e é disso que a regra 40 depende.

2. **O conserto que eu exigiria, e o que eu recusaria.** Recusaria a sua opção (a): mover o `not.toContain` para o campo. A asserção sobre a linha crua é mais forte de propósito — ela pega o valor vazando em **qualquer** chave, inclusive uma que o `toMatchObject` de `:42-46` não enumera. Trocada pelo campo, ela vira duplicata do `toMatchObject` e fica cega para "a nota reapareceu em `msg`". Recusaria também a opção (b) como está: "valor que não colida" é frágil e é o vício 1 de novo. Medi — `7.55` cai para 1/1.000 mas não para zero, e `10.5` **continua colidindo** (`...T01:45:10.569Z`); só formas impossíveis como segundo `77` escapam de verdade, e ninguém vai reler esse raciocínio em seis meses. O que eu exigiria é **determinismo, preservando o escopo da linha inteira**: fixar o relógio (`vi.setSystemTime`) exatamente em `2026-09-22T01:45:37.569Z`, o instante que falhou, e/ou normalizar o campo `time` dentro de `loggerCapturado()` (`:26-31`) antes do `join`, para todo teste do arquivo herdar a imunidade. Com o instante colidente fixado, o defeito vira caso de regressão permanente em vez de desaparecer. Se a escolha for normalizar o `time`, ela precisa vir acompanhada de uma asserção de que `registro.time` casa com o ISO — senão o strip passa a esconder o carimbo sumindo do log.

3. **Registrar o vermelho cuja evidência você apagou é honesto, e eu não exigiria reprodução antes de seguir.** Intermitente que não reproduz não reproduz por definição; você rodou de novo em seguida (35/35, 1.192 s), não atribuiu causa e escreveu "não estabelecida". Isso é o que a regra 40 quer. Desculpa seria chamar de "flake do ambiente" e seguir. O que vale extrair não é culpa, é mecanismo: `tools/processo/portao-local.ts:30` roda tudo com `stdio: 'inherit'` e nada mais — a saída do portão existe só no terminal de quem chamou. É **o mesmo furo** que o documento registra em `tools/ci/executar.ts` (linhas 218-221) e declara como "proteção social, não automática" — e a proteção social falhou na mesma noite, contra o autor. Recomendo abrir que o portão local persista a saída completa por execução, ao lado do carimbo. Seria a tese desta correção aplicada ao lado local, que é onde as nove intermitências apareceram.

4. `tools/ci/compose.int.test.ts:185-190`: o `map` supõe `--tail` seguido do valor e o `expect(argumentos).toContain('15')` guarda isso — correto, mas o guarda passa se um dia algum outro argumento for literalmente `15`. Um `expect(argumentos[argumentos.indexOf('--tail') + 1]).toBe('15')` fecha sem custo. Não bloqueia.

5. Para o `/retro`: o padrão dos dois vícios do documento tem agora um terceiro caso, e ele não é seu — o `7.5` é "asserção de negativa sobre texto que carrega dado não determinístico". Vale como item de revisão de teste: toda negativa sobre linha crua de log precisa dizer por que o valor escolhido não pode aparecer no carimbo.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-21 23:32:42 · `tasks/correcoes/2026-09-21-log-da-falha-sem-carimbo-de-hora.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum (esteira e ambiente; `deploy` não é tocado)
Rate limit: ok (não toca limitador)
Fila e prioridade: ok (não toca fila)
Concorrência: protegida
Índice e paginação: ok (nenhuma query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (nenhum alerta novo; o despejo não mede nada em produção)
Bloqueantes: nenhum
Recomendações:
1. Agrupar o despejo em `::group::`/`::endgroup::` (nada no repositório usa isso hoje): com 24,5 mil linhas entre a falha do vitest e a linha `✖ esteira`, o resumo do vermelho fica soterrado no job.
2. `--tail` não alcança a janela da falha nos cinco truncados, e isso limita o objetivo declarado (ver item 2 abaixo).
3. Quando existir compose de staging/produção, `logging` com rotação passa a ser necessidade operacional (json-file sem `max-size` enche disco de host). A mensagem do guarda deveria dizer "neste arquivo, que é local e de esteira", para a próxima pessoa não tratar a proibição como global.
4. `infra/scripts/carga.ts:304` e `infra/scripts/carga-login.ts:444` seguem sem `--timestamps` (registrado em `TODO.md:54-59`) — aceito como registro, não como pendência desta correção.

Respostas ao que você pediu, em ordem:

**1. Log público — o argumento se sustenta, e por mais motivos do que o que está escrito.** O repositório é público, confirmado (`gh repo view LitzGab/Educa.ia` → `"visibility":"PUBLIC"`, nome `Turmma.ai`). Não aceitei o argumento do documento; conferi, e ele está certo mas subespecificado. O que sustenta a publicação das 24,5 mil linhas:
- `.github/workflows/ci.yml:5` declara, e os quatro jobs confirmam, que nenhum passo recebe segredo do repositório. Todo valor de ambiente da esteira vem de `.env.example` e `infra/teste.env`, **os dois versionados** — `POSTGRES_SENHA=educa_local_sintetica`, `IDENTIDADE_CHAVE_ASSINATURA=educa_local_sintetica_assinatura_f0`, `STORAGE_CHAVE_SECRETA=...`. Um serviço que imprima a própria configuração no boot publica o que já está no repositório. O despejo **não pode** vazar segredo que já não seja público.
- O escopo está preso por teste, e isso é o que importa mais que a sinteticidade: `ARGUMENTOS_COMPOSE` fixa `--project-name educa-teste` e os dois `--env-file`, `scripts.test.ts` afirma isso para os três scripts, `compose.test.ts:53-58` afirma para todo passo de encerramento, e `compose.int.test.ts:31` exige que `infra/.env` não exista. Sem isso, "o dado da esteira é sintético" seria promessa; com isso, é invariante.
- Log nosso tem duas camadas: `guardas/log-sem-dado-pessoal` em `**/*.{js,mjs,...,tsx}` com `no-restricted-disable` em cima (não se desliga por comentário, e `tools/guardas/lint.ts` ignora comentário), mais o redact em tempo de execução (`packages/nucleo/src/log/logger.test.ts`). As duas exceções da lista são o teste do redact e `logger-do-nest.ts`, e nesta última a guarda de dado pessoal continua ligada.
- O único log de terceiro com dado de requisição é o do Caddy, e `infra/compose.yml:400` mostra que `admin 127.0.0.1:2019` só é alcançável pelo healthcheck do próprio contêiner: não existe tráfego de aluno naquele logger.

O que a correção acrescenta é volume, não exposição. Aprovado por isso, não por "é sintético".

**2. O piso medido em verde: não bloqueio, mas o 4.000 não fecha o objetivo, e o limite é maior do que está escrito.** Não exijo a contagem num vermelho: 4.000 domina 200 e 2.000 nos mesmos termos da sua tabela e não pode regredir nada. O que o documento registra como "pode estar subdimensionado" é, na verdade, uma consequência estrutural que o `--tail` não conserta: o tail é o **fim** da execução, e a suíte não tem `bail`, então um vermelho aos 5 min é seguido de 15 min de log. Com a sua medição, `borda` escreve ~32 linhas/s (38.787 / 20,2 min) — 4.000 linhas são ~2,1 min de janela; `postgres` ~42 linhas/s, ~95 s; `redis-fila` ~2,3 min. Ou seja, nos cinco truncados o despejo cobre os últimos dois minutos da execução, e não o instante do 503 — que é exatamente o que o documento diz querer cruzar, nos quatro vermelhos da borda. Não é bloqueante (o estado anterior cobria ~6 s), mas "medir num vermelho" não resolve: o que resolve é âncora no instante da falha (o que `achados-revisoes.md:409` pediu para dentro do teste) ou reduzir a taxa de escrita. Registre isso junto do limite atual.

**3. Separar o `admin.api`: concordo, com uma consequência de sequência que muda a ordem.** A mudança é no `infra/Caddyfile`, tem guardião diferente e não compartilha arquivo com esta correção — separar é certo. Mas ela não é "achado colateral": 34.102 das 38.787 linhas da borda são aquele ruído, então tirá-lo leva a borda a ~4.685 linhas, e só então `--tail 4000` passa a cobrer quase a execução inteira do serviço onde caíram quatro dos sete vermelhos. Ou seja, a correção do ruído entrega mais diagnóstico da borda do que o aumento do tail entregou. Faça-a em seguida e **remeça o tail depois dela**, não antes. Anoto também, para o `privacy-guardian` daquela rodada, que o logger `admin.api` só registra o healthcheck de loopback: o furo é do item 9 da regra 20 na forma (URI, `remote_ip`, `headers` no log padrão), sem dado pessoal por trás.

**4. O guarda dos 19 serviços é proporcional.** `infra/compose.yml:1` é "ambiente local completo", usado por desenvolvimento e esteira; não existe compose de staging ou produção ainda. Nesse arquivo, `logging` só tem dois usos plausíveis e os dois matam a evidência com exit 0 — e a sua medição de `driver: none` (zero linha, só warning) é o caso que nenhuma asserção de argv pegaria. O laço antes do inventário está na ordem certa. Duas observações: o guarda roda em `compose.int.test.ts`, projeto `integracao`, isto é, no portão de toda tarefa e não só em `test:infra` — é onde ele serve; e a proibição precisa da ressalva do item 3 das recomendações quando o compose de produção nascer.

**5. Regra 80 no resto: confirmado.** Nada de fila, migration, gateway de IA, prova, sessão ou estado em memória é tocado. `etapasDeEncerramento` preserva o comportamento anterior nos dois sítios, inclusive `--manter-ambiente` (`e2e.ts:22` passa `!manterAmbiente`), e `executar.ts:36-39` roda **todos** os passos de finalização sem parar no primeiro que falha e sem apagar o código original — então um despejo que falhe não deixa contêiner nem volume de pé no runner. O caminho de falha, que não tinha teste nenhum, passa a ter cinco casos em `compose.test.ts` (rodei: 5 verdes) mais a linha inteira do despejo em `scripts.test.ts` e a asserção de resultado em `compose.int.test.ts`; nenhum deles chama provedor pago.

Arquivos auditados: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/e2e.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/executar.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/scripts.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/compose.yml`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/Caddyfile`, `/home/joaquimdp/Documentos/git/Educa.ia/.github/workflows/ci.yml`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/index.mjs`.
