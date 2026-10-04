import { esquemaConteudoDePlanoDeAula, type Citacao, type ConteudoDePlanoDeAula } from '@educa/shared'
import { z } from 'zod'
import { ErroDeIa } from '../erros.js'
import {
  citacaoDaFrase,
  dadoEmJson,
  dadosDosTrechos,
  esquemaContextoDaTurma,
  esquemaHabilidades,
  esquemaTrecho,
  extrairFatos,
  frasesDoMaterial,
  problemasDasCitacoes,
  type FraseDoMaterial,
} from '../material.js'
import { PROMPT_GERAR_PLANO_DE_AULA } from '../prompts/gerar-plano-de-aula.js'
import { definirTarefa } from '../tarefa.js'
import { cortar, enumerar, palavras } from '../texto.js'

export const esquemaEntradaDePlanoDeAula = z.strictObject({
  tema: z.string().min(1).max(200),
  duracaoMinutos: z.number().int().min(10).max(240),
  contexto: esquemaContextoDaTurma,
  habilidades: esquemaHabilidades,
  trechos: z.array(esquemaTrecho).min(1).max(12),
})
export type EntradaDePlanoDeAula = z.infer<typeof esquemaEntradaDePlanoDeAula>

/** Um ponto do material em que uma etapa se apoia: o conceito, com e sem artigo, e a frase de onde saiu. */
interface Apoio extends FraseDoMaterial {
  /** "o reagente limitante": para o meio da frase. */
  readonly conceito: string
  /** "reagente limitante": para citar entre aspas. */
  readonly nome: string
}

function apoiosDoMaterial(entrada: EntradaDePlanoDeAula): Apoio[] {
  const fatos = extrairFatos(entrada.trechos).filter((fato) => !fato.numerico)
  if (fatos.length > 0) return fatos.map((fato) => ({ materialId: fato.materialId, pagina: fato.pagina, frase: fato.frase, conceito: `${fato.artigo} ${fato.termo}`, nome: fato.termo }))
  // Sem frase definitória, o apoio é a própria frase, chamada pelas primeiras palavras dela.
  return frasesDoMaterial(entrada.trechos)
    .filter((frase) => palavras(frase.frase).length >= 6)
    .map((frase) => {
      const comeco = `${palavras(frase.frase).slice(0, 5).join(' ')}…`
      return { ...frase, conceito: `o trecho “${comeco}”`, nome: comeco }
    })
}

/** Quatro apoios espalhados pelo material: começo, um terço, dois terços e fim. Com menos de quatro, repete o último. */
function quatroApoios(apoios: readonly Apoio[]): [Apoio, Apoio, Apoio, Apoio] {
  const escolher = (fracao: number): Apoio => {
    const apoio = apoios[Math.min(apoios.length - 1, Math.round((apoios.length - 1) * fracao))]
    if (apoio === undefined) throw new ErroDeIa('IA_SAIDA_INVALIDA')
    return apoio
  }
  return [escolher(0), escolher(1 / 3), escolher(2 / 3), escolher(1)]
}

function citacoesSemRepetir(apoios: readonly Apoio[]): Citacao[] {
  const vistas = new Set<string>()
  return apoios.flatMap((apoio) => {
    const chave = `${apoio.materialId}:${apoio.pagina}`
    if (vistas.has(chave)) return []
    vistas.add(chave)
    return [citacaoDaFrase(apoio)]
  })
}

