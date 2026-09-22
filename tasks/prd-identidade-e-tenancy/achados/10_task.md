# Achados das revisões — `tasks/prd-identidade-e-tenancy/10_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-18 11:08:02 · `tasks/prd-identidade-e-tenancy/10_task.md`

VEREDITO: REPROVADO

Cenários exigidos:
1. Caminho feliz da virada: confirmado, pendente, contestado e vínculos de aluno vão a `encerrado` por `fim_do_ano`, e todo `complemento` é apagado. O teste confere a coluna no banco (10.4, complemento).
2. Borda: uma falha forçada no meio da virada desfaz tudo. O ano continua `em_curso` e os vínculos ficam intactos.
3. Concorrência: dois `encerrar` em paralelo fazem uma virada só, com uma auditoria.
4. Caminho feliz do histórico: o professor que continua na escola lê a turma e os alunos de 2026, e toda escrita com esse ano é recusada.
5. Borda: professor com `desligamento` ou `realocacao` recebe 404 igual ao do inexistente.
6. Borda: `fim_do_ano` no 2ºB não abre o 2ºC. Vínculo pendente ou contestado que virou `fim_do_ano` não abre nada.
7. Borda: aluno transferido em maio não aparece na lista do ano encerrado.
8. Permissão: a coordenação lê sem vínculo, com finalidade e auditoria em `/alunos`. O aluno com `?anoLetivoId` é recusado.
9. Isolamento: `anoLetivoId` de B dá o mesmo 404 do inexistente. O ano de A em curso ou planejado também dá 404. O escopo de escola, sozinho, segura `virarAno` e `aberta`/`alunos` com contexto forjado.
10. Privacidade: a auditoria da virada guarda só contagens, sem texto livre e sem id de pessoa.
11. 10.4: `GET /v1/vinculos` traz só vínculo de professor. O vínculo de aluno pedido por id dá o 404 do inexistente.

Cobertos: 1, 2, 3, 5, 6, 7, 8, 9, 10 e 11. O 4 está coberto só na metade da leitura.
- Os testes de isolamento têm controle positivo, então quebrariam se a cláusula de escola fosse retirada.
- O teste de atomicidade usa um gatilho real na tabela `auditoria`.
- O clique duplo roda com `Promise.all`, em paralelo de verdade.
- Não há `.skip`, nem mock de código nosso, e nenhuma chamada de IA.

Bloqueantes:
- `apps/api/test/historico.int.test.ts:133-153`: o teste "só leitura: toda escrita no ano encerrado é recusada" não falharia se a regra fosse removida.
  - **Por quê:** ele roda logo depois da virada, quando a escola ainda não tem nenhum ano em curso. Nesse estado, qualquer rota de escrita cai em `exigirAnoEmCurso()` e responde `NAO_ENCONTRADO` antes de olhar o `anoLetivoId`, qualquer que seja o valor dele. Em `POST /v1/turmas`, `apps/api/src/estrutura/turma.service.ts:49` lança o erro antes da comparação da linha 50. Assim, apagar a checagem da linha 50, ou fazer as rotas de vínculo respeitarem o `?anoLetivoId`, deixaria o teste verde.
  - **O caso que importa não está testado:** janeiro, com 2027 já aberto e alguém escrevendo sobre 2026.
  - **Correção exigida:** repetir as recusas com um ano em curso aberto (2027), num estado próprio do teste e não herdado do teste de `:203`. Para cada chamada, conferir a resposta 404 e que nada mudou no banco:
    - `POST /v1/turmas` com `anoLetivoId` de 2026;
    - `POST /v1/vinculos` para a turma de 2026;
    - `confirmar`, `contestar` e `encerrar` sobre o vínculo de 2026.

  Hoje também há dependência de ordem: o teste de `:203` abre 2027 no `escola` compartilhado, e a prova do teste de `:133` depende de rodar antes dele. A correção precisa tirar essa dependência.

