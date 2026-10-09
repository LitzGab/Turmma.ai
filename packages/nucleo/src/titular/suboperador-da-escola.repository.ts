import type { CategoriaDeDadoDoSuboperador } from '@educa/shared'
import { alias } from 'drizzle-orm/pg-core'
import { and, asc, desc, eq, exists, or, sql } from 'drizzle-orm'
import { exigirEscolaDoContexto } from '../contexto/escola-do-contexto.js'
import type { Banco, TransacaoBanco } from '../db/banco.js'
import { suboperador, suboperadorEscola } from '../db/schema/suboperador.js'

/**
 * O suboperador como a escola o lê: o que a coordenação vê, e nada do que é da operação (id, contrato, quem cadastrou, as
 * outras escolas da lista). `inicio` e `fim` são a vigência **para esta escola**.
 */
export interface SuboperadorLidoPelaEscola {
  readonly chave: string
  readonly nome: string
  readonly finalidade: string
  readonly pais: string
  readonly categorias: CategoriaDeDadoDoSuboperador[]
  readonly vedaTreinamento: boolean
  readonly inicio: Date
  readonly fim: Date | null
}

/**
 * A leitura dos suboperadores da escola do contexto (F3, RF7; Tech Spec do F3, seções 4 e 6). **Só leitura**: o teste de
 * arquitetura confere que o arquivo não escreve em `suboperador` nem em `suboperador_escola`. Quem escreve é o
 * `OperacaoPrivacidadeRepository`, pelo `ops:suboperador`.
 *
 * `suboperador` não tem `escola_id`, então o escopo é a pergunta "esta escola é atendida por ele?":
 * `(alcance = 'todas' or exists (ligação com a escola do contexto))`. Os parênteses são parte da regra: ela entra no `and`
 * de qualquer filtro que a leitura ganhe, e sem eles o `or` engoliria o filtro. O `exists` é **correlacionado** com o
 * suboperador da linha (`suboperador_id = suboperador.id`): sem a correlação, a escola que tem qualquer ligação enxergaria
 * todo suboperador `lista` das outras.
 *
 * A vigência da escola vem da ligação (`lista`) ou do suboperador (`todas`, que não tem ligação); o `fim` é o mais cedo
 * entre os dois, e a escola que saiu da lista com a empresa seguindo para as outras a vê como passada.
 */
export class SuboperadorDaEscolaRepository {
  constructor(private readonly banco: Banco | TransacaoBanco) {}

  /** Os suboperadores da escola do contexto, vigentes e passados, pelo nome e do mais recente ao mais antigo. */
  async daEscola(): Promise<SuboperadorLidoPelaEscola[]> {
    const escolaId = exigirEscolaDoContexto()
    const ligacao = suboperadorEscola
    const outra = alias(suboperadorEscola, 'ligacao_da_escola')
    const linhas = await this.banco
      .select({
        chave: suboperador.chave,
        nome: suboperador.nome,
        finalidade: suboperador.finalidade,
        pais: suboperador.pais,
        categorias: suboperador.categorias,
        vedaTreinamento: suboperador.vedaTreinamento,
        inicioDoSuboperador: suboperador.inicio,
        fimDoSuboperador: suboperador.fim,
        inicioDaLigacao: ligacao.inicio,
        fimDaLigacao: ligacao.fim,
      })
      .from(suboperador)
      .leftJoin(ligacao, and(eq(ligacao.suboperadorId, suboperador.id), eq(ligacao.escolaId, escolaId)))
      .where(
        or(
          eq(suboperador.alcance, 'todas'),
          exists(
            this.banco
              .select({ um: sql`1` })
              .from(outra)
              .where(and(eq(outra.suboperadorId, suboperador.id), eq(outra.escolaId, escolaId))),
          ),
        ),
      )
      .orderBy(asc(suboperador.nome), desc(suboperador.inicio))
    return linhas.map((linha) => ({
      chave: linha.chave,
      nome: linha.nome,
      finalidade: linha.finalidade,
      pais: linha.pais,
      categorias: linha.categorias,
      vedaTreinamento: linha.vedaTreinamento,
      // A ligação, quando há (alcance `lista`), e senão o próprio suboperador (alcance `todas`).
      inicio: linha.inicioDaLigacao ?? linha.inicioDoSuboperador,
      fim: maisCedo(linha.fimDoSuboperador, linha.fimDaLigacao),
    }))
  }
}

/** O mais cedo entre os dois fins, ignorando o nulo (vigente); nulo só se os dois são nulos. */
function maisCedo(a: Date | null, b: Date | null): Date | null {
  if (a === null || b === null) return a ?? b
  return a.getTime() <= b.getTime() ? a : b
}
