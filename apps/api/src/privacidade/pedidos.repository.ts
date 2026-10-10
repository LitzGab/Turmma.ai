import { exigirEscolaDoContexto, identidadeDaRequisicao, pedidoTitular, usuario, type Banco, type TransacaoBanco } from '@educa/nucleo'
import type { Compartilhamento, EstadoDoPedido, SolicitanteDoPedido, TipoDePedidoDoTitular } from '@educa/shared'
import { and, asc, eq, gt, ne, sql, type SQL } from 'drizzle-orm'

/** O que o registro do pedido grava, além do que vem da requisição. */
export interface PedidoParaRegistrar {
  readonly titularId: string
  readonly papelTitular: 'aluno' | 'professor'
  readonly tipo: TipoDePedidoDoTitular
  readonly solicitante: SolicitanteDoPedido
  readonly chegouEm: string
  readonly chaveEnvio: string
  readonly homonimo: boolean
  /**
   * O estado em que o pedido nasce: `em_preparacao` quando gera arquivo (acesso e portabilidade, que enfileiram o job na
   * mesma transação), `recebido` nos outros três (F3, tarefa 13.0).
   */
  readonly estado: 'recebido' | 'em_preparacao'
  /** A foto do compartilhamento no momento do registro (F3, tarefa 12.0): é ela que sobrevive ao expurgo do titular. */
  readonly compartilhamento: Compartilhamento
}

/**
 * Um pedido como a lista, o detalhe e as ações o acham: os campos que a máquina de estados precisa, a foto do
 * compartilhamento e a conta do titular, que decide o "pedido sobre si mesmo" (a mesma `conta_id` de quem pediu
 * responde como inexistente).
 */
export interface PedidoAchado {
  readonly id: string
  readonly titularId: string
  readonly contaDoTitular: string | null
  readonly tipo: TipoDePedidoDoTitular
  readonly solicitante: SolicitanteDoPedido
  readonly chegouEm: string
  readonly estado: EstadoDoPedido
  readonly concluidoEm: Date | null
  readonly homonimo: boolean | null
  readonly nomeTrocado: boolean | null
  readonly compartilhamento: Compartilhamento
}

const colunasDoPedido = {
  id: pedidoTitular.id,
  titularId: pedidoTitular.titularId,
  tipo: pedidoTitular.tipo,
  solicitante: pedidoTitular.solicitante,
  chegouEm: pedidoTitular.chegouEm,
  estado: pedidoTitular.estado,
  concluidoEm: pedidoTitular.concluidoEm,
  homonimo: pedidoTitular.homonimo,
  nomeTrocado: pedidoTitular.nomeTrocado,
  compartilhamento: pedidoTitular.compartilhamento,
}

/**
 * Os pedidos do titular na escola do contexto (F3, RF10 e RF16; Tech Spec do F3, seções 3 e 4; regra 10, item 3):
 * escola e pessoa vêm do contexto. O pedido guarda só id, tipo, quem pediu, datas, estado, autor e a foto do
 * compartilhamento: **nenhuma coluna de nome, matrícula ou texto**, e o nome do titular só entra na resposta pela
 * junção com o `usuario`, que some quando ele é eliminado.
 *
 * O registro decide a corrida no banco (`insert … on conflict (escola_id, chave_envio) do nothing`), como a
 * `execucao_agente.chave_envio`; a mesma chave, com o mesmo conteúdo e da mesma coordenação, é sempre o mesmo pedido
 * (regra 80, item 7). As ações decidem pelo
 * `where` do `update`, e só a chamada que mudou registra o passo na auditoria.
 */
export class PedidosRepository {
  constructor(private readonly banco: Banco | TransacaoBanco) {}

  /**
   * Grava o pedido `recebido` e devolve o id. Com a chave de envio já usada na escola, não grava e devolve
   * `undefined`: quem chama devolve o pedido daquela chave, que é sempre o mesmo, e confere que ele é o pedido que foi
   * pedido (Tech Spec do F3, seções 4 e 5).
   */
  async registrar(pedido: PedidoParaRegistrar): Promise<string | undefined> {
    const { usuarioId } = identidadeDaRequisicao()
    const [gravado] = await this.banco
      .insert(pedidoTitular)
      .values({
        escolaId: exigirEscolaDoContexto(),
        titularId: pedido.titularId,
        papelTitular: pedido.papelTitular,
        tipo: pedido.tipo,
        solicitante: pedido.solicitante,
        chegouEm: pedido.chegouEm,
        estado: pedido.estado,
        compartilhamento: pedido.compartilhamento,
        homonimo: pedido.homonimo,
        registradoPor: usuarioId,
        chaveEnvio: pedido.chaveEnvio,
      })
      .onConflictDoNothing({ target: [pedidoTitular.escolaId, pedidoTitular.chaveEnvio] })
      .returning({ id: pedidoTitular.id })
    return gravado?.id
  }

  /**
   * O pedido desta chave de envio, na escola do contexto, **registrado por quem pede**: o de outra coordenação responde
   * como inexistente. É o que a colisão da chave devolve, e quem chama confere que o pedido é este mesmo.
   */
  async daChave(chaveEnvio: string): Promise<PedidoAchado | undefined> {
    return this.#um(and(eq(pedidoTitular.escolaId, exigirEscolaDoContexto()), eq(pedidoTitular.chaveEnvio, chaveEnvio), eq(pedidoTitular.registradoPor, identidadeDaRequisicao().usuarioId)))
  }

