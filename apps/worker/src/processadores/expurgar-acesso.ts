import { contextoAtual, LOTE_DO_EXPURGO, type AlvoDoExpurgoDeAcesso, type ExpurgoDeAcessoRepository, type LoggerBase, type Relogio } from '@educa/nucleo'
import { CodigoDeFalhaDeJob } from '@educa/shared'
import type { Processador } from '../executor.js'
import { FalhaDeJob } from '../falha-de-job.js'

export const TIPO_EXPURGAR_ACESSO = 'sistema.expurgar-acesso'

export interface DependenciasDoExpurgoDeAcesso {
  repositorio: Pick<ExpurgoDeAcessoRepository, 'apagarLoteVencido' | 'limparLoteDeContasSemUso'>
  relogio: Relogio
  logger: LoggerBase
  /** Linhas por lote. Só o teste troca. */
  lote?: number
}

/**
 * `sistema.expurgar-acesso` (tarefa 17.0): apaga o registro de acesso com mais de 6 meses, a sessão encerrada ou
 * expirada há mais de 30 dias e o convite usado, revogado ou expirado há mais de 30 dias, um lote de 5.000 por
 * instrução, tabela por tabela, até sobrar lote incompleto. Depois limpa a conta da equipe que ficou sem usuário ativo
 * e sem convite válido, que a desativação deixou para quando o convite vencesse. Cada lote é uma transação curta: a sessão é lida pela
 * guarda em toda requisição, e o expurgo não pode segurar lock nela.
 *
 * O prazo é contado de um `agora` só, lido do relógio no começo: a execução inteira usa o mesmo corte, e o teste o
 * injeta nos limites.
 *
 * Tolera reexecução (D49): o que já saiu não volta, e apagar de novo não apaga nada. Duas execuções ao mesmo tempo
 * pegam linhas diferentes; o lote de um worker que morreu no meio é desfeito pelo Postgres e sai na execução seguinte.
 * Loga só as contagens, nunca linha.
 */
export function criarExpurgoDeAcesso({ repositorio, relogio, logger, lote = LOTE_DO_EXPURGO }: DependenciasDoExpurgoDeAcesso): Processador {
  return async () => {
    if (contextoAtual()?.rotinaDoSistema !== true) throw new FalhaDeJob(CodigoDeFalhaDeJob.DADOS_INVALIDOS, true)
    const agora = relogio.agora()
    const apagar = async (alvo: AlvoDoExpurgoDeAcesso): Promise<number> => {
      let total = 0
      for (;;) {
        const doLote = await repositorio.apagarLoteVencido(alvo, agora, lote)
        total += doLote
        if (doLote < lote) return total
      }
    }
    const limparContas = async (): Promise<number> => {
      let total = 0
      for (;;) {
        const doLote = await repositorio.limparLoteDeContasSemUso(agora, lote)
        total += doLote
        if (doLote < lote) return total
      }
    }
    // Uma tabela depois da outra, na ordem de `ALVOS_DO_EXPURGO_DE_ACESSO`, e a conta por último: nunca dois lotes do
    // mesmo job ao mesmo tempo.
    const [registrosDeAcessoTotal, sessoesTotal, convitesTotal] = [await apagar('registro_acesso'), await apagar('sessao'), await apagar('convite')]
    const contasLimpasTotal = await limparContas()
    logger.info({ evento: 'acesso.expurgado', registrosDeAcessoTotal, sessoesTotal, convitesTotal, contasLimpasTotal })
  }
}
