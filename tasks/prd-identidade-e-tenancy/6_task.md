# Tarefa 6.0 — Coordenador só acessa com MFA

**Funcionalidade:** identidade-e-tenancy · **Depende de:** 4.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `test-engineer`

## Objetivo

O coordenador passa a entrar só com o segundo fator: configura um app autenticador (que roda
no computador, sem celular), recebe códigos de recuperação e, nos logins seguintes, digita o
código. Outro coordenador da mesma escola, ou o operador a pedido formal, redefine o MFA de
quem perdeu tudo.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF12 (MFA sem celular), RF19 (redefinição de MFA registrada) e o caso de borda
  "Único coordenador perde o app autenticador e os códigos"
- `techspec.md`:
  - seção 3: `conta` (`mfa_segredo_cifrado`, `mfa_chave_versao`, `mfa_ativado_em`,
    `mfa_ultimo_passo`) e `codigo_recuperacao`; tabela de migrations (esta tarefa cria
    `codigo_recuperacao`)
  - seção 4: bloco "Desafio" e as rotas `/v1/sessao/mfa`, `/v1/conta/mfa/configurar`,
    `/ativar` e `/v1/usuarios/:id/mfa/redefinir`
  - seção 5: "Tentativas" (MFA no mesmo contador, com `HMAC(conta_id)`, quinto erro consome o
    `jti`), "Etapas" e "TOTP"; "Operador" (`ops:redefinir-mfa`)
  - seção 6: a linha "Ler conta por `conta_id`" e "Escrever na conta" do
    `ResolucaoDeTenantRepository`, e os testes de redefinir MFA em A e B
  - seção 7: redact (`*.segredo`, `*.codigo`, `*.recuperacao`, `*.codigosRecuperacao`, `*.uri`)
    e a exceção nominal da varredura de DTO para `configurar` e `ativar`
- `.claude/rules/20-lgpd-menores.md`: itens 10 (redefinição de MFA é alteração de
  permissão, vai para auditoria) e 11 (erro curto e tipado)
- `.claude/rules/10-multitenancy.md`, itens 6 e 9: a conta é global, então redefinir a partir
  de uma escola não pode alcançar quem também trabalha em outra, e a resposta não pode revelar
  isso
- `.claude/rules/50-frontend.md`, item 2: nada exige celular. O segredo sai em texto, além da
  URI, para colar no KeePassXC, Bitwarden ou 1Password desktop
- `.claude/rules/80-infra-e-carga.md`, item 7: corrida resolvida no banco (passo e código de
  recuperação com `update` condicional)
- `docs/lgpd.md`, seção 2: linha "Segredo TOTP cifrado e HMAC dos códigos de recuperação"
- Código existente:
  - `packages/nucleo/src/config/validar-config.ts`: padrão de leitura de variável obrigatória
    (`IDENTIDADE_CHAVE_CIFRA_V{n}` e a chave do HMAC entram assim)
  - `packages/nucleo/src/log/logger.ts`: `CHAVES_PESSOAIS` e `CAMINHOS_REDACT`
  - `packages/nucleo/src/erro/erro-de-dominio.ts` e `packages/shared/src/erros/codigo-de-erro.ts`
  - criado na 1.0: `RegistroDeAuditoria.gravar(tx, acao, dados)`
  - criado na 2.0: `ResolucaoDeTenantRepository`, `@Permite`, `MATRIZ`, `GuardaDeSessao`
  - criado na 4.0: emissão do desafio (etapas `configurar_mfa` e `mfa`), contador de
    tentativas no Redis de fila com seguro em memória, código `MFA_NECESSARIO`

## Subtarefas

- [x] 6.1 — Migration de `codigo_recuperacao` (`conta_id`, `hmac`, `usado_em?`). Rotas
  `POST /v1/conta/mfa/configurar` e `/ativar`, aceitas só com desafio de etapa
  `configurar_mfa` e com `mfa_ativado_em` nulo
  - segredo gerado pelo `otpauth` (SHA1, 6 dígitos, 30 s) e gravado com AES-256-GCM, com
    `conta_id` como AAD e a versão da chave em `mfa_chave_versao`
    (`IDENTIDADE_CHAVE_CIFRA_V{n}`, obrigatória no boot)
  - `configurar` devolve `{ uri, segredo }` e `ativar` exige um código válido, grava
    `mfa_ativado_em` e devolve 10 códigos de recuperação de 12 caracteres, guardados só como
    HMAC com chave própria, separada da chave da cifra
  - as duas respostas saem com `Cache-Control: no-store`
