# Cenários de teste — A escola montada pela coordenação (A1)

Parte da Tech Spec (`techspec.md`, seção 10): cada cenário é um teste, e a tarefa que o cobre cita o identificador. A
lista é fechada; mudar exige revisar a spec. Saiu da rodada 1 do `/revisar-spec` (25/09/2026) e foi revista depois da
rodada 2 e da rodada 3 (26/09/2026).

Cada linha diz a camada, o que o teste prova e, em **Quebra sem**, a cláusula ou regra que o deixa vermelho quando é
retirada. Concorrência é sempre com as chamadas em paralelo (`Promise.all`); integração é com Postgres e Redis reais;
nomes e matrículas são gerados pelo teste, nunca fixos de pessoa. `salas/*` abrevia `/v1/salas/*`. O mapa do fim liga cada RF e cada caso de borda do PRD
aos cenários.

## I — Isolamento e arquitetura

- **I1** (arquitetura) `apps/api/test/arquitetura.test.ts` passa sem mudar uma linha: nenhum arquivo fora de
  `apps/api/src/sessao` importa a `ResolucaoDeTenantRepository`, e `apps/api/src/sala` importa só o `AcessoDaSala`.
  **Quebra sem:** o `AcessoDaSala` dentro de `sessao` (o `sala` chamando o repository direto)
- **I2** (unidade) A lista fechada de `resolucao-de-tenant.repository.test.ts` ganha exatamente
  `acessoDaSalaPorToken` e `acessoDaSalaPorCodigo`, cada um com `@SemEscopo` e justificativa que cita o link e o código
  da sala. **Quebra sem:** a entrada na lista ou a justificativa
- **I3** (integração) Cada rota autenticada nova, pedida pelo usuário da escola A com o id de um recurso da escola B
  (turma, disciplina, linha da lista, professor, convite, acesso, pedido): `NAO_ENCONTRADO`, com o corpo igual ao de um
  UUID aleatório, e nada gravado em B. **Quebra sem:** `escola_id` do contexto na cláusula de cada repository. Na
  turma, que filtra também pelo ano em curso do contexto, tirar só a escola não deixa o teste vermelho (o ano do contexto
  é da escola, e a turma de B nunca está nele): a escola fica como segunda camada, e o ano é provado pela turma do ano
  encerrado da mesma escola (E2, 1.0)
- **I4** (integração) Na escola A, o código vigente de B com o slug de A, e o token vigente de B com o slug de A:
  `NAO_ENCONTRADO` em `salas/abrir` e em `salas/reivindicar`. **Quebra sem:** a escola do slug na busca pelo código; a
  conferência do slug contra a escola do acesso pelo token
- **I5** (integração) Reivindicar com o acesso de T1 e o `listaNomeId` de T2 da mesma escola e, depois, de uma turma de
  B, sempre com a matrícula correta daquele nome: `REIVINDICACAO_RECUSADA`, nenhuma linha de `lista_nome` alterada,
  nenhum pedido criado. **Quebra sem:** a turma do acesso no `update` da reivindicação (sem ela, o nome de T2 é tomado).
  Escola e ano ficam como segunda camada: o `turma_id` é UUID global, e tirar só um deles não deixa o teste vermelho
- **I6** (integração) `decidir` pelo professor de T1, num lote misto: um UUID aleatório; de B, um pedido pendente e um
  já decidido; de T2 (sem vínculo dele), um pendente e um já decidido; um de T3 (vínculo dele `pendente`); um de T4
  (vínculo dele `contestado`); um pendente de T5, turma de outro ano letivo da escola A, com vínculo dele confirmado,
  populada e depois com esse ano posto em `encerrado` no banco, como no V2; e um de T1. Os oito primeiros respondem
  `nao_encontrada`, idênticos entre si e ao UUID aleatório; o de T1, `decidida`. Os pendentes de fora continuam
  pendentes, os decididos não mudam, e só um usuário é criado. O mesmo lote pela coordenação de A, com um pendente e um
  já decidido de B: os dois de B `nao_encontrada`, idênticos ao aleatório; os de A decididos, ou `ja_decidida`. **Quebra
  sem:** a escola, o ano em curso ou o `exists` do vínculo confirmado no `update`; o alcance aplicado depois do estado
  na leitura que separa `ja_decidida` de `nao_encontrada` (com ele depois, os já decididos de B e de T2 respondem
  `ja_decidida` e confirmam que existem)
- **I7** (integração, herdado da A0b) Com o check do `convite` afrouxado pela 0018: refazer e revogar da operação pelo
  id de um convite `tipo = 'professor'` respondem `NAO_ENCONTRADO`, sem gravar; e `professores/:usuarioId/convite/
  {refazer,revogar}` pelo usuário coordenador também. O alarme da A0b (insert com `tipo = 'professor'` falha com
  23514) sai, substituído por este. **Quebra sem:** o filtro `tipo` em cada lado
- **I8** (integração) `minha-turma`: dois alunos aprovados em T1 e T2 veem cada um a sua; o aluno com vínculo só no ano
  encerrado recebe `NAO_ENCONTRADO`; o aluno pedindo `GET turmas/:id` de T1, de T2 e de uma turma de B recebe 404 nas
  três (célula `nunca`). **Quebra sem:** o usuário da sessão ou o ano em curso no alcance de `minha-turma`
- **I9** (unidade) `MATRIZ`: cada célula nova com o alcance da seção 4 da Tech Spec; a rede com `nunca` em todas (o
  teste de `ALCANCES_INDIVIDUAIS` pega); o aluno só em `minha_turma`. **Quebra sem:** célula aberta além do declarado
