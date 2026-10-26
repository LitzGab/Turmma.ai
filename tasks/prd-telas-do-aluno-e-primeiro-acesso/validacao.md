# Validação — telas-do-aluno-e-primeiro-acesso (X4)

## Rodada 2 — 25/10/2026

**Escopo:** funcionalidade completa (revalidação depois das correções do C1)
**Commit validado:** `fb8f28a2`
**Veredito: REPROVADA**

O C1 da rodada 1 está resolvido. Eu e Início cabem em 1366 × 768, e também a 1024 px. Cada um tem um caso de e2e no projeto
`chromebook` que mede a altura e a disposição, e as duas mutações que rodei ficaram vermelhas. Mas a tarefa aberta
(`/aluno/atividades/<id>`, recomposta na 6.0) **não cabe** em 1366 × 768. Com uma questão de 4 alternativas na tela, a página tem
871 px, e na primeira vista a barra presa "Anterior / Próxima" cobre metade de "Pedir ajuda ao Tutor nesta questão" e de "Enviar a
atividade". O texto do ponto de parada ("Pode parar quando quiser…") fica escondido. A rodada 1 não viu isso porque não
fotografou a tarefa aberta, já que a vitrine não tem tarefa "Para fazer" (M5). Esta rodada fotografou. É um crítico novo, o C2. Deixa
o RF20 e o RF7 PARCIAIS.

**O que esta rodada conferiu de novo.** Entre `77e6a060` e `fb8f28a2` o código mudou só em `Eu.tsx`, `ComoEstouIndo.tsx` e
`Inicio.tsx` (correções `2026-10-25-eu-cabe-em-1366` e `2026-10-25-inicio-cabe-em-1366`), além dos testes dessas três telas. O merge
`98901f6c` é limpo: a árvore dele é igual à do `merge-tree` dos dois pais. Para os RF cujo código não mudou, valem a evidência e as
três mutações da rodada 1, abaixo. Nesta rodada li de novo o código e os testes de RF3, RF4, RF9, RF10 e RF20 e rodei de novo os
testes deles. Fotografei de novo todas as telas do aluno e as três introduções, e fotografei pela primeira vez a tarefa aberta.

### 1. RF a RF

Fotos da vitrine em `.processo/vitrine/` (montada e fotografada nesta rodada, escola cheia e vazia, 1366 e 360 px). As fotos a
1024 px, as do Início com três "Para fazer" e as da tarefa aberta "Para fazer" saíram de dois scripts descartáveis. Os scripts entram
como o aluno da vitrine e simulam `minhas-atividades` e a `prova`, porque a vitrine não as semeia (M5). Elas ficam em
`/tmp/claude-1000/-home-joaquimdp-Documentos-git--maestri-floors-educaia--spectelas-do-aluno-e-primeiro-acesso/620f1959-4df9-46ae-ae2c-4cc45b3d07cc/scratchpad/fotos/`
(`eu--{1366,1024,360}.png`, `inicio-tres--{1366,1024,360}.png`, `tarefa-respondendo--{1366,1024,360}.png`,
`tarefa-respondendo--1366-janela-topo.png` e `tarefa-respondendo--1366-janela-fim.png`).

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 | ATENDIDO | sem mudança desde a rodada 1 | idem | Fotos novas `aluno--aluno-{inicio,atividades,eu}--*`: os três lugares |
| RF2 | ATENDIDO | sem mudança | idem | |
| RF3 | ATENDIDO | `areas/aluno/Eu.tsx:28` (a linha "Sair" na grade da conta), a casca | `e2e/minha-turma.spec.ts:233` e `:261`, `e2e/aluno-inicio.spec.ts:124`, `e2e/aluno-eu.spec.ts:231` (o "Sair" de Eu à vista sem rolar, a 1366 × 768): rodados, verdes | "Sair" à vista em `eu--1366.png`, `eu--1024.png` e na barra do topo a 360 px |
| RF4 | ATENDIDO | `areas/aluno/Inicio.tsx:24-40` (o cartão vira linha a partir de 768 px) | `e2e/aluno-inicio.spec.ts:36`, `:69`, `:100`, `:144`, `:172`: rodados, verdes | `inicio-tres--1366.png`: saudação, a onça com a função e o selo "IA", faixa e três tarefas, cada uma com "Pedir ajuda ao Tutor" |
| RF5 | ATENDIDO | sem mudança | `e2e/aluno-inicio.spec.ts:144` (rodado, verde) | O aviso da avaliação nos cartões 1 e 2 de `inicio-tres--1366.png` |
| RF6 | ATENDIDO | sem mudança | idem (mutação 3 da rodada 1) | Fotos novas `aluno--aluno-atividades--*` |
| RF7 | **PARCIAL** | `areas/aluno/Atividade.tsx:219-249` | os e2e de `aluno-atividade.spec.ts` (rodada 1) | O fluxo está provado, mas a tela tem um defeito que se vê: a 1366 × 768 a barra presa cobre a linha de "Enviar a atividade" (`tarefa-respondendo--1366-janela-topo.png`). Achado C2 |
| RF8 | ATENDIDO | sem mudança | idem | Ainda vista só pelo e2e: a vitrine não tem tarefa a entregar (M5) |
| RF9 | ATENDIDO | `areas/aluno/Eu.tsx:96-123` (a turma na linha de apoio do título; carregando, erro e "sem turma" logo abaixo), `ComoEstouIndo.tsx:32` | `Eu.test.tsx` (com dado, carregando, erro, sem turma), `titulo-das-telas.test.tsx`, `e2e/aluno-eu.spec.ts:39`, `:71`, `:86`, `e2e/minha-turma.spec.ts:52`, `:83`, `:115`: rodados, verdes | `eu--1366.png`: "2ºB … · 2º ano do Ensino Médio · Colégio …" no cabeçalho, as duas tarefas com "N de 4 certas" e "Para rever", as quatro linhas. `vazia--aluno--aluno-eu--computador.png`: "Nada corrigido ainda" |
| RF10 | ATENDIDO | as telas acima | `Eu.test.tsx` (a varredura de texto, rodada) | Nada de colega, média ou sequência nas fotos novas |
| RF11 a RF19 | ATENDIDO | sem mudança desde a rodada 1 | idem (mutações 1 e 2 da rodada 1) | Fotos novas das três `bem-vindo` e dos passos 3 e 4 do aluno: nenhuma rola a 1366 × 768 |
| RF20 | **PARCIAL** | Eu e Início resolvidos (`Eu.tsx:28`, `ComoEstouIndo.tsx:32`, `Inicio.tsx:26`). A tarefa aberta, não: `Atividade.tsx:237` | `e2e/aluno-eu.spec.ts:231` e `e2e/aluno-inicio.spec.ts:69` exigem `scrollHeight <= 768` no `chromebook` (mutações 4 e 5, vermelhas). Nenhum caso mede a tarefa aberta a 1366 × 768: o de `aluno-atividade.spec.ts:410` só mede a 360 px | `vitrine.ts foto` desta rodada: "Nenhuma tela rola a 1366 × 768" em Início, Tarefas, Eu, Privacidade e nas três `bem-vindo`, cheia e vazia. Eu e Início cabem também a 1024 px (768 px, `eu--1024.png`, `inicio-tres--1024.png`). **A tarefa aberta rola:** "Para fazer", 871 px (`tarefa-respondendo--1366.png`); corrigida, 1194 px (linha do `vitrine.ts foto aluno /aluno/atividades --clicar 'text=Cinemática: lista sintética'`, foto `aluno--aluno-atividades--Cinemática-lista-sintética--computador.png`). Achado C2 |
| RF21 | ATENDIDO | — | diff dos testes de `77e6a060` a `fb8f28a2`: nenhum `.skip`, `.only` nem `fixme`. Os casos que procuravam a turma pelo `h2` passaram a procurá-la no cabeçalho, e a ordem continua conferida (`Eu.test.tsx`, `aluno-eu.spec.ts:56-57`). Nenhum arquivo de `paginas/` mudou | A esteira é conferida no fechamento |

