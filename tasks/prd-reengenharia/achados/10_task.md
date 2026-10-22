# Achados das revisões — `tasks/prd-reengenharia/10_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 17:26:36 · `tasks/prd-reengenharia/10_task.md`

VEREDITO: APROVADO

Escopo: respeitado. As três subtarefas foram feitas e a tarefa não avança sobre a 11.0 (`login.service`) nem sobre a 12.0 (depcruise).

Aderência à Tech Spec: ok. O que foi feito é o que a `onda-1a.md` §T7, "Os ciclos (10.0 e 11.0)", pede para a 10.0. A tarefa declara "nenhuma" divergência, e não achei nenhuma.

Portão local: carimbo válido ("portão local válido para o código atual", com typecheck, lint, segredo, dependencias, unidade e alvo).

Bloqueantes: nenhum.
- Os tipos `SessaoDeOperadorParaGuarda` e `SessaoDeOperadorParaRenovar` foram para `apps/api/src/operacao/prazos-da-sessao.ts`, e o repository passou a importá-los de lá. O ciclo entre os dois arquivos acabou.
- `ConferenciaDoAutor` mudou para `apps/api/src/sessao/conferencia-do-autor.ts` sem reexportação no lugar antigo. Os onze arquivos que a importavam usam o caminho novo, e nenhum ainda aponta para `operador.repository`.
- Nenhum arquivo de `apps/api/src/sessao/` importa `../operacao/`.
- O `it` provisório em `apps/api/test/arquitetura.test.ts:1405-1421` usa `arquivosDoRepositorio()`, `semComentarios` e `MODULO_SESSAO`, como a tarefa pede. Ele confere se a lista de arquivos de `sessao/` não veio vazia (`> 40`), para não passar sem testar nada. As três mutações declaradas cobrem as cláusulas novas.

Recomendações:
- `apps/api/src/operacao/guarda-de-operador.ts:17-18` e `apps/api/src/operacao/prazos-da-sessao.test.ts:2-3` importam duas vezes do mesmo módulo (`./prazos-da-sessao.js`), uma do valor e outra do tipo. O resto do arquivo junta os dois numa linha, com `type` inline, como já se faz em `operador.repository.ts:17`.
- Nos oito arquivos de `apps/api/src/ops/*.ts`, em `apps/api/src/operacao/painel.service.ts:36`, em `apps/api/src/sessao/convite.service.ts:32` e em `apps/api/src/sessao/redefinicao-de-mfa.ts:7`, o script colocou o import novo depois de todos os outros, fora da ordem dos imports relativos. Só destoa da ordem e não esconde bug. Vale reordenar quando a 12.0 tocar esses arquivos.

## test-engineer · 1ª rodada · APROVADO · 2026-10-22 17:27:09 · `tasks/prd-reengenharia/10_task.md`

VEREDITO: APROVADO

Cenários exigidos: é uma tarefa só de reorganização, sem comportamento novo. Por isso os cenários são:
- a caracterização continua verde (validade da sessão do operador, autor auditado no convite pelo operador e na redefinição do MFA);
- `sessao/` deixa de importar `operacao/`;
- o ciclo entre `prazos-da-sessao` e `operador.repository` some.

Não há isolamento, permissão nem concorrência a cobrir: nenhuma consulta e nenhuma escrita mudam, como o próprio documento declara.

