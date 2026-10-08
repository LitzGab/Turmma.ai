// Onde uma funcionalidade está no processo, calculado dos arquivos. É a fonte única da fase: o `/seguir`, o hook de
// início de sessão e o `/status` leem daqui, em vez de cada um inferir do seu jeito.
//
//   node tools/processo/estado.ts [funcionalidade]            relatório em texto
//   node tools/processo/estado.ts [funcionalidade] --json     o mesmo, para o orquestrador
//   node tools/processo/estado.ts --resumo                    as linhas do hook de início de sessão
//
// Existe porque, em 08/10/2026, três fontes diziam três coisas da F3: o `ROADMAP.md` a mostrava como não começada,
// o cabeçalho do `tasks.md` dizia "0 de 19" e o hook de início de sessão anunciava a F2 como próxima. Só o
// `estado.md`, escrito à mão pelo orquestrador, estava certo. Fase inferida por modelo a cada sessão diverge; fase
// calculada do que está no disco, não.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { arquivosAlterados, DOCUMENTO_QUE_UMA_SUITE_LE, lerRevisoes, REVISORES_COM_VETO, revisoresObrigatorios, type Revisao } from './revisoes.ts'

export type Marca = 'pendente' | 'andamento' | 'concluida'

export interface ItemDoRoadmap {
  /** `F3`, `A0b`. */
  id: string
  /** O nome em kebab-case, que é também o da pasta `tasks/prd-<nome>/`. */
  nome: string
  marca: Marca
}

export interface Tarefa {
  numero: number
  titulo: string
  feita: boolean
}

export type Fase =
  | 'sem-prd'
  | 'sem-techspec'
  | 'sem-revisao-da-spec'
  | 'sem-tarefas'
  | 'construindo'
  | 'sem-validacao'
  | 'validacao-reprovada'
  | 'validacao-com-ressalvas'
  | 'validada'
  | 'aguardando-pouso'
  | 'sem-retro'
  | 'concluida'

export type VereditoDaValidacao = 'APROVADA' | 'APROVADA COM RESSALVAS' | 'REPROVADA'

/** O prefixo da branch de uma spec: é o que separa "validada, falta pousar" de "pousada, falta a retro". */
export const PREFIXO_DA_BRANCH_DE_SPEC = 'spec/'

/** Os guardiões com veto que uma tarefa marca; `test-engineer` e `revisor-geral` toda tarefa tem e não dizem o porte. */
const GUARDIOES = REVISORES_COM_VETO.filter((revisor) => revisor !== 'test-engineer' && revisor !== 'revisor-geral')

/** A partir de quantos guardiões com veto a tarefa sem `**Porte:**` conta como grande. */
export const GUARDIOES_DE_TAREFA_GRANDE = 3

const MARCAS: Record<string, Marca> = { ' ': 'pendente', '~': 'andamento', x: 'concluida' }

export function lerRoadmap(conteudo: string): ItemDoRoadmap[] {
  return [...conteudo.matchAll(/^## ([A-Z]\d+[a-z]?) — `([a-z0-9-]+)` \[([ x~])\]/gm)].map((achado) => ({
    id: achado[1] ?? '',
    nome: achado[2] ?? '',
    marca: MARCAS[achado[3] ?? ' '] ?? 'pendente',
  }))
}

export function lerTarefas(conteudoTasks: string): Tarefa[] {
  // Sem âncora no fim: `- [ ] **2.0 — título** (revista)` é tarefa, e descartá-la fazia a funcionalidade parecer pronta.
  return [...conteudoTasks.matchAll(/^- \[([ x])\] \*\*(\d+)\.0 — (.+?)\*\*/gm)].map((achado) => ({
    numero: Number(achado[2]),
    titulo: achado[3] ?? '',
    feita: achado[1] === 'x',
  }))
}

/**
 * `3.0, 7.0 a 9.0` vira 3, 7, 8 e 9. A faixa aceita `a`, `até`, travessão e hífen, e as pontas em qualquer ordem: faixa
 * lida como duas tarefas soltas perderia as do meio em silêncio. Célula sem número (`nenhuma`, `—`) não depende de nada.
 */
