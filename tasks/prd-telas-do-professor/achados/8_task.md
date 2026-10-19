# Achados das revisões — `tasks/prd-telas-do-professor/8_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 11:03:49 · `tasks/prd-telas-do-professor/8_task.md`

VEREDITO: APROVADO
Tela vista: sim (12 fotos lidas: atividade objetiva, plano de aula e adaptação, em 1366 px e em 360 px, na escola cheia e na vazia)
Estados: ok. Carregando e erro foram conferidos só pelo código e pelo teste de componente, porque a vitrine não os mostra. O teste cobre carregando, erro com "Tentar de novo", "Falta uma turma confirmada" com "Ir para Turmas", função suspensa e com dado. Em todos eles "Como vai sair" continua à vista, porque o `<aside>` fica fora do cartão do motor (`Ferramenta.tsx:48`). O estado vazio da Adaptação ("Ainda não há atividade para adaptar", com "Gerar uma atividade") convida e diz o próximo passo.
Acessibilidade: ok. O `<aside>` tem `aria-labelledby` apontando para o `h2` "Como vai sair", e o título da ferramenta continua o único `h1`. O texto é `text-sm` em cor de tinta, sem dependência de hover.
Chromebook fraco: ok. É uma lista estática de três linhas, sem imagem, sem efeito e sem estado novo.
Celular: ok. A 360 px as fotos mostram uma coluna sem rolagem horizontal, com "Como vai sair" depois do formulário. A ação principal "Gerar …" fica visível e tem altura de 44 px ou mais. A barra de abas inferior aparece sobre o meio das fotos de celular, mas isso é efeito da captura de página inteira e não defeito da tela. O e2e `professor-ferramentas.spec.ts` mede 1 coluna a 1023 px e 2 colunas a 1024 px, e confere `larguraExcedente` igual a 0.
Ação oficial protegida: sim. A tarefa não cria ação oficial. O texto diz que a atividade só vai à turma com "Aplicar à turma", que existe em `AplicacaoDoArtefato.tsx:115`. Diz também que a adaptação nasce esperando a aprovação (`Artefato.tsx:35` mostra a entrega pendente). Não há prévia, nota ou diagnóstico (D46), e o texto da Adaptação não cita aluno nem condição (D35), com teste que prova as duas coisas.
Bloqueantes: nenhum

Fotos e código: todas as seis telas (cheia e vazia) concordam com `Ferramenta.tsx` e `COMO_VAI_SAIR`. Na única que rola a 1366 × 768, a Adaptação cheia (782 px), quem rola é o miolo, com o botão "Gerar versão adaptada" a 704 px, à vista.

Recomendações:
- `apps/web/src/areas/professor/ferramentas.ts:93`: o catálogo mostra a descrição da ferramenta logo acima do formulário, e a primeira linha de "Como vai sair" a repete quase igual em Atividade objetiva, Plano de aula e Adaptação. Depois do F7, vale diferenciar. A descrição diria para que serve, e a linha de "Como vai sair" diria o que chega à professora.
- `ferramentas.ts:93`: a atividade objetiva traz `"Aplicar à turma"` com aspas retas, e `AtividadesDaTurma.tsx:30` usa aspas tipográficas “Aplicar à turma”. Padronizar. Hoje o teste compara com a string literal, então mudar as aspas exige mudar o e2e (que copia o texto de propósito) e o teste da unidade juntos.
- Na Adaptação, a linha "Só vai à turma depois de aprovada. Só o tipo da adaptação é registrado." junta duas ideias numa linha só, e na foto de celular ela quebra em três linhas visuais. Separar em duas só seria possível passando para a quarta linha, o que o limite de três proíbe. Fica como está, é só observação de texto.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-19 11:03:58 · `tasks/prd-telas-do-professor/8_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. A tarefa só muda a tela e um texto fixo, sem API, job, seed nem importação. Todos com autor humano? sim (nenhum caminho foi criado ou alterado)
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. O texto fixo diz o mesmo que o servidor faz:
- **Adaptação**: diz que "nasce esperando a sua aprovação" e que só vai à turma depois de aprovada. O servidor recusa aplicar uma versão adaptada que não foi aprovada, com o erro `VERSAO_ADAPTADA_NAO_APROVADA`, e a escrita fica na auditoria como `atividade.aplicada` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/api/src/atividade/atividade-aplicada.service.ts:70-72`).
- **Atividade objetiva**: só vai à turma por "Aplicar à turma", que é um ato humano gravado com autor.
- **Plano de aula**: "não vai à turma".
Supervisão do tutor: não se aplica. A tarefa não toca no tutor.
Autonomia declarada e visível: sim. A tarefa não muda a autonomia de nenhum agente, e o texto da Adaptação diz em português comum que a versão espera a aprovação da professora.

