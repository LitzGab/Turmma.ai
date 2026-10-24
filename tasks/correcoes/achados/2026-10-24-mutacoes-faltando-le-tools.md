# Achados das revisões — `tasks/correcoes/2026-10-24-mutacoes-faltando-le-tools.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-24 09:45:10 · `tasks/correcoes/2026-10-24-mutacoes-faltando-le-tools.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A tarefa só muda a ferramenta do processo (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacoes-faltando-le-tools/tools/processo/mutacoes.ts`), o teste dela e uma frase de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacoes-faltando-le-tools/.claude/rules/40-testes.md`. Não há migration, schema, DTO, rota nem dado de pessoa.

Fora da tabela de dados do docs/lgpd.md: nada. A tarefa não cria campo pessoal.

Autorização por objeto: não se aplica. A tarefa não cria nem altera rota.

Logs: limpos. A única saída nova é o `process.stdout.write` que já existia, em `tools/processo/mutacoes.ts:727` e `tools/processo/portao-local.ts:169`. Ele roda na máquina do desenvolvedor ou no CI e imprime caminho, número e texto de linhas de código-fonte versionado do repositório. Não lê banco, não lê dado de aluno e não manda nada a serviço de log externo. O que não é código fica de fora de propósito, como o PDF de `tools/demonstracao/`, documentos `.md` e arquivos `.json`.

Auditoria: não se aplica. A tarefa não tem leitura de dado de aluno, exportação, alteração de nota, alteração de permissão nem aprovação de saída de IA.

Envio externo: nenhum. A tarefa só chama `git diff`, `git ls-files` e `readFileSync`, tudo local.

Seed/fixture: sintético. As fixtures do teste são repositórios git temporários em `tmpdir()`, com conteúdo trivial (`export const a = 1`, `if (x) y`). A tabela de caminhos usa nomes de arquivo inventados, sem nenhum nome de pessoa nem dado real.

Bloqueantes: nenhum.

Recomendações:
- Com a mudança, `tools/` passa a entrar na lista. Se alguém alterar um script de `tools/` que tenha texto de exemplo embutido (por exemplo `tools/ia/medir-risco-a-vida.ts` ou `tools/demonstracao/conteudo-estequiometria.ts`), essas linhas aparecem no stdout do `--faltando` e do portão, e daí nos logs do CI. Hoje esse texto é sintético, então não bloqueia. Vale deixar escrito que conteúdo embutido em `tools/` segue a mesma regra 17 do seed: nada de dado real.
- Pergunta de fechamento: a tarefa não muda o que o sistema guarda sobre um aluno nem para onde isso vai, então a resposta continua a mesma de antes desta correção.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-24 09:45:55 · `tasks/correcoes/2026-10-24-mutacoes-faltando-le-tools.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido

**Bloqueantes:** nenhum.

**Escopo e Tech Spec.** A correção faz o que pediram o item M1 do `TODO.md` e a retro. O `--faltando` agora lê também `tools/`, no diff e nos arquivos novos. A exigência de bloco de mutação para código de produção (RF17, `exigenciaDeMutacao`) e o `ehArquivoDeProducao` não mudaram. A §5d da `techspec.md` da X7 não limita o `--faltando` a `apps/` e `packages/`, então não há divergência em silêncio. A correção exclui dois casos a mais que o TODO, as pastas `fixtures/` e o que em `tools/` não é código. Os dois estão justificados no documento, com o motivo.

**Mutações.** Conferi as dez mutações uma a uma contra os testes citados, e cada uma deixa o teste vermelho.

**Recomendações (não bloqueiam):**
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacoes-faltando-le-tools/.claude/rules/40-testes.md:135`: a frase lista como excluídos só "teste, `__fixtures__/` e o que não é código". O código exclui mais: `.d.ts` e as pastas `fixtures/`, `test/`, `tests/` e `__tests__/`. Vale deixar a regra igual ao `ehArquivoDoFaltando`.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacoes-faltando-le-tools/tools/processo/mutacoes.ts:696-701`: o arquivo novo é lido inteiro antes do filtro, e agora isso vale para qualquer arquivo novo de `tools/`, inclusive PDF ou binário.
   - Em `portao-local.ts:169` a chamada não tem `try/catch`. Um arquivo novo que não se lê (um link para pasta, sem permissão) derruba o portão em vez de só pular a lista.
   - Filtrar com `ehArquivoDoFaltando` antes do `readFileSync` não muda nenhum teste e evita esse risco.
3. `mutacoes.ts:707-709`: o relatório ainda diz "Linhas novas de **produção**", mas agora lista também `tools/`. O documento já registra isso como pendente. Fica para quem decidir trocar o texto.
4. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacoes-faltando-le-tools/tasks/prd-harness/cenarios.md:17` descreve o RF5 só com "linha nova de produção". A spec já pousou, então não bloqueia, mas quem ler o cenário não vai saber que `tools/` entrou.
5. O item M1 do `TODO.md` (linha 1836) continua `[ ]`. É o Orquestrador quem marca no fechamento, então não é falha desta correção.

