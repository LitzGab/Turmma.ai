# Achados das revisões — `tasks/correcoes/2026-10-28-onca-do-mockup.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-28 20:22:23 · `tasks/correcoes/2026-10-28-onca-do-mockup.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok (não se aplica, a correção não cria rota nem limite)
Fila e prioridade: ok (não se aplica, não há job)
Concorrência: protegida (não se aplica, não há escrita no servidor)
Índice e paginação: ok (não se aplica, não há query)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica, não há código novo no servidor)
Bloqueantes: nenhum
Recomendações:
- O avatar do agente (`/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/CabecaOnca.tsx`) agora desenha mais formas, e cada instância tem seus próprios `clipPath` gerados por `useId`. Numa conversa longa do tutor, com dezenas de avatares, isso pesa no computador fraco da escola. Vale medir no Chromebook de referência (a regra é a D51) se a rolagem da conversa continua fluida, e anotar o resultado no relatório da correção. Não muda nada no servidor.

Nenhuma das 23 alterações toca a API, o worker, o realtime, a fila, a porta de IA, o banco, a infra ou o deploy. O único estado novo é uma marca no `sessionStorage` do próprio navegador (`turmma-onca-acenou`, em `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/movimento-da-onca.ts`). Ela não depende de instância do servidor e não carrega dado pessoal. Os temporizadores do piscar são limpos quando a onça sai da tela e param depois de quatro piscadas. As peças novas ficam fora do primeiro carregamento (`/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/nome-dos-chunks.ts`), então o login das 7h30 não fica mais pesado.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-28 20:22:26 · `tasks/correcoes/2026-10-28-onca-do-mockup.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A correção só mexe no desenho da onça: SVG, CSS, o movimento, o token `onca-chao` e a pose `pensando` no passo da letra. Nenhuma migration, nenhum DTO, nenhuma rota, nenhum campo de pessoa.

Fora da tabela de dados do docs/lgpd.md: nada. O único dado que a correção grava é a chave `turmma-onca-acenou`, com valor `'1'`, no `sessionStorage` (`/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/movimento-da-onca.ts:9` e `:29`). Ela só marca "a onça já acenou nesta aba". Não guarda id, não guarda papel, não identifica ninguém, some quando a aba fecha e nunca sai do navegador. Não é dado pessoal.

Autorização por objeto: ok. Não há rota nem objeto novo. O `AvatarAgente` e a `Onca` recebem só `agente`, `pose`, `tamanho` e `animada`.

Logs: limpos. Nenhum `console` e nenhum logger na pasta `componentes/ui/onca/`.

Auditoria: não se aplica. Nenhuma ação que a regra 20, item 10, manda auditar.

Envio externo: nenhum. Sem `fetch`, sem URL externa, sem chamada de IA. O mockup é copiado, não importado: nenhum import de `mockups/` nesta pasta nem em `__fixtures__/`.

Seed/fixture: sintético. O arquivo novo `apps/web/src/__fixtures__/ids-do-desenho.ts` só normaliza `id` de SVG. O nome "Lia" no e2e já existia na galeria e é fictício.

Pergunta de fechamento: a correção não muda o que o sistema guarda sobre um aluno nem para onde isso é enviado. A resposta continua a mesma de antes.

Bloqueantes: nenhum.

Recomendações:
- Se a revisão da regra 20 um dia listar o que o produto grava no navegador, pôr a chave `turmma-onca-acenou` nessa lista como item técnico, sem dado pessoal. Assim ela não vira dúvida numa auditoria da escola.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-28 20:22:50 · `tasks/correcoes/2026-10-28-onca-do-mockup.md`

VEREDITO: AJUSTES NECESSÁRIOS

Tela vista: sim (15 fotos lidas, cheia e vazia, computador e celular, nos três papéis). Fotografei também o passo da letra do aluno, com a pose `pensando`: `aluno--aluno-bem-vindo--Continuar-Continuar-Continuar--computador.png` e `--celular.png`. A `Comemoracao` não foi fotografada e foi revista pelo código e pelos testes.

- A onça saiu como a do mockup: corpo e cabeça numa forma só, máscara clara, pintas, rabo com anéis, sombra do chão, pata com o punho.
- O avatar mostra a cabeça neutra recuada do anel, e o nome da função com o selo "IA" aparece junto.
- O balão de três pontos e o olhar para cima do `pensando` estão legíveis e dentro do quadro.

Estados: ok. A tarefa não muda nenhum dos quatro estados das telas de boas-vindas. A onça é só desenho, sem dado nem chamada. O carregando e o erro não aparecem na vitrine e não foram alterados.

Acessibilidade: ok.
- O SVG é `aria-hidden`, sem alvo interativo; os `onPointerEnter` e `onFocus` não foram trazidos, como a tarefa disse.
- O nome acessível continua sendo a função, nunca "onça".
- O `prefers-reduced-motion` desliga o CSS (`Onca.css`, última regra), e o piscar e o acenar nem são agendados (`movimento-da-onca.ts`).
- O foco visível do título aparece nas fotos.

Chromebook fraco: ok. As peças novas (`geometria`, `movimento-da-onca`) ficam fora do primeiro carregamento (`nome-dos-chunks.ts`). O movimento é só `transform` e `opacity`. O único temporizador é o do piscar, no máximo quatro vezes.

Celular: ok. Nas fotos de 360 px não há rolagem horizontal nem corte, a onça de 88 px cabe, e o "Continuar" tem altura de ação principal. "Rolam a 1366 × 768: nenhuma".

Ação oficial protegida: sim, não se aplica. A tarefa não toca nota, aprovação nem publicação. A `Comemoracao` continua só depois do envio confirmado.

Testes: rodei os de `ui/onca` e `estilos.test.ts`, e os 85 passaram. Outros 3 arquivos de `ui/ia` não rodaram aqui porque o pacote `@educa/shared` não está compilado nesta máquina; é do ambiente, não da tarefa. Não rodei os e2e.

Bloqueantes:

1. `docs/interface.md:1105` e `:1107` (seção 9.5, regras 3 e 4) contradizem o que a correção entrega e não foram atualizadas.
   - A regra 3 diz "Nenhum laço… o CSS servido não tem `infinite` (D59)". O `Onca.css:48` tem `infinite` nos três pontos do `pensando`.
   - A regra 4 lista entre o que não entra do mockup "a onça piscando por temporizador". `movimento-da-onca.ts` (`usePiscar`) faz exatamente isso.
   - A correção reescreveu a seção 9.7 e a tabela de poses, mas deixou a 9.5 dizendo o contrário. Quem lê a seção 9.5 conclui que o código viola a regra.
   - O `docs/interface.md:1171` ainda diz "nenhuma pisca, acena em laço", que também conflita com a 9.7 reescrita.
   - Correção exigida: alinhar a 9.5 (regras 3 e 4) e a linha 1171 ao que o `conformidade-reviewer` aprovar, ou, se ele vetar o laço e o piscar, tirar os três pontos animados e o piscar do código. Hoje o laço e o piscar entram com a documentação desmentindo.
   - Se for mantido, a exceção deve ser escrita com o escopo exato: só o `Onca.css`, só a pose `pensando`, só o piscar da onça de corpo inteiro. O `estilos.test.ts:822` (`not.toContain('infinite')`) só lê o `estilos.css` e hoje não cobre o `Onca.css`; quem cobre isso é o `movimento-da-onca.test.tsx:154`.

   Isto depende do parecer do `conformidade-reviewer`, que a tarefa declara pendente: o laço dos três pontos e o piscar por temporizador só valem com ele. Do meu lado, o veredito de tela é limpo; o que bloqueia é a contradição com o `docs/interface.md`.

Recomendações:
- As fotos da vitrine mostram "Colégio sintético da vitrine cheia 4abf251d" e "…vazia 3f1e9f28" na fala do Analista (`coordenacao--coordenacao-bem-vindo--*.png`, `vazia--coordenacao--*`). É um sufixo de id do seed da vitrine, não desta correção. Dado real não vai ter, mas vale conferir que o seed de demonstração não vaze id assim.
- No celular de 360 px, a onça (88 px) com o balão do `pensando` fica rente à borda direita da cabeça; está dentro do quadro e nada corta, mas fica com pouca folga.
- Não pude fotografar a `Comemoracao`. A validação deve ver o salto uma vez e a ausência de movimento com "reduzir movimento".

Arquivos relevantes (caminhos absolutos):
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/docs/interface.md`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/Onca.css`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/movimento-da-onca.ts`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/estilos.test.ts`

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-28 20:24:25 · `tasks/correcoes/2026-10-28-onca-do-mockup.md`

VEREDITO: REPROVADO

Escopo: respeitado

Aderência à Tech Spec: divergência em `docs/interface.md` 9.5 e 9.7. O documento de referência não foi reconciliado com o movimento que entrou.

Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo).

Bloqueantes:

1. **`docs/interface.md:1105-1110` e `docs/interface.md:1171` contradizem o código entregue, e a correção não os revisou.**
   - **9.5, item 3 (l. 1105-1107):** diz "**Nenhum laço.** Nada na tela se mexe sozinho [...] os três pontos de 'pensando' [...] são parados, e o CSS servido não tem `infinite` (D59)". Mas `apps/web/src/componentes/ui/onca/Onca.css` traz `.onca-pontos > * { animation: onca-ponto 1.2s ease-in-out infinite; }`, e esse CSS é servido no pedaço da onça. A pose `pensando` agora é o último passo da introdução do aluno (`textos-da-introducao.ts:40`), então a introdução não termina mais parada. Isso também contraria o RF19 da X4 (`tasks/prd-telas-do-aluno-e-primeiro-acesso/prd.md:58`: "três poses [...] todas com o mesmo rosto neutro [...] A introdução [...] termina parada"), e esse RF não aparece como revisto em lugar nenhum.
   - **9.5, item 4 (l. 1108-1110):** "Do mockup não entram: [...] e a onça piscando por temporizador". É exatamente o que `usePiscar` faz (`movimento-da-onca.ts:660-684`, chamado em `Onca.tsx:498`).
   - **9.7 (l. 1171):** "nenhuma pisca, acena em laço ou reage a quem usa". O "nenhuma pisca" ficou falso.
   - O próprio documento da tarefa usa a 9.5 como regra que vale: é por ela que recusa o avatar "pensando" ("sem três pontos pulando, nada em laço [...] Mudar isso é decisão, não só parecer"). Ao mesmo tempo, traz os mesmos três pontos em laço para o corpo inteiro e o piscar que a 9.5 exclui pelo nome.
   - O parágrafo novo da 9.7 (l. 1144-1151) não basta. O documento passa a dizer as duas coisas ao mesmo tempo, e o próximo implementador não sabe qual vale.
   - **Correção exigida, uma das duas:**
     - (a) Revisar a 9.5, itens 3 e 4, e a 9.7, l. 1171, para dizer o que passou a valer: o piscar com limite de quatro e o laço único dos pontos de `pensando`, só no corpo inteiro e nunca com "reduzir movimento". Registrar ali, ou pela `registrar-decisao`, que a correção revê a exclusão da 9.5 e o RF19 da X4, com a palavra do Joaquim citada.
     - (b) Tirar o piscar e o laço dos pontos e deixar o `pensando` com os pontos parados.
   - Em qualquer dos dois caminhos, o parecer do `conformidade-reviewer` sobre esse movimento precisa constar.

Recomendações:

- **Aceno preso na instância** (`apps/web/src/componentes/ui/onca/movimento-da-onca.ts:691`, `Onca.tsx:499` e `Onca.tsx:544`): `useAcenarNaPrimeiraVez` lê `acenando` só na montagem e guarda `acena` enquanto a onça existir. Na `Introducao` a mesma `Onca` atravessa os passos sem `key`. Se a pessoa clicar em "Continuar" antes de cerca de 1 s, a pata direita da pose `apontando` continua com `onca-acena` e o braço esticado gira. O mockup faz o mesmo, mas vale ligar a classe só enquanto `pose === 'acenando'`.
- **Dois saltos sobrepostos na comemoração** (`apps/web/src/componentes/ui/Comemoracao.tsx:24-26`): o `comemoracao-salto` (700 ms, −18 px) agora roda junto com o `onca-comemora` interno (500 ms, −12 px). O mockup também empilha os dois. Mesmo assim, o comentário da `Comemoracao` ("dando **um salto**") e o "saltar na comemoração (uma vez)" da tarefa ficaram imprecisos, e um dos dois movimentos é um segundo jeito de fazer a mesma coisa.
- **`Onca.tsx:498`:** `` `${pose}` `` é só `pose`; o template literal é ruído.
- **`apps/web/src/estilos.test.ts:822`:** o teste "nenhum laço" só lê o `estilos.css`, e o CSS de cada peça escapa dele. Se a opção (a) do bloqueante for a escolhida, convém que esse teste, ou o texto da 9.5, diga explicitamente que o `Onca.css` é a exceção conferida em `movimento-da-onca.test.tsx:147`.

## conformidade-reviewer · 1ª rodada · REPROVADO · 2026-10-28 20:25:10 · `tasks/correcoes/2026-10-28-onca-do-mockup.md`

VEREDITO: REPROVADO

Caminhos de escrita em Nota: nenhum. A correção não toca `Nota`, API, job, seed nem importação. Todos com autor humano? sim, porque não há caminho novo.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. Nenhum fluxo de saída de IA mudou.
Supervisão do tutor: ok. Nada muda no tutor. As fotos mostram o passo "Quem dá a aula acompanha como você usa o Tutor." intacto.
Autonomia declarada e visível: sim. Nada mudou aí.

**Nas fotos:** a onça aparece sempre com a função e o selo "IA" na mesma `figure`. Não há nota nem conceito. "Sair" e "Fechar" aparecem em todas as fotos, no computador e no celular, na escola cheia e na vazia. O passo do aluno diz "Eu sou um programa, e não uma pessoa.". Por esse lado, nada viola a regra 70.

## O parecer, grupo por grupo

**1. Pose `pensando`: aprovada, desde que fique parada.** A pata no queixo é a pata creme, não mão humana. O rosto vem da pose, e a pose vem do passo da letra. Nada depende de quem usa. O balão pode ficar, mas os três pontos ficam parados: o laço deles está vetado no grupo 3.

**2. Expressões por pose: aprovadas, as quatro.** São estas: acenando com boca aberta e língua, apontando com olhar de lado e sorriso, comemorando com olhos em arco e boca bem aberta, e pensando com olhar para cima e pálpebra baixa.
- Cada rosto vem só de `POSES_DO_CORPO` (`Onca.tsx:81-127`), e nenhuma prop leva rosto de fora.
- Os tipos (`CabecaOnca.tsx:73-75`) não têm preocupação, tristeza nem "acolhendo".
- A `CabecaOnca` só aceita `tamanho` e continua neutra (`CabecaOnca.tsx:223-247`).
- O rosto da comemorando aparece no gatilho já aprovado na X4, a entrega confirmada, que não depende de acerto.
- Não vejo simulação de vínculo (D58) nem reação a presença, acerto ou tempo de uso (D80, item 3).

**3. Movimento: aprovo dois, veto três.**
- Aprovados:
  - entrar: 240 ms, uma vez.
  - acenar: uma vez por sessão, sem laço. A marca em `sessionStorage` não é dado pessoal.
  - Os dois param com "reduzir movimento" e têm teste.
- Vetados:
  - o piscar;
  - o laço dos três pontos;
  - o salto próprio da `Onca` na comemoração.

## Bloqueantes

1. **O laço dos três pontos.**
   - Onde: `apps/web/src/componentes/ui/onca/Onca.css:47-54`, `Onca.tsx:165` e `movimento-da-onca.test.tsx:155`, que exige `toEqual(['.onca-pontos > *'])`.
   - O que está errado: `docs/interface.md` 9.5, regra 3 (linhas 1105-1107, D59), diz "Nenhum laço… os três pontos de 'pensando' … são parados, e o CSS servido não tem `infinite`". A linha 1171 repete: "nenhuma pisca, acena em laço". A própria correção admite que mudar o laço do `pensando` do avatar "é decisão, não só parecer". É a mesma regra, e vale também para a onça de corpo inteiro. Além disso, o teste "nenhum laço" de `estilos.test.ts:815-823` só lê o `estilos.css`, então o `infinite` do `Onca.css` escapa dele.
   - Correção exigida:
     - tirar `onca-ponto` e a classe `onca-pontos`, deixando os pontos parados;
     - em `movimento-da-onca.test.tsx`, trocar a asserção para `expect(infinitos).toEqual([])`;
     - fazer o teste de "nenhum laço" cobrir também o `Onca.css`;
     - tirar as mutações que apontam para `onca-pontos`.

2. **O piscar por temporizador.**
   - Onde: `Onca.css:22-28`, `movimento-da-onca.ts:35-64` (`usePiscar`), `Onca.tsx:214` e o `piscavel` de `CabecaOnca.tsx:98` e `Onca.tsx:255`.
   - O que está errado: `docs/interface.md` 9.5, regra 4 (linha 1110), diz que do mockup não entra "a onça piscando por temporizador". A regra 3 diz "Nada na tela se mexe sozinho", e a 9.7 (linha 1171) diz "nenhuma pisca". Um movimento sorteado a cada 3 a 6 s, sem nenhum gesto da pessoa, é a onça dando sinal de vida sozinha. A D80, item 3, e a D58 afastam isso.
   - Correção exigida:
     - remover `usePiscar`, as constantes do piscar, a classe `onca-olho`/`onca-pisca` e o `@keyframes onca-piscar`;
     - remover os testes e as mutações do piscar;
     - deixar um teste que prove que a onça de corpo inteiro não agenda temporizador fora do acenar. A asserção já existe na unidade e só precisa ficar sem exceção do piscar.

3. **Dois saltos na comemoração.**
   - Onde: `Onca.tsx:154-157` e `Onca.css:37-45`. O `onca-comemora` roda dentro do `.comemoracao-salto` de `Comemoracao.tsx:24-26` e `Comemoracao.css`.
   - O que está errado: o parecer da X4 foi dado com a condição de "um salto só" (`docs/interface.md:641-644`). Agora rodam juntos −18 px com 700 ms e −12 px com amassa e estica, de 500 ms. O e2e só confere o `comemoracao-salto` e não pega o segundo.
   - Correção exigida:
     - tirar o `onca-comemora`. A pose `comemorando` não leva movimento de corpo na `Onca`: nem salto nem `onca-entra`, porque o invólucro já entra e salta. O salto que fica é o da `Comemoracao`, que já foi aprovado e tem teste.
     - em `movimento-da-onca.test.tsx`, provar que a `comemorando` sai sem classe de movimento;
     - em `e2e/introducao-pecas.spec.ts`, provar que a subárvore da comemoração tem uma animação só, o `comemoracao-salto`.

4. **O documento se contradiz.**
   - Onde: `docs/interface.md:1146-1149`.
   - O que está errado: o texto novo descreve "piscar de tempos em tempos" e diz que "o único que se repete é o dos três pontos". Isso contradiz a 9.5, regras 3 e 4, e a linha 1171 do mesmo documento.
   - Correção exigida: reescrever o parágrafo com o que fica depois dos itens 1 a 3: entrar uma vez, acenar uma vez por sessão, os pontos do `pensando` parados e nada em laço. A mesma linha da tabela (1176) deve dizer que o `pensando` entra parado.

## Recomendações

- **Texto da D80, item 3.** Ele diz "com uma expressão neutra só". Vale anotar uma linha de revisão em `docs/decisoes.md`: o avatar segue neutro, e a onça de corpo inteiro tem rosto por pose, pelo parecer de 28/10/2026. Assim a decisão não contradiz a 9.7.
- **O balão de pontos no passo da letra.** No produto, três pontos costumam dizer "a IA está processando", e nesse passo nada está sendo gerado. Vale pensar num balão sem pontos, ou manter os pontos parados como exigido.
- **Para o `frontend-reviewer`.** Em `.processo/vitrine/aluno--aluno-bem-vindo--computador.png` e `professora--professor-bem-vindo--computador.png`, a pata da pose `acenando` não aparece levantada de forma legível. Não é da regra 70.
- **Para o `revisor-geral`.** O `CLAUDE.md` e `docs/interface.md:637` dizem "Nada de mockup é copiado para o `apps/web`", e esta correção copia o traço por pedido do Joaquim, que chegou pelo Orquestrador. A exceção merece ficar registrada onde a regra está escrita. Não é da regra 70.

Os arquivos citados ficam em `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/`, nas pastas `apps/web/src/componentes/ui/onca/`, `apps/web/src/componentes/ui/` e `docs/`.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-28 20:25:22 · `tasks/correcoes/2026-10-28-onca-do-mockup.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Caminho feliz:** cada pose (acenando, apontando, comemorando, pensando) desenha o traço do mockup, com o rosto dessa pose. A cabeça do avatar é sempre neutra.
- **Fidelidade:** `CORPO_D`, `CABECA_D`, a pinta e o `Onca.css` são idênticos aos do mockup. Também contam a máscara, as orelhas, os olhos, o focinho, o nariz, as bocas, as rosetas, os ombros, o punho e a mão creme, o braço longo e o lado de trás.
- **Movimento:**
  - entrar uma vez;
  - piscar de 3 a 6 s, por 160 ms, no máximo quatro vezes, e a comemorando não pisca;
  - acenar só na primeira onça acenando da sessão;
  - saltar uma vez na comemoração;
  - os três pontos só no `pensando`, como único laço.