export const gerarPlanoDeAula = definirTarefa({
  nome: 'gerar_plano_de_aula',
  funcao: 'conversa_e_ferramentas',
  perfil: 'padrao',
  esquemaDeEntrada: esquemaEntradaDePlanoDeAula,
  esquemaDeSaida: esquemaConteudoDePlanoDeAula,
  prompt: PROMPT_GERAR_PLANO_DE_AULA,
  maximoDeTokensDeSaida: 4000,
  levaTextoDeAluno: false,

  montarPedido(entrada) {
    return {
      instrucao: `Monte um plano de aula de ${entrada.duracaoMinutos} minutos sobre o tema pedido, a partir dos trechos do material.`,
      dados: [
        { tipo: 'tema_pedido_pelo_professor', corpo: entrada.tema },
        dadoEmJson('serie_e_disciplina', entrada.contexto),
        dadoEmJson('habilidades', entrada.habilidades),
        ...dadosDosTrechos(entrada.trechos),
      ],
    }
  },

  conferir(entrada, saida) {
    const problemas = problemasDasCitacoes(saida.citacoes, entrada.trechos, 'Lista de citações')
    saida.etapas.forEach((etapa, indice) => {
      // O schema deixa a citação da etapa opcional; a regra não deixa (regra 30, item 12).
      if (etapa.citacao === undefined) problemas.push(`Etapa ${indice + 1}: falta a citação. Toda etapa cita o material e a página de onde saiu.`)
      else problemas.push(...problemasDasCitacoes([etapa.citacao], entrada.trechos, `Etapa ${indice + 1}`))
    })
    const codigos = new Set(entrada.habilidades.map((habilidade) => habilidade.codigo))
    if (saida.habilidades.some((habilidade) => !codigos.has(habilidade.codigo))) problemas.push('As habilidades do plano precisam ser das recebidas, copiadas como vieram.')
    const soma = saida.etapas.reduce((total, etapa) => total + etapa.minutos, 0)
    if (soma > entrada.duracaoMinutos) problemas.push(`As etapas somam ${soma} minutos, e a aula tem ${entrada.duracaoMinutos}. A soma não pode passar da duração.`)
    if (saida.duracaoMinutos !== entrada.duracaoMinutos) problemas.push(`"duracaoMinutos" precisa ser a duração pedida: ${entrada.duracaoMinutos}.`)
    return problemas
  },

  falso(entrada): ConteudoDePlanoDeAula {
    const apoios = apoiosDoMaterial(entrada)
    const [abertura, exposicao, pratica, fechamento] = quatroApoios(apoios)
    const usados = [abertura, exposicao, pratica, fechamento]
    const conceitos = [...new Set(usados.map((apoio) => apoio.conceito))]
    // Cada parte tem pelo menos um minuto, e o fechamento fica com o que sobrar: a soma é sempre a duração pedida.
    const minutosDaAbertura = Math.max(1, Math.floor(entrada.duracaoMinutos * 0.15))
    const minutosDaExposicao = Math.max(1, Math.floor(entrada.duracaoMinutos * 0.35))
    const minutosDaPratica = Math.max(1, Math.floor(entrada.duracaoMinutos * 0.35))
    const minutosDoFechamento = entrada.duracaoMinutos - minutosDaAbertura - minutosDaExposicao - minutosDaPratica
    return {
      tipo: 'plano_de_aula',
      titulo: cortar(`Plano de aula — ${entrada.tema}`, 160),
      objetivos: conceitos.slice(0, 4).map((conceito) => cortar(`Explicar ${conceito} com as próprias palavras, com apoio do material.`, 300)),
      habilidades: [...entrada.habilidades],
      duracaoMinutos: entrada.duracaoMinutos,
      etapas: [
        {
          titulo: 'Abertura: o que a turma já sabe',
          minutos: minutosDaAbertura,
          descricao: cortar(`Pergunte à turma o que ela entende por “${abertura.nome}” e anote as respostas no quadro, sem corrigir ainda. Depois leia com ela o trecho da página ${abertura.pagina}.`, 800),
          citacao: citacaoDaFrase(abertura),
        },
        {
          titulo: 'Exposição dialogada',
          minutos: minutosDaExposicao,
          descricao: cortar(`Apresente ${exposicao.conceito} a partir da página ${exposicao.pagina} do material. A cada conceito, peça um exemplo à turma antes de dar o seu.`, 800),
          citacao: citacaoDaFrase(exposicao),
        },
        {
          titulo: 'Prática em duplas',
          minutos: minutosDaPratica,
          descricao: cortar(`Em duplas, os alunos explicam um ao outro ${pratica.conceito} e escrevem um exemplo próprio, consultando a página ${pratica.pagina}. Circule pela sala e anote as dúvidas que se repetem.`, 800),
          citacao: citacaoDaFrase(pratica),
        },
        {
          titulo: 'Fechamento',
          minutos: minutosDoFechamento,
          descricao: cortar(`Volte às respostas do quadro e compare com o que o material diz sobre ${fechamento.conceito}, na página ${fechamento.pagina}. Cada aluno escreve, em uma frase, o que mudou no que pensava.`, 800),
          citacao: citacaoDaFrase(fechamento),
        },
      ],
      avaliacao: cortar(`Atividade objetiva curta sobre ${enumerar(conceitos)}, com a página do material citada em cada questão, corrigida em sala no fim da aula.`, 600),
      citacoes: citacoesSemRepetir(usados),
    }
  },
})
