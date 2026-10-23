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

- [x] 35.1 — Caracterização, num commit antes: `estrutura/entrada.test.ts` (unidade): até `limite` linhas não dão `proxima`; `limite + 1` dá `proxima` igual ao id da última devolvida; vazio; `paginarPor` com chave `usuarioId`
- [x] 35.2 — À mão, num commit: `criarRede` e `criarEscola` (com o `RegistroDeAuditoria` que usam) vão de `ops/escola.ts` para `operacao/casos-de-uso/escola.ts`; `ops/escola.ts` os importa e **não os reexporta**; os importadores de `criarRede` e `criarEscola` trocam o caminho
- [x] 35.3 — Script, um commit: `ops/escola.repository.ts` e `.test.ts` → `operacao/casos-de-uso/`; o `RAIZ` do teste ganha um `../`
- [x] 35.4 — Script, um commit: `estrutura/entrada.ts` e `entrada.test.ts` → `http/paginacao.ts` e `paginacao.test.ts` (os serviços que importam `paginar` ou `paginarPor`)
- [x] 35.5 — `COMANDOS_QUE_A_API_IMPORTA` vira `{}`; `escola.repository.test.ts` aponta para o caso de uso e põe `ops/escola.ts` entre os importadores permitidos; caminho citado como texto e conferência final

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
| `TODO.md` | sem alteração: não cita esses caminhos |

## Testes que provam a regra

Cobertura que já existe: `ops/escola.test.ts › lerPedidoDoOperador` (o terminal, que fica em `ops/`); `ops-escola.int.test.ts › npm run ops:escola: rede e escola nascem só por comando do operador`
e `› permissão: nenhuma rota da API cria rede nem escola, fora das duas do painel da operação`; `painel-escrita.int.test.ts › painel da operação: rede e escola, com o autor conferido na transação (tarefa 1.0)`;
`escola.repository.test.ts` (o único que prende quem importa o caso de uso); e, para a paginação, `estrutura.int.test.ts › listagens paginadas…`, `professores.int.test.ts › I3 (lista)…`, `lista.int.test.ts › lista de nomes da turma…`.