- **Borda:** `animada={false}` deixa tudo parado; o sessionStorage negado não derruba a onça; trocar de passo na mesma instância da `Introducao`; ids do `useId` com dois desenhos na página; avatar de 24 e 32 px sem a roseta da testa.
- **D59:** com "reduzir movimento" nada se agenda e o CSS desliga tudo, inclusive na `Comemoracao`.
- **Permissão (o análogo aqui):** só a pose dá o rosto, nunca quem usa. A `CabecaOnca` só aceita `tamanho`. Só as três peças importam a `Onca` (o teste antigo continua valendo).
- **Isolamento:** não se aplica. Não há API nem dado de escola.

**Cobertos:**
- Conferi as quatro impressões congeladas em `fidelidade-ao-mockup.test.tsx` contra `mockups/src/components/duo/onca/` (geometria, paleta e onca.css). Batem byte a byte.
- Rodei com `npx vitest run` os testes da pasta `onca`, o avatar, `introducao`, `Comemoracao`, `estilos` e `textos-da-introducao`: 198 passaram. O `textos-da-introducao` só resolve `@educa/shared` quando roda da raiz.
- `mutacoes.ts --faltando` diz que nenhuma linha nova com condição ficou sem bloco. Cada bloco cita um caso que chega à cláusula: conferi `ombro = OMBRO_D`, `abertura → false`, o `useId` sem o replace e `reduzMovimento` em `usePiscar` e em `useAcenarNaPrimeiraVez`.
- Não há `.skip`, `.only`, teste comentado nem `any`. Não há IA nem concorrência de servidor.

