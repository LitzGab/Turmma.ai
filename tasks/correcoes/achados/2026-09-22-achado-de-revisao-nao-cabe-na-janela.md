# Achados das revisões — `tasks/correcoes/2026-09-22-achado-de-revisao-nao-cabe-na-janela.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-22 08:54:17 · `tasks/correcoes/2026-09-22-achado-de-revisao-nao-cabe-na-janela.md`

Tree identical to the starting snapshot — all mutation work ran in a scratchpad copy with a symlinked `node_modules`.

---

VEREDITO: REPROVADO

**Cenários exigidos** (correção de ferramenta de processo — sem dado de aluno, sem tenant, sem provedor de IA; a lista aplicável é a da regra 40 sobre evidência e a da regra 80 item 7 sobre concorrência):
caminho feliz da separação por documento · resumo do índice nas formas que os revisores de fato escrevem · índice cabe na janela para uma funcionalidade inteira · concorrência real no índice compartilhado · migração idempotente (job rodado duas vezes) · migração recusa e preserva a origem quando a conservação não fecha · `##` do texto do revisor não parte bloco · rodada APROVADO sem exigência não gera bloco · rodada APROVADO **com** exigência gera bloco (o defeito do `TODO.md`) · caminho novo `achados/` não confundido com o documento da tarefa.

**Cobertos e conferidos por mim, por mutação e contra os dados reais:**

- As 9 mutações da tabela: **todas produzem pelo menos um vermelho**. Nenhum dos 9 testes novos é decoração.
- Concorrência (`revisoes.test.ts:496`): é paralelismo de verdade — 6 processos `spawn` em `Promise.all`, não 6 chamadas em sequência. **Efetivo:** sem a trava do índice, 10/10 vermelhos (mais forte que os 4/5 medidos). **Estável:** com a trava, 20/20 verdes. Não é intermitente.
- Migração, contra os dados reais de `HEAD`: 237 blocos antes → 237 depois, 237 linhas de índice, e **todo corpo byte a byte idêntico**, todo documento mapeado para a própria pasta. Conservação real confirmada, não só a do teste.
- Afirmação 5 conferida: nos 237 blocos (172 APROVADO), o critério novo descarta **0** que o regex velho mantinha.
- O caminho novo não confunde o hook: `caminhoDaTarefa` devolve `null` para `tasks/*/achados/<qualquer>.md`, inclusive no fallback de "primeira menção".
- Cabeçalho de bloco sem o sufixo do documento (`caminhoDoAchado('')` → arquivo `achados` na raiz) é barrado pela conferência de conservação, e a origem sobrevive — rodei o caso.
- Sem `.skip`, sem teste comentado, sem `any`, sem mock escondendo a regra, sem provedor pago. Suíte de unidade verde no repositório real (os 2 vermelhos que vi eram artefato da minha cópia sem `.git`).

**Bloqueantes:**

1. **`tools/processo/revisoes.ts:234` — a fronteira do `nenhum` decide se o achado existe, e nenhum teste a prova.** `COMECA_SEM_NADA = /^(nenhum[ao]?|n\/a|nada)\s*[.;]/i` exige a pontuação, e o comentário em `:232-234` declara a regra ("sem ele, `nenhuma das rotas` é conteúdo"). Troquei por `/^(nenhum[ao]?|n\/a|nada)\b/i`: **34/34 testes seguem verdes.** E a mutação não é inócua — rodei o hook de ponta a ponta com `VEREDITO: APROVADO` + `Recomendações:\n- nenhuma das três guardas cobre a virada de ano letivo; acrescente a quarta`: a rodada entra na tabela "Revisões" do documento e **o arquivo de achado e o índice não são sequer criados**. É o defeito que esta correção marca como fechado. Correção exigida: dois testes que fixem os dois lados — conteúdo que começa com "nenhuma" é preservado no resumo, e `Recomendações: nenhuma` descarta o bloco — de modo que apagar a regra deixe a suíte vermelha.

2. **`tools/processo/revisoes.ts:202` contra `:281-289` — `achadoDaRodada` é mais estrito que `resumoDoAchado`, e a forma cercada não tem teste nenhum.** O portão usa só `exigenciaDaRodada`; `resumoDoAchado` tem o fallback da primeira linha substantiva. Na forma que os revisores mais usam — o resumo do veredito dentro de uma cerca de código, com o detalhamento em prosa **depois** dela — uma rodada APROVADO com `Bloqueantes: nenhum` / `Recomendações: nenhuma` dentro da cerca perde o bloco inteiro, embora `resumoDoAchado` encontre o texto ("A sobra do `http.stdlib`…"). Rodei e confirmei: `bloco: DESCARTADO`. A forma é real, não hipótese: 9 ocorrências de seção colada a cerca de fechamento em 5 documentos (`tasks/prd-identidade-e-tenancy/achados/19_task.md:263` e `:316`, `20_task.md:493` e `:512`, `tasks/correcoes/achados/2026-09-21-log-da-falha-sem-carimbo-de-hora.md:129` e `:196`, `2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container.md:192`, `:257`, `:406`), de `test-engineer` e `privacy-guardian`. Os dois blocos reais só sobreviveram porque o revisor escreveu "5, abaixo" em vez de "nenhuma". Correção exigida: teste com a forma cercada, e ou `achadoDaRodada` passa a usar o mesmo fallback de `resumoDoAchado`, ou a assimetria é fixada por um teste que a justifique.

**Recomendações** (não bloqueiam):

