# Achados das revisões — `tasks/correcoes/2026-10-03-e2e-sem-dist-do-shared.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-03 16:22:30 · `tasks/correcoes/2026-10-03-e2e-sem-dist-do-shared.md`

VEREDITO: REPROVADO

Cenários exigidos:
- Caminho feliz: a guarda passa quando nada que o e2e carrega importa `@educa/*` pelo nome, e o fixture grava um acesso da sala que a página pública encontra.
- Regressão: a guarda fica vermelha com o fixture da 17.0. Teria de falhar se a correção fosse desfeita.
- Borda 1: o import pelo nome está a mais de um salto do e2e (e2e → fixture → módulo da API → shared). É o caso da esteira 37144244963.
- Borda 2: o import pelo nome está num módulo alcançado por import relativo sem extensão. É a convenção de `apps/web`, e o e2e já importa de `apps/web`.
- Borda 3: import só de tipo, que é apagado na compilação e não deve reprovar.
- Borda 4: a guarda não pode depender de existir `dist` na máquina.
- Cópia das contas da API: se o token, o alfabeto ou o HMAC do fixture divergirem de `codigo-da-sala.ts`, um teste tem de reprovar.
- Permissão, isolamento e concorrência: não se aplicam. A correção não toca código de produção nem dado de escola.

Cobertos:
- Regressão: troquei só o fixture pelo de `HEAD`, mantive a guarda nova e rodei. Saiu 1 falha, apontando `apps/api/src/sala/codigo-da-sala.ts → @educa/shared`. Com o fixture corrigido, os 5 testes passam. O fixture foi restaurado, e o diff ficou como estava.
- Borda 1: a guarda percorre o fecho dos imports relativos a partir de cada `.ts` de `e2e/`.
- Borda 3: `import type` é ignorado. `import { type X }` reprova, o que é o lado seguro.
- Borda 4: a guarda só lê os fontes e não consulta o `dist`.
- Cópia das contas: comparei com `apps/api/src/sala/codigo-da-sala.ts` e é idêntica. São `randomBytes(BYTES_DO_TOKEN_DE_CONVITE)` em base64url, os 8 sorteios com `randomInt` do mesmo alfabeto, e o HMAC-SHA256 do código normalizado em base64url. A divergência futura é pega pelo `turma-publica.spec.ts`, que não acha o código se as contas mudarem.
- Não há `.skip`, mock nem chamada de IA.

Bloqueantes:
1. `tools/ci/playwright.test.ts:83-86`: um import relativo que a guarda não consegue resolver é descartado em silêncio. A guarda só troca `.js` por `.ts` e, quando `existsSync` falha, não segue o arquivo. Ela não tenta `.ts`, `.tsx` nem `index.ts` em import sem extensão.
   - Por que isso é um furo real, e não teórico:
     - O e2e já importa `apps/web/src/operacao/estados-da-escola.ts`.
     - `apps/web` usa import relativo sem extensão, por exemplo `apps/web/src/operacao/api/eu.ts:3`, `from './sessao'`.
     - 88 arquivos de `apps/web/src` importam `@educa/shared` pelo nome.
     - O carregador do Playwright resolve import sem extensão.
   - Consequência: se `estados-da-escola.ts` ganhar um `import { x } from './textos'` e esse módulo importar `@educa/shared`, a esteira cai com o mesmo erro desta correção e a guarda continua verde. O próprio documento da correção diz que a guarda segue os imports "também dentro de `apps/` e `packages/`", e é isso que ela não faz nesse caminho.
   - Correção exigida, em duas partes:
     - Resolver o import relativo nas mesmas formas que o carregador aceita: `.js` → `.ts`/`.tsx`, sem extensão → `.ts`, `.tsx`, `/index.ts`. Também ler arquivos `.tsx` alcançados.
     - Reprovar o import relativo que não resolve, por exemplo juntando-o numa lista `naoResolvidos` com `expect(naoResolvidos).toEqual([])`, em vez de pular.
   - Como provar a correção: um caso com um módulo alcançado por import sem extensão que importa `@educa/shared`. Pode ser fixture em pasta temporária, ou a função de varredura extraída e testada sobre uma árvore pequena.

Recomendações:
- A regex (`playwright.test.ts:80`) não pega:
  - import só de efeito (`import '@educa/shared'`);
  - `export * from` com aspas duplas;
  - `import()` dinâmico.

  Hoje o lint impõe aspas simples, mas vale cobrir pelo menos o import só de efeito.
