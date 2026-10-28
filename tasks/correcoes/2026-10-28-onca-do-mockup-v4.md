# Correção — o vazio de Criados tem a onça centralizada e o texto à esquerda (o crítico C1 da rodada 2 da validação)

**Origem:** `tasks/correcoes/2026-10-28-onca-do-mockup-validacao.md`, rodada 2, crítico C1 (R10).
**Subagentes obrigatórios:** `test-engineer`, `frontend-reviewer`, `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`, `infra-guardian`
<!-- O `frontend-reviewer` veio no PEDIDO do Orquestrador. O `test-engineer` é obrigatório em toda correção. Os outros quatro vieram da DEVOLUÇÃO
     da Mesa: os quatro arquivos alterados (`apps/`, `e2e/`) pedem esses guardiões (`tools/processo/guardioes-por-caminho.ts`), como na v3. A correção
     não toca tenant, API, banco, dado de pessoa, IA nem infra, e cada um deve dizer isso. A correção altera 4 arquivos fora de `tasks/` e não toca
     `.github/`, `tools/ci/` nem `tools/processo/`, então `revisor-geral` não entra. -->

## Sintoma

No vazio de Criados ("Nada gerado ainda"), a onça e a assinatura ficam no centro da caixa, e o título, o texto e "Ir para Ferramentas" ficam
à esquerda (fotos da validação: `vazia--professora--professor-criados--{computador,celular}.png`). No mockup
(`mockups/src/areas/professor/Criados.tsx:176-181` com `components/duo/vazio.tsx:14`) o vazio inteiro é centralizado. O teste que deveria
segurar o alinhamento (`estados.test.tsx:128-129`) confere a classe do invólucro da ilustração e passa, porque a `figure` da `Onca`
(`Onca.tsx:231`, `flex-col items-center`, largura inteira) centraliza a onça de qualquer jeito.

## Fora desta correção

Nada: a árvore estava limpa.

## Causa

A v3 passou a ilustração pelo vazio **padrão**, que alinha o texto à esquerda, e a `figure` da `Onca` ocupa a largura toda e centraliza o
desenho. O desenho do mockup é o vazio centralizado (o `tracejado` da 10.2), e a v3 deixou a escolha para o `TODO.md` em vez de
fechá-la. O teste conferia a classe (`justify-center` ausente) e não onde a onça é desenhada: provava outra coisa (regra 40).

## Teste que reproduz

- `e2e/professor-criados.spec.ts › vazio: a onça, o título e a ação ficam no mesmo eixo, como no mockup`: mede na tela o centro horizontal da
  onça, do texto do título e do botão, nos dois projetos (`chromebook` e `celular`). Vermelho antes: a onça no centro da caixa, o título e o
  botão à esquerda.
- `estados.test.tsx › a ilustração…`: o caso passa a dizer o que a peça faz (o padrão não pretende alinhar a ilustração; quem quer o vazio
  centralizado usa o `tracejado`).

## Correção

- `areas/professor/artefatos/Criados.tsx`: o vazio de verdade passa a `variante="tracejado"`, que centraliza a onça, o título, o texto e a ação.
  O vazio do filtro continua no padrão, sem onça.
- `componentes/estado/EstadoVazio.tsx`: o comentário da prop `ilustracao` diz o que a peça faz. E o espaço (`gap-3`) entre o botão e a região
  `role="status"` só existe com `emAndamento`: com a região vazia, ele empurrava o botão do tracejado 6 px para fora do eixo (o e2e mediu
  onça em 811,0 e botão em 805,0). Sem mudança no padrão: ali a região vazia fica no fim da linha e não se vê.
- `componentes/estado/estados.test.tsx`: o caso da ilustração acompanha o comentário.
- `e2e/professor-criados.spec.ts`: o caso que mede o alinhamento.

## Divergências resolvidas

Nenhuma.

## Recomendações sem aplicar

