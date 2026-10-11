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
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export interface Mutacao {
  arquivo: string
  teste: string
  /** O nome do caso, ou um pedaço dele. `null`: o arquivo de teste inteiro. */
  caso: string | null
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
    const antes: string[] = []
    const depois: string[] = []
    let saiAlguma = false
    let erro: string | null = null
    for (const linha of linhas) {
      if (linha.trim() === '') continue
      const cabecalho = /^(arquivo|teste):\s*(.+?)\s*$/.exec(linha)
      if (cabecalho && antes.length === 0 && depois.length === 0) {
        if (cabecalho[1] === 'arquivo') arquivo = cabecalho[2] ?? null
        else teste = cabecalho[2] ?? null
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
    if (erro || !arquivo || !teste) {
      erros.push(`mutação ${String(numero)}: ${erro ?? 'bloco incompleto'}`)
      continue
    }
    const [caminhoDoTeste = '', ...caso] = teste.split(' › ')
    mutacoes.push({ arquivo, teste: caminhoDoTeste.trim(), caso: caso.length > 0 ? caso.join(' › ').trim() : null, antes, depois })
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

/** O comando que roda o teste de uma mutação. No e2e, um projeto só: a mutação prova a regra, não o perfil de máquina. */
export function comandoDoTeste(mutacao: Mutacao): string[] | null {
  const tipo = tipoDoTeste(mutacao.teste)
  if (tipo === null) return null
  if (tipo === 'e2e') {
    const filtro = [...(mutacao.caso ? [`--grep=${mutacao.caso}`] : []), '--project=chromebook']
    return pedeReconstrucao(mutacao)
      ? ['node', 'tools/ci/e2e.ts', '--manter-ambiente', mutacao.teste, ...filtro]
      : ['npx', 'playwright', 'test', mutacao.teste, ...filtro]
  }
  return ['npx', 'vitest', 'run', '--project', tipo, mutacao.teste, ...(mutacao.caso ? ['-t', mutacao.caso] : [])]
}

export interface Resultado {
  mutacao: Mutacao
  /** `vermelho` é o único que passa: o teste caiu com a cláusula fora. */
  veredito: 'vermelho' | 'verde' | 'recusada'
  motivo?: string
}

export type Rodar = (comando: string[]) => boolean

/**
 * Confere as mutações, uma a uma. Para cada par de teste e caso, uma corrida limpa antes, que tem de passar: sem ela,
 * um nome de caso errado ou um teste já vermelho contaria como mutação provada. O arquivo é restaurado sempre, também
 * quando o teste estoura.
 */
export function conferirMutacoes(
  raiz: string,
  mutacoes: readonly Mutacao[],
  rodar: Rodar,
  avisar: (texto: string) => void = () => undefined,
): Resultado[] {
  const limpos = new Map<string, boolean>()
  const resultados: Resultado[] = []
  for (const [indice, mutacao] of mutacoes.entries()) {
    const rotulo = `mutação ${String(indice + 1)} de ${String(mutacoes.length)} (${mutacao.arquivo} → ${mutacao.teste}${mutacao.caso ? ` › ${mutacao.caso}` : ''})`
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
    if (!limpos.has(chave)) limpos.set(chave, rodar(comando))
    if (!limpos.get(chave)) {
      recusar('o teste citado não passa sem a mutação (ou o nome do caso não acha teste nenhum): conserte o teste antes')
      continue
    }
    let passouMutado: boolean
    try {
      writeFileSync(caminho, aplicada.mutado)
      passouMutado = rodar(comando)
    } finally {
      writeFileSync(caminho, original)
    }
    if (passouMutado) {
      avisar(`✗ ${rotulo}: o teste continuou verde sem a cláusula. Falta o teste que falhe sem ela.\n`)
      resultados.push({ mutacao, veredito: 'verde', motivo: 'o teste continuou verde sem a cláusula' })
    } else {
      avisar(`✓ ${rotulo}: vermelho\n`)
      resultados.push({ mutacao, veredito: 'vermelho' })
    }
  }
  return resultados
}

/** Roda o comando calado: a saída de dezenas de corridas esconderia a linha que importa. */
export function rodarCalado(raiz: string): Rodar {
  return (comando) => {
    const [programa = '', ...argumentos] = comando
    return spawnSync(programa, argumentos, { cwd: raiz, stdio: 'ignore', env: { ...process.env, EDUCA_BANCO_NOVO: undefined } }).status === 0
  }
}

export interface CarimboDasMutacoes {
  documento: string
  impressao: string
  total: number
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
