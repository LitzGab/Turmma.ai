# Achados das revisões — `tasks/correcoes/2026-10-09-vigencia-anterior-a-escola.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-09 13:34:47 · `tasks/correcoes/2026-10-09-vigencia-anterior-a-escola.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- Caminho feliz: um "todas" vigente cadastrado antes da escola começa, para ela, no `criada_em` dela.
- Uma empresa "todas" encerrada antes de a escola existir não aparece para ela.
- A escola que nasceu no meio da vigência vê a empresa como passada, a partir do dia em que passou a existir.
- A escola mais antiga que a empresa vê a vigência da própria empresa.
- Borda: fim igual ao `criada_em` fica fora; um segundo depois aparece.
- Com ligação ("lista") nada muda, nem o início nem a presença da linha.
- Isolamento: a mesma empresa dá resultados diferentes para escolas diferentes, e o `criada_em` usado é o da escola do token.
- O `criada_em` é preenchido pelo banco, na mesma transação da auditoria `escola.criada`.
- O leitor não passa a ler outra tabela além de `escola` e `suboperador`.
- A carga inicial (backfill) da migration para as escolas que já existem.

**Cobertos:**
- O `greatest` do início: o caso da escola nova lê `dias(-10)` e não `-30`.
- O filtro `gt(fim, criada_em)`: a escola nova recebe `[]`, e a borda do fim igual também.
- O `isNull(fim)`: se for removido, some a linha do "todas" vigente e o teste falha.
- O `innerJoin` pela escola do contexto: um join sem condição duplicaria as linhas, e o `toEqual` de um elemento quebra.
- O isolamento: três escolas com `criada_em` diferentes leem a mesma chave com resultados diferentes.
- O preenchimento pelo banco e a transação única: em `ops-escola.int.test.ts`, o `criada_em` fica entre o antes e o depois e é igual ao `em` da auditoria.
- O teste de arquitetura dos imports por caminho relativo.
- Os dois testes antigos foram ajustados com `definirCriadaEm` e continuam provando o que provavam.
- O `case ... else suboperador.inicio` para "lista" não é observável, porque o `inicioDaLigacao ??` sempre vence. É uma mutação equivalente e não precisa de teste.
- Não há `.skip`, nem mock da regra, nem chamada a provedor de IA.
- Concorrência não se aplica: o `default now()` vem do banco.

**Bloqueantes:**
- `packages/nucleo/src/titular/suboperador-da-escola.repository.ts:81`: a cláusula `ne(suboperador.alcance, 'todas')` é o que garante "com ligação nada muda" no filtro, e nenhum teste falha se ela for removida.
  - O trecho "lista" de `apps/api/test/suboperador.int.test.ts:401-404` muda só o `inicio` e o `fim` da **ligação**. O `suboperador.fim` continua nulo, então a linha passa pelo `isNull(fim)` com ou sem o `ne`.
  - O próprio teste já monta de propósito uma escola "mais nova" que a ligação, mas não chega ao único trecho novo que afeta o "lista".
  - Correção exigida: no mesmo trecho, gravar também `update suboperador set fim = dias(-12) where id = $1`, que fica antes do `criada_em` `dias(-10)` da escola `nova`.
  - Depois, afirmar que a leitura continua devolvendo a linha com `{ inicio: dias(-20), fim: dias(-15) }`, que é o `fim` mais cedo entre os dois.
  - Sem o `ne`, a linha some e o teste falha.

**Recomendações:**
- O `update` da migration `packages/nucleo/drizzle/0030_escola_criada_em.sql` só foi conferido à mão. Fica registrado para o `/validar` que a regra 80, item 9 (expandir, migrar, contrair) não tem prova automatizada da carga inicial. Pode ser um teste que aplica o SQL do `update` sobre uma escola com `criada_em` alterado e uma auditoria `escola.criada` antiga, e confere o resultado.
- `apps/api/test/arquitetura.test.ts:396`: a regex só pega import relativo `../db/schema/<x>`. Se um dia alguém importar por `@educa/nucleo` ou por um barrel, ela não enxerga. Vale um comentário dizendo esse limite, ou ampliar a regex.
- O nome do segundo caso novo junta duas regras ("todas" vigente e "lista" não muda). Separar o "lista" num `it` próprio deixaria a falha mais legível, principalmente depois da correção acima.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/correcoes/2026-10-09-vigencia-anterior-a-escola.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/suboperador-da-escola.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/suboperador.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/ops-escola.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/arquitetura.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0030_escola_criada_em.sql

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-09 13:35:26 · `tasks/correcoes/2026-10-09-vigencia-anterior-a-escola.md`

