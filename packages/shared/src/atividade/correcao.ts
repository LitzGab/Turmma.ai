import { z } from 'zod'
import { ALTERNATIVAS_POR_QUESTAO, esquemaHabilidade } from '../assistente/conteudo.js'
import { MAXIMO_DE_QUESTOES_POR_ATIVIDADE } from '../assistente/conversa.js'
import { esquemaAutorDaDecisao, esquemaEntrega, ESTADOS_DE_ENTREGA } from '../assistente/entrega.js'
import { esquemaAcertoPorHabilidade, esquemaAlternativa, esquemaNumeroDaQuestao } from './prova.js'

/**
 * A correção de objetiva e a aprovação do lote (MVP, A3; D33, D46, D55, D56): `GET /v1/atividades-aplicadas/:id/correcao`,
 * `POST …/correcao/destaques/:alunoId/abrir` e `POST /v1/entregas/:id/aprovar-lote`. A correção é **determinística**, pelo
 * gabarito; o que ela produz é diagnóstico formativo por habilidade, e **não existe `Nota`** nesta fatia (D46). Não há
 * discursiva: nenhum campo daqui guarda nota, conceito ou devolutiva sobre texto de aluno (D55).
 */

/**
 * Por que a correção de um aluno é destacada e precisa ser aberta antes da aprovação (D33). São fatos sobre o trabalho,
 * e nenhum conclui sobre a pessoa (D57):
 * - `em_branco`: enviou, ou a atividade encerrou, sem resposta em nenhuma questão;
 * - `fora_do_historico`: o acerto ficou muito longe do que o próprio aluno teve nos lotes aprovados antes;
 * - `padrao_de_erro`: as respostas têm um padrão que pede olhar humano (a mesma alternativa em todas, ou erro justamente
 *   onde a turma quase toda acertou).
 */
export const MOTIVOS_DE_DESTAQUE = ['em_branco', 'fora_do_historico', 'padrao_de_erro'] as const
export type MotivoDeDestaque = (typeof MOTIVOS_DE_DESTAQUE)[number]

export const NOME_DO_MOTIVO_DE_DESTAQUE: Readonly<Record<MotivoDeDestaque, string>> = {
  em_branco: 'Em branco',
  fora_do_historico: 'Muito fora do histórico do aluno',
  padrao_de_erro: 'Padrão de erro para conferir',
}

/**
 * O que se guarda em `correcao.por_habilidade`: por código do catálogo, quantas questões o aluno acertou, de quantas.
 * É o diagnóstico (D46). Só código e contagem: sem texto.
 */
export const esquemaDiagnosticoGravado = z
  .array(z.strictObject({ codigo: z.string().min(1).max(20), acertos: z.number().int().nonnegative(), total: z.number().int().min(1) }))
  .max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE)
export type DiagnosticoGravado = z.infer<typeof esquemaDiagnosticoGravado>

/** Uma faixa da distribuição: quantos alunos acertaram de `de` a `ate` questões. */
export const esquemaFaixaDeAcertos = z.strictObject({ de: z.number().int().nonnegative(), ate: z.number().int().nonnegative(), alunos: z.number().int().nonnegative() })

/** Uma questão no lote: quantos acertaram, quantos marcaram cada alternativa e quantos deixaram em branco. É onde aparece o gabarito suspeito. */
export const esquemaQuestaoDoLote = z.strictObject({
  numero: esquemaNumeroDaQuestao,
  habilidade: esquemaHabilidade,
  gabarito: esquemaAlternativa,
  acertos: z.number().int().nonnegative(),
  porAlternativa: z.array(z.number().int().nonnegative()).length(ALTERNATIVAS_POR_QUESTAO),
  emBranco: z.number().int().nonnegative(),
})

/**
 * O resumo do lote, só com número somado: quantos alunos a turma tem, quantos enviaram, a média de **acertos** (em
 * questões, não é nota), a distribuição, o acerto por habilidade e por questão. Nenhum nome.
 */
export const esquemaResumoDoLote = z.strictObject({
  alunosDaTurma: z.number().int().nonnegative(),
  corrigidos: z.number().int().nonnegative(),
  questoes: z.number().int().min(1).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE),
  mediaDeAcertos: z.number().nonnegative(),
  distribuicao: z.array(esquemaFaixaDeAcertos).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE + 1),
  porHabilidade: z.array(esquemaAcertoPorHabilidade).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE),
  porQuestao: z.array(esquemaQuestaoDoLote).min(1).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE),
})
export type ResumoDoLote = z.infer<typeof esquemaResumoDoLote>

export const MAXIMO_DE_ALUNOS_NO_LOTE = 200

/**
 * O que se guarda em `validacao_do_lote.apresentado` (D56): o resumo que o professor viu e os destaques que a tela
 * mostrou, cada um com o aluno (só o id) e os motivos. É a prova do que foi **apresentado**; por isso é cópia, e não
 * referência às correções, que saem do banco se o aluno for eliminado.
 */
export const esquemaLoteApresentado = z.strictObject({
  resumo: esquemaResumoDoLote,
  destaques: z.array(z.strictObject({ alunoId: z.uuid(), motivos: z.array(z.enum(MOTIVOS_DE_DESTAQUE)).min(1).max(MOTIVOS_DE_DESTAQUE.length) })).max(MAXIMO_DE_ALUNOS_NO_LOTE),
})
export type LoteApresentado = z.infer<typeof esquemaLoteApresentado>

