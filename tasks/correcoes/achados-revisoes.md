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