**Bloqueantes:**

1. **`apps/web/src/componentes/ui/Comemoracao.tsx:24-25`: a onça salta duas vezes ao mesmo tempo, e nenhum teste pega isso.**
   - O que está errado: o invólucro `.comemoracao-salto` (700 ms, −18 px, em `Comemoracao.css`) continua, e agora a `Onca` dentro dele também põe `onca-comemora` (500 ms, −12 px, com o achatamento), porque `animada` é ligada por padrão. O documento pede "saltar na comemoração (uma vez)". No mockup só a onça salta: o `Comemoracao` de lá não tem salto no invólucro.
   - Por que os testes não veem: `e2e/introducao-pecas.spec.ts` ("um salto, uma iteração"), `e2e/aluno-atividade.spec.ts:320` e `Comemoracao.test.tsx:48` olham só o invólucro.
   - Correção exigida: ficar com um salto só. O do mockup é `onca-comemora`, o que significa tirar o `.comemoracao-salto` e ajustar o `Comemoracao.css` e os testes dele. Além disso, um teste que conte as animações da árvore da comemoração no navegador e exija exatamente uma: elementos com `animationName !== 'none'`, sem reduzir movimento.

2. **`apps/web/src/componentes/ui/onca/Onca.test.tsx:108-114`: duas asserções sempre passam (regra 40, item 5).**
   - O que está errado: `rosto.replace(A, B)).not.toContain(A)` (linhas 112 e 113) testa o `String.prototype.replace`, e não o desenho. É verde com qualquer onça. A linha 111 só repete o que o caso "o rosto de cada pose" já prova.
   - Correção exigida: apagar o caso, ou trocá-lo por uma prova real de que a comparação de `ROSTO_DA_POSE` recusa um rosto trocado. Por exemplo, rodar a mesma verificação sobre um HTML com a boca de outra pose e exigir que ela falhe.

