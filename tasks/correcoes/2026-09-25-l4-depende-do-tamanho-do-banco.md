# Correção — o L4 do painel percorre a lista global inteira e fica vermelho com o banco de teste acumulado

**Origem:** portão local das tarefas 6.0 e 7.0 de `apresentacao-painel`, que obrigou a recriar os volumes do compose de
teste (`tasks/prd-apresentacao-painel/achados/5_task.md`, `6_task.md`, `7_task.md`)
**Subagentes obrigatórios:** infra-guardian, tenancy-guardian
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

`apps/api/test/painel-convite.int.test.ts › L4 (tarefa 5.0)` fica vermelho no portão local com `expected 429 to be 200`,
na leitura de uma página de `GET /v1/operacao/escolas`. Na esteira, com o banco novo, passa. Com o banco local
acumulado (3.166 escolas nesta reprodução), o teste pede 128 páginas com a mesma sessão de operador e o 121º pedido do
minuto recebe 429 (`LIMITE_REQ_OPERADOR_MIN` = 120). A saída de emergência das 6.0 e 7.0 foi recriar os volumes de
Postgres, storage e Redis do compose de teste.

## Causa

O teste dependia do tamanho do banco. A lista do painel é de **todas** as escolas (o operador vê todas), e o L4 procurava
as oito escolas dele percorrendo a lista página a página (`todasAsPaginas`). O número de pedidos crescia com as escolas
que o banco local guarda de execuções anteriores, dos e2e e das outras suítes. A auditoria não se apaga, e por isso as
escolas criadas pela `BancadaDeSessoes` também ficam. O limite do operador, que é regra de produção, não mudou.

O mesmo defeito, ainda sem ficar vermelho, estava em
`painel-escrita.int.test.ts › GET /v1/operacao/redes: a rede criada, só com id, nome e tipo, e nunca mais que 200`. O teste
achava a rede dele nas 200 primeiras da ordem por nome, com o prefixo `AAAA`. Só que o e2e deixa no banco redes de nome
`<número> …` (`nomeDeRedeQueVemPrimeiro`), e dígito vem antes de letra: já eram 80 antes de `AAAA`. Com 200, o teste fica
vermelho.

### O que foi conferido e não tem este defeito

- **I4, I5, L1, L2 e L3** (`painel-leitura.int.test.ts`) percorrem a lista inteira, mas sobem a API com
  `LIMITE_REQ_OPERADOR_MIN=100000`, e o L2 chama o service direto, sem limite. Não recebem 429. Com 3.166 escolas, o arquivo
  inteiro levou 31 s e o L3 levou 6,2 s, com o `testTimeout` em 60 s. O L3 exige a varredura: o cenário é "percorridas
  página a página… `total` certo". O custo cresce com o banco, e na ordem por uso cresce mais que linear, porque cada
  página ordena todas as escolas. Hoje não fica vermelho. Fica registrado para a retro, sem correção aqui.
- **`apps/worker/test/uso.int.test.ts`** tem outro defeito. Os contadores no Redis levam o prefixo sorteado de cada teste
  (`teste-<uuid>`) e são apagados no `afterEach`, e por isso sobra de Redis não entra na consolidação do teste. Quem quebra é
  o storage. `MedidorDeStorage.listarEscolas` lista as pastas `escolas/<id>/` do bucket inteiro, e o SeaweedFS do compose
  guarda a pasta vazia depois que os objetos saem. Assim, recriar só o banco deixa pastas de escolas que não existem mais.
  Na primeira delas, `criarConsolidacaoDeUso` grava `uso_infra_diario` com uma escola inexistente, a FK responde 23503 e a
  rotina inteira falha, para todas as escolas. Reproduzido sem recriar volume: uma pasta `escolas/<uuid inexistente>/` no
  bucket deixa 9 dos 12 testes vermelhos com `uso_infra_diario_escola_id_escola_id_fk`. A pasta foi removida depois. O
  teste não depende de estado global: o que ele pega é um defeito de produção. Uma pasta ou um contador órfão (escola
  eliminada, por exemplo) para a consolidação noturna de todas as escolas, e isso contraria "uma escola não degrada outra"
  (regra 80, item 3). O conserto é no processador (pular e registrar a escola inexistente, com métrica), e fica proposto
  como correção própria, fora desta.

