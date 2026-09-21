// Registro e portão das revisões, chamados pelos hooks do Claude Code (.claude/settings.json).
//
// Documento de trabalho é o arquivo onde as rodadas ficam registradas: o N_task.md de uma tarefa,
// o revisao-spec.md de uma Tech Spec, ou o tasks/correcoes/<slug>.md de uma correção.
//
// `registrar` (SubagentStop): quando um revisor termina, acrescenta a rodada à seção "Revisões" do
// documento, com início, fim e veredito, e guarda o que ele exigiu em achados-revisoes.md, na mesma
// pasta, para a retrospectiva. Quem escreve é o hook, não quem implementou.
//
// `portao` (PreToolUse do Bash): bloqueia `git commit ... (tarefa N.0)` e `git commit ... (correção
// <slug>)` enquanto algum revisor obrigatório não tiver uma rodada que ainda valha para o código
// atual, com APROVADO quando o revisor tem veto, enquanto o portão local (typecheck, lint, testes)
// não tiver passado depois da última alteração, ou enquanto a mensagem não trouxer a linha
// "Revisões:". Bloqueia também commit que leva código sem nenhuma das duas marcas.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export const REVISORES_COM_VETO = ['tenancy-guardian', 'privacy-guardian', 'conformidade-reviewer', 'infra-guardian', 'test-engineer', 'revisor-geral']
export const REVISORES_SEM_VETO = ['llm-integrator', 'pedagogia-reviewer', 'frontend-reviewer']
const REVISORES = new Set([...REVISORES_COM_VETO, ...REVISORES_SEM_VETO])

// Quem audita os testes além do código. Para os outros, mudança só em teste não caduca a rodada:
// o que eles aprovaram não mudou, e quem confere o teste corrigido é o test-engineer.
const REVISORES_DE_TESTE = ['test-engineer', 'revisor-geral']

// Código só entra no main por tarefa ou por correção, as duas com revisores.
export const PASTAS_DE_CODIGO = ['apps/', 'packages/', 'infra/', 'e2e/']

export const CAMINHO_CARIMBO = '.processo/portao.json'
export const NOME_ACHADOS = 'achados-revisoes.md'

export interface Revisao {
  inicio: string
  fim: string
  revisor: string
  rodada: number
  veredito: string
  agente: string
}

export interface Alteracao {
  arquivo: string
  quando: number
  /** Hash do conteúdo atual. É ele que decide se o arquivo mudou de fato; ver `mudouDeVerdade`. */
  hash: string
}

export interface Carimbo {
  inicio: string
  suites: string[]
}

/**
 * O conteúdo dos arquivos de código no momento de cada referência: o carimbo do portão e cada rodada
 * de revisor. Chave `portao`, ou `<documento>|<revisor>|<rodada>`.
 *
 * Existe porque `mtime` não é evidência de mudança. O `test-engineer` prova as guardas mutando um
 * arquivo e restaurando, que é o trabalho que se pede dele: isso move o `mtime` sem trocar uma linha,
 * e o portão lia como alteração — o revisor invalidava a própria rodada. Na retrospectiva do F1, 63
 * das 200 rodadas das tarefas e 27 das 50 das correções caducaram sem nenhuma reprovação.
 */
export type Instantaneos = Record<string, Record<string, string>>

export const CAMINHO_CONTEUDO = '.processo/conteudo.json'
/** A chave do instantâneo do portão local. */
export const CHAVE_DO_PORTAO = 'portao'

/** Só conta como alteração o arquivo cujo conteúdo difere do que a referência viu. */
function mudouDeVerdade(alteracao: Alteracao, instantaneo: Record<string, string> | undefined): boolean {
  const anterior = instantaneo?.[alteracao.arquivo]
  return anterior === undefined || anterior !== alteracao.hash
}

export type TipoDocumento = 'tarefa' | 'spec' | 'correcao'

const TITULO_SECAO = '## Revisões'
const CABECALHO_TABELA = '| Início | Fim | Revisor | Rodada | Veredito | Agente |\n|---|---|---|---|---|---|'
const TEXTO_SECAO =
  'Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:\n' +
  'o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código\n' +
  'atual, com APROVADO quando o revisor tem veto.'

