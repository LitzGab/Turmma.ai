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

- [ ] 11.1 — `/operacao/convite`: lê o token do `#`, tira da barra antes de qualquer chamada, consulta;
  convite usado, vencido, revogado ou inexistente mostra a mesma mensagem ("Este convite não vale
  mais. Peça um novo à equipe") sem dizer qual dos quatro
- [ ] 11.2 — Criar a senha com os critérios do F1 e seguir para `/operacao/mfa/configurar`
- [ ] 11.3 — Configurar: QR com a chave em texto selecionável e o link `otpauth://` ao lado, para
  configurar no próprio celular; os códigos de recuperação aparecem uma vez, com "Copiar" anunciado em
  região viva e campo selecionável; a tela avisa antes de sair que eles não voltam
- [ ] 11.4 — "Configure de novo" (resposta da versão divergente) volta ao começo do configurar sem
  erro cru; desafio vencido volta à entrada
- [ ] 11.5 — Nada do convite, da senha, do segredo ou dos códigos em `localStorage`, na URL ou em log
  do navegador; ao sair da tela, a memória do segredo e dos códigos é limpa
- [ ] 11.6 — Testes (tabela abaixo); portão com `--e2e`

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

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`,
  com `--e2e` se tocou tela e `--infra` se mexeu em infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que
  vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- A tela de entrar, a casca e a sessão: 10.0
- Criar ou desativar operador: comando da 3.0
- O painel (escolas, uso, convite da coordenação): A0b
