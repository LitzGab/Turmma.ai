# Correção — a primeira carga do e2e: a trava do `goto('/entrar')` sob a rede emulada, a receita dos casos que a evitam e os casos perto do prazo de 30 s

**Origem:** `TODO.md`, item "(X4, censo do e2e) 36 casos entre 2/3 e 90% do prazo", com a decisão M4 da retro da X4 (aceita em 26/10/2026), e a esteira da `develop` `40880199949` (tentativa 1, vermelha; tentativa 2, verde, sem mudança de código): `e2e/pecas-galeria.spec.ts:16` e `e2e/pecas-sobrepor.spec.ts:180` (`celular`) estouraram os 30 s. Pedido do Orquestrador em 29/10/2026.
**Subagentes obrigatórios:** `infra-guardian`, `frontend-reviewer`, `revisor-geral`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. `test-engineer` é obrigatório em toda correção. `revisor-geral` entra se a correção passar de 5 arquivos fora de `tasks/` (passo 5 da skill): passa (16 arquivos de e2e), e está marcado abaixo. -->

## Sintoma

1. Esteira `40880199949`, tentativa 1, job `e2e 7/8`: `pecas-galeria.spec.ts:16` (31,9 s) e `pecas-sobrepor.spec.ts:180` (30 s) estouraram o prazo no `celular`; a tentativa 2, sem mudança de código, passou. No mesmo job passaram, perto do prazo, `pecas-ia.spec.ts:173` (24,5 s) e `:443` (27,0 s, claro e escuro).
2. O censo de duração da mesma execução (`censo-do-e2e-1` a `-8`, lido nesta correção) tem **92 entradas** (uns 46 casos nos dois projetos) acima de 60% do prazo de cada uma. As maiores, em fração do prazo: `pecas-ia:443` (96%), `privacidade:253` (94%), `pecas-sobrepor:180` (93%), `privacidade:430` (89%), `pecas-galeria:16` (88%), `areas:699` (87%), `analista:131` (86%), `inatividade:245` (86%), `entrar:366` (84%), `pecas-ia:173` (84%), `entrar:248`, `titulo-da-tela:155`, `areas:572`, `privacidade:85` e `:314`, `material:441`, `:144`, `:322`.
3. Duas vezes (`2026-10-17-casca-carregando-estoura-o-goto`, `2026-10-26-areas-entrar-estoura-o-prazo`) um `page.goto('/entrar')` ficou parado nos 30 s, com o documento 200 e o resto dos pedidos sem sair do navegador.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa.

O que o censo lista e esta correção **não** tocou está em "Recomendações sem aplicar" (o grupo "entrada e sessão" que a prova da entrada ocupa, e os casos de 90 s).

## Causa

**Duas causas, que o censo separa.**

### (a) A trava do `goto('/entrar')` não se reproduz; a rede emulada custa um tempo fixo por primeira carga

A investigação que a correção `2026-10-26-areas-entrar-estoura-o-prazo` deixou escrita: um laço de contextos novos que só fazem `goto('/entrar')` e esperam o campo de e-mail, nos quatro cruzamentos de `Network.emulateNetworkConditions` e `Emulation.setCPUThrottlingRate`, nos dois projetos, **150 voltas por condição** (1.200 cargas), 2 trabalhadores, contra o compose de teste:

| Condição | `chromebook`: travadas / mediana (mín.–máx.) | `celular`: travadas / mediana (mín.–máx.) |
|---|---|---|
| CPU e rede do perfil | 0 / 2.977 ms (2.950–3.018) | 0 / 3.543 ms (3.501–3.599) |
| só a rede do perfil | 0 / 2.803 ms (2.788–2.823) | 0 / 3.375 ms (3.346–3.403) |
| só a CPU do perfil | 0 / 376 ms (348–438) | 0 / 369 ms (342–430) |
| sem limitação | 0 / 134 ms (125–154) | 0 / 132 ms (124–164) |

Três leituras:

- **A trava não reproduz com nenhuma das quatro condições** (0 em 1.200), como as correções anteriores já tinham visto em 50 e em 15 voltas. A recomendação delas, "se confirmado, pôr nova tentativa da primeira navegação no fixture", **não se cumpre**: não há confirmação, e uma nova tentativa no `perfis.ts` esconderia a trava sem a explicar (e, se ela é do Chromium sob a rede emulada, esconderia também o que a regra 50.1 manda medir). O `perfis.ts` não ganha nova tentativa.
- **O que a rede emulada faz é custar um tempo fixo e estreito por primeira carga**: de 2,8 a 3,5 s por `goto('/entrar')`, com variação de uns 50 ms; a CPU ×4 custa ~0,25 s; sem limitação, 0,13 s. A trava de 30 s não é esse tempo: é 10 vezes ele.
- **Cada primeira carga sob a rede do perfil é, portanto, um custo certo e uma exposição à trava rara.** 110 casos fazem `goto('/entrar')`; os que só querem chegar a outra coisa pagam 3 s e a exposição à toa. É o que a parte (b) tira.

O script (`e2e/zz-investigacao.spec.ts`, temporário, **não vai no commit**) fica descrito aqui; quem quiser repetir o escreve em 40 linhas: `browser.newContext` com as opções do projeto, `newCDPSession`, a condição, `page.goto('/entrar')` + `getByLabel('E-mail').waitFor`.

### (c) Os casos perto do prazo: dois mecanismos

1. **Entrada pela tela.** Os casos que só querem a tela da coordenação ou do professor pagavam `goto('/entrar')` + senha + configuração do segundo fator pela tela, sob a rede e a CPU do perfil: de 8 a 10 s de um prazo de 30 s (`privacidade`, `material`, `coordenacao-introducao`, `analista`, `governanca`, e os casos do professor de `areas`, `entrar`, `inatividade` e `titulo-da-tela`). Medido na máquina, antes e depois, `celular`, 2 trabalhadores: ver a tabela da "Correção".
2. **Galeria (só CPU ×4).** Os casos da galeria não chamam a API: gastam CPU ×4 no navegador, e cada `boundingBox`, `getAttribute` e `evaluate` é uma ida ao navegador. Na máquina eles levam de 10 a 11 s; no runner da esteira, de 24 a 32 s: **uns três vezes**, e não o dobro que o portão da duração supõe (15 s de metade do prazo). Por isso os casos de galeria foram cortados para uns 5–7 s na máquina, e não para os 15 s do portão.

## Teste que reproduz

**Não há vermelho determinístico**, e a razão está na causa: tempo de runner alheio (3× nos casos de CPU) e uma trava que não se reproduz em 1.200 cargas. A evidência que substitui o vermelho é a medida, no mesmo ambiente (`tools/ci/e2e.ts` e `npx playwright test --workers 2`, os 2 trabalhadores da esteira), antes e depois, e a estabilidade (a suíte inteira dos arquivos tocados, 2 trabalhadores): ver a "Correção". Os censos da esteira (`censo-do-e2e-*` de `40880199949`) são o "antes" da esteira.

## Correção

Só teste e fixture de e2e mudam; o produto não, e **nenhuma asserção foi removida**: cada caso dividido leva as asserções do caso de origem, na mesma ordem, e cada caso que muda de entrada afirma o que afirmava (a entrada pela tela tem os casos dela: `entrar.spec.ts`, `mfa.spec.ts`, `convite.spec.ts`).

### (b) A receita, num ajudante com o nome do que ele não mede

