import { ErroDeDominio, RegistroDeAuditoria, type Banco } from '@educa/nucleo'
import { Logger } from '@nestjs/common'
import {
  CodigoDeErro,
  esquemaRespostaListaDeVinculos,
  esquemaRespostaMeusVinculos,
  esquemaRespostaVinculo,
  esquemaRespostaVinculoDaCoordenacao,
  ESTADOS_EM_DECISAO,
  type ConsultaPaginada,
  type ConsultaVinculos,
  type EstadoDeVinculo,
  type PedidoContestarVinculo,
  type PedidoCriarVinculo,
  type PedidoEncerrarVinculo,
  type RespostaListaDeVinculos,
  type RespostaMeusVinculos,
  type RespostaVinculo,
  type RespostaVinculoDaCoordenacao,
  type Vinculo,
  type VinculoDaCoordenacao,
} from '@educa/shared'
import { DisciplinaRepository } from './disciplina.repository.js'
import { paginar } from './entrada.js'
import { TurmaRepository } from './turma.repository.js'
import { VinculoRepository, type Decisao, type VinculoLido } from './vinculo.repository.js'

const registro = new RegistroDeAuditoria()

const emDecisao = (estado: EstadoDeVinculo): estado is (typeof ESTADOS_EM_DECISAO)[number] => (ESTADOS_EM_DECISAO as readonly EstadoDeVinculo[]).includes(estado)

/** O vínculo como o professor dono o vê: sem o `complemento`, que é só da coordenação (Tech Spec, seção 7). */
function doProfessor(lido: VinculoLido): Vinculo {
  return {
    id: lido.id,
    turma: lido.turma,
    ...(lido.disciplina === null ? {} : { disciplina: lido.disciplina }),
    estado: lido.estado,
    ...(lido.contestacao === null ? {} : { contestacao: lido.contestacao }),
    ...(lido.decididoEm === null ? {} : { decididoEm: lido.decididoEm.toISOString() }),
  }
}

/** O vínculo como a coordenação o vê: de quem é, o papel, o `complemento` e o motivo do encerramento. */
function daCoordenacao(lido: VinculoLido): VinculoDaCoordenacao {
  return {
    ...doProfessor(lido),
    usuarioId: lido.usuarioId,
    papel: lido.papel,
    ...(lido.complemento === null ? {} : { complemento: lido.complemento }),
    ...(lido.motivoEncerramento === null ? {} : { motivoEncerramento: lido.motivoEncerramento }),
  }
}

/**
 * O vínculo pessoa × turma × disciplina do ano letivo em curso (RF3 a RF5, RF19; regra 60, item 8a). Toda operação
 * falha fechada sem ano em curso (Tech Spec, seção 5, "Requisição"), e toda escrita grava a auditoria na mesma
 * transação (regra 20, item 10).
 *
 * - **Criar** (coordenação): a turma do ano em curso, a pessoa ativa da escola com o papel do vínculo e a disciplina da
 *   escola, ou `NAO_ENCONTRADO`, igual para o id de outra escola e o inexistente. Nasce `pendente`. O repetido, mesmo em
 *   dois pedidos simultâneos, dá `CONFLITO` pelo índice único.
 * - **Confirmar e contestar** (professor dono): o vínculo de outro professor, de outra escola ou inexistente dá
 *   `NAO_ENCONTRADO`. Só a partir de `pendente` ou `contestado`. Confirmar de novo o que já está confirmado responde o
 *   vínculo como está, sem gravar nada (o segundo clique); o resto dá `CONFLITO`.
 * - **Encerrar** (coordenação): `desligamento` ou `realocacao`. O acesso cai na requisição seguinte, porque a leitura
 *   da turma junta o vínculo a cada vez. Encerrar de novo responde o vínculo como está.
 */
export class VinculoService {
  /** Só o nome do evento: escola, usuário e requisição vêm do contexto, e o complemento nunca vai a log (regra 20, item 9). */
  readonly #logger = new Logger('vinculo')

  constructor(private readonly banco: Banco) {}

