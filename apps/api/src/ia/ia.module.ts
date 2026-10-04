import {
  criarLogger,
  criarProvedorDeIa,
  ExecutorNoProcesso,
  lerConfiguracaoDeIa,
  type Ambiente,
  type Banco,
  type ExecutorDeAgente,
  type LLMProvider,
  type LoggerBase,
  type OrcamentoDeIa,
  type SuspensaoDeFuncao,
} from '@educa/nucleo'
import { Global, Inject, Module, type DynamicModule, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common'
import { BANCO } from '../banco.module.js'
import { AgendadorDeExecucoes } from './agendador-de-execucoes.js'
import { ConferenciaDeFuncao } from './conferencia-de-funcao.js'
import { ConsumoRepository } from './consumo.repository.js'
import { ExecucaoRepository } from './execucao.repository.js'
import { ExecucoesController } from './execucoes.controller.js'
import { ExecucoesService } from './execucoes.service.js'
import { OrcamentoRepository } from './orcamento.repository.js'
import { SuspensaoRepository } from './suspensao.repository.js'

/** A porta da camada de IA (regra 30, item 1): `@Inject(LLM_PROVIDER) ia: LLMProvider`. */
export const LLM_PROVIDER = Symbol('LLM_PROVIDER')
/** O executor das execuções em segundo plano. Quem dispara tarefa usa o `AgendadorDeExecucoes`, que já o chama. */
export const EXECUTOR_DE_AGENTE = Symbol('EXECUTOR_DE_AGENTE')
/** "A função está suspensa nesta escola agora?" (D60). */
export const SUSPENSAO_DE_FUNCAO = Symbol('SUSPENSAO_DE_FUNCAO')
/** O freio do dia e o pacote do mês do Tutor (D38), para o `POST` do Tutor recusar antes de gravar. */
export const ORCAMENTO_DE_IA = Symbol('ORCAMENTO_DE_IA')

export interface OpcoesDoModuloDeIa {
  readonly ambiente: Ambiente
  readonly logger?: LoggerBase
  /** As variáveis de IA. Sem isto, as do processo (`IA_ADAPTADOR`, `LLM_*`, `IA_EXECUC*`), como o compose as entrega. */
  readonly variaveis?: Record<string, string | undefined>
}

/**
 * A camada de IA na API: monta o provedor pela configuração (adaptador falso por padrão, OpenAI-compatível por
 * `IA_ADAPTADOR`), com as quatro portas em Postgres, e o executor das execuções em segundo plano. É global: o módulo
 * de domínio só injeta.
 *
 * - `AgendadorDeExecucoes`: disparar uma tarefa (o caminho normal de todo `POST` que usa IA).
 * - `ConferenciaDeFuncao`: conferir a suspensão onde a função roda sem modelo.
 * - `LLM_PROVIDER`, `EXECUTOR_DE_AGENTE`, `SUSPENSAO_DE_FUNCAO`, `ORCAMENTO_DE_IA`: as portas, para o caso que o
 *   agendador não cobre.
 *
 * Na subida, a varredura encerra as execuções que um processo caído deixou `pendente` ou `rodando`, e se repete a cada
 * prazo de execução. Configuração inválida derruba a subida, com o nome da variável (`ConfiguracaoInvalida`).
 */
@Global()
@Module({})
export class IaModule implements OnApplicationBootstrap, OnApplicationShutdown {
  static com(opcoes: OpcoesDoModuloDeIa): DynamicModule {
    const config = lerConfiguracaoDeIa({ ...(opcoes.variaveis ?? process.env), AMBIENTE: opcoes.ambiente })
    const logger = opcoes.logger ?? criarLogger({ servico: 'api' })
    return {
      module: IaModule,
      controllers: [ExecucoesController],
      providers: [
        { provide: SUSPENSAO_DE_FUNCAO, useFactory: (banco: Banco) => new SuspensaoRepository(banco), inject: [BANCO] },
        { provide: ORCAMENTO_DE_IA, useFactory: (banco: Banco) => new OrcamentoRepository(banco), inject: [BANCO] },
        {
          provide: LLM_PROVIDER,
          useFactory: (banco: Banco, orcamento: OrcamentoDeIa, suspensao: SuspensaoDeFuncao) =>
            criarProvedorDeIa(config, { registro: new ConsumoRepository(banco), orcamento, suspensao, logger }),
          inject: [BANCO, ORCAMENTO_DE_IA, SUSPENSAO_DE_FUNCAO],
        },
        {
          provide: EXECUTOR_DE_AGENTE,
          useFactory: (banco: Banco) => new ExecutorNoProcesso({ repositorio: new ExecucaoRepository(banco), config: config.executor, logger }),
          inject: [BANCO],
        },
        {
          provide: AgendadorDeExecucoes,
          useFactory: (banco: Banco, ia: LLMProvider, executor: ExecutorDeAgente, suspensao: SuspensaoDeFuncao) => new AgendadorDeExecucoes(banco, ia, executor, suspensao),
          inject: [BANCO, LLM_PROVIDER, EXECUTOR_DE_AGENTE, SUSPENSAO_DE_FUNCAO],
        },
        { provide: ConferenciaDeFuncao, useFactory: (suspensao: SuspensaoDeFuncao) => new ConferenciaDeFuncao(suspensao), inject: [SUSPENSAO_DE_FUNCAO] },
        { provide: ExecucoesService, useFactory: (banco: Banco) => new ExecucoesService(banco), inject: [BANCO] },
      ],
      exports: [LLM_PROVIDER, EXECUTOR_DE_AGENTE, SUSPENSAO_DE_FUNCAO, ORCAMENTO_DE_IA, AgendadorDeExecucoes, ConferenciaDeFuncao],
    }
  }

  constructor(@Inject(EXECUTOR_DE_AGENTE) private readonly executor: ExecutorNoProcesso) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.executor.iniciar()
  }

  onApplicationShutdown(): void {
    this.executor.encerrar()
  }
}
