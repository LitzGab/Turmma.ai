import { ErroDeDominio } from '@educa/nucleo'
import { CodigoDeErro } from '@educa/shared'
import { naEscolaSemUsuario } from './escola-sem-usuario.js'
import type { AcessoDaSalaAchado, ResolucaoDeTenantRepository } from './resolucao-de-tenant.repository.js'

/**
 * Como a página pública chegou: o slug do endereço e o SHA-256 do token do link, ou o HMAC do código digitado. Quem
 * chama calcula o hash e o HMAC (o `sala` tem a chave do código); nada aqui recebe escola, ano ou turma.
 */
export type EntradaDaSala = { readonly slug: string; readonly tokenHash: string } | { readonly slug: string; readonly codigoHmac: string }

/**
 * A porta do `sala` para a resolução de tenant (A1, tarefa 5.0; Tech Spec da A1, seção 6): a rota pública da sala não
 * tem sessão, e a escola, o ano e a turma saem do acesso vigente achado pelo link ou pelo código, na escola do slug e no
 * ano em curso dela, pela `ResolucaoDeTenantRepository`, que só o `sessao` alcança (I1). O `sala` importa só isto.
 *
 * Acesso inexistente, vencido, revogado, de ano encerrado, de turma excluída, de outra escola ou slug inexistente dão o
 * mesmo `NAO_ENCONTRADO` (regra 10, item 6).
 */
export class AcessoDaSala {
  constructor(private readonly resolucao: ResolucaoDeTenantRepository) {}

  /**
   * Resolve a sala e roda `funcao` no contexto da escola e do ano dela, sem usuário: os repositories do `sala` leem o
   * escopo dali (regra 10, item 3), e a requisição continua com o mesmo `requisicaoId`.
   */
  async naSala<T>(entrada: EntradaDaSala, funcao: (sala: AcessoDaSalaAchado) => Promise<T>): Promise<T> {
    const sala =
      'tokenHash' in entrada
        ? await this.resolucao.acessoDaSalaPorToken(entrada.slug, entrada.tokenHash)
        : await this.resolucao.acessoDaSalaPorCodigo(entrada.slug, entrada.codigoHmac)
    if (sala === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    return naEscolaSemUsuario({ escolaId: sala.escolaId, anoLetivoId: sala.anoLetivoId }, () => funcao(sala))
  }
}