  async criar(pedido: PedidoCriarVinculo): Promise<RespostaVinculoDaCoordenacao> {
    const turmaId = pedido.turmaId.toLowerCase()
    const usuarioId = pedido.usuarioId.toLowerCase()
    const disciplinaId = pedido.disciplinaId?.toLowerCase() ?? null
    const criado = await this.banco.transaction(async (tx) => {
      const turmas = new TurmaRepository(tx)
      const vinculos = new VinculoRepository(tx)
      // O ano em curso travado em `FOR SHARE`: o encerramento do ano espera o vínculo nascer, e o que chega depois não nasce.
      if (!(await turmas.travarAnoEmCurso())) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
      if ((await turmas.aberta(turmaId, 'unidade')) === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
      if (!(await vinculos.pessoaAtivaComPapel(usuarioId, pedido.papel))) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
      if (disciplinaId !== null && (await new DisciplinaRepository(tx).porId(disciplinaId)) === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
      const id = await vinculos.criar({ usuarioId, turmaId, disciplinaId, papel: pedido.papel })
      await registro.gravar(tx, 'vinculo.criado', { entidadeId: id, depois: { usuarioId, turmaId, disciplinaId, papel: pedido.papel, estado: 'pendente' } })
      return this.#lido(vinculos.porId(id))
    })
    this.#logger.log('vinculo.criado')
    return esquemaRespostaVinculoDaCoordenacao.parse(daCoordenacao(criado))
  }

  async listar(consulta: ConsultaVinculos): Promise<RespostaListaDeVinculos> {
    const linhas = await new VinculoRepository(this.banco).listar(consulta)
    const pagina = paginar(linhas, consulta.limite)
    return esquemaRespostaListaDeVinculos.parse({ ...pagina, itens: pagina.itens.map(daCoordenacao) })
  }

  async meus(consulta: ConsultaPaginada): Promise<RespostaMeusVinculos> {
    const linhas = await new VinculoRepository(this.banco).listarDoUsuario(consulta)
    const pagina = paginar(linhas, consulta.limite)
    return esquemaRespostaMeusVinculos.parse({ ...pagina, itens: pagina.itens.map(doProfessor) })
  }

  confirmar(id: string): Promise<RespostaVinculo> {
    return this.#decidir(id, { estado: 'confirmado' })
  }

  contestar(id: string, pedido: PedidoContestarVinculo): Promise<RespostaVinculo> {
    return this.#decidir(id, { estado: 'contestado', contestacao: pedido.contestacao, complemento: pedido.complemento ?? null })
  }

  async encerrar(id: string, pedido: PedidoEncerrarVinculo): Promise<RespostaVinculoDaCoordenacao> {
    const encerrado = await this.banco.transaction(async (tx) => {
      const vinculos = new VinculoRepository(tx)
      const antes = await vinculos.travar(id, { doUsuario: false })
      if (antes === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
      if (antes !== 'encerrado') {
        if (!(await vinculos.encerrar(id, pedido.motivo))) throw new ErroDeDominio(CodigoDeErro.CONFLITO)
        await registro.gravar(tx, 'vinculo.encerrado', { entidadeId: id, antes: { estado: antes }, depois: { estado: 'encerrado', motivo: pedido.motivo } })
        this.#logger.log('vinculo.encerrado')
      }
      return this.#lido(vinculos.porId(id))
    })
    return esquemaRespostaVinculoDaCoordenacao.parse(daCoordenacao(encerrado))
  }

  async #decidir(id: string, decisao: Decisao): Promise<RespostaVinculo> {
    const decidido = await this.banco.transaction(async (tx) => {
      const vinculos = new VinculoRepository(tx)
      const antes = await vinculos.travar(id, { doUsuario: true })
      if (antes === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
      if (!emDecisao(antes)) {
        if (antes === 'confirmado' && decisao.estado === 'confirmado') return this.#lido(vinculos.porIdDoUsuario(id))
        throw new ErroDeDominio(CodigoDeErro.CONFLITO)
      }
      if (!(await vinculos.decidir(id, decisao))) throw new ErroDeDominio(CodigoDeErro.CONFLITO)
      if (decisao.estado === 'confirmado') {
        await registro.gravar(tx, 'vinculo.confirmado', { entidadeId: id, antes: { estado: antes }, depois: { estado: 'confirmado' } })
        this.#logger.log('vinculo.confirmado')
      } else {
        // Só o código: o complemento nunca vai à auditoria nem ao log (Tech Spec, seção 7).
        await registro.gravar(tx, 'vinculo.contestado', { entidadeId: id, antes: { estado: antes }, depois: { estado: 'contestado', contestacao: decisao.contestacao } })
        this.#logger.log('vinculo.contestado')
      }
      return this.#lido(vinculos.porIdDoUsuario(id))
    })
    return esquemaRespostaVinculo.parse(doProfessor(decidido))
  }

  async #lido(leitura: Promise<VinculoLido | undefined>): Promise<VinculoLido> {
    const lido = await leitura
    if (lido === undefined) throw new Error('vínculo lido na mesma transação não encontrado')
    return lido
  }
}
