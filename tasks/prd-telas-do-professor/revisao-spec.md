# Revisão de spec — telas-do-professor

**Subagentes obrigatórios:** `test-engineer`, `frontend-reviewer`, `privacy-guardian`, `conformidade-reviewer`, `tenancy-guardian`, `infra-guardian`

## Rodada 1 — 13/10/2026

**Veredito: REPROVADA**

Tamanho: PRD 1.996 palavras · Tech Spec 2.000 palavras (no limite; qualquer acréscimo pede aceite escrito no topo ou corte).
Nota: a linha `frontend-reviewer` rodada 1 (02:39) da tabela do hook é de sessão que caiu e não conta; vale a rodada 2.

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 8 (foco do sino; entrega decidida em outra aba; teto de 12 turmas; parada na recusa por limite; "sem nome no cache"; permissão do sino; isolamento de Criados; leituras nominais com painel aberto) |
| `frontend-reviewer` | AJUSTES NECESSÁRIOS | 1 (sino relê ao voltar o foco) |
| `privacy-guardian` | REPROVADO | 2 (nome da atenção humana em Hoje; diálogo "Acesso gerado" sobre nomes e acertos) |
| `conformidade-reviewer` | REPROVADO | 1 (supervisão do Tutor em Hoje: releitura de 15 s e atenção humana sem abrir o painel) |
| `tenancy-guardian` | APROVADO | 0 |
| `infra-guardian` | REPROVADO | 1 (teto de 12 turmas diz "Tudo em dia" sem ter lido tudo) |

### Correções exigidas na Tech Spec

1. **§5 "A fila do professor" e §7c; `1_task.md` (1.5 e cenário "não insiste")**: o sino não relê ao voltar o foco. Escrever as três opções do TanStack (`refetchInterval`, `refetchOnWindowFocus`, `refetchOnReconnect`) em `false` nos observadores de `entregas`, `meus-vinculos` e da contagem de pedidos, e fixar o `staleTime`. O sino lê ao entrar na área e quando uma decisão invalida a chave. Releitura a pedido ("Atualizar" e "Tentar de novo") só pelas chaves exatas, nunca por prefixo (`['entregas']`, `['pedidos-da-turma']`). Teste da 1.0 em dois tempos como na X2: `focusManager.setFocused(false→true)` e `onlineManager.setOnline(false→true)` com dado velho dão zero chamadas, e o controle com a opção ligada relê; os dois gerenciadores restaurados no `afterEach`. (frontend-reviewer, test-engineer, infra-guardian)
2. **§5 e §7c, `1_task.md` 1.3, `9_task.md`**: turma confirmada além do teto de 12 marca a fila como `incompleto`; o sino diz o que não leu (ex.: "Pedidos de nome de 2 turmas não lidos") e nunca "Tudo em dia". Fixar quais 12 são lidas, em ordem determinística por nome. O cenário "14 turmas" prova o estado `incompleto` e a ausência de "Tudo em dia", com mutação declarada (tirar a marcação deixa o teste vermelho). Em Turmas (9.0), a turma não lida aparece como "não lida", não como sem pendência. (infra-guardian, test-engineer)
3. **§7c, `1_task.md` 1.3**: cenário da recusa por limite: a 3ª leitura recebe 429, não sai nenhuma da 4ª à 12ª, os itens já lidos aparecem e o sino diz que não leu tudo. (test-engineer)
4. **`1_task.md`, cenário "sem nome no cache"**: a rede falsa devolve pedidos com nomes conhecidos e o teste confere que `JSON.stringify(cliente.getQueryCache().getAll().map(q => q.state.data))` não contém nenhum (um `select` reprovaria); rodar com `ListaDePedidos` montada ao mesmo tempo. A chave da contagem é distinta da chave da lista nominal (`['pedidos-da-turma', turmaId, 'professor']`), sob o prefixo da professora, e `aplicarDecisao` a invalida por chave exata. Escrever que nenhum item do sino leva nome de aluno, só tipo, turma, título e número. (test-engineer, privacy-guardian, frontend-reviewer)
5. **`1_task.md` + PRD §7**: e2e com dois contextos para "entrega decidida em outra aba": decide em B; em A o item segue no sino até tentar decidir; a tela diz "já estava decidida" (`ENTREGA_JA_DECIDIDA`) e o item sai sem recarregar. (test-engineer)
6. **`1_task.md`**: caso de permissão: unidade (aluno sem sino; coordenação não recebe `SinoDoProfessor`) e e2e (coordenação entra na mesma aba depois da professora: nenhuma chamada a `/v1/entregas`, `/v1/vinculos/meus`, `/reivindicacoes`, e nenhum item da professora). (test-engineer)
7. **`5_task.md`, cenário "isolamento"**: exigir que a turma de B tenha ao menos um artefato gerado e que, com `?turma=<turma de B>`, o título dele não apareça. (test-engineer)
8. **§5/§7b/§9 e `10_task.md` 10.2 e 10.4 (supervisão do Tutor em Hoje)**: escrever que Hoje lê `consultaSinais` ao abrir, com `refetchInterval` de 15 s enquanto a aba está à vista, como `Tutor.tsx:55` faz hoje, e que a regra "não relê por tempo" vale só para o sino. Teste de componente com relógio falso: aos 15 s sai nova leitura e um sinal de atenção humana que chega nela aparece no alto sem recarregar e sem abrir o painel; a mutação que tira o `refetchInterval` deixa o teste vermelho. Especificar qual leitura nominal sai ao abrir (sinais, com `gcTime: 0`) e que só a tabela "Sinais por aluno" e `consultaUsoDoTutor` esperam o `?ver=tutor`; cenário de que, sem `?ver=tutor`, nenhuma rota nominal de `api/tutor-da-turma.ts` é chamada além dos sinais, que abrir o painel chama e fechar tira do cache. (conformidade-reviewer, test-engineer)
9. **§9 (Turma aberta, Hoje), §7, RF16, `10_task.md` 10.2**: a atenção humana (D36) em Hoje mostra só a contagem e o que fazer ("Um aluno precisa de um adulto…"), **sem nome**: a aba padrão é a que a professora projeta em sala (D34, LGPD art. 14). O nome só por ação explícita, no `PainelLado` (`?ver=tutor`) ou num "Ver quem". Teste de componente e e2e: Hoje recém-aberta, com sinal de atenção, não tem nome de aluno no DOM; aparece só depois da ação. (privacy-guardian)
10. **§9 (Alunos), §7, `13_task.md`**: enquanto o passo "Acesso gerado" estiver aberto, nenhum nome, acerto ou pedido da página de trás fica legível (fundo opaco nesse diálogo, ou o passo em tela própria sem a lista atrás). e2e na 13.0: com o passo aberto e a turma com alunos e acertos, nenhum nome nem acerto visível. (privacy-guardian)

