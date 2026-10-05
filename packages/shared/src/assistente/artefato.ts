import { z } from 'zod'
import { esquemaConsultaPaginada, esquemaDePagina } from '../estrutura/paginacao.js'
import { esquemaChaveEnvio } from '../time/chave-envio.js'
import { esquemaAdaptacaoAplicada, esquemaConteudoDoArtefato, TIPOS_DE_ADAPTACAO, TIPOS_DE_ARTEFATO } from './conteudo.js'
import { esquemaParametrosDeFerramenta, FERRAMENTAS_GERADORAS } from './conversa.js'
import { ESTADOS_DE_ENTREGA } from './entrega.js'
import { ESTADOS_DE_ATIVIDADE_APLICADA } from '../atividade/atividade-aplicada.js'

/**
 * As ferramentas e o artefato (MVP, A2; D18, D67, D74): `POST /v1/ferramentas/:ferramenta/gerar`, as rotas de
 * `/v1/artefatos` e `POST /v1/artefatos/:id/adaptar`. O artefato é do professor, ligado à turma e à disciplina, e só o
 * professor com vínculo confirmado na turma o alcança. **O aluno nunca lê o artefato**: ele recebe a prova, sem gabarito,
 * pela atividade aplicada.
 */

/** `:ferramenta` de `POST /v1/ferramentas/:ferramenta/gerar`. */
export const esquemaParametroFerramenta = z.enum(FERRAMENTAS_GERADORAS)

/**
 * Corpo de `POST /v1/ferramentas/:ferramenta/gerar`: os parâmetros da ferramenta e a chave do envio. É o mesmo caso de
 * uso que o cartão da conversa dispara (D18). Responde 202 com a execução; o resultado dela traz o `artefatoId`.
 */
export const esquemaPedidoGerarComFerramenta = esquemaParametrosDeFerramenta.extend({ chaveEnvio: esquemaChaveEnvio }).strict()
export type PedidoGerarComFerramenta = z.infer<typeof esquemaPedidoGerarComFerramenta>

/** Consulta de `GET /v1/artefatos`: a página e a turma. Sem turma, os de todas as turmas com vínculo confirmado do professor. */
export const esquemaConsultaArtefatos = esquemaConsultaPaginada.extend({ turmaId: z.uuid().optional() }).strict()
export type ConsultaArtefatos = z.infer<typeof esquemaConsultaArtefatos>

/** A entrega de uma versão adaptada, resumida: é o que diz se ela está pendente, aprovada ou rejeitada. */
export const esquemaEntregaDoArtefato = z.strictObject({ id: z.uuid(), estado: z.enum(ESTADOS_DE_ENTREGA), decididaEm: z.iso.datetime().nullable() })

/**
 * Um artefato na listagem: o que é, de que turma e disciplina, e, se for versão adaptada, de qual artefato saiu, com
 * que tipos de adaptação e em que estado está a entrega dela. A adaptação é sempre o **tipo**, nunca o motivo nem o
 * aluno (D35, D67).
 */
export const esquemaArtefatoResumido = z.strictObject({
  id: z.uuid(),
  tipo: z.enum(TIPOS_DE_ARTEFATO),
  titulo: z.string().min(1),
  turmaId: z.uuid(),
  disciplinaId: z.uuid(),
  origemId: z.uuid().nullable(),
  adaptacao: esquemaAdaptacaoAplicada.nullable(),
  entrega: esquemaEntregaDoArtefato.nullable(),
  criadoEm: z.iso.datetime(),
})
export type ArtefatoResumido = z.infer<typeof esquemaArtefatoResumido>

export const esquemaRespostaListaDeArtefatos = esquemaDePagina(esquemaArtefatoResumido)
export type RespostaListaDeArtefatos = z.infer<typeof esquemaRespostaListaDeArtefatos>

/** Onde o artefato foi aplicado ("Atribuída à turma"). */
export const esquemaAplicacaoDoArtefato = z.strictObject({
  id: z.uuid(),
  turmaId: z.uuid(),
  estado: z.enum(ESTADOS_DE_ATIVIDADE_APLICADA),
  aplicadaEm: z.iso.datetime(),
})

export const MAXIMO_DE_VERSOES_NO_ARTEFATO = 50

/**
 * Resposta de `GET /v1/artefatos/:id` e de `PATCH /v1/artefatos/:id`: o artefato inteiro, com o conteúdo (questões com
 * gabarito e página citada, ou o plano), as versões adaptadas que saíram dele e as aplicações. Só o professor da turma.
 */
export const esquemaRespostaArtefato = esquemaArtefatoResumido
  .extend({
    conteudo: esquemaConteudoDoArtefato,
    versoesAdaptadas: z.array(esquemaArtefatoResumido).max(MAXIMO_DE_VERSOES_NO_ARTEFATO),
    aplicacoes: z.array(esquemaAplicacaoDoArtefato).max(MAXIMO_DE_VERSOES_NO_ARTEFATO),
  })
  .strict()
export type RespostaArtefato = z.infer<typeof esquemaRespostaArtefato>

/** Corpo de `PATCH /v1/artefatos/:id`: só o título. O conteúdo gerado não se edita por aqui, e o artefato aplicado não muda. */
export const esquemaPedidoRenomearArtefato = z.strictObject({ titulo: z.string().trim().min(1).max(160) })
export type PedidoRenomearArtefato = z.infer<typeof esquemaPedidoRenomearArtefato>

/**
 * Corpo de `POST /v1/artefatos/:id/adaptar`: os **tipos de adaptação**, de lista fechada e sem repetir, o tempo extra (só
 * junto de `tempo_adicional`) e a chave do envio. **Não existe campo de texto**: nada aqui descreve um aluno, uma
 * condição ou um motivo (D35, D67), e campo a mais é `ENTRADA_INVALIDA`. Só atividade objetiva que não é versão adaptada
 * se adapta. Responde 202; a versão nasce com uma entrega `pendente`, e só chega à turma depois de aprovada.
 */
export const esquemaPedidoAdaptarArtefato = z
  .strictObject({
    tipos: z
      .array(z.enum(TIPOS_DE_ADAPTACAO))
      .min(1)
      .max(TIPOS_DE_ADAPTACAO.length)
      .refine((tipos) => new Set(tipos).size === tipos.length, 'tipo repetido'),
    tempoExtraPercentual: z.number().int().min(10).max(100).optional(),
    chaveEnvio: esquemaChaveEnvio,
  })
  .refine((pedido) => pedido.tempoExtraPercentual === undefined || pedido.tipos.includes('tempo_adicional'), { path: ['tempoExtraPercentual'], message: 'tempo extra só com tempo_adicional' })
export type PedidoAdaptarArtefato = z.infer<typeof esquemaPedidoAdaptarArtefato>
