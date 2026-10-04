import { esquemaCitacao, FERRAMENTAS_GERADORAS, MAXIMO_DE_CITACOES_POR_MENSAGEM, MAXIMO_DE_QUESTOES_POR_ATIVIDADE, TAMANHO_MAXIMO_DO_TEMA } from '@educa/shared'
import { z } from 'zod'
import {
  citacaoDaFrase,
  dadoEmJson,
  dadosDosTrechos,
  esquemaContextoDaTurma,
  esquemaTrecho,
  extrairFatos,
  fatoCitadoNoTexto,
  fraseMaisProxima,
  frasesDoMaterial,
  problemasDasCitacoes,
} from '../material.js'
import { PROMPT_PROPOR_FERRAMENTA } from '../prompts/propor-ferramenta.js'
import { definirTarefa } from '../tarefa.js'
import { cortar, normalizar } from '../texto.js'

export const esquemaEntradaDoAssistente = z.strictObject({
  /** O que o professor escreveu agora. Vai ao modelo como dado. */
  mensagem: z.string().min(1).max(2000),
  contexto: esquemaContextoDaTurma,
  /** Trechos do material que a busca achou para a mensagem; pode vir vazio. */
  trechos: z.array(esquemaTrecho).max(6),
  turnosAnteriores: z.array(z.strictObject({ autor: z.enum(['professor', 'assistente']), texto: z.string().min(1).max(2000) })).max(8),
  /**
   * O professor respondeu "só conversar" à proposta de ferramenta (D18): a saída é **sempre texto**, sobre o último
   * pedido dele, e nenhuma ferramenta é proposta de novo. Ausente ou falso, a tarefa escolhe entre propor e responder.
   */
  semProposta: z.boolean().optional(),
})
export type EntradaDoAssistente = z.infer<typeof esquemaEntradaDoAssistente>

/**
 * A proposta é o que a tela mostra como "quer abrir a ferramenta?" (D18): a ferramenta e o que deu para entender do
 * pedido, para o cartão já abrir preenchido. Nada é gerado antes do sim. É a parte da `PropostaDeFerramenta` do
 * contrato (`@educa/shared`) que o modelo consegue dar: a turma e a disciplina, quem acrescenta é o Assistente, da
 * mensagem do professor. Só as ferramentas que geram a partir de um tema: a Adaptação parte de uma atividade pronta
 * e tem rota própria, então pedido de adaptação vira texto que diz onde ela fica.
 */
export const esquemaPropostaDoAssistente = z.strictObject({
  ferramenta: z.enum(FERRAMENTAS_GERADORAS),
  parametros: z.strictObject({
    tema: z.string().min(1).max(TAMANHO_MAXIMO_DO_TEMA),
    quantidade: z.number().int().min(1).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE).optional(),
  }),
})
export type PropostaDoAssistente = z.infer<typeof esquemaPropostaDoAssistente>

/** Os mesmos dois tipos, e os mesmos tetos, do conteúdo que `mensagem_agente` guarda (`esquemaConteudoDaMensagemDoAgente`). */
export const esquemaSaidaDoAssistente = z.discriminatedUnion('tipo', [
  z.strictObject({ tipo: z.literal('texto'), texto: z.string().min(1).max(8000), citacoes: z.array(esquemaCitacao).max(MAXIMO_DE_CITACOES_POR_MENSAGEM) }),
  /** `texto` é a pergunta ao professor. */
  z.strictObject({ tipo: z.literal('proposta_de_ferramenta'), texto: z.string().min(1).max(1000), proposta: esquemaPropostaDoAssistente }),
])
export type SaidaDoAssistente = z.infer<typeof esquemaSaidaDoAssistente>

const PEDE_ADAPTACAO = /\badapt\w*/
const PEDE_PLANO = /\b(planos? de aulas?|planej\w+|sequencia didatica|roteiro de aula)\b/
const PEDE_ATIVIDADE = /\b(atividades?|exercicios?|questoes|questao|lista|quiz|prova|simulado)\b/

/** O tema é o que vem depois de "sobre"; sem "sobre", a mensagem inteira, que o professor ajusta no cartão. */
function temaDaMensagem(mensagem: string): string {
  const achado = /\bsobre\s+(.+?)(?=[.?!\n,;]|\s+com\s+\d|\s+(?:para|pra)\s+|\s+de\s+\d+\s+min|$)/iu.exec(mensagem)
  const tema = (achado?.[1] ?? mensagem).trim()
  return cortar(tema.length > 0 ? tema : mensagem.trim(), TAMANHO_MAXIMO_DO_TEMA)
}

function numeroEntre(achado: RegExpExecArray | null, minimo: number, maximo: number): number | undefined {
  const numero = Number(achado?.[1])
  return Number.isInteger(numero) && numero >= minimo && numero <= maximo ? numero : undefined
}

/**
 * A resposta de quem escolheu "só conversar": texto, sobre o **último pedido** do professor (o turno anterior dele mais
 * recente; sem turno anterior, a mensagem de agora), com a página citada quando o material tem o que dizer. Nunca proposta.
 */
