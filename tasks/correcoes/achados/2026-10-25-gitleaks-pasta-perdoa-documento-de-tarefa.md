# Achados das revisões — `tasks/correcoes/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 15:42:03 · `tasks/correcoes/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. A mudança fica só em `tools/ci/` e `tools/guardas/`. Nada em `apps/*/src` nem em `packages/*/src`, e nenhum job, seed, importação ou webhook novo. Todos com autor humano? Não se aplica, porque nenhum caminho foi criado ou alterado.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok. Nenhuma saída de IA foi criada nem alterada.

Supervisão do tutor: ok. Nada no tutor mudou.

Autonomia declarada e visível: sim. Nenhum agente foi criado ou alterado, e a governança ficou intocada.

Bloqueantes: nenhum.

O que foi auditado:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/pasta-como-repositorio.ts` (novo). Transforma a pasta dos arquivos alterados num repositório git de um commit só, com o `.gitleaks.toml` do projeto, para o gitleaks rodar no modo `git`. Não guarda nota, conceito, devolutiva nem saída de IA, e não chama nenhum provedor de IA.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/segredo.ts`. Troca o `gitleaks dir` pelo `argumentosGitleaks` sobre o repositório temporário.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/etapas-de-guarda.ts`. Remove `argumentosGitleaksDaPasta`, que não tinha outro uso.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/guardas/gitleaks.int.test.ts`. Dois casos novos sobre a varredura de pasta.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/correcoes/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa.md`. É o documento da correção e não descreve nenhum fluxo de produto.

Os nove pontos da minha checagem não são afetados pela tarefa: Nota, trajetória do aluno, aprovação de saída de IA, tutor, autonomia, auditoria, vigilância, nota em discursiva e redação (D55), e medição do professor (D45 e D64). A tarefa também não tem tela, e o prompt não trouxe fotos da tela.

Recomendações: nenhuma da regra 70. O efeito da correção é do lado da regra 20 e da segurança, e cabe ao `privacy-guardian`, ao `infra-guardian` e ao `revisor-geral` avaliá-lo. Com ela, um segredo num documento de tarefa passa a ser barrado antes do commit, o que importa porque o repositório é público.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-25 15:42:10 · `tasks/correcoes/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa.md`

VEREDITO: APROVADO

Caminho quente tocado: nenhum
Rate limit: não se aplica
Fila e prioridade: não se aplica
Concorrência: protegida
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: não se aplica
Bloqueantes: nenhum

A mudança fica toda em `tools/`, na ferramenta do portão local. Não toca request, fila, IA, banco, sessão nem nada que rode às 10h da manhã de segunda. Não guarda estado em memória e não faz chamada paga. Cada varredura usa a própria pasta temporária, então duas rodadas ao mesmo tempo não se atrapalham. A função antiga `argumentosGitleaksDaPasta` não aparece mais em lugar nenhum do repositório.

Recomendações:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/segredo.ts`, a pasta temporária `educa-segredo-*` agora inclui um `.git` e nunca é apagada depois da varredura. Isso já acontecia antes da mudança, e `rmSync` está importado sem uso. Vale remover a pasta ao fim de `executarEtapas`.
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/pasta-como-repositorio.ts`, os comandos `git init` e `git commit` ainda leem a configuração global do desenvolvedor, como `init.templateDir`. Os hooks já ficam desligados por `core.hooksPath`. Para a pasta temporária não depender do ambiente de quem roda, defina `GIT_CONFIG_GLOBAL=/dev/null` no `env` do `execFileSync`.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-25 15:42:28 · `tasks/correcoes/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A mudança é só de ferramenta de processo (`tools/ci/` e `tools/guardas/`). Não há migration, entidade, DTO nem rota.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: não se aplica, porque nenhuma rota nem repository foi tocado.

Logs: limpos. Os dois pontos de saída continuam com `--redact`, então o segredo encontrado não sai no log nem no portão local. Isso fica em `argumentosGitleaks`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/etapas-de-guarda.ts:46`, que agora também atende a varredura de pasta. Antes era a `argumentosGitleaksDaPasta`, que foi removida e não deixou referência no repositório.

Auditoria: não se aplica. Nenhuma ação desta tarefa está na lista do item 10.

Envio externo: nenhum. O contêiner do gitleaks continua com `--network none` e com a pasta montada só para leitura. O commit de `pastaComoRepositorio` usa identidade fictícia (`guardas@exemplo.test`), com `core.hooksPath=/dev/null` e sem assinatura. Ele fica num repositório temporário local que não tem remoto.

Seed/fixture: sintético. Os tokens do teste vêm de `tokenFalso()` e as linhas perdoadas são montadas no próprio teste. Os caminhos de `tasks/prd-*` usados são fictícios.

Efeito sobre a regra 20: positivo. Até aqui, a varredura de pasta do portão local não lia os arquivos alcançados pelas exceções do `.gitleaks.toml`. Um segredo nesses arquivos só aparecia depois do push, e o repositório é público. Agora caminho e regex de linha valem juntos também antes do commit. Rodei `tools/guardas/gitleaks.int.test.ts` e passaram 15 de 15. Os dois casos novos provam as duas coisas: o segredo nos cinco caminhos com exceção reprova, e a linha perdoada continua passando.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/segredo.ts:35`: se `pastaComoRepositorio` falhar (por exemplo, `git commit` com erro), a exceção sobe antes de `executarEtapas`. A cópia dos arquivos alterados, agora com um `.git` que guarda o conteúdo inteiro, fica em `/tmp` sem ser removida. Vale envolver a chamada num `try` que apague a pasta quando falhar.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/pasta-como-repositorio.ts:29-30`: o `chmod -R a+rX` deixa a cópia temporária legível por qualquer usuário da máquina. Isso já existia antes da mudança e o efeito é pequeno numa máquina de um dono só. Mesmo assim, como os arquivos alterados podem incluir seed ou fixture, o ideal é limitar a permissão ao UID do contêiner, se a imagem permitir.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-25 15:42:35 · `tasks/correcoes/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A mudança é só no processo, em `tools/ci/` e `tools/guardas/`. Nenhuma seção da `techspec.md` trata do modo de varredura do gitleaks, e o documento diz isso ao listar "Fora desta correção: Nada".

