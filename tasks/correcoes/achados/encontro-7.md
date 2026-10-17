# Achados das revisões — `tasks/correcoes/encontro-7.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 12:08:56 · `tasks/correcoes/encontro-7.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas, cheia e vazia). A cheia, no computador e no celular, saiu com o modal de incidente por cima. Ela não prova nada sobre a tabela nem sobre o link da linha. A escola vazia saiu limpa e serviu de base.
Estados: ok. Só olhei a tela com dado e a "vazia". Carregando e erro da aba não mudaram no diff, e o `Estrutura.test.tsx` continua cobrindo os quatro estados.
Acessibilidade: ok. O link da linha mantém o `aria-label` "Lista de nomes da turma …" e o anel de foco por `after:`, e as classes novas não mexem em nenhum dos dois.
Chromebook fraco: sem impacto, porque o diff só troca classes.
Celular: ok pelo que se vê.
- Na foto vazia, 360 px, o cartão da turma cabe sem rolagem horizontal.
- O nome "2ºA df252e1f" aparece inteiro, em bloco, sem corte.
- "Nova turma" ocupa a largura do conteúdo e tem altura de botão cheio.
- A barra inferior e as abas estão íntegras.
Ação oficial protegida: sim, ou seja, não se aplica. A tela só navega e abre o menu da turma, e esta mudança não cria ação oficial.

**O que não pude ver por causa do modal**
Na escola cheia, a tabela do computador e as turmas do celular ficaram parcialmente cobertas. Não vi o link da linha nem o alvo de 44 px nessa foto. Também não vi o cartão de 360 px com nome comprido, que é o caso do `wrap-anywhere`. Pela foto vazia, o link de uma linha só é visível como o nome em negrito. Valem o código e os testes: `Estrutura.tsx:84` traz `inline-flex min-h-11 max-w-full min-w-0 items-center wrap-anywhere`. O `it.each` do teste cobre 1366 e 360 px. O Tailwind instalado é o 4.3.3, que tem `wrap-anywhere`, e outras telas já o usam.

**Merge**
A aba Turmas junta bem os dois lados. Sem a seção "Alocar" nem o botão "Alocar", fica "Nova turma" como único botão cheio. O link da linha ganha o alvo de 44 px. A foto vazia mostra a tela como o código a monta. O `tasks/correcoes/encontro-7.md` descreve a resolução do conflito, que mantém os dois testes e tira só a linha de título obsoleta.

Bloqueantes: nenhum.

Recomendações:
- Faça a vitrine fotografar a escola cheia sem o modal de incidente. Pode ser confirmando o aviso antes da foto, ou usando uma escola sintética sem aviso pendente. Hoje a "cheia" não deixa ver nenhuma tela da coordenação.
- A foto "vazia" tem uma turma e um professor ("2ºA", "Professora Sintética Rosa"), então não é de fato vazia. Convém conferir que o fixture da vitrine não está semeando turma na escola vazia. Assim o convite do estado vazio da aba Turmas passa a ser fotografado.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Estrutura.tsx (linha 84)
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Estrutura.test.tsx

## test-engineer · 1ª rodada · APROVADO · 2026-10-17 12:09:10 · `tasks/correcoes/encontro-7.md`

VEREDITO: APROVADO

**Cenários exigidos.** A correção não muda comportamento: ela resolve um conflito de texto num merge. Por isso os cenários são os da própria resolução:
- os dois lados presentes no arquivo;
- nenhum marcador de conflito;
- nenhum teste perdido ou duplicado;
- nenhum teste que deixou de conseguir falhar;
- a árvore resultante coerente (a tela, o teste unitário e o e2e dizendo a mesma coisa).

**O que conferi, sem alterar nada:**
- **Sem marcador.** Nenhum `<<<<<<<`, `=======` ou `>>>>>>>` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Estrutura.test.tsx`.
- **Contra o HEAD (linha 2, 7.0).** `git diff --cached` só acrescenta o `it.each([1366, 360])` do alvo de 44 px, nas linhas 293 a 304. Nada da 7.0 se perdeu.
- **Contra o MERGE_HEAD (spec, cc2188e).** A única diferença é a mudança da 7.0, que entra inteira:
  - o título e o corpo novos do "Nova turma" (linhas 306 a 317);
  - o "com a escola montada" esperando pelo painel do ano, e não pelo "Alocar";
  - em `Estrutura.tsx`, a saída do `<Alocacao>` e do import dele, e a troca para `professorAlocavel`.

  O título antigo ("o 'Alocar' da Alocação, que a 7.0 refaz, continua cheio até lá") saiu, como o documento diz. Nada do lado da spec se perdeu: o `it.each` está igual, e as classes `inline-flex min-h-11 max-w-full min-w-0 items-center wrap-anywhere` continuam em `CLASSES_DO_LINK_DA_LINHA` (`Estrutura.tsx:85`).
- **Contagem.** São 31 `it(` mais os dois casos do `it.each`, ou seja, 33. Rodei `npx vitest run src/areas/coordenacao/Estrutura.test.tsx` e os 33 passaram, como o documento declara.
- **Os testes continuam podendo falhar:**
  - O `it.each` checa as quatro classes uma a uma. Se o lado da 7.0 viesse sem o `CLASSES_DO_LINK_DA_LINHA` novo, ele ficaria vermelho.
  - O "Nova turma" da 7.0 prova que a região "Alocação" e o botão "Alocar" não existem. Antes disso, ele espera pela célula de professores carregada. Se a resolução tivesse trazido de volta o `<Alocacao>` do lado da spec, esse teste ficaria vermelho.
- **Sem vazamento de largura entre testes.** O `janelaDe(360)` do `it.each` não chega ao teste seguinte, porque o `beforeEach` (linhas 108 e 109) volta para `janelaDe(1366)`. Isso importa porque o "Nova turma" usa `celulasDe`, que mudaria se a tela continuasse a 360 px.
- **O e2e diz o mesmo.** Na árvore do merge, `e2e/estrutura.spec.ts` já afirma que a tela não tem "Alocar" (linhas 273, 302 e 307). O W12 (linha 757) mede o link "Lista de nomes", que é a medida a que o comentário do `it.each` se refere.
- Não há `.skip`, teste comentado nem mock que esconda regra. Não há IA envolvida, nem operação concorrente.

**Bloqueantes:** nenhum.

**Recomendações:**
- O documento diz que a prova é também "o portão da tarefa sobre a árvore que o merge deixou". Só que `e2e/estrutura.spec.ts`, onde está o W12 com a medida real dos 44 px e do estouro de 13 px, não mudou em relação ao HEAD. Por isso o portão da tarefa não o roda, e só a esteira do push vai juntar a medida do lado da spec com a tela sem Alocação da 7.0. É aceitável, porque cada lado já foi revisto, mas vale dizer isso no documento para não parecer que o portão cobriu o e2e.
