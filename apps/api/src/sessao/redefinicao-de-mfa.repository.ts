import { contextoAtual, usuario, type TransacaoBanco } from '@educa/nucleo'
import { and, eq, isNull } from 'drizzle-orm'

/** A escola do contexto, ou falha fechada: o alvo da redefinição é sempre procurado na escola da sessão (regra 10, item 3). */
function escolaDoContexto(): string {
  const escolaId = contextoAtual()?.escolaId
  if (escolaId === undefined) throw new Error('redefinição de MFA sem escola no contexto')
  return escolaId
}

/**
 * O usuário alvo da redefinição do MFA, procurado só na escola do contexto: id de outra escola, ou de ninguém, não
 * acha nada. Devolve só a conta dele, nunca o nome.
 */
export class RedefinicaoDeMfaRepository {
  constructor(private readonly tx: TransacaoBanco) {}

  async contaDoUsuarioAtivo(usuarioId: string): Promise<string | undefined> {
    const [linha] = await this.tx
      .select({ contaId: usuario.contaId })
      .from(usuario)
      .where(and(eq(usuario.escolaId, escolaDoContexto()), eq(usuario.id, usuarioId), isNull(usuario.desativadoEm)))
      .limit(1)
    return linha?.contaId ?? undefined
  }
}