Portão local: carimbo válido. Cobre typecheck, lint, segredo, dependências, unidade e alvo.

Bloqueantes: nenhum.

O que conferi:
- **A troca de `dir` por `git` vale para todas as exceções.** As quatro exceções do `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/.gitleaks.toml` (linhas 14 a 40) são `condition = "AND"` com caminho e regex de linha. Por isso a causa vale para as quatro, e trocar o modo resolve, em vez de mexer em cada uma.
- **A varredura da pasta e a do histórico usam os mesmos argumentos.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/segredo.ts`, a pasta agora usa `argumentosGitleaks(alterados)` sem árvore de trabalho. Como a pasta é um repositório próprio, o `safe.directory=/repo` e o `--config /repo/.gitleaks.toml` valem. O `.gitleaks.toml` copiado garante pelo menos um arquivo no commit, então o `git commit` não falha quando a lista de alterados está vazia ou quando o arquivo está no `.gitignore` (há o `--force`). Também não sobrou referência a `argumentosGitleaksDaPasta` no repositório.
- **O teste passa pelo mesmo caminho do portão.** `varrerPasta` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/guardas/gitleaks.int.test.ts:214-223` usa o `pastaComoRepositorio` de produção e o mesmo `varrer` do histórico. Com isso, `soPlano.codigo === 0` e `not.toContain(TAREFA_COM_PLANO)` passam porque o arquivo é lido e só a linha é perdoada. Os dois casos novos cobrem os cinco caminhos perdoados, a linha perdoada sozinha e um segredo na linha ao lado. Se a cláusula fosse removida (voltando ao `dir`), os dois quebrariam, como o documento registra no vermelho de antes.
- **Os achados da rodada anterior estão atendidos.** Os guardiões apontaram a falta de leitura dos `N_task.md` na varredura de pasta e pediram uma correção própria. Ela está aqui, com o caso do `ghp_` no documento de tarefa.

Recomendações:
- **Função duplicada.** A função `git` com identidade fixa em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/pasta-como-repositorio.ts:15-19` repete a `git()` do teste (`gitleaks.int.test.ts:56-63`), com os mesmos `-c user.name/user.email/commit.gpgsign`. Dá para extrair uma só para os dois, ou para o teste usar a de produção.
- **Comentário repetido.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/segredo.ts:34`, o comentário repete o que o JSDoc de `pastaComoRepositorio` já explica em detalhe. Pode sair, ou ficar só a referência à função.
- **Afirmações que deixaram de ser verdade.** O documento antigo `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/correcoes/2026-10-25-gitleaks-excecao-do-plano-nao-reprova.md:54` e os achados ainda dizem que o portão usa `gitleaks dir`. Como é histórico, não precisa mudar. Mas vale uma linha de "resolvido por 2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa" no índice ou na retro, para quem ler depois não achar que o defeito continua.

## test-engineer · 1ª rodada · APROVADO · 2026-10-25 15:43:49 · `tasks/correcoes/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** um segredo num documento de tarefa sem commit faz a varredura de pasta do portão reprovar.
- **Borda 1:** cada um dos cinco caminhos que têm exceção no `.gitleaks.toml` é lido, e não pulado. São eles o documento de tarefa, a Tech Spec do F0, a skill do Playwright, o teste do convite e o documento da correção do convite.
- **Borda 2:** na varredura de pasta, a exceção continua valendo só para a linha. A linha perdoada do plano e a do convite passam; um segredo na linha ao lado, no mesmo arquivo, reprova.
- **Borda 3:** os casos que já existiam continuam valendo no modo novo. O segredo em arquivo comum reprova com o caminho relativo e sem mostrar o token. A linha do plano fora do documento de tarefa reprova.
- **Permissão e isolamento:** não se aplicam. É ferramenta do processo e não toca dado de escola.
- **Concorrência (dois portões ao mesmo tempo, em duas linhas):** cada execução usa a própria pasta temporária, com `git init` separado e sem estado compartilhado. Não pede teste.

**Cobertos:**
- **Caminho feliz e borda 1:** `reprova o segredo nos arquivos que têm exceção, também na varredura de pasta: o caminho perdoado não esvazia o arquivo` (`tools/guardas/gitleaks.int.test.ts:238`). Exige código 1 e o `File:` de cada um dos cinco caminhos.
- **Borda 2:** `na varredura de pasta, a exceção do plano e a do convite continuam valendo só para a linha…` (`:254`).
- **Borda 3:** `reprova o segredo em arquivo ainda sem commit…` (`:225`). Agora passa pela `pastaComoRepositorio` de produção, e o `soPlano.codigo === 0` passa com o arquivo lido.
- **O teste falharia sem a regra:** sim. No modo `dir` os dois casos novos saem com código 0, porque o arquivo perdoado é pulado, e as asserções `toBe(1)` ficam vermelhas pelo motivo certo.
- **Os dois casos da seção "Teste que reproduz" existem**, com o nome exato que o documento dá.
- **Execuções:**
  - `npx vitest run --project integracao tools/guardas/gitleaks.int.test.ts`: 15 de 15 verdes, como o documento diz.
  - `tools/ci/scripts.test.ts -t RF8`: verde. Ele roda o `segredo.ts` de verdade com esta árvore alterada, então a `pastaComoRepositorio` rodou dentro do script.
