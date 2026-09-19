import { contextoAtual, sessao, type Banco, type MotivoDeEncerramento, type TransacaoBanco } from '@educa/nucleo'
import { and, eq, isNull, sql } from 'drizzle-orm'

/** A escola do contexto, ou falha fechada: nenhuma sessão muda sem escola (regra 10, item 3). */
function escolaDoContexto(): string {
  const escolaId = contextoAtual()?.escolaId
  if (escolaId === undefined) throw new Error('alteração de sessão sem escola no contexto')
  return escolaId
}

/**
 * As escritas na sessão depois de a escola ser conhecida: rotação do cookie, encerramento, e o último uso. Toda
 * escrita leva a escola do contexto na cláusula, nunca a de um argumento: uma sessão de outra escola, com o id que
 * for, não é alcançada.
 */
export class EscritaDeSessaoRepository {
  constructor(private readonly banco: Banco | TransacaoBanco) {}

  /**
   * Troca o hash do cookie, zera `atual_apresentado` e marca `rotacionado_em` com a hora do banco. Com `guardarAnterior`,
   * o hash que era atual passa a ser o anterior (renovação normal); sem ele, o anterior fica como está (resposta
   * perdida: quem voltou foi o anterior, e é ele que o navegador ainda tem). Não mexe em `ultimo_uso_em` nem em
   * `expira_em`: renovar não é uso, e não estica as 12 h. Devolve a hora da rotação, ou `undefined` se a sessão não
   * é da escola do contexto.
   */
  async rotacionar(sessaoId: string, novoHash: string, guardarAnterior: boolean): Promise<Date | undefined> {
    const [linha] = await this.banco
      .update(sessao)
      .set({
        refreshHash: novoHash,
        ...(guardarAnterior ? { refreshHashAnterior: sql`${sessao.refreshHash}` } : {}),
        atualApresentado: false,
        rotacionadoEm: sql`now()`,
      })
      .where(and(eq(sessao.escolaId, escolaDoContexto()), eq(sessao.id, sessaoId)))
      .returning({ rotacionadoEm: sessao.rotacionadoEm })
    return linha?.rotacionadoEm ?? undefined
  }

  /** Encerra todas as sessões ainda abertas da família, na escola do contexto. Devolve quantas encerrou. */
  async encerrarFamilia(familia: string, motivo: MotivoDeEncerramento): Promise<number> {
    const encerradas = await this.banco
      .update(sessao)
      .set({ encerradaEm: sql`now()`, motivo })
      .where(and(eq(sessao.escolaId, escolaDoContexto()), eq(sessao.familia, familia), isNull(sessao.encerradaEm)))
      .returning({ id: sessao.id })
    return encerradas.length
  }

  /**
   * Encerra todas as sessões ainda abertas do usuário, só na escola do contexto (a desativação, 17.0): o usuário da
   * mesma conta em outra escola é outro `usuario_id`, e a sessão dele lá não é alcançada. Devolve quantas encerrou.
   */
  async encerrarDoUsuario(usuarioId: string, motivo: MotivoDeEncerramento): Promise<number> {
    const encerradas = await this.banco
      .update(sessao)
      .set({ encerradaEm: sql`now()`, motivo })
      .where(and(eq(sessao.escolaId, escolaDoContexto()), eq(sessao.usuarioId, usuarioId), isNull(sessao.encerradaEm)))
      .returning({ id: sessao.id })
    return encerradas.length
  }

  /** Encerra uma sessão ainda aberta da escola do contexto. Devolve se encerrou. */
  async encerrar(sessaoId: string, motivo: MotivoDeEncerramento): Promise<boolean> {
    const encerradas = await this.banco
      .update(sessao)
      .set({ encerradaEm: sql`now()`, motivo })
      .where(and(eq(sessao.escolaId, escolaDoContexto()), eq(sessao.id, sessaoId), isNull(sessao.encerradaEm)))
      .returning({ id: sessao.id })
    return encerradas.length > 0
  }

  /**
   * Move o último uso para agora, na sessão ainda aberta da escola do contexto. É a única escrita em `ultimo_uso_em`
   * depois da criação (Tech Spec, seção 5, "Atividade"), e a coluna não tem índice: a atualização fica HOT.
   */
  async registrarUso(sessaoId: string): Promise<boolean> {
    const movidas = await this.banco
      .update(sessao)
      .set({ ultimoUsoEm: sql`now()` })
      .where(and(eq(sessao.escolaId, escolaDoContexto()), eq(sessao.id, sessaoId), isNull(sessao.encerradaEm)))
      .returning({ id: sessao.id })
    return movidas.length > 0
  }
}
