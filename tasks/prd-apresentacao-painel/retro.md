# Retrospectiva — apresentacao-painel (A0b)

25/09/2026. Comparação com a retrospectiva da A0 (`tasks/prd-apresentacao-operacao/retro.md`).

## Medidas

```
Tarefas: 10 · Rodadas de revisor: 75 · Reprovações: 11 (14,7%)
Por revisor: test-engineer 24/7 · revisor-geral 14/1 · privacy-guardian 13/0 · tenancy-guardian 8/0
             infra-guardian 8/0 · frontend-reviewer 8/3 (AJUSTES NECESSÁRIOS)
Rodadas por tarefa: média 7,5, pior 4.0 com 13
Rodadas que caducaram sem reprovação: 18 de 75 (24%) — 12 delas por ajustes do frontend-reviewer
                                      aplicados com os outros revisores já aprovados (4.0, 6.0, 7.0)
Correções fora de tarefa: 7 — duas eram defeito de produção que apareceu como intermitência: a
                          transação do Drizzle que prendia a conexão com o banco travado, e a
                          consolidação de uso que parava para todas as escolas numa escola inexistente
Duração: 24 h · mediana 2,25 h por tarefa
Revisão da spec: 18 rodadas, 9 não aprovadas
Ressalvas do /validar: rodada 1 (0 críticos, 1 maior, 8 menores) · rodada 2 APROVADA
```

| | A0 | A0b |
|---|---|---|
| Reprovações nas tarefas | 11,7% | 14,7% |
| Rodadas por tarefa | 5,5 | 7,5 |
| Caducadas sem reprovação | 10% | 24% |
| Revisão da spec, não aprovadas | 17 de 22 | 9 de 18 |
| Mediana por tarefa | 1,3 h | 2,25 h |

A spec melhorou; as tarefas pioraram. A revisão da spec caiu de 17 para 9 rodadas não aprovadas, e
nenhuma reprovação de tarefa foi por trava ou limite de taxa, que era a maior causa da spec da A0. O
custo voltou para as tarefas: mais rodadas, o dobro de caducadas, e quase o dobro da mediana.

## As propostas da A0, uma por uma

| Proposta da A0 | Resultado | Evidência |
|---|---|---|
| 1. Divergência que muda comportamento ganha cenário e a pergunta do guardião antes do código | **falhou** | a divergência seguiu entrando sem ir para a spec: o maior do `/validar` foram seis decisões de tarefa só no `N_task.md` |
| 2. "Qual peça que já existe faz isto?" | **funcionou** | uma recomendação de peça refeita (o `VazioDoUso` da 8.0 copiando o `EstadoVazio`), contra quatro na A0 |
| 3. Linha de recomeço da tela | **em parte** | nenhuma reprovação por segunda pessoa ou mesma entrada; quatro achados no caso que a linha não citava — a falha ou a recarga com o diálogo aberto |
| 4. Linha "log novo" | **funcionou** | nenhuma recomendação de log sem teste do conteúdo |
| 5. Seção 7c da Tech Spec (travas e limite por rota) | **em parte** | a spec respondeu trava e limite no primeiro texto; na tarefa, cláusulas da trava ainda ficaram sem teste (4.0, 5.0) |
| 6. Coluna "Documento que registra o desvio" na seção 11 | **falhou** | o documento que a seção 11 apontava não acompanhou o código: `docs/modelo-de-dados.md` sem o painel, W10 e E9 atrás do código |

**O "tire cada regra" não reduziu as reprovações.** O orquestrador mandou, em todo prompt de tarefa,
apagar cada regra da tabela de testes e ver o teste ficar vermelho. Isso foi feito, e as reprovações
do `test-engineer` subiram de 3 para 7. Elas migraram: todas as seis por cláusula sem teste foram numa
cláusula **fora** da tabela — o ramo de permissão novo da 4.0, a chave da ordem `uso` da 5.0, a
largura dentro do diálogo e o endereço longo da 6.0, o segundo Esc da 7.0, o "alvo sem total" da 9.0.
Quem conferia a lista conferia a lista; o diff tinha mais do que ela.

