# Correção — dois testes oscilam na esteira: o desafio com o Redis que volta da pausa e o foco do "Meus dados" depois de a lista mudar

**Origem:** esteira run 39803274227 (`2fe1d73`, só documento sobre `f6913ee`, onde os dois passaram)
**Subagentes obrigatórios:** `infra-guardian`, `privacy-guardian`, `frontend-reviewer`
<!-- Quem dita os guardiões é o Orquestrador, no pedido, e a Mesa confere a linha contra os arquivos alterados:
     quem corrige não escolhe quem o audita. test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

1. `apps/api/src/sessao/desafio.int.test.ts` › "falha (15.5): Redis de fila travado…" (linha 88): o último passo,
   `consumo.consumir(await emitir())` com o Redis de volta, rejeitou com `NAO_AUTENTICADO` em vez de resolver
   (`ConsumoDeDesafio.#semRedis`, `desafio.ts:188`). Job `integração`, 119 arquivos, 999 s.
2. `e2e/meus-dados.spec.ts:156` [celular] (linha 213): `document.activeElement === document.body` deu `true` quando o
   teste esperava `false`, logo depois de o diálogo "Baixar os seus dados" fechar. Job `e2e 5/7`.

## Fora desta correção

Nada. Fora do pedido: o job `verificar` da mesma esteira também reprovou, em
`packages/nucleo/src/ia/ouro.test.ts` (três casos de "o leitor do ouro"). É outro defeito, de outro arquivo, e vai ao
Orquestrador no relatório, não a esta correção.

## Causa

1. **O prazo de 100 ms do cliente de produção, medido na primeira resposta depois da pausa.** O teste prova o corte com o
   cliente da API (`commandTimeout` de 100 ms), trava o Redis com `CLIENT PAUSE` por 3 s e, quando a pausa acaba, exige que
   o **primeiro** `SET NX` volte dentro dos mesmos 100 ms. Nessa hora o Redis ainda esvazia os comandos retidos (o `EXISTS`
   e o `SET` que passaram do prazo, mais o `PING` da conexão da pausa) e o processo de teste divide a máquina com outros
   arquivos de integração: numa esteira carregada a resposta passa dos 100 ms, e o corte, que é o que o código de produção
   deve fazer, recusa o desafio. O defeito é do teste, que tomou "voltou" por "respondeu em 100 ms". É a mesma família da
   correção `2026-09-18-contador-testado-com-o-prazo-de-producao`.
2. **Foco perdido pelo produto, não só pelo teste.** `useDialogoModal` devolve o foco a quem abriu se ele ainda está na
   página (`quemAbriu.isConnected`) e só usa o `focoDeReserva` se já saiu. Em "Meus dados" o botão "Baixar meus dados" sai da
   lista quando a releitura (disparada pela falha do download) chega. Se ela chega **antes** de "Fechar", o diálogo
   desmonta com o botão já fora e o foco vai para a tela. Se chega **depois**, o foco volta ao botão, que logo sai da lista, e
   o navegador o põe no `body`: ninguém mais o move (regra 50, item 11). A ordem depende da máquina: na esteira, no
   projeto `celular`, a releitura demorou mais que o toque em "Fechar". O teste só conferiu uma vez, e viu o `body`.

## Teste que reproduz

1. `apps/api/src/sessao/desafio.int.test.ts` › o mesmo caso: depois de `travado.fim` (a pausa de 3 s, que já prova o corte
   de 100 ms), a aceitação passa a ser esperada por `expect.poll` com desafio novo a cada tentativa, e a recusa que vier
   enquanto isso tem de ser `NAO_AUTENTICADO`. Vermelho antes: a asserção antiga (`resolves.toBeUndefined()` logo depois da
   pausa), com o Redis voltando devagar (uma pausa de 250 ms provocada só para reproduzir, em arquivo temporário já
   apagado), é recusada na mesma linha que a esteira (saída em "Estabilidade"). O teste que fica não tem essa pausa: ela
   dependia do atraso do laço de eventos entre o `CLIENT PAUSE` e o `SET`, a mesma oscilação no sentido contrário.
2. `e2e/meus-dados.spec.ts` › "o arquivo que saiu enquanto a pessoa lia e a lista que só é relida depois de o diálogo
   fechar…": retém a releitura, fecha o diálogo, solta a releitura e confere que o foco está no contêiner da tela (o `div`
   com `tabIndex={-1}` que guarda a lista), e não no `body` nem em outro elemento. Vermelho antes da correção (saída abaixo).

## Correção

1. **Desafio (só teste).** `desafio.int.test.ts`: o corte de 100 ms continua provado pela pausa de 3 s; depois dela o teste
   espera, com `expect.poll` e desafio novo a cada tentativa, o desafio ser aceito, e confere que a recusa de enquanto é a
   `NAO_AUTENTICADO` (outra recusa aparece na mensagem do poll). O código de produção (`desafio.ts`) não muda: o corte de
   100 ms continua o que a API faz.