| Cenário | Tipo | Fica vermelho se (a mutação) |
|---|---|---|
| Nenhum arquivo de `operacao/` importa `ops/` (`COMANDOS_QUE_A_API_IMPORTA` vazio; os `fora` do C44 passam a incluir `painel.service.ts` com `../ops/escola.js`) | unidade | devolver o `import { criarEscola } from '../ops/escola.js'` ao painel |
| Só `painel.service.ts`, `ops/escola.ts` e as bancadas importam o caso de uso, e só ele importa `escola.repository` | unidade | importar o repository em outro arquivo |
| `paginar`/`paginarPor`: os quatro casos de 35.1, contra `http/paginacao.ts` | unidade | `limite + 1` virar `limite` |
| `ops/escola.ts` continua onde o `npm run ops:escola` o roda, e é o terminal que importa o caso de uso (`escola.repository.test.ts › fora de teste, só o painel da operação, o comando ops:escola e as bancadas importam o caso de uso…`; o `ops-escola.int.test.ts` chama `executarOpsEscola` de `src`, não roda o `dist`) | unidade | mover `ops/escola.ts` inteiro |

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
| Um commit só para a tarefa, e não um por subtarefa (35.1 a 35.4, cada uma "num commit"): o hook exige carimbo do portão e revisão aprovada em todo commit `(tarefa N.0)`, e a Mesa revisa a tarefa uma vez. A divisão à mão (35.2) e os dois movimentos por script (35.3, 35.4) rodaram em passos, com tipos e unidade conferidos no fim; o git guarda os quatro arquivos movidos como renomeação | O processo (D78, D53) não tem como aprovar commit intermediário de uma tarefa (a mesma divergência da 33.0, da 34.0, da 36.0 e da 97.0) | `tasks.md`, "Tarefa mecânica" (a regra do commit por tarefa, escrita lá) |
| O script é o `mover.cjs` da 33.0 e da 34.0, com uma linha trocada: o passo de texto só abria arquivo que contivesse a palavra `sessao`, e aqui abre o que contenha o caminho antigo. Ficou fora do repositório, no scratchpad da sessão (`.../d7772567-b1f9-4879-8fbd-ce4c814312be/scratchpad/mover/`: `mover.cjs` e o `mapa.json` de quatro pares) | O filtro `sessao` era da 34.0; o ESLint lê `.processo/` e reprova o rascunho (a 33.0 já registrou) | `tasks.md`, "Tarefa mecânica" (o script fica fora do commit) |
| `ops/escola.ts` importa `criarRede` e `criarEscola` de `operacao/casos-de-uso/escola.ts` e **não os reexporta**; os que os importavam de `ops/escola.js` trocam o caminho (`painel.service.ts`, `ops-escola.int.test.ts`, `sessao-de-teste.ts`, `fila-de-teste.ts`, e o `import type` e o `importar('apps/api/dist/…')` dos três scripts de `infra/`). O `abrirBancoDeOperacao`, o `executarOpsEscola` e o resto do terminal continuam em `ops/escola.ts` | É o que a subtarefa 35.2 manda; `package.json` (`ops:escola`) roda `apps/api/dist/ops/escola.js`, que continua existindo | `onda-2.md` §2, RF14 (`operacao/casos-de-uso/`); `33_task.md`, "Contexto necessário" |
| `COMANDOS_QUE_A_API_IMPORTA` do C44 vira `{}` (nenhum arquivo da API fora de `ops/` importa comando), e a lista de quem importa o caso de uso (`escola.repository.test.ts`) ganha `ops/escola.ts` ao lado do painel e das bancadas | O painel não importa mais de `ops/`; o terminal é agora quem importa o caso de uso, como as bancadas | `onda-2.md` §2, RF14; esta tarefa, 35.5 |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/api/src/operacao/painel.service.ts
teste: apps/api/test/arquitetura.test.ts › só o comando cria operador e convite de operador, e nenhum módulo da API importa os comandos
-import { criarEscola, criarRede } from './casos-de-uso/escola.js'
+import { criarEscola, criarRede } from '../ops/escola.js'
```

```mutacao
arquivo: apps/api/src/operacao/painel.repository.ts
teste: apps/api/src/operacao/casos-de-uso/escola.repository.test.ts › nenhum código fora do repository do operador cria rede ou escola, e só o caso de uso o importa
-import { rede, SemEscopo, type Banco, type DadosDaCoordenacao, type UsoDoPeriodo } from '@educa/nucleo'
+import { rede, SemEscopo, type Banco, type DadosDaCoordenacao, type UsoDoPeriodo } from '@educa/nucleo'
+import { RedeEEscolaRepository } from './casos-de-uso/escola.repository.js'
```

```mutacao
arquivo: apps/api/src/operacao/eu.service.ts
teste: apps/api/src/operacao/casos-de-uso/escola.repository.test.ts › fora de teste, só o painel da operação, o comando ops:escola e as bancadas importam o caso de uso
-import { ErroDeDominio, exigirOperadorDoContexto } from '@educa/nucleo'
+import { ErroDeDominio, exigirOperadorDoContexto } from '@educa/nucleo'
+import { criarRede } from './casos-de-uso/escola.js'
```

```mutacao
arquivo: apps/api/src/http/paginacao.ts
teste: apps/api/src/http/paginacao.test.ts › uma linha além do limite é cortada
-  const itens = linhas.slice(0, limite)
+  const itens = linhas.slice(0, limite + 1)
```

```mutacao
arquivo: apps/api/src/http/paginacao.ts
teste: apps/api/src/http/paginacao.test.ts › até o limite as linhas voltam inteiras e sem proxima
-  return linhas.length > limite && ultima !== undefined ? { itens, proxima: chave(ultima) } : { itens }
+  return linhas.length >= limite && ultima !== undefined ? { itens, proxima: chave(ultima) } : { itens }
```

```mutacao
arquivo: apps/api/src/http/paginacao.ts
teste: apps/api/src/http/paginacao.test.ts › com limite zero a página é vazia e não aponta proxima
-  return linhas.length > limite && ultima !== undefined ? { itens, proxima: chave(ultima) } : { itens }
+  return linhas.length > limite ? { itens, proxima: chave(ultima as Linha) } : { itens }
```

```mutacao
arquivo: apps/api/src/http/paginacao.ts
teste: apps/api/src/http/paginacao.test.ts › proxima é a chave usuarioId da última devolvida
-  return linhas.length > limite && ultima !== undefined ? { itens, proxima: chave(ultima) } : { itens }
+  return linhas.length > limite && ultima !== undefined ? { itens, proxima: (ultima as { id: string }).id } : { itens }
```

```mutacao
arquivo: apps/api/src/ops/escola.ts
teste: apps/api/test/ops-escola.int.test.ts › caminho feliz: cria rede e escola, grava as duas auditorias com o operador, e a saída tem só os ids
        pedido.entidade === 'rede'
