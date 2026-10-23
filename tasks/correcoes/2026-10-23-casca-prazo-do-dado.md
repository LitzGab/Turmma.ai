# Correção — o caso "com dado… em até 5 s" da casca mede o degrau da espera do Playwright, e passa de 5 s com o dado já na tela

**Origem:** esteira `39896375281` (commit `d6eb2f0`, 5117 ms) e `39907941527` (`develop`, pouso `5566974`, 5018 ms); item "(X5, esteira) `e2e/casca.spec.ts:67`" do `TODO.md`; pedido do Orquestrador em 23/10/2026. Intermitente, só no `celular`.
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- O `frontend-reviewer` veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção mexe em um arquivo fora de `tasks/` (o spec), abaixo do limite de 5, e fora de `.github/`, `tools/ci/` e `tools/processo/`. -->

## Sintoma

```
dado na tela em 5117 ms
Expected: <= 5000
Received: 5117
> 73 |     expect(decorrido, `dado na tela em ${decorrido} ms`).toBeLessThanOrEqual(PRAZO_DO_DADO_MS)
```

Duas vezes na esteira (5117 ms e 5018 ms), e uma terceira vez 151 ms acima, em `a0f1974`: sempre **poucos décimos acima** de 5000, nunca longe. Na máquina o caso passa com 4,3 s.

## Fora desta correção

Nada: nenhuma tarefa em curso na árvore. Os outros dois e2e do `celular` que caíram uma vez na `develop` (`areas.spec.ts:647` e `troca-de-escola.spec.ts:156`) ficam fora: não medem o dado, e o TODO manda tratá-los se caírem de novo.

## Causa

O caso mede `Date.now() - inicio` **depois** de `esperarEstadoComDado`, isto é, o instante em que a asserção do Playwright **percebeu** o dado, e não o instante em que ele **apareceu**. As asserções de `expect(...)` conferem em degraus fixos (100, 250, 500 e 1000 ms): depois de a página carregar, o caso olha em +0, +100, +350, +850 e +1850 ms, e o que chega entre dois degraus só é visto no seguinte.

Medido na máquina, no `celular`, com um `MutationObserver` na página gravando o `Date.now()` em que as duas linhas da seção passam a dizer "Disponível" (12 execuções, 3 trabalhadores):

| | instante |
|---|---|
| `page.goto` volta (evento `load`) | ~3,48 s |
| dado **na tela** (na página) | ~4,10 a 4,15 s |
| dado **percebido** pelo caso (o que ele mede) | ~4,35 a 4,40 s, o degrau de +850 ms |

A tela do dado leva ~4,1 s: documento (616 ms, a latência do perfil), 17 pedidos de script e estilo em banda de 1 Mbps (~1,5 s), o `index` executado com a CPU ×4 (~0,6 s) e, só então, o pedido do estado (~0,6 s de latência). Quando a esteira leva perto do dobro na CPU, o dado aparece perto de 4,8 s e o degrau de +850 ms cai antes dele: o caso só o vê no degrau seguinte, ou lê o instante do degrau que passou de 5000. Por isso o valor cai sempre colado acima do limite (5018, 5117) em vez de se espalhar: é um degrau, não a duração do produto.

O produto não mudou entre as execuções verdes e as vermelhas, e a margem real do dado (~0,9 s na máquina) é a que o perfil fraco deixa. O que o caso afirma — o dado na tela em até 5 s, com a CPU ×4 e a rede móvel lenta — continua certo; o que estava errado era **o relógio** que o conta.

## Teste que reproduz

Um caso novo em `e2e/casca.spec.ts`, "o prazo do dado conta quando o dado aparece na tela, não quando o teste o percebe": segura a resposta do estado por 1,45 s depois de o pedido sair (logo depois de um degrau da espera, que na máquina cai em ~1,36 s), entrega o dado falso e exige que o instante medido fique a no máximo 250 ms da entrega (a pintura com a CPU ×4). Com o relógio do caso (o instante em que a asserção percebe), a percepção vem no degrau seguinte, ~1,87 s depois do pedido: a distância é de ~0,42 s, e o caso fica vermelho. Resultado do vermelho e do verde na linha "Correção".

## Correção

`e2e/__fixtures__/dado-na-tela.ts` (novo, para o `casca.spec.ts` ficar abaixo das 800 linhas do lint) e `e2e/casca.spec.ts`: `vigiarODado(page)` (antes do `goto`) instala um `MutationObserver` que grava o `Date.now()` em que as linhas "API" e "Banco de dados" passam a dizer "Disponível", e `instanteDoDado(page)` espera a asserção de sempre (`esperarEstadoComDado`, que continua sendo a prova de que o dado está na tela, pelo papel e pelo texto) e devolve esse instante. O caso "com dado" mede `instanteDoDado - inicio` contra os mesmos `PRAZO_DO_DADO_MS = 5_000`: o prazo, o perfil (CPU ×4 e rede móvel lenta), a API real e o `inicio` antes do `goto` são os mesmos; só deixa de contar o degrau da espera, de até meio segundo e mais.

