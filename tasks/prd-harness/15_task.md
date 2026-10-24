# Tarefa 15.0 — A base fixa curta, e as regras 00, 40, 60 e 80 por `paths:`

**Funcionalidade:** harness (X7) · **Depende de:** 2.0
**Subagentes obrigatórios:** `infra-guardian`, `conformidade-reviewer`
**Porte:** grande

## Objetivo

O que todo terminal lê antes de qualquer pedido (o `CLAUDE.md` mais as regras sem `paths:`) cai de 75 KB para até
40.000 B, sem perder item das regras 10, 20 e 70, que continuam sempre carregadas; as regras 00, 40, 60 e 80 passam a
carregar pelo caminho; e um teste prende o tamanho.

## Contexto necessário

- `techspec.md` §9 e §11; §12 (a segunda premissa: regra com `paths:` lida por subagente)
- `prd.md` RF20
- `texto.md`: **Para onde vai o `CLAUDE.md`** e **As regras ganham `paths:`**
- `cenarios.md` seção C, **RF20**
- Hoje: `CLAUDE.md` 36.351 B; regras sem `paths:` (00, 10, 20, 40, 60, 70, 80) 38.866 B. Modelo de `paths:` em
  `.claude/rules/50-frontend.md`
- Código: `tools/processo/estado.ts`, linha que conta "Decisões em aberto" no `CLAUDE.md` (passa a ler
  `docs/decisoes-em-aberto.md`)

## Subtarefas

- [x] 15.1 — Antes de mexer: gravar a medida de hoje (bytes da base fixa e itens numerados da 10, da 20 e da 70) em
  `tools/processo/harness/__fixtures__/base-fixa-antes.json`
- [x] 15.2 — `CLAUDE.md`: decisões em uma linha (número e título); "Conflitos já resolvidos" para o topo de
  `docs/decisoes.md`; "Decisões em aberto" para `docs/decisoes-em-aberto.md`; "Skills" para
  `.claude/skills/seguir/time.md`; os conflitos de skill para `docs/skills-de-terceiros.md`. Ficam o produto, as seis
  regras, o recorte, a stack e o mapa
- [x] 15.3 — `estado.ts` conta as decisões em aberto no arquivo novo
- [x] 15.4 — `paths:` nas regras 00, 40, 60 e 80, como o `texto.md` diz; a 40 ganha a frase do RF17 (§5d)
- [x] 15.5 — `criar-prd`, `criar-techspec`, `revisar-spec`, `criar-tasks`, `validar` e `retro` mandam ler as quatro por
  extenso
- [x] 15.6 — Prova da premissa: um subagente que lê um arquivo de `apps/` recebe a regra 00? Anotar em "Divergências";
  se não receber, os revisores também mandam ler (`texto.md`)
- [x] 15.7 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `CLAUDE.md` | alterado |
| `docs/decisoes.md` | alterado (topo) |
| `docs/decisoes-em-aberto.md` | novo |
| `docs/skills-de-terceiros.md` | novo |
| `.claude/skills/seguir/time.md` | novo |
| `.claude/rules/00-arquitetura.md`, `.claude/rules/40-testes.md`, `.claude/rules/60-dominio.md`, `.claude/rules/80-infra-e-carga.md` | alterados |
| `.claude/skills/criar-prd/SKILL.md`, `.claude/skills/criar-techspec/SKILL.md`, `.claude/skills/revisar-spec/SKILL.md`, `.claude/skills/criar-tasks/SKILL.md`, `.claude/skills/validar/SKILL.md`, `.claude/skills/retro/SKILL.md` | alterados |
| `tools/processo/estado.ts`, `tools/processo/estado.test.ts` | alterados |
| `tools/processo/harness/base-fixa.test.ts` | novo |
| `tools/processo/harness/__fixtures__/base-fixa-antes.json` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| base fixa acima de 40.000 B (amostra) | unidade | vermelho |
| regra sempre carregada diferente de {10, 20, 70} | unidade | vermelho |
| menos itens numerados na 10, na 20 ou na 70 que no "antes" | unidade | vermelho, um caso por regra |
| o repositório depois da tarefa | unidade | verde, com a medida de antes gravada |
| `estado.ts` conta as decisões em aberto do arquivo novo | unidade | o resumo da sessão mostra o número |
| a guarda reprova quando o alvo dela não existe: `CLAUDE.md` ausente na amostra | unidade | vermelho |