- `tools/processo/revisoes.ts:268` — a cerca de fechamento vira o resumo quando cai logo abaixo do cabeçalho da seção. O índice real já carrega isso: `tasks/correcoes/achados/indice.md:58` tem a célula ` ``` `. 1 em 237; pular linhas de cerca em `primeiroItemDaSecao` fecha.
- A tabela de mutações do documento (`:76-86`) não bate com a medição em 4 das 9 linhas: `caminhoDoAchado` deu 8 vermelhos (tabela diz 4), índice não escrito 3 (diz 2), `resumoDoAchado` fixo 2 (diz 1), e `rmSync` antes da conferência **1** (diz 5). Todas continuam vermelhas, que é o que importa; os números é que não se sustentam.
- `revisoes.test.ts:525` — a concorrência afirma só a contagem de linhas. Duas escritas que duplicassem em vez de perder passariam. Afirmar os 6 nomes de revisor distintos no índice fecha.
- `tools/processo/separar-achados.ts:20` — o grupo do documento é opcional no `CABECALHO_DE_BLOCO` e `planejarMigracao` nunca passa `documentoPadrao`, o que leva `caminhoDoAchado('')` a um arquivo `achados` na raiz. Hoje a conservação barra (conferido), mas tornar o grupo obrigatório elimina o caminho.

## test-engineer · 2ª rodada · REPROVADO · 2026-09-22 09:13:57 · `tasks/correcoes/2026-09-22-achado-de-revisao-nao-cabe-na-janela.md`

Rodei as onze mutações uma a uma numa cópia em `/tmp` com `node_modules` ligado por symlink. Nenhum arquivo da árvore foi tocado: `git status` no fim é idêntico ao do começo. Baseline: 36 verdes nos dois arquivos, 1122 verdes na suíte `unidade` inteira.

```
VEREDITO: REPROVADO
```

**Cenários exigidos** (os mesmos da 1ª rodada, mais os dois que as correções exigidas abriram): fronteira do `nenhum` nos dois lados · forma cercada com os dois vereditos · conservação da migração quando ela falha **em `conferirPlano`**, não só em `planejarMigracao` · concorrência real no índice · os demais já aprovados na 1ª rodada.

**Cobertos e conferidos por mim, por medição:**

- Correção exigida 1 (fronteira do `nenhum`) — **feita e efetiva.** `revisoes.test.ts:496`. A mutação que eu usei (`\s*[.;]` → `\b`) agora dá 1 vermelho.
- Recomendação da concorrência — feita (`revisoes.test.ts:590`, os seis revisores distintos). Sem a trava: 6 vermelhos em 10 execuções. Com a trava: 10/10 verdes, não é intermitente.
- Recomendação do grupo obrigatório — feita (`separar-achados.ts:20`); `documentoPadrao` saiu e `caminhoDoAchado('')` deixou de ser alcançável.
- Migração contra os dados reais: restaurei os três `achados-revisoes.md` do `HEAD` na cópia e rodei o script. 69 + 10 + 158 = 237 blocos, e o resultado é **byte a byte idêntico** ao que está no repositório, salvo a linha nova desta correção. Conservação confirmada nos dados reais.
- Sem `.skip`, sem teste comentado, sem `any`, sem `@ts-ignore`, sem mock escondendo a regra, sem provedor pago.

**Sobre o mérito da escolha do bloqueante 2: aceito.** O raciocínio está certo — declaração governa *guardar*, recuo governa *preencher a célula*, e igualar o fallback devolveria as 172 aprovadas de 237, que é o peso inteiro da correção. Não exijo igualar. O que eu bloqueio abaixo é outra coisa, que a recomendação da cerca introduziu junto.

## Bloqueantes

**1. `tools/processo/revisoes.ts:275` com `:208` — a recomendação da cerca virou regressão: um bloco real do corpus passa a ser descartado, e ele carrega cinco recomendações.**

O bloco é `tasks/correcoes/achados/2026-09-21-log-da-falha-sem-carimbo-de-hora.md:89` — `test-engineer · 2ª rodada · APROVADO · 2026-09-21 17:26:58`. Nele o revisor escreveu, dentro da cerca, `Bloqueantes: nenhum. Os dois da rodada 1 estão fechados…` e, como **última linha antes do fechamento da cerca** (`:128`), `Recomendações:` — e então R1 a R5 em prosa depois da cerca, com coisas como "as três mutações que sobreviveram", "a tabela não bate, e é achado" e "R5 segue aberta da rodada 1, e é a única asserção de resultado que falta".

Rodei, não li:

```
veredito: "APROVADO"
exigenciaDaRodada: null
achadoDaRodada: DESCARTADO
```

Antes do filtro de cerca o corpo da seção era `["```"]`, a exigência era `"```"` e o bloco era guardado — é exatamente a célula ` ``` ` que eu apontei em `tasks/correcoes/achados/indice.md:58`. Depois do filtro o corpo fica vazio, a exigência vira `null`, e o bloco inteiro some.

Varri os 238 blocos de `tasks/*/achados/`: **1 desaparece** com o critério atual e existia com o regex velho. Isso derruba a afirmação do documento em `:132-133` ("nenhum bloco que existe hoje deixa de existir com o critério novo — a mudança só acrescenta os que se perdiam"). E derruba no caso que a correção existe para fechar: achado que some sem deixar rastro.

A causa não é a assimetria que você defendeu, e por isso não peço para igualar o fallback. É que `exigenciaDaRodada` confunde duas coisas diferentes, devolvendo `null` para as duas:
- o revisor **declarou** `nenhum` / `nenhuma` — não exigiu nada, descartar está certo;
- a seção **existe e está vazia** (só cerca) — o conteúdo está fora dela, e descartar perde tudo.

**Correção exigida:** distinguir as duas em `achadoDaRodada`. Cabeçalho de seção presente com corpo vazio não pode contar como "nada exigido": a rodada é guardada, e `resumoDoAchado` já sabe preencher a célula. Mais um teste com esta forma real — `Recomendações:` como última linha dentro da cerca, itens depois dela, veredito **APROVADO** — afirmando que o arquivo do documento e a linha do índice existem. Medi o custo dessa distinção no corpus: ela recupera 1 de 172 aprovadas, não reabre o peso. Os dois casos do teste `o revisor que resume dentro de uma cerca` continuam verdes, porque neles o `nenhum`/`nenhuma` é explícito na mesma linha.

**2. `tools/processo/separar-achados.ts:128-138` — "o `rmSync` é a última linha, depois de tudo escrito e conferido" não tem teste que o prove.**

`separar-achados.test.ts:87` (`recusa e não apaga a origem quando a conservação não fecha`) exercita só o `throw` de `planejarMigracao` (blocos repetidos), que acontece **antes** de `conferirPlano`. A segunda metade do teste (`:99-102`) chama `conferirPlano` direto, fora de `migrar`, então não diz nada sobre a ordem dentro de `migrar`.

Medido: mover `rmSync(arquivo)` para a linha imediatamente **anterior** a `conferirPlano(plano, indiceAtual)` deixa **36/36 verdes**. A regra que o comentário de `:137` declara não tem teste. E é a regra que protege 646 KB de achado que não tem outra cópia.

Isso também torna falsa a linha `| \`rmSync\` antes da conferência | 5 |` do documento (`:84`): medi 0, não 5. A variante mais agressiva (`rmSync` logo depois da leitura, antes de planejar) dá 1 — que é o número que eu medi na 1ª rodada.

**Correção exigida:** um caso que chegue a `conferirPlano` e o faça falhar dentro de `migrar`, afirmando que a origem sobrevive e que nada foi escrito no destino. Há caminho sem seam artificial: destino `achados/9_task.md` já contendo o **mesmo bloco duas vezes** (o merge que o próprio script existe para absorver) — `jaExistiam` conta a identidade uma vez e `separarBlocos` conta duas, a conservação não fecha. E corrigir o número da tabela.

**3. `tasks/correcoes/2026-09-22-achado-de-revisao-nao-cabe-na-janela.md:80-92` — a tabela de mutações ainda tem uma linha que não se sustenta.** Refiz as onze. Nove batem agora; a terceira está errada (bloqueante 2 acima) e a décima primeira está exagerada. Esta é a medição, para você copiar:

