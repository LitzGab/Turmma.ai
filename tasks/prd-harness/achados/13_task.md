# Achados das revisões — `tasks/prd-harness/13_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-23 22:38:36 · `tasks/prd-harness/13_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A tarefa só mexe na ferramenta de processo (`tools/processo/`), que decide quais revisores um commit precisa. Ela não toca migration, entidade, DTO, rota, storage nem envio a provedor de IA.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: não se aplica, a tarefa não cria nem altera endpoint.

Logs: limpos. As saídas novas imprimem só nomes de revisor (`linhaDosObrigatorios`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/portao.ts`) e caminhos de arquivo. `conteudoDoHead` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/comando-git.ts`) descarta o stderr do git e devolve `null` quando o arquivo não existe. Não imprime conteúdo de arquivo.

Auditoria: não se aplica, nenhuma das ações que a regra 20 item 10 lista é tocada.

Envio externo: nenhum.

Seed/fixture: sintético. As fixtures são `export const a = 1`, `// regra 20`, uma string de 2 MB de `x`, e o git de teste roda com `user.email=t@t`. `e2e/aluno-tutor.spec.ts` aparece só como nome de caminho.

Efeito sobre a regra 20: a mudança só aumenta a cobertura. Antes, o `privacy-guardian` só era obrigatório quando alguém o marcava. Agora todo arquivo de `apps/`, `packages/`, `e2e/`, `tools/guardas/` e `tools/testes/` passa a exigi-lo, salvo as exceções aprovadas em `tabela-de-guardioes.md`. Ele também é exigido:
- quando o arquivo cita "regra 20" ou "LGPD", no índice ou no HEAD (o guardião continua exigido mesmo se o commit apagar a citação);
- em `*.repository.ts`, `*.controller.ts`, `*.gateway.ts`, `*.service.ts` e em arquivo com `@SemEscopo(`, mesmo dentro de exceção.

Os marcados no documento continuam obrigatórios, porque a lista final é a união das duas. Rodei `harness/guardioes.test.ts` e os 47 casos passaram.

Bloqueantes: nenhum.

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/guardioes-por-caminho.ts:66`: a exceção é comparada só pelo começo do caminho (`startsWith`). Uma exceção que nomeia um arquivo também vale para qualquer arquivo cujo nome comece igual. Exemplos: `apps/web/src/tema.tsx` cairia na exceção de `tema.ts` e não pediria guardião nenhum, nem o `privacy-guardian`; `apps/web/src/estilos.css.ts` cairia em `estilos.css` e pediria só o `conformidade-reviewer`. Isso segue o "prefixo sem glob" da tabela, por isso não bloqueia. Mas o caso em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/guardioes.test.ts:108` promete que "o vizinho de nome parecido" não casa e só testa `tema-novo.ts`, que nunca casaria. Sugestão para o `/retro`: quando o prefixo não termina em `/`, exigir o caminho igual, e testar `tema.tsx`.
2. A exceção `apps/web/src/componentes/ui/` (só `conformidade-reviewer` e `infra-guardian`) tira o `privacy-guardian` de componente genérico. Isso foi decidido na tabela. Fica registrado para o `/retro`: um componente de `ui/` que passe a mostrar dado de pessoa (nome, matrícula) só volta a exigir o `privacy-guardian` se citar a regra ou se alguém o marcar.

Pergunta de fechamento: não se aplica a esta tarefa. Ela não muda o que o sistema guarda sobre um aluno nem para onde isso vai.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-23 22:38:40 · `tasks/prd-harness/13_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/portao.ts:396`: o docstring da `decidirCommit` ainda diz "O `conteudoDe` só lê o documento da tarefa." Desde esta tarefa ele também lê o índice e o HEAD dos arquivos do commit, para achar o `@SemEscopo(` e a citação de regra. O comentário agora descreve errado o que o código faz e deve ser corrigido.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/hook-git.ts:24` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/comando-git.ts:95`: o mesmo limite de 64 MB está declarado duas vezes, com nomes diferentes (`LIMITE_DE_LEITURA` e `LIMITE_DE_LEITURA_DO_GIT`). O ideal é exportar um só do `comando-git.ts` e importar no `hook-git.ts`, que já importa desse módulo.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/portao-local.ts:86-96`: o subcomando `revisores` agora chama `arquivosAlterados(raiz)` três vezes seguidas. Cada chamada roda o git de novo, e as três podem divergir se a árvore mudar no meio. Basta uma constante local.
- O subcomando `revisores` e o portão da tarefa calculam a lista a partir dos arquivos alterados da árvore, mas o commit cobra só os arquivos que leva. A lista impressa pode pedir mais guardiões do que o commit vai cobrar, nunca menos. Isso está escrito na `techspec.md` §5(b), mas o comentário em `portao-local.ts:85` ("é a lista que o commit vai cobrar") afirma que as duas listas são iguais. Vale ajustar a frase.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-23 22:38:49 · `tasks/prd-harness/13_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma. A tarefa não cria migration, schema Drizzle nem tabela de domínio. Os arquivos alterados são todos de `tools/processo/` e de `tasks/prd-harness/`.

