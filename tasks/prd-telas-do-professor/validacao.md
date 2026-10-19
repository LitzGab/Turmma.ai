# Validação — telas-do-professor (X3)

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
