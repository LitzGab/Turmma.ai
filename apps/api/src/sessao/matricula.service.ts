import { ErroDeDominio, FORMATO_SLUG, METRICAS, TAMANHO_MAXIMO_SLUG, type Banco, type Meter } from '@educa/nucleo'
import { CodigoDeErro, type PedidoLoginMatricula } from '@educa/shared'
import type { ConclusaoDeLogin } from './conclusao-de-login.js'
import type { ContadorDeTentativas } from './contador-de-tentativas.js'
import type { CookieDeDispositivo } from './cookie-dispositivo.js'
import { COOKIE_DISPOSITIVO, lerCookie } from './cookies.js'
import { CredencialMatriculaRepository } from './credencial-matricula.repository.js'
import { naEscolaSemUsuario } from './escola-sem-usuario.js'
import type { HashDeSenha } from './hash-de-senha.js'
import { ipParaRegistro, type ConferenciaDaSenha, type OrigemDaRequisicao, type ResultadoDoLogin } from './login.service.js'
import { RegistroDeAcessoRepository } from './registro-de-acesso.repository.js'
import type { ResolucaoDeTenantRepository } from './resolucao-de-tenant.repository.js'
import { baldeDaEscola, baldeDaEscolaDesconhecida } from './senha/baldes-de-login.js'
import { DuracaoDoLogin } from './senha/duracao-do-login.js'
import type { SemaforoDeHash } from './senha/semaforo-de-hash.js'

/**
 * A "escola desconhecida" do slug que não existe: entra no lugar do `escola_id` na chave do contador e na entrada do
 * `educa_dispositivo`, para o slug inexistente seguir o mesmo caminho, com a mesma resposta, até o bloqueio. Não é
 * escola nenhuma e nunca vira contexto.
 */
export const ESCOLA_DESCONHECIDA = '00000000-0000-0000-0000-000000000000'

export interface DependenciasDoLoginPorMatricula {
  readonly banco: Banco
  readonly resolucao: ResolucaoDeTenantRepository
  readonly hash: HashDeSenha
  /** O semáforo do hash (14.0), com o balde da escola do endereço, ou o da escola desconhecida. */
  readonly semaforo: SemaforoDeHash
  readonly contador: ContadorDeTentativas
  readonly dispositivo: CookieDeDispositivo
  readonly conclusao: ConclusaoDeLogin
  readonly medidor: Meter
}

type CredencialDoAluno = Awaited<ReturnType<CredencialMatriculaRepository['doAlunoAtivo']>>

/** O identificador da conta do aluno no contador e no cookie: a escola e a matrícula, nunca a matrícula sozinha. */
export function identificadorDoAluno(escolaId: string, matricula: string): string {
  return `${escolaId}|${matricula}`
}

/**
 * O login do aluno pelo endereço da escola, com matrícula e senha (RF7, RF11, RF15; Tech Spec, seções 1, 5 e 6).
 *
 * - **A escola vem do slug:** a `ResolucaoDeTenantRepository` acha a escola pelo endereço, e a credencial é lida pelo
 *   repository com escopo, num contexto de escola sem usuário. A mesma matrícula em outra escola é outra conta, e a
 *   senha dela não abre esta.
 * - **Respostas iguais:** slug inexistente, matrícula inexistente, aluno desativado e senha errada levam um hash cada
 *   (o fixo, quando não há credencial) e a mesma resposta, `NAO_AUTENTICADO`; e todos contam no contador, até o
 *   `CONTA_SEGURADA`. Nem o corpo, nem o hash, nem o bloqueio dizem se a matrícula existe (regra 20, item 6).
 * - **Segura por conta, nunca por IP** (regra 80, item 1): a chave do contador é o HMAC de `escola_id|matricula`, com o
 *   sufixo `conhecido` quando o navegador tem o `educa_dispositivo` dessa conta. Errar a senha segura só a matrícula
 *   daquela escola; os colegas atrás do mesmo IP, e a mesma matrícula em outra escola, continuam entrando.
 * - **Acerto:** zera o contador e vai direto a `pronta` (o aluno tem um usuário só, sem conta nem segundo fator), com
 *   sessão de método `matricula`, `registro_acesso` e os cookies `educa_sessao` e `educa_dispositivo`.
 * - **Log:** nada aqui escreve matrícula nem o slug digitado; o filtro de erro registra só o código.
 * - **Semáforo do hash** (14.0): a vez é pedida no balde da escola do endereço, exista a matrícula ou não (o endereço
 *   que não existe tem o balde dele), e antes de a tentativa ser contada: o 503 de quem esperou demais não conta como
 *   senha errada, e a rajada da escola vira fila, nunca `CONTA_SEGURADA`.
 */
