import { ErroDeDominio, FORMATO_SLUG, TAMANHO_MAXIMO_SLUG, type Banco, type ProvedorExterno } from '@educa/nucleo'
import { CodigoDeErro, PROVEDORES_DE_CONTA_DA_ESCOLA, type RespostaAcessoDaEscola } from '@educa/shared'
import { AcessoDaEscolaRepository } from './acesso-publico.repository.js'
import { naEscolaSemUsuario } from './escola-sem-usuario.js'
import type { ResolucaoDeTenantRepository } from './resolucao-de-tenant.repository.js'

/**
 * `GET /v1/escolas/:slug/acesso` (tarefa 11.0): o nome da escola do endereço e os provedores de conta que ela liberou.
 * O slug é público (é o endereço), e por isso slug inexistente responde `NAO_ENCONTRADO`; fora do formato também, sem
 * ir ao banco. Nunca devolve domínio nem tenant: só o tipo do provedor (13.0), e só dos provedores que a escola liberou
 * e que a configuração ligou: um botão que não pode funcionar não aparece.
 */
export class AcessoDaEscolaService {
  constructor(
    private readonly banco: Banco,
    private readonly resolucao: ResolucaoDeTenantRepository,
    private readonly ligados: readonly ProvedorExterno[],
  ) {}

  async ler(slug: string): Promise<RespostaAcessoDaEscola> {
    if (slug.length > TAMANHO_MAXIMO_SLUG || !FORMATO_SLUG.test(slug)) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    const escolaId = await this.resolucao.escolaPorSlug(slug)
    if (escolaId === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    const lido = await naEscolaSemUsuario(escolaId, async () => {
      const repositorio = new AcessoDaEscolaRepository(this.banco)
      return { nome: await repositorio.nome(), liberados: await repositorio.provedoresLiberados() }
    })
    if (lido.nome === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    // Na ordem fixa do contrato, para a resposta não depender da ordem do banco.
    const provedores = PROVEDORES_DE_CONTA_DA_ESCOLA.filter((provedor) => lido.liberados.includes(provedor) && this.ligados.includes(provedor))
    return { nome: lido.nome, provedores }
  }
}
