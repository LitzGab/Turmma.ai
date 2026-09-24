---
name: executar-task
description: Processo de execução de UMA única tarefa
argument-hint: <caminho do N_task.md>
---

Você implementa **uma única tarefa**. Não avança para outras.

Você provavelmente está começando com contexto limpo, e isso é de propósito: contexto
acumulado de tarefas anteriores faz improvisar. Por isso o passo 1 não é opcional.

Tarefa alvo: `$ARGUMENTS`

## 1. Contexto — pular isto invalida a tarefa

Leia, nesta ordem:

1. `docs/visao-produto.md` — o que é este produto. Sem isso você implementa software
   escolar genérico
2. `prd.md` e `techspec.md` da pasta da funcionalidade
3. O `N_task.md` da tarefa
4. As regras aplicáveis em `.claude/rules/` — cada uma explica o porquê; o porquê é o que
   permite decidir os casos que a regra não previu
5. `docs/glossario.md`

## 2. Planejar antes de codar

Escreva um plano curto: arquivos a criar ou alterar, interfaces, e a lista de testes que
vão provar a regra.

Se o plano contradisser a Tech Spec, **PARE e reporte a divergência**. Não decida
arquitetura sozinho: a Tech Spec foi escrita por alguém que olhou o sistema inteiro, e você
está vendo um pedaço.

<critical>Divergência se registra; critério de aceite não se baixa. Seis reprovações no F1 foram
implementação que se afastou da spec ou da subtarefa sem dizer — e em duas delas a saída foi
**editar o documento para acomodar o resultado**: a linha do cenário de carga reescrita depois da
medição, e o limite de dois grupos do k6 desligado. Baixar a régua é decisão de quem é dono da
tarefa, nunca de quem implementa. O que diverge vai para a seção "Divergências resolvidas nesta
tarefa" do `N_task.md`, com o motivo, e sobe para a Tech Spec quando o commit entra.</critical>

### Autoconferência antes de codar

O `test-engineer` é quem mais reprova (38% das rodadas no F0 e no começo do F1), e cada
reprovação custa uma rodada nova. Responda no plano, por escrito, as perguntas que ele vai
fazer, e as dos guardiões marcados:

- Para cada teste da tabela "Testes que provam a regra": **qual linha de código, se apagada,
  deixa este teste vermelho?** Se não há resposta, o teste não prova nada.
- **O cenário tem o segundo dado que torna a cláusula observável?** Foi a maior causa técnica de
  reprovação no F1, catorze vezes: a regra está no código, mas o teste tem uma turma só, uma escola
  só, um estado só, ou o valor padrão só — e apagar a cláusula não deixa nada vermelho. Se o
  repository filtra por turma, o teste precisa de aluno em **duas** turmas; se filtra por estado,
  de vínculo em cada estado; se lê `inatividadeMin`, de escola com valor **diferente** do padrão.
- **Alguma checagem anterior responde antes da regra sob teste?** Cinco reprovações no F1 foram
  teste verde pelo motivo errado: a rota caía em `exigirAnoEmCurso()`, ou o e-mail não achava
  ninguém, e a cláusula que o teste dizia provar nunca era alcançada. Percorra o caminho até a
  linha que interessa e confirme que o cenário chega nela.
- **A asserção olha o resultado, ou a forma do código?** Asserção sobre texto de arquivo, nome de
  função ou lista vazia passa igual se a regra ler o campo errado. Compare o que o usuário obtém.
- **Algum comentário, docblock ou nota da tarefa afirma o que o código não faz?** Quatro
  reprovações no F1, três delas no mesmo docblock em rodadas seguidas. Neste repositório a regra
  do módulo mora no comentário: quem lê "e só elas" conclui que o caso está barrado, e o próximo a
  mexer "corrige" o código pelo comentário.
