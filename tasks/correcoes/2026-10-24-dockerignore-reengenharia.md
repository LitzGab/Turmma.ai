# Correção — `.dockerignore` e `tools/ci/dockerfile.test.ts` ainda citam `.reengenharia`, pasta que não existe mais

**Origem:** uso — item "(X5, RF31)" do `TODO.md`; é o ensaio do RF31 da X7 (`tasks/prd-harness/tasks.md`, linha 176)
**Subagentes obrigatórios:** `infra-guardian`, `test-engineer`, `revisor-geral`
<!-- infra-guardian: ditado pelo PEDIDO do Orquestrador. revisor-geral: a correção toca `tools/ci/` (limite do passo 5 de `corrigir`). -->

## Sintoma

O fechamento da X5 apagou a pasta `.reengenharia` (R64), mas `.dockerignore` (linha 10) ainda a lista, e
`tools/ci/dockerfile.test.ts` (linhas 128 a 130) ainda exige que ela esteja listada. A linha ignora uma pasta
que não existe, e o teste obriga a manter o que ficou sem sentido.

## Fora desta correção

nada

## Causa

A X5 apagou a pasta no fechamento, mas o teste que cita a lista de pastas ignoradas e o `.dockerignore`
continuaram com o nome. Ficou registrado no `TODO.md` ("na próxima tarefa que tocar o Dockerfile ou o
`.dockerignore`") e nenhuma tarefa os tocou.

## Teste que reproduz

`tools/ci/dockerfile.test.ts › o contexto de build fica fora do que a imagem não usa: mockups e .processo`
(o teste passa a pedir só `mockups` e `.processo`, e que `.reengenharia` **não** esteja na lista). Vermelho antes,
porque o `.dockerignore` ainda a tem; verde depois.

## Correção

- `.dockerignore`: saiu a linha `.reengenharia`.
- `tools/ci/dockerfile.test.ts`: o caso passou a se chamar "…: mockups e .processo", pede só essas duas pastas e confere que
  `.reengenharia` **não** está na lista, para a citação não voltar.
- `TODO.md`: o item "(X5, RF31)" ficou `[x]`, com a nota da correção.

Não há código de `apps/*/src` nem de `packages/*/src`: não precisa de bloco `mutacao` (regra 40, RF17). A prova de que o
teste pega o defeito é o vermelho de antes (o `.dockerignore` ainda tinha a linha).

## Ensaio do RF31: commit sem revisão pelo `/usr/bin/git`

Pedido pelo Orquestrador, feito no checkout da linha (`spec/harness--l1`, `CLAUDE_CODE_AGENT=implementador`), com os quatro
arquivos da correção já no índice e **nenhuma rodada** da Mesa. Duas tentativas, as duas pelo binário, e o commit não saiu
(`git log -1` continuou em `fc514111`):

1. `/usr/bin/git commit -F <mensagem sem a marca de correção>`, saída 1:
   `Commit bloqueado: ele leva código (tools/ci/dockerfile.test.ts) sem "(tarefa N.0)" nem "(correção <slug>)". Código entra por tarefa ou por correção, …`
2. `/usr/bin/git commit -F <mensagem com "(correção 2026-10-24-dockerignore-reengenharia)">`, saída 1, agora pela revisão:
   `Commit bloqueado: revisões de tasks/correcoes/2026-10-24-dockerignore-reengenharia.md incompletas.` seguido de
   `infra-guardian`, `test-engineer` e `revisor-geral`, "nenhuma rodada registrada", e do portão local ("`.dockerignore` mudou … depois do
   início do último").

O texto não diz se quem recusou foi o `PreToolUse` ou o `commit-msg`; só que o binário direto não escapa do hook.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | Trocar a proibição de um nome que já não existe por uma checagem do que importa: o contexto de build não deve levar pasta de processo nem de documento | `TODO.md`, para quando a lista de pastas ignoradas for revista; muda o desenho do teste, não cabe em poucas linhas |
| test-engineer (1ª) | Mencionar a ausência de `.reengenharia` no nome do caso | Recusada: a mensagem da própria asserção já diz o motivo (R64), e renomear o caso obriga a mudar o documento e a tabela de testes |
| revisor-geral (1ª) | Não repetir a asserção negativa para todo nome removido | Sem ação: é aviso de padrão, não pede mudança nesta correção |
| revisor-geral (1ª) | Registrar a recusa do commit pelo `/usr/bin/git` no `estado.md` do andar | Orquestrador, no fechamento (o `estado.md` não é do Implementador; `protocolo.md` item 1) |
| test-engineer (2ª) | A asserção de ausência deixa passar `.reengenharia` com curinga (`**/.reengenharia`, `.reengenharia/**`); trocar por `ignorados.some((l) => l.includes('.reengenharia'))` igual a `false` | Cobertura extra, e o texto atual do `.dockerignore` não tem o risco; junto com a revisão da lista de pastas ignoradas (a mesma linha do `TODO.md` abaixo) |
| revisor-geral (2ª) | A normalização só cobre a barra no começo ou no fim; `mockups/**` faria o teste acusar falta | Não pede mudança: erra para o lado seguro. Nota para a mesma revisão da lista |
| revisor-geral (2ª) | A tabela diz que a sugestão do infra-guardian vai para o `TODO.md`, mas o `TODO.md` não tem esse item | Feito: o item "(X7, correção `2026-10-24-dockerignore-reengenharia`)" está no `TODO.md`, com as duas notas acima |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-24 02:41:20 | 2026-10-24 02:41:38 | `infra-guardian` | 1 | APROVADO | a49e05799a061a43e |
| 2026-10-24 02:41:22 | 2026-10-24 02:41:44 | `revisor-geral` | 1 | APROVADO | a0d8efee46be7b7d7 |
| 2026-10-24 02:41:21 | 2026-10-24 02:41:49 | `test-engineer` | 1 | APROVADO | a185f3783d20dcda9 |
| 2026-10-24 02:47:17 | 2026-10-24 02:47:35 | `test-engineer` | 2 | APROVADO | afc3d0f9da975c91e |
| 2026-10-24 02:47:23 | 2026-10-24 02:47:46 | `revisor-geral` | 2 | APROVADO | a2fdcf6d98046cc73 |