| Mutação | documento | medido por mim |
|---|---|---|
| `caminhoDoAchado` volta ao arquivo único | 10 | **10** ✓ |
| índice deixa de ser escrito | 5 | **5** ✓ |
| `rmSync` antes da conferência | 5 | **0** ✗ (1 se for antes de `planejarMigracao`) |
| `resumoDoAchado` sempre o mesmo texto | 4 | **4** ✓ |
| `achadoDaRodada` volta ao regex de `HEAD` | 1 | **1** ✓ |
| `encurtar` vira identidade | 1 | **1** ✓ |
| fronteira do `nenhum` sem a pontuação | 1 | **1** ✓ |
| cerca de código deixa de ser pulada | 1 | **1** ✓ |
| migração não acumula | 1 | **1** ✓ |
| delimitador de bloco frouxo (só `## `) | 1 | **1** ✓ |
| trava do índice removida | "quase toda execução" | **6 de 10 vermelhos**; com a trava, 10/10 verdes |

Aviso sobre a quinta linha: com `/Recomendações:/` simples dá 3 vermelhos; com o regex exato de `HEAD` (`/Recomendações\**\s*:\**\s*(?!nenhuma)\S/i`) dá 1. O número do documento só se sustenta na leitura fiel — vale citar o regex na própria linha da tabela para ela não ser ambígua na próxima medição.

## Recomendações (não bloqueiam)

