# Tarefa 7.0 — Primeiro coordenador entra por convite do operador

**Funcionalidade:** identidade-e-tenancy · **Depende de:** 6.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `test-engineer`

## Objetivo

Depois do contrato, o operador gera o convite do primeiro coordenador sem ver dado de pessoa.
O coordenador abre o link, define a senha e segue para o MFA. Se o e-mail já tem conta porque
a pessoa trabalha em outra escola cliente, o convite não troca a senha: ela entra com a senha
e o MFA que já tem, e só então o usuário da nova escola é ativado.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF1 (escola e convite do primeiro coordenador por comando, sem rota pública de
  cadastro), RF12 (depois do aceite vem o MFA), RF19 (ações do operador registradas)
- `techspec.md`:
  - seção 3: `convite` (esta tarefa cria a tabela) e `usuario` (`conta_id`, `desativado_em`)
  - seção 4: `POST /v1/convites/consultar` e `/aceitar`
  - seção 5: "Convite" (os dois caminhos, conta nova e conta existente) e "Operador"
  - seção 6: a linha "Ler convite por `token_hash`" e "senha no aceite do convite" do
    `ResolucaoDeTenantRepository`
  - seção 7: redact de `*.token`; retenção do convite (expurgo é da 17.0)
- `docs/fluxos.md`, fluxo 1: por que ninguém se cadastra sozinho
- `.claude/rules/20-lgpd-menores.md`, item 8: convite é token único, com expiração, uso único
  e revogação. O token não vai para URL de API, log nem terminal
- `.claude/rules/10-multitenancy.md`, item 6: expirado, revogado e inexistente respondem igual
- `.claude/rules/80-infra-e-carga.md`, item 7: aceite duplo resolvido no banco
- `CLAUDE.md`, D2: não existe cadastro público
- Código existente:
  - `apps/api/src/ops/token-sintetico.ts`: padrão de script `ops:*` com `parseArgs`, validação
    de ambiente e saída sem valor sensível
  - `package.json`: scripts `ops:*`
  - criado na 1.0: `ops:escola`, `RegistroDeAuditoria`
  - criado na 2.0: `ResolucaoDeTenantRepository`, tabelas `conta` e `usuario`
  - criado na 4.0: argon2id, etapas do login e o desafio
  - criado na 6.0: etapa `configurar_mfa`

## Subtarefas

- [x] 7.1 — Migration de `convite` (`escola_id`, `token_hash` único, `tipo` = `coordenador`,
  `usuario_id`, `expira_em` = 72 h, `usado_em?`, `revogado_em?`)
  - `ops:convite-coordenador --escola <slug> --email <e-mail> --nome <nome>`: numa transação,
    acha ou cria a `conta` pelo e-mail (conta nova sem senha), cria o `usuario` coordenador
    com esse `conta_id` e inativo até o aceite, e grava o convite com o SHA-256 do token
  - o token (32 bytes aleatórios) vai para um arquivo com modo 0600, no caminho passado em
    `--saida`; o terminal mostra só o caminho do arquivo
  - `ops:revogar-convite --convite <uuid>` preenche `revogado_em`
  - os dois comandos gravam auditoria com `autor_operador`
- [x] 7.2 — Rotas anônimas, com o token sempre no corpo
  - `POST /v1/convites/consultar { token }` devolve só `{ escolaNome }`
  - `POST /v1/convites/aceitar`, com `update … where usado_em is null and revogado_em is null
    and expira_em > now()`
  - **conta sem senha:** exige `{ token, senha }`, grava o hash, ativa o usuário, grava
    auditoria e responde a etapa `configurar_mfa` com desafio
  - **conta que já tem senha:** recusa o campo `senha`, marca o convite usado e responde a
    etapa `entrar`; o usuário só é ativado quando a pessoa conclui o login por e-mail (e o
    MFA, se tiver), com auditoria. O link nunca troca a senha de conta existente
  - expirado, revogado, usado e inexistente respondem o mesmo erro tipado
