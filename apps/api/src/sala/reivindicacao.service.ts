import { ErroDeDominio, erroDoPostgresEm, type Banco } from '@educa/nucleo'
import { CodigoDeErro, esquemaRespostaReivindicacao, type PedidoReivindicarSala, type RespostaReivindicacao } from '@educa/shared'
import type { AcessoDaSala } from '../sessao/acesso-da-sala.js'
import type { HashDeSenha } from '../sessao/hash-de-senha.js'
import { baldeDaEscola } from '../sessao/senha/baldes-de-login.js'
import type { SemaforoDeHash } from '../sessao/senha/semaforo-de-hash.js'
import { ListaLivreRepository } from './lista-livre.repository.js'
import { ReivindicacaoRepository } from './reivindicacao.repository.js'
import { entradaDaSala } from './entrada-da-sala.js'

export interface DependenciasDaReivindicacao {
  readonly banco: Banco
  readonly acessoDaSala: Pick<AcessoDaSala, 'naSala'>
  /** O semáforo do hash do login, um só por instância: o teto que ele guarda é o das threads do processo. */
  readonly semaforo: Pick<SemaforoDeHash, 'executar'>
  readonly hash: Pick<HashDeSenha, 'gerar'>
  readonly chaveCodigo: Uint8Array
}

/**
 * Os SQLSTATE que fazem a gravação voltar atrás e reler a chave: `foreign_key_violation` (o nome de outra escola ou
 * inexistente, ou que saiu da lista no meio) e `unique_violation` (o nome que já tem pendente, ou a chave já gravada).
 * Nunca se lê qual restrição foi (Tech Spec da A1, seção 5, passo 4).
 */
const VOLTA_E_RELE = new Set(['23503', '23505'])

/** O `update` da `lista_nome` não achou o nome: a transação volta atrás, como no 23505. */
class NomeNaoTomado extends Error {}

const ENVIADO: RespostaReivindicacao = esquemaRespostaReivindicacao.parse({ resultado: 'enviado' })

/**
 * A reivindicação do nome pela página pública da sala (A1, tarefa 6.0, RF10 e RF11; Tech Spec da A1, seção 5, passo 4).
 * Sem login: a escola, o ano e a turma saem do acesso vigente que o `AcessoDaSala` achou pelo slug e pelo link ou pelo
 * código, e nada deles vem do cliente. Não lê cookie, não grava registro de acesso nem auditoria (a decisão, 8.0, grava),
 * e nada disto loga: a matrícula, a senha, a chave e o nome nunca vão a log.
 *
 * 1. **A chave já gravada** num pedido da escola, do ano e da turma do acesso: é o reenvio, e responde `enviado`, sem hash
 *    e sem pedido novo (E21).
 * 2. **O hash, sempre**: argon2id no `SemaforoDeHash`, no balde da escola, fora da transação e sem conexão presa (L9), em
 *    todo pedido que passou da chave, com a matrícula certa ou não, com o nome tomado ou inexistente (R3): rodar o hash
 *    só quando a matrícula bate diria, pelo tempo, qual dos dois errou. O 503 do prazo do semáforo sai daqui, sem gravar.
 * 3. **A transação**: o `insert` do pedido e, **depois**, o `update` condicional da `lista_nome` (id, escola, ano, turma,
 *    `livre` e matrícula). As duas escritas voltam juntas (E23).
 * 4. **FK violada, qualquer 23505 ou `update` sem linha**: a transação volta atrás, e um comando novo relê a chave na
 *    escola e na turma do acesso. Achou, foi o mesmo envio que gravou antes, ao mesmo tempo (C2): `enviado`. Não achou:
 *    `REIVINDICACAO_RECUSADA`, a mesma resposta para o nome inexistente, de outra turma, escola ou ano, tomado ou com a
 *    matrícula errada (R2), sem gravar nada. O nome da restrição nunca é lido: a ordem dos índices não muda a resposta.
 *
 * Os limites da sala (7.0) e o `for share` no ano (10.0) entram nas tarefas deles.
 */
export class ReivindicacaoService {
  constructor(private readonly dependencias: DependenciasDaReivindicacao) {}

  /** `POST /v1/salas/reivindicar`: o pedido fica pendente e o nome sai da lista, ou a recusa única. */
  async reivindicar(pedido: PedidoReivindicarSala): Promise<RespostaReivindicacao> {
    const { banco, acessoDaSala, semaforo, hash, chaveCodigo } = this.dependencias
    const { listaNomeId, matricula, senha, chaveEnvio } = pedido
    return acessoDaSala.naSala(entradaDaSala(pedido, chaveCodigo), async ({ escolaId, turmaId }) => {
      const pedidos = new ReivindicacaoRepository(banco)
      if (await pedidos.chaveGravada(turmaId, chaveEnvio)) return ENVIADO
      const senhaHash = await semaforo.executar(baldeDaEscola(escolaId), () => hash.gerar(senha))
      try {
        await banco.transaction(async (tx) => {
          await new ReivindicacaoRepository(tx).inserirPendente({ turmaId, listaNomeId, chaveEnvio, senhaHash })
          if (!(await new ListaLivreRepository(tx).tomar({ turmaId, listaNomeId, matricula }))) throw new NomeNaoTomado()
        })
      } catch (erro) {
        if (!(erro instanceof NomeNaoTomado) && !VOLTA_E_RELE.has(erroDoPostgresEm(erro)?.code ?? '')) throw erro
        if (await pedidos.chaveGravada(turmaId, chaveEnvio)) return ENVIADO
        throw new ErroDeDominio(CodigoDeErro.REIVINDICACAO_RECUSADA)
      }
      return ENVIADO
    })
  }
}
