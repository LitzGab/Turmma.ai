# Validação — telas-do-professor (X3)

## Rodada 2 — 19/10/2026

**Escopo:** funcionalidade completa (revalidação depois das correções da rodada 1)
**Commit validado:** `773cc92` (último commit com código: `bfd3715`, docs; último com código de tela: `d3a8a63`)
**Veredito: APROVADA**

O que mudou desde a rodada 1 (`9a2a4f9..773cc92`): dez correções, cada uma com o próprio documento em `tasks/correcoes/`,
e os commits de estado e de encontro das linhas.

| Achado da rodada 1 | Correção | Commit |
|---|---|---|
| C1 (RF3, a correção aprovada e a turma confirmada saem do sino) | `2026-10-19-sino-sem-a-correcao-aprovada` | `f3c06b1` |
| C2 (RF12, a data da linha em Criados) | `2026-10-19-criados-data-sem-teste` | `27e95d9` |
| C3 (RF18, dois botões cheios na aba Alunos) | `2026-10-19-alunos-dois-botoes-cheios` | `fe92bd6` |
| C4 (RF22, Hoje e Alunos rolavam a página) | `2026-10-19-turma-aberta-rola-a-pagina` | `9dc5613` |
| C4 (RF22, formulário e "O que o Assistente fez" rolavam a página) | `2026-10-19-formulario-e-assistente-rolam-a-pagina` | `6a44d8e` |
| A1 ("100 ou mais") | `2026-10-19-sino-cem-ou-mais` | `ea8b9f7` |
| A2 (vínculo encerrado com Hoje aberta) | `2026-10-19-hoje-vinculo-encerrado` | `d3a8a63` |
| A3 (`docs/interface.md`, Parte A) | `2026-10-19-interface-parte-a` | `48316e2` |
| A4 (docs que mandavam a "Seu time") | `2026-10-19-docs-sem-seu-time` | `bfd3715` |
| (esteira) caso do endereço da Privacidade passava do prazo | `2026-10-19-privacidade-endereco-estoura-o-prazo` | `fc6eaba` |

Fotos lidas nesta rodada: `.processo/vitrine/`, web do ambiente de teste 0 **reconstruída a partir desta árvore** pelo e2e
de evidência abaixo (a que estava de pé era de 15h59, anterior às correções). Escola cheia e vazia, computador (1366 px) e
celular (360 px), e as telas principais no tema escuro (`escuro--professora--*`). As três abas da turma aberta gravam o
mesmo arquivo na vitrine; Hoje, Atividades e Alunos foram copiadas, uma por vez, para
`/tmp/claude-1000/-home-joaquimdp-Documentos-git--maestri-floors-educaia--spectelas-do-professor/b9a68cbc-d57f-45eb-844c-3ca3cc892110/scratchpad/fotos/`
(`hoje-*.png`, `atividades-*.png`, `alunos-*.png`).

Relatório de rolagem da vitrine (a 1366 × 768):

```
escola cheia: Início, Conversa, Ferramentas, as três ferramentas, Criados, Turmas, a turma aberta (Hoje, Atividades,
              Alunos), "O que o Assistente fez", Aprovar           → "Nenhuma tela rola a 1366 × 768."
escola vazia: Turmas, a turma aberta (Hoje), "O que o Assistente fez", Adaptação, Criados, Início
                                                                    → "Nenhuma tela rola a 1366 × 768. (escola vazia)"
tema escuro:  Início, Ferramentas, Criados, Turmas, Alunos, "O que o Assistente fez", Aprovar
                                                                    → "Nenhuma tela rola a 1366 × 768."
```

Aprovar continua sem abrir na vitrine ("Carregando a correção…"; é o M1 da rodada 1, a semente de validação anterior à
spec): a medida dela não conta, e Aprovar não foi tocada pelas correções.

### 1. RF a RF

Só os RF que mudaram de situação ou de evidência. Os demais (RF1, RF2, RF4 a RF11, RF13 a RF17, RF19 a RF21) seguem
ATENDIDOS com a evidência da rodada 1, e nenhuma correção tocou o código deles além do que está abaixo.

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF3 | ATENDIDO (era PARCIAL) | `api/atividades.ts:88` (`recarregarDepoisDoLote`); `Turmas.tsx` (`recarregar` dos vínculos); `fila-do-professor.ts:93-192` | `SinoDoProfessor.test.tsx:699` ("aprovar o lote tira a correção do sino…", `Aprovar` e o sino no mesmo cliente de consultas); `:735` ("confirmar a turma tira 'Confirme sua turma'…", com a leitura dos pedidos da turma confirmada como controle); os da rodada 1 (`fila-do-professor.test.ts:51-99`, `e2e/professor-sino.spec.ts:53`, `:122`) | Os quatro tipos agora têm prova de que saem: pedidos e versão adaptada por e2e, correção e turma por componente com a tela que decide ao lado. Mutação 1 abaixo, vermelha. O "e2e por tipo" do PRD continua em 2 de 4; os outros dois são componente com a tela real, e a mutação prova que pegam |
| RF4 | ATENDIDO | `fila-do-professor.ts:182` (`haMais`); `componentes/sino/Sino.tsx:94`; `componentes/Contador.tsx` (`ouMais`) | `SinoDoProfessor.test.tsx:265`, `:276` (controle: 100 sem outra página são 100); `fila-do-professor.test.ts` ("a página de entregas cheia, com outra depois…"); `Sino.test.tsx` ("o nome do botão diz 'ou mais'…"); `Contador.test.tsx` | O caso de borda "mais de 100" agora diz "Esperando você, 100 ou mais" (pílula "100+", leitor de tela "100 ou mais"), com a troca registrada na Tech Spec (§ do sino, `ea8b9f7`) |
| RF12 | ATENDIDO (era PARCIAL) | `Criados.tsx:214` | `Criados.test.tsx:182` (duas linhas, datas um mês distantes, cada uma com a sua e sem a da outra) | Mutação declarada no documento da correção e provada pelo portão. Foto `escuro--professora--professor-criados--computador.png` ("Versão adaptada · Fonte ampliada · 19/10/2026, 16:00") |
| RF16 | ATENDIDO | `TurmaHoje.tsx:86-89` (o 404 dos sinais chama `aoPerderATurma`); `Turma.tsx:111` (`aoPerderATurma` passado a Hoje) | `TurmaHoje.test.tsx:388` e os três vizinhos (primeira leitura em 404; controles de limite e servidor); `Turma.test.tsx:203` (painel aberto e fechado); `e2e/professor-tutor.spec.ts:177` (rodado, verde nos dois projetos) | Fecha o A2 da rodada 1: a página sai pela releitura dos 15 s, sem esperar a releitura da turma (o e2e conta zero `GET /v1/turmas/:id`), e os nomes do "Ver quem" saem com ela. Mutação 2 abaixo, vermelha |
| RF18 | ATENDIDO (era PARCIAL) | `AlunosDaTurma.tsx:106-110` (o vazio dos pedidos sem ação); `AcessoDaTurma.tsx:97` | `AlunosDaTurma.test.tsx:476` (conta os botões de face `bg-laranja`: só "Convidar alunos"), `:460` (o vazio sem botão); `e2e/pedidos.spec.ts:229` (`toHaveCount(0)` na seção) | Fotos `…/scratchpad/fotos/alunos-computador.png` e `escuro--professora--professor-turmas-01a15588-feac-7001-ae37-2dd93d0c0535--computador.png`: um botão cheio, "Convidar alunos". As asserções de `pedidos.spec.ts` que saíram eram do botão que saiu; o foco no título do acesso continua provado no mesmo caso (`:247`, `:262`) |
| RF22 | ATENDIDO (era NÃO ATENDIDO) | `Turma.tsx:74`, `:107-108` (o painel da aba é o miolo, `O_MIOLO_DO_DOCUMENTO`, com o topo medido); `Ferramenta.tsx:25`, `:46` (`useTopoDoMiolo`); `Time.tsx:127`, `:304` (a conversa é o miolo, "Ver mais entregas" dentro dele); `miolo-do-documento.ts` | `e2e/professor-turma-aberta.spec.ts:75` (Hoje), `e2e/professor-turma-alunos.spec.ts:207` (Alunos), `e2e/professor-ferramentas.spec.ts:358` (as três ferramentas), `e2e/professor-entregas.spec.ts:51` (seis entregas, faixa aberta e fechada); os quatro rodados e verdes nos dois projetos; `soOPainelDaAbaRola` (`e2e/__fixtures__/professor/cena.ts`) confere que a página não passa da janela **e** que o painel tem o que rolar, com as abas paradas | Vitrine: nenhuma tela rola, na escola cheia, na vazia e no escuro. Fotos `…/scratchpad/fotos/hoje-computador.png`, `alunos-computador.png`, `professora--professor-ferramentas-adaptacao--computador.png`, `professora--professor-time-assistente--computador.png`, `vazia--professora--professor-turmas--Abrir-a-turma--computador.png` (todas param em 768 px, o miolo cortado no pé). A 360 px a página rola inteira, sem rolagem lateral (`hoje-celular.png`). Mutação 3 abaixo, vermelha |
| RF23 | ATENDIDO | — | Casos de e2e 589 → 594 e da web 1904 → 1921 de `9a2a4f9` a `773cc92`, sem queda em nenhum commit de nenhuma linha; nenhum `.skip`, `.only` nem `fixme` | `fc6eaba` troca a entrada pela tela por entrada pela API num caso que prova só o endereço da Privacidade, com as mesmas asserções de endereço e de aba |

