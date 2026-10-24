// Os metadados do harness quebram sem que nada avise, e aqui a esteira fica vermelha (X7, RF23, RF24 e RF30).
//
// Skill, papel, regra e hook são lidos pelo Claude Code por um cabeçalho ou por um caminho: skill sem `name` não carrega, papel sem
// `model` roda no que sobrar, `paths:` que não casa com nada faz a regra nunca ser lida, e hook que aponta arquivo que mudou de lugar
// deixa de proteger o commit sem uma linha de erro. Quatro coisas são conferidas:
//   (1) RF30, o cabeçalho: toda skill tem `name` e `description`; todo papel tem `name` e `model`, e `tools` (o papel do time herda as
//       ferramentas do terminal que o inicia, então só ele fica de fora desta exigência); todo `paths:` casa ao menos um arquivo; todo
//       comando de hook aponta um arquivo que existe.
//   (2) RF23, as cinco skills de terceiros que ficam têm, na primeira linha depois do frontmatter, o conflito escrito em
//       `docs/skills-de-terceiros.md`, e a `frontend-design` não está nem na pasta nem no `skills-lock.json`.
//   (3) RF24, os quatro papéis do time têm a seção "Critério de saída" com os itens "Terminou quando" e "Entrega".
//   (4) RF24, a skill `status` saiu e ninguém a cita (papel, skill nossa, hook, `CLAUDE.md`, código do processo).
//
// Cada conferência é uma função sobre uma pasta-raiz e roda sobre o repositório e sobre uma amostra quebrada em pasta temporária. Limites
// declarados: o teste prova que o texto está no arquivo, não que a skill ou o papel o segue; a linha de conflito acusa, nunca reaplica
// (quem rodou `npx skills update -p` copia de volta de `docs/skills-de-terceiros.md`); a citação de `status` é achada pela forma
// (`` `status` ``, `/status`, `skills/status`) e não pelo sentido, então quem precisar do mesmo texto em outro sentido o reescreve; e o
// `paths:` só é lido na forma de lista, que é a que o repositório usa.
import { existsSync, globSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { parse } from 'yaml'

const RAIZ = join(import.meta.dirname, '..', '..', '..')

const SKILLS = '.claude/skills'
const AGENTES = '.claude/agents'
const REGRAS = '.claude/rules'
const HOOKS = '.claude/hooks'
const SETTINGS = '.claude/settings.json'
const LOCK = 'skills-lock.json'
const CONFLITOS = 'docs/skills-de-terceiros.md'

/** As cinco skills de terceiros que ficam com o conflito escrito (texto.md, RF23). */
const COM_CONFLITO = [
  'supabase-postgres-best-practices',
  'vercel-react-best-practices',
  'playwright-best-practices',
  'lgpd-brasil',
  'nestjs-best-practices',
]
/** A de terceiros que saiu: nem a pasta nem o `skills-lock.json` a têm. */
const DE_TERCEIROS_QUE_SAIU = 'frontend-design'
/** A nossa que saiu: o `estado.ts` a substitui. */
const DO_PROCESSO_QUE_SAIU = 'status'
/** Os quatro papéis de terminal do Maestri: herdam as ferramentas do terminal e têm o critério de saída. */
const PAPEIS_DO_TIME: readonly string[] = ['arquiteto', 'implementador', 'mesa-de-revisao', 'validador']

const TITULO_DO_CRITERIO = '## Critério de saída'
const ITENS_DO_CRITERIO = ['Terminou quando:', 'Entrega:']
const CITACOES_DE_STATUS = [/`status`/, /(?<!\w)\/status\b/, /skills\/status/]

/** O que a conferência acha hoje; lista encurtada para calar o teste deixa de somar isto. */
const MINIMO_DE_SKILLS = 20
const MINIMO_DE_PAPEIS = 12
const MINIMO_DE_PADROES = 20
const MINIMO_DE_HOOKS = 3
const MINIMO_DE_ARQUIVOS_LIDOS = 40

interface Conferencia {
  falhas: string[]
  /** Quantos itens a conferência leu: zero é vermelho, porque uma pasta lida vazia deixaria tudo verde. */
  comparados: number
}

const lerOuNulo = (caminho: string): string | null => {
  try {
    return readFileSync(caminho, 'utf8')
  } catch {
    return null
  }
}

/** Os arquivos de uma pasta, relativos à raiz; a pasta que não existe devolve lista vazia. */
function listar(raiz: string, pasta: string, recursivo: boolean): string[] {
  const dir = join(raiz, pasta)
  if (!existsSync(dir)) return []
  return readdirSync(dir, { recursive: recursivo, withFileTypes: true })
    .filter((entrada) => entrada.isFile())
    .map((entrada) => join(relative(raiz, entrada.parentPath), entrada.name))
}

/** O valor existe e tem alguma coisa: texto que não é só espaço, ou lista que não é vazia. */
const preenchido = (valor: unknown): boolean => (typeof valor === 'string' ? valor.trim() !== '' : Array.isArray(valor) && valor.length > 0)

interface Frontmatter {
  dados: Record<string, unknown>
  linhas: string[]
  /** O índice da primeira linha depois da barra que fecha o frontmatter. */
  depois: number
}

/** O frontmatter YAML entre as duas primeiras linhas `---`; `null` quando falta, não fecha, não é YAML ou não é um objeto. */
function lerFrontmatter(texto: string): Frontmatter | null {
  const linhas = texto.split('\n')
  if (linhas[0] !== '---') return null
  const fim = linhas.indexOf('---', 1)
  if (fim === -1) return null
  try {
    const dados: unknown = parse(linhas.slice(1, fim).join('\n'))
    if (!(dados instanceof Object) || Array.isArray(dados)) return null
    return { dados: Object.fromEntries(Object.entries(dados)), linhas, depois: fim + 1 }
  } catch {
    return null
  }
}

/** As chaves de `skills` do `skills-lock.json`; `null` quando o arquivo falta ou não é JSON. */
function skillsDoLock(raiz: string): string[] | null {
  try {
    const lock = JSON.parse(readFileSync(join(raiz, LOCK), 'utf8')) as { skills?: Record<string, unknown> }
    return Object.keys(lock.skills ?? {})
  } catch {
    return null
  }
}

function pastasDeSkills(raiz: string): string[] {
  const pasta = join(raiz, SKILLS)
  if (!existsSync(pasta)) return []
  return readdirSync(pasta, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory())
    .map((entrada) => entrada.name)
}

/** RF30: toda skill tem frontmatter com `name` e `description`. */
function conferirSkills(raiz: string): Conferencia {
  const falhas: string[] = []
  let comparados = 0
  for (const nome of pastasDeSkills(raiz)) {
    const arquivo = `${SKILLS}/${nome}/SKILL.md`
    const texto = lerOuNulo(join(raiz, arquivo))
    if (texto === null) {
      falhas.push(`${SKILLS}/${nome} não tem SKILL.md`)
      continue
    }
    const frontmatter = lerFrontmatter(texto)
    if (frontmatter === null) {
      falhas.push(`${arquivo}: sem frontmatter válido`)
      continue
    }
    comparados += 1
    if (!preenchido(frontmatter.dados.name)) falhas.push(`${arquivo}: o frontmatter não tem name`)
    if (!preenchido(frontmatter.dados.description)) falhas.push(`${arquivo}: o frontmatter não tem description`)
  }
  return { falhas, comparados }
}

/** RF24: a seção "Critério de saída" do papel tem cada item, com texto, dentro da própria seção. */
function conferirCriterio(arquivo: string, texto: string): string[] {
  const linhas = texto.split('\n')
  const inicio = linhas.indexOf(TITULO_DO_CRITERIO)
  if (inicio === -1) return [`${arquivo}: não tem a seção "${TITULO_DO_CRITERIO}"`]
  const fim = linhas.findIndex((linha, i) => i > inicio && linha.startsWith('## '))
  const corpo = linhas.slice(inicio + 1, fim === -1 ? undefined : fim)
  return ITENS_DO_CRITERIO.filter((item) => {
    const prefixo = `- **${item}**`
    return !corpo.some((linha) => linha.startsWith(prefixo) && linha.slice(prefixo.length).trim() !== '')
  }).map((item) => `${arquivo}: a seção "${TITULO_DO_CRITERIO}" não tem o item "${item}"`)
}

/** RF30 e RF24: todo papel tem `name` e `model`, e `tools` (menos o do time); o do time tem o critério de saída. */
function conferirPapeis(raiz: string): Conferencia {
  const falhas: string[] = []
  let comparados = 0
  const arquivos = listar(raiz, AGENTES, false).filter((arquivo) => arquivo.endsWith('.md'))
  for (const arquivo of arquivos) {
    const papel = arquivo.slice(AGENTES.length + 1, -'.md'.length)
    const texto = readFileSync(join(raiz, arquivo), 'utf8')
    const frontmatter = lerFrontmatter(texto)
    if (frontmatter === null) {
      falhas.push(`${arquivo}: sem frontmatter válido`)
      continue
    }
    comparados += 1
    if (!preenchido(frontmatter.dados.name)) falhas.push(`${arquivo}: o frontmatter não tem name`)
    if (!preenchido(frontmatter.dados.model)) falhas.push(`${arquivo}: o frontmatter não tem model`)
    const doTime = PAPEIS_DO_TIME.includes(papel)
    if (!doTime && !preenchido(frontmatter.dados.tools)) falhas.push(`${arquivo}: o frontmatter não tem tools`)
    if (doTime) falhas.push(...conferirCriterio(arquivo, texto))
  }
  for (const papel of PAPEIS_DO_TIME) {
    if (!arquivos.includes(`${AGENTES}/${papel}.md`)) falhas.push(`papel do time ausente: ${AGENTES}/${papel}.md`)
  }
  return { falhas, comparados }
}

/** RF23: a primeira linha depois do frontmatter das cinco é a de `docs/skills-de-terceiros.md`; a que saiu não está na pasta nem no lock. */
function conferirConflitos(raiz: string): Conferencia {
  const falhas: string[] = []
  let comparados = 0
  const documento = lerOuNulo(join(raiz, CONFLITOS))
  if (documento === null) return { falhas: [`${CONFLITOS} não existe`], comparados }
  const linhasDoDocumento = new Map(
    [...documento.matchAll(/^\| `([^`]+)` \| (Conflito neste repositório:.*) \|$/gm)].map((achado): [string, string] => [achado[1] as string, achado[2] as string]),
  )
  for (const nome of COM_CONFLITO) {
    if (!linhasDoDocumento.has(nome)) falhas.push(`${CONFLITOS} não tem a linha de conflito de ${nome}`)
  }
  for (const [nome, linha] of linhasDoDocumento) {
    const arquivo = `${SKILLS}/${nome}/SKILL.md`
    const texto = lerOuNulo(join(raiz, arquivo))
    if (texto === null) {
      falhas.push(`${arquivo} não existe, e ${CONFLITOS} escreve o conflito dela`)
      continue
    }
    const frontmatter = lerFrontmatter(texto)
    if (frontmatter === null) {
      falhas.push(`${arquivo}: sem frontmatter válido`)
      continue
    }
    comparados += 1
    if (frontmatter.linhas[frontmatter.depois] !== linha) {
      falhas.push(`${arquivo}: a primeira linha depois do frontmatter não é a de ${CONFLITOS}`)
    }
  }
  falhas.push(...conferirQueSaiu(raiz))
  return { falhas, comparados }
}

/** RF23: a `frontend-design` não está nem na pasta de skills nem no `skills-lock.json`, que precisa existir. */
function conferirQueSaiu(raiz: string): string[] {
  const falhas: string[] = []
  if (existsSync(join(raiz, SKILLS, DE_TERCEIROS_QUE_SAIU))) falhas.push(`${SKILLS}/${DE_TERCEIROS_QUE_SAIU} ainda existe`)
  const doLock = skillsDoLock(raiz)
  if (doLock === null) falhas.push(`${LOCK} não existe ou não é JSON`)
  else if (doLock.includes(DE_TERCEIROS_QUE_SAIU)) falhas.push(`${LOCK} ainda tem ${DE_TERCEIROS_QUE_SAIU}`)
  return falhas
}

/** RF24: a skill `status` não existe e nenhum arquivo do processo a cita (o recorte está na Tech Spec §9, "Onde a citação da `status` se procura"). */
function conferirStatus(raiz: string): Conferencia {
  const falhas: string[] = []
  if (existsSync(join(raiz, SKILLS, DO_PROCESSO_QUE_SAIU))) falhas.push(`${SKILLS}/${DO_PROCESSO_QUE_SAIU} ainda existe`)
  const deTerceiros = new Set(skillsDoLock(raiz) ?? [])
  const nossas = pastasDeSkills(raiz).filter((nome) => !deTerceiros.has(nome))
  const arquivos = [
    ...listar(raiz, AGENTES, false).filter((arquivo) => arquivo.endsWith('.md')),
    ...listar(raiz, REGRAS, false).filter((arquivo) => arquivo.endsWith('.md')),
    ...listar(raiz, '.claude', false).filter((arquivo) => arquivo === SETTINGS),
    ...nossas.flatMap((nome) => listar(raiz, `${SKILLS}/${nome}`, true).filter((arquivo) => arquivo.endsWith('.md'))),
    ...listar(raiz, HOOKS, false),
    ...listar(raiz, '.', false).filter((arquivo) => arquivo === 'CLAUDE.md'),
    ...listar(raiz, 'tools/processo', false).filter((arquivo) => arquivo.endsWith('.ts') && !arquivo.endsWith('.test.ts')),
  ]
  for (const arquivo of arquivos) {
    const linhas = readFileSync(join(raiz, arquivo), 'utf8').split('\n')
    linhas.forEach((linha, i) => {
      if (CITACOES_DE_STATUS.some((citacao) => citacao.test(linha))) falhas.push(`${arquivo}:${i + 1} cita a skill ${DO_PROCESSO_QUE_SAIU}, que saiu`)
    })
  }
  return { falhas, comparados: arquivos.length }
}

/** O padrão casa ao menos um arquivo ou pasta sob a raiz, sem entrar em `node_modules` (o `**` do glob já não entra em pasta de ponto). */
const casaAlgo = (raiz: string, padrao: string): boolean =>
  globSync(padrao, { cwd: raiz, exclude: (nome) => nome.split('/').some((parte) => parte === 'node_modules') }).length > 0

/** RF30: todo `paths:` de regra é uma lista de textos, e cada padrão casa ao menos um arquivo. */
function conferirRegras(raiz: string): Conferencia {
  const falhas: string[] = []
  let comparados = 0
  for (const arquivo of listar(raiz, REGRAS, false).filter((nome) => nome.endsWith('.md'))) {
    const frontmatter = lerFrontmatter(readFileSync(join(raiz, arquivo), 'utf8'))
    const paths = frontmatter?.dados.paths
    if (paths === undefined) continue
    const lista: unknown[] = Array.isArray(paths) ? paths : []
    const padroes = lista.filter((padrao): padrao is string => typeof padrao === 'string')
    if (padroes.length === 0 || padroes.length !== lista.length) {
      falhas.push(`${arquivo}: paths não é uma lista de textos`)
      continue
    }
    for (const padrao of padroes) {
      comparados += 1
      if (!casaAlgo(raiz, padrao)) falhas.push(`${arquivo}: o padrão "${padrao}" de paths não casa com nenhum arquivo`)
    }
  }
  return { falhas, comparados }
}

/** RF30: todo comando de hook do `settings.json` que cita `$CLAUDE_PROJECT_DIR/<arquivo>` cita um arquivo que existe. */
function conferirHooks(raiz: string): Conferencia {
  const texto = lerOuNulo(join(raiz, SETTINGS))
  if (texto === null) return { falhas: [`${SETTINGS} não existe`], comparados: 0 }
  let comandos: string[]
  try {
    const configuracao = JSON.parse(texto) as { hooks?: Record<string, { hooks?: { command?: string }[] }[]> }
    const grupos = Object.values(configuracao.hooks ?? {}).flat()
    comandos = grupos.flatMap((grupo) => (grupo.hooks ?? []).flatMap((hook) => hook.command ?? []))
  } catch {
    return { falhas: [`${SETTINGS} não é JSON`], comparados: 0 }
  }
  const falhas: string[] = []
  let comparados = 0
  for (const comando of comandos) {
    for (const achado of comando.matchAll(/\$CLAUDE_PROJECT_DIR\/([^"'\s]+)/g)) {
      const arquivo = achado[1] as string
      comparados += 1
      if (!existsSync(join(raiz, arquivo))) falhas.push(`${SETTINGS}: o comando de hook aponta ${arquivo}, que não existe`)
    }
  }
  return { falhas, comparados }
}

const pastas: string[] = []
afterEach(() => {
  for (const pasta of pastas.splice(0)) rmSync(pasta, { recursive: true, force: true })
})

const conflitoDe = (nome: string): string => `Conflito neste repositório: o texto de ${nome}.`
const skillBoa = (nome: string, depois = ''): string => `---\nname: ${nome}\ndescription: Faz ${nome}.\n---\n${depois}`
const CRITERIO_BOM = `${TITULO_DO_CRITERIO}\n\n- **Terminou quando:** o trabalho ficou pronto.\n- **Entrega:** o documento.\n`
const papelBom = (nome: string, depois = CRITERIO_BOM): string => `---\nname: ${nome}\ndescription: Papel ${nome}.\nmodel: opus\n---\n# O papel\n\n${depois}`

/** Uma pasta-raiz mínima e verde: tudo que as seis conferências leem, no formato do repositório. */
function arquivosDaAmostraBoa(): Record<string, string> {
  const arquivos: Record<string, string> = {
    [LOCK]: JSON.stringify({ version: 1, skills: Object.fromEntries(COM_CONFLITO.map((nome) => [nome, {}])) }),
    [CONFLITOS]: `# Skills\n\n| Skill | Linha de conflito |\n|---|---|\n${COM_CONFLITO.map((nome) => `| \`${nome}\` | ${conflitoDe(nome)} |`).join('\n')}\n`,
    [`${SKILLS}/procedimento/SKILL.md`]: skillBoa('procedimento', 'Sem citação nenhuma.\n'),
    [SETTINGS]: JSON.stringify({ hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/inicio.sh"' }] }] } }),
    [`${HOOKS}/inicio.sh`]: '#!/bin/bash\n',
    [`${REGRAS}/00-a.md`]: '---\npaths:\n  - "apps/**"\n---\n# A regra\n',
    [`${REGRAS}/10-b.md`]: '# A regra sempre carregada\n',
    'apps/api/src/a.ts': 'export {}\n',
    'CLAUDE.md': '# O contexto\n',
    'tools/processo/estado.ts': '// o estado\n',
    [`${AGENTES}/revisor.md`]: '---\nname: revisor\ndescription: Revisa.\ntools: Read, Grep\nmodel: opus\n---\n# Revisor\n',
  }
  for (const nome of COM_CONFLITO) arquivos[`${SKILLS}/${nome}/SKILL.md`] = skillBoa(nome, `${conflitoDe(nome)}\n\n# ${nome}\n`)
  for (const papel of PAPEIS_DO_TIME) arquivos[`${AGENTES}/${papel}.md`] = papelBom(papel)
  return arquivos
}

const BOA = arquivosDaAmostraBoa()

/** A amostra boa com os arquivos trocados; `null` apaga o arquivo. Nome terminado em `/` é pasta vazia. */
function amostra(troca: Record<string, string | null> = {}): string {
  const raiz = mkdtempSync(join(tmpdir(), 'metadados-'))
  pastas.push(raiz)
  const arquivos = { ...BOA, ...troca }
  for (const [nome, texto] of Object.entries(arquivos)) {
    if (texto === null) continue
    if (nome.endsWith('/')) {
      mkdirSync(join(raiz, nome), { recursive: true })
      continue
    }
    mkdirSync(join(raiz, dirname(nome)), { recursive: true })
    writeFileSync(join(raiz, nome), texto)
  }
  return raiz
}

/** Um arquivo da amostra boa reescrito; a troca precisa mudar o texto, ou o caso não prova nada. */
function mudando(arquivo: string, mudar: (texto: string) => string): Record<string, string> {
  const antes = BOA[arquivo]
  expect(antes, `a amostra boa precisa de ${arquivo}`).toBeDefined()
  const depois = mudar(antes ?? '')
  expect(depois, 'a troca precisa mudar o arquivo, ou o caso não prova nada').not.toBe(antes)
  return { [arquivo]: depois }
}

const contem = (conferencia: Conferencia, trecho: string): boolean => conferencia.falhas.some((falha) => falha.includes(trecho))

describe('a amostra boa é verde em todas as conferências', () => {
  it('sem ela, os casos quebrados abaixo provariam só que a amostra já nascia errada', () => {
    const raiz = amostra()
    for (const conferencia of [conferirSkills, conferirPapeis, conferirConflitos, conferirStatus, conferirRegras, conferirHooks]) {
      const lida = conferencia(raiz)
      expect(lida.falhas, conferencia.name).toEqual([])
      expect(lida.comparados, conferencia.name).toBeGreaterThan(0)
    }
  })
})

describe('RF30: o cabeçalho de toda skill', () => {
  it('as do repositório de hoje têm name e description, e a conferência lê ao menos 20', () => {
    const lida = conferirSkills(RAIZ)
    expect(lida.falhas).toEqual([])
    expect(lida.comparados).toBeGreaterThanOrEqual(MINIMO_DE_SKILLS)
  })

  it('skill sem name: vermelho; sem description: vermelho; um caso cada', () => {
    const semName = conferirSkills(amostra(mudando(`${SKILLS}/procedimento/SKILL.md`, (t) => t.replace('name: procedimento\n', ''))))
    expect(contem(semName, 'procedimento/SKILL.md: o frontmatter não tem name')).toBe(true)
    expect(contem(semName, 'não tem description')).toBe(false)
    const semDescription = conferirSkills(amostra(mudando(`${SKILLS}/procedimento/SKILL.md`, (t) => t.replace('description: Faz procedimento.\n', ''))))
    expect(contem(semDescription, 'procedimento/SKILL.md: o frontmatter não tem description')).toBe(true)
    expect(contem(semDescription, 'não tem name')).toBe(false)
  })

  it('name ou description só com espaço, ou vazios: vermelho', () => {
    const espacos = conferirSkills(amostra(mudando(`${SKILLS}/procedimento/SKILL.md`, (t) => t.replace('name: procedimento', 'name: "   "'))))
    expect(contem(espacos, 'não tem name')).toBe(true)
    const vazia = conferirSkills(amostra(mudando(`${SKILLS}/procedimento/SKILL.md`, (t) => t.replace('description: Faz procedimento.', 'description:'))))
    expect(contem(vazia, 'não tem description')).toBe(true)
  })

  it('frontmatter ausente, que não fecha, que não é YAML, que é texto solto, vazio ou lista: vermelho, e a skill não é contada', () => {
    const formas = [
      '# Sem as barras\n',
      '---\nname: procedimento\ndescription: Faz.\n# nunca fecha\n',
      '# Título antes\nname: procedimento\ndescription: Faz.\n---\n',
      '---\nname: [procedimento\ndescription: Faz.\n---\n',
      '---\nname: procedimento\ndescription: Acionar sempre: na criação das tarefas\n---\n',
      '---\nsó um texto solto\n---\n',
      '---\n---\n',
      '---\n- name\n- description\n---\n',
    ]
    for (const forma of formas) {
      const lida = conferirSkills(amostra({ [`${SKILLS}/procedimento/SKILL.md`]: forma }))
      expect(contem(lida, 'procedimento/SKILL.md: sem frontmatter válido'), forma).toBe(true)
      expect(lida.comparados, forma).toBe(COM_CONFLITO.length)
    }
  })

  it('pasta de skill sem SKILL.md: vermelho; arquivo solto na pasta de skills não é skill', () => {
    const lida = conferirSkills(amostra({ [`${SKILLS}/vazia/`]: '' }))
    expect(contem(lida, `${SKILLS}/vazia não tem SKILL.md`)).toBe(true)
    expect(conferirSkills(amostra({ [`${SKILLS}/LEIAME.md`]: '# solto\n' })).falhas).toEqual([])
  })

  it('sem a pasta de skills: nada comparado', () => {
    const lida = conferirSkills(mkdtempSync(join(tmpdir(), 'metadados-vazia-')))
    expect(lida).toEqual({ falhas: [], comparados: 0 })
  })
})

describe('RF30: o cabeçalho de todo papel', () => {
  it('os do repositório de hoje têm name e model, os de revisão têm tools, e a conferência lê ao menos 12', () => {
    const lida = conferirPapeis(RAIZ)
    expect(lida.falhas).toEqual([])
    expect(lida.comparados).toBeGreaterThanOrEqual(MINIMO_DE_PAPEIS)
  })

  it('papel sem name, sem model ou sem tools: vermelho, um caso cada', () => {
    const revisor = `${AGENTES}/revisor.md`
    const semName = conferirPapeis(amostra(mudando(revisor, (t) => t.replace('name: revisor\n', ''))))
    expect(contem(semName, 'revisor.md: o frontmatter não tem name')).toBe(true)
    expect(contem(semName, 'não tem model') || contem(semName, 'não tem tools')).toBe(false)
    const semModel = conferirPapeis(amostra(mudando(revisor, (t) => t.replace('model: opus\n', ''))))
    expect(contem(semModel, 'revisor.md: o frontmatter não tem model')).toBe(true)
    expect(contem(semModel, 'não tem name') || contem(semModel, 'não tem tools')).toBe(false)
    const semTools = conferirPapeis(amostra(mudando(revisor, (t) => t.replace('tools: Read, Grep\n', ''))))
    expect(contem(semTools, 'revisor.md: o frontmatter não tem tools')).toBe(true)
    expect(contem(semTools, 'não tem name') || contem(semTools, 'não tem model')).toBe(false)
  })

  it('tools escrito como lista vale; lista vazia ou texto só com espaço, não', () => {
    const revisor = `${AGENTES}/revisor.md`
    const lista = conferirPapeis(amostra(mudando(revisor, (t) => t.replace('tools: Read, Grep', 'tools:\n  - Read\n  - Grep'))))
    expect(lista.falhas).toEqual([])
    const vazia = conferirPapeis(amostra(mudando(revisor, (t) => t.replace('tools: Read, Grep', 'tools: []'))))
    expect(contem(vazia, 'revisor.md: o frontmatter não tem tools')).toBe(true)
    const espacos = conferirPapeis(amostra(mudando(revisor, (t) => t.replace('tools: Read, Grep', 'tools: "  "'))))
    expect(contem(espacos, 'revisor.md: o frontmatter não tem tools')).toBe(true)
  })

  it('os quatro papéis do time herdam as ferramentas: sem tools é verde neles; sem model e sem name, não', () => {
    expect(conferirPapeis(amostra()).falhas).toEqual([])
    const semModel = conferirPapeis(amostra(mudando(`${AGENTES}/validador.md`, (t) => t.replace('model: opus\n', ''))))
    expect(contem(semModel, 'validador.md: o frontmatter não tem model')).toBe(true)
    const semName = conferirPapeis(amostra(mudando(`${AGENTES}/arquiteto.md`, (t) => t.replace('name: arquiteto\n', ''))))
    expect(contem(semName, 'arquiteto.md: o frontmatter não tem name')).toBe(true)
  })

  it('papel sem frontmatter válido: vermelho, e o papel não é contado; a forma que quebrou o test-engineer, com dois-pontos no texto, também', () => {
    const formas = ['# Sem as barras\n', '---\nname: revisor\ndescription: Acionar sempre: na criação\ntools: Read\nmodel: opus\n---\n']
    for (const forma of formas) {
      const lida = conferirPapeis(amostra({ [`${AGENTES}/revisor.md`]: forma }))
      expect(contem(lida, 'revisor.md: sem frontmatter válido'), forma).toBe(true)
      expect(lida.comparados, forma).toBe(PAPEIS_DO_TIME.length)
    }
  })

  it('papel do time ausente da pasta: vermelho; pasta de papéis vazia: tudo vermelho e nada comparado', () => {
    const semMesa = conferirPapeis(amostra({ [`${AGENTES}/mesa-de-revisao.md`]: null }))
    expect(contem(semMesa, `papel do time ausente: ${AGENTES}/mesa-de-revisao.md`)).toBe(true)
    expect(semMesa.falhas).toHaveLength(1)
    const vazia = conferirPapeis(mkdtempSync(join(tmpdir(), 'metadados-vazia-')))
    expect(vazia.comparados).toBe(0)
    expect(vazia.falhas).toHaveLength(PAPEIS_DO_TIME.length)
  })

  it('arquivo da pasta de papéis que não é .md não é papel', () => {
    const lida = conferirPapeis(amostra({ [`${AGENTES}/notas.txt`]: 'sem cabeçalho\n' }))
    expect(lida.falhas).toEqual([])
  })
})

describe('RF24: o critério de saída dos quatro papéis do time', () => {
  it('os de hoje têm a seção com "Terminou quando" e "Entrega", com texto', () => {
    // Chama `conferirCriterio` direto: a conta dos quatro papéis vem da lista fixa `PAPEIS_DO_TIME`, e o papel que sumir da lista
    // deixa de ser conferido aqui (o `conferirPapeis` acusa o papel do time que falta na pasta).
    for (const papel of PAPEIS_DO_TIME) {
      const arquivo = `${AGENTES}/${papel}.md`
      expect(conferirCriterio(arquivo, lerOuNulo(join(RAIZ, arquivo)) ?? ''), arquivo).toEqual([])
    }
  })

  it('papel do time sem a seção: vermelho, um caso por papel', () => {
    for (const papel of PAPEIS_DO_TIME) {
      const lida = conferirPapeis(amostra({ [`${AGENTES}/${papel}.md`]: papelBom(papel, '') }))
      expect(contem(lida, `${papel}.md: não tem a seção "${TITULO_DO_CRITERIO}"`), papel).toBe(true)
    }
  })

  it('seção sem "Terminou quando" ou sem "Entrega": vermelho, um caso cada', () => {
    const semTerminou = conferirPapeis(amostra({ [`${AGENTES}/validador.md`]: papelBom('validador', `${TITULO_DO_CRITERIO}\n\n- **Entrega:** o documento.\n`) }))
    expect(contem(semTerminou, 'não tem o item "Terminou quando:"')).toBe(true)
    expect(contem(semTerminou, 'não tem o item "Entrega:"')).toBe(false)
    const semEntrega = conferirPapeis(amostra({ [`${AGENTES}/validador.md`]: papelBom('validador', `${TITULO_DO_CRITERIO}\n\n- **Terminou quando:** pronto.\n`) }))
    expect(contem(semEntrega, 'não tem o item "Entrega:"')).toBe(true)
    expect(contem(semEntrega, 'não tem o item "Terminou quando:"')).toBe(false)
  })

  it('item sem texto, ou escrito de outro jeito: vermelho', () => {
    const vazio = conferirPapeis(amostra({ [`${AGENTES}/validador.md`]: papelBom('validador', `${TITULO_DO_CRITERIO}\n\n- **Terminou quando:**   \n- **Entrega:** o documento.\n`) }))
    expect(contem(vazio, 'não tem o item "Terminou quando:"')).toBe(true)
    const semNegrito = conferirPapeis(amostra({ [`${AGENTES}/validador.md`]: papelBom('validador', `${TITULO_DO_CRITERIO}\n\n- Terminou quando: pronto.\n- **Entrega:** o documento.\n`) }))
    expect(contem(semNegrito, 'não tem o item "Terminou quando:"')).toBe(true)
  })

  it('o item que está na seção seguinte, e não na do critério, não vale', () => {
    const fora = papelBom('validador', `${TITULO_DO_CRITERIO}\n\n- **Terminou quando:** pronto.\n\n## Outra seção\n\n- **Entrega:** o documento.\n`)
    const lida = conferirPapeis(amostra({ [`${AGENTES}/validador.md`]: fora }))
    expect(contem(lida, 'não tem o item "Entrega:"')).toBe(true)
    expect(contem(lida, 'não tem o item "Terminou quando:"')).toBe(false)
  })

  it('a seção na última linha do arquivo, sem quebra de linha no fim, vale', () => {
    const semQuebra = papelBom('validador', CRITERIO_BOM.trimEnd())
    expect(semQuebra.endsWith('o documento.')).toBe(true)
    expect(conferirPapeis(amostra({ [`${AGENTES}/validador.md`]: semQuebra })).falhas).toEqual([])
  })

  it('a seção no meio do arquivo, seguida de outra, vale quando tem os dois itens', () => {
    const noMeio = papelBom('validador', `${CRITERIO_BOM}\n## Depois\n\ntexto\n`)
    expect(conferirPapeis(amostra({ [`${AGENTES}/validador.md`]: noMeio })).falhas).toEqual([])
  })

  it('o papel que não é do time não é obrigado a ter a seção: o revisor da amostra, sem ela, é lido e não é acusado', () => {
    const lida = conferirPapeis(amostra())
    expect(contem(lida, 'revisor.md')).toBe(false)
    expect(lida.comparados).toBe(PAPEIS_DO_TIME.length + 1)
  })
})

describe('RF23: o conflito das skills de terceiros', () => {
  it('as cinco de hoje têm a linha de docs/skills-de-terceiros.md logo depois do frontmatter, e a frontend-design saiu', () => {
    const lida = conferirConflitos(RAIZ)
    expect(lida.falhas).toEqual([])
    expect(lida.comparados).toBeGreaterThanOrEqual(COM_CONFLITO.length)
  })

  it('skill da lista sem a linha: vermelho, um caso por skill, e a conferência não reaplica', () => {
    for (const nome of COM_CONFLITO) {
      const arquivo = `${SKILLS}/${nome}/SKILL.md`
      const raiz = amostra(mudando(arquivo, (t) => t.replace(`${conflitoDe(nome)}\n`, '')))
      const antes = readFileSync(join(raiz, arquivo), 'utf8')
      const lida = conferirConflitos(raiz)
      expect(contem(lida, `${arquivo}: a primeira linha depois do frontmatter não é a de ${CONFLITOS}`), nome).toBe(true)
      expect(readFileSync(join(raiz, arquivo), 'utf8'), 'acusa, não reaplica').toBe(antes)
    }
  })

  it('texto diferente do documento: vermelho, mesmo com uma palavra só', () => {
    const arquivo = `${SKILLS}/lgpd-brasil/SKILL.md`
    const lida = conferirConflitos(amostra(mudando(arquivo, (t) => t.replace('o texto de', 'um texto de'))))
    expect(contem(lida, 'lgpd-brasil/SKILL.md: a primeira linha depois do frontmatter')).toBe(true)
  })

  it('o documento que muda de texto: a skill com o texto velho é vermelha', () => {
    const lida = conferirConflitos(amostra(mudando(CONFLITOS, (t) => t.replace(conflitoDe('lgpd-brasil'), 'Conflito neste repositório: outro texto.'))))
    expect(contem(lida, 'lgpd-brasil/SKILL.md: a primeira linha depois do frontmatter')).toBe(true)
  })

  it('quem contorna é acusado: a linha na segunda linha depois do frontmatter, ou depois de uma linha em branco', () => {
    const arquivo = `${SKILLS}/nestjs-best-practices/SKILL.md`
    const naSegunda = conferirConflitos(amostra(mudando(arquivo, (t) => t.replace(`---\n${conflitoDe('nestjs-best-practices')}`, `---\n# Título\n${conflitoDe('nestjs-best-practices')}`))))
    expect(contem(naSegunda, 'nestjs-best-practices/SKILL.md: a primeira linha depois do frontmatter')).toBe(true)
    const depoisDeBranco = conferirConflitos(amostra(mudando(arquivo, (t) => t.replace(`---\n${conflitoDe('nestjs-best-practices')}`, `---\n\n${conflitoDe('nestjs-best-practices')}`))))
    expect(contem(depoisDeBranco, 'nestjs-best-practices/SKILL.md: a primeira linha depois do frontmatter')).toBe(true)
  })

  it('a linha de conflito dentro do frontmatter, e não depois dele: vermelho', () => {
    const arquivo = `${SKILLS}/vercel-react-best-practices/SKILL.md`
    const dentro = conferirConflitos(amostra(mudando(arquivo, (t) => t.replace(`---\n${conflitoDe('vercel-react-best-practices')}\n`, `# ${conflitoDe('vercel-react-best-practices')}\n---\n`))))
    expect(contem(dentro, 'vercel-react-best-practices/SKILL.md')).toBe(true)
  })

  it('o documento sem a linha de uma das cinco: vermelho, um caso por skill', () => {
    for (const nome of COM_CONFLITO) {
      const lida = conferirConflitos(amostra(mudando(CONFLITOS, (t) => t.split('\n').filter((linha) => !linha.startsWith(`| \`${nome}\` |`)).join('\n'))))
      expect(contem(lida, `${CONFLITOS} não tem a linha de conflito de ${nome}`), nome).toBe(true)
    }
  })

  it('o documento ausente: vermelho, e nada comparado', () => {
    const lida = conferirConflitos(amostra({ [CONFLITOS]: null }))
    expect(lida.falhas).toEqual([`${CONFLITOS} não existe`])
    expect(lida.comparados).toBe(0)
  })

  it('linha do documento cuja skill não existe, ou não tem frontmatter: vermelho', () => {
    const semSkill = conferirConflitos(amostra({ [`${SKILLS}/lgpd-brasil/SKILL.md`]: null }))
    expect(contem(semSkill, 'lgpd-brasil/SKILL.md não existe')).toBe(true)
    const semFrontmatter = conferirConflitos(amostra({ [`${SKILLS}/lgpd-brasil/SKILL.md`]: `${conflitoDe('lgpd-brasil')}\n` }))
    expect(contem(semFrontmatter, 'lgpd-brasil/SKILL.md: sem frontmatter válido')).toBe(true)
  })

  it('uma sexta linha no documento é conferida também', () => {
    const sexta = 'Conflito neste repositório: a sexta.'
    const documento = mudando(CONFLITOS, (t) => `${t}| \`sexta-skill\` | ${sexta} |\n`)
    const lida = conferirConflitos(amostra({ ...documento, [`${SKILLS}/sexta-skill/SKILL.md`]: skillBoa('sexta-skill', 'outra linha\n') }))
    expect(contem(lida, 'sexta-skill/SKILL.md: a primeira linha depois do frontmatter')).toBe(true)
    const certa = conferirConflitos(amostra({ ...documento, [`${SKILLS}/sexta-skill/SKILL.md`]: skillBoa('sexta-skill', `${sexta}\n`) }))
    expect(certa.falhas).toEqual([])
    expect(certa.comparados).toBe(COM_CONFLITO.length + 1)
  })

  it('RF23: a frontend-design no skills-lock.json, ou a pasta dela, ou o lock ausente: vermelho', () => {
    const noLock = conferirConflitos(
      amostra({ [LOCK]: JSON.stringify({ version: 1, skills: Object.fromEntries([...COM_CONFLITO, DE_TERCEIROS_QUE_SAIU].map((nome) => [nome, {}])) }) }),
    )
    expect(noLock.falhas).toEqual([`${LOCK} ainda tem ${DE_TERCEIROS_QUE_SAIU}`])
    const pasta = conferirConflitos(amostra({ [`${SKILLS}/${DE_TERCEIROS_QUE_SAIU}/SKILL.md`]: skillBoa(DE_TERCEIROS_QUE_SAIU) }))
    expect(pasta.falhas).toEqual([`${SKILLS}/${DE_TERCEIROS_QUE_SAIU} ainda existe`])
    const semLock = conferirConflitos(amostra({ [LOCK]: null }))
    expect(semLock.falhas).toEqual([`${LOCK} não existe ou não é JSON`])
    const lockQuebrado = conferirConflitos(amostra({ [LOCK]: '{ não é json' }))
    expect(lockQuebrado.falhas).toEqual([`${LOCK} não existe ou não é JSON`])
  })

  it('lock sem a chave skills: vale como lock sem a frontend-design', () => {
    expect(conferirConflitos(amostra({ [LOCK]: '{"version":1}' })).falhas).toEqual([])
  })
})

describe('RF24: a skill status saiu e ninguém a cita', () => {
  it('no repositório de hoje a pasta não existe e nada a cita, lendo ao menos 40 arquivos', () => {
    const lida = conferirStatus(RAIZ)
    expect(lida.falhas).toEqual([])
    expect(lida.comparados).toBeGreaterThanOrEqual(MINIMO_DE_ARQUIVOS_LIDOS)
  })

  it('a pasta da skill ainda existe: vermelho', () => {
    const lida = conferirStatus(amostra({ [`${SKILLS}/status/SKILL.md`]: skillBoa('status') }))
    expect(contem(lida, `${SKILLS}/status ainda existe`)).toBe(true)
  })

  it('citada entre crases, como comando ou como pasta: vermelho, uma forma por caso', () => {
    const formas = ['as skills: `status`, `descobrir`', 'rode /status agora', 'veja .claude/skills/status/SKILL.md']
    for (const forma of formas) {
      const lida = conferirStatus(amostra({ [`${AGENTES}/revisor.md`]: `---\nname: revisor\ndescription: R.\ntools: Read\nmodel: opus\n---\n${forma}\n` }))
      expect(contem(lida, `${AGENTES}/revisor.md:7 cita a skill status`), forma).toBe(true)
    }
  })

  it('citada em cada lugar que a conferência lê: papel, regra, settings.json, skill nossa, hook, CLAUDE.md e código do processo', () => {
    const lugares = [
      `${AGENTES}/arquiteto.md`,
      `${REGRAS}/00-a.md`,
      SETTINGS,
      `${SKILLS}/procedimento/SKILL.md`,
      `${SKILLS}/procedimento/passos/um.md`,
      `${HOOKS}/inicio.sh`,
      'CLAUDE.md',
      'tools/processo/estado.ts',
    ]
    for (const lugar of lugares) {
      const base = BOA[lugar] ?? '# passo\n'
      const lida = conferirStatus(amostra({ [lugar]: `${base}// leem daqui o /status e o resto\n` }))
      expect(contem(lida, `${lugar}:`), lugar).toBe(true)
    }
  })

  it('o que não é a skill não é acusado: "floor status", "git status", "o status do andar", "docs/status.md", "a/status"', () => {
    const texto = 'maestri floor status --clear\ngit status --short\no status do andar\nveja docs/status.md\numa rota a/status, o endpoint /statuses e statuses\n'
    const lida = conferirStatus(amostra({ [`${AGENTES}/revisor.md`]: `---\nname: revisor\ndescription: R.\ntools: Read\nmodel: opus\n---\n${texto}` }))
    expect(lida.falhas).toEqual([])
  })

  it('a skill de terceiros, que não é nossa, pode falar de status; o teste do processo, e o que a conferência não lê, também', () => {
    const lida = conferirStatus(
      amostra({
        [`${SKILLS}/lgpd-brasil/SKILL.md`]: skillBoa('lgpd-brasil', 'o campo `status` e o /status da API\n'),
        'tools/processo/estado.test.ts': '// o /status e `status`\n',
        'docs/outro.md': 'a skill `status`\n',
      }),
    )
    expect(lida.falhas).toEqual([])
  })

  it('a conferência conta o que leu: papel, regra, settings.json, skill nossa, hook, CLAUDE.md e código do processo, e nada além', () => {
    const lida = conferirStatus(
      amostra({
        [`${AGENTES}/notas.txt`]: 'a skill `status`\n',
        [`${REGRAS}/notas.txt`]: 'a skill `status`\n',
        '.claude/outro.json': '{ "status": "`status`" }\n',
        [`${SKILLS}/procedimento/notas.txt`]: 'a skill `status`\n',
        [`${HOOKS}/pasta/dentro.sh`]: 'a skill `status`\n',
        [`${HOOKS}/vazia/`]: '',
        'README.md': 'a skill `status`\n',
        'tools/processo/estado.test.ts': '// `status`\n',
        'tools/processo/ferramenta.mjs': '// `status`\n',
        'tools/processo/harness/dentro.ts': '// `status`\n',
      }),
    )
    expect(lida.falhas).toEqual([])
    // 5 papéis (4 do time e o revisor), 2 regras, o settings.json, 1 skill nossa, 1 hook, o CLAUDE.md e o estado.ts.
    expect(lida.comparados).toBe(5 + 2 + 1 + 1 + 1 + 1 + 1)
  })

  it('sem o lock, as skills todas são lidas como nossas', () => {
    const lida = conferirStatus(amostra({ [LOCK]: null, [`${SKILLS}/lgpd-brasil/SKILL.md`]: skillBoa('lgpd-brasil', 'veja `status`\n') }))
    expect(contem(lida, 'lgpd-brasil/SKILL.md:5 cita a skill status')).toBe(true)
  })
})

describe('RF30: o paths: das regras', () => {
  it('o de hoje casa algo, em ao menos 20 padrões', () => {
    const lida = conferirRegras(RAIZ)
    expect(lida.falhas).toEqual([])
    expect(lida.comparados).toBeGreaterThanOrEqual(MINIMO_DE_PADROES)
  })

  it('padrão que não casa com nada: vermelho, e o que casa não é acusado', () => {
    const regra = '---\npaths:\n  - "apps/**"\n  - "inexistente/**"\n---\n# A\n'
    const lida = conferirRegras(amostra({ [`${REGRAS}/00-a.md`]: regra }))
    expect(lida.falhas).toEqual([`${REGRAS}/00-a.md: o padrão "inexistente/**" de paths não casa com nenhum arquivo`])
    expect(lida.comparados).toBe(2)
  })

  it('padrão que só casaria dentro de node_modules: vermelho', () => {
    for (const dentro of ['node_modules/pacote/index.ts', 'apps/api/node_modules/pacote/index.ts']) {
      const regra = '---\npaths:\n  - "**/index.ts"\n---\n# A\n'
      const lida = conferirRegras(amostra({ [`${REGRAS}/00-a.md`]: regra, 'apps/api/src/a.ts': null, [dentro]: 'export {}\n' }))
      expect(lida.falhas, dentro).toHaveLength(1)
    }
  })

  it('padrão que só casaria dentro de .git: vermelho, porque o ** do glob não entra em pasta de ponto', () => {
    const regra = '---\npaths:\n  - "**/HEAD"\n---\n# A\n'
    const raiz = amostra({ [`${REGRAS}/00-a.md`]: regra, 'apps/api/src/a.ts': null, '.git/HEAD': 'ref: refs/heads/x\n' })
    expect(existsSync(join(raiz, '.git/HEAD')), 'o arquivo existe, e só a pasta de ponto o esconde').toBe(true)
    expect(conferirRegras(raiz).falhas).toHaveLength(1)
  })

  it('padrão com ** no meio e com extensão casa o que existe', () => {
    const regra = '---\npaths:\n  - "**/src/*.ts"\n  - "apps/*/src/**"\n---\n# A\n'
    expect(conferirRegras(amostra({ [`${REGRAS}/00-a.md`]: regra })).falhas).toEqual([])
  })

  it('paths que não é lista, que é lista vazia ou que tem um item que não é texto: vermelho', () => {
    for (const forma of ['paths: "apps/**"', 'paths: []', 'paths:\n  - "apps/**"\n  - 7', 'paths:\n  - 7']) {
      const lida = conferirRegras(amostra({ [`${REGRAS}/00-a.md`]: `---\n${forma}\n---\n# A\n` }))
      expect(lida.falhas, forma).toEqual([`${REGRAS}/00-a.md: paths não é uma lista de textos`])
      expect(lida.comparados, forma).toBe(0)
    }
  })

  it('regra sem paths, ou sem frontmatter, é a sempre carregada: não é conferida', () => {
    const lida = conferirRegras(amostra({ [`${REGRAS}/20-c.md`]: '---\ntitulo: sem paths\n---\n# C\n', [`${REGRAS}/70-d.md`]: '# D\n' }))
    expect(lida).toEqual({ falhas: [], comparados: 1 })
  })

  it('arquivo da pasta de regras que não é .md não é regra', () => {
    const lida = conferirRegras(amostra({ [`${REGRAS}/notas.txt`]: '---\npaths:\n  - "inexistente/**"\n---\n' }))
    expect(lida.falhas).toEqual([])
  })
})

describe('RF30: o comando de hook do settings.json', () => {
  const settings = (...comandos: string[]): string =>
    JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Bash', hooks: comandos.map((command) => ({ type: 'command', command })) }] } })

  it('os de hoje apontam arquivos que existem, em ao menos 3 comandos', () => {
    const lida = conferirHooks(RAIZ)
    expect(lida.falhas).toEqual([])
    expect(lida.comparados).toBeGreaterThanOrEqual(MINIMO_DE_HOOKS)
  })

  it('comando que aponta arquivo que não existe: vermelho, e o que existe não é acusado', () => {
    const lida = conferirHooks(
      amostra({ [SETTINGS]: settings('bash "$CLAUDE_PROJECT_DIR/.claude/hooks/inicio.sh"', 'node "$CLAUDE_PROJECT_DIR/tools/processo/sumiu.ts" registrar') }),
    )
    expect(lida.falhas).toEqual([`${SETTINGS}: o comando de hook aponta tools/processo/sumiu.ts, que não existe`])
    expect(lida.comparados).toBe(2)
  })

  it('o caminho sem aspas e com o resto do comando depois dele é lido até o espaço', () => {
    const lida = conferirHooks(amostra({ [SETTINGS]: settings('node $CLAUDE_PROJECT_DIR/.claude/hooks/inicio.sh registrar || exit 2') }))
    expect(lida).toEqual({ falhas: [], comparados: 1 })
    const quebrado = conferirHooks(amostra({ [SETTINGS]: settings("node '$CLAUDE_PROJECT_DIR/.claude/hooks/sumiu.sh' registrar") }))
    expect(quebrado.falhas).toEqual([`${SETTINGS}: o comando de hook aponta .claude/hooks/sumiu.sh, que não existe`])
  })

  it('dois caminhos no mesmo comando são conferidos os dois', () => {
    const lida = conferirHooks(amostra({ [SETTINGS]: settings('bash "$CLAUDE_PROJECT_DIR/.claude/hooks/inicio.sh" "$CLAUDE_PROJECT_DIR/.claude/hooks/sumiu.sh"') }))
    expect(lida.falhas).toEqual([`${SETTINGS}: o comando de hook aponta .claude/hooks/sumiu.sh, que não existe`])
    expect(lida.comparados).toBe(2)
  })

  it('em todo evento e em todo grupo: o segundo grupo e o segundo evento também são lidos', () => {
    const configuracao = {
      hooks: {
        SessionStart: [{ hooks: [{ type: 'command', command: 'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/inicio.sh"' }] }],
        SubagentStop: [
          { matcher: 'a', hooks: [{ type: 'command', command: 'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/inicio.sh"' }] },
          { matcher: 'b', hooks: [{ type: 'command', command: 'bash "$CLAUDE_PROJECT_DIR/.claude/hooks/sumiu.sh"' }] },
        ],
      },
    }
    const lida = conferirHooks(amostra({ [SETTINGS]: JSON.stringify(configuracao) }))
    expect(lida.falhas).toEqual([`${SETTINGS}: o comando de hook aponta .claude/hooks/sumiu.sh, que não existe`])
    expect(lida.comparados).toBe(3)
  })

  it('comando sem $CLAUDE_PROJECT_DIR, grupo sem hooks e hook sem command não têm arquivo a conferir', () => {
    const configuracao = { hooks: { Stop: [{ hooks: [{ type: 'command', command: 'echo pronto' }, { type: 'prompt' }] }, { matcher: 'x' }] } }
    const lida = conferirHooks(amostra({ [SETTINGS]: JSON.stringify(configuracao) }))
    expect(lida).toEqual({ falhas: [], comparados: 0 })
  })

  it('settings sem hooks: nada comparado; sem o arquivo ou fora de JSON: vermelho', () => {
    expect(conferirHooks(amostra({ [SETTINGS]: '{}' }))).toEqual({ falhas: [], comparados: 0 })
    expect(conferirHooks(amostra({ [SETTINGS]: null }))).toEqual({ falhas: [`${SETTINGS} não existe`], comparados: 0 })
    expect(conferirHooks(amostra({ [SETTINGS]: '{ não é json' }))).toEqual({ falhas: [`${SETTINGS} não é JSON`], comparados: 0 })
  })
})
