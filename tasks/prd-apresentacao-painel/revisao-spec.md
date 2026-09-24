# Revisão de spec — apresentacao-painel

**Subagentes obrigatórios:** `test-engineer`, `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `frontend-reviewer`

## Rodada 1 — 24/09/2026

**Veredito: REPROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 6 |
| `tenancy-guardian` | REPROVADO | 2 |
| `frontend-reviewer` | AJUSTES NECESSÁRIOS | 2 |
| `infra-guardian` | APROVADO | 0 |
| `privacy-guardian` | APROVADO | 0 |

### Correções exigidas na Tech Spec
- Seção 5: refazer e revogar só alcançam convite `tipo = 'coordenador'`; outro tipo responde `NAO_ENCONTRADO`; o servidor recusa o refazer fora de `pendente` e `vencido`, sem confiar na tela (`tenancy-guardian`; `privacy-guardian` e `test-engineer` recomendaram o mesmo)
- Seção 5: convite usado sem coordenadora ativa (aceito sem entrar, ou coordenadora desativada depois) não pode deixar a escola sem ação; definir o estado e a matriz estado × gerar, refazer, revogar, incluindo refazer de convite vencido (`test-engineer`; `infra-guardian` recomendou o mesmo)
- Seção 10: uso por escola provado em duas escolas, na rota de uso e na ordem `uso`; mês soma e pega o pico; hoje fora; dia 1 e virada de ano (`tenancy-guardian`, `test-engineer`)
- Seção 10: contagens com professor não confirmado, aluno transferido e a decisão da reivindicação pendente (`test-engineer`)
- Seção 10: o token de gerar e refazer não aparece em coluna nem auditoria, e o `tokenHash` é o hash dele (`test-engineer`)
- Seção 7c e 10: mesmo id com outros dados dá `CONFLITO`; ids diferentes com o mesmo slug em paralelo dão `CONFLITO`, não 500, com uma auditoria (`test-engineer`)
- Seção 10, E2E: "o convite mudou" com a lista recarregada; fechar sem copiar pergunta, e o link anterior deixa de abrir depois do refazer (`test-engineer`)
- Seção 9: Uso abaixo de 640 px; E2E das duas telas a 360 px com `scrollWidth <= clientWidth`, 30 escolas, página e ordem (`frontend-reviewer`)
- Seção 9: formato local de número, bytes, dia e mês, com rótulos em português e teste de unidade dos formatadores (`frontend-reviewer`)

### Recomendações
- 7c: `hashtext(escola_id::text)`; a mutação sem trava vale só entre convites do mesmo usuário (`infra-guardian`)
- 5: a ordem `uso` calcula o uso de todas as escolas antes de paginar (`infra-guardian`)
- 4: `id` do pedido UUID v4 ou v7; `rede.criada` fica na auditoria com escola nula (`tenancy-guardian`)
- 11: dizer quantos `@SemEscopo` ficam por módulo (`tenancy-guardian`)
- 9: revisão antes de criar escola, com a prévia do endereço; resumo do convite com escola, nome e e-mail; aviso no refazer; reserva do Copiar sem `navigator.clipboard`, com `aria-live`; `reset()` e `gcTime: 0` na mutation do token; `autocomplete="off"`; textos próprios de `CONFLITO`; vazios do Uso e da Nova escola sem rede; `placeholderData` na troca de página; rodada com throttling (`frontend-reviewer`, `privacy-guardian`)
- Testes extras: mesmo e-mail em duas escolas, autor desativado nas ações de convite, autor pelo HTTP, desempate de ordem por uso com zeros, dois revogar juntos, professor em duas escolas (`test-engineer`)
- `/retro`: usuário de coordenação nunca ativado, que fica depois de revogar e gerar com outro e-mail (`privacy-guardian`)
- PRD: "endereço" é o slug, não endereço postal (`privacy-guardian`)

## Rodada 2 — 24/09/2026

**Veredito: REPROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 1 |
| `tenancy-guardian` | APROVADO | 0 |
| `frontend-reviewer` | APROVADO | 0 |

As correções da rodada 1 foram todas conferidas como feitas. A matriz nova trouxe uma regra sem trava.

### Correções exigidas na Tech Spec
- Seções 5 e 7c: gerar em `aceito` concorre com a primeira entrada da coordenadora antiga, e a ativação não passa pela trava da escola; dizer o mecanismo, pôr o par na 7c, e cenários para a corrida, para revogar em `aceito` seguido de entrada, e para o mesmo e-mail (`test-engineer`)

### Recomendações
- Relógio entre 22h e 23h59 de São Paulo na L2, e o fuso do "último dia" na seção 5; clique duplo no gerar com o mesmo e-mail; trocar o par "gerar e refazer" da E8; professor confirmado com usuário desativado na L1; `sem_coordenacao` com o mesmo e-mail; a linha solta da tabela da seção 10 (`test-engineer`, `frontend-reviewer`)
- I7: teste de alarme que quebra quando a A1 afrouxar o check de tipo; a seção 11 lia a regra 10, item 9 ao contrário; juntar `pedidoRepetido` em `criarRede`/`criarEscola`; frase sobre `NAO_ENCONTRADO` × `CONFLITO` no revogar; registrar para o `/retro` que o `ResolucaoDeTenantRepository` já tem 27 `@SemEscopo` (`tenancy-guardian`)
- Textos de todos os estados e mensagens (vazios, `aceito`, `sem_coordenacao`, 429, 401, `NAO_ENCONTRADO`); nome longo e slug no limite no W6; alvo de 44 px medido (`frontend-reviewer`)

### O que mudou para a rodada 3
- Seção 5: gerar em `aceito` e `sem_coordenacao` revoga o último convite; com o mesmo e-mail o usuário é reusado; a ativação por convite pega a trava da escola antes do `update`. Fuso de São Paulo no último dia. Motivo do `NAO_ENCONTRADO` no revogar
- Seção 7c: linha "Ativação por convite"; a idempotência lê pelo id na mesma chamada (sem `pedidoRepetido`)
- Seção 11: a contagem de `@SemEscopo` reescrita dentro da linha da regra 10, item 9
- Seção 10: tabela consertada
- `cenarios.md`: E6, E8, E9, E15 (novo), I7 (alarme), L1, L2, W6, W7, W10 (novo)

## Rodada 3 — 24/09/2026

**Veredito: REPROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 2 |
| `infra-guardian` | APROVADO | 0 (chamado porque a trava entrou no login) |

### Correções exigidas
- `cenarios.md` E15: a asserção que quebra sem a trava na ativação, com as duas ordens forçadas (a ativação esperando em `pg_stat_activity`; o gerar parado entre a revogação e o commit) (`test-engineer`)
- `cenarios.md` I2: tirar `pedidoRepetido`; os `@SemEscopo` do `RedeEEscolaRepository` são exatamente dois (`test-engineer`)

### Recomendações
- A trava é a primeira instrução da transação de ativação, e no aceite vem antes de `usarConvitePorHash`, senão há deadlock com refazer ou revogar; o aceite em `pendente` contra refazer e revogar entra na E15; os caminhos com e sem MFA; 57014 vira 503 (`infra-guardian`)
- 7c alinhada com a E8; o que a coordenadora vê quando perde (convite inválido); a variante com o mesmo e-mail na E15; E11 com a espera do `for share` descrita (`test-engineer`)

### O que mudou para a rodada 4
- Seção 5: a trava como primeira instrução, antes de `usarConvitePorHash`; com e sem MFA; perdedor vê convite inválido; 57014 → 503
- Seção 7c: linhas "Convite da escola" e "Ativação por convite" apontam E8 e E15
- `cenarios.md`: I2, E11 e E15 reescritos (E15 com as ordens (a) a (e))

## Rodada 4 — 24/09/2026

**Veredito: REPROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 2 |

As duas correções da rodada 3 foram conferidas como feitas.

### Correções exigidas
- E15(e) e seção 5: o 57014 já é mapeado para 503 `TEMPO_ESGOTADO`, não `INDISPONIVEL_TENTE_DE_NOVO`; texto de tela para ele (`test-engineer`)
- E15(b) e seção 5: no login com o bilhete, a ativação perdida hoje cai na recusa de login e grava `login_falho`; escolher e escrever a resposta de cada caminho, sem contar a senha certa como falha (`test-engineer`)

### Recomendações
- Dizer o mecanismo de teste que para o gerar no meio, sem gancho em produção; E15(c) confirma que o gerar também espera; E15(d) prova resultado e ausência de 40P01; "nunca 500" também no aceite (`test-engineer`)

### O que mudou para a rodada 5
- Seção 5: **Decisão** — quem perde a ativação (aceite ou login com o bilhete, com ou sem MFA) recebe `NAO_ENCONTRADO` de convite inválido, sem `login_falho` nem contador; o 57014 segue 503 `TEMPO_ESGOTADO`. Seção 2 inclui `login` e `mfa`
- `cenarios.md`: E15 com o gatilho de teste que para o gerar, (b) com a resposta dos três caminhos e sem falha gravada, (c) com o gerar esperando, (d) e (e) reescritos; E11 com o mecanismo; W10 com o texto do `TEMPO_ESGOTADO`

## Rodada 5 — 24/09/2026

**Veredito: REPROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 1 |
| `privacy-guardian` | REPROVADO | 1 |
| `infra-guardian` | APROVADO | 0 |

As correções da rodada 4 foram conferidas como feitas. O `infra-guardian` confirmou que a Decisão não abre caminho para contornar a força bruta (a saída só existe depois da senha certa).

### Correções exigidas
- Seção 5: escrever a regra da senha certa pelo resultado, não só na corrida (convite revogado antes do login cai hoje em `login_falho`); com outro usuário ativo na conta, entra nele; E6 e E15(b) conferem, e uma variante com usuário ativo em outra escola (`test-engineer`)
- Seção 5 e E6: gerar em `aceito` e `sem_coordenacao` grava `convite.revogado` do convite anterior (alteração de permissão, regra 20, item 10) (`privacy-guardian`)

### Recomendações
- Dizer se a reserva do contador é desfeita, e a E conferir o estado do contador; senha errada com bilhete de convite revogado continua contando; 7c alinhada com a seção 5; a E15(b) cobre os dois logins e o aceite fica na (d) (`test-engineer`, `infra-guardian`)
- O texto do `NAO_ENCONTRADO` na tela de login da escola é o da tela de convite inválido do F1, sem dizer que a senha estava certa; `/retro`: a reativação por convite em `sem_coordenacao` vira uma linha do ciclo de vida no `docs/lgpd.md`; o usuário de coordenação nunca ativado que fica para trás (`privacy-guardian`)

### O que mudou para a rodada 6
- Seção 5: a Decisão reescrita pelo resultado (entra no outro usuário ativo; sem ele, `NAO_ENCONTRADO`, sem `login_falho`, reserva desfeita; senha errada conta); gerar em `aceito`/`sem_coordenacao` grava `convite.revogado` do anterior
- Seção 7c: linha "Ativação por convite" aponta a seção 5
- `cenarios.md`: E6 (auditoria da revogação), E15 (caminhos e (b) apontando a E16), **E16** nova (fora de corrida, com e sem MFA, senha errada, conta com usuário em outra escola)

## Rodada 6 — 24/09/2026

**Veredito: APROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | APROVADO (rodada 6) | 0 |
| `privacy-guardian` | APROVADO (rodada 6) | 0 |
| `infra-guardian` | APROVADO (rodada 5) | 0 |
| `tenancy-guardian` | APROVADO (rodada 2) | 0 |
| `frontend-reviewer` | APROVADO (rodada 2) | 0 |

### Recomendações aplicadas depois da aprovação (texto, sem mudança de desenho)
- Seção 5: "perdeu a trava" → "por um gerar concorrente" (`test-engineer`)
- E16: os dois contadores no MFA e o código errado contando; revogação entre a senha e o código; dois outros usuários ativos vão para `escolher`; a tentativa em `NAO_ENCONTRADO` não entra no registro de acesso; `revogado_em` no convite usado de `sem_coordenacao` é só registro (`test-engineer`, `privacy-guardian`)
- W10: o texto do `NAO_ENCONTRADO` na entrada da escola é o da tela de convite inválido do F1 (`privacy-guardian`)

### Recomendações para o `/criar-tasks` e o `/retro`
- Os textos de W7 e W10 viram critério de aceite das tarefas de tela
- `/retro`: o `ResolucaoDeTenantRepository` tem 27 `@SemEscopo`, muito além do sinal da regra 10, item 9 (`tenancy-guardian`); a reativação por convite em `sem_coordenacao` como linha do ciclo de vida no `docs/lgpd.md`, e o usuário de coordenação nunca ativado que fica para trás (`privacy-guardian`)
- A1: o teste de "outro tipo de convite responde `NAO_ENCONTRADO`" (alarme na I7)
- 22 rodadas na revisão da spec da A0 e 16 aqui (8 não aprovadas): a trava da ativação e a regra da senha certa só apareceram na terceira e na quinta rodada, de novo desenho por partes (causa 1 da retro da A0)

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-24 12:33:38 | 2026-09-24 12:34:48 | `infra-guardian` | 1 | APROVADO | a41dcfdc82c333649 |
| 2026-09-24 12:33:34 | 2026-09-24 12:35:02 | `tenancy-guardian` | 1 | REPROVADO | aca0ce72c2af6597d |
| 2026-09-24 12:33:40 | 2026-09-24 12:35:21 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | aef2c68d0d0056281 |
| 2026-09-24 12:33:36 | 2026-09-24 12:35:25 | `privacy-guardian` | 1 | APROVADO | aef22ba477181a192 |
| 2026-09-24 12:33:32 | 2026-09-24 12:35:28 | `test-engineer` | 1 | REPROVADO | aa59e988d33ecdd39 |
| 2026-09-24 12:38:48 | 2026-09-24 12:39:21 | `frontend-reviewer` | 2 | APROVADO | ab43452d6276b0f46 |
| 2026-09-24 12:38:43 | 2026-09-24 12:39:34 | `tenancy-guardian` | 2 | APROVADO | a4883c9c2f45f4653 |
| 2026-09-24 12:38:36 | 2026-09-24 12:39:59 | `test-engineer` | 2 | REPROVADO | abfd3e9653938661c |
| 2026-09-24 12:42:20 | 2026-09-24 12:43:22 | `test-engineer` | 3 | REPROVADO | a0144aaf583048d22 |
| 2026-09-24 12:42:24 | 2026-09-24 12:43:38 | `infra-guardian` | 2 | APROVADO | acc189fedd1a5348a |
| 2026-09-24 12:44:16 | 2026-09-24 12:45:48 | `test-engineer` | 4 | REPROVADO | a77adc362b14acec6 |
| 2026-09-24 12:47:01 | 2026-09-24 12:47:49 | `infra-guardian` | 3 | APROVADO | a51e4769d9881da3c |
| 2026-09-24 12:47:02 | 2026-09-24 12:48:11 | `privacy-guardian` | 2 | REPROVADO | a3e45982da9270a22 |
| 2026-09-24 12:46:55 | 2026-09-24 12:48:21 | `test-engineer` | 5 | REPROVADO | a00930f6c0f9b5403 |
| 2026-09-24 12:49:10 | 2026-09-24 12:49:43 | `privacy-guardian` | 3 | APROVADO | ae0c3207ee8f2e796 |
| 2026-09-24 12:49:05 | 2026-09-24 12:49:50 | `test-engineer` | 6 | APROVADO | a223ef5885c9962b9 |