3. **`apps/web/src/areas/aluno/introducao/textos-da-introducao.ts:40`: o passo da letra com `pensando` não tem teste que falhe se voltar a `acenando`.**
   - O que está errado: `textos-da-introducao.test.ts:112` foi alargado para aceitar as três poses. `Introducao.test.tsx` usa uma lista de passos própria, e o `BemVindo.test.tsx` não olha a pose. Esse é o único lugar do produto onde a pose nova aparece, e a vitrine não fotografou esse passo.
   - Correção exigida: em `textos-da-introducao.test.ts`, conferir `PASSOS_DO_ALUNO.map((p) => p.pose)` igual a `['acenando', 'apontando', 'apontando', 'pensando']`, ou ao menos que só o passo `letra` é `pensando`. Se o `conformidade-reviewer` vetar a pose, o teste sai junto com ela.

**Recomendações:**
- **`useAcenarNaPrimeiraVez` lê `acenando` só na montagem.** A `Introducao` reaproveita a mesma `Onca` de um passo para o outro (`Introducao.tsx:103`, sem `key`), então a classe `onca-acena` fica na pata do `apontando` e do `pensando`. Hoje não se vê, porque a animação não recomeça. Falta um caso com `rerender` de acenando para apontando que exija zero `.onca-acena`.
- **`Introducao.test.tsx:313`, "a onça não se mexe: nenhum temporizador entre um passo e outro".** O nome agora é falso: a onça pisca, e há um temporizador por passo. Renomear para "trocar de passo não acumula temporizador".
- **"Pisca entre 3 e 6 s, por 160 ms"** (`movimento-da-onca.test.tsx:72`). Com `Math.random` fixo em 0, só o limite de baixo (3 s) e a duração máxima ficam provados. Falta um caso com `random` perto de 1 (nada antes de 6 s) e um que prove o reinício da contagem quando a pose muda (`recomeco`).
- **"O armazenamento negado… ela acena e segue"** (linha 111) só confere que nada lança erro. Falta a asserção de que `.onca-acena` está lá.
- **A pálpebra baixa só no olho direito** (`CabecaOnca.tsx:141`) não tem teste. Pôr a pálpebra também no esquerdo passaria.
- **As transformações de cada pose** (`figura`, as patas, os pés, os rabos de `POSES_DO_CORPO`) não estão no teste de fidelidade. Uma impressão congelada delas, como a dos caminhos, fecharia o "traço".
- **`AvatarAgente`:** o e2e prova o recuo de 3 e 4 px, mas não a descida de 6% (`top-[…]`).
- **E2e com "reduzir movimento"** no passo `pensando` (os pontos parados) e na árvore da comemoração (`onca-comemora` igual a `none`): hoje isso só se prova pelo texto do CSS.
- **Duas onças acenando montadas no mesmo render** acenam as duas: a leitura vem antes de o efeito gravar a marca. Hoje nenhuma tela tem duas. Fica registrado.

