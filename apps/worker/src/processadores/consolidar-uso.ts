import {
  contextoAtual,
  diaAnterior,
  diaDeUso,
  executarNoContexto,
  type ContadorDeUso,
  type LoggerBase,
  type Relogio,
  type UsoDoPeriodo,
  type UsoRepository,
} from '@educa/nucleo'
import { CodigoDeFalhaDeJob } from '@educa/shared'
import type { Processador } from '../executor.js'
import { FalhaDeJob } from '../falha-de-job.js'
import type { MedidorDeStorage } from '../storage/medidor-de-storage.js'

export const TIPO_CONSOLIDAR_USO = 'sistema.consolidar-uso'

export interface DependenciasDaConsolidacao {
  contador: Pick<ContadorDeUso, 'lerDiasFechados' | 'apagarConsolidado'>
  repositorio: Pick<UsoRepository, 'gravarDia'>
  storage: Pick<MedidorDeStorage, 'listarEscolas' | 'bytesDaEscola'>
  /** De onde vem a hora que decide quais dias fecharam. Só o teste troca. */
  relogio: Relogio
  logger: LoggerBase
}

/**
 * `sistema.consolidar-uso`: leva os contadores de uso do Redis de fila para `uso_infra_diario` e mede
 * o storage de cada escola (Tech Spec, seção 5, "Uso por escola").
 *
 * 1. Para cada dia fechado (anterior a hoje em São Paulo) de cada escola: lê o contador (`GET`), grava o
 *    valor absoluto no banco e só então apaga o contador, se ele ainda tem o valor gravado. Rodar de
 *    novo, em sequência ou em paralelo, regrava o mesmo número: não soma duas vezes. Se cair entre a
 *    gravação e a remoção, a próxima execução regrava o mesmo valor e apaga.
 * 2. Para cada escola com pasta no storage: grava os bytes de `escolas/{id}/` no dia que acabou de
 *    fechar, também como valor absoluto.
 *
 * Toda leitura e gravação de uma escola roda no contexto dela: a descoberta das escolas é a única
 * parte sem escopo (`@SemEscopo` no contador e no medidor). Com o Redis de fila, o Postgres ou o
 * storage fora, a tentativa falha e a fila tenta de novo; o que já foi gravado continua certo.
 */
export function criarConsolidacaoDeUso(dependencias: DependenciasDaConsolidacao): Processador {
  return async () => {
    const { contador, repositorio, storage, relogio, logger } = dependencias
    const contexto = contextoAtual()
    // Só a rotina do sistema consolida: um job de escola com este tipo não alcança as outras escolas.
    if (contexto?.rotinaDoSistema !== true) throw new FalhaDeJob(CodigoDeFalhaDeJob.DADOS_INVALIDOS, true)
    const naEscola = <T>(escolaId: string, funcao: () => Promise<T>): Promise<T> =>
      executarNoContexto({ requisicaoId: contexto.requisicaoId, escolaId }, funcao)

    const hoje = diaDeUso(relogio.agora())
    const contagens = await contador.lerDiasFechados(hoje)
    for (const { escolaId, dia, requisicoes, jobs } of contagens) {
      await naEscola(escolaId, async () => {
        const valores: Partial<UsoDoPeriodo> = {
          ...(requisicoes === undefined ? {} : { requisicoes }),
          ...(jobs === undefined ? {} : { jobs }),
        }
        await repositorio.gravarDia(dia, valores)
        if (requisicoes !== undefined) await contador.apagarConsolidado(dia, 'req', requisicoes)
        if (jobs !== undefined) await contador.apagarConsolidado(dia, 'jobs', jobs)
      })
    }

    const ontem = diaAnterior(hoje)
    const escolas = await storage.listarEscolas()
    for (const escolaId of escolas) {
      await naEscola(escolaId, async () => repositorio.gravarDia(ontem, { bytesStorage: await storage.bytesDaEscola() }))
    }
    const diasTotal = contagens.length
    const escolasTotal = escolas.length
    logger.info({ evento: 'uso.consolidado', diasTotal, escolasTotal })
  }
}
