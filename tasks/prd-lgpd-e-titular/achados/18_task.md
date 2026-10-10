# Achados das revisões — `tasks/prd-lgpd-e-titular/18_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-10 18:24:36 · `tasks/prd-lgpd-e-titular/18_task.md`

VEREDITO: REPROVADO

**Cenários exigidos** (da tarefa e do `cenarios.md`, 18.0):
- **Caminho feliz:** a coordenação registra o acesso do aluno e o da professora, o worker monta, os dois baixam `meus-dados-AAAA-MM-DD.json`, cada um recebe só o seu arquivo, e o download entra na auditoria.
- **Navegação:** o aluno chega pelo rodapé e pela gaveta a 360 px, sem rolar e com alvo de 44 px. O professor chega pelo menu da pessoa, antes do "Sair". O trilho funciona. A coordenação não tem nenhum dos dois.
- **Estados:** vazio que convida, carregando, erro com "Tentar de novo", e a lista em ordem.
- **Em preparação:** relê a cada 10 s, para com a aba escondida, relê ao voltar e anuncia quando fica pronto.
- **Arquivo apagado depois de 7 dias:** `apagado_em` semeado no banco.
- **Só a escola ativa:** professora com vínculo em duas escolas.
- **Recomeço:** troca de escola e segunda pessoa no mesmo computador.
- **Concorrência:** clique duplo em "Baixar o arquivo".
- **Projetos e acessibilidade:** `chromebook` e `celular`, com acessibilidade conferida.

**Cobertos:**
- **Regras de tela** (`regras.test.ts`): os estados do arquivo, a ordem com o desempate, o resumo na ordem do catálogo e o relógio de 10 s com tempo falso, incluindo aba escondida, volta e parada.
- **Leitura e download** (`meus-dados.test.ts`): o `gcTime: 0`, que a falta dele faria falhar porque o cliente do teste usa o padrão; o GET sem id no caminho; o POST com o id escapado e corpo vazio; a releitura depois de o arquivo sair.
- **Lugar de cada item** (`navegacao.test.ts`): os dois mapas, a coordenação vazia, nenhum caminho do pé repetindo uma seção, e o item selecionado.
- **Caminho feliz no e2e:** worker e armazém de verdade. A auditoria é conferida no banco, com autor e `finalidade: 'acesso_do_proprio_titular'`. O conteúdo de cada arquivo é cruzado com o nome do outro. O clique duplo é concorrente de verdade: `doisCliquesNoMesmoInstante` dispara dois `click()` no mesmo `evaluate`, e o teste exige uma chamada e uma linha de auditoria.
- **Arquivo apagado enquanto a pessoa lia:** a falha `NAO_ENCONTRADO`, o botão desligado, "Fechar", o foco que não cai no corpo da página, e o estado que continua depois de recarregar.
- **Demais estados no e2e:** vazio, carregando e erro (com a volta ao erro e ao dado); em preparação com `page.clock` e um marcador que prova que não houve recarga; o anúncio só de quem estava em preparação; a releitura que falha sem trocar a lista pelo erro; a ordem semeada ao contrário do id.
- **Escola ativa e recomeço:** as duas escolas e a segunda pessoa, ambas com a leitura segurada.
- **Listas da lateral:** `areas.spec.ts` W2 cobre as listas por papel, e `casca.spec.ts` cobre o alvo e a ordem do foco do "Meus dados".
- Rodei os três arquivos de unidade: 35 de 35 verdes. Não rodei o e2e, e não fiz mutação: os arquivos novos não estão no git, e os alterados têm o trabalho do Implementador, então um `git checkout` não desfaria a mutação sem apagar esse trabalho. A análise de mutação foi lida, não executada.

