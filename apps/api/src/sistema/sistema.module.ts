import { Module } from '@nestjs/common'
import { ContextoController } from './contexto.controller.js'
import { SaudeController } from './saude.controller.js'
import { SaudeService } from './saude.service.js'

@Module({
  controllers: [SaudeController, ContextoController],
  providers: [SaudeService],
})
export class SistemaModule {}
