// Os rótulos que o hook (`revisoes.ts`) e o `estado.ts` leem existem nos modelos de documento (RF12).
//
// O que lê e o que escreve não se falam: o hook procura `**Subagentes obrigatórios:**` no `N_task.md` e o `estado.ts`
// procura `**Porte:**`, mas quem escreve o texto é o modelo, em `.claude/skills/`. Quem muda o modelo (um asterisco a
// menos, uma maiúscula) não vê nada quebrar: o hook lê "nenhum guardião marcado" e o commit passa sem o veto. Aqui o
// modelo é lido do disco e conferido contra as constantes exportadas pelo código que o lê.
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  COLUNAS_DE_DEPENDENCIAS,
  lerDependencias,
  lerTarefas,
  ROTULO_DO_ESCOPO,
  ROTULO_DO_PORTE,
  ROTULO_DO_VEREDITO,
  TITULO_DA_RODADA_DA_VALIDACAO,
  TITULO_DA_TABELA_DE_DEPENDENCIAS,
  VEREDITOS_DA_VALIDACAO,
} from '../estado.ts'
import { lerMutacoes } from '../mutacoes.ts'
import { REVISORES_COM_VETO, REVISORES_SEM_VETO, ROTULO_DOS_SUBAGENTES } from '../revisoes.ts'

const RAIZ = join(import.meta.dirname, '..', '..', '..')

const MODELOS = {
  tarefa: '.claude/skills/criar-tasks/task-template.md',
  lista: '.claude/skills/criar-tasks/tasks-template.md',
  validacao: '.claude/skills/validar/template.md',
  spec: '.claude/skills/revisar-spec/SKILL.md',
} as const
type Modelo = keyof typeof MODELOS

interface Rotulo {
  modelo: Modelo
  texto: string
  /** O código ancora no começo da linha (`^`); os outros dois procuram em qualquer lugar dela. */
  noInicioDaLinha: boolean
}

const ROTULOS: Rotulo[] = [
  { modelo: 'tarefa', texto: ROTULO_DOS_SUBAGENTES, noInicioDaLinha: false },
  { modelo: 'tarefa', texto: ROTULO_DO_PORTE, noInicioDaLinha: false },
  { modelo: 'lista', texto: TITULO_DA_TABELA_DE_DEPENDENCIAS, noInicioDaLinha: true },
  { modelo: 'validacao', texto: TITULO_DA_RODADA_DA_VALIDACAO, noInicioDaLinha: true },
  { modelo: 'validacao', texto: ROTULO_DO_ESCOPO, noInicioDaLinha: true },
  { modelo: 'validacao', texto: ROTULO_DO_VEREDITO, noInicioDaLinha: true },
  { modelo: 'spec', texto: ROTULO_DO_VEREDITO, noInicioDaLinha: true },
]

/** Quantos rótulos a conferência acha nos modelos de hoje. Lista encurtada para calar o teste deixa de somar isto. */
const MINIMO_DE_ROTULOS = 7

const REVISORES_CONHECIDOS = new Set([...REVISORES_COM_VETO, ...REVISORES_SEM_VETO])
// Os dois nomes vêm hoje do comentário `<!-- test-engineer e revisor-geral ... -->` de `task-template.md`: quem o tirar
// recebe este vermelho (o teste "os modelos de hoje passam"), que não é de rótulo.
const MINIMO_DE_NOMES_DE_REVISOR = 2

const ler = (caminho: string): string | null => {
  try {
    return readFileSync(caminho, 'utf8')
  } catch {
    return null
  }
}

/** Troca, em cada linha que tem o rótulo, o que vem depois dele: é o modelo "preenchido" do jeito que o autor o faz. */
const preencher = (texto: string, rotulo: string, valor: string): string =>
  texto
    .split('\n')
    .map((linha) => (linha.includes(rotulo) ? `${rotulo}${valor}` : linha))
    .join('\n')

