# Achados das revisões — `tasks/prd-telas-da-coordenacao/14_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-16 16:47:43 · `tasks/prd-telas-da-coordenacao/14_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A mudança fica só na web e não altera API, contrato, migration nem consulta. As telas continuam lendo `EscolaDoPainel` e `UsoDaEscolaDoPainel`, os dois `z.strictObject` de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/packages/shared/src/operacao/painel.ts:194` e `:230`. Esses contratos trazem escola, slug, rede, estado e contagens agregadas. O único nome de pessoa na casca é o do próprio operador (`eu.data?.nome`), que já estava lá e continua igual.

Fora da tabela de dados do docs/lgpd.md: nada, porque não há campo novo.

Autorização por objeto: não se aplica nesta tarefa, porque nenhuma rota ou repository mudou. O e2e continua provando que, sem sessão, os dois endereços levam à entrada da operação.

Logs: limpos. O diff não acrescenta `console` nem `logger`.

Auditoria: não se aplica. A tarefa não tem leitura de dado de aluno, exportação, nota, permissão nem saída de IA.

Envio externo: nenhum.

Seed/fixture: sintético.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/__fixtures__/tela-da-operacao.tsx` usa "Escola Sintética N", "Rede Sintética", UUIDs fixos e um token de teste.
- Os nomes "Maria da Silva", "Joana Pereira" e o e-mail `maria@escola.example` aparecem só nos testes negativos, para provar que a tela os recusa.

A regra D76 está provada por teste, não só declarada:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/paginas/Escolas.test.tsx` confere que a tabela tem exatamente as quatro colunas Escola, Rede, Coordenação e Uso. Também confere que uma resposta com `coordenacao: { nome, email }` é recusada pelo contrato: a tela mostra o erro e a pessoa não aparece.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/paginas/Uso.test.tsx` faz o mesmo com um campo `aluno` injetado.
- A coordenação aparece só pelo estado (`TEXTO_DO_ESTADO`), nunca por nome ou e-mail. A frase fixa "A operação não vê dado de aluno nem de professor: nem nome, nem nota, nem conversa." está coberta por mutação.

Fotos da tela: não vieram, então a auditoria foi feita só pelo código. O que a tela mostra sai das quatro colunas de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/paginas/Escolas.tsx` e das medidas de infra de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/paginas/Uso.tsx`. Nenhuma delas traz nome, matrícula ou conteúdo de pessoa.

Pergunta de fechamento: esta tarefa não acrescenta dado nem destino de envio, então não muda a resposta do sistema sobre o que guarda de um aluno e para onde já enviou.

Bloqueantes: nenhum.

Recomendações:
- A verificação de texto de "nenhum dado de pessoa" (`not.toMatch(/@|matr[ií]cula|e-mail/i)`) não pega um nome de pessoa. Quem protege de fato é o teste do contrato estrito. Vale dizer isso no comentário do teste para ninguém tomar a regex como a garantia.
- Quando a vitrine passar a cobrir `/operacao` e `/operacao/uso`, fotografar as duas telas nas duas larguras e conferir nelas o que este parecer viu só pelo código.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-16 16:47:44 · `tasks/prd-telas-da-coordenacao/14_task.md`

VEREDITO: AJUSTES NECESSÁRIOS

Tela vista: não. A vitrine não cobre a operação e a web do ambiente de teste não está de pé, então não houve fotos. Revisei pelo código, pelo e2e e pelo diff, e rodei os 113 testes de unidade de `apps/web/src/operacao`, todos verdes. A tela terá de ser vista na validação, em `/operacao` e `/operacao/uso`, a 1366 px e a 360 px, na escola cheia e na vazia.

Estados: ok no código.
- Escolas e Uso têm carregando, erro com "Tentar de novo" e a tela no lugar, vazio que convida, a página além da última e com dado.
- A troca de página deixa a lista ocupada (`aria-busy`) em vez de piscar o vazio.
- O erro numa recarga com dado aparece dentro da região e não derruba a lista.

Acessibilidade: ok.
- O `h1` "Operação" fica à vista.
- A `nav` "Operação" tem `aria-current` e alvos de 44 px.
- O estado da coordenação sai em texto de `TEXTO_DO_ESTADO`, com a cor só de reforço.
- A região que rola só recebe `tabIndex` quando rola, e o anel de foco global de 3 px vale para ela.
- Cada botão de ação carrega a escola no nome acessível, com o complemento em `sr-only`.
- Rótulos e títulos de diálogo não mudaram.

Chromebook fraco: ok.
- Existe uma estrutura de cada vez no documento, escolhida por `useMidia`. A lista rola por dentro (`RegiaoDaLista`), a página não rola a 1366 × 768 e as páginas ficam presas no pé.
- A paginação vem do servidor.
- Não medi o limite de 60 kB do pedaço `operacao-*`. A tarefa pede a medida antes e depois, e eu não a vi registrada.

Celular: ok pelo código.
- Abaixo de 768 px as duas telas viram lista de cartões. Os números usam `whitespace-nowrap`, os nomes usam `wrap-anywhere`, e os botões têm 44 px.
- O e2e cobre `larguraExcedente` a 360 px nos dois projetos.

Ação oficial protegida: sim. Esta tarefa não cria ação oficial, e os diálogos de convite não mudaram. A página só mostra escola, rede, estado e número, e a frase fixa diz isso à vista (D76).

Bloqueantes:
1. `apps/web/src/operacao/paginas/Escolas.tsx:166`, junto com o botão do topo em `:148`.
   - Na escola vazia (primeiro dia), a tela mostra dois botões `primario` laranja: "Nova escola" no topo e "Nova rede" dentro do `EstadoVazio`, que desenha a ação sempre como `Botao` primário.
   - Há ainda dois botões chamados "Nova rede", um secundário e um primário.
   - Isso contradiz `docs/interface.md:1363` ("No máximo um por tela") e a subtarefa 14.2 ("Nova escola é o único botão primario").
   - Pior: o próximo passo real na escola vazia é a rede, mas o primário do topo aponta para "Nova escola".
   - O teste `Escolas.test.tsx:74-82` fixa o defeito, com `getAllByRole('button', { name: 'Nova rede' })).toHaveLength(2)`. O teste de `:214` só confere a escola cheia.
   - Correção exigida: na escola vazia haver um único primário e um único "Nova rede". As duas saídas possíveis são tirar a ação do `EstadoVazio` e deixar o botão do topo como único convite, ou rebaixar o "Nova escola" do topo enquanto não há escola. Depois, trocar a asserção do teste por "exatamente um botão `bg-laranja` na tela vazia". O e2e W7 precisa ser ajustado junto, se ele depender do botão do vazio.

Recomendações:
- `NavegacaoDaLista.tsx:21`: o `SeletorDeOrdem` ainda é a pílula antiga (`border-noite bg-noite`, `rounded-full`). O mockup e a Tech Spec usam o `Segmentado` no lugar. Fica para a tarefa que tocar o arquivo.
- `Uso.tsx:176` ("consolidação") e o `caption` em `Uso.tsx:63` ("Uso de infra") vazam jargão. Sugestão: "O dia de hoje entra na madrugada seguinte" e "Uso de cada escola…".
- A divergência do Uso, que mantém a tabela dele em vez de usar a `Tabela`, está justificada e registrada na §9 da Tech Spec. É aceitável, mas a pele duplicada (moldura, 44 px e 64 px) é uma segunda fonte de verdade que pode divergir da peça.
- Faltam as fotos manuais pedidas pela tarefa ("Telas vistas"). Para a validação, anexar as quatro fotos de `/operacao` e `/operacao/uso`.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-16 16:49:01 · `tasks/prd-telas-da-coordenacao/14_task.md`

VEREDITO: REPROVADO
Escopo: incompleto
Aderência à Tech Spec: divergência em `techspec.md` §9, parágrafo "Operação". O erro das duas telas não passou às peças `estado/`, e isso não foi registrado.
Portão local: carimbo válido

Bloqueantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/prd-telas-da-coordenacao/14_task.md:26`, junto com `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/componentes/CascaDaOperacao.tsx:471`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/paginas/Escolas.tsx:190` e `:201`, e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/paginas/Uso.tsx:174` e `:189`.
  - **O que está errado:** a 14.5 pede "Os vazios e os erros de hoje, nas peças `estado/`" e está marcada `[x]`. Só os vazios passaram (`EstadoVazio`, `VazioAlemDaUltima`). Os erros continuam no `ErroDaOperacao`, a peça própria da operação, que ficou intocada e com a borda de 1 px antiga. Nenhuma das telas usa `componentes/estado/EstadoErro`. A tabela "Divergências resolvidas nesta tarefa" não fala disso, e o §9 reescrito também não. Isso é subtarefa não feita, ou divergência decidida em silêncio.
  - **Correção exigida:** escolha um dos dois caminhos.
    - (a) Levar o erro de Escolas e de Uso para o `EstadoErro`, mantendo o texto da operação ("O Turmma está indisponível agora…", de `operacao/textos.ts` `textoDaFalha`), que os testes de componente e os e2e afirmam.
    - (b) Se a peça não serve à operação (a mensagem vem de `mensagemDoErro`, e o texto da operação fica fora do catálogo, no chunk dela), registrar a divergência com o motivo, ao mesmo tempo no `techspec.md` §9 ("Operação") e numa linha da tabela de divergências do `14_task.md`.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/paginas/Uso.tsx:46`: a função local se chama `Tabela`, o mesmo nome da peça `componentes/Tabela`, que a Escolas importa. Isso confunde quem lê as duas telas lado a lado. Um nome como `TabelaDoUso` resolve.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/componentes/RegiaoDaLista.tsx:13` (`useSobra`) repete a medição de sobra que `componentes/Tabela.tsx` já faz por conta própria. Isso dá dois jeitos de medir a mesma coisa. Vale a `Tabela` passar a usar o mesmo gancho numa tarefa que toque nela, ou levá-lo para `componentes/`.
