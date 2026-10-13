# Achados das revisões — `tasks/prd-pele-e-casca/9_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-13 18:45:48 · `tasks/prd-pele-e-casca/9_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok (não se aplica, a tarefa não cria rota nem login)
Fila e prioridade: ok (não se aplica, não há job)
Concorrência: protegida (não se aplica, não há escrita)
Índice e paginação: ok (não se aplica, não há query)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica, a tarefa não toca código de servidor no caminho quente)
Bloqueantes: nenhum
Recomendações:
- O peso dos ícones na entrada foi medido isolado: 484 bytes em brotli, abaixo do teto de 3 kB em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/icones/lugares.test.tsx`. A medida da entrada inteira, com a casca ligada, ficou para a 12.0. Ela precisa sair lá com o número no documento da tarefa, porque o primeiro quadro no Chromebook às 7h30 depende dela.

A tarefa só traz peças de tela que não chamam nada: `Icone`, `Ladrilho`, os desenhos em `icones/lugares.tsx`, a seção da galeria e o e2e. Nenhuma delas faz chamada de rede, usa WebSocket ou temporizador, guarda estado no navegador ou carrega código sob demanda. As mudanças em `docs/interface.md` e na Tech Spec só registram tamanhos e a medida do peso.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-13 18:45:58 · `tasks/prd-pele-e-casca/9_task.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: computador-6 e celular-8, nos temas claro e escuro). As fotos da escola vazia mostram o mesmo conteúdo, porque a galeria não tem sessão nem API, como o prompt já avisa. Li também o código de `Icone`, `Ladrilho`, `lugares.tsx`, da seção da galeria e do e2e.
Estados: ok. É peça de galeria, sem dado nem servidor, então carregando, vazio e erro não se aplicam. A seção nunca fica em branco.
Acessibilidade: ok.
- Sem `rotulo`, o ícone e o ladrilho ficam `aria-hidden`; com `rotulo`, viram `role="img"` com o nome.
- Não recebem foco (`focusable="false"`) e não são controles.
- Nenhuma cor é escrita à mão: só `fill-*` e os tokens `icone-papel` e `icone-linha`, definidos nos dois temas em `apps/web/src/estilos.css:131` e `:270`.
- O par `texto` sobre `claro` das dez famílias é testado a 4,5:1.
- O axe nos dois temas está no e2e.
- O rótulo "Atividades" aparece ao lado do ícone, sem dizer o nome duas vezes.
Chromebook fraco: ok. Quatro SVGs de 48 × 48 com 3 a 6 formas cada, sem animação nem biblioteca, chapados. O HTML dos quatro pesa 484 bytes em brotli (teto de 3 kB), então ficam na entrada, sem asset novo. O e2e confere `animationName` e `transitionDuration` em `none`.
Celular: ok. A 360 px, na foto, não há rolagem horizontal nem corte. Os blocos usam `flex-wrap` e `min-w-0`, e o e2e confere `larguraExcedente === 0` nos dois temas. Não há hover nem atalho, e ícone e ladrilho são decoração, sem alvo de toque. Os projetos `chromebook` e `celular` rodam o e2e.
Ação oficial protegida: não se aplica. A tarefa não tem ação oficial, só peças de visualização.

Bloqueantes: nenhum.
- Conferi as fotos contra `docs/interface.md` 9.4 e 10.2, e contra a D80 (cor por família, canto 12, ícone a 72%). Não há texto técnico, id nem inglês na tela.
- As três funções dos agentes e o selo "IA" vizinhos na foto estão corretos.
- Rodei os 27 testes de unidade de `Icone`, `Ladrilho` e `lugares`: passam.

Recomendações (não bloqueiam):
- `apps/web/src/componentes/icones/lugares.tsx:35`: no tema claro, o corpo da casa é `#EFEFEF` sobre fundo branco e quase some, como se vê em `.processo/vitrine/coordenacao--galeria--computador-6.png`. Está de acordo com o mockup, mas vale conferir quando a 12.0 ligar o ícone à casca. Se a lateral ficar fraca, o ladrilho dá o fundo.
- `docs/interface.md` 9.4: a frase do orçamento ficou longa, com o número medido no meio da oração. Pode virar uma frase própria.
- O ícone `tarefas` a 24 px ainda é legível, mas o visto fica fino. Vale reconferir na lateral, a 36 px dentro do ladrilho, quando a 12.0 ligar.

