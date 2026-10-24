# Tarefa 17.0 — O `/seguir` partido por passo e as paradas que viram aviso

**Funcionalidade:** harness (X7) · **Depende de:** 4.0, 6.0, 14.0
**Subagentes obrigatórios:** `conformidade-reviewer`
**Porte:** grande

## Objetivo

O Orquestrador lê, por tarefa, só o `SKILL.md` curto, o `protocolo.md` e o `passos/6-tarefa.md`, até 24 KB (hoje 41 KB);
o passo 6 traz na própria página o que usa em toda tarefa; e as paradas da D79 revista viram aviso no `/seguir`, na
`retro` e no `validador.md`.

## Contexto necessário

- `techspec.md` §9
- `prd.md` RF22 (a parte do `/seguir`), RF26, e RF9 (quando rodar o censo)
- `texto.md`: **`/seguir` e papéis** e **As paradas (revisão da D79)**
- `cenarios.md` seção C, **RF22** e **RF26**
- `docs/decisoes.md`, D79 (revista em 23/10/2026)
- Hoje: `.claude/skills/seguir/SKILL.md` 32.991 B (passo 6: 6.790 B; passo 3: 4.189; passo 9: 3.706) e `protocolo.md`
  7.922 B. Seções: 1 a 10 e "O `estado.md`"

## Subtarefas

- [x] 17.1 — `SKILL.md` fica com o cabeçalho, um índice que cita cada `passos/*.md` e diz quando entrar nele, e os passos
  1, 2 e 5; os passos 3, 4, 6, 7, 8, 9, 10 e "O `estado.md`" vão para `.claude/skills/seguir/passos/`
- [x] 17.2 — `passos/6-tarefa.md` autossuficiente: sem o que repete o protocolo; com o comando da limpeza, a abertura de
  linha, o reinício do par com `recruit --replace` e as saídas do encontro, inclusive a de código 5 (`VERIFICAÇÃO
  RECUSADA`, da 6.0), que pede a mesma correção na linha que o `CONFLITO`; sem mandar ler o passo 3, o 9 nem o `time.md`
- [x] 17.3 — Paradas: viram aviso a proposta da retro que muda só skill, papel ou modelo de documento (salvo a que mexe na
  lista de um guardião com veto ou em `criar-tasks`, `revisar-tarefa`, `revisar-spec`) e a ressalva menor da validação;
  achado das regras 10, 20 e 70 nunca é menor. No `passos/7-…`, na `retro/SKILL.md` e no `validador.md`
