# Achados das revisões — `tasks/prd-telas-da-coordenacao/5_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 01:23:37 · `tasks/prd-telas-da-coordenacao/5_task.md`

VEREDITO: APROVADO

Tela vista: sim. Li 10 fotos de `/coordenacao/estrutura`, na escola cheia e na vazia: a tabela no computador (1366 px) e no celular (360 px) e o painel "Ano letivo e disciplinas" nos dois tamanhos. A foto base da escola cheia que veio no prompt estava velha: mostrava o painel "O que falta" aberto, sem que ninguém o tivesse aberto. Refotografei a página sem clique, e a leitura abaixo vale para a foto nova, em `.processo/vitrine/coordenacao--coordenacao-estrutura--computador.png` e nas duas `--celular-N.png`. O painel "O que falta" só aparece na foto velha, que li antes de ela ser sobrescrita. O aviso "Para terminar a escola" e o vazio "Comece pelo ano letivo" não têm foto: avaliei os dois pelo código e pelos testes.

Estados: ok.
- Carregando: `Estrutura.tsx:210`, mais um carregando por seção (`:276`, `:485`).
- Erro com "Tentar de novo": `Estrutura.tsx:212`, `:279`, `:483`.
- Vazio que convida: "Comece pelo ano letivo" com "Criar o ano letivo" e o roteiro (`:235`); "Nenhuma turma ainda" (`:281`); "Nenhuma turma sem professor" (`:490`).
- Com dado: tabela por série.
- Os quatro estados têm teste em `Estrutura.test.tsx:159-232`.
- A leitura parcial dos vínculos não vira "Sem professor": a célula mostra "—" e o filtro diz que não consegue afirmar (`Estrutura.tsx:487`).

Acessibilidade:
- A linha é um link com o nome acessível "Lista de nomes da turma X". O texto à vista continua dentro do nome (WCAG 2.5.3).
- O menu da linha é irmão do link, com `z-10`.
- O foco do link é desenhado por dentro da linha (`Estrutura.tsx:86`).
- O estado "Com professor" e "Sem professor" é texto, não só cor.
- A tabela tem `caption` e cabeçalhos de linha e de coluna.
- Há teste de foco depois de criar, renomear e excluir, e e2e do foco preso no diálogo sobre o painel (`e2e/estrutura.spec.ts:482`).

Chromebook fraco:
- A `Tabela` renderiza uma estrutura por vez (tabela ou lista) e rola dentro do próprio contêiner se não couber. Usei o código da peça (`Tabela.tsx:56`) como evidência.
- Não há virtualização, mas a página é paginada pela API, com aviso de lista incompleta no teto (`AvisoDeListaIncompleta`).
- A tela não chama a lista de nomes (regra 20, item 10): nada de contagem de nomes nem "sem lista", e isso tem teste.
- Não medi throttling de CPU ou rede.

Celular:
- Sem rolagem horizontal a 360 px nas fotos.
- A tabela vira cartão com o título de cada coluna ao lado do valor.
- Os controles têm 44 px abaixo de 768 px (`botao-secundario.ts:70`), e "Nova turma" é o único botão primário.
- Nada depende de hover: o `hover:underline` do link é só enfeite, e o menu abre por toque.
- O e2e cobre a linha, o menu e o painel com toque, nos projetos `chromebook` e `celular` (`e2e/estrutura.spec.ts:425`, `:482`, `:762`).
- No celular o painel é uma folha por baixo da barra de topo. O pedaço de página que aparece abaixo da folha nas fotos de 1600 px é efeito de foto de página inteira com elemento fixo, não defeito.

Ação oficial protegida: sim. A tarefa não tem aprovação de nota. As ações de escrita são destrutivas e ficam atrás de diálogo: excluir turma e excluir disciplina mostram o nome do item e o que prende a exclusão (`Estrutura.tsx:403-454`), e "Excluir" fica como item de perigo dentro do menu.

Bloqueantes: nenhum.

