# Tarefa 21.0 — Uma skill de projeto aponta as receitas do guia, e a esteira prova que os caminhos existem

**Funcionalidade:** harness (X7) · **Depende de:** 16.0, 18.0, 19.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`
**Porte:** grande
<!-- Decisão do Joaquim, 23/10/2026. T, P e C: a skill aponta as receitas das regras 10, 20 e 70; o job (regra 80) fica
     com a revisão do `revisor-geral`, pelo teto de três. -->

## Objetivo

O agente acha pelo assunto a receita do guia, o exemplo e as travas, sem a receita em dois lugares; a esteira acusa
caminho que some e skill que se afasta do guia.

## Contexto necessário

- `techspec.md` §9, **Receitas (RF32)** e **O que conta como caminho**; `prd.md` RF32 e RF21; `cenarios.md` C, **RF32**
- `docs/guia-do-desenvolvedor.md` §5 a §7; D81
- `.claude/skills/executar-task/SKILL.md` (`## 1. Contexto`), `.claude/skills/criar-techspec/template.md` (§2), `CLAUDE.md` (mapa),
  `tools/processo/harness/caminhos.test.ts` (16.0), `metadados.test.ts` (19.0)

## Subtarefas

- [x] 21.1 — `.claude/skills/receitas-de-codigo/SKILL.md`, como no §9 (`user-invocable: false`)
- [x] 21.2 — Os quatro apontamentos do §9 (`executar-task`, modelo da Tech Spec, `CLAUDE.md`, guia)
- [x] 21.3 — Se a extração da 16.0 está dentro do teste, vai para `tools/processo/harness/caminhos.ts` sem mudar o que
  devolve; o filtro do §9 fica no `receitas.test.ts`
- [x] 21.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `.claude/skills/receitas-de-codigo/SKILL.md` | novo |
| `.claude/skills/executar-task/SKILL.md`, `.claude/skills/criar-techspec/template.md` | alterados |
| `CLAUDE.md`, `docs/guia-do-desenvolvedor.md` | alterados, uma linha cada |
| `tools/processo/harness/receitas.test.ts` | novo |
| `tools/processo/harness/caminhos.ts`, `tools/processo/harness/caminhos.test.ts` | só pela 21.3 |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| skill cita `apps/api/src/inexistente.ts` | unidade | vermelho |
| guia cita caminho inexistente na §5, §6, §7 | unidade | vermelho, um caso por seção |
| quem contorna é acusado: o inexistente com `./` ou entre aspas, na skill e no guia | unidade | vermelho, um caso por forma e lado |
| placeholder `apps/api/src/inexistente/<modulo>/x.ts` | unidade | vermelho |
| placeholder `apps/api/src/<modulo>/x.int.test.ts` | unidade | verde |
| glob que não casa nada | unidade | vermelho |
| `componentes/dialogos.tsx`, `guardas/log-sem-dado-pessoal`, `/v1/disciplinas` | unidade | fora da conferência, verde |
| exemplo fora da linha com `Exemplo:` da seção | unidade | vermelho |
| exemplo sem pasta da raiz | unidade | vermelho |
| linha sem exemplo | unidade | vermelho |
| linha sem trava | unidade | vermelho |
| linha que aponta `5.9` | unidade | vermelho |
| `### 5.x` sem linha | unidade | vermelho |
| trava fora da coluna "Trava" da §7 (a célula exata, com as crases) | unidade | vermelho |
| trava pela metade ("Lint") | unidade | vermelho |
| código por ` ``` `, por `~~~`, por recuo de quatro espaços | unidade | vermelho, um caso cada |
| skill com 61 linhas | unidade | vermelho |
| skill acima de 6.000 B | unidade | vermelho |
| `description` sem a palavra de um assunto | unidade | vermelho, um caso por assunto |
| skill sem a seção 11 da Tech Spec | unidade | vermelho |
| `## 1. Contexto` do `executar-task` sem o nome (em outra seção não vale) | unidade | vermelho |
| §2 do modelo da Tech Spec sem o nome | unidade | vermelho |
| `CLAUDE.md` sem `docs/guia-do-desenvolvedor.md` | unidade | vermelho |
| guia sem o nome da skill | unidade | vermelho |
| a guarda reprova quando o alvo dela não existe: guia ausente; guia sem §5 | unidade | vermelho, um caso cada |
| o repositório de hoje | unidade | verde: tantas linhas quantas `### 5.x`, pelo menos seis, cada uma com exemplo e trava; linhas da §7 contadas; caminhos conferidos na §5, §6, §7 e skill, cada contagem acima de zero e afirmada |

