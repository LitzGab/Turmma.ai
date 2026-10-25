# Achados das revisões — `tasks/prd-telas-do-aluno-e-primeiro-acesso/7_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-25 13:52:24 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/7_task.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas, em /aluno/eu: computador e celular, escola cheia e vazia). O estado "aluno sem turma no ano" não tem foto e foi revisado pelo código e pelo teste de componente.
Estados: ok. Carregando, vazio, erro e com dado foram conferidos pelo código (`ComoEstouIndo.tsx:27-30`) e pelos testes de `Eu.test.tsx`; o vazio aparece nas fotos.
- O erro da seção usa `EstadoErro` com "Tentar de novo" e não derruba o cartão da turma.
- Aluno sem turma (`NAO_ENCONTRADO`) vira "Nada corrigido ainda", sem erro (`memoria-do-tutor.ts`).
Acessibilidade: ok.
- A seção é `region` nomeada pelo título.
- O carregando é `status` e o erro é `alert`.
- A barra é `aria-hidden` e o número "N de M certas" está escrito. A cor é neutra e o estado não depende de cor.
- O e2e roda `violacoesGraves` nos três casos.
Chromebook fraco: ok.
- Uma leitura só, com `staleTime` de 5 minutos e sem releitura ao voltar para a aba.
- O teto da API é 50 itens, então não precisa de virtualização.
- Não há imagem nem upload nesta tela.
Celular: ok.
- A foto de 360 px não tem rolagem lateral, o texto quebra bem e "Privacidade" e "Sair" são linhas de ~44 px.
- No rodapé da foto do celular cheio, a barra inferior fixa cobre a linha "Achou algo errado?". É efeito da captura de página inteira com barra fixa: o `main` tem `pb-[calc(var(--barra-baixo)+2rem)]` (`CascaDaEscola.tsx:260`), então não é defeito.
- O e2e de 360 px mede a largura excedente e a altura mínima de 44 px.
- Nada depende de hover.
Ação oficial protegida: sim. A tela só lê; não há ação oficial nela.
- Nada de colega, média, posição ou sequência aparece.
- Os `sinais` do Tutor são descartados na `queryFn` e nunca chegam ao cache (testado em `Eu.test.tsx`).
- O trabalho sem resultado não aparece, nem a contagem dele (regra 70, item 3).
- Não há "nota" nem limiar calculado na web (D46, D66).
- A contestação ("Achou algo errado? Fale com quem dá a aula.") está presente (regra 70, item 4d).
- O cache é esvaziado na troca de sessão (`main.tsx:31`).
- O e2e prova que `localStorage`, `sessionStorage`, IndexedDB e Cache Storage ficam vazios e que a resposta atrasada do aluno anterior não aparece.
Bloqueantes: nenhum.
Recomendações:
- `ComoEstouIndo.tsx:33` e `Eu.tsx:44,52` usam `border border-linha` (1 px). A linha "Privacidade e Sair" usa `border-2 border-borda`, e `Atividades.tsx` também usa 2 px. As fotos mostram os dois pesos de borda lado a lado em Eu. O 1 px do cartão da turma vem da 2.0 e já estava lá, então não é regressão desta tarefa. Vale alinhar com a pele da D80 (borda de 2 px) numa tarefa de acabamento.
- A tela cheia a 1366×768 passa da janela por 54 px (822 px). A lateral é fixa e o corpo rola, o que é normal para uma página de leitura com até 50 itens. O mockup §2.5 diz "cabe em 1440 × 780", mas isso vale para a demonstração com poucos assuntos, então não bloqueia.
- O cartão de vazio ("Nada corrigido ainda") não tem a onça `apontando` que o mockup §2.5 desenha. A tarefa 7 a exclui expressamente ("onça no vazio" em "Fora do escopo"); fica registrado para a validação.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-25 13:52:49 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/7_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo foi criado. A tela de Eu passa a mostrar ao próprio aluno o que ele mesmo fez, já lido de `GET /v1/tutor/memoria`, rota que existia antes desta tarefa: o título da tarefa, os acertos e o total, e as habilidades a rever (código BNCC e descrição). Não há migration, não há campo novo na tabela, e o contrato da API não mudou.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. A rota não recebe id nenhum. Escola, ano e aluno vêm do token. Pela matriz `packages/shared/src/permissao/matriz.ts:352`, `tutor.ler_memoria` vale só para o próprio aluno (`proprio`), e rede, coordenador e professor ficam em `nunca` (linhas 226, 268 e 310, conferidas em `matriz.expectativa.ts`). Trocar o id não se aplica aqui, porque não há id para trocar. O aluno sem turma recebe `NAO_ENCONTRADO`, que a web trata como lista vazia, sem confirmar nada a ninguém (`apps/web/src/api/memoria-do-tutor.ts:39`).

