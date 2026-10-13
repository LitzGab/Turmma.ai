# Achados das revisões — `tasks/prd-pele-e-casca/8_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-13 17:56:49 · `tasks/prd-pele-e-casca/8_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A tarefa só mexe no frontend e na documentação, não toca em API, banco, job, seed, importação nem webhook. Todos com autor humano? Não se aplica: nenhum caminho foi criado nem alterado.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok. A `MensagemIA` continua com a `LinhaAprovacao` no mesmo lugar, logo depois do conteúdo e antes das ações (`apps/web/src/componentes/ia/Mensagem.tsx:35-40`). Só o cabeçalho mudou, e passou a ser a `AssinaturaIA` nas duas variantes. O texto de exemplo da galeria fala de correção de objetiva com aprovação do lote (`apps/web/src/galeria/secoes/marca-onca.tsx:27-28`). Não aparece nada de discursiva nem de redação, e nenhuma nota ou conceito (D55).

Supervisão do tutor: ok. A tarefa não altera nada nela. A faixa "Quem dá a aula acompanha como você usa o Tutor." continua visível (`aluno--aluno-tutor--computador.png`).

Autonomia declarada e visível: sim. Nas fotos da tela Agentes, nos dois temas e no celular, cada função continua com o nível em português comum ("Faz e registra", "Faz e avisa", "Propõe e espera aprovação"), com o "Faz sozinha / Espera aprovação" e o "O que a IA nunca faz". Agora o nome da função é o `h2` do cartão, com o selo "IA" ao lado (`apps/web/src/areas/coordenacao/Agentes.tsx:155-157`; fotos `coordenacao--coordenacao-agentes--computador-1.png`, `escuro--…-computador-1.png` e `…-celular-1.png`).

**O que conferi da regra 70, itens 4a e 4b (D58, D80 item 3):**
- **A onça não se passa por pessoa.** É um animal desenhado, só com círculos e retângulos, sem nome, sem `<title>`, sem `<desc>` e com `aria-hidden` (`apps/web/src/componentes/onca/CabecaOnca.tsx:38-66`). Os testes cobrem: nenhum nome acessível da tela casa com `/onça/i` (`e2e/__fixtures__/avatar.ts:50-55`, `avatar-com-funcao-e-selo.test.tsx:213`), e há mutação declarada que põe um `<title>Onça</title>` e exige vermelho.
- **O avatar nunca aparece sozinho.** Ele sempre vem no mesmo bloco que o nome da função e o selo "IA". Isso é garantido pela estrutura, não por combinado: a pasta `componentes/onca/` só é importada pelo `AvatarAgente`, e o `AvatarAgente` só pela `AssinaturaIA` e pela `Mensagem.tsx`. A varredura do grep bate com isso, e o teste é `avatar-so-nas-duas-pecas.test.ts`. O e2e `conferirAssinaturas` passa por cada `[data-agente]` nas quatro telas e na galeria. Nas fotos, todas as onças aparecem com o nome e o "IA" (`coordenacao--galeria--computador-6.png`, `coordenacao--coordenacao-analista--computador.png`).
- **A onça não simula vínculo nem induz uso.** É uma expressão só, parada, que recebe apenas a prop `tamanho`, sem estado, efeito, temporizador, animação ou transição. Os testes são `CabecaOnca.test.tsx:68-139` e, no e2e, `conferirQueOAvatarFicaParado`. Também não há ponto de "online". Em "Preparando a resposta…" o que muda é o texto, e a onça fica igual.
- **Nada de inferência emocional nem de vigilância (item 7).** A prop de humor ou pose é recusada pelo compilador, com `@ts-expect-error` em `avatar-com-funcao-e-selo.test.tsx:117`.
- **Professor (itens 8 e 9).** A tarefa não toca em indicador de professor.

Bloqueantes: nenhum.

