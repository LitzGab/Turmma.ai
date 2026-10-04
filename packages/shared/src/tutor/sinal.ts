import { z } from 'zod'
import { esquemaConsultaPaginada } from '../estrutura/paginacao.js'

/**
 * Os sinais do Tutor para o professor da turma (MVP, A4; glossário, "Sinal"; D34, D36, D57): `GET /v1/sinais?turmaId=`.
 * O sinal é um **tipo fechado mais a referência ao trabalho** (a atividade aplicada e a questão, ou o material e a
 * página). Não existe campo de texto: nada aqui descreve o aluno, o que ele escreveu, o humor ou o comportamento dele.
 * Deriva de fato declarado no uso, nunca de inferência (D57).
 */
export const TIPOS_DE_SINAL = ['travou', 'resposta_pronta', 'duvida_repetida', 'atencao_humana'] as const
export type TipoDeSinal = (typeof TIPOS_DE_SINAL)[number]

/** Os sinais sobre o trabalho, que carregam onde aconteceu. `atencao_humana` fica de fora: não carrega nada. */
export const TIPOS_DE_SINAL_DE_TRABALHO = ['travou', 'resposta_pronta', 'duvida_repetida'] as const satisfies readonly TipoDeSinal[]
export type TipoDeSinalDeTrabalho = (typeof TIPOS_DE_SINAL_DE_TRABALHO)[number]

/** O fato, como a tela o diz. Fala do que aconteceu no uso, nunca conclui sobre a pessoa. */
export const NOME_DO_SINAL: Readonly<Record<TipoDeSinal, string>> = {
  travou: 'Travou',
  resposta_pronta: 'Pediu a resposta pronta',
  duvida_repetida: 'Repetiu a mesma dúvida',
  atencao_humana: 'Precisa de atenção humana',
}

/** O aluno do sinal, nomeado só para o professor da turma (D34). */
const aluno = z.strictObject({ id: z.uuid(), nome: z.string().min(1) })

/** Onde o sinal aconteceu. `questao` é o número da questão, a partir de 1, como a turma a vê. */
const referenciaAoTrabalho = {
  atividadeAplicadaId: z.uuid().nullable(),
  questao: z.number().int().min(1).nullable(),
  materialId: z.uuid().nullable(),
  pagina: z.number().int().min(1).nullable(),
}

/**
 * Um sinal. O de `atencao_humana` (D36) é um objeto estrito só com o tipo, o aluno e a hora: **sem o conteúdo da
 * conversa, sem a atividade, a questão ou a página**, e qualquer campo a mais é recusado pelo schema. O professor fica
 * sabendo que precisa procurar o aluno, e não o que ele escreveu.
 */
export const esquemaSinal = z.discriminatedUnion('tipo', [
  z.strictObject({ id: z.uuid(), tipo: z.enum(TIPOS_DE_SINAL_DE_TRABALHO), aluno, ...referenciaAoTrabalho, criadoEm: z.iso.datetime() }),
  z.strictObject({ id: z.uuid(), tipo: z.literal('atencao_humana'), aluno, criadoEm: z.iso.datetime() }),
])
export type Sinal = z.infer<typeof esquemaSinal>

/** Consulta de `GET /v1/sinais`: a turma (obrigatória, com vínculo confirmado do professor) e a página. */
export const esquemaConsultaSinais = esquemaConsultaPaginada.extend({ turmaId: z.uuid() }).strict()
export type ConsultaSinais = z.infer<typeof esquemaConsultaSinais>

export const MAXIMO_DE_GRUPOS_DE_SINAL = 50

/**
 * O agrupado que "Seu time" mostra ("oito travaram na questão 3"): por tipo, atividade e questão, quantos alunos
 * diferentes. Só os sinais de trabalho entram: `atencao_humana` nunca é somado nem agrupado.
 */
export const esquemaGrupoDeSinais = z.strictObject({
  tipo: z.enum(TIPOS_DE_SINAL_DE_TRABALHO),
  atividadeAplicadaId: z.uuid().nullable(),
  questao: z.number().int().min(1).nullable(),
  alunos: z.number().int().min(1),
})
export type GrupoDeSinais = z.infer<typeof esquemaGrupoDeSinais>

/**
 * Resposta de `GET /v1/sinais`: os sinais da turma, do mais novo para o mais antigo (`proxima` quando há mais), e o
 * agrupado dos últimos sete dias. Nenhuma conversa de aluno vem junto.
 */
export const esquemaRespostaSinais = z.strictObject({
  itens: z.array(esquemaSinal),
  proxima: z.uuid().optional(),
  grupos: z.array(esquemaGrupoDeSinais).max(MAXIMO_DE_GRUPOS_DE_SINAL),
})
export type RespostaSinais = z.infer<typeof esquemaRespostaSinais>
