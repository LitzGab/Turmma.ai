# Achados das revisões — `tasks/prd-apresentacao-operacao/10_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-24 06:25:45 · `tasks/prd-apresentacao-operacao/10_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** E2 (401 `SESSAO_ENCERRADA` × 503), `ACESSO_VENCIDO` renova e repete, E3 (aviso aos 2 min do fim), E4 (fronteira de erro do chunk), B1 (teto de 60 kB), B2 (a entrada da escola não leva nada de `src/operacao/`), sem resíduo do operador A quando o B entra na mesma aba, segunda aba pelo canal próprio sem tocar a sessão de escola, teclado/toque/axe/`document.title`. Concorrência: duas renovações ao mesmo tempo (o servidor é provado pelo C30).

**Cobertos (a linha que, apagada, deixa o teste vermelho):**
- **E2, sessão encerrada** (`e2e/operacao.spec.ts:139`): tirar o aviso de `esquecerTudo(TEXTO_DA_SESSAO_ENCERRADA)` em `sessaoEncerrada()` (`api/sessao.ts:315`), ou o desvio para a entrada, deixa o alerta faltando.
- **E2, 503** (`:155`): tratar o 503 como sessão encerrada leva à entrada, e a asserção de URL `/operacao$` e do "Sair" visível falha. O "Tentar de novo" também é provado.
- **`ACESSO_VENCIDO`** (`api/sessao.test.ts:121`): sem o ramo `renovarOuEncerrar()` + repetição (`sessao.ts:353-363`) o erro sobe, e a sequência de três chamadas não bate. Os pares também estão lá: só renova uma vez (`:140`), renova antes pelo relógio (`:153`), renovação recusada (`:187`), 503 mantém o token (`:196`).
- **E3** (`e2e:185`): o prazo fica cercado dos dois lados (nada aos 26:30, aviso aos 27:30). Mudar `ANTECEDENCIA_DO_AVISO_MS` ou `FOLGA_DA_GRAVACAO_DO_USO_MS` quebra o teste, e o fim leva à entrada com a mensagem. No Chromebook, ele também pega o `pointermove` sem deslocamento, porque o cursor fica parado sobre o botão.
- **E4** (`e2e:222`): sem `FronteiraDaOperacao` (`src/rotas.tsx:35-55`) a tela fica branca e o teste falha. O teste também falha se o chunk perder o nome `operacao-`.
- **B1** (`tools/ci/tamanho-web.test.ts`): com o item de 60 kB tirado do `.size-limit.json`, o caso de 70 kB passa e o teste fica vermelho. Há ainda o controle pequeno e o caso "chunk sem o nome operacao-*".
- **B2** (`apps/web/nome-dos-chunks.test.ts:69`): o teste roda sobre o build de verdade, e o controle com `import` estático (`:86`) mostra que ele enxerga o vazamento. Conferi à parte, num projeto mínimo: um módulo de `src/operacao/` importado ao mesmo tempo pela entrada e pela área cai no chunk de entrada, e o teste o pega. O e2e (`:237`) confere a rede.
- **Resíduo do operador anterior, estado do módulo** (`sessao.test.ts:265`, `:296`, `:310`): token, desafio, uso, erro e a renovação que estava no ar são provados.
- **Segunda aba** (`e2e:247` e `sessao.test.ts:338`): sem o `postMessage('saiu')` a outra aba não vai à entrada em 20 s. A aba da escola continua, e a sessão dela reabre pelo cookie depois do reload.
- **`document.title` e axe**: títulos das três rotas; axe em entrar, mfa, casca, 503, E3 e E4, nos dois projetos. Nada em `localStorage`, `sessionStorage` nem na URL.

