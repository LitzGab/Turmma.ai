# Achados das revisões — `tasks/correcoes/2026-10-16-tentar-de-novo-da-estrutura-no-celular.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-16 22:16:42 · `tasks/correcoes/2026-10-16-tentar-de-novo-da-estrutura-no-celular.md`

VEREDITO: APROVADO
Tela vista: sim (10 fotos lidas: Painel e Estrutura, computador e celular, na escola cheia e na vazia). A correção não mexeu em arquivo de tela, só no comportamento de releitura do sino.
Estados: ok. Os quatro estados da Estrutura e do sino não mudaram. Carregando e erro foram conferidos pelo código e pelo teste, já que a vitrine não os mostra. A correção protege o estado de erro: o "Tentar de novo" deixa de sumir antes do toque.
Acessibilidade: sem alteração. Nas fotos, o botão do sino e os botões da Estrutura têm texto visível e alvo de toque grande.
Chromebook fraco: melhora. Menos releituras na montagem do sino (`fila-da-coordenacao.ts:192`, `retryOnMount: false`), o que ajuda a rede lenta e a CPU fraca. A releitura segue pelo "Tentar de novo" (`refetchQueries` com chave exata, linha 261), então nada fica sem caminho de recuperação.
Celular: ok em 360 px nas fotos da Estrutura (cheia e vazia): sem rolagem horizontal, sem corte, botões com 44 px ou mais. A correção resolve a queda do `e2e/estrutura.spec.ts:294` justamente no projeto `celular`.
Ação oficial protegida: sim (não se aplica; nenhuma ação oficial foi tocada).
Bloqueantes: nenhum.
- A foto de `/coordenacao` (Painel), cheia e vazia, no computador e no celular, mostra "Página não encontrada". Isso não é defeito desta correção. `caminhos.ts:174` diz que o Painel só passa a ser a raiz na tarefa 3.0, e vale o código da árvore. A tarefa 3.0 precisa fotografar o Painel de verdade, cheio e vazio, quando a rota existir.