## Teste que reproduz

- `apps/api/test/painel-convite.int.test.ts › L4 (tarefa 5.0): a lista mostra o estado e o conviteId da escrita › para cada
  estado da E6, e o convite novo depois de um refazer, pela GET /v1/operacao/escolas`. Vermelho antes, com o banco de teste
  em 3.166 escolas (1.866 acumuladas mais 1.300 sintéticas semeadas só no banco de teste): `expected 429 to be 200`. Verde
  depois, no mesmo banco, sem recriar volume.
- `apps/api/test/painel-escrita.int.test.ts › … › GET /v1/operacao/redes: a rede criada, só com id, nome e tipo, e nunca
  mais que 200`. Vermelho antes, com 210 redes antes de `AAAA` (80 do e2e mais 130 semeadas com nome `8300000000000 …`, como
  o e2e deixa): `expected undefined to strictly equal`. Verde depois.

## Correção

- `painel-de-teste.ts` ganha `nomeQueVemPrimeiro(resto)`, com a regra do `nomeDeRedeQueVemPrimeiro` do e2e: o número do
  começo é `9_999_999_999_999 - Date.now()` e diminui com o relógio. Assim o nome de agora vem antes, na ordem por nome, de
  todos os que as execuções anteriores deixaram, e isso vale no collation `en_US.utf8` do banco, porque dígito vem antes de
  letra.
- O L4 cria as oito escolas com esse nome (`BancadaDeSessoes.escola(nome?)`, com o nome de antes como padrão, e
  `escolaEm(estado, token, nome?)`). Depois lê só `GET /v1/operacao/escolas?pagina=1&ordem=nome`: um pedido, qualquer que
  seja o tamanho do banco. As asserções não mudaram: cada escola aparece uma vez, com o estado da E6, o mesmo estado da
  escrita (`estadoDaCoordenacao` sobre o `ConviteRepository`) e o `conviteId` do último convite, e a escola refeita mostra
  o convite refeito. A paginação, a unicidade entre páginas e o `total` são do L3, que continua percorrendo tudo.
- O teste das redes cria a rede com `nomeQueVemPrimeiro('Rede Sintética')` no lugar do prefixo `AAAA`.

O teste não perdeu força. Com a regra tirada do `PainelRepository`, o L4 novo fica vermelho nos dois casos testados:
- último convite por `expira_em asc`: a escola refeita mostra a origem revogada;
- coordenador ativo sem o `desativado_em is null`: `pendente` aparece como `ativa`.

Nenhuma regra de produção mudou. O limite de 120 pedidos por minuto do operador continua igual.

Lição para a tarefa 8.0 (Uso), que testa outra lista paginada global: o teste acha as escolas dele numa página
determinística, com nome de `nomeQueVemPrimeiro` na ordem por nome, ou com uso maior que o de qualquer outra escola
(`Date.now() * 100`, como o seed do e2e) na ordem por uso. Varrer a lista inteira fica só para o cenário que exige isso, e
com o limite do operador folgado no ambiente da API de teste.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.
| 2026-09-25 07:49:36 | 2026-09-25 07:51:34 | `test-engineer` | 1 | APROVADO | afe20f8ff904ed231 |
| 2026-09-25 07:58:19 | 2026-09-25 07:58:56 | `infra-guardian` | 1 | APROVADO | a077de50f7c89bd39 |
| 2026-09-25 07:58:23 | 2026-09-25 07:59:08 | `tenancy-guardian` | 1 | APROVADO | a6d58298ce26e4a14 |