**Conflito entre revisores a resolver na correção (item 9 × item 8):** o `conformidade-reviewer` pede que a atenção humana apareça em Hoje "com nome, hora e o que fazer, sem abrir o painel"; o `privacy-guardian` veta o nome ali. A correção acima segue o mais restritivo (aviso visível sem painel, com contagem e o que fazer, nome só por ação). Se a Arquiteta ler diferente, a rodada nova chama os dois.

### Recomendações

- §6: dizer que `main.tsx` faz `resetQueries()` em toda troca de sessão (não por prefixo), e que a lista de turmas da série do sino vem do cache, nunca de `useState` (tenancy-guardian).
- §6 "(os e2e de hoje)": citar os arquivos reais, `apps/api/src/artefato/artefato.int.test.ts`, `apps/api/test/turma-acesso.int.test.ts` e `e2e/troca-de-escola.spec.ts` (tenancy-guardian).
- 1.0: no "recomeço", A com itens e B com zero ou outros; a asserção é a ausência dos itens e do número de A (tenancy-guardian).
- 12.0: a web não envia `?anoLetivoId` em `/v1/turmas/:id/alunos`; ler com `limite=100` e reordenar por nome o conjunto carregado a cada página (tenancy-guardian, infra-guardian).
- `tasks.md`: marcar `tenancy-guardian` nas tarefas 1.0 e 10.0 (tenancy-guardian).
- §5/§9 e 5.2/12.1: escrever a decisão de paginar Criados e Alunos com "Ver mais" e por que basta no Chromebook fraco (frontend-reviewer).
- 3.0/§9: registrar "Ir para Turmas" no vazio "Falta uma turma confirmada"; rótulo curto igual para "100 ou mais" e leitura parcial a 360 px (frontend-reviewer).
- PRD §9: a métrica "cliques do sino até a decisão" é medida no e2e, nunca telemetria por professor (D64; regra 70, itens 8 e 9) (conformidade-reviewer).
- 9.1: considerar número, sem nome, de atenção humana no cartão da turma (conformidade-reviewer).
- 10.0 e 12.0: teste de vocabulário explícito (sem "nota", "média", "conceito", "pontuação"); "Média de acertos" vira "acerto médio" (conformidade-reviewer).
- 10.2: levar a Hoje o bloco "Quando o Tutor avisa você" junto de "O que o Tutor faz sozinho" (conformidade-reviewer).
- `staleTime` das consultas do sino escrito na Tech Spec (padrão de 30 s), para ninguém copiar `staleTime: 0`; fechar a premissa 5 da §12 com a conta (14 requisições por leitura, cerca de 28/min contra 120) (infra-guardian).
- Duas disciplinas na mesma turma dão uma leitura só, com teste (infra-guardian, test-engineer).
- `TODO.md`: contagem agregada de pedidos por professor na API, fora da X3 (infra-guardian, privacy-guardian).
- 1.0: vínculo do ano encerrado não vira "Confirme sua turma"; dizer o que o sino mostra sem ano letivo em curso (test-engineer).
- 2.0: contar casos por `npx playwright test --list`, sem a ressalva "fora dos que a tarefa declara" (test-engineer).
- 5.0: `/professor/criados` nos laços de papel errado de `e2e/areas.spec.ts` (test-engineer).
- 9.0: o cenário "o que espera" conta chamadas; teste de que os dois cartões da mesma turma abrem a mesma turma (test-engineer).
- 12.0: estado próprio para aluno transferido ou com acesso desativado (test-engineer).
- RF22 (1366 × 768) estendido a todas as telas, ao menos Aprovar com barra presa (test-engineer).
- §10: fixtures novas com nomes inventados; "Texto da pessoa" sai junto quando entra outra pessoa, com caso nos recomeços da 9.0 e da 14.0 (privacy-guardian).

