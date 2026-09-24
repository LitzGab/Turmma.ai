# Tarefa 11.0 — Web do operador: convite e configurar o segundo fator

**Funcionalidade:** apresentacao-operacao (A0) · **Depende de:** 10.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Quem recebe o convite de operador abre o link, cria a senha, configura o segundo fator (QR, chave em
texto ou `otpauth://`), guarda os códigos de recuperação e entra na casca da operação — o fluxo
inteiro pela web, em `chromebook` e `celular`.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `tasks/prd-apresentacao-operacao/techspec.md` seções 4 (`convite/consultar`, `convite/aceitar`,
  `mfa/configurar`), 5 ("Etapas" e a trava do configurar) e 9 ("Área do operador"), e `cenarios.md`
  (E1)
- `.claude/rules/50-frontend.md` (itens 5, 7, 8 e 11) e `.claude/rules/20-lgpd-menores.md` item 8
- `docs/interface.md` 5a e 11.1
- A tarefa 10.0 (chunk, sessão própria, casca, tratamento de 401 e 503)
- Código existente para seguir o desenho, sem reaproveitar a sessão: `apps/web/src/paginas/Convite.tsx`
  (token lido do `#` e tirado da barra antes de qualquer chamada), `apps/web/src/paginas/ConfigurarMfa.tsx`,
  `apps/web/src/componentes/CodigoQr.tsx`, `apps/web/src/componentes/BotaoCopiar.tsx`,
  `e2e/convite.spec.ts` e `e2e/mfa.spec.ts`

## Subtarefas

