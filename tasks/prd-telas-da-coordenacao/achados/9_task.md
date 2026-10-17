# Achados das revisões — `tasks/prd-telas-da-coordenacao/9_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-16 23:02:52 · `tasks/prd-telas-da-coordenacao/9_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. A tela mostra o que já mostrava. Do aluno: nome, matrícula e estado do nome, que agora aparecem em tabela; aprovado continua sem nome nem matrícula. Do professor: nome, disciplina e estado do vínculo, em `ProfessoresDaTurma.tsx`. Não há migration, contrato nem endpoint novo. A tarefa só mexe no frontend e nos testes.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. Nenhuma rota nova. A tela continua usando `GET /v1/turmas/:id` e `/lista`, com a finalidade `conferencia_de_cadastro`, e os pedidos só no "Atualizar". As leituras novas, `consultaVinculos`, `consultaProfessores` e `consultaTurmas`, já existiam, ficam no escopo da escola do token e não carregam dado de aluno. Fazem só filtro de exibição por `turmaId` no cliente (`ProfessoresDaTurma.tsx:83`), não autorização. O complemento da contestação, texto escrito pelo professor, não é mostrado, e o caso "o contestado não mostra o complemento do professor" prova isso.

Logs: limpos. O diff não acrescenta nenhum log.

Auditoria: presente, e as leituras auditadas não mudaram.
- A lista de nomes é lida uma vez ao abrir a turma, com a finalidade. Provam isso `ListaDaTurma.test.tsx` ("as leituras da tela") e `e2e/lista-da-turma.spec.ts:788`.
- Os pedidos só são lidos depois do clique em "Atualizar". Provam isso o teste de componente e `e2e/pedidos.spec.ts`.
- Vínculos e professores não vão com finalidade, e os testes conferem isso. Está correto, porque não é dado de aluno nem indicador de professor. Também não aparece nenhum sinal de uso nem de adoção (D45, D64).

Envio externo: nenhum.

Seed/fixture: sintético. As fotos mostram "Colégio sintético da vitrine", "Aluna Sintética Bia Vitrine", "Professor Sintético Davi" e matrículas 9000000x. Os testes usam "Camila Sintética", "Aluno N" e matrículas geradas.

Fotos: o que a tela mostra bate com o que o código promete.
- Nome e matrícula do aluno aparecem só para a coordenação, numa leitura auditada, e só para nome livre ou reivindicado (`.processo/vitrine/coordenacao--...--celular-1.png` e `celular-2.png`).
- Os professores aparecem com nome, disciplina e estado em texto. O link leva só o `usuarioId`, via `caminhoDoProfessor` em `apps/web/src/caminhos.ts:104`.
- Os pedidos aparecem como "Clique em Atualizar", sem nenhuma leitura feita antes (`*--computador.png` e `vazia--*`).
- Não aparece dado de aluno no endereço nem fora do que a coordenação já via. O e2e "Sem rastro" continua de pé e cobre o armazenamento do navegador e a URL.

Pergunta de fechamento: esta tarefa não muda o que o sistema guarda nem para onde envia, então a resposta sobre um aluno continua a mesma de antes dela.

Bloqueantes: nenhum.

Recomendações:
- `ProfessoresDaTurma.tsx:78`: quando a lista de professores não traz o professor do vínculo, a tela mostra "Professor". Seria melhor um texto que deixe claro que o nome não foi carregado, para a coordenação não achar que é um registro sem nome. É questão de texto, não bloqueia.
- Fora da minha regra, fica para o `frontend-reviewer`: nas fotos de 1366 px o complemento do título mostra só "2º ano do Ensino Médio", sem o turno que a subtarefa 9.1 pede. Pode ser só o dado da vitrine, mas vale conferir.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-16 23:02:57 · `tasks/prd-telas-da-coordenacao/9_task.md`

VEREDITO: APROVADO

