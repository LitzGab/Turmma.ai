# Correção — O e2e do Uso da operação depende das escolas que outros casos deixam no banco: três casos caem com o banco vazio e o W6 cai com painéis concorrentes

**Origem:** esteira run 40229975857 (f2b690b, depois da tarefa 9.0; última verde 00961a7), mais o W6 do Chromebook, que o portão local pegou ao rodar o arquivo inteiro
**Subagentes obrigatórios:** `infra-guardian`, `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`
<!-- test-engineer é obrigatório em toda correção. -->

## Sintoma

`e2e/operacao-uso.spec.ts` caiu em três casos na esteira, no chromebook (e2e 3/8) e no celular (e2e 7/8):

- `:236` W7: "carregando, vazio com o link para Escolas, erro com 'Tentar de novo' e com dado, com axe em todos": `getByRole('region', { name: 'Uso por escola' }).getByRole('alert')` não encontrado (linha 299)
- `:323` referência: `Error: o banco de teste não tem escola para a referência`
- `:366` "a escola criada pela tela entra no Uso com zero": `expect.poll(() => nomesNaTela(page)).not.toEqual([])` recebe `[]` (linha 376 do log)

Detalhe: `gh run view 40229975857 --log-failed`.

E, na máquina, com o arquivo inteiro e 6 trabalhadores, o **W6 do Chromebook** (`:96`, linha 179: `expect(segunda.itens.map(id)).not.toContain(escola.id)`): as duas escolas dele aparecem na página 2 da ordem por uso. Falhou igual na primeira corrida do arquivo inteiro, antes de qualquer mudança desta correção, e de novo no portão local; o portão roda o arquivo inteiro, e por isso esta correção não passa sem ele.

## Fora desta correção

Nada. Sem tarefa em curso na árvore.

## Causa

Uma só, nos dois sintomas: o spec conta com o que **os outros casos semearam no banco**, e isso muda com a divisão e com o número de trabalhadores.

**Os três casos da esteira.** Da tarefa 9.0 (que acrescentou `e2e/aluno-introducao.spec.ts` e mexeu em outros specs): a esteira divide o e2e em 8 shards (`--shard=i/8`), e cada job começa com o banco vazio (regra 40, "o teste precisa passar nos três" ambientes). Ao mudar a lista de specs, a 9.0 mudou quais casos caem em cada shard, e os três casos ficaram num shard em que nenhum outro semeou escola antes. Eles não semeiam nada: usam as escolas "do banco de teste, que guarda as das outras suítes", como dizia o comentário do topo do arquivo. Com o banco vazio, o Uso mostra "Nenhuma escola ainda.", sem a região "Uso por escola" nem item para trocar. Na máquina o banco acumula escolas de execuções anteriores, e a esteira de antes só passava por acaso do sorteio das fatias.

**O W6.** A máquina roda o e2e com 6 trabalhadores, e `14.4`, `RF23` (dois projetos cada) e o outro W6 chamam `semearPainel()` ao mesmo tempo que o W6 do Chromebook. Cada painel dá às 8 primeiras escolas um uso maior que o de qualquer escola semeada antes (`Date.now() * 100`, crescente com o relógio). Os painéis semeados depois do W6 passam 25 escolas na frente das duas dele, e a primeira dele vira o item 0 da página 2. O comentário do próprio teste contava com poucos painéis ao mesmo tempo; na esteira são 2 trabalhadores, e por isso lá passava.

## Teste que reproduz

**Os três casos:** referência, W7 e "a escola criada pela tela", nos dois projetos, rodados **sozinhos e com o banco novo**: `node tools/ci/e2e.ts '--grep=referência: o dia|W7: carregando|a escola criada pela tela' e2e/operacao-uso.spec.ts`, depois de um `node tools/ci/e2e.ts` anterior sem `--manter-ambiente`, que derruba o projeto com os volumes (o `e2e.ts` não lê `EDUCA_BANCO_NOVO`, só a integração).

- Antes: 6 vermelhos, com as mesmas mensagens da esteira (`o banco de teste não tem escola para a referência`; `element(s) not found` na região "Uso por escola" do W7; `not.toEqual([])` no "criada pela tela").
- Depois: 6 verdes, no mesmo comando.

