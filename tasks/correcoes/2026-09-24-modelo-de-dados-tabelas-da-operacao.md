# Correção — o modelo de dados declarava fechada uma lista de exceções ao escolaId sem as seis tabelas da operação

**Origem:** validacao.md de apresentacao-operacao (achado maior, rodada de 24/09/2026)
**Subagentes obrigatórios:** tenancy-guardian (a lista de exceções à regra 10, item 1)
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

`docs/modelo-de-dados.md`, "Regras transversais", item 1, dizia que as exceções ao `escolaId` são
"curtas e fixas" e listava só a tabela pública sem dono e a identidade de login (`Conta`,
`CodigoRecuperacao`). A migration `0014_operador.sql` criou seis tabelas sem `escola_id`
(`operador`, `codigo_recuperacao_operador`, `convite_operador`, `sessao_operador`,
`acesso_operacao`, `auditoria_operacao`), e o documento não as desenhava em lugar nenhum. O
desenho do isolamento contradizia o código.

## Causa

A Tech Spec da A0 declarou o desvio (seção 3 e seção 11) e o teste C45 cerca o acesso às seis
tabelas, mas nenhuma tarefa da A0 levou o desvio ao documento de modelo de dados, e nada conferia
o documento contra as migrations: a lista de exceções era texto solto, que só uma leitura humana
pegaria. A mesma lacuna escondia outra omissão antiga: `Escola` e `Rede`, a raiz do tenant, também
não têm `escola_id` e não estavam nomeadas como exceção.

## Teste que reproduz

`apps/api/test/arquitetura.test.ts › arquitetura: toda tabela sem escola_id está nas exceções do
modelo de dados (regra 10, item 1) › o item 1 das Regras transversais do docs/modelo-de-dados.md
nomeia cada uma`. Lê todas as migrations em ordem, acha as tabelas que terminam sem `escola_id`
(criação, `ADD COLUMN` depois, `DROP TABLE`) e exige que cada uma apareça, pelo nome entre crases
em PascalCase, dentro do item 1. Vermelho antes da correção, com
`escola, rede, acesso_operacao, auditoria_operacao, codigo_recuperacao_operador, convite_operador,
operador, sessao_operador`. Mais dois testes: um que prova que a varredura enxerga as migrations
(acha `conta` e as seis, não acha `usuario`, `turma`, `auditoria` e `job_registro`), e um com
migrations e documento sintéticos, que reprova a tabela sem `escola_id` citada fora do item 1 e
aceita a que ganhou `escola_id` por `ALTER`.

## Correção

- `docs/modelo-de-dados.md`, item 1 das "Regras transversais": as exceções viram lista, com o
  próprio tenant (`Escola`, `Rede`), a tabela pública sem dono, a identidade de login e as seis
  tabelas da operação, e a frase de que a lista é conferida contra as migrations pelo teste de
  arquitetura
- seção nova "Operação Turmma", com o desenho das seis tabelas a partir da seção 3 da Tech Spec da
  A0, o motivo de não terem `escolaId` e a cerca que impede o atalho (C45)
- o teste acima, para a próxima tabela sem `escola_id` não entrar sem passar pelo documento

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-24 10:12:42 | 2026-09-24 10:13:28 | `test-engineer` | 1 | APROVADO | a879d3d7707ad83ce |
| 2026-09-24 10:13:34 | 2026-09-24 10:14:17 | `tenancy-guardian` | 1 | APROVADO | a7d7f8ac4759bdf2d |