**Bloqueantes:**
1. **O cache do operador A não tem teste que prove que ele é esvaziado.** A regra fica em `apps/web/src/operacao/rotas.tsx:30-33`, `aoTrocarDeSessaoDeOperador(() => { clienteDaOperacao.clear() })`. Se essas linhas forem apagadas, todos os testes continuam verdes:
   - `sessao.test.ts:284` e `:293` só conferem que um `vi.fn()` registrado foi chamado, e não que o cache foi esvaziado.
   - Nenhum e2e troca de operador na mesma aba sem recarregar.

   O efeito real é o bug do resíduo da retro do F1, que custou 9 reprovações. O `staleTime` é de 30 s (`api/cliente-de-consultas.ts:25`), então o B que entra logo depois do "Sair" do A recebe o `['operacao','eu']` do A sem nova busca. A faixa mostra o nome do A e o `main` diz "Você está na operação como <apelido do A>". O mesmo vale para o `entrou` vindo de outra aba.

   **Correção exigida:** um e2e em `e2e/operacao.spec.ts` com dois operadores na mesma aba, sem `goto` nem reload entre eles (a entrada vai por `navegar`). O A entra, sai a um clique, e o B entra por e-mail, senha e código. Asserções: a faixa contém o nome do B, `not.toContainText` com o nome do A, e o `main` com o apelido do B. Com as linhas 31-33 apagadas, o teste precisa ficar vermelho.

**Recomendações:**
- **Renovações em paralelo:** falta um teste com duas `chamarComSessaoDeOperador` em paralelo (`Promise.all`) recebendo `ACESSO_VENCIDO`, que prove um único `POST /renovar` (o `renovacaoEmAndamento ??=` em `sessao.ts:280`). O servidor tolera a corrida pelo C30, mas a trava de Web Locks e a deduplicação na aba não têm prova de paralelo, só do nome da trava (`sessao.test.ts:221`).
- **Clique duplo:** faltam testes de clique duplo em "Entrar" na tela do segundo fator e em "Sair". Um segundo envio com o mesmo desafio já gasto leva a pessoa à entrada com "código não foi aceito".
- **Código recusado no segundo fator:** o caminho que volta à entrada com `TEXTO_DO_CODIGO_RECUSADO` (`Mfa.tsx:67-70`, divergência registrada) só tem prova de unidade do desafio esquecido, e nenhuma de tela.
- **Teclado:** ele se resume ao Tab até o "Sair". Faltam o formulário de entrada e o do segundo fator enviados só pelo teclado (Tab e Enter) no Chromebook.
- **Módulo de `src/operacao/` num chunk `parte-*`:** o B2 lê só `entrada.moduleIds`. Um módulo de `src/operacao/` importado por outra página carregada por `import()` iria para um `parte-*`, que nem o B2 nem o teto de 60 kB medem. Vale conferir também os chunks com nome diferente de `operacao-*` que contenham módulos de `src/operacao/`.
- **Comentário desatualizado:** `apps/web/src/rotas.tsx:22` cita `entrada-sem-operacao.test.ts`, que não existe. O teste é `apps/web/nome-dos-chunks.test.ts`.
- **Título do "não encontrada":** a página "não encontrada" da operação define título e a fronteira de erro não. Falta a asserção de `document.title` nas duas.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/10_task.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/api/sessao.ts` e `sessao.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/rotas.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/inatividade.ts` e `inatividade.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/nome-dos-chunks.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/tamanho-web.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao.spec.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/operacao.ts`

## test-engineer · 2ª rodada · APROVADO · 2026-09-24 06:40:11 · `tasks/prd-apresentacao-operacao/10_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** nesta rodada, só a correção exigida na 1ª rodada. É um e2e com dois operadores na mesma aba, sem `goto` nem recarga entre eles: A entra, sai, B entra. A faixa precisa mostrar o nome de B e não o de A, e o main precisa mostrar o apelido de B. O teste tem de ficar vermelho quando o `clienteDaOperacao.clear()` é apagado. Também conferi as recomendações que viraram teste.

**Cobertos:**
- **Correção exigida, feita.** O teste está em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao.spec.ts:139-158`.
  - A Ana entra pela tela (o `goto` fica só no início) e o main mostra o apelido dela. Ela sai pelo botão "Sair" e o teste espera a entrada aparecer.
  - Na mesma aba, o Bruno faz e-mail, senha e código.
  - O teste confere que a faixa tem `bruno.nome` e não tem `ana.nome`, e que o main tem `bruno.apelido` e não tem `ana.apelido`.
  - A regra que o teste prova é o ouvinte `aoTrocarDeSessaoDeOperador(() => { clienteDaOperacao.clear() })`, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/rotas.tsx:31-33`. Sem ele, a consulta `eu` da Ana continuaria em cache e apareceria para o Bruno.
  - A prova de vermelho vem do relato da execução: com `void 0` no lugar do `clear()`, o chromebook fica vermelho, e restaurado fica verde. Eu não rodei o teste. Pela lógica do cache, o teste falharia sem a regra.