VEREDITO: APROVADO

Tabelas verificadas: `escola`, que ganha `criada_em` (`packages/nucleo/src/db/schema/escola.ts:37`, `packages/nucleo/drizzle/0030_escola_criada_em.sql`). É a própria tabela do tenant, então não cabe `escolaId` nela nem `anoLetivoId`. Os ids continuam UUID e a correção não cria tabela nova. `suboperador` e `suboperador_escola` não mudam de estrutura.

Queries verificadas:
- `SuboperadorDaEscolaRepository.daEscola` (`packages/nucleo/src/titular/suboperador-da-escola.repository.ts:52-84`). O `escolaId` vem de `exigirEscolaDoContexto()`, que falha fechada quando a sessão não tem escola. O `innerJoin(escola, eq(escola.id, escolaId))` amarra a linha da `escola` só ao contexto, e se a escola do contexto não existir a consulta não devolve nada. A ligação e o `exists` continuam presos ao `escolaId` do contexto. O filtro novo entra num `and` junto com o escopo, sem afrouxá-lo. Nenhum parâmetro do cliente decide o que se lê.
- O `UPDATE` da migration percorre todas as escolas sem escopo. É migration, não repository, então a regra 10 não se aplica a ele e ele não precisa de `@SemEscopo()`.
- Procurei quem lê a `escola` em `apps/api/src` e `packages/nucleo/src`. Todos selecionam colunas explícitas, então `criada_em` não vaza para nenhum DTO.
- A correção não toca endpoint, mensagem de erro, camada de rede nem `@SemEscopo()`.

Teste de isolamento: presente e efetivo.
- O `RF7, isolamento` (`apps/api/test/suboperador.int.test.ts:292`) continua valendo.
- Os três casos novos (`suboperador.int.test.ts:376-421`) leem o mesmo suboperador de "todas" a partir de escolas com `criada_em` diferentes e esperam resultados diferentes.
- Fiz a conta tirando cada condição do código. Se o join com a `escola` perder a condição do contexto, as linhas se multiplicam e o resultado mistura as datas de outras escolas, e os casos novos e o de isolamento quebram. Se o `escolaId` não vier do contexto, a escola que nasceu depois da vigência deixa de receber `[]` e o caso quebra.
- O teste de arquitetura (`apps/api/test/arquitetura.test.ts:394-397`) fixa os schemas que esse repositório importa em `escola` e `suboperador`. Uma tabela nova entrando nessa leitura quebra o teste.

Bloqueantes: nenhum.

