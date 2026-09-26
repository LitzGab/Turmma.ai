# Achados das revisões — `tasks/prd-apresentacao-escola/2_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-26 14:38:25 · `tasks/prd-apresentacao-escola/2_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **E3, leitura do texto:** separadores e a ordem entre eles, cabeçalho em qualquer caixa e com ou sem acento, aspas, BOM, linha em branco, `trim`, os limites de 200 linhas e de 64 KB, e o texto sem nenhuma linha de aluno.
- **E4:** erro por linha, e nada gravado. O erro do texto responde `ENTRADA_INVALIDA`; a matrícula em uso responde `CONFLITO`.
- **E5:** a matrícula vale por escola e por ano. A de outra escola entra, a que só existe na `credencial_matricula` de B entra, e a do ano encerrado entra no ano em curso.
- **E6:** reenviar a lista sem o aprovado. **E7:** avulso, os quatro casos de `ENTRADA_INVALIDA` ou `CONFLITO`, e a retirada de livre e de reivindicado.
- **E2 (parte da lista):** a turma com nome na lista não se exclui.
- **O check e as FKs da `lista_nome`:** as combinações de estado, formato e usuário, o `criado_por` com `set null`, e o autor de outra escola.
- **A1 e A2:** auditoria só com ids e contagens, e `turma.lista_lida` a cada leitura, com finalidade.
- **I3, P1 e I9 nas cinco rotas:** escola B, professor e aluno, e as células da `MATRIZ`.
- **Concorrência (C8, C9 e a corrida entre duas turmas):** C8 com a mesma lista gravada duas vezes em paralelo. C9 nos dois arranjos. As duas turmas gravando a mesma matrícula ao mesmo tempo.
- **Log (A4):** nas duas suítes.

**Cobertos:** todos os acima.
- A concorrência é paralela de verdade: `Promise.all` e `GatilhoDeParada` com `esperarNaTrava`, e não duas chamadas em sequência. O C9 com a exclusão aberta antes da escrita é o que derruba o `for key share`. O primeiro arranjo do C9 prova a FK.
- A tabela de "Mutações" bate com as linhas do diff: `lista.service.ts`, `lista.repository.ts`, `turma.repository.ts:57-58`, controller, contratos, leitor e migration. As mutações que não deixam teste vermelho são todas segunda camada declarada: escola e ano em `quantasNaTurma`, na leitura e no `delete` sozinho. É o mesmo raciocínio que o I3 da `cenarios.md` já aceita.
- Não há `.skip`, `.only`, teste comentado nem mock de coisa nossa. Tudo roda em Postgres real. Rodei só os três arquivos de unidade (leitor, contrato e `matriz.test.ts`), 28 testes verdes; a suíte de integração não rodei.
- Ficam fora do escopo, e anotados na `8_task.md` em "Herdado da 2.0": o `ja_existe` do aprovado e a corrida entre o avulso e a aprovação da mesma matrícula.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Clique duplo no avulso e na retirada.** Hoje as duas coisas só são testadas em sequência (`lista.int.test.ts:338` e `:367`). O mecanismo já está provado, porque o avulso não confere a lista antes e vive só do índice único, e o `delete` é condicional. Mesmo assim, um par em `Promise.all` para cada uma deixaria a regra 80, item 7, explícita.
2. **Dois alunos com o mesmo nome.** Nenhum teste da prévia ou da gravação manda duas linhas com o mesmo nome e matrículas diferentes, esperando que as duas entrem. Hoje o código só olha a matrícula, então o teste serve de guarda contra alguém criar um único por nome. O E24 cobre o caso só na reivindicação.
3. **Retirar aprovado.** O check já aceita `aprovado` com `usuario_id`, então dá para inserir no banco agora, como foi feito com o reivindicado, e provar o `CONFLITO` sem esperar a 8.0.
4. **Título com vírgula.** Um título como "Turma 8ºA, manhã" antes da lista escolhe `,` como separador, e todas as linhas `nome;matrícula` saem `sem_matricula`. A prévia mostra o erro e nada é gravado, então não é bug. Vale fixar o caso num teste do E3 e avisar a 13.0, porque na tela isso aparece como a lista inteira errada.
5. **`@Permite` na tabela de Mutações.** Só aparecem o da gravação (`lista.controller.ts:34`) e o da leitura (`:48`). O da prévia (`:26`), o do avulso (`:41`) e o da retirada (`:55`) também são cobertos pelo P1, mas completar as três linhas deixa o registro fiel.
6. **Auditoria na mesma transação.** Os testes provam que o registro existe, não que ele cai junto com a operação. Nenhuma falha é injetada entre a escrita e a auditoria. Segue o precedente do `turma.alunos_lidos`, então não bloqueia; fica para o `/retro`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/lista.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-montada.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/leitor-da-lista.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/estrutura/lista.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/permissao/matriz.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.controller.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/leitor-da-lista.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0019_lista_nome.sql

