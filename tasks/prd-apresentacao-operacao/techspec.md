# Tech Spec — Identidade do operador Turmma

**PRD:** `tasks/prd-apresentacao-operacao/prd.md`
**Status:** rascunho (2ª versão, depois da rodada 1 do `/revisar-spec`; o painel foi para a A0b)

## 1. Resumo da abordagem

O operador ganha identidade fora do modelo de escola: tabelas sem `escolaId`, sessão e tokens com
`typ` próprio (`operador+jwt` para acesso, `desafio-operador+jwt` para as etapas do
login). As rotas vivem em `/v1/operacao/*` e usam um de dois marcadores, que só existem em
`apps/api/src/operacao/`: `@RotaDeOperacao()`, que aplica a `GuardaDeOperador` por
`applyDecorators`, e `@EntradaDeOperacao()`, numa lista fechada de rotas sem sessão. As guardas
globais de escola os tratam como sem sessão. Do F1 vêm só as peças puras: `segundo-fator.ts`,
`cifra-do-segredo.ts`, o hash de senha e o `ContadorDeTentativas`. A pele da D72 entra no `apps/web` inteiro numa tarefa própria, antes das
telas do operador.

## 2. Módulos afetados

| Módulo | Novo ou alterado | O quê |
|---|---|---|
| `apps/api/src/operacao/` | novo | controllers de sessão e convite, `GuardaDeOperador`, `OperadorRepository`, os dois marcadores |
| `apps/api/src/ops/` | novo e alterado | `ops:operador -- criar`, `desativar`, `convite`; `comando.ts` confere `OPERADOR` contra operador ativo |
| `packages/nucleo/src/identidade/` | alterado | `rotaSemSessao` reconhece os marcadores; `verificarTokenDeOperador`; a `guarda-autenticacao.ts` responde 404 a bearer de operador em rota de escola |
| `packages/nucleo/src/limite/guarda-limite.ts` | alterado | conta `rl:op:{sub}` nas rotas de operador e rebaixa por IP nas de entrada |
| `apps/api/src/sessao/contador-de-tentativas.ts` | alterado | prefixo da chave por parâmetro (`login:` da escola, `login-op:` da operação) |
| `packages/nucleo/src/permissao/conferencia-das-permissoes.ts` | alterado | aceita os marcadores no lugar de `@Permite` |
| `packages/nucleo/src/db/schema/` | novo | seis tabelas da seção 3 |
| `packages/nucleo/src/retencao/` | alterado | o `sistema.expurgar-acesso` apaga também as tabelas de acesso da operação |
| `apps/web/src/estilos.css` e telas do F1 | alterado | tokens da D72 (seção 9) |
| `apps/web/src/operacao/` | novo | rotas sob demanda, sessão própria, telas de convite, entrada, segundo fator e casca |
| `tools/ci/tamanho-web.test.ts` | alterado | orçamento da entrada separado do dos chunks |

## 3. Modelo de dados

Ids UUID gerados no banco. **Nenhuma tabela tem `escolaId`**: é dado da equipe (seção 11).

```
Operador                  id, apelido* (FORMATO_OPERADOR, único), nome?, email? (citext, único),
                          senhaHash?, mfaSegredoCifrado?, mfaChaveVersao?, mfaAtivadoEm?,
                          mfaUltimoPasso?, criadoEm*, desativadoEm?
CodigoRecuperacaoOperador operadorId*, hmac* — PK (operador_id, hmac)
ConviteOperador           id, operadorId*, tokenHash*, expiraEm* (72 h), usadoEm?, revogadoEm?
                          — único parcial (operador_id) where usado_em is null and revogado_em is null
SessaoOperador            id, operadorId*, refreshHash*, refreshHashAnterior?, rotacionadoEm?,
                          criadaEm*, ultimoUsoEm*, expiraEm* (8 h), encerradaEm?, motivo?
AcessoOperacao            id, operadorId?, evento* (entrada | entrada_falha | saida), ip*, em*
AuditoriaOperacao         id, autor* (apelido ou "bootstrap"), acao* (operador.criado |
                          operador.desativado | operador.mfa_configurado | convite_operador.gerado |
                          convite_operador.revogado), operadorAlvoId*, em*
```