- **A divergência que você vai registrar cria ou muda uma regra?** Uma trava nova, um subcomando a
  mais sob a mesma conferência, uma gravação nova numa rota sem sessão. Três reprovações na A0 (3.0,
  5.0, 6.0) foram divergência registrada sem o cenário que a prova, e numa delas sem a pergunta de
  carga: a tentativa segurada passou a gravar no banco a cada requisição anônima. Antes do código, a
  divergência ganha a sua linha na tabela de testes e a resposta do guardião que ela toca (quem chama
  sem autenticação, quantas vezes por segundo, o que grava a cada vez).
- **Qual peça que já existe faz isto?** Sete recomendações entre o F1 e a A0 foram código que refazia
  o que o repositório já tinha: o hash do token de convite, o formato do apelido, a conferência de
  senha na vez, um módulo importando o service de outro. Procure em `apps/api/src/sessao/` e em
  `packages/nucleo/` antes de escrever. Reaproveite importando; se a peça está no lugar errado para
  dois módulos, mova-a para arquivo próprio ou para o `nucleo`, nesta tarefa, e não copie.
- Toda operação que pode acontecer duas vezes ao mesmo tempo tem teste com as duas chamadas
  **em paralelo** (`Promise.all`), não em sequência?
- O teste de isolamento quebraria sem a cláusula de escopo do repository?
- Os casos de borda do `N_task.md` têm cada um o seu teste?
- Leia a seção "O que verificar" de cada guardião marcado (`.claude/agents/<nome>.md`) e diga
  onde o plano atende cada item que se aplica.
- Se `tasks/prd-<func>/achados/indice.md` existe, leia: é uma linha por rodada com o que os
  revisores já exigiram nas tarefas anteriores. Não repita o mesmo erro. Abra o bloco inteiro
  (`achados/<N>_task.md`, no cabeçalho com o mesmo fim) só das linhas que tocam o que você vai
  mexer — o corpo todo passa de 600 KB por funcionalidade e não cabe na janela.

## 3. Implementar

- Uma subtarefa por vez, marcando `[ ]` → `[x]` conforme avança
- Teste junto com o código, nunca depois. Teste escrito depois testa o que o código faz,
  não o que ele deveria fazer
- Sem `any`, sem `TODO` deixado para trás, sem teste comentado
- Vocabulário do glossário no código e no banco
- Descobriu que a Tech Spec está errada: PARE e reporte. Não improvise.

## 4. Portão local

```bash
node tools/processo/portao-local.ts            # typecheck, lint e test
node tools/processo/portao-local.ts --e2e      # se tocou tela (frontend-reviewer marcado)
node tools/processo/portao-local.ts --infra    # se mexeu em infra (regra 40, D52)
```

O script instala as dependências se o `node_modules` for anterior ao lock, roda as suítes e,
se tudo passar, grava o carimbo em `.processo/portao.json`. **O hook bloqueia o commit sem
carimbo mais novo que a última alteração**, com as suítes que os revisores marcados exigem
(`--e2e` com `frontend-reviewer`, `--infra` com `infra-guardian`). O `revisor-geral` confere o
carimbo em vez de rodar tudo de novo.

"Mexeu em infra" é a tarefa com `infra-guardian` obrigatório, ou a que toca `infra/`,
Dockerfile, `tools/testes/`, `tools/ci/compose.ts`, métricas, saúde, prontidão ou borda. Na
dúvida, rode.

Falhou algum, conserte. Não prossiga com teste vermelho, não desabilite teste, não use
`.skip`. Teste vermelho é informação.

Rode o portão antes dos revisores. Mexeu em código depois dele, rode de novo antes do commit.

## 5. Revisores obrigatórios

<critical>A tarefa não fecha sem os revisores obrigatórios. Não é recomendação: o hook
`tools/processo/revisoes.ts` registra cada rodada na seção "Revisões" do `N_task.md` e
BLOQUEIA o commit enquanto algum revisor obrigatório não tiver uma rodada que valha para o
código atual, com APROVADO nos que têm veto.</critical>

Obrigatórios são os marcados no `N_task.md` **mais `test-engineer` e `revisor-geral`, que
toda tarefa tem**, marcados ou não:

- `test-engineer` — sempre, e **primeiro**. Veto.
- `revisor-geral` — sempre: escopo, aderência à Tech Spec, regras 00, 40, 50 e 60 e qualidade
  de código, em contexto limpo. Veto. Substitui a autorrevisão.
- `tenancy-guardian` — dado de escola. Veto.
- `privacy-guardian` — dado pessoal ou de menor. Veto.
- `conformidade-reviewer` — nota, correção, tutor ou autonomia. Veto.
- `infra-guardian` — login, tutor, modo sala, prova online, fila, gateway de IA, migration
  em tabela grande, deploy ou ambiente. Veto.
- `llm-integrator` — chamada de modelo ou agente
- `pedagogia-reviewer` — conteúdo pedagógico gerado
- `frontend-reviewer` — tela

### Ordem

1. **`test-engineer` sozinho, primeiro.** É ele quem mais reprova, e a correção de teste que
   ele exige faria caducar a rodada de quem já tivesse aprovado. Reprovou: corrija, rode o
   portão local e chame rodada nova dele.
2. **Com o `test-engineer` aprovado, todos os outros em paralelo**: `revisor-geral` e os
   guardiões marcados. Não dependem um do outro.
3. **Espere TODOS terminarem antes de seguir.** Veredito que não chegou não existe. Anunciar
   que vai esperar e fazer o commit antes (o que aconteceu na 5.0) é falha da tarefa.

### Prompt de cada revisor

```
Tarefa: tasks/prd-<funcionalidade>/<N>_task.md

Arquivos alterados nesta tarefa:
<saída de `git status --short`, só os desta tarefa>

[Só em rodada nova:]
Rodada anterior: <n>ª, <veredito>. Correções exigidas:
<os bloqueantes da rodada anterior, copiados>
Diff desde a rodada anterior:
<saída de `git diff` dos arquivos que mudaram desde então>
```

A primeira linha é a que o hook usa para registrar a rodada: sem ela, a rodada não conta e o
commit continua bloqueado. O diff na rodada nova é o que deixa o revisor auditar só o que
mudou, em vez de refazer a tarefa inteira.

### Reprovação e caducidade

- **Reprovou: corrija e chame uma rodada nova com um revisor novo** (ferramenta Agent, não
  mensagem para o anterior). O registro depende de o revisor terminar como subagente.
- **Recomendação não reprova.** Fica em `achados/<documento>.md`, resumida em
  `achados/indice.md`, escrito pelo hook, e o `/validar` e o `/retro` leem de lá. Aplique agora só
  a que custa pouco **e antes de o revisor aprovar**: recomendação aplicada depois da aprovação
  caduca a rodada, e custa uma rodada nova.
- **Mexeu em código depois de uma aprovação, a aprovação caducou**, e o hook diz de quem.
  A caducidade segue o que o revisor audita: mudança **só em arquivo de teste** (`*.test.ts`,
  `*.spec.ts`, `test/`, `e2e/`, `__fixtures__/`) caduca só `test-engineer` e `revisor-geral`;
  mudança em qualquer outro arquivo caduca todos. Por isso, na correção pedida pelo
  `test-engineer`, mexa só no teste sempre que der.
- **Não edite a seção "Revisões" nem nada dentro de `achados/`.** Quem escreve é o hook.

## 6. Conferência final

Antes do commit, com todos os revisores terminados:

```bash
node tools/processo/portao-local.ts conferir tasks/prd-<funcionalidade>/<N>_task.md
```

Carimbo inválido: rode o portão local de novo. Se ele mexer em código (formatação, snapshot),
volte ao passo 5 para os revisores que o hook apontar.

## 7. Conclusão

Só depois de tudo verde e todos os revisores obrigatórios aprovados:

- **Confira a esteira do commit anterior.** O trabalho acontece na `develop` (D23 revista) e
  não há staging, então a esteira é o portão (D31), e um commit em cima de esteira vermelha
  esconde de quem é o erro. Rode:

  ```bash
  git fetch origin develop
  git rev-list --count origin/develop..develop   # precisa ser 0
  git rev-parse origin/develop
  gh run list --workflow esteira --branch develop --limit 1 --json databaseId,headSha,status,conclusion
  ```

  Só siga com as três condições juntas: `headSha` igual ao `origin/develop`, `status`
  `completed` e `conclusion` `success`. Qualquer outro caso tem regra:
  - `develop` local à frente do `origin/develop`: o commit anterior não foi enviado e não tem
    esteira. Não faça o commit e reporte
  - `headSha` igual e `status` diferente de `completed`: espere com
    `gh run watch <databaseId> --exit-status`, em primeiro plano, e confira de novo
  - `headSha` diferente do `origin/develop`: a execução do último commit ainda não foi
    registrada, e a lista mostra a do commit anterior. Liste de novo a cada ~30 s; se em
    2 minutos ela não aparecer, não faça o commit e reporte
  - lista vazia: não faça o commit e reporte
  - `conclusion` diferente de `success` (`failure`, `cancelled`, `skipped`, `timed_out`,
    `startup_failure`, `action_required`): **não faça o commit.** Retorne `STATUS: FALHA`
    com o commit, a conclusão e o job. Corrigir ou reexecutar a esteira não é escopo desta
    tarefa
  - sem `gh` ou sem rede: não faça o commit e reporte
- Marque a tarefa `[x]` em `tasks.md`
- **Faça o commit da tarefa, direto na `develop`** (D23 revista). Stage apenas os arquivos desta
  tarefa, incluindo o `N_task.md` com a seção "Revisões" e, se o hook os escreveu,
  `achados/<N>_task.md` e `achados/indice.md`, nunca `git add -A`.
  O `achados/indice.md` é da pasta, não da tarefa: se outro trabalho registrou rodada enquanto esta
  corria, a linha dele vem junto. **Leve assim.** O arquivo é só acrescentado, então a linha extra
  entra um commit mais cedo e nada se perde; tirá-la à mão perderia o registro dela.
  Veio um `achados-revisoes.md` de volta num merge (branch aberta antes de 22/09/2026)? Rode
  `node tools/processo/separar-achados.ts` antes do commit: ele separa e acumula, sem apagar o que
  já está em `achados/`. Ele mexe em mais coisa que a sua tarefa, e o stage acompanha: prepare a
  **deleção** do `achados-revisoes.md` e a pasta `achados/` **inteira**, não só o arquivo da tarefa
  — sem isso o commit vai sem a deleção e sem os blocos dos outros documentos.
  Mensagem no padrão `<Verbo> <o quê> (tarefa N.0)`, por exemplo
  `Implementa reivindicação de nome pelo link da sala (tarefa 4.0)`, com a linha
  `Revisões: <revisor> <veredito> (<n>ª rodada), ...` no corpo. Um commit por tarefa, nunca
  `--amend` em commit existente, nunca `--no-verify`
- **Commit bloqueado pelo hook:** a mensagem diz qual revisor falta, reprovou ou caducou.
  Resolva o que ela aponta. Não contorne: o hook também bloqueia commit que leva código de
  `apps/`, `packages/`, `infra/` ou `e2e/` sem `(tarefa N.0)` nem `(correção <slug>)`
- **Faça o push logo depois do commit** (`git push origin develop`). Cada commit de tarefa tem a
  sua execução da esteira; push em grupo deixa commit sem execução própria. Não espere a
  esteira terminar: quem confere é a próxima tarefa, antes do commit dela
- Retorne o relatório:

```
STATUS: SUCESSO | FALHA
Implementado: <até 5 linhas>
Testes: <n passando / n total>
Typecheck: limpo | erros
E2E: verde | não se aplica
Revisões: <a mesma linha do commit, com todas as rodadas de cada revisor obrigatório>
Portão local: carimbo válido (<suítes>)
Esteira do commit anterior: verde em <hash>
Push: <hash enviado>
Motivo da falha: <se houver>
```

Sem dump de código. Sem histórico de raciocínio. Quem lê o relatório é o orquestrador, e
ele só precisa saber se pode seguir.
