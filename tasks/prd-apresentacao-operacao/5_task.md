# Tarefa 5.0 — O operador aceita o convite e cria a senha

**Funcionalidade:** apresentacao-operacao (A0) · **Depende de:** 4.0
**Subagentes obrigatórios:** `privacy-guardian`, `infra-guardian`, `tenancy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Quem recebeu o convite do `ops:operador` confere se ele vale e, aceitando, cria a senha e recebe o
desafio de etapa `configurar_mfa`. O segundo fator em si é da 7.0.

## Contexto necessário

- `docs/visao-produto.md`
- `techspec.md` seções 4 (as duas rotas de convite), 5 ("Travas no banco": aceite; "Limite": grupos
  de `convite/consultar` e `convite/aceitar`; "Etapas") e 7
- `cenarios.md`: C7, C9–C11, C21, C32, C33, C39
- `.claude/rules/20-lgpd-menores.md` (itens 6, 8 e 9), `40-testes.md`, `80-infra-e-carga.md` (itens
  1 e 7)
- Código do F1, que faz o mesmo para a coordenação:
  - `apps/api/src/sessao/convite.controller.ts` e `convite.service.ts` — consultar e aceitar pelo
    token do `#`, com `update` condicional
  - `apps/api/src/sessao/desafio.ts` e `packages/nucleo/src/identidade/verificar-token.ts` — o
    desafio de 5 min; aqui nasce o `typ: desafio-operador+jwt`
  - `apps/api/src/sessao/senha/` — hash de senha e o semáforo do hash (rebaixamento por IP)
  - `packages/nucleo/src/limite/guarda-limite.ts` — `@LimiteQueRebaixa` e o limite anônimo `rl:ip`
  - `apps/api/test/convite.int.test.ts` — os casos do convite do coordenador, que servem de molde

## Subtarefas

- [x] 5.1 — `POST /v1/operacao/convite/consultar` com `@EntradaDeOperacao`: diz se o convite vale;
  usado, vencido, revogado e inexistente respondem igual; limite anônimo `rl:ip` recusável
- [x] 5.2 — `POST /v1/operacao/convite/aceitar` com `@EntradaDeOperacao`: senha com as regras do F1,
  `update ... set usado_em = now() where ... usado_em is null and revogado_em is null and expira_em >
  now()` junto de `desativado_em is null`; devolve desafio `configurar_mfa`; rebaixa por IP no
  semáforo do hash
- [x] 5.3 — Desafio `desafio-operador+jwt` com `jti` (o consumo do `jti` é da 7.0) e
  `Cache-Control: no-store` nas respostas com desafio
