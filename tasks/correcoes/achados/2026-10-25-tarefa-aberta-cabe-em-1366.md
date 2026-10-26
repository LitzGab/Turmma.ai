# Achados das revisões — `tasks/correcoes/2026-10-25-tarefa-aberta-cabe-em-1366.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-25 23:36:10 · `tasks/correcoes/2026-10-25-tarefa-aberta-cabe-em-1366.md`

VEREDITO: APROVADO
Caminho quente tocado: prova. Só a disposição da tela muda; o salvamento por item, a fila de respostas e o envio ficam como estavam.
Rate limit: ok. Nada foi tocado no servidor.
Fila e prioridade: ok. Nada mudou.
Concorrência: protegida. Nenhuma chamada nova à API, nenhum `useMutation` novo e nenhum estado novo em memória no servidor. O envio continua passando por `definirConfirmando` e pelo mesmo caminho de antes.
Índice e paginação: ok. Não há query nova.
Degradação de IA: não se aplica. "Pedir ajuda ao Tutor" só muda de lugar na tela, e o fluxo do Tutor é o mesmo.
Migration: não se aplica.
Métrica e alerta: ok. Não entra código novo no caminho quente do servidor.
Bloqueantes: nenhum.
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/ui/BarraPresa.tsx:83`: a prop `className` nova deixa qualquer tela sobrescrever o `sticky` da barra sem dizer o motivo. Vale um nome mais específico, como `soltaApartirDe`, para que um uso fora do RF20 apareça na revisão.
- Os testes novos não chamam provedor pago, e o e2e da tarefa aberta no `chromebook` passa a cobrir a medida que faltava. Como a vitrine não tem tarefa "Para fazer" (M5), a forma aberta e a corrigida com 4 questões só foram fotografadas às 22:48, antes das últimas edições. A validação deve fotografar as duas de novo.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 23:36:21 · `tasks/correcoes/2026-10-25-tarefa-aberta-cabe-em-1366.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. A mudança é só de layout no `apps/web` e no e2e, e não toca API, schema, job, seed, importação nem webhook. Todos com autor humano? Sim, porque nada aqui escreve em `Nota`.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok. A forma corrigida continua mostrando a assinatura da função com o selo "IA" (`apps/web/src/areas/aluno/Atividade.tsx:311`) e "Correção aprovada por <professora> · <data>" (`apps/web/src/areas/aluno/Atividade.tsx:312`). As duas só mudaram de lugar, para a coluna da esquerda. Nas fotos `aluno--aluno-atividades--Estequiometria-lista-sintética--computador.png` / `--celular.png` e `tarefa-corrigida-{chromebook,celular}.png`, as duas aparecem antes do "Você acertou X de Y" e da lista, no computador e no celular. É correção de objetiva com aprovação humana, dentro da D56. Não há discursiva nem redação nesta tela.

Supervisão do tutor: ok. O link "Pedir ajuda ao Tutor nesta questão" passou para o cartão da questão e continua escondido em avaliação (`apps/web/src/areas/aluno/Atividade.tsx:222`, `!prova.avaliativa`). Há mutação declarada contra o caso e2e da avaliação. A mudança não abre nenhum caminho novo até o Tutor.

Autonomia declarada e visível: sim, sem alteração nesta tarefa. A saída de IA continua rotulada como IA na tela do aluno.

Bloqueantes: nenhum.

O que a correção resolve na minha regra (4b, D59, ponto de parada): antes, a barra presa cobria "Enviar a atividade" e o "Pode parar quando quiser…" a 1366 × 768. Agora os três ficam numa linha só a partir de 768 px (`apps/web/src/areas/aluno/Atividade.tsx:239`, `:246`, `:249`). Na foto `tarefa-aberta-chromebook.png`, "Enviar a atividade", o ponto de parada, "Anterior" e "Próxima" aparecem inteiros, sem nada por cima. Quem prova isso é o caso e2e "Para fazer… cabe em 1366 × 768", que mede o ponto de parada com `toBeInViewport({ ratio: 1 })` e `elementFromPoint`, e as mutações registradas na tarefa. No celular, sair continua tão curto quanto antes.