Cobertos:
- **Validade da sessão:** `apps/api/src/operacao/prazos-da-sessao.test.ts` agora usa o tipo do arquivo novo e passa.
- **Convite e MFA pelo operador:** `apps/api/test/convite-operador.int.test.ts` e `apps/api/test/ops-operador.int.test.ts` passam, 47 de 47, com Postgres real.
- **`sessao` não importa `operacao`:** coberto em `apps/api/test/arquitetura.test.ts:1413`, "nenhum arquivo do módulo de sessão importa o módulo da operação". Há uma salvaguarda (`length > 40`) que impede o teste de passar com a lista vazia. As duas mutações (em `convite.service.ts` e em `redefinicao-de-mfa.ts`) trazem de volta exatamente o `from '../operacao/` que o teste procura, então ficam vermelhas pelo motivo certo.
- **Ciclo desfeito:** coberto em `apps/api/test/arquitetura.test.ts:1419`, "operacao/prazos-da-sessao.ts não importa operador.repository". A mutação devolve o `import type` e cai na cláusula.
- **Tabela do documento:** cada uma das cinco linhas tem o seu teste citado pelo nome, e cada cláusula nova do diff tem o seu bloco de mutação.
- **Importadores:** procurei na árvore e nenhum importador continua puxando `ConferenciaDoAutor`, `SessaoDeOperadorParaGuarda` ou `SessaoDeOperadorParaRenovar` de `operador.repository`. Não há reexportação no lugar antigo.
- **Testes rodados:** a unidade (`prazos-da-sessao.test.ts` e `arquitetura.test.ts`) deu 67 de 67, e a integração deu 47 de 47.
- **Proibições:** sem `.skip`, sem mock e sem chamada a provedor de IA.

Bloqueantes: nenhum.