`apelido` é o valor que já vai para `auditoria.autor_operador` (texto, com o check de hoje). Desativar
apaga nome, e-mail, senha, segredo e códigos na mesma transação; o apelido fica, porque a auditoria
precisa dele. Uma migration, só de tabelas novas.

## 4. API

| Método | Rota | Marcador | Entrada | Saída |
|---|---|---|---|---|
| POST | `/v1/operacao/convite/consultar` | entrada | token do `#` | se o convite vale |
| POST | `/v1/operacao/convite/aceitar` | entrada | token, senha | desafio `configurar_mfa` |
| POST | `/v1/operacao/sessao/email` | entrada | email, senha | desafio `mfa` ou `configurar_mfa` |
| POST | `/v1/operacao/sessao/mfa/configurar` | entrada | desafio | segredo e códigos de recuperação |
| POST | `/v1/operacao/sessao/mfa` | entrada | desafio, código ou recuperação | acesso; cookie |
| POST | `/v1/operacao/sessao/renovar`, `/sair` | entrada | cookie | acesso / nada |
| GET | `/v1/operacao/eu` | operação | — | apelido, nome |

Cookie `turmma_operacao`, HttpOnly, `SameSite=Strict`, `Path=/v1/operacao/sessao`. Acesso de 10 min
com `sub` e `sid`, sem `esc`. Respostas com segredo, códigos ou desafio levam
`Cache-Control: no-store`. Saída sempre por contrato estrito de `packages/shared/src/operacao/`.

## 5. Fluxo

**Nascimento.** `ops:operador criar --apelido --nome --email --saida` grava o operador e um convite,
com o token em arquivo 0600 (dívida aceita: uma vez por pessoa da equipe). Se não há operador ativo,
o `criar` aceita o `OPERADOR` do ambiente e grava autor `bootstrap`; havendo, `OPERADOR` precisa ser
apelido de operador ativo, e a mesma conferência passa a valer em todo `ops:*`.

**Travas no banco**, todas com `returning` e resposta tipada para quem perde:
- aceite: `update convite_operador set usado_em = now() where id = $1 and usado_em is null and
  revogado_em is null and expira_em > now()`
- código de recuperação: `delete ... where operador_id = $1 and hmac = $2 returning`
- TOTP: `update operador set mfa_ultimo_passo = $p where id = $1 and (mfa_ultimo_passo is null or
  mfa_ultimo_passo < $p)`
- configurar: grava o segredo e ativa, os dois `where mfa_ativado_em is null`; com duas abas vale o
  último segredo gravado, e o código da outra aba falha com "configure de novo"
- renovação: `update ... set refresh_hash = $novo, refresh_hash_anterior = $atual where id = $1 and
  refresh_hash = $atual`; o anterior vale 30 s para a aba irmã, e reusado depois disso encerra a
  sessão (padrão do F1)
- desafio: `jti` consumido com `SET NX` no Redis por 5 min; Redis fora recusa com 503

**Entrada.** O `ContadorDeTentativas` conta com o prefixo `login-op:`, pelo e-mail e pelo
`operador.id`, com a origem `conhecido`/`outro` pelo cookie de dispositivo do F1 com chave própria:
saber o e-mail não segura a conta no aparelho de sempre. `entrada_falha` não grava o e-mail.

**Conferência da sessão**, pela `GuardaDeOperador`, em toda rota `@RotaDeOperacao`:
- credencial que não é de operador (sessão, desafio ou cookie de escola, ou nenhuma): **404**, pelo
  mesmo filtro de exceção de uma rota inexistente