Recomendações:
1. No celular (`tarefa-aberta-celular.png`), o ponto de parada fica no fim da página, abaixo de "Enviar a atividade", e só aparece depois de rolar. É o mesmo comportamento de antes desta correção (a 6.1), então não é regressão. Mas o item 4b proíbe "esconder o ponto de parada". Vale levar à validação a ideia de deixar o texto à vista também a 360 px, por exemplo como informação da própria `BarraPresa`, ou registrar por que o fim da página basta.
2. A foto da vitrine `aluno--aluno-atividades--Estequiometria-lista-sintética--computador.png` mostra dados sintéticos que não batem entre si. Aparece "Você respondeu 0 de 4 questões", "Você acertou 3 de 4 questões" e todas as questões como "Ficou em branco". Não é falha da regra 70, mas uma tela de resultado de correção aprovada que se contradiz enfraquece a demonstração à coordenação. Vale corrigir o seed da vitrine (M5) para o diagnóstico ser coerente com as respostas.
3. As fotos de tarefa aberta e corrigida são do Implementador, das 22:48, anteriores às últimas edições. A prova do código atual são os dois casos e2e novos, que rodam nos dois projetos. Convém refazer as fotos quando a vitrine ganhar a tarefa "Para fazer".

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Atividade.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/ui/BarraPresa.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/ui/midia.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Atividade.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/aluno-atividade.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/correcoes/2026-10-25-tarefa-aberta-cabe-em-1366.md

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-25 23:36:22 · `tasks/correcoes/2026-10-25-tarefa-aberta-cabe-em-1366.md`

VEREDITO: APROVADO
Tela vista: sim (6 fotos lidas: a tarefa corrigida no computador e no celular, da vitrine; a tarefa aberta e a corrigida com 4 questões no Chromebook e no celular, do Implementador. Escola cheia. A escola vazia não tem foto, porque o aluno dela não tem tarefa). A ressalva do prompt sobre o horário das fotos do Implementador não se confirma: `tarefa-aberta-chromebook.png` é de 23:35, depois das últimas edições (`Atividade.tsx` 23:24, `BarraPresa.tsx` 23:17). Elas mostram o código atual, por exemplo o "Pedir ajuda ao Tutor" dentro do cartão. Eu não rodei o e2e. Rodei só o vitest de `Atividade.test.tsx`, que passou (26 casos).
Estados: ok. A correção não mexe em carregando, erro nem vazio de `Atividade.tsx`. A foto mostra o estado com dado nas duas formas, aberta e corrigida.
Acessibilidade: ok.
- A lista "Questão por questão" rola por dentro e só vira parada do Tab (`tabIndex` 0) quando rola de fato, a partir de 1024 px. O foco visível é o global de `apps/web/src/estilos.css:338`.
- Os botões e o link seguem com nome e rótulo. O e2e roda a verificação de acessibilidade (axe) nas duas formas (`violacoesGraves`).

Chromebook fraco: ok.
- A 1366 × 768 a tarefa aberta cabe: "Enviar a atividade", o ponto de parada, "Anterior" e "Próxima" ficam numa linha só, sem nada por cima, e o ponto de parada está sempre à vista (D59, regra 70 item 4b).
- A corrigida cabe com o resumo e a lista em duas colunas. A lista rola por dentro, o que `docs/interface.md` 11 aceita.
- Não há blur nem nova virtualização. O recorte do `sr-only` por `relative` é explicado no código.

Celular: ok.
- A 360 px não há rolagem horizontal nem texto cortado.
- A barra "Anterior / Próxima" continua presa embaixo e "Enviar a atividade" mantém 44 px. `contents` devolve os três blocos para a coluna.
- O link "Pedir ajuda ao Tutor" agora vem no cartão da questão, logo abaixo do estado da resposta.
- Nos artefatos das fotos de página inteira, a barra de baixo da casca aparece no meio da imagem e o cartão da questão aparece cortado. É efeito do `sticky` e do `fixed` na captura, não defeito de tela.
- Nenhum fluxo exige o celular.

