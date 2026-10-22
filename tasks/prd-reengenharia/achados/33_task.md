# Achados das revisões — `tasks/prd-reengenharia/33_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-22 20:44:00 · `tasks/prd-reengenharia/33_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** A tarefa só move arquivos e troca imports, sem regra nova. O que precisa de prova é isto:
- O comportamento continua igual: a suíte que já existe passa depois da mudança de pasta.
- `identificadorDoAluno` é a escola, a barra e a matrícula, e a mesma matrícula em duas escolas dá dois identificadores (o caso de borda "matrícula repetida em escolas diferentes").
- O `credencial/index.ts` não exporta a `ResolucaoDeTenantRepository` nem a `ContaGlobalRepository`, nem com o nome delas nem com outro. Este é o caso de isolamento: a conta global não pode vazar pelo índice.
- `operacao/token-do-convite.ts` importa `hash-do-token.js` direto, porque o e2e carrega esse arquivo.
- Nenhum caminho antigo sobra no repositório.

Caminho feliz, permissão e concorrência não se aplicam, porque nada no comportamento muda.

**Cobertos:**
- `apps/api/src/credencial/identificador-do-aluno.test.ts` tem um `it` com as duas asserções. As duas mutações declaradas (trocar a ordem e tirar a escola) deixam o teste vermelho, porque ele compara com `'e1|123'`.
- `apps/api/test/arquitetura.test.ts`, no `it` "nem o barrel de credencial/ exporta…":
  - Confere que o índice traz `HashDeSenha`, para que um import que falhe sem aviso não deixe o teste verde à toa.
  - Confere `Object.keys` e `Object.values` contra as duas classes, então pega também a exportação com outro nome. As três mutações de índice declaradas caem nele.
- `tools/ci/playwright.test.ts › nada que o e2e carrega importa um pacote…`: o teste agora espera `credencial/hash-do-token.ts`, e a mutação de `token-do-convite.ts` apontando para o `index.js` cai nele.
- Os nomes que a tabela de cobertura cita existem nos arquivos movidos (`HashDeSenha`, `cookies de sessão`, `TOTP: SHA1…`, `esperaDaFalha…`, `desafio de login`, `RebaixamentoPorEscola`, `SemaforoDeHash: rodízio…`). Os `.int.test.ts` movidos continuam sendo achados pelo glob `**/*.int.test.ts` do `vitest.config.ts`.
- Eu mesmo conferi o caminho antigo com o `git grep` da seção "Como testar" (`src/sessao/<movidos>` e `dist/sessao/<movidos>`): saiu vazio. Fora de `credencial/` e `sessao/`, todo arquivo de `apps/api/{src,test}` importa pelo `index.js`, menos `token-do-convite.ts`, e essa exceção está justificada na tabela de divergências.
- `npx vitest run --project unidade apps/api/src/credencial tools/ci/playwright.test.ts tools/ci/codigo-do-autenticador.test.ts apps/api/test/arquitetura.test.ts` passou: 18 arquivos e 189 testes.
- Não há `.skip`, teste comentado nem mock novo.

**Bloqueantes:** nenhum.

**Recomendações:**
1. A regra "fora de `credencial/` e `sessao/`, só pelo `index.js`" e a conferência do caminho antigo hoje só se provam por `git grep` manual, e nada impede um import direto novo. Ela fica para a 12.0 (`dependency-cruiser`), que precisa da exceção de `apps/api/src/operacao/token-do-convite.ts` por arquivo, como a divergência já diz. Vale confirmar que a 12.0 cita essa exceção.
2. O `teste:` das duas mutações de `identificador-do-aluno` cita só o começo do nome do `it` ("é a escola, a barra e a matrícula"). Funciona por substring, mas citar o nome inteiro evita que um `it` irmão com o mesmo começo seja rodado no lugar dele.
3. Em `apps/api/src/config.ts:21`, a reescrita do import tirou a linha em branco antes de `export { ConfiguracaoInvalida }`. É só cosmético.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-22 20:44:13 · `tasks/prd-reengenharia/33_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login (só movimento de arquivo e de import; nenhum comportamento muda)
Rate limit: ok. O contador por conta (escola + matrícula), o balde por escola, o semáforo do hash e o rebaixamento por IP dentro da escola só mudaram de pasta. `identificadorDoAluno` continua montando a chave como `escolaId|matricula`, e o teste novo falha se a ordem trocar ou se a escola sair da chave.
Fila e prioridade: ok (a tarefa não toca a fila).
Concorrência: protegida. Não há lógica nova. Os repositories movidos têm o corpo igual ao de antes, e `CLIENTE_REDIS_LOGIN` continua sendo um `Symbol` único, definido só em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/credencial/cliente-redis-login.ts`. Nenhum módulo recria o token, então a injeção de dependência continua ligando o mesmo cliente Redis.
Índice e paginação: ok (nenhuma query nova).
Degradação de IA: não se aplica. `limite-de-pedidos-de-ia.ts` só mudou o caminho de um import de tipo.
Migration: não se aplica.
Métrica e alerta: ok. Nenhum caminho novo. `infra/scripts/carga-login.ts` e `carga-sala.ts` agora carregam `apps/api/dist/credencial/hash-de-senha.js`, e `infra/test/{alertas,carga-login}.test.ts` leem do caminho novo.
Bloqueantes: nenhum.

