# Achados das revisões — `tasks/prd-apresentacao-escola/12_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-27 11:20:07 · `tasks/prd-apresentacao-escola/12_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Contrato do `/v1/eu`:** cada acesso traz escola, rede e papel, com a rede da própria escola. Nenhum outro campo, e nada de dentro da outra escola (ids, turmas, quantidade de turmas).
- **W3:** depois da troca, nenhuma requisição leva o token de A, nenhuma resposta traz dado de A, e o cache só guarda B.
- **W13:** escola, rede e papel, com a marca na escola de agora e sem número de turmas. Com uma escola só, mostra o nome e não abre.
- **W12:** o seletor abre e escolhe só com teclado; o Esc fecha a lista sem fechar a gaveta; alvos de 44 px; nada passa de 360 px. O mesmo para "Minha turma".
- **W4 "Minha turma":** carregando, com dado (turma, série por extenso, escola, sem colega), erro com "Tentar de novo", e o aluno sem turma no ano (`NAO_ENCONTRADO`).
- **Recomeço da tela:** segunda pessoa na mesma aba, mesma entrada sem token novo, resposta atrasada de A, e troca recusada com a lista aberta.
- **Concorrência:** dois toques na mesma escola com a troca no ar mandam uma troca só.
- **Permissão:** o aluno não tem seletor e não alcança as áreas do professor e da coordenação; o professor não alcança a área do aluno.
- **Isolamento:** o W3, o teste de contrato com turmas em B, a outra conta na mesma escola B, e os usuários desativado e pendente.
- **Borda:** professor com duas disciplinas (os ids de vínculo entram na busca do W3), a virada de ano e o aluno ainda não aprovado (provados na API pela 8.0; a web cobre o ramo `NAO_ENCONTRADO`), e a série lida da etapa, não fixa.

**Cobertos:** todos os acima.
- **Contrato:** `apps/api/test/troca-de-escola.int.test.ts:680`. Confere as chaves exatas, cada escola em rede própria e duas turmas criadas em B, e procura ids de escola, de rede e de turma e os nomes das turmas. Rodei este arquivo e o `login-email.int.test.ts`: 35 de 35 verdes.
- **Seletor e troca:** `e2e/troca-de-escola.spec.ts`. O W3 tem controle positivo: antes da troca o cache tem a turma de A, e depois tem a de B. A lista `acessos` é tirada antes da busca. O teste dos dois toques segura o `POST` de verdade e conta os pedidos.
- **Minha turma:** `e2e/minha-turma.spec.ts`.
- **Navegação e página inicial do aluno:** `e2e/areas.spec.ts:164` e `apps/web/src/areas/navegacao.test.ts`.
- **Série por extenso:** `packages/shared/src/estrutura/serie.test.ts`, com as duas etapas.
- **Teto do chunk `aluno-*`:** `tools/ci/tamanho-web.test.ts`.
- **Mutações:** a tabela bate com o diff. Cada cláusula nova (`eu.service.ts:28`, a junção da rede, as guardas em `SeletorDeEscola.tsx:79/91/94/99/104/106/126-127/155/156`, o ramo `NAO_ENCONTRADO`, `Inicio.tsx`, `navegacao.ts`, `serie.ts`, o teto) tem teste que ficou vermelho. As duas cláusulas que a tarefa usa sem alterar (`sessao.ts:257` e `main.tsx:27`) também foram mutadas.
- **Proibidos:** nenhum `.skip`, `.only` ou teste comentado. Mock só da resposta HTTP para os estados de falha e de espera; nenhum mock de código nosso esconde a regra. A tarefa não envolve IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `e2e/troca-de-escola.spec.ts:376-379`: o segundo toque espera o `aria-disabled` aparecer, então testa o toque repetido depois do re-render, e não o duplo clique no mesmo quadro. O React atualiza o estado antes do evento seguinte, então é seguro. Um `dblclick` na linha fecharia a dúvida.
2. A chave `['minha-turma']` não leva o usuário. Aluno 1 sai e aluno 2 entra no mesmo Chromebook do carrinho: a limpeza geral já prova o caso, mas um passo no "segunda pessoa" com dois alunos em "Minha turma" deixaria o caso explícito.
3. `e2e/areas.spec.ts:145`: o professor ainda testa `/aluno/qualquer`. Agora que existe, `/aluno/minha-turma` seria o endereço real a trocar na URL.
4. A decisão "com uma escola só, o nome sem a rede" não tem asserção. O teste de uma escola (`troca-de-escola.spec.ts:191`) poderia conferir que a rede não aparece.
5. `apps/api/test/troca-de-escola.int.test.ts:716`: `not.toMatch(/turma/i)` sobre o corpo inteiro quebra se um nome sintético futuro tiver "turma". As buscas por id e nome das turmas de B já cobrem o caso.
6. W12 no projeto `chromebook`: os 44 px são medidos antes de ir para 360 px. Medir de novo depois do redimensionamento cobre a gaveta nos dois projetos.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/12_task.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/troca-de-escola.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/troca-de-escola.spec.ts
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/minha-turma.spec.ts
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/consultas.ts
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/areas.spec.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/SeletorDeEscola.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/aluno/MinhaTurma.tsx

