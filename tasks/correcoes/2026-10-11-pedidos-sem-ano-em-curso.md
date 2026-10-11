# Correção — sem ano letivo em curso, a lista, o detalhe, a busca e o registro de Pedidos da coordenação respondem 404

**Origem:** `validacao.md` de `lgpd-e-titular` (`tasks/prd-lgpd-e-titular/validacao.md`, seção 4, C1); pedido do Orquestrador em 11/10/2026.
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `frontend-reviewer` não: nenhum arquivo de `apps/web` muda, só o e2e dele. `revisor-geral` não: a correção altera 3 arquivos fora de `tasks/` (o repository, o teste de integração e o spec de e2e), abaixo do limite de 5, e não toca `.github/`, `tools/ci/` nem `tools/processo/`. -->

## Sintoma

Na escola **sem ano letivo em curso**, a coordenação não alcança a aba Pedidos da Privacidade: a lista mostra "Não encontramos o que
você procurou", o detalhe, "Este pedido não está mais disponível nesta escola", a busca com resultado responde 404 e o registro desfaz a
transação depois de gravar. O log da API registra `status 404`, `NAO_ENCONTRADO`. Com o ano em curso, tudo funciona. Fotos da validação:
`.processo/vitrine/sem-ano/sem-ano-em-curso--pedidos--computador.png`, `--celular.png` e `sem-ano-em-curso--detalhe--computador.png`.

O estado é normal: a coordenação encerra o ano (`apps/api/src/estrutura/ano-letivo.service.ts`) e só depois abre o seguinte, e entre um e
outro (dezembro e janeiro) é quando o aluno sai e o responsável pede acesso ou eliminação. Nessa janela a escola não registra pedido, não
vê o prazo de 15 dias e não abre a eliminação agendada para cancelar dentro dos 7 dias.

## Fora desta correção

Nada: nenhuma tarefa em curso (as 20 estão feitas).

Também não entram: o M1 e o M2 da validação (são de documento, do fechamento da spec), os menores m1 a m8, e o `exigirAnoEmCurso` do
`nucleo`, que continua falhando fechado para o resto do sistema (turma e vínculo de verdade não caem num ano qualquer; regra 10, item 2).

## Causa

`TitularesRepository.#vinculosDe` (`apps/api/src/privacidade/titulares.repository.ts`) chamava `exigirAnoEmCurso()`, que lança
`NAO_ENCONTRADO` quando a escola não tem ano em curso (`packages/nucleo/src/contexto/ano-em-curso.ts`). Ele só serve para completar a
linha da pessoa com as turmas e as disciplinas do ano, mas é chamado por `buscar` e por `titularesParaOPedido`, que montam a resposta de
`registrarPedido`, `pedidos` e `pedido`. Um dado de enfeite derrubava a resposta inteira. O `concluir`, o `cancelar` e o `corrigir-nome`
não passam por ele (`#pedidoAlvo` só lê o pedido e a conta), mas a tela só os alcança pelo detalhe, que respondia 404: ficavam
inalcançáveis, e o teste novo os fixa também na escola sem ano.

Falha da tarefa 11.0 (`buscar` e `titularesParaOPedido` nasceram nela) e da 16.0 (a tela que depende deles). Nenhum teste de pedido rodava
com a escola sem ano em curso: a "virada de ano letivo" é caso de borda da regra 40 e não estava coberta.

## Teste que reproduz

