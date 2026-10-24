# Tarefa 19.0 — Skills de terceiro, papéis e metadados auditados e provados na esteira

**Funcionalidade:** harness (X7) · **Depende de:** 15.0, 18.0
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

Cada skill de terceiro fica, sai ou carrega o conflito na primeira linha depois do frontmatter, conferido por teste; os
quatro papéis do time ganham critério de saída e entrega; a `status` e a `frontend-design` saem; e um teste do harness
deixa a esteira vermelha com metadado quebrado (skill, papel, `paths:`, comando de hook).

## Contexto necessário

- `techspec.md` §9
- `prd.md` RF23, RF24 (a parte dos papéis), RF30
- `texto.md`: **Skills de terceiro (RF23)** e **Auditoria e critério de saída (RF23, RF24)**
- `cenarios.md` seção C, **RF23**, **RF24** (papel sem critério, `status` citada) e **RF30**
- Arquivos: `skills-lock.json`; `.claude/skills/*/SKILL.md` (frontmatter); `docs/skills-de-terceiros.md` (15.0);
  `.claude/agents/arquiteto.md`, `implementador.md`, `mesa-de-revisao.md`, `validador.md`; `.claude/settings.json`
  (os comandos dos hooks); `docs/processo-licoes.md` (18.0)

## Subtarefas

- [x] 19.1 — Auditoria das skills de processo e de terceiro (objetivo, escopo, conflito, redundância, desatualização,
  decisão), em tabela no `docs/processo-licoes.md`
- [x] 19.2 — Sai `frontend-design` (pasta e `skills-lock.json`); as cinco do `texto.md` levam o conflito na primeira linha
  depois do frontmatter, igual ao `docs/skills-de-terceiros.md`
- [x] 19.3 — Sai a skill `status`, e toda citação dela (`grep -rn "status" .claude/ CLAUDE.md` pelo nome da skill)
- [x] 19.4 — Seção "Critério de saída" nos quatro papéis do time
- [x] 19.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `.claude/skills/frontend-design/` | removido |
| `.claude/skills/status/` | removido |
| `skills-lock.json` | alterado |
| `.claude/skills/supabase-postgres-best-practices/SKILL.md`, `.claude/skills/vercel-react-best-practices/SKILL.md`, `.claude/skills/lgpd-brasil/SKILL.md`, `.claude/skills/playwright-best-practices/SKILL.md`, `.claude/skills/nestjs-best-practices/SKILL.md` | alterados |
| `.claude/agents/arquiteto.md`, `.claude/agents/implementador.md`, `.claude/agents/mesa-de-revisao.md`, `.claude/agents/validador.md` | alterados |
| `docs/processo-licoes.md` | alterado |
| `tools/processo/harness/metadados.test.ts` | novo |
| `.claude/agents/test-engineer.md`, `.claude/rules/30-camada-ia.md` | alterados (dois defeitos que o teste achou; ver as divergências) |
| `tools/processo/harness/revisores.test.ts` | alterado (lê só a seção 1 das lições) |
| `.claude/skills/seguir/time.md`, `docs/skills-de-terceiros.md` (a linha da `lgpd-brasil` mudou nos dois lugares, por pedido do `privacy-guardian`), `tools/processo/estado.ts` (só um comentário) | alterados |
| `tasks/prd-harness/techspec.md`, `tasks/prd-harness/cenarios.md` | alterados (as divergências) |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| RF23: skill da lista sem a linha de conflito, ou com texto diferente de `docs/skills-de-terceiros.md` | unidade | vermelho (acusa, não reaplica) |
| RF23: `frontend-design` no `skills-lock.json` | unidade | vermelho |
| RF23: as cinco com a linha | unidade | verde |
| RF24: papel do time sem a seção de critério de saída | unidade | vermelho |
| RF24: a skill `status` ainda citada | unidade | vermelho |
| RF30: skill sem `name` / sem `description` | unidade | vermelho, um caso cada |
| RF30: papel sem `model` / sem `tools` | unidade | vermelho, um caso cada |
| RF30: `paths:` que não casa com nada | unidade | vermelho |
| RF30: comando de hook apontando arquivo que não existe | unidade | vermelho |
| RF30: o repositório de hoje | unidade | verde, com contagem mínima |
| quem contorna é acusado: a linha de conflito na segunda linha depois do frontmatter | unidade | vermelho |