- **Mutações:** a mudança está só em `tools/`. O código novo (`pasta-como-repositorio.ts` e as duas linhas do `segredo.ts`) não tem condição, então o `--faltando` não teria o que listar, e a falta de bloco segue o RF17.
- **Sem `.skip`**, sem teste comentado, sem mock que esconda a regra (o gitleaks é o de verdade, na imagem fixada da esteira) e sem provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **A ligação dentro do `segredo.ts` não tem teste automático** (`tools/ci/segredo.ts:35` e `:45`). O teste repete à mão o que o script faz (`pastaComoRepositorio` e depois `argumentosGitleaks(pasta)`). Se o script voltasse a montar a varredura de outro jeito (por exemplo, o `dir`), nada ficaria vermelho; a única prova do caminho real é a de ponta a ponta feita à mão. Sugestão: tirar essa montagem para uma função exportada que o script e o `varrerPasta` usem juntos. Outra saída é o `scripts.test.ts` afirmar que a segunda chamada ao docker é do modo `git`, sobre uma pasta que é repositório, quando há arquivo alterado.
2. **O git da `pastaComoRepositorio` herda o ambiente inteiro** (`tools/ci/pasta-como-repositorio.ts:15-20`). Se o `guarda:segredo` um dia rodar de dentro de um git hook, onde o git define `GIT_DIR`, `GIT_INDEX_FILE` e `GIT_WORK_TREE`, o `init`, o `add --all --force` e o `commit` cairiam no repositório real. Hoje nenhum hook (`commit-msg`, `pre-push`) chama a guarda, então não é bug. Uma defesa barata é passar um `env` sem as variáveis `GIT_*`.
3. **Ponto menor:** um `.gitattributes` alterado na tarefa, ou um `core.attributesFile` global, com `filter=lfs` faria o `git add` gravar o ponteiro no lugar do conteúdo, e o gitleaks leria o ponteiro. Vale uma linha no comentário da função, ou `-c core.attributesFile=/dev/null`.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/correcoes/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/pasta-como-repositorio.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/segredo.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/etapas-de-guarda.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/guardas/gitleaks.int.test.ts`

## infra-guardian · 2ª rodada · APROVADO · 2026-10-25 15:51:35 · `tasks/correcoes/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: não se aplica (só `tools/ci` e o teste de guarda; nada em request)
Fila e prioridade: ok (não se aplica)
Concorrência: protegida (não se aplica: cada execução do `guarda:segredo` usa sua própria pasta, criada com `mkdtempSync`, e nada é compartilhado entre execuções)
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica: nada no caminho quente e nenhum alerta novo)
Bloqueantes: nenhum

Nesta rodada auditei o diff e confiram as cinco recomendações da ordem r1:
1. **Pasta temporária quando a montagem falha:** o `try` com apagar e relançar está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/etapas-do-segredo.ts`, dentro de `copiaDosAlterados`. O teste aponta `TMPDIR` para uma pasta vazia e confere que ela continua vazia. Rodei `tools/ci/etapas-do-segredo.test.ts` e os 3 casos passaram.
2. **Ambiente do git:** `ambienteDoGit()` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/pasta-como-repositorio.ts` tira as variáveis `GIT_*` e passa `GIT_CONFIG_GLOBAL=/dev/null` e `GIT_CONFIG_NOSYSTEM=1`. A chamada leva ainda `-c core.attributesFile=/dev/null`. O teste com `GIT_DIR` e `init.templateDir` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/guardas/gitleaks.int.test.ts` cobre isso.
3. **Ligação do `segredo.ts`:** saiu para `etapasDoSegredo`, que o script e o teste chamam. O teste confere que a segunda varredura usa o modo `git` e não o `dir`, que o volume aponta para a cópia e o que entrou no commit (`ls-files`).
4. **`git` repetido:** o teste agora chama o `gitNaPasta` de produção.
5. **Comentário repetido:** removido.

Recomendações:
- No teste do item 2, em `tools/guardas/gitleaks.int.test.ts`, o `vi.unstubAllEnvs()` está logo depois de `pastaComoRepositorio`. Se essa chamada lançar exceção, a limpeza fica só para o `afterEach`. Não muda o resultado, porque o `afterEach` já limpa. O teste fica mais claro sem essa chamada no meio, deixando a limpeza só no `afterEach`.
- O `git()` local de `tools/ci/etapas-do-segredo.test.ts` roda o git com o ambiente do processo, e só ele no projeto faz isso. Ele só lê (`ls-files`, `rev-list`), mas com `GIT_DIR` herdado leria o repositório errado. Vale usar o mesmo ambiente do `gitNaPasta` ou ler o resultado por ele.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-25 15:51:40 · `tasks/correcoes/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A rodada só muda `tools/` (as etapas do gitleaks local) e o documento da correção. Não há migration, DTO, rota nem schema.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: não se aplica, porque não há endpoint.

Logs: limpos. O código novo não escreve log. A exceção do `execFileSync` traz só caminho e argumento do git, e nenhum conteúdo de arquivo.

Auditoria: não se aplica, porque nenhuma ação da regra 20 é tocada.

Envio externo: nenhum. O gitleaks roda em contêiner local sobre uma pasta temporária, que é apagada ao fim.

