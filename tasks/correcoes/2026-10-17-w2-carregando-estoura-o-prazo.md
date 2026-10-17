# Correção — o laço do W2 (`areas.spec.ts:316`) espera a leitura de cada tela terminar e já não cabe nos 30 s do relógio padrão

**Origem:** esteira run 39062201162 da `spec/telas-da-coordenacao` (`91d4722`, tarefa 11.0), job `e2e 1/6`: `e2e/areas.spec.ts:316` (`a coordenação abre no Painel, vê Painel, Analista, Escola e Registros…`) em `Test timeout of 30000ms exceeded` no `chromebook`, apontando `paginaNaoRola` (`e2e/__fixtures__/coordenacao.ts:98`). 1 falha em 181; o `celular` da mesma execução passou.
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- O `frontend-reviewer` veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção mexe em um arquivo fora de `tasks/` (o spec), abaixo do limite de 5, e fora de `.github/`, `tools/ci/` e `tools/processo/`. -->

## Sintoma

```
Test timeout of 30000ms exceeded.
Error: a tela ainda está carregando: a medida dela não é a de verdade
Locator:  getByRole('main').getByText(/^(Carregando|Verificando)/)
Expected: 0   Received: 1
   - Test timeout of 30000ms exceeded.
> 98 |   await expect(page.getByRole('main').getByText(/^(Carregando|Verificando)/), ...).toHaveCount(0)
```

A mensagem é a da espera da 11.0, mas quem falhou foi o relógio do caso, não a espera (que tem 5 s e estava na 5ª leitura). A tela do snapshot final (Escola › Professores) já estava pronta.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa.

**Achado à parte, não corrigido aqui:** no job `e2e 2/6` da mesma esteira caiu outro caso, `e2e/painel-da-coordenacao.spec.ts:187` (`recomeço: a troca de escola pelo seletor › o Painel da escola B não traz os números nem o item da A, nem enquanto carrega`), em `Test timeout of 90000ms exceeded` num `locator.click` (já com `test.slow()`). Não está no pedido e a causa é outra (um clique que não acha o alvo, e não a soma de esperas): vai ao Orquestrador no relatório.

## Causa

**Tempo do teste, e não da tela.** Lido o trace da esteira (`traco-do-e2e-1`), o caso gasta, no runner:

| Instante | O que acontece |
|---|---|
| 0,0 a 8,1 s | entrada pela tela com segundo fator (senha, ativar, voltar, senha, código) |
| 8,1 a 13,1 s | o `heading` do Painel leva 5,0 s para aparecer (CPU ×4, Fast 3G) |
| 13,2 a 22,0 s | o laço dos quatro lugares: título, `aria-current` e largura de cada um, mais 0,9 a 2,0 s esperando cada lugar abrir |
| 22,0 a 29,6 s | o laço das onze telas, de trás para a frente; em cada uma `paginaNaoRola` espera o "Carregando" sair: de 0,8 a 1,3 s por tela (1,3 s na dos Pedidos, 0,8 s nas outras que carregam) |
| 30,0 s | o relógio do Playwright mata o caso em Escola › Professores, a nona tela das onze |

Nenhuma tela travou: cada "Carregando" saiu em até 1,3 s. O que mudou na 11.0 foi a espera nova de `paginaNaoRola` (`coordenacao.ts:98`), que é certa e fica: antes a medida era tirada com a tela ainda em "Carregando" (e foi assim que os Agentes passaram rolando). Medir de verdade custa a leitura real de cada tela, e as onze, somadas, passam o que sobrava dos 30 s. Os casos de outros specs com tantas etapas já levam `test.slow()` (`agentes.spec.ts`, `acesso-da-turma.spec.ts`, e o `material.spec.ts:180`, corrigido hoje pelo mesmo motivo).

Não é "aumentar o timeout no escuro": a conta fecha. O caso precisa de uns 31 a 33 s no runner, e o relógio padrão é de 30.

## Teste que reproduz

Reproduzir o relógio do runner não é determinístico, mas o que o produz é: a soma dos "Carregando" das onze telas. Com um relógio menor, o mesmo caso, **antes da correção**:

```
npx playwright test e2e/areas.spec.ts -g "a coordenação abre no Painel" --timeout=22000 --repeat-each 2 --workers 2
```

Resultado: **4 de 4 vermelhos** (dois por projeto), todos em `coordenacao.ts:98`, `Test timeout of 22000ms exceeded`.

## Correção

Só teste muda; o produto não.

- `e2e/areas.spec.ts`: o caso ganha `test.slow()` na primeira linha, com o motivo num comentário. O relógio do caso passa de 30 s para 90 s. Nenhuma asserção muda ou sai, e a espera da 11.0 em `paginaNaoRola` fica como está.

O que **não** muda: a espera de `paginaNaoRola`, o laço, os tetos de cliques e a tela.

## Estabilidade

Depois da correção, o mesmo comando do vermelho e depois o caso rodado dez vezes por projeto, com os dois trabalhadores da esteira:

- o comando do vermelho (`--timeout=22000`, duas repetições por projeto): **4 de 4 verdes**, contra os 4 vermelhos de antes;
- `npx playwright test e2e/areas.spec.ts -g "a coordenação abre no Painel" --repeat-each 10 --workers 2`, relógio normal: **20 de 20 verdes** (dez por projeto), de 24,7 a 25,2 s no `chromebook` e de 26,2 a 27,4 s no `celular`. Sem a correção esse caso já ficava a 3 s do relógio de 30 s nesta máquina, que é mais rápida que o runner; com `test.slow()` o relógio é de 90 s, e o mais lento usa 30% dele.

Uma execução anterior da mesma estabilidade teve 2 vermelhos (`chromebook`, `toHaveTitle` de "Analista" com "Não foi possível carregar"). Não são do relógio: os dois casos caíram no mesmo segundo, 17:07:08, e o traço mostra o pedido do chunk do Analista (`tela-coordenacao-ordem-*.js`) abortado (status −1) nesse instante, que é o de criação dos contêineres do `educa-teste-2`, subido por outro andar. Repetida a rodada com a máquina sem esse arranque, 20 de 20. Fica registrado como interferência do ambiente compartilhado entre andares, e não como defeito desta correção.

## Mutações

Correção só de relógio de teste: não há cláusula de produto nem asserção nova a mutar. O relógio se prova pelo vermelho com o relógio menor e pela estabilidade, acima.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª), test-engineer (1ª) | `e2e/painel-da-coordenacao.spec.ts:187` estourou 90 s num `locator.click`, mesmo com `test.slow()`; causa outra (clique que não acha o alvo), precisa de dono | Já registrado como "Achado à parte" no documento. Destino: o Implementador o leva ao Orquestrador no relatório, para virar correção própria |
| test-engineer (1ª) | Se outros casos do laço de telas da coordenação chegarem perto dos 30 s, dar um tempo limite ao `describe` em vez de `test.slow()` caso a caso | Recusada por ora: mexe em outros casos e em organização, fora do arquivo e do defeito desta correção, e o revisor diz que não bloqueia. Reabrir se um segundo caso do laço estourar |
| frontend-reviewer (1ª) | A tabela "Revisões" deve ser preenchida pelo hook | Já é assim; nada a fazer |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-17 17:24:59 | 2026-10-17 17:25:27 | `frontend-reviewer` | 1 | APROVADO | aed8fe4db27f0c21b |
| 2026-10-17 17:25:00 | 2026-10-17 17:25:31 | `test-engineer` | 1 | APROVADO | a48f9881c7b477906 |