**O que vi nas fotos e o código que produz**
- **Sem nota nem conceito (D46, D55)**: nenhuma das seis telas tem nota, conceito, pontuação nem sugestão de nota. Fotos `professora--professor-ferramentas-{atividade-objetiva,plano-de-aula,adaptacao}--{computador,celular}.png` e as da escola vazia; o texto vem de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/ferramentas.ts:85-101`.
- **Adaptação sem dado do aluno (D35, D67)**: o formulário só tem a atividade de origem e os tipos da lista fechada, com o aviso "aqui não se escreve sobre o aluno". "Como vai sair" não cita aluno nem condição. Isso vale nas fotos de computador, de celular e da escola vazia.
- **Sem prévia**: o texto não muda ao preencher nem ao gerar. Um teste de componente prova isso (`Ferramenta.test.tsx`, "sem prévia") e o e2e também ("dois cliques em 'Gerar'…", que confere que o tema digitado não entra no texto).
- **Nada que induza uso (D59)**: nenhuma das fotos mostra recompensa, contagem nem apelo.

**A regra está provada por teste**
- `ferramentas.test.ts` exige um texto por ferramenta, de até três linhas.
- Uma lista de palavras proibidas tem teste que prova que ela pega o que diz pegar.
- O texto da Adaptação é verificado contra palavras sobre aluno e condição.
- Há frases obrigatórias: "esperando a sua aprovação" e "Só o tipo da adaptação é registrado".
- As mutações declaradas para essas frases (tirar "esperando a aprovação", tirar "só o tipo", pôr "nota", pôr "para cada aluno") deixam o teste certo vermelho.

Bloqueantes: nenhum

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/ferramentas.ts:86` e `:91`: o texto não diz que quem gera o conteúdo é a IA. Uma linha como "A IA gera…" reforçaria a regra 70, item 4a, sem custo. Não bloqueia, porque o artefato em si já leva o rótulo de IA.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/professor-ferramentas.spec.ts:81-92`: o texto é copiado de propósito no e2e, mas a cópia não inclui o `plano_de_aula`. Vale completar, ou deixar um comentário dizendo que o plano fica coberto só pela unidade e pelo teste de componente.
3. Fica para o `/retro`: a "Atividade objetiva" vai ao aluno por "Aplicar à turma", que é um ato humano gravado. Mas ela não passa por uma entrega com rejeição e justificativa, como pede a regra 70, item 3. Isso já existia antes desta tarefa, que não muda nada aí. Convém registrar se "não aplicar" conta como a rejeição desse item, ou se a atividade objetiva precisa de entrega própria antes do piloto.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-19 11:04:12 · `tasks/prd-telas-do-professor/8_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