export function extrairVeredito(texto: string): string | null {
  const achado = /VEREDITO\**\s*:?\s*\**\s*(APROVADO|REPROVADO|AJUSTES NECESS[ÁA]RIOS|VETO)/.exec(texto)
  if (!achado?.[1]) return null
  if (achado[1] === 'VETO') return 'REPROVADO'
  return achado[1].replace('NECESSARIOS', 'NECESSÁRIOS')
}

const DOCUMENTO = /tasks\/(?:prd-[a-z0-9-]+\/(?:\d+_task|revisao-spec)|correcoes\/(?!achados-revisoes)[a-z0-9-]+)\.md/

// A linha "Tarefa: <documento>" do prompt do revisor vence; sem ela, a primeira menção.
export function caminhoDaTarefa(texto: string): string | null {
  const declarada = new RegExp(`Tarefa:\\s*\`?(${DOCUMENTO.source})`).exec(texto)
  if (declarada?.[1]) return declarada[1]
  return DOCUMENTO.exec(texto)?.[0] ?? null
}

export function tipoDoDocumento(caminho: string): TipoDocumento {
  if (caminho.startsWith('tasks/correcoes/')) return 'correcao'
  if (caminho.endsWith('/revisao-spec.md')) return 'spec'
  return 'tarefa'
}

export function formatarHora(data: Date): string {
  const dois = (n: number) => String(n).padStart(2, '0')
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())} ${dois(data.getHours())}:${dois(data.getMinutes())}:${dois(data.getSeconds())}`
}

export function lerHora(texto: string): number {
  return new Date(texto.replace(' ', 'T')).getTime()
}

interface EntradaTranscript {
  type?: string
  timestamp?: string
  message?: { content?: unknown }
}

function textoDoConteudo(conteudo: unknown): string {
  if (typeof conteudo === 'string') return conteudo
  if (!Array.isArray(conteudo)) return ''
  return conteudo.map((bloco: { type?: string; text?: string }) => (bloco?.type === 'text' ? (bloco.text ?? '') : '')).join('')
}

function ehMensagemDeQuemChamou(entrada: EntradaTranscript): boolean {
  if (entrada.type !== 'user') return false
  const conteudo = entrada.message?.content
  if (typeof conteudo === 'string') return true
  return Array.isArray(conteudo) && conteudo.some((bloco: { type?: string }) => bloco?.type === 'text')
}

// O prompt de quem chamou e o início da rodada atual (a última mensagem que não é resultado de ferramenta).
export function lerTranscript(conteudo: string): { prompt: string; inicioDaRodada: Date | null } {
  const entradas = conteudo
    .split('\n')
    .filter((linha) => linha.trim())
    .flatMap((linha): EntradaTranscript[] => {
      try {
        return [JSON.parse(linha) as EntradaTranscript]
      } catch {
        return []
      }
    })
    .filter(ehMensagemDeQuemChamou)
  const ultima = entradas.at(-1)
  return {
    prompt: entradas.map((entrada) => textoDoConteudo(entrada.message?.content)).join('\n'),
    inicioDaRodada: ultima?.timestamp ? new Date(ultima.timestamp) : null,
  }
}

export function lerRevisoes(conteudoTarefa: string): Revisao[] {
  const inicio = conteudoTarefa.indexOf(`\n${TITULO_SECAO}\n`)
  if (inicio === -1) return []
  return conteudoTarefa
    .slice(inicio)
    .split('\n')
    .filter((linha) => /^\| \d{4}-/.test(linha))
    .map((linha) => {
      const [inicioRodada = '', fim = '', revisor = '', rodada = '', veredito = '', agente = ''] = linha
        .split('|')
        .slice(1, -1)
        .map((celula) => celula.trim().replaceAll('`', ''))
      return { inicio: inicioRodada, fim, revisor, rodada: Number(rodada), veredito, agente }
    })
}

