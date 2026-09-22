# Achados das revisões — `tasks/prd-identidade-e-tenancy/20_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-20 04:29:00 · `tasks/prd-identidade-e-tenancy/20_task.md`

## VEREDITO: REPROVADO

**Cenários exigidos** (tabela "Testes que provam a regra" de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/20_task.md:76-86`, mais o caminho feliz, bordas do domínio, permissão, isolamento e concorrência):

1. inatividade vence com `page.clock` e o rascunho sobrevive · 2. aba parada não renova / no máximo 1 aviso a cada 5 min · 3. 5xx e rede cortada não deslogam · 4. isolamento A→B sem dado de A no cliente · 5. troca para coordenação → `/mfa`; sessão de matrícula/externa → endereço da outra escola · 6. duas disciplinas na mesma turma: confirma uma, contesta a outra · 7. clique duplo em confirmar / contestar sem código · 8. Chromebook compartilhado (Sair + Voltar + pessoa seguinte) · 9. quatro estados de `/vinculos`, por teclado e toque, 360 px e axe.

**Cobertos:** 1 (`/home/joaquimdp/Documentos/git/Educa.ia/e2e/inatividade.spec.ts:46`), 2 (`:88`), 3 (`:122`), 4 (`/home/joaquimdp/Documentos/git/Educa.ia/e2e/escola-e-vinculos.spec.ts:104`, com a ressalva abaixo), 5 só na metade do MFA (`:134`), 6 (`:175`), 7 (`:221`, com concorrência real: a rota segura o primeiro `POST` enquanto o segundo clique é disparado), 8 (`:193` do arquivo de inatividade, mais o `Sair`+`goBack` já existente em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/entrar.spec.ts:426` e `:324`), 9 parcialmente (`escola-e-vinculos.spec.ts:267`). Lado de API: a divergência do `acessos` está bem pinada por `toEqual` exato, com conta vizinha como negativo, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/troca-de-escola.int.test.ts:222`. Sem `.skip`, sem teste comentado, sem mock de coisa nossa, nenhum provedor pago.

## Bloqueantes

**1. A regra "a inatividade usa o `inatividadeMin` do `/v1/eu`" não tem teste que a prove.**
`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/sessao/inatividade.ts:35` e `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/Cabecalho.tsx:36` leem o valor do servidor, mas o único e2e que faz a sessão vencer (`/home/joaquimdp/Documentos/git/Educa.ia/e2e/inatividade.spec.ts:18` e `:66`) usa justamente o padrão do banco, 120. Troque `inatividadeMin * MS_POR_MINUTO` por `120 * MS_POR_MINUTO` e os 122 e2e continuam verdes — e uma escola que configurar 30 min em F2 passa a não deslogar ninguém antes das duas horas. O caso do aluno, que seria o outro valor (30 min de `inatividade_aluno_min`), não fecha o furo: `e2e/inatividade.spec.ts:164` encerra a sessão pelo banco (`encerrarSessoesDoUsuario`) e avança só 6 min, sem exercitar relógio nenhum.
**Correção exigida:** uma escola de fixture com `inatividade_equipe_min` curto (o padrão do `escola()` do teste de integração já é parametrizado assim) ou o aluno com os 30 min dele, e duas asserções: o diálogo **não** aparece um minuto antes do limite configurado e aparece um minuto depois.

**2. `/vinculos` não tem nenhum teste por teclado, e a linha exigida pede "por teclado e toque".**
`/home/joaquimdp/Documentos/git/Educa.ia/e2e/escola-e-vinculos.spec.ts:267-319` (quatro estados) e `:175-219` (confirmar/contestar) só usam `tap`/`click`. Teclado e `focoVisivel` aparecem só em `:78-93`, na `/escolher-escola`, e no foco preso do diálogo em `e2e/inatividade.spec.ts:71`. A tela nova tem grupo de rádio, `textarea` e três botões (regra 50, item 11), e nada prova que se chega ao "Confirmar" e ao "Enviar a contestação" por Tab com foco visível.
**Correção exigida:** no projeto `chromebook`, percorrer o cartão por teclado (Tab até o botão, `Enter`), escolher o motivo por teclado e afirmar `focoVisivel(page)` — pelo menos no estado com dado e no vazio.

**3. Cenário exigido "sessão de matrícula no seletor leva ao endereço da outra escola" sem teste, porque a tela não faz isso.**
A subtarefa 20.1 (`20_task.md:49`) e a linha da tabela (`20_task.md:82`) dizem "leva ao endereço de entrada da outra escola, com a explicação". `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/SeletorDeEscola.tsx:93-97` só pinta um `role="alert"`, sem link nem navegação, e o teste `/home/joaquimdp/Documentos/git/Educa.ia/e2e/escola-e-vinculos.spec.ts:152-171` afirma só o texto do alerta — e para a sessão externa, não a de matrícula. A de matrícula, aliás, parece não existir: o aluno recebe `acessos` vazio (`apps/api/test/troca-de-escola.int.test.ts:690`), logo nunca vê seletor. Do jeito que está, o teste carimba um comportamento diferente do que a tarefa especificou, sem registro da divergência (ao contrário do que foi feito com o `acessos`).
**Correção exigida:** ou implementar o caminho até a entrada da outra escola e testá-lo, ou registrar a divergência no arquivo da tarefa, corrigir a linha da tabela de testes e deixar teste do que ficou decidido — incluindo que o aluno nunca vê o seletor (hoje isso só está provado na API, não na tela).

## Recomendações

- **Isolamento, a janela do `goBack`** (`e2e/escola-e-vinculos.spec.ts:130`): `expect(...).not.toContainText(..., { timeout })` passa assim que o texto some, então um render obsoleto seguido de `refetch` também passaria. Segure `**/v1/meus-vinculos` depois do `goBack`, como `entrar.spec.ts:336` faz com `/v1/eu`, e afirme a ausência **enquanto** a requisição está presa. O que hoje realmente prende a regra é o teste de unidade `a troca esvazia o cache da escola anterior ANTES de o token novo entrar` — ele está correto e é o que salva a cobertura.
- **Concorrência de tela ainda sem teste:** o duplo toque no seletor (`SeletorDeEscola.tsx:45`, abre sessão no destino e encerra a origem) e o duplo envio do login por cima (`LoginPorCima.tsx:42`). A API já tem o par em paralelo (`troca-de-escola.int.test.ts:639`), falta o lado do cliente.
- **Permissão na tela:** coordenação ou aluno digitando `/vinculos` na URL. O servidor já prova (`apps/api/test/vinculo.int.test.ts:357`), mas não há e2e de que a tela nunca mostra dado ali.
- **Para o `privacy-guardian` desta rodada:** `conclusao-de-login.ts:49` passou a devolver nome de escola e papel de todas as escolas da conta na etapa `escolher`, que vem **antes** do segundo fator (`etapaDoLogin`, `login.service.ts:147`). O conteúdo está pinado, a decisão de expor isso com credencial parcial não é minha.
- `AVISO_DA_TROCA_RECUSADA` manda entrar "com o seu e-mail e a sua senha" para quem entrou pela conta Google e pode não ter senha nenhuma.
- `contestar sem escolher o motivo` (`escola-e-vinculos.spec.ts:221`): o `required` do navegador segura antes da guarda de `Vinculos.tsx:78`, então o e2e não distingue as duas. Como não há teste de componente na web, fica como está; vale a nota no arquivo do teste.

## test-engineer · 2ª rodada · APROVADO · 2026-09-20 04:46:41 · `tasks/prd-identidade-e-tenancy/20_task.md`

Auditei o diff desde a minha 1ª rodada (`e2e/__fixtures__/sessao.ts`, `e2e/inatividade.spec.ts`, `e2e/escola-e-vinculos.spec.ts`, `packages/shared/src/erros/mensagens.ts`, `tasks/prd-identidade-e-tenancy/20_task.md`) e conferi cada correção exigida, mais o carimbo do portão.

**Correção 1 — inatividade lê `inatividadeMin` do `/v1/eu`.** Confirmada. `packages/nucleo/drizzle/0004_rede_escola_auditoria.sql:26` traz `inatividade_equipe_min DEFAULT 120`, e `e2e/inatividade.spec.ts:58` configura 30 pela fixture nova (`e2e/__fixtures__/sessao.ts:173`). As duas asserções existem e falham nos dois sentidos: `inatividade.spec.ts:77` (`toBeHidden` aos 29 min — quebra se o limite fosse menor que o configurado) e `:84` (`toBeVisible` aos 31 min — quebra com o 120 fixo, que é exatamente a mutação que você rodou). O relógio é simulado só na aba (`page.clock.install()`), o servidor segue no tempo real, então o diálogo aos 31 min só pode vir do timer do cliente com o valor da escola. A regra que o teste cobre está em `apps/web/src/sessao/inatividade.ts:35`.

**Correção 2 — teclado em `/vinculos`.** Confirmada. `e2e/escola-e-vinculos.spec.ts:70` (`tabAte`) falha por exceção se o alvo não entra na ordem de foco e afirma `focoVisivel(page)` no alvo focado; `focoVisivel` (`e2e/__fixtures__/verificacoes.ts:39`) checa `:focus-visible` mais contorno ≥ 2 px ou sombra, não é asserção sempre-verdadeira. Estado com dado: `escola-e-vinculos.spec.ts:269-297` percorre Contestar (Tab → Enter), motivo (Tab → Space, com `toBeChecked`), complemento, envio (Tab → Enter) e afirma o estado contestado com o código. Estado vazio: `:385`, `tabAte` até "Início".

**Correção 3 — divergência do seletor.** Confirmada e coerente. Registrada em `tasks/prd-identidade-e-tenancy/20_task.md:108-114`, com a linha da tabela corrigida (`:82`) e a subtarefa 20.1 reescrita (`:49`); a seção fica antes do comentário do hook e da seção "Revisões", como o hook exige. As duas pontas têm teste: `escola-e-vinculos.spec.ts:200` (conta da escola recebe `AVISO_DA_TROCA_RECUSADA`, e o corpo não contém `NAO_ENCONTRADO` nem `404` — regra 10, item 6) e `:165` (aluno sem `summary`, sem link de vínculos, com o nome da escola dele no cabeçalho).

Sem `.skip`, sem teste comentado, sem mock que esconda a regra auditada; os `page.route` seguram ou contam requisição, não substituem a regra. Carimbo `.processo/portao.json` com início `2026-09-20T07:34:42.166Z`, 4 s depois do restauro de `apps/web/src/sessao/inatividade.ts` (mtime 04:34:38 local) — e o carimbo grava o início da rodada, não o fim, então a ordem fecha; `conferir` responde válido para `typecheck, lint, test, e2e`.

```
VEREDITO: APROVADO
Cenários exigidos: (1) inatividade vencendo pelo valor configurado pela escola, com asserção antes e depois do limite; (2) `/vinculos` resolvido por teclado no estado com dado e no vazio, com foco visível; (3) troca de escola recusada em sessão que não é de e-mail, com o caminho explicado, e aluno sem seletor — ou divergência registrada.
Cobertos: todos os três. e2e/inatividade.spec.ts:54-102 (com e2e/__fixtures__/sessao.ts:173) · e2e/escola-e-vinculos.spec.ts:269-297 e :385 · e2e/escola-e-vinculos.spec.ts:165-180 e :200-219, com a divergência em tasks/prd-identidade-e-tenancy/20_task.md:108-114.
Bloqueantes: nenhum.
Recomendações:
- e2e/inatividade.spec.ts:180 — a inatividade do aluno é provada por sessão encerrada no servidor, não pelo relógio. Como `inatividade_aluno_min` nasce com 30 e o teste da equipe também usa 30, um bug que aplicasse o valor do aluno a todo mundo passaria nos dois. Na tarefa que mexer nisso (F2, tela de configuração), vale um caso de aluno com minutagem diferente da equipe.
- e2e/escola-e-vinculos.spec.ts:175 e :82 — o seletor é localizado por `page.locator('summary')`. Um nome acessível próprio (`getByRole('group', { name: 'Escola' })` ou equivalente) deixaria o teste do aluno preso ao componente, e não à tag; hoje, trocar `details` por outro elemento faria o teste do aluno passar por motivo errado.
- A janela do isolamento com a requisição segurada (`:149-162`) ficou como eu pedi; vale reaproveitar esse padrão nas próximas telas que trocam de escola, em vez de só afirmar ausência depois da resposta chegar.
```

## frontend-reviewer · 1ª rodada · APROVADO · 2026-09-20 04:51:14 · `tasks/prd-identidade-e-tenancy/20_task.md`

## VEREDITO: APROVADO

**Estados:** ok. `/vinculos` tem os quatro, com o vazio convidando (`apps/web/src/paginas/Vinculos.tsx:92-95`: "Fale com ela para ser alocado… as turmas aparecem aqui para você confirmar") e provados um a um no e2e (`e2e/escola-e-vinculos.spec.ts:345-399`). `/escolher-escola` tem lista, vazio que manda procurar a coordenação, erro e o "Entrando…" como carregando; a ausência de vazio em `Inicio.tsx` está justificada (o `/v1/eu` sempre traz pessoa e escola). Nenhum texto se desculpa.

**Feed de agentes:** não aplicável nesta tarefa — "Seu time" é F11 e `Inicio.tsx:30` só anuncia o que vem. Fica registrado para o PRD do F7/F11: quando a home do professor nascer, a regra 50 item 6 passa a valer na primeira tela.

**Seletor de escola:** no topo, no cabeçalho de toda tela autenticada (`apps/web/src/componentes/Cabecalho.tsx:51`), filtrando tudo abaixo de verdade: `trocarDeEscola` esvazia o cache **antes** de guardar o token novo (`apps/web/src/api/sessao.ts:619-624`) e o e2e prova que a turma de A não sobra em lugar nenhum, nem pelo histórico, nem na janela em que a lista de B está segurada (`e2e/escola-e-vinculos.spec.ts:150-162`). Com uma escola só, fica o nome — correto, e o aluno não vê seletor nenhum.

**Acessibilidade:** teclado com foco visível provado por `tabAte`/`focoVisivel` no caminho inteiro do cartão (contestar, rádio com barra de espaço, complemento, enviar); axe `wcag22aa` limpo em cada estado; rótulo em todo campo por `useId`; `fieldset`/`legend`; estado do vínculo em **texto**, não só em cor (`NOME_DO_ESTADO_DE_VINCULO`); `role="alert"` e `role="status"` separados. Duas lacunas ficam como recomendação (foco ao abrir a contestação; borda de campo a 2,56:1).

**Chromebook fraco:** os dois projetos rodam com CPU ×4 e rede limitada pelo CDP, e o `perfil` é obrigatório (`e2e/__fixtures__/perfis.ts:56`). Sem animação, sem fonte pesada, paleta em hex (Chrome 109 de laboratório continua enxergando tudo). Lista paginada por `useInfiniteQuery` — virtualização não se justifica em lista de vínculos de um professor. O relógio de inatividade não faz polling e só compara números no `pointermove`, com `passive: true`. Sem upload de imagem nesta tarefa.

**Celular:** ok. `larguraExcedente === 0` a 360 px medido em `/escolher-escola`, `/vinculos` nos quatro estados e com o diálogo de login aberto; alvo de 44 px conferido no "Confirmar" e no destino do seletor; `details`/`summary` abre por toque e por teclado, sem hover e sem atalho; `inputMode`/`autoComplete` certos no login por cima; viewport sem `maximum-scale`. Nenhum fluxo exige o celular.

**Ação oficial protegida:** sim para contestar — motivo obrigatório (a página confere de novo em `Vinculos.tsx:78`, e o e2e conta zero chamadas sem código), efeito mostrado antes de enviar (`EFEITO_DA_CONTESTACAO`), aviso de não escrever nome de aluno ao lado do campo, e clique repetido em confirmar faz uma chamada só.

**Bloqueantes:** nenhum.

**Recomendações:**

1. **Foco perdido ao abrir e ao fechar a contestação** — `apps/web/src/paginas/Vinculos.tsx:130` (o botão "Contestar" desmonta), `:121` (cancelar) e `:63` (sucesso). O foco cai no `body` e quem usa teclado ou leitor de tela recomeça do topo do documento, sem saber que o formulário abriu. Mover o foco para a `legend`/primeiro rádio ao abrir e devolvê-lo ao cartão ao fechar.
2. **Contraste de borda abaixo de 3:1 (WCAG 1.4.11)** — `border-slate-400` (#94a3b8) sobre branco dá 2,56:1, e é o único limite visível do `textarea` (`Vinculos.tsx:202`), dos campos do login por cima (`LoginPorCima.tsx:101` e `:117`), do `summary` do seletor (`SeletorDeEscola.tsx:73`) e dos botões secundários. O axe não tem regra automática para isso, então passou. É padrão herdado da 18.0/19.0 (`Campo.tsx`, `Entrar.tsx`), e por isso não bloqueia aqui: vale corrigir como token do sistema (`slate-500` #64748b dá 4,8:1) junto com a identidade visual.
3. **O seletor de escola nunca passa pelo axe nem pelo teclado no e2e** — nos testes de vínculos a professora tem uma escola só, e nos de troca o `violacoesGraves` não roda com o `details` presente/aberto. É o único componente novo do cabeçalho sem essa cobertura; acrescentar axe e um `tabAte` até o `summary` fecha a lacuna.
4. **Confirmar vínculo não diz o que confirmar provoca** — `Vinculos.tsx:125`. O cartão mostra turma e disciplina, o que atende ao pedido da tarefa, mas contestar explica o efeito e confirmar não, e é confirmar que abre acesso a turma e alunos. Uma linha ("Ao confirmar, você passa a ter acesso a esta turma e aos alunos dela") deixaria a ação simétrica.
5. **Uma decisão em andamento desabilita os botões de todos os cartões** — `Vinculos.tsx:69`. Em Fast 3G a professora com seis vínculos vê a tela inteira travar por segundos. Travar só o cartão em andamento (e manter a guarda de clique repetido por vínculo) resolveria sem afrouxar a regra.
6. **O login por cima cai no formulário de e-mail quando `quemEstaNaAba` não existe** — `apps/web/src/componentes/LoginPorCima.tsx:28`. Caso de borda estreito (o `/v1/eu` nunca respondeu e a sessão venceu), mas o aluno ficaria com um campo que ele não tem, e o "Entrar com outra conta" o levaria a `/entrar` em vez de `/e/:slug`.
7. **`/vinculos` não é restrita ao professor no roteador** — `apps/web/src/rotas.tsx:96`. A API protege e o link só aparece para professor, mas o aluno que digitar a URL cai numa tela que não é dele; um redirecionamento por papel seria mais honesto que um vazio.
8. **`larguraExcedente` não é medido com o seletor aberto e nome de escola longo** — o `break-words` está lá, mas "EEB Professora Maria da Glória Ribeiro Marcondes" no `summary` a 360 px é o caso que vale medir.

## tenancy-guardian · 1ª rodada · REPROVADO · 2026-09-20 04:53:23 · `tasks/prd-identidade-e-tenancy/20_task.md`

VEREDITO: REPROVADO

Tabelas verificadas: nenhuma migration nesta tarefa. `usuario`, `conta`, `escola`, `vinculo` (só leitura, já existentes); `vinculo` continua com `escolaId` + `anoLetivoId`.

Queries verificadas: `ResolucaoDeTenantRepository.acessosDaConta` (escopo pelo `contaId` do desafio já verificado, filtra `desativadoEm` e `papel != aluno`, devolve só `usuarioId`, `escolaNome`, `papel`); `usuariosAtivosDaConta` via `TrocaDeEscolaService.#destinoDaConta` (`apps/api/src/sessao/troca-de-escola.service.ts:59-64` — o `usuarioId` do cliente é só filtro dentro dos usuários da própria conta, nunca `escolaId` do corpo); `VinculoRepository` de `/v1/meus-vinculos` (`apps/api/src/estrutura/vinculo.repository.ts:188` — `exigirEscolaDoContexto()` + `exigirAnoEmCurso()`); nenhuma query nova. Nenhum endpoint aceita `escolaId` do corpo ou da query. Id é UUID (`esquemaAcessoDaConta`). `@SemEscopo` só teve a justificativa reescrita, e continua contido pelo teste de arquitetura.

