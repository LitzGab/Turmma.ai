// Fixture da regra `no-restricted-syntax` nos controllers dos módulos migrados (eslint.config.mjs, D81). Cada linha
// marcada é entrada que chega ao service sem passar pelo pipe: o corpo, a consulta, o caminho ou a requisição inteira.
// O que não tem marca é o jeito certo (`entrada-com-esquema.ts`), e não pode ser acusado.

import { Body, Controller, Get, Param, Post, Query, Req, Request } from '@nestjs/common'

interface Requisicao {
  body: unknown
  query: unknown
  params: unknown
}

@Controller('v1/exemplo')
export class ExemploController {
  @Post()
  criar(@Body() corpo: unknown): unknown { /* reprova: no-restricted-syntax */
    return corpo
  }

  @Get()
  listar(@Query() consulta: unknown): unknown { /* reprova: no-restricted-syntax */
    return consulta
  }

  @Get(':id')
  ler(@Param('id') id: string): string { /* reprova: no-restricted-syntax */
    return id
  }

  @Get()
  buscar(@Query('termo') termo: string): string { /* reprova: no-restricted-syntax */
    return termo
  }

  @Get(':todos')
  todosOsParametros(@Param() parametros: unknown): unknown { /* reprova: no-restricted-syntax */
    return parametros
  }

  @Post('campo')
  umCampo(@Body('nome') nome: string): string { /* reprova: no-restricted-syntax */
    return nome
  }

  @Post('outro-nome')
  comOutroNome(@Request() requisicao: Requisicao): Requisicao { /* reprova: no-restricted-syntax */
    return requisicao
  }

  @Post('requisicao')
  daRequisicao(@Req() requisicao: Requisicao): unknown { /* reprova: no-restricted-syntax */
    const corpo = requisicao.body /* reprova: no-restricted-syntax */
    const consulta = requisicao.query /* reprova: no-restricted-syntax */
    const caminho = requisicao.params /* reprova: no-restricted-syntax */
    return [corpo, consulta, caminho]
  }
}