**Bloqueantes:**
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/meus-dados.spec.ts:300` tem `test.skip(naGaveta(page), 'o trilho é do computador: …')`.
   - É o único `test.skip` em `e2e/`, e a regra 40 proíbe `.skip`.
   - No projeto `celular` o teste do trilho não roda, e ele é o único que prova as mutações do trilho: `rodape` e `menuDaPessoa` no `Trilho`, e o ramo `trilho` do `MenuDaPessoa`.
   - O repositório já resolve isso de outro jeito: `e2e/casca.spec.ts:413` (W12) faz `await page.setViewportSize({ width: 1366, height: 768 })` no começo, e o teste do trilho roda nos dois projetos.
   - **Correção exigida:** trocar o `test.skip` pelo `setViewportSize` de 1366 × 768, antes de `entrarComoAluno`. O mesmo vale para a segunda metade do teste, a da professora, na mesma aba.

**Recomendações:**
- `e2e/meus-dados.spec.ts:583-587`: o teste "a releitura que falha não troca a lista pelo erro" só prova a regra com asserções negativas (`getByRole('alert')` e "Tentar de novo" com `toHaveCount(0)`). Elas podem passar antes de a segunda resposta 503 chegar à tela: o `esperarOQueJaSaiu` garante que a requisição saiu, não que a resposta foi desenhada. Vale um ponto de sincronia positivo antes delas. O mesmo padrão aparece em `:546` e `:553`, no anúncio.
- `e2e/meus-dados.spec.ts:672`, segunda pessoa: o pedido do primeiro aluno está em preparação, sem arquivo. O título promete "nunca o arquivo do anterior". Semear o arquivo com `criarArquivoDoTitularNoBanco` e conferir que "Baixar meus dados" e "Disponível até" não aparecem para o segundo deixaria o teste igual ao título.
- `e2e/meus-dados.spec.ts:230`: `daProfessora.chamadas` não é conferido. Um `toBe(1)`, como no aluno, fecha o clique duplo também no caminho do professor.
- O `docs/interface.md` diz "na gaveta a 360 px o pé aparece com a gaveta aberta, sem rolar" para os dois papéis, mas só o aluno tem `toBeInViewport()`. Vale acrescentar a mesma conferência ao link do professor, em `:272-295`, ou restringir a frase ao aluno.
- `e2e/meus-dados.spec.ts:529`: zero linhas de auditoria nesse teste é verdade por construção, porque a rota é atendida pelo próprio teste e o pedido nunca chega à API. Não atrapalha, mas não prova nada.
- `e2e/areas.spec.ts`, W2 da coordenação: a ausência do "Rodapé" e do "Sua conta" na coordenação está provada só na unidade. Uma linha no e2e da coordenação deixa a lista de cada papel completa na tela.
- O teste "em preparação" depende de no máximo 5 s de tempo real entre a chegada do dado e o primeiro `fastForward` (`:447-451`). É margem razoável, e fica registrado para o caso de oscilar na esteira.

## privacy-guardian · 1ª rodada · REPROVADO · 2026-10-10 18:27:40 · `tasks/prd-lgpd-e-titular/18_task.md`

VEREDITO: REPROVADO

**Campos pessoais tocados:** nenhum campo novo. A tela só lê o que a 13.0 já entrega:
- os pedidos da própria pessoa (`id`, `tipo`, `estado`, `chegouEm`, `arquivo.situacao` e `arquivo.expiraEm`);
- quantos registros a escola guarda dela, por categoria;
- o nome do arquivo, `meus-dados-AAAA-MM-DD.json`.

O id da pessoa vem da sessão e não vai no endereço.

**Fora da tabela de dados do docs/lgpd.md:** nada. Não há migration nem campo novo. As duas funções de teste novas em `e2e/__fixtures__/sessao.ts` gravam em `arquivo_titular`, uma tabela que já existe.

**Autorização por objeto:** ok.
- `GET /v1/meus-dados` lê só o `usuarioId` da sessão.
- `POST /v1/meus-dados/:id/baixar` usa `arquivoCompletoDoUsuario(usuarioId, pedidoId)`. Pedido de colega, de outra escola, inexistente ou vencido respondem todos `NAO_ENCONTRADO` (`apps/api/src/privacidade/privacidade.service.ts:394-411`).
- A coordenação não tem nenhum dos dois itens: isso está provado na unidade e no e2e W2.

**Logs:** limpos. Os arquivos novos do web não têm `console` nem `logger`.

**Auditoria:** presente. O download grava `titular.arquivo_baixado` com a finalidade `acesso_do_proprio_titular`, e o e2e confere isso no banco, com autor e uma linha só no clique duplo. A leitura da própria pessoa sobre si não é auditada, e não precisa: não é coordenação nem rede.

**Envio externo:** nenhum. A URL assinada vale 5 minutos e vai direto para `baixarPorUrl`, sem passar por estado, tela ou histórico. A API responde com `Cache-Control: no-store`, e a consulta tem `gcTime: 0`. A troca de pessoa ou de escola esvazia o cache.

**Seed/fixture:** sintético. Os nomes vêm dos geradores ("Aluno Sintético Caio 4cf0fe01", "Colégio sintético da vitrine…"), e os testes de unidade usam só UUIDs e datas.

**Fotos:** em nenhuma das oito aparece dado de colega. A professora não vê uso da IA no resumo. O aviso do computador compartilhado está no diálogo de baixar.

**Bloqueantes:**

1. **O resumo diz à pessoa uma coisa falsa sobre os dados dela.** Está em `apps/web/src/componentes/meus-dados/regras.ts:122` e aparece na tela por `apps/web/src/componentes/meus-dados/MeusDados.tsx:239`.
   - **O que está errado:** o resumo "O que a escola guarda de você" usa como texto a `descricao` do catálogo de retenção, que foi escrita para a coordenação ajustar prazos. A contagem da 13.0 põe o vínculo ativo em `vinculo_encerrado` e o cadastro ativo em `pessoa_desativada` (`apps/api/src/privacidade/titulares.repository.ts:186-187`).
   - **Onde se vê:** nas oito fotos (por exemplo `aluno--aluno-atividades--Privacidade--computador.png` e `vazia--professora--professor-nova-conversa--Meus-dados--celular.png`), um aluno e uma professora ativos leem "Cadastro de quem foi desativado na escola — 1 registro" e "Vínculos de alunos e professores com as turmas, depois de encerrados — 1 registro".
   - **Por que bloqueia:** esta tela existe para cumprir o direito de acesso. Informação imprecisa a uma pessoa de 11 anos fere a transparência (LGPD art. 6º, VI, e art. 9º) e a linguagem adequada à criança e ao adolescente (art. 14, § 6º).
   - **Correção exigida:**
     - Criar em `regras.ts` um texto para o titular, `Record<CategoriaDeRetencao, string>`, completo e conferido pelo compilador, em segunda pessoa e sem a condição de retenção. Por exemplo: "Seu cadastro na escola", "Seus vínculos com as turmas", "Suas respostas e o diagnóstico das suas atividades", "Suas conversas com o Tutor".
     - `linhasDoResumo` passa a usar esse texto.
     - Acrescentar um teste em `regras.test.ts` que falha se `vinculo_encerrado` ou `pessoa_desativada` voltarem a dizer "encerrados" ou "desativado".
     - O catálogo da coordenação não muda.

**Recomendações:**
- O resumo conta só as categorias com prazo configurável. Ficam de fora a credencial, a sessão e o registro de acesso com IP, que estão no catálogo fixo de `retencao.ts:91-100`. Uma frase ou uma linha dizendo que o arquivo traz também esses registros deixa "O que a escola guarda de você" completo. A outra saída é contá-los na API, na 13.0.
- O texto `EFEITO_DE_BAIXAR` diz "as suas conversas com a IA" para os dois papéis. Vale confirmar que a versão completa do aluno traz a conversa com o Tutor dentro da retenção, para o texto não prometer o que já foi apagado.
- O `test.skip` em `e2e/meus-dados.spec.ts:300` já é bloqueante do `test-engineer` (regra 40). Do lado desta regra, ele deixa sem prova no `celular` que o trilho mostra o "Meus dados" só a quem é dele.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/componentes/meus-dados/regras.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/componentes/meus-dados/MeusDados.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/titulares.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/shared/src/privacidade/retencao.ts

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-10 18:27:47 · `tasks/prd-lgpd-e-titular/18_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As duas divergências declaradas estão na `techspec.md` §9 e no `docs/interface.md`. O texto do resumo, que é o bloqueante 1, é bug e não divergência.
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)

Bloqueantes:

1. **O resumo por categoria diz coisa falsa à própria pessoa.** O erro está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/componentes/meus-dados/regras.ts:118-123` (`linhasDoResumo`).
   - **O que está errado:** a tela usa `CATEGORIAS_DE_RETENCAO[categoria].descricao` como rótulo. Essas descrições explicam a regra de guarda, não o dado que existe da pessoa. A tabela `usuario` cai na categoria `pessoa_desativada` (`packages/shared/src/privacidade/classificacao.ts:62`), e o vínculo ativo cai em `vinculo_encerrado`.
   - **O que as fotos mostram:** em `vazia--professora--professor-nova-conversa--Meus-dados--computador.png` e em `vazia--aluno--aluno-atividades--Privacidade--celular.png`, uma pessoa ativa lê "Cadastro de quem foi desativado na escola — 1 registro" e "Vínculos de alunos e professores com as turmas, depois de encerrados — 1 registro". Isso é falso para ela. A frase também está na terceira pessoa ("das atividades do aluno") numa tela que fala com o aluno.
   - **O projeto já resolveu isso:** a 16.0 criou `ROTULO_DA_CATEGORIA_NA_PREVIA` (`apps/web/src/areas/coordenacao/privacidade/textos-dos-pedidos.ts:118-132`), com o comentário "não é o prazo de guarda […], é o que existe da pessoa". Esta tarefa fez um segundo jeito, e o jeito errado.
   - **O comentário em `regras.ts:115-116` é falso:** ele diz que a frase é "uma só para a coordenação e para quem é titular, e por isso nenhuma das duas diverge". A coordenação não usa essa frase.
   - **Correção exigida:**
     - Os rótulos do resumo devem dizer o que existe da pessoa, não a regra de guarda. Mova `ROTULO_DA_CATEGORIA_NA_PREVIA` para um lugar que as duas telas importem, porque `componentes/` não importa de `areas/`. Pode ser `packages/shared` ou `componentes/`. Se quiser o texto na segunda pessoa para o titular, faça uma variante que fale com ele.
     - Use esse rótulo em `linhasDoResumo`.
     - Corrija o comentário de `regras.ts:115-116`.
     - Corrija a asserção de `regras.test.ts:152` e a do e2e do resumo.
     - Corrija a frase "em palavras do catálogo da coordenação" em `docs/interface.md:1269`.
     - Registre na `techspec.md` §9 (bloco da 18.0) de onde vem o rótulo.

2. **Há um `test.skip` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/meus-dados.spec.ts:300`.**
   - **O que está errado:** a regra 40 proíbe `.skip`. É o único em `e2e/`, e por causa dele o trilho não roda no projeto `celular`. Esse teste é o único que prova as mutações do trilho, declaradas nas linhas 119, 122 e 126 de Mutações: `rodape` e `menuDaPessoa` no `Trilho` e o ramo `trilho` do `MenuDaPessoa`.
   - O `test-engineer` exigiu essa correção na 1ª rodada, e ela não foi feita.
   - **Correção exigida:** trocar o `test.skip` por `await page.setViewportSize({ width: 1366, height: 768 })` antes de `entrarComoAluno`, como `e2e/casca.spec.ts` W12 já faz. A segunda metade do teste, a da professora na mesma aba, deve continuar no mesmo tamanho.

Recomendações:
- `regras.ts:164`, `textoDaEscola`: enquanto o `/v1/eu` não chega, o texto sai "feitos em a escola ativa". O certo é "na escola ativa". Monte a preposição junto com o nome.
- `regras.ts:76-83` e `situacaoDoPedido`: o `case 'nenhum'` duplica a explicação de `em_preparacao` que o `case 'preparando'` já devolve. Dá para tirar `em_preparacao` do mapa ou derivar um do outro.
- `MeusDados.tsx:184`: `agora = new Date()` só muda quando a tela redesenha. A aba parada não troca "Pronto para baixar" por "Arquivo apagado" sozinha. A API segura o download, então não é bug, mas vale uma linha no comentário de `situacaoDoArquivo`.
- `MeusDados.tsx:178`: o anúncio "ficou pronto" exige `estado === 'pronto'`. Um pedido que passe de `em_preparacao` direto a `concluido`, com arquivo disponível, não seria anunciado. Considere usar `podeBaixar` no lugar do estado.
- As recomendações do `test-engineer` na 1ª rodada continuam valendo: a sincronia positiva em `:546`, `:553` e `:583-587`, o arquivo semeado no teste da segunda pessoa e `daProfessora.chamadas` em `:230`.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-10 18:28:07 · `tasks/prd-lgpd-e-titular/18_task.md`

VEREDITO: AJUSTES NECESSÁRIOS

Tela vista: sim (8 fotos lidas: aluno e professor, computador e celular, escola cheia e vazia). Não consegui fotografar a gaveta a 360 px nem o diálogo de baixar. A vitrine não tem pedido com arquivo pronto, e a tentativa de abrir a gaveta falhou porque o botão não existe a 1366 px. Esses dois pontos foram conferidos pelo código e pelo e2e.

Estados: ok. Carregando (`EstadoCarregando`), erro com "Tentar de novo" (`EstadoErro`), vazio que convida e com dado (em preparação, pronto, apagado, agendado). A releitura que falha mantém a lista na tela.

Acessibilidade: ok pelo código e pelo e2e.
- `h1` só para o leitor de tela, como o padrão das abas.
- No aluno há `h2` "Meus dados" e `h3` nos cartões.
- Selo sempre com texto e ícone, nunca só cor.
- `nav` nomeados "Rodapé" e "Sua conta".
- `Anuncio` como região viva.
- Diálogo `alertdialog` com foco de reserva.
- O e2e roda `violacoesGraves` e `larguraExcedente`.

Chromebook fraco: ok.
- Tela em `lazy` (`parte-*`).
- Lista curta por pessoa, sem necessidade de virtualização.
- A releitura de 10 s só roda com pedido em preparação e com a aba à vista.
- `gcTime: 0` mantém dado de pessoa fora do cache.
- Não há imagem nem upload.

