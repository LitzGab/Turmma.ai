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

### Autoconferência antes de codar

O `test-engineer` é quem mais reprova (38% das rodadas no F0 e no começo do F1), e cada
reprovação custa uma rodada nova. Responda no plano, por escrito, as perguntas que ele vai
fazer, e as dos guardiões marcados:

- Para cada teste da tabela "Testes que provam a regra": **qual linha de código, se apagada,
  deixa este teste vermelho?** Se não há resposta, o teste não prova nada.
- Toda operação que pode acontecer duas vezes ao mesmo tempo tem teste com as duas chamadas
  **em paralelo** (`Promise.all`), não em sequência?
- O teste de isolamento quebraria sem a cláusula de escopo do repository?
- Os casos de borda do `N_task.md` têm cada um o seu teste?
- Leia a seção "O que verificar" de cada guardião marcado (`.claude/agents/<nome>.md`) e diga
  onde o plano atende cada item que se aplica.
- Se `tasks/prd-<func>/achados-revisoes.md` existe, leia: é o que os revisores já exigiram nas
  tarefas anteriores. Não repita o mesmo erro.

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
- **Recomendação não reprova.** Fica em `achados-revisoes.md`, escrito pelo hook, e o
  `/validar` e o `/retro` leem de lá. Aplique agora só a que custa pouco e não mexe em código
  já aprovado por outro revisor.
- **Mexeu em código depois de uma aprovação, a aprovação caducou**, e o hook diz de quem.
  A caducidade segue o que o revisor audita: mudança **só em arquivo de teste** (`*.test.ts`,
  `*.spec.ts`, `test/`, `e2e/`, `__fixtures__/`) caduca só `test-engineer` e `revisor-geral`;
  mudança em qualquer outro arquivo caduca todos. Por isso, na correção pedida pelo
  `test-engineer`, mexa só no teste sempre que der.
- **Não edite a seção "Revisões" nem o `achados-revisoes.md`.** Quem escreve é o hook.

## 6. Conferência final

Antes do commit, com todos os revisores terminados:

```bash
node tools/processo/portao-local.ts conferir tasks/prd-<funcionalidade>/<N>_task.md
```

Carimbo inválido: rode o portão local de novo. Se ele mexer em código (formatação, snapshot),
volte ao passo 5 para os revisores que o hook apontar.

## 7. Conclusão

Só depois de tudo verde e todos os revisores obrigatórios aprovados:

- **Confira a esteira do commit anterior.** Com commit direto no `main` e sem staging, a
  esteira é o portão (D23, D31), e um commit em cima de esteira vermelha esconde de quem é o
  erro. Rode:

  ```bash
  git fetch origin main
  git rev-list --count origin/main..main   # precisa ser 0
  git rev-parse origin/main
  gh run list --workflow esteira --branch main --limit 1 --json databaseId,headSha,status,conclusion
  ```

  Só siga com as três condições juntas: `headSha` igual ao `origin/main`, `status`
  `completed` e `conclusion` `success`. Qualquer outro caso tem regra:
  - `main` local à frente do `origin/main`: o commit anterior não foi enviado e não tem
    esteira. Não faça o commit e reporte
  - `headSha` igual e `status` diferente de `completed`: espere com
    `gh run watch <databaseId> --exit-status`, em primeiro plano, e confira de novo
  - `headSha` diferente do `origin/main`: a execução do último commit ainda não foi
    registrada, e a lista mostra a do commit anterior. Liste de novo a cada ~30 s; se em
    2 minutos ela não aparecer, não faça o commit e reporte
  - lista vazia: não faça o commit e reporte
  - `conclusion` diferente de `success` (`failure`, `cancelled`, `skipped`, `timed_out`,
    `startup_failure`, `action_required`): **não faça o commit.** Retorne `STATUS: FALHA`
    com o commit, a conclusão e o job. Corrigir ou reexecutar a esteira não é escopo desta
    tarefa
  - sem `gh` ou sem rede: não faça o commit e reporte
- Marque a tarefa `[x]` em `tasks.md`
- **Faça o commit da tarefa, direto no `main`** (D23). Stage apenas os arquivos desta
  tarefa, incluindo o `N_task.md` com a seção "Revisões" e o `achados-revisoes.md` da pasta,
  se o hook o escreveu, nunca `git add -A`.
  Mensagem no padrão `<Verbo> <o quê> (tarefa N.0)`, por exemplo
  `Implementa reivindicação de nome pelo link da sala (tarefa 4.0)`, com a linha
  `Revisões: <revisor> <veredito> (<n>ª rodada), ...` no corpo. Um commit por tarefa, nunca
  `--amend` em commit existente, nunca `--no-verify`
- **Commit bloqueado pelo hook:** a mensagem diz qual revisor falta, reprovou ou caducou.
  Resolva o que ela aponta. Não contorne: o hook também bloqueia commit que leva código de
  `apps/`, `packages/`, `infra/` ou `e2e/` sem `(tarefa N.0)` nem `(correção <slug>)`
- **Faça o push logo depois do commit** (`git push origin main`). Cada commit de tarefa tem a
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