Recomendações:
- **Duas disciplinas na mesma turma:** acrescentar em `historico.int.test.ts` o professor com dois vínculos no 2ºB, um encerrado por `desligamento` (física) e outro por `fim_do_ano` (química). Ele deve ler. E o caso inverso: só `realocacao` em uma disciplina e nada na outra, que deve dar 404. Isso prova que o `exists` escolhe o vínculo válido, e não o primeiro que encontra.
- **Encerrar e contestar ao mesmo tempo:** um teste de concorrência de `encerrar` em paralelo com `contestar`, com complemento, no mesmo ano. Ele deve conferir que, ao final, nenhum `complemento` sobra no banco. Pela leitura do código a corrida é segura, porque o segundo `update` relê a linha já gravada, mas hoje não há teste que prove isso.
- **Vínculo de aluno pelas outras rotas (10.4):** `apps/api/test/vinculo.int.test.ts:331-353` cobre só `encerrar` por id. Vale acrescentar `confirmar` e `contestar` (e `GET /v1/vinculos/:id`, se existir) sobre o vínculo de aluno, todos dando o 404 do inexistente.
- **Status explícito:** em `historico.int.test.ts:182`, falta `expect(turma.status).toBe(200)` antes da comparação do corpo, para que a falha apareça com a mensagem certa.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/historico.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/virada-do-ano.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/vinculo.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/ano-letivo.service.ts`

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 11:23:27 · `tasks/prd-identidade-e-tenancy/10_task.md`

VEREDITO: APROVADO

Cenários exigidos:
- **Correção da 1ª rodada (só leitura):** com 2027 já em curso e num estado próprio do teste, cinco escritas sobre 2026 são recusadas com 404 e nada muda no banco. As cinco são criar turma com o ano de 2026, criar vínculo na turma de 2026, e confirmar, contestar e encerrar o vínculo de 2026. O teste não pode depender da ordem de execução.
- **Recomendações que você aplicou:** o professor com duas disciplinas no 2ºB, e o status explícito no teste de permissão da coordenação.
- **Concorrência nova:** encerrar o ano ao mesmo tempo em que um professor contesta com texto.

Cobertos:
- **Correção exigida, feita.** O teste está em `apps/api/test/historico.int.test.ts:142-170`. Ele monta a própria escola (`montar()`), cria e abre 2027, e só então faz as cinco escritas. Cada uma exige `NAO_ENCONTRADO`, e as contagens de turma, vínculo e auditoria são comparadas antes e depois. Não depende mais da ordem dos testes. Conferi, com `apps/api/src/estrutura/vinculo.service.ts` aberto, que cada recusa ficaria vermelha se a regra do ano saísse:
  - **Criar vínculo:** sem o escopo do ano, `turmas.aberta` acharia a turma de 2026 e o vínculo nasceria com 201.
  - **Confirmar e contestar:** sem o escopo, `travar` acharia o vínculo encerrado e `#decidir` devolveria 409 `CONFLITO`, não 404.
  - **Encerrar:** sem o escopo, encerrar um vínculo já encerrado responde 200 (o caminho do segundo clique), não 404.
  - **Criar turma:** você conferiu à mão que apagar a comparação em `turma.service.ts` deixa o teste vermelho.
  
  O controle (a mesma turma sem o ano nasce em 2027, e o histórico continua sendo lido) prova que o 404 vem da regra, e não de a escrita estar travada de modo geral.
- **Duas disciplinas.** O teste está em `historico.int.test.ts:172-177`: Física encerrada por `desligamento` e Química até `fim_do_ano`. Ele falharia se a regra passasse a exigir que todo vínculo do professor tivesse chegado ao fim do ano. Se a leitura dos alunos der 404, `ids()` quebra, então o teste não passa em silêncio.
- **Concorrência encerrar com contestar.** O teste está em `virada-do-ano.int.test.ts:209-223`. É concorrência de verdade (`Promise.all`), e a asserção olha o banco: todo vínculo do ano encerrado e sem `complemento`.
- **Recusa do item 10.4, que você não aplicou:** a justificativa está certa. O 404 viria da cláusula de dono do vínculo, e não provaria o filtro de papel.