Arquivos citados:
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/Comemoracao.tsx
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/Onca.test.tsx
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/areas/aluno/introducao/textos-da-introducao.ts
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/movimento-da-onca.test.tsx
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/introducao/Introducao.test.tsx

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-28 20:57:20 · `tasks/correcoes/2026-10-28-onca-do-mockup.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta correção. O diff só mexe na onça, na `Comemoracao`, nos testes, no `docs/interface.md` e no `TODO.md`. Todos com autor humano? Sim, nada mudou.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok. Nenhum fluxo de saída de IA mudou.

Supervisão do tutor: ok. O texto do passo de supervisão diz ao aluno que quem dá a aula vê onde ele travou e se pediu a resposta pronta. Isso é uso e dificuldade, sem nada de comportamento ou emoção (`aluno--aluno-bem-vindo--Continuar--celular.png`).

Autonomia declarada e visível: sim, sem mudança. Nas fotos, cada onça leva o nome da função e o selo "IA": Tutor, Assistente de ensino e Analista de desempenho escolar. O "Sair" e o "Fechar" ficam sempre à vista, e nenhuma tela mostra nota ou conceito.

**As correções exigidas na rodada 1**

1. **Laço dos três pontos: feito.**
   - `Onca.css` não tem mais `onca-pontos` nem `@keyframes onca-ponto`.
   - Em `Onca.tsx`, o `DesenhoDoBalao` ficou sem a classe e os pontos estão parados.
   - `movimento-da-onca.test.tsx` agora exige `infinitos` igual a `[]` e prova que nada no balão leva classe.
   - O `estilos.test.ts` novo varre todo CSS de `apps/web/src`, o `Onca.css` incluído, contra `infinite`.
   - As mutações antigas dos pontos saíram e entrou uma que reintroduz a classe `onca-pontos`.
   - A foto do passo da letra mostra o balão com os pontos parados (`aluno--aluno-bem-vindo--Continuar-Continuar-Continuar--computador.png` e `--celular.png`).
2. **Piscar por temporizador: feito.**
   - `usePiscar`, as constantes, `onca-olho`, `onca-pisca` e `@keyframes onca-piscar` saíram, e também o `piscavel` de `CabecaOnca.tsx` e de `Onca.tsx`.
   - `movimento-da-onca.ts` não tem mais temporizador.
   - O caso "nenhuma pose agenda temporizador" prova zero temporizadores ao desenhar e depois de 30 s, em todas as poses.
   - Os testes e as mutações do piscar foram removidos.
3. **Dois saltos na comemoração: feito, pela decisão do Arquiteto. Não mantenho o veto.**
   - Nenhuma regra distingue um salto do outro. A D59 e o item 4b da regra 70 pedem um movimento só, uma iteração, nada em laço e parada com "reduzir movimento".
   - O `onca-comemora` cumpre tudo isso: 500 ms, uma iteração, só `transform`, desligado pelo `@media` do `Onca.css`. O meu pedido de ficar com o salto do invólucro era de precedência, não de regra.
   - O que a regra pede está provado:
     - `Comemoracao.test.tsx` exige exatamente um `.onca-comemora` e nenhum `.comemoracao-salto`, `.onca-entra` ou `.onca-acena` na árvore.
     - `e2e/introducao-pecas.spec.ts` e `e2e/aluno-atividade.spec.ts` exigem uma única animação resolvida na subárvore `[data-comemoracao]`, que é `onca-comemorar`, e zero com "reduzir movimento".
     - A mutação que devolve o `div.comemoracao-salto` está listada, e também a que troca `onca-comemora` por `onca-entra` em `movimentoDoCorpoNa`.
4. **O documento se contradizia: feito.** `docs/interface.md:1153-1158` agora diz:
   - são três movimentos, cada um uma vez: entrar, acenar só na primeira vez da sessão e só na pose `acenando`, e o salto único da comemoração;
   - nada fica em laço e tudo para com "reduzir movimento";
   - o piscar e o laço dos pontos ficaram fora, por veto.

   A linha da tabela, em `docs/interface.md:1183`, diz "com os três pontos parados".

**Bloqueantes:** nenhum.

**Recomendações**
- O tempo de 30 s no caso "nenhuma pose agenda temporizador" (`movimento-da-onca.test.tsx`) é arbitrário. Basta a contagem antes de avançar o relógio, que já está lá. Melhoria, não bloqueia.
- As duas pendências que deixei na rodada 1 seguem registradas na tabela de recomendações do documento da correção, e não são desta tarefa:
  - registrar em `docs/decisoes.md` que o avatar segue neutro e a onça de corpo inteiro tem rosto por pose;
  - registrar no `CLAUDE.md` a exceção de que a onça foi copiada do mockup.

Arquivos conferidos:
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/Onca.css
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/movimento-da-onca.ts
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/Onca.tsx
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/Comemoracao.tsx
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/Comemoracao.test.tsx
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/movimento-da-onca.test.tsx
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/e2e/introducao-pecas.spec.ts
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/e2e/aluno-atividade.spec.ts
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/docs/interface.md

## revisor-geral · 2ª rodada · APROVADO · 2026-10-28 20:57:40 · `tasks/correcoes/2026-10-28-onca-do-mockup.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

