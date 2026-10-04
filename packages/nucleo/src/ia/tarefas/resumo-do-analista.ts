import { esquemaHabilidade } from '@educa/shared'
import { z } from 'zod'
import { dadoEmJson } from '../material.js'
import { PROMPT_RESUMO_DO_ANALISTA } from '../prompts/resumo-do-analista.js'
import { definirTarefa } from '../tarefa.js'
import { cortar, normalizar } from '../texto.js'

const percentual = z.number().int().min(0).max(100)
const nomeDoRecorte = z.string().min(1).max(60)

/**
 * O Analista recebe **só agregados** por série e disciplina. O recorte declara quantos professores há nele, e com
 * menos de dois ele nem entra: um professor só é o indicador dele, e isso é nominal (D45). Não há turma nomeada,
 * professor nem aluno na entrada; o que não entra não tem como sair.
 */
export const esquemaEntradaDoAnalista = z.strictObject({
  periodo: z.strictObject({ inicio: z.iso.date(), fim: z.iso.date() }),
  /** Abaixo dele a habilidade vira alerta. É configuração de quem chama, nunca constante daqui. */
  limiarDeAlertaPercentual: percentual,
  recortes: z
    .array(
      z.strictObject({
        serie: nomeDoRecorte,
        disciplina: nomeDoRecorte,
        professoresNoRecorte: z.number().int().min(2),
        turmas: z.number().int().min(1),
        habilidades: z
          .array(z.strictObject({ habilidade: esquemaHabilidade, respostas: z.number().int().min(1), acertoPercentual: percentual }))
          .min(1)
          .max(20),
      }),
    )
    .min(1)
    .max(30),
})
export type EntradaDoAnalista = z.infer<typeof esquemaEntradaDoAnalista>

const esquemaItemDoResumo = { serie: nomeDoRecorte, disciplina: nomeDoRecorte, habilidade: esquemaHabilidade, acertoPercentual: percentual }

export const esquemaSaidaDoAnalista = z.strictObject({
  resumo: z.string().min(1).max(1200),
  destaques: z.array(z.strictObject({ ...esquemaItemDoResumo, leitura: z.string().min(1).max(400) })).max(5),
  /** Alerta é hipótese com contexto, nunca veredito. */
  alertas: z.array(z.strictObject({ ...esquemaItemDoResumo, hipotese: z.string().min(1).max(500), contexto: z.string().min(1).max(500) })).max(10),
})
export type SaidaDoAnalista = z.infer<typeof esquemaSaidaDoAnalista>

interface Item {
  readonly serie: string
  readonly disciplina: string
  readonly turmas: number
  readonly habilidade: { codigo: string; descricao: string }
  readonly respostas: number
  readonly acertoPercentual: number
}

function itensDaEntrada(entrada: EntradaDoAnalista): Item[] {
  return entrada.recortes.flatMap((recorte) =>
    recorte.habilidades.map((item) => ({ serie: recorte.serie, disciplina: recorte.disciplina, turmas: recorte.turmas, ...item })),
  )
}

const chaveDoItem = (item: Pick<Item, 'serie' | 'disciplina' | 'habilidade' | 'acertoPercentual'>): string =>
  [item.serie, item.disciplina, item.habilidade.codigo, item.acertoPercentual].join('|')

const dataPorExtenso = (iso: string): string => iso.split('-').reverse().join('/')

/** O Analista fala de série, disciplina e habilidade. Citar professor, mesmo sem nome, já é falar de pessoa (D45). */
const FALA_DE_PROFESSOR = /\b(professor|professora|professores|professoras|docente|docentes)\b/

