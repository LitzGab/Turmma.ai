import { RotaAnonima } from '@educa/nucleo'
import { esquemaPedidoAbrirSala, type RespostaSalaAberta } from '@educa/shared'
import { Body, Controller, Header, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { lerEntrada } from '../estrutura/entrada.js'
import { SalasService } from './salas.service.js'

/**
 * `POST /v1/salas/abrir` (A1, tarefa 5.0): a página pública da sala, sem login. Anônima, e por isso contada no limite
 * por IP da rota anônima (`rl:ip`; Tech Spec da A1, 7c). O slug e o token ou o código vêm no corpo, nunca na URL, que
 * fica em log de borda. O corpo passa pelo contrato estrito (`escolaId`, `turmaId` ou campo a mais é
 * `ENTRADA_INVALIDA`), e a resposta sai com `no-store`. Nenhum cookie é lido e nenhum registro de acesso é gravado.
 */
@RotaAnonima()
@Controller('v1/salas')
export class SalasController {
  constructor(private readonly salas: SalasService) {}

  @Post('abrir')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  abrir(@Body() corpo: unknown): Promise<RespostaSalaAberta> {
    return this.salas.abrir(lerEntrada(esquemaPedidoAbrirSala, corpo))
  }
}
