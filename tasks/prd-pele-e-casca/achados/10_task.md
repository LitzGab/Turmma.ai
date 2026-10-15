# Achados das revisões — `tasks/prd-pele-e-casca/10_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-15 15:03:19 · `tasks/prd-pele-e-casca/10_task.md`

VEREDITO: APROVADO

A tarefa 10.0 muda só o desenho das peças de `componentes/ia/`. Não toca na API, no banco, em `Nota`, em job, seed ou importação. Os nove itens foram conferidos no diff e nas fotos.

Caminhos de escrita em Nota: nenhum nesta tarefa. Nada no diff grava, mostra ou sugere nota — todos com autor humano? sim (não há caminho novo).

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok.
- `LinhaAprovacao.tsx` não mudou e continua sendo o `Estado`, mostrando quem e quando.
- Na foto `professora--professor-time-assistente--radio-name-Claro--computador.png`, a correção aparece com a linha "APROVADA POR PROFESSORA SINTÉTICA HELENA · 13/10, 08H50". A adaptação aparece com "ESPERANDO VOCÊ", "APROVAR" e "REJEITAR…", e o texto diz que nada chega ao aluno antes da aprovação.
- Na galeria (`professora--galeria--radio-name-Claro--computador-4.png`) aparecem os três estados, e a rejeitada mostra o motivo.
- Em `Mensagem.tsx`, a ordem "aprovação antes das ações" é coberta por mutação.

Supervisão do tutor: ok.
- `aluno--aluno-tutor--computador.png` mostra "Quem dá a aula acompanha como você usa o Tutor."
- `professora--professor-time-tutor--radio-name-Claro--computador.png` mostra os sinais de dificuldade e o uso da turma, com "Não há uso do Tutor que você não veja". Não há inferência emocional nem janela sobre comportamento.

Autonomia declarada e visível: sim. As telas do Time mostram o "O que cada função faz sozinha, e o que espera você" em português comum, e esta tarefa não mexe nisso.

Bloqueantes: nenhum.

O que foi conferido da regra 70 e não bloqueia:
- **Itens 4b e D59.**
  - As duas opções da `Escolha` têm uma constante só (`Escolha.tsx:59-61`), sem a face laranja nem a grafite e sem foco ao abrir. O e2e prova a mesma largura, altura, fundo, borda e degrau. Nas fotos, claro e escuro, as duas pesam igual, e desligadas ficam cinzas juntas.
  - "Parar" continua `secundario`, coberto por teste e mutação.
  - `Pensando` é texto parado. A mutação `animate-pulse` exige que o teste fique vermelho, e o e2e confere `animationName` igual a `none`.
- **Item 4a (saída de IA marcada como IA).** Toda mensagem de agente nas fotos leva a assinatura com o selo "IA". No `balao`, a assinatura continua em cima, e `Mensagem.tsx` não volta a importar o `AvatarAgente`.
- **Itens 8 e 2a (D55).** Nenhum campo, tela ou texto sugere nota em discursiva ou redação. O formulário da Adaptação recebe só o tipo de adaptação ("Não escreva nada sobre o aluno").
- **Chip "da web".** Não desenhá-lo sem dado (D68 nasce no F9) é a escolha conservadora certa.
- **`AvisoFila`.** Mostra a falha sem código de erro, e uma mutação cobre isso.

Recomendações:
1. `apps/web/src/galeria/secoes/ia.tsx:240-242`: a pergunta "Posso corrigir a lista com a ferramenta" não diz a modalidade. Ela não aparece na tela, porque essa `Escolha` já está escolhida. Mesmo assim, por ser a galeria de referência das peças, diga "a lista objetiva" ou "a objetiva". Assim nenhuma cópia futura sugere correção por IA de lista que pode ser discursiva (D55).
2. `apps/web/src/galeria/secoes/ia.tsx:259`: o exemplo "O Tutor está pausado nesta avaliação" está bom. Quando a caixa desligada do Tutor entrar numa tela de verdade, confira se o texto não pede ao aluno que espere ou volte, para não induzir uso (4b).
3. Fora desta regra, para o `frontend-reviewer`: no escuro, a caixa desligada mal se distingue da ligada (`escuro--professora--galeria--computador-5.png`, `CaixaPedido.tsx` com `disabled:bg-fundo-suave`).