  /** O pedido deste id, na escola do contexto, com a conta do titular. O de outra escola e o inexistente não vêm. */
  async de(id: string): Promise<PedidoAchado | undefined> {
    return this.#um(and(eq(pedidoTitular.escolaId, exigirEscolaDoContexto()), eq(pedidoTitular.id, id)))
  }

  /**
   * A página de pedidos da escola, em ordem de id, começando depois de `depoisDe` (o `proxima` da página anterior).
   * `limite + 1` linhas: a mais só diz que há próxima página. O nome e as turmas do titular entram por quem chama,
   * porque o titular pode já não existir ("Titular eliminado"). **O pedido sobre a própria pessoa de quem pediu não
   * entra**: ele responde como inexistente em toda rota, e quem atende um pedido nunca é quem o pediu.
   */
  async listar(depoisDe: string | undefined, limite: number, deQuemPediu: { readonly usuarioId: string; readonly contaId: string | null }): Promise<PedidoAchado[]> {
    const criterio = and(
      eq(pedidoTitular.escolaId, exigirEscolaDoContexto()),
      ne(pedidoTitular.titularId, deQuemPediu.usuarioId),
      ...(deQuemPediu.contaId === null ? [] : [sql`(${usuario.contaId} is null or ${usuario.contaId} <> ${deQuemPediu.contaId})`]),
      ...(depoisDe === undefined ? [] : [gt(pedidoTitular.id, depoisDe)]),
    )
    return this.#vários(criterio, limite + 1)
  }

  /**
   * Conclui o pedido aberto de acesso, portabilidade, compartilhamento ou correção: `estado`, `concluido_em` e
   * `concluido_por` juntos, e **só a chamada que mudou** devolve o estado em que o pedido estava (o `where` decide a
   * corrida do clique duplo). O estado anterior sai do próprio `update`, de uma subconsulta que **trava a linha**: o job
   * do arquivo (13.0) passa `em_preparacao` para `pronto` por fora, e um estado lido antes do `update` poderia não ser o
   * que foi trocado (a auditoria diria `pronto` de um pedido que estava `em_preparacao`). A eliminação não conclui por
   * aqui: é o job dela (tarefa 15.0), que assina com o autor `rotina`.
   */
  async concluir(id: string): Promise<EstadoDoPedido | undefined> {
    const { usuarioId } = identidadeDaRequisicao()
    const escolaId = exigirEscolaDoContexto()
    const concluidoEm = new Date()
    const { rows } = await this.banco.execute<{ anterior: EstadoDoPedido }>(sql`
      update pedido_titular p set estado = 'concluido', concluido_em = ${concluidoEm.toISOString()}::timestamptz, concluido_por = ${usuarioId}
      from (
        select a.id, a.estado from pedido_titular a
        where a.escola_id = ${escolaId} and a.id = ${id}
          and a.tipo in ('acesso', 'portabilidade', 'compartilhamento', 'correcao')
          and a.estado in ('recebido', 'em_preparacao', 'pronto')
        for update
      ) anterior
      where p.escola_id = ${escolaId} and p.id = anterior.id
      returning anterior.estado as anterior
    `)
    return rows[0]?.anterior
  }

  /**
   * O nome corrigido do titular (F3, RF13b): muda **só o `usuario` da escola do contexto**, e só quando o pedido de
   * correção ainda está aberto — o `where`, com a subconsulta do pedido, decide a corrida do clique duplo. O nome
   * anterior não volta para lugar nenhum: a auditoria não o traz, e quem o tem em texto livre o perde no expurgo.
   */
  async corrigirNome(id: string, nome: string): Promise<boolean> {
    const escolaId = exigirEscolaDoContexto()
    const atualizado = await this.banco.execute(sql`
      update usuario u set nome = ${nome}
      where u.escola_id = ${escolaId} and u.id = (
        select p.titular_id from pedido_titular p
        where p.escola_id = ${escolaId} and p.id = ${id}
          and p.tipo = 'correcao' and p.estado in ('recebido', 'pronto')
      )
      returning u.id
    `)
    return atualizado.rows.length > 0
  }

  async #um(criterio: SQL | undefined): Promise<PedidoAchado | undefined> {
    const [linha] = await this.banco
      .select({ ...colunasDoPedido, contaDoTitular: usuario.contaId })
      .from(pedidoTitular)
      .leftJoin(usuario, and(eq(usuario.escolaId, pedidoTitular.escolaId), eq(usuario.id, pedidoTitular.titularId)))
      .where(criterio)
      .orderBy(asc(pedidoTitular.id))
      .limit(1)
    return linha
  }

  async #vários(criterio: SQL | undefined, limite: number): Promise<PedidoAchado[]> {
    return this.banco
      .select({ ...colunasDoPedido, contaDoTitular: usuario.contaId })
      .from(pedidoTitular)
      .leftJoin(usuario, and(eq(usuario.escolaId, pedidoTitular.escolaId), eq(usuario.id, pedidoTitular.titularId)))
      .where(criterio)
      .orderBy(asc(pedidoTitular.id))
      .limit(limite)
  }
}