## test-engineer · 2ª rodada · APROVADO · 2026-09-26 14:48:33 · `tasks/prd-apresentacao-escola/2_task.md`

VEREDITO: APROVADO

Cenários exigidos (2ª rodada): nesta rodada conferi só se as recomendações da 1ª foram aplicadas e se os testes novos provam a regra. O resto não mudou e não foi auditado de novo.
1. Clique duplo no avulso e na retirada, com as duas chamadas em paralelo de verdade.
2. Dois alunos com o mesmo nome e matrículas diferentes.
3. Retirar um nome já aprovado.
4. Título com vírgula antes da lista.
5. A linha do `@Permite` na tabela de Mutações.
6. Auditoria na mesma transação, registrada como pendente para o `/retro`.

Cobertos:
1. **Clique duplo** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/lista.int.test.ts:390-403`). Os dois pedidos saem juntos por `Promise.all`, e o teste verifica o resultado, não só as respostas: `[201, 409]`, uma linha só no banco e um `lista.gravada`. Na retirada, `[204, 404]`, a lista vazia e um `lista_nome.retirado`.
   - O teste falharia sem a regra. No avulso (`lista.service.ts` `acrescentar`), só o índice único da matrícula impede a segunda linha, porque a lista não é consultada antes de gravar. Sem o índice, os dois pedidos respondem 201 sempre, não por acaso.
   - Na retirada, o `delete ... where estado = 'livre' returning` trava a linha. O segundo pedido espera e depois não acha nada, então responde 404 e não grava auditoria em dobro.
2. **Homônimos** (`lista.int.test.ts:304-313`). Duas linhas com o mesmo nome em T2: a prévia dá `entram: 2`, e a gravação passa pelo `gravada`, que por padrão exige `{ gravados: 2, jaExistentes: 0 }`. Se a gravação juntasse os dois pelo nome, a contagem quebraria. A checagem de `criado_por` do E6 agora filtra T1 e continua exigindo 4 linhas.
3. **Retirar aprovado** (`lista.int.test.ts:374-387`). A linha `aprovado` é inserida do jeito que o check do banco exige (com usuário, sem nome nem matrícula). A retirada dá `CONFLITO`, e o retrato da escola, comparado antes e depois, prova que nada saiu. Sem a cláusula `estado = 'livre'` no `delete` (`lista.repository.ts:111`), o teste quebra.
4. **Título com vírgula** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/leitor-da-lista.test.ts:94-99`). O teste fixa o comportamento: a vírgula é escolhida e a linha com `;` sai sem matrícula. O aviso para a tela está em "Herdado da 2.0" do `13_task.md`.
5. **`@Permite`**: a tabela de Mutações do `2_task.md` (linha 177) agora cita as cinco rotas e diz quais foram rodadas.
6. **Auditoria na mesma transação**: está registrada como recomendação sem aplicar, com destino `/retro`.

Bloqueantes: nenhum.

Recomendações:
- **Tabela de Mutações**: não tem linha para os dois testes novos.
  - Falta a mutação "índice único de `lista_nome` na matrícula removido → clique duplo do avulso fica vermelho", que é a prova de que a concorrência do avulso é resolvida no banco (regra 80, item 7).
  - Falta a linha do `estado = 'livre'` em `lista.repository.ts:111` apontando também para o teste do aprovado.
  - Basta registrar, não bloqueia.
