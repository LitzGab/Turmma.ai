# Correção — `linhas.ts conferir` recusa a correção feita na branch da spec, porque para no primeiro `(tarefa N.0)`

**Origem:** `tasks/prd-telas-da-coordenacao/retro.md` (`TODO.md`, "(X1, retrospectiva) Código de processo", letra (c), frase de `linhas.ts conferir`).
**Subagentes obrigatórios:** `revisor-geral`
<!-- Veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção toca `tools/processo/`. -->

## Sintoma

O `/seguir` (passo 10) manda rodar `node tools/processo/linhas.ts conferir` ao receber o relatório de uma correção, e o
`corrigir` diz que o defeito de uma spec em curso se corrige na branch dela. Na branch da spec o comando recusa sempre:
`o commit <sha> leva código sem (correção <slug>) no título: "… (tarefa 3.0)"`. Os commits que a `develop` não tem são
os da spec inteira, e cada um deles é uma tarefa com `(tarefa N.0)`.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa. As letras (b), (e) e (g) e a última frase da
(c) do mesmo item do `TODO.md` são correções seguintes, neste mesmo andar.

## Causa

`conferir` chama `conferirEntrega(raiz, 'develop', null)`: sem tarefa, a única marca que vale é `(correção <slug>)`. Num
andar de correção avulsa (`correcao/…`) os commits novos são só da correção e isso basta. Na branch `spec/…` a base
`develop` traz os commits das tarefas já feitas, que o encontro de cada linha já conferiu, e o primeiro deles faz o comando
recusar.

Há um segundo caminho para a mesma recusa, o do histórico de verdade desde a D79: com linhas em paralelo, o `encontro`
faz `git merge --no-edit <spec>` na linha, e a spec avança até ele. O merge é um commit de dois pais cujo primeiro é a
linha: contra o primeiro pai ele "traz" o código de tudo o que veio do outro lado, e sem marca nem `Revisões:` cai em
`!marcado`. Só tratar a marca de tarefa deixava o comando recusando em todo andar com duas linhas.

## Teste que reproduz

`tools/processo/linhas.test.ts`, bloco `conferir na branch da spec` (dez `it` novos):

- na branch `spec/…`, com um commit `(tarefa 2.0)` com código e `Revisões:` e depois um `(correção …)` com código, empurrado:
  `conferir` aceita (vermelho antes: recusava o commit da tarefa);
- o último commit com código é de tarefa, e não de correção: recusa (a correção que o `/seguir` espera não está lá);
- commit com código sem nenhuma marca, ou sem a linha `Revisões:`, continua recusado, também na spec;
- na branch de correção avulsa, a marca de tarefa continua não valendo, e o merge limpo continua cobrado (a isenção é do
  encontro, que só existe na spec);
- um commit de documento depois do código não esconde que o último commit com código era de tarefa;
- uma spec só com documento e um commit sem marca é recusada (não há commit com código, e portanto nenhuma correção);
- **o histórico de verdade**: `andares()` com duas linhas, `partida` e `encontro` nas duas (o da segunda é um merge), e depois
  um `(correção …)` com código na spec, empurrado: `conferir` aceita (vermelho sem o tratamento de merge);
- o merge que resolveu conflito à mão é cobrado pelo que resolveu: sem marca é recusado, com `(correção …)` e `Revisões:` passa.
- **duas linhas que mexem em trechos diferentes do mesmo arquivo**: o merge do encontro junta o arquivo sozinho (e resolve o
  `tasks.md`), e o `conferir` aceita a correção que vem depois (vermelho com `--cc`, `-c` ou o diff contra o primeiro pai);
- o merge que resolve o conflito ficando com um lado (`checkout --ours`) é cobrado, porque descartou o código do outro
  (vermelho com `--cc`, que não lista o arquivo).

## Correção

- `tools/processo/linhas.ts`: `conferirEntrega` ganha a opção `naSpec`. Ligada, a marca `(tarefa N.0)` de qualquer tarefa vale
  para o commit com código (continua exigindo `Revisões:`), e o último commit com código tem de ser o da correção. Desligada,
  é o que sempre foi. `conferir` liga a opção quando a branch começa por `spec/` (`PREFIXO_DA_BRANCH_DE_SPEC`).
- Ainda com `naSpec`, o que se cobra de um commit são os arquivos de `git show --remerge-diff` (`arquivosDoCommit`): num
  commit comum, os mesmos do diff contra o pai; num merge, só a diferença entre o que ele gravou e o que o git juntaria
  sozinho. O merge limpo não traz nada e passa, mesmo quando juntou trechos dos dois lados no mesmo arquivo; o que resolveu
  conflito de código, inclusive ficando com um lado só, cai na regra comum (marca e `Revisões:`), e o "último commit com
  código" nunca é um merge sem conteúdo próprio. O `diff-tree --cc` da 2ª rodada errava nos dois sentidos: cobrava o merge
  limpo no mesmo arquivo e deixava passar o conflito resolvido com um lado.
