import { z } from 'zod'
import { ESTADOS_DE_ENTREGA, TIPOS_DE_ENTREGA } from '../assistente/entrega.js'
import { esquemaConsultaPaginada } from '../estrutura/paginacao.js'
import { esquemaSerie } from '../estrutura/serie.js'
import { AGENTES, CHAVES_DE_FUNCAO } from '../time/funcoes.js'
import { esquemaChaveDeFuncao, esquemaFuncaoDoTime } from '../time/time.js'

/**
 * A governança de IA da coordenação (MVP, A5; D9, D45, D60, D64; regra 70, itens 5, 6, 8 e 9): o que a IA gerou e se uma
 * pessoa aprovou, o que cada função faz sozinha, a suspensão por função e o consumo.
 *
 * **Tudo aqui é agregado ou sem pessoa.** Nenhum schema desta pasta tem campo de professor (id, nome, quem aprovou), nem
 * turma, que numa disciplina aponta um professor só; nenhuma consulta aceita filtro ou ordenação por professor. Os
 * objetos são estritos: o campo que alguém acrescentar por engano é recusado. O dado nominal tem rota própria, com
 * finalidade e auditoria (`GET /v1/analista/nominal`).
 */

/** Consulta de `GET /v1/governanca/resumo`: a página e o estado. Não existe `professorId`, `turmaId` nem `ordenarPor`. */
export const esquemaConsultaResumoDaGovernanca = esquemaConsultaPaginada.extend({ estado: z.enum(ESTADOS_DE_ENTREGA).optional() }).strict()
export type ConsultaResumoDaGovernanca = z.infer<typeof esquemaConsultaResumoDaGovernanca>

/**
 * Uma linha de "o que a IA gerou e quem aprovou": a entrega, de que função veio, o estado e as datas, com a série da
 * turma. **Sem turma e sem quem decidiu**: aqui a coordenação vê que uma pessoa decidiu e quando; quem, só na auditoria.
 */
export const esquemaItemDaGovernanca = z.strictObject({
  id: z.uuid(),
  funcao: esquemaChaveDeFuncao,
  tipo: z.enum(TIPOS_DE_ENTREGA),
  estado: z.enum(ESTADOS_DE_ENTREGA),
  serie: esquemaSerie,
  criadaEm: z.iso.datetime(),
  decididaEm: z.iso.datetime().nullable(),
})
export type ItemDaGovernanca = z.infer<typeof esquemaItemDaGovernanca>

/**
 * Resposta de `GET /v1/governanca/resumo`: os números da escola no ano em curso e as entregas, da mais nova para a mais
 * antiga. `geradoPorIa` conta artefatos e lotes de correção; `aprovadoPorPessoa`, `rejeitado` e `esperando`, as entregas.
 */
export const esquemaRespostaResumoDaGovernanca = z.strictObject({
  numeros: z.strictObject({
    geradoPorIa: z.number().int().nonnegative(),
    aprovadoPorPessoa: z.number().int().nonnegative(),
    rejeitado: z.number().int().nonnegative(),
    esperando: z.number().int().nonnegative(),
  }),
  itens: z.array(esquemaItemDaGovernanca),
  proxima: z.uuid().optional(),
})
export type RespostaResumoDaGovernanca = z.infer<typeof esquemaRespostaResumoDaGovernanca>

/**
 * Por que a coordenação suspende uma função (D60): código fixo, nunca texto livre, que é onde o nome de um aluno ou de
 * um professor acabaria escrito. Opcional: suspender não pode ser mais difícil que deixar ligado.
 */
export const MOTIVOS_DE_SUSPENSAO = ['erro_recorrente', 'revisao_pedagogica', 'pedido_da_comunidade', 'incidente', 'decisao_da_escola'] as const
export type MotivoDeSuspensao = (typeof MOTIVOS_DE_SUSPENSAO)[number]

export const NOME_DO_MOTIVO_DE_SUSPENSAO: Readonly<Record<MotivoDeSuspensao, string>> = {
  erro_recorrente: 'A função errou mais de uma vez',
  revisao_pedagogica: 'A escola está revendo o uso pedagógico',
  pedido_da_comunidade: 'Pedido de professor, aluno ou família',
  incidente: 'Houve um incidente e a escola está apurando',
  decisao_da_escola: 'Decisão da escola',
}