O bloqueante da 1ª rodada foi corrigido pelo caminho (b):
- **Piscar removido.** O `usePiscar` saiu de `movimento-da-onca.ts`, e `onca-olho`, `onca-pisca` e `@keyframes onca-piscar` saíram de `Onca.css`. O `piscavel` saiu de `CabecaOnca.tsx`.
- **Laço dos três pontos removido.** O `.onca-pontos` saiu do `Onca.css`. O `DesenhoDoBalao` em `Onca.tsx` desenha os pontos parados. Não sobra `infinite` em nenhum CSS de `apps/web/src`, e um caso novo em `estilos.test.ts:827` prova isso.
- **O documento bate com o código.** Os itens 3 e 4 da 9.5 em `docs/interface.md` (l. 1108-1113) e a l. 1178 da 9.7 agora dizem o mesmo que o código. O parágrafo do movimento na 9.7 e a tabela de poses foram reescritos para o que ficou.
- **O parecer do `conformidade-reviewer` está registrado.** Está no documento da correção, com o que foi aprovado e o que foi vetado.
- **Salto da comemoração.** A ordem do Arquiteto (`.processo/ordens/2026-10-28-onca-do-mockup-r1-item3.md`) foi cumprida item a item:
  - o `Comemoracao.css` foi apagado;
  - o invólucro `.comemoracao-salto` saiu;
  - os e2e provam exatamente uma animação (`onca-comemorar`) na árvore `[data-comemoracao]`, e zero com "reduzir movimento";
  - a linha em "Divergências resolvidas" foi escrita.
- **Minhas duas recomendações da 1ª rodada entraram.** O aceno só liga enquanto `pose === 'acenando'` (`Onca.tsx:257`). O `${pose}` sumiu junto com a linha do `usePiscar`.

Recomendações:
- **Token `t-salto` sem uso.** `docs/interface.md:1102` diz que a comemoração usa o `t-salto` (600 ms, `curva-quique`). Nenhum CSS do `apps/web/src` usa esse token, e o salto que ficou é o `onca-comemorar`, de 500 ms em `ease-out`. A divergência já existia (o salto antigo tinha 700 ms). Vale apontar a linha para o `onca-comemorar` ou tirar o token.
- **Segunda varredura de pasta em `estilos.test.ts:827`.** O caso novo cria a própria busca recursiva, mas o arquivo já tem uma na l. 317. Seria melhor reaproveitar a que existe. O `join(raizDaWeb)` com um argumento só também não faz nada.
- **Nome do caso em `Introducao.test.tsx:313`.** O nome "a onça não se mexe" não vale mais: ela entra e acena por CSS. O caso prova só que não há temporizador, e o nome devia dizer só isso.
- **Exceção nova no `docs/interface.md`.** A l. 637 agora diz que a onça é exceção a "nada de mockup é copiado para o `apps/web`". O `CLAUDE.md` continua sem essa exceção. O registro já foi passado ao Orquestrador, que precisa da palavra do Joaquim. Ele deve ser feito antes do pouso, para as duas fontes não ficarem em contradição.
- **Comentário em `Onca.tsx:27`.** O comentário da prop `animada` virou uma linha só, muito longa, diferente do resto do arquivo.

Arquivos relevantes:
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/docs/interface.md
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/Onca.css
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/Onca.tsx
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/movimento-da-onca.ts
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/Comemoracao.tsx
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/estilos.test.ts
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/tasks/correcoes/2026-10-28-onca-do-mockup.md

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-28 20:57:50 · `tasks/correcoes/2026-10-28-onca-do-mockup.md`

VEREDITO: APROVADO

Esta segunda rodada só olhou o diff e5fc9ca4 → 6ef5c120 (`/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/.processo/ordens/diff-r2.patch`). Na primeira rodada eu não tinha exigido nenhuma correção, então não havia o que conferir de volta. Tudo o que mudou é desenho e movimento da onça, além de documentação. Nenhum dado de pessoa entra ou sai.