Logs: limpos. O diff não acrescenta nenhuma linha de log.

Auditoria: não se aplica. É o próprio aluno lendo o que é dele. Não há leitura por coordenação ou rede, nem exportação, nem alteração de nota ou de permissão.

Envio externo: nenhum. Não há chamada a provedor de IA, então não há o que registrar em `ExecucaoAgente`.

Seed/fixture: sintético. `e2e/__fixtures__/memoria-do-aluno.ts` e o ajudante de `Eu.test.tsx` usam UUID aleatório ou fixo e títulos inventados ("Lista sintética de reações"). O caso novo em `apps/api/src/tutor/tutor.int.test.ts:968` cria o aluno pelos helpers da bancada. Nas fotos aparecem só a escola, a turma e o aluno da vitrine, com sufixo aleatório ("Aluno Sintético Caio 5627bb8a").

O que conferi:
- **Coleta:** nenhum campo proibido ao aluno, e nenhum diagnóstico. Só aparecem a habilidade BNCC e os acertos, que é trabalho do aluno, nunca a pessoa (D66).
- **Exposição:**
  - O cache recebe só `TrabalhoCorrigido[]`. O filtro está na `queryFn`, e não no `select`, então os `sinais` não chegam ao cache. O teste `Eu.test.tsx` ("os sinais do Tutor não vão à tela nem ao cache") prova isso varrendo o cache em busca de `resposta_pronta`.
  - O trabalho sem correção aprovada não aparece, nem a contagem dele (regra 70, item 3). Há uma mutação que prova isso.
  - Quando a sessão troca, o cache inteiro é esvaziado (`apps/web/src/main.tsx:31`, `resetQueries`).
  - O e2e `e2e/aluno-eu.spec.ts:60-66` prova que `localStorage`, `sessionStorage`, IndexedDB e Cache Storage ficam vazios.
  - O e2e `e2e/aluno-eu.spec.ts:98` prova que, quando um aluno sai e o seguinte entra no mesmo computador, a resposta atrasada do anterior não aparece.
- **Fotos:**
  - `aluno--aluno-eu--computador.png` e `aluno--aluno-eu--celular.png` mostram só a turma, a série e a escola do próprio aluno, e duas tarefas com "N de M certas" e as habilidades a rever. Não aparece colega, média, posição, professor nem matrícula.
  - `vazia--aluno--aluno-eu--computador.png` e `vazia--aluno--aluno-eu--celular.png` mostram o vazio "Nada corrigido ainda" e nenhum outro dado.
  - O nome do aluno que aparece na lateral vem da casca e já existia antes desta tarefa. Em todas as fotos, o que a tela mostra bate com o que o DTO promete.
- **Aluno transferido:** o caso novo em `tutor.int.test.ts:968` mostra que a memória continua sendo do aluno dentro do ano, e não da turma. Ele não ganha acesso a nada de outra turma, só ao trabalho dele mesmo. O corte da virada do ano segue pelo `anoLetivoId`, que já tem teste.
- **Pergunta de fechamento:** o diff não cria lugar novo onde dado do aluno fica guardado, nem destino novo para onde ele vai. A resposta à secretaria continua a mesma de antes desta tarefa.

Bloqueantes: nenhum.

