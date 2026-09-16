import type { OnModuleInit } from '@nestjs/common'
import { PATH_METADATA } from '@nestjs/common/constants.js'
import { Reflector, type DiscoveryService } from '@nestjs/core'
import { METADADO_ROTA_ANONIMA } from '../limite/rota-anonima.decorator.js'
import { METADADO_PERMITE } from './permite.decorator.js'

type Controlador = abstract new (...argumentos: never[]) => unknown

const reflector = new Reflector()

/** Os nomes de método do protótipo e dos que ele herda, até `Object.prototype`: rota herdada de controller base conta. */
function metodosDaCadeia(prototipo: object): string[] {
  const nomes = new Set<string>()
  for (let atual: object | null = prototipo; atual !== null && atual !== Object.prototype; atual = Object.getPrototypeOf(atual) as object | null) {
    for (const nome of Object.getOwnPropertyNames(atual)) if (nome !== 'constructor') nomes.add(nome)
  }
  return [...nomes]
}

/**
 * As rotas dos controllers que não declaram nem `@Permite` nem `@RotaAnonima`, no método ou na classe, como
 * `Controller.metodo`. Rota é o método com caminho registrado pelo `@Get`, `@Post` e afins.
 */
export function rotasSemPermissao(controladores: readonly Controlador[]): string[] {
  return controladores.flatMap((controlador) => {
    const prototipo = controlador.prototype as Record<string, unknown>
    const marcadaNaClasse = (chave: string) => reflector.get<unknown>(chave, controlador) !== undefined
    return metodosDaCadeia(prototipo)
      .filter((nome) => typeof prototipo[nome] === 'function')
      .filter((nome) => {
        const metodo = prototipo[nome] as () => unknown
        if (reflector.get<unknown>(PATH_METADATA, metodo) === undefined) return false
        const marcadoNoMetodo = (chave: string) => reflector.get<unknown>(chave, metodo) !== undefined
        const anonima = marcadoNoMetodo(METADADO_ROTA_ANONIMA) || marcadaNaClasse(METADADO_ROTA_ANONIMA)
        const permitida = marcadoNoMetodo(METADADO_PERMITE) || marcadaNaClasse(METADADO_PERMITE)
        return !anonima && !permitida
      })
      .map((nome) => `${controlador.name}.${nome}`)
  })
}

/**
 * Confere, no boot, que toda rota registrada declara quem pode chamá-la (RF17). Rota sem `@Permite` e sem
 * `@RotaAnonima` derruba a inicialização, com o nome do controller e do método: endpoint novo nasce fechado, e o
 * esquecimento aparece no primeiro `npm run test`, não em produção.
 */
export class ConferenciaDasPermissoes implements OnModuleInit {
  constructor(private readonly descoberta: Pick<DiscoveryService, 'getControllers'>) {}

  onModuleInit(): void {
    const controladores = this.descoberta
      .getControllers()
      .map((embrulho) => embrulho.metatype)
      .filter((metatipo): metatipo is Controlador => typeof metatipo === 'function')
    const semPermissao = rotasSemPermissao(controladores)
    if (semPermissao.length > 0) throw new Error(`rota sem @Permite nem @RotaAnonima: ${semPermissao.join(', ')}`)
  }
}