- [x] 17.4 — O passo de fechamento diz quando rodar `node tools/processo/esteira.ts --censo` e abrir correção (RF9)
- [x] 17.5 — O `validar` lista os commits `Fora do processo:` com código da spec (recomendação da revisão da spec)
- [x] 17.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `.claude/skills/seguir/SKILL.md` | alterado |
| `.claude/skills/seguir/passos/` (um arquivo por passo) | novos |
| `.claude/skills/seguir/protocolo.md` | alterado |
| `.claude/skills/retro/SKILL.md` | alterado |
| `.claude/skills/validar/SKILL.md` | alterado |
| `.claude/agents/validador.md` | alterado |
| `tools/processo/harness/seguir.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| RF26: os três acima de 24 KB (amostra) | unidade | vermelho |
| RF26: um dos três ausente | unidade | vermelho, um caso por arquivo |
| RF26: `6-tarefa.md` que manda ler o passo 3 / o passo 9 / o `time.md` | unidade | vermelho, um caso por termo |
| RF26: citar o passo 7 / o 8 / o 10 | unidade | verde, um caso por termo |
| RF26: `6-tarefa.md` sem o comando da limpeza / sem a abertura de linha / sem `recruit --replace` / sem `VERIFICAÇÃO RECUSADA` | unidade | vermelho, um caso por ausência |
| RF26: um `passos/*.md` que o índice do `SKILL.md` não cita | unidade | vermelho; todos citados, verde |
| RF26: o repositório depois da tarefa | unidade | abaixo do teto |
| RF22: `seguir/SKILL.md` com 500 linhas ou mais | unidade | vermelho |
| RF22: `passos/*.md` citado que não existe | unidade | vermelho |

## Como testar

- Sem precedente direto de teste sobre skill; o mais próximo é `tools/processo/estado.test.ts › lerEstado e os textos, do disco › lê do disco a validação, a revisão da spec, a retro e a marca do roadmap`, que lê arquivos de texto do repositório.
- Cada checagem é uma função sobre o texto (`(arquivos: Record<string, string>) => string[]`), rodada no repositório e numa amostra quebrada; contagem mínima: zero achados de arquivo é vermelho.
- Rodar: `npx vitest run --project unidade tools/processo/harness/seguir.test.ts`.
- Nada sai sem destino: cada parágrafo tirado do `SKILL.md` está num `passos/*.md` ou no protocolo.

## Fora do escopo desta tarefa

O diário do `executar-task` e as contradições (18.0); a limpeza vigiada e o `UserPromptSubmit` (20.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| "24 KB" são **24.000 B**, e não 24.576 | O "hoje 41 KB" do PRD e da Tech Spec é 33.128 + 7.922 = 41.050 B; só em decimal a conta fecha. Com 1.024 haveria 0,6 KB de folga que ninguém pediu | `techspec.md` §9, "O `/seguir` partido (17.0…)"; `cenarios.md` C, RF26; `texto.md`, "As paradas" |
| O teste de 500 linhas olha também cada `passos/*.md`, e não só o `seguir/SKILL.md` | O RF22 diz "cada um abaixo de 500 linhas"; sem a cerca, o `SKILL.md` encolhido empurraria o excesso para um passo | `cenarios.md` C, RF22 |
| A ressalva menor: o Validador só dá "COM RESSALVAS" quando há maior; o menor vai à seção 6 e ao `TODO.md`; o "COM RESSALVAS" só de menores o Orquestrador aceita, na linha do veredito | A D79 revista diz que ela "não segura o pouso", sem dizer o mecanismo, e o `estado.ts` só sai de `validacao-com-ressalvas` com "aceitas por" na linha (código que a 17.0 não toca) | `techspec.md` §9, "O `/seguir` partido (17.0…)"; `texto.md`, "As paradas" |
| O passo 6 repete o comando de reinício do par e a tabela dos dois comandos, que o passo 3 também tem | O RF26 pede o passo 6 sem mandar ler o passo 3; o passo 3 continua inteiro, para quem monta o time | `techspec.md` §9; `cenarios.md` C, RF26 |

## Mutações

O teste é `tools/processo/harness/seguir.test.ts`, e cada bloco mexe numa cláusula de uma checagem dele (a função sobre o texto); o
vermelho é o do caso que a prova com a amostra quebrada ou com o repositório de hoje.

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › um dos três ausente
- if (ausentes.length > 0) return ausentes.map((caminho) => `${caminho} ausente: o orçamento por tarefa não se mede sem ele`)
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › e no limite exato ainda passa
- return total > TETO_DOS_TRES ? [`SKILL.md, protocolo.md e passos/6-tarefa.md somam ${total} B, acima de ${TETO_DOS_TRES} B`] : []
+ return total >= TETO_DOS_TRES ? [`SKILL.md, protocolo.md e passos/6-tarefa.md somam ${total} B, acima de ${TETO_DOS_TRES} B`] : []
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › o acento pesa dois
- const bytes = (texto: string): number => Buffer.byteLength(texto, 'utf8')
+ const bytes = (texto: string): number => texto.length
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › mandar ler
- const manda = PROIBIDOS_NO_PASSO_6.filter(({ expressao }) => expressao.test(texto)).map(({ nome }) => `passos/6-tarefa.md manda ler ${nome}`)
+ const manda = PROIBIDOS_NO_PASSO_6.filter(({ expressao }) => !expressao.test(texto)).map(({ nome }) => `passos/6-tarefa.md manda ler ${nome}`)
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › o comando da limpeza
- const falta = OBRIGATORIOS_NO_PASSO_6.filter(({ termo }) => !contem(texto, termo)).map(({ nome }) => `passos/6-tarefa.md não traz ${nome}`)
+ const falta = OBRIGATORIOS_NO_PASSO_6.filter(({ termo }) => contem(texto, termo)).map(({ nome }) => `passos/6-tarefa.md não traz ${nome}`)
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › no plural também
- { nome: 'o passo 3', expressao: /\bpassos?\s+3\b/, amostra: 'o passo 3' },
+ { nome: 'o passo 3', expressao: /\bpasso\s+3\b/, amostra: 'o passo 3' },
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › quebrado em duas linhas
- { nome: 'o passo 3', expressao: /\bpassos?\s+3\b/, amostra: 'o passo 3' },
+ { nome: 'o passo 3', expressao: /\bpassos? 3\b/, amostra: 'o passo 3' },
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › quebrado em duas linhas
- { nome: 'o passo 9', expressao: /\bpassos?\s+9\b/, amostra: 'o passo 9' },
+ { nome: 'o passo 9', expressao: /\bpassos? 9\b/, amostra: 'o passo 9' },
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › pasta de passos ausente
- if (texto === undefined) return [`${TAREFA} ausente`]
+ if (texto === undefined) return []
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › SKILL.md ausente: vermelho
- if (texto === undefined) return [`${SKILL} ausente`]
+ if (texto === undefined) return []
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › a retro sem a seção 5
- if (secao === undefined) return ['a retro não tem a seção 5, onde ficam os grupos de aviso e de confirmação']
+ if (secao === undefined) return []
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › a retro sem
- const faltam = comVeto.filter((nome) => !secao.includes(`\`${nome}\``)).map((nome) => `a retro não lista ${nome} entre os revisores com veto`)
+ const faltam = comVeto.filter((nome) => secao.includes(`\`${nome}\``)).map((nome) => `a retro não lista ${nome} entre os revisores com veto`)
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › que não tem veto
- const sobram = semVeto.filter((nome) => secao.includes(`\`${nome}\``)).map((nome) => `a retro lista ${nome}, que não tem veto`)
+ const sobram = semVeto.filter((nome) => !secao.includes(`\`${nome}\``)).map((nome) => `a retro lista ${nome}, que não tem veto`)
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › a lista fora da seção 5 não vale
- const secao = /## 5\.[\s\S]*?(?=\n## 6\.)/.exec(arquivos['skills/retro/SKILL.md'] ?? '')?.[0]
+ const secao = /## 1\.[\s\S]*?(?=\n## 6\.)/.exec(arquivos['skills/retro/SKILL.md'] ?? '')?.[0]
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › o passo 30 e o passo 39
- { nome: 'o passo 3', expressao: /\bpassos?\s+3\b/, amostra: 'o passo 3' },
+ { nome: 'o passo 3', expressao: /\bpassos?\s+3/, amostra: 'o passo 3' },
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › mandar ler o passo 9
- { nome: 'o passo 9', expressao: /\bpassos?\s+9\b/, amostra: 'o passo 9' },
+ { nome: 'o passo 9', expressao: /\bpassos?\s+8\b/, amostra: 'o passo 9' },
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › mandar ler o arquivo do passo 3
- expressao: /passos\/3-/,
+ expressao: /passos\/4-/,
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › mandar ler o time.md
- { nome: 'o time.md', expressao: /time\.md/, amostra: 'o time.md' },
+ { nome: 'o time.md', expressao: /times\.md/, amostra: 'o time.md' },
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › um passo citado que não existe
- if (!existentes.includes(citado)) problemas.push(`o índice do SKILL.md cita passos/${citado}, que não existe`)
+ if (false) problemas.push(`o índice do SKILL.md cita passos/${citado}, que não existe`)
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › um passo novo que o índice não cita
- if (!citados.includes(nome)) problemas.push(`passos/${nome} não é citado pelo índice do SKILL.md`)
+ if (false) problemas.push(`passos/${nome} não é citado pelo índice do SKILL.md`)
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › sem dizer quando entrar
- else if (!dizQuando(texto, nome)) problemas.push(`o índice do SKILL.md cita passos/${nome} sem dizer quando entrar`)
+ else if (false) problemas.push(`o índice do SKILL.md cita passos/${nome} sem dizer quando entrar`)
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › sem dizer quando entrar
- return texto.split('\n').some((linha) => linha.startsWith('|') && linha.includes(`passos/${nome}`) && (linha.split('|')[2] ?? '').trim().length >= 10)
+ return texto.split('\n').some((linha) => linha.startsWith('|') && linha.includes(`passos/${nome}`) && (linha.split('|')[2] ?? '').trim().length >= 0)
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › fora da tabela
- return texto.split('\n').some((linha) => linha.startsWith('|') && linha.includes(`passos/${nome}`) && (linha.split('|')[2] ?? '').trim().length >= 10)
+ return texto.split('\n').some((linha) => true && linha.includes(`passos/${nome}`) && (linha.split('|')[2] ?? '').trim().length >= 10)
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › com 500 linhas: vermelho, e com 499
- .filter(([, texto]) => linhasDe(texto) >= LIMITE_DE_LINHAS)
+ .filter(([, texto]) => linhasDe(texto) > LIMITE_DE_LINHAS)
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › com 500 linhas: vermelho, e com 499
- .filter(([caminho]) => caminho === SKILL || caminho.startsWith(PASSOS))
+ .filter(([caminho]) => caminho.startsWith(PASSOS))
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › um passo com 500 linhas
- .filter(([caminho]) => caminho === SKILL || caminho.startsWith(PASSOS))
+ .filter(([caminho]) => caminho === SKILL)
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › com 500 linhas: vermelho, e com 499
- const linhasDe = (texto: string): number => texto.split('\n').length - (texto.endsWith('\n') ? 1 : 0)
+ const linhasDe = (texto: string): number => texto.split('\n').length - 0
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › o passo 10 sem arquivo
- for (let passo = 1; passo <= 10; passo += 1) {
+ for (let passo = 1; passo <= 9; passo += 1) {
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › os dez passos, cada um no arquivo
- else if (/^\d+-/.test(nome)) numeros.add(Number(/^(\d+)-/.exec(nome)?.[1]))
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › os dez passos, cada um no arquivo
- for (const achado of (arquivos[SKILL] ?? '').matchAll(/^## (\d+)\. /gm)) numeros.add(Number(achado[1]))
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › o passo sem número que não começa
- if (numero === undefined) return titulo.startsWith('## ') ? null : `passos/${nome} não começa por um título "## "`
+ if (numero === undefined) return true ? null : `passos/${nome} não começa por um título "## "`
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › o arquivo cujo título é o de outro passo
- return titulo.startsWith(`## ${numero}. `) ? null : `passos/${nome} começa por "${titulo}", e o título deveria ser o do passo ${numero}`
+ return true ? null : `passos/${nome} começa por "${titulo}", e o título deveria ser o do passo ${numero}`
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › sem a marca
- if (!contem(arquivos[caminho] ?? '', marca)) problemas.push(`${arquivo} perdeu "${marca}"`)
+ if (false) problemas.push(`${arquivo} perdeu "${marca}"`)
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › sem o texto, vermelho
- return REQUISITOS_DO_TEXTO.filter(({ arquivo, termo }) => !contem(arquivos[arquivo] ?? '', termo)).map(({ nome }) => `falta no texto: ${nome}`)
+ return REQUISITOS_DO_TEXTO.filter(({ arquivo, termo }) => false).map(({ nome }) => `falta no texto: ${nome}`)
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › o repositório de hoje passa, com todos os requisitos contados
- const padrao = (termo: string): RegExp => new RegExp(termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'), 'g')
+ const padrao = (termo: string): RegExp => new RegExp(termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
```

```mutacao
arquivo: tools/processo/harness/seguir.test.ts
teste: tools/processo/harness/seguir.test.ts › o repositório de hoje passa: todo passo citado
- .filter((caminho) => caminho.startsWith(PASSOS))
```

Sem bloco, de propósito: os `?? ''` de fallback que o `noUncheckedIndexedAccess` pede; o `catch` do `ler` e do `nomesDosPassos` (a pasta
ou o arquivo ausente: a ausência do `passos/` é provada pelo caso "pasta de passos ausente", que tira os arquivos da amostra, e não pelo
disco); o `.filter((nome) => nome.endsWith('.md'))` e o `.sort()` do `nomesDosPassos` (o `passos/` só tem `.md` e a ordem da pasta não
muda o resultado); o `if (texto !== null)` do `pegar`; os mínimos de contagem do repositório de hoje (asserção, e não cláusula); as
constantes `RAIZ`, `SEGUIR`, `PASSOS` e o `import.meta.dirname`; e o texto de cada `REQUISITOS_DO_TEXTO` e de cada marca, que é dado:
o caso `sem o texto, vermelho` tira cada termo da amostra e exige a frase exata; e o `...revisoresDaRetro(arquivos)` do agregador
`todas`, que só soma as checagens e afirma que o repositório de hoje não acha nada (cada checagem tem o seu describe, e o da lista de
guardiões com veto da retro prova a sua com a amostra quebrada).

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| conformidade-reviewer (1ª) | O grupo de confirmação da `retro` incluir o arquivo inteiro de cada guardião com veto, o `mesa-de-revisao.md` e a §6 do `validador.md` ("o aviso cobre mais do que deveria") | `TODO.md`, para o Joaquim: é revisão da D79 (muda o desenho da regra de aplicar, e a D79 é dele), não ajuste desta tarefa |
| revisor-geral (1ª) | `.claude/skills/vigia/SKILL.md:30` apontar direto para `passos/3-time-e-andar.md` | `TODO.md`: a tarefa não toca esse arquivo, e o índice do `SKILL.md` já resolve o caminho; a 20.0 só altera o passo da vigia, não a skill |
| revisor-geral (2ª) | `retro/SKILL.md:91`: "salvo os do grupo seguinte" deveria ser "salvo as do grupo seguinte" (propostas são femininas), e a linha passa de 120 colunas; a troca vai junto ao termo exigido em `seguir.test.ts` | `TODO.md`: ajuste de texto, sem efeito no comportamento; quem mexer na `retro` na próxima vez troca o texto e o termo do teste juntos |
| revisor-geral (2ª) | `retro/SKILL.md:95-98`: a lista existe duas vezes (o nome da constante e os seis nomes à mão); citar só a constante bastaria | Recusada: o teste `revisoresDaRetro` segura a divergência, e a lista com os nomes é o que o Joaquim lê ao confirmar |
| conformidade-reviewer (2ª) | A recomendação da 1ª rodada (ampliar o grupo de confirmação ao arquivo inteiro de cada guardião, ao `mesa-de-revisao.md` e à §6 do `validador.md`) ainda não está no `TODO.md` | `TODO.md`: entrou, com a linha da `vigia/SKILL.md` da 1ª rodada |
| conformidade-reviewer (2ª) | `passos/7-paradas.md:32` descreve o aviso da retro sem a ressalva "salvo os do grupo seguinte" | `TODO.md`: texto de passo condicional; a `retro` manda, e quem lê o passo 7 vai à `retro` para aplicar |
| conformidade-reviewer (2ª) | `validador.md:136` dizer que um commit `Fora do processo:` que toca nota, correção, tutor ou saída de IA é lido contra a regra 70 | `TODO.md`: já se deduz da classificação da §6 do validador; entra na próxima edição do papel |
| test-engineer (2ª) | O teste importa as listas de `../revisoes.ts`, e a retro aponta `documento-de-revisao.ts` | Recusada: o `revisoes.ts` reexporta o arquivo (RF13), os dois resolvem para as mesmas constantes |
| test-engineer (2ª) | Os 68 B de folga do orçamento: levar ao `/retro` | `/retro` da X7, via `TODO.md`: a `techspec.md` §9 já avisa que o próximo acréscimo tira texto de outro lugar |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-24 00:47:04 | 2026-10-24 00:47:41 | `revisor-geral` | 2 | APROVADO | a184cec9ab4ac9c72 |
| 2026-10-24 00:46:50 | 2026-10-24 00:47:43 | `conformidade-reviewer` | 2 | APROVADO | ac8536cf088d60d90 |
| 2026-10-24 00:46:57 | 2026-10-24 00:47:44 | `test-engineer` | 2 | APROVADO | abf69753e17037f94 |