export function expandirTarefas(celula: string): number[] {
  const numeros = new Set<number>()
  for (const achado of celula.matchAll(/(?<![\d.])(\d+)\.0(?!\d)(?:\s*(?:a|até|–|—|-)\s*(\d+)\.0(?!\d))?/g)) {
    const pontas = [Number(achado[1]), achado[2] ? Number(achado[2]) : Number(achado[1])]
    for (let numero = Math.min(...pontas); numero <= Math.max(...pontas); numero++) numeros.add(numero)
  }
  return [...numeros]
}

/** A coluna "Depende de" da tabela de dependências do `tasks.md`, por tarefa. */
export function lerDependencias(conteudoTasks: string): Map<number, number[]> {
  const inicio = conteudoTasks.indexOf('\n## Dependências e paralelismo')
  if (inicio === -1) return new Map()
  const fim = conteudoTasks.indexOf('\n## ', inicio + 1)
  const secao = conteudoTasks.slice(inicio, fim === -1 ? undefined : fim)
  const dependencias = new Map<number, number[]>()
  for (const linha of secao.split('\n')) {
    const celulas = linha.split('|').map((celula) => celula.trim())
    const tarefa = /^(\d+)\.0$/.exec(celulas[1] ?? '')
    if (tarefa) dependencias.set(Number(tarefa[1]), expandirTarefas(celulas[2] ?? ''))
  }
  return dependencias
}

export interface Escolha {
  /** A primeira pendente, na ordem da lista, com toda dependência concluída. */
  proxima: Tarefa | null
  /** As pendentes que ainda esperam outra tarefa, com o que falta em cada uma. */
  bloqueadas: { tarefa: Tarefa; falta: number[] }[]
}

export function escolherTarefa(tarefas: Tarefa[], dependencias: Map<number, number[]>): Escolha {
  const feitas = new Set(tarefas.filter((tarefa) => tarefa.feita).map((tarefa) => tarefa.numero))
  const escolha: Escolha = { proxima: null, bloqueadas: [] }
  for (const tarefa of tarefas.filter((pendente) => !pendente.feita)) {
    const falta = (dependencias.get(tarefa.numero) ?? []).filter((numero) => !feitas.has(numero))
    if (falta.length > 0) escolha.bloqueadas.push({ tarefa, falta })
    else escolha.proxima ??= tarefa
  }
  return escolha
}

export interface Porte {
  porte: 'pequeno' | 'grande'
  /** Sem a linha `**Porte:**` no documento, o porte sai da contagem de guardiões, e quem lê precisa saber disso. */
  inferido: boolean
}

/**
 * O porte decide o modelo que começa a tarefa: grande no Sonnet, pequena no Haiku. Quem marca é o Arquiteto, no
 * `N_task.md`. Tarefa escrita antes de a linha existir (as da F3) cai na contagem de guardiões com veto.
 */
export function lerPorte(conteudoTask: string): Porte {
  // Até o fim da linha: `pequeno | grande`, o texto do modelo deixado sem preencher, não declara nada.
  const declarado = /\*\*Porte:\*\*\s*`?(pequeno|grande)`?\s*$/m.exec(conteudoTask)?.[1]
  if (declarado === 'pequeno' || declarado === 'grande') return { porte: declarado, inferido: false }
  const guardioes = revisoresObrigatorios(conteudoTask).filter((revisor) => GUARDIOES.includes(revisor))
  return { porte: guardioes.length >= GUARDIOES_DE_TAREFA_GRANDE ? 'grande' : 'pequeno', inferido: true }
}

/**
 * A rodada mais recente fica no topo do `validacao.md`: vale o primeiro veredito do arquivo.
 *
 * A ressalva só conta como aceita com o registro de quem aceitou, na própria linha do veredito: "aceitas por <quem>".
 * A palavra solta não basta: "ainda não foram aceitas" e "aceitar ou corrigir fica com o Joaquim" também a têm, e ler
 * essas linhas como aceite pularia a parada que é dele.
 */