Da rodada 1 (`.processo/ordens/2026-10-28-onca-do-mockup-v4-r1.md`, seção "Sem aplicar"; os seis aprovaram e os três itens baratos do `test-engineer`
foram aplicados: o e2e busca em `main [data-onca] svg` e exige o desenho, e o caso de unidade do `gap-3` com `emAndamento`):

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | `EstadoVazio.tsx:23-27`: a convenção "quem passa `ilustracao` passa também `variante="tracejado"`" fica só no comentário; os tipos poderiam exigir (união das duas formas) | `TODO.md`: muda o contrato da peça (o tipo das props) e toca as telas que a usam; não é barata. O comentário já diz a convenção e o e2e de Criados segura o caso real |
| test-engineer (1ª) | `estados.test.tsx:130`: o teste ainda confere a classe do invólucro no padrão, "inofensivo, mas não prova nada. Fica a critério manter" | Recusada: o próprio revisor a deixa a critério; o comentário ao lado diz o que a asserção documenta (a peça não promete alinhar a ilustração no padrão) |
| frontend-reviewer (1ª) | O vazio do mockup não tem parágrafo, o nosso tem | Recusada, com o motivo do revisor: `docs/interface.md` 10.2 e a regra 50, item 5, pedem que o vazio diga o próximo passo. "Fica como está" |
| frontend-reviewer (1ª) | No celular o rodapé corta "FERRAMEN…" e o cabeçalho corta o nome da escola; "não vem desta tarefa" | `TODO.md` (item do celular) e retro da correção: está fora do alvo desta v4 |
| frontend-reviewer (1ª) | `estados.test.tsx:128-131` só prova que a peça não alinha no padrão; o alinhamento é medido no e2e | Recusada: o revisor conclui "Está bem assim" |
| conformidade-reviewer (1ª) | O comentário de `EstadoVazio.tsx:24-26` diz que `ilustracao` pede `tracejado`, mas o tipo não obriga | Mesmo destino da recomendação do tipo acima (`TODO.md`); o revisor a passa ao frontend, que a deixou como está |

## Mutações

```mutacao
arquivo: apps/web/src/areas/professor/artefatos/Criados.tsx
teste: e2e/professor-criados.spec.ts › vazio: a onça, o título e a ação ficam no mesmo eixo, como no mockup
-            variante="tracejado"
```

```mutacao
arquivo: apps/web/src/areas/professor/artefatos/Criados.tsx
teste: e2e/professor-criados.spec.ts › vazio: a onça, o título e a ação ficam no mesmo eixo, como no mockup
projeto: celular
-            variante="tracejado"
```

```mutacao
arquivo: apps/web/src/componentes/estado/EstadoVazio.tsx
teste: e2e/professor-criados.spec.ts › vazio: a onça, o título e a ação ficam no mesmo eixo, como no mockup
-        <div className={`mt-3 flex flex-wrap items-center ${acao.emAndamento ? 'gap-3' : ''} ${tracejado ? 'justify-center' : ''}`}>
+        <div className={`mt-3 flex flex-wrap items-center gap-3 ${tracejado ? 'justify-center' : ''}`}>
```

```mutacao
arquivo: apps/web/src/componentes/estado/EstadoVazio.tsx
teste: apps/web/src/componentes/estado/estados.test.tsx › o espaço entre o botão e o "Verificando…" só existe quando há o que ler: a região vazia não desloca o botão
-        <div className={`mt-3 flex flex-wrap items-center ${acao.emAndamento ? 'gap-3' : ''} ${tracejado ? 'justify-center' : ''}`}>
+        <div className={`mt-3 flex flex-wrap items-center ${acao.emAndamento ? '' : ''} ${tracejado ? 'justify-center' : ''}`}>
```

```mutacao
arquivo: apps/web/src/areas/professor/artefatos/Criados.tsx
teste: e2e/professor-criados.spec.ts › vazio: a onça, o título e a ação ficam no mesmo eixo, como no mockup
-            ilustracao={<Onca pose="apontando" agente="assistente_de_ensino" tamanho={120} animada={false} />}
+            ilustracao={<figure data-onca="">sem desenho</figure>}
```

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-28 23:30:06 | 2026-10-28 23:30:14 | `tenancy-guardian` | 1 | APROVADO | ac41d44dd22fb0933 |
| 2026-10-28 23:30:03 | 2026-10-28 23:30:22 | `frontend-reviewer` | 1 | APROVADO | ab50e88bb59234d8a |
| 2026-10-28 23:30:14 | 2026-10-28 23:30:25 | `infra-guardian` | 1 | APROVADO | a78f902e8916014f0 |
| 2026-10-28 23:30:09 | 2026-10-28 23:30:30 | `privacy-guardian` | 1 | APROVADO | a7c0b267140fac6ab |
| 2026-10-28 23:30:12 | 2026-10-28 23:30:31 | `conformidade-reviewer` | 1 | APROVADO | a147e43a724c3788b |
| 2026-10-28 23:30:00 | 2026-10-28 23:30:59 | `test-engineer` | 1 | APROVADO | ab816fda33e1e7ac6 |
| 2026-10-28 23:43:09 | 2026-10-28 23:43:29 | `test-engineer` | 2 | APROVADO | a77de55eb8fba8bd6 |