Seed/fixture: sintético. Os testes usam `'texto\n'`, `'outro\n'`, `'a\n'`, `'b\n'`, a identidade `guardas@exemplo.test` e o token falso gerado na hora.

Conferência do que pedi na rodada 1:
- **Pasta temporária na falha (item 1 da ordem): atendido.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/etapas-do-segredo.ts:165-174`, a cópia e o `pastaComoRepositorio` ficam dentro de um `try`, que apaga a pasta e relança o erro. O teste `etapas-do-segredo.test.ts:117-125` aponta o `TMPDIR` para uma pasta vazia e confere que ela continua vazia. O `os.tmpdir()` lê o `TMPDIR` a cada chamada, então o teste prova o caminho de verdade. A falha acontece no `copyFileSync` da configuração, quando a cópia dos alterados já foi feita, ou seja, no ponto certo.
- **`chmod -R a+rX` mandado ao TODO.md: o destino não existe.** O documento da tarefa diz que o item foi para "TODO.md (Processo e dívida)", mas nem o `TODO.md` atual nem o do commit `bbd8829a` têm a entrada. Procurei por `chmod`, `a+rX`, `UID` e `pasta-como-repositorio`. Não bloqueia, porque na rodada 1 era recomendação, mas o registro do processo afirma um destino que não está lá.

Também conferi que os arquivos novos da rodada são iguais aos do commit `bbd8829a`. O ambiente sem `GIT_*` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/pasta-como-repositorio.ts:211-214` também protege contra o `add --all --force` cair no repositório real a partir de um hook. Isso evita que uma cópia de arquivos de trabalho seja gravada por engano no histórico do repositório, que é público.

Bloqueantes: nenhum.

Recomendações:
1. Escrever no `TODO.md`, seção "Processo e dívida", a entrada do `chmod -R a+rX` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/pasta-como-repositorio.ts` (hoje a cópia temporária fica legível por qualquer usuário da máquina; a ideia é limitar ao UID do contêiner). Outra saída é corrigir a linha da tabela "Recomendações sem aplicar" do documento da tarefa, que afirma esse destino.
2. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/etapas-do-segredo.ts:186-190`, o `arvoreDeTrabalho(raiz)` roda depois de `copiaDosAlterados` já ter criado a pasta. Se o `git rev-parse` falhar ali, a cópia com o conteúdo dos arquivos fica em `/tmp` sem dono que a apague. Na prática é improvável, porque `arquivosAlterados` já rodou git na mesma raiz. A correção barata é calcular `arvoreDeTrabalho` antes da cópia.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-25 15:51:47 · `tasks/correcoes/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa.md`

VEREDITO: APROVADO

Escopo: respeitado. O novo `tools/ci/etapas-do-segredo.ts` é o que o item 3 da ordem r1 pede: tirar a montagem das etapas do `segredo.ts`, que roda ao ser importado e por isso não pode ser chamado pelo teste. Não muda o comportamento da guarda além do que a ordem pediu.

Aderência à Tech Spec: ok. É uma correção de processo, só em `tools/`, sem Tech Spec própria, e o documento descreve o que mudou na seção "Rodada 1".

Portão local: carimbo válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo).

As cinco correções da ordem r1 foram feitas:
1. **Pasta temporária quando a montagem falha:** feito. Em `etapas-do-segredo.ts:165-174`, um `try` apaga a pasta e relança o erro. O teste aponta `TMPDIR` para uma pasta vazia e confere que ela continua vazia.
2. **Ambiente do git:** feito. `ambienteDoGit` tira as variáveis `GIT_*` e passa `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_NOSYSTEM=1` e `core.attributesFile=/dev/null`. O teste usa `GIT_DIR` e `init.templateDir`, e falharia sem a correção.
3. **Ligação do `segredo.ts` sem teste:** feito. O teste confere que a varredura é do modo `git` e não do `dir`, que o volume aponta para a pasta copiada e o que entrou no commit (`ls-files`).
4. **Identidade fixa do git em dois lugares:** feito. O teste usa `gitNaPasta`, a mesma função da produção.
5. **Comentário repetido:** saiu.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/etapas-de-guarda.ts:90`: o JSDoc de `GuardaDaEsteira` ainda diz que `tools/ci/segredo.ts` "monta as dele a partir de `argumentosGitleaks`". Agora isso fica em `tools/ci/etapas-do-segredo.ts`; atualize a referência.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/etapas-do-segredo.test.ts:117-125`: o caso de falha usa a falta do `.gitleaks.toml`, então o erro sai no `copyFileSync`, antes de qualquer comando git. Ele prova o `try`. Uma falha do próprio git, como o commit, ficaria mais perto do cenário que o privacy-guardian descreveu, mas é cobertura extra.

## test-engineer · 2ª rodada · REPROVADO · 2026-10-25 15:52:50 · `tasks/correcoes/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa.md`

VEREDITO: REPROVADO

Cenários exigidos (rodada 2, sobre o diff r1→r2 e as cinco correções da ordem r1):
- **Item 1:** a pasta temporária é apagada quando a montagem do repositório falha.
- **Item 2:** o git da pasta não herda o ambiente de quem roda. Isso vale para as variáveis `GIT_*` de um hook, a configuração global do desenvolvedor, a configuração do sistema e os atributos globais.
- **Item 3:** a ligação de `segredo.ts` com a varredura da pasta tem teste, e ele fica vermelho se o script voltar ao `dir`.
- **Item 4:** a função `git` com identidade fixa existe num lugar só.
- **Item 5:** o comentário repetido saiu.

