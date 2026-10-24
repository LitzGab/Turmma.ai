# Correção — o teste do comando da limpeza apaga o térreo debaixo do disparo em segundo plano (ENOTEMPTY na esteira)

**Origem:** esteira run 40133872609 (develop, pouso da M5, `51eef20`), job `verificar`, etapa unidade.
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`, `infra-guardian`
<!-- Vieram no PEDIDO do Orquestrador. O `revisor-geral` entra também pelo passo 5 de `corrigir`: a correção toca `tools/processo/`. -->

## Sintoma

`tools/processo/vigia.test.ts › o comando da limpeza grava a pedida que a vigia lê (RF27) › 9-vigia-e-contexto.md: com GIT_DIR e GIT_WORK_TREE de outro repositório no ambiente de quem roda, a pedida vai para o térreo do teste` falhou na esteira com
`ENOTEMPTY: directory not empty, rmdir '/tmp/comando-git-de-fora-0et0v0'`, no `rmSync(terreo, …)` do `finally`. 1 falha em 6945. Localmente, 40 execuções seguidas do caso passam: é corrida, e o runner da esteira é mais lento.

## Fora desta correção

Nada: a árvore estava limpa (o pedido trouxe "Arquivos da tarefa em curso: nenhum").

## Causa

O comando da limpeza (`passos/6-tarefa.md` e `passos/9-vigia-e-contexto.md`) termina com `nohup setsid sh -c 'sleep 25; maestri routine run …' &`: o disparo da rotina é um processo **em segundo plano**, que sobrevive ao `spawnSync`. No teste, o `sleep 25` vira `sleep 0` e o `maestri` falso escreve `disparou.txt` **dentro do térreo do teste**. `rodarOComando` devolvia na hora e o caso do `GIT_DIR` de fora (o único dos quatro que usa o helper e **não** espera a marca) ia direto ao `finally`: o `rmSync` recursivo do térreo corria contra o `echo > disparou.txt` do processo solto, que cria uma entrada nova no diretório no meio da remoção, e o `rmdir` final encontra o diretório não vazio. Nos outros casos a espera da marca já existia, cada um por conta própria; este não a tinha, e o helper deixava a espera a cargo de quem o chama. A falha é desta correção anterior (`2026-10-24-processo-seguro`), que criou o caso.

## Teste que reproduz

`tools/processo/vigia.test.ts`, no bloco do comando da limpeza:

| Teste | Antes |
|---|---|
| `rodarOComando só devolve com a rotina já disparada: o térreo não é apagado debaixo do processo em segundo plano` | vermelho: logo depois do helper a marca ainda não existe |

Não dá para provocar o `ENOTEMPTY` em si de forma determinística: depende de o `rmSync` e do `echo` do processo solto caírem na mesma fração de milissegundo (40 execuções locais não o produziram). O que o teste prova é a causa: o helper volta antes de o disparo acontecer (`ENOENT` em `disparou.txt` logo depois do helper, vermelho em toda execução observada; verde depois da correção). Evidência da estabilidade: o bloco do comando da limpeza rodado dez vezes seguidas, dez verdes, e o arquivo inteiro (53 testes) verde.

## Correção

`tools/processo/vigia.test.ts`: `rodarOComando` passa a ser assíncrono e só devolve com a rotina disparada (espera a marca, com conteúdo), depois de apagar a marca de uma rodada anterior. A espera sai de quem chama e fica no helper, para nenhum caso novo esquecê-la. `esperar` passa a exigir conteúdo na marca, não só o arquivo (o `echo` cria e escreve em dois passos). Os quatro casos que rodam o comando passam a usá-lo (`await`), inclusive `roda no térreo, grava a pedida de agora e dispara a rotina`, que tinha laço próprio (parava no arquivo existente, sem esperar o conteúdo) e rodava com `process.env` em vez de `ambienteSemOGitDeFora()`. `esperar` lança `a rotina não disparou em 5 s: sem conteúdo em <marca>` quando o prazo acaba, para a falha não voltar como ENOTEMPTY.

Só o teste muda: o comando dos passos e a vigia ficam como estão.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | O teste `rodarOComando só devolve com a rotina já disparada…` fica redundante se `esperar` passar a lançar erro | Recusada, fica: o `test-engineer` (1ª) diz que ele "vale como nome explícito da regra, e pode ficar", e é ele que prova a causa em vermelho antes da correção |
| test-engineer (1ª) | O teste novo repete o que os casos do andar e de fora do repositório já provam | Recusada, fica: mesmo motivo da linha acima |
| infra-guardian (1ª), revisor-geral (1ª) | O comando real manda a saída para `>/dev/null 2>&1`, sem `nohup.out` no térreo | Observação de conferência, sem pedido de mudança |
| revisor-geral (2ª) | `vigia.test.ts:520`: o caso monta `join(raiz, 'disparou.txt')` à mão, e o helper já devolve esse caminho em `marca` | `TODO.md` (X7, acabamento de `vigia.test.ts`): não muda comportamento, e um ciclo de revisão só para isso custa mais que o ganho |
| revisor-geral (2ª) | `vigia.test.ts:395`: o comentário diz que o helper "só devolve com ele terminado", mas ele só espera a marca ter conteúdo | `TODO.md`, na mesma linha: texto de comentário num arquivo que a próxima correção da vigia já toca |
| test-engineer (2ª) | `vigia.test.ts:245` (helper `rodar`) e `:285` (`ambienteGit`) ainda usam `{ ...process.env }` e herdariam o `GIT_DIR` de um hook do git | `TODO.md`, na mesma linha: blocos da vigia que esta correção não toca |

## Mutações

Só mudou arquivo de teste (`tools/processo/vigia.test.ts`); não há código de produção com cláusula nova para mutar.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-24 19:07:09 | 2026-10-24 19:07:33 | `infra-guardian` | 1 | APROVADO | a0dfcf6adc4bb4a54 |
| 2026-10-24 19:07:08 | 2026-10-24 19:07:36 | `revisor-geral` | 1 | APROVADO | a457d2b3cfc631fd3 |
| 2026-10-24 19:07:07 | 2026-10-24 19:08:17 | `test-engineer` | 1 | REPROVADO | a3bc1a9dab07575a3 |
| 2026-10-24 19:13:11 | 2026-10-24 19:13:42 | `test-engineer` | 2 | APROVADO | a162cb09d5fbf1ccc |
| 2026-10-24 19:13:17 | 2026-10-24 19:13:46 | `revisor-geral` | 2 | APROVADO | af5d1502217482d83 |
