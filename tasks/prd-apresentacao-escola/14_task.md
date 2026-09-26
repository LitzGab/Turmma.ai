# Tarefa 14.0 — Web: Professores e o aceite do convite pelo professor

**Funcionalidade:** apresentacao-escola · **Depende de:** 11.0, 3.0 · **Paralelo com:** 4.0 a 10.0, 13.0, 15.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A coordenação cadastra o professor, copia o link que aparece uma vez, e refaz ou revoga o convite; o professor abre o
link, cria a senha (ou entra com a conta que já tem) e chega à tela "Turmas" para confirmar os vínculos.

## Contexto necessário

- `docs/interface.md` 11.1; `docs/fluxos.md`, fluxo do convite
- `techspec.md` seções 4 (professores; `convites/consultar` e `/aceitar` não mudam), 9 e 13 (conta global)
- `cenarios.md`: W14, W4 (linha "Professores"), W12
- `.claude/rules/50-frontend.md`; regra 20 (item 8)
- `tasks/prd-apresentacao-painel/retro.md`, proposta 4, e `achados/indice.md`, linhas da 7.0 e da 10.0: o link fora do
  cache, o segundo Esc, o `hashchange` com o aceite em andamento
- Código:
  - `apps/web/src/operacao/componentes/DialogoDoConvite.tsx`, `DialogoDaOperacao.tsx`, `ConfirmarConvite.tsx`,
    `apps/web/src/operacao/acoes-do-convite.ts`, e `Escolas.tsx`, que os usa
  - `apps/web/src/componentes/BotaoCopiar.tsx` — a cópia com reserva sem `navigator.clipboard`
  - `apps/web/src/paginas/Convite.tsx` — o aceite do coordenador, com o token no fragmento; o professor usa a mesma
  - `e2e/operacao-convite-coordenacao.spec.ts`, `e2e/convite.spec.ts`

## Subtarefas

- [ ] 14.1 — O diálogo de convite de cópia única sai de `apps/web/src/operacao/` para `apps/web/src/componentes/`,
  sem nada da operação dentro; a operação passa a importar de lá, sem mudar de comportamento. O `nome-dos-chunks`
  continua impedindo a escola de baixar o chunk da operação
- [ ] 14.2 — Tela Professores: cadastrar (nome e e-mail, `autocomplete="off"`), o resumo antes de enviar ("vale 7
  dias", "o link aparece uma vez"), o link com Copiar e "Link copiado" anunciado, fechar sem copiar pergunta; a lista
  com o estado do convite; refazer e revogar com confirmação. A mutation com `gcTime: 0` e `reset()` ao fechar
- [ ] 14.3 — Aceite do professor em `paginas/Convite.tsx`: conta nova cria a senha e vai à entrada; o link refeito,
  vencido ou revogado mostra o convite inválido com "peça outro à coordenação"
- [ ] 14.4 — Linha "Professores" na tabela de navegação; o teto do chunk `coordenacao-*` revisto
- [ ] 14.5 — Testes; o e2e da A0b roda junto

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/DialogoDoConvite.tsx`, `Dialogo.tsx` (saídos de `operacao/componentes/`) | novo |
| `apps/web/src/operacao/paginas/Escolas.tsx`, `operacao/componentes/*` | alterado |
| `apps/web/src/areas/coordenacao/Professores.tsx`, `apps/web/src/api/professores.ts`, `areas/navegacao.ts` | novo, alterado |
| `apps/web/src/paginas/Convite.tsx` | alterado |
| `.size-limit.json`, `e2e/professores.spec.ts`, `e2e/convite.spec.ts` | alterado, novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| W14 | e2e | conta nova cria a senha e vai à entrada; o link refeito mostra o convite inválido com "peça outro à coordenação" |
| W4 (Professores) | e2e | os quatro estados; o vazio "Nenhum professor ainda" com Cadastrar; vazio e erro com a rota interceptada |
| W12 (Professores) | e2e | 360 px sem rolagem, também no diálogo; alvos de 44 px; cadastrar e copiar só com Tab e Enter; Esc cai na pergunta, e o segundo fecha |
| link fora do cache | unidade | fechado o diálogo, nenhuma entrada do `MutationCache` guarda o link |
| clique duplo | e2e | dois cliques em "Cadastrar" mostram um link só, e a lista termina com um convite em aberto |
| A0b | e2e | `e2e/operacao-convite-coordenacao.spec.ts` verde sem mudar asserção |
| recomeço da tela | e2e | segunda pessoa: outra coordenação na mesma aba não vê lista nem diálogo da primeira; mesmo link: colar de novo o mesmo convite na aba não prende a tela com o token na barra; resposta atrasada: o aceite do link anterior que responde depois do `hashchange` não entra; falha com o diálogo aberto: o `CONFLITO` do refazer recarrega a lista, e o aviso e o foco da tentativa anterior saem |
| log novo | — | a tarefa não escreve log |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [ ] `test-engineer` aprovado primeiro; `frontend-reviewer` sozinho, depois `revisor-geral` e os guardiões, com
  rodada que vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Envio do link por e-mail; a alocação (13.0); o confirmar e contestar vínculo, que é a tela "Turmas" (11.0).

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
