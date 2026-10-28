# Achados das revisões — `tasks/correcoes/2026-10-28-onca-do-mockup-v4.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-28 23:30:22 · `tasks/correcoes/2026-10-28-onca-do-mockup-v4.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: `professora--professor-criados--{computador,celular}.png` e `vazia--professora--professor-criados--{computador,celular}.png`, cheia e vazia). Li também o diff, `Criados.tsx`, `EstadoVazio.tsx` e o mockup (`mockups/src/areas/professor/Criados.tsx:176-181`, `components/duo/vazio.tsx`).

Estados: ok. Pelo código, conferi carregando (`EstadoCarregando`), erro (`EstadoErro` com "tentar de novo"), vazio de verdade, vazio de filtro e "com dado". A vitrine mostra o vazio e o com dado. Carregando e erro não aparecem na vitrine.

Os dois vazios:
- O vazio de verdade tem onça com selo "IA", título, texto e botão "Ir para Ferramentas". Convida e não pede desculpa.
- O vazio de filtro ("Nada com estes filtros") continua no padrão, sem onça, com "Limpar filtros".

Acessibilidade:
- Não vi problema. O botão é um `button` de verdade, a onça leva o selo "IA" (regra 70, 4a) e o `role="status"` continua no lugar.
- O e2e mede o centro do texto do título com um `Range`, não a caixa do `<p>`, que ocupa a largura toda e enganaria a conta.

Chromebook fraco: a mudança é só de classe e de variante, sem custo novo. A `Onca` entra por `ilustracao` e a peça não a importa, então a entrada não carrega a onça.

Celular:
- A 360 px não há rolagem horizontal. A caixa tracejada cabe e o texto quebra em 3 linhas dentro dela.
- A onça, o título, o texto e o botão estão no mesmo eixo.
- O botão principal tem cerca de 44 px ou mais.
- O e2e do alinhamento roda nos projetos `chromebook` e `celular`.

Ação oficial protegida: sim. A tela não tem ação oficial.

Divergências com o mockup e a foto: nenhuma. Antes, o texto ficava à esquerda e a onça no centro. Agora tudo está centralizado, como no mockup. A foto confere com o código da árvore: `variante="tracejado"` está em `Criados.tsx:185`, e a `gap-3` só existe com `emAndamento` em `EstadoVazio.tsx:56`.

Bloqueantes: nenhum.

