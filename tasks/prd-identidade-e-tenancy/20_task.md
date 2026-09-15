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

- [ ] 20.1 — Escolha e troca de escola.
  - **`/escolher-escola`:** lista escola e papel de cada acesso ("Colégio X · professor", "Colégio X · coordenação"), a partir do desafio `escolher`.
  - **Seletor no cabeçalho:** a partir de `/v1/eu.acessos`.
  - **Troca:** chama `POST /v1/sessao/escola`, faz `queryClient.clear()` antes de guardar o token novo e volta à página inicial da escola de destino.
  - **Destino coordenação sem MFA cumprido:** leva a `/mfa`.
  - **Sessão de matrícula ou externa:** o seletor leva ao endereço de entrada da outra escola, com a explicação.
- [ ] 20.2 — `/vinculos`.
  - **Listagem:** vínculos do professor na escola ativa (`/v1/meus-vinculos`), um cartão por turma e disciplina, com o estado em texto e não só em cor.
  - **Confirmar:** botão de 44 px, desabilitado enquanto a chamada está em andamento.
  - **Contestar:** abre a escolha do código (não leciono, turma errada, disciplina errada, outro) e o complemento de até 140 caracteres, com o aviso "não escreva nome de aluno". Antes de enviar, mostra o que vai acontecer: a coordenação vê a contestação, e o vínculo não dá acesso até ser corrigido.
  - **Quatro estados:** o vazio diz que a coordenação ainda não alocou turmas e que o professor pode avisá-la.
- [ ] 20.3 — Saída e inatividade.
  - **Timer:** escuta ponteiro e teclado. Chama `POST /v1/sessao/atividade` no máximo a cada 5 min e só se houve interação. Nenhuma tela faz polling.
  - **Inatividade vencida:** com o valor de `inatividadeMin` do `/v1/eu`, chama `DELETE /v1/sessao`, limpa o cache e mostra o login.
  - **Login por cima da tela:** quando a API responde `NAO_AUTENTICADO` depois da renovação, ou a inatividade vence com um formulário preenchido, o login aparece num diálogo por cima da tela, com foco preso nele. Formulário e rota ficam intactos. Entrando de novo com a mesma pessoa, a tela continua de onde estava; entrando outra pessoa, o estado é descartado.
  - **"Sair":** fica visível no cabeçalho em toda tela autenticada.
- [ ] 20.4 — Testes.

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
| isolamento: professor em A e B; com A ativa vê a turma "7ºA" de A; troca para B, e o nome da turma de A não aparece em nenhum lugar do DOM, nem voltando pelo histórico | e2e | RF14: `queryClient.clear()` na troca e nada da escola anterior no cliente |
| troca para coordenação de B leva a `/mfa`; sessão de matrícula no seletor leva ao endereço da outra escola | e2e | Tech Spec seção 5, "Troca de escola" |
| vínculo: professor com duas disciplinas na mesma turma confirma uma e contesta a outra com código e complemento; o aviso "não escreva nome de aluno" está visível; os dois estados aparecem em texto | e2e | RF4 e caso de borda |
| clique duplo em confirmar faz uma só chamada, e contestar sem escolher código não envia | e2e | ação oficial sem efeito repetido (regra 50, item 8) |
| Chromebook compartilhado: aluno A clica em "Sair", aluno B entra na mesma aba, e Voltar não mostra nada de A | e2e | RF13 e regra 50, item 7 |
| quatro estados de `/vinculos`, com o vazio convidando a falar com a coordenação, por teclado e toque nos projetos `chromebook` e `celular`, sem rolagem horizontal a 360 px e com axe limpo | e2e | RF20, regra 50, itens 2a e 5 |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [ ] Todos os revisores obrigatórios com rodada na seção "Revisões", iniciada depois da
  última alteração de código, e APROVADO nos que têm veto
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- Telas da coordenação para criar vínculo, encerrar e ver contestações, e para configurar a inatividade da escola: F2.
- Aviso à coordenação quando o professor contesta: motor de eventos do F13. Até lá, a coordenação consulta `GET /v1/vinculos?estado=contestado`.
- Contrato de "sessão com avaliação em andamento não vence por inatividade": F6.
- `/entrar`, renovação e 503 como "entrando…": 18.0. `/e/:slug`, MFA e convite: 19.0.
- Menu completo da área do professor (chat, ferramentas, calendário, seu time): F7 em diante.

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->