Contagem: 23 RF, **23 ATENDIDOS**.

Provas de mutação (cada uma restaurada com `git checkout -- <arquivo>`; `git status` limpo no fim, e a web do ambiente
reconstruída sem a mutação, com o mesmo caso verde):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF3 | `api/atividades.ts:88`, `void cliente.invalidateQueries({ queryKey: CHAVE_DAS_ENTREGAS })` em `recarregarDepoisDoLote` (a mesma que sobreviveu na rodada 1) | `SinoDoProfessor.test.tsx` › "aprovar o lote tira a correção do sino…" (estoura os 5 s esperando "Esperando você, nada") |
| RF16 (A2) | `TurmaHoje.tsx:88`, `if (semATurma) aoPerderATurma()` → `if (semATurma && false) …` | 4 casos: `TurmaHoje.test.tsx` › "o 404 da releitura dos 15 s avisa a página…" e "a primeira leitura dos sinais já com 404…"; `Turma.test.tsx` › "o 404 da releitura dos sinais tira a página inteira" (painel aberto e fechado) |
| RF22 | `Turma.tsx:108`, ` classeDoPainel={O_MIOLO_DO_DOCUMENTO}` | `e2e/professor-turma-aberta.spec.ts:75` [chromebook] › "Hoje mantém a página parada a 1366 × 768…" (`a página inteira rola a partir de 768 px: só o miolo deveria`, `Received: 156`) |

### 2. Regras de negócio, casos de borda e critério de pronto

As regras de negócio seguem cumpridas como na rodada 1; nenhuma correção mexeu em aprovação, lote, adaptação, convite ou
vocabulário. Mudou o seguinte:

| Item | Situação | Evidência |
|---|---|---|
| Regra nome do aluno só ao professor da turma, sem guardar ao sair | cumprida, e reforçada | A turma perdida em Hoje sai com o painel "Ver quem" (`e2e/professor-tutor.spec.ts:177`, nenhum dos nomes no `body`); sinais, uso, desempenho e alunos têm `gcTime: 0` (`api/tutor-da-turma.ts:17`, `:30`; `api/atividades.ts:99`) |
| Borda: vínculo encerrado com a turma aberta | coberta (era em parte) | Hoje: `TurmaHoje.test.tsx:388`, `Turma.test.tsx:203`, `e2e/professor-tutor.spec.ts:177`; Alunos e abrir já encerrada, como na rodada 1 |
| Borda: mais de 100 entregas esperando | coberta (era sem teste e divergente) | RF4 acima |
| Pronto: tudo o que faz hoje pelos quatro lugares e pelo sino | cumprido | RF1 a RF6, com o RF3 completo |
| Pronto: cada tela cabe em 1366 × 768 e funciona a 360 px | cumprido (era faltando) | RF22 acima; vitrine nas duas escolas e no escuro |
| Pronto: foto de cada tela no claro e no escuro, no computador e no celular | cumprido nesta rodada | `.processo/vitrine/` (claro, escuro, vazia, computador e celular). O lado a lado com a seção do `mockup.md` é a métrica do PRD §9, que o Gabriel aprova ou aponta |
| Pronto: `docs/interface.md`, Parte A, descreve o construído | cumprido (era faltando) | `docs/interface.md:83-100` (lugares, Criados, documento), `:195-225` (seção 1.3, o sino e o pé), `:261-379` (seção 1.7: Turmas, a turma aberta com Hoje, Atividades e Alunos, o miolo que rola e o diálogo "Convidar alunos"); "média 6,4" e "Visão Geral e Alunos" como estado atual saíram |
| Docs sem "Seu time" como lugar atual (A4) | cumprido | `bfd3715`: roteiro, glossário, agentes, fluxos e as três AIAs. O que sobra em `docs/` é histórico (`mvp-rapido.md`, `pendencias-dos-mockups.md`) ou da área do aluno (`regulacao.md:184`) |
| Pronto: teto dos pedaços `tela-professor-*` e da fachada no teste do build | esteira: conferida no fechamento | a etapa "teto do bundle da web" (`size-limit`, 150 kB) passou nas duas execuções do e2e desta rodada; o teto por pedaço é do `apps/web/nome-dos-chunks.test.ts`, na esteira |
| Os demais itens da rodada 1 | sem mudança | — |

