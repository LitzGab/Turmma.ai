# Achados das revisões — `tasks/prd-apresentacao-painel/10_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-25 12:19:35 · `tasks/prd-apresentacao-painel/10_task.md`

VEREDITO: APROVADO

**Cenários exigidos**
- **Caminho feliz:** o convite com o link na tela segue até o configurar. O segundo fator abre a sessão. O Sair encerra a sessão.
- **Casos de borda:**
  - outro link colado na aba enquanto o aceite do link anterior ainda está no ar, tanto quando ele volta 200 quanto quando volta recusado;
  - senha errada na entrada: a senha não pode ficar no estado da tela, o que importa no computador de laboratório;
  - o chunk da operação que não carrega (rede da escola caindo) precisa de título na aba;
  - DDL escrito à mão nas migrations: `IF NOT EXISTS`, `"public".`, `RENAME TO`, `DROP` e `RENAME COLUMN` do `escola_id`, e um `CREATE TABLE` que o teste não consegue ler;
  - o seed do e2e precisa gravar o mesmo hash que o aceite procura.
- **Concorrência:**
  - clique duplo em "Entrar" do segundo fator e em "Sair";
  - duas chamadas em paralelo recebendo `ACESSO_VENCIDO`;
  - duas abas renovando ao mesmo tempo (Web Locks);
  - a vez seguinte sai de novo depois de uma falha.
- **Permissão e isolamento:** não se aplicam. A tarefa não cria endpoint, repository nem query sobre dado de escola. O único caso de perto é o W4 da A0: o segundo operador na mesma aba não vê nada do primeiro.

**Cobertos**
- **Renovações em paralelo:** `apps/web/src/operacao/api/sessao.test.ts`, "duas chamadas em paralelo que recebem ACESSO_VENCIDO", que já existia. O teste novo das duas abas (linhas 271-290) usa Web Locks falsas que respeitam a fila e dispara as duas renovações com `Promise.all` de verdade. Sem a trava, as duas renovações saem juntas e o teste fica vermelho.
- **Segundo fator:**
  - clique duplo com `Promise.all`: um pedido só, e os dois envios recebem a sessão aberta (sessao.test.ts:323);
  - depois de um 503 nos dois envios juntos, a tentativa seguinte sai (sessao.test.ts:334).
- **Sair:** dois Sair juntos fazem um pedido só e esquecem a sessão uma vez; o Sair da sessão seguinte sai de novo (sessao.test.ts:352).
- **Clique duplo no e2e:** `e2e/operacao.spec.ts:135` dispara os dois `click()` no mesmo `evaluate`, que é o caso que o botão desligado não segura. Confere um POST por rota. O recomeço com o Bruno na mesma aba entra e sai de novo.
- **Aceite antigo descartado:**
  - na unidade (`apps/web/src/operacao/api/convite-e-mfa.test.ts:90-139`): o 200 descartado não deixa o desafio na memória; o 404 descartado não vira "convite que não vale"; o par sem outro link vale, tanto o de sucesso quanto os de 404 e 503;
  - no e2e (`e2e/operacao-convite.spec.ts:240`): o aceite anterior fica segurado e volta 200 de verdade, a tela fica no link novo, e o link novo segue até o configurar.
- **Senha fora do estado:** no e2e (`e2e/operacao.spec.ts:61-64`), depois da falha o campo de senha fica vazio e com o foco, e o e-mail continua. A troca de unidade por e2e está justificada: não há DOM no Vitest.
- **Título da fronteira:** E4 confere o `toHaveTitle`.
- **Seed pelo hash do comando:** `e2e/__fixtures__/operacao.ts` usa `sortearTokenDeConvite` e `hashDoTokenDeConvite`, as mesmas peças de `apps/api/src/ops/operador.ts:141/147` e de `convite-operador.service.ts`. `e2e/__fixtures__/sessao.ts` usa `hashDoToken`. A prova inversa, com o seed gravando outro hash e o E1 vermelho, está documentada e faz sentido.
- **E5:** o identificador está no título do teste em `e2e/casca.spec.ts` e em `e2e/tokens.spec.ts`.
- **DDL escrito à mão:** `apps/api/test/arquitetura.test.ts:731-770` cobre cada forma do 10.4. Cobre também os falsos positivos: nome de restrição com `escola_id`, coluna `outra_escola_id`, e `CREATE TABLE` dentro de comentário, função ou texto. Os quatro `CREATE TABLE` ilegíveis lançam erro.
- Não há `.skip`, `.only`, `.fixme`, `any` nem `eslint-disable` no diff.
- Nenhum mock esconde a regra: o `fetch` falso e as Web Locks falsas estão fora do código testado. Nenhum teste chama provedor de IA.
- As mutações que você relatou batem com o que cada asserção prende.