- [x] 6.2 — `POST /v1/sessao/mfa` com desafio de etapa `mfa`
  - `{ codigo }`: `otpauth` com `window=1`, e o passo aceito precisa ser maior que
    `mfa_ultimo_passo`, num `update … where mfa_ultimo_passo < $passo`
  - `{ recuperacao }`: `update … set usado_em = now() where hmac = $1 and usado_em is null`
  - tentativa errada conta no contador de tentativas com `HMAC(conta_id)`; o quinto erro
    consome o `jti` do desafio, e a partir daí nem o código certo passa
  - acerto conclui a etapa (consome o `jti`) e segue para `escolher` ou `pronta`, como na 4.0
  - com o Redis de fila fora, o desafio é recusado e a pessoa entra de novo
- [x] 6.3 — Redefinição
  - `POST /v1/usuarios/:id/mfa/redefinir`, `@Permite` só coordenador, `{ finalidade }`
    obrigatória, resposta 202 sempre
  - só age se o usuário alvo é da escola do contexto e todos os usuários ativos da conta dele
    são dessa escola; aí apaga segredo, `mfa_ativado_em`, `mfa_ultimo_passo` e os códigos, e
    grava auditoria com a finalidade
  - em qualquer outro caso não muda nada; se o alvo é da escola mas a conta tem usuário em
    outra, grava a recusa em auditoria
  - `ops:redefinir-mfa --usuario <uuid> --pedido <referência>`: abre o contexto da escola do
    usuário, grava `autor_operador` e a referência como finalidade, e imprime só "ok" ou o
    código do erro, nunca nome nem e-mail
- [x] 6.4 — Testes (tabela abaixo) e redact novo conferido no log

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/db/schema/codigo-recuperacao.ts`, migration em `packages/nucleo/drizzle/` | novo |
| `packages/nucleo/src/db/schema/conta.ts` (colunas de MFA, se a 2.0 não as criou) | alterado |
| `apps/api/src/sessao/mfa.controller.ts`, `mfa.service.ts`, `cifra-do-segredo.ts` | novo |
| `apps/api/src/sessao/resolucao-de-tenant.repository.ts` (métodos de conta por `conta_id`) | alterado |
| `apps/api/src/estrutura/redefinir-mfa.controller.ts` ou equivalente no módulo `sessao` | novo |
| `apps/api/src/ops/redefinir-mfa.ts` e `package.json` (script `ops:redefinir-mfa`) | novo e alterado |
| `packages/shared/src/sessao/mfa.ts` (contratos zod) | novo |
| `packages/nucleo/src/log/logger.ts` (caminhos de redact de MFA) | alterado |
| `.env.example`, `infra/compose.yml` (chaves de cifra e de HMAC) | alterado |
| `apps/api/test/mfa.int.test.ts`, `apps/api/src/sessao/cifra-do-segredo.test.ts`, `apps/api/src/ops/redefinir-mfa.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: coordenador configura, ativa com código válido, sai, entra de novo e só chega a `pronta` depois do código | integração | RF12; quebra se o login pular a etapa `mfa` |
| permissão: coordenador sem MFA ativo não alcança `/v1/eu` nem `/v1/turmas`; o desafio de `configurar_mfa` não vale como token de acesso | integração | RF12; o coordenador só alcança a configuração |
| borda: `configurar` com MFA já ativo é recusado; quem só tem a senha não troca o segundo fator | integração | a trava de `mfa_ativado_em` nulo |
| concorrência: o mesmo TOTP em dois POST paralelos passa uma vez só | integração (concorrência real com `Promise.all`) | `update` condicional no passo, sem replay |
| concorrência: o mesmo código de recuperação em dois POST paralelos passa uma vez, e depois nunca mais | integração | uso único resolvido no banco |
| borda: o quinto código errado consome o `jti`; o sexto, mesmo certo, é recusado; o contador vale para a conta em A e em B | integração | tentativas de MFA limitadas pela conta global |
| borda: segredo cifrado copiado de uma conta para outra não decifra | unidade | AAD com `conta_id` |
| isolamento: redefinir com `:id` de usuário só de B dá 202 sem efeito; com usuário de A cuja conta também está em B, 202 sem efeito e recusa em auditoria; resposta idêntica nos dois casos e no caso que age | integração | a escrita na conta global não atravessa escolas e não revela acesso em outra escola |
| permissão: professor chamando `redefinir` é recusado | integração | `@Permite` só coordenador |
| borda: Redis de fila fora, o desafio de `mfa` é recusado com o código tipado e a pessoa volta ao login | integração | falha fechada sem reuso de `jti` |
| privacidade: `configurar` e `ativar` saem com `no-store`; `ops:redefinir-mfa` não imprime nome nem e-mail; o log do fluxo inteiro não contém segredo, código nem URI | integração | regra 20, item 9, e redact novo |

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

