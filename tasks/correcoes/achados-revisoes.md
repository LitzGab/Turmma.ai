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