- **Homônimos**: as matrículas da prévia (`:306`) e as da gravação (`:308-311`) são sorteadas separadamente. O teste está correto, mas prévia e gravação com as mesmas linhas mostrariam melhor o fluxo real da coordenação. Vale também conferir no banco que as duas linhas de T2 existem com o mesmo `nome`; hoje só a contagem da resposta garante isso.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-26 14:49:58 · `tasks/prd-apresentacao-escola/2_task.md`

VEREDITO: APROVADO

Tabelas verificadas: `lista_nome`, em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0019_lista_nome.sql` e `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/lista-nome.ts`.
- Tem `escola_id` e `ano_letivo_id`, os dois obrigatórios.
- O id é UUID gerado por `uuidv7()`.
- A turma, o usuário e o autor (`criado_por`) apontam para suas tabelas por FK composta que inclui a escola. A da turma inclui também o ano, então uma linha não aponta para turma de outra escola nem de outro ano.
- O índice único da matrícula é por escola e ano (`escola_id, ano_letivo_id, btrim(matricula)`). O índice da turma começa pela escola e pelo ano.
- O `set null ("criado_por")` foi escrito à mão, para não apagar a `escola_id` junto com o autor.

Queries verificadas:
- `ListaRepository`, nas funções `naLista`, `comCredencial`, `inserirSemRepetir`, `quantasNaTurma`, `inserir`, `retirarLivre`, `existe` e `pagina`. Todas tiram escola e ano do contexto autenticado, com `exigirEscolaDoContexto` e `exigirAnoEmCurso`. Nenhuma recebe escola ou ano por argumento.
- `TurmaRepository.travarContraExclusao`: escola, ano e id, com `for key share`.
- `TurmaRepository.aberta(…, 'unidade')`, que a prévia e a leitura usam antes de tocar na lista.
- Os contratos em `packages/shared/src/estrutura/lista.ts` são estritos (`strictObject` e `.strict()`). Um `escolaId` no corpo ou na query responde `ENTRADA_INVALIDA`, e a varredura A3 prova isso.
- Id fora do formato no caminho responde 404, pelo `idDoCaminho`.
- A turma é conferida antes de qualquer resultado que dependa do banco. Com isso, a turma de outra escola, um id sorteado e um id fora do formato recebem a mesma resposta 404, conferida inteira no I3.
- O `CONFLITO` da retirada vem de `existe`, que busca só na escola e no ano da sessão, então não confirma que o id existe em outra escola.
- `matricula_em_uso` olha só a lista e a `credencial_matricula` da própria escola. O E5 prova que a matrícula de outra escola sai `entra`.
- Nenhuma consulta da camada de rede foi tocada, e não há `@SemEscopo()`.

Teste de isolamento: presente e efetivo.
- O I3 de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-montada.int.test.ts` roda as cinco rotas com o recurso da escola B e confere que B não muda, lendo também a `lista_nome`.
- Tirando a escola e o ano juntos da retirada, o nome livre de B seria apagado e o teste quebraria.
- Tirando o escopo de `travarContraExclusao` ou de `aberta`, a prévia, a gravação, o avulso e a leitura responderiam 2xx para a turma de B, e o teste quebraria.
- O E5 de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/lista.int.test.ts` quebra se a escola sair de `comCredencial`, e o ano encerrado cobre a cláusula do ano.

Bloqueantes: nenhum.

Recomendações:
- A escola nas buscas de `naLista`, `quantasNaTurma` e `pagina`, e sozinha no `delete`, é segunda camada que nenhum teste isola: o ano é por escola e a turma é conferida antes. Isso já está declarado nas Mutações do `2_task.md`. Vale manter a cláusula e registrar no `/retro` que esse padrão sem teste próprio é aceito só quando a primeira camada também vem do token.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-26 14:50:53 · `tasks/prd-apresentacao-escola/2_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. Cada divergência listada em "Divergências resolvidas nesta tarefa" já está na seção 4 ou na 7 da `techspec.md`, e nos cenários E3, C8 e C9 do `cenarios.md`. Nenhuma ficou só no `2_task.md`.
Portão local: carimbo válido (typecheck, lint, test)
Bloqueantes: nenhum

