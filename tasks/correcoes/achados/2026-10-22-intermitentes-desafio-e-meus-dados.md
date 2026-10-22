# Achados das revisões — `tasks/correcoes/2026-10-22-intermitentes-desafio-e-meus-dados.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-22 16:21:56 · `tasks/correcoes/2026-10-22-intermitentes-desafio-e-meus-dados.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A correção mexe só no foco de um botão (`BotaoDeBaixar` em `MeusDados.tsx`), num teste de integração do desafio de login e num e2e. Não há campo, migration, DTO, rota nem chamada de API nova. O botão "Baixar meus dados" continua chamando `dialogo.abrir('baixar', pedido)` como antes, e o caminho do download e da auditoria dele não mudou.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. Nenhuma rota foi alterada. O `page.route` do e2e só retém o GET de `/v1/meus-dados` do próprio aluno e depois o deixa seguir com `rota.continue()`. Não troca resposta nem escopo.

Logs: limpos. A correção não acrescenta nenhum `console` nem `logger`. O ouvinte de `focusin` do e2e guarda só o `id` ou o `tagName` do elemento, nunca texto ou dado de pessoa.

Auditoria: presente, e a correção não a toca. O download segue pelo mesmo caminho, e o e2e de "download na auditoria" que já existia continua no arquivo.

Envio externo: nenhum.

Seed/fixture: sintético. O e2e monta a escola com `criarEquipeComSenha`, `criarAlunoComMatricula`, `criarPedidoDoTitularNoBanco` e `criarArquivoDoTitularNoBanco`, por `montarEscola` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/e2e/meus-dados.spec.ts:92`. O botão que o teste injeta tem texto fixo ("Outro controle"). O teste do desafio usa só tokens emitidos no próprio teste.

Fotos da tela: olhei a de `/aluno/privacidade` no computador e a de `/professor/meus-dados` no celular, as duas da escola cheia. Cada papel vê só a contagem de registros por categoria e os próprios pedidos. Aparecem o nome da escola e o do próprio usuário, ambos sintéticos ("Colégio sintético da vitrine cheia fe78b304", "Aluno Sintético Caio fa9f8657"), e nenhum dado de outra pessoa. As fotos não mostram o botão nem o diálogo que a correção mexeu, como o próprio pedido avisa. No código, o diálogo e o botão não ganharam nenhum dado novo.

Bloqueantes: nenhum.

Recomendações:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/api/src/sessao/desafio.int.test.ts:95`, o `expect.poll` emite um desafio novo a cada tentativa enquanto o Redis não responde no prazo. Vale conferir se os `jti` recusados no corte não ficam gravados em lugar nenhum além do Redis de fila, com o mesmo cuidado de retenção que o desafio já tem. Isso não bloqueia: o código de produção (`desafio.ts`) não mudou.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-22 16:22:04 · `tasks/correcoes/2026-10-22-intermitentes-desafio-e-meus-dados.md`

VEREDITO: APROVADO

Tela vista: sim (8 fotos lidas: `/aluno/privacidade` e `/professor/meus-dados`, no computador e no celular, na escola cheia e na vazia). Limite: nenhuma foto mostra o botão "Baixar meus dados" nem o diálogo, que são o que a correção mexeu. Esses dois pontos foram conferidos só pelo código e pelo e2e descrito na tarefa.

Estados: ok. A correção não altera os estados de `MeusDados.tsx`.
- Carregando: `EstadoCarregando`.
- Erro: `EstadoErro` com "Tentar de novo".
- Vazio: "Nenhum pedido ainda. Para receber uma cópia dos seus dados, peça à coordenação da escola." Convida e diz a quem pedir. É o que mostram as fotos vazias.
- Com dado: a lista de pedidos com o botão de baixar.

