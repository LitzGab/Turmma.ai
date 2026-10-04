import { esquemaCitacao, TIPOS_DE_ADAPTACAO, type TipoDeAdaptacao } from '@educa/shared'
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
})
export type EntradaDoAssistente = z.infer<typeof esquemaEntradaDoAssistente>

/**
 * A proposta é o que a tela mostra como "quer abrir a ferramenta?" (D18): a ferramenta e o que deu para entender do
 * pedido, para o cartão já abrir preenchido. Nada é gerado antes do sim. A Adaptação só aceita **tipos**: não há
 * campo de texto, e por isso o que o professor disser sobre um aluno não tem para onde ir (D35, D67).
 */
export const esquemaPropostaDeFerramenta = z.discriminatedUnion('ferramenta', [
  z.strictObject({
    ferramenta: z.literal('atividade_objetiva'),
    parametros: z.strictObject({ tema: z.string().min(1).max(200), quantidade: z.number().int().min(1).max(20).optional() }),
  }),
  z.strictObject({
    ferramenta: z.literal('plano_de_aula'),
    parametros: z.strictObject({ tema: z.string().min(1).max(200), duracaoMinutos: z.number().int().min(10).max(240).optional() }),
  }),
  z.strictObject({
    ferramenta: z.literal('adaptacao'),
    parametros: z.strictObject({ tipos: z.array(z.enum(TIPOS_DE_ADAPTACAO)).max(TIPOS_DE_ADAPTACAO.length).optional() }),
  }),
])
export type PropostaDeFerramenta = z.infer<typeof esquemaPropostaDeFerramenta>

export const esquemaSaidaDoAssistente = z.discriminatedUnion('tipo', [
  z.strictObject({ tipo: z.literal('texto'), texto: z.string().min(1).max(2000), citacoes: z.array(esquemaCitacao).max(5) }),
  /** `texto` é a pergunta ao professor. */
  z.strictObject({ tipo: z.literal('proposta'), texto: z.string().min(1).max(400), proposta: esquemaPropostaDeFerramenta }),
])
export type SaidaDoAssistente = z.infer<typeof esquemaSaidaDoAssistente>

const PEDE_ADAPTACAO = /\badapt\w*/
const PEDE_PLANO = /\b(planos? de aulas?|planej\w+|sequencia didatica|roteiro de aula)\b/
const PEDE_ATIVIDADE = /\b(atividades?|exercicios?|questoes|questao|lista|quiz|prova|simulado)\b/

const SINAIS_DO_TIPO: Readonly<Record<TipoDeAdaptacao, RegExp>> = {
  fonte_ampliada: /\b(fonte|letra) (ampliada|maior|grande)\b/,
  tempo_adicional: /\b(tempo (adicional|extra|a mais)|mais tempo)\b/,
  linguagem_direta: /\blinguagem (direta|simples|clara)\b/,
  enunciado_simplificado: /\b(enunciados? (simplificados?|simples|mais facil|mais faceis|curtos?)|simplific\w+)\b/,
  resposta_escrita_no_lugar_da_oral: /\b(resposta escrita|escrita no lugar)\b/,
  leitura_de_apoio: /\b(leitura|texto) de apoio\b/,
}

/** O tema é o que vem depois de "sobre"; sem "sobre", a mensagem inteira, que o professor ajusta no cartão. */
function temaDaMensagem(mensagem: string): string {
  const achado = /\bsobre\s+(.+?)(?=[.?!\n,;]|\s+com\s+\d|\s+(?:para|pra)\s+|\s+de\s+\d+\s+min|$)/iu.exec(mensagem)
  const tema = (achado?.[1] ?? mensagem).trim()
  return cortar(tema.length > 0 ? tema : mensagem.trim(), 200)
}

function numeroEntre(achado: RegExpExecArray | null, minimo: number, maximo: number): number | undefined {
  const numero = Number(achado?.[1])
  return Number.isInteger(numero) && numero >= minimo && numero <= maximo ? numero : undefined
}