- token de operador válido com sessão que terminou (30 min parado, 8 h, saída, operador
  desativado): **401 `SESSAO_ENCERRADA`**
- banco fora: **503 `INDISPONIVEL_TENTE_DE_NOVO`**
- `ultimoUsoEm` gravado no máximo uma vez por minuto

**Limite.** A `GuardaDeLimite` verifica o token de operador nas rotas `@RotaDeOperacao` e conta
`rl:op:{sub}`; nas `@EntradaDeOperacao`, rebaixa por IP (como o `@LimiteQueRebaixa`), e quem recusa
é o contador por conta.

**Borda.** No MVP local, `/operacao` e `/v1/operacao/*` saem pela mesma borda: tudo é sintético.
Antes do staging a borda os restringe (pendência em `tasks/prd-fundacao-tecnica/notas-staging.md`).

## 6. Isolamento

O módulo não consulta dado de escola. O que precisa ser impossível é uma rota escapar das guardas
de escola sem cair na de operador.

Testes de arquitetura:
- os dois marcadores só aparecem em `apps/api/src/operacao/`, varrendo método e classe
- toda rota com `@RotaDeOperacao` tem a `GuardaDeOperador` no handler resolvido, e todo caminho
  `/v1/operacao` tem um dos dois marcadores
- as rotas `@EntradaDeOperacao` são exatamente as sete da seção 4, escritas no teste
- nenhuma rota registrada cria operador

Teste de isolamento, com a lista gerada das rotas registradas:
- sessão de coordenador, professor e aluno, desafio de escola e cookie `educa_sessao`: toda rota
  `/v1/operacao/*` responde igual, em status e corpo, a uma rota inexistente; as de entrada nunca
  produzem sessão de operador a partir deles
- token, desafio e cookie de operador em toda rota de escola: o mesmo
- efetividade: tirar a guarda de um handler deixa os dois vermelhos

## 7. Dado pessoal

| Item | Resposta |
|---|---|
| Novos campos | as seis tabelas da seção 3; `docs/lgpd.md` ganha a auditoria da operação e o HMAC dos códigos, e alinha a retenção da conta |
| Log | evento e ids (`operacao.entrada_falha`, `operadorId?`); nunca e-mail, senha, token nem código |
| Auditoria | `AuditoriaOperacao` para o que muda permissão; `AcessoOperacao` para o acesso |
| Provedor externo | nenhum |
| Retenção | conta: dado pessoal apagado ao desativar, apelido fica; convite e sessão: 30 dias após usar, revogar ou encerrar; `AcessoOperacao`: 6 meses; `AuditoriaOperacao`: vigência + 5 anos. O `sistema.expurgar-acesso` apaga as três primeiras, numa consulta sem escopo declarada com justificativa |
| DTO de saída | `eu`: apelido e nome; nada mais sai do módulo |

## 7b. Conformidade CNE

Não se aplica.

## 7c. Carga e falha

| Item | Resposta |
|---|---|
| Caminho quente? | toca o código do login da escola (guardas, contador), sem somar carga a ele |
| Rate limit | `rl:op:{sub}`; entrada por conta, com IP que rebaixa |
| Corridas | as seis travas da seção 5 e o único parcial do convite |
| Quando cai | banco: 503 tipado; Redis: login segue o seguro do F1, desafio recusa com 503 |
| Métrica | contagem de `entrada_falha` por minuto; sem alerta novo; carga não muda |

## 9. Frontend

