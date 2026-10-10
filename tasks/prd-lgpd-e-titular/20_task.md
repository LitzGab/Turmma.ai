# Tarefa 20.0 — Quem tem a eliminação agendada vê que o acesso está suspenso

**Funcionalidade:** lgpd-e-titular · **Depende de:** 14.0 · **Paralelo com:** 16.0 a 18.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`, `infra-guardian`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Quando a renovação responde `ACESSO_SUSPENSO`, a aba encerra a sessão, esvazia o cache e mostra a tela "Acesso suspenso", com o texto do catálogo e o caminho para a entrada.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `techspec.md` seção 9 ("Login suspenso": é o desenho desta tarefa)
- `.claude/rules/50-frontend.md` e `80-infra-e-carga.md` (item 6: 5xx nunca desloga)
- Código: `apps/web/src/api/sessao.ts` (`renovarSessao`, `encerrarNaApi`, `encerrarLocalmente`), `apps/web/src/rotas.tsx` (`Protegida`) e `apps/web/src/paginas/SemDesafio.tsx` (o molde da tela)
- `cenarios.md`, RF14, "perda de acesso": as linhas `(tarefa 20.0)`

## Subtarefas

- [x] 20.1 — Sessão da web: o `ACESSO_SUSPENSO` da renovação tratado em `renovarSessao` (estado `suspensa`, token esquecido, cache esvaziado); "Sair" sem aviso pendente
- [x] 20.2 — Tela "Acesso suspenso" em `Protegida`: o texto do catálogo e o link para a entrada, sem "Tentar de novo" nem formulário
- [x] 20.3 — Peças de apoio do e2e: `agendarEliminacaoNoBanco` e `cancelarEliminacaoNoBanco`
- [x] 20.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/api/sessao.ts` e `sessao.test.ts` | alterado |
| `apps/web/src/rotas.tsx` | alterado |
| `apps/web/src/paginas/AcessoSuspenso.tsx` | novo |
| `e2e/__fixtures__/sessao.ts` | alterado |
| `e2e/acesso-suspenso.spec.ts` | novo |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| renovação recusada | unidade | 403 ao abrir pelo cookie e com a sessão aberta: `suspensa`, sem token, `aoTrocarDeSessao` uma vez; 503 segue `indisponivel` |
| estado final | unidade | em `suspensa` nenhuma chamada sai; o 401 atrasado não muda o estado; "Sair" e inatividade não deixam `saidaPendente`; o link deixa `anonima` |
| aluno com a aba aberta | e2e | o texto, sem "Tentar de novo", campo, "Sua sessão expirou" nem o nome dele; link `/e/<slug>`; a senha certa mostra o texto e não entra; cancelado, entra. Acessibilidade, 360 px, teclado |
| recomeço: Chromebook do carrinho | e2e | o colega entra na mesma aba, com o `/v1/eu` segurado: nada do anterior aparece |
| professora suspensa em A, ativa em B | e2e | recarrega: a tela, link `/entrar`; o segundo F5 cai na entrada; o e-mail entra em B, sem A no seletor |
| duas abas | e2e | a primeira mostra a tela; a segunda, o login por cima, em que a senha certa mostra o texto e não abre sessão |

Do recomeço, "mesma entrada de novo" é o segundo F5; a tela não tem diálogo.

## Como testar

