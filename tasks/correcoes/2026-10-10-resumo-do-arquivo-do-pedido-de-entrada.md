# Correção — o resumo do arquivo do titular diz que o aluno "fez" todo pedido de entrada na turma que a consulta traz

**Origem:** diagnóstico do Arquiteto da 18.0 (`.processo/ordens/diagnostico-18.md`), registrado em `TODO.md` (F3, 13.0) para `/corrigir` antes da validação do F3; pedido do Orquestrador em 10/10/2026.
**Subagentes obrigatórios:** `privacy-guardian`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. A correção altera 2 arquivos fora de `tasks/` (a leitura do titular e o teste dela) e não toca `.github/`, `tools/ci/` nem `tools/processo/`: abaixo do limite do passo 5, sem `revisor-geral`. -->

## Sintoma

O arquivo que o titular baixa abre com um resumo, uma linha por tabela, e a linha da `reivindicacao` diz:

> Os pedidos de entrada na turma que você fez ou decidiu

(`packages/nucleo/src/titular/leitura-do-titular.ts`, `LEITURAS_DO_ARQUIVO.reivindicacao.descricao`). Para o **aluno** a frase afirma uma
autoria que a consulta não garante: ela traz todo pedido ligado à linha dele na lista (`lista_nome.usuario_id = titular`), inclusive o
pedido recusado antes naquele nome, que pode ter sido de outra pessoa. A recusa devolve o nome a `livre` e o pedido continua apontando
para a mesma linha (`devolverNome` e `fechar`, `apps/api/src/sala/decisao.repository.ts`: o `lista_nome_id` não é anulado). Quando outra
pessoa pede o nome primeiro, é recusada, e o dono o reivindica e é aprovado, o dono lê "2 registros" de pedidos "que você fez", e fez um.

A tela "Meus dados" (18.0) já diz a verdade: "Os pedidos de entrada na turma feitos com o seu nome ou decididos por você"
(`apps/web/src/componentes/meus-dados/regras.ts`, `reivindicacao_decidida`). O arquivo, que a mesma pessoa baixa, ficou com o texto de
antes. O comentário da consulta do aluno ("o pedido que o aprovou") tem o mesmo desalinhamento: descreve um pedido só.

## Fora desta correção

Nada: nenhuma tarefa em curso (as 20 estão feitas). O `tasks/prd-lgpd-e-titular/estado.md` alterado na árvore é do Orquestrador e entra
no commit desta correção, a pedido dele.

Também não entram:

- um rótulo por papel (o aluno nunca decide um pedido, e "…ou decididos por você" só vale para o professor: sugestão do
  `frontend-reviewer`, 3ª rodada da 18.0). O texto com os dois caminhos é verdadeiro para os dois papéis (conferência do Arquiteto,
  tabela "Já conferido" do `diagnostico-18.md`), e um texto por papel pede que a `descricao` receba o papel, mudando a forma de
  `LeituraDaTabela`, que é da 13.0 e é desenho, não texto;
- o `ROTULO_DA_CATEGORIA_PARA_O_TITULAR` e o resto do resumo da tela: já corrigidos na 18.0.

## Causa

A `descricao` da 13.0 foi escrita pelo nome da tabela ("reivindicação": o que a pessoa **pediu**), e não pela cláusula com que a
consulta liga a linha ao titular. A consulta do aluno liga por `lista_nome.usuario_id`, e é o nome na lista que é dele, não o pedido: o
pedido recusado antes naquele nome entra de propósito (o nome volta a `livre` e o pedido continua nele), e não identifica outra pessoa,
porque a linha só leva `estado`, datas e `decidida_como`; `decidida_por`, `chave_envio`, `senha_hash` e `teve_matricula_errada` estão na
lista `fora`. A 18.0 corrigiu o rótulo da tela e deixou o do arquivo para esta correção (diagnóstico do Arquiteto, 18.0).

## Teste que reproduz