Bloqueantes: nenhum.

Recomendações:
- `virada-do-ano.int.test.ts:209-223`: o resultado da corrida muda a cada execução, então numa rodada só o teste pode cair sempre na mesma ordem e não exercitar a ordem que quebraria. Uma variante determinística ajudaria: segurar um `FOR UPDATE` no vínculo por uma conexão da bancada enquanto o encerramento roda, ou repetir a corrida algumas vezes.
- `historico.int.test.ts:154-157`: a query `?anoLetivoId` nos POST de vínculo não altera o resultado. Um comentário dizendo que o parâmetro é ignorado (e não que foi rejeitado) evitaria que alguém lesse ali uma regra que não existe.
- Não rodei os testes: confiei no portão local verde que você relatou.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/historico.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/virada-do-ano.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts`

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-18 11:33:47 · `tasks/prd-identidade-e-tenancy/10_task.md`

VEREDITO: APROVADO

**Tabelas verificadas:** nenhuma tabela nova e nenhuma migration nesta tarefa. `vinculo`, `turma` e `ano_letivo` já têm `escolaId` e `anoLetivoId` onde precisam (`ano_letivo` só tem `escolaId`). Os ids continuam UUID, e o `?anoLetivoId` novo é validado com `z.uuid()`.

**Queries verificadas:**
- `AnoLetivoRepository.mudarSituacao` e `porId`: filtram pela escola do contexto. O ano que vai para `virarAno` é o que esse `update` condicional acabou de devolver, na mesma transação.
- `VinculoRepository.virarAno` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts:168`): a escola vem do contexto. O `anoLetivoId` é interno, nunca do cliente.
- `VinculoRepository.#escopo`: escola e ano em curso do contexto, mais `papel = 'professor'`. O vínculo de aluno responde o mesmo 404 do inexistente (10.4).
- `TurmaRepository.aberta` e `#doAnoDaLeitura`: a escola vem do contexto. O `?anoLetivoId` do cliente só restringe a leitura: a turma tem que ser desse ano, e o ano tem que existir na escola da turma e estar `encerrado`.
- `TurmaRepository.#comVinculoDoProfessor`: o vínculo é procurado pela escola, pelo ano e pelo id da turma, e o usuário vem da sessão.
- `TurmaRepository.alunos`: escola do contexto, e ano só depois de `aberta` confirmar, na mesma transação.
- Escrita com `anoLetivoId`:
  - `POST /v1/vinculos` recusa o campo no corpo, pelo esquema estrito.
  - As rotas de vínculo ignoram o campo na query e continuam no ano em curso.
  - `POST /v1/turmas` já respondia 404 para ano que não está em curso.
- Mensagens de erro: o ano de B, o ano em curso, o planejado, o inexistente e o de outra turma respondem todos o mesmo `NAO_ENCONTRADO`, e os testes comparam as respostas entre si.
- `@SemEscopo()` não aparece no código novo. Nenhuma consulta de rede foi tocada.

**Teste de isolamento:** presente e efetivo.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/historico.int.test.ts:279`: repassei a remoção cláusula por cláusula. Um contexto forjado de A recebe a turma, o ano e o professor de B, e a mesma chamada com a escola de B serve de controle.
  - Sem `turma.escolaId = contexto`, `aberta` devolveria a turma de B, porque o `exists` do ano compara com a escola da própria turma, não com a do contexto. O teste quebra.
  - Sem `vinculo.escolaId = contexto` em `alunos`, voltariam os alunos de B. O teste quebra.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/virada-do-ano.int.test.ts:247`: sem a escola do contexto em `virarAno`, a contagem sai diferente de zero e os vínculos de B mudam. O teste quebra.
