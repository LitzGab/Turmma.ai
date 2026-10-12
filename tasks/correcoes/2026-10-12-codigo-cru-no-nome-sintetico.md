# Correção — o e2e procura o código de erro como substring, e o nome sintético da escola traz "503" por acaso

**Origem:** esteira run 38261610727 (2ª tentativa), job `e2e 3/4`, commit `4956a51` em `correcao/2026-10-12-teste-de-componente`; o trecho do log está em `.processo/ordens/esteira-38261610727.txt`. Pedido do Orquestrador em 12/10/2026.
**Subagentes obrigatórios:** `frontend-reviewer`, `revisor-geral`
<!-- O PEDIDO ditou `frontend-reviewer`; `infra-guardian` e `conformidade-reviewer` só se a causa estivesse em código do Tutor ou da prova, e ela está no teste. `revisor-geral`: a correção altera mais de 5 arquivos fora de `tasks/` (14). test-engineer é obrigatório em toda correção. -->

## Sintoma

Quatro e2e do projeto `celular` caíram na fatia 3/4 (160 passaram). A mesma fatia passou na `develop` em `8968328`.

1. `e2e/aluno-atividade.spec.ts:73` — `not.toContainText('503')` em `body` (linha 98): o corpo "contém 503". Recebido: `Colégio sintético fa5030ac … Aluno sintético ab94f345 …`. O erro da tela é o certo ("O sistema está indisponível no momento. Tente de novo em instantes.").
2. `e2e/aluno-atividade.spec.ts:219` — a mesma checagem, na linha 237 do arquivo. Recebido: `Colégio sintético a2503562 …`.
3. `e2e/aluno-fluxo.spec.ts:166` — `Hoje: 0 de 60 perguntas` esperado, `Hoje: 1 de 60 perguntas · faltam 59` recebido, nas treze leituras dos 5 s.
4. `e2e/estrutura.spec.ts:732` — `Test timeout of 90000ms exceeded`, com `getByRole('alert')` ainda esperando a mensagem de indisponível depois do `page.reload()` da linha 1059.

## Fora desta correção

Nada: nenhuma tarefa em curso.

Também não entram, por pedido do Orquestrador, a 3 e a 4 (causas diferentes da dos dois "503"): ficam descritas abaixo, em "Devolvido sem corrigir", para quem decidir.

## Causa

**De quem é: anterior à correção `2026-10-12-teste-de-componente`.** O `4956a51` altera `vitest.config.ts` (o `include` da unidade), `apps/web/package.json` (cinco `devDependencies`), o `package-lock.json` (só linhas acrescentadas: `git diff 8968328 HEAD -- package-lock.json` não tem nenhuma linha removida, e nenhum pacote que a web usa em produção mudou de versão), `apps/web/src/__fixtures__/tela.tsx`, o `ListaDePedidos.test.tsx` e documentos. Nada que o navegador do e2e carrega. As quatro falhas são de teste que já existia.

**1 e 2 (corrigidas aqui).** O nome sintético da escola e o da pessoa saem de `marca.slice(0, 8)`, oito caracteres hexadecimais de um UUID (`e2e/__fixtures__/sessao.ts`, `painel.ts` e mais 60 pontos do e2e). Oito caracteres hexadecimais trazem a sequência `503` em cerca de 0,15% dos casos, e cada teste de tela mostra dois ou três desses nomes (escola no cabeçalho e na lateral, pessoa). A guarda "a tela não mostra o código cru da API" é `expect(body).not.toContainText('503')`, que é substring: o nome `fa5030ac` a reprova sem erro nenhum na tela. É uma intermitência de uns 0,3% por teste, e há 20 linhas com a guarda, em dois projetos: a conta é de uma esteira em cada oito ou dez, e ela deu duas na mesma. A mesma guarda existe para `409`, `429` e `404` em outros specs, com o mesmo defeito.

## Teste que reproduz

`e2e/guardas.spec.ts › a guarda do código cru de erro › o 503 que mora no nome sintético da escola não conta; o da tela, em linha própria ou colado ao botão, conta`, ao lado das outras guardas que se provam com `page.setContent`, sem o ambiente de pé:

- A página `PAGINA_COM_503_NO_NOME_DA_ESCOLA` traz quatro nomes sintéticos com `503` e nenhum erro: `fa5030ac` e `a2503562` (os da esteira), `503a1c9d` (abre com o 503, depois de espaço: só o vizinho da frente é hexadecimal) e `9fe1c503` (fecha com ele, antes do botão "Sair": só o de trás). O teste afirma que a substring os acusa e que `codigoCru('503')` não.
- As páginas `PAGINA_COM_O_503_CRU` e `PAGINA_COM_O_503_COLADO_AO_BOTAO` (`Erro 503` e `Erro 503Tentar de novo`, como o `textContent` cola o botão vizinho) têm de continuar acusadas.

**Vermelho antes:** com `codigoCru` devolvendo só `new RegExp(codigo)` (a substring que as telas usavam), o caso cai em `not.toContainText(codigoCru('503'))` com `unexpected value "FixtureColégio sintético fa5030acSair…"`. **Verde depois:** passa nos dois projetos (0,1 s cada).

## Correção

- `e2e/__fixtures__/verificacoes.ts`: `codigoCru(codigo)`, um `RegExp` que acha o código quando nenhum dos vizinhos é caractere hexadecimal minúsculo: `(?<![0-9a-f])503(?![0-9a-f])`. Em oito caracteres, um código de três tem sempre pelo menos um vizinho hexadecimal; o do erro de verdade vem entre espaço, pontuação ou o texto do botão ao lado, que o `textContent` cola sem espaço. Não é `\b`: o nome vem colado ao texto seguinte (`fa5030acSair`) e, simétrico, o erro vem colado a "Tentar de novo".
- `e2e/__fixtures__/paginas.ts` e `e2e/guardas.spec.ts`: as páginas e o caso acima.
- Os quinze specs com a guarda de código numérico de erro passam a usá-la, uma linha cada: `503` em `aluno-atividade`, `aluno-tutor`, `areas`, `minha-turma`, `turma-publica`, `estrutura`, `acesso-da-turma`, `operacao-uso` e `operacao-escolas`; `409` em `aluno-tutor` e `acesso-da-turma`; `429` em `aluno-tutor`, `pedidos-do-titular`, `entrar-na-escola`, `entrar` e `casca` (que também leva o `500`); `404` em `escola-e-vinculos` e `entrar-convite-revogado` (a regex `/NAO_ENCONTRADO|404/` vira um laço, com o `NAO_ENCONTRADO` como texto). Ao todo, 21 usos de `codigoCru` em 20 linhas de 15 specs. As guardas de texto em maiúsculas (`INDISPONIVEL`, `TUTOR_PAUSADO`, `LIMITE_DIARIO`, `CONTA_SEGURADA`) ficam como estavam: nome hexadecimal minúsculo não as contém.
- A docstring de `codigoCru` diz o que a guarda deixa de ver: o código cru colado a letra minúscula de `a` a `f` ou a dígito. É o preço de não confundir o erro com o nome sintético; o limite está escrito onde quem usa o helper lê.

Não muda: código de produção, `tools/`, `.github/`, `.claude/`.

## Devolvido sem corrigir