Celular: ok nas fotos.
- Sem rolagem horizontal nem texto cortado em 360 px.
- "Baixar meus dados" usa `Botao` com tamanho principal (44 px).
- Os itens do pé têm 44 px, e nada depende de hover.
- O trilho é só do computador.
- O e2e roda nos dois projetos, com o único `skip` descrito no bloqueante 2.

Ação oficial protegida: sim. O download abre `DialogoDeConfirmacao` com pedido, "Chegou à escola em", "Disponível até", o que o arquivo traz, o aviso de computador compartilhado e o registro do download na escola. "Cancelar" tem o mesmo peso de "Baixar o arquivo", e o clique duplo manda uma chamada só.

**Bloqueantes**

1. **O resumo "O que a escola guarda de você" mostra rótulos que são falsos para quem está ativo e que não são palavras do 6º ano.**
   - Visto em `aluno--aluno-atividades--Privacidade--computador.png`, em `vazia--aluno--…--celular.png` e em `vazia--professora--…--computador.png`. Toda pessoa ativa, mesmo sem pedido nenhum, lê "Cadastro de quem foi desativado na escola: 1 registro" e "Vínculos de alunos e professores com as turmas, depois de encerrados: 1 registro".
   - A causa está em `apps/web/src/componentes/meus-dados/regras.ts:118-122`. `linhasDoResumo` usa `CATEGORIAS_DE_RETENCAO[categoria].descricao`, que é o nome da regra de retenção da coordenação, isto é, quando o relógio começa a contar.
   - A API conta o cadastro e os vínculos vivos nessas categorias (`apps/api/src/privacidade/titulares.repository.ts:185-187`). O texto diz "desativado" e "encerrados" para quem não foi nem teve nada encerrado. Numa tela de acesso a dados de menor, isso lê como "seu cadastro foi desativado".
   - Outros rótulos falam em terceira pessoa: "das atividades do aluno", "Pedidos de entrada do aluno na turma". O comentário de `regras.ts:20` promete "você" e palavras do 6º ano.
   - **Correção exigida:** uma tabela de rótulos para quem é titular, por categoria, em `regras.ts`, em segunda pessoa e verdadeira para quem está ativo. Por exemplo: `pessoa_desativada` → "O seu cadastro na escola"; `vinculo_encerrado` → "As suas turmas e disciplinas"; `trabalho_do_aluno` → "As suas respostas, a correção e o diagnóstico das atividades". O catálogo da coordenação não muda.
   - Mantém-se a ordem do catálogo e o teste de unidade (`regras.test.ts`), e o e2e do resumo (`e2e/meus-dados.spec.ts:326-358`) passa a conferir o rótulo, não só a contagem.
   - Atualizar também `docs/interface.md`, que hoje diz "em palavras do catálogo da coordenação".

2. **`e2e/meus-dados.spec.ts:300`: há um `test.skip(naGaveta(page), …)`.** A regra 40 proíbe `.skip`, e o `test-engineer` já exigiu isto na 1ª rodada (`achados/18_task.md`). Trocar pelo `page.setViewportSize({ width: 1366, height: 768 })`, como em `e2e/casca.spec.ts:413`, para o trilho rodar nos dois projetos.

**Recomendações**

- A tela do professor, em 360 px e em 1366 px, abre direto no parágrafo "Aqui aparecem só os pedidos feitos em…", sem título visível (`vazia--professora--…--celular.png`). Segue o padrão de aba (`Tela.tsx`, `docs/interface.md` seção 6) e está declarado nas divergências da tarefa. No celular, com a gaveta fechada, a pessoa só sabe onde está pelo título da aba do navegador. Vale um título visível quando a tela vem do menu da pessoa.
- `regras.ts` (`EFEITO_DE_BAIXAR`) fala em "formato aberto (JSON)". Para aluno do 6º ano, "um arquivo que você pode abrir e guardar" lê melhor, e o nome `.json` já aparece no download.
- `docs/interface.md` diz "na gaveta a 360 px o pé aparece… sem rolar" para os dois papéis, mas só o aluno tem `toBeInViewport()` (`e2e/meus-dados.spec.ts:243-295`). Acrescentar a conferência ao professor, ou restringir a frase.
- A releitura de 10 s não tem teto: pedido preso em preparação faz a aba bater na API indefinidamente. Um teto de tentativas ou um espaçamento crescente protege a manhã de segunda (regra 80).
- Recomendações do `test-engineer` (sincronia positiva antes das asserções negativas em `:546-587`, arquivo semeado no teste da segunda pessoa, `chamadas` do professor) seguem registradas no `achados/18_task.md`.