- `historico.int.test.ts:262` e `virada-do-ano.int.test.ts:234` cobrem o mesmo pela HTTP: o ano de B, e o id do ano de B em `encerrar`, respondem igual ao inexistente.

**Bloqueantes:** nenhum.

**Recomendações:**
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts:181`: no `exists`, comparar `anoLetivo.escolaId` com `exigirEscolaDoContexto()` em vez de `turma.escolaId`. Assim a subconsulta não depende da cláusula de fora para ficar presa à escola, e se alguém reaproveitar `#doAnoDaLeitura` noutra consulta o escopo vai junto.
- O filtro `papel = 'professor'` entrou no `#escopo` comum. Com isso a listagem do próprio usuário também deixa de trazer vínculo de aluno. Não vaza nada entre escolas, mas vale registrar no techspec que nenhuma rota de vínculo atende o aluno, antes que o F2 ou o F9 precisem de uma.

Não rodei nenhum teste: a auditoria foi feita lendo o diff e os testes novos.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-18 11:34:01 · `tasks/prd-identidade-e-tenancy/10_task.md`

VEREDITO: APROVADO

A tarefa 10.0 não tem nenhum bloqueante de privacidade. Li o diff, o `docs/lgpd.md` e os dois testes novos. Não rodei os testes: me apoiei no seu portão local verde e no `test-engineer` aprovado.

**Campos pessoais tocados:** `vinculo.complemento` (o texto livre da contestação, que agora é apagado na virada), `vinculo.contestacao` (o código, um enum, que fica), `vinculo.estado`, `motivo_encerramento` e `encerrado_em`, e `usuario.nome` do aluno, só na leitura da lista do ano encerrado. Não entrou coluna nova, nem campo proibido para aluno.

**Fora da tabela de dados do `docs/lgpd.md`:** nenhum. A linha do motivo de contestação agora está correta: o `complemento` é apagado na mesma transação do encerramento, e o código fica com o vínculo. Conferi o motivo que você deu para manter o código. Contestar grava `decidido_em` e confirmar apaga o código (`vinculo.repository.ts:140-141`). Por isso o código é o que separa o contestado do confirmado depois da virada.

**Autorização por objeto:** ok. Troquei o id na URL mentalmente em cada caso:
- **Filtro do cliente:** `?anoLetivoId` só restringe a leitura. A escola continua vindo do contexto, e o ano precisa ser da escola da turma e estar `encerrado` (`turma.repository.ts:340-351`). O ano de outra escola, o em curso, o planejado e o inexistente dão o mesmo 404.
- **Seus três pontos de atenção batem com o código:**
  - **(1)** a virada apaga o `complemento` e mantém o código, e a linha do `docs/lgpd.md` diz isso.
  - **(2)** só abre o histórico o `fim_do_ano` que tinha sido confirmado: exige `decidido_em` e nenhum código de contestação (`turma.repository.ts:377-382`). O pendente e o contestado não abrem, e há teste disso.
  - **(3)** o filtro `papel = 'professor'` está no escopo comum do `VinculoRepository` (`vinculo.repository.ts:507`). O vínculo de aluno responde 404, igual ao inexistente, e há teste.
- **Aluno:** com `?anoLetivoId` recebe 404 na turma e nos alunos.
- **Rede:** não chega aqui. `alcanceDaTurma` só deixa passar coordenação e professor com vínculo, e qualquer outro papel recebe 404.
- **Escrita:** nenhuma rota de escrita aceita o ano encerrado. Há teste de que nada muda no banco.

**Logs:** limpos. O diff não acrescenta nenhum log, e os que já existiam em `vinculo.service.ts` só levam o nome do evento.

