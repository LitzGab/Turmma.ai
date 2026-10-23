# Achados das revisões — `tasks/correcoes/knip-exportacoes-na-esteira.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-23 01:52:49 · `tasks/correcoes/knip-exportacoes-na-esteira.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A correção faz o que a `onda-1b.md` ("A trava") pede, que é o knip olhar só as quatro categorias. O que mudou foi a linha de comando que a própria Tech Spec escreveu com o defeito.

Portão local: carimbo válido. Cobre typecheck, lint, segredo, dependências, unidade e o alvo.

Bloqueantes: nenhum

Recomendações:
- **Documentos com o comando antigo.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/onda-1b.md:166` ainda mostra a etapa como `npx --no knip …`, e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/24_task.md:95` também. Vale atualizar as duas para `npx --no -- knip …`, para que ninguém copie a linha com o defeito numa etapa nova. A mutação histórica em `24_task.md:144-145` pode ficar como está.
- **Cópia de fixture repetida.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/knip.test.ts:62-64`, o teste novo faz à mão o `mkdtempSync`, o `PASTAS.push` e o `cpSync`, que é o que `rodarNaFixture` já faz. Um auxiliar `copiarFixture(nome)`, usado pelos dois, tiraria esse segundo jeito de fazer a mesma coisa.
- **Comentário do teste novo** (`knip.test.ts:59`). Ele diz "Os testes acima chamam o binário do knip direto", mas só um teste vem antes dele, e os que chamam o binário direto estão também abaixo. "Os outros testes deste arquivo" diz o mesmo sem depender da posição.

## test-engineer · 1ª rodada · APROVADO · 2026-10-23 01:53:19 · `tasks/correcoes/knip-exportacoes-na-esteira.md`

VEREDITO: APROVADO

Cenários exigidos:
- Caminho feliz: a etapa `etapaDependenciasDeclaradas`, rodada pelo `npx` de verdade como a esteira a roda, olha só as quatro categorias. Um export sem uso não reprova.
- Regressão da causa: sem o `--`, o `npx` toma `--include` para si, e o knip roda com todas as categorias e reprova.
- Borda: a fixture tem um export sem uso e nenhuma violação das quatro categorias. Assim o vermelho só pode vir da falta da categoria.
- O registro do `ci:verificar` (a imitação do `npx`) acompanha a linha nova, e a etapa do knip que falha continua deixando o `ci:verificar` vermelho.
- Não se aplicam: permissão, isolamento entre escolas, IA e concorrência. A correção mexe só no comando de uma etapa da esteira.

Cobertos:
- **Caminho feliz:** `tools/guardas/knip.test.ts:58`, "a etapa do ci:verificar, rodada pelo `npx` como a esteira a roda, só olha as quatro categorias: export sem uso não reprova". Ele chama `etapaDependenciasDeclaradas.comando` e `.argumentos` reais, sem imitação, e confere a saída vazia e o código 0.
- **Regressão:** a mutação declarada (`['--no', '--', 'knip', …]` para `['--no', 'knip', …]`) cai nesse teste pelo motivo certo. Confirmei à mão que a fixture tem o que reprovar com todas as categorias: `node_modules/.bin/knip --directory …/export-sem-uso` sai 1 com `exports: sobra` em `util.ts`. Com a mutação, o teste fica vermelho pelo aviso `invalid config include` e pelo achado do export. Esse é exatamente o defeito.
- **Registro do `ci:verificar`:** `tools/ci/scripts.test.ts:108` afirma `npx --no -- knip …` no registro. O `it.each` em `tools/ci/scripts.test.ts:113` usa `'npx --no -- knip'` e continua provando que a falha da etapa reprova o `ci:verificar`.
- **Testes rodados:** os dois arquivos passaram, 9 e 22 testes. Não há `.skip` nem mock que esconda a regra. Os testes antigos chamam o binário direto, e é por isso que o teste novo chama o `npx` real. A mutação cita o caso por um pedaço do nome; o `-t` do vitest acha pedaço, então a referência resolve.

Bloqueantes: nenhum.

Recomendações:
1. **O teste novo pode ficar vermelho sem bug numa máquina de desenvolvedor.** Em `tools/guardas/knip.test.ts:69`, `expect(resultado.stdout + resultado.stderr).toBe('')` passa pelo `npm`. Fora da esteira, um `npm notice` de versão nova ou um aviso do `.npmrc` do usuário deixa o teste vermelho sem defeito no código. Para evitar, dá para passar `env: { ...process.env, npm_config_update_notifier: 'false' }` ao `spawnSync`, ou afirmar que a saída não contém `invalid config` e que o knip não acha nada, em vez de exigir a saída vazia.
2. **Falta no teste o controle positivo da fixture.** Nada na suíte prova que o knip com todas as categorias acha o `exports: sobra` em `export-sem-uso`. Hoje o aviso do npm ainda faria a mutação cair, mas se o knip mudar o padrão de exports, o teste perde metade do motivo de existir. Um caso curto que rode o binário sem `--include` na fixture e espere `sobra` resolve isso.
3. **Diferença de nome no documento.** A seção "Teste que reproduz" de `tasks/correcoes/knip-exportacoes-na-esteira.md` escreve o nome do caso sem as crases em `npx`, e o caso no código tem crases. A mutação cita só o fim do nome e funciona, mas vale alinhar para quem procurar o caso pelo texto.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/ci/etapas-de-guarda.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/ci/scripts.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/knip.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/__fixtures__/knip/export-sem-uso/
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/correcoes/knip-exportacoes-na-esteira.md

## revisor-geral · 2ª rodada · APROVADO · 2026-10-23 01:58:29 · `tasks/correcoes/knip-exportacoes-na-esteira.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. Esta correção vem da esteira e não tem RF novo. A causa (o `npx` toma o `--include`), a correção (o `--` antes de `knip`) e as mudanças da rodada 1 estão escritas em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/correcoes/knip-exportacoes-na-esteira.md`.
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

Conferi as correções da rodada 1, todas feitas:
- O auxiliar `copiarFixture` existe e é usado por `rodarNaFixture` e pelo teste da etapa.
- O teste da etapa já não exige a saída toda vazia. Ele verifica três coisas: nada no `stdout`, nenhum "invalid config" no `stderr` e saída 0. Assim, um aviso de versão do npm não o deixa vermelho, e o defeito original ainda o deixa.
- O caso de controle novo roda o knip sem `--include` sobre `export-sem-uso` e espera `['sobra']` com saída 1. Ele está amarrado à segunda mutação, que tira o `sobra` de `util.ts`.
- O comentário do teste da etapa diz "os outros testes deste arquivo", e não depende mais da posição dele.
- No documento, o nome do teste está com o `npx` entre crases, e o bloco da rodada 1 foi registrado.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/knip.test.ts:65`: o comentário novo do controle diz "o teste da etapa abaixo". É a mesma dependência de posição que a rodada 1 tirou do outro comentário. Basta nomear o teste ("o teste da etapa do `ci:verificar`").
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/knip.test.ts:66-68`: o controle lê `issues` do mesmo jeito que `rodarKnip`, só que para outra categoria. Se aparecer um terceiro uso, vale um auxiliar que receba as categorias. Por enquanto não pede mudança.
