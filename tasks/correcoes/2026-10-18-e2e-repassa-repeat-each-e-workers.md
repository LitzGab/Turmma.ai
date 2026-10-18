# Correção — `tools/ci/e2e.ts` não repassa `--repeat-each` nem `--workers` ao Playwright

**Origem:** `tasks/prd-pele-e-casca/retro.md`, M3 (`TODO.md`, "(X1, retrospectiva) Código de processo", letra (c), primeira frase).
**Subagentes obrigatórios:** `infra-guardian`, `revisor-geral`
<!-- Os dois vieram no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção toca `tools/ci/`. -->

## Sintoma

`node tools/ci/e2e.ts --manter-ambiente e2e/x.spec.ts --repeat-each=10 --workers=1` roda o arquivo uma vez, com os trabalhadores
do `playwright.config.ts`: as duas opções somem no caminho, porque `opcoesDoPlaywright` só deixa passar `--grep` e `--project`.
A prova de estabilidade que o `corrigir` e o `executar-task` pedem (o teste rodado várias vezes, com poucos trabalhadores) não
alcança o ambiente que o `e2e.ts` sobe.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa. As outras duas frases da letra (c) (`linhas.ts
conferir` e `mutacoes.ts` com o projeto que o caso declara) e as letras (a), (b), (d) e (e) são correções seguintes.

## Causa

`opcoesDoPlaywright` (`tools/ci/prazo-do-e2e.ts`) é uma lista fechada, `/^--(grep|project)=./`. Qualquer outra opção com `-` não
é arquivo (`arquivosDosArgumentos`) nem opção repassada: é descartada sem aviso.

## Teste que reproduz

`tools/ci/prazo-do-e2e.test.ts › as etapas que o ci:e2e roda levam a fatia ao Playwright, e a dos testes avisa o prazo; as outras não avisam` (o caso que já cobre `--grep` e `--project`),
com `--repeat-each=<n>` e `--workers=<n>` na linha de comando: as duas opções têm de chegar à etapa dos testes, antes dos
arquivos, e `--headed`, que continua sem passar, segue de fora.

Vermelho antes: a etapa dos testes saía sem `--repeat-each=10` nem `--workers=1`.

## Correção

`opcoesDoPlaywright` passa também `--repeat-each=<valor>` e `--workers=<valor>`, sempre com `=` (o valor solto seria lido como
arquivo, como já era com `--grep`). `TODO.md`: a primeira frase da letra (c) marcada como feita.

## Mutações

```mutacao
arquivo: tools/ci/prazo-do-e2e.ts
teste: tools/ci/prazo-do-e2e.test.ts › as etapas que o ci:e2e roda levam a fatia ao Playwright, e a dos testes avisa o prazo; as outras não avisam
-  return argumentos.filter((argumento) => /^--(grep|project|repeat-each|workers)=./.test(argumento))
+  return argumentos.filter((argumento) => /^--(grep|project|workers)=./.test(argumento))
```

```mutacao
arquivo: tools/ci/prazo-do-e2e.ts
teste: tools/ci/prazo-do-e2e.test.ts › as etapas que o ci:e2e roda levam a fatia ao Playwright, e a dos testes avisa o prazo; as outras não avisam
-  return argumentos.filter((argumento) => /^--(grep|project|repeat-each|workers)=./.test(argumento))
+  return argumentos.filter((argumento) => /^--(grep|project|repeat-each)=./.test(argumento))
```

```mutacao
arquivo: tools/ci/prazo-do-e2e.ts
teste: tools/ci/prazo-do-e2e.test.ts › as etapas que o ci:e2e roda levam a fatia ao Playwright, e a dos testes avisa o prazo; as outras não avisam
-  return argumentos.filter((argumento) => /^--(grep|project|repeat-each|workers)=./.test(argumento))
+  return argumentos.filter((argumento) => /^--(grep|project|repeat-each|workers)=/.test(argumento))
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian 1ª, revisor-geral 1ª, test-engineer 1ª | Opção com `-` fora da lista, ou valor solto (`--workers 1`, `--repeat-each 10`), é descartada ou lida como arquivo sem aviso; recusar com erro (como `fatiaDosArgumentos` faz com `--shard`) ou, no mínimo, uma linha no log com o que foi descartado | Muda comportamento e contrato do `e2e.ts`: entra no `TODO.md`, no item "(X1, retrospectiva) Código de processo", como letra nova (g), para a próxima correção que tocar `opcoesDoPlaywright` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-18 10:29:26 | 2026-10-18 10:29:50 | `infra-guardian` | 1 | APROVADO | afe60d823eb151be5 |
| 2026-10-18 10:29:25 | 2026-10-18 10:29:55 | `revisor-geral` | 1 | APROVADO | ade3f42c3fe75c319 |
| 2026-10-18 10:29:24 | 2026-10-18 10:29:57 | `test-engineer` | 1 | APROVADO | af860671822796864 |
| 2026-10-18 10:33:22 | 2026-10-18 10:33:43 | `test-engineer` | 2 | APROVADO | a224004f1f5e514f0 |
| 2026-10-18 10:33:27 | 2026-10-18 10:33:48 | `revisor-geral` | 2 | APROVADO | a7d1eeb551a44b225 |