**Bloqueantes**
Nenhum.

**Recomendações**
1. `apps/web/src/rotas.tsx:53`: o `componentWillUnmount`, que devolve o título ao sair da fronteira, não tem teste. Um e2e que sai da fronteira para uma rota fora da operação sem recarregar e confere o título fecharia isso.
2. `apps/api/test/arquitetura.test.ts:624-630`: `comandosDaMigration` tira os comentários `--` antes do texto entre aspas. Um texto com `--` dentro (`CHECK (x <> 'a--b')`) corta o resto da linha e pode esconder um `;` ou um `escola_id`. Inverter a ordem, ou tratar os dois numa passada só, com um caso de teste, evita isso.
3. `apps/api/test/arquitetura.test.ts:668`: `ADD COLUMN IF NOT EXISTS "escola_id"` é reconhecido pelo regex, mas nenhum caso positivo o prova.
4. `apps/web/src/operacao/paginas/Convite.tsx`: o `hashchange` não zera `aceitando`. Enquanto o aceite antigo está no ar, o botão do link novo continua desligado. Se esse aceite ficar pendurado até o timeout, a pessoa espera sem saber por quê. Dá para registrar como pendência, ou zerar junto com a `vezDoLink`.
5. `apps/web/src/operacao/api/sessao.test.ts:281`: a espera fixa de `setTimeout(10)` antes do `expect(renovacoes()).toBe(1)` funciona como asserção negativa, mas depende do relógio. Esvaziar as microtarefas de forma determinística deixaria o teste menos frágil.
6. `tasks/prd-apresentacao-painel/10_task.md:66`: a linha "seed pelo hash do comando" da tabela "Testes que provam a regra" ainda descreve a prova antiga. A seção de divergências explica a inversa; alinhar a tabela evita confusão no `/validar`.
7. Os checkboxes do "Critério de conclusão" do 10_task.md ainda estão em branco. Marcar antes do commit.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/api/sessao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/api/sessao.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/api/convite.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/api/convite-e-mfa.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Convite.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Entrar.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/rotas.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/titulo-da-operacao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/hash-do-token.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao.spec.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/operacao-convite.spec.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/operacao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts`

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-25 12:20:57 · `tasks/prd-apresentacao-painel/10_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo e nenhuma migration. O diff toca apenas no nome e no e-mail do operador Turmma, que já existiam e são dados da equipe, não do aluno. Todos os valores são sintéticos no seed do e2e (`Operadora sintética …`, `e2e-…@turmma.invalid`). Toca também na senha e no token de convite, que existem só em memória, e no `token_hash`, que continua SHA-256 de 256 bits sorteados.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. A tarefa não cria rota nem muda a autorização. O aceite continua respondendo `NAO_ENCONTRADO` do mesmo jeito para convite inexistente, usado, vencido ou revogado (C9). A web só passou a descartar a resposta de um link que a tela já largou.

Logs: limpos. O diff não adiciona nenhum `logger` nem `console`.

Auditoria: presente. Nenhuma ação desta tarefa exige auditoria pela regra 20, item 10: não há leitura de dado de aluno, exportação, nota, permissão nem aprovação de saída de IA.

Envio externo: nenhum.