2. **Foco do "Meus dados" (produto + teste).** `MeusDados.tsx`: o botão de baixar virou `BotaoDeBaixar`, que na limpeza do
   efeito de layout, com o botão ainda na página, leva o foco à tela se for ele quem o tem. Sem estado entre renders, e
   quem já foi para outro controle não perde o dele. `e2e/meus-dados.spec.ts`: o ajudante
   `fecharODialogoComALeituraRetida` segura a releitura até o teste soltá-la, e dois casos usam: o foco vai para a tela
   quando o botão sai com ele, e o foco que a pessoa já levou a outro controle nunca passa por outro elemento (a tela
   o toma por um instante e o devolve com a guarda tirada, por isso o caso registra cada `focusin`, e não só o foco final).

## Estabilidade

- `desafio.int.test.ts` sozinho, dez vezes seguidas (arquivo inteiro, três casos): 10 de 10 verdes.
- Vermelho da asserção antiga com o Redis voltando devagar (pausa de 250 ms provocada só para reproduzir, em arquivo
  temporário apagado; o teste que fica não a tem): `AssertionError: promise rejected
  "ErroDeDominio: NAO_AUTENTICADO" instead of resolving`, na mesma linha que a esteira.
- `e2e/meus-dados.spec.ts` inteiro: com o caso novo e o código antigo, vermelho nos dois projetos
  (`Expected: false / Received: true` em `document.activeElement === document.body`); com a correção, 32 verdes
  (16 por projeto). Sem a guarda do segundo caso, o foco final continuava no outro controle (verde), e o portão
  acusou: o caso passou a registrar os `focusin` e ficou vermelho nos dois projetos com a guarda tirada.

## Mutações

```mutacao
arquivo: apps/web/src/componentes/meus-dados/MeusDados.tsx
teste: e2e/meus-dados.spec.ts › o arquivo que saiu enquanto a pessoa lia e a lista que só é relida depois de o diálogo fechar: o botão sai com o foco nele, e o foco vai para a tela, e não para o corpo da página
    return () => {
-      if (document.activeElement === elemento) reserva.current()
    }
```

```mutacao
arquivo: apps/web/src/componentes/meus-dados/MeusDados.tsx
teste: e2e/meus-dados.spec.ts › com a lista relida depois de o diálogo fechar, o foco que a pessoa já levou a outro controle fica onde ela o pôs
-      if (document.activeElement === elemento) reserva.current()
+      reserva.current()
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| privacy-guardian (1ª) | Conferir que os `jti` recusados no corte não ficam gravados além do Redis de fila | Recusada, sem mudança de código: o `jti` só vai ao `SET … PX … NX` do Redis de fila, com prazo até o desafio vencer (`desafio.ts`, `ConsumoDeDesafio.consumir`), e `desafio.ts` não muda |
| frontend-reviewer (1ª) | A vitrine não tem pedido com arquivo pronto, e as fotos não mostram o botão nem o diálogo | `TODO.md` (é `tools/vitrine/`, fora desta correção) |
| frontend-reviewer (1ª) | Confirmar que o vermelho de `verificar`/`ouro.test.ts` foi ao Orquestrador | Não é código: o Implementador o diz no relatório ao Orquestrador, como o documento já manda |
| frontend-reviewer (1ª) | Comentário sobre o desafio novo a cada tentativa | Nada a fazer: o revisor diz que o comentário que existe basta |
| test-engineer (1ª) | Caso que espere "Arquivo apagado" na lista antes de tocar em "Fechar", para provar de forma fixa a ordem em que o `focoDeReserva` do diálogo vale | `TODO.md`: pede um ajudante novo (a releitura chegando antes de "Fechar"), não cabe em poucas linhas, e o `useDialogoModal` não foi alterado |
| test-engineer (1ª) | Trocar o botão sintético do segundo caso por um controle real da tela | Recusada: o botão posto no `body` isola a guarda que o caso prova, e o registro de cada `focusin` já cobre o que importa |
| test-engineer (1ª) | Não rodou `desafio.int.test.ts`: `@educa/nucleo` sem compilar neste checkout | Sem ação: o portão da tarefa roda o arquivo; a rodada seguinte vale pelo portão |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-22 16:21:32 | 2026-10-22 16:21:56 | `privacy-guardian` | 1 | APROVADO | a15c4120e510f336b |
| 2026-10-22 16:21:35 | 2026-10-22 16:22:04 | `frontend-reviewer` | 1 | APROVADO | a069ea48fa33f71d9 |
| 2026-10-22 16:21:29 | 2026-10-22 16:22:18 | `infra-guardian` | 1 | APROVADO | a5c809072499ed626 |
| 2026-10-22 16:21:26 | 2026-10-22 16:23:06 | `test-engineer` | 1 | REPROVADO | ac6cad8844e93ef7f |
| 2026-10-22 16:47:43 | 2026-10-22 16:48:23 | `test-engineer` | 2 | APROVADO | abfcc74825eacb0e1 |