Recomendações:
- No modelo de dados e no comentário do schema, dizer que `criada_em` não pode ser alterada por nenhum caminho da API. Hoje isso só vale por convenção, porque nenhum repository a escreve. Um teste de arquitetura que procure escrita em `escola.criadaEm` fora da migration deixaria a regra provada por teste.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-09 13:35:30 · `tasks/correcoes/2026-10-09-vigencia-anterior-a-escola.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A única coluna nova é `escola.criada_em` (`timestamptz not null default now()`). Ela não é dado de pessoa: a tabela `escola` já está como `SEM_PESSOA` em `packages/shared/src/privacidade/classificacao.ts:92`, e o snapshot `0030` acrescenta só essa coluna.

Fora da tabela de dados do docs/lgpd.md: nada. Como a coluna não é de pessoa, ela não entra no mapa de dados. O registro dela está em `docs/modelo-de-dados.md`, o que basta.

Autorização por objeto: ok.
- Em `packages/nucleo/src/titular/suboperador-da-escola.repository.ts:67`, a `escola` entra no join por `eq(escola.id, escolaId)`, com o `escolaId` tirado de `exigirEscolaDoContexto()`. Nenhum argumento do cliente define esse id. Trocar o id na URL não leva à `criada_em` de outra escola.
- A ligação (`ligacao.escolaId`) e o `exists` continuam presos ao contexto.
- O novo filtro entra num `and` junto com o `or` do escopo. Ele não abre nada que antes estava fechado: só tira linhas da resposta.
- O DTO continua explícito, com os mesmos campos (linhas 84–94). O `inicio` passa a poder ser a data de criação da própria escola, que é dado da escola e não de pessoa, e vai só para a coordenação dela.

Logs: limpos. A correção não acrescenta nenhum log.

Auditoria: presente onde precisa.
- A correção não cria nenhuma ação que a regra 20, item 10, mande auditar.
- O `update` da migration só lê a auditoria `escola.criada` para preencher a coluna e não a altera.
- O teste de `apps/api/test/ops-escola.int.test.ts` prova que `criada_em` é igual ao `em` dessa auditoria.

Envio externo: nenhum. Não há mudança em envio para provedor de IA nem em `ExecucaoAgente`.

Seed/fixture: sintético.
- Os testes usam `nomeNovo()`, `chaveNova()` e "Colégio Sintético Horizonte", com datas relativas.
- A migration só copia uma data entre colunas do próprio banco e não traz dado novo.

Pergunta de fechamento: a correção deixa a lista de compartilhamento (regra 20, item 19) mais certa. A escola deixa de dizer ao titular que uma empresa recebeu dado dela quando essa empresa saiu antes de a escola existir. A correção não piora nenhum ponto da resposta sobre o que o sistema guarda de um aluno e para onde enviou.

Bloqueantes: nenhum.

Recomendações:
- O `update` da migration `packages/nucleo/drizzle/0030_escola_criada_em.sql` não tem teste automatizado. A tarefa declara que foi conferido à mão numa transação desfeita. Não bloqueia, porque não há dado real nem staging. Antes do piloto, porém, vale ter um teste que aplique a migration num banco com escolas pré-existentes. Fica para o `/validar` ou o `/retro`.
- O comentário da classe no repositório pede que "todo método de leitura que este repositório ganhar aplica a mesma regra". Hoje nada garante isso. Se surgir um segundo método de leitura, vale pôr o filtro de vigência num helper único e cobri-lo pelo teste de arquitetura.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-09 13:35:33 · `tasks/correcoes/2026-10-09-vigencia-anterior-a-escola.md`

VEREDITO: APROVADO
Caminho quente tocado: migration
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok
Bloqueantes: nenhum

Pontos conferidos:
- **Migration** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0030_escola_criada_em.sql`): só acrescenta. O `ADD COLUMN ... DEFAULT now() NOT NULL` não reescreve a tabela, porque `now()` não é volátil e o Postgres 11 em diante grava o valor uma vez só. O `UPDATE` corre sobre `escola`, que tem no máximo dez linhas no primeiro ano. Para achar a data, a subconsulta usa o `auditoria_escola_em_idx (escola_id, em)` que já existe (criado em `0004`). O código anterior continua funcionando: todo `insert` em `escola`, inclusive o SQL cru dos testes, recebe o valor padrão, e toda leitura de `escola` pede as colunas pelo nome, então nenhuma serializa a linha inteira. O snapshot `0030` vem logo depois do `0029`, porque o `prevId` bate, e só a tabela `public.escola` mudou.
- **Query** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/suboperador-da-escola.repository.ts`): junta a escola por chave primária, uma linha só, presa ao contexto. A comparação acontece no banco. A tabela `suboperador` é global e pequena, e esta leitura não está no caminho quente da sala, da prova ou do tutor.
- **Concorrência:** não há caminho novo de escrita. A coluna é preenchida pelo banco, na mesma transação que grava a auditoria `escola.criada`, e o `ops-escola.int.test.ts` prova isso.
- **Métrica:** a aba "Empresas que recebem dados" não está no caminho quente, então não precisa medir latência nem ganhar alerta.

Recomendações:
- O `UPDATE` que preenche as escolas existentes não tem teste automatizado; foi conferido só à mão, numa transação desfeita. Um caso no `packages/nucleo/src/db/migrar.int.test.ts` poderia aplicar a migration sobre uma escola com auditoria `escola.criada` e outra sem, e conferir as duas datas. Fica registrado para o `/validar`.
- No repositório, o `orderBy(desc(suboperador.inicio))` ordena pelo início da empresa, mas a escola lê o início ajustado pelo `greatest`. O resultado é o mesmo, porque o ajuste não muda a ordem. Um comentário de uma linha evita que alguém troque a ordem achando que está errada.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-09 13:35:37 · `tasks/correcoes/2026-10-09-vigencia-anterior-a-escola.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A regra "a vigência nunca é anterior à escola" está registrada na `techspec.md`, seção 6 (linhas 387-412, além da 114), e no `cenarios.md`, RF7 (linhas 130-150), pelo commit `6a4a813`. A coluna, a migration só de expansão, o `greatest`/`fim <= criada_em` limitado ao `todas`, o filtro dentro do `and` com o escopo entre parênteses e o teste de arquitetura dos imports seguem o desenho.
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)