Seed/fixture: sintético. `e2e/__fixtures__/operacao.ts` e `e2e/__fixtures__/sessao.ts` agora usam `sortearTokenDeConvite`, `hashDoTokenDeConvite`, `hashDoToken` e `BYTES_DO_TOKEN_DE_CONVITE` de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/hash-do-token.ts`. Esse arquivo depende só de `node:crypto`, então o seed não traz o Nest nem o banco da API. Nenhum ponto do repositório ainda importa esses símbolos de `convite.service.ts`.

Pontos de privacidade que conferi no código:
- **Senha na entrada.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Entrar.tsx`, `definirSenha('')` foi para o `finally` e roda também quando a entrada falha. O e2e (`e2e/operacao.spec.ts`) confere o campo vazio e com foco. Como o campo é controlado, campo vazio quer dizer estado vazio.
- **Aceite de link anterior.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/api/convite.ts`, `aceitarConviteDeOperadorNaVez` chama `esquecerDesafioDeOperador()` quando o aceite volta com sucesso depois de outro link, e o desafio do link anterior sai da memória. Na recusa, nenhum desafio chega a ser guardado. A senha já saía no `hashchange`. Isso está provado nos testes de unidade de `convite-e-mfa.test.ts` e no e2e de `operacao-convite.spec.ts`.
- **Título da fronteira de erro.** É fixo (`Não foi possível carregar · Operação Turmma`) e não leva dado de ninguém.
- **Clique duplo em "Entrar" (segundo fator) e em "Sair".** Sai um pedido só e a sessão é esquecida uma vez. O código do segundo envio não vai a lugar nenhum, porque o desafio já foi gasto. Isso não afeta exposição.
- **Nada salvo no navegador.** O desafio continua só em variável do módulo (`sessao.ts:76`), nunca em `localStorage`, `sessionStorage` nem URL.

Pergunta de fechamento: a tarefa não toca em dado de aluno nem em envio externo. A resposta à secretaria continua a mesma de antes, e nada aqui a piora.

Bloqueantes: nenhum.

Recomendações:
- `Convite.tsx`: o descarte só fica seguro porque `aceitando` não volta a `false` no `hashchange`. Com o botão desligado, o link novo não consegue fazer um aceite que guarde o desafio antes de o aceite anterior voltar e apagá-lo. Vale deixar essa dependência escrita num comentário junto ao `aoMudarOFragmento`, para que uma mudança futura que ligue o botão no `hashchange` não passe a apagar o desafio do link novo sem ninguém perceber.
- `aceitarConviteDeOperadorNaVez`: quando o aceite anterior deu certo no servidor, a conta dele fica com senha e sem segundo fator até alguém entrar por e-mail e senha. O docblock já diz isso. Vale registrar no runbook ou no `/validar` que um convite gasto desse jeito aparece como "usado" no painel.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-09-25 12:21:04 · `tasks/prd-apresentacao-painel/10_task.md`

VEREDITO: APROVADO

**Estados:** ok. Esta tarefa não cria tela nova. A fronteira do chunk tem o estado de erro com título na aba, "Tente de novo" e a mensagem dizendo o que fazer. A entrada, o convite (conferindo, não vale, falhou, criar a senha), o segundo fator e o Sair continuam com carregando, erro e dado. Não há lista, então não há estado vazio a conferir.

**Acessibilidade:**
- Depois da senha errada, o foco volta ao campo de senha. O `role="alert"` continua anunciando a falha e o e-mail digitado fica, o que é bom para quem usa teclado.
- A aba passa a ter título quando o chunk falha (`Não foi possível carregar · Operação Turmma`). A regra 50, item 11, fica coberta nesse caminho, e o E4 prova com `toHaveTitle`.
- Os campos continuam com rótulo visível. A troca de `ErroDaApi` pelo desfecho tipado não muda nada de ARIA.

**Chromebook fraco:**
- O mudança beneficia a máquina lenta. O clique duplo que chega antes de a tela desligar o botão agora sai como um pedido só, e a trava ficou na sessão (`sessao.ts:275-280` e `:466-476`), não no estado da tela.
- Nenhuma dependência nova, e `titulo-da-operacao.ts` fica fora de `src/operacao/`, então a divisão de chunks (B2) se mantém.

**Celular:** nenhum layout novo. Os e2e novos (clique duplo, aceite descartado, E4 com `larguraExcedente` 0) rodam nos projetos `chromebook` e `celular` pelo `acionar(..., hasTouch)`. O clique duplo por `evaluate` vale igual nos dois.

**Ação oficial protegida:** não se aplica, porque não há nota nem ação oficial. O que chega perto disso está certo: a resposta de um aceite feito com o link anterior não navega, não muda a tela e tira o desafio da memória (`convite.ts:122-135`). Há teste de unidade para os casos 200, 404 e 503 e um e2e com o 200 real segurado.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Botão "Salvando…" no link novo.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/operacao/paginas/Convite.tsx:73-86`, o `hashchange` não zera o `aceitando`. Enquanto o aceite do link anterior estiver no ar, o formulário do link novo mostra "Salvando…" com o botão desligado, e o `status` do leitor de tela também diz "Salvando…", sem que essa pessoa tenha clicado. Como o `chamarApi` não tem prazo, numa rede de escola travada isso pode durar. O defeito já existia antes da tarefa e é raro. Um caminho é o aceite descartado não pesar no `aceitando` do link novo, por exemplo guardando a vez junto com o `aceitando`.
2. **Título perdido em erro de página já carregada.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/rotas.tsx:499-506`, o título é definido em `componentDidCatch`, que roda na fase de layout. Se o erro vier de uma página da operação já montada (e não do chunk), a limpeza do `useTituloDaPagina` dessa página roda depois, na fase passiva, e devolve o título anterior por cima do da fronteira. O caso do chunk, que é o escopo e está provado pelo E4, não é afetado. Um componente de função com `useEffect` dentro do conteúdo da fronteira cobriria os dois casos.
3. **Foco na senha no celular.** No Android, o `focus()` programático depois da falha abre o teclado. Numa tela de 360 px, vale conferir num print do projeto `celular` que o alerta de "E-mail ou senha incorretos" continua visível acima do teclado.

Os três entram como registro para o `/validar` e o `/retro`.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-25 12:21:10 · `tasks/prd-apresentacao-painel/10_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, test, e2e)")
Bloqueantes: nenhum