// Os marcados no documento, mais os que toda tarefa e toda correção têm, marcados ou não.
export function revisoresObrigatorios(conteudoTarefa: string, tipo: TipoDocumento = 'tarefa'): string[] {
  const linha = /\*\*Subagentes obrigatórios:\*\*(.*)/.exec(conteudoTarefa)?.[1] ?? ''
  const marcados = [...linha.matchAll(/`([a-z-]+)`/g)].map((achado) => achado[1] ?? '').filter((nome) => REVISORES.has(nome))
  const sempre = tipo === 'tarefa' ? ['test-engineer', 'revisor-geral'] : tipo === 'correcao' ? ['test-engineer'] : []
  return [...new Set([...marcados, ...sempre])]
}

export function acrescentarRevisao(conteudoTarefa: string, revisao: Omit<Revisao, 'rodada'>, nota?: string): string {
  let conteudo = conteudoTarefa.endsWith('\n') ? conteudoTarefa : `${conteudoTarefa}\n`
  if (!conteudo.includes(`\n${TITULO_SECAO}\n`)) {
    conteudo += `\n${TITULO_SECAO}\n\n${TEXTO_SECAO}\n\n${nota ? `${nota}\n\n` : ''}${CABECALHO_TABELA}\n`
  }
  const rodada = lerRevisoes(conteudo).filter((anterior) => anterior.revisor === revisao.revisor).length + 1
  return `${conteudo}| ${revisao.inicio} | ${revisao.fim} | \`${revisao.revisor}\` | ${rodada} | ${revisao.veredito} | ${revisao.agente} |\n`
}

// O que vale para a retrospectiva: toda rodada que não aprovou, e a aprovada que deixou recomendação.
export function achadoDaRodada(revisao: Revisao, mensagemFinal: string): string | null {
  const recomendou = /Recomendações\**\s*:\**\s*(?!nenhuma)\S/i.test(mensagemFinal)
  if (revisao.veredito === 'APROVADO' && !recomendou) return null
  const linhas = mensagemFinal.trim().split('\n')
  const texto = linhas.length > 80 ? [...linhas.slice(0, 80), `[… ${linhas.length - 80} linhas cortadas]`].join('\n') : linhas.join('\n')
  return `## ${revisao.revisor} · ${revisao.rodada}ª rodada · ${revisao.veredito} · ${revisao.fim}\n\n${texto}\n`
}

export function acrescentarAchado(conteudoAchados: string, documento: string, achado: string): string {
  const base = conteudoAchados || '# Achados das revisões\n\nEscrito pelo hook `tools/processo/revisoes.ts`. Lido por `/retro`. Não edite à mão.\n'
  const [cabecalho = '', ...resto] = achado.split('\n')
  return `${base.endsWith('\n') ? base : `${base}\n`}\n${cabecalho} · \`${documento}\`\n${resto.join('\n')}`
}

const ehArquivoDeTeste = (arquivo: string) => /\.(test|spec)\.tsx?$/.test(arquivo) || /(^|\/)(test|e2e|__fixtures__)\//.test(arquivo)

// A alteração mais recente, depois do início da rodada, que o revisor ainda não viu e que importa para ele.
export function alteracaoQueCaduca(revisor: string, inicioDaRodada: string, alteracoes: Alteracao[], instantaneo?: Record<string, string>): Alteracao | null {
  const inicio = Math.floor(lerHora(inicioDaRodada) / 1000)
  return alteracoes
    .filter((alteracao) => Math.floor(alteracao.quando / 1000) > inicio)
    .filter((alteracao) => mudouDeVerdade(alteracao, instantaneo))
    .filter((alteracao) => REVISORES_DE_TESTE.includes(revisor) || !ehArquivoDeTeste(alteracao.arquivo))
    .reduce<Alteracao | null>((maisRecente, alteracao) => (!maisRecente || alteracao.quando > maisRecente.quando ? alteracao : maisRecente), null)
}

export function suitesExigidas(obrigatorios: string[]): string[] {
  return [
    'typecheck',
    'lint',
    'test',
    ...(obrigatorios.includes('frontend-reviewer') ? ['e2e'] : []),
    ...(obrigatorios.includes('infra-guardian') ? ['infra'] : []),
  ]
}