## test-engineer · 1ª rodada · APROVADO · 2026-10-24 09:45:58 · `tasks/correcoes/2026-10-24-mutacoes-faltando-le-tools.md`

VEREDITO: APROVADO

Cenários exigidos: esta correção mexe só na ferramenta do processo. Não toca dado de escola, permissão nem operação que possa rodar duas vezes ao mesmo tempo, então os cenários de isolamento, de permissão e de concorrência não se aplicam. Os cenários que importam aqui:
- caminho feliz: uma linha nova com condição em código de `tools/` aparece no `--faltando`;
- `apps/*/src` e `packages/*/src` continuam sendo lidos;
- o que fica fora de `tools/`: teste e spec, `.d.ts`, as pastas `test/`, `tests/`, `__tests__/`, `__fixtures__/` e `fixtures/`, e o que não é código (`.md`, `.json`, gancho do git sem extensão);
- caminho parecido com `tools/` que não é `tools/` (`ferramentas/tools/x.ts`);
- na árvore de verdade, os arquivos de `tools/` que já estão no git e os novos;
- um bloco sobre arquivo de `tools/` tira a linha da lista;
- o RF17 (`exigenciaDeMutacao`) não muda.

Cobertos:
- **Tabela de `ehArquivoDoFaltando`** (`tools/processo/mutacoes.test.ts:581-601`): 18 casos, com produção, `.mjs`, ajudante de teste que não é teste, teste, spec, `.d.ts`, `__fixtures__`, `fixtures`, `test/`, `.md`, `.json`, gancho sem extensão, `e2e/`, configuração fora de `src` e pasta parecida com `tools`.
- **`linhasSemBloco` com linhas de `tools/`** e o bloco do mesmo arquivo (`:603-613`).
- **Árvore de verdade** (`:688-721`): arquivo que já está no git e foi adicionado ao commit, arquivos novos, teste e fixture que já estão no git e mudaram, teste, fixture e `.md` novos. Também confere a saída exata do script, sem bloco e com dois blocos.
- **As 10 mutações do documento** cobrem cada condição nova do `git diff`: as cinco de `ehArquivoDoFaltando`, o filtro de `linhasSemBloco`, o diff e a lista de arquivos novos pedindo `tools`, e o filtro no fim de `linhasNovasDaArvore`. Nenhuma cláusula nova ficou sem bloco. Cada mutação deixa vermelho o teste que cita, pela cláusula que ela tira.
- **Os três testes da seção "Teste que reproduz"** existem com esses nomes.
- **`ehArquivoDeProducao` e `exigenciaDeMutacao`** não mudaram. O `portao-local.ts:169` só imprime o relatório e não decide nada com a lista.
- `npx vitest run tools/processo/mutacoes.test.ts`: 145 passaram, nenhum `.skip` e nenhum mock.

Bloqueantes: nenhum.

Recomendações:
1. **Frase incompleta na regra.** `.claude/rules/40-testes.md:135-136` diz "fora teste, `__fixtures__/` e o que não é código". A função também deixa de fora `.d.ts`, `fixtures/`, `test/`, `tests/` e `__tests__/`, como o próprio documento da tarefa escreve. A frase poderia listar tudo, ou dizer "fora teste, `.d.ts`, pastas de teste e fixture, e o que não é código".
2. **A mutação `return novas` não isola `tools/`.** Ela (documento, linhas 141-148) também fica vermelha pela linha de `apps/api/test/velho.int.test.ts`, que o repositório de teste já tinha antes. Não prova sozinha que o teste e a fixture de `tools/` saem da árvore. O efeito é pequeno, porque as exclusões já estão provadas uma a uma na tabela, mas o texto "Sai:" desse bloco promete mais do que o bloco mostra.
3. **Leitura de link para pasta.** `tools/processo/mutacoes.ts:697` faz `readFileSync` em todo arquivo novo de `apps`, `packages` e agora `tools`. Um link simbólico novo que aponte para uma pasta derruba o `--faltando` e o relatório do portão com `EISDIR`. O risco já existia em `apps` e `packages`; com `tools/` a área ficou maior. Vale filtrar com `ehArquivoDoFaltando` antes da leitura, ou ignorar o que não é arquivo comum.
4. **Título do relatório.** Ele ainda diz "Linhas novas de produção" e agora lista `tools/`. O documento já registra isso para o Arquiteto decidir; fica para a retro.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacoes-faltando-le-tools/tasks/correcoes/2026-10-24-mutacoes-faltando-le-tools.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacoes-faltando-le-tools/tools/processo/mutacoes.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacoes-faltando-le-tools/tools/processo/mutacoes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-24-mutacoes-faltando-le-tools/.claude/rules/40-testes.md