Queries verificadas: nenhuma query de banco. O que muda são as leituras do git: `conteudoDoHead` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/comando-git.ts:98`, `conteudoDoIndice` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/hook-git.ts:71` e `conteudoDoDisco` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/portao.ts:410`. Também conferi a regra que define quem precisa revisar o commit, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/guardioes-por-caminho.ts`. Os arquivos `*.repository.ts`, `*.controller.ts`, `*.gateway.ts` e `*.service.ts`, e os que têm `@SemEscopo(` no HEAD ou no índice, nunca caem numa exceção e sempre pedem o `tenancy-guardian`. As pastas do padrão pedem os quatro guardiões, e uma pasta nova dentro delas já nasce protegida. Não há endpoint, não há `escolaId` vindo do cliente e nenhum `@SemEscopo()` novo.

Teste de isolamento: presente e efetivo, no sentido que cabe a esta tarefa. O teste de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/revisoes.test.ts` (no diff, "repository alterado sem tenancy-guardian marcado e sem rodada dele é recusado") quebra se a união com `guardioesDoCaminho` for tirada de `obrigatoriosDoCommit`. Os casos de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/guardioes.test.ts` nas linhas 114 e 126 quebram se o sufixo ou o `@SemEscopo(` deixarem de anular a exceção. Rodei os dois arquivos: 277 testes passaram.

Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/comando-git.ts:109`: `arquivosPreparados` usa `git diff --cached --name-only` sem `--no-renames`. No caminho do `PreToolUse`, quando um arquivo é renomeado, só o nome novo aparece. Mover, por exemplo, um arquivo de escopo de `apps/api/src/` para fora das cinco pastas, ou para dentro de uma exceção, perde o caminho de origem, e o `tenancy-guardian` deixa de ser exigido. O git hook nativo usa `--no-renames` e cobre as sessões de papel, mas o Orquestrador só passa pelo `PreToolUse`. Vale alinhar e acrescentar `--no-renames` aqui.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/guardioes-por-caminho.ts:52-53`: hoje só o sufixo do arquivo e o `@SemEscopo(` puxam os quatro guardiões numa exceção. Vale considerar `escolaId` e `anoLetivoId` no texto do arquivo como gatilho do `tenancy-guardian`. Assim, um componente em `componentes/ui/` ou `galeria/` que comece a montar uma consulta com escopo não fica sem auditoria de isolamento.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/hook-git.ts:24` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/comando-git.ts:95`: o limite de 64 MB está duplicado nos dois arquivos. Basta exportar uma constante só.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-23 22:38:59 · `tasks/prd-harness/13_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. A tarefa 13.0 só mexe no processo (`tools/processo/`) e não toca em `Nota`, correção, tutor, agente nem tela. Todos com autor humano? A pergunta não se aplica, porque esta tarefa não cria nem altera nenhum caminho de escrita.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. Nenhum fluxo de saída de IA mudou.
Supervisão do tutor: ok. A tarefa não toca no tutor.
Autonomia declarada e visível: sim. Nenhum agente nem nível de autonomia mudou.

Bloqueantes: nenhum

O que verifiquei, do ponto de vista da regra 70:
- **Mudou quem é obrigado a revisar.** Antes, o commit exigia só os revisores marcados na tarefa. Agora também exige os que o caminho alterado pede. O `conformidade-reviewer` passa a ser cobrado em todo arquivo de `apps/`, `packages/`, `e2e/`, `tools/guardas/` e `tools/testes/`, inclusive `apps/api` e `apps/worker`, onde estão nota, correção, tutor e jobs. Isso reforça a regra 70 em vez de afrouxá-la (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/guardioes-por-caminho.ts:28`).
- **A exceção nunca tira um revisor marcado.** `obrigatoriosDoCommit` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/portao.ts:359`) junta os marcados com os do caminho. Os arquivos que terminam em `.repository.ts`, `.controller.ts`, `.gateway.ts` ou `.service.ts`, e os que têm `@SemEscopo(`, nunca caem em exceção e pedem os quatro revisores. Citar "regra 70" no índice ou no HEAD soma o `conformidade-reviewer`, e ler o HEAD impede que apagar o comentário tire o revisor.
- **Exceções sem o `conformidade-reviewer`.** São `apps/despachante/` (T P I), `infra/` (I P), `tema.ts` e os testes de cor (nenhum), e `vite.config.ts`, `nome-dos-chunks.ts` e `rebaixar-cor.ts` (I). Procurei em `apps/despachante/src` e não há menção a nota, correção, tutor nem aluno; ele só leva job do banco ao Redis. As exceções de interface que podem esconder a marca de IA ou a faixa do Tutor mantêm o `conformidade-reviewer`: `componentes/ui/` (C I), `componentes/ui/ia/` (P C I), `estilos.css` (C) e `galeria/` (P C).
- **Testes.** `npx vitest run --project unidade tools/processo/harness/guardioes.test.ts tools/processo/revisoes.test.ts` passou: 277 testes em 2 arquivos. Eles provam os casos da tabela, que nenhuma exceção está morta, o `@SemEscopo(` no índice e no HEAD, a citação "regra 70", a junção dos revisores e o bloqueio pela `decidirCommit`.
- **`docs/regulacao.md`** não mudou.

Recomendações:
- `apps/despachante/` dispensa o `conformidade-reviewer` porque hoje não sabe o que é nota. Se um dia ele passar a interpretar o conteúdo do job, uma mudança que mexa em nota ou correção passaria sem esse revisor, salvo se citar "regra 70". Duas saídas: uma guarda que proíba o despachante de importar módulo de nota, correção ou tutor do `packages/nucleo`, ou somar o `conformidade-reviewer` quando aparecer `lancadaPor`, `Nota` ou `Correcao` no texto.
- Para a 14.0: `tools/demonstracao/` (`gerar-material.ts`, material gerado por IA para a demonstração da D71) cai em "o resto de `tools/`" e não pede nenhum revisor. Vale dar a ele P C, como já têm `tools/vitrine/` e `tools/ia/`.
- `LIMITE_DE_LEITURA_DO_GIT` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/comando-git.ts:95`) e `LIMITE_DE_LEITURA` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/hook-git.ts:24`) são o mesmo número de 64 MB escrito duas vezes. É melhor exportar um só, para os dois não ficarem diferentes no futuro.

## test-engineer · 1ª rodada · APROVADO · 2026-10-23 22:40:23 · `tasks/prd-harness/13_task.md`

**VEREDITO: APROVADO**

**Cenários exigidos** (tabela da 13.0 e "O teste da tabela" de `tabela-de-guardioes.md`, sem as linhas do RF16):
- todo arquivo versionado nas cinco pastas pede os quatro; exceção morta fica vermelha; um caso por exceção
- os quatro sufixos em `componentes/ui/` e em `galeria/`
- `@SemEscopo(` no índice, só no HEAD, ou em nenhum dos dois
- a citação, um caso por termo e arquivo da tabela; sem citação; citava no HEAD e não cita no índice
- `AvisoFila.tsx` e `DialogoDeConfirmacao.tsx`
- `leitura-do-titular.ts`, `estrutura-isolamento.int.test.ts`, `aluno-tutor.spec.ts` e uma pasta inventada
- repository sem `tenancy-guardian` pela `decidirCommit`: recusado, e com a rodada passa
- marcado e não pedido pelo caminho continua obrigatório
- o portão imprime a lista unida
- os acréscimos do `cenarios.md`: o guardião sai dos arquivos do commit e não da árvore; HEAD, índice e disco lidos de onde o nome diz, arquivo de mais de 1 MB incluído; o git hook de verdade cobra o `tenancy-guardian` que ninguém marcou

**Cobertos:** todos.
- `tools/processo/harness/guardioes.test.ts`:
  - :48 todo arquivo versionado, com piso de mais de 300 arquivos para a lista vazia não passar verde
  - :88 e :92 um caso por exceção e a exceção morta; o :98 ainda confere a constante do código contra os literais do teste
  - :101 o prefixo mais longo, com `AvisoFila` e `DialogoDeConfirmacao`
  - :114 o `it.each` dos sufixos; :120 o sufixo só vale no fim do nome
  - :126 o `@SemEscopo(` nos três casos, mais o lado `null`
  - :139 a :183 as citações com os literais da tabela, mais maiúscula, espaço duplo, `regra 100` e o caso HEAD contra índice
  - :69 os quatro nomes da tabela e a pasta inventada; :190 a união de vários arquivos
- `tools/processo/revisoes.test.ts`:
  - :460 repository recusado e depois aceito; :470 cada guardião faltante, um de cada vez
  - :477 o veto do guardião do caminho vale; :483 marcado e não pedido
  - :506 o commit leva o guardião, não a árvore
  - :514 HEAD, índice e disco com três versões diferentes, mais o arquivo de 2 MB
  - :532 e :386 a lista unida, na função e no processo do portão e do subcomando `revisores`
- `tools/processo/hook-git.int.test.ts`:
  - :94 o git hook cobra o `tenancy-guardian` só pelo caminho, sem a rodada recusa e com ela passa
  - :113 o índice e o HEAD vêm de onde o nome diz, mais o arquivo de 2 MB

Conferi os blocos de mutação contra o `git diff`. Toda cláusula nova de `guardioes-por-caminho.ts`, `portao.ts`, `portao-local.ts`, `hook-git.ts` e `comando-git.ts` tem bloco, e cada bloco aponta um caso que chega à cláusula. Nenhum `.skip`, `.only` ou `.todo`. Não há mock da regra: `conteudoDe` é injetado na unidade e lido do git de verdade na integração. Não há IA nem concorrência em jogo, porque são funções puras sobre a lista de arquivos. Rodei a unidade (`guardioes.test.ts` e `revisoes.test.ts`, 277 testes) e o `hook-git.int.test.ts` (50 testes): tudo verde.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Rename no `PreToolUse`.** `tools/processo/comando-git.ts`, em `arquivosPreparados`, roda `git diff --cached --name-only` sem `--no-renames`. Mover `apps/api/src/x.ts` para `apps/web/src/galeria/x.ts` leva ao `PreToolUse` só o caminho novo (P C). O git hook, que usa `--no-renames` em `hook-git.ts:52`, cobra os quatro, então a barreira final segura. Mesmo assim os dois julgam diferente, e falta teste de rename de pasta do padrão para uma exceção pelo git hook. Vale um caso no `hook-git.int.test.ts` e o `--no-renames` também em `arquivosPreparados`.
2. **Commit sem marca não passa pelos guardiões em duas das cinco pastas.** `PASTAS_DE_CODIGO` (`portao.ts:62`) não tem `tools/guardas/` nem `tools/testes/`. Um commit que leva só essas pastas, sem "(tarefa N.0)", não cai em `bloqueioDoCommitSemDocumento` e escapa da cobrança, embora o RF15 as conte no padrão. Conferir se a 14.0 (RF16) ou a esteira da 12.0 fecha esse caminho.
3. **O estado do Orquestrador não mostra a lista unida.** `tools/processo/estado.ts:383` entrega `obrigatorios` só com os marcados. A Mesa lê o subcomando `revisores`, que já está certo; vale citar na 18.0 para o texto das skills não prometer outra lista.
4. **Arquivo grande demais some em silêncio.** Um arquivo de exceção acima de 64 MB, ou que o `git show` não lê, vira `null` sem aviso, e a citação dele se perde. É um caso remoto; um registro no comentário basta.
5. **Caminho com espaço.** `guardioes.test.ts:9` monta a raiz com `new URL(...).pathname`, que codifica espaço como `%20`. Num checkout com espaço no caminho o `git ls-files` quebra; `fileURLToPath` resolve.
6. **Dois blocos ficam vermelhos por erro de execução.** O que apaga `if (!entrada) return []` e o que troca o filtro por `=> true` derrubam o teste com um `TypeError`, e não pela asserção do conjunto. Aceitáveis, porque sem a cláusula o código quebra de fato, mas convém saber que é esse o motivo do vermelho.
7. **Asserção a inverter na 14.0.** `guardioes.test.ts:64` afirma que `tools/processo/x.ts` citando a regra não pede ninguém. O comentário avisa que é provisório; a 14.0 precisa inverter o caso para P, como a tabela pede.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/guardioes-por-caminho.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/guardioes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/revisoes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/hook-git.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/portao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/comando-git.ts

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-23 22:51:42 · `tasks/prd-harness/13_task.md`

VEREDITO: APROVADO

Esta rodada conferiu só o que mudou desde a 1ª rodada, pelo diff em `/tmp/claude-1000/-home-joaquimdp-Documentos-git--maestri-floors-educaia--specharness--l1/502f09a0-8a66-4baa-9e9f-e5ab18bfa5fb/scratchpad/diff-13-r1-r2.txt`. A 1ª rodada não exigiu correção.

Campos pessoais tocados: nenhum. A mudança é só na ferramenta de processo: o portão do commit, o git hook e a tabela que diz qual guardião cada caminho pede.
Fora da tabela de dados do docs/lgpd.md: nada. Não há migration, entidade nem DTO.
Autorização por objeto: não se aplica, porque nenhuma rota do produto foi criada nem alterada.
Logs: limpos. O que se escreve na saída são nomes de revisor e caminhos de arquivo, nunca dado de pessoa.
Auditoria: não se aplica. Nenhuma das ações que a regra 20, item 10, manda auditar foi tocada.
Envio externo: nenhum.
Seed/fixture: sintético. Os testes criam repositórios temporários com conteúdo inventado (`export const a = 1`, `'x'.repeat(...)`), e o `user.email=t@t` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/revisoes.test.ts:2117` é só configuração do git de teste, não um e-mail real.

O que o diff muda, do ponto de vista da regra 20:
- **O guardião não se perde ao mover um arquivo.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/comando-git.ts:96` passou a listar os arquivos do commit com `--no-renames`. Assim, quem move um arquivo para uma pasta isenta ainda leva em conta o caminho de onde ele saiu, e o guardião que ele pedia continua sendo cobrado. Isso reforça a garantia de que o `privacy-guardian` e o `tenancy-guardian` sejam chamados. Dois testes provam isso:
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/revisoes.test.ts:2117`
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/hook-git.int.test.ts:261`, que mostra o commit recusado sem o guardião e aceito com ele.
- **A lista do portão local não pede menos que o commit.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/portao-local.ts:86`, a árvore é lida uma vez só, então a lista de obrigatórios, a caducidade e as mutações falam dos mesmos arquivos. A lista calculada ali pode pedir mais guardiões do que o commit vai cobrar, nunca menos.
- **O limite de leitura do git agora é um só.** O `hook-git.ts` usa o valor exportado de `comando-git.ts`. O que muda no comportamento: se o `git show` falhar, a citação de regra que estava no HEAD deixa de ser vista. O guardião que ela pedia continua vindo pelo índice, e essa limitação agora está escrita no comentário de `comando-git.ts:76-80`.
- **A minha recomendação da 1ª rodada tem destino.** Hoje um arquivo como `apps/web/src/tema.tsx` cai na exceção de `tema.ts`, porque a tabela compara só o começo do nome, e não pede ninguém. A correção foi mandada para a tarefa 14.0, que mexe na mesma tabela, ou para o `/retro`. Está registrada na tabela de destinos de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/13_task.md`.

Bloqueantes: nenhum.

Recomendações:
- Quando o `git show` do HEAD falha, o código engole o erro sem avisar. Vale um aviso curto na saída, só com o caminho do arquivo e sem conteúdo, para que a perda da citação de regra não passe despercebida. Isso é para o `/retro`, não bloqueia.
- Na 14.0, confirmar que a comparação por começo do nome (`tema.ts` contra `tema.tsx`) foi de fato corrigida e testada, como ficou registrado.

Pergunta de fechamento: não se aplica a esta tarefa. Ela não guarda nem envia nada de aluno; só reforça que os guardiões de privacidade e de isolamento sejam cobrados no commit.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-23 22:51:47 · `tasks/prd-harness/13_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma. O diff da 2ª rodada não cria migration, schema nem tabela de domínio.

Queries verificadas: nenhuma query de domínio, repository nem endpoint. O que mudou é ferramenta de processo, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/`. Conferi o efeito dessas mudanças sobre a cobrança do `tenancy-guardian`:
- `comando-git.ts:114`: `arquivosPreparados` passou a usar `--no-renames`, como o hook nativo já fazia em `hook-git.ts:49`. Com isso, quem move um `*.repository.ts` para um caminho de exceção não deixa mais de ser cobrado pelo `tenancy-guardian`. A mudança aperta a regra e não abre brecha.
- `portao-local.ts:86-99`: a árvore é lida uma vez só. A lista de obrigatórios continua tirada de todos os alterados, então ela nunca pede menos guardiões do que o commit cobra.
- `hook-git.ts`: o limite de leitura agora vem de `comando-git.ts` em vez de uma constante própria. O comportamento não mudou.

Teste de isolamento: presente e efetivo.
- O novo teste em `hook-git.int.test.ts:261-278` move `apps/codigo.ts` para `apps/web/vite.config.ts` e exige rodada do `tenancy-guardian`. Ele passa por `hook-git.ts:49`: se o `--no-renames` sair dali, o teste quebra.
- O teste em `revisoes.test.ts:2117-2125` cobre `arquivosPreparados`, e o bloco de mutação novo em `13_task.md` prova que ele quebra sem o `--no-renames`.
- Rodei os três arquivos afetados: 329 testes passaram.

Correções exigidas da rodada anterior: nenhuma havia.

Bloqueantes: nenhum.

Recomendações:
- Fica mantida a recomendação da 1ª rodada, já registrada em `13_task.md` para o `/retro`: tratar `escolaId` e `anoLetivoId` no texto de um arquivo dentro das exceções como gatilho do `tenancy-guardian`.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-23 22:51:54 · `tasks/prd-harness/13_task.md`

VEREDITO: APROVADO

Esta é a 2ª rodada. Na 1ª a tarefa saiu sem bloqueante e sem correção exigida. Conferi o diff de 79027e9 a 825ade7. A árvore de trabalho é igual ao 825ade7 em `guardioes-por-caminho.ts`, `guardioes.test.ts`, `comando-git.ts` e `portao-local.ts`. A tabela de guardiões por caminho não mudou desde a 1ª rodada.

Caminhos de escrita em Nota: nenhum. O diff só mexe no código do processo (`tools/processo/`) e em documentos da tarefa, sem tocar em `Nota`, `Correcao`, tutor, agente ou tela. Todos com autor humano? Não se aplica.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok (não há fluxo de IA no diff).

Supervisão do tutor: ok (não se aplica).

Autonomia declarada e visível: sim. Nada mudou nisso.

O que importa para a regra 70 nesta rodada:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/comando-git.ts:114` passa a usar `--no-renames`, igual a `hook-git.ts:49`. Com isso, mover um arquivo que pedia o `conformidade-reviewer` para uma pasta isenta não tira mais o revisor da cobrança, porque o caminho de origem também conta. Dois testes provam isso: `revisoes.test.ts` ("o arquivo movido no índice traz os dois caminhos") e `hook-git.int.test.ts:261` (o commit é recusado sem o guardião e aceito com ele). Há também um bloco de mutação novo em `13_task.md` para o `--no-renames`. A mudança fortalece a cobrança do revisor, não a enfraquece.
- As duas recomendações que dei na 1ª rodada estão anotadas na tabela de destino de `13_task.md`:
  - `apps/despachante/` dispensar o `conformidade-reviewer` foi para o `/retro`.
  - `tools/demonstracao/` sem revisor foi para a 14.0.

Bloqueantes: nenhum.

Recomendações:
1. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/portao-local.ts:85-89`, o comentário diz que a lista do subcomando `revisores` "pode pedir mais guardiões do que o commit vai cobrar, e nunca menos". Mas essa lista vem de `arquivosAlterados` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/caducidade.ts:237-238`), que pula o caminho de origem de um rename (`R`/`C`) e o arquivo apagado (`D`). O commit cobra os dois, porque usa `--no-renames`.
   - Consequência: num arquivo movido, a Mesa pode não chamar o `conformidade-reviewer` que o commit depois vai exigir. A regra não fica sem guarda, porque o hook barra o commit.
   - O que fazer: incluir a origem na lista ou corrigir o comentário. Vai para a 14.0 ou o `/retro`.
2. Seguem pendentes, sem ação nesta tarefa, as duas recomendações da 1ª rodada:
   - a guarda de `apps/despachante/` contra importar nota, correção ou tutor (no `/retro`);
   - `tools/demonstracao/` pedir P e C (na 14.0).

## test-engineer · 2ª rodada · APROVADO · 2026-10-23 22:52:24 · `tasks/prd-harness/13_task.md`

VEREDITO: APROVADO

Cenários exigidos (2ª rodada, só o diff desde 79027e9 e o que ele afeta):
- O arquivo movido no índice entra com o caminho de origem e o de destino (`--no-renames` em `arquivosPreparados`).
- O commit de verdade, com um arquivo movido do padrão para uma exceção, continua pedindo o guardião que o caminho de origem pedia.
- Os blocos de mutação ajustados ao texto novo do código (`alterados` no `portao-local.ts`, `LIMITE_DE_LEITURA_DO_GIT` no `hook-git.ts`) ainda batem com a linha real.
- Trocar a forma de achar a `RAIZ` no `guardioes.test.ts` não muda o que o teste cobre.

Cobertos:
- O teste `revisoes.test.ts › o arquivo movido no índice traz os dois caminhos, o de origem e o de destino` move um arquivo sem mudar o conteúdo, então a semelhança é de 100%. Sem o `--no-renames`, o git (que detecta rename por padrão) devolveria só o destino, e o `toEqual` com os dois caminhos ficaria vermelho. O bloco de mutação novo, em `tasks/prd-harness/13_task.md:611-616`, tem essa cláusula e esse teste.
- `hook-git.int.test.ts › o arquivo movido do padrão para uma exceção ainda pede os quatro` testa os dois lados com um git de verdade. Sem rodada do `tenancy-guardian`, o commit é recusado com a mensagem certa; com a rodada, o commit passa. O `--no-renames` do `hook-git.ts:49` já existia antes desta tarefa, e este teste passa a prová-lo: sem ele, `apps/web/vite.config.ts` pediria só I, e o commit passaria sem o `tenancy-guardian`.
- Os blocos de mutação ajustados batem com o texto atual: `portao-local.ts`, com `alterados`, em `13_task.md:553`; `hook-git.ts`, com `maxBuffer: LIMITE_DE_LEITURA_DO_GIT`, em `13_task.md:593`.
- Passar a ler `arquivosAlterados` uma vez só no `portao-local.ts` não muda o que ele faz. A mutação dessa linha continua apontando para `o portão da tarefa e o subcomando revisores imprimem a lista unida`.
- Trazer o `LIMITE_DE_LEITURA_DO_GIT` do `comando-git.ts` para o `hook-git.ts` não muda o que o código faz, e continua coberto pelo teste `o conteúdo do índice e o do HEAD vêm de onde o nome diz`.
- As recomendações da 1ª rodada, as minhas incluídas, estão registradas na tabela com destino (14.0, 18.0 ou `/retro`). Uma delas está marcada como informativa, sem ação, e eu concordo.
- Rodei `npx vitest run` em `revisoes.test.ts`, `hook-git.int.test.ts` e `harness/guardioes.test.ts`: 3 arquivos e 329 testes passaram. Não há `.skip`, mock que esconda a regra nem chamada a provedor de IA.

Bloqueantes: nenhum.

Recomendações:
- No `tasks/prd-harness/13_task.md`, o bloco de mutação novo cita o teste pelo nome curto ("o arquivo movido no índice traz os dois caminhos"), e o `it` tem o nome completo ("…, o de origem e o de destino"). O portão aceitou assim, mas citar o nome inteiro evita ambiguidade se outro teste começar igual.
- O teste novo do `revisoes.test.ts` (linha 2117) depende de o git detectar rename por padrão para que a mutação fique vermelha. Se alguém tiver `diff.renames=false` na configuração global, a mutação passaria em silêncio. Para isso não acontecer, o teste pode forçar `-c diff.renames=true`, ou checar antes que o git sem `--no-renames` devolve só o destino.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/revisoes.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/hook-git.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/comando-git.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/hook-git.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/portao-local.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/13_task.md`
