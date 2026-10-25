# Achados das revisões — `tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-25 05:11:28 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md`

VEREDITO: APROVADO
Tabelas verificadas: nenhuma. A tarefa não cria nem altera migration ou schema. Nada mudou em `apps/api`, `packages/` nem em Drizzle.
Queries verificadas: nenhuma nova. As peças da introdução (`Introducao`, `TelaDeFoco`, `Balao`, `Comemoracao`, `Onca`) não leem `escolaId`, `anoLetivoId` nem `fetch`, e não usam `useQuery` nem `useMutation`. O ramo de tela de foco em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/CascaDaEscola.tsx` (linhas 267-275) só deixa de desenhar lateral e barras. A sessão continua igual (`consultaEu`, `lembrarQuemEsta`, `useInatividade`), e nenhuma leitura nova de dado entra por ali. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/CascaEmFoco.test.tsx` só confere o cache de `['eu']` que já existia. Nenhum endpoint recebe `escolaId` do cliente, e nenhum `@SemEscopo()` aparece.
Teste de isolamento: não se aplica. São peças de interface sem dado e sem chamada, e não há repository nem endpoint novo que o exija.
Bloqueantes: nenhum
Recomendações:
- O CSS e a casca em foco não guardam dado de escola na tela. Quando as tarefas 9.0 a 11.0 ligarem a introdução às rotas de cada papel, com o POST de "vista", esse endpoint precisa ser auditado: o escopo vem do token e não do corpo, e é preciso um teste de isolamento efetivo para a marca de introdução vista.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-25 05:12:08 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A tarefa só traz peças de interface (`Onca`, `Comemoracao`, `Introducao`, `TelaDeFoco`, `Balao`) e um caminho novo na casca. Não há migration, DTO, rota da API, chamada de rede nem gravação no navegador (busquei `console.`, `localStorage`, `sessionStorage`, `fetch(`, `sendBeacon` e `dangerouslySetInnerHTML` nos arquivos novos e não achei nada).

Fora da tabela de dados do docs/lgpd.md: nada. Nenhum campo novo foi criado.