Arquivos principais:
- `apps/web/src/componentes/Icone.tsx`
- `apps/web/src/componentes/Ladrilho.tsx`
- `apps/web/src/componentes/icones/lugares.tsx`
- `apps/web/src/galeria/secoes/marca-icones.tsx`
- `e2e/pecas-marca-icones.spec.ts`

## revisor-geral · 1ª rodada · APROVADO · 2026-10-13 18:46:38 · `tasks/prd-pele-e-casca/9_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/9_task.md:93`: a última linha de "Divergências" (`Ladrilho` importa só o tipo `FamiliaDeCor` de `Contador`) traz "—" na coluna da spec. Isso não diverge da Tech Spec, porque o `Ladrilho` continua na entrada e o `Contador` continua fora dela. A linha só justifica uma escolha de implementação. Vale tirar a linha da tabela, ou guardar a frase só no comentário de `apps/web/src/componentes/Ladrilho.tsx:2`, para a tabela listar apenas o que a spec registra.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/tasks.md:60`: a 9.0 ficou marcada `[x]`, mas as subtarefas 9.1 a 9.6 seguem `[ ]`. É o mesmo padrão da 8.0, mas o `9_task.md` está todo marcado. Vale alinhar os dois arquivos.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/docs/interface.md:922`: a linha que ganhou "(os quatro da X1 pesam 484 bytes, medidos no HTML renderizado)" ficou bem mais longa que as vizinhas, que quebram em cerca de 100 colunas. Vale quebrar a linha.

O que conferi:
- **Escopo:** nada fora da galeria importa `Icone` nem `Ladrilho`. A casca não foi tocada, e isso é da 12.0. O `.size-limit.json` e o `tools/ci/tamanho-web.test.ts` também não mudaram, como a 9.4 pede quando a medição fica abaixo de 4 kB.
- **Cores:** batem com `docs/interface.md` 9.4. Início é laranja, Turmas turquesa, Tarefas azul, e Ferramentas tem os quatro quadradinhos em laranja, azul, verde e roxo.
- **Divergências:** as outras quatro (seis tamanhos de ladrilho, cor do `texto` no `lucide`, o visto feito de dois retângulos, cinco tamanhos de ícone e o nome `ferramentas`) estão escritas na `techspec.md` 9 e na `docs/interface.md` 9.4 e 10.2. A medição de 484 bytes está na Tech Spec 7c e na 12. Nenhuma delas altera um cenário do `cenarios.md`.
- **Fotos:** `coordenacao--galeria--computador-6.png` e `escuro--coordenacao--galeria--celular-8.png` mostram a seção "Ícones dos lugares e ladrilho" com os quatro ícones, os ladrilhos ilustrados e os do `lucide` nas dez famílias, e "Ferramentas" e "Atividades" ao lado do ícone. Nada aparece além do que a tarefa pede. No escuro, o papel e a linha acompanham o tema.
- **Testes:** não há `.skip`, `any` nem `TODO` nos testes nem nos componentes.

## test-engineer · 1ª rodada · APROVADO · 2026-10-13 18:48:06 · `tasks/prd-pele-e-casca/9_task.md`

VEREDITO: APROVADO

Cenários exigidos (tarefa de peça visual pura, sem dado de escola, sem API e sem operação concorrente; permissão, isolamento e concorrência não se aplicam):
- O caminho feliz: os quatro ícones existem, são diferentes entre si, têm `viewBox` 48 × 48 e a cor de cada forma é a que a 9.4 dá a ela. O `Ladrilho` funciona com o ícone ilustrado e com o do `lucide`.
- O nome quando a peça está sozinha (`rotulo`, `role="img"`). Sem rótulo, `aria-hidden`.
- Rótulo vazio tratado como sem rótulo.
- Nenhuma cor fora dos tokens: sem hex, sem `rgb(`, sem `style=`, sem atributo de pintura, e nenhuma exceção na guarda.
- Os dois temas, com o papel e a linha lidos do estilo calculado.
- O tamanho: cada ícone e cada ladrilho quadrados na medida pedida, o ícone a 72% e centrado.
- A tela a 360 px sem rolagem horizontal, e o axe nos dois temas e nos dois projetos.
- O peso: no máximo 3 kB em brotli.
- O teto de `lugares-*.svg`, só se os ícones saíssem da entrada.
- Nada se mexe (D59).