Duas corridas não reproduziam e não valem como prova: o arquivo inteiro (os casos que semeiam painel enchem o banco ao mesmo tempo) e os três casos num ambiente que já estava de pé com escolas da corrida anterior.

**O W6:** o arquivo inteiro com os 6 trabalhadores da máquina, `node tools/ci/e2e.ts e2e/operacao-uso.spec.ts`.

- Antes: W6 do Chromebook vermelho em `:179` nas duas corridas do arquivo inteiro (a primeira, sem nenhuma mudança minha no spec, e a do portão).
- Depois, a corrida dos **dois specs juntos** (`operacao-uso` e `operacao-escolas`, que semeiam painel e que a máquina e a esteira misturam, porque o `playwright.config.ts` tem `fullyParallel`), com os 6 trabalhadores e a repetição que põe vários painéis semeando ao mesmo tempo: `node tools/ci/e2e.ts --repeat-each=3 --workers=6 e2e/operacao-uso.spec.ts e2e/operacao-escolas.spec.ts`, sobre banco novo: 96 verdes em 4,7 min. A conta do pior caso, abaixo, é o que garante o resultado; a corrida só confere que ela não esquece nenhum chamador. Uma primeira versão desta correção (`usoNoTopo` com as 8 escolas) passou 42 verdes só no `operacao-uso`, e a Mesa mostrou que isso vinha do escalonamento, e que deixava o W6 e o W10 de Escolas a um painel de cair.
- Os três casos, de novo, com banco novo e agora com a escola avulsa apagada no `afterEach`: 6 verdes (`node tools/ci/e2e.ts '--grep=referência: o dia|W7: carregando|a escola criada pela tela' e2e/operacao-uso.spec.ts`).

## Correção

Nos dois, o caso passa a não depender do que os outros deixaram no banco. Só `e2e/` mudou: `e2e/operacao-uso.spec.ts`, `e2e/operacao-escolas.spec.ts` e `e2e/__fixtures__/painel.ts`.

**Os três casos** semeiam uma escola própria antes de entrar na tela (`umaEscolaNoBanco()`, que usa `semearEscolaDoConvite('sem_convite')`). Uma só, sem uso, e não o `novoPainel()` de 30: o painel traz escolas com o maior uso do banco, e cada uma entra na frente das de quem procura a primeira página por uso. A escola é a `sem_convite`, sem conta, usuário nem convite, e por isso o `afterEach` do spec a apaga, com a rede dela (`removerEscolaSemConvite`, em `e2e/__fixtures__/painel.ts`); a escola do teste de convite continua sem apagar, porque o convite que ele gera deixa auditoria nela (a limpeza do banco de teste é correção à parte).

**O W6 e a posição por uso, nos dois specs.** O uso do painel passa a ter três faixas (`UsoDoPainel`, em `e2e/__fixtures__/painel.ts`), e o chamador diz qual quer: `comum` (as 8 primeiras escolas, o uso de agora), `topo` (só as 2 primeiras, com o relógio 3 minutos à frente) e `nenhum` (sem linha de uso). O que decide é quantas escolas com uso ficam vivas ao mesmo tempo na frente de quem procura as suas na primeira página, que tem 25:

| Caso | Faixa | Vivos ao mesmo tempo (o dele e o do outro projeto) |
|---|---|---|
| W6 do `operacao-uso` | `topo` | 2 + 2 escolas |
| W6 e W10 do `operacao-escolas` | `comum` | 8 + 8 escolas |
| RF23 e 14.4 dos dois specs | `nenhum` | nenhuma |

Pior caso do W6 do Uso: na frente dele só a `topo` do outro projeto, 2 escolas; a dele é a posição 3 no máximo (asserta as 2 primeiras do painel). Pior caso do W6 e W10 de Escolas: na frente, as 4 escolas de `topo` (2 + 2) e as 8 do outro `comum`; a mais baixa do `porEstado` é a 8ª do painel (posição 7), e portanto a posição 19 no máximo, de 25: cabem as 7 na primeira página e nenhuma na segunda, com folga de 5 escolas. O que cada caso afirma não mudou. O RF23 e o 14.4 só precisam da lista cheia, e por isso não pesam: antes cada um dos 8 casos (dois por spec, nos dois projetos) semeava 8 escolas com o uso mais alto do banco, e bastavam 3 painéis semeados depois do W6 de Escolas para derrubá-lo (o risco existia antes desta correção).