Provas de mutação desta rodada (a árvore terminou limpa, com `git checkout -- <arquivo>`; a web do ambiente foi reconstruída
depois com o código restaurado, e os dois casos voltaram a verde antes das fotos):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF20 (Eu) | `lg:grid-cols-2` da grade da conta (`apps/web/src/areas/aluno/Eu.tsx:28`) | `e2e/aluno-eu.spec.ts:231` [chromebook]: "Privacidade e Ajustes na mesma linha", Expected < 2, Received 66 |
| RF20 (Início) | `md:flex-row md:items-start md:justify-between` do cartão (`apps/web/src/areas/aluno/Inicio.tsx:26`) | `e2e/aluno-inicio.spec.ts:69` [chromebook]: o link do Tutor abaixo do título, Expected >= 1177, Received 444 |

As três mutações da rodada 1 (RF12/RF18 isolamento, RF12 dois papéis, RF6 regra 70 item 3) valem: o código delas não mudou.

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regras de negócio, os 14 pontos e as cinco "valem ainda" | cumpridas | rodada 1; as correções não tocam nenhuma delas. A caixa do Tutor e a faixa presa continuam (`e2e/aluno-inicio.spec.ts:36` e `:144`, rodados) |
| Borda: aluno sem turma | coberta | `e2e/aluno-eu.spec.ts:86`, `e2e/minha-turma.spec.ts:115` (rodados): o aviso fica abaixo do título, e as linhas continuam |
| Borda: dois alunos no mesmo Chromebook | coberta | `e2e/aluno-eu.spec.ts:100`, `e2e/aluno-inicio.spec.ts:172`, `e2e/minha-turma.spec.ts:131` e `:171` (rodados) |
| Demais bordas | cobertas | rodada 1; código sem mudança |
| Pronto: o aluno faz tudo pelos lugares novos, com "Sair" à vista e a faixa presa | cumprido | e2e rodados nesta rodada e na rodada 1 |
| Pronto: nada de colega, sequência, pontos ou ranking | cumprido | RF10 |
| Pronto: introdução uma vez, pulável onde não é aviso, revisível | cumprido | rodada 1 |
| Pronto: aviso em linguagem de 11 anos | cumprido | rodada 1 |
| Pronto: e2e do aluno nos dois projetos | cumprido no que rodei | os 40 casos desta rodada, nos dois projetos. A suíte inteira e as páginas públicas são da esteira |
| Pronto: os 21 RF com evidência | **faltando** | RF7 e RF20 PARCIAIS (C2) |
| Pronto: 150 kB de entrada e 30 kB por tela | cumprido | o `size-limit` passou nas três execuções do e2e desta rodada (etapa "teto do bundle da web") |
| Pronto: os seis documentos atualizados | cumprido | rodada 1. A Tech Spec §9 foi atualizada com o Eu novo, e `docs/interface.md` não descrevia o cartão da turma |
| Pronto: esteira verde no último commit que alterou código | esteira: conferida no fechamento | — |
| TODO "Foto do Eu a 1024 px" (dono: Validador) | feito | Eu e Início com dado medem 768 px a 1024 × 768 e não rolam (`eu--1024.png`, `inicio-tres--1024.png`). Os cartões de "Como estou indo" ficam com ~345 px, e o título da tarefa do Início, em uma linha. A linha do `TODO.md:200` pode fechar |

