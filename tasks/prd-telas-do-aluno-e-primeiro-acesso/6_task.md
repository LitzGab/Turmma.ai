# Tarefa 6.0 — A tarefa aberta na pele nova, com a comemoração na entrega

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** 4.0, 5.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A tarefa aberta usa as peças da X1 sem mudar o fluxo, e a `Comemoracao` aparece uma vez, logo depois do envio confirmado nesta tela.

## Contexto necessário

- `techspec.md` seções 7b e 9 ("Tarefa aberta"); `prd.md` RF7, RF8 e RF20; `mockup.md` seção 2.3 (moldura, forma "Entregue agora")
- Regras 50 (itens 5 e 11), 70 (item 3) e 80 (item 6); D59: a comemoração é da entrega, nunca da nota
- Código: `areas/aluno/Atividade.tsx` (`Respondendo`, `envio.onSuccess`, `SemMaisRespostas`, `VOLTAR`); `atividade.ts`;
  `fila-de-respostas.ts`, que não muda. `Comemoracao` e onça são da 5.0; `Tela` e `Botao`, da X1, em `componentes/ui/`

## Subtarefas

- [x] 6.1 — Moldura: `Tela` na largura `leitura`, o mapa de questões e a barra "Anterior" e "Próxima" com as peças da X1 (a barra presa
  embaixo no celular). "Voltar para Atividades" vira "Voltar para Tarefas", e o "não disponível" aponta para Tarefas. Não muda: o
  fluxo, a fila, o diálogo "Enviar a atividade?", o resultado só depois de aprovado, "Atividade enviada", "Pedir ajuda ao Tutor
  nesta questão" e os `data-*`
- [x] 6.2 — `Atividade` guarda `entregueAgora` em estado de tela, ligado só no `onSuccess` do envio; `SemMaisRespostas` mostra a
  `Comemoracao` ("Atividade entregue." e "Quem dá a aula vê a correção antes de você.", com a pose comemorando e "Voltar às tarefas")
  só com `entregueAgora` e `enviadaEm` preenchida. Nada em `localStorage`, na URL ou no cache
