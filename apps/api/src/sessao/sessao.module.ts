import { type Banco } from '@educa/nucleo'
import { Module } from '@nestjs/common'
import { BANCO } from '../banco.module.js'
import { ResolucaoDeTenantRepository } from './resolucao-de-tenant.repository.js'

/**
 * O módulo de sessão: login, renovação, MFA, troca de escola e saída (tarefas 4.0 em diante). É o único que tem a
 * `ResolucaoDeTenantRepository`, e não a exporta: a fronteira da resolução de tenant fica dentro dele (Tech Spec,
 * seção 6).
 */
@Module({
  providers: [{ provide: ResolucaoDeTenantRepository, useFactory: (banco: Banco) => new ResolucaoDeTenantRepository(banco), inject: [BANCO] }],
})
export class SessaoModule {}