- A 14.0 pede medir o chunk `operacao-*` antes e depois, com teto de 60 kB, já que entraram `Tabela`, `Estado` e o `Lock` do `lucide-react`. Também pede as fotos à mão de `/operacao` e `/operacao/uso` em "Telas vistas". Nenhuma das duas coisas está registrada no documento. O teto vai ser cobrado pela esteira (`tools/ci/tamanho-web.test.ts`), mas o número devia constar no relatório da tarefa.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-16 16:49:36 · `tasks/prd-telas-da-coordenacao/14_task.md`

VEREDITO: REPROVADO

Cenários exigidos:
- Caminho feliz: Escolas com as quatro colunas (Escola com `/e/<slug>`, Rede, Coordenação, Uso). Uso com o dia e o mês de referência no cabeçalho. O `h1` "Operação" e a frase fixa à vista. O título da aba continua "Escolas" e "Uso".
- Os quatro estados nas duas telas: carregando, erro com "Tentar de novo", vazio que convida, e com dado. Na troca de página, a lista anterior fica na tela, ocupada, sem piscar o vazio.
- Os sete estados da coordenação em texto, cada um só com a ação que ele permite, no computador e no celular.
- Borda: escola sem turma ("Sem turma ainda"). Singular e plural ("1 turma · 1 professor · 1 aluno"). Data de referência vinda da API, e não do relógio do navegador. Nome e endereço no limite a 360 px. Página além da última.
- Borda do RF23: a 1366 × 768 a página não rola e a lista rola por dentro, pelo teclado. A 360 px nada rola de lado.
- Isolamento e privacidade (D76): nenhum nome, e-mail ou matrícula na tela. Resposta da API que traga pessoa é recusada pelo contrato.
- Permissão: sem sessão, `/operacao` e `/operacao/uso` levam à entrada da operação.
- Concorrência: o clique duplo que cria uma escola só já tem e2e, que a tarefa não alterou. A tarefa não cria operação nova que possa rodar duas vezes.

