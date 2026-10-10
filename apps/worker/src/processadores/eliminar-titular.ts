import {
  contextoAtual,
  EliminacaoDoTitular,
  estaNaJanela,
  type Banco,
  type ConfiguracaoOperacional,
  type JanelaLetiva,
  type LoggerBase,
  type Relogio,
} from '@educa/nucleo'
import { CodigoDeFalhaDeJob, TIPO_DO_JOB_ELIMINAR_TITULAR } from '@educa/shared'
import { z } from 'zod'
import type { Processador } from '../executor.js'
import { FalhaDeJob } from '../falha-de-job.js'

/** O job que elimina o titular no 8º dia (F3, tarefa 15.0): fila de lote, não urgente, só com o id do pedido (regra 20, itens 9 e 12). */
export const TIPO_ELIMINAR_TITULAR = TIPO_DO_JOB_ELIMINAR_TITULAR

/** O job leva **só o id do pedido**: o titular, o nome e todo o resto são lidos aqui dentro, na escola do job. */
const esquemaDoJob = z.strictObject({ pedidoId: z.uuid() })

export interface DependenciasDaEliminacaoDoTitular {
  banco: Banco
  /** O horário letivo da escola do contexto: a troca de nome confere a janela entre uma faixa e outra, e para quando ela abre. */
  janelaDaEscola: Pick<ConfiguracaoOperacional<JanelaLetiva>, 'daEscola'>
  relogio: Relogio
  logger: LoggerBase
  /** Linhas examinadas por faixa da troca de nome. Só o teste troca. */
  faixa?: number
}

/**
 * `titular.eliminar` (F3, tarefa 15.0; Tech Spec do F3, seção 5, "Eliminação"): no contexto da escola do job, roda a
 * `EliminacaoDoTitular` do pedido `agendado` e vencido: troca o nome completo nos textos livres (faixas, com a janela letiva
 * conferida entre elas), refaz a foto do compartilhamento, anonimiza, elimina a pessoa, marca os arquivos e conclui o pedido.
 *
 * - **Sem efeito não é erro**: o pedido que já não está `agendado` (cancelado, concluído por outro job) ou não venceu termina
 *   em silêncio, e o que a janela interrompeu termina também, com o pedido ainda `agendado`; a rotina da noite seguinte o
 *   enfileira de novo (depois de 20 h).
 * - **Reexecução e dois jobs do mesmo pedido** são inofensivos (D49): a troca de nome é idempotente, e a trava do pedido
 *   deixa passar um só.
 * - **Falha** (a troca que quebrou o JSON, o `eliminar` que falhou) sobe: o BullMQ tenta de novo, a etapa 3 foi desfeita
 *   inteira, e o alerta de 48 h aparece se o pedido não concluir.
 * - Loga só o resultado (`status`); nunca o titular, o nome, o termo nem contagem por tabela.
 */
export function criarEliminacaoDoTitular({ banco, janelaDaEscola, relogio, logger, faixa }: DependenciasDaEliminacaoDoTitular): Processador {
  return async (dados) => {
    const escolaId = contextoAtual()?.escolaId
    const lido = esquemaDoJob.safeParse(dados)
    if (escolaId === undefined || !lido.success) throw new FalhaDeJob(CodigoDeFalhaDeJob.DADOS_INVALIDOS, true)
    const janela = await janelaDaEscola.daEscola()
    const status = await new EliminacaoDoTitular(banco, relogio).eliminar(lido.data.pedidoId, {
      janelaAberta: () => estaNaJanela(janela, relogio.agora()),
      ...(faixa === undefined ? {} : { faixa }),
    })
    logger.info({ evento: 'titular.eliminacao', status })
  }
}
