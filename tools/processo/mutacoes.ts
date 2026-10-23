// As mutações da tarefa, conferidas por máquina (D79, proposta M1 da retrospectiva do F3).
//
// A maior causa de reprovação do F3 (17 em 14 tarefas, grupo A) foi regra ou cláusula sem teste que falhe sem ela, e
// em cinco delas a seção "Mutações" afirmava um vermelho que não acontecia. Três rodadas de texto ("rode a mutação",
// "termo a termo", "confira antes da primeira rodada") não mexeram no número. Aqui a seção vira entrada do portão da
// tarefa: cada bloco diz o arquivo, o trecho, o que entra no lugar e o teste; o portão aplica, roda o teste, exige
// vermelho e restaura. O carimbo guarda a impressão dos blocos, e o commit é bloqueado se eles mudaram depois.
//
// O bloco, no documento da tarefa ou da correção:
//
//   ```mutacao
//   arquivo: apps/api/src/privacidade/titulares.repository.ts
//   teste: apps/api/test/pedido-titular.int.test.ts › a coordenação de outra escola não acha o pedido
//     .where(and(
//   -   eq(pedidos.escolaId, escolaId),
//       eq(pedidos.id, id),
//   ```
//
// Depois das duas linhas de cabeçalho vem um pedaço de diff: linha que começa com `-` sai, com `+` entra, e com espaço
// é contexto, que fica e serve para o trecho existir uma vez só no arquivo. O espaço do começo e do fim de cada linha
// não conta. Em `teste:`, o nome do caso depois de ` › ` é opcional: sem ele roda o arquivo inteiro.
//
// Uma terceira linha de cabeçalho, `projeto: celular`, é opcional e só vale para teste de e2e: diz em que projeto do
// Playwright o caso roda. Sem ela é o `chromebook`. A cláusula que só existe no celular (o ramo de toque, o menu de baixo)
// não é alcançada no computador, e o teste ficaria verde sem ela; o bloco diz onde ela se prova.
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface Mutacao {
  arquivo: string
  teste: string
  /** O nome do caso, ou um pedaço dele. `null`: o arquivo de teste inteiro. */
  caso: string | null
  /** O projeto do Playwright onde o caso de e2e roda. Ausente: `chromebook`. Só o bloco que declara a linha o tem. */
  projeto?: ProjetoDoE2e
  /** O que tem de estar no arquivo hoje: contexto e linhas que saem, na ordem. */
  antes: string[]
  /** O que fica no lugar: contexto e linhas que entram, na ordem. */
  depois: string[]
}

export interface Leitura {
  mutacoes: Mutacao[]
  /** Bloco que não deu para ler: o portão recusa antes de rodar qualquer coisa. */
  erros: string[]
}

/** Os projetos de `playwright.config.ts`. O primeiro é o que vale quando o bloco não diz. */
export const PROJETOS_DO_E2E = ['chromebook', 'celular'] as const
export type ProjetoDoE2e = (typeof PROJETOS_DO_E2E)[number]

