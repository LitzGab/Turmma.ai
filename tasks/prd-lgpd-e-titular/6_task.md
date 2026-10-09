# Tarefa 6.0 — A coordenação vê por quanto tempo a escola guarda cada dado

**Funcionalidade:** lgpd-e-titular · **Depende de:** 2.0 · **Paralelo com:** 3.0 a 5.0, 7.0 a 9.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Nasce o item Privacidade da coordenação, no grupo Conformidade, com a aba "Por quanto tempo guardamos".

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seção 9
- `docs/interface.md` 3 e 11.1
- `.claude/rules/50-frontend.md`
- Código: `apps/web/src/areas/navegacao.ts` e `.test.ts`, `apps/web/src/areas/coordenacao/*`, as peças de tabela e abas da A1
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [x] 6.1 — Item Privacidade com abas no endereço; aba Retenção lendo `GET retencao`
- [x] 6.2 — `docs/interface.md` (o item no grupo Conformidade)
- [x] 6.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/privacidade/*` | novo |
| `navegacao.ts`, `.test.ts`, rotas | alterado |
| e2e | novo |
| `docs/interface.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| navegação | unidade | Privacidade só para a coordenação |
| estados | e2e | carregando, erro e com dado; o vazio não se aplica (toda escola tem todas as categorias) |
| origem ajustada | e2e | aparece |
| recomeço | e2e | segunda pessoa na aba e troca de escola não mostram a retenção anterior |
| projetos | e2e | `chromebook` e `celular`, com acessibilidade |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --e2e)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

As outras abas (8.0, 10.0, 16.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

nenhuma

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta. As de unidade foram
rodadas uma a uma (apagar ou trocar a cláusula, rodar o teste, ver vermelho, restaurar byte a byte). As de tela estão
marcadas. A da coluna "Dado" e a do `resetQueries` da troca de sessão foram rodadas no e2e: vermelho no `chromebook`, cada uma. As outras não foram rodadas isoladas, porque
cada mutação de e2e custa a rodada inteira do `--e2e` (~25 min), e a Mesa decide se entram nesta rodada ou se pedem a
rodada delas.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|
| `apps/web/src/areas/coordenacao/privacidade/textos-da-retencao.ts` › `textoDoPrazo` › `meses % 12 === 0` | unidade: "o resto é dito em meses, e um mês no singular" (vermelho com a condição trocada por `true`) |
| `textoDoPrazo` › `anos === 1 ? '1 ano' : ` (singular de anos) | unidade: "um prazo de anos exatos é dito em anos, no singular e no plural" |
| `textoDoPrazo` › `meses === 1 ? '1 mês' : ` (singular de mês) | unidade: "o resto é dito em meses, e um mês no singular" |
| `textoDaOrigem` › `linha.origem === 'ajustada'` | unidade: "um prazo sem trava diz se é o padrão do sistema ou o ajuste da escola" |
| `textoDaOrigem` › `if (linha.limitadaPor === null) return origem` | unidade: "um prazo sem trava diz se é o padrão do sistema ou o ajuste da escola" (vermelho por exceção: a categoria `null` não existe no catálogo) |
| `apps/web/src/areas/navegacao.ts` › `NAVEGACAO.coordenador` › item `Privacidade` | unidade: "W2: … têm tela" (a lista da coordenação não bate mais) |
| `apps/web/src/areas/coordenacao/rotas.tsx` › `RotasDaCoordenacao` › `<Route path={ROTAS_DA_COORDENACAO.privacidade}>` com o `Redirect` | não rodada isolada; cobre o e2e "o endereço sem aba, e um endereço com aba que não existe, abrem a aba de retenção" |
| `rotas.tsx` › `<Route path={ROTAS_DA_COORDENACAO.privacidadeDaAba}>` com `Privacidade aba={parametros.aba}` | não rodada isolada; cobre o e2e "a coordenação abre Privacidade pela navegação…" (a URL `…/retencao` nunca chegaria) |
| `apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx` › `Privacidade` › `!ABAS_DA_PRIVACIDADE.some((item) => item.id === aba)` | não rodada isolada; cobre o e2e "o endereço sem aba…" (com `nao-existe`, a URL ficaria fora de `…/retencao`) |
| `Privacidade.tsx` › `Abas` › `aoMudar={(id) => navegar(caminhoDaAbaDaPrivacidade(id))}` | sem teste nesta fatia: só existe uma aba, e a troca de aba não tem para onde ir; a aba seguinte (8.0) traz o teste de troca |
| `apps/web/src/areas/coordenacao/privacidade/Retencao.tsx` › `Retencao` › `if (retencao.isPending)` | não rodada isolada; cobre o e2e "os estados: carregando, erro com 'Tentar de novo', e com dado" |
| `Retencao.tsx` › `Retencao` › `retencao.isError && retencao.data === undefined` | não rodada isolada; cobre o e2e "os estados…" (o alerta some) |
| `Retencao.tsx` › `Retencao` › `aoTentarDeNovo` com `refetch` | não rodada isolada; cobre o e2e "os estados…" (o "Tentar de novo" leva ao dado) |
| `Retencao.tsx` › `COLUNAS_DAS_CATEGORIAS` › `prazo` com `textoDoPrazo(linha.meses)` | não rodada isolada; cobre os e2e de "6 meses" e "3 meses" |
| `Retencao.tsx` › `COLUNAS_DAS_CATEGORIAS` › `origem` com `textoDaOrigem(linha)` | não rodada isolada; cobre o e2e "Ajustado pela escola" e a trava |
| `Retencao.tsx` › `COLUNAS_DAS_CATEGORIAS` › `contagem` com `linha.contaDe` | não rodada isolada; cobre o e2e "cada mensagem" |
| `Retencao.tsx` › `COLUNAS_DAS_CATEGORIAS` › `dado` com `linha.descricao` | e2e "a coordenação abre Privacidade pela navegação…": `linhaDa(page, 'Conversa do aluno com o Tutor')` não acha a linha (vermelho no `chromebook` com a coluna tirada; rodada) |
| `apps/web/src/api/privacidade.ts` › `consultaRetencao` › `queryKey` com `CHAVE_DA_PRIVACIDADE` | sem teste direto: o `main.tsx` esvazia todas as consultas na troca de sessão, então o prefixo não muda o resultado; o e2e "a troca de escola…" e "a segunda pessoa…" é quem prova a limpeza |
| `Retencao.tsx` › `Tabela` › `chaveDaLinha` | sem teste direto: é a chave do React da lista, e nenhuma asserção a enxerga |
| `apps/web/src/caminhos.ts` › `ABA_INICIAL_DA_PRIVACIDADE` › o valor `'retencao'` | não rodada: trocar o valor deixa os dois e2e de endereço ("o endereço sem aba…" e "a coordenação abre Privacidade pela navegação…") fora de `…/retencao`, por construção; a ordem pede só o aviso, sem rodada |
| `apps/web/src/main.tsx` › `aoTrocarDeSessao` › `clienteConsultas.resetQueries()` | e2e "a segunda pessoa na mesma aba não vê a retenção da anterior" (rodada no `chromebook`: sem o reset, o dado da primeira pessoa aparece do cache e o "carregando" não aparece) |

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | e2e de "ajustada com trava" na tela (ajuste em `consumo_por_aluno` acima do de `conversa_tutor`) | Recusada: a combinação já é provada em unidade (`textos-da-retencao.test.ts`, "Ajustado pela escola; encurtado pela trava com …") e a tela só repete o texto; e2e a mais custa ~25 min de portão por rodada sem provar regra nova |
| test-engineer (1ª) | teste da troca de aba (`aoMudar`) | Tarefa 8.0: é quando existe uma segunda aba; o motivo já está na tabela de Mutações |
| test-engineer (1ª), privacy-guardian (1ª) | e2e de "professor digita `/coordenacao/privacidade`" | `/validar` desta funcionalidade, como cenário de permissão visto pela tela; o bloqueio real é da API (tarefa 2.0) |
| frontend-reviewer (1ª) | aba única numa linha de abas é só um rótulo | Recusada: cada aba chega com a tarefa dela (D73), e a linha de abas já fica no lugar para a 8.0 |
| frontend-reviewer (1ª) | `docs/interface.md` 11.1 descreve a lateral da coordenação em grupos, mas `navegacao.ts` é plana | `/validar` desta funcionalidade: registrar que o grupo "Conformidade" ainda não existe na lateral; não é desta tarefa |
| frontend-reviewer (1ª) | mutações de e2e das cláusulas de tela marcadas "não rodada isolada" | Recusada nesta tarefa: ~25 min por mutação; as asserções de texto exato e o e2e de cada estado cobrem as cláusulas, e o test-engineer aprovou assim. A da coluna "Dado" foi rodada. O `/validar` pode pedir outra |
| frontend-reviewer (1ª) | o teste de troca de escola espera a virada de 30 s do TOTP e pode levar quase 90 s | Esteira da spec: se estourar o tempo lá, vira `/corrigir`; a espera é a que a regra do segundo fator impõe, e o `setTimeout` do teste já está em 90 s |
| privacy-guardian (1ª) | conferir que a tela não sugere que a coordenação muda o prazo ("Ajustado pela escola") | `/validar` desta funcionalidade: a tela é só leitura e o `docs/interface.md` já diz que o ajuste é da operação |
| revisor-geral (1ª) | `docs/interface.md:312-315` "é a aba que existe hoje" vai envelhecer | Tarefa 8.0, que põe a segunda aba e atualiza esse parágrafo |
| test-engineer (3ª) | extrair o par `portao()` + `page.route` que segura `/v1/privacidade/retencao` (repetido três vezes em `e2e/privacidade.spec.ts`) para um ajudante | Tarefa 8.0, que volta a esse spec ao pôr a segunda aba; mexer em e2e agora caduca os aprovados e custa ~25 min de portão |
| test-engineer (3ª), frontend-reviewer (2ª), privacy-guardian (2ª), revisor-geral (2ª) | ligar `ABA_INICIAL_DA_PRIVACIDADE` (`caminhos.ts`) ao primeiro `id` de `ABAS_DA_PRIVACIDADE` (tipar a constante ou derivar uma da outra, com teste de unidade) | Tarefa 8.0: com uma aba só os dois valores não podem divergir, e os dois e2e de endereço pegam a divergência; a 8.0 põe a segunda aba |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-09 04:06:03 | 2026-10-09 04:08:15 | `test-engineer` | 1 | REPROVADO | aaeaac1ef74ca0364 |
| 2026-10-09 06:02:51 | 2026-10-09 06:03:47 | `test-engineer` | 2 | APROVADO | aef7a225b74195103 |
| 2026-10-09 06:03:54 | 2026-10-09 06:04:37 | `frontend-reviewer` | 1 | APROVADO | a3ca1b2acabfc25fe |
| 2026-10-09 06:04:45 | 2026-10-09 06:05:16 | `privacy-guardian` | 1 | APROVADO | ad9f2b6e9a65a7bf2 |
| 2026-10-09 06:04:46 | 2026-10-09 06:05:54 | `revisor-geral` | 1 | APROVADO | ad83da83fc856bf6f |
| 2026-10-09 09:12:28 | 2026-10-09 09:12:55 | `test-engineer` | 3 | APROVADO | af348cf51bff21ea4 |
| 2026-10-09 09:13:18 | 2026-10-09 09:13:37 | `frontend-reviewer` | 2 | APROVADO | ac4bc8997c33dc85e |
| 2026-10-09 09:13:45 | 2026-10-09 09:14:05 | `privacy-guardian` | 2 | APROVADO | a342b326ed9095e10 |
| 2026-10-09 09:13:42 | 2026-10-09 09:14:07 | `revisor-geral` | 2 | APROVADO | ab15904469961bc1d |
