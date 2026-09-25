# Validação — apresentacao-painel (A0b)

## Rodada 2 — 25/09/2026

**Escopo:** funcionalidade completa (revalidação depois da correção de documento)
**Commit validado:** `e6fcc6e2d4aa33c33120e2706fbd22690575bf45`
**Veredito: APROVADA**

Entre a rodada 1 (`e276ddc`) e esta entrou só o commit `e6fcc6e`, correção
`2026-09-25-spec-da-a0b-atras-do-codigo`, marcada `(correção <slug>)`. `git diff --name-only e276ddc e6fcc6e` lista onze
arquivos, **todos `.md`**: `README.md`, `docs/arquitetura.md`, `docs/interface.md`, `docs/lgpd.md`,
`docs/modelo-de-dados.md`, `tasks/prd-apresentacao-painel/{prd,techspec,cenarios}.md`, o documento da correção e os
dois arquivos do hook em `tasks/correcoes/achados/`. Nenhum arquivo de `apps/`, `packages/`, `infra/`, `e2e/` ou `tools/`
mudou; o código é o mesmo que a rodada 1 validou.

### 1. RF a RF

Sem mudança de código, a tabela e as três provas de mutação da rodada 1 continuam valendo: **RF1 a RF8 ATENDIDOS**. Esta
rodada conferiu o que a correção passou a afirmar sobre esse código, ponto a ponto, contra arquivo e teste:

| Ponto da rodada 1 | Situação | Evidência no código |
|---|---|---|
| Maior (a): W10, texto do 401 | resolvido e verdadeiro | `cenarios.md` W10 ancora o texto em `MENSAGENS_DE_ERRO.SESSAO_ENCERRADA`; é o `packages/shared/src/erros/mensagens.ts:21`, usado por `apps/web/src/operacao/textos.ts:10` e `api/sessao.ts:315,484` |
| Maior (b): W10, tentativa incerta | resolvido e verdadeiro | texto igual, letra a letra, a `textos.ts:83-84`; mostrado em `NovaEscola.tsx:181` só com `incerto` e `CONFLITO`; `ehResultadoIncerto` (`textos.ts:73-76`) é `INDISPONIVEL_TENTE_DE_NOVO` ou `ERRO_INTERNO`; e2e `operacao-escolas.spec.ts:25,413`. W10 também passou a dizer o `NAO_ENCONTRADO` no refazer, que é o `falhaDoConvite` (`textos.ts:116`) |
| Maior (c): E9 | resolvido e verdadeiro | `revogarParaRefazer` com `usado_em is null and revogado_em is null` (`apps/api/src/sessao/convite.repository.ts:155-162`); sem revogar, `CONFLITO` antes do `criarConvite` (`convite.service.ts:254-255`); os dois testes do E9 em `painel-convite.int.test.ts:748-801` (inclusive o aceite no meio do refazer); a condição em `convite.repository.int.test.ts:193-212`; o 23505 tipado em `:155` |
| Maior (d): matriz, `sem_convite` | resolvido e verdadeiro | `escolaDoConviteParaOperador` não acha escola e a resposta sai antes da matriz (`convite.service.ts:249,283`); `painel-convite.int.test.ts:50-69` fixa 404 nas duas ações. A ressalva nova da seção 5 também confere: se o convite sumisse entre achar a escola e ler o estado, o revogar cai em `revogado(conviteId) === undefined` → `NAO_ENCONTRADO` (`:290-291`), antes do `conflito`, e o refazer dá `CONFLITO` pela `REFAZER_CONVITE_POR_ESTADO.sem_convite` (`packages/shared/src/operacao/painel.ts:108`) |
| Maior (e): seção 7, `docs/lgpd.md` | resolvido e verdadeiro | as linhas 72 e 78 do `docs/lgpd.md` dizem o que a tabela da spec descreve (convite pelo painel, link uma vez; motivo `convite_aceito`) |
| Maior (f): seção 11 e `docs/modelo-de-dados.md` | resolvido e verdadeiro | `docs/modelo-de-dados.md` ("O painel da operação") lista os sete `@SemEscopo`, que conferem com `painel.repository.ts:121,133,200`, `ops/escola.repository.ts:25,34` e `sessao/resolucao-de-tenant.repository.ts:448,464`, com a justificativa de cada decorador. "Os outros quatro já existiam": confere (`git show 829ab8d~1:apps/api/src/sessao/resolucao-de-tenant.repository.ts` já tinha os dois do `sessao`, e o `escola.repository.ts` nasceu na A1 do F1, `2e7beac`). Nenhum outro `@SemEscopo` é alcançado por rota do painel (os demais estão em `sessao`, fila, expurgo e consolidação de uso). As tabelas lidas são as das consultas de `painel.repository.ts:102-230`. I1 (`arquitetura.test.ts:96-118`) e I2 (`ops/escola.repository.test.ts:54-60`) sustentam o que o texto diz. `docs/arquitetura.md` remete à tabela |
| Menor 1: `README.md:64` | resolvido e verdadeiro | `painel.service.ts:32,118-127` chama o `criarRede` e o `criarEscola` do `ops/escola.ts` |
| Menor 2: `docs/lgpd.md` | resolvido e verdadeiro | o parágrafo "O painel da operação não vê pessoa da escola" confere com o contrato estrito e com o I6; o `rl:ip:op` usa o IP como chave, pela janela de 60 s, no Redis de cache e no seguro (`packages/nucleo/src/limite/chaves.ts:30`, `limitador.ts:126-138,170,230-232`), em exatamente sete rotas `@EntradaDeOperacao()` (dois em `segundo-fator`, dois em `convite-operador`, dois em `sessao`, um em `entrada`) |
| Menor 3: `docs/interface.md` 5a | resolvido e verdadeiro | os sete estados, na ordem e no sentido de `apps/web/src/operacao/estados-da-escola.ts:7-15`; remete ao W10 e à matriz |
| Menor 4: PRD, RF2 | resolvido e verdadeiro | a nota confere: gerar, refazer e revogar pegam a trava em `coordenacaoSobATrava` (`convite.service.ts:163-168`) antes de ler o estado; não há estado em que gerar e refazer passem os dois (`painel.ts:91-113`); a troca está em `revisao-spec.md:54` |
| Menor 5: `docs/modelo-de-dados.md:25-26` | resolvido e verdadeiro | `randomUUID()` em `apps/api/src/ops/escola.ts:156-157` |
| Menor 6: `techspec.md:25` | resolvido e verdadeiro | `packages/nucleo/drizzle/0015_…`, `0016_…` e `0017_operador_aceite.sql`, esta com exatamente os dois checks descritos |