Campos pessoais tocados: nenhum. As mudanças são estas:
- saiu o piscar por temporizador (`usePiscar`, `onca-pisca`, `onca-olho`);
- saiu o laço dos três pontos do `pensando`;
- `Comemoracao.css` foi apagado, e o salto agora é o `onca-comemora`;
- os testes e os e2e foram ajustados a isso, e o `TODO.md` e o `docs/interface.md` foram atualizados.

Fora da tabela de dados do docs/lgpd.md: nada. A única coisa que o navegador guarda continua sendo a chave `turmma-onca-acenou` no `sessionStorage` (`apps/web/src/componentes/ui/onca/movimento-da-onca.ts:21` e `:29`). Ela grava só "1", sem id de pessoa, e não mudou nesta rodada. A minha recomendação da 1ª rodada sobre ela foi anotada no `TODO.md`.

Autorização por objeto: ok. O diff não tem rota, endpoint nem consulta a dado.

Logs: limpos. Nenhum `console` nem `logger` nos arquivos de código alterados.

Auditoria: não se aplica. Nenhuma das ações que pedem auditoria (leitura de dado de aluno, exportação, nota, permissão, aprovação de saída de IA) aparece no diff.

Envio externo: nenhum. Não há chamada de rede nem de IA.

Seed/fixture: sintético. Os testes usam só o agente `tutor` e poses fixas, e o e2e procura um texto fixo da entrega (`FALA_DA_ENTREGA`). Nenhum nome, matrícula ou nota.

Pergunta de fechamento: a resposta à secretaria sobre um aluno não muda com este diff, porque nada novo é gravado nem enviado sobre ele.

Bloqueantes: nenhum.

Recomendações: nenhuma nova. A da 1ª rodada, incluir a chave do `sessionStorage` quando a regra 20 listar o que o produto grava no navegador, já está no `TODO.md`.

## test-engineer · 2ª rodada · APROVADO · 2026-10-28 20:57:50 · `tasks/correcoes/2026-10-28-onca-do-mockup.md`

VEREDITO: APROVADO

Cenários exigidos (rodada 2: as três correções da rodada 1 e o que elas afetam):
- A comemoração tem um salto só, o `onca-comemora`. Não pode haver um `.comemoracao-salto` por cima, e no navegador a árvore toda precisa ter exatamente uma animação. Com "reduzir movimento", nenhuma.
- A conferência do rosto de cada pose recusa de fato o rosto de outra pose ou um rosto adulterado.
- A pose de cada passo da introdução é fixada na ordem. Só o passo `letra` é `pensando`.
- As recomendações aplicadas: o aceno acaba quando a pose muda (`rerender`), a onça acena mesmo com o armazenamento negado, a pálpebra fica só no olho direito, e o gancho não gasta o aceno da sessão quando a pose não é `acenando`.
- O piscar e o laço dos pontos saíram de verdade, sem temporizador e sem `infinite` em nenhum CSS de `apps/web/src`.
- Nesta tarefa não há caso de permissão, isolamento ou concorrência. É peça visual, sem dado de escola nem endpoint.

Cobertos:
1. **Item 1 (um salto só).**
   - O `.comemoracao-salto` foi removido de `Comemoracao.tsx`, e o `Comemoracao.css` foi apagado.
   - `Comemoracao.test.tsx › o salto é um só, o do corpo da onça...` exige um `.onca-comemora` dentro de `[data-onca]` e nenhum `.comemoracao-salto`, `.onca-entra` ou `.onca-acena` na árvore. O bloco de mutação que volta a pôr o invólucro está declarado.
   - No navegador, `e2e/introducao-pecas.spec.ts` (`animados`, com `toHaveLength(1)` e nome `onca-comemorar`, uma iteração) e `e2e/aluno-atividade.spec.ts` (`animacoesDaComemoracao`, igual a `['onca-comemorar']`) contam as animações resolvidas da árvore inteira.
   - Os dois e2e exigem `[]` com "reduzir movimento".
2. **Item 2 (asserções que sempre passavam).**
   - O caso antigo saiu. Entrou `Onca.test.tsx › a conferência do rosto é de verdade...`, que roda `rostoConfere` sobre o rosto de cada uma das outras poses, numa matriz de 4 × 3, e exige `false`.
   - Ele também exige `false` para a boca trocada e para o olhar trocado no `apontando`. A mesma função alimenta o caso positivo. Isso discrimina de verdade: o caso positivo passa e todos os cruzados falham.
3. **Item 3 (passo `letra` com `pensando`).** `textos-da-introducao.test.ts:115` compara `id:pose` dos quatro passos, na ordem. O bloco de mutação `letra` → `acenando` cita o caso que contém a asserção.
4. **Recomendações aplicadas, cada uma com teste e bloco de mutação:**
   - `movimento-da-onca.test.tsx › o aceno acaba com a pose...`, contra a mutação `classe={acena ? ...}`.
   - `› o gancho só liga o aceno para quem pede...`
   - `› o armazenamento negado...`, agora com a asserção de `.onca-acena`.
   - `Onca.test.tsx › no pensando só o olho direito leva a pálpebra baixa...`
5. **Remoção do piscar e dos pontos.**
   - `› nenhuma pose agenda temporizador` (30 s no relógio falso).
   - `› os três pontos do pensando ficam parados`.
   - `Onca.css` com 3 `@keyframes` e nenhum `infinite`.
   - `estilos.test.ts › nenhum CSS de apps/web/src... tem laço`, com âncora em `Onca.css`.
   - `fidelidade-ao-mockup.test.tsx`: a impressão congelada do CSS inteiro virou uma lista dos trechos que ficaram, mais a ausência de `onca-pisc|onca-ponto|onca-olho|infinite`.
6. **Mutações do documento.** Os blocos que citavam o piscar e o `onca-pontos` foram removidos ou trocados. Os nomes dos testes citados conferem com os casos atuais. Não encontrei cláusula nova sem bloco.
7. **O que rodei.** Os testes de unidade da pasta `onca`, `Comemoracao`, `estilos`, `nome-dos-chunks`, `Introducao` e `textos-da-introducao` passaram: 147 casos, mais 40. Os e2e não rodei, porque precisam do servidor; o portão da tarefa roda os que o diff tocou.
8. **Busca por restos.** Não sobrou referência a `comemoracao-salto`, `onca-pontos`, `onca-pisca`, `usePiscar`, `piscavel` nem `Comemoracao.css`, fora das asserções de ausência.
9. **Proibições da regra 40.** Nenhum `.skip`, nenhum teste comentado, nenhum mock que esconda a regra, nenhum provedor de IA envolvido.