- **I10** (integração) A leitura que decide se a falha conta no nome (Tech Spec, seção 5, passo 5): pelo acesso de T1,
  sete tentativas seguidas com matrícula errada em cada `listaNomeId` — um nome livre de T2 da mesma escola, um nome
  livre de uma turma de B e um UUID aleatório. As 21 respostas são idênticas (status, código e corpo), sempre
  `REIVINDICACAO_RECUSADA`; nenhuma chave de contador por nome é criada no Redis nem no seguro em memória. A mesma
  sequência num nome livre de T1: `REIVINDICACAO_RECUSADA` nas cinco primeiras e `LIMITE_EXCEDIDO` na 6ª e na 7ª.
  **Quebra sem:** a turma do acesso na leitura que confere o nome `livre` depois da volta atrás (sem ela, o nome de T2
  tranca na 6ª e confirma que existe). Escola e ano ficam como segunda camada: com a turma, tirar só um deles não deixa
  o teste vermelho

## P — Permissão por objeto, rota a rota

- **P1** (integração) Estrutura, lista e professores (`PATCH`/`DELETE` de disciplina e turma; prévia, gravação,
  nome avulso, retirada e leitura da lista; cadastro, lista, refazer e revogar de professor): professor e aluno recebem
  404. **Quebra sem:** a célula `coordenador` em cada `@Permite`
- **P2** (integração) Acesso da turma (gerar, ler, revogar): coordenação, aluno, professor sem vínculo, com vínculo
  `pendente`, `contestado` ou encerrado, e professor de outra turma recebem 404. O professor com duas disciplinas na
  turma alcança com um vínculo confirmado e outro `pendente`, e recebe 404 com os dois `pendente` ou contestados.
  **Quebra sem:** `turma_vinculada` pelo `exists` de vínculo confirmado
- **P3** (integração) Pedidos (ler): professor sem vínculo confirmado e aluno recebem 404; a coordenação sem finalidade
  recebe `ENTRADA_INVALIDA` para qualquer id, inclusive inexistente e de B. O professor com duas disciplinas na turma,
  os dois vínculos confirmados, vê cada pedido uma vez, e decide com um só deles confirmado. **Quebra sem:** a
  finalidade conferida antes de procurar a turma; o `exists` no lugar de um `join` com o vínculo (que duplica a linha)
- **P4** (integração) `decidir` e `minha-turma`: aluno no primeiro e professor e coordenação no segundo recebem 404 (o
  resto do `decidir` é a I6). **Quebra sem:** a célula de cada papel
- **P5** (integração) `salas/abrir` e `salas/reivindicar` com `escolaId`, `turmaId` ou qualquer campo a mais no corpo:
  400, sem gravar. **Quebra sem:** o contrato `.strict()`

## R — Respostas iguais

- **R1** (integração) Em `salas/abrir` e `salas/reivindicar`: token inexistente, vencido, revogado, de ano encerrado,
  de turma excluída (o acesso revogado, a turma excluída, o `cascade` levando o acesso) e de outra escola; código nos
  mesmos seis casos; slug inexistente. Todos
  com o mesmo status, o mesmo `NAO_ENCONTRADO` e o corpo byte a byte igual. **Quebra sem:** qualquer ramo com texto ou
  código próprio
- **R2** (integração) Em `salas/reivindicar`, com acesso válido: `listaNomeId` inexistente, de outra turma, de outra
  escola, de ano encerrado, com matrícula errada, com a matrícula de outro nome da turma, já reivindicado e já aprovado.
  Todos `REIVINDICACAO_RECUSADA`, corpo igual, nada gravado. **Quebra sem:** um ramo que diga qual dos dois errou
- **R3** (unidade) Com o hash falso contando chamadas: matrícula certa, errada, nome tomado, `listaNomeId` inexistente
  e de outra turma chamam o argon2id uma vez cada, pelo semáforo, antes da transação. **Quebra sem:** o hash sempre (rodar só quando a matrícula bate mede a
  matrícula pelo tempo)
- **R4** (integração) Convite de professor usado, vencido, revogado, refeito e inexistente: a mesma resposta em
  `convites/consultar` e em `/aceitar`. **Quebra sem:** o filtro de validade na busca pelo hash
- **R5** (integração) Login por matrícula com a matrícula e a senha de um pedido pendente responde igual à senha errada
  de uma matrícula existente e à de uma inexistente. **Quebra sem:** a credencial só na aprovação

## E — Escrita e regra

- **E1** (integração) RF3: criar ano letivo, série, disciplina e turma; "5º ano" recusado com o erro tipado da série
  (D43). **Quebra sem:** a validação do F1 na rota usada pela tela
- **E2** (integração) Renomear disciplina e turma; excluir disciplina com vínculo e turma com nome na lista, vínculo,
  pedido ou acesso vigente: `CONFLITO`, nada apagado; turma vazia sai, e a turma cujo acesso foi revogado sai levando o
  acesso (a FK do `acesso_turma` com `on delete cascade`). **Quebra sem:** o mapeamento da FK para `CONFLITO`; a
  condição de não haver acesso vigente no `delete` da turma
- **E3** (unidade) Leitura do texto: `;`, `,` e tabulação; cabeçalho detectado e ignorado; aspas com separador dentro;
  BOM; linha em branco ignorada; `trim` no nome e na matrícula; 200 linhas passam, 201 e 64 KB + 1 recusam com
  `ENTRADA_INVALIDA`. **Quebra sem:** cada regra do leitor
- **E4** (integração) RF4: um texto com duas linhas ruins entre boas (sem nome; sem matrícula; matrícula repetida no
  texto; matrícula na lista de outra turma da escola; matrícula de aluno aprovado de outra turma): a prévia aponta cada
  linha com o código, e a gravação não grava nenhuma. **Quebra sem:** gravar só sem erro; a consulta a
  `credencial_matricula` na prévia e na gravação