Recomendações:
- Hoje a resposta de `/v1/tutor/memoria` leva os `sinais` até o navegador do aluno, e a web só os descarta. Isso é aceitável: o dado é do próprio aluno, e a D66 diz que ele vê o que o Tutor sabe. Quando o F9 desenhar a tela "O que o Tutor lembra", vale decidir se a API manda os `sinais` só para essa tela, para levar o mínimo de dado até o navegador. Destino sugerido: `TODO.md` ou a spec do F9.
- `Eu.test.tsx` repete o ajudante da fixture do e2e. A divergência está registrada e justificada. Se um dia a fixture puder ser compartilhada (por exemplo, num pacote de fixtures sem `node:crypto`), uma cópia só evita que as duas se separem.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/api/memoria-do-tutor.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/ComoEstouIndo.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/Eu.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/aluno-eu.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/__fixtures__/memoria-do-aluno.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/api/src/tutor/tutor.int.test.ts

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-25 13:52:52 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/7_task.md`

VEREDITO: APROVADO
Tabelas verificadas: nenhuma nova. A tarefa não tem migration nem tabela nova. A consulta afetada lê `tentativa_atividade`, `atividade_aplicada`, `artefato`, `entrega` e `correcao`, e cada uma já tem `escolaId` e `anoLetivoId`, inclusive nos joins.
Queries verificadas:
- `TutorDoAlunoRepository.trabalhos` (/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/api/src/tutor/tutor.repository.ts:417-440): a escola, o ano e o aluno vêm de `#aluno()` (linha 125), que lê o contexto e a sessão. Nenhum parâmetro vem do cliente.
- `turmaDoAluno` (linha 136): mesmo escopo.
- `GET /v1/tutor/memoria` (tutor.controller.ts:46): não recebe parâmetro, nem `escolaId` no corpo ou na query.
- Web: /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/api/memoria-do-tutor.ts não manda `escolaId`. O cache fica só em memória e é zerado pelo `resetQueries` na troca de sessão (`main.tsx:32`). Aluno sem turma recebe a mesma resposta de "não encontrado", sem dizer se o dado existe.
- A API não mudou.
Teste de isolamento: presente e efetivo
- O caso "aluno transferido" (/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/api/src/tutor/tutor.int.test.ts:968) prova que a memória é do aluno no ano, e não da turma. A mutação declarada, que filtra pela turma do vínculo, deixa o teste vermelho.
- Sem a cláusula do aluno, o `toEqual` exato quebraria, porque outros alunos da escola A têm tentativas gravadas nos casos ao lado.
- A virada de ano continua coberta pelo caso existente "o ano letivo anterior", e o colega pelo caso "é só a dele" (linha 657).
Bloqueantes: nenhum
Recomendações:
- Hoje, tirar só `eq(tentativaAtividade.escolaId, escolaId)` em `trabalhos` não quebra nenhum caso, porque o `alunoId` é UUID único em todas as escolas. Isso não vem desta tarefa. Fica registrado para a retro: um caso com aluno de mesmo id em outra escola não é possível, então a defesa da escola em `trabalhos` depende só da revisão.
- Em /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/aluno-eu.spec.ts:98 ("aluno seguinte no mesmo computador"), vale conferir que a asserção cobre também o conteúdo de "Como estou indo" do primeiro aluno, e não só o nome da turma.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-25 13:52:58 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/7_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/api/memoria-do-tutor.ts`: a tarefa só lê da API e não muda nenhum endpoint. A tela agora chama `GET /v1/tutor/memoria`, que já existia, e com isso o endpoint passa a ter tráfego toda vez que o aluno abre Eu. O controle de carga está certo para isso. A leitura vale por 5 minutos e não se repete quando o aluno volta à aba (`staleTime: 5 * 60_000`, `refetchOnWindowFocus: false`). O limite de requisições é por usuário e por escola, pelo `sub` e pelo `esc` do token (`GuardaDeLimite`, em `apps/api/src/app.module.ts:147`). A consulta tem escopo de escola, ano e aluno e volta no máximo 50 itens (`apps/api/src/tutor/tutor.repository.ts:417-440`). Recomendo incluir `/aluno/eu` no cenário de rajada do teste de carga quando ele for revisto. Para esta tarefa não é exigência, porque Eu não fica no caminho quente da manhã de segunda.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/api/src/tutor/tutor.service.ts:426`: a resposta continua trazendo os `sinais` pela rede, e a web só os descarta antes de guardar no cache. Uma variante da rota só com `trabalhos` reduziria a carga e o que fica exposto no navegador. Isso fica para o F9, junto da tela "O que o Tutor lembra", e não bloqueia.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 13:53:42 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/7_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A tarefa só lê `GET /v1/tutor/memoria` e não toca na API, em seed, job, importação nem webhook. O único arquivo da API no diff é um teste de integração que grava pelos helpers de sempre (`lancarLote(..., 'aprovada')`). Todos com autor humano? Sim, porque não há escrita nova.

