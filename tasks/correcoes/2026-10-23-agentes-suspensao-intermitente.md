# Correção — a entrada da coordenação nos e2e fica 90 s esperando um link quando o Redis de fila para por 2 s

**Origem:** esteira run 39996698191 em `a691e02` (`gh run view 39996698191 --log-failed`), job `e2e 1/7`: `e2e/agentes.spec.ts:230`, projeto `chromebook`, `locator.click` estourou os 90 s. O commit era só de documento, e a `develop` estava verde.
**Subagentes obrigatórios:** `conformidade-reviewer`, `frontend-reviewer`, `test-engineer`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. O `test-engineer` é de toda correção. A correção altera 3 arquivos fora de `tasks/` e não toca `.github/`, `tools/ci/` nem `tools/processo/`: não passa do limite do passo 5 de `corrigir`. -->

## Sintoma

`agentes.spec.ts:230` (a função que outra pessoa já suspendeu) morreu em `entrar` → `entrarComoCoordenacaoNaMesmaAba`, no
`acionar(page.getByRole('link', { name: 'Ir para a entrada' }))` (`e2e/__fixtures__/casca.ts:217`), com
`locator.click: Test timeout of 90000ms exceeded. waiting for getByRole('link', { name: 'Ir para a entrada' })`. Foi 1 falha em 188 casos
do job, e nenhum outro caso de `agentes.spec.ts` falhou. O caso não chegou a tocar na suspensão, que é o que ele prova.

## Fora desta correção

Nada: a árvore estava limpa.

## Causa

Não é a suspensão nem o teste dela. O instantâneo da página no traço (`traco-do-e2e-1`) mostra a tela "Configurar o segundo fator" **com o código
certo digitado** (`980879`, que é o do passo da hora do pedido, conferido contra o segredo da própria tela) e o aviso "Código incorreto ou já usado".
A API respondeu `POST /v1/conta/mfa/ativar` com 401 em 2 038 ms, e o log dela tem, no mesmo segundo,
`login.desafio_sem_redis` seguido de `http.erro 401 NAO_AUTENTICADO`. O log do `redis-fila` tem, 7 s antes,
`Asynchronous AOF fsync is taking too long (disk is busy?)`.

O encadeamento: o disco do runner estava ocupado, o Redis de fila não respondeu em 2 s (`LOGIN_REDIS_PRAZO_MS` do compose de teste, o
prazo que o desenho dá a `local`, onde uma resposta mais lenta é da máquina), e `ConsumoDeDesafio.conferirLivre` **recusa de propósito** o
desafio sem a marca do Redis (Tech Spec, seção 4; `desafio.int.test.ts` 15.5). A recusa vem antes de gastar o código e o desafio. Nada da API
está errado, e a tela diz o que fazer ("tente de novo").

O defeito é do teste: a fixture clica em "Ativar o segundo fator" e **espera pelo link que só aparece no sucesso, sem prazo próprio**. O prazo
que vale é o do teste inteiro, e o aviso que a tela deu fica sem ser lido: são 90 s até um erro que não diz nada ("waiting for link"), em vez de
uma repetição que resolve, ou de uma falha que diz o que a tela mostrava. As 55 specs que entram como coordenação por `entrarComoCoordenacaoNaMesmaAba`
têm a mesma exposição.

## Teste que reproduz

`e2e/mfa.spec.ts` › `a ativação recusada uma vez com o código certo, porque o Redis de fila não respondeu: a entrada do teste tenta de novo e a coordenação entra`.
A rota `POST /v1/conta/mfa/ativar` responde 401 `NAO_AUTENTICADO` na primeira vez e deixa passar da segunda em diante, que é o que a API faz com o Redis parado (e o
que gasta nada). Não dá para parar o Redis de fila de verdade num e2e que roda em paralelo com os outros 187 casos, e por isso a recusa é a da API, na rede.
Sem a correção, o caso fica vermelho do jeito do sintoma: espera o link até o relógio acabar.

## Correção

Só a fixture e o teste dela; a API, a web e o `agentes.spec.ts` ficam como estão.

