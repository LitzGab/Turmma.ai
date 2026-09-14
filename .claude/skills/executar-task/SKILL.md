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

## 3. Implementar

- Uma subtarefa por vez, marcando `[ ]` → `[x]` conforme avança
- Teste junto com o código, nunca depois. Teste escrito depois testa o que o código faz,
  não o que ele deveria fazer
- Sem `any`, sem `TODO` deixado para trás, sem teste comentado
- Vocabulário do glossário no código e no banco
- Descobriu que a Tech Spec está errada: PARE e reporte. Não improvise.

## 4. Portão de verificação

```bash
npm run typecheck   # zero erro
npm run test        # 100% verde
npm run lint
npm run test:e2e    # se tocou tela
npm run test:infra  # se mexeu em infra (regra 40, D52)
```

"Mexeu em infra" é a tarefa com `infra-guardian` obrigatório, ou a que toca `infra/`,
Dockerfile, `tools/testes/`, `tools/ci/compose.ts`, métricas, saúde, prontidão ou borda. Na
dúvida, rode.

Falhou algum, conserte. Não prossiga com teste vermelho, não desabilite teste, não use
`.skip`. Teste vermelho é informação.

Rode o portão antes dos revisores: correção de código depois de uma aprovação faz aquela
aprovação caducar (passo 5).

## 5. Revisores obrigatórios

<critical>A tarefa não fecha sem os revisores marcados no `N_task.md`. Não é recomendação: o
hook `tools/processo/revisoes.ts` registra cada rodada na seção "Revisões" do `N_task.md` e
BLOQUEIA o commit enquanto algum revisor obrigatório não tiver uma rodada iniciada depois da
última alteração de código, com APROVADO nos que têm veto.</critical>

Acione os marcados no `N_task.md`:

- `tenancy-guardian` — dado de escola. **Veto é falha.**
- `privacy-guardian` — dado pessoal ou de menor. **Veto é falha.**
- `conformidade-reviewer` — nota, correção, tutor ou autonomia. **Veto é falha.**
- `infra-guardian` — login, tutor, modo sala, prova online, fila, gateway de IA, migration
  em tabela grande, deploy ou ambiente. **Veto é falha.**
- `test-engineer` — sempre. **REPROVADO bloqueia como veto.**
- `llm-integrator` — chamada de modelo ou agente
- `pedagogia-reviewer` — conteúdo pedagógico gerado
- `frontend-reviewer` — tela

Como chamar, e por quê:

1. **O prompt de todo revisor começa com a linha `Tarefa: tasks/prd-<funcionalidade>/<N>_task.md`.**
   É por ela que o hook sabe em que tarefa registrar a rodada. Sem a linha, a rodada não é
   registrada e o commit continua bloqueado.
2. Os revisores podem rodar em paralelo: não dependem um do outro.
3. **Espere TODOS terminarem antes de seguir.** Veredito que não chegou não existe. Anunciar
   que vai esperar e fazer o commit antes (o que aconteceu na 5.0) é falha da tarefa.
4. **Reprovou: corrija e chame uma rodada nova com um revisor novo** (ferramenta Agent, não
   mensagem para o anterior), trazendo no prompt as correções exigidas na rodada anterior. O
   registro depende de o revisor terminar como subagente.
5. **Mexeu em código depois de uma aprovação, a aprovação caducou.** A revisão vale para o
   código que o revisor viu. Chame rodada nova de cada revisor cuja rodada começou antes da
   alteração: o hook compara o início da rodada com a última alteração e diz quais.
6. **Não edite a seção "Revisões" do `N_task.md`.** Quem escreve é o hook, quando o revisor
   termina.

## 6. Revisão

Execute `.claude/skills/executar-review/SKILL.md`, depois que todos os revisores do passo 5
terminaram. Reprovou, corrija e revise de novo; se a correção mexeu em código, volte ao
passo 5 para os revisores cuja aprovação caducou.

## 7. Conclusão

Só depois de tudo verde e revisão aprovada:

- **Confira a esteira do commit anterior.** Com commit direto no `main` e sem staging, a
  esteira é o portão (D23, D31), e um commit em cima de esteira vermelha esconde de quem é o
  erro. Rode `gh run list --branch main --limit 1 --json databaseId,headSha,status,conclusion`:
  - `success` no último commit do `main`: siga
  - ainda rodando: espere com `gh run watch <databaseId> --exit-status`, em primeiro plano
  - `failure`: **não faça o commit.** Retorne `STATUS: FALHA` com o commit e o job vermelho.
    Corrigir a esteira não é escopo desta tarefa
  - sem `gh` ou sem rede: não faça o commit e reporte
- Marque a tarefa `[x]` em `tasks.md`
- **Faça o commit da tarefa, direto no `main`** (D23). Stage apenas os arquivos desta
  tarefa, incluindo o `N_task.md` com a seção "Revisões", nunca `git add -A`.
  Mensagem no padrão `<Verbo> <o quê> (tarefa N.0)`, por exemplo
  `Implementa reivindicação de nome pelo link da sala (tarefa 4.0)`, com a linha
  `Revisões: <revisor> <veredito> (<n>ª rodada), ...` no corpo. Um commit por tarefa, nunca
  `--amend` em commit existente, nunca `--no-verify`
- **Commit bloqueado pelo hook:** a mensagem diz qual revisor falta, reprovou ou caducou.
  Resolva o que ela aponta. Não contorne: commit fora do padrão `(tarefa N.0)` para escapar
  do portão é falha da tarefa
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
Revisão: aprovada
Esteira do commit anterior: verde em <hash>
Push: <hash enviado>
Motivo da falha: <se houver>
```

Sem dump de código. Sem histórico de raciocínio. Quem lê o relatório é o orquestrador, e
ele só precisa saber se pode seguir.