- `tasks/correcoes/achados/indice.md:58` continua com a célula ` ``` `. O conserto entrou no código, mas o artefato migrado não foi regenerado, e os `achados-revisoes.md` de origem já foram apagados — não dá para regerar pelo script. Corrija a célula à mão junto com o bloqueante 1 (é a mesma rodada).
- `revisoes.test.ts:622` fixa o teto em 260 bytes por linha. O índice real de `tasks/correcoes/` já está em 256 (o de `prd-identidade-e-tenancy`, em 226). A folga é de 1,5%, e as linhas de correção são as mais longas porque o slug é mais longo que `N_task`. Ou o teto sobe com justificativa, ou o `LIMITE_DO_RESUMO` cai — hoje o teste passa por pouco contra o dado que ele diz representar.
- O comentário de `revisoes.ts:198-202` explica a assimetria, e explica bem. Acrescente nele a terceira possibilidade, que é a do bloqueante 1: seção vazia não é declaração. É onde o próximo leitor vai errar de novo.

## test-engineer · 3ª rodada · APROVADO · 2026-09-22 09:36:36 · `tasks/correcoes/2026-09-22-achado-de-revisao-nao-cabe-na-janela.md`

Auditoria feita em cópia em `/tmp` com `node_modules` por symlink; nenhum arquivo da árvore foi tocado (`git status` final idêntico ao inicial). Baseline: **38 verdes** em `tools/processo` (`npx vitest run --project unidade tools/processo`), `tsc -p tsconfig.json --noEmit` limpo.

VEREDITO: APROVADO

**Cenários exigidos** (os da 1ª e 2ª rodadas, mais os três que as correções exigidas abriram): distinguir seção vazia de declaração, com a forma real e veredito APROVADO · conservação falhando **dentro** de `migrar`, em `conferirPlano`, com a origem sobrevivendo · tabela de mutações remedida · concorrência real no índice · os demais já aprovados.

**Cobertos e conferidos por mim, por medição:**

- **Correção exigida 1 — feita e efetiva.** `tools/processo/revisoes.test.ts:557`. Mutação (tirar `&& !temSecaoSemDeclaracao(mensagemFinal)` de `revisoes.ts:213`): 1 vermelho, e o vermelho é o certo — sem a distinção o arquivo do documento nem é criado e o `readFileSync` estoura. A mutação nova que você acrescentou sozinho (tirar o `filter(!CABECALHO_DE_SECAO)` de `resumoDoAchado`, `revisoes.ts:333`) também dá 1 vermelho.
- **Varredura independente do corpus**, com `exigenciaDaRodada`/`temSecaoSemDeclaracao` importados do código final contra os **239 blocos** de `tasks/*/achados/`: `{ total: 239, aprovados: 172, guardadosNovo: 239, perdidos: 0, ganhos: 0 }`. **0 perdidos** confirmado, e nenhuma célula de resumo sairia como ` ``` `, `ver o bloco` ou acima de 161. O bloco que eu bloqueei na 2ª rodada (`2026-09-21-log-da-falha-sem-carimbo-de-hora.md`, `test-engineer · 2ª · APROVADO · 17:26:58`) volta a ser guardado: `exigencia: null`, `secaoVazia: true`, `guardado: true`.
- **Correção exigida 2 — feita e efetiva.** `separar-achados.test.ts:105`. Movendo `rmSync(arquivo)` para a linha anterior a `conferirPlano` (e tirando a do fim): **1 vermelho**, exatamente esse teste. A regra que `separar-achados.ts:137` declara passou a ter prova.
- **Concorrência: real e estável.** Seis `spawn` em `Promise.all`, não seis chamadas em sequência. Sem a trava do índice (`revisoes.ts:506`): **10 vermelhos em 10**. Com ela: 12 execuções isoladas + 10 da suíte inteira + 12 sob contenção (4 invocações simultâneas de vitest) = **34 verdes, 0 vermelhos**. Não achei intermitência; sua leitura (arquivo lido pela metade na invocação em que ele acabara de ser escrito) é a explicação que sobra, e ela está registrada no documento, que é o que a regra pede.
- **A troca do teto: certa.** Medi os índices reais: `tasks/correcoes/achados/indice.md` tem linha máxima de **291 bytes** (média 251); `prd-identidade-e-tenancy`, 242 (média 220); `prd-estabilidade-da-esteira`, 238 (média 218). Um teto de 260 reprovaria dado verdadeiro, como você disse. E a célula é o que o código controla: o máximo real nos três índices é **161, 161 e 160** — a asserção `<= 161` está colada no dado, e `encurtar` vira identidade → vermelho. Troca aprovada.
- Sem `.skip`, sem teste comentado, sem `any`/`@ts-ignore`, sem mock escondendo a regra auditada, sem provedor pago. As onze skills e o `validador` apontam para `achados/indice.md`; as citações remanescentes a `achados-revisoes.md` estão só em registro histórico (`retro.md`, `validacao.md`, blocos migrados), que o documento declara fora de escopo.

**Bloqueantes:** nenhum. As três correções exigidas na 2ª rodada foram feitas, e as duas primeiras estão provadas por mutação que eu rodei.

**Recomendações** (não bloqueiam):

1. `tasks/correcoes/2026-09-22-achado-de-revisao-nao-cabe-na-janela.md:87` — a linha `` | `rmSync` antes de `conferirPlano` | 5 | `` continua sem se sustentar sob o próprio rótulo. **Mover** o `rmSync` para antes de `conferirPlano` dá **1** (só o teste novo). O **5** só aparece quando se *insere* um `rmSync` antes de `conferirPlano` **mantendo** o do fim — aí 4 dos 5 vermelhos são `ENOENT` do segundo `rmSync`, ruído, não guarda. Escreva `1`, ou rotule a linha como "`rmSync` duplicado". Esta é a terceira medição dessa linha; ela agora não esconde buraco nenhum (a guarda tem teste), mas o número segue errado.
2. Mesma tabela, as outras linhas que não reproduzi — provavelmente porque o texto exato da mutação difere. Minha medição, para comparar (suíte `tools/processo`, baseline 38 verdes): `caminhoDoAchado` → arquivo único **11** (doc 10); índice não escrito **6** (5); `resumoDoAchado` fixo **5** (4); cerca deixa de ser pulada **2** (1); `CABECALHO_DE_BLOCO` → `/^## /` **4** (1). As seis restantes batem. Como você já fez na linha do regex de `HEAD`, cite o texto exato da mutação em cada linha: sem isso a tabela é inauditável e vai divergir de novo na próxima medição.
3. `tasks/correcoes/2026-09-22-achado-de-revisao-nao-cabe-na-janela.md:66` — "os índices reais vão de 229 bytes por linha a 271" não bate com o que medi (médias 218/220/251; máximos 238/242/**291**). A conclusão não muda (291 > 260), mas o número sim.
4. `tasks/correcoes/achados/indice.md:58` — a célula corrigida à mão **não** é o que `resumoDoAchado` produziria para aquele bloco. O código devolve `Auditei por leitura e por mutação independente, em cópia em \`/tmp\` (removida ao fim). Nenhum arquivo da árvore foi tocado — \`git status\` no fim é idêntico ao…` (o preâmbulo vem antes da cerca e tem mais de 40 caracteres). O texto que você escreveu é melhor para quem lê, mas o artefato passa a divergir do gerador. Ou troque pela saída do código, ou registre no documento que aquela célula é edição manual e por quê.
5. `tools/processo/revisoes.test.ts:557-577` — pelo mesmo motivo, a mensagem do teste é uma versão podada do bloco real que o comentário cita (sem o preâmbulo), então a asserção do resumo prova a prosa escolhida, não o que aconteceria com o bloco real. A regra em si (seção vazia é guardada) está provada de qualquer jeito. Acrescentar o preâmbulo à mensagem do teste e afirmar o resumo resultante fecharia a distância entre o teste e o caso citado.
6. `tools/processo/revisoes.test.ts:573` — a guarda de "o bloco foi guardado" depende do `readFileSync` estourar se o arquivo não existir. Um `expect(existsSync(...)).toBe(true)` antes deixa a falha dizer o que quebrou.
7. `tools/processo/revisoes.test.ts:648` — nesse teste a asserção de 161 não tem dente: o item é curto e `encurtar` virando identidade não a derruba (só o teste de `:488` pega). Usar o `ITEM_LONGO` em algumas das 100 rodadas faria a asserção valer onde ela está escrita.
8. `tools/processo/revisoes.ts:337` — o fallback `'ver o bloco'` não tem teste e não aparece em nenhum dos 239 blocos reais. É baixo risco; vale uma linha quando alguém mexer ali de novo.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-22 09:52:14 · `tasks/correcoes/2026-09-22-achado-de-revisao-nao-cabe-na-janela.md`

VEREDITO: REPROVADO
Escopo: respeitado (com ressalva, abaixo)
Aderência à Tech Spec: n/a — correção de processo; aderente à D23/D53
Portão local: carimbo válido. `.processo/portao.json` início `2026-09-22T12:39:16.427Z`, suítes typecheck, lint, test; `conferir` responde `portão local válido para o código atual`. Conferi à mão que os quatro arquivos de código têm mtime **anterior** ao início do carimbo (12:37:05 a 12:38:51 UTC), então o defeito do item 5 não contamina este carimbo.

## Bloqueantes

**B1. `tools/processo/revisoes.test.ts` mudou de conteúdo depois da 3ª rodada aprovada do `test-engineer`, e o portão do commit bloqueia.**
A 3ª rodada terminou em `2026-09-22 09:36:36`. O instantâneo que ela gravou (`.processo/conteudo.json`, chave `tasks/correcoes/2026-09-22-achado-de-revisao-nao-cabe-na-janela.md|test-engineer|3`) registra para `tools/processo/revisoes.test.ts` o sha256 `5deb31732d4bbf34…`; a árvore atual tem `7b09c6cc007adb2f…`, com mtime `09:37:05` local. Não é `mtime` mexido com conteúdo igual — é conteúdo diferente, exatamente o caso que o instantâneo existe para distinguir.

Rodando o próprio `avaliarPortao` sobre esta árvore:

```
test-engineer: tools/processo/separar-achados.ts mudou em 2026-09-22 09:38:51, depois do
início da 3ª rodada (2026-09-22 09:27:27). A revisão vale para o código que o revisor viu:
chame uma rodada nova, com o diff desde a rodada aprovada.
```

O prompt que recebi afirma "o `test-engineer` já aprovou na 3ª rodada". Para a árvore atual isso é falso, e a regra 40 / D53 é justamente que a aprovação vale para o código que o revisor viu.
**Correção exigida:** 4ª rodada do `test-engineer` sobre a árvore atual, com o diff desde a 3ª, antes do commit. (`tools/processo/separar-achados.ts` só teve o mtime mexido — o hash bate —, mas o arquivo de teste mudou de verdade.)

**B2. `tasks/correcoes/2026-09-22-achado-de-revisao-nao-cabe-na-janela.md:43-49` — o documento afirma que a separação encerra um efeito que ela não encerra, e se contradiz dentro de si mesmo.**
O texto diz: *"Dois efeitos colaterais do arquivo único, que a separação encerra: … Toda tarefa e toda correção escrevem no mesmo arquivo, então o `git add` de cada commit carrega um arquivo que outro trabalho em andamento também está tocando."*

Isso continua igual depois da correção: `achados/indice.md` é **um arquivo por pasta que toda tarefa e toda correção escrevem**, e as skills agora mandam colocá-lo no stage de todo commit (`.claude/skills/executar-task/SKILL.md` passo 7, `.claude/skills/corrigir/SKILL.md`, `.claude/skills/revisar-spec/SKILL.md`). O próprio documento diz o contrário 110 linhas adiante, em `:156-159`: *"O índice é o único arquivo que dois documentos da mesma pasta escrevem, e a disputa não é hipótese: enquanto esta correção era escrita, outra sessão registrava rodadas em `tasks/correcoes/achados/indice.md`"* — e o código ganhou uma trava por causa disso (`tools/processo/revisoes.ts:506`).

Quem ler o registro em `/retro` ou `/validar` vai concluir que a disputa de arquivo compartilhado acabou. Não acabou: encolheu do arquivo inteiro para uma linha, e a linha de outro documento entra no commit deste.
**Correção exigida:** reescrever `:43-49` para o que de fato aconteceu — a separação reduz o efeito ao índice e não o encerra —, ou tirar esse bullet da lista de "efeitos que a separação encerra". E dizer, em `executar-task` passo 7 e em `corrigir`, o que fazer quando o `achados/indice.md` trouxer linha de outro documento no `git add`.

## Recomendações

**R1. Escopo (sua pergunta 1) — não vetaria, e o motivo é técnico, não de tolerância.** Mexer em `achadoDaRodada` é consequência do índice, não invasão: o parser `exigenciaDaRodada` tinha de existir para a célula do índice, e deixar `achadoDaRodada` no regex antigo manteria **dois critérios para a mesma pergunta** ("esta rodada exigiu algo?"), com o caso concreto de a rodada ser guardada e a célula sair `ver o bloco`. Fechar um item do `TODO.md` e abrir dois também não é implementação de tarefa futura — abrir item é registro. O que eu recortaria se fosse recortar alguma coisa é outra: a edição à mão de uma célula do índice (R3).

**R2. Aderência do conjunto de skills (sua pergunta 2): coerente, com um buraco.** Conferi os onze arquivos e `CLAUDE.md`/`docs/decisoes.md`: não sobrou instrução contraditória, e `grep achados-revisoes` em `.claude/`, `docs/`, `README.md` e `ROADMAP.md` não devolve nada vivo. Concordo que `retro.md` e `validacao.md` do F1 ficam como estão — e acrescento o argumento que falta no documento: as citações com número de linha **não ficam penduradas**, porque os três arquivos estavam rastreados e `git show HEAD:tasks/prd-identidade-e-tenancy/achados-revisoes.md` resolve `:5260` exatamente como antes. O buraco é outro: nenhuma skill diz que `tools/processo/separar-achados.ts` existe nem quando rodá-lo. O gatilho ("branch antiga devolve o formato único no merge") está só no cabeçalho do próprio script, que ninguém abre nessa hora. Uma linha em `executar-task` passo 7 ou em `corrigir`, no passo do merge/push, fecha.

**R3. A célula editada à mão contraria a regra que esta mesma correção escreve.** `.claude/skills/executar-task/SKILL.md` passa a dizer "Não edite a seção Revisões nem nada dentro de `achados/`. Quem escreve é o hook", e `CABECALHO_DO_INDICE` repete "Não edite à mão". Uma célula de `tasks/correcoes/achados/indice.md` foi editada à mão nesta correção. Está declarado no documento (`:128-135`), o que resolve a honestidade, mas não resolve o artefato: nada no índice distingue a linha gerada da linha escrita, e quem conferir índice contra blocos vai ler isso como defeito do gerador. Ou marque a célula (um sufixo tipo `— editado à mão, ver a correção 2026-09-22-…`), ou deixe a saída do gerador e ponha o texto melhor no bloco.

**R4. `tools/processo/separar-achados.ts:137` — o comentário "A origem é a única cópia até esta linha" é falso.** Os três `achados-revisoes.md` estavam rastreados no git; `git show HEAD:<caminho>` devolve os 237 blocos. Sua pergunta 4: **não exijo nada a mais.** Conferi a conservação por fora do código — 158/69/10 blocos nas origens em `HEAD`, 158/72/10 nos destinos, `comm` dos cabeçalhos com zero perdidos e três novos (as suas próprias rodadas do `test-engineer`, registradas depois da migração). Acumular + `conferirPlano` + `rmSync` por último é suficiente; dry-run e confirmação seriam cerimônia. Só corrija o comentário, que vende um risco que não existe.

**R5. `tools/processo/revisoes.ts:212-217` e `:325-338` — a célula do índice pode citar texto que não está no bloco que ela aponta.** `resumoDoAchado(mensagemFinal)` lê a mensagem inteira; `achadoDaRodada` corta o bloco em 80 linhas. Exigência abaixo da linha 80 vira célula de índice sem bloco correspondente — a versão menor do defeito que esta correção fecha. Disparou uma vez em 214 blocos, então não bloqueia; uma linha no comentário do corte de 80 basta.

**R6. Sua pergunta 3 (complexidade de `lerSecao` / `LeituraDaSecao` / `resumoDoAchado`): pesado para o que entrega, mas não achei caminho morto.** Percorri os ramos: `presente` e `declarouNada` só são lidos em `temSecaoSemDeclaracao` e são necessários lá; `SEM_CONTEUDO` e `COMECA_SEM_NADA` não se subsomem (`nenhum` sem ponto casa só o primeiro); cada ramo tem mutação na tabela do documento. Os nomes dizem o que fazem. Duas nits: `leituras` tem nome plural e devolve tupla de dois que os dois consumidores destroem por posição — um objeto `{ bloqueantes, recomendacoes }` lê melhor; e o `40` de `encurtar` (`espaco > LIMITE_DO_RESUMO - 40`) é número mágico sem nome.

**R7. Sua pergunta 5 (defeito do carimbo): deixar para outra correção é a decisão certa, e por um motivo mais forte que "é outro defeito".** Confirmei o defeito lendo `tools/processo/portao-local.ts:59` — `gravarInstantaneo(raiz, CHAVE_DO_PORTAO, …)` roda depois das suítes, e `mudouDeVerdade` então devolve `false` para o arquivo editado durante a corrida, **desligando** a comparação de horário de `avaliarCarimbo`. É real e é grave: o portão responde "válido" para código que nenhuma suíte viu. O motivo de não consertar aqui: o conserto muda o portão que **esta** correção precisa atravessar, e a correção passaria a ser certificada pelo portão que ela mesma está alterando. Duas coisas que eu acrescentaria ao item do `TODO.md`: o contorno até o conserto (conferir mtime contra `carimbo.inicio` à mão, ou rodar o portão depois da última edição — foi o que salvou este carimbo), e que `avaliarPortao` chama `alteracaoQueCaduca` e `avaliarCarimbo` **sem** passar o instantâneo (`tools/processo/revisoes.ts:423` e `:431`), enquanto o `conferir` passa. São dois critérios para a mesma pergunta, na direção oposta do defeito, e pertencem à mesma correção.

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/tools/processo/revisoes.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/processo/separar-achados.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/processo/portao-local.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-22-achado-de-revisao-nao-cabe-na-janela.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados/indice.md`, `/home/joaquimdp/Documentos/git/Educa.ia/.claude/skills/executar-task/SKILL.md`.

## test-engineer · 4ª rodada · REPROVADO · 2026-09-22 10:07:41 · `tasks/correcoes/2026-09-22-achado-de-revisao-nao-cabe-na-janela.md`

Auditoria feita em cópia em `/tmp` com `node_modules` por symlink e `.git` copiado. Nenhum arquivo da árvore foi tocado: os sha256 dos quatro arquivos de código no fim são idênticos aos do início (`68041b87…`, `7b09c6cc…`, `00d14f73…`, `e9434dcd…`) e `git status` segue com as mesmas 23 entradas. Baseline: **38 verdes** em `tools/processo`, `tsc -p tsconfig.json --noEmit` limpo.

VEREDITO: REPROVADO

**Cenários exigidos** (só o diff desde a 3ª rodada: `revisoes.test.ts` recs 6 e 7, `revisoes.ts` comentário/renomeação/constante, `separar-achados.ts` comentário, tabela nova de evidência, marca da célula manual): rec 6 aplicada e não enfraquecendo nada · rec 7 aplicada **e com dente** · renomeação `leituras`→`lerAsDuasSecoes` sem mudança de comportamento, provada e não só lida · `RECUO_MAXIMO_DO_CORTE` com o mesmo valor efetivo · comentário de `separar-achados.ts` verdadeiro · tabela nova reproduzível linha a linha · célula manual marcada · sem intermitência nova.

**Cobertos e conferidos por mim, por medição:**

- **Rec 6 — feita.** `tools/processo/revisoes.test.ts:573`, `expect(existsSync(...)).toBe(true)` antes do `readFileSync`. Não afrouxa: a mutação do `temSecaoSemDeclaracao` continua dando 1 vermelho, e agora com falha legível.
- **Rec 7 — feita e efetiva, era o ponto.** `revisoes.test.ts:625-627` (`numero === 3 ? ITEM_LONGO : …`, 20 das 100 rodadas). Com `encurtar` virando identidade eu media **1** vermelho na 3ª rodada; agora medi **2**, e o segundo é `o índice de uma funcionalidade inteira cabe no que se lê antes de cada tarefa`. A asserção de 161 passou a valer onde está escrita.
- **As doze linhas da tabela nova: todas reproduzem o nome do teste.** Rodei as doze uma a uma. Em 10 das 12 o teste nomeado é o único ou o primeiro vermelho. Nas outras duas ele é vermelho, mas não é o primeiro (ver recomendação 2).
- **Trava do índice removida: 10 vermelhos em 10 execuções** (o documento diz "9 de 10" — subestima, tudo bem). Suíte limpa: **38/38 verdes em 10 execuções seguidas**. Sem intermitência.
- **A renomeação não mudou comportamento — confirmo, com duas evidências.** Aritmética: `RECUO_MAXIMO_DO_CORTE = 40` em `espaco > LIMITE_DO_RESUMO - RECUO_MAXIMO_DO_CORTE` é `espaco > 120`, idêntico ao `- 40` literal; e o outro `40` de `resumoDoAchado` (`texto.length >= 40`, `:342`) corretamente **não** foi renomeado, porque é outra grandeza. Corpus real com o código atual: `{ total: 241, aprovados: 173, perdidos: 0, ganhos: 1, maxCelula: 161, células com ``` : 0, 'ver o bloco': 0 }` — os mesmos números da 3ª rodada mais as duas rodadas novas. O comportamento é o mesmo. **O que não existe é teste que provasse isso** — é o bloqueante abaixo.
- `separar-achados.ts:137-139` — comentário corrigido, reconhece o `git show HEAD:<caminho>` e justifica a ordem por outro motivo (merge não commitado). Verdadeiro agora.
- Documento `:43-53` reescrito: "um efeito que a separação **encerra**" (colisão de `##`) separado de "um que ela **reduz e não encerra**" (o índice compartilhado, de 646 KB para uma linha). A contradição com `:161-165` acabou. `.claude/skills/executar-task/SKILL.md:218` e `:222` e `.claude/skills/corrigir/SKILL.md:78` e `:81` cobrem o `git add` do índice com linha de outro documento e quando rodar `separar-achados.ts`.
- `tasks/correcoes/achados/indice.md:58` — célula marcada com `— *editado à mão, ver a correção 2026-09-22-…*`. Rec 4 fechada.
- Sem `.skip`, `.only`, teste comentado, `any`, `@ts-ignore`, mock escondendo a regra auditada, provedor pago.

## Bloqueantes

**B1. `tools/processo/revisoes.ts:313-322` — a precedência "bloqueante vence recomendação" é a regra que decide o texto de 63 das 241 células reais, e nenhum teste a prova. A linha que a implementa foi reescrita neste diff.**

`exigenciaDaRodada` devolve `bloqueantes.item ?? recomendacoes.item` (`:321`), e o JSDoc de `:318` declara a regra: *"O primeiro bloqueante, ou a primeira recomendação."* O documento repete em `:124-126`. Rodei duas mutações, as duas dentro do que mudou desde a 3ª rodada:

- `:321` → `return recomendacoes.item ?? bloqueantes.item` — **38/38 verdes, 0 vermelhos**;
- `:315` → `{ bloqueantes: lerSecao(linhas, /^Recomenda/i), recomendacoes: lerSecao(linhas, /^Bloqueantes/i) }`, que é exatamente a linha que a renomeação `leituras` → `lerAsDuasSecoes` criou — **38/38 verdes, 0 vermelhos**.

Não é hipotético. Gerei a célula de todos os 241 blocos reais de `tasks/*/achados/` com o código atual e com a precedência invertida: **63 células mudam de conteúdo**, e em todas elas o índice passaria a mostrar uma recomendação no lugar do bloqueante. Exemplo (`tasks/correcoes/achados/2026-09-16-rodada-antes-do-redis-do-despachante.md`, rodada de `2026-09-16 00:30:18`):

```
hoje:      A correção inteira não tem teste que a prove. `apps/despachante/src/montagem.ts:150-165` (`pronto`)
invertida: `apps/despachante/test/janela.int.test.ts:131`: o nome promete "o Redis ainda conectando", mas o te…
```

Isso é o defeito que esta correção existe para fechar — a linha do índice deixando de trazer a exigência que importa — e o portão de teste não o pegaria. Motivo da lacuna: 237 dos 241 blocos reais têm as duas seções, mas **nenhuma rodada da suíte inteira tem item de verdade nas duas ao mesmo tempo**. Em `revisoes.test.ts:424`, `:451` e `:463` só há `Bloqueantes:`; em `:431` e `:459` o bloqueante é `nenhum` declarado; em `:505` e `:508` idem.

Respondendo à sua pergunta diretamente: **a renomeação não mudou comportamento** — provei por leitura e pela varredura do corpus. Mas essa confirmação é minha, não da suíte, e é essa diferença que eu bloqueio: uma renomeação só pode ser declarada neutra quando a suíte a segura.

**Correção exigida:** uma rodada com item real nas duas seções — `VEREDITO: REPROVADO`, `Bloqueantes:\n- <X>`, `Recomendações:\n- <Y>` — afirmando que a célula do índice contém `<X>` e **não** contém `<Y>`. Com ela, as duas mutações acima ficam vermelhas. Acrescente a linha correspondente à tabela de evidência.

## Recomendações

1. **`tools/processo/revisoes.ts:254` — `RECUO_MAXIMO_DO_CORTE` também não tem dente.** Trocar `40` por `0` deixa 38/38 verdes (com `0`, `espaco > 160` é inalcançável e o corte nunca recua, partindo palavra). Risco baixo e puramente cosmético, mas a constante foi batizada neste diff e nada fixa o valor. Se entrar teste, ele cabe no mesmo caso de `:445`.
2. **Documento `:88-101` — o rótulo da coluna é "Primeiro teste que fica vermelho", e em 2 das 12 linhas o teste nomeado é vermelho mas não é o primeiro.** Linha 1 (`caminhoDoAchado` → `NOME_ACHADOS`): **11** vermelhos, e o primeiro na ordem da suíte é `o revisor registra a própria rodada, e o commit só passa quando todos aprovaram depois da correção`, em `revisoes.test.ts`; o nomeado (`separa por documento, com uma linha de índice por bloco`) é o primeiro só dentro de `separar-achados.test.ts`. Linha 4 (`resumoDoAchado` fixo): **5** vermelhos, e o nomeado (`o resumo do índice sai do corpo do bloco, não do cabeçalho`) é o **último**. A substância da tabela está de pé — as doze mutações são pegas, pelo teste nomeado em 12 de 12 — e o método novo é melhor que a contagem. O que não se sustenta é a palavra "Primeiro", que depende da ordem entre arquivos. Rotule a coluna "Teste que pega a mutação" e o problema acaba; é a quarta tentativa nessa tabela e vale fechá-la por definição, não por medição.
3. **Documento `:69-71` — os bytes por linha do índice mudaram outra vez, e por causa desta própria correção.** O texto diz "vão de 229 bytes por linha a 291 no pior caso real … contra 238 e 242 nas outras duas". Medi agora: máximos **305** (`tasks/correcoes/`, 73 linhas), **242** (`prd-identidade-e-tenancy`, 158), **238** (`prd-estabilidade-da-esteira`, 10); medianas 252 / 219 / 217. Os 291 viraram 305 porque a célula que você marcou à mão na rec 4 ficou mais longa. A conclusão não muda (305 > 260), o número sim.
4. **`tools/processo/revisoes.test.ts:648`** — o comentário ficou para trás do documento: diz "de 229 bytes por linha (`N_task`) a **271** (slug de correção)", enquanto o documento corrigido já diz 291 e o real é 305. Um comentário e um documento que discordam sobre o mesmo dado é onde a próxima medição vai começar errada.
5. Documento `:101` — "a trava do índice sai de `registrar` … (9 de 10 execuções)". Medi **10 de 10**. Subestimar não faz mal, mas se o número for atualizado a linha fica igual às outras onze.

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/tools/processo/revisoes.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/processo/revisoes.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/processo/separar-achados.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-22-achado-de-revisao-nao-cabe-na-janela.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados/indice.md`.