Arquivos lidos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/componentes/meus-dados/MeusDados.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/componentes/meus-dados/regras.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/meus-dados.spec.ts`.

## test-engineer · 2ª rodada · APROVADO · 2026-10-10 18:50:23 · `tasks/prd-lgpd-e-titular/18_task.md`

VEREDITO: APROVADO

Cenários exigidos: (rodada nova) a correção exigida na 1ª rodada, mais o diff r1→r2. Dentro dele, o resumo por categoria com o rótulo do titular, o texto da escola sem nome, a professora clicando duas vezes em baixar, e a segunda pessoa na mesma aba encontrando o pedido do primeiro já pronto e com o arquivo.

Cobertos:
- **Correção 1, feita.** Saiu o `test.skip(naGaveta(page), …)`. No lugar entrou `await page.setViewportSize({ width: 1366, height: 768 })` antes de `entrarComoAluno` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/meus-dados.spec.ts:305`). A metade da professora (`:314-324`) roda na mesma `page`, então herda a largura, e o teste agora roda nos projetos `chromebook` e `celular`. Não há outro `.skip`, `.only` ou `fixme` no arquivo. O `naGaveta` continua importado porque ainda é usado em `:258`.
- **Rótulo do titular com teste que fica vermelho sem a tabela.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/componentes/meus-dados/regras.test.ts:152`, o teste exige `'As suas conversas com o Tutor'`. O teste novo (`:162-172`) compara as 12 chaves com `CATEGORIAS_DE_RETENCAO[c].descricao` e recusa as que forem iguais. Também barra `desativad|encerrad|do aluno` e fixa `pessoa_desativada` e `vinculo_encerrado`. Se `linhasDoResumo` voltar a usar a `descricao` do catálogo, ou qualquer valor que não venha da tabela, esses testes ficam vermelhos. No e2e, `:353-356` confere os textos na tela e que `desativado` não aparece.
- **`textoDaEscola`.** O teste exige `feitos na escola ativa` e recusa `em a escola`. O ramo com o nome da escola continua coberto.
- **Segunda pessoa.** O pedido do primeiro aluno agora nasce `pronto` e com arquivo. O teste confere que o botão aparece para o primeiro e some para o segundo (`toHaveCount(0)`, sem "Pronto para baixar"). Isso pega o vazamento do cache pelo botão de baixar, que antes não era provado.
- **Clique duplo da professora.** `expect(daProfessora.chamadas).toBe(1)` está em `:231`.
- **Unidade.** `npx vitest run src/componentes/meus-dados/regras.test.ts` passou, 23 de 23.
- **Mutação.** Não rodei a mutação da tabela porque `regras.ts` não está no git, e o `git checkout` não desfaria a alteração. A conclusão sobre ela vem da leitura das asserções. As linhas novas da seção "Mutações" batem com o diff.

Bloqueantes: nenhum

Recomendações:
- A sincronia positiva antes das asserções negativas em `e2e/meus-dados.spec.ts:546`, `:553` e `:583-587` continua sem fazer, por decisão registrada da Mesa. Fica para o `/retro`, e só reabre se o teste oscilar na esteira.
- Nas dez entradas da tabela que não têm valor fixado, o teste não pega uma troca por outro texto qualquer na segunda pessoa. Pega só a volta ao texto do catálogo ou à terceira pessoa, e isso basta para a regra. Fixar mais uma ou duas entradas só valeria se algum texto específico tiver peso jurídico, como "As chamadas ao modelo de IA que o seu uso gerou".

## revisor-geral · 2ª rodada · APROVADO · 2026-10-10 18:51:34 · `tasks/prd-lgpd-e-titular/18_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A §9 da `techspec.md`, no bloco da 18.0, agora diz de onde vem o rótulo do resumo (`ROTULO_DA_CATEGORIA_PARA_O_TITULAR`), e o `docs/interface.md` diz o mesmo.

Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo).

Bloqueantes: nenhum. As duas correções da 1ª rodada foram feitas:
1. **Rótulo do resumo.** O `linhasDoResumo` de `apps/web/src/componentes/meus-dados/regras.ts` agora usa `ROTULO_DA_CATEGORIA_PARA_O_TITULAR`: os rótulos dizem o que existe da pessoa, na segunda pessoa. O import de `CATEGORIAS_DE_RETENCAO` saiu e o comentário foi corrigido.
   - `regras.test.ts:152` foi corrigido.
   - Há um teste novo que percorre as 12 categorias e falha se algum rótulo for igual à `descricao` do catálogo ou contiver "desativad", "encerrad" ou "do aluno".
   - O e2e do resumo confere os dois rótulos e a ausência de "desativado".
   - A frase de `docs/interface.md` foi reescrita.
   - Nas fotos, a tela mostra "As suas respostas e as correções das suas atividades", "Os seus vínculos com as turmas" e "O seu cadastro na escola" (`aluno--aluno-atividades--Privacidade--computador.png`, `vazia--aluno--aluno-atividades--Privacidade--celular.png`, `professora--professor-nova-conversa--Meus-dados--celular.png`).
2. **O skip.** O `test.skip` saiu de `e2e/meus-dados.spec.ts`. No lugar, `page.setViewportSize({ width: 1366, height: 768 })` vem antes de `entrarComoAluno`, como pedido. Não sobrou `.skip`, `any` nem `TODO` nos arquivos da tarefa.

O resto do diff está dentro do escopo da 18.0:
- a frase sem nome da escola passou de "feitos em a escola ativa" para "feitos na escola ativa", com teste;
- o e2e confere que o clique duplo da professora faz uma chamada só;
- o teste da segunda pessoa na mesma aba usa agora um pedido pronto, com botão de baixar.

As recomendações recusadas ou adiadas estão registradas com destino em `18_task.md` e no `TODO.md`.

Recomendações:
- `apps/web/src/componentes/meus-dados/regras.ts`, em `ROTULO_DA_CATEGORIA_PARA_O_TITULAR`: o rótulo `material_excluido` ("Os materiais da escola que você enviou ou excluiu") não descreve nada que o aluno possa ter feito, porque pela D75 só a coordenação sobe material. Como a linha só aparece quando a contagem é maior que zero, não muda a tela hoje.
- `docs/interface.md:1077`: a linha editada saiu muito mais longa que as vizinhas, que quebram por volta de 130 caracteres. Vale quebrar no mesmo padrão.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-10 18:51:53 · `tasks/prd-lgpd-e-titular/18_task.md`

VEREDITO: APROVADO
Tela vista: sim (8 fotos lidas: aluno e professora, computador e celular, escola cheia e vazia). Não vi o estado "pronto para baixar", o diálogo de baixar, o carregando nem o erro: pelo código e pelo e2e, como a rodada anterior.
Estados: ok. Vazio convida ("Nenhum pedido ainda. Para receber uma cópia dos seus dados, peça à coordenação da escola."), com dado, em preparação, pronto e arquivo apagado têm texto próprio, e carregando e erro estão no e2e (`e2e/meus-dados.spec.ts`, bloco "os estados").
Acessibilidade: ok. O selo é texto mais ícone, nunca só cor, e nada mudou nos controles nesta rodada.
Chromebook fraco: ok. A releitura de 10 s só roda com a aba à vista, e a lista é curta. O teto de tentativas está registrado no `TODO.md` com dono.
Celular: ok. A 360 px não há rolagem horizontal nem corte nas quatro fotos. O rótulo longo do resumo quebra e a contagem desce para a linha de baixo, sem esconder nada. O trilho agora roda nos projetos `chromebook` e `celular`, com `setViewportSize` (`e2e/meus-dados.spec.ts:305`).
Ação oficial protegida: sim. Baixar passa por diálogo "Baixar os seus dados" com o botão "Baixar o arquivo", e o duplo clique foi coberto com `chamadas` igual a 1 na professora.

