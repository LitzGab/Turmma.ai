import { ErroDeDominio, Permite } from '@educa/nucleo'
import { CodigoDeErro, esquemaParametroFerramenta, esquemaPedidoGerarComFerramenta, type RespostaExecucaoAceita } from '@educa/shared'
import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { lerEntrada } from '../estrutura/entrada.js'
import { FerramentasService } from './ferramentas.service.js'

/**
 * `POST /v1/ferramentas/:ferramenta/gerar` (MVP, A2; D18): `atividade_objetiva` ou `plano_de_aula`. Ferramenta fora da
 * lista não existe (`NAO_ENCONTRADO`); a Adaptação parte de um artefato e tem rota própria. Responde `202` com a
 * execução, que a tela consulta em `GET /v1/execucoes/:id`.
 */
@Controller('v1/ferramentas')
export class FerramentasController {
  constructor(private readonly ferramentas: FerramentasService) {}

  @Post(':ferramenta/gerar')
  @Permite('ferramenta', 'gerar')
  @HttpCode(HttpStatus.ACCEPTED)
  gerar(@Param('ferramenta') ferramenta: string, @Body() corpo: unknown): Promise<RespostaExecucaoAceita> {
    const lida = esquemaParametroFerramenta.safeParse(ferramenta)
    if (!lida.success) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    return this.ferramentas.gerar(lida.data, lerEntrada(esquemaPedidoGerarComFerramenta, corpo))
  }
}
