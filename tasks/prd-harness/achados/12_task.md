# Achados das revisões — `tasks/prd-harness/12_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-23 22:09:10 · `tasks/prd-harness/12_task.md`

VEREDITO: APROVADO

A tarefa 12.0 só muda ferramenta do processo: a esteira passa a recusar o commit de código sem marca. Nenhum campo de pessoa foi criado, nenhuma rota, nenhum DTO, log de aplicação, storage ou envio a IA.

Campos pessoais tocados: nenhum.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: não se aplica. A tarefa não cria rota nem leitura de objeto.

Logs: limpos. A saída de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/conferir-entregas.ts:76` vai para o log da esteira e mostra só três coisas, nenhuma dado de aluno, professor ou família:
- o hash do commit;
- o título do commit, que já é público porque o repositório é público;
- até três caminhos de arquivo.

O e-mail e o nome do autor não aparecem. O stderr do git fica preso no `stdio: pipe` (linha 32). O `catch` da linha 61 devolve um texto fixo, sem o erro bruto.

Auditoria: não se aplica. A tarefa não tem exportação, nota, permissão, leitura de dado de aluno nem aprovação de saída de IA.

Envio externo: nenhum. O script só chama o `git` local, sem rede nem provedor de IA.

Seed/fixture: sintético. O teste `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/conferir-entregas.test.ts` cria um repositório temporário em `tmpdir()`, com usuário `teste`, e-mail `teste@exemplo.invalid` e conteúdo que não identifica ninguém. Os temporários são apagados no `afterAll`. O ambiente do teste tira as variáveis `GIT_*` e a configuração global do git, então a identidade de quem roda o teste não entra nos commits.

Pergunta de fechamento: a tarefa não muda nada do que o sistema guarda sobre um aluno nem para onde isso foi enviado. A resposta continua igual à de antes.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/conferir-entregas.ts:75-76` mostra o título do commit e os caminhos no log da esteira. Hoje isso não expõe nada, porque o repositório é público e os caminhos são de código. Vale uma linha no comentário do topo dizendo que a saída tem só hash, título e caminho, e nunca o corpo da mensagem nem o conteúdo do diff. Assim, se alguém um dia quiser mostrar o diff para facilitar a depuração, vai bater nessa regra antes.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-23 22:09:47 · `tasks/prd-harness/12_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A tarefa só mexe na esteira de CI e na ferramenta de processo; nada roda em request, fila, sala, prova nem IA.
Rate limit: ok. O diff não tem endpoint nem limitador.
Fila e prioridade: ok. O diff não tem job.
Concorrência: protegida. O script só lê o git, não grava nada e pode rodar duas vezes sem efeito.
Índice e paginação: ok. Não há query.
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok. Não há código novo no caminho quente nem alerta novo.
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.github/workflows/ci.yml:72`: o passo de conferir as entregas roda antes do `ci:verificar`. Quando ele sai 1, o mesmo run não mostra tipos, lint nem testes de unidade. É de propósito, e o `esteira.test.ts` exige essa ordem. Se o retrabalho aparecer no `/retro`, há duas saídas: um job separado ou `if: always()` no passo seguinte.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/conferir-entregas.ts:41`: o script depende do `--remerge-diff`, que pede git 2.36 ou mais novo. O runner `ubuntu-24.04` cumpre isso hoje. Uma linha no comentário dizendo essa versão mínima evita surpresa se a imagem do runner mudar.

Rodei `npx vitest run --project unidade` em `conferir-entregas.test.ts`, `esteira.test.ts` e `linhas.test.ts`: 145 testes passaram, e nenhum chama provedor pago. Também passei `portao.test.ts` no comando, mas nenhum arquivo rodou para ele. Ou o arquivo não existe, ou fica fora do projeto `unidade`. Os casos de `ehCodigoParaAEsteira` estão em `conferir-entregas.test.ts` e foram cobertos.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-23 22:09:50 · `tasks/prd-harness/12_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