- `e2e/__fixtures__/segundo-fator.ts`: **`abrirPelaApiSemMedirAPrimeiraCarga(page, request, pessoa, endereco, aguardar?)`**, para quem tem segundo fator (coordenação). Entra pela API com o segundo fator já configurado, abre o endereço e espera a primeira tela (`aguardar`) **dentro de `carregarSemRedeLenta`**; a CPU do perfil continua e a rede do perfil volta ao devolver. O comentário diz o que ele **não mede**: quanto a aplicação leva para baixar e abrir na rede lenta, e a entrada pela tela.
- `e2e/__fixtures__/casca.ts`: **`entrarPelaApiSemMedirAPrimeiraCarga(page, pessoa, endereco, aguardar?, usuarioId?)`**, o mesmo para quem não tem segundo fator (professor), sobre o `entrarPelaApi` que já existia; e `entrarComoProfessoraPelaApi(page)`, o par de `entrarComoProfessora`.
- Passam a usá-lo: `material.spec.ts` (`abrirMaterial` e `abrirMaterialPeloEndereco`), `privacidade.spec.ts` (`entrarNaPrivacidade`, `abrirAsEmpresas`, o caso dos estados), `coordenacao-introducao.spec.ts` (oito casos que faziam a primeira carga na rede lenta), `analista.spec.ts`, `governanca.spec.ts`, `areas.spec.ts` (`:572`, `:699`), `entrar.spec.ts` (`:248`, `:366`), `inatividade.spec.ts` (`:245`), `titulo-da-tela.spec.ts` (`:155`).
- **Segunda pessoa na mesma aba** (`privacidade:253` e `:430`, `material:543`, `analista:189` e `:266`, `governanca:270`, `areas:572`): o segundo fator da segunda pessoa passa a ser configurado pela API (`configurarSegundoFatorPelaApi`) e o **login dela continua pela tela** (`entrarPelaTelaComSegundoFator`): o que o caso afirma é o que a aba mostra da pessoa anterior.
- `privacidade:216` (troca de escola, 90 s) levou 46,1 s no portão (limite 45 s): metade era a entrada pela tela e a outra metade, a **espera da virada de 30 s do relógio** para o segundo fator da troca de escola (a mesma conta entra duas vezes, e cada passo do TOTP só vale uma vez, `mfa_ultimo_passo`). Agora a ativação pela API usa o passo anterior (`-30`), a entrada pela API o de agora (`0`) e a troca o seguinte (`+30`): a opção `deixarOPassoSeguinteLivre` (`OpcoesDoPasso`, em `segundo-fator.ts`) dá os três passos sem esperar o relógio, e o caso cai de 46–51 s para 19–23 s (12 de 12 verdes, `--repeat-each 6 --workers 2`). Sem a opção, nada muda para os outros casos.

### (c) Os casos, por grupo

| Grupo | Caso | Esteira antes (`celular`) | Máquina, `celular`, 2 trabalhadores: antes → depois |
|---|---|---|---|
| Privacidade | `:253` segunda pessoa (retenção) | 28,1 s | 24,4 → 9,0 s |
| Privacidade | `:430` segunda pessoa (empresas) | 26,7 s | 23,9 → 8,5 s |
| Privacidade | `:85`, `:176`, `:314` | 23,5 / 21,3 / 22,8 s | 18,6 / 19,4 / 18,8 → 6,6 / 6,2 / 5,4 s |
| Material | os 10 casos do censo (`:144` a `:643`) | 18 a 25 s | 7 a 11 s depois (`:144` 11, `:322` 11, `:340` 7, `:366` 9, `:399` 8, `:441` 11, `:474` 9, `:582` 10, `:615` 11, `:643` 10) |
| Introdução da coordenação | `:201` | 12,0 s (medida desta correção, antes) | 8,6 s |
| Professor | `areas:699`, `entrar:248`, `entrar:366`, `titulo-da-tela:155`, `inatividade:245` | 26,0 / 24,5 / 25,2 / 24,1 / 25,8 s | 23,1 / 23,6 / 23,9 / 22,7 / 25,5 → 12,5 / 13,1 / 13,3 / 11,6 / 14,4 s |
| Professor | `areas:572` segunda pessoa | 23,6 s | 21,5 → 8,0 s (segunda pessoa por API na configuração, login pela tela) |
| Coordenação | `analista:131`, `:41`; `governanca:103`, `:64` | 25,9 / 22,7 / 21,6 / 19,4 s | depois: 8,3 / 6,0 / 6,6 / 4,1 s |
| Galeria | `pecas-galeria:16` | 26,5 s (31,9 s na tentativa 1) | 9,9 → três casos de 6,5 / 5,2 / 1,9 s |
| Galeria | `pecas-sobrepor:180` | 27,8 s (> 30 s na tentativa 1) | 11,2 → três casos de 5,9 / 5,0 / 2,9 s |
| Galeria | `pecas-ia:173` | 25,2 s | 9,8 → quatro casos de 1,8 / 6,5 / 2,0 / 2,2 s |
| Galeria | `pecas-ia:443` (claro e escuro) | 28,9 / 27,7 s | 10,5 / 11,0 → dois casos por tema: 5,7 / 5,8 s (axe) e 1,6 / 1,7 s (alvo, numa ida só ao navegador) |
| Galeria | `pecas-botoes:95` | 23,0 s | 1,1 s (37 botões medidos numa ida só ao navegador, em vez de cinco idas por botão) |
| Galeria | `pecas-superficies:26` | 22,1 s | quatro casos de 3,9 / 4,2 / 1,7 / 1,6 s |
| Galeria | `pecas-sobrepor:39` | 20,7 s | 8,3 → dois casos de 2,4 / 6,5 s |