## Grupos de causa

| Causa | Ocorrências | Tarefas | Onde evitar |
|---|---|---|---|
| Cláusula nova sem teste, fora da tabela de testes | 6 reprovações | 4.0, 5.0, 6.0 (2), 7.0, 9.0 | autoconferência (mutação rodada, não imaginada) |
| Decisão de tarefa que não volta para a Tech Spec e os cenários | 6 pontos do maior do `/validar`, e a seção 11 | 2.0, 3.0, 4.0, 7.0, `/validar` | autoconferência e `revisor-geral` |
| Ajuste do `frontend-reviewer` caducando quem aprovou em paralelo | 12 rodadas caducadas | 4.0, 6.0, 7.0 | ordem dos revisores |
| Tela que não recomeça depois de falha ou recarga | 4 (3 AJUSTES e 1 reprovação) | 4.0, 6.0, 7.0, 10.0 | `N_task.md` |
| Recomendação barata adiada para não caducar aprovação | 9 ou mais | 1.0, 4.0, 6.0, 7.0, 8.0, 10.0 | `executar-task` e hook |
| Teste que depende do banco acumulado ou da ordem do id | 3 correções e 4 recriações do volume à mão | correções de 24 e 25/09 | regra 40 e portão local |

**Recomendação adiada.** O caso que mostra o custo: o comentário de
`packages/shared/src/operacao/eu.ts` dizia que os checks do banco "são gerados desta expressão".
Não eram. Quatro revisores apontaram na 1.0 (tenancy, privacy, revisor-geral e o índice inteiro), e
ele ficou, porque corrigir um comentário caducava todas as aprovações. A regra do módulo mora no
comentário neste repositório (autoconferência, desde o F1), e um comentário falso ficou em produção
por uma regra de processo.

**Banco acumulado.** O banco de teste da máquina chega a milhares de escolas de execuções anteriores; a
esteira começa vazia. Três testes passaram num e falharam no outro: a lista global percorrida inteira,
e a ordem suposta de um id v4 (`2026-09-24-escola-da-bancada-fora-de-ordem`,
`2026-09-25-l4-depende-do-tamanho-do-banco`). O volume foi recriado à mão quatro vezes durante a A0b.

## Falsos positivos

Nenhum. As três AJUSTES do `frontend-reviewer` eram reais; o custo delas foi a ordem, não o conteúdo.

## Propostas

1. **Cláusula sem mutação** — 6 ocorrências (4.0, 5.0, 6.0 ×2, 7.0, 9.0). Onde evitar: autoconferência.
   `.claude/skills/executar-task/SKILL.md`, passo 2: o primeiro item vira "Rode a mutação, não só
   imagine", com a lista de cláusulas do diff (inclusive fora da tabela e as cópias da regra em outro
   arquivo), apagar, rodar, ver vermelho, restaurar, e a seção "Mutações" do `N_task.md`.
   `.claude/skills/criar-tasks/task-template.md`: seção "Mutações". `.claude/agents/test-engineer.md`,
   item 1: conferir a seção contra o diff. Efeito esperado: as seis reprovações por cláusula fora da
   lista.
2. **Spec atrás do código** — 6 pontos do maior do `/validar` e a seção 11. Onde evitar: autoconferência
   e `revisor-geral`. `executar-task`, bloco `<critical>` do passo 2: a divergência entra na
   `techspec.md`, no `cenarios.md` e no documento da seção 11 **antes dos revisores**, e editar `.md` não
   caduca rodada nem carimbo — com a exceção exata do `docs/runbook.md`, que a guarda
   `alerta-tem-runbook` lê e que o hook trata como código (`DOCUMENTO_QUE_UMA_SUITE_LE`). Conferido em
   `tools/processo/revisoes.ts`: `tasks/` e todo `.md` fora o runbook saem de `alteracoesDeCodigo`.
   `.claude/agents/revisor-geral.md`, §2: divergência só no `N_task.md` é bloqueante. Efeito esperado:
   o `/validar` não acha spec atrás do código.
