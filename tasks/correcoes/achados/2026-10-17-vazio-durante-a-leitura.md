# Achados das revisões — `tasks/correcoes/2026-10-17-vazio-durante-a-leitura.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 17:56:13 · `tasks/correcoes/2026-10-17-vazio-durante-a-leitura.md`

VEREDITO: APROVADO

Tela vista: sim (4 fotos lidas, Painel cheio e vazio, em 1366 px e 360 px). As fotos mostram só o Painel. Nenhum arquivo de produção mudou, então elas servem de confirmação de que a tela não foi tocada. Nas fotos cheias, o Painel está atrás do modal de incidente que a vitrine abre.

Estados: ok. Esta correção só acrescenta a prova do vazio em carregando e em erro, e não mexe na tela.
- As asserções `queryByText(<texto do vazio>)` com `toBeNull()` estão no ponto certo de cada caso. Isso vale para Estrutura, Pedidos, Professores, ListaDaTurma, Escolas, Uso e o consumo do Painel.
- O RF22 ("vazio só com a leitura terminada e sem erro") passa a ter prova nos dois estados, e as mutações do documento estão alinhadas com cada asserção.
- No Painel vazio (foto 1366 px e 360 px), "Tudo em dia" e "A escola está montada" convidam, e o consumo diz "Nenhuma função da IA trabalhou neste mês.". Não há tabela sem linha nem tela em branco.

Acessibilidade: sem alteração. As asserções usam texto e papel, e a tela vazia mantém título, rótulos e botões legíveis.

Chromebook fraco: sem alteração, porque nada de produção mudou.

Celular: sem alteração. Na foto de 360 px não há rolagem horizontal. A barra de baixo tem quatro lugares (Painel, Analista, Escola, Registros), como a seção 11.1 pede. A faixa sem sombra sob a barra de baixo, na foto cheia, é artefato da captura de página inteira com modal. Não é defeito.

Ação oficial protegida: sim. Nada de ação oficial foi tocado.

`docs/interface.md`: as três edições (seção 3, a tabela "O que cada papel vê" e a frase "A coordenação abre no Painel…") batem com o código. `Registros.tsx` define a aba IA no caminho `ROTAS_DA_COORDENACAO.governanca`, o que confirma "Governança é a aba IA de Registros". A seção ficou consistente com as linhas 345 e 1677 do mesmo documento.

Bloqueantes: nenhum.

