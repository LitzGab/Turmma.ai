import { escola, rede, SemEscopo, type ExecutorDeAuditoria, type TipoDeRede } from '@educa/nucleo'

/**
 * Criação de rede e de escola pelo operador (`ops:escola`, RF1). Só este comando o usa: não há rota que
 * crie rede nem escola, e nada aqui lê dado de escola existente.
 */
export class RedeEEscolaRepository {
  constructor(private readonly banco: ExecutorDeAuditoria) {}

  @SemEscopo('a rede fica acima do tenant e ainda não tem escola; só o comando do operador cria, e devolve só o id')
  async criarRede(dados: { nome: string; tipo: TipoDeRede }): Promise<string> {
    const [criada] = await this.banco.insert(rede).values(dados).returning({ id: rede.id })
    if (criada === undefined) throw new Error('rede não devolvida pelo insert')
    return criada.id
  }

  @SemEscopo('a escola é o próprio tenant e nasce aqui, antes de existir contexto dela; só o comando do operador cria, e devolve só o id')
  async criarEscola(dados: { redeId: string; nome: string; slug: string }): Promise<string> {
    const [criada] = await this.banco.insert(escola).values(dados).returning({ id: escola.id })
    if (criada === undefined) throw new Error('escola não devolvida pelo insert')
    return criada.id
  }
}
