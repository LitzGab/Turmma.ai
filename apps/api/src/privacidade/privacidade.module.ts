import { Enfileirador, JobRegistroRepository, type ArmazemDeArquivos, type Banco, type Relogio } from '@educa/nucleo'
import { ArmazemS3 } from '@educa/nucleo/armazem-s3'
import { Module, type BeforeApplicationShutdown, type DynamicModule } from '@nestjs/common'
import { BANCO } from '../banco.module.js'
import type { ConfiguracaoDoArmazemDaApi } from './configuracao-do-armazem.js'
import { MeusDadosController } from './meus-dados.controller.js'
import { PrivacidadeController } from './privacidade.controller.js'
import { PrivacidadeService } from './privacidade.service.js'

/** Fecha o cliente do armazém na descida do processo, antes de o pool do banco fechar. */
class CicloDoArmazem implements BeforeApplicationShutdown {
  constructor(private readonly encerrar: () => void) {}

  beforeApplicationShutdown(): void {
    this.encerrar()
  }
}

/** O que o módulo recebe de fora: a configuração do storage e, só no teste, o armazém e o relógio que a substituem. */
export interface OpcoesDaPrivacidade {
  readonly armazem: ConfiguracaoDoArmazemDaApi
  /** O armazém falso do teste. Sem ele, o S3 da configuração. Nunca vem do ambiente. */
  readonly armazemDeTeste?: ArmazemDeArquivos
  readonly relogio?: Relogio
}

/**
 * A privacidade da escola (F3; Tech Spec do F3, seção 4): a retenção, os suboperadores, os incidentes e os pedidos do titular
 * que a coordenação lê e conduz, e "Meus dados", do aluno e do professor. O arquivo do titular (13.0) é gravado pelo worker no
 * storage privado; a API só confere que o objeto existe e assina a URL de 5 minutos.
 */
@Module({})
export class PrivacidadeModule {
  static com(opcoes: OpcoesDaPrivacidade): DynamicModule {
    const { armazem, encerrar } =
      opcoes.armazemDeTeste === undefined ? ArmazemS3.criar(opcoes.armazem) : { armazem: opcoes.armazemDeTeste, encerrar: (): void => undefined }
    return {
      module: PrivacidadeModule,
      controllers: [PrivacidadeController, MeusDadosController],
      providers: [
        { provide: JobRegistroRepository, useFactory: (banco: Banco) => new JobRegistroRepository(banco), inject: [BANCO] },
        {
          provide: PrivacidadeService,
          useFactory: (banco: Banco, repositorio: JobRegistroRepository) =>
            new PrivacidadeService(banco, { enfileirador: new Enfileirador(repositorio), armazem, ...(opcoes.relogio === undefined ? {} : { relogio: opcoes.relogio }) }),
          inject: [BANCO, JobRegistroRepository],
        },
        { provide: CicloDoArmazem, useFactory: () => new CicloDoArmazem(encerrar) },
      ],
    }
  }
}
