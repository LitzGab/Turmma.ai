# Tarefas — Identidade do operador Turmma (A0)

**PRD:** `prd.md` · **Tech Spec:** `techspec.md` · **Cenários:** `cenarios.md`
**Status:** 1 de 11 concluídas

## Lista

- [x] **1.0 — Tokens da D72 no tema do `apps/web` e os componentes compartilhados na pele nova**
  - [x] 1.1 Tokens da seção 9.9 no `@theme`, ao lado da paleta atual
  - [x] 1.2 Os 10 componentes de `apps/web/src/componentes/` migrados (botão primário, foco, link)
  - [x] 1.3 Logotipo pelos SVGs de `mockups/public/marca/`
  - [x] 1.4 Testes: os hex dos tokens no CSS servido; o e2e do F1 continua verde

- [ ] **2.0 — As telas do F1 na pele da D72, com as guardas de estilo estritas**
  - [ ] 2.1 As 12 telas do F1 migradas e a paleta antiga removida
  - [ ] 2.2 `estilos.test.ts` só com os nomes do `@theme` e sem modificador de opacidade
  - [ ] 2.3 `e2e/casca.spec.ts` confere os hex e reprova `oklch(` e `color-mix(`
  - [ ] 2.4 Orçamento de 150 kB brotli só para a entrada
  - [ ] 2.5 Testes: U3, E5, B1 (entrada)

- [ ] **3.0 — O operador nasce por comando**
  - [ ] 3.1 Migration das seis tabelas da seção 3 da Tech Spec
  - [ ] 3.2 `OperadorRepository`
  - [ ] 3.3 `ops:operador` (`criar`, `desativar`, `convite`), com bootstrap e lock
  - [ ] 3.4 `comando.ts` confere o `OPERADOR` em todo `ops:*`
  - [ ] 3.5 Testes: C1–C5, C6 (sem sessão), C7 (único parcial), C8, C45, U1

- [ ] **4.0 — Marcadores e cercas entre a operação e a escola**
  - [ ] 4.1 `@RotaDeOperacao`, `@EntradaDeOperacao` e o `rotaSemSessao`
  - [ ] 4.2 `GuardaDeOperador` e `verificarTokenDeOperador`; token de operador em rota de escola → 404
  - [ ] 4.3 `rl:op` na `GuardaDeLimite`; `GET /v1/operacao/eu`
  - [ ] 4.4 Testes: C6 (sessão encerrada), C35, C36 (`rl:op`), C40–C42, C46 (com sessão), C47 (fixture),
    C48, C49

- [ ] **5.0 — Convite do operador: consultar e aceitar**
  - [ ] 5.1 `convite/consultar` e `convite/aceitar`, com a senha
  - [ ] 5.2 Desafio `configurar_mfa` com `typ` próprio; limite e rebaixamento
  - [ ] 5.3 Testes: C7 (link antigo), C9–C11, C21, C32 (consultar), C33 (aceitar), C39 (aceitar)

- [ ] **6.0 — Entrada por e-mail e senha**
  - [ ] 6.1 `sessao/email`, com o contador `login-op:` e a origem
  - [ ] 6.2 Regra das 72 h do `configurar_mfa`; `entrada_falha` sem e-mail
  - [ ] 6.3 Testes: C15, C22–C25, C33 (e-mail), U2

- [ ] **7.0 — Segundo fator do operador**
  - [ ] 7.1 `mfa/configurar` com a trava da linha e a versão do segredo
  - [ ] 7.2 `sessao/mfa` numa transação só, com ativação, códigos e a sessão
  - [ ] 7.3 `jti` de uso único e cookie `turmma_operacao`
  - [ ] 7.4 Testes: C6b (com as recomendações da rodada 8), C12–C14, C16–C20, C18b, C34, C32 e C39
    (MFA), C47 com o cookie de verdade

- [ ] **8.0 — Sessão do operador: renovar, sair e os prazos**
  - [ ] 8.1 `sessao/renovar` e `sessao/sair`; 30 min e 8 h; `ultimoUsoEm`
  - [ ] 8.2 401 `ACESSO_VENCIDO` e `SESSAO_ENCERRADA`; 503 com o banco fora
  - [ ] 8.3 `AcessoOperacao` e os registros da seção 5
  - [ ] 8.4 Testes: C26–C31, C32 e C39 (sessão), C36 e C36b (`rl:ip`), C37, C43, C44, C46 (entrada)