3. **Ajustes do frontend caducam a rodada em paralelo** — 12 rodadas (4.0, 6.0, 7.0). Onde evitar: ordem
   dos revisores. `executar-task`, "Ordem" do passo 5: tarefa com tela roda o `frontend-reviewer`
   sozinho depois do `test-engineer`, e os outros só depois dele sem ajustes.
   `.claude/skills/executar-tasks/SKILL.md`: o prompt modelo diz a mesma ordem. Efeito esperado: das 18
   caducadas, as 12 do frontend.
4. **Tela depois de falha ou recarga** — 4 ocorrências (4.0, 6.0, 7.0, 10.0). Onde evitar: `N_task.md`.
   `task-template.md`: a linha de recomeço vale para tarefa que cria ou altera tela com sessão, link ou
   formulário, e leva os quatro casos — o quarto é a lista recarregada ou a falha com o diálogo aberto —
   ou diz por que um não se aplica. Efeito esperado: os quatro achados do quarto caso.
5. **Recomendação adiada** — 9 ou mais. Onde evitar: `executar-task` e hook. `executar-task`,
   "Reprovação e caducidade": recomendação barata se aplica também depois de aprovação, em lote, com
   todos os revisores terminados, e rodada nova só de quem o hook apontar; a que não for aplicada vai
   para "Recomendações sem aplicar" no `N_task.md`, com destino. "Anularia as aprovações" não é motivo.
   `task-template.md`: seção "Recomendações sem aplicar". `tools/processo/revisoes.ts`: mudança só de
   comentário num `.ts`/`.tsx` caduca só o `revisor-geral`, salvo comentário com diretiva. O pedido
   era também não invalidar o carimbo; isso não entrou (seção seguinte). Efeito esperado: o
   comentário falso de `eu.ts` sai na tarefa que o criou, sem custar as aprovações dos guardiões.
6. **Teste que depende do banco acumulado ou da ordem do id** — 3 correções e 4 recriações do volume.
   Onde evitar: regra 40 e portão local. `.claude/rules/40-testes.md`, casos de borda: o banco com
   milhares de escolas de outras execuções. `tools/ci/compose.ts` (`comandosDaSubidaDeTeste`) e
   `tools/testes/integracao.setup.ts`: com `EDUCA_BANCO_NOVO=1`, `down --volumes --remove-orphans` do
   projeto de teste antes do `up --wait`, o mesmo `down` do fim do job da esteira.
   `tools/processo/portao-local.ts`: define a variável só para a suíte `test`. Efeito esperado: o que
   passa no portão local passa na esteira, e ninguém recria volume à mão.

**Aceitas: todas** (o usuário delegou a escolha ao orquestrador em 25/09/2026).

### Como ficou o hook (proposta 5)

- O conteúdo sem comentários vem do **parser** do TypeScript, não do scanner sozinho nem de regex. O
  scanner não sabe o contexto e lê como comentário o `//` de uma expressão regular (`/[//]/`) e o de
  um texto de JSX (`<a>http://x</a>`), e isso faria uma mudança de código passar por comentário. A
  impressão é a árvore com o tipo de cada nó e o texto de cada token; o texto entre tokens é trivia e
  sai, espaço junto. Com o tipo do nó, `return x` e `return\nx` não saem iguais.
- A trivia que tem `@ts-`, `eslint`, `/// <reference`, `@jsx`, `#!` ou `@vitest-` fica na impressão
  inteira, e aí tudo caduca como antes. As duas marcas a mais que as pedidas: `eslint` sem hífen pega o
  comentário de configuração (`/* eslint regra: off */`), e `@vitest-` pega o ambiente do teste — o
  próprio Vitest leu a diretiva escrita no teste do hook e tentou carregar o `jsdom`.
- O hash sem comentários vai numa chave par (`<chave>|sem-comentarios`) em `.processo/conteudo.json`.
  O instantâneo gravado antes da mudança não tem o par, e cai na leitura restrita.
- `.js`, `.mjs` e arquivo com erro de sintaxe ficam de fora, e também tudo quando o compilador não
  está instalado (clone antes do `npm ci`): toda mudança neles conta.
