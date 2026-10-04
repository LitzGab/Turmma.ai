import { Permite } from '@educa/nucleo'
import { esquemaConsultaBuscaDeMaterial, esquemaConsultaMateriais, esquemaPedidoEnviarMaterial, type RespostaBuscaDeMaterial, type RespostaListaDeMateriais, type RespostaMaterial } from '@educa/shared'
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { idDoCaminho, lerEntrada } from '../estrutura/entrada.js'
import { MaterialService } from './material.service.js'
import { GuardaDoEnvio, RecebimentoDoMaterial } from './recebimento.js'

/**
 * `/v1/materiais` (MVP, A2; `docs/mvp-contratos.md`, seção 3): a coordenação envia, lista, lê e exclui o material da
 * escola da sessão; o professor lista, lê e busca o das disciplinas em que tem vínculo confirmado; o aluno, nada. Os
 * campos e a consulta passam pelo contrato estrito de `packages/shared` (campo a mais, como `escolaId`, é
 * `ENTRADA_INVALIDA`); id fora do formato, de outra escola ou inexistente responde o mesmo `NAO_ENCONTRADO`.
 */
@Controller('v1/materiais')
export class MaterialController {
  constructor(private readonly materiais: MaterialService) {}

  /**
   * Multipart: os campos do contrato e o `arquivo`. Responde 201 com o material `processando`; a extração roda depois
   * (regra 00, item 4), e a tela consulta `GET /v1/materiais/:id` até o estado mudar.
   */
  @Post()
  @Permite('material', 'enviar')
  @UseGuards(GuardaDoEnvio)
  @UseInterceptors(RecebimentoDoMaterial)
  enviar(@Body() campos: unknown, @UploadedFile() arquivo: unknown): Promise<RespostaMaterial> {
    return this.materiais.enviar(lerEntrada(esquemaPedidoEnviarMaterial, campos), arquivo)
  }

  @Get()
  @Permite('material', 'listar')
  listar(@Query() consulta: unknown): Promise<RespostaListaDeMateriais> {
    return this.materiais.listar(lerEntrada(esquemaConsultaMateriais, consulta))
  }

  /** Declarada antes de `:id`: `busca` não é id de material. */
  @Get('busca')
  @Permite('material', 'buscar')
  buscar(@Query() consulta: unknown): Promise<RespostaBuscaDeMaterial> {
    return this.materiais.buscar(lerEntrada(esquemaConsultaBuscaDeMaterial, consulta))
  }

  @Get(':id')
  @Permite('material', 'ler')
  ler(@Param('id') id: string): Promise<RespostaMaterial> {
    return this.materiais.ler(idDoCaminho(id))
  }

  @Delete(':id')
  @Permite('material', 'excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  excluir(@Param('id') id: string): Promise<void> {
    return this.materiais.excluir(idDoCaminho(id))
  }
}
