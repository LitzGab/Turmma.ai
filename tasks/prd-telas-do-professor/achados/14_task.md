# Achados das revisões — `tasks/prd-telas-do-professor/14_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-19 06:07:13 · `tasks/prd-telas-do-professor/14_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. A tela passa a mostrar no painel ao lado dados que já existiam: nome do aluno, motivo do destaque, acertos, respostas por questão e o histórico de acertos nos lotes já aprovados. Tudo isso vem de `RespostaDestaqueAberto`, que não mudou. O único dado novo no endereço é o `alunoId` (UUID) em `?ver=`. Nenhum nome vai para a URL (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/aprovar.ts:858-860`).

Fora da tabela de dados do docs/lgpd.md: nada. Não há migration, DTO nem campo novo. Nada mudou em `apps/api` nem em `packages/shared`.

Autorização por objeto: ok.
- `?ver=` com id que não está no lote (de outra turma, de outra escola ou inventado) não abre painel e não chama a API. É a mesma resposta de quando o id não existe (`aprovar.ts:874-879`, coberto por `aprovar.test.ts` › "só abre destaque do lote e já aberto").
- `?ver=` de destaque ainda fechado também não abre nem registra nada. O e2e confere isso com `pedidosEm(/abrir$/)` igual a 0.
- A rota `POST …/destaques/:alunoId/abrir` continua com escopo de escola e ano no repository (`apps/api/src/atividade/correcao.repository.ts:260-276`) e com a busca pelo alcance da professora (`correcao.service.ts:128-132`). Aluno sem destaque responde `NAO_ENCONTRADO`, igual ao inexistente.
- O e2e da segunda professora prova que ela vê "Esta correção não está disponível" e que nem a tela nem o cache de consultas guardam nome de aluno, id de aluno ou título da atividade (`e2e/professor-aprovar.spec.ts`, primeiro caso).

Logs: limpos. O diff não acrescenta `console.*` nem telemetria. O e2e passou a varrer o console da web atrás de nome de aluno (`semNomeDeAluno`).

Auditoria: presente.
- Abrir um destaque grava `correcao.destaque_aberto` só na primeira abertura (`correcao.service.ts:136-138`).
- Recarregar com `?ver=` de destaque já aberto chama a mesma rota. Como o `update` filtra por `isNull(destaqueAbertoEm)`, a releitura não cria outro registro nem troca a primeira hora.
- A aprovação do lote e o registro de validação (D56) continuam como estavam.
- Não há leitura por coordenação ou rede neste caminho.

Envio externo: nenhum. A tarefa só mexe na tela e não chama IA.

Seed/fixture: sintético ("Ana Sintética", "Bruno Sintético", "Caio Sintético" e outros, em `Aprovar.test.tsx`, `e2e/__fixtures__/professor/aprovar.ts` e `e2e/professor-aprovar.spec.ts`).

Bloqueantes: nenhum.

Recomendações:
1. **Referrer-Policy explícita.** Agora o `alunoId` aparece na URL da tela (`?ver=`). Não há `Referrer-Policy` declarada em `apps/web/index.html` nem na API. O padrão dos navegadores (`strict-origin-when-cross-origin`) já não manda o caminho nem a query para outro domínio, mas vale fixar `same-origin` ou `no-referrer` para não depender do navegador. O destino natural é a tarefa de staging ou de cabeçalhos de segurança.
2. **Releitura com `?ver=` pela rota de escrita.** Ver de novo um destaque já aberto chama um `POST` que pode registrar abertura. Isso funciona porque o `update` é condicional, e a divergência está registrada em `techspec.md` §9, item 1. O risco é uma mudança futura na rota passar a gravar auditoria toda vez. Quando a API ganhar uma rota só de leitura, vale trocar. Até lá, falta um teste de integração na API que prove que a segunda chamada não grava outro `correcao.destaque_aberto`. Pode já existir da tarefa 11.5, mas não conferi.
3. **Lista de proibidos do e2e.** O e2e tem a própria lista de palavras proibidas, com `pontuaç`, enquanto `aprovar.test.ts` usa `pontua`. Vale juntar as duas num só lugar (por exemplo `cena.ts`, onde ficava o `VOCABULARIO_DE_NOTA`), para não divergirem.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 06:07:16 · `tasks/prd-telas-do-professor/14_task.md`