**3 — `aluno-fluxo.spec.ts:199`: `Hoje: 0 de 60 perguntas`.** O teste observa um instante que o produto deixa de mostrar. O assunto delicado grava a pergunta em `mensagem_tutor` com `autor = 'aluno'` e a execução `concluida` (`TutorService.#encaminhar`, `tutor.service.ts`), e `usoDeHoje` (`tutor.repository.ts`) conta toda pergunta de aluno do dia cuja execução não `falhou`: depois do encaminhamento, o número certo é **1**, e é o que o servidor devolve a toda leitura da conversa (o `OrcamentoRepository.trocas`, o freio, conta a mesma linha). A tela mostra o cartão do ciclo antes de a conversa ser relida (`ConversaComOTutor`, `Tutor.tsx`: a execução terminada invalida `CHAVE_DA_CONVERSA_DO_TUTOR`), e nessa janela o `uso` ainda é o da leitura anterior, 0. A asserção passa se a releitura ainda não chegou e cai se chegou: na `develop` (19,0 s e 16,9 s) a conta ficou a favor, aqui (24,6 s, a máquina mais lenta) não. É corrida entre o teste e a releitura, e a asserção tem o valor errado nos dois lados dela. **Há uma pergunta de produto dentro:** o encaminhamento do assunto delicado gasta uma das 60 trocas do dia e uma do pacote do mês? Hoje gasta, e nenhum teste de integração fixa isso (`tutor.int.test.ts` › "passa na frente do freio do dia" prova só que o encaminhamento passa; nada lê o `uso` depois). Se não deve gastar (o aluno em risco consumiria o dia dele), a correção está em `OrcamentoRepository.trocas` e `TutorDoAlunoRepository.usoDeHoje`, que são código do Tutor (`infra-guardian` e `conformidade-reviewer`), e o e2e passa a afirmar 0 depois de esperar a releitura. Se deve, o e2e passa a esperar `Hoje: 1 de 60`. Decisão do Arquiteto e do Joaquim (D36, D38); não é daqui.

**4 — `estrutura.spec.ts:732`: tempo.** O teste é um só, de umas 350 linhas de fluxo (lista de 101 nomes, prévia, resposta atrasada, gravação recusada, avulso, retirada, erro da lista, turma aberta com carregando e erro), e roda com `test.slow()`: 90 s (30 s × 3). Na `develop` ele levou 1,3 min no celular e 1,2 no Chromebook; aqui, 1,5 min: estourou o limite com a asserção da linha 1060 em curso. A mensagem `Error: element(s) not found` é o `expect` cortado pelo limite do teste (o dele é 20 s), e não a tela sem o alerta: o `Test timeout of 90000ms exceeded` vem primeiro e a asserção só estava no meio da espera. A margem era de 12 s a 14 s em 90, e a máquina da esteira varia mais que isso. A saída é mexer na estrutura do teste: separar do `// A turma aberta tem o seu carregando e o seu erro` em diante num caso próprio (o `// Erro:` da lista e a turma segurada não dependem do que vem antes além de `turma` e `marca`), ou dar o `test.setTimeout` que o `aluno-fluxo.spec.ts` dá. Não é da correção do componente nem de código da tela.

## Mutações

Cada bloco tira ou afrouxa um vizinho da expressão de `codigoCru`, e o caso da guarda tem de cair. O primeiro e o segundo tiram um vizinho; o terceiro e o quarto trocam a classe hexadecimal por só dígitos (o nome `503a1c9d` e o `9fe1c503` têm letra do lado); o quinto afrouxa o da frente a ponto de deixar de ver o erro colado ao botão.

```mutacao
arquivo: e2e/__fixtures__/verificacoes.ts
teste: e2e/guardas.spec.ts › o 503 que mora no nome sintético
-  return new RegExp(`(?<![0-9a-f])${codigo}(?![0-9a-f])`)
+  return new RegExp(`${codigo}(?![0-9a-f])`)
```

```mutacao
arquivo: e2e/__fixtures__/verificacoes.ts
teste: e2e/guardas.spec.ts › o 503 que mora no nome sintético
-  return new RegExp(`(?<![0-9a-f])${codigo}(?![0-9a-f])`)
+  return new RegExp(`(?<![0-9a-f])${codigo}`)
```

```mutacao
arquivo: e2e/__fixtures__/verificacoes.ts
teste: e2e/guardas.spec.ts › o 503 que mora no nome sintético
-  return new RegExp(`(?<![0-9a-f])${codigo}(?![0-9a-f])`)
+  return new RegExp(`(?<![0-9a-f])${codigo}(?![0-9])`)
```