**Pele da D72, primeira tarefa de web.** O `@theme` do `estilos.css` passa a ser o bloco da 9.9 do
`docs/interface.md`, e não o `mockups/src/index.css` inteiro (sem rampa `neutral`, Inter nem
Quicksand). Nas telas do F1: `slate` → `tinta`, `apoio`, `sutil`, `inativo`, `linha`,
`borda-campo`, `realce`; `blue-700` de foco e link → `noite`, com foco de 2 px e 2 px de afastamento
(`caramelo-noite` sobre preto); `amber` → `pendente`/`pendente-cx`; `red` → `erro`/`erro-cx`;
`emerald` → `ok`/`ok-cx`; fundo do diálogo `#0f172abf` → `rgba()` literal. O logotipo entra pelos
SVGs de `mockups/public/marca/`, em curvas, sem baixar a Fustat. Guardas: `estilos.test.ts` reprova
família de fábrica; `e2e/casca.spec.ts` confere os hex dos tokens no CSS servido e reprova `oklch(`
e `color-mix(`.

**Área do operador.** Rotas `/operacao/convite`, `/operacao/entrar`, `/operacao/mfa`,
`/operacao/mfa/configurar` e `/operacao`, num chunk com `import()`, fallback `EstadoCarregando` e
fronteira de erro ("Não foi possível abrir o painel. Tente de novo", com botão). Sessão numa
variável de módulo própria, separada da `api/sessao.ts`, com `BroadcastChannel` próprio. 401
`SESSAO_ENCERRADA` tenta renovar; falhando, vai à entrada com "Sua sessão terminou. Entre de novo
para continuar." Casca: faixa "Operação Turmma" em `noite` com texto branco, Sair a um clique,
`document.title` por rota e `<h1>` para leitor de tela. Os códigos de recuperação aparecem uma vez,
com "Copiar" anunciado em região viva e campo selecionável.

**Orçamento.** 150 kB brotli só para a entrada; o chunk da operação com teto próprio; teste de que
nada importado pela entrada da escola vem de `apps/web/src/operacao/`.

## 10. Testes

| Camada | O que será testado |
|---|---|
| Unidade | `FORMATO_OPERADOR` no comando; chave do contador com os dois prefixos; resposta da guarda por tipo de credencial |
| Integração | comando: bootstrap, autor, desativar inexistente com erro tipado, desativar que corta a sessão; convite: quatro estados iguais, dois aceites em `Promise.all`, operador desativado não aceita, arquivo 0600; MFA: recuperação e TOTP duas vezes, em sequência e em paralelo, configurar em duas abas, desafio que não serve de bearer; login: status e corpo iguais para e-mail inexistente e senha errada, conta Y entra depois de 10 erros na X, errar como operador não segura o mesmo e-mail na escola e o contrário; sessão: 30 min, 8 h, rotação em paralelo, reuso do anterior encerra, banco fora dá 503; limite: `rl:op` recusa com o IP igual; registros: cada evento na tabela certa, com o operador da sessão; expurgo nos prazos |
| E2E | convite, senha, segundo fator, entrada e casca; sessão encerrada volta com a mensagem; `chromebook` e `celular`, com axe; o e2e do F1 verde na pele nova |
| Isolamento e arquitetura | seção 6 |

## 11. Conformidade com as regras

| Regra | Como é atendida | Desvio e justificativa |
|---|---|---|
| 10, item 1 | tabelas de escola intactas | tabelas do operador sem `escolaId`: são da equipe; alternativa recusada: operador como usuário de uma "escola Turmma", que o poria em consulta de escola |
| 10, item 9 | uma consulta sem escopo nova, no expurgo, com justificativa | nenhum |
| 20, 50, 80 | log por id, dado apagado ao desativar, `no-store`; quatro estados, token em memória; limite por operador e por conta, travas no banco | nenhum |

## 12. Premissas não verificadas

Nenhuma dependência externa.

## 13. Riscos técnicos

- `rotaSemSessao` passa a abrir caminho sem guarda de escola: os testes da seção 6 o prendem
- A pele nova quebra o F1 onde o axe não vê: as guardas de estilo mudam antes das telas
- Herdadas do F1: esteira instável segue vigiada; `BroadcastChannel`, `details` do seletor e
  `saidaConfirmada` vão para a primeira tarefa de web da A1