### 3. Portão

| Portão | Resultado |
|---|---|
| `npm run typecheck`, `npm run lint` | não rodados: escopo da funcionalidade completa (esteira) |
| Unidade e componente das telas que mudaram | ✅ `Eu.test.tsx`, `areas/aluno/Inicio.test.tsx`, `titulo-das-telas.test.tsx`, `paginas/Inicio.test.tsx`: 79 passaram |
| E2E das telas que mudaram (`chromebook` e `celular`) | ✅ `aluno-eu`, `aluno-inicio`, `minha-turma`: 40 passaram (1,3 min) |
| E2E das mutações | ❌ como esperado com a mutação (2 vermelhos, acima). ✅ depois de restaurar (2 passaram) |
| Esteira do GitHub | esteira: conferida no fechamento. Não entra no veredito |
| Revisões com veto registradas e aprovadas | ✅ `2026-10-25-eu-cabe-em-1366`: os sete obrigatórios com rodada; a última de cada um é APROVADO (`revisor-geral` na 3ª, `test-engineer` na 2ª). `2026-10-25-inicio-cabe-em-1366`: os seis obrigatórios aprovados (`test-engineer` na 2ª). Sem `revisor-geral` porque a correção mudou só dois arquivos fora de `tasks/`, abaixo do limite do passo 5 de `corrigir`. Os dois commits levam `(correção …)`, e não há nenhum `Fora do processo:` |

Dependências: o `node_modules` não era anterior ao `package-lock.json`, então não precisei rodar `npm ci`. Antes das fotos conferi
que `.processo/vitrine/sessao-*.json` não guardava `educa.letra`, a armadilha que a correção do Eu achou: não guardava. Todas as fotos
estão no tamanho Padrão.

### 4. Achados

**Críticos**

- **C2. A tarefa aberta não cabe em 1366 × 768, e a barra presa cobre a ação** (RF20 e RF7 PARCIAIS).
  `apps/web/src/areas/aluno/Atividade.tsx:237`: a `BarraPresa` "Trocar de questão" fica presa (`sticky`) em toda largura. A 6.1
  pedia "a barra presa embaixo no celular" (`6_task.md`), e essa diferença não foi registrada. Some-se a isso a linha de
  "Pedir ajuda ao Tutor nesta questão" e "Enviar a atividade" (`:219`), o ponto de parada (`:234`) e a barra (`:237`), uma abaixo
  da outra. Com uma questão de 4 alternativas, a página tem 871 px a 1366 × 768. Na primeira vista, a barra (y ≈ 695 a 768) cobre
  a metade de baixo dos dois botões (y 665 a 709), e o texto "Pode parar quando quiser…" só aparece depois de rolar
  (`tarefa-respondendo--1366-janela-topo.png` e `-janela-fim.png`). É a tela de trabalho do aluno, e o `docs/interface.md:603` diz
  que ela "cabe na janela e rola por dentro". Pela lista do `frontend-reviewer`, botão sobreposto que esconde a ação é bloqueante.
  O ponto de parada escondido também toca a D59 (regra 70, item 4b: "esconder o ponto de parada"). A forma corrigida também rola
  (1194 px, com 4 questões no "Questão por questão"). Nenhum e2e mede a tarefa aberta no `chromebook`. O de `aluno-atividade.spec.ts:410`
  mede só a 360 px.
  **Correção sugerida:** a partir de 768 px, "Anterior" e "Próxima" vão para a mesma linha de "Pedir ajuda" e "Enviar" (ou a barra
  deixa de ser presa, como a 6.1 pedia). A linha sobe uns 100 px, e o ponto de parada fica à vista. Um caso no projeto `chromebook`
  abre a questão de enunciado mais longo das sintéticas, exige `scrollHeight <= 768` e que "Enviar a atividade" esteja à vista e
  sem nada por cima (`elementFromPoint` no centro e na borda de baixo). A mutação é tirar o ramo `md:`. Para a forma corrigida há
  dois caminhos. (a) O resultado cabe: o "Questão por questão" rola por dentro, ou a lista vai num painel. (b) O Arquiteto registra,
  com a palavra do Joaquim, que o RF20 vale para o resultado com até N questões, e põe isso na Tech Spec §12b. Recomendo (a)
  para a forma "Para fazer", que é a tela de trabalho e não tem conteúdo que cresce. Para a corrigida, o (b) é aceitável. Guardiões
  sugeridos: `frontend-reviewer` e `conformidade-reviewer` (ponto de parada, D59).

**Maiores**

- Nenhum além do C2. A barra presa em toda largura, contra a 6.1, faz parte dele.

**Menores** (não mudam o veredito; o Orquestrador os leva ao `TODO.md`)

- M1 a M5 da rodada 1 seguem como estavam. O código delas não mudou, e o M5 foi de novo o que escondeu um crítico, desta vez o C2.
- M6. `apps/web/src/areas/aluno/Eu.test.tsx:21`, `:317` e `:329`: o comentário e os nomes de dois casos ainda falam do "cartão da
  turma", que saiu na correção do Eu. Trocar por "a turma no cabeçalho". Dono: quem tocar `Eu.test.tsx`.
- M7. A leitura de que o RF20 vale "com duas tarefas corrigidas, no tamanho Padrão" está na Tech Spec §9, mas não na §12b, que é
  a lista do que muda critério do PRD e o Joaquim revê. E `tasks/correcoes/2026-10-25-eu-cabe-em-1366.md:40` cita "o miolo rola,
  `docs/interface.md` 9.3": a 9.3 é "Forma, espaço e elevação", e a frase está na `:603`, que fala da tela de trabalho rolar por
  dentro, não da página. Levar a leitura à §12b, junto com a do C2(b) se ela for o caminho. Dono: Arquiteto.