Arquivos lidos:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/10_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/ia/Escolha.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/ia/Mensagem.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/ia/CaixaPedido.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/ia/LinhaAprovacao.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/galeria/secoes/ia.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/areas/professor/Time.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/pecas-ia.spec.ts`

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-15 15:03:52 · `tasks/prd-pele-e-casca/10_task.md`

VEREDITO: APROVADO

Tela vista: sim (38 fotos lidas, em claro e escuro, escola cheia e vazia). Foram elas: `/galeria` (IA) em computador 1 a 9 e celular 5 a 9 e 11 no claro, mais computador 3 a 6 no escuro; `/professor/nova-conversa` em 5 variações; `/professor/time/assistente` e `/professor/time/tutor` em claro e vazia; `/aluno/tutor` em computador e celular, nos dois temas e na escola vazia.

Estados: ok. Nas peças desta tarefa, carregando e erro foram conferidos pelo código e pelos testes: `AvisoFila` (`falha` com `alert`, "Tentar de novo" e texto sem código; `demora` com `status`) e `MotorFormulario` (falha do envio, pendências, "gerando"). Vazio e com dado aparecem nas fotos. Rodei `npx vitest run --project unidade apps/web/src/componentes/ia`: 13 arquivos, 101 testes passando.

Acessibilidade: ok.
- A caixa de cada tipo do `MotorFormulario` mantém o `checkbox` nativo à vista, com `focus-within:outline-foco` na etiqueta.
- A "marcada" não depende só de cor: o visto nativo continua à mostra, além da face azul.
- O `AvisoFila` mantém `alert` e `status` nos papéis certos.
- O e2e novo roda axe nos dois temas, nas dez seções de IA.
- As peças desligadas usam texto `apoio` sobre a face `borda`, e o e2e confere a descrição.

Chromebook fraco: ok.
- Nenhuma peça nova tem animação, laço ou pulso. O `Pensando` é só texto parado.
- A medida do exemplo na `CaixaPedido` só reflui quando o campo está vazio. O `ResizeObserver` só reage à largura da caixa, não a cada tecla.
- Nada de imagem nem de lista longa foi tocado.

Celular: ok em 360 px, sem rolagem horizontal nem texto cortado.
- O exemplo "Peça uma atividade, um plano de aula…" quebra em duas linhas e aparece inteiro, na galeria e em `/professor/nova-conversa`.
- "Enviar" tem 44 × 44 px.
- As duas opções da `Escolha` empilham, com 44 px ou mais.
- A lista de tipos do `MotorFormulario` fica em coluna única, com 64 px.
- O chip tem 28 px, acima do piso de 24 px.
- Nada depende de hover: o `hover:` das peças é só decoração.

Ação oficial protegida: sim. Nenhuma ação oficial foi alterada. "Parar" continua `secundario`, com 44 px e borda de 2 px (D59). "Tentar de novo" é `secundario`. A aprovação continua o `Estado` da 6.0, antes das ações, com quem e quando, e o teste da `Mensagem` prova a ordem.

Bloqueantes: nenhum.

Recomendações:
1. **Chip "da web" não desenhado.**
   - A subtarefa 10.1 o pedia, e a divergência está declarada e justificada: o contrato `Citacao` não tem origem web (D68, F9).
   - A linha de `docs/interface.md` 10.2 foi reescrita para dizer isso, o que é coerente.
   - Falta uma linha no `TODO.md` ou no `ROADMAP.md` do F9 para a variante tracejada não se perder.
2. **Exemplo do `Campo` truncado a 360 px.**
   - O placeholder do campo "Tema" do `MotorFormulario` aparece cortado em `/galeria` (celular-8): "Estequiometria: reagente limitar".
   - É `Campo` de linha única e não é desta tarefa, mas vale registrar para o `/retro`: o mesmo problema que a `CaixaPedido` resolveu.
3. **Tabela estreita da galeria.**
   - A demonstração `data-tabela-estreita` (280 px, `superficies.tsx:149`) mostra a tabela em modo largo dentro de um contêiner estreito, com "AGENTE E FUNÇÃO" cortado (computador-8).
   - Não é desta tarefa e não acontece a 360 px de viewport (celular-11 mostra o modo lista, correto). É peça de outra tarefa, e o recorte pode confundir quem olhar a galeria.
4. **"Tentar de novo" no `AvisoFila`.** É `secundario`, enquanto o `EstadoErro` de página usa o primário laranja. É coerente com o aviso inline, mas vale uma linha em `docs/interface.md` 10.2 dizendo por quê.
5. **Alvo de toque no e2e.** O seletor exclui `button[aria-expanded]` (`e2e/pecas-ia.spec.ts`), o que deixa de fora os gatilhos de menu como "Só conversar ▾" e "Ferramenta ▾". Nas fotos eles têm 44 px ou mais, mas o teste não os prova.

Arquivos relevantes (todos em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1`):
- `apps/web/src/componentes/ia/CaixaPedido.tsx`
- `apps/web/src/componentes/ia/Escolha.tsx`
- `apps/web/src/componentes/ia/Mensagem.tsx`
- `apps/web/src/componentes/ia/MotorFormulario.tsx`
- `apps/web/src/componentes/ia/AvisoFila.tsx`
- `apps/web/src/galeria/secoes/ia.tsx`
- `e2e/pecas-ia.spec.ts`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-15 15:04:36 · `tasks/prd-pele-e-casca/10_task.md`