## Rodada 2 — 13/10/2026

**Veredito: REPROVADA** (só o `test-engineer` reprovou; os cinco bloqueantes dele são de teste, não de desenho)

Tamanho: PRD 2.000 palavras · Tech Spec 2.538 palavras (acima do teto, com aceite por delegação escrito no topo).

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 5 (sem nome no cache contraditório; "mais de 12 turmas" sem a condição; ano letivo encerrado sem teste; "Acesso gerado" opaco × véu; número de atenção humana no cartão) |
| `frontend-reviewer` | APROVADO | 0 |
| `privacy-guardian` | APROVADO | 0 |
| `conformidade-reviewer` | APROVADO | 0 |
| `infra-guardian` | APROVADO | 0 |
| `tenancy-guardian` | APROVADO | 0 (conferência estreita: chave da contagem, §6, 12 turmas, `?anoLetivoId`) |

A decisão por delegação (aviso de atenção humana em Hoje sem nome, "Ver quem" no `PainelLado`) foi aceita pelos dois revisores que se chocavam: `privacy-guardian` e `conformidade-reviewer` dizem que ela atende a regra 20 (D34, D36, art. 14) e a regra 70, item 4 (D8).

### Correções exigidas na Tech Spec e nas tarefas

1. **`1_task.md`, cenário "sem nome no cache"**: com a `ListaDePedidos` montada ao mesmo tempo, a consulta nominal dela está no `QueryCache` com os nomes, e `gcTime: 0` só a remove depois de desmontar; o `JSON.stringify` do cache inteiro sempre contém nome e o teste fica vermelho com o código certo. Dois casos: (a) só o sino montado: o `JSON.stringify` do cache inteiro não contém nenhum nome; (b) sino e lista montados juntos: existe a consulta `['pedidos-da-turma','contagem',turmaId]`, o dado dela é exatamente `{quantidade, haMais}` e a chave é diferente da da lista. Filtrar só pelo prefixo `contagem` não basta (com chave compartilhada o filtro não acha nada e o teste passa vazio). Manter a mutação "guardar a lista inteira na contagem". (test-engineer)
2. **`1_task.md`, cenário "mais de 12 turmas"**: falta a condição que dá sentido a "nunca Tudo em dia". O fixture tem zero itens nas 12 turmas lidas, sem entrega e sem vínculo pendente; o teste confere que "Tudo em dia" está ausente do DOM e que o aviso do que não foi lido está presente. Sem isso a asserção passa sempre e não pega a implementação que mostra "não li 2 turmas" e "Tudo em dia" juntos. (test-engineer)
3. **`1_task.md` 1.3a (sem ano letivo em curso; vínculo de ano encerrado não vira "Confirme sua turma")**: regra nova sem teste (virada de ano letivo). Dois testes, cada um com mutação declarada: componente (sem ano letivo em curso, zero chamadas a turmas e vínculos, o sino diz isso e não mostra "Tudo em dia") e unidade de `filaDoProfessor` (um vínculo `pendente` de ano encerrado não gera item). (test-engineer)
4. **§9 "Acesso gerado" e `13_task.md` 13.1, cenário "nada legível atrás"**: o desenho promete fundo "opaco" e aponta o "véu forte", que é o `dialog::backdrop` de `estilos.css:322-323`, `rgba(13, 13, 13, 0.75)` (cerca de 2:1 de contraste atrás dele; "opaco" e "véu forte" se contradizem). A medida "de contraste ou de texto visível fora do diálogo" não serve: `toBeVisible` ignora o que está por cima. Fixar o fundo do passo como opaco, alfa 1, com token nomeado (e tratar a guarda de cor da X1, que só aceita cor no véu do diálogo); o e2e lê `getComputedStyle(dialog, '::backdrop').backgroundColor` e exige alfa 1 (ou calcula o contraste de um nome atrás do véu contra o fundo e exige menos de 1,1:1); a mutação troca o fundo opaco pelo `veu` e deixa o teste vermelho. (test-engineer)
5. **`10_task.md` 10.2 ("O cartão da turma pode mostrar o número de atenção humana, sem nome")**: desenho opcional, sem fonte e sem teste; contradiz `9_task.md` 9.1 (o cartão só usa a fila do sino, "nenhuma leitura a mais"). Ou tirar a frase (a linha "o que espera" da 9.0 já prova "nenhuma leitura a mais"), ou dizer de onde vem o número e acrescentar à 9.0 um cenário: a conta de chamadas continua a do sino, nenhum nome no DOM nem no cache de Turmas, e há mutação. (test-engineer; o `conformidade-reviewer` pede o mesmo, recomendação 4)