Cobertos:
- `apps/web/src/operacao/paginas/Escolas.test.tsx`: os quatro estados, a troca de página com `aria-busy`, os sete estados com a matriz de ações por extenso no computador e no celular, o uso por extenso e "Sem turma ainda", as quatro colunas, a resposta com pessoa recusada, e "Nova escola" como único botão cheio.
- `apps/web/src/operacao/paginas/Uso.test.tsx`: os quatro estados, o vazio que leva a `/operacao`, a troca de página, o cabeçalho com dia e mês, os cartões abaixo de 768 px sem tabela, a referência da API, a moldura que só ganha foco quando rola, e a resposta com nome de aluno recusada.
- `RegiaoDaLista.test.tsx` e `CascaDaOperacao.test.tsx`: foco só quando a lista rola, `aria-busy`, páginas no pé da região, o `h1` "Operação", a frase fixa, e a ordem título, abas, tela dentro do `main`.
- O e2e do RF23 nas duas telas. Os casos W6 e W10 continuam lendo a ordem por `data-nome-da-escola`. Permissão: `e2e/operacao.spec.ts:120` e `e2e/operacao-uso.spec.ts:204`.
- Conferi as 16 mutações do documento: cada uma deixa vermelho o teste citado, pelo motivo certo. A suíte `apps/web/src/operacao` passa inteira: 113 testes em 13 arquivos.
- Não há `.skip`, teste comentado nem provedor de IA. A rede falsa e os stubs de `matchMedia` e `ResizeObserver` só substituem o navegador, não a regra.

