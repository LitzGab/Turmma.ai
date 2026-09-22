# Correção — os achados de revisão de uma funcionalidade viram um arquivo só, que não cabe na janela

**Origem:** uso — medição pedida em 21/09/2026, depois da retrospectiva do F1
**Subagentes obrigatórios:** `revisor-geral` (a correção passa de cinco arquivos e mexe no portão
de commit)
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

O hook `tools/processo/revisoes.ts` escreve **todos** os achados de uma funcionalidade num único
`achados-revisoes.md`, na pasta da funcionalidade. Medido em 21/09/2026:

| Arquivo | Tamanho | Blocos |
|---|---|---|
| `tasks/prd-identidade-e-tenancy/achados-revisoes.md` | 646 KB, 5.263 linhas | 158 rodadas |
| `tasks/correcoes/achados-revisoes.md` | 196 KB (359 KB em 22/09) | 46 rodadas |
| `tasks/prd-estabilidade-da-esteira/achados-revisoes.md` | 82 KB | 10 rodadas |

O crescimento no F1 foi linear, ~33 KB por tarefa: 23 KB no commit da tarefa 1, 646 KB no da
tarefa 20.

O passo 2 do `/executar-task` manda ler esse arquivo **antes de codar cada tarefa** ("é o que os
revisores já exigiram nas tarefas anteriores. Não repita o mesmo erro"). Na tarefa 20 do F1 isso
era um arquivo de 566 KB, uns 150 mil tokens. Ou não foi lido, ou consumiu a janela antes de a
tarefa começar — nos dois casos o passo não acontece. Mesmo problema no `/criar-tasks`
(funcionalidades anteriores), no `/validar` (recomendações sem destino) e no `/retro`.

`tasks/correcoes/achados-revisoes.md` é o pior caso: não rotaciona por funcionalidade, cresce até
o fim do projeto. Entre 21 e 22/09 ele saltou de 196 KB para 359 KB com quatro correções.

## Causa

Duas coisas, e só a segunda é a que economiza.

1. **Granularidade.** O hook usa uma pasta como unidade de arquivo (`dirname(documento)`), quando a
   unidade de leitura é o documento. Quem revisa a tarefa 20 não tem o que fazer com as rodadas da
   tarefa 3.

2. **Falta um índice.** Separar por documento sozinho não resolve o consumidor principal: o passo 2
   do `/executar-task` quer justamente o conjunto das tarefas anteriores, e leria os vinte arquivos.
   O que cabe na janela é um resumo de uma linha por rodada, apontando o bloco inteiro.

Um efeito colateral que a separação **encerra**: o texto dos revisores contém `##` próprios
(`## Bloqueantes`, `## O furo`), que colidem com o delimitador de bloco. Medido: `grep -c '^## '`
devolve 183 num arquivo de 158 rodadas, e o arquivo não é parseável com segurança.

Um que ela **reduz e não encerra**, e vale ser exato porque o contrário se lê fácil: toda tarefa e
toda correção escrevem no mesmo arquivo, então o `git add` de cada commit carrega um arquivo que
outro trabalho em andamento também está tocando. Depois da separação, o bloco deixa de ser
compartilhado, mas o `achados/indice.md` continua sendo — um arquivo por pasta, escrito por todos os
documentos dela. A disputa encolhe de 646 KB para uma linha; não desaparece. É por isso que o índice
ganhou trava, e é por isso que as skills dizem o que fazer quando o `git add` dele trouxer linha de
outro documento.

## Teste que reproduz

`tools/processo/revisoes.test.ts`:

- `guarda o achado no arquivo do documento, não num arquivo único da pasta` — duas rodadas de
  documentos diferentes na mesma funcionalidade têm de cair em arquivos diferentes.
- `o índice resume o que o revisor exigiu e aponta o bloco` — a linha traz a exigência, não só o
  veredito; o parágrafo longo é cortado em 160 caracteres; `|` do texto do revisor não abre coluna
  nova; o caminho absoluto da máquina sai e o do repositório fica.
- `o índice compartilhado não perde linha com rodadas terminando ao mesmo tempo` — seis processos
  `registrar` em paralelo, documentos diferentes, um índice só.
- `o índice de uma funcionalidade inteira cabe no que se lê antes de cada tarefa` — 20 documentos ×
  5 rodadas de ~6 KB: os blocos passam de 600 KB, o índice fica abaixo de 40 KB, e **nenhuma célula
  de resumo passa de 161 caracteres**. O teto por linha inteira foi tentado e descartado: metade da
  linha é o nome do documento, que é dado e não orçamento, e os índices reais vão de 238 caracteres
  por linha a 305 no pior caso real (`tasks/correcoes/`, cujo slug é longo), contra 238 e 242 nas
  outras duas pastas — um teto de 260 reprovaria dado verdadeiro. Esse número já mudou três vezes durante a
  própria correção, inclusive por causa dela (a marca `— editado à mão` alongou a linha mais longa), e
  é essa instabilidade que o desqualifica como asserção. O que o código controla é a célula, e o
  máximo real **das células geradas** é 161 nos três índices: a asserção está colada no dado. A maior
  célula do arquivo tem 197, e é a única escrita à mão. Vale a distinção porque 161 é número de
  gerador, e sem ela a próxima pessoa cita o 197 como se o corte tivesse falhado.
- `"nenhuma" é resposta quando vem pontuada, e é conteúdo quando continua a frase` — os dois lados da
  fronteira que decide se o achado existe.
- `o revisor que resume dentro de uma cerca: a declaração vale, e a cerca não vira resumo` — a forma
  de 9 lugares em 5 documentos, nos dois caminhos: o da seção e o do recuo.
- `o bloqueante vence a recomendação, e o corte recua até a fronteira de palavra` — a precedência
  entre as duas seções decide o texto de **63 das 241 células reais**, e não tinha teste: inverter
  `bloqueantes.item ?? recomendacoes.item` deixava a suíte inteira verde. Achado pelo `test-engineer`
  na 4ª rodada, na linha que a renomeação daquele mesmo diff havia criado.

`tools/processo/separar-achados.test.ts`, sobre a migração:

- separa por documento, com uma linha de índice por bloco;
- rodando de novo sobre pasta já migrada, nada do que estava lá se perde;
- `##` dentro do texto do revisor não vira bloco novo;
- recusa e não apaga a origem quando a conservação não fecha;
- o resumo do índice sai do corpo do bloco, não do cabeçalho.

Todos conferidos por mutação, não por leitura:

| Mutação (texto exato) | Teste que pega a mutação |
|---|---|
| `caminhoDoAchado` devolve `join(dirname(documento), NOME_ACHADOS)` | separa por documento, com uma linha de índice por bloco |
| `comTrava(caminhoIndice, …)` do índice não roda | o índice resume o que o revisor exigiu e aponta o bloco |
| a linha `conferirPlano(plano, indiceAtual)` sai de `migrar` | a conservação falha depois de planejar: a origem sobrevive e o destino não é tocado |
| `resumoDoAchado` devolve sempre `'ver o bloco'` | o resumo do índice sai do corpo do bloco, não do cabeçalho |
| `achadoDaRodada` perde o `&& !temSecaoSemDeclaracao(mensagemFinal)` | seção escrita e vazia não é declaração de que nada foi exigido |
| `encurtar` devolve `texto` sem olhar `LIMITE_DO_RESUMO` | o índice resume o que o revisor exigiu e aponta o bloco |
| `COMECA_SEM_NADA` vira `/^(nenhum[ao]?\|n\/a\|nada)\b/i` (sem `\s*[.;]`) | "nenhuma" é resposta quando vem pontuada, e é conteúdo quando continua a frase |
| `util` vira `corpo` (a cerca deixa de ser pulada na seção) | o revisor que resume dentro de uma cerca: a declaração vale, e a cerca não vira resumo |
| o `filter(!CABECALHO_DE_SECAO)` sai do recuo de `resumoDoAchado` | seção escrita e vazia não é declaração de que nada foi exigido |
| `planejarMigracao` parte de `new Map<string, string>()` em vez de `new Map(destino)` | rodando de novo sobre pasta já migrada, nada do que estava lá se perde |
| `CABECALHO_DE_BLOCO` com todos os grupos opcionais (`/^## (?:…)?.*$/`) | `##` dentro do texto do revisor não vira bloco novo |
| a trava do índice sai de `registrar` | o índice compartilhado não perde linha com rodadas terminando ao mesmo tempo (10 de 10 execuções) |
| `exigenciaDaRodada` devolve `recomendacoes.item ?? bloqueantes.item` | o bloqueante vence a recomendação, e o corte recua até a fronteira de palavra |
| `lerAsDuasSecoes` troca os regex das duas seções | o bloqueante vence a recomendação, e o corte recua até a fronteira de palavra |
| `RECUO_MAXIMO_DO_CORTE` vira `0` | o bloqueante vence a recomendação, e o corte recua até a fronteira de palavra |

**A coluna é o nome do teste, não a contagem de vermelhos, e isso é conserto de um erro repetido.**
A contagem errou três vezes seguidas — e as três vezes quem pegou foi o `test-engineer`. O motivo é
que ela depende do texto exato da mutação: inserir um `rmSync` mantendo o do fim dá 5 vermelhos, dos
quais 4 são `ENOENT` do segundo; mover o `rmSync` dá 1. O número parecia evidência e era ruído. O que
a tabela precisa provar é que **toda** mutação é pega e por qual teste, e isso é reprodutível.

A coluna também não diz "primeiro" teste vermelho: em duas linhas o teste nomeado é vermelho mas não
é o primeiro na ordem entre arquivos, que não é propriedade do código. Diz o teste que **pega** a
mutação, que é o que a evidência precisa afirmar.

Sem a trava, 10 de 10 execuções vermelhas. Com ela, 15 execuções seguidas da suíte inteira, verdes,
mais outras 34 medidas pelo `test-engineer`, incluindo 12 sob contenção de quatro vitest simultâneos.

**Uma intermitência observada, e o que ela foi:** o teste de concorrência deu vermelho uma vez, na
mesma invocação em que o arquivo acabara de ser escrito — vitest leu o arquivo pela metade. Depois
disso, 15 execuções seguidas da suíte inteira, verdes, mais 6 do teste sozinho. Fica registrado porque teste intermitente é proibido, e a próxima pessoa que vir um
vermelho isolado aqui merece saber o que já foi investigado.

## Correção

**`tools/processo/revisoes.ts`**

- `caminhoDoAchado(documento)` → `<pasta>/achados/<base>.md`; `caminhoDoIndice(documento)` →
  `<pasta>/achados/indice.md`.
- `exigenciaDaRodada(mensagem)`: extrai o primeiro item das seções "Bloqueantes" ou "Recomendações"
  do texto do revisor, nas sete formas que eles de fato escrevem (`Bloqueantes:`, `**Bloqueantes:**`,
  `## Bloqueantes`, com ou sem `(não bloqueiam)`, item na mesma linha ou abaixo). `nenhum`, `nenhuma`
  e `n/a` contam como vazio, inclusive quando o revisor responde e segue falando
  (`Bloqueantes: nenhum. A correção exigida na 1ª rodada foi feita:` — 2 dos 214 blocos do F1). O
  ponto é o que separa a resposta do resto: sem ele, `nenhuma das rotas está protegida` é conteúdo, e
  `Recomendações:\n- nenhuma das três guardas cobre a virada de ano letivo` sumiria sem deixar rastro
  — que é justamente o defeito do `TODO.md` que esta correção fecha. Os dois lados têm teste.
- `resumoDoAchado(mensagem)`: a exigência, ou a primeira linha substantiva quando o revisor não usou
  nenhuma das duas seções (acontece com o `test-engineer`, que escreve "Cenários exigidos"). Linha de
  cerca (` ``` `) nunca vira resumo, nos dois caminhos — o índice real já tinha uma célula assim, em
  `tasks/correcoes/achados/indice.md`. O conserto entrou no código, mas o artefato migrado não se
  regenera (a origem já foi apagada), então aquela célula foi **editada à mão** nesta correção. Fica
  registrado porque o texto que está lá é mais útil a quem lê do que o que `resumoDoAchado` devolveria
  para aquele bloco (o preâmbulo "Auditei por leitura e por mutação independente…", que vem antes da
  cerca): aquela linha é a única do corpus que não é saída do gerador, e por isso leva a marca
  `— editado à mão` na própria célula. Sem a marca, quem conferir índice contra bloco lê como defeito
  do gerador.
- **A assimetria entre guardar e resumir é de propósito, e está fixada por teste.** Guardar usa só
  `exigenciaDaRodada`; o resumo tem também o recuo. Revisor que declara "Bloqueantes: nenhum /
  Recomendações: nenhuma" não exigiu nada, e a prosa que ele escreve depois é justificativa, não
  pedido: guardá-la devolveria ao corpus as 172 rodadas aprovadas de 237, que é o peso que esta
  correção tirou. O recuo serve à rodada que **já vai ser guardada** por ter reprovado, para a célula
  do índice não sair vazia.
- **Seção vazia não é declaração** (`temSecaoSemDeclaracao`). São três desfechos, não dois: ausente,
  declarou nada, e escrita-mas-vazia. No terceiro o conteúdo está **fora** da seção, e descartar
  apaga o bloco inteiro. O caso é real: `test-engineer · 2ª rodada · APROVADO · 2026-09-21 17:26:58`
  tem `Recomendações:` como última linha dentro de uma cerca e R1 a R5 em prosa depois dela. O filtro
  de cerca, sozinho, fez esse bloco desaparecer — uma regressão que eu introduzi tratando um achado
  do próprio revisor, e que ele pegou na 2ª rodada. Varredura dos 239 blocos do corpus com o critério
  final: **0 perdidos**.
- Cabeçalho de seção não vira resumo: `Bloqueantes: nenhum. Os dois da rodada 1 estão fechados` é a
  declaração, e o que o revisor exigiu está abaixo dela.
- `acrescentarNoIndice(...)`: uma linha por rodada, com fim, revisor, rodada, veredito, documento e
  resumo. O bloco inteiro se acha no arquivo do documento pelo cabeçalho com o mesmo fim. O caminho
  absoluto da máquina é cortado até a raiz do repositório: metade dos revisores cita o arquivo assim,
  e num resumo de 160 caracteres o prefixo é igual em todas as linhas e come a informação.
- `registrar` escreve os dois, com trava no índice dentro da trava do documento (ordem fixa, sem
  ciclo). O índice é o único arquivo que dois documentos da mesma pasta escrevem, e a disputa não é
  hipótese: enquanto esta correção era escrita, outra sessão registrava rodadas em
  `tasks/correcoes/achados/indice.md`. Medido: sem a trava, seis rodadas em paralelo perdem linha em
  4 de 5 execuções; com ela, 5 de 5 verdes.
- `achadoDaRodada` passa a decidir por `exigenciaDaRodada`, e não pelo regex `Recomendações:`. **Isto
  fecha o defeito do `TODO.md`**: o regex exigia os dois pontos, então `## Recomendações (não
  bloqueiam)` seguido dos itens não casava, e a rodada ia para a tabela do documento sem bloco nenhum.
  Conferido nos 214 blocos do F1: nenhum bloco que existe hoje deixa de existir com o critério novo —
  a mudança só acrescenta os que se perdiam.

**`tools/processo/separar-achados.ts`** — migração, com o CLI separado das funções puras
(`planejarMigracao`, `conferirPlano`, `separarBlocos`) para a suíte poder testá-las sem rodar o
script. Fica no repositório: branch aberta antes da separação traz o formato único de volta no merge.

Por isso ela **acumula**: lê o que já está em `achados/`, ignora bloco que o destino já tem
(identidade = revisor + rodada + fim) e só acrescenta o que falta. A primeira versão sobrescrevia, e
rodar de novo apagava o achado anterior — exatamente o caso pelo qual o script existe.

A conservação é conferida antes de qualquer escrita: blocos e linhas de índice no fim têm de ser os
que já existiam mais os que entraram. Arquivo antigo com bloco repetido é recusado em vez de
deduplicado — a migração não escolhe qual descartar. O `rmSync` da origem é a última linha, depois de
tudo escrito e conferido.

**Skills e agentes** — nove arquivos passam a mandar ler o índice e abrir só o bloco que interessa:
`executar-task`, `executar-tasks`, `executar-review`, `corrigir`, `criar-tasks` (mais o
`task-template.md`), `retro`, `revisar-spec`, e o agente `validador`. `CLAUDE.md`, `TODO.md` e
`docs/decisoes.md` acompanham.

**O que ficou de fora, de propósito**

- O corte em 80 linhas do `achadoDaRodada` continua: disparou uma vez em 214 blocos, de 26 linhas.
  Não é onde está o peso.
- `retro.md` e `validacao.md` do F1 continuam citando `achados-revisoes.md`, e algumas citações têm
  número de linha que a migração invalida. São registros históricos de um período fechado:
  reescrevê-los seria apagar o que a validação de fato viu. Ficam como estão.
- Duas sessões na mesma árvore não passam pelo portão: ele é de árvore inteira e o carimbo é um
  arquivo só. Custou, nesta correção, um portão vermelho em cinco testes de integração que passavam
  sozinhos, e um `git reset --hard HEAD` de outra sessão que apagou o trabalho não commitado. Está no
  `TODO.md`; decidir o combinado (uma sessão por vez, ou worktree por sessão) é outra conversa.
- O carimbo do portão local grava o instantâneo de conteúdo **no fim** da execução, então arquivo
  editado durante a corrida entra como se as suítes o tivessem rodado, e o `conferir` responde
  "válido" para código que nunca passou. Achado durante esta correção, é outro defeito e vai para o
  `TODO.md`.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-22 08:44:18 | 2026-09-22 08:54:17 | `test-engineer` | 1 | REPROVADO | aeef9740e86a1045b |
| 2026-09-22 09:05:34 | 2026-09-22 09:13:57 | `test-engineer` | 2 | REPROVADO | a8658bcb8b93c40bc |
| 2026-09-22 09:27:27 | 2026-09-22 09:36:36 | `test-engineer` | 3 | APROVADO | a02a6dbd63af31ba1 |
| 2026-09-22 09:46:37 | 2026-09-22 09:52:14 | `revisor-geral` | 1 | REPROVADO | acd83afc2baa8248d |
| 2026-09-22 10:00:24 | 2026-09-22 10:07:41 | `test-engineer` | 4 | REPROVADO | ad01b73176ee40a91 |
| 2026-09-22 10:16:19 | 2026-09-22 10:19:05 | `test-engineer` | 5 | APROVADO | a6b107d7bc890cef6 |
| 2026-09-22 10:19:43 | 2026-09-22 10:26:12 | `revisor-geral` | 2 | APROVADO | a2c74be64242f2feb |
