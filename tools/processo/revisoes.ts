// Registro e portão das revisões de tarefa, chamados pelos hooks do Claude Code
// (.claude/settings.json).
//
// `registrar` (SubagentStop): quando um revisor termina, acrescenta a rodada à seção
// "Revisões" do N_task.md, com início, fim e veredito. Quem escreve é o hook, não quem
// implementou a tarefa.
//
// `portao` (PreToolUse do Bash): bloqueia `git commit ... (tarefa N.0)` enquanto algum revisor
// obrigatório do N_task.md não tiver uma rodada iniciada depois da última alteração de código,
// com APROVADO quando o revisor tem veto, ou enquanto a mensagem não trouxer a linha "Revisões:".
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const REVISORES_COM_VETO = ['tenancy-guardian', 'privacy-guardian', 'conformidade-reviewer', 'infra-guardian', 'test-engineer']
export const REVISORES_SEM_VETO = ['llm-integrator', 'pedagogia-reviewer', 'frontend-reviewer']
const REVISORES = new Set([...REVISORES_COM_VETO, ...REVISORES_SEM_VETO])

export interface Revisao {
  inicio: string
  fim: string
  revisor: string
  rodada: number
  veredito: string
  agente: string
}

const TITULO_SECAO = '## Revisões'
const CABECALHO_TABELA = '| Início | Fim | Revisor | Rodada | Veredito | Agente |\n|---|---|---|---|---|---|'
const TEXTO_SECAO =
  'Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:\n' +
  'o commit da tarefa fica bloqueado enquanto um revisor obrigatório não tiver rodada iniciada\n' +
  'depois da última alteração de código, com APROVADO quando o revisor tem veto.'

export function extrairVeredito(texto: string): string | null {
  const achado = /VEREDITO\**\s*:?\s*\**\s*(APROVADO|REPROVADO|AJUSTES NECESS[ÁA]RIOS|VETO)/.exec(texto)
  if (!achado?.[1]) return null
  if (achado[1] === 'VETO') return 'REPROVADO'
  return achado[1].replace('NECESSARIOS', 'NECESSÁRIOS')
}

// A linha "Tarefa: tasks/prd-x/N_task.md" do prompt do revisor vence; sem ela, a primeira menção.
export function caminhoDaTarefa(texto: string): string | null {
  const declarada = /Tarefa:\s*`?(tasks\/prd-[a-z0-9-]+\/\d+_task\.md)/.exec(texto)
  if (declarada?.[1]) return declarada[1]
  return /tasks\/prd-[a-z0-9-]+\/\d+_task\.md/.exec(texto)?.[0] ?? null
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

export function revisoresObrigatorios(conteudoTarefa: string): string[] {
  const linha = /\*\*Subagentes obrigatórios:\*\*(.*)/.exec(conteudoTarefa)?.[1] ?? ''
  return [...linha.matchAll(/`([a-z-]+)`/g)].map((achado) => achado[1] ?? '').filter((nome) => REVISORES.has(nome))
}

export function acrescentarRevisao(conteudoTarefa: string, revisao: Omit<Revisao, 'rodada'>, nota?: string): string {
  let conteudo = conteudoTarefa.endsWith('\n') ? conteudoTarefa : `${conteudoTarefa}\n`
  if (!conteudo.includes(`\n${TITULO_SECAO}\n`)) {
    conteudo += `\n${TITULO_SECAO}\n\n${TEXTO_SECAO}\n\n${nota ? `${nota}\n\n` : ''}${CABECALHO_TABELA}\n`
  }
  const rodada = lerRevisoes(conteudo).filter((anterior) => anterior.revisor === revisao.revisor).length + 1
  return `${conteudo}| ${revisao.inicio} | ${revisao.fim} | \`${revisao.revisor}\` | ${rodada} | ${revisao.veredito} | ${revisao.agente} |\n`
}

export interface ResultadoPortao {
  bloqueios: string[]
  linhaResumo: string
}

const ordinal = (n: number) => `${n}ª rodada`

export function avaliarPortao(entrada: {
  obrigatorios: string[]
  revisoes: Revisao[]
  ultimaAlteracao: { arquivo: string; quando: number } | null
  mensagemCommit: string
}): ResultadoPortao {
  const bloqueios: string[] = []
  const resumo: string[] = []
  for (const revisor of entrada.obrigatorios) {
    const ultima = entrada.revisoes.filter((revisao) => revisao.revisor === revisor).at(-1)
    if (!ultima) {
      bloqueios.push(`${revisor}: nenhuma rodada registrada. Chame o revisor com a linha "Tarefa: <caminho do N_task.md>" no início do prompt.`)
      continue
    }
    resumo.push(`${revisor} ${ultima.veredito} (${ordinal(ultima.rodada)})`)
    const temVeto = REVISORES_COM_VETO.includes(revisor)
    if (temVeto && ultima.veredito !== 'APROVADO') {
      bloqueios.push(`${revisor}: a última rodada (${ultima.rodada}ª, ${ultima.fim}) terminou ${ultima.veredito}. Corrija e chame uma rodada nova.`)
      continue
    }
    const alteracao = entrada.ultimaAlteracao
    if (alteracao && Math.floor(alteracao.quando / 1000) > Math.floor(lerHora(ultima.inicio) / 1000)) {
      bloqueios.push(
        `${revisor}: ${alteracao.arquivo} mudou em ${formatarHora(new Date(alteracao.quando))}, depois do início da ${ultima.rodada}ª rodada (${ultima.inicio}). ` +
          'A revisão vale para o código que o revisor viu: chame uma rodada nova.',
      )
    }
  }
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

// Registro da tarefa não conta como alteração de código: o próprio hook escreve lá.
export function ultimaAlteracao(raiz: string, arquivos: string[]): { arquivo: string; quando: number } | null {
  let maisRecente: { arquivo: string; quando: number } | null = null
  for (const arquivo of arquivos) {
    if (arquivo.startsWith('tasks/')) continue
    const caminho = join(raiz, arquivo)
    if (!existsSync(caminho)) continue
    const quando = statSync(caminho).mtimeMs
    if (!maisRecente || quando > maisRecente.quando) maisRecente = { arquivo, quando }
  }
  return maisRecente
}

// `git commit` em posição de comando: início, ou depois de ; & | ( ou quebra de linha. Texto
// dentro de string (echo, grep no log) não é commit.
export function ehCommit(comando: string): boolean {
  return /(?:^|[;&|(\n])\s*(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*git(?:\s+-[Cc]\s+\S+)*\s+commit\b/.test(comando)
}

export function tarefaDoCommit(comando: string, raiz: string, arquivos: string[]): { caminho: string } | { erro: string } | null {
  if (!ehCommit(comando)) return null
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

export function portao(entrada: EntradaHook, raiz: string): string | null {
  const comando = entrada.tool_input?.command ?? ''
  if (!ehCommit(comando)) return null
  const arquivos = arquivosAlterados(raiz)
  const tarefa = tarefaDoCommit(comando, raiz, arquivos)
  if (!tarefa) return null
  if ('erro' in tarefa) return tarefa.erro
  const conteudo = readFileSync(join(raiz, tarefa.caminho), 'utf8')
  const { bloqueios } = avaliarPortao({
    obrigatorios: revisoresObrigatorios(conteudo),
    revisoes: lerRevisoes(conteudo),
    ultimaAlteracao: ultimaAlteracao(raiz, arquivos),
    mensagemCommit: comando,
  })
  if (bloqueios.length === 0) return null
  return `Commit bloqueado: revisões de ${tarefa.caminho} incompletas.\n- ${bloqueios.join('\n- ')}`
}