Recomendações:
1. **Finalidade da leitura opcional no contrato.** Está em `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/estrutura/lista.ts:95`, e o service a exige em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.service.ts:143`. O `.optional()` veio copiado do `turma.alunos_lidos`, onde o professor lê sem finalidade. Aqui só a coordenação lê, então o campo pode ser obrigatório no contrato. A regra passa a estar num lugar só, e a tela da 13.0 não precisa descobrir pelo erro que ele é exigido.
2. **Cabeçalho que o leitor não reconhece.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/leitor-da-lista.ts:69-74` só aceita um cabeçalho com "nome" e "matricula". Uma planilha com cabeçalho `Nome;RA` ou `Aluno;Código`, comum em escola, grava um aluno chamado "Nome" com matrícula "RA", e a prévia marca essa linha como `entra`, sem erro. Vale reconhecer os sinônimos mais comuns ou fazer a prévia avisar, e anotar o caso no "Herdado da 2.0" do `13_task.md`, junto do título com vírgula.
3. **Ternário aninhado.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.service.ts:40` junta três decisões numa linha só: erro do texto, mesma turma e em uso. Uma função `erroDoBanco(naLista, deAluno)` com `if`s deixaria a regra do E4 legível.
4. **Matrícula igual com nome diferente.** No reenvio, a linha sai `ja_existe` e o nome novo é descartado sem aviso. Isso segue o RF5 ("pela matrícula"), mas a prévia mostra o nome novo ao lado de `ja_existe`, e a coordenação pode entender que aquele aluno já estava na lista. A decisão é da tela: fica como nota para a 13.0.
5. **Leitura do separador.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/leitor-da-lista.ts:95`, `fisicas.map(separadorDa).find(...)` procura o separador em todas as linhas, quando só precisa da primeira que tem um. Trocar por `for`/`find` direto sobre `fisicas` resolve. O custo é pequeno com o teto de 64 KB, então não é urgente.

Não rodei nenhum teste de novo sobre esta árvore. Conferi o carimbo do portão local, como pede o processo.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-26 14:51:12 · `tasks/prd-apresentacao-escola/2_task.md`

```
VEREDITO: APROVADO
Campos pessoais tocados: lista_nome.nome e lista_nome.matricula (aluno antes de virar usuário), lista_nome.usuario_id (referência que a 8.0 preenche), lista_nome.criado_por (id da coordenação que gravou), criado_em. A credencial_matricula só é lida, com a escola do contexto.
Fora da tabela de dados do docs/lgpd.md: nenhum campo de aluno. O criado_por não aparece por extenso na linha "Lista de nomes da turma". Vínculo segue o mesmo precedente, por isso vai como recomendação.
Autorização por objeto: ok. As cinco rotas passam pela MATRIZ, só com a coordenação (rede, professor e aluno ficam em 'nunca'). A turma é conferida com escola e ano do contexto antes de toda leitura ou escrita (aberta e travarContraExclusao). O DELETE usa escola, ano, id e 'livre'. A FK composta é a segunda camada. Se eu trocar o id por um de outra escola, de outro ano ou sorteado, a resposta é NAO_ENCONTRADO. A diferença entre CONFLITO e NAO_ENCONTRADO na retirada só aparece dentro da própria escola e do mesmo ano. O I3 e o P1 estão em escola-montada.int.test.ts e o E5 em lista.int.test.ts.
Logs: limpos. Nenhum arquivo novo tem logger. O 23505 do avulso passa por mapearErroPostgres e resumirErro, que guardam só o sqlstate e a constraint, sem o detail que traz a matrícula. O teste A4 existe nas duas suítes, com nome, matrícula e prefixo como sentinelas.
Auditoria: presente. lista.gravada (texto e avulso, com ids e contagens), lista_nome.retirado (turma e estado) e turma.lista_lida (finalidade obrigatória, gravada na mesma transação a cada leitura). Nenhuma delas leva nome ou matrícula.
Envio externo: nenhum.
Seed/fixture: sintético. Os nomes são prefixo com UUID, e "Ana Souza" e "Bruno Lima" só aparecem no teste de unidade do leitor.
Bloqueantes: nenhum.
Recomendações:
1. docs/lgpd.md:72: pôr por extenso na linha "Lista de nomes da turma" o "quem gravou (vira nulo se a pessoa for eliminada; a auditoria guarda o id)", como já está na linha de "Acesso da turma". Fica valendo também para o criado_por do Vínculo.
2. apps/api/src/estrutura/lista.service.ts:62: a prévia funciona como consulta sem auditoria. Com até 200 matrículas por chamada, a coordenação descobre quais matrículas existem na escola (matricula_em_uso) e quais estão na turma (ja_existe). Nenhum nome gravado volta e só a coordenação chega lá, então o risco é baixo. Mesmo assim, vale um limite por usuário ou uma nota na seção 7 da Tech Spec explicando por que a prévia não audita.
3. apps/api/src/estrutura/lista.controller.ts:47: a resposta nominal sai sem Cache-Control: no-store. GET /turmas/:id/alunos tem o mesmo problema. Sugiro um no-store padrão para as rotas autenticadas que devolvem dado de aluno, no `/retro`.
4. apps/api/src/estrutura/lista.service.ts:147: turma.lista_lida guarda só a quantidade, não os ids que foram lidos. Para "quem leu o dado do aluno X", a resposta é por turma e por janela de tempo. É o mesmo padrão de turma.alunos_lidos, e fica para o `/retro`.
5. apps/api/src/estrutura/leitor-da-lista.ts:102: sem cabeçalho, a segunda coluna vira matrícula. Um texto colado como "nome;CPF" ou "nome;nascimento" seria gravado como matrícula. A prévia mostra isso, mas vale um aviso na tela da 13.0 ou uma recusa de formato de CPF ou data.
6. Retenção e titular: hoje o encerrar deixa os nomes livres no ano fechado, e o teste E5 em lista.int.test.ts:248 exercita exatamente isso. É o contrário do que a linha de docs/lgpd.md diz. Aceitável só com dado sintético e até a 10.0, que já está registrada (10.2 e 10.3). Acesso e portabilidade da lista_nome ficam no TODO.md para o F3. Pergunta de fechamento: o que a lista guarda é consultável por escola, ano e matrícula, e nada vai para terceiro. A rotina por código que junta tudo sobre um aluno continua a cargo do F3.
```

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.controller.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/leitor-da-lista.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0019_lista_nome.sql
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/lista-nome.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/auditoria/acoes.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/estrutura/lista.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/permissao/matriz.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/lista.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-montada.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md (linha 72)