- [x] 5.4 — Contratos estritos em `packages/shared/src/operacao/convite.ts`
- [x] 5.5 — Testes (tabela abaixo)

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/operacao/convite-operador.controller.ts`, `convite-operador.service.ts` | novo |
| `apps/api/src/operacao/desafio-de-operador.ts` | novo |
| `apps/api/src/operacao/operador.repository.ts` | alterado |
| `apps/api/src/operacao/operacao.module.ts` | alterado |
| `packages/nucleo/src/identidade/verificar-token.ts` | alterado |
| `packages/shared/src/operacao/convite.ts` | novo |
| `apps/api/test/convite-operador.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| C9 | integração | usado, vencido, revogado e inexistente: status e corpo iguais, em `consultar` e em `aceitar` |
| C7 (parte) | integração | depois de `ops:operador convite`, o link antigo responde igual a revogado |
| C11 | integração | operador desativado com convite pendente não aceita |
| C21 | integração | o desafio devolvido pelo `aceitar` não serve de bearer em nenhuma rota, de operação ou de escola |
| C32 (parte) | integração | `convite/consultar` acima do `rl:ip` responde 429 `LIMITE_EXCEDIDO` com `Retry-After` |
| C33 (parte) | integração | `convite/aceitar` acima do limite do IP não responde 429: rebaixa no semáforo do hash |
| C39 (parte) | integração | a resposta do `aceitar` tem `no-store`; o contrato recusa campo a mais na entrada e não deixa sair campo a mais |
| borda: vencido às 72 h | integração | com relógio controlado, o convite vale às 71h59 e responde igual a inexistente às 72h01 |
| permissão | integração | credencial de escola nunca produz desafio de operador pelo `aceitar` |
| concorrência: C10 | integração | dois `aceitar` com o mesmo token em `Promise.all`: uma senha gravada, o outro recusado com erro tipado |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`,
  com `--e2e` se tocou tela e `--infra` se mexeu em infra)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que
  vale para o código atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Divergências resolvidas nesta tarefa

- **O aceite troca a senha que houver e zera o segundo fator** (segredo, chave, ativação, último passo e códigos de
  recuperação), na mesma transação da trava. O F1 nunca troca a senha de uma conta existente pelo link; aqui é o
  contrário, porque o convite novo é o caminho de recuperar a conta (PRD da A0, seção 3, "Recuperar senha … por comando,
  com novo convite", e seção 7, "Operador perde o app autenticador … novo convite por comando"), e a resposta é sempre
  `configurar_mfa`: sem zerar, o `configurar` (trava `where mfa_ativado_em is null`) nunca aceitaria. As sessões abertas
  do operador não são encerradas no aceite: o `motivo` de encerramento é uma lista fechada por check (3.0), sem motivo
  para isso, e cada sessão termina sozinha em 8 h. Quem perdeu a conta para outra pessoa é desativado (`ops:operador
  desativar`), que encerra tudo.
- **A trava do aceite começa pelo `for update` da linha do operador ativo**, a mesma que o `desativar` trava primeiro, e
  só então usa o convite com o `update` condicional da Tech Spec. A consulta do convite, antes do hash, também exige o
  operador ativo; a trava repete as condições porque entre as duas o convite pode ser revogado, vencer ou o operador ser
  desativado (três testes com barreira no hash), e o `for update` põe o aceite na fila do `desativar` que travou a linha
  antes (teste com a transação do `desativar` aberta, sem deadlock). O `update` da senha repete `desativado_em is null`.
- **`consultar` devolve só `{ valido: true }`**: a Tech Spec diz "se o convite vale", e nem o apelido nem o nome saem
  para quem só tem o link.
- **O `SessaoModule` fica global e exporta o `SemaforoDeHash` e o `HashDeSenha`**, como o `BancoModule` e o
  `LimiteModule` já são: o semáforo tem de ser o mesmo do login (o teto é das threads da instância), e o `OperacaoModule`
  não pode montar outro.
- **O convite que não vale sai antes do hash**, sem pedir vez no semáforo, como no F1. Com o token de 256 bits não há
  conta a contar: o que o `@LimiteQueRebaixa` faz no aceite é só rebaixar a vez no balde da equipe, com a subfila pelo
  IP. O contador `login.rebaixado_ip` não conta o aceite: ele é do login por senha.
- **`bearerDeOperador` reconhece também o `desafio-operador+jwt`**: numa rota de escola com sessão, o desafio do operador
  responde igual a uma rota inexistente (C21 e a parte "desafio" do C47), e não o 401 do token recusado.
- **O desafio do operador tem `aud: operacao`**, além do `typ` próprio, e `verificarDesafioDeOperador` nasce aqui, com
  teste de unidade, sem consumir o `jti` (7.0). As etapas (`configurar_mfa`, `mfa`) ficam em
  `apps/api/src/operacao/desafio-de-operador.ts`, e não em `packages/shared`: a web não lê o desafio.
- **O `token-do-convite.ts` usa o `hashDoToken` e o `BYTES_DO_TOKEN_DE_CONVITE` do F1** (recomendação do revisor-geral
  na 3.0): uma implementação só do hash do token.
- **Arquivos a mais que a lista previa:** `apps/api/src/operacao/desafio-de-operador.test.ts`,
  `apps/api/src/operacao/token-do-convite.ts`, `apps/api/src/sessao/sessao.module.ts`,
  `packages/nucleo/src/identidade/token-de-operador.test.ts`, os barrels de `packages/shared` e `packages/nucleo`, e
  `apps/api/test/convite.int.test.ts`, cuja lista das rotas com "convite" (RF1 do F1) passa a trazer as duas do operador,
  que também só consultam e aceitam.

## Fora do escopo desta tarefa

- Consumir o `jti` e configurar o segundo fator (7.0); o C13 é de lá
- Entrar por e-mail e senha (6.0)
- A tela do convite (11.0)

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-23 23:14:55 | 2026-09-23 23:16:30 | `test-engineer` | 1 | REPROVADO | a7f12a9e2fba13a8b |
| 2026-09-23 23:17:50 | 2026-09-23 23:18:13 | `test-engineer` | 2 | APROVADO | a9f3d02c26a12fdb0 |
| 2026-09-23 23:18:19 | 2026-09-23 23:18:57 | `revisor-geral` | 1 | REPROVADO | adbec612882d02011 |
| 2026-09-23 23:18:22 | 2026-09-23 23:19:04 | `privacy-guardian` | 1 | APROVADO | aaccc6583c6ff758b |
| 2026-09-23 23:18:25 | 2026-09-23 23:19:10 | `infra-guardian` | 1 | APROVADO | a0bf8cbcfab99a275 |
| 2026-09-23 23:18:29 | 2026-09-23 23:19:11 | `tenancy-guardian` | 1 | APROVADO | a4ad20ab7020dab6a |
| 2026-09-23 23:46:02 | 2026-09-23 23:46:10 | `revisor-geral` | 2 | APROVADO | ab5b3a5827cbf62b1 |