As quatro subtarefas cobrem as linhas da tabela "Pendências para a A0b" que cabem aqui: as de origem 10.0, 11.0, `/validar` e a da correção de 24/09. Nada da API ou do worker da 9.0 entrou, e as telas da A0b ficaram de fora. A tarefa se afasta da letra em quatro pontos. O clique duplo foi travado na sessão, e não na tela. A prova de "senha fora do estado" é e2e, e não de unidade. A prova do seed pelo hash foi invertida. O hash saiu para `hash-do-token.ts`. Os quatro estão explicados em "Divergências" do `10_task.md`, e a mudança de comportamento foi registrada na seção 9 da `techspec.md`. Não é divergência calada.

Procurei um caso de corrida no convite: um aceite descartado que apagasse o desafio do link novo. Pela interface, ele não acontece. O `aceitando` não volta a `false` no `hashchange`, e o `enviar` sai direto enquanto ele vale. Então o aceite do link novo só pode sair depois que o anterior volta.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/hash-do-token.ts:3-7`: o comentário do topo do arquivo ficou solto, separado por uma linha em branco e seguido de outro docblock. Junte os dois ou transforme o primeiro em comentário de módulo.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/titulo-da-operacao.ts:5`: `SUFIXO_DO_TITULO` é exportado e ninguém mais o importa. Pode ser constante local.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts`, `comandosDaMigration`: os comentários `--` são removidos antes do texto entre aspas. Um literal como `DEFAULT '--'` corta a linha e desalinha as aspas, e aí `tabelasSemEscola` lê errado o resto da migration (ou falha, ou erra a conta). Hoje não existe esse caso. Vale citar no docblock ou tirar o texto entre aspas e o comentário numa passada só.
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts:218`: o seed do convite de coordenador repete `randomBytes(BYTES_DO_TOKEN_DE_CONVITE).toString('base64url')`, que o `convite.service.ts` já repete em dois lugares. Um `sortearTokenDeConvite` em `hash-do-token.ts` fecharia a mesma lacuna que a 10.3 fechou para o operador.
- `apps/web/src/operacao/paginas/Mfa.tsx` e o "Sair" da casca: o `if (entrando) return` e o `if (saindo) return` agora são redundantes com a trava da sessão. Podem ficar como defesa, mas um comentário dizendo quem de fato segura o clique duplo evita que alguém confie neles.