/** O bloco entre as cercas da seção "Consolidar" do `/revisar-spec`: é o formato que o `revisao-spec.md` recebe. */
function blocoDoFormato(skill: string): string | null {
  const secao = skill.search(/^##\s+\d+\.\s+Consolidar/m)
  if (secao === -1) return null
  const abre = skill.indexOf('```', secao)
  const fecha = abre === -1 ? -1 : skill.indexOf('\n```', abre + 3)
  return fecha === -1 ? null : skill.slice(abre + 3, fecha)
}

const SUFIXO_DE_REVISOR = /\b[a-z]+(?:-[a-z]+)*-(?:guardian|reviewer|engineer|integrator|geral)\b/g

/** Os nomes entre crases na linha dos subagentes (menos o `...` do modelo) e os que têm cara de revisor em qualquer lugar. */
function nomesDeRevisor(texto: string): string[] {
  const linha = aposRotulo(texto, ROTULO_DOS_SUBAGENTES)
  const daLinha = [...linha.matchAll(/`([^`]+)`/g)].map((achado) => achado[1] ?? '').filter((nome) => !/^\.+$/.test(nome))
  return [...new Set([...daLinha, ...(texto.match(SUFIXO_DE_REVISOR) ?? [])])]
}

interface Conferencia {
  falhas: string[]
  rotulosAchados: number
  nomesDeRevisorAchados: number
}

const aposRotulo = (texto: string, rotulo: string): string => texto.split(rotulo)[1]?.split('\n')[0] ?? ''

/** O `N_task.md`: os nomes de revisor que o modelo cita e o bloco `mutacao` de exemplo. */
function conferirTarefa(tarefa: string, falhas: string[]): number {
  const nomes = nomesDeRevisor(tarefa)
  for (const nome of nomes.filter((achado) => !REVISORES_CONHECIDOS.has(achado))) {
    falhas.push(`nome de revisor desconhecido ${JSON.stringify(nome)} em ${MODELOS.tarefa}`)
  }
  const mutacoes = lerMutacoes(tarefa)
  if (mutacoes.mutacoes.length === 0) {
    falhas.push(`o bloco \`mutacao\` de ${MODELOS.tarefa} não é lido por lerMutacoes (${mutacoes.erros.join('; ') || 'nenhum bloco'})`)
  }
  return nomes.length
}

/** O `tasks.md`: a lista de tarefas e as colunas da tabela de dependências, que o código lê por posição. */
function conferirLista(lista: string, falhas: string[]): void {
  const numeros = lerTarefas(lista).map((item) => item.numero)
  if (numeros.length < 2) falhas.push(`lerTarefas acha ${numeros.length} tarefas em ${MODELOS.lista}, e o modelo traz duas`)
  if (lerDependencias(lista).size < 2) falhas.push(`a tabela de dependências de ${MODELOS.lista} não tem as duas linhas de exemplo no formato N.0`)
  const secao = lista.slice(Math.max(0, lista.indexOf(TITULO_DA_TABELA_DE_DEPENDENCIAS)))
  const cabecalho = (secao.split('\n').find((linha) => linha.startsWith('|')) ?? '').split('|').map((celula) => celula.trim())
  for (const coluna of Object.values(COLUNAS_DE_DEPENDENCIAS)) {
    if (cabecalho[coluna.posicao] !== coluna.titulo) {
      falhas.push(`a coluna ${coluna.posicao} de ${MODELOS.lista} é ${JSON.stringify(cabecalho[coluna.posicao] ?? null)}, e o código lê ${JSON.stringify(coluna.titulo)} nela`)
    }
  }
}

/** O `validacao.md`: os três vereditos que `lerValidacao` lê, na linha de veredito do modelo. */
function conferirValidacao(validacao: string, falhas: string[]): void {
  const veredito = validacao.split('\n').find((linha) => linha.startsWith(ROTULO_DO_VEREDITO)) ?? ''
  for (const lido of VEREDITOS_DA_VALIDACAO.filter((nome) => !veredito.includes(nome))) {
    falhas.push(`o veredito ${JSON.stringify(lido)} não está na linha de veredito de ${MODELOS.validacao}`)
  }
}