- **Código do segundo fator recusado** (`e2e/operacao.spec.ts:160-174`). Um código diferente do certo volta a `/operacao/entrar` com o alerta "O código não foi aceito", sem violação grave de acessibilidade.
- **Concorrência de verdade na renovação** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/api/sessao.test.ts:140-159`). São duas chamadas em `Promise.all`, as duas recebem ACESSO_VENCIDO, sai um único POST de renovação, e as duas repetem com o `token-renovado`. O teste confere a ordem dos `Authorization`, então quebraria se cada chamada renovasse por conta própria.
- **B2 reforçado** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/nome-dos-chunks.test.ts:84-85`). Nenhum módulo de `src/operacao/` fica fora do chunk `operacao-*`. Os testes de controle nas linhas 91-107 mostram que a detecção funciona nos dois sentidos.
- Não há `.skip`, `.only`, teste comentado nem chamada a provedor de IA no que mudou. Os mocks do `sessao.test.ts` são só da rede (`fetch`), não da regra testada.

**Bloqueantes:** nenhum.

**Recomendações:**
- `e2e/operacao.spec.ts:151`: antes de preencher o código do Bruno, esperar o título "Segundo fator", como faz o `entrarNaOperacao`. O `fill` já espera o campo aparecer, então hoje funciona, mas a asserção explícita deixa mais claro onde o teste falhou no Chromebook lento.
- `e2e/operacao.spec.ts:168`: a chance de `000000` ou `111111` cair num código aceito é desprezível, mas existe se a API aceitar a janela vizinha do TOTP. Um código com formato inválido para o TOTP, ou o código de outro operador, tiraria essa chance.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-09-24 06:41:08 · `tasks/prd-apresentacao-operacao/10_task.md`

VEREDITO: APROVADO

**Estados:** ok. A casca da operação (`/operacao`) tem os quatro estados: carregando ("Abrindo a sua sessão…" e "Carregando a operação…"), erro (o 503 fica na tela com "Tentar de novo"), com dado (o nome na faixa) e vazio. O vazio diz o que existe hoje e onde fazer. As telas de entrar e de segundo fator têm carregando ("Entrando…" no botão e em região viva), erro que diz o que fazer e o formulário. Não têm vazio porque não buscam nada antes do envio. O segundo fator sem desafio não fica em branco: explica e leva à entrada. Se o chunk não chega, aparece a fronteira de erro com "Tente de novo", em vez de tela branca.

**Acessibilidade:**
- Todo campo tem rótulo e dica, com `autocomplete`, `inputmode` e `one-time-code` certos.
- O anel de foco sobre a faixa preta é `caramelo-noite`, e o e2e confere isso na casca de verdade.
- `document.title` muda por rota, e há `<h1>` para leitor de tela.
- `role="alert"` fica só na mensagem, e o botão fica fora dele.
- O aviso de inatividade não rouba o foco.
- O axe roda em entrar, segundo fator, casca, 503, E3 e E4, nos dois projetos.

**Chromebook fraco:**
- A área do operador fica num chunk próprio, só por `import()`.
- O teto é de 60 kB brotli, e o B2 é provado no build: a entrada da escola não leva nada de `src/operacao/`. O e2e confere que a web da escola nunca pede o chunk.
- O e2e roda com CPU ×4 e Fast 3G.
- Nenhuma tela faz polling: o relógio de inatividade é um `setTimeout` e manda no máximo um `GET /eu` por minuto de uso, com ouvintes `passive`.
- Não há lista longa nem upload nesta tarefa.

**Celular:**
- Coluna única a partir de 360 px, e `larguraExcedente` dá 0 em todas as telas testadas.
- Na faixa, o nome trunca e o "Sair" não encolhe (`shrink-0`).
- A ação principal e o "Sair" têm 44 px, com medição no teste.
- Nada depende de hover. A inatividade conta toque (`pointerdown`), não só mouse.
- O e2e passa no projeto `celular` com `tap()`.
- Nenhum fluxo exige o celular.