Tela vista: sim (6 fotos lidas, cheia e vazia, computador e celular). A tabela "Nomes da turma" não aparece na foto de 1366 px, porque fica abaixo da dobra, dentro do miolo que rola. Vi a tabela só como lista, na foto do celular. O desenho de duas colunas a 1366 px, com a tabela, é provado só pelo e2e `e2e/lista-da-turma.spec.ts:655`. Pela foto, não o conferi.

Estados: ok.
- **Carregando e erro:** a turma, a lista de nomes e os professores têm carregando e erro próprios. Cada um traz "Tentar de novo" que relê só a leitura que falhou. Conferi pelo código (`ProfessoresDaTurma.tsx:60-75`, `ListaDaTurma.tsx`) e pela lista de casos de `ListaDaTurma.test.tsx`.
- **Vazio:** "Nenhum nome nesta turma ainda" convida a colar a lista, e a foto vazia do celular mostra o bloco com borda tracejada. "Nenhum professor nesta turma" traz a ação "Ver os professores".
- **Com dado:** nomes e professores aparecem nas fotos cheias.
- **Turma que saiu do ano:** continua com o texto de antes.

Acessibilidade: ok.
- A tabela tem `caption`, `th` de coluna e `th` de linha.
- O botão "Retirar" leva nome e matrícula no nome acessível (`sr-only`).
- O miolo que rola recebe `tabIndex=0` só a partir de 768 px (`ListaDaTurma.tsx:211-215`), e o e2e prova o teclado alcançando-o e o axe sem violação grave.
- O estado do vínculo e a situação do nome vêm em texto, não só em cor.

Chromebook fraco: ok.
- A lista continua paginada ("Ver mais nomes").
- A `Tabela` monta uma estrutura de cada vez, pela largura.
- A página não rola a 1366 × 768 e só o miolo rola, provado pelo e2e.
- Nenhuma leitura nova é auditada: o turno vem de `consultaTurmas`, que não leva finalidade, e os professores vêm de `consultaVinculos` e `consultaProfessores`.

Celular: ok.
- A 360 px é uma coluna, sem rolagem horizontal nem texto cortado nas fotos (`larguraExcedente` é 0 no e2e).
- A tabela vira lista com "Matrícula" e "Situação" em texto.
- Os botões "Retirar", "Acrescentar um nome", "Ver a prévia" e "Atualizar" têm altura de toque adequada na foto. Não medi os pixels.
- O e2e roda nos projetos `chromebook` e `celular`.

Ação oficial protegida: sim.
- Nesta tarefa não há ação oficial nova. "Retirar" passa por `ConfirmacaoDePerigo`, e a decisão dos pedidos continua na `ListaDePedidos`, que não mudou.
- Os pedidos só são lidos no "Atualizar", e a foto mostra o aviso de que a consulta fica registrada.
- Nenhuma saída de IA aparece nesta tela.

Bloqueantes: nenhum.

Recomendações:
1. **Texto em inglês no seletor de arquivo.** "Choose File / No file chosen" aparece nas fotos do computador e do celular. É o campo nativo do navegador, que usa o idioma do navegador. A foto sai em inglês porque o Chromium da vitrine está em en-US. Num navegador em pt-BR sai "Escolher arquivo". O campo não foi mexido nesta tarefa. Duas saídas: fixar `locale: 'pt-BR'` no contexto da vitrine, para a foto não induzir a erro, ou trocar o campo por um botão em português que acione o `input` escondido. A segunda passa por `SubirLista`, em `ListaDaTurma.tsx`.
2. **Nome do professor truncado.** Na coluna de 19 rem o título da `Linha` fica com reticências ("Professor Sintético Davi c…"). Isso é o comportamento da peça da X1, que guarda o texto inteiro em `title`. Mas `title` não aparece no toque, então no celular o nome só se completa abrindo o painel do professor. Vale checar com nomes reais longos, na validação.
3. **Foto do 1366 px.** A tabela só se vê no celular. Vale a vitrine ganhar um jeito de rolar o miolo ou de fotografar a região, para a revisão ver a tabela no computador.
4. **Texto do vazio.** "no campo acima" em "Nenhum nome nesta turma ainda" funciona, mas a 1024 px ou mais o campo está acima e à esquerda, e no celular acima. Está correto nos dois, sem ajuste necessário.

