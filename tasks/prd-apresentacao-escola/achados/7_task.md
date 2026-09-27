# Achados das revisões — `tasks/prd-apresentacao-escola/7_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-27 00:09:19 · `tasks/prd-apresentacao-escola/7_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** I10; L1, L2, L3 (espera de 1 s, escola B sem espera, pool mínimo); L4, L4b; L5, L6, L6b; L7, L8; C1, C2 e E21 com os contadores, em paralelo; E30 (gravação, e o "Gerar novo" começando do zero); `Retry-After` no nome; as duas métricas sem rótulo de escola; o log uma linha por escola, tipo e janela, sem IP, código, slug, matrícula nem nome (A4). Faltava na lista um cenário que também exijo: **várias matrículas erradas no mesmo nome livre ao mesmo tempo**. É o caso "clique duplo" da regra 80, item 7, aplicado ao teto do nome.

**Cobertos:** todos os da lista, menos esse último.
- I10, L1 a L6b, `Retry-After`, métricas e log: `apps/api/test/limites-da-sala.int.test.ts`.
- L7, log e séries em 0, como unidade: `apps/api/src/sala/limites-da-sala.test.ts`.
- L8, na unidade e no Redis: `contador-em-janela.test.ts` e `contador-em-janela.int.test.ts`.
- C1, C2 (a, b, c), E21 e E30 com os contadores: `apps/api/test/salas-reivindicar.int.test.ts`.
- Ordem dos passos, rebaixado e travado sem hash: `reivindicacao.service.test.ts`.

As asserções olham o resultado de verdade: o valor de cada contador lido no Redis, os baldes pelo espião do semáforo, o tempo da espera, conexões presas no pool, o corpo idêntico byte a byte, `teve_matricula_errada` no banco e o objeto exato do log. Não achei `.skip`, `.only` nem `any`. Nenhum mock esconde a regra: no teste de unidade o limite é falso, mas o de integração roda com a peça real. A tabela de Mutações cobre as cláusulas novas.

**Bloqueantes:**

1. **O teto do nome não vale com pedidos em paralelo, e nenhum teste de paralelo prova esse teto.**
   - **Onde está o erro:** `apps/api/src/sala/reivindicacao.service.ts:104` lê o contador do nome (`limites.antesDoHash`, que usa `janela.ler`). A soma só acontece em `:115`, depois do hash e da volta atrás. É "verifica e depois grava" (regra 80, item 7).
   - **Primeira consequência:** N matrículas erradas enviadas juntas ao mesmo nome livre leem todas o valor 0 e todas rodam o hash. O ator testa tantas matrículas quantas o semáforo atende no prazo de 2 s (dezenas por instância), e não 5. Esse número vale por janela de 10 min. "A 6ª trava" (L4) só é verdade em sequência. O L4 e o L4b mandam as tentativas do mesmo nome uma depois da outra (`:153`), ou em lotes de nomes diferentes (`:181`).
   - **Segunda consequência, pior:** o `teveMatriculaErrada` também é lido em `:104`, antes de qualquer soma. O palpite certo que chega no mesmo lote das erradas grava o pedido com `teve_matricula_errada = false`. O professor aprova sem o aviso que o E30 existe para dar, e a força bruta que deu certo sai sem marca.
   - **Correção exigida:**
     - Teste de integração com K matrículas erradas no mesmo nome livre, em paralelo (`Promise.all`, K acima de 5, sem estourar o prazo do semáforo). Ele afirma no máximo 5 respostas `REIVINDICACAO_RECUSADA` e as demais `LIMITE_EXCEDIDO`.
     - Uma variante com a matrícula certa no meio do lote, que afirma `teve_matricula_errada = true` no pedido gravado.
     - A implementação que faça isso passar, e essa decisão é de quem implementa. Um caminho é reservar a vaga de forma atômica antes do hash (INCR de "em voo" por acesso e nome, com o teto sobre em voo + erradas) e desfazer quando a falha não for matrícula errada, sem quebrar o I10 nem o L6b.
     - Se o Joaquim aceitar o estouro, o aceite fica na seção 7c da `techspec.md` e no L4 do `cenarios.md`, com o limite do estouro declarado e um teste que prove esse limite. A marca do E30 escondida pelo paralelo não pode ser aceita: ela precisa sair `true`.

