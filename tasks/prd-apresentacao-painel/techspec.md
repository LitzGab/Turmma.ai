# Tech Spec — Painel da operação Turmma (A0b)

**PRD:** `tasks/prd-apresentacao-painel/prd.md`
**Status:** aprovada (24/09/2026, `/revisar-spec` rodada 6); clarificações decididas por Claude, com delegação do Joaquim (**Decisão**).

## 1. Resumo da abordagem

Tudo em `/v1/operacao/*`, com `@RotaDeOperacao` (A0). A escrita reaproveita os casos de uso dos
`ops:*`, que passam a receber o **autor conferido dentro da transação** (fecha a pendência 3.0 da A0).
A leitura entre escolas mora num só `PainelRepository`, com `@SemEscopo`. A web ganha Escolas e Uso.

## 2. Módulos afetados

| Módulo | Novo ou alterado | O quê |
|---|---|---|
| `apps/api/src/operacao/` | alterado | `painel.controller.ts`, `painel.service.ts`, `painel.repository.ts`; `OperadorRepository.autorAtivoNaTransacao` |
| `apps/api/src/ops/` (`escola`, `convite-coordenador`, `revogar-convite`, `comando`) | alterado | id do pedido; autor conferido na transação; justificativas "comando ou painel" |
| `apps/api/src/sessao/` (`convite`, `login`, `mfa`) | alterado | gerar, `refazer`, a trava na ativação |
| `packages/nucleo` | alterado | `convite.refeito`; `estadoDaCoordenacao`; migration do índice |
| `packages/shared/src/operacao/painel.ts` | novo | contratos |
| `apps/web/src/operacao/` | alterado | Escolas, Uso e os diálogos |

## 3. Modelo de dados

Nenhuma tabela nova; duas migrations de índice, compatíveis:

```
convite_pendente_unico         único (escola_id, usuario_id) where usado_em is null and revogado_em is null
usuario_coordenador_ativo_idx  (escola_id) where papel = 'coordenador' and desativado_em is null
```

O primeiro é a rede de segurança da trava da 7c (o F1 sempre revoga antes de criar). O segundo serve à lista (tarefa
5.0): sem ele, o `EXPLAIN` mostrou o "há coordenador ativo?" varrendo `usuario` de todas as escolas. `AcaoDeAuditoria` ganha
`convite.refeito`, com `depois: { origemId, usuarioId, expiraEm }`.

## 4. API

Todas `@RotaDeOperacao`, `no-store`, corpo por `z.strictObject` (campo a mais, como `autor`, é 400).

| Método | Rota | Entrada | Saída |
|---|---|---|---|
| GET | `/v1/operacao/redes` | — | até 200 redes: `id, nome, tipo` |
| POST | `/v1/operacao/redes` | `id` (UUID do pedido), `nome`, `tipo` | `id` |
| POST | `/v1/operacao/escolas` | `id` (UUID do pedido), `redeId`, `nome`, `slug` | `id` |
| GET | `/v1/operacao/escolas` | `pagina`, `ordem` (`nome` \| `uso`) | página de 25 + `total` (seção 5) |
| GET | `/v1/operacao/uso` | `pagina`, `ordem` | página de 25 + `total` + `dia` e `mes` de referência |
| POST | `/v1/operacao/escolas/:id/convite-coordenacao` | `nome`, `email` | `conviteId`, `token` |
| POST | `/v1/operacao/convites/:id/refazer` | — | `conviteId`, `token` |
| POST | `/v1/operacao/convites/:id/revogar` | — | nada (204) |

**Decisão:** a resposta leva o `token`; a web monta o link `/convite#<token>` (rota do F1).

## 5. Fluxo

**Autor.** Toda escrita começa por `OperadorRepository.autorAtivoNaTransacao(tx, quem)` (7c): o
`operadorId` da sessão, ou o `OPERADOR` do comando. O apelido é o `autor_operador`; o corpo não chega lá.

**Idempotência.** **Decisão:** a web sorteia um UUID (v4 ou v7, no contrato) ao abrir o diálogo de
rede ou escola e o manda como `id`; o comando sorteia o dele (7c). `rede.criada` segue com escola nula.

**Convite da coordenação.** Só convite `tipo = 'coordenador'`: outro tipo responde `NAO_ENCONTRADO`,
como o inexistente (a A1 traz o de professor). Estado da escola, na função pura `estadoDaCoordenacao`:
`ativa` se há coordenador ativo; senão, pelo último convite de coordenação (maior `expira_em`, depois
`id`): nenhum → `sem_convite`; revogado → `revogado`; não usado e vencido → `vencido`; não usado →
`pendente`; usado, com o usuário dele inativo desde antes do aceite → `aceito` (falta a primeira
entrada); usado, com o usuário desativado depois → `sem_coordenacao`. **Decisão:** os três estados
novos existem para nenhuma escola ficar sem ação.

