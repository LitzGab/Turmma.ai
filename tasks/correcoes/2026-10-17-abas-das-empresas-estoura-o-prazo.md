# Correção — o e2e das duas abas das empresas estoura os 30 s do teste inteiro no celular

**Origem:** esteira run 38994595783, sobre `8d43fe7` (`gh run view 38994595783 --log-failed`); pedido do Orquestrador em 17/10/2026. Segue a `2026-10-16-aba-das-empresas-depois-de-recarregar`.
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- O `frontend-reviewer` veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção mexe em um arquivo de teste fora de `tasks/`, abaixo do limite de 5 e fora de `.github/`, `tools/ci/` e `tools/processo/`. -->

## Sintoma

`e2e/privacidade.spec.ts:295` (`as duas abas se alternam pelo clique ou toque, e o endereço guarda a aba`) cai no projeto `celular`
da esteira, nas duas tentativas (30,5 s a primeira):

```
Test timeout of 30000ms exceeded.
```

Não é uma asserção que esgotou o seu prazo (`Expected`/`Timeout: …ms`): é o prazo do **teste inteiro**.

## Fora desta correção

Nada: nenhuma tarefa em curso na árvore (`git status` limpo). O outro vermelho da mesma esteira (`casca.spec.ts:673`, W12) é o que a correção `2026-10-16-casca-procura-governanca` já fechou (`7ad1e07`), que a esteira ainda não via em `8d43fe7`.

## Causa

O teste faz, em fila: `abrirAsEmpresas` (entrada com a senha e a abertura da aba), a espera da lista, o `page.reload()` (que abre o aplicativo
inteiro de novo), três esperas da tela e a ida a "Prazos de guarda". No `celular` (CPU ×4 e Fast 3G), cada carga de página leva
de 5 a 15 s; as asserções ganharam `PRAZO_DA_ENTRADA_MS` (20 s) na correção anterior, mas **o teste inteiro continuou com os 30 s
padrão do Playwright**, e a soma das cargas passa disso: o caso vizinho de uma carga só leva 22 s, e este leva duas cargas mais a
troca de aba.

É o mesmo limite que os dois testes do arquivo que carregam mais de uma vez já declaram com `test.setTimeout(90_000)` (linhas 145 e 316). Este é o
único do arquivo com duas cargas e sem isso.

## Teste que reproduz

`e2e/privacidade.spec.ts › as duas abas se alternam pelo clique ou toque, e o endereço guarda a aba` já é o teste e já estava vermelho
antes da correção: na esteira, nos dois ciclos. A causa é o relógio do teste, e a prova do verde é a repetição:

- **Vermelho antes:** a esteira 38994595783 (`celular`, 2 de 2 tentativas, `Test timeout of 30000ms exceeded`).
- **Verde depois (17/10/2026):** o caso com `--repeat-each 4 --workers 2` nos dois projetos, 8 de 8, duas vezes seguidas (16 de 16); só no
  `chromebook`, 4 de 4 e 2 de 2; e dentro da suíte inteira (1028 casos, 6 trabalhadores), verde nos dois projetos, em 25,8 s e 28,8 s: com
  carga a duração chega perto dos 30 s antigos, e é por isso que o prazo era curto demais.
- **Uma execução à parte falhou:** logo depois da suíte inteira, o mesmo comando (8 casos) teve 2 do `chromebook` caindo aos 90 s, e não se
  repetiu em 22 execuções seguintes. Não foi possível ler o erro daquela execução. Fica dito aqui, e a esteira dirá se persiste.

## Correção

`e2e/privacidade.spec.ts`: o teste ganha `test.setTimeout(90_000)`, com a razão em um comentário, como os outros dois do arquivo. Nenhum
código de produto muda e nenhuma asserção muda: o que o teste afirma é o mesmo, só tem o tempo que as duas cargas levam.

## Mutações

Nenhuma: a correção não acrescenta cláusula de código, só o prazo de um teste de e2e.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª), test-engineer (1ª) | Se a execução em que 2 casos do `chromebook` caíram aos 90 s reaparecer na esteira, abrir `/corrigir` e ler o trace antes de subir prazo | Condicional, sem código agora: já está dito na seção "Teste que reproduz" do documento; se a esteira repetir, nasce a correção própria |
| test-engineer (1ª) | Prazo por `describe` ou constante nomeada no lugar do terceiro `test.setTimeout(90_000)` | Não aplicar: tocaria os três testes (linhas 145, 318 e este) com comentários de causa diferentes (duas cargas, quatro cargas) e caducaria a rodada dos dois revisores por refator sem ganho de comportamento. Destino: `TODO.md`, junto de uma passada de limpeza do `e2e/privacidade.spec.ts` |
| frontend-reviewer (1ª) | Guardar a duração medida (25,8 s e 28,8 s na suíte inteira) como referência de regressão de carga | Recusada: a duração já está registrada no documento da correção; um orçamento de carga no e2e é decisão de processo, fora do escopo de uma correção de prazo |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-17 01:26:01 | 2026-10-17 01:26:17 | `frontend-reviewer` | 1 | APROVADO | af098748ccc8db4ca |
| 2026-10-17 01:25:58 | 2026-10-17 01:26:25 | `test-engineer` | 1 | APROVADO | ac5d0c68b0fd80b73 |
