# Correção — a varredura de pasta do portão local (gitleaks dir) não lê o documento de tarefa, porque a exceção do plano perdoa o arquivo inteiro

**Origem:** "Achado fora do escopo" de `tasks/correcoes/2026-10-25-gitleaks-excecao-do-plano-nao-reprova.md`, com a nota do `test-engineer` sobre o caso `reprova o segredo em arquivo ainda sem commit…`. Uso (descoberto ao reproduzir outro defeito).
**Subagentes obrigatórios:** `privacy-guardian`, `tenancy-guardian`, `conformidade-reviewer`, `infra-guardian`, `revisor-geral`
<!-- O `privacy-guardian` e o `revisor-geral` vieram no PEDIDO do Orquestrador. Os outros três são os que a tabela por caminho (`tools/processo/guardioes-por-caminho.ts`) liga a `tools/guardas/`, onde mora o teste; o portão exige `revisor-geral` em correção de código de processo (`tools/ci/`). test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

O portão local olha os arquivos alterados que ainda não têm commit com `gitleaks dir` (`tools/ci/segredo.ts`). Num documento `tasks/prd-*/N_task.md` com um `ghp_…` de verdade, a varredura de pasta não acha nada:

```
# pasta com tasks/prd-x/1_task.md e docs/outro.md, os dois com o mesmo token
INF scanned ~59 bytes (59 bytes)      <- só docs/outro.md; o documento de tarefa não foi lido
File:        docs/outro.md
```

Sem a exceção do plano no `.gitleaks.toml`, a mesma pasta lê 118 bytes e reprova os dois. O segredo escrito no documento de tarefa só aparece na varredura do histórico, depois do commit e do push, quando já é incidente (o repositório é público).

## Fora desta correção

Nada.

## Causa

O `gitleaks dir` trata a allowlist de caminho como "pular o arquivo", sem olhar a condição `AND` nem a regex de linha. A exceção do plano do Postgres tem `paths = ['^tasks/prd-[a-z0-9-]+/\d+_task\.md$']` e uma regex de linha; no modo `git` as duas valem juntas (o teste `a exceção do plano é do documento de tarefa…` prova que um segredo em outra linha do mesmo documento reprova), mas no modo `dir` o caminho sozinho basta e o arquivo não é lido. Medido com o gitleaks da esteira (`v8.30.1`) e o `.gitleaks.toml` do projeto, isolando uma allowlist por vez: só a do plano casa com o caminho do exemplo, e só ela esvazia a varredura.

**O mesmo vale para as outras três exceções por arquivo e linha** (`techspec.md` do F0, o doc do Playwright, o teste do convite): todas têm `paths` e uma regex de linha, e na varredura de pasta o arquivo delas inteiro fica sem ser lido. O defeito é do modo `dir`, não só do plano, e por isso o conserto troca o modo, em vez de mexer em uma exceção.

**Da tarefa que a trouxe:** a 5.0 do F3 (`23dd9eaf`), que levou o gitleaks para o portão local e criou a exceção do plano. O caso `reprova o segredo em arquivo ainda sem commit` afirma `soPlano.codigo === 0` e `not.toContain(TAREFA_COM_PLANO)`, o que é verdade pela razão errada: o arquivo não é lido, e nunca se provou que um segredo nele reprova.

## Teste que reproduz

Dois casos novos em `tools/guardas/gitleaks.int.test.ts`, no `describe` do gitleaks com o `.gitleaks.toml` do projeto:

- `reprova o segredo nos arquivos que têm exceção, também na varredura de pasta: o caminho perdoado não esvazia o arquivo`: um `ghp_` em cada um dos cinco caminhos que as exceções alcançam (documento de tarefa, Tech Spec do F0, skill do Playwright, teste do convite e o documento da correção do convite), varridos como a pasta do portão; exige código 1 e o `File:` de cada um.
- `na varredura de pasta, a exceção do plano e a do convite continuam valendo só para a linha: o plano passa, e um segredo na linha ao lado reprova`: as duas linhas perdoadas sozinhas passam (código 0), e a linha do plano com um `ghp_` ao lado, no mesmo documento de tarefa, reprova.