const BLOCO = /^```mutacao[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gm

/** Lê os blocos `mutacao` de um documento. Bloco malformado vira erro com o número dele, e não some. */
export function lerMutacoes(documento: string): Leitura {
  const mutacoes: Mutacao[] = []
  const erros: string[] = []
  let numero = 0
  for (const bloco of documento.matchAll(BLOCO)) {
    numero += 1
    const linhas = (bloco[1] ?? '').split(/\r?\n/)
    let arquivo: string | null = null
    let teste: string | null = null
    let projeto: string | null = null
    const antes: string[] = []
    const depois: string[] = []
    let saiAlguma = false
    let erro: string | null = null
    for (const linha of linhas) {
      if (linha.trim() === '') continue
      const cabecalho = /^(arquivo|teste|projeto):\s*(.+?)\s*$/.exec(linha)
      if (cabecalho && antes.length === 0 && depois.length === 0) {
        if (cabecalho[1] === 'arquivo') arquivo = cabecalho[2] ?? null
        else if (cabecalho[1] === 'teste') teste = cabecalho[2] ?? null
        else projeto = cabecalho[2] ?? null
        continue
      }
      const marca = linha[0]
      const texto = linha.slice(1).trim()
      if (marca === '-') {
        antes.push(texto)
        saiAlguma = true
      } else if (marca === '+') depois.push(texto)
      else if (marca === ' ') {
        antes.push(texto)
        depois.push(texto)
      } else {
        erro = `linha "${linha}" não começa com "-", "+" nem espaço`
        break
      }
    }
    if (!erro && !arquivo) erro = 'falta a linha "arquivo:"'
    if (!erro && !teste) erro = 'falta a linha "teste:"'
    if (!erro && !saiAlguma) erro = 'nenhuma linha começa com "-": a mutação precisa tirar ou trocar um trecho que existe'
    if (!erro && antes.join('\n') === depois.join('\n')) erro = 'o que entra é igual ao que sai'
    if (!erro && projeto !== null) {
      if (!PROJETOS_DO_E2E.some((nome) => nome === projeto)) erro = `projeto "${projeto}" não existe (${PROJETOS_DO_E2E.join(' ou ')})`
      else if (tipoDoTeste((teste ?? '').split(' › ')[0]?.trim() ?? '') !== 'e2e') erro = '"projeto:" só vale para teste de e2e'
    }
    if (erro || !arquivo || !teste) {
      erros.push(`mutação ${String(numero)}: ${erro ?? 'bloco incompleto'}`)
      continue
    }
    const [caminhoDoTeste = '', ...caso] = teste.split(' › ')
    const doBloco = PROJETOS_DO_E2E.find((nome) => nome === projeto)
    mutacoes.push({
      arquivo,
      teste: caminhoDoTeste.trim(),
      caso: caso.length > 0 ? caso.join(' › ').trim() : null,
      ...(doBloco ? { projeto: doBloco } : {}),
      antes,
      depois,
    })
  }
  return { mutacoes, erros }
}

/**
 * A impressão dos blocos, que o carimbo guarda. Sai do que o portão conferiu, e não do texto da seção: reescrever a
 * frase em volta não invalida nada, e mudar um trecho, um teste ou acrescentar um bloco invalida.
 */
export function impressaoDasMutacoes(mutacoes: readonly Mutacao[]): string {
  return createHash('sha256').update(JSON.stringify(mutacoes)).digest('hex').slice(0, 16)
}

function escapar(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Aplica a mutação ao conteúdo do arquivo. O trecho tem de existir **uma** vez: zero é linha velha (o código mudou
 * depois de ela ser escrita, que foi o defeito da 15.0 do F3), e duas ou mais é trecho que não diz qual cláusula sai.
 */
export function aplicarMutacao(conteudo: string, mutacao: Mutacao): { mutado: string } | { recusa: string } {
  const trecho = new RegExp(mutacao.antes.map(escapar).join('[ \\t]*\\r?\\n[ \\t]*'), 'g')
  const achados = [...conteudo.matchAll(trecho)]
  if (achados.length === 0) return { recusa: `o trecho não está em ${mutacao.arquivo}: o código mudou depois de a mutação ser escrita` }
  if (achados.length > 1) {
    return { recusa: `o trecho aparece ${String(achados.length)} vezes em ${mutacao.arquivo}: acrescente linhas de contexto (começadas por espaço) até sobrar uma` }
  }
  const achado = achados[0]
  if (!achado) return { recusa: 'trecho não localizado' }
  const inicio = achado.index
  // O recuo da primeira linha do trecho vale para as que entram: o arquivo mutado continua legível se o teste falhar.
  const recuo = /[ \t]*$/.exec(conteudo.slice(0, inicio).split('\n').at(-1) ?? '')?.[0] ?? ''
  const novo = mutacao.depois.join(`\n${recuo}`)
  return { mutado: conteudo.slice(0, inicio) + novo + conteudo.slice(inicio + achado[0].length) }
}

export type TipoDeTeste = 'unidade' | 'integracao' | 'infra' | 'e2e'

export function tipoDoTeste(teste: string): TipoDeTeste | null {
  if (/^e2e\/.*\.spec\.ts$/.test(teste)) return 'e2e'
  if (/^infra\/.*\.int\.test\.ts$/.test(teste)) return 'infra'
  if (/\.int\.test\.ts$/.test(teste)) return 'integracao'
  if (/\.test\.tsx?$/.test(teste)) return 'unidade'
  return null
}

/** O que serve a web e as APIs ao e2e são imagens construídas: mutar o fonte sem reconstruir não muda o que o teste vê. */
export function pedeReconstrucao(mutacao: Mutacao): boolean {
  return tipoDoTeste(mutacao.teste) === 'e2e' && /^(apps|packages)\//.test(mutacao.arquivo)
}

/**
 * O comando que roda o teste de uma mutação. No e2e, um projeto só, o que o bloco declara (`chromebook` sem a linha): a
 * mutação prova a regra, não o perfil de máquina, mas a regra que só vale no celular só cai lá.
 */
export function comandoDoTeste(mutacao: Mutacao): string[] | null {
  const tipo = tipoDoTeste(mutacao.teste)
  if (tipo === null) return null
  if (tipo === 'e2e') {
    const filtro = [...(mutacao.caso ? [`--grep=${mutacao.caso}`] : []), `--project=${mutacao.projeto ?? PROJETOS_DO_E2E[0]}`]
    return pedeReconstrucao(mutacao)
      ? ['node', 'tools/ci/e2e.ts', '--manter-ambiente', mutacao.teste, ...filtro]
      : ['npx', 'playwright', 'test', mutacao.teste, ...filtro]
  }
  return ['npx', 'vitest', 'run', '--project', tipo, mutacao.teste, ...(mutacao.caso ? ['-t', mutacao.caso] : [])]
}

export interface Resultado {
  mutacao: Mutacao
  /** `vermelho` é o único que passa: o teste caiu com a cláusula fora. `recusada` inclui o teste que passou do prazo. */
  veredito: 'vermelho' | 'verde' | 'recusada'
  motivo?: string
}

/** O teto de uma corrida, da limpa e da mutada: acima disso o teste trava, e não demora (RF4, M3 da X5). */
export const TETO_DA_CORRIDA_MS = 10 * 60_000
/** O piso do prazo da mutada: a limpa de 1 s não faz de 3 s o prazo de um teste que sobe o compose. */
export const PISO_DO_PRAZO_MS = 60_000
/** Do SIGTERM ao SIGKILL no grupo do teste que passou do prazo. */
export const ESPERA_ATE_SIGKILL_MS = 5_000
/** O `testTimeout` do Vitest quando o projeto não declara (`vitest.config.ts`). */
const TESTTIMEOUT_PADRAO_DO_VITEST_MS = 5_000
/** O `timeout` do Playwright quando o caso não declara (`playwright.config.ts`); `test.slow()` triplica. */
const TIMEOUT_PADRAO_DO_E2E_MS = 30_000

/**
 * O que a corrida devolve: `true` passou, `false` caiu, `'estourou'` foi morta no prazo. O relógio de quem chama também
 * decide (um `rodar` que não sabe medir só devolve `false`), e a corrida que levou mais que o prazo conta como estourada.
 */
export type Rodar = (comando: string[], prazoMs?: number) => boolean | 'estourou'

export interface OpcoesDaConferencia {
  /** O relógio, em ms. Injetado, a corrida de 61 s não espera 61 s. */
  agora?: () => number
  /** O prazo da mutada, dado o que a limpa levou e o `testTimeout` da mutação. Injetado, o teste de processo usa 2 s. */
  prazoDaMutada?: (limpaMs: number, testTimeoutMs: number) => number
  /** O `testTimeout` de uma mutação. Sem ele, lê o do caso no arquivo de teste e o do projeto na configuração. */
  testTimeoutMs?: (mutacao: Mutacao) => number
}

/**
 * O prazo da mutada: o maior entre 3 × a corrida limpa, o `testTimeout` (o do caso, ou o do projeto) e 60 s, e nunca
 * mais que 10 min. Teste que cai com a cláusula fora cai antes do que o limpo leva; o que passa disso travou.
 */
export function prazoDaMutada(limpaMs: number, testTimeoutMs: number): number {
  return Math.min(TETO_DA_CORRIDA_MS, Math.max(3 * limpaMs, testTimeoutMs, PISO_DO_PRAZO_MS))
}

function numero(texto: string): number {
  return Number(texto.replaceAll('_', ''))
}

/** O `testTimeout` que o projeto declara em `vitest.config.ts`, ou o padrão do Vitest. No e2e (ou sem teste), o `timeout` do Playwright. */
export function testTimeoutDoProjeto(configuracao: string, tipo: TipoDeTeste | null): number {
  if (tipo === null || tipo === 'e2e') return TIMEOUT_PADRAO_DO_E2E_MS
  // `unidade` não declara: a integração e a infra repartem o mesmo objeto, que declara.
  if (tipo === 'unidade') return TESTTIMEOUT_PADRAO_DO_VITEST_MS
  const [declarado] = [...configuracao.matchAll(/\btestTimeout:\s*([\d_]+)/g)].map((achado) => numero(achado[1] ?? '0'))
  return declarado ?? TESTTIMEOUT_PADRAO_DO_VITEST_MS
}

/**
 * O prazo que o caso citado declara no próprio arquivo de teste: `it('nome', async () => { … }, 120_000)`,
 * `{ timeout: 120_000 }`, `test.setTimeout(120_000)` ou `test.slow()` (3 × o padrão do e2e). O trecho do caso vai do nome dele
 * até o próximo `it('`/`test('`/`describe('` que começa a linha (com o nome do caso, e não `test.setTimeout(`). `null`: o caso não declara, ou a mutação roda o arquivo todo.
 */
export function testTimeoutDoCaso(fonteDoTeste: string, caso: string | null): number | null {
  const trecho = caso === null ? undefined : trechoDoCaso(fonteDoTeste, caso)
  if (trecho === undefined) return null
  const setTimeout = /\btest\.setTimeout\(\s*([\d_]+)\s*\)/.exec(trecho)
  if (setTimeout) return numero(setTimeout[1] ?? '0')
  if (/\btest\.slow\(\s*\)/.test(trecho)) return 3 * TIMEOUT_PADRAO_DO_E2E_MS
  const declarado = /\btimeout:\s*([\d_]+)/.exec(trecho) ?? /\}\s*,\s*([\d_]+)\s*\)\s*;?\s*$/.exec(trecho.trimEnd())
  return declarado ? numero(declarado[1] ?? '0') : null
}