Ação oficial protegida: sim. "Enviar a atividade" continua abrindo `DialogoDeConfirmacao` (`Atividade.tsx`, já existente), e o diff não tocou esse fluxo. Em avaliação o link do Tutor continua não existindo, conferido no diff e coberto pelo e2e da avaliação.

Bloqueantes: nenhum.

Recomendações:
1. `apps/web/src/areas/aluno/Atividade.tsx:332`: a lista que rola corta o último cartão no meio na foto do computador. Isso sugere a rolagem, mas um degradê ou uma sombra no pé deixaria claro que há mais questões. Hoje só quem arrasta o mouse ou usa o Tab descobre.
2. `Atividade.tsx:332`: a lista (`role="group"`) e a `section` pai usam o mesmo `aria-labelledby="titulo-por-questao"`, então o leitor de tela anuncia "Questão por questão" duas vezes. Dê à lista um rótulo próprio, ou tire o `group` quando ela não rola.
3. Entre 768 e 1023 px, a linha das ações quebra e a barra solta deixa de ser presa. Isso é aceitável para o RF20, mas vale uma foto em 800 px na próxima rodada de tela.
4. O `jsdom` não mede CSS, então o "cabe em 768 px" só tem prova no e2e. Mantenha o caso no portão do `chromebook`.

## test-engineer · 1ª rodada · APROVADO · 2026-10-25 23:36:48 · `tasks/correcoes/2026-10-25-tarefa-aberta-cabe-em-1366.md`

VEREDITO: APROVADO

**Cenários exigidos (correção de layout, sem dado, API nem concorrência):**
- **Caminho feliz, "Para fazer" a 1366 × 768.** A página cabe na janela. "Enviar a atividade", o ponto de parada, "Anterior", "Próxima" e "Pedir ajuda ao Tutor" ficam à vista e sem nada por cima. A barra deixa de ser presa.
- **Caminho feliz, corrigida com quatro questões a 1366 × 768.** O resultado aparece em duas colunas, a lista rola por dentro e recebe foco pelo teclado.
- **Borda, celular a 360 px.** A barra continua presa embaixo, abaixo de "Enviar" e do ponto de parada. A lista não vira uma segunda rolagem e não é parada do Tab.
- **Borda, avaliação.** O link do Tutor continua sem existir, agora que ele foi para dentro do cartão.
- **Borda, D59.** O ponto de parada fica sempre à vista na janela larga.
- **Permissão e isolamento.** Não se aplicam: só muda a camada de apresentação, sem endpoint, query ou dado de outra pessoa.
- **Concorrência.** Não se aplica.

**Cobertos:**
- **e2e/aluno-atividade.spec.ts**, nos dois projetos:
  - `"Para fazer", na questão de enunciado mais longo, cabe em 1366 × 768: …`. Usa `position: static`, `scrollHeight ≤ 768`, `toBeInViewport({ratio:1})` e `elementFromPoint` no centro e na borda de baixo. No celular, confere `sticky` e a ordem vertical.
  - `corrigida, com quatro questões, cabe em 1366 × 768: …`. Confere `scrollHeight ≤ 768`, a lista à direita do resumo, `scrollHeight > clientHeight` da lista e `tabindex="0"`. No celular, confere o contrário.
  - O caso de 360 px que já existia ganhou uma mutação nova (sem `contents`).
- **Atividade.test.tsx**, dois casos novos, que rodei: 26 de 26 verdes.
  - `"Enviar a atividade", o ponto de parada e a navegação são uma linha só em janela larga; …`
  - `a lista "Questão por questão" rola por dentro e ganha foco só a partir de 1024 px; …`, que também prova o lado do celular, sem `tabindex`.