Recomendações:
1. A foto de `/aluno/tutor` (`aluno--aluno-tutor--computador.png` e `…-celular.png`) mostra só a lista de atividades, e nela a onça do Tutor não aparece com o nome e o selo na tela do aluno, que é onde a D58 mais pesa. Vale a vitrine abrir uma conversa de atividade na próxima rodada com tela do aluno. Hoje quem prova isso é só o e2e `e2e/aluno-tutor.spec.ts:157-158`.
2. A boca em "w" (`CabecaOnca.tsx:59`) é a expressão neutra que a 9.7 descreve, e está aceita. Se a X2 ou a X4 trouxerem outra expressão ou pose, a D80 item 3 exige parecer novo do `conformidade-reviewer` naquela spec. Vale deixar o aviso escrito no `docs/aia/tutor.md` N8, junto da frase sobre a prop `tamanho`.

Arquivos auditados (todos em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/`):
- `apps/web/src/componentes/onca/CabecaOnca.tsx`
- `apps/web/src/componentes/ia/AvatarAgente.tsx`
- `apps/web/src/componentes/ia/AssinaturaIA.tsx`
- `apps/web/src/componentes/ia/Mensagem.tsx`
- `apps/web/src/areas/coordenacao/Agentes.tsx`
- `apps/web/src/areas/coordenacao/Analista.tsx`
- `apps/web/src/galeria/secoes/marca-onca.tsx`
- `apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts`
- `apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx`
- `apps/web/src/componentes/onca/CabecaOnca.test.tsx`
- `e2e/__fixtures__/avatar.ts`
- `docs/aia/tutor.md`
- `docs/interface.md`

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-13 17:57:35 · `tasks/prd-pele-e-casca/8_task.md`

VEREDITO: APROVADO
Tela vista: sim (lidas 38 fotos: Agentes, Analista, nova conversa, Tutor do aluno e galeria, em computador e celular, escola cheia e vazia, tema claro e escuro; mais 6 que tirei: `/professor/conversa`, `/professor/time/assistente`, `/professor/time/tutor` e a conversa aberta do Tutor do aluno)
Estados: ok. Cheio, vazio e carregando/erro não foram tocados pela tarefa. Agentes e Analista vazios convidam ("Nenhum resumo gerado ainda. Use 'Gerar resumo'…"). A foto do Analista vazio é igual à da cheia porque o resumo só nasce com o clique. O carregando e o erro ficaram nos componentes `EstadoCarregando` e `EstadoErro`, inalterados no diff.
Acessibilidade: ok. O avatar é `aria-hidden`, sem `title`, `desc` nem `aria-label`, e o SVG não tem nome. O nome da função é texto visível (`h2` em Agentes, `p` nas demais telas) e o selo leva `sr-only` "gerado por inteligência artificial". O anel azul, laranja e anil e o selo "IA" estão legíveis nos dois temas. A cabeça da onça é parada, sem animação nem temporizador. A categoria não depende só da cor, porque o nome sempre acompanha.
Chromebook fraco: ok. É um SVG de 8 formas, sem hook, sem `style` e sem imagem, e a cabeça fica fora da entrada (`PECAS_FORA_DA_ENTRADA`).
Celular: ok. As 11 fatias da galeria e as telas medem 360 px de largura, sem rolagem horizontal nem corte. A assinatura quebra a linha e nada sai do bloco.
Ação oficial protegida: sim, e não se aplica. A tarefa não mexe em ação oficial. O balão com "Aprovar" e "Rejeitar" no Seu time continua com o que se decide à vista, e a marca "IA" aparece em toda saída de IA.

Bloqueantes: nenhum.

Verificações de arquitetura:
- A cadeia de importação está fechada: a pasta `onca/` só é importada por `AvatarAgente.tsx:2`, e o avatar só por `AssinaturaIA.tsx:2`.
- `Mensagem.tsx` usa a `AssinaturaIA` como cabeçalho do balão, então avatar, nome e selo ficam no mesmo bloco `data-assinatura`.
- `Agentes.tsx` passou a `data-cartao-do-agente` e `titulo={2}`, e o e2e `governanca.spec.ts:159` continua achando os três `h2`.
- A exceção de cor em `estilos.test.ts` é só a cabeça da onça e o QR, e o teto da lista do oficial desceu de 8 para 7 junto com a saída do `bg-noite` do avatar.
- Os docs (`docs/interface.md` 9.7 e 10.3, `docs/aia/tutor.md` N7 e N8) estão coerentes com o código e com as fotos.

Limite da foto: a conversa do Tutor com resposta já feita não aparece, porque a escola da vitrine não tem troca. Essa tela é coberta pelo e2e `aluno-tutor.spec.ts` (`conferirAssinaturas` ≥ 7) e pelo componente `Mensagem.tsx`, que é a mesma peça fotografada no Seu time e na galeria.

Recomendações:
1. O selo "IA" se descola do nome quando o nome quebra de linha em 360 px. Isso aparece no Analista (galeria, 40 e 48 px, `celular-8`) e em Agentes (`celular-2`, `celular-3`): "Analista de desempenho / escolar … IA", com o selo colado na borda direita. Não é bloqueante, porque o selo continua no bloco e visível. Para colar o selo ao texto, ajustar o contêiner do nome em `apps/web/src/componentes/ia/AssinaturaIA.tsx:46-50`, por exemplo envolvendo nome e selo num único `min-w-0` com o selo em linha.
2. Fora do diff, para a 10.0 (`CaixaPedido`): em 360 px a segunda linha do placeholder "Peça uma atividade, um plano de aula…" aparece cortada ao meio (`professora--professor-nova-conversa--celular.png` e `professora--professor-conversa--celular.png`). Não é desta tarefa, porque a peça não está no diff. Registrar para a 10.0 encurtar o placeholder ou dar altura à caixa.
3. Fora do diff: o botão "Abrir dado nominal de uma turma" quebra em duas linhas em 360 px (`coordenacao--coordenacao-analista--celular.png`). É legível e o alvo é grande, então fica só para o `/validar`.

Arquivos de apoio: as fotos que tirei estão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/.processo/vitrine/`.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-13 17:57:58 · `tasks/prd-pele-e-casca/8_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/8_task.md:98`: a justificativa do balão está errada. Ela diz "É o que a 11.4 já dizia ('com a assinatura em cima e o balão logo abaixo dela')", mas a 11.4 do `docs/interface.md` é "A operação", e essa frase não aparece em nenhum documento: só no comentário novo de `Mensagem.tsx:21`. O que cobre a mudança de verdade é a `techspec.md` 10 (**Avatar**: "o cabeçalho do balão da `MensagemIA`" leva o `data-assinatura`) e a 9.7 já atualizada. Por isso não é divergência silenciosa, mas o registro aponta para um texto que não existe. Troque a citação por `techspec.md` 10 (**Avatar**) e `docs/interface.md` 9.7.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts:21`: `QUEM_IMPORTA_O_AVATAR` ainda permite `componentes/ia/Mensagem.tsx`, que deixou de importar o `AvatarAgente`. A porta continua aberta sem uso: um import futuro do avatar no balão, fora da assinatura, passaria. Vale fechar só na `AssinaturaIA`, registrando o aperto na `techspec.md` 7b, que ainda cita as duas.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts:58`: o caso de `data-agente` copia em linha a regex de tirar comentário que já existe em `semComentarios`, no `__fixtures__/importadores.ts`. Exporte a função da fixture e use-a aqui, para não ter dois jeitos de fazer a mesma coisa.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/ia/Mensagem.tsx:41-48`: a mudança no balão (a assinatura em cima, no lugar do avatar ao lado) também muda o `Time.tsx` e o `Tutor.tsx` do professor, que não estão nas fotos. Ela encosta na 10.0, que vai revestir a `Mensagem.tsx`. Avise a 10.0 de que a estrutura do balão já mudou aqui, para ela não refazer nem desfazer essa parte.

As fotos de Agentes, Analista, galeria e Tutor, no claro, no escuro e no celular, mostram a onça sempre com o nome da função e o selo "IA" no mesmo bloco, e a seção da galeria se chama "Avatar dos agentes", sem "onça" em texto. Nada vai além do que o RF10 e a 7b pedem.

## test-engineer · 1ª rodada · APROVADO · 2026-10-13 17:58:21 · `tasks/prd-pele-e-casca/8_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Uma cabeça só, parada, sem temporizador, efeito nem estado.
- O avatar só aceita `agente` e `tamanho`, e qualquer outra prop (pose, pensando, humor, online) é recusada.
- O avatar é escondido do leitor de tela e não tem nome: nada na tela se chama "onça".
- Todo avatar tem, no mesmo bloco, o nome da função em texto visível e o selo "IA". Vale na `AssinaturaIA` (três agentes e uma função, nos quatro tamanhos), na `MensagemIA` (coluna e balão, com aprovação e com ações) e no `Pensando`.
- O avatar é do agente cujo nome está ao lado.
- A cadeia de importação é fechada: a pasta da onça só entra pelo `AvatarAgente`, e o `AvatarAgente` só pela `AssinaturaIA` e pela `MensagemIA`. Uma amostra com outro importador reprova, inclusive por import dinâmico, reexportação, `index`, extensão e import de tipo. Comentário e nome parecido não contam.
- `data-agente` é só do avatar; o cartão da tela Agentes usa `data-cartao-do-agente`.
- A exceção de cor escrita à mão é só o QR e a cabeça.
- O teto da lista do oficial encolhe junto com a lista.
- Anel e círculo no navegador: quadrado, redondo, fundo `fundo`, borda de 2 px na cor do agente, nos quatro tamanhos e nos dois temas.
- As cores da onça são fixas nos dois temas.
- O balão fica abaixo da assinatura, com no máximo 85% da coluna no computador.
- Nada se mexe, nem o "Preparando a resposta…" (A51).
- Telas de verdade: Agentes (três `h2`), Analista, conversa do Assistente e Tutor.
- Axe e ausência de rolagem horizontal, no claro e no escuro.
- Isolamento, permissão e concorrência não se aplicam: é peça visual pura, sem dado de escola nem operação que possa acontecer duas vezes.

**Cobertos:** todos.
- Rodei os cinco arquivos de unidade e componente (`CabecaOnca.test.tsx`, `avatar-com-funcao-e-selo.test.tsx`, `avatar-so-nas-duas-pecas.test.ts`, `estilos.test.ts`, `nome-dos-chunks.test.ts`): 88 de 88 verdes.
- Confrontei a seção "Mutações" com o `git diff`. Cada cláusula nova com peso de regra tem bloco que leva ao teste certo:
  - as cores, `aria-hidden`, `focusable`, `<title>`, o contorno e a animação da cabeça;
  - os três anéis, `inline-flex`, `shrink-0`, `rounded-full`, `border-2`, `bg-fundo`, `aria-hidden`, `data-agente`, a cabeça e os quatro tamanhos do avatar, mais o tamanho padrão;
  - as classes do selo e o texto escondido da sigla;
  - `data-assinatura`, o selo, `agenteDe`, o nome e o título `h2`/`h3` da assinatura;
  - as três assinaturas de `Mensagem.tsx`;
  - os imports de Agentes, Analista e das duas seções da galeria;
  - o `data-cartao-do-agente`;
  - cada ramo da regra de achar o importador e o `foraDaLista`;
  - `nome-dos-chunks`, a lista de cor em linha e o teto da lista do oficial.
- Simulei cada mutação contra a asserção citada, sem aplicar nenhuma, e todas ficam vermelhas pelo motivo certo. Por exemplo: o `(^|.)\/\/` é pego pelo caso `https://`; o `ehPasta` com só `startsWith` é pego pelo `PorIndice`; o TETO de volta a 8 é pego pela nova igualdade com o tamanho da lista.
- O que ficou só no e2e está declarado como tal, com teste que o alcança: `titulo={2}` pelo `governanca.spec.ts:159`; `size-full` e `tamanho − 4`, os 85% do balão, as cores calculadas, `animationName` e a transição pelo `pecas-marca-onca.spec.ts`.
- `playwright.config.ts` não liga `reducedMotion`, então "nada se mexe" mede de verdade.
- `apps/web/tsconfig.json` inclui `src`, então o typecheck do portão confere os `@ts-expect-error` dos arquivos de teste.
- Nenhum `.skip`, `.only` ou `fixme`, nenhum mock de peça nossa, nenhuma chamada de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `apps/web/src/componentes/ia/AssinaturaIA.tsx:10`: `px-2` e `shrink-0` do `SeloIA` estão sem bloco e sem asserção no "o selo IA é um só". O `shrink-0` impede o selo de ser espremido na linha estreita do celular.
2. `apps/web/src/componentes/ia/AssinaturaIA.tsx:33`: `break-words` e `min-w-0` do nome estão sem asserção. Hoje só o `larguraExcedente` da galeria pegaria "Analista de desempenho escolar" estourando os 360 px.
3. `apps/web/src/areas/coordenacao/Agentes.tsx:157` e `Analista.tsx:84`: o `tamanho={48}` não é conferido em teste nenhum. É detalhe visual, mas uma linha no e2e da governança resolve.
4. `apps/web/src/componentes/onca/CabecaOnca.test.tsx:91`: o teste prova que as cores usadas estão entre as nove da 9.7, mas não qual cor vai em qual parte. Trocar a sombra pelo realce passaria; o e2e só fixa pelagem, olho e pupila.
5. `e2e/__fixtures__/avatar.ts:50`: o `conferirQueAOncaNaoTemNome` roda só na galeria. Chamá-lo também nas telas Agentes e Tutor fecha o A28 onde o usuário de fato está.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/onca/CabecaOnca.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/ia/avatar-com-funcao-e-selo.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/ia/avatar-so-nas-duas-pecas.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/__fixtures__/importadores.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/pecas-marca-onca.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/__fixtures__/avatar.ts`

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-13 18:16:39 · `tasks/prd-pele-e-casca/8_task.md`

VEREDITO: APROVADO

**Rodada 2.** Auditei o diff entre a rodada 1 e a 2 (`.processo/ordens/8_task-diff-r1-r2.patch`) e o que ele afeta. O resto da tarefa já tinha sido aprovado na rodada 1.

Caminhos de escrita em Nota: nenhum. O diff só mexe na tela (assinatura, selo, cabeça da onça), nos testes, no `docs/aia/tutor.md` e no documento da tarefa. Não toca em `Nota`, repository, job, seed nem importação. Todos com autor humano? sim, porque o diff não abre nenhum caminho novo.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok. A tela Agentes continua dizendo, em cada função, o que ela faz sozinha e o que espera aprovação (`coordenacao--coordenacao-agentes--computador-1.png`, `--celular-2.png`). Na galeria (`coordenacao--galeria--computador-6.png`), o exemplo do Assistente fala de correção de **objetiva** com aprovação em lote e destaques abertos antes (D33, D56). Nenhuma foto mostra nota, conceito ou sugestão de nota em discursiva ou redação (D55).

Supervisão do tutor: ok. Na tela Agentes, o texto do Tutor ("Responde na hora, sem que o professor aprove cada resposta. O professor da turma acompanha…") mantém a exceção da D47 só no Tutor. O e2e `e2e/aluno-tutor.spec.ts:159-160` agora também confere que nada na conversa se chama "onça".

Autonomia declarada e visível: sim. O nível de cada função aparece em português comum ("Faz e registra", "Faz e avisa", "Propõe e espera aprovação"), com o selo de alto risco. As fotos clara, escura, escola cheia e escola vazia, no computador e no celular, mostram isso.

Correção exigida da rodada 1: nenhuma, porque não houve bloqueante. A recomendação 9, que era minha, foi aplicada. O N8 em `docs/aia/tutor.md:161-167` agora diz que outra expressão ou pose da onça, em qualquer spec (X2, X4), pede parecer novo do `conformidade-reviewer` antes de existir (D80, item 3). A recusa da minha outra recomendação (fotografar a conversa do Tutor aberta) ficou registrada com destino `/validar` em "Recomendações sem aplicar". Concordo com o destino, porque o `aluno-tutor.spec.ts` prova a assinatura na conversa (`conferirAssinaturas` ≥ 7).

Sobre a regra 70 vista nas fotos:
- O selo "IA" agora fica colado ao fim do nome quando ele quebra em 360 px, por exemplo "Analista de desempenho / escolar IA" em `coordenacao--coordenacao-agentes--celular-2.png` e `coordenacao--coordenacao-analista--celular.png`. Quem produz isso é `apps/web/src/componentes/ia/AssinaturaIA.tsx:48-58`. Assim a saída de IA continua marcada como IA no mesmo bloco do nome (regra 70, item 4a).
- Nenhum nome acessível cita "onça". Isso é coberto por `e2e/governanca.spec.ts:233-234`.
- Não há nada que induza uso. O avatar é parado e sem pose.

Bloqueantes: nenhum.

Recomendações: nenhuma nova.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-13 18:17:03 · `tasks/prd-pele-e-casca/8_task.md`

VEREDITO: APROVADO

Tela vista: sim. Li 20 fotos desta rodada, e as outras cheias, vazias e escuras do mesmo conjunto foram conferidas só por amostra.
- Agentes, em celular cheia (1 a 3), celular vazia (1) e celular escura (2).
- Agentes, em computador cheia (1).
- Analista, em computador e celular cheia.
- Professora, nova conversa, em computador e celular.
- Aluno, Tutor, em computador e celular, cheia e vazia no celular.
- Galeria, nas fatias celular 8 e 9 e computador 6.

Estados: ok.
- Vazio: o Analista e o Tutor do aluno convidam ("Use 'Gerar resumo'…", "Quando houver uma, ela aparece aqui").
- Carregando e erro não aparecem na vitrine. Esta rodada não os alterou, e o diff não toca neles.

Acessibilidade:
- O selo "IA" leva o texto `sr-only` "gerado por inteligência artificial".
- O nome é `h2` ou `h3` só quando a tela pede, e o selo fica fora do título.
- O avatar é desenho parado, sem animação (o e2e `conferirQueOAvatarFicaParado` cobre).
- O alvo do botão "Suspender esta função" tem altura boa.

Chromebook fraco: sem peso novo. A mudança é só de classe CSS e de estrutura do bloco, sem imagem nem listas novas.

Celular:
- Em 360 px não há rolagem horizontal nem texto cortado.
- A correção exigida na 1ª rodada foi feita: "Analista de desempenho escolar" quebra e o selo "IA" vai junto, no fim da última linha do nome. Isso aparece em `coordenacao--coordenacao-agentes--celular-2.png`, `coordenacao--coordenacao-analista--celular.png` e `coordenacao--galeria--celular-8.png`.
- Na galeria, quando o nome ocupa a linha inteira, o selo desce inteiro para a linha seguinte. Fica legível e dentro da janela.
- A ação principal "Gerar resumo" tem 44 px ou mais de altura.

Ação oficial protegida: sim. Esta tarefa não altera ação oficial. A tela Agentes mostra o que cada função faz sozinha e o que espera aprovação antes de "Suspender esta função".

Bloqueantes: nenhum.

Verificações do diff desde a 1ª rodada:
- `AssinaturaIA.tsx:33-57`: o nome `inline` e o selo `inline-block` ficam num `div min-w-0`, e o `SeloIA` ganhou `shrink-0` e `px-2`. O código da árvore concorda com as fotos.
- As asserções em `avatar-com-funcao-e-selo.test.tsx` cobrem as classes novas do nome, o bloco `min-w-0` e o selo dentro do mesmo bloco.
- As mutações declaradas no `8_task.md` cobrem `inline`, `break-words`, `leading`, `min-w-0`, o espaço entre nome e selo e as classes do selo.
- `conferirTamanhoDoAvatar` confere o quadrado de 48 px nas duas telas da coordenação (3 no Agentes, 1 no Analista).
- `conferirQueAOncaNaoTemNome` entrou no e2e do Tutor e no da governança.
- `docs/aia/tutor.md` registra que outra expressão ou pose da onça pede parecer novo do `conformidade-reviewer`.

Recomendações (não bloqueiam):
- "Peça uma atividade, um plano de aula…" aparece cortado em 360 px em `professora--professor-nova-conversa--celular.png`. A caixa de pedido não é desta tarefa e o destino já está na tarefa 10.0.
- O botão "Abrir dado nominal de uma turma" quebra em duas linhas em 360 px. Está legível, com alvo grande, e o destino é o `/validar`.
- A foto de `/aluno/tutor` mostra só a lista de atividades, sem a conversa. O `/validar` deve fotografar o Tutor com uma conversa aberta para ver o RF10 em tela.
- A foto de `/professor/nova-conversa` saiu em tema escuro, pela escolha de Aparência. Convém uma foto em claro quando a tarefa 10.0 revestir essa tela.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-13 18:17:21 · `tasks/prd-pele-e-casca/8_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido. O carimbo cobre typecheck, lint, segredo, dependências, unidade e o alvo, com os cinco e2e alterados e as 83 mutações de `8_task.md`.
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/ia/AssinaturaIA.tsx:54-55`: o espaço entre o nome e o selo é feito duas vezes, pelo `{' '}` em texto e pelo `ml-1` do `span` que envolve o selo. Fique com um só. O teste de unidade já fixa o `' '` em `${nome} IA`, então basta tirar o `ml-1`. Na foto `coordenacao--galeria--computador-6.png`, o espaço entre o nome e o selo ficou maior que o `gap-2` entre o avatar e o nome.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/8_task.md:98`: a linha nova em "Divergências" fala do `div` `min-w-0` que agrupa o nome e o selo. Isso não diverge de nada na `techspec.md`, que não descreve a estrutura interna do `data-assinatura`, só o que o bloco contém. É detalhe de implementação, e mantê-lo nessa seção faz o leitor procurar uma divergência que não existe. Pode ir para as notas da implementação.

Das nove recomendações da rodada 1, todas foram aplicadas. Conferi as que tocam a minha regra.
- **1. Selo descolado em 360 px:** o nome e o selo agora estão num bloco `min-w-0`, com o nome em linha. Na foto `coordenacao--coordenacao-agentes--celular-2.png`, "Analista de desempenho / escolar IA" mostra o selo colado ao nome.
- **2 e 3. Classes sem teste:** `shrink-0`, `px-2`, `inline`, `break-words`, `leading-5` e o `min-w-0` do bloco ganharam asserção no teste de unidade e uma mutação cada no documento.
- **4. Avatar de 48 px:** o `conferirTamanhoDoAvatar` entrou em Agentes e no Analista. Ele falha se a tela não tiver avatar nenhum.
- **5. Cor de cada parte da cabeça:** o teste novo diz qual cor vai em qual parte e confere que o desenho não tem forma que ele não nomeia (`cobertas + 1`). Ele cobre a troca da sombra pelo realce. Os hex do teste batem com os da `docs/interface.md` 9.7.
- **6. A28:** o `conferirQueAOncaNaoTemNome` agora roda também em Agentes e na conversa do Tutor.
- **7. Regex repetida:** a `semComentarios` passou a ser exportada e é usada no lugar da regex que estava copiada no teste.
- **8. Citação errada:** a linha do balão agora cita a `techspec.md` 10 (**Avatar**) e a `docs/interface.md` 9.7, que existem.
- **9. Aviso no N8:** o `docs/aia/tutor.md` agora diz que outra expressão ou pose da onça pede parecer novo do `conformidade-reviewer` (D80, item 3).

O espaço novo entre o nome e o selo não quebra os e2e. O `conferirAssinaturas` lê só o `p`/`h2`/`h3`, e nenhum spec espera o nome colado em "IA".

## test-engineer · 2ª rodada · APROVADO · 2026-10-13 18:17:30 · `tasks/prd-pele-e-casca/8_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** esta é a 2ª rodada, sobre o diff r1→r2 (`.processo/ordens/8_task-diff-r1-r2.patch`). Conferi as cinco recomendações do test-engineer (itens 2 a 6 da ordem) e as cláusulas novas que vieram do item 1 (o selo colado ao nome em 360 px).
- Item 2: o `shrink-0` e o `px-2` do selo têm asserção e bloco de mutação.
- Item 3: o `break-words` e o `min-w-0` do nome têm asserção.
- Item 4: o `tamanho={48}` em Agentes e no Analista é conferido.
- Item 5: cada cor da cabeça está presa à sua parte.
- Item 6: o teste de que nada se chama "onça" roda também nas telas onde o usuário está.
- Item 1: o nome e o selo ficam num bloco só, em linha.

**Cobertos:**
- **Item 2.** O caso `o selo "IA" é um só` agora cobra também `inline-flex`, `shrink-0`, `items-center` e `px-2`. Há quatro blocos de mutação novos, um por classe (tirar `shrink-0`, `px-2`, `inline-flex` e `items-center`).
- **Item 3 e o item 1.**
  - O caso `sem titulo, é um parágrafo` cobra `inline`, `leading-5` e `break-words` no nome, e `min-w-0` no bloco de nome e selo.
  - Cobra também que o selo está nesse mesmo bloco e que o pai dele é o `data-assinatura`.
  - Com `titulo={2}`, o `h2` também precisa ter `inline` e `break-words`.
  - Há bloco de mutação para tirar `inline`, trocar `leading-5`, tirar `break-words` e trocar `<div className="min-w-0">` por `<div>`.
  - O espaço `{' '}` entre o nome e o selo tem mutação pelo `AssinaturaIA: os três agentes`, que agora espera `"<nome> IA"`.
  - As cinco mutações antigas de `CLASSES_DO_NOME` e do título foram reescritas para o texto novo.
- **Item 4.** `conferirTamanhoDoAvatar` em `e2e/__fixtures__/avatar.ts:75` mede a caixa de cada `[data-agente]`. A função falha se a tela não tem avatar nenhum. É chamada em Agentes (3 avatares) e no Analista (1 avatar).
- **Item 5.** O caso novo `cada cor está na parte dela` em `CabecaOnca.test.tsx` liga cada parte (pelo seletor e pela quantidade) à sua cor da 9.7. Também fecha o desenho: o total de formas tem de ser igual às formas nomeadas mais a boca, então uma parte nova sem nome deixa o teste vermelho. As nove mutações trocam uma cor por outra das nove: sombra pelo realce, pelagem pela sombra, creme pela pelagem, roseta, focinho, nariz, pupila e olho.
- **Item 6.** `conferirQueAOncaNaoTemNome` agora roda em `governanca.spec.ts:234` e em `aluno-tutor.spec.ts:212`.
- **Item 7.** `semComentarios` foi exportada e reaproveitada no teste. As mutações dela continuam apontando para o caso `não confunde comentário`.
- Rodei `avatar-com-funcao-e-selo.test.tsx`, `avatar-so-nas-duas-pecas.test.ts` e `CabecaOnca.test.tsx`: 26 de 26 passam.
- Não há `.skip`, teste comentado nem mock de peça nossa. Nada aqui chama IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `apps/web/src/componentes/ia/AssinaturaIA.tsx:54`: a casca nova do selo, `<span className="ml-1 inline-block align-middle">`, não tem bloco de mutação nem asserção. Pelo que conferi, é só acabamento visual: quem mantém o selo colado ao nome é o `inline` do nome, o `inline-flex` do selo e o espaço entre eles, e esses três têm mutação. Por isso fica como recomendação, no mesmo critério que o `px-2` teve na 1ª rodada. Se `align-middle` for o que alinha o selo à linha do nome, vale uma asserção no `sem titulo, é um parágrafo`.
2. `e2e/governanca.spec.ts:233` e `:242`: o teste novo do tamanho de 48 px não tem bloco de mutação, então nenhum portão o provou vermelho. Vale um bloco que troque `tamanho={48}` por `{40}` em `Agentes.tsx` e outro em `Analista.tsx`, apontando para os dois casos da governança. O mesmo vale para as duas chamadas novas de `conferirQueAOncaNaoTemNome`; por exemplo, um `aria-label="onça"` no `CabecaOnca` apontando para `aluno-tutor.spec.ts`.
3. `e2e/__fixtures__/avatar.ts:82`: a comparação da caixa é exata (`toEqual({ largura: 48, altura: 48 })`). Se o avatar um dia herdar uma borda ou um zoom fracionário, o teste quebra por subpixel. Uma tolerância com `toBeCloseTo(tamanho, 0)` deixa o teste firme sem perder a regra.