export function avaliarCarimbo(carimbo: Carimbo | null, exigidas: string[], alteracoes: Alteracao[], instantaneo?: Record<string, string>): string | null {
  const comando = `node tools/processo/portao-local.ts${exigidas.includes('e2e') ? ' --e2e' : ''}${exigidas.includes('infra') ? ' --infra' : ''}`
  if (!carimbo) return `portão local: nunca passou nesta árvore. Rode \`${comando}\`.`
  const faltando = exigidas.filter((suite) => !carimbo.suites.includes(suite))
  if (faltando.length > 0) return `portão local: o último não rodou ${faltando.join(', ')}. Rode \`${comando}\`.`
  // Em milissegundos, não em segundo inteiro: o carimbo guarda o instante com precisão de ms, e
  // truncar fazia o arquivo salvo no mesmo segundo — inclusive 39 ms **antes** do portão começar —
  // contar como alteração posterior. Custou duas rodadas de revisão no F1 (tarefas 7.0 e 16.0).
  const inicio = new Date(carimbo.inicio).getTime()
  const depois = alteracoes
    .filter((alteracao) => alteracao.quando >= inicio)
    .filter((alteracao) => mudouDeVerdade(alteracao, instantaneo))
    .sort((a, b) => b.quando - a.quando)[0]
  if (depois) {
    return `portão local: ${depois.arquivo} mudou em ${formatarHora(new Date(depois.quando))}, depois do início do último (${formatarHora(new Date(carimbo.inicio))}). Rode \`${comando}\` de novo.`
  }
  return null
}

export interface ResultadoPortao {
  bloqueios: string[]
  linhaResumo: string
}

const ordinal = (n: number) => `${n}ª rodada`

export function avaliarPortao(entrada: {
  obrigatorios: string[]
  revisoes: Revisao[]
  alteracoes: Alteracao[]
  carimbo: Carimbo | null
  mensagemCommit: string
}): ResultadoPortao {
  const bloqueios: string[] = []
  const resumo: string[] = []
  for (const revisor of entrada.obrigatorios) {
    const ultima = entrada.revisoes.filter((revisao) => revisao.revisor === revisor).at(-1)
    if (!ultima) {
      bloqueios.push(`${revisor}: nenhuma rodada registrada. Chame o revisor com a linha "Tarefa: <caminho do documento>" no início do prompt.`)
      continue
    }
    resumo.push(`${revisor} ${ultima.veredito} (${ordinal(ultima.rodada)})`)
    const temVeto = REVISORES_COM_VETO.includes(revisor)
    if (temVeto && ultima.veredito !== 'APROVADO') {
      bloqueios.push(`${revisor}: a última rodada (${ultima.rodada}ª, ${ultima.fim}) terminou ${ultima.veredito}. Corrija e chame uma rodada nova.`)
      continue
    }
    const alteracao = alteracaoQueCaduca(revisor, ultima.inicio, entrada.alteracoes)
    if (alteracao) {
      bloqueios.push(
        `${revisor}: ${alteracao.arquivo} mudou em ${formatarHora(new Date(alteracao.quando))}, depois do início da ${ultima.rodada}ª rodada (${ultima.inicio}). ` +
          'A revisão vale para o código que o revisor viu: chame uma rodada nova, com o diff desde a rodada aprovada.',
      )
    }
  }
  const carimbo = avaliarCarimbo(entrada.carimbo, suitesExigidas(entrada.obrigatorios), entrada.alteracoes)
  if (carimbo) bloqueios.push(carimbo)
  const linhaResumo = `Revisões: ${resumo.join(', ')}`
  // A linha só é cobrada com os revisores em ordem: antes disso, o exemplo sairia incompleto.
  if (bloqueios.length === 0 && entrada.obrigatorios.length > 0 && !/^Revisões:/m.test(entrada.mensagemCommit)) {
    bloqueios.push(`A mensagem do commit precisa da linha de revisões, por exemplo:\n${linhaResumo}`)
  }
  return { bloqueios, linhaResumo }
}

// ---------------------------------------------------------------------------------------------
// Efeitos: arquivo, git e hook.