**Ação oficial protegida:** não se aplica. Esta tarefa não tem nota nem ação oficial. O "Sair" fica a um clique e do mesmo tamanho de "Continuar na sessão", como pede a D59.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Fronteira de erro sem título.** A `FronteiraDaOperacao`, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/rotas.tsx:37-54`, não define `document.title`. Quando o chunk falha, a aba fica com o título da página anterior. O mesmo vale para o estado "Abrindo a sua sessão…" do `Protegida` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/rotas.tsx:44-51`). O test-engineer já tinha apontado isso.
2. **Dois botões "Sair" ao mesmo tempo.** Com o aviso de inatividade aberto (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/rotas.tsx:68-74`), a página tem dois botões chamados "Sair", o da faixa e o do aviso. Para leitor de tela, vale diferenciar: por exemplo, "Sair agora" no aviso, ou um `aria-describedby` apontando para a frase do aviso.
3. **Jargão no estado vazio.** O texto em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/rotas.tsx:107-108` fala em "comandos `ops:*` no terminal". Para a equipe Turmma isso é aceitável, porque é jargão interno e não chega a usuário de escola. Mesmo assim, some quando a A0b trouxer as telas: fica anotado para não sobreviver no painel.
4. **Rótulo do erro da fronteira.** A fronteira usa "Não foi possível carregar a área da operação" para qualquer erro de renderização dentro da área, e não só para o chunk que não chegou. Hoje serve, porque recarregar resolve os dois casos. Se a A0b trouxer telas com formulário longo, reveja: a recarga perde o que estava digitado.
5. **Teclado nos formulários.** Falta um e2e no Chromebook que envie a entrada e o segundo fator só com Tab e Enter. Hoje o teclado é testado só até o "Sair".

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/rotas.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/rotas.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/componentes/CascaDaOperacao.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Entrar.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Mfa.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/inatividade.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/textos.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/titulo.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/vite.config.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao.spec.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/tokens.spec.ts`

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-24 06:41:09 · `tasks/prd-apresentacao-operacao/10_task.md`

VEREDITO: APROVADO

A tarefa 10.0 não toca dado de aluno. O único dado pessoal que aparece é o do próprio operador Turmma, que ele vê em si mesmo. Não encontrei nenhum bloqueante.

Campos pessoais tocados: só a conta do operador Turmma. O e-mail e a senha são digitados em `/operacao/entrar`. A tela mostra o apelido e o nome que vêm do `GET /v1/operacao/eu`. Nenhum campo novo foi criado no banco nem na API.

Fora da tabela de dados do docs/lgpd.md: nenhum. A conta, o convite, a sessão, o cookie de dispositivo e a auditoria do operador já estão na tabela (`/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md`, linhas 69 e 75 a 80), com finalidade e retenção.

Autorização por objeto: ok.
- Esta tarefa não cria rota na API. A web só chama `/v1/operacao/sessao/*` e `/v1/operacao/eu`, que as tarefas 4.0 a 8.0 já tratam, e o `/eu` não recebe id.
- A resposta do `/eu` é explícita e estrita: só `apelido` e `nome` (`packages/shared/src/operacao/eu.ts:10-15`).
- As telas mostram erro pelo catálogo, sem stack trace nem corpo cru (`apps/web/src/operacao/textos.ts`).

Sessão e exposição: ok.
- O token de acesso e o desafio do segundo fator ficam só em variável de módulo (`apps/web/src/operacao/api/sessao.ts:72-83`), nada em `localStorage`, `sessionStorage` ou URL. O e2e confere isso (`e2e/operacao.spec.ts:49`).
- O canal `turmma-operacao` leva só `saiu`, `entrou` e `uso` com um horário, sem pessoa nem token (`sessao.ts:70`).
- Sair ou trocar de pessoa apaga token, desafio, erro e uso, e esvazia o cache próprio da operação (`sessao.ts:152-163`; `apps/web/src/operacao/rotas.tsx:30-33`). A renovação que ainda estava no ar quando a pessoa saiu é descartada pelo contador `geracao`. Há teste de unidade e e2e de que nada da pessoa anterior fica.
- A senha sai da memória da tela assim que a entrada responde.
- A web da escola não baixa o chunk da operação. Isso é provado no build (`apps/web/nome-dos-chunks.test.ts`) e no e2e (B2).

Logs: limpos. Não há `console.*` em `apps/web/src/operacao/`. O erro do fixture de e2e leva só o caminho e o status.

Auditoria: presente onde a regra exige. Esta tarefa não faz leitura de dado de aluno, exportação, alteração de nota ou permissão, nem aprovação de saída de IA. A auditoria de entrada e de sessão do operador vem das tarefas 7.0 a 9.0, sem mudança aqui.

Envio externo: nenhum. Não há chamada de IA nem serviço de terceiro.

Seed/fixture: sintético. O operador do e2e tem apelido `e2e-<aleatório>`, nome "Operadora sintética …", e-mail em `@turmma.invalid` e senha gerada (`e2e/__fixtures__/operacao.ts:52-57`). Ele é apagado com as linhas ligadas a ele no fim de cada teste.

Pergunta de fechamento: esta tarefa não acrescenta nada guardado sobre aluno nem envio nenhum. O que a secretaria pedisse sobre um aluno continua respondido como antes dela.

Bloqueantes: nenhum.

Recomendações:
1. Na entrada, quando o envio falha, a senha continua no estado da tela até a pessoa sair dela (`apps/web/src/operacao/paginas/Entrar.tsx:45-46`). Limpá-la também na falha é mais conservador para computador compartilhado. É de baixo impacto porque a senha fica só em memória.
2. `removerOperador` apaga `auditoria_operacao` só pelo operador alvo (`e2e/__fixtures__/operacao.ts:89`). Se houver linha em que o operador do e2e é o autor e o alvo é outro, ela sobra no banco de teste. Não é problema de privacidade; é a limpeza do compose que ele divide com a integração.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-24 06:41:19 · `tasks/prd-apresentacao-operacao/10_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. Houve uma divergência em relação à seção 9: o nome `operacao-*.js` vem do `chunkFileNames` e não do `manualChunks`. Ela está registrada em "Divergências resolvidas nesta tarefa" em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/10_task.md`, com o motivo técnico (no Rolldown do Vite 8, o grupo arrastaria React e os componentes da entrada para o chunk da operação). O que a spec pede continua valendo: teto próprio de 60 kB e a escola sem baixar a área. O B2 é provado sobre o build real.
Portão local: carimbo válido (typecheck, lint, test, e2e)
Bloqueantes: nenhum

Recomendações:
- **Atualizar a Tech Spec.** Trocar `manualChunks` por `chunkFileNames` na seção 9, "Orçamento", de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/techspec.md`. Hoje o texto da spec contradiz o código, e a próxima tarefa que ler a seção pode "corrigir" de volta.
- **Parte da área pode escapar do teto de 60 kB.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/nome-dos-chunks.ts` só dá o nome `operacao-` ao chunk cuja fachada está em `src/operacao/`. Se a área passar a importar uma dependência que só ela usa e o bundler separar essa dependência num `parte-*.js`, esse peso não é medido por nenhum dos dois tetos. Vale um teste no `nome-dos-chunks.test.ts` que some os chunks alcançáveis só a partir do `operacao-*`, ou pelo menos um registro do risco.
- **Código sem uso nesta tarefa em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/api/sessao.ts`.** `guardarDesafioDeOperador` e `esquecerDesafioDeOperador` são exportados e nada os chama; o comentário diz que servem ao aceite do convite da 11.0. É preparação de tarefa futura: devem entrar junto com a 11.0.
- **Mesmo caminho em dois lugares.** `BASE_DA_OPERACAO` está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/rotas.tsx` e em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/caminhos.ts`. A repetição tem motivo (a entrada não pode importar de `src/operacao/`). Mesmo assim, uma asserção no e2e ou no teste de chunks de que os dois valores são iguais evita que divirjam.
- **Guarda de arquitetura afrouxada para todo `e2e/`.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts:133` passa a tratar qualquer arquivo em `e2e/` como apoio de teste no C45, e não só `e2e/__fixtures__/`. Restringir o padrão a `^e2e\/__fixtures__\//` mantém a guarda sobre os próprios specs.
