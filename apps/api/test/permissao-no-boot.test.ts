import 'reflect-metadata'
import { ConferenciaDasPermissoes, Permite, RotaAnonima } from '@educa/nucleo'
import { Controller, Get, Module } from '@nestjs/common'
import { DiscoveryModule, DiscoveryService, NestFactory } from '@nestjs/core'
import { describe, expect, it } from 'vitest'

@Controller('com-permissao')
class ComPermissaoController {
  @Get()
  @Permite('sistema_contexto', 'ler')
  obter(): void {}
}

@RotaAnonima()
@Controller('anonimo')
class AnonimoController {
  @Get()
  obter(): void {}
}

@Controller('esquecido')
class EsquecidoController {
  @Get('rota-nova')
  rotaNova(): void {}
}

function moduloCom(controladores: Array<new () => object>) {
  @Module({
    imports: [DiscoveryModule],
    controllers: controladores,
    providers: [{ provide: ConferenciaDasPermissoes, useFactory: (descoberta: DiscoveryService) => new ConferenciaDasPermissoes(descoberta), inject: [DiscoveryService] }],
  })
  class ModuloDeTeste {}
  return ModuloDeTeste
}

async function subir(controladores: Array<new () => object>): Promise<void> {
  const app = await NestFactory.createApplicationContext(moduloCom(controladores), { logger: false, abortOnError: false })
  try {
    await app.init()
  } finally {
    await app.close()
  }
}

describe('boot da API: toda rota declara quem pode chamá-la', () => {
  it('sobe com rotas marcadas com @Permite ou @RotaAnonima', async () => {
    await expect(subir([ComPermissaoController, AnonimoController])).resolves.toBeUndefined()
  })

  it('rota sem @Permite e sem @RotaAnonima derruba o boot, com o nome do controller e do método', async () => {
    await expect(subir([ComPermissaoController, EsquecidoController])).rejects.toThrow('rota sem @Permite nem @RotaAnonima: EsquecidoController.rotaNova')
  })
})