**Auditoria:** presente onde a regra exige.
- A virada grava `ano_letivo.encerrado` na mesma transação. O registro leva só contagens, e o esquema estrito não aceita texto livre nem id de pessoa. Há teste lendo a tabela de auditoria inteira.
- A leitura dos alunos do ano encerrado pela coordenação exige finalidade e grava `turma.alunos_lidos` na mesma transação, como na 9.0. Abrir só a turma não expõe dado de aluno.
- O segundo clique em encerrar, em paralelo, não repete a virada nem a auditoria.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. Os alunos se chamam "Aluno sintético N", e o texto de contestação é constante de teste.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Prazo do código de contestação:** a linha do `docs/lgpd.md` diz que o código "fica com o vínculo", mas não dá prazo. Vale escrever explicitamente "vigência + 5 anos, com o vínculo", para quem auditar não precisar deduzir.
2. **Ano no registro de leitura:** `turma.alunos_lidos` não registra o `anoLetivoId`. Hoje ele sai do id da turma, que é de um ano só. Se a turma passar a atravessar anos no F2, registre o ano no `depois`.
3. **Pergunta de fechamento, para a 17.0:** esta tarefa não cria dado que não se consiga rastrear. Mas a resposta "tudo sobre um aluno e para onde foi" ainda depende da rotina de direitos do titular (regra 20, item 19), que não está nesta tarefa. Registre para o `/validar` que essa pergunta precisa ser respondida por código antes do piloto.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/ano-letivo.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/auditoria/acoes.ts
- /home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/virada-do-ano.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/historico.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/vinculo.int.test.ts

## revisor-geral · 1ª rodada · APROVADO · 2026-09-18 11:34:03 · `tasks/prd-identidade-e-tenancy/10_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. Há uma decisão tomada na execução, mas ela não foi silenciosa: está na seção 5, "Histórico", da `techspec.md`, nas "Notas da implementação" e no pedido de revisão (ver a recomendação 1).
Portão local: carimbo válido (typecheck, lint, test)
Bloqueantes: nenhum

Recomendações:
1. **A Tech Spec mudou numa decisão tomada durante a tarefa.** O texto original dizia "`confirmado` ou `encerrado` por `fim_do_ano`". Agora o `fim_do_ano` só dá acesso se o vínculo tiver `decidido_em` e não tiver código de contestação. A mudança fecha um furo real: sem ela, o professor que contestou ("não leciono") ou nunca respondeu passaria a ler os alunos em janeiro. Mesmo assim, é mudança de spec feita por quem implementou, e o Joaquim deve ratificá-la de forma explícita no commit ou no `tasks.md`.
2. **O critério novo depende de um campo que hoje só o teste preenche.** A lista de alunos do ano encerrado usa o mesmo critério (`#confirmadoAteOFimDoAno` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts`). Então o vínculo de aluno precisa ter `decidido_em` preenchido, senão some do histórico depois da virada. Hoje só a fixture `alunosNaTurma` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-com-turma.ts:46`) grava esse campo. Registre essa exigência para o F2 (importação da lista e reivindicação aprovada), no `TODO.md` ou na Tech Spec. Sem isso, o F2 cria alunos que não aparecem no ano encerrado e nenhum teste atual avisa.
3. **O filtro da 10.4 afeta mais rotas do que a listagem.** O `papel = 'professor'` entrou em `#escopo()` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts`) e vale também para `decidir`, `listarDoUsuario` e `porIdDoUsuario`, não só para a listagem da coordenação. Hoje não quebra nada, porque o aluno tem `ler_proprios: 'nunca'`. Mas quando o aluno precisar ver o próprio vínculo, o escopo comum vai escondê-lo sem aviso. Vale deixar isso dito no comentário de `#escopo`.
4. **O ano da leitura é convertido para minúsculas em dois lugares.** `anoLetivoId?.toLowerCase()` aparece em `abrir` e em `alunos` no `turma.service.ts`. Ficaria num lugar só se o esquema de `campoAnoDaLeitura` já devolvesse o valor normalizado.
