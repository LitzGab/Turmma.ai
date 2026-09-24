# Tarefa 6.0 — O operador entra por e-mail e senha

**Funcionalidade:** apresentacao-operacao (A0) · **Depende de:** 5.0
**Subagentes obrigatórios:** `privacy-guardian`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O operador informa e-mail e senha e recebe o desafio da etapa seguinte (`mfa`, ou `configurar_mfa`
dentro das 72 h do aceite), com a mesma proteção por conta do login da escola e sem colidir com ela.

## Contexto necessário

- `docs/visao-produto.md`
- `techspec.md` seções 4 (`/sessao/email`), 5 ("Etapas", "Entrada" e "Limite": grupo de
  `sessao/email`) e 7 (log)
- `cenarios.md`: C15, C22–C25, C33, U2
- `.claude/rules/20-lgpd-menores.md` (itens 6 e 9), `40-testes.md`, `80-infra-e-carga.md` (item 1)
- Código do F1:
  - `apps/api/src/sessao/login-email.controller.ts` e `login.service.ts` — respostas iguais para
    e-mail inexistente e senha errada, e o hash que roda mesmo sem conta
  - `apps/api/src/sessao/contador-de-tentativas.ts` — `chaveDe` fixa o prefixo `login:`; passa a
    receber o prefixo, e a operação usa `login-op:`
  - `apps/api/src/sessao/cookie-dispositivo.ts` — a origem `conhecido`/`outro`; o operador usa chave
    própria
  - `apps/api/src/sessao/senha/limite-email-ip.ts` e `packages/nucleo/src/limite/guarda-limite.ts`
    (`@LimiteQueRebaixa`) — o rebaixamento por IP
  - `apps/api/test/login-email.int.test.ts` e `apps/api/test/ataque-de-senha.int.test.ts` — os
    moldes dos testes

## Subtarefas

- [x] 6.1 — `ContadorDeTentativas` com prefixo por parâmetro, sem mudar o comportamento da escola
- [x] 6.2 — `POST /v1/operacao/sessao/email` com `@EntradaDeOperacao`: conta por e-mail e por
  `operador.id` com `login-op:`, origem pelo cookie de dispositivo com chave própria, rebaixa por IP
  no semáforo do hash; e-mail inexistente e senha errada respondem igual, em status e corpo
- [x] 6.3 — Etapa do desafio: `configurar_mfa` só se o convite foi aceito há menos de 72 h e o segundo
  fator não está ativo; fora disso, igual a senha errada. Com o segundo fator ativo, `mfa`
- [x] 6.4 — `AcessoOperacao` com `entrada_falha`, IP e data, sem o e-mail digitado; log só com evento
  e ids
