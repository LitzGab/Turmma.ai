# Estado da execução — pele-e-casca (X1)

> Este diário foi aberto fora do Maestri, pela sessão "Claude Code #2", na noite de 12 para 13/10/2026: o Joaquim
> pediu as specs do mockup de outubro, delegou as decisões ("você pode tomar todas as decisões para o projeto, eu
> Joaquim permito") e foi dormir. A decisão é a D80. O Orquestrador assume a partir daqui: o caminho está em "Para
> uma sessão limpa".

## Agora
- **Espero:** a esteira de `4f453d0` (execução `38914509279`, rodando em 16/10 à tarde; `esteira.ts --fechamento`). A
  rodada 3 da validação chegou: **APROVADA** sobre `4f453d0`, 24 de 24 RF; o `validacao.md` e os dois itens do `TODO.md`
  que ela pedia foram registrados no commit de documento seguinte
- **Devo ainda:** (1) com a esteira verde no último commit que alterou código (`9d46058`, coberto pela de `4f453d0`);
  vermelha: correção na linha 1 e revalidação; (3) com a esteira verde e a validação
  aprovada, o pouso, já autorizado pelo Joaquim em 16/10: `maestri floor land "X1 pele-e-casca" --into develop`,
  `git push origin develop`, a esteira da `develop` em segundo plano e `maestri floor delete "X1 pele-e-casca L1"`; (4)
  com a esteira da `develop` verde, `PEDIDO` ao `Arquiteto`, no térreo: trazer o mockup de outubro
  (`~/Documentos/git/Prototipo_Turmma`, branch `mockups/interface`, `a95568d`) para `mockups/`, por decisão do Joaquim de
  16/10, registrando a decisão onde a D80 e o `TODO.md` dizem que ela era dele com o Gabriel; (5) a retrospectiva da X1
- **A X1 foi validada e fechada** (`c624ad6`); a correção não reabre o roadmap. A X2, a X3 e a X4 correm fora do
  Maestri, pelo "Claude Code #2", em `.andares-avulsos/educaia--spec-telas-*`; não mexer naqueles checkouts. Pela palavra
  do Joaquim, cada spec pousa sozinha quando fecha
- **Base:** `spec/pele-e-casca` em `9d46058` (enviada)

## Concluídas
| Tarefa | Commit | Modelo | Rodadas | Observação |
|---|---|---|---|---|
| D80 e o `docs/interface.md`, Parte B | `32c9bf3` | Opus | não se aplica | só documento: decisão, ROADMAP (X1 a X4 antes do F2), TODO e o documento de interface |
| Revisão de spec da X2 | `c4338f0` | Sonnet conduz, guardiões em Opus | 4 | aprovada pelos seis; a onça saiu do vazio do sino e a mascote de corpo inteiro ficou como decisão do Joaquim |
| 1.0 | `81cc95d` | Opus, fora do Maestri | 7 | dois `BLOQUEIO` do `revisor-geral` (3ª e 6ª rodadas), os dois destravados pelo Joaquim; o `frontend-reviewer` aprovou desde a 1ª e o `test-engineer` desde a 2ª, com uma reprovação na 4ª por dois blocos de mutação; 17 mutações vermelhas |
| 2.0 | `080f90c` | Sonnet 5.5 | 2 | linha 1, das 08h29 às 09h58 de 13/10; na 1ª rodada o `revisor-geral` e o `test-engineer` reprovaram (sete itens: `colorScheme` e vitrine sem dono, a medida em brotli, cláusulas sem bloco de mutação), na 2ª os quatro aprovaram; 29 mutações vermelhas; sem push |
| 3.0 | `76e3a02` | Sonnet 5.5 | 2 | linha 1, das 09h58 às 12h15 de 13/10; na 1ª rodada o `conformidade-reviewer`, o `revisor-geral` e o `test-engineer` reprovaram (a guarda "grafite só onde é oficial", os cenários U3 e U4, nove cláusulas sem bloco de mutação), na 2ª os quatro aprovaram; `--repeat-each 3` dos e2e alterados com 492 de 492; sem push |
| 4.0 | `6627aea` | Sonnet 5.5 | 3 | linha 1, das 12h15 às 13h11 de 13/10; o `frontend-reviewer` aprovou na 1ª e na 2ª; o `test-engineer` reprovou na 1ª (a opção desligada sem asserção nem bloco de mutação) e aprovou na 2ª; o `revisor-geral` aprovou na 1ª, reprovou na 2ª e aprovou na 3ª, chamado sozinho; o contexto do Implementador compactou aos 15 minutos; primeiro carregamento em 128,3 kB brotli (teto 150); 55 mutações vermelhas; sem push |
| 5.0 | `3ba0608` | Sonnet 5.5 | 2 | linha 1, das 13h13 às 13h54 de 13/10; o `frontend-reviewer` e o `revisor-geral` aprovaram na 1ª e na 2ª; o `test-engineer` reprovou na 1ª e aprovou na 2ª; a Mesa viu 58 fotos (galeria clara e escura, celular e computador); primeiro carregamento em 128,2 kB brotli (teto 150), `pecas-*` em 14,6 kB (teto 40); 42 mutações vermelhas; desvios do mockup (trilho da barra, fio da moldura) na Tech Spec, nos cenários e no `docs/interface.md`; ficou para a 10.0 o placeholder da `CaixaPedido` cortado a 360 px ("Sem aplicar" do `5_task.md`); sem push |
| 6.0 | `542e583` | Sonnet 5.5 | 2 | linha 1, das 13h57 às 15h10 de 13/10, com a correção `2026-10-13-quinta-fatia-do-e2e` no meio (`71ff60f`, 2 rodadas, `infra-guardian`): `DIVERGÊNCIA` de portão às 14h22, porque os 42 casos do `e2e/pecas-estado.spec.ts` levaram a suíte a 818 e o teto do e2e não cabia em quatro fatias; retomada às 14h40; o `frontend-reviewer` e o `revisor-geral` aprovaram, o `test-engineer` reprovou na 1ª (asserção que sempre passa em `Aviso.test.tsx`) e aprovou na 2ª; a Mesa viu 59 fotos; ficou para a 10.0 o mesmo placeholder da `CaixaPedido`, e para a 12.0 manter `pecas-estado` quando o `Contador` ganhar a lateral; sem push |
| 7.0 | `dc02f60` | Sonnet 5.5 | 2 | linha 1, das 15h10 às 17h07 de 13/10; o `frontend-reviewer` e o `infra-guardian` aprovaram na 1ª; o `test-engineer` e o `revisor-geral` reprovaram na 1ª (o véu forte do login por cima sem e2e, o Tab preso da confirmação, e a 10.2 dizendo dois lugares para o perigo cheio com o teste provando seis arquivos) e aprovaram na 2ª; 34 mutações vermelhas; `--repeat-each 3` de `pecas-sobrepor`, `inatividade` e `professores` antes da 2ª rodada; o `PainelLado` nasceu sem consumidor (X2 e X3); seis recomendações com destino no `TODO.md`, ainda por escrever lá (item 2b do "Agora"); sem push |
| 8.0 | `eb3a181` | Sonnet 5.5 | 2 | linha 1, das 17h08 às 18h18 de 13/10; os quatro revisores (`frontend-reviewer`, `conformidade-reviewer`, `test-engineer`, `revisor-geral`) aprovaram na 1ª rodada, com 9 recomendações a aplicar, e de novo na 2ª; a Mesa viu 86 fotos nos dois temas; 83 mutações vermelhas; 18 divergências e ajustes no `8_task.md`, entre eles o balão da `MensagemIA` passar a usar a `AssinaturaIA` como cabeçalho (muda o `Time.tsx` e o `Tutor.tsx` do professor, que são da 10.0); recomendações sem aplicar com destino na 10.0, no `TODO.md` e no `/validar`; sem push |
| 9.0 | `db54cc6` | Sonnet 5.5 | 1 | linha 1, das 18h19 às 18h49 de 13/10; os quatro revisores (`frontend-reviewer`, `infra-guardian`, `test-engineer`, `revisor-geral`) aprovaram na 1ª rodada; 4 fotos do Implementador e 8 da Mesa; os quatro ícones pesam 484 bytes em brotli, e por isso a 9.4 não se aplicou (sem `lugares-*.svg`, `.size-limit.json` intacto); o `Ladrilho` ganhou o tamanho 36, para a lateral da 12.0; cinco divergências no `9_task.md`; sem push |
| 10.0 | `35106af` | Sonnet 5.5 | 2 | linha 1, das 18h57 de 13/10 às 15h29 de 15/10, com o limite semanal parado das 19h31 de 13/10 às 15h de 15/10 (no meio da 1ª rodada, que a Mesa refez inteira); os quatro revisores (`frontend-reviewer`, `conformidade-reviewer`, `test-engineer`, `revisor-geral`) aprovaram na 2ª rodada; 95 mutações vermelhas; telas vistas pelo Implementador e pela Mesa (cheia e vazia, dois temas, computador e celular); recomendações sem aplicar copiadas para o `10_task.md`, linhas novas no `TODO.md`; sem push |
| 11.0 | `761bb2b` | Sonnet 5.5 | 2 | linha 1, das 15h32 às 16h20 de 15/10; `frontend-reviewer` aprovou na 1ª rodada, `test-engineer` e `revisor-geral` aprovaram de novo na 2ª; a 1ª tentativa do portão tinha 16 mutações rodando zero testes (filtro de nome errado), corrigida pelo Implementador antes da 1ª rodada; telas vistas pelo Implementador e pela Mesa (cheia e vazia); sem push |
| 12.0 | `772f9bc` | Sonnet 5.5 | 3 | linha 1, das 16h20 às 19h20 de 15/10; no meio, divergência de portão: o `:has(` da 10.0 no `MotorFormulario` virou a correção `2026-10-15-anel-do-motor-sem-has` (`dd0daf7`, na mesma linha); `ESCALADA` da `Mesa` na 2ª rodada (`test-engineer`: a folga do anel de foco sem teste nem bloco), diagnóstico do `Arquiteto` em `.processo/ordens/diagnostico-12.md` da linha 1, e os cinco aprovaram na 3ª; a mutação de `usuarioDaSessao` (gaveta) não tem teste que a pegue e vai para a 13.0 |
| 13.0 | `b558854` | Sonnet 5.5 | 2 | linha 1, das 19h30 às 22h44 de 15/10; no meio, divergência de portão: o h1 "Turma" da 11.0 na turma perdida virou a correção `2026-10-15-h1-da-turma-indisponivel` (`946945f`, na mesma linha; frontend-reviewer e tenancy-guardian 1ª, test-engineer 2ª); retomada às 21h45; na 1ª rodada o `revisor-geral` e o `test-engineer` reprovaram, e os quatro (`frontend-reviewer`, `tenancy-guardian`, `test-engineer`, `revisor-geral`) aprovaram na 2ª; a Mesa viu 14 fotos; 4 itens novos no `TODO.md`; o runner de mutação só roda o projeto `chromebook` (vai à retrospectiva); **o Implementador fez push da linha**, contra o "sem push" (ver "O que falhou") |
| 14.0 | `f883d06` | Sonnet 5.5 | 2 | linha 1, das 22h50 de 15/10 às 00h50 de 16/10; o `frontend-reviewer`, o `infra-guardian` e o `privacy-guardian` aprovaram nas duas; o `revisor-geral` e o `test-engineer` reprovaram na 1ª e aprovaram na 2ª; telas vistas pelo Implementador (9) e pela Mesa (12); entrada em brotli: JS 92.069 e CSS 8.265 bytes; sem push. Uma rodada da suíte inteira de e2e, feita por engano, mostrou duas falhas da 13.0 no celular (abaixo, "O que decidi sem perguntar") |
| 15.0 | `2f756d2` | Sonnet 5.5 | 2 | linha 1, das 01h14 às 01h59 de 16/10; os quatro (`frontend-reviewer`, `infra-guardian`, `test-engineer`, `revisor-geral`) aprovaram na 2ª rodada; 12 fotos do Implementador (spec temporário, apagado) e as da Mesa na 1ª; nenhuma foto depois da troca para `t-cartao` (vai ao Validador); chunk da operação 13,8 kB brotli (teto 60); recomendações sem aplicar na tabela do `15_task.md`; sem push. Antes dela, a correção `2026-10-16-alvo-de-toque-sob-a-barra-de-baixo` (`8ba5a3f`) |
| PRD, Tech Spec e tarefas da X1 à X4 | `2ed7829` | Opus (as tarefas 8 a 15 da X1, 4 a 14 da X3 e 3 a 11 da X4, por agentes em Sonnet) | 4 da spec da X1 | só documento; a X2, a X3 e a X4 sem revisão de spec |

## Esperando o Joaquim

### 16/10/2026 — X1, pouso na `develop` (parada 6) — RESPONDIDA: pousar e enviar (o Joaquim, neste terminal: "cada spec finalizada pode pousar na develop e fazer o push para a remota e sobre o mockup pode trazer para o projeto aqui"). O "tudo local" de 13/10 acaba para spec finalizada
Decisão: pousar a X1 na `develop` agora, ou esperar a X2, a X3 e a X4 para um pouso só?
Contexto: `tasks/prd-pele-e-casca/validacao.md` (rodada 2, APROVADA); a branch está só na máquina, e o pouso pelo
`/seguir` inclui o push da `develop`, que poria no GitHub público a pele tirada do mockup de outubro, que é privado
Opções: pousar agora e enviar a `develop` | pousar agora só na máquina, sem push | esperar as três e pousar uma vez só
Recomendo: esperar as três e pousar uma vez só, como foi combinado no outro terminal; o push público espera a decisão do mockup com o Gabriel

### 13/10/2026 08h35 — X1, encontro da tarefa 2.0 — RESPONDIDA às 08h50: tudo local ("pode ficar local")
Decisão: a branch da spec vai para o GitHub a cada tarefa, como o processo pede (D79), ou fica local até você mandar?
Contexto: o encontro (`linhas.ts encontro`) e o commit do Implementador fazem push, e é o push que dispara a
esteira. A branch nunca foi enviada, o repositório é público, e a pele vem do mockup de outubro, que é privado
(`TODO.md`, itens da D80). A 2.0 partiu sem push e não depende da resposta; o encontro dela depende
Opções: push a cada tarefa, com a esteira | tudo local, com o portão completo na máquina no lugar da esteira
Recomendo: push a cada tarefa, se o que já está na branch pode ficar público: sem ele a esteira não roda, e o
portão completo local custa de 30 a 70 minutos por vez

### 16/10/2026 03h50 — X1, validação APROVADA COM RESSALVAS (parada 3) — RESPONDIDA: corrigir agora (o Joaquim, neste terminal: "faça o melhor para o projeto, deixo a escolha com você, você decide e faça")
Decisão: o único maior, `docs/roteiro-da-demonstracao.md:166` ainda mandando clicar em "Nova conversa" (agora "Início"), corrige agora ou aceita?
Contexto: `tasks/prd-pele-e-casca/validacao.md`, "Maiores"; 24 de 24 RF atendidos, nenhum crítico, o spec do roteiro já
foi atualizado e o documento lido na demonstração não. Só documento: a correção não pede validação nova
Opções: corrigir agora (correção de texto na linha 1, com `revisor-geral` e `test-engineer`) e fechar | aceitar e levar ao `TODO.md`
Recomendo: corrigir agora: é uma palavra, e é o texto que a pessoa segue na frente da escola

### 15/10/2026 22h50 — X1, push da linha 1 contra o "tudo local" — RESPONDIDA em 16/10: apagar (mesma palavra do Joaquim); a branch remota foi apagada e nenhuma `spec/pele-e-casca*` está no GitHub. O "tudo local" continua para todo o resto
Decisão: apagar a branch remota `spec/pele-e-casca--l1` (`b558854`, até a 13.0) ou deixar?
Contexto: "O que falhou", 15/10 22h44. O repositório é público e a pele vem do mockup de outubro, que é privado
(entrada de 13/10 acima); a branch está lá desde 22h44 de 15/10
Opções: apagar (`git push origin --delete spec/pele-e-casca--l1`) | deixar
Recomendo: apagar, pelo mesmo motivo que fez você escolher "tudo local"

### 13/10/2026 — o que é dele, e não foi feito
- **Push** de `spec/pele-e-casca` e o **pouso** na `develop`
- **Trazer o mockup de outubro para `mockups/`**: o repositório `Prototipo_Turmma` é privado e o nosso é público. É
  decisão dele com o Gabriel (`TODO.md`, itens da D80)
- **Parecer de advogado** sobre a mascote (D58; Decreto 12.880, art. 11) e sobre trade dress (`TODO.md`)
- **Confirmar a D80**, que foi escrita por delegação: o que entrou do mockup, o que ficou de fora ("regra vence
  desenho") e o que cada fase seguinte deixa de fazer (`ROADMAP.md`, "A pele nova")
- **O RF22 do PRD** foi esclarecido na rodada 2 da revisão (a entrada, com a casca e os ícones de lugar, é comum a
  todos; a regra vale para o pedaço de cada área). É texto de critério de aceite: se ele quiser a outra saída (os
  ícones de cada papel fora da entrada), é tarefa nova na 9.0

## O que falhou

- **16/10, ~12h15 — a primeira esteira da X1 no GitHub caiu em 4 e2e da galeria** (execução `38896156999`), todos no
  limite de 30 s, que o portão local de 03h10 passou. Sem branch no GitHub ("tudo local"), a esteira não rodou a cada
  tarefa, e isso só apareceu depois da validação. Vai à retrospectiva
- **16/10 01h05, o Implementador apagou a seção "Revisões" do documento da correção do alvo de toque** ao reescrevê-lo;
  o hook a recriou e a Mesa chamou de novo os dois revisores. A tabela diz "1ª rodada", mas houve uma reprovação antes
  (ordem de três itens, 00h59). Vai à retrospectiva. A causa também não era a barra de baixo, e sim a de topo (`sticky`)
- **15/10 22h44, push da linha 1 contra a decisão "tudo local"**: o `PEDIDO de retomada` da 13.0 dizia "sem push", e o
  Implementador fez push de `spec/pele-e-casca--l1` (`b558854`) no GitHub (o 1º falhou por rede, o 2º passou). A
  branch está lá, no repositório público. Não a apaguei: é do Joaquim decidir. A linha é worktree do térreo e
  divide o `.git/config` com ele, por isso não troquei o endereço de push ali; daqui em diante o `PEDIDO` diz "não rode
  `git push`; o commit fica local, por decisão do Joaquim", e não só "sem push"
- **O limite de uso do plano estourou às 23:17 de 12/10**, com dez agentes em Opus ao mesmo tempo, e matou seis no
  meio. Voltou à 01:50. Dali em diante: poucos agentes, em Sonnet, e a implementação nesta sessão
- **Rodadas 1 e 2 da revisão da spec: REPROVADA.** A 1ª, por seis correções (avatar sem selo, onça sem condições,
  anel de foco sem cor, alvo de toque sem medida, armazenamento sem lista fechada, orçamento da entrada). A 2ª, por
  oito resíduos de coerência entre documentos e de teste que não amarrava a regra (o texto do botão desligado em
  duas cores, a onça dormindo no catálogo, `public/` ainda citado, pares de contraste que faltavam, RF6 e RF10 sem
  teste que caísse, RF22 contra a 7c, `2_task.md` sem o teste do script). A 3ª, por uma linha (o valor de
  `educa.lateral-recolhida` escrito `1`, e o código grava `sim`). A 4ª aprovou
- **1.0, `BLOQUEIO` da Mesa (13/10/2026 02:35):** o `revisor-geral` reprovou nas três primeiras rodadas, sempre na
  guarda de cor escrita à mão de `estilos.test.ts`, cada vez por um caso vizinho: a 1ª, a lista de nomes de
  propriedade deixava `background` e `boxShadow` de fora; a 2ª, a cor só era pega logo depois de `propriedade:`
  (escapavam a segunda camada da sombra e o segundo hex do gradiente); a 3ª, o hex entre colchetes era pulado, e
  `inset-shadow-[#fff]` não é classe que a guarda de classes conheça. O `frontend-reviewer` e o `test-engineer`
  aprovavam desde a 2ª. A causa é uma só: a regra era presa à posição ou à forma. Ficou total: a cor escrita é
  procurada no arquivo inteiro, sem exceção de posição, e a web tem uma só, a do QR. Para a retrospectiva: a
  primeira versão devia ter nascido assim
- **1.0, segundo `BLOQUEIO` (13/10/2026 08:13):** depois do destravado, o `revisor-geral` reprovou a 4ª, a 5ª e a
  6ª, e nenhuma por código: a Tech Spec, o `cenarios.md` e as subtarefas descreviam a guarda antiga, e foram
  corrigidos um de cada vez. Destravado com a mesma palavra do Joaquim, que estava acordado e foi avisado na hora;
  a 7ª aprovou. Para a retrospectiva: quando uma correção muda o desenho de um teste, conferir de uma vez todos os
  documentos que o descrevem
- **As sessões de revisão caíram às 02h40** com "Your organization has disabled Claude subscription access for
  Claude Code", no meio da revisão da X3. Às 07h49 voltaram a abrir. Não sei a causa
- **O portão da 1.0 rodou três vezes**, porque duas correções da revisão da spec mexeram na tabela de pares do
  `docs/interface.md`, que o teste de contraste lê. Nas três, verde
- **A revisão da spec caducou para o hook** assim que o portão da 1.0 aplicou as mutações no `estilos.css`: o hook
  mede a caducidade pela data do arquivo de código. Em andar do Maestri a spec é revista antes de existir código da
  tarefa; aqui as duas coisas correram na mesma árvore. O commit das specs não levou código
- **PRD e Tech Spec passam do teto de palavras** (2.189 e ~3.300): o que os revisores exigiram entrou no texto. O
  aceite está escrito no topo de cada um, por delegação
- **`linhas.ts conferir` recusa a correção feita na branch da spec** (16/10, `9d46058`): ele percorre todos os commits
  desde a `develop` e para no `81cc95d`, que leva `(tarefa 1.0)` e não `(correção …)`. Conferi o `9d46058` à mão: marca,
  `Revisões:` com os quatro ditados, árvore limpa e push. O `conferir` só serve ao andar `correcao/*`; vai ao `/retro`
- **`tools/ci/e2e.ts` engole `--repeat-each` e `--workers`** (16/10): passou "3 2" ao Playwright como filtro e rodou o
  e2e inteiro (974) em vez de repetir três arquivos. Avisei o Implementador na vigia; ele repetiu com o Playwright direto
  (198/198). Vai ao `/retro`. E a unidade `guardas.test.ts › redact` deu timeout de 5 s uma vez sob carga e passou depois

## O que decidi sem perguntar
- **Quatro specs, e não duas ou três:** X1 `pele-e-casca` (tokens, peças, casca, sem mudar endereço), X2
  `telas-da-coordenacao`, X3 `telas-do-professor`, X4 `telas-do-aluno-e-primeiro-acesso`. A X1 é o tronco; as
  outras três correm depois dela e não se tocam, uma por papel
- **A X1 não reagrupa a navegação nem muda endereço.** O e2e tem 179 afirmações de endereço e 114 idas pela
  navegação: o reagrupamento em até quatro lugares por papel vai com a spec de cada papel
- **Os 33 nomes de token antigos ficam, com valor novo**, ao lado dos nomes da D80. Nenhuma tela perde cor no meio
  do caminho, e cada tarefa troca as classes da peça dela
- **Três desvios do mockup, por contraste:** `borda-campo` (`#8f8f8f` no claro, `#6b7f88` no escuro), o
  `caramelo-fundo` do escuro (`#d4651f`) e o desligado em face `borda` com texto `apoio`
- **O véu do diálogo continua `rgba()` literal** até a 7.0: no Chrome anterior ao 122 o `::backdrop` não herda
  variável
- **A onça entra só como cabeça, só em `AssinaturaIA` e no balão da `MensagemIA`,** sempre com o nome da função e o
  selo "IA". A de corpo inteiro, a dormindo e a comemoração ficam para a X2 e a X4, com parecer do
  `conformidade-reviewer`
- **Medidas do botão: 44 e 36 px** (o `compacto`, 44 abaixo de 768), e não os 46 e 38 do mockup: é o que o e2e de
  hoje já mede
- **Nenhum laço de animação, nem o de "pensando"** (D59): o documento dizia o contrário dos testes, e os testes
  venceram
- **13/10 14h30, a 5ª fatia do e2e é correção na linha 1, no meio da 6.0** (`/seguir`, passo 6, divergência de
  portão): o Implementador perguntou se fazia dentro da 6.0 ou em correção própria. Correção própria, com
  `infra-guardian`, porque o `ci.yml` é comum às linhas e fora dos arquivos da tarefa
- **15/10 16h40, o `:has(` da 10.0 é correção na linha 1, no meio da 12.0** (`/seguir`, passo 6, divergência de portão): o `MotorFormulario.tsx` usa `has-[:focus-visible]`, que a Tech Spec (linha 148) proíbe, e o E5 da 1.0 só o pegou na 12.0. Correção própria (`frontend-reviewer`), com o anel por `focus-within`, como a 4.0 decidiu e aceitou (o anel também no clique, `4_task.md`, tabela de revisões). Pedi ao Implementador que pausasse num ponto limpo em vez de reiniciá-lo trabalhando. Feita em `dd0daf7` (frontend-reviewer 1ª, test-engineer 2ª)
- **15/10 21h10, o h1 da turma indisponível é correção na linha 1, no meio da 13.0** (`/seguir`, passo 6, divergência de portão): `e2e/acesso-da-turma.spec.ts:1103` espera nenhum h1 na tela "Esta turma não está disponível", e desde a 11.0 (`761bb2b`) ela tem o h1 "Turma"; é o único vermelho do portão da 13.0. O Implementador perguntou se a 13.0 ajustava; correção própria (`frontend-reviewer`, `tenancy-guardian`, porque a tela é a do "não encontrado = sem permissão"). O arquivo também é da 13.0: o commit da correção leva só o trecho dela
- **16/10 00h55, o alvo de toque sob a barra de baixo é correção na linha 1, antes da 15.0** (`/seguir`, passo 6, no lugar da esteira vermelha, que aqui não roda): a suíte inteira de e2e, rodada por engano na 14.0, mostrou `e2e/a2-assistente.spec.ts:140` e `e2e/pedidos.spec.ts:495` vermelhos só no celular (axe `target-size`: a caixa de seleção da lista sob a barra de baixo da 13.0), e caem também isolados. Correção própria, com `frontend-reviewer`
