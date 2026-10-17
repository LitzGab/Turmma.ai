# Correção — o caso "carregando" da casca estoura o `page.goto('/sistema')` em 30 s na esteira

**Origem:** esteira `39037149357` (commit `0646419`), job `e2e 1/6`, `e2e/casca.spec.ts:134` (`chromebook`); pedido do Orquestrador em 17/10/2026. Os outros 173 casos do shard passaram.
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- O `frontend-reviewer` veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção mexe em um arquivo fora de `tasks/` (o spec), abaixo do limite de 5, e fora de `.github/`, `tools/ci/` e `tools/processo/`. -->

## Sintoma

```
Error: page.goto: Test timeout of 30000ms exceeded.
  - navigating to "http://127.0.0.1:28090/sistema", waiting until "load"
> 140 |     await page.goto('/sistema')
```

O caso segura a resposta de `/v1/sistema/estado` com `page.route` e só a solta depois do `goto`. A primeira leitura foi que o fetch segurado impedia o `load`.

## Fora desta correção

Nada: nenhuma tarefa em curso na árvore.

## Causa

**Não é o fetch segurado.** O traço da esteira (`traco-do-e2e-1`, `trace.zip`) mostra, depois do `goto`:

- o documento `/sistema` respondeu 200 em 574 ms;
- os onze pedidos seguintes (`index-*.js`, os dez `parte-*.js` do `modulepreload` e `index-*.css`) saíram em 1,5 s e **nenhum recebeu resposta** nos 30 s do caso;
- nenhum pedido a `/v1/sistema/estado` aparece: o JavaScript da página nunca chegou a rodar, então a rota segurada nunca foi usada.

O `load` não veio porque o navegador, com a rede do perfil (Fast 3G, latência de 562,5 ms) e a CPU ×4, ficou sem receber os scripts e o CSS. Foi uma vez em 174 casos do shard, e os vizinhos (`#84`, `#86`) carregaram a mesma página em 5 s, no mesmo job. É uma trava da primeira carga sob a rede emulada, e não uma regra do produto: não há código da web nem da API para consertar. O que é do teste é depender dessa carga para afirmar o que ela não mede.

O caso afirma o que a seção diz **enquanto o estado não chega** e que o dado a substitui. Quanto a casca leva para baixar na rede lenta é o que mede o primeiro caso da mesma suíte ("com dado… em até 5 s"). Já existe o `carregarSemRedeLenta` (`e2e/__fixtures__/perfis.ts`) para a primeira carga de um caso assim, e este não o usava.

## Teste que reproduz

**Não há vermelho determinístico**, e a razão está na causa: é uma trava da rede emulada que acontece uma vez em centenas de cargas. Na máquina, `npx playwright test e2e/casca.spec.ts -g "carregando: com a resposta" --repeat-each 10 --workers 2` e depois `--repeat-each 40 --workers 8` passaram **50 de 50** antes da correção, sem reproduzir. A evidência que substitui o vermelho é o traço da esteira acima (o que ficou sem resposta, e que o fetch segurado nunca foi pedido), e a prova depois é a estabilidade: o caso e o spec inteiro repetidos (resultado na linha "Correção").

## Correção

`e2e/casca.spec.ts`: a primeira carga do caso "carregando" passa a `carregarSemRedeLenta(page, () => page.goto('/sistema'))`. A CPU continua limitada, e a rede do perfil volta logo depois do `goto`; a resposta segurada, a mensagem "Carregando o estado do sistema…" e a substituição pelo dado continuam como estavam. O comentário no código diz por quê.

Depois: o caso repetido 30 vezes em cada projeto com 2 trabalhadores (60 de 60 verdes, 2 s cada contra 4 s antes, porque não paga a rede do perfil na carga) e o `e2e/casca.spec.ts` inteiro com `--repeat-each 3 --workers 2` (132 de 132 verdes).

## Mutações

Nenhuma. A cláusula nova tira uma causa de ambiente (a trava da primeira carga na rede emulada), e remover o `carregarSemRedeLenta` deixa o caso verde na máquina, como antes: não há teste que fique vermelho sem ela, e fingir um bloco `mutacao` seria afirmar um vermelho que não acontece.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer 1ª | "Vale o `/retro` acompanhar a esteira para confirmar que o caso não volta a estourar. Se voltar, a causa é outra." | `/retro` da spec telas-da-coordenacao: acompanhar a esteira; não é mudança de código |
| test-engineer 1ª | A causa é hipótese apoiada no traço, não confirmada: registrar que, se a trava aparecer em outro caso que carrega na rede lenta, a investigação vai para o servidor estático da esteira (limite de conexões por host com os dez `modulepreload` e latência de 562 ms) e não para mais um `carregarSemRedeLenta`, que tiraria a prova da regra 50.1 | `/retro` da spec; o texto sai do documento da correção e do traço, e `docs/mvp-rapido.md` não é arquivo desta correção |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-17 13:35:13 | 2026-10-17 13:35:27 | `frontend-reviewer` | 1 | APROVADO | aaa57c28fd31e6e4b |
| 2026-10-17 13:35:17 | 2026-10-17 13:36:16 | `test-engineer` | 1 | APROVADO | a3901c0f52c078cee |