/** O bloco do formato do `revisao-spec.md`: a linha de veredito traz o `APROVADA` que `specAprovada` lê. */
function conferirBloco(bloco: string, falhas: string[]): void {
  if (!bloco.split('\n').some((linha) => linha.startsWith(ROTULO_DO_VEREDITO) && linha.includes('APROVADA'))) {
    falhas.push(`a linha de veredito do bloco de ${MODELOS.spec} não traz APROVADA`)
  }
}

/** Quantos rótulos de `ROTULOS` estão no modelo, e uma falha para cada um que não está. */
function conferirRotulos(texto: (modelo: Modelo) => string | undefined, falhas: string[]): number {
  let achados = 0
  for (const rotulo of ROTULOS) {
    const alvo = texto(rotulo.modelo)
    if (alvo === undefined) continue
    const achou = rotulo.noInicioDaLinha ? alvo.split('\n').some((linha) => linha.startsWith(rotulo.texto)) : alvo.includes(rotulo.texto)
    if (achou) achados += 1
    else falhas.push(`rótulo ${JSON.stringify(rotulo.texto)} ausente em ${MODELOS[rotulo.modelo]}`)
  }
  return achados
}

/** Confere os quatro modelos sob `raiz`. Cada falha diz o rótulo (ou o nome) e o modelo. */
function conferirModelos(raiz: string): Conferencia {
  const falhas: string[] = []
  const textos = new Map<Modelo, string>()
  for (const modelo of Object.keys(MODELOS) as Modelo[]) {
    const texto = ler(join(raiz, MODELOS[modelo]))
    if (texto === null) falhas.push(`modelo ausente: ${MODELOS[modelo]}`)
    else textos.set(modelo, texto)
  }
  const bloco = blocoDoFormato(textos.get('spec') ?? '')
  if (bloco === null) falhas.push(`bloco do formato não achado em ${MODELOS.spec} (seção "Consolidar")`)
  const texto = (modelo: Modelo): string | undefined => (modelo === 'spec' ? (bloco ?? undefined) : textos.get(modelo))

  const rotulosAchados = conferirRotulos(texto, falhas)
  const tarefa = texto('tarefa')
  const lista = texto('lista')
  const validacao = texto('validacao')
  const nomesDeRevisorAchados = tarefa === undefined ? 0 : conferirTarefa(tarefa, falhas)
  if (lista !== undefined) conferirLista(lista, falhas)
  if (validacao !== undefined) conferirValidacao(validacao, falhas)
  const spec = texto('spec')
  if (spec !== undefined) conferirBloco(spec, falhas)
  return { falhas, rotulosAchados, nomesDeRevisorAchados }
}

const pastas: string[] = []
afterEach(() => {
  for (const pasta of pastas.splice(0)) rmSync(pasta, { recursive: true, force: true })
})

/** Uma cópia dos quatro modelos em pasta temporária, que o teste estraga sem tocar o original. */
function copiaDosModelos(): string {
  const raiz = mkdtempSync(join(tmpdir(), 'rotulos-'))
  pastas.push(raiz)
  for (const caminho of Object.values(MODELOS)) {
    mkdirSync(join(raiz, dirname(caminho)), { recursive: true })
    cpSync(join(RAIZ, caminho), join(raiz, caminho))
  }
  return raiz
}

/** Reescreve um modelo da cópia a partir do texto que ele tem. */
function estragar(raiz: string, modelo: Modelo, mudar: (texto: string) => string): void {
  const caminho = join(raiz, MODELOS[modelo])
  const antes = readFileSync(caminho, 'utf8')
  const depois = mudar(antes)
  expect(depois, 'a amostra precisa mudar o modelo, ou o teste não prova nada').not.toBe(antes)
  writeFileSync(caminho, depois)
}

