import { Drenagem, RotaAnonima } from '@educa/nucleo'
import type { RespostaProntidao } from '@educa/shared'
import { Controller, Get, Header, Res } from '@nestjs/common'

interface RespostaHttp {
  status(codigo: number): unknown
}

/**
 * Sonda da borda. Responde só o estado da própria instância, sem consultar banco nem Redis: se
 * consultasse, um Postgres lento tiraria as duas instâncias do balanceamento ao mesmo tempo, e o
 * Caddy trocaria o 503 tipado da API por um 502 dele. A borda não expõe esta rota ao cliente.
 */
@RotaAnonima()
@Controller('prontidao')
export class ProntidaoController {
  constructor(private readonly drenagem: Drenagem) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  obter(@Res({ passthrough: true }) resposta: RespostaHttp): RespostaProntidao {
    const { status, corpo } = this.drenagem.prontidao()
    resposta.status(status)
    return corpo
  }
}
