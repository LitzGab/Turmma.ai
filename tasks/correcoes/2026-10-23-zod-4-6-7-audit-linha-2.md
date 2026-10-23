# Correção — o `npm audit` reprova o `zod` 4.6.4 (GHSA-mrhx-c7xc-m3w5) e a `guarda:dependencias` derruba o portão da 10.0

**Origem:** portão da tarefa 10.0 do harness (`guarda:dependencias`), na branch `spec/harness--l2`; a falha está fora dos arquivos da 10.0. A linha 3 corrigiu o mesmo aviso em `bd292fb` (`tasks/correcoes/2026-10-23-zod-4-6-7-audit.md`); esta correção repete a mudança de versão na linha 2
**Subagentes obrigatórios:** `infra-guardian`, `revisor-geral`
<!-- O guardião do PEDIDO do Orquestrador é `infra-guardian`. A correção toca 8 arquivos fora de `tasks/` (sete `package.json` e o
     lock), então o `revisor-geral` é obrigatório pelo limite do passo 5 do `corrigir`: marcado aqui. -->

## Sintoma

`npm run guarda:dependencias` (as mesmas etapas da esteira, `tools/ci/etapas-de-guarda.ts`) falha no passo "dependência de produção
com vulnerabilidade grave (npm audit)", que roda `npm audit --audit-level=high --omit=dev`:

```
zod  <4.6.6
Severity: high
Zod can exhaust memory while validating oversized constrained collections - GHSA-mrhx-c7xc-m3w5
fix available via `npm audit fix --force`
Will install zod@4.6.7, which is outside the stated dependency range
1 high severity vulnerability
```

## Fora desta correção

`tasks/prd-harness/{10_task,cenarios,techspec}.md`, `tasks/prd-harness/achados/{indice,10_task}.md`,
`tools/processo/{comando-git,hook-revisoes,portao}.ts`, `tools/processo/{hook-portao,revisoes}.test.ts`, `knip.json` e
`tools/guardas/knip.test.ts`: a tarefa 10.0 em curso. Os dois últimos são o ajuste do `mkfifo` (binário do sistema que o teste da 10.0
chama; entra em `ignoreBinaries` ao lado de `flock` e `maestri`, e o teste que fixa a lista acompanha), pedido pelo Orquestrador como
parte da 10.0 para o portão desta correção poder passar. Ficam na árvore; não entram na revisão nem no commit desta correção, e a Mesa
os revisa na rodada 2 da 10.0.

## Causa

Nenhuma mudança nossa: a base de avisos do npm ganhou o GHSA-mrhx-c7xc-m3w5 para o `zod` abaixo de 4.6.6, e o `package.json` de seis
workspaces e o da raiz fixavam o `zod` em `4.6.4` exato. O `npm audit` diz que a 4.6.7 corrige, e a linha 3 já a adotou em `bd292fb`
(revisada lá por `infra-guardian`, `revisor-geral` e `test-engineer`, as três aprovadas na 1ª rodada).

**O aviso alcança o nosso uso?** O `zod` é a validação de toda entrada HTTP, de job e de evento (`ZodValidationPipe`, D81; contratos
de `packages/shared`). O aviso trata de memória esgotada ao validar coleções grandes com limite declarado (`.max()` em array, set,
map): a validação de um corpo grande na API é o caminho. A correção é trocar a versão, não argumentar que não alcança.

**De qual tarefa é a falha:** de nenhuma. É a base de avisos do npm que mudou; o portão da 10.0 só a encontrou primeiro nesta linha.

## Teste que reproduz

A conferência da esteira, `npm run guarda:dependencias`, no passo `npm audit --audit-level=high --omit=dev`:

- **Antes (vermelho), sobre `24b67f5`:** a saída do sintoma, `1 high severity vulnerability`.
- **Depois (verde):** `found 0 vulnerabilities`; `npm ls zod` não acusa nenhuma versão `invalid` e `node_modules/zod` é 4.6.7.
  `npm run typecheck` passa nos seis workspaces.

Não entra teste novo: a mudança é de versão de dependência, sem código nosso alterado, e a guarda é o teste que a esteira já roda.

## Correção

Mesma mudança de `bd292fb`, reaplicada com `git show bd292fb -- package.json package-lock.json apps packages | git apply`; o lock
resultante é byte a byte o de `bd292fb`.

- `zod` 4.6.4 → **4.6.7**, exato como estava (a regra do repositório é versão exata), nos sete `package.json` que o declaram: a raiz,
  `apps/api`, `apps/despachante`, `apps/realtime`, `apps/worker`, `packages/nucleo` e `packages/shared`.
- `package-lock.json`: `node_modules/zod` passa a 4.6.7, e a cópia aninhada `node_modules/knip/node_modules/zod` sai, porque a única
  4.6.7 agora serve a todos. Só o `zod` mudou no lock.
- O merge da linha 3 na `spec/harness--l2` traz o mesmo conteúdo; como as duas mudanças são idênticas, não há conflito.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 18:24:17 | 2026-10-23 18:24:33 | `infra-guardian` | 1 | APROVADO | a6d24f41334848bfc |
| 2026-10-23 18:24:19 | 2026-10-23 18:24:36 | `revisor-geral` | 1 | APROVADO | af5d51c20f7dd835b |
| 2026-10-23 18:24:20 | 2026-10-23 18:24:41 | `test-engineer` | 1 | APROVADO | a08be34953e44f572 |