**Recomendações (não bloqueiam):**

- **`sala.reivindicacao{resultado}`:** o teste (`limites-da-sala.int.test.ts:391`) cobre `enviado`, `reenvio`, `recusada`, `limite` e `sem_acesso`. `indisponivel` (o mapeamento em `reivindicacao.service.ts:33`) e `erro` não têm teste, e a tabela de Mutações não tem linha para eles. Basta conferir a métrica no teste do 503 que já existe (`salas-reivindicar.int.test.ts:837`).
- **`main.ts`:** a ligação do seguro da sala em `limite.seguro_ativo` não tem teste. Está declarada, e o login tem a mesma lacuna. Extrair a lista de fontes para uma função testável fecha as duas.
- **`cenarios.md:318`** ainda chama o L7 de "(integração)". A divergência para unidade está só no `7_task.md`, e deveria ir também para o `cenarios.md`, como as outras.
- **Log, L3 (`limites-da-sala.int.test.ts:283`):** a lista do que não pode aparecer na linha não inclui matrícula nem nome. O `toEqual` estrito do teste de unidade (`limites-da-sala.test.ts:143`) já cobre, mas pôr os dois na lista deixa o A4 explícito também na aplicação montada.
- **Log com duas instâncias da API:** a linha única por janela vale entre instâncias porque a marca mora no Redis, mas nenhum teste roda o limite nas duas instâncias ao mesmo tempo e conta as linhas.

Arquivos citados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/reivindicacao.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/limites-da-sala.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/limites-da-sala.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/salas-reivindicar.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md

## test-engineer · 2ª rodada · APROVADO · 2026-09-27 00:32:42 · `tasks/prd-apresentacao-escola/7_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os da 1ª rodada: I10, L1 a L8, L4b, L6b, C1, C2, E21, E30, o `Retry-After` no nome, as métricas sem escola e o log A4. Somam-se os dois que exigi na 1ª rodada: várias matrículas erradas em paralelo no mesmo nome livre, e a certa no meio do lote gravando `teve_matricula_errada = true`.

**Cobertos:** todos. A correção exigida foi feita.

- **O teto do nome agora vale em paralelo.** Em `apps/api/src/sala/limites-da-sala.ts:124`, a matrícula errada soma no nome antes do hash, com o `SCRIPT_SOMAR` atômico (INCR). A decisão em `:127-128` usa o valor que essa soma devolveu, e não uma leitura anterior. A janela é fixa: o PEXPIRE só roda no valor 1, então as erradas somadas acima do teto não esticam o travamento.
- **Os testes do paralelo existem.**
  - "L4, em paralelo" (`apps/api/test/limites-da-sala.int.test.ts:178`): 10 chamadas em `Promise.all` dão 5 `RECUSADA`, 5 `LIMITE_EXCEDIDO`, 5 hashes e o contador em 10. Depois disso, a matrícula certa continua travada.
  - "nome, em paralelo" (`apps/api/src/sala/limites-da-sala.test.ts:111`): o mesmo, como unidade.
- **A marca do E30 é lida depois do hash.** A leitura está em `apps/api/src/sala/reivindicacao.service.ts:109`, e o teste é "E30, em paralelo" (`limites-da-sala.int.test.ts:193`). Um portão segura o hash da certa, três erradas chegam e somam 3, e o pedido grava `true`. O teste é mais forte que a variante que pedi: garante que as erradas chegam enquanto o hash da certa está em andamento, em vez de depender da sorte do `Promise.all`.

**Mutações que rodei** (nos dois casos o arquivo voltou idêntico, conferido com `cmp`):