- [x] 6.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/aluno/Atividade.tsx`, `apps/web/src/areas/aluno/Atividade.test.tsx` | alterado |
| `e2e/aluno-atividade.spec.ts` | alterado |
| `apps/web/src/areas/aluno/atividade.ts`, `apps/web/src/areas/aluno/atividade.test.ts` | alterado (a regra `comemoracaoNaTela` e as falas) |
| `apps/web/nome-dos-chunks.ts`, `apps/web/nome-dos-chunks.test.ts` | alterado (ver a divergência abaixo) |

Não edita `roteiro-da-demonstracao.spec.ts` nem `aluno-fluxo.spec.ts`: "Atividade enviada" continua.

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| aparece no envio | componente + e2e | depois da confirmação, a `Comemoracao` está na tela, uma vez, com a onça comemorando, a função e o selo "IA" |
| não aparece ao reabrir | e2e | a tarefa enviada, aberta pela lista ou depois de recarregar, mostra só o "Atividade enviada" |
| não aparece no resultado nem na encerrada | componente | a tarefa com resultado e a encerrada pela professora abrem sem comemoração |
| envio que falha | componente | `ATIVIDADE_ENCERRADA` e erro de rede: nenhuma comemoração |
| nunca de nota nem de acerto | componente | a comemoração não traz número, acerto, tempo nem "parabéns"; só o fato da entrega |
| falas (regra 70, item 4a; D58) | unidade | o texto da `Comemoracao` passa no teste de falas: não afirma ser pessoa, não promete voltar nem esperar, sem vínculo ou saudade |
| movimento reduzido | e2e | com `reducedMotion: 'reduce'` o `animationName` é `none` |
| quatro estados | componente | carregando, não disponível, erro com "Tentar de novo", com dado |
| recomeço da tela | e2e | o aluno seguinte no mesmo computador não herda a comemoração nem a fila do anterior |
| 360 px | e2e | sem rolagem lateral e "Próxima" com 44 px |

Concorrência e log: o envio já é idempotente e não muda; esta tarefa não grava nada.

## Como testar

- Copie `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`): a rede responde a prova, os `PUT` e o
  `POST` de enviar
- E2e: `e2e/aluno-atividade.spec.ts › enviar pede confirmação…` ganha a comemoração; os outros casos mudam só rótulo
- Rodar: `npx vitest run --project unidade apps/web/src/areas/aluno/Atividade.test.tsx` e
  `node tools/ci/e2e.ts --manter-ambiente e2e/aluno-atividade.spec.ts`
- Telas: `aluno`, `/aluno/atividades/<id>` (Tarefas, a linha da tarefa, responder tudo, "Enviar a atividade"); mockup
  `/aluno/tarefas/:id` (formas a e c)

## Fora do escopo desta tarefa

Tutor ao lado da questão, tarefa de leitura, "Isso está errado?", recado com carimbo, "Vale revisar" e prova em tela de foco (F6);
trocar "atividade" por "tarefa" nos textos da tarefa e do Tutor. Se o `conformidade-reviewer` vetar a comemoração, a peça sai daqui.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| `apps/web/nome-dos-chunks.ts` e `nome-dos-chunks.test.ts` entram na tarefa, fora de "Arquivos previstos": o CSS ao lado da peça (`Comemoracao.css`) passa a contar como peça (`ehPecaForaDaEntrada`) | A `Comemoracao` agora é importada pela galeria e pela tarefa aberta: o pedaço que as duas dividem (`Onca`, `Comemoracao`, o CSS) saía `parte-*` e o teste do build reprovava ("peça nenhuma cai num `parte-*`"); com o CSS reconhecido, sai `pecas-*`, como as outras peças divididas | `techspec.md` §9 ("Peças novas", frase nova sobre o CSS ao lado); sem `cenarios.md` nesta spec; seção 11: regra 50, item 1 (peso da entrada), sem desvio |
| `comemoracaoNaTela` tem uma terceira condição, `resultado.tipo !== 'pronto'`, que a subtarefa 6.2 não lista | A subtarefa diz "só com `entregueAgora` e `enviadaEm` preenchida", e o RF8 diz "nunca em resultado": com a correção aprovada à vista, a comemoração dividiria a tela com acerto. A condição fecha as duas frases | `techspec.md` §7b (frase nova: "e some se o resultado já está à vista"); `prd.md` RF8 ("nunca em acerto, resultado"); sem `cenarios.md` nesta spec; seção 11: regra 70, item 3 e D59, sem desvio |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/areas/aluno/atividade.ts
teste: apps/web/src/areas/aluno/atividade.test.ts › a tarefa enviada em outra hora, aberta pela lista ou recarregada, não a tem: falta o envio desta tela
 export function comemoracaoNaTela(entregueAgora: boolean, prova: Pick<RespostaProva, 'enviadaEm'>, resultado: ResultadoNaTela): boolean {
-  return entregueAgora && prova.enviadaEm !== null && resultado.tipo !== 'pronto'
+  return prova.enviadaEm !== null && resultado.tipo !== 'pronto'
```

```mutacao
arquivo: apps/web/src/areas/aluno/atividade.ts
teste: apps/web/src/areas/aluno/atividade.test.ts › sem o envio lido não há comemoração, nem a da tarefa encerrada pela professora
 export function comemoracaoNaTela(entregueAgora: boolean, prova: Pick<RespostaProva, 'enviadaEm'>, resultado: ResultadoNaTela): boolean {
-  return entregueAgora && prova.enviadaEm !== null && resultado.tipo !== 'pronto'
+  return entregueAgora && resultado.tipo !== 'pronto'
```