- [x] 6.5 — Testes (tabela abaixo)

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sessao/contador-de-tentativas.ts` e seu teste | alterado |
| `apps/api/src/operacao/entrada.controller.ts`, `entrada.service.ts` | novo |
| `apps/api/src/operacao/operador.repository.ts` | alterado |
| `apps/api/src/operacao/operacao.module.ts` | alterado |
| `packages/shared/src/operacao/entrada.ts` | novo |
| `apps/api/test/entrada-operador.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| C22 | integração | e-mail inexistente e senha errada: status e corpo iguais |
| C23 | integração | dez erros na conta X seguram X com espera crescente; a conta Y do mesmo IP entra |
| C24 | integração | o mesmo e-mail como operador e como coordenador: errar num não segura o outro, nos dois sentidos |
| C25 | integração | depois de `entrada_falha` com e-mail sentinela, o e-mail não está em `AcessoOperacao` nem no log |
| C15 | integração | com relógio controlado: às 71h59 do aceite devolve `configurar_mfa`; às 72h01, igual a senha errada |
| C33 (parte) | integração | `sessao/email` acima do limite do IP não responde 429: rebaixa, e quem recusa é o contador da conta |
| U2 | unidade | a chave do contador com os dois prefixos, e a da escola igual à de antes |
| borda: aparelho de sempre | integração | com o cookie de dispositivo do operador, erros de outro aparelho não seguram a conta |
| borda: operador desativado | integração | e-mail de operador desativado responde igual a inexistente |
| concorrência: tentativas | integração | 15 senhas erradas em `Promise.all` na mesma conta contam todas: a 16ª está segurada |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`,
  com `--e2e` se tocou tela e `--infra` se mexeu em infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que
  vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Divergências resolvidas nesta tarefa

- **Nesta rota o contador é só pelo e-mail** (`login-op:{HMAC(e-mail)}:{origem}`). O contador por `operador.id` é o do
  segundo fator (seção 5, "Limite": "`sessao/mfa` recusa pelo contador por `operador.id`"; C34, tarefa 7.0), como no F1,
  em que o login por e-mail conta pelo e-mail e o MFA pela conta. Contar pelo id aqui só seria possível para o e-mail que
  existe, e a diferença diria qual existe. O prefixo por parâmetro vale para os dois: `chaveDe(id, origem, 'login-op')`.
- **A entrada não usa a `ConferenciaNaVez` do F1**, e sim o mesmo trecho (vez no semáforo, reserva no contador, leitura e
  hash) no próprio service: a do F1 soma em `login.falhas{escola_id=equipe}` e `login.conta_segurada`, e a falha do
  operador apareceria como falha da equipe das escolas no painel. A métrica da seção 7c nasce aqui:
  `operacao.entrada_falha`, sem rótulo, somada em toda falha (`NAO_AUTENTICADO` e `CONTA_SEGURADA`), sem alerta novo.
- **O cookie de dispositivo do operador** é `turmma_operacao_dispositivo`, no caminho `/v1/operacao/sessao` (o mesmo do
  `turmma_operacao`), com o formato do `educa_dispositivo` e a chave derivada da do F1 por HMAC com rótulo próprio, na
  mesma versão: trocar a versão do F1 invalida os dois, e a entrada de um não vale no outro (teste). Sem variável de
  ambiente nova. A 6.0 só o lê; **quem o grava é a 7.0**, ao abrir a sessão no `/sessao/mfa`, com
  `cookieDeDispositivoDeOperador(...).comEntrada`, de `apps/api/src/operacao/dispositivo-de-operador.ts`, no caminho
  `/v1/operacao/sessao`.
- **`entrada_falha` nunca leva `operador_id`**, nem quando o e-mail existe: a linha não pode separar "senha errada" de
  "e-mail que não existe". Só a falha que passou pelo hash grava; a tentativa com a conta já segurada (429) não grava,
  como no F1 (infra-guardian, 1ª rodada): sem hash, nada freia o ritmo, e cada repetição seria uma escrita no Postgres das
  escolas. Toda falha, segurada ou não, soma em `operacao.entrada_falha`.
- **Só o limite da guarda rebaixa** (`@LimiteQueRebaixa`, `acimaDoLimiteDoIp`), como no `convite/aceitar` da 5.0. O
  `LimiteDoEmailPorIp` do `/v1/sessao/email` do F1 fica de fora por escolha: ele multiplica o limite pelas escolas da rede
  do IP de saída, o que não tem sentido para a nossa equipe, e soma em `login.limite_email_ip`, série das escolas.
- **O balde do semáforo é o `equipe`**, e a espera do operador soma em `login.hash_espera{escola_id=equipe}` com a da
  equipe das escolas. Aceito: o volume de uma pessoa da nossa equipe não muda a leitura dessa série, e um rótulo próprio
  pediria mexer no semáforo do F1.
- **A senha certa fora das 72 h** (sem segundo fator ativo) é falha igual à senha errada em tudo: conta no contador, não o
  zera, grava `entrada_falha` e soma na métrica.
- **O prazo das 72 h é medido no relógio do banco** (`usado_em > now() - 72 h`), o mesmo que gravou `usado_em`. Por isso o
  C15 "com relógio controlado" move o `usado_em` para 71h59 e 72h01 atrás, em vez de trocar o relógio da aplicação. O C23
  controla o relógio da aplicação (`relogioDoSistema`, que o contador lê) para ver a espera crescer até 15 min.
- **Arquivos a mais que a lista previa:** `apps/api/src/operacao/dispositivo-de-operador.ts`, `apps/api/src/app.module.ts`
  (o `OperacaoModule.com` passa a receber a chave do dispositivo e o medidor), `apps/api/test/arquitetura.test.ts` (a nova
  assinatura), `packages/nucleo/src/telemetria/metricas.ts`, `tools/testes/metricas.ts` e `infra/grafana/paineis/fundacao.json` (a
  métrica e o painel dela, que o `painel.test.ts` exige de toda métrica), e o barrel de
  `packages/shared`.

## Fora do escopo desta tarefa

- Conferir o código do segundo fator e abrir a sessão (7.0)
- A tela de entrada (10.0)

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-24 00:35:13 | 2026-09-24 00:35:57 | `test-engineer` | 1 | APROVADO | af813e4c35a7899d6 |
| 2026-09-24 00:36:09 | 2026-09-24 00:36:36 | `privacy-guardian` | 1 | APROVADO | a8644d0fe3b0cc355 |
| 2026-09-24 00:36:05 | 2026-09-24 00:37:03 | `revisor-geral` | 1 | APROVADO | adc6655365c641c65 |
| 2026-09-24 00:36:13 | 2026-09-24 00:37:29 | `infra-guardian` | 1 | REPROVADO | ace7b1248e7ba6b89 |
| 2026-09-24 01:06:42 | 2026-09-24 01:07:01 | `test-engineer` | 2 | APROVADO | a59b07ec0ef3a741f |
| 2026-09-24 01:07:11 | 2026-09-24 01:07:23 | `infra-guardian` | 2 | APROVADO | a40f9e9d543fd1188 |
| 2026-09-24 01:07:17 | 2026-09-24 01:07:38 | `revisor-geral` | 2 | APROVADO | a3496eaf7d244d2f4 |
| 2026-09-24 01:07:24 | 2026-09-24 01:07:38 | `privacy-guardian` | 2 | APROVADO | a11865f00f1bbad24 |