Gerar, refazer e revogar abrem o contexto da escola, pegam a trava dela (7c) e só então leem o
estado. O servidor decide pela matriz; a tela a espelha:

| Estado | gerar | refazer (do último convite) | revogar |
|---|---|---|---|
| `sem_convite`, `revogado`, `sem_coordenacao` | cria | `CONFLITO` | `CONFLITO` (`revogado`: `NAO_ENCONTRADO`) |
| `pendente`, `vencido` | `CONFLITO` | revoga e cria outro | revoga |
| `aceito` | cria, e o aceite anterior deixa de ativar | `CONFLITO` | revoga |
| `ativa` | `CONFLITO` | `CONFLITO` | `CONFLITO` |

Refazer de convite que não é o último: `CONFLITO`; revogar também (tarefa 2.0), depois de responder `NAO_ENCONTRADO` ao convite já revogado. Gerar em escola inexistente: `NAO_ENCONTRADO`,
antes de criar conta. Refazer grava só `convite.refeito`, no convite novo, com o `origemId`, para o mesmo usuário (nome e e-mail se corrigem
revogando e gerando); a origem sai pelo `update` condicional (só em aberto), e o que ele não revoga é `CONFLITO`; em
`sem_convite` não há convite a passar, e o id inexistente é `NAO_ENCONTRADO` (tarefa 3.0). Revogar em `revogado` fica `NAO_ENCONTRADO`, como no F1.

Gerar em `aceito` e `sem_coordenacao` revoga o último convite na mesma transação, com `convite.revogado`
dele na auditoria; com o mesmo e-mail, o F1 reusa o usuário, e só o convite novo o ativa. **A ativação por convite (aceite, ou login com o
bilhete, com ou sem MFA) pega a mesma trava da escola como primeira instrução da transação** (no aceite,
antes de `usarConvitePorHash`, senão há deadlock); o `update` já exige convite não revogado. **Decisão**, pelo
resultado e não pela corrida: login com senha (e código, no MFA) certos e bilhete válido da conta, cujo
convite já não ativa (revogado antes, ou por um gerar concorrente), entra no outro usuário ativo da conta, se houver;
sem ele, `NAO_ENCONTRADO`, sem `login_falho` e com a reserva do contador desfeita. Senha errada conta
como sempre. O 57014 segue 503 `TEMPO_ESGOTADO`. Com MFA, a senha certa vai ao código e a resposta vem depois dele,
com as duas reservas desfeitas; o que falhar depois da senha ou do código certos (o 57014 da trava) também desfaz a
reserva (tarefa 4.0).

**Decisão:** o `ops:convite-coordenador` segue a mesma regra (hoje ele refaz sozinho); vai no docblock.

**Leitura.** `PainelRepository`, uma consulta por página, com subconsultas por `escola_id`, no ano
`em_curso` de cada escola (sem ele, zero):
- turmas do ano;
- professores: `count(distinct usuario_id)` de vínculo `professor`, `confirmado`, sem `encerrado_em`,
  de usuário ativo. Duas disciplinas na mesma turma contam uma vez;
- alunos: `count(distinct usuario_id)` de vínculo `aluno` sem `encerrado_em`, de usuário ativo.
  **Decisão (pergunta 1 do PRD):** só conta `usuario` ativo com vínculo; a reivindicação pendente, que
  chega no F2, não é `usuario` até a aprovação, e a A1 usa esta definição;
- estado: `coordenadorAtivo` e o último convite, calculado no service pela mesma `estadoDaCoordenacao`
  da escrita; o `conviteId` sai na lista, para o refazer e o revogar;
- uso: o último dia fechado (dia civil de São Paulo, `diaDeUso`) e o mês dele, do dia 1 até o último dia fechado
  (tarefa 5.0: o dia de hoje fica fora também do mês), como o `UsoRepository` (soma, pico de bytes), zero sem linha.

Ordem: `nome`, ou `uso` (requisições do mês, decrescente, calculado para todas antes de paginar);
desempate por `id`; 25 por página (D25). `?pagina=` é o número da página, de 1; a resposta traz `pagina` e `total`, e o
uso também `dia` e `mes` de referência (tarefa 5.0). Uma consulta pela página e uma pelo total.

**Falhas.** Banco fora: 503 `INDISPONIVEL_TENTE_DE_NOVO` (A0). Consolidação atrasada: a data de
referência aparece, e zero sem linha.

