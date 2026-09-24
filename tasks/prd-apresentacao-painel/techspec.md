# Tech Spec — Painel da operação Turmma (A0b)

**PRD:** `tasks/prd-apresentacao-painel/prd.md`
**Status:** rascunho (24/09/2026); clarificações decididas por Claude, com delegação do Joaquim (**Decisão**).

## 1. Resumo da abordagem

Tudo em `/v1/operacao/*`, com `@RotaDeOperacao` (guarda de operador e `rl:op`, da A0). A escrita
reaproveita os casos de uso dos `ops:*` (`criarRede`/`criarEscola` de `ops/escola.ts`, o convite de
`sessao/convite.service.ts`), que passam a receber o **autor conferido dentro da transação**: isso fecha
também a pendência da 3.0 da A0 (`OPERADOR` conferido fora da trava). A leitura entre escolas mora num
só `PainelRepository`, com `@SemEscopo`. A web ganha as telas Escolas e Uso, no chunk `operacao-*`.

## 2. Módulos afetados

| Módulo | Novo ou alterado | O quê |
|---|---|---|
| `apps/api/src/operacao/` | alterado | `painel.controller.ts`, `painel.service.ts`, `painel.repository.ts`; `OperadorRepository.autorAtivoNaTransacao` |
| `apps/api/src/ops/` (`escola`, `convite-coordenador`, `revogar-convite`, `comando`) | alterado | id do pedido; autor conferido na transação; justificativas "comando ou painel" |
| `apps/api/src/sessao/convite.service.ts`, `convite.repository.ts` | alterado | gerar por `escolaId`, `refazer`, trava por escola |
| `packages/nucleo` | alterado | ação `convite.refeito`; `estadoDaCoordenacao` (função pura); migration do índice |
| `packages/shared/src/operacao/painel.ts` | novo | contratos estritos |
| `apps/web/src/operacao/` | alterado | páginas Escolas e Uso, diálogos, navegação da casca |

## 3. Modelo de dados

Nenhuma tabela nova. Uma migration só de índice, compatível com o código anterior:

```
convite_pendente_unico  único (escola_id, usuario_id) where usado_em is null and revogado_em is null
```

Rede de segurança da trava da 7c; o F1 sempre revoga antes de criar, então nenhuma linha o viola.
`AcaoDeAuditoria` ganha `convite.refeito`, com `depois: { origemId, usuarioId, expiraEm }`, sem nome
nem e-mail.

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

**Decisão:** a resposta leva o `token`, e a web monta o link `/convite#<token>` (rota do F1) com a
própria origem. Erros: `NAO_ENCONTRADO`, `CONFLITO`, `SESSAO_ENCERRADA` (seção 5).

## 5. Fluxo

**Autor.** Toda escrita começa por `OperadorRepository.autorAtivoNaTransacao(tx, quem)` (7c): no painel,
o `operadorId` do contexto; no comando, o `OPERADOR`, com a regra do bootstrap. O apelido devolvido é
o `autor_operador`; nada do corpo chega lá (RF6).

**Idempotência.** **Decisão:** a web sorteia um UUID ao abrir o diálogo de rede ou escola e o manda
como `id`; o comando sorteia o dele. Repetido, o repository lê a linha pelo id (7c). Slug de outra
escola continua `CONFLITO`.

**Convite da coordenação.** Estado de uma escola, na função pura `estadoDaCoordenacao`:
`ativa` se há coordenador ativo; senão, pelo último convite de coordenação (maior `expira_em`, depois
`id`): nenhum → `sem_convite`; revogado → `revogado`; usado → `pendente` (aceito, falta entrar);
vencido → `vencido`; senão `pendente`. **Decisão:** `sem_convite` entra, para a escola recém-criada.

Gerar, refazer e revogar abrem o contexto da escola (a do `:id`, ou a do convite por
`escolaDoConviteParaOperador`), pegam a trava da escola (7c) e só então leem o estado:
- **gerar** só em `sem_convite` ou `revogado`; senão `CONFLITO`. Escola inexistente: `NAO_ENCONTRADO`,
  pelo nome lido no contexto, antes de criar conta ou usuário. O resto é o fluxo do F1.
- **refazer** só do último convite, pelo `update` condicional da 7c; cria o novo para o mesmo usuário e
  grava `convite.refeito`. Não troca nome nem e-mail: para isso, revogar e gerar.
- **revogar**: o do F1, agora sob a trava.

**Decisão:** o `ops:convite-coordenador` segue a mesma regra (hoje ele refaz sozinho); vai no docblock.

