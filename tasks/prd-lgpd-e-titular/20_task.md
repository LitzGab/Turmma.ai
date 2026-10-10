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

- [ ] 20.1 — Sessão da web: o `ACESSO_SUSPENSO` da renovação tratado em `renovarSessao` (estado `suspensa`, token esquecido, cache esvaziado); "Sair" sem aviso pendente
- [ ] 20.2 — Tela "Acesso suspenso" em `Protegida`: o texto do catálogo e o link para a entrada, sem "Tentar de novo" nem formulário
- [ ] 20.3 — Peças de apoio do e2e: `agendarEliminacaoNoBanco` e `cancelarEliminacaoNoBanco`
- [ ] 20.4 — Testes

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

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão da tarefa carimbado depois da última alteração (`node tools/processo/portao-local.ts --tarefa`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

A API (14.0), as telas da coordenação (16.0 e 17.0) e a segunda aba (`techspec.md` seção 9, "Limite declarado").

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