- [x] 11.1 — `/operacao/convite`: lê o token do `#`, tira da barra antes de qualquer chamada, consulta;
  convite usado, vencido, revogado ou inexistente mostra a mesma mensagem ("Este convite não vale
  mais. Peça um novo à equipe") sem dizer qual dos quatro
- [x] 11.2 — Criar a senha com os critérios do F1 e seguir para `/operacao/mfa/configurar`
- [x] 11.3 — Configurar: QR com a chave em texto selecionável e o link `otpauth://` ao lado, para
  configurar no próprio celular; os códigos de recuperação aparecem uma vez, com "Copiar" anunciado em
  região viva e campo selecionável; a tela avisa antes de sair que eles não voltam
- [x] 11.4 — "Configure de novo" (resposta da versão divergente) volta ao começo do configurar sem
  erro cru; desafio vencido volta à entrada
- [x] 11.5 — Nada do convite, da senha, do segredo ou dos códigos em `localStorage`, na URL ou em log
  do navegador; ao sair da tela, a memória do segredo e dos códigos é limpa
- [x] 11.6 — Testes (tabela abaixo); portão com `--e2e`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/operacao/paginas/Convite.tsx` | novo |
| `apps/web/src/operacao/paginas/ConfigurarMfa.tsx` | novo |
| `apps/web/src/operacao/api/convite.ts`, `mfa.ts` | novo |
| `apps/web/src/operacao/rotas.tsx` | alterado |
| `e2e/operacao-convite.spec.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| **E1** — convite, senha, configurar (QR, chave em texto, `otpauth://`, códigos com "Copiar" anunciado), código e casca da operação, em `chromebook` e `celular`, com axe | e2e | o operador nasce inteiro pela web |
| convite usado, vencido, revogado e inexistente mostram a mesma tela | e2e | a tela não conta qual dos quatro (C9 no servidor) |
| o token some da barra de endereço antes da primeira chamada | e2e | regra 20, item 8: o link não fica no histórico |
| recarregar a tela do configurar não mostra os códigos de novo | e2e | aparecem uma vez (`no-store` respeitado) |
| "configure de novo" leva de volta ao começo, com a mensagem, e o novo QR funciona | e2e | a versão divergente (C18) não trava o operador |
| nenhum segredo, código ou token em `localStorage`, `sessionStorage` ou URL ao fim do fluxo | e2e | nada sensível fica no navegador |
| teclado do começo ao fim, foco visível, região viva anunciando o "Copiado" | e2e | acessibilidade real (regra 50, item 11) |

Concorrência: duas abas configurando juntas — a aba vencida recebe "configure de novo" e consegue
recomeçar (C18 prova o servidor; aqui, que a tela não fica presa).

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`,
  com `--e2e` se tocou tela e `--infra` se mexeu em infra)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que
  vale para o código atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Divergências resolvidas nesta tarefa

- **"Configure de novo" volta ao começo do configurar pela entrada.** O 409 `CONFLITO` chega depois de a API gastar o
  desafio `mfa` (7.0: o `jti` é consumido antes de tudo), e só o `sessao/email` devolve outro `configurar_mfa` (até 72 h
  depois do aceite, sem segundo fator ativo). A tela leva à entrada com "O segundo fator foi configurado de novo em outra
  aba, e o código QR desta não vale mais. Entre com o e-mail e a senha para configurar outra vez."; o e-mail e a senha
  caem direto no configurar, com um QR novo. Guardar a senha para refazer a entrada sozinha seria pior (regra 20).
- **Código recusado ao configurar também volta à entrada**, com texto próprio (o QR e os códigos daquela tela deixam de
  valer, porque a próxima configuração os troca), e com a espera quando a conta foi segurada. Formato inválido e 503
  deixam a pessoa na tela, com o desafio, como no `Mfa.tsx` da 10.0.
- **Desafio vencido:** o `configurar` recusado pela API leva à entrada com "Para configurar o segundo fator, entre de novo
  com o seu e-mail e a sua senha."; sem desafio nenhum na memória (F5, endereço digitado), a mesma frase fica na tela com
  "Ir para a entrada", como a tela do código da 10.0. O 503 e o 429 do `configurar` deixam o desafio e oferecem "Tentar de
  novo".
- **Os códigos de recuperação aparecem junto do QR, antes do primeiro código**, porque a API os devolve no `configurar`
  (7.0), e não na ativação como no F1. O primeiro código ("Ativar e entrar") ativa e abre a sessão, e a tela vai direto à
  casca. Enquanto segredo e códigos estão na tela, o `beforeunload` pergunta antes de sair ou recarregar; o texto da tela
  diz que eles não voltam.
- **O link sem token, ou com `%` quebrado, mostra a mesma mensagem** do convite que não vale: a tela não distingue caso
  nenhum.
- **Outro link colado na mesma aba** — ou o mesmo link de novo — muda só o `#`, sem recarregar: a tela ouve o
  `hashchange`, tira o fragmento da barra, esquece a senha digitada e recomeça a consulta mesmo com o token igual;
  fragmento que não é token mostra a tela do convite que não vale, com a barra limpa. A tela do convite que não vale
  leva também a "Entrar na operação", para quem abriu de novo um convite já usado.
- **A senha sai do estado da tela também na falha do aceite** (recomendação da privacidade na 10.0).
- **Arquivos a mais que a lista previa:** `apps/web/src/operacao/textos.ts` e `caminhos.ts`; o comentário de
  `api/sessao.ts`; `apps/web/src/operacao/api/convite-e-mfa.test.ts` (unidade do caminho do desafio entre as etapas); e
  `e2e/__fixtures__/operacao.ts` (`criarOperadorConvidado`, o operador como o comando o deixa, nos quatro estados do
  convite, apagado no fim de cada teste).

## Fora do escopo desta tarefa

- A tela de entrar, a casca e a sessão: 10.0
- Criar ou desativar operador: comando da 3.0
- O painel (escolas, uso, convite da coordenação): A0b

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-24 07:04:47 | 2026-09-24 07:06:04 | `test-engineer` | 1 | APROVADO | a330559755af6887c |
| 2026-09-24 07:06:19 | 2026-09-24 07:06:57 | `privacy-guardian` | 1 | APROVADO | a1c962e7ea7da2f31 |
| 2026-09-24 07:06:19 | 2026-09-24 07:07:08 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | a1cabe81e32bb0825 |
| 2026-09-24 07:06:13 | 2026-09-24 07:07:10 | `revisor-geral` | 1 | REPROVADO | a6ccee15b9c9dcfc9 |
| 2026-09-24 07:30:20 | 2026-09-24 07:30:47 | `test-engineer` | 2 | APROVADO | a78d022b6fbdfb259 |
| 2026-09-24 07:30:59 | 2026-09-24 07:31:15 | `revisor-geral` | 2 | APROVADO | a24d21cbeb52b8982 |
| 2026-09-24 07:31:07 | 2026-09-24 07:31:34 | `frontend-reviewer` | 2 | APROVADO | a4526bfd1d6192f1b |
| 2026-09-24 07:31:18 | 2026-09-24 07:31:34 | `privacy-guardian` | 2 | APROVADO | a7d0bdbebf9397264 |
