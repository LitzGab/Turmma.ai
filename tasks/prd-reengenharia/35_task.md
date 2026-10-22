# Tarefa 35.0 — `ops/` só tem terminal; casos de uso em `operacao/`, paginação em `http/`

**Funcionalidade:** reengenharia · **Depende de:** 34.0, 17.0
**Subagentes obrigatórios:** `tenancy-guardian`, `test-engineer`, `revisor-geral`
**Porte:** pequeno

## Objetivo

O painel da operação (`operacao/`) deixa de importar de `ops/`: `criarRede`, `criarEscola` e o repository delas passam para `operacao/casos-de-uso/`, e
`ops/` fica só com os comandos de terminal. O corte de página (`paginar`, `paginarPor`) sai de `estrutura/entrada.ts` para `apps/api/src/http/paginacao.ts`.
Comportamento igual. Tarefa mecânica, com uma divisão de arquivo à mão (35.2).

## Contexto necessário

- `onda-2.md` §2 (RF14: `operacao/casos-de-uso/`, `http/paginacao.ts`); `33_task.md`, "Como testar" (script e conferência)
- `ops/escola.ts` mistura o terminal (`lerPedidoDoOperador`, `executarOpsEscola`, o `main` do fim) e os dois casos de uso. Ele **não pode mover inteiro**:
  `package.json` (`ops:escola`) roda `apps/api/dist/ops/escola.js`, e `infra/scripts/{carga-login,carga-sala,ensaio-alertas}.ts` o carregam por `importar('apps/api/dist/ops/escola.js')`
- `apps/api/test/arquitetura.test.ts › arquitetura: nenhuma rota registrada cria operador (C44)`: `COMANDOS_QUE_A_API_IMPORTA` deixa o painel importar `ops/escola.js`
- `ops/escola.repository.test.ts`: `COMANDO`, `REPOSITORY`, `IMPORTADORES_PERMITIDOS_DO_COMANDO` e `RAIZ = new URL('../../../../', import.meta.url)` (a pasta nova é um nível mais fundo)
- Depois da 17.0, `estrutura/entrada.ts` só deve ter `paginar` e `paginarPor`; se sobrar outra coisa, pare e avise o Arquiteto. `apps/api/src/http/` não existe hoje

## Subtarefas

- [ ] 35.1 — Caracterização, num commit antes: `estrutura/entrada.test.ts` (unidade): até `limite` linhas não dão `proxima`; `limite + 1` dá `proxima` igual ao id da última devolvida; vazio; `paginarPor` com chave `usuarioId`
- [ ] 35.2 — À mão, num commit: `criarRede` e `criarEscola` (com o `RegistroDeAuditoria` que usam) vão de `ops/escola.ts` para `operacao/casos-de-uso/escola.ts`; `ops/escola.ts` os importa e **não os reexporta**; os importadores de `criarRede` e `criarEscola` trocam o caminho
- [ ] 35.3 — Script, um commit: `ops/escola.repository.ts` e `.test.ts` → `operacao/casos-de-uso/`; o `RAIZ` do teste ganha um `../`
- [ ] 35.4 — Script, um commit: `estrutura/entrada.ts` e `entrada.test.ts` → `http/paginacao.ts` e `paginacao.test.ts` (os serviços que importam `paginar` ou `paginarPor`)
- [ ] 35.5 — `COMANDOS_QUE_A_API_IMPORTA` vira `{}`; `escola.repository.test.ts` aponta para o caso de uso e põe `ops/escola.ts` entre os importadores permitidos; caminho citado como texto e conferência final

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/ops/escola.ts`, `escola.repository.ts`, `escola.repository.test.ts` | alterado, movido, movido |
| `apps/api/src/operacao/casos-de-uso/**` | novo (destino) |
| `apps/api/src/operacao/painel.service.ts` | alterado (import) |
| `apps/api/src/estrutura/entrada.ts` | movido para `apps/api/src/http/paginacao.ts` |
| `apps/api/src/http/**` | novo (destino) |
| `apps/api/src/{artefato,atividade,entrega,estrutura,governanca,material,professores,sala}/*.service.ts` | alterado (import) |
| `apps/api/test/{arquitetura.test,ops-escola.int.test,sessao-de-teste}.ts` | alterado |
| `apps/worker/test/fila-de-teste.ts` | alterado (import) |
| `infra/scripts/{carga-login,carga-sala,ensaio-alertas}.ts` | alterado (`import type` e `importar('apps/api/dist/…')`) |
| `TODO.md` | alterado (citações de caminho) |

## Testes que provam a regra

Cobertura que já existe: `ops/escola.test.ts › lerPedidoDoOperador` (o terminal, que fica em `ops/`); `ops-escola.int.test.ts › npm run ops:escola: rede e escola nascem só por comando do operador`
e `› permissão: nenhuma rota da API cria rede nem escola, fora das duas do painel da operação`; `painel-escrita.int.test.ts › painel da operação: rede e escola, com o autor conferido na transação (tarefa 1.0)`;
`escola.repository.test.ts` (o único que prende quem importa o caso de uso); e, para a paginação, `estrutura.int.test.ts › listagens paginadas…`, `professores.int.test.ts › I3 (lista)…`, `lista.int.test.ts › lista de nomes da turma…`.

| Cenário | Tipo | Fica vermelho se (a mutação) |
|---|---|---|
| Nenhum arquivo de `operacao/` importa `ops/` (`COMANDOS_QUE_A_API_IMPORTA` vazio; os `fora` do C44 passam a incluir `painel.service.ts` com `../ops/escola.js`) | unidade | devolver o `import { criarEscola } from '../ops/escola.js'` ao painel |
| Só `painel.service.ts`, `ops/escola.ts` e as bancadas importam o caso de uso, e só ele importa `escola.repository` | unidade | importar o repository em outro arquivo |
| `paginar`/`paginarPor`: os quatro casos de 35.1, contra `http/paginacao.ts` | unidade | `limite + 1` virar `limite` |
| `npm run ops:escola` roda do `dist` (a integração do comando) | integração | mover `ops/escola.ts` inteiro |

## Como testar

- Script, conferência e `rm -rf apps/api/dist` como em `33_task.md`; aqui o passo de texto troca `apps/api/{src,dist}/ops/escola` só nos arquivos da tabela.
- Isolado: `npx vitest run --project unidade apps/api/src/ops apps/api/src/operacao apps/api/src/http apps/api/test/arquitetura.test.ts` e
  `npx vitest run --project integracao apps/api/test/ops-escola.int.test.ts apps/api/test/painel-escrita.int.test.ts apps/api/test/estrutura.int.test.ts`.
- Armadilha: `escola.repository.test.ts` varre `apps`, `packages`, `infra` e `tools` por texto; ele cai se um importador novo do caso de uso não estiver na lista dele.

## Fora do escopo desta tarefa

Os demais comandos de `ops/`, que ficam onde estão (`dist/ops/*.js`, `infra/compose.yml:122`); a subpasta por recurso em `operacao/` (96.0: `casos-de-uso/` vira `operacao/escola/`); o `dependency-cruiser` (12.0).

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