- [x] 7.3 — Testes (tabela abaixo)

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/db/schema/convite.ts`, migration em `packages/nucleo/drizzle/` | novo |
| `apps/api/src/ops/convite-coordenador.ts`, `apps/api/src/ops/revogar-convite.ts`, `package.json` | novo e alterado |
| `apps/api/src/sessao/convite.controller.ts`, `convite.service.ts`, `convite.repository.ts` | novo |
| `apps/api/src/sessao/resolucao-de-tenant.repository.ts` (convite por hash, senha no aceite) | alterado |
| `apps/api/src/sessao/login-por-email.service.ts` (ativa o usuário pendente de convite) | alterado |
| `packages/shared/src/sessao/convite.ts` | novo |
| `apps/api/test/convite.int.test.ts`, `apps/api/src/ops/convite-coordenador.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: operador gera o convite, coordenador consulta, aceita com senha e recebe a etapa `configurar_mfa`, sem sessão pronta nem cookie | integração | RF1 e RF12; o aceite não pula o MFA |
| privacidade: o arquivo do token tem modo 0600; o stdout não contém o token; o banco guarda só o hash; o log do aceite não traz o token | integração | regra 20, itens 8 e 9 |
| concorrência: dois `aceitar` em paralelo com o mesmo token definem uma senha e ativam um usuário | integração (concorrência real) | uso único resolvido no banco |
| borda: token expirado (72 h + 1 s, com relógio), revogado, já usado e inexistente dão a mesma resposta em `consultar` e em `aceitar` | integração | não revela se o convite existe |
| isolamento: e-mail que já coordena B, com convite de A: `aceitar` com `senha` é recusado, a senha de B continua a mesma, a resposta é a etapa `entrar`, e o usuário de A só fica ativo depois do login com a senha atual | integração | o link do convite não toma conta de outra escola |
| borda: pessoa com conta existente abandona o fluxo depois de `entrar`; o usuário de A continua inativo e não aparece em `acessos` | integração | ativação só com credencial verificada |
| privacidade: `consultar` devolve só `escolaNome`, e a varredura de DTO não acha e-mail nem nome do convidado | integração | regra 20, item 4 |
| permissão: não existe rota que crie convite pela API; `ops:convite-coordenador` recusa escola inexistente sem imprimir o e-mail | integração | RF1 |

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

- Tela `/convite#token` com `history.replaceState`: 19.0
- Convite de professor e link da sala: F2
- Expurgo do convite 30 dias depois de usado, revogado ou expirado: 17.0
- Envio do convite por e-mail: F2 (no F1 o operador envia à mão)

## Notas da implementação

- **Aceite com conta existente e ativação no login (contradição resolvida).** A tarefa diz que o aceite marca o convite
  como usado; a Tech Spec (seção 5, "Etapas") dizia que o login ativa o usuário com convite "não usado". As duas não
  cabem juntas. Escolhida a leitura que protege a escola: o aceite marca o convite como usado e devolve, com `entrar`,
  um **bilhete** (JWT `convite+jwt`, 30 min, só com a conta e o convite). O login por e-mail só ativa o usuário do
  convite quando traz esse bilhete e a conta que provou a senha é a do bilhete. Sem o bilhete (login rotineiro), ou com
  o bilhete de outra conta, nada é ativado. Assim, um e-mail digitado errado pelo operador não vira acesso de ninguém:
  a pessoa certa tem o link mas não a senha da conta, e a dona da conta tem a senha mas não o link (exigido pelo
  `privacy-guardian` na 1ª rodada). O usuário ativado precisa ainda estar inativo com o convite usado, não revogado e
  aceito depois de ficar inativo (`usado_em >= desativado_em`), o que separa o usuário que espera o convite do usuário
  desativado depois de ter entrado. O prazo depois do aceite é o do bilhete (30 min), e não mais o `expira_em`, que
  valeu no aceite. A Tech Spec foi atualizada (seções 4, 5 e 6).
