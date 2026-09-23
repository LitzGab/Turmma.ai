# Tech Spec — Painel da operação Turmma

**PRD:** `tasks/prd-apresentacao-operacao/prd.md`
**Status:** rascunho

## 1. Resumo da abordagem

O operador ganha identidade própria, fora do modelo de escola: tabela `operador` sem `escolaId`,
sessão `sessao_operador` e um token de acesso com `typ` próprio (`operador+jwt`). As rotas vivem em
`/v1/operacao/*`, marcadas com `@RotaDeOperacao`: as guardas globais de escola as tratam como sem
sessão, e a `GuardaDeOperador` exige o token de operador. Qualquer outra credencial ali responde
404. O caso de uso não é reescrito: criar rede e escola chama `criarRede` e `criarEscola` de
`ops/escola.ts`, e o convite chama `convite.service.ts`, os mesmos do CLI. O que é novo é leitura:
um `PanoramaRepository` com as únicas consultas sem escopo do módulo, que devolvem contagem e uso.
A web ganha a área `/operacao`, carregada sob demanda, e é nela que os tokens e o logotipo da D72
entram no `apps/web`.

## 2. Módulos afetados

| Módulo | Novo ou alterado | O quê |
|---|---|---|
| `apps/api/src/operacao/` | novo | sessão do operador (login, MFA, renovação, saída, convite), `PanoramaRepository`, controllers do painel, `GuardaDeOperador` |
| `apps/api/src/ops/operador.ts` | novo | `ops:operador -- criar --apelido --nome --email --saida` e `desativar --apelido` |
| `apps/api/src/sessao/convite.service.ts` | alterado | `refazerConviteDeCoordenador(conviteId)` e `estadoDoConviteDaEscola`, sem devolver e-mail |
| `packages/nucleo/src/identidade/` | alterado | `@RotaDeOperacao`; `rotaSemSessao` passa a reconhecê-la; `verificarTokenDeOperador`; na `guarda-autenticacao.ts`, bearer com `typ` de operador em rota de escola → 404 |
| `packages/nucleo/src/db/schema/` | novo | `operador`, `codigo_recuperacao_operador`, `convite_operador`, `sessao_operador`, `registro_operacao` |
| `packages/nucleo/src/permissao/conferencia-das-permissoes.ts` | alterado | aceita `@RotaDeOperacao` no lugar de `@Permite` |
| `packages/shared/src/operacao/` | novo | contratos Zod de entrada e saída do painel |
| `apps/web/src/operacao/` | novo | rotas, sessão em memória própria, telas |
| `apps/web` (tema) | alterado | tokens da D72 vindos de `mockups/src/index.css` e SVGs de `mockups/public/marca/` |

## 3. Modelo de dados

```
Operador*                  id, apelido* (FORMATO_OPERADOR, único), nome*, email* (citext, único),
                           senhaHash?, mfaSegredoCifrado?, mfaChaveVersao?, mfaAtivadoEm?,
                           mfaUltimoPasso?, criadoPor* (apelido), criadoEm*, desativadoEm?
CodigoRecuperacaoOperador  operadorId*, hmac*  — único (operador_id, hmac)
ConviteOperador            id, operadorId*, tokenHash*, expiraEm* (72 h), usadoEm?, revogadoEm?
SessaoOperador             id, operadorId*, refreshHash*, refreshHashAnterior?, criadaEm*,
                           ultimoUsoEm*, expiraEm* (8 h), encerradaEm?, motivo?
RegistroOperacao           id, operadorId?, evento* (entrada | entrada_falha | saida |
                           mfa_configurado | operador_criado | operador_desativado |
                           convite_operador), ip?, em*
```

**Nenhuma tem `escolaId`, de propósito**: é dado da equipe Turmma, não de escola (seção 11).
`Operador.apelido` é o mesmo valor que já vai para `auditoria.autor_operador`, que continua texto
com a regra e o check do banco de hoje; o comando e a sessão passam a validar que o apelido existe
e está ativo. O que acontece dentro de uma escola (rede, escola, convite da coordenação) continua
na `auditoria`, que a escola vê; o que é só nosso (entrar, sair, criar operador) vai para
`registro_operacao`, que a escola nunca lê. Uma migration, só de tabelas novas, compatível com o
código anterior. O `apelido` do `ops:*` que roda sem conta continua aceito até a A0 fechar, e a
validação passa a exigir operador ativo na última tarefa.

## 4. API

Toda rota com `@RotaDeOperacao`. Resposta sempre por DTO de `packages/shared/src/operacao/`.

