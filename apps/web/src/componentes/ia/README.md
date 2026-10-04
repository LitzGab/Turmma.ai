# Peças da web: guia de uso para quem escreve tela

As peças gerais ficam em `apps/web/src/componentes/`, e as de IA nesta pasta. Todas aparecem, em todos os estados, na
galeria (`/galeria`, `src/galeria/Galeria.tsx`), que é onde o `e2e/pecas.spec.ts` as prova. Como declarar a tela e de
onde importar está no topo de `src/areas/navegacao.ts`. Aqui ficam as regras de uso que a peça sozinha não garante.

## Aprovação e decisão oficial

- **Aprovação de saída de IA é sempre `LinhaAprovacao`**, nunca o `Estado` solto: ela é o mesmo selo, com quem decidiu e
  quando (regra 70, item 6). Na `MensagemIA`, vai na prop `aprovacao`, que tem lugar fixo. Para a coordenação, que não é
  quem aprova, a pendente diz `espera="Esperando o professor"`.
- **`oficial` só em dois lugares:** o botão que abre a confirmação e o que confirma, dentro do `DialogoDeConfirmacao`.
  O `resumo` leva a avaliação, a turma e a quantidade; ao abrir dado nominal, o `aviso` diz que fica na auditoria.
- **Ligue `confirmando` à mutação** (`mutacao.isPending`): é ele que desliga o botão e impede a segunda decisão no
  clique duplo. A `falha` recebe o texto já em português; nunca o erro cru.
- Se o gatilho desliga ou some depois da decisão, passe `focoDeReserva`: sem ele o foco cai no `body`.

## Conversa

- A lista de mensagens é a `Conversa` (anuncia a mensagem que chega). Dentro dela: `MensagemPessoa`, `MensagemIA`,
  `Pensando` enquanto a execução está `pendente` ou `rodando`, e `AvisoFila` quando demora ou falha.
- O texto do modelo entra por `TextoDaIA`, com as `citacoes` da mensagem: os chips e a lista de fontes vêm no fim. Não
  ponha o texto do modelo em `dangerouslySetInnerHTML` nem o interprete como Markdown.
- **Em `aoEnviar` (e em `aoGerar` do `MotorFormulario`), limpe o valor e mude o estado na hora**, sem esperar o
  `isPending` da mutação: é o que impede o segundo envio do mesmo pedido e mostra que o toque foi recebido.
- A `CaixaPedido` presa no pé da conversa vai dentro de uma `BarraPresa` com `semLinha`, como último filho do bloco que
  rola.

## Desenho

- **Um `primario` por tela.** O enviar da `CaixaPedido`, a ação do `EstadoVazio` e o "Tentar de novo" do `EstadoErro`
  já são `primario`: na tela que os tem, o resto é `secundario` ou `discreto`.
- `NumeroPainel` formata número (`1412` vira `1.412`); **texto vai como veio** (`"61%"`).
- `BarraRotulada` **não se pinta**: é neutra sempre, e o valor está no texto. Nada de vermelho perto do limite.
- `Menu` e `ChipFonte` abrem em posição fixa na janela, e não são cortados por tabela que rola nem por diálogo. Um
  ancestral com `transform` ou `filter` tira a posição do lugar: não ponha.
- Título de `Cartao`, `CabecalhoDeSecao` e `MotorFormulario` tem `nivel`: acerte-o para a ordem dos títulos não pular.

## O que a peça não dá

- **Os quatro estados são de cada consulta** (carregando, vazio, erro, com dado): `EstadoCarregando`, `EstadoVazio` e
  `EstadoErro` de `componentes/estado`. `Tabela`, `Abas` e `Conversa` desenham só o "com dado".
- `Tabela` não pagina nem virtualiza: entregue a página.

## Adaptação

- **Adaptação nunca leva texto livre** (D35, D67): ela abre o `MotorFormulario` direto, com a lista de tipos, e não entra
  no menu de ferramenta da `CaixaPedido` nem recebe o que foi escrito na caixa. `CampoLongo` é para justificativa de
  rejeição e de contestação, e nunca vira campo de ferramenta.
