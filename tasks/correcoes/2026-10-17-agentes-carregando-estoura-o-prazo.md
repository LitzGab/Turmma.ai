# Correção — o caso `paginaNaoRola` não aceita a tela ainda carregando (`agentes.spec.ts:164`) estoura os 30 s do relógio padrão no celular

**Origem:** esteira runs 39066733762, 39066820938 e 39066847388 da `spec/telas-da-coordenacao`, job `e2e 4/6`: `e2e/agentes.spec.ts:164` no projeto `celular`, em `Test timeout of 30000ms exceeded` (30,2 s), apontando a linha 179 (`toBeVisible` do cartão do Assistente, com 20 s de espera). 1 falha em 181; o `chromebook` passou nas três.
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- O `frontend-reviewer` veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção mexe em um arquivo fora de `tasks/` (o spec), abaixo do limite de 5, e fora de `.github/`, `tools/ci/` e `tools/processo/`. -->

## Sintoma

```
Test timeout of 30000ms exceeded.
Error: expect(locator).toBeVisible() failed
Locator: getByRole('main').locator('[data-cartao-do-agente="assistente_de_ensino"]')
Expected: visible   Received: <element(s) not found>
   - Expect "toBeVisible" ... with timeout 20000ms
   - Test timeout of 30000ms exceeded.
> 179 | await expect(cartaoDe(page, 'assistente_de_ensino')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
```

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa.

**Achado à parte, não corrigido aqui:** neste mesmo arquivo, o único outro caso sem `test.slow()` é "três funções no Assistente…" (`agentes.spec.ts:183` antes desta correção, hoje `:186`), que levou 25,5 s no `celular` da esteira. O de `:302` (hoje `:306`, "a coordenação de B entra na aba da de A") já tem `test.slow()`; os 28,7 s dele cabem nos 90 s. Não estouraram nas três esteiras; o Orquestrador decide se o `:186` vira correção própria.

## Causa

**Tempo do teste, e não da tela: nada travou.** Na esteira o caso passou pela rejeição de `paginaNaoRola`, abriu a leitura (`segurada.abrir()`, linha 178 antes desta correção) e o relógio acabou na linha 179, esperando o cartão aparecer (a espera de 20 s foi cortada pelos 30 s do caso). O caso foi reproduzido no `celular` com o traço ligado (2 vermelhos em 4 repetições, um trabalhador só), e ali o mesmo relógio acabou um pouco antes, ainda dentro da rejeição; é o mesmo defeito, o orçamento curto, e o traço de uma falha mostra:

| Instante | O que acontece |
|---|---|
| 0,0 a 14,4 s | `entrar`: login (3,4 s), Painel, aba IA (5,2 s só no `expect` do passo final) — CPU ×4 e rede móvel |
| 14,7 a 17,9 s | `page.goto('/coordenacao/agentes')` com a leitura das funções segurada |
| 17,9 a 25,3 s | o "Carregando os agentes…" leva 7,4 s para aparecer (a página recarregada tem de montar com CPU ×4) |
| 25,3 a 30,0 s | `expect(paginaNaoRola(page)).rejects`: a espera interna de `paginaNaoRola` tem 5 s e **tem de gastá-los**, porque o caso prova que ela rejeita com a tela carregando |
| 30,0 s | o relógio mata o caso. Aqui, na reprodução local, antes de `segurada.abrir()`: o snapshot do erro mostra a página em "Carregando os agentes…", como o caso a deixou. Na esteira o caso já tinha aberto a leitura e esperava o cartão (linha 179) |

A leitura não ficou segurada por defeito: é o próprio caso que a segura, e ela só abre depois da rejeição. O que sobra para entrar e carregar é o que o relógio de 30 s deixa depois dos 5 s de espera deliberada, e depois ainda falta o cartão aparecer; no `celular` do runner (mais lento que esta máquina) isso é 30,2 s nas três esteiras. Os outros casos do arquivo que fazem algo parecido já têm `test.slow()`.

## Teste que reproduz

Reproduzir o relógio do runner não é determinístico (2 de 4 vermelhos aqui, no relógio normal), mas o que o produz é. Com um relógio menor, o mesmo caso, **antes da correção**:

```
npx playwright test e2e/agentes.spec.ts -g "paginaNaoRola" --timeout=22000 --repeat-each 2 --workers 2
```

Resultado: **4 de 4 vermelhos** (dois por projeto), `Test timeout of 22000ms exceeded`, todos em `agentes.spec.ts:179`.

## Correção

Só teste muda; o produto não.

- `e2e/agentes.spec.ts`: o caso ganha `test.slow()` na primeira linha, com o motivo num comentário. O relógio passa de 30 s para 90 s. Nenhuma asserção muda ou sai, e a espera de `paginaNaoRola` fica como está.

O que **não** muda: `paginaNaoRola`, a leitura segurada, o `PRAZO_DA_ENTRADA_MS` e a tela.

## Estabilidade

Depois da correção:

- o comando do vermelho (`--timeout=22000`, duas repetições por projeto): **4 de 4 verdes**, contra os 4 vermelhos de antes;
- `npx playwright test e2e/agentes.spec.ts -g "paginaNaoRola" --repeat-each 10 --workers 2`, relógio normal: **20 de 20 verdes** (dez por projeto), de 26,5 a 29,7 s no `chromebook` e de 29,0 a 29,6 s no `celular`. Esses tempos são os do caso inteiro nesta máquina; com `test.slow()` o relógio é de 90 s, e o mais lento usa 33% dele.

## Mutações

Correção só de relógio de teste: não há cláusula de produto nem asserção nova a mutar. O relógio se prova pelo vermelho com o relógio menor e pela estabilidade, acima.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | Tratar `:302` e `:183` em correção própria, antes que estourem | Parte já no item 2 (citação corrigida). Se o `:186` (hoje) vira correção é decisão do Orquestrador, como o próprio documento diz em "Fora desta correção"; nenhuma ação aqui |
| frontend-reviewer (1ª) | Na foto da escola cheia, o aviso de incidente cobre a tela; "Segunda linha do texto." é dado sintético da vitrine | Recusada: é dado da vitrine, não do produto, e esta correção não toca tela |
| frontend-reviewer (1ª) | O comentário diz "passa dos 30 s no runner" e a máquina de desenvolvimento mediu 26,5 a 29,7 s | Recusada: o próprio revisor diz que é coerente com o documento e que não bloqueia; o texto do comentário é ajustado no item 3 pela outra recomendação |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-17 18:56:09 | 2026-10-17 18:56:28 | `frontend-reviewer` | 1 | APROVADO | aedd24b2bc4cd8dc0 |
| 2026-10-17 18:56:12 | 2026-10-17 18:57:53 | `test-engineer` | 1 | APROVADO | a645ba4c44277decc |