## test-engineer · 5ª rodada · APROVADO · 2026-09-22 10:19:05 · `tasks/correcoes/2026-09-22-achado-de-revisao-nao-cabe-na-janela.md`

VEREDITO: APROVADO

Auditoria feita em cópia em `/tmp` com `node_modules` por symlink e `.git` copiado. Nada da árvore foi tocado: os sha256 dos três arquivos de código no fim são os mesmos do início (`68041b87…`, `e12fdb41…`, `00d14f73…`) e `git status` segue com 23 entradas. Baseline: **39 verdes** em `tools/processo`.

**Confirmei antes de auditar que o diff é o que você diz:** `tools/processo/revisoes.ts` está em `68041b87…` e `separar-achados.ts` em `00d14f73…`, exatamente os hashes que `.processo/conteudo.json` gravou para `…|test-engineer|4`. Só `revisoes.test.ts` mudou (`7b09c6cc…` → `e12fdb41…`). Auditei só isso e o documento.

Cenários exigidos (o bloqueante e as recomendações da 4ª rodada): precedência bloqueante × recomendação com item real nas duas seções · `RECUO_MAXIMO_DO_CORTE` com dente · rótulo da coluna fechado por definição · bytes por linha concordando nos dois lugares · trava 10 de 10 · sem intermitência nova.

