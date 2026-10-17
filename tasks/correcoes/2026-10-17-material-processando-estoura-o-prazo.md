# Correção — o teste "Processando" por "Pronto" do Material gasta quase os 30 s do e2e só no preparo e nas leituras, e a espera de 4 s no fim não cabe

**Origem:** esteira run 39054499168 da `spec/telas-da-coordenacao` (`5ecda3f`): `e2e/material.spec.ts:180` (`enquanto o material está sendo lido a tela consulta sozinha, e troca "Processando" por "Pronto" sem recarregar`) em `Test timeout of 30000ms exceeded` no `chromebook`, na linha 214 (`page.waitForTimeout(4_000)`). 1 falha em 179. O teste veio da tarefa 8.0 (`652932f`).
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- O `frontend-reviewer` veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção mexe em um arquivo fora de `tasks/` (o spec), abaixo do limite de 5, e fora de `.github/`, `tools/ci/` e `tools/processo/`. -->

## Sintoma

```
Test timeout of 30000ms exceeded.
Error: page.waitForTimeout: Test timeout of 30000ms exceeded.
> 214 |     await page.waitForTimeout(4_000)
```

Nenhuma asserção falhou. O mesmo caso passou no `celular` da mesma execução, e os 14 vizinhos do spec passaram no `chromebook` (de 17,2 s a 33,5 s: o de `:494`, que leva `test.slow()`).

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa.

## Causa

**Tempo do teste, e não da tela.** Lido o trace da esteira (`traco-do-e2e-2`), o caso gasta:

| Instante | O que acontece |
|---|---|
| 0,0 a 7,3 s | `criarEquipeComSenha` e `montarEstruturaNoBanco`, antes do `goto` |
| 7,3 a 15,1 s | entrada pela tela (senha, código, segunda entrada), até o `toHaveURL` do painel |
| 15,1 a 21,3 s | ir pelo menu até Material |
| 21,3 a 23,7 s | "Processando" visível e o `status` ligado |
| 24,9 e 26,4 s | as duas leituras seguintes da lista (a de 1,5 em 1,5 s, na rede do perfil) |
| 26,8 s | "Pronto · 6 páginas" visto; começa a espera fixa de 4 s |
| 30,0 s | o relógio do Playwright mata o caso, 0,8 s antes de a espera terminar |

A tela está certa: o polling rodou, trocou "Processando" por "Pronto" e (pelo contador de leituras) parou. O caso é que ele **soma** o preparo (21 s no runner), a troca (5,5 s) e uma espera fixa de 4 s, e o relógio é o de 30 s do Playwright. Os outros casos do spec fecham em 17 a 25 s e não têm a troca nem a espera. Além disso, o `PRAZO_DA_LEITURA_MS` do spec é de 30 s, igual ao teste inteiro: a asserção da linha 209 tem uma espera que, sozinha, cabe no relógio todo, e nada no caso diz que o teste tem de caber nele.

Medido aqui (máquina mais rápida que o runner), o mesmo caso leva 22,5 s no `chromebook` na execução inteira do spec: já a 7,5 s do relógio. Não é "aumentar o timeout" no escuro: o caso que espera uma leitura de 1,5 s duas vezes e prova que ela parou **precisa** de uns 6 s a mais que o resto, e o spec já trata assim o outro caso lento dele (`:494`, `test.slow()`).

## Teste que reproduz

Reproduzir o relógio do runner não é determinístico, mas o que o produz é: **o caso mede 22 s aqui e 31 s na esteira**, e qualquer máquina mais lenta que a minha o passa de 30 s. Para forçar isso, o mesmo caso com um relógio menor (`--timeout=18000`, nos dois projetos, duas repetições), **antes da correção**:

```
npx playwright test e2e/material.spec.ts -g "consulta sozinha" --timeout=18000 --repeat-each 2 --workers 2
```

Resultado: **4 de 4 vermelhos** (`Test timeout of 18000ms exceeded`, na linha 209 e na 214).

## Correção

Só teste muda; o produto não.