Acessibilidade: ok, e a correção melhora o foco.
- Antes, o botão "Baixar meus dados" saía da lista com o foco nele e o navegador o jogava no `body`. Agora `BotaoDeBaixar` (`MeusDados.tsx:107-124`) usa o efeito de layout para mover o foco ao contêiner da tela (`inicio`, `tabIndex=-1`), e só se o foco ainda estiver no botão. Isso atende à regra 50, item 11.
- Quem já levou o foco a outro controle não perde o dele. O segundo caso de e2e registra cada `focusin` e prova isso.
- `Botao` já aceita `ref` (`Botao.tsx:8`).

Chromebook fraco: sem impacto. A mudança são um `ref` e um efeito por botão da lista de pedidos, e a lista é curta. O teste de integração usa pausas curtas, de 250 ms.

Celular: as fotos em 360 px não mostram rolagem horizontal nem texto cortado. O botão de baixar não aparece nas fotos. Pelo código, `BotaoDeBaixar` reaproveita o `Botao` sem mudar tamanho ou estilo. O e2e roda nos projetos `chromebook` e `celular`: a tarefa informa 16 casos verdes em cada um. O próprio defeito original apareceu no projeto `celular`.

Ação oficial protegida: sim. Baixar continua passando pelo diálogo de confirmação "Baixar os seus dados". A mudança só mexe no foco.

Bloqueantes: nenhum.

Recomendações:
- Na vitrine, falta um pedido com arquivo pronto. Assim as fotos mostrariam o botão de baixar e o diálogo no computador e no celular.
- `desafio.int.test.ts` é só teste (o `desafio.ts` não mudou). O `expect.poll` de 5 s com 100 ms de intervalo é razoável. Um comentário curto sobre por que o desafio é novo a cada tentativa já existe, e basta.
- O texto do cabeçalho da correção dá o job `verificar` e `ouro.test.ts` como defeito fora do escopo e a reportar ao Orquestrador. Confirme que isso foi feito, porque é um vermelho da esteira que continua aberto.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-22 16:22:18 · `tasks/correcoes/2026-10-22-intermitentes-desafio-e-meus-dados.md`

