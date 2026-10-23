# Roteiro comum — diagnóstico por lentes (reengenharia X5, Etapa 5)

Repositório: /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia (branch `spec/reengenharia`).
Produto: Turmma (código `educa`), SaaS escolar multi-tenant com agentes de IA. A missão é uma reengenharia
(`.reengenharia/MISSAO.md`; o que vale sobre ela é `.reengenharia/RESPOSTAS.md`). As Etapas 1 a 4 já estão feitas:
você **não** refaz a compreensão. Parta do relatório da sua unidade na Etapa 2 (`.reengenharia/unidades/<U>.md`),
**confira no código** o que for usar, e aplique as seis lentes da `MISSAO.md` §5.

## Leia antes (só o necessário)

- `.reengenharia/MISSAO.md` §5 (as seis lentes; é o que você avalia)
- `.reengenharia/unidades/<U>.md` (a compreensão da sua unidade) e o recorte da medição que o pedido indicar
  (complexidade, cobertura por arquivo, clones e knip da linha de base de 20/10, commit `08dc125`)
- `.reengenharia/LINHA-DE-BASE.md` §5 e §6 (números e ondas aprovados), `.reengenharia/DECISOES.md` (R1–R19, P1–P10),
  `.reengenharia/RISCOS.md` e `.reengenharia/CONTRATOS.md` na parte da sua unidade
- As regras de `.claude/rules/` que tocam a sua unidade (00, 10, 20, 30, 40, 50, 60, 70, 80)

## O que já está decidido (não proponha o contrário como se fosse livre)

- A stack (D16) e as decisões D1–D80 não mudam. Trocar peça de stack vira "proposta para depois", não achado de onda.
- O modelo de tenant (linha, `escolaId`/`anoLetivoId`, escopo no repository a partir do token) não muda. RLS só como
  segunda camada, e isso é a P5.
- **P4 decidida:** a pilha de sessão do operador **não** é unificada; só se extraem as ~60 linhas literais (R18).
- Meta da onda 4 (web): ramos ≥ 85 % e nenhuma função de tela acima de 80 linhas (R19).
- `.claude/` e `tools/processo/` não mudam antes da Etapa 9 (o diagnóstico deles é permitido; a mudança não).
- Teste que protege regra de negócio não sai; migration e gatilho só com tarefa própria (RISCOS M1).

## Proibido

- Editar, criar ou apagar qualquer arquivo do repositório. Outros agentes trabalham na mesma árvore.
- Rodar teste, suíte, build, docker/compose, `npm install`, `npx`, ou qualquer coisa que escreva no repositório.
  Pode: ler, `grep`, `find`, `git log`/`git show`/`git blame`, `wc`.
- Deduzir comportamento pelo nome. Inventar regra de negócio. Repetir a Etapa 2 sem acrescentar nada.

## Marcas obrigatórias

**[código]** com `arquivo:linha` conferido · **[medida]** da linha de base (cite o número) · **[doc]** com o documento ·
**[hipótese]** com o que a confirmaria.

## Formato de cada achado

```
### <U>-<n> <título curto, que diga o problema>
- Lente: 5.1 legibilidade | 5.2 contratos | 5.3 escala | 5.4 resiliência | 5.5 manutenção | 5.6 estrutura
- Evidência: <marcas e arquivo:linha; no máximo 4 linhas>
- Impacto: alto | médio | baixo — <por quê, em uma linha: o que quebra, para quem, quando>
- Proposta: <o que fazer, concreto; se for padrão (Strategy, Adapter, Command…), diga qual e por quê>
- Custo: P (até 1 tarefa) | M (2 a 4 tarefas) | G (mais)
- Risco de mexer: baixo | médio | alto — <por quê; qual teste protege hoje>
- Trava: <como a regra fica checada por máquina depois: teste, lint, depcruise, guarda; ou "nenhuma cabe">
- Onda: 1 contratos e travas | 2 fronteiras API/nucleo | 3 execução e resiliência | 4 web | 5 testes e infra |
  6 harness/docs | fora da X5
- Decisão do Joaquim: não | P<n> | NOVA: <a pergunta, em uma linha, e por que é dele>
```

"Decisão do Joaquim" é **sim** quando o achado muda desenho, contrato entre partes, uma decisão D, um critério de aceite,
o modelo de tenant, ou é irreversível (apaga dado). Refatoração interna que preserva comportamento é "não".

## Saída

Grave UM arquivo markdown no caminho que o pedido indicar (fora do repositório). Até ~3000 palavras. Seções, nesta ordem:

1. **Resumo** — três a cinco linhas: o estado da unidade pelas lentes.
2. **Achados** — no formato acima, ordenados por impacto (os mais graves primeiro). Entre 8 e 20. Para cada lente sem
   achado relevante, uma linha dizendo por quê ("5.3: nada, porque …").
3. **Modos de falha** (lente 5.4) — tabela: dependência ou fluxo crítico da unidade | lenta | falha | responde errado |
   some | o que já existe (com `arquivo:linha`) | lacuna. Só dependências e fluxos que a unidade de fato tem.
4. **Padrões considerados** (para a Etapa 6.3) — tabela: problema | padrão | benefício | custo em abstração |
   recomendação (adotar | rejeitar | adiar). Rejeitar é resposta válida; registre também os que você rejeitou.
5. **Regras que dependem de memória** — o que hoje só vale porque alguém lembra (convenção, comentário, revisor), e a
   trava que a substituiria.
6. **Decisões que pedem o Joaquim** — lista curta, só as NOVAS (as P1–P10 já existentes, cite pelo número).

Ao terminar, responda só: o caminho do arquivo e os 5 achados mais importantes (uma linha cada, com o id).