Recomendações:
- A foto do Painel vazio deveria ser refeita na 3.0 para confirmar que a escola nova recebe convite e próximo passo, não desculpa.
- Na foto do computador, o menu lateral corta o item "Privacidade" na altura do rodapé. A rolagem interna parece intencional, mas vale conferir na validação se o corte indica a rolagem.
- Os testes (`SinoDaCoordenacao.test.tsx`) cobrem os seis observadores e as mutações do documento mapeiam um a um. Está adequado.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/fila-da-coordenacao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx`

## test-engineer · 1ª rodada · APROVADO · 2026-10-16 22:17:17 · `tasks/correcoes/2026-10-16-tentar-de-novo-da-estrutura-no-celular.md`

VEREDITO: APROVADO

**O que a correção resolve.** O sino da coordenação monta depois da tela e relia sozinho a consulta que a tela já mostrava em erro. A tela saía do erro e o botão "Tentar de novo" sumia antes do toque, por isso o teste da Estrutura estourava o prazo no celular. A correção desliga essa releitura nos seis observadores do sino.

**Cenários exigidos:**
- Caminho feliz: o sino monta depois da tela, a leitura dos anos já está em erro, e o sino não a relê. O erro e o "Tentar de novo" da tela continuam de pé.
- Borda 1: as outras cinco leituras (incidentes, professores, materiais, turmas e vínculos) já em erro quando o sino monta. Nenhuma é relida.
- Borda 2: turmas e vínculos só são lidos com ano em curso. O teste deixa os anos com dado para que essas duas consultas cheguem a ser lidas e a mutação delas tenha o que pegar.
- Borda 3, de regressão: o "Tentar de novo" do próprio sino ainda relê o que falhou, mesmo sem a releitura automática na montagem.
- Borda 4, de regressão: uma consulta que ainda não existe continua carregando normalmente quando o sino monta.
- Permissão: o sino continua sem ler as leituras auditadas (lista da turma, reivindicações e pedidos do titular). A correção não mexe nisso.
- Isolamento entre escolas: não se aplica. A mudança é só de quando o cliente relê, e não toca escopo nem dado.
- Concorrência: a corrida da tarefa é entre a tela e o sino, que chega tarde. Os testes novos a reproduzem com um observador da tela já em erro, a rede voltando e só então o sino montando.

**Cobertos:**
- Caminho feliz: `SinoDaCoordenacao.test.tsx:272`. Conta as chamadas a `/v1/anos-letivos` antes e depois de o sino montar e confere que a tela continua em erro.
- Bordas 1 e 2: `SinoDaCoordenacao.test.tsx:296`. Confere a contagem das seis leituras, uma a uma, e o estado das seis consultas: os anos com dado, as outras cinco em erro.
- Borda 3: o teste que já existia, `SinoDaCoordenacao.test.tsx:558`, com a fila inteira em erro, continua verde.
- Borda 4: os testes que já existiam, em que o sino cria as próprias consultas e as carrega, continuam verdes.
- As sete mutações cobrem, uma a uma, todas as cláusulas novas do diff de `fila-da-coordenacao.ts`: a constante e os seis observadores. Cada uma aponta para o teste que conta exatamente a leitura que ela reativaria, então a falha vem do motivo certo.
- `npx vitest run src/areas/coordenacao/SinoDaCoordenacao.test.tsx`: 22 de 22 passam.
- Sem `.skip` nem teste comentado. A rede falsa é a de fora; o TanStack e o cliente de consultas são os reais, e nada esconde a regra. O tempo é controlado com relógio falso dentro do teste, sem depender da máquina.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Ninguém rodou de novo o caso de origem, `e2e/estrutura.spec.ts:294` no projeto `celular`, depois da correção. A reprodução por spec temporário só provou a causa. Vale conferir esse caso na próxima rodada da esteira antes de fechar a spec.
2. Em `SinoDaCoordenacao.test.tsx:290`, o teste só espera o sino aparecer (`/^Esperando você/`). Vale afirmar também que o sino mostra o estado "não carregou" quando a consulta já estava em erro. Assim fica provado que, sem a releitura, o sino continua avisando da falha em vez de mostrar "nada".
3. O Painel usa `SEM_LEITURA_SOZINHA` com a releitura na montagem ainda ligada. Vale confirmar que nenhum observador do Painel monta tarde sobre uma consulta em erro aberta por outra tela, que é a mesma corrida. É fora desta correção, fica para o `/retro`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/fila-da-coordenacao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/correcoes/2026-10-16-tentar-de-novo-da-estrutura-no-celular.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-16 22:21:30 · `tasks/correcoes/2026-10-16-tentar-de-novo-da-estrutura-no-celular.md`

VEREDITO: APROVADO

**Cenários exigidos:** o sino é carregado depois da tela (`lazy()`) e monta quando a tela já tem uma consulta da fila em erro. Nesse caso ele não pode reler a consulta. Isso vale para os anos e para as outras cinco consultas (incidentes, professores, materiais, turmas e vínculos). O controle de que a mesma consulta, com a opção ligada, relê. Uma consulta que ainda não existe continua carregando normalmente.

**Cobertos:**
- A recomendação da 1ª rodada foi aplicada em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx:276-291`. A troca de `COM_UM_ITEM` por `TUDO_EM_DIA` deixa a resposta "não houve releitura" diferente de "houve releitura":
  - Com `retryOnMount: false`, o sino continua vendo o erro dos anos e mostra `'Esperando você, parte não carregou'`. Esse rótulo está em `apps/web/src/componentes/sino/Sino.tsx:55`.
  - Sem a regra, a releitura ao montar encontra a rede de volta (`indisponivel = false`). O sino passa a mostrar "carregando" e depois `'Esperando você, nada'`.
  - O teste confere o rótulo também depois de `avancar(2 * MIL)`, na linha 291. Assim ele não aceita um rótulo que aparece só por um instante antes de a releitura chegar.
- As três asserções que já existiam continuam e quebrariam sem a regra: o número de leituras de `/v1/anos-letivos`, `isError` da tela e o rótulo. Isso fecha o que a recomendação pedia: sem a releitura, o sino continua avisando da falha em vez de dizer "nada".
- Rodei `npx vitest run apps/web/src/areas/coordenacao/SinoDaCoordenacao.test.tsx` uma vez: 22 de 22 passaram, sem `.skip`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/fila-da-coordenacao.ts` não mudou desde a rodada aprovada. As sete mutações do documento são as mesmas.
- A mudança no documento da correção só acrescenta texto: o parágrafo sobre `e2e/professores.spec.ts:220` em "Fora desta correção" e a tabela de recomendações. Nenhuma cláusula de código entrou sem bloco de mutação.

**Bloqueantes:** nenhum.

**Recomendações:**
- `SinoDaCoordenacao.test.tsx:329`: o teste irmão, o das cinco leituras, ainda espera só `/^Esperando você/`. Vale fazer nele a mesma coisa feita no dos anos: afirmar `'Esperando você, parte não carregou'` antes e depois do `avancar`. A contagem por caminho com `leiturasDe()` já prova a regra, então isso é só para os dois testes ficarem iguais.