Bloqueantes:
- `apps/web/src/operacao/paginas/Uso.tsx:186`: `ocupada={trocando}` é cláusula nova do diff e não tem bloco de mutação.
  - A mesma cláusula em `Escolas.tsx:198` tem bloco, e o documento manda declarar também as cópias da mesma regra em outro arquivo.
  - Correção: acrescentar em "Mutações" o bloco `arquivo: apps/web/src/operacao/paginas/Uso.tsx`, `teste: apps/web/src/operacao/paginas/Uso.test.tsx › na troca de página, a anterior fica na tela`, com `-          ocupada={trocando}` e `+          ocupada={false}`.
  - O teste já existe e o `waitFor(aria-busy 'true')` fica vermelho com essa troca. Falta só declarar o bloco para o portão provar.

Recomendações:
- A 14.4 pede que número comprido não quebre a linha no meio, e nenhum teste prova isso. Hoje só o `whitespace-nowrap` garante, em `Valor`, `Uso.tsx` cerca da linha 438, e em `UsoDaEscola`, `Escolas.tsx` cerca da linha 318. Uma forma de provar: no e2e a 360 px, conferir que cada valor ocupa uma linha só (`getClientRects().length === 1`) com um número grande semeado, por exemplo 1.234.567 requisições.
- `Escolas.test.tsx:197-199` e `Uso.test.tsx:180` (sem `@`, matrícula ou e-mail no corpo) passam sempre, porque os dados de teste não têm nada disso. O teste de privacidade que vale de fato é o da resposta com pessoa recusada. Os dois podem sair, ou passar a usar uma resposta que traga o campo.
- Falta declarar, num teste, a intenção para uma escola com `turmas: 0` e `professores > 0`: hoje "Sem turma ainda" esconde a contagem de professores. Pode acontecer na virada do ano letivo, com o vínculo do ano novo antes da turma importada.
- Não rodei o e2e: o ambiente de teste da web não está de pé e a regra é não pôr a máquina sob carga. O RF23, que depende de altura real, fica para o portão e para a esteira.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/prd-telas-da-coordenacao/14_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/paginas/Uso.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/paginas/Uso.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/paginas/Escolas.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/paginas/Escolas.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/componentes/RegiaoDaLista.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/componentes/RegiaoDaLista.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/__fixtures__/tela-da-operacao.tsx`

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-16 17:23:01 · `tasks/prd-telas-da-coordenacao/14_task.md`

VEREDITO: APROVADO
Tela vista: não. A vitrine não cobre `/operacao`, e a web do ambiente de teste não está de pé. Revisei pelo código e pelo diff, e a tela fica para a validação da spec. O mesmo vale para as telas de `/operacao` e `/operacao/uso` em 360 e 1366 px.
Estados: ok.
- Carregando (`EstadoCarregando`), vazio, erro com "Tentar de novo" (`ErroDaOperacao`) e com dado estão presentes em Escolas e Uso.
- A página além da última tem vazio próprio, com o caminho de volta.
- O vazio da Escolas convida com "Nenhuma escola ainda. Comece criando a rede.", sem pedir desculpa.
Acessibilidade: ok.
- A região da lista tem rótulo e `aria-busy`.
- O erro usa `role="alert"` e o "Tentando de novo…" usa `role="status"`.
- O estado da coordenação sai em texto, com ícone, e não só por cor.
- As ações da linha dizem de que escola são (WCAG 2.5.3).
- O foco volta a um lugar estável quando o botão que o tinha sai da linha.
Chromebook fraco: ok.
- A lista rola por dentro da `RegiaoDaLista` a partir de 768 px, com as páginas presas no pé.
- É paginada, a 25 por página, e não há imagem.
- Não medi throttling.
Celular: ok pelo código.
- Abaixo de 768 px a lista vira cartões, e a tabela do Uso rola na própria moldura.
- Os e2e conferem 360 e 768 px sem rolagem horizontal, e o número que quebraria é conferido por `getClientRects`.
- O botão do vazio do Uso tem teste de 44 px.
- Nada depende de hover.
Ação oficial protegida: sim. A tarefa não tem ação oficial. O convite da coordenação passa por diálogo próprio, e revogar tem `ConfirmarConvite`.

Correção exigida da rodada anterior (feita):
- O `EstadoVazio` da Escolas deixou de levar ação (`Escolas.tsx:191-193`). Na escola vazia resta um só "Nova rede" (secundário, no topo) e um só botão `bg-laranja`, o "Nova escola". Isso cumpre `docs/interface.md:1363` e a subtarefa 14.2.
- `Escolas.test.tsx:79-82` agora afirma exatamente um "Nova rede" e `['Nova escola']` entre os botões cheios.
- O e2e W7 foi ajustado junto (`e2e/operacao-escolas.spec.ts:247-249`, `toHaveCount(1)` e `button.bg-laranja` com `toHaveText(['Nova escola'])`).
- Há mutação declarada para a correção, com o teste citado, na `14_task.md`.
- O Uso não ficou com dois primários: não tem botão no topo, e o vazio dele leva só "Ir para Escolas".

Bloqueantes: nenhum.

Recomendações:
- No vazio da Escolas, o texto diz "Comece criando a rede", mas o único botão laranja é "Nova escola". O primeiro passo (a rede) fica no botão secundário. Vale a coordenação do texto com o destaque quando a tela for fotografada. Se for ajustar, o `Nova escola` pode sair do primário enquanto não há rede, ou o texto pode apontar o botão certo.
- `NavegacaoDaLista.tsx:21`: o `SeletorDeOrdem` ainda é a pílula antiga, e o mockup usa o `Segmentado`. A tarefa já registrou isso para quem tocar o arquivo.
- Na validação, fotografar à mão `/operacao` e `/operacao/uso`, cheias e vazias, em 360 e 1366 px.
- O `TODO.md` já registra a pergunta de produto sobre a coluna Uso com `turmas: 0` e professores com vínculo.

Arquivos principais:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/paginas/Escolas.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/paginas/Escolas.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/operacao-escolas.spec.ts`

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-16 17:23:06 · `tasks/prd-telas-da-coordenacao/14_task.md`