Recomendações:
1. A linha que abre não tem sinal de que abre. O mockup (`mockup.md` seção 3, "›" quando a linha abre) prevê um chevron, e as fotos mostram só o nome em negrito, sem aparência de link nem seta. No toque não há hover para descobrir. Um "›" na última célula, ou o nome com a cor de link, resolve (`Estrutura.tsx:99`). Fica para a tarefa 9.0, que abre a lista da turma, ou para o `/validar`.
2. `position: relative` em `<tr>` (`Tabela.tsx:98`) falha em Safari anterior ao 16. Para a escola de rede pública no iPad antigo isso pode quebrar o clique na linha inteira. Vale conferir na validação.
3. O "—" nas colunas Turno e Situação não diz nada ao leitor de tela. Um texto escondido, como "Sem turno", é mais claro.
4. O Aviso "Para terminar a escola" e o vazio "Comece pelo ano letivo" só se veem por teste. Quando a vitrine ganhar uma escola sem ano letivo, vale fotografar os dois.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-17 01:25:49 · `tasks/prd-telas-da-coordenacao/5_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Caminho feliz:** tabela por série na ordem da escola; colunas Turma, Turno, Professores (até dois nomes e "+N") e Situação; a linha inteira abre a lista da turma; Renomear e Excluir pelo menu da linha; "Nova turma" como único botão primário; os dois painéis no endereço, `?painel=ano` e `?painel=falta`.
- **Bordas do domínio:**
  - professor com duas disciplinas na mesma turma;
  - turma sem professor alocado;
  - turma só com vínculo contestado ou só com encerrado (o professor que saiu);
  - vínculo pendente conta como professor;
  - dois professores com o mesmo nome;
  - vínculos que vieram só em parte (teto de páginas);
  - virada de ano, com ano planejado e nenhum em curso;
  - escola sem ano letivo;
  - turma que outra pessoa excluiu com o diálogo aberto;
  - nome repetido (`CONFLITO`);
  - "falta" só depois que a leitura termina.
- **Permissão e privacidade:** a aba nunca chama a lista de nomes (regra 20, item 10).
- **Isolamento:** a segunda pessoa na mesma aba não vê nada da escola anterior, nem com `?painel=ano` no endereço. A própria tarefa declara isso na linha "recomeço" da tabela de testes.
- **Regra 80:** não há operação nova que rode duas vezes. O envio único dos diálogos (`useEnvioUnico`) já existia.

**Cobertos:**
- Agrupar e marcar, com contestado, encerrado, pendente, duas disciplinas, mesmo nome, "Nome não carregado", vínculos parciais e marca igual à do sino (`turmas-da-escola.test.ts`).
- Os quatro estados, as seções que falham uma a uma, o vazio do filtro, o filtro esperando e falhando, e o filtro com vínculos parciais.
- O painel pelo endereço, e ele só aparece depois da leitura dos anos.
- Abrir o painel conta um passo no histórico, e fechar ou filtrar troca o endereço sem passo novo.
- O foco depois de criar, renomear e excluir, e nenhuma chamada a `/lista` (`Estrutura.test.tsx`).
- No e2e:
  - a linha que abre, clicada na célula da situação;
  - o menu que não é capturado pelo link;
  - a página que não rola;
  - a lista a 360 px;
  - o diálogo sobre o painel, com o foco preso, o Esc fechando só ele e a falha 503 com o diálogo aberto;
  - Voltar e Avançar;
  - os casos de hoje de renomear e excluir, refeitos pelo menu.
- Não há `.skip`, `.only` nem teste comentado. A rede é falsa e não há provedor de IA. Rodei os dois arquivos de unidade e os 50 testes passaram.

**Bloqueantes:**

1. **O isolamento da segunda pessoa ficou vazio, e o cenário declarado "nem com `?painel=ano`" não existe.**
   - Em `e2e/estrutura.spec.ts:879`, `:882` e `:885`, o teste confere que `estruturaDeA.disciplina.nome` não aparece no `body`. Depois desta tarefa, a disciplina só é desenhada dentro do painel do ano, e esse teste nunca abre o painel. A conferência passaria mesmo se a de B visse as disciplinas e séries de A no painel, vindas do cache. Antes ela provava isso; agora não prova nada.
   - Nenhum teste entra como B com `?painel=ano` no endereço. O único teste com o painel pelo endereço (`:496`) usa a mesma coordenadora.
   - **Correção exigida:** no caso "segunda pessoa", a de B vai à Estrutura com `?painel=ano` e a leitura dos anos segurada. O teste confere que o painel não existe enquanto a leitura está no ar. Depois, com o painel aberto, confere que nem a disciplina nem as séries de A aparecem em nenhum momento.

2. **Cláusulas novas sem bloco de mutação.** Os testes que pegariam cada uma já existem; falta o bloco, para o portão da tarefa provar o vermelho.
   - `Estrutura.tsx:481`, `if (filtrando && vinculos.data === undefined)`. É a cláusula mais grave da lista: sem ela, com os vínculos ainda no ar, o filtro cai em "Nenhuma turma sem professor" e afirma algo falso. Teste: `› os vínculos ainda não lidos`.
   - `Estrutura.tsx:482`, `vinculos.isError ? <EstadoErro> : <EstadoCarregando>`. Teste: `› os vínculos que falharam`.
   - `Estrutura.tsx:518`, `!filtrando && vinculos.data === undefined && vinculos.isError && <Aviso>` ("Os professores das turmas não carregaram"). Teste: `› os vínculos que falharam`.
   - `Estrutura.tsx:206`, `nova === 'todas' ? undefined : nova`. Teste: `› "Sem professor" deixa as turmas sem professor`, linha 353.
   - `Estrutura.tsx:296` e `:312`, `painel === 'ano' &&` e `painel === 'falta' &&`. Testes: `› pelo endereço, abre já com o painel; parâmetro desconhecido não abre nada` e `› enquanto falta passo`.
   - `turmas-da-escola.ts:57`, `ordenarPeloNome(...)` dos professores da turma. Teste: `› conta o vínculo pendente e o confirmado`, que espera `['Camila', 'Rafael']`, quando a chegada é Rafael e depois Camila.
   - `turmas-da-escola.ts:89`, `if (nomes.length === 0) return '—'`. Teste: `› textoDosProfessores`.
   - **Correção exigida:** um bloco `mutacao` para cada cláusula acima, citando o teste indicado.

**Recomendações:**
- `Estrutura.test.tsx:316-321` ("com a escola montada, o aviso não existe") confere a ausência logo que o link da 7ºA aparece. Professores e vínculos podem ainda estar no ar, e o "falta" não se afirma sem leitura, então a ausência pode vir disso. Antes de conferir, espere "Com professor" e o nome "Camila Sintética" na linha.
- `e2e/estrutura.spec.ts:364-366`: o comentário promete o foco no título quando a página abre já com o painel, mas não há `toBeFocused`. Acrescente a conferência no título "Turmas de 2026".
- Os links "Ver o que falta" do sino e `PARA_O_ANO` do Painel (`sino-da-coordenacao.spec.ts:115`, `painel-da-coordenacao.spec.ts:144`) só têm o `href` conferido. Um e2e que siga o link e veja o painel abrir fecharia o caminho de ponta a ponta.
- As conferências de classe CSS no jsdom (`relative`, `after:inset-0`, `z-10`) são aproximações. A prova real é o clique do e2e (`:292-295`). Vale dizer isso no comentário do teste de componente, para ninguém trocar o e2e por elas.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/prd-telas-da-coordenacao/5_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Estrutura.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/turmas-da-escola.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Estrutura.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/turmas-da-escola.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/estrutura.spec.ts`

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-17 01:27:16 · `tasks/prd-telas-da-coordenacao/5_task.md`

