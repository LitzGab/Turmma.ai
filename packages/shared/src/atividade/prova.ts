import { z } from 'zod'
import { ALTERNATIVAS_POR_QUESTAO, esquemaAdaptacaoAplicada, esquemaCitacao, esquemaHabilidade, type ConteudoDeAtividade } from '../assistente/conteudo.js'
import { MAXIMO_DE_QUESTOES_POR_ATIVIDADE } from '../assistente/conversa.js'
import { esquemaConsultaPaginada, esquemaDePagina } from '../estrutura/paginacao.js'
import { ESTADOS_DE_ATIVIDADE_APLICADA } from './atividade-aplicada.js'

/**
 * O lado do aluno na atividade (MVP, A3): `GET /v1/minhas-atividades`, a prova, as respostas, o envio e o diagnóstico.
 * O aluno só alcança a si (`proprio`): nenhuma resposta daqui traz colega, média da turma, gabarito antes da hora nem
 * resultado de correção que o professor ainda não aprovou (regra 70, item 3).
 *
 * **Duas contagens, para ninguém errar por um:** `questao` é o **número** da questão, a partir de 1, como a turma a vê
 * (a posição em `questoes` mais um); `alternativa` é o **índice** da alternativa, de 0 a 3, o mesmo do `gabarito`.
 */

/** O número da questão, de 1 a 20, no caminho (`/respostas/:questao`) e nos corpos. */
export const esquemaNumeroDaQuestao = z.coerce.number().int().min(1).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE)

/** O índice da alternativa, de 0 a 3. */
export const esquemaAlternativa = z.number().int().min(0).max(ALTERNATIVAS_POR_QUESTAO - 1)

/**
 * `para_fazer`: aberta, e o aluno não começou. `em_andamento`: começou e não enviou. `enviada`: enviou, e o professor
 * ainda não aprovou a correção. `encerrada`: o professor encerrou antes de o aluno enviar. `com_diagnostico`: o lote foi
 * aprovado, e o diagnóstico está em `GET /v1/atividades-aplicadas/:id/meu-diagnostico`.
 */
export const SITUACOES_DA_MINHA_ATIVIDADE = ['para_fazer', 'em_andamento', 'enviada', 'encerrada', 'com_diagnostico'] as const
export type SituacaoDaMinhaAtividade = (typeof SITUACOES_DA_MINHA_ATIVIDADE)[number]

/** Uma atividade da turma do aluno, na lista dele. Sem acertos: o resultado só existe no diagnóstico, depois da aprovação. */
export const esquemaMinhaAtividade = z.strictObject({
  id: z.uuid(),
  titulo: z.string().min(1),
  disciplina: z.strictObject({ id: z.uuid(), nome: z.string().min(1) }),
  avaliativa: z.boolean(),
  situacao: z.enum(SITUACOES_DA_MINHA_ATIVIDADE),
  questoes: z.number().int().min(1),
  respondidas: z.number().int().nonnegative(),
  aplicadaEm: z.iso.datetime(),
  enviadaEm: z.iso.datetime().nullable(),
})
export type MinhaAtividade = z.infer<typeof esquemaMinhaAtividade>

export const esquemaConsultaMinhasAtividades = esquemaConsultaPaginada
export const esquemaRespostaMinhasAtividades = esquemaDePagina(esquemaMinhaAtividade)
export type RespostaMinhasAtividades = z.infer<typeof esquemaRespostaMinhasAtividades>

/**
 * Uma questão como o aluno a recebe: o número, o enunciado e as alternativas. **Sem `gabarito`, sem `explicacao`, sem
 * habilidade e sem citação**: o objeto é estrito, e a questão do artefato inteira não passa por ele.
 */
export const esquemaQuestaoDaProva = z.strictObject({
  numero: esquemaNumeroDaQuestao,
  enunciado: z.string().min(1),
  alternativas: z.array(z.string().min(1)).length(ALTERNATIVAS_POR_QUESTAO),
})
export type QuestaoDaProva = z.infer<typeof esquemaQuestaoDaProva>

/** A resposta que o aluno já salvou, para ele continuar de onde parou. */
export const esquemaRespostaSalva = z.strictObject({ questao: esquemaNumeroDaQuestao, alternativa: esquemaAlternativa })

/**
 * Resposta de `GET /v1/atividades-aplicadas/:id/prova`: a atividade como o aluno a faz. `adaptacao` traz só os **tipos**
 * da versão (para a tela ampliar a fonte ou mostrar o tempo extra), e vale para a turma inteira que recebeu a versão.
 * Abrir a prova cria a tentativa do aluno, uma só.
 */