Os cortes dos casos da galeria são nos comentários que o próprio caso já tinha (`// O menu de ferramenta…`, `// Os selos de estado…`), e cada caso novo começa por `abrirGaleria(page)`, que custa ~3 s com a CPU ×4. O `pecas-ia:443` troca o laço `for … of alvos.all()` + `caixa(alvo)` (uma ida por peça, dezenas) por **uma** `page.evaluate` que devolve a medida de todas as peças, e o `pecas-botoes:95` troca o laço de cinco idas por botão por **um** `evaluateAll`; as asserções, os rótulos de falha (`quem`, `fileira · variante`) e os pisos são os mesmos, com uma asserção a mais (`medidas.length > 0`, `toHaveLength(37)` já existia) para o lote não passar vazio.

Estabilidade: ver "Provas" no fim.

## Mutações

```mutacao
arquivo: e2e/pecas-galeria.spec.ts
teste: e2e/pecas-galeria.spec.ts › os selos de estado dizem o estado em texto, a faixa do aluno não fecha e o número de painel vem no formato local
-    await expect(secao(page, 'painel').getByText('12 de 60 perguntas')).toBeVisible()
+    await expect(secao(page, 'painel').getByText('13 de 60 perguntas')).toBeVisible()
```

```mutacao
arquivo: e2e/pecas-sobrepor.spec.ts
teste: e2e/pecas-sobrepor.spec.ts › rejeitar o lote pede o motivo
-    await expect(rejeicao.getByText('6 de 500')).toBeVisible()
+    await expect(rejeicao.getByText('7 de 500')).toBeVisible()
```

```mutacao
arquivo: e2e/pecas-ia.spec.ts
teste: e2e/pecas-ia.spec.ts › as peças da conversa, no tema claro: o alvo de toque do projeto
-      const minimo = hasTouch ? ALVO_DE_TOQUE_PRINCIPAL_PX : 24
+      const minimo = 400
```

```mutacao
arquivo: e2e/pecas-botoes.spec.ts
teste: e2e/pecas-botoes.spec.ts › alvo de 44 px
-        expect(canto, `${fileira} · ${variante}`).toBe('12px')
+        expect(canto, `${fileira} · ${variante}`).toBe('13px')
```

O ajudante `abrirPelaApiSemMedirAPrimeiraCarga` não tem bloco: a mudança tira uma causa de ambiente (a primeira carga na rede lenta), e remover o `carregarSemRedeLenta` dele deixa os casos verdes na máquina, como nas correções `2026-10-26-areas-entrar-estoura-o-prazo` e `2026-10-26-material-sem-licenca-perto-do-prazo`. Quem prova que `carregarSemRedeLenta` tira a rede e a devolve é o `pecas-galeria.spec.ts` (`a abertura da galeria não paga a latência do perfil`), que a correção não toca.

## Recomendações sem aplicar

