import { esquemaHabilidade, type Citacao, type Habilidade } from '@educa/shared'
import { z } from 'zod'
import type { Dado } from './tarefa.js'
import { cortar, frases, normalizar, palavras, palavrasEmComum, semPontoFinal } from './texto.js'

/**
 * Um trecho do material da escola, como a busca devolve: a página e o texto dela. É a única forma de conteúdo de
 * material que uma tarefa recebe, e é contra ele que toda citação é conferida (regra 30, item 12).
 */
export const esquemaTrecho = z.strictObject({
  materialId: z.uuid(),
  /** Página do PDF, a partir de 1. */
  pagina: z.number().int().min(1),
  texto: z.string().min(1).max(8000),
})
export type Trecho = z.infer<typeof esquemaTrecho>

/**
 * Série e disciplina, pelo nome que a escola deu ("2ª série do Ensino Médio", "Química"). É contexto para o tom e o
 * nível do texto; não há campo para o nome da turma, do professor ou de aluno.
 */
export const esquemaContextoDaTurma = z.strictObject({
  serie: z.string().min(1).max(60),
  disciplina: z.string().min(1).max(60),
})
export type ContextoDaTurma = z.infer<typeof esquemaContextoDaTurma>

export const esquemaHabilidades = z.array(esquemaHabilidade).min(1).max(6)

export function dadosDosTrechos(trechos: readonly Trecho[]): Dado[] {
  return trechos.map((trecho) => ({
    tipo: 'trecho_do_material',
    atributos: { materialId: trecho.materialId, pagina: trecho.pagina },
    corpo: trecho.texto,
  }))
}

export function dadoEmJson(tipo: string, valor: unknown): Dado {
  return { tipo, corpo: JSON.stringify(valor) }
}

/** A citação aponta para uma página que veio nos trechos? Página inventada é saída inválida. */
export function citacaoVeioDosTrechos(citacao: Pick<Citacao, 'materialId' | 'pagina'>, trechos: readonly Trecho[]): boolean {
  return trechos.some((trecho) => trecho.materialId === citacao.materialId && trecho.pagina === citacao.pagina)
}

export function problemasDasCitacoes(citacoes: readonly Citacao[], trechos: readonly Trecho[], onde: string): string[] {
  return citacoes
    .filter((citacao) => !citacaoVeioDosTrechos(citacao, trechos))
    .map((citacao) => `${onde}: a citação aponta para a página ${citacao.pagina}, que não está nos trechos recebidos. Cite só material e página que vieram nos dados.`)
}

/**
 * Uma frase definitória do material: "O reagente limitante é o reagente que acaba primeiro…", "A massa molar da
 * água é 18 g/mol". É dela que a versão determinística tira questão, objetivo de plano e apoio do Tutor.
 */
export interface Fato {
  readonly materialId: string
  readonly pagina: number
  readonly frase: string
  /** "o", "a", "os", "as", "um", "uma": como a frase apresenta o termo. */
  readonly artigo: string
  readonly termo: string
  /** "é", "são", "corresponde a", "equivale a"… */
  readonly copula: string
  readonly complemento: string
  /** O complemento é um valor ("18 g/mol", "6,02 × 10²³ entidades"): pede "qual é", e distrator que também seja valor. */
  readonly numerico: boolean
}

const FRASE_DEFINITORIA = /^(O|A|Os|As|Um|Uma)\s+(.+?)\s+(é|são|corresponde a|correspondem a|equivale a|equivalem a)\s+(.+)$/u
const PALAVRAS_MAXIMAS_DO_TERMO = 7

function fatoDaFrase(frase: string, trecho: Trecho): Fato | undefined {
  const achado = FRASE_DEFINITORIA.exec(semPontoFinal(frase))
  if (achado === null) return undefined
  const [, artigo = '', termo = '', copula = '', complemento = ''] = achado
  // Termo com vírgula ou comprido demais é oração, não nome de conceito ("A cada conceito, a turma é…").
  if (/[,;:]/.test(termo) || palavras(termo).length > PALAVRAS_MAXIMAS_DO_TERMO || complemento.length < 2) return undefined
  return {
    materialId: trecho.materialId,
    pagina: trecho.pagina,
    frase,
    artigo: artigo.toLowerCase(),
    termo,
    copula,
    complemento,
    numerico: /^\d/.test(complemento) && complemento.length <= 60,
  }
}

/** Os fatos do material, na ordem em que aparecem, um por termo (o primeiro vence). */
export function extrairFatos(trechos: readonly Trecho[]): Fato[] {
  const vistos = new Set<string>()
  const fatos: Fato[] = []
  for (const trecho of trechos) {
    for (const frase of frases(trecho.texto)) {
      const fato = fatoDaFrase(frase, trecho)
      if (fato === undefined) continue
      const chave = normalizar(fato.termo)
      if (vistos.has(chave)) continue
      vistos.add(chave)
      fatos.push(fato)
    }
  }
  return fatos
}

export interface FraseDoMaterial {
  readonly materialId: string
  readonly pagina: number
  readonly frase: string
}

export function frasesDoMaterial(trechos: readonly Trecho[]): FraseDoMaterial[] {
  return trechos.flatMap((trecho) => frases(trecho.texto).map((frase) => ({ materialId: trecho.materialId, pagina: trecho.pagina, frase })))
}

/** A frase do material com mais palavras em comum com o texto; no empate, a que vem antes. `undefined` sem nenhuma em comum. */
export function fraseMaisProxima(candidatas: readonly FraseDoMaterial[], texto: string): FraseDoMaterial | undefined {
  let melhor: FraseDoMaterial | undefined
  let pontos = 0
  for (const candidata of candidatas) {
    const emComum = palavrasEmComum(texto, candidata.frase)
    if (emComum > pontos) {
      melhor = candidata
      pontos = emComum
    }
  }
  return melhor
}

/** A habilidade cuja descrição mais se parece com o texto; no empate, a primeira da lista. */
export function habilidadeMaisProxima(habilidades: readonly Habilidade[], texto: string): Habilidade {
  const [primeira, ...demais] = habilidades
  if (primeira === undefined) throw new Error('lista de habilidades vazia')
  let melhor = primeira
  let pontos = palavrasEmComum(primeira.descricao, texto)
  for (const habilidade of demais) {
    const emComum = palavrasEmComum(habilidade.descricao, texto)
    if (emComum > pontos) {
      melhor = habilidade
      pontos = emComum
    }
  }
  return melhor
}

export function citacaoDaFrase(frase: FraseDoMaterial): Citacao {
  return { materialId: frase.materialId, pagina: frase.pagina, trecho: cortar(frase.frase, 400) }
}
