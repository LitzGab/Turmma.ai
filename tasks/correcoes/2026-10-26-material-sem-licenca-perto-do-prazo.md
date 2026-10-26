# Correção — o caso "sem licença" de `material.spec.ts` passa de 90% do prazo de 30 s (`material:247`, fatia 2 do `chromebook`)

**Origem:** esteira run 40343804451 da `spec/telas-do-aluno-e-primeiro-acesso--l1`, censo do e2e (`esteira.ts --censo`): `e2e/material.spec.ts:247` (`sem licença, o diálogo diz "Envio recusado"…`) a 27,2 s de 30, no `chromebook`, fatia 2. A correção `2026-10-26-tres-casos-do-e2e-perto-do-prazo` tratou `material:478` e `:491` e não alcançou este.
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`, `infra-guardian`, `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. `revisor-geral` já é obrigatório em toda correção. -->

## Sintoma

O caso leva 27,2 s dos 30 s no `chromebook` da esteira. Não falhou ainda, mas a variação de um runner a outro já derrubou casos assim (`2026-10-16-galeria-da-onca-estoura-o-prazo`). Não é de tarefa da X4: o caso é da 8.0 da A2.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso.

## Causa

**Tempo, e o tempo é a espera do primeiro carregamento da tela Material sob a rede móvel lenta, não o trabalho do caso.**

Medi o corpo do caso passo a passo (marcas de tempo provisórias, tiradas depois), no `chromebook` com 1 trabalhador: o corpo inteiro leva 13,0 s na versão com a entrada pela API (`abrirMaterialPeloEndereco`), e **7,5 s** deles são uma única linha, a espera de `Nenhum material ainda` logo depois da entrada. A entrada em si (escola, estrutura, sessão pela API) leva 0,35 s. O que acontece: a carga do endereço termina no `load`, a rede lenta do perfil (600 ms de latência, 1 Mbps) volta, e só então a aplicação baixa o pedaço da tela Material e pede `/v1/materiais`, tudo sob a rede lenta e a CPU ×4. O restante do caso (abrir o diálogo, preencher, enviar duas vezes, duas passadas do axe, reabrir, dispensar) soma 4,8 s.

O caso afirma o que a tela faz com a recusa de licença, e não quanto tempo a lista leva para baixar na rede lenta (isso se mede no orçamento do build e nos specs de tela com API; precedente: `carregarSemRedeLenta`, `e2e/__fixtures__/perfis.ts`). Passa de 27 s na esteira porque o caso acumulava a entrada pela tela (dois logins e o segundo fator sob a rede lenta, que a correção `2026-10-26-tres-casos-do-e2e-perto-do-prazo` já tirou dos casos do endereço) e essa espera.

## Teste que reproduz

Tempo de runner alheio não é determinístico; a evidência é a medida, no mesmo ambiente (`tools/ci/e2e.ts`, `e2e/material.spec.ts` inteiro, 6 trabalhadores) antes e depois, e a estabilidade com os 2 trabalhadores da esteira.

| Caso `material.spec.ts` › `sem licença, o diálogo diz "Envio recusado"…` | `chromebook` | `celular` |
|---|---|---|
| Antes (entrada pela tela, o que a esteira mediu a 27,2 s) | 22,0 s | 23,1 s |
| Só a entrada pela API, a espera da lista ainda sob a rede lenta (passo que não bastou) | 14,0 s | 14,2 s |
| Depois (entrada pela API e a lista esperada ainda sem a rede lenta) | **7,4 s** | **7,3 s** |

O passo intermediário passava, mas a 14 s de um limite de 15 s do portão (`tools/ci/duracao-do-e2e.ts`); não é folga. As asserções são as mesmas.

Estabilidade: `npx playwright test e2e/material.spec.ts -g "sem licença|pelo endereço|id que não existe" --repeat-each 5 --workers 2` (os 2 trabalhadores da esteira), ambiente de pé: **40 de 40 verdes**. O caso `sem licença` em 10 execuções ficou entre 6,7 e 7,3 s nos dois projetos. O spec inteiro, com 6 trabalhadores: 30 de 30 verdes.

## Correção

Só teste muda; o produto não, e nenhuma asserção saiu.

- `e2e/material.spec.ts`: o caso `sem licença…` entra pelo ajudante `abrirMaterialPeloEndereco` (entrada pela API com o segundo fator já configurado, que a correção anterior criou para os casos do endereço) em vez de `abrirMaterial`. A entrada pela tela e o menu continuam provados nos outros casos do arquivo e em `mfa.spec.ts`.
- O ajudante ganha um parâmetro opcional `aguardar`, que roda **dentro** de `carregarSemRedeLenta`: o caso espera a lista vazia (`Nenhum material ainda`, com o mesmo prazo de antes) enquanto a rede está livre, e a rede do perfil volta já com a tela carregada. A recusa, o envio, a conferência do corpo do pedido, as duas passadas do axe e o resto do caso continuam sob a rede e a CPU do perfil. `antes` passa a aceitar `undefined`, porque este caso não semeia nada.