Cobertos e conferidos por mim, por medição:

- **Bloqueante da 4ª rodada — fechado, e as duas mutações agora são vermelhas.** `tools/processo/revisoes.test.ts:581`. Rodei as duas que eu havia usado: `revisoes.ts:321` → `return recomendacoes.item ?? bloqueantes.item` dá **1 vermelho** (era 0), e é o teste novo; `revisoes.ts:315` com os regex de `lerAsDuasSecoes` trocados, idem **1 vermelho** (era 0). A asserção é de resultado (`toBe('o bloqueante que tem de aparecer')` mais o `not.toContain('roubar a célula')`), não de "rodou". A precedência inversa — bloqueante `nenhum` e recomendação com item — já estava coberta em `:431`/`:459`, então as duas direções ficam fechadas.
- **Recomendação 1 — feita e efetiva.** `RECUO_MAXIMO_DO_CORTE = 0` dá **1 vermelho** (era 0), o mesmo teste. E o dente é o certo: com `0` o corte não recua, `LONGO[semReticencias.length]` deixa de ser espaço e `semReticencias.endsWith(PALAVRA)` cai. O fixture de palavras de 10 letras põe o caractere 160 dentro da 15ª palavra, como você descreveu — conferi a aritmética e ela bate com o vermelho medido.
- **Juntar as duas coisas num caso só:** aceito. O fixture longo serve às duas, e a asserção de precedência é sobre outra linha do mesmo índice.
- **Estabilidade:** 8 execuções seguidas da suíte, **39/39 verdes** em todas. Nenhuma intermitência nova. `tsc -p tsconfig.json --noEmit` limpo.
- **Portão:** `node tools/processo/portao-local.ts conferir tasks/correcoes/2026-09-22-achado-de-revisao-nao-cabe-na-janela.md` responde `portão local válido para o código atual (typecheck, lint, test)`. Conferi o horário à mão, que é o que o defeito do carimbo exige: `revisoes.test.ts` tem mtime `13:08:58.314Z` e `revisoes.ts` `13:08:31.886Z`, os dois **anteriores** ao início `13:08:59.162Z`. Sua conferência do `portao-local.ts` (mtime mexido, conteúdo idêntico ao `HEAD`) procede.
- **Recomendação 2 — fechada por definição, como eu havia sugerido.** A coluna virou "Teste que pega a mutação", o documento explica em `:117-123` por que a contagem era ruído, e as três mutações novas entraram na tabela (`:105-107`). É a primeira versão dessa tabela que não depende de um número que muda.
- **Recomendação 5 — feita**, `:107` diz 10 de 10.
- **Recomendação 3/4 (bytes) — o argumento se sustenta, e é melhor que atualizar o número.** Você pediu julgamento, então: sim. Um teto por linha inteira mede o comprimento do slug do documento, que é dado que entra pela porta, não orçamento que o código controla. A prova de que não é retórica é que o número mudou *por causa desta correção* — a marca `— editado à mão` alongou a linha mais longa de 291 para 305. Medi agora os três índices: **305 / 242 / 238**, os números que você registrou. E a asserção que ficou no lugar (`célula <= 161`) é sobre o que `encurtar` decide e tem dente duas vezes (identidade em `:488`, e agora `RECUO_MAXIMO_DO_CORTE` em `:581`). Trocar uma asserção sobre dado por uma sobre regra é o conserto certo.
- Sem `.skip`, `.only`, `xit`, teste comentado, `any`, `@ts-ignore`, mock escondendo a regra auditada, provedor pago — varri os dois arquivos de teste.

