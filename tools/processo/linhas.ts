// Linhas: tarefas da mesma spec correndo ao mesmo tempo (D79, revista em 11/10/2026).
//
//   node tools/processo/linhas.ts                          o quadro: quem faz o quê, o que está livre e o que parte agora
//   node tools/processo/linhas.ts abrir <n> <checkout>     registra a linha n, no checkout do andar dela
//   node tools/processo/linhas.ts partida <n> <N>          leva a linha à ponta da spec e anota a tarefa N nela
//   node tools/processo/linhas.ts partida <n> correcao:<slug>
//   node tools/processo/linhas.ts encontro <n>             traz a spec para a linha, avança a spec e faz o push
//   node tools/processo/linhas.ts fechar                   confere que tudo se encontrou e desfaz o quadro
//   node tools/processo/linhas.ts conferir [--em-curso]    no andar de uma correção avulsa: marca, revisões, árvore e push
//
// Roda sempre no andar da spec, que é onde as linhas se encontram. Uma linha é um andar com a branch
// `spec/<func>--l<n>`, o ambiente de teste `n` (`tools/ci/compose.ts`) e um par de terminais (`Implementador n` e
// `Mesa n`). O que cada linha faz fica em `.processo/linhas.json`, e não no `estado.md`: o Orquestrador limpa o
// contexto a cada tarefa, as tarefas fecham intercaladas, e o que corre junto é conta, não memória.
//
// Existe porque uma spec de 16 tarefas levou 55 horas com uma tarefa por vez (F3), e o Joaquim pediu que as tarefas
// que não se tocam corram juntas, quantas a máquina aguentar.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { lerDependencias, lerParalelismo, lerTarefas, PREFIXO_DA_BRANCH_DE_SPEC } from './estado.ts'

/**
 * Quantas linhas cabem na máquina: uma por ambiente de teste que não é o 0, o do térreo e da esteira
 * (`ULTIMO_AMBIENTE_DE_TESTE`, em `tools/ci/compose.ts`; o teste confere que os dois andam juntos). Não é importado
 * de lá porque aquele módulo decide o ambiente e grava arquivo ao ser carregado.
 */
export const MAXIMO_DE_LINHAS = 3
export const CAMINHO_DO_QUADRO = '.processo/linhas.json'
const SUFIXO_DA_LINHA = '--l'

export function branchDaLinha(spec: string, numero: number): string {
  return `${spec}${SUFIXO_DA_LINHA}${String(numero)}`
}

export interface TarefaDoPlano {
  numero: number
  titulo: string
  feita: boolean
  dependeDe: number[]
  /** O que o Arquiteto autorizou, já nos dois sentidos. */
  paralelaCom: number[]
  /** Os caminhos de "Arquivos previstos" do documento. Sem nenhum, a tarefa não corre em paralelo. */
  arquivos: string[]
}

/**
 * Os caminhos da tabela "Arquivos previstos" de um `N_task.md`. Só o que é caminho: `apps/web/src/x.tsx`, entre
 * crases ou solto. "A casca do aluno" não diz que arquivo é, e por isso não prova que duas tarefas não se tocam.
 */
