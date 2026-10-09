# Tarefa 16.0 — A coordenação registra um pedido pela tela

**Funcionalidade:** lgpd-e-titular · **Depende de:** 6.0, 11.0 · **Paralelo com:** 15.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A aba Pedidos lista os pedidos e registra um novo: busca por envio, prévia, confirmação com aviso de homônimo e família `perigo` na eliminação.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seção 9 ("Pedidos")
- `.claude/rules/50-frontend.md`
- Código: diálogos da A1, `rl:busca-titular`
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [ ] 16.1 — Lista com nome e turma, "Titular eliminado"
- [ ] 16.2 — Busca por Enter ou botão, `aria-live`, 429 e mínimo de 3 letras
- [ ] 16.3 — Diálogo de registro com prévia; `chaveEnvio` por diálogo
- [ ] 16.4 — Aviso do aluno da lista
- [ ] 16.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| aba Pedidos e diálogo de registro | novo |
| consultas | novo |
| e2e | novo |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| homônimos | e2e | escolhe o certo pela turma; o diálogo avisa; eliminação em `perigo` |
| busca | e2e | `aria-live`; 429 com texto; mínimo de 3 letras no campo |
| aviso da lista | e2e | aponta para a lista da turma |
| recomeço | e2e | rede cai no `POST` e o reenvio leva a mesma chave; segunda pessoa na aba; resposta atrasada segurada |
| estados | e2e | quatro estados; lista abaixo de 768 px; `chromebook` e `celular`, acessibilidade |

## Como testar

- **estados e lista abaixo de 768 px:** `e2e/governanca.spec.ts › os quatro estados…`; a tabela que vira lista já é provada em `e2e/privacidade.spec.ts` (`linhaDa`: `tr` no chromebook, `li` no celular).
- **homônimos e diálogo:** `e2e/pedidos.spec.ts › o 41º pedido não é marcável…` (dois cliques mandam um pedido só) e `› sem rolagem horizontal, também no diálogo…`.
- **busca:** o 429 com texto em `e2e/casca.spec.ts › erro: a mensagem vem do catálogo pelo código…` (a função local `falharCom`).
- **recomeço:** a mesma chave em `e2e/turma-publica.spec.ts › o 503 reenvia a mesma chave até 3 vezes…` (`postDataJSON`); a rede cai com `rota.abort('internetdisconnected')`, nunca `context.setOffline` (`e2e/entrar.spec.ts`); segunda pessoa e resposta atrasada em `e2e/pedidos.spec.ts › resposta atrasada: a atualização que chega depois da decisão…`.
- Titulares: `criarAlunoComMatricula` e `colocarAlunoNaTurma` (`e2e/__fixtures__/sessao.ts`).
- Rodar: `node tools/ci/e2e.ts --manter-ambiente e2e/<arquivo>.spec.ts`.

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --e2e)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O detalhe do pedido (17.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
