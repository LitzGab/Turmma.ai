import type { Banco } from '@educa/nucleo'
import { Module } from '@nestjs/common'
import type { Redis } from 'ioredis'
import { BANCO } from '../banco.module.js'
import { ConferenciaDeFuncao } from '../ia/conferencia-de-funcao.js'
import { CLIENTE_REDIS_LOGIN } from '../sessao/sessao.module.js'
import { AtividadeAplicadaController } from './atividade-aplicada.controller.js'
import { AtividadeAplicadaService } from './atividade-aplicada.service.js'
import { CorrecaoService } from './correcao.service.js'
import { DesempenhoController } from './desempenho.controller.js'
import { DesempenhoService } from './desempenho.service.js'
import { LeituraDoLote } from './leitura-do-lote.js'
import { LoteController } from './lote.controller.js'
import { MinhaAtividadeController } from './minha-atividade.controller.js'
import { MinhaAtividadeService } from './minha-atividade.service.js'

/**
 * A atividade aplicada e a correção de objetiva (MVP, A3; D33, D46, D56): a professora aplica e encerra, o aluno
 * responde, a correção nasce pendente, a professora abre os destaques e aprova o lote com o registro da validação, e só
 * então o aluno alcança o diagnóstico. Não existe `Nota` nesta fatia.
 *
 * A conferência da função suspensa vem do `IaModule`, e o cliente do Redis de fila, do `SessaoModule`, os dois globais.
 */
@Module({
  controllers: [AtividadeAplicadaController, MinhaAtividadeController, LoteController, DesempenhoController],
  providers: [
    { provide: LeituraDoLote, useFactory: (cliente: Redis) => new LeituraDoLote(cliente), inject: [CLIENTE_REDIS_LOGIN] },
    { provide: AtividadeAplicadaService, useFactory: (banco: Banco, conferencia: ConferenciaDeFuncao) => new AtividadeAplicadaService(banco, conferencia), inject: [BANCO, ConferenciaDeFuncao] },
    { provide: CorrecaoService, useFactory: (banco: Banco, leitura: LeituraDoLote) => new CorrecaoService(banco, leitura), inject: [BANCO, LeituraDoLote] },
    { provide: MinhaAtividadeService, useFactory: (banco: Banco) => new MinhaAtividadeService(banco), inject: [BANCO] },
    { provide: DesempenhoService, useFactory: (banco: Banco) => new DesempenhoService(banco), inject: [BANCO] },
  ],
})
export class AtividadeModule {}
