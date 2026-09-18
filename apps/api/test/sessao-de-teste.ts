import { criarBanco, criarPool, DURACAO_DA_SESSAO_HORAS, executarNoContexto, type Banco, type PoolBanco } from '@educa/nucleo'
import type { PapelDeUsuario } from '@educa/shared'
import { randomUUID } from 'node:crypto'
import { lerAmbienteDeTeste } from '../../../tools/ci/compose.ts'
import { urlDoBancoDeTeste } from '../../../tools/testes/integracao.setup.ts'
import { criarEscola, criarRede } from '../src/ops/escola.js'
import { CriacaoDeSessaoRepository } from '../src/sessao/criacao-de-sessao.repository.js'
import { criarSessoesSinteticas, emissorDeTokenSintetico, NOME_SINTETICO } from '../src/sessao/sessoes-sinteticas.js'

/** O operador que os testes gravam na auditoria da rede e da escola que criam. */
export const OPERADOR_DE_TESTE = 'teste-integracao'

export interface SessaoDeTeste {
  readonly escolaId: string
  readonly usuarioId: string
  readonly sessaoId: string
  /** Token de acesso emitido na criação: vale 10 min. Teste mais longo pede outro a `tokenNovo`. */
  readonly token: string
  /** Um token novo da mesma sessão, pelo `EmissorDeToken`. */
  tokenNovo(): Promise<string>
  /** Um token desta sessão emitido em outro instante, para o caso do token já vencido. */
  tokenEm(agora: Date): Promise<string>
}

export interface OpcoesDeSessao {
  papel?: PapelDeUsuario
  quantidade?: number
}

/**
 * Escola e sessão reais para os testes que chamam a API autenticada, pelos mesmos serviços de `ops:escola` e de
 * `ops:sessao-sintetica`, no Postgres do compose de teste. A `GuardaDeSessao` lê a sessão gravada: token sem sessão
 * não passa. Nada de pessoa: nomes fixos e sintéticos.
 */
export class BancadaDeSessoes {
  readonly pool: PoolBanco
  readonly banco: Banco
  readonly #ambiente: Record<string, string | undefined>
  readonly #escolas: string[] = []

  constructor(url = urlDoBancoDeTeste(), ambiente: Record<string, string | undefined> = lerAmbienteDeTeste()) {
    this.pool = criarPool({ url, maximoConexoes: 2, timeoutConexaoMs: 5_000, timeoutConsultaMs: 30_000 }, () => undefined)
    this.banco = criarBanco(this.pool)
    this.#ambiente = ambiente
  }

  /** Uma rede independente e uma escola nova nela, com endereço sorteado. */
  async escola(): Promise<string> {
    const redeId = await criarRede(this.banco, OPERADOR_DE_TESTE, { nome: 'Rede sintética de teste', tipo: 'independente' })
    const escolaId = await criarEscola(this.banco, OPERADOR_DE_TESTE, { redeId, nome: 'Escola sintética de teste', slug: `teste-${randomUUID()}` })
    this.#escolas.push(escolaId)
    return escolaId
  }

