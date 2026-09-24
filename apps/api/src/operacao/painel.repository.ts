import { rede, SemEscopo, type Banco } from '@educa/nucleo'
import { MAXIMO_DE_REDES_DO_PAINEL, type RedeDoPainel } from '@educa/shared'
import { asc } from 'drizzle-orm'

/**
 * A leitura entre escolas do painel da operação (Tech Spec da A0b, seção 6): o único lugar desse alcance, e por isso cada
 * método é `@SemEscopo` com a justificativa do painel (regra 10, item 9). Devolve só id, nome, tipo e número: nada de
 * pessoa, nada de dentro da escola. Só o `painel.service.ts` o importa.
 *
 * Nesta tarefa (1.0) só as redes, para o diálogo Nova escola; a lista de escolas e o uso chegam na 5.0.
 */
export class PainelRepository {
  constructor(private readonly banco: Banco) {}

  @SemEscopo('painel do operador: a lista de redes para criar escola, acima do tenant; só id, nome e tipo, até 200, sem escola nem pessoa')
  async redes(): Promise<RedeDoPainel[]> {
    return this.banco.select({ id: rede.id, nome: rede.nome, tipo: rede.tipo }).from(rede).orderBy(asc(rede.nome), asc(rede.id)).limit(MAXIMO_DE_REDES_DO_PAINEL)
  }
}