Arquivos principais:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/ListaDaTurma.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/ProfessoresDaTurma.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/lista-da-turma.spec.ts`

## test-engineer · 1ª rodada · APROVADO · 2026-10-16 23:04:01 · `tasks/prd-telas-da-coordenacao/9_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** a turma aberta mostra os nomes em tabela, com Nome, Matrícula e a situação em texto. Ao lado ficam os professores da turma, com o link ao painel de cada um, e os pedidos.
- **Bordas do domínio:** professor com duas disciplinas na mesma turma; turma sem professor alocado; dois alunos com o mesmo nome; a turma que saiu do ano ou foi excluída; turma só com nomes aprovados; vínculo encerrado e vínculo contestado; professor que a lista de professores não traz; lista de vínculos que bateu no teto de páginas; turno ausente.
- **Permissão e privacidade:** os professores da turma não fazem leitura auditada; os pedidos não são lidos sem o "Atualizar"; o complemento da contestação não aparece; nada mostra uso do professor (D45, D64).
- **Isolamento:** a tarefa é só de tela e nenhum contrato muda. No front, cabe exigir que vínculo de outra turma e de outro papel fique fora.
- **Altura:** a 1366 × 768 a página não rola e só o miolo rola. A 360 px é uma coluna só, sem rolagem de lado.

**Cobertos:**
- **Cabeçalho:** série com turno, e só a série quando falta o turno. Os dois blocos de mutação do `descricao` e o do `find` invertido têm caso que falha.
- **Estados da turma:** carregando, erro com "Tentar de novo", e a turma que a API não acha. Este último caso afirma que só o `GET /v1/turmas/:id` é pedido, e é isso que prende o `enabled` da `consultaTurmas`.
- **Estados da lista:** carregando, erro, vazio e com dado. Situação em texto e "Retirar" só no nome livre, com a matrícula no nome do botão. Só aprovados não mostra tabela. No celular, a tabela vira lista.
- **Leituras:** a lista é lida uma vez, com `finalidade=conferencia_de_cadastro`. Os pedidos não são lidos sem o clique. `/v1/vinculos` e `/v1/professores` saem sem finalidade. Isso está provado no componente e no e2e.
- **Professores:**
  - um item por vínculo, com o filtro de papel e de turma provado por um vínculo de aluno e um de outra turma;
  - ordem pelo nome e depois pela disciplina;
  - "Sem disciplina", e "Professor" quando o nome falta;
  - `href` com o `usuarioId`;
  - encerrado e contestado sem o complemento;
  - teto de páginas sem "Nenhum professor nesta turma";
  - erro da seção, com "Tentar de novo" que relê só a leitura que falhou;
  - carregando sem travar a lista de nomes.
- **Foco:** depois de gravar, acrescentar e retirar.
- **E2e novos:**
  - duas disciplinas do mesmo professor são duas linhas;
  - o estado do vínculo muda depois da confirmação;
  - o link abre Professores;
  - turma sem professor, aberta pelo histórico;
  - 1366 × 768 com `paginaNaoRola`, `tabindex=0` e rolagem pelo teclado com `End`;
  - 360 px numa coluna, com `larguraExcedente` igual a 0.
- **E2e existentes:** só os seletores mudaram (`linhasDaTabela` e a matrícula sem o prefixo). Os casos e as regras ficaram iguais.
- **Unidade:** rodei `npx vitest run --project unidade apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx` e passaram 24 de 24.

