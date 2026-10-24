# O processo sem o Maestri

O Maestri guarda só os terminais e quem está ligado a quem (D78). O processo mora no git: `.claude/`, `tools/processo/` e
`tasks/`. Se o Maestri não abre, ou o Joaquim quer rodar uma tarefa fora dele, cada papel roda no seu próprio terminal,
dentro do checkout em que vai trabalhar, e as mensagens do protocolo (`.claude/skills/seguir/protocolo.md`) passam pelo
Joaquim, que copia o texto de um terminal para o outro. O resto não muda: o portão, os revisores e o hook de commit são
os mesmos.

## Os quatro papéis

O papel vem de `.claude/agents/<papel>.md`, com `claude --agent`, nunca de uma "responsabilidade" do Maestri: nela
nenhum hook dispara. Cada terminal começa **na raiz do checkout** (`pwd` igual a `git rev-parse --show-toplevel`):

| Papel | Comando |
|---|---|
| Arquiteto | `claude --dangerously-skip-permissions --agent arquiteto --effort high` |
| Implementador | `claude --dangerously-skip-permissions --agent implementador --model sonnet --effort high` |
| Mesa de revisão | `claude --dangerously-skip-permissions --agent mesa-de-revisao --effort high` |
| Validador | `claude --dangerously-skip-permissions --agent validador --effort high` |

A Mesa e o Implementador de uma tarefa rodam **no mesmo checkout**, cada um no seu terminal: a Mesa fotografa a árvore
que o Implementador deixou. O Orquestrador é a sessão sem `--agent`, no térreo.

## Como as mensagens andam

Sem `maestri ask`, o Joaquim copia a mensagem (as seis linhas do protocolo) do terminal de quem pede para o de quem
responde:

1. O Orquestrador, ou o Joaquim, abre o Implementador com o `PEDIDO de …` da tarefa. O pedido nomeia a Mesa.
2. O Implementador implementa, roda o portão e escreve o `PEDIDO de Implementador` da rodada. O Joaquim o cola na Mesa.
3. A Mesa chama os revisores e responde com `RELATÓRIO` ou `ORDEM DE CORREÇÃO`, que o Joaquim cola de volta.
4. Aprovada por todos, o Implementador faz o commit e o push e escreve o `/seguir RELATÓRIO de Implementador`, que o
   Joaquim cola no Orquestrador.

Mensagem colada no Orquestrador que começa com `/seguir ` é reconhecida pelo hook `.claude/hooks/aviso-de-sessao.sh`, que
manda ler a skill e seguir com ela.

## Quando o hook de commit quebra

O hook do portão (`tools/processo/hook-revisoes.ts`) roda em todo `Bash` de sessão com papel. Se um conserto em
`tools/processo/` o deixa sem carregar, nenhum `Bash` roda, nem o do papel que tentaria consertá-lo. O papel conserta pelo
`Edit`, que não passa pelo hook. Se nem isso basta, o **Joaquim**, no terminal dele (sem papel), traz a versão boa da
`develop`:

```bash
git -C <checkout> checkout origin/develop -- tools/processo .claude/settings.json
```

O que esse comando **perde**: tudo o que ainda não foi commitado em `tools/processo/` e em `.claude/settings.json` daquele
checkout. O que ele **não apaga**: arquivo novo da branch dentro de `tools/processo/` (ele só sobrescreve os que existem na
`origin/develop`); se um deles for o que quebra o hook, apague-o à mão. Depois o Joaquim faz o conserto de verdade e o
commita fora de sessão de papel.