- Telas `/mfa` e `/mfa/configurar`: 19.0
- Convite do primeiro coordenador, que leva a `configurar_mfa`: 7.0
- MFA exigido na troca para uma escola onde a pessoa é coordenadora: 12.0
- Passkey: fora do F1 (decisão da Tech Spec)
- Contador de tentativas e rebaixamento sob ataque: 4.0 e 15.0

## Notas da implementação

- **Os dois pontos da 4.0.** (a) `educa_dispositivo` sai só quando o `/v1/sessao/mfa` termina em `pronta`, junto com o
  `educa_sessao`: a gravação dos cookies e da sessão foi para `ConclusaoDeLogin`, a mesma que o login da senha usa.
  `configurar`, `ativar`, o erro, o 429 e o `escolher` depois do MFA não gravam cookie nenhum (testes do caminho feliz,
  do quinto erro e do `escolher`). (b) O limite próprio do MFA é declarado no `MfaService`: o mesmo
  `ContadorDeTentativas`, com a chave `HMAC(conta_id)` (sem escola) e o sufixo `conhecido`/`outro` pelo
  `educa_dispositivo`; o acerto da senha zera a chave do e-mail, não esta (teste "o acerto da senha não o zera"). A
  quinta falha seguida responde `CONTA_SEGURADA` e consome o `jti`.
- **Finalidade como código, não como texto (decisão que protege a auditoria).** A 6.3 diz que o `ops:redefinir-mfa`
  grava "a referência como finalidade", mas a auditoria só aceita `finalidade` como `enum` de códigos (Tech Spec,
  seção 3; `acoes.ts` recusa texto livre, que é onde o nome entra). Ficou: finalidade `pedido_formal_da_escola`, e o
  `--pedido` é o número do protocolo do pedido formal (inteiro positivo), gravado em `depois.pedidoDoOperador`. Texto
  livre no `--pedido` é recusado antes de abrir o banco. A coordenação escolhe entre `autenticador_perdido`,
  `codigos_perdidos` e `suspeita_de_acesso_indevido`.
- **O operador age também quando a conta está em outra escola.** A Tech Spec manda a escola recorrer ao operador
  justamente nesse caso. Como a conta é global, o registro vai para a auditoria de cada escola em que ela tem usuário
  ativo, com o usuário daquela escola como entidade: a coordenação de B fica sabendo que o MFA do coordenador dela foi
  redefinido, sem saber de A. Usuário inexistente, desativado ou sem conta: `NAO_ENCONTRADO`.
- **A ativação não abre sessão.** O contrato da Tech Spec para `/ativar` é só `{ codigosRecuperacao }`, e o caminho
  feliz da tabela diz "sai, entra de novo e só chega a `pronta` depois do código". A ativação consome o desafio, e a
  pessoa entra de novo com a senha e o código. A 19.0 mostra os códigos e leva a `/entrar`.