As três divergências do `12_task.md` (a lista do §5(e) criada nesta tarefa, as duas marcas num lugar só, e as regras da marca no título, da `Revisões:` com texto e da saída 2) estão registradas na `techspec.md` §5(a), no parágrafo "No código (12.0)", e no `cenarios.md` B, em "RF14, terceira camada". A lista em `portao.ts` repete o §5(e) item por item, e o `tsconfig*.json` só da raiz está escrito no texto da spec. A `ehCodigoParaAEsteira` não entra na `decidirCommit`, então a 14.0 não foi invadida. A troca das regexps de marca não muda o resultado do `.test` em `linhas.ts`: o grupo de captura novo só serve ao `documentoDaMensagem`. O passo no `ci.yml` vem depois do checkout com `fetch-depth: 0`, que preenche `refs/remotes/origin/*`, e antes de `ci:verificar`. Rodei o script uma vez sobre o histórico real desta branch, sem repetir o portão: os 62 commits de `origin/develop..HEAD` passaram, saída 0. Logo, o primeiro push não fica vermelho por commit antigo.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/14_task.md:25`: a 14.1 ainda diz "A lista do §5(e), só em sessão de papel", sem dizer que a lista já existe em `portao.ts` (`PASTAS_DE_PROCESSO`, `ARQUIVOS_DE_PROCESSO`, `PADROES_DE_PROCESSO`). Vale escrever que a 14.0 importa essa lista, para ninguém criar uma segunda cópia.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/conferir-entregas.ts:59-66`: o `catch` trata qualquer falha do `rev-list` como "não achei origin/develop". Continua fechando na falha, porque sai 2, mas a mensagem engana quando o erro é outro. Um `git rev-parse --verify origin/develop` antes, com uma mensagem própria, separaria os dois casos.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/conferir-entregas.ts:32`: a função `git` cabe numa linha só, mas fica difícil de ler. Melhor quebrar as opções em várias linhas.

## test-engineer · 1ª rodada · APROVADO · 2026-10-23 22:10:32 · `tasks/prd-harness/12_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os 14 da tabela "Testes que provam a regra" do `12_task.md`. São eles:
- o histórico real de spec;
- o merge do encontro limpo com o `tasks.md` resolvido;
- o merge da `develop`;
- os commits só de documento sem marca, e o commit só de `skills-lock.json`;
- `Fora do processo: ajuste`;
- o intervalo vazio;
- `correcao/x` com marca e `Revisões:`;
- código sem marca sai 1 citando o hash;
- marca sem `Revisões:`;
- merge com conflito resolvido em código;
- `tools/guardas/x.mjs` e `.github/workflows/ci.yml`, um caso cada;
- motivo vazio;
- o limite conhecido com `env -u CLAUDE_CODE_AGENT`;
- as condições do `ci.yml`.

Somam-se a eles:
- os dez itens da divergência 3: merge que ficou com um lado só, `Revisões:` vazia ou só no título, marca só no corpo, caixa diferente, menção no meio de uma linha, acento e espaço no nome, rename, `commit-tree` sem marca e com motivo só de espaços, quatro arquivos na mensagem;
- sem a `origin/develop`, sai 2;
- a classificação `ehCodigoParaAEsteira`: os dois lados e a âncora dos dois padrões.

Este script só lê o git, então não se aplicam isolamento entre escolas, IA nem concorrência. Rodar o job duas vezes é idempotente.