Bloqueantes:
- **O "lista" não está protegido no filtro novo.** Em `packages/nucleo/src/titular/suboperador-da-escola.repository.ts:81`, a cláusula `ne(suboperador.alcance, 'todas')` é a única coisa que garante que uma empresa com ligação nunca seja escondida pelo filtro novo. Nenhum teste falha se ela for removida.
  - O trecho do "lista" em `apps/api/test/suboperador.int.test.ts:401-405` muda só `suboperador_escola.inicio/fim`. O `suboperador.fim` continua nulo, então a linha passa pelo `isNull(suboperador.fim)` com ou sem o `ne`.
  - O `test-engineer` apontou isso na 1ª rodada (REPROVADO, 13:34:47, em `tasks/correcoes/achados/2026-10-09-vigencia-anterior-a-escola.md`). A árvore atual não tem a correção e não há 2ª rodada aprovada dele na tabela de Revisões. Fica falhando a regra 40: se a regra for apagada, o teste precisa falhar.
  - Correção exigida, no mesmo trecho:
    1. Gravar `update suboperador set fim = <dias(-12)> where id = $1`, um fim anterior ao `criada_em` (`dias(-10)`) da escola `nova`.
    2. Afirmar que a leitura continua devolvendo a linha com `{ inicio: dias(-20), fim: dias(-15) }`, que é o fim mais cedo entre os dois.
    3. Depois disso, rodar de novo o `test-engineer` e o portão da tarefa.

