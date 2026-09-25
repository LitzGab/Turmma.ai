# Tarefas — Painel da operação Turmma (A0b)

**PRD:** `prd.md` · **Tech Spec:** `techspec.md` · **Cenários:** `cenarios.md`
**Status:** 5 de 10 concluídas

Aprovadas por delegação do Joaquim em 24/09/2026 ("faça tudo e aprove até criar as tasks"). As 9.0 e
10.0 levam as pendências da A0 (`tasks/prd-apresentacao-operacao/retro.md`, "Pendências para a A0b")
que não cabem numa tarefa que já mexe no mesmo código.

## Lista

- [x] **1.0 — Rede e escola pelo painel, com o autor conferido na transação**
  - [x] 1.1 `OperadorRepository.autorAtivoNaTransacao`; os cinco `ops:*` de escola passam a conferir o
    `OPERADOR` dentro da transação da escrita
  - [x] 1.2 `criarRede`/`criarEscola` com o `id` do pedido e `on conflict (id) do nothing`
  - [x] 1.3 `GET /redes`, `POST /redes`, `POST /escolas`, com contratos estritos em `packages/shared`
  - [x] 1.4 Documentos do desvio: `docs/arquitetura.md` (`operacao`) e `docs/modelo-de-dados.md`
  - [x] 1.5 Testes: E1–E5, E11 (criar escola, e pelo comando), E12, E14, I2, I3, A3 (rede e escola)

- [x] **2.0 — Convite da coordenação pelo painel: estado, trava, gerar e revogar**
  - [x] 2.1 `estadoDaCoordenacao`; índice `convite_pendente_unico`
  - [x] 2.2 Trava da escola; gerar por `escolaId` e revogar pela matriz; filtro `tipo = 'coordenador'`
  - [x] 2.3 `POST /escolas/:id/convite-coordenacao` e `POST /convites/:id/revogar`; os `ops:*` de convite
    na mesma regra
  - [x] 2.4 Testes: A4, E6 (gerar e revogar), E7, E8 (sem refazer), E10, E11 e E13 (convite), I7, A2 e A3
    (gerar e revogar)

- [x] **3.0 — Refazer o convite da coordenação**
  - [x] 3.1 `refazer` com o `update` condicional, `convite.refeito`
  - [x] 3.2 `POST /convites/:id/refazer`
  - [x] 3.3 Testes: E6 (refazer), E8 (pares com refazer), E9, E11 (refazer), A1, A2 e A3 (refazer)

- [x] **4.0 — Ativação por convite sob a trava da escola, e a senha certa que não conta**
  - [x] 4.1 A trava como primeira instrução no aceite e em `AtivacaoPorConvite.ativar`
  - [x] 4.2 Login e MFA: convite que já não ativa → outro usuário ativo, ou `NAO_ENCONTRADO` sem
    `login_falho` e com a reserva desfeita
  - [x] 4.3 Texto do `NAO_ENCONTRADO` na entrada da escola
  - [x] 4.4 Testes: E6 (login), E15, E16, W10 (entrada da escola)

- [x] **5.0 — Leitura entre escolas: lista e uso**
  - [x] 5.1 `PainelRepository` (`redes`, `escolas`, `uso`), com `@SemEscopo`
  - [x] 5.2 `GET /escolas` e `GET /uso`, com o estado pela `estadoDaCoordenacao`
  - [x] 5.3 `EXPLAIN` com 30 escolas
  - [x] 5.4 Testes: I1, I4, I5, I6, L1–L4

- [ ] **6.0 — Web: Escolas, Nova rede e Nova escola**
  - [ ] 6.1 Navegação da casca; tela Escolas (tabela e cartões, quatro estados, página e ordem)
  - [ ] 6.2 Diálogos Nova rede e Nova escola, com o UUID do pedido e a revisão do endereço
  - [ ] 6.3 Testes: W6 (Escolas), W7 (Escolas e Nova escola), W8 (criar escola), W10 (estados e
    mensagens de rede e escola)

- [ ] **7.0 — Web: o convite da coordenação**
  - [ ] 7.1 Gerar com resumo, link uma vez, Copiar com reserva, fechar sem copiar
  - [ ] 7.2 Refazer e revogar com confirmação; `CONFLITO` com texto próprio
  - [ ] 7.3 Testes: W1, W2, W3, W4, W8 (convite), W9, W10 (convite)

