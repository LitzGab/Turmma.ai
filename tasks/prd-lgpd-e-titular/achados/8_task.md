# Achados das revisões — `tasks/prd-lgpd-e-titular/8_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-09 12:46:58 · `tasks/prd-lgpd-e-titular/8_task.md`

VEREDITO: REPROVADO

**Cenários exigidos (8.0):**
- **Comando:** cadastrar e encerrar com a auditoria da operação; o encerrado fica no histórico; a chave encerrada pode ser cadastrada de novo.
- **Comando com lista:** a ligação nasce em cada escola listada; encerrar fecha as ligações; `CONFLITO` e `NAO_ENCONTRADO`.
- **Isolamento RF7:** a escola B não vê o suboperador `lista` que atende só A. Sem a correlação no `exists`, isso quebra.
- **Passado e vigência para a escola.**
- **DTO:** sem id, contrato, operador nem escola.
- **Arquitetura:** só os dois repositórios tocam as tabelas, e o leitor não escreve.
- **Concorrência:** dois cadastros e dois encerramentos da mesma chave ao mesmo tempo.
- **Banco:** os checks recusam o que o comando recusa.
- **Permissão:** aluno e professor não chegam a `/v1/privacidade/*`, e a coordenação sem MFA também não (`cenarios.md`, "Permissão").
- **e2e:** os quatro estados mais "só passadas", em `chromebook` e `celular`, com acessibilidade, e a segunda pessoa na mesma aba.

**Cobertos:**
- Os cenários de comando, lista, isolamento RF7, passado e vigência, DTO, arquitetura e banco estão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/suboperador.int.test.ts` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/arquitetura.test.ts`. As asserções são sobre o resultado: o que ficou no banco, o que a auditoria gravou e o que a escola lê.
- Conferi as mutações da seção "Mutações" contra o diff, uma a uma:
  - **Correlação do `exists`:** sem ela, a escola A, que tem outra ligação, passaria a ver o suboperador só de B (`:286`).
  - **Escola do `left join`:** sem ela, a mesma empresa sairia em linhas duplicadas (`:301`).
  - **`.for('no key update')`:** sem a trava, o `esperarNaTrava` nunca é atendido e os dois encerramentos dariam código 0 (`:435`).
  - **Índice único:** sem ele, o segundo cadastro não espera na trava e a contagem de 2 não chega (`:410`).
- **Concorrência é de verdade:** `GatilhoDeParada` é `after … for each row`, e o segundo pedido é confirmado esperando na trava (`pg_stat_activity`). Não há `Promise.all` solto.
- **e2e:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/privacidade.spec.ts:234-374` cobre vigentes, passadas, a outra escola, os estados e a segunda pessoa. O vazio vem de `rota.fulfill`, porque o banco acumula.
- **C2:** o `ops:suboperador` entrou, nas duas formas, na lista de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/ops-operador.int.test.ts:283-301`.
- Não há `.skip`, nenhum mock de coisa nossa, e não há IA envolvida.

**Bloqueantes:**
1. **O cenário de permissão não tem teste que rode no portão desta tarefa.**
   - **O que está errado:** a prova de que aluno e professor recebem 404 e a coordenação sem MFA recebe 401 em `GET /v1/privacidade/suboperadores` é o teste genérico em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/retencao.int.test.ts:370-393`. Ele percorre todas as rotas de `/v1/privacidade/`, então pegaria a rota nova, mas o arquivo não foi alterado nesta tarefa. O portão da tarefa só roda os testes alterados (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tools/processo/portao-local.ts:92-95`), e a regra 40 exige que "a regra da tarefa precisa de teste criado ou alterado na própria tarefa". Hoje a regra de permissão desta rota só seria provada no portão completo, no fim da spec.
   - **Agravantes:** o comentário em `retencao.int.test.ts:371-372` ("Hoje só o GET da retenção…") ficou falso. A tabela "Testes que provam a regra" do `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/8_task.md` não tem a linha de permissão.
   - **Correção exigida:**
     - Em `retencao.int.test.ts`, no teste de permissão, afirmar que a lista de rotas contém `/v1/privacidade/suboperadores`, por exemplo `expect(rotas.map((r) => r.caminho)).toContain('/v1/privacidade/suboperadores')`. Assim a rota não pode sair do módulo sem o teste reclamar.
     - Atualizar o comentário de `:371-372`. Com isso o arquivo passa a ser alterado e roda no portão da tarefa.
     - Acrescentar a linha "permissão" na tabela da `8_task.md`.

