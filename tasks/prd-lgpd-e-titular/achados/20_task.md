# Achados das revisões — `tasks/prd-lgpd-e-titular/20_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-10 19:41:48 · `tasks/prd-lgpd-e-titular/20_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** o 403 `ACESSO_SUSPENSO` na renovação deixa a aba `suspensa`, sem token e com o cache esvaziado uma vez. Vale para a aba que abre pelo cookie, para a aba com o token vencido e para a consulta que volta 401 e depois tem a renovação recusada. A tela mostra o texto do catálogo e o link "Ir para a entrada".
- **Casos de borda:**
  - Chromebook do carrinho: o colega entra na mesma aba, com o `/v1/eu` segurado, e não vê nada do anterior.
  - Professora suspensa na escola A e ativa na B.
  - O 401 que volta atrasado, depois de a aba ficar suspensa.
  - A renovação que estava no ar e volta 403 depois do "Sair".
  - A inatividade que vence na aba já suspensa.
  - O link clicado com uma sessão aberta.
  - O segundo F5 com o cookie já apagado.
  - Cancelada a eliminação, a mesma senha volta a entrar.
- **Permissão:** com a eliminação agendada, a senha certa mostra o texto e não abre sessão, tanto na entrada pela matrícula quanto no login por cima da segunda aba.
- **Isolamento:** suspensa em A, a professora entra em B pelo e-mail, sem A no seletor e sem o nome de A na tela.
- **Regra 80, item 6:** 5xx na renovação continua `indisponivel` e não desloga ninguém.
- **Concorrência:** duas abas; a renovação já pedida contra o "Sair"; o 401 atrasado contra a suspensão.

**Cobertos:** todos os cenários acima.
- `apps/web/src/api/sessao.test.ts`: 13 casos novos, e o arquivo inteiro passa (49 de 49).
- `e2e/acesso-suspenso.spec.ts`: 4 cenários nos projetos `chromebook` e `celular`, 8 de 8 verdes. Incluem acessibilidade, 360 px, teclado e o `history.length`.

Rodei as mutações e conferi cada uma contra a seção "Mutações" da tarefa. Todas ficaram vermelhas e nos testes que a tabela aponta:

| Cláusula removida | Testes vermelhos |
|---|---|
| `encerrarLocalmente` › `destino === 'suspensa' && estado === 'anonima'` | 1 |
| `abrirSessaoPeloCookie` › guarda do topo | 1 |
| `abrirSessaoPeloCookie` › guarda do `catch` | 5 |
| `renovarSessao` › `if (ehCodigo(erro, ACESSO_SUSPENSO)) suspenderSessao()` | 9 |
| `renovarSessao` › recusa em `suspensa` | 3 |
| `chamarComSessao` › recusa em `suspensa` | 1 |
| `chamarComSessao` › `durante === 'suspensa'` | 1 |
| `encerrarNaApi` › `ACESSO_SUSPENSO` | 3 |
| `sairDaSessaoSuspensa` › `if (estado === 'suspensa')` | 1 |
| A memória de quem estava apagada também em `suspensa` | 1 |
| `AcessoSuspenso.tsx` › `replace` do `Link` | e2e do aluno, 2 projetos (`history.length` 4 contra 3) |
| `AcessoSuspenso.tsx` › `onClick={sairDaSessaoSuspensa}` | e2e do aluno, 2 projetos (`toHaveURL(/\/entrar$/)` na linha 81) |

Restaurei `sessao.ts` e `AcessoSuspenso.tsx` por cópia de segurança, sem usar `git checkout`, porque os dois arquivos ainda não estão no commit. Conferi com `cmp` que ficaram iguais ao que eram, e o `git status` é o mesmo do início.