Autorização por objeto: não se aplica. Não há rota nem objeto com id. O caminho de foco em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/CascaDaEscola.tsx:279-285` continua dentro da casca autenticada. Ele mostra menos dado de pessoa que a casca normal: sem nome da pessoa, sem seletor de escola, sem menu. Ele mantém o `useInatividade` e o `lembrarQuemEsta`, que são chamados antes desse `return`, e nenhum hook vem depois dele. Num Chromebook compartilhado, o "Sair" continua a apagar a sessão pela API e o aluno seguinte não herda nada.

Logs: limpos.

Auditoria: não se aplica. Não há leitura de dado de aluno por coordenação ou rede, nem exportação, nota, permissão ou aprovação de saída de IA.

Envio externo: nenhum. As peças não chamam provedor nem API.

Seed/fixture: sintético.
- Galeria: "Lia" e "turma 7ºA" (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/galeria/secoes/introducao.tsx:8-9`).
- Teste da casca em foco: "Colégio Vista Alegre", "Camila Souza", "Beatriz Lima" e UUIDs inventados (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/CascaEmFoco.test.tsx:23,132,153`).
- O e2e usa o texto da galeria.

Pergunta de fechamento: nada muda. A tarefa não guarda nem envia dado novo, então o que o arquivo do titular já responde continua completo.

Testes rodados: os 6 arquivos da tarefa (unidade e componente, com a cadeia fechada da onça) passaram, 72 de 72. O e2e não rodei.

Bloqueantes: nenhum.

Recomendações:
1. Para as tarefas 9.0 a 11.0: a fala de amostra da galeria cumprimenta pelo nome ("Oi, Lia!"). Se o `BemVindo` real puser o nome do aluno na fala, o nome só pode ir para a tela. A fala não pode entrar em evento, log nem telemetria, e é bom que o teste dos textos do papel prove isso.
2. Para a tarefa 7.0: quando a `Comemoracao` entrar em `areas/aluno/Atividade.tsx`, confirmar que a frase passada a ela é o fato ("Atividade enviada.") e nunca nota, acerto ou resultado. A peça aceita qualquer `children` e só o comentário a limita hoje.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-25 05:12:31 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A tarefa só mexe no frontend (peças sem dado e sem chamada à API) e não toca `Nota`, correção nem job. Todos com autor humano? Não se aplica.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. Nenhuma saída de IA é gerada aqui. As falas da `Introducao` são texto fixo passado por quem a monta, e os textos de cada papel ficam para as tarefas 9.0 a 11.0. A exceção do tutor (D47) não aparece em lugar nenhum.
Supervisão do tutor: ok. A tarefa não mexe no tutor. A fala de amostra da galeria ("Seus professores veem o que você me pergunta") vai no sentido do D8.
Autonomia declarada e visível: sim, sem mudança nesta tarefa. A onça de corpo inteiro sempre aparece com o nome da função e o selo "IA" no mesmo bloco (`Onca.tsx:123-126`). As fotos confirmam: computador-7, celular-9 e o extra escuro mostram "Tutor IA" sob a onça acenando, sob a apontando e na comemoração.

**Parecer pedido pela `docs/interface.md` 9.7 e pela linha 627 sobre as poses e a comemoração: aceitas, ficam.**
- **Acenando e apontando (D58, regra 70 item 4a).** O rosto é o mesmo `DesenhoDaCabeca` da X1 em todas as poses (`Onca.tsx:119-121`), e um teste de mutação prova isso. Não há nome próprio, o nome acessível é o da função, e o SVG é parado, sem temporizador. Não existe "acolhendo", e o tipo do componente recusa essa pose.
- **Comemoração (D59, Decreto 12.880 art. 9º).** Ela vem do envio confirmado, não do tempo de uso, do acerto nem da nota. É um salto só (`Comemoracao.css:24-30`, `animation-iteration-count: 1`), sem número nem som, com `animation: none` quando a pessoa pede para reduzir movimento (`Comemoracao.css:33-37`). A frase é de fato ("Atividade enviada.", celular-9), sem sentimento. Isso não é recompensa por uso. A regra "não volta ao recarregar" (RF8) cabe à 7.0 provar, junto com `Atividade.tsx`.
- **Sair nunca é mais difícil que entrar (D59, regra 70 item 4b).** "Sair" fica à vista em todo passo, inclusive no obrigatório (`TelaDeFoco.tsx:43-45`), e usa o mesmo caminho de saída da casca, provado em `CascaEmFoco.test.tsx`. "Continuar" e "Pular" usam a mesma classe e o mesmo tamanho (`Introducao.tsx:95-103`, extra escuro). O passo obrigatório só tira o "Pular" de um aviso de transparência, e a saída continua no mesmo clique.
- **Supervisão não é vigilância.** A tela de foco mantém `useInatividade` e `lembrarQuemEsta` (`CascaDaEscola.tsx:267-275`). Nada mede navegação, tempo ocioso nem emoção.

Rodei os 6 arquivos de teste da tarefa: 72 testes, todos verdes, incluindo a arquitetura que fecha quem pode importar a onça (`avatar-so-nas-duas-pecas.test.ts`).

Bloqueantes: nenhum

Recomendações:
1. `galeria/secoes/introducao.tsx:8`. A fala de amostra "Eu sou o Tutor, um programa da escola" (computador-7, celular-9) diz que a IA é da escola, mas a techspec exige que o aviso diga que é "IA da empresa". É só amostra, mas a galeria serve de referência para os textos das 9.0 a 11.0. Sugestão: "um programa de IA que a escola usa".
2. `Comemoracao.tsx:18-19`. O comentário diz que "só `areas/aluno/Atividade.tsx` a importa", mas a galeria também importa. O teste e a techspec já registram essa divergência; falta alinhar o comentário.
3. `docs/interface.md:627-630` e a tabela da 9.7 ainda dizem que a comemoração e as poses "dependem do parecer". Vale registrar ali que o parecer foi dado nesta tarefa (5.0), com as condições acima (uma vez, só no envio confirmado, sem número nem som, parada quando a pessoa pede menos movimento), para a 7.0 não reabrir o assunto.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/ui/onca/Onca.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/ui/Comemoracao.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/ui/Comemoracao.css
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/introducao/Introducao.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/introducao/TelaDeFoco.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/introducao/Balao.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/CascaDaEscola.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/galeria/secoes/introducao.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/ui/ia/avatar-so-nas-duas-pecas.test.ts

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-25 05:12:35 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md`

VEREDITO: APROVADO

Tela vista: sim. Li 5 fotos da Mesa (computador-6 e 7, celular-8, 9 e 10, cheia e vazia são a mesma página) e 3 extras do Implementador. Tirei também uma foto minha com `--clicar 'text=Continuar'` para ver a pose apontando na árvore atual (`aluno--galeria--Continuar--celular-9.png` e `--computador-7.png`).
- Nas extras de tema escuro (`/tmp/claude-1000/foto-intro-chromebook-escuro.png` e `foto-intro-celular-escuro.png`), a mão da pose apontando aparece cortada na borda direita do SVG.
- Essas fotos são das 04:44, e `Onca.tsx` foi alterado às 05:01. Na foto atual a mão está inteira (viewBox 120, extremo da mão em cerca de 116), então valem o código e a foto nova.

Estados: ok. A tarefa diz que carregando, vazio e erro não se aplicam, porque são peças sem dado e sem chamada. O estado com dado é a galeria. O "Saindo…" do botão Sair existe e tem teste.

Acessibilidade: ok.
- A fala é o `h1`, com `tabIndex={-1}`, e recebe o foco a cada passo. O leitor ouve "Passo N de M" por `aria-describedby`.
- Enter continua, a menos que o foco esteja em botão ou campo. Segurar a tecla avança um passo só. Esc só fecha quando pode.
- A onça tem SVG `aria-hidden` e vem sempre com a função e o selo "IA" na mesma `figure`.
- "Continuar" e "Pular" têm a mesma classe e 44 px (RF16, D59). O "Sair" está sempre à vista, com 44 px.
- Rodei os testes dos seis arquivos tocados: 72 passam.

Chromebook fraco:
- A `Comemoracao` anima só `transform` e `opacity`, uma iteração, e some com "reduzir movimento".
- A onça é SVG parado, sem temporizador.
- As peças novas estão em `PECAS_FORA_DA_ENTRADA`, fora do primeiro carregamento.
- Não rodei throttling de CPU e de rede. Não há lista, imagem nem upload nesta tarefa.

Celular:
- Em 360 px não há rolagem horizontal nem texto cortado (celular-9 e celular-10).
- A fala quebra em duas linhas dentro do balão.
- "Continuar" e "Pular" lado a lado em 44 px, "Sair" em 44 px.
- Nada depende de hover. O Enter e o Esc têm botão equivalente.
- O e2e do projeto `celular` está no `e2e/introducao-pecas.spec.ts` da tarefa. Não o rodei.

Ação oficial protegida: sim, não se aplica. A tarefa não tem ação oficial. A introdução só marca "vista" e nada aprova nem publica. O passo obrigatório não tem "Pular" nem "Fechar" e o Esc não sai. Revendo, todo passo fecha.

Bloqueantes: nenhum.
- `CascaDaEscola.tsx:267`: o ramo da tela de foco vem depois de todos os hooks. Mantém `<main>`, `useInatividade` e `lembrarQuemEsta`. Não tem lateral nem barras.
- Regra 70, itens 4a e 4b: o rosto é o neutro da X1 nas três poses, não há "acolhendo", nenhum texto de sentimento, nenhum som e nenhum número. A `comemorando` só é desenhada pela `Comemoracao`.
- `5_task.md`: as duas divergências estão preenchidas com a coluna "Onde está na spec".

Recomendações (não bloqueiam):
1. `Introducao.tsx:103`: a onça é sempre 120 px. O mockup 2.8 pede 88 px no celular. O tipo `TamanhoDaOnca` já aceita 88 e 160, mas nada os usa.
2. `Comemoracao.tsx:25`: a onça é fixa em 120 px. O mockup pede 160 px, ou 120 no celular. A tarefa 7.0 pode ajustar.
3. `Comemoracao.tsx:23`: a frase não está em região `role="status"`. A tarefa 7.0, que monta o envio, deve decidir se o leitor de tela anuncia "Atividade enviada".
4. `Introducao.tsx:76`: na primeira vez, um passo não obrigatório tem "Pular" mas o Esc não faz nada. O mockup diz "Esc sai quando pode". Vale decidir isso na 9.0.
5. `galeria/secoes/introducao.tsx:20` e `:37`: a galeria mostra a palavra solta "nada", e a caixa "Revendo" tem o checkbox nativo pequeno. É só a galeria de desenvolvimento, mas dá para rotular ("Último evento: nenhum") e aumentar o alvo.
6. `TelaDeFoco.tsx:34`: a barra de passo é cinza neutra (`fill-sutil`), e o mockup a desenha verde. Está de acordo com a regra da `BarraRotulada` (cor neutra sempre, D59), então não é defeito. Registro a diferença para a validação.
7. A pose apontando é um braço aberto para o lado, com pouca leitura de "apontar". É questão de gosto, não bloqueia.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-25 05:12:53 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. As duas divergências da tarefa estão cobertas na spec. A primeira é a `Comemoracao` importada pela seção da galeria: entrou na `techspec.md`, §9 e §10. A segunda, "Fechar" chamar `aoPular`, segue o que a §5 ("Rever") e a §9 já dizem. A spec não tem `cenarios.md`.

Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes: nenhum

Recomendações:
1. `apps/web/src/componentes/ui/onca/CabecaOnca.tsx` foi alterado sem estar em "Arquivos previstos" da `5_task.md`. A tarefa diz que esse arquivo é da X1. A mudança tira o desenho para `DesenhoDaCabeca` e exporta as oito cores, sem mudar o HTML da `CabecaOnca`, e é o caminho natural para "o mesmo rosto". Mesmo assim, registre o arquivo na tabela de arquivos ou numa linha de divergência, para a validação ver que a peça da X1 mudou.
2. `apps/web/src/componentes/ui/Comemoracao.tsx:147-148`: o comentário diz que só `areas/aluno/Atividade.tsx` importa a peça, mas a galeria também importa, e a cadeia fechada já admite isso. Corrija o comentário.
3. A tarefa constrói os botões de dois jeitos. `apps/web/src/componentes/introducao/Introducao.tsx:92-98` monta "Continuar" e "Pular" com `<button>` e `classesDoBotao`. `apps/web/src/componentes/introducao/TelaDeFoco.tsx:146-152` usa `<Botao>` para "Fechar" e "Sair". `Botao` aceita `className`, então dá para usar o mesmo componente nos quatro.
4. `apps/web/src/componentes/introducao/Introducao.tsx:60-63` e `:73-74`: a regra de avançar ou concluir está escrita duas vezes, em `continuar()` e no tratador do Enter. Faça o tratador chamar uma função só.
5. `e2e/introducao-pecas.spec.ts:195`: o título promete "nenhuma animação nem transição", mas o teste só confere `animationName`. Confira também `transitionProperty` ou `transitionDuration`, ou mude o título.
6. `apps/web/src/componentes/introducao/Introducao.tsx:103`: a onça sai sempre com 120 px, mas `TamanhoDaOnca` (`apps/web/src/componentes/ui/onca/Onca.tsx:15`) diz 88 no celular e 120 no computador. Fica para o `frontend-reviewer` decidir se a introdução troca o tamanho por largura.
7. `apps/web/src/componentes/introducao/Introducao.tsx:67-80`: Enter e Esc são ouvidos no documento inteiro. Quando um passo trouxer um `Dialogo` no conteúdo (tarefas 9.0 a 11.0), o Esc que fecha o diálogo vai também chamar `aoPular` quando a pessoa está revendo. Vale um caso de teste nessa tarefa.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-25 05:13:49 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** ordem e foco · botões iguais (RF16) · passo obrigatório, mais o rever com `['eu']` do cache e depois de erro seguido de "Tentar de novo" · onça (RF19) · rosto neutro · arquitetura (quem importa a `Onca`, a entrada não; `comemorando` só na `Comemoracao`; a `Comemoracao` só em `Atividade.tsx` e na galeria, divergência registrada) · movimento (componente e e2e) · casca em foco. Isolamento, concorrência e log não se aplicam: as peças não têm dado nem chamada, e a tarefa declara isso.

**Cobertos:**
- **Ordem e foco:** `Introducao.test.tsx`, "abre no passo 1 com a fala como `h1`…", "cada 'Continuar' mostra o passo seguinte… 'Passo 2 de 4'" e os casos de Enter. Estão cobertos o Enter no corpo da página, o Enter num botão, a tecla segurada, o `preventDefault` e outra tecla.
- **Botões iguais:** "'Continuar' e 'Pular' saem com a mesma classe…", e no e2e "'Continuar' e 'Pular' têm o mesmo tamanho e o mesmo peso…".
- **Passo obrigatório:** "passo obrigatório: sem 'Pular', sem 'Fechar', e o Esc não sai", "passo livre na primeira vez…" e "revendo, todo passo fecha…". O e2e repete os três.
- **Onça (RF19):** `Onca.test.tsx`, "são três: acenando, apontando e comemorando…", "traz o nome da função e o selo 'IA' no mesmo bloco…" e "o nome acessível é a função: nunca 'onça'… nenhum texto de sentimento".
- **Rosto neutro:** "o rosto de cada pose é o da cabeça neutra da X1…", com mutação.
- **Arquitetura:** os quatro casos de `avatar-so-nas-duas-pecas.test.ts`, "a onça de corpo inteiro e a comemoração". O `casca-sem-import.test.ts` também conta.
- **Movimento:** `Comemoracao.test.tsx`, "roda uma vez…" e "com 'reduzir movimento', a animação é `none`", mais os quatro casos de `e2e/introducao-pecas.spec.ts`, "o movimento da comemoração".
- **Casca em foco:** `CascaEmFoco.test.tsx` cobre:
  - os três papéis sem lateral, com um `<main>`;
  - o caso de controle fora do foco;
  - o endereço parecido;
  - o "Sair" que faz DELETE e `replace`;
  - a inatividade com relógio falso;
  - o `lembrarQuemEsta`.
- **Mutações:** cada cláusula nova do diff tem o seu bloco. O `node tools/processo/mutacoes.ts --faltando` diz "Nenhuma linha nova de produção com condição fica sem bloco". Os blocos que conferi ficam vermelhos pelo motivo certo. As 7 suítes que rodei passaram, 101 casos. Não há `.skip`, `.only`, teste comentado nem mock que esconda a regra.

**Bloqueantes:**
1. **Metade da linha "passo obrigatório" não tem teste.** Fica em `tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md:57`. A linha pede "revendo, todo passo fecha, **com `['eu']` do cache e depois de erro seguido de 'Tentar de novo'**". O caso "revendo, todo passo fecha…" (`apps/web/src/componentes/introducao/Introducao.test.tsx:202`) só monta a peça com `revendo: true` desde o começo. Nenhum caso monta a peça e só depois recebe `revendo` verdadeiro, que é o que acontece quando o `/v1/eu` chega do cache ou volta depois do erro e do "Tentar de novo". Também não há linha em "Divergências" que leve o cenário para outra tarefa. As tabelas da 9.0, da 10.0 e da 11.0 não o repetem: elas têm "quatro estados da `BemVindo`" e "rever" em e2e, sem o cache nem a volta depois do erro. Hoje o cenário que o `frontend-reviewer` pediu (`revisao-spec.md:84` e `:403`) não está em tarefa nenhuma. **Correção exigida, uma das duas:**
   - (a) Um caso em `Introducao.test.tsx` que monta com `revendo={false}` e faz `rerender` com `revendo={true}`, como faz a `BemVindo` quando o `['eu']` chega depois do carregando ou do "Tentar de novo". O caso confere "Fechar" e o Esc em cada um dos passos, inclusive no obrigatório, e que o "Pular" não aparece.
   - (b) Uma linha em "Divergências" que mande essa parte para a 9.0, a 10.0 e a 11.0, com a coluna "Onde está na spec" preenchida (techspec §9, "Estados da `BemVindo`"). A mesma tarefa acrescenta o cenário às tabelas de teste das três.

**Recomendações:**
- Em `apps/web/src/componentes/ui/ia/avatar-so-nas-duas-pecas.test.ts:75-77`, o laço lista `App.tsx`, que não existe, e o `continue` a pula sem avisar. Arquivo renomeado da entrada passaria vazio. Tire `App.tsx` e troque o `continue` por uma expectativa de que o arquivo existe.
- Dois cliques no último "Continuar", ou dois Enter seguidos (sem `repeat`), chamam `aoConcluir` duas vezes. O POST é idempotente, mas a 9.0 deveria provar "um POST" também pelo último "Continuar" da `Introducao`, e não só pelo "Começar".
- A definição de `ultimo` (`Introducao.tsx:50`) e o limite entre 0 e 100 da barra (`TelaDeFoco.tsx:28`) não têm bloco próprio. O `ultimo` já é coberto por "o último 'Continuar' conclui, e só ele". O limite da barra não tem caso com passo maior que o total.
- O caso "só aceita pose, agente e um dos três tamanhos" (`Onca.test.tsx:124`) só prova algo no `typecheck`, sem `expect` em execução. Vale um comentário dizendo isso.
- No e2e, provar o nome acessível como o navegador o calcula, com `getByRole('figure', { name: /^Tutor/ })`, além da ausência de `aria-label` no jsdom.

Não rodei o e2e (`node tools/ci/e2e.ts --manter-ambiente e2e/introducao-pecas.spec.ts`). Ele precisa do ambiente, e o portão já o rodou.

Arquivos citados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/introducao/Introducao.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/ui/ia/avatar-so-nas-duas-pecas.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/ui/onca/Onca.test.tsx`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-25 05:27:21 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

Auditei só o diff entre a 1ª e a 2ª rodada. Nele entram um caso de teste novo na unidade e reforços em testes que já existiam, sem mudar a lógica de produção:

- **Caso novo em `Introducao.test.tsx:217`.** O `revendo` agora chega depois da introdução já aberta. A peça calcula o que pode fazer a cada pintura (`Introducao.tsx:51-52`), por isso o caso vale. Ele mostra que, quando `revendo` muda, "Fechar" e Esc passam a valer em todo passo, inclusive no obrigatório, sem chamar `aoConcluir`.
- **Lista da entrada em `avatar-so-nas-duas-pecas.test.ts:75`.** Tirar o `App.tsx` está certo, porque o arquivo não existe. A nova checagem de `toBeDefined()` impede que o laço passe sem conferir nada.
- **Item do parecer em `docs/interface.md`.** O texto confere com o veredito do `conformidade-reviewer` na 1ª rodada: a pose "acolhendo" continua de fora, e as condições da comemoração estão escritas.
- **Tabela de arquivos em `5_task.md`.** Agora registra a mudança em `CabecaOnca.tsx` (da X1) e nos dois documentos. Nada ficou de fora da lista.

Recomendações:
- `5_task.md:222`: o destino escrito para a recomendação "usar o mesmo `Botao` nos quatro botões" é o `TODO.md`. Só que não há essa entrada no `TODO.md`, e ele não aparece no `git status`. Escrever a entrada no `TODO.md` antes do pouso, ou trocar o destino na tabela, para a recomendação não se perder.
- `e2e/introducao-pecas.spec.ts:189-192`: o teste de transição só olha `[data-onca]`. Se outro elemento da introdução, fora os botões, ganhar transição, ele passa sem perceber. Se a intenção for "nada além dos botões", inverta o filtro: verificar tudo, menos os botões.

Arquivos citados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/TODO.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/introducao-pecas.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/introducao/Introducao.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/ui/ia/avatar-so-nas-duas-pecas.test.ts`

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-25 05:27:23 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md`

VEREDITO: APROVADO
Tabelas verificadas: nenhuma. O diff da rodada 1 para a 2 não tem migration nem schema.
Queries verificadas: nenhuma. O diff não traz repository, query, endpoint nem chamada à API. Ele mexe só nestes arquivos:
- os testes `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/introducao/Introducao.test.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/ui/ia/avatar-so-nas-duas-pecas.test.ts` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/ui/onca/Onca.test.tsx`;
- um comentário em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/ui/Comemoracao.tsx`;
- a seção da galeria `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/galeria/secoes/introducao.tsx`, que muda só texto e classe e não chama a API;
- o e2e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/introducao-pecas.spec.ts`;
- a documentação `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/docs/interface.md` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md`.
Teste de isolamento: não se aplica a esta rodada, porque nada nela lê ou grava dado de escola. A 1ª rodada não exigiu correção, então não há correção a conferir.
Bloqueantes: nenhum.
Recomendações: a recomendação da 1ª rodada continua registrada em `5_task.md`. Quando as tarefas 9.0 a 11.0 ligarem a introdução às rotas, o POST de "vista" precisa tirar o escopo do token e ter um teste de isolamento efetivo. Esse POST nasce lá e é auditado lá.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-25 05:27:24 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas, da seção "Introdução": computador-6, computador-7, celular-9 e celular-10, mais o diff inteiro). A galeria não depende de escola, então as fotos da escola vazia são iguais às da cheia e não as reli.
Estados: ok. A tarefa não cria tela de produto, só peças e a galeria. A galeria mostra a introdução no primeiro acesso e em "Revendo". O rótulo "Último evento: nenhum" mostra o estado vazio com texto legível. O caso de teste novo, "revendo que chega depois", cobre a data que chega com a peça já aberta. Carregando e erro não se aplicam às peças.
Acessibilidade:
- O checkbox "Revendo" agora tem 24 px (`size-6`) e o rótulo clicável tem `min-h-11`, o que resolve minha recomendação anterior.
- O e2e confere o nome acessível da onça: a figura é "Tutor…" e nunca "onça".
- O selo "IA" aparece ao lado do nome do Tutor.
- O e2e cobre foco, Esc e Enter.
- O e2e também confere que a onça não tem animação nem transição.
Chromebook fraco: sem mudança de risco. A diferença é que `App.tsx` saiu da lista de arquivos da entrada, porque o arquivo não existe mais, e a onça e as peças da introdução continuam fora do primeiro carregamento. O teste agora reprova se um arquivo da lista mudar de nome, em vez de passar sem conferir nada.
Celular: em 360 px (celular-9 e celular-10) não há rolagem horizontal nem texto cortado. "Sair" tem cerca de 46 px de altura, "Continuar" ocupa a largura toda com cerca de 46 px, e o checkbox mede 24 px. Nada depende de hover.
Ação oficial protegida: sim. Nada oficial acontece nesta tarefa. A `Comemoracao` mostra só o fato "Atividade enviada.", sem nota nem acerto.
Bloqueantes: nenhum.
Recomendações:
- O mockup 2.8 pede onça de 88 px no celular, e a comemoração pede 160 px (ou 120 no celular). Hoje as duas estão fixas em 120 px. A tabela de recomendações da tarefa já manda isso para as tarefas 7.0 e 9.0.
- A frase "Atividade enviada." ainda não está numa região `role="status"`, então o leitor de tela pode não anunciá-la. Fica para a tarefa 7.0.
- A fala de amostra "um programa da escola" precisa dizer que é IA no aviso de privacidade (RF14). Fica para a tarefa 9.0.
- `docs/interface.md` registra o parecer dado para as poses acenando, apontando e comemorando, e mantém a "acolhendo" fora. Isso bate com o `conformidade-reviewer`.

Arquivos principais:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/galeria/secoes/introducao.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/introducao/Introducao.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/introducao-pecas.spec.ts`

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-25 05:27:33 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. O diff da rodada 2 muda testes de unidade e e2e, um comentário em `Comemoracao.tsx`, os textos e o tamanho do checkbox da seção da galeria, o registro do parecer em `docs/interface.md` e a tabela de recomendações da `5_task.md`. Não há migration, repository, endpoint, DTO nem tipo de dado de pessoa.

Fora da tabela de dados do docs/lgpd.md: nada. Nenhum campo novo.

Autorização por objeto: não se aplica. O diff não tem rota. A chamada que registra a "vista" nasce nas tarefas 9.0 a 11.0, e a tabela de recomendações já registra que lá será auditada (`5_task.md:212`).

Logs: limpos. Não há log, evento nem telemetria. O texto novo da galeria (`galeria/secoes/introducao.tsx:20` e `:37`) diz só "Último evento: nenhum" ou "Último evento: pulou", sem nada de pessoa.

Auditoria: não se aplica. Nenhuma ação desta rodada exige auditoria pela regra 20, item 10.

Envio externo: nenhum. A rodada não chama provedor de IA.

Seed/fixture: sintético. Os textos de amostra ("Primeira fala de exemplo.", "Atividade enviada.") não têm nome nem dado real. Os passos da galeria não mudaram desde a rodada 1, quando já foram aprovados.

Bloqueantes: nenhum. A rodada 1 não exigiu correção.

Recomendações:
- O e2e novo (`e2e/introducao-pecas.spec.ts:38-40`) confere que o nome acessível da figura é a função ("Tutor") e nunca "onça". Isso reforça a regra 70, item 4a, mas não é da minha regra. A recomendação de privacidade da rodada 1 continua valendo para as tarefas 9.0 a 11.0: quando a fala trouxer o nome do aluno, esse nome só vai para a tela, nunca para evento, log ou telemetria (`5_task.md:213`).
- A recomendação da rodada 1 para a 7.0 está registrada em `5_task.md:214`: a frase passada à `Comemoracao` deve ser o fato do envio, nunca nota, acerto ou resultado.

Pergunta de fechamento: o diff não cria dado guardado nem envio novo, então não muda o que o sistema já responde sobre um aluno.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/.processo/ordens/diff-5_task-r1-r2.patch
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/galeria/secoes/introducao.tsx (só o trecho do diff)
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md (só o trecho do diff)

## infra-guardian · 2ª rodada · APROVADO · 2026-10-25 05:27:41 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: não se aplica. Não há endpoint, chamada de rede nem POST novo no diff.
Fila e prioridade: ok, porque não há job novo.
Concorrência: protegida no que cabe a esta tarefa. Hoje nada fora da galeria importa a introdução nem a `Comemoracao`. O `aoConcluir` duplo, que geraria dois POSTs de "vista", já está registrado para as tarefas 9.0 a 11.0.
Índice e paginação: ok, porque não há query nova.
Degradação de IA: não se aplica.
Migration: não se aplica.
Métrica e alerta: ok, porque não há código novo no caminho quente.
Bloqueantes: nenhum
Recomendações:
- Quando as tarefas 9.0 a 11.0 ligarem a introdução às rotas, o POST de "vista" vai valer para todos os alunos de uma turma, na primeira vez, às 10h. Esse POST precisa:
  - ser idempotente, com restrição única em `(escolaId, usuarioId, papel)` ou equivalente, e com teste de concorrência para o clique duplo;
  - ter rate limit por usuário e por escola;
  - entrar no cenário do teste de carga do primeiro acesso.
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/ui/ia/avatar-so-nas-duas-pecas.test.ts:75`, a nova asserção `toBeDefined` deixa o `if (conteudo === undefined) continue` da linha seguinte sem efeito. Pode ser removido. A saída de `App.tsx` da lista está certa: o arquivo não existe em `apps/web/src/`, e com a asserção nova um nome errado na lista agora reprova o teste em vez de passar em silêncio.

## test-engineer · 2ª rodada · APROVADO · 2026-10-25 05:27:52 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os da 1ª rodada, mais a correção pedida: "revendo, todo passo fecha, com `['eu']` do cache e depois de erro seguido de 'Tentar de novo'", que é a peça que monta com `revendo` falso e depois recebe verdadeiro.

**Cobertos:**
- **A correção exigida foi feita pelo caminho (a).** O caso novo é `Introducao.test.tsx` › "revendo que chega depois: a peça já aberta, ao receber `revendo`, passa a fechar em todo passo, inclusive no obrigatório". Ele monta com `revendo={false}` e confere que não há "Fechar" e que o Esc não chama `aoPular`. Depois faz o `rerender` com `revendo={true}`, confere que o passo continua o mesmo e, nos 4 passos, inclusive nos dois obrigatórios, que há um "Fechar" e nenhum "Pular". No fim, o "Fechar" e o Esc chamam `aoPular`, e `aoConcluir` não é chamado.
- **O caso reprova se a regra sair.** Se `revendo` fosse lido uma vez só na montagem, o "Fechar" não apareceria depois do `rerender` e o caso ficaria vermelho.
- Rodei a suíte: 25 de 25 verdes.
- **O resto do diff está certo:**
  - `avatar-so-nas-duas-pecas.test.ts:76-78` agora exige que cada arquivo da lista de entrada exista, então o laço não passa mais vazio quando um arquivo muda de nome. `App.tsx` saiu da lista porque não existe em `apps/web/src/`.
  - O e2e da galeria acompanha o texto novo ("Último evento: nenhum" e "pulou").
  - O e2e ganhou duas checagens: o nome acessível da figura começa por "Tutor" e nunca contém "onça", e a onça não tem transição.
  - O comentário novo em `Onca.test.tsx:124-125` explica que a prova daquele caso é o `@ts-expect-error`, que o typecheck confere.
  - Rodei `Onca.test.tsx` e `avatar-so-nas-duas-pecas.test.ts`: 23 de 23 verdes.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **A correção pedia o Esc em cada passo, e o caso novo só o testa no último.** Em `Introducao.test.tsx:235` o Esc só é apertado no passo 4, que não é obrigatório. O Esc no passo 1, que é obrigatório, depois do `rerender` não é conferido.
   - Uma mudança que esse caso não pega: tirar `podeFechar` da lista de dependências do efeito em `Introducao.tsx:80`. Nos passos 1 a 3, `ultimo`, `aoConcluir` e `aoPular` não mudam, porque as duas funções falsas são as mesmas a cada desenho. O efeito não se refaz e o Esc guarda o valor antigo de `podeFechar`. No passo 4 `ultimo` muda, o efeito se refaz e o caso passa.
   - Não bloqueio porque o `npm run lint` roda com `--max-warnings=0` e com `react-hooks/exhaustive-deps`, que recusa exatamente essa remoção.
   - Para fechar a prova: dentro do laço, apertar Esc em cada passo e conferir `expect(aoPular).toHaveBeenCalledTimes(passo)`.
2. A lista de arquivos de entrada em `avatar-so-nas-duas-pecas.test.ts:75` ficou sem `rotas.tsx`. Se o `rotas.tsx` importa as telas no primeiro carregamento, vale pôr na lista. Se só as importa com `lazy`, vale um comentário dizendo por que ficou de fora.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/introducao/Introducao.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/introducao/Introducao.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/ui/ia/avatar-so-nas-duas-pecas.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md

## conformidade-reviewer · 2ª rodada · REPROVADO · 2026-10-25 05:27:57 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md`

VEREDITO: REPROVADO

Caminhos de escrita em Nota: nenhum. O diff só toca frontend sem dado (um teste, um comentário, a seção da galeria, o e2e), `docs/interface.md` e `5_task.md`. Autor humano em todos: não se aplica.
Decisão autônoma sobre aluno: ausente.
Aprovação registrada: ok. O diff não gera saída de IA, e a exceção do tutor (D47) não aparece.
Supervisão do tutor: ok, o tutor não foi tocado.
Autonomia declarada e visível: sim, sem mudança. Nas fotos computador-7, celular-9 e celular-10, "Tutor IA" aparece sob a onça da introdução e sob a da comemoração. O e2e novo confere o nome acessível como o navegador o calcula: começa por "Tutor" e nunca diz "onça" (`e2e/introducao-pecas.spec.ts:38-40`).

**O texto que entrou em `docs/interface.md`, comparado com o meu parecer da 1ª rodada (`achados/5_task.md:56-60`)**
- **Condições da comemoração** (`docs/interface.md:630-632`): batem com o parecer. Um salto só, e só depois do envio confirmado. Sem número e sem som. Não depende de acerto, de resultado nem de tempo de uso. Fica parada quando a pessoa pede menos movimento.
- **"Acolhendo"**: o texto diz que "continua sem parecer e não entra (D80, item 3)", e está certo. Eu não dei parecer sobre ela, só registrei que ela não existe e que o tipo do componente recusa essa pose. O item 3 da D80 diz "uma expressão neutra só", então a citação está correta. A linha 1149 da tabela 9.7 continua dizendo "não entra".
- **Poses acenando e apontando**: registradas como aceitas, como no parecer.
- **Data**: está errada. É o bloqueante abaixo.

**As outras mudanças do diff**
- O comentário de `Comemoracao.tsx:18-19` agora cita a galeria, que era a minha recomendação 2.
- O caso novo de `Introducao.test.tsx:217-246` prova que o passo obrigatório continua sem "Pular" quando o "revendo" chega com a introdução já aberta. Também prova que "Fechar" e Esc funcionam em todo passo depois disso. É o que já valia para D59, sem regressão.
- O teste novo da onça sem transição (`e2e/introducao-pecas.spec.ts:155-163`) reforça o "SVG parado" da D80, item 3.
- Nas fotos, "Último evento: nenhum" e a frase de fato "Atividade enviada." não trazem nota, número nem sentimento.

Bloqueantes:
1. **`docs/interface.md:630`**: o texto diz que o parecer foi "dado na tarefa 5.0 da X4 (24/10/2026)". A minha rodada foi em 25/10/2026: o registro em `achados/5_task.md:46` traz "2026-10-25 05:12:31", e o hook grava hora local. O documento serve justamente para a 7.0 não reabrir o assunto e é a fonte do dossiê (D61). Do jeito que está, ele contradiz o registro de auditoria da revisão. **Correção exigida:** trocar "24/10/2026" por "25/10/2026".

Recomendações:
- **`docs/interface.md:630-632`**: acrescentar "não volta ao recarregar (RF8; a 7.0 prova, com `Atividade.tsx`)". O parecer deixou essa prova para a 7.0, e o texto de agora não a menciona.
- **`docs/interface.md:1148`**: na tabela 9.7, "nas condições acima" aponta para um trecho umas 500 linhas antes. Vale trocar por uma referência explícita, como "condições na Parte B, item do parecer".
- **`galeria/secoes/introducao.tsx:8`**: a fala de amostra ainda diz "um programa da escola" (computador-7, celular-9). Já foi encaminhada à 9.0 em `5_task.md`, e o encaminhamento basta. Fica registrado só para a validação.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/docs/interface.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/ui/Comemoracao.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/componentes/introducao/Introducao.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/e2e/introducao-pecas.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/apps/web/src/galeria/secoes/introducao.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/prd-telas-do-aluno-e-primeiro-acesso/achados/5_task.md
- Fotos: /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/.processo/vitrine/aluno--galeria--computador-7.png, aluno--galeria--celular-9.png e aluno--galeria--celular-10.png, no mesmo diretório

## conformidade-reviewer · 3ª rodada · APROVADO · 2026-10-25 05:49:13 · `tasks/prd-telas-do-aluno-e-primeiro-acesso/5_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. Desde a 2ª rodada mudaram só `docs/interface.md`, `TODO.md` e `5_task.md`, e nenhum arquivo de `apps/web` ou `e2e`. A tarefa continua só de frontend, sem `Nota`, correção nem job. Todos com autor humano? Não se aplica.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok (não há saída de IA nova nesta tarefa)
Supervisão do tutor: ok (o Tutor não é tocado)
Autonomia declarada e visível: sim (sem alteração)

Correção exigida na 2ª rodada:
- `docs/interface.md:630`: feita. O texto agora diz "Parecer dado na tarefa 5.0 da X4 (25/10/2026)", e não sobra nenhum "24/10/2026" no documento. Isso bate com o registro em `tasks/prd-telas-do-aluno-e-primeiro-acesso/achados/5_task.md` (1ª rodada, "2026-10-25 05:12:31").

As recomendações aplicadas junto estão certas:
- `docs/interface.md:632-633`: "não volta ao recarregar (RF8; a 7.0 prova, com `Atividade.tsx`)" entrou nas condições do parecer. Fica dito que a prova cabe à 7.0, não a esta tarefa.
- O `TODO.md` ganhou uma entrada sobre usar o `Botao` nos quatro botões de `Introducao.tsx`. É só refatoração, sem efeito na regra 70.
- Nas linhas novas da tabela de recomendações em `5_task.md`, a do POST de "vista" vai para as tarefas 9.0 a 11.0. Ela não abre registro nominal de comportamento: é o fato de o aluno ter visto a introdução, não uso do Tutor nem navegação. A 9.0 deve confirmar isso quando o POST nascer.

Fotos: nenhum arquivo de `apps/web` mudou desde a 2ª rodada, então vale o que vi nas fotos dela, sem achado novo.

Bloqueantes: nenhum.

Recomendações:
1. `docs/interface.md:1149`: a referência nova manda o leitor para "as condições da Parte B, item 'A comemoração na entrega e a onça acolhendo'". Só que esse item está na seção 7 ("Em aberto", linha 627), que fica na Parte A. A Parte B começa na linha 659. O nome do item está entre aspas e dá para achar por busca, por isso não bloqueia. Mesmo assim, troque por "nas condições da seção 7, item 'A comemoração na entrega e a onça acolhendo'" na próxima tarefa que mexer no documento, de preferência na 7.0, que é quem prova essas condições.
2. Seguem de pé as recomendações já encaminhadas: a fala de amostra "um programa da escola" (para a 9.0) e o nome do aluno na fala do `BemVindo` ficar só na tela, sem ir para evento, log nem telemetria (para as tarefas 9.0 a 11.0). Também fica a da 7.0: a `Comemoracao` em `Atividade.tsx` só mostra o fato ("Atividade enviada."), nunca nota, acerto ou resultado.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/docs/interface.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/tasks/prd-telas-do-aluno-e-primeiro-acesso/achados/5_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-aluno-e-primeiro-acesso--l3/.processo/ordens/diff-5_task-r2-r3.patch