- **E5** (integração) A mesma matrícula aceita na lista de outra escola (regra 60, item 6); e uma matrícula que só
  existe em `credencial_matricula` da escola B entra na lista e no nome avulso de A, sem `CONFLITO`. **Quebra sem:** o
  único por escola e ano, e não global; a escola na consulta a `credencial_matricula` (sem ela, o `CONFLITO` confirma à
  coordenação de A uma matrícula de B)
- **E6** (integração) RF5: a mesma lista duas vezes não muda a contagem; linha já na lista, ou de aluno aprovado nesta
  turma, sai `ja_existe`, e não `erro`. **Quebra sem:** o `ja_existe` do aprovado, cuja matrícula já não está na lista
- **E7** (integração) RF5: nome avulso entra; sem nome ou sem matrícula, `ENTRADA_INVALIDA`; com matrícula já na lista
  da mesma turma, na lista de outra turma da escola ou de aluno aprovado (só em `credencial_matricula`, porque a
  `lista_nome` aprovada fica sem matrícula), `CONFLITO`; nos quatro, nada gravado. Retirar nome livre apaga; retirar
  reivindicado ou aprovado dá `CONFLITO` e não apaga. **Quebra sem:** a consulta a `credencial_matricula` e à lista na
  rota avulsa (sem ela, o aluno de maio com a matrícula de um colega aprovado vira nome livre, e a aprovação estoura);
  o `delete` condicional em `livre`
- **E8** (integração) RF6: cadastrar devolve o link uma vez; `GET professores` não traz link nem token; refazer faz o
  anterior responder como inexistente; revogar também. **Quebra sem:** a revogação na mesma transação do refazer
- **E9** (integração) RF6, prazo por tipo: o convite de professor vale no 6º dia e cai depois de 7; o de coordenador
  cai depois de 72 h. **Quebra sem:** a validade pelo tipo (com prazo único, um dos dois falha)
- **E10** (integração) RF7: o aceite na escola B com a conta que já tem usuário em A não cria conta e cria o usuário de
  B; o professor confirma um vínculo e contesta outro; o vínculo `pendente` não alcança a turma (P2). **Quebra sem:**
  `contaParaConvite` achando a conta existente
- **E11** (integração) Conta global: na escola B, cadastrar um e-mail que tem conta em A e um que não tem. O `GET
  professores` e a auditoria `professor.cadastrado` têm os mesmos campos nos dois, sem `contaNova` nem nada que os
  distinga. **Quebra sem:** um campo derivado de a conta ser nova
- **E12** (integração) RF8: a alocação cria o vínculo `pendente`; sem confirmação, o professor não gera acesso nem lê
  pedidos (P2, P3). **Quebra sem:** o estado inicial do F1
- **E13** (integração) RF9: gerar com 1, 7 e 30 dias grava o `expira_em` certo; 0, 2 e 31 dão `ENTRADA_INVALIDA`;
  "Gerar novo" faz o link e o código anteriores responderem `NAO_ENCONTRADO` na hora; o `GET` traz só `expiraEm`.
  **Quebra sem:** a revogação na mesma transação; o enum da validade
- **E14** (integração) Dois professores confirmados na mesma turma: o gerar do segundo derruba o link e o código do
  primeiro. **Quebra sem:** o único por turma
- **E15** (unidade) Código: 8 caracteres, todos do alfabeto de 31 (sem 0, 1, I, L, O); mostrado `ABCD 2345`; a
  entrada com espaço, hífen e minúscula normaliza para o mesmo; o HMAC com `SALA_CHAVE_CODIGO` difere do HMAC da mesma
  entrada com a chave dos contadores. **Quebra sem:** o alfabeto; a chave própria
- **E16** (unidade, web) RF9: o texto do WhatsApp traz o nome da escola e o link, e nenhum nome da lista (sentinela).
  **Quebra sem:** o texto montado só com escola e link
- **E17** (integração) RF10: `salas/abrir` traz só os nomes livres, com `id` e `nome`, sem matrícula; reivindicado e
  aprovado não aparecem. **Quebra sem:** o filtro `livre`; o DTO
- **E18** (integração) RF13: aprovado, o aluno entra com a matrícula e a senha do pedido; a credencial tem a matrícula
  da lista; o vínculo `aluno` nasce `confirmado` com `decidido_em`; a `lista_nome` fica `aprovado`, sem nome nem
  matrícula e com `usuario_id`; o pedido fica sem hash e sem chave. De ponta a ponta com " 123 ": a lista grava `123`,
  o aluno reivindica digitando " 123 ", a credencial fica com `123`, e o login entra com `123` e com " 123 ".
  **Quebra sem:** cada escrita da aprovação; o `trim` na lista, na reivindicação ou no login
- **E19** (integração) RF13 e `TODO.md`: depois do `encerrar`, o aluno aprovado aparece na lista de alunos do ano
  encerrado (10.0). **Quebra sem:** o `decidido_em` no vínculo
- **E20** (integração) RF12: aprovar três selecionados cria três usuários; recusar devolve o nome ao `salas/abrir` e
  apaga o hash; 0 e 41 ids dão `ENTRADA_INVALIDA`. **Quebra sem:** o teto do contrato; a devolução a `livre`