## Como testar

- Precedente: `tools/processo/harness/rotulos.test.ts` (1.0) e `revisores.test.ts` (18.0), que leem arquivo do repositório e de amostra em `mkdtempSync`.
- O frontmatter se lê com o `yaml` que o repositório já tem (`grep '"yaml"' package.json`); não escreva parser.
- Comando de hook: tirar de cada `command` do `settings.json` o caminho depois de `$CLAUDE_PROJECT_DIR/`.
- Rodar: `npx vitest run --project unidade tools/processo/harness/metadados.test.ts`.

## Fora do escopo desta tarefa

Remover o `separar-achados.ts`: espera o ok do Gabriel, já anotado no `TODO.md`.

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| Os quatro papéis do time não declaram `tools` (herdam as do terminal que os inicia), e só os papéis de revisão precisam dele; o RF30 diz "papel sem `tools`" e "o repositório de hoje verde" | Uma lista fechada de `tools` no `arquiteto`, `implementador`, `mesa-de-revisao` e `validador` tiraria do terminal o MCP e as ferramentas adiadas, e mudaria o que o papel faz; a exigência fica nos subagentes | `techspec.md` §9, parágrafo "Skills, papéis e metadados (19.0, 24/10/2026)", `tools` no papel; `cenarios.md`, linha RF30 da seção C |
| `docs/processo-licoes.md` ganha a auditoria das skills como seção 2, e o `revisores.test.ts` (18.0) contava como lição toda linha de tabela do arquivo | A tabela da auditoria não tem data na primeira coluna; o teste passa a ler só a seção 1 (`soAsLicoes`), com dois casos novos | `techspec.md` §9, mesmo parágrafo ("as lições do `executar-task` são a seção 1, e o `revisores.test.ts` só lê lição dali") |
| A `description` do `test-engineer` não era YAML válido (`sempre: na criação`), e o `paths:` da regra 30 tinha `**/agentes/**`, que não casa com pasta nenhuma | O `metadados.test.ts` achou os dois no repositório de hoje; ele precisa ficar verde nele. O texto da `description` não mudou (só ganhou aspas) e a regra 30 carrega nos mesmos arquivos de antes | `techspec.md` §9, mesmo parágrafo ("Dois defeitos que o teste achou"); `cenarios.md`, RF30 ("frontmatter que não é YAML", "`paths:` que não casa com nada") |
| A `status` só é "citada" pela forma (`` `status` `` entre crases, `/status`, `skills/status`) em papel, regra, `settings.json`, skill nossa, hook, `CLAUDE.md` e código do processo (`tools/processo/*.ts` fora dos testes) | O RF24 não diz onde procurar; a skill de terceiros e o `docs/` ficam fora porque falam da skill que saiu ou usam a palavra em outro sentido; o `tools/processo/` entra porque o `estado.ts` a citava | `techspec.md` §9, parágrafo "Skills, papéis e metadados (19.0, 24/10/2026)", "Onde a citação da `status` se procura"; `cenarios.md`, linha RF24 da seção C ("a skill `status` ainda citada") |

## Mutações

