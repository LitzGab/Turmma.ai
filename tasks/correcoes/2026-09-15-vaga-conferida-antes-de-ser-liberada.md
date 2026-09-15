# Correção — o teste da vaga confere o Redis no instante em que o Postgres diz "concluído", antes de o worker liberar a vaga

**Origem:** teste intermitente, esteira run 35031434076 (commit `7dfbd81`, job integração)
**Subagentes obrigatórios:** `infra-guardian`, `test-engineer`

## Sintoma

`apps/despachante/test/vagas.int.test.ts › o worker renova a vaga enquanto o job roda, a vaga
fica com o job na retentativa, e sai no fim` falhou na esteira, na linha 315:

```
AssertionError: expected [ Array(1) ] to deeply equal []
- []
+ [ "01a0a735-404f-79cd-9020-6d26f6a41e76" ]
 ❯ apps/despachante/test/vagas.int.test.ts:315:53
```

Na máquina de desenvolvimento o arquivo passa 17/17. Na esteira, com o runner carregado, falha
de vez em quando. O job é o do próprio teste, e a vaga que sobrou é a dele.

## Causa

Não é o produto: é o teste conferindo cedo demais.

O worker termina o job nesta ordem (`apps/worker/src/executor.ts`, `executar`):

1. `repositorio.concluir(jobId)` — o Postgres passa a dizer `concluido`;
2. `renovacao.parar()` — espera a renovação que estiver em andamento no Redis;
3. `liberarVaga(vaga)` — só aqui o id sai do ZSET da escola.

A ordem é deliberada e está documentada no executor: se o Postgres falhar entre uma coisa e
outra, o job volta a tentar ainda dono da vaga. E o passo 2 espera de propósito, para nenhuma
renovação chegar ao Redis depois da liberação e devolver a vaga de um job já terminado por mais
uma validade.

O teste, porém, faz `await aguardarEstado(id, 'concluido')`, que **só olha o Postgres**, e
confere o ZSET na linha seguinte. Entre os dois há uma janela real de I/O: uma renovação em voo
(o teste usa `intervaloRenovacaoDaVagaMs: 200`) mais um `zrem`. Na máquina de desenvolvimento
essa janela fecha em microssegundos; no runner da esteira, com 26 arquivos de integração
disputando CPU, ela passa do instante da asserção.

A mesma forma aparece em mais dois pontos do arquivo (linhas 283 e 364): esperar o estado no
Postgres e conferir a vaga no Redis logo depois. Os três são a mesma janela.

## Teste que reproduz

`apps/despachante/test/vagas.int.test.ts › o worker renova a vaga enquanto o job roda, a vaga
fica com o job na retentativa, e sai no fim`, com a liberação da vaga atrasada em 400 ms
(`VagasPorEscola.prototype.liberar` embrulhado no próprio teste, só para a medição).

Como a falha é uma corrida que depende da carga do runner, o vermelho determinístico veio desse
atraso: ele deixa explícita a janela que a esteira encontra por conta própria.

**Vermelho, com a asserção antiga e a liberação atrasada em 400 ms:**

```
FAIL apps/despachante/test/vagas.int.test.ts > o worker renova a vaga enquanto o job roda…
AssertionError: expected [ Array(1) ] to deeply equal []
- []
+ [ "01a0a750-f3ca-7bcd-b22d-16779e2dc60a" ]
 ❯ apps/despachante/test/vagas.int.test.ts:321:53
 Tests  1 failed | 16 skipped (17)
```

É a mesma falha da esteira, na mesma linha e com a mesma mensagem.

**Verde, com a correção e o mesmo atraso de 400 ms ainda no lugar:** `Tests 1 passed | 16
skipped (17)`. Depois, sem o atraso, o arquivo inteiro passou 17/17 em quatro execuções
seguidas.

**A espera ainda pega falha de verdade.** O prazo do `expect.poll` é de 5 s, e os três pontos que
chamam o helper rodam com a validade padrão da vaga, de 60 s (`VALIDADE_DA_VAGA_MS`). Uma vaga que
o worker deixasse de liberar continuaria no ZSET muito além do prazo: o teste ficaria vermelho, e
não verde pelo vencimento. E `membrosDaVaga` lê o ZSET inteiro com `zrange 0 -1`, sem filtrar por
score, então membro vencido e não removido também reprova.

O helper afirma essa folga em código (`expect(timeout).toBeLessThan(VALIDADE_DA_VAGA_MS / 2)`),
com um limite conhecido: ele compara o prazo com a **constante do módulo**, não com a validade que
o teste chamador está usando. Há no arquivo um teste que sobe a bancada com validade de 1 s; se um
dia ele passar a usar o helper, a guarda continuaria passando enquanto o prazo seria cinco vezes a
validade. Rodar com a validade padrão é, portanto, condição de quem chama, e quem mexer nisso
precisa parametrizar a validade no helper.

## Correção

O que mudou: os três pontos passaram a **esperar** a vaga sair, com `expect.poll`, em vez de
conferir no instante seguinte ao estado do Postgres.

O teste continua provando a regra: a vaga tem de sair no fim do job. Se o worker deixar de
liberar, ou liberar a vaga errada, o `poll` estoura o prazo e o teste fica vermelho — a
diferença é que agora ele tolera a ordem que o executor declara, em vez de exigir que os dois
lados mudem no mesmo instante.

O `test-engineer` pediu duas garantias, para a espera não afrouxar a prova: que o verde não possa
vir do vencimento da vaga, e que uma chave errada no helper não passe em silêncio.

A primeira virou asserção no helper (`expect(timeout).toBeLessThan(VALIDADE_DA_VAGA_MS / 2)`), com
o limite descrito acima: ela cobre a validade padrão, e não a validade curta que uma bancada pode
configurar.

Para a segunda, a primeira tentativa foi esperar a chave ficar com as duas vagas ocupadas durante
a execução, e o `infra-guardian` mostrou que ela observa uma janela de uns 300 ms: no runner
carregado daria vermelho falso, que é o defeito que esta correção veio tirar. Ficou de fora. Quem
prova a chave, e de forma determinística, são os dois testes que afirmam o `zscore` dela com o job
em execução antes de esperar o fim (o do worker morto e o da retentativa): chave errada no helper
deixaria aqueles dois vazios. O comentário do helper registra isso.

Uma observação do `infra-guardian` que vale guardar: com a tolerância de 5 s, este arquivo não
prova mais que a liberação é *rápida*. Quem cobre isso é o teste "a vaga liberada acorda o
despachante", no mesmo arquivo.

O código de produção não mudou: a ordem "conclui, para a renovação, libera" é o que protege o
job de perder a vaga com o Postgres fora, e o `liberar` já é a última coisa que o worker faz.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-15 20:06:56 | 2026-09-15 20:10:03 | `test-engineer` | 1 | APROVADO | a2003ae8cbe97bf47 |
| 2026-09-15 20:15:42 | 2026-09-15 20:18:27 | `infra-guardian` | 1 | APROVADO | a4e5d4891fa21ce17 |
| 2026-09-15 20:20:26 | 2026-09-15 20:22:15 | `infra-guardian` | 2 | APROVADO | af76b4f684e379d88 |
| 2026-09-15 20:20:18 | 2026-09-15 20:35:22 | `test-engineer` | 2 | APROVADO | a4bd559ec9dcda7d1 |
