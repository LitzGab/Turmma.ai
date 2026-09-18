import { z } from 'zod'
import { esquemaConsultaPaginada, esquemaDePagina } from './paginacao.js'

/**
 * O vínculo de uma pessoa a uma turma, e a uma disciplina quando é de professor, no ano letivo em curso (glossário,
 * "Vínculo"; regra 60, item 8a). A escola cria, e só o vínculo `confirmado` dá acesso à turma e aos alunos dela (RF3 a
 * RF5).
 */
export const ESTADOS_DE_VINCULO = ['pendente', 'confirmado', 'contestado', 'encerrado'] as const
export type EstadoDeVinculo = (typeof ESTADOS_DE_VINCULO)[number]

/** Os estados de que o professor ainda decide: confirmar ou contestar vale só a partir deles. */
export const ESTADOS_EM_DECISAO = ['pendente', 'contestado'] as const satisfies readonly EstadoDeVinculo[]

/** Os papéis de um vínculo. O de aluno vem do seed no F1, e da lista ou da reivindicação no F2. */
export const PAPEIS_DE_VINCULO = ['professor', 'aluno'] as const
export type PapelDeVinculo = (typeof PAPEIS_DE_VINCULO)[number]

/**
 * Os papéis que a coordenação cria por `POST /v1/vinculos` no F1: só professor. O vínculo de aluno nasceria pendente
 * sem ninguém que o confirme (o aluno não confirma vínculo), e a entrada do aluno é outro fluxo (F2).
 */
export const PAPEIS_DE_VINCULO_PELA_COORDENACAO = ['professor'] as const satisfies readonly PapelDeVinculo[]

/** Por que o professor contesta: código fixo, e o `complemento` curto é opcional. */
export const CONTESTACOES_DE_VINCULO = ['nao_leciono', 'turma_errada', 'disciplina_errada', 'outro'] as const
export type ContestacaoDeVinculo = (typeof CONTESTACOES_DE_VINCULO)[number]

/** Por que o vínculo acabou. `fim_do_ano` é só da virada do ano letivo (10.0). */
export const MOTIVOS_DE_ENCERRAMENTO_DE_VINCULO = ['fim_do_ano', 'desligamento', 'realocacao'] as const
export type MotivoDeEncerramentoDeVinculo = (typeof MOTIVOS_DE_ENCERRAMENTO_DE_VINCULO)[number]

/** Os motivos que a coordenação usa em `POST /v1/vinculos/:id/encerrar`. */
export const MOTIVOS_DE_ENCERRAMENTO_PELA_COORDENACAO = ['desligamento', 'realocacao'] as const satisfies readonly MotivoDeEncerramentoDeVinculo[]

/**
 * O texto livre da contestação: até 140 caracteres, só para a coordenação, nunca em log nem em auditoria, e apagado na
 * virada do ano (`docs/lgpd.md`). A tela avisa "não escreva nome de aluno".
 */
export const TAMANHO_MAXIMO_DO_COMPLEMENTO = 140

/** Corpo de `POST /v1/vinculos`. Estrito: nada de escola, de ano letivo nem de estado, que vêm da sessão e nascem `pendente`. */
export const esquemaPedidoCriarVinculo = z
  .object({
    usuarioId: z.uuid(),
    turmaId: z.uuid(),
    disciplinaId: z.uuid().optional(),
    papel: z.enum(PAPEIS_DE_VINCULO_PELA_COORDENACAO),
  })
  .strict()

export type PedidoCriarVinculo = z.infer<typeof esquemaPedidoCriarVinculo>

/** Consulta de `GET /v1/vinculos`: a página e, opcional, o estado (a coordenação procura os `contestado`). */
export const esquemaConsultaVinculos = esquemaConsultaPaginada.extend({ estado: z.enum(ESTADOS_DE_VINCULO).optional() }).strict()
export type ConsultaVinculos = z.infer<typeof esquemaConsultaVinculos>

/** Corpo de `POST /v1/vinculos/:id/encerrar`. */
export const esquemaPedidoEncerrarVinculo = z.object({ motivo: z.enum(MOTIVOS_DE_ENCERRAMENTO_PELA_COORDENACAO) }).strict()
export type PedidoEncerrarVinculo = z.infer<typeof esquemaPedidoEncerrarVinculo>

/** Corpo de `POST /v1/vinculos/:id/contestar`: o código e, se quiser, um complemento curto. */
export const esquemaPedidoContestarVinculo = z
  .object({
    contestacao: z.enum(CONTESTACOES_DE_VINCULO),
    complemento: z.string().trim().min(1).max(TAMANHO_MAXIMO_DO_COMPLEMENTO).optional(),
  })
  .strict()

export type PedidoContestarVinculo = z.infer<typeof esquemaPedidoContestarVinculo>

const esquemaReferencia = z.object({ id: z.uuid(), nome: z.string() }).strict()

/**
 * O vínculo como o professor dono o vê (`meus-vinculos`, `confirmar`, `contestar`): a turma, a disciplina, o estado, o
 * código da contestação e quando ele decidiu. Nunca o `complemento`, que é só da coordenação.
 */
export const esquemaVinculo = z
  .object({
    id: z.uuid(),
    turma: esquemaReferencia,
    disciplina: esquemaReferencia.optional(),
    estado: z.enum(ESTADOS_DE_VINCULO),
    contestacao: z.enum(CONTESTACOES_DE_VINCULO).optional(),
    decididoEm: z.iso.datetime().optional(),
  })
  .strict()

export type Vinculo = z.infer<typeof esquemaVinculo>

/**
 * O vínculo como a coordenação o vê (`GET /v1/vinculos`, criar, encerrar): o do professor, mais o id de quem é (sem
 * nome: a coordenação já tem a equipe), o papel, o `complemento` da contestação e o motivo do encerramento.
 */
export const esquemaVinculoDaCoordenacao = esquemaVinculo
  .extend({
    usuarioId: z.uuid(),
    papel: z.enum(PAPEIS_DE_VINCULO),
    complemento: z.string().optional(),
    motivoEncerramento: z.enum(MOTIVOS_DE_ENCERRAMENTO_DE_VINCULO).optional(),
  })
  .strict()

export type VinculoDaCoordenacao = z.infer<typeof esquemaVinculoDaCoordenacao>

/** Resposta de `POST /v1/vinculos/:id/confirmar` e `/contestar`. */
export const esquemaRespostaVinculo = esquemaVinculo
export type RespostaVinculo = Vinculo

/** Resposta de `POST /v1/vinculos` e `/:id/encerrar`. */
export const esquemaRespostaVinculoDaCoordenacao = esquemaVinculoDaCoordenacao
export type RespostaVinculoDaCoordenacao = VinculoDaCoordenacao

/** Resposta de `GET /v1/vinculos`. */
export const esquemaRespostaListaDeVinculos = esquemaDePagina(esquemaVinculoDaCoordenacao)
export type RespostaListaDeVinculos = z.infer<typeof esquemaRespostaListaDeVinculos>

/** Resposta de `GET /v1/meus-vinculos`. */
export const esquemaRespostaMeusVinculos = esquemaDePagina(esquemaVinculo)
export type RespostaMeusVinculos = z.infer<typeof esquemaRespostaMeusVinculos>