### 3. Portão

| Portão | Resultado |
|---|---|
| `npm run typecheck` | não rodado (escopo de funcionalidade completa: esteira conferida no fechamento) |
| `npm run lint` | não rodado (idem) |
| Unidade e componente de evidência | ✅ 10 arquivos, 198 casos: `SinoDoProfessor`, `Criados`, `AlunosDaTurma`, `fila-do-professor`, `Contador`, `Sino`, `TurmaHoje`, `Turma`, `Ferramenta`, `Time` |
| e2e de evidência | ✅ 10 de 10, nos dois projetos: `professor-turma-aberta.spec.ts:75`, `professor-turma-alunos.spec.ts:207`, `professor-ferramentas.spec.ts:358`, `professor-entregas.spec.ts:51`, `professor-tutor.spec.ts:177`; e `professor-turma-aberta.spec.ts:75` [chromebook] de novo, verde, depois da mutação 3 restaurada |
| `npm run test:infra` | não se aplica |
| Esteira do GitHub | esteira: conferida no fechamento |
| Dependências | `node_modules` em dia com o `package-lock.json`: não precisou de `npm ci` |
| Revisões das correções | ✅ as dez têm rodada de todo revisor da linha "Subagentes obrigatórios" e do `test-engineer`, com a última de cada um APROVADO; `revisor-geral` presente nas que passaram de 5 arquivos fora de `tasks/` (`formulario-e-assistente-rolam-a-pagina`, `sino-cem-ou-mais`, `docs-sem-seu-time`); `privacy-guardian` na do vínculo encerrado |
| Commits sem `(tarefa N.0)` nem `(correção …)` | ✅ os nove sem marca só tocam `tasks/prd-telas-do-professor/estado.md`; os sete merges de encontro só resolvem `tasks/correcoes/achados/indice.md` e `TODO.md` |

### 4. Achados

**Críticos**

- Nenhum.

**Maiores**

- Nenhum.

**Menores**

- N1 · `tasks/prd-telas-do-professor/techspec.md:211-213` ("(8) A página não rola, rola a mesa") só fala do documento; o
  mesmo miolo agora é o da turma aberta, do formulário de ferramenta e de "O que o Assistente fez". Não é desvio silencioso:
  está no `TODO.md` e no documento da correção, para o Arquiteto no fechamento. Correção: estender o parágrafo às três telas.
- N2 · `apps/web/src/areas/professor/Time.tsx:275` (faixa "Esperando você"): com muitas entregas esperando, a lista da faixa
  aberta e "O que cada função faz sozinha" aberto, o painel da conversa pode encolher quase a zero a 1366 × 768. Está no
  `TODO.md` como decisão de desenho (teto com rolagem própria na faixa), com os dois e2e que faltam ("Ver" da faixa com a
  rolagem dentro do painel; o formulário depois de gerar). O e2e de hoje cobre três itens abertos.
- N3 · `TODO.md` ("A turma que sai do alcance deixa os nomes no cache de consultas", `privacy-guardian`): as leituras com nome
  da turma (`consultaSinais`, `consultaUsoDoTutor`, `consultaDesempenhoDaTurma`, alunos e pedidos) já têm `gcTime: 0` e saem
  do cache quando a aba desmonta. Quem pegar o item escreve primeiro o teste que lê o cache depois da turma perdida
  (`tudoDoCache`, como o do sino); se ele passar, o item fecha sem código.
- N4 · Títulos de e2e que ainda dizem "Seu time" como lugar (era o M5): `e2e/professor-lugares.spec.ts:19` (mantido de
  propósito, com o comentário em `:16`), `e2e/a3-a4-professor.spec.ts:22`, `e2e/professor-entregas.spec.ts:15` e `:231` (os
  `describe`, agora também do caso novo do RF22) e `e2e/pecas-marca-onca.spec.ts:92`. As asserções provam que nenhum texto de
  tela diz "Seu time"; só o nome do caso ficou.
- N5 · Os da rodada 1 que seguem: M1 (semente de validação da vitrine, Aprovar não abre), M2 (recomendações com destino
  `TODO.md` sem a linha, para o fechamento), M3, M4, M6 (`tasks.md:52-53`, 7.1 e 7.2 `[ ]`), M7 e M8.

**Positivos**

- `soOPainelDaAbaRola` mede as duas metades do requisito (a página não passa da janela **e** o painel tem o que rolar), e por
  isso não passa com a tela curta; a mutação o deixou vermelho com 156 px.
- O C1 foi provado montando a tela que decide e o sino no mesmo cliente de consultas, que é onde a invalidação faz diferença,
  e a mutação que sobrevivera na rodada 1 agora fica vermelha.
- O caso do vínculo encerrado conta zero releituras da turma, o que prova que quem tira a página é a releitura dos 15 s.

### 5. Conclusão

APROVADA. Os quatro críticos e os quatro maiores da rodada 1 foram corrigidos, cada um com teste que pega a regra: as três
mutações desta rodada ficaram vermelhas, e a do RF3 é a mesma que sobrevivia antes. Os 23 RF estão atendidos, nenhuma tela do
professor rola a página a 1366 × 768 (escola cheia, vazia e escuro), e a Parte A do `docs/interface.md` descreve o que foi
construído. O que sobra é menor e tem destino. A esteira do `773cc92` é conferida pelo Orquestrador no fechamento.

### 6. Pendências herdadas

- N1: Arquiteto, no fechamento (já no `TODO.md`).
- N2 e N3: `TODO.md`, já escritos; o N3 com o teste antes de qualquer código.
- N4 e o resto de N5: `TODO.md`, no fechamento (dono: Orquestrador), junto com as recomendações do M2.

---

## Rodada 1 — 19/10/2026

**Escopo:** funcionalidade completa
**Commit validado:** `421b9f2` (último commit com código: `5724d6d`)
**Veredito: REPROVADA**

Fotos lidas: `.processo/vitrine/` (vitrine montada em 19/10, 16h, ambiente de teste 0), nas duas escolas, computador
(1366 px) e celular (360 px). Aprovar não abre na vitrine (ver Menores, M1) e foi visto pelo traço do e2e
`professor-aprovar.spec.ts:152` [chromebook], quadros em
`/tmp/claude-1000/-home-joaquimdp-Documentos-git--maestri-floors-educaia--spectelas-do-professor/1cc6c647-5682-440c-acd2-d20be91cb204/scratchpad/tr-cb/screencast/`.

Relatório de rolagem da vitrine (a 1366 × 768, altura medida):

