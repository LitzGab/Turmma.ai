// Registro e portão das revisões, chamados pelos hooks do Claude Code (.claude/settings.json).
//
// Documento de trabalho é o arquivo onde as rodadas ficam registradas: o N_task.md de uma tarefa,
// o revisao-spec.md de uma Tech Spec, ou o tasks/correcoes/<slug>.md de uma correção.
//
// `registrar` (SubagentStop): quando um revisor termina, acrescenta a rodada à seção "Revisões" do
// documento, com início, fim e veredito, e guarda o que ele exigiu em `achados/<documento>.md`, com
// uma linha de resumo em `achados/indice.md`. Quem escreve é o hook, não quem implementou.
//
// A separação existe porque o arquivo único por pasta chegou a 646 KB e 158 rodadas no F1, e o
// passo 2 do `/executar-task` manda lê-lo antes de cada tarefa: o índice é o que cabe na janela,
// e o bloco inteiro se abre por ele.
//
// `portao` (PreToolUse do Bash): bloqueia `git commit ... (tarefa N.0)` e `git commit ... (correção
// <slug>)` enquanto algum revisor obrigatório não tiver uma rodada que ainda valha para o código
// atual, com APROVADO quando o revisor tem veto, enquanto o portão local (typecheck, lint, testes)
// não tiver passado depois da última alteração, ou enquanto a mensagem não trouxer a linha
// "Revisões:". Bloqueia também commit que leva código sem nenhuma das duas marcas.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmdirSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, join } from 'node:path'
import type * as TS from 'typescript'

export const REVISORES_COM_VETO = ['tenancy-guardian', 'privacy-guardian', 'conformidade-reviewer', 'infra-guardian', 'test-engineer', 'revisor-geral']
export const REVISORES_SEM_VETO = ['llm-integrator', 'pedagogia-reviewer', 'frontend-reviewer']
const REVISORES = new Set([...REVISORES_COM_VETO, ...REVISORES_SEM_VETO])

// Quem audita os testes além do código. Para os outros, mudança só em teste não caduca a rodada:
// o que eles aprovaram não mudou, e quem confere o teste corrigido é o test-engineer.
const REVISORES_DE_TESTE = ['test-engineer', 'revisor-geral']

// Código só entra no main por tarefa ou por correção, as duas com revisores.
export const PASTAS_DE_CODIGO = ['apps/', 'packages/', 'infra/', 'e2e/']

export const CAMINHO_CARIMBO = '.processo/portao.json'
/** O arquivo único por pasta, de antes da separação. Só a migração o lê. */
export const NOME_ACHADOS = 'achados-revisoes.md'
/** Os achados ficam em `<pasta do documento>/achados/`: um arquivo por documento, mais o índice. */
export const PASTA_ACHADOS = 'achados'
export const NOME_INDICE = 'indice.md'

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
  /** Só em `.ts`/`.tsx`: o hash do arquivo sem comentários nem espaço. Ver `impressaoSemComentarios`. */
  semComentarios?: string
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

/** O instantâneo que corresponde a estas alterações: arquivo e hash, sem o `mtime`. */
export function instantaneoDe(alteracoes: Alteracao[]): Record<string, string> {
  return Object.fromEntries(alteracoes.map(({ arquivo, hash }) => [arquivo, hash]))
}

/**
 * O par de cada instantâneo, com o hash sem comentários dos `.ts`/`.tsx`. Chave própria, e não um campo a mais no
 * instantâneo de sempre, para o instantâneo gravado antes desta mudança continuar valendo como estava: sem o par, nada
 * conta como mudança só de comentário, e a leitura é a restrita.
 */
export function chaveSemComentarios(chave: string): string {
  return `${chave}|sem-comentarios`
}

export function instantaneoSemComentariosDe(alteracoes: Alteracao[]): Record<string, string> {
  return Object.fromEntries(alteracoes.flatMap(({ arquivo, semComentarios }) => (semComentarios === undefined ? [] : [[arquivo, semComentarios]])))
}

/**
 * Arquivos cujo conteúdo difere entre dois instantâneos, incluindo os que entraram e os que saíram.
 *
 * É como o portão local confere, no fim, que nada mudou enquanto ele rodava: o instantâneo é gravado com o conteúdo
 * do **início**, que é o que as suítes rodaram. Sem essa conferência, arquivo editado no meio da corrida entraria no
 * instantâneo como se tivesse sido testado, e o commit passaria por código que nenhuma suíte viu.
 */