- M8. O e2e do Eu a 1366 × 768 simula a memória com títulos curtos, e a vitrine tem nomes de turma e de escola longos. A linha de
  apoio coube nas fotos (uma linha a 1366 e a 1024), mas o caso de nome com 60 ou mais caracteres já está no `TODO.md` (correção do
  Eu, `test-engineer` 1ª). Só registro aqui que é ele que falta para a medida valer com dado real. Dono: quem tocar
  `e2e/aluno-eu.spec.ts`.

**Positivos**

- A correção do Eu achou e escreveu as duas armadilhas da medida: medir antes de a turma carregar, e a sessão da vitrine com
  `educa.letra=maior`. Por isso o caso espera a turma e confere a disposição, e não só a altura. Vale como receita para todo caso
  "cabe na janela".
- Os dois casos novos medem no projeto `chromebook` e conferem outra coisa no `celular` (a ordem em coluna, nada rolando de lado),
  sem `.skip`.

### 5. Conclusão

REPROVADA pelo C2. A tarefa aberta, que a rodada 1 não fotografou, não cabe em 1366 × 768, e a barra presa cobre a linha de "Enviar a
atividade" e esconde o ponto de parada na primeira vista. O C1 está resolvido, com código, dois casos de e2e efetivos (mutações
vermelhas) e fotos a 1366, 1024 e 360 px. Os outros 19 RF estão atendidos. Todos os testes que rodei passaram, e o processo está em
ordem. O caminho até APROVADA é a correção C2 em `Atividade.tsx`, com o caso de e2e no `chromebook` para a forma "Para fazer", e a
decisão (a) ou (b) para a forma corrigida. A revalidação confere só o C2: roda de novo `e2e/aluno-atividade.spec.ts` e fotografa a
tarefa aberta, "Para fazer" e corrigida, a 1366 e a 360 px.

### 6. Pendências herdadas

| Pendência | Dono | Arquivo | Destino |
|---|---|---|---|
| M1 a M5 da rodada 1 | os da rodada 1 | os da rodada 1 | `TODO.md` (já no `estado.md`) |
| M6: "cartão da turma" nos testes do Eu | frontend | `apps/web/src/areas/aluno/Eu.test.tsx` | `TODO.md` |
| M7: a leitura do RF20 fora da §12b, e a citação errada da 9.3 | Arquiteto | `techspec.md` §12b, `tasks/correcoes/2026-10-25-eu-cabe-em-1366.md` | `TODO.md`, ou junto da correção C2 se for pelo (b) |
| M8: o caso do nome longo no cabeçalho do Eu | quem tocar o e2e do Eu | `e2e/aluno-eu.spec.ts` | já no `TODO.md` |
| "Foto do Eu a 1024 px" | Orquestrador | `TODO.md:200` | fechar: feito nesta rodada (cabe) |
| As recomendações das duas correções que estão em "Recomendações sem aplicar" com destino `TODO.md` | Orquestrador | `tasks/correcoes/2026-10-25-{eu,inicio}-cabe-em-1366.md` | `TODO.md` (as da correção do Início ainda não foram levadas: `estado.md`, "Devo ainda (C1, linha 2)") |
| Commits `Fora do processo:` com código da spec | — | — | nenhum |

## Rodada 1 — 25/10/2026

**Escopo:** funcionalidade completa
**Commit validado:** `77e6a060`
**Veredito: REPROVADA**

Um crítico, o RF20 PARCIAL. O RF20 diz que "toda tela nova ou recomposta [...] cabe em 1366 × 768". Medido no commit
validado, Eu e Início, com dado comum, rolam a página nessa janela. Os outros 20 RF têm código, teste efetivo e, quando
têm tela, foto lida. Todos os testes que rodei passaram, e as três mutações ficaram vermelhas.

### 1. RF a RF