- **Fica de fora, por decisão:** a correção só de documento (`.md` ou `tasks/`) feita na spec depois do último commit de tarefa
  é recusada pelo `conferir` ("falta o commit com (correção <slug>)…"), enquanto na correção avulsa o mesmo caso passa. Aceitá-la
  muda o comportamento do comando e este defeito não o pede; o `it` "um commit de documento depois do código…" a prende
  como está, e a mudança fica registrada no `TODO.md`, no item "(X1, retrospectiva) Código de processo".

## Mutações

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › aceita a correção que vem depois das tarefas da spec, que a develop ainda não tem
-    const marcado = daTarefa || corrige || (naSpec && MARCA_DE_TAREFA.test(titulo))
+    const marcado = daTarefa || corrige
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › fora da spec, na correção avulsa, a marca de tarefa continua não valendo
-    const marcado = daTarefa || corrige || (naSpec && MARCA_DE_TAREFA.test(titulo))
+    const marcado = daTarefa || corrige || MARCA_DE_TAREFA.test(titulo)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › recusa quando o último commit com código é de tarefa, e não a correção que se esperava
-    ultimoCorrige = corrige
+    ultimoCorrige = true
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › recusa quando o último commit com código é de tarefa, e não a correção que se esperava
-  if (naSpec ? !ultimoCorrige : !temMarca) return `falta o commit com (correção <slug>) no título${naSpec ? ', e ele tem de ser o último com código' : ''}`
+  if (!temMarca) return `falta o commit com (correção <slug>) no título${naSpec ? ', e ele tem de ser o último com código' : ''}`
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › um commit de documento depois do código não esconde que o último commit com código era de tarefa
-  if (naSpec ? !ultimoCorrige : !temMarca) return `falta o commit com (correção <slug>) no título${naSpec ? ', e ele tem de ser o último com código' : ''}`
+  if (naSpec ? !temMarca : !temMarca) return `falta o commit com (correção <slug>) no título${naSpec ? ', e ele tem de ser o último com código' : ''}`
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › aceita a correção que vem depois das tarefas da spec, que a develop ainda não tem
-  const entrega = conferirEntrega(raiz, 'develop', null, { naSpec: branch.startsWith(PREFIXO_DA_BRANCH_DE_SPEC) })
+  const entrega = conferirEntrega(raiz, 'develop', null, { naSpec: false })
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › commit com código sem marca, ou sem a linha Revisões, continua recusado na spec
-    if (!marcado) return `o commit ${curto} leva código sem ${marcaDaTarefa ?? (naSpec ? '(tarefa N.0) nem (correção <slug>)' : '(correção <slug>)')} no título: "${titulo}"`
+    if (!marcado) return `o commit ${curto} leva código sem ${marcaDaTarefa ?? '(correção <slug>)'} no título: "${titulo}"`
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › recusa quando o último commit com código é de tarefa, e não a correção que se esperava
-  if (naSpec ? !ultimoCorrige : !temMarca) return `falta o commit com (correção <slug>) no título${naSpec ? ', e ele tem de ser o último com código' : ''}`
+  if (naSpec ? !ultimoCorrige : !temMarca) return `falta o commit com (correção <slug>) no título`
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › fora da spec, na correção avulsa, a marca de tarefa continua não valendo
-  if (naSpec ? !ultimoCorrige : !temMarca) return `falta o commit com (correção <slug>) no título${naSpec ? ', e ele tem de ser o último com código' : ''}`
+  if (naSpec ? !ultimoCorrige : !temMarca) return `falta o commit com (correção <slug>) no título${', e ele tem de ser o último com código'}`
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › uma spec só com documento e um commit sem marca é recusada
-  let ultimoCorrige = false
+  let ultimoCorrige = true
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › com duas linhas que mexem em trechos diferentes do mesmo arquivo, o merge limpo do encontro não é cobrado
-    ? git(checkout, 'show', '--remerge-diff', '--format=', '--name-only', sha)
+    ? git(checkout, 'diff-tree', '-r', '--cc', '--name-only', '--no-commit-id', sha)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › com duas linhas que mexem em trechos diferentes do mesmo arquivo, o merge limpo do encontro não é cobrado
-    ? git(checkout, 'show', '--remerge-diff', '--format=', '--name-only', sha)
+    ? git(checkout, 'diff-tree', '-r', '-c', '--name-only', '--no-commit-id', sha)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › com duas linhas, o merge que o encontro faz não derruba a conferência da correção que vem depois
-    ? git(checkout, 'show', '--remerge-diff', '--format=', '--name-only', sha)
+    ? git(checkout, 'diff', '--name-only', `${sha}^1`, sha)
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › fora da spec, na correção avulsa, a marca de tarefa continua não valendo
-  const saida = naSpec
+  const saida = true
```

```mutacao
arquivo: tools/processo/linhas.ts
teste: tools/processo/linhas.test.ts › o merge que resolve o conflito ficando com um lado é cobrado, porque descartou o código do outro
-    ? git(checkout, 'show', '--remerge-diff', '--format=', '--name-only', sha)
+    ? git(checkout, 'diff-tree', '-r', '--cc', '--name-only', '--no-commit-id', sha)
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (2ª) | `-c` ou `--cc`: "vale decidir qual dos dois se quer e prender a escolha com um caso desse tipo" | Resolvida: o cálculo deixou de ser `--cc`/`-c` e passou a `--remerge-diff`; as duas trocas têm bloco em "Mutações" |
| test-engineer (2ª) | "'Último commit com código' depende da ordem por data do `rev-list --reverse`… se o `conferir` rodar depois de um encontro que veio após a correção, o commit de tarefa da linha pode ter data mais nova e a recusa seria indevida." | `TODO.md`, no item "(X1, retrospectiva) Código de processo", junto da decisão sobre a correção só de documento |
| revisor-geral (1ª) | o ternário do sufixo da mensagem repete `naSpec`; duas mensagens, uma por ramo | Recusada: só estilo, e a linha é a que quatro blocos de "Mutações" reescrevem |
| revisor-geral (3ª) | A frase do documento sobre o `it` de "trechos diferentes" diz "vermelho com `--cc`, `-c` ou o diff contra o primeiro pai"; só as duas primeiras mutações apontam para ele, a do diff contra o primeiro pai está declarada no `it` de duas linhas com `a.ts` e `b.ts`. | `TODO.md`, no item "(X1, retrospectiva) Código de processo": é frase de documento, e um ciclo novo só para ela custa mais que o erro |
| revisor-geral (3ª) | A dependência da ordem por data do `rev-list --reverse` ficou como "a rever" no `TODO.md`; deve virar correção própria antes de o `conferir` rodar numa spec com encontro depois da correção. | Já no `TODO.md` (mesma recomendação do test-engineer, 2ª); vira correção própria quando o `conferir` precisar rodar depois de um encontro |
| test-engineer (3ª) | Versão mínima do git: `--remerge-diff` só existe a partir do 2.36; num git antigo o `git()` lança exceção e o `conferir` cai com stack trace. | `TODO.md`, mesmo item: a máquina tem 2.56 e a esteira roda em `ubuntu-24.04` (2.43 ou mais novo); muda código do `conferir`, e a tarefa não a pede |
| test-engineer (3ª) | Conflitos que não são de conteúdo (apagado de um lado e alterado do outro, ou renomeado): `--remerge-diff --name-only` pode imprimir linhas "remerge CONFLICT" que não são caminho de arquivo e seriam lidas como código. | `TODO.md`, mesmo item: conflito raro, a verificar com caso real antes de mexer; mexer agora anularia as três aprovações sem defeito conhecido |
| test-engineer (3ª) | Nenhum `it` prende o merge que acrescenta código novo sem conflito (cobrado pelo `--remerge-diff`, o que está certo). Cobertura extra, não bloqueia. | `TODO.md`, mesmo item, junto do caso acima: a mesma tarefa futura monta os dois merges |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-18 11:23:41 | 2026-10-18 11:24:39 | `revisor-geral` | 1 | REPROVADO | a0332db3320a7c59d |
| 2026-10-18 11:23:40 | 2026-10-18 11:24:56 | `test-engineer` | 1 | REPROVADO | a197f44f4a57115d0 |
| 2026-10-18 11:32:44 | 2026-10-18 11:33:52 | `test-engineer` | 2 | APROVADO | a472153a7ad88f6f5 |
| 2026-10-18 11:32:50 | 2026-10-18 11:33:52 | `revisor-geral` | 2 | REPROVADO | aec61d39d180d9363 |
| 2026-10-18 11:41:47 | 2026-10-18 11:42:43 | `revisor-geral` | 3 | APROVADO | ab8fa092595da35a2 |
| 2026-10-18 11:41:51 | 2026-10-18 11:42:49 | `test-engineer` | 3 | APROVADO | af4245baff798c93b |