**Leitura.** `PainelRepository`, uma consulta por página, com subconsultas por `escola_id`, no ano
`em_curso` de cada escola (sem ele, zero):
- turmas do ano;
- professores: `count(distinct usuario_id)` de vínculo `professor`, `confirmado`, sem `encerrado_em`,
  de usuário ativo. Duas disciplinas na mesma turma contam uma vez;
- alunos: `count(distinct usuario_id)` de vínculo `aluno` sem `encerrado_em`, de usuário ativo.
  **Decisão (pergunta 1 do PRD):** reivindicação pendente não conta (vira `usuario` só na aprovação), e
  a A1 usa esta definição;
- estado: `coordenadorAtivo` e o último convite, calculado no service pela mesma `estadoDaCoordenacao`
  da escrita; o `conviteId` sai na lista, para o refazer e o revogar;
- uso: o último dia fechado e o mês dele, como o `UsoRepository` (soma, pico de bytes), zero sem linha.

Ordem: `nome`, ou `uso` (requisições do mês, decrescente); desempate por `id`; 25 por página (D25).

**Falhas.** Banco fora: 503 `INDISPONIVEL_TENTE_DE_NOVO` (A0). Consolidação atrasada: a data de
referência aparece, e zero sem linha.

## 6. Isolamento

É a exceção da regra 10, item 9. Toda consulta sem escopo que uma rota do painel alcança:

| Repository e método | O que faz | Justificativa |
|---|---|---|
| `PainelRepository.redes`, `escolas`, `uso` (novos) | lista rede e escola, contagens e uso | painel do operador; só id, nome, slug e número |
| `RedeEEscolaRepository.criarRede`, `criarEscola`, `pedidoRepetido` | cria; lê a linha do mesmo id | comando ou painel do operador; devolve só o id |
| `ResolucaoDeTenantRepository.contaParaConvite` | acha ou cria a conta pelo e-mail | a conta é global; comando ou painel do operador |
| `ResolucaoDeTenantRepository.escolaDoConviteParaOperador` | escola de um convite | comando ou painel do operador; a escola vira contexto |

O resto roda no contexto da escola, com escopo; só `painel.service.ts` abre o contexto pelo `:id`.

Testes:
- **arquitetura**: só `painel.service.ts` importa o `PainelRepository`, cujos `@SemEscopo` são
  exatamente os três; `IMPORTADORES_PERMITIDOS_DO_COMANDO` ganha só `painel.service.ts`, com o título
  do teste reescrito; as varreduras geradas da A0 (C36, C41, C46) cobrem as rotas novas
- **isolamento**: sessão de escola recebe o 404 de rota inexistente nas oito rotas; duas escolas com
  contagens diferentes, cada uma com a sua
- **sentinela (RF3)**: nome e e-mail da coordenadora, nome e matrícula de aluno e nome de turma
  sentinela não aparecem em nenhuma resposta das oito rotas, inclusive de erro

## 7. Dado pessoal

| Item | Resposta |
|---|---|
| Campos tocados | nome e e-mail da coordenadora, digitados no gerar (já no mapa, F1) |
| Novos campos | nenhum; `docs/lgpd.md` não muda |
| Log | `operacao.rede.criada`, `operacao.escola.criada`, `operacao.convite.{gerado,refeito,revogado}`, com `operadorId`, `escolaId`, `conviteId`; nunca nome, e-mail, slug nem token |
| Auditoria | `rede.criada`, `escola.criada`, `convite.criado`, `convite.refeito`, `convite.revogado`, na escola, com o apelido do autor conferido |
| Leitura | contagem não é dado de aluno: sem auditoria de leitura |
| Token | só na resposta do gerar e do refazer; o banco guarda o hash |
| DTO de saída | lista: `id, nome, slug, rede{id,nome}, estado, conviteId?, turmas, professores, alunos`; uso: `id, nome, dia{…}, mes{…}`; nunca nome nem e-mail de pessoa |

## 7b. Conformidade CNE

Não se aplica: não há IA nem dado de aluno.

## 7c. Carga e falha

| Item | Resposta |
|---|---|
| Caminho quente? | nenhum: poucos operadores, fora da aula |
| Rate limit | as oito contam em `rl:op:{sub}` e recusam com 429 (A0, C36 gerado); nenhuma é anônima; um teste de 429 no `POST /escolas` |
| Índices | os de escopo; `EXPLAIN` da lista com 30 escolas na tarefa |
| Falhas e alerta | seção 5; sem alerta novo |