export const resumoDoAnalista = definirTarefa({
  nome: 'resumo_do_analista',
  funcao: 'resumo_e_alerta',
  perfil: 'padrao',
  esquemaDeEntrada: esquemaEntradaDoAnalista,
  esquemaDeSaida: esquemaSaidaDoAnalista,
  prompt: PROMPT_RESUMO_DO_ANALISTA,
  maximoDeTokensDeSaida: 2500,
  levaTextoDeAluno: false,

  montarPedido(entrada) {
    return {
      instrucao: 'Escreva o resumo da coordenação a partir dos agregados por série e disciplina.',
      dados: [dadoEmJson('agregados_por_serie_e_disciplina', entrada)],
    }
  },

  conferir(entrada, saida) {
    const problemas: string[] = []
    const conhecidos = new Set(itensDaEntrada(entrada).map(chaveDoItem))
    for (const item of [...saida.destaques, ...saida.alertas]) {
      if (!conhecidos.has(chaveDoItem(item))) problemas.push(`“${item.habilidade.codigo}” em ${item.serie}, ${item.disciplina}: série, disciplina, habilidade e acerto precisam ser os dos dados, como vieram.`)
    }
    if (saida.alertas.some((alerta) => alerta.acertoPercentual >= entrada.limiarDeAlertaPercentual)) {
      problemas.push(`Só é alerta a habilidade com acerto abaixo do limiar de ${entrada.limiarDeAlertaPercentual}%.`)
    }
    const textos = [saida.resumo, ...saida.destaques.map((destaque) => destaque.leitura), ...saida.alertas.flatMap((alerta) => [alerta.hipotese, alerta.contexto])]
    if (textos.some((texto) => FALA_DE_PROFESSOR.test(normalizar(texto)))) {
      problemas.push('Não fale de professor: o resumo trata de série, disciplina e habilidade, e nunca avalia pessoa.')
    }
    return problemas
  },

  falso(entrada): SaidaDoAnalista {
    const itens = itensDaEntrada(entrada)
    const limiar = entrada.limiarDeAlertaPercentual
    const abaixo = itens.filter((item) => item.acertoPercentual < limiar).sort((a, b) => a.acertoPercentual - b.acertoPercentual)
    const acima = itens.filter((item) => item.acertoPercentual >= limiar).sort((a, b) => b.acertoPercentual - a.acertoPercentual)
    const respostas = itens.reduce((soma, item) => soma + item.respostas, 0)
    const media = Math.round(itens.reduce((soma, item) => soma + item.acertoPercentual * item.respostas, 0) / respostas)
    const recortes = entrada.recortes.length
    return {
      resumo: cortar(
        `De ${dataPorExtenso(entrada.periodo.inicio)} a ${dataPorExtenso(entrada.periodo.fim)}, ${recortes} ${recortes === 1 ? 'recorte' : 'recortes'} de série e disciplina ` +
          `${recortes === 1 ? 'teve' : 'tiveram'} atividades validadas, somando ${respostas} respostas. O acerto médio por habilidade foi de ${media}%. ` +
          (abaixo.length === 0
            ? `Nenhuma habilidade ficou abaixo do limiar de ${limiar}%.`
            : `${abaixo.length} ${abaixo.length === 1 ? 'habilidade ficou' : 'habilidades ficaram'} abaixo do limiar de ${limiar}% e ${abaixo.length === 1 ? 'aparece' : 'aparecem'} como alerta: é hipótese a conferir, não conclusão.`),
        1200,
      ),
      destaques: acima.slice(0, 3).map((item) => ({
        serie: item.serie,
        disciplina: item.disciplina,
        habilidade: item.habilidade,
        acertoPercentual: item.acertoPercentual,
        leitura: cortar(`${item.serie}, ${item.disciplina}: o acerto em “${item.habilidade.descricao}” foi de ${item.acertoPercentual}%, em ${item.respostas} respostas.`, 400),
      })),
      alertas: abaixo.slice(0, 10).map((item) => ({
        serie: item.serie,
        disciplina: item.disciplina,
        habilidade: item.habilidade,
        acertoPercentual: item.acertoPercentual,
        hipotese: cortar(
          `${item.serie}, ${item.disciplina}: o acerto em “${item.habilidade.descricao}” ficou em ${item.acertoPercentual}%, abaixo do limiar de ${limiar}%. ` +
            'Uma hipótese é que o conteúdo ainda não tenha sido retomado depois das primeiras atividades.',
          500,
        ),
        contexto: cortar(
          `Agregado de ${item.respostas} respostas, em ${item.turmas} ${item.turmas === 1 ? 'turma' : 'turmas'}, de atividades já validadas. ` +
            'O número não aponta turma nem pessoa e, sozinho, não permite concluir a causa.',
          500,
        ),
      })),
    }
  },
})