Teste de isolamento: presente e efetivo no caminho professor→professor (`e2e/escola-e-vinculos.spec.ts:117-170`: segura a lista de B com `page.route` e afirma a ausência da turma de A na janela em que ela apareceria) — mas não cobre o caminho em que o defeito abaixo está.

Bloqueantes:

- `apps/web/src/main.tsx:24-26` (com `apps/web/src/api/sessao.ts:619-624` e `:246`) — a troca de `clear()` por `resetQueries()` faz o cache **voltar a ser preenchido com dado da escola de origem** quando o destino é a coordenação. `resetQueries()` não só esvazia: ele refaz na hora as consultas ativas (`node_modules/@tanstack/query-core/build/modern/queryClient.js:113-126`, `refetchQueries({type:'active'})`, com a `queryFn` chamada de forma síncrona). Em `trocarDeEscola`, `limparDadosDaEscola()` roda com o token da escola A ainda em memória; quando a API responde `mfa`/`configurar_mfa`, a sessão de origem **não** é encerrada (`troca-de-escola.service.ts:75-82`), então esse refetch sai com o token de A e **funciona**, regravando `/v1/eu` (e `meus-vinculos`, se a troca partiu de `/vinculos`) com dado de A. Depois do código do segundo fator, `guardarToken` não limpa nada e `voltouAValer` é `false` (o estado nunca saiu de `aberta`, `sessao.ts:246`), logo o `invalidateQueries` do `aoAbrirSessao` também não roda; com `staleTime: 30_000` (`api/cliente-de-consultas.ts`), o `Cabecalho` que monta já na escola B renderiza o nome da escola A, o papel de A e o `inatividadeMin` de A, sem refetch, e "Meus vínculos" mostra a turma de A. Reproduzido com o `QueryClient` real: depois do reset, `queryFn` é chamada com o token antigo, o cache volta a `{"escola":"Escola A"}` e o observador montado depois lê `"Escola A"` sem refazer a busca. No caminho `pronta` o defeito fica mascarado só porque a sessão de origem já foi encerrada e o 401 força a repetição com o token novo — a regra não pode depender disso.
  **Correção exigida:** esvaziar o cache sem disparar busca com a credencial da escola anterior (p. ex. `clear()`/`removeQueries()` e mandar as telas buscarem de novo pelo `aoAbrirSessao`), e garantir a limpeza também no momento em que o token do destino entra depois do segundo fator (a troca que passa por `mfa`/`configurar_mfa`), com teste que falharia sem ela: professora em A com `/vinculos` carregado troca para a escola onde coordena, conclui o segundo fator e nem o nome da escola A nem a turma de A aparecem no DOM.