VEREDITO: APROVADO

Tela vista: não. A Mesa avisou que a tela fica em "Carregando a correção…" nas fotos dela e que o comando `foto` entrou com a sessão da escola anterior, então não tentei de novo. Li 4 fotos do Implementador em `.processo/vitrine/`, como apoio só: `aprovar-1-destaques--celular.png`, `aprovar-2-painel--celular.png`, `aprovar-1-destaques--chromebook.png` e `aprovar-2-painel--chromebook.png`. Não li as fotos de Outras e Resumo, e não há foto da escola vazia. A revisão vale pelo código, pelo `docs/interface.md` e pelos specs.

- **Faixa de números e abas:** na foto, a faixa e as abas batem com o código.
- **Painel:** o painel de destaque aberto no computador (coluna de 480 px) e a folha de baixo no celular batem com `PainelLado`.
- **Barra presa:** nas fotos de página inteira a barra e a barra de baixo aparecem no meio da página. Isso é efeito do `sticky` na captura; a medida real está nos e2e (abaixo).

Estados: ok.
- Carregando: `Aprovar.tsx:241-242`.
- Correção que não existe, igual para outra turma e outra escola: `:243-244`.
- Erro com "Tentar de novo": `:245-246`.
- Com dado.
- Lote já decidido, sem barra.
- Erro ao abrir destaque, na linha e no painel.
- Cobertos em `Aprovar.test.tsx:122-176`.

Acessibilidade: ok.
- Abas com rótulo de grupo.
- O botão oficial desligado leva `aria-describedby` apontando o contador, que diz por quê.
- O painel é `<dialog>` modal, com foco no miolo, Esc e "Fechar" de 44 px.
- O foco volta a quem abriu, ou ao `focoDeReserva`.
- `BarraPresa` reserva `scroll-padding-bottom`, então o foco não fica atrás dela.
- Cada linha de destaque é um botão único, sem controle dentro.
- Os testes rodam `violacoesGraves` (axe) nos dois projetos.

Chromebook fraco: ok.
- Sem animação de largura ou altura.
- Barra com fundo cheio, sem vidro.
- Abertura de destaque presa por `useRef` contra duplo clique.
- Leitura do destaque aberto feita só uma vez, também no modo estrito.
- A lista de destaques é curta por natureza.
- Não medi throttling.

Celular: ok pelo código e pelos e2e.
- Faixa em uma coluna abaixo de `sm`.
- Barra com `bottom: var(--barra-baixo)`, acima da barra de baixo.
- `casca-no-celular.spec.ts:141` e `pecas-superficies.spec.ts` medem isso para "Aprovação do lote".
- Painel vira folha de até 88% da altura, medida em `professor-aprovar.spec.ts:184-196`.
- Tabela do painel vira lista abaixo de 768 px.
- Os e2e checam `larguraExcedente` igual a 0 e `larguraExcedenteDoDialogo` igual a 0.
- Alvos: botões de 44 px e a linha inteira clicável, como na foto do celular.