Isolamento de escola, permissão e concorrência não se aplicam: é uma ferramenta de CLI, e o `mkdtemp` já dá uma pasta própria a cada execução.

Cobertos:
- **Item 1:** `tools/ci/etapas-do-segredo.test.ts` › "se montar o repositório da pasta falhar…". O `TMPDIR` aponta para uma pasta vazia e o `.gitleaks.toml` falta, então a falha vem depois da cópia. Sem o `try`, `readdirSync(base)` não sai vazio e o caso fica vermelho. Verde aqui.
- **Item 2, parte do `GIT_DIR`:** `tools/guardas/gitleaks.int.test.ts:112`. Sem o filtro das `GIT_*`, o `init`, o `add` e o `commit` caem no repositório `outro`, e as asserções de `pasta/.git` e de `rev-list --count === '1'` ficam vermelhas. Verde aqui.
- **Item 3:** `etapas-do-segredo.test.ts` › "com arquivo alterado, a segunda varredura é do modo git…". Ele confere o subcomando `git` logo depois de `IMAGEM_GITLEAKS`, a ausência de `dir`, o volume `${copia}:/repo:ro` e o resultado do commit (`ls-files` com só o arquivo alterado e a configuração, e um commit só). Trocar para `dir` ou tirar o `pastaComoRepositorio` deixa o caso vermelho. Verde aqui.
- **Item 4:** o `git()` do teste chama o `gitNaPasta` de produção.
- **Item 5:** feito.
- O conteúdo dos arquivos sem commit é idêntico ao do instantâneo `bbd8829` (conferi os hashes dos blobs).

Bloqueantes:
1. **`tools/guardas/gitleaks.int.test.ts:119-124`: o teste não prova a cláusula `GIT_CONFIG_GLOBAL: '/dev/null'` (`tools/ci/pasta-como-repositorio.ts:13`).**
   - **O problema:** o caso põe a configuração global maliciosa (o `init.templateDir` com o `marcador`) na própria variável `GIT_CONFIG_GLOBAL`. Como ela começa com `GIT_`, o filtro já a remove sozinho.
   - **A mutação que passa:** tirar `GIT_CONFIG_GLOBAL: '/dev/null'` de `ambienteDoGit` deixa o caso verde. O git volta a ler o `~/.gitconfig` real, que nesta máquina não tem `init.templateDir`, e o `marcador` não aparece.
   - **O que isso significa:** a parte "a configuração global do desenvolvedor fica de fora", que está no nome do teste e no item 2 da seção "Rodada 1" do documento, não tem prova. Essa é justamente a cláusula que o infra-guardian pediu, e a ordem exige que "o que prova cada cláusula nova é teste".
   - **Correção exigida:** pôr a configuração onde o git do desenvolvedor a lê de fato. Use `vi.stubEnv('HOME', <pasta>)` com `<pasta>/.gitconfig` contendo `[init] templateDir = <molde>`, e também `vi.stubEnv('XDG_CONFIG_HOME', <pasta>/.config)` para nenhuma configuração real vazar. Esses stubs ficam no lugar do stub de `GIT_CONFIG_GLOBAL`, ou em um caso separado.
   - **Como confirmar:** removido o `GIT_CONFIG_GLOBAL: '/dev/null'`, o `marcador` aparece em `pasta/.git` e o caso fica vermelho. Corrija também o texto do item 2 da seção "Rodada 1" do documento da tarefa para dizer o que o caso prova.

Recomendações:
- **`tools/ci/etapas-do-segredo.ts:186-190`: ainda sobra um caminho em que a pasta temporária fica no disco.** `copiaDosAlterados` roda antes de `arvoreDeTrabalho(raiz)`. Se o `git rev-parse` falhar depois de a cópia estar pronta, a cópia, já com o `.git` e o conteúdo inteiro, fica em `/tmp`. Bastaria calcular `arvoreDeTrabalho` antes da cópia.
- **`GIT_CONFIG_NOSYSTEM: '1'` e `-c core.attributesFile=/dev/null` (`pasta-como-repositorio.ts:13` e `:220`) não têm teste.**
  - O `NOSYSTEM` não dá para provar sem mexer em `/etc/gitconfig`, porque o `GIT_CONFIG_SYSTEM` já cai no filtro.
  - O `attributesFile` neutraliza o `~/.config/git/attributes`, que o git lê mesmo com a configuração global em `/dev/null`. Mas sem a definição do filtro, que agora não é lida, o efeito é pequeno.
  - Vale uma linha no JSDoc dizendo que essas duas são defesa extra, sem teste próprio.
- **`gitleaks.int.test.ts:112`:** separar em dois casos, um para o "hook" (`GIT_DIR`) e outro para a "configuração do desenvolvedor" (`HOME`). Assim cada asserção aponta uma cláusula só.

## privacy-guardian · 3ª rodada · APROVADO · 2026-10-25 15:59:18 · `tasks/correcoes/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa.md`

VEREDITO: APROVADO

Esta é a 3ª rodada. Auditei o diff desde a 2ª (`.processo/ordens/diff-gitleaks-pasta-r2-r3.patch`) e conferi as duas recomendações minhas daquela rodada. Os arquivos no disco batem com o commit `d3ff3966`. No documento da correção, a única diferença é a linha da 3ª rodada do `tenancy-guardian`, que o hook escreveu.

