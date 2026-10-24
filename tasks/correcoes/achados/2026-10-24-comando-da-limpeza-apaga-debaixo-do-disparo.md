# Achados das revisões — `tasks/correcoes/2026-10-24-comando-da-limpeza-apaga-debaixo-do-disparo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-24 19:07:33 · `tasks/correcoes/2026-10-24-comando-da-limpeza-apaga-debaixo-do-disparo.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tools/processo/vigia.test.ts`, no helper `esperar`: depois de 50 tentativas de 100 ms ele desiste sem erro. Os casos que leem a marca falham alto, mas o caso do `GIT_DIR` de fora não confere a marca. Se o disparo atrasar mais de 5 s nesse caso, a disputa com o `rmSync` volta sem aviso. Duas saídas: fazer `rodarOComando` lançar um erro quando a espera se esgota, ou conferir a marca também nesse caso.
- Só o arquivo de teste mudou, e só código de processo, longe do caminho quente. O comando real (`.claude/skills/seguir/passos/6-tarefa.md:73` e `.claude/skills/seguir/passos/9-vigia-e-contexto.md:28`) manda a saída para `>/dev/null 2>&1`, então nenhum `nohup.out` aparece no térreo depois da marca.
- Rodei o arquivo inteiro aqui: 53 de 53 verdes. Nenhum teste chama provedor pago.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-24 19:07:36 · `tasks/correcoes/2026-10-24-comando-da-limpeza-apaga-debaixo-do-disparo.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A correção mexe só no teste. O comando dos passos (`6-tarefa.md:73`, `9-vigia-e-contexto.md:28`) e a vigia ficaram como estavam, como o documento diz.
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

O que conferi para fechar a corrida:
- O processo em segundo plano manda a saída para `>/dev/null 2>&1`, então o `nohup` não cria `nohup.out` no térreo. Depois que a marca tem conteúdo, nada mais escreve no diretório, e o `rmSync` do `finally` não corre contra mais nada.
- No caso que chama o helper duas vezes, de dentro do andar e de uma pasta dentro dele, o `rmSync(marca)` no começo de `rodarOComando` faz a segunda espera valer para a segunda rodada, e não para a marca que sobrou da primeira.
- O teste novo falhava antes da correção, como o documento afirma: com o helper síncrono, ler `disparou.txt` logo em seguida dá `ENOENT`.

Recomendações:
- `tools/processo/vigia.test.ts:419-422`: quando `esperar` estoura os 50 × 100 ms, ela não avisa nada. Se a marca nunca aparecer, o caso do `GIT_DIR` de fora (linhas 464-480) passa mesmo assim, porque não confere a marca, e a corrida com o `rmSync` volta sem ninguém ver. Seria melhor `esperar` lançar erro ao esgotar as tentativas, ou esse caso conferir também o conteúdo da marca, como os outros dois fazem.
- `tools/processo/vigia.test.ts:451-462`: o teste novo cobre o próprio helper. Pode ficar, mas se `esperar` passar a lançar erro, a proteção vale para todo caso que usa o helper e esse teste deixa de ser necessário.

Arquivos revisados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tasks/correcoes/2026-10-24-comando-da-limpeza-apaga-debaixo-do-disparo.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tools/processo/vigia.test.ts

## test-engineer · 1ª rodada · REPROVADO · 2026-10-24 19:08:17 · `tasks/correcoes/2026-10-24-comando-da-limpeza-apaga-debaixo-do-disparo.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- O helper `rodarOComando` só devolve depois que a rotina em segundo plano escreveu a marca. Assim nenhum `finally` apaga o térreo enquanto o processo solto ainda escreve nele.
- A espera vale a cada rodada. A marca deixada por uma rodada anterior não pode liberar a espera, como acontece no laço de dois `cwd` do caso do andar.
- A espera só termina quando a marca tem conteúdo, e não apenas quando o arquivo existe. O `echo > marca` primeiro cria o arquivo vazio e só depois escreve.
- Nenhum caso do bloco "o comando da limpeza" fica com espera própria que repete essa corrida.