Ação oficial protegida: sim.
- **Botão oficial:** é o único da tela. Quem o liga é `dados.podeAprovar`, da API, e não a contagem da tela (mutação em `14_task.md:215-222`).
- **Confirmação:** o diálogo mostra a atividade, a turma, quantas correções e o efeito (`resumoDoLote`, `EFEITO_DE_APROVAR_O_LOTE`) antes de aprovar.
- **Duplo clique:** `decidindo.current` evita aprovação dupla.
- **Registro:** a tela mostra "Validação registrada por … · quando" depois.
- **Rejeitar:** é `perigo` e exige justificativa de 8 a 500 caracteres.
- **Lote que mudou:** vira aviso calmo (`CONFLITO`), com a tela relida e nada aprovado.
- **Sessão vencida:** com a confirmação aberta, ela não aprova sozinha (e2e `professor-aprovar.spec.ts`, caso do 401).
- **Abertura registrada:** `?ver=` de destaque fechado ou de id que o lote não tem não abre painel e não chama a rota (`aprovar.ts` `destaqueDoEndereco`; e2e confirma zero pedidos a `abrir`).
- **Vocabulário:** o e2e varre as três abas e o diálogo por "nota", "conceito", "pontuação", "média" e "ranking". "Acerto médio" é o rótulo pedido e não cai na regex.
- **IA:** a tela leva `AssinaturaIA` com o selo.
- **Log:** o e2e confere que nenhum nome de aluno vai ao console da web.

Bloqueantes: nenhum.

Recomendações:
1. `aprovar.ts`, `NOME_DO_MOTIVO_DE_DESTAQUE` e `EXPLICACAO_DO_MOTIVO`: a linha do Bruno diz "Muito fora do histórico do aluno" (visto na foto do celular) e o painel traz "Nas correções aprovadas antes". É anterior a esta tarefa e vem da API. O fora de escopo da 14.0 tira "Abaixo/Acima do costume" por ser comparação com o histórico do aluno (D60). Vale confirmar no `/validar` ou no `/retro` se esse motivo já passou pela AIA.
2. `docs/interface.md`: a faixa de três números, mais as abas, mais a barra deixam só meia linha de destaque à vista a 1366 × 768 (foto do computador). Não há medida de rolagem para Aprovar, então fica como observação, não como defeito.
3. A mutação de `?aba=` desconhecido está coberta. Um e2e que meça `getBoundingClientRect` da barra presa contra a barra de baixo na própria tela Aprovar a 360 px deixaria a linha "360 px" do quadro de testes da tarefa provada nela e não só na casca.

Arquivos principais:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Aprovar.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/aprovar.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/e2e/professor-aprovar.spec.ts`

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-19 06:07:47 · `tasks/prd-telas-do-professor/14_task.md`

VEREDITO: APROVADO

Não há bloqueante. A tarefa 14.0 mexe só na tela e não toca nenhum caminho de escrita, de aprovação ou de auditoria da API. As fotos da tela não vieram, então a revisão foi feita pelo código e pelos specs. Rodei os testes de unidade e de componente de Aprovar e passaram (39 de 39).

- **Caminhos de escrita em Nota:** nenhum novo. A tela continua chamando só `aprovarLote` e `abrirDestaque`, pela API. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/api/src/atividade/correcao.service.ts:85`, quem aprova é o usuário da sessão, e nenhum job ou rotina chama `aprovarLote`. Todos com autor humano? Sim.
- **Decisão autônoma sobre aluno:** ausente. A aba Outras sai em ordem de nome, nunca de acerto (`aprovar.ts`, `outrasEmOrdemDeNome`), e há teste para isso nas duas camadas.
- **Aprovação registrada:** ok.
  - Só a API liga o botão oficial (`Aprovar.tsx:421`, `disabled={!dados.podeAprovar}`), e uma mutação prova isso.
  - O botão fica na barra presa, fora das abas, então aparece nas três.
  - A confirmação continua dizendo a atividade, a turma, quantas correções e o que vai acontecer.
  - "Rejeitar a correção" exige justificativa.
  - O e2e prova "Validação registrada por … · quando" e que a sessão vencida com a confirmação aberta não aprova sozinha.
  - O `?ver=` de destaque ainda fechado não abre o painel e não chama a rota. O de destaque já aberto chama `POST …/abrir`, que não registra outra abertura nem muda a hora, porque só grava quando `destaqueAbertoEm === null` (`correcao.service.ts:133-138`).
