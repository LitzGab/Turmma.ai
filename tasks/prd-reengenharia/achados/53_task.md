# Achados das revisões — `tasks/prd-reengenharia/53_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-22 12:48:01 · `tasks/prd-reengenharia/53_task.md`

VEREDITO: APROVADO
Tela vista: sim (6 fotos lidas: lista de atividades no computador e no celular, cheia e vazia, e o resultado de "Cinemática: lista sintética" no computador e no celular). Não há foto da tela de resposta em andamento, e a tarefa mexe nela por baixo. Essa parte revisei pelo código.

Estados: ok. Esta tarefa não cria nem muda estado de tela.
- A lista, cheia e vazia, está como estava. A vazia diz o próximo passo: "Nada para fazer agora. Quando quem dá a aula passar uma atividade para a turma, ela aparece aqui."
- Carregando e erro eu conferi só pelo código. O diff não os toca.
- Escolha que voltou do espelho entra na fila como pendente. A tela a mostra pelas marcas que já existiam (`marcaDaQuestao`, `role="status"` em `Atividade.tsx:191`). Se não salvar, aparece o erro "Não foi possível salvar" com o botão de tentar de novo.

Acessibilidade: sem regressão. O diff em `Atividade.tsx` só acrescenta uma assinatura de consulta e um `useEffect`, sem marcação nova. As marcas de salvamento continuam em `role="status"` e `role="alert"`.

Chromebook fraco:
- O espelho grava só quando as pendentes mudam (`fila-de-respostas.ts`, `publicar`) e guarda um JSON de poucos números em `sessionStorage`. O custo é desprezível.
- O jitter de ±25% na espera do reenvio evita que a turma inteira tente de volta no mesmo instante. O teto de 15 s é respeitado.
- Nada de lista longa nem de imagem nesta tarefa.

Celular:
- Nas fotos de 360 px não há rolagem horizontal nem texto cortado.
- O alvo de toque e o comportamento do fluxo não mudaram.
- A faixa de abas aparece no meio da página nas fotos compridas (resultado em `...Cinemática-lista-sintética--celular.png`, lista em `aluno--aluno-atividades--celular.png`). Isso parece efeito da captura de página inteira com barra fixa, não defeito. Vale a mesma ressalva da lista de atividades.
- A tarefa não exige o celular em nenhum fluxo.

Ação oficial protegida: sim. A tarefa não aprova nada oficial. O espelho guarda só a escolha de alternativa não confirmada, e o envio da atividade continua só sem pendente (`impedimentoDoEnvio`).

Bloqueantes: nenhum.
- A foto não mostra mudança visual, o que é o esperado.
- Privacidade confere:
  - O esquema é estrito, sem coerção, e só aceita ids e números (`packages/shared/src/atividade/prova.ts`, `esquemaEspelhoDaFila`).
  - O dono vem do `/v1/eu` no cache, não da memória da sessão anterior (`fila-de-respostas.ts`, `espelho.dono`).
  - A leitura descarta o que é de outro dono ou inválido (`espelho-da-fila.ts`, `lerEspelho` e `esquecerEspelhosDeOutroDono`).
  - O "Sair" e a suspensão limpam tudo; a sessão vencida mantém.
  - `docs/lgpd.md` ganhou a linha da escolha pendente.
- As mutações da tarefa cobrem as cláusulas novas.

Recomendações:
- O vitrine não tem atividade "para responder", então a tela de resposta em andamento nunca é fotografada. Vale um dado sintético com atividade aberta, para o próximo `frontend-reviewer` ver o estado "não salva" e o botão "Tentar de novo" no celular a 360 px.
- Não há aviso visível de que a escolha foi recuperada depois do F5. Hoje ela só reaparece marcada, e o aluno pode estranhar. Uma frase curta em `role="status"`, algo como "Recuperamos a sua escolha e estamos salvando", ajudaria. Não bloqueia.
- O comentário em `apps/web/src/api/sessao.ts:73` ficou claro. Confirme na 57.0 que a limpeza do "Sair" continua em `fila-de-respostas.ts`, e não em `sessao.ts:332`, como a `onda-4a.md` ainda cita.

## privacy-guardian · 1ª rodada · REPROVADO · 2026-10-22 12:49:01 · `tasks/prd-reengenharia/53_task.md`

VEREDITO: REPROVADO

**Campos pessoais tocados:** a escolha da prova que o servidor ainda não confirmou, guardada em `sessionStorage` com uma chave por atividade. Leva o id da atividade, o número da questão, o índice da alternativa, a `sequencia` e o `dono`, que é o `usuarioId` opaco do aluno. O esquema `esquemaEspelhoDaFila` (`packages/shared/src/atividade/prova.ts:82`) é estrito e não converte texto em número, e o teste de mutação prova que nome, texto e campo a mais são descartados.

**Fora da tabela de dados do docs/lgpd.md:** nada. A linha nova está em `docs/lgpd.md:70`, com finalidade e retenção. Só que a retenção escrita nela ("até ... o 'Sair', a troca de dono da sessão") não é o que o código garante; o bloqueante explica.