Nenhuma afirmação nova da correção contradiz o código. As duas notas de acerto no alto de `techspec.md` e `cenarios.md`
dizem de onde veio a mudança e não mexem no status da spec.

### 2. Regras de negócio, casos de borda e critério de pronto

Iguais à rodada 1: todas as regras cumpridas, os casos de borda cobertos, o critério de pronto do `tasks.md` e o "Pronto
quando" do `ROADMAP.md` cumpridos. O item que a rodada 1 deixou para o `/retro` ("precisa estar feito antes do
`/retro`, para a spec voltar a ser a fonte") está feito: `techspec.md` e `cenarios.md` voltam a descrever o código.

### 3. Portão

Reaproveitado da rodada 1, porque `git diff e276ddc e6fcc6e` só toca `.md` (conferido pela lista de arquivos acima).
Árvore limpa no início e no fim (só o `validacao.md` fora do controle de versão, como na rodada 1). Não foi preciso
`npm ci`.

| Portão | Resultado |
|---|---|
| `npm run typecheck` | ✅ (rodada 1, mesmo código) |
| `npm run lint` | ✅ (rodada 1, mesmo código) |
| `npm run test` | ✅ (rodada 1: 183 arquivos, 2218 testes) |
| `npm run test:e2e` | ✅ (rodada 1: 226, `chromebook` e `celular`) |
| `npm run test:infra` | ✅ (rodada 1: 5 arquivos, 36 testes) |
| Esteira do GitHub no commit validado | ✅ (execução 36161489538, `e6fcc6e`: verificar, integração, e2e com 226 e infra verdes) |
| Revisões com veto registradas e aprovadas | ✅ (a correção tem `test-engineer` rodadas 1 e 2, `tenancy-guardian` e `revisor-geral`, todos APROVADO) |