Fotos em `.processo/vitrine/` (vitrine montada nesta rodada, escola cheia e vazia, 1366 px e 360 px). As do Início com
tarefas e de Tarefas com quatro "Para fazer" vêm de um script descartável. A vitrine cheia não semeia tarefa "Para
fazer", então o script entra como o aluno da vitrine e simula `minhas-atividades`. Ficam no scratchpad desta sessão:
`inicio-com-tarefas--{computador,celular}.png` e `tarefas-com-quatro--{computador,celular}.png`.

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 | ATENDIDO | `apps/web/src/areas/navegacao.ts:74-78` (Início, Tarefas, Eu), `:88-90` (`RODAPE_DA_LATERAL.aluno` vazio) | `areas/navegacao.test.ts`, `e2e/areas.spec.ts:294` ("o aluno vê Início, Tarefas e Eu"), `e2e/casca.spec.ts` (W12) | Fotos `aluno--aluno-inicio--{computador,celular}.png`: lateral e barra de baixo com os três lugares. Sem "Avisar um adulto" |
| RF2 | ATENDIDO | `apps/web/src/paginas/Inicio.tsx:20-47`, `areas/aluno/rotas.tsx` (redirect de `minhaTurma`) | `paginas/Inicio.test.tsx`, `e2e/areas.spec.ts:350` e `:361` | |
| RF3 | ATENDIDO | `componentes/introducao/TelaDeFoco.tsx:43`, `areas/aluno/Eu.tsx:64`, casca | `e2e/aluno-inicio.spec.ts:69`, `e2e/introducao-pecas.spec.ts:53`, `e2e/aluno-eu.spec.ts:158` | "Sair" à vista nas fotos do Início, de Eu e da introdução (computador e celular) |
| RF4 | ATENDIDO | `areas/aluno/Inicio.tsx:91-104`, `inicio.ts:21-34`, `FaixaDeSupervisao.tsx` (sticky, sem fechar) | `areas/aluno/Inicio.test.tsx`, `inicio.test.ts`, `e2e/aluno-inicio.spec.ts:36` (faixa à vista depois de rolar, sem botão) | Fotos `aluno--aluno-inicio--*`, `vazia--aluno--aluno-inicio--*`, `inicio-com-tarefas--*`. O Início não lê `tutor/conversa` (`Inicio.test.tsx`) |
| RF5 | ATENDIDO | `areas/aluno/Inicio.tsx:31` (`AVISO_DA_AVALIACAO`, e o link ao Tutor continua) | `e2e/aluno-inicio.spec.ts:89`, `e2e/aluno-fluxo.spec.ts` | Foto `inicio-com-tarefas--computador.png`: a avaliação com o aviso e "Pedir ajuda ao Tutor" |
| RF6 | ATENDIDO | `areas/aluno/atividades.ts:65-71`, `Atividades.tsx`, `materia.ts` | `atividades.test.ts`, `Atividades.test.tsx` ("Corrigida só com a correção aprovada"), `e2e/aluno-atividade.spec.ts:85` e `:482` | Mutação 3. A API só dá `com_diagnostico` com lote aprovado (`apps/api/src/atividade/minha-atividade/minha-atividade.service.ts:24-26`). Fotos `aluno--aluno-atividades--*`, `tarefas-com-quatro--*` |
| RF7 | ATENDIDO | `areas/aluno/Atividade.tsx` (só moldura) | `e2e/aluno-atividade.spec.ts:149`, `:235`, `:275`, `:366` | Os e2e de hoje passaram nesta rodada |
| RF8 | ATENDIDO | `areas/aluno/atividade.ts:67-69` (`comemoracaoNaTela`), `Atividade.tsx:412` (estado de tela), `componentes/ui/Comemoracao.tsx`/`.css` | `atividade.test.ts`, `Comemoracao.test.tsx`, `e2e/aluno-atividade.spec.ts:409-446`, `e2e/introducao-pecas.spec.ts:110-155` | A forma da comemoração vista pelo e2e (a vitrine não tem tarefa a entregar) |
| RF9 | ATENDIDO | `areas/aluno/Eu.tsx`, `ComoEstouIndo.tsx`, `api/memoria-do-tutor.ts:16-20` (só `resultado` não nulo, filtro na `queryFn`) | `Eu.test.tsx:188` ("só a correção aprovada"), `como-estou-indo.test.ts`, `e2e/aluno-eu.spec.ts:38`, `:69`, `:84` | Fotos `aluno--aluno-eu--*`, `vazia--aluno--aluno-eu--*`. O texto do sem-turma é o de hoje (igual ao de `MinhaTurma.tsx` em `5ca8739`) |
| RF10 | ATENDIDO | as telas acima | `Inicio.test.tsx:368`, `Atividades.test.tsx:151`, `Eu.test.tsx:262` (varrem o texto) | Nada de colega, média ou sequência nas fotos |
| RF11 | ATENDIDO | `apps/web/src/letra.ts`, `index.html` (script em linha), `estilos.css`, `componentes/ajustes/TamanhoDaLetra.tsx` | `letra.test.ts`, `TamanhoDaLetra.test.tsx`, `e2e/tamanho-da-letra.spec.ts:67-244` (antes do primeiro quadro, só grava ao escolher, 360 px com Maior, só no aluno) | Foto `aluno--aluno-bem-vindo--Continuar-Continuar-Continuar--celular.png` (passo 4) |
| RF12 | ATENDIDO | `apps/api/src/sessao/eu/eu.service.ts:28-45`, `eu.repository.ts:46-55`, `sessao/tenant/resolucao-de-tenant.repository.ts:183-197`, `paginas/Inicio.tsx:42-44` | `apps/api/test/introducao.int.test.ts` (22 casos: duas escolas, vínculo encerrado, dois papéis, outra conta, eliminação agendada), `e2e/aluno-introducao.spec.ts:81`, `e2e/professor-introducao.spec.ts:146` | Mutação 2 |
| RF13 | ATENDIDO | `areas/aluno/introducao/textos-da-introducao.ts:37-40` (três `obrigatorio: true`), `componentes/introducao/Introducao.tsx:51` | `Introducao.test.tsx`, `BemVindo.test.tsx`, `e2e/introducao-pecas.spec.ts:72`, `e2e/aluno-introducao.spec.ts:81` | Fotos `aluno--aluno-bem-vindo--*` (passos 1, 3 e 4) |
| RF14 | ATENDIDO | `areas/aluno/introducao/aviso-de-privacidade.ts` (prazo lido de `CATEGORIAS_DE_RETENCAO`) | `textos-da-introducao.test.ts` (exige as frases, até 15 palavras, recusa "nota" e termo jurídico) | Foto `aluno--aluno-bem-vindo--Continuar-Continuar--*`. Ver o menor M1 |
| RF15 | ATENDIDO | `areas/professor/introducao/textos-da-introducao.ts:39-42`, `areas/coordenacao/introducao/textos-da-introducao.ts:42-44` | os dois `textos-da-introducao.test.ts`, os dois `BemVindo.test.tsx`, `e2e/professor-introducao.spec.ts:106`, `e2e/coordenacao-introducao.spec.ts:102` (pular) | Fotos `professora--professor-bem-vindo--*`, `coordenacao--coordenacao-bem-vindo--*` |
| RF16 | ATENDIDO | `Introducao.tsx:39,92-97` (a mesma classe nos dois botões) | `Introducao.test.tsx`, `e2e/introducao-pecas.spec.ts:53`, `e2e/aluno-introducao.spec.ts:166` e `:183` (sair e fechar a aba não gravam) | |
| RF17 | ATENDIDO | `areas/aluno/Eu.tsx:52`, `areas/navegacao.ts:97-104` (`MENU_DA_PESSOA`) | `e2e/aluno-introducao.spec.ts:227`, `e2e/professor-introducao.spec.ts:122`, `e2e/coordenacao-introducao.spec.ts:136` | Fotos dos três `bem-vindo`, revendo, com "Fechar" |
| RF18 | ATENDIDO | `apps/api/src/sessao/eu/eu.controller.ts:22-27` (corpo vazio estrito), `packages/shared/src/permissao/matriz.ts` (`eu.concluir_introducao`, rede `nunca`) | `introducao.int.test.ts` (repetida, `Promise.all`, permissão, sem ano), `eu.repository.int.test.ts:25` (isolamento), `matriz.test.ts` | Mutação 1 |
| RF19 | ATENDIDO | `componentes/ui/onca/Onca.tsx`, `componentes/ui/Comemoracao.tsx` | `Onca.test.tsx:47-170` (mesmo rosto, boca trocada fica vermelha), `ui/ia/avatar-so-nas-duas-pecas.test.ts` (quem importa a onça e a `comemorando`), os três `textos-da-introducao.test.ts` | Fotos: acenando e apontando com a função e o selo "IA" |
| RF20 | **PARCIAL** | `areas/aluno/Eu.tsx`, `areas/aluno/Inicio.tsx:24-40` | quatro estados: `Inicio.test.tsx`, `Atividades.test.tsx`, `Eu.test.tsx`, os `BemVindo.test.tsx`. 360 px: e2e nos dois projetos. Pedaços: `apps/web/nome-dos-chunks.test.ts` (build real, verde) | **Não cabe em 1366 × 768.** `/aluno/eu` com duas tarefas corrigidas: página de 954 px (linha "Telas cuja página rola a 1366 × 768" do `vitrine.ts foto`, foto `aluno--aluno-eu--computador.png`). `/aluno/inicio` com três "Para fazer": 866 px (`inicio-com-tarefas--computador.png`). Tarefas com quatro (768 px) e a introdução cabem. Achado C1 |
| RF21 | ATENDIDO | — | diff dos testes de `5ca8739` a `77e6a060`: nenhum `.skip`, `.only` nem `fixme` novo. Cada caso removido voltou reescrito para os lugares novos, e nenhum ficou mais fraco: RF24 da aparência agora com a letra, W2 do aluno, `onca/` com os importadores novos, cenário do k6 com as rotas do Início. O caso do job que "renovava a validade" mudou de propósito na correção `montar-arquivo-renova-validade`. Páginas públicas: nenhum arquivo de `paginas/` mudou além de `Inicio.tsx` | A parte "a esteira" é conferida no fechamento |

