# Achados das revisões — `tasks/correcoes/2026-10-17-duas-abas-do-acesso-suspenso.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 12:24:53 · `tasks/correcoes/2026-10-17-duas-abas-do-acesso-suspenso.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: Nova conversa da professora no computador e no celular, escola cheia e vazia). A tela "Acesso suspenso" não está na vitrine e a tarefa não mudou nenhum arquivo de `apps/web`. Por isso ela é revisada só pelo diff do e2e.
Estados: ok para o que a tarefa toca. Não houve mudança de tela, então carregando, vazio, erro e com dado ficam como estavam. A foto da escola cheia mostra a Nova conversa com o cartão "Esperando você". A da vazia mostra a Nova conversa com a caixa de pedido e o link "Abrir a conversa com o Assistente".
Acessibilidade: sem mudança. Nas fotos, o foco do item ativo, o contraste e os rótulos da navegação estão visíveis.
Chromebook fraco: sem impacto. A correção é só de teste e usa um atraso de 1,5 s imposto por `page.route` para simular a esteira lenta. O prazo do teste não foi alterado.
Celular: nas fotos de 360 px não há rolagem horizontal nem corte. A barra inferior com Início, Ferramentas e Turmas está íntegra, e a caixa de pedido e o botão "Sair" cabem. Não medi os alvos de toque com ferramenta. A tarefa não altera a tela, então isso não bloqueia.
Ação oficial protegida: sim, não se aplica. Nada oficial muda nesta tarefa.

Bloqueantes: nenhum.

O código do e2e está coerente com a causa descrita:
- `abrirSegundaAbaQuieta` (`e2e/acesso-suspenso.spec.ts`) registra o `waitForResponse` antes do `goto`.
- Ele atrasa `/v1/meus-vinculos` e `/v1/time` e espera as duas respostas voltarem.
- Só então tira a rota e devolve a aba. Assim o 403 sai da primeira aba, como o teste afirma.
- A mutação declarada, remover `await Promise.all(respostas)`, reproduz a corrida de forma determinística.
- O relato de verde é de 10 em 10 e de 24 em 24.