**A sobra de uma execução interrompida** (trabalhador morto antes do `afterEach`) se resolve pelo relógio, sem apagar nada: o uso do painel `comum` sobe com o relógio, e a sobra fica atrás do de agora; o `topo` anda 3 minutos à frente (`MARGEM_DO_TOPO_MS`, mais que o teste mais longo dura, 90 s do `test.slow()`) e depois desses 3 minutos também fica atrás. Nesses 3 minutos cada painel `topo` abandonado põe 2 escolas na frente do W6 de Escolas, que tem folga de 5: dois abandonos seguidos cabem, três não, e passados os 3 minutos o banco volta ao normal sem recriar o volume. O comentário do topo do fixture, que dizia que a sobra fica sempre atrás, foi corrigido, e a conta do pior caso está escrita no tipo `UsoDoPainel`, junto do código que a muda. O número do `topo` tem os mesmos 15 dígitos do comum, e por isso continua cabendo na linha e no cartão a 360 px.

O comentário do topo do spec diz agora que a fatia da esteira começa vazia e que o caso que só precisa de uma escola semeia a sua. Também saiu a linha em branco duplicada depois dele.

**Sem mutação:** só `e2e/` mudou, fora de `apps/*/src` e `packages/*/src` (RF17 não se aplica). A mutação natural (tirar `umaEscolaNoBanco()`, ou trocar a faixa `topo` ou `nenhum` por `comum`) só fica vermelha com o banco vazio ou com painéis concorrentes, que o banco do portão não dá; a prova são as corridas de "Teste que reproduz".

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (2ª) | O comentário em `e2e/operacao-uso.spec.ts:145-146` ficou falso: diz que o W6 do outro projeto "passa as oito dele na frente", mas no `topo` são 2. Trocar "as oito" por "as duas" | `TODO.md`: é uma palavra de comentário, sem efeito no teste; fica para a próxima correção que tocar `operacao-uso.spec.ts` |
| test-engineer (2ª) | A conta do pior caso vale para uma instância de cada caso por projeto. Com `--repeat-each=3` e 6 trabalhadores podem ficar vivos até 6 painéis `comum` (até 40 escolas na frente, mais que as 25 da página); registrar em `UsoDoPainel` e no documento que a conta não vale com repetição | `TODO.md`: a esteira e o portão rodam sem `--repeat-each`; é nota de documentação em `UsoDoPainel` |
| test-engineer (2ª) | `removerEscolaSemConvite` aceita qualquer `EscolaDoConvite`, inclusive a `pendente`, que tem convite e conta; estreitar o tipo ou conferir o `rowCount` do `delete` | `TODO.md`: hoje só a `sem_convite` chega lá (uso único, no `afterEach` do `operacao-uso`); entra com a correção da limpeza do banco de teste |
| conformidade-reviewer, tenancy-guardian, privacy-guardian, infra-guardian (1ª) | Registrar a correção da limpeza do banco de teste (escolas de convite e as que a tela cria) | `TODO.md` (já na ordem da rodada 1) |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 19:35:48 | 2026-10-25 19:36:10 | `conformidade-reviewer` | 1 | APROVADO | a0573b32b335a707d |
| 2026-10-25 19:35:46 | 2026-10-25 19:36:11 | `tenancy-guardian` | 1 | APROVADO | a57b1f88e289acb49 |
| 2026-10-25 19:35:47 | 2026-10-25 19:36:16 | `privacy-guardian` | 1 | APROVADO | a929054b0e76e8efa |
| 2026-10-25 19:35:45 | 2026-10-25 19:36:28 | `infra-guardian` | 1 | APROVADO | aa99b2dc34ee7bea8 |
| 2026-10-25 19:35:49 | 2026-10-25 19:37:57 | `test-engineer` | 1 | REPROVADO | a3ee0fc56ab509ba5 |
| 2026-10-25 20:04:34 | 2026-10-25 20:06:09 | `test-engineer` | 2 | APROVADO | a2d6871aab485dddd |