VEREDITO: APROVADO
Caminho quente tocado: login (só o teste do desafio; `desafio.ts` não muda)
Rate limit: ok (não mexido)
Fila e prioridade: ok (não se aplica)
Concorrência: protegida (o `SET NX` do jti não muda, e o caso de dois consumos ao mesmo tempo continua no arquivo)
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (o sinal `proporcaoDoSeguro` e o aviso `login.desafio_sem_redis` continuam conferidos no mesmo caso)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/api/src/sessao/desafio.int.test.ts:93-95`: a segunda pausa, de 250 ms, não prova nada que a pausa de 3 s logo acima (linhas 79-85) já não prove. O corte dos 100 ms já está conferido ali.
  - O risco: ela traz a mesma oscilação que esta correção quer tirar. A recusa só sai se o `SET` for enviado até uns 150 ms depois de a pausa começar (250 ms da pausa menos 100 ms do `commandTimeout`). Nesse intervalo cabem a volta do `CLIENT PAUSE`, o `emitir()` e o envio, num runner que já se mostrou capaz de passar de 100 ms. Se o processo de teste ficar parado mais de uns 150 ms, o desafio é aceito e o teste fica vermelho, agora pelo outro lado. Antes a margem era de uns 2,9 s.
  - Duas saídas, à escolha: tirar as linhas 93-95 e ficar só com `await travado.fim` seguido do `expect.poll`, que já resolve o sintoma; ou subir essa pausa para 1 s ou mais.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/api/src/sessao/desafio.int.test.ts:98-100`: o `expect.poll` aceita qualquer recusa como "ainda não voltou", inclusive uma recusa que não seja do Redis. Na prática não muda nada, porque cada tentativa leva um jti novo. Mesmo assim, conferir o `codigo` da última recusa deixaria o caso mais estrito.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-22 16:23:06 · `tasks/correcoes/2026-10-22-intermitentes-desafio-e-meus-dados.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
1. O Redis de fila travado com a conexão aberta: o desafio é recusado no corte de 100 ms, com o aviso uma vez só e o sinal de seguro em 1.
2. Com o Redis de volta, um desafio novo é aceito, e o sinal conta as respostas do Redis.
3. O mesmo teste fica estável numa esteira carregada.
4. A lista é relida depois de o diálogo fechar, e o botão sai com o foco nele: o foco vai para a tela, e não para o `body`.
5. A lista é relida antes de "Fechar": o foco vai para a reserva do diálogo.
6. Quem já levou o foco a outro controle não o perde.
7. Os dois projetos, `chromebook` e `celular`.

Nesta correção não entram cenário de permissão nem de isolamento: ela não mexe em leitura nem em escopo.

**Cobertos:**
- **1:** pela pausa de 3 s em `apps/api/src/sessao/desafio.int.test.ts:78-84`, que já existia.
- **2:** pelo `expect.poll` em `desafio.int.test.ts:95-98`, que pede desafio novo a cada tentativa. Ele ainda prova a regra: se o código recusasse para sempre depois da pausa, o poll ficaria vermelho.
- **4:** pelo caso em `e2e/meus-dados.spec.ts:588`, com a releitura retida de verdade por `page.route`.
- **6:** pelo caso em `e2e/meus-dados.spec.ts:598`, que registra cada `focusin` e por isso pega o foco que vai e volta.
- **5:** só de forma indireta, pelo caso antigo em `e2e/meus-dados.spec.ts:253-256`. Com a correção, ele fica verde nas duas ordens.
- **7:** pelo projeto `celular`, que o documento relata ter rodado.
- **Mutações:** as duas declaradas cobrem as duas cláusulas novas do diff, cada uma com o seu teste. O `desafio.ts` não muda, então ali não há cláusula nova sem bloco.

**Bloqueantes:**
1. **`apps/api/src/sessao/desafio.int.test.ts:90-91`: o passo novo da pausa de 250 ms só passa com a máquina folgada.** É o mesmo tipo de oscilação que esta correção quer tirar, só que no sentido contrário.
   - `travarRedis` devolve quando chega a resposta do `CLIENT PAUSE` (`tools/testes/redis-travado.ts:15`). Depois disso o teste ainda roda `await emitir()`, que assina e confere um JWT de forma assíncrona, e só então manda o `SET`.
   - Para o `rejects` dar certo, o `SET` precisa chegar ao Redis em menos de uns 150 ms desde o começo da pausa (250 − 100). Se a esteira carregada atrasar o laço de eventos nesse trecho, o `SET` fica retido menos de 100 ms, a resposta chega dentro do prazo, `consumir` resolve, e o teste falha em `rejects.toMatchObject`.
   - O defeito original foi justamente atraso dessa ordem, e foi na mesma esteira: 119 arquivos, 999 s.
   - O passo também não prova nada que a pausa de 3 s em `:78-84` já não prove: o corte de 100 ms com o Redis travado.
   - **Correção exigida:** tirar as linhas 90-92 e deixar a pausa de 3 s como prova do corte, seguida do `expect.poll`. Se o passo ficar, o desafio precisa ser emitido **antes** de `travarRedis`, e a pausa precisa ter folga larga sobre o corte (1 s ou mais), para que o atraso do cliente não decida o resultado.
   - Nos dois casos, atualizar "Teste que reproduz" e "Correção", item 1, do documento `tasks/correcoes/2026-10-22-intermitentes-desafio-e-meus-dados.md`.

**Recomendações:**
1. **`e2e/meus-dados.spec.ts:595`:** o nome do caso diz que "o foco vai para a tela", mas a asserção só confere que o foco não está no `body`. Um foco parado em qualquer outro elemento passaria. Vale conferir que o foco está no contêiner `inicio` da tela, aquele com `tabIndex={-1}` em `MeusDados.tsx:216`, por um seletor estável ou por `page.evaluate`.
2. **Caminho em que a releitura chega antes de "Fechar":** o `focoDeReserva` do diálogo ainda só é provado pela ordem que a máquina escolher, no caso antigo em `:253-256`. O ajudante novo permite um caso que espere "Arquivo apagado" na lista antes de tocar em "Fechar". Assim as duas ordens ficam provadas de forma fixa.
3. **`e2e/meus-dados.spec.ts:602-609`:** o "outro controle" é um botão sintético posto no `body`, fora da raiz do React. Funciona como prova da guarda, mas um controle real da tela, como um link da navegação, seria mais fiel ao uso.
4. **Teste que não rodei:** tentei rodar `npx vitest run src/sessao/desafio.int.test.ts` neste checkout, e ele não chegou a rodar porque o pacote `@educa/nucleo` não está compilado aqui. Não compilei para não alterar a árvore. A estabilidade de "10 de 10 verdes" vem só do relato do documento.
5. **Não há `.skip`, teste comentado, mock escondendo a regra nem provedor pago.** O `vi.spyOn(Logger.prototype, 'warn')` só observa o aviso; não substitui a regra.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 16:48:23 · `tasks/correcoes/2026-10-22-intermitentes-desafio-e-meus-dados.md`

VEREDITO: APROVADO

Cenários exigidos:
- Desafio: o corte de 100 ms com o Redis de fila travado e a conexão ainda aberta. O desafio é recusado, o aviso `login.desafio_sem_redis` sai uma vez só e o sinal do seguro fica em 1. Depois da pausa, um desafio bom volta a ser aceito, e a recusa que aparecer enquanto isso tem de ser a do Redis (`NAO_AUTENTICADO`).
- Desafio sem oscilar: o teste não pode depender de a máquina estar folgada, nem para passar nem para falhar.
- Meus dados: o botão "Baixar meus dados" sai da lista enquanto está com o foco, a releitura chega depois de "Fechar", e o foco vai para o contêiner da tela, não para o `body`.
- Meus dados: o foco que a pessoa já levou a outro controle continua lá e não passa por nenhum outro elemento.

Cobertos:
- A correção exigida na 1ª rodada foi feita. O passo da pausa de 250 ms saiu de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/api/src/sessao/desafio.int.test.ts`.
  - O corte continua provado pela pausa de 3 s, nas linhas 78-84.
  - Depois dela, as linhas 91-100 esperam com `expect.poll` (prazo de 5 s, um desafio novo a cada tentativa) que um desafio seja aceito.
  - Uma recusa que não seja `NAO_AUTENTICADO` vira `outra recusa: ...`. Ela não conta como aceite e aparece na mensagem de falha.
  - O teste ainda ficaria vermelho se o Redis nunca voltasse, se a recusa ficasse presa depois da pausa, ou se o erro trocasse de tipo. A linha 101 confere o sinal do seguro abaixo de 1.
