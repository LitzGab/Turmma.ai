# Achados das revisões — `tasks/correcoes/2026-10-26-roteiro-da-demonstracao-depois-da-x4.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-26 10:17:44 · `tasks/correcoes/2026-10-26-roteiro-da-demonstracao-depois-da-x4.md`

VEREDITO: APROVADO
Tela vista: não. A correção só altera texto de `docs/roteiro-da-demonstracao.md` e nenhuma tela mudou, então não há foto. Conferi o texto novo contra o código e contra o spec e2e.
Estados: não se aplica (documento, não tela).
Acessibilidade: não se aplica.
Chromebook fraco: não se aplica.
Celular: não se aplica.
Ação oficial protegida: não se aplica (o roteiro só descreve o fluxo que o e2e já faz).

Bloqueantes: nenhum.

O que conferi:
- **Introdução da coordenação (2.2):** `e2e/roteiro-da-demonstracao.spec.ts:185-187` passa pela introdução, vai para o Painel e depois abre **IA**, que mostra a Governança vazia. O roteiro agora diz isso.
- **Introdução da professora (2.8):** `e2e/roteiro-da-demonstracao.spec.ts:281-283` passa pela introdução antes de **Turmas**. O texto novo bate.
- **Passos que se pulam:** nenhum passo da professora nem da coordenação é obrigatório (`obrigatorio: false` nos `textos-da-introducao.ts`), então "Continuar ou Pular" está certo.
- **Introdução do aluno (2.12):** são quatro passos e o aluno depois abre no Início. Os passos 1 a 3 não se pulam e o 4, o tamanho da letra, se pula (`apps/web/src/areas/aluno/introducao/textos-da-introducao.ts:10`). O texto bate. As falas e o botão "Continuar" estão em `e2e/__fixtures__/casca.ts`.
- **Tarefas no lugar de Atividades:** a navegação do aluno se chama **Tarefas** (`apps/web/src/areas/aluno/Atividades.tsx:72`), e o spec usa a região "Para fazer" (`e2e/roteiro-da-demonstracao.spec.ts:447`, `:571-572`). O aviso "Avaliação: o Tutor fica pausado até quem dá a aula encerrar." existe em `apps/web/src/areas/aluno/atividades.ts:21`.
- **Comemoração antes da espera (5.3):** a fala citada é exatamente `FALA_DA_ENTREGA` (`apps/web/src/areas/aluno/atividade.ts:54`). O cartão "Atividade enviada" e "Quem dá a aula ainda vai revisar a correção." estão em `Atividade.tsx:390` e `atividades.ts:24`.
- **Verificação do grep:** `grep -c introdu` na doc passou de 0 para 3. Não sobrou "**Atividades**" em negrito como item de navegação.
- **Diff:** só `docs/roteiro-da-demonstracao.md`, sem tocar em código.

Recomendações:
- Em `docs/roteiro-da-demonstracao.md`, no passo 2.12 do aluno, falta dizer que ele cai no **Início** sem a lista "Para fazer" ainda cheia, que é o que o passo 4 usa depois. É só um detalhe de leitura, não de erro.
- A linha longa do passo 5.2 (Tarefas, "Para fazer") passa da largura das demais linhas do arquivo, que quebram perto de 120 colunas. Dá para quebrar a linha. É questão de estilo.
- O critério de pronto da funcionalidade citava seis documentos sem o roteiro. Vale incluir `docs/roteiro-da-demonstracao.md` na lista das próximas specs que mexem em tela, para a causa não voltar.

## test-engineer · 1ª rodada · APROVADO · 2026-10-26 10:18:06 · `tasks/correcoes/2026-10-26-roteiro-da-demonstracao-depois-da-x4.md`

VEREDITO: APROVADO

Cenários exigidos: esta correção mexe só no texto de `docs/roteiro-da-demonstracao.md` e não toca código nem teste. Não há regra de negócio para provar, nem caso de borda, permissão ou isolamento. O documento troca o teste vermelho por uma conferência do texto contra o e2e, as fixtures e as constantes da web. Fiz essa conferência item a item:
- 2.2: a coordenação passa pela introdução de quatro passos, chega ao Painel e abre **IA**.
- 2.8: a professora passa pela introdução, com **Continuar** ou **Pular**.
- 2.12: o aluno faz quatro **Continuar**, os passos 1 a 3 não têm **Pular**, e ele termina no **Início**.
- Os dois **Atividades** do aluno viraram **Tarefas** / "Para fazer".
- 5.3: a comemoração aparece antes do cartão "Atividade enviada".
- `grep introdu` deixou de dar 0.