- **Ordem na ativação e no MFA.** Na ativação, o código é conferido antes de consumir o `jti` (código errado não gasta o
  desafio) e o `jti` é consumido antes de gravar (duas ativações com o mesmo desafio nunca geram dois lotes de
  códigos). "MFA já ativo" em `configurar` e `ativar` é decidido só pelo `update … where mfa_ativado_em is null` (e,
  na ativação, pelo segredo conferido), sem leitura anterior no service: entre a leitura e a escrita, outra aba pode
  ter ativado. Consequência aceita: um desafio `configurar_mfa` que sobrou numa conta com MFA ativo chega a conferir o
  TOTP do segredo ativo na ativação, fora do `ContadorDeTentativas`; código certo e errado respondem os dois 401 (o
  certo é recusado pelo banco), sem distinção pela resposta, e o desafio vence em 5 min. Esse 401 do "já ativo" não
  pode virar outra resposta. No `/v1/sessao/mfa`, o desafio é conferido como livre (`EXISTS` no Redis de fila) antes de qualquer coisa:
  com o Redis fora ou o desafio já usado, a recusa vem antes de o código ser conferido, e o passo do TOTP não anda.
  O passo e o código de recuperação são gastos no banco (`update` condicional) antes de o `jti` ser consumido.
- **Redefinição: o próprio, o desativado e o aluno.** Pedir a redefinição do próprio MFA, de usuário desativado ou de
  aluno (sem conta) dá 202 sem efeito e sem registro. A trava da conta é `FOR UPDATE` (não `FOR NO KEY UPDATE`): conflita
  com o `FOR KEY SHARE` da FK de `usuario`, então um usuário novo dessa conta em outra escola (convite, 7.0) ou já
  aparece na conferência ou espera o commit.
- **Chave da cifra.** `IDENTIDADE_CHAVE_CIFRA_V{n}` é texto de pelo menos 32 caracteres, como as outras chaves do
  ambiente, e passa pelo HKDF-SHA256 (rótulo `educa.mfa.segredo.aes-256-gcm`) para dar os 32 bytes do AES-256. A
  versão atual vem de `IDENTIDADE_CHAVE_CIFRA_VERSAO`; versões anteriores declaradas continuam decifrando. A chave dos
  códigos de recuperação é `IDENTIDADE_CHAVE_RECUPERACAO`, recusada no boot se repetir qualquer outra.
- **`/v1/turmas` da tabela de testes.** A rota nasce na 8.0. O teste de permissão prova o mesmo com as rotas que existem
  hoje: `/v1/eu`, `PUT /v1/escola/sessao` e `POST /v1/sessao/atividade` recusam o desafio `configurar_mfa`, e nenhuma
  sessão é gravada para o coordenador sem MFA.
- **`MFA_NECESSARIO`.** O "contexto necessário" diz que a 4.0 criou esse código, mas ele não existe, e nenhuma rota
  desta tarefa precisa dele: o coordenador sem MFA nunca chega a ter sessão. Fica para a 12.0 (troca para uma escola
  em que a pessoa é coordenadora) e para a 19.0, que já o lista.
- **Falha do MFA no registro de acesso.** O código errado grava `login_falho` sem escola, como a senha errada: é parte
  do login por e-mail, antes de haver escola.

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-18 05:51:35 | 2026-09-18 05:53:16 | `test-engineer` | 1 | REPROVADO | aaad067c142608e70 |
| 2026-09-18 06:07:07 | 2026-09-18 06:08:05 | `test-engineer` | 2 | APROVADO | a1f9d381e6337b6b1 |
| 2026-09-18 06:31:06 | 2026-09-18 06:31:25 | `test-engineer` | 3 | APROVADO | af162b249beed0368 |
| 2026-09-18 06:41:35 | 2026-09-18 06:42:34 | `tenancy-guardian` | 1 | APROVADO | abbcbdba7f6d02625 |
| 2026-09-18 06:41:46 | 2026-09-18 06:42:44 | `privacy-guardian` | 1 | APROVADO | afe27daaa20064751 |
| 2026-09-18 06:41:57 | 2026-09-18 06:43:44 | `infra-guardian` | 1 | APROVADO | a891160de8848e7df |
| 2026-09-18 06:41:26 | 2026-09-18 07:12:13 | `revisor-geral` | 1 | APROVADO | a32aab3262b775564 |