function comTrava<T>(caminho: string, acao: () => T): T {
  const trava = `${caminho}.trava`
  const limite = Date.now() + 10_000
  for (;;) {
    try {
      mkdirSync(trava)
      break
    } catch {
      if (existsSync(trava) && Date.now() - statSync(trava).mtimeMs > 30_000) rmdirSync(trava)
      if (Date.now() > limite) throw new Error(`trava presa em ${trava}`)
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50)
    }
  }
  try {
    return acao()
  } finally {
    rmdirSync(trava)
  }
}

interface EntradaHook {
  cwd?: string
  agent_type?: string
  agent_id?: string
  agent_transcript_path?: string
  last_assistant_message?: string
  tool_input?: { command?: string }
}

export function registrar(entrada: EntradaHook, raiz: string, agora = new Date()): string | null {
  if (!entrada.agent_type || !REVISORES.has(entrada.agent_type)) return null
  const transcript =
    entrada.agent_transcript_path && existsSync(entrada.agent_transcript_path)
      ? lerTranscript(readFileSync(entrada.agent_transcript_path, 'utf8'))
      : { prompt: '', inicioDaRodada: null }
  const mensagemFinal = entrada.last_assistant_message ?? ''
  const relativo = caminhoDaTarefa(transcript.prompt) ?? caminhoDaTarefa(mensagemFinal)
  if (!relativo) return null
  const caminho = join(raiz, relativo)
  if (!existsSync(caminho)) return null
  comTrava(caminho, () => {
    const atualizado = acrescentarRevisao(readFileSync(caminho, 'utf8'), {
      inicio: formatarHora(transcript.inicioDaRodada ?? agora),
      fim: formatarHora(agora),
      revisor: entrada.agent_type ?? '',
      veredito: extrairVeredito(mensagemFinal) ?? 'SEM VEREDITO',
      agente: entrada.agent_id ?? '',
    })
    writeFileSync(caminho, atualizado)
    const revisao = lerRevisoes(atualizado).at(-1)
    // O conteúdo que esta rodada viu. Mutação com restauração (o teste de mutação que se pede ao
    // `test-engineer`) deixa o conteúdo igual, e a rodada não caduca por causa dele.
    if (revisao) gravarInstantaneo(raiz, chaveDaRodada(relativo, revisao.revisor, revisao.rodada), alteracoesDeCodigo(raiz, arquivosAlterados(raiz)))
    const achado = revisao ? achadoDaRodada(revisao, mensagemFinal) : null
    if (achado) {
      const caminhoAchados = join(dirname(caminho), NOME_ACHADOS)
      const anterior = existsSync(caminhoAchados) ? readFileSync(caminhoAchados, 'utf8') : ''
      writeFileSync(caminhoAchados, acrescentarAchado(anterior, relativo, achado))
    }
  })
  return relativo
}

export function arquivosAlterados(raiz: string): string[] {
  const saida = execFileSync('git', ['status', '--porcelain=v1', '-z', '-uall'], { cwd: raiz, encoding: 'utf8' })
  const partes = saida.split('\0')
  const arquivos: string[] = []
  for (let i = 0; i < partes.length; i++) {
    const item = partes[i] ?? ''
    if (item.length < 4) continue
    const estado = item.slice(0, 2)
    if (estado.startsWith('R') || estado.startsWith('C')) i++ // -z: o nome de origem vem na parte seguinte
    if (estado.includes('D')) continue
    arquivos.push(item.slice(3))
  }
  return arquivos
}

// Registro em tasks/ não conta como alteração de código: o próprio hook escreve lá.
/**
 * Documento que nenhuma suíte lê não é código: editá-lo não muda o que o portão provou. A exceção é
 * o runbook, que a guarda `alerta-tem-runbook` lê de verdade.
 *
 * Sem isto, uma linha no `TODO.md` custava rodar `test:infra` de novo — uns 16 min — e derrubava as
 * revisões já aprovadas junto.
 */
export const DOCUMENTO_QUE_UMA_SUITE_LE = 'docs/runbook.md'

