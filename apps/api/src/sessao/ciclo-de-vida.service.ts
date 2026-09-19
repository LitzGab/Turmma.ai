import { contextoAtual, ErroDeDominio, exigirEscolaDoContexto, RegistroDeAuditoria, type Banco, type TransacaoBanco } from '@educa/nucleo'
import { CodigoDeErro } from '@educa/shared'
import { z } from 'zod'
import { CicloDeVidaRepository, type UsuarioDoCicloDeVida } from './ciclo-de-vida.repository.js'
import { EscritaDeSessaoRepository } from './escrita-de-sessao.repository.js'
import { ResolucaoDeTenantRepository } from './resolucao-de-tenant.repository.js'

/** Quem pede a ação, quando não é a pessoa da sessão: alguém da nossa equipe, por comando, a pedido da escola. */
export interface AutoriaDoCicloDeVida {
  readonly autorOperador?: string
}

const registro = new RegistroDeAuditoria()
const esquemaId = z.uuid()

/** Id de outra escola, de ninguém, já desativado (na desativação) ou o próprio: a mesma resposta (regra 10, item 6). */
const naoEncontrado = () => new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)

/**
 * O fim do acesso de quem sai da escola (tarefa 17.0; Tech Spec, seção 5, "Ciclo de vida"; regra 20, itens 15 e 18).
 * Cada ação roda numa transação, com a auditoria dentro dela, e alcança só o que é da escola do contexto: a conta
 * global só é limpa quando não serve mais a escola nenhuma.
 *
 * Não há rota no F1 (a tela de estrutura é do F2, e o pedido do titular do F3): quem chama já conferiu a permissão, e
 * o contexto traz a escola e o autor, a pessoa da sessão ou o operador.
 *
 * - **Desativar:** o usuário deixa de entrar na requisição seguinte (a guarda recusa usuário desativado) e deixa de ter
 *   credencial guardada nesta escola: as sessões dele aqui são encerradas, o hash da senha da matrícula é apagado e a
 *   conta Google ou Microsoft ligada é desligada. Se a conta global ficou sem usuário ativo em escola nenhuma, ela é
 *   limpa (e-mail, senha, segundo fator e as sessões que restarem).
 * - **Eliminar:** apaga de fato o usuário e o que é dele nesta escola (credencial, conta externa, vínculos e sessões);
 *   o registro de acesso e a auditoria ficam pela retenção legal. Se era o último usuário da conta, a mesma limpeza.
 * - **Desligar a conta externa:** a coordenação desliga a conta Google ou Microsoft de um usuário ativo, e ele liga a
 *   nova no login seguinte (decidido na 13.0).
 *
 * A ordem das travas: o usuário, depois a conta, e só então as sessões, como a redefinição do MFA (conta, depois
 * sessões), para as duas não se prenderem uma à outra. Duas desativações de usuários da mesma conta ao mesmo tempo
 * esperam uma pela outra na conta, e a segunda vê que ninguém mais está ativo.
 */
export class CicloDeVidaService {
  constructor(private readonly banco: Banco) {}

  async desativar(usuarioId: string, autoria: AutoriaDoCicloDeVida = {}): Promise<void> {
    await this.#naTransacao(usuarioId, async (tx, alvo) => {
      if (alvo.desativadoEm !== null) throw naoEncontrado()
      const repositorio = new CicloDeVidaRepository(tx)
      const desativadoEm = await repositorio.desativar(usuarioId)
      if (desativadoEm === undefined) throw naoEncontrado()
      const sessoesEncerradas = await new EscritaDeSessaoRepository(tx).encerrarDoUsuario(usuarioId, 'desativacao')
      const credencialApagada = await repositorio.apagarSenhaDaMatricula(usuarioId)
      const contaExternaDesligada = (await repositorio.apagarContaExterna(usuarioId)) !== undefined
      const contaLimpa = alvo.contaId !== null && (await new ResolucaoDeTenantRepository(tx).limparContaSemUso(alvo.contaId))
      await registro.gravar(tx, 'usuario.desativado', {
        entidadeId: usuarioId,
        antes: { papel: alvo.papel },
        depois: { desativadoEm: desativadoEm.toISOString(), sessoesEncerradas, credencialApagada, contaExternaDesligada, contaLimpa },
        ...autoria,
      })
    })
  }

  async eliminar(usuarioId: string, autoria: AutoriaDoCicloDeVida = {}): Promise<void> {
    await this.#naTransacao(usuarioId, async (tx, alvo) => {
      const repositorio = new CicloDeVidaRepository(tx)
      const sessoesApagadas = await repositorio.apagarSessoes(usuarioId)
      const vinculosApagados = await repositorio.apagarVinculos(usuarioId)
      const credencialApagada = await repositorio.apagarCredencialDaMatricula(usuarioId)
      const contaExternaApagada = (await repositorio.apagarContaExterna(usuarioId)) !== undefined
      await repositorio.apagarUsuario(usuarioId)
      const contaLimpa = alvo.contaId !== null && (await new ResolucaoDeTenantRepository(tx).limparContaSemUso(alvo.contaId))
      await registro.gravar(tx, 'usuario.eliminado', {
        entidadeId: usuarioId,
        antes: { papel: alvo.papel, desativadoEm: alvo.desativadoEm?.toISOString() ?? null },
        depois: { sessoesApagadas, vinculosApagados, credencialApagada, contaExternaApagada, contaLimpa },
        ...autoria,
      })
    })
  }

  async desligarContaExterna(usuarioId: string, autoria: AutoriaDoCicloDeVida = {}): Promise<void> {
    await this.#naTransacao(usuarioId, async (tx, alvo) => {
      if (alvo.desativadoEm !== null) throw naoEncontrado()
      const desligada = await new CicloDeVidaRepository(tx).apagarContaExterna(usuarioId)
      if (desligada === undefined) throw naoEncontrado()
      await registro.gravar(tx, 'conta_externa.desligada', { entidadeId: desligada.id, antes: { usuarioId, provedor: desligada.provedor }, ...autoria })
    })
  }

  /**
   * Abre a transação, trava o usuário da escola do contexto e a conta dele, e só então roda a ação. O próprio usuário da
   * sessão não se desativa nem se elimina: a escola ficaria sem quem pediu, e a resposta é a mesma do id de ninguém.
   */
  async #naTransacao(usuarioId: string, acao: (tx: TransacaoBanco, alvo: UsuarioDoCicloDeVida) => Promise<void>): Promise<void> {
    exigirEscolaDoContexto()
    if (!esquemaId.safeParse(usuarioId).success) throw naoEncontrado()
    // O contexto guarda o id em minúsculas, como o Postgres o devolve: a comparação com o próprio usuário vale em qualquer caixa.
    if (contextoAtual()?.usuarioId === usuarioId.toLowerCase()) throw naoEncontrado()
    await this.banco.transaction(async (tx) => {
      const alvo = await new CicloDeVidaRepository(tx).travarUsuario(usuarioId)
      if (alvo === undefined) throw naoEncontrado()
      if (alvo.contaId !== null) await new ResolucaoDeTenantRepository(tx).travarConta(alvo.contaId)
      await acao(tx, alvo)
    })
  }
}
