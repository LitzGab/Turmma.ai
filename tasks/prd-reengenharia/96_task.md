# Tarefa 96.0 — Na API, `estrutura/`, `operacao/`, `sala/` e `atividade/` têm uma subpasta por recurso, e pasta de produção com mais de 25 arquivos reprova

**Funcionalidade:** reengenharia · **Depende de:** 15.0, 16.0, 17.0, 35.0, 51.0, 97.0
**Subagentes obrigatórios:** `tenancy-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

Cada recurso das quatro pastas ganha a sua, como o `nest g resource` (`estrutura/turma/` com controller, service, repository e os testes que já moram
ao lado), e `apps/api/src` entra na trava das 25 por pasta que a 97.0 criou (`tools/guardas/tamanho-das-pastas.test.ts`, R56): pasta de produção com mais de 25 arquivos reprova, com lista fechada de exceções e motivo. Comportamento igual; script, uma pasta por commit.

## Contexto necessário

- `RECORTE.md` §3 item 7 e D81 (uma pasta por recurso; "~20 arquivos de produção" é a convenção, 25 é a trava); `33_task.md`, "Como testar" (script e conferência)
- Arquivos de produção na raiz hoje: `estrutura/` 28, `operacao/` 23 (25 com a 35.0), `sala/` 19, `atividade/` 16. A trava, com as raízes numa lista, é da 97.0 (hoje só `apps/web/src`)
- `atividade/correcao.int.test.ts` lê a **própria pasta** (`new URL('.', import.meta.url)`, sem recursão) para provar que `aprovar` e `aprovarLote` só têm um chamador; partida a pasta, ele olharia quase nada
- `entrega.int.test.ts:327` e o C40 de `arquitetura.test.ts` (`PASTA_DA_OPERACAO`) usam prefixo de pasta e continuam valendo

## Subtarefas

- [ ] 96.1 — Num commit antes: a varredura de `correcao.int.test.ts` passa a ser recursiva sobre `atividade/` e confere o mesmo trio de arquivos; e `apps/api/src` entra na lista de raízes do `tamanho-das-pastas.test.ts`, com `apps/api/src/estrutura` como exceção provisória ("em movimento, 96.2")
- [ ] 96.2 — `estrutura/`: `ano-letivo/`, `disciplina/`, `serie/`, `turma/`, `vinculo/`, `escola-sessao/` ← o `.controller`, `.service`, `.repository` de cada;
  `lista/` ← o trio mais `leitor-da-lista(.test)`; `provedores-da-escola/` ← `.controller`, `.service` e `provedores-liberados.repository`. Ficam na raiz `estrutura.module.ts` e `exclusao.ts` (dois repositories o usam)
- [ ] 96.3 — `sala/`: `acesso-da-turma/`, `minha-turma/` ← o trio; `salas/` ← `salas.{controller,service}`; `reivindicacao/` ← `reivindicacao.{repository,service,service.test}` e `lista-livre.repository`;
  `decisao/` ← `decisao.{repository,service}` e `pedidos.controller`. Raiz: `sala.module.ts`, `codigo-da-sala(.test)`, `configuracao-da-sala`, `entrada-da-sala`, `limites-da-sala(.test)` (vários recursos os usam)
- [ ] 96.4 — `atividade/`: `atividade-aplicada/`, `desempenho/`, `minha-atividade/` ← o trio; `correcao/` ← `correcao.{repository,service,int.test}`, `correcao-de-objetiva`, `lote(.controller)`, `leitura-do-lote`, com os testes.
  Raiz: `atividade.module.ts`, `atividade.int.test.ts`, `atividade-isolamento.int.test.ts` (cruzam recursos)
- [ ] 96.5 — `operacao/`: `entrada/`, `segundo-fator/`, `sessao/` (com `prazos-da-sessao`), `convite/` (`convite-operador.*`), `painel/`, `eu/` ← o que tem o nome; `operador/` ← `operador.repository(.test)`;
  `escola/` ← `casos-de-uso/*` da 35.0. Raiz: o módulo, `guarda-de-operador`, `marcadores`, `desafio-de-operador(.test)`, `falhas-de-entrada`, `cookie-de-operador`, `dispositivo-de-operador`, `token-do-convite` (o e2e o importa)
- [ ] 96.6 — Tira a exceção provisória; caminho citado como texto; conferência final

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/{estrutura,operacao,sala,atividade}/**` | movido e alterado |
| `apps/api/src/{app.module}.ts`, `{artefato,assistente,entrega,governanca,ia,material,privacidade,professores,tutor,sessao,credencial,ops,http}/**` | alterado (import) |
| `apps/api/test/**` (em especial `arquitetura.test.ts`: `eu.controller.ts`, `painel.repository.ts`, `operador.repository.ts`) | alterado |
| `apps/worker/test/fila-de-teste.ts`, `infra/scripts/{carga-login,carga-sala,ensaio-alertas}.ts`, `infra/test/{carga-sala,alertas}.test.ts` | alterado (import e `importar('apps/api/dist/…')`) |
| `tools/guardas/tamanho-das-pastas.test.ts` | alterado (a raiz `apps/api/src` e as exceções da API) |
| `tools/guardas/guardas.test.ts`, `docs/runbook.md:862`, `TODO.md` | alterado |

## Testes que provam a regra

Cobertura que já existe (`apps/api/test`, salvo indicação): `estrutura.int.test.ts › listagens paginadas…`, `estrutura-isolamento`, `vinculo`, `lista`, `provedores-da-escola`, `turma-acesso`, `virada-do-ano`, `historico` e
`leitor-da-lista.test.ts › E3…` (`src`); `salas-abrir`, `salas-reivindicar`, `acesso-da-turma`, `decisao`, `minha-turma`, `limites-da-sala`, `codigo-da-sala.test.ts`, `reivindicacao.service.test.ts` (`src`);
`atividade.int.test.ts`, `atividade-isolamento.int.test.ts`, `correcao.int.test.ts`, `correcao-de-objetiva.test.ts`, `lote.test.ts` (`src`); `entrada-operador`, `segundo-fator-operador`, `sessao-operador`, `convite-operador`,
`painel-*`, `operacao-isolamento`, `registros-operador`, e os C40 a C44 do `arquitetura.test.ts`.

| Cenário (novo) | Tipo | Fica vermelho se (a mutação) |
|---|---|---|
| No repositório real, nenhuma pasta de `apps/api/src` tem mais de 25 arquivos de produção na raiz dela, fora as exceções da API, cada uma com `motivo` | unidade | tirar a raiz `apps/api/src` da lista, ou deixar a exceção provisória de `estrutura/` |
| A contagem da 97.0 vale aqui: `.ts` e `.tsx` direto na pasta, sem `.test.`, `.d.ts` nem `__fixtures__` | unidade | contar os `.test.ts` |
| Fixture `entrada-sem-esquema` (14.0) lintada como `apps/api/src/estrutura/turma/x.controller.ts` e `sessao/login/x.controller.ts` reprova | unidade | o `files` do bloco de `no-restricted-syntax` ficar em `*/*.controller.ts` |
| `correcao.int.test.ts`: um `.aprovar(` em `atividade-aplicada/atividade-aplicada.service.ts` o reprova | integração | a varredura voltar a não ser recursiva |

## Como testar

- Script e conferência como em `33_task.md`, um commit por pasta; o passo de texto troca `apps/api/{src,dist}/<antigo>` nos arquivos da tabela.
- A trava: `npx vitest run --project unidade tools/guardas/tamanho-das-pastas.test.ts`. Conta `.ts` e `.tsx` direto na pasta, sem `.test.`, `.d.ts` nem `__fixtures__`. Exceção da API só com motivo escrito; a provisória de `estrutura/` sai em 96.6.
- Isolado: `npx vitest run --project integracao apps/api/test/operacao-isolamento.int.test.ts apps/api/src/atividade`; `rm -rf apps/api/dist` antes da conferência.

## Fora do escopo desta tarefa

A web (97.0); mover `apps/api/test/*.int.test.ts` para junto do código; o `dependency-cruiser` (12.0).

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