## Como testar

- Contagem de decisões: copiar `tools/processo/estado.test.ts › lerEstado, do disco › o resumo da sessão aponta a funcionalidade da vez e conta as decisões em aberto`, apontando o arquivo novo.
- A base fixa é calculada lendo o frontmatter de cada regra (`paths:` presente ou não); a amostra quebrada é cópia em `mkdtempSync`.
- Rodar: `npx vitest run --project unidade tools/processo/harness/base-fixa.test.ts tools/processo/estado.test.ts`.
- Nada sai do `CLAUDE.md` sem destino: confira com `diff` que cada parágrafo removido está em algum dos arquivos novos.

## Fora do escopo desta tarefa

A checagem citada em cada regra (16.0); o `/seguir` partido (17.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A premissa do §12 (15.6) se confirmou: o subagente que lê arquivo de `apps/` **recebe** a regra 00. Os revisores não precisam mandar ler as quatro regras | Provada em sessão real, `claude -p` chamando um subagente `general-purpose`: antes de ler, "não tem"; depois de ler `README.md`, não tem; depois de ler `apps/api/src/main.ts`, tem, e o subagente diz que veio de bloco automático de instruções (system-reminder), em mensagem própria **depois** do resultado do `Read`, e que ele não leu nada em `.claude/` | `techspec.md` §12 (a premissa passa a VERIFICADO); §9 e `texto.md` ("se a premissa do §12 cair, também nos revisores": não caiu) |
| `CLAUDE.md` ficou com 227 linhas, e o RF20 diz "até ~150" | Só a lista de decisões (uma linha por decisão, D1 a D81) já tem 83 linhas; o critério que o `cenarios.md` C e a tarefa provam é de bytes: `CLAUDE.md` 12.920 B e base fixa de 34.326 B, contra o limite de 40.000 B (antes, 36.351 B e 75.218 B) | `techspec.md` §11 (o critério do RF20 é de bytes, com a medida de depois); `prd.md` RF20; `cenarios.md` C, RF20 (o vermelho é "base fixa acima de 40.000 B", não a contagem de linhas) |
| Seis arquivos fora de "Arquivos previstos" mudam: `.claude/skills/seguir/SKILL.md` (uma frase no §3 manda ler o `time.md`, que a 17.0 leva junto com o passo 3), `.claude/skills/registrar-decisao/SKILL.md`, `.claude/skills/descobrir/SKILL.md`, `.claude/skills/status/SKILL.md`, `README.md` e `ROADMAP.md` | O `texto.md` fixa o `time.md` como "lido no passo 3", e sem a frase no `SKILL.md` ninguém o lia. Os outros cinco citavam seções do `CLAUDE.md` que mudaram de lugar ("Decisões em aberto", "Conflitos já resolvidos", a linha de decisão com resumo). Sem isto a `registrar-decisao` mandaria escrever onde a seção não existe mais. A `status` sai na 19.0, e a linha dela só aponta o arquivo novo até lá. As outras citações em `docs/` (AIA, `interface.md`, `modelo-de-dados.md`, `pendencias-dos-mockups.md`, `mvp-rapido.md`) dizem "decisões em aberto, `CLAUDE.md`" como história e ficam: o `CLAUDE.md` continua apontando o arquivo | `texto.md` ("Para onde vai o `CLAUDE.md`": a tabela de destinos) |
| `eslint-suppressions.json` (`tools/processo/estado.ts`, `complexity` de 4 para 3) e o `TETO` de `tools/guardas/catraca.test.ts` (`complexity` de 244 para 243) mudam, e nenhum está em "Arquivos previstos" | Ler as decisões em aberto de um arquivo, sem a expressão regular da seção, baixou a complexidade do `resumo`; o lint reprova a supressão que sobrou e a catraca reprova o corte sem baixar o `TETO` ("quem corta baixa os dois", `tools/guardas/catraca.ts`) | `texto.md` ("Para onde vai o `CLAUDE.md`": o `estado.ts` lê o arquivo novo) |
| O rótulo do resumo da sessão passa de "Decisões em aberto no CLAUDE.md: N" para "Decisões em aberto em docs/decisoes-em-aberto.md: N" | O arquivo mudou; o rótulo diz onde olhar. Nenhum código nem hook lê o rótulo (só `estado.test.ts`) | `texto.md` ("Decisões em aberto": `docs/decisoes-em-aberto.md`, lido pelo `estado.ts`) |
| O conflito "Visual" (`frontend-design`) foi para `docs/skills-de-terceiros.md` sem a frase "A identidade visual ainda está em aberto" | Contradiz a D80 (a pele está fechada); é a contradição "identidade visual em aberto × D80" do RF21, que fica na D80 | `texto.md` ("As contradições (RF21)") |

## Mutações

A tarefa não toca `apps/*/src` nem `packages/*/src`, então o RF17 não a obriga; os blocos abaixo provam as cláusulas do
que ela acrescenta em código: a leitura do arquivo novo no `estado.ts` (o arquivo, o rótulo) e cada cláusula da
conferência de `base-fixa.test.ts` (a guarda mora no teste, e o bloco estraga a própria guarda e exige o caso que a
prova vermelho): o `CLAUDE.md` ausente, o limite (o `>` e a soma das regras sempre carregadas), o filtro das regras sem
`paths:`, a comparação com {10, 20, 70}, os itens que faltam (a condição e o filtro por número), o cabeçalho que
conta o `paths:` (só no cabeçalho, e com ao menos um item), a pasta das regras que não se lê, o arquivo sem número e a
pasta com nome de regra, e as duas cláusulas da conferência das skills.

Sem bloco, de propósito: os `?? ''`, `?? []`, `?? 0` e `?? Infinity` de fallback que o `noUncheckedIndexedAccess` pede; o
`.sort()` dos nomes lidos da pasta (a ordem de `readdirSync` não é garantida pelo sistema de arquivos, e nenhum caso a
distingue na máquina, que já a devolve em ordem; o teste só a fixa); o `import.meta.dirname` e o `join` das constantes;
e o `regra()` do teste, que só acha o caminho do arquivo da amostra.

```mutacao
arquivo: tools/processo/estado.ts
teste: tools/processo/estado.test.ts › o resumo da sessão aponta a funcionalidade da vez e conta as decisões em aberto
- const abertas = ler(join(raiz, ARQUIVO_DAS_DECISOES_EM_ABERTO)) ?? ''
+ const abertas = ler(join(raiz, 'CLAUDE.md')) ?? ''
```

```mutacao
arquivo: tools/processo/estado.ts
teste: tools/processo/estado.test.ts › o resumo da sessão aponta a funcionalidade da vez e conta as decisões em aberto
- export const ARQUIVO_DAS_DECISOES_EM_ABERTO = 'docs/decisoes-em-aberto.md'
+ export const ARQUIVO_DAS_DECISOES_EM_ABERTO = 'docs/outras-decisoes.md'
```

```mutacao
arquivo: tools/processo/estado.ts
teste: tools/processo/estado.test.ts › o resumo da sessão aponta a funcionalidade da vez e conta as decisões em aberto
- if (quantas > 0) linhas.push(`Decisões em aberto em ${ARQUIVO_DAS_DECISOES_EM_ABERTO}: ${quantas}`)
+ if (quantas > 0) linhas.push(`Decisões em aberto: ${quantas}`)
```

```mutacao
arquivo: tools/processo/harness/base-fixa.test.ts
teste: tools/processo/harness/base-fixa.test.ts › CLAUDE.md ausente na amostra
- if (claude === null) problemas.push('CLAUDE.md ausente: a base fixa não se mede sem ele')
+ if (false) problemas.push('CLAUDE.md ausente: a base fixa não se mede sem ele')
```

```mutacao
arquivo: tools/processo/harness/base-fixa.test.ts
teste: tools/processo/harness/base-fixa.test.ts › base fixa acima de 40.000 B
- if (base > LIMITE_DA_BASE_FIXA) problemas.push(`base fixa de ${base} B, acima de ${LIMITE_DA_BASE_FIXA} B`)
+ if (base >= LIMITE_DA_BASE_FIXA) problemas.push(`base fixa de ${base} B, acima de ${LIMITE_DA_BASE_FIXA} B`)
```

```mutacao
arquivo: tools/processo/harness/base-fixa.test.ts
teste: tools/processo/harness/base-fixa.test.ts › base fixa acima de 40.000 B
- if (base > LIMITE_DA_BASE_FIXA) problemas.push(`base fixa de ${base} B, acima de ${LIMITE_DA_BASE_FIXA} B`)
+ if (false) problemas.push(`base fixa de ${base} B, acima de ${LIMITE_DA_BASE_FIXA} B`)
```

```mutacao
arquivo: tools/processo/harness/base-fixa.test.ts
teste: tools/processo/harness/base-fixa.test.ts › base fixa acima de 40.000 B
- const base = bytes(claude ?? '') + sempre.reduce((soma, regra) => soma + regra.bytes, 0)
+ const base = bytes(claude ?? '')
```

```mutacao
arquivo: tools/processo/harness/base-fixa.test.ts
teste: tools/processo/harness/base-fixa.test.ts › o repositório de hoje passa, com a medida de antes gravada e as contagens mínimas
- const sempre = regras.filter((regra) => !regra.comPaths)
+ const sempre = regras.filter(() => true)
```

```mutacao
arquivo: tools/processo/harness/base-fixa.test.ts
teste: tools/processo/harness/base-fixa.test.ts › regra com caminho que perde o paths: volta ao contexto
- if (numeros.join(',') !== SEMPRE_CARREGADAS.join(',')) {
+ if (false) {
```

```mutacao
arquivo: tools/processo/harness/base-fixa.test.ts
teste: tools/processo/harness/base-fixa.test.ts › item numerado cortado
- if (faltam.length > 0) problemas.push(`a regra ${numero} perdeu os itens ${faltam.join(', ')}`)
+ if (false) problemas.push(`a regra ${numero} perdeu os itens ${faltam.join(', ')}`)
```

```mutacao
arquivo: tools/processo/harness/base-fixa.test.ts
teste: tools/processo/harness/base-fixa.test.ts › item trocado por outro com a mesma contagem
- const faltam = (antes.itensNumerados[numero] ?? []).filter((item) => !atuais.includes(item))
+ const faltam = (antes.itensNumerados[numero] ?? []).filter((item) => !atuais.includes(item) && atuais.length < (antes.itensNumerados[numero]?.length ?? 0))
```

```mutacao
arquivo: tools/processo/harness/base-fixa.test.ts
teste: tools/processo/harness/base-fixa.test.ts › paths: escrito no corpo da regra
- const cabecalho = /^---\n([\s\S]*?)\n---\n/.exec(texto)?.[1] ?? ''
+ const cabecalho = texto
```

```mutacao
arquivo: tools/processo/harness/base-fixa.test.ts
teste: tools/processo/harness/base-fixa.test.ts › paths: com lista vazia
- return /^paths:[ \t]*\n(?:[ \t]+-[ \t]+\S.*\n)+/m.test(`${cabecalho}\n`)
+ return /^paths:[ \t]*\n(?:[ \t]+-[ \t]+\S.*\n)*/m.test(`${cabecalho}\n`)
```

```mutacao
arquivo: tools/processo/harness/base-fixa.test.ts
teste: tools/processo/harness/base-fixa.test.ts › pasta das regras ausente na amostra
    nomes = readdirSync(join(raiz, PASTA_DAS_REGRAS))
  } catch {
-   return []
+   return [{ numero: '10', bytes: 0, comPaths: false, itens: [] }]
```

```mutacao
arquivo: tools/processo/harness/base-fixa.test.ts
teste: tools/processo/harness/base-fixa.test.ts › arquivo sem número na pasta das regras
- if (numero === undefined || texto === null) return []
+ if (texto === null) return []
```

```mutacao
arquivo: tools/processo/harness/base-fixa.test.ts
teste: tools/processo/harness/base-fixa.test.ts › pasta com nome de regra
- if (numero === undefined || texto === null) return []
+ if (numero === undefined) return []
```

```mutacao
arquivo: tools/processo/harness/base-fixa.test.ts
teste: tools/processo/harness/base-fixa.test.ts › skill ausente na amostra
- if (texto === null) return [`${skill}: SKILL.md ausente`]
+ if (false) return [`${skill}: SKILL.md ausente`]
```

```mutacao
arquivo: tools/processo/harness/base-fixa.test.ts
teste: tools/processo/harness/base-fixa.test.ts › sem o nome da regra 60
- return AS_QUATRO.filter((nome) => !texto.includes(nome)).map((nome) => `${skill}: não manda ler ${nome}`)
+ return AS_QUATRO.filter(() => false).map((nome) => `${skill}: não manda ler ${nome}`)
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | Os arquivos `.processo/compose-de-teste-*.yml` ficam fora dos `paths:` da regra 80 | Recusada: são arquivos do processo, não do produto; incluir se algum virar ambiente de carga |
| infra-guardian (1ª) | `packages/shared/**` fora dos `paths:` da regra 80 | Recusada: o pacote só guarda contratos; revisar a lista se entrar código de runtime no caminho quente |
| conformidade-reviewer (1ª) | D45 e D70 no índice perderam "sem ranking" e "sem consequência automática nem histórico" | `/retro` da X7 decide se o índice traz a palavra-chave da proteção (o próprio revisor o pede); a regra 70, itens 7 e 8, cobre os dois |
| conformidade-reviewer (1ª) | Três AIA (`correcao-de-objetiva.md:261`, `diagnostico-por-habilidade.md:220`, `sinais-e-alertas.md:296`) dizem "decisão em aberto no `CLAUDE.md`" | Recusada nesta tarefa: a tarefa decidiu mantê-las como história (Divergências) e o `CLAUDE.md` aponta o arquivo novo; apontar para `docs/decisoes-em-aberto.md` na próxima vez que alguém mexer em cada AIA |
| test-engineer (1ª) | Guarda dos itens das regras 10, 20 e 70 olha só o número; margem de bytes por regra | Recusada: o RF20 e o `cenarios.md` C pedem "itens numerados"; margem de bytes é critério novo, e o corte de conteúdo da 70 passa pela revisão do `conformidade-reviewer` |
| test-engineer (1ª) | `estado.test.ts:502-513`: o caso "sem o arquivo… não inventa a linha" também não tem `CLAUDE.md` na amostra | Recusada: redundante, o caso principal já separa os dois arquivos (o próprio revisor o diz) |
| test-engineer (1ª) | O teste do RF17 na regra 40 só procura três literais | Recusada: "Pode ficar", diz o revisor; é presença do texto |
| revisor-geral (1ª) | `.claude/agents/implementador.md:68` ainda diz que o `CLAUDE.md` e as regras "já estão no seu contexto" | Tarefa 19.0, que já altera `implementador.md` (`19_task.md`); fora dos arquivos desta tarefa |
| revisor-geral (2ª) | Os números de depois (12.920 B no `CLAUDE.md`, 34.326 B de base fixa) em `techspec.md:290` e `15_task.md:82` ficaram velhos depois das linhas da D1 e da D55: medido agora, 12.980 B e 34.386 B | Recusada: o critério do RF20 é o limite de 40.000 B, que passa com folga, e o teste prova o limite, não o valor; o número muda a cada edição do `CLAUDE.md`. O revisor diz que não muda o veredito |
| test-engineer (2ª) | O caso novo de `estado.test.ts` lê o repositório de verdade e fica vermelho no dia em que a última decisão em aberto fechar (tabela vazia); quem esvaziar a tabela ajusta o caso junto | `/retro` da X7: uma linha para que isso não pareça regressão |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 21:27:06 | 2026-10-23 21:27:52 | `infra-guardian` | 1 | APROVADO | a88fb9282bc97dfa5 |
| 2026-10-23 21:27:09 | 2026-10-23 21:28:52 | `conformidade-reviewer` | 1 | APROVADO | a6ab84cc05ec3a2a5 |
| 2026-10-23 21:27:12 | 2026-10-23 21:29:05 | `test-engineer` | 1 | APROVADO | a447781a7c79bd20d |
| 2026-10-23 21:27:14 | 2026-10-23 21:30:08 | `revisor-geral` | 1 | REPROVADO | a2c4284abc3a6f217 |
| 2026-10-23 21:41:07 | 2026-10-23 21:41:37 | `revisor-geral` | 2 | APROVADO | a9e546184dc5ae0e9 |
| 2026-10-23 21:41:15 | 2026-10-23 21:41:53 | `test-engineer` | 2 | APROVADO | a0d9c5bd1d1b65203 |
