# Correção — O roteiro da demonstração descreve o produto de antes da X4

**Origem:** validacao.md de telas-do-aluno-e-primeiro-acesso (rodada 3, §4 MA1)
**Subagentes obrigatórios:** `revisor-geral`, `frontend-reviewer`

## Sintoma

`docs/roteiro-da-demonstracao.md` diz, na `:7`, que "o mesmo roteiro roda sozinho" em `e2e/roteiro-da-demonstracao.spec.ts`, mas o texto
não acompanhou o spec depois da X4:

- `:147` (2.12): o aluno "cai em **Atividades**, vazia". Hoje ele passa pela introdução de quatro passos e cai no Início.
- 2.2, 2.8 e o passo 4: a coordenadora e a professora também passam cada uma pela introdução na primeira entrada, e o roteiro não fala dela (`grep -c introdu` dá 0).
- `:193` e `:219`: "**Atividades**", mas o item da navegação do aluno se chama **Tarefas**.
- `:196-198`: depois de enviar, "Aparece: Quem dá a aula ainda vai revisar a correção". Antes disso aparece a comemoração "Atividade entregue. Quem dá a aula vê a correção antes de você."

## Fora desta correção

nada

## Causa

As tarefas 2.0, 4.0, 9.0, 10.0 e 11.0 da X4 atualizaram o `e2e/roteiro-da-demonstracao.spec.ts` (`:186`, `:282`, `:336`, `:445`, `:571`) e o critério de
pronto da funcionalidade listava seis documentos, entre os quais não estava o roteiro. Ninguém conferiu o texto contra o spec.

## Teste que reproduz

Não se aplica: a correção é só texto de `docs/`, sem código. A evidência que substitui o vermelho é a conferência do texto novo, linha a linha, contra o
`e2e/roteiro-da-demonstracao.spec.ts` e contra `e2e/__fixtures__/casca.ts` (as falas e o botão "Continuar" das três introduções) e
`apps/web/src/areas/aluno/atividade.ts` (`FALA_DA_ENTREGA`), e `grep -c introdu docs/roteiro-da-demonstracao.md` deixando de dar 0.

## Correção

Só `docs/roteiro-da-demonstracao.md`:

- 2.2: depois de **Entrar**, a coordenação passa pela introdução (**Continuar** nos quatro passos, ou **Pular**) e cai no Painel; **IA** mostra a Governança vazia.
- 2.8: a professora, depois de entrar, passa pela introdução (**Continuar** ou **Pular**) antes de **Turmas**.
- 2.12: o aluno cai na introdução de quatro passos (**Continuar** nos quatro: os três primeiros não se pulam) e depois no Início.
- `:193` e `:219`: **Atividades** passa a **Tarefas**, a lista "Para fazer".
- 5.3: a comemoração "Atividade entregue." vem antes da espera pela correção.

**Sem mutação:** a correção muda só texto de `docs/roteiro-da-demonstracao.md`; não acrescenta cláusula de código nem de teste.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª), rec. 3 | O 2.3, o 2.5 e o 2.7 mandam a coordenação em **Estrutura**, mas o spec vai por **Turmas** (`spec.ts:191` e `:225`); o "Alocação" do 2.7 virou "Acrescentar turma" no painel do professor (`spec.ts:254-259`) | Destino: correção própria do roteiro, a pedir ao Orquestrador. São diferenças de antes da X4, fora do MA1, e pedem conferir cada passo contra o spec: não cabe em poucas linhas. (O trecho do 9.1 desta recomendação entra no item 1.) |
| frontend-reviewer (1ª) | No passo 2.12, dizer que o aluno cai no **Início** sem a lista "Para fazer" ainda cheia | Recusada: o próprio revisor a classifica como "detalhe de leitura, não de erro" |
| frontend-reviewer (1ª) | Incluir `docs/roteiro-da-demonstracao.md` no critério de pronto das próximas specs que mexem em tela | Destino: retrospectiva da X4 (Arquiteto), que é quem muda template e critério de pronto |
| test-engineer (1ª), rec. 2 | O "passo 4" do Sintoma não tem item na seção "Correção"; dizer a que se refere | Recusada: o Sintoma registra a origem (MA1 da validação) e o revisor aprovou; o roteiro corrigido cobre os três lugares que o diff toca |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-26 10:17:16 | 2026-10-26 10:17:44 | `frontend-reviewer` | 1 | APROVADO | a5b9d274802ff0646 |
| 2026-10-26 10:17:18 | 2026-10-26 10:18:06 | `test-engineer` | 1 | APROVADO | a2360e1da4e31266c |
| 2026-10-26 10:17:15 | 2026-10-26 10:18:15 | `revisor-geral` | 1 | APROVADO | a5a69354d3b5551ef |