**Cobertos:**
- O teste da tabela existe com o nome citado: `rodarOComando só devolve com a rotina já disparada: o térreo não é apagado debaixo do processo em segundo plano` (`tools/processo/vigia.test.ts:451`). Sem a espera no helper, o `readFileSync(marca)` logo depois dele cai em ENOENT. Isso é vermelho na prática, porque o processo solto ainda precisa iniciar `sleep 0` e depois o `sh` do `maestri` falso.
- A marca da rodada anterior é apagada (`:397`), então a espera do laço de dois `cwd` passa a valer para a rodada atual.
- `esperar` agora exige conteúdo na marca (`:421`).
- Os três usos do helper levam `await`. O caso do `GIT_DIR` de fora, que não esperava a marca, agora espera pelo helper.
- Depois que a marca tem conteúdo, o processo solto não escreve mais nada no térreo (a saída vai para `/dev/null`). Com isso o `rmSync` do `finally` fica sem corrida.
- A seção "Mutações" está correta: só mudou arquivo de teste, e não há cláusula de produção nova.
- Não há `.skip`, mock ou provedor pago.
- Rodei o arquivo uma vez: 53 verdes.

**Bloqueantes:**
1. **A corrida do arquivo vazio continua em outro caso do mesmo bloco.** Fica em `tools/processo/vigia.test.ts:522-523`, no caso `%s: roda no térreo, grava a pedida de agora e dispara a rotina`.
   - **O que está errado:** esse caso não usa o helper e mantém um laço próprio que para assim que o arquivo existe (`!existsSync(marca)`). Logo em seguida ele lê a marca com `readFileSync(marca)`. É exatamente a corrida que a correção diz ter fechado em `esperar` ("o `echo > marca` cria o arquivo e escreve em dois passos"). Se o laço pegar a marca entre a criação e a escrita, ele lê `''` e o `toBe('routine run Limpa o Orquestrador')` fica vermelho. É a mesma classe de falha rara de runner lento que gerou esta correção, e ela voltaria como outra correção vinda da esteira.
   - **O que está errado também:** o documento afirma que "a espera sai de quem chama e fica no helper, para nenhum caso novo esquecê-la", mas esse caso continua com a espera própria.
   - **Correção exigida:** o caso passa a usar `await rodarOComando(passo, raiz, raiz)`, mantendo as asserções da data da pedida. No mínimo, troca o laço das linhas 522-523 por `await esperar(marca)`.
   - **Por que preferir o helper:** ele também resolve um furo anterior a esta correção na linha 512. O `spawnSync` desse caso roda com `{ ...process.env }`, e não com `ambienteSemOGitDeFora()`. Dentro de um hook do git, `GIT_DIR` e `GIT_WORK_TREE` levariam a pedida para o `.processo` do térreo real, que é o problema que a correção anterior fechou só no helper.

**Recomendações:**
- `esperar` (`:419-422`) termina em silêncio quando os 5 s acabam. No caso do `GIT_DIR` de fora (`:473`), que não confere a marca, um disparo mais lento que isso volta a cair na corrida do `rmSync` sem dar aviso. Melhor `esperar` lançar erro com o caminho da marca quando o prazo acaba, para que a falha apareça como "a rotina não disparou" e não como ENOTEMPTY.
- O documento diz que a causa é "determinística". É vermelho na prática, mas depende de o processo solto ainda não ter escrito quando o `spawnSync` devolve. Vale escrever "vermelho em toda execução observada" em vez de "determinística".
- O teste novo repete o que os casos do andar e de fora do repositório já provam, porque eles leem a marca logo depois do helper. Ele vale como nome explícito da regra, e pode ficar.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tools/processo/vigia.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tasks/correcoes/2026-10-24-comando-da-limpeza-apaga-debaixo-do-disparo.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-24 19:13:42 · `tasks/correcoes/2026-10-24-comando-da-limpeza-apaga-debaixo-do-disparo.md`

VEREDITO: APROVADO