## Como testar

- Precedente: `tools/processo/harness/rotulos.test.ts › os modelos de hoje passam, e a conferência acha os rótulos e os
  nomes que espera` (verde com contagem) e `› pasta sem nenhum modelo: vermelho nos quatro, e nenhum rótulo achado`
  (alvo ausente); amostra em `mkdtempSync` com `cpSync`.
- A extração é a da 16.0; não reescreva.
- Rodar: `npx vitest run --project unidade tools/processo/harness/` (com o `metadados.test.ts` e a base fixa do RF20).
- Armadilha: o que faltar vai para o guia, não para a skill (RF21).

## Fora do escopo desta tarefa

Mudar as receitas do guia; as skills de terceiro (19.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

O teste é `tools/processo/harness/receitas.test.ts` (e, para a extração movida, `caminhos.test.ts`); cada bloco mexe numa cláusula de
uma conferência (a função sobre a pasta-raiz), e o vermelho é o do caso que a prova com a amostra quebrada ou com o repositório de
hoje. O texto da skill e os quatro apontamentos não têm cláusula: a prova deles é esse teste. `caminhos.ts` é o código da 16.0 movido
sem mudar o que devolve, e a prova dele continua em `caminhos.test.ts`.

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › ## 1. Contexto do executar-task sem o nome
-  if (inicio === -1) return null
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › a skill e o guia passam
-  const fim = linhas.findIndex((linha, indice) => indice > inicio && linha.startsWith('## '))
+  const fim = linhas.findIndex((linha) => linha.startsWith('## '))
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › ## 1. Contexto do executar-task sem o nome
-  return linhas.slice(inicio, fim === -1 ? undefined : fim).join('\n')
+  return linhas.slice(inicio).join('\n')
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › a skill e o guia passam
 .split('|')
-    .slice(1, -1)
+    .slice(0, -1)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › a skill e o guia passam
 .slice(1, -1)
-    .map((celula) => celula.trim())
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › a skill e o guia passam
-const linhasDeDados = (texto: string): string[] => texto.split('\n').filter((linha) => linha.startsWith('|')).slice(2)
+const linhasDeDados = (texto: string): string[] => texto.split('\n').filter((linha) => linha.startsWith('|')).slice(1)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › exemplo sem pasta da raiz: vermelho
-const caminhosDe = (texto: string): string[] => extrairCaminhos(texto).filter(ehCaminho).map((caminho) => caminho.replace(/^\.\//, ''))
+const caminhosDe = (texto: string): string[] => extrairCaminhos(texto).map((caminho) => caminho.replace(/^\.\//, ''))
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › escrito com ./ é o mesmo caminho do guia
-const caminhosDe = (texto: string): string[] => extrairCaminhos(texto).filter(ehCaminho).map((caminho) => caminho.replace(/^\.\//, ''))
+const caminhosDe = (texto: string): string[] => extrairCaminhos(texto).filter(ehCaminho)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › a skill e o guia passam
-  const partes = secao5.split(/^(?=### 5\.\d+\b)/m).slice(1)
+  const partes = secao5.split(/^(?=### 5\.\d+\b)/m)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › caminho que o guia cita fora da linha Exemplo:
-    const linhas = parte.split('\n').filter((linha) => linha.includes('Exemplo:'))
+    const linhas = parte.split('\n')
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › sem linha Exemplo: com caminho da raiz
-    if (exemplos.size === 0) falhas.push(`${GUIA}: a ${numero} não tem linha Exemplo: com caminho da raiz`)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › guia ausente
   if (texto === null) {
-    falhas.push(`${GUIA} não existe`)
     return null
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › guia sem a §5
-    if (achada === null) falhas.push(`${GUIA} não tem a §${indice + 5}`)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › guia sem a §5
-  if (achadas.length < secoes.length) return null
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › sem nenhuma ### 5.x
-  if (receitas.length === 0) falhas.push(`${GUIA}: a §5 não tem nenhuma ### 5.x`)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › frontmatter sem description, ou sem frontmatter
-    return typeof descricao === 'string' ? descricao : null
+    return descricao as string
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › frontmatter que não é YAML válido
     return typeof descricao === 'string' ? descricao : null
 } catch {
-    return null
+    return ''
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › código por cerca de três til
-  const cerca = linhas.findIndex((linha) => /^ {0,3}(```|~~~)/.test(linha))
+  const cerca = linhas.findIndex((linha) => /^ {0,3}(```)/.test(linha))
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › código por cerca de três crases
-  if (cerca !== -1) return `cerca na linha ${cerca + 1}`
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › código por recuo de tabulação
-  const recuo = linhas.findIndex((linha) => /^( {4}|\t)/.test(linha))
+  const recuo = linhas.findIndex((linha) => /^( {4})/.test(linha))
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › código por recuo de quatro espaços
-  return recuo === -1 ? null : `recuo na linha ${recuo + 1}`
+  return null
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › 60 linhas passam
-  const linhas = skill.replace(/\n$/, '').split('\n').length
+  const linhas = skill.split('\n').length
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › 60 linhas passam
-  if (linhas > LIMITE_DE_LINHAS) falhas.push(`${SKILL} tem ${linhas} linhas, e o limite é ${LIMITE_DE_LINHAS}`)
+  if (linhas >= LIMITE_DE_LINHAS) falhas.push(`${SKILL} tem ${linhas} linhas, e o limite é ${LIMITE_DE_LINHAS}`)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › 6.000 B passam
-  const bytes = Buffer.byteLength(skill)
+  const bytes = skill.length
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › 6.000 B passam
-  if (bytes > LIMITE_DE_BYTES) falhas.push(`${SKILL} tem ${bytes} B, e o limite é ${LIMITE_DE_BYTES}`)
+  if (bytes >= LIMITE_DE_BYTES) falhas.push(`${SKILL} tem ${bytes} B, e o limite é ${LIMITE_DE_BYTES}`)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › código por cerca de três crases
-  if (codigo !== null) falhas.push(`${SKILL} tem código (${codigo})`)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › frontmatter sem description, ou sem frontmatter
 falhas.push(`${SKILL}: o frontmatter não tem description`)
-    return
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › description sem a palavra
-    if (!palavra.test(descricao)) falhas.push(`${SKILL}: a description não tem a palavra ${JSON.stringify(assunto)}`)
+    if (palavra.test(descricao)) falhas.push(`${SKILL}: a description não tem a palavra ${JSON.stringify(assunto)}`)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › não começa pelo número de uma seção
-    falhas.push(`${SKILL}: a linha ${JSON.stringify(primeira)} não começa pelo número de uma seção 5.x`)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › não começa pelo número de uma seção
 falhas.push(`${SKILL}: a linha ${JSON.stringify(primeira)} não começa pelo número de uma seção 5.x`)
-    return
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › linha que aponta 5.9
-  if (receita === undefined) falhas.push(`${SKILL}: a linha ${numero} aponta uma seção que o guia não tem`)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › duas linhas para a mesma seção
-  if (vistos.has(numero)) falhas.push(`${SKILL}: a seção ${numero} tem mais de uma linha`)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › duas linhas para a mesma seção
-  vistos.add(numero)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › linha sem exemplo
-  if (exemplo === '') falhas.push(`${SKILL}: a linha ${numero} não tem exemplo`)
-  else if (exemplos.length === 0) falhas.push(`${SKILL}: o exemplo da linha ${numero} não tem pasta da raiz`)
+  if (exemplos.length === 0) falhas.push(`${SKILL}: o exemplo da linha ${numero} não tem pasta da raiz`)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › exemplo sem pasta da raiz
   if (exemplo === '') falhas.push(`${SKILL}: a linha ${numero} não tem exemplo`)
-  else if (exemplos.length === 0) falhas.push(`${SKILL}: o exemplo da linha ${numero} não tem pasta da raiz`)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › exemplo fora da linha com Exemplo:
-  for (const caminho of receita === undefined ? [] : exemplos.filter((achado) => !receita.exemplos.has(achado))) {
+  for (const caminho of receita === undefined ? [] : exemplos.filter((achado) => receita.exemplos.has(achado))) {
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › linha que aponta 5.9
-  for (const caminho of receita === undefined ? [] : exemplos.filter((achado) => !receita.exemplos.has(achado))) {
+  for (const caminho of exemplos.filter((achado) => !receita.exemplos.has(achado))) {
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › a skill e o guia passam
-  const citadas = travas.split(';').map((trava) => trava.trim()).filter((trava) => trava !== '')
+  const citadas = travas.split(';').filter((trava) => trava !== '')
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › linha sem trava
-  const citadas = travas.split(';').map((trava) => trava.trim()).filter((trava) => trava !== '')
+  const citadas = travas.split(';').map((trava) => trava.trim())
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › linha sem trava
-  if (citadas.length === 0) falhas.push(`${SKILL}: a linha ${numero} não tem trava`)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › trava pela metade
-  for (const trava of citadas.filter((citada) => !guia.travas.has(citada))) {
+  for (const trava of citadas.filter((citada) => guia.travas.has(citada))) {
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › a skill e o guia passam
-  const citadas = travas.split(';').map((trava) => trava.trim()).filter((trava) => trava !== '')
+  const citadas = travas.split(',').map((trava) => trava.trim()).filter((trava) => trava !== '')
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › quem contorna é acusado no skill: o caminho escrito com crase
-    if (problema !== null) falhas.push(`${lugar} cita ${caminho}: ${problema}`)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › skill ausente
-  if (skill === null) falhas.push(`${SKILL} não existe`)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › skill ausente
-  if (skill === null) return resultado
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › quem contorna é acusado no guia §5: o caminho escrito com crase
-    caminhos.secao5 = conferirCaminhos(guia.secao5, `${GUIA} §5`, raiz, falhas)
+    caminhos.secao5 = conferirCaminhos(guia.secao6, `${GUIA} §5`, raiz, falhas)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › quem contorna é acusado no guia §6: o caminho escrito com crase
-    caminhos.secao6 = conferirCaminhos(guia.secao6, `${GUIA} §6`, raiz, falhas)
+    caminhos.secao6 = conferirCaminhos(guia.secao5, `${GUIA} §6`, raiz, falhas)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › quem contorna é acusado no guia §7: o caminho escrito com crase
-    caminhos.secao7 = conferirCaminhos(guia.secao7, `${GUIA} §7`, raiz, falhas)
+    caminhos.secao7 = conferirCaminhos(guia.secao5, `${GUIA} §7`, raiz, falhas)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › sem a seção 11 da Tech Spec
-  if (!/seção 11 da Tech Spec/.test(skill)) falhas.push(`${SKILL} não manda o desvio para a seção 11 da Tech Spec`)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › guia ausente
-  if (guia === null) return resultado
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › ### 5.x do guia sem linha na skill
-  for (const receita of guia.receitas.filter((achada) => !vistos.has(achada.numero))) {
+  for (const receita of guia.receitas.filter((achada) => vistos.has(achada.numero))) {
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › a skill e o guia passam
-  resultado.linhasDaSkill = linhas.length
+  resultado.linhasDaSkill = 0
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › a skill e o guia passam
-    resultado.receitasDoGuia = guia.receitas.length
+    resultado.receitasDoGuia = 0
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › a skill e o guia passam
-    resultado.travasDaSecao7 = guia.travas.size
+    resultado.travasDaSecao7 = 0
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › ## 1. Contexto do executar-task sem o nome
-    { arquivo: EXECUTAR_TASK, onde: 'a seção ## 1. Contexto', nome: NOME_DA_SKILL, trecho: (texto) => secao(texto, /^## 1\. Contexto/) },
+    { arquivo: EXECUTAR_TASK, onde: 'a seção ## 1. Contexto', nome: NOME_DA_SKILL, trecho: (texto) => texto },
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › §2 do modelo da Tech Spec sem o nome
-    { arquivo: MODELO_DA_TECHSPEC, onde: 'a seção ## 2. Módulos afetados', nome: NOME_DA_SKILL, trecho: (texto) => secao(texto, /^## 2\. Módulos afetados/) },
+    { arquivo: MODELO_DA_TECHSPEC, onde: 'a seção ## 2. Módulos afetados', nome: NOME_DA_SKILL, trecho: (texto) => texto },
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › guia sem o nome da skill no topo
-    { arquivo: GUIA, onde: 'o topo, antes da §1', nome: NOME_DA_SKILL, trecho: (texto) => texto.split('\n## ')[0] ?? '' },
+    { arquivo: GUIA, onde: 'o topo, antes da §1', nome: NOME_DA_SKILL, trecho: (texto) => texto },
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › CLAUDE.md sem docs/guia-do-desenvolvedor.md
-    else if (!parte.includes(nome)) falhas.push(`${arquivo}: ${onde} não cita ${nome}`)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › ## 1. Contexto do executar-task sem o nome
-    else if (parte === null) falhas.push(`${arquivo} não tem ${onde}`)
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › arquivo ausente: vermelho, um por arquivo
-    if (texto === null) falhas.push(`${arquivo} não existe`)
+    if (texto === null) falhas.push(`${arquivo}`)
```

```mutacao
arquivo: tools/processo/harness/caminhos.ts
teste: tools/processo/harness/caminhos.test.ts › placeholder: confere a pasta antes dele
-    return statSync(caminho).isDirectory()
+    return statSync(caminho) !== undefined
```

```mutacao
arquivo: tools/processo/harness/caminhos.ts
teste: tools/processo/harness/caminhos.test.ts › placeholder: confere a pasta antes dele
 } catch {
-    return false
+    return true
```

```mutacao
arquivo: tools/processo/harness/caminhos.ts
teste: tools/processo/harness/caminhos.test.ts › placeholder: confere a pasta antes dele
-    const pasta = antes.endsWith('/') ? antes : dirname(antes)
+    const pasta = antes
```

```mutacao
arquivo: tools/processo/harness/caminhos.ts
teste: tools/processo/harness/caminhos.test.ts › glob: casa ao menos um arquivo
-  if (caminho.includes('*')) return globSync(caminho, { cwd: raiz }).length > 0 ? null : 'o padrão não casa com nenhum arquivo'
+  if (caminho.includes('*')) return globSync(caminho, { cwd: raiz }).length >= 0 ? null : 'o padrão não casa com nenhum arquivo'
```

```mutacao
arquivo: tools/processo/harness/caminhos.ts
teste: tools/processo/harness/caminhos.test.ts › o sufixo :<linha> e #<âncora> não conta
-  const caminho = token.replace(/^\.\//, '').replace(/#.*$/, '').replace(/:\d+(?:-\d+)?$/, '')
+  const caminho = token.replace(/^\.\//, '').replace(/#.*$/, '')
```

```mutacao
arquivo: tools/processo/harness/caminhos.ts
teste: tools/processo/harness/caminhos.test.ts › o sufixo :<linha> e #<âncora> não conta
-  const caminho = token.replace(/^\.\//, '').replace(/#.*$/, '').replace(/:\d+(?:-\d+)?$/, '')
+  const caminho = token.replace(/^\.\//, '').replace(/:\d+(?:-\d+)?$/, '')
```

```mutacao
arquivo: tools/processo/harness/caminhos.ts
teste: tools/processo/harness/caminhos.test.ts › quem contorna é acusado: o caminho escrito com aspas simples
-    ...[...texto.matchAll(/(["'])([^"'`\s]+)\1/g)].map((achado) => achado[2] ?? ''),
```

```mutacao
arquivo: tools/processo/harness/caminhos.ts
teste: tools/processo/harness/caminhos.test.ts › só é caminho o que, sem o ./
-  const semPonto = token.replace(/^\.\//, '')
+  const semPonto = token
```

```mutacao
arquivo: tools/processo/harness/receitas.test.ts
teste: tools/processo/harness/receitas.test.ts › código por cerca recuada em três espaços
-  const cerca = linhas.findIndex((linha) => /^ {0,3}(```|~~~)/.test(linha))
+  const cerca = linhas.findIndex((linha) => /^(```|~~~)/.test(linha))
```

```mutacao
arquivo: tools/processo/harness/caminhos.ts
teste: tools/processo/harness/caminhos.test.ts › quem contorna é acusado
- ...[...texto.matchAll(/(?<![\w./`'"-])(\.\/[^\s`'",;)\]]+)/g)].map((achado) => achado[1] ?? ''),
```

```mutacao
arquivo: tools/processo/harness/caminhos.ts
teste: tools/processo/harness/caminhos.test.ts › quem contorna é acusado
- ...[...texto.matchAll(/`([^`\s]+)`/g)].map((achado) => achado[1] ?? ''),
```

```mutacao
arquivo: tools/processo/harness/caminhos.ts
teste: tools/processo/harness/caminhos.test.ts › sem repetir
- return [...new Set(achados)]
+ return achados
```

```mutacao
arquivo: tools/processo/harness/caminhos.ts
teste: tools/processo/harness/caminhos.test.ts › só é caminho o que
- export const PASTAS_DA_RAIZ = ['apps/', 'packages/', 'tools/', 'e2e/', 'infra/', 'docs/', '.claude/']
+ export const PASTAS_DA_RAIZ = ['apps/', 'packages/', 'tools/', 'e2e/', 'docs/', '.claude/']
```

```mutacao
arquivo: tools/processo/harness/caminhos.ts
teste: tools/processo/harness/caminhos.test.ts › placeholder: confere a pasta
- if (placeholder !== null) {
+ if (false) {
```

```mutacao
arquivo: tools/processo/harness/caminhos.ts
teste: tools/processo/harness/caminhos.test.ts › placeholder: confere a pasta
- const pasta = antes.endsWith('/') ? antes : dirname(antes)
+ const pasta = dirname(antes)
```

```mutacao
arquivo: tools/processo/harness/caminhos.ts
teste: tools/processo/harness/caminhos.test.ts › placeholder: confere a pasta
- return ehPasta(join(raiz, pasta)) ? null : `a pasta ${pasta} não existe`
+ return null
```

```mutacao
arquivo: tools/processo/harness/caminhos.ts
teste: tools/processo/harness/caminhos.test.ts › glob: casa ao menos um arquivo
- if (caminho.includes('*')) return globSync(caminho, { cwd: raiz }).length > 0 ? null : 'o padrão não casa com nenhum arquivo'
+ if (false) return globSync(caminho, { cwd: raiz }).length > 0 ? null : 'o padrão não casa com nenhum arquivo'
```

```mutacao
arquivo: tools/processo/harness/caminhos.ts
teste: tools/processo/harness/caminhos.test.ts › amostra que cita apps/api/src/inexistente.ts
- return existsSync(join(raiz, caminho)) ? null : 'não existe'
+ return null
```

```mutacao
arquivo: tools/processo/harness/caminhos.ts
teste: tools/processo/harness/caminhos.test.ts › o ./ só conta solto
- ...[...texto.matchAll(/(?<![\w./`'"-])(\.\/[^\s`'",;)\]]+)/g)].map((achado) => achado[1] ?? ''),
+ ...[...texto.matchAll(/(\.\/[^\s`'",;)\]]+)/g)].map((achado) => achado[1] ?? ''),
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| tenancy-guardian (1ª) | Linha 5.2 da skill sem a trava do item 10.2 (`anoLetivoId` em tabela que varia por período), que só a revisão garante | RF21: o que falta vai para o guia, não para a skill; mudar o guia está fora do escopo da 21.0. Destino: retro da X7 |
| privacy-guardian (1ª) | Linha 5.4 sem o mínimo enviado, o identificador no lugar do nome e o provedor local (regra 20, itens 12 e 13); conferir se a §5.4 do guia trata deles | Mesmo motivo (RF21 e escopo). Destino: retro da X7, junto com as duas de baixo, na §5.4 do guia |
| conformidade-reviewer (1ª) | Frase na linha 5.4 da skill de que a regra 70 (aprovação, AIA, D55) é da revisão | RF21: o lugar é a §5.4 do guia. Destino: retro da X7 |
| conformidade-reviewer (1ª) | A §5.4 do guia não cita a D55 | Mudar as receitas do guia está fora do escopo da 21.0. Destino: retro da X7 |
| revisor-geral (1ª) | A skill tem mais frases fora da tabela do que as três da §9 da Tech Spec | Recusada: não fere nenhum limite que o teste confere (60 linhas, 6.000 B) e o próprio revisor deixa "à escolha"; mexer na skill caducaria todos os revisores por ganho de texto |
| revisor-geral (1ª) | `conferirReceitas` e `conferirApontamentos` exportadas de dentro de um arquivo de teste | Recusada: segue o precedente da 16.0 e nada as importa hoje. Se outro teste vier a usá-las, mover para um `receitas.ts`, como a 21.3 fez com `caminhos.ts` |
| revisor-geral (2ª) e test-engineer (2ª) | Seis dos dez blocos novos de `caminhos.ts` citam o teste por prefixo curto ("quem contorna é acusado", "sem repetir", "placeholder: confere a pasta", "só é caminho o que"); o `-t` casa por substring e pode pegar mais de um caso do `it.each` | Recusada: são os nomes da 16.0, o `test-engineer` conferiu que todos existem em `caminhos.test.ts` e que o parser os aceita; citar o caso exato é ganho de precisão sem risco aberto. Destino: retro da X7 |
| revisor-geral (2ª) | Dois blocos novos (crase e `./`, ambos em "quem contorna é acusado") só apagam uma linha e não põem nada no lugar; conferir se a ferramenta de mutação aceita bloco só de remoção | O `test-engineer` (2ª) conferiu o parser (`mutacoes.ts:83`, `:184`) e aprovou a forma; os blocos são os da 16.0. Sem destino: nada a fazer |
| test-engineer (2ª) | O comentário de `codigoNaSkill` (`receitas.test.ts:137`) não diz que a cerca pode vir com até três espaços de recuo | Recusada: só comentário e caduca o `revisor-geral` por ganho de texto; destino: retro da X7 |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-24 02:18:49 | 2026-10-24 02:19:14 | `tenancy-guardian` | 1 | APROVADO | a6366672328941a18 |
| 2026-10-24 02:18:51 | 2026-10-24 02:19:21 | `privacy-guardian` | 1 | APROVADO | a86c4e21cf37f0594 |
| 2026-10-24 02:18:52 | 2026-10-24 02:19:22 | `conformidade-reviewer` | 1 | APROVADO | a9b0230dd0377d826 |
| 2026-10-24 02:18:55 | 2026-10-24 02:19:59 | `revisor-geral` | 1 | APROVADO | accdf45e6835f8ab7 |
| 2026-10-24 02:18:53 | 2026-10-24 02:21:14 | `test-engineer` | 1 | REPROVADO | ac5f84153590dd4b0 |
| 2026-10-24 02:27:49 | 2026-10-24 02:28:14 | `revisor-geral` | 2 | APROVADO | a54ba7f80f0a0829b |
| 2026-10-24 02:27:41 | 2026-10-24 02:28:27 | `test-engineer` | 2 | APROVADO | a10adb615db58c199 |
