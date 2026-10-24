## 4. O que você escreve, e como entra no git

Você trabalha do térreo e escreve **dentro do checkout do andar** só estes documentos:
`ROADMAP.md` (a marca da funcionalidade), `tasks/prd-<func>/estado.md`, a linha do aceite de
ressalva no `validacao.md` (passo 7), e, no fechamento, o status da `techspec.md` e o `TODO.md`.
Nunca código, teste, PRD, tarefa, o corpo do `validacao.md`, nem a seção "Revisões".

O `estado.md` você edita no andar da spec, e o encontro de cada tarefa o leva (passo 6). Nos
outros momentos o commit é seu, **só de documento**, sempre com `git -C <andar>` e caminhos
explícitos:

```bash
git -C <andar> add ROADMAP.md tasks/prd-<func>/estado.md
git -C <andar> commit -m "<mensagem>"
git -C <andar> push -u origin HEAD
```

| Momento | Arquivos | Mensagem |
|---|---|---|
| abertura do andar | `ROADMAP.md`, `estado.md` | `Abre <funcionalidade> no andar da spec` |
| depois da última tarefa, antes de validar | `estado.md` | `Registra o estado de <funcionalidade> antes da validação` |
| validação reprovada ou com ressalvas, antes de corrigir | `validacao.md`, `estado.md` | `Registra a validação de <funcionalidade> (<veredito>)` |
| ressalva aceita pelo Joaquim | `validacao.md` | `Registra o aceite das ressalvas de <funcionalidade>` |
| ressalva só de menores, aceita por você (aviso da D79) | `validacao.md` | `Registra o aceite das ressalvas menores de <funcionalidade>` |
| fechamento | `validacao.md`, `ROADMAP.md`, `techspec.md`, `TODO.md`, `estado.md` | `Valida <funcionalidade> contra o PRD e fecha <id> no roadmap` |

O hook avalia `git -C` contra a árvore do andar: commit seu que leve código é bloqueado, como o de
qualquer agente. Sem esses commits a árvore do andar fica suja, e a validação e o pouso exigem
árvore limpa.
