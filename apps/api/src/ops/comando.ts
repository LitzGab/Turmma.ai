import { criarBanco, criarPool, FORMATO_OPERADOR, validarAmbiente, type Banco } from '@educa/nucleo'
import { z } from 'zod'
import { urlDoBancoDeOperacao } from './uso.js'

/**
 * O que os comandos do operador (`ops:escola`, `ops:redefinir-mfa`) têm em comum: o erro de argumento, que cita só a
 * opção e nunca o valor; o `OPERADOR` que vai para a auditoria; a saída do terminal; e o banco de operação, com uma
 * conexão só.
 */

export class ArgumentoInvalido extends Error {
  constructor(readonly opcao: string) {
    super(`Opção inválida ou ausente: ${opcao}`)
    this.name = 'ArgumentoInvalido'
  }
}

const esquemaAmbienteOperador = z.object({ OPERADOR: z.string().regex(FORMATO_OPERADOR) })

/** Quem da equipe roda o comando. Ausente ou fora do formato, recusa pelo nome da variável, sem o valor. */
export function lerOperador(ambiente: Record<string, string | undefined>): string {
  return validarAmbiente(esquemaAmbienteOperador, ambiente).OPERADOR
}

export interface SaidaDoComando {
  saida: (texto: string) => void
  erro: (texto: string) => void
}

export interface BancoDoComando {
  banco: Banco
  fechar: () => Promise<void>
}

export function abrirBancoDeOperacao(ambiente: Record<string, string | undefined>): BancoDoComando {
  const pool = criarPool({ ...urlDoBancoDeOperacao(ambiente), maximoConexoes: 1 }, () => undefined)
  return { banco: criarBanco(pool), fechar: () => pool.end() }
}
