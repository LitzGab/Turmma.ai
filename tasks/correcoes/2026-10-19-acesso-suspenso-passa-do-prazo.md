# Correção — o caso "a professora suspensa na escola A e ativa na B…" de `acesso-suspenso` estoura os 30 s no celular da esteira

**Origem:** esteira runs 39245232512 e 39247160014 (push de `spec/telas-do-professor`), job `e2e 4/7`
**Subagentes obrigatórios:** `infra-guardian`

## Sintoma

`[celular] › e2e/acesso-suspenso.spec.ts:165:3 › acesso suspenso pela eliminação agendada › a professora suspensa na escola A e ativa na B recarrega e vê a tela; o segundo F5 cai na entrada, e o e-mail entra em B, sem A no seletor`, `Test timeout of 30000ms exceeded` (30,3 s e 30,5 s), nas duas corridas, na mesma linha (a última asserção do caso, `not.toContainText(emA.escolaNome)`, com `Protocol error … session closed`: o caso não trava num passo, ele acaba sem tempo). Na 39245232512 também caiu `[chromebook] › e2e/escola-e-vinculos.spec.ts:423:3 › vínculos do professor › os quatro estados: carregando, erro com nova tentativa, vazio convidando a falar com a coordenação, e a lista` (30,7 s); na 39247160014 esse passou. `gh run view <id> --log-failed`.

## Fora desta correção
Os três casos que a corrida de medição mostrou acima de 15 s e que esta correção não tocou: `acesso-suspenso.spec.ts:78` (18,4 s), `escola-e-vinculos.spec.ts:212` (22,4 s) e `escola-e-vinculos.spec.ts:272` (18,9 s). Ficam para correção própria, se a esteira os apontar.

## Causa

Os dois casos são lentos por construção, e a esteira só mostrou o que a máquina local já tinha: `acesso-suspenso.spec.ts:165` levava 25,7 s (chromebook) e 27,4 s (celular) isolado, e `escola-e-vinculos.spec.ts:423` levava 23,0 s e 24,7 s, contra os 30 s do runner, que leva perto do dobro. Não é regressão de código nem defeito do produto: os dois casos não mudaram desde que entraram. O traço (`--trace on`, um trabalhador) mostra onde vai o tempo: a **primeira carga da página na rede do perfil** (Navigate de 3 s mais 6,4 s até o título de Ferramentas, ou 7,9 s até a saudação do Início, com CPU ×4 e Fast 3G ou rede móvel lenta), cada **recarga** (2,5 s), e as varreduras do axe. O caso 165 pagava duas cargas pela tela (A com o seletor de escola, depois B) e duas recargas; o 423 pagava a entrada pela tela, a saudação, a leitura segurada, duas varreduras do axe e uma recarga com a leitura segurada de novo (5,4 s até o "Carregando"). Trocar só a entrada pela tela pela da API quase não mexeu (25,7 → 25,0 s): o custo era a carga fria da página, não o hash da senha. As duas falhas são a mesma causa (tempo do caso, não do que ele prova); na 39247160014 só o 165 caiu, o 423 passou, o que é a oscilação esperada de um caso a 23–25 s.

## Teste que reproduz

Não dá para reproduzir de forma determinística: o estouro depende da carga do runner. A evidência que substitui o vermelho é a duração medida com os trabalhadores da esteira (`--repeat-each 3 --workers 2`, 96 execuções verdes dos dois specs): antes, 25,7 s e 27,4 s (`acesso-suspenso:165`) e 23,0 s e 24,7 s (`escola-e-vinculos:423`), isolados; depois, os quatro casos que saíram deles levam de 3,3 a 8,7 s (números em "Correção").

## Correção

