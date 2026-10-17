# Achados das revisões — `tasks/correcoes/2026-10-17-material-processando-estoura-o-prazo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-17 16:37:34 · `tasks/correcoes/2026-10-17-material-processando-estoura-o-prazo.md`

VEREDITO: APROVADO

**Cenários exigidos:** esta correção mexe só no teste. Ela faz o caso de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/material.spec.ts:180` caber no relógio do Playwright e precisa manter tudo o que ele provava:
- com a leitura em andamento, a tela consulta sozinha;
- a linha troca "Processando" por "Pronto · 6 páginas";
- o anúncio "Um material está sendo lido." aparece;
- quando fica pronto, a consulta para e não sobra leitura repetida.

Ela também precisa mostrar que a falha vinha do tempo do teste e não da tela. Permissão, isolamento e concorrência não se aplicam aqui. Esses casos são das outras tarefas do Material e esta não os altera.

**Cobertos:**
- **O diff só acrescenta o relógio maior.** São o `test.slow()` e um comentário com o motivo, em `e2e/material.spec.ts:181-183`. Nenhuma asserção mudou ou saiu. A espera de 4 s em `:217`, que prova que a consulta parou, continua no teste. O `PRAZO_DA_LEITURA_MS` (30 s) também não mudou, e agora fica dentro de um relógio de 90 s.
- **O teste continua falhando se a regra cair.** Os 4 s de espera cobrem mais de duas voltas de 1,5 s. Se a tela não parasse de consultar, `expect(leituras).toBe(depoisDePronto)` em `:218` falharia. Se a tela não consultasse sozinha, a terceira leitura (a que responde `pronto`) não aconteceria e `:212` falharia.
- **O vermelho reproduz a falha certa.** Com relógio menor (`--timeout=18000`), o mesmo caso estoura o tempo, como na esteira, e nenhuma asserção falha. Isso prova que o motivo é tempo, não a tela.
- **Não ter mutação é correto aqui.** A correção não altera nenhuma cláusula de produto, então não há o que mutar.
- **O tratamento já tem precedente no mesmo arquivo.** O outro caso lento do spec, em `:498`, também usa `test.slow()`.
- **O resultado se repete.** Rodei uma vez aqui: os 2 casos passaram, `celular` e `chromebook`, em 24,4 s.
- Não há `.skip` nem teste comentado. O `page.route` só simula a lista vinda da API, e o polling que está sendo testado roda de verdade na tela.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Trocar a espera fixa por relógio falso.** O `page.waitForTimeout(4_000)` em `e2e/material.spec.ts:217` poderia virar `page.clock`, avançando o tempo além de duas voltas de 1,5 s. A prova de que a consulta parou ficaria igual e o caso não gastaria 4 s reais.
2. **Atacar a causa de fundo.** Os 21 s de preparo no runner vêm da entrada pela tela e da ida pelo menu, e isso vale para todos os casos de `abrirMaterial`. Os outros casos já fecham entre 17 e 25 s, perto do relógio de 30 s. Abrir a sessão por fixture, em vez de pela tela, nos casos que não testam a entrada tira o spec inteiro dessa margem curta. Isso fica para o `/retro`.
3. **Asserção que já faltava antes desta correção.** O título do caso diz "sem recarregar", mas o caso não confere a marca `window.semRecarga`, como o de `:121-142` faz. Uma recarga também geraria as leituras a mais e passaria despercebida. Vale acrescentar a mesma verificação.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 16:39:09 · `tasks/correcoes/2026-10-17-material-processando-estoura-o-prazo.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: `/coordenacao/material` no computador e no celular, na escola "cheia" e na vazia). A tarefa não mexe em tela.
Estados: ok. Esta correção só mexe em teste, e o código da tela não mudou. As fotos mostram o estado vazio de Escola › Material. Carregando e erro não aparecem na vitrine, e esta tarefa não os altera.
Acessibilidade: sem alteração. A foto mostra foco e rótulos coerentes, com o botão principal "Enviar material" em laranja com texto escuro.
Chromebook fraco: a correção atende justamente a isso. O caso do e2e levava cerca de 31 s no runner lento contra o relógio de 30 s. Agora o `test.slow()` dá 90 s a ele (`e2e/material.spec.ts:181`). Nenhuma asserção saiu, e a espera de 4 s que prova que a consulta parou foi mantida. A tarefa relata 4 de 4 vermelhos antes e 20 de 20 verdes depois.
Celular: a tela abre em 360 px sem rolagem horizontal e sem corte. O "Enviar material" tem mais de 44 px de altura. Em 360 px a barra de abas quebra em duas linhas: "Material" fica sozinha na segunda linha. Todas as abas continuam visíveis e tocáveis, então não bloqueia.
Ação oficial protegida: sim. Não se aplica a esta tarefa, e nenhuma ação oficial foi alterada.
Bloqueantes: nenhum.
Recomendações:
- A foto da escola "cheia" mostra "Nenhum material ainda", igual à vazia. A vitrine não cobre a lista de material com dado. Convém a próxima rodada da vitrine semear um material para fotografar a tabela e o estado "Processando" e "Pronto". Isso não é defeito desta tarefa.
- No celular, a aba "Material" quebra para a segunda linha na barra de Escola, em `/coordenacao/material`. Dá para avaliar uma barra de abas com rolagem ou com rótulos mais curtos, em outra tarefa.