**Recomendações (não bloqueiam):**
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0029_suboperador.sql:7` cita `suboperador-banco.int.test.ts`, que não existe. A comparação está em `suboperador.int.test.ts`, no teste "banco: recusa…".
- Em `arquitetura.test.ts`, `tabelasDeForaNoRepository(leitor.texto, GRUPO_DO_SUBOPERADOR)` só enxerga import de `@educa/nucleo` ou de `schema/operador|suboperador`. O leitor mora no `nucleo` e importaria outra tabela por caminho relativo (`../db/schema/escola.js`) sem ser pego. Para o leitor, essa asserção é mais fraca do que parece. A regra exigida ("não escreve") está provada.
- No e2e, `violacoesGraves` e `larguraExcedente` só rodam no estado com dado. Vazio, erro e "só passadas" ficam sem a verificação de acessibilidade e de largura, como na retenção. Vale estender no teste dos estados.
- O caminho `ERRO_INTERNO` com `resumirErro` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/ops/suboperador.ts:224` não tem teste que prove que o erro cru do Postgres não vaza valor. O padrão é o mesmo dos outros `ops:*`; se algum deles já tiver esse teste, vale um caso aqui.
- `auditoria.int.test.ts`, "escola nula com operador é aceita…": a asserção é só não lançar. Conferir as duas linhas gravadas antes do `delete` deixaria o teste explícito.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-09 12:48:11 · `tasks/prd-lgpd-e-titular/8_task.md`

VEREDITO: APROVADO

Estados: ok. Carregando usa `EstadoCarregando` com o rótulo "Carregando as empresas que recebem dados…". O erro usa `EstadoErro` com "Tentar de novo" e mensagem pelo catálogo, sem código HTTP. O vazio das vigentes diz "Nenhuma empresa recebe dado desta escola" e explica o que aparecerá. A seção de passadas só existe quando há alguma. O caso "só passadas, sem vigentes" tem tratamento e e2e próprios. O e2e cobre os quatro estados com `page.route` e `portao`.

Acessibilidade:
- **Estrutura:** cada seção tem `section` com `aria-labelledby` e `h2`. A `Tabela` tem `caption`, `th scope=col` e `th` de linha, e vira região focável só quando rola.
- **Abas:** seguem o padrão WAI-ARIA, com setas e Home/End.
- **Cor:** o selo de treinamento nunca é só cor, porque o texto é obrigatório e vem com ícone.
- **Teste automático:** o e2e roda `violacoesGraves` em cada projeto.

Chromebook fraco: sem peso novo.
- A aba reaproveita a `Tabela` e os componentes de estado existentes, sem biblioteca nem fonte nova.
- A lista é pequena (poucas empresas por escola) e a API não devolve a tabela da operação inteira, então não precisa de virtualização.
- O `Intl.DisplayNames` é nativo.
- O e2e roda com o perfil de CPU ×4 e Fast 3G do projeto `chromebook`.

Celular: ok.
- A `Tabela` vira lista com `dt`/`dd` abaixo de 768 px, e os blocos têm `min-w-0` e `break-words`.
- As abas têm 44 px de altura no celular.
- Não há hover nem atalho.
- O e2e checa `larguraExcedente == 0` e `violacoesGraves` nos dois projetos (`chromebook` e `celular`). O `locator('tr, li')` cobre as duas estruturas.
- A aba é só leitura e nenhum fluxo exige o celular.

Ação oficial protegida: sim. A tela é só leitura. Cadastro e encerramento ficam na operação, por comando auditado, e não há botão que grave algo oficial.

Verificações que fiz:
- Li `EmpresasQueRecebemDados.tsx`, `Privacidade.tsx`, `textos-dos-suboperadores.ts`, as fixtures e o diff do e2e.
- Rodei os testes de unidade de `privacidade/` e de `formatar` (15 verdes).
- Não rodei o e2e, porque precisa do ambiente completo.
- Não auditei o backend nem a tenancy. Isso é dos guardiões.
- Português do Brasil, datas `dd/mm/aaaa` via `Intl`, país por nome ("Brasil", "Estados Unidos") e categorias em linguagem comum.
- O seletor de escola (item 13) é da área do professor e não se aplica à coordenação.