### 4. Achados

**Críticos**
- nenhum

**Maiores**
- nenhum. O maior da rodada 1 está resolvido nos seis pontos (seção 1 acima).

**Menores**
1. `docs/lgpd.md:107`: "O único dado de pessoa que passa pelo painel é o nome e o e-mail da coordenadora". O painel também
   recebe o e-mail, a senha e o segundo fator do próprio operador na entrada (linha "Conta de operador Turmma", acima).
   O parágrafo fala de pessoa da escola, mas a frase, isolada, é mais larga que o fato. Correção: "O único dado de pessoa
   **da escola** que passa pelo painel…".
2. Recomendação do `test-engineer` (correção, 1ª rodada, item 3) sem destino: o texto do 401 não é conferido por extenso
   em nenhum teste (`apps/web/src/operacao/textos.test.ts:44-46` compara com o catálogo e só com o começo, "Entre de
   novo"). Se o catálogo mudar, o W10 fica falso e tudo continua verde. Correção: o texto literal no teste, na próxima
   tarefa que mexer em `textos.ts`.
3. Recomendações do `test-engineer` (correção, 1ª rodada, itens 4 e 5) sem destino: `REVOGAR_CONVITE_POR_ESTADO.sem_convite`
   (`packages/shared/src/operacao/painel.ts:121`) não tem o comentário de "inalcançável" que o `REFAZER_` tem
   (`:102-103`), agora que a spec o registra; e o texto do `NAO_ENCONTRADO` do gerar ("Essa escola não foi encontrada…",
   `textos.ts:99`) está testado mas fora da lista fechada do W10. Correção: o comentário na próxima tarefa que tocar a
   matriz; o texto do gerar para o `/retro`.
4. Da rodada 1, continuam com o destino que ela deu: menor 7 (recomendações de revisor da 3.0, 8.0 e 10.0) e menor 8
   (mutação da trava provada pelo efeito).

**Positivos**
- A correção de documento trouxe a tabela "Teste que reproduz" com arquivo e linha para cada ponto: numa correção sem
  teste vermelho, é o que deixou esta revalidação conferir cada afirmação em vez de confiar no texto.
- `docs/modelo-de-dados.md` agora tem, numa tabela, todo `@SemEscopo` que uma rota do painel alcança, com a
  justificativa; `docs/arquitetura.md` remete a ela em vez de repetir, e os dois não têm mais como divergir.

### 5. Conclusão

O código não mudou desde a rodada 1, e o portão dela vale para este commit. Os oito RF estão atendidos, o critério de
pronto está cumprido, e a esteira de `e6fcc6e` está verde. O maior da rodada 1 e os menores 1 a 6 estão resolvidos, e
cada afirmação nova da correção confere com o código e com os testes citados. Não há crítico nem maior. Os menores que
ficam são de texto e de recomendação de revisor, com destino, e não bloqueiam a A1. Veredito: **APROVADA**.

### 6. Pendências herdadas

| Pendência | Destino |
|---|---|
| Menor 1 (frase de `docs/lgpd.md:107`) | próxima tarefa ou correção que tocar `docs/lgpd.md` |
| Menor 2 (texto do 401 por extenso no teste) | próxima tarefa que mexer em `apps/web/src/operacao/textos.ts` |
| Menor 3 (comentário do `REVOGAR_…sem_convite`; texto do `NAO_ENCONTRADO` do gerar fora do W10) | próxima tarefa que tocar a matriz em `packages/shared/src/operacao/painel.ts`; `/retro` da A0b |
| Menores 7 e 8 da rodada 1 | como a rodada 1 definiu (próxima tarefa em `Uso.tsx`, `rotas.tsx` ou `convite.repository.ts`; `/retro`) |
| Padrão "a decisão da tarefa não volta para a spec" (causa do maior da rodada 1) | `/retro` da A0b |
| Consumo de IA por escola na tela de Uso; custo de infra em reais | A2; quando houver provedor de hospedagem (D42) |

---

## Rodada 1 — 25/09/2026

**Escopo:** funcionalidade completa
**Commit validado:** `e276ddc35b3156d08aef1a85b697d58eead912f0`
**Veredito: APROVADA COM RESSALVAS**

Commits da funcionalidade: `829ab8d` (1.0), `90ae176` (2.0), `5b2f87a` (3.0), `3064ca0` (4.0), `9d8a11d` (5.0),
`6146a6c` (6.0), `d5b6dab` (7.0), `88b7b6b` (8.0), `77121f7` (9.0), `e276ddc` (10.0), e as correções `b93bdcc`,
`bcc54f0`, `577d185`, `7d495d0`, `fec3309` e `f9bec8c`. Os três commits sem marcador (`770e084`, `e423365`, `a54abb7`)
só tocam `tasks/prd-apresentacao-painel/`: nenhum levou código sem revisor.

### 1. RF a RF

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 | ATENDIDO | `apps/api/src/ops/escola.repository.ts:26-41` (`on conflict do nothing` sem alvo, leitura pelo id); `apps/api/src/ops/escola.ts` (`criarRede`, `criarEscola`, 23503 → `NAO_ENCONTRADO`); `packages/shared/src/operacao/painel.ts:27,36-50`; web: `NovaRede.tsx`, `NovaEscola.tsx` (UUID do pedido ao abrir) | `apps/api/test/painel-escrita.int.test.ts` ("E2: POST /redes…", "POST /escolas: o mesmo…", "E3…", "E4: ids diferentes com o mesmo slug…", "E4, fora de corrida…", "E5…"); `e2e/operacao-escolas.spec.ts` ("clique duplo e resposta perdida…") | Endereço repetido dá `CONFLITO` tipado; os pares em paralelo criam uma só linha e uma só auditoria |
| RF2 | ATENDIDO | `apps/api/src/sessao/convite.service.ts:189-297` (gerar, refazer, revogar sob `travarEscola`, pela matriz de `packages/shared/src/operacao/painel.ts:91-124`); `packages/nucleo/drizzle/0015_convite_pendente_unico.sql`; `apps/web/src/operacao/componentes/DialogoDoConvite.tsx`, `ConfirmarConvite.tsx` | `painel-convite.int.test.ts` (E6 matriz × 3 ações, E8 em paralelo, E9, A2 "o token não está em coluna… token_hash é o SHA-256"); `e2e/operacao-convite-coordenacao.spec.ts` (W1 resumo antes, W3 fechar sem copiar, W4 "recarregar não mostra o link", W2 refazer concorrente) | O par "gerar e refazer em paralelo" do "Como se prova" foi trocado na revisão da spec (rodada 2) e não tem teste próprio; está coberto por construção (sob a trava, o refazer só existe em `pendente`/`vencido`, onde o gerar é `CONFLITO`; E6 e E8). Ver menor 4 |
| RF3 | ATENDIDO | `apps/api/src/operacao/painel.repository.ts:102-193`; `apps/api/src/operacao/painel.service.ts:196-207`; `packages/nucleo/src/convite/estado-da-coordenacao.ts:41-48`; DTO estrito `painel.ts:192-213` | `painel-leitura.int.test.ts` ("I4 e L1…", "I6: … com sentinelas em cada tabela de pessoa…", inclusive 400/404/409/503 e o log); `painel-convite.int.test.ts` ("L4…", "I6 (refazer)…"); `estado-da-coordenacao.test.ts` (A4) | Sentinelas de nome, e-mail, matrícula, complemento, turma e operador ausentes das oito rotas e do log |
| RF4 | ATENDIDO | `painel.repository.ts:200-233`; `painel.service.ts:153-156,210-214`; `apps/web/src/operacao/paginas/Uso.tsx`, `formatos.ts` | `painel-leitura.int.test.ts` ("I5…", L2: "no meio do mês… pico de bytes… hoje não aparece", "no dia 1…", "em 1º de janeiro…", "entre 22h e 23h59…"); `formatos.test.ts` (W5); `e2e/operacao-uso.spec.ts` ("referência…") | |
| RF5 | ATENDIDO | `painel.repository.ts:85-96` (ordem total, desempate por id, 25 por página); `NavegacaoDaLista.tsx`; cartões abaixo de 640 px em `Escolas.tsx` e `Uso.tsx` | `painel-leitura.int.test.ts` ("L3: 30 escolas…"); `e2e/operacao-escolas.spec.ts` e `operacao-uso.spec.ts` (W6, `larguraExcedente` = 0 a 360 px, alvos 44 px) | |
| RF6 | ATENDIDO | `painel.service.ts:140-146` (`autorAtivoNaTransacao`); `apps/api/src/operacao/operador.repository.ts`; contratos `z.strictObject` | `painel-escrita.int.test.ts` ("E1…", "E12…", "E11…"); `painel-convite.int.test.ts` (auditoria com `autor_operador: sessao.apelido` no gerar, revogar, refazer; "E12: o corpo não escolhe o autor nem a escola", sem linha com `outra-pessoa`) | `rede.criada` fica com escola nula, por decisão da Tech Spec (seção 5) |
| RF7 | ATENDIDO | `painel.repository.ts:121,133,200` (três `@SemEscopo` com justificativa) | `apps/api/test/arquitetura.test.ts:96-118` (I1), I2 e a varredura C44 | |
| RF8 | ATENDIDO | `apps/web/src/operacao/paginas/Escolas.tsx`, `Uso.tsx`, diálogos | e2e nos projetos `chromebook` e `celular` (W6, W7 com `violacoesGraves`, W8 teclado, W9, W10) — 226 casos verdes | |

Provas de mutação (árvore restaurada com `git checkout -- <arquivo>` depois de cada uma; `git status` limpo no fim):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| RF3 (isolamento da leitura) | `coordenador.escola_id = e.id` no `exists` do coordenador ativo (`painel.repository.ts:143`) | `painel-convite.int.test.ts` "L4 … para cada estado da E6": `sem_convite: expected 'ativa' to be 'sem_convite'` |
| RF6 (o corpo não escolhe o autor) | `z.strictObject` → `z.object` em `esquemaPedidoCriarEscola` (`packages/shared/src/operacao/painel.ts:45`) | `painel-escrita.int.test.ts` "E12 … corpo com autor…": `expected 201 to be 400` |
| RF2 (concorrência do convite) | `await convites.travarEscola()` em `coordenacaoSobATrava` (`convite.service.ts:164`) | `painel-convite.int.test.ts` "E8 dois gerar com e-mails diferentes": `não aconteceu a tempo: 2 na trava do convite da escola` (o teste confere que as duas chamadas esperam na trava antes de soltar) |

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regra: a escola é controladora; o painel vê existência, ativação e uso, nunca quem está nela (D10) | cumprida | I6 (`painel-leitura.int.test.ts:473`); DTOs estritos |
| Regra: não é cadastro público; os `ops:*` continuam com o mesmo caso de uso (D2) | cumprida | `painel.service.ts:130-131` importa os casos de uso; E11 pelos cinco `ops:*`, E13 |
| Regra: dado sintético (D71) | cumprida | fixtures só nos testes; nenhum seed de escola |
| Regra: contagem não é ranking, nada por professor ou aluno (D45, D64) | cumprida | contrato só com três totais por escola (`painel.ts:192-202`) |
| Borda: fechar o diálogo antes de copiar | coberta | W3 (`operacao-convite-coordenacao.spec.ts:333`) |
| Borda: convite vencido em 72 h | coberta | A4 (um segundo antes e depois), E6 "refazer … vencido", L4 |
| Borda: dois operadores refazem no mesmo segundo | coberta | E8 "dois refazer…", E9, W2 |
| Borda: escola sem uso | coberta | L2 "sem linha, zero"; W1 com as três contagens em zero; e2e "a escola criada pela tela entra no Uso com zero" |
| Borda: professor com duas disciplinas na mesma turma | coberta | L1 (P1 com Química e Física) |
| Borda: aluno transferido ou desativado; turma do ano anterior | coberta | L1 (`comEncerradoEm`, `encerrado`, `desativada`, ano 2025) |
| Borda: escola criada às 22h | coberta | L2 "entre 22h e 23h59 de São Paulo…" |
| Pronto: operador cria rede e escola e copia o convite, que ativa a conta (W1, `chromebook` e `celular`) | cumprido | W1 verde nos dois projetos |
| Pronto: a lista mostra a escola nova com contagens e uso do dia (L1, L2, L4) | cumprido | verdes; "uso do dia" é o do último dia fechado, como o RF4 define |
| Pronto: nenhuma resposta do painel traz pessoa (I6) | cumprido | I6 com 200/201/204/400/404/409/503 e o log |
| Pronto: toda ação na auditoria da escola com o operador (E1, E6, A1) | cumprido | E1, E6, A1 conferem `autor_operador` |
| Pronto: as travas aguentam as corridas (E2, E4, E8, E9, E11, E15) | cumprido | todos verdes; mutação 3 |
| Pronto: cada cenário de `cenarios.md` tem o seu teste, citado pelo identificador | cumprido | I1–I7, E1–E16, L1–L4, A1–A4, W1–W10 citados nos títulos dos testes |
| Pronto: pendências da A0 com destino | cumprido | 9.0 e 10.0, com a tabela de destino em `9_task.md:115-140`; a métrica de tempo ficou decidida na Tech Spec, seção 13 |
| "Pronto quando" do `ROADMAP.md` (A0b) | cumprido | os quatro itens acima |

### 3. Portão

Rodado na árvore limpa, em `e276ddc`. O `node_modules` estava em dia com o `package-lock.json`: não foi preciso `npm ci`.

| Portão | Resultado |
|---|---|
| `npm run typecheck` | ✅ |
| `npm run lint` | ✅ |
| `npm run test` | ✅ (183 arquivos, 2218 testes) |
| `npm run test:e2e` | ✅ (226 passaram, `chromebook` e `celular`) |
| `npm run test:infra` | ✅ (5 arquivos, 36 testes; a funcionalidade mexe em métricas, `infra/grafana` e `infra/scripts`) |
| Esteira do GitHub no commit validado | ✅ (execução 36153618613, `e276ddc`: verificar, integração, e2e e infra verdes) |
| Revisões com veto registradas e aprovadas | ✅ (as dez tarefas com `test-engineer`, `revisor-geral` e todos os guardiões marcados, última rodada APROVADO; `revisao-spec.md` rodada 6 APROVADA) |

A esteira do `829ab8d` (1.0) ficou vermelha; a 2.0 só foi commitada depois das correções `b93bdcc` e `bcc54f0`, ambas
verdes.

### 4. Achados

**Críticos**
- nenhum

**Maiores**
- **A Tech Spec e os cenários ficaram para trás do código em seis pontos**, todos decididos e registrados só no
  `N_task.md` (e aprovados pelos revisores da tarefa), sem voltar para a spec, cuja lista de cenários se diz fechada
  ("mudar exige revisar a spec", `cenarios.md:4`):
  - `cenarios.md:161` (W10): o 401 diz "Sua sessão terminou. Entre de novo."; a tela mostra "…Entre de novo para
    continuar." (`6_task.md:75-77`);
  - `cenarios.md:157-158` (W10): o `CONFLITO` depois de uma tentativa incerta mostra "confira a lista", texto que a spec não
    tem (`6_task.md:90-99`);
  - `cenarios.md:69-70` (E9): "pelo índice (23505 vira `CONFLITO`)"; quem segura é o `update` condicional
    (`techspec.md` seção 7c já diz isso; o `revisor-geral` da 3.0 pediu o acerto);
  - `techspec.md:74` (matriz): `sem_convite` × revogar dá `CONFLITO`, mas o código responde `NAO_ENCONTRADO`, porque o
    id não acha convite de coordenação (`convite.service.ts:282-283`);
  - `techspec.md:137` (seção 7): "`docs/lgpd.md` não muda"; ele mudou em `docs/lgpd.md:72` e `:78` (7.0 e 9.0);
  - `techspec.md:209` (seção 11): diz que o desvio da regra 10, item 9 está registrado em `docs/modelo-de-dados.md`
    ("Operação Turmma"); lá não há `PainelRepository` nem as exceções `@SemEscopo` (só em `docs/arquitetura.md:44-50`).
  Correção: um `/corrigir` só de documento que leve cada ponto para `techspec.md` e `cenarios.md` e acrescente o painel à
  seção "Operação Turmma" de `docs/modelo-de-dados.md`. Não bloqueia a A1, mas precisa estar feito antes do `/retro`,
  para a spec voltar a ser a fonte.

**Menores**
1. `README.md:64`: o `ops:escola` "é o único caminho de criação"; o painel também cria. Correção: "cria pelo comando; o
   painel da operação usa o mesmo caso de uso".
2. `docs/lgpd.md`: duas recomendações do `privacy-guardian` sem destino — registrar que o painel da operação vê por
   escola só contagens do ano em curso e uso de infra (5.0), e citar o `rl:ip:op` no parágrafo "IP só em memória"
   (`docs/lgpd.md:84-94`, 9.0).
3. `docs/interface.md:324-325`: a seção 5a lista só "convite pendente, ativa"; os estados são sete. Correção: remeter aos
   textos do W10.
4. PRD RF2, "Como se prova": "gerar e refazer em paralelo" foi trocado na revisão da spec (rodada 2) e não tem teste
   paralelo; o PRD não registra a troca. Coberto por construção (matriz sob a trava). Correção: nota no PRD ou um caso a
   mais na E8.
5. `docs/modelo-de-dados.md:25-26`: não diz que o comando também sorteia o id (v4), como a Tech Spec, seção 5.
6. `techspec.md:25`: "duas migrations de índice"; a funcionalidade tem três (a `0017` amplia checks da operação).
7. Recomendações de revisor sem destino: `revisor-geral` da 8.0, o `VazioDoUso` (`Uso.tsx:114`) repete o
   `EstadoVazio`; `frontend-reviewer` da 8.0, número longo pode quebrar no meio entre 640 e ~760 px (`Uso.tsx:75`,
   `wrap-anywhere`); `test-engineer` da 10.0, o `componentWillUnmount` da fronteira de erro (`apps/web/src/rotas.tsx:53`)
   sem teste; `tenancy-guardian` da 3.0, `tipo = 'coordenador'` também no `where` de `revogarParaRefazer`, como defesa em
   profundidade.
8. A prova de mutação da trava (mutação 3) pega pela pré-condição do teste (as chamadas não aparecem esperando na trava),
   não pelo resultado (dois convites em aberto). É suficiente como sinal, mas um caso sem a espera, que conte os
   convites em aberto, provaria a regra pelo efeito.

**Positivos**
- A matriz estado × ação num lugar só (`@educa/shared`), lida pelo servidor e pela tela: o que a tela mostra não diverge do que o servidor aceita.
- I6 com sentinela em cada tabela de pessoa, nas oito rotas e em todos os códigos de erro, inclusive o 503 e o log: é o modelo de teste de "não vaza" para as próximas.
- Gatilho de parada só no banco de teste (`gatilho-de-parada.ts`) para forçar as duas ordens das corridas, sem gancho no código de produção.
- A tabela de destino das pendências herdadas (`9_task.md:115-140`), linha a linha, fechou a retro da A0 sem deixar nada solto.

### 5. Conclusão

Os oito RF estão atendidos com código e teste que pega a remoção da regra (três mutações, todas vermelhas), o critério
de pronto e o "Pronto quando" do roteiro estão cumpridos, e o portão e a esteira do `e276ddc` estão verdes. Não há
crítico. Fica um maior: a Tech Spec e os cenários não acompanharam seis decisões tomadas nas tarefas, e o documento que
a seção 11 aponta como registro do desvio da regra 10, item 9 não o tem. O caminho até APROVADA é um `/corrigir` de
documento com os seis pontos do maior e os menores 1 a 3, sem mexer em código.

### 6. Pendências herdadas

| Pendência | Destino |
|---|---|
| O maior (spec e cenários atrás do código; `docs/modelo-de-dados.md` sem o painel) | `/corrigir` de documento antes do `/retro` da A0b |
| Menores 1 a 6 (README, `docs/lgpd.md`, `docs/interface.md`, PRD, `techspec.md`) | o mesmo `/corrigir` |
| Menor 7 (recomendações de revisor da 3.0, 8.0 e 10.0) | próxima tarefa que mexer em `Uso.tsx`, `rotas.tsx` ou `convite.repository.ts`; registrar no `/retro` |
| Menor 8 (mutação da trava pelo efeito) | `/retro` da A0b, como padrão de teste de trava |
| Consumo de IA por escola na tela de Uso | A2 (PRD, seção 3) |
| Custo de infra em reais | quando houver provedor de hospedagem (D42) |