describe('os rótulos que o hook e o estado.ts leem existem nos modelos', () => {
  it('os modelos de hoje passam, e a conferência acha os rótulos e os nomes que espera', () => {
    const { falhas, rotulosAchados, nomesDeRevisorAchados } = conferirModelos(RAIZ)
    expect(falhas).toEqual([])
    expect(rotulosAchados).toBeGreaterThanOrEqual(MINIMO_DE_ROTULOS)
    expect(nomesDeRevisorAchados).toBeGreaterThanOrEqual(MINIMO_DE_NOMES_DE_REVISOR)
  })

  it.each(ROTULOS.map((rotulo) => [`${rotulo.modelo}: ${rotulo.texto}`, rotulo] as const))('rótulo tirado do modelo: %s deixa a conferência vermelha, dizendo qual', (_nome, rotulo) => {
    const raiz = copiaDosModelos()
    estragar(raiz, rotulo.modelo, (texto) => texto.replaceAll(rotulo.texto, ''))
    const { falhas } = conferirModelos(raiz)
    expect(falhas.some((falha) => falha.includes(JSON.stringify(rotulo.texto)) && falha.includes(MODELOS[rotulo.modelo]))).toBe(true)
  })

  // De propósito mais estrita que o código: `ESCOPO_DE_TAREFA` (`estado.ts`) tem a flag `i` e leria `**escopo:**`, mas o
  // modelo escreve o rótulo de um jeito só, e uma caixa diferente nele já é desvio que o autor deve ver.
  const CONTORNOS: [string, (texto: string) => string][] = [
    ['outra caixa', (texto) => texto.toLowerCase()],
    ['sem os asteriscos', (texto) => texto.replaceAll('*', '')],
    ['com um # a menos', (texto) => texto.replaceAll('#', '')],
  ]
  it.each(ROTULOS.flatMap((rotulo) => CONTORNOS.map(([contorno, mudar]) => [`${rotulo.modelo}: ${rotulo.texto} ${contorno}`, rotulo, mudar] as const)).filter(([, rotulo, mudar]) => mudar(rotulo.texto) !== rotulo.texto))(
    'quem contorna é acusado: %s',
    (_nome, rotulo, mudar) => {
      const raiz = copiaDosModelos()
      estragar(raiz, rotulo.modelo, (texto) => texto.replaceAll(rotulo.texto, mudar(rotulo.texto)))
      const { falhas } = conferirModelos(raiz)
      expect(falhas.some((falha) => falha.includes(JSON.stringify(rotulo.texto)) && falha.includes(MODELOS[rotulo.modelo]))).toBe(true)
    },
  )

  it('rótulo fora do começo da linha, onde o código o ancora: vermelho', () => {
    const raiz = copiaDosModelos()
    estragar(raiz, 'validacao', (texto) => texto.replaceAll(ROTULO_DO_ESCOPO, `> ${ROTULO_DO_ESCOPO}`))
    expect(conferirModelos(raiz).falhas).toContain(`rótulo ${JSON.stringify(ROTULO_DO_ESCOPO)} ausente em ${MODELOS.validacao}`)
  })

  it('nome de revisor inventado na linha dos subagentes: vermelho', () => {
    const raiz = copiaDosModelos()
    estragar(raiz, 'tarefa', (texto) => preencher(texto, ROTULO_DOS_SUBAGENTES, ' `inventado-checker`, `test-engineer`'))
    expect(conferirModelos(raiz).falhas).toContain(`nome de revisor desconhecido "inventado-checker" em ${MODELOS.tarefa}`)
  })

  it('nome com cara de revisor citado fora da linha dos subagentes: vermelho', () => {
    const raiz = copiaDosModelos()
    estragar(raiz, 'tarefa', (texto) => `${texto}\nChame o inventado-guardian.\n`)
    expect(conferirModelos(raiz).falhas).toContain(`nome de revisor desconhecido "inventado-guardian" em ${MODELOS.tarefa}`)
  })

  it('nome de revisor que o hook conhece, na linha dos subagentes: verde', () => {
    const raiz = copiaDosModelos()
    estragar(raiz, 'tarefa', (texto) => preencher(texto, ROTULO_DOS_SUBAGENTES, ' `tenancy-guardian`, `frontend-reviewer`, `revisor-geral`'))
    expect(conferirModelos(raiz).falhas).toEqual([])
  })

  it('modelo ausente: vermelho, dizendo qual', () => {
    for (const modelo of Object.keys(MODELOS) as Modelo[]) {
      const raiz = copiaDosModelos()
      rmSync(join(raiz, MODELOS[modelo]))
      expect(conferirModelos(raiz).falhas, modelo).toContain(`modelo ausente: ${MODELOS[modelo]}`)
    }
  })

  it('pasta sem nenhum modelo: vermelho nos quatro, e nenhum rótulo achado', () => {
    const vazia = mkdtempSync(join(tmpdir(), 'rotulos-vazia-'))
    pastas.push(vazia)
    const { falhas, rotulosAchados } = conferirModelos(vazia)
    expect(falhas.filter((falha) => falha.startsWith('modelo ausente'))).toHaveLength(4)
    expect(rotulosAchados).toBe(0)
  })

  it('o bloco do formato do /revisar-spec some: vermelho, dizendo que não achou', () => {
    const raiz = copiaDosModelos()
    estragar(raiz, 'spec', (texto) => texto.replace(/^##\s+\d+\.\s+Consolidar/m, '## 4. Juntar'))
    expect(conferirModelos(raiz).falhas.some((falha) => falha.startsWith('bloco do formato não achado'))).toBe(true)
  })

  it('a coluna "Depende de" trocada de lugar com a de paralelismo: vermelho nas duas', () => {
    const raiz = copiaDosModelos()
    estragar(raiz, 'lista', (texto) => texto.replace('| Depende de | Pode correr em paralelo com |', '| Pode correr em paralelo com | Depende de |'))
    const { falhas } = conferirModelos(raiz)
    expect(falhas.filter((falha) => falha.includes('a coluna'))).toHaveLength(2)
  })

  it('lista de tarefas sem o formato `- [ ] **N.0 — título**`: vermelho', () => {
    const raiz = copiaDosModelos()
    estragar(raiz, 'lista', (texto) => texto.replaceAll('- [ ] **', '- [ ] '))
    expect(conferirModelos(raiz).falhas.some((falha) => falha.startsWith('lerTarefas acha 0 tarefas'))).toBe(true)
  })

  it('bloco `mutacao` sem a linha `arquivo:`: vermelho', () => {
    const raiz = copiaDosModelos()
    estragar(raiz, 'tarefa', (texto) => texto.replace(/^arquivo: .*\n/m, ''))
    expect(conferirModelos(raiz).falhas.some((falha) => falha.includes('não é lido por lerMutacoes'))).toBe(true)
  })

  it('tabela de dependências cujas linhas não são `N.0`: vermelho', () => {
    const raiz = copiaDosModelos()
    estragar(raiz, 'lista', (texto) => texto.replaceAll('| 2.0 |', '| 2 |'))
    expect(conferirModelos(raiz).falhas.some((falha) => falha.startsWith('a tabela de dependências'))).toBe(true)
  })

  it('linha de veredito do bloco da spec sem APROVADA: vermelho', () => {
    const raiz = copiaDosModelos()
    estragar(raiz, 'spec', (texto) => texto.replace('**Veredito: APROVADA | REPROVADA**', '**Veredito: REPROVADA**'))
    expect(conferirModelos(raiz).falhas).toContain(`a linha de veredito do bloco de ${MODELOS.spec} não traz APROVADA`)
  })

  it('veredito que o código lê tirado da linha de veredito da validação: vermelho', () => {
    const raiz = copiaDosModelos()
    estragar(raiz, 'validacao', (texto) => texto.replace('APROVADA COM RESSALVAS', 'APROVADA COM RESERVAS'))
    expect(conferirModelos(raiz).falhas).toContain(`o veredito "APROVADA COM RESSALVAS" não está na linha de veredito de ${MODELOS.validacao}`)
  })
})
