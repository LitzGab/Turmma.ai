# Achados das revisões — `tasks/correcoes/2026-10-19-turma-aberta-rola-a-pagina.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 16:41:16 · `tasks/correcoes/2026-10-19-turma-aberta-rola-a-pagina.md`

VEREDITO: APROVADO
Tela vista: sim (10 fotos lidas, cheia e vazia, computador e celular; a aba Atividades só na escola cheia)
Estados: ok. Carregando ("Carregando a aba…" no `Suspense`, `Turma.tsx:110`) e vazio (convida e diz o próximo passo) aparecem nas fotos. O hook `useTopoDoPainel` é chamado antes dos retornos de carregando, erro e indisponível (`Turma.tsx:74`), então não quebra a ordem dos hooks, e só mede com a turma e a escola lidas. Erro e indisponível ficam como estavam, fora do diff.
Acessibilidade: ok. O painel continua `role="tabpanel"` com `tabIndex=0` (`Abas.tsx:92`), então quem usa só teclado rola o miolo. As abas ficam paradas e o foco continua visível nas fotos. Esta rodada não muda texto nem contraste.
Chromebook fraco: ok. A mudança é só CSS (`max-h` e `overflow-y`) mais um `ResizeObserver` e um `resize` já usados no `Artefato.tsx`. Cada aba continua em seu pedaço, baixada só quando aberta.
Celular: ok. A 360 px o `md:` não vale, então a página rola inteira, como antes. As fotos de celular não mostram rolagem lateral nem texto cortado, e os alvos seguem como estavam. A barra de baixo que aparece sobre o conteúdo nas fotos de página inteira é a barra fixa, artefato da captura; a foto não mostra defeito.
Ação oficial protegida: sim. A mudança não toca nenhuma ação oficial. "Convidar alunos" e "Aplicar uma atividade" seguem como estavam.

A 1366 × 768 as três abas (Hoje, Atividades e Alunos) ficam com título, série e abas parados. O painel termina rente à base da janela, com o conteúdo cortado e rolando por dentro (Hoje corta em "Acerto por habilidade", Alunos em "Por aluno"). Esse é o comportamento pedido pelo RF22 e pelo mockup. O comando também mediu que nenhuma página passa da janela.

Reproduz a regra do `Artefato.tsx:262`: mesmo `O_MIOLO_DO_DOCUMENTO` e mesmo `useTopoDoPainel`, sem componente refeito. O e2e novo (`soOPainelDaAbaRola`, `cena.ts`) cobre quatro pontos:
- a página não rola (`paginaNaoRola`);
- o painel tem `scrollHeight` maior que `clientHeight`;
- as abas ficam no mesmo `y` com o painel rolado até o fim;
- a página continua sem rolar depois disso.

Abaixo de 768 px o teste só mede a largura. Isso fecha a lacuna que a validação apontou (nenhum e2e media a altura da turma aberta). As duas mutações removem o `classeDoPainel` e cada uma é pega por um dos dois casos.

Bloqueantes: nenhum.

Recomendações:
- `vazia--professora--professor-turmas--Abrir-a-turma-tab-name-Alunos--computador.png` foi tirada com "Carregando a aba…" ainda na tela. O código mostra a aba pronta, como na foto de celular e no e2e, e vale o código. A foto da vitrine deveria esperar a aba carregar.
- A foto "Hoje, escola vazia" a 1366 mostra o painel cortado logo abaixo de "Acerto por habilidade", com a borda tracejada do vazio pela metade. Na foto de celular o vazio aparece inteiro e convida bem. Nada bloqueia, é só a rolagem por dentro.
- O C4 segue aberto no formulário da Adaptação (`Ferramenta.tsx`) e em "O que o Assistente fez" (`Time.tsx`), fora desta correção por ordem do pedido. Convém uma correção própria antes de fechar a validação da spec.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-19 16:42:04 · `tasks/correcoes/2026-10-19-turma-aberta-rola-a-pagina.md`