O caso novo, "o prazo do dado conta quando o dado aparece na tela, não quando o teste o percebe", trava o relógio: entrega o estado 1,45 s depois do pedido, logo depois de um degrau da espera, e exige que o instante medido fique a no máximo 250 ms da entrega (`PINTURA_DO_DADO_MS`).

**Antes (relógio do degrau):** 418 a 432 ms da entrega ao instante medido, vermelho em 6 de 6 execuções (3 por projeto). **Depois (instante da página):** ~12 ms, verde. O caso "com dado" repetido 10 vezes em cada projeto com 2 trabalhadores, junto do caso novo: 40 de 40 verdes; o `e2e/casca.spec.ts` inteiro com `--repeat-each 2 --workers 3`: 96 de 96 verdes.

A margem real do dado, medida na página, continua a do perfil fraco: ~4,1 s contra 5 s na máquina. Esta correção tira da conta o degrau da espera (por isso o valor da esteira ficava colado em 5000); não dá ao produto folga que ele não tem. Se a esteira voltar a passar de 5 s com o instante da página, aí é o produto (a primeira carga leva ~3,4 s, dos quais ~1,5 s são banda de 1 Mbps para ~170 KB de script e estilo), e a investigação vai para o peso da primeira carga, não para este caso.

## Mutações

O relógio volta a ser o do degrau: o caso novo precisa ficar vermelho.

```mutacao
arquivo: e2e/casca.spec.ts
teste: e2e/casca.spec.ts › o prazo do dado conta quando o dado aparece na tela, não quando o teste o percebe
-  return instante ?? 0
+  return Date.now()
```

O prazo passa a ser menor do que o produto leva: o caso "com dado" precisa ficar vermelho (o prazo continua valendo).

```mutacao
arquivo: e2e/casca.spec.ts
teste: e2e/casca.spec.ts › com dado: versão e componentes vindos da API real, em até 5 s, sem rolagem horizontal e sem violação grave
-const PRAZO_DO_DADO_MS = 5_000
+const PRAZO_DO_DADO_MS = 3_000
```

O vigia olha a página inteira: um aviso que diga "API Disponível" faz o caso novo gravar o instante antes da entrega do estado, e ele fica vermelho (o caso novo agora serve dois avisos assim).

```mutacao
arquivo: e2e/__fixtures__/dado-na-tela.ts
teste: e2e/casca.spec.ts › o prazo do dado conta quando o dado aparece na tela, não quando o teste o percebe
-      Array.from(secaoComponentes()?.querySelectorAll('li') ?? []).some((item) => (item.textContent ?? '').includes(nome) && (item.textContent ?? '').includes('Disponível'))
+      Array.from(document.querySelectorAll('li')).some((item) => (item.textContent ?? '').includes(nome) && (item.textContent ?? '').includes('Disponível'))
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | Registrar no `TODO.md` a margem real do dado (~4,1 s contra 5 s) | Recusada: a seção "Correção" deste documento já registra a margem e diz para onde vai a investigação se a esteira voltar a passar de 5 s com o instante da página (o peso da primeira carga); o item do `TODO.md` que originou a correção é fechado por esta correção |
| frontend-reviewer (1ª) | Subir `PINTURA_DO_DADO_MS` (250 ms) se o caso novo ficar intermitente | Recusada agora: folga de ~20× sobre os ~12 ms medidos; é gatilho condicional, sem nada a mudar hoje |
| frontend-reviewer (1ª) | A margem real do dado é do perfil fraco; se a esteira passar de 5 s com o instante da página, investigar o peso da primeira carga | Já registrada na seção "Correção" deste documento; sem ação |
| test-engineer (2ª) | `dado-na-tela.ts:20` reconhece a seção pelo texto do título igual a `'Componentes'`; se o `<h2>` ganhar ícone ou contador, o vigia não acha a seção e o caso falha com mensagem que culpa o `goto`. Reconhecer pelo `id` do título ou citar o motivo na mensagem do `expect` | Recusada agora: o título é texto puro hoje e os dois casos falham alto se ele mudar; fica para a tarefa futura que alterar o título de "Componentes" |
| test-engineer (2ª) | Uma linha no JSDoc de `vigiarODado` dizendo que a busca pela seção deve continuar igual à de `secaoComponentes` | Recusada agora: a segunda rodada só aceita recomendação de quem reprovou; fica para quando uma tarefa futura tocar `dado-na-tela.ts` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 09:17:41 | 2026-10-23 09:17:59 | `frontend-reviewer` | 1 | APROVADO | a23477c6f1cb360e7 |
| 2026-10-23 09:17:38 | 2026-10-23 09:18:47 | `test-engineer` | 1 | APROVADO | a1bcf20c6b024c1a6 |
| 2026-10-23 09:27:14 | 2026-10-23 09:27:52 | `test-engineer` | 2 | APROVADO | ae88bb6cb1af78c3e |