- O documento bate com o teste. Na versão nova, "Teste que reproduz", item 1, "Correção", item 1, e "Estabilidade" dizem que a pausa de 250 ms foi só para reproduzir o vermelho e não fica no teste.
- Rodei `npx vitest run apps/api/src/sessao/desafio.int.test.ts` uma vez: 3 de 3 verdes, em 5,4 s.
- O e2e ficou mais rígido, como eu tinha recomendado. Em vez de conferir só "não está no `body`", o caso de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/e2e/meus-dados.spec.ts`, linhas 594-603, exige que o foco esteja num `DIV` com `tabindex=-1` que contém "Arquivo apagado". Esse é o contêiner `inicio` de `MeusDados.tsx:216`.
- `MeusDados.tsx` não mudou desde a 1ª rodada. As duas mutações do documento continuam valendo para a mesma linha (`MeusDados.tsx:114`).
- As duas recomendações que não viraram código estão no `TODO.md`, com origem e motivo: a vitrine com o pedido pronto, e a prova fixa da ordem em que o `focoDeReserva` vale. A troca do botão sintético foi recusada com motivo, e o motivo se sustenta.
- Não há `.skip`, nem mock que esconda a regra, nem chamada a provedor de IA.

Bloqueantes: nenhum.

Recomendações: nenhuma nova. Valem as da 1ª rodada que estão no `TODO.md`.