**VEREDITO: REPROVADO**

Falta prova para uma única cláusula nova. O resto da tarefa está bem testado.

**Cenários exigidos**
- Caminho feliz: as dez peças com borda de 2 px e degrau onde se aperta, nos dois temas.
- Bordas da tarefa:
  - o exemplo do campo vazio a 360 px;
  - a largura da caixa que muda (a lateral recolhe);
  - a `Escolha` desligada e a já escolhida;
  - o texto acima de 192 px;
  - a `Escolha` que abre com a escolha já feita e não puxa o foco;
  - o tema escuro.
- Regra (D59 e regra 70, itens 3 e 4b):
  - as duas opções da `Escolha` são iguais, nenhuma laranja nem grafite, e nenhuma vem com o foco;
  - o "Parar" é `secundario`;
  - `Pensando` não tem laço;
  - o aviso de fila não mostra erro cru;
  - a aprovação tem lugar fixo, e a A30 continua valendo.
- Permissão e isolamento: não se aplicam, porque a tarefa é só de visual, sem dado nem endpoint.
- Concorrência: não se aplica. Depois da escolha o cartão some, e o segundo clique não tem onde cair.

**Cobertos**
- Os testes de unidade rodam verdes (`npx vitest run --project unidade apps/web/src/componentes/ia`: 13 arquivos, 101 testes).
- Conferi os blocos de mutação da `CaixaPedido`, da `Escolha`, da `Mensagem`, do `AvisoFila`, do chip, das `Fontes`, da `PaginaMini` e do `MotorFormulario` contra o código. Todos chegam à cláusula e ficam vermelhos pelo motivo certo. Exemplos:
  - `exemplo !== undefined` sem checar o vazio apaga o valor digitado;
  - `'undefined'` posto como valor quando não há exemplo;
  - a largura de referência que não é atualizada no `ResizeObserver`.
- O e2e cobre:
  - o exemplo quebrado a 360 px, com a guarda `hasTouch` para não passar vazio;
  - a borda e o degrau calculados pelo navegador;
  - o chip de 28 px e 14 px;
  - o axe só nas seções desta tarefa, nos dois temas;
  - o alvo de 44 px no `celular`.
- A A30 continua no e2e que já existia, nos três estados.
- Nenhum `.skip` e nenhum provedor de IA. Os mocks são só de `scrollHeight`, `clientWidth`, `ResizeObserver` e `matchMedia`, que o `jsdom` não tem, e não escondem regra nossa.

**Bloqueantes**
1. `apps/web/src/componentes/ia/Escolha.tsx:74`: o cartão da pergunta (`data-escolha="aberta"`) passou de `border border-linha` para `border-2 border-borda`, e nenhum teste nem bloco de mutação prova isso.
   - O `Escolha.test.tsx` olha só os dois botões e a linha da escolha feita.
   - O e2e (`e2e/pecas-ia.spec.ts:130-139`) mede só os botões.
   - Voltar a `border border-linha` passaria verde. Isso fere o objetivo da tarefa ("borda de 2 px em toda peça"), e a seção "Mutações" diz cobrir "a borda de 2 px" da `Escolha`.
   - **Correção:** no `Escolha.test.tsx`, um teste que verifica `border-2` e `tokenDe(grupo, 'border') === 'borda'` no `role="group"`. No `10_task.md`, um bloco de mutação `rounded-cartao border-2 border-borda bg-superficie p-3` → `rounded-cartao border border-borda bg-superficie p-3` que aponte para esse teste.

