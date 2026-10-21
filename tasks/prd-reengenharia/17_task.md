# Tarefa 17.0 — Atividade, artefato, material, tutor e privacidade migram, e os pendentes somem

**Funcionalidade:** reengenharia · **Depende de:** 15.0, 16.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Os últimos cinco módulos migram, os pendentes e as três funções antigas somem: toda rota valida por esquema, conferida no boot.

## Contexto necessário

- `onda-1a.md` §2 "T1" (`@DoCaminho` da `ferramenta` e da `questao`, `@SemEntrada` do arquivo, "Sai", "A migração");
  `techspec.md` §6 e §7; `prd.md` RF5; regras 20.9, 20.11, 80.6 e 10.6
- `apps/api/src/atividade/minha-atividade.controller.ts:54` (`questaoDoCaminho`) e `:65` (`corpo ?? {}`),
  `apps/api/src/artefato/ferramentas.controller.ts:19`, `apps/api/src/material/material.controller.ts:26` (`@UploadedFile`)

## Subtarefas

- [ ] 17.1 — Caracterização, num commit antes: o inválido e o 404 da `questao`, da `ferramenta`, do upload e do pedido do titular
- [ ] 17.2 — Migram os 4 controllers de `atividade/`, os 2 de `artefato/`, `material/`, os 2 de `tutor/` e os 2 de `privacidade/`
- [ ] 17.3 — O `@UploadedFile` entra em `SEM_ENTRADA`, com motivo
- [ ] 17.4 — A lista de pendentes e as três funções de `estrutura/entrada.ts` saem, com a trava escolhida contra a volta
- [ ] 17.5 — Testes: os da tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/{atividade,artefato,material,tutor,privacidade}/*.controller.ts` (11) | alterado |
| `apps/api/src/estrutura/entrada.ts` | alterado (saem as três funções; `paginar` fica) |
| `packages/nucleo/src/entrada/` (pendentes apagados, `sem-entrada.ts`) | alterado |
| `apps/api/test/entrada-no-boot.test.ts` | alterado |
| `apps/api/src/{atividade,artefato,tutor}/*.int.test.ts` | alterado |
| `apps/api/test/{material,material-isolamento,pedido-titular,ops-privacidade}.int.test.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`.

| Cenário | Tipo | Fica vermelho se (a mutação), ou o que prova |
|---|---|---|
| Prova: `PUT …/respostas/:questao` inválido → `ENTRADA_INVALIDA`, e a resposta salva continua | integração | inválido apagar resposta |
| Prova: `questao` `abc`, `0` ou `-1` → o 404 do inexistente | integração | responder 400 |
| Prova: `questao` acima do total → o código de hoje | integração | o esquema não engole a regra |
| Prova: `POST …/enviar` sem corpo → 200, com chave a mais → `ENTRADA_INVALIDA` | integração | exigir corpo |
| Prova: atividade aplicada de B, aluno de A → 404 | integração | tirar o `eq(…escolaId…)` |
| Prova: avaliação fechada → o código de hoje | integração | o prazo não muda |
| Tutor: mensagem vazia, longa ou com chave a mais → `ENTRADA_INVALIDA`, sem `mensagem_tutor`, freio do dia parado | integração | gastar a troca |
| Tutor: mensagem longa com sentinela → nem log nem resposta a têm | integração | logar o corpo no pipe |
| Material: campos inválidos no upload → nada no storage nem em `material` | integração | validação antes do arquivo |
| Material: `@UploadedFile` em `SEM_ENTRADA`, e o boot sobe | integração | tirar a chave (o boot cai) |
| Material: id de B em `GET` e `DELETE`, no contexto de A → 404, e o de B fica | integração | tirar o `eq(material.escolaId, …)` |
| Artefato: `ferramenta` fora da lista → o 404 do inexistente | integração | `ENTRADA_INVALIDA` |
| Artefato: `ferramenta` e corpo inválidos juntos → 404 | integração | validar o corpo antes |
| Artefato: corpo inválido → sem execução nem consumo | integração | gastar IA |
| Privacidade: `corrigir-nome` inválido com sentinela → o nome não muda, sem eco em log | integração | logar o corpo |
| Privacidade: `titulares/busca` inválida → sem auditoria de leitura nem eco do termo | integração | caracterização |
| Privacidade: pedido do titular de B, no contexto de A → 404 | integração | tirar o `eq(…escolaId…)` |
| A lista de pendentes está vazia e o arquivo dela não existe | unidade | devolver um |
| Nenhum controller chama `safeParse`, `lerEntrada`, `idDoCaminho` nem `lerConsultaPaginada`, e as três não existem | unidade | devolver um `safeParse` em `tutor.controller.ts` |
| O boot conta os handlers e parâmetros conferidos, contra o §2 da onda (137 e 153) | integração | nenhum handler fora |

## Como testar

- A questão: copie `apps/api/src/atividade/atividade.int.test.ts › a questão que a atividade não tem responde como
  inexistente, …` (`:184`).
- O Tutor: `apps/api/src/tutor/tutor.int.test.ts › recusa o corpo fora do contrato: …` (`:219`).
- O isolamento: `apps/api/test/material-isolamento.int.test.ts › ler material de B responde o mesmo 404 do inexistente
  …` (`:95`).
- O log: `CapturaDeDadoPessoal` (`apps/api/test/captura-de-dado-pessoal.ts`).
- Isolado: `npx vitest run --project integracao <arquivo>`.
- Armadilha: a trava contra a volta é escolha desta tarefa (estender `sem-req-cru` ou um `it` do `arquitetura.test.ts`);
  escreva a escolhida na 17.4.

## Fora do escopo desta tarefa

O registro de rotas (21.0) e a validação de job (18.0).

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