**Correções exigidas na rodada anterior**
1. Feita. `ROTULO_DA_CATEGORIA_PARA_O_TITULAR` (`apps/web/src/componentes/meus-dados/regras.ts:114`) é `Record<CategoriaDeRetencao, string>`, então o compilador exige as 12 chaves. Está em segunda pessoa e é verdadeira para quem está ativo. As fotos mostram "O seu cadastro na escola", "Os seus vínculos com as turmas", "As suas respostas e as correções das suas atividades" e "Os materiais que você gerou com a IA". O catálogo da coordenação não mudou. O unitário prova o texto para todas as categorias, o e2e confere o rótulo, e `docs/interface.md` e a Tech Spec foram atualizados.
2. Feita. O `test.skip` saiu e o teste usa `setViewportSize` 1366×768, como `e2e/casca.spec.ts:413`.

**Do diff**
- `textoDaEscola` corrigiu "em a escola ativa" para "na escola ativa", com teste.
- O e2e de troca de pessoa agora parte de um pedido `pronto` com arquivo e botão visíveis, e confere que o segundo aluno não vê nem o botão nem o selo do primeiro.
- A foto confirma o texto do titular. Não houve contradição entre foto e código.

Bloqueantes: nenhum.

Recomendações (não bloqueiam; destino em `TODO.md` ou `18_task.md`):
- No professor, a tela de "Meus dados" abre sem título visível: a foto começa no parágrafo e o `h1` existe só para leitor de tela. Está declarado em `docs/interface.md` 11.6, mas vale reconsiderar no `/validar`.
- No celular, o resumo mistura linhas com a contagem embaixo (rótulo longo) e linhas com a contagem ao lado (rótulo curto). Funciona, mas ficaria mais regular com a contagem sempre na mesma posição (`MeusDados.tsx:239`).
- Em `regras.ts:115` e `:119`, "As chamadas ao modelo de IA que o seu uso gerou" e "Os materiais da escola que você enviou ou excluiu" são os mais técnicos da lista. O segundo pode ser falso para professor e aluno, que não sobem material (D75). Rever junto da conferência do arquivo da 13.0, já registrada no `TODO.md`.
- A linha editada em `docs/interface.md:1077` ficou longa, fora da quebra em 120 colunas do resto do documento.

## privacy-guardian · 2ª rodada · REPROVADO · 2026-10-10 18:52:34 · `tasks/prd-lgpd-e-titular/18_task.md`

VEREDITO: REPROVADO

**Correção exigida na 1ª rodada: feita.** `linhasDoResumo` agora lê `ROTULO_DA_CATEGORIA_PARA_O_TITULAR` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/componentes/meus-dados/regras.ts:110-123`). O mapa é um `Record` completo, está em segunda pessoa e não traz a condição de retenção. O catálogo da coordenação (`retencao.ts`) não mudou. O teste novo em `regras.test.ts` falha se alguma linha repetir o catálogo ou disser "desativad", "encerrad" ou "do aluno". O e2e confere "O seu cadastro na escola" e a ausência de "desativado". Nas oito fotos, o resumo do aluno e o da professora aparecem certos, nas duas escolas e nos dois tamanhos de tela: só contagem e rótulo, sem nome de terceiro e sem conteúdo.

**O rótulo novo cria um texto falso para o professor.** É o mesmo tipo de defeito da rodada anterior, agora na categoria `reivindicacao_decidida`.

- `GET /v1/meus-dados` conta essa categoria para qualquer titular, com `r.decidida_por = titular or l.usuario_id = titular` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/titulares.repository.ts:181-183`, chamado em `privacidade.service.ts:375`).
- O professor aprova as reivindicações de nome (D4). Por isso a contagem dele inclui os pedidos de entrada dos alunos que ele decidiu.
- A tela diz a ele "Os seus pedidos de entrada na turma: N registros". Ele nunca pediu entrada em turma. Os registros são as decisões dele sobre pedidos de outras pessoas.
- O caso é comum: todo professor que aprovou um aluno cai nele. As fotos da vitrine não mostram porque o seed não tem aprovação feita pela professora.
- O teste novo não pega o caso: "pedidos de entrada" não bate em nenhum dos padrões proibidos.

```
Campos pessoais tocados: nenhum campo novo; só os rótulos que o titular lê sobre as categorias que já são contadas
Fora da tabela de dados do docs/lgpd.md: nenhum
Autorização por objeto: ok (o diff não toca a API; a leitura continua presa ao próprio usuário e à escola do token; o e2e da troca de pessoa na mesma aba agora prova que o botão e o selo "Pronto para baixar" do anterior não aparecem)
Logs: limpos
Auditoria: presente (nada novo no diff exige auditoria; o download continua registrado e o e2e da professora agora confere uma chamada só no clique duplo)
Envio externo: nenhum
Seed/fixture: sintético
Bloqueantes:
1. apps/web/src/componentes/meus-dados/regras.ts:122 — `reivindicacao_decidida: 'Os seus pedidos de entrada na turma'` é falso para o professor. Na contagem (titulares.repository.ts:181-183) ele entra por `decidida_por`, ou seja, pelos pedidos de alunos que ele decidiu (D4). A tela diz à pessoa uma coisa falsa sobre os dados dela, o mesmo defeito que reprovou a 1ª rodada.
   Correção exigida:
   - um rótulo verdadeiro para os dois papéis, no mesmo molde de `material_excluido` (linha 124), por exemplo "Os pedidos de entrada na turma que você fez ou decidiu";
   - em `regras.test.ts`, uma asserção que falhe se o rótulo dessa categoria voltar a dizer só a autoria, por exemplo exigir "decidiu";
   - a linha correspondente na tabela de mutações da 18_task.md.
Recomendações:
- O vazio do compartilhamento continua no TODO.md (o resumo conta só as categorias de prazo configurável; credencial, sessão e IP ficam fora). Antes do piloto, a resposta à pergunta de fechamento depende de fechar isso.
- Revisar os outros onze rótulos contra a cláusula `where` de cada categoria, papel por papel, e escrever essa conferência num comentário junto do mapa. Assim, a próxima categoria nova não repete o defeito.
```