**Recomendações**
- `MotorFormulario.tsx`: o `focus-within:outline-*` do rótulo é novo e não tem teste. O `checkbox` nativo já tem o anel global de `:focus-visible`, e o `focus-within` acende também no clique do mouse. Vale `has-[:focus-visible]:` ou tirar.
- `MotorFormulario.tsx`: os `name`/`value` novos do `checkbox` não têm efeito no formulário, que é controlado. Ou justificar, ou tirar.
- `CaixaPedido.tsx` (`ajustarAltura`): com o campo vazio, mudar o `value` por código pode limpar o histórico do desfazer do navegador. Quem apaga tudo e aperta Ctrl+Z pode não recuperar o texto. Vale registrar no `TODO.md` ou cobrir no e2e.
- O 14 px do chip, o `font-bold` das `Fontes` e o `t-corpo` do `AvisoFila` só têm prova no e2e ou nenhuma. É tipografia e não bloqueia, mas os 14 px do chip seguem o piso de 14 px da 9.2 do `docs/interface.md`, e um bloco de unidade fecha o caso antes do commit.
- Os nomes dos tokens não batem:
  - o comentário de `Escolha.tsx:26-29` diz "face `fundo`", mas a classe é `bg-superficie`;
  - o `MotorFormulario` usa `bg-fundo` na caixa desmarcada;
  - a tabela de testes da tarefa diz "Parar com fundo `fundo`", e o teste confere `superficie`.

  Os dois tokens têm o mesmo valor nos dois temas, então hoje não aparece na tela. Mas o nome diverge entre as peças.
- `e2e/pecas-ia.spec.ts:472` (`violacoesDasSecoes`) repete a lógica do `violacoesGraves`. Vale um parâmetro de seções no helper de `e2e/__fixtures__/verificacoes.ts`.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/ia/Escolha.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/ia/Escolha.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/10_task.md

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-15 15:04:38 · `tasks/prd-pele-e-casca/10_task.md`

VEREDITO: REPROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. As divergências de produto (a medida do exemplo, a `Escolha` com uma constante só, o `checkbox` nativo no motor, o chip "da web" que não é desenhado, a `PaginaMini` com letra de 14 px) estão no parágrafo novo da `techspec.md` 9. A bolha da pessoa com borda segue a `docs/interface.md` 9.3. Nenhuma delas muda cenário do `cenarios.md`.

Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)").

Bloqueantes:

- **O campo apaga o histórico de desfazer**, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/ia/CaixaPedido.tsx:47-55` (`ajustarAltura`), chamada no `useLayoutEffect` da linha 84 e no `ResizeObserver` da linha 93.
  - **O que está errado:** para medir o exemplo, a função escreve no campo que a pessoa está usando. Ela troca o valor do campo pelo exemplo e depois devolve o campo a vazio. No Chromium, quando o código troca o valor de um campo, o Ctrl+Z do campo perde o que guardava.
  - **Quando acontece:** o efeito roda sempre que `valor` fica vazio. Basta a professora apagar o pedido inteiro, com Ctrl+A e Delete ou com o backspace, e o Ctrl+Z não traz o texto de volta. Antes da tarefa trazia, porque o React não escreve no campo quando o valor já é igual.
  - **Por que é desta tarefa:** a 10.1 pede revestir "sem mudar props, texto nem ordem de foco", e isto muda o comportamento da peça mais usada da conversa. Os testes não pegam: o de unidade só confere `campo.value === ''`, e o e2e usa `fill('')`.
  - **Correção exigida:** medir o exemplo num elemento à parte, sem escrever no campo que tem o foco. Pode ser um `textarea` espelho, fora da tela e `aria-hidden`, com as mesmas classes e a mesma largura, ou a leitura do `::placeholder` que a própria tarefa sugere em "Como testar". Ajustar os testes e as mutações da `CaixaPedido` à medida nova, incluindo a mutação "sem devolver o valor", que deixa de fazer sentido.

Recomendações:

- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/ia/Escolha.tsx:30-31`: `CLASSES_DA_OPCAO` repete à mão a cor do secundário e do desligado que já estão em `botao-secundario.ts` (`COR_DO_SECUNDARIO` e `DESLIGADO`). Muda só o texto, que aqui é `tinta`. Exportar e compor as duas evitaria um segundo jeito de pintar o mesmo botão. O comentário fala em "face `fundo`", mas a classe é `bg-superficie`, apelido de `fundo`: vale escrever do mesmo jeito.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/docs/interface.md:799`: a tabela de pares de contraste ainda diz que o balão de quem escreve é `tinta` sobre `creme`. A bolha agora é `fundo-suave`. Corrigir a linha, ou apontá-la para o par de `fundo-suave` que já existe.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/ia/CaixaPedido.tsx:93`: quando a largura muda, a função de retorno altera a altura do próprio formulário que está sendo observado. Isso pode gerar o aviso "ResizeObserver loop completed with undelivered notifications". Ele não quebra nada, mas vale observar o campo, ou adiar a medida para o próximo quadro. Isso some se a correção acima medir num elemento espelho.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/ia/ChipFonte.tsx:73`: `text-[14px]` é uma medida escrita à mão. Se existir classe de tipografia de 14 px (`t-apoio` ou outra), usar ela.
- Fotos conferidas, sem achado de aderência:
  - `professora--professor-time-assistente--radio-name-Claro--computador.png`: a data e o balão alinhados depois de tirar o `pl-8`.
  - `professora--professor-nova-conversa--radio-name-Claro--celular.png`: o exemplo inteiro a 360 px.
  - `professora--galeria--radio-name-Claro--computador-4.png` a `-6.png`: as duas opções da `Escolha` iguais, ligadas e desligadas.
  - `escuro--professora--professor-time-tutor--computador.png`: o tema escuro.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-15 15:27:47 · `tasks/prd-pele-e-casca/10_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. O diff da rodada 2 só mexe no desenho de `componentes/ia/`, na galeria, nos testes e na documentação. Não há serviço, repository, job, seed nem importação que escreva em `Nota` — todos com autor humano? sim (não existe nenhum caminho)
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. Em `professora--professor-time-assistente--radio-name-Claro--celular.png`, a correção de objetiva aparece com "Aprovada por … · 13/10, 08h50". A adaptação aparece como "Esperando você", com Aprovar e Rejeitar. O diff não toca na `LinhaAprovacao`.
Supervisão do tutor: ok. Em `aluno--aluno-tutor--celular.png` está o aviso "Quem dá a aula acompanha como você usa o Tutor". O diff não toca no tutor.
Autonomia declarada e visível: sim. A tela do time ainda mostra "O que cada função faz sozinha, e o que espera você", e o `Time.tsx` não mudou desde a rodada 1.

**O que confirmei nesta rodada:**
- **A recomendação 1 da rodada 1 foi aplicada.** Em `apps/web/src/galeria/secoes/ia.tsx:240` a pergunta passou a ser "Posso corrigir a lista objetiva com a ferramenta, ou só conversar.". Assim, a demonstração não sugere mais correção por IA de qualquer modalidade (D55).
- **A `CaixaPedido` agora mede o texto de exemplo num campo espelho invisível** (`apps/web/src/componentes/ia/CaixaPedido.tsx:158-173`). Esse espelho só tem o texto de exemplo, fica escondido do leitor de tela e fora do foco. Ele não guarda nada sobre o texto do aluno e não grava nem envia nada, então a regra 70 e a regra 20 não são afetadas.
- **O motor de formulário perdeu os atributos `name` e `value` das caixas de marcar** (`apps/web/src/componentes/ia/MotorFormulario.tsx:70`). O valor continua seguindo por `aoMudar`. Não é assunto da regra 70.
- **As mudanças no chip de fonte (`t-apoio`) e na borda da `Escolha` são só de desenho.** Nas fotos, o selo "IA" e a assinatura com a função continuam em toda saída de IA. Nenhuma tela mostra nota, conceito ou sugestão de nota em discursiva ou redação. Nenhuma métrica de professor aparece. Nenhum elemento empurra o uso nem dificulta sair: o "Sair" está visível em todas as telas de celular.
- **A minha recomendação da rodada 1 sobre a caixa desligada do Tutor foi registrada.** Está no `TODO.md`, na seção da 10.0 da X1, como item para quando ela entrar numa tela de verdade (regra 70, item 4b).

