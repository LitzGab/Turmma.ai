// O portão do commit: o que a tarefa e a correção exigem do carimbo e dos revisores, e a decisão do hook sobre o
// `git commit` e o `git push` (`portao`, chamado por `hook-revisoes.ts`).
//
// `portao` (PreToolUse do Bash): bloqueia `git commit ... (tarefa N.0)` e `git commit ... (correção
// <slug>)` enquanto algum revisor obrigatório não tiver uma rodada que ainda valha para o código
// atual, com APROVADO quando o revisor tem veto, enquanto o portão local (typecheck, lint, testes)
// não tiver passado depois da última alteração, ou enquanto a mensagem não trouxer a linha
// "Revisões:". Bloqueia também commit que leva código sem nenhuma das duas marcas.
//
// A terceira marca é `(mvp: <resumo>)`, da fatia do MVP de apresentação (D77): não tem documento de
// tarefa nem revisor por commit (os revisores passam por fase), e por isso sobra só o portão local
// carimbado. Vale só em branch `mvp/…`, para o processo enxuto não vazar para a `develop`.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import {
  alteracaoQueCaduca,
  alteracoesDeCodigo,
  arquivosAlterados,
  arquivosQueMudaram,
  CHAVE_DO_PORTAO,
  chaveDaRodada,
  chaveSemComentarios,
  gravarInstantaneo,
  instantaneoDe,
  lerInstantaneos,
  mudouDeVerdade,
  type Alteracao,
  type Instantaneos,
} from './caducidade.ts'
import {
  antesDoCommit,
  arquivosDoCommit,
  arquivosPreparados,
  arvoreDoCommit,
  branchAtual,
  documentoDoCommit,
  ehCommit,
  marcadorDoMvp,
  pastaDoCommit,
  pushDoTime,
} from './comando-git.ts'
import { formatarHora, lerRevisoes, REVISORES_COM_VETO, revisoresObrigatorios, tipoDoDocumento, type EntradaHook, type Revisao } from './documento-de-revisao.ts'

export { PAPEIS_DO_TIME } from './comando-git.ts'

// Código só entra por tarefa ou por correção, as duas com revisores; na fatia do MVP de apresentação, por
// `(mvp: <resumo>)`, com o portão local (D77).
export const PASTAS_DE_CODIGO = ['apps/', 'packages/', 'infra/', 'e2e/']

/** Onde o marcador `(mvp: …)` vale: a branch da fatia e as dos pacotes dela (D77). */
export const PREFIXO_DAS_BRANCHES_DO_MVP = 'mvp/'
/**
 * O que o portão local precisa ter rodado para um commit do MVP. Sem `e2e` nem `infra`, de propósito: a D77 troca a
 * esteira por commit pela esteira disparada à mão no fim de cada fase, e é ela que roda os dois.
 */
export const SUITES_DO_MVP = ['typecheck', 'lint', 'test']

export const CAMINHO_CARIMBO = '.processo/portao.json'

export interface Carimbo {
  inicio: string
  suites: string[]
  /** Só no portão da tarefa: o documento da tarefa ou da correção que ele achou. É o que diz de quem é o carimbo (RF17). */
  documento?: string
  /** Só no portão da tarefa: os arquivos de teste que ele rodou, além da unidade inteira. */
  alvos?: string[]
  /** As mutações que o portão da tarefa conferiu, e de que documento (`tools/processo/mutacoes.ts`). */
  mutacoes?: { documento: string; impressao: string; total: number }
}

/**
 * Conferência a mais sobre o documento do commit, que quem chama o portão entrega. Existe para este módulo não importar
 * o `mutacoes.ts`, que roda processo. O módulo que roda sozinho, antes do `npm ci`, é o `caducidade.ts`
 * (`impressaoSemComentarios`, e o teste que o copia para fora do repositório). Hoje é a das mutações (`avaliarMutacoes`),
 * entregue por `hook-revisoes.ts` e `portao-local.ts`. Recebe também os arquivos alterados da árvore, porque a exigência
 * do RF17 (produção sem mutação não recebe carimbo) depende de haver produção, e é por aqui, e não dentro do
 * `avaliarPortao`, que ela chega ao commit: o `avaliarPortao` não pode importar o `mutacoes.ts`.
 */
export type ConferenciaDoDocumento = (carimbo: Carimbo | null, documento: string, conteudo: string, alterados: string[]) => string | null

/** O portão completo: tudo, como a esteira. Roda uma vez por spec, antes da validação (D78 revista em 09/10/2026). */
export const SUITES_DO_PORTAO_COMPLETO = ['typecheck', 'lint', 'segredo', 'dependencias', 'test', 'e2e', 'infra']
/**
 * O portão da tarefa: tipos, lint, a unidade inteira e os testes de integração, de infra e de e2e que a árvore alterou.
 * `alvo` é a suíte desses arquivos; com `unidade`, vale por `test` no commit de tarefa e de correção.
 */
export const SUITES_DO_PORTAO_DA_TAREFA = ['typecheck', 'lint', 'segredo', 'dependencias', 'unidade', 'alvo']

export interface AlvosDoPortao {
  integracao: string[]
  e2e: string[]
  infra: string[]
}

