import { exigirEscolaDoContexto, SemEscopo, suboperador, suboperadorEscola, type Banco, type TransacaoBanco } from '@educa/nucleo'
import type { AlcanceDoSuboperador, CategoriaDeDadoDoSuboperador } from '@educa/shared'
import { and, eq, isNull, sql } from 'drizzle-orm'

/** O que o `ops:suboperador cadastrar` grava: a empresa, e quem da equipe a cadastrou. */
export interface NovoSuboperador {
  readonly chave: string
  readonly nome: string
  readonly finalidade: string
  readonly categorias: readonly CategoriaDeDadoDoSuboperador[]
  readonly pais: string
  readonly contrato: string
  readonly vedaTreinamento: boolean
  readonly alcance: AlcanceDoSuboperador
  readonly registradoPor: string
}

/** O suboperador vigente que o `encerrar` achou e travou. */
export interface SuboperadorVigente {
  readonly id: string
  readonly alcance: AlcanceDoSuboperador
}

/**
 * O que os comandos da operação do F3 escrevem (Tech Spec do F3, seções 2 e 6): hoje o suboperador e a ligação dele com as
 * escolas (`ops:suboperador`); o incidente entra na tarefa 9.0. É o único arquivo de produção que escreve em `suboperador` e
 * `suboperador_escola`, e o `SuboperadorDaEscolaRepository` (nucleo), o único que lê: um teste de arquitetura procura outro
 * uso (`arquitetura.test.ts`, "as tabelas do suboperador").
 *
 * - `suboperador` é da operação e não tem `escola_id` (`docs/modelo-de-dados.md`, regra 10, item 1): os métodos dela não
 *   têm escopo a aplicar, como os do `OperadorRepository`.
 * - A ligação com a escola é escrita **no contexto da escola**, que o comando abre antes (regra 10, item 3): o `escola_id` vem
 *   do contexto, nunca de argumento. A única exceção é o encerramento, que fecha as ligações de um suboperador em todas as
 *   escolas de uma vez e por isso é `@SemEscopo`, com a justificativa dita.
 */
export class OperacaoPrivacidadeRepository {
  constructor(private readonly banco: Banco | TransacaoBanco) {}

  /**
   * Cadastra o suboperador e devolve o id, ou `undefined` se já há um vigente com a mesma chave. `on conflict do nothing`:
   * o único índice único além da chave primária (uuid gerado pelo banco) é o parcial da chave vigente, então a colisão é
   * sempre essa. Dois cadastros da mesma chave ao mesmo tempo esperam um pelo outro no índice, e o segundo não insere
   * nada, sem erro cru do banco.
   */
  async cadastrar(novo: NovoSuboperador): Promise<string | undefined> {
    const [criado] = await this.banco
      .insert(suboperador)
      .values({
        chave: novo.chave,
        nome: novo.nome,
        finalidade: novo.finalidade,
        categorias: [...novo.categorias],
        pais: novo.pais,
        contrato: novo.contrato,
        vedaTreinamento: novo.vedaTreinamento,
        alcance: novo.alcance,
        registradoPor: novo.registradoPor,
      })
      .onConflictDoNothing()
      .returning({ id: suboperador.id })
    return criado?.id
  }

  /**
   * Liga o suboperador à escola do contexto, que o comando abriu para ela. Ligar duas vezes a mesma escola é erro de
   * programação (a chave primária recusa): o comando liga cada escola uma vez só.
   */
  async ligarEscola(suboperadorId: string): Promise<void> {
    await this.banco.insert(suboperadorEscola).values({ escolaId: exigirEscolaDoContexto(), suboperadorId })
  }

  /**
   * O suboperador vigente da chave, travado até o fim da transação (`for no key update`, que não briga com a FK da
   * ligação). Dois encerramentos da mesma chave ao mesmo tempo passam um de cada vez: o segundo relê depois de o primeiro
   * confirmar e não acha vigente.
   */
  async travarVigente(chave: string): Promise<SuboperadorVigente | undefined> {
    const [vigente] = await this.banco
      .select({ id: suboperador.id, alcance: suboperador.alcance })
      .from(suboperador)
      .where(and(eq(suboperador.chave, chave), isNull(suboperador.fim)))
      .for('no key update')
    return vigente
  }

  /** Encerra o suboperador agora (o `travarVigente` acabou de achá-lo vigente e o segura). Ele fica como histórico. */
  async encerrar(suboperadorId: string): Promise<void> {
    await this.banco.update(suboperador).set({ fim: sql`now()` }).where(eq(suboperador.id, suboperadorId))
  }

  /** Encerra, em todas as escolas, as ligações abertas do suboperador, e diz quantas eram. */
  @SemEscopo('comando da operação: encerra as ligações abertas de um suboperador em todas as escolas de uma vez, pelo id dele; grava só a data de fim e devolve só a contagem, sem pessoa')
  async encerrarLigacoes(suboperadorId: string): Promise<number> {
    const encerradas = await this.banco
      .update(suboperadorEscola)
      .set({ fim: sql`now()` })
      .where(and(eq(suboperadorEscola.suboperadorId, suboperadorId), isNull(suboperadorEscola.fim)))
      .returning({ escolaId: suboperadorEscola.escolaId })
    return encerradas.length
  }
}