Recomendações:
- O vazio do mockup não tem parágrafo. O nosso tem, e `docs/interface.md` 10.2 e a regra 50, item 5, pedem que o vazio diga o próximo passo. Fica como está.
- No celular, o rodapé corta "FERRAMEN…" e o cabeçalho corta o nome da escola ("Colég…"). Isso não vem desta tarefa. Vale registrar para a retro.
- O teste de unidade `estados.test.tsx:128-131` só prova que a peça não alinha no padrão. O alinhamento de verdade é medido só no e2e, e a mutação da `variante` cobre isso. Está bem assim.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-28 23:30:31 · `tasks/correcoes/2026-10-28-onca-do-mockup-v4.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta correção. O diff só mexe em alinhamento e espaçamento de tela (`Criados.tsx`, `EstadoVazio.tsx`) e nos testes que medem isso. Não toca API, banco, job, seed, importação nem webhook. Todos com autor humano? Não se aplica, porque nenhum caminho foi criado ou alterado.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok. Nenhum fluxo de aprovação mudou. Na foto da escola cheia, a versão adaptada aparece com "Esperando você", ou seja, a entrega nasce pendente e só sai com a professora (`professora--professor-criados--computador.png` e `--celular.png`).

Supervisão do tutor: ok. O tutor não foi tocado.

Autonomia declarada e visível: sim. Esta correção não muda nada nisso. Na tela, a saída de IA continua marcada como IA: a onça do vazio vem assinada "Assistente de ensino" com o selo "IA" (`vazia--professora--professor-criados--computador.png` e `--celular.png`, produzidos por `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/ui/onca/Onca.tsx:284-286`).

Conferido nas quatro fotos, pela regra 70:
- **Nota (D55):** nenhuma nota, conceito ou sugestão de nota aparece.
- **Identidade do agente (D58):** a onça leva o nome da função, sem nome de pessoa.
- **Uso excessivo (D59):** nada induz uso. O vazio chama para uma única ação ("Ir para Ferramentas"), sem recompensa nem contador. "Sair" continua à vista no computador e no celular.
- **Professor (D45/D64):** nenhuma métrica de professor e nenhum ranking.
- **Vigilância:** nada de inferência emocional nem de comportamento.

Bloqueantes: nenhum.

Recomendações:
- O comentário em `/home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/estado/EstadoVazio.tsx:24-26` diz que quem passa `ilustracao` passa também `variante="tracejado"`, mas o tipo não obriga isso. Fica como recomendação de frontend, para o `frontend-reviewer` decidir. Não é questão da regra 70.

## test-engineer · 1ª rodada · APROVADO · 2026-10-28 23:30:59 · `tasks/correcoes/2026-10-28-onca-do-mockup-v4.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** no vazio de verdade de Criados ("Nada gerado ainda"), a onça, o título e "Ir para Ferramentas" ficam no mesmo eixo, nos projetos `chromebook` e `celular`.
- **Borda 1:** o vazio do filtro ("Nada com estes filtros") continua no padrão e sem onça.
- **Borda 2:** o espaço entre o botão e a região "Verificando…" não pode tirar o botão do eixo quando a região está vazia.
- **Borda 3:** o vazio padrão sem ilustração não muda.
- **Permissão e isolamento:** a correção não toca tenant, API nem dado. Os casos de isolamento de Criados que já existem continuam no arquivo, sem alteração (`e2e/professor-criados.spec.ts:259` e `:296`).
- **Concorrência:** não se aplica.

**Cobertos:**
- **Caminho feliz:** `e2e/professor-criados.spec.ts:82`, "vazio: a onça, o título e a ação ficam no mesmo eixo, como no mockup". O caso mede o centro de cada peça na tela: do svg da onça, do texto do título (por `Range`, e não pela caixa do `<p>`, que ocupa a largura inteira) e da caixa do botão. A tolerância é de 3 px.
- **As três mutações do documento estão contra o diff e caem no lugar certo:**
  - Tirar `variante="tracejado"` (`Criados.tsx:185`) deixa o caso vermelho em `chromebook` e em `celular`, e pelo motivo certo: o texto e o botão vão para a esquerda e a onça continua no centro, porque a `figure` (`Onca.tsx:231`) se centraliza sozinha.
  - Voltar o `gap-3` incondicional (`EstadoVazio.tsx:56`) desloca o botão 6 px, acima da tolerância de 3 px. É vermelho pela cláusula nova.
  - Nenhuma cláusula nova do diff fica sem bloco.
- **Borda 1:** `Criados.test.tsx:398-407` garante que não há `[data-onca]` no vazio do filtro.
- **Borda 3:** `estados.test.tsx:120-134`. Rodei `npx vitest run apps/web/src/componentes/estado/estados.test.tsx`: 14 de 14 passaram.
- **Fotos:** as de computador e celular da escola vazia mostram a onça, a assinatura, o título, o texto e o botão centralizados, como no mockup.
- Não há `.skip`, teste comentado nem mock que esconda a regra. Não há IA envolvida.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `e2e/professor-criados.spec.ts:89`: o `document.querySelector('[data-onca]')` procura na página inteira. Se uma onça da introdução ou da comemoração estiver aberta, o teste mede a errada. O ideal é limitar a busca a `main [data-onca]`, como já fazem `professor-introducao.spec.ts:72` e `coordenacao-introducao.spec.ts:65`.
2. `e2e/professor-criados.spec.ts:95`: quando o svg não é encontrado, o teste mede a caixa da `figure` no lugar dele, e a falta do svg passa sem aviso. Melhor exigir o svg e falhar se ele não estiver lá.
3. `EstadoVazio.tsx:56`: o `gap-3` agora só existe com `emAndamento`, e nenhum teste confere que ele volta quando aparece "Verificando…". Se alguém tirar o espaço de vez, o texto encosta no botão e todos os testes continuam verdes. Cabe um caso de unidade com `emAndamento: true` que confira o espaço.
4. `EstadoVazio.tsx:23-27`: "quem passa `ilustracao` passa também `variante=\"tracejado\"`" é só uma convenção escrita no comentário. Os tipos da prop poderiam exigir isso (uma união com as duas formas), e assim a próxima tela que usar a ilustração não repete o C1.
5. `estados.test.tsx:130`: o teste ainda confere a classe do invólucro no padrão, e o próprio comentário diz que a peça não promete esse alinhamento. É inofensivo, mas não prova nada. Fica a critério manter.

