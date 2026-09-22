# Achados das revisões — `tasks/correcoes/2026-09-18-guarda-de-cpu-do-e2e-reprova-a-maquina.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

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