**Bloqueantes:** nenhum. O bloqueante da 4ª rodada e as recomendações 1 a 5 estão fechados, e os dois primeiros estão provados por mutação que eu rodei.

Recomendações (não bloqueiam, ficam registradas para o `/validar`):

1. `tasks/correcoes/2026-09-22-achado-de-revisao-nao-cabe-na-janela.md:69` — o texto ainda abre com "vão de **229** bytes por linha a 305", e na mesma frase diz "contra 238 e 242 nas outras duas pastas". Se os máximos das outras duas são 238 e 242, o piso da faixa é 238, não 229 — e `revisoes.test.ts:677` já diz 238. É o terceiro número para o mesmo fato, no parágrafo cujo argumento é justamente que esse número não se estabiliza. Trocar `229` por `238` alinha os dois lugares e tira a única munição contra o argumento.
2. Mesmo documento, `:127` — "Sem a trava, **9 de 10** vermelhos", enquanto `:107` já diz 10 de 10. Duas linhas do mesmo documento com números diferentes para a mesma medição.
3. `tools/processo/revisoes.ts:337` — o fallback `'ver o bloco'` segue sem teste (minha rec 8 da 3ª rodada). Concordo em deixar aberto: conferi de novo, não aparece em nenhum dos blocos reais. Fica registrado para quem mexer ali.
4. `tools/processo/revisoes.test.ts:581` — o nome cobre duas regras independentes (precedência e recuo do corte). Quando uma delas quebrar, o nome não dirá qual. É preço aceitável por reaproveitar o fixture, mas vale uma linha de comentário separando as duas metades das asserções.

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/tools/processo/revisoes.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/processo/revisoes.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-22-achado-de-revisao-nao-cabe-na-janela.md`.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-22 10:26:12 · `tasks/correcoes/2026-09-22-achado-de-revisao-nao-cabe-na-janela.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok (correção sem techspec; o documento é a especificação e o código bate com ele)
Portão local: carimbo válido — `conferir` responde "portão local válido para o código atual (typecheck, lint, test)". Conferi à parte: `inicio` 2026-09-22T13:08:59.162Z, mtime mais recente entre os quatro arquivos de código 10:08:58.31 (local, UTC−3), e os quatro hashes de `.processo/conteudo.json["portao"]` batem com o conteúdo em disco. `suitesExigidas` para `test-engineer` + `revisor-geral` é typecheck/lint/test — sem `--e2e` e sem `--infra`, e a correção não toca `infra/`, `tools/testes/` nem `tools/ci/compose.ts`, então está certo. Nenhuma suíte lê os `.md` alterados (só `docs/runbook.md` tem esse tratamento, e ele não mudou).
Bloqueantes: nenhum