Campos pessoais tocados: nenhum. A mudança fica toda em `tools/`, no `TODO.md` e no documento da correção, sem schema, DTO, rota ou código de `apps/*/src` e `packages/*/src`.
Fora da tabela de dados do docs/lgpd.md: nenhum.
Autorização por objeto: não se aplica, porque não há rota nem acesso a dado de escola.
Logs: limpos. O diff não acrescenta log.
Auditoria: não se aplica, porque nenhuma ação desta correção pede auditoria.
Envio externo: nenhum. O gitleaks roda num contêiner local sobre a cópia temporária, sem envio para fora da máquina.
Seed/fixture: sintético. Os testes gravam só `'a\n'`, `'b\n'`, `'x'` e uma configuração de `init.templateDir` em pastas `mkdtemp`, que entram em `diretorios` para a limpeza.

Recomendações da 2ª rodada:
- **`arvoreDeTrabalho` antes da cópia: feita.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/etapas-do-segredo.ts:55`, o `historico` é calculado antes de `copiaDosAlterados` (linha 56). Se o `git rev-parse` falhar, ainda não existe pasta temporária com conteúdo para ficar em `/tmp`. Com o `try` que apaga a pasta e relança (linhas 33-42), a cópia não fica mais órfã em nenhum caminho de falha dentro de `etapasDoSegredo`.
- **Entrada do `chmod -R a+rX` no `TODO.md`: feita.** Está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/TODO.md:2026-2030`, na seção "Processo e dívida do F0". Ela diz que a cópia temporária fica legível por qualquer usuário da máquina até o fim da varredura e por que não entrou nesta correção: é preciso medir o UID da imagem.

O resto do diff não afeta a regra 20:
- **`gitleaks.int.test.ts`:** o caso foi dividido em dois, um para o `GIT_DIR` e outro para o `~/.gitconfig` com `HOME` e `XDG_CONFIG_HOME`. O `HOME` falso também impede o teste de ler a configuração real do desenvolvedor.
- **`pasta-como-repositorio.ts`:** o JSDoc agora diz quais proteções são defesa extra, sem teste próprio.
- **Documento da correção:** as tabelas foram atualizadas.

Bloqueantes: nenhum.

Recomendações: nenhuma nova. A do `chmod -R a+rX` continua no `TODO.md`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/pasta-como-repositorio.ts`. Ela já existia antes desta correção e não bloqueia.

## infra-guardian · 3ª rodada · APROVADO · 2026-10-25 15:59:27 · `tasks/correcoes/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa.md`

VEREDITO: APROVADO

Caminho quente tocado: nenhum. Esta rodada só mexe em `tools/ci` e nos testes da guarda de segredo, e nada disso roda no horário de aula.

Rate limit: não se aplica.

Fila e prioridade: ok. Nenhum job novo nem fila nova.

Concorrência: protegida. A cópia vai para uma pasta própria criada com `mkdtempSync`, e nenhum estado é compartilhado.

Índice e paginação: não se aplica.

Degradação de IA: não se aplica.

Migration: não se aplica.

Métrica e alerta: não se aplica.

Bloqueantes: nenhum.

Na rodada passada não houve correção exigida da minha parte. Das mudanças desta rodada, conferi:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/etapas-do-segredo.ts:54-56`, `arvoreDeTrabalho` agora roda antes de `copiaDosAlterados`. Assim, uma falha do `rev-parse` não deixa no disco a pasta temporária com o conteúdo dos arquivos alterados. Está correto.
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/guardas/gitleaks.int.test.ts`, o caso antigo virou dois, um para cada cláusula. O segundo agora testa a configuração global de verdade, por `HOME` e `XDG_CONFIG_HOME`, e não mais pela `GIT_CONFIG_GLOBAL`, que já caía no filtro das `GIT_*` e por isso não provava nada. Era o ponto da reprovação do `test-engineer`.
- Os testes não chamam nenhum provedor pago. Rodei `gitleaks.int.test.ts` e `etapas-do-segredo.test.ts` e os 20 casos passaram.

Recomendações:
- A entrada nova do `TODO.md` sobre o `chmod -R a+rX` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/pasta-como-repositorio.ts` não tem dono. As vizinhas trazem "dono:". Vale nomear um, por exemplo o Arquiteto, para a entrada não ficar parada.

## revisor-geral · 3ª rodada · APROVADO · 2026-10-25 15:59:38 · `tasks/correcoes/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. É uma correção de processo em `tools/` e não toca `techspec.md`. O documento registra a mudança da rodada 2 (`arvoreDeTrabalho` calculada antes da cópia) e os dois testes do ambiente do git.
Portão local: carimbo válido. O `conferir` diz que vale para o código atual e cobre typecheck, lint, segredo, dependências, unidade e alvo.
Bloqueantes: nenhum.

O que conferi no diff r2→r3, de `bbd8829a` a `d3ff3966`:
- **`tools/ci/etapas-do-segredo.ts:54-56`**: o `rev-parse` agora roda antes de `copiaDosAlterados`. Se ele falhar, nenhuma pasta temporária com o conteúdo dos arquivos fica no disco. A ordem e o conteúdo das etapas não mudaram.
- **`tools/guardas/gitleaks.int.test.ts:117-149`**: o caso único virou dois, um por cláusula.
  - O primeiro aponta `GIT_DIR` para outro repositório.
  - O segundo usa `HOME` com um `.gitconfig` que define `init.templateDir`, e também redireciona `XDG_CONFIG_HOME`, para a configuração real de quem roda não interferir. O teste antigo usava `GIT_CONFIG_GLOBAL`, que o próprio filtro das `GIT_*` já descartava, então não provava nada. Este prova.
  - A mutação que o documento descreve é coerente com o código: sem `GIT_CONFIG_GLOBAL=/dev/null`, o git lê o `~/.gitconfig` falso e o `marcador` aparece no `.git` da pasta.
  - O `afterEach` (linha 26) desfaz o `stubEnv` mesmo quando `pastaComoRepositorio` lança erro.
