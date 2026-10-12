# Correção — o caso da lista de nomes da Estrutura leva 72 a 78 s com 90 s de limite, e a esteira o estoura

**Origem:** esteira run 38261610727, job `e2e 3/4`, projeto `celular`, commit `4956a51` em `correcao/2026-10-12-teste-de-componente`; a causa foi descrita no item 4 de "Devolvido sem corrigir" de `tasks/correcoes/2026-10-12-codigo-cru-no-nome-sintetico.md`. Pedido do Orquestrador em 12/10/2026.
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- O PEDIDO ditou `frontend-reviewer`. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral` só entra se a correção passar de 5 arquivos fora de `tasks/` ou tocar `.github/`, `tools/ci/` ou `tools/processo/`: ela altera um arquivo de e2e. -->

## Sintoma

`e2e/estrutura.spec.ts:732` (`a lista paginada, sem releitura ao voltar para a aba; …; o erro`) estoura `Test timeout of 90000ms exceeded` na esteira, com a asserção do alerta da leitura da lista ainda esperando depois do `page.reload()`. O caso leva de 72 s a 78 s, e o limite é de 90 s (`test.slow()`: 30 s × 3). A mesma fatia passou na `develop` em `8968328`.

## Fora desta correção

Nada: nenhuma tarefa em curso.

Não entra, por pedido do Orquestrador: o item 3 do mesmo documento (`aluno-fluxo.spec.ts:199`, o `Hoje: 0 de 60 perguntas`), que espera decisão do Joaquim.

## Causa

**De quem é: do próprio teste, anterior à correção `2026-10-12-teste-de-componente`.** Um caso só, de umas 350 linhas de fluxo, com `test.slow()`: o limite é 30 s × 3 = 90 s. Ele faz a lista de 101 nomes, a prévia, a resposta atrasada, a gravação recusada, o avulso, a retirada, a navegação por histórico, o erro da lista, a turma aberta com carregando e erro e a turma excluída. Sozinho, na máquina de desenvolvimento, leva 66 s (`celular`); na esteira, de 72 s a 78 s, e na execução 38261610727 passou de 90 s com a asserção da linha 1060 (o alerta da turma recusada, depois do segundo `page.reload()`) ainda esperando. A margem era de 12 s a 18 s em 90, e a máquina da esteira varia mais que isso. Não há defeito de produto: o `Test timeout` vem antes da asserção, e a mensagem `element(s) not found` é o `expect` cortado pelo limite.

O fim do caso (a partir de "Erro: a leitura da lista cai") não depende do que o resto fez, além da turma e do nome da lista: cada trecho põe a sua rota, recarrega a página e confere. Era só o caso ter crescido por soma.

## Teste que reproduz

Defeito de tempo: o "vermelho" é o limite, e o ambiente da esteira é mais lento que o desta máquina. Para reproduzir de forma determinística, o mesmo caso com o limite de 60 s (`npx playwright test e2e/estrutura.spec.ts --project=celular --grep="a lista paginada, sem releitura" --timeout=20000`, com o `test.slow()` triplicando):

- **Vermelho antes:** `Test timeout of 60000ms exceeded`, no mesmo lugar da esteira, `e2e/estrutura.spec.ts:1060` (`getByRole('alert')` da turma recusada, depois do `page.reload()`).
- **Verde depois:** os dois casos, nos dois projetos, três vezes cada, com os 2 trabalhadores da esteira e o mesmo limite de 60 s: 12 de 12, de 37 s a 41 s cada (o antigo ficava em 66 s). A estabilidade, sem o limite apertado: dez execuções seguidas de cada um no `celular`, o projeto que caiu, : 20 de 20 verdes (10 de cada caso), de 40,1 s a 41,3 s, contra o limite de 90 s.

Os casos de que a prova depende:

- `e2e/estrutura.spec.ts › a lista paginada, sem releitura ao voltar para a aba; …; a turma aberta pelo histórico e a volta para a Estrutura` (o que já existia, sem o fim).
- `e2e/estrutura.spec.ts › o erro da leitura da lista com "Tentar de novo"; a turma aberta com o seu carregando e o seu erro; a turma que outra pessoa excluiu entre a prévia e o "Gravar lista"` (o fim, com montagem própria).

## Correção

Só `e2e/estrutura.spec.ts`. O caso se parte no "Erro: a leitura da lista cai":

- O de cima termina em "Voltar para Estrutura" e `esperarEstrutura` (o `abrirTurma` que ficava depois só preparava o fim e saiu).
- O novo monta a sua escola (`criarEquipeComSenha`, `montarEstruturaNoBanco` com uma turma, dois nomes), entra, abre a turma, e traz **sem alteração** os três trechos: o erro da leitura da lista com "Tentar de novo" e a verificação de acessibilidade, a turma aberta com carregando e erro, e a turma que outra pessoa excluiu entre a prévia e o "Gravar lista". Os seletores `campo`, `verPrevia`, `subir` e `previa` que esse último usa são declarados de novo.
- Nenhuma asserção saiu nem mudou, e nenhum prazo foi aumentado: não é `test.setTimeout`. O custo é a montagem do segundo caso, que roda em paralelo com o primeiro (`fullyParallel`).

Não muda: código de produção, `tools/`, `.github/`, `.claude/`.

## Mutações

O caso novo carrega três trechos, e cada mutação tira um deles do código da tela: o caso tem de cair, para provar que o corte não deixou a asserção solta.

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: e2e/estrutura.spec.ts › o erro da leitura da lista com
-        <EstadoCarregando rotulo="Carregando a turma…" />
+        <EstadoCarregando rotulo="Carregando…" />
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: e2e/estrutura.spec.ts › o erro da leitura da lista com
-        ) : nomes.isError ? (
+        ) : nomes.isError && itens.length > 0 ? (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: e2e/estrutura.spec.ts › o erro da leitura da lista com
         [CodigoDeErro.ENTRADA_INVALIDA]: 'A lista tem linha com erro. Nada foi gravado: veja a prévia de novo.',
-        [CodigoDeErro.NAO_ENCONTRADO]: 'Esta turma não está mais no ano letivo em curso. Nada foi gravado.',
+        [CodigoDeErro.NAO_ENCONTRADO]: 'Esta turma saiu do ano letivo.',
```

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-12 13:37:09 | 2026-10-12 13:37:51 | `test-engineer` | 1 | APROVADO | a289313f28e2f9f0c |
| 2026-10-12 13:37:06 | 2026-10-12 13:38:11 | `frontend-reviewer` | 1 | APROVADO | a3ed95c02c584d758 |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | "O caso de cima ainda soma muita coisa: paginação, as travas antes de enviar, a resposta atrasada, a gravação recusada, o avulso e a navegação. Com 40 s de 90, a margem está boa hoje. Vale levar ao `/retro` um limite para e2e de fluxo (por exemplo, partir quando passar da metade do limite na máquina local), para isso não voltar por soma." | `/retro`: é regra de processo, não de código desta correção. Entra na pauta da retrospectiva (o Arquiteto agrupa) |
| frontend-reviewer (1ª) | O campo de arquivo nativo aparece em inglês ("Choose File / No file chosen") na vitrine (Chromium en-US); trocar por botão próprio com `<label>` e `input` oculto, em tarefa de tela. | `TODO.md`: toca `apps/web/src/areas/coordenacao/ListaDaTurma.tsx`, fora desta correção, e muda a tela. No Chromebook em pt-BR o texto nativo já sai em português |
| frontend-reviewer (1ª) | "Quando a esteira rodar a fatia de novo, registre o tempo do primeiro caso para confirmar a folga (o limite é 90 s, e o desenho diz ~41 s)." | Recusada: acompanhamento, sem mudança. O Orquestrador lê o veredito da esteira ao fechar a tarefa seguinte e olha a duração do caso então |
| test-engineer (1ª) | "Não rodei o Playwright, porque outros revisores usam a mesma máquina ao mesmo tempo." | Recusada: observação do revisor, sem exigência. Os números verdes são do documento e do portão da tarefa |