**Cobertos:** todos, com o teste citado pelo nome em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/conferir-entregas.test.ts` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/esteira.test.ts`.
- **Os itens juntados por ponto e vírgula foram conferidos um a um.** O "documento sem marca" e o "skills-lock" são commits separados no mesmo repositório (linhas 86-92). A caixa diferente é um commit próprio (linha 97). O `tools/guardas/x.mjs` e o `ci.yml` são um repositório cada, num laço (linhas 195-204). A `Revisões:` vazia e a só no título também são um repositório cada (linhas 148-155).
- **A lista do §5(e) está completa.** A da `techspec.md`, linhas 165-168, bate entrada por entrada com `PASTAS_DE_PROCESSO`, `ARQUIVOS_DE_PROCESSO` e `PADROES_DE_PROCESSO` em `portao.ts`, e cada entrada tem um caminho no `it.each` e um bloco de mutação.
- **Cada cláusula nova do diff tem bloco:** os três argumentos do `git show`, as duas regexps, o título contra o corpo, o `trim`, o sai 2, o intervalo vazio, o `continue`, as reticências, a entrada do script, o `process.exit`, os quatro ramos do `ehCodigoParaAEsteira`, cada entrada da lista, a âncora e o fim de cada padrão, o `if` do `ci.yml` (três formas, a remoção e a ordem) e o script do `package.json`.
- **Os blocos chegam à cláusula pelo motivo certo.** O `--remerge-diff` é provado pelo merge que ficou com um lado só, que o `--cc` padrão não mostraria. O `--no-renames`, pelo rename para `docs/a.md`. O `-z`, pelo nome com acento. A regexp sem `m`, pelo corpo que começa com linha vazia.
- **Os asserts olham o resultado:** código de saída, hash inteiro do commit, arquivo citado e quantidade de commits recusados, e não só que o script rodou.
- **Nada escondido:** sem `.skip`, sem mock. O git é de verdade, num repositório temporário, e o script é chamado como processo.
- **Rodadas:** `npx vitest run --project unidade tools/ci/conferir-entregas.test.ts tools/ci/esteira.test.ts` passou, 79 testes. O script também rodou contra o histórico real desta branch e saiu 0 nos 62 commits de `origin/develop..HEAD`. O primeiro push depois desta tarefa não fica vermelho por commit antigo.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/conferir-entregas.test.ts:252`: o caso do `commit-tree` com motivo só de espaços só confere o texto `está sem motivo`, não o status. Acrescentar `expect(...status).toBe(1)`, como no caso do lado.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/conferir-entregas.ts:60`: o `.filter((sha) => sha !== '')` não tem bloco de mutação. Hoje o teste "o intervalo vazio sai 0" já o pega, porque o script quebraria no `git show ''`, mas vale declarar um bloco para isso.
3. Merge com mais de dois pais (octopus) não tem teste. Pelo que lembro, o `--remerge-diff` só trata merge de dois pais, e não conferi o que ele faz com mais. Se ele não listar nada nesse caso, um octopus com código resolvido à mão passa sem marca. Vale um caso que mostre se sai 1, ou declarar como limite na §5(a).
4. O teste do limite conhecido (linha 271) prova que o commit passa, mas não prova que o hook, com a variável presente, teria recusado. Essa prova está na 11.0. Um comentário que aponte para ela deixaria explícito por que aqui se afirma só o limite.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-23 22:17:07 · `tasks/prd-harness/12_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok (a tarefa não toca em limite: é ferramenta de esteira, sem tráfego de escola)
Fila e prioridade: ok (não se aplica: nenhum job novo nem fila nova)
Concorrência: protegida (o script só lê o histórico do git dentro do job de CI e não grava estado compartilhado)
Índice e paginação: ok (não se aplica: nenhuma query nem tabela)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica: nada novo no caminho quente)
Bloqueantes: nenhum
Recomendações:
- A recomendação da 1ª rodada sobre a ordem dos passos (`ci:conferir-entregas` antes de `ci:verificar` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.github/workflows/ci.yml`) foi recusada e tem destino registrado: o `/retro`. Fica de pé. Se a recusa se repetir, o `if: always()` no passo seguinte é a saída mais barata.

O que conferi nesta rodada:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/conferir-entregas.ts`: o comentário novo do `arquivosDoCommit` fecha certo com `*/`. A quebra do `git` em várias linhas não muda o comportamento. O filtro do intervalo vazio (`filter((sha) => sha !== '')`) agora tem um bloco de mutação em `12_task.md` que o prova. O comentário sobre o log público (regra 20, item 9) bate com o que o script imprime: só hash, título e caminhos.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/conferir-entregas.test.ts`: o caso "sem motivo" passou a cobrar `status` 1, além do texto da saída. O comentário do limite aponta para a prova na 11.0.
- Rodei `conferir-entregas.test.ts` e `esteira.test.ts`: 79 testes passaram, nenhum chama provedor pago.
- Como a tarefa é só de esteira e processo, nenhum item do modelo de carga das 10h se aplica a ela.

## infra-guardian · 3ª rodada · APROVADO · 2026-10-23 22:17:29 · `tasks/prd-harness/12_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok (a tarefa não toca em limite: é ferramenta da esteira, sem tráfego de escola)
Fila e prioridade: ok (não se aplica: nenhum job nem fila nova)
Concorrência: protegida (o script só lê o histórico do git dentro do job de CI e não grava estado compartilhado)
Índice e paginação: ok (não se aplica: nenhuma query nem tabela)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica: nada novo no caminho quente)
Bloqueantes: nenhum
Recomendações:
- A recomendação da 1ª rodada sobre a ordem dos passos em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.github/workflows/ci.yml` (`ci:conferir-entregas` antes de `ci:verificar`) foi recusada e tem destino registrado, o `/retro`. Ela continua valendo. Se o retrabalho aparecer, a saída mais barata é um `if: always()` no passo seguinte.

Sobre a correção do prompt: refiz a revisão pelo diff que o comando `git diff 99c6c33..e4abb3e -- . ':!tasks/prd-harness/achados'` mostra. Os dois erros que você apontou estão confirmados.
- O cabeçalho do segundo hunk do teste é mesmo `describe('ci:conferir-entregas, a terceira camada do RF14', ...`.
- O ` */` está no lugar, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/conferir-entregas.ts`.

O diff só mexe em três arquivos: `12_task.md`, `conferir-entregas.ts` e `conferir-entregas.test.ts`. Comparei os dois arquivos de código da pasta de trabalho com o conteúdo deles em `e4abb3e` e são iguais. Rodei `conferir-entregas.test.ts` e `esteira.test.ts`: os 79 testes passaram, e nenhum chama provedor pago. Nada no diff exato muda o veredito.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-23 22:17:35 · `tasks/prd-harness/12_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

As seis recomendações da ordem `.processo/ordens/12_task-r1.md` foram aplicadas, e o diff desta rodada não mexe em comportamento nem em contrato.

- **Comentário do topo** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/conferir-entregas.ts:20-21`): agora diz que a saída leva só hash, título e caminhos, nunca o corpo da mensagem nem o diff. É o que as linhas 85-86 fazem.
- **Função `git` quebrada em várias linhas** (linhas 35-41): as opções são as mesmas de antes.
- **Linha sobre o git 2.36** (linha 48): está certa. A falha do `git show` dentro do laço não é capturada e o processo sai 1. A falha do `rev-list` cai no `catch` e sai 2, que é outro caso.
- **Status no teste do `commit-tree`** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/conferir-entregas.test.ts:252-254`): o status 1 passou a ser conferido, além do texto.
- **Comentário no teste do limite conhecido** (linhas 279-280): aponta para a prova da 11.0 em `hook-git.int.test.ts`.
- **Mutação nova do `.filter((sha) => sha !== '')`** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/12_task.md:466-471`): o bloco bate com a linha 70 do script, e o teste "o intervalo vazio sai 0" existe. Sem o filtro, o laço receberia `''` e quebraria no `git show ''`. O carimbo atual inclui as mutações.
- **Tabela "Recomendações sem aplicar"**: está copiada no documento, com as quatro linhas e o destino de cada uma.