- **unidade:** `apps/web/src/api/sessao.test.ts › cookie que não vale mais deixa a aba anônima…` e `› API fora do ar não desloga…` (`responderCom`, `envelope`), com 403 `ACESSO_SUSPENSO`.
- **aluno:** `e2e/inatividade.spec.ts › sessão encerrada no servidor: o aluno recebe o login da matrícula por cima…`, com `agendarEliminacaoNoBanco` no lugar de `encerrarSessoesDoUsuario`.
- **carrinho e duas abas:** no mesmo arquivo, `› Chromebook do carrinho…` e `› duas abas, uma sessão…` (`context.newPage()`).
- **professora:** `criarUsuarioEmOutraEscola`, como `e2e/entrar.spec.ts › etapa escolher…`.
- As peças novas ficam ao lado de `desativarUsuario` (`e2e/__fixtures__/sessao.ts`) e gravam `usuario.eliminacao_agendada_em`. Não use `falharCom(403)`: esconde o cookie apagado.
- Rodar: `npx vitest run --project unidade apps/web/src/api/sessao.test.ts`; `node tools/ci/e2e.ts --manter-ambiente e2e/acesso-suspenso.spec.ts`, sempre com o arquivo.
- Armadilha da 6.0: Mutação só vale com o teste vermelho.
- **Telas:** "Acesso suspenso", de `aluno` e `professora`, sem mockup. A vitrine não chega ao estado: diga em "Telas vistas".

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão da tarefa carimbado depois da última alteração (`node tools/processo/portao-local.ts --tarefa`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

A API (14.0), as telas da coordenação (16.0 e 17.0) e a segunda aba (`techspec.md` seção 9, "Limite declarado").

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|
| `suspensa` não vale depois de `anonima`: a renovação que estava no ar e volta 403 depois do "Sair" não devolve a aba à tela; `renovarSessao` e `chamarComSessao` recusam em `suspensa` com `ACESSO_SUSPENSO`, e o link só age em `suspensa` e troca a entrada do histórico (`replace`) | Detalhe que a seção 9 não fechava: sem a barreira, a saída pedida pela pessoa deixaria de ser final (a mesma razão do `vencida`); sem a recusa em `suspensa`, o cache esvaziado refaz a consulta da tela que ainda está montada e a chamada sai sem credencial | `techspec.md` §9, "Login suspenso", item "Como ficou no código (tarefa 20.0)"; `cenarios.md` RF14, "perda de acesso", as duas linhas novas `(tarefa 20.0)` |

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|
| `sessao.ts` › `encerrarLocalmente` › `destino === 'suspensa' && estado === 'anonima'` | `sessao.test.ts` › "a renovação que estava no ar e volta 403 depois do "Sair" não devolve a aba a suspensa" |
| `sessao.ts` › `renovarSessao` › `if (estado === 'suspensa') return Promise.reject(…ACESSO_SUSPENSO)` | `sessao.test.ts` › "suspensa, nenhuma chamada sai da aba…", "o "Sair" da aba suspensa…" e "a inatividade que vence na aba suspensa…" |
| `sessao.ts` › `renovarSessao` › `if (ehCodigo(erro, ACESSO_SUSPENSO)) suspenderSessao()` | `sessao.test.ts` › "a aba que abre pelo cookie fica suspensa…", "a aba com a sessão aberta, cujo token vencido…" e "a consulta recusada com 401 e depois…" |
| `sessao.ts` › `abrirSessaoPeloCookie` › `if (estado === 'suspensa') return` | `sessao.test.ts` › "suspensa, nenhuma chamada sai da aba…" (a abertura vira `indisponivel`) |
| `sessao.ts` › `abrirSessaoPeloCookie` › `if (estadoDaSessao() === 'suspensa') return` (no `catch`) | `sessao.test.ts` › "a aba que abre pelo cookie fica suspensa…" |
| `sessao.ts` › `chamarComSessao` › `if (estado === 'suspensa') throw …ACESSO_SUSPENSO` | `sessao.test.ts` › "suspensa, nenhuma chamada sai da aba…" |
| `sessao.ts` › `chamarComSessao` › `durante === 'suspensa'` | `sessao.test.ts` › "o 401 que volta atrasado, depois de a aba ficar suspensa…" |
| `sessao.ts` › `encerrarNaApi` › `ehCodigo(erro, ACESSO_SUSPENSO)` | `sessao.test.ts` › "o "Sair" cujo token vencido é renovado e recusado…" e "o "Sair" da aba suspensa…" |
| `sessao.ts` › `sairDaSessaoSuspensa` › `if (estado === 'suspensa')` | `sessao.test.ts` › "o link da tela não encerra uma sessão que por acaso está aberta" |
| `sessao.ts` › `encerrarLocalmente` › `if (destino === 'anonima') quemEstaNaAba = undefined` (mantida em `suspensa`) | `sessao.test.ts` › "a memória de quem estava fica na aba suspensa…" |
| `AcessoSuspenso.tsx` › `quem?.papel === 'aluno'` (trocado por `quem !== undefined`) | `acesso-suspenso.spec.ts` › "duas abas…" (o link da professora é `/entrar`), nos dois projetos |
| `AcessoSuspenso.tsx` › `quem?.papel === 'aluno' ? caminhoDaEscola(…) : ROTAS.entrar` (sempre `/entrar`) | `acesso-suspenso.spec.ts` › "o aluno com a aba aberta…" e "recomeço no Chromebook do carrinho…" |
| `AcessoSuspenso.tsx` › `<Link replace>` | `acesso-suspenso.spec.ts` › "o aluno com a aba aberta…" (`history.length` igual) |
| `AcessoSuspenso.tsx` › `onClick={sairDaSessaoSuspensa}` | `acesso-suspenso.spec.ts` › "o aluno com a aba aberta…" (o endereço protegido, sem recarregar, leva à entrada) |
| `AcessoSuspenso.tsx` › `useTituloDaTela('Acesso suspenso')` | `acesso-suspenso.spec.ts` › "o aluno com a aba aberta…" (`toHaveTitle`) |
| `AcessoSuspenso.tsx` › `role="alert"` | `acesso-suspenso.spec.ts` › "o aluno com a aba aberta…" e "a professora suspensa na escola A…" |
| `rotas.tsx` › `Protegida` › `if (estado === 'suspensa') return <AcessoSuspenso />` | os quatro cenários de `acesso-suspenso.spec.ts`, nos dois projetos |

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª), revisor-geral (1ª) | `e2e/acesso-suspenso.spec.ts:25` copia `INTERVALO_DA_ATIVIDADE_MIN = 5` em vez de importar a constante do relógio de inatividade | Recusada: a constante vive em `apps/web/src/sessao/inatividade.ts`, que importa React e `api/sessao`; carregá-lo no Node do Playwright é risco maior que a cópia, que já existe em `e2e/inatividade.spec.ts:28`. Fica para o dia em que a constante for para `packages/shared`: `TODO.md` |
| infra-guardian (1ª) | Teste de `deveTentarDeNovo` com `ACESSO_SUSPENSO` em `apps/web/src/api/cliente-de-consultas.ts:16`, para a garantia de "nenhuma nova tentativa" não depender só da lista fechada de códigos | `TODO.md`: o arquivo (e o teste dele) não é da tarefa; uma tarefa que o toque a cobre |
| infra-guardian (1ª) | Contar, na segunda aba do e2e, as chamadas à renovação, em vez de provar só pela ausência do cookie | Recusada: o limite da segunda aba é declarado na `techspec.md` §9 ("Limite declarado") e está fora do escopo desta tarefa; na aba `vencida`, `renovarSessao` já recusa sem chamada (`sessao.ts:436`) |
| revisor-geral (1ª), frontend-reviewer (1ª) | O link de `AcessoSuspenso` repete o de `SemDesafio.tsx`, e o aviso usa o token `pendente` para dizer "bloqueado": componente comum ou token/variante "aviso" | `TODO.md`: refatoração que mexe em `SemDesafio.tsx`, fora da tarefa; vale quando houver uma terceira tela igual |
| frontend-reviewer (1ª) | O texto "suspenso a pedido" é legível por quem olha a tela depois, no carrinho | Do `/validar`: o texto é do catálogo, escolha declarada na Tech Spec §9; confirmar com a coordenação na validação |
| privacy-guardian (1ª) | `quemEstaNaAba` (id, papel e slug) fica na aba suspensa até o clique; se um dia carregar mais (nome, por exemplo) deixa de ser inofensivo | Do `/retro`: já está em `achados/20_task.md`; nenhuma ação agora |
| revisor-geral (2ª) | Em `AcessoSuspenso.tsx:24`, trocar "até o clique no link" por "enquanto a aba está `suspensa`" no comentário da leitura de `quemEstaNaSessao()`: a memória também muda se alguém entrar de novo na mesma aba por rota pública (`sessao.ts:263`) | Não aplicar: revisor que aprovou, e a regra da Mesa só reabre ordem com recomendação de quem reprovou; o comentário não esconde bug (nesse caso a aba sai de `suspensa` e a tela deixa de ser montada). Anotada em `achados/20_task.md`; a tarefa futura que tocar `AcessoSuspenso.tsx` ajusta |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-10 19:35:27 | 2026-10-10 19:41:48 | `test-engineer` | 1 | APROVADO | a28a3221844addc14 |
| 2026-10-10 19:42:09 | 2026-10-10 19:42:34 | `infra-guardian` | 1 | APROVADO | a5f5e0555c5a099e3 |
| 2026-10-10 19:42:11 | 2026-10-10 19:42:42 | `frontend-reviewer` | 1 | APROVADO | a38c962a5c563dd6c |
| 2026-10-10 19:42:06 | 2026-10-10 19:42:48 | `privacy-guardian` | 1 | APROVADO | a885a55c85c6a3d38 |
| 2026-10-10 19:42:03 | 2026-10-10 19:42:53 | `revisor-geral` | 1 | APROVADO | a79aa18d862b482e6 |
| 2026-10-10 19:48:05 | 2026-10-10 19:48:50 | `test-engineer` | 2 | APROVADO | ae5f632416c85a4bb |
| 2026-10-10 19:49:05 | 2026-10-10 19:49:25 | `revisor-geral` | 2 | APROVADO | a2a3cf443bfa2405e |