Recomendações:

- `apps/web/src/main.tsx:24-26`: `clear()` também esvaziava o cache de mutações; `resetQueries()` não. Os resultados de `confirmarVinculo`/`contestarVinculo` (com `variables` e o vínculo devolvido) ficam em memória até o `gcTime`. Limpar o `MutationCache` junto no fim de sessão e na troca.
- `e2e/escola-e-vinculos.spec.ts:176-190`: o teste da troca para coordenação para em `/mfa/configurar` e nunca conclui a entrada em B. Estender o cenário de isolamento a esse caminho, que é o que hoje não é provado.
- `apps/api/src/sessao/conclusao-de-login.ts:52`: a etapa `escolher` passa a devolver nome de escola antes de qualquer sessão. Está justificado e restrito à conta que provou a senha (e o MFA, quando há), mas vale registrar na Tech Spec, seção 7, que a lista de nomes de escola agora sai também sem sessão.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-20 04:53:51 · `tasks/prd-identidade-e-tenancy/20_task.md`

## VEREDITO: REPROVADO

**Escopo:** respeitado — nada de F2/F6/F7 entrou; a mudança na API (`escolher` levando `acessos`) é consequência direta da tela e está registrada.
**Aderência à Tech Spec:** divergência não registrada em `apps/web/src/main.tsx:24-26` — a subtarefa 20.1 e a tabela de testes pedem `queryClient.clear()` na troca; foi implementado `resetQueries()`, que **refaz** as consultas em vez de só esvaziá-las. Isso não é detalhe de estilo: é a causa do bloqueante 1. As divergências 1 e 2 do `20_task.md` estão registradas e são defensáveis.
**Portão local:** carimbo válido (`portão local válido para o código atual (typecheck, lint, test, e2e)`).

## Bloqueantes

**1. `apps/web/src/main.tsx:24-26` + `apps/web/src/api/sessao.ts:619-624` e `:243-258` — a troca de escola com destino na coordenação deixa o dado da escola de origem no cache e o mostra dentro da sessão da escola de destino.**

Sequência real, com o código como está:

1. `trocarDeEscola` responde `{ etapa: 'mfa' | 'configurar_mfa' }`. A sessão de origem **continua viva** (Tech Spec, seção 5, "Troca de escola"), e o token de A continua em memória — o próprio teste `apps/web/src/api/etapas-do-login.test.ts` ("a troca para a coordenação para no segundo fator") fixa isso: `tokenDeAcesso() === 'token-1'`.
2. `limparDadosDaEscola()` chama `clienteConsultas.resetQueries()`. Em `@tanstack/query-core@5.102.8` (`queryClient.js:113-126`), `resetQueries` faz `query.reset()` **e** `refetchQueries({ type: 'active' })`. O observador de `consultaEu` do `Cabecalho` está ativo, então a busca sai **com o token de A**, que é válido, e o cache volta a ser preenchido com `/v1/eu` da escola A (e com `/v1/meus-vinculos` de A, se a professora estava em `/vinculos`).
3. Segundo fator aceito → `guardarToken`. Como `estado` nunca saiu de `'aberta'` nesse caminho, `voltouAValer` é `false` (`sessao.ts:246`) e **os ouvintes de `aoAbrirSessao` não rodam**: não há `invalidateQueries()`.
4. `navegar('/')` é navegação SPA. `Inicio` e `Cabecalho` montam, `consultaEu` devolve o dado de A do cache e, com `staleTime: 30_000` (`api/cliente-de-consultas.ts:25`) e o dado recém-buscado, **não há nem refetch**: a coordenadora entra em B e a tela diz "Você está em \<Colégio A\> como professor", com o seletor rotulado com A, até o dado envelhecer. Em `/vinculos` o mesmo caminho pinta a turma de A dentro de B.

É exatamente o que a linha de isolamento da tabela de testes proíbe ("o nome da turma de A não aparece em nenhum lugar do DOM") e o que a regra 10, item 1 trata como inegociável. O e2e `e2e/escola-e-vinculos.spec.ts:182-198` para na tela do segundo fator e não volta à área autenticada, por isso o furo passou.

**Correção exigida:** na troca, tirar o dado do cliente sem refazer busca alguma enquanto o token da escola de origem ainda está em memória (`clear()`/`removeQueries()`, como a subtarefa pedia), e garantir que a sessão que passa a valer depois do segundo fator force nova busca (hoje `guardarToken` só avisa `aoAbrir` quando o estado não era `'aberta'`). Se `resetQueries` for mantido no fim de sessão por causa da tela montada atrás do diálogo, então a troca precisa de um caminho próprio, diferente do fim de sessão. O e2e da troca com destino na coordenação precisa ir até depois do segundo fator e afirmar que nem o nome da escola A, nem a turma de A, aparecem.

**2. `apps/web/src/api/sessao.ts:283-312` — `descartarSessaoVencida()` é um no-op: "Entrar com outra conta" não descarta nada.**

`encerrarLocalmente` começa com `if (token === undefined && (estado === 'anonima' || estado === 'vencida')) return`. Depois de `vencerSessao()`, `token` é sempre `undefined` e `estado` é `'vencida'` — não existe estado `'vencida'` com token, porque `guardarToken` sempre põe `'aberta'`. Logo, `descartarSessaoVencida()` → `esquecerSessao()` → retorno imediato: o estado continua `'vencida'` e `quemEstaNaAba` continua guardado. O comentário do próprio `encerrarLocalmente` ("uma sessão já `vencida` nunca é rebaixada para `anonima`") contradiz a função declarada logo abaixo.

Efeito na tela (`apps/web/src/componentes/LoginPorCima.tsx:62-66`): quem sentou no Chromebook e clicou em "Entrar com outra conta" vai para `/entrar`, mas basta o Voltar do navegador para `Protegida` (`rotas.tsx:37-43`) ver `'vencida'` de novo e remontar a tela da pessoa anterior com o diálogo por cima, em vez de redirecionar para a entrada. Nenhum teste exercita esse botão.

**Correção exigida:** decidir qual das duas regras vale e deixar uma só. Se o descarte deve existir, a guarda de idempotência precisa permitir `'vencida' → 'anonima'` (continuando a barrar o encerramento repetido) e limpar `quemEstaNaAba`; com teste que prove que depois do descarte o estado é `'anonima'` e que o Voltar cai na entrada.

**3. `apps/web/src/sessao/inatividade.ts:29-75` com `apps/web/src/api/sessao.ts:641-650` — a aba esquecida encerra a sessão da aba em que a pessoa está trabalhando.**

O relógio escuta `pointerdown`/`pointermove`/`keydown` no `window` **daquela aba**, e ao vencer chama `encerrarPorInatividade()`, que faz `DELETE /v1/sessao`. Duas abas do produto compartilham a mesma sessão e o mesmo `ultimo_uso_em`: com a professora trabalhando na aba B, a aba A vence pelo relógio local e apaga no servidor uma sessão que o servidor considera ativa. A aba B recebe `NAO_AUTENTICADO` na requisição seguinte e cai no login por cima no meio da aula. A renovação já resolveu o problema de coordenação entre abas com Web Locks (`sessao.ts:360-363`), e aqui nada equivalente existe; a Tech Spec, seção 12, trata a inatividade do **servidor** como a garantia, e o servidor não teria encerrado essa sessão.

**Correção exigida:** a interação de qualquer aba precisa contar para o relógio de todas (por exemplo `BroadcastChannel`, que não guarda nada sensível), ou o encerramento por inatividade precisa deixar de derrubar a sessão no servidor quando outra aba está em uso. Com teste do caso de duas abas.

## Recomendações

- `apps/web/src/componentes/LoginPorCima.tsx:47-66`: quem entrou pela conta Google da escola recebe formulário de e-mail e senha (pode não ter senha nenhuma) e o "Entrar com outra conta" leva a `/entrar`, e não a `/e/${anterior.escolaSlug}`, que está em memória e é onde o botão do provedor está. Mesma lacuna que o `test-engineer` apontou em `AVISO_DA_TROCA_RECUSADA`.
- `tasks/prd-identidade-e-tenancy/techspec.md` seção 4 (tabela de rotas) e seção 5 ("Etapas") continuam dizendo que o login devolve `{ etapa, desafio? }`. As decisões tomadas dentro de tarefa neste repositório foram dobradas na Tech Spec (11.0, 16.5, 17.5); a da 20.0 muda um contrato de API que as próximas tarefas vão ler ali.
- `apps/web/src/rotas.tsx:96-100`: `/vinculos` digitado na URL por coordenação ou aluno cai no estado de erro genérico. Não é furo de permissão (o servidor recusa), mas a tela não diz que aquilo não é dela.

## test-engineer · 3ª rodada · APROVADO · 2026-09-20 05:21:33 · `tasks/prd-identidade-e-tenancy/20_task.md`