function respostaSoEmTexto(entrada: EntradaDoAssistente): SaidaDoAssistente {
  const pedido = entrada.turnosAnteriores.findLast((turno) => turno.autor === 'professor')?.texto ?? entrada.mensagem
  if (PEDE_ADAPTACAO.test(normalizar(pedido))) {
    return {
      tipo: 'texto',
      texto: 'Sem abrir ferramenta, então. Para adaptar, abra a atividade e escolha “Adaptar”: ela pede só o tipo de adaptação, sem nenhuma informação sobre o aluno, e a versão adaptada espera a sua aprovação.',
      citacoes: [],
    }
  }
  const frase = fatoCitadoNoTexto(extrairFatos(entrada.trechos), pedido) ?? fraseMaisProxima(frasesDoMaterial(entrada.trechos), pedido)
  if (frase !== undefined) {
    return {
      tipo: 'texto',
      texto: cortar(`Sem abrir a ferramenta, então. No material da turma, a página ${frase.pagina} diz: “${frase.frase}” Se quiser, pergunte por outro ponto do capítulo.`, 8000),
      citacoes: [citacaoDaFrase(frase)],
    }
  }
  return {
    tipo: 'texto',
    texto: 'Sem abrir a ferramenta, então. Não achei no material da turma um trecho sobre esse pedido: diga o assunto com outras palavras, ou pergunte por um conceito do capítulo, e eu respondo com a página.',
    citacoes: [],
  }
}

export const proporFerramenta = definirTarefa({
  nome: 'propor_ferramenta',
  funcao: 'conversa_e_ferramentas',
  perfil: 'rapido',
  esquemaDeEntrada: esquemaEntradaDoAssistente,
  esquemaDeSaida: esquemaSaidaDoAssistente,
  prompt: PROMPT_PROPOR_FERRAMENTA,
  maximoDeTokensDeSaida: 800,
  levaTextoLivreDePessoa: true,
  levaTextoDeAluno: false,

  montarPedido(entrada) {
    return {
      instrucao:
        entrada.semProposta === true
          ? 'O professor escolheu só conversar, sem abrir ferramenta. Responda em texto ao último pedido dele (o turno anterior do professor mais recente; se não houver, a mensagem de agora), citando a página quando a resposta vier do material. A saída é do tipo "texto": não devolva "proposta_de_ferramenta".'
          : 'Responda à mensagem do professor: proponha abrir uma ferramenta, se o pedido corresponder a uma, ou responda em texto.',
      dados: [
        dadoEmJson('serie_e_disciplina', entrada.contexto),
        ...dadosDosTrechos(entrada.trechos),
        ...entrada.turnosAnteriores.map((turno) => ({ tipo: turno.autor === 'professor' ? 'turno_anterior_do_professor' : 'turno_anterior_do_assistente', corpo: turno.texto })),
        { tipo: 'mensagem_do_professor_agora', corpo: entrada.mensagem },
      ],
    }
  },

  conferir(entrada, saida) {
    if (saida.tipo === 'texto') return problemasDasCitacoes(saida.citacoes, entrada.trechos, 'Citações')
    // Quem escolheu só conversar não recebe a mesma pergunta de novo: proposta, aqui, é saída inválida.
    return entrada.semProposta === true ? ['O professor escolheu só conversar: responda com "tipo": "texto", sem "proposta_de_ferramenta".'] : []
  },

  falso(entrada): SaidaDoAssistente {
    if (entrada.semProposta === true) return respostaSoEmTexto(entrada)
    const texto = normalizar(entrada.mensagem)
    if (PEDE_ADAPTACAO.test(texto)) {
      // O que o professor disse sobre o aluno não é repetido: a resposta só aponta a ferramenta, que pede o tipo.
      return {
        tipo: 'texto',
        texto: 'A Adaptação parte de uma atividade que já existe: abra a atividade e escolha “Adaptar”. Ela pede só o tipo de adaptação, sem nenhuma informação sobre o aluno, e a versão adaptada espera a sua aprovação.',
        citacoes: [],
      }
    }
    if (PEDE_PLANO.test(texto)) {
      const tema = temaDaMensagem(entrada.mensagem)
      return {
        tipo: 'proposta_de_ferramenta',
        texto: cortar(`Quer que eu abra a ferramenta de plano de aula sobre “${tema}”? Você ajusta antes de gerar.`, 1000),
        proposta: { ferramenta: 'plano_de_aula', parametros: { tema } },
      }
    }
    if (PEDE_ATIVIDADE.test(texto)) {
      const tema = temaDaMensagem(entrada.mensagem)
      const quantidade = numeroEntre(/(\d{1,2})\s*(?:questoes|questao|exercicios?|perguntas?|itens)\b/.exec(texto), 1, MAXIMO_DE_QUESTOES_POR_ATIVIDADE)
      return {
        tipo: 'proposta_de_ferramenta',
        texto: cortar(`Quer que eu abra a ferramenta de atividade objetiva${quantidade === undefined ? '' : ` com ${quantidade} questões`} sobre “${tema}”? Você ajusta antes de gerar.`, 1000),
        proposta: { ferramenta: 'atividade_objetiva', parametros: quantidade === undefined ? { tema } : { tema, quantidade } },
      }
    }
    // Pergunta sobre um conceito que o material define é respondida com a definição dele, e não com a frase mais parecida.
    const frase = fatoCitadoNoTexto(extrairFatos(entrada.trechos), entrada.mensagem) ?? fraseMaisProxima(frasesDoMaterial(entrada.trechos), entrada.mensagem)
    if (frase !== undefined) {
      return {
        tipo: 'texto',
        texto: cortar(`No material da turma, a página ${frase.pagina} diz: “${frase.frase}” Posso montar uma atividade objetiva ou um plano de aula sobre isso: é só pedir.`, 8000),
        citacoes: [citacaoDaFrase(frase)],
      }
    }
    return {
      tipo: 'texto',
      texto: 'Eu preparo atividade objetiva, plano de aula e versão adaptada de atividade, sempre a partir do material que a escola subiu e com a página citada. Diga o tema e eu pergunto se você quer abrir a ferramenta.',
      citacoes: [],
    }
  },
})