Não há `.skip` nem teste comentado. O e2e usa a API de verdade, sem `route.fulfill(403)`, como a tarefa pede. Conferi que `educa_sessao` é mesmo o nome do cookie (`apps/api/src/sessao/cookies.ts:4`), então a verificação de cookie da segunda aba não passa à toa.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Falta um teste de concorrência de verdade numa aba só: duas consultas em `Promise.all`, as duas com 401, e a renovação com 403. Ele provaria uma única renovação, `aoTrocarDeSessao` chamado uma vez e as duas consultas falhando sem refazer o pedido. Hoje isso fica coberto pelo teste de renovação única que já existia (`sessao.test.ts:226`) e pelo do 401 atrasado, que roda em sequência.
2. `e2e/acesso-suspenso.spec.ts:25` copia `INTERVALO_DA_ATIVIDADE_MIN = 5` em vez de importar a constante do relógio de inatividade. Se o intervalo mudar, o teste pode deixar de acionar o aviso de atividade e falhar pelo motivo errado.
3. `e2e/acesso-suspenso.spec.ts:125`: enquanto o `/v1/eu` está segurado, o `not.toContainText(anterior.nome)` passa assim que a página fica sem o nome. Ele prova o cache esvaziado porque a resposta está segurada, mas um comentário dizendo isso ajudaria quem ler depois.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/api/sessao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/api/sessao.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/paginas/AcessoSuspenso.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/rotas.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/acesso-suspenso.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/__fixtures__/sessao.ts`

## infra-guardian · 1ª rodada · APROVADO · 2026-10-10 19:42:34 · `tasks/prd-lgpd-e-titular/20_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/api/cliente-de-consultas.ts:16`, o `ACESSO_SUSPENSO` não está na lista de nova tentativa automática, e o `chamarComSessao` recusa em `suspensa` antes de qualquer `fetch`. Às 10h, a aba suspensa não manda nada à API. Hoje isso não está escrito em lugar nenhum. Vale um teste de unidade em `deveTentarDeNovo` com `ACESSO_SUSPENSO`, para que essa garantia não dependa só da lista fechada de códigos.
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/acesso-suspenso.spec.ts`, a prova de que a segunda aba não sobe ao servidor é a ausência do cookie `educa_sessao`. Contar as chamadas à renovação nessa aba deixaria explícito que o 401 dela não vira uma sequência de pedidos com o mesmo IP da escola.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-10 19:42:42 · `tasks/prd-lgpd-e-titular/20_task.md`

VEREDITO: APROVADO
Tela vista: sim (2 fotos lidas, computador 1366 px e celular 360 px; não existe escola vazia para esta tela, porque o estado não depende de dado da escola)
Estados: ok. É uma tela terminal e estática: não há carregando, vazio nem dado a mostrar, e o "erro" é a própria tela. `Protegida` (`apps/web/src/rotas.tsx`) só a mostra no estado `suspensa`.

Acessibilidade: ok.
- A mensagem usa `role="alert"` e há um único `h1`; o título da aba é "Acesso suspenso · Turmma".
- O link "Ir para a entrada" é o único alvo, alcançável por Tab, e Enter o aciona.
- O contraste do aviso é alto (`#8a3e0c` sobre `#fdf0e8`, o mesmo par de `SemDesafio`).
- O e2e roda `violacoesGraves` e `larguraExcedente`, e a spec cobre teclado e `toHaveTitle`.

Chromebook fraco: ok. A tela não tem imagem, lista, formulário nem chamada. Em `suspensa` nenhuma requisição sai da aba (`chamarComSessao` e `renovarSessao` recusam), o que protege a rede compartilhada. 5xx continua `indisponivel` e não desloga.

Celular: ok.
- Na foto de 360 px não há rolagem horizontal nem texto cortado.
- O botão tem `min-h-11` (44 px; na foto 88 px de altura a 2x) e é a única ação, sem hover nem atalho.
- O e2e roda nos projetos `chromebook` e `celular`, com `larguraExcedente` igual a 0.

Português e texto: ok.
- O texto vem do catálogo (`MENSAGENS_DE_ERRO.ACESSO_SUSPENSO`): "Seu acesso está suspenso a pedido. Fale com a coordenação da escola."
- Diz o que fazer, sem código nem termo técnico.
- Não mostra nome da pessoa nem da escola, o que protege o Chromebook do carrinho, e há teste para isso.
- Não há saída de IA na tela.

Pele (D72): ok. Usa os tokens existentes (`bg-pendente-cx`, `text-pendente`, `bg-caramelo`, `rounded-controle`) e a `CascaPublica`, igual a `SemDesafio.tsx`. Nenhum componente foi refeito de outro jeito. Não há mockup para a tela, e a tarefa declara isso.

