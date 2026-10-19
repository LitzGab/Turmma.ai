# Achados das revisões — `tasks/correcoes/2026-10-19-hoje-vinculo-encerrado.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 18:23:20 · `tasks/correcoes/2026-10-19-hoje-vinculo-encerrado.md`

VEREDITO: APROVADO
Tela vista: sim (8 fotos lidas, computador e celular, escola cheia e vazia, de Hoje sem e com o painel "Ver quem"). O aviso de turma indisponível não está em nenhuma foto, como o prompt já dizia. Eu o conferi pelo código e pelo e2e.
Estados: ok. Carregando, erro, vazio e com dado continuam como estavam. O estado novo, "turma indisponível", reaproveita `TurmaIndisponivel` e `TEXTO_DA_TURMA_INDISPONIVEL` em `Turma.tsx`, com o caminho de volta "Voltar para Turmas" (`Turma.tsx:~84-95`). O vazio de Hoje convida: "Nenhum sinal desta turma ainda" explica quando o Tutor avisa. O vazio do acerto por habilidade diz o que fazer.
Acessibilidade: sem regressão. O foco vai para o aviso quando a turma já estava na tela (`comFoco={turma.data !== undefined}`). O diálogo "Ver quem" sai junto com a página, sem deixar foco no `body`. O e2e confere que nenhum aluno fica visível, e a região `aria-live` de Hoje não mudou.
Chromebook fraco: sem custo novo. O `useEffect` só dispara na mudança de `semATurma`, que é um booleano, e a releitura de 15 s continua só com a aba à vista.
Celular: as fotos a 360 px não têm rolagem horizontal nem corte. O alvo de "Ver o uso do Tutor por aluno" e o da aba têm altura suficiente, e o painel vira folha inferior legível. A barra de navegação fixa aparece sobre o fim da primeira dobra na foto de página inteira. É efeito da captura e já existia antes desta correção, e a tarefa não mexeu nesse ponto.
Ação oficial protegida: sim. A tarefa não cria ação oficial. Ela tira da tela, mais cedo, o nome de aluno que ficaria visível depois do vínculo encerrado (regra 20, item 18).
Bloqueantes: nenhum.

Verifiquei a correção contra o código:
- `TurmaHoje.tsx:62,85-88` recebe `aoPerderATurma` e o chama só quando `turmaIndisponivel(sinais.error)`, que é o 404 `NAO_ENCONTRADO`. É o mesmo critério e o mesmo padrão da aba Alunos (`AlunosDaTurma.tsx:66-69`).
- `Turma.tsx:111` passa `perderATurma`, o mesmo callback que a aba Alunos já usava.
- O 404 desmonta a página inteira: abas, painel, nomes e título viram "Turma". Limite, rede ou servidor com o dado na tela não desmontam nada. O teste de controle em `TurmaHoje.test.tsx` cobre esse caso.
- A mutação declarada (`semATurma && false`) é pega por `Turma.test.tsx`, que exige a página sem abas, sem diálogo e sem o nome do aluno depois da releitura. O e2e novo cobre o mesmo fluxo com o relógio simulado.