**VEREDITO: REPROVADO**

**Escopo:** respeitado. A alocação fica na página até a 7.0, e a lista da turma e a grade não foram tocadas. As mudanças em `Tabela.tsx` e nos specs fora de "Arquivos previstos" estão declaradas.

**Aderência à Tech Spec:** há uma divergência em RF11 e na subtarefa 5.4: "Nova turma" não é o único botão primário da tela, e isso não foi declarado (bloqueante 2). As outras cinco divergências estão na `techspec.md` §9, no parágrafo "Como ficou na 5.0". Esta spec não tem `cenarios.md`.

**Portão local:** carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo).

**Bloqueantes:**

1. **O "…" das linhas de baixo aparece por cima do menu aberto da linha de cima.**
   - Onde: `apps/web/src/areas/coordenacao/Estrutura.tsx:127`, no `<span className="relative z-10 inline-flex">`.
   - Por quê: `relative` junto com `z-10` cria um contexto de empilhamento em cada linha. O `Menu` desenha a lista (`fixed z-30`) e o fundo (`fixed inset-0 z-20`) dentro desse contexto (`Menu.tsx:169` e `:178`). Por isso o z-30 vale só dentro da célula da linha dele. O wrapper da linha seguinte também é `z-10` e vem depois no DOM, então é pintado por cima do menu aberto da linha anterior. O menu abre para baixo, alinhado à direita, bem em cima da coluna Ações da próxima linha: o "…" dela fica visível sobre o item "Excluir".
   - O clique hoje cai certo porque o resto da tela fica `inert` (`useRestoInerte`). O fundo do menu existe justamente para o navegador que não conhece `inert`, e é ele que fica por baixo.
   - Correção exigida:
     - Tirar o `z-10`. O `relative` sozinho já basta, porque a célula do menu vem depois do link no DOM e um posicionado sem z-index é pintado na ordem do documento, acima do `::after` do link.
     - Ajustar junto o texto da `techspec.md` §9 ("com o `Menu` da última célula acima dele (`z-10`)"), o comentário de `Tabela.tsx` ("ganha `relative z-10`"), a asserção `menu.closest('.z-10')` em `Estrutura.test.tsx:271` e a mutação correspondente em `5_task.md`.