`e2e/acesso-suspenso.spec.ts`: o caso 165 virou dois. O primeiro (a professora suspensa em A e ativa em B recarrega e vê a tela; o segundo F5 cai na entrada) entra pela API, com a escola A escolhida, em Ferramentas, e a **primeira carga** roda sem a rede do perfil (`carregarSemRedeLenta`, que o caso das duas abas já usava); as recargas, que são o que ele prova, ficam na rede lenta. O segundo (entra pelo e-mail direto em B, sem A no seletor) faz a entrada pela tela, como antes, com a suspensão de A posta no banco antes. Nenhuma asserção saiu: a tela, o texto, o link para `/entrar`, a largura, o axe, o nome ausente, o segundo F5 sem a tela, o e-mail em B, a escola A ausente e nenhum seletor. A conta ainda tem as duas escolas nos dois casos.

`e2e/escola-e-vinculos.spec.ts`: o caso 423 virou dois, com um ajudante local (`abrirTurmasDaProfessora`: entrada pela API e primeira carga sem a rede lenta). O primeiro guarda os estados sem lista (carregando, erro com "Tentar de novo", vazio com o axe); o segundo guarda o estado com a lista (carregando e depois a turma alocada, com o axe). **Uma asserção muda de forma:** o "dado" era visto depois de uma recarga que pegava a alocação criada com o vazio já na tela; agora a alocação existe antes de a professora abrir as Turmas e a lista vem na primeira busca. Nada deixou de ser coberto: a recarga do caso antigo já descartava o cache do TanStack Query, então a "busca seguinte" era uma carga do zero, igual à primeira busca do caso novo, e a lista continua provada nos dois estados.

Medido depois, 96 execuções verdes, com 2 trabalhadores: `acesso-suspenso` (primeiro caso) 8,0 a 8,7 s e (segundo) 7,8 a 8,3 s nos dois projetos; `escola-e-vinculos` (sem lista) 4,8 a 5,1 s e (com lista) 3,3 a 3,4 s. Os três casos acima de 15 s que ela não tocou estão em "Fora desta correção".

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 12:55:32 | 2026-10-19 12:56:24 | `infra-guardian` | 1 | APROVADO | a36d6f534f5bfdf42 |
| 2026-10-19 12:55:33 | 2026-10-19 12:57:00 | `test-engineer` | 1 | APROVADO | a9156231ec4707868 |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | `escola-e-vinculos.spec.ts:476`: a passagem do vazio para a lista, com recarga, não tem mais teste; criar teste de integração ou de unidade da revalidação | Recusada: o `test-engineer` (1ª) verificou que o `page.reload()` do caso antigo já descartava o cache do TanStack Query, então a "busca seguinte" era uma carga do zero, igual à primeira busca do caso novo; nenhuma cobertura saiu. A revalidação em si é da biblioteca e não é regra nossa |
| infra-guardian (1ª) | `acesso-suspenso.spec.ts:173`: confirmar que algum caso dedicado mede a carga fria da entrada da equipe na rede do Chromebook | Fora do escopo desta correção, que só tira tempo de carga de casos que provam outra coisa. Destino: `/retro` (orçamento de desempenho da carga fria é assunto próprio, regra 50) |
| infra-guardian (1ª), test-engineer (1ª) | Os três casos acima de 15 s (`acesso-suspenso:78`, `escola-e-vinculos:212` e `:272`): registrar ou corrigir de forma preventiva, com o mesmo padrão (entrada pela API e primeira carga sem a rede lenta) | Ficam nomeados em "Fora desta correção" (item 2). Destino: correção própria preventiva, a critério do Orquestrador, se a esteira apontar; o `/retro` recebe o padrão |
| infra-guardian (1ª) | O segundo caso de `acesso-suspenso` não usa mais dado de B além de `escolaNome`; "nada a mudar" | Sem ação: o revisor mesmo diz que está certo |
| test-engineer (1ª) | `acesso-suspenso.spec.ts`, caso 165: asserção curta com o nome da escola A antes de `agendarEliminacaoNoBanco`, "se a casca mostrar o nome em Ferramentas" | Recusada: o próprio revisor registra que o caso falha se a sessão não estiver em A (`entrarPelaApi` recebe `emA.usuarioId`; a tela de suspensão prova a escola), e a asserção depende de a casca mostrar o nome em Ferramentas, o que ninguém conferiu. Mexer no spec caducaria `test-engineer` e `revisor-geral` por ganho que o revisor chama de indireto já garantido |