| Método | Rota | Entrada | Saída |
|---|---|---|---|
| POST | `/v1/operacao/sessao/email` | email, senha | desafio (`configurar_mfa` ou `mfa`) |
| POST | `/v1/operacao/sessao/mfa` | desafio, código ou recuperação | token de acesso; cookie de renovação |
| POST | `/v1/operacao/sessao/mfa/configurar` | desafio | segredo para o app, códigos de recuperação (uma vez) |
| POST | `/v1/operacao/sessao/renovar`, `/sair` | cookie | token de acesso / nada |
| POST | `/v1/operacao/convite/consultar`, `/aceitar` | token do `#`, senha | desafio `configurar_mfa` |
| GET | `/v1/operacao/redes` | página | redes: id, nome, tipo |
| POST | `/v1/operacao/redes` | nome, tipo | id |
| POST | `/v1/operacao/escolas` | redeId, nome, slug | id |
| GET | `/v1/operacao/escolas` | página, ordem (nome, uso), dia | panorama por escola (seção 5) |
| POST | `/v1/operacao/escolas/:id/convite-coordenacao` | nome, email | conviteId, link (só nesta resposta) |
| POST | `/v1/operacao/convites/:id/refazer`, `/revogar` | — | link novo / nada |
| GET | `/v1/operacao/uso` | dia ou mês, página, ordem | uso por escola |

Cookie de renovação `turmma_operacao`, HttpOnly, `SameSite=Strict`, `Path=/v1/operacao/sessao`,
separado do `educa_sessao`. Token de acesso de 10 min com `sub` (operador) e `sid`, sem `esc`.

## 5. Fluxo

**Nascimento.** `ops:operador criar` grava o operador sem senha e um `ConviteOperador`, com o token
em arquivo 0600, como o do coordenador. O primeiro operador é criado com o `OPERADOR` do ambiente
como `criadoPor`. O link `/operacao/convite#<token>` leva a senha e à configuração do segundo fator,
que usa `segundo-fator.ts` e `cifra-do-segredo.ts` do F1 com o id do operador como AAD. O
`MfaService` não serve: ele abre sessão de escola.

**Entrada.** Email e senha → desafio → código → sessão. A tentativa conta no
`ContadorDeTentativas` com o prefixo `op:` (email e `operador.id`), sem colidir com o de escola.
Toda requisição confere a sessão: `ultimoUsoEm` com mais de 30 min, `expiraEm` vencido,
`encerradaEm` ou `operador.desativadoEm` → 404, e a web volta para a entrada. `ultimoUsoEm` é
gravado no máximo uma vez por minuto.

**Criar escola e convite.** O controller valida com o contrato e chama o caso de uso do F1 numa
transação, e a auditoria sai com `autor_operador`. O token do convite volta só na resposta do
POST; não é guardado em claro nem registrado em log. Refazer revoga e cria na mesma transação,
com `update ... where revogado_em is null and usado_em is null` no convite de origem: dois refazer
simultâneos deixam um só convite valendo, e o segundo responde "o convite mudou, atualize".

**Panorama.** Uma consulta por página (25 escolas), com subconsultas agregadas por `escola_id`:
turmas do ano em curso; professores com vínculo `confirmado` no ano em curso (distintos); alunos
ativos — `usuario` aluno sem `desativado_em` e com vínculo não encerrado no ano em curso, a mesma
definição que a A1 vai usar; estado — `ativa` se há coordenador com conta ativada, senão o do
último convite de coordenação (`pendente` ou `vencido`); e o uso do último dia fechado e do mês,
lido de `uso_infra_diario` como faz o `UsoRepository` (mês soma requisições e jobs e pega o pico de
bytes). Sem fila: até dez escolas no primeiro ano (D25).

**Falhas.** Banco fora: estado de erro. Redis fora: o login segue o seguro do F1. Consolidação das
2h atrasada: aparece o último dia fechado que existe, com a data.

## 6. Isolamento

É a exceção declarada da regra 10, item 9. Os únicos métodos sem escopo do módulo são os do
`PanoramaRepository` (`panoramaDasEscolas`, `usoDasEscolas`, `redes`), cada um com
`@SemEscopo(justificativa)`, e devolvem só id, nome, slug, estado e número. Escrita dentro de uma
escola continua indo pelo caso de uso do F1, com o contexto da escola aberto por ele.

Testes:
- **arquitetura**: só `apps/api/src/operacao/` importa o `PanoramaRepository`; todo controller do
  módulo tem `@RotaDeOperacao` e nenhum tem `@Permite`; `IMPORTADORES_PERMITIDOS_DO_COMANDO` do
  `escola.repository.test.ts` ganha exatamente o service do painel; o `arquitetura.test.ts`
  continua prendendo a `ResolucaoDeTenantRepository` em `sessao/`
- **isolamento**: coordenador, professor e aluno, com sessão válida, recebem 404 em toda rota
  `/v1/operacao/*` (lista gerada das rotas registradas, não escrita à mão); o token de operador
  recebe 404 em toda rota de escola; operador não alcança turma nem aluno pelo id
- **efetividade**: tirar a `GuardaDeOperador` de um controller deixa o teste de arquitetura e o de
  isolamento vermelhos

## 7. Dado pessoal