- [ ] **9.0 — Expurgo das tabelas da operação e a linha do runbook**
  - [ ] 9.1 Alvos novos no `apagarLoteVencido`, com a justificativa reescrita
  - [ ] 9.2 Linha no `docs/runbook.md`: com o Redis fora, o caminho é `ops:*`
  - [ ] 9.3 Testes: C38, e a entrada do expurgo no C45

- [ ] **10.0 — Web do operador: chunk, sessão, casca, entrar e MFA**
  - [ ] 10.1 Chunk `operacao-*.js` com fallback e fronteira de erro
  - [ ] 10.2 Sessão em memória própria, sem resíduo da pessoa anterior
  - [ ] 10.3 Casca da operação e as telas de entrar e de código
  - [ ] 10.4 Testes: E2–E4, B1 (chunk), B2

- [ ] **11.0 — Web do operador: convite e configurar o segundo fator**
  - [ ] 11.1 Tela do convite, com o token do `#`
  - [ ] 11.2 Configurar: QR, chave em texto, `otpauth://`, códigos uma vez
  - [ ] 11.3 Testes: E1

## Dependências e paralelismo

| Tarefa | Depende de | Pode correr em paralelo com |
|---|---|---|
| 1.0 | — | 3.0 a 8.0 |
| 2.0 | 1.0 | 3.0 a 8.0 |
| 3.0 | — | 1.0, 2.0 |
| 4.0 | 3.0 | 1.0, 2.0 |
| 5.0 | 4.0 | 1.0, 2.0 |
| 6.0 | 5.0 | 1.0, 2.0 |
| 7.0 | 6.0 | 1.0, 2.0 |
| 8.0 | 7.0 | 1.0, 2.0 |
| 9.0 | 3.0, 8.0 | 10.0, 11.0 |
| 10.0 | 2.0, 8.0 | 9.0 |
| 11.0 | 10.0 | 9.0 |

Na `develop`, as duas trilhas se alternam: um commit por tarefa, e a seguinte só commita com a
esteira do anterior verde (regra 40).

## Subagentes por tarefa

`test-engineer` (primeiro) e `revisor-geral` em todas, marcados ou não.

| Tarefa | Subagentes obrigatórios |
|---|---|
| 1.0 | `frontend-reviewer` |
| 2.0 | `frontend-reviewer` |
| 3.0 | `tenancy-guardian`, `privacy-guardian` |
| 4.0 | `tenancy-guardian`, `infra-guardian`, `privacy-guardian` |
| 5.0 | `privacy-guardian`, `infra-guardian`, `tenancy-guardian` |
| 6.0 | `privacy-guardian`, `infra-guardian` |
| 7.0 | `privacy-guardian`, `infra-guardian`, `tenancy-guardian` |
| 8.0 | `infra-guardian`, `privacy-guardian`, `tenancy-guardian` |
| 9.0 | `privacy-guardian`, `tenancy-guardian`, `infra-guardian` |
| 10.0 | `frontend-reviewer`, `privacy-guardian` |
| 11.0 | `frontend-reviewer`, `privacy-guardian` |

## Critério de pronto da funcionalidade

Do `ROADMAP.md`, detalhado:

- O operador aceita o convite gerado pelo `ops:operador`, cria a senha, configura o segundo fator e
  entra na casca da operação, em `chromebook` e em `celular` (E1)
- Credencial de uma área responde na outra igual a rota inexistente, nos dois sentidos, com a lista
  de rotas gerada (C46, C47), e nenhuma rota escapa das guardas de escola sem cair na de operador
  (C40–C44, C48)
- Toda entrada fica em `AcessoOperacao`, e toda mudança de operador em `AuditoriaOperacao` (C37),
  com o expurgo nos prazos (C38)
- As travas do segundo fator e da sessão aguentam as corridas de `cenarios.md` (C3, C5, C6b, C10,
  C12, C18, C18b, C19, C20, C30)
- O `apps/web` inteiro está na pele da D72, sem `oklch(` nem `color-mix(` no CSS servido, com o e2e
  do F1 verde (U3, E5), e a web da escola não baixa o código da operação (B1, B2)
- Os 62 cenários de `cenarios.md` têm teste, cada um citado na sua tarefa