VEREDITO: APROVADO

Esta é a 2ª rodada. Auditei só o diff entre `376782c` e `2bb5768`, e a árvore de trabalho é igual a esse diff nos arquivos rastreados. Eu não exigi nenhuma correção na 1ª rodada, então não havia correção para conferir. A minha recomendação de explicar o teste de "nenhum dado de pessoa" foi aplicada: as verificações por regex, que passavam sempre, saíram, e entrou um comentário dizendo que a garantia vem do contrato estrito. Fiz isso em `Escolas.test.tsx:192` e em `Uso.test.tsx:175`. Os dois testes que recusam a resposta com pessoa continuam lá, em `Escolas.test.tsx:204` e `Uso.test.tsx:178`, e o contrato continua `z.strictObject`, em `packages/shared/src/operacao/painel.ts:194`.

Campos pessoais tocados: nenhum. O diff mexe em quatro coisas, todas sem dado de pessoa:
- a pele do `ErroDaOperacao`;
- a remoção da ação do `EstadoVazio` na Escolas;
- textos de legenda e de apoio no Uso;
- dois e2e de números grandes.

Nenhuma rota, contrato, migration ou consulta mudou.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: não se aplica, porque nenhuma rota ou repository foi alterado.

Logs: limpos. Nenhum `console` ou `logger` no diff nem nos arquivos tocados.