Arquivos relevantes:
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/e2e/professor-criados.spec.ts
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/estado/EstadoVazio.tsx
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/estado/estados.test.tsx
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/areas/professor/artefatos/Criados.tsx
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/tasks/correcoes/2026-10-28-onca-do-mockup-v4.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-28 23:43:29 · `tasks/correcoes/2026-10-28-onca-do-mockup-v4.md`

VEREDITO: APROVADO

Cenários exigidos (rodada 2, só o que mudou desde a 1ª):
- O e2e só mede o desenho da onça (o `svg`) dentro do `main`.
- O e2e reprova quando falta o desenho, sem medir a `figure` no lugar dele.
- O `gap-3` só existe com `emAndamento`, provado em teste de unidade.
- Cada cláusula nova do diff tem o seu bloco em "Mutações".

Cobertos:
1. **Busca dentro do `main`.** `e2e/professor-criados.spec.ts:91` busca em `main [data-onca] svg`. Uma onça de fora da área principal já não entra na medida.
2. **Falta do desenho reprova.** O código que media a caixa da `figure` quando não havia `svg` saiu. Sem o desenho, a medição devolve `null` (`professor-criados.spec.ts:94`) e a asserção `not.toBeNull` falha. O bloco de mutação 5 (`<figure data-onca="">sem desenho</figure>`) fica vermelho exatamente por essa asserção, que é a cláusula nova. Antes, esse mesmo cenário passava porque a `figure` se centraliza sozinha.
3. **`gap-3` com e sem `emAndamento`.** O caso novo está em `estados.test.tsx:101-107`. Ele confere a ausência do `gap-3` sem `emAndamento` e a presença dele com `emAndamento: true`, e faz isso numa linha que existe de verdade (o pai do `role="status"`). Quebra nos dois sentidos:
   - o bloco de mutação 4 tira o `gap-3` sempre, e a segunda asserção falha;
   - o bloco 3 põe o `gap-3` sempre, e a primeira asserção falha (o e2e também pega esse caso).

   Rodei `npx vitest run src/componentes/estado/estados.test.tsx`: 15 de 15 passam.
4. **Mutações contra o `git diff`.** O diff de produção tem duas mudanças: `variante="tracejado"` em `Criados.tsx`, com bloco para os dois projetos (chromebook e celular), e o `gap-3` condicional em `EstadoVazio.tsx`, com bloco no e2e e no teste de unidade. O mudar do comentário não é regra. Nenhuma cláusula ficou sem bloco.
5. **Verificações gerais.** Nenhum `.skip`, nenhum teste comentado e nenhum mock que esconda a regra. A correção não toca IA, dado de escola nem operação concorrente, então não precisa de teste de isolamento nem de concorrência.
6. **Arquivos de produção.** O diff do patch confirma que nenhum mudou desde a rodada 1.

Bloqueantes: nenhum.

Recomendações:
- Fica registrado o que já está no documento: a convenção "quem passa `ilustracao` passa também `variante="tracejado"`" poderia ser exigida pelo tipo das props. O destino no `TODO.md` está bem justificado.

Arquivos auditados:
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/apps/web/src/componentes/estado/estados.test.tsx
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/e2e/professor-criados.spec.ts
- /home/joaquimdp/Documents/git/.maestri/floors/educaia--correcao2026-10-28-onca-do-mockup/tasks/correcoes/2026-10-28-onca-do-mockup-v4.md