- **Supervisão do tutor:** não se aplica a esta tarefa.
- **Autonomia declarada e visível:** não se aplica a esta tarefa. A `AssinaturaIA` com o selo continua no alto da tela.
- **D55 e D46:** sem nota, conceito ou sugestão de nota. A tela é só de objetiva. "Média de acertos" virou "Acerto médio" e conta questões. Os testes de unidade e o e2e varrem nota, conceito, pontuação, média e ranking nos textos novos.
- **D45 e D64:** nada mede o professor.

Bloqueantes: nenhum.

Recomendações:
1. **O painel do destaque não tem o selo de IA.** Em `Aprovar.tsx:407-423`, o `PainelLado` é modal. No celular ele cobre até 88% da altura, e a `AssinaturaIA` da página fica atrás do véu ou fora da vista. Vale pôr o selo, ou a linha "Corrigido pelo Assistente", no cabeçalho do painel. A regra 70, item 4a, pede que toda saída de IA seja rotulada.
2. **O aviso do gabarito ficou dentro do Resumo.** "Pode ter o gabarito errado" saiu da página única e foi para a aba Resumo, que o professor pode nunca abrir. Antes ele também podia aprovar sem rolar a página até ali, então a tela não perdeu nenhuma garantia. Ainda assim, o registro da validação (D56) guarda a distribuição como "apresentada". Para a validação continuar efetiva, um caminho é citar o aviso no apoio da aba Destaques ou no diálogo de aprovar. Não sugiro registrar quais abas o professor abriu, porque isso começa a medir o professor (regra 70, item 8).
3. **Quem abriu o destaque fica fora da validação.** Isto vem de antes da tarefa e ela não piorou. Se dois professores da mesma turma e disciplina alcançam o lote, um pode abrir os destaques e o outro aprovar. O registro da validação guarda a hora de cada abertura, mas não quem abriu. Fica para o `/retro`, como pergunta sobre a D56: o destaque precisa ser aberto por quem aprova?

Arquivos revisados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Aprovar.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/aprovar.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/aprovar.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Aprovar.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/e2e/professor-aprovar.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/api/src/atividade/correcao.service.ts` (só leitura, para conferir que reabrir não registra de novo)

## revisor-geral · 1ª rodada · APROVADO · 2026-10-19 06:08:13 · `tasks/prd-telas-do-professor/14_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