VEREDITO: APROVADO

**Escopo da rodada:** só o diff desde a minha 2ª rodada (`apps/web/src/api/sessao.ts`, `main.tsx`, `sessao/inatividade.ts`, `api/sessao.test.ts`, `api/etapas-do-login.test.ts`, `e2e/escola-e-vinculos.spec.ts`, `e2e/inatividade.spec.ts`) e o que ele afeta. Não reauditei o que não mudou.

Cenários exigidos (pelas três correções): limpeza do cache só depois de o token de destino entrar · limpeza também no caminho que passa pelo segundo fator · nenhuma limpeza na rotação de rotina · troca recusada não limpa nem derruba a sessão · `descartarSessaoVencida` leva a `anonima` e o Voltar não remonta a tela anterior · duas abas dividindo uma sessão, com a esquecida não encerrando a de quem trabalha.

Cobertos, e com asserção que falharia sem a regra:
- `apps/web/src/api/etapas-do-login.test.ts:275` — `expect(limpezas).toEqual(['token-da-escola-b'])`. É a asserção certa: ela lê o token **no momento** da limpeza, então falha tanto se a limpeza voltar a acontecer antes (`'token-1'`) quanto se sumir (`[]`). Prova direta do bloqueante 1.
- `etapas-do-login.test.ts:291` — caminho `mfa`: `limpezas === 0` com `token-1` ainda valendo, e `limpezas === 1` com `token-da-escola-b` depois do código aceito. `:312` cobre a troca recusada.
- `apps/web/src/api/sessao.test.ts:584` — a rotação de rotina não dispara limpeza (falharia se `guardarToken` limpasse sempre); `:557` mantém os três fins de sessão com o estado em que a limpeza acontece.
- `etapas-do-login.test.ts:373` + `e2e/inatividade.spec.ts:140` — descarte da sessão vencida (`anonima`, `quemEstaNaSessao()` vazio) e o Voltar caindo em `/entrar` sem o rascunho nem o nome da anterior.
- `e2e/escola-e-vinculos.spec.ts:185` — isolamento pelo segundo fator ponta a ponta, com prova positiva (chega à área de B) e negativa (turma, nome e escola de A ausentes do `body`).
- `e2e/inatividade.spec.ts:173` — concorrência de verdade: duas abas reais, a mensagem do `BroadcastChannel` esperada por `poll` antes de avançar o relógio (não é `sleep` disfarçado), e prova positiva de que a aba em uso ainda alcança a API. Mutação relatada (esvaziar `aoOuvirOutraAba`) bate com o que o teste mede.

Sem `.skip`, sem teste comentado, sem `any`, sem mock que esconda a regra (o `BroadcastChannel` do teste só escuta; o app não é stubado). Nenhuma chamada a provedor pago. Unidades verdes aqui (57), portão com carimbo válido para o código atual.

Bloqueantes: nenhum.