1. **A marca lida antes do hash** (`reivindicacao.service.ts:108-109` trocados): o "E30, em paralelo" fica vermelho, e o pedido grava `false`.
2. **"Verifica e depois grava" de volta** (`limites-da-sala.ts:124-127`: leitura, decisão sobre o valor lido e soma depois): o "nome, em paralelo" da unidade fica vermelho, e o "L4, em paralelo" da integração também (esperava o contador em 10, e ele ficou em 5).

A tabela de Mutações do `7_task.md` tem uma linha para cada cláusula que mudou: `:124`, `:127`, `:142`, `service:106/109` e `lista-livre:92-97`. As linhas `:92` e `:93` estão declaradas como segunda camada, com o mesmo motivo do `tomar` da 6.0.

O teste de unidade do serviço (`reivindicacao.service.test.ts`) confere a ordem nova dos passos com `toEqual` estrito. Ele também confere que o nome travado sai com `LIMITE_EXCEDIDO` antes do hash, e que o 4º argumento vai `true` na errada e `false` na criada.

As recomendações da 1ª rodada foram aplicadas, ou recusadas com motivo em "Recomendações sem aplicar". Nenhuma bloqueava.

Não achei `.skip`, `.only`, `any` nem mock que esconda a regra.

**Bloqueantes:** nenhum.

**Recomendações:**
- **Uma errada ainda pode escapar da marca do E30.** Uma errada que faça a leitura do nome livre depois que a certa leu a marca (`reivindicacao.service.ts:109`), mas antes do commit da transação, não entra na marca. A janela é curta e a situação é mais "depois" do que "junto", então dá para aceitar. Vale uma linha no E30 do `cenarios.md` ou na §5 da `techspec.md`: a marca conta as erradas que somaram até o fim do hash da certa.
- **No "L4, em paralelo" de integração, a divisão 5 e 5 não pega sozinha o "verifica e depois grava".** Na mutação 2, a divisão passou mesmo assim: os pedidos acabam em sequência no Redis local. Quem detecta é a asserção do contador em 10, e a prova de atomicidade de verdade fica com a unidade. Um comentário no teste dizendo isso evita que alguém tire essa asserção achando que é redundante.
- **A errada agora conta no nome antes do semáforo.** Se ela sai com 503 pelo prazo do semáforo, contou sem hash. É o lado conservador (o atacante não ganha tentativa), mas o aluno que errou e pegou 503 também gasta uma das 5. Vale uma linha no L4 ou no L9 do `cenarios.md`.

**Arquivos auditados:**
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/reivindicacao.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/limites-da-sala.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/lista-livre.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/limites-da-sala.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/reivindicacao.service.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/limites-da-sala.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/7_task.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-27 00:34:26 · `tasks/prd-apresentacao-escola/7_task.md`

VEREDITO: APROVADO

A tarefa 7.0 cria três contadores de tentativas erradas na página pública da sala (por escola, por nome e por turma), duas métricas e uma linha de log. Não encontrei nenhum bloqueante. Não rodei os testes: a conclusão vem da leitura do código e dos testes.

Campos pessoais tocados:
- **Contador de matrícula errada por nome.** A chave no Redis é o HMAC do id do acesso e do id da linha da lista, e dura 10 minutos. Os contadores de escola e de turma e a marca "o log já saiu nesta janela" usam HMAC de ids que não identificam pessoa.
- **`teve_matricula_errada` do pedido**, que passa a ser lido desse contador. É só sim ou não; o campo já existia na tabela.
- **O id do acesso** passa a sair da busca da sala (`resolucao-de-tenant.repository.ts:513`). Ele fica só no servidor e não entra na resposta, que continua passando pelos esquemas de `@educa/shared`.

Fora da tabela de dados do docs/lgpd.md: nada. As linhas "Contadores da sala" e "Reivindicação" já cobrem o que a tarefa cria, e a primeira foi atualizada com a marca do log e o que o log leva.

