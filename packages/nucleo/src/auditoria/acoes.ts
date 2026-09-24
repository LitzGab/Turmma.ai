import { z } from 'zod'
import {
  CONTESTACOES_DE_VINCULO,
  ESTADOS_DE_VINCULO,
  ESTADOS_EM_DECISAO,
  FINALIDADE_DA_REDEFINICAO_PELO_OPERADOR,
  FINALIDADES_DA_LEITURA_DE_ALUNOS,
  FINALIDADES_DA_REDEFINICAO_DE_MFA,
  MOTIVOS_DE_ENCERRAMENTO_PELA_COORDENACAO,
  PAPEIS_DE_USUARIO,
  PAPEIS_DE_VINCULO,
} from '@educa/shared'
import { PROVEDORES_EXTERNOS } from '../db/schema/conta-externa.js'
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
   * A coordenação trocou a lista de domínios Google e tenants Microsoft liberados para o login pela conta da escola
   * (13.0; regra 20, item 10: alteração de permissão). `antes` e `depois` levam os ids das linhas de `provedor_escola`
   * liberadas, por provedor: a linha nunca é apagada (sai da lista com `removido_em`), e o id continua dizendo qual
   * domínio era. Nunca o texto do domínio aqui, que a auditoria só aceita id, data e código.
   */
  'escola.provedores_alterados': {
    entidade: 'escola',
    antes: z.strictObject({ google: z.array(z.uuid()), microsoft: z.array(z.uuid()) }),
    depois: z.strictObject({ google: z.array(z.uuid()), microsoft: z.array(z.uuid()) }),
    finalidade: null,
  },
  /**
   * A conta Google ou Microsoft de um professor foi ligada a ele no primeiro login por ela (13.0, RF9, RF19): o
   * e-mail verificado batia com o da conta dele na escola. `entidadeId` é a ligação (`conta_externa`); leva o usuário e
   * o provedor, nunca o e-mail nem o identificador da conta externa.
   */
  'conta_externa.ligada': {
    entidade: 'conta_externa',
    antes: null,
    depois: z.strictObject({ usuarioId: z.uuid(), provedor: z.enum(PROVEDORES_EXTERNOS) }),
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
   * O operador gerou o convite do primeiro coordenador (7.0, RF1, RF19), com `ops:convite-coordenador` ou pelo painel
   * da operação (A0b): o usuário
   * convidado, ainda inativo, até quando o convite vale e se a conta do e-mail foi criada agora (`contaNova`) ou já
   * existia. Nunca o nome, o e-mail nem o token.
   */
  'convite.criado': {
    entidade: 'convite',
    antes: null,
    depois: z.strictObject({ usuarioId: z.uuid(), expiraEm: z.iso.datetime(), contaNova: z.boolean() }),
    finalidade: null,
  },
  /**
   * O operador revogou o convite (7.0, RF19), com `ops:revogar-convite` ou pelo painel da operação (A0b), ou o gerar
   * revogou o anterior (A0b, estados `aceito` e `sem_coordenacao`): o link deixa de valer, usado ou não.
   */
  'convite.revogado': {
    entidade: 'convite',
    antes: null,
    depois: null,
    finalidade: null,
  },
  /**
   * O operador refez o convite da coordenação pelo painel da operação (A0b, tarefa 3.0): o convite de origem
   * (`origemId`, em `pendente` ou `vencido`) deixou de valer, e `entidadeId` é o convite novo, para o mesmo usuário
   * (`usuarioId`), válido até `expiraEm`. Nunca o nome, o e-mail nem o token.
   */
  'convite.refeito': {
    entidade: 'convite',
    antes: null,
    depois: z.strictObject({ origemId: z.uuid(), usuarioId: z.uuid(), expiraEm: z.iso.datetime() }),
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
  /**
   * A escola desativou o usuário (17.0; regra 20, item 18): ele deixa de entrar na requisição seguinte, e o que era
   * credencial dele nesta escola sai. Só contagens e sim ou não: quantas sessões desta escola foram encerradas, se o hash
   * da senha da matrícula foi apagado, se a conta Google ou Microsoft ligada foi desligada, e se a conta global ficou
   * sem usuário ativo em escola nenhuma e foi limpa (e-mail, senha e segundo fator). Nunca quem, nunca a outra escola.
   */
  'usuario.desativado': {
    entidade: 'usuario',
    antes: z.strictObject({ papel: z.enum(PAPEIS_DE_USUARIO) }),
    depois: z.strictObject({
      desativadoEm: z.iso.datetime(),
      sessoesEncerradas: z.number().int().nonnegative(),
      credencialApagada: z.boolean(),
      contaExternaDesligada: z.boolean(),
      contaLimpa: z.boolean(),
    }),
    finalidade: null,
  },
  /**
   * A escola pediu a eliminação do usuário (17.0; Tech Spec, seção 5, "Ciclo de vida"): o usuário, a credencial por
   * matrícula, a conta externa, os vínculos e as sessões dele nesta escola saíram de fato. O registro de acesso e a
   * auditoria ficam, pela retenção legal. `entidadeId` é o id que o usuário tinha; só contagens e sim ou não.
   */
  'usuario.eliminado': {
    entidade: 'usuario',
    antes: z.strictObject({ papel: z.enum(PAPEIS_DE_USUARIO), desativadoEm: z.iso.datetime().nullable() }),
    depois: z.strictObject({
      sessoesApagadas: z.number().int().nonnegative(),
      vinculosApagados: z.number().int().nonnegative(),
      credencialApagada: z.boolean(),
      contaExternaApagada: z.boolean(),
      contaLimpa: z.boolean(),
    }),
    finalidade: null,
  },
  /**
   * A coordenação desligou a conta Google ou Microsoft de um usuário ativo (17.0; decidido na 13.0): a professora cuja
   * conta foi recriada com outro identificador liga a nova no login seguinte. `entidadeId` é a ligação que saiu; leva o
   * usuário e o provedor, nunca o e-mail nem o identificador da conta externa.
   */
  'conta_externa.desligada': {
    entidade: 'conta_externa',
    antes: z.strictObject({ usuarioId: z.uuid(), provedor: z.enum(PROVEDORES_EXTERNOS) }),
    depois: null,
    finalidade: null,
  },
  /**
   * A coordenação criou o vínculo (9.0, RF3, RF19): de quem, em que turma e disciplina, com que papel. Nasce pendente.
   * `entidadeId` é o vínculo.
   */
  'vinculo.criado': {
    entidade: 'vinculo',
    antes: null,
    depois: z.strictObject({
      usuarioId: z.uuid(),
      turmaId: z.uuid(),
      disciplinaId: z.uuid().nullable(),
      papel: z.enum(PAPEIS_DE_VINCULO),
      estado: z.literal('pendente'),
    }),
    finalidade: null,
  },
  /** O professor dono confirmou o vínculo (9.0, RF4, RF19): a partir daqui ele alcança a turma. */
  'vinculo.confirmado': {
    entidade: 'vinculo',
    antes: z.strictObject({ estado: z.enum(ESTADOS_EM_DECISAO) }),
    depois: z.strictObject({ estado: z.literal('confirmado') }),
    finalidade: null,
  },
  /**
   * O professor dono contestou o vínculo (9.0, RF4, RF19): só o código. O complemento, texto livre do professor, nunca
   * entra aqui (`docs/lgpd.md`), e nenhum campo pode nem ter o nome dele.
   */
  'vinculo.contestado': {
    entidade: 'vinculo',
    antes: z.strictObject({ estado: z.enum(ESTADOS_EM_DECISAO) }),
    depois: z.strictObject({ estado: z.literal('contestado'), contestacao: z.enum(CONTESTACOES_DE_VINCULO) }),
    finalidade: null,
  },
  /** A coordenação encerrou o vínculo (9.0, RF5, RF19): o acesso cai na requisição seguinte. */
  'vinculo.encerrado': {
    entidade: 'vinculo',
    antes: z.strictObject({ estado: z.enum(ESTADOS_DE_VINCULO) }),
    depois: z.strictObject({ estado: z.literal('encerrado'), motivo: z.enum(MOTIVOS_DE_ENCERRAMENTO_PELA_COORDENACAO) }),
    finalidade: null,
  },
  /**
   * A coordenação encerrou o ano letivo, e a virada aconteceu na mesma transação (10.0, RF16): os vínculos do ano que
   * não estavam encerrados foram a `encerrado` por `fim_do_ano`, e o texto livre das contestações do ano foi apagado
   * (`docs/lgpd.md`, retenção até o fim do ano letivo). `entidadeId` é o ano. Só as contagens: nunca quem, nunca o texto.
   */
  'ano_letivo.encerrado': {
    entidade: 'ano_letivo',
    antes: z.strictObject({ situacao: z.literal('em_curso') }),
    depois: z.strictObject({
      situacao: z.literal('encerrado'),
      vinculosEncerrados: z.number().int().nonnegative(),
      textosDeContestacaoApagados: z.number().int().nonnegative(),
    }),
    finalidade: null,
  },
  /**
   * A coordenação leu a lista de alunos de uma turma (9.0; regra 20, item 10), com a finalidade. `entidadeId` é a
   * turma; `quantidade`, quantos alunos a página trouxe. Nunca quem.
   */
  'turma.alunos_lidos': {
    entidade: 'turma',
    antes: null,
    depois: z.strictObject({ quantidade: z.number().int().nonnegative() }),
    finalidade: z.enum(FINALIDADES_DA_LEITURA_DE_ALUNOS),
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