export function arquivosQueMudaram(antes: Record<string, string>, depois: Record<string, string>): string[] {
  return [...new Set([...Object.keys(antes), ...Object.keys(depois)])].filter((arquivo) => antes[arquivo] !== depois[arquivo]).sort()
}

/** Só conta como alteração o arquivo cujo conteúdo difere do que a referência viu. */
function mudouDeVerdade(alteracao: Alteracao, instantaneo: Record<string, string> | undefined): boolean {
  const anterior = instantaneo?.[alteracao.arquivo]
  return anterior === undefined || anterior !== alteracao.hash
}

/** O arquivo mudou, mas sem comentários e sem espaço é igual ao que a referência viu. */
function mudouSoComentario(alteracao: Alteracao, semComentarios: Record<string, string> | undefined): boolean {
  return alteracao.semComentarios !== undefined && semComentarios?.[alteracao.arquivo] === alteracao.semComentarios
}

/**
 * Comentário que muda o que o compilador, o lint, o teste ou o runtime fazem. Mudança num trecho de trivia que tem um
 * destes conta como código. A lista pedida na retrospectiva da A0b é `@ts-`, `eslint-`, `/// <reference`, `@jsx` e
 * `#!`; `eslint` sem hífen cobre também o comentário de configuração (`/* eslint regra: off *\/`), e `@vitest-` o
 * ambiente do teste (`// @vitest-environment jsdom`).
 *
 * Ficam de fora, de propósito, `@vite-ignore`, `#__PURE__` e `v8 ignore`: mudam o build ou a cobertura, que os revisores
 * não aprovam linha a linha. Quem prova build e suíte é o carimbo, e ele não usa esta exceção (`avaliarCarimbo`).
 */
export const MARCAS_DE_DIRETIVA = ['@ts-', 'eslint', '/// <reference', '@jsx', '#!', '@vitest-'] as const

let typescript: typeof TS | null | undefined
/**
 * Carregado só quando há `.ts` alterado: o hook roda a cada revisor e a cada commit, e o compilador pesa. Sem ele (clone
 * sem `node_modules`, antes do `npm ci` do portão local), `null`: não se afirma nada, e toda mudança conta.
 */
function carregarTypescript(): typeof TS | null {
  if (typescript === undefined) {
    try {
      typescript = createRequire(import.meta.url)('typescript') as typeof TS
    } catch {
      typescript = null
    }
  }
  return typescript
}

const EH_TYPESCRIPT = /\.[cm]?tsx?$/

/**
 * O arquivo sem comentários e sem espaço, para dizer se uma mudança foi só de comentário. `null` quando não se aplica
 * (não é `.ts`/`.tsx`, ou não compila como sintaxe), e aí toda mudança conta.
 *
 * Pelo parser, e não pelo scanner sozinho: o scanner não sabe o contexto, e lê como comentário o `//` de uma
 * expressão regular (`/[//]/`) e o de um texto de JSX (`<a>http://x</a>`) — uma mudança de código passaria por
 * comentário, que é o erro que não pode acontecer. A árvore dá cada token no contexto certo; o texto entre dois
 * tokens é trivia (espaço e comentário), e sai. Sai inteiro, espaço junto: formatar também não muda o que os
 * revisores aprovaram. O tipo de cada nó entra na impressão, para `return x` e `return\nx` (que a inserção automática
 * de ponto e vírgula lê diferente) não saírem iguais.
 *
 * A trivia que tem uma marca de `MARCAS_DE_DIRETIVA` fica na impressão, inteira: aí mudar o comentário muda o hash, e
 * tudo caduca como antes. O JSDoc não vira nó (`JSDocParsingMode.ParseNone`) e fica na trivia, como os outros.
 */