export function lerArquivosPrevistos(conteudoTask: string): string[] {
  const inicio = conteudoTask.indexOf('\n## Arquivos previstos')
  if (inicio === -1) return []
  const fim = conteudoTask.indexOf('\n## ', inicio + 1)
  const caminhos = new Set<string>()
  for (const linha of conteudoTask.slice(inicio, fim === -1 ? undefined : fim).split('\n')) {
    if (!linha.startsWith('|')) continue
    const celula = linha.split('|')[1] ?? ''
    const entreCrases = [...celula.matchAll(/`([^`]+)`/g)].map((achado) => achado[1] ?? '')
    for (const candidato of entreCrases.length > 0 ? entreCrases : [celula.trim()]) {
      if (/^[\w.@-]+(\/[\w.@*[\]-]+)+\/?$/.test(candidato)) caminhos.add(candidato)
    }
  }
  return [...caminhos]
}

/** Migration, schema e contrato compartilhado: o diário de migrations e os índices conflitam sempre. */
const TRONCO = [/(^|\/)drizzle\//, /\/db\/schema(\/|\.ts$)/, /^packages\/shared\//]

export function ehDoTronco(arquivo: string): boolean {
  return TRONCO.some((padrao) => padrao.test(arquivo))
}

/** `apps/web/src/areas/x/` cobre o que está dentro dela; `**` e `*` no fim valem a pasta. */
function comoPrefixo(caminho: string): string {
  return caminho.replace(/\/?\*+.*$/, '/')
}

export function seSobrepoem(um: string, outro: string): boolean {
  const [a, b] = [comoPrefixo(um), comoPrefixo(outro)]
  return a === b || (a.endsWith('/') && b.startsWith(a)) || (b.endsWith('/') && a.startsWith(b))
}

/** Por que duas tarefas não correm juntas; `null` quando correm. */
export function porQueNaoJuntas(uma: TarefaDoPlano, outra: TarefaDoPlano): string | null {
  const [a, b] = [`${String(uma.numero)}.0`, `${String(outra.numero)}.0`]
  if (!uma.paralelaCom.includes(outra.numero) && !outra.paralelaCom.includes(uma.numero)) return `o tasks.md não autoriza a ${a} em paralelo com a ${b}`
  for (const tarefa of [uma, outra]) {
    if (tarefa.arquivos.length === 0) return `a ${String(tarefa.numero)}.0 não declara caminho em "Arquivos previstos"`
  }
  for (const arquivo of uma.arquivos) {
    const comum = outra.arquivos.find((candidato) => seSobrepoem(arquivo, candidato))
    if (comum !== undefined) return `a ${a} e a ${b} preveem ${arquivo.length <= comum.length ? arquivo : comum}`
  }
  if (uma.arquivos.some(ehDoTronco) && outra.arquivos.some(ehDoTronco)) {
    return `a ${a} e a ${b} mexem em migration, schema ou contrato compartilhado`
  }
  return null
}

export interface Pendentes {
  /** Pendentes com as dependências concluídas e que correm junto com tudo o que está em curso. */
  livres: TarefaDoPlano[]
  presas: { numero: number; motivo: string }[]
}

export function situacaoDasPendentes(plano: readonly TarefaDoPlano[], emCurso: readonly number[]): Pendentes {
  const feitas = new Set(plano.filter((tarefa) => tarefa.feita).map((tarefa) => tarefa.numero))
  const correndo = plano.filter((tarefa) => emCurso.includes(tarefa.numero))
  const pendentes: Pendentes = { livres: [], presas: [] }
  for (const tarefa of plano) {
    if (tarefa.feita || emCurso.includes(tarefa.numero)) continue
    const falta = tarefa.dependeDe.filter((numero) => !feitas.has(numero))
    const motivo =
      falta.length > 0
        ? `espera ${falta.map((numero) => `${String(numero)}.0`).join(', ')}`
        : correndo.map((outra) => porQueNaoJuntas(tarefa, outra)).find((achado) => achado !== null)
    if (motivo === undefined || motivo === null) pendentes.livres.push(tarefa)
    else pendentes.presas.push({ numero: tarefa.numero, motivo })
  }
  return pendentes
}

export interface Distribuicao {
  partidas: { linha: number; tarefa: number }[]
  /** Livres que correm junto com as que partem, mas não têm linha ociosa: é o que pede abrir mais uma. */
  semLinha: number[]
}

/** Quem parte agora, na ordem da lista: cada escolhida corre junto com as em curso e com as já escolhidas. */
export function distribuir(plano: readonly TarefaDoPlano[], emCurso: readonly number[], ociosas: readonly number[]): Distribuicao {
  const distribuicao: Distribuicao = { partidas: [], semLinha: [] }
  const filaDeLinhas = [...ociosas].sort((a, b) => a - b)
  const escolhidas: TarefaDoPlano[] = []
  for (const tarefa of situacaoDasPendentes(plano, emCurso).livres) {
    if (escolhidas.some((outra) => porQueNaoJuntas(tarefa, outra) !== null)) continue
    escolhidas.push(tarefa)
    const linha = filaDeLinhas.shift()
    if (linha === undefined) distribuicao.semLinha.push(tarefa.numero)
    else distribuicao.partidas.push({ linha, tarefa: tarefa.numero })
  }
  return distribuicao
}

/**
 * O `tasks.md` com a tarefa e as subtarefas dela marcadas. É o que o encontro escreve quando o único conflito é o
 * próprio `tasks.md`: duas linhas marcaram tarefas vizinhas, e a resposta é sempre a mesma, a lista da spec com a
 * tarefa desta linha concluída.
 */
export function marcarTarefaFeita(conteudoTasks: string, numero: number): string {
  const n = String(numero)
  return conteudoTasks
    .replace(new RegExp(`^- \\[ \\] (\\*\\*${n}\\.0 — )`, 'm'), '- [x] $1')
    .replace(new RegExp(`^(\\s+)- \\[ \\] (${n}\\.\\d+\\b)`, 'gm'), '$1- [x] $2')
}

export interface Linha {
  numero: number
  checkout: string
  tarefa: number | null
  correcao: string | null
  /** Quando a linha partiu, em ISO: é o que a vigia compara com o porte da tarefa. */
  desde: string | null
}

export interface Quadro {
  spec: string
  linhas: Linha[]
}

export function lerQuadro(raiz: string): Quadro | null {
  const caminho = join(raiz, CAMINHO_DO_QUADRO)
  return existsSync(caminho) ? (JSON.parse(readFileSync(caminho, 'utf8')) as Quadro) : null
}

function gravarQuadro(raiz: string, quadro: Quadro): void {
  const caminho = join(raiz, CAMINHO_DO_QUADRO)
  mkdirSync(dirname(caminho), { recursive: true })
  writeFileSync(caminho, `${JSON.stringify({ ...quadro, linhas: [...quadro.linhas].sort((a, b) => a.numero - b.numero) }, null, 2)}\n`)
}

export function lerPlano(raiz: string, funcionalidade: string): TarefaDoPlano[] {
  const pasta = join(raiz, 'tasks', `prd-${funcionalidade}`)
  const caminho = join(pasta, 'tasks.md')
  if (!existsSync(caminho)) return []
  const conteudo = readFileSync(caminho, 'utf8')
  const dependencias = lerDependencias(conteudo)
  const declarado = lerParalelismo(conteudo)
  const paralelas = (numero: number) =>
    new Set([...(declarado.get(numero) ?? []), ...[...declarado].filter(([, outras]) => outras.includes(numero)).map(([outra]) => outra)])
  return lerTarefas(conteudo).map((tarefa) => {
    const documento = join(pasta, `${String(tarefa.numero)}_task.md`)
    return {
      ...tarefa,
      dependeDe: dependencias.get(tarefa.numero) ?? [],
      paralelaCom: [...paralelas(tarefa.numero)].filter((outra) => outra !== tarefa.numero),
      arquivos: existsSync(documento) ? lerArquivosPrevistos(readFileSync(documento, 'utf8')) : [],
    }
  })
}

function git(raiz: string, ...argumentos: string[]): string {
  // Só o fim: a primeira coluna do `git status --porcelain` é um espaço que diz alguma coisa.
  return execFileSync('git', argumentos, { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trimEnd()
}

function tenta(raiz: string, ...argumentos: string[]): { ok: boolean; saida: string } {
  try {
    return { ok: true, saida: git(raiz, ...argumentos) }
  } catch (erro) {
    const { stdout, stderr } = erro as { stdout?: string; stderr?: string }
    return { ok: false, saida: `${stdout ?? ''}${stderr ?? ''}`.trim() }
  }
}

const sujeira = (raiz: string) => git(raiz, 'status', '--porcelain').split('\n').filter((linha) => linha !== '')
const branchDe = (raiz: string) => tenta(raiz, 'symbolic-ref', '--short', '-q', 'HEAD').saida

export interface Resultado {
  /** 0 feito; 1 recusado, nada mudou; 3 feito, mas o push falhou; 4 conflito no encontro, nada mudou. */
  codigo: number
  texto: string
}

const recusa = (texto: string): Resultado => ({ codigo: 1, texto: `RECUSADO: ${texto}` })

interface Contexto {
  spec: string
  funcionalidade: string
  quadro: Quadro
}

/** O andar da spec e o quadro dele. Texto, quando o comando não roda no andar da spec. */
function contextoDe(raiz: string): Contexto | string {
  const spec = branchDe(raiz)
  if (!spec.startsWith(PREFIXO_DA_BRANCH_DE_SPEC) || spec.includes(SUFIXO_DA_LINHA)) {
    return `este comando roda no andar da spec, na branch ${PREFIXO_DA_BRANCH_DE_SPEC}<funcionalidade>; aqui a branch é "${spec || 'HEAD solto'}"`
  }
  const quadro = lerQuadro(raiz)
  if (quadro && quadro.spec !== spec) return `o quadro em ${CAMINHO_DO_QUADRO} é de ${quadro.spec}, e este andar é de ${spec}`
  return { spec, funcionalidade: spec.slice(PREFIXO_DA_BRANCH_DE_SPEC.length), quadro: quadro ?? { spec, linhas: [] } }
}

const emCursoNo = (quadro: Quadro) => quadro.linhas.flatMap((linha) => (linha.tarefa === null ? [] : [linha.tarefa]))
const ocupada = (linha: Linha) => linha.tarefa !== null || linha.correcao !== null
/** A linha 1 usa o par que o térreo sempre teve; as outras, um par com o número dela. */
export const terminaisDa = (numero: number) => (numero === 1 ? 'Implementador e Mesa' : `Implementador ${String(numero)} e Mesa ${String(numero)}`)
const oQueFaz = (linha: Linha) => (linha.tarefa !== null ? `tarefa ${String(linha.tarefa)}.0` : linha.correcao !== null ? `correção ${linha.correcao}` : 'ociosa')

export interface Opcoes {
  /** `npm ci` no checkout da linha, ao abrir. Desligado só no teste. */
  instalar?: boolean
  /** O push da branch da spec no encontro, e o da remoção das branches de linha ao fechar. Desligado só no teste. */
  push?: boolean
  agora?: Date
}

export function abrir(raiz: string, numero: number, checkoutDado: string, opcoes: Opcoes = {}): Resultado {
  const contexto = contextoDe(raiz)
  if (typeof contexto === 'string') return recusa(contexto)
  const { spec, quadro } = contexto
  if (!Number.isInteger(numero) || numero < 1 || numero > MAXIMO_DE_LINHAS) return recusa(`a linha é um inteiro de 1 a ${String(MAXIMO_DE_LINHAS)}`)
  const checkout = resolve(raiz, checkoutDado)
  const branch = branchDaLinha(spec, numero)
  if (!existsSync(checkout)) return recusa(`${checkout} não existe. Crie o andar da linha: git -C ${raiz} branch ${branch} ${spec} && maestri floor create "<andar> L${String(numero)}" --branch ${branch} --existing-branch`)
  if (branchDe(checkout) !== branch) return recusa(`${checkout} está na branch "${branchDe(checkout)}", e a linha ${String(numero)} é a ${branch}`)
  const comum = (pasta: string) => tenta(pasta, 'rev-parse', '--path-format=absolute', '--git-common-dir').saida
  if (comum(checkout) !== comum(raiz)) return recusa(`${checkout} não é um checkout deste repositório`)
  if (quadro.linhas.some((linha) => linha.numero === numero && ocupada(linha))) return recusa(`a linha ${String(numero)} está no meio de um trabalho`)
  if (sujeira(checkout).length > 0) return recusa(`${checkout} tem alteração na árvore:\n${sujeira(checkout).join('\n')}`)
  const ponta = tenta(checkout, 'merge', '--ff-only', spec)
  if (!ponta.ok) return recusa(`a branch ${branch} tem commit que a ${spec} não tem:\n${ponta.saida}`)
  // O Maestri copia o que o git ignora do andar de onde a linha nasceu: o carimbo e o quadro de lá não valem aqui.
  mkdirSync(join(checkout, '.processo'), { recursive: true })
  for (const copiado of ['portao.json', 'conteudo.json', 'linhas.json']) rmSync(join(checkout, '.processo', copiado), { force: true })
  writeFileSync(join(checkout, '.processo', 'ambiente'), `${String(numero)}\n`)
  if (opcoes.instalar ?? true) execFileSync('npm', ['ci'], { cwd: checkout, stdio: ['ignore', 'ignore', 'inherit'] })
  gravarQuadro(raiz, { spec, linhas: [...quadro.linhas.filter((linha) => linha.numero !== numero), { numero, checkout, tarefa: null, correcao: null, desde: null }] })
  return { codigo: 0, texto: `Linha ${String(numero)} aberta em ${checkout}, na ${branch}, com o ambiente de teste ${String(numero)}. Terminais: ${terminaisDa(numero)}.` }
}

export function partida(raiz: string, numero: number, alvo: string, opcoes: Opcoes = {}): Resultado {
  const contexto = contextoDe(raiz)
  if (typeof contexto === 'string') return recusa(contexto)
  const { spec, funcionalidade, quadro } = contexto
  const linha = quadro.linhas.find((candidata) => candidata.numero === numero)
  if (!linha) return recusa(`a linha ${String(numero)} não está aberta (linhas.ts abrir)`)
  if (ocupada(linha)) return recusa(`a linha ${String(numero)} está com a ${oQueFaz(linha)}; o encontro dela vem antes`)
  const correcao = /^correcao:([a-z0-9-]+)$/.exec(alvo)?.[1] ?? null
  const tarefa = correcao === null && /^\d+(\.0)?$/.test(alvo) ? Number.parseInt(alvo, 10) : null
  if (correcao === null && tarefa === null) return recusa(`"${alvo}" não é tarefa (5 ou 5.0) nem correção (correcao:<slug>)`)
  let titulo = ''
  if (tarefa !== null) {
    const plano = lerPlano(raiz, funcionalidade)
    const doPlano = plano.find((candidata) => candidata.numero === tarefa)
    if (!doPlano) return recusa(`a ${String(tarefa)}.0 não está no tasks.md`)
    if (doPlano.feita) return recusa(`a ${String(tarefa)}.0 já está concluída`)
    if (emCursoNo(quadro).includes(tarefa)) return recusa(`a ${String(tarefa)}.0 já corre em outra linha`)
    const presa = situacaoDasPendentes(plano, emCursoNo(quadro)).presas.find((candidata) => candidata.numero === tarefa)
    if (presa) return recusa(`a ${String(tarefa)}.0 não parte agora: ${presa.motivo}`)
    titulo = doPlano.titulo
  }
  if (sujeira(linha.checkout).length > 0) return recusa(`${linha.checkout} tem alteração na árvore:\n${sujeira(linha.checkout).join('\n')}`)
  const ponta = tenta(linha.checkout, 'merge', '--ff-only', spec)
  if (!ponta.ok) return recusa(`a linha ${String(numero)} tem commit que a ${spec} não tem: falta o encontro dela.\n${ponta.saida}`)
  const desde = (opcoes.agora ?? new Date()).toISOString()
  gravarQuadro(raiz, { spec, linhas: quadro.linhas.map((outra) => (outra.numero === numero ? { ...outra, tarefa, correcao, desde } : outra)) })
  const oQue = tarefa !== null ? `tarefa ${String(tarefa)}.0 — ${titulo}\n  documento: tasks/prd-${funcionalidade}/${String(tarefa)}_task.md` : `correção ${correcao ?? ''}`
  return { codigo: 0, texto: `Linha ${String(numero)}: ${oQue}\n  checkout: ${linha.checkout}\n  terminais: ${terminaisDa(numero)}` }
}

const MARCA_DE_CORRECAO = /\(correção [a-z0-9-]+\)/
const MARCA_DE_TAREFA = /\(tarefa \d+\.0\)/
const soDocumento = (arquivos: string[]) => arquivos.every((arquivo) => arquivo.startsWith('tasks/') || arquivo.endsWith('.md'))

/**
 * Os arquivos que um commit traz. Na correção avulsa, o diff contra o primeiro pai, como sempre. Na spec e na linha, o
 * que o commit mesmo fez: num commit comum dá o mesmo; num merge, `--remerge-diff` compara o que ele gravou com o que o
 * git juntaria sozinho, e sobra só a resolução de conflito, inclusive a que ficou com um lado só. O merge limpo não traz
 * nada: o código que ele trouxe está nos commits do outro lado, e cada um deles está no intervalo e se confere sozinho.
 * Na linha, é o merge de outra linha que o Orquestrador manda fazer quando uma tarefa precisa do que a outra entregou
 * (R61).
 */
function arquivosDoCommit(checkout: string, sha: string, peloQueResolveu: boolean): string[] {
  const saida = peloQueResolveu
    ? git(checkout, 'show', '--remerge-diff', '--format=', '--name-only', sha)
    : git(checkout, 'diff', '--name-only', `${sha}^1`, sha)
  return saida.split('\n').filter((arquivo) => arquivo !== '')
}

/**
 * O que os commits que a `base` não tem precisam ter para entrar nela: todo commit que leva código com a marca de
 * tarefa ou de correção no título e a linha `Revisões:` no corpo, e, numa tarefa, o commit dela entre eles. Vale para
 * mais de um commit: a correção no meio da tarefa, e o merge que conserta um conflito de encontro. `null` quando tudo
 * confere. O hook já barrou cada um ao nascer; isto barra o que chegou à linha sem passar por ele.
 *
 * `naSpec`: a conferência de uma correção feita na branch da spec. Contra a `develop`, ali estão também os commits das
 * tarefas já feitas, que o encontro de cada linha conferiu: a marca `(tarefa N.0)` de qualquer uma vale (e a linha
 * `Revisões:` continua cobrada), o merge do encontro só é cobrado pelo que ele mesmo resolveu, e o último commit com código
 * tem de ser o da correção, que é o que se confere.
 *
 * `naLinha`: a conferência do encontro. O merge que traz outra linha só é cobrado pelo que ele mesmo resolveu, como o da
 * spec; a marca continua a da tarefa ou a de correção, e só elas.
 */
export function conferirEntrega(checkout: string, base: string, tarefa: number | null, opcoes: { naSpec?: boolean; naLinha?: boolean } = {}): string | null {
  const naSpec = opcoes.naSpec ?? false
  const peloQueResolveu = naSpec || (opcoes.naLinha ?? false)
  const novos = git(checkout, 'rev-list', '--reverse', `${base}..HEAD`).split('\n').filter((sha) => sha !== '')
  if (novos.length === 0) return 'nenhum commit novo'
  const marcaDaTarefa = tarefa === null ? null : `(tarefa ${String(tarefa)}.0)`
  let temADaTarefa = false
  let temMarca = false
  let ultimoCorrige = false
  for (const sha of novos) {
    const [titulo = '', ...corpo] = git(checkout, 'log', '-1', '--format=%B', sha).split('\n')
    const curto = sha.slice(0, 7)
    const daTarefa = marcaDaTarefa !== null && titulo.includes(marcaDaTarefa)
    const corrige = MARCA_DE_CORRECAO.test(titulo)
    const marcado = daTarefa || corrige || (naSpec && MARCA_DE_TAREFA.test(titulo))
    temADaTarefa ||= daTarefa
    temMarca ||= marcado
    if (soDocumento(arquivosDoCommit(checkout, sha, peloQueResolveu))) continue
    if (!marcado) return `o commit ${curto} leva código sem ${marcaDaTarefa ?? (naSpec ? '(tarefa N.0) nem (correção <slug>)' : '(correção <slug>)')} no título: "${titulo}"`
    if (!corpo.some((linha) => linha.startsWith('Revisões: '))) return `o commit ${curto} não tem a linha "Revisões:"`
    ultimoCorrige = corrige
  }
  if (marcaDaTarefa !== null && !temADaTarefa) return `falta o commit com ${marcaDaTarefa} no título`
  if (naSpec ? !ultimoCorrige : !temMarca) return `falta o commit com (correção <slug>) no título${naSpec ? ', e ele tem de ser o último com código' : ''}`
  return null
}

/**
 * A conferência de um checkout que não é linha: a correção avulsa, no andar dela, ou a correção feita na branch da spec.
 * O mesmo que o encontro confere, contra a branch do GitHub: os commits que a `develop` não tem, a árvore limpa e o push
 * feito.
 */
export function conferir(raiz: string, opcoes: { emCurso?: boolean } = {}): Resultado {
  const branch = branchDe(raiz)
  const entrega = conferirEntrega(raiz, 'develop', null, { naSpec: branch.startsWith(PREFIXO_DA_BRANCH_DE_SPEC) })
  if (entrega !== null) return recusa(entrega)
  const alterados = sujeira(raiz)
  if (alterados.length > 0 && !(opcoes.emCurso ?? false)) return recusa(`a árvore não está limpa: o commit não levou tudo.\n${alterados.join('\n')}`)
  const porEnviar = tenta(raiz, 'rev-list', '--count', `origin/${branch}..HEAD`)
  if (!porEnviar.ok || porEnviar.saida !== '0') return recusa(`o push não foi feito: a ${branch} do GitHub não tem o último commit`)
  return { codigo: 0, texto: `Conferido em ${branch}: marca e revisões em todo commit com código, ${alterados.length === 0 ? 'árvore limpa' : `árvore com ${String(alterados.length)} arquivo(s) da tarefa em curso`} e push feito.` }
}

export function encontro(raiz: string, numero: number, opcoes: Opcoes = {}): Resultado {
  const contexto = contextoDe(raiz)
  if (typeof contexto === 'string') return recusa(contexto)
  const { spec, funcionalidade, quadro } = contexto
  const linha = quadro.linhas.find((candidata) => candidata.numero === numero)
  if (!linha || !ocupada(linha)) return recusa(`a linha ${String(numero)} não tem trabalho em curso`)
  const { checkout } = linha
  const branch = branchDaLinha(spec, numero)
  if (branchDe(checkout) !== branch) return recusa(`${checkout} está na branch "${branchDe(checkout)}", e não na ${branch}`)
  if (sujeira(checkout).length > 0) return recusa(`a árvore da linha ${String(numero)} não está limpa: o commit não levou tudo.\n${sujeira(checkout).join('\n')}`)
  const entrega = conferirEntrega(checkout, spec, linha.tarefa, { naLinha: true })
  if (entrega !== null) return recusa(`linha ${String(numero)}, ${oQueFaz(linha)}: ${entrega}`)
  const diario = `tasks/prd-${funcionalidade}/estado.md`
  // Documento a meio no andar da spec (o Arquiteto aplicando uma decisão) não impede o encontro; código, sim.
  const codigoNoAndar = sujeira(raiz).filter((item) => !soDocumento([item.slice(3)]))
  if (codigoNoAndar.length > 0) return recusa(`o andar da spec tem código alterado, e nele ninguém implementa:\n${codigoNoAndar.join('\n')}`)
  const commit = git(checkout, 'rev-parse', '--short', 'HEAD')

  const juncao = tenta(checkout, 'merge', '--no-edit', spec)
  if (!juncao.ok) {
    const emConflito = git(checkout, 'diff', '--name-only', '--diff-filter=U').split('\n').filter((arquivo) => arquivo !== '')
    const lista = `tasks/prd-${funcionalidade}/tasks.md`
    if (linha.tarefa !== null && emConflito.length === 1 && emConflito[0] === lista) {
      writeFileSync(join(checkout, lista), marcarTarefaFeita(git(checkout, 'show', `:3:${lista}`) + '\n', linha.tarefa))
      git(checkout, 'add', lista)
      git(checkout, 'commit', '--no-edit')
    } else {
      tenta(checkout, 'merge', '--abort')
      if (emConflito.length === 0) return recusa(`o merge da ${spec} na linha ${String(numero)} falhou sem conflito:\n${juncao.saida}`)
      return {
        codigo: 4,
        texto: [
          `CONFLITO no encontro da linha ${String(numero)} (${oQueFaz(linha)}): ${emConflito.join(', ')}`,
          `Nada mudou. É correção na própria linha, com o slug encontro-${String(linha.tarefa ?? linha.correcao)}: o Implementador ${String(numero)} roda \`git merge ${spec}\`, resolve,`,
          'passa o portão e a Mesa, e fecha o merge com o commit da correção. Depois, este comando de novo.',
        ].join('\n'),
      }
    }
  }
  const avanco = tenta(raiz, 'merge', '--ff-only', branch)
  if (!avanco.ok) return recusa(`a ${spec} não avança até a ${branch}:\n${avanco.saida}`)
  if (sujeira(raiz).some((item) => item.slice(3) === diario)) {
    // Só o diário, pelo caminho: o que mais estiver a meio no andar continua como está.
    git(raiz, 'add', diario)
    git(raiz, 'commit', '-m', `Registra o estado de ${funcionalidade} depois da ${oQueFaz(linha)}`, '--', diario)
  }
  const enviado = (opcoes.push ?? true) ? tenta(raiz, 'push', 'origin', spec) : { ok: true, saida: '' }
  const restante = { spec, linhas: quadro.linhas.map((outra) => (outra.numero === numero ? { ...outra, tarefa: null, correcao: null, desde: null } : outra)) }
  gravarQuadro(raiz, restante)
  return {
    codigo: enviado.ok ? 0 : 3,
    texto: [
      `Encontro da linha ${String(numero)}: ${oQueFaz(linha)} em ${commit}; a ${spec} está em ${git(raiz, 'rev-parse', '--short', 'HEAD')}.`,
      enviado.ok ? ((opcoes.push ?? true) ? 'Push feito: a esteira roda sobre a soma das linhas.' : 'Sem push.') : `O PUSH FALHOU, e a esteira não rodou:\n${enviado.saida}`,
      '',
      textoDoQuadro(raiz),
    ].join('\n'),
  }
}

