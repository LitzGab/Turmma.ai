# Tarefa [N.0] — [título]

**Funcionalidade:** [nome] · **Depende de:** [N.0 ou nenhuma]
**Subagentes obrigatórios:** `...`

## Objetivo

O que esta tarefa entrega, em uma frase. Ao terminar, o que passa a funcionar que antes
não funcionava.

## Contexto necessário

Quem implementa esta tarefa começa com contexto limpo e não participou de nenhuma conversa.
Liste tudo que ele precisa ler antes de escrever a primeira linha:

- `docs/visao-produto.md` (sempre)
- `techspec.md` seção [n]
- `.claude/rules/[quais e por quê]`
- Fluxo relacionado em `docs/fluxos.md`, se houver
- Código existente relevante: `caminho/arquivo.ts` — e o que olhar nele

## Subtarefas

- [ ] N.1 —
- [ ] N.2 —
- [ ] N.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz | integração | |
| borda: [caso do domínio] | integração | |
| permissão: quem não pode | integração | |
| isolamento entre escolas | integração | |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [ ] Vetos aprovados (se aplicáveis)
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

O que pertence a outra tarefa e não deve ser implementado aqui.
