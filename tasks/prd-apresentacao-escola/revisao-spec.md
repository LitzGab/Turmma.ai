# Revisão de spec — apresentacao-escola

**Subagentes obrigatórios:** `test-engineer`, `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `frontend-reviewer`

## Rodada 5 — 26/09/2026

**Veredito: APROVADA**

Chamados só os que reprovaram na rodada 4. Com isso, a última rodada de cada revisor é APROVADO: `tenancy-guardian` e
`frontend-reviewer` na 3, `privacy-guardian` na 4, `infra-guardian` e `test-engineer` na 5.

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | APROVADO | — |
| `infra-guardian` | APROVADO | — |

### Recomendações para o `/criar-tasks` (entram como subtarefa ou cenário)
- C11: o "Quebra sem" é só o `for update` do excluir (o `FOR KEY SHARE` da FK já segura o gerar); um segundo arranjo com a pausa no excluir, provando que o gerar recebe `NAO_ENCONTRADO` e não 5xx de 23503 sem mapeamento (`test-engineer`)
- C11 e C4: soltar a pausa só quando o `pg_stat_activity` mostrar a outra transação esperando trava; no C4, a pausa depois do `update` da `lista_nome` e antes do commit, contra a mutação "verifica e depois apaga" (`test-engineer`)
- C2 (c): recriar o índice pelo `indexdef` de `pg_indexes`, com o mesmo nome e predicado (`test-engineer`)
- L11: provar pelo leitor de argumentos do comando com um UUID e pela constante do evento, não por texto do runbook; L2 nomeando o campo `escolaId` (`test-engineer`, `infra-guardian`)
- E29: escolher entre `NAO_ENCONTRADO` e `ArgumentoInvalido` (saída 2) para id que não é UUID, no padrão dos outros `ops:*`; a §6 aponta como o comando monta o contexto da escola, como os outros `ops:*` (`infra-guardian`)
- E21 com a matrícula certa do nome de T2 e o efeito nos contadores no L6; IP na lista do A4; log `sala.limite_atingido` uma linha por escola e janela (`test-engineer`, `privacy-guardian`, `infra-guardian`)
- As recomendações das rodadas 1 a 4 que ficaram em aberto (seletor com marca de escolhido e lugar da 11.1, toques do Sair no celular, rodapé do aluno, escolha entre nomes iguais) vão para a tarefa de tela ou para o `/validar`

## Rodada 4 — 26/09/2026

**Veredito: REPROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 2: o C2 (c) não força o segundo envio a ler a chave antes do commit do primeiro; o C1 diz que o perdedor não soma contador, contra o L6 |
| `privacy-guardian` | APROVADO | — |
| `infra-guardian` | REPROVADO | 1: o runbook parte do `escolaId` do log e o `ops:revogar-acessos-sala` pede o slug, sem caminho entre os dois |

### Correções exigidas na Tech Spec
- **§6, E29, L11 e `docs/runbook.md`:** o `ops:revogar-acessos-sala` recebe o id da escola, que o log traz; id inexistente ou não UUID dá `NAO_ENCONTRADO`; o L11 confere que o comando aceita o que o log entrega (`infra-guardian`)
- **C2 (c):** ponto de pausa entre a leitura inicial da chave e a transação, e espião que confirma o 23505 do pendente seguido da releitura (`test-engineer`)
- **C1:** o perdedor não soma no contador do nome e soma um no da turma, como no L6 (`test-engineer`)

### Recomendações
- DDL da recriação do índice numa transação só, pulada quando o OID já está na ordem; contador do terceiro envio do C2 (c); ponto de pausa no C11 e no C4, com o `for update` como comando próprio (`test-engineer`, `infra-guardian`)
- IP na lista do que o log capturado não pode ter (A4); o "Depois" do runbook registra só o id da escola (`privacy-guardian`)
- E21 com a matrícula certa do nome de T2 e o efeito nos contadores; log `sala.limite_atingido` uma linha por escola e janela (`test-engineer`, `infra-guardian`)

## Rodada 3 — 26/09/2026

**Veredito: REPROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 2: o reenvio em paralelo ainda depende da ordem dos índices (C2); o texto do limite promete que "código novo" destrava o `rl:ip` (W9) |
| `tenancy-guardian` | APROVADO | — |
| `privacy-guardian` | REPROVADO | 2: o runbook lê os IPs das chaves `rl:ip` e grava bloqueio em `infra/Caddyfile`, versionado em repositório público, sem prazo e fora do `docs/lgpd.md`; `teve_matricula_errada` fica 5 anos no pedido depois da decisão |
| `infra-guardian` | REPROVADO | 1: o reenvio em paralelo depende da ordem física dos índices (C2) |
| `frontend-reviewer` | APROVADO | — |

### Correções exigidas na Tech Spec
- **§5 passo 4 e C2:** diante de qualquer 23505 ou de `update` sem linha, a transação volta atrás e um comando novo relê a `chaveEnvio` na escola e na turma do acesso: achou, `enviado` sem contar; não achou, `REIVINDICACAO_RECUSADA`. A classificação não depende do nome da restrição. O C2 ganha o caso com o 23505 do pendente por nome e a chave já gravada (`test-engineer`, `infra-guardian`)
- **W9, W8 e §9:** o texto do limite passa a "Muitas tentativas agora. Espere N minutos ou chame o professor.", verdadeiro pelo nome e pelo `rl:ip`; o "Gerar novo" fica com o W7 (`test-engineer`)
- **`docs/runbook.md` e `docs/lgpd.md`:** nada de ler IP das chaves `rl:ip` nem de gravar IP em arquivo versionado; a resposta ao ataque na A1 é revogar os acessos da escola (`ops:revogar-acessos-sala`) e o professor gerar código novo; o bloqueio na borda fica para o staging (D42), com finalidade e prazo no `docs/lgpd.md` quando existir; a seção do IP inclui os `salas/*` no `rl:ip` e deixa de dizer que o IP de ataque se consulta no registro de acesso para essas rotas (`privacy-guardian`)
- **`teve_matricula_errada`:** anulável, com valor só no pedido pendente, anulado na aprovação, na recusa e no `encerrar`, na mesma transação; `docs/lgpd.md` diz "apagado na decisão ou no encerramento"; E30 e V1 provam; a auditoria não copia o campo (`privacy-guardian`)

### Recomendações
- E5 com matrícula que só existe em `credencial_matricula` da escola B; E21 com a mesma chave pelo acesso de T2; I6 com T5 de outro ano letivo; C11 excluir turma × gerar acesso em paralelo; "Quebra sem" do I10 e do I5 apontando a turma (`test-engineer`, `tenancy-guardian`)
- `ops:revogar-acessos-sala` pelo repository com escopo, recebendo o slug como os outros comandos (`tenancy-guardian`)
- Vazio da tela Pedidos próprio para a coordenação; reenvio no 503 pelo `Retry-After` com variação aleatória; "N minutos" arredondado para cima, com singular; depois de link vencido, o campo do código com o foco; mensagens da página pública com `role="status"` ou `role="alert"` e `aria-describedby` (`frontend-reviewer`)
- W6 diz que a tentativa errada pode ter sido de digitação; linha "Contadores da sala" com a segunda finalidade do contador do nome (`privacy-guardian`)
- Declarar na §7c o teto do `rl:ip` para escolas da mesma rede atrás de um IP de saída só; o reenvio em paralelo de tentativa errada conta duas vezes no nome (aceito ou deduplicado); ator dentro da sala volta a travar os nomes com o código novo, declarado na §13; nota em `docs/infra.md` 3.5 na tarefa da lista (`infra-guardian`)

## Rodada 2 — 25/09/2026

**Veredito: REPROVADA**

As correções da rodada 1 foram atendidas quase todas; os bloqueantes novos vêm do desenho novo (idempotência,
limite por nome) e do registro do quarto afrouxamento.

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 4: reenvio em paralelo recusado (C2); lote misto sem pedido já decidido fora do alcance (I6); nome avulso sem conferir matrícula de aluno aprovado (E7); texto do limite diz "computador" (W9) |
| `tenancy-guardian` | REPROVADO | 2: a leitura que decide se a falha conta no limite por nome sem escopo nem teste; o quarto afrouxamento citado sem estar na D71 nem no portão da primeira escola real |
| `privacy-guardian` | APROVADO | — |
| `infra-guardian` | REPROVADO | 4: reenvio em paralelo recusado (C2); hash sem limite para quem tem o código (nome tomado, id aleatório); um ator trava a turma pelo contador por nome e o professor não destrava; força bruta distribuída sem alerta |
| `frontend-reviewer` | AJUSTES NECESSÁRIOS | 1: o texto de `NAO_ENCONTRADO` manda chamar o professor quem só digitou o código errado, e o do limite fala em computador |

### Correções exigidas na Tech Spec
- **§5 passo 4 e C2, idempotência:** gravar a `reivindicacao` antes do `update` da `lista_nome`, na mesma transação, ou, com zero linhas, reler a `chaveEnvio` num comando novo antes de classificar; o reenvio em paralelo (também enquanto o primeiro espera no semáforo) responde `enviado` e não conta; o C2 reescrito para a cláusula escolhida (`test-engineer`, `infra-guardian`)
- **I6:** o lote misto ganha pedido já decidido da escola B, de T2 sem vínculo e, para a coordenação, de B; todos `nao_encontrada`; "Quebra sem": o alcance antes do estado (`test-engineer`)
- **E7 e §4:** o nome avulso confere a matrícula na lista e em `credencial_matricula`, com erro tipado e nada gravado (`test-engineer`)
- **§5 passo 4 e limites:** a leitura que decide se a falha conta no limite por nome só conta nome `livre` da escola, do ano e da turma do acesso; cenário com sete tentativas em nome de T2, de B e aleatório, idênticas e sem contador, contra a 6ª em nome livre de T1 (`tenancy-guardian`)
- **§7c, teto da turma:** toda tentativa que roda o hash e não cria pedido conta no teto de fundo da turma, que só rebaixa; só o contador por nome deixa de fora nome tomado e corrida perdida; cenário do ator que martela um nome tomado sem o login da escola levar 503 (`infra-guardian`)
- **§7c, contador por nome:** a chave passa a ser (`acesso_turma`, `listaNomeId`), para "Gerar novo" zerar as travas; a tela e o texto dizem isso ao professor; métrica `tipo="nome"`; cenário L4b com os 35 nomes travados e o código novo (`infra-guardian`)
- **§7c, alerta:** alerta sobre `sala.limite_atingido{tipo="escola"}` sustentado, com limiar e janela, parágrafo no `docs/runbook.md` e teste de infra no padrão do F1 (`infra-guardian`)
- **W9 e `MENSAGENS_DA_SALA`:** o texto de `NAO_ENCONTRADO` depende do caminho que a página usou (código digitado: conferir as letras; link: pedir o atual), com o servidor respondendo igual; o do limite é verdadeiro pelo nome e pelo `rl:ip` e leva ao "Gerar novo" do professor (`frontend-reviewer`, `test-engineer`)
- **§11 e §13, afrouxamento:** registrar a revisão da D71 por `/registrar-decisao`, com os dois comportamentos tolerados; corrigir `ROADMAP.md` e `CLAUDE.md`; o item no "Portão da primeira escola real" do `ROADMAP.md`, com o teste que o fecha; a §13 aponta para ele (`tenancy-guardian`)

### Recomendações
- Atualização de 15 s mantém seleção e foco, anuncia pedidos novos com `aria-live="polite"`; `nao_encontrada` com texto; reenvio no 503 com limite; botão em carregamento na espera de 1 s; marca de escolhido no seletor (`frontend-reviewer`)
- A coordenação não atualiza sozinha a lista de pedidos, ou audita uma vez por finalidade e sessão da tela (`privacy-guardian`, `infra-guardian`)
- Mostrar ao professor, no pedido, que houve tentativas erradas naquele nome (`privacy-guardian`)
- `chaveEnvio` anulada na decisão, vivendo só em memória no navegador, validada como UUID (`privacy-guardian`, `infra-guardian`)
- PRD §8 com os 10 min dos contadores; o RF14 do PRD diz "segura o código", e o desenho só atrasa: alinhar ou registrar na §11 (`privacy-guardian`, `test-engineer`)
- Justificar a exclusão física do nome livre; anotar no `TODO.md` que o pedido do titular do F3 cobre `lista_nome` e `reivindicacao` (`privacy-guardian`)
- V3 pelos ids dos pedidos; R3 com id inexistente e de outra turma; C3 "exatamente um"; "turma excluída" com a FK de `acesso_turma`; L5 observável; professor com duas disciplinas nos P2 e P3; K1 com a disputa pelo mesmo nome; E18 com a matrícula " 123 " de ponta a ponta (`test-engineer`)
- A espera de 1 s sem conexão presa; balde `rl:ip:sala` próprio (`infra-guardian`)

## Rodada 1 — 25/09/2026

**Veredito: REPROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 6: sem `cenarios.md` que prove cada RF; seis casos de borda sem teste; §4 e §6 se contradizem; o lote da decisão revela existência; permissões das rotas novas; corridas que faltam |
| `tenancy-guardian` | REPROVADO | 7: a resolução sem escopo chamada fora de `sessao`; ano do acesso não conferido nem fechado no `encerrar`; reivindicar sem teste de escopo; resultado do lote; rota do aluno ver a turma; aceite revela conta em outra escola; conta global com senha definida por outra escola |
| `privacy-guardian` | REPROVADO | 4: leitura dos pedidos pela coordenação sem auditoria; pedido pendente e nome sem fim de vida no `encerrar`; eliminação não alcança as tabelas novas; decisão em lote sem autorização por objeto |
| `infra-guardian` | REPROVADO | 4: limite de código trava a escola inteira; limite por turma trava a turma inteira; reivindicação não idempotente; argon2id fora do `SemaforoDeHash` |
| `frontend-reviewer` | AJUSTES NECESSÁRIOS | 5: limite com código e texto errados; quatro estados não desenhados; chunks sem fronteira de erro; decisão sem revisão antes de confirmar; seletor fora do desenho do P30 |

### Correções exigidas na Tech Spec
- **Testes:** criar `cenarios.md`, parte da Tech Spec, com um id por teste, a cláusula que cada um quebra, cada RF, cada caso de borda do PRD §7, cada corrida em paralelo, as respostas iguais enumeradas, permissão por objeto em cada rota nova e o I7 herdado da A0b (`test-engineer`)
- **§4 e §6:** uma resposta só para nome de outra turma, inexistente, de outra escola e de ano encerrado (`test-engineer`, `tenancy-guardian`)
- **§4 e §5, decisão em lote:** o `update` leva escola, ano em curso e, para o professor, o `exists` do vínculo confirmado na turma de cada pedido; id fora do alcance tem o mesmo resultado de um UUID inexistente; teste com lote misto (`test-engineer`, `tenancy-guardian`, `privacy-guardian`)
- **§4, §6 e §7, virada de ano:** a resolução do acesso exige ano `em_curso`; o `encerrar` revoga os acessos e fecha os pedidos pendentes, apagando o hash, na mesma transação; declarar a FK `reivindicacao → lista_nome` e o que o pedido recusado guarda; ajustar `docs/lgpd.md` (`tenancy-guardian`, `privacy-guardian`, `test-engineer`)
- **§2 e §6:** a resolução do acesso fica num serviço dentro de `apps/api/src/sessao`, que devolve só escola, ano e turma; o teste de arquitetura não muda; os métodos novos entram na lista fechada com justificativa (`tenancy-guardian`)
- **§6 e §10:** teste de reivindicar com o acesso de T1 e o nome de T2 (e de outra escola) com a matrícula correta daquele nome (`tenancy-guardian`)
- **§4:** rota do aluno ver a própria turma, com célula na `MATRIZ` e alcance pelo vínculo de aluno confirmado (`tenancy-guardian`)
- **§4 e §5, conta global:** o aceite do convite de professor não revela conta em outra escola, e o risco da senha de conta global definida pelo link de uma escola é nomeado, com mitigação e teste (`tenancy-guardian`; depende de decisão do Joaquim)
- **§7, auditoria:** a leitura dos pedidos pela coordenação é auditada, no padrão de `turma.alunos_lidos` (`privacy-guardian`)
- **§7, eliminação:** a eliminação do aluno apaga a `lista_nome` e os pedidos dele; `on delete` de cada FK para `usuario` declarado; `docs/lgpd.md` ajustado (`privacy-guardian`)
- **§7c, limites:** redesenhar pela conta de entropia, erro de digitação e códigos ativos (código de 8 caracteres); tentativa de matrícula por nome, com teto pequeno, e teto de fundo alto por turma; "nome já tomado" e corrida perdida não contam; o ator único não trava a escola nem a turma; `LIMITE_EXCEDIDO` com `Retry-After`, e não `TEMPO_ESGOTADO`; a janela de 10 min muda o `ContadorEmJanela`; métrica `sala.limite_atingido` (`infra-guardian`, `frontend-reviewer`)
- **§4 e §7c, idempotência:** chave de idempotência por envio da reivindicação; o reenvio responde `enviado` sem contar no limite; teste de dois envios paralelos e de reenvio depois do commit; a web manda um pedido só (`infra-guardian`, `test-engineer`)
- **§5 e §7c, hash:** o argon2id da reivindicação passa pelo `SemaforoDeHash`, no balde da escola; roda sempre, depois do limite e antes da transação; o 503 do semáforo tem texto na página pública (`infra-guardian`)
- **§7c, corridas:** aprovar × recusar e professor × coordenação; reivindicar × retirar o mesmo nome livre; colisão do código com savepoint ou nova transação (`test-engineer`, `infra-guardian`)
- **§9, estados:** tabela com os quatro estados de cada tela, com o texto do vazio e o próximo passo; e2e do vazio e do erro com a rota interceptada (`frontend-reviewer`)
- **§9, chunks:** fronteira de erro genérica em `componentes/`, com `Suspense` e `EstadoCarregando`, envolvendo as áreas novas; e2e com o carregamento abortado (`frontend-reviewer`)
- **§9, decisão:** diálogo de revisão antes de aprovar (variante `oficial`) e de recusar (variante `perigo`), com o efeito, o resultado por pedido e o teto de 40 explicado (`frontend-reviewer`)
- **§9, seletor:** adotar o formato do P30, com os campos que existem no modelo no contrato de `/v1/eu`, ou registrar o desvio na §11 (`frontend-reviewer`)

### Recomendações
- Troca de escola provada pelas requisições interceptadas e pelo cache, e não só pela tela; critério do cenário de carga (zero duplicidade, zero erro cru, p95, login medido junto) e a variante do primeiro dia da escola inteira (`test-engineer`, `infra-guardian`)
- Normalizar a matrícula da lista como o login (`trim`); testar o log dos eventos novos sem nome nem matrícula; expurgo em paralelo; token do fragmento fora do endereço antes da primeira chamada (`test-engineer`)
- Dois professores na mesma turma: o "Gerar novo" de um derruba o link do outro; declarar e testar (`test-engineer`)
- Aluno do ano seguinte com a matrícula já em `credencial_matricula`: fora de escopo, F2 (`test-engineer`)
- FKs compostas no padrão da casa; `id uuid default uuidv7()`; contratos públicos `.strict()`; `@SemEscopo` do expurgo atualizado; o slug de `/e/<slug>/turma` conferido contra a escola do acesso; refazer e revogar da coordenação só alcançam convite de professor (`tenancy-guardian`)
- `Cache-Control: no-store` em `salas/abrir`; lista de nomes fora de armazenamento persistente do navegador; chave do HMAC do código separada da dos contadores; dizer se as rotas públicas gravam registro de acesso com IP; nada que revele conta em outra escola no `GET professores` nem na auditoria; nome avulso em `lista.gravada`; justificar a exclusão física do nome livre; teste de que a aprovação tira o hash; carga e e2e com nomes gerados; avaliar não duplicar nome e matrícula na `lista_nome` aprovada; a quinta linha de dado do PRD (contador) reconciliada (`privacy-guardian`)
- Conta de `rl:ip` anônimo para a rajada da escola inteira e rede com um IP de saída; aprovação e o contador de login da conta; intervalo de atualização da lista de pedidos, parado com a aba escondida; rollback da 0018 com convite de professor em aberto (`infra-guardian`)
- Código grande e em grupos para projetar; "Gerar novo" com confirmação; avisar que "matrícula ou senha incorretas" antes da aprovação é espera; senha com 12 caracteres avisados e opção de mostrar; `inputmode` e `autocomplete` dos campos; tabela responsiva da 11.1 e corte em 768 px; como escolher entre dois nomes iguais; exemplo do formato ao lado do campo da lista; rodapé do aluno (11.1, D61) agora ou depois (`frontend-reviewer`)

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-25 22:39:11 | 2026-09-25 22:42:41 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | a651a97c702a58f1d |
| 2026-09-25 22:38:59 | 2026-09-25 22:42:48 | `test-engineer` | 1 | REPROVADO | a304ccc3abed4d0a1 |
| 2026-09-25 22:39:08 | 2026-09-25 22:42:59 | `infra-guardian` | 1 | REPROVADO | a5b2dcf33996ea7d0 |
| 2026-09-25 22:39:02 | 2026-09-25 22:43:31 | `tenancy-guardian` | 1 | REPROVADO | a56b34fc6245298c4 |
| 2026-09-25 22:39:05 | 2026-09-25 22:43:46 | `privacy-guardian` | 1 | REPROVADO | a8c6f63a766e11205 |
| 2026-09-25 23:20:00 | 2026-09-25 23:21:39 | `frontend-reviewer` | 2 | AJUSTES NECESSÁRIOS | add0a5acdaaec5396 |
| 2026-09-25 23:19:47 | 2026-09-25 23:22:05 | `tenancy-guardian` | 2 | REPROVADO | a6b41513c06e243e7 |
| 2026-09-25 23:19:52 | 2026-09-25 23:22:21 | `privacy-guardian` | 2 | APROVADO | a2a02ccc809994c5e |
| 2026-09-25 23:19:42 | 2026-09-25 23:22:49 | `test-engineer` | 2 | REPROVADO | a1fee6b229df6b39f |
| 2026-09-25 23:19:56 | 2026-09-25 23:24:45 | `infra-guardian` | 2 | REPROVADO | a77f155d5a77ba242 |
| 2026-09-26 02:17:59 | 2026-09-26 02:18:55 | `frontend-reviewer` | 3 | APROVADO | a973c0761055e4b5b |
| 2026-09-26 02:17:50 | 2026-09-26 02:19:22 | `tenancy-guardian` | 3 | APROVADO | ab1880f9741fe587a |
| 2026-09-26 02:17:55 | 2026-09-26 02:19:54 | `infra-guardian` | 3 | REPROVADO | a402d7687bae4fa10 |
| 2026-09-26 02:17:45 | 2026-09-26 02:20:10 | `test-engineer` | 3 | REPROVADO | af49155f8e313cc1c |
| 2026-09-26 02:18:06 | 2026-09-26 02:20:18 | `privacy-guardian` | 3 | REPROVADO | a91100bfcfca365d8 |
| 2026-09-26 02:27:08 | 2026-09-26 02:27:57 | `privacy-guardian` | 4 | APROVADO | a9fb2013c9b3d3ac8 |
| 2026-09-26 02:27:02 | 2026-09-26 02:29:01 | `infra-guardian` | 4 | REPROVADO | a301aec9cafb3d11e |
| 2026-09-26 02:26:56 | 2026-09-26 02:29:49 | `test-engineer` | 4 | REPROVADO | a170cca2a854e594e |
| 2026-09-26 02:30:48 | 2026-09-26 02:31:27 | `infra-guardian` | 5 | APROVADO | abacd38f355468ef7 |
| 2026-09-26 02:30:44 | 2026-09-26 02:33:02 | `test-engineer` | 5 | APROVADO | a0ee4eaa0add52f94 |
