import { ErroDeDominio, inatividadeDoPapel } from '@educa/nucleo'
import { CodigoDeErro, esquemaRespostaEu, type RespostaEu } from '@educa/shared'
import type { EuRepository } from './eu.repository.js'
import type { ResolucaoDeTenantRepository } from './resolucao-de-tenant.repository.js'

/**
 * Quem está na sessão, no contrato de `GET /v1/eu`: a inatividade é a do papel na escola da sessão, e `acessos`, os
 * usuários ativos de equipe da conta dela (12.0), com o nome da escola e o papel, para o seletor. A conta vem do
 * usuário da sessão, nunca do cliente; o aluno não tem conta, e os acessos dele vêm vazios.
 */
export class EuService {
  constructor(
    private readonly eu: EuRepository,
    private readonly resolucao: ResolucaoDeTenantRepository,
  ) {}

  async obter(): Promise<RespostaEu> {
    const linha = await this.eu.doContexto()
    // A guarda acabou de ler este usuário ativo; sumir entre as duas leituras é o mesmo que não estar autenticado.
    if (linha === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
    const acessos = linha.contaId === null ? [] : await this.resolucao.acessosDaConta(linha.contaId)
    return esquemaRespostaEu.parse({
      usuarioId: linha.usuarioId,
      papel: linha.papel,
      nome: linha.nome,
      escola: linha.escola,
      inatividadeMin: inatividadeDoPapel(linha),
      acessos: acessos.map(({ usuarioId, escolaNome, papel }) => ({ usuarioId, escolaNome, papel })),
    })
  }
}