Recomendações:
1. `apps/web/src/api/sessao.ts:299` — a guarda passou a ser `token === undefined && estado === destino`, o que abre a transição `anonima → vencida`, que a guarda anterior barrava. Caminho concreto: `encerrarPorInatividade()` em voo (o `DELETE` tem repetição de 1 s) enquanto o "Sair" já rodou `esquecerSessao()`; o `finally` chama `vencerSessao()` e o estado volta a `vencida` depois de a pessoa ter saído. Hoje o estrago é pequeno (a navegação usa `replace`, o cache já saiu e `quemEstaNaAba` está vazio), mas a guarda ficaria correta como `if (estado === destino || (estado === 'anonima' && destino === 'vencida')) return`, com teste da direção.
2. `apps/web/src/api/sessao.test.ts:600` ("encerrar de novo não reinicia a limpeza") não exercita a guarda que nomeia: depois do `sair()`, `chamarComSessao` sai pelo retorno antecipado de `sessao.ts:449` (`estado === 'anonima'`) e nunca chega a `encerrarLocalmente`. O teste passaria com a guarda apagada. Para provar idempotência, o segundo encerramento precisa vir do caminho que a guarda protege (dois `NAO_AUTENTICADO` a partir de `aberta`).
3. `apps/web/src/sessao/inatividade.ts:81` — o teto de uma difusão por minuto não tem teste: difundir a cada `pointermove` passaria em tudo, e é justamente o custo que o Chromebook fraco não paga. Contar mensagens no canal durante uma sequência de movimentos fecharia a lacuna.
4. Falta o outro lado do caminho do segundo fator, que é o que justifica não limpar nada ali: desistir do código e voltar para a escola de origem com a tela e a lista de A intactas. Hoje isso só é afirmado no módulo (`etapas-do-login.test.ts:291`), não na tela.
5. Segue aberta a recomendação do `tenancy-guardian` sobre o `MutationCache`: `resetQueries()` não o esvazia, então o resultado de `confirmarVinculo`/`contestarVinculo` da escola A (com `variables` e o vínculo devolvido) sobrevive à troca até o `gcTime`. Nenhum teste cobre.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-09-20 05:24:55 · `tasks/prd-identidade-e-tenancy/20_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma — o diff desta rodada não toca migration, schema nem repository. `apps/api/src/sessao/*` não mudou desde a rodada aprovada.

Queries verificadas: nenhuma query nova. O único caminho em que o cliente manda identificador que decide escopo continua sendo `POST /v1/sessao/escola` com `usuarioId` no corpo, filtrado por `contaId` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:119,133` e com a escola lida do usuário resolvido em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/conclusao-de-login.ts:139` — inalterado e já auditado.

Teste de isolamento: presente e efetivo. `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/etapas-do-login.test.ts:275-289` lê o token de dentro do ouvinte e exige `['token-da-escola-b']`: quebra se a limpeza voltar a rodar antes de o token do destino entrar (viria `'token-1'`) e quebra se ela sumir (viria `[]`). `:291-310` prova que a troca parada no segundo fator não esvazia nada e que o código aceito esvazia. `:312-324` prova que a troca recusada não derruba a sessão de origem.

Correção exigida na 1ª rodada: feita. `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.ts:253-278` move a limpeza para depois de `token = resposta.token`, condicionada a `sessaoNova`, e `guardarEtapa` (`:495-501`) marca `sessaoNova` em toda etapa `pronta` — inclusive a que vem do segundo fator, que é o caminho em que o token da escola de origem ainda valia. `trocarDeEscola` (`:636-641`) não limpa mais por conta própria.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/sessao/inatividade.ts:66,96-98`: o aviso entre abas não carrega identidade de sessão, e `aoOuvirOutraAba` adia o vencimento de qualquer aba da origem. Uma aba órfã — a que ficou na escola de origem depois da troca feita em outra aba, ou a da pessoa anterior no Chromebook — deixa de vencer sozinha enquanto houver alguém mexendo na aba em uso. Carregar `usuarioId`/`escolaSlug` de `quemEstaNaSessao()` na mensagem e ignorar o que vier de outra sessão fecha isso sem perder o que a 20.0 corrigiu.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.ts:253-269` + `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/Cabecalho.tsx:29-34`: a renovação de rotina nunca compara a escola do `/v1/eu` com `quemEstaNaAba`. Na aba que ficou para trás, o token vence, a renovação usa o cookie que já é o da escola de destino e a aba passa a consultar com a credencial nova mantendo o cache da escola anterior na tela. Hoje é a mesma pessoa, com vínculo nas duas, e por isso não bloqueia — mas comparar `escolaSlug`/`usuarioId` no `lembrarQuemEsta` e chamar a mesma limpeza quando mudam custa pouco e cobre o caso antes de ele virar tela com duas escolas misturadas.
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/escola-e-vinculos.spec.ts:217-222`: o e2e novo afirma a ausência da turma de origem já em `/`, com a tela de vínculos desmontada — passaria mesmo sem limpeza nenhuma. A prova forte continua sendo o teste de unidade e o cenário de `:152-165`, com a rota segurada; repetir aquele padrão aqui (voltar a "Meus vínculos" em B com `ROTA_MEUS_VINCULOS` presa) tornaria este e2e efetivo.
- Registrada e não aplicada, como na 1ª rodada: o `MutationCache` não é esvaziado junto com o `QueryCache` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/main.tsx:26-28`. Sem mutação com dado de escola hoje, não bloqueia; vira bloqueante na primeira tela que escreva.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-20 05:26:25 · `tasks/prd-identidade-e-tenancy/20_task.md`

Auditei só o diff desde a minha 1ª rodada (`api/sessao.ts`, `main.tsx`, `sessao/inatividade.ts`, os dois testes de unidade da web e os dois specs e2e) e o que ele afeta. Não reauditei o que não mudou.

**Correções exigidas por outros revisores — conferidas do ponto de vista de vazamento**

1. **Ordem da limpeza do cache.** `apps/web/src/api/sessao.ts:253-269`: `guardarToken` grava token, `expiraEm` e estado **antes** de chamar `limparDadosDaEscola()`, e só com `sessaoNova`. O refetch que o `resetQueries` dispara sai com a credencial do destino, nunca com a da escola de origem. O caminho que passa pelo segundo fator (`guardarEtapa` → `'pronta'` → `guardarToken(resposta, true)`, linha 498) limpa no momento certo, e a troca que para em `mfa`/`configurar_mfa` não limpa nada — correto, porque a pessoa continua na escola de origem. `etapas-do-login.test.ts:275` lê o token **no instante** da limpeza (`toEqual(['token-da-escola-b'])`), então morre tanto se a limpeza voltar a ser antes quanto se sumir; o e2e `escola-e-vinculos.spec.ts:183-222` fecha ponta a ponta, com prova positiva (chega à área de B) e negativa (turma, nome e escola de A ausentes do `body`). Regra 10, item 1 e regra 20, itens 4 e 5: ok.
2. **"Entrar com outra conta".** `sessao.ts:295-327`: a guarda passou a ser por destino, `'vencida' → 'anonima'` é permitida, `quemEstaNaAba` e `usuarioAntesDeVencer` são apagados e o cache é esvaziado. Como o estado vira `anonima`, `renovarSessao` (linha 409) recusa: o cookie não ressuscita a sessão da pessoa anterior. Provado em `etapas-do-login.test.ts:373-381` e no e2e `inatividade.spec.ts:140-168` (Voltar cai em `/entrar`, sem o rascunho nem o nome da anterior).
3. **`BroadcastChannel` entre abas.** `sessao/inatividade.ts:66,83,96-98`: a mensagem é o literal `'interacao'` — sem id, sem nome, sem escola, sem token; o canal é de mesma origem; a aba que recebe só move `ultimaInteracao` e não chama a API (nenhuma escrita extra em `ultimo_uso_em`). O canal só existe enquanto `ativa === 'aberta'` (`Cabecalho.tsx:36`), então aba vencida não difunde nem escuta. Nada de dado pessoal trafega, e o `DELETE /v1/sessao` deixa de derrubar a aba em uso.

**Resto do checklist no diff:** nenhum campo pessoal novo (o que a aba guarda continua sendo `usuarioId` opaco, `papel` e `escolaSlug`, tudo em memória de módulo — já auditado e já na tabela de `docs/lgpd.md`); nenhum `console`/logger nos arquivos tocados; nenhum DTO novo; nenhuma exportação, storage, convite ou envio a provedor de IA; fixtures e dados de teste sintéticos (`camila@escola.test`, "Professora sintética na outra escola", UUIDs `0190f5a0-…`); erro continua tipado, sem stack trace.

```
VEREDITO: APROVADO
Campos pessoais tocados: nenhum novo. Em memória da aba, inalterados desde a 1ª rodada: usuarioId (opaco), papel, escolaSlug; e o usuarioId de quem estava antes de a sessão vencer. Nada persistido, nada em localStorage/URL.
Fora da tabela de dados do docs/lgpd.md: nada
Autorização por objeto: ok — o diff não cria rota; a troca continua mandando só usuarioId da própria conta, e o escopo vem do token
Logs: limpos — nenhum log novo, e o BroadcastChannel carrega só o literal 'interacao'
Auditoria: presente onde a regra exige neste diff (nenhuma leitura de dado de aluno por coordenação/rede, exportação, nota, permissão ou saída de IA)
Envio externo: nenhum
Seed/fixture: sintético
Bloqueantes: nenhum
Recomendações:
- apps/web/src/sessao/inatividade.ts:66,96-98 — o canal não é escopado por sessão: qualquer aba da origem adia o relógio de qualquer outra, inclusive de uma aba cuja sessão é de outra pessoa (alguém entra numa segunda aba do mesmo Chromebook). A aba esquecida então nunca chega a `encerrarPorInatividade`, e a tela já pintada da pessoa anterior (nome, escola, vínculos) fica à vista enquanto a outra aba é usada. Não bloqueia: a inatividade do servidor continua sendo a garantia (Tech Spec, seção 12) e a sessão esquecida não é mantida viva lá, porque a aba que recebe não chama a API. Fecharia com um nonce opaco por sessão, gerado em `guardarToken`, enviado junto do `'interacao'` e comparado em `aoOuvirOutraAba`.
- apps/web/src/main.tsx:26-28 — segue aberta a recomendação do tenancy-guardian: `resetQueries()` não esvazia o `MutationCache`. O resultado de `contestarVinculo` (o complemento escrito, com `variables`, e o vínculo de A) sobrevive à troca e ao fim de sessão até o `gcTime`. Não é alcançável pela tela hoje, mas é dado da escola anterior em memória da aba seguinte.
- apps/web/src/api/sessao.ts:342-347 — `lembrarQuemEsta` só acusa "outra pessoa" quando a sessão passou por `vencida`. A renovação pelo cookie que cai na sessão de outra pessoa (segunda aba que trocou o cookie) não descarta nada: valeria comparar o `usuarioId` de todo `/v1/eu` com o de `quemEstaNaAba`, e não só com `usuarioAntesDeVencer`.
- As três recomendações da minha 1ª rodada continuam válidas e registradas para o /validar e o /retro (segundo fator antes do `escolher`, exaustividade da união de etapas, janela curta do estado local antes da navegação).
```

Arquivos auditados nesta rodada: `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/main.tsx`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/sessao/inatividade.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/etapas-do-login.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/e2e/escola-e-vinculos.spec.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/e2e/inatividade.spec.ts`.

## revisor-geral · 2ª rodada · REPROVADO · 2026-09-20 05:28:04 · `tasks/prd-identidade-e-tenancy/20_task.md`

## VEREDITO: REPROVADO

**Escopo:** respeitado. Nada de F2/F6/F7 entrou; a deleção de `EmConstrucao.tsx` é o fim da vida útil declarada dela; a mudança na API (`escolher` levando `acessos`) segue registrada e todo caminho que produz `escolher` passa por `ConclusaoDeLogin.concluir`, então o contrato novo não tem produtor que o descumpra.

**Aderência à Tech Spec:** divergência ainda não registrada na troca de escola (bloqueante 2). As correções 1 e 3 estão coerentes com a seção 5 ("Troca de escola": a origem só cai quando o código é aceito) e com a seção 12 (inatividade do servidor como garantia).

**Portão local:** carimbo válido — `portão local válido para o código atual (typecheck, lint, test, e2e)`.

### As três correções exigidas

1. **Feita.** `apps/web/src/api/sessao.ts:253-278` — `limparDadosDaEscola()` só roda com o token novo já em `token`, e `trocarDeEscola` não limpa mais nada por conta própria. O caminho do segundo fator foi conferido ponta a ponta: `trocarDeEscola` → `mfa` não esvazia nada (a origem ainda serve), e quem esvazia é o `guardarToken(resposta, true)` de `guardarEtapa` quando o código é aceito. O e2e `e2e/escola-e-vinculos.spec.ts:185-223` vai até depois do código e afirma a ausência de `emA.escolaNome` no `main`, da turma e do nome de A.
2. **Feita, com um furo novo** — bloqueante 1 abaixo. `descartarSessaoVencida()` passa a levar a sessão a `anonima`, e o e2e `e2e/inatividade.spec.ts:140-171` prova o Voltar.
3. **Feita.** Conferi a janela de deriva: como `aoInteragir` difunde na **primeira** interação depois de 60 s de silêncio (`inatividade.ts:81-84`), a aba esquecida só pode vencer se não houve interação em lugar nenhum durante quase toda a janela — caso em que a aba em uso também vence. O `DELETE` da aba esquecida não alcança mais a aba em uso, e o e2e `e2e/inatividade.spec.ts:173-214` espera a entrega da mensagem antes de avançar o relógio e prova pelo lado positivo (a aba em uso continua alcançando a API).

## Bloqueantes

**1. `apps/web/src/api/sessao.ts:299` — depois do "Sair", um pedido atrasado devolve a aba ao estado `vencida`, e o Voltar remonta a área autenticada com o diálogo por cima em vez de levar à entrada.**

A guarda passou de `token === undefined && (estado === 'anonima' || estado === 'vencida')` para `token === undefined && estado === destino`. Isso libera a transição que a correção 2 precisava (`vencida → anonima`), mas libera junto a inversa, `anonima → vencida`, que o código anterior barrava. Caminho concreto, sem corrida improvável:

1. A professora está em `/vinculos` com um `GET /v1/meus-vinculos` em voo (recarga depois de confirmar, `Vinculos.tsx:53-55`) e clica em "Sair".
2. `sair()` → `encerrarNaApi()` mata a sessão no servidor → `finally { esquecerSessao() }` deixa `estado = 'anonima'` e `token = undefined`.
3. O `GET` em voo volta 401. Em `chamarComSessao`, `renovarComTokenVencido(usado)` sai na hora pela linha 478 (`usado !== token`), e a linha 459 **reenvia a requisição com `token: undefined`** — uma chamada sem `Authorization` depois da saída. Ela recebe 401 e cai em `vencerSessao()` (`:462`).
4. `encerrarLocalmente('vencida')`: `token` é `undefined`, mas `estado` é `'anonima'` ≠ `'vencida'`, então passa. A aba termina em `vencida`.

Efeito: `rotas.tsx:37-43` volta a renderizar `children` + `LoginPorCima` quando a pessoa seguinte aperta Voltar, em vez do `Redirect` para `/entrar` que a RF13 e o e2e `e2e/entrar.spec.ts:426` garantem. O cache já foi esvaziado, então não há dado de A na tela, mas o diálogo aparece sem `quemEstaNaSessao()` e oferece o formulário de e-mail mesmo quando quem saiu era aluno (`LoginPorCima.tsx:28`). Nenhum teste cobre a saída com requisição em voo.

**Correção exigida:** barrar explicitamente `anonima → vencida` (a saída pedida pela pessoa é final; só `aberta` pode vencer), com teste de unidade que faça o "Sair" com uma chamada em voo e afirme que o estado continua `anonima`. Conferir de passagem se a repetição da linha 459 deve mesmo sair com `token` indefinido depois de a sessão ter sido esquecida.

**2. `apps/web/src/api/sessao.ts:291-293` — o docblock de `encerrarLocalmente` afirma o contrário do que o código faz, a duas linhas do comentário que afirma o certo.**

O docblock diz "Uma sessão já `vencida` nunca é rebaixada para `anonima` por um pedido atrasado, senão o diálogo sumiria levando a tela junto", e o comentário de `:296-298` diz "a sessão vencida **precisa** poder virar anônima". Como a regra do módulo mora no comentário neste repositório, o próximo a ler tem duas regras opostas no mesmo bloco e nenhuma pista de qual vale.

**Correção exigida:** apagar a frase do docblock e deixar uma regra só, a do código.

**3. `tasks/prd-identidade-e-tenancy/20_task.md:47` e `:81` — a tarefa continua dizendo `queryClient.clear()` **antes** de guardar o token novo, e o que existe é `resetQueries()` **depois**.**

A inversão foi exigida na revisão, mas o documento da tarefa não foi atualizado e a seção "Divergências resolvidas nesta tarefa" não a menciona — ao contrário do que foi feito com o `acessos` e com o seletor. Quem ler a tarefa depois do commit recebe a descrição do comportamento que justamente causou o bloqueante 1 da rodada anterior.

**Correção exigida:** registrar a divergência na seção "Divergências resolvidas nesta tarefa" e corrigir a subtarefa 20.1 e a linha da tabela de testes, como foi feito com a divergência 2.

## Recomendações

- `apps/web/src/sessao/inatividade.ts:19` — o `BroadcastChannel` é por origem, não por sessão. Duas abas com pessoas diferentes (a anterior esqueceu a aba aberta, a seguinte entrou numa aba nova) passam a adiar o vencimento uma da outra, e a aba da pessoa anterior deixa de vencer enquanto a seguinte trabalha. Não é vazamento novo (a aba já estava na tela), mas some com a única defesa automática daquela tela. Amarrar o nome do canal ao `usuarioId` de `quemEstaNaSessao()` fecha isso sem custo.
- `apps/web/src/componentes/SeletorDeEscola.tsx:72-92` — o `details` continua aberto depois da troca, agora listando a escola de onde a pessoa veio. Fechá-lo no sucesso deixa o cabeçalho coerente com onde ela está.
- `tasks/prd-identidade-e-tenancy/techspec.md:427-428` — a seção 9 nomeia `queryClient.clear()` como o mecanismo da troca. Quando a decisão de spec registrada nos achados for aplicada, essa linha e a tabela de rotas da seção 4 precisam ir junto.

## test-engineer · 4ª rodada · REPROVADO · 2026-09-20 05:45:27 · `tasks/prd-identidade-e-tenancy/20_task.md`

VEREDITO: REPROVADO

Auditei só o diff desde a minha 3ª rodada (`apps/web/src/api/sessao.ts`, `apps/web/src/api/sessao.test.ts`, os dois comentários e o arquivo da tarefa) e o que ele afeta.

**Cenários exigidos nesta rodada** (os das correções do `revisor-geral`, mais os que as mudanças de produção abrem):
1. "Sair" e, depois dele, um `NAO_AUTENTICADO` de pedido que ainda estava no ar → a aba fica `anonima`, e o pedido não é repetido sem credencial.
2. A transição barrada em si (`anonima → vencida` não acontece), pelo caminho que continua vivo depois da correção 1: duas terminações de sessão concorrentes — "Sair" da pessoa e inatividade vencida ao mesmo tempo (regra 80, item 7).
3. `aberta → vencida` continua valendo (o 401 que persiste depois da renovação).
4. `vencida → anonima` continua valendo ("Entrar com outra conta", e o Voltar do navegador levando à entrada).
5. Comentários e arquivo de tarefa descrevendo a ordem real da limpeza do cache.

**Cobertos:** 1 (`apps/web/src/api/sessao.test.ts:582-598`, com a consulta saindo antes do clique e voltando recusada depois — teste de corrida de verdade, e ele falha se a checagem de `durante` sair); 3 (`sessao.test.ts:265-278` e a lista de limpezas em `:581`); 4 (`apps/web/src/api/etapas-do-login.test.ts:373` e `e2e/inatividade.spec.ts:140-171`, inclusive o `goBack`); 5 (`SeletorDeEscola.tsx:30-34`, `e2e/escola-e-vinculos.spec.ts:143` e `:209`, e o item 3 das "Divergências" em `tasks/prd-identidade-e-tenancy/20_task.md` — conferem com o código).

**Bloqueantes**

- `apps/web/src/api/sessao.ts:301` — a guarda `if (destino === 'vencida' && estado !== 'aberta') return` entrou sem teste que a prove. Apague essa linha e **nenhum teste fica vermelho**, inclusive o que foi escrito para ela: em `sessao.test.ts:582` a chamada em voo nunca chega a `vencerSessao()`, porque a outra metade da correção (`sessao.ts:464-465`, `const durante = estadoDaSessao()` … `throw erro`) curto-circuita antes. O teste prova a não repetição do pedido, não a guarda.
  Varri todos os caminhos que chamam `vencerSessao()` com a sessão fora de `aberta`: `chamarComSessao` (`:471`) só o alcança com o estado já em `aberta` depois da renovação, e `renovarComTokenVencido` (`:491`) cai na idempotência por destino (`:303`) — os dois dão o mesmo resultado com e sem a guarda. Sobra **um** caminho vivo, que é justamente o que motiva a linha: `encerrarPorInatividade` (`:667-676`), cujo `finally { vencerSessao() }` roda depois de `sair()` ter deixado a aba `anonima`, quando o relógio de inatividade vence enquanto o `DELETE` do "Sair" está no ar (fim de aula, rede da escola oscilando, com a repetição de 1 s de `encerrarNaApi`). Sem a guarda, a aba termina `vencida` — exatamente o defeito que o `revisor-geral` descreveu (Voltar remonta a área autenticada da pessoa anterior com o diálogo por cima, no Chromebook do carrinho).
  **Correção exigida:** um teste de concorrência real em `apps/web/src/api/sessao.test.ts` com `sair()` e `encerrarPorInatividade()` disparados sem `await` entre eles, com a ordem forçada para a inatividade terminar por último (por exemplo, o `DELETE` dela caindo em 5xx e entrando na repetição de `ESPERA_ENTRE_TENTATIVAS_DE_SAIDA_MS`, com temporizador falso), afirmando `estadoDaSessao() === 'anonima'` ao fim. Ele precisa ficar vermelho com a linha `:301` removida — é o que torna a guarda uma regra provada, e não uma linha que o próximo refactor apaga sem ninguém perceber. Hoje `encerrarPorInatividade` não aparece em nenhum teste de unidade (`grep` em `apps/web/**/*.test.ts`): a única cobertura dela é pela interface, no e2e, e lá a corrida com o "Sair" não acontece.

**Recomendações**

- `apps/web/src/api/sessao.test.ts:582` — o título ("o 401 de um pedido que ainda estava no ar não devolve a aba ao estado vencido") promete a guarda e entrega a não repetição. Renomeie para o que ele prova ("o pedido que volta recusado depois do 'Sair' não é repetido sem credencial, e a aba continua anônima"), para o teste da guarda não nascer parecendo duplicata.
- `apps/web/src/api/sessao.ts:291-294` — "As duas transições que valem, e só elas" ainda é mais restrito que o código: `esquecerSessao()` não tem guarda nenhuma, então `indisponivel → anonima` e `desconhecida → anonima` também passam. A frase vale para `vencida`; diga isso.
- Continuam registradas, sem bloquear, as recomendações da 3ª rodada não aplicadas: teste da idempotência pelo caminho que a guarda de destino protege, teto da difusão entre abas, desistir do segundo fator e voltar à escola de origem, e `MutationCache` na limpeza.

## test-engineer · 5ª rodada · APROVADO · 2026-09-20 05:58:11 · `tasks/prd-identidade-e-tenancy/20_task.md`

Auditei o diff desta rodada (só `apps/web/src/api/sessao.test.ts`) e refiz a mutação por conta própria.

**Verificação que fiz, sem confiar no relato:**

1. Linha de base: `npx vitest run apps/web/src/api/sessao.test.ts` → 36 testes verdes.
2. Mutação: apaguei a linha 301 de `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.ts` (`if (destino === 'vencida' && estado !== 'aberta') return`) e rodei de novo → **1 falha, e é exatamente o teste novo**: `AssertionError: expected 'vencida' to be 'anonima'` em `o "Sair" é final: a inatividade que vence enquanto o DELETE dele está no ar não devolve a aba ao estado vencido`. Os outros 35 continuaram verdes, ou seja, a linha não estava provada por mais nada — e agora está por esse teste, e só por ele.
3. Restaurei o arquivo do backup e conferi: `md5sum` idêntico antes e depois (`f8171b29170b148933ef18a320b37b76`); `git diff --stat` do arquivo igual ao do começo (225 inserções, 25 remoções). Rodei `npx vitest run apps/web` depois da restauração: 79 testes, 5 arquivos, tudo verde. A mudança de `mtime` não tem efeito: o conteúdo é bit a bit o mesmo e o carimbo do portão é posterior.

**Por que o teste é concorrência de verdade, e não duas chamadas em sequência:** `sair()` e `encerrarPorInatividade()` são disparados sem `await` entre eles, os dois `DELETE` entram no ar com o mesmo token, a saída consome o 204 e termina primeiro, e a inatividade só termina depois de dois 503 e da espera de `ESPERA_ENTRE_TENTATIVAS_DE_SAIDA_MS` com temporizador falso — logo o `finally { vencerSessao() }` dela roda com a aba já `anonima`, que é precisamente a janela que eu tinha apontado. O `afterEach` do arquivo (`expect(fila, 'resposta preparada que nenhuma chamada consumiu').toHaveLength(0)`) prova de quebra que as três respostas foram consumidas, isto é, que a repetição do `DELETE` da inatividade realmente aconteceu — o teste não passa por acidente com uma chamada a menos.

Nenhum `.skip`, `.only`, teste comentado ou mock de coisa nossa nos arquivos do diff. O `fetch` é o único dublê, e é fronteira externa.

```
VEREDITO: APROVADO

