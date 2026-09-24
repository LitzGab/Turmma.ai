import {
  auditoriaOperacao,
  codigoRecuperacaoOperador,
  conviteOperador,
  operador,
  sessaoOperador,
  type AcaoDaAuditoriaDaOperacao,
  type Banco,
  type MotivoDeEncerramentoDeOperador,
  type TransacaoBanco,
} from '@educa/nucleo'
import { and, count, eq, isNull, sql } from 'drizzle-orm'

/**
 * Chave do `pg_advisory_xact_lock` que põe em fila o `criar` e o `desativar` do `ops:operador` (Tech Spec da A0, seção
 * 5, "Nascimento"). Com ela, dois `criar` de bootstrap não veem os dois "nenhum operador ativo", e dois `desativar`
 * cruzados não zeram os ativos. A da migração é 7_000_001.
 */
export const CHAVE_DA_TRAVA_DOS_OPERADORES = 7_000_002

/**
 * Quem roda o comando, pelo `OPERADOR` do ambiente:
 * - `bootstrap`: não há operador ativo, e qualquer `OPERADOR` no formato é aceito (o nascimento);
 * - `ativo`: há operador ativo, e o `OPERADOR` é um deles;
 * - `recusado`: há operador ativo, e o `OPERADOR` não existe ou foi desativado.
 */
export type SituacaoDoAutor = 'bootstrap' | 'ativo' | 'recusado'

export interface OperadorAlvo {
  readonly id: string
  readonly apelido: string
}

/**
 * O único código que toca as seis tabelas da operação (Tech Spec da A0, seção 6; o expurgo entra na tarefa 9.0). As
 * tabelas são da nossa equipe e não têm `escola_id`, então nenhum método leva escopo de escola nem `@SemEscopo`; o
 * contrapeso é que este repository não toca nenhuma outra tabela, e nenhuma outra classe toca estas (C45, em
 * `apps/api/test/arquitetura.test.ts`).
 *
 * Recebe o banco ou a transação de quem chama: o `ops:operador` grava tudo de uma operação numa transação só.
 * Devolve só id e apelido: nome, e-mail, hash e segredo nunca saem daqui.
 */
export class OperadorRepository {
  constructor(private readonly banco: Banco | TransacaoBanco) {}

  /** Põe a transação na fila da trava dos operadores; solta sozinha no commit ou no rollback. */
  async travarOperadores(): Promise<void> {
    await this.banco.execute(sql`select pg_advisory_xact_lock(${CHAVE_DA_TRAVA_DOS_OPERADORES})`)
  }

  /** A situação do `OPERADOR` numa consulta só: há ativo, e ele é um deles. */
  async situacaoDoAutor(apelido: string): Promise<SituacaoDoAutor> {
    const [linha] = await this.banco
      .select({
        haAtivo: sql<boolean>`bool_or(${operador.desativadoEm} is null)`,
        ehAtivo: sql<boolean>`bool_or(${operador.desativadoEm} is null and ${operador.apelido} = ${apelido})`,
      })
      .from(operador)
    if (linha?.haAtivo !== true) return 'bootstrap'
    return linha.ehAtivo ? 'ativo' : 'recusado'
  }

  /** O operador ativo com este apelido, com a linha travada até o fim da transação (`desativar`, `convite`). */
  async ativoParaAtualizar(apelido: string): Promise<OperadorAlvo | undefined> {
    const [linha] = await this.banco
      .select({ id: operador.id, apelido: operador.apelido })
      .from(operador)
      .where(and(eq(operador.apelido, apelido), isNull(operador.desativadoEm)))
      .for('update')
    return linha
  }

  async contarAtivos(): Promise<number> {
    const [linha] = await this.banco.select({ total: count() }).from(operador).where(isNull(operador.desativadoEm))
    return linha?.total ?? 0
  }

  /** Apelido ou e-mail repetido sai como erro do banco (23505), que o comando traduz sem o valor. */
  async criar(dados: { apelido: string; nome: string; email: string }): Promise<string> {
    const [criado] = await this.banco.insert(operador).values(dados).returning({ id: operador.id })
    if (criado === undefined) throw new Error('operador não devolvido pelo insert')
    return criado.id
  }

  async criarConvite(dados: { operadorId: string; tokenHash: string; expiraEm: Date }): Promise<string> {
    const [criado] = await this.banco.insert(conviteOperador).values(dados).returning({ id: conviteOperador.id })
    if (criado === undefined) throw new Error('convite de operador não devolvido pelo insert')
    return criado.id
  }

  /** Revoga o convite pendente do operador, se houver (há no máximo um, pelo único parcial). Devolve se revogou. */
  async revogarConvitePendente(operadorId: string): Promise<boolean> {
    const revogados = await this.banco
      .update(conviteOperador)
      .set({ revogadoEm: sql`now()` })
      .where(and(eq(conviteOperador.operadorId, operadorId), isNull(conviteOperador.usadoEm), isNull(conviteOperador.revogadoEm)))
      .returning({ id: conviteOperador.id })
    return revogados.length > 0
  }

  /**
   * Apaga o dado pessoal e marca a desativação: ficam id, apelido, `criado_em`, `desativado_em` e o contador
   * `mfa_versao`. Devolve se desativou (a linha já estava travada por `ativoParaAtualizar`).
   */
  async desativar(operadorId: string): Promise<boolean> {
    const desativados = await this.banco
      .update(operador)
      .set({
        nome: null,
        email: null,
        senhaHash: null,
        mfaSegredoCifrado: null,
        mfaChaveVersao: null,
        mfaAtivadoEm: null,
        mfaUltimoPasso: null,
        desativadoEm: sql`now()`,
      })
      .where(and(eq(operador.id, operadorId), isNull(operador.desativadoEm)))
      .returning({ id: operador.id })
    return desativados.length > 0
  }

  async apagarCodigosDeRecuperacao(operadorId: string): Promise<void> {
    await this.banco.delete(codigoRecuperacaoOperador).where(eq(codigoRecuperacaoOperador.operadorId, operadorId))
  }

  async encerrarSessoes(operadorId: string, motivo: MotivoDeEncerramentoDeOperador): Promise<void> {
    await this.banco
      .update(sessaoOperador)
      .set({ encerradaEm: sql`now()`, motivo })
      .where(and(eq(sessaoOperador.operadorId, operadorId), isNull(sessaoOperador.encerradaEm)))
  }

  /** A auditoria da operação: autor (apelido ou `bootstrap`), ação da lista fechada e operador alvo. Nada mais. */
  async auditar(registro: { autor: string; acao: AcaoDaAuditoriaDaOperacao; operadorAlvoId: string }): Promise<void> {
    await this.banco.insert(auditoriaOperacao).values(registro)
  }
}