Não há `.skip` nem teste comentado. Os dublês são só de API do navegador que o `jsdom` não tem (`matchMedia`, `ResizeObserver`, `dialog`) e da rede. Nenhuma coisa nossa foi trocada por mock, e nada chama IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Bloco faltando para `ordenarVinculos`** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/ProfessoresDaTurma.tsx:82`). Só o `ordenarPeloNome` tem bloco na seção "Mutações". Pela minha leitura, o caso "um item por vínculo" já fica vermelho sem o `ordenarVinculos`: a API manda Matemática antes de Ciências, e o teste espera Ciências primeiro. Falta só declarar o bloco, para o portão provar isso.
2. **Turno nulo vindo da API** (`esquemaTurma.turno` é `nullable`). O caso "sem o turno" cobre só a lista de turmas que falha. Falta um caso com a turma na lista e `turno: null`. É o que aparece nas fotos da vitrine: "2º ano do Ensino Médio", sem o turno, nas duas escolas.
3. **Busca por palavra fraca** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx:348`). A busca por `/uso|entrega|atividade|acesso/i` só prova que nenhuma dessas palavras aparece. Não prova regra, porque o componente não tem de onde tirar dado de uso. Pode ficar como guarda, mas não conta como prova da D64.
4. **`tentando` não testado** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/ProfessoresDaTurma.tsx:70`). Nenhum caso afirma que o botão "Tentar de novo" mostra que está tentando enquanto a releitura não volta.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-16 23:04:20 · `tasks/prd-telas-da-coordenacao/9_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. Nenhuma das seis linhas de "Divergências resolvidas" contraria a `techspec.md`. Cada uma preenche um ponto que ela não detalha:
- de onde vem o turno;
- a ordem dos professores;
- onde fica o selo do vínculo;
- a refatoração de `caminhos.ts`, que a §2 já lista como arquivo alterado;
- os dublês do `jsdom`;
- o elemento contado no e2e.

A tela continua sem leitura auditada a mais, sem "Exportar lista" e sem a faixa "No Painel". A região "Nomes da turma" não mudou. As fotos de computador e celular, nas escolas cheia e vazia, mostram o que a 9.1 a 9.5 pedem. Na foto da escola cheia o título vem sem o turno, mas isso é esperado: a turma do seed não tem turno (`turno` é `nullable` em `packages/shared/src/estrutura/turma.ts:42`), e o caso "sem o turno" está testado.

Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/nome-do-turno.ts:7` repete a mesma tabela que já existe em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Estrutura.tsx:59`. Hoje são duas cópias do mesmo mapa. A 4ª linha das divergências justifica a extração como "uma definição só", o que não vale para o `NOME_DO_TURNO`. Sugestão: a 5.0, que mexe na `Estrutura.tsx`, passa a importar de `nome-do-turno.ts`. Registre isso em "Recomendações sem aplicar", com destino na 5.0.
- O comentário de `caminhoDoProfessor`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/caminhos.ts:102`, atribui a função a "(X2, 6.0)", mas ela nasce na 9.0. A 6.0 é a tarefa do painel do professor, para onde o link leva. Corrija a referência.
- No e2e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/lista-da-turma.spec.ts`, a troca de `'Matrícula 880001'` por `'880001'` ficou mais fraca: a asserção acha o número em qualquer lugar da região, não na célula da matrícula. Uma opção é procurar a linha do nome com `linhasDaTabela(...).filter({ hasText: nome })` e conferir a matrícula dentro dela.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-16 23:19:29 · `tasks/prd-telas-da-coordenacao/9_task.md`

VEREDITO: APROVADO

Tela vista: sim. Li as 6 fotos (lista da turma em 1366 px e em 360 px, escola cheia e vazia) e o diff da rodada (`diff-9_task-r2.patch`). As duas fotos de 1366 px mostram a tabela "Nomes da turma" abaixo da dobra, dentro do miolo que rola. Por isso só dá para ver a tabela nas fotos do celular, e isso já está registrado no TODO.