O teste é `tools/processo/harness/metadados.test.ts` (e, para a leitura só da seção 1, o `revisores.test.ts`); cada bloco mexe numa
cláusula de uma checagem (a função sobre a pasta-raiz), e o vermelho é o do caso que a prova com a amostra quebrada ou com o
repositório de hoje. Cada um foi aplicado e o caso citado ficou vermelho antes de entrar aqui. Os textos das skills e dos papéis não
têm cláusula: a prova deles é esse teste.

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › frontmatter ausente, que não fecha
-  if (linhas[0] !== '---') return null
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › frontmatter ausente, que não fecha
-  if (fim === -1) return null
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › frontmatter ausente, que não fecha
-    if (!(dados instanceof Object) || Array.isArray(dados)) return null
+    if (Array.isArray(dados)) return null
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › frontmatter ausente, que não fecha
-    if (!(dados instanceof Object) || Array.isArray(dados)) return null
+    if (!(dados instanceof Object)) return null
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › lock sem a chave skills
-    return Object.keys(lock.skills ?? {})
+    return Object.keys(lock.skills)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › sem a pasta de skills
-  if (!existsSync(pasta)) return []
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › pasta de papéis vazia
-  if (!existsSync(dir)) return []
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › a conferência conta o que leu
-  return readdirSync(dir, { recursive: recursivo, withFileTypes: true })
+  return readdirSync(dir, { recursive: true, withFileTypes: true })
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › a conferência conta o que leu
-    .filter((entrada) => entrada.isFile())
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › arquivo solto na pasta de skills
-    .filter((entrada) => entrada.isDirectory())
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › name ou description só com espaço
-const preenchido = (valor: unknown): boolean => (typeof valor === 'string' ? valor.trim() !== '' : Array.isArray(valor) && valor.length > 0)
+const preenchido = (valor: unknown): boolean => (typeof valor === 'string' ? valor !== '' : Array.isArray(valor) && valor.length > 0)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › tools escrito como lista
-const preenchido = (valor: unknown): boolean => (typeof valor === 'string' ? valor.trim() !== '' : Array.isArray(valor) && valor.length > 0)
+const preenchido = (valor: unknown): boolean => (typeof valor === 'string' ? valor.trim() !== '' : Array.isArray(valor))
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › pasta de skill sem SKILL.md
-      falhas.push(`${SKILLS}/${nome} não tem SKILL.md`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › frontmatter ausente, que não fecha
       continue
     }
     const frontmatter = lerFrontmatter(texto)
     if (frontmatter === null) {
-      falhas.push(`${arquivo}: sem frontmatter válido`)
       continue
     }
     comparados += 1
     if (!preenchido(frontmatter.dados.name)) falhas.push(`${arquivo}: o frontmatter não tem name`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › as do repositório de hoje têm name e description
       continue
     }