VEREDITO: REPROVADO

**Cenários exigidos**
- Caminho feliz: a 1366 × 768, nas abas Hoje e Alunos da turma aberta, a página não rola, só o painel da aba. O título e as abas ficam onde estão com o painel rolado até o fim.
- Borda 1: abaixo de 768 px (projeto `celular`) a página rola inteira e não rola de lado.
- Borda 2: Alunos com um aluno só, que era o caso do sintoma, com 951 px.
- Borda 3: a página só é medida com a aba já lida, sem "Carregando…".
- Borda 4: o painel ocupa a altura que a janela deixa, porque o topo dele é medido (`useTopoDoPainel`), e não fica no padrão fixo de 24,5rem.
- Borda 5: Atividades também passa a rolar por dentro, porque o painel é um só.
- Permissão e isolamento: não se aplicam. A correção só mexe no layout, sem leitura nova, sem endpoint e sem dado.
- Concorrência: não se aplica.

**Cobertos**
- O caminho feliz de Hoje, em `e2e/professor-turma-aberta.spec.ts`, no caso "Hoje mantém a página parada…".
- O caminho feliz de Alunos com um aluno, em `e2e/professor-turma-alunos.spec.ts`, no caso "1366 × 768: a página fica parada…".
- O `celular`: o helper só confere a largura excedente e sai antes de medir a altura.
- A espera pela leitura: `paginaNaoRola` exige que não haja "Carregando".
- O painel com mais conteúdo do que mostra (`scrollHeight > clientHeight`) e as abas paradas depois de rolar.
- As duas mutações do documento tiram `classeDoPainel={O_MIOLO_DO_DOCUMENTO}`, e o vermelho vem da cláusula certa: `paginaNaoRola` dá 156 e 183. O portão carimbou as duas (`.processo/portao.json`). Não há `.skip`, não há mock que esconda a regra e não há provedor pago (`simularAssistente`).

**Bloqueantes**
1. A medida do topo do painel é cláusula nova sem bloco de mutação, e nenhum teste fica vermelho sem ela.
   - Onde está: `apps/web/src/areas/professor/Turma.tsx:74`, `const topoDoPainel = useTopoDoPainel(...)`, e `apps/web/src/areas/professor/Turma.tsx:107`, `<div ref={topoDoPainel} className="min-w-0">`.
   - O que acontece sem ela: se o `ref` sair (ou o `aberto` virar `false`), `--topo-do-painel` nunca é gravado e vale o padrão de `24.5rem` de `O_MIOLO_DO_DOCUMENTO`.
   - Por que o teste não percebe: na turma aberta o painel começa por volta de 290 px (foto `professora--professor-turmas--Abrir-a-turma-tab--computador.png`), bem abaixo dos 392 px do padrão. O painel encolhe para uns 336 px e termina perto de y = 629, em vez de 728. Uns 100 px da janela ficam vazios, mas a página continua parada, o painel continua rolando e as abas continuam no lugar. `soOPainelDaAbaRola` (`e2e/__fixtures__/professor/cena.ts:115-126`) passa do mesmo jeito.
   - Precedente: é o mesmo achado que reprovou a 2ª rodada da `6_task`, sobre o `setProperty('--topo-do-painel', ...)` (`tasks/prd-telas-do-professor/achados/6_task.md:298`). Lá a mutação ficou vermelha porque o cabeçalho da rejeitada passa dos 24,5rem. Aqui o cabeçalho é sempre mais baixo, então essa saída não serve.
   - Correção exigida, em duas partes:
     - Em `soOPainelDaAbaRola`, a partir de 768 px, verificar que o painel chega ao pé da janela. Por exemplo: `(await painel.boundingBox())` com `y + height` maior ou igual a `innerHeight - 48`, já que o painel leva 2,5rem de margem e folga.
     - No documento da correção, um bloco que tire o `ref={topoDoPainel}` da linha 107 (fica `<div className="min-w-0">`), com `teste: e2e/professor-turma-aberta.spec.ts › Hoje mantém a página parada` e `projeto: chromebook`.