`packages/nucleo/src/titular/leitura-do-titular.test.ts` › `LEITURAS_DO_ARQUIVO: a forma das leituras` › `o resumo do pedido de entrada na turma
diz os dois caminhos, o nome da pessoa na lista e a decisão dela, e não que ela fez o pedido`. Fixa o texto exato da `descricao` e que ela
não afirma autoria ("que você fez"). Vermelho antes: `'Os pedidos de entrada na turma que você fez ou decidiu'`.

## Correção

1. `packages/nucleo/src/titular/leitura-do-titular.ts` › `LEITURAS_DO_ARQUIVO.reivindicacao.descricao`: de "Os pedidos de entrada na
   turma que você fez ou decidiu" para "Os pedidos de entrada na turma feitos com o seu nome ou decididos por você", o mesmo texto da
   tela (`reivindicacao_decidida`). É verdadeiro nos três casos: o aluno aprovado, o aluno cujo nome teve um pedido recusado antes, e
   o professor que decidiu.
2. O comentário da consulta do aluno, no mesmo arquivo: deixou de dizer "o pedido que o aprovou" e diz a cláusula (todo pedido ligado
   à linha dele na lista), que o recusado antes naquele nome entra de propósito, e que não identifica outra pessoa (a linha leva `id`,
   `ano_letivo_id`, `turma_id`, `lista_nome_id`, o estado, as datas e `decidida_como`; `decidida_por`, `chave_envio`, `senha_hash` e
   `teve_matricula_errada` estão na `fora`, como a ordem da 1ª rodada pediu).
3. `packages/nucleo/src/titular/leitura-do-titular.test.ts`: o caso novo, que fixa o texto e que ele não diz "que você fez".
4. `TODO.md`: o item "(F3, 13.0)" marcado como resolvido, com o rótulo por papel dito como não aplicado e o porquê.

Só texto de resumo e comentário: a consulta, as colunas e o escopo não mudam, e nenhum teste de integração, de e2e ou de infra lê essa
`descricao` (conferido por busca do texto antigo em `apps/`, `packages/`, `e2e/`, `infra/` e `docs/`).

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | O mesmo texto da `descricao` vive em `leitura-do-titular.ts` e em `apps/web/src/componentes/meus-dados/regras.ts`; cada um tem seu teste, e nada confere que os dois são iguais (privacy-guardian (1ª) apontou o mesmo) | `TODO.md`, junto da decisão de desenho da forma de `LeituraDaTabela` (13.0): fonte única em `packages/shared` ou teste que confronte os dois. Mexe em dois pacotes e em contrato, não é barata |
| test-engineer (1ª) | Conferir se existe teste de integração em que o aluno aprovado depois de uma recusa no mesmo nome recebe os dois pedidos, sem `decidida_por` nem `teve_matricula_errada`. O seed de `apps/api/test/pedido-titular.int.test.ts` só tem o pedido aprovado | `TODO.md`, como cobertura extra para a validação do F3. Teste de integração novo, em arquivo que a correção não toca: não é barata |
| privacy-guardian (1ª) | O comentário em `apps/api/test/pedido-titular.int.test.ts:231` ainda diz "o pedido que o aprovou" | `/retro` ou a próxima tarefa que tocar esse arquivo. Mexer nele caduca o `test-engineer` e roda a integração à toa, para trocar uma palavra |
| test-engineer (1ª) | O `not.toMatch(/que você fez/)` é redundante com o `toBe` | Recusada: o `toBe` já protege, e o `not.toMatch` documenta a intenção do teste, como o próprio revisor observou |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-10 22:43:03 | 2026-10-10 22:43:34 | `test-engineer` | 1 | APROVADO | a6dee48d6bd9ba3b1 |
| 2026-10-10 22:43:40 | 2026-10-10 22:44:04 | `privacy-guardian` | 1 | APROVADO | af1882771b9bb2b63 |