- **Avaliação sem o link do Tutor.** O caso que já existia ganhou um bloco de mutação (`{true && (`).
- **Seção "Mutações".** Conferi contra o `git diff`. Cada cláusula de comportamento nova tem o seu bloco:
  - `contents md:flex`
  - `md:static`, nos dois lados (tela e prop do `BarraPresa`)
  - `md:border-t-0`
  - `md:flex-1` no ponto de parada
  - `relative`, `lg:max-h` e `lg:overflow-y-auto` da lista
  - o grid de duas colunas
  - o `tabIndex` condicional
  - o `useMidia(A_PARTIR_DE_1024)`
  - o `!prova.avaliativa` na posição nova

  Cada bloco aponta um teste que chega à cláusula.
- **Os quatro testes do "Teste que reproduz".** Cada um existe com o nome citado.
- **Sem `.skip`, sem provedor de IA.** O stub de `matchMedia` segue o padrão de outros 40 arquivos de teste e implementa a semântica de `min-width`, sem esconder a regra.
- **Fotos.** A corrigida da vitrine (1366) mostra duas colunas e a lista cortada embaixo, rolando por dentro. A do Implementador, "Para fazer" na questão 2, mostra uma linha só, nada coberto e o ponto de parada à vista.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **`apps/web/src/areas/aluno/Atividade.tsx:191`.** O `md:border-t-0 md:pt-0 md:justify-start` do invólucro de "Enviar" não tem bloco de mutação nem asserção. O `pt-4` que sobraria (16 px) cabe na tolerância de `Math.abs(proxima.y - linhaDoEnvio.y) < linhaDoEnvio.height` (cerca de 44 px), então o caso de 1366 não pegaria o desalinhamento. O defeito é só visual e não toca regra. Sugestão: incluir essas classes na lista de `classesDo` do caso de unidade da linha, como já se fez com `md:border-t-0` e `md:py-0` da barra.
2. **`md:ml-auto` do `BarraPresa`.** Está sem asserção. Hoje o `md:flex-1` do ponto de parada já empurra a barra para a direita, então a classe é redundante. Vale removê-la ou cobri-la.
3. **Letra Maior a 1366 × 768.** O documento declara que nesse caso a página volta a rolar (RF11). Nenhum caso prova que, mesmo assim, "Enviar a atividade" e o ponto de parada continuam alcançáveis e sem barra por cima. Fica para a validação.
4. **A vitrine continua sem tarefa "Para fazer" (M5).** A foto da tarefa aberta é a do Implementador, de antes das últimas edições. O e2e cobre a medida, mas a validação vai querer a foto do código de agora.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/correcoes/2026-10-25-tarefa-aberta-cabe-em-1366.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Atividade.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Atividade.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/ui/BarraPresa.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/componentes/ui/midia.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/aluno-atividade.spec.ts

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-25 23:55:52 · `tasks/correcoes/2026-10-25-tarefa-aberta-cabe-em-1366.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: corrigida no computador e no celular, da vitrine de hoje; tarefa aberta no Chromebook e no celular, as do Implementador da rodada anterior). Não há foto da escola vazia, porque o aluno dela não tem tarefa.
Estados: ok. Esta rodada não mexeu em carregando, vazio e erro. A tarefa corrigida e a aberta continuam com os quatro.
Acessibilidade: ok. Antes, a lista "Questão por questão" e a seção pai tinham o mesmo nome. Agora a lista só vira `role="group"` com `aria-label="Questões corrigidas"` e `tabIndex 0` quando rola (`Atividade.tsx:332`). O critério é o `useMidia(A_PARTIR_DE_1024)`, o mesmo ponto de corte do `lg:overflow-y-auto` de `LISTA_QUE_ROLA` (`Atividade.tsx:70`). No celular não há foco inútil nem nome duplicado. Quando rola, o teclado alcança a lista.
Chromebook fraco: ok. A foto do computador mostra "Seu resultado" inteiro em 1366 × 768, com a lista rolando por dentro e a página sem rolagem (`Rolam a 1366 × 768: nenhuma`). A tarefa aberta cabe em uma linha: "Enviar a atividade", o ponto de parada e "Anterior"/"Próxima". Sem `md:ml-auto`, a barra continua à direita pelo `md:flex-1` do ponto de parada (`Atividade.tsx:262`).
Celular: ok. Em 360 px não há rolagem horizontal nem texto cortado. A lista corrigida rola com a página, sem segunda rolagem. "Anterior" e "Próxima" ficam presas embaixo, e "Enviar a atividade" fica abaixo do fio. As fotos da tarefa aberta são da rodada anterior e valem como indicativas.
Ação oficial protegida: sim. O envio abre `DialogoDeConfirmacao` com a atividade, o que foi respondido e o que ficou em branco, e avisa que não dá para mudar depois. Esta rodada não alterou esse fluxo. O resultado só aparece depois da aprovação da professora. Ele traz o selo IA e quem aprovou, sem nota nem percentual.
Bloqueantes: nenhum.
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Atividade.tsx:303`: o comentário novo acima de `listaRola` ficou numa linha só, bem comprida. Quebrar em duas linhas, como o resto do arquivo.
- Na foto da vitrine, "Você respondeu 0 de 4 questões" convive com "Você acertou 3 de 4". É inconsistência do dado sintético da vitrine, não da tela. Vale ajustar o seed para a foto não confundir quem a lê.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-25 23:56:18 · `tasks/correcoes/2026-10-25-tarefa-aberta-cabe-em-1366.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok (a rodada não mexe em nada de rede)
Fila e prioridade: ok (não se aplica)
Concorrência: protegida (nenhuma escrita nova; a resposta salva por item na prova continua igual)
Índice e paginação: ok (nenhuma query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (nenhum código novo no servidor)
Bloqueantes: nenhum
Recomendações:
- Da 1ª rodada, sigo de acordo com o destino que o documento deu:
  - A troca do nome `className` da `BarraPresa` foi recusada com motivo. Reabre se outro uso sobrescrever o `sticky`.
  - Refotografar a tarefa aberta e a corrigida com quatro questões ficou para a validação, por causa da M5.
- O que mudou desde a 1ª rodada está todo no navegador: classes de layout, o `role` e o `aria-label` da lista que rola, e os testes. Não entra chamada à API nem estado no servidor. As três mudanças estão no código atual:
  - o invólucro de "Enviar", em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Atividade.tsx:240`;
  - o `md:ml-auto` saiu da `BarraPresa`;
  - o grupo "Questões corrigidas", só a partir de 1024 px, na linha 332 do mesmo arquivo.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-25 23:56:18 · `tasks/correcoes/2026-10-25-tarefa-aberta-cabe-em-1366.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A rodada 2 só muda classes Tailwind, troca o nome da lista que rola (agora com o rótulo fixo "Questões corrigidas") e põe o `role="group"`/`tabIndex` só quando a lista rola (`apps/web/src/areas/aluno/Atividade.tsx:332`). Mudaram também testes de unidade e o e2e. Nenhum campo, DTO, chamada à API, log, storage ou envio novo. A árvore de trabalho em `apps` e `e2e` é igual à `eddc7893`, que foi a árvore auditada.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. Não muda. A tela continua lendo `/v1/atividades-aplicadas/:id/prova` e `/meu-diagnostico`, do próprio aluno, como na rodada 1.

Logs: limpos. Nenhum `console` nem logger no diff.

Auditoria: presente. Nenhuma ação nova que a exija (a tela é o aluno lendo o próprio resultado).

Envio externo: nenhum.

Seed/fixture: sintético. Os testes usam ids e respostas fabricados. As fotos mostram "Colégio sintético da vitrine cheia 85be806b", "Aluno Sintético Caio df86225e", "Professora Sintética Helena DF86225E" e "Estequiometria: lista sintética".

Fotos (`.processo/vitrine/aluno--aluno-atividades--Estequiometria-lista-sintética--computador.png` e `...--celular.png`): o aluno vê só o próprio resultado, o agregado por habilidade, a resposta certa de cada questão e o nome de quem aprovou a correção. Esse nome já vinha da rodada 1 e é o registro de aprovação humana da regra 70. A foto não mostra nome, matrícula nem resposta de outro aluno. O rótulo novo é texto fixo, sem dado de pessoa.

Pergunta de fechamento: inalterada por esta rodada. O diff não cria dado novo nem destino novo.

Bloqueantes: nenhum. A rodada 1 não exigiu correção.

Recomendações: nenhuma de privacidade. As fotos mostram "respondeu 0 de 4" com "acertou 3 de 4" e todas as questões "em branco". É um problema do seed da vitrine, não de dado pessoal, e já está registrado no `TODO.md` pelo conformidade-reviewer.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-25 23:56:19 · `tasks/correcoes/2026-10-25-tarefa-aberta-cabe-em-1366.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta rodada. A mudança só mexe em classes de layout e nos atributos de acessibilidade da lista em `apps/web/src/areas/aluno/Atividade.tsx`. Todos com autor humano? sim, porque nenhum caminho foi criado ou alterado. A árvore de trabalho é igual a `eddc7893` em `apps` e `e2e`.

