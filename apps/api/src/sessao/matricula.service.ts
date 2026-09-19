import { FORMATO_SLUG, TAMANHO_MAXIMO_SLUG, type Banco, type Meter } from '@educa/nucleo'
import type { PedidoLoginMatricula } from '@educa/shared'
import type { ConclusaoDeLogin } from './conclusao-de-login.js'
import type { ContadorDeTentativas } from './contador-de-tentativas.js'
import type { CookieDeDispositivo } from './cookie-dispositivo.js'
import { COOKIE_DISPOSITIVO, lerCookie } from './cookies.js'
import { CredencialMatriculaRepository } from './credencial-matricula.repository.js'
import { naEscolaSemUsuario } from './escola-sem-usuario.js'
import { ipParaRegistro, type OrigemDaRequisicao, type ResultadoDoLogin } from './login.service.js'
import { RegistroDeAcessoRepository } from './registro-de-acesso.repository.js'
import type { ResolucaoDeTenantRepository } from './resolucao-de-tenant.repository.js'
import { baldeDaEscola, baldeDaEscolaDesconhecida } from './senha/baldes-de-login.js'
import type { ConferenciaNaVez, TentativaDeSenha } from './senha/conferencia-na-vez.js'
import { DuracaoDoLogin } from './senha/duracao-do-login.js'
import type { RebaixamentoPorEscola } from './senha/rebaixamento.js'

/**
 * A "escola desconhecida" do slug que não existe: entra no lugar do `escola_id` na chave do contador e na entrada do
 * `educa_dispositivo`, para o slug inexistente seguir o mesmo caminho, com a mesma resposta, até o bloqueio. Não é
 * escola nenhuma e nunca vira contexto.
 */
export const ESCOLA_DESCONHECIDA = '00000000-0000-0000-0000-000000000000'

export interface DependenciasDoLoginPorMatricula {
  readonly banco: Banco
  readonly resolucao: ResolucaoDeTenantRepository
  /** A vez no semáforo do hash (14.0), no balde da escola do endereço ou no da escola desconhecida, o contador e o hash. */
  readonly conferencia: ConferenciaNaVez
  readonly contador: ContadorDeTentativas
  /** O rebaixamento por IP e escola (15.1): o IP com falhas demais na escola vai para o fim do balde dela. */
  readonly rebaixamento: RebaixamentoPorEscola
  readonly dispositivo: CookieDeDispositivo
  readonly conclusao: ConclusaoDeLogin
  readonly medidor: Meter
}

type CredencialDoAluno = Awaited<ReturnType<CredencialMatriculaRepository['doAlunoAtivo']>>

/** A chave do contador de uma tentativa, o identificador do cookie e se o navegador já conhece a conta. */
interface ChaveDaTentativa {
  readonly chave: string
  readonly identificador: string
  readonly conhecido: boolean
}

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
 * - **Rebaixamento** (15.1): o IP com mais falhas que o limiar da escola no último minuto vai para o fim do balde dela,
 *   sem recusa; quem traz o `educa_dispositivo` daquela matrícula mantém a vez. Toda falha na escola conta para o IP.
 *   O endereço que não existe não conta falha por IP: o balde dele não tem aluno de verdade a proteger.
 * - **Limite por IP do login** (15.0): o IP acima do limite por IP das rotas de login (`@LimiteQueRebaixa()`) também vai
 *   para o fim do balde, com a mesma passagem pelo cookie, e nunca recebe 429.
 */
export class LoginPorMatricula {
  readonly #duracao: DuracaoDoLogin

  constructor(private readonly dependencias: DependenciasDoLoginPorMatricula) {
    this.#duracao = new DuracaoDoLogin(dependencias.medidor, 'matricula')
  }

  entrar(pedido: PedidoLoginMatricula, origem: OrigemDaRequisicao): Promise<ResultadoDoLogin> {
    return this.#duracao.medir(() => this.#entrar(pedido, origem))
  }

  async #entrar(pedido: PedidoLoginMatricula, origem: OrigemDaRequisicao): Promise<ResultadoDoLogin> {
    const escolaId = await this.#escolaDoSlug(pedido.slug)
    if (escolaId === undefined) return this.#recusar(ESCOLA_DESCONHECIDA, pedido, origem)
    return naEscolaSemUsuario(escolaId, async () => {
      const { banco, conferencia, contador, conclusao, rebaixamento } = this.dependencias
      const { chave, identificador, conhecido } = this.#chave(escolaId, pedido.matricula, origem)
      const rebaixado = (await rebaixamento.rebaixar(origem.ip, escolaId, conhecido)) || (!conhecido && origem.acimaDoLimiteDoIp === true)
      const tentativa: TentativaDeSenha<CredencialDoAluno> = {
        balde: baldeDaEscola(escolaId, rebaixado),
        chave,
        senha: pedido.senha,
        lerCredencial: () => new CredencialMatriculaRepository(banco).doAlunoAtivo(pedido.matricula),
        aoFalhar: () => rebaixamento.contarFalha(origem.ip, escolaId),
      }
      const { reserva, credencial, confere } = await conferencia.conferir(tentativa)
      if (credencial === undefined || !confere) {
        await new RegistroDeAcessoRepository(banco).gravarFalha(ipParaRegistro(origem.ip))
        return conferencia.recusar(tentativa, reserva)
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
    const { conferencia } = this.dependencias
    const tentativa: TentativaDeSenha<undefined> = {
      // O IP acima do limite por IP do login também vai para o fim deste balde, que não tem conta de verdade.
      balde: baldeDaEscolaDesconhecida(origem.acimaDoLimiteDoIp === true),
      chave: this.#chave(escolaId, pedido.matricula, origem).chave,
      senha: pedido.senha,
      lerCredencial: () => Promise.resolve(undefined),
    }
    const { reserva } = await conferencia.conferir(tentativa)
    return conferencia.recusar(tentativa, reserva)
  }

  #chave(escolaId: string, matricula: string, origem: OrigemDaRequisicao): ChaveDaTentativa {
    const { contador, dispositivo } = this.dependencias
    const identificador = identificadorDoAluno(escolaId, matricula)
    const conhecido = dispositivo.conhece(lerCookie(origem.cabecalhoCookie, COOKIE_DISPOSITIVO), identificador)
    return { chave: contador.chaveDe(identificador, conhecido ? 'conhecido' : 'outro'), identificador, conhecido }
  }
}
