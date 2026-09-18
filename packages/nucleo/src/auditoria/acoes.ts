import { z } from 'zod'
import { FINALIDADE_DA_REDEFINICAO_PELO_OPERADOR, FINALIDADES_DA_REDEFINICAO_DE_MFA } from '@educa/shared'
import { TIPOS_DE_REDE } from '../db/schema/rede.js'

/**
 * Nomes que nenhum campo de `antes` ou `depois` pode ter, nem como parte do nome (`nomeDoAluno`,
 * `senhaHash`): a auditoria guarda ids, estados e datas, e fica cinco anos (Tech Spec, seção 3).
 */
export const CAMPOS_PROIBIDOS_NA_AUDITORIA = ['nome', 'email', 'matricula', 'complemento', 'hash', 'senha', 'segredo'] as const

type EsquemaDeEstado = z.ZodObject

export interface DefinicaoDeAcao {
  /** A entidade do registro. A de `rede` é a única gravada sem escola, e só pelo operador. */
  readonly entidade: string
  /** Lista fechada do estado anterior, ou `null` quando a ação não tem estado anterior (criação). */
  readonly antes: EsquemaDeEstado | null
  /** Lista fechada do estado posterior, ou `null` quando a ação não tem estado posterior. */
  readonly depois: EsquemaDeEstado | null
  /**
   * Os códigos de finalidade que a ação aceita (`z.enum`), ou `null` quando ela não leva finalidade.
   * Nunca texto livre: a auditoria fica cinco anos, e texto livre é onde o nome do aluno entra.
   */
  readonly finalidade: z.ZodEnum | null
}

/**
 * Toda ação que a auditoria aceita, com a lista fechada de `antes`, `depois` e `finalidade`. Cada tarefa
 * acrescenta as dela; ação fora daqui é recusada. Todo objeto é `strictObject`: campo fora da lista é
 * recusado, nunca descartado em silêncio.
 */
export const ACOES_DE_AUDITORIA = {
  'rede.criada': {
    entidade: 'rede',
    antes: null,
    depois: z.strictObject({ tipo: z.enum(TIPOS_DE_REDE) }),
    finalidade: null,
  },
  'escola.criada': {
    entidade: 'escola',
    antes: null,
    depois: z.strictObject({ redeId: z.uuid() }),
    finalidade: null,
  },
  /** A coordenação mudou os minutos sem uso até a sessão vencer (5.0): só os dois números, antes e depois. */
  'escola.sessao_alterada': {
    entidade: 'escola',
    antes: z.strictObject({ inatividadeAlunoMin: z.number().int(), inatividadeEquipeMin: z.number().int() }),
    depois: z.strictObject({ inatividadeAlunoMin: z.number().int(), inatividadeEquipeMin: z.number().int() }),
    finalidade: null,
  },
  /**
   * O cookie de renovação anterior voltou depois de o atual já ter sido usado e da janela de 30 s (5.0): alguém
   * guardou um cookie velho. A família inteira foi encerrada; o registro leva a família e quantas sessões caíram.
   */
  'sessao.reuso_de_refresh': {
    entidade: 'sessao',
    antes: null,
    depois: z.strictObject({ familia: z.uuid(), sessoesEncerradas: z.number().int() }),
    finalidade: null,
  },
  /**
   * O segundo fator de uma conta foi apagado (6.0, RF19): por outro coordenador da escola, ou pelo operador a pedido
   * formal dela. `entidadeId` é o usuário da escola do registro; `antes` diz se o MFA estava ativo. O operador leva o
   * número do pedido (`pedidoDoOperador`), nunca texto livre.
   */
  'usuario.mfa_redefinido': {
    entidade: 'usuario',
    antes: z.strictObject({ mfaAtivo: z.boolean() }),
    depois: z.strictObject({ mfaAtivo: z.literal(false), pedidoDoOperador: z.number().int().positive().optional() }),
    finalidade: z.enum([...FINALIDADES_DA_REDEFINICAO_DE_MFA, FINALIDADE_DA_REDEFINICAO_PELO_OPERADOR]),
  },
  /**
   * A coordenação pediu a redefinição, e nada mudou: a conta do usuário também tem usuário ativo em outra escola, e a
   * credencial é global (Tech Spec, seção 5, "TOTP"). A escola recorre ao operador. O registro não diz qual escola.
   */
  'usuario.mfa_redefinicao_recusada': {
    entidade: 'usuario',
    antes: null,
    depois: null,
    finalidade: z.enum(FINALIDADES_DA_REDEFINICAO_DE_MFA),
  },
  /**
   * O operador gerou o convite do primeiro coordenador (7.0, RF1, RF19), com `ops:convite-coordenador`: o usuário
   * convidado, ainda inativo, até quando o convite vale e se a conta do e-mail foi criada agora (`contaNova`) ou já
   * existia. Nunca o nome, o e-mail nem o token.
   */
  'convite.criado': {
    entidade: 'convite',
    antes: null,
    depois: z.strictObject({ usuarioId: z.uuid(), expiraEm: z.iso.datetime(), contaNova: z.boolean() }),
    finalidade: null,
  },
  /** O operador revogou o convite (7.0, RF19), com `ops:revogar-convite`: o link deixa de valer, usado ou não. */
  'convite.revogado': {
    entidade: 'convite',
    antes: null,
    depois: null,
    finalidade: null,
  },
  /**
   * A pessoa abriu o link e aceitou o convite (7.0). `usuarioAtivo` diz se o aceite já ativou o usuário (conta nova,
   * que definiu a senha ali) ou se ele espera o login com a senha que a conta já tem (conta de outra escola).
   */
  'convite.aceito': {
    entidade: 'convite',
    antes: null,
    depois: z.strictObject({ usuarioId: z.uuid(), usuarioAtivo: z.boolean() }),
    finalidade: null,
  },
  /**
   * O usuário que esperava o convite aceito foi ativado no login por e-mail, com o bilhete do convite e depois da senha
   * e do segundo fator que a conta já tinha (7.0; Tech Spec, seção 5, "Etapas"). Leva o convite que o ativou.
   */
  'usuario.ativado_por_convite': {
    entidade: 'usuario',
    antes: null,
    depois: z.strictObject({ conviteId: z.uuid() }),
    finalidade: null,
  },
} as const satisfies Record<string, DefinicaoDeAcao>