Provas de mutação (a árvore terminou limpa, `git status` vazio, com `git checkout -- <arquivo>` depois de cada uma):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF12/RF18 (isolamento) | `eq(usuario.id, usuarioId)` em `EuRepository.marcarIntroducaoVista` (`apps/api/src/sessao/eu/eu.repository.ts:52`) | `apps/api/test/introducao.int.test.ts`: "só a própria linha (aluno)", "só a própria linha (professor)", "escrita do GET, só a própria linha" (3 vermelhos) |
| RF12 (dois papéis) | `eq(usuario.papel, papel)` em `introducaoMaisAntigaDaConta` (`resolucao-de-tenant.repository.ts:194`) | `introducao.int.test.ts`: "dois papéis: professora em A e coordenadora em B não herdam uma da outra" |
| RF6 (regra 70, item 3) | "Corrigidas" aceitando também `enviada` (`apps/web/src/areas/aluno/atividades.ts:69`) | `atividades.test.ts` (2) e `Atividades.test.tsx` ("Corrigida só com a correção aprovada" e "com dado") |

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regra: os 14 pontos do fechamento (d) do mockup | cumprida | A caixa do Tutor fica em todo estado (`e2e/aluno-inicio.spec.ts:89`). A faixa está presa (`:36`). Sem foto, voto, Refazer nem Editar. O e2e prova o "Sair" na casca e em Eu. A onça tem três poses, sem "acolhendo" (`Onca.test.tsx:47`). Carregando e erro têm teste de componente. A tela diz "quem dá a aula" |
| Regra: uma formulação só para a supervisão | cumprida | `aviso-de-privacidade.ts` importa `TEXTO_DA_SUPERVISAO`, e `FaixaDeSupervisao.tsx` usa a mesma constante |
| Regra: resultado só de correção aprovada | cumprida | mutação 3; `memoria-do-tutor.ts:16-20` |
| Regra: nada induz uso; o agente não se passa por pessoa | cumprida | `inicio.ts` (saudação fixa), os testes de texto dos três papéis, `Onca.test.tsx:109` |
| Regra: a introdução é da pessoa e do papel | cumprida | mutação 2; `introducao.int.test.ts` |
| Borda: aluno sem turma | coberta | `e2e/aluno-eu.spec.ts:84`, `Inicio.test.tsx` |
| Borda: transferido no mesmo ano | coberta | `apps/api/src/tutor/tutor.int.test.ts` ("o aluno transferido no mesmo ano segue com a própria tarefa corrigida", rodado: verde) |
| Borda: dois alunos no mesmo Chromebook | coberta | `e2e/tamanho-da-letra.spec.ts:149`, `aluno-introducao.spec.ts:263`, `aluno-eu.spec.ts:98`, `aluno-inicio.spec.ts:117` |
| Borda: professor em duas escolas, virada, vínculo encerrado | coberta | `introducao.int.test.ts` ("vínculo encerrado (RF12)", "virada do ano letivo não a apaga"), `e2e/professor-introducao.spec.ts:146` |
| Borda: aluno em duas escolas | coberta | `eu.service.test.ts:118` (aluno sem conta: vale só a própria linha) |
| Borda: dois cliques ou duas abas | coberta | `introducao.int.test.ts` ("concorrência", "corrida do GET"), `e2e/aluno-introducao.spec.ts:211` |
| Borda: a gravação falha | coberta | `introducao.int.test.ts` (trigger que faz o Postgres recusar, contador sem rótulo), `e2e/aluno-introducao.spec.ts:194` |
| Borda: coordenação com incidente pendente | coberta | `e2e/coordenacao-introducao.spec.ts:161` |
| Pronto: o aluno faz tudo pelos lugares novos, com "Sair" à vista e a faixa presa | cumprido | `e2e/areas.spec.ts`, `aluno-fluxo.spec.ts`, `aluno-atividade.spec.ts` e `aluno-inicio.spec.ts` verdes nesta rodada |
| Pronto: nenhuma tela do aluno mostra colega, sequência, pontos ou ranking | cumprido | RF10 |
| Pronto: a introdução aparece uma vez, pode ser pulada onde não é aviso e pode ser revista | cumprido | RF12, RF13, RF15, RF17 |
| Pronto: aviso em linguagem de 11 anos | cumprido | RF14 |
| Pronto: e2e do aluno e das páginas públicas, nos dois projetos | cumprido no que rodei | os 198 casos que rodei, nos projetos `chromebook` e `celular`. As páginas públicas e a suíte inteira são da esteira, conferida no fechamento |
| Pronto: os 21 RF com evidência | **faltando** | RF20 PARCIAL |
| Pronto: 150 kB de entrada e 30 kB por tela | cumprido | `apps/web/nome-dos-chunks.test.ts` (build real em memória), verde |
| Pronto: seis documentos atualizados e as pendências do aviso fechadas nos três que as listam | cumprido | `docs/lgpd.md` (linha da marca e da letra; seção 9, item 12), `docs/aia/tutor.md` (pendência 12), `docs/conformidade-mec.md` (item 3 e a caixa marcada), `docs/modelo-de-dados.md:59`, `docs/interface.md`, `docs/glossario.md` |
| Pronto: esteira verde no último commit que alterou código | esteira: conferida no fechamento | — |
| Carga (7c) | cumprido | `infra/k6/login-7h30.js`: `/v1/eu` e `minhas-atividades` com p95 na rajada. `infra/test/carga-login.test.ts`: 35 verdes |