Bloqueantes: nenhum

Recomendações: nenhuma nova. A da caixa desligada do Tutor continua aberta no `TODO.md` até ela entrar numa tela.

Arquivos de referência:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/.processo/ordens/diff-10-r1-r2.patch
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/galeria/secoes/ia.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/ia/CaixaPedido.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/.processo/vitrine/professora--galeria--radio-name-Claro--computador-5.png
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/.processo/vitrine/professora--professor-time-assistente--radio-name-Claro--celular.png

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-15 15:27:53 · `tasks/prd-pele-e-casca/10_task.md`

VEREDITO: APROVADO
Tela vista: sim (11 fotos lidas nesta rodada: galeria no claro e no escuro, computador e celular, a nova conversa no celular e o tutor do aluno no escuro; as demais seguem o que a 1ª rodada já aprovou). Código lido pelo diff `5536a64..ed6e145`.
Estados: ok. A caixa de pedido mostra pronta, gerando, desligada e com exemplo vazio, e o motor mostra a falha do envio. Carregando e erro foram conferidos pelo código e pelo e2e, não pela foto.
Acessibilidade: ok.
- O espelho da `CaixaPedido` (`apps/web/src/componentes/ia/CaixaPedido.tsx`) tem `aria-hidden`, `tabIndex=-1`, `readOnly`, `invisible` e nenhum `name`. O campo continua sendo o único `textbox` do formulário, e o teste novo prova isso.
- O anel de foco da caixa de marcar do `MotorFormulario` agora vem de `has-[:focus-visible]`, então acende no teclado e não no clique do mouse.
- O chip usa `t-apoio` (15 px), acima do piso de 14.
- O alvo de toque do e2e agora inclui os gatilhos de menu.

Chromebook fraco: ok.
- A medida do exemplo deixou de escrever no campo e de forçar duas leituras de `scrollHeight` com o valor trocado.
- O `ResizeObserver` observa o espelho, que não muda de altura com o campo, então o ajuste não se realimenta.
- Pela correção, o Ctrl+Z do usuário não é mais perdido, e o e2e novo prova isso.

Celular: ok.
- Em 360 px não há rolagem horizontal, e o exemplo da caixa quebra em duas linhas e cabe inteiro (`professora--galeria--radio-name-Claro--celular-7.png`, `professora--professor-nova-conversa--radio-name-Claro--celular.png`).
- Os alvos de ação têm 44 px, e o chip tem 28 px, acima do piso de 24 px.
- Não há dependência de hover.

Ação oficial protegida: sim. Esta tarefa não cria ação oficial; o que aparece é "Aprovada por Camila Souza · 19/09, 10h42" e o botão Revisar, sem confirmação em um clique.

Pedido extra, caixa de pedido desligada no escuro (`escuro--professora--galeria--radio-name-Escuro--computador-5.png`): não, a caixa desligada não se distingue da ligada pelo desenho.
- Medi os pixels: o campo desligado e o campo ligado têm o mesmo fundo `#202F36`, a mesma borda `#6B7F88` e o mesmo cinza de texto do exemplo.
- A causa é que `fundo-suave` e `campo` têm o mesmo valor no escuro (`apps/web/src/estilos.css:176` e `:179`), então `disabled:bg-fundo-suave` (`CaixaPedido.tsx:156`) não muda nada.
- O botão de enviar também é igual ao da caixa ligada com campo vazio.
- No claro a diferença existe: a face interna fica `#F7F7F7` (`professora--galeria--radio-name-Claro--computador-5.png`).
- No escuro, o que diz o estado é só o texto do exemplo, "O Tutor está pausado nesta avaliação". Isso é aceitável como informação, porque a causa está escrita, mas não é aceitável como desenho.
- Não bloqueia: o desenho segue `docs/interface.md:1402`, que manda `fundo-suave` e texto `apoio`, e o texto explica o porquê.

Bloqueantes: nenhum.

