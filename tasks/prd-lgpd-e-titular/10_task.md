# Tarefa 10.0 — A coordenação vê o aviso de incidente e confirma o recebimento

**Funcionalidade:** lgpd-e-titular · **Depende de:** 6.0, 9.0 · **Paralelo com:** 11.0 a 15.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A casca da coordenação mostra o diálogo do incidente pendente, com "Ver depois" e faixa fixa, e a aba Incidentes lista e confirma.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seção 9 ("Aviso de incidente")
- `docs/interface.md` 11.1 (Sair a um toque)
- D59
- Código: a casca da coordenação e o `DialogoDeConfirmacao` da A1
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [x] 10.1 — Diálogo na casca, uma leitura por sessão
- [x] 10.2 — Faixa fixa até a confirmação
- [x] 10.3 — Aba Incidentes
- [x] 10.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| casca e componentes de incidente na web | novo/alterado |
| aba Incidentes | novo |
| e2e | novo |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| teclado e 360 px | e2e | confirma só com teclado; rolagem dentro do diálogo; Sair alcançável |
| Ver depois | e2e | deixa a faixa; novo login traz o diálogo de volta |
| duas coordenadoras | e2e | confirmado por uma, some para a outra |
| dois incidentes | e2e | os dois pendentes aparecem |
| estados | e2e | quatro estados da aba, `chromebook` e `celular`, acessibilidade |

## Como testar