Bloqueantes: nenhum.

Recomendações:
- `packages/shared/src/privacidade/suboperador.ts:42` mostra "data, hora e IP de cada entrada". "IP" é termo técnico para uma coordenação não técnica. Sugestão: "endereço de rede (IP)" ou "de qual rede cada entrada veio".
- `EmpresasQueRecebemDados.tsx:15` usa a família `pendente` (laranja, ícone de relógio) para "O contrato não proíbe usar o dado para treinar IA". O relógio sugere algo esperando a pessoa, mas aqui é um aviso. A família `info` ou `erro` diria melhor o que o fato é.
- `EmpresasQueRecebemDados.tsx:49`: o vazio descreve o que virá, mas não diz o que a coordenação pode fazer. Isso é aceitável numa aba só de leitura. Uma frase como "Se o responsável perguntar, a resposta é: nenhuma" daria uma saída prática.
- O título "Treinar IA com o dado" (`EmpresasQueRecebemDados.tsx:15`) lê melhor como pergunta ou fato: "Pode treinar IA com o dado?".

Arquivos revisados (caminhos absolutos):
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/EmpresasQueRecebemDados.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/textos-dos-suboperadores.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/privacidade.spec.ts`

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-09 12:48:16 · `tasks/prd-lgpd-e-titular/8_task.md`

VEREDITO: APROVADO

**Tabelas verificadas:**
- `suboperador` não tem `escolaId`, e essa exceção está declarada e justificada. A tabela pertence à operação, como as seis do operador, e a justificativa está em `docs/modelo-de-dados.md`, no item 1 das regras transversais e na seção "Os suboperadores". Também não tem `anoLetivoId`, o que está certo, porque não varia por ano letivo.
- `suboperador_escola` tem `escola_id` e chave primária `(escola_id, suboperador_id)`, com o escopo na frente.
- O check da `auditoria`, agora `auditoria_escola_ou_operacao_global`, só aceita linha sem escola com `autor_operador` e para as entidades `rede` e `suboperador`.
- O único leitor de `auditoria`, `packages/nucleo/src/auditoria/auditoria.repository.ts:45`, filtra por `escola_id`. As linhas sem escola não chegam a nenhuma escola.
- Ids são UUID, gerados por `uuidv7()`.

**Queries verificadas:**
- `SuboperadorDaEscolaRepository.daEscola` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/suboperador-da-escola.repository.ts:41-83`):
  - A escola vem de `exigirEscolaDoContexto()`, ou seja, do token.
  - O filtro é `or(alcance='todas', exists(...))`, com o `exists` amarrado ao suboperador da linha e à escola do contexto.
  - O `left join` também filtra pela escola.
  - Não tem `@SemEscopo`.
