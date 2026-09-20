# Tarefa 20.0 — Telas depois de entrar: escola, vínculos, saída e inatividade

**Funcionalidade:** identidade-e-tenancy · **Depende de:** 18.0, 9.0, 12.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`, `tenancy-guardian`, `test-engineer`

## Objetivo

Quem trabalha em mais de uma escola escolhe e troca de escola sem levar dado de uma para a
outra. O professor confirma ou contesta cada vínculo. A sessão termina sozinha quando
ninguém mexe no computador, e o login volta por cima da tela sem perder o que foi digitado.

## Contexto necessário

- `docs/visao-produto.md` (sempre), seção 6 (cada escola é um mundo fechado)
- `prd.md`:
  - RF4: confirmar ou contestar cada vínculo;
  - RF13: sessão do aluno e Sair em toda tela;
  - RF14: seletor de escola;
  - RF20: telas;
  - casos de borda "Professor discorda de uma alocação", "Professor com duas disciplinas na mesma turma" e "Chromebook do carrinho entre duas turmas".
- `techspec.md`:
  - seção 4 (`/v1/eu` com `acessos` e `inatividadeMin`, `/v1/sessao/escola`, `/v1/sessao/atividade`, `/v1/meus-vinculos`, `/v1/vinculos/:id/confirmar` e `/contestar`);
  - seção 5, "Atividade" (no máximo a cada 5 min, só com ponteiro ou teclado), "Troca de escola" (só sessão de método e-mail; encerra a sessão de origem; sessão de matrícula ou externa leva ao login da outra escola), "Vínculo" (aviso "não escreva nome de aluno");
  - seção 9;
  - seção 12 (o cookie sem `Max-Age` sobrevive à restauração de sessão do Chrome, e a inatividade no servidor é a garantia).
- `.claude/rules/50-frontend.md`:
  - item 3: estado de servidor é do TanStack Query, e a troca limpa o cache inteiro, senão aparece turma da escola anterior;
  - item 5: quatro estados, e o vazio convida a agir;
  - item 8: contestar mostra o que vai acontecer;
  - item 13: seletor de escola no topo, porque o professor da rede pública dá aula em duas ou três escolas.
- `.claude/rules/10-multitenancy.md`: a tela nunca guarda id da escola anterior para a próxima requisição.
- `.claude/rules/20-lgpd-menores.md`: o complemento da contestação não é lugar de nome de aluno.
- `.claude/rules/80-infra-e-carga.md`, item 6. Perder o que foi digitado por causa de sessão vencida é o mesmo erro que perder resposta de prova. O F6 herda o contrato.
- `docs/interface.md`, seção 1 (`[Escola ▾]` no topo da área do professor) e seção 6.
- Código existente: `apps/web/src/api/cliente-de-consultas.ts` (`QueryClient`), `apps/web/src/paginas/Casca.tsx` (foco ao recuperar, `refetch` sem cancelar), `componentes/estado/*`, `e2e/__fixtures__/verificacoes.ts` e `perfis.ts`.
- Criado nas tarefas anteriores do F1:
  - rotas, `api/sessao.ts`, `Cabecalho.tsx`, "Sair" e fixtures de sessão (18.0);
  - `/v1/eu.acessos` e `/v1/sessao/escola` (12.0);
  - rotas de vínculo (9.0);
  - `/v1/sessao/atividade` e inatividade por papel (5.0).

## Subtarefas

- [x] 20.1 — Escolha e troca de escola.
  - **`/escolher-escola`:** lista escola e papel de cada acesso ("Colégio X · professor", "Colégio X · coordenação"), a partir do desafio `escolher`.
  - **Seletor no cabeçalho:** a partir de `/v1/eu.acessos`.
  - **Troca:** chama `POST /v1/sessao/escola`, esvazia o cache de consultas assim que o token do destino entra (ver "Divergências") e volta à página inicial da escola de destino.
  - **Destino coordenação sem MFA cumprido:** leva a `/mfa`.
  - **Sessão de matrícula ou externa:** o seletor explica que dali não se troca e diz o caminho (ver "Divergências").
- [x] 20.2 — `/vinculos`.
  - **Listagem:** vínculos do professor na escola ativa (`/v1/meus-vinculos`), um cartão por turma e disciplina, com o estado em texto e não só em cor.
  - **Confirmar:** botão de 44 px, desabilitado enquanto a chamada está em andamento.
  - **Contestar:** abre a escolha do código (não leciono, turma errada, disciplina errada, outro) e o complemento de até 140 caracteres, com o aviso "não escreva nome de aluno". Antes de enviar, mostra o que vai acontecer: a coordenação vê a contestação, e o vínculo não dá acesso até ser corrigido.
  - **Quatro estados:** o vazio diz que a coordenação ainda não alocou turmas e que o professor pode avisá-la.
- [x] 20.3 — Saída e inatividade.
  - **Timer:** escuta ponteiro e teclado. Chama `POST /v1/sessao/atividade` no máximo a cada 5 min e só se houve interação. Nenhuma tela faz polling.
  - **Inatividade vencida:** com o valor de `inatividadeMin` do `/v1/eu`, chama `DELETE /v1/sessao`, limpa o cache e mostra o login.
  - **Login por cima da tela:** quando a API responde `NAO_AUTENTICADO` depois da renovação, ou a inatividade vence com um formulário preenchido, o login aparece num diálogo por cima da tela, com foco preso nele. Formulário e rota ficam intactos. Entrando de novo com a mesma pessoa, a tela continua de onde estava; entrando outra pessoa, o estado é descartado.
  - **"Sair":** fica visível no cabeçalho em toda tela autenticada.
- [x] 20.4 — Testes.

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/paginas/EscolherEscola.tsx`, `apps/web/src/componentes/SeletorDeEscola.tsx` | novo |
| `apps/web/src/paginas/Vinculos.tsx`, `apps/web/src/api/vinculos.ts` | novo |
| `apps/web/src/sessao/inatividade.ts`, `apps/web/src/componentes/LoginPorCima.tsx` | novo |
| `apps/web/src/componentes/Cabecalho.tsx`, `apps/web/src/api/sessao.ts`, `apps/web/src/rotas.tsx` | alterado |
| `packages/shared/src/erros/mensagens.ts` (textos da contestação e da troca, se faltarem) | alterado |
| `e2e/escola-e-vinculos.spec.ts`, `e2e/inatividade.spec.ts` | novo |
| `e2e/__fixtures__/sessao.ts` (pessoa em duas escolas, vínculos pendentes) | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| inatividade: com `page.clock`, o aluno digita num campo, fica além de `inatividadeMin` e mais a tolerância, o login aparece por cima; ao entrar de novo, o texto digitado continua lá | e2e | RF13 e regra 80, item 6: sessão vencida não apaga trabalho |
| borda: ficar parado com a aba aberta não chama `/v1/sessao/atividade` (contado em `page.route`), e mexer o ponteiro chama no máximo uma vez a cada 5 min | e2e | a inatividade não é renovada por aba esquecida no Chromebook |
| falha: 5xx e rede cortada durante a área autenticada não abrem o login por cima | e2e | só `NAO_AUTENTICADO` depois da renovação desloga |
| isolamento: professor em A e B; com A ativa vê a turma "7ºA" de A; troca para B, e o nome da turma de A não aparece em nenhum lugar do DOM, nem voltando pelo histórico, nem quando a troca passa pelo segundo fator | e2e | RF14: o cache esvaziado na troca e nada da escola anterior no cliente |
| troca para coordenação de B leva a `/mfa`; a sessão aberta pela conta da escola é recusada na troca e a tela explica o caminho; o aluno nunca chega a ver seletor | e2e | Tech Spec seção 5, "Troca de escola" |
| vínculo: professor com duas disciplinas na mesma turma confirma uma e contesta a outra com código e complemento; o aviso "não escreva nome de aluno" está visível; os dois estados aparecem em texto | e2e | RF4 e caso de borda |
| clique duplo em confirmar faz uma só chamada, e contestar sem escolher código não envia | e2e | ação oficial sem efeito repetido (regra 50, item 8) |
| Chromebook compartilhado: aluno A clica em "Sair", aluno B entra na mesma aba, e Voltar não mostra nada de A | e2e | RF13 e regra 50, item 7 |
| quatro estados de `/vinculos`, com o vazio convidando a falar com a coordenação, por teclado e toque nos projetos `chromebook` e `celular`, sem rolagem horizontal a 360 px e com axe limpo | e2e | RF20, regra 50, itens 2a e 5 |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] `npm run typecheck` limpo
- [x] E2E verde (se tocou tela)
- [x] Todos os revisores obrigatórios com rodada na seção "Revisões", iniciada depois da
  última alteração de código, e APROVADO nos que têm veto
- [x] Revisão aprovada
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Divergências resolvidas nesta tarefa

**1. A etapa `escolher` passou a levar os acessos.** A resposta de login dessa etapa era só `{ etapa, desafio }`, e o
desafio é opaco para o cliente: a tela `/escolher-escola` não teria como listar escola e papel, nem de onde tirar o
`usuarioId` que `POST /v1/sessao/escola` exige, e a professora com duas escolas não entraria (RF14). A resposta da
etapa leva agora `acessos`, com os mesmos campos de `/v1/eu.acessos` — nome da escola e papel, nada mais de outra
escola — para a mesma conta que acabou de provar a senha. Mexe em `packages/shared/src/sessao/login.ts`,
`apps/api/src/sessao/conclusao-de-login.ts` e `sessao.module.ts`.

**2. O seletor não leva ao endereço da outra escola: explica e manda entrar por lá.** A subtarefa 20.1 pedia que a
sessão de matrícula ou externa levasse "ao endereço de entrada da outra escola". Ele não existe do lado da web: os
`acessos` levam o nome da escola e mais nada dela (Tech Spec, seção 7), e pôr o `slug` da outra escola ali seria
alargar o que uma escola sabe da outra, contra a mesma seção. Além disso, a sessão de matrícula nunca chega ao
seletor: o aluno não tem conta, `acessos` vem vazio e o cabeçalho mostra só a escola dele. Fica assim: a troca
recusada mostra a explicação, que manda sair e entrar pela escola de destino (`AVISO_DA_TROCA_RECUSADA`), e o e2e
prova as duas pontas — a sessão aberta pela conta da escola recebendo a explicação, e o aluno sem seletor nenhum.

**3. O cache é esvaziado depois de o token do destino entrar, e não antes.** A subtarefa 20.1 pedia
`queryClient.clear()` **antes** de guardar o token novo. Duas coisas apareceram na revisão. O `clear` tira as
consultas do cache, mas a tela que continua montada segue mostrando o último dado que recebeu, porque o observador
dela fica preso à consulta removida — e é justamente a tela montada (a que fica atrás do login por cima) que não pode
continuar com o nome e a escola da pessoa anterior. O que esvazia a tela é `resetQueries()`, que também **refaz** as
buscas; e refazê-las antes do token novo é o que traria o dado da escola de origem de volta, porque na troca que
passa pelo segundo fator a sessão de origem ainda vale. Fica assim: o esvaziamento acontece dentro de `guardarToken`,
com o token do destino já em memória, e só quando a sessão é nova (entrada, escolha de escola, troca concluída),
nunca na rotação de rotina. A troca que para no segundo fator não esvazia nada, porque até o código ser aceito a
pessoa continua na escola de origem.

## Fora do escopo desta tarefa

- Telas da coordenação para criar vínculo, encerrar e ver contestações, e para configurar a inatividade da escola: F2.
- Aviso à coordenação quando o professor contesta: motor de eventos do F13. Até lá, a coordenação consulta `GET /v1/vinculos?estado=contestado`.
- Contrato de "sessão com avaliação em andamento não vence por inatividade": F6.
- `/entrar`, renovação e 503 como "entrando…": 18.0. `/e/:slug`, MFA e convite: 19.0.
- Menu completo da área do professor (chat, ferramentas, calendário, seu time): F7 em diante.

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-20 04:23:36 | 2026-09-20 04:29:00 | `test-engineer` | 1 | REPROVADO | aed913373a2267ab1 |
| 2026-09-20 04:44:52 | 2026-09-20 04:46:41 | `test-engineer` | 2 | APROVADO | a27443558d95a2963 |
| 2026-09-20 04:47:32 | 2026-09-20 04:50:28 | `privacy-guardian` | 1 | APROVADO | abd7750c373127b02 |
| 2026-09-20 04:47:16 | 2026-09-20 04:51:14 | `frontend-reviewer` | 1 | APROVADO | a241070d617867ac3 |
| 2026-09-20 04:47:47 | 2026-09-20 04:53:23 | `tenancy-guardian` | 1 | REPROVADO | a5e97cca285f9619f |
| 2026-09-20 04:47:00 | 2026-09-20 04:53:51 | `revisor-geral` | 1 | REPROVADO | a167bcb0c9f92c955 |
| 2026-09-20 05:17:57 | 2026-09-20 05:21:33 | `test-engineer` | 3 | APROVADO | a07a2c388f9178e07 |
| 2026-09-20 05:22:20 | 2026-09-20 05:24:55 | `tenancy-guardian` | 2 | APROVADO | affd0923d1c8dfa6e |
| 2026-09-20 05:22:33 | 2026-09-20 05:25:02 | `frontend-reviewer` | 2 | APROVADO | ad8827e3e1b8b1281 |
| 2026-09-20 05:22:45 | 2026-09-20 05:26:25 | `privacy-guardian` | 2 | APROVADO | a26a4c58e2f26c9a2 |
| 2026-09-20 05:22:07 | 2026-09-20 05:28:04 | `revisor-geral` | 2 | REPROVADO | ae159a301074c4689 |
| 2026-09-20 05:42:05 | 2026-09-20 05:45:27 | `test-engineer` | 4 | REPROVADO | a05e3691081a0dc3b |
| 2026-09-20 05:56:41 | 2026-09-20 05:58:11 | `test-engineer` | 5 | APROVADO | ae6d41a71aea72d02 |
| 2026-09-20 05:58:58 | 2026-09-20 06:00:10 | `frontend-reviewer` | 3 | APROVADO | a390b4cd8c4b40d84 |
| 2026-09-20 05:59:09 | 2026-09-20 06:00:19 | `privacy-guardian` | 3 | APROVADO | ac026cf8e4f072d73 |
| 2026-09-20 05:58:47 | 2026-09-20 06:00:43 | `tenancy-guardian` | 3 | APROVADO | ac8d4f73b6b814851 |
| 2026-09-20 05:58:35 | 2026-09-20 06:01:15 | `revisor-geral` | 3 | REPROVADO | a961e85dbf14b9b6c |
| 2026-09-20 06:12:47 | 2026-09-20 06:13:41 | `test-engineer` | 6 | APROVADO | aa781d4329fbbe74f |
| 2026-09-20 06:14:09 | 2026-09-20 06:14:36 | `tenancy-guardian` | 4 | APROVADO | a5d6edb90dd446212 |
| 2026-09-20 06:14:02 | 2026-09-20 06:14:43 | `revisor-geral` | 4 | APROVADO | a7320e9dc7163addb |
| 2026-09-20 06:14:19 | 2026-09-20 06:14:43 | `privacy-guardian` | 4 | APROVADO | acd141225a7d2d262 |
| 2026-09-20 06:14:14 | 2026-09-20 06:15:05 | `frontend-reviewer` | 4 | APROVADO | a32af98a4e4c65ecd |