Recomendações:
- Na foto `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/.processo/vitrine/coordenacao--coordenacao-painel--celular.png`, o cartão "Incidente de segurança sem ..." aparece cortado com reticências em 360 px. O corte vem de `apps/web/src/componentes/Linha.tsx:58`: `truncate` com o título só em `title`, que depende de hover e não aparece no celular. No celular, o título deveria quebrar linha. Isso é anterior a esta correção e fica fora dela, junto dos C1 a C3. Vale tratar na próxima correção do Painel.
- O modal de incidente ocupa a altura toda e rola por dentro. Isso já é o C1/C2 da validação e está fora do escopo desta correção.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-17 17:56:52 · `tasks/correcoes/2026-10-17-vazio-durante-a-leitura.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo; as 18 mutações do documento provadas, impressão `cb915924d427a760`)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/docs/interface.md:1525`: a linha nova "A coordenação abre no Painel (X2); Governança é a aba IA de Registros. O aluno abre no Tutor quando ele está ligado" passa da largura de quebra que o resto da seção usa, perto de 100 colunas. Vale requebrar o parágrafo.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Painel.test.tsx:518`: no ramo de erro do consumo, o teste chega ao erro por `esperarTudoLido()`, que só espera sumir o "Carregando". A mutação do erro deu vermelho, então a prova vale. Mesmo assim, ficaria mais explícito esperar o `alert` dentro de `bloco(REGIOES.ia)` antes das duas asserções, como as outras telas fazem com `findByRole('alert')`.

O que conferi:
- **C4:** cobre as seis telas e o consumo do Painel que a validação lista, com o texto exato de cada vazio. As asserções novas ficam depois de a tela estar no estado certo: depois de achar o texto de carregando ou o `alert`.
- **Maior:** a seção 3 e a tabela "O que cada papel vê" foram atualizadas. O que o texto novo afirma bate com o código: Governança é a aba IA de Registros (`apps/web/src/areas/coordenacao/Registros.tsx:11`, `rotas.tsx:82-85`), e os quatro lugares abrem no Painel (`apps/web/src/areas/navegacao.ts:49-57`). Não sobrou no documento nenhuma menção a "abre em Governança" ou a "sete itens" como estado atual.
- **Produção e escopo:** nenhum arquivo de produção mudou. C1, C2, C3 e os Menores ficaram de fora, como o pedido mandava.
- **Fotos:** `vazia--coordenacao--coordenacao-painel--celular.png` mostra os quatro lugares na barra de baixo, de acordo com o texto novo. O aviso de incidente por cima do Painel em `coordenacao--coordenacao-painel--computador.png` faz parte do C1, que está fora desta correção.

## test-engineer · 1ª rodada · APROVADO · 2026-10-17 17:57:26 · `tasks/correcoes/2026-10-17-vazio-durante-a-leitura.md`

VEREDITO: APROVADO

**Cenários exigidos.** RF22 diz que o vazio só aparece quando a leitura terminou sem erro. O cenário é: enquanto a leitura corre, e quando ela falha, o texto do vazio não está na tela. Isso vale para as telas listadas no C4 da validação: Turmas, Pedidos, Operação › Escolas, Operação › Uso, o carregando de Professores, o carregando da lista da turma, e o carregando e o erro do consumo do Painel. Para cada uma, o teste tem de ficar vermelho se a tela mostrar o vazio junto do carregando ou do erro.

**Cobertos.**
- **Estrutura** (carregando e erro): os dois textos do vazio.
- **Pedidos** (carregando e erro): o texto do vazio.
- **Escolas e Uso** (carregando e o 503): "Nenhuma escola ainda."
- **Professores** (carregando): o texto do vazio.
- **ListaDaTurma** (carregando): os três convites da turma.
- **Painel** (consumo carregando e com erro): o vazio e a linha "Consumo do mês: …", procurados só dentro do bloco da IA.
- **Mutações:** as 18 do documento batem uma a uma com as asserções do `git diff`, e não sobra asserção nova sem bloco. Cada mutação deixa na tela o texto do carregando ou o alerta de erro, então só a asserção nova pode ficar vermelha. Ou seja, o teste fica vermelho pelo motivo certo.
- **O erro de Professores**, que o documento não lista, já estava coberto: `Professores.test.tsx:170` confere que o botão "Cadastrar professor" não aparece, e esse botão é a ação do `EstadoVazio` (`Professores.tsx:189`). Se o vazio aparecesse junto do erro, esse teste ficaria vermelho.
- Rodei os 7 arquivos: 164 testes passaram. Não há `.skip`, teste comentado nem mock escondendo a regra; a rede falsa só controla o tempo da resposta. Não há IA nem concorrência nesta correção.

**Bloqueantes:** nenhum.

**Recomendações.** Nenhuma bloqueia; ficam para o `/validar` e o `/retro`. As duas são anteriores a esta correção e ficaram fora da lista do C4.
1. **`Professores.tsx:183`**: o ramo `professores.isError ?`, para quando a nova leitura falha com a lista ainda vazia (logo depois do primeiro cadastro), não tem teste. Se a condição for tirada, a tela mostra "Nenhum professor ainda" no lugar do erro e nenhum teste fica vermelho, e é esse o caso que o comentário do código diz que não pode acontecer. Sugestão: em `Professores.test.tsx`, um caso com a primeira leitura `ok([])` e a seguinte `FALHA`, conferindo o alerta e a ausência de "Nenhum professor ainda". Declarar a mutação desse ramo.
2. **`ListaDaTurma.test.tsx:194`** (erro da leitura da turma): o teste confere só que a região "Nomes da turma" não existe, e não os três textos do vazio. Hoje esse ramo não leva ao vazio, porque as seções só montam com a turma lida. Mesmo assim, as mesmas três asserções do carregando (`:186-188`) fechariam o par carregando e erro, como nas outras telas.

O que mudou no `docs/interface.md` não é teste; conferir que ele bate com as rotas é com o `revisor-geral`.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/correcoes/2026-10-17-vazio-durante-a-leitura.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Professores.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Professores.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx

## test-engineer · 2ª rodada · APROVADO · 2026-10-17 18:02:51 · `tasks/correcoes/2026-10-17-vazio-durante-a-leitura.md`

VEREDITO: APROVADO

**Cenários exigidos (rodada 2, só o diff desde `72cabd9`):**
- Quando a leitura da turma falha, a tela mostra o erro com "Tentar de novo" e nenhum dos três textos de vazio aparece ao lado: "Nenhum nome nesta turma ainda", "Nenhum professor nesta turma" e "Nenhum pedido esperando".
- No Painel, quando o consumo do mês falha, a tela não diz que está vazio nem mostra a linha do mês, e isso só é conferido depois que o alerta do bloco aparece.
- A recomendação que fiz na 1ª rodada para o `ListaDaTurma.test.tsx` foi aplicada.

**Cobertos:**
- `apps/web/src/areas/coordenacao/ListaDaTurma.test.tsx:202-205`: as três asserções negativas vêm depois de `findByRole('alert')`, ou seja, rodam com o erro já na tela. Os três textos existem no produto: `ListaDaTurma.tsx:243`, `ListaDaTurma.tsx:272` e `ProfessoresDaTurma.tsx:90`. Então nenhuma dessas asserções passa só porque o texto não existe em lugar nenhum.
- Os três blocos de mutação novos estão em `tasks/correcoes/2026-10-17-vazio-durante-a-leitura.md:189-208`. Cada um põe o vazio ao lado do `EstadoErro` da leitura da turma (`ListaDaTurma.tsx:144`), um texto por bloco. As asserções das linhas 203-205 pegam exatamente essas trocas, e o motivo é o certo: o cenário chega ao ramo de erro.
- `apps/web/src/areas/coordenacao/Painel.test.tsx:523`: o `await ... findByRole('alert')` antes dos dois `queryByText(...)` que esperam nulo garante que essas asserções rodam com o erro já desenhado, e não num momento intermediário em que passariam de qualquer jeito. Isso deixa mais firmes as duas mutações do consumo que já existiam (linhas 173-187 do documento).
- `docs/interface.md`: só muda a quebra de linha, sem efeito em teste.
- A recomendação do `Professores.tsx:183` foi para o `TODO.md` com o motivo, como pede a regra para recomendação.
- Rodei `npx vitest run` em `ListaDaTurma.test.tsx` e `Painel.test.tsx`: os 2 arquivos e os 62 testes passaram.
- Não há `.skip`, teste comentado nem mock de coisa nossa. Nenhum arquivo de produção mudou.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova. A do `Professores.tsx:183` segue registrada no `TODO.md` para o `/validar` e o `/retro`.