- **E21** (integração) Idempotência: reenviar com a mesma `chaveEnvio` depois do commit responde `enviado`, sem segundo
  pedido, sem hash e sem somar contador; `chaveEnvio` que não é UUID dá 400. Depois da decisão, a chave é nula no banco
  (aprovada e recusada). A mesma chave, depois do commit, enviada pelo acesso de T2 da mesma escola com um nome livre de
  T2 não recebe `enviado`: segue o fluxo normal, passa pelos limites e pelo hash, e o 23505 do único da chave na escola
  leva à releitura, que não a acha em T2 e responde `REIVINDICACAO_RECUSADA`, sem pedido em T2. **Quebra sem:** a
  leitura da chave, na escola e na turma do acesso, antes dos limites e depois da volta atrás (sem a turma, T2 recebe
  `enviado`); a chave anulada na decisão
- **E22** (integração) O aluno que errou o login antes de ser aprovado entra logo depois da aprovação, sem espera: a
  aprovação zera o contador de falhas daquela matrícula. **Quebra sem:** o zerar na aprovação
- **E23** (integração) Borda, aba fechada: falha injetada entre o `insert` do pedido e o `update` da `lista_nome` faz
  rollback; o nome continua livre e não há pedido. **Quebra sem:** as duas escritas na mesma transação
- **E24** (integração) Borda, nomes iguais: dois "Ana Souza" aparecem com ids diferentes; cada um só é reivindicado com
  a própria matrícula; com a do outro, `REIVINDICACAO_RECUSADA`. **Quebra sem:** a matrícula no `update`
- **E25** (integração) Borda, nome do colega: com a matrícula dele, o pedido fica pendente; o professor recusa; o nome
  volta livre, e o dono o reivindica. **Quebra sem:** a devolução a `livre` na recusa
- **E26** (integração) Borda, aluno de maio: o nome avulso aparece no `salas/abrir` do link já vigente, sem gerar outro.
  **Quebra sem:** a leitura da lista a cada abertura
- **E27** (integração) Borda, turma sem professor: o vínculo é encerrado depois de gerar o acesso; o link antigo ainda
  abre e aceita pedido; a coordenação decide com `decidida_como = 'coordenacao'`; a coordenação não gera acesso (P2).
  **Quebra sem:** o alcance `unidade` da coordenação no `decidir`
- **E28** (integração) Borda, link projetado depois da semana: com o relógio além do `expira_em`, `NAO_ENCONTRADO`.
  **Quebra sem:** `expira_em` na resolução
- **E29** (integração) `ops:revogar-acessos-sala --escola <id de A>`, o id que o log `sala.limite_atingido` traz, com
  `OPERADOR`, pelo repository com o escopo da escola do id, sem `@SemEscopo` novo (a lista do I2 não muda): revoga na hora todos os acessos vigentes
  de A (link e código respondem `NAO_ENCONTRADO`), grava um `acesso_turma.revogado` por acesso na auditoria de A, com
  `autor_operador`, e não toca nos de B; imprime só a contagem; a segunda execução revoga zero; id inexistente dá `NAO_ENCONTRADO`,
  e id que não é UUID, `ArgumentoInvalido` com saída 2, como os outros `ops:*`; sem `OPERADOR`, recusa antes de tocar no banco. **Quebra sem:** a escola do contexto na cláusula do
  `update`
- **E30** (integração) Duas matrículas erradas num nome e depois a certa: o pedido chega com `teveMatriculaErrada:
  true`; outro nome, reivindicado de primeira, com `false`; a resposta não traz número, hora nem matrícula tentada.
  Depois de "Gerar novo", o contador do código anterior não marca o pedido feito pelo novo. Aprovado o pedido marcado,
  `teve_matricula_errada` é nulo no banco; outro pedido marcado, recusado, também; a auditoria `reivindicacao.decidida`
  não traz o campo. **Quebra sem:** o contador do nome lido no `insert` do pedido; a anulação na decisão

## V — Virada de ano, eliminação e expurgo

- **V1** (integração) `encerrar` com acesso ativo, pedido pendente marcado com `teve_matricula_errada`, pedido recusado,
  nome livre, nome reivindicado e nome aprovado: o acesso fica revogado; o pendente vira `encerrada`, sem hash, sem
  chave, com `teve_matricula_errada` nulo e sem `decidida_por`; os nomes livre e reivindicado saem; o recusado fica com
  `lista_nome_id` nulo, e o `encerrar` não falha; o aprovado fica. Depois, link e código respondem `NAO_ENCONTRADO`, e
  decidir o pedido dá `nao_encontrada`. **Quebra sem:** cada escrita do `encerrar`, inclusive a anulação de
  `teve_matricula_errada`; o `on delete set null` da FK
- **V2** (integração) Com o ano posto em `encerrado` no banco sem revogar o acesso, link e código respondem
  `NAO_ENCONTRADO`. **Quebra sem:** o join com o ano `em_curso` na resolução
- **V3** (integração) Eliminação do aluno aprovado, com um marcador no nome: o teste guarda, antes, o id da
  `lista_nome` dele e os ids dos pedidos que apontam para ela (um recusado e o aprovado); depois do `eliminar`, nenhum
  desses ids existe, e o marcador não sobra no usuário, na credencial nem em tabela da A1; uma falha injetada no meio
  não apaga nada. **Quebra sem:** o `delete` dos pedidos (sem ele, o `set null` os mantém); o `delete` da
  `lista_nome` (sem ele, a FK do `usuario_id` faz a eliminação falhar)
- **V4** (integração) Eliminação do professor que gerou acesso e decidiu pedidos: `criado_por` e `decidida_por` ficam
  nulos, a eliminação não falha, e a auditoria mantém o id dele. **Quebra sem:** o `on delete set null (coluna)`
- **V5** (integração) Expurgo: `acesso_turma` e convite de professor saem 30 dias depois de vencer, revogar ou usar, e
  ficam no dia 29; dois expurgos em paralelo não falham nem apagam em dobro. **Quebra sem:** as tabelas novas no
  `sistema.expurgar-acesso`

