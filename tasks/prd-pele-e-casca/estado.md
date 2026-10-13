# Estado da execução — pele-e-casca (X1)

> Este diário foi aberto fora do Maestri, pela sessão "Claude Code #2", na noite de 12 para 13/10/2026: o Joaquim
> pediu as specs do mockup de outubro, delegou as decisões ("você pode tomar todas as decisões para o projeto, eu
> Joaquim permito") e foi dormir. A decisão é a D80. O Orquestrador assume a partir daqui: o caminho está em "Para
> uma sessão limpa".

## Agora
- **Tarefa atual:** **1.0** (os tokens da D80, no claro e no escuro), implementada e com o portão da tarefa verde;
  falta a rodada da Mesa e o commit. Em paralelo, a **rodada 3 da revisão da spec** (`revisao-spec.md`)
- **Espero:** o relatório da Mesa da 1.0 e o veredito da rodada 3 da spec
- **Devo ainda:** (1) fechar a 1.0: Mesa, ordem de correção se houver, `portao-local.ts conferir`, marcar no
  `tasks.md` e commit `(tarefa 1.0)`; (2) fechar a revisão da spec e pôr o status da Tech Spec; (3) commit dos
  documentos das quatro specs; (4) revisão de spec da X2, da X3 e da X4, que **ainda não foram revistas por
  guardião nenhum**; (5) seguir pela 2.0
- **Para uma sessão limpa:** a branch é `spec/pele-e-casca`, criada da `develop` em `426e259`, num checkout avulso
  (`~/Documentos/git/.andares-avulsos/educaia--spec-pele-e-casca`), que **não é andar do Maestri**. Para o time
  assumir: fechar a sessão que está nele, `git worktree remove` desse checkout, criar o andar com a branch que já
  existe (`--existing-branch spec/pele-e-casca`) e o Joaquim digitar `/seguir pele-e-casca`. O ambiente de teste
  deste checkout é o 3 (`.processo/ambiente`)
- **Como a revisão correu sem o Maestri:** o hook de revisões escreve no diretório em que a sessão **nasceu**. Por
  isso cada rodada foi conduzida por uma sessão aberta dentro deste checkout (`claude -p`, com o pedido por
  arquivo), que chama os revisores como subagentes: é o fim deles que registra a rodada. A primeira rodada da spec
  não ficou registrada pelo hook, e o `revisao-spec.md` diz isso no topo
- **Base:** `spec/pele-e-casca`, com a `develop` até `426e259`. Nada foi enviado ao GitHub: push é do Joaquim

## Concluídas
| Tarefa | Commit | Modelo | Rodadas | Observação |
|---|---|---|---|---|
| D80 e o `docs/interface.md`, Parte B | `32c9bf3` | Opus | não se aplica | só documento: decisão, ROADMAP (X1 a X4 antes do F2), TODO e o documento de interface |

## Esperando o Joaquim

### 13/10/2026 — o que é dele, e não foi feito
- **Push** de `spec/pele-e-casca` e o **pouso** na `develop`
- **Trazer o mockup de outubro para `mockups/`**: o repositório `Prototipo_Turmma` é privado e o nosso é público. É
  decisão dele com o Gabriel (`TODO.md`, itens da D80)
- **Parecer de advogado** sobre a mascote (D58; Decreto 12.880, art. 11) e sobre trade dress (`TODO.md`)
- **Confirmar a D80**, que foi escrita por delegação: o que entrou do mockup, o que ficou de fora ("regra vence
  desenho") e o que cada fase seguinte deixa de fazer (`ROADMAP.md`, "A pele nova")
- **O RF22 do PRD** foi esclarecido na rodada 2 da revisão (a entrada, com a casca e os ícones de lugar, é comum a
  todos; a regra vale para o pedaço de cada área). É texto de critério de aceite: se ele quiser a outra saída (os
  ícones de cada papel fora da entrada), é tarefa nova na 9.0

## O que falhou
- **O limite de uso do plano estourou às 23:17 de 12/10**, com dez agentes em Opus ao mesmo tempo, e matou seis no
  meio. Voltou à 01:50. Dali em diante: poucos agentes, em Sonnet, e a implementação nesta sessão
- **Rodadas 1 e 2 da revisão da spec: REPROVADA.** A 1ª, por seis correções (avatar sem selo, onça sem condições,
  anel de foco sem cor, alvo de toque sem medida, armazenamento sem lista fechada, orçamento da entrada). A 2ª, por
  oito resíduos de coerência entre documentos e de teste que não amarrava a regra (o texto do botão desligado em
  duas cores, a onça dormindo no catálogo, `public/` ainda citado, pares de contraste que faltavam, RF6 e RF10 sem
  teste que caísse, RF22 contra a 7c, `2_task.md` sem o teste do script). Tudo corrigido; a 3ª rodada está correndo
- **PRD e Tech Spec passam do teto de palavras** (2.189 e ~3.300): o que os revisores exigiram entrou no texto. O
  aceite está escrito no topo de cada um, por delegação

## O que decidi sem perguntar
- **Quatro specs, e não duas ou três:** X1 `pele-e-casca` (tokens, peças, casca, sem mudar endereço), X2
  `telas-da-coordenacao`, X3 `telas-do-professor`, X4 `telas-do-aluno-e-primeiro-acesso`. A X1 é o tronco; as
  outras três correm depois dela e não se tocam, uma por papel
- **A X1 não reagrupa a navegação nem muda endereço.** O e2e tem 179 afirmações de endereço e 114 idas pela
  navegação: o reagrupamento em até quatro lugares por papel vai com a spec de cada papel
- **Os 33 nomes de token antigos ficam, com valor novo**, ao lado dos nomes da D80. Nenhuma tela perde cor no meio
  do caminho, e cada tarefa troca as classes da peça dela
- **Três desvios do mockup, por contraste:** `borda-campo` (`#8f8f8f` no claro, `#6b7f88` no escuro), o
  `caramelo-fundo` do escuro (`#d4651f`) e o desligado em face `borda` com texto `apoio`
- **O véu do diálogo continua `rgba()` literal** até a 7.0: no Chrome anterior ao 122 o `::backdrop` não herda
  variável
- **A onça entra só como cabeça, só em `AssinaturaIA` e no balão da `MensagemIA`,** sempre com o nome da função e o
  selo "IA". A de corpo inteiro, a dormindo e a comemoração ficam para a X2 e a X4, com parecer do
  `conformidade-reviewer`
- **Medidas do botão: 44 e 36 px** (o `compacto`, 44 abaixo de 768), e não os 46 e 38 do mockup: é o que o e2e de
  hoje já mede
- **Nenhum laço de animação, nem o de "pensando"** (D59): o documento dizia o contrário dos testes, e os testes
  venceram