```
/professor/turmas/<id>  (Hoje, escola cheia)            924 px
/professor/turmas/<id>  (Hoje, escola vazia)            960 px
/professor/turmas/<id>?aba=alunos (1 aluno)             951 px
/professor/ferramentas/adaptacao                        782 px
/professor/time/assistente                              887 px
Início, Conversa, Ferramentas, Criados, Turmas, Atividades, documento (as três abas), Aprovar: não rolam
```

### 1. RF a RF

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 | ATENDIDO | `apps/web/src/areas/navegacao.ts:64-69`, `:96-100` | `navegacao.test.ts:6` (lista exata), `:99`; `e2e/casca.spec.ts:353`, `:423`, `:531` (três larguras); `e2e/professor-lugares.spec.ts:32-36`; `e2e/meus-dados.spec.ts:275` | Foto `professora--professor-nova-conversa--computador.png` e `--celular.png`. O título do caso `professor-lugares.spec.ts:19` ainda diz "e 'Seu time' com o Assistente…" (Menores) |
| RF2 | ATENDIDO | `caminhos.ts` (só `criados` novo); `areas/professor/rotas.tsx:61-62`; `Tutor.tsx:21-43` | `Tutor.test.tsx:43` (histórico exato `…?aba=hoje`, com `replace`), `:49`, `:54`, `:59`, `:69`; `e2e/professor-tutor.spec.ts:190`, `:199`, `:206`; `e2e/professor-lugares.spec.ts:50-52` | Quatro `toHaveURL` mudaram no diff: o de `time/tutor` é o próprio RF2; `acesso-da-turma` aceita `?aba=alunos` (13.0); `casca-no-celular` foi para `/criados` (5.0); `acesso-suspenso` perdeu `/escolher-escola$` na divisão `363cdf0`, provado em `entrar.spec.ts`. Nenhum endereço deixou de abrir |
| RF3 | **PARCIAL** | `areas/professor/fila-do-professor.ts:93-192`; `SinoDoProfessor.tsx`; `api/atividades.ts:88` (`recarregarDepoisDoLote`) | `fila-do-professor.test.ts:51-99` (tipo a tipo, destino exato); `SinoDoProfessor.test.tsx:119`, `:149`, `:162`; `e2e/professor-sino.spec.ts:53` e `:122` (rodados, verdes) | "Sai quando ela acontece" está provado para pedidos e versão adaptada. **A correção aprovada sair do sino não tem teste**: a mutação que tira a invalidação de `entregas` depois do lote sobreviveu (abaixo). "Confirme sua turma" sai só por prova indireta (`Turmas.test.tsx:182` lê a mesma chave). O PRD pede "e2e por tipo"; há para 2 de 4. Foto `professora--professor-nova-conversa--Esperando-você--computador.png` |
| RF4 | ATENDIDO | `componentes/sino/Sino.tsx:90-96`, `:173`, `:213`; `componentes/Contador.tsx:43`; `fila-do-professor.ts:179-191` | `Sino.test.tsx:45`, `:53`, `:66`, `:141-170`; `SinoDoProfessor.test.tsx:201-357` (parcial com texto exato, nunca "Tudo em dia"); `fila-do-professor.test.ts:80`, `:169`, `:175` | Foto vazia `vazia--professora--professor-nova-conversa--Esperando-você--computador.png` ("Tudo em dia"). O caso de borda "mais de 100 entregas" diverge (Maiores, A1) |
| RF5 | ATENDIDO | `componentes/sino/leitura-do-sino.ts:21,30`; `fila-do-professor.ts:307-330`; `Contador.tsx:45` | `SinoDoProfessor.test.tsx:420` (5 min sem leitura), `:430` (foco), `:441` (rede), `:452` (controle que relê); `Sino.test.tsx:66` (sem `animate`/`transition`); `e2e/professor-sino.spec.ts:62`, `:78` (`semAnimacao`) | Ressalva sem efeito no RF: `meus-vinculos` é observado com o padrão (foco ligado) pelas telas, e o item "Confirme sua turma" pode mudar ao voltar o foco por causa da tela, não do sino |
| RF6 | ATENDIDO | `SinoDoProfessor.tsx:13-19` (pé); `Time.tsx`; `TurmaHoje.tsx:102`, `:121`, `:125`, `:166` | `SinoDoProfessor.test.tsx:135`; `e2e/professor-entregas.spec.ts:38-50`, `:122`; `e2e/professor-tutor.spec.ts:71`, `:86`, `:124`, `:177`; `e2e/professor-lugares.spec.ts:50-60` | Os sete blocos têm tela. Fotos `professora--professor-time-assistente--computador.png` e `professora--professor-turmas--Abrir-a-turma--computador.png` |
| RF7 | ATENDIDO | `areas/professor/Home.tsx:48-105`; `saudacao.ts:7-24`; `AtalhosDeFerramenta.tsx:34`; `avisos.tsx:33` | `Home.test.tsx:105-146` (quatro estados), `:169` (relógio fixo, 8h/14h/20h), `:184`, `:210`, `:279` (sem "Esperando você" e zero `/v1/entregas`); `saudacao.test.ts:5` | Fotos `professora--professor-nova-conversa--computador.png`/`--celular.png` ("Boa tarde, Professora", onça com "IA", caixa com 2ºB · Química, três atalhos, aviso de IA) |
| RF8 | ATENDIDO | `CaixaDoAssistente.tsx:81-90`, `:126`; `Conversa.tsx:31-36`, `:113-121`; `ferramentas.ts:254` | `Home.test.tsx:225`, `:251`, `:264`; `Conversa.test.tsx:217`, `:237`, `:254`, `:270`, `:286`; `ferramentas.test.ts:149`; `e2e/a2-assistente.spec.ts:139` | Nenhuma tarefa declarou mutação em `ferramentas.ts:254` (a única barreira da Adaptação no caminho do Início); o teste a pega pela leitura (`iniciais: {}`) |
| RF9 | ATENDIDO | `Conversa.tsx:54`, `:147-173`; servidor `packages/nucleo/src/ia/tarefas/propor-ferramenta.ts:65` | `Conversa.test.tsx:305` (assinatura em toda resposta); `e2e/a2-assistente.spec.ts:139` (recusa de redação, thread que volta depois de recarregar); `e2e/professor-conversa.spec.ts:20` | Foto `professora--professor-conversa--computador.png` (vazio que convida, menu "Ferramenta", aviso de IA sob a caixa) |
| RF10 | ATENDIDO | `ferramentas.ts:30-74`, `:120`; `Ferramentas.tsx:87`, `:105-109` | `ferramentas.test.ts:13`, `:25`; `Ferramentas.test.tsx:63`, `:127`, `:141`; `e2e/professor-ferramentas.spec.ts:36`, `:109` | Foto `professora--professor-ferramentas--computador.png` (Planejar, Preparar a aula, Avaliar; Corrigir não aparece) |
| RF11 | ATENDIDO | `ferramentas.ts:90-106`; `Ferramenta.tsx:43-53` | `Ferramenta.test.tsx:80`, `:111`; `ferramentas.test.ts:160-193`; `e2e/professor-ferramentas.spec.ts:304`, `:364` | Foto `professora--professor-ferramentas-adaptacao--computador.png`. A página rola 14 px (RF22) |
| RF12 | **PARCIAL** | `Criados.tsx:198-217`; `criados.ts:61-128`; `api/artefatos.ts:26-31` | `criados.test.ts:38-64`, `:111`; `Criados.test.tsx:156`, `:183-246`; `e2e/professor-criados.spec.ts:82`, `:106`, `:152`, `:169`, `:238` (isolamento, rodado, verde) | **A data da linha (`Criados.tsx:214`, `formatarDataHora(artefato.criadoEm)`) não é conferida por nenhum teste**: nem `Criados.test.tsx` nem `professor-criados.spec.ts` têm a data. Tirar `· {formatarDataHora(...)}` não deixa nada vermelho. Tipo, turma, estado da decisão e filtros têm prova. Fotos `professora--professor-criados--computador.png`, `vazia--professora--professor-criados--computador.png` |
| RF13 | ATENDIDO | `Artefato.tsx:34-42`, `:109-117`, `:215-288`; `Folha.tsx:20-27`; `ConteudoDoArtefato.tsx:42,77`; `AplicacaoDoArtefato.tsx:65,174-202`; `EncerramentoDaAtividade.tsx` | `Artefato.test.tsx:183`, `:285`, `:298`, `:337`; `EncerramentoDaAtividade.test.tsx:62-90`; `entregas.test.ts:92`; `e2e/professor-artefato.spec.ts:59-146`; `e2e/professor-aplicacao.spec.ts:14` | Fotos `professora--professor-criados--Estequiometria-lista-sintética--computador.png`, `…-tab-name-Na-turma--computador.png`, `…-versão-adaptada-sintética--computador.png` (página parada; na versão pendente a mesa começa em ~575 px, já no `TODO.md` pela 6.0) |
| RF14 | ATENDIDO | `Turmas.tsx:99-168` | `Turmas.test.tsx:128`, `:142`, `:182`, `:209`, `:332`, `:525`; `e2e/escola-e-vinculos.spec.ts:295`; `e2e/professor-turmas.spec.ts:81`; `e2e/acesso-da-turma.spec.ts:306`, `:528` | Fotos `professora--professor-turmas--computador.png`, `vazia--professora--professor-turmas--celular.png` |
| RF15 | ATENDIDO | `endereco-da-turma.ts:7-26`; `Turma.tsx:53`, `:100` | `endereco-da-turma.test.ts:5-9`; `Turma.test.tsx:82-121`; `e2e/professor-turma-aberta.spec.ts:20-54`; `e2e/acesso-da-turma.spec.ts:347` (recarregar) | Voltar pelo histórico só prova que o Voltar sai da turma (`replace`); a volta até a aba é função do endereço, provada pelo `?aba=` direto |
| RF16 | ATENDIDO | `TurmaHoje.tsx:38`, `:65`, `:100-116`, `:153-162`, `:223-252`, `:288-378` | `TurmaHoje.test.tsx:206`, `:226`, `:291`, `:308`, `:334` (relógio falso, 14 s e 15,5 s), `:356`, `:378`, `:392`, `:420`, `:528`; `e2e/professor-tutor.spec.ts:86` (rodado, verde) | Mutação abaixo ficou vermelha. Fotos `professora--professor-turmas--Abrir-a-turma--computador.png` e a vazia. A página rola (RF22); o vínculo encerrado com Hoje aberta não tem prova (Maiores, A2) |
| RF17 | ATENDIDO | `AtividadesDaTurma.tsx:31-45`, `:98-100`, `:216`, `:272-283` | `AtividadesDaTurma.test.tsx:132`, `:154`, `:196`, `:210`, `:318`, `:525`, `:539`; `e2e/professor-turma-atividades.spec.ts:59`, `:101`; `e2e/professor-turma-aberta.spec.ts:75` | Foto `/tmp/claude-1000/-home-joaquimdp-Documentos-git--maestri-floors-educaia--spectelas-do-professor/1cc6c647-5682-440c-acd2-d20be91cb204/scratchpad/fotos/atividades-computador.png` ("Encerrada · prática · 1 de 1 aluno enviou", selo "Correção aprovada") |
| RF18 | **PARCIAL** | `alunos-da-turma.ts:35-75`; `AlunosDaTurma.tsx:97-113`; `AcessoDaTurma.tsx:97`; `api/alunos-da-turma.ts:35` | `alunos-da-turma.test.ts:36-85`; `AlunosDaTurma.test.tsx:101`, `:134`, `:148`, `:316`, `:419`, `:459`; `api/alunos-da-turma.test.ts:85`; `e2e/professor-turma-alunos.spec.ts:102`, `:145`; `e2e/pedidos.spec.ts:201`, `:496` | Código e teste atendem. **A tela tem dois botões cheios laranja**: "Convidar alunos" (`AcessoDaTurma.tsx:97`) e, no vazio dos pedidos, "Ver o acesso dos alunos" (`AlunosDaTurma.tsx:110`, que só põe o foco no título da seção logo acima). Contradiz `docs/interface.md` R4 e o padrão de página da seção 6 ("Um botão cheio por tela"), defeito da lista do `frontend-reviewer`. Foto `professora--professor-turmas-01a15588-feac-7001-ae37-2dd93d0c0535--computador.png` e `--celular.png`. A página também rola (RF22) |
| RF19 | ATENDIDO | `AcessoDaTurma.tsx:97-117`; `ConvidarAlunos.tsx:135`, `:169-262`; `api/acesso.ts:49` | `ConvidarAlunos.test.tsx:186`, `:218`, `:298`, `:342`, `:375`; `e2e/convidar-alunos.spec.ts:57`, `:147` (caixa = janela, fundo nos dois temas, `elementFromPoint`); `e2e/acesso-da-turma.spec.ts:565`, `:906`, `:1141`, `:1278` (sessão vencida) | A vitrine não abre o diálogo (não captura modal); visto pela asserção do e2e e pelas fotos da 13.0 |
| RF20 | ATENDIDO | `Aprovar.tsx:413`, `:417`, `:443-455`; `aprovar.ts:109-119` | `Aprovar.test.tsx:181`, `:198`, `:207`, `:227`; `aprovar.test.ts:36-79`; `e2e/professor-aprovar.spec.ts:152` (rodado, verde), `:225`, `:244`, `:255-265`; `e2e/a3-a4-professor.spec.ts:102-139` | Mutação abaixo ficou vermelha. Quadro do traço: "Aprovar 28 correções" em grafite na barra presa, "Rejeitar a correção" de contorno, "Validação registrada por …". O texto do efeito na confirmação só é provado no e2e |
| RF21 | ATENDIDO | textos de `aprovar.ts`, `sinais.ts`, `ferramentas.ts`, `alunos-da-turma.ts` | `aprovar.test.ts:113`, `:125`, `:224`; `ferramentas.test.ts:189`; `AtividadesDaTurma.test.tsx:590`; `AlunosDaTurma.test.tsx:189`; `TurmaHoje.test.tsx:494`; e2e das telas da turma e de Aprovar | Grep nos fontes: nenhuma "nota", "média", "ranking", "ocioso" visível. Criados, Turmas, Início, Conversa, documento e Convidar não têm teste de vocabulário (Menores). "Acerto médio" (`aprovar.ts:236`) está registrado na Tech Spec §9 |
| RF22 | **NÃO ATENDIDO** | `TurmaHoje.tsx`, `AlunosDaTurma.tsx`, `Ferramenta.tsx`, `Time.tsx` | `playwright.config.ts` roda todo spec nos dois projetos; nenhum e2e mede que a página da turma aberta, do formulário ou do Assistente cabe na janela | **A página rola a 1366 × 768** em Hoje (924 px; 960 na escola vazia, sem sinal nenhum), Alunos (951 px com um aluno), formulário da Adaptação (782 px) e "O que o Assistente fez" (887 px). O RF diz "cabe em 1366 × 768", que é a R10 de `docs/interface.md` ("a 1366 × 768 a tela de trabalho não rola a página") e é como a própria Tech Spec o lê no documento (§9, "A página não rola, rola a mesa", citando o RF22). Os quatro estados e os 360 px estão atendidos (sem rolagem lateral nas fotos de celular). Relatório de rolagem no topo |
| RF23 | ATENDIDO | — | contagem de `test(` em `e2e/` 505 → 589, nenhum commit reduz; `it(`/`test(` da web 1502 → 1904; nenhum `.skip`, `.only`, `fixme` | Todo caso removido tem destino (`professor-assistente`/`professor-turma` repartidos com o mesmo título; os da 3.0, 9.0 e 10.0 em componente). Enfraquecimentos pequenos, aceitos por revisor: `navegacao.test.ts:62` e `sino-por-area.test.tsx:58` |