## test-engineer · 3ª rodada · APROVADO · 2026-09-26 15:02:37 · `tasks/prd-apresentacao-escola/2_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos das rodadas anteriores (E3 a E7, I3, I9, P1, A1 a A4, C8, C9, E5 com o ano encerrado, duas turmas ao mesmo tempo). Nesta 3ª rodada audito só o diff desde a aprovação da 2ª: a finalidade obrigatória no contrato, a função `peloBanco`, o laço que procura o separador, os homônimos do E6 e os documentos.

Cobertos:
- **Finalidade obrigatória.** Está em `packages/shared/src/estrutura/lista.ts:106`, e o serviço deixou de conferir por conta própria (`lista.service.ts:146-155`). O A2, em `apps/api/test/lista.int.test.ts:517-538`, pede sem finalidade a turma da própria escola, a de outra escola e um id sorteado. Espera `ENTRADA_INVALIDA` igual nos três e confere pelo `retrato` que nada foi gravado. Se o `.optional()` voltar, a turma da própria escola responde outra coisa e o teste fica vermelho. A tabela de Mutações registra essa linha.
- **`peloBanco`.** As linhas 41 e 42 (as duas condições) e 47 (o erro do texto vence o do banco) conferem com a tabela de Mutações, e os testes são E4 prévia, E6 e A1 da lista. A linha 43 (`entra`) é o caminho feliz de todos os testes de gravação.
- **Laço do separador.** A tabela aponta `leitor-da-lista.ts:96-98`, e os números batem com o arquivo. Os dois testes cobrem as duas mutações: "separador vem da primeira linha que tem um" (`leitor-da-lista.test.ts:85`) pega a parada fixa, porque o título sem separador vem antes. "Título com vírgula" (`:94`) e o teste de 200 linhas pegam o laço sem parada, porque a última linha ou o `\n` final trocariam o separador.
- **Homônimos do E6** (`lista.int.test.ts:305-314`). A prévia e a gravação usam as mesmas linhas, a prévia dá `entram: 2`, e o teste confere no banco que as duas linhas de T2 existem com o mesmo nome e matrículas diferentes. A recomendação da 2ª rodada foi atendida.
- **`docs/lgpd.md`.** "Quem gravou, que vira nulo se a pessoa for eliminada" bate com o `set null` da 0019 e com o teste "quem gravou vira nulo" (`lista.int.test.ts:472`).
- Não há `.skip`, `.only` nem `it.todo` nos três arquivos de teste da tarefa. Nenhum mock toca a regra.