### Recomendações

- PRD RF16: acrescentar "e sem nome; o nome por 'Ver quem'", para o PRD não divergir da §7b (privacy-guardian).
- 13.0, "nada legível atrás": fixar o método de medição (`elementFromPoint` na posição do nome, ou opacidade calculada do véu), não `toBeVisible` (privacy-guardian; reforça a correção 4).
- `?ver=tutor` no endereço: dizer que nenhum link de entrada (cartão, sino, redirecionamento, "Voltar para a turma") leva `ver=tutor`, e considerar não reabrir o painel ao recarregar (privacy-guardian).
- 10.4: a fixture de "atenção humana sem nome" traz também sinais de outros tipos ligados a um aluno, para provar que nenhum bloco de Hoje desenha nome (privacy-guardian).
- 10.2: o DTO de `consultaSinais` com o painel fechado não traz linhas por aluno; conferir também o `QueryCache`, como o sino (frontend-reviewer).
- 10.2/§7b: o botão "Ver quem" fica dentro do aviso; o `PainelLado` aberto por ele começa pela lista de atenção humana (nome · hora), acima dos "Sinais por aluno", com teste na 10.4; dizer que a hora do aviso é a do sinal mais recente (conformidade-reviewer).
- 10.4: o aviso que chega aos 15 s entra sem piscar, sem som e sem mover o foco (D59), com `aria-live="polite"` (frontend-reviewer, conformidade-reviewer).
- §7c: somar a leitura de Hoje à conta de carga (4 por minuto por professor com a aba à vista, pausada com a aba escondida; cerca de 32 contra 120 por usuário e cerca de 240 contra 30.000 por escola); repetir na §5 que a contagem lê as 12 primeiras turmas por nome; dizer de onde sai o "28 por minuto" na premissa 5 da §12 (infra-guardian).
- 12.1: "Ver mais" reordena tudo o que já foi carregado, ou a turma cabe numa página; teste de componente de que a web não envia `?anoLetivoId` e lê com `limite=100` (infra-guardian, test-engineer).
- §7 e 1.3: `aplicarDecisao` invalida a contagem só quando `quem === 'professor'`; teste de unidade da chave exata `['pedidos-da-turma','contagem',turmaId]` (tenancy-guardian).
- 1.3: "recusa por limite" também afirma que não aparece "Tudo em dia"; provar "em série" segurando a primeira resposta; e2e de permissão restrito às rotas da professora, para não dar falso vermelho com a leitura legítima do sino da coordenação (test-engineer).
- 10.4: caso de Atividades ou Alunos aberta (ou aba escondida) sem leitura aos 15 s (test-engineer).
- A Tech Spec passou do teto de palavras com aceite por delegação; se o Joaquim não ratificar, o ônus fica na Tech Spec (frontend-reviewer).