Cobertos:
- **2.2**: o texto confere com `e2e/roteiro-da-demonstracao.spec.ts:185-187` (`passarPelaIntroducaoDaCoordenacao` e depois `irPelaCoordenacao(..., 'IA')`). Confere também com `e2e/__fixtures__/casca.ts:436-450` (quatro **Continuar**, terminando no Painel). O **Pular** está em `apps/web/src/areas/coordenacao/introducao/BemVindo.test.tsx:160-179`.
- **2.8**: confere com o spec em `:281-282` e com `casca.ts:394-408`. O **Pular** em todo passo está em `apps/web/src/areas/professor/introducao/BemVindo.test.tsx:158-177`.
- **2.12**: confere com o spec em `:335-336` e com `casca.ts:325-368` (as quatro falas, a quarta sobre o tamanho da letra, e a chegada ao Início). "Os três primeiros não se pulam" confere com `apps/web/src/areas/aluno/introducao/BemVindo.test.tsx:171-185`.
- **Tarefas / "Para fazer"** (linhas 197 e 224 do documento): confere com o spec em `:445-447` e `:571-572`.
- **5.3**: `FALA_DA_ENTREGA` em `apps/web/src/areas/aluno/atividade.ts:54` tem o mesmo texto que o documento. Em `apps/web/src/areas/aluno/Atividade.tsx`, a `Comemoracao` (`:384`) aparece antes do cartão "Atividade enviada" (`:390`). O texto da espera confere com o spec em `:470`.
- **"Sem mutação"**: o motivo está escrito e procede. O diff não toca `apps/*/src` nem `packages/*/src`, então a RF17 não se aplica.
- Não há `.skip`, mock nem chamada a provedor: nenhum teste foi alterado.

Bloqueantes: nenhum.

Recomendações:
- `docs/roteiro-da-demonstracao.md:258` ainda diz "Perfil **Coordenação** → **Governança**". O item da navegação se chama **IA**, como o próprio 2.2 corrigido diz ("Abra **IA**") e como o spec usa em `:605` (`irPelaCoordenacao(coordenacao, 'IA', ...)`). É o mesmo tipo de texto que ficou para trás e não estava no sintoma. Vale trocar na mesma correção, ou registrar para a validação.
- Ficou uma inconsistência pequena com o próprio documento da tarefa. O sintoma cita "o passo 4" entre os lugares com introdução, mas a seção "Correção" não traz esse item. O diff também não toca nenhum "passo 4" fora dos três já cobertos. Se "passo 4" se referia ao 2.12, o texto do sintoma pode dizer isso, para a validação não procurar um quarto lugar.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-26 10:18:15 · `tasks/correcoes/2026-10-26-roteiro-da-demonstracao-depois-da-x4.md`

VEREDITO: APROVADO

Escopo: respeitado. Só `docs/roteiro-da-demonstracao.md` mudou, e os cinco pontos da correção (2.2, 2.8, 2.12, as duas trocas de Atividades por Tarefas, e a comemoração no 5.3) estão todos feitos. Nada passa do que o MA1 da validação pediu.

Aderência à Tech Spec: ok. Conferi o texto novo contra o código:
- **Introduções:** o e2e passa por elas em `e2e/roteiro-da-demonstracao.spec.ts:186`, `:282` e `:336`. As funções que fazem isso estão em `e2e/__fixtures__/casca.ts:366`, `:406` e `:437`.
- **"Pular":** só aparece em passo não obrigatório (`apps/web/src/componentes/introducao/Introducao.tsx:51` e `:95`). No aluno, os passos 1 a 3 são obrigatórios e o 4, o da letra, não é (`apps/web/src/areas/aluno/introducao/textos-da-introducao.ts`). Na coordenação e no professor, os quatro passos se pulam.
- **Destino depois da introdução:** a coordenação vai ao Painel e depois abre **IA** (`spec.ts:187`). O aluno vai ao **Início** e depois a **Tarefas**, na lista "Para fazer" (`spec.ts:445-447` e `:571-572`).
- **Comemoração:** o texto bate com `FALA_DA_ENTREGA` (`apps/web/src/areas/aluno/atividade.ts:54`), e ela aparece antes da espera pela correção (`apps/web/src/areas/aluno/Atividade.tsx:382-406`).
- **Busca:** `grep -c introdu` deixou de dar 0.

Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)").

Bloqueantes: nenhum

Recomendações:
1. `docs/roteiro-da-demonstracao.md:201-202`: o texto diz que "Quem dá a aula ainda vai revisar a correção." fica "no cartão 'Atividade enviada'". No código, essa frase está numa faixa própria (`data-resultado="aguardando"`) abaixo do cartão, não dentro dele (`apps/web/src/areas/aluno/Atividade.tsx:390-406`). Trocar por "e, abaixo do cartão 'Atividade enviada', ...".
2. `docs/roteiro-da-demonstracao.md:138`: "a introdução da professora" vale para os três que aceitam o convite, e um deles é o Davi. "A introdução do professor" serve para os três. Na mesma passagem, a quebra de linha deixou "Termine com a **Helena** entrada no perfil" com "Professora." sozinho na linha seguinte (`:139-140`). Vale reorganizar as linhas.
3. Há mais diferenças entre o roteiro e o spec, de antes da X4 e fora do MA1, que o próximo ajuste do roteiro deve pegar:
   - O 2.3, o 2.5 e o 2.7 mandam a coordenação em **Estrutura**, mas o spec vai por **Turmas** (`spec.ts:191` e `:225`).
   - O 9.1 diz **Governança**, mas o item da navegação é **IA** (`spec.ts:605`).
   - O "Alocação" do 2.7 virou "Acrescentar turma" no painel do professor (`spec.ts:254-259`).

   O roteiro diz na `:7` que é "o mesmo roteiro" do spec, então essas diferenças são do mesmo tipo que esta correção consertou.