export function lerValidacao(conteudo: string): { veredito: VereditoDaValidacao; ressalvasAceitas: boolean } | null {
  const achado = /^\*\*Veredito: (APROVADA COM RESSALVAS|APROVADA|REPROVADA)\*\*(.*)$/m.exec(conteudo)
  if (!achado) return null
  const resto = achado[2] ?? ''
  const aceitas = /\baceit[ao]s?\*{0,2}\s+por\s+\S/i.test(resto) && !/\bnão\b[^.;]*\baceit/i.test(resto)
  return { veredito: achado[1] as VereditoDaValidacao, ressalvasAceitas: aceitas }
}

/** A spec está aprovada quando alguma rodada do `revisao-spec.md` fechou APROVADA: as rodadas só se acumulam. */
export function specAprovada(conteudoRevisao: string): boolean {
  return /^\*\*Veredito: APROVADA\*\*/m.test(conteudoRevisao)
}

export interface Artefatos {
  marca: Marca
  temPrd: boolean
  temTechspec: boolean
  specAprovada: boolean
  /** `null` sem `tasks.md`. */
  tarefas: Tarefa[] | null
  validacao: ReturnType<typeof lerValidacao>
  temRetro: boolean
  /** A branch da árvore; vazia com o HEAD solto. */
  branch: string
}

export function calcularFase(artefatos: Artefatos): Fase {
  if (artefatos.marca === 'concluida') {
    // Fechada no roadmap dentro da branch da spec: o que falta é o Joaquim mandar pousar. A retro vem depois, no térreo.
    if (artefatos.branch.startsWith(PREFIXO_DA_BRANCH_DE_SPEC)) return 'aguardando-pouso'
    return artefatos.temRetro ? 'concluida' : 'sem-retro'
  }
  if (!artefatos.temPrd) return 'sem-prd'
  if (!artefatos.temTechspec) return 'sem-techspec'
  // `tasks.md` em que nenhuma linha é tarefa conta como lista por gerar: lista vazia lida como "tudo feito" mandaria validar.
  if (artefatos.tarefas === null || artefatos.tarefas.length === 0) return artefatos.specAprovada ? 'sem-tarefas' : 'sem-revisao-da-spec'
  if (artefatos.tarefas.some((tarefa) => !tarefa.feita)) return 'construindo'
  if (!artefatos.validacao) return 'sem-validacao'
  if (artefatos.validacao.veredito === 'REPROVADA') return 'validacao-reprovada'
  if (artefatos.validacao.veredito === 'APROVADA COM RESSALVAS' && !artefatos.validacao.ressalvasAceitas) return 'validacao-com-ressalvas'
  return 'validada'
}

/**
 * A funcionalidade da vez: a marcada `[~]`; sem marca, a concluída que ainda espera a retrospectiva (sem isso, o
 * `/seguir` depois do pouso pularia a retro e abriria a próxima); depois a primeira pendente que já tem PRD (o trabalho
 * começou e ninguém marcou, que era o caso da F3); sem nenhuma, a primeira pendente do roadmap.
 */
export function funcionalidadeDaVez(roadmap: ItemDoRoadmap[], temPrd: (nome: string) => boolean, esperaRetro: (nome: string) => boolean = () => false): ItemDoRoadmap | null {
  return (
    roadmap.find((item) => item.marca === 'andamento') ??
    roadmap.find((item) => item.marca === 'concluida' && esperaRetro(item.nome)) ??
    roadmap.find((item) => item.marca === 'pendente' && temPrd(item.nome)) ??
    roadmap.find((item) => item.marca === 'pendente') ??
    null
  )
}