Recomendações:
- `apps/web/src/areas/professor/ferramentas.ts`, terceira linha de `adaptacao` em `COMO_VAI_SAIR`: a subtarefa 8.1 pede que o texto diga se a ferramenta vai à turma e **como**. Hoje a linha diz "Só vai à turma depois de aprovada", e quem lê pode entender que aprovar já manda a versão à turma. Pela tela de aplicação, a versão adaptada aprovada continua precisando de "Aplicar à turma" (`apps/web/src/areas/professor/AplicacaoDoArtefato.tsx`, comentário da linha 22). A foto `.processo/vitrine/professora--professor-ferramentas-adaptacao--computador.png` mostra a frase. Dá para seguir a forma da atividade objetiva, por exemplo: "Depois de aprovada, vai à turma quando você escolher 'Aplicar à turma'". A frase sobre o tipo da adaptação pode ir para a segunda linha, para continuar em três.
- `e2e/professor-ferramentas.spec.ts:172`: o texto de `COMO_VAI_SAIR` está copiado à mão no e2e. O comentário justifica a cópia, mas quem mudar o texto em `ferramentas.ts` só descobre a diferença na esteira, porque o e2e não roda na tarefa que não o altera. Vale anotar isso ao lado da constante em `ferramentas.ts`.
- `apps/web/src/areas/professor/Ferramenta.test.tsx:444`: `formulario.parentElement?.parentElement` depende de quantas camadas de `div` há hoje entre o cartão e a grade. Um seletor pela grade, ou o `closest` de um atributo dela, deixaria o teste menos frágil.

Conferi:
- O escopo bate com 8.1 e 8.2. Ficaram de fora "Mais opções", anexo, busca na web e a janela de três passos, e `CartaoDeFerramenta.tsx` não mudou.
- A composição é a da techspec §9 ("o motor e, ao lado a partir de 1024 px, 'Como vai sair'"). O texto é fixo, sem prévia (RF11), e "Como vai sair" continua na tela nos estados de carregando, erro, sem turma e função suspensa.
- O vocabulário respeita RF21 e D46. O texto da Adaptação não fala de aluno nem de condição (D35).
- Os textos batem com o produto: o plano cita a página, porque o schema em `packages/shared/src/assistente/conteudo.ts` exige `pagina`. A versão adaptada só se aplica depois de aprovada.
- As fotos de computador e celular, nas escolas cheia e vazia, mostram duas colunas a 1366 px e uma a 360 px, com o texto depois do formulário. A 1366 × 768 a Adaptação rola 782 px, e o botão "Gerar versão adaptada" fica à vista sem rolar.
- A seção "Divergências" diz "nenhuma", e o código confirma.

## test-engineer · 1ª rodada · APROVADO · 2026-10-19 11:04:29 · `tasks/prd-telas-do-professor/8_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os da seção "Testes que provam a regra" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tasks/prd-telas-do-professor/8_task.md`.
- Um texto por ferramenta, com até três linhas.
- O vocabulário (D46, e a D35 na Adaptação).
- Os cinco estados do formulário, com "Como vai sair" sempre à vista.
- A Adaptação sem campo de texto.
- Sem prévia.
- O endereço que não existe.
- 360 px e 1366 × 768, com o botão de gerar à vista.
- O recomeço, com a segunda pessoa na mesma aba e os dois cliques em "Gerar".

