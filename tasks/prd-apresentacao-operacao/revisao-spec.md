# Revisão de spec — apresentacao-operacao

**Subagentes obrigatórios:** `test-engineer`, `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `frontend-reviewer`

## Rodada 1 — 23/09/2026

**Veredito: REPROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 14 |
| `tenancy-guardian` | REPROVADO | 3 |
| `privacy-guardian` | REPROVADO | 3 |
| `infra-guardian` | REPROVADO | 4 |
| `frontend-reviewer` | AJUSTES NECESSÁRIOS | 5 |

### Correções exigidas na Tech Spec

**Isolamento e guardas**
- Seção 6: listar **toda** consulta sem escopo que uma rota `/v1/operacao/*` alcança (`criarRede`, `criarEscola`, `contaParaConvite`, `escolaDoConviteParaOperador`, a resolução do `:id` em escola, a busca do convite no refazer), com as justificativas que dizem "só o comando" reescritas; o estado do convite sai do `convite.service` para o `PanoramaRepository`; a seção 11 registra o desvio da regra 10, item 9 (`tenancy-guardian`)
- Seções 1, 2 e 6: `@RotaDeOperacao` aplica a `GuardaDeOperador` por `applyDecorators`; marcador só em `apps/api/src/operacao/`, conferido por método e por classe; prefixo `/v1/operacao` e marcador juntos; as rotas anônimas do operador numa lista fechada com marcador próprio; 404 comparado byte a byte com o de rota inexistente (`tenancy-guardian`, `test-engineer`)
- Seções 4 e 5: o refazer precisa de onde tirar o convite — o panorama devolve o id do último convite de coordenação, ou a rota vira `/escolas/:id/convite-coordenacao/refazer`; refazer e revogar filtram `tipo = coordenador` (`tenancy-guardian`, `privacy-guardian`, `test-engineer`)
- Desafio do operador com `typ` próprio, e desafio e cookie cruzados testados nos dois sentidos (`test-engineer`, `tenancy-guardian`)

**Concorrência**
- Um só convite ativo por usuário garantido no banco (único parcial em `convite (escola_id, usuario_id) where usado_em is null and revogado_em is null`), com teste de duas gerações e de geração com refazer em paralelo (`infra-guardian`, `test-engineer`)
- Seção 5: gravação condicional declarada para aceite do convite de operador, código de recuperação, passo do TOTP, `mfa/configurar` duplo, rotação do refresh e uso único do desafio, com teste de `Promise.all` em cada um (`infra-guardian`, `test-engineer`)
- Clique duplo em "Nova rede" e em "Nova escola": restrição única ou idempotência (`infra-guardian`, `test-engineer`)

**Limite e borda**
- Seção 7c: dizer onde `rl:op:{id}` é consumido (a `GuardaDeLimite` reconhece o marcador e conta pelo `sub`); rotas de entrada com contador por conta e limite por IP que rebaixa; `guarda-limite.ts` e `contador-de-tentativas.ts` na seção 2, com o prefixo e a origem `conhecido/outro` declarados (`infra-guardian`)
- Borda: no MVP local o painel sai pela mesma borda, com o motivo; antes do staging, `/v1/operacao/*` e `/operacao` ficam restritos (IP permitido, host separado ou rede interna), registrado em `tasks/prd-fundacao-tecnica/notas-staging.md` (`infra-guardian`)
- Banco fora na conferência da sessão responde 503 tipado, nunca 404 (`infra-guardian`)

**Dado pessoal**
- `operador_criado`, `operador_desativado`, `mfa_configurado` e `convite_operador` vão para uma auditoria da operação com retenção de vigência + 5 anos; `registro_operacao` fica só com entrada, falha de entrada e saída, com IP e 6 meses (`privacy-guardian`)
- Retenção alinhada entre spec e `docs/lgpd.md` (operador desativado: nome e e-mail apagados, apelido fica); linha para o HMAC dos códigos de recuperação; o `sistema.expurgar-acesso` declarado como quem apaga sessão, convite e dado do operador desativado (`privacy-guardian`)

**Frontend**
- Sessão vencida distinguível de id inexistente (401 tipado só para bearer de operador), renovação antes de mandar para a entrada, mensagem que diz o que fazer e o diálogo preservado (`frontend-reviewer`)
- Convite: resumo antes de gerar, confirmação ao revogar e ao refazer, pergunta ao fechar com o link na tela, reação ao "o convite mudou" (`frontend-reviewer`)
- Tokens da D72: tabela de troca das cores do F1, reescrita das guardas de estilo (`e2e/casca.spec.ts`, `estilos.test.ts`) e reprovação de `color-mix(` no CSS servido (`frontend-reviewer`)
- Chunk do painel: orçamento separado da entrada, teste de que a entrada da escola não importa `operacao/`, fallback e fronteira de erro do `import()` (`frontend-reviewer`)
- Tabela de escolas em 360 px: lista ou rolagem interna, ordenação por seletor rotulado, e2e sem rolagem horizontal (`frontend-reviewer`)

**Testes** (`test-engineer`, bloqueantes 1 a 14)
- RF1 (nenhuma rota cria operador; `criadoPor` e registro do comando; desativar inexistente), RF2 e RF3 (recuperação e TOTP de uso único, desafio que não serve de bearer, respostas iguais por status e corpo, conta Y entra depois de 10 erros na X, contador que não colide com o da escola), RF5 (slug repetido, rede inexistente, slug em paralelo), RF6 (token nunca em GET, só `tokenHash` no banco, recarregar não mostra), RF7 (valores sentinela procurados no JSON cru de toda resposta, inclusive de erro), contagem e estado com os casos do domínio (duas disciplinas contam um professor, vínculo não confirmado, aluno transferido ou desativado, ano anterior, turma sem professor, escola zerada, reivindicação pendente, convite revogado sem refazer, borda das 72 h), RF8 (pico de bytes, hoje fora, consolidação atrasada, 22h de Brasília, virada de mês), RF9 em integração com 30 escolas e desempate estável, RF10 com dois operadores e autor vindo da sessão, aceite de convite de operador em paralelo e nos quatro estados

### Recomendações
- `Cache-Control: no-store` nas respostas com link de convite e códigos de recuperação; saída validada por contrato estrito; `entrada_falha` sem o e-mail digitado; nenhum interceptor grava corpo de `/v1/operacao/*` (`privacy-guardian`)
- Desempate por `id` na ordenação e `EXPLAIN` com 30 escolas; separar a origem `conhecido/outro` no contador do operador (`infra-guardian`)
- UUID gerado no banco nas tabelas novas; título do `escola.repository.test.ts` reescrito (`tenancy-guardian`)
- Reuso do refresh anterior encerra a sessão; teste de build de que a escola não baixa o chunk; três `@SemEscopo` fixados no teste de arquitetura; "endereço" e "slug" alinhados (`test-engineer`)
- Texto dos vazios; `aria-sort`, foco no diálogo, "Copiado" em região viva; itens da lateral; formato local de data e bytes; tokens da 9.9, e não o `index.css` inteiro; Fustat; `docs/interface.md` seções 7 e 12 apontando para a A0 (`frontend-reviewer`)
- Dívida aceita: o token do primeiro operador ainda vai para arquivo 0600 (`privacy-guardian`)

### Depois da rodada 1 — divisão da spec (23/09/2026, Joaquim)

Com as correções, a Tech Spec passaria de 3.000 palavras. A spec foi dividida: a **A0** fica com a
identidade do operador e a pele da D72 (este documento), e a **A0b** (`tasks/prd-apresentacao-painel/`)
com o painel. As correções exigidas acima que são do painel **vão para a Tech Spec da A0b**, e a
rodada 1 dela as cobra:
- consultas sem escopo que as rotas do painel alcançam (`criarRede`, `criarEscola`,
  `contaParaConvite`, `escolaDoConviteParaOperador`, a resolução do `:id`), com justificativas
  reescritas e o estado do convite no repository do painel (`tenancy-guardian`)
- o refazer com id de onde tirar, e refazer e revogar só de convite de coordenador
- um só convite de coordenação ativo por usuário, no banco, com gerar e refazer em paralelo
- clique duplo em Nova rede e Nova escola
- valores sentinela de pessoa em toda resposta do painel; contagem e estado com os casos do
  domínio; uso com pico de bytes, hoje fora e fuso; paginação estável com 30 escolas; auditoria com
  o operador da sessão (`test-engineer`, bloqueantes 5 a 13)
- confirmação antes de gerar, revogar e refazer; tabela a 360 px; texto dos vazios; formato local
  (`frontend-reviewer`)

## Rodada 2 — 23/09/2026

**Veredito: REPROVADA** — os bloqueantes da rodada 1 que ficaram na A0 foram todos confirmados como
resolvidos; os de agora são novos e pontuais.

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 6 |
| `tenancy-guardian` | REPROVADO | 1 |
| `privacy-guardian` | REPROVADO | 2 |
| `infra-guardian` | REPROVADO | 1 |
| `frontend-reviewer` | AJUSTES NECESSÁRIOS | 1 |

### Correções exigidas na Tech Spec
- Seção 5: `configurar_mfa` por `/sessao/email` só dentro das 72 h do convite aceito; desafio de uma etapa recusado na outra; `mfa/configurar` de conta com MFA ativo não muda nada; teste de cada um (`test-engineer` 2)
- Seção 10: desafio de uso único em paralelo e com Redis fora (`test-engineer` 1); renovação que respeita 30 min, 8 h, saída e desativação, e acesso vencido com sessão viva que dá 401 e renova (`test-engineer` 3); regra do `OPERADOR` em todo `ops:*` (`test-engineer` 6)
- Seção 6: operador → rotas anônimas da escola nunca produzem sessão nem desafio de escola, em vez de "igual a inexistente" (`test-engineer` 4, `tenancy-guardian`); marcador e prefixo `/v1/operacao` conferidos nos dois sentidos (`test-engineer` 5)
- Seção 6 e 11: critério pelo qual as consultas às tabelas do operador não levam `@SemEscopo`, com dois testes de arquitetura (repository só importa as tabelas da operação; as tabelas só são importadas por ele, pelo comando e pelo expurgo) (`tenancy-guardian`)
- Seção 5 e 7c: rebaixamento por IP só em `sessao/email` e `convite/aceitar`; `sessao/mfa` pelo contador por operador; `convite/consultar`, `mfa/configurar`, `renovar` e `sair` com o limite anônimo por IP recusável, como no F1, com teste de 429 (`infra-guardian`)
- Seção 7 e `docs/lgpd.md`: prazo do convite vencido e da sessão só expirada; tabelas do expurgo pelo nome; desativar revoga convite e encerra sessões na mesma transação; testes da desativação e do expurgo prazo a prazo (`privacy-guardian` 1 e 2)
- Seção 9: botão primário, `white` e modificador de opacidade na tabela de troca, com a guarda (`frontend-reviewer`)

### Recomendações
- Expurgo pelo `apagarLoteVencido` existente, sem método `@SemEscopo` novo; `GuardaDeOperador` põe só `operadorId` no contexto (`tenancy-guardian`)
- `configurar` troca segredo e códigos na mesma transação; o que a `GuardaDeLimite` faz com credencial que não é de operador; runbook: com o Redis fora, `ops:*` é o caminho (`infra-guardian`)
- Cookie de dispositivo do operador no mapa; `no-store` e contrato estrito com teste; e-mail sentinela em `AcessoOperacao`; autor da `AuditoriaOperacao` vem do comando (`privacy-guardian`)
- `ops:operador convite` com pendente; quatro estados em `consultar` e `aceitar`; `ultimoUsoEm` aos 29/31 min (`test-engineer`)
- Texto do 503; aviso antes dos 30 min; teto do chunk; chave em texto e `otpauth://` além do QR; `docs/interface.md` linhas 268, 376 e 1262 (`frontend-reviewer`)

## Rodada 3 — 23/09/2026

**Veredito: REPROVADA** — três aprovações; o que falta é a lista de testes e uma frase do MFA.

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 2 |
| `tenancy-guardian` | APROVADO | 0 |
| `privacy-guardian` | APROVADO | 0 |
| `infra-guardian` | REPROVADO | 1 |
| `frontend-reviewer` | APROVADO | 0 |

### Correções exigidas na Tech Spec
- Seção 10: lista fechada e enumerada dos cenários da A0, com os do `infra-guardian` e do
  `tenancy-guardian` e sem os da A0b, num anexo fixo que faz parte da spec (`test-engineer` 1,
  `infra-guardian`) → `cenarios.md`
- Seção 5: "configurar em duas abas" coerente com a cláusula do banco, e o passo depois de
  configurar até a sessão (`test-engineer` 2) → configurar consome o desafio, devolve um de etapa
  `mfa`, vale o último gravado, e a ativação é no primeiro código válido

### Recomendações
- Testes de arquitetura procurando também o nome físico das tabelas em SQL cru; o comando fora da
  lista de quem importa as tabelas; justificativa do `apagarLoteVencido` reescrita (`tenancy-guardian`)
- Link em `caramelo-texto` sublinhado, e `noite` só para o foco; cenários de tela copiados para a
  tarefa (`frontend-reviewer`)
- Bootstrap com o último operador desativado, autodesativação e dois bootstrap em paralelo; runbook
  com o caminho `ops:*` quando o Redis cai (`test-engineer`, `infra-guardian`)

## Rodada 4 — 23/09/2026

**Veredito: REPROVADA** — só o `test-engineer`, com um bloqueante; os outros quatro aprovaram.

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 1 |
| `infra-guardian` | APROVADO | 0 |
| `tenancy-guardian`, `privacy-guardian`, `frontend-reviewer` | APROVADO na rodada 3 | — |

### Correções exigidas na Tech Spec
- Seção 5 e C18: dois `configurar` em paralelo podiam misturar o segredo de uma aba com os códigos
  das duas, e a ativação podia pegar um segredo diferente do conferido → o `configurar` começa pelo
  `update operador ... returning mfa_versao` (trava a linha), o desafio leva a versão, e a ativação
  exige a versão; C18 em `Promise.all` e C18b novo (`test-engineer`)

### Recomendações aplicadas junto
- Seção 6 alinhada ao C45; `desativar` sob o mesmo lock do bootstrap e sem desativar o último ativo
  (C5); bordas de 71h59 e 72h01 (C15); desafio reenviado ao `configurar` (C17); 503 também no
  `/renovar` (C31) (`test-engineer`)
- `rl:op` em toda rota `@RotaDeOperacao` (C36) e limites com o Redis fora (C36b) (`infra-guardian`)

## Rodada 5 — 23/09/2026

**Veredito: REPROVADA** — `test-engineer`, um bloqueante; a correção da rodada 4 foi confirmada.

### Correções exigidas na Tech Spec
- Seção 5: todas as travas (configurar, ativação, TOTP, recuperação) exigem `desativado_em is null`,
  para um desafio emitido antes do `desativar` não gravar nem ativar nada; cenário C6b
  (`test-engineer`)

### Recomendações aplicadas junto
- A versão é lida com o segredo e, diferente, dá "configure de novo" sem conferir o código nem
  contar tentativa; C18 e C18b com barreira nas duas ordens; C5 partindo de exatamente dois ativos

## Rodada 6 — 23/09/2026

**Veredito: REPROVADA** — `test-engineer`, dois bloqueantes do mesmo ponto; a correção da rodada 5
foi confirmada.

### Correções exigidas na Tech Spec
- Seção 5: o `/sessao/mfa` numa transação só, que começa travando a linha do operador ativo e
  consome o código, ativa e insere a sessão dentro dela (`test-engineer` 1)
- C6b com barreira nas duas ordens, resposta igual à de desafio inválido e zero sessões ativas
  (`test-engineer` 2)

### Recomendações aplicadas junto
- Origem `conhecido`/`outro` de volta ao texto da entrada

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-23 13:39:54 | 2026-09-23 13:41:29 | `privacy-guardian` | 1 | REPROVADO | aa9d001d2eb7750e5 |
| 2026-09-23 13:39:57 | 2026-09-23 13:41:53 | `infra-guardian` | 1 | REPROVADO | ab25682de59f91048 |
| 2026-09-23 13:39:47 | 2026-09-23 13:42:17 | `test-engineer` | 1 | REPROVADO | a1454ae96aa4b5610 |
| 2026-09-23 13:39:50 | 2026-09-23 13:42:19 | `tenancy-guardian` | 1 | REPROVADO | ab652f290facfa6fc |
| 2026-09-23 13:40:00 | 2026-09-23 13:42:22 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | a1904d4cf1ec16e32 |
| 2026-09-23 13:48:55 | 2026-09-23 13:49:54 | `privacy-guardian` | 2 | REPROVADO | a3777b6efe8225c12 |
| 2026-09-23 13:48:45 | 2026-09-23 13:50:11 | `test-engineer` | 2 | REPROVADO | ae5e31610b3b00c02 |
| 2026-09-23 13:48:59 | 2026-09-23 13:50:24 | `infra-guardian` | 2 | REPROVADO | a168a3c7b8a2ddb56 |
| 2026-09-23 13:49:03 | 2026-09-23 13:50:46 | `frontend-reviewer` | 2 | AJUSTES NECESSÁRIOS | afe2c42872cd409bb |
| 2026-09-23 13:48:50 | 2026-09-23 13:50:47 | `tenancy-guardian` | 2 | REPROVADO | ae19f88b9c728d238 |
| 2026-09-23 13:54:25 | 2026-09-23 13:55:00 | `tenancy-guardian` | 3 | APROVADO | ab39cc89bb941af28 |
| 2026-09-23 13:54:32 | 2026-09-23 13:55:10 | `infra-guardian` | 3 | REPROVADO | aedf1650d9b524be6 |
| 2026-09-23 13:54:35 | 2026-09-23 13:55:13 | `frontend-reviewer` | 3 | APROVADO | a17aab2b3182ce7c3 |
| 2026-09-23 13:54:28 | 2026-09-23 13:55:15 | `privacy-guardian` | 3 | APROVADO | ac9238c2ba2653b47 |
| 2026-09-23 13:54:21 | 2026-09-23 13:55:28 | `test-engineer` | 3 | REPROVADO | a505e4dc839d70264 |
| 2026-09-23 13:57:16 | 2026-09-23 13:57:35 | `infra-guardian` | 4 | APROVADO | a8577d76d33145d26 |
| 2026-09-23 13:57:12 | 2026-09-23 13:58:40 | `test-engineer` | 4 | REPROVADO | a2b0d3db1050c5a22 |
| 2026-09-23 13:59:45 | 2026-09-23 14:00:37 | `test-engineer` | 5 | REPROVADO | a7bccf90a0ade5a5f |
| 2026-09-23 14:01:21 | 2026-09-23 14:02:04 | `test-engineer` | 6 | REPROVADO | ab7c531f6f152ab5e |