- **Vermelho antes:** `npx vitest run --project integracao tools/guardas/gitleaks.int.test.ts -t "varredura de pasta"`, 2 vermelhos: `scanned ~0 bytes … no leaks found: expected +0 to be 1`, em 25/10/2026.
- **Verde depois:** a suíte inteira do arquivo, 15 de 15.
- **De ponta a ponta:** `tasks/prd-zz-prova/1_task.md` com um `ghp_`, sem commit, e `npm run guarda:segredo`: "leaks found: 1", código 1 (antes, 0 bytes lidos). O arquivo foi removido em seguida.

## Correção

`tools/ci/pasta-como-repositorio.ts` (novo): `pastaComoRepositorio` faz da pasta dos arquivos alterados um repositório git de um commit só, com o `.gitleaks.toml` do projeto na raiz. `tools/ci/etapas-do-segredo.ts` (novo, tirado do `segredo.ts`, que roda ao ser importado e por isso não podia ser chamado pelo teste) monta as etapas: a pasta é varrida com `argumentosGitleaks` (o modo `git`, o mesmo da guarda do histórico), no lugar do `gitleaks dir`; `tools/ci/segredo.ts` ficou só com a execução; no modo `git` caminho e regex de linha valem juntos, então o documento de tarefa é lido e só a linha do plano é perdoada. `argumentosGitleaksDaPasta` saiu de `tools/ci/etapas-de-guarda.ts`, sem outro uso.

No teste, `varrerPasta` passou a usar o `pastaComoRepositorio` de produção, em vez de montar a própria chamada: o caso `reprova o segredo em arquivo ainda sem commit…` agora prova o caminho que o portão faz, e o `soPlano.codigo === 0` passa porque a linha é perdoada com o arquivo lido, e não porque ele ficou sem ser lido.

Só `tools/` mudou: nenhum código de `apps/*/src` nem de `packages/*/src`, por isso o documento não tem bloco de mutação (RF17). O que prova a cláusula nova são os dois casos acima, vermelhos antes e verdes depois.

### Rodada 1: as cinco recomendações da Mesa (`.processo/ordens/2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa-r1.md`)