Recomendações:
- `apps/web/src/areas/professor/TurmaHoje.tsx:~55`: a linha do comentário JSDoc que ganhou "O 404 da releitura ... como a aba Alunos." ficou comprida, e o texto vale como item próprio da lista. Quebre em duas linhas ou mova para o comentário do `useEffect`.
- `Turma.tsx:65`: `perdida` é estado sticky e só zera se o componente remontar. Isso já valia para a aba Alunos. Se a rota não remonta `Turma` ao trocar de `turmaId`, vale um `key={turmaId}` ou zerar o estado quando o id muda. Fica para o `/validar`, porque não é desta correção.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-19 18:23:24 · `tasks/correcoes/2026-10-19-hoje-vinculo-encerrado.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. A correção só lê o que já existia: o nome do aluno no sinal `atencao_humana` e o uso por aluno no painel "Ver quem". O diff mexe só no frontend, sem migration, DTO ou rota nova.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. A correção não cria rota. Ela passa a usar na tela a resposta igual da API para "não encontrado" e "sem permissão" (`turmaIndisponivel` só olha o `NAO_ENCONTRADO`, e o texto `TEXTO_DA_TURMA_INDISPONIVEL` é um só para os quatro casos). Agora o vínculo encerrado com a aba Hoje aberta tira da tela, em até cerca de 15 s, os nomes do painel "Ver quem". Antes eles ficavam até a releitura da turma, depois de 30 s. Isso atende a regra 20, item 18.

Logs: limpos. O diff não tem `console` nem logger.

Auditoria: não se aplica. A correção não é leitura por coordenação ou rede, nem exportação, nota, permissão ou aprovação de saída de IA.

Envio externo: nenhum.

Seed/fixture: sintético. Os testes usam "Caio Sintético", ids `0197a1c0-…` e os `alunoDoLote` de `e2e/__fixtures__/assistente.ts`. As fotos mostram "Colégio sintético da vitrine cheia", "Professora Sintética Helena" e só textos de vazio e agregado.

Fotos: nas quatro que li, Hoje aberta e "Ver quem" aberto, no computador e no celular, aparecem só o agregado da turma ("0 de 300", "Nenhum sinal…", acerto por habilidade). Não aparece nome nem matrícula de aluno fora do painel nominal, e o painel avisa que o conteúdo da conversa não aparece. O aviso de turma indisponível só aparece no e2e, e o e2e confere três coisas:
- nenhum dos `NOMES` fica no `body`;
- o painel do Tutor e as abas somem;
- o título da aba volta a ser "Turma · Turmma".

Bloqueantes: nenhum.

Recomendações:
1. Quando a página da turma sai, a consulta dos sinais, que traz o nome do aluno no `atencao_humana`, continua no cache do TanStack Query até o `gcTime` padrão, porque só o uso tem `gcTime: 0`. A aba Alunos já se comporta assim, então não é regressão desta correção. Vale considerar `queryClient.removeQueries` das leituras da turma em `perderATurma` (`apps/web/src/areas/professor/Turma.tsx:90`), para que nenhum nome fique na memória da aba depois do aviso.
2. O teste de componente garante uma chamada só de `aoPerderATurma`. Falta um caso de unidade que garanta que o 404 da **primeira** leitura dos sinais, com a página que abre já sem vínculo, também chama `aoPerderATurma`. Hoje a releitura da turma cobre isso, e por isso fica como reforço.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/TurmaHoje.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Turma.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/TurmaHoje.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Turma.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-tutor.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/correcoes/2026-10-19-hoje-vinculo-encerrado.md

## test-engineer · 1ª rodada · REPROVADO · 2026-10-19 18:24:45 · `tasks/correcoes/2026-10-19-hoje-vinculo-encerrado.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- Caminho feliz: com Hoje aberta, a releitura de 15 s recebe 404 e a página inteira sai. Ficam só o aviso, o título "Turma" e o caminho de volta.
- Borda: o painel "Ver quem" aberto, com os nomes na tela no momento do 404 (regra 20, item 18).
- Borda: o mesmo 404 com o painel fechado.
- Borda: a releitura cai por limite, rede ou servidor com o dado na tela, e nada é desmontado.
- Borda: a virada de ano e a turma excluída. A API responde igual, com o mesmo `NAO_ENCONTRADO`, então é o mesmo caminho.
- Borda: a releitura seguinte também volta 404, e o aviso não se repete.
- Permissão: o professor sem vínculo deixa de ver o aluno da turma.
- Isolamento: não se aplica. A tarefa é só de tela e o escopo continua na API.

**Cobertos:**
- O 404 com o painel aberto é provado no nível da página (`Turma.test.tsx:199`) e no e2e (`e2e/professor-tutor.spec.ts:177`). Os dois conferem o diálogo fechado, as abas fora, o título "Turma" e nenhum nome na página.
- O aviso do componente para a página está em `TurmaHoje.test.tsx:384`.
- O controle do 429 está em `TurmaHoje.test.tsx:399`.
- A mutação declarada (`if (semATurma && false)`) acerta o teste citado, e o portão já a provou vermelha.
- Se o `Turma.tsx` deixar de passar a função, o typecheck pega, porque a prop é obrigatória.
- Não há `.skip`, mock que esconda a regra nem provedor pago.
- Rodei os dois arquivos: 36 de 36 passam.

