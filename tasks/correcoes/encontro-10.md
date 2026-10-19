# Correção — o encontro da linha 3 (tarefa 10.0, 2b8e78e) deu conflito em rotas.tsx com spec/telas-do-professor

**Origem:** encontro da linha 3 (`tools/processo/linhas.ts`), tarefa 10.0: o merge de `spec/telas-do-professor` na branch da linha parou em conflito.
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- Os guardiões vieram no PEDIDO do Orquestrador: frontend-reviewer, além do test-engineer que toda correção tem. -->

## Sintoma

`git merge spec/telas-do-professor` na linha 3 traz a tarefa 9.0 (d13cb69). Quase tudo junta sozinho;
`apps/web/src/areas/professor/rotas.tsx` não: `CONFLITO (conteúdo): Conflito de merge em apps/web/src/areas/professor/rotas.tsx`,
em três pontos (o `import`, a declaração do componente e o comentário da fachada).

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa antes do merge.

## Causa

As duas pontas mexeram nas mesmas linhas de `rotas.tsx`: a 9.0 (spec) tirou Turmas da fachada, trocando o `import { Turmas }`
por `const Turmas = lazy(() => import('./Turmas'))`; a 10.0 (linha) tirou a turma aberta da fachada, trocando o
`import { Turma }` por `const Turma = lazy(() => import('./Turma'))`. Cada lado deixou a outra tela como `import` direto
(o da 9.0 ainda tinha a Turma na fachada; o da 10.0 ainda tinha Turmas), e o git devolve os dois lados com marcadores.

## Teste que reproduz

Não se aplica: é a resolução de um conflito de texto entre duas mudanças que já têm testes, sem comportamento novo. A prova
é o arquivo sem marcador, com as duas telas por `lazy`, e os testes de rota e de tela da área do professor verdes isolados,
além do portão da tarefa sobre a árvore que o merge deixou.

## Correção

Mantidos os dois lados: `Turmas` (9.0) e `Turma` (10.0) por `lazy(() => import(...))`, cada uma com o seu comentário, e os
dois `import` diretos saíram. O comentário da fachada passou a dizer o que as duas fazem juntas (a fachada fica com as rotas e
o sino; o teto de 8 kB não sobe) e perdeu o "Até a 10.0 a turma aberta ainda está nela", que a 10.0 desmente. Os marcadores
`<<<<<<<`, `=======` e `>>>>>>>` saíram. O merge se fecha com o commit `(correção encontro-10)`.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | A vitrine deveria esperar o fim do carregamento da aba antes de fotografar: hoje a foto de Atividades e Alunos no computador pode sair em "Carregando a aba…" | `TODO.md` (ferramenta do processo, `tools/vitrine/`; fora do escopo de um merge de `rotas.tsx`) |
| frontend-reviewer (1ª) | O texto "1 de 1 aluno enviaram" (`apps/web/src/areas/professor/aprovar.ts:131`) concorda mal no singular | `TODO.md`, para a tarefa que tocar `aprovar.ts`: muda texto de tela em arquivo que a correção não toca |
| frontend-reviewer (1ª) | Os ids curtos nos nomes das fotos ("2ºB 038df50e") | Recusada: é do dado sintético da vitrine, não do produto |
| frontend-reviewer (1ª) | "Nenhum aluno acertou menos da metade…" repete em toda habilidade da aba Hoje; dizer uma vez só na seção | `TODO.md`, para a tarefa que tocar a aba Hoje: muda texto de tela de uma tarefa já revisada, fora da resolução do conflito |
| test-engineer (1ª) | Nenhum teste pega a volta de `Turmas` ou `Turma` ao `import` direto; só o `size-limit` na esteira. Um teste sobre o build que confira os chunks `tela-professor-Turmas-*` e `tela-professor-Turma-*` fecharia o buraco | `/retro` da spec: é teste novo sobre o build, sem relação com a resolução do conflito |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 05:02:54 | 2026-10-19 05:03:34 | `frontend-reviewer` | 1 | APROVADO | a85b95cc5ad5e8df1 |
| 2026-10-19 05:03:00 | 2026-10-19 05:03:40 | `test-engineer` | 1 | APROVADO | ae4961969e2df9073 |