### 3. Portão

| Portão | Resultado |
|---|---|
| `npm run typecheck` | não rodado: escopo da funcionalidade completa (esteira) |
| `npm run lint` | não rodado: escopo da funcionalidade completa (esteira) |
| Unidade e componente, os 34 arquivos da funcionalidade | ✅ 592 passaram (inclui `nome-dos-chunks.test.ts` com build real e `matriz.test.ts`) |
| Integração da funcionalidade | ✅ `introducao.int.test.ts`, `eu.repository.int.test.ts` e os casos da introdução e do isolamento de `arquivo-do-titular.int.test.ts`: 26 passaram. `tutor.int.test.ts` (transferido): 4 passaram |
| E2E da funcionalidade (`chromebook` e `celular`) | ✅ 122 passaram (`aluno-introducao`, `aluno-inicio`, `aluno-eu`, `professor-introducao`, `coordenacao-introducao`, `tamanho-da-letra`, `introducao-pecas`) e 76 passaram (`aluno-atividade`, `areas`, `aluno-fluxo`) |
| Infra (`infra/test/carga-login.test.ts`) | ✅ 35 passaram |
| Esteira do GitHub | esteira: conferida no fechamento. Não entra no veredito |
| Revisões com veto registradas e aprovadas | ✅ As 11 tarefas têm rodada de todo revisor obrigatório, e a última de cada um com veto é APROVADO. A spec tem `revisao-spec.md` APROVADA (rodada 4). Desde `5ca8739`, todo commit com código leva `(tarefa N.0)` ou `(correção …)`, e nenhum é `Fora do processo:` |

Dependências: o `node_modules` não era anterior ao `package-lock.json`, então não precisei rodar `npm ci`.

### 4. Achados

**Críticos**

