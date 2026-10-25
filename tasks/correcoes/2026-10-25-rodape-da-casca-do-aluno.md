# Correção — o W12 da casca espera o Rodapé e o "Tutor" do aluno, que a tarefa 2.0 tirou

**Origem:** esteira run 40172232547 (spec em ce8beed)
**Subagentes obrigatórios:** `frontend-reviewer`, `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`, `infra-guardian`
<!-- Quem dita os guardiões é o Orquestrador, no pedido, e a Mesa confere a linha contra os arquivos alterados:
     quem corrige não escolhe quem o audita. test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

A esteira 40172232547 cai em `e2e/casca.spec.ts:733` (W12, aluno), no chromebook e no celular:
`expect(getByRole('navigation', { name: 'Rodapé', exact: true })).toBeVisible()` não encontra o elemento.

## Fora desta correção

nada

## Causa

Da tarefa 2.0 (469a3955). Ela pôs o aluno em Início, Tarefas e Eu: `RODAPE_DA_LATERAL.aluno` ficou vazio (a casca não
desenha a navegação "Rodapé" com a lista vazia) e o primeiro lugar de "Seções" passou de "Tutor" para "Início". A tabela
`PAPEIS_DA_CASCA` do `e2e/casca.spec.ts` continuou dizendo, para o aluno, `navegacoes: ['Seções', 'Rodapé']` e
`primeiro: 'Tutor'`. A tarefa atualizou `areas.spec.ts` e outros specs do aluno, mas não essa tabela, e o spec não entrou
no portão (ele não cita nenhum texto que a tarefa removeu da web).

## Teste que reproduz

O próprio caso `e2e/casca.spec.ts › casca da escola: os três papéis (RF15 a RF17) › W12: aluno …`, que já é o teste do
contrato: vermelho antes (a tabela pedia o que a tela não tem mais), verde depois de a tabela dizer o que a D73 e a 2.0
decidem. O código da web está certo e não muda.

## Correção

Só `e2e/casca.spec.ts`: a linha do aluno em `PAPEIS_DA_CASCA` passa a `navegacoes: ['Seções']`, `ausentes: ['Seu time', 'Rodapé', 'Sua conta']`
e `primeiro: 'Início'`, que é o que `NAVEGACAO.aluno` e `RODAPE_DA_LATERAL.aluno` (vazio) dizem desde a 2.0. O código da web não muda.
Pôr "Rodapé" em `ausentes` faz o caso provar também que a casca não desenha um rodapé vazio para o aluno.

Antes: `npx playwright test` do spec inteiro, 2 falhas (W12 do aluno, em `chromebook` e `celular`), 46 passaram, a mesma da esteira.
Depois: o W12 do aluno passa nos dois projetos (9,9 s e 10,5 s).

**Sem mutação:** a correção só altera `e2e/casca.spec.ts` e este documento, nenhum arquivo de `apps/*/src` nem de `packages/*/src`.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 05:54:31 | 2026-10-25 05:54:47 | `frontend-reviewer` | 1 | APROVADO | aa3d4118bb9b3b896 |
| 2026-10-25 05:54:37 | 2026-10-25 05:54:51 | `tenancy-guardian` | 1 | APROVADO | ae96b62074310354f |
| 2026-10-25 05:54:45 | 2026-10-25 05:54:57 | `infra-guardian` | 1 | APROVADO | a6a4429add9f23177 |
| 2026-10-25 05:54:40 | 2026-10-25 05:55:00 | `privacy-guardian` | 1 | APROVADO | af7e7bc529ea84443 |
| 2026-10-25 05:54:43 | 2026-10-25 05:55:07 | `conformidade-reviewer` | 1 | APROVADO | a437c520cb5cef39e |
| 2026-10-25 05:54:34 | 2026-10-25 05:55:27 | `test-engineer` | 1 | APROVADO | a5aaef9fca05648a3 |