**Bloqueantes:**

1. **O critério "só o 404 vale" é cláusula nova e não tem bloco de mutação. O teste que deveria prová-lo pode passar com a regra removida.**
   - A linha nova `const semATurma = turmaIndisponivel(sinais.error)` (`apps/web/src/areas/professor/TurmaHoje.tsx:85`) é a cláusula que o documento escreve em "Correção": "Só o 404 vale". A única mutação declarada desliga o `if`, não o critério.
   - O controle (`apps/web/src/areas/professor/TurmaHoje.test.tsx:399-412`) espera só a segunda chamada a `/v1/sinais`. Isso acontece quando o `fetch` sai (`__fixtures__/tela.tsx:66` conta a chamada antes de responder).
   - Logo em seguida o teste afirma `expect(aoPerderATurma).not.toHaveBeenCalled()` e `expect(aviso()).not.toBeNull()`. Nada garante que o 429 já chegou ao estado da consulta e ao efeito quando essas linhas rodam.
   - O teste vizinho do 404 precisa de `waitFor(... toHaveBeenCalledTimes(1))` para o mesmo efeito. Isso mostra que o efeito chega depois da contagem.
   - Com a mutação `turmaIndisponivel(sinais.error)` → `sinais.isError`, as duas negativas podem rodar antes da falha chegar e passar mesmo assim. O próprio documento diz que o controle "passa nos dois lados".
   - **Correção exigida, em três passos:**
     1. Declarar o bloco:
        ```
        -  const semATurma = turmaIndisponivel(sinais.error)
        +  const semATurma = sinais.isError
        ```
     2. Apontar o bloco para um teste que espera a falha chegar antes das negativas. Há dois jeitos:
        - No controle, esperar o estado de erro da consulta dos sinais. Por exemplo, `montar` devolve o `cliente`, e o teste faz `waitFor` até `state.status === 'error'` na consulta de `/v1/sinais`. Só depois vêm as duas negativas.
        - Ou acrescentar um caso em que a primeira leitura já cai com 429 e sem dado: espera o `findByRole('alert')` e então afirma que `aoPerderATurma` não foi chamada.
     3. O portão precisa provar esse bloco vermelho.

**Recomendações:**
- O "uma vez só" do título (`TurmaHoje.test.tsx:384`) não é provado como está.
  - O `waitFor(... toHaveBeenCalledTimes(1))` passa no instante em que chega a 1. O teste não avança até uma terceira releitura, também 404, para conferir que fica em 1.
  - O efeito é inofensivo se repetir, porque o `setState(true)` é idempotente. Ou se avança mais 15 s e se confere `toHaveBeenCalledTimes(1)`, ou se tira "uma vez só" do título.
- O 404 com o painel fechado só está provado no componente, com a função falsa.
  - No nível da página (`Turma.test.tsx`), um caso com `aba=hoje`, sem `ver=tutor`, fecharia o cenário. Ele confere que a página sai e que não sobra aba.
  - Não é bloqueante: o caminho do código é o mesmo e o e2e cobre a página.
- O e2e novo instala o relógio (`page.clock.install()`) depois de `entrar`.
  - Se um dia a releitura da turma ou o foco passarem a disparar antes dos 16 s simulados, a página pode sair pelo caminho antigo. Aí o teste continua verde sem passar pela releitura dos sinais.
  - Uma linha de comentário, ou uma asserção de que `/v1/turmas/<id>` não foi relida, deixaria isso explícito.
- As capturas de tela não mostram o aviso de turma indisponível. Esse estado só se vê no e2e, como o próprio pedido diz, e a conferência visual fica com o `frontend-reviewer`.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/TurmaHoje.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/TurmaHoje.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Turma.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-tutor.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/correcoes/2026-10-19-hoje-vinculo-encerrado.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-19 18:40:34 · `tasks/correcoes/2026-10-19-hoje-vinculo-encerrado.md`

