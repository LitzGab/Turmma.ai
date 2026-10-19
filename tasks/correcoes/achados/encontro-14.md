# Achados das revisões — `tasks/correcoes/encontro-14.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-19 06:39:00 · `tasks/correcoes/encontro-14.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta correção. Ela só resolve dois blocos de `import`, e nenhum caminho que grava `Nota` foi alterado. Todos com autor humano? sim, nada mudou.
Decisão autônoma sobre aluno: ausente.
Aprovação registrada: ok. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/e2e/roteiro-da-demonstracao.spec.ts`, o laço da D56 continua inteiro depois do merge. O botão fica desligado até o último destaque ser aberto, e a abertura agora passa por `abrirODestaque` e `fecharOPainel` (linhas 497-498). O registro da validação continua conferido: `validacoesNoBanco` com `confirmadaPor`, `apresentados` e `abertos` (linhas 508 e 543).
Supervisão do tutor: ok. Os três nomes que vieram da 10.0 (`abrirSinaisDoTutor`, `abrirOPainelDoTutor`, `painelDoTutor`) estão importados na linha 17 e usados nas linhas 584-588, onde o roteiro confere a região "Sinais por aluno".
Autonomia declarada e visível: sim, sem alteração.
Bloqueantes: nenhum.

O que conferi:
- **Marcadores de conflito:** nenhum `<<<<<<<`, `=======` ou `>>>>>>>` nos dois arquivos, e nenhum arquivo ficou sem resolver (`git diff --diff-filter=U` vazio).
- **`aprovar.test.ts`, os dois lados preservados:**
  - Da 14.0: a lista longa de `./aprovar` e o teste que barra nota, média e ranking nos textos novos (linha 123).
  - Da 10.0: o `import` de `./sinais` e o teste da aba Hoje (linhas 222-238), que barra nota, conceito, média, pontuação, ranking e pódio nos textos dos sinais do Tutor (D46, D55, D69).
  - Nenhum dos dois testes de vocabulário proibido se perdeu.
- **Testes rodados:** `aprovar.test.ts` e `sinais.test.ts` passaram isolados (3 arquivos, 51 testes).

Recomendações:
- O teste da 10.0 em `aprovar.test.ts:237` tem uma expressão própria que inclui `pódio`. A constante `VOCABULARIO_PROIBIDO` da 14.0 (linha 32) não inclui. Juntar as duas numa só, com `pódio`, deixaria a mesma proibição valendo nas duas telas (D59, `docs/interface.md` 10.2). Fica para o `/retro`.

## test-engineer · 1ª rodada · APROVADO · 2026-10-19 06:39:06 · `tasks/correcoes/encontro-14.md`

VEREDITO: APROVADO

**Cenários exigidos:** esta correção não traz regra nova. É a resolução de dois conflitos de `import`, então "Teste que reproduz: não se aplica" está correto, e não há cláusula nova que precise de mutação. O que eu precisava conferir:
- os dois lados de cada arquivo continuam no resultado do merge, sem perder nem enfraquecer nenhum teste;
- não sobrou marcador de conflito, `.skip` nem `.only`;
- todo nome importado é usado (para o lint passar);
- os testes de unidade afetados passam.

**Cobertos:**
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/aprovar.test.ts`:
  - Contra MERGE_HEAD (o lado da linha), só entra o lado da spec: o `import` de `./sinais` e o `describe` da tarefa 10.0, que garante que nenhum texto de Hoje fala em nota, conceito, média, pontuação, ranking ou pódio.
  - Contra HEAD, só entra o lado da linha: a lista longa de `./aprovar`, a constante `VOCABULARIO_PROIBIDO` e os testes da 14.0 (abas, `?ver=`, faixa de números, títulos, ordem por nome com desempate pelo id).
  - Nenhuma asserção dos dois lados foi tirada ou afrouxada.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/e2e/roteiro-da-demonstracao.spec.ts`:
  - Os dois `import` estão lá: `abrirODestaque` e `fecharOPainel` da 14.0, e `abrirOPainelDoTutor`, `abrirSinaisDoTutor` e `painelDoTutor` da 10.0. Todos são usados.
  - Os blocos de Revisar (14.0) e de Turma/Tutor (10.0) estão em trechos diferentes do roteiro e entraram inteiros.
  - Continua no roteiro a prova de que o sinal em Hoje não mostra o nome do aluno e de que o painel do Tutor não tem link.
- Não há marcador de conflito nem `.skip` ou `.only` nos dois arquivos (`git diff --check` e `grep` limpos).
- `npx vitest run aprovar.test.ts sinais.test.ts`: 51 testes verdes.

**Bloqueantes:** nenhum.

**Recomendações:**
- Não rodei o `roteiro-da-demonstracao.spec.ts`. Ele junta as duas pontas pela primeira vez no mesmo fluxo (Revisar com o painel e, depois, a turma com as abas e o Tutor em Hoje), e quem prova que funcionam juntas é o portão da tarefa com o e2e alterado. Confirme que ele rodou verde nos projetos `chromebook` e `celular` antes do commit `(correção encontro-14)`.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 06:40:52 · `tasks/correcoes/encontro-14.md`

VEREDITO: APROVADO

Tela vista: sim (8 fotos lidas, escola cheia e vazia). As fotos são `/professor/turmas` e a turma aberta na aba Hoje. A aba Atividades pegou "Carregando a aba…" e não valeu como foto. Revisei essa aba, "Revisar a correção" e o "Ver a correção" por código.

Estados: ok. Carregando, erro e vazio estão no código, e a conferência foi só por ele (a vitrine não mostra carregando nem erro).
- `Turma.tsx:79-95`: carregando, erro com "Tentar de novo" e turma indisponível.
- `TurmaHoje.tsx:129-146, 218-230`: carregando, erro, vazio com convite e dado.
- `AtividadesDaTurma.tsx:138-142`: o vazio diz o próximo passo ("Gere uma atividade… use Aplicar à turma").
- `AlunosDaTurma.tsx:215-216`: carregando e erro.
- Os quatro estados de "Revisar a correção" estão no `Aprovar.test.tsx:122`.

Resolução do merge: correta.
- `aprovar.test.ts` mantém a lista longa de `./aprovar` (linha 14.0) e o `import` de `./sinais` (10.0).
- `roteiro-da-demonstracao.spec.ts` mantém `professor/aprovar.ts` e os três nomes de `professor/tutor.ts`.
- Não sobrou marcador de conflito em `apps`, `e2e`, `packages`, `tools` nem `docs`.

Interação entre as duas pontas, conferida:
- "Voltar para a turma" (`aprovar.ts:18`) leva a `/turmas/:id`, que abre em Hoje.
- `?aba=` e `?ver=` valem em páginas diferentes (turma e correção), então não colidem.
- Os links "Revisar a correção" que os e2e procuram estão na tela do artefato e na aba Atividades, e nenhuma ponta os removeu.
- Rodei `vitest` em `areas/professor` e `titulo-das-telas`: 23 arquivos e 318 testes passaram.
- `tsc` da raiz, do `e2e/` e do `apps/web` passou limpo.

Acessibilidade: sem regressão visível.
- As abas têm rótulo "Seções da turma".
- O aviso de atenção humana está em `aria-live="polite"`.
- Os alvos são de 44 px (`min-h-11`).
- Nas fotos o foco e o contraste estão legíveis.

Chromebook fraco: sem regressão. Cada aba é um pedaço baixado só quando aberta, e a leitura do uso do Tutor só existe com o painel aberto. Veja a rolagem de Hoje nas recomendações.

Celular: nas fotos de 360 px não há rolagem horizontal nem texto cortado.
- A barra de baixo e a barra de topo estão corretas.
- A barra de baixo aparece sobre o conteúdo nas fotos de página inteira por ser fixa, o que é efeito da foto e não defeito.
- Os botões principais têm 44 px.

Ação oficial protegida: sim. A resolução não mexe nela. A aprovação do lote continua como a linha 14.0 a deixou (botão ligado só pela API e contador que diz por que está desligado).

Bloqueantes: nenhum.

Recomendações (para o `/validar` e o `/retro`):
1. A aba Hoje rola a página a 1366 × 768 (924 px de altura). O RF22 do PRD (`tasks/prd-telas-do-professor/prd.md:62`) e o R10 de `docs/interface.md:602` pedem que a tela caiba na janela, e o mockup (`mockup.md:126`) desenha Hoje sem rolar. Este defeito veio da outra ponta do merge (10.0), que a frontend-reviewer já aprovou duas vezes, e esta resolução não o causa. Por isso não reprovo o merge por ele. Fica registrado para a composição final de Hoje nas tarefas 11.0 a 13.0.
2. "Voltar para a turma", na correção, leva sempre a Hoje. Quem veio da lista de Atividades talvez esperasse voltar a `?aba=atividades`. Os e2e fixam hoje o endereço sem aba (`e2e/professor-aprovar.spec.ts:59`), então a mudança seria uma tarefa à parte.
3. A vitrine não conseguiu fotografar "Revisar a correção" nem a aba Atividades carregada. O `/validar` deve fotografá-las com uma entrega pendente na escola cheia.

Arquivos principais:
- `apps/web/src/areas/professor/aprovar.test.ts`
- `e2e/roteiro-da-demonstracao.spec.ts`
- `apps/web/src/areas/professor/Turma.tsx`
- `apps/web/src/areas/professor/TurmaHoje.tsx`
- `apps/web/src/areas/professor/AtividadesDaTurma.tsx`

## test-engineer · 2ª rodada · APROVADO · 2026-10-19 06:57:44 · `tasks/correcoes/encontro-14.md`

VEREDITO: APROVADO

Cenários exigidos:
- Resolver o conflito sem perder nenhum lado: o `import` longo de `./aprovar` (14.0) e o de `./sinais` (10.0) em `aprovar.test.ts`; o de `professor/aprovar.ts` (14.0) e o de `professor/tutor.ts` com os três nomes (10.0) em `roteiro-da-demonstracao.spec.ts`.
- A lista única de palavras proibidas tem que pegar as seis palavras: nota, conceito, pontuação, média, ranking e pódio (D46, D57, D59, D64).
- Nenhum texto da tela de correção (14.0) nem da aba Hoje (10.0) pode usar palavra da lista, agora que ela ganhou "pódio".
- O roteiro da demonstração, que junta as duas pontas pela primeira vez, tem que ficar verde nos projetos `chromebook` e `celular`.

Cobertos:
- A resolução do conflito foi aprovada na 1ª rodada e não mudou desde então.
- A lista agora é uma só, em `apps/web/src/areas/professor/aprovar.test.ts:32`, e os três testes de texto a usam: linhas 120 e 138 (14.0) e 237 (10.0). Antes, a aba Hoje tinha a expressão escrita à mão. Com isso, os textos da correção também passam a ser conferidos contra "pódio", e isso deixa o teste mais forte.
- O caso novo, na linha 241, falha se a lista perder qualquer uma das seis palavras.
- A mutação do documento troca exatamente a linha 32 do arquivo e apaga "pódio". Isso derruba o caso novo pelo motivo certo: a palavra deixa de casar com a lista. O bloco chega à cláusula que mudou, e não há outra cláusula nova sem bloco.
- Rodei `npx vitest run src/areas/professor/aprovar.test.ts` e deu 42 testes verdes. Nenhum texto quebrou com a palavra a mais.
- A minha recomendação da 1ª rodada foi atendida. O documento diz que o roteiro rodou verde em `chromebook` e `celular` depois dos dois portões, e o carimbo lista esse arquivo entre os alvos.
- No arquivo não há `.skip`, `.only`, `todo` nem mock que esconda a regra. A correção não toca IA nem nada que rode duas vezes ao mesmo tempo, então não cabe teste de concorrência.

Bloqueantes: nenhum.

Recomendações:
- O caso da linha 241 só confere a própria lista, não as telas. Ele seria mais firme com as formas que a tela de fato pode usar: "Pódio" com maiúscula, "notas" no plural e "pontuações". Hoje a lista já pega todas, mas nenhum teste fixa isso.

Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/aprovar.test.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/correcoes/encontro-14.md`