/**
 * Os testes que o portão da tarefa roda, tirados do que está alterado na árvore: o teste novo ou mexido é o que prova a
 * regra da tarefa. O resto do sistema fica para o portão completo, no fim da spec.
 *
 * Na noite de 08/10/2026 o portão inteiro levou de 30 a 40 minutos e foi de 70% a quase 100% do tempo de cada tarefa:
 * a 6.0 foi escrita em 6 minutos e passou cinco horas rodando o portão inteiro a cada tentativa de acertar um e2e.
 */
export function alvosDoPortao(arquivos: string[]): AlvosDoPortao {
  const fora = /(^|\/)(node_modules|dist)\/|^tools\/ci\/fixtures\//
  const validos = [...new Set(arquivos)].filter((arquivo) => !fora.test(arquivo)).sort()
  return {
    integracao: validos.filter((arquivo) => /\.int\.test\.ts$/.test(arquivo) && !arquivo.startsWith('infra/') && !arquivo.startsWith('e2e/')),
    e2e: validos.filter((arquivo) => /^e2e\/.*\.spec\.ts$/.test(arquivo)),
    infra: validos.filter((arquivo) => /^infra\/.*\.int\.test\.ts$/.test(arquivo)),
  }
}

/**
 * O que o commit de tarefa e de correção exige do carimbo. Até 08/10/2026 a tarefa com `frontend-reviewer` exigia o e2e
 * inteiro, e a com `infra-guardian`, a suíte de infra inteira. Agora os dois rodam inteiros uma vez, no portão completo
 * do fim da spec, e na tarefa rodam só os arquivos que ela alterou (`alvosDoPortao`).
 *
 * `segredo` (gitleaks) e `dependencias` (`npm audit`) são as duas guardas da esteira que não são teste. Levam segundos,
 * e sem elas a surpresa ficava para o fim da spec: em 09/10/2026 o gitleaks já reprovava a branch da F3, por uma linha
 * `Sort Key:` de um `EXPLAIN` colado no documento da 5.0, e ninguém saberia até a esteira do pouso.
 */
export function suitesExigidas(): string[] {
  return ['typecheck', 'lint', 'segredo', 'dependencias', 'test']
}

/** `test` vale pela suíte inteira ou, no portão da tarefa, pela unidade inteira mais os alvos. */
function carimboCobre(carimbo: Carimbo, suite: string): boolean {
  if (carimbo.suites.includes(suite)) return true
  return suite === 'test' && carimbo.suites.includes('unidade') && carimbo.suites.includes('alvo')
}