- [ ] **8.0 — Web: Uso**
  - [ ] 8.1 Tela Uso (tabela e cartões, quatro estados), com os formatadores
  - [ ] 8.2 Testes: W5, W6 (Uso), W7 (Uso)

- [ ] **9.0 — Acabamento da A0 na API e no worker**
  - [ ] 9.1 Auditoria do aceite do operador; o motivo `convite_aceito` encerra as sessões da conta
  - [ ] 9.2 Falha do `contador.zerar` depois do commit da sessão vira log; `rl:ip:op` próprio
  - [ ] 9.3 Expurgo: `order by` no lote de `convite_operador`; o `{} as Record` trocado
  - [ ] 9.4 `SessaoModule` global em `docs/arquitetura.md`
  - [ ] 9.5 Testes que faltaram na A0 (tabela da tarefa)

- [ ] **10.0 — Acabamento da A0 na web e no e2e**
  - [ ] 10.1 Fronteira de erro com `document.title`; a senha sai do estado depois de falha; o aceite
    em andamento durante um `hashchange`
  - [ ] 10.2 Renovações em paralelo; clique duplo em "Entrar" do segundo fator e em "Sair"
  - [ ] 10.3 O e2e semeia o convite com `hashDoTokenDeConvite`; E5 no nome do teste
  - [ ] 10.4 `tabelasSemEscola` reconhece o DDL escrito à mão, ou falha diante do que não reconhece

## Dependências e paralelismo

| Tarefa | Depende de | Pode correr em paralelo com |
|---|---|---|
| 1.0 | — | 9.0, 10.0 |
| 2.0 | 1.0 | — |
| 3.0 | 2.0 | — |
| 4.0 | 2.0, 3.0 (a E15(d) usa o refazer) | 5.0 |
| 5.0 | 3.0 (a I6 cobre as oito rotas) | 4.0 |
| 6.0 | 1.0, 5.0 | — |
| 7.0 | 3.0, 6.0 | 8.0 |
| 8.0 | 5.0, 6.0 (casca e `api/painel.ts`) | 7.0 |
| 9.0 | — | 1.0 a 8.0 |
| 10.0 | — | 1.0 a 5.0 (não com 6.0 a 8.0, que mexem em `apps/web/src/operacao/`) |

Paralelo aqui quer dizer "sem dependência de código": os commits continuam um por vez, na `develop`,
com a esteira do anterior verde. `apps/api/test/arquitetura.test.ts` é alterado pela 1.0, pela 5.0 e pela
10.0: quem vier depois parte do arquivo já commitado. A última tarefa de API (5.0) confere que as
varreduras da I3 enxergam exatamente as oito rotas.

## Subagentes por tarefa

| Tarefa | Subagentes obrigatórios |
|---|---|
| 1.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian` |
| 2.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian` |
| 3.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian` |
| 4.0 | `infra-guardian`, `privacy-guardian`, `tenancy-guardian`, `frontend-reviewer` |
| 5.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian` |
| 6.0 | `frontend-reviewer`, `privacy-guardian` |
| 7.0 | `frontend-reviewer`, `privacy-guardian` |
| 8.0 | `frontend-reviewer` |
| 9.0 | `privacy-guardian`, `infra-guardian`, `tenancy-guardian` |
| 10.0 | `frontend-reviewer`, `privacy-guardian` |

`test-engineer` (primeiro) e `revisor-geral` em todas.

## Critério de pronto da funcionalidade

Do `ROADMAP.md` (A0b), detalhado:

- O operador cria rede e escola e copia o convite da coordenação, que abre e ativa a conta dela (W1,
  nos projetos `chromebook` e `celular`)
- A lista mostra a escola nova com as contagens e o uso do dia (L1, L2, L4)
- Nenhuma resposta do painel traz nome, e-mail, matrícula ou conteúdo de pessoa da escola (I6)
- Toda ação fica na auditoria da escola com o operador (E1, E6, A1)
- Todas as travas aguentam as corridas (E2, E4, E8, E9, E11, E15)
- Os cenários de `cenarios.md` têm cada um o seu teste, citado pelo identificador
- As pendências da A0 da tabela do `retro.md` têm destino: feitas na 9.0 e na 10.0, ou decididas por
  escrito na tarefa