- `GET /v1/privacidade/suboperadores` não aceita parâmetro nenhum, nem `escolaId` no corpo ou na query. A permissão `privacidade_suboperadores` é só do coordenador, com `unidade`; os outros papéis ficam em `nunca`. A resposta passa por um schema estrito e sai sem id, sem contrato, sem o operador e sem as outras escolas.
- `OperacaoPrivacidadeRepository` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/ops/operacao-privacidade.repository.ts`):
  - `ligarEscola` grava o `escola_id` do contexto, nunca de argumento.
  - `encerrarLigacoes` é o único `@SemEscopo`, com a justificativa escrita. Ele grava só a data de fim e devolve só a contagem. O teste de arquitetura confere que é o único.
  - Os demais métodos tocam só a tabela global da operação.
- O `ops:suboperador` recebe as escolas por argumento, mas é comando do operador, não endpoint de cliente. Ele abre o contexto de cada escola e confere se ela existe (`AcessoDaEscolaRepository.nome()`).
- A rota não tem id, então não há resposta diferente que confirme a existência de dado de outra escola. As mensagens de `CONFLITO` e `NAO_ENCONTRADO` só aparecem no terminal da operação.
- Esta tarefa não tem consulta agregada da camada de rede. A rede fica em `nunca` na matriz.

**Teste de isolamento:** presente e efetivo. Removi cada cláusula de cabeça e todos quebram:
- **`exists` sem a ligação com a escola** (`eq(outra.escolaId, escolaId)` removido): B passa a ver o suboperador que só atende A. Quebra `suboperador.int.test.ts:276`.
- **`exists` sem a correlação com o suboperador** (`eq(outra.suboperadorId, suboperador.id)` removido): A, que tem ligação, passa a ver o suboperador que só atende B. Quebra a mesma asserção.
- **Sem o `exists` inteiro**: A deixa de ver o seu. Quebra.
- **`left join` sem o filtro de escola**: a linha se duplica com a ligação da outra escola. Quebra o teste "passado" (`:293`).
- O e2e confere de novo que o suboperador da outra escola não aparece.

Bloqueantes: nenhum

**Recomendações:**
- `daEscola` lê a tabela `suboperador` inteira a cada GET. Hoje ela é pequena e não cresce com aluno. Se um dia passar de algumas centenas de linhas, vale um índice por `alcance` ou um limite.
- No C2 de `ops-operador.int.test.ts`, o `afterAll` apaga `suboperador` sem apagar antes as linhas de `suboperador_escola`. Hoje não importa, porque os dois cadastros do C2 são `todas`, mas quebra se um caso futuro usar `lista`. Vale replicar a ordem de limpeza do `suboperador.int.test.ts`.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-09 12:48:18 · `tasks/prd-lgpd-e-titular/8_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: um só, `suboperador.registrado_por`, o apelido do operador Turmma (nossa equipe). O resto das duas tabelas novas é dado de empresa: chave, nome, finalidade, país, categorias, código do contrato, veda treinamento e vigência. `suboperador_escola` guarda só escola, suboperador e as datas. Nenhuma pessoa da escola e nenhum aluno, e as duas tabelas estão como `SEM_PESSOA` em `classificacao.ts`.

Fora da tabela de dados do docs/lgpd.md: nada. A linha nova em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/docs/lgpd.md:91` traz finalidade, base legal e retenção: o encerrado fica como histórico e a auditoria vale pela vigência mais 5 anos. Nenhum campo proibido para aluno. Necessidade específica não se aplica.

Autorização por objeto: ok.
- `GET /v1/privacidade/suboperadores` só atende o coordenador, no escopo da unidade. Rede, professor e aluno estão em `nunca` na matriz e na expectativa dela.
- O escopo sai de `exigirEscolaDoContexto()`, do token. A rota não tem id na URL, então não há objeto para trocar.
- O filtro `(alcance = 'todas' or exists ligação correlacionada)` vem entre parênteses, e o `left join` também fica preso à escola do contexto.
- Os mutantes que tiram a correlação ou a escola do `exists` derrubam `suboperador.int.test.ts › RF7, isolamento`.
- A escrita da ligação usa o `escola_id` do contexto aberto para cada escola. Escola inexistente dá `NAO_ENCONTRADO` e desfaz tudo.

DTO: explícito. O service monta a resposta campo a campo e confere com um `z.strictObject`. O teste confere as chaves exatas e afirma que o corpo não leva contrato, operador, id do suboperador nem `escolaId`. A resposta sai com `Cache-Control: no-store`.

Logs: limpos. Não há logger nos arquivos novos. O comando imprime só o nome da opção, nunca o valor. O erro de domínio sai com texto fixo, e o erro do banco sai pelo `resumirErro`.

Auditoria: presente.
- `suboperador.cadastrado` e `suboperador.encerrado` gravam o autor operador e a finalidade fixa.
- O schema é fechado, sem texto livre: só alcance e contagens. O teste prova que um `nome` dentro do `depois` é recusado.
- A auditoria sem escola só vale para operador, e o banco também cobra isso, pelo check `auditoria_escola_ou_operacao_global`.
- A leitura pela coordenação não é leitura de dado de aluno, então não exige registro.

Envio externo: nenhum nesta tarefa. A tarefa cadastra para onde o dado vai: categorias, país e se o contrato veda treinamento. A `chave` tem o formato do `IA_PROVEDOR_ID`, o que prepara o cruzamento com `consumo_ia.provedor` na tarefa 12.0.

Seed/fixture: sintético. `cadastrarSuboperadorDeTeste` usa chave `e2e-<uuid>`, `DPA-E2E` e `equipe-de-teste`. Os testes de integração usam nomes como "Empresa Sintética" e "Alfa/Zeta <uuid>".

Pergunta de fechamento: em parte, e dentro do escopo. Hoje o código responde por que empresas o dado da escola passa, vigentes e passadas, com país e categorias. O recorte por aluno, isto é, para onde o dado daquele aluno foi, é a tarefa 12.0, declarada fora do escopo. Esta tarefa entrega a base que a 12.0 precisa e não impede nada.

Bloqueantes: nenhum.

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/docs/lgpd.md:91`: a finalidade diz "prestação de contas à escola sobre quem cadastrou". Mas o `registrado_por` não sai no DTO, e a auditoria sem escola não aparece no rastro da escola. Ajuste o texto, por exemplo para "prestação de contas da operação", ou registre como a escola chega a essa informação.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0029_suboperador.sql:49`: a FK `suboperador_escola.escola_id` usa `ON DELETE no action`. Hoje nenhuma rotina apaga escola. Quando existir a eliminação do tenant no fim do contrato, ela precisa tratar a ligação, ou esse caminho trava.
3. A lista `ENTIDADES_DE_AUDITORIA_SEM_ESCOLA` (`registro-de-auditoria.ts:23`) repete o literal do check do banco. Hoje os testes de auditoria cobrem os dois lados. Se uma terceira entidade entrar, convém um teste que compare a constante com o check da migration, como já se faz com as categorias.
4. Para a tarefa 12.0: o compartilhamento do titular deve casar `consumo_ia.provedor` com o suboperador vigente na data da chamada, e não com o de hoje, porque a chave encerrada pode ser cadastrada de novo.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-09 12:49:04 · `tasks/prd-lgpd-e-titular/8_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: há uma divergência em `techspec.md` §6 ("Tarefa 8.0, como ficou no código"): o texto diz uma coisa sobre o `cadastrar` e o código faz outra.
Portão local: carimbo válido. Ele vai caducar com as correções abaixo e precisa ser refeito com `node tools/processo/portao-local.ts --tarefa`.

