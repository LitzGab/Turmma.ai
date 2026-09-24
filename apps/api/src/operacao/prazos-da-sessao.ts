import type { SessaoDeOperadorParaGuarda } from './operador.repository.js'

/** A sessão do operador dura até 8 h, qualquer que seja o uso (PRD da A0, RF5). O `expira_em` nasce com isso. */
export const DURACAO_DA_SESSAO_DE_OPERADOR_HORAS = 8

/** A sessão do operador termina depois de 30 min sem uso (PRD da A0, RF5), sem tolerância nem configuração. */
export const INATIVIDADE_DO_OPERADOR_MIN = 30

const MS_POR_MINUTO = 60_000

/**
 * Se a sessão do operador ainda vale agora (a hora do banco): existe, não foi encerrada (saída, desativação, refresh
 * reusado), o operador está ativo, as 8 h não passaram e o último uso tem menos de 30 min. Qualquer outro caso é
 * `SESSAO_ENCERRADA` na guarda; o prazo do token de acesso é conferido à parte (`ACESSO_VENCIDO`).
 */
export function sessaoDeOperadorVale(linha: SessaoDeOperadorParaGuarda | undefined): boolean {
  if (linha === undefined) return false
  if (linha.encerradaEm !== null || linha.operadorDesativadoEm !== null) return false
  const agora = linha.agora.getTime()
  if (linha.expiraEm.getTime() <= agora) return false
  return agora - linha.ultimoUsoEm.getTime() < INATIVIDADE_DO_OPERADOR_MIN * MS_POR_MINUTO
}
