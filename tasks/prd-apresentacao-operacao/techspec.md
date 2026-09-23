# Tech Spec — Identidade do operador Turmma

**PRD:** `tasks/prd-apresentacao-operacao/prd.md`
**Status:** rascunho (7ª versão, depois da rodada 6 do `/revisar-spec`; o painel foi para a A0b)

## 1. Resumo da abordagem

O operador ganha identidade fora do modelo de escola: tabelas, sessão e tokens próprios
(`operador+jwt`, `desafio-operador+jwt`). As rotas `/v1/operacao/*` usam `@RotaDeOperacao()`, que
aplica a `GuardaDeOperador` por `applyDecorators`, ou `@EntradaDeOperacao()`, numa lista fechada; as
guardas de escola tratam as duas como sem sessão. Do F1 vêm só as peças puras (`segundo-fator.ts`,
`cifra-do-segredo.ts`, hash de senha, `ContadorDeTentativas`). A pele da D72 entra no `apps/web`
inteiro numa tarefa própria, antes das telas do operador.

## 2. Módulos afetados

| Módulo | Novo ou alterado | O quê |
|---|---|---|
| `apps/api/src/operacao/` | novo | controllers de sessão e convite, `GuardaDeOperador`, `OperadorRepository`, os dois marcadores |
| `apps/api/src/ops/` | novo e alterado | `ops:operador -- criar`, `desativar`, `convite`; `comando.ts` confere `OPERADOR` contra operador ativo |
| `packages/nucleo/src/identidade/`, `limite/guarda-limite.ts` | alterado | `rotaSemSessao` e limite reconhecem os marcadores; `verificarTokenDeOperador`; bearer de operador em rota de escola → 404 |
| `apps/api/src/sessao/contador-de-tentativas.ts` | alterado | prefixo por parâmetro |
| `packages/nucleo/src/` | alterado e novo | `conferencia-das-permissoes.ts` aceita os marcadores; schema das seis tabelas; expurgo (seção 7) |
| `apps/web/` e `tools/ci/tamanho-web.test.ts` | alterado e novo | tokens da D72 nas telas do F1; `src/operacao/`; orçamento (seção 9) |

## 3. Modelo de dados

Ids UUID. **Sem `escolaId`** (seção 11).