Bloqueantes:

1. **A Tech Spec descreve um `cadastrar` que não é o do código.**
   - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/techspec.md:364` diz que o `cadastrar` é `insert … on conflict (chave) where fim is null do nothing`.
   - O código, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/ops/operacao-privacidade.repository.ts:60`, usa `.onConflictDoNothing()` sem alvo nem predicado.
   - A tabela "Mutações" da `8_task.md` (linha 104) registra que o alvo e o predicado saíram. A mudança ficou registrada só no `N_task.md`, e a seção que se apresenta como "como ficou no código" ficou falsa.
   - A diferença tem efeito: sem alvo, qualquer índice único que entrar depois em `suboperador` será engolido e respondido como `CONFLITO` "já existe vigente".
   - Correção exigida: escolher um dos dois caminhos.
     - Atualizar `techspec.md:364`: `on conflict do nothing` sem alvo, com o motivo (o único índice único além da chave primária é o parcial da chave vigente) e o risco de engolir um índice novo.
     - Ou devolver ao código o alvo `(chave) where fim is null` e manter a Tech Spec.

2. **O bloqueante da 1ª rodada do `test-engineer` continua aberto.** O prompt diz que o `test-engineer` já aprovou, mas a única rodada dele é REPROVADO, às 12:46:58.
   - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/retencao.int.test.ts:370-373` não foi alterado.
   - A permissão de `GET /v1/privacidade/suboperadores` (aluno e professor recebem 404, a coordenação sem MFA recebe 401) só é provada por esse teste genérico. Ele não roda no portão da tarefa, e a regra 40 exige teste criado ou alterado na própria tarefa.
   - O comentário de `:371-372` ("Hoje só o GET da retenção") ficou falso.
   - Correção exigida, a mesma do `test-engineer`:
     - afirmar no teste que a lista de rotas contém `/v1/privacidade/suboperadores`;
     - corrigir o comentário;
     - acrescentar a linha "permissão" na tabela "Testes que provam a regra" da `8_task.md`.
   - Depois disso, chamar de novo o `test-engineer`, antes do `revisor-geral`.

Recomendações:
- **Arquivo de teste inexistente.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0029_suboperador.sql:7` cita `suboperador-banco.int.test.ts`, que não existe. A comparação está em `apps/api/test/suboperador.int.test.ts`, no teste "banco: recusa…". A migration ainda não foi commitada, então dá para corrigir agora.
- **Campo lido e nunca usado.** `SuboperadorVigente.chave`, em `operacao-privacidade.repository.ts:19` e `:79`, é selecionado e ninguém o lê.
- **Vigência anterior à existência da escola** (lacuna da spec, não da implementação). Uma escola criada depois que um suboperador `todas` foi encerrado o vê como "passada", com um período em que ela nem existia. A vigente `todas` também mostra "Desde" anterior à escola. Isso informa errado ao titular (LGPD, art. 18, VII) e vai pesar no compartilhamento da 12.0.
  - Vale levar à Tech Spec: limitar a data ao início da escola, ou omitir o `todas` que terminou antes dela.