Autorização por objeto: ok.
- O acesso é buscado dentro da escola do slug. A leitura do nome livre (`lista-livre.repository.ts:199`) usa a escola e o ano do contexto e a turma do próprio acesso.
- Trocando o nome por um de outra turma ou de outra escola, a resposta é sempre a mesma recusa e nenhuma chave é criada (teste I10).
- O nome travado não revela nada além do que a página já mostra: os nomes livres aparecem na página, e as respostas "enviado" e "recusada" já diziam se a matrícula estava certa.
- Slug inexistente e código errado respondem o mesmo "não encontrado".

Logs: limpos.
- A única linha nova com campos é `sala.limite_atingido` (`limites-da-sala.ts:159`), com o evento, o tipo e o id da escola. O logger acrescenta o id da requisição, sem IP.
- O aviso `sala.limite_no_seguro` é um evento fixo, sem dado.
- O teste de integração (`limites-da-sala.int.test.ts:326`) confere que a linha não tem IP, código, slug, token, senha, nome nem matrícula. O teste de unidade confere a linha exata para dois tipos e duas escolas.

Auditoria: não se aplica. A tarefa não tem leitura por coordenação ou rede, exportação, alteração de nota ou de permissão, nem aprovação de saída de IA. Ela também não grava nada no banco além da marca do pedido.

Envio externo: nenhum. Não há IA nem terceiro envolvidos; as duas métricas não levam escola, e há teste disso (`metricas.test.ts` e `limites-da-sala.int.test.ts:448`).

Seed/fixture: sintético. `apps/api/test/sala-de-teste.ts` gera nomes e matrículas no próprio teste (`Aluno N <uuid>`, `sala-<uuid>-N`), e a senha é inventada.

Pergunta de fechamento: o código responde. Os contadores duram 10 minutos, com chave HMAC e sem nome nem matrícula, e estão documentados na tabela. O que fica sobre o aluno é o sim ou não do pedido pendente, que está no banco e é apagado na decisão.

Bloqueantes: nenhum.

Recomendações:
1. **`docs/lgpd.md:73`**: a linha "Reivindicação" diz que a marca registra tentativa com matrícula errada "antes do pedido". Pelo `reivindicacao.service.ts:380`, a marca é lida depois do hash, então conta também as erradas que chegaram enquanto o hash rodava. A descrição da E30 no `cenarios.md` já explica isso; alinhar o texto do mapa de dados para não haver divergência numa auditoria.
2. **`limites-da-sala.int.test.ts:326`**: a checagem de "nada de IP, código, matrícula nem nome" com a API montada cobre só a linha do tipo `escola`. Os tipos `nome` e `turma` estão provados só pelo teste de unidade. Estender o laço aos dois reforça a prova com o logger real.
3. **Para o `/retro`**: qualquer pessoa com o link da turma consegue travar um nome por 10 minutos com cinco matrículas erradas. Isso é previsto (o "Gerar novo" destrava) e não é vazamento, mas vale entrar no texto de ajuda da 17.0 e no runbook da 9.0.

Arquivos principais auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/limites-da-sala.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/reivindicacao.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/lista-livre.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/acesso-da-sala.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/contador-em-janela.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/limites-da-sala.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sala-de-teste.ts`

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-27 00:34:43 · `tasks/prd-apresentacao-escola/7_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova e nenhuma migration. A `reivindicacao` só passou a gravar `teve_matricula_errada` a partir do contador. Esse contador tem a chave HMAC de `acessoId|listaNomeId`, e os dois ids saem do banco. A `lista_nome` tem FK composta `(escola_id, ano_letivo_id, turma_id)` para `turma` (`packages/nucleo/src/db/schema/lista-nome.ts:49`). Os três contadores ficam no Redis com chave HMAC do UUID: escola pelo slug, nome por acesso e linha da lista, turma pela linha do acesso. O aviso do log usa `tipo|escolaId`. Nenhum desses UUIDs vem do corpo do pedido.