**Autorização por objeto:** não se aplica. A tarefa não cria nem muda rota da API. O que o espelho devolve vai pela mesma `responderQuestao`, com o token da sessão atual, e a API continua conferindo cada objeto.

**Logs:** limpos. Não há `console` nem `logger` em `espelho-da-fila.ts` nem em `fila-de-respostas.ts`.

**Auditoria:** não se aplica. Nada é lido pela coordenação ou pela rede, nada é exportado, e nenhuma nota é criada ou alterada.

**Envio externo:** nenhum. O dado fica só no navegador e não vai a provedor de IA.

**Seed/fixture:** sintético ("Aluna Sintética", "Escola Sintética", UUIDs de teste). As fotos só mostram "Colégio sintético da vitrine", "Aluno Sintético Caio ae51b7cb" e "Professor Sintético Davi".

**Fotos:** o aluno vê só os dados dele e a aprovação da correção, com o nome de quem aprovou, que é anterior a esta tarefa. A tarefa não muda o que a tela mostra. O botão "SAIR" aparece em `/aluno/atividades` em `aluno--aluno-atividades--computador.png` e `vazia--aluno--aluno-atividades--celular.png`, e é por essa tela que o bloqueante passa.

**Bloqueantes:**

1. **A limpeza do espelho só existe se a tela da Atividade já foi aberta desde o último carregamento da aba.**
   - **Onde:** `apps/web/src/areas/aluno/fila-de-respostas.ts:160-164` e `:123`.
   - **O que está errado:** quem apaga o espelho no "Sair", na suspensão e na troca de dono só é registrado quando `fila-de-respostas.ts` é carregado. Esse módulo só é importado por `Atividade.tsx`, e `Atividade.tsx` é carregado sob demanda (`apps/web/src/areas/aluno/rotas.tsx:13`, `lazy(() => import('./Atividade'))`). O caminho `esquecerEspelhosDeOutroDono` também só roda em `fila.hidratar()`, dentro da Atividade. Dois caminhos simples deixam a escolha do aluno anterior no Chromebook do carrinho, ao contrário do que diz `docs/lgpd.md:70`:
     - **"Sair" depois do F5 fora da Atividade:** o aluno marca uma resposta com a rede caída (a pendente vai para o espelho), volta para "Atividades", aperta F5 e clica em "SAIR" (o das fotos). Nesse carregamento a Atividade não foi aberta, o gancho não existe, e as chaves `educa.escolhas-pendentes.*` ficam no navegador com o `usuarioId` e as alternativas dele.
     - **Outra pessoa entra por cima da sessão vencida:** o estado passa a `aberta`, e o gancho de propósito não limpa (`:164`). `CascaDaEscola.tsx:188` só leva a aba à página inicial. Se a pessoa nova não abrir uma atividade, as escolhas da anterior ficam até a aba fechar, e voltam com Ctrl+Shift+T.

     Nada disso é mandado à API nem mostrado na tela, porque o dono é conferido ao hidratar. Mesmo assim, é resposta de prova de menor ao alcance de quem senta depois, numa aba que a regra 20 e o comentário de `sessao.ts:72-74` mandam deixar sem nada da pessoa anterior.
   - **Correção exigida:**
     - Registrar a limpeza num módulo que sempre carrega na área autenticada: `espelho-da-fila.ts` registra o próprio `aoTrocarDeSessao` e é importado por `main.tsx`, por `sessao.ts` ou pela casca. Limpa tudo em `anonima` e `suspensa`.
     - Na troca de dono, `CascaDaEscola` (que já recebe o `/v1/eu` em `:185-188`) chama `esquecerEspelhosDeOutroDono(dados.usuarioId)` a cada `/v1/eu` novo.
     - Um teste que prove o "Sair" e a entrada de outra pessoa limpando o espelho **sem importar `fila-de-respostas.ts`**, por exemplo em `sessao.test.ts` ou no teste da casca, com mutação declarada.
     - Os testes de hoje (`espelho-da-fila.test.ts:340` e `:352`) não pegam esse caso, porque importam o módulo da fila.

**Recomendações:**
- `docs/lgpd.md:70`: "fechamento da aba" não é fim de verdade, porque o Chrome devolve o `sessionStorage` quando a aba é reaberta (Ctrl+Shift+T). A finalidade já admite isso; a retenção deveria dizer "fechamento da aba sem reabrir, ou a próxima entrada de outra pessoa".
- `esquecerEspelhosDeOutroDono` hoje só roda dentro da Atividade. Depois da correção, a docstring de `espelho-da-fila.ts:13-15` deveria dizer onde ela roda.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-22 12:49:05 · `tasks/prd-reengenharia/53_task.md`

