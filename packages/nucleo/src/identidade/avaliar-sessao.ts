import type { SessaoDaRequisicao } from '../contexto/contexto.js'
import type { LinhaDaSessao } from './sessao.repository.js'
import type { TokenVerificado } from './verificar-token.js'

/**
 * Minutos além da inatividade configurada pela escola antes de a sessão vencer: uma atividade perdida (a web
 * manda no máximo uma a cada 5 min) não desloga ninguém (Tech Spec, seção 5, "Atividade").
 */
export const TOLERANCIA_DE_INATIVIDADE_MIN = 5

const MS_POR_MINUTO = 60_000

/** Os minutos sem uso que a escola dá ao papel: o do aluno, ou o da equipe para professor e coordenador. */
export function inatividadeDoPapel(linha: Pick<LinhaDaSessao, 'papel' | 'inatividadeAlunoMin' | 'inatividadeEquipeMin'>): number {
  return linha.papel === 'aluno' ? linha.inatividadeAlunoMin : linha.inatividadeEquipeMin
}

/**
 * Confere a sessão lida para o token e devolve o que vai para o contexto, ou `undefined` quando ela não vale. Toda
 * recusa é a mesma para quem chamou (`NAO_AUTENTICADO`):
 * - sessão inexistente para `(esc, sid)`;
 * - `sessao.usuario_id` diferente do `sub` do token;
 * - sessão encerrada, ou expirada (`expira_em` já passou);
 * - usuário desativado;
 * - inatividade vencida: `ultimo_uso_em` mais a inatividade do papel e a tolerância já passou.
 */
export function avaliarSessao(token: TokenVerificado, linha: LinhaDaSessao | undefined): SessaoDaRequisicao | undefined {
  if (linha === undefined) return undefined
  if (linha.usuarioId !== token.usuarioId) return undefined
  if (linha.encerradaEm !== null || linha.desativadoEm !== null) return undefined
  const agora = linha.agora.getTime()
  if (linha.expiraEm.getTime() <= agora) return undefined
  const limiteDeInatividadeMs = (inatividadeDoPapel(linha) + TOLERANCIA_DE_INATIVIDADE_MIN) * MS_POR_MINUTO
  if (agora - linha.ultimoUsoEm.getTime() >= limiteDeInatividadeMs) return undefined
  return {
    escolaId: token.escolaId,
    usuarioId: token.usuarioId,
    papel: linha.papel,
    sessaoId: token.sessaoId,
    anoLetivoId: linha.anoLetivoId,
  }
}