**Cobertos:**
- **Texto e vocabulário.** `ferramentas.test.ts`, no bloco `"Como vai sair"`. As chaves são comparadas com o catálogo, de 1 a 3 linhas. A presença de "Criados" e de "turma" é conferida, e cada ferramenta diz o que fica dela. As palavras proibidas da D46 e a regra da D35 na Adaptação estão cobertas, e há um teste que prova que as próprias listas de palavras proibidas pegam e deixam passar o que dizem.
- **Os estados.** Em `Ferramenta.test.tsx`: carregando, erro com "Tentar de novo" (duas leituras), sem turma com "Ir para Turmas" e a navegação conferida, função suspensa sem `alert`, e com dado nas três ferramentas, por `it.each`.
- **A Adaptação.** Sem `textbox`, `textarea` nem `input` de texto, no componente e no e2e. O pedido continua coberto pelo e2e que já existia.
- **Sem prévia.** No componente, enquanto gera, com um pedido só. No e2e, depois de pronto.
- **O endereço que não existe.** No componente (nenhuma chamada de rede) e no e2e.
- **O layout.** O e2e mede as colunas a 1366 e a 360, a virada exata em 1023 e 1024, a posição e a altura do texto e `larguraExcedente`.
- **Recomeço e concorrência.** O e2e cobre o recomeço e a segunda pessoa sem recarregar a página. Os dois cliques são de verdade no mesmo instante: `doisCliquesNoMesmoInstante` dispara os dois cliques dentro de um único `evaluate`.
- **Mutações.** As 17 do documento batem com o `git diff`: grid, `items-start`, ordem, `aria-labelledby`, `id`, `data-como-vai-sair`, o índice de `COMO_VAI_SAIR`, a entrada da Adaptação, o teto de três linhas e cada frase com regra. Conferi cada uma contra o teste citado: cada teste falha pela cláusula certa, não por acaso.
- **Execução.** Rodei `npx vitest run` sobre `ferramentas.test.ts` e `Ferramenta.test.tsx`: 43 de 43 passaram. Não há `.skip`, nem mock de coisa nossa, nem IA paga. Não há isolamento a testar, porque a tarefa não toca dado de escola.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `apps/web/src/areas/professor/ferramentas.test.ts`, no `VOCABULARIO_PROIBIDO`, o padrão `\bmédia\b` não pega "médias". Trocar por `\bmédias?\b`, no mesmo molde de `notas?` e `conceitos?`.
2. Em `apps/web/src/areas/professor/Ferramenta.test.tsx:190-197`, a busca por campo livre (`textarea, input:not([type="checkbox"])`) roda antes de marcar "Tempo adicional". Repetir a mesma asserção depois do clique, para cobrir também o campo "Tempo extra".
3. Em `e2e/professor-ferramentas.spec.ts`, no teste "dois cliques em Gerar", `expect.poll(...).toBe(1)` aceita o primeiro instante em que a contagem chega a 1. Hoje isso funciona, porque o teste espera o estado "gerando" antes. Para ficar robusto, fixar a contagem depois de um ponto estável. Exemplos: confirmar `toBe(1)` sem poll logo depois de "gerando" aparecer, ou de novo depois de concluir a geração.
4. O botão de gerar à vista a 1366 × 768 só é medido na Atividade objetiva. A Adaptação é a única que rola a 1366, até 782 px na escola cheia. Pela foto, o botão ainda cabe na tela, então vale um caso que prove isso, ou dizer no documento que o cenário vale só para a Atividade.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-19 12:29:55 · `tasks/prd-telas-do-professor/8_task.md`

VEREDITO: APROVADO
Tela vista: sim (14 fotos lidas: atividade objetiva, Adaptação e plano de aula, em computador e celular, na escola cheia e na vazia; as da escola vazia de plano de aula e da atividade objetiva no celular conferi como as demais).
Estados: ok. O vazio da Adaptação convida ("Ainda não há atividade para adaptar", com o botão "Gerar uma atividade") nas fotos vazia--professora--professor-ferramentas-adaptacao--computador.png e --celular.png. Carregando e erro já foram aprovados na rodada 1 e não mudaram no diff.
Acessibilidade: sem mudança no diff. Os campos têm rótulo e "(obrigatório)". A Adaptação segue só com lista fechada e caixas de marcar, sem campo de texto sobre o aluno. O teste novo em `apps/web/src/areas/professor/Ferramenta.test.tsx` prova isso também para o campo que aparece com "Tempo adicional".
Chromebook fraco: ok. O diff mexe só em texto fixo e em teste. A Adaptação rola 782 px a 1366 × 768, e o botão "Gerar versão adaptada" fica à vista (y 683 a 728). O e2e agora mede isso com `ratio: 1`.
Celular: ok. Em 360 px não há rolagem horizontal nem corte. Todas as telas ficam em uma coluna, com "Como vai sair" depois do formulário. O botão principal tem cerca de 44 px de altura. Nas fotos de celular o texto "Como vai sair" aparece parcialmente atrás da barra inferior, porque a barra é fixa e a foto é da página inteira; isso é efeito da captura, não defeito.
Ação oficial protegida: sim. A tela só informa. A Adaptação "nasce esperando a sua aprovação" e, depois de aprovada, vai à turma quando a professora escolher “Aplicar à turma”. O texto bate com o botão real de `apps/web/src/areas/professor/AplicacaoDoArtefato.tsx:115`, com as mesmas aspas tipográficas.