## C — Corridas, sempre em paralelo

- **C1** (integração) RF11: dois pedidos no mesmo nome, com a matrícula certa: um pendente, o outro
  `REIVINDICACAO_RECUSADA`, nunca 5xx; o perdedor não soma no contador do nome e soma um no da turma, como no L6. No repository, o `update` num nome já
  `reivindicado` devolve zero linhas. **Quebra sem:** a condição `estado = 'livre'` (a segunda parte); o 23505 levado à
  releitura da chave, que não acha a do perdedor e responde a recusa (a primeira; sem ela, 5xx)
- **C2** (integração) Mesma `chaveEnvio`, nome livre, matrícula certa, em três jeitos: (a) os dois envios em
  paralelo; (b) com o teto do semáforo ocupado e a ordem da vez controlada pelo teste, o segundo chega enquanto o
  primeiro espera no semáforo, e é atendido logo depois dele; (c), que não depende da ordem dos índices: com o índice
  `(escola_id, chave_envio)` recriado no banco do teste depois do "um pendente por nome" (o teste confere o OID maior),
  o segundo envio recebe o 23505 do pendente por nome, com a chave do primeiro já gravada. No (c), um ponto de pausa
  entre a leitura inicial da chave e a transação faz o segundo envio ler a chave antes do commit do primeiro e fazer o
  `insert` depois dele; um espião no repository confirma o caminho (o 23505 do "um pendente por nome", seguido da
  releitura). A recriação do índice é feita numa transação só, e pulada quando o OID já está na ordem. Nos três, um
  pedido só, as duas respostas `enviado`, **nenhuma** `REIVINDICACAO_RECUSADA`, e os dois primeiros envios não mudam
  contador nenhum. No (c), um terceiro envio no
  mesmo nome com outra chave recebe o mesmo 23505 e, sem a própria chave gravada, `REIVINDICACAO_RECUSADA`, somando um
  no teto da turma (L6).
  **Quebra sem:** a releitura da chave, num comando novo, na escola e na turma do acesso, depois de qualquer 23505 ou
  `update` sem linha (com a classificação pelo nome da restrição, o (c) recebe a recusa)
- **C3** (integração) Aprovar × recusar o mesmo pedido; professor × coordenação; o mesmo lote duas vezes: um decide, o
  outro recebe `ja_decidida`; por pedido, exatamente uma auditoria e, quando a aprovação vence, exatamente um usuário e
  uma credencial. **Quebra sem:** o `update` condicional em
  `pendente`
- **C4** (integração) Reivindicar × retirar o mesmo nome livre: ou o pedido existe e o retirar recebe `CONFLITO`, ou o
  nome saiu e a reivindicação é recusada; nunca pedido de nome apagado nem 5xx. Um ponto de pausa controla a
  intercalação, como no C11. **Quebra sem:** o `delete` condicional
- **C5** (integração) Dois gerar na mesma turma, sem acesso e com acesso: no fim, um só vigente; o perdedor recebe
  `CONFLITO`, nunca 5xx. **Quebra sem:** o único parcial por turma
- **C6** (integração) Colisão: com o sorteio falso repetindo, na primeira vez, o código vigente de outra turma, o gerar
  sorteia de novo num savepoint e grava; com três colisões seguidas, 503 `INDISPONIVEL_TENTE_DE_NOVO`, sem 500 nem
  transação abortada. **Quebra sem:** o savepoint (a transação abortada pelo 23505 não grava o segundo sorteio)
- **C7** (integração) Dois cadastros do mesmo e-mail na mesma escola; cadastrar × refazer: um convite em aberto no fim.
  **Quebra sem:** `travarEscola`
- **C8** (integração) A mesma lista gravada duas vezes em paralelo: a contagem de uma vez. **Quebra sem:** `on conflict
  do nothing`
- **C9** (integração) Excluir a turma × gravar a lista: ou a turma sai e a lista recebe `NAO_ENCONTRADO`, ou a lista
  grava e o excluir recebe `CONFLITO`. **Quebra sem:** a FK mapeada
- **C10** (integração) `encerrar` × reivindicar e `encerrar` × aprovar: nunca sobra pedido pendente com hash nem aluno
  aprovado no ano encerrado. **Quebra sem:** o `for share` no ano dentro da transação da reivindicação e da decisão
- **C11** (integração) Excluir a turma × gerar o acesso, em paralelo, sem acesso vigente antes: ou a turma fica com o
  acesso vigente e o excluir recebe `CONFLITO`, ou a turma sai e o gerar recebe `NAO_ENCONTRADO`; nunca 201 com um
  acesso que o `cascade` já levou, nem 5xx. Um ponto de pausa segura o gerar depois do `insert` e antes do commit,
  enquanto o excluir corre; o `for update` da turma é um comando próprio, antes do `delete` com o `not exists`.
  **Quebra sem:** a trava da linha da turma, `for update` no excluir e `for share` no gerar (sem ela, o `not exists` do
  `delete` lê o retrato antigo)

## L — Limites e hash

- **L1** (integração) RF14: 35 reivindicações do mesmo IP no mesmo minuto, na mesma turma, de navegadores diferentes,
  com um erro de matrícula cada: nenhuma 429. **Quebra sem:** contagem por turma que recusa
- **L2** (integração) 100 códigos errados do mesmo cliente em 10 min, abaixo do teto da escola: o código certo abre sem
  espera nem 429, e nenhum cookie é lido. **Quebra sem:** um teto por cliente ou por IP menor que o da escola