2. **A subtarefa 5.4 está marcada como feita, mas a tela tem dois primários, e o teste que diz o contrário passa por tempo.**
   - Na foto `coordenacao--coordenacao-estrutura--celular-1.png` aparecem dois botões laranja cheios: "NOVA TURMA" e "ALOCAR". O segundo vem de `Alocacao.tsx:247` (`<Botao type="submit">`, primário por padrão).
   - O teste `Estrutura.test.tsx:289-294` ("Nova turma é o único botão cheio da tela") só passa porque consulta os botões logo depois que a região "Turmas de 2026" aparece. Nesse momento a alocação ainda está em "Carregando a alocação…".
   - A tarefa manteve a alocação até a 7.0, então dois primários até lá é consequência da sequência, mas isso não está registrado em lugar nenhum.
   - Correção exigida:
     - Declarar a divergência na tabela de divergências de `5_task.md` e na `techspec.md` §9: "Alocar continua primário até a 7.0".
     - Fazer o teste esperar a alocação carregar e afirmar o que a tela tem de fato: excluir a região "Alocação" da conta, ou esperar `['Nova turma', 'Alocar']` até a 7.0.
     - A outra saída é rebaixar o "Alocar" para secundário, mas isso mexe num arquivo que a 7.0 vai refazer.

