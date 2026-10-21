# Tarefa 23.0 — A web chama pelo registro, sem literal `/v1/`

**Funcionalidade:** reengenharia · **Depende de:** 22.0
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A web chama a API por `chamarRota(rota, { caminho, consulta, corpo })`, com tudo tirado do registro, e o lint impede o
literal `'/v1/'` em `apps/web/src` fora de teste.

## Contexto necessário

- `onda-1b.md` §2 "T2", parágrafo "Na web (23.0)", e §5; `techspec.md` §9; `prd.md` RF6; `DECISOES` P4 (pilha do
  operador separada); regra 50
- Código: `apps/web/src/api/cliente.ts` (`chamarApi`, e o `lerResposta` da 20.0), `apps/web/src/operacao/api/sessao.ts`
  (`tokenDeOperador`, `CAMINHO_DA_SESSAO_DE_OPERADOR`), o registro da 22.0 em `packages/shared/src/rotas/`,
  `eslint.config.mjs`, `tools/guardas/guardas.test.ts` (`lintar`, `marcasDeViolacao`)
- Onde está o literal hoje: `apps/web/src/api/*.ts`, `operacao/api/*.ts`, `main.tsx`, `rotas.tsx`, `componentes/`
  (`BarraPresa`, `CascaDaEscola`, `BarraDeBaixo`, `MenuDaPessoa`, `SeletorDeEscola`, `meus-dados/regras.ts`),
  `areas/professor/ConvidarAlunos.tsx`, `paginas/Inicio.tsx`, `sessao/inatividade.ts`

## Subtarefas

- [ ] 23.1 — Caracterização, num commit antes: o método e o caminho de cada função de `api/` e `operacao/api/`
- [ ] 23.2 — `montarCaminho` em `packages/shared/src/rotas/`, com `encodeURIComponent` e falha em parâmetro ausente
- [ ] 23.3 — `chamarRota` em `api/cliente.ts`, sobre `chamarApi`; a pilha do operador o usa com o token dela
- [ ] 23.4 — As funções e os componentes trocam o literal pela chave de rota
- [ ] 23.5 — `no-restricted-syntax` contra `'/v1/'` (literal e template), com a fixture
- [ ] 23.6 — Testes: os da tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/shared/src/rotas/montar-caminho.ts`, `montar-caminho.test.ts`, `index.ts` | novo e alterado |
| `apps/web/src/api/cliente.ts`, `cliente.test.ts` | alterado |
| `apps/web/src/api/*.ts`, `apps/web/src/api/*.test.ts` | alterado |
| `apps/web/src/operacao/api/*.ts`, `sessao.test.ts`, `painel.test.ts`, `convite-e-mfa.test.ts` | alterado |
| `apps/web/src/main.tsx`, `apps/web/src/rotas.tsx`, os componentes e páginas do Contexto | alterado |
| `eslint.config.mjs`, `tools/guardas/guardas.test.ts`, `tools/guardas/__fixtures__/url-da-api.ts` | alterado e novo |

## Testes que provam a regra

Definidos com o `test-engineer`.

| Cenário | Tipo | O que prova | Mutação |
|---|---|---|---|
| `id` com `/`, `?` e `#` sai codificado | unidade (`montar-caminho.test.ts`) | um id não troca a rota | interpolar sem codificar |
| Parâmetro ausente falha antes do `fetch` | unidade | caminho completo | deixar o `:id` |
| Valor da `consulta` sai codificado | unidade (`cliente.test.ts`) | a consulta também | concatenar sem codificar |
| `chamarRota` usa o `metodo` do registro | unidade (idem) | método não redigitado | `'GET'` fixo |
| `chamarRota` aceita campo extra | unidade | leitor tolerante | validar com `SEM_CORPO` |
| Obrigatório ausente na resposta: `ErroDeContrato` | unidade (idem) | o outro lado | engolir a falha |
| Com as duas sessões, a rota da operação leva o token do operador | unidade (`operacao/api/sessao.test.ts`) | P4 | ler sempre o token da escola |
| Carac.: cada função chama o método e o caminho de antes | unidade (os `api/*.test.ts`) | a chamada não muda | trocar a chave por outra de mesmo método |
| Lint: `'/v1/x'` em `apps/web/src`, fora de teste, reprova | unidade (`guardas.test.ts`, fixture) | a trava | tirar a regra |
| Lint: `` `/v1/x/${id}` `` reprova | unidade | o template (`material.ts:110`) | seletor só de `Literal` |
| Lint: `'/v1/'` em comentário passa | unidade (idem) | só código (`rotas.tsx:114`) | — falso positivo |
| Lint: `'/v1/'` em `*.test.ts` passa | unidade (idem) | só produção | aplicar a teste |
| Lint: `'/v' + '1/'` passa, limite declarado | unidade (idem) | o teste diz o que a trava não pega | — limite |
| Os e2e da regra 40 seguem verdes nos dois projetos | e2e (`escola-montada`, `entrar-na-escola`, `a3-a4-professor`, `aluno-atividade`) | o fluxo não mudou de rota | trocar a chave do login pela da renovação |

## Como testar

- Caracterização: estenda `apps/web/src/api/professores.test.ts › … › cadastrar, refazer e revogar vão às rotas da API com
  a sessão…` e `operacao/api/painel.test.ts › … › o GET da lista leva a página e a ordem da tela…`, com o espião de `fetch`.
- P4: `apps/web/src/operacao/api/sessao.test.ts › as três respostas da conferência da sessão › ACESSO_VENCIDO
  renova pelo cookie e repete a mesma chamada…`.
- Lint: `tools/guardas/guardas.test.ts › processadores do worker: nenhuma afirmação de tipo… › reprova \`{} as T\`…`, com
  `lintar(eslint, fixture, 'apps/web/src/api/x.ts', regras)`.
- Isolado: `npx vitest run --project unidade apps/web/src/api apps/web/src/operacao packages/shared/src/rotas tools/guardas/guardas.test.ts`
  e `node tools/ci/e2e.ts --manter-ambiente e2e/entrar-na-escola.spec.ts`.
- Armadilha: 20.0 e 25.0 também mexem no `eslint.config.mjs`; a regra entra no bloco do `apps/web`.

## Fora do escopo desta tarefa

Mudar rota ou acesso na API (22.0); gerar cliente a partir do OpenAPI.

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

