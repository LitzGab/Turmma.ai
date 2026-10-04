import type { Banco } from '@educa/nucleo'
import { Global, Module, type DynamicModule } from '@nestjs/common'
import type { Redis } from 'ioredis'
import { BANCO } from '../banco.module.js'
import { AgendadorDeExecucoes } from '../ia/agendador-de-execucoes.js'
import { ContadorEmJanela } from '../sessao/senha/contador-em-janela.js'
import { CLIENTE_REDIS_LOGIN } from '../sessao/sessao.module.js'
import { AssistenteController } from './assistente.controller.js'
import { AssistenteService } from './assistente.service.js'
import { avisarSeguroDosPedidosDeIa, JANELA_DOS_PEDIDOS_DE_IA_MS, LimiteDePedidosDeIa } from './limite-de-pedidos-de-ia.js'
import { TimeController } from './time.controller.js'
import { TimeService } from './time.service.js'
import { TrechosParaTarefa } from './trechos-para-tarefa.service.js'

export interface OpcoesDoAssistente {
  /** A chave de HMAC dos contadores (`LOGIN_CHAVE_CONTADOR`): a chave do contador nunca é o id em texto. */
  readonly chaveContador: Uint8Array
  /** Quantas instâncias da API dividem os tetos quando o Redis de fila está fora (`LIMITE_INSTANCIAS_API`). */
  readonly instancias: number
}

/**
 * O Assistente de ensino na API (MVP, A2): o time (`GET /v1/time`) e a conversa do professor. Exporta o que os outros
 * módulos de IA reusam: o `LimiteDePedidosDeIa` (todo `POST` que dispara IA conta por pessoa e por escola) e a
 * `TrechosParaTarefa` (a busca de trechos do material para as tarefas, que o Tutor também usa). O cliente do Redis de
 * fila vem do `SessaoModule`, e o `AgendadorDeExecucoes`, do `IaModule`, os dois globais. É global pelo mesmo motivo: o
 * módulo de domínio que dispara IA só injeta.
 */
@Global()
@Module({})
export class AssistenteModule {
  static com({ chaveContador, instancias }: OpcoesDoAssistente): DynamicModule {
    return {
      module: AssistenteModule,
      controllers: [TimeController, AssistenteController],
      providers: [
        {
          provide: LimiteDePedidosDeIa,
          useFactory: (cliente: Redis) => new LimiteDePedidosDeIa({ janela: new ContadorEmJanela(cliente, chaveContador, { janelaMs: JANELA_DOS_PEDIDOS_DE_IA_MS, avisarSeguro: avisarSeguroDosPedidosDeIa }), instancias }),
          inject: [CLIENTE_REDIS_LOGIN],
        },
        { provide: TrechosParaTarefa, useFactory: (banco: Banco) => new TrechosParaTarefa(banco), inject: [BANCO] },
        { provide: TimeService, useFactory: (banco: Banco) => new TimeService(banco), inject: [BANCO] },
        {
          provide: AssistenteService,
          useFactory: (banco: Banco, agendador: AgendadorDeExecucoes, limite: LimiteDePedidosDeIa, trechos: TrechosParaTarefa) => new AssistenteService(banco, agendador, limite, trechos),
          inject: [BANCO, AgendadorDeExecucoes, LimiteDePedidosDeIa, TrechosParaTarefa],
        },
      ],
      exports: [LimiteDePedidosDeIa, TrechosParaTarefa],
    }
  }
}
