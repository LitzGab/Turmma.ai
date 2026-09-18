# Tarefa 18.0 — A web mantém a sessão, e a equipe entra por `/entrar`

**Funcionalidade:** identidade-e-tenancy · **Depende de:** 5.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`, `infra-guardian`, `test-engineer`

## Objetivo

A web passa a ter rotas e sessão. O professor entra por `/entrar` com e-mail e senha, e o
token fica só em memória. A renovação acontece uma vez por vez, mesmo com várias abas. Queda
de rede ou 5xx nunca manda ninguém para o login. Sob pico, o 503 do semáforo aparece como
"entrando…", e não como erro.

## Contexto necessário

- `docs/visao-produto.md` (sempre), seção 4 (a Camila tem quarenta minutos de intervalo)
- `prd.md`: RF6 (e-mail e senha, respostas iguais), RF13 (sair em toda tela), RF20 (quatro
  estados, `chromebook` e `celular`, teclado e toque), RF21
- `techspec.md`:
  - seção 4 (`/v1/sessao/email`, `/renovar`, `DELETE /v1/sessao`, `/v1/eu`, códigos `JA_RENOVADO` e `CONTA_SEGURADA`);
  - seção 5, "Hash" (503 com `Retry-After` como atraso na web), "Etapas" e "Renovar";
  - seção 7c (Postgres fora: sem logout);
  - seção 9.
- `.claude/rules/50-frontend.md`:
  - item 1: computador fraco, bundle enxuto;
  - item 2a e D51: 360 px, toque, alvo de 44 px;
  - item 5: quatro estados;
  - item 7: token em memória e cookie httpOnly, nada em `localStorage` nem em URL, porque o Chromebook do carrinho passa por quatro turmas;
  - item 12: o erro diz o que fazer.
- `.claude/rules/80-infra-e-carga.md`, item 6. Queda de rede não pode apagar o que a pessoa fez, e o login em massa às 7h30 não pode virar erro na tela.
- `.claude/rules/20-lgpd-menores.md`, item 7.
- `docs/interface.md`, seções 1 e 6 (a área do professor, e o que vale em toda tela).
- Código existente:
  - `apps/web/src/api/cliente.ts`: `buscarDaApi`, `ErroDaApi` e a dedução do código pelo status. É aqui que entram `Authorization` e a renovação.
  - `apps/web/src/api/cliente-de-consultas.ts`: `QueryClient`.
  - `apps/web/src/main.tsx`: hoje renderiza só a `Casca`.
  - `apps/web/src/paginas/Casca.tsx`: padrão de seção, foco ao recuperar do erro e `refetch` sem cancelar.
  - `apps/web/src/componentes/estado/*` e `componentes/Botao.tsx`.
  - `e2e/casca.spec.ts`, `e2e/__fixtures__/perfis.ts`, `verificacoes.ts` (axe com `target-size`, largura) e `paginas.ts`.
  - `playwright.config.ts` (projetos `chromebook` e `celular`) e `.size-limit.json` (150 kB brotli).
- Criado nas tarefas anteriores do F1:
  - `POST /v1/sessao/email`, desafio e cookies (4.0);
  - `/renovar`, `/atividade` e `DELETE /v1/sessao` (5.0);
  - `/v1/eu` básico (4.0);
  - semáforo com 503 e `Retry-After` (14.0), se já existir. Senão, o teste do 503 usa `page.route`.

## Subtarefas

- [ ] 18.1 — Rotas e sessão no cliente.
  - **Roteador:** `wouter` (+2,8 kB), com as rotas `/entrar` e a área autenticada. As rotas de 19.0 e 20.0 entram nelas.
  - **`api/sessao.ts`:** guarda o token só em variável de módulo (nunca `localStorage`, `sessionStorage` nem URL) e o `expiraEm`.
  - **`buscarDaApi`:** manda `Authorization`. No 401, renova uma vez e repete a chamada.
  - **Renovação única:** `navigator.locks.request('educa-renovacao')`, que vale entre abas.
  - **Recarregar a página:** renova pelo cookie antes da primeira consulta.
- [ ] 18.2 — Falhas.
  - **409 `JA_RENOVADO`:** espera a trava e **mais de 2 s** desde o 409, e tenta uma vez com o cookie atual. Os 2 s são a janela da 5.0 (`JANELA_DE_RENOVACAO_SIMULTANEA_MS` e Tech Spec seção 5): dentro dela, o hash anterior é tratado como outra aba renovando junto e recebe 409; depois dela, como resposta perdida, e a API rotaciona de novo. Tentar antes dos 2 s depois de uma resposta perdida devolve outro 409, e o aluno cai para o login.
  - **Resposta de renovação perdida (sem rede):** repete, porque o servidor trata o caso (Tech Spec seção 5).
  - **5xx e sem rede:** mantém token, tela e formulário, e tenta de novo com recuo. Só `NAO_AUTENTICADO` depois da renovação manda para o login.
  - **503 do login com `Retry-After`:** o botão mostra "entrando…" e a web tenta sozinha por até 30 s antes de mostrar a mensagem.
  - **`CONTA_SEGURADA`:** diz em português quanto tempo esperar, a partir do `Retry-After`.
  - **Catálogo:** mensagens novas em `MENSAGENS_DE_ERRO`, em `packages/shared`.
- [ ] 18.3 — Tela `/entrar`.
  - **Campos:** e-mail (`type="email"`, `autocomplete="username"`) e senha (`autocomplete="current-password"`), com rótulo visível.
  - **Estados:** carregando, erro com o que fazer, e o vazio que não se aplica ao formulário. O cabeçalho da área autenticada mostra "Sair" (`DELETE /v1/sessao`).
  - **Etapas seguintes:** `pronta` vai para a área autenticada. `mfa`, `configurar_mfa` e `escolher` levam às rotas de 19.0 e 20.0, que por enquanto mostram "em construção" sem quebrar.
  - **Tamanho:** coluna única a partir de 360 px e botão principal de 44 px.
- [ ] 18.4 — Testes.

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/package.json` (`wouter`), `package-lock.json` | alterado |
| `apps/web/src/api/sessao.ts`, `apps/web/src/api/sessao.test.ts` | novo |
| `apps/web/src/api/cliente.ts`, `apps/web/src/api/cliente.test.ts` | alterado |
| `apps/web/src/main.tsx`, `apps/web/src/rotas.tsx` | alterado, novo |
| `apps/web/src/paginas/Entrar.tsx`, `apps/web/src/componentes/Cabecalho.tsx` | novo |
| `packages/shared/src/erros/mensagens.ts`, `packages/shared/src/sessao/*` (contratos, se ainda faltarem) | alterado |
| `e2e/entrar.spec.ts`, `e2e/__fixtures__/sessao.ts` (pessoas pelo seed e `ops:sessao-sintetica`) | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: professor entra por `/entrar` só com teclado (Tab, Enter) e só com toque, com foco visível, nos projetos `chromebook` e `celular`, e chega à área autenticada | e2e | RF6 e RF20 |
| privacidade: depois do login, `localStorage`, `sessionStorage`, `document.cookie` e a URL não contêm o token | e2e | regra 50, item 7: o próximo aluno do Chromebook não acha nada |
| concorrência: duas abas com o token vencido fazem um só `POST /v1/sessao/renovar` de cada vez (contado em `page.route`), e nenhuma cai no login | e2e | Web Locks, sem família encerrada por reuso |
| borda: 409 `JA_RENOVADO` na segunda renovação espera e repete com o cookie atual, sem mostrar erro | unidade (`sessao.test.ts`) | a janela de 30 s da 5.0 não vira logout |
| borda: resposta da renovação perdida (o cookie continua o anterior): o 409 é seguido de nova tentativa depois de mais de 2 s, que recebe a rotação, sem logout | unidade (`sessao.test.ts`) | a janela de 2 s da 5.0 não vira logout |
| falha: com a rede cortada (`context.setOffline`) ou 503 em uma consulta, a tela e o formulário ficam, e a consulta volta ao religar | e2e | regra 80, item 6: 5xx e sem rede não deslogam |
| borda da rajada: 503 com `Retry-After` no `POST /v1/sessao/email` mostra "entrando…" e entra quando a API aceita, sem mensagem de erro por até 30 s | e2e | o semáforo da 14.0 aparece como atraso |
| borda: `CONTA_SEGURADA` mostra em português quanto esperar, sem código nem status HTTP na tela | e2e | regra 50, item 12 |
| permissão: sem sessão, abrir uma rota autenticada leva a `/entrar`; "Sair" encerra, e Voltar não mostra a tela anterior com dado | e2e | RF13 |
| desempenho: 360 px sem rolagem horizontal, axe sem violação séria, e bundle abaixo de 150 kB em brotli com o `wouter` | e2e e esteira | regra 50, itens 1 e 2a |

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

- `/e/:slug` (matrícula e conta da escola), `/mfa`, `/mfa/configurar` e `/convite#token`: 19.0.
- `/escolher-escola`, seletor de escola, `/vinculos`, timer de inatividade com `POST /v1/sessao/atividade`, e o login por cima da tela preservando o que foi digitado: 20.0.
- Identidade visual: segue a casca neutra do F0 até a decisão em aberto do Gabriel.
- Recuperação de senha por e-mail: F2.

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->