function ehDocumentoSemSuite(arquivo: string): boolean {
  return arquivo.endsWith('.md') && arquivo !== DOCUMENTO_QUE_UMA_SUITE_LE
}

export function alteracoesDeCodigo(raiz: string, arquivos: string[]): Alteracao[] {
  return arquivos
    .filter((arquivo) => !arquivo.startsWith('tasks/') && !arquivo.startsWith('.processo/'))
    .filter((arquivo) => !ehDocumentoSemSuite(arquivo))
    .filter((arquivo) => existsSync(join(raiz, arquivo)))
    .map((arquivo) => ({
      arquivo,
      quando: statSync(join(raiz, arquivo)).mtimeMs,
      hash: createHash('sha256').update(readFileSync(join(raiz, arquivo))).digest('hex'),
    }))
}

export function lerInstantaneos(raiz: string): Instantaneos {
  const caminho = join(raiz, CAMINHO_CONTEUDO)
  if (!existsSync(caminho)) return {}
  try {
    return JSON.parse(readFileSync(caminho, 'utf8')) as Instantaneos
  } catch {
    return {}
  }
}

/** Guarda o conteúdo visto por uma referência (o carimbo, ou uma rodada de revisor). */
export function gravarInstantaneo(raiz: string, chave: string, alteracoes: Alteracao[]): void {
  const instantaneos = lerInstantaneos(raiz)
  instantaneos[chave] = Object.fromEntries(alteracoes.map(({ arquivo, hash }) => [arquivo, hash]))
  mkdirSync(join(raiz, dirname(CAMINHO_CONTEUDO)), { recursive: true })
  writeFileSync(join(raiz, CAMINHO_CONTEUDO), `${JSON.stringify(instantaneos, null, 2)}\n`)
}

/** A chave do instantâneo de uma rodada. O documento identifica a tarefa, a spec ou a correção. */
export function chaveDaRodada(documento: string, revisor: string, rodada: number): string {
  return `${documento}|${revisor}|${String(rodada)}`
}

export function lerCarimbo(raiz: string): Carimbo | null {
  const caminho = join(raiz, CAMINHO_CARIMBO)
  if (!existsSync(caminho)) return null
  try {
    return JSON.parse(readFileSync(caminho, 'utf8')) as Carimbo
  } catch {
    return null
  }
}

export function gravarCarimbo(raiz: string, carimbo: Carimbo): void {
  mkdirSync(join(raiz, dirname(CAMINHO_CARIMBO)), { recursive: true })
  writeFileSync(join(raiz, CAMINHO_CARIMBO), `${JSON.stringify(carimbo, null, 2)}\n`)
}