Auditoria: não se aplica. A tarefa não tem leitura de dado de aluno, exportação, nota, permissão nem saída de IA.

Envio externo: nenhum.

Seed/fixture: sintético. O `trocarAPrimeiraDaResposta`, em `e2e/__fixtures__/tela-da-operacao.ts:168`, pega a resposta real do painel semeado, que é sintético, e só reescreve as contagens e as medidas da primeira escola com números inventados. Nenhum dado de pessoa entra. A linha nova do `TODO.md` é pergunta de produto sobre a contagem agregada e não traz dado.

Fotos da tela: não vieram, então a auditoria foi só pelo código. As duas telas continuam mostrando só escola, rede, estado da coordenação em texto e números agregados (D76).

Pergunta de fechamento: a tarefa não acrescenta dado guardado nem destino de envio, e a resposta do sistema sobre um aluno continua a mesma.

Bloqueantes: nenhum.

Recomendações:
- A recomendação da 1ª rodada continua valendo: fotografar `/operacao` e `/operacao/uso` nas duas larguras quando a vitrine cobrir a operação. Ela já está registrada para a validação da spec no `14_task.md`.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-16 17:23:36 · `tasks/prd-telas-da-coordenacao/14_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")

Bloqueantes: nenhum.

A correção da rodada anterior foi feita pelo caminho (b). O motivo de manter o erro no `ErroDaOperacao` está registrado nos dois lugares que eu exigi:
- **Tech Spec:** frase nova no `techspec.md` §9, parágrafo "Operação". A mensagem vem de `textoDaFalha`, no chunk da operação, e o `EstadoErro` escreve pelo catálogo da entrada.
- **Tarefa:** terceira linha da tabela de divergências do `14_task.md`.

A pele do `ErroDaOperacao` (`CascaDaOperacao.tsx:141-147`) passou a ser a do `EstadoErro` (`componentes/estado/EstadoErro.tsx:25-31`): borda de 2 px e `t-apoio`.

Conferi também o resto do diff desde a minha rodada:
- **Vazio da Escolas sem ação:** é a correção que o `frontend-reviewer` exigiu, e está declarada no §9 da Tech Spec. A asserção do teste de componente e a do e2e W7 mudaram junto, e a mutação foi declarada.
- **Renomeação para `TabelaDoUso`:** atende a recomendação que fiz na 1ª rodada. O bloco de mutação foi atualizado.
- **Textos do Uso sem jargão:** nenhum teste nem e2e afirma o texto antigo. As únicas ocorrências restantes de "consolidação" estão em comentários.
- **Mutação do `ocupada` do Uso:** foi acrescentada, como o `test-engineer` pediu.
- **e2e 14.4 dos números grandes e a recomendação recusada:** o e2e entrou com os helpers `trocarAPrimeiraDaResposta` e `conferirQueCadaNumeroFicaEmUmaLinha`. A recomendação recusada foi para o `TODO.md` com dono.

Recomendações:
- **A pele nova do erro alcança telas fora desta tarefa.** O `ErroDaOperacao` também é usado em `apps/web/src/operacao/paginas/ConfigurarMfa.tsx:154`, `apps/web/src/operacao/paginas/Convite.tsx:126`, `apps/web/src/operacao/paginas/NovaEscola.tsx:125` e `apps/web/src/operacao/rotas.tsx:51` e `:86`. O segundo fator e o convite do operador estão no "Fora do escopo" da 14.0. A mudança é só de classe e deixa essas telas iguais à pele do produto (D80), por isso não bloqueia. Mas vale uma frase na linha da divergência dizendo que a pele muda nessas telas também, e não só em Escolas e Uso.
- **Medida do pedaço `operacao-*`:** a 14.0 pede medir antes e depois, com teto de 60 kB. O número ainda não está no documento da tarefa (recomendação repetida da 1ª rodada).
- **Texto e destaque no vazio da Escolas:** o texto diz "Comece criando a rede", mas o único botão laranja é "Nova escola". Isso foi visto pelo `frontend-reviewer`, fica para a foto da validação.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/prd-telas-da-coordenacao/14_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/prd-telas-da-coordenacao/techspec.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/componentes/CascaDaOperacao.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/paginas/Escolas.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/paginas/Uso.tsx`

