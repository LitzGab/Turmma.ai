import { conta, registroAcesso, SemEscopo, sessao, usuario, type Banco, type TransacaoBanco } from '@educa/nucleo'
import type { PapelDeUsuario } from '@educa/shared'
import { and, eq, isNull } from 'drizzle-orm'

/** A sessão achada pelo hash do cookie: só ids, estado e datas, para a renovação decidir (tarefa 5.0). */
export interface SessaoPeloRefresh {
  readonly id: string
  readonly escolaId: string
  readonly usuarioId: string
  readonly familia: string
  readonly atualApresentado: boolean
  readonly rotacionadoEm: Date | null
  readonly expiraEm: Date
  readonly encerradaEm: Date | null
}

/** A credencial achada pelo e-mail: o id, o hash (nulo enquanto a conta não tem senha) e se o MFA está ativo. Nunca o e-mail. */
export interface CredencialDaConta {
  readonly id: string
  readonly senhaHash: string | null
  readonly mfaAtivo: boolean
}

/** Um usuário ativo de uma conta: só o id, a escola e o papel, nunca o nome. */
export interface UsuarioAtivoDaConta {
  readonly usuarioId: string
  readonly escolaId: string
  readonly papel: PapelDeUsuario
}

const colunasDaSessao = {
  id: sessao.id,
  escolaId: sessao.escolaId,
  usuarioId: sessao.usuarioId,
  familia: sessao.familia,
  atualApresentado: sessao.atualApresentado,
  rotacionadoEm: sessao.rotacionadoEm,
  expiraEm: sessao.expiraEm,
  encerradaEm: sessao.encerradaEm,
}

/**
 * A fronteira da resolução de tenant, e a única do sistema (Tech Spec, seção 6): toda operação que acontece antes de
 * existir escola no contexto, ou que toca a `conta` global, que não tem escola. Cada método leva `@SemEscopo` com a
 * justificativa da tabela da seção 6, e devolve o mínimo para quem chama chegar à escola certa.
 *
 * O desvio da regra 10, item 9 (mais de três exceções) fica contido por teste: só os arquivos de
 * `apps/api/src/sessao` importam esta classe (`apps/api/test/arquitetura.test.ts`). As tarefas seguintes
 * acrescentam os outros métodos da mesma tabela.
 */
export class ResolucaoDeTenantRepository {
  constructor(private readonly banco: Banco | TransacaoBanco) {}

  @SemEscopo('o cookie de renovação não diz a escola: a sessão é achada pelo hash atual do refresh, e só depois a escola dela vira contexto')
  async sessaoPorRefreshHash(refreshHash: string): Promise<SessaoPeloRefresh | undefined> {
    const [linha] = await this.banco.select(colunasDaSessao).from(sessao).where(eq(sessao.refreshHash, refreshHash)).limit(1)
    return linha
  }

  @SemEscopo('o cookie de renovação não diz a escola: o hash anterior do refresh acha a sessão para distinguir resposta perdida de reuso')
  async sessaoPorRefreshHashAnterior(refreshHash: string): Promise<SessaoPeloRefresh | undefined> {
    const [linha] = await this.banco.select(colunasDaSessao).from(sessao).where(eq(sessao.refreshHashAnterior, refreshHash)).limit(1)
    return linha
  }

  @SemEscopo('a credencial da equipe é global: depois da senha verificada, lista em que escolas a conta tem usuário ativo, só com id, escola e papel')
  usuariosAtivosDaConta(contaId: string): Promise<UsuarioAtivoDaConta[]> {
    return this.banco
      .select({ usuarioId: usuario.id, escolaId: usuario.escolaId, papel: usuario.papel })
      .from(usuario)
      .where(and(eq(usuario.contaId, contaId), isNull(usuario.desativadoEm)))
      .orderBy(usuario.escolaId, usuario.id)
  }

  @SemEscopo('a credencial da equipe é global: o login por e-mail acha a conta pelo e-mail antes de haver escola, e devolve só o id, o hash e se o MFA está ativo')
  async contaPorEmail(email: string): Promise<CredencialDaConta | undefined> {
    const [linha] = await this.banco
      .select({ id: conta.id, senhaHash: conta.senhaHash, mfaAtivadoEm: conta.mfaAtivadoEm })
      .from(conta)
      .where(eq(conta.email, email))
      .limit(1)
    return linha === undefined ? undefined : { id: linha.id, senhaHash: linha.senhaHash, mfaAtivo: linha.mfaAtivadoEm !== null }
  }

  @SemEscopo('a falha de login por e-mail acontece antes de haver escola: grava o registro de acesso com escola e usuário nulos, só com o evento e o IP')
  async gravarFalhaDeLoginPorEmail(ip: string): Promise<void> {
    await this.banco.insert(registroAcesso).values({ escolaId: null, usuarioId: null, evento: 'login_falho', ip })
  }

  @SemEscopo('a conta é global e não tem escola: criar a credencial da equipe grava só o e-mail e devolve só os ids, sem ler conta existente')
  async criarContas(emails: readonly string[]): Promise<string[]> {
    if (emails.length === 0) return []
    const criadas = await this.banco
      .insert(conta)
      .values(emails.map((email) => ({ email })))
      .returning({ id: conta.id })
    return criadas.map((criada) => criada.id)
  }
}