Cenários exigidos: (rodada nova — audito só a correção exigida e o diff dela)
  · "Sair" concluído enquanto a inatividade vence em paralelo, com o DELETE da
    inatividade em 5xx e terminando por último, afirmando que a aba fica `anonima`
    e que a guarda de `encerrarLocalmente` é o que garante isso.

Cobertos: apps/web/src/api/sessao.test.ts:608 — `o "Sair" é final: a inatividade que
  vence enquanto o DELETE dele está no ar não devolve a aba ao estado vencido`.
  Duas chamadas em paralelo (sem `await` entre elas), 204 na saída e dois 503 na
  inatividade, temporizador falso, `Promise.all` no fim; vermelho com a linha
  `sessao.ts:301` removida — conferido por mim, não só relatado.
  Renomeação de `apps/web/src/api/sessao.test.ts:592` confere com o que o teste prova.

Bloqueantes: nenhum.

Recomendações:
  1. apps/web/src/api/sessao.test.ts:628 — `expect(sessao.quemEstaNaSessao()).toBeUndefined()`
     não é carga: no mutante ele também passa, porque `esquecerSessao()` já limpou
     `quemEstaNaAba` e o caminho `vencida` não o repõe. Documenta a intenção, mas quem
     prova a regra é a asserção de estado. Mantenha, ciente de que não é a rede de segurança.
  2. (mantida da 4ª rodada, não aplicada de propósito para não caducar os guardiões)
     apps/web/src/api/sessao.ts:291 — o docblock diz "as duas transições que valem, e só
     elas", mais restrito que o código: `esquecerSessao` não tem guarda nenhuma e aceita
     `aberta → anonima` e `indisponivel → anonima`. Vale ajustar o texto numa correção
     futura ou no `/validar`.