/** O próximo caso que começa a linha, com o nome entre aspas: o `test.setTimeout(` de dentro de um caso não conta. */
const PROXIMO_CASO = /\n[ \t]*(?:it|test|describe)(?:\.\w+)*\(\s*['"`]/

/** Do nome do caso até o próximo; `undefined` se o nome não está no arquivo. */
function trechoDoCaso(fonteDoTeste: string, caso: string): string | undefined {
  return fonteDoTeste.split(caso)[1]?.split(PROXIMO_CASO)[0]
}

/** O `testTimeout` de uma mutação: o do caso, quando ele declara, e senão o do projeto. */
export function testTimeoutDaMutacao(raiz: string, mutacao: Mutacao): number {
  const doCaso = testTimeoutDoCaso(readFileSync(join(raiz, mutacao.teste), 'utf8'), mutacao.caso)
  if (doCaso !== null) return doCaso
  const configuracao = join(raiz, 'vitest.config.ts')
  return testTimeoutDoProjeto(existsSync(configuracao) ? readFileSync(configuracao, 'utf8') : '', tipoDoTeste(mutacao.teste))
}

function segundos(ms: number): string {
  return `${String(Math.round(ms / 100) / 10)} s`
}

const TETO_EM_TEXTO = `${String(TETO_DA_CORRIDA_MS / 60_000)} min`

/**
 * Confere as mutações, uma a uma. Para cada par de teste e caso, uma corrida limpa antes, que tem de passar e de caber no
 * teto de 10 min: sem ela, um nome de caso errado ou um teste já vermelho contaria como mutação provada, e a limpa
 * também dá a medida do prazo da mutada. O arquivo é restaurado sempre, também quando o teste estoura ou é morto no prazo.
 */
export function conferirMutacoes(
  raiz: string,
  mutacoes: readonly Mutacao[],
  rodar: Rodar,
  avisar: (texto: string) => void = () => undefined,
  opcoes: OpcoesDaConferencia = {},
): Resultado[] {
  const agora = opcoes.agora ?? Date.now
  const calcularPrazo = opcoes.prazoDaMutada ?? prazoDaMutada
  const limpos = new Map<string, { passou: boolean; estourou: boolean; ms: number }>()
  const resultados: Resultado[] = []
  for (const [indice, mutacao] of mutacoes.entries()) {
    const rotulo = `mutação ${String(indice + 1)} de ${String(mutacoes.length)} (${mutacao.arquivo} → ${mutacao.teste}${mutacao.caso ? ` › ${mutacao.caso}` : ''})${mutacao.projeto ? ` [${mutacao.projeto}]` : ''}`
    const recusar = (motivo: string) => {
      avisar(`✗ ${rotulo}: ${motivo}\n`)
      resultados.push({ mutacao, veredito: 'recusada', motivo })
    }
    const caminho = join(raiz, mutacao.arquivo)
    const comando = comandoDoTeste(mutacao)
    if (!existsSync(caminho)) {
      recusar(`${mutacao.arquivo} não existe`)
      continue
    }
    if (comando === null || !existsSync(join(raiz, mutacao.teste))) {
      recusar(`${mutacao.teste} não existe ou não é arquivo de teste`)
      continue
    }
    const original = readFileSync(caminho, 'utf8')
    const aplicada = aplicarMutacao(original, mutacao)
    if ('recusa' in aplicada) {
      recusar(aplicada.recusa)
      continue
    }
    const chave = comando.join(' ')
    let limpa = limpos.get(chave)
    if (!limpa) {
      const inicio = agora()
      const corrida = rodar(comando, TETO_DA_CORRIDA_MS)
      const ms = agora() - inicio
      limpa = { passou: corrida === true, estourou: corrida === 'estourou' || ms > TETO_DA_CORRIDA_MS, ms }
      limpos.set(chave, limpa)
    }
    if (limpa.estourou) {
      recusar(`a corrida limpa do teste citado passou do teto de ${TETO_EM_TEXTO} (levou ${segundos(limpa.ms)}): o teste trava ou é lento demais para provar mutação, e nenhuma foi aplicada`)
      continue
    }
    if (!limpa.passou) {
      recusar('o teste citado não passa sem a mutação (ou o nome do caso não acha teste nenhum): conserte o teste antes')
      continue
    }
    const testTimeout = (opcoes.testTimeoutMs ?? ((alvo: Mutacao) => testTimeoutDaMutacao(raiz, alvo)))(mutacao)
    const prazo = calcularPrazo(limpa.ms, testTimeout)
    let corridaMutada: boolean | 'estourou'
    let mutadaMs: number
    try {
      writeFileSync(caminho, aplicada.mutado)
      const inicio = agora()
      corridaMutada = rodar(comando, prazo)
      mutadaMs = agora() - inicio
    } finally {
      writeFileSync(caminho, original)
    }
    if (corridaMutada === 'estourou' || mutadaMs > prazo) {
      recusar(
        `o teste passou do prazo de ${segundos(prazo)} com a cláusula fora (o maior entre 3 × a corrida limpa de ${segundos(limpa.ms)}, o testTimeout de ${segundos(testTimeout)} e ${segundos(PISO_DO_PRAZO_MS)}, até ${TETO_EM_TEXTO}): foi morto, com o grupo de processo, e o arquivo voltou ao que era`,
      )
    } else if (corridaMutada) {
      avisar(`✗ ${rotulo}: o teste continuou verde sem a cláusula. Falta o teste que falhe sem ela.\n`)
      resultados.push({ mutacao, veredito: 'verde', motivo: 'o teste continuou verde sem a cláusula' })
    } else {
      avisar(`✓ ${rotulo}: vermelho\n`)
      resultados.push({ mutacao, veredito: 'vermelho' })
    }
  }
  return resultados
}

/** O código com que o supervisor sai quando matou o grupo no prazo. Um teste que cai sai com 1. */
export const SAIDA_DO_PRAZO = 124
export const MARCA_DO_SUPERVISOR = '--supervisionar-corrida'

/** Manda o sinal ao grupo de processo inteiro. `false`: o grupo não existe mais (ou o sinal 0 não achou ninguém). */
export function sinalAoGrupo(grupo: number, sinal: NodeJS.Signals | 0): boolean {
  try {
    process.kill(-grupo, sinal)
    return true
  } catch {
    return false
  }
}

/**
 * O supervisor: roda o comando em grupo de processo próprio (`detached` é um `setsid`: o pgid é o do filho) e, passado o
 * prazo, manda SIGTERM ao grupo inteiro, e não só ao filho: o teste abre `npx`, `vitest`, `docker compose` e `sleep`, e o
 * `spawnSync` com `timeout` só alcançaria o primeiro, deixando o neto segurando o `flock`. Os containers que o `docker compose` subiu ficam fora do grupo, e este não os alcança (o `compose down` do ambiente é de quem o subiu). Se o grupo ainda
 * existe `esperaMs` depois, SIGKILL. Sai com 0 se o comando passou, 1 se caiu, `SAIDA_DO_PRAZO` se foi morto no prazo, e 127 se o
 * programa nem abriu. Não é exportado: só roda como processo, pelo `rodarCalado`.
 */
function supervisionar(comando: string[], prazoMs: number, esperaMs: number): Promise<number> {
  return new Promise((resolver) => {
    const [programa = '', ...argumentos] = comando
    const filho = spawn(programa, argumentos, { stdio: 'ignore', detached: true })
    const grupo = filho.pid
    if (grupo === undefined) {
      filho.on('error', () => resolver(127))
      return
    }
    let estourou = false
    // O fim do grupo, e não só o do filho: o `sh` que sai deixa o neto, que ignora o SIGTERM, até o SIGKILL.
    const terminar = (): void => {
      // O prazo e um sinal podem chegar os dois: uma vez só, senão cada chamada abre outro `setInterval`.
      if (estourou) return
      estourou = true
      sinalAoGrupo(grupo, 'SIGTERM')
      const limite = Date.now() + esperaMs
      const espiar = setInterval(() => {
        const vivo = sinalAoGrupo(grupo, 0)
        if (vivo && Date.now() < limite) return
        clearInterval(espiar)
        sinalAoGrupo(grupo, 'SIGKILL')
        resolver(SAIDA_DO_PRAZO)
      }, 25)
    }
    setTimeout(terminar, prazoMs)
    // Ctrl-C no portão não alcança o grupo do teste (outra sessão): o supervisor o leva junto.
    for (const sinal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) process.on(sinal, terminar)
    filho.on('close', (codigo) => {
      if (!estourou) resolver(codigo === 0 ? 0 : 1)
    })
  })
}

/**
 * A cópia do supervisor que as corridas executam. O portão muta `mutacoes.ts` e roda o teste: se o supervisor fosse o
 * arquivo vivo, uma mutação dentro dele mudaria o supervisor que mede o teste dela, e o vermelho dela poderia voltar verde.
 * A cópia leva o fonte de quando o `Rodar` nasce (antes de qualquer mutação), num arquivo que o conteúdo nomeia.
 *
 * Restrição: a cópia roda fora desta pasta, e por isso este arquivo só pode importar módulos `node:`. Um import relativo
 * novo quebra toda corrida (o supervisor não abre), e o portão leria isso como "o teste não passa limpo".
 */
function copiaDoSupervisor(): string {
  const fonte = readFileSync(fileURLToPath(import.meta.url), 'utf8')
  const copia = join(tmpdir(), `educa-supervisor-${createHash('sha256').update(fonte).digest('hex').slice(0, 16)}.ts`)
  const provisorio = `${copia}.${String(process.pid)}`
  writeFileSync(provisorio, fonte)
  renameSync(provisorio, copia)
  return copia
}

/**
 * Roda o comando calado: a saída de dezenas de corridas esconderia a linha que importa. Cada corrida é um supervisor
 * (a cópia deste arquivo, chamada com `--supervisionar-corrida`) que dá ao teste o grupo de processo e o prazo.
 */
export function rodarCalado(raiz: string, opcoes: { esperaAteSigkillMs?: number } = {}): Rodar {
  const supervisor = copiaDoSupervisor()
  return (comando, prazoMs = TETO_DA_CORRIDA_MS) => {
    const resultado = spawnSync(
      process.execPath,
      [...process.execArgv, supervisor, MARCA_DO_SUPERVISOR, String(prazoMs), String(opcoes.esperaAteSigkillMs ?? ESPERA_ATE_SIGKILL_MS), '--', ...comando],
      { cwd: raiz, stdio: 'ignore', env: { ...process.env, EDUCA_BANCO_NOVO: undefined } },
    )
    if (resultado.status === SAIDA_DO_PRAZO) return 'estourou'
    return resultado.status === 0
  }
}

export interface CarimboDasMutacoes {
  documento: string
  impressao: string
  total: number
}

/**
 * O e2e roda contra imagens construídas: a última mutação de tela deixou no ar a web mutada. Reconstrói do fonte
 * restaurado, com o teste dela verde, para a vitrine e a Mesa fotografarem a tela de verdade. `null`: não há o que
 * reconstruir, ou reconstruiu. Só `true` é reconstrução: a que passou do teto (`'estourou'`) e a que caiu deixam a web
 * mutada no ar, e o portão fica vermelho.
 */
export function reconstruirDepoisDasMutacoes(mutacoes: readonly Mutacao[], rodar: Rodar): string | null {
  const ultima = mutacoes.filter(pedeReconstrucao).at(-1)
  const comando = ultima ? comandoDoTeste(ultima) : null
  if (comando === null) return null
  const corrida = rodar(comando)
  if (corrida === true) return null
  return corrida === 'estourou' ? `a web não reconstruiu depois das mutações: a corrida passou do teto de ${TETO_EM_TEXTO}` : 'a web não reconstruiu depois das mutações'
}

/** O que o portão da tarefa faz com as mutações do documento: o carimbo (ausente se o documento não tem bloco), ou o motivo do vermelho. */
export type ConferenciaDoDocumento = { carimbo?: CarimboDasMutacoes } | { vermelho: string }

export function conferirMutacoesDoDocumento(
  raiz: string,
  documento: string,
  conteudo: string,
  rodar: Rodar,
  avisar: (texto: string) => void,
  opcoes: OpcoesDaConferencia = {},
): ConferenciaDoDocumento {
  const { mutacoes, erros } = lerMutacoes(conteudo)
  if (erros.length > 0) return { vermelho: erros.join('; ') }
  if (mutacoes.length === 0) return {}
  avisar(`\n▶ mutações de ${documento} (${String(mutacoes.length)})\n`)
  const resultados = conferirMutacoes(raiz, mutacoes, rodar, avisar, opcoes)
  // A web volta ao fonte restaurado mesmo quando alguma mutação reprovou.
  const reconstrucao = reconstruirDepoisDasMutacoes(mutacoes, rodar)
  const falhas = resultados.filter((resultado) => resultado.veredito !== 'vermelho')
  if (falhas.length > 0) return { vermelho: `${String(falhas.length)} de ${String(mutacoes.length)} mutações não deixaram o teste vermelho ou foram recusadas` }
  if (reconstrucao !== null) return { vermelho: reconstrucao }
  return { carimbo: { documento, impressao: impressaoDasMutacoes(mutacoes), total: mutacoes.length } }
}

/**
 * O que o commit e a Mesa perguntam: as mutações deste documento, como estão escritas agora, foram conferidas pelo
 * último portão? Documento sem bloco nenhum não é cobrado aqui: cláusula sem bloco é achado do `test-engineer`.
 */
export function avaliarMutacoes(carimbo: { mutacoes?: CarimboDasMutacoes } | null, documento: string, conteudo: string): string | null {
  const { mutacoes, erros } = lerMutacoes(conteudo)
  const comando = `node tools/processo/portao-local.ts --tarefa ${documento}`
  if (erros.length > 0) return `portão local: ${erros.join('; ')}. Corrija o bloco e rode \`${comando}\`.`
  if (mutacoes.length === 0) return null
  const conferidas = carimbo?.mutacoes
  if (!conferidas || conferidas.documento !== documento) {
    return `portão local: as ${String(mutacoes.length)} mutações de ${documento} não foram conferidas pelo último portão. Rode \`${comando}\`.`
  }
  if (conferidas.impressao !== impressaoDasMutacoes(mutacoes)) {
    return `portão local: a seção "Mutações" de ${documento} mudou depois do último portão. Rode \`${comando}\` de novo.`
  }
  return null
}

// Chamado como supervisor (`rodarCalado`), este arquivo não é módulo: roda o comando e sai com o código da corrida.
if (process.argv[2] === MARCA_DO_SUPERVISOR) {
  const [prazo = '0', espera = '0', , ...comando] = process.argv.slice(3)
  process.exit(await supervisionar(comando, Number(prazo), Number(espera)))
}