export const proporFerramenta = definirTarefa({
  nome: 'propor_ferramenta',
  funcao: 'conversa_e_ferramentas',
  perfil: 'rapido',
  esquemaDeEntrada: esquemaEntradaDoAssistente,
  esquemaDeSaida: esquemaSaidaDoAssistente,
  prompt: PROMPT_PROPOR_FERRAMENTA,
  maximoDeTokensDeSaida: 800,
  levaTextoDeAluno: false,

  montarPedido(entrada) {
    return {
      instrucao: 'Responda à mensagem do professor: proponha abrir uma ferramenta, se o pedido corresponder a uma, ou responda em texto.',
      dados: [
        dadoEmJson('serie_e_disciplina', entrada.contexto),
        ...dadosDosTrechos(entrada.trechos),
        ...entrada.turnosAnteriores.map((turno) => ({ tipo: turno.autor === 'professor' ? 'turno_anterior_do_professor' : 'turno_anterior_do_assistente', corpo: turno.texto })),
        { tipo: 'mensagem_do_professor_agora', corpo: entrada.mensagem },
      ],
    }
  },

  conferir(entrada, saida) {
    return saida.tipo === 'texto' ? problemasDasCitacoes(saida.citacoes, entrada.trechos, 'Citações') : []
  },

  falso(entrada): SaidaDoAssistente {
    const texto = normalizar(entrada.mensagem)
    if (PEDE_ADAPTACAO.test(texto)) {
      const tipos = TIPOS_DE_ADAPTACAO.filter((tipo) => SINAIS_DO_TIPO[tipo].test(texto))
      return {
        tipo: 'proposta',
        texto: 'Quer que eu abra a ferramenta de Adaptação? Ela pede a atividade e o tipo de adaptação, sem nenhuma informação sobre o aluno.',
        proposta: { ferramenta: 'adaptacao', parametros: tipos.length > 0 ? { tipos } : {} },
      }
    }
    if (PEDE_PLANO.test(texto)) {
      const tema = temaDaMensagem(entrada.mensagem)
      const duracaoMinutos = numeroEntre(/(\d{2,3})\s*(?:min|minutos)\b/.exec(texto), 10, 240)
      return {
        tipo: 'proposta',
        texto: cortar(`Quer que eu abra a ferramenta de plano de aula sobre “${tema}”${duracaoMinutos === undefined ? '' : `, para ${duracaoMinutos} minutos`}? Você ajusta antes de gerar.`, 400),
        proposta: { ferramenta: 'plano_de_aula', parametros: duracaoMinutos === undefined ? { tema } : { tema, duracaoMinutos } },
      }
    }
    if (PEDE_ATIVIDADE.test(texto)) {
      const tema = temaDaMensagem(entrada.mensagem)
      const quantidade = numeroEntre(/(\d{1,2})\s*(?:questoes|questao|exercicios?|perguntas?|itens)\b/.exec(texto), 1, 20)
      return {
        tipo: 'proposta',
        texto: cortar(`Quer que eu abra a ferramenta de atividade objetiva${quantidade === undefined ? '' : ` com ${quantidade} questões`} sobre “${tema}”? Você ajusta antes de gerar.`, 400),
        proposta: { ferramenta: 'atividade_objetiva', parametros: quantidade === undefined ? { tema } : { tema, quantidade } },
      }
    }
    // Pergunta sobre um conceito que o material define é respondida com a definição dele, e não com a frase mais parecida.
    const frase = fatoCitadoNoTexto(extrairFatos(entrada.trechos), entrada.mensagem) ?? fraseMaisProxima(frasesDoMaterial(entrada.trechos), entrada.mensagem)
    if (frase !== undefined) {
      return {
        tipo: 'texto',
        texto: cortar(`No material da turma, a página ${frase.pagina} diz: “${frase.frase}” Posso montar uma atividade objetiva ou um plano de aula sobre isso: é só pedir.`, 2000),
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
