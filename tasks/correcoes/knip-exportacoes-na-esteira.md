# Correção — o passo knip do `ci:verificar` roda com todas as categorias e reprova 166 exports sem uso

**Origem:** esteira run 39896272821 em `83cc03a` (`gh run view 39896272821 --log-failed`), job `verificar`, passo "dependência declarada onde é usada, sem sobra (knip)".
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
<!-- O PEDIDO do Orquestrador: nenhum guardião além de test-engineer e revisor-geral. O revisor-geral é obrigatório pelo passo 5
     da skill `corrigir` porque a correção toca `tools/ci/`. -->

## Sintoma

`npm run ci:verificar` falha no passo do knip com `Unused exports (166)` e `Unused exported types (30)`, exit 1. O mesmo
comando, rodado como o `guarda:dependencias` do `package.json` o roda, sai limpo.

## Fora desta correção

Nada: a árvore estava limpa.

## Causa

A etapa `etapaDependenciasDeclaradas` (`tools/ci/etapas-de-guarda.ts`, tarefa 24.0, commit `32b277d`)
chama `npx --no knip --include dependencies,unlisted,binaries,unresolved`. O `npx` toma `--include` por opção do próprio npm
(`npm warn invalid config include="dependencies,unlisted,binaries,unresolved" … Must be one or more of: prod, dev, optional,
peer`) e **não a repassa** ao knip, que roda com todas as categorias e reprova os exports sem uso, que a 24.0 dizia deixar de fora
(ondas 2 e 6). O `guarda:dependencias`, que chama `knip` direto num script npm, não passa pelo `npx` e sempre esteve certo.

Escapou porque todos os testes da 24.0 chamam `node_modules/.bin/knip` direto (`tools/guardas/knip.test.ts`) ou trocam o `npx`
por uma imitação que só registra a linha (`tools/ci/scripts.test.ts`): nenhum rodava o `npx` de verdade. Falha da tarefa 24.0.

## Teste que reproduz

`tools/guardas/knip.test.ts` › `a etapa do ci:verificar, rodada pelo `npx` como a esteira a roda, só olha as quatro categorias:
export sem uso não reprova`: roda `etapaDependenciasDeclaradas.comando` e `.argumentos` (o `npx` real) sobre a fixture nova
`__fixtures__/knip/export-sem-uso` (um export sem uso, nenhuma violação das quatro categorias). Vermelho no HEAD (saída:
`npm warn invalid config include=…`), verde depois.

## Correção

`['--no', 'knip', …]` passa a `['--no', '--', 'knip', …]`: o `--` entrega o resto ao knip. Conferido à mão: `npx --no -- knip
--include dependencies,unlisted,binaries,unresolved` sai 0 no repositório. A linha que `tools/ci/scripts.test.ts` afirma (a
imitação do `npx` que registra a chamada) acompanha: `npx --no -- knip …`, no registro e no `it.each` da etapa que falha. Fixture
nova: `tools/guardas/__fixtures__/knip/export-sem-uso/` (já coberta pelo `ignore` de `tools/guardas/__fixtures__/**` do `knip.json`).

Rodada 1 (recomendações, `.processo/ordens/knip-exportacoes-na-esteira-r1.md`): o teste da etapa afirma `stdout` vazio, sem
`invalid config` no `stderr` e saída 0, em vez de exigir a saída toda vazia (aviso de versão do npm não o deixa vermelho); ganhou o
controle positivo (`o controle: com todas as categorias, o knip acha o export sem uso…`, que roda o knip sem `--include` na
fixture e espera `sobra`); a cópia da fixture virou o auxiliar `copiarFixture`, usado também por `rodarNaFixture`; e o comentário
não depende mais da posição do teste.

## Mutações

```mutacao
arquivo: tools/ci/etapas-de-guarda.ts
teste: tools/guardas/knip.test.ts › só olha as quatro categorias: export sem uso não reprova
   comando: 'npx',
-  argumentos: ['--no', '--', 'knip', ...ARGUMENTOS_DO_KNIP],
+  argumentos: ['--no', 'knip', ...ARGUMENTOS_DO_KNIP],
```

```mutacao
arquivo: tools/guardas/__fixtures__/knip/export-sem-uso/util.ts
teste: tools/guardas/knip.test.ts › o controle: com todas as categorias, o knip acha o export sem uso
 export const usado = 1
-export const sobra = 2
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | "Documentos com o comando antigo. `tasks/prd-reengenharia/onda-1b.md:166` ainda mostra a etapa como `npx --no knip …`, e `tasks/prd-reengenharia/24_task.md:95` também. Vale atualizar as duas para `npx --no -- knip …`, para que ninguém copie a linha com o defeito numa etapa nova. A mutação histórica em `24_task.md:144-145` pode ficar como está." | Não é arquivo que a correção toca: `onda-1b.md` é Tech Spec (do Arquiteto) e `24_task.md` é tarefa fechada. Destino: `TODO.md`, para o Arquiteto corrigir a linha na próxima vez que abrir a `onda-1b.md` |
| revisor-geral (2ª) | "`tools/guardas/knip.test.ts:65`: o comentário novo do controle diz "o teste da etapa abaixo". É a mesma dependência de posição que a rodada 1 tirou do outro comentário. Basta nomear o teste ("o teste da etapa do `ci:verificar`")." | Fica para a próxima tarefa que tocar `tools/guardas/knip.test.ts`: é uma palavra de comentário, e aplicá-la agora caducaria as duas aprovações |
| revisor-geral (2ª) | "`tools/guardas/knip.test.ts:66-68`: o controle lê `issues` do mesmo jeito que `rodarKnip`, só que para outra categoria. Se aparecer um terceiro uso, vale um auxiliar que receba as categorias. Por enquanto não pede mudança." | Recusada por ora: o próprio revisor diz que não pede mudança com dois usos. Destino: a tarefa que acrescentar o terceiro uso de `issues` em `tools/guardas/knip.test.ts` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 01:52:24 | 2026-10-23 01:52:49 | `revisor-geral` | 1 | APROVADO | a6c4e2b6f03d9e04c |
| 2026-10-23 01:52:23 | 2026-10-23 01:53:19 | `test-engineer` | 1 | APROVADO | a7b4dfc82c2f6a894 |
| 2026-10-23 01:58:01 | 2026-10-23 01:58:23 | `test-engineer` | 2 | APROVADO | a5159ca61d8f9957c |
| 2026-10-23 01:58:13 | 2026-10-23 01:58:29 | `revisor-geral` | 2 | APROVADO | a0b3d5b76ac122fe6 |
