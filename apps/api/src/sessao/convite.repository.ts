import { contextoAtual, convite, escola, usuario, type Banco, type TransacaoBanco } from '@educa/nucleo'
import { and, eq, exists, gte, isNotNull, isNull, sql } from 'drizzle-orm'

/** A escola do contexto, ou falha fechada: o convite é sempre lido e escrito na escola do contexto (regra 10, item 3). */
function escolaDoContexto(): string {
  const escolaId = contextoAtual()?.escolaId
  if (escolaId === undefined) throw new Error('convite sem escola no contexto')
  return escolaId
}

/**
 * O convite e o usuário convidado dentro da escola do contexto (tarefa 7.0). O que atravessa escolas (achar o convite
 * pelo hash do token, a conta global) fica na resolução de tenant; aqui tudo leva a escola do contexto.
 */
export class ConviteRepository {
  constructor(private readonly banco: Banco | TransacaoBanco) {}

  /** O nome da escola do contexto, que o `consultar` mostra. */
  async nomeDaEscola(): Promise<string | undefined> {
    const [linha] = await this.banco.select({ nome: escola.nome }).from(escola).where(eq(escola.id, escolaDoContexto())).limit(1)
    return linha?.nome
  }

  /**
   * O coordenador convidado, inativo até o aceite (`desativado_em = now()`). Se a conta já tem coordenador inativo
   * nesta escola (convite vencido, ou coordenador desativado que a escola chama de volta), ele volta a esperar o convite
   * novo, com `desativado_em` de agora. Se o coordenador está ativo, não devolve nada: não há o que convidar.
   */
  async usuarioConvidado(contaId: string, nome: string): Promise<string | undefined> {
    const [linha] = await this.banco
      .insert(usuario)
      .values({ escolaId: escolaDoContexto(), contaId, papel: 'coordenador', nome, desativadoEm: sql`now()` })
      .onConflictDoUpdate({
        target: [usuario.escolaId, usuario.contaId, usuario.papel],
        set: { desativadoEm: sql`now()` },
        setWhere: isNotNull(usuario.desativadoEm),
      })
      .returning({ id: usuario.id })
    return linha?.id
  }

  /** Revoga os convites ainda não revogados do usuário: só o convite novo vale. */
  async revogarConvitesDoUsuario(usuarioId: string): Promise<void> {
    await this.banco
      .update(convite)
      .set({ revogadoEm: sql`now()` })
      .where(and(eq(convite.escolaId, escolaDoContexto()), eq(convite.usuarioId, usuarioId), isNull(convite.revogadoEm)))
  }

  async criarConvite(dados: { tokenHash: string; usuarioId: string; expiraEm: Date }): Promise<string> {
    const [criado] = await this.banco
      .insert(convite)
      .values({ escolaId: escolaDoContexto(), tokenHash: dados.tokenHash, tipo: 'coordenador', usuarioId: dados.usuarioId, expiraEm: dados.expiraEm })
      .returning({ id: convite.id })
    if (criado === undefined) throw new Error('convite não devolvido pelo insert')
    return criado.id
  }

  /**
   * Ativa o usuário pelo convite aceito, uma vez só: só se ele está inativo e o convite dele foi usado, não foi revogado
   * e foi aceito depois de o usuário ficar inativo. Dois logins ao mesmo tempo ativam uma vez, e o convite revogado
   * entre a leitura e aqui não ativa ninguém. O prazo depois do aceite é o do bilhete, conferido antes. Devolve se
   * ativou.
   */
  async ativarPorConvite(usuarioId: string, conviteId: string): Promise<boolean> {
    const escolaId = escolaDoContexto()
    const conviteAceito = this.banco
      .select({ um: sql`1` })
      .from(convite)
      .where(
        and(
          eq(convite.escolaId, escolaId),
          eq(convite.id, conviteId),
          eq(convite.usuarioId, usuario.id),
          isNotNull(convite.usadoEm),
          isNull(convite.revogadoEm),
          gte(convite.usadoEm, usuario.desativadoEm),
        ),
      )
    const ativados = await this.banco
      .update(usuario)
      .set({ desativadoEm: null })
      .where(and(eq(usuario.escolaId, escolaId), eq(usuario.id, usuarioId), isNotNull(usuario.desativadoEm), exists(conviteAceito)))
      .returning({ id: usuario.id })
    return ativados.length === 1
  }

  /** Revoga o convite, usado ou não, se ainda não foi revogado. Devolve se revogou. */
  async revogar(conviteId: string): Promise<boolean> {
    const revogados = await this.banco
      .update(convite)
      .set({ revogadoEm: sql`now()` })
      .where(and(eq(convite.escolaId, escolaDoContexto()), eq(convite.id, conviteId), isNull(convite.revogadoEm)))
      .returning({ id: convite.id })
    return revogados.length === 1
  }
}