Ação oficial protegida: sim (não se aplica). A tela não aprova, publica, exclui nem exporta nada, e "Ir para a entrada" só encerra a memória local da aba.

Bloqueantes: nenhum.

Observações de código:
- `AcessoSuspenso.tsx:24` escolhe o caminho de volta pelo papel: o aluno vai ao endereço da escola (ele não tem e-mail, então `/entrar` não serve a ele) e o resto vai à entrada da equipe. O e2e prova os dois casos.
- `AcessoSuspenso.tsx:31-35` troca a entrada do histórico (`replace`) e chama `sairDaSessaoSuspensa`, que só age em `suspensa`. Isso está provado por mutação.
- A foto confere com o código da árvore.
- Não rodei o e2e. O `test-engineer` registrou 8 de 8 verdes nos dois projetos e as mutações vermelhas.

Recomendações:
1. `AcessoSuspenso.tsx:27` e `SemDesafio.tsx`: o aviso usa o token semântico `pendente` para dizer "bloqueado". Não prejudica nada hoje, mas vale um token ou variante "aviso" quando houver uma terceira tela igual.
2. O texto "suspenso a pedido" é legível por quem olha a tela depois (colega do carrinho). É o texto do catálogo e foi uma escolha declarada na Tech Spec; fica para o `/validar` confirmar com a coordenação.
3. Do `test-engineer`:
   - `e2e/acesso-suspenso.spec.ts:25` copia o intervalo de inatividade em vez de importá-lo.
   - Falta um teste com duas consultas em `Promise.all`, ambas com 401, e a renovação com 403.
   - `e2e/acesso-suspenso.spec.ts:125` merece um comentário dizendo que o `/v1/eu` segurado é o que prova o cache esvaziado.

Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/paginas/AcessoSuspenso.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/rotas.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/api/sessao.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/acesso-suspenso.spec.ts`.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-10 19:42:48 · `tasks/prd-lgpd-e-titular/20_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. A tarefa só muda a web e as peças de apoio do e2e. Na memória da aba ficam `usuarioId`, `papel` e `escolaSlug` (`apps/web/src/api/sessao.ts:115`, mantidos em `suspensa` pela linha 318). Eles já existiam e não aparecem na tela. O único reflexo visível é o slug da escola no `href` do link, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/paginas/AcessoSuspenso.tsx:20`. O e2e só lê e escreve `usuario.eliminacao_agendada_em`, que a 14.0 criou.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: não se aplica, porque a tarefa não cria rota nem endpoint. Quem decide a recusa é a API, com o 403 `ACESSO_SUSPENSO` da 14.0. A web não faz nenhuma chamada em `suspensa` (`sessao.ts:409`, `sessao.ts:450`, `sessao.ts:432`), e os testes provam isso (`sessao.test.ts`, "suspensa, nenhuma chamada sai da aba…").

Logs: limpos. O diff não acrescenta nenhum `console` ou logger.

Auditoria: não se aplica. A tarefa não lê dado de aluno pela coordenação, não exporta e não altera nota nem permissão. O registro do pedido e o agendamento são da 14.0 e da 16.0.

Envio externo: nenhum.

Seed/fixture: sintético. Os e2e usam `criarAlunoComMatricula`, `criarEquipeComSenha` e `criarUsuarioEmOutraEscola` ("Professora sintética na outra escola"). O teste de unidade usa `camila@escola.test`. As funções `agendarEliminacaoNoBanco` e `cancelarEliminacaoNoBanco` (`e2e/__fixtures__/sessao.ts:315` e `:326`) só gravam a marca, filtrando pelo id.

O que vi nas fotos (`.processo/vitrine/acesso-suspenso-chromebook.png` e `.processo/vitrine/acesso-suspenso-celular.png`):
- A tela mostra o título, o texto do catálogo ("Seu acesso está suspenso a pedido. Fale com a coordenação da escola.") e o link "Ir para a entrada".
- Não aparece nome, matrícula, escola, turma nem resquício da área anterior. Isso bate com `AcessoSuspenso.tsx:19-31`.
- No Chromebook do carrinho, quem senta em seguida não fica sabendo quem estava ali. O e2e prova isso: `acesso-suspenso.spec.ts`, cenário "recomeço no Chromebook do carrinho", com o `/v1/eu` segurado, e as asserções `not.toContainText(aluno.nome / escolaNome)`.
- O cache é esvaziado uma vez na suspensão (`sessao.ts:322`), e o link troca a entrada do histórico (`replace`). Assim o Voltar não remonta a área da pessoa anterior, e o e2e prova pelo `history.length`.
- Na 2ª aba, a senha certa não recria o cookie `educa_sessao` (`acesso-suspenso.spec.ts`, cenário "duas abas").

Pergunta de fechamento: o que o sistema guarda e para onde enviou é resposta da trilha da 14.0 a 18.0, e esta tarefa não a muda. Aqui não se coleta, não se envia e não se guarda nada novo.

Bloqueantes: nenhum.

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/paginas/AcessoSuspenso.tsx:11` diz que a tela "não leva o nome da pessoa nem a escola dela", mas o `href` do aluno é `/e/<slug>`, que identifica a escola. Não é vazamento: é o endereço público de entrada, o mesmo que fica na barra do navegador no login, e quem está no computador é da mesma escola. Vale ajustar o comentário para "nem o nome da escola na tela", para que ninguém, mais adiante, leia isso como garantia de que o slug não aparece.
2. Em `suspensa`, a memória `quemEstaNaAba` (id, papel e slug) continua na aba até o clique no link ou até a próxima entrada sobrescrevê-la por `lembrarQuemEsta`. É o mínimo necessário para escolher o caminho de volta, e não é exibida. Se um dia ela passar a carregar mais coisas (nome, por exemplo), esse prazo de vida deixa de ser inofensivo. Fica registrado para o `/retro`.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-10 19:42:53 · `tasks/prd-lgpd-e-titular/20_task.md`