- **L3** (integração) Rajada com erros e atacante: 1.000 códigos errados na escola em 10 min, sem cookie; o código
  certo continua abrindo, depois de 1 s, e sai `sala.limite_atingido{tipo="escola"}`, com a escola no log; a escola B,
  do mesmo IP, abre sem espera. Com o pool do banco no tamanho mínimo e 50 pedidos esperando o 1 s, uma leitura de
  outra rota não espera conexão: a espera vem antes da busca do acesso. **Quebra sem:** o teto da escola que só atrasa
  (se recusar, o código certo falha); a espera fora de transação e de conexão
- **L4** (integração) 6ª matrícula errada no mesmo nome livre: `LIMITE_EXCEDIDO` a esse nome, também com a matrícula
  certa, e sai `sala.limite_atingido{tipo="nome"}`; os outros 34 nomes da turma reivindicam. **Quebra sem:** o
  `listaNomeId` na chave do contador
- **L4b** (integração) O ator trava os 35 nomes da turma com o código X (5 matrículas erradas em cada); com X, os 35
  recebem `LIMITE_EXCEDIDO` mesmo com a matrícula certa. O professor gera o código Y; os 35 reivindicam com Y e a
  matrícula certa, e todos ficam pendentes. **Quebra sem:** o `acesso_turma` na chave do contador por nome
- **L5** (integração) 151 matrículas erradas na turma, espalhadas por 35 nomes (nenhum passa de 4): ninguém recebe 429;
  um espião no `SemaforoDeHash` registra a prioridade de cada pedido, e o 151º em diante entra rebaixado; sai
  `sala.limite_atingido{tipo="turma"}`. **Quebra sem:** o teto de fundo que rebaixa e não recusa
- **L6** (integração) O que cada caso faz com cada contador, lido no Redis: matrícula errada em nome livre soma no nome
  e na turma; nome inexistente, de outra turma ou escola, tomado e corrida perdida (C1) somam só na turma; reenvio com a
  mesma chave (E21, C2) não soma em nenhum; o reenvio em paralelo de uma matrícula errada soma duas vezes no nome,
  porque a chave não fica gravada no erro (aceito); código errado soma só na escola; pedido criado não soma. **Quebra
  sem:** a tabela de quem conta (Tech Spec, seções 5 e 7c)
- **L6b** (integração) Um ator reivindica um nome e depois repete o pedido nele, já tomado, 200 vezes em 10 min, com
  matrículas quaisquer: todas `REIVINDICACAO_RECUSADA`, nenhum contador por nome; do 151º em diante, o espião do
  semáforo vê o hash dele rebaixado. Com o semáforo cheio desses pedidos, 30 logins por matrícula da mesma escola
  entram, nenhum com 503. **Quebra sem:** contar no teto da turma toda tentativa que roda o hash e não cria pedido
- **L7** (integração) Com o Redis fora, o contador vai ao seguro em memória, e o teto cai para o dividido por
  `LIMITE_INSTANCIAS_API`. **Quebra sem:** `limiteDoSeguro` na comparação
- **L8** (unidade) `ContadorEmJanela` com janela de 10 min: a chave vence em 10 min; a instância do login continua com
  60 s. **Quebra sem:** a janela por parâmetro
- **L9** (integração) Semáforo: com o teto ocupado por reivindicações da escola A, o login da escola B recebe a vez no
  rodízio; nenhuma conexão do pool fica presa durante a espera; passado o prazo, 503 `INDISPONIVEL_TENTE_DE_NOVO` com
  `Retry-After`, sem gravar, e o reenvio com a mesma chave grava um pedido. **Quebra sem:** o hash no semáforo, no balde
  da escola, fora da transação
- **L10** (integração) `salas/*` contam no `rl:ip` anônimo: acima de `LIMITE_REQ_IP_ANONIMO_MIN`, 429
  `LIMITE_EXCEDIDO` com `Retry-After`. **Quebra sem:** `@RotaAnonima` nas rotas
- **L11** (unidade, `infra/test/alertas.test.ts` e `tools/guardas/alerta-tem-runbook.test.ts`) A regra "Código da
  turma errado em massa numa escola", em `infra/grafana/alertas/sala-codigo-errado-por-escola.yaml`: consulta
  `sala_limite_atingido_total{tipo="escola"}` somando as instâncias, sem agrupar por escola nem por usuário, com limiar
  de 10 por minuto e `for: 5m`, e tem a entrada de mesmo nome, completa, em `docs/runbook.md`; o comando que a entrada
  cita recebe o `escolaId`, que é o campo do log `sala.limite_atingido`. **Quebra sem:** a regra com o limiar e o `for:`
  declarados; a entrada do runbook; o comando aceitar o que o log entrega
- **L12** (infra, `infra/test/alertas.int.test.ts`, pelo `ensaio:alertas`) Numa escola sintética, códigos errados
  acima do teto de forma sustentada levam a regra a pendente e, passados os 5 min, a disparada; a rajada do primeiro
  dia (420 códigos errados em 5 min, como no K2) nem fica pendente; cessado o ataque, a regra volta a normal.
  **Quebra sem:** a métrica `tipo="escola"` emitida acima do teto; o limiar da regra

## A — Auditoria, log e resposta

- **A1** (integração) RF16: cada ação grava um registro com autor, escola e data, só com ids e contagens:
  `professor.cadastrado`; `convite.criado`, `.refeito`, `.revogado` e o aceite, com o tipo; `lista.gravada`, também no
  nome avulso; `lista_nome.retirado`; `acesso_turma.gerado` e `.revogado`; `reivindicacao.decidida` com `decidida_como`
  `professor` ou `coordenacao`. O perdedor de C3 e C5 não grava. **Quebra sem:** a gravação na transação de cada ação
- **A2** (integração) A coordenação lê a lista e os pedidos: `turma.lista_lida` e `turma.reivindicacoes_lidas` com a
  finalidade, na mesma transação da leitura, um registro por leitura, também em cada "Atualizar"; o professor com
  vínculo lê sem registro. **Quebra sem:** o registro (sem ele, sem lista)