| Origem | Recomendação | Destino ou motivo |
|---|---|---|
| Esta correção | Os casos do censo que a correção **não** tocou: (1) o grupo "entrada e sessão" em que o assunto é a própria entrada (`convite:154`, `mfa:14` e `:151`, `escola-e-vinculos:211` e `:271`, `troca-de-escola:211`, `casca:386`, `pedidos-do-titular:338`, `tokens:215`, `operacao:45`, `areas:275` e `:479`); (2) os seis de 90 s (`alocacao:85`, `professores:249`, `operacao:125`, `estrutura:314`, `lista-da-turma:214` e `:519`), a 63–75 s de 90; (3) `pecas-sobrepor:504` (15,4 s no runner) e `pecas-ia:261` | `TODO.md`, no item do censo, com a lista e o que mede cada um (dono: Orquestrador, uma correção por linha ociosa) |
| Esta correção | A trava do `goto('/entrar')` volta uma terceira vez: o traço da esteira (`traco-do-e2e-N`) é a evidência, e a investigação desta correção a exclui como lentidão (a carga é de 3 s, e a trava de 30) | Sem ação: o primeiro passo é ler o traço da execução que travou |
| Esta correção | `tools/ci/duracao-do-e2e.ts` supõe o runner do dobro da máquina (15 s de metade do prazo), e os casos de CPU ×4 (galeria) levam o triplo: dizer isso no portão da duração, ou medir por tipo de caso | `TODO.md` (dono: Orquestrador) |
| revisor-geral (1ª), test-engineer (1ª) | `e2e/privacidade.spec.ts` ainda tem um `entrarPelaApiComSegundoFator` próprio, cópia do que está no fixture; usar o de `segundo-fator.ts` ou `abrirPelaApiSemMedirAPrimeiraCarga` | `TODO.md`, no item do censo (dono: quem tocar `privacidade.spec.ts`). O ajudante local é de antes da correção, serve ao caso que prova só o endereço e não espera a tela; trocá-lo muda o que o caso espera e pede repetir o spec |
| revisor-geral (1ª) | Ordem das seções do documento: "(a)", "(c)" na "Causa" e "(b)" na "Correção" | Recusada: só leitura, sem efeito no código nem na prova; mexer em seção numerada do documento arrisca a seção "Revisões" que o hook mantém |
| infra-guardian (1ª) | Registrar quais casos ainda fazem a primeira carga na rede lenta (`entrar.spec.ts`, `mfa.spec.ts`, `convite.spec.ts`) | Recusada: já está escrito na seção "Correção" do documento ("a entrada pela tela tem os casos dela: `entrar.spec.ts`, `mfa.spec.ts`, `convite.spec.ts`") |
| infra-guardian (1ª) | O portão da duração supõe o runner do dobro, e ele leva o triplo nos casos de galeria; falta dono com data | `TODO.md` (já registrado; dono: Orquestrador) |
| privacy-guardian (1ª) | `abrirMaterial` deixou de ir pelo menu (`irPelaCoordenacao(page, 'Material')`) e abre pelo endereço | Sem ação: o próprio revisor diz que é cobertura de navegação, fora da regra 20; o `frontend-reviewer` aprovou sem esse ponto |
| test-engineer (1ª) | A causa principal só se confirma na esteira (runner três vezes a máquina na galeria) | Sem ação: está em "Provas", "Conferência na esteira"; o Orquestrador lê o veredito da esteira |
| revisor-geral (2ª) | `TODO.md`: falta uma vírgula em "`:519`) `pecas-sobrepor:504`"; sem ela, a frase lê como se `pecas-sobrepor:504` fosse dos seis de 90 s | Sem aplicar: só pontuação de documento; quem tocar o item do censo no `TODO.md` corrige junto |
| revisor-geral (2ª) | `e2e/__fixtures__/segundo-fator.ts`: "Devolve o segredo, para o caso que precisa entrar de novo pela tela." ficou no parágrafo da segunda pessoa, mas fala do retorno da função | Sem aplicar: comentário; quem tocar `segundo-fator.ts` (dono: a correção do grupo "entrada e sessão" do censo) |
| test-engineer (2ª) | Os comentários de `casca.ts` e `segundo-fator.ts` citam "regra 10 (item 5)" e "regra 20 (item 5)"; a remissão mais exata é "regra 20 (itens 4 e 5)", ou dizer em texto "a aba não mostra dado da pessoa anterior" | Sem aplicar: comentário; mesmo destino da linha acima |
| test-engineer (2ª) | A seção "Provas" ainda descreve a árvore da rodada 1 | Sem ação: as mudanças da r1 só tiram passos e um parâmetro; o portão e o carimbo valem para a árvore atual, e o hook cobra |

## Ordem de correção da rodada 1 (8 itens, só recomendações), aplicada