## frontend-reviewer · 1ª rodada · APROVADO · 2026-09-27 11:21:43 · `tasks/prd-apresentacao-escola/12_task.md`

VEREDITO: APROVADO

**Estados:** ok.
- **Minha turma** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/aluno/MinhaTurma.tsx`):
  - Carregando: `EstadoCarregando`, com o texto "Carregando a sua turma…".
  - Com dado: turma, série por extenso e escola, sem colegas.
  - Erro: `EstadoErro`, com mensagem do catálogo e "Tentar de novo".
  - Aluno sem turma no ano (`NAO_ENCONTRADO`): diz a quem recorrer, sem "Tentar de novo". A tela nunca fica vazia. O teste cobre os quatro casos com a rota interceptada, e também confere que o nome de um colega da mesma turma não aparece.
- **Seletor:** a troca recusada mostra o aviso do catálogo, que diz o que fazer, e o aviso some ao reabrir a lista.
- **Página inicial do aluno:** agora aponta para "Minha turma" em vez do texto que soava como desculpa.

**Acessibilidade:**
- O seletor virou um botão com `aria-expanded` e `aria-controls`.
- Ao abrir, o foco vai para a escola de agora. O Esc fecha só a lista e devolve o foco ao botão, sem fechar a gaveta.
- A escola escolhida tem ícone e `aria-current`.
- Durante a troca as linhas ficam em `aria-disabled` em vez de `disabled`, então o foco não cai no `body`.
- Cada linha tem nome acessível explícito, na mesma ordem do texto visível, e o botão começa por "Escola:".
- Os testes conferem foco visível pelo `focoVisivel` e contraste e ARIA pelo `violacoesGraves` em todas as telas.
- Na área do aluno o texto principal fica em 16 px. Só os rótulos ("Sua turma", "Série", "Escola") usam `text-sm`, o que a tabela de tipografia da 9.2 permite para metadado.
- A tela tem `<h1>` para leitor de tela e o título "Minha turma · Turmma".

**Chromebook fraco:**
- O `aluno-*` tem teto de 5 kB e mede cerca de 1 kB.
- No seletor não há imagem, animação nem lista longa. Os dois ícones do lucide saem do pacote sem arrastar o resto.
- O carregamento é texto, sem animação.
- O W3 prova que a limpeza do cache acontece depois de o token novo estar em uso, e o "resposta atrasada" prova que a lista de A que chega depois da troca não aparece em B.

**Celular:**
- 360 px sem rolagem horizontal, conferido pelo `larguraExcedente` no seletor e na "Minha turma".
- Botão e linhas do seletor e o item "Minha turma" com pelo menos 44 px.
- No celular o seletor fica na gaveta. O `hover` é só visual.
- Os e2e rodam nos projetos `chromebook` e `celular`, por toque e por clique. Nenhum fluxo exige o celular.

**Ação oficial protegida:** não se aplica, porque a tarefa não tem nota nem aprovação. Na troca de escola:
- Escolher a escola de agora não chama `POST /v1/sessao/escola` nem gera token novo (teste "mesma entrada").
- Dois toques mandam uma troca só (teste "falha com o seletor aberto").

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Foco depois de uma troca que deu certo, no computador.** O `resetQueries` desmonta o seletor junto com a linha que tinha o foco, e o foco cai no `body` antes de a página inicial de B aparecer (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/SeletorDeEscola.tsx:113-115`; `CascaDaEscola.tsx:247`). Na gaveta o `close()` devolve o foco ao botão do menu, então só a lateral aberta perde o lugar. Sugestão: levar o foco ao título da página nova depois da troca. Fica para o `/validar`.
2. **"Abrindo X…" só chega ao leitor de tela pela troca do nome da linha com foco,** e isso varia entre leitores. Um `role="status"` curto na lateral anunciaria a troca em todos.
3. **O nome da turma em "Minha turma" é um `<p>` em `text-2xl`** (`MinhaTurma.tsx:42`). Como `<h2>`, daria um ponto de navegação por títulos.
4. **O aviso de aluno sem turma no ano** (`MinhaTurma.tsx:35`) não tem papel de região, e o leitor de tela não percebe a troca do "carregando" por ele. Um `role="status"` resolve.
5. **A página inicial da coordenação ainda diz "próximas versões"** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/paginas/Inicio.tsx:35`). Já tem destino: a Estrutura da 13.0.
6. **Linha em branco antes de fechar o `describe`** em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/areas.spec.ts`, depois do teste do aluno.
7. **Conferir com o Gabriel no `/validar`** se o seletor com escola, rede e papel, sem sigla, turno e número de turmas, ainda lê como seletor de espaço de trabalho. É a recomendação que já estava registrada.