export const esquemaRespostaProva = z.strictObject({
  atividadeAplicadaId: z.uuid(),
  titulo: z.string().min(1),
  avaliativa: z.boolean(),
  estado: z.enum(ESTADOS_DE_ATIVIDADE_APLICADA),
  adaptacao: esquemaAdaptacaoAplicada.nullable(),
  questoes: z.array(esquemaQuestaoDaProva).min(1).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE),
  respostas: z.array(esquemaRespostaSalva).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE),
  enviadaEm: z.iso.datetime().nullable(),
})
export type RespostaProva = z.infer<typeof esquemaRespostaProva>

/**
 * As questões do artefato como o aluno as recebe. É por aqui que a API monta a prova: copia campo a campo, e por isso
 * gabarito, explicação, habilidade e citação não têm como ir junto, mesmo que o artefato ganhe campo novo.
 */
export function questoesDaProva(conteudo: ConteudoDeAtividade): QuestaoDaProva[] {
  return conteudo.questoes.map((questao, indice) => ({ numero: indice + 1, enunciado: questao.enunciado, alternativas: [...questao.alternativas] }))
}

/**
 * Corpo de `PUT /v1/atividades-aplicadas/:id/respostas/:questao`: a alternativa marcada. Gravação idempotente (regra 80,
 * item 6): a mesma resposta duas vezes é uma linha só, e marcar outra alternativa troca a anterior. Depois do envio ou do
 * encerramento responde `ATIVIDADE_ENCERRADA`.
 */
export const esquemaPedidoResponderQuestao = z.strictObject({ alternativa: esquemaAlternativa })
export type PedidoResponderQuestao = z.infer<typeof esquemaPedidoResponderQuestao>

/** Resposta de `PUT …/respostas/:questao`: o que ficou gravado, para a tela dizer "Resposta salva". Nunca se está certa. */
export const esquemaRespostaQuestaoSalva = z.strictObject({
  questao: esquemaNumeroDaQuestao,
  alternativa: esquemaAlternativa,
  respondidaEm: z.iso.datetime(),
})
export type RespostaQuestaoSalva = z.infer<typeof esquemaRespostaQuestaoSalva>

/** Resposta de `POST /v1/atividades-aplicadas/:id/enviar`: quando foi enviada e quantas questões têm resposta. Enviar de novo devolve o mesmo. */
export const esquemaRespostaAtividadeEnviada = z.strictObject({
  enviadaEm: z.iso.datetime(),
  respondidas: z.number().int().nonnegative(),
  questoes: z.number().int().min(1),
})
export type RespostaAtividadeEnviada = z.infer<typeof esquemaRespostaAtividadeEnviada>

/** O acerto numa habilidade: quantas questões dela o aluno acertou, de quantas. Contagem, não nota (D46). */
export const esquemaAcertoPorHabilidade = z.strictObject({
  habilidade: esquemaHabilidade,
  acertos: z.number().int().nonnegative(),
  total: z.number().int().min(1),
})
export type AcertoPorHabilidade = z.infer<typeof esquemaAcertoPorHabilidade>

/** Uma questão no diagnóstico: o que o aluno marcou, o gabarito, a explicação e a página. Só existe depois da aprovação. */
export const esquemaQuestaoDoDiagnostico = z.strictObject({
  numero: esquemaNumeroDaQuestao,
  alternativa: esquemaAlternativa.nullable(),
  gabarito: esquemaAlternativa,
  correta: z.boolean(),
  explicacao: z.string().min(1),
  citacao: esquemaCitacao,
})

/**
 * Resposta de `GET /v1/atividades-aplicadas/:id/meu-diagnostico`: o diagnóstico formativo do próprio aluno, por
 * habilidade e por questão, com quem aprovou e quando. **Só existe com a entrega do lote `aprovada`**: antes disso (lote
 * pendente, rejeitado ou ainda não corrigido) a rota responde como inexistente, igual à atividade de outra turma. Não é
 * nota nem conceito, e não traz a turma nem colega.
 */
export const esquemaRespostaMeuDiagnostico = z.strictObject({
  atividadeAplicadaId: z.uuid(),
  titulo: z.string().min(1),
  acertos: z.number().int().nonnegative(),
  total: z.number().int().min(1),
  porHabilidade: z.array(esquemaAcertoPorHabilidade).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE),
  questoes: z.array(esquemaQuestaoDoDiagnostico).min(1).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE),
  /** Nulo só se quem aprovou foi eliminado da escola depois: a aprovação e a data ficam. */
  aprovadoPor: z.strictObject({ nome: z.string().min(1) }).nullable(),
  aprovadoEm: z.iso.datetime(),
})
export type RespostaMeuDiagnostico = z.infer<typeof esquemaRespostaMeuDiagnostico>