Provas de mutação (árvore restaurada com `git checkout -- <arquivo>` depois de cada uma; `git status` limpo no fim):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF3 | `api/atividades.ts:88` `void cliente.invalidateQueries({ queryKey: CHAVE_DAS_ENTREGAS })` (a correção aprovada sair do sino) | **nenhum**: `Aprovar.test.tsx`, `SinoDoProfessor.test.tsx` e `fila-do-professor.test.ts` passaram (75 de 75). Confirma a lacuna do RF3 |
| RF16 | `TurmaHoje.tsx:108`: o aviso de atenção humana passa a escrever os nomes (`atencao.map((sinal) => sinal.aluno.nome)`) | `TurmaHoje.test.tsx` › "recém-aberta, com sinal de atenção…" (`expected [ 'Caio Sintético' ] to deeply equal []`) |
| RF20 | `Aprovar.tsx:417` `disabled={!dados.podeAprovar}` → `disabled={false}` | `Aprovar.test.tsx` › "desligado com destaque fechado, nas três abas…" (`expected false to be true`) |

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regra D18 (pergunta antes; só o atalho abre direto) | cumprida | RF8 |
| Regra D55 (atividade só objetiva, nada sobre questão aberta) | cumprida | `AtividadesDaTurma.tsx` (ícone e selo só de objetiva); RF9 (recusa de redação) |
| Regra D46 (acertos, correção, diagnóstico) | cumprida | RF21; "Acerto médio" registrado na Tech Spec §9 |
| Regra aprovar e aplicar em dois atos | cumprida | RF13 (`professor-aplicacao.spec.ts:14`), RF20 |
| Regra indicadores (ordem de nome, destaques da API) | cumprida | `alunos-da-turma.ts:35-40`; `Aprovar.test.tsx:408` (Outras por nome, nunca por acerto) |
| Regra conversa de aluno, anexo, busca, D64, D9 não entram | cumprida | `e2e/professor-tutor.spec.ts:153-155` (nada abre conversa); grep |
| Regra adaptação pelo tipo, nenhuma tela diz qual aluno tem adaptação | cumprida | `ferramentas.ts:189-208`; `AlunosDaTurma.test.tsx:189` |
| Regra convite: link e código uma vez | cumprida | RF19 |
| Regra catálogo só com as três ferramentas | cumprida | RF10 |
| Regra estados (carregando e erro definidos) | cumprida | RF22, parte dos estados |
| Regra nome do aluno só ao professor da turma, sem guardar ao sair | cumprida | `api/alunos-da-turma.ts:35` (`gcTime: 0`) e `api/alunos-da-turma.test.ts:85`; `SinoDoProfessor.test.tsx:172` (`JSON.stringify` do `QueryCache` sem nome); `e2e/professor-sino.spec.ts:251` |
| Borda: duas disciplinas na mesma turma | coberta | `Turmas.test.tsx:209`, `:525`; `fila-do-professor.test.ts:99`; `e2e/escola-e-vinculos.spec.ts:295` |
| Borda: professora de duas escolas | coberta | `e2e/professor-sino.spec.ts:204` (rodado, verde); `SinoDoProfessor.test.tsx:540` |
| Borda: sem turma confirmada | coberta | `Home.test.tsx` (estado sem turma); `Ferramentas.tsx` (aviso); `fila-do-professor.test.ts:85` |
| Borda: vínculo encerrado com a turma aberta | **coberta em parte** | Alunos (`pedidos.spec.ts:307`) e releitura da turma (`acesso-da-turma.spec.ts:1259`); abrir já encerrada (`professor-turma-aberta.spec.ts:115`). **Com Hoje aberta, sem prova e com dado velho na tela** (Maiores, A2) |
| Borda: entrega decidida em outra aba | coberta | `e2e/professor-sino.spec.ts:122` (rodado, verde) |
| Borda: mais de 100 entregas esperando | **sem teste, e diverge** | O sino diz "Esperando você, 100" e o aviso de leitura parcial, nunca "100 ou mais" (Maiores, A1) |
| Borda: dois alunos com o mesmo nome | coberta | `alunos-da-turma.test.ts:41`; `e2e/professor-turma-alunos.spec.ts:102` |
| Borda: sessão vencida com o convite aberto | coberta | `e2e/acesso-da-turma.spec.ts:1278`; variante do endereço aceita pela Tech Spec §9 (13.0, item 6) |
| Borda: função suspensa pela escola | coberta | `Ferramentas.test.tsx:127`, `:141`; `e2e/professor-ferramentas.spec.ts:109`; Início (divergência da 3.0) |
| Pronto: tudo o que faz hoje pelos quatro lugares e pelo sino | cumprido, menos a prova do RF3 | RF1 a RF6 |
| Pronto: nada de "Seu time" some | cumprido | RF6 |
| Pronto: lote sem liberar com destaque fechado (D33, D56) | cumprido | RF20, mutação vermelha |
| Pronto: sem ranking, tempo ocioso nem texto livre sobre aluno | cumprido | RF21 |
| Pronto: cada tela cabe em 1366 × 768 e funciona a 360 px | **faltando** | RF22: Hoje, Alunos, formulário da Adaptação e "O que o Assistente fez" rolam a página |
| Pronto: o e2e da A1 à A4 prova as mesmas regras | cumprido | RF23; `a2-assistente`, `a3-a4-professor`, `roteiro-da-demonstracao` com as mesmas asserções; a esteira confere no fechamento |
| Pronto: contagem de casos do e2e não diminui | cumprido | 505 → 589, monotônica por commit |
| Pronto: teto dos pedaços `tela-professor-*` e da fachada no teste do build | esteira: conferida no fechamento | — |
| Pronto: foto de cada tela no claro e no escuro, ao lado do mockup | não conferido | as fotos desta rodada são só no claro; as das tarefas ficaram nos checkouts das linhas |
| Pronto: `docs/interface.md`, Parte A, descreve o construído | **faltando** | Maiores, A3 |