```

## frontend-reviewer · 3ª rodada · APROVADO · 2026-09-20 06:00:10 · `tasks/prd-identidade-e-tenancy/20_task.md`

Auditei só o diff desde a minha aprovação (`apps/web/src/api/sessao.ts`, `apps/web/src/api/sessao.test.ts`, `apps/web/src/componentes/SeletorDeEscola.tsx`, `e2e/escola-e-vinculos.spec.ts`, `tasks/prd-identidade-e-tenancy/20_task.md`) e o que ele afeta na tela. Nenhuma tela mudou de estrutura, estado ou texto, o que confere com o que o prompt diz.

O que verifiquei de fato:

- **A mudança de comportamento** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.ts:299-313`): as duas guardas de `encerrarLocalmente` — `if (destino === 'vencida' && estado !== 'aberta') return` — e a leitura de `estadoDaSessao()` durante o `await` em `chamarComSessao` (linhas 462-465). O efeito na tela é o certo para o Chromebook do carrinho: depois do "Sair", `Protegida` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/rotas.tsx:44`) redireciona para a entrada com `replace`, e nenhum pedido atrasado consegue devolver a aba a `vencida`, que remontaria `children` da pessoa anterior com o `LoginPorCima` por cima. É melhoria de privacidade em computador compartilhado, não regressão.
- **As transições que ainda precisam funcionar continuam funcionando:** `descartarSessaoVencida` (vencida → anônima) passa pelas duas guardas; `encerrarPorInatividade` com sessão aberta continua chegando a `vencida`, que é o que preserva a contestação meio escrita (regra 80, item 6).
- **Os dois testes novos provam guardas diferentes**, o que é o ponto: o de `/v1/vinculos` prova que a chamada recusada depois da saída não é repetida sem credencial (guarda do `durante`); o do "Sair" com inatividade concorrente prova a guarda de `encerrarLocalmente`. Apagar qualquer uma das duas linhas derruba um dos dois.
- **As três recomendações exigidas foram aplicadas e estão corretas:** o comentário de `SeletorDeEscola.tsx` agora diz "esvazia o cache assim que o token do destino entra (`guardarToken`)", que é o que o código faz; `e2e/escola-e-vinculos.spec.ts:208-210` descreve a ordem sem citar `queryClient.clear()`; e `20_task.md:47` e `20_task.md:116-125` (item 3 das "Divergências resolvidas") deixaram de contradizer o código.

```
VEREDITO: APROVADO
Estados: ok — nenhuma tela mudou de estado nesta rodada; os quatro continuam nas telas da 20.0 (`/vinculos` com carregando, vazio que convida a avisar a coordenação, erro e com dado; `Protegida` com "Abrindo a sua sessão…", `EstadoErro` com "Tentar de novo", e a entrada como caminho do anônimo)
Acessibilidade: inalterada. O `details` do seletor (`SeletorDeEscola.tsx:71`) continua abrindo por teclado e por toque, sem hover nem atalho; nada no diff mexe em foco, rótulo ou contraste
Chromebook fraco: melhor do que estava. A guarda tira requisição inútil da rede da escola (o pedido recusado não é repetido sem credencial) e impede que a área autenticada seja remontada depois da saída
Celular: inalterado. O diff não toca layout, alvo de toque nem `inputmode`; os specs de `escola-e-vinculos.spec.ts` seguem rodando nos projetos `chromebook` e `celular`, e o portão reporta os 132 e2e verdes
Ação oficial protegida: não se aplica nesta tarefa (identidade e sessão, sem nota nem entrega de agente). Nada no diff cria caminho que escreva algo oficial
Bloqueantes: nenhum
Recomendações:
- `apps/web/src/api/sessao.ts:301` — com a sessão em `indisponivel`, um `NAO_AUTENTICADO` que persiste agora não leva a lugar nenhum: a guarda no-opera e a aba fica na tela de "Tentar de novo" em vez de ir para a entrada. Hoje é inalcançável na prática (em `indisponivel` a `Protegida` não monta a área autenticada, então nenhuma consulta sai), e por isso não bloqueia; se um dia alguma chamada puder sair nesse estado, o destino correto ali é `anonima`, não `vencida`
- Segue valendo a recomendação 4 da 2ª rodada (canal do `BroadcastChannel` por origem, e não por sessão) e as oito da 1ª, todas já registradas em `tasks/prd-identidade-e-tenancy/achados-revisoes.md` para o `/validar` e o `/retro`
```

## privacy-guardian · 3ª rodada · APROVADO · 2026-09-20 06:00:19 · `tasks/prd-identidade-e-tenancy/20_task.md`

Auditei o diff desde a minha 2ª rodada (aprovada), não do zero.

## O que conferi

**`apps/web/src/api/sessao.ts` — a guarda nova em `encerrarLocalmente` (linhas 299-313).** É a mudança que importa para vazamento, e ela fecha um furo em vez de abrir:

- `if (destino === 'vencida' && estado !== 'aberta') return` — a transição `anonima → vencida` deixa de existir. Percorri todos os estados que podem ter token em memória: `token` só é definido em `guardarToken`, que fixa `estado = 'aberta'`; `abrindo`, `desconhecida` e `indisponivel` só são alcançados com `token === undefined` (guarda de `abrirSessaoPeloCookie`, linha 432). Logo o retorno antecipado nunca deixa token, `quemEstaNaAba` ou cache para trás — ele só impede o ressurgimento do estado `vencida`, que era o que remontava a área autenticada da pessoa anterior no Chromebook do carrinho.
- `descartarSessaoVencida` (`vencida → anonima`) continua passando: a segunda guarda (linha 303) só barra o encerramento repetido no mesmo destino.
- `sair()` a partir de `vencida`, `indisponivel`, `abrindo` continua limpando `quemEstaNaAba` e disparando `limparDadosDaEscola()`.

**A chamada recusada depois da saída (linhas 462-465).** Lê `estadoDaSessao()` depois do `await`, não a variável restringida pela guarda do começo, e sobe o erro sem repetir a requisição. Não sai pedido sem `Authorization` para a API depois do "Sair"; o teste da linha 600 prova com `chamadas.filter(... '/v1/vinculos').toHaveLength(1)`.

**Testes novos (`apps/web/src/api/sessao.test.ts`, linhas 600-637).** Dados sintéticos (`camila@escola.test`, `outra@escola.test`, tokens fixos). Os dois casos falham se a guarda for removida — o da linha 617 é exatamente a corrida "Sair + inatividade no mesmo segundo" e assere `estadoDaSessao() === 'anonima'` e `quemEstaNaSessao() === undefined`.

**Comentários em `apps/web/src/componentes/SeletorDeEscola.tsx` e `e2e/escola-e-vinculos.spec.ts`**: só texto, e o texto agora bate com o código (a limpeza acontece dentro de `guardarToken`, com o token do destino já em memória). **`tasks/prd-identidade-e-tenancy/20_task.md`**: a divergência 3 está registrada por extenso, com o motivo de `resetQueries` depois do token e não `clear()` antes.

Nenhum campo pessoal novo, nenhuma rota nova, nenhum `console.`/`logger.` nos arquivos do diff, nenhum envio externo, nenhuma migration. A memória da aba continua sendo `usuarioId` opaco + papel + `escolaSlug`, em variável de módulo, apagada no "Sair".

```
VEREDITO: APROVADO
Campos pessoais tocados: nenhum novo. Permanece o já auditado: usuarioId opaco, papel e escolaSlug em memória de aba (apps/web/src/api/sessao.ts:111), e usuarioAntesDeVencer (linha 118), que é só o identificador opaco
Fora da tabela de dados do docs/lgpd.md: nada
Autorização por objeto: ok — nenhuma rota nova nem alteração de autorização neste diff
Logs: limpos
Auditoria: presente — nenhuma ação auditável nova neste diff
Envio externo: nenhum
Seed/fixture: sintético (apps/web/src/api/sessao.test.ts, e-mails @escola.test e tokens fixos)
Bloqueantes: nenhum
Recomendações:
  - apps/web/src/api/sessao.ts:83, 612 e 672 — `saidaConfirmada` é compartilhada por `sair()` e `encerrarPorInatividade()`. Na corrida que o teste da linha 617 exercita (saída confirmada, `DELETE` da inatividade falhando), a entrada mostra "a saída pode não ter sido concluída" sem ter havido falha. Erra para o lado seguro, não vaza nada; vale registrar um aviso por caminho, ou nunca rebaixar `saidaConfirmada` depois de uma confirmação, para o aviso não virar aviso que ninguém lê
  - Continuam registradas, não aplicadas, das rodadas anteriores: segundo fator antes do `escolher`; exaustividade da união de etapas; canal do `BroadcastChannel` por sessão; `MutationCache` no fim de sessão; comparar o `usuarioId` de todo `/v1/eu` com o da aba
```

Pergunta de fechamento: nada neste diff muda a resposta da rodada anterior — ele não cria dado guardado nem destino de envio, só encurta o tempo em que a sessão anterior continua alcançável na aba.

## tenancy-guardian · 3ª rodada · APROVADO · 2026-09-20 06:00:43 · `tasks/prd-identidade-e-tenancy/20_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova neste diff. As tabelas da tarefa (`usuario`, `escola`, `sessao`, `registro_de_acesso`) não mudaram desde a minha 2ª rodada; `escolaId`/`anoLetivoId` conferidos lá.

Queries verificadas: nenhuma query nova. Reconferi por afetação o único `@SemEscopo` da tarefa — `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:132` (`acessosDaConta`), justificativa escrita, filtra por `contaId` da sessão já verificada e devolve só `usuarioId`, nome da escola e papel — e o caminho de escalada óbvio da tarefa, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/troca-de-escola.service.ts:59-61`: o `usuarioId` do corpo é conferido contra os ativos da conta do token e a escola de destino vem do banco, nunca do cliente. Nada disso foi tocado pelo diff.

Teste de isolamento: presente e efetivo.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/etapas-do-login.test.ts:275` continua exigindo `limpezas === ['token-da-escola-b']`: mover a limpeza para antes de `guardarToken` (o bloqueante da 1ª rodada) quebra o teste. A ordem em `guardarToken` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.ts:253-269`) não mudou.
- Os dois e2e (`/home/joaquimdp/Documentos/git/Educa.ia/e2e/escola-e-vinculos.spec.ts:123` e `:185`) seguram a resposta de `/v1/meus-vinculos` antes de afirmar a ausência da turma de A, então a asserção não passa por resposta já chegada.
- As duas guardas novas têm teste que morre sem elas: sem `estado !== 'aberta'` em `encerrarLocalmente`, o caso `'o "Sair" é final: a inatividade que vence enquanto o DELETE dele está no ar…'` (`apps/web/src/api/sessao.test.ts`) vê `vencida` em vez de `anonima`; sem a guarda de `durante` em `chamarComSessao`, o caso do pedido recusado depois do "Sair" conta duas chamadas a `/v1/vinculos`.

Analisei se a guarda nova pode pular uma limpeza de cache necessária: `vencerSessao` só é alcançado com `estado` em `aberta`, `desconhecida`, `abrindo` ou `indisponivel`; os três últimos só existem com `token === undefined` em aba recém-carregada (`definirEstado('abrindo')` só em `abrirSessaoPeloCookie`, que retorna cedo com token, e `rotas.tsx:33/48` só a chamam de `desconhecida` ou `indisponivel`), ou seja, sem dado de escola no cache. Nenhum caminho fica sem `limparDadosDaEscola()` com cache sujo.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.ts:671`: um `encerrarPorInatividade` que falha em paralelo a um "Sair" bem-sucedido zera `saidaConfirmada` e faz a entrada mostrar o aviso de saída não confirmada sem motivo. Erra para o lado seguro, mas aviso à toa é aviso que ninguém lê.
- As quatro da 2ª rodada seguem válidas e não aplicadas: canal do `BroadcastChannel` por sessão, conferir a escola do `/v1/eu` na renovação, janela do e2e da troca pelo segundo fator, e `MutationCache`.