Queries verificadas:
- `apps/api/src/sala/lista-livre.repository.ts:86` (`livreComOutraMatricula`): escola e ano vêm do contexto, e a turma vem da linha do acesso. Do cliente vêm só `listaNomeId` e `matricula`, que são o alvo do pedido e não definem o escopo.
- `apps/api/src/sessao/resolucao-de-tenant.repository.ts:513` (`#acessoDaSala`): passou a devolver também o `acessoId`, tirado da linha. As duas justificativas de `@SemEscopo` foram atualizadas.
- `apps/api/src/sessao/acesso-da-sala.ts:52` (`#peloCodigo`): usa o `escolaPorSlug` que já existia (`resolucao-de-tenant.repository.ts:446`, com `@SemEscopo` e justificativa). Não há `@SemEscopo` novo. A escola usada no contador é a do slug, e a busca do acesso continua conferida contra essa escola no mesmo comando.
- `apps/api/src/sala/reivindicacao.service.ts:98-125`: `escolaId`, `turmaId` e `acessoId` saem só do acesso achado. O schema do pedido não mudou, e nenhum endpoint passou a aceitar `escolaId`.
- A resposta é a mesma para o nome de outra turma, de outra escola ou inexistente: `REIVINDICACAO_RECUSADA`. Esses nomes nunca travam, e por isso o `LIMITE_EXCEDIDO` não revela que eles existem. Só trava o nome livre da turma do acesso, que a própria página já mostra.
- As métricas novas não têm rótulo de escola. O `escolaId` aparece só no log de operação.

Teste de isolamento: presente e efetivo.
- I10 (`apps/api/test/limites-da-sala.int.test.ts:116`): pelo acesso de T1, testa um nome de T2, um da escola B e um UUID aleatório. Dá 21 respostas idênticas, nenhuma chave de nome e 21 somas só na turma. Sem a cláusula `turmaId` da leitura (`lista-livre.repository.ts:94`), o nome de T2 passaria a somar e travar, e o teste quebra (confirmado na tabela de mutações).
- L3 (`:287`): a escola B, do mesmo IP, abre sem espera. Sem a escola na chave, o teste quebra.
- As cláusulas de escola e ano na `livreComOutraMatricula` sozinhas não quebram teste nenhum. Isso é aceitável: a FK composta torna as duas redundantes com a turma, que vem da linha do acesso.

Bloqueantes: nenhum.

Recomendações:
- `apps/api/src/sessao/acesso-da-sala.ts:54`: quem conhece o slug de uma escola percebe pelo tempo de resposta (a espera de 1 s) que ela está acima do teto de códigos errados. Não expõe dado de pessoa. Vale registrar como risco aceito na seção 7c da techspec, para não voltar como achado.
- Anotar no comentário de `livreComOutraMatricula` que escola e ano são segunda camada, porque a FK composta garante a turma. O mesmo raciocínio já vale para o `tomar` da 6.0 e hoje só está registrado na tabela de mutações do `7_task.md`.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-27 00:34:47 · `tasks/prd-apresentacao-escola/7_task.md`

```
VEREDITO: APROVADO
Caminho quente tocado: sala
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/limites-da-sala.ts:128 com /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/limite/chaves.ts:80. Com o Redis de fila fora, o teto do nome vira max(1, floor(5 / instâncias)). Com 3 ou mais instâncias o teto cai para 1, e uma única matrícula digitada errado trava o nome por 10 min, inclusive para a matrícula certa. Às 7h30, com o Redis fora, isso vira fila de aluno no professor. Isto segue a spec (L7). Levar ao /retro ou à 9.0: um piso próprio para o teto do nome no seguro (por exemplo, nunca abaixo de 3), ou o runbook do `seguro-limite-ativo` citando o efeito na sala.
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/limites-da-sala.ts:95. O `esperandoOCodigo` só é lido no teste. Exportar como gauge por instância na 9.0, junto com o alerta, mostra o acúmulo na espera de 1 s sem depender da taxa de `sala.limite_atingido{tipo="escola"}`.
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/limites-da-sala.ts:99-107. Cerca de 100 códigos errados por minuto, vindos de IPs espalhados, bastam para manter a espera de 1 s em toda entrada pelo código daquela escola. A escola não fica trancada, só mais lenta, como a spec prevê. O alerta e o `ops:revogar-acessos-sala` da 9.0 são a resposta a isso, e o parágrafo do runbook deve dizer que a lentidão continua enquanto o slug for alvo.
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/main.ts:27. A ligação do `LimitesDaSala` ao `limite.seguro_ativo` não tem teste. Já está registrado para o /retro.
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/reivindicacao.service.ts:347. A marca `teveMatriculaErrada` é lida depois do hash. Uma matrícula errada que chegue entre essa leitura e o commit escapa da marca. Hoje a marca só informa, e isso já está no E30 do cenarios.md. Voltar ao ponto se a marca passar a pesar na decisão da 8.0.
```