### 3. Portão

| Portão | Resultado |
|---|---|
| `npm run typecheck` | não rodado (escopo de funcionalidade completa: esteira conferida no fechamento) |
| `npm run lint` | não rodado (idem) |
| Testes de unidade e componente de evidência | ✅ 22 arquivos, 420 casos (`fila-do-professor`, `SinoDoProfessor`, `Sino`, `TurmaHoje`, `Aprovar`, `aprovar`, `Criados`, `criados`, `alunos-da-turma`, `AlunosDaTurma`, `Home`, `Conversa`, `ferramentas`, `Ferramentas`, `Ferramenta`, `Turmas`, `Turma`, `AtividadesDaTurma`, `ConvidarAlunos`, `Artefato`, `Tutor`, `navegacao`) |
| e2e de evidência | ✅ `professor-lugares.spec.ts:19` (2), `professor-aprovar.spec.ts:152` (2), `professor-sino.spec.ts:53`, `:122`, `:204`, `professor-tutor.spec.ts:86`, `professor-criados.spec.ts:238`, `professor-turma-aberta.spec.ts:90` (12), nos dois projetos |
| `npm run test:infra` | não se aplica (nenhuma mudança de infra) |
| Esteira do GitHub | esteira: conferida no fechamento |
| Revisões com veto registradas e aprovadas | ✅ as 14 tarefas têm rodada de todo revisor obrigatório da tabela do `tasks.md`, mais `test-engineer` e `revisor-geral`, com a última rodada de cada um APROVADO (a da 6.0 do `frontend-reviewer` foi AJUSTES na 1ª e APROVADO na 2ª) |
| `/revisar-spec` | ✅ `revisao-spec.md`, rodada 4, APROVADA |
| Commits sem `(tarefa N.0)` nem `(correção …)` | ✅ todos os commits sem marca entre `0aea52e` e `421b9f2` só tocam `tasks/` (estado e Tech Spec) |