```
Operador                  id, apelido* (FORMATO_OPERADOR, único), nome?, email? (citext, único),
                          senhaHash?, mfaSegredoCifrado?, mfaChaveVersao?, mfaVersao* (0),
                          mfaAtivadoEm?, mfaUltimoPasso?, criadoEm*, desativadoEm?
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

`apelido` é o que já vai para `auditoria.autor_operador`. Desativar apaga nome, e-mail, senha,
segredo e códigos; o apelido fica. Uma migration, só de tabelas novas.

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

Cookie `turmma_operacao`, HttpOnly, `SameSite=Strict`, `Path=/v1/operacao/sessao`. Acesso de 10 min,
sem `esc`. Segredo, códigos e desafio saem com `no-store`, por contrato estrito de `packages/shared`.

## 5. Fluxo

**Nascimento.** `ops:operador criar` grava o operador e um convite, com o token em arquivo 0600
(dívida aceita: uma vez por pessoa da equipe). Sem operador ativo, aceita o `OPERADOR` do ambiente
com autor `bootstrap`; com um, todo `ops:*` exige `OPERADOR` de operador ativo. `criar` de bootstrap
e `desativar` rodam sob o mesmo `pg_advisory_xact_lock`, e ninguém desativa a si mesmo nem o último
ativo. `convite` revoga o
pendente na mesma transação; `desativar` apaga o dado pessoal, revoga o convite e encerra as sessões
numa transação só. O autor da `AuditoriaOperacao` é o `OPERADOR` do comando; o da entrada e do MFA,
o operador da sessão.

**Etapas.** O desafio leva a etapa, e cada rota só aceita a sua.
`/sessao/email` só devolve `configurar_mfa` até 72 h depois do aceite e sem segundo fator ativo;
fora disso, igual a senha errada, e o caminho é um convite novo.

**Travas no banco**, com `returning`, resposta tipada para quem perde e `desativado_em is null`:
- aceite: `update convite_operador set usado_em = now() where id = $1 and usado_em is null and
  revogado_em is null and expira_em > now()`
- `/sessao/mfa`, numa transação só: trava a linha (`select ... for update where id = $1 and
  desativado_em is null`), consome o código (TOTP: `set mfa_ultimo_passo = $p where
  mfa_ultimo_passo is null or mfa_ultimo_passo < $p`; recuperação: `delete ... returning`), ativa se
  for o caso e insere a sessão; o `desativar`, que também trava a linha, espera por ela ou a vê
  desativada
- configurar: consome o desafio e, numa transação, começa por `update operador set
  mfa_segredo_cifrado = $s, mfa_versao = mfa_versao + 1 where id = $1 and mfa_ativado_em is null
  returning mfa_versao`, depois apaga e insere os códigos; devolve desafio de etapa `mfa` com a
  versão. Ativar exige `mfa_versao = $versao_do_desafio`: diferente, "configure de novo", sem
  conferir o código nem contar tentativa
- renovação: `update ... set refresh_hash = $novo, refresh_hash_anterior = $atual where id = $1 and
  refresh_hash = $atual`; o anterior vale 30 s, e reusado depois encerra a sessão (padrão do F1)
- desafio: `jti` com `SET NX` no Redis por 5 min; Redis fora, 503

**Entrada.** O `ContadorDeTentativas` usa `login-op:`, pelo e-mail e pelo `operador.id`, com a
origem `conhecido`/`outro` do cookie de dispositivo do F1, com chave própria. `entrada_falha` não
grava o e-mail.

**Conferência da sessão**, pela `GuardaDeOperador`, que põe no contexto só o `operadorId`, nunca
`escolaId` (repository de escola chamado por engano falha com erro):
- credencial que não é de operador (sessão, desafio ou cookie de escola, ou nenhuma): **404**, pelo
  mesmo filtro de exceção de uma rota inexistente
- acesso de operador vencido com a sessão viva: **401 `ACESSO_VENCIDO`**, e a web renova
- sessão que terminou (30 min parado, 8 h, saída, operador desativado): **401
  `SESSAO_ENCERRADA`**; o `/renovar` confere as mesmas quatro condições e recusa igual
- banco fora: **503 `INDISPONIVEL_TENTE_DE_NOVO`**
- `ultimoUsoEm` gravado no máximo uma vez por minuto

**Limite.** Nas rotas `@RotaDeOperacao`, a `GuardaDeLimite` verifica o token de operador e conta
`rl:op:{sub}` (valor na configuração operacional); sem token de operador válido não conta nada, e a
`GuardaDeOperador` responde 404, como rota inexistente. Nas de entrada: `sessao/email` e
`convite/aceitar` rebaixam por IP no mesmo semáforo do hash do F1, e quem recusa é o contador por
conta; `sessao/mfa` recusa pelo contador por `operador.id`; `convite/consultar`, `mfa/configurar`,
`renovar` e `sair` usam o limite anônimo por IP recusável (`rl:ip`), como as rotas iguais do F1.

**Borda.** No MVP local, pela mesma borda (tudo é sintético); antes do staging, restrita
(`tasks/prd-fundacao-tecnica/notas-staging.md`).

## 6. Isolamento

As tabelas da seção 3 ficam **fora do modelo de tenant**: não são de escola, e por isso as
consultas a elas não levam `@SemEscopo`. O que prova que isso não vira atalho para dado de escola:
o `OperadorRepository` só toca as seis tabelas da operação, e elas só são tocadas por ele e pelo
expurgo — o `comando.ts` passa pelo repository (C45). E nenhuma rota escapa das
guardas de escola sem cair na de operador.

Testes de arquitetura:
- os dois marcadores só aparecem em `apps/api/src/operacao/`, varrendo método e classe
- toda rota com `@RotaDeOperacao` tem a `GuardaDeOperador` no handler resolvido; todo caminho
  `/v1/operacao` tem um dos dois marcadores, e toda rota com marcador está sob `/v1/operacao`
- as rotas `@EntradaDeOperacao` são exatamente as sete da seção 4, escritas no teste
- nenhuma rota registrada cria operador

Teste de isolamento, com a lista gerada das rotas registradas:
- sessão de coordenador, professor e aluno, desafio de escola e cookie `educa_sessao`: toda rota
  `/v1/operacao/*` responde igual, em status e corpo, a uma rota inexistente; as de entrada nunca
  produzem sessão de operador a partir deles
- token, desafio e cookie de operador: nas rotas de escola com sessão, igual a rota inexistente;
  nas de entrada da escola, nunca produzem sessão nem desafio de escola
- efetividade: tirar a guarda de um handler deixa os dois vermelhos

## 7. Dado pessoal

| Item | Resposta |
|---|---|
| Novos campos | seção 3, já no mapa de `docs/lgpd.md` |
| Log | evento e ids; nunca e-mail, senha, token nem código. Provedor externo: nenhum |
| Retenção | pelo `sistema.expurgar-acesso`, acrescentando alvos ao `apagarLoteVencido` que já existe (sem método `@SemEscopo` novo): `ConviteOperador` 30 dias após usar, revogar ou vencer; `SessaoOperador` 30 dias após encerrar ou, sem encerramento, após `expiraEm`; `AcessoOperacao` 6 meses. Nunca passam pelo expurgo: `AuditoriaOperacao` (vigência + 5 anos) e `Operador`, cujo dado pessoal sai no `desativar` |
| DTO de saída | `eu`: apelido e nome; nada mais sai do módulo |

## 7b. Conformidade CNE

Não se aplica.

## 7c. Carga e falha

Fora do caminho quente, mas mexe no código do login da escola (guardas e contador) sem somar carga a
ele. Limite, corridas e o que acontece quando o banco ou o Redis caem estão na seção 5. Métrica: a
contagem de `entrada_falha` por minuto; sem alerta novo, e o cenário de carga não muda. O
`docs/runbook.md` ganha uma linha: com o Redis fora, o operador não entra, e o caminho é `ops:*`.

## 9. Frontend

**Pele da D72, primeira tarefa de web.** O `@theme` do `estilos.css` passa a ser o bloco da 9.9 do
`docs/interface.md` (não o `mockups/src/index.css`: sem `neutral`, Inter nem Quicksand). Troca nas
telas do F1:

| Hoje | Vira |
|---|---|
| `slate-*` | `tinta`, `apoio`, `sutil`, `inativo`, `linha`, `borda-campo`, `realce` |
| `blue-700` de foco e link | foco: `noite`, 2 px com 2 px de afastamento (`caramelo-noite` sobre preto); link: `caramelo-texto` sublinhado (9.1) |
| botão primário `blue-700` / `text-white` | `caramelo` com texto `tinta` (6,4:1); hover `caramelo-claro`, pressionado `caramelo-fundo`, desligado `inativo`. O preto fica para a ação oficial (9.1) |
| `amber`, `red`, `emerald` | `pendente`, `erro`, `ok`, com os `-cx` de fundo |
| modificador `/NN`; fundo do diálogo | token opaco; `rgba()` literal |

`white` e `black` ficam: estão no `@theme`. Logotipo pelos SVGs de `mockups/public/marca/`, em
curvas, sem a Fustat. Guardas: `estilos.test.ts` aceita só os nomes do `@theme` e reprova
modificador de opacidade; `e2e/casca.spec.ts` confere os hex no CSS servido e reprova `oklch(` e
`color-mix(`.

**Área do operador.** `/operacao/convite`, `/entrar`, `/mfa`, `/mfa/configurar` e `/operacao`, num
chunk com `import()`, fallback `EstadoCarregando` e fronteira de erro com "Tente de novo". Sessão
em variável de módulo própria, com `BroadcastChannel` próprio. `ACESSO_VENCIDO` renova;
`SESSAO_ENCERRADA` vai à entrada com "Sua sessão terminou. Entre de novo para continuar."; o 503
diz "O Turmma está indisponível agora. Tente de novo em instantes" e fica na tela; aviso 2 min antes
dos 30 min, como o `inatividade.ts`. Casca com a faixa "Operação Turmma" em `noite`, Sair a um
clique, `document.title` por rota e `<h1>` para leitor de tela. Códigos de recuperação uma vez, com
"Copiar" em região viva; o QR vem com a chave em texto e o `otpauth://`.

**Orçamento.** 150 kB brotli para a entrada; 60 kB para `operacao-*.js` (`manualChunks`); teste de
que a entrada da escola não importa nada de `apps/web/src/operacao/`.

## 10. Testes

| Camada | O que será testado |
|---|---|
| Integração, e2e, unidade e build | os cenários enumerados de `cenarios.md`, parte desta spec: C1 a C49 (com C6b, C18b e C36b), E1 a E5, U1 a U3, B1 e B2, um teste cada |
| Isolamento e arquitetura | seção 6 |

## 11. Conformidade com as regras

Único desvio: as tabelas do operador não têm `escolaId` (regra 10, item 1), porque são da equipe e
não de escola; a alternativa recusada foi fazer do operador um usuário de uma "escola Turmma", que o
poria em consulta de escola. A regra 10, item 9, não ganha método `@SemEscopo` novo (seção 6). As
regras 20, 50 e 80 são atendidas pelas seções 5, 7 e 9, sem desvio.

## 12. Premissas não verificadas

Nenhuma dependência externa.

## 13. Riscos técnicos

- Caminho sem guarda de escola pelo `rotaSemSessao`: preso pela seção 6
- Pele nova quebrando o F1 onde o axe não vê: as guardas de estilo mudam antes das telas
- Herdadas do F1: esteira vigiada; `BroadcastChannel`, `details` e `saidaConfirmada` vão para a A1