export function fechar(raiz: string, opcoes: Opcoes = {}): Resultado {
  const contexto = contextoDe(raiz)
  if (typeof contexto === 'string') return recusa(contexto)
  const { spec, quadro } = contexto
  const ocupadas = quadro.linhas.filter(ocupada)
  if (ocupadas.length > 0) return recusa(ocupadas.map((linha) => `a linha ${String(linha.numero)} está com a ${oQueFaz(linha)}`).join('; '))
  const linhas = [`Linhas de ${spec} fechadas.`]
  for (const linha of quadro.linhas) {
    const branch = branchDaLinha(spec, linha.numero)
    if (!tenta(raiz, 'merge-base', '--is-ancestor', branch, spec).ok) return recusa(`a ${branch} tem commit que a ${spec} não tem: falta um encontro`)
    if ((opcoes.push ?? true) && tenta(raiz, 'ls-remote', '--exit-code', '--heads', 'origin', branch).ok) tenta(raiz, 'push', 'origin', '--delete', branch)
    linhas.push(`  linha ${String(linha.numero)}: tudo na ${spec}. O andar em ${linha.checkout} pode ser desfeito (maestri floor delete).`)
  }
  rmSync(join(raiz, CAMINHO_DO_QUADRO), { force: true })
  return { codigo: 0, texto: linhas.join('\n') }
}

