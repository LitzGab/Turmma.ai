# Correção — o detector de literal dá como tirado da web o texto que saiu de um arquivo, mesmo que outro arquivo da web ainda o tenha

**Origem:** `.processo/ordens/diagnostico-3.md`, Ponto 1 (Arquiteto, 19/10/2026), do andar `educaia--spectelas-do-professor--l1`: o portão da 3.0, da 9.0 e da 10.0 da `telas-do-professor` puxava a suíte inteira de e2e.
**Subagentes obrigatórios:** `revisor-geral`
<!-- O PEDIDO do Orquestrador dita só `test-engineer` e `revisor-geral`; `test-engineer` é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção toca `tools/ci/`. -->

## Sintoma

O portão da tarefa soma aos alvos os `e2e/**/*.spec.ts` que citam um texto que o diff tirou de `apps/web/src` (regra 40). Na
`telas-do-professor`, a 3.0 puxou 53 dos 68 specs (866 casos), a 9.0 puxou 23 e a 10.0 puxou 65, em fila, numa máquina já carregada:
"Tentar de novo" (37 specs; continua em 56 arquivos da web), "Esperando você" (17; continua em 21), "Cancelar" (19; continua em 24) e,
na 10.0, cada literal do `VisaoGeralDaTurma.tsx` apagado ("Turma" 57, "Aluno" 49). As falhas que apareceram eram da carga, não da tarefa.

## Fora desta correção

Nada. O andar é próprio (`correcao/2026-10-19-detector-de-literal-compara-com-a-web`, a partir da `spec/telas-do-professor`) e não há
arquivo de tarefa em curso. O Ponto 2 do diagnóstico (os processos órfãos do vitest e os ambientes de teste de pé) é operação da
máquina, sem código, e não é desta correção.

## Causa

`literaisRemovidos` (`tools/ci/e2e-que-cita-literal.ts`) comparava o literal removido com o **mesmo arquivo** que o diff tocou:

```ts
const atual = conteudoAtual(nome)
const ficaram = new Set(atual === null ? [] : atual.split('\n').flatMap(literaisDaLinha))
```

O texto que sai de `a.tsx` e continua em `b.tsx` (que o diff nem toca) contava como removido da web. A regra 40 e o portão dizem "texto
que o diff tirou de `apps/web/src`": o texto que outro arquivo da web ainda mostra continua achável pelo spec que o procura em outra
tela. O arquivo apagado agravava: tudo o que ele tinha contava como removido.

## Teste que reproduz

`tools/ci/e2e-que-cita-literal.test.ts` (unidade). Contra o módulo do HEAD, nove casos ficam vermelhos (o resto da suíte, 13, passa):

- `literaisRemovidos › o texto que sai de um arquivo e outro, que o diff nem toca, ainda tem não saiu da web`: sai de `a.tsx`, a web ainda tem; só o que a web
  não tem sai.
- `literaisRemovidos › arquivo apagado tira só o que nenhum outro arquivo da web tem`.
- `no repositório › o texto que sai de um arquivo da web mas fica em outro, que a árvore não tocou, não puxa o spec` (repositório temporário,
  `rodape.tsx` com "Governança", `menu.tsx` troca: nenhum spec entra; antes, `casca.spec.ts` entrava).
- `no repositório › o arquivo apagado puxa só os specs do texto que nenhum outro arquivo da web tem` (`lateral.tsx` ainda tem "Turmas": só
  `casca.spec.ts` entra; antes, `turmas.spec.ts` também).
- `literaisDaWeb › …` (dois casos) e os três de `literaisRemovidos` cuja assinatura mudou (o segundo argumento passa a ser o conjunto de
  literais da web).
- Guarda sem vermelho antes: `no repositório › o texto que só um teste da web ainda tem conta como removido`, que protege o `.test.tsx` fora do
  conjunto; o "Governança" que some da web inteira continua puxando `casca.spec.ts` (`o spec que cita o texto trocado entra…`, já existente).

## Correção

Só `tools/ci/` e o texto que descreve o comportamento.

- `tools/ci/e2e-que-cita-literal.ts`: nova `literaisDaWeb(raiz)`, o conjunto dos literais de todo `apps/web/src/**/*.{ts,tsx}` da árvore,
  menos os `.test`. `literaisRemovidos(diff, naWeb)` deixa de receber `conteudoAtual` e tira o literal removido que o diff não recoloca e que
  `naWeb` não tem; sem o mapa por arquivo. `e2eDosLiteraisRemovidos` passa `literaisDaWeb(raiz)`. O comentário do topo deixa de dizer que
  o literal curto e comum puxa todo spec que o cita.
- `tools/ci/e2e-que-cita-literal.test.ts`: os casos acima.
- `.claude/skills/executar-task/SKILL.md`: a frase que dizia que o texto curto e comum puxa todo spec que o cita passa a dizer o critério novo.

O preço, que a regra 40 já aceita: o spec que procura o texto justamente na tela trocada, quando outro arquivo da web ainda o tem, só cai na
esteira do push.

