# Achados das revisões — `tasks/correcoes/2026-10-19-alunos-dois-botoes-cheios.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 17:15:33 · `tasks/correcoes/2026-10-19-alunos-dois-botoes-cheios.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: aba Alunos a 1366 e a 360 px, escola cheia e vazia)
Estados: ok. O vazio dos pedidos continua convidando e diz o próximo passo ("Confira se o acesso dos alunos está ativo"). O acesso dos alunos, que esse texto manda conferir, está logo acima, com "Convidar alunos" à vista. Carregando e erro não mudaram, e a correção não os tocou.
Acessibilidade: ok. O "Convidar alunos" é botão nativo com rótulo e continua sendo o botão de foco da seção. O foco no título do acesso por `AcessoDaTurma.tsx:53` (`focarNaSecao`) não mudou. O título continua usado em `AlunosDaTurma.tsx:98`, então não sobrou ref sem uso.
Chromebook fraco: sem impacto. A correção só remove uma prop de ação.
Celular: ok a 360 px. Não há rolagem horizontal. O "Convidar alunos" ocupa a largura e passa de 44 px de altura. O recorte de "Nenhum pedido esperando" na foto vem da barra inferior fixa sobre a captura de página inteira. É artefato da foto e não vem desta correção.
Ação oficial protegida: sim, não se aplica. A correção não toca nenhuma ação oficial.

Verificação do que a correção promete:
- Nas quatro fotos há um só botão cheio laranja na aba, o "Convidar alunos", e o vazio dos pedidos não tem botão. Isso cumpre `docs/interface.md` R4.
- `AlunosDaTurma.tsx:107-111` perdeu a `acao` do vazio. O vazio da coordenação e o `EstadoVazio` seguem como estavam.
- O teste novo conta os botões com a face primária (`classesDoBotao()`) e espera `['Convidar alunos']`. Ele falha se a ação voltar, e a mutação declarada reinsere exatamente essa ação.
- `e2e/pedidos.spec.ts` confere que a seção do vazio tem 0 botões. O caso mantém as checagens de rolagem horizontal e de violações graves, e a linha de foco no título do acesso saiu junto do botão.
- O título do e2e em `pedidos.spec.ts:201` ainda cita "o passo para o Acesso". O Implementador registrou isso como recomendação, com o motivo do prazo do portão, e não bloqueia.

Bloqueantes: nenhum
Recomendações:
- Renomear o caso do e2e em `e2e/pedidos.spec.ts:201` ("com o passo para o Acesso") quando outra mudança tirá-lo da lista do portão, como o registro da tarefa já prevê.
- Em `e2e/pedidos.spec.ts:232`, `tituloDoAcesso` só segue usado a partir das linhas 247 e 262. Se um dia essas linhas saírem, a constante fica sem uso.

## test-engineer · 1ª rodada · APROVADO · 2026-10-19 17:16:07 · `tasks/correcoes/2026-10-19-alunos-dois-botoes-cheios.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** a aba Alunos, com o acesso à vista e o vazio dos pedidos, tem um só botão cheio, o "Convidar alunos" (R4 de `docs/interface.md`).
- **Casos de borda:**
  - O vazio dos pedidos não leva botão nenhum, nem secundário.
  - O foco de "Ver mais" continua indo certo agora que o botão do vazio saiu.
  - O vazio da coordenação continua com a ação "Mostrar o link da sala", porque o `EstadoVazio` e o caminho da coordenação não mudaram.
  - O vazio fica certo nos projetos `chromebook` e `celular` do e2e.
- **Permissão e isolamento:** não se aplicam. A correção só tira uma prop de tela, sem dado, rota nem escopo.
- **Concorrência:** não se aplica. Não há operação que possa acontecer duas vezes.