## test-engineer · 2ª rodada · APROVADO · 2026-09-27 11:39:36 · `tasks/prd-apresentacao-escola/12_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os mesmos da 1ª rodada, que foi aprovada. Esta rodada audita só o que mudou e o que isso afeta.
- A troca recusada com o seletor aberto: duplo clique de verdade, região `role="status"` e foco.
- Uma escola só, sem a rede.
- W12 medido de novo a 360 px.
- "Segunda pessoa" em "Minha turma": dois alunos da mesma escola, no mesmo Chromebook.
- `role="status"` e `<h2>` em "Minha turma".
- A série única por escola na fixture.
- `/aluno/minha-turma` na troca de URL.
- A regex do contrato.

**Cobertos:** todos. Cada correção pedida na 1ª rodada foi feita.

- **Duplo clique** (`e2e/troca-de-escola.spec.ts:384-393`):
  - No Chromebook, `dblclick` de verdade na linha de B.
  - No celular, o segundo toque vai com `force` na linha que já está em `aria-disabled`.
  - `expect(trocas).toBe(1)` (`:400`) fica vermelho se tirarem a guarda de `SeletorDeEscola.tsx:104`.
  - O teste também confere a região `role="status"` com o texto "Abrindo …" (`:393`), e há mutação registrada na linha `:178`.
- **Uma escola só** (`:196`): o teste confere que o nome da rede não aparece na lateral.
- **W12** (`:229-237`): mede de novo os 44 px do botão e das duas linhas depois de ir para 360 px. No Chromebook, a segunda medida já é feita na gaveta.
- **"Segunda pessoa"** (`e2e/minha-turma.spec.ts:105-144`):
  - O primeiro aluno carrega a turma dele e sai. O segundo entra na mesma aba, sem recarregar, com `/v1/minha-turma` segurada.
  - O teste exige "Carregando a sua turma…" e que a turma do primeiro não apareça.
  - Se a chave `['minha-turma']` sobrevivesse, o cache mostraria na hora a turma do primeiro, e as duas asserções cairiam. Isso bate com a mutação registrada do `resetQueries` com dois alunos.
- **Fixture** (`e2e/__fixtures__/sessao.ts:354-358`): o `on conflict (escola_id, etapa, ano) do update ... returning id` devolve o id da série que já existe. Assim o segundo aluno entra numa turma nova da mesma série sem quebrar a restrição única.
- **`<h2>` e `role="status"`** (`minha-turma.spec.ts:66` e `:97`):
  - A turma é conferida como `heading` de nível 2.
  - O aviso de aluno sem turma é conferido como `role="status"`, e o teste também exige que não haja "Tentar de novo".
  - Se tirarem o papel de região, o teste não encontra mais o texto. Isso bate com as mutações de `MinhaTurma.tsx:36` e `:47`.
