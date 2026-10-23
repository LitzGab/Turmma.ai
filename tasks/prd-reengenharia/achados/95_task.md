# Achados das revisões — `tasks/prd-reengenharia/95_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-23 00:36:49 · `tasks/prd-reengenharia/95_task.md`

VEREDITO: APROVADO

Escopo: respeitado. O item 4 do `95_task.md` pede que o guia seja conferido de novo depois das pastas (33.0 a 35.0, 96.0) e das camadas (12.0) e corrigido num commit de documento no fim da spec. O `c88231a` faz isso. Entraram as travas que a 1ª rodada marcou como "se entrarem": `erro-tipado`, `ErroDeInvariante` e `knip`. Só mudaram os dois arquivos de documento, e nenhum outro commit tocou neles depois.

Aderência à Tech Spec: ok. Nada contradiz a D81 (`docs/decisoes.md:1318-1350`, que cita dependency-cruiser, supressões nativas e knip como padrão de mercado) nem a `techspec.md:88` (as superfícies de `credencial/` e `sessao/` travadas pelo dependency-cruiser).

Portão local: o `conferir` responde "nunca passou nesta árvore". Não bloqueia, porque o `95_task.md` tira "Código, teste e portão" do escopo, como nas rodadas 1 a 4.

Bloqueantes: nenhum.

**1. Caminhos, comandos e peças citados.** Todos existem no HEAD.
- `tools/guardas/camadas.cjs`, `catraca.ts`, `catraca.test.ts`, `regras-erro.mjs`, `repositories-com-escopo.test.ts`, `escopo-dos-repositories.ts`, `tamanho-das-pastas.test.ts`.
- `eslint-suppressions.json` e `knip.json` na raiz.
- `package.json:15`: `lint` termina em `npm run guarda:camadas`.
- `package.json:21`: o `guarda:camadas` roda o `depcruise`.
- `package.json:23`: o `guarda:dependencias` roda `npm audit` e `knip`.
- Pastas e arquivos da API:
  - `sessao/{login,convite,renovacao,externa,tenant}/`;
  - `credencial/` sem nenhum `@Module` nem `*.module.ts`, e `credencial/senha/{contador-em-janela,semaforo-de-hash}.ts`;
  - `http/paginacao.ts:5,10` (`paginar`, `paginarPor`) e `operacao/escola/escola.ts:29,45` (`criarRede`, `criarEscola`);
  - `ops/` só com comandos, mais `contagens-de-privacidade.repository.ts` e `operacao-privacidade.repository.ts`, e nada de fora importa de `ops/`.
- `ErroDeInvariante` em `packages/shared/src/erros/erro-de-invariante.ts:13`.
- `SessaoModule` (`sessao.module.ts:27-56`): importa de `credencial/` o hash, o semáforo, o contador e o token do Redis do login, e os exporta (`:297`).
- Os describes de `arquitetura.test.ts` em `:66`, `:178`, `:976` e `:1170` cobrem os quatro itens da linha da §7.

**2. O que o texto diz de cada trava, contra o código.**
- **dependency-cruiser:** o texto bate com as regras de `camadas.cjs`:
  - a direção entre pacotes;
  - `app-nao-importa-app` e `producao-nao-importa-teste`;
  - `controller-nao-importa-repository` e `controller-nao-importa-drizzle`;
  - `service-nao-importa-drizzle` e `repository-nao-importa-service-nem-controller`;
  - `soPeloIndex` para `sessao/` e `credencial/`;
  - `sem-ciclo`.
- **Catraca:** `eslint.config.mjs:151-153` tem complexity 10, max-lines-per-function 80 sem linha em branco nem comentário, e max-depth 4. O `catraca.ts` recusa soma acima do teto e arquivo que ganhou supressão em relação ao HEAD, o que confere com "supressão nova reprova".
- **erro-tipado:**
  - barra `new Error`, `Error()` e literal ou template lançado;
  - barra o motivo do `ErroDeInvariante` que não é texto fixo, também pelo `super` de uma subclasse;
  - vale em `apps/*/src` e `packages/nucleo/src`, sem teste nem fixture (`index.mjs:38`, `:108`).
- **knip:** com `--include dependencies,unlisted`, ele pega a dependência declarada sem uso e a usada sem estar declarada.
- **Lint de entrada:** `eslint.config.mjs:87` vale em todo `apps/api/src/**/*.controller.ts`, e `:97` devolve o `@Req()` só a `sessao/` e `operacao/`.
- **Tamanho de pasta:** a trava percorre `apps/web/src` e `apps/api/src`, com limite de 25, conta só o que está direto na pasta e não tem exceções.

**3. Nada voltou das rodadas 1 a 4.** O commit não toca §5.1, §5.4, §5.6, a fila nem o "Onde fica a integração da API". A linha da IA na §7 continua dizendo que o lint só barra o import de SDK. A linha da integração no mapa continua com o texto aprovado na 4ª rodada, mais um "entre outros", que era a recomendação 1 dela.

Recomendações (não bloqueiam):
- **`guia-do-desenvolvedor.md:146-148`:** o mapa apresenta `credencial/` como "as primitivas da entrada", mas a pasta também guarda seis repositories da sessão (`criacao-de-sessao`, `escrita-de-sessao`, `credencial-matricula`, `registro-de-acesso`, `sessao-de-origem`, `acesso-publico`). Quem procura onde a sessão é gravada não chega lá pelo mapa. Vale meia linha.
- **`guia-do-desenvolvedor.md:148` e `arquitetura.md:53-54`:** "só pelo `index.ts`" tem uma exceção declarada em `camadas.cjs`, o `operacao/token-do-convite.ts`, que importa `credencial/hash-do-token.js` direto por causa do e2e. Quem tropeçar nela vai achar que a trava está furada.
- **`arquitetura.md:30-31`:** a regra `app-nao-importa-app` não vale para teste (`pathNot: TESTE`, "Entre `test/` passa"). "A app que importa outra app" lê-se como absoluto. O mesmo vale para a exceção do `expurgo-da-escola.repository.ts` na regra repository → service.
- **`guia-do-desenvolvedor.md:419`:** a linha do dependency-cruiser não cita `sessao-nao-importa-operacao`, `api-nao-importa-ops` e as três cercas por import. A linha do `arquitetura.test.ts` cobre as cercas só pelo nome da classe. Não é falso, mas está incompleto.
- **`arquitetura.md:51` e guia `:139`:** "com o controller, o service, o repository e os testes dele (`estrutura/turma/`)". Só que `estrutura/turma/` tem só o trio, e os testes da estrutura estão em `apps/api/test/`, como a própria §6 do guia diz. Vale trocar o exemplo ou dizer "quando o módulo guarda os testes ao lado".
- **`regras-erro.mjs` / `index.mjs:38`:** o escopo do `erro-tipado` deixa `packages/shared/src` de fora. Hoje não há nenhum `throw new Error` ali, mas o texto "em produção" do guia (`:418`) cobre mais do que a trava.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/docs/guia-do-desenvolvedor.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/docs/arquitetura.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tools/guardas/camadas.cjs`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/eslint.config.mjs`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tools/guardas/regras-erro.mjs`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia/tools/guardas/tamanho-das-pastas.test.ts`
