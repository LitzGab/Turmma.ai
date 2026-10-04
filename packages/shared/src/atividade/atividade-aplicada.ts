import { z } from 'zod'
import { ESTADOS_DE_ENTREGA } from '../assistente/entrega.js'
import { esquemaConsultaPaginada, esquemaDePagina } from '../estrutura/paginacao.js'

/**
 * A atividade aplicada (MVP, A3): o professor aplica uma atividade objetiva à turma, os alunos respondem, e o professor
 * encerra. **Aplicar é o ato humano registrado que leva a saída da IA ao aluno** (regra 70, item 3): fica com autor e
 * data na linha e na auditoria (`atividade.aplicada`). Nesta fatia não há `Nota` (D46): o que sai é diagnóstico formativo.
 */
export const ESTADOS_DE_ATIVIDADE_APLICADA = ['aberta', 'encerrada'] as const
export type EstadoDeAtividadeAplicada = (typeof ESTADOS_DE_ATIVIDADE_APLICADA)[number]

/**
 * Corpo de `POST /v1/atividades-aplicadas`: o artefato, a turma e se é avaliativa. Só atividade objetiva se aplica.
 * A versão adaptada só se aplica com a entrega dela `aprovada`: sem isso, `VERSAO_ADAPTADA_NAO_APROVADA`, e o banco
 * recusa mesmo por fora da API. Com a avaliativa aberta, o Tutor da turma fica travado (regra 30, item 10).
 *
 * A versão adaptada vai para a turma como qualquer atividade: **não existe vínculo entre aluno e adaptação** (D35).
 */
export const esquemaPedidoAplicarAtividade = z.strictObject({
  artefatoId: z.uuid(),
  turmaId: z.uuid(),
  avaliativa: z.boolean(),
})
export type PedidoAplicarAtividade = z.infer<typeof esquemaPedidoAplicarAtividade>

/** Consulta de `GET /v1/atividades-aplicadas`: a turma (obrigatória, com vínculo confirmado do professor) e a página. */
export const esquemaConsultaAtividadesAplicadas = esquemaConsultaPaginada.extend({ turmaId: z.uuid() }).strict()
export type ConsultaAtividadesAplicadas = z.infer<typeof esquemaConsultaAtividadesAplicadas>

/**
 * Uma atividade aplicada, como o professor da turma a vê: de que artefato veio, o estado, quantos alunos a turma tem,
 * quantos começaram e quantos enviaram (só contagem), e a entrega do lote de correção, quando já existe.
 */
export const esquemaAtividadeAplicada = z.strictObject({
  id: z.uuid(),
  artefatoId: z.uuid(),
  turmaId: z.uuid(),
  titulo: z.string().min(1),
  avaliativa: z.boolean(),
  estado: z.enum(ESTADOS_DE_ATIVIDADE_APLICADA),
  questoes: z.number().int().min(1),
  aplicadaEm: z.iso.datetime(),
  encerradaEm: z.iso.datetime().nullable(),
  participacao: z.strictObject({
    alunos: z.number().int().nonnegative(),
    iniciaram: z.number().int().nonnegative(),
    enviaram: z.number().int().nonnegative(),
  }),
  entrega: z.strictObject({ id: z.uuid(), estado: z.enum(ESTADOS_DE_ENTREGA) }).nullable(),
})
export type AtividadeAplicada = z.infer<typeof esquemaAtividadeAplicada>

/** Resposta de `POST /v1/atividades-aplicadas` (201). */
export const esquemaRespostaAtividadeAplicada = esquemaAtividadeAplicada
export type RespostaAtividadeAplicada = AtividadeAplicada

export const esquemaRespostaListaDeAtividadesAplicadas = esquemaDePagina(esquemaAtividadeAplicada)
export type RespostaListaDeAtividadesAplicadas = z.infer<typeof esquemaRespostaListaDeAtividadesAplicadas>

/** Corpo de `POST /v1/atividades-aplicadas/:id/encerrar`, `POST /v1/atividades-aplicadas/:id/enviar` e dos outros `POST` sem dado: vazio e estrito. */
export const esquemaPedidoSemCorpo = z.strictObject({})
export type PedidoSemCorpo = z.infer<typeof esquemaPedidoSemCorpo>

/**
 * Resposta de `POST /v1/atividades-aplicadas/:id/encerrar`: a atividade, já `encerrada`, e a execução da correção, que
 * monta o lote e a entrega pendente. Encerrar de novo devolve o mesmo, sem segundo lote (o banco aceita um lote não
 * rejeitado por atividade aplicada). Com a função `correcao_de_objetiva` suspensa, a atividade encerra e `execucaoId`
 * vem nulo: a correção só roda quando a coordenação retomar a função e o professor encerrar de novo.
 */
export const esquemaRespostaAtividadeEncerrada = z.strictObject({
  atividade: esquemaAtividadeAplicada,
  execucaoId: z.uuid().nullable(),
})
export type RespostaAtividadeEncerrada = z.infer<typeof esquemaRespostaAtividadeEncerrada>