As seis divergências e os nomes que mudam estão em `techspec.md` §9, linhas 180 a 188 e 203 a 205. Esta spec não tem `cenarios.md`. Conferi na API o que sustenta a divergência (1): em `apps/api/src/atividade/correcao.service.ts:133-141`, o destaque já aberto é devolvido sem gravar outra auditoria, e o fechado num lote já decidido responde `ENTREGA_JA_DECIDIDA`. A troca de `a3-a4-professor.spec.ts` e `roteiro-da-demonstracao.spec.ts` para as fixtures é a que a §10 e o "Como testar" da tarefa pedem.

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Aprovar.tsx:178`: `mostrar` guarda o `busca` do momento do clique e só navega quando a abertura volta da API. Se a professora trocar de aba enquanto o pedido ainda está no ar, a navegação volta a aba anterior. Monte o endereço a partir do endereço atual (por exemplo `window.location.search`) dentro do `onSuccess`, e não do que o clique guardou.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/e2e/__fixtures__/professor/aprovar.ts:33`: `abrirTodosOsDestaques` é exportada e nenhum spec a usa. Use-a nos laços repetidos de `a3-a4-professor.spec.ts:108` e `roteiro-da-demonstracao.spec.ts:494`, ou apague-a.
3. A lista de palavras proibidas agora existe de dois jeitos. Em `e2e/professor-aprovar.spec.ts:20` e `apps/web/src/areas/professor/aprovar.test.ts:31` está o `VOCABULARIO_PROIBIDO`, que já inclui média e ranking. Em `e2e/__fixtures__/professor/cena.ts:16`, `e2e/a3-a4-professor.spec.ts:19` e `e2e/roteiro-da-demonstracao.spec.ts:63` continua o `VOCABULARIO_DE_NOTA`, sem média nem ranking. Ponha a lista ampliada em `cena.ts` e use-a nos três specs, como pede o RF21.
4. Não achei e2e que prove "a 360 px a barra presa fica acima da barra de baixo", um cenário da tabela da tarefa. Quem cobra é o `test-engineer`; fica aqui só como aviso.
5. Na segunda pessoa (`e2e/professor-aprovar.spec.ts`), o caso apaga o lote da API simulada (`api.correcoes.delete`) antes de ela entrar. Assim, o "não está disponível" vem do falso e não prova que o lote de uma professora fica fora do alcance da outra. Também é do `test-engineer`.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-19 06:08:48 · `tasks/prd-telas-do-professor/14_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** os dez da tabela da 14.0. São eles: o oficial desligado nas três abas, que só `podeAprovar` liga; abrir registra uma vez; a confirmação; nenhum botão laranja; o vocabulário; os estados; a aba pelo endereço; o lote mudou; o recomeço; e os 360 px. Somam-se os casos de borda: dois cliques ao mesmo tempo, dois alunos com o mesmo nome, `?ver=` com id de outra turma ou de outra escola, aluno transferido (os corrigidos passam da turma de hoje), lote já decidido e sessão vencida com a confirmação aberta.

**Cobertos:**
- **O oficial desligado:** `Aprovar.test.tsx:181-214`, nas três abas, com `podeAprovar` falso mesmo com tudo aberto, e com bloco de mutação.
- **Dois cliques mandam uma abertura:** `Aprovar.test.tsx:245` e e2e `:916`, cada um com um bloco.
- **`?ver=` de destaque fechado ou de id que o lote não tem:** `Aprovar.test.tsx:275` e `:288`, e e2e `:850`.
- **A confirmação:**
  - os dois cliques em aprovar e o registro "Validação registrada por …", no e2e `:238-257`;
  - a sessão vencida com a confirmação aberta, no e2e `:289-311`;
  - o lote mudou e a justificativa mínima, no e2e `:276` e `:318`.
- **Nenhum laranja e um único oficial:** `Aprovar.test.tsx:227`.
- **O vocabulário:** `aprovar.test.ts:480`, com a ordem por nome e o desempate pelo id para nome igual.
- **Estados:** `Aprovar.test.tsx:123-177`.
- **A aba pelo endereço:**
  - o `replace` e a aba desconhecida, no componente e no e2e (`history.length`);
  - o recarregar que mantém a aba e os destaques abertos, no e2e `:959`;
  - a segunda professora sem nada no cache, no e2e `:856-878`;
  - nenhum nome de aluno no console, no e2e `:260`.
- **Painel em folha de baixo e sem rolar de lado:** e2e `:926-940`.
- **A barra presa acima da barra de baixo a 360 px:** já provada em `e2e/casca-no-celular.spec.ts:130`.
- **Lote já decidido:** `Aprovar.test.tsx:216`.
- **Aluno transferido:** `aprovar.test.ts:546`.

Os dois arquivos de componente e de unidade passam (39 de 39). Não há `.skip`, `.only` nem mock de código nosso. A rede falsa responde por caminho.

**Bloqueantes:**

1. **O efeito em `Aprovar.tsx:164-168` é cláusula nova sem bloco em "Mutações", e o teste que diz cobri-lo não chega à guarda dele.**
   - **O que o efeito faz:** é o que lê as respostas de um destaque já aberto quando ele vem pelo endereço (`?ver=`). Ele está no cenário "abrir registra uma vez" e na divergência 1.
   - **Duas cláusulas dele sem bloco:**
     - `abertos[verId] !== undefined`: sem ela, cada leitura que dá certo dispara outra, sem parar;
     - `emAbertura.current.size > 0` dentro do efeito.
   - **Por que o teste não chega lá:** o teste `Aprovar.test.tsx:300` diz provar a leitura única "até com os efeitos em dobro do modo estrito".
     - No React 19 o modo estrito só repete o efeito na montagem.
     - Nesse momento o `QueryClient` é novo (`renderizarTela`), `dados` ainda é `undefined` e `verId` é `undefined`, então as duas execuções saem logo na primeira condição.
     - Quando o lote chega, o efeito roda uma vez só, e `mutate` é estável.
     - Tirar `emAbertura.current.size > 0` do efeito deixa esse teste verde. Ele não falharia sem a regra que o nome dele promete.
   - **Correção exigida:**
     - (a) acrescentar em "Mutações" um bloco que tire `abertos[verId] !== undefined` da condição do efeito, citando `Aprovar.test.tsx › recarregar com \`?ver=\` de destaque já aberto lê as respostas uma vez só`;
     - (b) para a guarda `emAbertura` do efeito, uma de duas saídas:
       - escrever um cenário que chegue nela, com bloco: por exemplo, a abertura do Bruno segura na rede e `navigate` da `memoryLocation` para `?ver=<ANA>` com a Ana já aberta no lote, conferindo que não sai uma segunda abertura enquanto a primeira está no ar;
       - ou tirar a guarda e corrigir o nome do teste `:300`, que hoje promete o que não prova.