Bloqueantes: nenhum.

Recomendações:
- `packages/shared/src/estrutura/lista.test.ts` poderia ter um caso de unidade com `esquemaConsultaListaDaTurma.safeParse({})` falhando. Assim a mutação do `.optional()` fica vermelha também sem o Postgres. Hoje só o A2 de integração a prova, e isso basta.
- No E6, a prévia dos homônimos confere só as contagens. Conferir também `resultado: 'entra'` em cada linha deixaria explícito que nenhuma das duas sai `matricula_repetida` nem `ja_existe` por causa do nome.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/estrutura/lista.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/leitor-da-lista.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/leitor-da-lista.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/lista.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/2_task.md (Mutações)
- /home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md

## revisor-geral · 2ª rodada · APROVADO · 2026-09-26 15:03:13 · `tasks/prd-apresentacao-escola/2_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint e test valem para o código atual)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/leitor-da-lista.ts:114`: esta linha do docblock de `errosDasLinhas` passa da largura que o resto do arquivo usa. É só estética.

As cinco mudanças desde a 1ª rodada estão feitas e conferem:
1. **Finalidade na consulta** (`packages/shared/src/estrutura/lista.ts:101-106`): a `finalidade` virou obrigatória em `esquemaConsultaListaDaTurma`. O controller a confere por `lerEntrada` antes de chamar o service, e `ListaService.ler` não repete a conferência. O teste A2 (`apps/api/test/lista.int.test.ts:517-535`) prova `ENTRADA_INVALIDA` igual para a turma dela, a de outra escola e um id sorteado. O texto da seção 4 da `techspec.md` diz a mesma coisa ("conferida antes de procurar a turma").
2. **`classificar`** (`apps/api/src/estrutura/lista.service.ts:34-49`): a função `peloBanco` substituiu o ternário aninhado. A ordem de precedência continua igual: primeiro o erro do texto, depois `ja_existe`, depois `matricula_em_uso`, depois `entra`.
3. **Busca do separador** (`apps/api/src/estrutura/leitor-da-lista.ts:95-99`): o laço para na primeira linha que tem separador. A tabela de Mutações do `2_task.md` cobre a versão sem a parada.
4. **E6, homônimos** (`apps/api/test/lista.int.test.ts:304-314`): a prévia dá `entram: 2`, e o banco guarda os dois nomes com matrículas diferentes. Isso prova que só a matrícula decide.
5. **Documentos**: estão atualizados a linha da lista em `docs/lgpd.md` (quem gravou), a seção 7 da `techspec.md` (por que a prévia não audita), a seção "Herdado da 2.0" do `13_task.md` e o `2_task.md` (Mutações e Recomendações sem aplicar). Cada recomendação ficou com um destino ou com o motivo de não ter sido aplicada.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-09-26 15:03:13 · `tasks/prd-apresentacao-escola/2_task.md`

VEREDITO: APROVADO

Tabelas verificadas: `lista_nome` (sem mudança de esquema nesta rodada). No `docs/lgpd.md` só a descrição mudou: agora diz que "quem gravou" vira nulo quando a pessoa é eliminada. Nenhum campo novo sem linha na tabela de dados.

Queries verificadas: nenhuma query mudou de escopo.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.service.ts:34-49`: a função `peloBanco` só reorganiza o resultado de `lista.naLista` e `lista.comCredencial`. Essas duas consultas vêm do repository, que não mudou e já tinha o escopo da escola e do ano a partir do token. A regra continua a mesma: mesma turma dá `ja_existe`; outra turma ou credencial da escola dá `matricula_em_uso`.
- `lista.service.ts:146-155`: `ler` continua buscando a turma por `TurmaRepository.aberta(turmaId, 'unidade')` antes de paginar, e grava a auditoria na mesma transação.
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/estrutura/lista.ts:106`: a consulta continua `.strict()`, com `finalidade` obrigatória e sem escola nem ano. O controller (`lista.controller.ts:49-51`) valida a consulta antes de chamar o service. Por isso a falta da finalidade responde `ENTRADA_INVALIDA` antes de procurar a turma, e a resposta não revela se o id existe.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/leitor-da-lista.ts:95-99`: é só o laço do separador, sem banco.

Teste de isolamento: presente e efetivo. Os testes da 1ª rodada não foram tocados. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/lista.int.test.ts:517-535` há duas provas novas:
- sem finalidade, a resposta é `ENTRADA_INVALIDA` igual para a turma da própria escola, para a de outra escola e para um id sorteado, e nada é gravado;
- mandar `escolaId` na query também é recusado.