Arquivos:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/componentes/meus-dados/regras.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/componentes/meus-dados/regras.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/titulares.repository.ts`

## test-engineer · 3ª rodada · APROVADO · 2026-10-10 19:06:25 · `tasks/prd-lgpd-e-titular/18_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** nesta rodada só mudou o rótulo de `reivindicacao_decidida` em `ROTULO_DA_CATEGORIA_PARA_O_TITULAR`. Ele tem de valer para toda linha que `contagemPorCategoria` alcança, tanto para o aluno quanto para o professor:
- o pedido feito no nome da pessoa na lista da turma (`lista_nome.usuario_id`), incluindo o recusado antes, que pode ser de outra pessoa;
- o pedido que a pessoa decidiu (`decidida_por`).

Também é preciso um teste que fique vermelho se o texto voltar ao antigo, com a linha correspondente em "Mutações".

**Cobertos:**
- **O rótulo bate com a consulta.** A cláusula está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/titulares.repository.ts:181-183` (`r.decidida_por = titular or l.usuario_id = titular`). O texto novo, "feitos com o seu nome ou decididos por você", cobre os dois caminhos e não diz que foi a pessoa quem pediu. O mesmo vale para `material_excluido` (`:185`, quem enviou ou quem excluiu), que o comentário do mapa explica.
- **A asserção nova pega a volta ao texto antigo.** O teste está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/componentes/meus-dados/regras.test.ts:173`. Rodei com o texto atual e passaram 23 de 23. Voltei o rótulo para `'Os seus pedidos de entrada na turma'` e esse teste ficou vermelho (`expected 'Os seus pedidos de entrada na turma' to be 'Os pedidos de entrada na turma feitos…'`). Desfiz a mutação e os 23 passaram de novo. O `regras.ts` não está no git, então desfiz com a substituição inversa e conferi a linha 132.
- **A seção "Mutações" está certa.** `tasks/prd-lgpd-e-titular/18_task.md` ganhou uma linha própria para `reivindicacao_decidida`, que registra o vermelho com o texto anterior. A linha das "outras entradas" foi de dez para oito, e a conta fecha: são 12 categorias, das quais 2 já tinham o texto fixado, 1 é coberta pelo e2e e 1 é esta nova.
- **O texto novo continua dentro do laço do mesmo teste.** Não é igual à `descricao` do catálogo e não cai em `/desativad|encerrad|do aluno/`.
- **Nenhum outro teste depende do texto antigo.** Procurei em `e2e/`, `apps/web/src` e `docs/interface.md`: o texto antigo não aparece em mais nenhum lugar.
- **O texto do arquivo na 13.0 continua desalinhado com a tela.** "que você fez ou decidiu" foi registrado em `TODO.md` para um `/corrigir` antes da validação do F3. Está fora do diff desta tarefa e anotado com dono.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova. As da 2ª rodada continuam valendo (ponto de sincronia positivo antes das asserções negativas no `e2e/meus-dados.spec.ts`, para o `/retro`).

## revisor-geral · 3ª rodada · APROVADO · 2026-10-10 19:07:42 · `tasks/prd-lgpd-e-titular/18_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A mudança de rótulo e a regra de conferir cada rótulo contra `contagemPorCategoria` foram registradas em `techspec.md` (item da tela "Meus dados", por volta da linha 879) e no `18_task.md`. O rótulo é texto de tela, não regra de comportamento, então não precisava entrar no `cenarios.md`.

Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo).

Bloqueantes: nenhum.

O que conferi nesta rodada:
- **Rótulo contra a consulta.** O novo rótulo de `reivindicacao_decidida`, "Os pedidos de entrada na turma feitos com o seu nome ou decididos por você", bate com a consulta em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/titulares.repository.ts:181-183`. Ela conta por `r.decidida_por = titular or l.usuario_id = titular`, então o rótulo vale para o aluno e para o professor. O de `material_excluido` (linha 185, `enviado_por` ou `excluido_por`) também diz os dois caminhos.
- **Teste.** O teste fixa o texto novo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/componentes/meus-dados/regras.test.ts:172-173`. Segundo o `18_task.md`, ele foi visto falhar com o texto antigo, e a tabela de cobertura do `18_task.md` foi atualizada (uma linha nova, e "outras oito" no lugar de "outras dez").
- **Recomendações não aplicadas.** As da 2ª rodada (minhas e dos outros revisores) estão em "Recomendações sem aplicar", cada uma com destino. O item novo do `TODO.md` para o texto do arquivo da 13.0 (`LEITURAS_DO_ARQUIVO.reivindicacao.descricao`) foi para `/corrigir` antes da validação do F3, e não entrou nesta tarefa: isso respeita o escopo.
- **Fotos.** Nenhuma das quatro que abri mostra a linha `reivindicacao_decidida`, porque a escola sintética não tem esse registro para esses titulares. A tela que aparece é a mesma da rodada aprovada.