## test-engineer · 2ª rodada · APROVADO · 2026-10-17 16:55:21 · `tasks/correcoes/2026-10-17-material-processando-estoura-o-prazo.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- O caso "consulta sozinha" cabe no relógio do runner. O preparo leva cerca de 21 s, a troca cerca de 5,5 s, e a espera de 4 s prova que a consulta parou.
- O título do caso diz que a troca de "Processando" por "Pronto" acontece sem recarregar a página. Isso agora precisa ser conferido.
- Depois de "Pronto", a tela não faz mais leituras.

Não há caso de permissão nem de isolamento: a correção só mexe em teste e não toca dado de escola.

**Cobertos:**
- **Relógio do caso:** `test.slow()` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/material.spec.ts:183`, sem mudança desde a rodada 1. O vermelho com relógio menor (4 de 4) e a estabilidade (20 de 20) estão no documento.
- **"Sem recarregar" (recomendação aplicada):**
  - A marca `window.semRecarga` é posta em `e2e/material.spec.ts:212-214`. A página já está aberta, "Processando" já está visível, e isso acontece antes da troca.
  - A marca é conferida em `:218`, depois de `toHaveCount(0)`. É o mesmo padrão do caso de `:121-123` e `:142`.
  - Uma recarga entre a troca e a conferência apaga a marca, e a asserção falha.
- **Bloco de mutação:** troca `toHaveCount(0)` por `await page.reload()`, logo antes da conferência.
  - O teste fica vermelho pelo motivo certo: depois da recarga, `semRecarga` volta `undefined` e não `true`.
  - O bloco alcança a cláusula nova.
  - As linhas casam com o arquivo, porque `tools/processo/mutacoes.ts:69` compara as linhas sem os espaços das pontas.
- **Consulta parada depois de "Pronto":** `:221-223` segue igual, com o contador de leituras.
- **Nada escondido:** nenhum `.skip` e nenhum teste comentado. O mock de rota (`page.route`) só controla o estado que o servidor devolve; não mascara a regra testada, que é a tela consultar sozinha e trocar o estado.
- **Escopo do diff:** só `e2e/material.spec.ts` (+8) e o índice de achados mudaram. O código de produto não foi alterado.

**Bloqueantes:** nenhum.

**Recomendações:**
- A marca só é posta depois de "Processando" aparecer, cerca de 1,5 s antes da segunda leitura. Uma recarga feita antes disso, já na primeira leitura, passaria sem ser vista. O risco é baixo e é o mesmo padrão aceito no caso de `:116`. Fica registrado, sem exigir correção.
- As quatro recomendações sem aplicar estão registradas com destino (o `/retro` da spec ou o `TODO.md`), e concordo com os motivos dados.