**Recomendações:**
- **Clique perdido:** `Aprovar.tsx:157` engole sem aviso o clique num segundo destaque enquanto outro está abrindo. Com a rede da escola lenta, a professora clica no Bruno e nada acontece. Vale ao menos manter o "Abrindo…" visível em todas as linhas, ou enfileirar o clique, para o `/validar`.
- **Teste da abertura que falha:** `Aprovar.test.tsx:264` diz que "o destaque continua fechado", mas não confere `data-destaque="fechado"` nem o texto "Falta abrir".
- **Duas cláusulas de tela sem bloco:**
  - `mostrar`, que não acrescenta passo no histórico quando o endereço já mostra o destaque (`Aprovar.tsx:155`, provada em `:324`);
  - a guarda `doPainel?.alunoId !== destaque.alunoId`, que impede o aviso repetido na linha (`:225`, provada em `:318`).

  Não são regras de negócio, mas um bloco para cada uma custa pouco.
- **Barra a 360 px fora do portão:** a prova está só em `casca-no-celular.spec.ts`, que a tarefa não alterou, então só a esteira a roda. Uma conferência a 360 px com a aba Resumo aberta, em `professor-aprovar.spec.ts`, deixaria o caso "nas três abas" provado também no celular.
- **Limite de 500 caracteres:** não é exercido nesta tela. Ele já existe antes desta tarefa, mas o cenário "rejeitar exige justificativa de 8 a 500" da tabela fica coberto só no mínimo.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Aprovar.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Aprovar.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/aprovar.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/aprovar.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/e2e/professor-aprovar.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/e2e/__fixtures__/professor/aprovar.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/prd-telas-do-professor/14_task.md`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-19 06:22:12 · `tasks/prd-telas-do-professor/14_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum
Recomendações:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/e2e/professor-aprovar.spec.ts:96-101`, os valores de reserva `presa?.y ?? 0` e `debaixo?.y ?? 0` deixam a conta seguir quando a caixa é nula. Os `expect(...).not.toBeNull()` logo acima já barram esse caso, então não há falso verde. Mesmo assim, ler a conta com `presa!`/`debaixo!` depois da asserção, ou com um guarda explícito, mostra melhor a intenção.

O que conferi nesta rodada:
- **Arquivos de código:** `Aprovar.tsx` e `aprovar.ts` não têm nada novo desde a rodada aprovada. Só mudaram os testes, a fixture e o documento da tarefa.
- **As quatro mutações novas em `14_task.md`:** o texto de cada uma bate com a linha atual de `Aprovar.tsx`, nas linhas 178, 188 (duas mutações) e 291. Cada uma cita um teste que existe em `Aprovar.test.tsx`.
- **Cenário novo da abertura no ar:** o teste vai a vermelho com a mutação que tira `emAbertura.current.size > 0` da linha 188. Com a mutação que tira `abertos[verId] !== undefined`, o teste renomeado vai a vermelho.
- **Teste da abertura que falha:** confere `data-destaque="fechado"` e "Falta abrir". Os dois vêm do código real: `Aprovar.tsx:284` e `aprovar.ts:75`.
- **`abrirTodosOsDestaques`:** foi apagada e não tem mais uso em `e2e/` nem em `apps/`, então não ficou código morto.
- **`secoes`:** já é exportada por `e2e/__fixtures__/casca.ts:40`.

## test-engineer · 2ª rodada · APROVADO · 2026-10-19 06:22:41 · `tasks/prd-telas-do-professor/14_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 1ª rodada. Nesta rodada, as duas cláusulas do efeito em `Aprovar.tsx:187-191` e as recomendações que chegaram à ordem.