Recomendações:
- Dar à caixa desligada um sinal que não dependa do fundo no escuro, por exemplo a borda do formulário em `borda` no lugar de `borda-campo` quando `estado === 'desligada'`, ou o botão de enviar com a face `borda`. A correção cabe em `CaixaPedido.tsx:156` e `:~176`. Registrar no `/retro` que o token `fundo-suave` do escuro coincide com `campo` (`docs/interface.md:618`), o que vale também para o `Campo` desligado de 1402.
- Nas fotos da nova conversa, o seletor mostra "2ºB 624444e1 · Química". É o sufixo do dado de teste, não do produto, e vale conferir que a escola real não o mostra.
- Os itens já registrados no `TODO.md` (placeholder "Tema" truncado no `Campo`, chip da web, tabela estreita da galeria) seguem fora desta tarefa.

## test-engineer · 2ª rodada · APROVADO · 2026-10-15 15:28:01 · `tasks/prd-pele-e-casca/10_task.md`

VEREDITO: APROVADO

**Cenários exigidos (2ª rodada):**
- A correção da 1ª rodada: a borda de 2 px do cartão da pergunta da `Escolha` precisa de teste e de bloco de mutação.
- O que o diff desde a rodada anterior afeta:
  - a medida do exemplo da `CaixaPedido` agora é feita num espelho, sem escrever no campo;
  - o chip de fonte usa `t-apoio`;
  - o anel de foco do `MotorFormulario` vem do `:focus-visible`;
  - o alvo de toque no e2e passou a incluir os gatilhos de menu.

**Cobertos:**
- **Correção 1, feita.** `apps/web/src/componentes/ia/Escolha.test.tsx:55-62` (no arquivo atual) acha o `role="group"` pelo nome. O teste exige `border-2`, a ausência de `border` e `tokenDe(..., 'border') === 'borda'`. O bloco em `tasks/prd-pele-e-casca/10_task.md:138-143` troca `border-2 border-borda` por `border border-borda` na linha 74 de `Escolha.tsx`, onde o texto está exatamente assim. O teste fica vermelho pelo motivo certo, porque `border-2` some.
- **O espelho da `CaixaPedido`:**
  - A altura vinda do espelho tem bloco (`'nunca'`), e o valor do espelho também (`value=""`).
  - Sem exemplo, o espelho não existe, com o bloco `{true && (`.
  - O ResizeObserver observa o espelho, e não a caixa. Há bloco para `parentElement`.
  - Há blocos para `aria-hidden`, `tabIndex`, `readOnly`, `invisible` e `t-corpo`.
- **A regra nova, de que a medida não escreve no campo em uso:**
  - O teste de unidade (`CaixaPedido.test.tsx`, "apagar o pedido não escreve no campo") intercepta o setter de `value` da instância. Ele exige que o exemplo nunca seja escrito e que haja no máximo uma escrita. O bloco reintroduz o "põe e devolve" e o teste fica vermelho.
  - No navegador de verdade, o e2e prova o desfazer em `e2e/pecas-ia.spec.ts:433-443` (digita, Ctrl+A, Delete, Ctrl+Z, o texto volta). O e2e foi alterado, então o portão da tarefa o roda.
- **Chip de fonte:** o teste checa `t-apoio` e nenhum `text-[Npx]`, há um bloco que volta a `text-[14px]`, e o e2e mede 15px.
- **`MotorFormulario`:** o teste checa `has-[:focus-visible]:outline*` e nenhum `focus-within:`, com um bloco que volta ao `focus-within`.
- **Execução:** rodei `Escolha.test.tsx`, `CaixaPedido.test.tsx` e `pecas-revestidas.test.tsx`, e passaram 23 de 23. Não há `.skip`, `.only` nem `todo` em `componentes/ia/` nem em `e2e/pecas-ia.spec.ts`. Não há IA nem concorrência nesta tarefa, que é só de desenho.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Algumas classes do espelho não têm bloco de mutação: `pointer-events-none`, `inset-x-0 top-0`, e os itens `px-3`, `py-2.5`, `min-h-11` e `w-full`. O teste "o espelho é só para medir" já confere todas, então tirar qualquer uma deixa o teste vermelho, mas só `t-corpo` tem bloco. Um bloco para `w-full` cobriria a classe de que mais depende a quebra de linha igual à do campo.
2. A troca de `name`/`value` do `checkbox` do `MotorFormulario` não está registrada (`apps/web/src/componentes/ia/MotorFormulario.tsx`, por volta da linha 312). Os atributos saíram, e nada no código nem no e2e depende deles, porque o estado é controlado e o `.check()` vai pelo rótulo. Vale uma linha nas divergências da `10_task.md` dizendo por que saíram, para o `/validar` não ler isso como regressão.
3. O teste do desfazer redefine `value` na instância por cima do rastreador do React. Funciona para o que prova, mas é frágil a uma troca de versão do React. Quem prova a regra de verdade é o Ctrl+Z do e2e, e um comentário no teste de unidade dizendo isso ajudaria quem o mantiver.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-15 15:28:41 · `tasks/prd-pele-e-casca/10_task.md`

