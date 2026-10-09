import { SetMetadata, type CustomDecorator } from '@nestjs/common'

export const METADADO_LIMITE_DA_BUSCA_DE_TITULARES = 'educa:limite-da-busca-de-titulares'

/**
 * A rota de busca de titulares (`POST /v1/privacidade/titulares/busca`, F3, tarefa 11.0): além do rate limit do F0, ela
 * conta no balde próprio `rl:busca-titular`, de 30 por minuto por usuário, e acima dele responde `LIMITE_EXCEDIDO`
 * (429). A busca acha nome de pessoa, e o balde próprio impede que um laço nela esgote a cota de requisição da pessoa
 * ou da escola (Tech Spec do F3, seção 7c).
 */
export function LimiteDaBuscaDeTitulares(): CustomDecorator<string> {
  return SetMetadata(METADADO_LIMITE_DA_BUSCA_DE_TITULARES, true)
}