Correções da rodada 1:
- Aspas tipográficas em “Aplicar à turma”: feitas no catálogo, no e2e e nos testes, e há um teste que proíbe aspas retas.
- Linha da Adaptação refeita: o tipo da adaptação foi para a segunda linha, e a terceira diz como a versão vai à turma. Aparece certo nas fotos de computador e de celular.
- Descrição e "Como vai sair" diferenciadas depois do F7: ficou para o TODO.md, como combinado.

Bloqueantes: nenhum.

Recomendações:
- A Adaptação e o plano de aula não têm foto de celular com a barra inferior fora da frente do texto, por causa da captura. Se quiser conferir o fim da página, é melhor fotografar por pedaços.
- O e2e copia o `COMO_VAI_SAIR` à mão, e o comentário em `apps/web/src/areas/professor/ferramentas.ts` já avisa. O `plano_de_aula` não está nessa cópia. Ele fica coberto só pela unidade e pelo teste de componente, que não passam pela tela real. Pode valer incluir o plano de aula no e2e quando houver tarefa que o altere.
- `ferramentas.ts:84-103`: a Adaptação repete "Nasce esperando a sua aprovação" na tela e no texto de ajuda. É aceitável hoje.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-19 12:30:27 · `tasks/prd-telas-do-professor/8_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta rodada. O diff só mexe em texto de tela, em testes de unidade e de componente, e no e2e. Não toca API, repository nem job. Todos com autor humano? sim, nada mudou nisso desde a 1ª rodada, que foi aprovada.

Decisão autônoma sobre aluno: ausente

Aprovação registrada: ok. O texto novo da Adaptação (`apps/web/src/areas/professor/ferramentas.ts:101-104`) diz o que o servidor faz. A versão adaptada nasce pendente, e depois de aprovada ainda precisa de "Aplicar à turma". Conferi isso em três pontos:
- `apps/api/src/atividade/atividade-aplicada.service.ts:70` recusa aplicar com `VERSAO_ADAPTADA_NAO_APROVADA` quando a entrega não está `aprovada`, e o gatilho do banco é a segunda barreira.
- `apps/api/src/artefato/artefato.service.ts:66-68` cria a versão adaptada e a entrega `pendente` na mesma transação.
- `apps/web/src/areas/professor/AplicacaoDoArtefato.tsx:27-31` (`podeAplicar`) faz a mesma checagem na tela.

O texto antigo dava a entender que aprovar já mandava a versão à turma. O novo é mais fiel à regra 70, item 3. A exceção da D47 continua só no Tutor.

Supervisão do tutor: ok. A tarefa não toca no tutor.

Autonomia declarada e visível: sim. Nada mudou nisso.

Bloqueantes: nenhum.

Conferência das correções da ordem `.processo/ordens/8_task-r1.md`:
1. Texto novo da Adaptação: feito, nas três cópias (`ferramentas.ts`, a constante `COMO_VAI_SAIR` do e2e e `ferramentas.test.ts:51`).
2. Aspas tipográficas: feito. O teste novo recusa aspas retas em todas as linhas.
3. `\bmédias?\b`: feito, e o teste das listas proibidas inclui "médias" e "conceitos".
4. A Adaptação continua sem campo de texto depois de marcar "Tempo adicional": feito (`Ferramenta.test.tsx`, linhas novas 200-202).
5. O teste da grade não depende mais das camadas de `div`: feito.
6. Aviso ao lado da constante de que a cópia do texto está no e2e: feito.
7. Comentário sobre o `plano_de_aula` no e2e: feito, como a ordem pedia.
8. Contagem de pedidos fixada depois de um ponto estável: feito. O pedido de gerar mandado duas vezes é a regra 80, item 7.
9. Botão "Gerar versão adaptada" à vista a 1366 × 768, com `ratio: 1`: feito. O mesmo caso confere o texto da Adaptação na tela.

Nas fotos (`.processo/vitrine/`):
- **Adaptação, escola cheia e vazia, computador e celular:** o "Como vai sair" mostra as três linhas novas com aspas tipográficas. O formulário é só lista fechada e diz que ali "não se escreve sobre o aluno". Não aparece nota, conceito nem sugestão de nota.
- **Atividade objetiva** (`professora--professor-ferramentas-atividade-objetiva--computador.png`): aspas tipográficas, e a atividade "só vai à turma quando você escolher". Nada sugere nota.
- **Plano de aula** (`vazia--professora--professor-ferramentas-plano-de-aula--celular.png`): "como avaliar" fala do plano da aula, não traz nota.
- Nenhuma tela leva a usar mais nem dificulta sair: o "Sair" está à vista no computador e no celular.

`docs/regulacao.md` não mudou nesta rodada.

Recomendações:
- Na foto `vazia--professora--professor-ferramentas-adaptacao--celular.png`, a barra de navegação de baixo cobre a última linha do "Como vai sair" no primeiro quadro. O texto continua acessível rolando, então não bloqueia pela regra 70. A qualidade visual é do `frontend-reviewer`.
- Continuam valendo os dois itens que a ordem da 1ª rodada mandou para o `TODO.md` e o `/retro`: a atividade objetiva vai à turma sem entrega com rejeição e justificativa, e o rótulo "A IA gera…" no texto da ferramenta.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-19 12:30:51 · `tasks/prd-telas-do-professor/8_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