Estados: ok.
- **Carregando:** "Carregando os professores da turma…" aparece enquanto a leitura não volta.
- **Erro:** mostra o alerta e o botão "Tentar de novo". Quando a pessoa toca, o erro dá lugar ao "Carregando…", que a rodada passou a testar.
- **Vazio:** na escola vazia, "Nenhum nome nesta turma ainda" convida a colar a lista ou enviar o arquivo.
- **Com dado:** a lista traz matrícula e situação, e há um caso novo para turma sem turno.

Acessibilidade: ok.
- A região da lista tem nome, e o foco vai para o título "Nomes da turma".
- Os campos têm rótulo.
- Os selos de estado têm texto além do ícone.
- A mudança de "Tentando de novo…" para "Carregando…" não deixa o botão sem resposta, porque o botão sai da tela e entra o estado de carregamento, que o teste confere.

Chromebook fraco: sem novidade nesta rodada. O diff não toca lista, imagem nem upload.

Celular: ok em 360 px. Não há rolagem horizontal, as linhas viram cartões, e "Retirar", "Acrescentar um nome" e "Ver a prévia" têm alvo de toque confortável. Nada depende de hover.

Ação oficial protegida: sim. Esta tarefa só lista, sobe e retira nomes, sem nota nem publicação. Retirar mostra o nome e a matrícula na linha, e o e2e confere isso.

Bloqueantes: nenhum.

Recomendações:
- **Nome do professor cortado:** nas fotos o nome sai com reticências ("Professor Sintético Davi c..."). O componente `apps/web/src/componentes/Linha.tsx:58` já põe `title` com o nome inteiro e corta com `truncate`. No celular o `title` não aparece por hover. O nome só fica cortado porque o dado sintético tem um sufixo longo, mas vale deixar o nome quebrar em duas linhas em vez de cortar. Isso vai para a validação.
- **Seletor de arquivo em inglês:** a vitrine mostra "Choose File / No file chosen". É o controle do próprio navegador, que sai em português quando a máquina está em pt-BR. O ajuste da vitrine (`locale: 'pt-BR'` em `tools/vitrine/foto.ts`) já está no TODO. Se a escola usar navegador em inglês, o texto continua em inglês, e isso merece revisão na validação.
- **Mensagem "Nome não carregado":** é honesta, mas não diz o que fazer. Considere "Nome indisponível. Atualize a página".
- **Barra de baixo no meio da foto do celular:** a barra de navegação fixa aparece no meio da imagem de página inteira. É efeito da captura em pedaços e não defeito da tela.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-16 23:19:38 · `tasks/prd-telas-da-coordenacao/9_task.md`

VEREDITO: APROVADO

Esta é a 2ª rodada. Auditei só o diff desde a 1ª, que estava aprovada (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/.processo/ordens/diff-9_task-r2.patch`), e o que ele afeta. A 1ª rodada não exigiu correção, então não havia nada a conferir. A minha recomendação daquela rodada foi aplicada.

Campos pessoais tocados: nenhum campo novo. Na seção de professores da turma, o nome de professor que a lista não traz agora aparece como "Nome não carregado" (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/ProfessoresDaTurma.tsx:75`). É um texto fixo. Não traz dado de pessoa nem diz se o vínculo existe ou não.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. O diff não mexe em rota, consulta nem DTO. Tirar `tentando` do `EstadoErro` só muda o que a tela mostra durante a nova leitura, e o caso novo em `ListaDaTurma.test.tsx:420` prova que o "Tentar de novo" relê só a consulta que falhou.

Logs: limpos. O diff não acrescenta log.

Auditoria: presente, e o diff não a toca. As fotos do celular (`...celular-2.png`) e do computador mostram "Pedidos de nome" lido só ao clicar em Atualizar, com o aviso de que cada consulta fica registrada na auditoria. Isso continua como estava na 1ª rodada.

Envio externo: nenhum.

