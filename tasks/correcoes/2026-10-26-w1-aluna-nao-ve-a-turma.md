# Correção — o W1 espera o `h2` com o nome da turma em Eu, que a correção "Eu cabe em 1366" trocou pela linha de apoio do título

**Origem:** esteira run 40254713174 (código de `8a4053cc`, "Eu cabe em 1366"), `e2e/escola-montada.spec.ts:228`, nos projetos `celular` e `chromebook`
**Subagentes obrigatórios:** `frontend-reviewer`, `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`, `infra-guardian`, `test-engineer`
<!-- test-engineer é obrigatório em toda correção. O Orquestrador ditou os três primeiros; a Mesa acrescentou conformidade-reviewer e infra-guardian porque e2e/escola-montada.spec.ts pede os quatro guardiões (tools/processo/guardioes-por-caminho.ts). -->

## Sintoma

Na esteira 40254713174 o W1 (`escola-montada.spec.ts:63`) cai nos dois projetos, depois de a aluna entrar e passar pela introdução:

```
Error: expect(locator).toBeVisible() failed
Locator: getByRole('main').getByRole('heading', { name: '7A e5ac8b07', level: 2 })
Timeout: 20000ms  Error: element(s) not found
> 228 | await expect(principal(alunaNaTela).getByRole('heading', { level: 2, name: turma })).toBeVisible(...)
```

Em `297b734b` (anterior à correção do Eu) estava verde.

## Fora desta correção

Nada. Sem tarefa em curso na árvore.

## Causa

A correção `2026-10-25-eu-cabe-em-1366` (`8a4053cc`) tirou o cartão da turma de Eu: o nome da turma, a série e a escola passaram para a linha de apoio do título (`<Tela descricao=…>`, dentro do `header`), e o `h2` com o nome da turma deixou de existir (o único `h2` de Eu agora é "Como estou indo"). Ela ajustou os dois e2e que procuravam esse `h2` (`aluno-eu.spec.ts` e `minha-turma.spec.ts`) e os testes de componente, mas **o W1 também o procurava**, na última verificação ("a aluna entra e vê só a turma dela"), e ficou de fora: o portão só roda o e2e cujo texto removido ainda é citado como texto exato, e o `getByRole('heading', { name: turma })` não cita o literal removido (`Sua turma`, `Série`); o `grep` do Implementador procurou por esses rótulos e não pelo `h2` da turma. Não é defeito de produção: a tela mostra a turma da aluna, o teste é que procurava pelo elemento antigo. Nenhum outro e2e ficou com o `h2` do cartão (`grep -rn` em `e2e/` e `apps/web/src`; o `Turma ${nome}` de `turma-publica.spec.ts` e do trecho do W1 na linha 194 é o título da página pública do código da turma, outra tela).

## Teste que reproduz

O próprio `e2e/escola-montada.spec.ts › W1: da escola vazia à aluna aprovada, só pela tela…`, nos dois projetos (`chromebook` e `celular`).

- Antes (HEAD `f772feee`, sem o conserto): vermelho nos dois projetos, na linha 228, o mesmo da esteira — `Locator: getByRole('main').getByRole('heading', { name: '7A …', level: 2 })`, `element(s) not found`, 20 s (`npx playwright test e2e/escola-montada.spec.ts`, 2 failed).
- Depois: verde nos dois projetos, `chromebook` em 41,3 s e `celular` em 45,5 s (2 passed), e de novo dentro do portão (46,2 s). O caso declara `test.setTimeout(240_000)`, então o limite do portão é 120 s.

## Correção

Só `e2e/escola-montada.spec.ts`, a verificação final da aluna. O `h2` vira o lugar onde a turma está hoje, o `header` de Eu, como já fazem `minha-turma.spec.ts` e `aluno-eu.spec.ts`:

```diff
-  await expect(principal(alunaNaTela).getByRole('heading', { level: 2, name: turma })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
+  await expect(principal(alunaNaTela).locator('header').getByText(turma)).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
```

**O que o W1 prova segue igual, e não foi afrouxado.** A linha continua exigindo, com o mesmo prazo, que a turma da aluna apareça na tela dela, e não em qualquer lugar da página: o `getByText` fica preso ao `header` do `main`. As asserções que vêm depois ficam como estavam e continuam provando "só a turma dela": a escola dela aparece, e o colega, a matrícula do colega, a outra turma da escola e o aluno dessa outra turma **não** aparecem em lugar nenhum do `body`.

Nenhum arquivo de `apps/*/src` ou `packages/*/src` muda; não há cláusula de produção a mutar.

## Recomendações sem aplicar

Rodada 1 (Mesa): os seis revisores aprovaram. A recomendação do comentário da linha 228 foi aplicada (o comentário descreve o que a tela mostra, sem citar a correção de origem). As outras:

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| tenancy-guardian (1ª), frontend-reviewer (1ª), test-engineer (1ª) | `getByText(turma)` casa por trecho; prender com `{ exact: true }`, `toHaveText` da linha inteira ou `data-testid` | Recusada: o nome da turma leva o sufixo aleatório `marca`, então não há ambiguidade, e o `getByText` preso ao `header` do `main` segue o padrão de `minha-turma.spec.ts:74` e `aluno-eu.spec.ts:58`. Prender a linha inteira acopla o teste à série e à escola, e o `data-testid` muda código de produção, fora do escopo desta correção |
| conformidade-reviewer (1ª), test-engineer (1ª) | O portão só roda o e2e que cita o texto exato removido; um seletor por papel e nome (`getByRole('heading', …)`) escapa. Procurar por `getByRole('heading'` em `e2e/` quando uma correção tira um `h2` | Retrospectiva da X4 (`retro`), como mudança de processo no portão e no passo de "procurar o nome antigo" de `criar-tasks`; não é desta correção |

**Sem mutação:** a correção só altera o e2e; nenhum código de `apps/*/src` nem de `packages/*/src` muda, e o conserto é do teste que procurava um elemento que a tela deixou de ter.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-26 00:11:06 | 2026-10-26 00:11:18 | `tenancy-guardian` | 1 | APROVADO | a8af273c72a23d611 |
| 2026-10-26 00:11:03 | 2026-10-26 00:11:22 | `frontend-reviewer` | 1 | APROVADO | a497a1304640afea0 |
| 2026-10-26 00:11:14 | 2026-10-26 00:11:23 | `infra-guardian` | 1 | APROVADO | a46bfe922f4b00885 |
| 2026-10-26 00:11:09 | 2026-10-26 00:11:33 | `privacy-guardian` | 1 | APROVADO | a16ac99dac16248ca |
| 2026-10-26 00:11:11 | 2026-10-26 00:11:37 | `conformidade-reviewer` | 1 | APROVADO | a0fa96858247d2432 |
| 2026-10-26 00:11:16 | 2026-10-26 00:11:55 | `test-engineer` | 1 | APROVADO | a04815dba4fda055b |