O que eu de fato verifiquei, já que você pediu os três pontos:

**(a) O que as minhas recomendações provocaram.** R4 (`tools/processo/separar-achados.ts:137-139`), R5 (`tools/processo/revisoes.ts:214-215`) e R6 (`lerAsDuasSecoes`, `RECUO_MAXIMO_DO_CORTE`) estão corretos e descrevem o código de verdade — o comentário do corte de 80 linhas bate com `registrar` passando `mensagemFinal` inteira para `resumoDoAchado` (`revisoes.ts:514`) enquanto `achadoDaRodada` trunca. R3 está aplicada e é a única célula do corpus fora do gerador.

**(c) O documento contra o código, medido e não lido.** Repliquei `achadoDaRodada`, `exigenciaDaRodada`, `temSecaoSemDeclaracao` e `resumoDoAchado` sobre os 243 blocos reais dos três `achados/`: **0 blocos sumiriam** com o critério novo, 1 sobrevive só por `temSecaoSemDeclaracao` (o caso documentado), e **0 resumos** caem no fallback `'ver o bloco'`. Conservação da migração: 158/158 e 10/10 contra o `HEAD`, e `tasks/correcoes` 75 = 69 + 6 rodadas desta correção. Cruzei as 243 linhas de índice contra os blocos por `(revisor, rodada, fim)`: **0 sem bloco, 0 com documento divergente, 0 linhas com contagem de coluna errada**. As três células que começam com "nenhum/nenhuma" são conteúdo legítimo, e a fronteira de `COMECA_SEM_NADA` as trata certo.

Recomendações:
- `tasks/correcoes/2026-09-22-achado-de-revisao-nao-cabe-na-janela.md:74` — "o máximo real nos três índices é 161" é falso como escrito: o máximo real é **197**, na célula editada à mão (`tasks/correcoes/achados/indice.md:58`). 161 é o máximo do que o gerador produz. O parágrafo já diz que a marca "alongou a linha mais longa", mas a frase isolada é o tipo de número que a próxima pessoa cita sem reler o contexto. Escreva "das células geradas".
- `…-nao-cabe-na-janela.md:69-70` — "238 bytes por linha a 305" são caracteres, não bytes. Em bytes os três máximos são 254, 250 e 322.
- `…-nao-cabe-na-janela.md:197` — "onze arquivos": são **9** que passam a mandar ler o índice (`executar-task`, `executar-tasks`, `executar-review`, `corrigir`, `criar-tasks/SKILL.md`, `criar-tasks/task-template.md`, `retro`, `revisar-spec`, `validador`) e 12 com `CLAUDE.md`, `TODO.md` e `docs/decisoes.md`. Nenhum dos dois é onze.
- `TODO.md:283` — o item novo "Duas sessões na mesma árvore não passam pelo portão" não aparece em "O que ficou de fora" do documento, ao contrário do defeito do carimbo, que aparece. Achado registrado e não declarado é exatamente o que o `/validar` procura depois.
- `tools/processo/revisoes.ts:246` e `…-nao-cabe-na-janela.md:140` — os dois dizem "o ponto é o que separa a resposta do resto"; o regex aceita ponto **ou ponto e vírgula** (`/^(nenhum[ao]?|n\/a|nada)\s*[.;]/i`). Uma palavra a mais no comentário fecha.
- `tools/processo/revisoes.ts:258` — `ATE_A_RAIZ` é global e casa `\/\S*?\/` antes de **qualquer** segmento `apps|packages|infra|e2e|tools|tasks|docs`, não só o primeiro. Um caminho como `apps/api/src/tools/x.ts` vira `appstools/x.ts` na célula do índice. Hoje é inofensivo — `git ls-files` não tem nenhum caminho com essas palavras em segmento não inicial —, mas o dia em que alguém criar `apps/api/src/tools/` o índice passa a mentir o caminho em silêncio, e é justamente o caminho que serve para abrir o arquivo. Ancore o corte no início do token, ou troque por um `replace` não global.
- `.claude/skills/executar-task/SKILL.md:221-223` e `.claude/skills/corrigir/SKILL.md:81-82` — a instrução de rodar `separar-achados.ts` no meio do commit não é acionável até o fim. O script apaga um arquivo rastreado e escreve os `achados/` de **vários** documentos, e o mesmo item manda "stage apenas os arquivos desta tarefa, nunca `git add -A`". Quem seguir os dois ao pé da letra commita sem a deleção e sem os arquivos novos. Diga o que preparar: a deleção do `achados-revisoes.md` e a pasta `achados/` inteira.
- `.claude/skills/executar-task/SKILL.md:164` (137 caracteres) e `.claude/skills/revisar-spec/SKILL.md:99` (122) estouraram a quebra de linha do resto dos arquivos.