// `git commit` em posição de comando: início, ou depois de ; & | ( ou quebra de linha. Texto
// dentro de string (echo, grep no log) não é commit.
export function ehCommit(comando: string): boolean {
  return /(?:^|[;&|(\n])\s*(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*git(?:\s+-[Cc]\s+\S+)*\s+commit\b/.test(comando)
}

const semAspas = (token: string) => token.replace(/^["']|["']$/g, '')

// Os arquivos que o commit vai levar, pelo que o próprio comando prepara: `git add <caminhos>`,
// `git add -A`, `git commit -a`. O que já estava no índice entra por `preparados`.
export function arquivosDoCommit(comando: string, raiz: string, alterados: string[], preparados: string[]): string[] {
  const levados = new Set(preparados)
  const todos = () => alterados.forEach((arquivo) => levados.add(arquivo))
  for (const achado of comando.matchAll(/git(?:\s+-[Cc]\s+\S+)*\s+add\b([^;&|\n]*)/g)) {
    for (const bruto of (achado[1] ?? '').trim().split(/\s+/).filter(Boolean)) {
      const token = semAspas(bruto)
      if (['-A', '--all', '.', ':/', '-u', '--update'].includes(token)) todos()
      if (token.startsWith('-')) continue
      const relativo = token.startsWith(`${raiz}/`) ? token.slice(raiz.length + 1) : token.replace(/^\.\//, '')
      const pasta = relativo.replace(/\/$/, '')
      alterados.filter((arquivo) => arquivo === pasta || arquivo.startsWith(`${pasta}/`)).forEach((arquivo) => levados.add(arquivo))
    }
  }
  for (const achado of comando.matchAll(/git(?:\s+-[Cc]\s+\S+)*\s+commit\b([^;&|\n]*)/g)) {
    for (const token of (achado[1] ?? '').trim().split(/\s+/)) {
      if (!token.startsWith('-')) break
      if (token === '--all' || (/^-[a-zA-Z]+$/.test(token) && token.includes('a'))) todos()
      if (/^-[a-zA-Z]*[mF]$/.test(token) || token === '--message' || token === '--file' || token.startsWith('--message=')) break
    }
  }
  return [...levados]
}

export function documentoDoCommit(comando: string, raiz: string, arquivos: string[]): { caminho: string } | { erro: string } | null {
  if (!ehCommit(comando)) return null
  const correcao = /\(correção ([a-z0-9-]+)\)/.exec(comando)?.[1]
  if (correcao) {
    const caminho = join('tasks', 'correcoes', `${correcao}.md`)
    return existsSync(join(raiz, caminho)) ? { caminho } : { erro: `A correção ${correcao} não tem ${caminho}. Crie o documento com /corrigir.` }
  }
  const numero = /\(tarefa (\d+)\.0\)/.exec(comando)?.[1]
  if (!numero) return null
  const pastaTasks = join(raiz, 'tasks')
  const candidatas = existsSync(pastaTasks)
    ? readdirSync(pastaTasks).filter((pasta) => pasta.startsWith('prd-') && existsSync(join(pastaTasks, pasta, `${numero}_task.md`)))
    : []
  const escolher = (filtro: (pasta: string) => boolean) => candidatas.filter(filtro)
  const escolhidas = [
    escolher((pasta) => comando.includes(`tasks/${pasta}/`)),
    candidatas,
    escolher((pasta) => arquivos.some((arquivo) => arquivo.startsWith(`tasks/${pasta}/`))),
  ].find((lista) => lista.length === 1)
  if (!escolhidas?.[0]) return { erro: `Não sei a qual funcionalidade pertence a tarefa ${numero}.0. Cite tasks/prd-<funcionalidade>/ no comando.` }
  return { caminho: join('tasks', escolhidas[0], `${numero}_task.md`) }
}

function arquivosPreparados(raiz: string): string[] {
  return execFileSync('git', ['diff', '--cached', '--name-only', '-z'], { cwd: raiz, encoding: 'utf8' }).split('\0').filter(Boolean)
}

export function portao(entrada: EntradaHook, raiz: string): string | null {
  const comando = entrada.tool_input?.command ?? ''
  if (!ehCommit(comando)) return null
  const arquivos = arquivosAlterados(raiz)
  const documento = documentoDoCommit(comando, raiz, arquivos)
  if (!documento) {
    const codigo = arquivosDoCommit(comando, raiz, arquivos, arquivosPreparados(raiz)).filter((arquivo) =>
      PASTAS_DE_CODIGO.some((pasta) => arquivo.startsWith(pasta)),
    )
    if (codigo.length === 0) return null
    return (
      `Commit bloqueado: ele leva código (${codigo.slice(0, 3).join(', ')}${codigo.length > 3 ? ', …' : ''}) sem "(tarefa N.0)" nem "(correção <slug>)". ` +
      'Código entra por /executar-task ou por /corrigir, que passam pelos revisores.'
    )
  }
  if ('erro' in documento) return documento.erro
  const conteudo = readFileSync(join(raiz, documento.caminho), 'utf8')
  const { bloqueios } = avaliarPortao({
    obrigatorios: revisoresObrigatorios(conteudo, tipoDoDocumento(documento.caminho)),
    revisoes: lerRevisoes(conteudo),
    alteracoes: alteracoesDeCodigo(raiz, arquivos),
    carimbo: lerCarimbo(raiz),
    mensagemCommit: comando,
  })
  if (bloqueios.length === 0) return null
  return `Commit bloqueado: revisões de ${documento.caminho} incompletas.\n- ${bloqueios.join('\n- ')}`
}
