# Tech Spec da X5 — Onda 6: documentação

**Comum:** `techspec.md` · **PRD:** RF30, RF31 · **Tarefas:** numeradas depois da Etapa 9 ⛔ (R41)

A onda começa depois das ondas 0 a 5 e das tarefas da Etapa 9. Ela não toca produto, schema, migration, `tools/processo/`
nem `.claude/`. As tarefas daqui são um plano: o número e o `N_task.md` nascem na parada da Etapa 9 (92.0), contra o código
como ele estiver.

## 1. O que muda

- Os quadros de rotas, tabelas, filas, jobs e exceções de `@SemEscopo` passam a ser gerados do metadado das ondas 1 e 2,
  com `--check` na esteira.
- A documentação oficial responde às oito perguntas da Etapa 11.
- `docs/arquitetura.md`, que descreve outro sistema, é reescrito.
- As decisões técnicas da X5 viram ADRs.
- `.reengenharia/` sai depois de uma conferência de que nada necessário se perde.

## 2. Desenho

### RF30 — o gerador

**A peça.** `tools/docs/gerar.ts` (`npm run docs:gerar`). Com `--check`, ele compara sem escrever e sai com 1 se algo
difere.
- Cada quadro é um módulo de `tools/docs/quadros/` com `{ id, gerar(): string }`, e `tools/docs/blocos.ts` cuida dos
  marcadores.
- Não sobe Nest, banco nem rede: só importa o que precisa.
- O `--check` vira teste do Vitest, que já resolve `source`. Isso evita somar o build ao `ci:verificar`.
- O OpenAPI da 21.0 passa para este mecanismo, para que exista um `--check` só.

**O formato no documento.** Comentário HTML, que não aparece na renderização:
`<!-- gerado:rotas início · não edite · npm run docs:gerar -->` … `<!-- gerado:rotas fim -->`
- O gerador troca só o miolo.
- Marcador ausente, duplicado ou sem gerador é erro, e gerador sem marcador também.
- A saída é determinística: ordenada, sem data nem hash.
- A fonte vazia, de um registro que não carregou, é erro, e não um quadro vazio.

| Quadro | Fonte | Onde aparece |
|---|---|---|
| `rotas` | o registro de rotas (21.0) e o `acesso` | `docs/contratos.md` |
| `filas-e-jobs` | `FILAS`, `DEFINICOES_DE_JOB` (18.0) e `AGENDAMENTOS` | `docs/contratos.md` |
| `tabelas` | `getTableConfig` do schema e `CLASSIFICACAO_DAS_TABELAS` | `docs/modelo-de-dados.md`, fora das "Regras transversais", que o `arquitetura.test.ts` lê |
| `sem-escopo` | a enumeração da 6.0 (o analisador exporta a lista, não a deixa dentro do teste) | `docs/modelo-de-dados.md` |

Um `docs/gerado/*.md` inteiro foi rejeitado: o quadro ficaria longe da prosa que explica o porquê.

### RF31 — as oito perguntas

| Pergunta | Onde a resposta mora |
|---|---|
| O que o sistema faz | `docs/visao-produto.md` e `README.md` (um parágrafo e como rodar; corrige as três afirmações erradas, U12-7) |
| Como está organizado | `docs/arquitetura.md`, reescrito do zero: apps, pacotes, direção, módulos montados, mapa de pastas e "Ainda não existe". Mais um README de 15 a 25 linhas em cada `apps/*` e `packages/*` |
| Onde implemento | `docs/como-mudar.md`, por tipo de mudança (rota, tabela, job, função de agente, tela, alerta, política, helper de teste). Cada passo cita o arquivo e o teste que o cobra |
| Como as partes se falam | `docs/contratos.md`: rotas, leitor tolerante, erro tipado, job registrado, com os quadros |
| Como falha | `docs/falhas.md`, por dependência: o que a pessoa vê, o alerta, a entrada do runbook e o teste de falha. O runbook fecha as 5 entradas "a preencher" |
| Como escala | "Como escalar", em `docs/infra.md`, com o resultado da N2 |
| Como valido uma alteração | `docs/como-mudar.md`, seção "Validar": o portão, a esteira e o que cada trava pega |
| Como adiciono um módulo | `docs/como-mudar.md`, seção "Módulo e app novo" |

**Os arquivos não mudam de lugar.** `interface.md` tem 251 citações no código, e três documentos são lidos por teste
(`interface.md`, `modelo-de-dados.md` e `runbook.md`).
- Todo `docs/*.md` passa a abrir com a linha `Gênero: referência viva | desenho-alvo | histórico | negócio · Verificado por: …`.
- `docs/README.md` lista os documentos e aponta onde está cada uma das oito respostas.
- Uma guarda com `DOCUMENTOS_LIDOS_POR_TESTE` exige a linha de gênero e a marca "Lido por teste".