export function impressaoSemComentarios(arquivo: string, conteudo: string): string | null {
  if (!EH_TYPESCRIPT.test(arquivo)) return null
  const ts = carregarTypescript()
  if (!ts) return null
  const fonte = ts.createSourceFile(
    arquivo,
    conteudo,
    { languageVersion: ts.ScriptTarget.Latest, jsDocParsingMode: ts.JSDocParsingMode.ParseNone },
    true,
    arquivo.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  // Com erro de sintaxe a recuperação do parser pode deixar texto fora da árvore: aí não se afirma nada. O campo é
  // interno do compilador; se sumir numa versão nova, o hook quebra alto em vez de passar a aceitar tudo.
  if ((fonte as unknown as { parseDiagnostics: readonly unknown[] }).parseDiagnostics.length > 0) return null
  const partes: string[] = []
  const visitar = (no: TS.Node): void => {
    const filhos = no.getChildren(fonte)
    if (filhos.length > 0) {
      partes.push(`(${String(no.kind)}`)
      filhos.forEach(visitar)
      partes.push(')')
      return
    }
    // O texto de JSX não tem trivia: espaço e `//` dentro dele são conteúdo.
    if (no.kind === ts.SyntaxKind.JsxText) {
      partes.push(`${String(no.kind)}:${conteudo.slice(no.pos, no.end)}`)
      return
    }
    const inicio = no.getStart(fonte)
    const trivia = conteudo.slice(no.pos, inicio)
    if (MARCAS_DE_DIRETIVA.some((marca) => trivia.includes(marca))) partes.push(`trivia:${trivia}`)
    partes.push(`${String(no.kind)}:${conteudo.slice(inicio, no.end)}`)
  }
  visitar(fonte)
  return partes.join('\n')
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
//
// Guardar usa só `exigenciaDaRodada`; o resumo do índice tem, além dela, o recuo da primeira linha
// substantiva. A assimetria é de propósito. Revisor que declara "Bloqueantes: nenhum / Recomendações:
// nenhuma" não exigiu nada, e a prosa que ele escreve depois é justificativa, não pedido: guardá-la
// devolveria ao corpus as 172 rodadas aprovadas de 237, que é o peso que esta correção tirou. O recuo
// serve à rodada que **já vai ser guardada** por ter reprovado, para a célula do índice não sair vazia.
//
// A terceira possibilidade é onde se erra: seção **vazia** não é declaração. `Recomendações:` seguido
// de nada aproveitável quer dizer que o conteúdo está fora da seção, e aí a rodada é guardada mesmo
// aprovada — ver `temSecaoSemDeclaracao`. Um bloco real do corpus, com cinco recomendações, se perdeu
// assim quando o filtro de cerca entrou sozinho.
//
// Quem decide é `exigenciaDaRodada`, e não um regex de `Recomendações:`, porque o regex pedia os dois
// pontos: `## Recomendações (não bloqueiam)` seguido dos itens não casava, e a rodada ia para a
// tabela do documento sem bloco nenhum aqui. É o defeito que o `TODO.md` registra desde 20/09/2026.
export function achadoDaRodada(revisao: Revisao, mensagemFinal: string): string | null {
  if (revisao.veredito === 'APROVADO' && !exigenciaDaRodada(mensagemFinal) && !temSecaoSemDeclaracao(mensagemFinal)) return null
  // O corte guarda 80 linhas, mas `resumoDoAchado` lê a mensagem inteira: exigência abaixo da linha
  // 80 vira célula de índice apontando um bloco que não a contém. Disparou uma vez em 214 blocos.
  const linhas = mensagemFinal.trim().split('\n')
  const texto = linhas.length > 80 ? [...linhas.slice(0, 80), `[… ${linhas.length - 80} linhas cortadas]`].join('\n') : linhas.join('\n')
  return `## ${revisao.revisor} · ${revisao.rodada}ª rodada · ${revisao.veredito} · ${revisao.fim}\n\n${texto}\n`
}

/** O arquivo dos achados de um documento. Um por tarefa, spec ou correção — nunca um por pasta. */
export function caminhoDoAchado(documento: string): string {
  return join(dirname(documento), PASTA_ACHADOS, basename(documento))
}

/** O índice da pasta: uma linha por rodada, que é o que se lê antes de codar. */
export function caminhoDoIndice(documento: string): string {
  return join(dirname(documento), PASTA_ACHADOS, NOME_INDICE)
}

export function acrescentarAchado(conteudoAchados: string, documento: string, achado: string): string {
  const base =
    conteudoAchados ||
    `# Achados das revisões — \`${documento}\`\n\nEscrito pelo hook \`tools/processo/revisoes.ts\`. O resumo de cada rodada está em ` +
      `\`${NOME_INDICE}\`, nesta pasta. Não edite à mão.\n`
  const [cabecalho = '', ...resto] = achado.split('\n')
  return `${base.endsWith('\n') ? base : `${base}\n`}\n${cabecalho} · \`${documento}\`\n${resto.join('\n')}`
}

// O que o revisor exigiu, para caber numa linha do índice. As formas abaixo são as que eles de fato
// escrevem nos 214 blocos do F1: `Bloqueantes:`, `**Bloqueantes:**`, `## Bloqueantes`, com ou sem
// `(não bloqueiam)`, e o item na mesma linha ou na linha de baixo.
const CABECALHO_DE_SECAO = /^\s*#{0,4}\s*\**\s*(Bloqueantes|Recomendações)\s*\**\s*(?:\([^)]*\))?\s*\**\s*:?\s*(.*)$/i
const SEM_CONTEUDO = /^(nenhum[ao]?|n\/a|nada)\b[\s.,;:]*$/i
// `Bloqueantes: nenhum. A correção exigida na 1ª rodada foi feita:` — o revisor responde e segue
// falando. O ponto é o que separa a resposta do resto; sem ele, `nenhuma das rotas` é conteúdo.
const COMECA_SEM_NADA = /^(nenhum[ao]?|n\/a|nada)\s*[.;]/i
const nadaExigido = (texto: string) => SEM_CONTEUDO.test(texto) || COMECA_SEM_NADA.test(texto)
const ITEM = /^\s*(?:[-*•]|\d+[.)])\s+/
const CERCA = /^\s*(?:```|~~~)/
const LIMITE_DO_RESUMO = 160
// Quanto o corte pode recuar para não partir palavra. Além disso, corta seco: recuar demais devolve
// um resumo curto demais para dizer alguma coisa.
const RECUO_MAXIMO_DO_CORTE = 40

// Metade dos revisores cita o arquivo pelo caminho absoluto da máquina. Num resumo de 160 caracteres
// o prefixo até a raiz do repositório come a informação, e é igual em todas as linhas.
const ATE_A_RAIZ = /\/\S*?\/(?=(?:apps|packages|infra|e2e|tools|tasks|docs)\/|(?:CLAUDE|TODO|README|ROADMAP)\.md\b)/g

// Negrito antes do marcador de lista: `**texto**` não é item, e tirar o `*` primeiro o quebraria.
function limpar(linha: string): string {
  return linha.replaceAll('**', '').replace(ITEM, '').replaceAll('|', '\\|').replace(ATE_A_RAIZ, '').replace(/\s+/g, ' ').trim()
}

function encurtar(texto: string): string {
  if (texto.length <= LIMITE_DO_RESUMO) return texto
  const corte = texto.slice(0, LIMITE_DO_RESUMO)
  const espaco = corte.lastIndexOf(' ')
  return `${(espaco > LIMITE_DO_RESUMO - RECUO_MAXIMO_DO_CORTE ? corte.slice(0, espaco) : corte).trimEnd()}…`
}

/**
 * Três desfechos, não dois, e confundi-los custou um achado real do corpus:
 *
 * - **ausente**: o revisor não escreveu a seção;
 * - **declarou nada**: escreveu `nenhum`, `nenhuma`, `n/a` — não exigiu, e descartar está certo;
 * - **vazia**: escreveu o cabeçalho e não há texto aproveitável debaixo dele (só cerca de código).
 *   O conteúdo está **fora** da seção, e tratar isso como "nada exigido" apaga o bloco inteiro.
 *
 * O caso real: `test-engineer · 2ª rodada · APROVADO · 2026-09-21 17:26:58`, que tem `Recomendações:`
 * como última linha dentro da cerca e R1 a R5 em prosa depois dela.
 */
interface LeituraDaSecao {
  presente: boolean
  item: string | null
  declarouNada: boolean
}

const AUSENTE: LeituraDaSecao = { presente: false, item: null, declarouNada: false }
const comTexto = (texto: string): LeituraDaSecao =>
  nadaExigido(texto) ? { presente: true, item: null, declarouNada: true } : { presente: true, item: texto, declarouNada: false }

function lerSecao(linhas: string[], nome: RegExp): LeituraDaSecao {
  for (let i = 0; i < linhas.length; i++) {
    const achado = CABECALHO_DE_SECAO.exec(linhas[i] ?? '')
    if (!achado?.[1] || !nome.test(achado[1])) continue
    const naMesmaLinha = limpar(achado[2] ?? '')
    if (naMesmaLinha) return comTexto(naMesmaLinha)
    const corpo: string[] = []
    for (const proxima of linhas.slice(i + 1)) {
      if (CABECALHO_DE_SECAO.test(proxima)) break
      if (proxima.trim()) corpo.push(proxima)
      // Linha em branco encerra só o parágrafo solto; a lista pode ter itens separados por branco.
      else if (corpo.length > 0 && !ITEM.test(corpo[0] ?? '')) break
    }
    const util = corpo.filter((linha) => !CERCA.test(linha))
    const escolhida = limpar(util.find((linha) => ITEM.test(linha)) ?? util[0] ?? '')
    return escolhida ? comTexto(escolhida) : { presente: true, item: null, declarouNada: false }
  }
  return AUSENTE
}

function lerAsDuasSecoes(mensagemFinal: string): { bloqueantes: LeituraDaSecao; recomendacoes: LeituraDaSecao } {
  const linhas = mensagemFinal.split('\n')
  return { bloqueantes: lerSecao(linhas, /^Bloqueantes/i), recomendacoes: lerSecao(linhas, /^Recomenda/i) }
}

/** O primeiro bloqueante, ou a primeira recomendação. `nenhum` conta como nada exigido. */
export function exigenciaDaRodada(mensagemFinal: string): string | null {
  const { bloqueantes, recomendacoes } = lerAsDuasSecoes(mensagemFinal)
  return bloqueantes.item ?? recomendacoes.item
}

/** Seção escrita e sem texto debaixo dela: o que o revisor exigiu está fora, e some se descartarmos. */
export function temSecaoSemDeclaracao(mensagemFinal: string): boolean {
  const { bloqueantes, recomendacoes } = lerAsDuasSecoes(mensagemFinal)
  return [bloqueantes, recomendacoes].some((secao) => secao.presente && !secao.declarouNada && secao.item === null)
}

/** A célula "O que exigiu" do índice. */
export function resumoDoAchado(mensagemFinal: string): string {
  const exigencia = exigenciaDaRodada(mensagemFinal)
  if (exigencia) return encurtar(exigencia)
  // Revisor que não usou nenhuma das duas seções: o `test-engineer` escreve "Cenários exigidos".
  // Cabeçalho de seção não é conteúdo: `Bloqueantes: nenhum. Os dois da rodada 1 estão fechados` é
  // a declaração, e o que o revisor exigiu está nas linhas abaixo dela.
  const linha = mensagemFinal
    .split('\n')
    .filter((texto) => !CABECALHO_DE_SECAO.test(texto))
    .map((texto) => limpar(texto))
    .filter((texto) => !CERCA.test(texto))
    .find((texto) => texto.length >= 40 && !texto.startsWith('VEREDITO') && !nadaExigido(texto))
  return encurtar(linha ?? 'ver o bloco')
}

const CABECALHO_DO_INDICE =
  '# Índice dos achados das revisões\n\n' +
  'Uma linha por rodada que exigiu alguma coisa. O texto inteiro está no arquivo do documento, nesta\n' +
  'pasta (`<documento>.md`), no bloco com o mesmo fim. Escrito pelo hook `tools/processo/revisoes.ts`.\n' +
  'Não edite à mão.\n\n' +
  'Leia este índice antes de codar, e abra só os blocos que interessam à tarefa de agora.\n\n' +
  '| Fim | Revisor | Rodada | Veredito | Documento | O que exigiu |\n|---|---|---|---|---|---|\n'

export function acrescentarNoIndice(conteudoIndice: string, revisao: Revisao, documento: string, resumo: string): string {
  const base = conteudoIndice || CABECALHO_DO_INDICE
  const linha = `| ${revisao.fim} | \`${revisao.revisor}\` | ${String(revisao.rodada)}ª | ${revisao.veredito} | \`${basename(documento, '.md')}\` | ${resumo} |`
  return `${base.endsWith('\n') ? base : `${base}\n`}${linha}\n`
}

const ehArquivoDeTeste = (arquivo: string) => /\.(test|spec)\.tsx?$/.test(arquivo) || /(^|\/)(test|e2e|__fixtures__)\//.test(arquivo)

// Quem lê o comentário como parte do que aprova: a regra do módulo mora no docblock, e comentário que afirma o que o
// código não faz é achado dele. Para os outros, mudança só de comentário não mexe no que aprovaram.
const REVISOR_DE_COMENTARIO = 'revisor-geral'

// A alteração mais recente, depois do início da rodada, que o revisor ainda não viu e que importa para ele.
export function alteracaoQueCaduca(
  revisor: string,
  inicioDaRodada: string,
  alteracoes: Alteracao[],
  instantaneo?: Record<string, string>,
  semComentarios?: Record<string, string>,
): Alteracao | null {
  const inicio = Math.floor(lerHora(inicioDaRodada) / 1000)
  return alteracoes
    .filter((alteracao) => Math.floor(alteracao.quando / 1000) > inicio)
    .filter((alteracao) => mudouDeVerdade(alteracao, instantaneo))
    .filter((alteracao) => revisor === REVISOR_DE_COMENTARIO || !mudouSoComentario(alteracao, semComentarios))
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
    // Sem a exceção de comentário, de propósito: comentário muda lint (`no-irregular-whitespace`) e teste que varre o
    // texto do fonte (`guardas.test.ts`, `arquitetura.test.ts`, `porta-unica.test.ts`). O carimbo só vale para o que as
    // suítes viram (`test-engineer`, retrospectiva da A0b).
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

/**
 * O veredito do portão do commit. Recebe os instantâneos de conteúdo (`.processo/conteudo.json`) porque a alteração
 * que interessa é a de conteúdo, não a de `mtime`: os revisores provam a guarda mutando o arquivo e restaurando, e sem
 * eles o commit ficava bloqueado para sempre depois do primeiro teste de mutação — a guarda empurrava para a revisão
 * pior (correção `2026-09-22-hook-do-commit-ignora-o-instantaneo-de-conteudo`). Sem instantâneo, de rodada antiga,
 * vale o `mtime`, que é a leitura restrita e caduca na primeira rodada nova.
 */
export function avaliarPortao(entrada: {
  obrigatorios: string[]
  revisoes: Revisao[]
  alteracoes: Alteracao[]
  carimbo: Carimbo | null
  mensagemCommit: string
  /** O documento da tarefa ou da correção, relativo à raiz: é ele que dá a chave do instantâneo de cada rodada. */
  documento: string
  /** Obrigatório de propósito: foi o parâmetro opcional, esquecido na chamada, que criou o defeito que esta assinatura fecha. */
  instantaneos: Instantaneos
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
    const chave = chaveDaRodada(entrada.documento, revisor, ultima.rodada)
    const alteracao = alteracaoQueCaduca(revisor, ultima.inicio, entrada.alteracoes, entrada.instantaneos[chave], entrada.instantaneos[chaveSemComentarios(chave)])
    if (alteracao) {
      bloqueios.push(
        `${revisor}: ${alteracao.arquivo} mudou em ${formatarHora(new Date(alteracao.quando))}, depois do início da ${ultima.rodada}ª rodada (${ultima.inicio}). ` +
          'A revisão vale para o código que o revisor viu: chame uma rodada nova, com o diff desde a rodada aprovada.',
      )
    }
  }
  const carimbo = avaliarCarimbo(entrada.carimbo, suitesExigidas(entrada.obrigatorios), entrada.alteracoes, entrada.instantaneos[CHAVE_DO_PORTAO])
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
    if (achado && revisao) {
      const caminhoAchado = join(raiz, caminhoDoAchado(relativo))
      mkdirSync(dirname(caminhoAchado), { recursive: true })
      const anterior = existsSync(caminhoAchado) ? readFileSync(caminhoAchado, 'utf8') : ''
      writeFileSync(caminhoAchado, acrescentarAchado(anterior, relativo, achado))
      // Trava própria, dentro da do documento: o índice é da pasta, e dois documentos a compartilham.
      // A ordem é sempre documento e depois índice, então não há ciclo.
      const caminhoIndice = join(raiz, caminhoDoIndice(relativo))
      comTrava(caminhoIndice, () => {
        const indice = existsSync(caminhoIndice) ? readFileSync(caminhoIndice, 'utf8') : ''
        writeFileSync(caminhoIndice, acrescentarNoIndice(indice, revisao, relativo, resumoDoAchado(mensagemFinal)))
      })
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
    .map((arquivo) => {
      const conteudo = readFileSync(join(raiz, arquivo))
      const impressao = impressaoSemComentarios(arquivo, conteudo.toString('utf8'))
      return {
        arquivo,
        quando: statSync(join(raiz, arquivo)).mtimeMs,
        hash: createHash('sha256').update(conteudo).digest('hex'),
        ...(impressao === null ? {} : { semComentarios: createHash('sha256').update(impressao).digest('hex') }),
      }
    })
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
/**
 * Grava o instantâneo de uma chave, com trava própria no arquivo: ele é de todos os documentos, e o ler-modificar-gravar
 * sem trava perde a chave de quem escreveu junto.
 *
 * Não é hipótese: os guardiões rodam em paralelo com o `revisor-geral`, e medindo com seis revisores em seis documentos
 * da mesma árvore, 4 de 6 execuções perderam o instantâneo de um deles (`test-engineer`). A rodada que fica sem
 * instantâneo cai no `mtime` e volta a bloquear o commit de quem fez teste de mutação — o defeito que esta correção
 * existe para matar (regra 80, item 7). A ordem é documento e depois conteúdo, a mesma do índice, então não há ciclo.
 */
export function gravarInstantaneo(raiz: string, chave: string, alteracoes: Alteracao[]): void {
  const caminho = join(raiz, CAMINHO_CONTEUDO)
  // Antes da trava: ela é um diretório irmão, e precisa da pasta de pé.
  mkdirSync(join(raiz, dirname(CAMINHO_CONTEUDO)), { recursive: true })
  comTrava(caminho, () => {
    const instantaneos = lerInstantaneos(raiz)
    instantaneos[chave] = instantaneoDe(alteracoes)
    // Gravado também na chave do portão, onde ninguém o lê: o carimbo não tem a exceção de comentário
    // (`avaliarCarimbo`). Fica pela simetria de uma gravação só, não porque o carimbo o use.
    instantaneos[chaveSemComentarios(chave)] = instantaneoSemComentariosDe(alteracoes)
    writeFileSync(caminho, `${JSON.stringify(instantaneos, null, 2)}\n`)
  })
}

/** A chave do instantâneo de uma rodada. O documento identifica a tarefa, a spec ou a correção. */
export function chaveDaRodada(documento: string, revisor: string, rodada: number): string {
  return `${documento}|${revisor}|${String(rodada)}`
}

/**
 * O fim do portão local: carimba, ou recusa dizendo o que mudou. Devolve o motivo da recusa, ou `null` quando
 * carimbou.
 *
 * A recusa é o que fecha a classe "valida sem prova": o instantâneo guarda o conteúdo do **início**, que é o que as
 * suítes rodaram, e arquivo editado no meio da corrida não pode entrar nele como testado. A decisão mora aqui para
 * ter teste de unidade; **onde** o conteúdo é lido é do `portao-local.ts`, e está provado pelo caso que roda o script
 * como processo contra um repositório de fixture ("o portão local, rodado como processo…", em `revisoes.test.ts`).
 */
export function carimbarSeNadaMudou(raiz: string, carimbo: Carimbo, noInicio: Alteracao[]): string | null {
  const mudaram = arquivosQueMudaram(instantaneoDe(noInicio), instantaneoDe(alteracoesDeCodigo(raiz, arquivosAlterados(raiz))))
  if (mudaram.length > 0) return `${mudaram.join(', ')} mudou enquanto o portão rodava: as suítes não provaram este conteúdo. Nenhum carimbo gravado.`
  gravarCarimbo(raiz, carimbo)
  gravarInstantaneo(raiz, CHAVE_DO_PORTAO, noInicio)
  return null
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
    documento: documento.caminho,
    instantaneos: lerInstantaneos(raiz),
  })
  if (bloqueios.length === 0) return null
  return `Commit bloqueado: revisões de ${documento.caminho} incompletas.\n- ${bloqueios.join('\n- ')}`
}
