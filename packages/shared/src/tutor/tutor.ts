import { z } from 'zod'
import { camposDaConsultaDeConversa, MAXIMO_DE_MENSAGENS_POR_PAGINA } from '../assistente/conversa.js'
import { esquemaCitacao, esquemaHabilidade } from '../assistente/conteudo.js'
import { esquemaChaveEnvio } from '../time/chave-envio.js'
import { TIPOS_DE_SINAL_DE_TRABALHO } from './sinal.js'

/**
 * O Tutor do aluno (MVP, A4; D8, D36, D38, D47, D58, D66): `POST /v1/tutor/mensagens`, `GET /v1/tutor/conversa` e
 * `GET /v1/tutor/memoria`. O aluno só alcança a própria conversa, e nenhuma resposta traz dado de colega. A resposta do
 * Tutor é a única saída de IA que chega ao aluno sem aprovação prévia: é supervisionada (D47), e por isso todo turno
 * fica registrado e gera sinal para o professor da turma.
 */

/**
 * O freio diário por aluno e o pacote do mês por aluno, somado na turma (D38), quando a escola não configurou os dela.
 * **Quem vale é `configuracao_operacional_escola`** (`tutor_trocas_por_dia` e `tutor_trocas_por_mes`): isto é só o que
 * a coluna nula quer dizer (D41; regra 30, item 8).
 */
export const TROCAS_POR_DIA_PADRAO_DO_TUTOR = 60
export const TROCAS_POR_MES_PADRAO_DO_TUTOR = 300

/** O maior texto que o aluno manda de uma vez. */
export const TAMANHO_MAXIMO_DA_PERGUNTA_AO_TUTOR = 2000
export const MAXIMO_DE_CITACOES_DO_TUTOR = 4

/**
 * `ligado`: responde. `avaliacao`: há atividade avaliativa aberta para a turma, e ele fica travado (regra 30, item 10).
 * `fora`: fora do horário em que a escola o liga (D19). `limite`: o aluno chegou ao freio do dia ou a turma gastou o
 * pacote do mês (D38). Quem decide é o servidor; a tela só mostra.
 */
export const ESTADOS_DO_TUTOR = ['ligado', 'avaliacao', 'fora', 'limite'] as const
export type EstadoDoTutor = (typeof ESTADOS_DO_TUTOR)[number]

/**
 * Corpo de `POST /v1/tutor/mensagens`: o texto, a atividade aplicada em que o aluno está (ou o material sobre o qual
 * pergunta) e a chave do envio. A turma e o aluno vêm da sessão. Responde 202 com a execução. Com avaliação aberta
 * responde `TUTOR_PAUSADO_EM_AVALIACAO`; no freio, `LIMITE_DIARIO_DO_TUTOR` ou `PACOTE_DO_TUTOR_ESGOTADO`; com a função
 * suspensa, `FUNCAO_SUSPENSA`. Nenhum deles grava mensagem nem conta troca.
 */
export const esquemaPedidoMensagemAoTutor = z.strictObject({
  texto: z.string().trim().min(1).max(TAMANHO_MAXIMO_DA_PERGUNTA_AO_TUTOR),
  atividadeAplicadaId: z.uuid().optional(),
  materialId: z.uuid().optional(),
  chaveEnvio: esquemaChaveEnvio,
})
export type PedidoMensagemAoTutor = z.infer<typeof esquemaPedidoMensagemAoTutor>

export const AUTORES_DE_MENSAGEM_DO_TUTOR = ['aluno', 'tutor'] as const
export type AutorDeMensagemDoTutor = (typeof AUTORES_DE_MENSAGEM_DO_TUTOR)[number]

/**
 * `texto` é a resposta do Tutor, socrática e com a página citada. `assunto_delicado` é a **mensagem fixa** da D36: o
 * Tutor não aconselha, acolhe e manda procurar um adulto da escola, com o CVV (188). O texto dela é fixo no produto, e a
 * tela a mostra com o botão de avisar um adulto.
 */
export const TIPOS_DE_MENSAGEM_DO_TUTOR = ['texto', 'assunto_delicado'] as const
export type TipoDeMensagemDoTutor = (typeof TIPOS_DE_MENSAGEM_DO_TUTOR)[number]

const camposDaMensagem = { id: z.uuid(), criadaEm: z.iso.datetime() }