/** O que o orquestrador faz em cada fase. Em português comum: é o texto que o Joaquim lê no `/seguir`. */
export const PROXIMO_PASSO: Record<Fase, string> = {
  'sem-prd': 'o Arquiteto escreve o PRD; para nas perguntas e na aprovação do Joaquim',
  'sem-techspec': 'o Arquiteto escreve a Tech Spec; para nas perguntas e na aprovação do Joaquim',
  'sem-revisao-da-spec': 'o Arquiteto roda a revisão da spec com os guardiões; para no aceite das correções',
  'sem-tarefas': 'o Arquiteto gera as tarefas, com o porte de cada uma; para na aprovação da lista',
  construindo: 'o Implementador executa a próxima tarefa, com a Mesa de revisão',
  'sem-validacao': 'o Validador confere a funcionalidade contra o PRD',
  'validacao-reprovada': 'corrigir os achados da validação e validar de novo',
  'validacao-com-ressalvas': 'parada: o Joaquim decide entre corrigir e aceitar cada ressalva',
  validada: 'rodar a esteira na branch, fechar no roadmap e pedir o pouso ao Joaquim',
  'aguardando-pouso': 'parada: o pouso na develop é do Joaquim',
  'sem-retro': 'o Arquiteto roda a retrospectiva no térreo e apresenta as propostas ao Joaquim',
  concluida: 'nada a fazer nesta funcionalidade',
}

export interface TarefaDaVez extends Tarefa, Porte {
  documento: string
  obrigatorios: string[]
  /** A última rodada de cada revisor já registrada no documento: tarefa retomada continua daqui. */
  rodadas: Revisao[]
}

export interface Estado {
  funcionalidade: ItemDoRoadmap | null
  fase: Fase | null
  proximoPasso: string
  branch: string
  feitas: number
  total: number
  tarefa: TarefaDaVez | null
  bloqueadas: { numero: number; falta: number[] }[]
  /**
   * Arquivos de código alterados na árvore, pela mesma conta do hook: fora `tasks/`, `.processo/` e o `.md` que nenhuma
   * suíte lê. Com tarefa em curso, é o trabalho dela; o `estado.md` e o `ROADMAP.md`, que o Orquestrador edita, não contam.
   */
  alteradosNaArvore: number
  /** O que está incoerente nos arquivos e o Orquestrador não deve atravessar calado. */
  avisos: string[]
}

/** As incoerências entre a lista, as dependências, o roadmap e os documentos de tarefa. */
export function avisosDaLista(entrada: { marca: Marca; tarefas: Tarefa[]; dependencias: Map<number, number[]>; proxima: Tarefa | null; temDocumento: boolean }): string[] {
  const avisos: string[] = []
  const numeros = new Set(entrada.tarefas.map((tarefa) => tarefa.numero))
  for (const [tarefa, depende] of entrada.dependencias) {
    const inexistentes = depende.filter((numero) => !numeros.has(numero))
    if (numeros.has(tarefa) && inexistentes.length > 0) {
      avisos.push(`a ${tarefa}.0 depende de ${inexistentes.map((numero) => `${numero}.0`).join(', ')}, que não está na lista: ela nunca será liberada`)
    }
  }
  if (entrada.marca === 'concluida' && entrada.tarefas.some((tarefa) => !tarefa.feita)) {
    avisos.push('a funcionalidade está fechada no ROADMAP.md, mas o tasks.md tem tarefa pendente')
  }
  if (entrada.marca !== 'concluida' && entrada.proxima && !entrada.temDocumento) {
    avisos.push(`a ${entrada.proxima.numero}.0 está liberada, mas o documento ${entrada.proxima.numero}_task.md não existe`)
  }
  return avisos
}

function ler(caminho: string): string | null {
  return existsSync(caminho) ? readFileSync(caminho, 'utf8') : null
}