```mutacao
arquivo: apps/web/src/areas/aluno/atividade.ts
teste: apps/web/src/areas/aluno/atividade.test.ts › nunca divide a tela com o resultado: com a correção aprovada à vista, some
 export function comemoracaoNaTela(entregueAgora: boolean, prova: Pick<RespostaProva, 'enviadaEm'>, resultado: ResultadoNaTela): boolean {
-  return entregueAgora && prova.enviadaEm !== null && resultado.tipo !== 'pronto'
+  return entregueAgora && prova.enviadaEm !== null
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › aparece uma vez, logo depois do envio confirmado: a onça comemorando, a função, o selo "IA", o fato e o caminho de volta
       // Antes de a leitura da prova ganhar `enviadaEm` e esta fase sair do ar: a tela nunca passa pelo "enviada" sem saber que foi agora.
-      aoEntregar()
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › não volta ao reabrir: a mesma tarefa, lida de novo do servidor, só diz "Atividade enviada"; nada fica guardado
-      {comemoracaoNaTela(entregueAgora, prova, resultado) && (
+      {true && (
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › não volta ao reabrir: a mesma tarefa, lida de novo do servidor, só diz "Atividade enviada"; nada fica guardado
-          <SemMaisRespostas prova={dados} estadoDaFila={estadoDaFila} entregueAgora={entregueAgora} />
+          <SemMaisRespostas prova={dados} estadoDaFila={estadoDaFila} entregueAgora={true} />
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › "Anterior" e "Próxima" estão na barra presa, e param nas pontas; "Enviar a atividade" não fica dentro dela
-          <Botao variante="secundario" disabled={numero === 1} onClick={() => irParaQuestao(numero - 1)}>
+          <Botao variante="secundario" onClick={() => irParaQuestao(numero - 1)}>
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › "Anterior" e "Próxima" estão na barra presa, e param nas pontas; "Enviar a atividade" não fica dentro dela
-          <Botao variante="secundario" disabled={numero === prova.questoes.length} onClick={() => irParaQuestao(numero + 1)}>
+          <Botao variante="secundario" onClick={() => irParaQuestao(numero + 1)}>
```