Recomendações:
- Separar o caso "o lista não muda" num `it` próprio (`apps/api/test/suboperador.int.test.ts:391`). Hoje o nome junta duas regras, e a falha fica ambígua.
- Em `apps/api/test/arquitetura.test.ts:396`, a regex só enxerga import relativo `../db/schema/<x>`. Vale dizer esse limite no comentário, ou ampliar a regex para import por pacote ou barrel.
- Em `docs/modelo-de-dados.md:600`, a linha alterada passou da largura de quebra do resto do parágrafo. É só formatação.
- O backfill da `0030_escola_criada_em.sql` só foi conferido à mão. Isso já está declarado na correção e no `cenarios.md`, e fica para o `/validar`.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/suboperador-da-escola.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/suboperador.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/correcoes/achados/2026-10-09-vigencia-anterior-a-escola.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-09 13:39:36 · `tasks/correcoes/2026-10-09-vigencia-anterior-a-escola.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Correção da 1ª rodada.** A cláusula `ne(suboperador.alcance, 'todas')` tinha de ser provada por um caso do "lista" em que o `fim` do suboperador é anterior ao `criada_em` da escola.
- **"Todas" encerrado antes, durante e depois da criação da escola.** Escola antiga vê a empresa como passada. Escola nova não a vê. Escola criada no meio lê a vigência a partir do próprio `criada_em`.
- **"Todas" ainda vigente** com escola mais antiga e mais nova que a empresa.
- **Borda do instante igual.** `fim` igual ao `criada_em` não aparece. Com o `criada_em` um segundo antes do `fim`, aparece como passado.
- **Isolamento e arquitetura.** O leitor só importa os schemas `escola` e `suboperador` e não escreve.
- **Testes antigos ajustados.** O caso do `RF7, passado` e o da ordem tiveram a data de criação da escola fixada, para que a regra nova não esconda as linhas deles.

**Cobertos:**
- A correção exigida foi feita, num `it` próprio, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/suboperador.int.test.ts`. O teste grava `suboperador.fim = dias(-12)` com a escola criada em `dias(-10)` e afirma `[{ inicio: dias(-20), fim: dias(-15) }]`.
- Conferi a mutação contra `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/suboperador-da-escola.repository.ts`, sem rodar o teste. Sem o `ne`, a condição que sobra é `or(isNull(fim), gt(fim, criadaEm))`. Com fim em -12 e criação em -10, ela dá falso, a linha some e o `toEqual` fica vermelho.
- A seção "Mutações" do documento da correção registra a mesma mutação, com o resultado vermelho e a volta ao verde.
- A vigência ajustada respeita `suboperador_vigencia_ordenada`: início em -30, fim em -12.
- O fim mais cedo entre a ligação (-15) e a empresa (-12) continua provado: a asserção espera -15.
- Tirar o `encerrar` final não deixa resto que atrapalhe: o suboperador já fica encerrado em -12 e a chave é nova a cada teste.
- As duas recomendações que a Mesa mandou aplicar foram aplicadas. O "lista" ganhou `it` próprio, e o limite da regex está comentado em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/arquitetura.test.ts`.
- O resto do diff é comentário e quebra de linha, sem efeito no comportamento.
- Sem `.skip`, sem teste comentado, sem mock da regra e sem provedor de IA envolvido.
- Nenhuma operação desta correção pode acontecer duas vezes ao mesmo tempo, então não cabe teste de concorrência.

**Bloqueantes:** nenhum.

**Recomendações:**
- **Teste do preenchimento da migração.** Falta teste automatizado do `update` que preenche a data de criação das escolas em `0030_escola_criada_em.sql`. Já está no documento da correção, com destino no `/validar`.
- **Ligação anterior à escola.** O caso do "lista" grava o início da ligação (-20) antes da criação da escola (-10). Fora do teste isso não acontece. Para provar a cláusula serve, mas o comentário do teste poderia dizer que esse estado foi montado de propósito e não ocorre na prática.
- **Mutação do `case`.** Trocar o `case when alcance = 'todas'` por um `greatest` aplicado a toda linha não muda o resultado hoje: no "lista" vale primeiro o início da ligação. Não há regra sem prova. Só vale lembrar disso se o mapeamento do `inicio` mudar.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-09 13:40:07 · `tasks/correcoes/2026-10-09-vigencia-anterior-a-escola.md`

**VEREDITO: APROVADO**

- **Escopo:** respeitado.
- **Aderência à Tech Spec:** ok.
- **Portão local:** o carimbo é válido. O `conferir` disse: "portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)".
- **Bloqueantes:** nenhum.

**A correção exigida na 1ª rodada foi feita.** O caso do "lista" agora tem um `it` próprio, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/suboperador.int.test.ts:402-415`:
- A escola `nova` fica com `criada_em = dias(-10)`.
- A ligação vai para `-20/-15`.
- O teste agora grava `update suboperador set inicio = dias(-30), fim = dias(-12)`.
- Afirma que a leitura devolve `[{ inicio: dias(-20), fim: dias(-15) }]`.

Sem o `ne(suboperador.alcance, 'todas')` de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/suboperador-da-escola.repository.ts:81`, o `fim` da empresa (-12) seria anterior ao `criada_em` (-10) e a linha sumiria. Então o teste quebra se essa cláusula for removida. A tabela "Mutações" da correção registra que a mutação foi feita e o teste ficou vermelho.

**O resto da rodada também está em ordem:**
- O `test-engineer` aprovou na 2ª rodada (13:39).
- Saiu o `await encerrar(lista.chave)`, e isso não deixa sobra que afete outros testes: a empresa termina com `fim` preenchido (-12), ou seja, já encerrada.
- As recomendações que a Mesa mandou aplicar foram aplicadas:
  - o `it` próprio para o "lista";
  - o limite da regex escrito no comentário de `arquitetura.test.ts:396-397`;
  - a quebra da linha longa em `docs/modelo-de-dados.md:600-602`.
- O diff desde a rodada anterior só traz testes, comentários e documentação. Nenhuma lógica nova.

**Recomendações:**
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/correcoes/2026-10-09-vigencia-anterior-a-escola.md`, na seção "Teste que reproduz", o segundo item ainda cita o nome antigo do teste, terminado em `; o "lista" não muda`. O `it` foi renomeado sem esse trecho. Basta tirar o trecho do nome no documento.
- O comentário em `suboperador-da-escola.repository.ts:84` diz que "o `greatest` não muda a ordem entre linhas do mesmo nome". Isso só vale enquanto a ordem por `inicio` decrescente for estável no empate do `greatest`. Seria melhor dizer que o empate é aceito, ou ordenar pela mesma expressão que vai no `select`.