  /** `quantidade` sessões na escola, cada uma de um usuário novo com o papel pedido (aluno, se nada for dito). */
  async sessoes(escolaId: string, { papel = 'aluno', quantidade = 1 }: OpcoesDeSessao = {}): Promise<SessaoDeTeste[]> {
    const emissor = emissorDeTokenSintetico(this.#ambiente)
    const criadas = await criarSessoesSinteticas(this.banco, this.#ambiente, { escolaId, papel, quantidade })
    return criadas.map((criada) => ({
      escolaId,
      ...criada,
      tokenNovo: async () => (await emissor.emitir({ escolaId, usuarioId: criada.usuarioId, sessaoId: criada.sessaoId })).token,
      tokenEm: async (agora: Date) =>
        (await emissorDeTokenSintetico(this.#ambiente, { agora: () => agora }).emitir({ escolaId, usuarioId: criada.usuarioId, sessaoId: criada.sessaoId })).token,
    }))
  }

  async sessao(escolaId: string, papel: PapelDeUsuario = 'aluno'): Promise<SessaoDeTeste> {
    const [criada] = await this.sessoes(escolaId, { papel })
    if (criada === undefined) throw new Error('sessão de teste não criada')
    return criada
  }

  /**
   * Um usuário na `escolaId` para a mesma conta do usuário de equipe `usuarioId` (outra escola), com uma sessão, e o
   * token dela. É a professora que dá aula em duas escolas: uma conta, um usuário e um `sub` em cada escola.
   */
  async sessaoDaMesmaConta(usuarioId: string, escolaId: string): Promise<string> {
    const { rows } = await this.pool.query<{ conta_id: string | null; papel: PapelDeUsuario }>('select conta_id, papel from usuario where id = $1', [usuarioId])
    const origem = rows[0]
    if (origem?.conta_id === null || origem === undefined) throw new Error('o usuário de origem precisa ter conta')
    const contaId = origem.conta_id
    const criada = await executarNoContexto({ requisicaoId: randomUUID(), escolaId }, () =>
      this.banco.transaction(async (tx) => {
        const criacao = new CriacaoDeSessaoRepository(tx)
        const [usuario] = await criacao.criarUsuarios([{ contaId, papel: origem.papel, nome: NOME_SINTETICO }])
        if (usuario === undefined) throw new Error('usuário não criado')
        const [sessao] = await criacao.criarSessoes([{ usuarioId: usuario.id, contaId, metodo: 'email', refreshHash: randomUUID(), duracaoHoras: DURACAO_DA_SESSAO_HORAS }])
        if (sessao === undefined) throw new Error('sessão não criada')
        return { usuarioId: usuario.id, sessaoId: sessao.id }
      }),
    )
    return (await emissorDeTokenSintetico(this.#ambiente).emitir({ escolaId, ...criada })).token
  }

  /** Escola nova com uma sessão. */
  async escolaComSessao(papel: PapelDeUsuario = 'aluno'): Promise<SessaoDeTeste> {
    return this.sessao(await this.escola(), papel)
  }

  /** Encerra a sessão no banco, como `DELETE /v1/sessao` fará: a requisição (ou o handshake) seguinte é recusada. */
  async encerrar(sessaoId: string): Promise<void> {
    await this.pool.query(`update sessao set encerrada_em = now(), motivo = 'saida' where id = $1`, [sessaoId])
  }

  /**
   * Apaga as sessões, os usuários e as contas que esta bancada criou, e fecha o pool. A escola, a rede e a auditoria
   * delas ficam, e com a auditoria o usuário que é autor dela: a auditoria só se escreve pela porta dela, e o banco de
   * teste é descartável.
   */
  async fechar(): Promise<void> {
    try {
      if (this.#escolas.length > 0) {
        const escolas = this.#escolas
        const { rows } = await this.pool.query<{ conta_id: string }>('select conta_id from usuario where escola_id = any($1::uuid[]) and conta_id is not null', [escolas])
        await this.pool.query('delete from sessao where escola_id = any($1::uuid[])', [escolas])
        // A estrutura da 8.0 aponta para o ano letivo: sai antes dele.
        await this.pool.query('delete from turma where escola_id = any($1::uuid[])', [escolas])
        await this.pool.query('delete from serie where escola_id = any($1::uuid[])', [escolas])
        await this.pool.query('delete from disciplina where escola_id = any($1::uuid[])', [escolas])
        await this.pool.query('delete from ano_letivo where escola_id = any($1::uuid[])', [escolas])
        // O usuário que é autor de auditoria fica, com a conta dele: a auditoria só se escreve (e não se apaga) pela porta dela.
        await this.pool.query('delete from usuario u where u.escola_id = any($1::uuid[]) and not exists (select 1 from auditoria a where a.escola_id = u.escola_id and a.autor_usuario_id = u.id)', [escolas])
        await this.pool.query('delete from conta c where c.id = any($1::uuid[]) and not exists (select 1 from usuario u where u.conta_id = c.id)', [rows.map((linha) => linha.conta_id)])
      }
    } finally {
      await this.pool.end()
    }
  }
}