**Recomendações:**
- **Regra duplicada:** `turmas-da-escola.ts:38-40` (`daProfessor`) repete à mão `'pendente' | 'confirmado'`, que já existe em `ESTADOS_QUE_DAO_PROFESSOR` (`fila-da-coordenacao.ts:51`). Se as duas cópias divergirem, a linha pode mostrar o nome do professor e "Sem professor" ao mesmo tempo. O caminho é exportar a constante e usá-la nas duas.
- **Texto repetido:** `ProfessoresDaTurma.tsx:75` repete o texto `'Nome não carregado'`; pode usar `NOME_NAO_CARREGADO`.
- **Dois jeitos de fazer o botão secundário na mesma tela:** "Ver o que falta" e "Ano letivo e disciplinas" (`Estrutura.tsx:252` e `:267`) são `<button>` crus com `CLASSES_DO_BOTAO_SECUNDARIO`, enquanto o "Tentar de novo" (`:522`) usa `<Botao variante="secundario">`.
- **Peça no arquivo errado:** a `Secao` agora serve à página de Turmas, mas mora em `AnoEDisciplinas.tsx`. Ficaria melhor em `pecas-da-lista.ts`.
- **Texto desatualizado:** "Abra o ano letivo acima" (`Estrutura.tsx:275` e `Alocacao.tsx:71`) aponta para um lugar que não existe mais: o ano agora abre no painel. A 5.7 pediu "o texto de hoje", então isso fica como sugestão de texto.
- **Caso declarado e não coberto (é do `test-engineer`):** a tabela da tarefa e a `techspec.md` §6 pedem a segunda pessoa com `?painel=ano` no endereço sem ver nada da escola anterior. O teste de recomeço (`e2e/estrutura.spec.ts:851`) não ganhou esse caso; o painel pelo endereço só é provado com uma pessoa (`:496`).
- **Histórico do navegador:** abrir o painel e fechar deixa duas entradas `/estrutura` seguidas (o próprio teste afirma isso em `Estrutura.test.tsx:456`), então um Voltar logo depois não faz nada visível. Vale considerar ao fixar o padrão para `?professor=` e `?material=`.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Estrutura.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Estrutura.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/componentes/Tabela.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/componentes/Menu.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Alocacao.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/turmas-da-escola.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/prd-telas-da-coordenacao/techspec.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/prd-telas-da-coordenacao/5_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/.processo/vitrine/coordenacao--coordenacao-estrutura--celular-1.png`

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-17 02:00:41 · `tasks/prd-telas-da-coordenacao/5_task.md`

VEREDITO: APROVADO

Tela vista: sim (14 fotos lidas: `/coordenacao/estrutura` em 1366 px e 360 px, na escola cheia, com o painel "Ano letivo e disciplinas" aberto e com o menu "Mais ações da turma"; e na escola vazia, com e sem o painel). Não há foto do painel "O que falta", do Aviso "Para terminar a escola" nem do vazio "Comece pelo ano letivo", como o prompt já avisa. Conferi esses três pelo código (`Estrutura.tsx:240-266`) e pelos testes.

Estados: ok.
- Carregando: `Estrutura.tsx:217`, `:283` e `:492`.
- Erro: com "Tentar de novo", em `:219`, `:285` e `:489`.
- Vazio: convida a agir, em `:242-249`, `:288` e `:497`.
- Com dado: confirmado nas fotos.

Acessibilidade: ok.
- A alteração desta rodada fecha uma falha de foco. Com a página aberta direto em `?painel=ano`, não há botão que tenha aberto o painel, e o foco caía no `body` ao fechar.
- Agora o efeito de `Estrutura.tsx:211-215` leva o foco ao título "Turmas de 2026" só quando o foco está no `body`.
- O hook fica antes dos retornos antecipados (`:217`), então a ordem dos hooks está correta.
- O caminho em que o painel é aberto por botão não regride. O e2e `estrutura.spec.ts:838` ainda exige o foco de volta em "Ano letivo e disciplinas".
- A prova nova está em `Estrutura.test.tsx:482` e `estrutura.spec.ts:542`.
- O foco visível, o rótulo "Lista de nomes da turma …" e o menu com `aria-haspopup` continuam como antes.

Chromebook fraco: ok.
- A `Tabela` desenha só uma estrutura por vez (`useMidia`).
- A lista de turmas vem da API e o teto de leitura é avisado por `AvisoDeListaIncompleta`.
- A tela não lê `/lista`, então não gera leitura auditada nem carga extra.
- A remoção do `z-10` não custa CPU.

Celular: ok.
- A 360 px a tabela vira lista de cartões, sem rolagem horizontal nas fotos.
- O painel vira folha de baixo.
- "Nova turma" e "Alocar" têm 44 px; o menu da linha tem 44 px no celular (`min-h-11`) e 36 px no computador (`md:min-h-9`).
- O e2e `estrutura.spec.ts:789-796` mede os alvos, e o teste de 360 px usa `tap`.
- Nada depende de hover. O menu abre por toque e teclado.
- A barra inferior que aparece no meio das fotos longas do celular é artefato da foto: ela é fixa na janela.

Ação oficial protegida: sim.
- Excluir turma e disciplina passa por `ConfirmacaoDePerigo`, com o nome do item à vista.
- Renomear é diálogo de formulário.
- Nenhuma ação desta tela é nota, publicação ou exportação.

Sobre a mudança de `z-10` para `relative` sem `z-index` (`Estrutura.tsx:127`):
- O menu continua sendo pintado acima do `::after` do link, porque vem depois dele no documento.
- A lista e o fundo do `Menu` (`fixed z-30` e `z-20`) não ficam mais presos dentro da linha.
- A foto do computador mostra o menu aberto, nítido e sobre a tabela.
- A prova real é o e2e `estrutura.spec.ts:474-480`. O clique sem `force` no botão do menu só passa se o botão receber o clique, e a URL continua `/estrutura`.
- O teste de componente é aproximação do jsdom, e o próprio teste diz isso.

Bloqueantes: nenhum.

Recomendações:
1. A foto do menu no celular (`...button-name-Mais-ações-da-turma--celular-1.png`) sai idêntica à da tela sem menu. O `Menu` fecha na rolagem (`flutuante.ts`), e a vitrine rola para fotografar a página inteira. É limite da vitrine. Quando houver tarefa de `tools/vitrine/`, fotografar o menu sem rolar.
2. Já registradas em `TODO.md` e sem mudança: o texto "Abra o ano letivo acima" (`Estrutura.tsx:282`) aponta para um lugar que não existe mais, e os dois `<button>` crus com `CLASSES_DO_BOTAO_SECUNDARIO` (`:259` e `:274`).
3. Depois de `Excluir`, o foco vai ao título das turmas (`Estrutura.test.tsx:596`). Isso é correto, e o `/validar` pode conferir de ponta a ponta.

Arquivos principais, todos em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2`:
- `apps/web/src/areas/coordenacao/Estrutura.tsx`
- `apps/web/src/componentes/Tabela.tsx`
- `apps/web/src/areas/coordenacao/Estrutura.test.tsx`
- `e2e/estrutura.spec.ts`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-17 02:01:12 · `tasks/prd-telas-da-coordenacao/5_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)

Bloqueantes: nenhum.

As duas correções da 1ª rodada foram feitas:

1. **O "…" por cima do menu aberto.** Corrigido.
   - O contêiner do menu em `apps/web/src/areas/coordenacao/Estrutura.tsx:127` agora é só `relative inline-flex`.
   - O texto da `techspec.md` §9, o comentário de `apps/web/src/componentes/Tabela.tsx`, a asserção de `Estrutura.test.tsx:270-272` (contêiner `span.relative` sem nenhuma classe `z-`) e a mutação em `5_task.md` acompanham a mudança.
   - Na foto `coordenacao--coordenacao-estrutura--button-name-Mais-ações-da-turma--computador.png`, a lista do menu aparece por cima da tabela, sem nada da linha seguinte sobre ela.
2. **Dois botões cheios.** Corrigido.
   - A divergência "Alocar continua cheio até a 7.0" está na tabela de `5_task.md` e na `techspec.md` §9.
   - O teste de `Estrutura.test.tsx:293-304` espera o botão "Alocar" aparecer. Depois conta os botões cheios por região: "Nova turma" em "Turmas de 2026" e "Alocar" em "Alocação". Agora a conta vem da tela já carregada, e não de a alocação ainda estar carregando.

O que mais entrou nesta rodada também está certo:
- **Foco ao fechar o painel aberto pelo endereço.**
  - O efeito em `Estrutura.tsx:211-215` fica antes do retorno antecipado, então a ordem dos hooks se mantém.
  - Quando o painel foi aberto por um botão, quem fecha já devolve o foco a esse botão antes do efeito rodar. O efeito só age quando o foco caiu na página vazia (o `body`).
  - Ele está descrito na `techspec.md` §9 e tem mutação no `5_task.md`.
- **O e2e da segunda pessoa** (`e2e/estrutura.spec.ts:871-917`) entra como B com `?painel=ano` no endereço.
  - Os anos ficam segurados. As séries e as disciplinas também, mesmo depois que os anos soltam.
  - As rotas `**/v1/series?*` e `**/v1/disciplinas?*` pegam de fato o pedido, porque `lerPaginas` sempre manda `?limite=` (`api/estrutura.ts:62`).
- **As oito mutações novas** batem com as linhas atuais de `Estrutura.tsx` e de `turmas-da-escola.ts`.

Recomendações:
- As fotos do menu aberto no celular (`...--celular-1.png` e `...--celular-2.png`) não mostram o menu. A barra de baixo da tela cobre a primeira linha. No computador, o menu abriu para cima. Nenhuma das fotos prova o caso da 1ª rodada, com o menu abrindo para baixo sobre a linha seguinte. Vale fotografar o menu da última linha, ou da penúltima, quando a vitrine permitir. Junta isso ao item (4) que já está no `TODO.md`.
- A ponta solta de `Estrutura.tsx:282` ("Abra o ano letivo acima") já foi mandada para a 7.0. Ela continua apontando para um lugar que não existe mais.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Estrutura.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Estrutura.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/componentes/Tabela.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/estrutura.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/prd-telas-da-coordenacao/5_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/prd-telas-da-coordenacao/techspec.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-17 02:02:18 · `tasks/prd-telas-da-coordenacao/5_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Caminho feliz: a tabela por série, a linha que abre a turma, o menu da linha, o filtro "Situação" e os painéis `?painel=ano` e `?painel=falta`.
- Bordas: turma sem professor alocado; professor que dá duas disciplinas na mesma turma; dois professores com o mesmo nome; vínculos ainda no ar, com falha ou vindos só em parte; o "falta" com a leitura ainda não terminada; o painel aberto pelo endereço antes de os anos chegarem; o painel aberto pelo endereço sem botão que o tenha aberto, e o foco ao fechar.
- Permissão e isolamento: a coordenação de B entra na aba da de A e não vê turma, nome, série nem disciplina de A, nem pelo painel aberto pelo endereço, nem pelo endereço da turma de A.