## revisor-geral · 1ª rodada · APROVADO · 2026-09-27 00:35:01 · `tasks/prd-apresentacao-escola/7_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. Cada divergência (escola lida pelo slug antes da busca, `acessoId` no `AcessoDaSalaAchado`, soma atômica antes do hash, leitura que confere a matrícula diferente, "acima" contado a partir do teto, log pelo logger do processo, `chaves.ts` intocado, L5 com 38 nomes, L7 e L8 como teste de unidade) está registrada em `techspec.md` (seções 5, 6 e 7c) e em `cenarios.md`.
Portão local: carimbo válido para typecheck, lint e test. O `conferir` pede `--infra`, que por decisão do Joaquim roda só no portão final, antes do commit. Sem `--infra` o commit fica bloqueado.
Bloqueantes: nenhum

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md:315`: o L6, escrito nesta tarefa, diz "porque a leitura depois da volta atrás confere também a matrícula". Isso contradiz o passo 5 da techspec e o I10, que agora dizem "antes do hash". Troque para "a leitura antes do hash".
2. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/app.module.ts:52-55`: o JSDoc começa com "o `main.ts` passa o `logger`" e termina com "o `main.ts` monta sem opção". A frase final ficou velha e precisa ser corrigida.
3. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/limites-da-sala.ts:95`: o `esperandoOCodigo` é código de produção lido só pelo teste do L3. Uma saída é torná-lo gauge de métrica e dar uso real a ele. A outra é anotar que ele existe para o teste.
4. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/limites-da-sala.ts:99` e `acesso-da-sala.ts:57-59`: no teto da escola a checagem ainda é "lê e depois soma" (`GET` em `antesDaBusca`, `INCR` em `codigoErrado`). Uma rajada em paralelo passa do teto de 1.000 pelo tanto de pedidos em voo. E a espera de 1 s não reduz a vazão de um atacante que manda pedidos em paralelo, porque quem limita a vazão é só o `rl:ip`. Como teto brando isso é aceitável, mas vale uma linha na seção 7c. Assim a 9.0 (alerta) parte sabendo que a espera atrasa cada tentativa e não limita o volume. A área é do `infra-guardian`.
5. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/limites-da-sala.ts:25-28`: a mesma classe loga por dois caminhos, o `Logger` do Nest para o seguro e o `LoggerBase` para `sala.limite_atingido`. A razão está documentada. Se o logger do processo já é injetado, o aviso do seguro podia sair por ele também.

## test-engineer · 3ª rodada · APROVADO · 2026-09-27 00:46:54 · `tasks/prd-apresentacao-escola/7_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** esta é a 3ª rodada. Olhei só o diff do lote de recomendações:
- a nota no "L4, em paralelo";
- a checagem da linha `sala.limite_atingido` no L4 (tipo `nome`) e no L5 (tipo `turma`);
- os comentários em `app.module.ts`, `limites-da-sala.ts` e `lista-livre.repository.ts`;
- os textos de L6, E30 e L4 em `cenarios.md` e o 7c da `techspec.md`.

Os cenários da tarefa 7.0 são os mesmos já aprovados na 2ª rodada.