const hora = (iso: string | null) => (iso === null ? '' : new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))

/** O quadro: o que cada linha faz, o que está livre e o que parte agora. É o que o Orquestrador lê a cada relatório. */
export function textoDoQuadro(raiz: string): string {
  const contexto = contextoDe(raiz)
  if (typeof contexto === 'string') return `RECUSADO: ${contexto}`
  const { spec, funcionalidade, quadro } = contexto
  const plano = lerPlano(raiz, funcionalidade)
  const texto = [`Linhas de ${funcionalidade} (${spec}): ${String(plano.filter((tarefa) => tarefa.feita).length)} de ${String(plano.length)} tarefas concluídas`]
  for (const linha of quadro.linhas) texto.push(`  linha ${String(linha.numero)}: ${oQueFaz(linha)}${ocupada(linha) ? ` desde ${hora(linha.desde)}` : ''} — ${linha.checkout}`)
  if (quadro.linhas.length === 0) texto.push('  nenhuma linha aberta')
  const emCurso = emCursoNo(quadro)
  const { presas } = situacaoDasPendentes(plano, emCurso)
  const { partidas, semLinha } = distribuir(plano, emCurso, quadro.linhas.filter((linha) => !ocupada(linha)).map((linha) => linha.numero))
  if (partidas.length > 0) texto.push(`Partem agora: ${partidas.map(({ linha, tarefa }) => `linha ${String(linha)} → ${String(tarefa)}.0`).join('; ')}`)
  const cabem = Math.min(semLinha.length, MAXIMO_DE_LINHAS - quadro.linhas.length)
  if (cabem > 0) texto.push(`Sem linha: ${semLinha.slice(0, cabem).map((numero) => `${String(numero)}.0`).join(', ')}. Abra ${cabem === 1 ? 'mais uma linha' : `mais ${String(cabem)} linhas`}.`)
  if (presas.length > 0) texto.push(`Presas: ${presas.map(({ numero, motivo }) => `${String(numero)}.0 (${motivo})`).join('; ')}`)
  if (partidas.length === 0 && semLinha.length === 0 && emCurso.length === 0 && plano.some((tarefa) => !tarefa.feita)) {
    texto.push('NENHUMA TAREFA LIBERADA, e nada em curso: pare e reporte.')
  }
  if (plano.length > 0 && plano.every((tarefa) => tarefa.feita)) texto.push('Todas as tarefas concluídas: `linhas.ts fechar`, e a validação.')
  return texto.join('\n')
}

/** O quadro como comando: fora do andar da spec é recusa, com saída de erro, e não um quadro vazio. */
export function quadro(raiz: string): Resultado {
  const texto = textoDoQuadro(raiz)
  return { codigo: texto.startsWith('RECUSADO') ? 1 : 0, texto }
}

if (import.meta.filename === process.argv[1]) {
  const raiz = process.cwd()
  const [comando, primeiro = '', segundo = ''] = process.argv.slice(2)
  const numero = Number(primeiro)
  const resultado: Resultado =
    comando === undefined
      ? quadro(raiz)
      : comando === 'abrir'
        ? abrir(raiz, numero, segundo)
        : comando === 'partida'
          ? partida(raiz, numero, segundo)
          : comando === 'encontro'
            ? encontro(raiz, numero)
            : comando === 'fechar'
              ? fechar(raiz)
              : comando === 'conferir'
                ? conferir(raiz, { emCurso: primeiro === '--em-curso' })
                : recusa(`comando desconhecido: ${comando}`)
  process.stdout.write(`${resultado.texto}\n`)
  process.exitCode = resultado.codigo
}
