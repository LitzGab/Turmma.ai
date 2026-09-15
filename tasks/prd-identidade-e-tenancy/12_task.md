# Tarefa 12.0 — Quem trabalha em mais de uma escola escolhe e troca

**Funcionalidade:** identidade-e-tenancy · **Depende de:** 4.0, 6.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `test-engineer`

## Objetivo

A professora que dá aula no colégio A e na escola B entra uma vez, escolhe a escola e troca
depois pelo seletor. Cada troca cria outra sessão presa à escola de destino e encerra a de
origem, sem levar dado de uma escola para a outra. Ao terminar, `POST /v1/sessao/escola`
funciona e `/v1/eu` lista os acessos da conta.

## Contexto necessário

- `docs/visao-produto.md` (sempre), com atenção a Camila (seção 4) e à ideia "cada escola é um
  mundo fechado" (seção 6)
- `prd.md`: RF14 e RF15; caso de borda "Professor sai em março de uma das duas escolas"
- `techspec.md`:
  - seção 1: o token leva o `usuario` da escola ativa;
  - seção 4: `POST /v1/sessao/escola` e `GET /v1/eu`;
  - seção 5: "Etapas" (desafio `escolher`) e "Troca de escola", que encerra a sessão de origem na mesma transação, com motivo `troca_de_escola`;
  - seção 6: desvio "Ler usuários ativos da conta" e os testes de troca e de `escolher`;
  - seção 7: `/v1/eu` sem dado de outra escola além de `escolaNome` e papel.
- `.claude/rules/10-multitenancy.md`, itens 3, 5 e 6: a escola de destino nunca vem do
  cliente, só o `usuarioId`, que é conferido contra a conta da sessão ou do desafio. Id de outra
  conta dá o mesmo 404 de inexistente
- `.claude/rules/50-frontend.md`, item 13: seletor de escola no topo (a tela é da 20.0)
- `.claude/rules/60-dominio.md`, item 8a: um usuário pode ter vínculo em várias escolas, cada
  um preso ao tenant
- `.claude/rules/70-conformidade-cne.md`, item 8, e regra 20, item 10a: nada de indicador de
  professor aqui, mas a troca não pode abrir a visão da coordenação de uma escola para quem é
  só professor nela
- Código existente:
  - `packages/nucleo/src/contexto/contexto.ts`: a identidade só é gravada uma vez por requisição;
  - `packages/nucleo/src/identidade/verificar-token.ts`: o formato do token.
- O que as tarefas anteriores criam:
  - `EmissorDeToken`, `GuardaDeSessao` e `ResolucaoDeTenantRepository` (criados na 2.0);
  - desafio com `typ`, `aud` e `jti`, etapa `escolher` e `GET /v1/eu` básico (criados na 4.0);
  - família e rotação de sessão (criados na 5.0);
  - etapa `mfa` e `configurar_mfa` (criados na 6.0).

## Subtarefas

- [ ] 12.1 — `POST /v1/sessao/escola` com `{ usuarioId }`.
  - **Com desafio `escolher`:** o `usuarioId` precisa estar entre os usuários ativos da `conta_id` do desafio, pelo `ResolucaoDeTenantRepository`. Aí grava a sessão (etapa `pronta`) ou leva a `configurar_mfa`/`mfa` quando o destino é coordenador. O `jti` é consumido só na conclusão.
  - **Com token de acesso:** só vale se `sessao.metodo = email`. Sessão de matrícula ou externa recebe 404.
  - **`usuarioId` de outra conta, desativado ou inexistente:** o mesmo 404.
- [ ] 12.2 — Troca, numa transação.
  - **Sessão:** cria a nova na escola de destino (família nova, `conta_id` igual) e encerra a de origem com motivo `troca_de_escola`.
  - **Destino:** aplica a inatividade dele (`inatividade_equipe_min` ou de aluno) e o MFA quando o papel de destino é coordenador. Nesse caso a resposta é um desafio `mfa` ou `configurar_mfa`, e a sessão de origem só encerra quando o MFA é concluído.
  - **Registro:** grava `registro_acesso` (`login` na escola de destino).
  - **`GET /v1/eu`:** passa a devolver `acessos:[{ usuarioId, escolaNome, papel }]` só com os usuários ativos da conta, sem ids de turma, vínculo nem nada da outra escola.
  - **Aluno:** não tem conta, então `acessos` vem vazio.
- [ ] 12.3 — Testes (tabela abaixo). A web limpa o cache ao trocar na 20.0; aqui a prova é
  no servidor.

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sessao/troca-de-escola.controller.ts`, `troca-de-escola.service.ts` | novo |
| `apps/api/src/sessao/resolucao-de-tenant.repository.ts` | alterado (usuários ativos da conta) |
| `apps/api/src/sessao/eu.controller.ts` | alterado (`acessos`) |
| `packages/shared/src/sessao/troca-de-escola.ts`, `eu.ts` | novo ou alterado |
| `apps/api/test/troca-de-escola.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: conta com professor em A e B entra por e-mail, recebe `escolher`, escolhe A, e depois troca para B; a sessão de A fica encerrada com motivo `troca_de_escola` | integração | RF14 e a regra de encerrar a origem |
| isolamento: depois da troca para B, `GET /v1/turmas/:id` com a turma do vínculo em A e o token novo dá 404 igual a inexistente | isolamento | quebra se a sessão nova não ficar presa a B |
| isolamento: o token antigo de A, depois da troca, recebe 401 na requisição seguinte | isolamento | origem encerrada de fato |
| isolamento: `escolher` e troca com `usuarioId` de outra conta, real e ativo em B, dão 404 igual a inexistente | isolamento | quebra se o `usuarioId` não for conferido contra a conta |
| borda: professor em A e coordenador em B; ir para B exige MFA, e sem concluir o MFA a sessão de A continua válida e nenhuma sessão de B existe | integração | o MFA do destino vale na troca |
| borda: destino com inatividade de 60 min e origem com 120; a sessão nova vence pela regra do destino | integração | inatividade do destino |
| permissão: sessão de matrícula e sessão externa em `POST /v1/sessao/escola` dão 404 | integração | só sessão de e-mail troca |
| borda: professor desativado em B (saiu em março) não aparece em `acessos`, e a troca para B dá 404; o acesso a A continua | integração | fim de vínculo numa escola não afeta a outra |
| concorrência: duas trocas em paralelo com o mesmo token para B criam uma sessão de B e encerram A uma vez | concorrência | transação com trava na sessão de origem |
| privacidade: `/v1/eu.acessos` só tem `usuarioId`, `escolaNome` e `papel`; a varredura de DTO da 2.0 passa | integração | RF18 |

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

- Tela `/escolher-escola` e seletor no cabeçalho, com limpeza do cache: 20.0
- Troca para quem entrou pela conta Google ou Microsoft (leva ao login da outra escola): o
  comportamento da web é da 20.0, e o login externo é da 13.0
- Redefinição de MFA entre escolas: 6.0

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->
