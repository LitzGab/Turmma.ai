import type { Banco } from '@educa/nucleo'
import { Module } from '@nestjs/common'
import { LimiteDePedidosDeIa } from '../assistente/limite-de-pedidos-de-ia.js'
import { TrechosParaTarefa } from '../assistente/trechos-para-tarefa.service.js'
import { BANCO } from '../banco.module.js'
import { AgendadorDeExecucoes } from '../ia/agendador-de-execucoes.js'
import { ArtefatoController } from './artefato.controller.js'
import { ArtefatoService } from './artefato.service.js'
import { FerramentasController } from './ferramentas.controller.js'
import { FerramentasService } from './ferramentas.service.js'

/**
 * As ferramentas e o artefato (MVP, A2; D18, D67): gerar atividade objetiva e plano de aula, abrir, renomear, exportar
 * em PDF e pedir a versão adaptada. O limite dos pedidos de IA e a busca de trechos vêm do `AssistenteModule`, e o
 * agendador, do `IaModule`, os dois globais.
 */
@Module({
  controllers: [FerramentasController, ArtefatoController],
  providers: [
    {
      provide: FerramentasService,
      useFactory: (banco: Banco, agendador: AgendadorDeExecucoes, limite: LimiteDePedidosDeIa, trechos: TrechosParaTarefa) => new FerramentasService(banco, agendador, limite, trechos),
      inject: [BANCO, AgendadorDeExecucoes, LimiteDePedidosDeIa, TrechosParaTarefa],
    },
    {
      provide: ArtefatoService,
      useFactory: (banco: Banco, agendador: AgendadorDeExecucoes, limite: LimiteDePedidosDeIa) => new ArtefatoService(banco, agendador, limite),
      inject: [BANCO, AgendadorDeExecucoes, LimiteDePedidosDeIa],
    },
  ],
})
export class ArtefatoModule {}