```mutacao
arquivo: e2e/__fixtures__/verificacoes.ts
teste: e2e/guardas.spec.ts › o 503 que mora no nome sintético
-  return new RegExp(`(?<![0-9a-f])${codigo}(?![0-9a-f])`)
+  return new RegExp(`(?<![0-9])${codigo}(?![0-9a-f])`)
```

```mutacao
arquivo: e2e/__fixtures__/verificacoes.ts
teste: e2e/guardas.spec.ts › o 503 que mora no nome sintético
-  return new RegExp(`(?<![0-9a-f])${codigo}(?![0-9a-f])`)
+  return new RegExp(`(?<![0-9a-f])${codigo}(?![0-9A-Za-z])`)
```

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-12 12:50:38 | 2026-10-12 12:51:30 | `revisor-geral` | 1 | REPROVADO | a6523a60446eb5092 |
| 2026-10-12 12:50:41 | 2026-10-12 12:51:50 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | a876399e96f8e3e2d |
| 2026-10-12 12:50:35 | 2026-10-12 12:51:57 | `test-engineer` | 1 | REPROVADO | af0e7f271af121325 |
| 2026-10-12 13:07:16 | 2026-10-12 13:07:47 | `test-engineer` | 2 | APROVADO | a1480c65abda24545 |
| 2026-10-12 13:07:22 | 2026-10-12 13:08:02 | `revisor-geral` | 2 | APROVADO | a10ee869bf190e5b2 |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª), test-engineer (1ª) | Restringir a exceção ao formato do nome sintético (o código dentro de uma sequência de 8 hexadecimais) em vez de a qualquer vizinho hexadecimal; ou acrescentar ao `guardas.spec.ts` uma página com o código colado depois de texto que termina em letra de `a` a `f` | `TODO.md`, junto com a trava abaixo. Reescrever a expressão refaz as cinco mutações e o contrato do helper, e a página que prova o limite afirmaria uma perda: o limite está escrito na docstring |
| frontend-reviewer (1ª) | Uma trava (unidade ou lint) que reprove `not.toContainText('<três dígitos>')` em `e2e/`, com exceção de `guardas.spec.ts` | `TODO.md`: é ferramenta nova, não cabe em poucas linhas em arquivo que a correção já toca |
| test-engineer (1ª) | O item 3 de "Devolvido sem corrigir" (`aluno-fluxo.spec.ts:199`, o `Hoje: 0 de 60 perguntas`) vira pendência explícita para o Arquiteto: nenhum teste de integração fixa se o encaminhamento do assunto delicado gasta uma das 60 trocas (D36, D38) | Já está em "Devolvido sem corrigir", por pedido do Orquestrador; a Mesa leva ao Orquestrador no relatório |
| test-engineer (1ª) | O item 4 (`estrutura.spec.ts:732`, o teste de 90 s com folga de 12 a 14 s) precisa de correção própria logo, porque a esteira continua vermelha por ele | O mesmo: fora desta correção por pedido do Orquestrador; a Mesa leva ao Orquestrador no relatório |
| test-engineer (2ª) | `codigoCru` põe o `codigo` na `RegExp` sem escape: restringir o parâmetro a `` `${number}` `` (ou validar `/^\d{3}$/`) para ninguém passar `'IA_INDISPONIVEL'` ou texto com metacaractere | `TODO.md`, na mesma linha da trava contra a substring: toca o mesmo helper. Não entra agora porque o revisor aprovou, e recomendação de quem aprovou só entra na primeira ordem do documento |
| test-engineer (2ª) | A docstring assume o ponto cego (código colado a minúscula de `a` a `f` ou a dígito): se um botão ou aviso em minúscula vier logo depois de um erro, a guarda precisa de outra forma | `/retro` da correção: é gatilho para reabrir a guarda, não trabalho de hoje |
| revisor-geral (2ª) | A docstring de `codigoCru` cita "(`503`, `409`, `429`)", e o helper também é usado com `404` e `500`: citar os cinco ou dizer "código HTTP de três dígitos" | `TODO.md`, na mesma linha da trava: é comentário, e o mesmo arquivo será tocado por ela |