## Rodada 3 — 13/10/2026

**Veredito: REPROVADA** (só o `test-engineer` reprovou, com dois bloqueantes de teste; o desenho da tela inteira de "Acesso gerado" foi aprovado pelo `frontend-reviewer`)

Tamanho: PRD 1.999 palavras · Tech Spec 2.625 palavras (acima do teto, com aceite por delegação escrito no topo).
Rodada chamada só aos dois que a mudança tocava: `test-engineer` (reprovou na 2) e `frontend-reviewer` (olhar só o passo "Acesso gerado" em tela inteira). Os outros quatro aprovaram na 2 e não foram chamados.

| Revisor | Última rodada | Veredito | Bloqueantes |
|---|---|---|---|
| `test-engineer` | 3ª | REPROVADO | 2 (cache de Hoje com nome × "sem linha por aluno"; mutação do alfa 1 e `elementFromPoint` em "Acesso gerado") |
| `frontend-reviewer` | 3ª (a 4ª do hook; a 1ª da tabela é de sessão que caiu) | APROVADO | 0 |
| `privacy-guardian` | 2ª | APROVADO | 0 |
| `conformidade-reviewer` | 2ª | APROVADO | 0 |
| `tenancy-guardian` | 2ª | APROVADO | 0 |
| `infra-guardian` | 2ª | APROVADO | 0 |

As cinco correções da rodada 2 foram atendidas, a 4 só em parte (bloqueante 2 abaixo).

### Correções exigidas nas tarefas e na Tech Spec

1. **`10_task.md:62`, cenário "sem painel, sem rota nominal"**: a parte "o `QueryCache` não tem linha por aluno" fica vermelha com o código certo. É o mesmo defeito da correção 1 da rodada 2, agora em Hoje. Pelo desenho (10.2, §7b) Hoje lê `consultaSinais` ao abrir, para a contagem do aviso de atenção humana, e a resposta traz `aluno: { id, nome }` em todo sinal, inclusive `atencao_humana` (`packages/shared/src/tutor/sinal.ts:26` e `:43`). Com `gcTime: 0`, ela fica no cache enquanto Hoje observa. A 10.2 também se contradiz: diz que só os "Sinais por aluno" e `consultaUsoDoTutor` esperam o painel, mas os "Sinais por aluno" vêm da mesma `consultaSinais`, já lida. Uma de duas:
   - (a) reescrever a asserção como "nenhum nome no **DOM**, e nenhuma consulta `CHAVE_DO_USO_DO_TUTOR` no cache", e corrigir a 10.2 para dizer que só `consultaUsoDoTutor` espera o painel e que os nomes dos sinais estão em memória, mas não na tela;
   - (b) se o cache não deve ter nome com o painel fechado, desenhar uma leitura de Hoje que descarte o aluno antes do cache, como a contagem do sino; aí o teste confere o conteúdo do cache, com mutação. (test-engineer)

   A (a) muda só o texto do teste; a (b) muda o desenho (§7b) e fica para o Joaquim se o `privacy-guardian` preferir cache sem nome. Nota: o `privacy-guardian` aprovou a 2 com a leitura de sinais no cache; a (a) mantém isso.