**VEREDITO: APROVADO**

A correção exigida na 1ª rodada foi feita, e nada no diff da 2ª rodada pede reprovação.

Escopo: respeitado
Aderência à Tech Spec: ok. A medida no espelho está registrada na `techspec.md` §9 ("num espelho fora do campo…"), na divergência do `10_task.md` e em `docs/interface.md` 10.2.
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)").

**Correção da 1ª rodada (o desfazer do campo):** feita.
- `apps/web/src/componentes/ia/CaixaPedido.tsx:49-53`: `ajustarAltura` não escreve mais no campo. Com o campo vazio, lê o `scrollHeight` do espelho.
- O espelho fica nas linhas 162-173. É um `textarea` `aria-hidden`, `tabIndex={-1}`, `readOnly`, `invisible` e `absolute inset-x-0`, com o mesmo `t-corpo`, `px-3`, `py-2.5`, `min-h-11` e `w-full` do campo, dentro de um invólucro `relative` que divide a largura com ele. Não tem `name`, então nada vai no envio do formulário.
- O `ResizeObserver` observa o espelho e não mais o formulário, cuja altura mudava com o ajuste. Isso também resolve a recomendação do aviso de laço do observador.
- Testes ajustados:
  - O teste de unidade novo intercepta o setter de `value` e prova que o exemplo nunca é escrito no campo.
  - Outro teste prova que o espelho fica fora do leitor de tela e do foco: `getAllByRole('textbox')` devolve só o campo.
  - No e2e (`e2e/pecas-ia.spec.ts:433-443`): digita, Ctrl+A, Delete, Ctrl+Z, e o texto volta. É o caso que eu exigi.
- Mutações: a "sem devolver o valor" saiu. Entraram mutações para o espelho, para o campo não escrito e para o alvo do observador.
- Nas fotos, o exemplo continua inteiro a 360 px, em duas linhas: `professora--professor-nova-conversa--radio-name-Claro--celular.png` e `professora--galeria--radio-name-Claro--celular-7.png`. A caixa de só texto e a desligada mantêm a largura (`professora--galeria--radio-name-Claro--computador-5.png`).

**O restante do diff da rodada:** são recomendações aplicadas de outros revisores, todas dentro dos arquivos da tarefa.
- `ChipFonte` passou a usar `t-apoio`, com o e2e acertado para 15 px.
- `has-[:focus-visible]` no `MotorFormulario`.
- Saíram o `name` e o `value` que a própria tarefa tinha posto no checkbox. Agora ele está igual ao `HEAD`.
- Teste e mutação para a borda de 2 px do cartão da `Escolha`.
- O texto "lista objetiva" na galeria.
- O par de contraste `fundo-suave` em `docs/interface.md`.
- O alvo de toque no e2e agora inclui os gatilhos de menu.
- As linhas novas do `TODO.md`.

Bloqueantes: nenhum.

Recomendações:
- `apps/web/src/componentes/ia/CaixaPedido.tsx:154` e `:171`: as classes de letra e de respiro do campo e do espelho estão escritas duas vezes à mão. Uma constante única para as duas evita que uma mude sem a outra. Hoje o teste segura isso só para a lista fixa que ele confere.
- `apps/web/src/componentes/ia/CaixaPedido.test.tsx`, no teste "apagar o pedido não escreve no campo": o `toBeLessThanOrEqual(1)` é folgado. Conferir `escritas` igual a `['']` diria exatamente a única escrita esperada, a do React.