Seed/fixture: sintético. Nas fotos aparecem "Aluna Sintética Bia Vitrine", as matrículas 90000001 a 90000003 e "Professor Sintético Davi" e "Professora Sintética Helena". No e2e, as matrículas vão de 880001 a 880004. O e2e (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/lista-da-turma.spec.ts:172-174`, `:197-199`) agora confere a matrícula na linha do próprio nome, não solta na região. A conferência de que nome e matrícula não ficam no armazenamento do navegador nem no endereço não mudou e continua logo abaixo.

Fotos da tela: nome e matrícula de aluno aparecem para a coordenação, na tela da turma da própria unidade. A regra 60, item 11, permite isso, e foi o que a 1ª rodada aprovou. Os professores aparecem com nome, disciplina e estado do vínculo, sem texto livre. A escola vazia não mostra nada além da moldura vazia. O link para o professor continua levando só o id do usuário na consulta (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/caminhos.ts:104-105`; nesta rodada só o comentário mudou).

Bloqueantes: nenhum.

Recomendações:
- A linha nova do `TODO.md` (a vitrine fotografa só a parte visível do miolo que rola, e o seletor de arquivo sai em inglês) é só da vitrine, sem efeito de LGPD. Mesmo assim, enquanto a foto de 1366 px não mostrar a tabela de nomes, ela não serve para conferir o que a coordenação vê no computador. Vale corrigir antes da próxima tela com tabela de aluno, para essa conferência não depender só das fotos do celular.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-16 23:20:11 · `tasks/prd-telas-da-coordenacao/9_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

**Correções desta rodada, conferidas no código atual**
- **"Tentar de novo" dos professores.** A propriedade `tentando` saiu do `EstadoErro` em `apps/web/src/areas/coordenacao/ProfessoresDaTurma.tsx:72`. A remoção está certa: a consulta não tem dado guardado, então ao reler ela volta a "pendente" e a tela mostra "Carregando…" no lugar do erro. Com isso, "Tentando de novo…" nunca chegaria a aparecer. O caso novo em `ListaDaTurma.test.tsx` segura a releitura e confere que o erro e o botão saem antes da resposta. A mutação que troca o `aoTentarDeNovo` por uma função vazia faz esse caso falhar.
- **"Nome não carregado" no lugar de "Professor".** A troca está em `ProfessoresDaTurma.tsx:76`, com o caso e a mutação acompanhando. A spec não fixa esse texto, então não é divergência.
- **Turno nulo.** O caso novo cobre a turma que está na lista de turmas mas sem turno: a tela mostra só a série, sem "undefined" nem o separador "·". A mutação que compara o turno com `undefined` em vez de `null` faz o caso falhar.
- **Matrícula no e2e.** Agora cada matrícula é conferida dentro da linha do próprio nome, inclusive a do homônimo que fica depois da retirada, em `e2e/lista-da-turma.spec.ts:172-174` e `:197-199`.
- **Comentário de `caminhoDoProfessor`** (`apps/web/src/caminhos.ts:120`): corrigido.
- **Seções do documento da tarefa.** "Divergências", "Mutações" e "Recomendações sem aplicar" batem com o código de agora. Cada recomendação tem destino ou motivo: a tarefa 5.0, o `TODO.md` (a linha nova da vitrine) ou recusa explicada.

**Fotos da tela.** Nas seis fotos, escola cheia e vazia, a tela mostra:
- o cabeçalho "‹ Escola", "Turma …" e a série;
- duas colunas a 1366 px;
- uma coluna no celular, sem rolagem de lado;
- "Professores da turma" com a disciplina e o estado do vínculo em texto;
- "Pedidos de nome" lidos só no "Atualizar";
- o vazio "Nenhum nome nesta turma ainda".

Não aparece "Exportar lista", indicador de uso nem nada de tarefa futura. O "Choose File" em inglês vem do navegador da vitrine e já está no `TODO.md`.

Recomendações:
- `apps/web/src/areas/coordenacao/Alocacao.tsx:103` ainda mostra "Professor" quando o nome não carrega, e a lista da turma agora mostra "Nome não carregado". Vale alinhar os dois textos na tarefa que mexer na Alocação.

## test-engineer · 2ª rodada · APROVADO · 2026-10-16 23:20:18 · `tasks/prd-telas-da-coordenacao/9_task.md`

VEREDITO: APROVADO

Cenários exigidos (rodada 2, sobre o diff `a3dec30 → df79872` e as recomendações da 1ª):
- Mutação de `ordenarVinculos` declarada e capaz de deixar o teste vermelho.
- Turma presente na lista de turmas, mas com `turno: null`.
- "Tentar de novo" dos professores: troca o erro por "Carregando…" e depois mostra o dado.
- O texto "Nome não carregado" no lugar de "Professor".
- A matrícula conferida na linha do nome no e2e, com os dois alunos de mesmo nome.
- Não sobrou nenhuma referência à propriedade `tentando`, que foi removida.

Cobertos:
- **`ordenarVinculos`** (`9_task.md:183-188`). No teste "um item por vínculo" (`ListaDaTurma.test.tsx:330-358`), a Camila chega primeiro com Matemática e depois com Ciências, e a asserção exige Ciências primeiro (linha 349). Com a mutação aplicada, o `ordenarPeloNome` estável mantém a ordem de chegada e o teste fica vermelho pelo motivo certo.
- **`turno: null`** (`ListaDaTurma.test.tsx:152-159`). A turma está na lista, então o `find` a encontra e `turno` vale `null` (`ListaDaTurma.tsx:149`). A mutação (`9_task.md:190-195`) troca o teste por `=== undefined`, e o texto vira "<série> · undefined". O teste confere o `textContent` exato e a ausência de "·", então pega a mutação.
- **"Tentar de novo"** (`ListaDaTurma.test.tsx:420-444`). Há asserção sobre o que a pessoa vê:
  - durante a releitura, "Carregando…" aparece e o alerta e o botão saem;
  - quando a resposta volta, o professor aparece e "Carregando…" some.
  
  A mutação que troca a função por uma vazia (`9_task.md:197-202`) deixa o erro na tela, e o `findByText('Carregando…')` falha. O comentário em `ProfessoresDaTurma.tsx:61-62` bate com o TanStack Query v5: a consulta sem dado volta a pendente quando relê. O caso que já existia (linha 417) continua provando que só a consulta que falhou é relida.
- **"Nome não carregado"**: a mutação está atualizada para o texto novo (`9_task.md:176-181`), e o teste (linhas 373-381) exige o texto.
- **e2e da matrícula** (`e2e/lista-da-turma.spec.ts:173-174` e `197-200`):
  - cada nome é procurado pela linha dele, com a matrícula da posição em que foi gravado (`880001 + posicao`, linha 154), o que separa os dois alunos de mesmo nome;
  - depois de retirar um nome, o que fica tem a 880001 na própria linha, e a 880004 some da região.
- **Restos de `tentando`**: não sobrou nenhum em `ProfessoresDaTurma.tsx`.
- Rodei `npx vitest run --project unidade apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx` e os 26 testes passaram.
- Nenhum `.skip`, nenhum teste comentado. Os dublês são só da rede, com respostas fixas: nada nosso fica escondido.
- Cada cláusula nova do diff tem o seu bloco de mutação. A mudança em `caminhos.ts` é só de comentário.

Bloqueantes: nenhum

Recomendações:
- O caso `turno: null` e o caso "sem o turno" passam pelo mesmo ramo, porque o `?? null` da linha 149 junta o `undefined` e o `null`. A mutação nova só fica vermelha porque troca o teste para `=== undefined`. O caso vale como guarda do dado opcional, mas não acrescenta um ramo novo de código. Pode ficar como está.
- O e2e não roda neste caminho (precisa do ambiente com `--manter-ambiente`), então eu não o rodei. Ele foi lido contra a fixture e está coerente. A prova de que fica verde é do portão da tarefa.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/ProfessoresDaTurma.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/ListaDaTurma.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/lista-da-turma.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/prd-telas-da-coordenacao/9_task.md