- **Conta com MFA e bilhete do convite:** a senha certa leva a `mfa` antes de qualquer outra etapa, com o convite no
  desafio, e o usuário de A é ativado pelo `MfaService`, depois do código. Sem MFA, a ativação vem logo depois da senha
  certa. Bilhete que não vale (vencido, forjado, de outra chave) é ignorado, sem mudar a resposta do login.
- **Autor de `convite.aceito`:** é o usuário convidado, também no caminho da conta existente, antes de ele provar a
  credencial: a auditoria exige um autor, e quem aceitou foi quem tinha o link desse usuário. A ativação, com a
  credencial, tem o registro próprio (`usuario.ativado_por_convite`). `convite.criado` registra se a conta do e-mail é
  nova (`contaNova`), sem o e-mail.
- **Revogar depois da ativação** não desfaz a ativação: aí a escola desativa o usuário (17.0).
- **Senha no aceite de conta existente:** é ignorada, e a resposta é `entrar` (a leitura do teste da tabela: "aceitar
  com senha é recusado ... a resposta é a etapa entrar"). Conta sem senha e aceite sem senha: `ENTRADA_INVALIDA`, sem
  gastar o convite. A senha nova tem no mínimo 12 caracteres (`TAMANHO_MINIMO_SENHA_NOVA`).
- **Erro do convite inválido:** `NAO_ENCONTRADO` (404) para expirado, revogado, usado e inexistente, nas duas rotas.
- **Terminal do `ops:convite-coordenador`:** mostra o caminho do arquivo e o id do convite, que o `ops:revogar-convite`
  recebe. O id não é dado de pessoa; token, nome e e-mail nunca saem. O arquivo é criado antes do banco (`wx`, 0600,
  sem sobrescrever), e apagado se o banco falhar. Se a escrita do token falhar depois do commit, o convite fica sem
  token recuperável: o operador gera outro, que revoga o anterior.
- **Convite de novo para o mesmo coordenador:** se ele está inativo, volta a esperar (desativado agora) e os convites
  anteriores são revogados; se está ativo, `CONFLITO`.
- **`acessos` do `/v1/eu`** entra na 12.0, pela leitura de usuários ativos da conta, que já exclui o usuário inativo. O
  teste de abandono prova pelo banco e pelo login seguinte que A continua inativo; o cenário foi acrescentado à 12.0.
- **Auditoria nova:** `convite.criado` e `convite.revogado` (operador), `convite.aceito` e `usuario.ativado_por_convite`
  (o próprio usuário convidado como autor), só com ids, datas e booleanos.

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-18 07:44:03 | 2026-09-18 07:45:29 | `test-engineer` | 1 | APROVADO | a80bc8b8cc0f8e4a5 |
| 2026-09-18 07:49:49 | 2026-09-18 07:50:48 | `revisor-geral` | 1 | REPROVADO | acb6a7a16fb78e481 |
| 2026-09-18 07:50:00 | 2026-09-18 07:51:13 | `privacy-guardian` | 1 | REPROVADO | a0ab113131fbd6b90 |
| 2026-09-18 07:49:54 | 2026-09-18 07:51:17 | `tenancy-guardian` | 1 | APROVADO | a9633aaae3ad326e9 |
| 2026-09-18 07:57:11 | 2026-09-18 07:58:13 | `test-engineer` | 2 | APROVADO | a10bdce87f32c4d86 |
| 2026-09-18 08:02:48 | 2026-09-18 08:03:31 | `privacy-guardian` | 2 | APROVADO | a02beb2eed942681d |
| 2026-09-18 08:02:56 | 2026-09-18 08:03:42 | `tenancy-guardian` | 2 | APROVADO | ae286e4fbee086d57 |
| 2026-09-18 08:03:06 | 2026-09-18 08:03:48 | `revisor-geral` | 2 | APROVADO | a8e64165d0f344c5f |