**Cobertos:**
- **L4** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/limites-da-sala.int.test.ts:167-171`): o contador sobe 2 (a errada e a certa travadas) e o log tem exatamente uma linha dessa escola. Isso prova que a linha sai uma vez só por janela.
  - O teste compara a lista inteira, então falha em três situações: se a linha deixar de sair, se sair com outro `tipo` ou se sair uma vez por pedido.
  - Também confere que não aparecem nome, matrícula, código nem slug. Como o filtro é por `escolaId`, e cada teste monta a sua escola, não pega linha de outro teste, mesmo com o `linhasDeLog` acumulando.
- **L5** (`:372-375`): a mesma prova para `tipo: 'turma'`. Aqui a métrica sobe 1 e o log tem uma linha.
- **L4, em paralelo** (`:192-195`): o comentário novo está certo. Quem pega o "lê e depois soma" é a asserção `nome` igual a 10 (as seguradas também somam), e a atomicidade de verdade continua no teste de unidade "nome, em paralelo". A asserção não mudou.
- **Textos**: o que os docs dizem bate com o que os testes provam.
  - "antes do hash" em `cenarios.md:57,302,315` e em `techspec.md:118`: o L6 prova com o E21, em que o pedido pelo acesso de T2 soma só na turma de T2.
  - Nota do E30: o teste parado no meio do hash (`:199-225`) prova.
- **Comentários de código**: não mudam comportamento e não pedem teste novo.
- **Proibidos**: não há `.skip`, `.only` nem `it.todo` nos arquivos de teste da tarefa. Nenhum mock nosso esconde a regra: o espião do `somar`, do `executar` e do `gerar` chama a função real.

**Bloqueantes:** nenhum.

**Recomendações:**
- `limites-da-sala.int.test.ts:109`: `linhasDeLog` só é zerado no L3, então nas outras linhas o isolamento entre testes depende do filtro por `escolaId`. Hoje está correto. Zerar no `beforeEach` deixaria isso explícito e evitaria confusão se um teste futuro montar a escola antes de outro terminar.

## test-engineer · 4ª rodada · APROVADO · 2026-09-27 00:47:47 · `tasks/prd-apresentacao-escola/7_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 3ª rodada. Esta rodada só audita o que mudou desde ela: a limpeza do log no `beforeEach` e a linha nova na tabela de recomendações.

Cobertos:
- **A limpeza do log está correta.** O `beforeEach` de `apps/api/test/limites-da-sala.int.test.ts:82-86` usa `linhasDeLog.length = 0`, que esvazia o array sem criar outro. O logger da API recebeu esse mesmo array no `beforeAll` (linha 74), então ele continua escrevendo nele depois da limpeza.
- **As três leituras do log ficaram mais fortes, e nenhuma ficou mais fraca.**
  - L4 (linha 171) e L5 (linha 375) continuam com o filtro por `escolaId`, agora como segunda proteção contra log atrasado de outro teste.
  - L3 (linhas 303 e 330) já zerava o log dentro do próprio teste e continua igual.
- **As asserções pegam uma linha a mais ou a menos.** L4 e L5 usam `toEqual([...])` com um elemento só, e L3 usa `toHaveLength(1)`. Se a regra que emite o log for removida, os três falham. Se ela passar a emitir linha repetida, os três também falham.
- **A tabela de recomendações foi atualizada.** Em `tasks/prd-apresentacao-escola/7_task.md:232` está a linha "`test-engineer`, 3ª ... aplicada", e ela confere com o diff.
- Não há `.skip`, teste comentado nem mock novo.

Bloqueantes: nenhum.

Recomendações:
- **Ordem da tabela** em `tasks/prd-apresentacao-escola/7_task.md:232-233`: a linha da 3ª rodada ficou antes de uma linha da 1ª rodada do `test-engineer` (a de "contar as linhas do log com duas instâncias"). Mover a linha da 3ª para o fim da tabela deixa as rodadas em ordem. É só organização.