Recomendações:
- O bloco de documentação de `ROTULO_DA_CATEGORIA_PARA_O_TITULAR` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/componentes/meus-dados/regras.ts:113-122` repete, com os nomes das colunas, o que já está na `techspec.md`. Basta apontar para a consulta e dizer a regra (rótulo verdadeiro para toda linha contada). A lista de colunas desatualiza na primeira mudança da consulta.
- O comentário em `regras.test.ts:172` explica a asserção logo abaixo. Pode sair, porque o próprio texto esperado já diz o mesmo.

## privacy-guardian · 3ª rodada · APROVADO · 2026-10-10 19:07:51 · `tasks/prd-lgpd-e-titular/18_task.md`

VEREDITO: APROVADO

A única correção exigida na 2ª rodada foi feita, e o diff não abre nenhum furo novo.

**A correção exigida**
- **O rótulo.** Em `apps/web/src/componentes/meus-dados/regras.ts:132` agora está `reivindicacao_decidida: 'Os pedidos de entrada na turma feitos com o seu nome ou decididos por você'`. Conferi contra a contagem em `apps/api/src/privacidade/titulares.repository.ts:181-183`, que é `r.decidida_por = titular or l.usuario_id = titular`. O texto é verdadeiro para o aluno (o nome dele na lista) e para o professor (os pedidos que ele decidiu, D4). Também não afirma que foi a pessoa quem pediu, o que é certo, porque um pedido recusado antes naquele nome pode ter vindo de outra pessoa.
- **O teste.** `apps/web/src/componentes/meus-dados/regras.test.ts:172-173` fixa o texto exato com `toBe`. Se o rótulo voltar a `'Os seus pedidos de entrada na turma'`, o teste fica vermelho.
- **A tabela de mutações.** `tasks/prd-lgpd-e-titular/18_task.md` ganhou a linha dessa entrada, com a nota de que o teste foi visto vermelho com o texto anterior. A linha "as outras oito" foi ajustada.
- **A recomendação da rodada anterior foi aplicada.** O comentário em `regras.ts:114-122` registra a conferência dos rótulos, papel por papel, contra `contagemPorCategoria`. Ele aponta as duas categorias que ligam a linha à pessoa por dois caminhos (`reivindicacao_decidida` e `material_excluido`) e exige a mesma conferência para categoria ou cláusula nova. O `techspec.md` repete isso.

**Campos pessoais tocados:** nenhum campo novo. Só mudou o texto que descreve uma contagem já existente.

**Fora da tabela de dados do docs/lgpd.md:** nada.

**Autorização por objeto:** ok. Este diff não toca rota nem consulta. A tela continua lendo só a resposta "meus dados" da pessoa logada, na escola ativa.

**Logs:** limpos. O diff não tem log.

**Auditoria:** presente. O diff não tem ação nova que a exija; o download já registrado na rodada anterior não mudou.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. As fotos mostram "Colégio sintético da vitrine", "Aluno Sintético Caio 4cf0fe01" e "Professora Sintética Helena 4cf0fe01".

**Fotos:** vi as do aluno (computador e celular, escola cheia) e as da professora (computador na escola cheia, celular na vazia). Cada pessoa vê só o próprio nome, os próprios pedidos e a contagem por categoria. Não aparece matrícula, dado de colega nem conteúdo, e nenhuma tela mostra o texto da conversa. Nas fotos a categoria `reivindicacao_decidida` não aparece, então o novo rótulo só se confere pelo código e pelo teste.

**Pergunta de fechamento:** o código responde. Ela não mudou nesta rodada: a contagem por categoria e o arquivo do titular (13.0) continuam respondendo o que se guarda de um aluno.

**Bloqueantes:** nenhum.

**Recomendações:**
- O item novo do `TODO.md` sobre o arquivo do titular (13.0) faz sentido e não bloqueia. A primeira consulta de `packages/nucleo/src/titular/leitura-do-titular.ts:153-154` leva ao aluno também o pedido recusado antes naquele nome, que pode ter sido feito por outra pessoa. Conferi: as colunas exportadas não identificam quem pediu (`decidida_por` está fora, e não há nenhum id de quem pediu). Mesmo assim, ao alinhar o texto pelo `/corrigir`, vale escrever na consulta que esse pedido entra de propósito e que não identifica outra pessoa.
- O rótulo de `texto_do_modelo` ("As chamadas ao modelo de IA que o seu uso gerou") é verdadeiro, mas vago. Já está no `TODO.md`, junto de `trabalho_do_aluno`, que conta atividades começadas e não respostas. Reveja os dois juntos na conferência do arquivo da 13.0.

## frontend-reviewer · 3ª rodada · APROVADO · 2026-10-10 19:07:55 · `tasks/prd-lgpd-e-titular/18_task.md`

VEREDITO: APROVADO
Tela vista: sim (8 fotos lidas, cheia e vazia, aluno e professora, 1366 px e 360 px). Nenhuma delas tem uma linha de `reivindicacao_decidida`. O rótulo novo e longo foi conferido pelo código, não pela foto.
Estados: ok. Vazio convida ("Nenhum pedido ainda. Para receber uma cópia dos seus dados, peça à coordenação da escola."), com dado, e o resumo vazio tem texto próprio (`MeusDados.tsx:233`). Carregando e erro ficam como na rodada aprovada: o diff não os toca.
Acessibilidade: sem mudança. O diff só troca um texto e comentários.
Chromebook fraco: sem mudança. É texto estático.
Celular: ok. As fotos de 360 px não têm rolagem horizontal, nem texto cortado ou saindo do bloco. O rótulo novo ("Os pedidos de entrada na turma feitos com o seu nome ou decididos por você", cerca de 75 caracteres) não aparece em nenhuma foto, mas o bloco de `MeusDados.tsx:238-241` o comporta por construção:
- A linha é `flex-wrap`, o rótulo tem `min-w-0 break-words` e a contagem tem `shrink-0`.
- O mesmo caso já está fotografado com "As suas respostas e as correções das suas atividades": o rótulo quebra em duas linhas e a contagem desce para a linha de baixo, sem cortar nada.
- Aplicado ao rótulo novo, o rótulo ocupa até três linhas e a contagem vai abaixo.

Ação oficial protegida: sim, sem mudança. Esta tarefa só lê e baixa, com o diálogo de confirmação do arquivo, e o diff não o toca.
Bloqueantes: nenhum.
- A correção da rodada anterior do `privacy-guardian` está no `regras.ts:132`, e o teste que a fixa está em `regras.test.ts:173`.
- O texto antigo "Os seus pedidos de entrada na turma" não sobra em nenhum fonte de `apps/web/src`.

Recomendações:
- No `regras.ts:132`, o aluno nunca decide um pedido de entrada. A metade "ou decididos por você" só vale para o professor, então o rótulo único é verdadeiro mas soa estranho na tela do aluno. Quando o `TODO.md` (13.0) alinhar o texto do arquivo, vale considerar um rótulo por papel, ou "feitos com o seu nome" para o aluno.
- O professor vê a tela sem título visível (`docs/interface.md` 11.6, divergência declarada). Reconsiderar no `/validar`, como a tarefa já registra.
- "As chamadas ao modelo de IA que o seu uso gerou" e "Os materiais da escola que você enviou ou excluiu" seguem técnicos. Já estão no `TODO.md` (F3, 18.0).
- Falta a foto do resumo com `reivindicacao_decidida` com dado. Se o seed da vitrine puder trazer um pedido decidido, vale fotografar a quebra do rótulo no `/validar`.