-          ? { redeId: (await criarRede(banco, autor, { id: randomUUID(), nome: pedido.nome, tipo: pedido.tipo })).id }
+          ? { redeId: randomUUID() }
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| tenancy-guardian (1ª) | `{ano-letivo,disciplina,lista,serie,turma,vinculo}.service.ts`: o import `../http/paginacao.js` ficou no meio dos imports locais | Recusada: cosmético, o lint do portão passa e não há regra de ordem de import escrita; mexer em seis serviços sem mudar comportamento só caduca os revisores |
| revisor-geral (1ª) | Mutações: usar o nome inteiro do caso em vez de um trecho | Recusada: o `-t` do vitest aceita trecho, e o portão da tarefa já prova o vermelho de cada bloco |
| test-engineer (1ª) | Checagem do `package.json` (`scripts['ops:escola']` termina em `apps/api/dist/ops/escola.js`), como em `infra/test/alertas.test.ts:198` | Recusada nesta tarefa: cobertura extra e opcional, nova cláusula fora do escopo mecânico; `dist/ops/escola.js` não mudou de lugar |
| test-engineer (1ª) | Caso que afirme que `ops/escola.ts` não reexporta `criarRede` nem `criarEscola` | Recusada: cobertura extra e opcional; a lista de importadores de `escola.repository.test.ts` e o C44 já prendem quem importa o caso de uso |
| test-engineer (2ª), revisor-geral (2ª) | `arquitetura.test.ts:1530`: a variável local `entrada` ainda tem o nome antigo | Recusada: só nome de variável local, sem efeito; a rodada de aprovação não abre outro ciclo por isso |
| test-engineer (2ª) | A linha em branco entre o comentário e `const registro` em `escola.ts` é ruído no diff | Recusada: é a separação que o `tenancy-guardian` e o `revisor-geral` pediram na 1ª rodada |
| test-engineer (2ª) | Checagem do `package.json` (`ops:escola` → `dist/ops/escola.js`) | Recusada de novo, pelo motivo da 1ª rodada (já na tabela do documento) |

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
| 2026-10-22 21:30:19 | 2026-10-22 21:30:54 | `tenancy-guardian` | 1 | APROVADO | a2993f8bb1507ff03 |
| 2026-10-22 21:30:27 | 2026-10-22 21:31:19 | `revisor-geral` | 1 | APROVADO | a6905c8eb6a30c7f7 |
| 2026-10-22 21:30:23 | 2026-10-22 21:31:58 | `test-engineer` | 1 | APROVADO | a103275b8e0045906 |
| 2026-10-22 21:36:20 | 2026-10-22 21:36:45 | `test-engineer` | 2 | APROVADO | aeacc990b7b3debe0 |
| 2026-10-22 21:36:28 | 2026-10-22 21:36:46 | `revisor-geral` | 2 | APROVADO | a1aaf01b34d86548e |