- **Parâmetro booleano.** O `listaDe(…, minuscula = false)`, em `suboperador.ts:104`, recebe um booleano posicional. Duas funções, ou o normalizador passado como argumento, leriam melhor.

## test-engineer · 2ª rodada · APROVADO · 2026-10-09 12:56:30 · `tasks/prd-lgpd-e-titular/8_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os mesmos da 1ª rodada. Esta rodada confere a correção exigida e o diff desde então.

**Cobertos:**
- **Correção 1 feita.**
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/retencao.int.test.ts:374` passou a exigir `/v1/privacidade/retencao` e `/v1/privacidade/suboperadores` na lista de rotas, com `arrayContaining`. Isso substitui o `toBeGreaterThan(0)`.
  - O laço afirma para cada rota: coordenação recebe 200, aluno e professor recebem 404 com `NAO_ENCONTRADO`, e o desafio sem MFA recebe 401 com `NAO_AUTENTICADO`.
  - Como o arquivo agora está alterado, ele roda no portão da tarefa.
  - O comentário foi corrigido e agora é verdadeiro.
  - Se `@Get('suboperadores')` sair do controller, o teste falha. A linha 122 de "Mutações" registra isso.
- **Linha "permissão" na tabela "Testes que provam a regra":** presente em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/8_task.md:53`.
- **Resto do diff.** Nenhuma mudança deixa regra sem prova.
  - **`listaDe` com função de normalização:** o comportamento não muda. As escolas continuam em minúscula e as categorias ficam como vieram. O caso `suboperador.int.test.ts` › "RF6, lista" (`a.toUpperCase()`, linha 231) cobre a normalização das escolas.
  - **`chave` retirada de `SuboperadorVigente` e do select:** ninguém mais usa o campo; o único uso de `travarVigente` está na linha 168 e não lê `chave`.
  - **Limpeza de `suboperador_escola` no `afterAll` de `ops-operador.int.test.ts`:** corrige a ordem de remoção por causa da chave estrangeira. Não muda nenhuma asserção.
  - **Mudanças em `docs/lgpd.md`, no comentário da migration 0029 e na techspec:** só texto. O `onConflictDoNothing()` sem alvo já estava registrado em "Mutações" (linha 105), com a prova na concorrência e no índice.
- **Recomendações recusadas na 1ª rodada:** estão justificadas em "Recomendações sem aplicar" (linhas 138 a 141). Nenhuma era bloqueante.

**Bloqueantes:** nenhum.

**Recomendações:**
- A techspec registra um risco aceito: um índice único novo em `suboperador` seria engolido pelo `on conflict do nothing` e respondido como `CONFLITO`. Vale um teste de arquitetura ou um teste no banco que liste os índices únicos de `suboperador` e falhe se aparecer um novo. Assim o risco deixa de depender de alguém lembrar. Fica para o `/retro`.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-09 12:57:13 · `tasks/prd-lgpd-e-titular/8_task.md`