- **`areas.spec.ts:145`**: o professor agora tenta entrar em `/aluno/minha-turma`, que é o endereço real.
- **Contrato** (`apps/api/test/troca-de-escola.int.test.ts:716`): a regex `/email|conta/i` não pega por acaso os nomes sintéticos ("Rede de <prefixo> <marca>"). As buscas por id e por nome das turmas de B, em `:715`, continuam de pé.
- **Mutações:** as quatro linhas novas da tabela correspondem às quatro cláusulas novas do diff. Nenhuma cláusula nova ficou sem linha na tabela.
- **Proibidos:** nenhum `.skip`, `.only`, `.fixme` ou teste comentado nos arquivos de teste da tarefa. Os mocks cobrem só a resposta HTTP, para simular falha e espera. A tarefa não envolve IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `e2e/troca-de-escola.spec.ts:388`: no celular, o segundo toque procura a linha pelo nome "Abrindo …", que só existe depois de a tela atualizar. Por isso só o `dblclick` do Chromebook prova o caso de dois cliques antes da atualização. Isso basta, porque a guarda é a mesma nos dois projetos. Se quiser deixar o celular igual, dá para tocar duas vezes no mesmo `escolherB`, com `force`, sem esperar a atualização. Fica para o `/retro`.

Arquivos auditados nesta rodada:
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/troca-de-escola.spec.ts
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/minha-turma.spec.ts
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts
- /home/joaquimdp/Documentos/git/Educa.ia/e2e/areas.spec.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/troca-de-escola.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/SeletorDeEscola.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/aluno/MinhaTurma.tsx
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/12_task.md

## frontend-reviewer · 2ª rodada · APROVADO · 2026-09-27 11:40:11 · `tasks/prd-apresentacao-escola/12_task.md`

VEREDITO: APROVADO

Estados: ok. Nesta rodada mudaram só os trechos da recomendação 2 da 1ª rodada, no seletor, e das recomendações 3 e 4, em "Minha turma". Não reauditei os quatro estados de "Minha turma" do zero. Eles continuam como estavam: carregando, com dado, erro com "Tentar de novo", e o aviso do aluno sem turma, que diz a quem recorrer.

Acessibilidade: as três correções estão feitas.
- **Seletor**, `apps/web/src/componentes/SeletorDeEscola.tsx:176-181`: a região `<p role="status" className="sr-only">` fica sempre na página e só o texto muda. É isso que faz a troca ser anunciada.
- **Aviso do aluno sem turma**, `apps/web/src/areas/aluno/MinhaTurma.tsx:36`: está com `role="status"`.
- **Nome da turma**, `MinhaTurma.tsx:47`: virou `<h2>`, abaixo do `<h1>` só para leitor de tela da linha 60. A ordem dos títulos está certa.

Chromebook fraco: sem mudança. A correção acrescenta um `<p>` e um `find` numa lista de duas ou três escolas, sem custo que se note.

Celular: sem mudança de layout. A região de anúncio é `sr-only` e não ocupa espaço nem cria rolagem horizontal. Você diz que os e2e `troca-de-escola`, `minha-turma` e `areas` passaram à mão no projeto `celular`. Não rodei, como você pediu.

Ação oficial protegida: não se aplica. A tarefa não tem nota nem ação oficial. A troca de escola continua protegida contra os dois toques, pelo `trocando !== undefined` e pelo `dblclick` real no e2e.

Bloqueantes: nenhum.

