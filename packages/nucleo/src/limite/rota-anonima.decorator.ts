import { SetMetadata, type CustomDecorator } from '@nestjs/common'

export const METADADO_ROTA_ANONIMA = 'educa:rota-anonima'
export const METADADO_SEM_LIMITE = 'educa:sem-limite'

/**
 * Marca a rota, ou o controller inteiro, como acessível sem token. Toda outra rota exige token:
 * endpoint novo que esquece a marcação nasce fechado, não aberto.
 *
 * Sem token não há usuário nem escola, e a rota anônima é a única limitada por IP (`rl:ip:{ip}`),
 * com teto que comporta uma escola inteira atrás de um NAT (regra 80, item 1).
 */
export function RotaAnonima(): CustomDecorator<string> {
  return SetMetadata(METADADO_ROTA_ANONIMA, true)
}

/**
 * Tira a rota do rate limit. Só para a sonda da borda (`/prontidao`): ela não sai pela borda, não
 * consulta dependência, e um 429 nela tiraria as duas instâncias do balanceamento de uma vez.
 * Rota de cliente nunca leva esta marcação.
 */
export function SemLimite(): CustomDecorator<string> {
  return SetMetadata(METADADO_SEM_LIMITE, true)
}
