import type { Banco } from '@educa/nucleo'
import { Module } from '@nestjs/common'
import { BANCO } from '../banco.module.js'
import { PrivacidadeController } from './privacidade.controller.js'
import { PrivacidadeService } from './privacidade.service.js'

/**
 * A privacidade da escola (F3; Tech Spec do F3, seção 4): a retenção, os suboperadores e os incidentes que a coordenação lê (e confirma, no caso dos incidentes). Os pedidos do
 * titular entram aqui na tarefa deles. Só a coordenação alcança estas rotas.
 */
@Module({
  controllers: [PrivacidadeController],
  providers: [{ provide: PrivacidadeService, useFactory: (banco: Banco) => new PrivacidadeService(banco), inject: [BANCO] }],
})
export class PrivacidadeModule {}