**Os ADRs.** Moram em `docs/adr/`, um por mecanismo da X5, cada um com contexto, decisão, o que foi rejeitado, a
consequência e a trava que o garante.
- A coluna "Rejeitado" do `DIAGNOSTICO.md` §3 migra para eles.
- D é produto, regulação e processo, e ADR é mecanismo (R40).
- Uma entrada nova em `docs/decisoes.md`, feita pelo `registrar-decisao`, aponta para `docs/adr/README.md`.

### RF31 — o apagar de `.reengenharia/`

1. `tasks/prd-reengenharia/saida-do-temporario.md` tem uma linha por arquivo versionado da pasta, com o destino: migrado
   (o caminho), já no código ou no documento (a prova), ou descartado (o motivo).
2. A linha de base (§1 a §5, mais as medidas da onda 5) migra para `tasks/prd-reengenharia/linha-de-base.md`, porque o
   relatório final compara com ela.
3. As pendências (`DIAGNOSTICO.md` §6, os S sem tarefa) vão para "Fora da X5" no `TODO.md`, cada uma com o que a destrava.
4. Todo id `Uxx-n` de `diagnostico/` precisa aparecer numa tarefa, no `TODO.md` ou no inventário, com o motivo. Id sem
   destino bloqueia.
5. `rg '\.reengenharia'` fora da pasta e de `tasks/prd-reengenharia/` precisa dar zero.
6. Uma tag `reengenharia/temporario` marca o último commit que tem a pasta, e depois vem `git rm -r .reengenharia`.
7. Apagar é irreversível (RESPOSTAS). O Orquestrador leva o inventário ao Joaquim antes do commit, e a tag não substitui a
   pergunta.

## 3. Falha

| O que falha | O que o teste mostra |
|---|---|
| Quadro velho | o `--check` vermelho mostra a primeira linha que difere: é a prova do RF30 |
| Marcador ausente ou duplicado | erro com o id |
| Fonte vazia | erro |
| Documento sem gênero | a guarda reprova |

## 4. Isolamento, dado pessoal, conformidade, carga

- **Isolamento:** o quadro `sem-escopo` põe todas as exceções à vista de quem revisa.
- **Dado pessoal:** nenhum documento leva dado. O quadro de tabelas mostra a retenção.
- **Conformidade:** o ADR das políticas não copia o `ouro`.
- **Carga:** fora do caminho quente.

## 5. Tarefas (plano; o número nasce na 92.0)

| Plano | Título | RF | Depende de | Veto |
|---|---|---|---|---|
| 6.1 | A esteira recusa quadro velho | 30 | 22.0, 19.0 | infra |
| 6.2 | `docs/contratos.md` com rotas, filas e jobs gerados | 30, 31 | 6.1 | — |
| 6.3 | `docs/modelo-de-dados.md` com tabelas e exceções de escopo gerados | 30 | 6.1 | tenancy |
| 6.4 | Todo documento declara o gênero, e todo app e pacote tem README | 31 | 6.1 | — |
| 6.5 | `docs/arquitetura.md` reescrito | 31 | 6.2, 6.3 | — |
| 6.6 | `docs/como-mudar.md`: onde implemento, validar, módulo novo | 31 | 6.5 | — |
| 6.7 | `docs/falhas.md`, e o runbook sem "a preencher" | 31 | 6.5 | infra |
| 6.8 | "Como escalar" em `docs/infra.md` | 31 | 88.0 e a resposta da N2 | infra |
| 6.9 | Os ADRs das ondas 0 a 2 | 31 | 6.5 | — |
| 6.10 | Os ADRs das ondas 3 a 5 | 31 | 6.9 | — |
| 6.11 | O que ainda serve em `.reengenharia/` está migrado, com o inventário | 31 | 6.2–6.10 | — |
| 6.12 | `.reengenharia/` removida, com a conferência e a tag (parada do Joaquim) | 31 | 6.11 | — |

## 6. Riscos

- **Os documentos lidos por teste.** Editar `interface.md`, `modelo-de-dados.md` ou `runbook.md` não roda portão, porque o
  processo trata `.md` como sem suíte. A tarefa que os toca roda à mão os testes que os leem e diz quais rodou.
- **A seção de agentes, skills e regras da Etapa 11.** Ela depende da Etapa 9, e por isso a 92.0 define onde ela entra.