Decisão autônoma sobre aluno: ausente

Aprovação registrada: ok. O resultado do aluno continua mostrando "Correção aprovada por <professora> · data/hora" (`apps/web/src/areas/aluno/Atividade.tsx:312`). Aparece nas fotos `aluno--aluno-atividades--Estequiometria-lista-sintética--computador.png` e `--celular.png` e em `tarefa-corrigida-chromebook.png`. É correção de objetiva, onde a D56 permite contagem de acertos depois da aprovação. Não aparece discursiva nem redação.

Supervisão do tutor: ok. O botão "Pedir ajuda ao Tutor nesta questão" continua igual (`tarefa-aberta-chromebook.png`). O diff não mexe no tutor.

Autonomia declarada e visível: sim. A tela continua com o selo "Assistente · correção de objetiva" e a marca "IA" no computador e no celular. Esta tarefa não mexe na governança.

Bloqueantes: nenhum.

Conferência do que mudou desde a rodada aprovada:
- Tirar `md:ml-auto` da `BarraPresa` (`Atividade.tsx:249`) é só alinhamento. O ponto de parada "Pode parar quando quiser…" (`Atividade.tsx:246`) continua na mesma linha que "Enviar" e a navegação, e nada o esconde (D59, regra 70 item 4b).
- A lista "Questões corrigidas" (`Atividade.tsx:332`) só ganha `role`, nome e `tabIndex` a partir de 1024 px. Não acrescenta medição, rastreio de foco nem nada que observe o aluno (item 7).
- Testes: as asserções do invólucro de "Enviar" e o caso do celular sem grupo nem tabindex (`Atividade.test.tsx` e `e2e/aluno-atividade.spec.ts`) só tratam de layout. Não removem nenhuma asserção de regra 70.