- **teclado e 360 px:** `e2e/pedidos.spec.ts › sem rolagem horizontal, também no diálogo…` (`larguraExcedenteDoDialogo`, `focoVisivel`); o Sair em `e2e/casca.spec.ts › W12: abaixo de 768 px, a barra do topo com o "Sair" a um toque…`.
- **Ver depois:** sair e entrar como em `e2e/privacidade.spec.ts › a segunda pessoa na mesma aba…`. Armadilha da 6.0: `entrarComoCoordenacaoNaMesmaAba` já gasta dois passos do segundo fator; o login seguinte só aceita o código depois da virada de 30 s, como em `› a troca de escola não mostra a retenção da escola anterior…` (`codigoDoAutenticador`).
- **duas coordenadoras:** `criarCoordenadoraNaEscola` (`e2e/__fixtures__/sessao.ts`) e a função local `outroNavegador`, de `e2e/escola-montada.spec.ts`.
- **estados:** `e2e/governanca.spec.ts › os quatro estados…` (`portao`, `page.route`, `violacoesGraves`).
- Semeie o incidente no banco, como `ajustarRetencaoDaEscola`. Dois incidentes: sem precedente.
- Rodar: `node tools/ci/e2e.ts --manter-ambiente e2e/<arquivo>.spec.ts`; depois, `npx playwright test e2e/<arquivo>.spec.ts`.
- **Telas** (`coordenacao`, sem mockup): o diálogo, em `/coordenacao/governanca`; a faixa, com `--clicar 'text=Ver depois'`; a aba, em `/coordenacao/privacidade/<id da aba nova>`. A vitrine não tem incidente: semeie um na escola cheia (`escola.id` de `.processo/vitrine.json`), ou a foto sai vazia. Se o diálogo não voltar, apague `.processo/vitrine/sessao-coordenacao.json`: a foto guarda a sessão.

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --e2e)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O registro do incidente (9.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|
| O aviso mora na área da coordenação (`areas/coordenacao/rotas.tsx`, por `import()`), e não na `CascaDaEscola` | a casca é dos três papéis: a leitura e o diálogo de um papel só nela inflariam a entrada que o aluno baixa às 7h30 (teto de 150 kB) e pediriam um `if` de papel; a área só monta para a coordenação | `techspec.md` §5 ("Incidente") e §9 ("Aviso de incidente", "como ficou no código") |
| O diálogo mostra um aviso por vez, com a frase da fila ("N avisos esperam a sua confirmação. Este é o primeiro."), e não todos juntos | com dois avisos, um diálogo só teria seis campos de texto longo duas vezes e dois "Confirmo que recebi" sem nome que os distinga; a faixa e a aba contam e mostram todos | `techspec.md` §9; `cenarios.md`, "Tarefa 10.0, onde cada um está" (`› dois incidentes…`, duas vezes) |
| A faixa ganhou o botão "Ver o aviso" (a Tech Spec só dizia "faixa fixa") | sem ele, quem deixou para depois só reabriria o aviso saindo e entrando; a faixa continua sem botão de fechar | `techspec.md` §9; `docs/interface.md` 3 (Privacidade) |
| A aba Incidentes sempre relê ao abrir (`refetchOnMount: 'always'`) | o aviso lê uma vez por sessão; sem a releitura, a faixa da segunda coordenadora não saberia que a primeira confirmou | `techspec.md` §9 ("Incidentes"); `cenarios.md` (`› duas coordenadoras…`) |

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|
| `AvisoDeIncidente.tsx` › `AvisoDeIncidente` › `staleTime: Infinity` | `e2e/incidentes.spec.ts` › `"Ver depois" e o Esc…` (leituras 2, esperava 1, depois de avançar o relógio e voltar à aba) |
| `AvisoDeIncidente.tsx` › `AvisoDeIncidente` › `filter((incidente) => incidente.confirmadoEm === null)` (trocado por `true`) | `e2e/incidentes.spec.ts` › `o aviso traz todos os campos…` (a frase "avisos esperam" com o já confirmado na fila); e `duas coordenadoras…` (o diálogo não fecha) |
| `AvisoDeIncidente.tsx` › `useEffect` › `comeco.focus({ preventScroll: true })` (trocado por `focus()` com rolagem, mantendo o `scrollTo`) | **nenhum ficou vermelho** (20 de 20 verdes): o `scrollTo` seguinte já devolve o diálogo ao topo, e o foco no texto continua provado por `e2e/incidentes.spec.ts › dois incidentes no diálogo…`. Fica porque evita o salto visível da rolagem antes do `scrollTo`; a prova do título à vista é a linha do `scrollTo` |
| `AvisoDeIncidente.tsx` › `useEffect` › `comeco.closest('dialog')?.scrollTo({ top: 0 })` | `e2e/incidentes.spec.ts` › `o aviso traz todos os campos…` e `dois incidentes no diálogo…` (título e frase fora da janela) |
| `AvisoDeIncidente.tsx` › `useEffect` › `adiado` na lista de dependências `[idDoAtual, adiado]` (tirado) | `e2e/incidentes.spec.ts › "Ver depois" e o Esc…`, nos dois projetos (`chromebook` e `celular`): o título fora da janela depois de "Ver o aviso" (`toBeInViewport`, razão 0) |
| `AvisoDeIncidente.tsx` › `useEffect` › as duas linhas voltando ao `focus()` com rolagem | `e2e/incidentes.spec.ts` › `o aviso traz todos os campos…` e `dois incidentes no diálogo…` (título e frase fora da janela) |
| `AvisoDeIncidente.tsx` › JSX › o botão "Ver depois" com `style={{ minHeight: 0, paddingBlock: 0 }}` (a classe `h-8` da ordem não muda nada: o `min-h-11` do botão vence, e `tamanho="compacto"` também fica com 44 px) | `e2e/incidentes.spec.ts › o aviso traz todos os campos…` no `celular` (26 px, esperava 44). No `chromebook` fica verde: a linha de botões estica os dois à mesma altura, e só no celular, onde eles quebram de linha, a altura própria de cada um aparece |
| `DetalhesDoIncidente.tsx` › as linhas das duas datas, com os valores trocados | `e2e/incidentes.spec.ts` › `o aviso traz todos os campos…` (a data de hoje no rótulo "Quando a Turmma soube") |
| `AvisoDeIncidente.tsx` › `useEffect` › `if (adiado && focarAFaixa.current) botaoDaFaixa.current?.focus()` | `e2e/incidentes.spec.ts` › `"Ver depois" e o Esc…` ("Ver o aviso" sem o foco) |
| `AvisoDeIncidente.tsx` › JSX › `falha?.id === atual.id ? falha.texto : ''` | `e2e/incidentes.spec.ts` › `o clique duplo…` (o alerta de falha não aparece no diálogo) |
| `confirmar-o-incidente.ts` › `confirmar` › `if (noAr.current) return Promise.resolve(false)` | `e2e/incidentes.spec.ts` › `o clique duplo…` (2 confirmações, esperava 1) |
| `confirmar-o-incidente.ts` › `mutationFn` › `await relerIncidentes(cliente)` | `e2e/incidentes.spec.ts` › `o clique duplo…` (sem a releitura segurada, o botão volta antes da lista nova) |
| `Incidentes.tsx` › `Incidentes` › `refetchOnMount: 'always'` | `e2e/incidentes.spec.ts` › `duas coordenadoras: quem chega depois…` (o cartão da segunda continua esperando) |
| `Incidentes.tsx` › `CartaoDoIncidente` › `falha?.id === incidente.id ? falha.texto : ''` | `e2e/incidentes.spec.ts` › `a falha da confirmação aparece só no cartão…` (alerta também no cartão do outro) |
| `Incidentes.tsx` › `CartaoDoIncidente` › `disabled={confirmando !== undefined}` (trocado por `esteConfirmando`) | `e2e/incidentes.spec.ts` › `a falha da confirmação aparece só no cartão…` (botão do outro cartão habilitado) |
| `Incidentes.tsx` › `CartaoDoIncidente` › `if (confirmou) titulo.current?.focus()` | `e2e/incidentes.spec.ts` › `"Ver depois" e o Esc…` (o título do cartão sem o foco depois de confirmar) |
| `DetalhesDoIncidente.tsx` › `dd` › classe `whitespace-pre-line` | `e2e/incidentes.spec.ts` › `o aviso traz todos os campos…` (`white-space` `normal`, esperava `pre-line`) |
| `DetalhesDoIncidente.tsx` › `dd` › classe `break-words` | `e2e/incidentes.spec.ts` › `o aviso traz todos os campos…` (`larguraExcedenteDoDialogo` 931, com a palavra de 120 letras) |
| `textos-dos-incidentes.ts` › `textoDaFaixa` › `pendentes === 1` | `textos-dos-incidentes.test.ts` › `textoDaFaixa…` |
| `textos-dos-incidentes.ts` › `textoDaFila` › `pendentes > 1` | `textos-dos-incidentes.test.ts` › `textoDaFila…` |
| `textos-dos-incidentes.ts` › `textoDaConfirmacao` › `confirmadoEm === null` | `textos-dos-incidentes.test.ts` › `textoDaConfirmacao…` |
| `textos-dos-incidentes.ts` › `RISCOS` e `textoDosTitulares` (texto de um risco; singular) | `textos-dos-incidentes.test.ts` › `textoDoRisco…` e `textoDosTitulares…` |
| `textos-dos-incidentes.ts` › `textoDoAviso` (lendo `conhecidoEm`) | `textos-dos-incidentes.test.ts` › `as datas do aviso…` |
| `api/privacidade.ts` › `confirmarIncidente` › `corpo: {}` (sem corpo, a API recusa: o `esquemaPedidoSemCorpo` é um objeto estrito) | `e2e/incidentes.spec.ts` › todos os que confirmam (14 de 20 vermelhos) |
| `Privacidade.tsx` › o ramo `aba === 'incidentes' ? <Incidentes />` | `e2e/incidentes.spec.ts` › os que abrem a aba (10 de 20 vermelhos: caem em Retenção) |
| `rotas.tsx` › `RotasDaCoordenacao` › `<AvisoDeIncidente />` | `e2e/incidentes.spec.ts` › todos (20 de 20 vermelhos) |

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | `focus({ preventScroll: true })` para o título abrir à vista | Aplicada, no item 1 da ordem da 1ª rodada (feita no efeito da tarefa, e não no `Dialogo` compartilhado) |
| frontend-reviewer (1ª) | Se a leitura do aviso falhar, a coordenação não vê nada: mostrar uma faixa discreta "Não foi possível conferir os avisos de incidente. Abra Privacidade › Incidentes" | `TODO.md`: muda o comportamento da tela e o texto fica a decidir com o Gabriel; a aba já tem o erro com "Tentar de novo" |
| frontend-reviewer (1ª) | Rodapé de ação fixo no diálogo com texto muito longo | Recusada: o foco por teclado já traz "Confirmo que recebi" à vista (`toBeInViewport`, `e2e/incidentes.spec.ts`), e a rolagem fica dentro do diálogo; um rodapé fixo muda o `Dialogo` de todas as áreas |
| test-engineer (1ª), revisor-geral (1ª) | e2e da troca de escola com o aviso pendente na segunda (a Tech Spec §9 e o comentário de `AvisoDeIncidente.tsx` dizem que ela desfaz o adiamento) | `TODO.md`: o caso pede duas escolas e o segundo fator de novo, mais de um minuto de relógio, como `e2e/privacidade.spec.ts › a troca de escola não mostra a retenção…`; o reset do cache na troca já é provado ali, com a retenção (`main.tsx`) |
| test-engineer (1ª) | e2e de um professor da mesma escola, com incidente pendente, sem aviso, sem faixa e sem a leitura da lista | `TODO.md`: hoje é estrutural (a área só monta para a coordenação, e a API recusa pelo papel: `apps/api/test/incidente.int.test.ts`, 9.0); vale se alguém mover o aviso para a `CascaDaEscola` |
| test-engineer (1ª) | Trocar as verificações imediatas de `incidentes.spec.ts` por `expect.poll` | Recusada: o próprio revisor diz que outros pontos do teste já cobrem os dois casos (a confirmação por `toBe(2)` no fim, o Enter pelas linhas vizinhas) |
| privacy-guardian (1ª) | O texto "Ficam registrados quem confirmou e quando" promete um "quem" que a coordenação não lê em tela nenhuma | `TODO.md`: dizer onde ele aparece quando a tela de auditoria da escola existir |
| privacy-guardian (1ª) | Se a semente da vitrine virar script em `tools/vitrine/`, manter texto inventado | `TODO.md`, junto de quem criar o script |
| revisor-geral (2ª) | Ficar só com o `scrollTo` e tirar o `preventScroll: true`, que nenhuma mutação prova | Recusada: o `preventScroll` evita o salto visível antes do `scrollTo`, a Mutações já diz que nenhum teste o prova, e mexer em `apps/web` agora caduca os quatro revisores por uma linha cosmética |
| revisor-geral (1ª) | O ternário de `Privacidade.tsx` vai ganhar o terceiro ramo (Pedidos) na 16.0: trocar por um mapa de aba para componente | Tarefa 16.0, que acrescenta o ramo e toca o arquivo |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-09 15:30:58 | 2026-10-09 15:32:56 | `test-engineer` | 1 | APROVADO | a7f8e8306e6ec2570 |
| 2026-10-09 15:33:57 | 2026-10-09 15:35:04 | `frontend-reviewer` | 1 | APROVADO | a92245e683a4f4fca |
| 2026-10-09 15:34:03 | 2026-10-09 15:35:04 | `privacy-guardian` | 1 | APROVADO | a0485ea69cec0db4a |
| 2026-10-09 15:34:09 | 2026-10-09 15:36:23 | `revisor-geral` | 1 | REPROVADO | a21894a05517b08c8 |
| 2026-10-09 16:04:53 | 2026-10-09 16:05:55 | `test-engineer` | 2 | REPROVADO | af490bfc3073403ff |
| 2026-10-09 16:06:30 | 2026-10-09 16:07:00 | `privacy-guardian` | 2 | APROVADO | ac0667170d67acd95 |
| 2026-10-09 16:06:22 | 2026-10-09 16:07:07 | `frontend-reviewer` | 2 | APROVADO | ad8f1e0fa9eda5293 |
| 2026-10-09 16:06:40 | 2026-10-09 16:07:12 | `revisor-geral` | 2 | APROVADO | acefdaf665caab4ed |
| 2026-10-09 16:14:25 | 2026-10-09 16:14:51 | `test-engineer` | 3 | APROVADO | aade0d9738eee8837 |
| 2026-10-09 16:14:57 | 2026-10-09 16:15:14 | `revisor-geral` | 3 | APROVADO | a57e63af6ed00a51c |