Cobertos:
- Rodei a unidade das três peças, a guarda `estilos.test.ts` e o `Galeria.test.tsx`: 69 testes verdes.
- Os 48 blocos de mutação conferem com o `git diff`. Cada cláusula nova tem bloco, e cada bloco cai num teste que chega a ela:
  - Na troca de cor, a sequência exata de classes de `lugares.test.tsx:85-90` falha.
  - Na troca de posição dos quadradinhos, falham as posições em `:97-103`.
  - Em `fill="#…"`, `style` e `stroke`, falham `:46-51`.
  - Com `opacity` ou `<title>`, falha `:109`.
  - Com o desenho duplicado, falha `:115-119`.
  - Nas duas direções do `nomeado`, falham os testes de rótulo e de rótulo vazio do `Icone.test.tsx` e do `Ladrilho.test.tsx`.
  - Na troca de lado, falha o oráculo independente `LADO` em `Ladrilho.test.tsx:18`.
- O peso tem piso de 200 bytes (`lugares.test.tsx:125`), então o caso não passa vazio se a medição deixar de achar os ícones.
- A guarda de cor varre `componentes/icones/` sem exceção, porque `arquivosDeCodigo` desce em toda pasta. O `estilos.test.ts` e as duas listas de exceção não mudaram.
- O e2e `e2e/pecas-marca-icones.spec.ts` cobre o que só o navegador calcula:
  - O papel e a linha batem com os valores fixos de cada tema. Por isso, se a troca de tema falhar, o teste fica vermelho em vez de passar à toa.
  - A face de cada família, as quatro cores das ferramentas em ordem, e o fundo `claro` com canto de 12 px nas dez famílias.
  - O `lucide` desenhando com a cor `texto` da família.
  - A medida, os 72% e a centralização, nos seis tamanhos do ladrilho.
  - As duas imagens com nome na seção e as decorações sem nome.
  - Nenhuma animação, o axe e a largura excedente.
- O `playwright.config.ts` roda todo spec nos dois projetos, e o carimbo `.processo/portao.json` registra esse spec como alvo da tarefa.
- A 9.4 não se aplica, porque a medida deu 484 bytes. O `.size-limit.json` e o `tools/ci/tamanho-web.test.ts` estão intocados, e os testes que já existem continuam cobrindo os outros tetos.
- Nenhum `.skip`, nenhum teste comentado, nenhum mock de peça nossa. Não há IA envolvida.

Bloqueantes: nenhum

Recomendações:
1. `apps/web/src/componentes/Ladrilho.test.tsx:25-36`: falta um caso para o `Ladrilho` com `rotulo` que contém um `Icone` também com `rotulo`, o que daria dois nomes na mesma imagem. Ou o teste prova que o de dentro some, ou a peça documenta que o filho vai sem rótulo. É provável aparecer na 12.0, quando os ícones forem ligados à casca.
2. O desenho manda o `Icone` e o `Ladrilho` ficarem fora de `PECAS_FORA_DA_ENTRADA` (Tech Spec 7c), mas nada falha se alguém os puser lá. Fica para a 12.0, que mede a entrada de verdade.
3. `e2e/pecas-marca-icones.spec.ts:18` mede o ícone só a 24, 32 e 48 px. O 28 e o 40 só têm o atributo provado na unidade, embora a galeria já use o 40 em `marca-icones.tsx:74`.
4. `tasks/prd-pele-e-casca/tasks.md`: a 9.0 está marcada `[x]`, mas os subitens 9.1 a 9.x continuam `[ ]`. Isso é com o `revisor-geral`.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/icones/lugares.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/icones/lugares.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Icone.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Icone.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Ladrilho.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Ladrilho.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/galeria/secoes/marca-icones.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/pecas-marca-icones.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/9_task.md`