Decisão autônoma sobre aluno: ausente. "Como estou indo" mostra "N de M certas" e as habilidades a rever como a API mandou. A tela não tem limiar, nem "Vale revisar", nem encaminhamento. Isso está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/ComoEstouIndo.tsx:77-91` e é provado em `Eu.test.tsx` ("as habilidades a rever vêm como a API mandou", com `not.toMatch(/vale revisar|%/i)`).

Aprovação registrada: ok.
- **Na API:** o `resultado` só existe com lote `lote_de_correcao` no estado `aprovada`, pelo join em `apps/api/src/tutor/tutor.repository.ts:434`. Antes disso vem `null`, e `tutor.int.test.ts:638` e `:655` cobrem esse caso.
- **Na web:** a tela tira os trabalhos ainda sem aprovação dentro da `queryFn` (`apps/web/src/api/memoria-do-tutor.ts:18`). O teste "só a correção aprovada" mostra que o título e a contagem do trabalho pendente não aparecem. "Só trabalho sem aprovação" mostra que, nesse caso, a seção mostra o vazio e não uma lista.
- **Origem da correção:** é de questão objetiva e vem do gabarito (`correcao.service.ts:68`). Nenhuma discursiva ou redação chega a esta tela (D55).
- **Exceção do tutor:** a exceção da D47 não foi usada fora do tutor.

Supervisão do tutor: ok, sem lacuna nova. A tarefa não cria uso do tutor. Os `sinais` (onde o aluno travou) saem antes de entrar no cache. O teste "os sinais do Tutor não vão à tela nem ao cache" confere o conteúdo do cache e o texto da página. O e2e confere que `localStorage`, `sessionStorage`, IndexedDB e Cache Storage ficam vazios.

Autonomia declarada e visível: sim, e a tarefa não mexe nela.

Supervisão não é vigilância (item 7): ok. A tela não infere nada do aluno. Não mostra colega, média, posição, sequência de dias nem pontos (teste RF10, que também confere que a tela só chama `/v1/minha-turma` e `/v1/tutor/memoria`).

Sem nota em discursiva e redação (D55): ok. Os textos da tela nunca dizem "nota" (`como-estou-indo.test.ts`). O resultado mostrado é de objetiva aprovada.

Medir o professor (D45): fora do escopo, e nada foi tocado.

O que as fotos mostram:
- **`aluno--aluno-eu--computador.png`:** só aparecem tarefas corrigidas, com "1 de 4 certas" e "3 de 4 certas", barras de cor neutra e "Para rever" com código e descrição. A linha de contestação está visível. Não há nota, conceito nem comparação com a turma.
- **`vazia--*`:** o vazio diz que a correção aparece "Depois que quem dá a aula aprovar". O aluno fica sabendo que existe uma pessoa no caminho.
- **Sair:** está à mão em todas as fotos, tanto na linha de Eu quanto na casca (D59).

Bloqueantes: nenhum.

Recomendações:
1. O item de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/TODO.md:1489` ("O aluno não vê nem contesta o que o Tutor sabe") está desatualizado. Eu agora mostra o resultado aprovado e tem a linha "Achou algo errado? Fale com quem dá a aula." O que falta ainda é mostrar os `sinais` e as sessões, com contestação de verdade, que fica para o F9 (D66, regra 70 item 4d). Vale reescrever o item com essa diferença para ele não parecer resolvido nem parecer intocado.
2. Em `aluno--aluno-eu--celular.png`, a linha de contestação ("Achou algo errado?…", produzida em `apps/web/src/areas/aluno/ComoEstouIndo.tsx:95`) aparece coberta pela barra de baixo. Pode ser só efeito da captura de página inteira com a barra fixa. Como esse é o único caminho de contestação até o F9, vale o `frontend-reviewer` confirmar que, rolando até o fim no celular, a linha fica legível e não escondida.
3. A fixture da vitrine cheia junta "Cinemática: lista sintética" com habilidades de química (QUI.EM.06 e QUI.EM.05). Não afeta a regra 70, mas confunde quem vê a demonstração. Fica a cargo de quem cuida da fixture da vitrine.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/api/memoria-do-tutor.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/ComoEstouIndo.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/como-estou-indo.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/Eu.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/api/src/tutor/tutor.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/api/src/tutor/tutor.repository.ts` (lido, não alterado)
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/aluno-eu.spec.ts`

