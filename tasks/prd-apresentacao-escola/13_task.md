# Tarefa 13.0 — Web: Estrutura, lista de nomes e alocação

**Funcionalidade:** apresentacao-escola · **Depende de:** 11.0, 2.0, 3.0 (a alocação antes do aceite usa o estado do convite) · **Paralelo com:** 4.0 a 10.0, 14.0, 15.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`, `tenancy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A coordenação monta a escola numa tela só: ano letivo, séries, disciplinas e turmas (criar, renomear, excluir), a
lista de nomes de cada turma colada ou em arquivo, com a prévia linha a linha, e a alocação professor × turma ×
disciplina.

## Contexto necessário

- `docs/interface.md` 11.1 (a coordenação abre em Estrutura) e a seção de tabela responsiva
- `techspec.md` seções 4 (estrutura e lista) e 9 ("Lista")
- `cenarios.md`: W10, W4 (linhas "Estrutura", "Lista", "Alocação"), W12; os códigos de erro de E1, E2, E4, E7
- `.claude/rules/50-frontend.md`; regra 20 (itens 4, 9)
- `techspec.md` seção 12: a premissa do CSV do Excel em windows-1252 com `;`
- Código:
  - As rotas da 1.0 e da 2.0, e as do F1 (ano letivo, série, turma, disciplina, vínculo)
  - `apps/web/src/api/cliente.ts` (`ErroDaApi`, `mensagemDoErro`), `apps/web/src/api/vinculos.ts`
  - `apps/web/src/componentes/estado/`, `Campo.tsx`, `Botao.tsx`
  - `apps/web/src/operacao/componentes/DialogoDaOperacao.tsx` e `apps/web/src/operacao/paginas/Escolas.tsx` — o
    padrão de diálogo, foco devolvido e tabela que vira cartões (a 14.0 leva o diálogo para `componentes/`: se
    esta vier antes, use-o de onde estiver e não copie)
  - `tasks/prd-apresentacao-painel/achados/indice.md`, linhas da 6.0 e 7.0: foco depois de conflito e largura dentro
    do diálogo

## Decisão tomada, herdada da 3.0

**Alocação antes do aceite** (Tech Spec, seção 13). Decidido pelo Joaquim em 27/09/2026: **a alocação passa a aceitar o
professor com convite em aberto**. A API muda nesta tarefa, e por isso ela ganha o `tenancy-guardian`.

- Alocável é o professor da escola da sessão cujo estado (`estadoDoProfessor`, de `@educa/nucleo`, a mesma função da lista
  da coordenação e do refazer e do revogar) está em `ESTADOS_DO_PROFESSOR_ALOCAVEIS` (`packages/shared`): `pendente` (o
  convite em aberto, dentro do prazo), `aceito` e `ativo`. `VinculoRepository.professorAlocavel` substitui o
  `pessoaAtivaComPapel`.
- Continuam **não alocáveis**, com o mesmo `NAO_ENCONTRADO` do id inexistente: o convite `vencido` e o `revogado`, o
  professor `desativado` (com ou sem convite), o usuário que não é professor, e o professor de outra escola, em qualquer
  estado (regra 10, item 6).
- O `aceito` é alocável nos dois casos que ele junta, o ativo pelo convite (conta nova) e o que espera a primeira entrada
  (a conta que já existia em outra escola): separar os dois diria à coordenação se o e-mail tinha conta (E11).
- O vínculo nasce `pendente`, como sempre, e não alcança a turma até o professor aceitar o convite, entrar e confirmar
  (P2). O W1 fica como está escrito.
- Sem trava nova: o convite revogado **depois** da alocação deixa o vínculo pendente, igual à ordem inversa (alocar e
  depois revogar), que já existia. Sem o aceite, ninguém chega a ele.

## Herdado da 2.0

- As rotas da lista e os contratos estão em `packages/shared/src/estrutura/lista.ts`: a prévia devolve `linha` (a
  numeração do arquivo, com cabeçalho e linha em branco), nome e matrícula lidos, `resultado` e o `erro` de
  `ERROS_DA_LINHA_DA_LISTA`; a gravação responde `ENTRADA_INVALIDA` quando o texto tem erro e `CONFLITO` quando uma
  matrícula ficou em uso depois da prévia; a leitura exige a `finalidade`. O teto (`MAXIMO_DE_LINHAS_DA_LISTA`,
  `MAXIMO_DE_BYTES_DA_LISTA`) vem do mesmo arquivo: a tela pode avisar antes de enviar.
- O separador é o da primeira linha que tem um. Um título com vírgula antes da lista ("Turma 8ºA, manhã") escolhe a
  vírgula, e as linhas `nome;matrícula` saem todas `sem_matricula`: não grava nada, mas na tela parece a lista inteira
  errada. A prévia com quase toda linha em erro pode sugerir tirar o título (recomendação do `test-engineer` na 2.0).
- O cabeçalho só é reconhecido com "nome" e "matrícula". Um `Nome;RA` ou `Aluno;Código` vira uma linha de aluno que
  `entra`, e sem cabeçalho a segunda coluna é sempre a matrícula (um `nome;CPF` ou `nome;nascimento` colado grava o
  CPF ou a data como matrícula). O exemplo `nome; matrícula` ao lado e a prévia são a defesa; decidir aqui se a tela avisa
  a primeira linha que parece cabeçalho, ou se o leitor aprende os sinônimos (recomendações do `revisor-geral` e do
  `privacy-guardian` na 2.0).