Recomendações:
1. Reforço a recomendação 2 da rodada anterior, a seed da vitrine. Na foto `aluno--aluno-atividades--Estequiometria-lista-sintética--computador.png` (e `--celular.png`), a tela diz "Você respondeu 0 de 4 questões", as quatro questões aparecem como "Ficou em branco", e mesmo assim diz "Você acertou 3 de 4 questões". É um dado sintético incoerente, não uma violação de regra. Mas um resultado aprovado que contradiz as respostas é exatamente o que uma coordenadora repara numa demonstração de conformidade. O destino já registrado em "Sem aplicar" continua valendo.
2. As recomendações 1 (ponto de parada no celular) e 3 (fotos da escola vazia e da forma "Para fazer" na vitrine) seguem com o destino já registrado. Não há fato novo nesta rodada.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Atividade.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Atividade.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/aluno-atividade.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/.processo/vitrine/aluno--aluno-atividades--Estequiometria-lista-sintética--computador.png

## test-engineer · 2ª rodada · APROVADO · 2026-10-25 23:56:22 · `tasks/correcoes/2026-10-25-tarefa-aberta-cabe-em-1366.md`

VEREDITO: APROVADO

Cenários exigidos (rodada 2, só o que mudou desde a 1ª):
- A tela a 1366 × 768, sem o `md:ml-auto` na barra: "Enviar a atividade", o ponto de parada e a navegação continuam numa linha só, e a barra só fica presa no celular.
- A partir de 768 px, o invólucro de "Enviar" perde o fio e o respiro de cima e fica à esquerda (`md:justify-start md:border-t-0 md:pt-0`).
- A lista "Questão por questão" só vira grupo com nome próprio ("Questões corrigidas") e entra no Tab quando rola, a partir de 1024 px. Abaixo disso não tem grupo nem tabindex, e não rola por dentro.
- Cada bloco de "Mutações" confere com o código de agora.