## test-engineer · 1ª rodada · APROVADO · 2026-10-25 13:53:44 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/7_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** a tarefa corrigida aparece com "N de M certas" e as habilidades a rever, na ordem da API.
- **Bordas:** só a correção aprovada aparece. Só trabalho pendente dá o vazio. Aluno sem turma no ano. Aluno transferido no mesmo ano. Virada de ano: o bloco existente "o ano letivo anterior" continua cobrindo, e a API não mudou.
- **Privacidade e isolamento:** os sinais não vão à tela nem ao cache. Nenhum dado de colega aparece (RF10), e a rede só chama a turma e a memória. O armazenamento do navegador fica vazio. Quando o aluno seguinte entra no mesmo computador, a resposta atrasada do anterior não aparece.
- **Estados:** os quatro estados, sem derrubar o cartão da turma. Tela de 360 px. A leitura dura 5 minutos e não é refeita ao voltar para a aba.
- **Concorrência:** não se aplica, porque é só leitura. Permissão e isolamento da API vêm dos testes de `/v1/tutor/memoria` que já existiam, e esta tarefa não altera a API.

**Cobertos:** cada linha da tabela tem o seu teste, citado pelo nome.
- **"só correção aprovada":** `Eu.test.tsx` › "só a correção aprovada". Confere uma linha só na lista, o título da pendente ausente do `body`, e nenhum "Para rever" vazio.
- **"sinais fora":** › "os sinais do Tutor não vão à tela nem ao cache". Usa `getQueryData` e varre o cache inteiro atrás de `resposta_pronta`.
- **"nada de colega":** › "nada de colega, média, posição…". Varre o texto da tela e confere a lista exata de caminhos chamados na rede.
- **"quatro estados":**
  - carregando: › "carregando: o rótulo dele"
  - vazio: › "só trabalho sem aprovação" e o vazio com `MEMORIA_VAZIA` no caso "Sair"
  - erro: › "erro: 'Tentar de novo' na seção", com o cartão da turma ainda na tela e a lista voltando quando a API volta
  - com dado: › "com dado: a turma…", que também confere a ordem cartão, "Como estou indo", linhas
- **"sem turma no ano":** › "o aluno sem turma no ano".
- **"aluno transferido":** `apps/api/src/tutor/tutor.int.test.ts:968`, no bloco "isolamento". O caso aprova a tarefa, confere a memória, chama `transferir` (que encerra o vínculo antigo e cria o da outra turma) e confere a mesma memória de novo.
- **"armazenamento vazio":** `e2e/aluno-eu.spec.ts:38`, que confere `localStorage`, `sessionStorage`, IndexedDB e Cache Storage.
- **"recomeço da tela":** `e2e/aluno-eu.spec.ts:98`.
- **"360 px":** `e2e/aluno-eu.spec.ts:158`, com `larguraExcedente` igual a 0 e "Privacidade" e "Sair" com pelo menos 44 px.

