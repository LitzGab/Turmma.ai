import { Enfileirador, ErroDeDominio, JobRegistroRepository, type Banco } from '@educa/nucleo'
import {
  CodigoDeErro,
  esquemaRespostaEstadoDeJob,
  type PedidoJobSintetico,
  type RespostaEstadoDeJob,
  type RespostaJobAceito,
} from '@educa/shared'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { BANCO } from '../banco.module.js'

/** Tipo do job sintético. Fixo aqui: o corpo da requisição não escolhe tipo. */
export const TIPO_JOB_SINTETICO = 'sintetico'

@Injectable()
export class JobsSinteticosService {
  private readonly logger = new Logger('jobs')

  constructor(
    @Inject(BANCO) private readonly banco: Banco,
    private readonly enfileirador: Enfileirador,
    private readonly repositorio: JobRegistroRepository,
  ) {}

  /**
   * Grava o job e responde na hora; quem executa é o worker. Dois pedidos iguais criam dois jobs:
   * a rota é de teste e não tem chave de idempotência (Tech Spec, seção 4).
   */
  async enfileirar(pedido: PedidoJobSintetico): Promise<RespostaJobAceito> {
    const jobId = await this.banco.transaction((tx) =>
      this.enfileirador.enfileirar(tx, {
        tipo: TIPO_JOB_SINTETICO,
        fila: pedido.fila,
        dados: { cpuMs: pedido.cpuMs, falhar: pedido.falhar ?? false },
        naoUrgente: pedido.naoUrgente,
      }),
    )
    // A linha leva o `requisicaoId` e a escola pelo contexto: é por ele que se segue o job até o worker.
    this.logger.log('job.enfileirado')
    return { jobId }
  }

  /** Estado do job da escola do token. De outra escola ou inexistente, o mesmo 404. */
  async consultar(id: string): Promise<RespostaEstadoDeJob> {
    const registro = await this.repositorio.buscarDaEscola(id)
    if (registro === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    return esquemaRespostaEstadoDeJob.parse({
      estado: registro.estado,
      criadoEm: registro.criadoEm.toISOString(),
      ...(registro.iniciadoEm === null ? {} : { iniciadoEm: registro.iniciadoEm.toISOString() }),
      ...(registro.concluidoEm === null ? {} : { concluidoEm: registro.concluidoEm.toISOString() }),
      ...(registro.codigoFalha === null ? {} : { codigoFalha: registro.codigoFalha }),
    })
  }
}