- **`tools/ci/pasta-como-repositorio.ts`**: o JSDoc novo diz o que tem teste e o que é só defesa extra (`GIT_CONFIG_NOSYSTEM` e `core.attributesFile`). Bate com o que o documento declara.
- **`TODO.md`**: as duas entradas que a rodada 2 mandou para lá estão escritas. Uma é o `chmod -R a+rX`, apontado pelo `privacy-guardian`. A outra é o JSDoc velho de `GuardaDaEsteira`, que apontei na rodada 2.
- **Árvore atual**: `etapas-do-segredo.ts`, `etapas-do-segredo.test.ts` e `pasta-como-repositorio.ts` estão iguais a `d3ff3966`. No documento da correção, a única diferença são as linhas da rodada 3 que o hook escreveu na tabela de Revisões.

Recomendações:
- **`tools/ci/etapas-de-guarda.ts:90`**: o JSDoc de `GuardaDaEsteira` ainda diz que `segredo.ts` monta as etapas, mas agora elas estão em `etapas-do-segredo.ts`. Já está no `TODO.md`, então só repito.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/etapas-do-segredo.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/pasta-como-repositorio.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/guardas/gitleaks.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/correcoes/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/TODO.md

## test-engineer · 3ª rodada · REPROVADO · 2026-10-25 16:00:17 · `tasks/correcoes/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa.md`

VEREDITO: REPROVADO

Cenários exigidos: a correção exigida na 2ª rodada (provar a cláusula `GIT_CONFIG_GLOBAL: '/dev/null'` com a configuração no lugar onde o git do desenvolvedor a lê, e corrigir o item 2 da "Rodada 1"); o que o diff r2→r3 mudou fora disso, ou seja, a nova ordem em `etapasDoSegredo`.

Cobertos:
- **Correção 1 feita.** `tools/guardas/gitleaks.int.test.ts` agora tem dois casos, um por cláusula:
  - `não herda o ambiente de um hook` prova o filtro das variáveis `GIT_*`, usando `GIT_DIR`.
  - `não herda a configuração do desenvolvedor` faz `vi.stubEnv('HOME', casa)`, com `casa/.gitconfig` contendo `init.templateDir`, e `vi.stubEnv('XDG_CONFIG_HOME', casa/.config)`.
- **Por que o segundo caso prova a cláusula.** `ambienteDoGit` lê `process.env` na hora da chamada, então o `HOME` falso chega ao git. Sem `GIT_CONFIG_GLOBAL: '/dev/null'`, o git lê `casa/.gitconfig`, o molde copia o `marcador` para `pasta/.git` e a linha `expect(existsSync(join(pasta, '.git', 'marcador'))).toBe(false)` fica vermelha. O motivo é o certo: o caso chega à cláusula. O stub do `XDG_CONFIG_HOME` impede que a configuração real da máquina vaze para o teste.
- **Documento e JSDoc.** O item 2 da "Rodada 1" diz agora o que cada caso prova. Ele e o JSDoc de `ambienteDoGit` (`tools/ci/pasta-como-repositorio.ts:11-13`) declaram por escrito que `GIT_CONFIG_NOSYSTEM` e `core.attributesFile=/dev/null` ficam sem teste próprio, como defesa extra, e dão o motivo. Aceito.
- **Os testes passam.** `npx vitest run tools/guardas/gitleaks.int.test.ts tools/ci/etapas-do-segredo.test.ts` deu 2 arquivos e 20 casos verdes. Não há `.skip` nem mock que esconda a regra.
- **TODO.md.** Recebeu as duas entradas que o documento promete: o `chmod -R a+rX` e o comentário velho de `etapas-de-guarda.ts`.

Bloqueantes:
1. **`tools/ci/etapas-do-segredo.ts:54-55`: comportamento novo sem teste que o prove.**
   - O que mudou: `arvoreDeTrabalho(raiz)` passou a rodar antes de `copiaDosAlterados`. O comentário da linha 54 e o item 3 da "Rodada 1" ("Na rodada 2, `arvoreDeTrabalho` passou a ser calculada antes da cópia: se o `git rev-parse` falhar, ainda não há pasta temporária…") apresentam isso como garantia.
   - O problema: nenhum caso de `tools/ci/etapas-do-segredo.test.ts` exercita a falha do `rev-parse`. Se a ordem antiga voltar (`historico` calculado depois da cópia), os três casos continuam verdes. Nesse cenário, a cópia com o conteúdo inteiro dos arquivos alterados ficaria no disco. É a mesma garantia que o item 1 prova para a falha de `pastaComoRepositorio`, e aquele item tem teste.
   - Correção exigida: um caso em `etapas-do-segredo.test.ts`, no molde do caso `se montar o repositório da pasta falhar…`:
     - `raiz` é uma pasta comum, sem `git init`, com `.gitleaks.toml` e `tasks/prd-x/1_task.md`;
     - `vi.stubEnv('TMPDIR', base)`, com `base` vazia;
     - `expect(() => etapasDoSegredo(raiz, ['tasks/prd-x/1_task.md'])).toThrow()`;
     - `expect(readdirSync(base)).toEqual([])`.
   - Por que esse caso falha com a ordem antiga: a cópia é feita primeiro, e funciona, porque `pastaComoRepositorio` faz o próprio `git init` dentro dela. Depois o `rev-parse` sobre `raiz` lança, `base` fica com a pasta `educa-segredo-*` e o caso fica vermelho.
   - O que fazer no documento: citar o caso pelo nome no item 3. A outra saída é tirar do item 3 e do comentário a frase que apresenta a nova ordem como garantia, se ela não for para ser garantida.