Cenários exigidos: o helper `rodarOComando` só devolve depois que a rotina disparou, com conteúdo na marca. Isso vale para todos os casos que rodam o comando da limpeza:
- a partir do andar e de uma pasta dentro dele;
- com `GIT_DIR` e `GIT_WORK_TREE` de outro repositório no ambiente;
- fora de um repositório;
- no próprio térreo.

Também ficam exigidos: se o prazo acabar, a falha sai com o caminho da marca, e não como ENOTEMPTY no `finally`; e todos os casos rodam com o ambiente sem as variáveis do git de fora.

Cobertos:
- **Correção exigida 1, feita.** O caso `%s: roda no térreo, grava a pedida de agora e dispara a rotina` (`tools/processo/vigia.test.ts:505-524`) agora chama `await rodarOComando(passo, raiz, raiz)`. As asserções da data da pedida continuam, e a da marca também (linha 520). O laço próprio saiu, e com ele o `existsSync(marca)` e o `{ ...process.env }`: o caso herda `ambienteSemOGitDeFora()` do helper (linha 404).
- **Primeira recomendação, aplicada.** `esperar` agora lança `a rotina não disparou em 5 s: sem conteúdo em <marca>` (linha 424). Antes, a espera só deixava o tempo passar sem acusar nada.
- **Segunda recomendação, aplicada.** No documento, "determinística" virou "vermelho em toda execução observada".
- **Sem laços de espera soltos.** No arquivo só resta o laço de dentro de `esperar` (linha 422). O `{ ...process.env }` das linhas 245 e 285 está em outros blocos, que testam a vigia e não o comando da limpeza, e esta correção não mexeu neles.
- **Mutações.** A tarefa só mudou arquivo de teste, então o documento não precisa de bloco de mutação. O teste que reproduz o problema continua sendo `rodarOComando só devolve com a rotina já disparada…` (linhas 454-465).
- **Sem `.skip`, sem teste comentado, sem provedor de IA.**
- Rodei `npx vitest run tools/processo/vigia.test.ts` uma vez: 53 de 53 verdes.

Bloqueantes: nenhum.

Recomendações:
- O helper `rodar` dos blocos da vigia (linha 245) e o `ambienteGit` da linha 285 ainda usam `{ ...process.env }`. Se um dia alguém rodar esses testes de dentro de um hook do git, eles herdam o `GIT_DIR` do repositório real. Isso fica para uma correção futura; não é desta tarefa.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tools/processo/vigia.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tasks/correcoes/2026-10-24-comando-da-limpeza-apaga-debaixo-do-disparo.md

## revisor-geral · 2ª rodada · APROVADO · 2026-10-24 19:13:46 · `tasks/correcoes/2026-10-24-comando-da-limpeza-apaga-debaixo-do-disparo.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A correção mexe só no arquivo de teste, como o documento declara. O comando dos passos e a vigia não mudaram.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

As duas mudanças desta rodada foram feitas:
- **Recomendação da 1ª rodada:** `esperar` agora lança erro quando o prazo acaba, com o caminho da marca na mensagem (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-decisao-soma-conformidade/tools/processo/vigia.test.ts:421-424`).
- **Exigência do `test-engineer`:** o caso `roda no térreo, grava a pedida de agora e dispara a rotina` passou a chamar `rodarOComando` (`vigia.test.ts:510`). Com isso ele herda a espera pelo conteúdo e roda com `ambienteSemOGitDeFora()`. O laço e o preparo que ele tinha antes saíram.
- O documento acompanha as duas mudanças: o parágrafo "Correção" está atualizado e a tabela "Recomendações sem aplicar" diz por que cada item foi recusado.

Recomendações:
- `vigia.test.ts:520`: o caso monta `join(raiz, 'disparou.txt')` à mão, mas o helper já devolve esse caminho em `marca`. Basta pegar `marca` na desestruturação (`const { resultado, marca } = ...`), como os outros casos do bloco fazem. Assim o nome do arquivo fica escrito num lugar só.
- `vigia.test.ts:395`: o comentário diz que o helper "só devolve com ele terminado", mas ele só espera a marca ter conteúdo. Não espera o processo em segundo plano terminar. O comentário deveria dizer exatamente isso, para ninguém contar com uma garantia que o código não dá.
