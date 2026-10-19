# Correção — a aba Alunos tem dois botões cheios

**Origem:** `tasks/prd-telas-do-professor/validacao.md` §4, C3 (RF18).
**Subagentes obrigatórios:** `test-engineer`, `frontend-reviewer`
<!-- Os guardiões vieram no PEDIDO do Orquestrador: `frontend-reviewer`. test-engineer é obrigatório em toda correção. -->

## Sintoma

A aba Alunos da turma aberta mostra dois botões cheios (face laranja): "Convidar alunos", do acesso dos alunos
(`AcessoDaTurma.tsx:97`), e "Ver o acesso dos alunos", no vazio dos pedidos (`AlunosDaTurma.tsx:110`), que só leva o foco ao título
do acesso, logo acima. Contradiz `docs/interface.md` R4 ("um botão cheio por tela") e o padrão de página da seção 6.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa.

## Causa

O vazio dos pedidos (`ListaDePedidos`) é uma peça dos dois papéis; a coordenação usa a `acao` do `EstadoVazio` para "Mostrar o link da
sala", e a aba Alunos passou a mesma `acao` para levar o foco ao acesso. O `EstadoVazio` desenha a `acao` sempre como `Botao`
primário (cheio), e nenhum teste contava os botões cheios da aba, então o segundo passou.

## Teste que reproduz

`apps/web/src/areas/professor/AlunosDaTurma.test.tsx`, em "Alunos: a turma, o cache e os pedidos de nome":

- `a aba tem um só botão cheio, o "Convidar alunos" (docs/interface.md, R4): o vazio dos pedidos não leva outro`: com o vazio dos pedidos
  e o acesso à vista, os botões com a face primária (`classesDoBotao()`) são exatamente `['Convidar alunos']`.
- `os pedidos de nome ficam no alto da aba…`, ajustado: o vazio dos pedidos não tem botão nenhum.

Vermelho antes da correção: o caso novo recebia `['Convidar alunos', 'Ver o acesso dos alunos']`, e o caso ajustado achava o botão (2 falhas,
29 passam). Verde depois (31 testes do arquivo).

## Correção

O vazio dos pedidos da aba Alunos deixa de passar `acao`: o texto já manda conferir o acesso dos alunos, que está na seção logo acima,
com o "Convidar alunos" à vista. O `EstadoVazio` e o vazio da coordenação não mudam. O teste do foco de "Ver mais" e o e2e
`pedidos.spec.ts` (que tocava o botão) passam a usar o "Convidar alunos" e a conferir que o vazio não tem botão. O comentário de
`AcessoDaTurma.tsx` que citava o vazio levando o foco ao título foi ajustado.

## Mutações

A ação volta ao vazio dos pedidos.

```mutacao
arquivo: apps/web/src/areas/professor/AlunosDaTurma.tsx
teste: apps/web/src/areas/professor/AlunosDaTurma.test.tsx › a aba tem um só botão cheio
-          descricao: 'Os pedidos aparecem aqui quando os alunos entram pelo link da sala ou pelo código da turma e pedem o nome. Confira se o acesso dos alunos está ativo.',
+          descricao: 'Os pedidos aparecem aqui quando os alunos entram pelo link da sala ou pelo código da turma e pedem o nome. Confira se o acesso dos alunos está ativo.',
+          acao: { rotulo: 'Ver o acesso dos alunos', aoAcionar: () => tituloDoAcesso.current?.focus() },
```

## Recomendações sem aplicar

| Quem | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | O filtro do caso novo só reconhecia o botão cheio de tamanho `principal` | Aplicada: o filtro passou a ser a classe da face (`bg-laranja`), de qualquer tamanho |
| test-engineer (1ª) | A contagem só cobre o vazio: um caso com dois pedidos e o acesso ativo fecharia o resto da aba | `TODO.md`, linha nova (dono: Joaquim). O sintoma desta correção é o vazio; com pedidos entra o botão oficial (grafite), e cobrir a aba inteira é caso novo com fixtures de pedido, que não cabe em poucas linhas |
| test-engineer (1ª) e frontend-reviewer (1ª) | O título do caso do e2e (`pedidos.spec.ts:201`) ainda diz "com o passo para o Acesso", que já não existe | Já registrada aqui, para o `/retro`. Mantido: o portão casa o caso com o do HEAD pelo título, e renomear o caso o fez perder o prazo declarado (`test.setTimeout(240_000)`) e cair nos 30 s. O título se acerta junto de outra mudança que tire o caso da lista do portão, ou ao dividi-lo |
| test-engineer (1ª) | A foto do celular mostra a barra de baixo no meio da página | Recusada: o `frontend-reviewer` conferiu e é artefato da captura de página inteira com barra fixa, não desta correção |
| frontend-reviewer (1ª) | `tituloDoAcesso` do e2e (`pedidos.spec.ts:232`) fica sem uso se as linhas 247 e 262 saírem | Recusada: hoje tem uso, e a recomendação é condicional |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 17:15:14 | 2026-10-19 17:15:33 | `frontend-reviewer` | 1 | APROVADO | ad18b6d83efe0fbf6 |
| 2026-10-19 17:15:10 | 2026-10-19 17:16:07 | `test-engineer` | 1 | APROVADO | a8b2c129bd73a748e |
| 2026-10-19 17:22:50 | 2026-10-19 17:23:24 | `test-engineer` | 2 | APROVADO | aa6738495009b0cff |