**Recomendações**
- Atividades mudou de comportamento: agora rola por dentro (o próprio documento diz isso, citando `mockup.md:140`), e não ganhou caso. A cláusula é a mesma que a mutação de Hoje já cobre, então não bloqueia. Mesmo assim, um caso com a aba Atividades e conteúdo suficiente fecharia o "vale para as três abas".
- Nos dois blocos de mutação vale declarar `projeto: chromebook`. No `celular` os dois casos passam por desenho, e o bloco fica mais claro sobre onde o vermelho acontece.
- A conferência de que as abas ficam no mesmo `y` depois de rolar o painel já sai de `paginaNaoRola`: com a página sem rolagem, as abas não têm como sair do lugar. Não atrapalha, mas a garantia de verdade é a altura do painel pedida no bloqueante, não esta.
- O caso de Hoje também roda no `celular` com o cenário inteiro (lote e desempenho) só para medir a largura. Se o tempo apertar, dá para limitar o caso ao `chromebook`, porque a largura a 360 px já é medida em outros casos da turma aberta.

Os arquivos que importam:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Turma.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/__fixtures__/professor/cena.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/correcoes/2026-10-19-turma-aberta-rola-a-pagina.md`

## test-engineer · 2ª rodada · APROVADO · 2026-10-19 17:00:14 · `tasks/correcoes/2026-10-19-turma-aberta-rola-a-pagina.md`

VEREDITO: APROVADO

**Cenários exigidos:** a página da turma aberta fica parada a 1366 × 768 nas abas Hoje e Alunos (com um aluno). O painel da aba rola por dentro e vai até o pé da janela, porque o topo dele é medido. As abas não saem do lugar quando o painel rola até o fim. Abaixo de 768 px a página rola inteira, como antes. Isolamento e permissão não se aplicam: a correção mexe só no layout de uma tela que já tinha esse escopo.

**Cobertos:**
- **Correção exigida, parte (a), feita.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/__fixtures__/professor/cena.ts`, a função `soOPainelDaAbaRola` agora verifica que o painel termina no máximo 48 px acima do pé da janela (`y + altura >= altura da janela - 48`). Essa verificação vem depois de confirmar que o painel tem mais conteúdo do que mostra. Por isso a altura em jogo é a máxima calculada (`100dvh - --topo-do-painel - 2.5rem`) e o painel termina perto de 728 px. Sem a medida, o topo cai no padrão de 24,5rem (392 px), maior que o topo real, e o painel termina por volta de 100 px acima do pé. O teste falha, portanto, pelo motivo certo.
- **Correção exigida, parte (b), feita.** O terceiro bloco de mutação, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/correcoes/2026-10-19-turma-aberta-rola-a-pagina.md`, tira o `ref={topoDoPainel}` exatamente da linha 107 de `Turma.tsx`. Ele aponta para `Hoje mantém a página parada` e declara `projeto: chromebook`.
- O portão registrou as 3 mutações do documento em `.processo/portao.json` (`"total": 3`).
- `Turma.tsx` e os dois specs não mudaram desde a rodada 1. Os outros dois blocos de mutação continuam valendo, cada um ligado a um teste.
- Não há `.skip`, nem mock de coisa nossa, nem IA envolvida.

**Bloqueantes:** nenhum.

**Recomendações:**
- A folga de 48 px fica 8 px acima da margem real de 40 px (2,5rem). Está bem para absorver arredondamento, mas uma folga um pouco menor deixaria a medida mais justa, se quiserem.
- Uma recomendação da 1ª rodada continua registrada no documento: um caso na aba Atividades com conteúdo suficiente para rolar, que prova que a regra vale para as três abas. Foi recusada com motivo.
