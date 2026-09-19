import { contaExterna, credencialMatricula, exigirEscolaDoContexto, sessao, usuario, vinculo, type ProvedorExterno, type TransacaoBanco } from '@educa/nucleo'
import type { PapelDeUsuario } from '@educa/shared'
import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm'

/** O usuário alvo da desativação ou da eliminação: o papel, a conta e se já está desativado. Nunca o nome. */
export interface UsuarioDoCicloDeVida {
  readonly papel: PapelDeUsuario
  readonly contaId: string | null
  readonly desativadoEm: Date | null
}

/**
 * As escritas da desativação e da eliminação (tarefa 17.0) dentro da escola do contexto. Toda instrução leva a escola do
 * contexto na cláusula, nunca a de um argumento (regra 10, item 3): o usuário da mesma pessoa em outra escola é outro
 * `usuario_id`, e o id de outra escola não alcança nada. O que toca a conta global fica na resolução de tenant.
 */
export class CicloDeVidaRepository {
  constructor(private readonly tx: TransacaoBanco) {}

  /**
   * Trava o usuário (`FOR NO KEY UPDATE`) e devolve papel, conta e desativação: duas desativações ou eliminações do
   * mesmo usuário ao mesmo tempo esperam uma pela outra, e a segunda relê o que a primeira deixou. A desativação não
   * muda a chave do usuário: a trava não segura o `FOR KEY SHARE` da FK de quem grava sessão ou auditoria dele. A
   * eliminação apaga a linha, e o `delete` sobe a trava na hora dele.
   */
  async travarUsuario(usuarioId: string): Promise<UsuarioDoCicloDeVida | undefined> {
    const [linha] = await this.tx
      .select({ papel: usuario.papel, contaId: usuario.contaId, desativadoEm: usuario.desativadoEm })
      .from(usuario)
      .where(and(eq(usuario.escolaId, exigirEscolaDoContexto()), eq(usuario.id, usuarioId)))
      .limit(1)
      .for('no key update')
    return linha
  }

  /** Marca o usuário ativo como desativado agora. Devolve a hora da desativação, ou `undefined` se ele já não estava ativo. */
  async desativar(usuarioId: string): Promise<Date | undefined> {
    const [linha] = await this.tx
      .update(usuario)
      .set({ desativadoEm: sql`now()` })
      .where(and(eq(usuario.escolaId, exigirEscolaDoContexto()), eq(usuario.id, usuarioId), isNull(usuario.desativadoEm)))
      .returning({ desativadoEm: usuario.desativadoEm })
    return linha?.desativadoEm ?? undefined
  }

  /**
   * Apaga o hash da senha da matrícula (regra 20, item 18): a linha fica, com a matrícula, que é registro escolar, e o
   * login responde como senha errada. Devolve se havia hash.
   */
  async apagarSenhaDaMatricula(usuarioId: string): Promise<boolean> {
    const apagadas = await this.tx
      .update(credencialMatricula)
      .set({ senhaHash: null })
      .where(and(eq(credencialMatricula.escolaId, exigirEscolaDoContexto()), eq(credencialMatricula.usuarioId, usuarioId), isNotNull(credencialMatricula.senhaHash)))
      .returning({ id: credencialMatricula.id })
    return apagadas.length > 0
  }

  /** Apaga a credencial por matrícula inteira (a eliminação). Devolve se havia. */
  async apagarCredencialDaMatricula(usuarioId: string): Promise<boolean> {
    const apagadas = await this.tx
      .delete(credencialMatricula)
      .where(and(eq(credencialMatricula.escolaId, exigirEscolaDoContexto()), eq(credencialMatricula.usuarioId, usuarioId)))
      .returning({ id: credencialMatricula.id })
    return apagadas.length > 0
  }

  /** Apaga a conta Google ou Microsoft ligada ao usuário. Devolve a ligação que saiu (id e provedor), ou `undefined`. */
  async apagarContaExterna(usuarioId: string): Promise<{ id: string; provedor: ProvedorExterno } | undefined> {
    const [apagada] = await this.tx
      .delete(contaExterna)
      .where(and(eq(contaExterna.escolaId, exigirEscolaDoContexto()), eq(contaExterna.usuarioId, usuarioId)))
      .returning({ id: contaExterna.id, provedor: contaExterna.provedor })
    return apagada
  }

  /** Apaga as sessões do usuário, abertas ou não (a eliminação). Devolve quantas. */
  async apagarSessoes(usuarioId: string): Promise<number> {
    const apagadas = await this.tx
      .delete(sessao)
      .where(and(eq(sessao.escolaId, exigirEscolaDoContexto()), eq(sessao.usuarioId, usuarioId)))
      .returning({ id: sessao.id })
    return apagadas.length
  }

  /** Apaga os vínculos do usuário, de todos os anos letivos da escola (a eliminação). Devolve quantos. */
  async apagarVinculos(usuarioId: string): Promise<number> {
    const apagados = await this.tx
      .delete(vinculo)
      .where(and(eq(vinculo.escolaId, exigirEscolaDoContexto()), eq(vinculo.usuarioId, usuarioId)))
      .returning({ id: vinculo.id })
    return apagados.length
  }

  /**
   * Apaga o usuário. O convite dele sai junto (`on delete cascade`); a auditoria de que ele é autor e o vínculo de outra
   * pessoa que ele criou ficam, com o id dele (migration 0013).
   */
  async apagarUsuario(usuarioId: string): Promise<void> {
    await this.tx.delete(usuario).where(and(eq(usuario.escolaId, exigirEscolaDoContexto()), eq(usuario.id, usuarioId)))
  }
}