2. **`13_task.md:57`, cenário "nada legível atrás de 'Acesso gerado'"**: a mutação exigida na rodada 2 (trocar o fundo opaco pelo `veu`) não está lá, e a única declarada ("tirar a classe de tela inteira") só prova a caixa. O `<dialog>` já recebe `background-color: Canvas` do navegador, então o alfa 1 pode passar sem a classe `fundo`. Corrigir:
   - declarar a segunda mutação: com a tela inteira mantida, trocar `fundo` por `veu` (ou transparente) deixa o e2e vermelho;
   - dizer que o fundo lido é o do elemento que leva a classe (o `<dialog>`);
   - tirar o `elementFromPoint`, ou defini-lo de modo a distinguir o diálogo do `::backdrop` (com `showModal`, ponto fora da caixa devolve o próprio `<dialog>`, e o teste passa sem a tela inteira ou fica vermelho em área vazia). O par "caixa cobre a janela + alfa 1" já basta. (test-engineer)

### Recomendações

- `10_task.md:62`: dizer como a aba fica escondida no jsdom (`focusManager.setFocused(false)`, restaurado no `afterEach`); o `refetchIntervalInBackground: false` é padrão e não tem cláusula para mutar; o caso de Atividades ou Alunos aberta também não tem mutação (test-engineer).
- `1_task.md:71`: o e2e de permissão confere `/reivindicacoes` em geral; restringir às rotas das turmas da professora, para a leitura legítima do sino da coordenação da X2 não dar falso vermelho (test-engineer, repetida da rodada 2).
- `1_task.md:66`: provar o "em série" com `segurar` também no cenário das 14 turmas (test-engineer, repetida).
- `12_task.md`: declarar mutação nos testes "sem `?anoLetivoId`, com `limite=100`" e "aluno transferido" (test-engineer).
- `13_task.md` 13.1: o `Dialogo` (`apps/web/src/componentes/Dialogo.tsx:150`) tem largura fixa e não aceita variante, e não está em "Arquivos previstos"; escrever que ganha a variante `inteira` (13.0 ou tarefa da X1), que "Gerar" e "Acesso vigente" ficam em 560 px e que a troca de largura entre passos não anima. Sem isso a classe que a mutação tira não tem lugar (frontend-reviewer, test-engineer).
- 13.2/§9: dizer se `?convidar=1` abre com `push` ou `replace` e o que o Voltar faz com "Acesso gerado" aberto; o mais seguro é `replace` e tratar o Voltar como pedido de fechar, passando pela pergunta, com um caso no e2e de teclado (frontend-reviewer).
- `13_task.md` "Fora do escopo": uma frase dizendo que "Projetar" é só o texto do botão que mantém o passo em tela inteira, e que um modo de projeção maior fica fora (frontend-reviewer).
- Manter o e2e de "recomeço" com o `LoginPorCima` aparecendo por cima do passo em tela inteira: o foco volta ao diálogo do convite, e código e link não vazam para log nem URL (frontend-reviewer).

## Rodada 4 — 13/10/2026

**Veredito: APROVADA**

Tamanho: PRD 1.999 palavras · Tech Spec 2.647 palavras (acima do teto, com aceite por delegação escrito no topo).
Rodada chamada só ao `test-engineer`, o único que reprovava na 3. Os cinco outros aprovaram nas rodadas anteriores e a mudança desta rodada só tocou texto de teste (`10_task.md`, `13_task.md`, §7b e §9), sem mexer em dado, rota, log ou fila.

| Revisor | Última rodada | Veredito | Bloqueantes |
|---|---|---|---|
| `test-engineer` | 4ª | APROVADO | 0 |
| `frontend-reviewer` | 3ª (a 4ª do hook) | APROVADO | 0 |
| `privacy-guardian` | 2ª | APROVADO | 0 |
| `conformidade-reviewer` | 2ª | APROVADO | 0 |
| `tenancy-guardian` | 2ª | APROVADO | 0 |
| `infra-guardian` | 2ª | APROVADO | 0 |

As duas correções da rodada 3 foram atendidas:
1. `10_task.md`, "sem painel, sem rota nominal": a asserção virou "nenhum nome de aluno no DOM e nenhuma consulta `CHAVE_DO_USO_DO_TUTOR` no `QueryCache`"; a 10.2 e a §7b dizem que só `consultaUsoDoTutor` espera o painel e que os nomes dos sinais ficam em memória, fora da tela. Sem contradição entre elas e a §10.
2. `13_task.md`, "nada legível atrás de 'Acesso gerado'": o `elementFromPoint` saiu; o fundo lido é o do `<dialog>`; há duas mutações, cada uma vermelha sozinha (tirar a classe de tela inteira; com a tela inteira mantida, fundo transparente). A §9 bate, e `Dialogo.tsx` com a variante `inteira` está em "Arquivos previstos".