Recomendações:
1. Na troca, o leitor de tela pode dizer "Abrindo <escola>…" duas vezes. O `aria-label` da linha com o foco (linha 159) também muda para esse texto, e a região de status repete. Não bloqueia. Se incomodar no `/validar`, tire a troca do `aria-label` e deixe o anúncio só com a região de status.
2. Em `MinhaTurma.tsx:36`, o aviso já nasce com o texto dentro, porque entra no lugar do carregando. Leitor de tela como o NVDA pode não anunciar região que já aparece preenchida. O texto continua acessível pela leitura normal, então não bloqueia. Se quiser o anúncio garantido, deixe o contêiner de status fixo na `<section>` e troque só o texto dentro dele.
3. As duas recomendações que ficaram para depois estão registradas com destino e motivo em `tasks/prd-apresentacao-escola/12_task.md:140-141`: o foco depois da troca que deu certo vai para o `/validar`, e o texto "próximas versões" da página inicial da coordenação vai para a 13.0. Concordo com os dois destinos.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/SeletorDeEscola.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/areas/aluno/MinhaTurma.tsx`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/12_task.md`

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-27 11:41:20 · `tasks/prd-apresentacao-escola/12_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum novo. O `/v1/eu.acessos` passa a trazer `redeNome`, que é o nome da instituição e não dado de pessoa. A tela "Minha turma" só consome o `GET /v1/minha-turma` que já existia (8.0). O contrato dele é `strictObject` com escola `{nome}`, turma `{id, nome}` e série, sem colega, professor nem matrícula.

Fora da tabela de dados do docs/lgpd.md: nada. Nenhuma migration, nenhuma coluna nova, nenhuma gravação.

Autorização por objeto: ok.
- `acessosDaConta` continua preso à `contaId` da sessão, com `desativadoEm` nulo e papel diferente de aluno. O `innerJoin` com `rede` usa `escola.redeId` e não amplia o que a consulta alcança. A justificativa do `@SemEscopo` foi atualizada junto (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:141-154`).
- O esquema compartilhado é `.strict()` e só aceita `usuarioId`, `escolaNome`, `redeNome` e `papel` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sessao/eu.ts:9-11`).
- O teste de contrato em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/troca-de-escola.int.test.ts` fixa as chaves exatas. Ele cria turmas em B e confere que o corpo não contém o id de B, os ids das redes, o e-mail nem o id e o nome das turmas de B. O aluno continua recebendo a lista vazia.
- "Minha turma" pega escola, ano e aluno do token. `NAO_ENCONTRADO` vira um estado próprio, sem distinguir o motivo.

Logs: limpos. Nenhum `console` ou `logger` no código novo da web, e a API não ganhou log.

Auditoria: não se aplica. Não há leitura de dado de aluno por coordenação ou rede, nem exportação, nota, permissão ou saída de IA. O aluno lendo a própria turma não exige auditoria.

Envio externo: nenhum.

Seed/fixture: sintético.
- Os nomes seguem o padrão "Colégio sintético …", "Rede sintética do e2e …", "2ºB sintética …".
- Os e-mails usam `@educa.invalid`.
- O `redeNome` agora é único por chamada, o que dá força ao teste de "nada de A em B".

Cache e troca de pessoa:
- O `resetQueries` só roda depois de o token novo estar em uso (`guardarToken`, com a mutação registrada).
- O W3 lê o cache pela árvore do React, sem expor o `QueryClient` no `window`.
- Os testes de "segunda pessoa" em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/troca-de-escola.spec.ts` e `/home/joaquimdp/Documentos/git/Educa.ia/e2e/minha-turma.spec.ts` confirmam que o nome, a turma e os ids da pessoa anterior não ficam nem na tela nem no cache.
- O `semAcessosDaConta` deixa de fora só a lista `acessos` da própria conta, o que está justificado.

Pergunta de fechamento: a tarefa não guarda nem envia nada novo, então a resposta sobre "o que o sistema guarda de um aluno e para onde foi enviado" fica como estava antes dela.

Bloqueantes: nenhum.

Recomendações:
- A etapa `escolher` do login agora também mostra o `redeNome` antes do segundo fator da coordenação. É dado da própria conta e institucional, então não bloqueia. Vale registrar na Tech Spec, seção 5, que essa etapa pré-MFA expõe escola, rede e papel e mais nada, para que ninguém acrescente campo ali depois sem perceber.
- `colocarAlunoNaTurma` (`/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts`) grava o vínculo `confirmado` direto no banco, sem a auditoria de decisão da 8.0. Em fixture é aceitável. Um comentário dizendo que o atalho existe só no e2e ajudaria a não copiar esse padrão para seed de demonstração (D71).

## revisor-geral · 1ª rodada · APROVADO · 2026-09-27 11:41:55 · `tasks/prd-apresentacao-escola/12_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: `portão local: o último não rodou e2e. Rode node tools/processo/portao-local.ts --e2e.`

Bloqueantes: nenhum