1. `pecas-ia.spec.ts`: `SECOES_DA_CONVERSA` e `ALVOS_DE_ACAO` foram para antes do comentário dos hex, que volta a ficar sobre o `RGB`. 2. O comentário do caso dividido diz "quatro". 3. A linha em branco sobrando saiu. 4. `analista.spec.ts`: `entrar(page, request, comEntregas)` sem o `hasTouch` (nenhuma chamada passa `comEntregas`). 5. `privacidade.spec.ts`: o passo `irPelaCoordenacao(page, 'Pedidos')` que `entrarNaPrivacidade` e o caso da troca de escola tinham ganhado saiu; os três que o arquivo já tinha no HEAD ficam. 6. Os comentários dos dois ajudantes dizem que a segunda pessoa na mesma aba entra pela tela. 7. `esperarPainel` já confere `toHaveURL(/\/coordenacao\/painel$/)` e o `h1` "Painel" (`casca.ts:215`): nenhuma asserção saiu de `analista` nem de `governanca`; `material` e `privacidade` têm a própria. 8. As remissões de `areas:572` e `pecas-ia:173` ganharam a medida na tabela; `TODO.md` diz "seis de 90 s", traz `pecas-ia:261` e o ajudante local de `privacidade.spec.ts`; o dono da recomendação do `duracao-do-e2e.ts` é o Orquestrador nos dois.

## Provas

- **Portão da tarefa** (`portao-local.ts --tarefa`): tipos, lint, segredo, dependências, unidade inteira (403 arquivos, 7.456 testes) e os e2e dos 14 specs alterados, 356 casos nos dois projetos, verdes; as 4 mutações vermelhas; carimbo gravado.
- **Estabilidade:** os 14 specs alterados, `npx playwright test … --repeat-each 3 --workers 2` (os 2 trabalhadores da esteira), ambiente de pé: **1.068 de 1.068 verdes** (1 h). O caso mais lento do `celular` que a correção tocou é `governanca:176` (`test.slow()`, 90 s), a 36 s; `privacidade:380` (os estados das empresas, 90 s) a 25 s; `privacidade:208` (a troca de escola, 90 s) a 20,5 s.
- **Primeira rodada do portão** reprovou `material:145` (o título "Escola: material" só chega com o pedaço da tela, que baixava com a rede do perfil de volta): `abrirMaterial` passou a esperar o `h1` da tela dentro da primeira carga; o spec repetido 3 vezes, 90 de 90. **Segunda** reprovou a duração de `privacidade:216` (46,1 s, limite 45 s): ver "Correção".
- **Conferência na esteira** (o que esta correção não prova): o veredito da esteira do push, que o Orquestrador lê. A hipótese a conferir é que os casos da galeria fiquem abaixo de ~65% do prazo no `celular` do runner (hoje, na máquina, de 1,6 a 6,8 s; o runner leva uns três vezes).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-29 17:11:56 | 2026-10-29 17:12:19 | `infra-guardian` | 1 | APROVADO | a4e10180b47a7eadb |
| 2026-10-29 17:11:59 | 2026-10-29 17:12:27 | `frontend-reviewer` | 1 | APROVADO | aaf7973dcbeb5952d |
| 2026-10-29 17:12:06 | 2026-10-29 17:12:37 | `tenancy-guardian` | 1 | APROVADO | a3b8fbb2282c07a5e |
| 2026-10-29 17:12:11 | 2026-10-29 17:12:51 | `conformidade-reviewer` | 1 | APROVADO | a714375371ee0e4e5 |
| 2026-10-29 17:12:09 | 2026-10-29 17:13:10 | `privacy-guardian` | 1 | APROVADO | ab0f7019931ef23e8 |
| 2026-10-29 17:12:01 | 2026-10-29 17:13:55 | `revisor-geral` | 1 | APROVADO | aa7a81442d9bbeac7 |
| 2026-10-29 17:12:04 | 2026-10-29 17:14:30 | `test-engineer` | 1 | APROVADO | a0ad6fd40f211c102 |
| 2026-10-29 17:50:12 | 2026-10-29 17:50:37 | `revisor-geral` | 2 | APROVADO | ac63ca64e83582c31 |
| 2026-10-29 17:50:17 | 2026-10-29 17:50:55 | `test-engineer` | 2 | APROVADO | a748fa23e7b62a01b |