- `e2e/__fixtures__/casca.ts`: a ativação do segundo fator de `entrarComoCoordenacaoNaMesmaAba` passa a `ativarOSegundoFator`, que depois de clicar
  espera **o link ou o aviso de recusa** (`ativou.or(recusa)`, com o `PRAZO_DA_ENTRADA_MS`), e não só o link. Com o aviso, digita o código do passo de
  agora e clica de novo, até `TENTATIVAS_DA_ATIVACAO` (2). A segunda recusa lança um erro que diz o que a tela mostrava. Repetir é seguro porque
  a recusa do Redis vem antes de gastar o código e o desafio (`MfaService.ativar`: `#desafioLivre` antes de `consumir`), e a ativação seguinte
  usa um passo maior (`+30`), como antes. A segunda recusa não é engolida: o caso falha em 20 s, no lugar certo, e não em 90 s.
- `e2e/mfa.spec.ts`: o caso que reproduz (acima), que usa a fixture de verdade.
- Fica de fora, de propósito: o Redis de fila do compose de teste (`appendfsync`), o prazo de 2 s e o corte de 100 ms de produção. Mexer neles é
  `infra/` e desenho (`infra-guardian`), e o aviso `Asynchronous AOF fsync is taking too long` é do disco do runner, que a fixture não controla.
  O passo seguinte da mesma fixture (o código do segundo fator na entrada) pode ser recusado pela mesma causa, mas falha em 20 s, no
  `toHaveURL` do Painel, e com o erro certo; não é o espera-cega que gastou os 90 s, e não foi visto na esteira.

## Estabilidade

`agentes.spec.ts` › "a função que outra pessoa já suspendeu…" não foi alterado e não tem o defeito: ele é só o primeiro a entrar por esta fixture na hora
em que o Redis parou. A prova da fixture é o caso novo, que força a recusa. O caso intermitente, rodado sozinho dez vezes seguidas com os 2 trabalhadores
da esteira: 10 de 10 verdes no `chromebook`, 2 trabalhadores, 2,3 min (`npx playwright test e2e/agentes.spec.ts -g "outra pessoa já suspendeu" --project chromebook --repeat-each 10 --workers 2`).
Dez verdes não provam o que a esteira viu, uma vez em 188, e por isso não são a prova da correção: a do caso novo é o vermelho antes (90 s, os dois projetos) e o verde depois (13 s).

## Mutações

```mutacao
arquivo: e2e/__fixtures__/casca.ts
teste: e2e/mfa.spec.ts › a ativação recusada uma vez com o código certo, porque o Redis de fila não respondeu: a entrada do teste tenta de novo e a coordenação entra
-const TENTATIVAS_DA_ATIVACAO = 2
+const TENTATIVAS_DA_ATIVACAO = 1
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | O `throw` que diz o que a tela mostrava (`e2e/__fixtures__/casca.ts`, fim de `ativarOSegundoFator`) não tem teste nem mutação; um caso com `test.fail()` e duas recusas forçadas provaria a mensagem | Recusada: aprovou. Pede caso novo e bloco de "Mutações" novo, que não cabem em "poucas linhas" nem sem mudar o que a correção entrega; a regra que a correção conserta (a segunda tentativa) está provada pela mutação `TENTATIVAS_DA_ATIVACAO` |
| test-engineer (1ª), frontend-reviewer (1ª) | O passo seguinte da mesma fixture (o código do segundo fator na entrada) pode ser recusado pela mesma causa do Redis lento | Para o `/retro`, caso volte na esteira; o documento já declara em "Correção" que falha em 20 s com o erro certo |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 17:37:02 | 2026-10-23 17:37:22 | `conformidade-reviewer` | 1 | APROVADO | ab43df644eac9bc11 |
| 2026-10-23 17:37:01 | 2026-10-23 17:37:28 | `frontend-reviewer` | 1 | APROVADO | a4f131a31a0543677 |
| 2026-10-23 17:36:59 | 2026-10-23 17:38:07 | `test-engineer` | 1 | APROVADO | ac9c5aea40aabd8f4 |