Esta rodada aplicou os itens 1 a 9 da ordem `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/.processo/ordens/8_task-r1.md`, um por um:
- **Item 1:** a Adaptação agora diz como a versão aprovada vai à turma: "Depois de aprovada, vai à turma quando você escolher “Aplicar à turma”". Continua com três linhas, e a frase do tipo foi para a segunda.
- **Item 6:** o comentário em `ferramentas.ts` avisa que o e2e tem uma cópia do texto.
- **Item 7:** o e2e explica por que o `plano_de_aula` ficou fora da cópia.
- **Item 9:** o botão "Gerar versão adaptada" foi medido inteiro na tela a 1366 px.
- Também foram aplicados as aspas tipográficas, o `médias?`, a verificação repetida depois de marcar "Tempo adicional" e a contagem fixa depois de gerar. Cada cláusula nova tem um bloco em "Mutações".

As fotos confirmam o texto em `professora--professor-ferramentas-adaptacao--computador.png` e em `vazia--professora--professor-ferramentas-adaptacao--celular.png`. O texto é igual ao de `COMO_VAI_SAIR` e não usa nenhuma palavra proibida. A 1366 × 768 o botão da Adaptação aparece inteiro.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Ferramenta.test.tsx:105-108`: o teste novo (item 5) ficou mais fraco que o anterior. `grade = bloco.parentElement` mais `grade.contains(formulario)` e `!formulario.contains(bloco)` hoje só provam que "Como vai sair" está fora do cartão. Se o `aside` entrar no `div` que envolve o cartão, o teste continua passando. O bloco de mutação desse item aponta para o e2e, que pega o erro, então não bloqueia. Mesmo assim, vale amarrar a grade a um atributo próprio, por exemplo `bloco.closest('[data-grade-da-ferramenta]')`, como a ordem sugeria.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tasks/prd-telas-do-professor/8_task.md`, "Recomendações sem aplicar": duas linhas apontam o `TODO.md` como destino, mas o `TODO.md` não tem esses itens. Pela skill, escolher o destino é tarefa da Mesa e não de quem implementou, mas alguém precisa escrever esses itens lá antes de a spec fechar.
- `professora--professor-ferramentas-atividade-objetiva--celular.png`: a barra de baixo, que fica fixa, cobre o começo de "Como vai sair". Parece efeito da foto da página inteira, e não um defeito da tela. A conferência é do `frontend-reviewer`.

## test-engineer · 2ª rodada · APROVADO · 2026-10-19 12:31:09 · `tasks/prd-telas-do-professor/8_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 1ª rodada (o "Como vai sair" de cada ferramenta: o que sai, onde fica e se vai à turma e como; as duas colunas a 1366 e a coluna única a 360, sem rolar de lado; o botão de gerar à vista; D46 e RF21 sem vocabulário de nota; D35 e D67, a Adaptação sem campo livre e sem falar de aluno; dois cliques mandam um pedido só; ferramenta inexistente responde 404; os quatro estados). Nesta rodada conferi as quatro recomendações que viraram correção (itens 3, 4, 8 e 9) e os itens 1, 2, 5, 6 e 7, que também foram aplicados.

