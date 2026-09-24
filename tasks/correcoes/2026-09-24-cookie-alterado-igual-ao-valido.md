# Correção — o cookie "alterado" do teste do login externo às vezes sai igual ao válido, e a professora entra

**Origem:** esteira run 36024251576 (commit `a54abb7`, que só mexia em documentos); teste intermitente
**Subagentes obrigatórios:** nenhum guardião (só código de teste, sem código de produção)
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

`apps/api/test/sessao-externa.int.test.ts › cookie: sem ele, alterado, de outra chave, vencido ou de
outro início, o retorno é falha do provedor e ninguém entra` esperava `'/?falha=provedor'` e recebeu
`'/'` para o cookie `educa_oidc=…uAq`. Rodado de novo, passou.

## Causa

Defeito do teste, não do servidor. A linha que montava o cookie "alterado" escolhia a letra nova pelo
**último** caractere (`valor.endsWith('A') ? 'B' : 'A'`), mas a punha no lugar do **penúltimo**. Quando o
penúltimo já era a letra escolhida, o "alterado" saía idêntico ao válido: penúltimo `A` com último
diferente de `A` (o `…uAq` da esteira), ou penúltimo `B` com último `A`. O retorno recebia então o cookie
verdadeiro, a professora entrava e a resposta era `302 /`. Com o cookie cifrado em base64url, cada caso
tem chance de 1/64 × 63/64 e 1/64 × 1/64, perto de 1 em 64 execuções.

O penúltimo continua sendo o caractere trocado, de propósito: em base64url, o último pode carregar bits
de preenchimento, e trocá-lo pode não mudar byte nenhum; o penúltimo sempre carrega 6 bits de dado.

## Teste que reproduz

`apps/api/test/texto-adulterado.test.ts › adulterarPenultimo › muda só o penúltimo caractere de %s, e o
resultado é outro valor`, com valores que terminam em `Aq` (o da esteira), `AA`, `BA`, `Bq`, `qB`, `__`
e `--`. Vermelho antes, com a expressão antiga extraída sem mudança para `adulterarPenultimo`: falham
`xyzuAq` e `xyzuBA` (`expected 'xyzuAq' not to be 'xyzuAq'`), os dois formatos do defeito. Verde depois.

Por que a função pura e o teste de unidade, e não só a asserção no teste de integração: o cookie da
integração vem de uma cifra com IV aleatório, então fixar um valor que termina em `Aq` ali exigiria
forjar o cookie e deixaria de testar o que o `iniciar` de fato emite. A função pura recebe o valor
exato da falha e fica vermelha de forma determinística, em milissegundos. No teste de integração ficou
também `expect(alterado).not.toBe(valor)`, para que, se a troca voltar a falhar, a mensagem aponte o
teste e não o servidor.

## Correção

`adulterarPenultimo` (`apps/api/test/texto-adulterado.ts`) escolhe a letra nova pelo próprio penúltimo
(`valor.at(-2) === 'A' ? 'B' : 'A'`), de modo que ela nunca é igual à que sai. O teste de integração
passa a usar a função. Nenhum código de produção mudou.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-24 14:59:10 | 2026-09-24 15:00:13 | `test-engineer` | 1 | APROVADO | ab1f574dfec42016b |
