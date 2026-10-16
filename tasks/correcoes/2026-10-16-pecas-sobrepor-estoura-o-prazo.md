# Correção — a galeria leva mais da metade dos 30 s do e2e só para abrir, porque baixa dezenas de pedaços em cascata na rede lenta do perfil

**Origem:** esteira run 38914509279 da `spec/pele-e-casca` (`4f453d0`): `e2e/pecas-sobrepor.spec.ts:556` (o diálogo, a confirmação e o painel, nos temas claro e escuro) em `Test timeout of 30000ms exceeded` no `celular` (32,1 s e 32,3 s). Na mesma execução, perto do limite no celular: `pecas-galeria.spec.ts:15` (28,2 s), `pecas-ia.spec.ts:443` (27,8 s), `pecas-sobrepor.spec.ts:172` (27,7 s) e `pecas-ia.spec.ts:173` (26,7 s). O e2e 3/5 da mesma execução caiu por 502 do Docker Hub e não é desta correção.
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`, `frontend-reviewer`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. -->

## Sintoma

Os dois casos do `sobrepor:556` terminam aos 32 s no `celular`, claro e escuro. O mesmo caso passou no `chromebook` da mesma execução. Os outros quatro fecham entre 26,7 e 28,2 s no `celular`, a dois ou três segundos do prazo. Nenhum falha por asserção: é o relógio de 30 s do Playwright.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa.

## Causa

**Tempo, e o tempo é de rede, não de asserção nem de CPU.** Todo caso da galeria começa em `abrirGaleria` (`e2e/__fixtures__/galeria.ts`), que abre `/galeria` com a rede do perfil (Fast 3G no `chromebook`, rede móvel lenta no `celular`: 560 a 600 ms de latência por pedido). A galeria é o chunk `galeria-*.js` mais dezenas de pedaços `pecas-*.js` e `parte-*.js`, quase todos de 0,2 a 5 kB; a web de teste fala HTTP/1.1 (confirmado com `curl`), o navegador abre seis conexões por servidor, e cada rodada de seis pedidos custa a latência inteira. Medido aqui, no `chromebook`, só com `abrirGaleria` e depois o primeiro `h1`:

| Condição na abertura de `/galeria` | Tempo |
|---|---|
| sem limitação nenhuma | 0,46 s |
| só a CPU ×4 | 0,78 s |
| só a rede do perfil | 6,49 s |
| CPU ×4 e rede do perfil (o que o caso paga) | 6,77 s |

Os ~6,5 s são a latência multiplicada pelas rodadas de pedidos; a CPU ×4 não pesa. O caso do `sobrepor:556` soma a isso o axe quatro vezes sobre a página inteira com o diálogo aberto (1,3 a 1,6 s cada, medido aqui) e cerca de 1 s de cliques e leituras: ~14 s aqui e 32 s no runner da esteira, onde cada trecho com CPU custa o dobro. Os outros quatro casos perto do limite têm o mesmo começo, e é por isso que estão todos a dois ou três segundos do prazo: a abertura da galeria é o maior custo comum, e é o único que a esteira não esconde. Cada caso dos dez specs que chamam `abrirGaleria` (perto de 280, nos dois projetos) paga os mesmos ~6,5 s.

O produto está certo: o desenho em muitos pedaços pequenos é o do orçamento de carregamento da escola (`apps/web/nome-dos-chunks.ts`), e a galeria só existe no build do e2e (`VITE_COM_GALERIA=1`). Quem lê a galeria não é o aluno em rede de escola; é o teste, e nenhum caso afirma nada sobre o tempo que ela leva para baixar.

Não é "aumentar o timeout": o prazo de 30 s fica. E nenhuma asserção muda ou sai.

## Teste que reproduz

Reproduzir o tempo do runner não é determinístico, mas o que o produz é: **a rede do perfil paga em cada pedaço da galeria**. O piso dela é fixo (562,5 ms de latência no Fast 3G, 600 no celular) e a vazão soma tempo por byte: nenhum pedido termina antes disso enquanto a rede do perfil estiver ligada. Três testes novos em `e2e/pecas-galeria.spec.ts` (`a abertura da galeria não paga a latência do perfil`), nos dois projetos (6 casos; foram seis testes, 12 casos, e o `tools/ci/esteira.test.ts` reprovou o teto de casos da fatia 1: 198, contra 197):

1. `nenhum pedaço da galeria espera a latência do perfil para chegar`: a duração de cada `/assets/*.js` (`PerformanceResourceTiming.duration`; o primeiro byte não carrega a latência emulada, medido aqui) fica abaixo de 500 ms, com pelo menos 20 pedaços. **Vermelho antes** (com o auxiliar ainda sem efeito, `chromebook` e `celular`): o pedaço mais lento levava mais de 500 ms, o piso;
2. `depois de aberta, e também depois de um carregamento que falha, a rede do perfil está de volta`: um pedido novo do maior pedaço leva pelo menos 500 ms e 80% de `latência + bytes ÷ descida` do perfil (lido do `perfil` do projeto); um POST de 120 kB leva pelo menos 80% de `latência + bytes ÷ subida`; e, depois de um `carregarSemRedeLenta` cujo `carregar` lança, o erro sobe e o pedido seguinte paga a latência (o `finally`);
3. `dentro de carregarSemRedeLenta o pedido não paga a latência, a descida nem a subida; numa página que não veio do `test` do perfil, falha alto`: o outro lado nas três medidas, e o auxiliar que falha em página sem perfil. **Vermelho antes**: 1,18 s dentro, e o auxiliar resolvia sem limitar nada.

**Folga dos tetos de 500 ms com a rede livre** (rodada 1 do `test-engineer`): 12 execuções (6 por projeto, `--workers 2`, CPU ×4), medidas depois da correção. O pedaço mais lento do caso 1 levou de 21 a 44 ms; o pedido de descida do caso 3, de 16 a 21 ms; o de subida de 120 kB, de 37 a 41 ms. A folga é de mais de dez vezes (500 ms contra 44 ms no pior), e mesmo um runner duas vezes mais lento não a encosta. Quanto ao mínimo da descida do caso 2, ele não é um tamanho de pedaço: é `bytes ÷ descida do perfil ≥ 200 ms` (`DESCIDA_MINIMA_DO_PERFIL_MS`), e o maior pedaço de hoje dá bem mais que isso; o corte dos chunks tem de encolher o maior pedaço para menos de uns 36 kB para o caso reclamar, e a mensagem diz o que aconteceu.

O caso 2 passa sem a correção por construção (a rede do perfil estava sempre ligada): quem o prova são as mutações da seção abaixo, que tiram o `finally`, devolvem a rede errada e zeram cada campo do perfil.

Tempo, medido no mesmo ambiente, com os 2 trabalhadores da esteira (`--workers 2`), antes e depois de `abrirGaleria` abrir sem a rede do perfil:

| Caso | Antes (`chromebook` / `celular`) | Depois, três repetições |
|---|---|---|
| `pecas-sobrepor.spec.ts:556` (claro e escuro) | 14,3–14,6 s / 15,7 s (na esteira: 32,1 e 32,3 s) | 8,0–8,3 s / 8,2–8,4 s |
| `pecas-sobrepor.spec.ts:172` | (na esteira, 27,7 s) | 7,3–7,5 s / 7,4–7,5 s |
| `pecas-ia.spec.ts:443` (claro e escuro) | (na esteira, 27,8 s) | 7,3–7,5 s / 7,3–7,8 s |
| `pecas-ia.spec.ts:173` | (na esteira, 26,7 s) | 6,8–7,1 s / 6,7–6,9 s |
| `pecas-galeria.spec.ts:15` | (na esteira, 28,2 s) | 6,9–7,2 s / 7,0–7,2 s |

Estabilidade: `npx playwright test e2e/pecas-galeria.spec.ts e2e/pecas-ia.spec.ts e2e/pecas-sobrepor.spec.ts --repeat-each 3 --workers 2`: **180 de 180 verdes**, o caso mais lento a 8,4 s. Com a correção pronta (três testes novos), os dez specs que chamam `abrirGaleria`, com `--workers 2`: **278 de 278 verdes** (nenhum caso dependia de a galeria abrir na rede lenta), e os três testes novos em `--repeat-each 3`: 18 de 18. A abertura da galeria passou de ~6,8 s para ~0,9 s.

## Correção

Só teste muda; o produto não.

- `e2e/__fixtures__/perfis.ts`: o fixture `page` guarda a sessão do CDP que aplicou o perfil, e `carregarSemRedeLenta(page, carregar)` tira a limitação **de rede** (a CPU ×4 fica) enquanto `carregar` roda e devolve a rede do perfil no `finally`. Uma segunda sessão do CDP não vale: a limitação da primeira continua, medido aqui; por isso o auxiliar usa a mesma;
- `e2e/__fixtures__/galeria.ts`: `abrirGaleria` abre `/galeria` e espera o `h1` dentro de `carregarSemRedeLenta`. A galeria não chama a API e não tem sessão: tudo o que ela baixa chega antes de o `h1` aparecer, e depois dele não há mais pedido. Os comentários que dizem que a galeria baixa na rede lenta do perfil (`PRAZO_DA_GALERIA_MS`) passam a dizer o que vale;
- `e2e/pecas-galeria.spec.ts`: os casos acima.

O que **não** muda: o perfil do projeto (CPU ×4, Fast 3G e rede móvel lenta, conferidos por `tools/ci/playwright.test.ts`), as interações dos casos (cliques, teclas, axe, medidas) e todas as asserções, que seguem rodando com a rede do perfil ligada. Só a primeira carga da galeria, que ninguém afirma, deixa de pagá-la.

## Mutações

```mutacao
arquivo: e2e/__fixtures__/perfis.ts
teste: e2e/pecas-galeria.spec.ts › dentro de carregarSemRedeLenta o pedido não paga
 const aplicado = sessoesDoPerfil.get(page)
-if (aplicado === undefined) throw new Error('a página não veio do `test` de perfis.ts: ela não tem rede de perfil para tirar nem para devolver')
 await limitarARede(aplicado.sessao, REDE_SEM_LIMITE)
```

```mutacao
arquivo: e2e/__fixtures__/perfis.ts
teste: e2e/pecas-galeria.spec.ts › nenhum pedaço da galeria espera a latência do perfil
-await limitarARede(aplicado.sessao, REDE_SEM_LIMITE)
 try {
```

```mutacao
arquivo: e2e/__fixtures__/perfis.ts
teste: e2e/pecas-galeria.spec.ts › depois de aberta, e também depois de um carregamento que falha
 } finally {
-await limitarARede(aplicado.sessao, aplicado.perfil.rede)
 }
```

```mutacao
arquivo: e2e/__fixtures__/perfis.ts
teste: e2e/pecas-galeria.spec.ts › depois de aberta, e também depois de um carregamento que falha
-await limitarARede(aplicado.sessao, aplicado.perfil.rede)
+await limitarARede(aplicado.sessao, REDE_SEM_LIMITE)
```

```mutacao
arquivo: e2e/__fixtures__/perfis.ts
teste: e2e/pecas-galeria.spec.ts › depois de aberta, e também depois de um carregamento que falha
-try {
-return await carregar()
-} finally {
-await limitarARede(aplicado.sessao, aplicado.perfil.rede)
-}
+const resultado = await carregar()
+await limitarARede(aplicado.sessao, aplicado.perfil.rede)
+return resultado
```

```mutacao
arquivo: e2e/__fixtures__/perfis.ts
teste: e2e/pecas-galeria.spec.ts › nenhum pedaço da galeria espera a latência do perfil
-const REDE_SEM_LIMITE: CondicaoDeRede = { nome: 'sem limite', latenciaMs: 0, downloadBytesPorSegundo: -1, uploadBytesPorSegundo: -1 }
+const REDE_SEM_LIMITE: CondicaoDeRede = { nome: 'sem limite', latenciaMs: 562.5, downloadBytesPorSegundo: -1, uploadBytesPorSegundo: -1 }
```

```mutacao
arquivo: e2e/__fixtures__/perfis.ts
teste: e2e/pecas-galeria.spec.ts › dentro de carregarSemRedeLenta o pedido não paga a latência
-const REDE_SEM_LIMITE: CondicaoDeRede = { nome: 'sem limite', latenciaMs: 0, downloadBytesPorSegundo: -1, uploadBytesPorSegundo: -1 }
+const REDE_SEM_LIMITE: CondicaoDeRede = { nome: 'sem limite', latenciaMs: 0, downloadBytesPorSegundo: 180_000, uploadBytesPorSegundo: -1 }
```

```mutacao
arquivo: e2e/__fixtures__/perfis.ts
teste: e2e/pecas-galeria.spec.ts › dentro de carregarSemRedeLenta o pedido não paga a latência
-const REDE_SEM_LIMITE: CondicaoDeRede = { nome: 'sem limite', latenciaMs: 0, downloadBytesPorSegundo: -1, uploadBytesPorSegundo: -1 }
+const REDE_SEM_LIMITE: CondicaoDeRede = { nome: 'sem limite', latenciaMs: 0, downloadBytesPorSegundo: -1, uploadBytesPorSegundo: 84_375 }
```

```mutacao
arquivo: e2e/__fixtures__/perfis.ts
teste: e2e/pecas-galeria.spec.ts › depois de aberta, e também depois de um carregamento que falha
-latency: rede.latenciaMs,
+latency: 0,
```

```mutacao
arquivo: e2e/__fixtures__/perfis.ts
teste: e2e/pecas-galeria.spec.ts › depois de aberta, e também depois de um carregamento que falha
-downloadThroughput: rede.downloadBytesPorSegundo,
+downloadThroughput: -1,
```

```mutacao
arquivo: e2e/__fixtures__/perfis.ts
teste: e2e/pecas-galeria.spec.ts › depois de aberta, e também depois de um carregamento que falha
-uploadThroughput: rede.uploadBytesPorSegundo,
+uploadThroughput: -1,
```

```mutacao
arquivo: e2e/__fixtures__/perfis.ts
teste: e2e/pecas-galeria.spec.ts › nenhum pedaço da galeria espera a latência do perfil
-sessoesDoPerfil.set(page, { sessao: cdp, perfil })
```

```mutacao
arquivo: e2e/__fixtures__/galeria.ts
teste: e2e/pecas-galeria.spec.ts › nenhum pedaço da galeria espera a latência do perfil
-await carregarSemRedeLenta(page, async () => {
-await page.goto('/galeria')
-await expect(page.getByRole('heading', { level: 1, name: 'Galeria de peças' })).toBeVisible({ timeout: PRAZO_DA_GALERIA_MS })
-})
+await page.goto('/galeria')
+await expect(page.getByRole('heading', { level: 1, name: 'Galeria de peças' })).toBeVisible({ timeout: PRAZO_DA_GALERIA_MS })
```

```mutacao
arquivo: e2e/pecas-galeria.spec.ts
teste: e2e/pecas-galeria.spec.ts › depois de aberta, e também depois de um carregamento que falha
-const maior = pedacos.reduce<PerformanceResourceTiming | undefined>((atual, pedaco) => (atual === undefined || pedaco.encodedBodySize > atual.encodedBodySize ? pedaco : atual), undefined)
+const maior = pedacos.reduce<PerformanceResourceTiming | undefined>((atual, pedaco) => (atual === undefined || pedaco.encodedBodySize < atual.encodedBodySize ? pedaco : atual), undefined)
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | Os títulos dos dois últimos testes são longos demais para o relatório do Playwright; a explicação cabe no comentário do `describe` | Recusada: os blocos de "Mutações" citam o título de cada teste pelo nome (`teste: e2e/pecas-galeria.spec.ts › …`); renomear obriga a reescrever os blocos que os citam, e o custo não paga a leitura do relatório |
| frontend-reviewer (1ª) | Na foto `coordenacao--galeria--celular-6.png` aparece o texto literal `&lt;b&gt;massa molar&lt;/b&gt;` na amostra da resposta do Assistente; vale um rótulo dizendo isso | Recusada: é código de produto em `apps/web`, fora de uma correção que só mexe em teste, e a própria galeria diz "Não é uma tela do produto"; o revisor disse que não bloqueia |
| frontend-reviewer (1ª) | O tempo de baixar a galeria na rede lenta deixa de ser exercitado pelos casos dela; confirme na validação que esse orçamento tem teste próprio | Validação: o Validador confere. `apps/web/nome-dos-chunks.test.ts` existe; ninguém leu se ele cobre o orçamento de carregamento, e isso não é desta correção |
| test-engineer (1ª), revisor-geral (1ª) | O mínimo de 100 kB do maior pedaço depende do corte dos chunks; `pedidoNovo` não usa o mesmo critério de `duracaoDosPedacosDeJs` e ordena o array do `filter` | Atendidas: o mínimo agora vem do perfil (`DESCIDA_MINIMA_DO_PERFIL_MS`), `pedidoNovo` filtra `/assets/` como o outro e usa `reduce`. A folga dos tetos de 500 ms está medida acima |
| revisor-geral (2ª), test-engineer (2ª) | `e2e/pecas-galeria.spec.ts:168`: o `perfil?.rede.downloadBytesPorSegundo ?? 1` deixa a asserção passar sem medir se faltar o perfil; ler o perfil uma vez no começo do caso, falhando alto | Recusada: os dois revisores dizem que o caminho não é alcançado hoje, porque `tempoMinimoDoPerfil` lança na linha seguinte; aprovada sem exigência |
| test-engineer (2ª) | Comentário de `DESCIDA_MINIMA_DO_PERFIL_MS`: citar também os 150 ms do celular e dizer que o mínimo é o limite de detecção, e não a margem de trabalho | Recusada: só comentário, não muda o que o teste prova; mexer no arquivo caducaria de novo os dois revisores de teste |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-16 12:33:45 | 2026-10-16 12:34:19 | `frontend-reviewer` | 1 | APROVADO | a6dadfb9eda8764ef |
| 2026-10-16 12:33:43 | 2026-10-16 12:34:23 | `revisor-geral` | 1 | APROVADO | a8e7f76bc65c73a35 |
| 2026-10-16 12:33:41 | 2026-10-16 12:35:30 | `test-engineer` | 1 | APROVADO | a081ca6b653409db2 |
| 2026-10-16 12:41:31 | 2026-10-16 12:41:51 | `revisor-geral` | 2 | APROVADO | a744bb97a1adc7b37 |
| 2026-10-16 12:41:28 | 2026-10-16 12:42:06 | `test-engineer` | 2 | APROVADO | a9c51e63da75fbe34 |