Cobertos:
- **Item 1**, a linha nova da Adaptação, "Depois de aprovada, vai à turma quando você escolher “Aplicar à turma”". Tem asserção em `apps/web/src/areas/professor/ferramentas.test.ts:51`, a cópia no e2e (`e2e/professor-ferramentas.spec.ts:126-127`), a conferência na tela a 1366 (`:337`) e um bloco de mutação ("Depois de aprovada, vai à turma."), que falha no `toContain`.
- **Item 2**, as aspas tipográficas. Tem o teste novo (`ferramentas.test.ts:54-56`), que percorre todas as linhas de todas as ferramentas, e um bloco que volta às aspas retas.
- **Item 3**, `\bmédias?\b`. A lista de autoteste agora inclui "médias" e "conceitos" (`ferramentas.test.ts:64`). O bloco que volta a `\bmédia\b` derruba esse teste.
- **Item 4**, a asserção do campo livre repetida depois do clique (`Ferramenta.test.tsx:201-202`). Pelo bloco, `tempoExtra` vira um campo de texto com a mesma condição `quando`. Confirmei em `motor-formulario.ts:144-146` que a condição vale para qualquer tipo de campo. Então, antes do clique, o campo continua oculto e as asserções 192, 193 e 197 seguem verdes. Só as asserções novas, depois do clique, ficam vermelhas: o teste falha pelo motivo certo.
- **Item 5**, `bloco.parentElement` contém o cartão e o cartão não contém o bloco. A posição real é medida no e2e, e o bloco que move o `</div>` cita o e2e.
- **Item 8**, a contagem fixada sem poll em `e2e/professor-ferramentas.spec.ts:377`, depois das duas esperas sobre o texto ao lado. O bloco remove `if (emCurso(atual)) return undefined`.
- **Item 9**, o botão "Gerar versão adaptada" inteiro na tela (`ratio: 1`) a 1366 × 768, com a atividade semeada para a Adaptação abrir o formulário (`:305-312`, `:335-336`). A foto `professora--professor-ferramentas-adaptacao--computador.png` mostra o botão a cerca de 730 px, dentro dos 768.
- **Itens 6 e 7**: são só comentários, nos dois arquivos, sem cláusula de código.
- **Mutações**: há 22 blocos no documento, o mesmo número das 22 vermelhas que o portão provou. Toda cláusula nova do diff tem o seu bloco. Rodei `npx vitest run` nos dois arquivos de unidade e de componente: 44 testes verdes.
- Não há `.skip`, nem teste comentado, nem mock que esconda a regra. Não há chamada de IA nesta tarefa.

Bloqueantes: nenhum.

Recomendações:
1. `apps/web/src/areas/professor/Ferramenta.test.tsx:12-14`: a nova checagem da grade só exige que o pai do bloco contenha o cartão. Ela continuaria verde se o bloco subisse vários níveis. Isso é aceitável porque o bloco de mutação do item 5 aponta para o e2e, que mede as colunas. Fica registrado que o teste de componente, sozinho, não prova que os dois estão na mesma grade.
2. `e2e/professor-ferramentas.spec.ts:336`: o botão da Adaptação só é medido com o formulário no estado inicial. Com "Tempo adicional" marcado aparece o campo "Tempo extra", e o botão provavelmente sai dos 768 px. O documento diz "o botão de gerar à vista", sem estado. Vale dizer no documento que é o estado inicial, ou medir também com a caixa marcada.
3. Na foto `professora--professor-ferramentas-atividade-objetiva--celular.png`, a barra de navegação de baixo cobre o título "Como vai sair". Pode ser só efeito da captura da página inteira com a barra fixa. Fica para o `frontend-reviewer` confirmar, porque não é questão de teste.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Ferramenta.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/ferramentas.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/ferramentas.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/professor-ferramentas.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tasks/prd-telas-do-professor/8_task.md