- `apps/api/test/pedido-titular.int.test.ts` › `virada de ano letivo: a escola sem ano em curso atende o titular` › `depois de encerrar
  o ano, a busca, o registro, a lista, o detalhe, o corrigir nome, o concluir e o cancelar respondem, só sem turma nem disciplina; e B
  continua sem alcançar A`. Registra um pedido de correção (professor) e uma eliminação agendada (aluno) com o ano em curso, encerra o ano
  **pela API**, e confere a busca, o registro, a lista, o detalhe, o corrigir nome, o concluir e o cancelar. Vermelho antes: a busca
  respondia 404 (`expected 404 to be 200`). Depois do encerramento o caso põe, pelo banco, um vínculo ainda `confirmado` da turma 2ºC no
  ano encerrado (professor e aluno), e confere `turmas: []` e `disciplinas: []`: é o que prova que, sem ano em curso, a leitura **não**
  cai num ano qualquer. **Mutação vista vermelha nesta árvore:** sem a guarda `typeof anoLetivoId !== 'string'` e sem o filtro do ano
  quando não há ano, a busca devolve a turma e a disciplina do ano encerrado e o caso falha (`toMatchObject`); antes de pôr o vínculo
  `confirmado`, a mutação passava, porque o encerrar leva todos a `encerrado`, que o `ne(estado, 'encerrado')` já exclui. Ao fim, a
  escola B (com o ano dela em curso) continua sem alcançar o pedido de A, e A, o de B.
  Confere também a auditoria dos passos (`pedido.registrado`, `pedido.nome_corrigido`, `pedido.concluido`, `pedido.cancelado`) e que a
  busca de A não acha a pessoa de B (**mutação vista vermelha e desfeita:** sem `eq(usuario.escolaId, escolaId)` no `buscar`, o caso
  falha nessa linha).
- `e2e/pedidos-do-titular.spec.ts` › `Pedidos: a escola entre dois anos letivos` › `sem ano em curso (…), a lista, a busca, o registro e
  o detalhe funcionam, só sem a turma`. Contra a API real, nos projetos `chromebook` e `celular`, com `criarEquipeComSenha('coordenador',
  { semAnoLetivo: true })`. Vermelho antes, nos dois projetos: a aba mostrava `alert: Não encontramos o que você procurou…` e o botão
  "Registrar pedido" não aparecia (`entrarNosPedidos` esgotou os 20 s). Verde depois, com o spec inteiro (24 testes, 2 projetos) e o caso
  novo repetido 3 vezes com 2 trabalhadores (6 de 6), que é a máquina da esteira.

## Correção

`apps/api/src/privacidade/titulares.repository.ts` › `#vinculosDe`: lê o ano do contexto sem exigi-lo (`contextoAtual()?.anoLetivoId`) e,
**sem ano em curso, devolve o mapa vazio**: a virada já encerrou os vínculos, e turma e disciplina só completam a linha. A escola continua
vindo de `exigirEscolaDoContexto()`, antes de tudo, então a chamada sem sessão falha como antes. O escopo não afrouxa: com ano, a consulta é
a mesma (escola e ano do contexto); sem ano, **não há consulta**, e nunca cai num ano qualquer.

Não muda: o service, o contrato (`turmas: []` e `disciplinas: []` já eram válidos: o aluno sem turma, o professor sem vínculo), a tela
(`textoDasTurmas([])` já diz que a pessoa não tem turma neste ano) nem o `exigirAnoEmCurso`.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | Caso da escola com o ano seguinte `planejado` e nenhum `em_curso` (o estado comum de janeiro) | Recusada: o contexto só lê o ano `em_curso` (`packages/nucleo/src/identidade/sessao.repository.ts:62`, left join), então o ramo é o mesmo que o caso já exercita; o revisor registrou que é cobertura extra, não regra sem teste |
| test-engineer (1ª) | O e2e não confere o detalhe do pedido registrado antes do encerramento | Recusada: a integração abre, depois do encerramento do ano, o detalhe do pedido registrado antes dele (`idDaEliminacao`), e o e2e abre o detalhe do pedido novo |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-11 01:46:03 | 2026-10-11 01:48:31 | `test-engineer` | 1 | APROVADO | aa22d4e72dae7ef46 |
| 2026-10-11 01:48:38 | 2026-10-11 01:49:25 | `tenancy-guardian` | 1 | APROVADO | a127564b732122ded |
| 2026-10-11 01:48:39 | 2026-10-11 01:49:46 | `privacy-guardian` | 1 | APROVADO | a2a1bdc3e17343c27 |
| 2026-10-11 01:55:57 | 2026-10-11 01:57:22 | `test-engineer` | 2 | APROVADO | a484e81311bd4620e |