/** O que se guarda em `validacao_do_lote.aberto` (D56): cada destaque que o professor abriu, e quando. */
export const esquemaDestaquesAbertos = z.array(z.strictObject({ alunoId: z.uuid(), abertoEm: z.iso.datetime() })).max(MAXIMO_DE_ALUNOS_NO_LOTE)
export type DestaquesAbertos = z.infer<typeof esquemaDestaquesAbertos>

/**
 * O registro da validação (D56; glossário, "Validação qualificada e documentada"): o que foi apresentado, o que foi
 * aberto, quem confirmou e quando. O banco só o aceita com todos os destaques apresentados entre os abertos.
 */
export const esquemaValidacaoDoLote = z.strictObject({
  id: z.uuid(),
  apresentado: esquemaLoteApresentado,
  aberto: esquemaDestaquesAbertos,
  /** Nulo só se quem confirmou foi eliminado da escola depois: o id fica no banco e na auditoria. */
  confirmadaPor: esquemaAutorDaDecisao.nullable(),
  confirmadaEm: z.iso.datetime(),
})
export type ValidacaoDoLote = z.infer<typeof esquemaValidacaoDoLote>

/** A correção de um aluno na lista do lote: o nome (só o professor da turma o recebe, D34) e os acertos. */
export const esquemaCorrecaoDoAluno = z.strictObject({
  alunoId: z.uuid(),
  nome: z.string().min(1),
  acertos: z.number().int().nonnegative(),
  total: z.number().int().min(1),
  emBranco: z.number().int().nonnegative(),
})

/** Um destaque na lista: a correção do aluno, os motivos e, se já foi aberto, quando. */
export const esquemaDestaque = esquemaCorrecaoDoAluno
  .extend({
    motivos: z.array(z.enum(MOTIVOS_DE_DESTAQUE)).min(1).max(MOTIVOS_DE_DESTAQUE.length),
    abertoEm: z.iso.datetime().nullable(),
  })
  .strict()
export type Destaque = z.infer<typeof esquemaDestaque>

/**
 * Resposta de `GET /v1/atividades-aplicadas/:id/correcao`, para o professor da turma: a entrega do lote, o resumo, os
 * destaques (abertos ou não), as outras correções e, depois de aprovado, o registro da validação. `podeAprovar` só é
 * verdadeiro com a entrega pendente e todos os destaques abertos: é o que libera o botão, e o contador diz por quê.
 */
export const esquemaRespostaCorrecaoDoLote = z.strictObject({
  atividadeAplicadaId: z.uuid(),
  titulo: z.string().min(1),
  entrega: z.strictObject({ id: z.uuid(), estado: z.enum(ESTADOS_DE_ENTREGA) }),
  resumo: esquemaResumoDoLote,
  destaques: z.array(esquemaDestaque).max(MAXIMO_DE_ALUNOS_NO_LOTE),
  outras: z.array(esquemaCorrecaoDoAluno).max(MAXIMO_DE_ALUNOS_NO_LOTE),
  destaquesAbertos: z.number().int().nonnegative(),
  podeAprovar: z.boolean(),
  validacao: esquemaValidacaoDoLote.nullable(),
})
export type RespostaCorrecaoDoLote = z.infer<typeof esquemaRespostaCorrecaoDoLote>

/** Uma questão na correção aberta de um aluno: o que ele marcou, o gabarito e se acertou. */
export const esquemaRespostaCorrigida = z.strictObject({
  questao: esquemaNumeroDaQuestao,
  alternativa: esquemaAlternativa.nullable(),
  gabarito: esquemaAlternativa,
  correta: z.boolean(),
})

/**
 * Resposta de `POST /v1/atividades-aplicadas/:id/correcao/destaques/:alunoId/abrir`: o destaque, agora aberto, com as
 * respostas do aluno questão a questão e o acerto dele nos lotes aprovados antes (o histórico que explica o
 * `fora_do_historico`). **Abrir é o que fica registrado** (D56): grava quem abriu e quando, uma vez só, e vai para a
 * auditoria. Abrir de novo devolve o mesmo, com a primeira hora. O aluno fora dos destaques responde como inexistente.
 */
export const esquemaRespostaDestaqueAberto = z.strictObject({
  destaque: esquemaDestaque,
  respostas: z.array(esquemaRespostaCorrigida).min(1).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE),
  historico: z.array(z.strictObject({ titulo: z.string().min(1), acertos: z.number().int().nonnegative(), total: z.number().int().min(1) })).max(10),
})
export type RespostaDestaqueAberto = z.infer<typeof esquemaRespostaDestaqueAberto>

/**
 * Resposta de `POST /v1/entregas/:id/aprovar-lote` (corpo vazio e estrito, `esquemaPedidoSemCorpo`): a entrega aprovada
 * e o registro da validação que a aprovação gravou. Com destaque sem abrir responde `DESTAQUES_NAO_ABERTOS`; com a
 * entrega já decidida, `ENTREGA_JA_DECIDIDA`. É a partir daqui que o aluno alcança o diagnóstico dele.
 */
export const esquemaRespostaLoteAprovado = z.strictObject({
  entrega: esquemaEntrega,
  validacao: esquemaValidacaoDoLote,
})
export type RespostaLoteAprovado = z.infer<typeof esquemaRespostaLoteAprovado>
