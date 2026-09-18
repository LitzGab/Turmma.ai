import { conta, escola, registroAcesso, SemEscopo, sessao, usuario, type Banco, type EstadoDaSessao, type TransacaoBanco } from '@educa/nucleo'
import type { PapelDeUsuario } from '@educa/shared'
import { and, eq, isNull, or, sql } from 'drizzle-orm'

/**
 * A sessão achada pelo hash do cookie, travada para a renovação decidir (tarefa 5.0): só ids, estado, datas, o papel
 * e a inatividade da escola, sem nada da pessoa. `pelo` diz se o cookie é o atual ou o anterior.
 */
export interface SessaoParaRenovar extends EstadoDaSessao {
  readonly id: string
  readonly escolaId: string
  readonly usuarioId: string
  readonly familia: string
  readonly pelo: 'atual' | 'anterior'
  readonly atualApresentado: boolean
  readonly rotacionadoEm: Date | null
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

  /**
   * Com o `banco` sendo a transação da renovação: acha a sessão cujo hash atual ou anterior é o do cookie e a trava
   * (`FOR UPDATE OF sessao`, sem travar o usuário nem a escola). Duas renovações do mesmo cookie esperam uma pela
   * outra, e a segunda relê a linha já rotacionada: o hash que era atual passa a ser o anterior.
   */
  @SemEscopo('o cookie de renovação não diz a escola: a sessão é achada pelo hash atual ou anterior do refresh, e só depois a escola dela vira contexto')
  async sessaoParaRenovar(refreshHash: string): Promise<SessaoParaRenovar | undefined> {
    const [linha] = await this.banco
      .select({
        id: sessao.id,
        escolaId: sessao.escolaId,
        usuarioId: sessao.usuarioId,
        familia: sessao.familia,
        refreshHash: sessao.refreshHash,
        atualApresentado: sessao.atualApresentado,
        rotacionadoEm: sessao.rotacionadoEm,
        encerradaEm: sessao.encerradaEm,
        expiraEm: sessao.expiraEm,
        ultimoUsoEm: sessao.ultimoUsoEm,
        papel: usuario.papel,
        desativadoEm: usuario.desativadoEm,
        inatividadeAlunoMin: escola.inatividadeAlunoMin,
        inatividadeEquipeMin: escola.inatividadeEquipeMin,
        agora: sql<Date>`now()`.mapWith(sessao.expiraEm),
      })
      .from(sessao)
      .innerJoin(usuario, and(eq(usuario.escolaId, sessao.escolaId), eq(usuario.id, sessao.usuarioId)))
      .innerJoin(escola, eq(escola.id, sessao.escolaId))
      .where(or(eq(sessao.refreshHash, refreshHash), eq(sessao.refreshHashAnterior, refreshHash)))
      .limit(1)
      .for('update', { of: sessao })
    if (linha === undefined) return undefined
    const { refreshHash: atual, ...resto } = linha
    return { ...resto, pelo: atual === refreshHash ? 'atual' : 'anterior' }
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