| Trava | Instrução e condições | Na mesma transação | Quem perde recebe | Cenário paralelo |
|---|---|---|---|---|
| Autor ativo | `select … from operador where id/apelido = $1 and desativado_em is null for share` | toda a escrita | 401 `SESSAO_ENCERRADA` (painel), código 2 (comando) | `desativar` e criar escola juntos, com a trava segurada: ou tudo com auditoria antes, ou nada |
| Rede ou escola repetida | `insert … on conflict (id) do nothing returning id` | a auditoria | o mesmo id, sem segunda auditoria; outros dados: `CONFLITO` | dois POST iguais: uma linha, uma auditoria, o mesmo id nos dois |
| Convite da escola | `pg_advisory_xact_lock(7_000_003, hashtext(escola_id))`, estado lido depois | conta, usuário, revogação, convite, auditoria | `CONFLITO`; revogar já revogado: `NAO_ENCONTRADO` | dois gerar; gerar e refazer; dois refazer; refazer e revogar: no fim, no máximo um convite em aberto |
| Convite em aberto | índice `convite_pendente_unico` | — | 23505 vira `CONFLITO` | o mesmo cenário sem a trava (mutação) continua com um só |

## 9. Frontend

A casca da A0 ganha navegação **Escolas** (`/operacao`, no lugar da tela vazia) e **Uso**
(`/operacao/uso`). `pagina` e `ordem` vão na query string (não são dado sensível).

- **Escolas**: tabela; abaixo de 640 px, cartões, sem rolagem horizontal. Estado em texto, cor só de
  reforço; vazio convida a criar a primeira rede. Por linha: convidar (`sem_convite`, `revogado`),
  refazer e revogar (`pendente`, `vencido`).
- **Nova rede** e **Nova escola** em diálogo; o UUID do pedido nasce ao abrir e morre ao fechar.
- **Convite**: nome e e-mail; antes de enviar, o que vai acontecer ("vale 72 h, o link aparece uma
  vez"); depois, o link em campo de leitura, com Copiar. Fechar sem copiar pergunta antes. O token vive
  só no estado do diálogo.
- **Refazer e revogar** pedem confirmação; `CONFLITO` diz "o convite mudou" e recarrega a lista.
- **Uso**: dia fechado e mês lado a lado, com a data de referência.

Quatro estados, teclado, alvo de 44 px, 360 px. Teto do chunk: 60 kB brotli (B1 da A0); se passar,
as páginas viram chunks `operacao-*`, que o B2 confere.

## 10. Testes

| Camada | O que será testado |
|---|---|
| Unidade | `estadoDaCoordenacao` nos seis casos, com a data na borda das 72 h; contratos estritos (campo `autor` recusado) |
| Integração | as travas da 7c com `Promise.all`; contagens com as bordas do PRD (duas disciplinas, aluno desativado, vínculo encerrado, ano anterior, sem ano em curso, sem uso); 30 escolas paginadas nas duas ordens; auditoria com o apelido da sessão; log sem nome, e-mail, slug nem token; `ops:convite-coordenador` com convite em aberto |
| E2E | cria rede e escola, gera e copia o link; a coordenadora ativa; a lista mostra `ativa`; refazer e revogar; recomeço: recarregar não mostra o link, e o segundo operador na aba não vê a lista do primeiro; `chromebook` e `celular`, com axe |
| Isolamento | seção 6 |

## 11. Conformidade com as regras

| Regra | Como é atendida | Desvio e justificativa | Documento que registra o desvio |
|---|---|---|---|
| 10, item 9 | seção 6, com teste de arquitetura | lê entre escolas e abre o contexto pelo `:id`; recusada: uma chamada por escola, que espalharia o alcance pelo módulo | `docs/arquitetura.md` (`operacao`), `docs/modelo-de-dados.md` (Operação Turmma) |
| 10, item 7 | o id é UUID | o cliente sorteia o id de rede e escola; recusada: chave de idempotência em tabela ou Redis, mais estado para a mesma garantia | `docs/modelo-de-dados.md` (Estrutura institucional) |
| 00, 20, 50, 80 | DTO estrito, token só na resposta, log por id, quatro estados, travas da 7c | nenhum | — |

## 12. Premissas não verificadas

Nenhuma dependência externa.

## 13. Riscos técnicos

- **O `ops:convite-coordenador` muda de comportamento** (seção 5).
- **Índice sobre dado antigo**: falha alto se houver dois convites em aberto da mesma pessoa, o que só
  pode existir em banco de desenvolvimento.
- **Pendências da A0** (`retro.md` da A0, 19 linhas): o `/criar-tasks` as distribui; a do
  `conferirOperador` sai aqui (seção 5). As métricas de tempo dos PRDs da A0 e da A0b são de ensaio,
  cronometradas na demonstração, e não instrumentadas: medir o operador não serve à escola.
- **Borda**: pública no MVP local; a restrição antes do staging segue em `notas-staging.md` do F0.