VEREDITO: APROVADO

Escopo: respeitado. As quatro subtarefas estão feitas, e os arquivos alterados são os previstos, mais os de processo. A tarefa não toca a API, as telas da coordenação nem a segunda aba.

Aderência à Tech Spec: ok.
- O desenho bate com a `techspec.md` §9, "Login suspenso":
  - o `ACESSO_SUSPENSO` é tratado num lugar só, em `renovarSessao`;
  - a aba passa ao estado `suspensa`, sem token e com o cache esvaziado;
  - `Protegida` mostra a tela;
  - o link vai para `/e/<slug>` quando quem estava era aluno e para `/entrar` no resto;
  - 5xx continua `indisponivel`.
- A divergência que a tarefa declara está registrada nos três lugares exigidos: no `N_task.md`, no item "Como ficou no código (tarefa 20.0)" da `techspec.md` §9 e nas duas linhas novas do `cenarios.md`, RF14. A divergência é a barreira que impede a aba `anonima` de voltar a `suspensa`, a recusa sem chamada à API em `suspensa` e o link com `replace`.
- As duas fotos (1366 px e 360 px) mostram o que a spec descreve: o título "Acesso suspenso", o texto do catálogo, o link "Ir para a entrada", e nada de "Tentar de novo", campo, nome ou escola.

Portão local: carimbo válido. O `conferir` respondeu "portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)".

Bloqueantes: nenhum. Conferi os caminhos de concorrência em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/api/sessao.ts`, e todos fecham:
- a renovação que estava no ar e volta 403 depois do "Sair";
- o 401 atrasado depois da suspensão;
- a inatividade que vence na aba suspensa;
- o "Sair" na aba suspensa;
- duas consultas que esperam a mesma renovação.

Também não sobrou `.skip`, `any` nem `TODO`.

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/paginas/AcessoSuspenso.tsx:28-36` repete o link de `SemDesafio.tsx`: as mesmas classes e o mesmo texto. Duas saídas: `SemDesafio` passa a receber o destino e o `onClick`, ou o botão-link vira um componente comum. Hoje são duas cópias do mesmo estilo para manter.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/acesso-suspenso.spec.ts:25` repete o `INTERVALO_DA_ATIVIDADE_MIN = 5` em vez de importar a constante do relógio de inatividade. Se o intervalo mudar, o teste falha pelo motivo errado. O `test-engineer` já tinha apontado.
3. `AcessoSuspenso` lê `quemEstaNaSessao()` direto na renderização, sem assinar a sessão. Hoje funciona porque essa memória não muda enquanto a aba está `suspensa`. Vale um comentário curto dizendo que isso é de propósito.

## test-engineer · 2ª rodada · APROVADO · 2026-10-10 19:48:50 · `tasks/prd-lgpd-e-titular/20_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 1ª rodada, para a tela "Acesso suspenso" e o estado `suspensa` da sessão. Nesta rodada conferi só o que mudou: as duas recomendações que a Mesa mandou aplicar e se o teste novo de concorrência prova o que diz provar.