export function avaliarCarimbo(carimbo: Carimbo | null, exigidas: string[], alteracoes: Alteracao[], instantaneo?: Record<string, string>): string | null {
  const completo = exigidas.includes('e2e') || exigidas.includes('infra')
  const comando = completo ? 'node tools/processo/portao-local.ts --e2e --infra' : 'node tools/processo/portao-local.ts --tarefa'
  if (!carimbo) return `portão local: nunca passou nesta árvore. Rode \`${comando}\`.`
  const faltando = exigidas.filter((suite) => !carimboCobre(carimbo, suite))
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
      bloqueios.push(`${revisor}: nenhuma rodada registrada. Peça a rodada à Mesa de revisão; o prompt do revisor começa com a linha "Tarefa: <caminho do documento>".`)
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
  const carimbo = avaliarCarimbo(entrada.carimbo, suitesExigidas(), entrada.alteracoes, entrada.instantaneos[CHAVE_DO_PORTAO])
  if (carimbo) bloqueios.push(carimbo)
  const linhaResumo = `Revisões: ${resumo.join(', ')}`
  // A linha só é cobrada com os revisores em ordem: antes disso, o exemplo sairia incompleto.
  if (bloqueios.length === 0 && entrada.obrigatorios.length > 0 && !/^Revisões:/m.test(entrada.mensagemCommit)) {
    bloqueios.push(`A mensagem do commit precisa da linha de revisões, por exemplo:\n${linhaResumo}`)
  }
  return { bloqueios, linhaResumo }
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

/**
 * O veredito do commit do MVP (D77): a branch certa e o portão local valendo para o código de agora. Não há revisor a
 * conferir aqui — na fatia do MVP eles passam uma vez por fase —, então o carimbo é a única prova, e ele não tem a
 * exceção de comentário (`avaliarCarimbo`).
 */
export function avaliarCommitDoMvp(entrada: {
  /** A branch da árvore; vazia com o HEAD solto. */
  branch: string
  carimbo: Carimbo | null
  alteracoes: Alteracao[]
  instantaneo: Record<string, string> | undefined
}): string | null {
  if (!entrada.branch.startsWith(PREFIXO_DAS_BRANCHES_DO_MVP)) {
    return (
      `Commit bloqueado: o marcador "(mvp: …)" só vale em branch ${PREFIXO_DAS_BRANCHES_DO_MVP}… (D77), e esta é ${entrada.branch || 'um HEAD solto'}. ` +
      'Fora da fatia do MVP, código entra por tarefa ou por correção, que passam pelos revisores.'
    )
  }
  const carimbo = avaliarCarimbo(entrada.carimbo, SUITES_DO_MVP, entrada.alteracoes, entrada.instantaneo)
  return carimbo ? `Commit bloqueado: ${carimbo}` : null
}

/** O bloqueio do que o comando faz antes do `git commit`, ou de a árvore do commit não ser conhecida; `null` quando nenhum dos dois acontece. */
function bloqueioAntesDaArvore(comando: string, raizDaSessao: string, cwd: string | undefined): string | null {
  const estranho = antesDoCommit(comando)
  if (estranho !== null) {
    return (
      `Commit bloqueado: o comando faz outra coisa antes do \`git commit\` (${estranho}). O hook confere a árvore antes de o comando rodar, e o que ` +
      'este comando criar ou alterar entraria no commit sem ter sido conferido. Faça as alterações num comando, e o `git add` com o `git commit` em ' +
      'outro. Se o `git commit` está só dentro de um texto (uma mensagem para outro agente, o conteúdo de um arquivo), grave o texto num arquivo em ' +
      'vez de escrevê-lo no comando.'
    )
  }
  const onde = pastaDoCommit(comando, raizDaSessao, cwd)
  if (onde && 'indeterminado' in onde) {
    return (
      `Commit bloqueado: o hook não sabe em que árvore este commit acontece, porque o caminho ${onde.indeterminado} depende de uma variável que o ` +
      'comando não define. Escreva o caminho por extenso, ou atribua a variável no próprio comando (`F=/caminho; git -C "$F" commit …`).'
    )
  }
  return null
}

/** O commit que não cita documento: passa quando não leva código, vale pelo `(mvp: …)` na fatia do MVP, e bloqueia nos outros casos. */
function bloqueioDoCommitSemDocumento(comando: string, raiz: string, arquivos: string[]): string | null {
  const codigo = arquivosDoCommit(comando, raiz, arquivos, arquivosPreparados(raiz)).filter((arquivo) =>
    PASTAS_DE_CODIGO.some((pasta) => arquivo.startsWith(pasta)),
  )
  if (codigo.length === 0) return null
  if (marcadorDoMvp(comando) !== null) {
    return avaliarCommitDoMvp({
      branch: branchAtual(raiz),
      carimbo: lerCarimbo(raiz),
      alteracoes: alteracoesDeCodigo(raiz, arquivos),
      instantaneo: lerInstantaneos(raiz)[CHAVE_DO_PORTAO],
    })
  }
  return (
    `Commit bloqueado: ele leva código (${codigo.slice(0, 3).join(', ')}${codigo.length > 3 ? ', …' : ''}) sem "(tarefa N.0)" nem "(correção <slug>)". ` +
    'Código entra por tarefa ou por correção, que passam pelos revisores (o Orquestrador conduz, com /seguir). ' +
    `Na fatia do MVP de apresentação (D77), em branch ${PREFIXO_DAS_BRANCHES_DO_MVP}…, o marcador é "(mvp: <resumo>)", com o portão local carimbado.`
  )
}

/** As revisões, o portão carimbado e a conferência a mais do documento que o commit cita. */
function bloqueioDoDocumento(
  comando: string,
  raiz: string,
  arquivos: string[],
  caminho: string,
  conferencia: ConferenciaDoDocumento,
): string | null {
  const conteudo = readFileSync(join(raiz, caminho), 'utf8')
  const { bloqueios } = avaliarPortao({
    obrigatorios: revisoresObrigatorios(conteudo, tipoDoDocumento(caminho)),
    revisoes: lerRevisoes(conteudo),
    alteracoes: alteracoesDeCodigo(raiz, arquivos),
    carimbo: lerCarimbo(raiz),
    mensagemCommit: comando,
    documento: caminho,
    instantaneos: lerInstantaneos(raiz),
  })
  const aMais = conferencia(lerCarimbo(raiz), caminho, conteudo, arquivos)
  if (aMais !== null) bloqueios.push(aMais)
  if (bloqueios.length === 0) return null
  return `Commit bloqueado: revisões de ${caminho} incompletas.\n- ${bloqueios.join('\n- ')}`
}

export function portao(
  entrada: EntradaHook,
  raizDaSessao: string,
  papel: string | undefined = process.env['CLAUDE_CODE_AGENT'],
  conferencia: ConferenciaDoDocumento = () => null,
): string | null {
  const comando = entrada.tool_input?.command ?? ''
  const push = pushDoTime(comando, raizDaSessao, entrada.cwd, papel)
  if (push !== null) return push
  if (!ehCommit(comando)) return null
  const antes = bloqueioAntesDaArvore(comando, raizDaSessao, entrada.cwd)
  if (antes !== null) return antes
  const raiz = arvoreDoCommit(comando, raizDaSessao, entrada.cwd)
  const arquivos = arquivosAlterados(raiz)
  const documento = documentoDoCommit(comando, raiz, arquivos)
  if (!documento) return bloqueioDoCommitSemDocumento(comando, raiz, arquivos)
  if ('erro' in documento) return documento.erro
  return bloqueioDoDocumento(comando, raiz, arquivos, documento.caminho, conferencia)
}