VEREDITO: APROVADO
Estados: ok. Nenhum arquivo de tela mudou desde a minha rodada. O diff é só API, teste, documentação e migration, e os quatro estados da tela da 1ª rodada ficam como estavam.
Acessibilidade: sem mudança. O diff não toca nenhum `.tsx`, nem teste ou texto da interface.
Chromebook fraco: sem mudança. Nada de lista, imagem ou bundle foi alterado.
Celular: sem mudança. Não há tela nova nem alterada.
Ação oficial protegida: sim. Esta tarefa não adiciona ação oficial. O cadastro e o encerramento de suboperador seguem pelo comando da operação, e o diff não altera isso.
Bloqueantes: nenhum. Conferi cada trecho do diff.
- `operacao-privacidade.repository.ts`: o campo `chave` saiu do tipo `SuboperadorVigente` e do `select`. Nada que o usuário final veja depende dele.
- `suboperador.ts`: `listaDe` agora recebe a função de normalização. As categorias ficam como estavam. As escolas continuam em minúsculas, como antes. O comportamento é o mesmo.
- `ops-operador.int.test.ts`: o teardown passou a apagar `suboperador_escola` antes de `suboperador`. Isso corrige a limpeza do teste e não afeta a tela.
- `retencao.int.test.ts`: o teste de permissão agora exige as rotas `/v1/privacidade/retencao` e `/v1/privacidade/suboperadores`. Isso reforça a regra de que aluno, professor e coordenação sem MFA não chegam às rotas de privacidade.
- `docs/lgpd.md`: o texto diz que o apelido do operador não sai para a escola. Isso é coerente com a tela da 1ª rodada, que mostra as empresas sem esse campo.
- `0029_suboperador.sql`: só o comentário mudou, apontando para o arquivo de teste certo.
- `techspec.md`: registra o `on conflict do nothing` sem alvo, com o risco aceito escrito.

Recomendações: nenhuma nova. As recusadas pela Mesa na 1ª rodada seguem registradas em "Recomendações sem aplicar" do `8_task.md`.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-09 12:57:15 · `tasks/prd-lgpd-e-titular/8_task.md`

VEREDITO: APROVADO

Esta rodada auditou só o diff entre a 1ª rodada e a 2ª. A 1ª rodada não exigiu nenhuma correção, então não havia correção a conferir.

**Campos pessoais tocados:** só `suboperador.registrado_por`, o apelido do operador Turmma. A linha dele em `docs/lgpd.md:93` agora diz que a finalidade é a prestação de contas da operação e que "o apelido não sai para a escola". Conferi no código e é verdade. O campo só é escrito, em `apps/api/src/ops/suboperador.ts:142` e `apps/api/src/ops/operacao-privacidade.repository.ts:57`. Ninguém o lê, nem o repositório da coordenação, nem `packages/shared`, nem `apps/web`. A rota `/v1/privacidade/suboperadores` não o devolve.

**Fora da tabela de dados do docs/lgpd.md:** nenhum.

**Autorização por objeto:** ok.
- O teste de permissão em `apps/api/test/retencao.int.test.ts:81` agora exige que as duas rotas de `/v1/privacidade/` existam, a da retenção e a dos suboperadores. Antes bastava haver uma rota qualquer. Se uma das duas sumir, o teste falha.
- O teste continua provando que aluno, professor e coordenação sem MFA ficam de fora de todas as rotas do módulo.

**Logs:** limpos. O diff não acrescenta log nenhum.

**Auditoria:** presente. O `suboperador.encerrado` continua sendo gravado com `entidadeId` e `antes: { alcance }`. O campo `chave` saiu de `SuboperadorVigente` porque não era lido. A trilha de auditoria não perdeu nada: a chave nunca entrou no `antes`, e o comentário em `suboperador.ts:42` diz que a auditoria não leva texto livre.

**Envio externo:** nenhum novo neste diff.

**Seed/fixture:** sintético. A mudança em `apps/api/test/ops-operador.int.test.ts:211` só passa a apagar o `suboperador_escola` das chaves que o próprio teste criou, antes de apagar o `suboperador`.

**Bloqueantes:** nenhum.

**Recomendações:**
- `apps/api/src/ops/operacao-privacidade.repository.ts:59`: o `onConflictDoNothing()` ficou sem alvo. A techspec registra isso como risco aceito: se alguém criar outro índice único em `suboperador`, o conflito nele também vira `CONFLITO` sem aviso. Do ponto de vista de privacidade não vaza nada. Ainda assim, um teste que fixe o conjunto de índices únicos da tabela faria esse risco quebrar a esteira, em vez de depender de alguém lembrar.

**Pergunta de fechamento:** nada mudou em relação à 1ª rodada. A lista de empresas que recebem dados de cada escola, com o histórico das que já saíram, continua consultável por código.
