import { contextoAtual, registroAcesso, type EventoDeAcesso, type TransacaoBanco } from '@educa/nucleo'

/**
 * O registro de acesso (Marco Civil, art. 15) de quem já tem escola: login, renovação e saída, gravados na escola do
 * contexto, nunca na de um argumento (regra 10, item 3). A falha por e-mail, antes de haver escola, é a única exceção
 * e fica na `ResolucaoDeTenantRepository`.
 *
 * Grava só evento, usuário, IP e hora: nada de e-mail, cookie ou navegador (`docs/lgpd.md`).
 */
export class RegistroDeAcessoRepository {
  constructor(private readonly tx: TransacaoBanco) {}

  async gravar(evento: Exclude<EventoDeAcesso, 'login_falho'>, usuarioId: string, ip: string): Promise<void> {
    const escolaId = contextoAtual()?.escolaId
    if (escolaId === undefined) throw new Error('registro de acesso sem escola no contexto')
    await this.tx.insert(registroAcesso).values({ escolaId, usuarioId, evento, ip })
  }
}