**Escopo.** As subtarefas 12.1 a 12.5 foram feitas. Nada entra em tarefa futura. O `nomeDaSerie` em `packages/shared` é usado pela tela de "Minha turma" desta tarefa, e a 13.0 só vai reaproveitá-lo.

**Divergências.** Todas as divergências do `12_task.md` também estão na `techspec.md` (seção 9, "Decidido na 12.0"), no `cenarios.md` (W4 e W13) e no `docs/interface.md` 11.1. Isso vale para:
- o seletor sem `details`;
- a lista com todos os acessos da conta;
- o `aria-disabled`;
- a escola única sem a rede;
- o `redeNome` na etapa `escolher`;
- a mensagem do `NAO_ENCONTRADO`;
- o teto de 5 kB;
- o teste de contrato em `troca-de-escola.int.test.ts`.

**Portão.** O carimbo começou às 14:28:49Z e cobre typecheck, lint e test. Depois dele só mudaram o `12_task.md` e os arquivos de `achados/`, então ele vale para o código atual. Falta a suíte e2e, que a tarefa exige porque tem `frontend-reviewer` obrigatório. Seguindo a sua orientação, não reprovei por isso nesta rodada. O commit continua bloqueado até rodar `node tools/processo/portao-local.ts --e2e`.

**O que conferi e está certo:**
- O `@SemEscopo` de `acessosDaConta` tem a justificativa atualizada com o nome da rede.
- A junção `escola.redeId` → `rede` é segura, porque `redeId` é `notNull`.
- O contrato `esquemaAcessoDaConta` é `.strict()`.
- O token novo entra antes do `resetQueries` (`guardarToken` → `limparDadosDaEscola` → `aoTrocarDeSessao`).
- A API devolve de fato `NAO_ENCONTRADO` para o aluno sem vínculo confirmado no ano (`minha-turma.service.ts`), então o estado a mais da tela existe.
- Não achei `.skip`, `any`, `TODO`, `.only` nem `waitForTimeout` nos arquivos da tarefa.

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/index.ts:114` exporta `NOME_DA_ETAPA`, que só o `nomeDaSerie` usa. Exporte só a função até alguém precisar da constante.
2. `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/SeletorDeEscola.tsx:179` procura de novo a escola no meio dos acessos a cada render para montar o texto de status. Já há o `usuarioId` em `trocando`. Guardar o nome da escola em troca junto no estado deixa as linhas 154, 166 e 179 com uma fonte só para o "Abrindo …".
3. A tabela "Arquivos previstos" do `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/12_task.md` ainda cita `apps/api/src/sessao/eu.repository.ts`, `eu.repository.int.test.ts` e `apps/web/src/api/sessao.ts` como alterados, e nenhum mudou. A divergência do teste de contrato explica um deles. Vale uma linha que diga isso dos outros dois, para o `/validar` não ter de adivinhar.

## test-engineer · 3ª rodada · APROVADO · 2026-09-27 11:53:56 · `tasks/prd-apresentacao-escola/12_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os mesmos da 2ª rodada, em que a tarefa foi aprovada. Nesta rodada audito só o que mudou depois dela:
- `SeletorDeEscola.tsx`: o estado `trocando` agora guarda o acesso inteiro, e o texto "Abrindo …" sai da constante `abrindo`.
- `packages/shared/src/index.ts`: deixou de exportar `NOME_DA_ETAPA`.
- `e2e/__fixtures__/sessao.ts`: só um comentário novo.
- A tabela "Mutações" do `12_task.md`: os números de linha foram atualizados.