Cobertos:
- **As três correções exigidas foram feitas:**
  - O teste "uma linha só em janela larga" ganhou a asserção das classes do invólucro de "Enviar" (`Atividade.test.tsx:570-572`), e as três mutações dela (linhas 81-100 do documento) tiram cada classe e ficam vermelhas.
  - Não sobrou `md:ml-auto` em `Atividade.tsx:249`, e nenhum bloco de mutação cita mais essa linha.
  - O grupo só existe quando a lista rola (`Atividade.tsx:332`).
- **Os blocos conferem com o código.** Cada linha "−" dos blocos existe hoje em `Atividade.tsx`: linhas 70, 222, 239, 240, 246, 249, 304, 308 e 332.
- **Os blocos novos do grupo derrubam testes reais:**
  - O bloco que tira o `aria-label` derruba o `getByRole('group', { name: 'Questões corrigidas' })` do teste de unidade (`Atividade.test.tsx:383`).
  - `listaRola = true` derruba a asserção do celular (`Atividade.test.tsx:396`), pela regra e não por erro de carga.
  - O bloco que tira o grupo inteiro derruba o e2e (`e2e/aluno-atividade.spec.ts:638`, com o `toHaveAttribute('tabindex','0')` da linha 650).
- **O celular está provado nas duas camadas:**
  - Na unidade, não há grupo e nada com `[tabindex]` dentro da seção (`Atividade.test.tsx:395-397`).
  - No e2e, o grupo tem contagem 0, a lista não rola por dentro e não tem tabindex (`e2e/aluno-atividade.spec.ts:655-658`). O `resultado.locator('ol')` não é ambíguo: o único outro `ol` da tela (`Atividade.tsx:157`) fica em Respondendo, fora de "Seu resultado".
- **As asserções medem o resultado.** Os e2e conferem altura, posição, "à vista" e tabindex. O de unidade confere as classes, porque o jsdom não calcula CSS, e o documento declara esse limite.
- Não há `.skip`, teste comentado nem mock que esconda a regra. Não há IA nem concorrência nesta correção.
- `npx vitest run src/areas/aluno/Atividade.test.tsx` passou: 26 de 26. Não rodei o e2e.

Bloqueantes: nenhum.

Recomendações:
1. Em `e2e/aluno-atividade.spec.ts:656`, prender o localizador à seção, com `resultado.getByRole('region', { name: 'Questão por questão' }).locator('ol').locator('xpath=..')`. Assim um segundo `ol` que entre no resumo não muda o elemento medido.
2. Seguem as recomendações da 1ª rodada que o documento mandou para a validação: a letra Maior a 1366 × 768 (RF11) e as fotos da tarefa aberta, que a vitrine ainda não alcança (M5).

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Atividade.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/apps/web/src/areas/aluno/Atividade.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/e2e/aluno-atividade.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l1/tasks/correcoes/2026-10-25-tarefa-aberta-cabe-em-1366.md