Recomendações:
- O teste deste bloqueante pode citar no nome que a pasta não é repositório. Exemplo: "fora de um repositório, a exceção sobe antes de qualquer cópia".
- Continuam registradas as recusas da 2ª rodada (o `git()` local de `etapas-do-segredo.test.ts:39` sem `ambienteDoGit`, e a falha provocada pelo `.gitleaks.toml`). Nenhuma delas bloqueia.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/etapas-do-segredo.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/etapas-do-segredo.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/guardas/gitleaks.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/pasta-como-repositorio.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/correcoes/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa.md

## revisor-geral · 4ª rodada · APROVADO · 2026-10-25 16:08:05 · `tasks/correcoes/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

Recomendações:
- O documento da correção, item 3, diz que o caso foi provado por mutação "à mão", e só isso. Como o arquivo é de `tools/`, a RF17 não obriga a ter um bloco ` ```mutacao `. Mas com o bloco, a prova rodaria de novo a cada portão, em vez de ficar só na palavra de quem escreveu. Isso vale também para as mutações à mão dos itens 1 e 2.

O que conferi nesta rodada:
- **O caso novo prova o que diz.** Ele está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/etapas-do-segredo.test.ts:76-89`.
  - O `GIT_CEILING_DIRECTORIES` aponta para a pasta-mãe da raiz, então o `rev-parse` falha mesmo quando a pasta temporária da máquina fica dentro de um repositório.
  - O `TMPDIR` é trocado depois de a `base` ser criada, então só a cópia de `copiaDosAlterados` cairia nela.
  - Sem a mudança da rodada 2, isto é, com `historico` calculado depois da cópia em `etapas-do-segredo.ts:55-56`, a cópia e o `pastaComoRepositorio` dariam certo. O `git init` da pasta-cópia não sofre com o teto. O `rev-parse` falharia depois disso, a `educa-segredo-*` ficaria em `base`, e o caso ficaria vermelho.
  - O `vi.unstubAllEnvs()` do `afterEach` desfaz as duas trocas de variável.
- **O código de produção não mudou** desde a 3ª rodada, como o prompt informa.
- **O documento foi atualizado.** O item 3 e as três linhas novas da tabela de recomendações batem com o diff. As recusas registradas têm motivo escrito, e as duas da 3ª rodada estão justificadas: uma já tinha entrada no `TODO.md` e a outra era só recomendação, sem bloqueio.

## test-engineer · 4ª rodada · APROVADO · 2026-10-25 16:08:08 · `tasks/correcoes/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa.md`

VEREDITO: APROVADO

**Cenários exigidos:** a falha do `git rev-parse` sobe antes de qualquer cópia e não deixa pasta temporária no disco. Era a correção 1 da 3ª rodada. Continuam valendo os cenários das rodadas anteriores: árvore limpa, modo `git` em vez de `dir` na segunda varredura, falha de `pastaComoRepositorio` com a pasta apagada, e o ambiente do git isolado do hook e da configuração global.

**Cobertos:**
- **A correção exigida foi feita.** O caso novo está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tools/ci/etapas-do-segredo.test.ts:76-89`, com o nome `fora de um repositório, a exceção do git rev-parse sobe antes de qualquer cópia, e a pasta temporária não chega a existir`. Ele segue o molde pedido:
  - `raiz` é uma pasta sem `git init`, com `.gitleaks.toml` e `tasks/prd-x/1_task.md`;
  - `TMPDIR` aponta para uma `base` vazia;
  - verifica `toThrow()` e depois `readdirSync(base)` igual a `[]`.
- **O caso não depende da máquina.** O `GIT_CEILING_DIRECTORIES` impede o git de subir até um repositório que contenha a pasta temporária. O `rev-parse` de produção (`etapas-do-segredo.ts:15`) herda `process.env`, então pega o valor do stub.
- **Ele fica vermelho pelo motivo certo, conferido pelo código sem alterar arquivo.** Com a ordem antiga (`historico` depois de `copiaDosAlterados`):
  - a cópia dá certo, porque `pastaComoRepositorio` faz o próprio `git init` e há `.gitleaks.toml`;
  - o `mkdtemp` cria `educa-segredo-*` dentro da `base`;
  - em seguida o `rev-parse` falha fora do `try`, e a pasta fica no disco;
  - `readdirSync(base)` então não sai vazio e o caso fica vermelho.

  É o que o item 3 do documento diz ter provado à mão.
- O documento cita o caso pelo nome no item 3, como foi pedido.
- `npx vitest run tools/ci/etapas-do-segredo.test.ts` passou com 4 de 4 casos.
- Não há `.skip`, teste comentado nem mock que esconda a regra. Não há IA nem concorrência envolvidas.
- O código de produção não mudou desde a 3ª rodada, então nada mais foi afetado.

**Bloqueantes:** nenhum.

**Recomendações:**
- O caso novo verifica só `toThrow()`, sem conferir o motivo. Com `toThrow(/rev-parse|não é um repositório|not a git repository/)`, ou conferindo o `stderr` do erro, ele fica preso à causa: uma falha anterior por outro motivo também deixaria a `base` vazia e passaria verde. Hoje nada antes do `rev-parse` pode falhar nesse cenário, então não bloqueia.
- O `fatal: não é um repositório git` aparece na saída do vitest porque o `execFileSync` de `pastaDoGit` não captura o `stderr`. É ruído na saída, sem efeito na regra.
