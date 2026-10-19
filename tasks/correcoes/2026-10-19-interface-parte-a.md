# Correção — `docs/interface.md`, Parte A, não descreve o que as tarefas 9.0 a 13.0 construíram

**Origem:** `tasks/prd-telas-do-professor/validacao.md` seção 4, Maiores, A3 (validação da X3, REPROVADA; critério de pronto de `tasks.md`: "`docs/interface.md`, Parte A, descreve o construído").
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- O `frontend-reviewer` veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

A Parte A (seção 1 e 11.2 a 11.5) do `docs/interface.md` diz coisas que o código não faz e deixa de dizer o que ele faz:

- seção 1, "Turmas": "na X3 o acesso e os pedidos passam para um diálogo" (só o acesso foi, e o texto está no futuro); "com Visão Geral e Alunos" (são Hoje, Atividades e Alunos); a turma aberta, a faixa "Confirme sua turma", os cartões, o aviso depois de confirmar e o diálogo "Convidar alunos" não estão descritos;
- seção 1.3 (`:213`) e 9.8 (`:1046`): o exemplo "Corrigi as 32 provas do 2ºB, média 6,4" traz uma média, contra o RF21 (sem média, nota, ranking);
- seção 1.3 (`:208`): "a aba Hoje da turma o traz de volta nesta spec" — o endereço do Tutor já leva a Hoje (`Tutor.tsx`);
- seção 11.5 (`:1656`): "abrir a conversa de um aluno é ação à parte, com aviso de que fica em auditoria" — não existe nenhum caminho que abra a conversa de um aluno (`TurmaHoje.tsx`, `AlunosDaTurma.tsx`);
- seção 12 (`:1748`): "Turmas › a turma aberta, com Visão Geral e Alunos" — são Hoje, Atividades e Alunos.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso. O achado A4 (`docs/roteiro-da-demonstracao.md` e as outras menções a "Seu time" fora do `interface.md`) é outro pedido.

## Causa

As tarefas 9.0 a 13.0 recompuseram Turmas e a turma aberta, e o `docs/interface.md` só ganhou a 2.6 (lugares, sino e "Seu time"). Nenhuma das cinco tarefas listava o documento entre os arquivos dela, e o critério "a Parte A descreve o construído" ficou para o fim sem dono. O texto de antes da X3 (`Visão Geral`, o acesso e os pedidos na turma, o exemplo com média) ficou onde estava.

## Teste que reproduz

Não há. O defeito está num documento de desenho, e cinco testes o leem como entrada, nenhum numa seção que esta correção altera: `apps/web/src/componentes/onca/CabecaOnca.test.tsx:25` (a 9.7), `apps/web/src/contraste.test.ts:33` (de "#### Pares de contraste" ao próximo "### "), `apps/web/src/estilos.test.ts:69` (os blocos `css` da 9.10), `apps/web/src/estilos.test.ts:674` (a tabela `t-*` da 9.2) e `e2e/tokens.spec.ts:57` (os blocos `css` da 9.10). Todos leem a Parte B; a 9.8, que esta correção altera, não é lida por nenhum. Um teste que compare o texto com o rótulo da tela seria teste de cópia: não prova regra de negócio (regra 40). A evidência que substitui o vermelho é o `grep` abaixo, que devolvia as linhas citadas antes e depois devolve só a linha da seção 12 que conta de propósito o que a A3 entregou ("na A3 eram Visão Geral e Alunos"), e a conferência de cada frase nova contra o arquivo do código que ela descreve (`Turmas.tsx`, `Turma.tsx`, `TurmaHoje.tsx`, `AtividadesDaTurma.tsx`, `AlunosDaTurma.tsx`, `AcessoDaTurma.tsx`, `ConvidarAlunos.tsx`, `Tutor.tsx`, `SinoDoProfessor.tsx`):

```
grep -n "Visão Geral\|média 6,4\|o traz de volta nesta spec\|abrir a conversa de um aluno é ação\|na X3 o acesso e os pedidos passam" docs/interface.md
```

## Correção

`docs/interface.md`, só a Parte A:

- seção 1, "Turmas": o item da lista de lugares fica curto e aponta para a nova **seção 1.7**, que descreve, pelo código e no presente, a lista, a faixa, os cartões e o selo, a turma aberta com as três abas, Hoje, Atividades, Alunos e o diálogo "Convidar alunos";
- seção 1.3: o exemplo do sino sem média (os quatro itens reais e a fala do Assistente de `falaDaEntrega`), "O que o Tutor viu" como endereço que leva a Hoje, e o aviso de que os sinais do Tutor não entram no sino hoje (`fila-do-professor.ts`: "O sino de hoje não tem sinal do Tutor (F10)");
- seção 9.8: o mesmo exemplo, sem média;
- seção 11.2: a turma aberta entre os tipos de página (a página parada, o painel da aba que rola);
- seção 11.5: um bloco novo, "Turmas e a turma aberta", com as peças de cada aba, e "O que o Assistente fez e o que o Tutor viu" sem a conversa de aluno;
- seção 12: a linha do roteiro diz "Hoje, Atividades e Alunos" e guarda, entre parênteses, o que a A3 entregou.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | Seção 1.4 (`:235`) ainda cita "média do aluno" como critério de fora da curva | Fora desta correção e não contradiz o RF21 (que trata da turma aberta). Destino: a tarefa que reescrever a seção 1.4 quando a nota oficial entrar (F6); anotar em `TODO.md` |

## Mutações

Não há: a correção não acrescenta cláusula de código.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 18:49:50 | 2026-10-19 18:50:50 | `test-engineer` | 1 | APROVADO | a54f8fb6cb1b7de94 |
| 2026-10-19 18:49:48 | 2026-10-19 18:51:37 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | ad5b694a07cc02ea5 |
| 2026-10-19 18:55:49 | 2026-10-19 18:56:19 | `frontend-reviewer` | 2 | APROVADO | ac172138886fe6bb4 |