**Mutações:**
- Cada cláusula nova tem o seu bloco. Em `memoria-do-tutor.ts`: o filtro de `resultado`, o `NAO_ENCONTRADO` nos dois sentidos, o `staleTime` e o `refetchOnWindowFocus`. Em `ComoEstouIndo.tsx`: `isPending`, `isError`, o vazio e `aReforcar.length`. Em `Eu.tsx`: o `<ComoEstouIndo />`.
- O 11º bloco, em `tutor.repository.ts`, não muda o repository. Ele mostra que o caso novo de integração pegaria um filtro por vínculo na turma atual.
- Não há `.skip`, teste comentado, nem mock que esconda a regra. Não há chamada a IA.
- Rodei `Eu.test.tsx` e `como-estou-indo.test.ts`: 17 de 17 passam. O de integração e os e2e não rodei, porque precisam do ambiente. O portão já os rodou.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Comentário da fixture desatualizado:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/__fixtures__/memoria-do-aluno.ts:7` diz "Serve ao teste de componente e ao e2e". Pela divergência registrada, o teste de componente usa um ajudante próprio. O comentário deveria dizer que serve só ao e2e.
2. **Espera de 50 ms em `Eu.test.tsx`:** o caso "a leitura dura 5 minutos" espera 50 ms reais para dizer que nenhuma releitura saiu. O teste não fica vermelho à toa, mas com a máquina ocupada a mutação de `refetchOnWindowFocus` pode passar despercebida. É mais firme conferir logo depois do `setFocused(true)`, sem esperar: `cliente.getQueryState(CHAVE_DA_MEMORIA_DO_TUTOR)?.fetchStatus` deve ser `'idle'`.
3. **Recomeço com a memória já no cache:** em `e2e/aluno-eu.spec.ts:98`, a leitura do primeiro aluno nunca chega antes do "Sair". Assim, o caso mais provável de vazamento não está coberto: a memória do primeiro já guardada no cache quando o segundo entra. Hoje o cache sem limpeza seria pego de outro jeito (a tela do segundo ficaria em carregando para sempre), mas um caso com a leitura do primeiro já entregue antes do "Sair" provaria a limpeza pela regra direta.
4. **Mutação do filtro de `resultado`:** o bloco que troca `!== null` por `!== undefined` com `as never` deixa o teste vermelho porque o componente quebra ao ler o `resultado` nulo, e não porque a pendente aparece na tela. O teste em si está certo: confere uma linha só e a pendente ausente do `body`. Vale anotar na retro que essa mutação não imita a regressão real.
5. **`sairPelaCasca` repetido:** a função existe igual em `e2e/aluno-eu.spec.ts` e em `e2e/minha-turma.spec.ts`. Poderia ir para `e2e/__fixtures__/casca.ts`, mas essa fixture é compartilhada com a 3.0, que corre junto, então a mudança fica para depois do encontro das linhas.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-25 13:53:46 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/7_task.md`

VEREDITO: APROVADO

Escopo: respeitado. As subtarefas 7.1 (consulta da memória com o filtro na `queryFn`, os `sinais` descartados antes do cache, `NAO_ENCONTRADO` tratado como vazio, 5 min e `refetchOnWindowFocus: false`), 7.2 (as tarefas corrigidas, "N de M certas", `aReforcar` na ordem da API, o vazio e a contestação com o texto da tarefa, a ordem cartão → "Como estou indo" → linhas) e 7.3 foram feitas. "Ajustes", "Rever a introdução", "Vale revisar", matéria e onça ficaram de fora. `api/tutor.ts` e `e2e/__fixtures__/aluno.ts` não foram tocados.