Os dois arquivos novos de `tools/ci/` estão iguais ao snapshot `e4abb3e`. Depois dele, só entrou no `12_task.md` a linha da 2ª rodada do `infra-guardian`, escrita pelo hook.

Recomendações:
- A tabela "Recomendações sem aplicar" manda dois itens para o `TODO.md`, mas ele não foi alterado nesta árvore. São o `git rev-parse --verify origin/develop` antes do `rev-list` e o merge com mais de dois pais (octopus). Quem fechar a tarefa precisa escrever os dois lá, para não se perderem.
- O item (ii) sobre o `--remerge-diff` já registrado no `TODO.md:967` diz respeito a este script também. É a linha "remerge CONFLICT", que pode ser lida como caminho num conflito que não é de conteúdo. Vale juntar esse item ao do octopus quando o Arquiteto decidir.

## test-engineer · 2ª rodada · APROVADO · 2026-10-23 22:17:38 · `tasks/prd-harness/12_task.md`

```
VEREDITO: APROVADO
Cenários exigidos: os mesmos da 1ª rodada, para a 3ª camada do RF14 (ci:conferir-entregas). Mais os que esta rodada mexe: o intervalo vazio sai 0, o commit-tree cujo motivo é só espaço é recusado com status 1, e o limite conhecido do commit sem CLAUDE_CODE_AGENT.
Cobertos: todos. Nesta rodada conferi o diff 99c6c33..e4abb3e (sem achados/) e o que ele afeta:
- O bloco de mutação novo (tasks/prd-harness/12_task.md, o `.filter((sha) => sha !== '')` em tools/ci/conferir-entregas.ts:70) chega à cláusula pelo motivo certo. Sem o filtro, o rev-list vazio devolve `['']`, então `novos.length` é 1. A saída "Nenhum commit novo" (linha 77) não acontece e o laço chama `git show` com sha vazio. O teste "o intervalo vazio sai 0" (conferir-entregas.test.ts:73) exige status 0 e esse texto, então fica vermelho pela regra, não por acidente.
- conferir-entregas.test.ts:252-254: o status 1 agora é conferido, além do texto "está sem motivo". Antes, um caminho que escrevesse o texto e saísse 0 passaria.
- conferir-entregas.test.ts:279-280: só comentário. Ele aponta onde está a prova do hook na 11.0 e não muda nenhuma asserção.
- conferir-entregas.ts: comentário sobre a regra 20, item 9, a função `git` quebrada em linhas sem mudar o comportamento, e a nota do git 2.36. Nada disso é cláusula nova sem bloco.
- Rodei `npx vitest run tools/ci/conferir-entregas.test.ts`: 59 de 59 passaram. A árvore atual difere de e4abb3e no 12_task.md só pelas duas linhas da tabela de Revisões, escritas pelo hook.
- Não há .skip, teste comentado nem mock que esconda a regra. O teste não chama IA e não há operação concorrente nova.
Bloqueantes: nenhum
Recomendações:
- A da 1ª rodada sobre o merge octopus agora está registrada em "Recomendações sem aplicar", com destino no TODO.md ou como limite na §5(a). Está certo; o Arquiteto decide.
```