- **A3** (integração) RF17, sentinela: nomes, matrículas, senha, token e código com valores únicos; nenhuma resposta das
  rotas novas, inclusive 400, 404, 409, 429 e 503, traz senha, hash, token ou código (fora da resposta que o cria),
  matrícula (fora da lista da coordenação) nem campo fora do contrato. **Quebra sem:** o DTO explícito
- **A4** (integração) Log capturado de todas as escritas e leituras novas: só ids; nada de nome, matrícula, senha,
  token, código nem slug. **Quebra sem:** o log por id
- **A5** (integração) No banco e na auditoria, o token e o código nunca em claro: `token_hash` é o `hashDoToken`, e
  `codigo_hmac` o HMAC com a chave própria. **Quebra sem:** o hash na gravação
- **A6** (integração) As rotas públicas não gravam `registro_acesso`. **Quebra sem:** a ausência de chamada ao
  `RegistroDeAcessoRepository` no `sala`
- **A7** (integração) `salas/abrir` e `salas/reivindicar` respondem `Cache-Control: no-store`. **Quebra sem:** o
  cabeçalho

## W — Web (e2e nos projetos `chromebook` e `celular`, com axe, salvo quando indicado)

- **W1** RF1 e RF18: o fluxo inteiro, com nomes gerados: a coordenação cria ano, série, disciplina, turma, lista,
  professor e alocação; o professor aceita, confirma e gera o acesso; o aluno reivindica pelo código; o professor aprova;
  o aluno entra e vê só a própria turma
- **W2** RF1: por papel, só os itens da fase (coordenação: Estrutura e Professores; professor: Turmas; aluno: Minha
  turma), e nenhum leva a tela inexistente; o professor abrindo o endereço de uma tela da coordenação cai em "não
  encontrada"; `document.title` muda por rota. **Quebra sem:** a guarda de papel em `rotas.tsx`
- **W3** RF2: o professor de A e B troca para B; a partir da troca, nenhuma requisição interceptada leva o token de A,
  nenhuma resposta traz id de A, e o cache do TanStack não guarda chave de A. **Quebra sem:** o `resetQueries` depois do
  token novo
- **W4** Os quatro estados de cada tela: carregando com `EstadoCarregando`; vazio com o texto e o próximo passo da
  tabela abaixo; com dado como na tabela; erro com `EstadoErro` e "Tentar de novo", com a rota interceptada (lista
  vazia e 503). **Quebra sem:** o estado na tela

  | Tela | Vazio → próximo passo | Com dado |
  |---|---|---|
  | Estrutura | "Comece pelo ano letivo" → roteiro até a alocação | o que falta |
  | Lista | "Cole a lista ou envie o arquivo: nome; matrícula" | prévia, erros primeiro |
  | Professores | "Nenhum professor ainda" → Cadastrar | estado do convite |
  | Alocação | "Crie uma turma e um professor primeiro" | vínculos |
  | Turmas | "A coordenação ainda não alocou você"; só pendente: "Confirme suas turmas" | confirmadas |
  | Pedidos | professor: "Nenhum pedido esperando" → Acesso; coordenação: "Os pedidos chegam quando o professor da turma gerar o acesso", sem botão | seleção |
  | Acesso | "Sem acesso ativo" → Gerar | validade |
  | Pública | "Se o seu nome não aparece, chame o professor"; vencido: o texto do W9 pelo caminho usado e, no link, o campo do código com o foco | nomes livres |
  | Minha turma | nunca vazia | turma, sem colegas |
- **W5** Fronteira: o `import()` de `coordenacao-*` e de `professor-*` abortado mostra "Confira a conexão e tente de
  novo" e troca o título da aba, que volta ao sair (o `componentWillUnmount`, pendência da A0b). **Quebra sem:** a
  fronteira em volta da área
- **W6** Decisão: o diálogo de "Aprovar N" (`oficial`) mostra turma, nomes e efeito; pela coordenação, o aviso de
  auditoria; "Recusar" (`perigo`) pede confirmação e diz que o nome volta; clique duplo em confirmar manda um pedido só;
  um `ja_decidida` aparece como "Já decidido por outra pessoa", e um `nao_encontrada` como "Este pedido não está mais
  disponível"; o pedido com `teveMatriculaErrada` mostra "Houve tentativa com matrícula errada neste nome; pode ter sido
  erro de digitação", sem número nem hora, também no diálogo de "Aprovar N"; o 41º não é selecionável, com o texto do
  limite; não existe "aprovar todos"
- **W7** Acesso: código em dois grupos de 4; "Gerar novo" pede confirmação e diz que o atual cai e que os nomes
  travados por tentativas erradas destravam; fechar sem copiar pergunta; sem o WhatsApp, o botão copia o texto
- **W8** Página pública: quando a primeira requisição sai, o endereço já não tem `#`; depois de abrir e de enviar,
  nenhum nome nem `chaveEnvio` em `localStorage`, `sessionStorage`, IndexedDB, Cache Storage ou no endereço; clique
  duplo em enviar manda um pedido, e o botão fica em carregamento até a resposta, também na espera de 1 s; o 503 mostra
  o texto e reenvia com a mesma chave até 3 vezes, cada uma depois do `Retry-After` somado a uma variação aleatória (o
  relógio falso prova que nenhum reenvio sai antes do `Retry-After` e que dois navegadores não saem no mesmo instante),
  e o quarto 503 mostra "Tentar de novo", sem reenviar sozinho; a recusa mostra o texto e recarrega os nomes; com
  `salas/abrir` interceptado respondendo o mesmo `NAO_ENCONTRADO`, o código digitado mostra o texto do código, com o
  campo preenchido e o foco nele, e o link mostra o texto do link com o campo do código logo abaixo e o foco nele; o 429
  mostra o texto do limite com os minutos do `Retry-After`, pelo nome (L4) e pelo `rl:ip` (L10); a tela depois do pedido
  traz o aviso sobre "matrícula ou senha incorretas"; "Tentando de novo…" sai numa região `role="status"`, e os erros
  numa `role="alert"`, ligadas ao campo por `aria-describedby`. **Quebra sem:** o texto escolhido pelo caminho da
  página; o teto de reenvios; a espera pelo `Retry-After`; o `role` e o `aria-describedby`
