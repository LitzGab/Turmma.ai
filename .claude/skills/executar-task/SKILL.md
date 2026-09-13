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

## 4. Subagentes obrigatórios

Acione os marcados no `N_task.md`:

- `tenancy-guardian` — dado de escola. **Veto é falha.**
- `privacy-guardian` — dado pessoal ou de menor. **Veto é falha.**
- `conformidade-reviewer` — nota, correção, tutor ou autonomia. **Veto é falha.**
- `infra-guardian` — login, tutor, modo sala, prova online, fila, gateway de IA, migration
  em tabela grande, deploy ou ambiente. **Veto é falha.**
- `llm-integrator` — chamada de modelo ou agente
- `pedagogia-reviewer` — conteúdo pedagógico gerado
- `frontend-reviewer` — tela
- `test-engineer` — sempre, antes da revisão

Os quatro com veto podem rodar em paralelo: não dependem um do outro.

## 5. Portão de verificação

```bash
npm run typecheck   # zero erro
npm run test        # 100% verde
npm run lint
npm run test:e2e    # se tocou tela
```

Falhou algum, conserte. Não prossiga com teste vermelho, não desabilite teste, não use
`.skip`. Teste vermelho é informação.

## 6. Revisão

Execute `.claude/skills/executar-review/SKILL.md`. Reprovou, corrija e revise de novo.

## 7. Conclusão

Só depois de tudo verde e revisão aprovada:

- Marque a tarefa `[x]` em `tasks.md`
- **Faça o commit da tarefa, direto no `main`** (D23). Stage apenas os arquivos desta
  tarefa, nunca `git add -A`.
  Mensagem no padrão `<Verbo> <o quê> (tarefa N.0)`, por exemplo
  `Implementa reivindicação de nome pelo link da sala (tarefa 4.0)`. Um commit por tarefa,
  nunca `--amend` em commit existente, nunca `--no-verify`
- Retorne o relatório:

```
STATUS: SUCESSO | FALHA
Implementado: <até 5 linhas>
Testes: <n passando / n total>
Typecheck: limpo | erros
E2E: verde | não se aplica
Tenancy-guardian: APROVADO | não se aplica
Privacy-guardian: APROVADO | não se aplica
Conformidade-reviewer: APROVADO | não se aplica
Infra-guardian: APROVADO | não se aplica
Outros subagentes: ...
Revisão: aprovada
Motivo da falha: <se houver>
```

Sem dump de código. Sem histórico de raciocínio. Quem lê o relatório é o orquestrador, e
ele só precisa saber se pode seguir.