- **C1. RF20 PARCIAL: Eu e Início não cabem em 1366 × 768.** `apps/web/src/areas/aluno/Eu.tsx`: com as duas tarefas
  corrigidas da vitrine cheia, a página tem 954 px. Isso não é um caso extremo: é o primeiro bimestre de qualquer aluno.
  O mockup da spec diz "cabe em 1440 × 780" (`mockup.md` 2.5) e compõe a tela de outro jeito: a turma vai no
  complemento do cabeçalho, as linhas têm 56 px e as quatro linhas da conta ficam numa grade 2 × 2. Na implementação, a
  turma ocupa um cartão de 165 px, e as quatro linhas de 66 px ficam em uma coluna. `apps/web/src/areas/aluno/Inicio.tsx:24-40`: com três tarefas
  "Para fazer", a página tem 866 px, porque cada cartão leva o "Pedir ajuda ao Tutor" numa linha própria (cartão de
  162 a 194 px). O `frontend-reviewer` apontou o Eu na 7.0 ("Tela cheia passa de 768 px a 1366 × 768 (822 px)"). A
  recusa ficou na tabela "Sem aplicar" do `7_task.md:193` com o motivo "o PRD não pede que Eu caiba na janela", e o
  RF20 pede, com essas palavras. A Tech Spec não registra esse desvio. Há dois caminhos, e só um deles vale:
  (a) **compor as duas telas para caber**: o Eu como no mockup (turma no cabeçalho, conta em 2 × 2 a partir de 1024 px)
  e o Início com o "Pedir ajuda ao Tutor" na mesma linha do título a partir de 768 px. Cada uma ganha um caso no projeto
  `chromebook` que, com dado (Eu com duas corrigidas, Início com três "Para fazer"), exige
  `document.documentElement.scrollHeight <= 768`. Num tamanho maior, o miolo rola por dentro, como pede a 9.3 do
  `docs/interface.md`; ou (b) **mudar o critério**: o Arquiteto revê o RF20 com a palavra do Joaquim ("cabe em 1366 ×
  768" só para a tela de foco e a tela de trabalho; Início e Eu rolam a página) e registra isso no PRD e na Tech Spec
  (12b). Recomendo (a). A mesa e o mockup já resolvem o Eu, e o Início cabe com uma linha a menos por cartão.

**Maiores**

- Nenhum além do C1. O desvio do RF20 sem registro faz parte dele.

**Menores** (não mudam o veredito; o Orquestrador os leva ao `TODO.md`)

- M1. `componentes/introducao/RegiaoQueRola.tsx` (passo 3 do aluno). No computador, a região do aviso mostra só três das
  17 frases e deixa uns 110 px vazios antes do "Continuar" (`aluno--aluno-bem-vindo--Continuar-Continuar--computador.png`).
  Deixar a região ocupar a altura livre. Dono: frontend, numa próxima tarefa que mexa na introdução.
- M2. `componentes/ui/Linha.tsx`. A 360 px, o título da tarefa sai cortado com reticências ("Cinemática: lista sínt…",
  `aluno--aluno-atividades--celular.png`), e o aluno não lê o nome inteiro na lista. Usar `tituloEmDuasLinhas` na linha
  da tarefa, como já se faz em "Rever a introdução". Dono: frontend.
- M3. A casca da X1 mostra o papel em minúsculo ("aluno") no rodapé da lateral (todas as fotos do aluno). A 2.0 deixou
  isso para a validação. Dono: frontend, na casca.
- M4. Decisão aberta do Joaquim, registrada em `estado.md` ("Esperando o Joaquim", 25/10 ~17:20): a introdução promete
  "Se você contar algo pessoal difícil, quem dá a aula é avisado.", e a mensagem fixa de
  `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts` não diz isso. Enquanto não houver resposta, as duas dizem coisas
  diferentes. Dono: Joaquim, e depois uma correção.
- M5. A vitrine cheia não semeia tarefa "Para fazer" nem tarefa a entregar. Por isso o Início com dado e a comemoração
  não aparecem pelo `vitrine.ts foto`, e o achado C1 do Início só se viu com um script à parte. Já está no `TODO.md`
  (Implementador 3); vale lembrar que foi isso que deixou o C1 passar. Dono: `tools/vitrine/escola.ts`.

**Positivos**

- O teste da falha de gravação usa um trigger que faz o próprio Postgres recusar (`introducao.int.test.ts`,
  `quebrarAEscritaDe`), e não um mock do repository.
- O prazo da conversa no aviso sai do catálogo de retenção (`CATEGORIAS_DE_RETENCAO.conversa_tutor`), e não de um número
  escrito à mão. Se a retenção mudar, o aviso muda junto.
- Cada tela tem caso de "o aluno seguinte no mesmo computador", e esses casos pegam o vazamento de cache entre pessoas
  que o teste de componente não vê.

### 5. Conclusão

REPROVADA por um crítico, o RF20 PARCIAL. Os outros 20 RF estão atendidos, com código, teste efetivo (três mutações
vermelhas) e foto lida. Todos os testes que rodei passaram, e o processo está em ordem. O caminho até APROVADA é a
correção C1 pelo caminho (a), com os dois casos de e2e que medem a altura no projeto `chromebook` e as fotos da vitrine
lidas de novo, ou a revisão do RF20 pelo caminho (b), com a palavra do Joaquim. Depois disso, a revalidação confere
só o C1 e roda de novo os e2e de `aluno-eu` e `aluno-inicio`.

### 6. Pendências herdadas

| Pendência | Dono | Arquivo | Destino |
|---|---|---|---|
| M1: região do aviso de privacidade baixa no computador | frontend | `apps/web/src/componentes/introducao/RegiaoQueRola.tsx` | `TODO.md` |
| M2: título da tarefa cortado a 360 px | frontend | `apps/web/src/componentes/ui/Linha.tsx`, `areas/aluno/Atividades.tsx` | `TODO.md` |
| M3: papel em minúsculo no rodapé da lateral | frontend | `apps/web/src/componentes/CascaDaEscola.tsx` | `TODO.md` |
| M4: a mensagem fixa do Tutor no assunto delicado não diz que o professor é avisado | Joaquim | `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts` | decisão em `estado.md`, depois uma correção |
| M5: a vitrine sem tarefa "Para fazer" e sem tarefa a entregar | processo | `tools/vitrine/escola.ts` | já no `TODO.md` |
| A revisão do texto do aviso por orientação educacional e por advogado, antes do primeiro aluno real | Joaquim e Gabriel | `docs/lgpd.md` seção 9, item 12 | já registrada nos três documentos |
| O art. 24 do ECA Digital: o aviso também ao responsável? | produto | PRD §10 | F9 |
| Commits `Fora do processo:` com código da spec | — | — | nenhum |