- A matrícula que já está na lista sai `ja_existe` mesmo com outro nome, e o nome novo é descartado (RF5, "pela
  matrícula"). A prévia mostra o nome digitado ao lado do `ja_existe`: a tela pode deixar claro que o nome gravado não
  muda (recomendação do `revisor-geral` na 2.0).

## Subtarefas

- [x] 13.1 — Estrutura: ano, série, disciplina e turma, com renomear e excluir (confirmação `perigo`; o `CONFLITO`
  explica o que prende); o vazio "Comece pelo ano letivo" com o roteiro até a alocação; a coordenação abre aqui
- [x] 13.2 — Lista da turma: colar ou escolher arquivo, lido como texto (UTF-8, e windows-1252 quando o UTF-8 falha),
  com o exemplo `nome; matrícula` ao lado; a prévia com as linhas de erro primeiro e em texto; gravar só sem erro;
  nome avulso; retirar nome livre. A leitura da lista manda a finalidade
- [x] 13.3 — Alocação professor × turma × disciplina; o vínculo aparece `pendente` até o professor confirmar
- [x] 13.4 — Linha "Estrutura" na tabela de navegação; teto do chunk `coordenacao-*` no `.size-limit.json`
- [x] 13.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/Estrutura.tsx`, `ListaDaTurma.tsx`, `Alocacao.tsx` | novo |
| `apps/web/src/areas/coordenacao/ler-arquivo-da-lista.ts` (e teste) | novo |
| `apps/web/src/api/estrutura.ts`, `lista.ts`; `areas/navegacao.ts` | novo, alterado |
| `.size-limit.json`, `e2e/estrutura.spec.ts`, `e2e/__fixtures__/lista-excel.csv` | alterado, novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| W10 | e2e e unidade | windows-1252 com `;` e acento e UTF-8 com BOM e `,`: a prévia mostra os nomes certos, erros primeiro e em texto |
| W4 (Estrutura, Lista, Alocação) | e2e | os quatro estados com os textos e o próximo passo da tabela; vazio e erro com a rota interceptada |
| W12 (as três) | e2e | 360 px sem rolagem, também dentro do diálogo; cartões abaixo de 768 px; alvos de 44 px; tudo só com teclado |
| clique duplo | e2e | dois cliques em "Gravar lista" mandam um pedido só |
| recomeço da tela | e2e | segunda pessoa: a coordenação de A sai, a de B entra na mesma aba, e nenhuma turma nem nome de A aparece; mesma entrada: a mesma lista enviada de novo mostra `ja_existe`, sem duplicar; resposta atrasada: a prévia de um texto anterior que chega depois da edição é descartada; falha com o diálogo aberto: o `CONFLITO` ao excluir a turma explica o que prende, e o aviso e o foco da tentativa anterior não sobrevivem ao reabrir; a turma que outra pessoa excluiu com o diálogo aberto (`NAO_ENCONTRADO`) é quem prova que a falha recarrega a lista |
| sem rastro | e2e (divergência abaixo) e unidade | nome e matrícula da lista não vão para `localStorage`, `sessionStorage`, IndexedDB, Cache Storage nem para o endereço; a web pede a API sem cache HTTP |
| E12 (13.0) | integração | a alocação antes do aceite: `pendente`, `aceito` (os dois casos) e `ativo` alocáveis; `vencido`, `revogado`, `desativado` e o professor de outra escola com o `NAO_ENCONTRADO` do inexistente, sem gravar; vale o último convite de professor; o vínculo só alcança a turma depois do aceite, da entrada e da confirmação |
| o que a tela segura | e2e | ano fora do intervalo, período invertido, início vazio ou fora do ano digitado, fim vazio ou depois do ano seguinte, nome em branco (disciplina, turma, renomear), avulso sem nome, sem matrícula ou com matrícula que parece CPF ou data, escolha incompleta da alocação, texto vazio e acima do teto, planilha no lugar de texto: o erro em texto, com o foco no campo, e nenhum pedido sai (contado) |
| período do ano letivo | unidade e integração | o início em outro ano e o fim depois do ano seguinte recusados pelo contrato e pela API (`ENTRADA_INVALIDA`); o fim em janeiro do ano seguinte passa |
| roteiro sem marca | e2e | com as leituras seguradas e depois em 503, o roteiro não diz "falta" do que não leu; sem ano em curso, turmas e alocação faltam de fato |
| foco na lista colada | e2e | a prévia e o alerta levam o foco quando a resposta chega, uma vez só (com a prévia na tela, o aviso da planilha recusada fica com o foco, e abrir e cancelar o diálogo do nome avulso devolve o foco ao botão que o abriu, e não ao título da prévia); a resposta que chega com o foco já de volta no campo o deixa lá, e a que chega com o foco num botão (um Tab durante a espera) o leva ao título; quando a prévia e o alerta voltam porque o texto voltou a um valor anterior, o foco fica no campo e o que se digita entra nele; a resposta atrasada não guarda foco para depois |
| anúncio na seção | e2e | cada anúncio aparece na seção da ação (ano letivo, séries, disciplinas, turmas, alocação, nomes da turma), e abrir um diálogo ou tentar de novo o apaga |
| ordem das listas | unidade e e2e | séries, turmas, disciplinas e professores na ordem da escola, criados fora dela; os anos do mais novo ao mais antigo |
| falha com a tela aberta (alocação) | e2e | o convite que vence com a tela aberta: `NAO_ENCONTRADO` explicado, a escolha recarrega sem o professor, e o "Alocar" seguinte não o reenvia |
| leitura auditada | e2e | a lista leva a finalidade e não é relida ao voltar para a aba, uma hora depois, enquanto a turma aberta é |
| log novo | — | a tarefa não escreve log |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [x] `test-engineer` aprovado primeiro; `frontend-reviewer` sozinho, depois `revisor-geral` e os guardiões, com
  rodada que vale para o código atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Os pedidos dentro da turma (16.0); Professores (14.0); XLSX e grade horária (F2, F8).

## Divergências resolvidas nesta tarefa

Registradas também na `techspec.md` (seção 9, "Decidido na 13.0", e seção 13), no `cenarios.md` (W1, W4, E12) e, a do
teto, no `.size-limit.json`.

- **A alocação aceita o professor com convite em aberto** (a decisão do Joaquim, acima): `professorAlocavel` no lugar do
  `pessoaAtivaComPapel`, com `ESTADOS_DO_PROFESSOR_ALOCAVEIS` em `packages/shared`, usado também pela tela para oferecer
  só os alocáveis. Provado no E12 de `apps/api/test/professores.int.test.ts` (quatro testes novos) e, na tela, no W4 da
  Alocação.
- **O diálogo, a classe do botão secundário e o `useDialogoDaTela` saem de `operacao/` para `componentes/`** (antecipa o
  `Dialogo.tsx` da 14.1): importar de `src/operacao/` da área da coordenação poria esses módulos num `parte-*` e
  reprovaria o B2 (`apps/web/nome-dos-chunks.test.ts`), e copiar é o que o 13_task.md proíbe. O `Dialogo` é genérico,
  com o aviso de inatividade da operação entrando pelo `rodape`; a operação usa o `DialogoDaOperacao`, que passou a ser
  só o `Dialogo` com o aviso e o registro dele, sem mudar de comportamento (o e2e da A0b roda inteiro). O diálogo de
  convite de cópia única (`DialogoDoConvite`) continua para a 14.1.
- **A coordenação abre em Estrutura**: a página inicial leva a coordenação para `/coordenacao/estrutura`, sem ficar no
  histórico (`docs/interface.md` 11.1, enquanto a Governança não existe). Os e2e que esperavam o "Olá" da coordenação
  (`mfa.spec.ts`, `areas.spec.ts`, o de troca para a escola onde ela coordena em `escola-e-vinculos.spec.ts` e a fixture
  `entrarComoCoordenacaoNaMesmaAba`) passam a esperar a Estrutura (`esperarEstrutura`, em `e2e/__fixtures__/casca.ts`); o
  teste da fronteira da área da coordenação segura o chunk antes da entrada, porque a área já é pedida nela. A página
  inicial fica para professor e aluno.
- **Endereços**: Estrutura em `/coordenacao/estrutura`; a turma aberta, com a lista, em
  `/coordenacao/estrutura/turmas/:turmaId` (a 16.0 põe os pedidos nela). Os links de dentro da área são relativos à base
  dela (`caminhoDaTurmaNaEstrutura`), porque o `Route` aninhado do wouter resolve o `to` a partir de `/coordenacao`.
- **Estrutura numa tela só, com a lista na turma aberta**: ano letivo, séries, disciplinas, turmas e alocação são seções
  da Estrutura; a lista de nomes abre pela turma ("Lista de nomes"). Renomear e excluir só existem para disciplina e
  turma, como na API (1.0); ano letivo e série só se criam, e o ano se abre (encerrar é a virada, fora desta tela).
- **O roteiro "o que falta"** marca feito ou falta em ano em curso, séries, disciplinas, turmas, professores alocáveis e
  alocação; a lista de nomes fica sem marca, porque saber se cada turma tem lista seria ler a lista de cada uma, e cada
  leitura da coordenação vai para a auditoria.
- **A lista é lida com a finalidade fixa `conferencia_de_cadastro`**: é a única finalidade desta tela. A leitura não
  envelhece (`staleTime` infinito): voltar para a aba não relê, e cada escrita a invalida (provado no e2e).
- **As listas da estrutura são lidas até 10 páginas de 100** (`lerPaginas`, `MAXIMO_DE_PAGINAS_DA_ESTRUTURA`), e acima
  disso a tela diz que mostra só as primeiras; a lista de nomes da turma é paginada com "Ver mais nomes".
- **Os avisos da prévia** (`previa-da-lista.ts`), das recomendações da 2.0: o título antes da lista (metade ou mais das
  linhas, e ao menos duas, sem matrícula), o cabeçalho não reconhecido (a primeira linha sem erro com a matrícula sem
  algarismo) e a coluna que parece CPF ou data. **O último segura a gravação**: aluno não tem CPF nem data de nascimento
  (regra 20, item 2), e gravá-los como matrícula seria o dado que a minimização existe para não ter. O `ja_existe` diz que
  o nome gravado não muda. O leitor da API não aprendeu sinônimos de cabeçalho: a tela avisa.
- **O "Texto Unicode" do Excel também é lido**: UTF-16 com BOM (`FF FE` ou `FE FF`), separado por tabulação, que como
  windows-1252 viraria um caractere nulo entre cada letra. O BOM decide antes do UTF-8; o teto do arquivo em UTF-16 é o
  dobro (128 KB e o BOM), e o do texto continua 64 KB em UTF-8. A Tech Spec dizia UTF-8 ou windows-1252.
- **Dois alunos com o mesmo nome na turma**: o "Retirar" de cada um diz a matrícula no nome acessível, e a confirmação
  também.
- **A tela segura antes de enviar** o texto vazio, o texto acima de 64 KB em UTF-8, mais linhas preenchidas que 200 e um
  cabeçalho, e o arquivo acima de 64 KB + BOM (nem é lido). Entre 200 e 201 linhas, quem decide é a API.
- **A gravação recusada tira a prévia** (e o "Gravar lista"): o `CONFLITO` diz que uma matrícula passou a ser usada
  depois da prévia, e a tela pede a prévia de novo; o mesmo com `ENTRADA_INVALIDA` e `NAO_ENCONTRADO`. A queda de rede ou
  do servidor não diz nada da prévia: ela fica, e "Gravar lista" tenta de novo. Nos dois casos a lista de nomes
  recarrega.
- **Os diálogos de criar, renomear, excluir e retirar fecham com a lista já recarregada**, e o botão de "Abrir o ano"
  e o de "Gravar lista" levam o foco ao título da seção: o botão que abriu sai da tela com o item, e o foco iria para o
  `body`. Abrir um diálogo apaga o anúncio da ação anterior.
- **O roteiro não marca o que ainda não leu**: enquanto a leitura de um passo carrega ou falha, o passo fica sem "feito"
  nem "falta" (dizer "falta" mandaria a coordenação criar o que a escola já tem). Sem ano em curso, turmas e alocação
  faltam de fato.
- **"Novo ano letivo" não grava período de outro ano**: o ano não se altera nem se exclui depois de criado. A regra
  entrou **no contrato** (`esquemaPedidoCriarAnoLetivo`, com `inicioCaiNoAnoLetivo` e `fimCaiAteOAnoSeguinte`, em
  `packages/shared`): o início cai no ano, e o fim, nele ou no seguinte (a rede que termina o ano letivo em janeiro é
  normal; 2207 no lugar de 2027, não). A API recusa com `ENTRADA_INVALIDA` (E1, `apps/api/test/estrutura.int.test.ts`), e
  a tela mostra o erro no campo, com as mesmas funções. Na tela, o início e o fim acompanham o ano digitado enquanto a
  pessoa não mexe neles, e o campo vazio tem o erro nele.
- **O foco só vai à prévia e ao alerta quando a resposta chega** (`focoPendente`, em `ListaDaTurma.tsx`): a prévia e o
  alerta também voltam à tela quando o texto volta a um valor anterior (uma tecla errada e apagada), e aí o foco fica no
  campo. O pedido de foco é atendido uma vez só. As quebras de linha do arquivo viram as do campo (`comQuebrasDoCampo`:
  `\r\n` e `\r` viram `\n`), para o texto lido do arquivo valer igual.
- **O anúncio de cada ação aparece na seção dela** (ano letivo, séries, disciplinas, turmas, alocação; na turma aberta,
  junto dos nomes), e não no topo da página, que já saiu da tela quando a ação termina. O erro de campo leva o foco ao
  primeiro campo com erro; a prévia que chega leva o foco ao título dela.
- **A prévia marca a linha que parece CPF ou data** ("Parece CPF ou data de nascimento…"), em vez de "Entra na lista", e
  o motivo de não gravar não repete o aviso. O resumo ("N nomes entram") é a conta da API, e fica.
- **O arquivo de planilha** (`.xlsx` e `.ods`, que são zip, e o `.xls` antigo) não é lido como texto: a tela diz para
  salvar como CSV. Depois de ler, a tela diz o
  nome do arquivo lido, porque a escolha é limpa (para a mesma planilha corrigida ser lida de novo) e o controle do
  navegador volta a dizer que não há arquivo.
- **O vazio da Alocação diz o que falta** (turma, disciplina, professor alocável), com o título do W4. Os vínculos vêm
  pela turma, pela disciplina e pelo professor. O anúncio é "Alocação feita: … A turma abre depois que quem foi alocado
  confirmar." (sem o gênero do professor).
- **Do lote de recomendações, depois de todos os revisores aprovarem**: a web pede a API sem cache HTTP (`cache: 'no-store'`
  no `chamarApi`, para a resposta com nome e matrícula não ficar em disco); o nome avulso recusa a matrícula que parece
  CPF ou data, como a lista colada, e os dois campos ficam fora do corretor ortográfico; o arquivo que o navegador não
  consegue ler tem aviso (`ilegivel`); na turma nova, a série que saiu da lista sai da escolha; o foco da prévia e do
  alerta só é levado do `body` (onde o botão desligado durante o pedido o deixa) ou de um botão qualquer, e nunca de quem
  já voltou ao campo; "o fim depois do início" virou função do contrato
  (`fimDepoisDoInicio`); os diálogos de renomear, excluir e retirar usam o item da abertura sem valor de reserva.
- **As listas na ordem da escola** (`ordem.ts`): a API pagina pelo id, que segue a criação; a tela mostra as séries pela
  etapa e pelo ano, as turmas pela série e pelo nome, e disciplinas e professores pelo nome, comparado em português e com
  o número como número (a 7ºA antes da 10ºA). Vale para as listas e para as escolhas da turma nova e da alocação. Os anos
  letivos vêm do mais novo ao mais antigo.
- **A alocação não reenvia quem acabou de ser recusado**: o professor, a turma ou a disciplina que saiu da lista (o
  convite que venceu ou foi revogado com a tela aberta) sai da escolha quando a lista recarrega, e o "Alocar" seguinte
  pede a escolha de novo. Cada tentativa apaga o anúncio da alocação anterior, e a tela mostra um aviso por vez.
- **"Sem rastro" é provado no e2e**, e não em teste de unidade como a tabela previa: a web não tem ambiente de DOM na
  unidade, e o e2e confere o `localStorage`, o `sessionStorage`, o IndexedDB, o Cache Storage e o endereço do navegador
  de verdade depois de subir a lista. O pedido sem cache HTTP é provado na unidade (`cliente.test.ts`).
- **Botão `perigo`**: `CLASSES_DO_BOTAO_PERIGO` (texto `erro`, na linha) e `CLASSES_DO_BOTAO_PERIGO_CHEIO` (cheio, só no
  diálogo de confirmação), em `componentes/botao-secundario.ts`, sem modificador de opacidade (U3 de `estilos.test.ts`).
- **Teto do `coordenacao-*`: 20 kB** (mede ~12 kB), com folga para os Professores da 14.0; o teste do teto usa um chunk
  entre 20 e 30 kB, que passaria com o teto de partida da 11.0.

## Mutações

Rodadas em 01/10/2026, uma por vez, cada uma restaurada antes da seguinte: as da API na integração; as da tela no e2e
(`e2e/estrutura.spec.ts`, e as três do diálogo em `e2e/operacao-escolas.spec.ts`), nos projetos `chromebook` e
`celular`, com a web do compose de teste reconstruída a cada mutação; as de `previa-da-lista.ts`,
`ler-arquivo-da-lista.ts`, `ordem.ts`, `navegacao.ts` e do `.size-limit.json` na unidade. O que está entre crases na
coluna da direita é a asserção que falhou. As linhas são as do código de agora; as que a 1ª rodada do `test-engineer`
pediu (a falha que recarrega a lista, a escolha do arquivo limpa, o carregando e o erro de cada seção) foram rodadas
depois dela, com as do código que mudou (`ListaDaTurma.tsx`, `ler-arquivo-da-lista.ts`); e as do que a 1ª rodada do
`frontend-reviewer` pediu (o roteiro sem marca, o ano letivo novo, o anúncio na seção, o foco no campo com erro, a
prévia, o `.xlsx`, o vazio e a ordem da alocação), depois dela; e as da 2ª rodada dele (o foco que só vai à prévia e ao
alerta quando a resposta chega, o período do ano letivo no contrato, a planilha antiga), depois dela; e a da 4ª rodada do
`test-engineer` (o pedido de foco atendido uma vez só), depois dela; e as do lote de recomendações, depois de todos
aprovarem. A mutação cuja asserção citada mudou de texto, ou cujo código mudou, foi rodada de novo.

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|
| `apps/api/src/estrutura/vinculo.repository.ts:135` (escola do usuário) | `professores.int.test.ts`, `turma-acesso.int.test.ts`: "vencido, revogado, desativado depois do aceite e o professor de outra escola dão…"; "criar vínculo com `turma_id`, `usuario_id` ou `disciplina_id` de B dá o mesmo 40…"; "o escopo de escola vale sozinho: com o ano e o usuário de B num contexto de A, n…" |
| `apps/api/src/estrutura/vinculo.repository.ts:135` (papel de professor) | `vinculo.int.test.ts`: "criar: a pessoa precisa ser professor alocável da escola (13.0); coordenador, al…" |
| `apps/api/src/estrutura/vinculo.repository.ts:140` (convite do usuário) | `professores.int.test.ts`: "vencido, revogado, desativado depois do aceite e o professor de outra escola dão…" |
| `apps/api/src/estrutura/vinculo.repository.ts:140` (tipo do convite) | `professores.int.test.ts`: "vale o último convite de professor: o refeito é alocado; um convite de outro tip…" |
| `apps/api/src/estrutura/vinculo.repository.ts:140` (escola do convite) | **sobreviveu, como esperado**: segunda camada. A FK composta `(escola_id, usuario_id)` do convite não deixa existir convite de outra escola para o usuário, e o cenário não se monta (a mesma recusa aceita na 3.0) |
| `apps/api/src/estrutura/vinculo.repository.ts:141` (último convite pelo expira_em) | `professores.int.test.ts`: "vale o último convite de professor: o refeito é alocado; um convite de outro tip…" |
| `apps/api/src/estrutura/vinculo.repository.ts:141` (desempate pelo id) | **sobreviveu, como esperado**: é só o desempate de dois convites com o mesmo `expira_em`, que o refazer nunca produz (o novo vence depois); fica igual à ordem de `ConviteRepository.dadosDoProfessor` |
| `packages/shared/src/professores/professores.ts:61` (pendente alocável) | `professores.int.test.ts`: "o convite pendente é alocado, e o vínculo pendente só alcança a turma depois do …"; "vale o último convite de professor: o refeito é alocado; um convite de outro tip…" |
| `packages/shared/src/professores/professores.ts:61` (aceito alocável) | `professores.int.test.ts`: "E10: o aceite na escola B com a conta que já tem usuário em A não cria conta e c…"; "o aceito é alocado nos dois casos que junta, com a mesma resposta: a conta nova,…" |
| `packages/shared/src/professores/professores.ts:61` (ativo alocável) | `turma-acesso.int.test.ts`, `vinculo.int.test.ts`: "borda: com vínculo pendente e contestado, `/turmas/:id` e `/alunos` dão o 404 da…"; "borda: vínculo encerrado com a sessão aberta; a requisição seguinte a `/turmas/:…"; "o vínculo de aluno e o confirmado em outra turma não abrem a turma para o profes…" e mais 16 |
| `packages/shared/src/professores/professores.ts:61` (vencido não alocável) | `professores.int.test.ts`: "vencido, revogado, desativado depois do aceite e o professor de outra escola dão…" |
| `packages/shared/src/professores/professores.ts:61` (revogado não alocável) | `professores.int.test.ts`: "vencido, revogado, desativado depois do aceite e o professor de outra escola dão…"; "vale o último convite de professor: o refeito é alocado; um convite de outro tip…" |
| `packages/shared/src/professores/professores.ts:61` (desativado não alocável) | `professores.int.test.ts`, `vinculo.int.test.ts`: "vencido, revogado, desativado depois do aceite e o professor de outra escola dão…"; "criar: a pessoa precisa ser professor alocável da escola (13.0); coordenador, al…" |
| `apps/api/src/estrutura/vinculo.service.ts:89` (guarda do service) | `professores.int.test.ts`, `turma-acesso.int.test.ts`, `vinculo.int.test.ts`: "criar: a pessoa precisa ser professor alocável da escola (13.0); coordenador, al…"; "vencido, revogado, desativado depois do aceite e o professor de outra escola dão…"; "vale o último convite de professor: o refeito é alocado; um convite de outro tip…" e mais 1 |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:179` (turmas só com ano em curso (Estrutura)) | W4 Estrutura "do vazio ao roteiro": `expect(doAnoEmCurso).toEqual([])`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:181` (vínculos só com ano em curso (Estrutura)) | W4 Estrutura "do vazio ao roteiro": `expect(doAnoEmCurso).toEqual([])`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:233` (o vazio da Estrutura) | W4 Estrutura "do vazio ao roteiro": `expect(principal(page).getByText('Comece pelo ano letivo')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_…`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:217` (roteiro sem marca no vazio) | W4 Estrutura "do vazio ao roteiro": `expect(roteiro).not.toContainText('falta')`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:583` (Abrir só sem ano em curso) | W4 Estrutura "do vazio ao roteiro": `expect(anos.getByRole('button', { name: /Abrir o ano letivo/ })).toHaveCount(0)`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:583` (Abrir só no planejado) | W4 Estrutura "depois da virada": `expect(anos.getByRole('button', { name: /Abrir o ano letivo/ })).toHaveText(['Abrir o ano letivo 202…`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:321` (Nova turma só com ano em curso) | W4 Estrutura "do vazio ao roteiro": `expect(principal(page).getByRole('button', { name: 'Nova turma' })).toHaveCount(0)`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:699` (série criada sai da escolha) | W4 Estrutura "do vazio ao roteiro": `expect(daSerie.getByLabel('Série').locator('option')).toHaveText(SERIES_DO_RECORTE.filter((serie) =>…`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:916` (renomear sem nome não é enviado) | "renomear e excluir": `expect(renomear.getByText('Digite o nome novo.')).toBeVisible()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:911` (foco no campo depois do CONFLITO do renomear) | "renomear e excluir": `expect(renomear.getByLabel('Nome da turma')).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:945` (CONFLITO do renomear no campo) | "renomear e excluir": `expect(renomear.getByText('Já existe uma turma com este nome neste ano letivo. Escolha outro.')).toB…`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:933` (renomear do item que sumiu: só Fechar) | "renomear e excluir": `expect(renomearDisciplina.getByRole('button', { name: 'Salvar nome' })).toHaveCount(0)`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:602` (criar fecha com a lista recarregada) | W4 Estrutura "do vazio ao roteiro": `expect(principal(page).getByRole('heading', { name: 'Ano letivo' })).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:556` (foco no título depois de abrir o ano) | W4 Estrutura "do vazio ao roteiro": `expect(principal(page).getByRole('heading', { name: 'Ano letivo' })).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:300` (disciplinas pelo nome) | "renomear e excluir": `expect(disciplinas.getByRole('listitem')).toContainText([outraDisciplina, estrutura.disciplina.nome]…`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:272` (séries na ordem da escola) | "renomear e excluir": `expect(principal(page).getByRole('region', { name: 'Séries' }).getByRole('listitem')).toHaveText(SER…`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:784` (séries em ordem na turma nova) | "renomear e excluir": `expect(daTurma.getByLabel('Série').locator('option')).toHaveText(SERIES_DO_RECORTE)`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:492` (foco de reserva ao excluir a turma) | "renomear e excluir": `expect(principal(page).getByRole('heading', { name: 'Turmas de 2026' })).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:421` (foco de reserva ao renomear a disciplina que sumiu) | "renomear e excluir": `expect(principal(page).getByRole('heading', { name: 'Disciplinas' })).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:155` (aviso de lista incompleta) | "as turmas passam de dez páginas": `expect(turmas).toContainText('A lista é maior do que esta tela mostra', { timeout: PRAZO_DA_ENTRADA_…`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:99` (turma inexistente ou de outra escola) | "segunda pessoa": `expect(principal(page)).toContainText('Esta turma não está no ano letivo em curso', { timeout: PRAZO…`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:184` (Retirar só no nome livre) | W4 Lista "a lista paginada": `expect(reivindicado.getByRole('button')).toHaveCount(0)`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:360` (a prévia é do texto do campo) | W10 "o arquivo do Excel": `expect(previa).toHaveCount(0)`; W4 Lista "a lista paginada": `expect(principal(page).getByRole('region', { name: 'Prévia' })).toHaveCount(0)`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:362` (falha da prévia é do texto recusado) | W4 Lista "a lista paginada": `expect(subir.getByRole('alert')).toHaveCount(0)`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:370` (falha da gravação é do texto recusado) | W4 Lista "a lista paginada": `expect(subir.getByRole('alert')).toHaveCount(0)`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:347` (texto vazio não é enviado) | W4 Lista "a lista paginada": `expect(subir.getByRole('alert')).toHaveText('Cole a lista ou escolha o arquivo antes de ver a prévia…`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:352` (lista acima do teto não é enviada) | W4 Lista "a lista paginada": `expect(subir.getByRole('alert')).toHaveText('A lista passa de 200 nomes. Divida em partes e envie um…`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:304` (gravar limpa o texto) | W10 "o arquivo do Excel": `expect(principal(page).getByLabel('Lista colada')).toHaveValue('')`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:149` (foco nos nomes depois de gravar) | W10 "o arquivo do Excel": `expect(principal(page).getByRole('heading', { name: 'Nomes da turma' })).toBeFocused()`, nos dois |
| `apps/web/src/api/lista.ts:41` (a leitura manda a finalidade) | W10 "o arquivo do Excel": `expect(principal(page)).toContainText('Cole a lista ou envie o arquivo: nome; matrícula', { timeout:…`, nos dois |
| `apps/web/src/areas/coordenacao/rotas.tsx:22` (outra turma é outra tela) | W4 Lista "a lista paginada": `expect(principal(page).getByLabel('Lista colada')).toHaveValue('')`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:491` (gravar só quando pode) | W10 "o arquivo do Excel": `expect(previa.getByRole('button', { name: 'Gravar lista' })).toHaveCount(0)`; W4 Lista "a lista paginada": `expect(comAvisos.getByRole('button', { name: 'Gravar lista' })).toHaveCount(0)`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:464` (avisos da prévia na tela) | W4 Lista "a lista paginada": `expect(comAvisos).toContainText('A primeira linha parece um cabeçalho, e vai entrar como aluno.')`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:328` (texto novo tira o aviso do texto anterior) | W4 Lista "a lista paginada": `expect(subir.getByRole('alert')).toHaveCount(0)`, nos dois |
| `apps/web/src/areas/coordenacao/dialogos.tsx:40` (um pedido por vez (clique duplo)) | "renomear e excluir": `expect(exclusoes).toHaveLength(1)`; W10 "o arquivo do Excel": `expect(gravacoes).toHaveLength(1)`, nos dois |
| `apps/web/src/areas/coordenacao/dialogos.tsx:65` (foco no alerta da falha) | "renomear e excluir": `expect(aviso).toBeFocused()`; W4 Lista "a lista paginada": `expect(subir.getByRole('alert')).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/dialogos.tsx:117` (sem nova tentativa: some o envio) | W4 Estrutura "do vazio ao roteiro": `expect(daTurma.getByRole('button', { name: 'Criar turma' })).toHaveCount(0)`; "renomear e excluir": `expect(daSerie.getByRole('button', { name: 'Criar série' })).toHaveCount(0)`, nos dois |
| `apps/web/src/areas/coordenacao/dialogos.tsx:180` (lista mudou: some o excluir) | "renomear e excluir": `expect(excluir.getByRole('button', { name: 'Excluir turma' })).toHaveCount(0)`, nos dois |
| `apps/web/src/areas/coordenacao/dialogos.tsx:173` (foco inicial no texto da confirmação) | **sobreviveu no Chromium**: o `showModal` já põe o foco no primeiro elemento focável do diálogo, que é o parágrafo. O `focoInicial` fica para o navegador que começa pelo primeiro controle (o botão que exclui). A regra (o foco começa no texto) é provada pela linha do `tabIndex`, abaixo |
| `apps/web/src/areas/coordenacao/dialogos.tsx:165` (confirmação fecha com a lista recarregada) | "renomear e excluir": `expect(principal(page).getByRole('heading', { name: 'Turmas de 2026' })).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:54` (turmas só com ano em curso (Alocação)) | W4 Estrutura "do vazio ao roteiro": `expect(doAnoEmCurso).toEqual([])`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:57` (vínculos só com ano em curso (Alocação)) | W4 Estrutura "do vazio ao roteiro": `expect(doAnoEmCurso).toEqual([])`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:76` (alocação oferece só os alocáveis) | W4 Alocação: `expect(alocacao).toContainText('Crie uma turma e um professor primeiro', { timeout: PRAZO_DA_ENTRADA…`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:77` (vazio sem turma) | W4 Alocação: `expect(alocacao).toContainText('Crie uma turma e um professor primeiro', { timeout: PRAZO_DA_ENTRADA…`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:77` (vazio sem professor alocável) | W4 Alocação: `expect(alocacao).toContainText('Crie uma turma e um professor primeiro', { timeout: PRAZO_DA_ENTRADA…`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:77` (vazio sem disciplina) | W4 Estrutura "do vazio ao roteiro": `expect(alocacao).toContainText('Crie uma turma e um professor primeiro')`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:177` (escolha incompleta não é enviada) | W4 Alocação: `expect(alocacoes).toHaveLength(0)`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:158` (professor que saiu da lista sai da escolha) | W4 Alocação: `expect(alocacao.getByRole('alert')).toHaveText('Escolha o professor, a turma e a disciplina.')`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:96` (professores pelo nome) | W4 Alocação: `expect(professor.locator('option')).toHaveText(['Escolha o professor', `${ana.nome} (convite em aber…`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:97` (turmas em ordem na escolha) | W4 Alocação: `expect(alocacao.getByLabel('Turma').locator('option')).toHaveText(['Escolha a turma', turma.nome, ou…`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:98` (disciplinas em ordem na escolha) | W4 Alocação: `expect(alocacao.getByLabel('Disciplina').locator('option')).toHaveText(['Escolha a disciplina', arte…`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:174` (tentativa nova apaga o anúncio) | W4 Alocação: `expect(alocado).toHaveCount(0)`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:234` (um aviso por vez) | W4 Alocação: `expect(alocacao.getByRole('alert')).toHaveText('Escolha o professor, a turma e a disciplina.')`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:169` (alocar recarrega a estrutura) | W4 Alocação: `expect(alocados.getByRole('listitem')).toHaveCount(1)`, nos dois |
| `apps/web/src/paginas/Inicio.tsx:51` (a página inicial não fica no histórico da coordenação) | W4 Lista "a lista paginada": `expect(principal(page).getByRole('heading', { level: 1, name: `Turma ${outraTurma.nome}` })).toBeVis…`, nos dois |
| `apps/web/src/api/estrutura.ts:61` (teto de páginas) | "as turmas passam de dez páginas": `expect(turmas.getByRole('listitem')).toHaveCount(10)`, nos dois |
| `apps/web/src/api/estrutura.ts:62` (página de 100) | "as turmas passam de dez páginas": `expect(new Set(paginas.map((url) => new URL(url).searchParams.get('limite')))).toEqual(new Set(['100…`, nos dois |
| `apps/web/src/areas/coordenacao/previa-da-lista.ts:69` (título: ao menos duas sem matrícula) | `previa-da-lista.test.ts`: "o título com vírgula antes da lista: metade ou mais das linhas, e pelo menos dua…" |
| `apps/web/src/areas/coordenacao/previa-da-lista.ts:69` (título: metade ou mais) | `previa-da-lista.test.ts`: "o título com vírgula antes da lista: metade ou mais das linhas, e pelo menos dua…" |
| `apps/web/src/areas/coordenacao/previa-da-lista.ts:70` (a primeira pelo número da linha) | `previa-da-lista.test.ts`: "o cabeçalho que o leitor não reconhece: a primeira linha sem erro com a matrícul…" |
| `apps/web/src/areas/coordenacao/previa-da-lista.ts:71` (cabeçalho: só a primeira sem erro) | `previa-da-lista.test.ts`: "o título com vírgula antes da lista: metade ou mais das linhas, e pelo menos dua…"; "o cabeçalho que o leitor não reconhece: a primeira linha sem erro com a matrícul…" |
| `apps/web/src/areas/coordenacao/previa-da-lista.ts:71` (cabeçalho: matrícula sem algarismo) | `previa-da-lista.test.ts`: "o cabeçalho que o leitor não reconhece: a primeira linha sem erro com a matrícul…"; "a coluna que parece CPF ou data segura a gravação; a matrícula de verdade, não" |
| `apps/web/src/areas/coordenacao/previa-da-lista.ts:81` (não grava com erro) | `previa-da-lista.test.ts`: "grava só sem erro e com algo novo" |
| `apps/web/src/areas/coordenacao/previa-da-lista.ts:84` (nada novo não grava) | `previa-da-lista.test.ts`: "grava só sem erro e com algo novo" |
| `apps/web/src/areas/coordenacao/previa-da-lista.ts:28` (erros primeiro) | `previa-da-lista.test.ts`: "as linhas de erro vêm primeiro, cada grupo na ordem do texto" |
| `apps/web/src/areas/coordenacao/ordem.ts:20` (etapa antes do ano) | `ordem.test.ts`: "as séries: anos finais antes do Ensino Médio, cada etapa pelo ano"; "as turmas: pela série e, dentro dela, pelo nome" |
| `apps/web/src/areas/coordenacao/ordem.ts:35` (turma pela série antes do nome) | `ordem.test.ts`: "as turmas: pela série e, dentro dela, pelo nome" |
| `apps/web/src/areas/navegacao.ts:22` (linha Estrutura na navegação) | `navegacao.test.ts`: "W2: na A1, "Estrutura" da coordenação, "Turmas" do professor e "Minha turma" do …" |
| `.size-limit.json:23` (teto de 20 kB do coordenacao-*) | `tamanho-web.test.ts`: "declara 150 kB em brotli sobre a entrada, sozinha e com os pedaços parte-*, 60 k…"; "o chunk coordenacao-* acima de 20 kB em brotli reprova, com os outros folgados" |
| `apps/web/src/areas/coordenacao/ordem.ts:12` (número como número) | `ordem.test.ts`: "o nome em português, e não pelo código do caractere (o acento e a minúscula não …" |
| `apps/web/src/areas/coordenacao/ordem.ts:30` (comparação em português) | `ordem.test.ts`: "o nome em português, e não pelo código do caractere (o acento e a minúscula não …" |
| `apps/web/src/api/lista.ts:47` (a lista não é relida ao voltar para a aba) | W4 Lista "a lista paginada": `expect(leituras).toHaveLength(1)`, nos dois |
| `apps/web/src/areas/coordenacao/dialogos.tsx:175` (o foco da confirmação começa no texto, e não no botão que exclui) | "renomear e excluir": `expect(excluir.getByText(/Só sai a turma vazia/)).toBeFocused()`, nos dois |
| `apps/web/src/componentes/Dialogo.tsx:145` (o rodapé do diálogo (o aviso de inatividade da operação)) | `operacao-escolas.spec.ts` "o aviso de inatividade com um diálogo aberto": `expect(aviso).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })`, nos dois |
| `apps/web/src/operacao/componentes/DialogoDaOperacao.tsx:12` (o diálogo da operação se registra na casca) | `operacao-escolas.spec.ts` "o aviso de inatividade com um diálogo aberto": `expect(page.getByRole('region', { name: 'Aviso de inatividade' })).toHaveCount(1)`, nos dois |
| `apps/web/src/operacao/componentes/DialogoDaOperacao.tsx:13` (o aviso entra pelo rodapé) | `operacao-escolas.spec.ts` "o aviso de inatividade com um diálogo aberto": `expect(aviso).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })`, nos dois |
| `apps/web/src/areas/coordenacao/ler-arquivo-da-lista.ts:57` (arquivo grande em UTF-8 ou windows-1252 recusado) | `ler-arquivo-da-lista.test.ts`: "o teto do UTF-16 é o dobro: o arquivo que em UTF-8 caberia é lido, e acima do do…"; "o arquivo acima do teto nem é lido" |
| `apps/web/src/areas/coordenacao/ler-arquivo-da-lista.ts:53` (arquivo acima do dobro nem é lido) | `ler-arquivo-da-lista.test.ts`: "o teto do UTF-16 é o dobro: o arquivo que em UTF-8 caberia é lido, e acima do do…" |
| `apps/web/src/areas/coordenacao/ler-arquivo-da-lista.ts:55` (UTF-16 LE pelo BOM) | `ler-arquivo-da-lista.test.ts`: "o "Texto Unicode" do Excel, em UTF-16 com BOM e tabulação, sai com os nomes cert…"; "o teto do UTF-16 é o dobro: o arquivo que em UTF-8 caberia é lido, e acima do do…" |
| `apps/web/src/areas/coordenacao/ler-arquivo-da-lista.ts:55` (UTF-16 BE pelo BOM) | `ler-arquivo-da-lista.test.ts`: "o "Texto Unicode" do Excel, em UTF-16 com BOM e tabulação, sai com os nomes cert…" |
| `apps/web/src/areas/coordenacao/ler-arquivo-da-lista.ts:56` (UTF-16 lido antes do UTF-8) | `ler-arquivo-da-lista.test.ts`: "o "Texto Unicode" do Excel, em UTF-16 com BOM e tabulação, sai com os nomes cert…"; "o teto do UTF-16 é o dobro: o arquivo que em UTF-8 caberia é lido, e acima do do…" |
| `apps/web/src/areas/coordenacao/ler-arquivo-da-lista.ts:59` (UTF-8 estrito) | `ler-arquivo-da-lista.test.ts`: "windows-1252 com ; e acento, como o Excel grava, sai com os nomes certos" |
| `apps/web/src/areas/coordenacao/ler-arquivo-da-lista.ts:61` (windows-1252 quando o UTF-8 falha) | `ler-arquivo-da-lista.test.ts`: "windows-1252 com ; e acento, como o Excel grava, sai com os nomes certos" |
| `apps/web/src/areas/coordenacao/ler-arquivo-da-lista.ts:79` (teto em bytes de UTF-8) | `ler-arquivo-da-lista.test.ts`: "passa com 200 linhas de aluno e o cabeçalho; recusa a 202ª linha preenchida e o …" |
| `apps/web/src/areas/coordenacao/ler-arquivo-da-lista.ts:81` (200 e o cabeçalho) | `ler-arquivo-da-lista.test.ts`: "passa com 200 linhas de aluno e o cabeçalho; recusa a 202ª linha preenchida e o …" |
| `apps/web/src/areas/coordenacao/ler-arquivo-da-lista.ts:80` (linha em branco não conta) | `ler-arquivo-da-lista.test.ts`: "passa com 200 linhas de aluno e o cabeçalho; recusa a 202ª linha preenchida e o …" |
| `apps/web/src/areas/coordenacao/dialogos.tsx:168` (a falha da confirmação recarrega a lista) | "renomear e excluir": `expect(turmas).not.toContainText(deOutraPessoa.nome)`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:335` (limpar a escolha do arquivo) | W10 "o arquivo do Excel": `expect(arquivo).toHaveValue('')`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:75` (o carregando da alocação) | W4 Alocação: `expect(alocacao.getByRole('status').filter({ hasText: 'Carregando a alocação…' })).toBeVisible({ tim…`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:314` (a prévia fica quando a falha não é recusa da API) | W4 Lista "a lista paginada": `expect(previa.getByRole('button', { name: 'Gravar lista' })).toBeVisible()`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:516` (o avulso que falha recarrega a lista) | W4 Lista "a lista paginada": `expect(lista).toContainText(`Chegou durante o avulso ${marca}`)`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:558` (abrir o ano que falha recarrega a lista) | W4 Estrutura "depois da virada": `expect(anos.getByRole('listitem')).toContainText(['2027', '2026', '2025'])`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:605` (criar que falha recarrega a estrutura) | "renomear e excluir": `expect(daTurma.getByLabel('Série').locator('option')).toHaveText(SERIES_DO_RECORTE.slice(1))`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:905` (renomear que falha recarrega a lista) | "renomear e excluir": `expect(disciplinas).not.toContainText(outraDisciplina)`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:572` (o alerta da falha de abrir o ano) | W4 Estrutura "depois da virada": `expect(anos.getByRole('alert')).toHaveText('Já há um ano letivo em curso na escola. Só um fica em cu…`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:265` (o carregando da seção (series)) | W4 Estrutura "depois da virada": `for (const { regiao, carregando } of secoes) await expect(regiao.getByRole('status').filter({ hasTex…`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:292` (o carregando da seção (disciplinas)) | W4 Estrutura "depois da virada": `for (const { regiao, carregando } of secoes) await expect(regiao.getByRole('status').filter({ hasTex…`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:331` (o carregando da seção (turmas)) | W4 Estrutura "depois da virada": `for (const { regiao, carregando } of secoes) await expect(regiao.getByRole('status').filter({ hasTex…`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:267` (o erro da seção (series)) | W4 Estrutura "depois da virada": `for (const { regiao } of secoes) await expect(regiao.getByRole('alert')).toHaveText(MENSAGENS_DE_ERR…`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:294` (o erro da seção (disciplinas)) | W4 Estrutura "depois da virada": `for (const { regiao } of secoes) await expect(regiao.getByRole('alert')).toHaveText(MENSAGENS_DE_ERR…`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:333` (o erro da seção (turmas)) | W4 Estrutura "depois da virada": `for (const { regiao } of secoes) await expect(regiao.getByRole('alert')).toHaveText(MENSAGENS_DE_ERR…`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:92` (o carregando da turma aberta) | W4 Lista "a lista paginada": `expect(principal(page).getByRole('status').filter({ hasText: 'Carregando a turma…' })).toBeVisible({…`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:104` (o erro da turma aberta) | W4 Lista "a lista paginada": `expect(principal(page).getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, …`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:159` (turma que saiu da lista sai da escolha) | W4 Alocação: `expect(alocacao.getByRole('alert')).toHaveText('Escolha o professor, a turma e a disciplina.')`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:160` (disciplina que saiu da lista sai da escolha) | W4 Alocação: `expect(alocacao.getByRole('alert')).toHaveText('Escolha o professor, a turma e a disciplina.')`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:191` (o "Retirar" diz a matrícula (homônimos)) | W10 "o arquivo do Excel": `expect(lista.getByRole('button', { name: `Retirar ${homonimo}, matrícula 880001 da lista` })).toBeVi…`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:214` (roteiro conta só professor alocável) | W4 Alocação: `expect(oQueFalta).toContainText('Professores · falta')`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:221` (roteiro sem marca enquanto as séries não foram lidas) | W4 Estrutura "depois da virada": `for (const passo of semLeitura) await expect(oQueFalta).not.toContainText(passo)`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:222` (roteiro sem marca enquanto as disciplinas não foram lidas) | W4 Estrutura "depois da virada": `for (const passo of semLeitura) await expect(oQueFalta).not.toContainText(passo)`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:223` (roteiro sem marca enquanto as turmas não foram lidas) | W4 Estrutura "depois da virada": `for (const passo of semLeitura) await expect(oQueFalta).not.toContainText(passo)`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:224` (roteiro sem marca enquanto os professores não foram lidos) | W4 Estrutura "depois da virada": `for (const passo of semLeitura) await expect(oQueFalta).not.toContainText(passo)`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:225` (roteiro sem marca enquanto os vínculos não foram lidos) | W4 Alocação: `expect(oQueFalta).not.toContainText('Alocação · falta')`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:223` (sem ano em curso, as turmas faltam de fato) | W4 Estrutura "do vazio ao roteiro": `for (const passo of ['Turmas · falta', 'Alocação · falta']) await expect(principal(page).getByRole('…`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:225` (sem ano em curso, a alocação falta de fato) | W4 Estrutura "do vazio ao roteiro": `for (const passo of ['Turmas · falta', 'Alocação · falta']) await expect(principal(page).getByRole('…`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:658` (ano fora do intervalo não é enviado, e o foco vai para ele) | W4 Estrutura "do vazio ao roteiro": `expect(doAno.getByLabel('Ano')).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:659` (início de outro ano não é enviado, e o foco vai para ele) | W4 Estrutura "do vazio ao roteiro": `expect(doAno.getByLabel('Início')).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:660` (período inválido não é enviado, e o foco vai para o fim) | W4 Estrutura "do vazio ao roteiro": `expect(doAno.getByLabel('Fim')).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:682` (a data digitada fica como a pessoa deixou) | W4 Estrutura "do vazio ao roteiro": `expect(doAno.getByLabel('Início')).toHaveValue('2026-02-02')`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:754` (disciplina sem nome não é enviada) | W4 Estrutura "do vazio ao roteiro": `expect(daDisciplina.getByLabel('Nome da disciplina')).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:755` (foco no nome da disciplina em branco) | W4 Estrutura "do vazio ao roteiro": `expect(daDisciplina.getByLabel('Nome da disciplina')).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:800` (foco no nome da turma em branco) | W4 Estrutura "do vazio ao roteiro": `expect(daTurma.getByLabel('Nome da turma')).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:80` (o vazio da alocação diz que falta a turma) | W4 Alocação: `expect(alocacao).toContainText('Falta: uma turma.')`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:81` (o vazio da alocação diz que falta a disciplina) | W4 Estrutura "do vazio ao roteiro": `expect(alocacao).toContainText('Falta: uma disciplina.')`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:82` (o vazio da alocação diz que falta o professor) | W4 Alocação: `expect(alocacao).toContainText('Falta: um professor cadastrado, com o convite em aberto ou já aceito…`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:106` (vínculos pela turma e pela disciplina) | W4 Alocação: `expect(alocados.getByRole('listitem')).toContainText([`${turma.nome} · ${artes}`, `${turma.nome} · $…`, nos dois |
| `apps/web/src/areas/coordenacao/Alocacao.tsx:129` (o anúncio da alocação na seção dela) | W4 Alocação: `expect(alocado).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:343` (a tela diz qual arquivo foi lido) | W10 "o arquivo do Excel": `expect(lido).toBeVisible()`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:329` (o arquivo lido sai quando o texto muda) | W10 "o arquivo do Excel": `expect(lido).toHaveCount(0)`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:472` (a linha que parece documento diz o porquê) | W4 Lista "a lista paginada": `expect(comAvisos.getByRole('listitem').filter({ hasText: '123.456.789-09' })).toContainText('Parece …`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:470` (erros primeiro na prévia) | W10 "o arquivo do Excel": `expect(previa.getByRole('listitem')).toHaveText([`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:527` (avulso sem nome não é enviado, e o foco vai para o nome) | W4 Lista "a lista paginada": `expect(avulso.getByLabel('Nome do aluno')).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:528` (avulso sem matrícula não é enviado, e o foco vai para a matrícula) | W4 Lista "a lista paginada": `expect(avulso.getByLabel('Matrícula')).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:314` (a turma que saiu do ano tira a prévia) | W4 Lista "a lista paginada": `expect(previa).toHaveCount(0)`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:314` (a lista com erro recusada na gravação tira a prévia) | **sobreviveu, como esperado**: a tela não chega a mandar gravar uma lista com erro (a prévia a segura, e o "Gravar lista" nem aparece); o `ENTRADA_INVALIDA` fica para a API que recusar o que a prévia aceitou |
| `apps/web/src/areas/coordenacao/previa-da-lista.ts:60` (parece CPF) | `previa-da-lista.test.ts`: "a coluna que parece CPF ou data segura a gravação; a matrícula de verdade, não" |
| `apps/web/src/areas/coordenacao/previa-da-lista.ts:60` (parece data) | `previa-da-lista.test.ts`: "a coluna que parece CPF ou data segura a gravação; a matrícula de verdade, não" |
| `apps/web/src/areas/coordenacao/previa-da-lista.ts:83` (documento segura a gravação) | `previa-da-lista.test.ts`: "a coluna que parece CPF ou data segura a gravação; a matrícula de verdade, não" |
| `apps/web/src/areas/coordenacao/previa-da-lista.ts:72` (aviso da coluna que parece documento) | `previa-da-lista.test.ts`: "a coluna que parece CPF ou data segura a gravação; a matrícula de verdade, não" |
| `apps/web/src/areas/coordenacao/ordem.ts:44` (vínculos pela turma) | `ordem.test.ts`: "os vínculos: pela turma, depois pela disciplina, depois pelo professor" |
| `apps/web/src/areas/coordenacao/ordem.ts:44` (vínculos pela disciplina) | `ordem.test.ts`: "os vínculos: pela turma, depois pela disciplina, depois pelo professor" |
| `apps/web/src/areas/coordenacao/ordem.ts:44` (vínculos pelo professor) | `ordem.test.ts`: "os vínculos: pela turma, depois pela disciplina, depois pelo professor" |
| `apps/web/src/areas/coordenacao/ler-arquivo-da-lista.ts:52` (a planilha não é lida como texto) | `ler-arquivo-da-lista.test.ts`: "a planilha (.xlsx e .ods, que são zip, e o .xls antigo) não é lida como texto, p…" |
| `apps/web/src/areas/coordenacao/ler-arquivo-da-lista.ts:36` (o texto que começa por PK continua texto) | `ler-arquivo-da-lista.test.ts`: "a planilha (.xlsx e .ods, que são zip, e o .xls antigo) não é lida como texto, p…" |
| `apps/web/src/areas/coordenacao/ler-arquivo-da-lista.ts:37` (o .xls antigo também é planilha) | `ler-arquivo-da-lista.test.ts`: "a planilha (.xlsx e .ods, que são zip, e o .xls antigo) não é lida como texto, p…" |
| `packages/shared/src/estrutura/ano-letivo.ts:45` (o início no ano letivo, no contrato (unidade)) | `ano-letivo.test.ts`: "o início em outro ano é recusado no campo do início: o 2027 com o período de 202…" |
| `packages/shared/src/estrutura/ano-letivo.ts:46` (o fim até o ano seguinte, no contrato (unidade)) | `ano-letivo.test.ts`: "o fim depois do ano seguinte é recusado no campo do fim: 2207 digitado no lugar …" |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:326` (o texto que muda tira o pedido de foco da resposta atrasada) | W4 Lista "a lista paginada": `expect(campo).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:296` (a prévia que chega leva o foco ao título dela) | W10 "o arquivo do Excel": `expect(previa.getByRole('heading', { name: 'Prévia' })).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:298` (a prévia recusada leva o foco ao alerta) | W4 Lista "a lista paginada": `expect(subir.getByRole('alert')).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:315` (a gravação recusada leva o foco ao alerta) | W4 Lista "a lista paginada": `expect(subir.getByRole('alert')).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:425` (o alerta da prévia que volta com o texto não tira o foco do campo) | W4 Lista "a lista paginada": `expect(campo).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:433` (o alerta da gravação que volta com o texto não tira o foco do campo) | W4 Lista "a lista paginada": `expect(campo).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:316` (a gravação que falha recarrega a lista) | W4 Lista "a lista paginada": `expect(lista).toContainText(`Chegou durante a prévia ${marca}`)`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:314` (gravação recusada tira a prévia) | W4 Lista "a lista paginada": `expect(previa).toHaveCount(0)`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:642` (o início vazio tem o erro no campo dele) | W4 Estrutura "do vazio ao roteiro": `expect(doAno.getByText('Preencha o início.')).toBeVisible()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:642` (o início precisa cair no ano digitado) | W4 Estrutura "do vazio ao roteiro": `expect(doAno.getByText('O início precisa cair em 2026, o ano letivo digitado.')).toBeVisible()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:648` (o fim cai no ano letivo ou no seguinte) | W4 Estrutura "do vazio ao roteiro": `expect(doAno.getByText('O fim precisa cair em 2026 ou em 2027.')).toBeVisible()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:362` (o anúncio do ano criado na seção do ano letivo) | W4 Estrutura "do vazio ao roteiro": `expect(anuncio(secao(page, 'Ano letivo'), 'Ano letivo 2026 criado.')).toBeVisible()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:250` (o anúncio do ano aberto na seção do ano letivo) | W4 Estrutura "do vazio ao roteiro": `expect(anuncio(secao(page, 'Ano letivo'), 'Ano letivo 2026 aberto.')).toBeVisible({ timeout: PRAZO_D…`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:376` (o anúncio da série na seção das séries) | W4 Estrutura "do vazio ao roteiro": `expect(anuncio(secao(page, 'Séries'), '7º ano do Ensino Fundamental criado.')).toBeVisible()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:387` (o anúncio da disciplina criada na seção das disciplinas) | W4 Estrutura "do vazio ao roteiro": `expect(anuncio(secao(page, 'Disciplinas'), `Disciplina ${disciplina} criada.`)).toBeVisible()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:400` (o anúncio da turma criada na seção das turmas) | W4 Estrutura "do vazio ao roteiro": `expect(anuncio(turmas, `Turma ${turma} criada. Abra a turma para subir a lista de nomes.`)).toBeVisi…`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:417` (o anúncio da disciplina renomeada na seção das disciplinas) | "renomear e excluir": `expect(anuncio(disciplinas, `Disciplina renomeada para ${renomeada}.`)).toBeVisible()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:435` (o anúncio da turma renomeada na seção das turmas) | "renomear e excluir": `expect(anuncio(turmas, `Turma renomeada para ${novoNome}.`)).toBeVisible()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:353` (o anúncio da alocação na seção da alocação) | W4 Alocação: `expect(alocado).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })`, nos dois |
| `packages/shared/src/estrutura/ano-letivo.ts:45` (a API recusa o início de outro ano) | `estrutura.int.test.ts`: "o mesmo ano duas vezes na escola dá CONFLITO, também em paralelo; período invert…" |
| `packages/shared/src/estrutura/ano-letivo.ts:46` (a API recusa o fim depois do ano seguinte) | `estrutura.int.test.ts`: "o mesmo ano duas vezes na escola dá CONFLITO, também em paralelo; período invert…" |
| `packages/shared/src/estrutura/ano-letivo.ts:26` (o fim em janeiro do ano seguinte passa) | `estrutura.int.test.ts`: "o mesmo ano duas vezes na escola dá CONFLITO, também em paralelo; período invert…" |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:560` (anos do mais novo ao mais antigo) | W4 Estrutura "depois da virada": `expect(anos.getByRole('listitem')).toContainText(['2026', '2025'])`; W4 Estrutura "do vazio ao roteiro": `expect(anos.getByRole('listitem').first()).toContainText('2099Planejado · de 1 de fevereiro de 2099 …`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:338` (arquivo acima do teto avisado) | W4 Lista "a lista paginada": `expect(subir.getByRole('alert')).toHaveText('A lista é grande demais para um envio só. Divida em par…`, nos dois |
| `apps/web/src/areas/coordenacao/dialogos.tsx:109` (Enter não reenvia sem nova tentativa) | "renomear e excluir": `expect(renomeacoesDeDisciplina).toHaveLength(2)`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:638` (o período acompanha o ano digitado) | W4 Estrutura "do vazio ao roteiro": `expect(doAno.getByLabel('Início')).toHaveValue('2099-02-01')`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:164` (o anúncio da lista junto dos nomes) | W10 "o arquivo do Excel": `expect(anuncio(secao(page, 'Nomes da turma'), '4 nomes gravados na lista.')).toBeVisible({ timeout: …`; W4 Lista "a lista paginada": `expect(anuncio(lista, '1 nome gravado na lista.')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:188` (o anúncio aparece só na seção da ação) | W4 Estrutura "do vazio ao roteiro": `expect(principal(page).getByRole('status').filter({ hasText: 'Ano letivo 2026 criado.' })).toHaveCou…`; "renomear e excluir": `expect(principal(page).getByRole('status').filter({ hasText: `Turma renomeada para ${novoNome}.` }))…`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:342` (as quebras de linha do arquivo viram as do campo) | W10 "o arquivo do Excel": `expect(previa).toBeVisible()`, nos dois |
| `apps/web/src/areas/coordenacao/ler-arquivo-da-lista.ts:71` (o \r sozinho também vira \n) | `ler-arquivo-da-lista.test.ts`: "o \r\n do Excel e o \r sozinho viram \n, e o \n fica" |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:339` (turmas na ordem da escola) | "renomear e excluir": `expect(turmas.getByRole('listitem')).toContainText([comNome.nome, vazia.nome, deOutraPessoa.nome])`, nos dois |
| `apps/web/src/api/cliente.ts:87` (a resposta da API fora do cache HTTP do navegador) | `cliente.test.ts`: "nenhuma resposta da API vai para o cache HTTP do navegador, na leitura e na escr…" |
| `apps/web/src/areas/coordenacao/ler-arquivo-da-lista.ts:41` (o arquivo que o navegador não lê sai como ilegível) | `ler-arquivo-da-lista.test.ts`: "o arquivo que o navegador não consegue ler (apagado depois de escolhido) sai com…" |
| `packages/shared/src/estrutura/ano-letivo.ts:13` (o fim no mesmo dia do início não vale) | `ano-letivo.test.ts`: "o fim antes do início continua recusado no campo do fim, e o fim no mesmo dia ta…" |
| `packages/shared/src/estrutura/ano-letivo.ts:44` (o fim depois do início, no contrato) | `ano-letivo.test.ts`: "o fim antes do início continua recusado no campo do fim, e o fim no mesmo dia ta…" |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:788` (a série que saiu da lista sai da escolha da turma nova) | "renomear e excluir": `expect(daTurma).toHaveCount(0, { timeout: PRAZO_DA_ENTRADA_MS })`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:279` (a resposta não tira o foco de quem já voltou ao campo) | W4 Lista "a lista paginada": `expect(campo).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:523` (o nome avulso não aceita matrícula que parece CPF ou data) | W4 Lista "a lista paginada": `expect(avulso.getByText('Isto parece CPF ou data de nascimento, e não matrícula.')).toBeVisible()`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:555` (nome do aluno fora do corretor ortográfico) | W4 Lista "a lista paginada": `for (const rotulo of ['Nome do aluno', 'Matrícula']) await expect(avulso.getByLabel(rotulo)).toHaveA…`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:567` (matrícula fora do corretor ortográfico) | W4 Lista "a lista paginada": `for (const rotulo of ['Nome do aluno', 'Matrícula']) await expect(avulso.getByLabel(rotulo)).toHaveA…`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:339` (a planilha tem aviso próprio) | W10 "o arquivo do Excel": `expect(avisoDaPlanilha).toContainText('Este arquivo é uma planilha (.xlsx, .xls ou .ods), e não text…`; W4 Lista "a lista paginada": `expect(subir.getByRole('alert')).toContainText('Este arquivo é uma planilha (.xlsx, .xls ou .ods), e…`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:646` (o fim depois do início) | W4 Estrutura "do vazio ao roteiro": `expect(erroDoPeriodo).toBeVisible()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:457` (o anúncio da disciplina excluída na seção das disciplinas) | "renomear e excluir": `expect(anuncio(disciplinas, `Disciplina ${renomeada} excluída.`)).toBeVisible({ timeout: PRAZO_DA_EN…`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:483` (o anúncio da turma excluída na seção das turmas) | "renomear e excluir": `expect(anuncio(turmas, `Turma ${novoNome} excluída.`)).toBeVisible()`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:801` (turma sem nome não é enviada) | W4 Estrutura "do vazio ao roteiro": `expect(criacoes).toEqual(['/v1/anos-letivos', '/v1/anos-letivos', '/v1/turmas', '/v1/disciplinas', '…`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:198` (abrir diálogo apaga o anúncio) | "renomear e excluir": `expect(page.getByText(`Turma renomeada para ${novoNome}.`)).toHaveCount(0)`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:138` (abrir diálogo apaga o anúncio (lista)) | W4 Lista "a lista paginada": `expect(page.getByText('Nome acrescentado à lista da turma.')).toHaveCount(0)`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:226` (a confirmação de retirar diz a matrícula) | W10 "o arquivo do Excel": `expect(retirar).toContainText(`${homonimo}, matrícula 880004, sai da lista desta turma`)`, nos dois |
| `apps/web/src/areas/coordenacao/Estrutura.tsx:644` (o fim vazio tem o erro no campo dele) | W4 Estrutura "do vazio ao roteiro": `expect(doAno.getByText('Preencha o fim.')).toBeVisible()`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:274` (o pedido de foco é atendido uma vez só) | W10 "o arquivo do Excel": `expect(acrescentar).toBeFocused()`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:279` (o foco também é levado de um botão) | W4 Lista "a lista paginada": `expect(principal(page).getByRole('region', { name: 'Prévia' }).getByRole('heading', { name: 'Prévia'…`, nos dois |
| `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:279` (o foco é levado do `body`, onde o botão desligado o deixa) | W10 "o arquivo do Excel": `expect(previa.getByRole('heading', { name: 'Prévia' })).toBeFocused()`; W4 Lista "a lista paginada": `expect(subir.getByRole('alert')).toBeFocused()`, nos dois |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `frontend-reviewer`, 1ª | Foco no `body` com o botão `disabled` durante o pedido; foco no `<h1>` ao trocar de tela | `TODO.md` ("Marca e interface"): é do `Botao` e da casca, e vale para a operação também |
| `frontend-reviewer`, 1ª | Encerrar alocação pela tela (a API tem a rota; o `contestado` não oferece ação) | `TODO.md` e `/validar` da A1: decisão de produto, fora da 13.3. O texto do `CONFLITO` de excluir turma passou a dizer o que a tela não desfaz |
| `frontend-reviewer`, 1ª e 2ª | Link para Professores no vazio da Alocação e no roteiro; o título do vazio contradiz a descrição | `14_task.md` ("Herdado da 13.0"): a tela Professores chega lá, e o W4 é acertado junto |
| `frontend-reviewer`, 1ª | O texto do controle de arquivo segue o idioma do navegador | Recusada: é do navegador, e a tela diz "Arquivo lido: nome" depois de ler |
| `frontend-reviewer`, 1ª | "Gravar lista" dizer o objeto ("Gravar 32 nomes") | Recusada: é o nome do cenário (clique duplo em "Gravar lista"), e o resumo "N nomes entram" fica logo acima do botão |
| `frontend-reviewer`, 1ª | Aluno aprovado sem nome: cartões iguais | `16_task.md` ("Nota da 13.0") |
| `frontend-reviewer`, 1ª | Listas sem virtualização | `TODO.md` ("Marca e interface") |
| `frontend-reviewer`, 1ª e 2ª | "N nomes entram" ao lado de "Nada é gravado" no aviso de CPF | Aplicada em parte: a linha suspeita diz o porquê; o resumo é a conta da API e fica (aceito pelo revisor na 2ª) |
| `frontend-reviewer`, 2ª | O erro do `Campo` sem região viva (Enter com o foco já no campo) | `TODO.md` ("Marca e interface"), no item do foco: é do `Campo`, e vale para todas as telas |
| `frontend-reviewer`, 3ª | O alerta que volta com o texto é `role="alert"` e é lido de novo | `TODO.md`, no item do foco: a rever em teste com leitor de tela |
| `test-engineer`, 2ª | `ENTRADA_INVALIDA` na lista dos códigos que tiram a prévia, sem teste | Declarado em "Mutações": a tela não chega a mandar gravar lista com erro |
| `privacy-guardian`, 1ª | `Cache-Control: no-store` nas respostas nominais da API | Aplicada do lado da web (`cache: 'no-store'`); o cabeçalho da API fica no `/retro` da A1, onde a 2.0 o deixou, e no `TODO.md` |
| `privacy-guardian`, 1ª | CPF sem pontuação passa pela trava; colunas a mais trafegam; e2e da sessão vencida com a lista colada | `TODO.md` ("LGPD e conformidade") e `/validar` da A1, antes de qualquer dado real |
| `revisor-geral`, 1ª | O rascunho da lista se perde quando a sessão vence e a mesma pessoa volta | `TODO.md` ("LGPD e conformidade"), junto do e2e da sessão vencida: o comportamento de hoje é o seguro |
| `revisor-geral`, 1ª | A Alocação corta acima de 1.000 sem aviso | `TODO.md` ("Marca e interface"); a frase da Tech Spec foi acertada |
| `revisor-geral`, 1ª | A classe do `select` repetida; `Anuncio`, `AlertaDaFalha`, `useEnvioUnico` e `textoDaFalha` presos à área | `15_task.md` e `16_task.md` ("Nota da 13.0"): movem-se para `componentes/` quando a área do professor precisar |
| `test-engineer`, 6ª | O texto do motivo `ilegivel` sem asserção em teste | Recusada: a leitura que o navegador recusa não se provoca no e2e; a unidade prova o motivo, o `Record` tipado obriga o texto, e a linha que o mostra tem mutação pelos avisos da planilha e do teto |
| `test-engineer`, 6ª | O sobrevivente `ativo instanceof HTMLButtonElement` | Aplicada depois, com o teste que o `frontend-reviewer` sugeriu na 4ª rodada (um Tab durante a espera): a mutação ficou vermelha |
| `frontend-reviewer`, 4ª | A trava de documento sem saída para falso positivo (matrícula com forma de data) | `TODO.md` ("LGPD e conformidade"), para o `/validar` e as entrevistas do piloto |
| `test-engineer`, 7ª | "Quem está num link continua onde está" só foi visto no roteiro manual do `frontend-reviewer` | `/validar` da A1: não há cláusula a matar (é a ausência do link na guarda) |
| `privacy-guardian`, 2ª, e `revisor-geral`, 2ª | A trava de CPF ou data existe só na tela: a API aceita, na lista e no avulso | `TODO.md` ("LGPD e conformidade"), para o `/validar`: decidir se vai para o contrato (regra 00, item 1), junto com a saída para o falso positivo |
| `tenancy-guardian`, 1ª | `professorAlocavel` fixa o papel de professor, e `criar` grava `pedido.papel` | Aplicada como comentário na guarda (`vinculo.service.ts`): outro papel em `PAPEIS_DE_VINCULO_PELA_COORDENACAO` pede outra guarda |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-01 20:23:44 | 2026-10-01 20:34:11 | `test-engineer` | 1 | REPROVADO | acf8e65dede894937 |
| 2026-10-01 21:11:52 | 2026-10-01 21:18:36 | `test-engineer` | 2 | APROVADO | a5ba0695d0a2f34b8 |
| 2026-10-01 21:25:42 | 2026-10-01 21:35:12 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | a9c2f41f5dc7207fc |
| 2026-10-01 22:20:10 | 2026-10-01 22:27:02 | `test-engineer` | 3 | APROVADO | aae4b05952f11982e |
| 2026-10-01 22:27:54 | 2026-10-01 22:33:06 | `frontend-reviewer` | 2 | AJUSTES NECESSÁRIOS | a8807146fa1f61ff4 |
| 2026-10-01 23:14:21 | 2026-10-01 23:24:15 | `test-engineer` | 4 | REPROVADO | abcfe44c010a6b287 |
| 2026-10-01 23:42:47 | 2026-10-01 23:45:16 | `test-engineer` | 5 | APROVADO | a13db9c7d510c6116 |
| 2026-10-01 23:52:46 | 2026-10-01 23:53:16 | `frontend-reviewer` | 3 | APROVADO | a0150edb9433c0c4c |
| 2026-10-01 23:55:16 | 2026-10-01 23:57:09 | `tenancy-guardian` | 1 | APROVADO | a53d9d69764cccecb |
| 2026-10-01 23:54:53 | 2026-10-02 00:01:10 | `privacy-guardian` | 1 | APROVADO | a8bb6ad8b66bf74fa |
| 2026-10-01 23:54:32 | 2026-10-02 00:02:12 | `revisor-geral` | 1 | APROVADO | ad0b83e1cb5b9b4c1 |
| 2026-10-02 00:32:28 | 2026-10-02 00:40:24 | `test-engineer` | 6 | APROVADO | a36ac1ac367ca2f9a |
| 2026-10-02 00:41:21 | 2026-10-02 00:46:09 | `frontend-reviewer` | 4 | APROVADO | a53cdfe9573de2597 |
| 2026-10-02 01:02:53 | 2026-10-02 01:07:21 | `test-engineer` | 7 | APROVADO | a221a10b0db426280 |
| 2026-10-02 01:08:30 | 2026-10-02 01:09:27 | `privacy-guardian` | 2 | APROVADO | a45dba82fd76c9a58 |
| 2026-10-02 01:08:42 | 2026-10-02 01:09:34 | `tenancy-guardian` | 2 | APROVADO | afeec5859b41ac7b9 |
| 2026-10-02 01:08:15 | 2026-10-02 01:12:00 | `revisor-geral` | 2 | APROVADO | a59d55e6bc743f882 |