Cobertos:
- **Correção 1(a), feita.** "Mutações" ganhou um bloco que tira `abertos[verId] !== undefined` da condição do efeito. Ele cita o teste `recarregar com ?ver= de destaque já aberto lê as respostas uma vez só` (`Aprovar.test.tsx:305`). O teste chega à cláusula: sem ela, a leitura que dá certo muda `abertos` e limpa `emAbertura`, o efeito roda de novo e manda outra leitura. Com isso, a asserção de uma chamada só (`:311`) fica vermelha. O nome deixou de prometer o "modo estrito" que o teste não provava.
- **Correção 1(b), feita pelo caminho do cenário.** O teste novo `com uma abertura no ar…` (`Aprovar.test.tsx:314`) faz o seguinte:
  - segura a abertura do Bruno na rede;
  - navega para `?ver=<ANA>` com a Ana já aberta no lote, o que deixa `verId = ANA` e `abertos[ANA]` vazio, exatamente a situação em que só a guarda `emAbertura.current.size > 0` segura o efeito;
  - confere que não saiu uma segunda leitura (`:326`) e que, quando o Bruno termina, o painel é o dele (`:329-330`).
  
  Sem a guarda, a leitura da Ana sai e `:326` fica vermelho pelo motivo certo. O bloco dela está em "Mutações".
- **Recomendações da 1ª rodada, as três aplicadas:**
  - A abertura que falha agora confere, na linha do Bruno, `data-destaque="fechado"` e "Falta abrir" (`:274-277`).
  - `mostrar` e a guarda `doPainel?.alunoId !== destaque.alunoId` ganharam bloco, os dois citando `a leitura do painel que falha…` (`:333`). O teste chega às duas: o histórico não ganha passo (`:348`) e há um só alerta (`:342`).
  - A barra presa a 360 px é conferida em `e2e/professor-aprovar.spec.ts`, na aba Resumo, antes e depois de rolar até o fim, acima da barra de baixo e à vista.
- **A função apagada da fixture.** `abrirTodosOsDestaques` saiu de `e2e/__fixtures__/professor/aprovar.ts`, e nenhum arquivo usa mais esse nome.
- **Testes.** Rodei `Aprovar.test.tsx` e `aprovar.test.ts`: 40 de 40 verdes. Rodei `Aprovar.test.tsx` de novo e deu 21 de 21, estável.
- **Proibidos.** Não há `.skip`. A rede falsa responde por caminho, e nenhum mock nosso esconde a regra.

Bloqueantes: nenhum.

Recomendações:
- Em `Aprovar.test.tsx:322-325`, a espera fixa de 30 ms prova a ausência da segunda leitura só dentro dessa janela. Como o efeito roda de forma síncrona depois do render dentro do `act`, a janela basta. Mesmo assim, um comentário dizendo por que 30 ms bastam ajudaria quem ler o teste depois.
- Na barra a 360 px (`professor-aprovar.spec.ts`, dentro do `if (hasTouch)`), a conta usa `?? 0` e `?? -1` depois de conferir que a caixa não é `null`. Funciona, mas um `if (presa === null || debaixo === null) throw` como o que o painel já usa deixaria a falha mais clara.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Aprovar.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Aprovar.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/e2e/professor-aprovar.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/prd-telas-do-professor/14_task.md`