- `e2e/material.spec.ts`: o caso ganha `test.slow()` na primeira linha, como o do `:494`, com o motivo num comentário. O relógio do caso passa de 30 s para 90 s. Nenhuma asserção muda ou sai, e a espera fixa de 4 s fica: ela é a prova de que a consulta parou (mais de duas voltas de 1,5 s).
- `e2e/material.spec.ts`, 1ª ordem da Mesa (item 1, `test-engineer`): o título do caso diz "sem recarregar", mas ele não conferia. Passa a pôr a marca `window.semRecarga` com a página já aberta e "Processando" visível, antes da troca, e a conferir depois de `toHaveCount(0)`, como o caso de `:116` (linhas 121-123 e 142). Uma recarga apagaria a marca.

O que **não** muda: o `PRAZO_DA_LEITURA_MS` (30 s, agora dentro de um relógio de 90 s), a tela e as demais asserções.

## Estabilidade

Depois da correção, o mesmo comando do vermelho, e depois o caso rodado sozinho dez vezes seguidas, nos dois projetos, com os dois trabalhadores da esteira. Resultado:

- o comando do vermelho (`--timeout=18000`, duas repetições por projeto): **4 de 4 verdes** (23,9 s o mais lento), contra os 4 vermelhos de antes;
- `npx playwright test e2e/material.spec.ts -g "consulta sozinha" --repeat-each 10 --workers 2`, relógio normal: **20 de 20 verdes** (dez por projeto), o mais lento a 23,9 s. Com `test.slow()` o relógio do caso é de 90 s, e o mais lento usa 27% dele.

## Mutações

Correção só de teste: não há cláusula de produto a mutar. O relógio do caso se prova pelo vermelho com o relógio menor e pela estabilidade, acima. A conferência nova da marca tem o seu bloco: uma recarga da página entre a troca e a conferência apaga a marca, e o caso tem de ficar vermelho.

```mutacao
arquivo: e2e/material.spec.ts
teste: e2e/material.spec.ts › enquanto o material está sendo lido a tela consulta sozinha
-await expect(linha.getByText('Processando')).toHaveCount(0)
+await page.reload()
 expect(await page.evaluate(() => (window as unknown as { semRecarga?: boolean }).semRecarga)).toBe(true)
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | Trocar a espera fixa `page.waitForTimeout(4_000)` por `page.clock` | Não aplicar: muda como a prova de que a consulta parou é feita, e o relógio falso interage com os temporizadores do polling da tela. Não é barata nem neutra. Fica para o `/retro` da spec |
| test-engineer (1ª) | Atacar a causa de fundo: os ~21 s de preparo (entrada pela tela e ida pelo menu) em todo caso de `abrirMaterial`; abrir a sessão por fixture nos casos que não testam a entrada | Não aplicar: mexe em vários casos do spec, fora desta correção. `/retro` da spec |
| frontend-reviewer (1ª) | A vitrine cheia não tem material com dado: semear um para fotografar a tabela e os estados "Processando" e "Pronto" | Não aplicar: é de `tools/vitrine/`, fora desta correção. `TODO.md` |
| frontend-reviewer (1ª) | No celular (360 px) a aba "Material" quebra para a segunda linha da barra de abas de Escola; avaliar rolagem ou rótulos mais curtos | Não aplicar: não é defeito desta correção e é decisão de tela. `TODO.md` |
| test-engineer (2ª) | A marca `semRecarga` só é posta depois de "Processando" aparecer, cerca de 1,5 s antes da segunda leitura: uma recarga na primeira leitura passaria sem ser vista | Recusada: o risco é baixo, é o mesmo padrão do caso de `:116`, e o próprio revisor não exige correção. Aprovou, e na 2ª rodada só entra recomendação de quem reprovou |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-17 16:36:42 | 2026-10-17 16:37:34 | `test-engineer` | 1 | APROVADO | a90bd37116b22ace0 |
| 2026-10-17 16:36:39 | 2026-10-17 16:39:09 | `frontend-reviewer` | 1 | APROVADO | a7ce1059028e88335 |
| 2026-10-17 16:54:58 | 2026-10-17 16:55:21 | `test-engineer` | 2 | APROVADO | a59867959d783ebf0 |