/** O que o Tutor disse. Toda mensagem dele é saída de IA, rotulada como tal, e ele nunca se passa por pessoa (D58). */
export const esquemaMensagemDoTutorAoAluno = z.discriminatedUnion('tipo', [
  z.strictObject({ ...camposDaMensagem, autor: z.literal('tutor'), tipo: z.literal('texto'), texto: z.string().min(1), citacoes: z.array(esquemaCitacao).max(MAXIMO_DE_CITACOES_DO_TUTOR) }),
  z.strictObject({ ...camposDaMensagem, autor: z.literal('tutor'), tipo: z.literal('assunto_delicado'), texto: z.string().min(1) }),
])
export type MensagemDoTutorAoAluno = z.infer<typeof esquemaMensagemDoTutorAoAluno>

/** O que o aluno escreveu, devolvido só a ele. */
export const esquemaMensagemDoAlunoAoTutor = z.strictObject({ ...camposDaMensagem, autor: z.literal('aluno'), tipo: z.literal('texto'), texto: z.string().min(1) })
export type MensagemDoAlunoAoTutor = z.infer<typeof esquemaMensagemDoAlunoAoTutor>

export const esquemaMensagemDoTutor = z.union([esquemaMensagemDoAlunoAoTutor, esquemaMensagemDoTutorAoAluno])
export type MensagemDoTutor = z.infer<typeof esquemaMensagemDoTutor>

/** Consulta de `GET /v1/tutor/conversa`: a atividade aplicada (sem ela, a conversa fora de atividade) e a paginação para trás. */
export const esquemaConsultaConversaDoTutor = z.strictObject({ atividadeAplicadaId: z.uuid().optional(), ...camposDaConsultaDeConversa })
export type ConsultaConversaDoTutor = z.infer<typeof esquemaConsultaConversaDoTutor>

/**
 * Resposta de `GET /v1/tutor/conversa`: o estado do Tutor para este aluno agora, quanto do freio do dia ele já usou
 * ("Hoje: N de 60"), o título da avaliação que o trava (só no estado `avaliacao`) e as mensagens da conversa, da mais
 * antiga para a mais nova. Só a conversa do próprio aluno.
 */
export const esquemaRespostaConversaDoTutor = z.strictObject({
  estado: z.enum(ESTADOS_DO_TUTOR),
  uso: z.strictObject({ hoje: z.number().int().nonnegative(), limiteDoDia: z.number().int().min(1) }),
  avaliacaoAberta: z.strictObject({ titulo: z.string().min(1) }).nullable(),
  mensagens: z.array(esquemaMensagemDoTutor).max(MAXIMO_DE_MENSAGENS_POR_PAGINA),
  anterior: z.uuid().optional(),
})
export type RespostaConversaDoTutor = z.infer<typeof esquemaRespostaConversaDoTutor>

export const MAXIMO_DE_ITENS_NA_MEMORIA = 50

/**
 * Um trabalho que o Tutor lembra: a atividade, quando o aluno enviou e, **só depois de o professor aprovar o lote**, o
 * resultado e as habilidades em que ele errou mais. Antes da aprovação, `resultado` é nulo: o Tutor não sabe nem diz ao
 * aluno o que a correção ainda pendente achou (regra 70, item 3).
 */
export const esquemaTrabalhoNaMemoria = z.strictObject({
  atividadeAplicadaId: z.uuid(),
  titulo: z.string().min(1),
  enviadaEm: z.iso.datetime().nullable(),
  resultado: z
    .strictObject({
      acertos: z.number().int().nonnegative(),
      total: z.number().int().min(1),
      aReforcar: z.array(esquemaHabilidade).max(6),
    })
    .nullable(),
})

/** Onde o aluno travou com o Tutor: o tipo do sinal e a referência ao trabalho. `atencao_humana` não é memória e não aparece aqui. */
export const esquemaSinalNaMemoria = z.strictObject({
  tipo: z.enum(TIPOS_DE_SINAL_DE_TRABALHO),
  atividadeAplicadaId: z.uuid().nullable(),
  questao: z.number().int().min(1).nullable(),
  criadoEm: z.iso.datetime(),
})

/**
 * Resposta de `GET /v1/tutor/memoria`: o que o Tutor sabe do **trabalho** do aluno (D66), para ele ver e contestar. É
 * derivada dos registros (tentativa, correção de lote aprovado e sinais): não existe tabela nem campo de texto sobre o
 * jeito, o humor, a atenção ou o comportamento do aluno, escrito por modelo ou por pessoa.
 */
export const esquemaRespostaMemoriaDoTutor = z.strictObject({
  trabalhos: z.array(esquemaTrabalhoNaMemoria).max(MAXIMO_DE_ITENS_NA_MEMORIA),
  sinais: z.array(esquemaSinalNaMemoria).max(MAXIMO_DE_ITENS_NA_MEMORIA),
})
export type RespostaMemoriaDoTutor = z.infer<typeof esquemaRespostaMemoriaDoTutor>