export class LoginPorMatricula {
  readonly #contaSegurada: ReturnType<Meter['createCounter']>
  readonly #duracao: DuracaoDoLogin

  constructor(private readonly dependencias: DependenciasDoLoginPorMatricula) {
    this.#contaSegurada = dependencias.medidor.createCounter(METRICAS.contaSegurada, { description: 'Tentativas de login respondidas com CONTA_SEGURADA' })
    this.#duracao = new DuracaoDoLogin(dependencias.medidor, 'matricula')
  }

  entrar(pedido: PedidoLoginMatricula, origem: OrigemDaRequisicao): Promise<ResultadoDoLogin> {
    return this.#duracao.medir(() => this.#entrar(pedido, origem))
  }

  async #entrar(pedido: PedidoLoginMatricula, origem: OrigemDaRequisicao): Promise<ResultadoDoLogin> {
    const escolaId = await this.#escolaDoSlug(pedido.slug)
    if (escolaId === undefined) return this.#recusar(ESCOLA_DESCONHECIDA, pedido, origem)
    return naEscolaSemUsuario(escolaId, async () => {
      const { banco, hash, semaforo, contador, conclusao } = this.dependencias
      const { chave, identificador } = this.#chave(escolaId, pedido.matricula, origem)
      const conferencia = await semaforo.executar(baldeDaEscola(escolaId), async (): Promise<ConferenciaDaSenha<CredencialDoAluno>> => {
        const reserva = await contador.reservar(chave)
        if (!reserva.liberada) return { seguradaPorMs: reserva.esperaMs }
        const credencial = await new CredencialMatriculaRepository(banco).doAlunoAtivo(pedido.matricula)
        return { reserva, credencial, confere: await hash.verificar(credencial?.senhaHash, pedido.senha) }
      })
      if ('seguradaPorMs' in conferencia) throw this.#segurada(conferencia.seguradaPorMs)
      const { reserva, credencial, confere } = conferencia
      if (credencial === undefined || !confere) {
        await new RegistroDeAcessoRepository(banco).gravarFalha(ipParaRegistro(origem.ip))
        if (reserva.esperaSeFalharMs > 0) throw this.#segurada(reserva.esperaSeFalharMs)
        throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
      }

      await contador.zerar(chave)
      return conclusao.entrarComoAluno({ usuarioId: credencial.usuarioId, escolaId }, identificador, origem)
    })
  }

  /** A escola do endereço, ou `undefined`: slug fora do formato nem vai ao banco, e responde como o inexistente. */
  async #escolaDoSlug(slug: string): Promise<string | undefined> {
    if (slug.length > TAMANHO_MAXIMO_SLUG || !FORMATO_SLUG.test(slug)) return undefined
    return this.dependencias.resolucao.escolaPorSlug(slug)
  }

  /**
   * O slug que não existe: espera a vez no balde da escola desconhecida, conta no contador dela e passa pelo hash fixo,
   * como a matrícula que não existe. Sem escola, não grava `registro_acesso`: não há de quem seja o registro.
   */
  async #recusar(escolaId: string, pedido: PedidoLoginMatricula, origem: OrigemDaRequisicao): Promise<never> {
    const { chave } = this.#chave(escolaId, pedido.matricula, origem)
    const { contador, hash, semaforo } = this.dependencias
    const conferencia = await semaforo.executar(baldeDaEscolaDesconhecida(), async (): Promise<ConferenciaDaSenha<undefined>> => {
      const reserva = await contador.reservar(chave)
      if (!reserva.liberada) return { seguradaPorMs: reserva.esperaMs }
      return { reserva, credencial: undefined, confere: await hash.verificar(undefined, pedido.senha) }
    })
    if ('seguradaPorMs' in conferencia) throw this.#segurada(conferencia.seguradaPorMs)
    const { reserva } = conferencia
    if (reserva.esperaSeFalharMs > 0) throw this.#segurada(reserva.esperaSeFalharMs)
    throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
  }

  #chave(escolaId: string, matricula: string, origem: OrigemDaRequisicao): { chave: string; identificador: string } {
    const { contador, dispositivo } = this.dependencias
    const identificador = identificadorDoAluno(escolaId, matricula)
    const conhecido = dispositivo.conhece(lerCookie(origem.cabecalhoCookie, COOKIE_DISPOSITIVO), identificador)
    return { chave: contador.chaveDe(identificador, conhecido ? 'conhecido' : 'outro'), identificador }
  }

  #segurada(esperaMs: number): ErroDeDominio {
    this.#contaSegurada.add(1)
    return new ErroDeDominio(CodigoDeErro.CONTA_SEGURADA, undefined, Math.max(1, Math.ceil(esperaMs / 1_000)))
  }
}