- `expect(vistos.size).toBeGreaterThan(0)` é fraco. Basta ler o próprio `e2e/` para ele passar. Melhor afirmar que um arquivo conhecido fora de `e2e/` foi alcançado, como `apps/api/src/sessao/hash-do-token.ts`, para provar que a travessia atravessa pastas.
- O comentário em `e2e/__fixtures__/sessao.ts:841-843` já aponta o `turma-publica.spec.ts` como quem verifica a cópia. Vale citar no comentário de `codigo-da-sala.ts` que existe essa cópia no fixture, para quem mudar a conta na API saber onde mais mexer.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/playwright.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/codigo-da-sala.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-03-e2e-sem-dist-do-shared.md`

## test-engineer · 2ª rodada · APROVADO · 2026-10-03 16:45:50 · `tasks/correcoes/2026-10-03-e2e-sem-dist-do-shared.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Nada que o e2e carrega importa um pacote `@educa/*` pelo nome. Isso inclui os módulos da API e da web que ele alcança, a qualquer número de saltos.
- O import relativo é resolvido em todas as formas que o carregador aceita: `.js` vira `.ts` ou `.tsx`; sem extensão vira `.ts`, `.tsx` ou `index`.
- O import relativo que não resolve reprova, em vez de ser pulado.
- O import só de tipo não conta.
- A travessia sai de `e2e/` e chega à API.

**Cobertos (todos):**
- A correção exigida na 1ª rodada foi feita. `resolverRelativo` em `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/playwright.test.ts` tenta `.ts`, `.tsx`, `index.ts` e `index.tsx` para o import com `.js` e para o sem extensão. `naoResolvidos` é exigido com `toEqual([])` na guarda real e provado vermelho no caso `'../web/sumiu'`.
- O caso (a) chega a `@educa/shared` por quatro caminhos encadeados: import sem extensão, `.js` trocado por `.ts`, pasta com `index` e `.tsx`. Chega também a `@educa/outro` por `import()`. Retirar qualquer uma dessas formas do resolvedor ou da regex quebra o teste, seja por aparecer em `naoResolvidos`, seja por faltar no `peloNome`. Retirar o filtro do `import type` também quebra, porque entraria um terceiro item em `peloNome`.
- A guarda real exige que a travessia alcance `apps/api/src/sessao/hash-do-token.ts`. Uma varredura rasa, que parasse no primeiro salto, não passa mais.
- Rodei aqui e passaram 7 de 7. Não refiz a mutação contra o fixture de `HEAD`; aceito o relato de que a guarda fica vermelha com `apps/api/src/sala/codigo-da-sala.ts → @educa/shared`.
- Não há `.skip`, mock nem provedor de IA. A árvore temporária é apagada no `afterEach`.

**Bloqueantes:** nenhum.

**Recomendações:**
1. O import que não é relativo nem `@educa/*` (um alias como `@/…` ou `#…`) é pulado em silêncio. Hoje o e2e não usa nenhum. Se `apps/web` ou `apps/api` ganharem alias de caminho, a guarda deixa de seguir esses imports sem avisar. Vale um comentário dizendo isso, ou reprovar todo especificador que não seja relativo, `node:`, nem dependência do `package.json`.
2. A árvore sintética não tem `export … from '@educa/…'` como fonte direta do import pelo nome (o `export` só aparece em alvo relativo). Também não tem import em várias linhas (`import {\n a,\n b\n} from '@educa/shared'`). A regex cobre os dois, mas nenhum teste os prende.
3. O `import { type X } from '@educa/shared'` (tipo dentro das chaves) conta como import pelo nome. É o comportamento conservador e correto, mas vale uma linha no comentário para ninguém "consertar" depois.

## test-engineer · 3ª rodada · APROVADO · 2026-10-03 16:56:26 · `tasks/correcoes/2026-10-03-e2e-sem-dist-do-shared.md`

VEREDITO: APROVADO

**Cenários exigidos:** nesta rodada nova olhei só o diff de `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/playwright.test.ts` e conferi se as três recomendações da 2ª rodada foram aplicadas. O fixture `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts` não mudou e não auditei de novo.
1. Import pelo nome escrito em várias linhas é detectado.
2. `export { … } from '@educa/…'` direto é detectado.
3. O comentário diz que alias de caminho não é seguido e que `import { type X }` conta como import pelo nome.

**Cobertos:** os três.
- **Várias linhas:** a regex estática aceita quebra de linha dentro de `[^;'"]*?`. Mutação: se a classe deixasse de casar quebra de linha, o `@educa/shared` de `web/d.tsx` sairia de `peloNome`, porque a linha `} from '@educa/shared'` não começa com `import` nem `export`. O `toEqual` com a ordem exata quebraria.
- **`export … from`:** mutação: tirar `export` da alternância apaga `@educa/reexportado` e quebra o mesmo `toEqual`. A ordem esperada (shared, reexportado, outro) bate com o código: primeiro os estáticos na ordem do texto, depois o `import()` dinâmico.
- **`import type`:** o `import type { T } from '@educa/shared'` em `e2e/a.spec.ts` continua fora de `peloNome`, então a exclusão de import só de tipo segue provada.
- **Comentário:** o de `varrerImports` diz que especificador fora de relativo e `@educa/*` não é seguido, que alias (`@/`, `#`) exigiria ensinar a varredura, e que `{ type X }` conta como pelo nome de propósito.
- **Execução:** rodei o arquivo e os 7 testes passam.
- **Revisão de qualidade:** não há `.skip` nem mock. Os temporários são removidos no `afterEach`.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova.