1. **Pasta temporária na falha:** `copiaDosAlterados` envolve a cópia e o `pastaComoRepositorio` num `try` que apaga a pasta e relança. Teste: `tools/ci/etapas-do-segredo.test.ts › se montar o repositório da pasta falhar…` (com `TMPDIR` apontado para uma pasta vazia, que tem de continuar vazia). Sem o `try`, ele fica vermelho.
2. **Ambiente do git:** `gitNaPasta` roda com o ambiente do processo sem as variáveis `GIT_*`, com `GIT_CONFIG_GLOBAL=/dev/null` e `GIT_CONFIG_NOSYSTEM=1` e com `-c core.attributesFile=/dev/null`. Dois casos em `tools/guardas/gitleaks.int.test.ts › pastaComoRepositorio`, um por cláusula: `não herda o ambiente de um hook` (`GIT_DIR` apontando para outro repositório; vermelho antes, `expected false to be true`: o `init` caiu no repositório do `GIT_DIR`) e `não herda a configuração do desenvolvedor` (`HOME` com um `.gitconfig` de `init.templateDir`, e `XDG_CONFIG_HOME` dentro dele; o `marcador` do molde não pode aparecer no `.git` da pasta). Provado por mutação à mão: sem `GIT_CONFIG_GLOBAL: '/dev/null'` em `ambienteDoGit`, o segundo caso fica vermelho (o primeiro continua verde). **Sem teste próprio, por escolha:** `GIT_CONFIG_NOSYSTEM` (exigiria mexer em `/etc/gitconfig`) e `core.attributesFile=/dev/null` (só importa com um filtro definido, que a configuração global ignorada já não traz); são defesa extra, e o JSDoc de `ambienteDoGit` diz isso.
3. **A ligação do `segredo.ts` não tinha teste:** as etapas saíram para `tools/ci/etapas-do-segredo.ts`, que o script e o teste usam. `etapas-do-segredo.test.ts › com arquivo alterado, a segunda varredura é do modo git…` confere o subcomando `git` depois da imagem, a ausência de `dir`, o volume que aponta para a pasta e o conteúdo do commit (`ls-files`: o arquivo alterado e a configuração). Provado por mutação à mão: trocar `git` por `dir` na segunda etapa deixa o caso vermelho. Na rodada 2, `arvoreDeTrabalho` passou a ser calculada antes da cópia: se o `git rev-parse` falhar, ainda não há pasta temporária para ficar no disco. Teste (rodada 3): `etapas-do-segredo.test.ts › fora de um repositório, a exceção do git rev-parse sobe antes de qualquer cópia…`. Provado por mutação à mão: com `historico` calculado depois de `copiaDosAlterados`, ele fica vermelho (sobra `educa-segredo-*` no `TMPDIR`).
4. **`git` com identidade fixa em dois lugares:** o `git()` do teste chama o `gitNaPasta` de produção.
5. **Comentário repetido:** saiu do `segredo.ts` com a reescrita; a explicação fica no JSDoc de `pastaComoRepositorio`.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | `segredo.ts`: "a pasta temporária `educa-segredo-*` … nunca é apagada depois da varredura … `rmSync` está importado sem uso. Vale remover a pasta ao fim de `executarEtapas`" | Recusada: a premissa não confere. `rmSync` é usado em `segredo.ts` (`executarEtapas(etapas, () => { if (alterados !== null) rmSync(alterados, …) })`) e `executarEtapas` roda a finalização sempre, também com a etapa vermelha (`tools/ci/executar.ts:42-45`). O que faltava, a falha antes de `executarEtapas`, é o item 1 |
| privacy-guardian (1ª) | `pasta-como-repositorio.ts:29-30`: o `chmod -R a+rX` deixa a cópia temporária legível por qualquer usuário da máquina; limitar ao UID do contêiner "se a imagem permitir" | TODO.md (Processo e dívida): já existia antes desta correção, o próprio revisor o chama de efeito pequeno, e depende de qual UID a imagem fixada do gitleaks usa, o que muda comportamento e precisa ser medido |
| revisor-geral (1ª) | Linha de "resolvido por 2026-10-25-gitleaks-pasta-perdoa-documento-de-tarefa" no documento antigo `2026-10-25-gitleaks-excecao-do-plano-nao-reprova.md` ou no índice | Recusada: o documento antigo é histórico, já com a seção "Revisões" fechada, e o índice de achados é escrito pelo hook. A ligação já está na "Origem" do documento desta correção |
| infra-guardian (2ª) | `gitleaks.int.test.ts`: o `vi.unstubAllEnvs()` logo depois de `pastaComoRepositorio` deveria sair, deixando a limpeza só no `afterEach` | Recusada: o próprio revisor diz que não muda o resultado (o `afterEach` já limpa); a chamada ficou nos dois casos novos, logo depois de `pastaComoRepositorio`, para as asserções rodarem com o ambiente de volta, e não custa nada. Aprovou, e a recomendação de quem aprovou não entra em ordem depois da primeira |
| infra-guardian (2ª) | `etapas-do-segredo.test.ts`: o `git()` local do teste roda com o ambiente do processo; usar o de `gitNaPasta` | Recusada: só lê (`ls-files`, `rev-list`), e o risco (`GIT_DIR` herdado de um hook) é o mesmo que o `test-engineer` classificou como hipotético na 1ª rodada, porque nenhum hook chama o portão |
| revisor-geral (2ª) | `etapas-de-guarda.ts:90`: o JSDoc de `GuardaDaEsteira` ainda diz que `tools/ci/segredo.ts` monta as etapas do segredo; agora é `etapas-do-segredo.ts` | `TODO.md`, "Processo e dívida do F0": comentário de uma linha; mexer em `etapas-de-guarda.ts` caducaria de novo quem já aprovou |
| revisor-geral (2ª) | `etapas-do-segredo.test.ts`: o caso de falha usa a falta do `.gitleaks.toml`; uma falha do próprio git (o commit) ficaria mais perto do cenário descrito | Recusada: o revisor a chama de "cobertura extra"; o `try` está provado, e o ponto da falha não muda o que ele faz |
| privacy-guardian (2ª) | O destino "TODO.md" dado ao `chmod -R a+rX` não tinha sido escrito | Escrito em `TODO.md`, "Processo e dívida do F0", junto com a entrada do comentário de `etapas-de-guarda.ts` |
| infra-guardian (3ª) | A entrada do `chmod -R a+rX` no `TODO.md` não tem "dono:", e as vizinhas têm | Recusada na ordem r3: aprovou, e a recomendação de quem aprovou não entra depois da primeira ordem. O Orquestrador pode pedi-la junto com o diagnóstico |
| revisor-geral (3ª) | O JSDoc de `GuardaDaEsteira` em `etapas-de-guarda.ts:90` está desatualizado | Já no `TODO.md` (entrada escrita na rodada 2) |
| test-engineer (3ª) | Continuam registradas as recusas da 2ª rodada (o `git()` local de `etapas-do-segredo.test.ts:39` sem `ambienteDoGit`, e a falha provocada pelo `.gitleaks.toml`) | Sem mudança: nenhuma bloqueia |
| revisor-geral (4ª) | Pôr as mutações à mão dos itens 1, 2 e 3 em blocos ` ```mutacao `, para a prova rodar de novo a cada portão | Recusada: o próprio revisor diz que a RF17 não obriga (só `tools/` mudou); o bloco custaria nova rodada de quem já aprovou |
| test-engineer (4ª) | O caso `fora de um repositório…` verifica só `toThrow()`; prender à causa com `toThrow(/rev-parse\|não é um repositório\|not a git repository/)` ou pelo `stderr` | Recusada: ele mesmo diz que hoje nada antes do `rev-parse` pode falhar nesse cenário e que não bloqueia; mexer no teste caducaria de novo os dois revisores |
| test-engineer (4ª) | O `fatal: não é um repositório git` aparece na saída do vitest porque o `execFileSync` de `pastaDoGit` não captura o `stderr` | Recusada: ruído na saída, sem efeito na regra; mexer em código de produção caducaria os seis revisores |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 15:41:47 | 2026-10-25 15:41:58 | `tenancy-guardian` | 1 | APROVADO | a7f78a6220362b412 |
| 2026-10-25 15:41:48 | 2026-10-25 15:42:03 | `conformidade-reviewer` | 1 | APROVADO | ab70cd19a5392f9a9 |
| 2026-10-25 15:41:50 | 2026-10-25 15:42:10 | `infra-guardian` | 1 | APROVADO | a4e77e2f2dafbf8ad |
| 2026-10-25 15:41:46 | 2026-10-25 15:42:28 | `privacy-guardian` | 1 | APROVADO | a58e6788807580163 |
| 2026-10-25 15:41:51 | 2026-10-25 15:42:35 | `revisor-geral` | 1 | APROVADO | a23951ca59f311e8a |
| 2026-10-25 15:41:52 | 2026-10-25 15:43:49 | `test-engineer` | 1 | APROVADO | a015baec81ca2e429 |
| 2026-10-25 15:51:05 | 2026-10-25 15:51:15 | `tenancy-guardian` | 2 | APROVADO | a4c66d206b61a0a43 |
| 2026-10-25 15:51:09 | 2026-10-25 15:51:22 | `conformidade-reviewer` | 2 | APROVADO | a7ac92126049c7da8 |
| 2026-10-25 15:51:14 | 2026-10-25 15:51:35 | `infra-guardian` | 2 | APROVADO | ab2593d49b28d0459 |
| 2026-10-25 15:51:01 | 2026-10-25 15:51:40 | `privacy-guardian` | 2 | APROVADO | ac62e75c01613d948 |
| 2026-10-25 15:51:18 | 2026-10-25 15:51:47 | `revisor-geral` | 2 | APROVADO | a2348c539ea5bec84 |
| 2026-10-25 15:51:23 | 2026-10-25 15:52:50 | `test-engineer` | 2 | REPROVADO | ad1fc43619081002d |
| 2026-10-25 15:58:53 | 2026-10-25 15:59:00 | `tenancy-guardian` | 3 | APROVADO | a7d7ff7828282e7ee |
| 2026-10-25 15:58:57 | 2026-10-25 15:59:08 | `conformidade-reviewer` | 3 | APROVADO | ac1a35129b5f703ce |
| 2026-10-25 15:58:49 | 2026-10-25 15:59:18 | `privacy-guardian` | 3 | APROVADO | abb29f089b82c4c24 |
| 2026-10-25 15:59:01 | 2026-10-25 15:59:27 | `infra-guardian` | 3 | APROVADO | ab775da99538be610 |
| 2026-10-25 15:59:05 | 2026-10-25 15:59:38 | `revisor-geral` | 3 | APROVADO | a4a6049eae20ed45e |
| 2026-10-25 15:59:11 | 2026-10-25 16:00:17 | `test-engineer` | 3 | REPROVADO | ac11897d74cfdd457 |
| 2026-10-25 16:07:45 | 2026-10-25 16:08:05 | `revisor-geral` | 4 | APROVADO | a6021efd3c08c02d9 |
| 2026-10-25 16:07:42 | 2026-10-25 16:08:08 | `test-engineer` | 4 | APROVADO | a10ee736ecf39fd0a |