/** A branch em que a árvore está; vazia com o HEAD solto ou fora de um repositório. */
function branchAtual(raiz: string): string {
  try {
    return execFileSync('git', ['symbolic-ref', '--short', '-q', 'HEAD'], { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

function contarAlterados(raiz: string): number {
  try {
    return arquivosAlterados(raiz)
      .filter((arquivo) => !arquivo.startsWith('.processo/') && !arquivo.startsWith('tasks/'))
      .filter((arquivo) => !arquivo.endsWith('.md') || arquivo === DOCUMENTO_QUE_UMA_SUITE_LE).length
  } catch {
    return 0
  }
}

export function ultimaRodadaDeCadaRevisor(rodadas: Revisao[]): Revisao[] {
  return [...new Map(rodadas.map((rodada) => [rodada.revisor, rodada])).values()]
}

export function lerEstado(raiz: string, nome?: string): Estado {
  const roadmap = lerRoadmap(ler(join(raiz, 'ROADMAP.md')) ?? '')
  const pasta = (funcionalidade: string) => join(raiz, 'tasks', `prd-${funcionalidade}`)
  const funcionalidade = nome
    ? (roadmap.find((item) => item.nome === nome || item.id.toLowerCase() === nome.toLowerCase()) ?? null)
    : funcionalidadeDaVez(
        roadmap,
        (candidata) => existsSync(join(pasta(candidata), 'prd.md')),
        // Só as specs do processo novo têm `estado.md`: as antigas sem `retro.md` (o F0) não voltam à fila por isso.
        (candidata) => existsSync(join(pasta(candidata), 'estado.md')) && !existsSync(join(pasta(candidata), 'retro.md')),
      )
  const branch = branchAtual(raiz)
  const vazio = { branch, feitas: 0, total: 0, tarefa: null, bloqueadas: [], alteradosNaArvore: contarAlterados(raiz), avisos: [] }
  if (!funcionalidade) {
    return { ...vazio, funcionalidade: null, fase: null, proximoPasso: nome ? `"${nome}" não está no ROADMAP.md` : 'nenhuma funcionalidade pendente no ROADMAP.md' }
  }
  const dir = pasta(funcionalidade.nome)
  const conteudoTasks = ler(join(dir, 'tasks.md'))
  const tarefas = conteudoTasks === null ? null : lerTarefas(conteudoTasks)
  const fase = calcularFase({
    marca: funcionalidade.marca,
    temPrd: existsSync(join(dir, 'prd.md')),
    temTechspec: existsSync(join(dir, 'techspec.md')),
    specAprovada: specAprovada(ler(join(dir, 'revisao-spec.md')) ?? ''),
    tarefas,
    validacao: lerValidacao(ler(join(dir, 'validacao.md')) ?? ''),
    temRetro: existsSync(join(dir, 'retro.md')),
    branch,
  })
  const dependencias = lerDependencias(conteudoTasks ?? '')
  const escolha = escolherTarefa(tarefas ?? [], dependencias)
  const documento = escolha.proxima ? join('tasks', `prd-${funcionalidade.nome}`, `${escolha.proxima.numero}_task.md`) : null
  const conteudoTask = documento ? ler(join(raiz, documento)) : null
  return {
    ...vazio,
    funcionalidade,
    fase,
    proximoPasso: PROXIMO_PASSO[fase],
    feitas: (tarefas ?? []).filter((tarefa) => tarefa.feita).length,
    total: (tarefas ?? []).length,
    tarefa:
      fase === 'construindo' && escolha.proxima && documento && conteudoTask !== null
        ? {
            ...escolha.proxima,
            ...lerPorte(conteudoTask),
            documento,
            obrigatorios: revisoresObrigatorios(conteudoTask),
            rodadas: ultimaRodadaDeCadaRevisor(lerRevisoes(conteudoTask)),
          }
        : null,
    bloqueadas: escolha.bloqueadas.map(({ tarefa, falta }) => ({ numero: tarefa.numero, falta })),
    avisos: avisosDaLista({ marca: funcionalidade.marca, tarefas: tarefas ?? [], dependencias, proxima: escolha.proxima, temDocumento: conteudoTask !== null }),
  }
}

export function relatorio(estado: Estado): string {
  if (!estado.funcionalidade || !estado.fase) return `Turmma — ${estado.proximoPasso}`
  const linhas = [
    `Turmma — estado na branch ${estado.branch || '(HEAD solto)'}`,
    `Funcionalidade: ${estado.funcionalidade.id} ${estado.funcionalidade.nome}`,
    `Fase: ${estado.fase}${estado.total > 0 ? ` (${estado.feitas} de ${estado.total} tarefas)` : ''}`,
  ]
  if (estado.tarefa) {
    const { tarefa } = estado
    linhas.push(`Próxima tarefa: ${tarefa.numero}.0 — ${tarefa.titulo}`)
    linhas.push(`  documento: ${tarefa.documento}`)
    linhas.push(`  porte: ${tarefa.porte}${tarefa.inferido ? ' (inferido dos guardiões; falta a linha **Porte:**)' : ''}`)
    linhas.push(`  revisores: ${tarefa.obrigatorios.join(', ')}`)
    if (tarefa.rodadas.length > 0) {
      linhas.push(`  rodadas já registradas: ${tarefa.rodadas.map((rodada) => `${rodada.revisor} ${rodada.veredito} (${rodada.rodada}ª)`).join(', ')}`)
    }
  } else if (estado.fase === 'construindo' && estado.bloqueadas.length > 0 && estado.avisos.every((aviso) => !aviso.includes('está liberada'))) {
    linhas.push(`Nenhuma tarefa liberada: ${estado.bloqueadas.map(({ numero, falta }) => `${numero}.0 espera ${falta.map((n) => `${n}.0`).join(', ')}`).join('; ')}`)
  }
  for (const aviso of estado.avisos) linhas.push(`ATENÇÃO: ${aviso}`)
  linhas.push(`Arquivos de código alterados na árvore: ${estado.alteradosNaArvore}`)
  linhas.push(`Próximo passo: ${estado.proximoPasso}`)
  return linhas.join('\n')
}

/** As linhas do hook de início de sessão: curtas, porque viram contexto de toda sessão. */
export function resumo(raiz: string): string {
  const roadmap = lerRoadmap(ler(join(raiz, 'ROADMAP.md')) ?? '')
  const estado = lerEstado(raiz)
  const concluidas = roadmap.filter((item) => item.marca === 'concluida').map((item) => item.id)
  const linhas = ['Turmma — contexto da sessão', `Concluídas: ${concluidas.join(' ') || 'nenhuma'}`]
  if (estado.funcionalidade && estado.fase) {
    const tarefas = estado.total > 0 ? `, ${estado.feitas} de ${estado.total} tarefas` : ''
    const proxima = estado.tarefa ? `; próxima: ${estado.tarefa.numero}.0` : ''
    linhas.push(`Da vez: ${estado.funcionalidade.id} ${estado.funcionalidade.nome} — ${estado.fase}${tarefas}${proxima}`)
    linhas.push(`Próximo passo: ${estado.proximoPasso} (quem conduz é o Orquestrador, com /seguir ${estado.funcionalidade.nome})`)
  }
  const abertas = /\n## Decisões em aberto\n([\s\S]*?)(?=\n## |$)/.exec(ler(join(raiz, 'CLAUDE.md')) ?? '')?.[1] ?? ''
  const quantas = abertas.split('\n').filter((linha) => linha.startsWith('| ') && !linha.startsWith('| Decisão')).length
  if (quantas > 0) linhas.push(`Decisões em aberto no CLAUDE.md: ${quantas}`)
  return linhas.join('\n')
}

if (import.meta.filename === process.argv[1]) {
  const raiz = process.env['CLAUDE_PROJECT_DIR'] ?? process.cwd()
  const argumentos = process.argv.slice(2)
  const nome = argumentos.find((argumento) => !argumento.startsWith('--'))
  if (argumentos.includes('--resumo')) process.stdout.write(`${resumo(raiz)}\n`)
  else if (argumentos.includes('--json')) process.stdout.write(`${JSON.stringify(lerEstado(raiz, nome), null, 2)}\n`)
  else process.stdout.write(`${relatorio(lerEstado(raiz, nome))}\n`)
}
