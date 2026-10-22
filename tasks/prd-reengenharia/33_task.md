# Tarefa 33.0 — `credencial/` reúne senha, cookie, hash e desafio

**Funcionalidade:** reengenharia · **Depende de:** 7.0, 10.0, 11.0, 16.0
**Subagentes obrigatórios:** `infra-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

O que serve a todo login (hash, cifra, cookie, contador, desafio e os repositories que gravam a sessão) sai de `sessao/` para
`apps/api/src/credencial/`, com `index.ts`. Só movimento e import, comportamento igual. Tarefa mecânica: movimento por script, uma pasta por commit.

## Contexto necessário

- `onda-2.md` §2 (RF14, "o mapa"); `tasks.md`, "Tarefa mecânica"
- Depois da 10.0 existe `sessao/conferencia-do-autor.ts` (fica em `sessao/`); depois da 11.0, `sessao/origem-da-requisicao.ts` e
  `sessao/identificadores-do-login.ts` (vão para `credencial/`)
- `tools/ci/playwright.test.ts › nada que o e2e carrega importa um pacote @educa/* pelo nome…` lê `apps/api/src/sessao/hash-do-token.ts` por
  caminho; o e2e (`e2e/__fixtures__/sessao.ts`) importa esse arquivo **direto**, nunca pelo `index.ts`

## Subtarefas

- [x] 33.1 — Extração, num commit antes, ainda em `sessao/`: `CLIENTE_REDIS_LOGIN` (de `sessao.module.ts`) vai para `cliente-redis-login.ts` e
  `identificadorDoAluno` (de `matricula.service.ts`) para `identificador-do-aluno.ts`; os importadores trocam o caminho, sem reexportar
- [x] 33.2 — `mapa.json` e o script (abaixo). Commit 1: `sessao/senha/*` → `credencial/senha/*`
- [x] 33.3 — Commit 2, de `sessao/` para `credencial/`, com os `.test.ts` e `.int.test.ts` de cada um: `hash-de-senha`, `hash-do-token`, `cifra-do-segredo`,
  `segundo-fator`, `cookies`, `cookie-dispositivo`, `contador-de-tentativas`, `desafio`, `seguro-do-login`, `configuracao-de-login`, `cliente-redis-login`,
  `identificador-do-aluno` e os repositories `credencial-matricula`, `criacao-de-sessao`, `acesso-publico`, `escrita-de-sessao`, `registro-de-acesso`,
  `sessao-de-origem`
- [x] 33.4 — Commit 3: `externa/configuracao-externa(.test).ts` → `credencial/configuracao-externa(.test).ts`; `origem-da-requisicao` e `identificadores-do-login` da 11.0
- [x] 33.5 — Commit 4: `credencial/index.ts`, um `export { … }` nomeado por símbolo usado fora (nunca `export *`). Quem está em `apps/api/{src,test}`, fora de
  `credencial/` e `sessao/`, passa a importar pelo `index.js`; `e2e/`, `infra/`, `tools/` e `apps/worker` ficam no arquivo
- [x] 33.6 — Commit 5: caminho citado como texto; conferência final

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/credencial/**` | novo (destino) |
| `apps/api/src/sessao/**` (origem do mapa de 33.3 e 33.4; os demais importam o que saiu), `sessao.module.ts`, `matricula.service.ts` | movido e alterado |
| `apps/api/src/{app.module,config,config.test,main}.ts`, `assistente/{assistente.module,limite-de-pedidos-de-ia}.ts`, `atividade/atividade.module.ts`, `professores/professores.service.ts`, `tutor/tutor.int.test.ts`, `operacao/**`, `ops/**`, `sala/**` | alterado (import) |
| `apps/api/test/**` | alterado (import) |
| `infra/scripts/{carga-login,carga-sala,ensaio-alertas}.ts`, `infra/test/{alertas,carga-login}.test.ts` | alterado (import e `importar('apps/api/dist/sessao/…')`) |
| `tools/ci/{codigo-do-autenticador,playwright}.test.ts`, `e2e/__fixtures__/sessao.ts`, `TODO.md` | alterado |
| `apps/api/src/credencial/identificador-do-aluno.test.ts`, `apps/api/test/arquitetura.test.ts` (o `it` do barrel) | novo e alterado |
| `apps/api/src/operacao/token-do-convite.ts`, `docs/guia-do-desenvolvedor.md`, `tasks/prd-reengenharia/{12_task,onda-2}.md` | alterado (import direto e caminho citado) |

## Testes que provam a regra

Nada muda no comportamento: a prova é a suíte atual verde mais a conferência do caminho antigo. Quem cobre cada pasta:

| Pasta movida | Cobertura que já existe |
|---|---|
| hash, cookies, TOTP | `hash-de-senha.test.ts › HashDeSenha`; `cookies.test.ts › cookies de sessão`; `segundo-fator.test.ts › TOTP: SHA1, 6 dígitos, 30 s, janela de um passo` |
| contador, desafio | `contador-de-tentativas.test.ts › esperaDaFalha: 5 falhas seguram por 30 s…`; `desafio.test.ts › desafio de login`; os `.int.test.ts` dos dois |
| `senha/` | `rebaixamento.test.ts › RebaixamentoPorEscola`; `semaforo-de-hash.test.ts › SemaforoDeHash: rodízio…`; `contador-em-janela.int.test.ts` |
| o login | `ataque-de-senha`, `semaforo-de-login`, `login-email`, `sessao-matricula`, `renovacao`, `saida` (`apps/api/test/*.int.test.ts`) |
| fora da API | `codigo-do-autenticador.test.ts`, `playwright.test.ts`, `infra/test/{alertas,carga-login}.test.ts`; `e2e/entrar-na-escola.spec.ts` na esteira |

| Cenário (novo) | Tipo | Fica vermelho se (a mutação) |
|---|---|---|
| `identificadorDoAluno('e1','123')` é `'e1\|123'`, e a mesma matrícula em duas escolas dá dois identificadores | unidade | trocar a ordem ou tirar a escola |
| `Object.values` de `credencial/index.js` não traz `ResolucaoDeTenantRepository` nem `ContaGlobalRepository`, sob nome nenhum; novo `it` em `apps/api/test/arquitetura.test.ts › arquitetura: a conta global só pelo módulo sessao e pelo ciclo de vida (F3, tarefa 1.0)`, no molde de `› nem o barrel do @educa/nucleo…` | unidade | um `export { ResolucaoDeTenantRepository }` no índice |
| `git grep` dos caminhos antigos (sem extensão) sai vazio | conferência | um caminho velho esquecido |

## Como testar

- **O script** (`mover.cjs`, mais `mapa-33.mjs`, que gera o `mapa.json`, e `indice.cjs`, que cria o `credencial/index.ts`), fora do commit e fora do repositório: o ESLint lê
  `.processo/` e reprova o rascunho (`no-console`, `no-require-imports`). Nesta execução ficaram em
  `/tmp/claude-1000/-home-joaquimdp-Documentos-git--maestri-floors-educaia--specreengenharia--l1/589e15aa-e5c5-4ebd-8298-32b4269766cd/scratchpad/mover/`; quem repetir o passo os recria
  daqui. O ts-morph vai fora do `package.json`: `npm i --prefix .processo/ts-morph ts-morph@27.0.2` (o script o carrega de `.processo/ts-morph/node_modules`), e roda-se da
  raiz: `node <pasta>/mover.cjs <pasta>/mapa.json`.
  Entrada: `mapa.json`, `{ "<antigo>": "<novo>" }`, um par por arquivo do commit, de `git ls-files`. Passos: um `Project` do ts-morph com todos os `.ts`/`.tsx` rastreados (só para ler o
  AST); para cada `import`, `export … from`, `import()`, `vi.mock` e tipo `import('…')` de especificador relativo, o alvo é achado a partir do caminho **antigo** do importador e o
  especificador é refeito para o caminho novo dos dois, mantendo o `.js` ou `.ts` (não usa `sourceFile.move`); grava os arquivos alterados; `git mv` (ou `mv`, se o arquivo ainda não está rastreado); troca
  `apps/api/{src,dist}/<antigo>` (sem extensão) nos arquivos de texto; `--conferir` roda o `git grep`. `indice.cjs`, depois do movimento, escreve o `index.ts` (um `export { … }` por símbolo
  que `apps/api/{src,test}` fora de `credencial/` e `sessao/` usam, `export type` para os tipos) e passa esses arquivos a importar por ele.
- Depois de cada commit: `rm -rf apps/api/dist` (um `dist` velho esconderia o `importar('apps/api/dist/…')`), `npm run typecheck` e
  `git grep -nE '<antigos>' -- . ':!tasks' ':!.reengenharia' ':!docs/decisoes.md'` vazio.
- Isolado: `npx vitest run --project unidade apps/api/src/credencial tools/ci`, e a integração do login (`ataque-de-senha`, `login-email`).

## Fora do escopo desta tarefa

Partir `sessao/` em fluxos (34.0); `ops/` (35.0); o `dependency-cruiser` (12.0, que deve deixar `e2e/`, `infra/` e `tools/` fora da regra do
`index.ts`); `.claude/skills/executar-task/SKILL.md:121` (Etapa 9).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| Um commit só para a tarefa, e não um por pasta (33.2 a 33.6) nem a extração da 33.1 num commit antes: o hook exige carimbo do portão e revisão aprovada em todo commit `(tarefa N.0)`, e a Mesa revisa a tarefa uma vez. Os movimentos rodaram pelo script, em passos, com tipos e unidade conferidos no fim; o git guarda cada arquivo como renomeação | O processo (D78, D53) não tem como aprovar commit intermediário de uma tarefa (a mesma divergência da 36.0 e da 97.0) | `tasks.md`, "Tarefa mecânica" (a regra do commit por tarefa, escrita lá) |
| `operacao/token-do-convite.ts` importa `credencial/hash-do-token.js` direto, e não pelo `index.js`: é o único arquivo de `apps/api/src` que o e2e carrega (`e2e/__fixtures__/operacao.ts`) | O Playwright roda o `.ts` sem compilar (`erasableSyntaxOnly`), e o `index.ts` arrasta a `credencial/` inteira, com `constructor(private readonly …)` e `@educa/*` pelo nome: `tsc -p e2e` falhou com 20 erros e `playwright.test.ts › nada que o e2e carrega importa…` fica vermelho (mutação abaixo). Vale o que a subtarefa 33.5 já diz de `e2e/`: o arquivo que o e2e carrega fica no arquivo | `onda-2.md` §2, "As travas" (a linha do `index.ts`), e `12_task.md`, "Contexto necessário" (a regra do `dependency-cruiser` precisa da exceção, por arquivo) |
| Dois comentários de `credencial/` deixam de nomear a `ResolucaoDeTenantRepository` e dizem "resolução de tenant (em `sessao/`)": `credencial-matricula.repository.ts` (bloco da classe) e `registro-de-acesso.repository.ts` (bloco da classe) | `arquitetura.test.ts › nenhum arquivo fora de apps/api/src/sessao importa ou cita a ResolucaoDeTenantRepository` varre o texto, comentário incluído, e fica vermelho com o nome da classe fora de `sessao/`; a tarefa não pode relaxar a varredura (regra 10) nem pôr o nome de volta. O sentido do comentário não muda | `arquitetura.test.ts`, a varredura `usosForaDoModuloSessao`, e `onda-2.md` §2 ("Nenhum [da `credencial/`] usa a Resolução") |
| O script reescreve o especificador pelo AST do ts-morph com resolução própria (relativo ao caminho antigo do importador, mantendo `.js`/`.ts`), em vez de `sourceFile.move`; vive fora do repositório (`/tmp`), porque o ESLint lê `.processo/` | `sourceFile.move` com seis tsconfig não distingue o `.js` do `.ts` de cada especificador; e o lint reprova o rascunho dentro de `.processo/` (`no-console`, `no-require-imports`). O resultado é o mesmo, conferido por `tsc` nos seis projetos e pelo `git grep` do caminho antigo | `tasks.md`, "Tarefa mecânica" (o script fica fora do commit) |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/api/src/credencial/identificador-do-aluno.ts
teste: apps/api/src/credencial/identificador-do-aluno.test.ts › é a escola, a barra e a matrícula, e a mesma matrícula em duas escolas dá dois identificadores
-  return `${escolaId}|${matricula}`
+  return `${matricula}|${escolaId}`
```

```mutacao
arquivo: apps/api/src/credencial/identificador-do-aluno.ts
teste: apps/api/src/credencial/identificador-do-aluno.test.ts › é a escola, a barra e a matrícula, e a mesma matrícula em duas escolas dá dois identificadores
-  return `${escolaId}|${matricula}`
+  return matricula
```

```mutacao
arquivo: apps/api/src/credencial/index.ts
teste: apps/api/test/arquitetura.test.ts › nem o barrel de credencial/ exporta
-export { SeguroDoLogin } from './seguro-do-login.js'
+export { SeguroDoLogin } from './seguro-do-login.js'
+export { ResolucaoDeTenantRepository } from '../sessao/resolucao-de-tenant.repository.js'
```

```mutacao
arquivo: apps/api/src/credencial/index.ts
teste: apps/api/test/arquitetura.test.ts › nem o barrel de credencial/ exporta
-export { SeguroDoLogin } from './seguro-do-login.js'
+export { SeguroDoLogin } from './seguro-do-login.js'
+export { ResolucaoDeTenantRepository as OutroNome } from '../sessao/resolucao-de-tenant.repository.js'
```

```mutacao
arquivo: apps/api/src/credencial/index.ts
teste: apps/api/test/arquitetura.test.ts › nem o barrel de credencial/ exporta
-export { SeguroDoLogin } from './seguro-do-login.js'
+export { SeguroDoLogin } from './seguro-do-login.js'
+export { ContaGlobalRepository as OutroNome } from '@educa/nucleo/conta-global'
```

```mutacao
arquivo: apps/api/src/operacao/token-do-convite.ts
teste: tools/ci/playwright.test.ts › nada que o e2e carrega importa um pacote
-import { BYTES_DO_TOKEN_DE_CONVITE, hashDoToken } from '../credencial/hash-do-token.js'
+import { BYTES_DO_TOKEN_DE_CONVITE, hashDoToken } from '../credencial/index.js'
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | A regra "fora de `credencial/` e `sessao/`, só pelo `index.js`" e a conferência do caminho antigo só se provam por `git grep` manual; a 12.0 precisa citar a exceção de `operacao/token-do-convite.ts` por arquivo | Tarefa 12.0 (`dependency-cruiser`). A exceção já está escrita em `12_task.md`, "Contexto necessário", alterado neste commit |
| infra-guardian (1ª) | `config.ts` importa `credencial/index.js` e puxa todos os repositories; importar `configuracao-de-login.js` e `configuracao-externa.js` direto deixaria a leitura da configuração leve | Tarefa 12.0, quando a regra do `index.ts` virar lint. Agora contraria a 33.5 (quem está em `apps/api/{src,test}` fora de `credencial/` e `sessao/` importa pelo `index.js`) e muda import por decisão de desenho, não por movimento |
| revisor-geral (1ª) | O mesmo desencontro do script volta na 34.0 e na 35.0: corrigir `tasks.md`, "Tarefa mecânica", e dizer onde o script fica | Arquiteto, na 34.0 (primeira que repete o passo). `tasks.md` não é arquivo desta tarefa; o "Como testar" da 33.0 já diz o que rodou e onde o script ficou |
| revisor-geral (2ª) | O "Como testar" aponta para o scratchpad `/tmp/claude-1000/.../scratchpad/mover/`, que some quando a sessão acaba; tirar o caminho e deixar só a descrição | Recusada: o caminho registra onde o script rodou nesta execução, o próprio texto diz que quem repetir o passo recria os arquivos pela descrição, e a recomendação vem de revisor que aprovou na rodada em que a ordem já aplicou as outras (`revisar-tarefa`, passo 4) |

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->


## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-22 20:42:59 | 2026-10-22 20:44:00 | `test-engineer` | 1 | APROVADO | a130e5d3c4931b9bc |
| 2026-10-22 20:42:39 | 2026-10-22 20:44:13 | `infra-guardian` | 1 | APROVADO | a2157b459b36f8713 |
| 2026-10-22 20:43:19 | 2026-10-22 20:44:34 | `revisor-geral` | 1 | APROVADO | a8632b318a7388d33 |
| 2026-10-22 20:53:26 | 2026-10-22 20:53:46 | `revisor-geral` | 2 | APROVADO | a28fc5ca8eaddf1ad |