Fora desta correção: os outros casos do arquivo entre 16 e 24 s (`:137`, `:201`, `:306`, `:425` e vizinhos) e a `segunda pessoa…` (`:527`, `test.slow()` desde antes). O pedido só aponta o `:247` do censo da esteira 40343804451; os demais não foram medidos nela por esta correção.

## Mutações

Correção só de teste: nenhum arquivo de `apps/*/src` nem de `packages/*/src` muda, e as asserções do caso são as mesmas, então o RF17 não exige mutação. Os blocos abaixo mexem no próprio teste e **não provam a regra da recusa** (essa continua provada pelas asserções inalteradas do caso): provam que a espera nova, que o ajudante passou a fazer fora da rede lenta, está no lugar certo e que o caso continua rodando até as linhas mutadas. O primeiro, ao trocar o endereço, fica vermelho porque `toHaveURL` dentro de `aguardar` não vê `/coordenacao/material`; o segundo prova que o próprio `toHaveURL` está vivo; o terceiro, que a conferência do corpo do pedido (o arquivo não sai do computador) é uma asserção que pode falhar.

```mutacao
arquivo: e2e/material.spec.ts
teste: e2e/material.spec.ts › sem licença, o diálogo diz "Envio recusado"
      page,
      request,
      undefined,
-      () => '/coordenacao/material',
+      () => '/coordenacao/turmas',
      async () => {
        await expect(page).toHaveURL(/\/coordenacao\/material$/)
```

```mutacao
arquivo: e2e/material.spec.ts
teste: e2e/material.spec.ts › sem licença, o diálogo diz "Envio recusado"
      async () => {
-        await expect(page).toHaveURL(/\/coordenacao\/material$/)
+        await expect(page).toHaveURL(/\/coordenacao\/turmas$/)
        await expect(lista(page).getByText('Nenhum material ainda')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
```

```mutacao
arquivo: e2e/material.spec.ts
teste: e2e/material.spec.ts › sem licença, o diálogo diz "Envio recusado"
    expect(corpo).not.toBeNull()
-    expect(corpo?.includes('%PDF-')).toBe(false)
+    expect(corpo?.includes('%PDF-')).toBe(true)
    expect(corpo?.includes('sem_licenca')).toBe(true)
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | Trocar o `undefined` posicional de `abrirMaterialPeloEndereco(page, request, undefined, …)` por um objeto de opções (`{ antes, endereco, aguardar }`) | Recusada: muda a assinatura e toca os outros dois chamadores (`:513` e `:527`), que a correção não alcança; o revisor diz que não bloqueia |
| infra-guardian (1ª), test-engineer (1ª) | Os casos `:137`, `:201`, `:306` (`depois da recusa…`, a mesma forma do corrigido) e `:425` entre 16 e 24 s, e a `segunda pessoa…` (`:527`) | `TODO.md`, uma linha "Telas do aluno, correção `2026-10-26-material-sem-licenca-perto-do-prazo`" |
| revisor-geral (2ª), test-engineer (2ª) | Os números de linha do documento (`:137`, `:201`, `:306`, `:425`, `:513`, `:527`) já não batem com o arquivo depois do diff; citar pelo nome | Recusada: são a numeração do censo da esteira 40343804451, que é a do sintoma; o `TODO.md` já cita os casos pelo nome |
| revisor-geral (2ª) | O bloco de mutação do `toHaveURL` só mostra que a asserção nova pode falhar; poderia sair | Recusada: o revisor diz que sai sem perda, não que falta; o bloco custa pouco e prova que o `toHaveURL` está vivo |
| revisor-geral (2ª), test-engineer (2ª) | O `undefined` posicional de `abrirMaterialPeloEndereco(page, request, undefined, …)` | Já registrada acima (recusada na 1ª rodada) |
| privacy-guardian (1ª) | Confirmar que o caminho pelo menu ainda tem um caso | Já atendida: a entrada pela tela e o menu seguem provados nos outros casos do arquivo e em `mfa.spec.ts` (confirmado pelo `test-engineer` da rodada 1) |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-26 12:58:05 | 2026-10-26 12:58:18 | `infra-guardian` | 1 | APROVADO | afd6e7c4257439344 |
| 2026-10-26 12:58:06 | 2026-10-26 12:58:19 | `tenancy-guardian` | 1 | APROVADO | a1c8760fd69ef0d41 |
| 2026-10-26 12:58:08 | 2026-10-26 12:58:21 | `conformidade-reviewer` | 1 | APROVADO | a668f33193e957e60 |
| 2026-10-26 12:58:07 | 2026-10-26 12:58:25 | `privacy-guardian` | 1 | APROVADO | a77940cb100f31f38 |
| 2026-10-26 12:58:04 | 2026-10-26 12:58:25 | `revisor-geral` | 1 | APROVADO | ace73e79f636ff868 |
| 2026-10-26 12:58:03 | 2026-10-26 12:58:41 | `test-engineer` | 1 | APROVADO | af86a3038c47a78da |
| 2026-10-26 13:07:18 | 2026-10-26 13:07:37 | `revisor-geral` | 2 | APROVADO | a1c154ca5daccb708 |
| 2026-10-26 13:07:13 | 2026-10-26 13:07:45 | `test-engineer` | 2 | APROVADO | a656513f5bd07f7bb |