**Cobertos:**
- **Texto "Abrindo …".** O `e2e/troca-de-escola.spec.ts:388-395` confere o mesmo texto nos três lugares que agora usam a constante `abrindo` (`SeletorDeEscola.tsx:79`): o nome acessível da linha (`linhaDoSeletor(page, \`Abrindo ${emB.escolaNome}…\`)`), o `aria-disabled` e a região `role="status"`. Se a constante sumisse ou saísse errada em qualquer um deles, o teste quebraria nos dois projetos.
- **Guarda da troca no ar (`:106`).** Continua coberta pelo `expect(trocas).toBe(1)` em `troca-de-escola.spec.ts:400`, com clique duplo no Chromebook e segundo toque forçado no celular. A comparação por `trocando?.usuarioId` (`:151`) dá o mesmo resultado que antes.
- **Tabela "Mutações".** Conferi cada linha contra o arquivo atual e todas batem: 81, 93, 96, 101, 106, 108, 128-129, 158, 159 e 181.
- **`NOME_DA_ETAPA`.** Não tem uso fora de `packages/shared/src/estrutura/serie.ts`. O `nomeDaSerie` continua exportado, com teste unitário das duas etapas em `packages/shared/src/estrutura/serie.test.ts:6-7`. A tela usa só ele (`apps/web/src/areas/aluno/MinhaTurma.tsx:50`).
- **`e2e/__fixtures__/sessao.ts`.** Na parte descrita, só mudou o comentário do `colocarAlunoNaTurma`, sem efeito em nenhuma asserção.
- **Sem `.skip`.** O diff não trouxe `.skip`, teste comentado nem mock novo.

**Bloqueantes:** nenhum.

**Recomendações:**
- O `NOME_DA_ETAPA` continua `export` em `packages/shared/src/estrutura/serie.ts:15`, mas agora ninguém fora do arquivo o usa. Poderia virar `const` interna. É só limpeza e não afeta teste.
- O `packages/shared/dist/` ainda tem o `NOME_DA_ETAPA` do build anterior. Vale confirmar que o próximo build regenera o `dist` e que ele não está versionado.
- Continua valendo o que você já combinou: o `--e2e` e o `--infra` precisam rodar no portão final antes do commit, porque as mutações do seletor só são provadas pelo Playwright.

## frontend-reviewer · 3ª rodada · APROVADO · 2026-09-27 11:54:29 · `tasks/prd-apresentacao-escola/12_task.md`

VEREDITO: APROVADO

Esta foi uma rodada nova, a 4ª. Auditei só o que mudou desde a 2ª, que eu tinha aprovado: a troca do estado `trocando` e a constante `abrindo` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/SeletorDeEscola.tsx`. O resto do arquivo e das telas não mudou e não foi reauditado.

**Estados:** ok. Não mudaram, e o que aparece durante a troca fica igual:
- A linha em troca mostra "Abrindo <escola>…" (linhas 168–169).
- A região `role="status"` já está na página antes do texto (linhas 181–183).
- Os dois textos se esvaziam juntos no `finally` (linha 121).
- O erro continua em `role="alert"` com a mensagem que diz o que fazer.

**Acessibilidade:** sem regressão. O `aria-label` da linha em troca (linha 157), o texto que aparece nela (linha 169) e a região de status (linha 182) usam a mesma constante `abrindo` (linha 79). Os três dizem a mesma coisa, então o que se vê bate com o que o leitor de tela ouve (WCAG 2.5.3). Também continuam iguais:
- `aria-disabled` em vez de `disabled`, para o foco não cair no `body`.
- `aria-current` na escola de agora.
- O Esc fecha só a lista e devolve o foco ao botão.

O texto sai do mesmo objeto que foi passado a `escolher(acesso)` na linha 160. É o mesmo `escolaNome` de antes, e a linha em troca é achada pelo `usuarioId` (linha 151).

**Chromebook fraco:** sem impacto. Guardar a referência ao objeto em vez da string não custa nada, e não entrou dependência, render nem efeito novo.

**Celular:** sem impacto. O layout e os alvos de toque não mudaram (`min-h-11` nas linhas 142 e 161). Você informou que rodou `troca-de-escola` e `minha-turma` à mão nos projetos `chromebook` e `celular`, com 24 de 24 verdes. Eu não rodei suíte nenhuma, para não mexer no compose `educa-teste`.

**Ação oficial protegida:** sim, o que se aplica aqui continua valendo:
- A proteção contra dois toques está na linha 106.
- Escolher a escola atual só fecha a lista, sem gerar token novo (linhas 108–111).
- O cache só é esvaziado depois de o token do destino estar em uso, como já estava.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova. As duas da 2ª rodada continuam registradas para o `/validar`, como você disse.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-27 11:55:03 · `tasks/prd-apresentacao-escola/12_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo nesta rodada. O `SeletorDeEscola.tsx` mostra a escola, a rede e o papel de cada acesso da própria conta, tudo vindo do `AcessoDaConta` que você já tinha auditado na 1ª rodada. O estado `trocando` passou a guardar o objeto `AcessoDaConta` em vez do id. Esse estado fica só na memória do componente: não vai para log, armazenamento local nem rede. A chamada à API continua mandando só o `usuarioId`.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. Nesta rodada não mudou rota nem repository. Escolher a escola em que a pessoa já está só fecha a lista, sem chamar a API. A troca continua tratando `NAO_ENCONTRADO` com o aviso genérico, sem dizer se a escola existe.