Recomendações:
- Nas fotos aparecem sufixos hexadecimais ("Colégio sintético da vitrine cheia 2c88b5b2", "2ºB 1f996075 · Química", "Professora Sintética Helena 1f996075"). São da massa sintética da vitrine e não vazam do produto. Convém garantir que o seed de demonstração real não os gere.
- `/vazia--professora--inicio` (`vazia--professora--inicio--computador.png` e `--celular.png`): a seção "Esperando você" some por inteiro quando não há entrega pendente. Para a professora com turma, o feed central do produto não deveria sumir sem uma frase que convide ao próximo passo. Isso não é desta tarefa (nenhum `apps/web` mudou). Fica registrado para o `/validar`.
- O seletor de turma no celular tem cerca de 36 a 40 px de altura nas fotos. Isso está acima do mínimo de 24 px, mas abaixo dos 44 px recomendados. A ação principal da tela é o botão de enviar, que também está abaixo de 44 px. Vale conferir na spec que cuida dessa tela.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/acesso-suspenso.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/correcoes/2026-10-17-duas-abas-do-acesso-suspenso.md`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-17 12:26:32 · `tasks/correcoes/2026-10-17-duas-abas-do-acesso-suspenso.md`

VEREDITO: REPROVADO

Cenários exigidos:
1. A corrida reproduzida de forma determinística, com a rede lenta forçada pelo próprio teste e sem depender da máquina estar carregada.
2. Nenhuma leitura da segunda aba a caminho quando `agendarEliminacaoNoBanco` roda. É isso que sustenta a frase do teste, "a primeira aba pede primeiro".
3. A primeira aba mostra o título "Acesso suspenso" com o link `/entrar`.
4. A segunda aba recebe o 401, o diálogo "Sua sessão expirou" aparece, a senha certa mostra o texto da suspensão e nenhum cookie `educa_sessao` volta.
5. Os dois perfis, `chromebook` e `celular`.
6. A mutação vermelha pelo motivo certo.

Cobertos:
- O cenário 1 está coberto pelo `page.route` com 1,5 s de atraso e pelo `waitForResponse` registrado antes do `goto` (`e2e/acesso-suspenso.spec.ts:58-73`). O prazo continua dentro do teste, como a regra pede.
- A mutação (`- await Promise.all(respostas)`) fica vermelha em `:207`, no título que não aparece. É o sintoma da corrida, então o motivo é o certo.
- Os cenários 3, 4 e 5 continuam com as asserções de resultado de antes (`:207-223`).
- Não há `.skip`, teste comentado nem mock de código nosso. A rota só atrasa, e a requisição segue para a API real (`rota.continue()`).
- O teto de 30 s não foi mexido. Está certo, porque a causa não é tempo.

Bloqueantes:
- **`e2e/acesso-suspenso.spec.ts:27` (`LEITURAS_DA_NOVA_CONVERSA`) e a seção "Causa" do documento (`tasks/correcoes/2026-10-17-duas-abas-do-acesso-suspenso.md:30`): a lista de leituras está incompleta, e a corrida continua aberta por uma terceira leitura.**
  - Ao montar, a Nova conversa dispara quatro consultas, e não três. Em `apps/web/src/areas/professor/Home.tsx:46-49` estão `consultaEu`, `consultaMeusVinculos`, `consultaTime` e `consultaEntregasPendentes`. A última é `GET /v1/entregas?estado=pendente&limite=…` (`apps/web/src/api/entregas.ts:14,21-24`).
  - A casca da escola dispara a mesma `/v1/entregas` (`apps/web/src/componentes/CascaDaEscola.tsx:260`).
  - Essa leitura sai junto com `meus-vinculos` e `time`, e ninguém espera por ela. Na esteira lenta, ela pode estar a caminho quando a marca vai ao banco, exatamente como `meus-vinculos` estava no trace. Nesse caso a segunda aba leva o 401, renova, leva o 403 e apaga o cookie antes da primeira. É o mesmo vermelho da linha 207, só que mais raro.
  - O teste segue passando só quando a máquina está folgada, e na esteira ele já caiu duas vezes.
  - Correção exigida: a segunda aba só pode ser devolvida sem nenhuma requisição dela a caminho.
    - O jeito preferido: contar na própria aba `request` contra `requestfinished` e `requestfailed`, e esperar com `expect.poll` até zerar. Isso cobre também qualquer leitura que a tela ganhar depois.
    - Se ficar a lista fixa: incluir `/v1/entregas`. Nesse caso o padrão de `aba.route` precisa casar a URL com query string: o glob `**/v1/{…}` não pega `?estado=pendente`, então use uma função como predicado, e o `waitForResponse` continua pelo `pathname`. O atraso forçado deve valer para todas as leituras esperadas.
    - Em qualquer dos dois caminhos, corrigir a "Causa" do documento, que hoje diz que são duas leituras.

Recomendações:
- A mutação só prova que a espera importa para as duas leituras atrasadas. Com o contador de requisições a caminho, a mesma mutação, removendo a espera, passa a provar o fechamento inteiro.
- O comentário de `abrirSegundaAbaQuieta` (`:52-57`) cita "a leitura dos vínculos e a do time". Ele deve acompanhar a correção, para não dizer que são só essas.
- No `TODO.md`, o item marcado `[x]` está certo. Vale acrescentar que a terceira leitura foi encontrada na auditoria, para o `/retro` registrar que a hipótese foi revista duas vezes.

Não rodei o e2e. A conclusão vem da leitura de `Home.tsx` e de `CascaDaEscola.tsx` contra a lista do teste, e as fotos da tela não foram abertas porque a correção não muda tela nenhuma.

## test-engineer · 2ª rodada · APROVADO · 2026-10-17 12:39:20 · `tasks/correcoes/2026-10-17-duas-abas-do-acesso-suspenso.md`

VEREDITO: APROVADO

Cenários exigidos:
1. A corrida aparece sempre, com a rede lenta forçada pelo próprio teste e sem depender de a máquina estar carregada.
2. Quando `agendarEliminacaoNoBanco` roda, a segunda aba não tem nenhuma requisição a caminho, qualquer que seja a leitura. É isso que sustenta a frase "a primeira aba pede primeiro".
3. A primeira aba mostra o título "Acesso suspenso", com o link para `/entrar`.
4. A segunda aba recebe o 401 e o diálogo "Sua sessão expirou". Com a senha certa aparece o texto da suspensão, e o cookie `educa_sessao` não volta.
5. Os dois perfis, `chromebook` e `celular`.
6. A mutação fica vermelha pelo motivo certo, e cobre o fechamento inteiro.

Cobertos:
- **Correção exigida, feita.** A lista fixa saiu. No lugar, a segunda aba conta as próprias requisições: `request` entra num `Set`, e `requestfinished` ou `requestfailed` tiram dele (`e2e/acesso-suspenso.spec.ts:65-68`). Os ouvintes entram antes do `goto`, então nada escapa da contagem. A aba só é devolvida quando `expect.poll(...).toBe(0)` passa (`:71`), e isso inclui o `GET /v1/entregas?estado=pendente…`.
  - O atraso agora usa uma função que olha o `pathname` (`:60-64`), que é o que pega a URL com query string. Ele vale para todo GET da API.
  - Conferi o que pode disparar requisição depois do zero. Não há nada na Nova conversa nem na casca. O `refetchInterval` de `apps/web/src/api/execucoes.ts:32` só liga com um pedido no ar. A cópia de `consultaEntregasPendentes` em `CascaDaEscola.tsx:260` tem a mesma chave da Home e não abre segunda requisição. A releitura de 15 s de `atualizacao-dos-pedidos.ts` é da lista de pedidos da turma, não do Início.
- **"Causa" do documento, corrigida.** Agora diz quatro consultas, cita `Home.tsx` e registra que a hipótese foi revista duas vezes.
- **Recomendações da 1ª rodada, aplicadas.**
  - O comentário de `abrirSegundaAbaQuieta` (`:50-57`) acompanha a correção.
  - A mutação agora apaga a linha do `expect.poll`, que é o fechamento inteiro. O vermelho declarado é em `:208`, no título que não aparece: é o sintoma da corrida, então o motivo é o certo. O portão já provou isso.
  - O `TODO.md` ganhou a nota de que a hipótese foi revista duas vezes.
- **Cenários 3, 4 e 5:** as asserções sobre o resultado continuam as mesmas (`:208-224`).
- Não há `.skip`, teste comentado nem mock de código nosso: a rota só atrasa e segue para a API de verdade com `rota.continue()`. O prazo do teste não mudou, e a lentidão é imposta dentro do teste, não esperada da máquina.

Bloqueantes: nenhum.

Recomendações:
- **Zero de passagem.** O `expect.poll` pode ler zero no instante entre uma resposta e uma consulta que dependa dela. Hoje a Nova conversa dispara tudo na montagem, então isso não acontece. Se a tela ganhar uma consulta dependente, por exemplo com `enabled` ligado pelo resultado dos vínculos, vale exigir zero em duas leituras seguidas.
- **Prova de que o atraso pegou.** Nada no teste verde mostra que alguma leitura chegou a ficar a caminho. Hoje quem prova isso é só o vermelho da mutação. Um `expect` de que o `Set` teve mais de um item quando a saudação apareceu faria o teste verde provar sozinho que a lentidão forçada ainda pega as leituras.
- **Ouvintes presos.** Os ouvintes de `request` continuam ligados na aba depois que ela é devolvida. Não fazem mal, mas um `aba.off` ao lado do `unroute` deixa o auxiliar limpo para quem reaproveitá-lo.

Não rodei o e2e. A auditoria vem da leitura do diff entre as duas rodadas, de `e2e/acesso-suspenso.spec.ts` e das consultas e temporizadores de `apps/web`. Nenhum arquivo foi alterado.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/acesso-suspenso.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/correcoes/2026-10-17-duas-abas-do-acesso-suspenso.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/TODO.md