Bloqueantes: nenhum.

Recomendações:
- `Comemoracao.test.tsx:55`: a lista de classes proibidas (`.comemoracao-salto, .onca-entra, .onca-acena`) não pega um invólucro novo com outra animação, como um `animate-*` do Tailwind. Hoje só o e2e da árvore pega esse caso. Pode ficar assim, mas vale citar no comentário do caso que a prova completa é a do e2e.
- `Onca.test.tsx` (`rostoConfere`): o HTML do rosto é lido dentro de um `div`, fora de um `svg`. Funciona porque a busca é por nome de tag e atributo. Se um dia a conferência usar uma propriedade própria de SVG, o caso pode passar a falhar pelo motivo errado, e embrulhar num `<svg>` evita isso.
- `Introducao.test.tsx:313` ("nenhum temporizador entre um passo e outro"): sem o piscar, o nome voltou a ser verdadeiro. A recomendação da rodada 1 perdeu o objeto e não precisa mais de reavaliação.

Arquivos auditados:
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/.processo/ordens/diff-r2.patch
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/Comemoracao.test.tsx
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/Onca.test.tsx
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/movimento-da-onca.test.tsx
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/e2e/introducao-pecas.spec.ts
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/e2e/aluno-atividade.spec.ts
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/tasks/correcoes/2026-10-28-onca-do-mockup.md

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-28 20:57:52 · `tasks/correcoes/2026-10-28-onca-do-mockup.md`

VEREDITO: APROVADO
Tela vista: sim (11 das 14 fotos lidas, cheia e vazia). Li o passo da letra (pose `pensando`) e o passo 2 do aluno, no computador e no celular, mais o aluno, a professora e a coordenação na escola cheia, e os três papéis na vazia. Não abri as fotos de professora e coordenação no computador, de coordenação no celular, nem a vazia do aluno e da professora na versão que faltava. A `Comemoracao` não está na vitrine e foi conferida pelo código, pelos testes e pelo e2e.
Estados: ok. Esta correção só troca o desenho da onça nas telas de introdução e na comemoração. Carregando e erro seguem como estavam, e o vazio não se aplica porque a introdução tem texto fixo.
Acessibilidade: ok. O avatar continua `aria-hidden` e sempre aparece com o nome da função e o selo "IA" no mesmo bloco, visíveis em todas as fotos. O foco visível aparece na fala. O nome acessível é a função, não "onça". Com "reduzir movimento", o CSS desliga toda animação (`.onca *, .onca { animation: none !important; }`) e o aceno nem é ligado.
Chromebook fraco: ok. Saiu o temporizador do piscar, o laço dos três pontos e o segundo salto, então não resta timer nem animação em laço. O movimento que ficou é só `transform`, em 3 `@keyframes`, e `estilos.test.ts` agora reprova `infinite` em qualquer CSS de `apps/web/src`. A recomendação de medir a rolagem do Tutor com o avatar novo já foi para o `TODO.md`.
Celular: ok. Nas fotos a 360 px não há rolagem horizontal nem texto cortado, e o balão do `pensando` cabe no quadro. O botão Continuar tem altura de ação principal e Fechar e Sair são visíveis. Nada depende de hover.
Ação oficial protegida: sim. Não há ação oficial nesta correção, e a `Comemoracao` continua só depois do envio confirmado, sem nota nem número.

Conferência da correção exigida na rodada anterior (item 1, `docs/interface.md`): feita.
- A seção 9.5, regra 3 (`:1108`), diz "Nenhum laço", com os pontos de "pensando" parados.
- A seção 9.5, regra 4 (`:1113`), lista "a onça piscando por temporizador" como o que não entra.
- A seção 9.7 (`:1152-1157`) foi reescrita com o movimento que ficou e os dois vetos.
- A tabela de poses (`:1183`) foi atualizada: `pensando` com os pontos parados e "com parecer".
- O texto de `:1178` ("nenhuma pisca, acena em laço…") continua correto, porque agora o aceno roda uma vez.
- O código bate com os vetos do `conformidade-reviewer`: não existem mais `usePiscar`, `onca-pisca`, `onca-olho`, `onca-pontos` nem `Comemoracao.css`. `Comemoracao.tsx` tem um salto só (`onca-comemora`), e o e2e prova que há exatamente uma animação na árvore e nenhuma com "reduzir movimento".
- `docs/interface.md:1169` ainda diz que a `Comemoracao` leva "movimento próprio do conformidade-reviewer"; não bloqueia.

Bloqueantes: nenhum.

Recomendações (não bloqueiam):
1. `docs/interface.md:1100` (tabela da seção 9.5): o token `t-salto` diz 600 ms com `curva-quique` para a comemoração, mas o salto que ficou é o `onca-comemorar` (500 ms, `ease-out`, em `apps/web/src/componentes/ui/onca/Onca.css`). Alinhar a linha ou registrar que o `onca-comemorar` não usa o token.
2. A coordenação mostra "Colégio sintético da vitrine cheia 4abf251d" com id (`coordenacao--coordenacao-bem-vindo--computador.png` e as vazias, ex. `vazia--professora--professor-bem-vindo--celular.png`). Vem do seed de `tools/vitrine/`, não do código desta correção, e já está no `TODO.md`. Se a validação fotografar com esse nome, vai ver um id na tela.
3. A `Comemoracao` não foi fotografada. A validação deve ver um salto só e a onça parada com "reduzir movimento", como já está nas recomendações sem aplicar.
4. Ficam no `TODO.md`, sem pressa: a impressão congelada das transformações de cada pose, o e2e da descida de 6% do avatar e o e2e com "reduzir movimento" no passo `pensando`.

Arquivos principais:
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/docs/interface.md`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/Onca.css`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/Onca.tsx`
- `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/Comemoracao.tsx`