Logs: limpos. O diff não tem `console` nem logger. O texto "Abrindo …" aparece só na tela e para o leitor de tela (`role="status"`).

Auditoria: presente. Nenhuma ação desta rodada exige auditoria nova.

Envio externo: nenhum.

Seed/fixture: sintético. Os nomes de rede novos seguem o padrão `Rede sintética do e2e <marca>` e `Outra rede sintética do e2e <marca>`, e os e-mails usam o domínio `@educa.invalid`. Os parâmetros do SQL agora são posicionais. O comentário pedido em `colocarAlunoNaTurma` (em `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts`) está lá: diz que é atalho só do e2e, sem a decisão nem a auditoria, e que não serve de modelo para seed de demonstração (D71).

Bloqueantes: nenhum.

Conferência das duas recomendações da 1ª rodada:
- Nota na seção 9 da techspec (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md`): feita. Diz que a etapa `escolher`, antes do segundo fator, expõe só escola, rede e papel de cada acesso da própria conta, e que campo novo no `esquemaAcessoDaConta` passa pelo `privacy-guardian`.
- Comentário no `colocarAlunoNaTurma`: feito, como descrito acima.

Também revisei `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/index.ts`. A única mudança nas exportações é trocar `NOME_DA_ETAPA` por `nomeDaSerie`, e isso não expõe nada de pessoa.

Recomendações: nenhuma nova.

Pergunta de fechamento: esta rodada não muda o que o sistema guarda sobre o aluno nem para onde envia. A resposta continua a da 1ª rodada.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-27 11:55:07 · `tasks/prd-apresentacao-escola/12_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A nota da etapa `escolher` está na `techspec.md` seção 9 ("Decidido na 12.0"). As divergências do `12_task.md` continuam registradas na techspec, no `cenarios.md` e em `docs/interface.md` 11.1.

Portão local: `portão local: o último não rodou e2e. Rode node tools/processo/portao-local.ts --e2e.` O carimbo tem typecheck, lint e test e foi gravado depois das mudanças. Nesta rodada não conto a falta do e2e como bloqueante, porque você disse que o Joaquim decidiu rodar o e2e só no portão final. A tarefa só fecha com `node tools/processo/portao-local.ts --e2e`, e também com `--infra` se o `infra-guardian` estiver marcado, antes do commit. Sem isso o hook barra o commit.

Bloqueantes: nenhum.

As três correções da 1ª rodada foram feitas:
1. `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/index.ts:114` exporta `nomeDaSerie` e não exporta mais `NOME_DA_ETAPA`. O único uso que sobrou está dentro de `serie.ts`.
2. `/home/joaquimdp/Documentos/git/Educa.ia/apps/web/src/componentes/SeletorDeEscola.tsx`:
   - `trocando` guarda o `AcessoDaConta`.
   - `abrindo` (linha 79) é a única fonte do texto, usada no `aria-label` da linha, no texto dela e no `role="status"` (linha 181).
   - `escolher` recebe o acesso.
   - A guarda da troca no ar vem antes da guarda da escola de agora. Com uma troca no ar, clicar na escola de agora não faz nada, e isso é o esperado.
3. `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/12_task.md:100` explica por que os três arquivos previstos não mudaram.

As linhas citadas em "Mutações" batem com o arquivo atual: 81, 93, 96, 101, 106, 108, 128, 158, 159 e 181. As correções do `privacy-guardian` também estão feitas: o comentário do `colocarAlunoNaTurma` e a nota na seção 9.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/e2e/__fixtures__/sessao.ts`, no comentário do `colocarAlunoNaTurma`: a frase nova foi colada no meio de uma linha e deixou a linha bem mais longa que as outras do bloco. Vale quebrar o parágrafo de novo.
