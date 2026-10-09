import type { Banco } from '@educa/nucleo'
import { Module } from '@nestjs/common'
import { BANCO } from '../banco.module.js'
import { PrivacidadeController } from './privacidade.controller.js'
import { PrivacidadeService } from './privacidade.service.js'

/**
 * A privacidade da escola (F3; Tech Spec do F3, seção 4): a retenção e os suboperadores que a coordenação lê. Os pedidos do
 * titular e os incidentes entram aqui nas tarefas deles. Só a coordenação alcança estas rotas.
 */
@Module({
  controllers: [PrivacidadeController],
  providers: [{ provide: PrivacidadeService, useFactory: (banco: Banco) => new PrivacidadeService(banco), inject: [BANCO] }],
})
export class PrivacidadeModule {}