## test-engineer · 2ª rodada · REPROVADO · 2026-10-16 17:24:10 · `tasks/prd-telas-da-coordenacao/14_task.md`

VEREDITO: REPROVADO

Cenários exigidos: os quatro estados de Escolas e de Uso (carregando, erro com "Tentar de novo", vazio que convida, com dado), e a troca de página que deixa a lista ocupada sem piscar o vazio. Os sete estados da coordenação em texto, cada um só com a ação que ele permite. Nenhum dado de pessoa (D76), pelo contrato estrito. Número comprido inteiro na linha a 360, 768 e 1366 px (14.4). Permissão: sem sessão, os dois endereços levam à entrada. Concorrência: clique duplo cria uma escola só, e o link aparece uma vez. Recomeço: outro operador na mesma aba e resposta atrasada do refazer. Isolamento entre escolas não se aplica, porque o operador vê todas as escolas por desenho e só vê número.

Cobertos:
- **A correção da 1ª rodada foi feita.** O bloco `Uso.tsx` com `ocupada={trocando}` → `ocupada={false}` está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/prd-telas-da-coordenacao/14_task.md:203-209` e aponta para "na troca de página, a anterior fica na tela".
- **O vazio da Escolas sem ação** tem bloco (`14_task.md:211-216`). O teste afirma um só "Nova rede" e um só botão cheio, então recolocar a `acao` deixa o teste vermelho.
- **A troca de nome para `TabelaDoUso`** foi levada ao bloco da troca entre tabela e cartões.
- **O teste 14.4 da Escolas** tem bloco para o `whitespace-nowrap` dos professores. O nome do caso funciona como `--grep` no projeto `chromebook`, que passa pelo aperto a 768 px.
- **O `nowrap` do `Valor` (`Uso.tsx:38`)** está declarado como defesa, com o motivo: tirada a classe, o teste fica verde.
- **Os dois testes removidos** que procuravam `@` e "matrícula" eram decoração, porque os dados do teste não têm nenhum dos dois. A garantia que vale continua no teste de contrato: a resposta que traz a pessoa é recusada e ela não aparece.
- **A pele do `ErroDaOperacao`** (borda de 2 px, `t-apoio`), a legenda e o parágrafo do Uso são classe e texto, não regra, e estão registrados na divergência e na §9.
- `npx vitest run` de Escolas, Uso e CascaDaOperacao: 29 de 29 verdes. Não há `.skip`, `.only` nem teste comentado.

Bloqueantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/operacao/paginas/Escolas.tsx:96` e `:100`: os `whitespace-nowrap` de turmas ("1.234 turmas") e de alunos ("1.234.567 alunos") são cópias da regra que tem bloco na linha 98. Não têm bloco e não estão no parágrafo de defesa, que só fala do `Valor` do Uso. O documento manda declarar também as cópias, e o e2e 14.4 confere exatamente esses dois textos.
  - **Correção:** acrescentar em "Mutações" dois blocos com o mesmo teste (`e2e/operacao-escolas.spec.ts › 14.4: o uso de uma escola com números grandes fica inteiro na linha`), tirando `className="whitespace-nowrap"` de cada um dos dois `<span>`.
  - Se um deles ficar verde sem a classe (provável no "1.234 turmas", que é curto e abre a linha), ele vai para o parágrafo de defesa com o motivo, como o `Valor`.

