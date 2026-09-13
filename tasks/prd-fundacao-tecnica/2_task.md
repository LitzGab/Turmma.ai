# Tarefa 2.0 — Erro tipado e log sem dado pessoal

**Funcionalidade:** fundacao-tecnica · **Depende de:** 1.0
**Subagentes obrigatórios:** `privacy-guardian`, `test-engineer`

## Objetivo

Toda resposta de erro da API passa a ter código tipado e mensagem curta, sem stack nem
detalhe interno. Todo log vira JSON estruturado com `requisicaoId`, sem nome, matrícula,
resposta, nota nem conversa.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF9 (só a parte da API) e RF10; caso de borda "Enzo Martins já existe"
- `techspec.md`: seção 4 (envelope de erro) e seção 7 (o que vai para log, redact)
- `.claude/rules/20-lgpd-menores.md`, itens 9 e 11: log só com id, erro curto e tipado
- `.claude/rules/00-arquitetura.md`, item 9: erro de domínio tipado, nunca string
- `.claude/rules/50-frontend.md`, item 12: a mensagem diz o que fazer
- `docs/lgpd.md`, seção 4 (furos "Log com dado pessoal" e "Mensagem de erro")
- Código existente: `apps/api/src/main.ts` e `packages/nucleo` (esqueleto da 1.0)

## Subtarefas

- [x] 2.1 — `packages/shared/src/erros`: enum `CodigoDeErro` (`ERRO_INTERNO`,
  `ENTRADA_INVALIDA`, `NAO_ENCONTRADO`, `CONFLITO`, `TEMPO_ESGOTADO`,
  `INDISPONIVEL_TENTE_DE_NOVO`, `LIMITE_EXCEDIDO`) e o catálogo de mensagens em pt-BR que
  dizem o que fazer
- [x] 2.2 — `packages/nucleo/src/contexto`: AsyncLocalStorage com `requisicaoId`, e com
  `escolaId` e `usuarioId` opcionais, que a 4.0 preenche. Aceita `X-Requisicao-Id` do
  cliente só se for UUID; se não for, gera um
- [x] 2.3 — `packages/nucleo/src/log`: pino com redact em `*.nome`, `*.matricula`,
  `*.email`, `*.senha`, `*.resposta`, `*.nota`, `*.conversa`, `*.prompt`, `authorization`
  e `cookie`, e com os campos do contexto em toda linha
- [x] 2.4 — `packages/nucleo/src/erro`:
  - `ErroDeDominio` com código e status
  - filtro global que devolve `{ erro: { codigo, mensagem, requisicaoId } }`
  - mapeamento do erro do Postgres: 23505 → `CONFLITO`, 57014 → `TEMPO_ESGOTADO`, o resto →
    `ERRO_INTERNO`
  - o log do erro do Postgres leva só o código SQL e o nome da constraint, nunca `detail`
    nem mensagem
- [x] 2.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/shared/src/erros/codigo-de-erro.ts`, `mensagens.ts` | novo |
| `packages/nucleo/src/contexto/contexto.ts` | novo |
| `packages/nucleo/src/log/logger.ts` | novo |
| `packages/nucleo/src/erro/erro-de-dominio.ts`, `filtro-global.ts`, `mapear-erro-postgres.ts` | novo |
| `apps/api/src/main.ts` | alterado |
| testes em `packages/nucleo/test/` e `apps/api/test/` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: exceção não tratada vira `ERRO_INTERNO` com `requisicaoId`, sem stack, SQL ou valor | integração | quebra se o filtro global sair |
| borda: violação de unicidade com "Enzo Martins" no `detail`: nem a resposta nem o log capturado contêm a string | integração (Postgres real) | o `detail` do banco não vaza |
| borda: redact cobre `aluno.nome`, `nota` aninhada e `authorization` | unidade | nenhum caminho do redact ficou de fora |
| concorrência: 50 requisições das escolas sintéticas A e B em paralelo (`Promise.all`); cada linha de log tem o próprio `requisicaoId` e escola | integração | o contexto não vaza entre requisições |
| permissão: `X-Requisicao-Id` do cliente fora do formato UUID é substituído | integração | não há injeção no log |

A escola do teste de concorrência pode ser preenchida direto no contexto; o token só chega
na 4.0.

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] `npm run typecheck` limpo
- [x] E2E verde (não tocou tela; rodado mesmo assim, porque o boot da API mudou)
- [x] Vetos aprovados (se aplicáveis)
- [x] Revisão aprovada
- [x] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

Seguir o `requisicaoId` pela fila e pelo worker (7.0). Guarda de lint contra log pessoal
(3.0). Token e escola vindos do JWT (4.0).