**Cobertos:** todos os acima. As duas correções da 1ª rodada foram feitas.

1. **O isolamento da segunda pessoa** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/estrutura.spec.ts:871-917`) agora faz o que a correção pediu:
   - A de B vai a `/coordenacao/estrutura?painel=ano` com a leitura dos anos segurada, e o teste confere `painelDoAno` com contagem 0 enquanto ela está no ar.
   - Os anos soltam e o painel abre com as séries e as disciplinas ainda seguradas. É esse o momento em que o cache de A apareceria, e o teste confere `nadaDeA()` ali.
   - Depois que a leitura volta, o teste confere as listas vazias e `nadaDeA()` de novo.
   - As rotas seguradas casam com o pedido de verdade: `lerPaginas` monta `/v1/series?limite=…` e `/v1/disciplinas?limite=…`.
   - A tela de A lê séries e disciplinas mesmo com o painel fechado (`Estrutura.test.tsx:439`), então o cache existe antes de a de B entrar.
   - "7º ano do Ensino Fundamental" é mesmo o nome da série de A: `montarEstruturaNoBanco` cria a série `ef_anos_finais` 7, e `nomeDaSerie` dá esse texto.

2. **As mutações:** os sete blocos exigidos estão em `5_task.md`. Conferi cada um contra o código atual:
   - Os trechos de "antes" existem (`Estrutura.tsx:206`, `:303`, `:319`, `:488`, `:489`, `:525`; `turmas-da-escola.ts:57` e `:89`).
   - O nome de caso de cada bloco casa com um teste só. O `-t` do vitest aceita o nome do `describe` (`textoDosProfessores`) e o trecho do nome (`deixa as turmas sem professor, grava no endereço`).
   - Cada bloco quebra o teste pelo motivo certo, olhando o que o teste afirma. Por exemplo, `vinculos.data !== undefined` tira o "Carregando os professores das turmas…"; `nova` sem o `undefined` deixa `situacao=todas` no endereço, onde o teste espera `/estrutura`; e o `ordenarPeloNome` trocado pela identidade devolve a ordem de chegada no lugar de `['Camila', 'Rafael']`.
   - O código novo desta rodada também tem bloco: o efeito do foco (`!== document.body`) e o `relative inline-flex` com o "antes" atualizado.
   - O teste novo do foco (`Estrutura.test.tsx:482`) confere antes que o foco não está no título. Por isso não passa sem a regra.

**Outros pontos:**
- Rodei `npx vitest run` nos dois arquivos de teste de componente: 51 passaram. Não rodei o e2e.
- O e2e da Renomeação abre o menu da turma do meio de três (`estrutura.spec.ts:605`, `:618`) e clica no item com `click()`/`tap()` sem `force`. Assim, a lista do menu presa embaixo da linha seguinte, que motivou tirar o `z-10`, quebraria o teste.
- Não há `.skip`, teste comentado, mock que esconda a regra, provedor de IA ou operação concorrente nesta tarefa.

**Bloqueantes:** nenhum.

**Recomendações:**
- O efeito do foco (`Estrutura.tsx:213`) tem mais duas cláusulas sem bloco: `painelAnterior.current !== undefined` e `painel === undefined`. Hoje as duas mutações dariam quase o mesmo comportamento:
  - Na montagem o título ainda não existe, porque a tela está carregando.
  - Ao abrir o painel, o diálogo pega o foco antes do efeito da página.

  Não reprovo. Se um dia a Estrutura montar com os anos já no cache e o foco no `body`, a primeira cláusula passa a importar e pede teste.
- `nadaDeA()` confere a página em instantes. Com as leituras seguradas, a janela em que o cache apareceria fica parada e o instante é o certo. Mesmo assim, um comentário dizendo que a prova depende de a rota estar segurada evitaria que alguém tire o `portao` achando que sobra.
- As listas vazias do painel de B são conferidas por `locator('li')` com contagem 0. Se o vazio da seção um dia virar lista sem `li`, a conferência passa sem provar nada. Conferir o texto do vazio da seção seria mais firme.