/** A suspensão vigente de uma função: desde quando e por quê. Quem suspendeu fica na auditoria (`funcao.suspensa`). */
export const esquemaSuspensaoVigente = z.strictObject({ suspensaEm: z.iso.datetime(), motivo: z.enum(MOTIVOS_DE_SUSPENSAO).nullable() })

/** Uma função na governança: o mesmo que `GET /v1/time` mostra, com a suspensão vigente. */
export const esquemaFuncaoDaGovernanca = esquemaFuncaoDoTime.extend({ suspensao: esquemaSuspensaoVigente.nullable() }).strict()
export type FuncaoDaGovernanca = z.infer<typeof esquemaFuncaoDaGovernanca>

/** Resposta de `GET /v1/governanca/funcoes`: os três agentes e as funções, com a autonomia em português comum (regra 70, item 5). */
export const esquemaRespostaFuncoesDaGovernanca = z.strictObject({
  agentes: z
    .array(z.strictObject({ agente: z.enum(AGENTES), nome: z.string().min(1), funcoes: z.array(esquemaFuncaoDaGovernanca).min(1).max(CHAVES_DE_FUNCAO.length) }))
    .length(AGENTES.length),
})
export type RespostaFuncoesDaGovernanca = z.infer<typeof esquemaRespostaFuncoesDaGovernanca>

/**
 * Corpo de `POST /v1/governanca/funcoes/:chave/suspender`: o motivo, se a coordenação quiser dar. A suspensão vale no
 * servidor: a função suspensa recusa executar com `FUNCAO_SUSPENSA`, e as outras do mesmo agente continuam. Suspender a
 * que já está suspensa devolve a suspensão vigente, sem segunda linha (o banco aceita uma vigente por escola e função).
 */
export const esquemaPedidoSuspenderFuncao = z.strictObject({ motivo: z.enum(MOTIVOS_DE_SUSPENSAO).optional() })
export type PedidoSuspenderFuncao = z.infer<typeof esquemaPedidoSuspenderFuncao>

/** Resposta de `POST …/suspender` e de `POST …/retomar` (corpo vazio e estrito): a função como ficou. */
export const esquemaRespostaFuncaoDaGovernanca = esquemaFuncaoDaGovernanca
export type RespostaFuncaoDaGovernanca = FuncaoDaGovernanca

/** Consulta de `GET /v1/governanca/consumo`: o mês (`2026-10`). Sem ele, o mês corrente no fuso da escola. */
export const esquemaConsultaConsumo = z.strictObject({ mes: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional() })
export type ConsultaConsumo = z.infer<typeof esquemaConsultaConsumo>

/**
 * O consumo somado: chamadas ao modelo, tokens de entrada e de saída, custo e quantas chamadas saíram para provedor
 * externo. O custo é em **milionésimos de real** (`custoMicros`), inteiro, para a soma não perder centavo.
 */
export const esquemaConsumoSomado = z.strictObject({
  chamadas: z.number().int().nonnegative(),
  tokensDeEntrada: z.number().int().nonnegative(),
  tokensDeSaida: z.number().int().nonnegative(),
  custoMicros: z.number().int().nonnegative(),
  comEnvioExterno: z.number().int().nonnegative(),
})
export type ConsumoSomado = z.infer<typeof esquemaConsumoSomado>

/**
 * Resposta de `GET /v1/governanca/consumo` (D14, D38): o consumo do mês, total e por função, e o pacote do Tutor (as
 * trocas do mês contra o pacote configurado, somando as turmas). **Por função, nunca por pessoa**: não existe consumo
 * por professor, em tela nenhuma nem no banco (D64).
 */
export const esquemaRespostaConsumo = z.strictObject({
  mes: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  total: esquemaConsumoSomado,
  porFuncao: z.array(esquemaConsumoSomado.extend({ funcao: esquemaChaveDeFuncao }).strict()).max(CHAVES_DE_FUNCAO.length),
  tutor: z.strictObject({
    trocasNoMes: z.number().int().nonnegative(),
    pacoteDoMes: z.number().int().nonnegative(),
    trocasPorDiaPorAluno: z.number().int().min(1),
    trocasPorMesPorAluno: z.number().int().min(1),
  }),
})
export type RespostaConsumo = z.infer<typeof esquemaRespostaConsumo>