- **W9** (unidade) `MENSAGENS_DA_SALA`, com o texto de `NAO_ENCONTRADO` escolhido pelo caminho que a página usou (o
  servidor responde igual): código digitado, "Não encontramos turma com este código. Confira as letras e os números; se
  estiver certo, peça o código atual ao professor."; link, "Este link não vale mais. Peça o código atual ao professor.";
  `REIVINDICACAO_RECUSADA` "Não foi possível enviar. Confira a matrícula; se estiver certa, chame o professor.";
  `LIMITE_EXCEDIDO` "Muitas tentativas agora. Espere N minutos ou chame o professor.", com o N do `Retry-After` (em
  segundos) arredondado para cima, no mínimo 1, e "Espere 1 minuto" no singular (60 s dá 1 minuto, 61 s dá 2), o mesmo
  pelo nome e pelo `rl:ip`, sem prometer que um código novo destrava; `INDISPONIVEL_TENTE_DE_NOVO` "O sistema está cheio
  agora. Tentando de novo…" e, depois do terceiro reenvio, "O sistema está cheio agora." com "Tentar de novo"; nenhum
  texto com código de erro nem com "computador". **Quebra sem:** a escolha pelo caminho; o texto do limite sem "código
  novo" (falso no `rl:ip`); o arredondamento para cima e o singular
- **W10** Lista: arquivo em windows-1252 com `;` e acento (amostra do Excel) e em UTF-8 com BOM e `,`: a prévia mostra
  os nomes certos, com as linhas de erro primeiro e em texto
- **W11** Campos: código com `autocapitalize="characters"`; matrícula e senha com `autocomplete="off"`; matrícula com
  `inputmode="text"`; senha com "mostrar" e os 12 caracteres avisados
- **W12** 360 px: nenhuma tela nova com rolagem horizontal; abaixo de 768 px, cartões e gaveta; alvos de 44 px;
  teclado: selecionar pedidos e decidir só com Tab, Espaço e Enter, foco preso no diálogo e devolvido
- **W13** Seletor (P30): escola, rede e papel, sem número de turmas nem nada da outra escola; com uma escola só, mostra o nome e não
  abre
- **W14** Aceite do professor: conta nova cria a senha e vai à entrada; o link refeito mostra o texto de convite
  inválido, com "peça outro à coordenação"
- **W15** (unidade, relógio falso e `visibilitychange`) Professor: a lista de pedidos atualiza a cada 15 s com a aba
  visível e para com ela escondida; a atualização mantém os ids selecionados, o foco e os ids do diálogo aberto, e
  anuncia os pedidos novos numa região `aria-live="polite"`, sem roubar o foco. Coordenação: nenhuma leitura sai sem o
  clique em "Atualizar", nem com a aba visível por 60 s. **Quebra sem:** a seleção guardada por id; a atualização
  automática só para o professor

## K — Carga

- **K1** RF19: `reivindicacao-em-sala`, 6 turmas × 35 em 5 min, 20% de código e 10% de matrícula errados, pares de
  alunos disputando o mesmo nome no mesmo segundo, e o login de outra escola ao mesmo tempo, com nomes gerados e o
  adaptador de hash calibrado. Passa com zero duplicidade, zero 5xx
  e o p95 do login da outra escola na régua do F1
- **K2** A variante do primeiro dia da escola inteira: 2.100 alunos em 5 min, com os mesmos critérios

## Mapa

| Requisito ou caso | Cenários |
|---|---|
| RF1 | W1, W2 |
| RF2 | W3 |
| RF3 | E1, E2, C11 |
| RF4 | E3, E4, E5, W10 |
| RF5 | E6, E7, C8 |
| RF6 | E8, E9, R4, C7 |
| RF7 | E10, E11, W14 |
| RF8 | E12, P2 |
| RF9 | E13, E14, E15, E16, C5, C6, C11, W7, E29 |
| RF10 | E17, R2, R3, E24 |
| RF11 | C1, C2, E21, K1 |
| RF12 | E20, E30, C3, W6, W15 |
| RF13 | E18, E19, E22, R5, I8 |
| RF14 | L1 a L12, L4b, L6b, W8, W9 |
| RF15 | I3 a I8, I10, P1 a P5, R1 |
| RF16 | A1, A2 |
| RF17 | A3, A4, A5, P5 |
| RF18 | W4, W5, W11, W12 |
| RF19 | K1, K2 |
| Dois alunos com o mesmo nome | E24 |
| Aluno pega o nome do colega | R2, E25 |
| Aluno que chega em maio | E26, E7 |
| Turma sem professor alocado | E27 |
| Matrícula repetida ou já usada | E4, E7 |
| Convite aberto depois de refeito | R4, W14 |
| Link que circulou depois da semana | E28 |
| Aluno fecha a aba no meio | E23 |
| Virada de ano letivo | V1, V2, C10 |
| I7 da A0b | I7 |
| Força bruta distribuída no código (regra 80, item 10) | L3, L11, L12, E29 |
