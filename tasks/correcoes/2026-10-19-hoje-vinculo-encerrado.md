# Correção — com Hoje aberta, o vínculo encerrado não tira a página da turma

**Origem:** `tasks/prd-telas-do-professor/validacao.md` §4, A2 (rodada 1; PRD §7, "Vínculo encerrado com a turma aberta").
**Subagentes obrigatórios:** `test-engineer`, `frontend-reviewer`, `privacy-guardian`
<!-- Os guardiões vieram no PEDIDO do Orquestrador: `frontend-reviewer` e `privacy-guardian`. test-engineer é obrigatório em toda correção. -->

## Sintoma

Com a aba Hoje aberta, o 404 da releitura dos sinais (a cada 15 s) não tira a página da turma, como a aba Alunos faz (`aoPerderATurma`,
`AlunosDaTurma.tsx:68`). A página só sai quando a turma é relida por foco ou visibilidade, depois de 30 s. Até lá o dado antigo fica na
tela e, com o painel "Ver quem" aberto, os nomes continuam (regra 20, item 18). Nenhum teste cobria o caso.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa.

## Causa

A aba Hoje (`TurmaHoje.tsx`) não recebia `aoPerderATurma` e não olhava o erro da releitura dos sinais: o `Turma.tsx` só passava a
função para a aba Alunos, e o comentário dizia que a releitura que cai com o dado na tela "não tira a página", sem separar o 404 da
falha de rede e de servidor. A releitura de 15 s é a primeira a saber que o vínculo acabou, e o 404 dela ficava no cache da consulta.

## Teste que reproduz

- `apps/web/src/areas/professor/TurmaHoje.test.tsx`, em "Hoje e a turma que sai do alcance com a aba aberta":
  - `o 404 da releitura dos 15 s avisa a página que a turma saiu do alcance, uma vez só, também nas releituras seguintes`;
  - `a primeira leitura dos sinais já com 404 (a página abre sem o vínculo) também avisa a página`;
  - os dois controles, que esperam a falha dos sinais chegar ao estado da consulta antes de afirmar que nada foi avisado: `o controle: a
    releitura que cai por limite ou servidor, com o dado na tela, não avisa nada e o aviso fica` e `o controle: a primeira leitura que cai por
    limite, sem dado, mostra o erro e não avisa a página`.
- `apps/web/src/areas/professor/Turma.test.tsx`, em "o vínculo encerrado com a turma aberta em Hoje": o 404 da releitura dos sinais tira a
  página inteira, com o painel "Ver quem" aberto e com ele fechado (`it.each`), sem o nome de aluno nenhum.
- `e2e/professor-tutor.spec.ts`: `o vínculo encerrado com Hoje aberta: o 404 da releitura dos 15 s tira a página inteira, com o painel "Ver quem" e os nomes dele`,
  que confere também que a turma não foi relida (a página sai pelos sinais, e não pelo foco).

Vermelho antes da correção: os dois casos novos de componente falham (o aviso nunca chega à página, e a página continua com as abas e o
painel); o controle passa nos dois lados. Verde depois (36 testes dos dois arquivos).

## Correção

`TurmaHoje` passa a receber `aoPerderATurma` e a chamá-la quando o erro dos sinais é o `NAO_ENCONTRADO` (`turmaIndisponivel`, o mesmo
critério da aba Alunos); o `Turma.tsx` passa a função que já usava para a aba Alunos, e a página sai inteira com o aviso, o painel e
os nomes. Só o 404 vale: limite, rede e servidor com o dado na tela não desmontam nada. Os comentários do `Turma.tsx` e do `TurmaHoje.tsx`
dizem isso.

## Mutações

A aba Hoje deixa de avisar a página.

```mutacao
arquivo: apps/web/src/areas/professor/TurmaHoje.tsx
teste: apps/web/src/areas/professor/Turma.test.tsx › o 404 da releitura dos sinais tira a página inteira
-    if (semATurma) aoPerderATurma()
+    if (semATurma && false) aoPerderATurma()
```

Qualquer falha dos sinais passa a valer como turma perdida, e não só o 404 (o critério "só o 404 vale").

```mutacao
arquivo: apps/web/src/areas/professor/TurmaHoje.tsx
teste: apps/web/src/areas/professor/TurmaHoje.test.tsx › o controle: a releitura que cai por limite ou servidor
-  const semATurma = turmaIndisponivel(sinais.error)
+  const semATurma = sinais.isError
```

## Recomendações sem aplicar

| Quem | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | `perdida` (`Turma.tsx`) é estado que só zera se `Turma` remontar: `key={turmaId}` ou zerar quando o id muda | Não é desta correção e já valia para a aba Alunos: `TODO.md`, linha nova, com a conferência de que a rota remonta `Turma` ao trocar de `turmaId`; o `/validar` da spec a vê |
| privacy-guardian (1ª) | `removeQueries` das leituras da turma em `perderATurma`, para nenhum nome ficar no cache depois do aviso | Muda comportamento e vale também para a aba Alunos, que já se comporta assim: `TODO.md`, na mesma linha |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 18:22:51 | 2026-10-19 18:23:20 | `frontend-reviewer` | 1 | APROVADO | a511c8ae0efd2f937 |
| 2026-10-19 18:22:55 | 2026-10-19 18:23:24 | `privacy-guardian` | 1 | APROVADO | abe2d8f82177de7f5 |
| 2026-10-19 18:22:47 | 2026-10-19 18:24:45 | `test-engineer` | 1 | REPROVADO | abd9d8e29efe9173c |
| 2026-10-19 18:39:43 | 2026-10-19 18:40:34 | `test-engineer` | 2 | APROVADO | a2844330d503f877d |
