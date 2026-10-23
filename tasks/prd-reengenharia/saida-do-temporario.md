# A saída de `.reengenharia/` (RF31, R64)

Arquiteto, 23/10/2026, no fechamento da X5, depois da validação 1. A pasta temporária da missão saiu do andar. O último
commit que a tem leva a tag **`reengenharia/temporario`**, e qualquer arquivo dela se lê com
`git show reengenharia/temporario:.reengenharia/<caminho>`.

Uma linha por arquivo versionado da pasta (42), com o destino: **migrado** (o caminho novo), **no código** (onde está), ou
**descartado** (o motivo). Os migrados mantêm o nome, para que as citações curtas que já existem nos documentos da spec
(`DECISOES.md` R39, `DIAGNOSTICO.md` §5, `diagnostico/U11.md` §7) continuem valendo de dentro de `tasks/prd-reengenharia/`.

## Migrados para `tasks/prd-reengenharia/`

| Arquivo | Por que fica |
|---|---|
| `MISSAO.md` | a missão inteira; a X6 continua as etapas que o recorte tirou (a 9 e a 11 completa) |
| `RESPOSTAS.md` | o que vale sobre a missão (Etapa 0); o `prd.md` e o `estado.md` apontam para ele |
| `RECORTE.md` | o recorte de 22/10 (D81), que vale por cima da lista de tarefas até o pouso |
| `DECISOES.md` | as decisões R1 a R64, citadas pelas tarefas, pelos `onda-<n>.md` e pela D81 |
| `DIAGNOSTICO.md` | os temas T1 a T18, os padrões rejeitados (§3, que viram ADR na X6), as perguntas "Para a Etapa 9" (§5, citadas pela X6 no `ROADMAP.md`) e o que ficou fora (§6, também no `TODO.md`) |
| `diagnostico/00-roteiro.md`, `U01.md` a `U12.md` (com `U08a` e `U08b`) | os achados com id `Uxx-n`. A X6 trabalha a partir deles, e cada id fica com o seu texto. No lugar de distribuir os 202 ids um a um (o item 4 do RF31 em `onda-6.md`), a pasta vem inteira (R64) |
| `LINHA-DE-BASE.md` | os números de 20/10 (§5), contra os quais o relatório final compara (RF33) |
| `RISCOS.md` | os riscos S1 a S24, com o destino de cada um; a X6 e o portão do piloto leem |
| `CONTRATOS.md` | o inventário de fronteiras; é a base do OpenAPI e da web tolerante ao campo extra, que foram para a X6 (20.0 a 23.0) |
| `SUSPEITOS-MORTOS.md` | os suspeitos que o `knip` (24.0) não fechou, e os do harness, que esperam a Etapa 9 na X6 |

## No código

| Arquivo | Onde está |
|---|---|
| `medicao/knip.json` | `knip.json` da raiz (24.0) |
| `medicao/depcruise.cjs` | `tools/guardas/camadas.cjs` (12.0) |

## Descartados

| Arquivo | Motivo |
|---|---|
| `DESCOBERTA.md` | Etapa 1. A stack e os comandos estão no `README.md` e no `docs/guia-do-desenvolvedor.md`; a pesquisa que decidiu algo virou tema no `DIAGNOSTICO.md` §3; os riscos, o `RISCOS.md` |
| `MAPA.md` | Etapa 2. Ele mesmo dizia valer "até a Etapa 11": o `docs/arquitetura.md` corrigido e o guia (95.0) tomaram o lugar dele, e os caminhos dele são os de antes das pastas (33.0 a 36.0, 96.0, 97.0) |
| `unidades/00-roteiro.md` | o roteiro dos agentes da Etapa 2; processo de uma vez |
| `unidades/R-pesquisa.md` | as fontes da pesquisa da Etapa 1. O que entrou no desenho está no `DIAGNOSTICO.md` §3 e nos `onda-<n>.md`; a URL de cada afirmação fica na tag |
| `unidades/U01-shared.md` a `U12-docs.md` (12) | a análise de cada unidade na Etapa 2, com os caminhos de antes das pastas. O que dela pediu ação virou achado `Uxx-n` em `diagnostico/`, que migrou. As marcas "[código: U10 §8]" do `RISCOS.md` e do `CONTRATOS.md` apontam para elas e se leem na tag |

## A conferência

- Fora de `tasks/prd-reengenharia/`, `git grep -n '\.reengenharia'` dá só `.dockerignore:10`,
  `tools/ci/dockerfile.test.ts:128-130` e a linha do `TODO.md` que fala deles. É código, e a linha não faz mal (ignora uma pasta que não existe): fica no
  `TODO.md`, para a próxima tarefa que tocar o Dockerfile.
- Dentro de `tasks/prd-reengenharia/`, o que ainda diz `.reengenharia/` é registro do que aconteceu: os blocos de
  `achados/` (escritos pelo hook), as tabelas de revisão das tarefas, a `validacao.md`, o RF31 no `prd.md` e o desenho da
  `onda-6.md`. As citações que apontavam um arquivo para ler foram reescritas para o caminho novo.
- O `DIAGNOSTICO.md` §6 está no `TODO.md`, em "Da X5 (reengenharia), fora dela", com o que destrava cada item.
- O que mora em `.processo/reengenharia/` no térreo (fora do git: a cópia da missão, das respostas, do recorte e a pasta
  `guia/` da 95.0) não é desta pasta. O registro da revisão da 95.0 entrou em `achados/95_task.md`.