Recomendações:
- `Escolas.test.tsx` e `e2e/operacao-escolas.spec.ts:238` acham o botão cheio pela classe `bg-laranja`. Se a pele do primário mudar, o teste quebra sem a regra ter mudado. Seria melhor achar por um atributo ou papel estável da peça `Botao`, se ela expuser um.
- No e2e 14.4, `trocarAPrimeiraDaResposta` intercepta a resposta real, e por isso não prova o contrato com números grandes. Para o 14.4 isso basta, porque o que ele prova é o layout.
- Fica no `TODO.md` a pergunta de produto sobre o que a coluna Uso mostra com `turmas: 0` e `professores > 0`.

## test-engineer · 3ª rodada · APROVADO · 2026-10-16 17:57:36 · `tasks/prd-telas-da-coordenacao/14_task.md`

VEREDITO: APROVADO

Cenários exigidos: sigo nos mesmos cenários da 1ª e da 2ª rodada. Nesta 3ª rodada só mudou `tasks/prd-telas-da-coordenacao/14_task.md`, entre `2bb5768` e `16a946b`. Nenhum código nem teste mudou, então audito só a correção exigida: os `whitespace-nowrap` de turmas e de alunos em `apps/web/src/operacao/paginas/Escolas.tsx:96` e `:100`, que não tinham bloco.

Cobertos:
- A correção da 2ª rodada deixava dois caminhos: um bloco de mutação para cada cópia, ou o parágrafo de defesa com o motivo, se o teste ficasse verde sem a classe. O Implementador escolheu o segundo, em `14_task.md:231-235`. Ele diz que rodou o 14.4 da Escolas sem a classe, uma cópia de cada vez, e que o teste ficou verde a 1366 e a 768 px. O motivo faz sentido: "1.234 turmas" abre a linha e é curto, e "1.234.567 alunos" cabe sozinho depois do " · ". A regra do 14.4 continua provada pelo bloco de professores (`14_task.md:218-223`), que é o trecho mais largo e o do meio. Esse bloco eu não refiz, porque não posso mutar a árvore.
- O parágrafo novo sobre os `th` da `TabelaDoUso` (`Uso.tsx:59` e `:67`) está certo. É a mesma classe do `th` da peça `Tabela`, nenhum teste afirma nada sobre o cabeçalho, e a regra 14.4 trata dos números, não do cabeçalho. Não é cláusula da regra e não pede bloco.
- O registro das recomendações da 2ª rodada, com o destino de cada uma, está completo.

Bloqueantes: nenhum.

Recomendações:
- `14_task.md:233`: a defesa só fala do projeto `chromebook` (1366 e 768 px). O 14.4 também roda no `celular`, a 360 px. Ali o `UsoDaEscola` aparece no cartão da `Tabela`, num `<dd>` da largura do cartão (`apps/web/src/componentes/Tabela.tsx:71`), que é a coluna mais apertada de todas. Pelas contas de largura, "1.234.567" não cabe no fim da primeira linha e o teste deve ficar verde lá também. Mesmo assim, o parágrafo deveria dizer que o `celular` também foi rodado sem a classe, ou o portão deveria rodar a mutação nos dois projetos. Hoje a prova cobre um dos dois.
- Continuam valendo as recomendações da 2ª rodada que já têm destino: o `bg-laranja` como seletor do botão cheio, e o `trocarAPrimeiraDaResposta` no 14.4.