### 4. Achados

**Críticos**

- C1 · `apps/web/src/api/atividades.ts:88` (RF3): nenhum teste prova que a correção aprovada sai do sino. Tirar a invalidação
  de `entregas` depois do lote deixou `Aprovar.test.tsx`, `SinoDoProfessor.test.tsx` e `fila-do-professor.test.ts` verdes, e o
  item ficaria no sino até 5 min (`staleTime` da fila). "Confirme sua turma" sair do sino também só é provado de forma
  indireta. Correção: um caso que aprove o lote (componente com `Aprovar` e `SinoDoProfessor` no mesmo cliente, ou o e2e
  `professor-sino.spec.ts:53` estendido) e confira o sino sem o item; o mesmo para confirmar a turma; e a mutação acima declarada.
- C2 · `apps/web/src/areas/professor/Criados.tsx:214` (RF12): a data da linha não tem teste. Correção: conferir a data
  formatada em `Criados.test.tsx:156` (e no e2e, se quiser), com a mutação que a tira declarada.
- C3 · `apps/web/src/areas/professor/AlunosDaTurma.tsx:110` (RF18): a aba Alunos tem dois botões cheios, "Convidar alunos"
  (`AcessoDaTurma.tsx:97`) e "Ver o acesso dos alunos", no vazio dos pedidos, que só leva o foco ao título logo acima.
  Contradiz `docs/interface.md` R4 e o padrão de página da seção 6. Foto
  `.processo/vitrine/professora--professor-turmas-01a15588-feac-7001-ae37-2dd93d0c0535--computador.png`. Correção: tirar a
  ação do vazio dos pedidos (o "Convidar alunos" já está à vista) ou torná-la secundária, com teste que conte um botão cheio
  na aba.
- C4 · RF22 (`TurmaHoje.tsx`, `AlunosDaTurma.tsx`, `Ferramenta.tsx`, `Time.tsx`): a página rola a 1366 × 768 em Hoje (924 e
  960 px), Alunos (951 px com um aluno), formulário da Adaptação (782 px) e "O que o Assistente fez" (887 px). Correção: o
  miolo de cada uma rola por dentro, como o documento fez (`miolo-do-documento.ts`, medido) e como o mockup pede para Atividades
  e Alunos ("rola por dentro", `mockup.md:140`, `:154`), com e2e no `chromebook` que mede `scrollHeight` igual à janela. Se a
  decisão for aceitar a página rolando nessas telas, ela é do Joaquim e vai escrita no PRD (o RF22 hoje diz "cabe").

**Maiores**

- A1 · `apps/web/src/api/entregas.ts:20-23` e `componentes/sino/Sino.tsx:90-96` (PRD §7, "Mais de 100 entregas esperando"):
  com mais de 100 entregas o sino diz "Esperando você, 100" e o aviso de leitura parcial, e nunca "100 ou mais", que é o que o
  PRD promete; nenhum teste usa mais de 100 entregas, e a divergência não está registrada na Tech Spec. Correção: "100 ou mais"
  quando a página de entregas vem cheia com outra, com teste; ou registrar a troca na Tech Spec e no PRD.
- A2 · `apps/web/src/areas/professor/Turma.tsx:43-45` e `TurmaHoje.tsx:65` (PRD §7, "Vínculo encerrado com a turma aberta"):
  com Hoje aberta, o 404 da releitura de 15 s dos sinais não tira a página (a aba Alunos tira, por `aoPerderATurma`); a página
  só sai quando a turma é relida por foco ou visibilidade, depois de 30 s. Até lá o dado antigo fica na tela, e com o painel
  "Ver quem" aberto os nomes continuam (regra 20, item 18). Nenhum teste cobre esse caso, que a `10_task.md:70` previa
  ("vínculo encerrado tira a página"). Correção: Hoje repassar o `NAO_ENCONTRADO` dos sinais como a aba Alunos faz, com e2e.
