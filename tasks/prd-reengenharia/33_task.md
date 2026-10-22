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

- [ ] 33.1 — Extração, num commit antes, ainda em `sessao/`: `CLIENTE_REDIS_LOGIN` (de `sessao.module.ts`) vai para `cliente-redis-login.ts` e
  `identificadorDoAluno` (de `matricula.service.ts`) para `identificador-do-aluno.ts`; os importadores trocam o caminho, sem reexportar
- [ ] 33.2 — `mapa.json` e o script (abaixo). Commit 1: `sessao/senha/*` → `credencial/senha/*`
- [ ] 33.3 — Commit 2, de `sessao/` para `credencial/`, com os `.test.ts` e `.int.test.ts` de cada um: `hash-de-senha`, `hash-do-token`, `cifra-do-segredo`,
  `segundo-fator`, `cookies`, `cookie-dispositivo`, `contador-de-tentativas`, `desafio`, `seguro-do-login`, `configuracao-de-login`, `cliente-redis-login`,
  `identificador-do-aluno` e os repositories `credencial-matricula`, `criacao-de-sessao`, `acesso-publico`, `escrita-de-sessao`, `registro-de-acesso`,
  `sessao-de-origem`
- [ ] 33.4 — Commit 3: `externa/configuracao-externa(.test).ts` → `credencial/configuracao-externa(.test).ts`; `origem-da-requisicao` e `identificadores-do-login` da 11.0
- [ ] 33.5 — Commit 4: `credencial/index.ts`, um `export { … }` nomeado por símbolo usado fora (nunca `export *`). Quem está em `apps/api/{src,test}`, fora de
  `credencial/` e `sessao/`, passa a importar pelo `index.js`; `e2e/`, `infra/`, `tools/` e `apps/worker` ficam no arquivo
- [ ] 33.6 — Commit 5: caminho citado como texto; conferência final

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/credencial/**` | novo (destino) |
| `apps/api/src/sessao/**` (origem do mapa de 33.3 e 33.4; os demais importam o que saiu), `sessao.module.ts`, `matricula.service.ts` | movido e alterado |
| `apps/api/src/{app.module,config,config.test,main}.ts`, `assistente/{assistente.module,limite-de-pedidos-de-ia}.ts`, `atividade/atividade.module.ts`, `professores/professores.service.ts`, `tutor/tutor.int.test.ts`, `operacao/**`, `ops/**`, `sala/**` | alterado (import) |
| `apps/api/test/**` | alterado (import) |
| `infra/scripts/{carga-login,carga-sala,ensaio-alertas}.ts`, `infra/test/{alertas,carga-login}.test.ts` | alterado (import e `importar('apps/api/dist/sessao/…')`) |
| `tools/ci/{codigo-do-autenticador,playwright}.test.ts`, `e2e/__fixtures__/sessao.ts`, `TODO.md` | alterado |
| `apps/api/src/credencial/identificador-do-aluno.test.ts` | novo |

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

- **O script** (`.processo/mover/mover.cjs`, fora do commit: `.processo/` é do `.gitignore`). Instale o ts-morph fora do `package.json`:
  `npm i --prefix .processo/ts-morph ts-morph@27.0.2`, e rode `node .processo/mover/mover.cjs mapa.json` (o script o carrega de `.processo/ts-morph/node_modules`).
  Entrada: `mapa.json`, `{ "<antigo>": "<novo>" }`, um par por arquivo do commit, de `git ls-files`. Passos: um `Project` com os seis tsconfig (`apps/api`, `apps/worker`,
  `apps/despachante`, `infra`, `e2e`, raiz); `sourceFile.move(novo)` por par, em memória (reescreve `import`, `export … from` e `import()`, mantendo o `.js` ou `.ts`);
  `mkdir -p` e `git mv`; grava os arquivos alterados; troca `apps/api/{src,dist}/<antigo>` nos arquivos de texto da tabela; `--conferir` roda o `git grep`.
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

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: [caminho do arquivo que tem a cláusula]
teste: [caminho do teste] › [nome do caso]
  [linha de contexto, que fica]
- [a cláusula que sai]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->