### Correções exigidas

Nenhuma.

### Recomendações

- `10_task.md`, "fechar o painel solta os nomes": escrever o que o e2e confere (os nomes saem da tela, e a consulta de uso sai do cache por `gcTime: 0`), para ninguém ler como "nenhum nome em memória", que seria o defeito já corrigido (test-engineer).
- `13_task.md` 13.0: a promessa de que "Gerar" e "Acesso vigente" ficam em 560 px e de que a troca de largura não anima não tem cenário; uma asserção de largura no passo "Gerar" fecharia a mutação de aplicar `inteira` em todos os passos (test-engineer).
- Seguem como recomendação, para `criar-tasks` ou para a tarefa, as da rodada 3: `focusManager.setFocused(false)` restaurado no `afterEach` e mutação do caso de Atividades/Alunos aberta (10.0); e2e de permissão restrito às rotas da professora e "em série" com `segurar` nas 14 turmas (1.3); mutação em "sem `?anoLetivoId`, com `limite=100`" e "aluno transferido" (12.0); `?convidar=1` com `replace` e o Voltar como pedido de fechar (13.2/§9); frase de "Projetar" em "Fora do escopo"; e2e de "recomeço" com o `LoginPorCima` (frontend-reviewer, test-engineer).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-13 02:39:21 | 2026-10-13 02:40:06 | `frontend-reviewer` | 1 | APROVADO | a159e93b9fe55be7f |
| 2026-10-13 08:29:41 | 2026-10-13 08:30:52 | `frontend-reviewer` | 2 | AJUSTES NECESSÁRIOS | a9d659f44979120dc |
| 2026-10-13 08:29:49 | 2026-10-13 08:31:26 | `tenancy-guardian` | 1 | APROVADO | a1d37b80edd95ba01 |
| 2026-10-13 08:29:46 | 2026-10-13 08:32:17 | `conformidade-reviewer` | 1 | REPROVADO | aaa8af74b53829025 |
| 2026-10-13 08:29:51 | 2026-10-13 08:32:20 | `infra-guardian` | 1 | REPROVADO | a0361fb8f54352984 |
| 2026-10-13 08:29:38 | 2026-10-13 08:32:43 | `test-engineer` | 1 | REPROVADO | afe872b42ef3e0ab1 |
| 2026-10-13 08:29:43 | 2026-10-13 08:34:06 | `privacy-guardian` | 1 | REPROVADO | a8d407be1b1f4e12b |
| 2026-10-13 08:41:35 | 2026-10-13 08:42:04 | `frontend-reviewer` | 3 | APROVADO | aa924eaffabfc39e9 |
| 2026-10-13 08:42:00 | 2026-10-13 08:42:37 | `tenancy-guardian` | 2 | APROVADO | a2561724554108545 |
| 2026-10-13 08:41:49 | 2026-10-13 08:42:59 | `conformidade-reviewer` | 2 | APROVADO | a937be733885bb377 |
| 2026-10-13 08:41:43 | 2026-10-13 08:43:00 | `privacy-guardian` | 2 | APROVADO | a7b7bcc407c54e53d |
| 2026-10-13 08:41:54 | 2026-10-13 08:43:25 | `infra-guardian` | 2 | APROVADO | a3b08994681ebec10 |
| 2026-10-13 08:41:30 | 2026-10-13 08:43:41 | `test-engineer` | 2 | REPROVADO | a6e0ac6dbe07fa5ca |
| 2026-10-13 08:45:54 | 2026-10-13 08:46:35 | `frontend-reviewer` | 4 | APROVADO | afa2ec728bc18c08e |
| 2026-10-13 08:45:49 | 2026-10-13 08:48:29 | `test-engineer` | 3 | REPROVADO | a6293256777b341cb |
| 2026-10-13 08:50:08 | 2026-10-13 08:51:20 | `test-engineer` | 4 | APROVADO | a7f8339d60e5cdc6b |