| Item | Resposta |
|---|---|
| Campos pessoais tocados | nome e e-mail da primeira coordenadora (entrada do convite, já no mapa) |
| Novos campos | conta de operador (já no mapa, D76); convite de operador, sessão de operador e `registro_operacao` entram em `docs/lgpd.md` nesta spec |
| Log | só ids e evento (`operacao.escola.criada`, `operadorId`, `escolaId`); nunca e-mail, token nem nome |
| Auditoria | rede, escola e convite da coordenação na `auditoria`, com `autor_operador`; o resto em `registro_operacao` |
| Provedor externo | nenhum |
| Retenção | `registro_operacao`: 6 meses (Marco Civil, art. 15), apagado pelo `sistema.expurgar-acesso`; sessão: 30 dias após encerrar; convite de operador: 30 dias após usar, revogar ou vencer; operador desativado: nome e e-mail apagados em 5 anos, o apelido fica na auditoria |
| Autorização por objeto | não há objeto de escola no painel: toda leitura é panorama, e o id de escola só serve para gerar convite |
| DTO de saída | panorama: `id, nome, slug, rede{id,nome}, estado, turmas, professores, alunos, uso{dia,mes}`; nunca e-mail, nome da coordenadora nem contagem por turma |

## 7b. Conformidade CNE

Não se aplica: não há IA nem dado de aluno.

## 7c. Carga e falha

| Item | Resposta |
|---|---|
| Caminho quente? | nenhum: poucos operadores, fora do horário letivo das escolas |
| Rate limit | por operador (`rl:op:{id}`), e o login pelo contador por conta do F1 |
| Corridas | refazer convite: update condicional; apelido e e-mail: restrição única |
| Índices | os de `escola_id` já existentes; `uso_infra_diario` pela PK `(escola_id, dia)` basta até dezenas de escolas |
| Métrica, alerta, carga | contagem de `entrada_falha` por minuto; sem alerta novo; o cenário de carga não muda |

## 9. Frontend

Rotas `/operacao/entrar`, `/operacao/mfa`, `/operacao/convite`, `/operacao` (Escolas) e
`/operacao/uso`, num chunk próprio carregado sob demanda: a web da escola não baixa o código do
painel. A sessão fica numa variável de módulo separada da `api/sessao.ts`, com `BroadcastChannel`
próprio. Telas: **Escolas** (tabela paginada e ordenável, com estado em texto e cor só de reforço),
**Nova rede** e **Nova escola** em diálogo, **Convite da coordenação** com o link num campo de
leitura, botão Copiar e o aviso "este link aparece uma vez", e **Uso** (dia fechado ou mês). A
casca é a da D72, com a faixa "Operação Turmma" no topo. Os tokens entram no tema do Tailwind com
os nomes da 9.9 e a borda de campo `#8F8F8F`, e valem para as telas do F1 também. Quatro estados, teclado, toque, 360 px, e em Chromebook
com CPU 4× e rede 3G a lista abre em até 2 s.

## 10. Testes

| Camada | O que será testado |
|---|---|
| Unidade | estado da escola a partir de coordenador e convite; ordenação e paginação; `FORMATO_OPERADOR` no comando |
| Integração | login com e sem MFA, espera crescente por conta, 30 min parado e 8 h; convite de operador; refazer simultâneo; panorama com duas escolas sintéticas (contagem certa, zero campo de pessoa); desativar operador encerra a sessão na requisição seguinte |
| E2E | operador entra, cria rede e escola, copia o convite; a coordenadora abre e ativa; a lista mostra a escola ativa; em `chromebook` e `celular`, com axe |
| Isolamento | seção 6 |

## 11. Conformidade com as regras

| Regra | Como é atendida | Desvio e justificativa |
|---|---|---|
| 10, item 1 | toda tabela de escola continua com `escolaId` | tabelas do operador sem `escolaId`: são da equipe, não de escola; alternativa recusada: operador como usuário de uma "escola Turmma", que o faria aparecer em consulta de escola |
| 10, item 9 | três consultas sem escopo, num repository, com justificativa e teste de arquitetura | nenhum |
| 00, 20, 50 e 80 | repository e DTO; panorama sem pessoa, token só na resposta, log por id; quatro estados, token em memória; limite por operador e por conta | nenhum |

## 12. Premissas não verificadas

Nenhuma dependência externa.

## 13. Riscos técnicos

- **Mexer em `rotaSemSessao`** abre rota sem guarda de escola: por isso o teste de arquitetura exige
  a `GuardaDeOperador` em todo controller marcado, e o de isolamento varre as rotas registradas
- **Tokens da D72 no `apps/web`** mudam a aparência das telas do F1: fica na primeira tarefa de web,
  com o e2e do F1 como rede de segurança
- **Pendências herdadas do F1**: a esteira instável por desenho não entra (decisão de 23/09/2026:
  seguir e vigiar, e `/corrigir` no primeiro vermelho sem causa); `BroadcastChannel`, `details` do
  seletor e `saidaConfirmada` ficam para a primeira tarefa de web da A1, que é a área da escola