Recomendações:
1. **`apps/api/test/arquitetura.test.ts:1415`: o filtro procura só `from '../operacao/'`, mas `apps/api/src/sessao/` tem subpastas.** As subpastas são `externa/` e `senha/`. Um arquivo nelas importaria por `../../operacao/`, e um `import('../operacao/...')` dinâmico também escaparia, sem o teste ficar vermelho. Hoje nenhum arquivo faz isso (procurei) e o `it` é provisório até o depcruise da 12.0. Mesmo assim, uma expressão regular como `/from '(\.\.\/)+operacao\/|import\('(\.\.\/)+operacao\//` cobriria `sessao/**` como a tabela promete. Se não for mudada agora, vale anotar na 12.0 que a regra do depcruise precisa cobrir as subpastas.
2. **Nada prova a parte "sem reexportar do lugar antigo" da subtarefa 10.2.** Se alguém voltar a exportar `ConferenciaDoAutor` de `operador.repository.ts`, nenhum teste quebra. Não é uma regra de negócio, mas um `it` curto (o repository não declara nem reexporta `ConferenciaDoAutor`) fecharia isso até a 12.0.
3. **Dois imports seguidos do mesmo módulo, que podem virar um só.** Em `apps/api/src/operacao/guarda-de-operador.ts:17-18` e em `apps/api/src/operacao/prazos-da-sessao.test.ts:2-3`, o `import` de valor e o `import type` vêm do mesmo `./prazos-da-sessao.js`. Dá para juntar como `import { sessaoDeOperadorVale, type SessaoDeOperadorParaGuarda }`, no mesmo estilo que o repository já usa na linha 17. É só organização.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 17:38:01 · `tasks/prd-reengenharia/10_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

O que conferi nesta rodada:
- **Imports duplicados.** A recomendação da 1ª rodada foi feita: em `apps/api/src/operacao/guarda-de-operador.ts` e em `apps/api/src/operacao/prazos-da-sessao.test.ts`, os dois imports do mesmo módulo viraram um só, com `type` dentro da lista.
- **Teste de que a sessão não importa a operação** (`apps/api/test/arquitetura.test.ts`, por volta da linha 1414). A busca agora acha o import em qualquer profundidade de pasta (`../` ou `../../`) e também o `import()` dinâmico. Antes ela só via `from '../operacao/'`. O teste também passou a exigir que exista arquivo em `sessao/externa/`, o que impede que ele passe sem examinar nenhuma subpasta.
- **Ciclo entre `ConferenciaDoAutor` e o repository.** O `it` novo prova que `operador.repository.ts` não declara nem reexporta `ConferenciaDoAutor`. Comentário não conta, porque o teste usa `codigoDe` sobre `semComentarios`. Isso fecha o caminho de o ciclo voltar pelo repository.
- **Mutações novas.** Os pontos de partida das duas existem: `import { z } from 'zod'` na linha 3 de `apps/api/src/sessao/externa/cookie-oidc.ts` e `export interface OperadorAlvo {` na linha 58 de `apps/api/src/operacao/operador.repository.ts`. A primeira é pega pela busca de imports em subpasta; a segunda é pega pelo `\bConferenciaDoAutor\b`.
- **Recomendação que ficou sem aplicar.** A ordem dos imports nos onze arquivos está na tabela "Recomendações sem aplicar" de `tasks/prd-reengenharia/10_task.md`. O destino é a 12.0, com o `TODO.md` como reserva se a 12.0 não tocar esses arquivos. Aceito.
- **Seção "Revisões".** Ela apareceu no diff do documento, mas foi o hook que gerou. Não é escrita à mão.

Recomendações:
- O comentário "Provisório" do `describe` diz que a regra do depcruise na 12.0 substitui estes `it`. Na 12.0, confira que a regra do depcruise também cobre o terceiro `it`, o do `ConferenciaDoAutor`. Esse caso trata de um nome de tipo, não de um caminho de import, e uma regra de dependência sozinha pode não cobrir.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 17:38:07 · `tasks/prd-reengenharia/10_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- caracterização da validade da sessão do operador (`prazos-da-sessao.test.ts`)
- caracterização do convite pelo operador com o autor auditado (`convite-operador.int.test.ts`)
- caracterização da redefinição do MFA pelo operador (`ops-operador.int.test.ts`)
- `sessao → operacao` sumiu, inclusive em subpasta e em `import()` dinâmico
- o ciclo `prazos-da-sessao ↔ operador.repository` sumiu
- `ConferenciaDoAutor` não é declarada nem reexportada do lugar antigo (subtarefa 10.2)

Isolamento, concorrência e log não se aplicam: nenhuma consulta muda, e a tarefa é mecânica, só de tipos.

**Cobertos:**
- Na 1ª rodada eu já tinha aprovado as três caracterizações, que não mudaram neste diff. Nesta rodada não as rodei de novo.
- **Recomendação 1, aplicada.** O `it` "nenhum arquivo do módulo de sessão importa o módulo da operação" (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/test/arquitetura.test.ts:1414`) agora usa `IMPORTA_A_OPERACAO`, que aceita `(../)+` e `import('`.
  - Uma asserção nova exige que `sessao/externa/` esteja no conjunto lido, e assim a subpasta não pode sumir do filtro sem ninguém ver.
  - O bloco novo de mutação em `sessao/externa/cookie-oidc.ts`, com `../../operacao/`, cai na cláusula certa. O ponto de partida `import { z } from 'zod'` existe na linha 3 do arquivo.
  - Conferi as três menções a `operacao/` que restam em `sessao/convite.service.ts` (linhas 239, 287 e 327). São comentários de JSDoc, que `semComentarios` tira.
- **Recomendação 2, aplicada.** O `it` "operador.repository.ts não declara nem reexporta ConferenciaDoAutor" (`arquitetura.test.ts:1425`) procura `\bConferenciaDoAutor\b` no código sem comentários.
  - Ele pega tanto a declaração quanto `export type { ConferenciaDoAutor } from ...`.
  - O bloco de mutação ancora em `export interface OperadorAlvo {`, que existe na linha 58 do repository, e devolve a declaração. Com isso o teste fica vermelho pelo motivo certo.
- **Recomendação 3, aplicada.** Os dois imports seguidos do mesmo módulo viraram um só em `guarda-de-operador.ts` e em `prazos-da-sessao.test.ts`, com `type` inline. Não muda comportamento.
- Rodei `npx vitest run apps/api/test/arquitetura.test.ts -t "módulo de sessão não depende"`: os 3 testes do bloco passaram.

**Bloqueantes:** nenhum.

**Recomendações:**
1. A tabela "Testes que provam a regra" (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/10_task.md:47-53`) não tem linha para o `it` novo de `ConferenciaDoAutor`, que existe e tem mutação. Vale acrescentar a linha "`operador.repository.ts` não declara nem reexporta `ConferenciaDoAutor`", para a tabela e a seção "Mutações" baterem.
2. `IMPORTA_A_OPERACAO` ainda não pega import só de efeito (`import '../operacao/x.js'`) nem aspas duplas. Hoje isso não acontece no repositório, e a regra do depcruise da 12.0 substitui este `it`. Fica registrado para a 12.0.
