import { medidorGlobal, type Banco, type LoggerBase, type Meter } from '@educa/nucleo'
import { Module, type DynamicModule } from '@nestjs/common'
import type { Redis } from 'ioredis'
import { BANCO } from '../banco.module.js'
import { AcessoDaSala } from '../sessao/acesso-da-sala.js'
import { ContadorDeTentativas } from '../sessao/contador-de-tentativas.js'
import { HashDeSenha } from '../sessao/hash-de-senha.js'
import { ContadorEmJanela } from '../sessao/senha/contador-em-janela.js'
import { SemaforoDeHash } from '../sessao/senha/semaforo-de-hash.js'
import { CLIENTE_REDIS_LOGIN } from '../sessao/sessao.module.js'
import { AcessoDaTurmaController } from './acesso-da-turma.controller.js'
import { AcessoDaTurmaService } from './acesso-da-turma.service.js'
import { sortearCodigoDaTurma, type SorteioDoCodigo } from './codigo-da-sala.js'
import type { ConfiguracaoSala } from './configuracao-da-sala.js'
import { DecisaoService } from './decisao.service.js'
import { avisarSeguroDaSala, JANELA_DOS_LIMITES_DA_SALA_MS, LimitesDaSala } from './limites-da-sala.js'
import { MinhaTurmaController } from './minha-turma.controller.js'
import { MinhaTurmaService } from './minha-turma.service.js'
import { PedidosController } from './pedidos.controller.js'
import { ReivindicacaoService } from './reivindicacao.service.js'
import { SalasController } from './salas.controller.js'
import { SalasService } from './salas.service.js'

export interface OpcoesDaSala {
  readonly config: ConfiguracaoSala
  /**
   * A chave de HMAC dos contadores (`LOGIN_CHAVE_CONTADOR`): os limites da sala (7.0) usam a mesma do login, e não a do
   * código da turma, para quem tem uma não ter a outra.
   */
  readonly chaveContador: Uint8Array
  /** Quantas instâncias da API dividem os tetos da sala quando o Redis de fila está fora (`LIMITE_INSTANCIAS_API`). */
  readonly instancias: number
  /** O logger JSON do processo, para a linha `sala.limite_atingido` com o tipo e a escola. */
  readonly logger: LoggerBase
  /** O medidor da telemetria; sem ele, o global. */
  readonly medidor?: Meter
  /** Só o teste da colisão do código (C6) troca o sorteio; o `main.ts` monta com o de verdade. */
  readonly sortearCodigo?: SorteioDoCodigo
}

/**
 * A entrada do aluno pela turma (A1): o acesso da turma que o professor gera e revoga (4.0) e a página pública da sala,
 * que o aluno abre pelo link ou pelo código (5.0) e onde reivindica o nome (6.0), com os limites dela (7.0); os pedidos
 * que o professor e a coordenação decidem, e a turma que o aluno aprovado vê (8.0). O `AcessoDaSala`, o `SemaforoDeHash`,
 * o `HashDeSenha`, o `ContadorDeTentativas` do login (que a aprovação zera) e o cliente do Redis de fila do login vêm do
 * `SessaoModule`, global: o semáforo é um só por instância, dividido com o login, e os contadores da sala moram no Redis
 * que não expulsa chave.
 */
@Module({})
export class SalaModule {
  static com({ config, chaveContador, instancias, logger, medidor, sortearCodigo = sortearCodigoDaTurma }: OpcoesDaSala): DynamicModule {
    return {
      module: SalaModule,
      controllers: [AcessoDaTurmaController, SalasController, PedidosController, MinhaTurmaController],
      providers: [
        { provide: AcessoDaTurmaService, useFactory: (banco: Banco) => new AcessoDaTurmaService(banco, config.chaveCodigo, sortearCodigo), inject: [BANCO] },
        {
          provide: LimitesDaSala,
          useFactory: (cliente: Redis) =>
            new LimitesDaSala({
              janela: new ContadorEmJanela(cliente, chaveContador, { janelaMs: JANELA_DOS_LIMITES_DA_SALA_MS, avisarSeguro: avisarSeguroDaSala }),
              instancias,
              medidor: medidor ?? medidorGlobal(),
              logger,
            }),
          inject: [CLIENTE_REDIS_LOGIN],
        },
        {
          provide: SalasService,
          useFactory: (banco: Banco, acessoDaSala: AcessoDaSala, limites: LimitesDaSala) => new SalasService(banco, acessoDaSala, config.chaveCodigo, limites),
          inject: [BANCO, AcessoDaSala, LimitesDaSala],
        },
        {
          provide: ReivindicacaoService,
          useFactory: (banco: Banco, acessoDaSala: AcessoDaSala, semaforo: SemaforoDeHash, hash: HashDeSenha, limites: LimitesDaSala) =>
            new ReivindicacaoService({ banco, acessoDaSala, semaforo, hash, chaveCodigo: config.chaveCodigo, limites, medidor: medidor ?? medidorGlobal() }),
          inject: [BANCO, AcessoDaSala, SemaforoDeHash, HashDeSenha, LimitesDaSala],
        },
        { provide: DecisaoService, useFactory: (banco: Banco, contador: ContadorDeTentativas) => new DecisaoService(banco, contador), inject: [BANCO, ContadorDeTentativas] },
        { provide: MinhaTurmaService, useFactory: (banco: Banco) => new MinhaTurmaService(banco), inject: [BANCO] },
      ],
    }
  }
}