O que conferi:
- Fora dos imports, a única linha que muda é texto: comentários e caminhos citados.
- A busca no git pelos caminhos antigos não encontra nada.
- Nenhum arquivo de `credencial/` importa `sessao/`, `config`, `sala/`, `operacao/` ou `ops/`, então não há ciclo pelo `index.ts`.
- O `npm run typecheck` passou.
- A unidade de `credencial/`, o `arquitetura.test.ts` e o `playwright.test.ts` passaram (17 arquivos, 185 testes).

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/config.ts` passou a importar `credencial/index.js`, e com isso o carregamento da configuração puxa todos os repositories de `credencial/`. Funciona, mas importar `configuracao-de-login.js` e `configuracao-externa.js` direto deixaria a leitura da configuração leve. Vale decidir na 12.0, quando a regra do `index.ts` virar lint.
- `apps/api/src/sessao/senha/` ficou como pasta vazia na árvore de trabalho. O git não rastreia pasta vazia, então é só limpeza local.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 20:44:34 · `tasks/prd-reengenharia/33_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

O que conferi:
- **Movimento completo.** Os arquivos das subtarefas 33.2, 33.3 e 33.4 estão em `apps/api/src/credencial/`, e o git guarda cada um como renomeação. O `git grep` dos caminhos antigos sai vazio, inclusive o `importar('apps/api/dist/…')` do `infra/`.
- **Extração da 33.1.** `CLIENTE_REDIS_LOGIN` e `identificadorDoAluno` saíram de `sessao.module.ts` e de `matricula.service.ts` sem reexportação.
- **O `index.ts`.** Cada símbolo é exportado pelo nome, sem `export *`. Cada símbolo do índice tem ao menos um consumidor em `apps/api/{src,test}`, fora de `credencial/` e `sessao/`. Esses consumidores importam pelo `index.js`.
- **Exceção do e2e.** `e2e/`, `infra/`, `tools/` e `apps/worker` continuam importando o arquivo direto. A exceção de `operacao/token-do-convite.ts` está registrada em `onda-2.md` §2 e em `12_task.md`, e a mutação em `playwright.test.ts` cobre esse import.
- **Direção das dependências.** `credencial/` não importa de `sessao/`, `operacao/` nem `ops/`, então a mudança não cria ciclo.
- **A divergência do commit único** está em `tasks.md`, "Tarefa mecânica".

Recomendações:
1. **Registro do script desatualizado.** A terceira linha das divergências diz que o script ficou em `/tmp` e não usou `sourceFile.move`. Essa linha aponta para `tasks.md`, "Tarefa mecânica", que pede o script no `.processo/` da linha. A seção "Como testar" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/33_task.md` ainda descreve `.processo/mover/mover.cjs` com `sourceFile.move`. O resultado entregue não muda com isso, mas ninguém consegue repetir o passo. O mesmo problema volta na 34.0 e na 35.0. Vale corrigir o "Como testar" ou `tasks.md`, e dizer onde o script fica, por exemplo em `.mjs` dentro de `.processo/`, como na 36.0 e na 97.0.
2. **Linha em branco removida.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/config.ts:21`, o script tirou a linha em branco entre o último `import` e o `export { ConfiguracaoInvalida }`.
3. **Comentários além do import.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/credencial/credencial-matricula.repository.ts:14` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/credencial/registro-de-acesso.repository.ts:6`, o comentário trocou `ResolucaoDeTenantRepository` por "resolução de tenant (em `sessao/`)". É uma edição além de movimento e import, sem motivo escrito. Ou volta ao nome da classe, ou o motivo entra na tarefa.
4. **Pasta vazia.** `apps/api/src/sessao/senha/` ficou vazia na árvore local. O git não guarda pasta vazia, então só falta apagá-la no checkout.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 20:53:46 · `tasks/prd-reengenharia/33_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

As quatro recomendações da 1ª rodada foram atendidas:
1. O "Como testar" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/33_task.md` descreve agora os três arquivos do script (`mover.cjs`, `mapa-33.mjs` e `indice.cjs`) e o que o script faz de fato: reescreve pelo AST com resolução própria, sem `sourceFile.move`. Isso bate com a 4ª divergência registrada.
2. A linha em branco voltou em `apps/api/src/config.ts:22`.
3. Os comentários em `credencial-matricula.repository.ts:14` e `registro-de-acesso.repository.ts:6` viraram divergência registrada. O motivo se sustenta: a varredura `usosForaDoModuloSessao` de `arquitetura.test.ts` lê também o texto dos comentários, e relaxar essa varredura enfraqueceria a trava da regra 10. A coluna "Onde está na spec" cita `onda-2.md` §2.
4. A pasta `apps/api/src/sessao/senha/` não existe mais.

O diff desde a rodada aprovada não mexe em código além da linha em branco do `config.ts`. Não sobra nada para reauditar no restante.

Recomendações:
- O "Como testar" aponta para o scratchpad em `/tmp/claude-1000/.../589e15aa-.../scratchpad/mover/`. Essa pasta é da sessão e some quando ela acaba. A frase "quem repetir o passo os recria daqui" só funciona porque a descrição em prosa é detalhada o bastante. Vale tirar o caminho da pasta temporária e deixar só a descrição, para o documento não apontar para um caminho que vai sumir.