## revisor-geral · 3ª rodada · REPROVADO · 2026-09-20 06:01:15 · `tasks/prd-identidade-e-tenancy/20_task.md`

VEREDITO: REPROVADO
Escopo: respeitado — o diff desde a minha 2ª rodada é só `apps/web/src/api/sessao.ts`, `apps/web/src/api/sessao.test.ts`, dois comentários (`SeletorDeEscola.tsx`, `e2e/escola-e-vinculos.spec.ts`) e o arquivo da tarefa. Nada de F2/F6/F7 entrou.
Aderência à Tech Spec: ok — a divergência do `resetQueries()` contra `techspec.md:427` está agora registrada (correção 3 cumprida, `20_task.md` "Divergências resolvidas nesta tarefa", item 3, mais as linhas 47 e 81).
Portão local: **inválido** — `node tools/processo/portao-local.ts conferir tasks/prd-identidade-e-tenancy/20_task.md` responde:
`portão local: apps/web/src/api/sessao.ts mudou em 2026-09-20 05:57:29, depois do início do último (2026-09-20 05:46:31). Rode node tools/processo/portao-local.ts --e2e de novo.`

## Bloqueantes

**1. `/home/joaquimdp/Documentos/git/Educa.ia/.processo/portao.json` (`inicio` 2026-09-20T08:46:31.742Z = 05:46:31 local) contra `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.ts` (mtime 05:57:29) — o carimbo é anterior à última alteração que o processo conta como código.**

Conferi arquivo a arquivo o `git status`: `sessao.ts` é o único de código posterior ao carimbo (os outros dois posteriores são `20_task.md` e `achados-revisoes.md`, escritos pelo hook). A afirmação da mensagem de entrega ("carimbo de 2026-09-20T08:46:31Z; `conferir` responde válido") é falsa, e a do `test-engineer` na 5ª rodada ("a mudança de `mtime` não tem efeito: … o carimbo do portão é posterior") está invertida — o carimbo é **anterior** ao mtime. O hook bloqueia o commit com essa mesma mensagem. Que o conteúdo restaurado seja bit a bit igual não muda nada aqui: o `md5sum` não está registrado em lugar nenhum que o portão leia, e a única prova que o processo aceita é o carimbo.

**Correção exigida:** rodar `node tools/processo/portao-local.ts --e2e` depois da última edição de código e só então pedir a rodada seguinte.

**2. `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.ts:291-294` — o docblock de `encerrarLocalmente` continua contradizendo o próprio docblock, três linhas acima, sobre a transição mais usada do módulo.**

A frase é "As duas transições que valem, e só elas: a sessão **aberta** pode vencer, e a sessão vencida pode virar anônima". O bullet de `:286-287`, no mesmo bloco, diz o contrário: "`anonima` é o fim pedido pela pessoa ('Sair') ou a aba que abriu sem sessão nenhuma". E é o bullet que descreve o código: `esquecerSessao()` (`:316-318`) não tem guarda nenhuma, e `aberta → anonima` é o que acontece em todo clique em "Sair" com a sessão aberta (`sair()`, `:617`), além de `indisponivel → anonima` e `desconhecida → anonima`. A guarda de `:301` barra **um** destino, `vencida`, e só quando o estado não é `aberta`.

É o mesmo defeito que exigi corrigir na 2ª rodada, no mesmo bloco: duas regras opostas lado a lado, e neste repositório a regra do módulo mora no comentário. Quem ler "e só elas" conclui que a saída a partir da sessão aberta está barrada, e o próximo a mexer na guarda "corrige" o código pelo comentário. O `test-engineer` apontou isso na 4ª rodada como recomendação e ficou sem aplicar.

**Correção exigida:** declarar o que a guarda faz, e não uma lista de transições que o código não tem — por exemplo, "o único destino barrado é `vencida` quando a sessão não está aberta: a saída pedida pela pessoa é final". Não precisa de teste novo: a linha `:301` já está provada por `sessao.test.ts:617`.

## O que verifiquei e está certo (para não refazerem)

- Correção 1 — `sessao.ts:301` e `:462-465`. A guarda e a não repetição estão nos dois caminhos que eu descrevi, e refiz a leitura do roteiro do passo 3: com `durante` em `'anonima'`, a requisição sem `Authorization` não sai mais (`sessao.test.ts:600-615`, com a consulta partindo antes do clique), e o `finally { vencerSessao() }` de `encerrarPorInatividade` não devolve a aba a `vencida` (`sessao.test.ts:617-637`, com os dois `DELETE` concorrentes e o `afterEach` provando que as três respostas foram consumidas). Os caminhos que sobram para `vencerSessao()` fora de `aberta` (`:471` e `:491`) continuam inertes.
- Correção 3 — `20_task.md:47`, `:81` e o item 3 das divergências descrevem a ordem real (`resetQueries` dentro de `guardarToken`, com o token do destino já em memória) e dão o motivo dos dois lados.
- Nenhum `.skip`, `.only`, `any` ou `TODO` nos arquivos do `git status`.

## Recomendações

- `apps/web/src/sessao/inatividade.ts:19` — canal do `BroadcastChannel` por origem, não por sessão: duas abas com pessoas diferentes adiam o vencimento uma da outra. Amarrar o nome ao `usuarioId` de `quemEstaNaSessao()` fecha isso.
- `apps/web/src/componentes/SeletorDeEscola.tsx:73` — o `details` fica aberto depois da troca, listando a escola de onde a pessoa veio.
- `tasks/prd-identidade-e-tenancy/techspec.md:427-428` — a seção 9 ainda nomeia `queryClient.clear()`. A divergência está registrada na tarefa; a linha da spec precisa ir junto quando a decisão for aplicada por `/revisar-spec`.

## revisor-geral · 4ª rodada · APROVADO · 2026-09-20 06:14:43 · `tasks/prd-identidade-e-tenancy/20_task.md`

Verifiquei as duas correções exigidas e o portão.

**Correção 1 — carimbo.** `.processo/portao.json` tem `inicio: 2026-09-20T09:02:47.204Z` (06:02:47 local) com as quatro suítes (`typecheck, lint, test, e2e`). O `mtime` mais novo entre todos os arquivos da tarefa é `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.ts` às 06:02:00 — anterior ao início do carimbo, e não só à gravação dele (06:12:26). `conferir` responde "portão local válido para o código atual (typecheck, lint, test, e2e)". Resolvido.

**Correção 2 — docblock de `encerrarLocalmente`.** O texto agora descreve as duas guardas como elas são. Confronto linha a linha:
- "Ir para `anonima` vale de qualquer estado" ↔ nenhuma guarda barra `anonima` por estado; `descartarSessaoVencida` → `esquecerSessao` de fato sai de `vencida`.
- "O único destino barrado é `vencida` quando a sessão não está aberta" ↔ `if (destino === 'vencida' && estado !== 'aberta') return`.
- Parágrafo separado de idempotência ↔ `if (token === undefined && estado === destino) return`, que é idempotência por destino e não restrição de transição.

Não sobrou nenhuma afirmação do tipo "as duas transições que valem, e só elas". O diff desde a minha 3ª rodada é só esse bloco de comentário; nenhuma linha executável mudou, o que é consistente com o resto do arquivo que eu já auditara.

Escopo e Tech Spec: inalterados desde a rodada em que aprovei esses dois eixos; a correção não tocou comportamento.

```
VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test, e2e; início 2026-09-20T09:02:47Z, posterior ao mtime de todos os arquivos alterados)
Bloqueantes: nenhum
Recomendações: as três já registradas em /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/achados-revisoes.md seguem valendo e não bloqueiam — canal do BroadcastChannel por sessão, fechar o `details` do seletor depois da troca, e a linha da Tech Spec sobre o endereço de entrada da outra escola (divergência 2 já está documentada na tarefa; a Tech Spec é que ficou desatualizada).
```

## privacy-guardian · 4ª rodada · APROVADO · 2026-09-20 06:14:43 · `tasks/prd-identidade-e-tenancy/20_task.md`

Auditei apenas o diff informado (`apps/web/src/api/sessao.ts`, docblock de `encerrarLocalmente`) e o que ele afeta. Confirmei que o comentário passou a descrever a guarda existente e que o código correspondente não mudou: a linha 302 barra só `destino === 'vencida' && estado !== 'aberta'`, e a linha 304 mantém a idempotência por destino — exatamente o que o texto das linhas 291-298 agora afirma. Sem contradição restante.

Comentário não toca dado pessoal, log, exposição, envio externo, retenção ou seed. O estado em memória auditado na 3ª rodada segue idêntico: `quemEstaNaAba` guarda `usuarioId` opaco, `papel` e `escolaSlug`, sem nome, e-mail ou matrícula; `usuarioAntesDeVencer` guarda só o identificador opaco; `limparDadosDaEscola` continua sendo chamado em todo fim de sessão e em toda sessão nova. Nenhuma chamada a `console` ou `logger` no arquivo.

```
VEREDITO: APROVADO
Campos pessoais tocados: nenhum neste diff (só comentário). O estado em memória já auditado segue: usuarioId opaco, papel, escolaSlug — sem nome, e-mail, matrícula, CPF, foto, nascimento ou diagnóstico
Fora da tabela de dados do docs/lgpd.md: nada
Autorização por objeto: ok — inalterada neste diff
Logs: limpos — nenhum console/logger em apps/web/src/api/sessao.ts
Auditoria: presente — inalterada neste diff
Envio externo: nenhum neste diff; nenhuma chamada a provedor de IA nesta tarefa
Seed/fixture: sintético — e2e/__fixtures__/sessao.ts inalterado nesta rodada
Bloqueantes: nenhum
Recomendações: seguem as das rodadas anteriores, ainda registradas e não aplicadas — em especial `saidaConfirmada` compartilhado entre a saída pedida e a inatividade em /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.ts (linhas 88 e 261): dois fins de sessão com semânticas distintas convivendo num único sinalizador; separar quando houver um terceiro caminho de encerramento. Nenhuma bloqueia
```

Arquivos relevantes: /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/api/sessao.ts e /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/achados-revisoes.md.
