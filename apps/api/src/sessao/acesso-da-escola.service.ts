import { ErroDeDominio, FORMATO_SLUG, TAMANHO_MAXIMO_SLUG, type Banco } from '@educa/nucleo'
import { CodigoDeErro, type RespostaAcessoDaEscola } from '@educa/shared'
import { AcessoDaEscolaRepository } from './acesso-publico.repository.js'
import { naEscolaSemUsuario } from './escola-sem-usuario.js'
import type { ResolucaoDeTenantRepository } from './resolucao-de-tenant.repository.js'

/**
 * `GET /v1/escolas/:slug/acesso` (tarefa 11.0): o nome da escola do endereço e os provedores de conta que ela liberou.
 * O slug é público (é o endereço), e por isso slug inexistente responde `NAO_ENCONTRADO`; fora do formato também, sem
 * ir ao banco. Nunca devolve domínio nem tenant: só o tipo do provedor. Até a 13.0, a lista vem vazia.
 */
export class AcessoDaEscolaService {
  constructor(
    private readonly banco: Banco,
    private readonly resolucao: ResolucaoDeTenantRepository,
  ) {}

  async ler(slug: string): Promise<RespostaAcessoDaEscola> {
    if (slug.length > TAMANHO_MAXIMO_SLUG || !FORMATO_SLUG.test(slug)) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    const escolaId = await this.resolucao.escolaPorSlug(slug)
    if (escolaId === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    const nome = await naEscolaSemUsuario(escolaId, () => new AcessoDaEscolaRepository(this.banco).nome())
    if (nome === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    return { nome, provedores: [] }
  }
}
