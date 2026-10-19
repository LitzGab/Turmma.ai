# Correção — Hoje e Alunos da turma aberta rolam a página a 1366 × 768

**Origem:** `tasks/prd-telas-do-professor/validacao.md` seção 4, Crítico C4 (validação da X3, REPROVADA; RF22), só Hoje e Alunos da turma aberta.
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- O `frontend-reviewer` veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

A 1366 × 768 a página inteira rola, quando só o miolo deveria (RF22, critério de pronto): Hoje, 924 e 960 px; Alunos, 951 px com um
aluno. A turma aberta (`Turma.tsx`) põe as abas e o painel da aba dentro de uma `Tela`, sem limite de altura no painel.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso. O formulário da Adaptação (`Ferramenta.tsx`) e "O que o Assistente fez" (`Time.tsx`)
são do mesmo C4, mas o pedido os deixou de fora.

## Causa

O documento aberto (`Artefato.tsx`) deixou a página parada com o miolo `O_MIOLO_DO_DOCUMENTO` no painel das abas e `useTopoDoPainel`, que mede onde o painel começa. A turma aberta (`Turma.tsx`) tem a mesma forma (`Tela`, título com série, três abas, painel) e nasceu sem ele: o painel não limitava a altura, e a página tinha a altura do conteúdo. Nenhum e2e media a página da turma aberta, e por isso Hoje e Alunos passaram nas 14 tarefas.

## Teste que reproduz

- `e2e/professor-turma-aberta.spec.ts › Hoje mantém a página parada a 1366 × 768…`
- `e2e/professor-turma-alunos.spec.ts › 1366 × 768: a página fica parada com um aluno na lista…`

Os dois chamam `soOPainelDaAbaRola` (`e2e/__fixtures__/professor/cena.ts`): `paginaNaoRola`, o painel com `scrollHeight > clientHeight`, o painel chegando ao pé da janela (`y + altura >= innerHeight - 48`: é o que prova a medida do topo, `useTopoDoPainel`) e as abas no mesmo `y` com o painel rolado até o fim.

Vermelho antes (`chromebook`, 1366 × 768): Hoje, `Received: 156`; Alunos, `Received: 183`. No `celular` a medida da altura não se aplica (abaixo de 768 px a página rola) e os dois casos passam, como devem. Verde depois: os dois casos, nos dois projetos, e os sete specs que abrem a turma (`professor-turma-aberta`, `professor-turma-alunos`, `professor-tutor`, `acesso-da-turma`, `convidar-alunos`, `pedidos`, `professor-turma-atividades`), 128 de 128.

## Correção

- `Turma.tsx`: as abas ficam num `div` com a `ref` de `useTopoDoPainel` e o painel recebe `classeDoPainel={O_MIOLO_DO_DOCUMENTO}`. O hook é chamado antes do retorno de carregando/erro/indisponível, e só mede com a turma e a escola lidas. O miolo vale para as três abas, porque o painel é um só; Atividades passa a rolar por dentro também, como o mockup pede (`mockup.md:140`). Abaixo de 768 px nada muda.
- `e2e/__fixtures__/professor/cena.ts`: `soOPainelDaAbaRola`.
- Os dois specs ganham um caso cada. O de Hoje entra pela API, como o de Alunos, para ficar abaixo de 15 s (11 s medidos).

Fica de fora, por ordem do pedido: o formulário da Adaptação (`Ferramenta.tsx`) e "O que o Assistente fez" (`Time.tsx`), também do C4.

## Mutações

```mutacao
arquivo: apps/web/src/areas/professor/Turma.tsx
teste: e2e/professor-turma-aberta.spec.ts › Hoje mantém a página parada
-          <Abas rotulo="Seções da turma" abas={ABAS_DA_TURMA} ativa={aba} aoMudar={(id) => navegar(enderecoDaAba(caminho, abaDoId(id)), { replace: true })} classeDoPainel={O_MIOLO_DO_DOCUMENTO}>
+          <Abas rotulo="Seções da turma" abas={ABAS_DA_TURMA} ativa={aba} aoMudar={(id) => navegar(enderecoDaAba(caminho, abaDoId(id)), { replace: true })}>
```

```mutacao
arquivo: apps/web/src/areas/professor/Turma.tsx
teste: e2e/professor-turma-alunos.spec.ts › 1366 × 768: a página fica parada
-          <Abas rotulo="Seções da turma" abas={ABAS_DA_TURMA} ativa={aba} aoMudar={(id) => navegar(enderecoDaAba(caminho, abaDoId(id)), { replace: true })} classeDoPainel={O_MIOLO_DO_DOCUMENTO}>
+          <Abas rotulo="Seções da turma" abas={ABAS_DA_TURMA} ativa={aba} aoMudar={(id) => navegar(enderecoDaAba(caminho, abaDoId(id)), { replace: true })}>
```

```mutacao
arquivo: apps/web/src/areas/professor/Turma.tsx
teste: e2e/professor-turma-aberta.spec.ts › Hoje mantém a página parada
projeto: chromebook
-        <div ref={topoDoPainel} className="min-w-0">
+        <div className="min-w-0">
```

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 16:40:39 | 2026-10-19 16:41:16 | `frontend-reviewer` | 1 | APROVADO | aa06b2f694d853c25 |
| 2026-10-19 16:40:42 | 2026-10-19 16:42:04 | `test-engineer` | 1 | REPROVADO | ab4f19dd40151a55e |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | Caso com a aba Atividades e conteúdo suficiente, para fechar o "vale para as três abas" | Recusada: o próprio revisor diz que a cláusula é a mesma que a mutação de Hoje já cobre e que não bloqueia; exige cenário novo de Atividades, que não é barato. |
| test-engineer (1ª) | Declarar `projeto: chromebook` nos dois blocos de mutação | Recusada: sem a linha o projeto já é `chromebook` (`tools/processo/mutacoes.ts`, "Ausente: `chromebook`"). O bloco novo declara porque o revisor a pediu. |
| test-engineer (1ª) | A conferência de as abas ficarem no mesmo `y` já sai de `paginaNaoRola` | Nada a fazer: o próprio revisor diz que não atrapalha; a garantia de verdade é a medida do topo. |
| test-engineer (1ª) | Limitar o caso de Hoje ao `chromebook` se o tempo apertar | Recusada: o caso mede 11 s, abaixo dos 15 s; o revisor só a oferece "se o tempo apertar". |
| frontend-reviewer (1ª) | A foto da vitrine da escola vazia, aba Alunos, saiu com "Carregando a aba…" | `TODO.md`: `tools/vitrine/` deveria esperar a aba carregar antes de fotografar. Não é desta correção. |
| frontend-reviewer (1ª) | Hoje, escola vazia, a 1366: o vazio aparece cortado, rolando por dentro | Nada a fazer: é a rolagem por dentro que o RF22 pede; o revisor diz que nada bloqueia. |
| frontend-reviewer (1ª) | O C4 segue aberto no formulário da Adaptação (`Ferramenta.tsx`) e em "O que o Assistente fez" (`Time.tsx`) | Correção própria, a pedir pelo Orquestrador antes de a validação da X3 fechar; o pedido deixou os dois de fora. |
| test-engineer (2ª) | Tirar a folga de 48 px da conferência do pé da janela | Recusada: a folga absorve arredondamento, e o teste falha com a medida do topo tirada (mutação 3). |
| 2026-10-19 16:59:49 | 2026-10-19 17:00:14 | `test-engineer` | 2 | APROVADO | a17b9ca7dd49da3c6 |