**Cobertos:**
- `apps/web/src/areas/professor/AlunosDaTurma.test.tsx`, caso novo "a aba tem um só botão cheio". Ele filtra os botões pela face primária (`classesDoBotao()`) e espera exatamente `['Convidar alunos']`. A mutação declarada devolve a `acao` ao vazio. Como o `EstadoVazio.tsx:40` desenha a `acao` com o `<Botao>` padrão (primário, `principal`), a lista viraria `['Convidar alunos', 'Ver o acesso dos alunos']` e o caso fica vermelho, que é o motivo certo.
- O caso ajustado "os pedidos de nome ficam no alto da aba…" confere `within(pedidos).queryByRole('button')` nulo. Ele também falharia com a mutação.
- O teste do foco de "Ver mais" passou a usar o "Convidar alunos" como outro elemento focado e continua provando que o foco não é roubado.
- `e2e/pedidos.spec.ts:229` confere que o vazio não tem botão nenhum (`toHaveCount(0)`), e o caso continua com a largura excedente e o axe.
- Rodei `npx vitest run src/areas/professor/AlunosDaTurma.test.tsx`: 31 de 31 passam.
- Não há `.skip`, teste comentado nem mock que esconda a regra. O `tituloDoAcesso` do e2e continua em uso (linhas 247 e 262), e o `tocar` e o `alvoDeToque` continuam em uso no arquivo, então nada ficou sem uso para o lint.
- A foto da escola vazia no computador mostra um só botão laranja na aba.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **O filtro do caso novo depende do tamanho do botão.** Em `AlunosDaTurma.test.tsx:485`, `botao.className.includes(classesDoBotao())` só reconhece o primário de tamanho `principal`. Um botão cheio que entrasse na aba como `tamanho="compacto"` ou `"icone"` também seria laranja e escaparia da contagem. Filtrar pela classe da face (`bg-laranja`), ou pelas três combinações de `classesDoBotao({ variante: 'primario', tamanho })`, prova o R4 como ele está escrito: "face laranja".
2. **A contagem só cobre o vazio.** A regra de um botão cheio por tela vale também com pedidos na lista e com o acesso ativo. Hoje só o estado vazio é contado. Um caso com dois pedidos e o acesso ativo fecharia o resto da aba.
3. **O título do caso em `e2e/pedidos.spec.ts:201` ainda diz "com o passo para o Acesso".** O documento já registra essa pendência e o motivo de não ter renomeado: o portão perderia o prazo declarado do caso. Fica para o `/retro`.
4. **A foto do celular** (`.processo/vitrine/professora--professor-turmas-01a15410-86dd-7494-8c4b-73c1d154351f--celular.png`) mostra a barra de baixo no meio da página. Parece um efeito da captura da página inteira, não desta correção, mas vale o `frontend-reviewer` conferir.

## test-engineer · 2ª rodada · APROVADO · 2026-10-19 17:23:24 · `tasks/correcoes/2026-10-19-alunos-dois-botoes-cheios.md`

VEREDITO: APROVADO

**Cenários exigidos**
- Com os pedidos vazios e o acesso à vista, a aba Alunos tem um só botão cheio, o "Convidar alunos" (R4).
- O vazio dos pedidos não tem botão nenhum.
- A mutação (a ação volta ao vazio) deixa o caso vermelho.
- A recomendação 1 da rodada anterior foi aplicada: o filtro reconhece a face laranja de qualquer tamanho.

**Cobertos**
- **Recomendação 1, aplicada.** Em `apps/web/src/areas/professor/AlunosDaTurma.test.tsx:486` o filtro passou a ser `classList.contains('bg-laranja')`. Em `apps/web/src/componentes/botao-secundario.ts:82` só a variante `primario` leva `bg-laranja`, e a classe não depende do tamanho, então `principal`, `compacto` e `icone` caem todos no filtro. O `hover:bg-caramelo-claro` e os desenhos `oficial`, `secundario`, `perigo` e `discreto` não passam pelo filtro, porque `classList.contains` compara a classe inteira e nenhum deles tem `bg-laranja`. Um `<button>` escrito à mão com face laranja também seria contado, o que é mais fiel ao "face laranja" do R4 que a versão anterior.
- **A âncora da linha 485.** `expect(classesDoBotao().split(' ')).toContain('bg-laranja')` amarra o filtro ao primário de verdade. Se a classe da face mudar de nome, o caso fica vermelho e não passa por engano.
- **A mutação continua alcançando a cláusula.** Com a `acao` de volta, o `EstadoVazio` desenha um `Botao` primário (`bg-laranja`), e a lista vira `['Convidar alunos', 'Ver o acesso dos alunos']`: vermelho pelo motivo certo. O código da tela não mudou desde a rodada 1.
- **O teste roda verde.** `npx vitest run src/areas/professor/AlunosDaTurma.test.tsx` deu 31 de 31.
- **O resto da rodada.** Não há `.skip` nem mock que esconda a regra, e a tarefa não toca IA nem concorrência. A recomendação 2 da rodada anterior (contar os botões cheios com pedidos e o acesso ativo) foi para o `TODO.md` com dono, o que basta para uma recomendação.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova. As da rodada 1 que ficaram de fora estão registradas na tabela "Recomendações sem aplicar" de `tasks/correcoes/2026-10-19-alunos-dois-botoes-cheios.md`, com o destino ou o motivo de cada uma.