- A3 · `docs/interface.md` (critério de pronto do `tasks.md`): a Parte A não descreve o que as tarefas 9.0 a 13.0
  construíram. `:87-88` diz que "na X3 o acesso e os pedidos passam para um diálogo" (só o acesso foi, e o texto está no
  futuro); `:1748` fala em "Visão Geral e Alunos" (são Hoje, Atividades e Alunos); `:213` e `:1046` dão de exemplo
  "Corrigi as 32 provas do 2ºB, média 6,4", contra o RF21; `:1656` fala em abrir a conversa de um aluno, que não existe; Hoje
  (aviso sem nome, "Ver quem", painel), Atividades, Alunos, os cartões de Turmas e o diálogo de convidar não estão descritos.
  Correção: reescrever a Parte A (seção 1 e 11.2 a 11.5) pelo que está no código.
- A4 · `docs/roteiro-da-demonstracao.md:180` ("Ver e decidir em Seu time") e `:227` ("Professora → Seu time → Tutor"): o
  roteiro operacional da demonstração descreve caminhos que não existem mais. Também citam "Seu time" como lugar atual
  `docs/glossario.md:203`, `docs/agentes.md:56,67,80`, `docs/fluxos.md:152`, `docs/aia/sinais-e-alertas.md:112,136,168,369,387`,
  `docs/aia/correcao-de-objetiva.md:72` e `docs/aia/adaptacao.md:119`. Correção: trocar pelo sino, pelo pé "O que o Assistente
  fez" e pela aba Hoje.

**Menores**

- M1 · `e2e/__fixtures__/governanca.ts:147` (usado pela vitrine, `tools/vitrine/escola.ts:7`): o registro de validação
  sintético grava `resumo: { alunos: 1, enviadas: 1 }`, que o `esquemaLoteApresentado` estrito (`packages/shared/src/atividade/correcao.ts:75`)
  recusa; `GET /v1/atividades-aplicadas/:id/correcao` responde 500 (`ZodError` em `correcao.service.ts`) e Revisar a correção
  não abre na vitrine. Anterior à spec. Correção: o resumo no formato do esquema. Destino: `TODO.md`.
- M2 · Cerca de 60 recomendações dos documentos das tarefas dizem ter destino `TODO.md` e a linha não existe (`1_task.md`
  535-558, `2_task.md` 151-156, `3_task.md` 237, `5_task.md` 390-407, `6_task.md` 337-347, `10_task.md` 288-306,
  `12_task.md` 462-476, `13_task.md` 470-483, `14_task.md` 287). A `10_task.md:307` diz que elas são escritas no fechamento.
  As que mais pesam: hora exata e "precisa de um adulto" na aba projetada (`10_task.md` 288/305), o nome que chega ao
  navegador antes do "Ver quem" (290), a tabela velha sem aviso depois de releitura que falhou (`12_task.md` 466), "Gerar novo
  acesso" que não volta quando outra pessoa revoga (`13_task.md` 474), o nome do interruptor "Gabarito" talvez duplicado para
  leitor de tela (`Artefato.tsx:269-270`, correção `a2-assistente`).
- M3 · Sem teste de vocabulário (RF21): Criados, Turmas, Início, Conversa, documento, Convidar e o sino. "Acerto médio"
  (`aprovar.ts:236`) é média de acertos com outra palavra; está registrado na Tech Spec §9, e o regex `\bmédia\b` não o pegaria.
- M4 · Os testes de "sem nome" em Hoje (`TurmaHoje.test.tsx:226`, `e2e/professor-tutor.spec.ts:86`) leem só o texto: um nome
  num `aria-label` passaria. Hoje também lê `GET /v1/turmas/:id/desempenho`, que traz `alunos[].nome`, com o painel fechado
  (`gcTime: 0`, nada na tela).
- M5 · Títulos de e2e que ainda dizem "Seu time": `e2e/professor-lugares.spec.ts:19` e `e2e/a3-a4-professor.spec.ts:22`.
- M6 · `tasks.md:52-53`: as subtarefas 7.1 e 7.2 estão `[ ]` com a 7.0 `[x]`.
- M7 · A vitrine fotografa a aba antes de ela carregar (`--clicar` na aba sai em "Carregando a aba…"): já no `TODO.md:1497`.
- M8 · O documento de uma versão adaptada pendente tem duas ações cheias à vista na aba "Na turma" ("Pedir versão adaptada"
  laranja e "Aplicar à turma" grafite); vale decidir se a R4 admite um laranja e um grafite na mesma tela.

**Positivos**

- O teste do sino que confere o `JSON.stringify` do `QueryCache` inteiro, com a lista nominal como controle, prova "sem nome
  no cache" de verdade.
- Os testes de "não relê por tempo, foco ou rede" com o controle que relê com a opção ligada.
- A contagem de casos do e2e conferida commit a commit: 505 → 589 sem nenhuma queda.

### 5. Conclusão

REPROVADA por quatro críticos: três RF parciais (RF3, RF12, RF18) e um não atendido (RF22). O código das regras que importam
está certo e provado: o lote não libera com destaque fechado, Hoje não mostra nome, o sino não guarda nome nem relê sozinho, e
o isolamento responde igual para outra escola. O que falta é prova de duas partes de critério (a correção que sai do sino, a
data em Criados), um botão cheio a mais na aba Alunos e quatro telas que rolam a página a 1366 × 768.

Caminho até APROVADA: C1 e C2 são testes (com a mutação declarada); C3 é uma linha e um teste; C4 é o miolo que rola por dentro
em Hoje, Alunos, formulário e "O que o Assistente fez", ou a decisão do Joaquim de aceitar a rolagem nessas telas, escrita no
PRD. Junto, A1 a A4: "100 ou mais" (ou o registro da troca), Hoje tirando a página no vínculo encerrado, a Parte A do
`docs/interface.md` e os docs que ainda citam "Seu time". Cada um por `/corrigir`, depois revalidação.

### 6. Pendências herdadas

- As recomendações de M2 vão para o `TODO.md` no fechamento (dono: Orquestrador).
- M1 (semente de validação da vitrine): `TODO.md`, correção própria.
- M3 e M4: `TODO.md`, para a próxima spec que tocar as telas do professor; "Acerto médio" fica para o Joaquim confirmar.
- M5, M6, M7, M8: `TODO.md`.
- O "nome da escola cortado" e "FERRAMEN…" na barra de baixo a 360 px (fotos de celular) já estão no `TODO.md`.
