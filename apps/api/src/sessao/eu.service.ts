import { ErroDeDominio, inatividadeDoPapel } from '@educa/nucleo'
import { CodigoDeErro, esquemaRespostaEu, type RespostaEu } from '@educa/shared'
import type { EuRepository } from './eu.repository.js'

/** Quem está na sessão, no contrato de `GET /v1/eu`: a inatividade é a do papel na escola da sessão. */
export class EuService {
  constructor(private readonly eu: EuRepository) {}

  async obter(): Promise<RespostaEu> {
    const linha = await this.eu.doContexto()
    // A guarda acabou de ler este usuário ativo; sumir entre as duas leituras é o mesmo que não estar autenticado.
    if (linha === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
    return esquemaRespostaEu.parse({
      usuarioId: linha.usuarioId,
      papel: linha.papel,
      nome: linha.nome,
      escola: linha.escola,
      inatividadeMin: inatividadeDoPapel(linha),
    })
  }
}