export type AcaoDeAuditoria = keyof typeof ACOES_DE_AUDITORIA

type EsquemaDa<Acao extends AcaoDeAuditoria, Parte extends 'antes' | 'depois' | 'finalidade'> = (typeof ACOES_DE_AUDITORIA)[Acao][Parte] extends infer Esquema
  ? Esquema extends z.ZodType
    ? z.input<Esquema>
    : never
  : never

/** O `antes`, o `depois` e a `finalidade` que a ação aceita, conferidos também em tempo de execução. */
export type EstadosDaAcao<Acao extends AcaoDeAuditoria> = {
  antes?: EsquemaDa<Acao, 'antes'>
  depois?: EsquemaDa<Acao, 'depois'>
  finalidade?: EsquemaDa<Acao, 'finalidade'>
}

/**
 * Texto que a auditoria aceita: id e data, dos construtores do zod (`z.uuid()`, `z.iso.datetime()`,
 * `z.iso.date()`) e sem nenhuma verificação a mais. Um `refine` ou um `overwrite` (`trim`, `toLowerCase`)
 * rodam depois do formato e poderiam aceitar ou devolver outro texto; um `z.stringFormat('uuid', ...)`
 * leva o nome do formato sem a regra dele. Texto sem formato é texto livre, e é recusado.
 */
function textoDeIdOuData(esquema: z.ZodType): boolean {
  const semVerificacaoExtra = (esquema._zod.def.checks ?? []).length === 0
  return semVerificacaoExtra && (esquema instanceof z.ZodUUID || esquema instanceof z.ZodISODateTime || esquema instanceof z.ZodISODate)
}

/** Folhas que não carregam texto livre: código fixo, número, sim ou não. */
const FOLHAS_PERMITIDAS: ReadonlySet<string> = new Set(['enum', 'literal', 'boolean', 'number'])

/**
 * Confere um schema falhando fechado: só passa o tipo que esta função conhece e sabe que guarda id,
 * estado ou data. `record`, `unknown`, `any`, `union`, `default`, `pipe`, `lazy`, texto sem formato e
 * qualquer outro tipo viram problema, porque aceitariam campo ou valor que ninguém declarou.
 */
function problemasDoEsquema(esquema: z.ZodType, caminho: string): string[] {
  const { type: tipo } = esquema._zod.def
  if (esquema instanceof z.ZodObject) {
    const problemas: string[] = []
    if (!(esquema.def.catchall instanceof z.ZodNever)) problemas.push(`${caminho}: objeto não estrito`)
    for (const [campo, valor] of Object.entries(esquema.shape)) {
      const minusculo = campo.toLowerCase()
      if (CAMPOS_PROIBIDOS_NA_AUDITORIA.some((proibido) => minusculo.includes(proibido))) problemas.push(`${caminho}.${campo}: nome proibido`)
      problemas.push(...problemasDoEsquema(valor as z.ZodType, `${caminho}.${campo}`))
    }
    return problemas
  }
  if (esquema instanceof z.ZodOptional || esquema instanceof z.ZodNullable) return problemasDoEsquema(esquema.unwrap() as z.ZodType, caminho)
  if (esquema instanceof z.ZodArray) return problemasDoEsquema(esquema.element as z.ZodType, caminho)
  if (tipo === 'string') return textoDeIdOuData(esquema) ? [] : [`${caminho}: texto sem formato de id ou data`]
  return FOLHAS_PERMITIDAS.has(tipo) ? [] : [`${caminho}: tipo não permitido (${tipo})`]
}

/**
 * Confere um mapa de ações inteiro: nenhum campo, em nenhuma profundidade, com nome proibido; todo objeto
 * estrito; só tipos que guardam id, estado ou data; finalidade só como `enum`. Devolve os caminhos com
 * problema (só nomes de campo e de tipo, nunca valor).
 */
export function problemasDoMapaDeAcoes(mapa: Readonly<Record<string, DefinicaoDeAcao>>): string[] {
  return Object.entries(mapa).flatMap(([acao, definicao]) => [
    ...(['antes', 'depois'] as const).flatMap((parte) => {
      const esquema = definicao[parte]
      if (esquema === null) return []
      if (!(esquema instanceof z.ZodObject)) return [`${acao}.${parte}: precisa ser objeto estrito`]
      return problemasDoEsquema(esquema, `${acao}.${parte}`)
    }),
    ...(definicao.finalidade === null || definicao.finalidade instanceof z.ZodEnum ? [] : [`${acao}.finalidade: precisa ser enum`]),
  ])
}

// Falha no carregamento do módulo: um mapa com campo proibido não chega a gravar uma linha.
const problemasDoMapa = problemasDoMapaDeAcoes(ACOES_DE_AUDITORIA)
if (problemasDoMapa.length > 0) throw new Error(`mapa de auditoria inválido: ${problemasDoMapa.join('; ')}`)