Cobertos:
- **O caso de concorrência entrou e é concorrência de verdade.** O teste está em `apps/web/src/api/sessao.test.ts:710-724`. As duas consultas saem juntas por `Promise.all`, não uma depois da outra. A asserção sobre a ordem das chamadas (`['/v1/a', '/v1/b', CAMINHO_DA_RENOVACAO]`) mostra que os dois pedidos saíram antes da renovação. Se as chamadas fossem em sequência, a segunda nem sairia, porque a aba já estaria suspensa. O teste confere o resultado, e não só que o código rodou: as duas recebem `ACESSO_SUSPENSO`, a aba fica `suspensa`, o cache é esvaziado uma vez e a renovação sai uma vez. Nenhum mock esconde a regra: o duplo da rede é o mesmo `responderCom` dos outros testes. O arquivo passa inteiro (50 de 50).
- **O comentário sobre o `/v1/eu` segurado** está em `e2e/acesso-suspenso.spec.ts:125-126`. Ele explica por que a asserção do nome de quem saiu prova que o cache dele não ficou na tela.
- **`apps/web/src/paginas/AcessoSuspenso.tsx`:** a mudança é só comentário, sem efeito em comportamento nem em teste.
- **`TODO.md`:** entraram três itens, cada um com dono. A recomendação recusada (importar o intervalo de atividade) tem o motivo registrado em "Recomendações sem aplicar" da tarefa e no `TODO.md`. Aceito.
- **A cláusula `durante === 'suspensa'`** em `apps/web/src/api/sessao.ts:502` não é provada pelo teste novo, porque ali a segunda resposta 401 chega antes do 403 da renovação. Mas ela já tem linha própria na seção "Mutações" (`20_task.md:96`), apontando para o teste "o 401 que volta atrasado, depois de a aba ficar suspensa…". Não fica sem teste.

Não rodei mutação em `apps/web/src/api/sessao.ts`. O arquivo tem mudanças desta tarefa ainda não commitadas, e o `git checkout --` para desfazer a mutação apagaria a implementação. Fiz a análise da cláusula acima lendo o código.

Bloqueantes: nenhum.

Recomendações: nenhuma nova.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-10 19:49:25 · `tasks/prd-lgpd-e-titular/20_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum
Recomendações:
- A recomendação que a Mesa mandou aplicar foi feita. O comentário está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/paginas/AcessoSuspenso.tsx:24-25`. O ajuste do comentário sobre a escola no `href`, das linhas 14 a 16, também confere com o código: a tela mostra só o texto do catálogo e o link.
- O caso novo de concorrência fica em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/api/sessao.test.ts:710-725`. Ele prova mesmo a regra. As duas consultas esperam a mesma `renovacaoEmAndamento`, de `sessao.ts:439`. Se cada uma renovasse por conta própria, a lista de chamadas teria duas renovações e não bateria. Se o esvaziamento rodasse duas vezes, o contador `limpezas` passaria de 1 e o teste também falharia.
- Ajuste opcional de redação: o comentário em `AcessoSuspenso.tsx:24` diz que a memória "não muda até o clique no link". Ela também muda se alguém entrar de novo na mesma aba por uma rota pública, que passa por `sessao.ts:263`. Isso não esconde bug, porque nesse caso a aba sai de `suspensa` e a tela deixa de ser montada. Se quiserem precisão, troquem "até o clique no link" por "enquanto a aba está `suspensa`".
- Os três itens novos no `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/TODO.md:417-424` têm dono e origem. Nada a acrescentar.