## Mutações

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › o texto que sai de um arquivo e outro, que o diff nem toca, ainda tem não saiu da web
-  for (const literal of removidos) if (!acrescentados.has(literal) && !naWeb.has(literal) && !saidos.includes(literal)) saidos.push(literal)
+  for (const literal of removidos) if (!acrescentados.has(literal) && !saidos.includes(literal)) saidos.push(literal)
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › o texto que o diff recoloca em outra linha não saiu; o que a web ainda tem também não
-  for (const literal of removidos) if (!acrescentados.has(literal) && !naWeb.has(literal) && !saidos.includes(literal)) saidos.push(literal)
+  for (const literal of removidos) if (!naWeb.has(literal) && !saidos.includes(literal)) saidos.push(literal)
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › cada literal vem uma vez, de todos os arquivos
-  for (const literal of removidos) if (!acrescentados.has(literal) && !naWeb.has(literal) && !saidos.includes(literal)) saidos.push(literal)
+  for (const literal of removidos) if (!acrescentados.has(literal) && !naWeb.has(literal)) saidos.push(literal)
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › o texto que só um teste da web ainda tem conta como removido: o teste não aparece na tela
-    if (!entrada.isFile() || !/\.tsx?$/.test(entrada.name) || EH_TESTE_DA_WEB.test(entrada.name)) continue
+    if (!entrada.isFile() || !/\.tsx?$/.test(entrada.name)) continue
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › junta os literais de todo .ts e .tsx de apps/web/src, em qualquer pasta, e deixa de fora o teste da web
-    if (!entrada.isFile() || !/\.tsx?$/.test(entrada.name) || EH_TESTE_DA_WEB.test(entrada.name)) continue
+    if (!entrada.isFile() || EH_TESTE_DA_WEB.test(entrada.name)) continue
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › junta os literais de todo .ts e .tsx de apps/web/src, em qualquer pasta, e deixa de fora o teste da web
-    if (!entrada.isFile() || !/\.tsx?$/.test(entrada.name) || EH_TESTE_DA_WEB.test(entrada.name)) continue
+    if (!/\.tsx?$/.test(entrada.name) || EH_TESTE_DA_WEB.test(entrada.name)) continue
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › sem apps/web/src, nenhum literal
-  if (!existsSync(pasta)) return literais
+  if (false) return literais
```

```mutacao
arquivo: tools/ci/e2e-que-cita-literal.ts
teste: tools/ci/e2e-que-cita-literal.test.ts › o texto que sai de um arquivo da web mas fica em outro, que a árvore não tocou, não puxa o spec
-  return e2eQueCitam(raiz, literaisRemovidos(diff, literaisDaWeb(raiz)))
+  return e2eQueCitam(raiz, literaisRemovidos(diff, new Set()))
```

## Rodada 1: recomendações aplicadas

Ordem `.processo/ordens/2026-10-19-detector-de-literal-compara-com-a-web-r1.md`.

1. `literaisDaWeb` lê com `withFileTypes` e só abre `isFile()`: a pasta `algo.ts` não derruba mais o portão. O teste ganhou a pasta
   `apps/web/src/algo.ts/` com um arquivo dentro; a mutação do filtro de extensão agora cai pela asserção do `.css` (a pasta já não tropeça),
   e a nova mutação de `isFile()` cai pela pasta (EISDIR).
2. Teste `o texto que sai de um arquivo para um arquivo novo, ainda fora do índice, não saiu da web`. Não cobre cláusula nova (a leitura da
   árvore já é a mutação 7: com `new Set()` o teste do arquivo novo também fica vermelho), por isso não ganha bloco próprio.
3. Comentário de `literaisRemovidos` diz que `acrescentados` vale para quem chama sem a web inteira. Lógica e mutação 2 intactas.
4. `TODO.md`, letra (d): o limite antigo virou o critério novo e a correção está registrada; o item (3) cita também `apps/web/src/galeria/` e
   os dois `__fixtures__/`. A linha "Subagentes obrigatórios" segue com `revisor-geral`: o `TODO.md` é documento, e a correção já toca `tools/ci/`.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª), recomendação 1 | Tirar `galeria/` e `__fixtures__/` do conjunto de `literaisDaWeb` | `TODO.md`, item (3) da letra (d). Muda o que o detector aceita e precisa do seu próprio teste e mutação: correção seguinte desta letra |
| revisor-geral (1ª) | Ajudante comum para "arquivos da pasta com o sufixo X", que junte a leitura de `literaisDaWeb` e a de `specsDoE2e` | Recusada: o revisor mesmo diz que "não chega a ser um segundo jeito de fazer"; refatorar `specsDoE2e`, que esta correção não altera, só aumentaria o diff |
| revisor-geral (2ª) | O item (4) da letra (d) do `TODO.md` ainda diz que o cabeçalho de `e2e-que-cita-literal.ts` fala em "o que só custa minutos"; o cabeçalho já não tem a frase e já cita o preço novo. Reescrever o item para pedir só o que falta: copiar para o cabeçalho os limites de JSX em várias linhas e de template, que estão no `executar-task` | Já mora no `TODO.md`, no item (4) da "Correção seguinte desta letra"; a reescrita é da correção seguinte, que toca o cabeçalho |
| test-engineer (2ª) | Tirar `apps/web/src/galeria/` e os `__fixtures__/` do conjunto de `literaisDaWeb`, com teste de um rótulo que só a galeria tem e mutação própria (repete a recomendação 1 da 1ª rodada) | Já registrada no item (3) da letra (d) do `TODO.md`; muda o que o detector aceita: correção seguinte desta letra |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 02:30:45 | 2026-10-19 02:31:13 | `revisor-geral` | 1 | APROVADO | a80099eaaea993d17 |
| 2026-10-19 02:30:44 | 2026-10-19 02:32:23 | `test-engineer` | 1 | APROVADO | ad94ab0df8f4a5578 |
| 2026-10-19 02:36:27 | 2026-10-19 02:36:55 | `revisor-geral` | 2 | APROVADO | aa91bf146688a4ee2 |
| 2026-10-19 02:36:24 | 2026-10-19 02:37:08 | `test-engineer` | 2 | APROVADO | a6de21d66dd6974b9 |