## 6. Isolamento

É a exceção da regra 10, item 9. Toda consulta sem escopo que uma rota do painel alcança:

| Repository e método | O que faz | Justificativa |
|---|---|---|
| `PainelRepository.redes`, `escolas`, `uso` (novos) | lista, contagens e uso | painel; só id, nome, slug e número |
| `RedeEEscolaRepository.criarRede`, `criarEscola` | cria, ou lê pelo id | comando ou painel; devolve o id |
| `ResolucaoDeTenantRepository.contaParaConvite` | conta pelo e-mail | a conta é global; comando ou painel |
| `ResolucaoDeTenantRepository.escolaDoConviteParaOperador` | escola do convite | comando ou painel; vira contexto |

O resto roda no contexto da escola, com escopo; só `painel.service.ts` recebe a escola pelo `:id`, e a passa ao caso de uso do gerar, que abre o contexto dela depois de conferir o autor (tarefa 2.0).

Testes: `cenarios.md`, grupo I.

## 7. Dado pessoal

| Item | Resposta |
|---|---|
| Campos tocados | nome e e-mail da coordenadora, digitados no gerar (já no mapa, F1) |
| Novos campos | nenhum; `docs/lgpd.md` não muda |
| Log | `operacao.{rede,escola}.criada`, `operacao.convite.{gerado,refeito,revogado}`, só com ids |
| Auditoria | `rede.criada`, `escola.criada`, `convite.{criado,refeito,revogado}`, com o apelido conferido |
| Leitura e token | contagem não é dado de aluno (sem auditoria de leitura); o token sai só na resposta, e o banco guarda o hash |
| DTO de saída | lista: `id, nome, slug, rede{id,nome}, estado, conviteId?, turmas, professores, alunos`; uso: `id, nome, dia{…}, mes{…}` |

## 7b. Conformidade CNE

Não se aplica: não há IA nem dado de aluno.

## 7c. Carga e falha

| Item | Resposta |
|---|---|
| Caminho quente e limite | nenhum; as oito contam em `rl:op:{sub}` e recusam com 429 (A0); nenhuma é anônima. As sete de entrada da operação (A0) passam a contar por IP no balde próprio `rl:ip:op`, com o teto do anônimo: as que recusavam no `rl:ip` recusam nele, e as `@LimiteQueRebaixa`, que contavam no `rl:ip-login` da escola, rebaixam por ele (tarefa 9.0) |
| Índices, falhas, alerta | os de escopo, com `EXPLAIN` de 30 escolas na tarefa; seção 5; sem alerta novo |

| Trava | Instrução e condições | Na mesma transação | Quem perde recebe | Cenário paralelo |
|---|---|---|---|---|
| Autor ativo | `select … from operador where id/apelido = $1 and desativado_em is null for share` | toda a escrita | 401 `SESSAO_ENCERRADA` (painel), código 2 (comando) | `desativar` junto de cada escrita: ou ela entra com auditoria, ou nada |
| Rede ou escola repetida | `insert … on conflict do nothing returning id` (sem alvo: com o alvo no id, dois pedidos iguais podiam levantar 23505 no índice do slug; tarefa 1.0), e sem linha, `select` pelo id na mesma chamada; slug pela restrição única | a auditoria | mesmo id e dados: o mesmo id, sem segunda auditoria; outros dados, ou outro id com o mesmo slug: `CONFLITO` (23505 mapeado, nunca 500) | dois POST iguais; mesmo id com outros dados; ids diferentes com o mesmo slug |
| Convite da escola | `pg_advisory_xact_lock(7_000_003, hashtext(escola_id::text))`, estado lido depois | conta, usuário, revogação, convite, auditoria | a matriz da seção 5 | E8: no fim, no máximo um convite em aberto |
| Ativação por convite | a mesma trava, primeira instrução; depois o `update` do F1 | uso do convite, ativação, auditoria | seção 5 (`NAO_ENCONTRADO`, sem `login_falho`) | E15 |
| Convite em aberto | índice `convite_pendente_unico`; no refazer, antes dele, o `update` condicional da origem (tarefa 3.0) | — | 23505 vira `CONFLITO`; o `update` que não revoga, também | sem a trava (mutação), só entre convites do mesmo usuário; no refazer, o segundo para na linha da origem |

## 9. Frontend

A casca da A0 ganha **Escolas** (`/operacao`) e **Uso** (`/operacao/uso`), com `pagina` e `ordem` na
query string. Os textos de estado e de mensagem estão no grupo W.