VEREDITO: APROVADO
Caminho quente tocado: prova
Rate limit: ok (a tarefa não mexe em limite: o diff só toca a web, o `shared` e a documentação)
Fila e prioridade: ok (não se aplica a job de servidor; o reenvio do cliente agora varia 25 % para cima ou para baixo e nunca passa do teto de 15 s)
Concorrência: protegida. A escolha que volta do `sessionStorage` sai com a mesma `sequencia`. O upsert de `apps/api/src/atividade/minha-atividade.repository.ts:228-236` só grava se a `sequencia` nova for maior que a gravada. Por isso a aba duplicada, a fila parada com envio no ar e a escolha que volta depois do F5 se resolvem no banco: a de `sequencia` igual devolve o que já está gravado, e a de `sequencia` menor perde e mostra o aviso "alterada em outra janela".
Índice e paginação: ok (nenhuma query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (nenhum código novo no servidor; nenhum alerta novo)
Bloqueantes: nenhum

Os testes da tarefa passaram na minha máquina: `npx vitest run --project unidade apps/web/src/areas/aluno apps/web/src/api/sessao.test.ts`, 7 arquivos e 153 casos.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/areas/aluno/fila-de-respostas.ts:673-674`: a sessão vence e outra pessoa entra pelo login por cima. Nessa entrada o `guardarToken` chama os ganchos de troca com o estado já `aberta`, e o código guardado da aluna anterior fica na aba. Ele só sai quando a pessoa nova abre alguma atividade, ou quando a aba fecha. Nada é mandado nem mostrado, porque a leitura confere quem é o aluno da sessão, mas a linha nova de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/docs/lgpd.md:70` promete apagar "na troca de dono da sessão", e isso só acontece quando uma atividade abre. O `privacy-guardian` deve decidir entre duas saídas: apagar quando o `/v1/eu` novo chega com outro aluno, em qualquer tela, ou escrever a retenção como ela é de fato.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/areas/aluno/fila-de-respostas.ts:677` (`aoAbrirSessao(tentarTodas)`): o reenvio quando a sessão volta sai na hora, sem a variação aleatória que a tarefa pôs na espera entre tentativas. Hoje isso não pesa, porque a volta da sessão depende de cada aluno entrar de novo. Se um dia a sessão voltar sozinha, por renovação automática depois de a rede da escola voltar, vale espalhar esse disparo também.
- A tarefa não mexe no teste de carga, e está certo assim: o servidor não muda e o cliente passa a mandar menos. Quando o cenário da prova online existir, ele deve simular a volta da rede com trinta alunos atrás do mesmo IP.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-22 12:49:32 · `tasks/prd-reengenharia/53_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência em onde fica a limpeza do espelho. Ela foi registrada em `onda-3c.md`, T13, mas o lugar escolhido não entrega o que a 53.3, o RF21 do `prd.md` (§8) e a linha nova do `docs/lgpd.md` prometem.
Portão local: carimbo válido

Bloqueantes:

1. **`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/areas/aluno/fila-de-respostas.ts:160-164`**: a limpeza no "Sair" só funciona se a tela da Atividade já tiver sido aberta desde que a página carregou.
   - **O que está errado:** a limpeza do espelho no "Sair" e na suspensão está registrada num `aoTrocarDeSessao` dentro de `fila-de-respostas.ts`. Esse módulo só é carregado com o pedaço da tela da Atividade, que entra por `lazy(() => import('./Atividade'))` (`apps/web/src/areas/aluno/rotas.tsx:13`). Se a Atividade não foi aberta desde o último carregamento da página, o gancho não existe, e o "Sair" não apaga nada.
   - **Caso concreto, o mesmo que a tarefa cita:** o aluno marca uma questão sem rede e volta à lista. Depois a aba recarrega (F5, aba reaberta com Ctrl+Shift+T ou o Chromebook restaurando as abas) numa tela que não é a Atividade. Ele clica em "Sair". O espelho dele, com o `usuarioId` e as alternativas marcadas, fica no `sessionStorage` à disposição de quem sentar depois no computador.
   - **A troca de dono também falha fora da Atividade.** Quando outra pessoa entra sobre a sessão vencida, o estado passa por `aberta`, e o gancho não apaga nada (linha 164). O espelho anterior só sai quando a pessoa nova abre uma atividade (`esquecerEspelhosDeOutroDono`, linha 123). Se ela não abrir nenhuma, ele continua lá.
   - **Por que bloqueia:** a 53.3 pede limpeza no "Sair" e na troca de dono. A linha nova do `docs/lgpd.md:70` declara a guarda "até … o 'Sair', a troca de dono da sessão". O código não cumpre isso, então a tabela de dados declara uma retenção que não existe.
   - **Correção exigida:**
     - registrar a limpeza num módulo que sempre carrega: `main.tsx`, que já registra a limpeza do cache, ou `api/memoria-da-aba.ts`. O `espelho-da-fila.ts` é pequeno e não puxa a fila;
     - apagar o espelho de outro dono assim que o `/v1/eu` da sessão nova identifica a pessoa (o ponto onde `lembrarQuemEsta` é chamado, em `CascaDaEscola.tsx:188`), sem depender da Atividade montada;
     - escrever um teste que prove o "Sair" limpando o espelho num caso que nunca importou `fila-de-respostas.ts`, e um que prove a troca de dono limpando fora da tela da Atividade;
     - corrigir a divergência 3 do `53_task.md` e o item "O 'Sair' e a sessão vencida" do `onda-3c.md` para dizer onde a limpeza passou a ficar.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/areas/aluno/fila-de-respostas.ts:124-126`: em `hidratar`, o `publicar` já chama `refletir()` quando as pendentes mudam, e logo depois `refletir()` roda de novo. A segunda chamada só faz falta quando a hidratação não mudou nada. Um comentário que diga isso, ou um teste com esse nome, deixa claro por que ela está ali.
- Se o `usuarioId` for por escola, a troca de escola da mesma pessoa, seguida da abertura de uma atividade na escola nova, apaga as pendentes não confirmadas da escola anterior. É provavelmente o certo, pela regra 10, mas vale uma linha no `onda-3c.md` dizendo que é de propósito.
- As fotos da tela não mostram nada fora da tarefa. A própria limitação da vitrine já diz que a tela de resposta em andamento não aparece nelas.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-22 12:50:07 · `tasks/prd-reengenharia/53_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** F5 com duas pendentes · sessão vencida e o mesmo aluno volta · outro dono, também na aba reaberta · "Sair" limpa todas as atividades · duas atividades, cada uma com a sua · envio confirmado tira a pendente do espelho · espelho com campo a mais, nome, texto ou tipo errado é descartado · `sessionStorage` que lança · jitter entre 75 % e 125 %, com teto. Os de borda do domínio: aluno que ainda não se sabe quem é quando a tela abre, sessão suspensa, sessão nova por cima, e o Chromebook do carrinho passando de mão. O de permissão e isolamento: outra pessoa no mesmo Chromebook nunca vê nem manda a escolha da anterior.

**Cobertos:** cada linha da tabela tem o seu teste, e todos verificam o resultado, não só que o código rodou. Rodei os testes isolados da tarefa (`npx vitest run --project unidade apps/web/src/areas/aluno apps/web/src/api/sessao.test.ts`): 153 passaram, 7 arquivos. Onde cada linha está:
- `espelho-da-fila.test.ts`: "F5 com duas pendentes", "sessão vencida e o mesmo aluno volta", "outro dono, também na aba reaberta", "\"Sair\" limpa o espelho de todas as atividades", "duas atividades: cada fila hidrata a sua", "cada mudança das pendentes vai para o espelho, e a confirmação do servidor tira a pendente dele", o `it.each` "descarta o conjunto inteiro" (nove casos) e os dois de armazenamento que lança.
- `respostas.test.ts`: "o jitter deixa a espera entre 75 % e 125 %…" e "a pendente que o espelho guardou volta à fila…".
- `Atividade.test.tsx`: os três casos na tela (F5, aluno que chega depois, espelho de outra pessoa).

Não há `.skip`, teste comentado nem chamada a provedor de IA.

O mock de `api/sessao` em `espelho-da-fila.test.ts:19-26` não esconde a regra. A ordem real (o estado muda antes de o gancho `aoTrocarDeSessao` disparar) já é provada por `sessao.test.ts › limpa o que vive fora do módulo…`, que mostra `estadoDaSessao()` como `aberta`, `anonima` e `vencida` dentro do gancho.

Não há operação concorrente nova: o `sessionStorage` é de uma aba só, e a fila é uma por atividade.

**Bloqueantes:** três cláusulas novas ficaram sem bloco de mutação. Os testes que as pegariam existem, mas o portão não provou nenhuma delas. Duas são as mutações que a própria tabela declara.

1. **`apps/web/src/areas/aluno/espelho-da-fila.ts:23`**: a chave com a atividade não tem bloco. A tabela declara a mutação "chave sem a atividade" na linha "Duas atividades", mas a seção "Mutações" não a traz. Correção exigida, um bloco:
   ```
   arquivo: apps/web/src/areas/aluno/espelho-da-fila.ts
   teste: apps/web/src/areas/aluno/espelho-da-fila.test.ts › duas atividades: cada fila hidrata a sua
   - const chaveDa = (atividade: string): string => `${PREFIXO}${atividade}`
   + const chaveDa = (_atividade: string): string => PREFIXO
   ```

2. **`apps/web/src/areas/aluno/fila-de-respostas.ts:70-72`**: não há bloco que prove que a confirmação tira a pendente do espelho. A tabela declara "gravar só na entrada" na linha "Envio confirmado". O único bloco sobre `publicar` (`if (mudouAFila) refletir()` → `refletir()`) troca gravar de menos por gravar demais, e não prova isso. Correção exigida, um bloco:
   ```
   arquivo: apps/web/src/areas/aluno/fila-de-respostas.ts
   teste: apps/web/src/areas/aluno/espelho-da-fila.test.ts › cada mudança das pendentes vai para o espelho, e a confirmação do servidor tira a pendente dele
   - const mudouAFila = novo.pendentes !== estado.pendentes
   + const mudouAFila = novo.pendentes.length > estado.pendentes.length
   ```
   Assim o teste fica vermelho na confirmação, que é o motivo certo, e não na primeira escolha.

3. **`apps/web/src/areas/aluno/espelho-da-fila.ts:66`**: o `apagar(chaveDa(atividade))` em `lerEspelho` não tem bloco. É a cláusula que tira do armazenamento o espelho de outro dono ou inválido ao ler (regra 20). Os testes "o que é de outro dono não volta, e sai do armazenamento" e "descarta o conjunto inteiro, e apaga a chave" verificam que a chave sumiu, mas nenhum bloco remove a linha. Correção exigida, um bloco:
   ```
   arquivo: apps/web/src/areas/aluno/espelho-da-fila.ts
   teste: apps/web/src/areas/aluno/espelho-da-fila.test.ts › o que é de outro dono não volta, e sai do armazenamento
     if (guardado?.dono === dono && guardado.atividade === atividade) return guardado.pendentes
   - apagar(chaveDa(atividade))
     return []
   ```

**Recomendações:**
- **Texto de retenção em `docs/lgpd.md`.** A linha diz que o espelho sai na "troca de dono da sessão". No código, ele sai quando a pessoa seguinte abre uma atividade (é a hidratação que apaga) ou quando a aba fecha. Isso está declarado em `onda-3c.md` ("A troca de dono é a hidratação"), mas falta um teste para "outra pessoa entra e não abre atividade nenhuma" e o texto precisa ser alinhado. Isso é com o `privacy-guardian`.
- **F5 com a sessão vencida.** Na recarga, `abrirSessaoPeloCookie` vai para `anonima` por `definirEstado`, sem disparar `aoTrocarDeSessao`, então o espelho fica, como deve. Nenhum teste prova isso. Vale um caso: recarga, cookie vencido, mesmo aluno entra, as pendentes saem.
- **Aba duplicada.** O Chrome copia o `sessionStorage` na duplicação, então as duas abas mandam a mesma `sequencia`. A 51.0 deduplica no servidor, mas um caso que cite essa garantia deixaria a dependência explícita.
- **Estado `suspensa` em `sessao.test.ts`.** O teste `limpa o que vive fora do módulo…` não passa por `suspensa`, e a fila depende de ler `suspensa` dentro do gancho. Incluir esse caminho no teste fecharia a ordem real.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tasks/prd-reengenharia/53_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/areas/aluno/espelho-da-fila.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/areas/aluno/fila-de-respostas.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/areas/aluno/espelho-da-fila.test.ts

## infra-guardian · 2ª rodada · APROVADO · 2026-10-22 13:04:29 · `tasks/prd-reengenharia/53_task.md`

VEREDITO: APROVADO
Caminho quente tocado: prova (só no cliente: o espelho no `sessionStorage` das escolhas que o servidor ainda não confirmou)
Rate limit: ok (o diff não toca limite, login nem rota da API)
Fila e prioridade: ok (o diff não toca a fila de jobs)
Concorrência: protegida (a deduplicação continua no servidor, pela `sequencia` da 51.0, e esta rodada não mexe nela)
Índice e paginação: ok (não há query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não há código novo de servidor no caminho quente)
Bloqueantes: nenhum

Auditei só o que mudou desde a 1ª rodada, quando não exigi nenhuma correção.

- **Limpeza fora da Atividade.** A limpeza no "Sair" e na suspensão saiu da fila de respostas e foi para `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/api/espelho-da-fila.ts`. Esse módulo é carregado pela casca da escola, então a limpeza já não depende de a Atividade ter sido aberta.
- **Sessão vencida e F5.** Continuam sem apagar o espelho, que era o ponto da regra 80 item 6: resposta de prova não se perde.
- **Pessoa nova no mesmo computador.** A `CascaDaEscola.tsx:191` apaga o espelho dos outros donos a cada `/v1/eu`. É uma passada local pelas chaves do `sessionStorage`, sem rede, e não pesa na manhã de segunda.
- **Testes.** Os três arquivos de teste da tarefa passam: 45 casos em `src/api/espelho-da-fila.test.ts`, `src/areas/aluno/espelho-da-fila.test.ts` e `src/componentes/CascaDaEscola.test.tsx`. Nenhum chama provedor pago.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/areas/aluno/fila-de-respostas.ts`: quando a sessão volta, `aoAbrirSessao(tentarTodas)` reenvia na hora, sem a variação aleatória de espera (jitter) que o recuo normal usa. Já está no `TODO.md`. Hoje não pesa, porque a sessão não volta sozinha em muitas abas ao mesmo tempo. Precisa ser revisto quando a 57.0 mexer na sessão.
- O cenário de carga da prova em `infra/k6/` (o `PUT` de resposta com `sequencia` e reenvio, trinta alunos atrás do mesmo IP) continua pendente no `TODO.md`. A 51.0 o deixou para entrar junto com a 52.0 e a 53.0. Se ele não entrar até o fim da linha da prova, é o que o `/validar` precisa cobrar.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-22 13:04:31 · `tasks/prd-reengenharia/53_task.md`

VEREDITO: APROVADO
Tela vista: sim (6 fotos lidas: lista de atividades e o detalhe de "Cinemática: lista sintética", a 1366 e a 360 px; a lista também na escola vazia). Não há foto da tela de resposta em andamento, que a tarefa alterou por baixo.
Estados: ok. O diff desta rodada não toca estado de tela. Carregando e erro seguem como na rodada anterior; não os reauditei.
Acessibilidade: sem mudança. A casca só ganhou uma chamada dentro do `useEffect` que já existia, e nenhum rótulo, foco ou contraste mudou.
Chromebook fraco: o módulo do espelho agora entra no pacote da casca. É pequeno e só importa o esquema do `@educa/shared`, que o front já usa. A varredura do `sessionStorage` a cada `/v1/eu` é síncrona e curta. Não há custo perceptível.
Celular: nenhuma rolagem horizontal em 360 px. O alvo de "Sair" na barra de topo continua com `min-w-11`, e o teste da casca o cobre. A barra de abas aparece no meio da foto do detalhe porque a captura é de página inteira com barra fixa. Isso é efeito da foto, não defeito da tela.
Ação oficial protegida: sim, e esta tarefa não tem ação oficial.

A correção que moveu a limpeza do espelho (`apps/web/src/api/espelho-da-fila.ts:85-93`) vale também para a tela, e nada mais mudou no que o usuário vê.

- **A limpeza não depende mais de a Atividade ter sido aberta.** A casca carrega o módulo, que registra o próprio `aoTrocarDeSessao`.
- **A casca limpa a cada `/v1/eu`.** `apps/web/src/componentes/CascaDaEscola.tsx:190` chama `esquecerEspelhosDeOutroDono`, então o aluno que senta depois no Chromebook não herda a escolha do anterior. O teste da casca cobre os dois caminhos (entrada de outra pessoa e troca sob a mesma tela). Há também uma mutação que remove essa linha.
- **A chamada roda para todo papel.** Professor e coordenação a executam também, mas ela só apaga espelho de outro dono, então é inofensiva.
- **Fotos e código batem.** Nenhuma contradição.

Bloqueantes: nenhum.

Recomendações (sem bloquear):
- `tools/vitrine/` ainda não tem atividade "para responder". O estado "não salva" e o "Tentar de novo" não são fotografados a 360 px (já em `TODO.md`).
- O texto da faixa "CORREÇÃO APROVADA POR PROFESSOR SINTÉTICO DAVI AE51B7CB" mostra um sufixo parecido com id. Vem do dado sintético da vitrine, não do componente. Vale conferir na validação se o nome real não sai com sufixo.
- Uma frase em `role="status"` avisando que a escolha foi recuperada depois do F5 ficou para a onda 4 (X6).

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-22 13:04:47 · `tasks/prd-reengenharia/53_task.md`

VEREDITO: APROVADO

A correção exigida na 1ª rodada foi feita. Auditei só o diff desde aquela rodada e o que ele afeta.

**Campos pessoais tocados:** o mesmo dado da 1ª rodada. É a escolha de prova que o servidor ainda não confirmou, guardada em `sessionStorage` com uma chave por atividade. Leva só ids e números: a atividade, a questão, a alternativa, a `sequencia` e o `dono`, que é o `usuarioId` opaco. O esquema `esquemaEspelhoDaFila` não mudou e continua estrito.

**Fora da tabela de dados do docs/lgpd.md:** nada. A linha de `docs/lgpd.md:70` agora escreve a retenção como o código faz:
- o "Sair" e a suspensão apagam o espelho de todas as atividades;
- a entrada de outra pessoa apaga o dela quando o `/v1/eu` dessa pessoa chega;
- o fechamento da aba só apaga se ela não for reaberta;
- a sessão vencida não apaga, de propósito.

A recomendação da 1ª rodada sobre esse texto foi aplicada.

**Conferência da correção exigida (bloqueante 1 da 1ª rodada):**
- **A limpeza mora num módulo que sempre carrega:** feito. O gancho `aoTrocarDeSessao` passou para `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/api/espelho-da-fila.ts:85-88`. Ele apaga tudo em `anonima` e em `suspensa`, e deixa o espelho em `vencida` e `aberta`. O módulo carrega já na abertura da página, por esta cadeia de imports diretos:
  - `main.tsx` importa `rotas.tsx`;
  - `rotas.tsx:8` importa `CascaDaEscola`, sem `lazy`;
  - `CascaDaEscola.tsx:6` importa `api/espelho-da-fila`.

  Por isso o gancho já existe quando `abrirSessaoPeloCookie` roda (`rotas.tsx:83`, dentro de um efeito). Isso cobre a suspensão descoberta na abertura da aba e o "Sair" depois de um F5 fora da Atividade. A fila (`fila-de-respostas.ts:158-162`) ficou só com a limpeza da memória.
- **Troca de dono pela casca:** feito. `CascaDaEscola.tsx:190` chama `esquecerEspelhosDeOutroDono(dados.usuarioId)` a cada `/v1/eu` novo, abra a pessoa uma atividade ou não.
- **Testes que não importam a fila:** feito.
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/api/espelho-da-fila.test.ts` importa só `./sessao` e `./espelho-da-fila`, com a sessão de verdade. Prova cinco casos:
    - o "Sair" apaga;
    - o "Sair" que a API não confirma também apaga;
    - a suspensão apaga;
    - a sessão vencida não apaga;
    - no F5 com a sessão vencida, o espelho fica para o mesmo aluno.
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/componentes/CascaDaEscola.test.tsx:442-472` prova a troca de dono sem nenhuma atividade aberta, e também com a pessoa trocando sob a mesma tela.
  - As mutações estão declaradas em `53_task.md`, inclusive a que remove a chamada na casca e as quatro do gancho.
  - Rodei `vitest --project unidade` em `api/espelho-da-fila.test.ts`, em `CascaDaEscola.test.tsx` e em `areas/aluno`: 8 arquivos e 118 casos passaram.

**Autorização por objeto:** não se aplica. A tarefa não cria nem muda rota. O reenvio continua pela `responderQuestao`, com o token da sessão atual.

**Logs:** limpos. Não há `console` nem `logger` nos arquivos alterados.

**Auditoria:** não se aplica. Não há leitura pela coordenação ou pela rede, nem exportação, nem nota, nem permissão.

**Envio externo:** nenhum. O dado fica só no `sessionStorage` da aba.

**Seed/fixture:** sintético. Os testes usam UUIDs de teste, "Beatriz Lima" e "camila@escola.test". As fotos mostram só "Colégio sintético da vitrine", "Aluno Sintético Caio ae51b7cb" e "Professor Sintético Davi".

**Fotos:** em `aluno--aluno-atividades--Cinemática-lista-sintética--computador.png` e em `vazia--aluno--aluno-atividades--celular.png`, o aluno vê só os próprios dados. O "SAIR" está na casca, que é justamente o módulo que agora sempre carrega a limpeza. A tarefa não muda o que a tela mostra.

**Bloqueantes:** nenhum.

**Recomendações:**
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/api/sessao.ts:76-78`: o comentário ainda aponta para `areas/aluno/espelho-da-fila.ts` e diz só "sai no 'Sair'". Atualizar para `api/espelho-da-fila.ts`, acrescentar a suspensão e dizer que a troca de dono é feita pela casca.
- O segundo caso novo de `CascaDaEscola.test.tsx` ("a pessoa da sessão troca sob a mesma tela") não tem mutação própria. A mutação declarada na linha da casca já derruba o primeiro caso, então isso é só cobertura extra.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 13:05:28 · `tasks/prd-reengenharia/53_task.md`

VEREDITO: APROVADO

Cenários exigidos: F5 com duas pendentes · sessão vencida e o mesmo aluno volta · outro dono, também na aba reaberta · "Sair" limpa todas as atividades · duas atividades, cada uma com a sua · envio confirmado tira a pendente · espelho com campo a mais, nome, texto ou tipo errado · `sessionStorage` que lança · jitter entre 75 % e 125 % e dentro do teto. Desta rodada: suspensão limpa · F5 com a sessão vencida não limpa · entrada de outra pessoa sem nenhuma atividade aberta limpa o espelho da anterior (casca).

Cobertos: todas as linhas da tabela têm teste citado pelo nome, e os 5 arquivos passam (79 testes). As três correções da 1ª rodada foram feitas, e conferi pela leitura do código que cada bloco dá vermelho pelo motivo certo:
1. **`chaveDa` sem a atividade** (`53_task.md:426-431`, teste `areas/aluno/espelho-da-fila.test.ts › duas atividades: cada fila hidrata a sua`). Com a chave única, a segunda gravação sobrescreve a primeira. Ao ler, a primeira fila acha `atividade` diferente da dela, apaga a chave e volta vazia. O teste fica vermelho na linha 225.
2. **`mudouAFila` por comprimento** (`53_task.md:433-438`, teste `› cada mudança das pendentes vai para o espelho, e a confirmação do servidor tira a pendente dele`). A confirmação encurta a lista e deixa de regravar o espelho. O teste fica vermelho na linha 136.
3. **`apagar` em `lerEspelho`** (`53_task.md:440-446`, teste `api/espelho-da-fila.test.ts › o que é de outro dono não volta, e sai do armazenamento`). A chave do outro dono fica guardada e o `toBeNull` falha.

A mudança de pasta não deixou cláusula sem bloco:
- **Gancho `aoTrocarDeSessao`, agora em `api/espelho-da-fila.ts:90-93`.** Tem quatro blocos, e os testes que eles citam usam a sessão de verdade:
  - O login cai em `guardarToken(…, true)`, que dispara o gancho com `aberta`. Por isso o caso "entrar, antes, não apagou nada" pega a mutação `!== 'vencida'`.
  - O 403 `ACESSO_SUSPENSO` passa por `encerrarLocalmente('suspensa')`, e o teste da suspensão pega a mutação `=== 'anonima'`.
  - O 401 de `abrirSessaoPeloCookie` só chama `definirEstado('anonima')`, sem disparar o gancho. É o que o caso do F5 com sessão vencida prova.
- **`CascaDaEscola.tsx:190`.** Tem bloco (`53_task.md:448-453`). Sem a linha, nada apaga o espelho do outro dono: o gancho em `aberta` não apaga, e a Atividade não foi aberta.

Os blocos que só mudaram de caminho apontam para testes que existem com esse nome. Não há `.skip` nem teste comentado. O mock de `api/sessao` em `areas/aluno/espelho-da-fila.test.ts` também alcança o gancho do módulo real do espelho, e a regra da sessão é provada sem mock em `api/espelho-da-fila.test.ts`. Não há chamada de IA.

Bloqueantes: nenhum.

Recomendações:
- O "Sair" clicado na casca, depois de um F5 e sem a Atividade carregada, não tem teste de ponta a ponta. Hoje isso só depende de a casca importar o módulo do espelho, o que já acontece porque ela usa `esquecerEspelhosDeOutroDono`. Um caso em `CascaDaEscola.test.tsx` que clique em "Sair" e confira o `sessionStorage` vazio deixaria essa dependência escrita.
- A troca de escola da mesma pessoa troca o `usuarioId` e apaga as pendentes da escola anterior de propósito (`onda-3c.md`). Falta um caso que fixe esse comportamento.
- `areas/aluno/espelho-da-fila.test.ts:84` e `:97` testam quase a mesma coisa: o acesso ao `sessionStorage` que lança e os métodos de `Storage` que lançam. Dá para juntar, ou dizer no nome o que cada um prova a mais.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/api/espelho-da-fila.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/api/espelho-da-fila.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/areas/aluno/espelho-da-fila.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/componentes/CascaDaEscola.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tasks/prd-reengenharia/53_task.md

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 13:05:35 · `tasks/prd-reengenharia/53_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A divergência 3 do `53_task.md` agora diz onde a limpeza fica, e o `onda-3c.md` (T13, 53.0) e o `onda-4a.md` (T15) foram atualizados do mesmo jeito.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

As correções da 1ª rodada foram feitas:
- **Limpeza no "Sair" e na suspensão:** o gancho `aoTrocarDeSessao` passou para `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/api/espelho-da-fila.ts`. Esse módulo carrega desde o início da página: `rotas.tsx:8` importa a `CascaDaEscola` direto, sem `lazy`, e a casca importa o espelho. Não depende mais da Atividade.
- **Ordem dos ganchos:** o do espelho é registrado antes do da fila. O `parar()` da fila marca `parada` antes de `publicar(FILA_VAZIA)`, então nada grava a chave de novo depois do "Sair".
- **Troca de dono:** `CascaDaEscola.tsx:191` chama `esquecerEspelhosDeOutroDono(dados.usuarioId)` a cada `/v1/eu`, com ou sem atividade aberta.
- **Testes pedidos:**
  - `api/espelho-da-fila.test.ts` não importa `fila-de-respostas.ts` e usa a sessão de verdade. Cobre o "Sair", o "Sair" que a API não confirma, a suspensão, a sessão vencida e o F5.
  - `CascaDaEscola.test.tsx` prova a troca de dono fora da tela da Atividade.
  - Há uma mutação declarada sobre a chamada na casca.
- **Fotos:** a tela não mostra nada fora da tarefa. A limitação da vitrine já está dita e foi para o `TODO.md`.

Recomendações:
- O comentário em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/web/src/api/sessao.ts:76` ainda cita o caminho antigo, `areas/aluno/espelho-da-fila.ts`. Trocar para `api/espelho-da-fila.ts`.
- A limpeza no "Sair" só vale porque a `CascaDaEscola` é importada direto, sem `lazy`, e o módulo do espelho vem junto. Se alguém passar a casca para `lazy`, a limpeza volta a falhar sem nenhum teste avisar. Para tornar isso explícito, importar o espelho em `main.tsx` (por exemplo `import './api/espelho-da-fila'`), ou registrar o gancho por uma função chamada ali.
- `api/espelho-da-fila.ts:2` importa o tipo `EscolhaPendente` de `areas/aluno/respostas`, ou seja, a camada `api/` passa a depender de uma tela. Mover o tipo para `packages/shared`, ao lado de `esquemaEspelhoDaFila`, ou derivá-lo de `EspelhoDaFila['pendentes'][number]`.