Aderência à Tech Spec: ok. Bate com a §7b (só `resultado` não nulo, `aReforcar` como veio, `sinais` fora) e com a §9 (`tutor/memoria` com 5 min e `false`, `NAO_ENCONTRADO` como "sem resultado"). O caso do aluno transferido segue a decisão A do Joaquim, que está no `prd.md` §7 pelo commit `9e44543f`, na branch da spec. Neste checkout da linha, o `prd.md:84` ainda diz o contrário ("não aparece em Eu, como hoje"), porque `9e44543f` ainda não entrou aqui. Isso se acerta quando a linha se junta à spec e não é divergência silenciosa. A primeira divergência (o ajudante dentro de `Eu.test.tsx` no lugar da fixture do e2e) só se afasta do "Como testar" da própria tarefa. Ela não toca a arquitetura e está justificada pelo `tsc` da web.

Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)").

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/__fixtures__/memoria-do-aluno.ts`: o comentário do topo diz "Serve ao teste de componente e ao e2e", mas o teste de componente não importa essa fixture (é a primeira divergência registrada). O comentário deve dizer que ela serve só ao e2e.
- `sairPelaCasca` está duplicada em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/minha-turma.spec.ts:33` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/aluno-eu.spec.ts:29`. A entrada por matrícula pela API (`POST /v1/sessao/matricula`) está escrita à mão nos dois specs. As duas devem ir para `e2e/__fixtures__/casca.ts`, ao lado do `entrarPelaApi`, que hoje só faz a entrada por e-mail.
- `e2e/minha-turma.spec.ts`, caso "recomeço": a entrada do primeiro aluno passou da tela para a API por causa do prazo do caso. Isso vai além de "muda só o que o cartão ganha em volta", mas não enfraquece o que o caso prova, que é sobre o segundo aluno. Vale uma linha na tarefa explicando a troca.
- O teto de 50 da API conta também os trabalhos ainda sem correção aprovada. Um aluno com muitos envios pendentes vê menos de 50 tarefas corrigidas. Isso é da spec e não da tarefa; fica registrado para o F9.
- Foto `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/.processo/vitrine/aluno--aluno-eu--celular.png`: a barra de baixo cobre a linha "Achou algo errado?" na captura da página inteira. Pode ser só efeito da captura, e a qualidade visual é do `frontend-reviewer`.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/api/memoria-do-tutor.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/ComoEstouIndo.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/como-estou-indo.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/Eu.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/Eu.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/api/src/tutor/tutor.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/aluno-eu.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/minha-turma.spec.ts`

## test-engineer · 2ª rodada · APROVADO · 2026-10-25 14:02:03 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/7_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 1ª rodada (aprovada), sem mudança. Esta rodada pedia só as duas recomendações que a ordem de correção mandou aplicar.

Cobertos:
- **Comentário da fixture** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/e2e/__fixtures__/memoria-do-aluno.ts:7`): feito. O comentário agora diz "Serve só ao e2e (`aluno-eu.spec.ts`)" e aponta a divergência registrada.
- **Espera de 50 ms** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l2/apps/web/src/areas/aluno/Eu.test.tsx:283-287`): feito, só que com a ordem ao contrário do que eu tinha pedido, e com razão. A conferência `fetchStatus === 'idle'` entrou depois da espera, e não logo depois do `setFocused(true)`. O motivo é que o TanStack só decide a releitura depois do `await resumePausedMutations()` que segue o foco. Conferir na mesma hora daria `'idle'` sempre, e o teste ficaria verde sem provar nada (a linha 277 já explicava isso). Do jeito que ficou, a prova não depende da carga da máquina:
  - o `setTimeout` de 50 ms só dispara depois que todos os microtasks terminaram, então uma releitura, se a opção a mandasse, já teria começado;
  - quando a releitura começa, o `fetchStatus` vira `'fetching'` na mesma hora, antes de qualquer resposta da rede falsa;
  - se a rede respondesse antes da conferência, `memorias()` daria 2.
  
  Com as duas asserções juntas, a mutação de `refetchOnWindowFocus` fica vermelha de qualquer jeito. Rodei `npx vitest run src/areas/aluno/Eu.test.tsx`: 14 de 14 verdes.
- **Divergência nova em `7_task.md`** (o primeiro aluno do caso "recomeço" entra pela API): o código de `e2e/minha-turma.spec.ts` não mudou desde a 1ª rodada, só ganhou registro no documento. O que o caso prova continua conferido pela tela: o segundo aluno não vê a turma do anterior.
- **Tabela "Recomendações sem aplicar"**: as minhas três recomendações de teste da 1ª rodada estão lá, com destino (o caso de recomeço com o cache já preenchido vai para `TODO.md`, a mutação do filtro de `resultado` vai para a retro, e `sairPelaCasca` repetido vai para `TODO.md` depois do encontro das linhas).

Bloqueantes: nenhum.

Recomendações: nenhuma nova.