O teste do E6 com homônimos (linhas 283-314) testa regra de negócio, não escopo, e não mexe no que já era provado sobre isolamento.

Correções exigidas na rodada anterior: nenhuma (a 1ª rodada saiu APROVADO sem bloqueantes).

Bloqueantes: nenhum.

Recomendações: nenhuma nova. Continua registrada para o `/retro` a da 1ª rodada, sobre a segunda camada de defesa.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-26 15:03:26 · `tasks/prd-apresentacao-escola/2_task.md`

```
VEREDITO: APROVADO
Campos pessoais tocados: nenhum novo nesta rodada. A lista de nomes da turma (nome, matrícula, estado, quem gravou) continua como estava na 1ª rodada.
Fora da tabela de dados do docs/lgpd.md: nenhum. A linha "Lista de nomes da turma" (docs/lgpd.md:72) agora diz "quem gravou" por extenso, com nulo na eliminação e o id guardado na auditoria (recomendação 1, aplicada).
Autorização por objeto: ok. O diff não mexe em rota nem em escopo. Sem finalidade, a leitura recusa antes de procurar a turma, com ENTRADA_INVALIDA igual para a turma da própria escola, a de outra escola e um id sorteado. Não confirma existência (lista.int.test.ts:531-532).
Logs: limpos. Nenhum logger nem console em lista.*.ts e leitor-da-lista.ts.
Auditoria: presente. Com a finalidade obrigatória no contrato (packages/shared/src/estrutura/lista.ts:106), a leitura nominal pela coordenação não passa mais sem ela, e `turma.lista_lida` é gravada na mesma transação com a finalidade (lista.service.ts:148-153). O teste confere o registro em cada leitura, inclusive a repetida, e confere que nada é gravado sem finalidade, com finalidade fora da lista fechada ou com escolaId na consulta (lista.int.test.ts:517-536). A prévia sem auditoria está justificada na techspec.md, seção 7 (recomendação 2, aplicada).
Envio externo: nenhum.
Seed/fixture: sintético. O teste de homônimos do E6 usa nome() e matricula() gerados (lista.int.test.ts:305-314).
Bloqueantes: nenhum
Recomendações: nenhuma nova. Seguem as da 1ª rodada com o destino já registrado em "Recomendações sem aplicar" do 2_task.md: no-store e contagem na auditoria para o /retro, escola como segunda camada para o /retro, CPF colado como matrícula em "Herdado da 2.0" do 13_task.md, nomes livres no ano encerrado na tarefa 10.0.
```

Conferi o diff descrito:

- **`finalidade` obrigatória** (`/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/estrutura/lista.ts`): o esquema é estrito e usa a lista fechada `FINALIDADES_DA_LEITURA_DE_ALUNOS`. O controller valida pelo contrato compartilhado antes de chamar o service (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.controller.ts:49-51`). O service não confere a finalidade por conta própria, mas não perdeu nada: o contrato já a garante.
- **`classificar` com `peloBanco`** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.service.ts:34-49`): a regra é a mesma, e o resultado só traz as matrículas que a própria coordenação digitou. Não expõe nada novo.
- **Laço do separador** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/leitor-da-lista.ts:95-99`): não toca dado pessoal, log nem DTO.
- **Homônimos no E6**: o teste confere as duas linhas no banco pela matrícula, com dado sintético.

Pergunta de fechamento: continua respondida. A lista está no mapa de dados, a leitura nominal sempre deixa registro com a finalidade, a gravação e a retirada são auditadas só com ids, e nada vai a terceiro. Não rodei a suíte nem mexi no banco de teste.