VEREDITO: APROVADO

Cenários exigidos:
- Caminho feliz: com Hoje aberta, a releitura dos sinais aos 15 s volta 404 e a página da turma sai inteira, com o painel e os nomes.
- Borda: a primeira leitura dos sinais já volta 404 (a página abre sem o vínculo).
- Borda: depois do 404, as releituras seguintes também voltam 404 e o aviso não se repete ("uma vez só").
- Borda: o painel "Ver quem" está aberto, ou está fechado.
- Permissão: só o 404 tira a página. Limite (429), rede e servidor não tiram, nem com o dado na tela nem sem ele.
- Isolamento e LGPD: depois de perder a turma, nenhum nome de aluno fica na tela. O cache de consultas está no `TODO.md`.

Cobertos:
- **A correção exigida foi feita.** O bloco `sinais.isError` está declarado (`tasks/correcoes/2026-10-19-hoje-vinculo-encerrado.md:59-64`) e aponta para o controle "a releitura que cai por limite ou servidor".
- **As asserções negativas agora rodam depois de a falha chegar.** Esse controle espera a chamada a `/v1/sinais` chegar a 2 e, em seguida, `falhaDosSinaisChegou`, que exige `status === 'error'` na consulta dos sinais. Só depois afirma `not.toHaveBeenCalled()` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/TurmaHoje.test.tsx:386`, `:426-428`).
  - O `waitFor` do RTL esvazia um `setTimeout(0)` dentro de `act` antes de devolver o controle. Assim, o aviso do TanStack aos observadores, a nova renderização e o efeito já rodaram quando a asserção acontece.
  - Com a mutação, o `aoPerderATurma` é chamado e o teste fica vermelho na linha 428, que é o motivo certo.
- **O segundo controle também pega a mesma mutação.** Na primeira leitura em 429, o efeito roda no mesmo commit em que o alerta aparece, então ele seria chamado antes do `findByRole('alert')` (`TurmaHoje.test.tsx:432-440`).
- **O bloco do `if`** segue com `Turma.test.tsx`. O `it.each`, com o painel aberto e fechado, falha porque as abas e o painel continuam na página (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Turma.test.tsx:200-225`).
- **O caso da primeira leitura já em 404** tem teste próprio (`TurmaHoje.test.tsx:408-414`).
- **O e2e agora confere que a turma não foi relida.** A página sai pelos sinais, e não pela releitura por foco (`e2e/professor-tutor.spec.ts:184-198`).
- **Testes rodados:** os 39 testes dos dois arquivos de componente passaram aqui. Nenhum `.skip`, e nenhum mock de coisa nossa: a rede é falsa e o cliente de consultas é o de verdade.

Bloqueantes: nenhum.

Recomendações:
1. **O "uma vez só" ainda não está provado de verdade** (`TurmaHoje.test.tsx:403-405`). O teste espera só a terceira chamada ao `fetch` antes de afirmar `toHaveBeenCalledTimes(1)`. O `status` já era `'error'` desde a segunda leitura, então o `falhaDosSinaisChegou` não serviria aqui. Uma implementação que reavisasse a cada erro novo, por exemplo com `sinais.error` como dependência do efeito, poderia passar porque o terceiro 404 ainda estava a caminho. A troca proposta é esperar `cliente.getQueryState(...).errorUpdateCount === 2` antes da asserção. Nenhum bloco de mutação declara essa cláusula, por isso não bloqueia.
2. **No caso com o painel fechado, a asserção do nome é vazia** (`Turma.test.tsx:222`). O nome nunca esteve na tela, então `not.toContain('Caio Sintético')` passa nos dois lados. O que prova o caso são as asserções das abas e do aviso. Vale tirar o "sem o nome de aluno nenhum" do título nesse ramo, ou dizer no comentário que ali só as abas e o aviso provam.
3. **O cache de consultas com os nomes depois de perder a turma** continua no `TODO.md`, como o `privacy-guardian` registrou. Quando for feito, precisa de um teste que leia o cache, nos moldes de `tudoDoCache`.