- **O carimbo não ganhou a exceção.** O pedido era "caduca só o `revisor-geral` e não invalida o
  carimbo". O `test-engineer` reprovou a segunda metade, com prova: comentário muda o resultado das
  suítes neste repositório. O `no-irregular-whitespace` do lint olha comentário (um espaço não
  separável num comentário em português dá erro), e vários testes varrem o texto cru do fonte
  (`tools/guardas/guardas.test.ts` procura a palavra `mockups`; `arquitetura.test.ts`,
  `escola.repository.test.ts` e `porta-unica.test.ts` procuram nomes de módulo). Com a exceção, o hook
  aceitaria um commit que o portão nunca viu verde. O carimbo segue estrito, e o custo de corrigir um
  comentário depois das aprovações é rodar o portão e uma rodada do `revisor-geral`, não mais a de
  todos os guardiões.
- Testes em `tools/processo/revisoes.test.ts`, "mudança só de comentário", mais o `conferir` e o
  `--e2e --infra` no caso que roda o `portao-local.ts` como processo. Cada cláusula nova foi apagada e
  ficou vermelha (22 mutações).

### Quanto o portão ficou mais lento (proposta 6)

Medido com um arquivo de integração só, três vezes cada: a subida do `globalSetup` leva 1,6 s
reaproveitando o que está de pé e 9,3 s do zero (derrubar com volumes, subir e migrar o banco vazio).
São **cerca de 8 s a mais** por portão. O `test:e2e` seguinte também cria de novo a API e o worker
que o `--manter-ambiente` da execução anterior deixava de pé; isso não foi medido à parte, e o e2e já
reconstrói as imagens com `--build` em toda execução. O portão completo do zero, rodado nesta
retrospectiva, ficou verde em 34 min (typecheck e lint 1 min, `test` 8 min com 2.240 testes, `test:e2e`
5 min com 226, `test:infra` 20,6 min com 36): o acréscimo é menos de 1% dele.

### Revisões desta retrospectiva

- `test-engineer`: 1ª REPROVADO (o carimbo com a exceção de comentário, e o e2e e o infra sem teste de
  que não recebem a variável), 2ª APROVADO, 3ª APROVADO (o lote das duas recomendações da 2ª), 4ª
  APROVADO. A 4ª veio do portão completo: o caso do `conferir` gravava o comentário `// ver mockups/`,
  e a guarda "nada fora de mockups/ aponta para o protótipo" ficou vermelha — a mesma que a 1ª rodada
  citou para derrubar a exceção do carimbo, e a prova de que ela estava certa.
- `infra-guardian`: 1ª APROVADO. Das recomendações, entraram a diferença entre o banco do `test` e o do
  e2e e do infra na regra 40, e a linha do `executar-task` que proíbe usar o banco de teste enquanto o
  `test` do portão roda. Não entraram: o teste que conferiria que o `integracao.setup.ts` chama
  `comandosDaSubidaDeTeste` (recusada: seria asserção sobre o texto do arquivo, que a regra 40 não
  aceita, e o portão completo do zero prova o caminho de verdade) e o teste para o `parseDiagnostics`
  sumir numa versão nova do compilador (já coberta: todo caso de `impressaoSemComentarios` quebra se o
  campo sumir, e o do erro de sintaxe prova que ele é lido).

## O que tirar

Nada. Todo item do checklist pegou alguma coisa nesta funcionalidade ou na A0, e as regras 10, 20 e 70
não se afrouxam por retrospectiva. O "tire cada regra" do prompt do orquestrador não sai: a proposta 1
o estende ao diff inteiro, em vez de trocá-lo.

## Pendências de código

As recomendações de revisor da A0b que ficaram sem aplicar, e os menores do `/validar` com destino em
código (`validacao.md`, tabela de destinos), vão para um `/corrigir` e para o `TODO.md` logo depois
desta retrospectiva. Entre elas o comentário falso de `packages/shared/src/operacao/eu.ts`, que a
proposta 5 passa a deixar corrigir sem custar as aprovações.