- **Escolas** e **Uso**: tabela; abaixo de 640 px, um cartão por escola (no Uso, dia e mês
  empilhados), sem rolagem horizontal. Estado em texto, cor só de reforço; ações pela matriz da seção
  5. Vazios com a ação seguinte. A troca de página mantém a anterior na tela (`placeholderData`).
- **Nova rede** e **Nova escola** em diálogo; o UUID do pedido nasce ao abrir e morre ao fechar. O slug
  é o "Endereço da escola", com prévia `/e/<slug>` e revisão antes de criar, porque não muda depois.
- **Convite**: antes de enviar, escola, nome, e-mail, validade e "o link aparece uma vez"; depois, o
  link em campo de leitura com Copiar (sem `navigator.clipboard`, seleciona o campo). Fechar sem cópia
  confirmada pergunta antes. O token vive só no diálogo: `gcTime: 0` e `reset()` ao fechar.
- **Refazer e revogar** pedem confirmação; `CONFLITO` tem texto próprio e recarrega a lista. Número,
  bytes e datas em pt-BR (W5).

Quatro estados, teclado, 44 px, 360 px. Chunk até 60 kB brotli (B1); acima, páginas em `operacao-*`.

As ações do convite na linha saem da matriz da seção 5, que mora em `@educa/shared` (`GERAR_`, `REFAZER_` e
`REVOGAR_CONVITE_POR_ESTADO`), junto com os 72 h: o servidor e a tela leem a mesma (tarefa 7.0). Fechar o convite com o
link em risco (pedido no ar, ou link sem cópia) pergunta; o segundo pedido de fechar, na pergunta, fecha (tarefa 7.0).

A navegação da casca nasce com Escolas; o item Uso entra com a tela dele, na 8.0 (tarefa 6.0). O Uso mostra a referência que a API devolveu (o dia e o mês), bytes na base 1024 com uma casa ("1,2 GB"), e a
escola sem uso com zero; a ordem e as páginas das duas telas são as mesmas peças, e criar escola deixa velho também o cache
do Uso (tarefa 8.0). O `/eu` e a tela carregam
juntos: o 503 do `/eu` fica no alto, com "Tentar de novo", e a tela embaixo (tarefa 6.0).

Acabamento da A0 (tarefa 10.0): o segundo fator e o "Sair" do operador devolvem o pedido que já está no ar, como a
renovação, porque o estado da tela não segura dois cliques no mesmo instante; o aceite do convite do operador feito com o
link anterior a um `hashchange` é descartado (`aceitarConviteDeOperadorNaVez`); a entrada limpa a senha também na falha; e
a fronteira de erro do chunk da operação dá título à aba.

## 10. Testes

| Camada | O que será testado |
|---|---|
| Unidade | `estadoDaCoordenacao`; formatadores; contratos estritos |
| Integração | matriz estado × ação; travas da 7c; contagens; uso; paginação; auditoria, log e token |
| E2E | o fluxo do convite até `ativa`; conflito; fechar sem copiar; recomeço; 360 px nas duas telas |
| Isolamento | seção 6 |

A lista fechada, com um identificador por teste, está em `cenarios.md`, parte desta spec.

## 11. Conformidade com as regras

| Regra | Como é atendida | Desvio e justificativa | Documento que registra o desvio |
|---|---|---|---|
| 10, item 9 | seção 6, com teste de arquitetura | lê entre escolas e abre o contexto pelo `:id`; três `@SemEscopo` no `PainelRepository`, o sinal da regra, por ser o único lugar desse alcance (`ops` fica com dois; `sessao` não ganha nenhum); recusada: uma chamada por escola, que o espalharia | `docs/arquitetura.md` (`operacao`), `docs/modelo-de-dados.md` (Operação Turmma) |
| 10, item 7 | o id é UUID | o cliente sorteia o id de rede e escola; recusada: chave de idempotência em tabela ou Redis, mais estado para a mesma garantia | `docs/modelo-de-dados.md` (Estrutura institucional) |
| 00, 20, 50, 80 | DTO estrito, token só na resposta, log por id, quatro estados, 7c | nenhum | — |

## 12. Premissas não verificadas

Nenhuma.

## 13. Riscos técnicos

- **O `ops:convite-coordenador` muda** (seção 5); o índice falha alto com dado de desenvolvimento duplicado.
- **Pendências da A0** (`retro.md` da A0): o `/criar-tasks` as distribui. As métricas de tempo dos
  PRDs da A0 e da A0b são de ensaio, cronometradas na demonstração, e não instrumentadas.
- **Borda**: pública no MVP local; restringe antes do staging (notas do F0).
