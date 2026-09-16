import type { PapelDeUsuario } from '@educa/shared'
import { and, eq, sql } from 'drizzle-orm'
import type { Banco } from '../db/banco.js'
import { anoLetivo } from '../db/schema/ano-letivo.js'
import { escola } from '../db/schema/escola.js'
import { sessao } from '../db/schema/sessao.js'
import { usuario } from '../db/schema/usuario.js'
import type { TokenVerificado } from './verificar-token.js'

/** A linha que a guarda confere: só ids, papel e datas, nada da pessoa. */
export interface LinhaDaSessao {
  readonly usuarioId: string
  readonly papel: PapelDeUsuario
  readonly desativadoEm: Date | null
  readonly encerradaEm: Date | null
  readonly expiraEm: Date
  readonly ultimoUsoEm: Date
  readonly inatividadeAlunoMin: number
  readonly inatividadeEquipeMin: number
  readonly anoLetivoId: string | null
  /** A hora do banco na leitura: a inatividade e o prazo comparam com o mesmo relógio que gravou as datas. */
  readonly agora: Date
}

/**
 * A leitura de sessão da `GuardaDeSessao`, uma consulta por requisição autenticada e sem cache (Tech Spec, seção 5,
 * "Requisição"): `sessao ⋈ usuario ⋈ escola`, com o ano letivo `em_curso` em left join.
 *
 * O escopo é a escola e a sessão do token verificado, e só dele: o método recebe um `TokenVerificado`, que só o
 * `verificarToken` produz, e não um id solto. É a leitura que cria o contexto da requisição, e por isso não o lê
 * (regra 10, item 3). O `usuario` e o ano são juntados pela mesma escola da sessão, e nunca atravessam escola.
 */
export class SessaoRepository {
  constructor(private readonly banco: Banco) {}

  async lerParaGuarda(token: TokenVerificado): Promise<LinhaDaSessao | undefined> {
    const [linha] = await this.banco
      .select({
        usuarioId: sessao.usuarioId,
        papel: usuario.papel,
        desativadoEm: usuario.desativadoEm,
        encerradaEm: sessao.encerradaEm,
        expiraEm: sessao.expiraEm,
        ultimoUsoEm: sessao.ultimoUsoEm,
        inatividadeAlunoMin: escola.inatividadeAlunoMin,
        inatividadeEquipeMin: escola.inatividadeEquipeMin,
        anoLetivoId: anoLetivo.id,
        agora: sql<Date>`now()`.mapWith(sessao.expiraEm),
      })
      .from(sessao)
      .innerJoin(usuario, and(eq(usuario.escolaId, sessao.escolaId), eq(usuario.id, sessao.usuarioId)))
      .innerJoin(escola, eq(escola.id, sessao.escolaId))
      .leftJoin(anoLetivo, and(eq(anoLetivo.escolaId, sessao.escolaId), eq(anoLetivo.situacao, 'em_curso')))
      .where(and(eq(sessao.escolaId, token.escolaId), eq(sessao.id, token.sessaoId)))
      .limit(1)
    return linha
  }
}