-    comparados += 1
+    comparados += 0
     if (!preenchido(frontmatter.dados.name)) falhas.push(`${arquivo}: o frontmatter não tem name`)
     if (!preenchido(frontmatter.dados.description)) falhas.push(`${arquivo}: o frontmatter não tem description`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › skill sem name: vermelho
     comparados += 1
-    if (!preenchido(frontmatter.dados.name)) falhas.push(`${arquivo}: o frontmatter não tem name`)
     if (!preenchido(frontmatter.dados.description)) falhas.push(`${arquivo}: o frontmatter não tem description`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › skill sem name: vermelho
-    if (!preenchido(frontmatter.dados.description)) falhas.push(`${arquivo}: o frontmatter não tem description`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › papel do time sem a seção
-  if (inicio === -1) return [`${arquivo}: não tem a seção "${TITULO_DO_CRITERIO}"`]
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › os de hoje têm a seção
-  const fim = linhas.findIndex((linha, i) => i > inicio && linha.startsWith('## '))
+  const fim = linhas.findIndex((linha, i) => linha.startsWith('## '))
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › a seção na última linha
-  const corpo = linhas.slice(inicio + 1, fim === -1 ? undefined : fim)
+  const corpo = linhas.slice(inicio + 1, fim)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › seção sem "Terminou quando"
-    return !corpo.some((linha) => linha.startsWith(prefixo) && linha.slice(prefixo.length).trim() !== '')
+    return !corpo.some((linha) => linha.slice(prefixo.length).trim() !== '')
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › item sem texto
-    return !corpo.some((linha) => linha.startsWith(prefixo) && linha.slice(prefixo.length).trim() !== '')
+    return !corpo.some((linha) => linha.startsWith(prefixo) && linha.slice(prefixo.length) !== '')
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › item sem texto
-    return !corpo.some((linha) => linha.startsWith(prefixo) && linha.slice(prefixo.length).trim() !== '')
+    return !corpo.some((linha) => linha.startsWith(prefixo) && true)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › os quatro papéis do time herdam
-    const papel = arquivo.slice(AGENTES.length + 1, -'.md'.length)
+    const papel = arquivo.slice(AGENTES.length, -'.md'.length)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › arquivo da pasta de papéis que não é .md
-  const arquivos = listar(raiz, AGENTES, false).filter((arquivo) => arquivo.endsWith('.md'))
+  const arquivos = listar(raiz, AGENTES, false)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › papel sem frontmatter válido
     const texto = readFileSync(join(raiz, arquivo), 'utf8')
     const frontmatter = lerFrontmatter(texto)
     if (frontmatter === null) {
-      falhas.push(`${arquivo}: sem frontmatter válido`)
       continue
     }
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › os do repositório de hoje têm name e model
       continue
     }
-    comparados += 1
+    comparados += 0
     if (!preenchido(frontmatter.dados.name)) falhas.push(`${arquivo}: o frontmatter não tem name`)
     if (!preenchido(frontmatter.dados.model)) falhas.push(`${arquivo}: o frontmatter não tem model`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › papel sem name, sem model ou sem tools
     comparados += 1
-    if (!preenchido(frontmatter.dados.name)) falhas.push(`${arquivo}: o frontmatter não tem name`)
     if (!preenchido(frontmatter.dados.model)) falhas.push(`${arquivo}: o frontmatter não tem model`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › papel sem name, sem model ou sem tools
-    if (!preenchido(frontmatter.dados.model)) falhas.push(`${arquivo}: o frontmatter não tem model`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › os quatro papéis do time herdam
-    if (!doTime && !preenchido(frontmatter.dados.tools)) falhas.push(`${arquivo}: o frontmatter não tem tools`)
+    if (!preenchido(frontmatter.dados.tools)) falhas.push(`${arquivo}: o frontmatter não tem tools`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › papel sem name, sem model ou sem tools
-    if (!doTime && !preenchido(frontmatter.dados.tools)) falhas.push(`${arquivo}: o frontmatter não tem tools`)
+    if (!doTime && true) falhas.push(`${arquivo}: o frontmatter não tem tools`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › a amostra boa é verde
-    if (doTime) falhas.push(...conferirCriterio(arquivo, texto))
+    if (true) falhas.push(...conferirCriterio(arquivo, texto))
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › papel do time sem a seção
-    if (doTime) falhas.push(...conferirCriterio(arquivo, texto))
+    if (false) falhas.push(...conferirCriterio(arquivo, texto))
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › papel do time ausente da pasta
-    if (!arquivos.includes(`${AGENTES}/${papel}.md`)) falhas.push(`papel do time ausente: ${AGENTES}/${papel}.md`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › papel sem name, sem model ou sem tools
-    const doTime = PAPEIS_DO_TIME.includes(papel)
+    const doTime = true
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › o documento ausente
-  if (documento === null) return { falhas: [`${CONFLITOS} não existe`], comparados }
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › as cinco de hoje têm a linha
-    [...documento.matchAll(/^\| `([^`]+)` \| (Conflito neste repositório:.*) \|$/gm)].map((achado): [string, string] => [achado[1] as string, achado[2] as string]),
+    [...documento.matchAll(/^\| `([^`]+)` \| (.*) \|$/gm)].map((achado): [string, string] => [achado[1] as string, achado[2] as string]),
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › o documento sem a linha de uma das cinco
-    if (!linhasDoDocumento.has(nome)) falhas.push(`${CONFLITOS} não tem a linha de conflito de ${nome}`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › linha do documento cuja skill não existe
-      falhas.push(`${arquivo} não existe, e ${CONFLITOS} escreve o conflito dela`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › linha do documento cuja skill não existe
       continue
     }
     const frontmatter = lerFrontmatter(texto)
     if (frontmatter === null) {
-      falhas.push(`${arquivo}: sem frontmatter válido`)
       continue
     }
     comparados += 1
     if (frontmatter.linhas[frontmatter.depois] !== linha) {
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › as cinco de hoje têm a linha
     }
-    comparados += 1
+    comparados += 0
     if (frontmatter.linhas[frontmatter.depois] !== linha) {
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › skill da lista sem a linha
-      falhas.push(`${arquivo}: a primeira linha depois do frontmatter não é a de ${CONFLITOS}`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › quem contorna é acusado
-    if (frontmatter.linhas[frontmatter.depois] !== linha) {
+    if (frontmatter.linhas[frontmatter.depois + 1] !== linha) {
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › a frontend-design no skills-lock.json
-  if (existsSync(join(raiz, SKILLS, DE_TERCEIROS_QUE_SAIU))) falhas.push(`${SKILLS}/${DE_TERCEIROS_QUE_SAIU} ainda existe`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › a frontend-design no skills-lock.json
-  if (doLock === null) falhas.push(`${LOCK} não existe ou não é JSON`)
+  if (false) falhas.push(`${LOCK} não existe ou não é JSON`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › a frontend-design no skills-lock.json
-  else if (doLock.includes(DE_TERCEIROS_QUE_SAIU)) falhas.push(`${LOCK} ainda tem ${DE_TERCEIROS_QUE_SAIU}`)
+  else if (false) falhas.push(`${LOCK} ainda tem ${DE_TERCEIROS_QUE_SAIU}`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › a pasta da skill ainda existe
-  if (existsSync(join(raiz, SKILLS, DO_PROCESSO_QUE_SAIU))) falhas.push(`${SKILLS}/${DO_PROCESSO_QUE_SAIU} ainda existe`)
+  if (existsSync(join(raiz, SKILLS, DO_PROCESSO_QUE_SAIU))) void 0
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › a skill de terceiros, que não é nossa
-  const nossas = pastasDeSkills(raiz).filter((nome) => !deTerceiros.has(nome))
+  const nossas = pastasDeSkills(raiz).filter((nome) => true)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › a conferência conta o que leu
-    ...listar(raiz, AGENTES, false).filter((arquivo) => arquivo.endsWith('.md')),
+    ...listar(raiz, AGENTES, false),
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › a conferência conta o que leu
-    ...nossas.flatMap((nome) => listar(raiz, `${SKILLS}/${nome}`, true).filter((arquivo) => arquivo.endsWith('.md'))),
+    ...nossas.flatMap((nome) => listar(raiz, `${SKILLS}/${nome}`, true)),
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › citada em cada lugar
-    ...nossas.flatMap((nome) => listar(raiz, `${SKILLS}/${nome}`, true).filter((arquivo) => arquivo.endsWith('.md'))),
+    ...nossas.flatMap((nome) => listar(raiz, `${SKILLS}/${nome}`, false).filter((arquivo) => arquivo.endsWith('.md'))),
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › a conferência conta o que leu
-    ...listar(raiz, HOOKS, false),
+    ...listar(raiz, HOOKS, true),
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › a conferência conta o que leu
-    ...listar(raiz, '.', false).filter((arquivo) => arquivo === 'CLAUDE.md'),
+    ...listar(raiz, '.', false).filter((arquivo) => true),
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › a conferência conta o que leu
-    ...listar(raiz, 'tools/processo', false).filter((arquivo) => arquivo.endsWith('.ts') && !arquivo.endsWith('.test.ts')),
+    ...listar(raiz, 'tools/processo', false).filter((arquivo) => arquivo.endsWith('.ts')),
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › a conferência conta o que leu
-    ...listar(raiz, 'tools/processo', false).filter((arquivo) => arquivo.endsWith('.ts') && !arquivo.endsWith('.test.ts')),
+    ...listar(raiz, 'tools/processo', false).filter((arquivo) => !arquivo.endsWith('.test.ts')),
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › a conferência conta o que leu
-    ...listar(raiz, 'tools/processo', false).filter((arquivo) => arquivo.endsWith('.ts') && !arquivo.endsWith('.test.ts')),
+    ...listar(raiz, 'tools/processo', true).filter((arquivo) => arquivo.endsWith('.ts') && !arquivo.endsWith('.test.ts')),
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › citada entre crases
-      if (CITACOES_DE_STATUS.some((citacao) => citacao.test(linha))) falhas.push(`${arquivo}:${i + 1} cita a skill ${DO_PROCESSO_QUE_SAIU}, que saiu`)
+      if (CITACOES_DE_STATUS.some((citacao) => citacao.test(linha))) falhas.push(`${arquivo}:${i} cita a skill ${DO_PROCESSO_QUE_SAIU}, que saiu`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › no repositório de hoje a pasta não existe
-  return { falhas, comparados: arquivos.length }
+  return { falhas, comparados: 0 }
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › citada entre crases
-const CITACOES_DE_STATUS = [/`status`/, /(?<!\w)\/status\b/, /skills\/status/]
+const CITACOES_DE_STATUS = [/(?<!\w)\/status\b/, /skills\/status/]
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › citada entre crases
-const CITACOES_DE_STATUS = [/`status`/, /(?<!\w)\/status\b/, /skills\/status/]
+const CITACOES_DE_STATUS = [/`status`/, /skills\/status/]
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › citada entre crases
-const CITACOES_DE_STATUS = [/`status`/, /(?<!\w)\/status\b/, /skills\/status/]
+const CITACOES_DE_STATUS = [/`status`/, /(?<!\w)\/status\b/]
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › o que não é a skill não é acusado
-const CITACOES_DE_STATUS = [/`status`/, /(?<!\w)\/status\b/, /skills\/status/]
+const CITACOES_DE_STATUS = [/`status`/, /\/status\b/, /skills\/status/]
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › o que não é a skill não é acusado
-const CITACOES_DE_STATUS = [/`status`/, /(?<!\w)\/status\b/, /skills\/status/]
+const CITACOES_DE_STATUS = [/`status`/, /(?<!\w)\/status/, /skills\/status/]
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › padrão que só casaria dentro de node_modules
-  globSync(padrao, { cwd: raiz, exclude: (nome) => nome.split('/').some((parte) => parte === 'node_modules') }).length > 0
+  globSync(padrao, { cwd: raiz, exclude: (nome) => nome.split('/').some((parte) => false) }).length > 0
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › padrão que não casa com nada
-  globSync(padrao, { cwd: raiz, exclude: (nome) => nome.split('/').some((parte) => parte === 'node_modules') }).length > 0
+  globSync(padrao, { cwd: raiz, exclude: (nome) => nome.split('/').some((parte) => parte === 'node_modules') }).length >= 0
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › arquivo da pasta de regras que não é .md
-  for (const arquivo of listar(raiz, REGRAS, false).filter((nome) => nome.endsWith('.md'))) {
+  for (const arquivo of listar(raiz, REGRAS, false)) {
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › regra sem paths, ou sem frontmatter
-    const paths = frontmatter?.dados.paths
+    const paths = (frontmatter as Frontmatter).dados.paths
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › a amostra boa é verde
-    if (paths === undefined) continue
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › paths que não é lista
-    const lista: unknown[] = Array.isArray(paths) ? paths : []
+    const lista: unknown[] = paths as unknown[]
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › paths que não é lista
-    if (padroes.length === 0 || padroes.length !== lista.length) {
+    if (padroes.length !== lista.length) {
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › paths que não é lista
-    if (padroes.length === 0 || padroes.length !== lista.length) {
+    if (padroes.length === 0) {
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › paths que não é lista
-      falhas.push(`${arquivo}: paths não é uma lista de textos`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › padrão que não casa com nada
     for (const padrao of padroes) {
-      comparados += 1
+      comparados += 0
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › padrão que não casa com nada
-      if (!casaAlgo(raiz, padrao)) falhas.push(`${arquivo}: o padrão "${padrao}" de paths não casa com nenhum arquivo`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › settings sem hooks
-  if (texto === null) return { falhas: [`${SETTINGS} não existe`], comparados: 0 }
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › settings sem hooks
-    const grupos = Object.values(configuracao.hooks ?? {}).flat()
+    const grupos = Object.values(configuracao.hooks).flat()
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › grupo sem hooks e hook sem command
-    comandos = grupos.flatMap((grupo) => (grupo.hooks ?? []).flatMap((hook) => hook.command ?? []))
+    comandos = grupos.flatMap((grupo) => grupo.hooks.flatMap((hook) => hook.command ?? []))
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › grupo sem hooks e hook sem command
-    comandos = grupos.flatMap((grupo) => (grupo.hooks ?? []).flatMap((hook) => hook.command ?? []))
+    comandos = grupos.flatMap((grupo) => (grupo.hooks).flatMap((hook) => hook.command ?? []))
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › settings sem hooks
-    return { falhas: [`${SETTINGS} não é JSON`], comparados: 0 }
+    comandos = []
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › o caminho sem aspas
-    for (const achado of comando.matchAll(/\$CLAUDE_PROJECT_DIR\/([^"'\s]+)/g)) {
+    for (const achado of comando.matchAll(/\$CLAUDE_PROJECT_DIR\/([^"\s]+)/g)) {
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › os de hoje apontam arquivos que existem
-    for (const achado of comando.matchAll(/\$CLAUDE_PROJECT_DIR\/([^"'\s]+)/g)) {
+    for (const achado of comando.matchAll(/\$CLAUDE_PROJECT_DIR\/([^'\s]+)/g)) {
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › o caminho sem aspas
-    for (const achado of comando.matchAll(/\$CLAUDE_PROJECT_DIR\/([^"'\s]+)/g)) {
+    for (const achado of comando.matchAll(/\$CLAUDE_PROJECT_DIR\/([^"']+)/g)) {
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › dois caminhos no mesmo comando
-    for (const achado of comando.matchAll(/\$CLAUDE_PROJECT_DIR\/([^"'\s]+)/g)) {
+    for (const achado of comando.matchAll(/\$CLAUDE_PROJECT_DIR\/([^"'\s]+)/)) {
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › dois caminhos no mesmo comando
       const arquivo = achado[1] as string
-      comparados += 1
+      comparados += 0
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › comando que aponta arquivo que não existe
-      if (!existsSync(join(raiz, arquivo))) falhas.push(`${SETTINGS}: o comando de hook aponta ${arquivo}, que não existe`)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › em todo evento e em todo grupo
-    const grupos = Object.values(configuracao.hooks ?? {}).flat()
+    const grupos = Object.values(configuracao.hooks ?? {}).flat().slice(0, 1)
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › comando que aponta arquivo que não existe
-    comandos = grupos.flatMap((grupo) => (grupo.hooks ?? []).flatMap((hook) => hook.command ?? []))
+    comandos = grupos.flatMap((grupo) => (grupo.hooks ?? []).slice(0, 1).flatMap((hook) => hook.command ?? []))
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › a conferência conta o que leu
-    ...listar(raiz, REGRAS, false).filter((arquivo) => arquivo.endsWith('.md')),
+    ...listar(raiz, REGRAS, false),
```

```mutacao
arquivo: tools/processo/harness/metadados.test.ts
teste: tools/processo/harness/metadados.test.ts › a conferência conta o que leu
-    ...listar(raiz, '.claude', false).filter((arquivo) => arquivo === SETTINGS),
+    ...listar(raiz, '.claude', false).filter((arquivo) => true),
```
```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › a auditoria das skills
-  const inicio = linhas.findIndex((linha) => linha.startsWith('## 1. '))
+  const inicio = linhas.findIndex((linha) => linha.startsWith('## '))
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › o arquivo de hoje está abaixo de 500 linhas
-  const fim = linhas.findIndex((linha, i) => i > inicio && linha.startsWith('## '))
+  const fim = linhas.findIndex((linha, i) => linha.startsWith('## '))
```

```mutacao
arquivo: tools/processo/harness/revisores.test.ts
teste: tools/processo/harness/revisores.test.ts › a seção 1 conta inteira
-  return linhas.slice(inicio, fim === -1 ? undefined : fim).join('\n')
+  return linhas.slice(inicio, fim).join('\n')
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| privacy-guardian (1ª) | "Na auditoria das skills em `docs/processo-licoes.md` (seção 2), a `lgpd-brasil` já aparece como desatualizada em relação ao ECA Digital. Vale registrar no `TODO.md` quem revisa a skill quando o `npx skills update` trouxer versão nova." | Destino `TODO.md` (fora desta tarefa; a Mesa decide) |
| test-engineer (2ª) | `metadados.test.ts:748`: comparar a mensagem exata, como faz a linha 732, em vez de só o tamanho | Não aplicar: o tamanho já prova o `.git`; o ciclo de rodada nova custa mais que o ganho. Fica como está |
| revisor-geral (2ª) | `metadados.test.ts:12`: o cabeçalho ainda diz "(papel, skill nossa, hook, `CLAUDE.md`, código do processo)", sem a regra e sem o `settings.json` | Comentário de `.ts`; o Orquestrador decide se vale nova rodada. Se não, `TODO.md` |
| revisor-geral (2ª) | Linha 29 do `19_task.md`: a subtarefa 19.3 ainda descreve o `grep` sobre `.claude/` inteiro; nota curta apontando o recorte da Tech Spec | Documento da tarefa; mesmo destino do item acima |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-24 01:50:08 | 2026-10-24 01:50:48 | `privacy-guardian` | 1 | APROVADO | ab1453701ce1df814 |
| 2026-10-24 01:50:03 | 2026-10-24 01:51:24 | `test-engineer` | 1 | REPROVADO | a4e6e33c70b085335 |
| 2026-10-24 01:50:06 | 2026-10-24 01:52:12 | `revisor-geral` | 1 | REPROVADO | a1a16c2745188663f |
| 2026-10-24 02:00:57 | 2026-10-24 02:01:27 | `revisor-geral` | 2 | APROVADO | a2ba101e5434a9b37 |
| 2026-10-24 02:00:50 | 2026-10-24 02:01:45 | `test-engineer` | 2 | APROVADO | ab1d6c54110f68504 |
