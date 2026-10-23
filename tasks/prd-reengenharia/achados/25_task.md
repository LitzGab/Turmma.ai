# Achados das revisões — `tasks/prd-reengenharia/25_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-23 00:00:31 · `tasks/prd-reengenharia/25_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As seis divergências estão na tabela do `25_task.md` e também em `tasks/prd-reengenharia/onda-1b.md`, na seção "RF13 — Dependências e `throw`", parte "Como a 25.0 ficou". A `techspec.md` é dividida nos `onda-<n>.md`, então o registro vale como Tech Spec. As seis são: a classe mora em `packages/shared` e não no `nucleo`; o motivo fixo é cobrado pelo lint e não pelo tipo; `__fixtures__` fica fora da guarda; as quatro mensagens com valor viraram texto fixo; `ArgumentoInvalido` recebe a opção já com os traços; e entrou a função `exigirMapaDeAcoesValido`. Não existe `cenarios.md` em `tasks/prd-reengenharia/`.
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

Recomendações:
1. O comentário de `RotasSemPermissao` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/permissao/conferencia-das-permissoes.ts:654-656` diz que o Node mostra `rotas` junto do erro, e isso não acontece no boot real. Em `apps/api/src/main.ts`, o `registrarErrosDoProcesso` intercepta a rejeição e loga só `resumirErro(erro)`, que leva apenas o tipo e a pilha (`packages/nucleo/src/log/logger.ts:150`). O nome do controller e do método não chega ao log. Não piorou: antes a `message` também era descartada. Corrija o comentário, ou faça o log levar `rotas`, que não é dado pessoal.
2. Vários arquivos ganharam um segundo `import` de `@educa/shared` ao lado do `import type` que já existia, em vez de juntar os dois numa linha só. São eles `packages/nucleo/src/contexto/contexto.ts:5`, `packages/nucleo/src/fila/job-registro.repository.ts:3`, `packages/nucleo/src/titular/leitura-do-titular.ts:3` e `apps/api/src/ops/operacao-privacidade.repository.ts:4`. Nos outros arquivos a troca entrou na importação que já existia. Vale escolher um jeito só.
3. A guarda aceita `super(\`... ${valor}\`)` em subclasse direta de `Error`, e a fixture `erro-tipado-permitido.ts` (`ComOutroPai`) prova que isso passa. O cabeçalho de `tools/guardas/regras-erro.mjs` não lista esse caso entre os limites declarados. Acrescente uma linha, para quem revisar saber que a mensagem de classe própria do módulo não passa pela guarda.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-23 00:01:49 · `tasks/prd-reengenharia/25_task.md`

VEREDITO: REPROVADO

**Cenários exigidos (tabela da 25.0):**
1. A classe `ErroDeInvariante`.
2. O motivo interpolado é recusado.
3. A guarda vale em `apps/*/src` e em `packages/nucleo/src`.
4. `throw 'x'`, `` throw `x` `` e `throw Error('x')` sem `new` reprovam.
5. Em teste e em `__fixtures__` a guarda não vale; o `main.tsx` da web é a exceção única.
6. O `eslint-disable` não fura a guarda.
7. As mensagens que os testes de hoje afirmam seguem iguais.
8. Rota sem `@Permite` derruba o boot, com controller e método em campos.
9. `ErroDeInvariante` no filtro global vira `ERRO_INTERNO`, sem motivo nem pilha.
10. O `ArgumentoInvalido` é uma classe só.
11. O comando de ops sai como hoje (regressão).

Casos de borda do domínio, isolamento e concorrência não se aplicam: a tarefa não cria caminho de dado de escola nem operação que roda duas vezes. O caso de permissão é o 8 (boot recusado).

**Cobertos:**
- **Itens 1 a 6:** `guardas.test.ts › guarda de erro tipado`. A fixture `erro-sem-tipo.ts` tem as 21 formas e roda nos 6 alcances. Também há `erro-tipado-permitido.ts` (o jeito certo), os caminhos de teste e de `__fixtures__`, o `main.tsx`, a passada sem comentários, o nível `error` na configuração e a varredura do repositório inteiro, que dá zero violações. A fixture tem o `descrever()` em `ComCampo`, e é ele que prova a cláusula `callee.type !== 'Super'`.
- **Item 7:** conferi as 76 trocas no diff. A mensagem é a mesma em todas, menos nas quatro declaradas. `execucao.int.test.ts:453` passou.
- **Item 9:** `erro.int.test.ts › ErroDeInvariante vira ERRO_INTERNO 500…` afirma que o corpo não traz o motivo nem o nome da classe, e que o log leva `tipo: 'ErroDeInvariante'`.
- **Item 10:** `uso.test.ts` e `sessao-sintetica.test.ts` usam `toBe` na classe reexportada.
- **Itens 11, MapaDeAuditoriaInvalido e `colunasDoSelect`:** os testes afirmam a mensagem e o campo, e conferem que o valor recusado não aparece na mensagem.

Rodei os testes citados: unidade com 9 arquivos e 302 testes, mais `erro.int.test.ts` (10) e `execucao.int.test.ts`. Tudo verde. Não achei `.skip`, nem mock que esconda a regra. Não há IA envolvida.

**Bloqueantes:**
1. **A classe `RotasSemPermissao` tem três cláusulas novas sem bloco de mutação e sem asserção que as prove.**
   - Onde: `packages/nucleo/src/permissao/conferencia-das-permissoes.ts:61`, `:65` e `:66`.
   - As três cláusulas: o `extends ErroDeInvariante`, a mensagem fixa no `super('rota sem @Permite, @RotaAnonima nem marcador da operação')` e o `this.name = 'RotasSemPermissao'`.
   - O teste em `apps/api/test/permissao-no-boot.test.ts:285-288` só confere o `instanceof RotasSemPermissao`, o `codigo` e o `rotas`. Ele continua verde com `super('')`, sem o `this.name` e com `extends Error`.
   - O teste antigo afirmava essa mensagem, que é o que aparece no terminal quando o boot cai. A mesma tarefa deu bloco a essas três coisas em `MapaDeAuditoriaInvalido`, mas não aqui.
   - **Correção exigida:**
     - No teste, acrescentar `expect(recusa).toBeInstanceOf(ErroDeInvariante)` e pôr `name: 'RotasSemPermissao'` e `message: 'rota sem @Permite, @RotaAnonima nem marcador da operação'` no `toMatchObject`.
     - Na seção "Mutações", acrescentar três blocos com esse teste: `super('')`, a remoção do `this.name` e `extends Error`.

**Recomendações:**
- **Galhos sem prova em `tools/guardas/regras-erro.mjs:51-52`.** O `alternate` do ternário e o `left` do `||` não são provados: a fixture só põe o `Error` no `consequent` (linha 17) e no `right` (linha 21). Tirar `?? problemaDoLancado(atual.alternate)` ou `problemaDoLancado(atual.left) ??` deixa tudo verde. Duas linhas a mais na fixture resolvem: `condicao ? new ErroDeInvariante('y') : new Error('x')` e `new Error('x') || valor`.
- **`regras-erro.mjs:31`, o `!no.computed`.** Ele deixa passar `throw new globalThis['Error']('x')`. Ou se declara isso como limite no cabeçalho, ou se tira a condição e se põe na fixture.
- **`packages/nucleo/src/auditoria/acoes.ts:822`.** Remover a chamada `exigirMapaDeAcoesValido(ACOES_DE_AUDITORIA)`, que roda ao carregar o módulo, não faz nenhum teste falhar. O limite está declarado na divergência; vale registrá-lo também no `onda-1b.md`, se ainda não estiver lá.
- **`apps/web/src/areas/professor/ferramentas/ferramentas.ts`.** A mensagem `'ferramenta fora do catálogo'` deixou de levar o valor, e nenhum teste da web afirma o texto nem o tipo. Uma asserção em `ferramentas.test.ts` com `toThrow(ErroDeInvariante)` fecharia isso.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-23 00:09:08 · `tasks/prd-reengenharia/25_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido. O `conferir` deu "portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)".
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/web/src/areas/professor/ferramentas/ferramentas.test.ts`: o novo `describe('ferramentaDoCatalogo')` chama `ferramentaDoCatalogo(fora)` três vezes para fazer três asserções. Dá para capturar o erro uma vez só, com `try/catch` ou `.catch` num wrapper, e conferir tipo, mensagem e ausência do nome no mesmo objeto. O teste fica mais curto e não muda de força.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/25_task.md`: as duas mutações de `ferramentas.ts` citam o teste por um prefixo do nome, "a ferramenta fora do catálogo é um ErroDeInvariante", e o nome real continua com "de motivo fixo, sem o nome recebido". O carimbo prova que o casamento funciona. Mesmo assim, citar o nome inteiro evita que a mutação passe a casar com outro teste se um dia surgir outro com o mesmo começo.

Nesta rodada conferi o diff entre `8af5ee2` e `26e2526`:
- As três recomendações da 1ª rodada foram feitas:
  - o comentário de `RotasSemPermissao`, em `packages/nucleo/src/permissao/conferencia-das-permissoes.ts`, agora diz que `rotas` não aparece no log do boot real;
  - os dois `import` de `@educa/shared` viraram um só em `operacao-privacidade.repository.ts`, `contexto.ts`, `job-registro.repository.ts` e `leitura-do-titular.ts`;
  - o limite do `super` de classe própria está declarado no cabeçalho de `tools/guardas/regras-erro.mjs`.
- O que mudou para atender o `test-engineer` não invade outra tarefa nem cria um segundo jeito de fazer algo que o projeto já faz:
  - as asserções novas em `apps/api/test/permissao-no-boot.test.ts`;
  - o teste de `ferramentaDoCatalogo`;
  - as duas linhas novas em `tools/guardas/__fixtures__/erro-sem-tipo.ts`, que cobrem os dois lados do ternário e do `||`;
  - as sete mutações novas no documento da tarefa.
- O limite novo escrito em `tasks/prd-reengenharia/onda-1b.md` diz o que o teste não alcança, e não é divergência de arquitetura. Por isso não precisa ir para a `techspec.md` nem para o `cenarios.md`.

## test-engineer · 2ª rodada · APROVADO · 2026-10-23 00:09:21 · `tasks/prd-reengenharia/25_task.md`

VEREDITO: APROVADO

Cenários exigidos (rodada 2, só o diff desde a rodada 1 e a correção exigida):
- `RotasSemPermissao` tem o tipo, o `name` e a `message` provados, e cada uma das três cláusulas tem o seu bloco de mutação.
- A guarda de erro tipado reprova o `Error` também no galho `alternate` do ternário e no `left` do `||`.
- `ferramentaDoCatalogo` lança um `ErroDeInvariante` com motivo fixo, sem levar o nome que recebeu.

Cobertos:
- **Correção exigida 1, feita.**
  - O teste `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/permissao-no-boot.test.ts`, "rota sem @Permite, sem @RotaAnonima e sem marcador da operação derruba o boot", ganhou `toBeInstanceOf(ErroDeInvariante)`, e o `toMatchObject` agora confere `name: 'RotasSemPermissao'` e a `message` fixa.
  - O `25_task.md` ganhou os três blocos de mutação com esse teste: `super('')`, a remoção do `this.name` e `extends Error`. Cada um derruba uma asserção diferente.
- **Galhos da guarda.**
  - A fixture `tools/guardas/__fixtures__/erro-sem-tipo.ts` ganhou duas linhas marcadas `reprova:`. Uma lança `Error` no `alternate`, com um `consequent` válido. A outra lança `Error` no `left` do `||`.
  - Os dois blocos de mutação de `regras-erro.mjs` (linhas 53 e 54) apontam para o `it.each` que compara o resultado do lint com as marcas da fixture. Tirar um galho apaga uma violação esperada, e o teste fica vermelho pelo motivo certo.
- **`ferramentaDoCatalogo`.**
  - O teste novo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/web/src/areas/professor/ferramentas/ferramentas.test.ts` confere o tipo, a mensagem exata e a ausência do nome recebido.
  - Dois blocos de mutação, a interpolação do nome e a troca por `Error`, derrubam a segunda e a primeira asserção.
- **O resto do diff não muda comportamento.** São imports de `ErroDeInvariante` juntados numa linha só em 5 arquivos, o comentário de `RotasSemPermissao` e os limites declarados em `regras-erro.mjs` e `onda-1b.md`. Nada disso pede teste.
- `npx vitest run` nos três arquivos de teste tocados: 4 arquivos, 238 testes, todos verdes. Não há `.skip`, mock nem chamada a provedor de IA no diff.

Bloqueantes: nenhum.

Recomendações:
- O `teste:` dos dois blocos de `ferramentas.ts` cita "a ferramenta fora do catálogo é um ErroDeInvariante", que é só o começo do nome do teste. O nome completo segue com "de motivo fixo, sem o nome recebido". O portão encontrou o teste, mas o nome inteiro deixa a citação sem ambiguidade se aparecer outro teste com o mesmo começo.
- No `onda-1b.md`, a chamada `exigirMapaDeAcoesValido(ACOES_DE_AUDITORIA)` ao carregar o módulo ficou declarada como limite, sem teste que falhe sem ela. Isso é aceitável, e fica registrado para o `/validar`.
