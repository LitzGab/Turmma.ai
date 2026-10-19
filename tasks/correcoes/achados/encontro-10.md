# Achados das revisões — `tasks/correcoes/encontro-10.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 05:03:34 · `tasks/correcoes/encontro-10.md`

VEREDITO: APROVADO

Tela vista: sim (14 fotos lidas, cheia e vazia, em 1366 e 360 px: Turmas, turma aberta na aba Hoje, Atividades e Alunos). Não abri o navegador por conta própria, porque as fotos já cobrem as telas.

Estados: ok. Conferido pelo código, porque carregando e erro não aparecem na vitrine.
- Turmas (`apps/web/src/areas/professor/Turmas.tsx:168-171`): carregando, erro com "tentar de novo", vazio que convida ("A coordenação ainda não alocou você…") e com dado.
- Turma aberta (`Turma.tsx:68-86`): carregando, erro, turma indisponível e com dado.
- Abas: `Suspense` com "Carregando a aba…" (`Turma.tsx:102`); a aba Atividades tem os quatro estados (`AtividadesDaTurma.tsx:30-36`).
- A `Turmas` agora é `lazy`, e a fronteira da área em `apps/web/src/rotas.tsx:135` dá o fallback "Carregando…".

Acessibilidade: ok.
- Os links "Voltar para Turmas" e os da lista de atividades têm `min-h-11` e rótulo oculto com o título da atividade.
- As abas têm rótulo "Seções da turma".
- Os selos "IA" e "Em dia" têm texto, não só cor.

Chromebook fraco: ok. A resolução do conflito deixou `Turmas` e `Turma` por `lazy` em `rotas.tsx:19-22`, sem `import` direto. A fachada fica só com as rotas e o sino, e o teto de 8 kB não sobe (`.size-limit.json`). A turma ainda baixa o pedaço da aba junto com as leituras (`Turma.tsx:56-58`).

Celular: ok.
- Em 360 px não há rolagem horizontal nem texto cortado.
- "Abrir a turma" (cartão) e "Gerar acesso" (aba Alunos) passam de 44 px.
- A barra inferior aparece sobre o meio do conteúdo nas fotos da página inteira. É efeito da captura, porque a barra é fixa. Não é defeito.

Ação oficial protegida: sim, e esta tarefa não tocou em nenhuma. O merge só mexeu na forma de carregar a tela. A confirmação do vínculo e o painel de contestação (`Turmas.tsx`) vieram da 9.0, já revisada.

Bloqueantes: nenhum.
- `rotas.tsx` não tem marcador de conflito: conferi as três áreas conflitadas e `grep` não acha `<<<<<<<` nem `>>>>>>>` em `apps/web/src`.
- A resolução bate com a causa descrita no documento da correção. Os dois `import` diretos saíram e o comentário da fachada ficou correto.
- Sobre "Carregando a aba…" nas fotos de Atividades e Alunos no computador (`.processo/vitrine/professora--professor-turmas-01a1521b-…--Atividades--computador.png` e `…--Alunos--computador.png`): é o instante da captura, não a aba sem carregar. As mesmas abas no celular saíram com dado: Atividades mostra "Estequiometria: lista sintética" e Alunos mostra acesso, pedidos e "Por aluno". O código usa o mesmo `lazy` e o mesmo `Suspense` nas duas larguras.
- As telas que rolam a 1366 × 768 (turma aberta na aba Hoje, 924 e 960 px) são página de conteúdo comprida. A lateral fica fixa e só o miolo rola, como no mockup. Não contradiz `docs/interface.md`.

Recomendações:
- A vitrine deveria esperar o fim do carregamento da aba antes de fotografar, com `--clicar` seguido de espera por texto. Hoje a foto pode sair no fallback.
- O texto "1 de 1 aluno enviaram" (`apps/web/src/areas/professor/aprovar.ts:131`, visto na aba Atividades) concorda mal no singular. Sugestão: "1 de 1 aluno enviou", com plural só a partir de 2.
- Nas fotos, os ids curtos nos nomes ("2ºB 038df50e") são do dado sintético da vitrine, não do produto.
- "Nenhum aluno acertou menos da metade…" repete em toda habilidade da aba Hoje. Daria para dizer uma vez só na seção.

## test-engineer · 1ª rodada · APROVADO · 2026-10-19 05:03:40 · `tasks/correcoes/encontro-10.md`

VEREDITO: APROVADO

**Cenários exigidos:** isto é a resolução de um conflito de merge, sem comportamento novo, então nenhum caminho feliz, borda, permissão ou isolamento novo precisa de cenário. Há três coisas a provar.
- `apps/web/src/areas/professor/rotas.tsx` não tem nenhum marcador de conflito.
- As duas mudanças sobrevivem juntas: `Turmas` por `lazy`, que é a 9.0, e `Turma` por `lazy`, que é a 10.0, sem `import` direto de nenhuma das duas.
- As rotas `turmas` e `turma` continuam ligadas ao componente certo, com a `key` por `turmaId` mantida.

**Cobertos:**
- `git grep` não acha marcador `<<<<<<<`, `=======` nem `>>>>>>>` em `apps/`, `e2e/` e `.size-limit.json`.
- `git diff HEAD -- apps/web/src/areas/professor/rotas.tsx` tira só o `import { Turmas } from './Turmas'`. Entra `const Turmas = lazy(() => import('./Turmas'))` nas linhas 19-20, e o `Turma` por `lazy` da 10.0 continua na linha 22. As rotas nas linhas 62 e 71 estão intactas, e a de `turma` mantém a `key={parametros.turmaId}`.
- O comentário da fachada (linhas 39-41) agora diz o que as duas mudanças fazem juntas. O "Até a 10.0…" que a 10.0 desmentia saiu.
- O `.size-limit.json` se juntou sozinho e o texto bate com o resultado: a fachada `professor-*.js` continua com teto de 8 kB, e Turmas e a turma aberta saem por `import()`. É esse teto que pega uma volta ao `import` direto, na esteira.
- `npx vitest run src/areas/titulo-das-telas.test.tsx src/areas/professor/Turmas.test.tsx` passou: 2 arquivos, 54 casos.
- O documento declara que não há teste novo nem seção de mutações. Isso está certo aqui: a correção não traz cláusula nova, só junta duas cláusulas que já foram provadas na 9.0 e na 10.0.

**Bloqueantes:** nenhum.

**Recomendações:**
- Nenhum teste de unidade pega a volta de `Turmas` ou de `Turma` ao `import` direto. A única guarda é o `size-limit` do chunk `professor-*.js`, que roda na esteira e não no portão da tarefa. Se a fachada ficar abaixo de 8 kB mesmo com uma das telas dentro, a regressão passa sem ninguém ver. Para o `/retro`: um teste barato sobre o build, que confira se existem os chunks `tela-professor-Turmas-*` e `tela-professor-Turma-*`, fecharia esse buraco para esta convenção e para as próximas telas.

Arquivos conferidos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tasks/correcoes/encontro-10.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/rotas.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/.size-limit.json