```mutacao
arquivo: apps/web/nome-dos-chunks.ts
teste: apps/web/nome-dos-chunks.test.ts › estão fora da entrada, e o CSS de outro arquivo não é peça só por ser CSS
-  const arquivo = id.slice(posicao + PASTA_DOS_COMPONENTES.length).replace(/\.(?:tsx?|css)$/, '')
+  const arquivo = id.slice(posicao + PASTA_DOS_COMPONENTES.length).replace(/\.tsx?$/, '')
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › o envio que falha com a tarefa já enviada em outra janela não comemora: a comemoração é só do `onSuccess`
-      if (!(erro instanceof ErroDaApi) || erro.codigo !== CodigoDeErro.ATIVIDADE_ENCERRADA) return
+      aoEntregar()
+      if (!(erro instanceof ErroDaApi) || erro.codigo !== CodigoDeErro.ATIVIDADE_ENCERRADA) return
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | Ordem do Tab: "Anterior" e "Próxima" vêm no DOM depois de "Enviar a atividade" e "Pedir ajuda ao Tutor"; reavaliar se o envio vai para dentro da barra, como no mockup 2.3a | `TODO.md`; o Validador confere a forma contra o mockup 2.3a. Muda a estrutura da tela, não é barata |
| frontend-reviewer (1ª), conformidade-reviewer (1ª), revisor-geral (1ª), privacy-guardian (1ª) | O dado da vitrine cheia se contradiz: "Você respondeu 0 de 4 questões" ao lado de "Você acertou 3 de 4" | `TODO.md`: `tools/vitrine/` (fora dos arquivos desta tarefa) |
| frontend-reviewer (1ª) | O mockup 2.3c diz "Entregue!"; a tela usa "Atividade entregue. Quem dá a aula vê a correção antes de você." | Recusada nesta tarefa: o texto passa no teste de falas e a troca de "atividade" por "tarefa" nos textos está fora do escopo declarado; fica com essa troca |
| frontend-reviewer (1ª) | A forma "Entregue agora" só foi vista pelo e2e | Validador, no fim da spec (fotografa cada requisito com tela) |
| conformidade-reviewer (1ª) | A fala sai assinada pelo Tutor, mas quem corrige é o "Assistente · correção de objetiva" | `TODO.md`, com o `frontend-reviewer` na próxima tarefa que toca a `Comemoracao`; muda a assinatura da peça |
| conformidade-reviewer (1ª) | O `\b` do teste de falas não reconhece palavra acentuada; trocar por `(?<![\p{L}])…(?![\p{L}])` com a flag `u` | `TODO.md`: o próprio revisor diz que hoje funciona; vale quando a lista ganhar palavra com acento |
| revisor-geral (1ª) | A `BarraPresa` fica presa também no computador; o texto e o mockup dizem "presa embaixo no celular" | Recusada: o `frontend-reviewer` leu o código e as fotos e aprovou sem apontar defeito |
| revisor-geral (1ª) | `e2e/aluno-atividade.spec.ts:71` copia a fala à mão em vez de importar `FALA_DA_ENTREGA` | `TODO.md`: depende de o e2e poder importar de `apps/web`, que não foi verificado |
| test-engineer (1ª) | O 503 simula a queda de rede; uma falha de verdade seria o `fetch` rejeitado | `TODO.md`, tarefa que toca `Atividade.test.tsx` ou a `redeFalsa`; o revisor diz que o caminho do cliente é o mesmo |
| test-engineer (1ª) | O teste do mapa (`Atividade.test.tsx:472`) já passaria antes desta tarefa e não prova as cores `azul-*` | Recusada: o revisor diz que não é regra e não bloqueia |
| test-engineer (1ª) | O e2e novo entra com dois alunos; conferir que fica abaixo de 15 s | Sem ação: o portão da tarefa roda o e2e e mede o tempo |
| test-engineer (1ª) | No teste de falas, o `toBe` exato de `FALA_DA_ENTREGA` torna as expressões regulares redundantes | Recusada: o revisor diz que elas valem como documentação do motivo |
| infra-guardian (1ª), privacy-guardian (1ª) | Os itens de prova da regra 80 (item 6) não mudam; manter o caso "aluno seguinte no mesmo computador" como padrão para estado de tela novo da área do aluno | Sem ação: constatação, nada a mudar |
| revisor-geral (2ª) | No bloco de mutação de `nome-dos-chunks.ts`, a linha `teste:` cita só o fim do título; copiar o título inteiro (`apps/web/nome-dos-chunks.test.ts:184`) | Recusada: o `test-engineer` (2ª) confirmou que o `-t` do vitest acha o caso por trecho, e o portão já pôs o bloco vermelho |
| revisor-geral (2ª) | O teste do clique duplo não tem bloco próprio em "Mutações" | Recusada: nenhuma cláusula de código entrou na rodada; o próprio revisor diz que fica só registrado |
| test-engineer (2ª) | Um bloco que tire o `confirmando={envio.isPending}` (`Atividade.tsx:273`) mostraria se o teste do clique duplo pega a trava | Recusada: a trava não é cláusula nova desta tarefa (o revisor diz que não bloqueia) e o botão desligado é da peça de confirmação da X1 |
| test-engineer (2ª) | O teste do envio que falha usa o mesmo 409 do caso "a professora encerrou"; comentar que é de propósito | Recusada: o teste já traz o comentário "Outra janela enviou a mesma tarefa: este envio é recusado…", e o código de erro é o mesmo para os dois motivos |

<!-- A seção "Revisões" é criada pelo hook tools/processo/revisoes.ts: não a escreva à mão nem acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 07:06:52 | 2026-10-25 07:07:09 | `tenancy-guardian` | 1 | APROVADO | abb19fd152c29c8c3 |
| 2026-10-25 07:06:58 | 2026-10-25 07:07:24 | `infra-guardian` | 1 | APROVADO | a6424d7e689417be1 |
| 2026-10-25 07:06:39 | 2026-10-25 07:07:30 | `frontend-reviewer` | 1 | APROVADO | ad932668114a8a374 |
| 2026-10-25 07:06:55 | 2026-10-25 07:07:31 | `privacy-guardian` | 1 | APROVADO | a1ecf3c4de9c893f5 |
| 2026-10-25 07:06:42 | 2026-10-25 07:08:00 | `conformidade-reviewer` | 1 | APROVADO | a5e55370c6787b314 |
| 2026-10-25 07:06:49 | 2026-10-25 07:08:32 | `revisor-geral` | 1 | APROVADO | a6f587d9c98f69e65 |
| 2026-10-25 07:06:46 | 2026-10-25 07:09:07 | `test-engineer` | 1 | REPROVADO | a285fb02601967e40 |
| 2026-10-25 07:27:30 | 2026-10-25 07:27:51 | `revisor-geral` | 2 | APROVADO | aa45697d8d97f24ae |
| 2026-10-25 07:27:21 | 2026-10-25 07:28:18 | `test-engineer` | 2 | APROVADO | a84339265bf15cd4b |
