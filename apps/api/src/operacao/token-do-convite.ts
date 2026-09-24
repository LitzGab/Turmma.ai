import { createHash, randomBytes } from 'node:crypto'

/** Bytes do token do convite de operador: 256 bits sorteados. O banco guarda só o SHA-256; o valor vai para o arquivo. */
const BYTES_DO_TOKEN = 32

/** Um token novo, em base64url, para o link do convite de operador. */
export function sortearTokenDeConvite(): string {
  return randomBytes(BYTES_DO_TOKEN).toString('base64url')
}

/** O SHA-256 do token, em hex: é o que `convite_operador.token_hash` guarda e o aceite (tarefa 5.0) procura. */
export function hashDoTokenDeConvite(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
